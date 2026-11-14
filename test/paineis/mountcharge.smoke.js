'use strict';
// Fumaça em Node da INVESTIDA MONTADA (js/mountcharge.js): chave desligada = nada; relógio de 12 s de luta; acerto em área pelo hitMany do herói.
// Rodar: node test/paineis/mountcharge.smoke.js   (MC_SRC: testar uma cópia antes de gravar no jogo)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), g = globalThis; g.window = g;
g.DEBUG = false; g.location = { search: '' }; g.SYS_LIVE = { mountCharge: false };
g.LW = 330; g.PX = 330 / 390; g.HX = 108 * g.PX; g.GY = 450; g.HS = 155;
const hits = [], fx = [], txts = []; let dusts = 0;
g.hitMany = (list, mult, a, h) => { hits.push({ n: list.length, ids: list.map(e => e.id), mult, type: a.type, m: h.m }); };
g.fnShock = () => {}; g.wfx = (fn, dur, o) => { fx.push(o); return o; }; g.dust = () => { dusts++; }; g.floatText = (x, y, t) => { txts.push(t); };
const mkB = () => ({ inst: null, deadT: 0, res: null, running: false, act: null, enemy: null, en: [] });
g.B = mkB(); g.HM = { mount: null };

vm.runInThisContext(fs.readFileSync(process.env.MC_SRC || path.join(R, 'js/mountcharge.js'), 'utf8'), { filename: 'mountcharge.js' });
const M = g.MountCharge, MC = M.MC; assert(M && typeof g.mcStep === 'function' && typeof g.mcLunge === 'function');
const run = (sec, dt) => { dt = dt || 0.05; for (let t = 0; t < sec - 1e-9; t += dt) g.mcStep(dt); };
const foes = () => { const a = { id: 1, x: 190, dead: false }, b = { id: 2, x: 240, dead: false }, c = { id: 3, x: 300, dead: true }, d = { id: 4, x: 440, dead: false }; g.B.en = [a, b, c, d]; g.B.enemy = a; };

/* 1. chave desligada: nada acontece, mesmo montado e com alvo */
g.HM.mount = { id: 'horse', stars: 1 }; foes(); run(30);
assert.strictEqual(M.on(), false); assert.strictEqual(hits.length, 0); assert.strictEqual(g.mcLunge(), 0); assert.strictEqual(M.state.left, MC.every); assert.strictEqual(M.info().show, false);

/* 2. ligada por ?debug=1&com=mountCharge */
g.DEBUG = true; g.location.search = '?debug=1&com=mountCharge,skillIcons'; M.setOn(null); assert.strictEqual(M.on(), true);

/* 3. sem montaria: o relógio não anda */
g.HM.mount = null; run(30); assert.strictEqual(hits.length, 0); assert.strictEqual(M.state.left, MC.every); assert.strictEqual(M.info().show, false);

/* 4. montado: dispara aos 12 s de luta, uma vez, em todos os visíveis e vivos */
g.HM.mount = { id: 'horse', stars: 1 }; foes();
run(MC.every - 0.5); assert.strictEqual(hits.length, 0, 'antes dos 12 s não dispara'); assert(M.info().show && M.info().left > 0 && M.info().left <= 0.6);
run(0.6); assert.strictEqual(M.state.run >= 0, true, 'investida em curso'); assert.strictEqual(hits.length, 0, 'o acerto vem no meio do avanço'); assert(g.mcLunge() > 0);
run(MC.hitAt); assert.strictEqual(hits.length, 1); assert.deepStrictEqual(hits[0].ids, [1, 2], 'vivos e na tela; morto e fila de espera ficam fora');
assert.strictEqual(hits[0].mult, MC.mult); assert.strictEqual(hits[0].type, 'mc', 'tipo próprio: não dá energia de ultimate no hitMany'); assert.strictEqual(fx.length, 2); assert.strictEqual(dusts, 1); assert.deepStrictEqual(txts, ['INVESTIDA']);
assert(g.mcLunge() <= MC.reach * g.PX + 1e-9);
run(MC.dur); assert.strictEqual(M.state.run, -1); assert.strictEqual(g.mcLunge(), 0, 'o herói volta ao lugar'); assert.strictEqual(hits.length, 1);
run(MC.every + MC.dur + 0.2); assert.strictEqual(hits.length, 2, 'a seguinte, 12 s depois');

/* 5. pronta, mas sem condição: espera */
M.reset(); g.B.enemy = null; run(MC.every + 3); assert.strictEqual(hits.length, 2, 'sem alvo ao alcance espera'); assert.strictEqual(M.info().left, 0);
g.B.enemy = g.B.en[0]; g.B.act = { type: 's3' }; run(2); assert.strictEqual(hits.length, 2, 'no meio da ultimate espera');
g.B.act = { type: 's1' }; g.B.running = true; run(2); assert.strictEqual(hits.length, 2, 'correndo espera');
g.B.running = false; run(MC.hitAt + 0.1); assert.strictEqual(hits.length, 3, 'com alvo e fora da ultimate dispara');

/* 6. instância: não acontece e o relógio volta ao começo; desmontar no meio cancela */
M.reset(); g.B.inst = { run: {} }; run(30); assert.strictEqual(hits.length, 3); assert.strictEqual(M.info().show, false); g.B.inst = null;
run(MC.every + 0.1); assert(M.state.run >= 0); g.HM.mount = null; g.mcStep(0.05); assert.strictEqual(M.state.run, -1); assert.strictEqual(g.mcLunge(), 0); assert.strictEqual(hits.length, 3);

/* 7. herói caído ou resultado aberto: o desenho não fica avançado */
g.HM.mount = { id: 'wolf', stars: 2 }; run(MC.every + 0.15); assert(g.mcLunge() > 0); g.B.deadT = 0.8; assert.strictEqual(g.mcLunge(), 0); g.B.deadT = 0; g.B.res = {}; assert.strictEqual(g.mcLunge(), 0); g.B.res = null;

/* 8. "reduzir movimento": acerta sem avançar o desenho */
M.reset(); g.matchMedia = () => ({ matches: true }); const n0 = hits.length; run(MC.every + 0.15); assert(M.state.run >= 0); assert.strictEqual(g.mcLunge(), 0); run(MC.hitAt); assert.strictEqual(hits.length, n0 + 1);

/* 9. erro no caminho de dano não derruba o laço */
M.reset(); g.matchMedia = undefined; g.hitMany = () => { throw new Error('x'); }; const ce = console.error; console.error = () => {}; run(MC.every + MC.dur + 0.2); console.error = ce; assert.strictEqual(M.state.run, -1);
assert.strictEqual(M.info(), M.info(), 'info devolve sempre o mesmo objeto (sem alocar)');
console.log('mountcharge.smoke: ok');
