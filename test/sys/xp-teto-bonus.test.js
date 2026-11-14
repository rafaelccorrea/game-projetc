// node test/sys/xp-teto-bonus.test.js — Sys.level.addXp: o bônus de XP (xpPerkPct) entra UMA vez, no ganho bruto, ANTES do teto da Provação (Sys.trial)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const { makeHost } = require('./_host.js');
const LV = require('../../js/sys/level.js');
require('../../js/sys/forge.js'); require('../../js/sys/pet.js'); require('../../js/sys/mentors.js');
const TR = require('../../js/sys/trial.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const world = (lvl, xp) => ({ sys: { level: { lvl: lvl || 1, xp: xp || 0 } } });
// bônus de XP forçado pela Encruzilhada (o xpPerkPct lê Sys.crossroads.perks(S).xpPct com DATA.on === true)
const bonus = p => { if (p) globalThis.Sys.crossroads = { DATA: { on: true }, perks: () => ({ xpPct: p }), bonus: () => ({}) }; else delete globalThis.Sys.crossroads; };
const on0 = TR.DATA.on, cap0 = TR.DATA.cap;
const N9 = LV.need(9), N10 = LV.need(10);   // 125 e 322 na tabela de hoje

t('caso do Engenheiro: Nv 9 + 700 XP com +60% para no Nv 10 com 0 XP; cofre cheio com XP já com bônus', () => {
  TR.DATA.on = true; TR.DATA.cap = true; bonus(60); const S = world(9), h = makeHost();
  const r = LV.addXp(S, 700, h);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 0);   // antes do conserto: Nv 10 com 75
  assert.strictEqual(r.gained, N9); assert.strictEqual(r.levels, 1); assert.strictEqual(r.to, 10);
  assert.strictEqual(TR.ensure(S).bank, Math.min(N10, Math.round(700 * 1.6) - N9));
});

t('o cofre guarda o restante JÁ com o bônus (cabe inteiro)', () => {
  TR.DATA.on = true; bonus(60); const S = world(9), h = makeHost();
  const r = LV.addXp(S, 200, h);   // 200 × 1,6 = 320: 125 sobem o nível, 195 vão para o cofre
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 0);
  assert.strictEqual(r.gained, N9); assert.strictEqual(TR.ensure(S).bank, 320 - N9);
});

t('vencer a Provação devolve o cofre SEM bônus de novo (src trial)', () => {
  TR.DATA.on = true; bonus(60); const S = world(9), h = makeHost();
  LV.addXp(S, 200, h); const bank = TR.ensure(S).bank; assert.strictEqual(bank, 320 - N9);
  assert.ok(TR.start(S, h, 10).ok); const f = TR.finish(S, h, { won: true, sec: 10 });
  assert.ok(f.won); assert.strictEqual(f.released, bank);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, bank);   // 195, não 195 × 1,6
  assert.strictEqual(TR.ensure(S).bank, 0);
  const r = LV.addXp(S, 7, h, 'trial'); assert.strictEqual(r.gained, 7);           // devolução direta: sem bônus
});

t('sem bônus: igual a antes (teto corta o bruto; com a Provação desligada a XP passa inteira)', () => {
  bonus(0);
  TR.DATA.on = true; let S = world(9), h = makeHost(); let r = LV.addXp(S, 200, h);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 0); assert.strictEqual(r.gained, N9);
  assert.strictEqual(TR.ensure(S).bank, 200 - N9);
  TR.DATA.on = false; S = world(9); h = makeHost(); r = LV.addXp(S, 200, h);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 200 - N9); assert.strictEqual(r.gained, 200);
});

t('bônus com a Provação desligada: +60% inteiro, nada guardado', () => {
  TR.DATA.on = false; bonus(60); const S = world(9), h = makeHost(); const r = LV.addXp(S, 200, h);
  assert.strictEqual(r.gained, 320); assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 320 - N9);
  assert.strictEqual(S.sys.trial, undefined);
});

t('cofre cheio: o excedente é descartado e gained = 0 (com e sem bônus)', () => {
  TR.DATA.on = true; bonus(60); const S = world(9), h = makeHost();
  LV.addXp(S, 100000, h); assert.strictEqual(TR.ensure(S).bank, N10);
  let r = LV.addXp(S, 50, h); assert.strictEqual(r.gained, 0); assert.strictEqual(r.levels, 0);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 0); assert.strictEqual(TR.ensure(S).bank, N10);
  bonus(0); r = LV.addXp(S, 50, h); assert.strictEqual(r.gained, 0); assert.strictEqual(TR.ensure(S).bank, N10);
});

bonus(0); TR.DATA.on = on0; TR.DATA.cap = cap0;
console.log(`\n${n} testes ok (xp-teto-bonus)`);
