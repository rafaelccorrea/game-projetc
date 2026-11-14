'use strict';
/* _cal.js (Sistemas, 14/11): CÓPIA do test/e2e/diff.js do Engenheiro (9e0e274, arma da era) com a medida de CALIBRAÇÃO 'cal' (não é teste; não rodar no conjunto).
   Uso: CAL='{...campos de dificuldade.boss}' node test/e2e/_cal.js --medida=cal:<eras>/<n>:eras9 → vitórias com 100% e 90% (arma da era), tempo de cada luta.
   Se o diff.js mudar, refazer a cópia. */
/* DIFICULDADE COM PAREDES (js/diff.js) SEM NAVEGADOR. Uso: node test/e2e/diff.js [-v]. Sai com código 1 se algo falhar.
   Chave desligada = nada muda (FC pedida, inimigos das fases 1/10/35/70, HUD, Derrota, Desafiar, módulos). Ligada = tabela do docs/balance.json
   (lida do arquivo, nenhum número fixo aqui), cores, cartão na Derrota e antes do chefe, botões, chefe 32 s/40 s na batalha de verdade, comuns,
   fúria, teto de XP, estrela da montaria, eras 7-8 nas duas combinações. "MEDIDA" = número informativo (não reprova): vai para o relatório. */
const VERBOSE = process.argv.includes('-v');
const MEDIDA = (process.argv.find(a => /^--medida=/.test(a)) || '').slice(9);   /* roteiro de medida (não é teste): --medida=tabela | novo[:segundos] | ondas:<fase> | senhores:<era>-<era>[:eras9] */
const fs = require('fs'), path = require('path');
const boot = require('./sandbox'), errStr = boot.errStr;
const DT = 1 / 30;
let fails = 0, total = 0; const notes = [];
const check = (name, ok, err) => { total++; if (!ok) fails++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok || !err ? '' : ' → ' + err)); return !!ok; };
const note = t => { notes.push(t); console.log('  MEDIDA ' + t); };
const FILE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'balance.json'), 'utf8')).dificuldade;
const EMOJI = /[←-⯿️]|[\uD800-\uDBFF][\uDC00-\uDFFF]/;
const near = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * tol;
const tick = () => new Promise(r => setImmediate(r));

/* elementos de mentira só para o que o js/diff.js cria (HUD e cartão): guardam id, estilo, HTML e se foram removidos */
function fakeDom(G) { const reg = {}; const mk = () => { const e = { id: '', style: { cssText: '' }, innerHTML: '', textContent: '', attrs: {}, dataset: {}, kids: [], gone: false,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute(k, v) { e.attrs[k] = v; }, getAttribute(k) { return e.attrs[k]; }, addEventListener() {},
      appendChild(c) { e.kids.push(c); if (c && c.id) reg[c.id] = c; return c; }, remove() { e.gone = true; if (reg[e.id] === e) delete reg[e.id]; } }; return e; };
  const d = G.document, get0 = d.getElementById.bind(d), mk0 = d.createElement.bind(d);
  const fbw = mk(); fbw.id = 'fb_w'; const sub = { dfh_t: mk(), dfh_x: mk() };
  d.getElementById = id => { if (id === 'fb_w') return fbw; if (id === 'app' && G.fakeDiv) return appP; if (id === 'dfh' || id === 'dfc') return reg[id] || null; if (id === 'dfh_t' || id === 'dfh_x') return reg.dfh ? sub[id] : null; return get0(id); };
  d.createElement = tag => (String(tag).toLowerCase() === 'div' && G.fakeDiv) ? mk() : mk0(tag);
  const appP = new Proxy(get0('app'), { get(t, k) { if (k === 'appendChild') return c => { if (c && c.id && c.kids) reg[c.id] = c; return c; }; return t[k]; } });
  return { reg, sub, hook: on => { G.fakeDiv = on; }, appAppend: c => { if (c && c.id) reg[c.id] = c; } }; }

async function game(search) { const loadErr = []; const G = boot({ realFetch: true, search, add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } }); const { ev, inCtx } = G;
  check('jogo carregou' + (search ? ' (' + search + ')' : ''), !loadErr.length, loadErr.slice(0, 3).join(' | '));
  check('js/diff.js e js/sys/advice.js nas listas do index.html', G.lists.jsList.includes('diff') && G.lists.sysList.includes('advice') && G.lists.sysList.indexOf('advice') > G.lists.sysList.indexOf('fc'), G.lists.jsList.join(',') + ' / ' + G.lists.sysList.join(','));
  G.scale = null; G.frameErr = [];
  /* herói com os atributos do jogo × G.scale.k (ATQ, VIDA, DEF) a cada quadro; G.scale.atk0 = sem dano (mede só quanto aguenta) */
  G.hero = () => { const h = ev('B.hero'), s = G.scale; if (!h || !s) return; const st = s.st; const r = h.maxhp > 0 ? h.hp / h.maxhp : 1; h.atk = (s.atk0 && ev('B.en').some(e => e.boss)) ? 1e-9 : st.atk * s.k;   /* atk0: para de bater quando o chefe entra (as escoltas caem normalmente) */ h.maxhp = st.hp * s.k; h.def = (st.def || 0) * s.k; if (s.fix) { h.critRate = st.critRate; h.critDmg = st.critDmg; h.aspd = st.aspd || 0; h.ivl = G.ev('Sys.stats.interval')(st); } if (!s.set) { h.hp = h.maxhp; s.set = true; } else h.hp = Math.min(h.maxhp, r * h.maxhp); };
  G.sandbox.__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { G.hero(); ev('step')(dt); if (typeof G.sandbox.petStep === 'function') ev('petStep')(dt); } if (typeof G.sandbox.resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); };
  G.frame = async () => { try { inCtx(() => G.sandbox.__e2eFrame(DT)); } catch (e) { const s = errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); } try { inCtx(() => G.advance(DT * 1000)); } catch (e) {} if (++G.n % 30 === 0) await tick(); };
  G.n = 0; G.until = async (cond, secs) => { const n = Math.ceil(secs / DT); for (let i = 0; i < n; i++) { if (cond()) return true; await G.frame(); if (G.frameErr.length > 10) break; } return !!cond(); };
  G.start = (stage, wave, extra) => ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.tut=99; S.welcome=true; S.name='Kael'; S.hero=S.hero||'kael'; S.stage=${stage}; S.wave=${wave}; S.best=Math.max(S.best||1,${stage}); S.eraMax=Math.max(S.eraMax||0,eraOf(${stage})); S.farm=false; ${extra || ''}
      B.paused=false; B.res=null; B.inst=null; B.energy=0; B.cd2=0; view='battle'; try{ resize(); }catch(e){} statsChanged(); startBattle(); return 1; })()`);
  ev('loadBalance()'); for (let i = 0; i < 20; i++) await tick();
  return G; }
/* inimigo de hoje, pela fórmula do mkEnemy escrita aqui de novo (BAL do jogo já com o balance.json) */
const today = (G, stage, kind) => G.ev(`(function(){ const stage=${stage}, kind='${kind}', era=eraOf(stage), boss=kind==='boss', eraBoss=boss&&stage%STAGES_PER_ERA===0, ease=BAL.earlyEase[stage-1]||1, em=BAL.eraMult[era]||1;
  return JSON.stringify([em*BAL.enemyHpBase*Math.pow(BAL.enemyHpGrowth,stage-1)*ease*(boss?BAL.bossHpMult*(eraBoss?BAL.eraBossHpMult:1):BAL.commonHpMult), em*BAL.enemyDmgBase*Math.pow(BAL.enemyDmgGrowth,stage-1)*(ease<1?0.7:1)*(boss?BAL.bossDmgMult*(eraBoss?BAL.eraBossDmgMult:1):BAL.commonDmgMult)]); })()`);
const enemy = (G, stage, kind) => G.ev(`(function(){ const e=mkEnemy(${stage},'${kind}'); return JSON.stringify([e.maxhp,e.dmg,e.hp,'diff' in e,e.fury||0]); })()`);
/* save com pet filhote equipado (1º estágio): devolve a FC */
const cubFc = G => G.ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); const o=Sys.pet.ensure(S), p=Sys.pet.DATA.pets[0]; o.owned[p.id]={stars:1,lvl:10,frags:0,stg:0}; o.eq=p.id; Sys.pet.ensure(S); try{ statsChanged(); }catch(e){} return heroFC(); })()`);
const STAGES = [1, 10, 35, 70], KINDS = ['e0', 'e1', 'boss'];
const snapOff = G => STAGES.map(s => KINDS.map(k => enemy(G, s, k)).join(';') + '|' + G.ev(`fcNeed(${s})`)).join('#');
/* estado com mochila, nível, pet e montaria, para o Sys.advice ter o que sugerir */
const rich = (G, lvl) => G.ev(`(function(){ S.gold=5e7; S.gems=9000; try{ Sys.level.ensure(S).lvl=${lvl}; }catch(e){} try{ const sl=SLOTS7.filter(s=>s!=='wing'); for(let i=0;i<14;i++) addItemToBag({slot:sl[i%sl.length],r:i%5,e:Math.min(S.eraMax,i%2)}); }catch(e){}
  try{ const c=Sys.mount.catalog().find(m=>m.live); if(c){ Sys.mount.add(S,Sys.host,c.id); Sys.mount.addFragments&&Sys.mount.addFragments(S,Sys.host,c.id,5); } }catch(e){} try{ statsChanged(); }catch(e){} return 1; })()`);
/* texto nowrap sem corte = só o que tem largura fixa/limite; larguras fixas de uma linha do cartão têm de caber na base de 390 */
function widthChecks(label, html, s, W) { const m = html.match(/id="dfc_w"[^>]*width:(\d+)px[^>]*scale\(([\d.]+)\)/);
  if (m) check(label + ': a base de ' + m[1] + ' px escalada cabe em ' + W + ' px', +m[1] * +m[2] <= W + 0.5 && near(+m[2], s, 0.001), m[1] + ' × ' + m[2]);
  const fixed = []; html.replace(/(?:^|[;"])(?:min-)?width:(\d+(?:\.\d+)?)px/g, (x, n) => { fixed.push(+n); return x; });
  check(label + ': nenhuma largura fixa passa da área útil (358 px da base)', fixed.every(n => n <= 358 || n === 390), fixed.join(','));
  const bad = []; html.replace(/<(span|h2|button)[^>]*style="([^"]*white-space:nowrap[^"]*)"/g, (x, tag, st) => { if (!/overflow:hidden/.test(st) && !/(^|;)width:\d/.test(st) && !/flex:1/.test(st)) bad.push(st.slice(0, 60)); return x; });
  check(label + ': todo texto de uma linha tem corte (nada empurra a tela para o lado)', !bad.length, bad.join(' | '));
  check(label + ': sem rolagem', !/overflow(-x)?:(auto|scroll)/.test(html)); }

/* ROTEIRO DE MEDIDA para a Sistemas (um pedaço por execução, para caber na memória e no tempo). Não é teste: só imprime. */
async function medidas({ G, ev, fight, many, show }) { const parts = MEDIDA.split(':'), what = parts[0], arg = parts[1] || ''; const P = t => console.log(t);
  if (what === 'tabela') { G.start(1, 1); const fc = ev('heroFC()'), med = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'balance.json'), 'utf8')).tower.fc_mediana_do_gratis_no_fim_de_cada_era;
    P('jogador novo: FC ' + fc + ' · fase 1 pede ' + ev('fcNeed(1)') + ' (' + Math.round(100 * fc / ev('fcNeed(1)')) + '%)');
    for (let e = 0; e < 9; e++) { const g = n => ev(`fcNeed(${e * 10 + n})`); P('era ' + e + ': f1 ' + g(1) + ' · f5 ' + g(5) + ' · f9 ' + g(9) + ' · Senhor ' + g(10) + ' (x' + (g(10) / g(9)).toFixed(2) + ' da f9) · mediana do grátis no fim da era ' + (med[e] || '-')); }
    P('era 0, todas: ' + [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => ev(`fcNeed(${n})`)).join(' ')); return; }
  if (what === 'novo') { G.start(1, 1); ev('SCREENS_ON.bossResult=false'); let deaths = 0, bossLoss = 0, wasDead = false, st = 1; const t0 = ev('B.t'), log = [];
    await G.until(() => { const d = ev('B.deadT') > 0; if (d && !wasDead) { deaths++; if (ev('S.wave') === 5) bossLoss++; } wasDead = d; if (!d && ev('S.farm') && ev('S.wave') !== 5) ev('challengeBoss()');
      if (ev('S.stage') !== st) { st = ev('S.stage'); log.push('fase ' + (st - 1) + ' vencida aos ' + (ev('B.t') - t0).toFixed(0) + ' s (FC ' + ev('heroFC()') + ', nível ' + ev('Sys.level.level(S)') + ', quedas até aqui ' + deaths + ', no chefe ' + bossLoss + ')'); } return st > 6; }, +arg || 420);
    log.forEach(P); P('fim: ' + (ev('B.t') - t0).toFixed(0) + ' s de jogo, fase ' + ev('S.stage') + ' onda ' + ev('S.wave') + ', FC ' + ev('heroFC()') + ' x pedida ' + ev('fcNeed(S.stage)') + ', nível ' + ev('Sys.level.level(S)') + ', quedas ' + deaths + ' (no chefe ' + bossLoss + ')'); return; }
  if (what === 'ondas') { const s = +arg; for (const m of [1.2, 1, 0.9, 0.7]) { const c = await fight(s, 1, { mul: m }), b = await many(3, s, 5, { mul: m });
      P('fase ' + s + ' · ' + Math.round(m * 100) + '% da FC · onda comum 1: ' + (c.res === 'win' ? 'vencida em ' + c.sec.toFixed(0) + ' s, sobra ' + Math.round(c.hp * 100) + '%' : c.res === 'dead' ? 'CAIU aos ' + c.sec.toFixed(0) + ' s' : 'não acabou em 150 s') + ' · onda do chefe: ' + show(b)); } return; }
  if (what === 'senhores') { const ab = arg.split('-').map(Number); for (let e = ab[0]; e <= ab[1]; e++) { const s = e * 10 + 10, wall = ev(`fcNeed(${s})/fcNeed(${s - 1})`); const at = await many(4, s, 5, { mul: 1 / wall }), full = await many(4, s, 5, { mul: 1 });
      P('Senhor da era ' + e + ' (fase ' + s + ', pede ' + ev(`fcNeed(${s})`) + ') · chegando com a FC da fase 9 (' + Math.round(100 / wall) + '%): ' + show(at) + ', derrotas ' + (4 - at.wins) + '/4 · com 100%: ' + show(full) + ', derrotas ' + (4 - full.wins) + '/4'); } return; }
  /* senhoresref:<era>-<era>[:eras9] = o mesmo, com o HERÓI DE REFERÊNCIA novo (Sys.stats.refFromFc, chave ligada só nesta medida): o chefe é derivado dele e quem luta é ele,
     com 100%, 90% e 80% da FC pedida e chegando com a FC da fase anterior. 6 lutas por caso. */
  if (what === 'senhoresref') { const on = ev('Sys.stats.setRefFc(true)'); P('referência nova ligada: ' + on); const ab = arg.split('-').map(Number);
    for (let e = ab[0]; e <= ab[1]; e++) { const s = e * 10 + 10, wall = ev(`fcNeed(${s})/fcNeed(${s - 1})`), r = {}; const arma = !parts.includes('clava'); for (const m of [1, 0.9, 0.8, 1 / wall]) r[m] = await many(6, s, 5, { ref: true, fcm: m, arma });
      const f = m => show(r[m]) + ', derrotas ' + (6 - r[m].wins) + '/6';
      P('Senhor da era ' + e + (arma ? ' COM A ARMA DA ERA' : ' (clava da era 0)') + ' (fase ' + s + ', pede ' + ev(`fcNeed(${s})`) + ') · 100%: ' + f(1) + ' · 90%: ' + f(0.9) + ' · 80%: ' + f(0.8) + ' · com a FC da fase anterior (' + Math.round(100 / wall) + '%): ' + f(1 / wall)); } return; }
  /* PADRÃO DAS MEDIDAS (combinado com a Sistemas): o herói de referência luta com a ARMA DA ERA DA FASE; acrescente :clava para a clava da era 0 do save novo (como era antes).
     diag:<fase>[:clava][:eras9] = UMA luta do herói de referência (100%) na onda do chefe, narrada: arma e alcance do herói do teste, e a cada 2 s a vida do herói e, de cada
     inimigo, chave, posição x, lugar (slot), se está parado, se já parou e a vida. Serve para ver quem bate em quem e quando (pedido da Sistemas: herói caindo antes do duelo). */
  if (what === 'diag') { const s = +arg; ev('Sys.stats.setRefFc(true)'); G.start(s, 5);
    if (!parts.includes('clava')) ev(`(function(){ addItemToBag({slot:'weapon',r:0,e:eraOf(${s})}); const it=S.inv.filter(x=>x.slot==='weapon').pop(); if(it) S.eq.weapon=it.id; statsChanged(); refreshHero(); startBattle(); return 1; })()`);   /* diag:<fase>:arma = com a arma da ERA DA FASE (o save novo do teste luta com a clava da era 0) */
    const st = JSON.parse(ev(`JSON.stringify(diffRef(fcNeed(${s}),${s}))`)); G.scale = { st, k: 1, atk0: false, fix: true, set: false }; ev('SCREENS_ON.bossResult=false');
    P('herói do teste: arma ' + ev("(function(){ const w=wSkin(); return JSON.stringify({e:w.e,r:w.r,arma:w.n,fogo:!!wIsGun(w)}); })()") + ' · alcance ' + ev('heroRange()') + ' · era da fase ' + ev(`eraOf(${s})`) + ' · HX ' + ev('HX') + ' · LW ' + ev('LW') + ' · inimigos da onda: ' + ev(`JSON.stringify(waveSpec(${s},5))`));
    let last = -9, res = null; const t0 = ev('B.t');
    await G.until(() => { const t = ev('B.t') - t0; if (t - last >= 2) { last = t; P('t ' + t.toFixed(1) + ' s · herói ' + Math.round(100 * ev('B.hero.hp/B.hero.maxhp')) + '% · energia ' + Math.round(ev('B.energy')) + ' · fila ' + ev('B.toSpawn.length') + ' · ' + ev("B.en.map(e=>e.key+(e.boss?'(CHEFE)':'')+' x'+Math.round(e.x)+' lugar'+Math.round(e.slot)+(e.parked?' PARADO':e.wasParked?' já parou':' chegando')+' vida'+Math.round(100*e.hp/e.maxhp)+'%'+(e.fury?' FÚRIA':'')).join(' | ')") + ' · tiros no ar ' + ev('B.eshots.length')); }
      if (ev('B.deadT') > 0) { res = 'CAIU'; return true; } const b = ev('B.en').find(e => e.boss); if (b && b.dead) { res = 'venceu'; return true; } return false; }, 150);
    P('fim: ' + (res || 'tempo esgotado') + ' aos ' + (ev('B.t') - t0).toFixed(1) + ' s · herói ' + Math.round(100 * Math.max(0, ev('B.hero.hp/B.hero.maxhp'))) + '%'); G.scale = null; return; }
  if (what === 'cal') { ev('Sys.stats.setRefFc(true)'); const cfg = JSON.parse(process.env.CAL); ev('Object.assign(DIFF.tbl.boss,' + JSON.stringify(cfg) + '); DIFF.memo={}'); P('cal ' + JSON.stringify(cfg)); const [eras, N] = arg.split('/'); const n = +N || 12;
    for (const e of eras.split(',').map(Number)) { const s = e * 10 + 10, r = {}; for (const m of [1, 0.9]) r[m] = await many(n, s, 5, { ref: true, fcm: m, arma: true });
      P('era ' + e + ' · 100%: ' + show(r[1]) + ' · 90%: ' + show(r[0.9]) + ' · lutas sem desfecho em 150 s (T, fora da conta): ' + r[1].runs.filter(x => x.res === 'tempo').length + ' e ' + r[0.9].runs.filter(x => x.res === 'tempo').length); P('  runs100 ' + r[1].runs.map(x => (x.res==='win'?'V':x.res==='dead'?(x.sec<5?'X':'D'):'T') + x.sec.toFixed(0)).join(' ')); P('  runs90 ' + r[0.9].runs.map(x => (x.res==='win'?'V':x.res==='dead'?(x.sec<5?'X':'D'):'T') + x.sec.toFixed(0)).join(' ')); } return; }
  P('medida desconhecida: ' + MEDIDA); }

(async () => {
  /* ======================= 1. CHAVE DESLIGADA ======================= */
  console.log('1. chave desligada');
  const G = await game(MEDIDA && /:eras9$/.test(MEDIDA) ? '?debug=1&fresh=1&skip=1&eras9=1' : undefined), { ev } = G, D = fakeDom(G);
  const F = code => { try { return ev(code); } finally { D.hook(false); } };   /* só as chamadas do js/diff.js criam elementos de mentira */
  check('tabela do balance.json lida pelo loadBalance (bloco dificuldade)', ev('!!DIFF.tbl') && ev('JSON.stringify(DIFF.tbl.recFc)') === JSON.stringify(FILE.recFc), 'DIFF.tbl=' + ev('!!DIFF.tbl'));
  check('arquivo traz a chave desligada (on:false)', FILE.on === false, String(FILE.on));
  check('DIFF_ON desligada e módulos intactos', ev('diffOn()') === false && ev('Sys.advice.DATA.on') === false && ev('Sys.level.killCap(S,Sys.host).on') === false && ev('Sys.mount.DATA.starFlat.on') === false);
  const cub0 = cubFc(G); check('pet: evoluir ainda não dá FC (setStageMult desligado)', ev('Sys.pet.DATA.v17.stageMult.on') === false && cub0 > 0, String(cub0));
  G.start(1, 1); const off0 = snapOff(G);
  for (const s of STAGES) { check('fase ' + s + ': FC pedida = recFC de hoje', ev(`fcNeed(${s})`) === ev(`recFC(${s})`), ev(`fcNeed(${s})`) + ' x ' + ev(`recFC(${s})`));
    for (const k of KINDS) { const t = JSON.parse(today(G, s, k)), e = JSON.parse(enemy(G, s, k)); check('fase ' + s + ' ' + k + ': vida e dano iguais aos de hoje', e[0] === t[0] && e[1] === t[1] && e[2] === t[0] && e[3] === false && e[4] === 0, JSON.stringify(e) + ' x ' + JSON.stringify(t)); } }
  F('diffHud(heroFC())'); check('HUD: nada criado', !D.reg.dfh);
  check('diffStep/diffEnemy/diffAsk/diffLoseRows não fazem nada', ev("diffStep(1)===undefined&&diffEnemy(5,'boss',null)===null&&diffAsk()===false&&diffLoseRows(100)===''&&diffDeadMsg()===''"));
  G.start(5, 1);
  F('bossAskT=0; bossTap()'); check('Desafiar com FC baixa: aviso de sempre, sem cartão, sem entrar no chefe', !D.reg.dfc && ev('S.wave') === 1 && ev('DIFF.card') == null);
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); const loseOff = String(ev('RES.el&&RES.el.innerHTML') || '');
  check('Derrota: os caminhos de sempre, sem ações do Sys.advice', /data-q="gear"/.test(loseOff) && !/res_adv|data-q="adv:/.test(loseOff), loseOff.length + ' caracteres');
  ev("resClose('farm')");

  /* ======================= 2. TABELA ======================= */
  console.log('2. tabela (docs/balance.json)');
  const n = FILE.recFc.length, g = FILE.afterLastGrowth;
  check('recFc: uma FC por fase jogável das 9 eras (' + n + ' valores)', n === ev('9*STAGES_PER_ERA'), n + ' x ' + ev('9*STAGES_PER_ERA'));
  ev('diffSet(true)');
  { let bad = ''; for (let s = 1; s <= n; s++) if (ev(`fcNeed(${s})`) !== FILE.recFc[s - 1]) { bad = 'fase ' + s; break; } check('ligada: fcNeed(fase) = recFc[fase-1] em todas as fases', !bad, bad);
    check('depois da última: a da última × afterLastGrowth por fase', [1, 2, 7].every(d => ev(`fcNeed(${n + d})`) === Math.round(FILE.recFc[n - 1] * Math.pow(g, d))), ev(`fcNeed(${n + 1})`) + ' x ' + Math.round(FILE.recFc[n - 1] * g)); }

  /* ======================= 3. LIGADA: módulos, HUD, cores ======================= */
  console.log('3. ligada: módulos, HUD e cores');
  check('Sys.advice ligado junto', ev('Sys.advice.DATA.on') === true);
  check('teto de XP de abate conforme o arquivo', ev('Sys.level.killCap(S,Sys.host).on') === (FILE.killXpCap.on === true));
  check('estágio do pet (setStageMult) conforme o arquivo', ev('Sys.pet.DATA.v17.stageMult.on') === (FILE.petStageMult.on === true) && FILE.petStageMult.on === true, String(ev('Sys.pet.DATA.v17.stageMult.on')));
  check('estrela da montaria conforme o arquivo', ev('Sys.mount.DATA.starFlat.on') === (FILE.mountStarFlat.on === true));
  { const rr = ev(`(function(){ const M=Sys.mount, m=M.DATA.mounts.find(x=>!x.tbd); const a=M.pctOf(m.id,10,3); M.setStarFlat(false); const b=M.pctOf(m.id,10,3); M.setStarFlat(true); return JSON.stringify([a,b,m.r]); })()`), [a, b, r] = JSON.parse(rr);
    check('montaria 3 estrelas: +2 × o % do arquivo sobre a de hoje', near(a - b, 2 * FILE.mountStarFlat.pct[Math.min(r, FILE.mountStarFlat.pct.length - 1)], 0.001), a + ' - ' + b); }
  if (FILE.killXpCap.on === true) { const r = JSON.parse(ev(`(function(){ const L=Sys.level, c0=L.killCap(S,Sys.host), o=L.ensure(S), lv0=o.lvl; o.lvl=1; o.xp=0; const a=L.addXp(S,10,Sys.host,'kill').gained; L.killCap(S,Sys.host); o.kx=c0.full*3; const c1=L.killCap(S,Sys.host); const b=L.addXp(S,1000,Sys.host,'kill').gained, g0=S.gold;
      const I=diffHudInfo(heroFC(),S.stage); return JSON.stringify({full:c0.full,a,b,rate:c1.rate,xp:I.xp}); })()`));
    check('teto de XP: antes cheia, depois do teto rende a taxa do módulo', r.a === 10 && r.b === Math.round(1000 * r.rate) && r.rate < 1, JSON.stringify(r));
    check('HUD avisa "XP de abate cheia até ..." quando o teto do dia enche', /^XP de abate cheia até /.test(r.xp) && !EMOJI.test(r.xp), r.xp); }
  G.start(1, 1); D.hook(true);
  /* três casos com uma tabela derivada da FC do próprio herói (nenhum número fixo): fase 1 = igual, fase 2 = 95%, fase 3 = 50% */
  ev('window.__tb=DIFF.tbl; diffBal(Object.assign({},DIFF.tbl,{recFc:[heroFC(),Math.ceil(heroFC()/0.95),heroFC()*2]}))');
  const COL = JSON.parse(ev('JSON.stringify(DIFF.col)'));
  for (const [st, tier, nm] of [[1, 0, 'verde (igual)'], [2, 1, 'amarelo (um pouco abaixo)'], [3, 2, 'vermelho (bem abaixo)']]) { F(`S.stage=${st}; S.wave=1; DIFF.hk=null; diffHud(heroFC())`);
    const I = JSON.parse(ev(`JSON.stringify(diffHudInfo(heroFC(),${st}))`)), t = D.sub.dfh_t;
    check('HUD ' + nm + ': FC pedida e cor certas', !!D.reg.dfh && I.tier === tier && t.textContent === 'FC recomendada ' + ev(`fcShow(fcNeed(${st}))`) && t.style.color === COL[tier] && !EMOJI.test(t.textContent), t.textContent + ' ' + t.style.color + ' tier ' + I.tier); }
  F('S.wave=5; DIFF.hk=null; diffHud(heroFC())'); check('HUD no chefe: "Chefe: FC ..."', D.sub.dfh_t.textContent === 'Chefe: FC ' + ev('fcShow(fcNeed(3))'), D.sub.dfh_t.textContent);
  check('limiar das cores num lugar só (DIFF.tier)', ev('diffTier(100,100)') === 0 && ev('diffTier(DIFF.tier.yellow*100,100)') === 1 && ev('diffTier(DIFF.tier.yellow*100-1,100)') === 2);
  F('S.stage=1; S.wave=1; bossAskT=0; bossTap()'); check('Desafiar com a FC igual à pedida: vai direto ao chefe, sem cartão', ev('S.wave') === 5 && !D.reg.dfc);
  F('B.inst={}; diffHud(heroFC())'); check('HUD some em instância', !D.reg.dfh); ev('B.inst=null');
  ev('diffBal(window.__tb)');

  /* ======================= 4. CARTÃO ======================= */
  console.log('4. cartão "Faltam X de FC"');
  G.start(25, 1); rich(G, 60); D.hook(true);
  const need5 = ev('fcNeed(25)'), fc5 = ev('heroFC()'); check('estado do teste: FC abaixo da pedida da fase 25', fc5 < need5, fc5 + ' x ' + need5);
  const raw = JSON.parse(ev('JSON.stringify(Sys.advice(S,Sys.host,{need:fcNeed(25),limit:12}))'));
  const s1 = ev('JSON.stringify(S)'); F('bossAskT=0; bossTap()'); const card = D.reg.dfc, s2 = ev('JSON.stringify(S)');
  check('antes do chefe: o cartão abre e o chefe NÃO começa', !!card && ev('S.wave') === 1 && ev("DIFF.card&&DIFF.card.from") === 'boss');
  check('abrir o cartão não muda o save', s1 === s2);
  const adv = JSON.parse(ev('JSON.stringify(DIFF.card.adv)')), html = card ? card.innerHTML : '';
  check('título = texto do Sys.advice ("Faltam X de FC")', adv.text === raw.text && /^Faltam .+ de FC$/.test(adv.text) && html.includes(adv.text), adv.text + ' x ' + raw.text);
  check('até 3 ações, as primeiras do Sys.advice que têm tela, na ordem dele', adv.actions.length > 0 && adv.actions.length <= 3 && adv.actions.every((a, i, arr) => raw.actions.findIndex(x => x.id === a.id) >= 0 && (i === 0 || raw.actions.findIndex(x => x.id === a.id) > raw.actions.findIndex(x => x.id === arr[i - 1].id))), adv.actions.map(a => a.id).join(',') + ' de ' + raw.actions.map(a => a.id).join(','));
  check('cada ação mostra o ganho do módulo e a tela de destino', adv.actions.every((a, i) => html.includes('data-d="adv:' + i + '"') && a.gainText === raw.actions.find(x => x.id === a.id).gainText.replace(/\s+/g, ' ') && html.includes(a.gainText) && html.includes(a.route.lock ? 'Nv ' + a.route.lock : a.route.name)), JSON.stringify(adv.actions.map(a => [a.id, a.gainText, a.route])));
  check('nenhuma opção de compra ou invocação', adv.actions.every(a => !/buy|shop|summon|compr|invoc/i.test(a.id + ' ' + a.kind + ' ' + a.label)));
  check('zero emoji e zero estrela desenhada no cartão', !EMOJI.test(html.replace(/<[^>]*>/g, '')), (html.replace(/<[^>]*>/g, '').match(EMOJI) || [''])[0]);
  check('sem undefined/NaN', !/undefined|NaN|\[object/.test(html));
  check('botões "Agora não" e "Desafiar assim mesmo"', /data-d="x"/.test(html) && /data-d="go"/.test(html));
  const VIEW = { gear: 'gear', forge: 'forge', pet: 'pets', mount: 'mounts', titles: 'profile' };
  for (let i = 0; i < adv.actions.length; i++) { const a = adv.actions[i]; if (!D.reg.dfc) F('bossAskT=0; bossTap()');
    ev(`diffAct('adv:${i}')`); const v = ev('view');
    check('antes do chefe · ' + a.id + ' → ' + (a.route.lock ? 'aviso "abre no nível ' + a.route.lock + '"' : a.route.farm ? 'volta a lutar' : 'tela ' + VIEW[a.tab]), a.route.lock ? v === 'battle' && !!D.reg.dfc : a.route.farm ? v === 'battle' && !D.reg.dfc : v === VIEW[a.tab] && !D.reg.dfc, 'view=' + v);
    ev("if(view!=='battle') Screens.close(); view='battle'"); ev('diffClose()'); }
  F('bossAskT=0; bossTap()'); ev("diffAct('x')"); check('"Agora não" fecha e não desafia', !D.reg.dfc && ev('S.wave') === 1);
  F('bossTap()'); ev("diffAct('go')"); check('"Desafiar assim mesmo" entra no chefe', !D.reg.dfc && ev('S.wave') === 5);
  /* Derrota */
  G.start(25, 1); rich(G, 60); const s3 = ev('JSON.stringify(S)');
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); const lose = String(ev('RES.el&&RES.el.innerHTML') || ''), s4 = ev('JSON.stringify(S)');
  const ladv = JSON.parse(ev('JSON.stringify(DIFF.card&&DIFF.card.adv||null)'));
  check('Derrota: ações do Sys.advice na caixa de 150 px, no lugar dos caminhos fixos', /id="res_adv"[^>]*height:150px/.test(lose) && !/data-q="summon"/.test(lose) && !!ladv && ladv.actions.every((a, i) => lose.includes('data-q="adv:' + i + '"') && lose.includes(a.gainText)), lose.length + ' caracteres');
  check('Derrota: "Faltam X de FC" com a FC pedida da tabela', lose.includes(ev('fcTxt(fcNeed(25))')) && /Faltam <span[^>]*>[^<]+ de FC<\/span>/.test(lose));
  check('Derrota: abrir não muda o save', s3 === s4); check('Derrota: zero emoji, sem undefined/NaN', !EMOJI.test(lose.replace(/<[^>]*>/g, '')) && !/undefined|NaN|\[object/.test(lose.replace(/<style[\s\S]*?<\/style>/g, '')));
  check('Derrota: altura da tela igual à de hoje (mesmos 150 px)', (loseOff.match(/height:150px/g) || []).length === (lose.match(/height:150px/g) || []).length);
  for (let i = 0; ladv && i < ladv.actions.length; i++) { const a = ladv.actions[i]; if (!ev('B.res')) ev("resOpen('lose',{stage:S.stage},true)"); ev('RES.t=RES_LOSE_BTN+1'); ev(`resAct('adv:${i}')`); const v = ev('view'), open = !!ev('B.res');
    check('Derrota · ' + a.id + ' → ' + (a.route.lock ? 'aviso do nível, tela fica' : a.route.farm ? 'modo farm' : 'tela ' + VIEW[a.tab] + ' com o farm atrás'), a.route.lock ? open && v === 'battle' : a.route.farm ? !open && v === 'battle' && ev('S.farm') === true : !open && v === VIEW[a.tab] && ev('S.farm') === true, 'view=' + v + ' res=' + open);
    ev("if(B.res) resClose('farm'); if(view!=='battle') Screens.close(); view='battle'"); }
  /* tela trancada por nível e tela que não existe */
  G.start(25, 1); rich(G, 2); { const a = JSON.parse(ev('JSON.stringify(diffAdvice(fcNeed(25)).actions)')), lk = a.find(x => x.route.lock), rows = ev("diffRowsHtml(diffAdvice(fcNeed(25)),'data-d',null)");
    if (lk) { check('tela trancada por nível: a linha diz "abre no nível N" e o toque avisa', rows.includes(lk.route.name + ': abre no nível ' + lk.route.lock) && ev(`(function(){ DIFF.card={adv:diffAdvice(fcNeed(25)),from:'boss'}; view='battle'; return diffGo(${a.indexOf(lk)}); })()`) === 'lock' && ev('view') === 'battle', rows.slice(0, 200)); }
    else note('nível 2: o Sys.advice não devolveu ação de tela trancada (' + a.map(x => x.id).join(',') + '); a linha "abre no nível N" fica conferida só pela rota');
    check('rota trancada devolve o nível da liberação do MENU', ev("(function(){ const r=diffRoute('pet'); return !!r&&r.lock===fbLvU('pets')&&r.why==='Abre no nível '+r.lock; })()"), ev("JSON.stringify(diffRoute('pet'))"));
    check('tela desligada (painel) = a ação não entra na lista', ev("(function(){ const k=PANEL_ON.forge; PANEL_ON.forge=false; const r=diffRoute('forge'); PANEL_ON.forge=k; return r===null; })()") && ev("diffRoute('xyz')===null")); }
  /* larguras */
  G.start(25, 1); rich(G, 60);
  for (const [W, H] of [[288, 512], [360, 640], [390, 844]]) { const s = W / 390; const h = ev(`diffCardHtml(diffAdvice(fcNeed(25)),{s:${s},Hb:${H / s},feet:${0.758 * H / s},hs:150,top:132})`); widthChecks('cartão em ' + W + ' px', h, s, W);
    const f = +(h.match(/id="dfc_c"[^>]*scale\(([\d.]+)\)/) || [])[1]; check('cartão em ' + W + ' px: encolhe no máximo até 0,7 e nunca cresce', f >= 0.7 && f <= 1, String(f)); if (f < 1) note('cartão antes do chefe em ' + W + 'x' + H + ': encolhe para ' + f + ' para não cobrir o herói (conferir no navegador)'); }
  widthChecks('linhas da Derrota', ev("diffRowsHtml(diffAdvice(fcNeed(25)),'data-q',1.1)"), 1, 390);
  { const long = ev(`diffRowsHtml({actions:[{id:'x',label:diffTxt('Montaria Cavalo de Guerra Celestial 2★ (faltam 12 fragmentos)'),gainText:'+999,9 qua FC',route:{name:'Montarias'}}]},'data-d',null)`);
    check('texto longo: "2 estrelas" por extenso, linha com corte', /2 estrelas/.test(long) && !EMOJI.test(long) && /-webkit-line-clamp:2/.test(long)); }

  /* ======================= 5. CHEFE, COMUNS, FÚRIA ======================= */
  console.log('5. chefe, comuns e fúria (batalha de verdade, quadro a quadro)');
  const HS = FILE.commons.hpShareOfBoss, DS = FILE.commons.dmgShareOfBoss, KILL = FILE.boss.killSecAt100, SURV = FILE.boss.surviveSecAt100, FAT = FILE.boss.furyAtSec, FM = FILE.boss.furyDmgMult;
  check('arquivo: chefe só pela FC pedida e onda com as escoltas', FILE.boss.fromRecOnly === true && FILE.boss.waveIncludesEscorts === true && HS > 0 && DS > 0);
  G.start(1, 1); const en1 = STAGES.map(s => KINDS.map(k => enemy(G, s, k)).join(';')).join('#');
  for (const s of STAGES) { const b = JSON.parse(ev(`JSON.stringify(diffBoss(${s}))`)), e = JSON.parse(enemy(G, s, 'boss')), c = JSON.parse(enemy(G, s, 'e0')), c1 = JSON.parse(enemy(G, s, 'e1'));
    check('fase ' + s + ': chefe sai da FC pedida da fase', e[3] === true && e[0] === b.hp && e[1] === b.dmg && b.need === FILE.recFc[s - 1] && isFinite(e[0]) && e[0] > 0 && e[1] > 0, JSON.stringify(e));
    check('fase ' + s + ': comuns = ' + HS + ' da vida e ' + DS + ' do dano do chefe da MESMA fase', near(c[0], b.hp * HS, 1e-9) && near(c[1], b.dmg * DS, 1e-9) && c1[0] === c[0] && c1[1] === c[1], JSON.stringify(c));
    check('fase ' + s + ': onda inteira (chefe + ' + b.escorts + ' escoltas) = ' + KILL + ' s × DPS da FC pedida', b.escorts === 2 && near(b.hp * (1 + b.escorts * HS), KILL * b.dps, 1e-9));
    check('fase ' + s + ': herói de referência tem a FC pedida pelo Sys.fc', near(ev(`Sys.fc.fcOfStats(diffRef(fcNeed(${s}),${s}))`), b.need, 0.01), ev(`Sys.fc.fcOfStats(diffRef(fcNeed(${s}),${s}))`) + ' x ' + b.need); }
  G.start(1, 1); rich(G, 60); check('chefe e comuns NÃO dependem do herói do momento (herói forte = mesmos inimigos)', STAGES.map(s => KINDS.map(k => enemy(G, s, k)).join(';')).join('#') === en1 && ev('heroFC()') > 1000, String(ev('heroFC()')));
  /* luta real. spec: {ref:true, mul} = herói de referência da FC pedida × mul; {mul} = herói do jogo (proporções de quem começa) com mul × a FC pedida; atk0 = sem bater */
  async function fight(stage, wave, spec) { G.sandbox.__e2eRescale = () => G.hero(); ev(`(function(){ if(!window.__rhWrap){ const o=refreshHero; refreshHero=function(){ const r=o.apply(this,arguments); try{ __e2eRescale(); }catch(e){} return r; }; window.__rhWrap=1; } return 1; })()`);   /* causa das quedas X (eras 5 e 6): matar uma escolta pode equipar um item melhor ou dar um título, e o jogo chama refreshHero() DENTRO do step: o herói volta à vida/ATQ/DEF do save até o próximo quadro, e um golpe nesse mesmo quadro o derruba. Reaplica a escala da referência logo depois de cada refreshHero */
    G.start(stage, wave); if (spec && spec.arma) ev(`(function(){ addItemToBag({slot:'weapon',r:0,e:eraOf(${stage})}); const it=S.inv.filter(x=>x.slot==='weapon').pop(); if(it) S.eq.weapon=it.id; statsChanged(); refreshHero(); startBattle(); return 1; })()`);   /* spec.arma: luta com a arma da ERA DA FASE (o save novo do teste usa a clava da era 0 em qualquer fase) */
    const need = ev(`fcNeed(${stage})`);
    if (spec) { const st = spec.ref ? JSON.parse(ev(`JSON.stringify(diffRef(fcNeed(${stage})*${spec.fcm || 1},${stage}))`)) : JSON.parse(ev('JSON.stringify(heroStats())')); G.scale = { st, k: (spec.ref ? 1 : need / ev('heroFC()')) * (spec.mul || 1), atk0: !!spec.atk0, fix: !!spec.ref, set: false }; }
    ev('SCREENS_ON.bossResult=false'); let t0 = null, tFury = null, res = null, boss = null; const t = () => ev('B.t'), w0 = ev('S.wave');
    await G.until(() => { const en = ev('B.en'); if (t0 == null && en.some(e => e.wasParked)) t0 = t(); if (!boss) boss = en.find(e => e.boss) || null; if (boss && boss.fury && tFury == null) tFury = t() - t0;
      if (ev('B.deadT') > 0) { res = 'dead'; return true; } if (wave === 5 ? (boss && boss.dead) : ev('S.wave') !== w0) { res = 'win'; return true; } return false; }, 150);
    if (process.env.DBG && res === 'dead' && (t0 == null || t() - t0 < 5)) process.stdout.write('DBG D0 t0=' + t0 + ' tF=' + tFury + ' ' + JSON.stringify(JSON.parse(ev('JSON.stringify({t:B.t,deadT:B.deadT,hp:B.hero&&B.hero.hp,max:B.hero&&B.hero.maxhp,wave:S.wave,stage:S.stage,en:B.en.map(e=>[e.kind,Math.round(e.x),e.parked,e.wasParked,e.dead]),res:B.res})'))) + String.fromCharCode(10));
    const out = { res: res || 'tempo', sec: t0 != null ? t() - t0 : 0, hp: Math.max(0, ev('B.hero.hp/B.hero.maxhp')), tFury }; G.scale = null; return out; }
  const many = async (n, stage, wave, spec) => { const r = []; for (let i = 0; i < n; i++) r.push(await fight(stage, wave, spec)); const all = r; n = r.filter(x => !(x.res === 'dead' && x.sec < 5)).length; const w = r.filter(x => x.res === 'win');   /* X = queda com menos de 5 s do 1º inimigo parado: o herói está com a vida do save (sem a escala da referência) e o inimigo longe = defeito da medida, fora da conta */ return { runs: all, wins: w.length, n, mean: w.length ? w.reduce((a, x) => a + x.sec, 0) / w.length : 0, meanAll: r.reduce((a, x) => a + x.sec, 0) / n, hp: w.length ? w.reduce((a, x) => a + x.hp, 0) / w.length : 0 }; };
  const show = m => m.wins + '/' + m.n + (m.wins ? ' em ' + m.mean.toFixed(0) + ' s, sobra ' + Math.round(m.hp * 100) + '%' : ' (cai aos ' + m.meanAll.toFixed(0) + ' s)');

  if (MEDIDA) { await medidas({ G, ev, fight, many, show }); process.exit(0); }

  /* a sorte da luta (crítico no especial e na ultimate) espalha cada luta em uns ±15%: a regra é conferida na MÉDIA de 4 lutas */
  for (const s of [10, 35]) { const m = await many(4, s, 5, { ref: true });
    check('fase ' + s + ': herói de referência (100% da FC pedida) vence a onda do chefe inteira em ~' + KILL + ' s (média de 4, ±15%)', m.wins === 4 && near(m.mean, KILL, 0.15), m.runs.map(r => r.res + ' ' + r.sec.toFixed(1)).join(', '));
    const b = await fight(s, 5, { ref: true, atk0: true }); check('fase ' + s + ': sem bater no chefe, ele cairia em ~' + SURV + ' s (±12%)', b.res === 'dead' && near(b.sec, SURV, 0.12), JSON.stringify(b));
    const c = await fight(s, 5, { ref: true, mul: 0.7 }); check('fase ' + s + ': com 70% da FC não vence', c.res === 'dead', JSON.stringify(c));
    note('fase ' + s + ', herói de referência: 100% ' + show(m) + ' · sem bater cai aos ' + b.sec.toFixed(1) + ' s · 70% cai aos ' + c.sec.toFixed(1) + ' s'); }
  check('nenhuma exceção no laço da batalha', !G.frameErr.length, G.frameErr.slice(0, 3).join(' | '));
  /* fúria */
  G.start(10, 5); { ev("B.en=[mkEnemy(10,'boss')]; B.toSpawn=[]; B.en[0].wasParked=true; B.banner=null; DIFF.ft=0"); ev(`diffStep(${FAT - 0.5})`); const before = ev('B.en[0].fury||0'); ev('diffStep(0.6)'); const bn = JSON.parse(ev('JSON.stringify(B.banner||{})'));
    check('fúria: nada antes de furyAtSec; depois, dano × furyDmgMult (uma vez)', before === 0 && ev('B.en[0].fury') === FM, before + ' → ' + ev('B.en[0].fury'));
    check('fúria: aviso na tela sem emoji', /FÚRIA/.test(bn.txt || '') && bn.sub === 'Dano x' + FM && !EMOJI.test((bn.txt || '') + bn.sub), JSON.stringify(bn));
    check('fúria: o HUD avisa', /fúria/.test(JSON.parse(ev('JSON.stringify(diffHudInfo(heroFC(),10))')).text));
    /* opções novas da Sistemas, DESLIGADAS por padrão (campo ausente na tabela = tudo como antes; os testes acima provam o padrão) */
    { const base = JSON.parse(ev("(function(){ DIFF.memo={}; const x=diffBoss(60); return JSON.stringify({hp:x.hp,dmg:x.dmg,dps:x.dps,kill:x.kill,tE:x.tE,es:x.escortSec,n:x.escorts}); })()"));
      check('opção escortSec ausente: conta de antes (tE = vida das escoltas ÷ DPS)', base.es === 0 && base.n > 0 && base.tE > 0 && base.tE < 10, JSON.stringify(base));
      const withEs = JSON.parse(ev("(function(){ DIFF.tbl.boss.escortSec=15; DIFF.memo={}; const x=diffBoss(60); const r={hp:x.hp,dmg:x.dmg,dps:x.dps,kill:x.kill,tE:x.tE,es:x.escortSec}; DIFF.tbl.boss.escortSec=[5,5,5,5,5,12,5,5,5]; DIFF.memo={}; r.byEra=diffBoss(60).tE; r.byEra0=diffBoss(10).tE; delete DIFF.tbl.boss.escortSec; DIFF.memo={}; r.back=diffBoss(60).hp; return JSON.stringify(r); })()"));
      check('opção escortSec = 15: vida do chefe = DPS × (killSec − 15), chefe bate mais forte (menos tempo de duelo para os mesmos ' + SURV + ' s)', withEs.tE === 15 && near(withEs.hp, withEs.dps * (KILL - 15), 1e-6) && withEs.dmg > base.dmg, JSON.stringify(withEs));
      check('opção escortSec por era (lista) e volta ao padrão ao tirar o campo', withEs.byEra === 12 && withEs.byEra0 === 5 && near(withEs.back, base.hp, 1e-9), JSON.stringify(withEs));
      const pe = JSON.parse(ev(`(function(){ const B0=DIFF.tbl.boss, k0=B0.killSecAt100, s0=B0.surviveSecAt100, f0=B0.furyAtSec, o={}; DIFF.memo={}; o.base10=diffBoss(10).hp; o.base60=diffBoss(60).hp; o.dps60=diffBoss(60).dps;
        B0.killSecAt100=[k0,k0,k0,k0,k0,k0+8]; B0.surviveSecAt100=[s0,s0,s0,s0,s0,s0+6]; DIFF.memo={}; const a=diffBoss(10), b=diffBoss(60), c=diffBoss(90); o.a=[a.kill,a.surv,a.hp]; o.b=[b.kill,b.surv,b.hp,b.dmg]; o.c=[c.kill,c.surv];
        o.pick=[diffByEra(7,60), diffByEra([1,2,3],10), diffByEra([1,2,3],30), diffByEra([1,2,3],90), diffByEra([],10)];
        B0.killSecAt100=k0; B0.surviveSecAt100=s0; B0.furyAtSec=f0; DIFF.memo={}; o.back=diffBoss(60).hp; return JSON.stringify(o); })()`));
      check('opção por era: killSecAt100 e surviveSecAt100 como lista mudam só a era da posição (era 0 igual; era 5 com +8 s e +6 s; lista curta: a última vale para as eras seguintes); número continua valendo', near(pe.a[2], pe.base10, 1e-9) && pe.a[0] === KILL && pe.b[0] === KILL + 8 && pe.b[1] === SURV + 6 && pe.b[2] > pe.base60 && pe.c[0] === KILL + 8 && pe.c[1] === SURV + 6 && pe.pick[0] === 7 && pe.pick[1] === 1 && pe.pick[2] === 3 && pe.pick[3] === 3 && pe.pick[4] == null && near(pe.back, pe.base60, 1e-9), JSON.stringify(pe));
      const fb = JSON.parse(ev(`(function(){ const o={}; DIFF.tbl.boss.furyFrom='boss'; B.banner=null;
        B.en=[mkEnemy(10,'e0'),mkEnemy(10,'boss')]; B.toSpawn=[]; B.en[0].wasParked=true; B.en[1].wasParked=false; DIFF.ft=0; diffStep(${FAT + 5}); o.soEscolta=[DIFF.ft, B.en[1].fury||0];
        B.en[1].wasParked=true; diffStep(${FAT - 0.5}); o.antes=B.en[1].fury||0; diffStep(0.6); o.depois=B.en[1].fury||0;
        delete DIFF.tbl.boss.furyFrom; B.en=[mkEnemy(10,'e0'),mkEnemy(10,'boss')]; B.en[0].wasParked=true; B.en[1].wasParked=false; DIFF.ft=0; diffStep(${FAT + 5}); o.padrao=B.en[1].fury||0; B.banner=null; DIFF.ft=0; return JSON.stringify(o); })()`));
      check("opção furyFrom 'boss': só a escolta no lugar não gasta o relógio; conta do chefe parado; sem o campo conta da 1ª escolta", fb.soEscolta[0] === 0 && fb.soEscolta[1] === 0 && fb.antes === 0 && fb.depois === FM && fb.padrao === FM, JSON.stringify(fb)); }
    ev("B.en=[]; B.toSpawn=['e0','e1','boss']; diffStep(0.1)"); check('fúria: o relógio zera quando a onda do chefe recomeça', ev('DIFF.ft') === 0);
    const a = await fight(10, 5, { ref: true, mul: 3, atk0: true }); check('fúria na luta real: entra ' + FAT + ' s depois do primeiro inimigo da onda chegar', a.tFury != null && near(a.tFury, FAT, 0.03), JSON.stringify(a)); }
  /* o resto do jogo não muda */
  G.start(10, 1); { ev('B.inst={}'); const e = JSON.parse(enemy(G, 10, 'boss')), t = JSON.parse(today(G, 10, 'boss')), c = JSON.parse(enemy(G, 10, 'e0')), tc = JSON.parse(today(G, 10, 'e0')); ev('B.inst=null');
    check('instância: inimigos de hoje, sem fúria', e[0] === t[0] && e[1] === t[1] && e[3] === false && c[0] === tc[0] && c[1] === tc[1], JSON.stringify(e)); }
  { const k = "JSON.stringify([Sys.tower&&Sys.tower.floorFC?[10,30,60].map(f=>Sys.tower.floorFC(f)):0, Sys.phases&&Sys.phases.fcRec?Sys.phases.fcRec(2,0,10):0, recFC(35), JSON.stringify(REC_FC), JSON.stringify(BAL)])"; const on = ev(k); ev('diffSet(false)'); const of = ev(k); ev('diffSet(true)');
    check('Torre, fases do Sys.phases, REC_FC e BAL iguais com a chave ligada ou desligada', on === of); }
  /* save antigo abaixo da parede: tem aviso */
  G.start(40, 1); { const msg = ev('diffDeadMsg()'), I = JSON.parse(ev('JSON.stringify(diffHudInfo(heroFC(),40))'));
    check('save com FC abaixo da pedida: HUD vermelho e aviso ao cair numa onda comum', I.tier === 2 && /^Derrotado: faltam .+ de FC\. Toque em Desafiar/.test(msg) && !EMOJI.test(msg), msg); }

  /* ======================= 6. DESLIGAR DE NOVO ======================= */
  console.log('6. desligada de novo = idêntico');
  ev('diffSet(false)'); G.start(1, 1);
  check('inimigos das fases 1, 10, 35 e 70 e FC pedida idênticos aos do começo', snapOff(G) === off0);
  check('save com pet filhote: FC idêntica à de hoje', ev('Sys.pet.DATA.v17.stageMult.on') === false && cubFc(G) === cub0, cubFc(G) + ' x ' + cub0); G.start(1, 1);
  check('módulos de volta: advice, teto de XP e estrela desligados', ev('Sys.advice.DATA.on') === false && ev('Sys.level.killCap(S,Sys.host).on') === false && ev('Sys.mount.DATA.starFlat.on') === false);
  G.start(5, 1);
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); { const h = String(ev('RES.el.innerHTML')); let i = 0; while (i < h.length && h[i] === loseOff[i]) i++; check('Derrota idêntica à do começo', h === loseOff, 'difere em ' + i + ': ' + loseOff.slice(i - 60, i + 60) + ' ||| ' + h.slice(i - 60, i + 60)); } ev("resClose('farm')");
  F('diffHud(heroFC())'); check('HUD limpo', !D.reg.dfh && !D.reg.dfc);

  /* ======================= 7. ERAS 7-8 nas duas combinações ======================= */
  console.log('7. eras 7-8 (chave própria) × dificuldade');
  check('eras 7-8 desligadas + dificuldade ligada: 70 fases, última com a FC da tabela', ev('ERAS.length') === 7 && (ev('diffSet(true)'), ev('fcNeed(70)') === FILE.recFc[69]) && JSON.parse(enemy(G, 70, 'boss'))[3] === true); ev('diffSet(false)');
  const G9 = await game('?debug=1&fresh=1&skip=1&eras9=1'), e9 = G9.ev; G9.start(1, 1);
  check('eras 7-8 ligadas + dificuldade desligada: fases 75 e 90 com o inimigo de hoje', e9('ERAS.length') === 9 && [75, 90].every(s => KINDS.every(k => { const e = JSON.parse(enemy(G9, s, k)), t = JSON.parse(today(G9, s, k)); return e[0] === t[0] && e[1] === t[1] && e[3] === false; })) && e9('fcNeed(75)') === e9('recFC(75)'));
  e9('diffSet(true)');
  check('eras 7-8 ligadas + dificuldade ligada: fases 71-90 pela tabela, depois × afterLastGrowth', [71, 75, 80, 90].every(s => e9(`fcNeed(${s})`) === FILE.recFc[s - 1] && (() => { const e = JSON.parse(enemy(G9, s, 'boss')), c = JSON.parse(enemy(G9, s, 'e0')); return e[3] === true && isFinite(e[0]) && e[0] > 0 && isFinite(e[1]) && c[0] > 0 && c[0] < e[0]; })()) && e9(`fcNeed(${n + 1})`) === Math.round(FILE.recFc[n - 1] * g));
  check('eras 7-8: REC_FC das eras 7-8 intacto com a dificuldade ligada', e9('REC_FC.length') === 9 && e9('recFC(75)') > 0);
  e9('diffSet(false)');

  console.log('\n' + (total - fails) + '/' + total + ' verificações' + (fails ? ' · ' + fails + ' FALHA(S)' : ' · tudo certo') + ' · ' + notes.length + ' medidas');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERRO', e && e.stack || e); process.exit(1); });
