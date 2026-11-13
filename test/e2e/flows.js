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
const HARD = { era: true, inst: true, result: true, phases: true, heroFull: true };   /* phases: duro no lado do Sys; partida e animação são checks EM CONFERÊNCIA (soft) */   /* inst: PANEL_ON.inst ligada (pedido A-22) e fluxo 26/26 */
const DT = 1 / 30;
const boot = require('./sandbox'), errStr = boot.errStr;

const flows = [];   // {id, name, checks:[{name, ok, err}], errs:[]}
let cur = null;
/* soft = parte EM CONFERÊNCIA dentro de um fluxo duro: aparece com o problema, mas não reprova */
const check = (name, ok, err, soft) => { cur.checks.push({ name, ok: !!ok, err: ok ? '' : (err || ''), soft: !!soft }); if (VERBOSE || !ok) console.log((ok ? '  OK    ' : soft ? '  EM CONFERÊNCIA ' : '  FALHA ') + cur.id + ' · ' + name + (ok || !err ? '' : ' → ' + err)); return !!ok; };
const BAD = ['undefined', 'NaN', '[object Object]'];
const badIn = h => { if (typeof h !== 'string' || !h.trim()) return 'HTML vazio'; const t = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const b of BAD) { const i = t.indexOf(b); if (i >= 0) return 'contém "' + b + '": …' + t.slice(Math.max(0, i - 70), i + b.length + 30).replace(/\s+/g, ' ') + '…'; } return null; };
const attrs = (h, a) => { const out = [], re = new RegExp('\\b' + a + '="([^"]*)"', 'g'); let m; while ((m = re.exec(h))) if (!out.includes(m[1])) out.push(m[1]); return out; };

/* ---------------- jogo + laço manual ---------------- */
async function newGame(opts) {
  const loadErr = [];
  const G = boot({ realFetch: true, ...(opts || {}), add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } });
  const { ev, inCtx } = G;
  check('jogo carregou (' + G.lists.sysOrder.length + ' js/sys, ' + G.lists.jsList.length + ' js, ' + G.lists.panList.length + ' do screens.js)', !loadErr.length, loadErr.slice(0, 4).join(' | '));
  /* herói: 'strong' = ATK e vida enormes a cada quadro (como o ?lord= do index); 'weak' = sem dano e com 1 de vida; null = o do jogo */
  G.mode = null; G.frameErr = []; G.frames = 0;
  G.hero = () => { const h = ev('B.hero'); if (!h) return; if (G.mode === 'strong') { h.atk = 1e15; h.maxhp = 1e15; h.hp = 1e15; h.def = 1e9; } else if (G.mode === 'weak') { h.atk = 1e-6; h.critRate = 0; h.hp = Math.min(h.hp, 1); } };
  /* um quadro do loop() de js/battle.js (step, petStep, instStep na velocidade do jogo; resTick; tickFx), sem draw(); os timers andam no relógio virtual */
  sandbox(G).__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { const n = B.speed || 1; for (let i = 0; i < n; i++) { G.hero(); ev('step')(dt); if (typeof sandbox(G).petStep === 'function') ev('petStep')(dt); if (B.inst && typeof sandbox(G).instStep === 'function') ev('instStep')(dt); } }
    if (typeof sandbox(G).resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); if (G.drawOn) ev('draw')(); };   /* drawOn: também o draw() (canvas que grava, sandbox draw:true) */
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
  /* depois da partida real (runBoot): a entrada nova (js/p_intro.js, overlay) abre sozinha e pausa a batalha; o teste fecha como o jogador (PI.finish) */
  G.settle = async () => { G.introSeen = false; await G.until(() => { try { return ev("typeof PI!=='undefined'&&!!PI.el"); } catch (e) { return false; } }, 2); try { G.introSeen = ev("typeof PI!=='undefined'&&!!PI.el"); if (G.introSeen) G.inCtx(() => ev('PI.finish()')); } catch (e) { G.frameErr.push('PI.finish: ' + errStr(e)); } await G.run(0.6); };
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
  /* Engenheiro 2: com a tela 10 ligada a ordem é VITÓRIA → "Continuar" → TROCA DE ERA (o jogo guarda a era em B.eraPend e abre quando a vitória fecha) */
  if (ev('B.res&&B.res.mode') === 'win') {
    check('vitória do Senhor da Era abre ANTES da Troca de era (B.eraPend guardada, overlay ainda fechado)', !!ev('B.eraPend') && !opens.find(x => x.n === 'era'), 'eraPend=' + !!ev('B.eraPend') + ' abertos: ' + opens.map(x => x.n).join(','));
    try { G.inCtx(() => X.resClose('next')); } catch (e) { G.frameErr.push('resClose: ' + errStr(e)); }   /* o mesmo que o botão "Continuar" faz */
    await G.until(() => !!opens.find(x => x.n === 'era'), 10);
  }
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

/* ---------------- ajudas dos fluxos 4 e 5 ---------------- */
const fsx = require('fs'), pathx = require('path');
/* "arquivo:linha" da primeira linha que casa (para apontar onde o jogo pula algo; acompanha as edições do engenheiro) */
const lineOf = (G, file, re) => { try { const L = G.rd(file).split('\n'); const i = L.findIndex(l => re.test(l)); return i >= 0 ? file + ':' + (i + 1) : file + ':?'; } catch (e) { return file + ':?'; } };
/* quem no código do jogo (index.html + js/*.js, fora js/sys) chama f( */
const callersOf = (G, f) => { const out = [], re = new RegExp('\\b' + f.replace(/\./g, '\\.') + '\\s*\\('), def = new RegExp('function\\s+' + f.split('.').pop() + '\\s*\\(');
  const files = ['index.html'].concat(fsx.readdirSync(pathx.join(G.ROOT, 'js')).filter(x => /\.js$/.test(x)).map(x => 'js/' + x));
  for (const f2 of files) { let L; try { L = G.rd(f2).replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, ' ')).split('\n'); } catch (e) { continue; }   /* comentários de bloco não contam */ L.forEach((l, i) => { if (re.test(l) && !def.test(l) && !/^\s*(\/\*|\*|\/\/)/.test(l)) out.push(f2 + ':' + (i + 1)); }); } return out; };
const tapDraws = G => { const s = new Set(); G.setDrawTap(x => s.add(x)); return s; };
const has = (set, re) => [...set].some(x => re.test(x));
const pick = (set, re) => [...set].filter(x => re.test(x)).slice(0, 6).join(', ');
/* a partida do index pode ter deixado título/tutorial: o laço é o nosso */
const SAFE_START = "S.tut=99; S.welcome=true; S.name=S.name||'Kael'; B.paused=false; B.res=null; B.inst=null; view='battle';";

/* ---------------- 4. HERÓI SEM CRESCIMENTO + SKINS FIXAS (decisão final do dono, 12/11) ---------------- */
async function flowPhases() {
  /* (a) SAVE ANTIGO que já EVOLUIU (Nv 60, fase 2 gravada) → na carga volta ao corpo PADRÃO, sem perder nível nem poder */
  for (const hero of ['kael', 'kaia']) { const T = hero === 'kaia' ? 'Kaia' : 'Kael', def = hero === 'kaia' ? /hyb\/kaia\// : /hyb\/R\//;
    const G0 = await newGame(); const key = G0.ev('SAVE_KEY');
    const save = G0.ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.hero='${hero}'; S.name='${T}'; S.tut=99; S.welcome=true; S.stage=60; S.wave=1; S.best=60; S.eraMax=5; S.kills=20000;
      try{ if(Sys.appearance.setHero) Sys.appearance.setHero(S,'${hero}'); }catch(e){} const L=Sys.level.ensure(S); L.lvl=60; L.xp=0; L.stg=2; Sys.phaseUp.ensure(S).stg=2; S.lastSeen=Date.now(); return JSON.stringify(S); })()`);
    const G = await newGame({ search: '?debug=1', storage: { [key]: save }, runBoot: true, draw: true }); const { ev } = G; await G.settle();
    check(T + ' Nv 60: save antigo carregado (nível 60)', ev('Sys.level.level(S)') === 60 && ev('S.hero') === hero, 'nível ' + ev('Sys.level.level(S)') + ' herói ' + ev('S.hero'));
    check(T + ': Sys.phaseUp aposentado (retired) mesmo com o boot ligando DATA.on: current() = 0', ev('Sys.phaseUp.DATA.retired') === true && ev('Sys.phaseUp.current(S)') === 0, 'retired ' + ev('Sys.phaseUp.DATA.retired') + ' current ' + ev('Sys.phaseUp.current(S)'));
    check(T + ': nada em fila (pending vazio) e o save guarda a fase antiga (nada apagado)', ev('Sys.phaseUp.pending(S,Sys.host).ready') === false && ev('Sys.phaseUp.ensure(S).stg') === 2, JSON.stringify(ev('Sys.phaseUp.pending(S,Sys.host)')));
    const sh = ev("Sys.appearance.sheetFor(S,Sys.host,'idle')");
    check(T + ' (Sys): sheetFor idle no corpo padrão → ' + sh.body + ' (escala ' + sh.scale + ')', def.test(String(sh.body)) && sh.scale === 1 && !sh.skin, JSON.stringify(sh));
    check(T + ' (Sys): avatar padrão ' + ev('Sys.appearance.avatarKey(S,Sys.host)'), ev('Sys.appearance.avatarKey(S,Sys.host)') === hero + '_phase0', ev('Sys.appearance.avatarKey(S,Sys.host)'));
    G.drawOn = true; ev(SAFE_START + ' 1'); const d = tapDraws(G); G.mode = 'strong'; await G.run(5);
    check(T + ': as folhas do herói desenhadas vêm do corpo padrão (' + (hero === 'kaia' ? 'kaia' : 'R') + ')', has(d, def) && !has(d, /hyb\/(kaia_)?phase\d\//), 'folhas do herói desenhadas: ' + (pick(d, /hyb\/(R|phase\d|kaia[^/]*)\//) || '(nenhuma)'), true);
    check(T + ': nenhuma animação de evolução na carga', !ev('B.evo'), 'B.evo = ' + JSON.stringify(ev('B.evo?{sheet:B.evo.sheet,from:B.evo.from,to:B.evo.to}:null')), true);
    noErr(G, T + ': nenhuma exceção na carga e no laço');
  }
  /* (b) 34 → 35 com skin de roupa + óculos: NÃO evolui, camadas iguais */
  const G = await newGame({ search: '?debug=1&fresh=1', runBoot: true, draw: true }), { ev, sandbox: X } = G; await G.settle();
  const keys = () => ev('JSON.stringify(Sys.appearance.layers(S,Sys.host).map(l=>l.layer+":"+l.key).sort())');
  const setup = ev(`(function(){ ${SAFE_START} const L=Sys.level.ensure(S); L.lvl=34; L.xp=0;
    if(!S.skins.includes('a43')) S.skins.push('a43'); S.skinEq.armor='a43'; const m=Sys.appearance.setMode(S,'skin'); const c=Sys.appearance.addCosmetic(S,'goggles'), e=Sys.appearance.equipCosmetic(S,'glasses','goggles');
    startBattle(); return {mode:m, eq:e, lvl:Sys.level.level(S), stg:Sys.phaseUp.current(S)}; })()`);
  check('34→35: Nv 34, modo "skin", óculos equipados, fase 0', setup.mode && setup.eq && setup.lvl === 34 && setup.stg === 0, JSON.stringify(setup));
  const k0 = keys();
  let lr = null; try { lr = G.inCtx(() => X.Sys.level.addXp(ev('S'), X.Sys.level.need(34) - ev('Sys.level.ensure(S).xp'), X.Sys.host)); } catch (e) { lr = { err: errStr(e) }; }
  check('34→35: XP pelo caminho real (Sys.level.addXp) sobe para 35', lr && lr.from === 34 && lr.to === 35, JSON.stringify(lr));
  let lvErr = null; try { G.inCtx(() => X.onLevelUp(lr)); } catch (e) { lvErr = errStr(e); }
  check('34→35: onLevelUp do jogo (' + lineOf(G, 'js/farm.js', /function onLevelUp/) + ') sem exceção', !lvErr, lvErr, true);
  check('34→35: o herói NÃO evolui (fase 0, pending vazio)', ev('Sys.phaseUp.current(S)') === 0 && ev('Sys.phaseUp.pending(S,Sys.host).ready') === false, 'fase ' + ev('Sys.phaseUp.current(S)'));
  check('34→35: Sys.appearance.layers iguais antes e depois', k0 === keys(), 'antes ' + k0 + ' | depois ' + keys());
  /* (c) SKINS (dono, 12/11): as 4 adultas SAÍRAM (off, não apagadas); toda skin nova usa o corpo PADRÃO (mesma pasta/âncoras/escala, só troca a folha) */
  const fx = ev(`(function(){ const A=Sys.appearance, sk0=Sys.skin.bonus(S).atkPct; const list=A.fixedSkins(S,Sys.host);
    const ret=['kael_knight','kael_legend','kaia_knight','kaia_legend'].map(id=>A.grantFixed(S,id,{owner:true}).reason+'/'+A.equipFixed(S,id).reason);
    S.look.fixed={owned:['kael_knight'],eq:{kael:'kael_knight'}}; const old=A.sheetFor(S,Sys.host,'idle'), oldAv=A.avatarKey(S,Sys.host), oldSk=Math.round((Sys.skin.bonus(S).atkPct-sk0)*1e6)/1e6;
    A.addFixed({id:'e2e_kael',name:'Teste Kael',hero:'kael',dir:'R',r:3,avatar:'kael_phase0',sources:['offer']}); const g=A.grantFixed(S,'e2e_kael',{source:'offer'}), e=A.equipFixed(S,'e2e_kael');
    const idle=A.sheetFor(S,Sys.host,'idle'), card=A.sheetFor(S,Sys.host,'idle',{skin:'default'}).body;
    return {n:list.length, ret, old:{body:old.body,scale:old.scale,skin:old.skin}, oldAv, oldSk, g:g.ok, e:e.ok, idle, card, vit:A.fixedSkins(S,Sys.host).map(x=>x.id)}; })()`);
  check('vitrine sem as 4 adultas (fixedSkins = [])', fx.n === 0, 'fixedSkins: ' + fx.n);
  check('as 4 adultas recusam obter e equipar, até no Modo dono (retired)', fx.ret.every(x => x === 'retired/retired'), JSON.stringify(fx.ret));
  check('save que tinha Kael Cavaleiro equipado: corpo padrão R, escala 1, avatar kael_phase0, sem bônus (nada apagado)', /hyb\/R\/kael_idle_body$/.test(fx.old.body) && fx.old.scale === 1 && !fx.old.skin && fx.oldAv === 'kael_phase0' && fx.oldSk === 0 && ev('S.look.fixed.owned.includes("kael_knight")'), JSON.stringify(fx));
  check('skin nova (gancho addFixed, fonte offer): entrega e equipa no corpo padrão, escala 1; aparece na vitrine', fx.g && fx.e && fx.idle.skin === 'e2e_kael' && fx.idle.scale === 1 && fx.vit.join() === 'e2e_kael', JSON.stringify({ g: fx.g, e: fx.e, idle: fx.idle, vit: fx.vit }));
  check('cartão da vitrine: sheetFor(..., {skin:"default"}) → corpo padrão ' + fx.card, /hyb\/R\/kael_idle_body$/.test(fx.card), fx.card);
  G.drawOn = true; const d = tapDraws(G); G.mode = 'strong'; ev(SAFE_START + ' 1'); await G.run(4);
  check('batalha desenha o corpo padrão (hyb/R), nenhuma pasta adulta', has(d, /hyb\/R\//) && !has(d, /hyb\/(kaia_)?phase\d\//), 'corpo desenhado: ' + (pick(d, /hyb\/(R|phase\d|kaia[^/]*)\//) || '(nenhum)'), true);
  ev('Sys.appearance.equipFixed(S,null); 1');
  check('voltar ao padrão: sheetFor idle → R', /hyb\/R\//.test(ev("Sys.appearance.sheetFor(S,Sys.host,'idle').body")), ev("Sys.appearance.sheetFor(S,Sys.host,'idle').body"));
  noErr(G, 'skins fixas: nenhuma exceção no laço (com desenho)');
}

/* ---------------- 5. drawHeroFull com pet + montaria + asa ---------------- */
async function flowHeroFull() {
  const G = await newGame({ search: '?debug=1&fresh=1', runBoot: true, draw: true }), { ev, sandbox: X } = G; await G.settle();
  const pet = ev(`(function(){ ${SAFE_START} const L=Sys.level.ensure(S); L.lvl=50; L.xp=0; S.stage=3; S.best=12; S.wave=1; S.farm=false;
    Sys.pet.DATA.v3=true; Sys.pet.DATA.v20.on=true; Sys.pet.setV17(true); const o=Sys.pet.ensure(S); const tried=[];
    for(const p of Sys.pet.DATA.pets){ o.owned={}; o.owned[p.id]={stars:1,lvl:1}; o.eq=p.id; Sys.pet.ensure(S); const i=Sys.pet.battleInfo(S,Sys.host); tried.push(p.id+':'+(i&&i.draw&&i.draw.base)); if(i&&i.draw&&i.draw.base) return {id:p.id, base:i.draw.base, tried}; }
    return {id:null, tried}; })()`);
  const petFile = pet.base ? fsx.existsSync(pathx.join(G.ROOT, 'assets/anim/pets', pet.base + '_idle.png')) : false;
  check('pet equipado (Sys.pet v3+v20+v17): ' + pet.id + ' → assets/anim/pets/' + pet.base + '_idle.png' + (petFile ? '' : ' (ARQUIVO NÃO EXISTE)'), !!pet.id && petFile, JSON.stringify(pet.tried));
  const mt = ev(`(function(){ Sys.mount.DATA.on=true; Sys.mount.DATA.visual=true; const ids=Object.keys(typeof MOUNT_TBL!=='undefined'?MOUNT_TBL:{}); const id=ids.includes('wolf')?'wolf':ids[0];
    const a=Sys.mount.add(S,Sys.host,id), e=Sys.mount.equip(S,id); return {id, a, e, look:typeof mountLook==='function'?mountLook():null, ids}; })()`);
  check('montaria equipada (Sys.mount on+visual, add+equip): ' + mt.id, mt.e && mt.look && mt.look.id === mt.id, JSON.stringify(mt));
  const wg = ev(`(function(){ addItemToBag({slot:'wing',r:3,e:0,wing:'angel'}); const it=S.inv.filter(x=>x.slot==='wing').pop(); if(it) S.eq.wing=it.id; statsChanged(); refreshHero();
    return {id:it&&it.id, art:it?wingArt(it):null, look:heroLook().wing, lvl:Sys.level.level(S)}; })()`);
  check('asa equipada (item slot wing, wing:"angel", Nv ' + wg.lvl + '): heroLook().wing = ' + wg.look, wg.look === 'angel', JSON.stringify(wg));
  const calls = { n: 0 }; { const f0 = X.drawHeroFull; if (typeof f0 === 'function') X.drawHeroFull = function () { calls.n++; return f0.apply(this, arguments); }; }
  check('window.drawHeroFull existe (' + lineOf(G, 'js/battle.js', /^function drawHeroFull/) + ')', typeof X.drawHeroFull === 'function', 'não definido');
  G.drawOn = true; G.mode = 'strong'; const d = tapDraws(G);
  /* VITÓRIA (bossResult forçado) */
  ev(`SCREENS_ON.bossResult=true; B.paused=false; S.stage=3; S.wave=5; S.farm=false; B.res=null; view='battle'; startBattle(); 1`);
  const won = await G.until(() => ev('!!(B.res&&B.res.mode==="win")'), 120);
  check('vitória com pet+montaria+asa: resOpen("win")', won, 'B.res=' + JSON.stringify(ev('B.res')) + ' · '+ev('JSON.stringify({stage:S.stage,wave:S.wave,farm:S.farm,en:B.en.map(e=>e.kind+(e.boss?"*":"")+":"+Math.round(e.hp)),toSpawn:B.toSpawn,waveT:B.waveT,deadT:B.deadT,paused:B.paused,res:B.res,hp:B.hero&&B.hero.hp,kills:S.kills,evo:!!B.evo,tut:S.tut,view:view})'));
  if (won) { await G.run(1); try { G.inCtx(() => { X.resAct('skip'); X.resAct('next'); }); } catch (e) { G.frameErr.push('resAct: ' + errStr(e)); } await G.run(2); }
  const nWin = calls.n;
  /* TROCA DE ERA */
  ev(`B.paused=false; S.stage=STAGES_PER_ERA; S.wave=5; S.eraMax=0; S.best=Math.max(S.best,S.stage); B.res=null; view='battle'; startBattle(); 1`);
  const era = await G.until(() => ev('S.eraMax') >= 1, 240);
  check('troca de era com pet+montaria+asa: era 0→1', era, 'eraMax ' + ev('S.eraMax') + ' stage ' + ev('S.stage') + ' · '+ev('JSON.stringify({stage:S.stage,wave:S.wave,farm:S.farm,en:B.en.map(e=>e.kind+(e.boss?"*":"")+":"+Math.round(e.hp)),toSpawn:B.toSpawn,waveT:B.waveT,deadT:B.deadT,paused:B.paused,res:B.res,hp:B.hero&&B.hero.hp,kills:S.kills,evo:!!B.evo,tut:S.tut,view:view})'));
  if (era) { await G.until(() => ev('typeof PE!=="undefined"&&PE.step==="final"'), 30); try { G.inCtx(() => X.Panels.defs.era.close()); } catch (e) { G.frameErr.push('era.close: ' + errStr(e)); } await G.run(3); }
  const who = callersOf(G, 'drawHeroFull');
  check('drawHeroFull chamado na vitória e na troca de era (vitória ' + nWin + 'x, total ' + calls.n + 'x)', calls.n > 0,
    'nenhuma chamada: hoje só ' + (who.join(', ') || 'ninguém') + ' chama drawHeroFull; a batalha, a Vitória e a Troca de era desenham pelo draw() → drawHero(HM) + drawPet() (' + lineOf(G, 'js/battle.js', /drawHero\(HM\); drawLevelUp\(\)/) + ')', true);   // EM CONFERÊNCIA: pet, montaria e asa APARECEM (checado acima); o engenheiro decide se essas telas passam pelo drawHeroFull
  const hfErr = ev('!!window.__hfErr') || G.consoleErrs.some(m => /drawHeroFull/.test(m));
  check('drawHeroFull / desenho sem exceção', !hfErr && !G.frameErr.length, (hfErr ? 'drawHeroFull pegou erro: ' + G.consoleErrs.filter(m => /drawHeroFull/.test(m)).join(' | ') + ' ' : '') + G.frameErr.slice(0, 4).join(' | '));
  check('canvas da batalha recebeu o pet (pets/)', has(d, /anim\/pets\//), 'nenhuma folha de pet desenhada');
  check('canvas da batalha recebeu a montaria (mounts/)', has(d, /anim\/mounts\//), 'nenhuma folha de montaria desenhada');
  check('canvas da batalha recebeu a asa (wing)', has(d, /wing/), 'nenhuma imagem de asa desenhada');
  /* chamada DIRETA do drawHeroFull num canvas próprio: cada parte, e onde ele pula a que faltar */
  const cv = G.mkCanvas(false); cv.__tap = true; const d2 = tapDraws(G); let dErr = null; const before = ev('!!window.__hfErr');
  try { G.inCtx(() => X.drawHeroFull(cv.getContext('2d'), 195, 600, 1, {})); } catch (e) { dErr = errStr(e); }
  G.setDrawTap(null);
  const st = ev("({wing:HFULL.wing, mount:HFULL.mount&&HFULL.mount.id, mountReady:HFULL.mount?mountReady(HFULL.mount.id):null, pet:!!petInfo(), petSheet:!!(petSheet('idle')&&petSheet('idle').ok), hf:!!window.__hfErr})");
  const got = [...d2].slice(0, 8).join(', ');
  check('drawHeroFull direto: sem exceção', !dErr && !(st.hf && !before), dErr || G.consoleErrs.filter(m => /drawHeroFull/.test(m)).join(' | '));
  check('drawHeroFull direto: desenha o pet', has(d2, /anim\/pets\//), 'pet não desenhado (petInfo=' + st.pet + ', folha idle carregada=' + st.petSheet + '); drawPet sai cedo em ' + lineOf(G, 'js/petfx.js', /^function drawPet\(\)/) + ' · desenhado: ' + got);
  check('drawHeroFull direto: desenha a montaria', has(d2, /anim\/mounts\//), 'montaria não desenhada (HFULL.mount=' + st.mount + ', mountReady=' + st.mountReady + '); drawHeroMounted sai em ' + lineOf(G, 'js/mountfx.js', /^function drawHeroMounted/) + ' · desenhado: ' + got);
  check('drawHeroFull direto: desenha a asa', has(d2, /wing/), 'asa não desenhada (HFULL.wing=' + st.wing + '); drawWingsAt sai em ' + lineOf(G, 'js/stage.js', /^function drawWingsAt/) + ' · desenhado: ' + got);
  noErr(G);
}

(async () => {
  for (const [id, name, fn] of [['era', '1. TROCA DE ERA', flowEra], ['inst', '2. INSTÂNCIA', flowInst], ['result', '3. VITÓRIA/DERROTA', flowResult], ['phases', '4. HERÓI SEM CRESCIMENTO + SKINS FIXAS', flowPhases], ['heroFull', '5. drawHeroFull (pet + montaria + asa)', flowHeroFull]]) {
    cur = { id, name, checks: [] }; flows.push(cur); console.log('--- ' + name + (HARD[id] ? '' : ' (EM CONFERÊNCIA)'));
    try { await fn(); } catch (e) { check('fluxo terminou sem exceção', false, errStr(e)); } }
  console.log('\n================ RESUMO ================'); let hardFail = 0;
  for (const f of flows) { const bad = f.checks.filter(c => !c.ok), hb = bad.filter(c => !c.soft), tag = hb.length && HARD[f.id] ? 'FALHA' : !HARD[f.id] ? (bad.length ? 'EM CONFERÊNCIA (com problemas)' : 'EM CONFERÊNCIA (ok)') : bad.length ? 'OK (com partes EM CONFERÊNCIA)' : 'OK';
    if (hb.length && HARD[f.id]) hardFail++;
    console.log(tag + '  ' + f.name + ' — ' + (f.checks.length - bad.length) + '/' + f.checks.length + ' verificações');
    for (const c of (VERBOSE ? f.checks : bad)) console.log('      ' + (c.ok ? 'ok    ' : c.soft ? 'em conferência ' : 'falha ') + c.name + (c.ok ? '' : '\n            → ' + c.err)); }
  console.log('\n' + (hardFail ? hardFail + ' fluxo(s) com FALHA' : 'fluxos duros OK') + (Object.keys(HARD).some(k => !HARD[k]) ? ' (em conferência, não reprovam: ' + Object.keys(HARD).filter(k => !HARD[k]).join(', ') + ')' : ''));
  process.exit(hardFail ? 1 : 0);
})();
