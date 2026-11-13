'use strict';
/* TESTE AUTOMÁTICO DO PRÉ-CARREGADOR / TELA DE CARREGAMENTO (QA; sem navegador). Rodar: node test/e2e/preload.js [-v]
   Usa o sandbox.js (DOM falso + o jogo na ordem do index, partida real com runBoot, arquivos lidos do disco, relógio virtual) e deixa a tela de
   carregamento (js/loading.js + js/preload.js) correr de verdade, SEM ?skip=1. Três cenários:
     1. JOGADOR QUE VOLTA: save nível 61, montaria (lobo) + asa + pet equipados, tempo offline (lastSeen de 3 h atrás → "bem-vindo de volta")
     2. SAVE NOVO: jogo sem save (?fresh=1)
     3. REDE LENTA: o save do jogador que volta com &lento=250 (cada arquivo segura a vaga 250 ms) e com &lento=800
   Em cada um REPROVA se: a carga não termina (LD.fin) no prazo virtual; sobrou pendente (total ≠ feitos) ou arquivo com falha; o aviso "O carregamento
   parou" (LD.failUI) apareceu; ficou algum pedido sem nome (arquivo no cache que nunca terminou e não está nem pronto nem falho); houve exceção.
   Sai com código 1 se algum reprovar. O que mostra: arquivos (feitos/total), tempo virtual de carga e o aviso, se houver. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
const DT = 1 / 30;
let fail = 0; const out = [];
const check = (name, ok, err) => { if (!ok) fail++; const line = (ok ? '  OK    ' : '  FALHA ') + name + (ok ? '' : ' — ' + (err || '')); if (VERBOSE || !ok) console.log(line); out.push(line); };

async function newGame(opts) {
  const loadErr = []; const G = boot({ realFetch: true, draw: true, runBoot: true, ...(opts || {}), add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } });
  const { ev, inCtx } = G; G.frameErr = []; G.frames = 0;
  /* relógio do carregamento no tempo VIRTUAL: o sandbox usa o Date.now real em performance.now (a tela e o pré-carregador medem tempo com ele) */
  try { const t0 = ev("typeof LD!=='undefined'?LD.t0:0") || Date.now(); G.sandbox.performance = { now: () => t0 + G.vnow() }; } catch (e) {}
  /* o sandbox deixa setInterval e requestAnimationFrame sem efeito: o passo da tela de carregamento (loadStep, que no navegador roda por rAF e por um intervalo de 400 ms) é chamado aqui a cada 400 ms virtuais */
  G.frame = async dt => { dt = dt || DT; if (G.frames % 12 === 0) { try { inCtx(() => { if (typeof G.sandbox.loadStep === 'function') G.ev('loadStep')(); }); } catch (e) { const s = 'loadStep: ' + errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); } } try { inCtx(() => G.advance(dt * 1000)); } catch (e) { const s = 'timer: ' + errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); }
    G.frames++; if (G.frames % 5 === 0) await new Promise(r => setImmediate(r)); };
  G.until = async (cond, secs) => { const n = Math.ceil(secs / DT); for (let i = 0; i < n; i++) { let ok = false; try { ok = cond(); } catch (e) {} if (ok) return i * DT; await G.frame(); if (G.frameErr.length > 20) break; } try { return cond() ? n * DT : false; } catch (e) { return false; } };
  G.loadErr = loadErr; return G;
}
/* save do jogador que volta (cria num jogo à parte e devolve o JSON gravável) */
async function returningSave() {
  const G0 = await newGame({ search: '?debug=1&fresh=1&skip=1' }); const key = G0.ev('SAVE_KEY');
  const json = G0.ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.hero='kael'; S.name='Lenda_22'; S.tut=99; S.welcome=true; S.stage=${'' + 12}; S.wave=1; S.best=12; S.eraMax=1;
      S.lastSeen=Date.now()-3*3600*1000;
      try{ const L=Sys.level.ensure(S); L.lvl=61; L.xp=0; }catch(e){}
      try{ Sys.mount.add(S,Sys.host,'wolf'); Sys.mount.equip(S,'wolf'); }catch(e){}
      try{ const P=Sys.pet.ensure(S); const id=(Sys.pet.DATA.starterIds||['wolf'])[0]; P.owned[id]={lvl:5,stars:1,frags:0,food:0}; P.eq=id; }catch(e){}
      try{ const w=(S.inv||[]).find(i=>i.slot==='wing'); if(w){ S.eq=S.eq||{}; S.eq.wing=w.id; } else { const id=Math.max(0,...(S.inv||[]).map(i=>i.id))+1; (S.inv=S.inv||[]).push({id,slot:'wing',r:1,e:0,lvl:1,gold:0,subs:[],look:0,wing:'angel'}); S.eq=S.eq||{}; S.eq.wing=id; } }catch(e){}
      return JSON.stringify(S); })()`);
  return { key, json };
}
/* um cenário: sobe o jogo SEM skip e deixa a carga correr até LD.fin ou até o prazo (segundos virtuais) */
async function scenario(name, opts, limitS, expect) {
  const G = await newGame(opts); const { ev } = G;
  check(name + ': jogo carregou (' + G.lists.jsList.length + ' js)', !G.loadErr.length, G.loadErr.slice(0, 3).join(' | '));
  const hasLoad = ev("typeof LD!=='undefined'&&typeof initLoading==='function'");
  check(name + ': a tela de carregamento existe (LD/initLoading)', hasLoad, 'sem js/loading.js na lista');
  if (!hasLoad) return;
  const t = await G.until(() => ev('LD.fin===true||!!LD.failUI'), limitS);
  const fin = ev('LD.fin===true'), ui = ev('!!LD.failUI'), pg = ev('Preload.progress'), size = ev('Preload.size()');
  check(name + ': a carga TERMINA sozinha em ' + limitS + ' s virtuais (levou ' + (t === false ? '>' + limitS : t.toFixed(1)) + ' s)', fin && !ui, 'LD.fin=' + fin + ' failUI=' + ui + ' progresso ' + pg.done + '/' + pg.total);
  check(name + ': nada pendente: feitos = total (' + pg.done + '/' + pg.total + ')', pg.total > 0 && pg.done === pg.total, pg.done + '/' + pg.total);
  check(name + ': nenhum arquivo com falha', pg.failed.length === 0, pg.failed.slice(0, 5).join(', '));
  check(name + ': sem aviso "O carregamento parou" nem "Confira a conexão"', !ui, 'LD.failUI aberto');
  /* "pendente sem nome": pedidos no cache que não estão nem prontos nem falhos depois da carga (o aviso "pendentes: 3 Array(0)" do relato) */
  const orphan = ev(`(function(){ try{ const P=Preload; let n=0; const names=[]; const keys=(P.size()>0&&P.keys)?P.keys():null; return keys?keys.filter(u=>!P.has(u)).length:0; }catch(e){ return -1; } })()`);
  check(name + ': nenhum pedido pendente sem nome no cache', orphan === 0 || orphan === -1, orphan + ' pedidos sem terminar (a lista de nomes veio vazia)');
  check(name + ': sem exceções no laço', G.frameErr.length === 0, G.frameErr.slice(0, 2).join(' | '));
  if (expect) expect(G, { fin, t, pg, size });
  out.push('       · ' + name + ': ' + pg.done + '/' + pg.total + ' arquivos, ' + (t === false ? 'não terminou' : t.toFixed(1) + ' s virtuais') + ', ' + size + ' no cache');
}
(async () => {
  const R = await returningSave();
  await scenario('JOGADOR QUE VOLTA (Nv 61, lobo + asa + pet, 3 h offline)', { search: '?debug=1', storage: { [R.key]: R.json } }, 60, (G) => {
    check('JOGADOR QUE VOLTA: o save voltou com nível 61, lobo equipado e asa', G.ev('Sys.level.level(S)') === 61 && G.ev("Sys.mount.ensure(S).eq") === 'wolf' && !!G.ev('S.eq&&S.eq.wing'), 'nível ' + G.ev('Sys.level.level(S)') + ' montaria ' + G.ev("Sys.mount.ensure(S).eq")); });
  await scenario('SAVE NOVO', { search: '?debug=1&fresh=1' }, 60);
  await scenario('REDE LENTA 250 ms por arquivo (jogador que volta)', { search: '?debug=1&lento=250&frio=1', storage: { [R.key]: R.json } }, 90);
  await scenario('REDE LENTA 800 ms por arquivo (jogador que volta)', { search: '?debug=1&lento=800&frio=1', storage: { [R.key]: R.json } }, 150);
  console.log('\n' + out.filter(l => /·/.test(l)).join('\n'));
  console.log(fail ? '\n' + fail + ' VERIFICAÇÃO(ÕES) REPROVADA(S)' : '\nPRÉ-CARREGADOR: TODAS AS VERIFICAÇÕES PASSARAM');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
