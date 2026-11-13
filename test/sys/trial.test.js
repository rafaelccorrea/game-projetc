// node test/sys/trial.test.js — Sys.trial (Provação do Mestre: teto a cada 10 níveis, luta com regra fixa, tentar de novo grátis)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const { makeHost } = require('./_host.js');
const LV = require('../../js/sys/level.js'), F = require('../../js/sys/forge.js'), PET = require('../../js/sys/pet.js'), MT = require('../../js/sys/mentors.js');
const TR = require('../../js/sys/trial.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const world = (lvl, xp) => ({ sys: { level: { lvl: lvl || 1, xp: xp || 0 } } });
const feed = (S, h, k) => { const g = TR.gateXp(S, h, k); if (g.give) LV.addXp(S, g.give, h); return g; };

t('chave desligada: XP passa inteira, nada abre, bônus zero, função sempre aberta', () => {
  TR.DATA.on = false; const S = world(9), h = makeHost();
  assert.deepStrictEqual(TR.gateXp(S, h, 5000), { give: 5000, banked: 0, lost: 0, cap: LV.DATA.maxLevel });
  assert.strictEqual(TR.due(S, h).reason, 'off'); assert.strictEqual(TR.start(S, h).reason, 'off');
  assert.strictEqual(TR.isOpen(S, 'bonfireAuto'), true); assert.strictEqual(TR.bonus(S).atkPct, 0);
  assert.strictEqual(S.sys.trial, undefined);
});

t('marcos 10..90 (nível máximo 100); regra e mestre (mentor da era) fixos por marco', () => {
  assert.deepStrictEqual(TR.marks(), [10, 20, 30, 40, 50, 60, 70, 80, 90]);
  assert.strictEqual(TR.rule(10).id, 'nopet'); assert.strictEqual(TR.rule(20).sec, 30); assert.strictEqual(TR.rule(60).id, 'nopet');
  assert.strictEqual(TR.master(10).name, MT.byEra(0).name); assert.strictEqual(TR.master(30).name, 'Bertoldo'); assert.strictEqual(TR.master(90).era, 8);
  assert.deepStrictEqual(TR.rewardOf(10).opens.map(x => x.id), ['bonfireAuto']);
});

t('teto: o herói para no Nv 10 e a XP de sobra fica guardada (até 1 nível)', () => {
  TR.DATA.on = true; const S = world(9), h = makeHost();
  const g = feed(S, h, 100000);
  assert.strictEqual(LV.level(S), 10); assert.strictEqual(S.sys.level.xp, 0);
  assert.strictEqual(g.banked, LV.need(10)); assert.ok(g.lost > 0); assert.strictEqual(TR.ensure(S).bank, LV.need(10));
  assert.strictEqual(feed(S, h, 50).give, 0);   // banco cheio: nada entra
  const d = TR.due(S, h); assert.ok(d.due && d.lvl === 10 && d.atCap); assert.strictEqual(d.rule.id, 'nopet');
  assert.ok(TR.view(S, h).atCap);
});

t('perder não custa nada e tentar de novo é grátis; vencer sobe o teto, dá prêmio e devolve a XP guardada', () => {
  TR.DATA.on = true; const S = world(9), h = makeHost(); feed(S, h, 100000);
  const s1 = TR.start(S, h); assert.ok(s1.ok); assert.ok(s1.spec.noPet); assert.strictEqual(s1.spec.sec, 60);
  const gold0 = h.gold; const l1 = TR.finish(S, h, { won: false });
  assert.ok(l1.ok && !l1.won && l1.retry && l1.free); assert.strictEqual(h.gold, gold0);
  for (let i = 0; i < 5; i++) { TR.start(S, h); TR.finish(S, h, { won: false }); }
  assert.strictEqual(TR.view(S, h).list[0].tries, 6);
  TR.start(S, h); const w = TR.finish(S, h, { won: true, sec: 40 });
  assert.ok(w.won); assert.strictEqual(w.lvl, 10); assert.ok(w.reward.gold > 0); assert.strictEqual(w.reward.stones, 4); assert.strictEqual(w.reward.food, 20);
  assert.strictEqual(F.ensure(S).stones, 4); assert.strictEqual(PET.ensure(S).food, 20);
  assert.strictEqual(LV.level(S), 11); assert.strictEqual(TR.ensure(S).bank, 0); assert.strictEqual(w.cap, 20);
  assert.deepStrictEqual(TR.bonus(S), { atkPct: 1, hpPct: 1, goldPct: 0, critPct: 0, defPct: 0, fc: 0 });
  assert.strictEqual(TR.isOpen(S, 'bonfireAuto'), true); assert.strictEqual(TR.isOpen(S, 'loadoutsAuto'), false);
  assert.strictEqual(TR.start(S, h, 10).reason, 'done'); assert.strictEqual(TR.start(S, h, 20).reason, 'level');
});

t('"Só 30 s": vencer depois do tempo conta como derrota', () => {
  TR.DATA.on = true; const S = world(20), h = makeHost(); TR.ensure(S).passed['10'] = 1;
  const s = TR.start(S, h, 20); assert.ok(s.ok); assert.strictEqual(s.spec.sec, 30);
  const r = TR.finish(S, h, { won: true, sec: 31 }); assert.ok(!r.won && r.late);
  TR.start(S, h, 20); assert.ok(TR.finish(S, h, { won: true, sec: 29 }).won);
  assert.strictEqual(TR.finish(S, h, { won: true }).reason, 'none');   // sem luta começada
});

t('save antigo acima do marco: o nível não desce; teto é o próximo marco; provações antigas ficam abertas', () => {
  TR.DATA.on = true; const S = world(35), h = makeHost();
  assert.strictEqual(TR.cap(S, h), 40); assert.deepStrictEqual(TR.dueList(S, h), [10, 20, 30]);
  assert.ok(feed(S, h, 50).give === 50); assert.strictEqual(LV.level(S), 35);
  TR.start(S, h, 20); assert.ok(TR.finish(S, h, { won: true }).won); assert.strictEqual(TR.bonus(S).atkPct, 1);
});

t('teto desligado (DATA.cap=false): só a luta e o prêmio', () => {
  TR.DATA.on = true; TR.DATA.cap = false; const S = world(9), h = makeHost();
  feed(S, h, 5000); assert.ok(LV.level(S) > 10); TR.DATA.cap = true;
});

t('save sujo é limpo', () => {
  TR.DATA.on = true; const S = { sys: { trial: { passed: { 10: 5, 15: 1, x: 1 }, tries: { 20: 3, 7: 2 }, bank: -4, cur: { lvl: 13 } } } };
  const o = TR.ensure(S); assert.deepStrictEqual(o.passed, { 10: 5 }); assert.deepStrictEqual(o.tries, { 20: 3 }); assert.strictEqual(o.bank, 0); assert.strictEqual(o.cur, null);
});

TR.DATA.on = false;
console.log(`trial: ${n} testes ok`);
