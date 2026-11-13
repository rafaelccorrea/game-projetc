'use strict';
/* FLUXOS REAIS SEM NAVEGADOR (fps-ff): roda a batalha do jogo quadro a quadro (o mesmo corpo do loop() de js/battle.js, sem o desenho)
   e passa por três fluxos de ponta a ponta, com o código do próprio jogo:
     1. TROCA DE ERA   — chefe da última fase da era 0 (Senhor) morre → era 1 liberada, overlay 'era' (js/p_era.js) abre e fecha, batalha segue
     2. INSTÂNCIA      — Sys.instances.start + window.startInstanceRun (js/instfx.js): vitória (herói forte) e derrota (herói fraco)
     3. VITÓRIA/DERROTA — chefe de fase com SCREENS_ON.bossResult ligado: resOpen, HTML da tela, botões data-q, batalha segue
   Uso: node test/e2e/flows.js [-v]. Cada fluxo sobe um jogo novo (sandbox.js). Sai com código 1 se um fluxo "duro" falhar. */
const VERBOSE = process.argv.includes('-v');
/* fluxo duro = falha derruba o código de saída. INSTÂNCIA está EM CONFERÊNCIA (PANEL_ON.inst desligada, nunca rodou de ponta a ponta):
   mostra todos os problemas, mas não reprova. Trocar para true quando o engenheiro ligar a tela. */
const HARD = { era: true, inst: true, result: true };   /* inst: PANEL_ON.inst ligada (pedido A-22) e fluxo 26/26 */
const DT = 1 / 30;
const boot = require('./sandbox'), errStr = boot.errStr;

const flows = [];   // {id, name, checks:[{name, ok, err}], errs:[]}
let cur = null;
const check = (name, ok, err) => { cur.checks.push({ name, ok: !!ok, err: ok ? '' : (err || '') }); if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + cur.id + ' · ' + name + (ok || !err ? '' : ' → ' + err)); return !!ok; };
const BAD = ['undefined', 'NaN', '[object Object]'];
const badIn = h => { if (typeof h !== 'string' || !h.trim()) return 'HTML vazio'; const t = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const b of BAD) { const i = t.indexOf(b); if (i >= 0) return 'contém "' + b + '": …' + t.slice(Math.max(0, i - 70), i + b.length + 30).replace(/\s+/g, ' ') + '…'; } return null; };
const attrs = (h, a) => { const out = [], re = new RegExp('\\b' + a + '="([^"]*)"', 'g'); let m; while ((m = re.exec(h))) if (!out.includes(m[1])) out.push(m[1]); return out; };

/* ---------------- jogo + laço manual ---------------- */
async function newGame() {
  const loadErr = [];
  const G = boot({ realFetch: true, add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } });
  const { ev, inCtx } = G;
  check('jogo carregou (' + G.lists.sysOrder.length + ' js/sys, ' + G.lists.jsList.length + ' js, ' + G.lists.panList.length + ' do screens.js)', !loadErr.length, loadErr.slice(0, 4).join(' | '));
  /* herói: 'strong' = ATK e vida enormes a cada quadro (como o ?lord= do index); 'weak' = sem dano e com 1 de vida; null = o do jogo */
  G.mode = null; G.frameErr = []; G.frames = 0;
  G.hero = () => { const h = ev('B.hero'); if (!h) return; if (G.mode === 'strong') { h.atk = 1e15; h.maxhp = 1e15; h.hp = 1e15; h.def = 1e9; } else if (G.mode === 'weak') { h.atk = 1e-6; h.critRate = 0; h.hp = Math.min(h.hp, 1); } };
  /* um quadro do loop() de js/battle.js (step, petStep, instStep na velocidade do jogo; resTick; tickFx), sem draw(); os timers andam no relógio virtual */
  sandbox(G).__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { const n = B.speed || 1; for (let i = 0; i < n; i++) { G.hero(); ev('step')(dt); if (typeof sandbox(G).petStep === 'function') ev('petStep')(dt); if (B.inst && typeof sandbox(G).instStep === 'function') ev('instStep')(dt); } }
    if (typeof sandbox(G).resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); };
  G.frame = async dt => { dt = dt || DT; try { inCtx(() => sandbox(G).__e2eFrame(dt)); } catch (e) { const s = errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); }
    try { inCtx(() => G.advance(dt * 1000)); } catch (e) { const s = 'timer: ' + errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); }
    G.frames++; if (G.frames % 15 === 0) await new Promise(r => setImmediate(r)); };   /* deixa as Promises (fetch) do jogo andarem */
  /* roda até cond() ou até 'secs' segundos de jogo; devolve true se a condição veio */
  G.until = async (cond, secs) => { const n = Math.ceil(secs / DT); for (let i = 0; i < n; i++) { if (cond()) return true; await G.frame(); if (G.frameErr.length > 20) break; } return !!cond(); };
  G.run = async secs => { await G.until(() => false, secs); };
  /* começo comum: estado novo do jogo, tutorial e boas-vindas vencidos, tela de batalha, sem pausa do título */
  G.start = (stage, wave, extra) => { ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.tut=99; S.welcome=true; S.name=S.name||'Kael'; S.hero=S.hero||'kael';
      S.stage=${stage}; S.wave=${wave}; S.best=Math.max(S.best||1,${stage}); S.eraMax=Math.max(S.eraMax||0,eraOf(${stage})); S.farm=false; ${extra || ''}
      B.paused=false; B.res=null; B.inst=null; view='battle'; startBattle(); return 1; })()`); };
  G.errs = () => G.frameErr.slice();
  return G;
}
const sandbox = G => G.sandbox;
const noErr = (G, label) => check(label || 'nenhuma exceção no laço da batalha', !G.frameErr.length, G.frameErr.slice(0, 5).join(' | '));
/* a batalha continua: inimigos na tela ou chegando, herói vivo, nada aberto por cima */
async function battleGoes(G, label) { const { ev } = G; const k0 = ev('S.kills'), w0 = ev('S.wave');
  const ok = await G.until(() => ev('S.kills') > k0 || ev('S.wave') !== w0, 25);
  return check(label || 'batalha segue (abates ou ondas andam)', ok && !ev('B.res'), 'kills ' + k0 + '→' + ev('S.kills') + ', onda ' + w0 + '→' + ev('S.wave') + ', B.res=' + JSON.stringify(ev('B.res')) + ', B.paused=' + ev('B.paused')); }

/* ---------------- 1. TROCA DE ERA ---------------- */
async function flowEra() {
  const G = await newGame(), { ev, sandbox: X } = G;
  const STG = ev('STAGES_PER_ERA');
  check("painel 'era' registrado e ligado (PANEL_ON.era)", ev("!!(Panels.defs.era&&Panels.on('era'))"), 'PANEL_ON.era=' + ev('PANEL_ON.era'));
  const opens = []; { const P = X.Panels, o0 = P.open.bind(P); P.open = (n, o) => { const r = o0(n, o); opens.push({ n, o, r }); return r; }; }
  G.start(STG, 5); G.mode = 'strong';   /* última fase da era 0, onda do chefe (Senhor da Era) */
  check('começa na fase ' + STG + ' onda 5, era 0', ev('S.stage') === STG && ev('S.wave') === 5 && ev('eraOf(S.stage)') === 0 && ev('S.eraMax') === 0, 'stage ' + ev('S.stage') + ' wave ' + ev('S.wave') + ' eraMax ' + ev('S.eraMax'));
  let sawBoss = false;
  const done = await G.until(() => { if (ev('B.en.some(e=>e.boss&&e.eraBoss)')) sawBoss = true; return ev('S.eraMax') >= 1; }, 240);
  check('Senhor da Era apareceu', sawBoss, 'nenhum inimigo com boss&&eraBoss surgiu');
  check('Senhor morreu e a era avançou (S.eraMax 0→1, S.stage ' + STG + '→' + (STG + 1) + ')', done && ev('S.eraMax') === 1 && ev('S.stage') === STG + 1 && ev('eraOf(S.stage)') === 1,
    'eraMax ' + ev('S.eraMax') + ', stage ' + ev('S.stage') + ', wave ' + ev('S.wave') + ', inimigos ' + ev('B.en.map(e=>e.kind+":"+Math.round(e.hp)).join(",")') + ', aSurgir ' + ev('JSON.stringify(B.toSpawn)'));
  const eo = opens.find(x => x.n === 'era');
  check("overlay 'era' pedido: Panels.open('era',{from:0,to:1}) devolveu true", eo && eo.r && eo.o && eo.o.from === 0 && eo.o.to === 1, eo ? JSON.stringify({ r: eo.r, from: eo.o && eo.o.from, to: eo.o && eo.o.to }) : 'Panels.open("era") não foi chamado; chamados: ' + opens.map(x => x.n).join(','));
  check('overlay aberto segura a batalha (PE.open, B.res.mode="era")', ev('typeof PE!=="undefined"&&PE.open') && ev('B.res&&B.res.mode') === 'era', 'PE.open=' + ev('typeof PE!=="undefined"&&PE.open') + ' B.res=' + JSON.stringify(ev('B.res')));
  /* a apresentação anda sozinha (timers) até a última folha, que pede o toque em "Começar a era" */
  const fin = await G.until(() => ev('PE.step') === 'final', 30);
  const html = ev('PE.el?PE.el.innerHTML:""');
  check('apresentação chega à folha final com "Começar a era"', fin && /data-e="start"/.test(html), 'PE.step=' + ev('PE.step') + ' passos=' + JSON.stringify(ev('PE.steps')));
  const bad = badIn(html); check('HTML da folha final sem undefined/NaN', !bad, bad);
  /* toque em "Começar a era": o mesmo que o click handler do overlay faz (data-e="start" → peClose) */
  try { G.inCtx(() => X.Panels.defs.era.close()); } catch (e) { G.frameErr.push('era.close: ' + errStr(e)); }
  check('"Começar a era" fecha o overlay e solta a batalha', !ev('PE.open') && !ev('B.res'), 'PE.open=' + ev('PE.open') + ' B.res=' + JSON.stringify(ev('B.res')));
  G.mode = 'strong'; await battleGoes(G, 'batalha segue na era 1');
  check('cenário/inimigos da era 1', ev('eraOf(S.stage)') === 1, 'eraOf(S.stage)=' + ev('eraOf(S.stage)'));
  noErr(G);
}

/* ---------------- 2. INSTÂNCIA ---------------- */
async function flowInst() {
  const G = await newGame(), { ev, sandbox: X } = G;
  check('window.startInstanceRun existe (NEXT_ON=' + ev('NEXT_ON') + ')', typeof X.startInstanceRun === 'function', 'não definido em js/instfx.js');
  check('Sys.instances com start/finish/status', ev("!!(Sys.instances&&Sys.instances.start&&Sys.instances.finish&&Sys.instances.status)"), 'faltam funções');
  if (typeof X.startInstanceRun !== 'function') return;
  const types = ev('Sys.instances.DATA.order.slice()');
  for (const [mode, win] of [['strong', true], ['weak', false]]) {
    const tag = win ? 'vitória' : 'derrota';
    G.start(60, 2, 'try{ Sys.level.ensure(S).lvl=60; }catch(e){} S.best=60;');   /* fase 60: abre os níveis de instância; nível 60: passa o portão */
    G.mode = null;
    const t = types.find(x => ev(`Sys.instances.canEnter(S,Sys.host,${JSON.stringify(x)},0).ok`));
    if (!check(tag + ': há área de instância que pode entrar (canEnter)', !!t, JSON.stringify(types.map(x => [x, ev(`Sys.instances.canEnter(S,Sys.host,${JSON.stringify(x)},0)`)])))) continue;
    const back = ev('({stage:S.stage,wave:S.wave,farm:!!S.farm})'), keys0 = ev(`Sys.instances.status(S,Sys.host).keys[${JSON.stringify(t)}]`), gold0 = ev('S.gold'), gems0 = ev('S.gems'), inv0 = ev('S.inv.length');
    let r; try { r = G.inCtx(() => X.Sys.instances.start(ev("S"), X.Sys.host, t, 0)); } catch (e) { check(tag + ': Sys.instances.start', false, errStr(e)); continue; }
    if (!check(tag + ': Sys.instances.start("' + t + '",0) ok com run.waves', r && r.ok && r.run && Array.isArray(r.run.waves) && r.run.waves.length, JSON.stringify(r).slice(0, 200))) continue;
    let st; try { st = G.inCtx(() => X.startInstanceRun(r.run)); } catch (e) { check(tag + ': startInstanceRun', false, errStr(e)); continue; }
    check(tag + ': startInstanceRun devolveu true e B.inst montado', st === true && !!ev('B.inst'), 'retorno ' + st + ', B.inst=' + !!ev('B.inst'));
    G.mode = mode; ev('if(window.PInst&&PInst.state) PInst.state.res=null; 1');
    const toasts = []; { const t0 = X.toast; X.toast = m => { toasts.push(String(m)); return t0(m); }; G.untoast = () => { X.toast = t0; }; }
    const goal = r.run.goal, time = r.run.time; let died = false;
    const ended = await G.until(() => { if (ev('B.deadT>0&&!!B.inst')) died = true; return !ev('B.inst'); }, (time > 0 ? time : 60) + 30);
    G.untoast();
    if (ended) check(tag + ': terminou por ' + (died ? 'morte do herói' : 'tempo/ondas') + ' (' + ev('S.kills') + ' abates no save; instância não conta)', true);
    if (ended) check(tag + ': jogador VÊ o resultado (tela inst aberta ou aviso)', ev('view') === 'inst' || toasts.some(m => /inst[âa]ncia/i.test(m)),
      "nada aparece: instEnd (js/instfx.js:27) chama PInst.showResult → iShow (js/p_inst.js:95) guarda XI.res e tenta Panels.open('inst'), que devolve false com PANEL_ON.inst=" + ev('PANEL_ON.inst') + '; iShow devolve true mesmo assim, então o toast reserva do instEnd não sai. view=' + ev('view') + ', avisos: ' + JSON.stringify(toasts));
    if (ended && died) check(tag + ': sem aviso da batalha normal ao morrer na instância', !toasts.some(m => /recome[çc]ando a fase/i.test(m)),
      'aparece "Derrotado... recomeçando a fase" (o toast da morte em js/battle.js não olha B.inst; quem decide a morte na instância é o step → instEnd(false)). avisos: ' + JSON.stringify(toasts));
    check(tag + ': a luta terminou e B.inst foi limpo (goal ' + goal + ', ' + time + 's)', ended, 'B.inst ainda ativo: ' + JSON.stringify(ev('B.inst&&{wi:B.inst.wi,kills:B.inst.kills,t:Math.round(B.inst.t),done:B.inst.done}')) + ', inimigos ' + ev('B.en.length') + ', deadT ' + ev('B.deadT'));
    if (!ended) continue;
    const keys1 = ev(`Sys.instances.status(S,Sys.host).keys[${JSON.stringify(t)}]`), res = ev('PInst&&PInst.state&&PInst.state.res');
    check(tag + ': resultado entregue à tela (PInst.showResult → XI.res.win=' + win + ')', res && res.win === win, 'XI.res=' + JSON.stringify(res).slice(0, 200));
    const consume = win || ev('Sys.instances.DATA.consumeOnFail');
    check(tag + ': chave ' + (consume ? 'gasta' : 'mantida (consumeOnFail=false)') + ' (' + keys0 + '→' + keys1 + ')', consume ? keys1 === keys0 - 1 : keys1 === keys0, 'chaves ' + keys0 + '→' + keys1);
    if (win) { const rw = res && res.reward || {}; const got = ev('S.gold') > gold0 || ev('S.gems') > gems0 || ev('S.inv.length') > inv0;
      check('vitória: prêmio entregue (ouro ' + gold0 + '→' + ev('S.gold') + ', gemas ' + gems0 + '→' + ev('S.gems') + ', itens ' + inv0 + '→' + ev('S.inv.length') + ')', got || !Object.keys(rw).some(k => rw[k] && (rw[k] > 0 || rw[k].length)), 'reward=' + JSON.stringify(rw).slice(0, 160)); }
    check(tag + ': voltou à fase/onda/farm de antes', ev('S.stage') === back.stage && ev('S.wave') === back.wave && !!ev('S.farm') === back.farm, 'antes ' + JSON.stringify(back) + ' depois ' + ev('JSON.stringify({stage:S.stage,wave:S.wave,farm:!!S.farm})'));
    /* a tela 'inst' abre o resultado; o jogador volta à batalha */
    G.ev("if(view!=='battle'){ if(window.PInst&&PInst.state) PInst.state.res=null; Screens.close(); } 1");
    G.mode = 'strong'; await battleGoes(G, tag + ': batalha normal retomada');
  }
  noErr(G);
}

/* ---------------- 3. VITÓRIA / DERROTA com chefe real ---------------- */
async function flowResult() {
  const G = await newGame(), { ev, sandbox: X } = G;
  ev('SCREENS_ON.bossResult=true');
  check('SCREENS_ON.bossResult ligado à força', ev('SCREENS_ON.bossResult') === true, 'objeto congelado?');
  const resHtml = () => ev('RES.el?RES.el.innerHTML:""');
  /* VITÓRIA */
  G.start(3, 5); G.mode = 'strong';
  let ok = await G.until(() => !!ev('B.res'), 120);
  check('vitória: chefe da fase 3 morreu e resOpen abriu (B.res.mode="win", RES.mode="win")', ok && ev('B.res.mode') === 'win' && ev('RES.mode') === 'win', 'B.res=' + JSON.stringify(ev('B.res')) + ' stage ' + ev('S.stage') + ' wave ' + ev('S.wave') + ' inimigos ' + ev('B.en.length'));
  if (ok) {
    check('vitória: fase avançou 3→4, onda 1', ev('S.stage') === 4 && ev('S.wave') === 1, 'stage ' + ev('S.stage') + ' wave ' + ev('S.wave'));
    let bad = badIn(resHtml()); check('vitória: HTML da tela sem undefined/NaN', !bad, bad);
    const q = attrs(resHtml(), 'data-q'); check('vitória: botão "Pular" (data-q=skip) na apresentação', q.includes('skip'), 'data-q: ' + q.join(','));
    await G.run(1.5); check('vitória: a batalha espera atrás da tela', !!ev('B.res'), 'a tela fechou sozinha cedo demais');
    try { G.inCtx(() => X.resAct('skip')); } catch (e) { G.frameErr.push('resAct(skip): ' + errStr(e)); }
    check('vitória: Pular mostra tudo (RES.end) e o "Continuar" (data-q=next)', ev('RES.end') === true && /data-q="next"/.test(ev('resActHtml(true)')), 'RES.end=' + ev('RES.end'));
    bad = badIn(resHtml()); check('vitória: HTML depois do Pular sem undefined/NaN', !bad, bad);
    try { G.inCtx(() => X.resAct('next')); } catch (e) { G.frameErr.push('resAct(next): ' + errStr(e)); }
    check('vitória: Continuar fecha a tela (B.res=null, RES.el=null)', !ev('B.res') && !ev('RES.el'), 'B.res=' + JSON.stringify(ev('B.res')));
    await battleGoes(G, 'vitória: batalha segue na fase 4');
  }
  /* DERROTA: um chefe por botão (cada botão fecha a tela de um jeito) */
  G.start(3, 5); G.mode = 'weak';
  ok = await G.until(() => !!ev('B.res'), 120);
  check('derrota: herói fraco caiu no chefe e resOpen abriu (RES.mode="lose")', ok && ev('B.res.mode') === 'lose' && ev('RES.mode') === 'lose', 'B.res=' + JSON.stringify(ev('B.res')) + ' hp ' + ev('B.hero&&B.hero.hp') + ' deadT ' + ev('B.deadT') + ' wave ' + ev('S.wave'));
  if (!ok) return noErr(G);
  const bad = badIn(resHtml()); check('derrota: HTML da tela sem undefined/NaN', !bad, bad);
  const qs = attrs(resHtml(), 'data-q'); check('derrota: botões farm e retry (data-q)', qs.includes('farm') && qs.includes('retry'), 'data-q: ' + qs.join(','));
  check('derrota: fase não avançou (3, sem ganho)', ev('S.stage') === 3, 'stage ' + ev('S.stage'));
  for (const q of qs) {
    if (!ev('B.res')) { G.start(3, 5); G.mode = 'weak'; if (!await G.until(() => !!ev('B.res'), 120)) { check('derrota [' + q + ']: reabrir', false, 'não perdeu de novo'); continue; } }
    G.mode = null; await G.until(() => ev('RES.t') >= Math.max(ev('RES_LOSE_BTN'), ev('RES_LOSE_PATH')) + 0.05, 5);   /* antes de os botões aparecerem o toque não vale */
    check('derrota [' + q + ']: tela ainda aberta antes do toque (contagem do farm não fechou)', !!ev('B.res'), 'fechou sozinha em RES.t=' + ev('RES.t'));
    try { G.inCtx(() => X.resAct(q)); } catch (e) { G.frameErr.push('resAct(' + q + '): ' + errStr(e)); }
    const after = ev('JSON.stringify({res:B.res,farm:!!S.farm,wave:S.wave,view:view,deadT:B.deadT})');
    let exp = !ev('B.res') && !ev('RES.el');
    if (q === 'farm') exp = exp && ev('S.farm') === true; else if (q === 'retry') exp = exp && ev('S.wave') === 5; else exp = exp && ev('view') === (q === 'forge' ? ev("Panels.on('forge')?'forge':'gear'") : q);
    check('derrota [' + q + ']: botão fecha a tela e faz o que diz', exp, after);
    if (ev('view') !== 'battle') ev("Screens.close(); if(view!=='battle') setView('battle'); 1");
    G.mode = 'strong'; await battleGoes(G, 'derrota [' + q + ']: batalha segue');
  }
  noErr(G);
}

(async () => {
  for (const [id, name, fn] of [['era', '1. TROCA DE ERA', flowEra], ['inst', '2. INSTÂNCIA', flowInst], ['result', '3. VITÓRIA/DERROTA', flowResult]]) {
    cur = { id, name, checks: [] }; flows.push(cur); console.log('--- ' + name + (HARD[id] ? '' : ' (EM CONFERÊNCIA)'));
    try { await fn(); } catch (e) { check('fluxo terminou sem exceção', false, errStr(e)); } }
  console.log('\n================ RESUMO ================'); let hardFail = 0;
  for (const f of flows) { const bad = f.checks.filter(c => !c.ok), tag = bad.length ? (HARD[f.id] ? 'FALHA' : 'EM CONFERÊNCIA (com problemas)') : (HARD[f.id] ? 'OK' : 'EM CONFERÊNCIA (ok)');
    if (bad.length && HARD[f.id]) hardFail++;
    console.log(tag + '  ' + f.name + ' — ' + (f.checks.length - bad.length) + '/' + f.checks.length + ' verificações');
    for (const c of (VERBOSE ? f.checks : bad)) console.log('      ' + (c.ok ? 'ok    ' : 'falha ') + c.name + (c.ok ? '' : '\n            → ' + c.err)); }
  console.log('\n' + (hardFail ? hardFail + ' fluxo(s) com FALHA' : 'fluxos duros OK') + (Object.keys(HARD).some(k => !HARD[k]) ? ' (em conferência, não reprovam: ' + Object.keys(HARD).filter(k => !HARD[k]).join(', ') + ')' : ''));
  process.exit(hardFail ? 1 : 0);
})();
