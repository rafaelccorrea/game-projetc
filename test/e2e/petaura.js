'use strict';
/* TESTE DA AURA DO PET POR ESTÁGIO (js/petfx.js: drawPetAura), sem navegador. Rodar: node test/e2e/petaura.js [-v]
   Sandbox do jogo com o canvas que grava a ORDEM dos drawImage. Para cada pet escolhido confere, nos 3 estágios:
     - o Sys.pet diz a aura do estágio (PET_BATTLE) e o arquivo dela existe em assets/anim/aura (png + json);
     - estágio COM aura: a folha da aura é desenhada UMA vez, ANTES do corpo do pet (fica atrás dele), e o pet continua sendo o último desenho;
     - estágio SEM aura: nenhuma folha de aura é desenhada;
     - a caixa da aura (petAuraBox) tem a base nos pés do pet, é mais larga que o pet e cabe na tela;
     - ?debug=1&petaura=0 (comparação) é só uma chave: PET_AURA_ON existe e está ligada sem o parâmetro.
   Só lê arquivos do jogo, nunca grava. Sai com código 1 se algo falhar. */
const VERBOSE = process.argv.includes('-v');
const fs = require('fs'), path = require('path');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, n = 0;
const check = (name, ok, det) => { n++; if (!ok) fail++; if (VERBOSE || !ok) console.log('  ' + (ok ? 'ok    ' : 'FALHA ') + name + (det && (!ok || VERBOSE) ? ' · ' + det : '')); };
const RE = { pet: /anim\/pets\//, aura: /anim\/aura\// };
(async () => {
  const loadErr = [], G = boot({ realFetch: true, draw: true, runBoot: true, search: '?debug=1&fresh=1', add: (g, nm, ok, e) => { if (!ok) loadErr.push(nm + ': ' + e); } }), { ev } = G;
  check('jogo carregou', !loadErr.length, loadErr.slice(0, 3).join(' | '));
  const errs = [];
  const tick = async () => { try { G.inCtx(() => ev('draw')()); } catch (e) { const s = errStr(e); if (!errs.includes(s)) errs.push(s); } try { G.inCtx(() => G.advance(40)); } catch (e) {} await new Promise(r => setImmediate(r)); };
  const until = async (cond, max) => { for (let i = 0; i < max; i++) { let ok = false; try { ok = !!cond(); } catch (e) {} if (ok) return true; await tick(); } try { return !!cond(); } catch (e) { return false; } };
  const battleList = () => { const L = []; G.setDrawTap(s => L.push(s)); try { G.inCtx(() => ev('draw')()); } catch (e) { errs.push('draw: ' + errStr(e)); } G.setDrawTap(null); return L; };
  await until(() => ev("typeof PI!=='undefined'&&!!PI.el"), 40); try { if (ev("typeof PI!=='undefined'&&!!PI.el")) G.inCtx(() => ev('PI.finish()')); } catch (e) {}
  check('chave: PET_AURA_ON ligada sem o parâmetro de comparação', ev("typeof PET_AURA_ON!=='undefined'&&PET_AURA_ON===true&&typeof drawPetAura==='function'&&typeof petAuraBox==='function'"));
  ev(`(function(){ S.tut=99; S.welcome=true; const L=Sys.level.ensure(S); L.lvl=90; L.xp=0; S.stage=3; S.best=12; S.wave=1; S.farm=false;
    Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); try{ Sys.mount.ensure(S).eq=null; }catch(e){}
    B.paused=false; B.res=null; view='battle'; startBattle(); HATCH.q.length=0; HATCH.cur=null; return 1; })()`);
  /* pets de teste: o mamute (aura só no evoluído), o dragão (aura no médio e no evoluído) e o papagaio (voa) */
  const want = ['era0_mammoth', 'era2_dragon', 'era3_parrot']; let seen = 0, withAura = 0, without = 0;
  for (const sprite of want) {
    const id = ev(`(function(){ const d=Sys.pet.DATA.pets.find(p=>p.sprite==='${sprite}'); return d?d.id:null; })()`);
    check(sprite + ': existe no Sys.pet', !!id); if (!id) continue;
    for (let stg = 1; stg <= 3; stg++) {
      const info = ev(`(function(){ const o=Sys.pet.ensure(S), st=Sys.pet.DATA.v3d.stages; o.owned={}; o.owned['${id}']={stars:5,lvl:st[${stg - 1}].from,stg:${stg - 1},frags:0,food:0}; o.eq='${id}'; Sys.pet.ensure(S);
        HATCH.q.length=0; HATCH.cur=null; PETK.infoT=0; PETK.base=''; const i=Sys.pet.battleInfo(S,Sys.host); return i&&i.draw?{stage:i.stage,base:i.draw.base,aura:i.draw.aura?i.draw.aura.sheet:null}:null; })()`);
      const tag = sprite + ' estágio ' + stg;
      check(tag + ': o módulo informa o desenho', !!info && info.stage === stg, JSON.stringify(info)); if (!info) continue; seen++;
      if (info.aura) { check(tag + ': arquivo da aura existe (png + json)', fs.existsSync(path.join(G.ROOT, info.aura + '.png')) && fs.existsSync(path.join(G.ROOT, info.aura + '.json')), info.aura); }
      const ready = await until(() => ev(`(function(){ HATCH.q.length=0; HATCH.cur=null; PETK.infoT=0; const I=petInfo(); if(!I||I.draw.base!=='${info.base}'||!petReady(PETK.base)) return false; ${info.aura ? `return sheetLoad('${info.aura}',true).ok;` : 'return true;'} })()`), 500);
      check(tag + ': folhas prontas', ready); if (!ready) continue;
      const L = battleList(), ia = L.map((s, i) => RE.aura.test(s) ? i : -1).filter(i => i >= 0), ip = L.map((s, i) => RE.pet.test(s) ? i : -1).filter(i => i >= 0);
      check(tag + ': o pet foi desenhado', ip.length >= 1, L.length + ' desenhos');
      if (info.aura) { withAura++;
        const mine = ia.filter(i => L[i].indexOf(info.aura.replace(/^.*\//, '')) >= 0);
        check(tag + ': aura desenhada uma vez', mine.length === 1, 'vezes: ' + mine.length + ' · ' + info.aura);
        check(tag + ': aura ANTES do corpo do pet (fica atrás)', mine.length === 1 && ip.length >= 1 && mine[0] < ip[0], 'aura ' + mine[0] + ' · pet ' + ip[0]);
        check(tag + ': o pet continua sendo o último desenho da cena do herói', ip.length >= 1 && ip[ip.length - 1] > (mine[0] || 0));
        const b = ev(`(function(){ const I=petInfo(), p=petPos(), T=petTbl(), fly=I.draw.fly?heroBodyH()*T.fly:0, k=petK(), q=petAuraBox(I,p.x,p.gy-fly,k), m=petMetric(PETK.base); return q?{x:q.x,y:q.y,w:q.w,h:q.h,base:p.gy-fly,pw:(m.l+m.r)*k,LW:LW,frames:q.M.frames,fi:q.fi}:null; })()`);
        check(tag + ': caixa da aura com a base nos pés do pet', !!b && Math.abs((b.y + b.h) - b.base) <= 6, JSON.stringify(b));
        check(tag + ': aura mais larga que o pet e dentro da tela', !!b && b.w > b.pw && b.w < b.pw * 2 && b.x + b.w > 0 && b.x < b.LW, JSON.stringify(b));
        check(tag + ': quadro da aura válido', !!b && b.fi >= 0 && b.fi < b.frames, JSON.stringify(b));
      } else { without++; check(tag + ': sem aura neste estágio (nenhuma folha de aura no desenho do pet)', ia.filter(i => ip.length && i > ip[0] - 3 && i < ip[0]).length === 0, 'auras: ' + ia.map(i => L[i]).join(', ')); }
    }
  }
  check('cobriu estágios com e sem aura', withAura >= 3 && without >= 2, 'com ' + withAura + ' · sem ' + without + ' · vistos ' + seen);
  /* GOLPE PRÓPRIO DO PET (petHitFx): todo tipo que o Sys.pet declara tem receita; cada um solta partículas e anel na COR do pet; tipo desconhecido cai no impacto;
     sem draw.fx vale o estouro azul de antes; o crítico acrescenta o anel dourado */
  { const kinds = ev("(function(){ const B0=Sys.pet.battleTable(), s={}; for(const k in B0) s[B0[k].fx.hit]=1; return Object.keys(s); })()"), have = ev('Object.keys(PET_HIT)');
    check('golpe do pet: todo tipo do módulo tem receita (' + kinds.join(', ') + ')', kinds.every(k => have.includes(k)), 'sem receita: ' + kinds.filter(k => !have.includes(k)).join(', '));
    for (const k of have.concat(['tipo_que_nao_existe'])) { const r = ev("(function(){ B.parts.length=0; B.rings.length=0; const I={draw:{fx:{color:'#12ab34',hit:'" + k + "',glow:1}}}; const got=petHitFx(I,200,150,false); const cols={}; for(const p of B.parts) cols[p.col]=1; const rc=B.rings.map(q=>q.col); return {got, parts:B.parts.length, rings:B.rings.length, mine:!!cols['#12ab34']||rc.includes('#12ab34'), ringMine:rc.includes('#12ab34'), gold:rc.includes('#ffd23f'), nan:B.parts.some(p=>!isFinite(p.x)||!isFinite(p.y))||B.rings.some(q=>!isFinite(q.x)||!isFinite(q.y)||!(q.max>0))}; })()");
      check('golpe ' + k + ': partículas e anel na cor do pet, sem coordenada inválida', r.parts >= 4 && r.rings >= 1 && r.mine && !r.nan && !r.gold && r.got === (have.includes(k) ? k : 'impact'), JSON.stringify(r)); }
    const crit = ev("(function(){ B.parts.length=0; B.rings.length=0; petHitFx({draw:{fx:{color:'#12ab34',hit:'fire'}}},200,150,true); return B.rings.map(q=>q.col); })()"); check('golpe crítico: anel dourado por cima', crit.includes('#ffd23f') && crit.includes('#12ab34'), crit.join(','));
    const old = ev("(function(){ B.parts.length=0; B.rings.length=0; const g=petHitFx({draw:{}},200,150,false); return {g, ring:B.rings.map(q=>q.col), n:B.parts.length}; })()"); check('sem draw.fx: estouro azul de antes', old.g === 'antigo' && old.ring.length === 1 && old.ring[0] === '#9af0ff' && old.n >= 1, JSON.stringify(old));
    ev('B.parts.length=0; B.rings.length=0; 1'); }
  check('nenhuma exceção no desenho', !errs.length, errs.slice(0, 3).join(' | '));
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (aura do pet)' : 'AURA DO PET OK (' + n + ' verificações): aura do estágio atrás do pet, base nos pés, sem aura onde o módulo não dá');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(errStr ? errStr(e) : e); process.exit(1); });
