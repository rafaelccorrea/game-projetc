// node test/sys/mentors.test.js — Sys.mentors (Mentores das Eras: presentes de peças e materiais, marcos de amizade, fala, título)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const LV = require('../../js/sys/level.js'), F = require('../../js/sys/forge.js'), PET = require('../../js/sys/pet.js'), TI = require('../../js/sys/titles.js'),
  BF = require('../../js/sys/bonfire.js');
const MT = require('../../js/sys/mentors.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

function world(lvl, eraMax) {
  const S = { inv: [], eq: {}, sys: { level: { lvl: lvl == null ? 20 : lvl, xp: 0 } } }; let id = 1;
  const add = (slot, r, e, on) => { const it = { id: id++, slot, r, e, lvl: 1 }; S.inv.push(it); if (on) S.eq[slot] = it.id; return it; };
  const host = { changes: 0, t: Date.UTC(2026, 10, 13, 15), items: () => S.inv, eraMax: () => eraMax == null ? 2 : eraMax,
    equipped: () => { const r = {}; for (const s in S.eq) { const it = S.inv.find(x => x.id === S.eq[s]); if (it) r[s] = it; } return r; },
    removeItem: it => { S.inv = S.inv.filter(x => x.id !== it.id); }, onChange: () => { host.changes++; } };
  host.now = () => host.t;
  return { S, host, add };
}

t('chave desligada: presente recusa, bônus zero, títulos não entram na tabela', () => {
  MT.DATA.on = false; const w = world(); const it = w.add('weapon', 2, 0);
  assert.strictEqual(MT.gift(w.S, w.host, 0, { items: [it.id] }).reason, 'off');
  assert.deepStrictEqual(MT.view(w.S, w.host), { on: false }); assert.strictEqual(MT.bonus(w.S).hpPct, 0);
  assert.ok(!TI.DATA.titles.some(x => x.id.startsWith('mentor_'))); assert.strictEqual(w.S.inv.length, 1);
});

t('catálogo: 9 mentores, um por era, 5 falas cada, nomes de era coerentes', () => {
  assert.strictEqual(MT.DATA.list.length, 9);
  assert.deepStrictEqual(MT.DATA.list.map(m => m.era), [0, 1, 2, 3, 4, 5, 6, 7, 8]);
  for (const m of MT.DATA.list) { assert.strictEqual(m.lines.length, MT.DATA.marks.length); assert.ok(m.title && m.role && MT.DATA.statText[m.stat]); }
  assert.strictEqual(MT.byEra(2).role, 'Ferreiro'); assert.strictEqual(MT.byEra(7).role, 'Barqueiro do Submundo');
});

t('liberação: nível da função e era alcançada', () => {
  MT.setOn(true); const w = world(10, 2); w.add('weapon', 1, 0);
  assert.strictEqual(MT.gift(w.S, w.host, 0, { items: [1] }).reason, 'locked');
  w.S.sys.level.lvl = 16; assert.ok(MT.unlocked(w.S, w.host, 2)); assert.ok(!MT.unlocked(w.S, w.host, 3));
  const v = MT.view(w.S, w.host); assert.ok(v.open); assert.strictEqual(v.mentors[3].name, '???'); assert.strictEqual(v.mentors[2].name, 'Bertoldo');
});

t('presente de peça: nunca a equipada nem a trancada; peça da era do mentor vale +50%', () => {
  MT.setOn(true); const w = world();
  const eq = w.add('weapon', 3, 0, true), lk = w.add('armor', 3, 0), a = w.add('hat', 2, 0), b = w.add('boots', 2, 1);
  BF.lock(w.S, lk, true);
  assert.deepStrictEqual(MT.giftable(w.S, w.host).map(x => x.id), [a.id, b.id]);
  assert.strictEqual(MT.gift(w.S, w.host, 0, { items: [eq.id] }).reason, 'items');
  assert.strictEqual(MT.gift(w.S, w.host, 0, { items: [lk.id] }).reason, 'items');
  assert.strictEqual(MT.itemValue(a, 0), 6); assert.strictEqual(MT.itemValue(b, 0), 4);
  const r = MT.gift(w.S, w.host, 0, { items: [a.id, b.id] }); assert.ok(r.ok); assert.strictEqual(r.pts, 10);
  assert.deepStrictEqual(w.S.inv.map(x => x.id), [eq.id, lk.id]);
  assert.strictEqual(MT.gift(w.S, w.host, 0, {}).reason, 'empty');
});

t('materiais: pedras e ração descontam só o múltiplo que vale ponto; falta = recusa', () => {
  MT.setOn(true); const w = world(); F.ensure(w.S).stones = 25; PET.ensure(w.S).food = 35;
  assert.strictEqual(MT.gift(w.S, w.host, 1, { stones: 40 }).reason, 'stones');
  const r = MT.gift(w.S, w.host, 1, { stones: 25, food: 35 }); assert.ok(r.ok);
  assert.strictEqual(r.pts, 12 + 3); assert.strictEqual(F.ensure(w.S).stones, 1); assert.strictEqual(PET.ensure(w.S).food, 5);
});

t('marcos: atributo pequeno, fala nova, título cosmético no 5; amizade máxima não aceita mais presente', () => {
  MT.setOn(true); const w = world(30, 8); F.ensure(w.S).stones = 3000;
  let r = MT.gift(w.S, w.host, 2, { stones: 60 }); assert.strictEqual(r.mark, 1); assert.strictEqual(r.newMarks[0].line, MT.byEra(2).lines[0]);
  assert.strictEqual(MT.bonus(w.S).atkPct, 0.5);
  let v = MT.view(w.S, w.host).mentors[2]; assert.strictEqual(v.newLine, MT.byEra(2).lines[0]); MT.seen(w.S, 2);
  assert.strictEqual(MT.view(w.S, w.host).mentors[2].newLine, null);
  r = MT.gift(w.S, w.host, 2, { stones: 2400 }); assert.strictEqual(r.mark, 5); assert.strictEqual(r.newMarks.length, 4); assert.strictEqual(r.newMarks[3].title, 'Aprendiz da Forja');
  assert.strictEqual(MT.bonus(w.S).atkPct, 2.5);
  assert.ok(TI.isUnlocked ? TI.ensure(w.S).unlocked['mentor_bertoldo'] : true);
  assert.strictEqual(TI.bonus(w.S).atkPct, 0);   // título cosmético: o atributo não conta duas vezes
  assert.strictEqual(MT.gift(w.S, w.host, 2, { stones: 2 }).reason, 'max');
  // título perdido (carga fora de ordem) volta pelo sync
  delete TI.ensure(w.S).unlocked['mentor_bertoldo']; assert.strictEqual(MT.sync(w.S, w.host), 1);
});

t('teto total: 9 mentores no máximo somam pouco (≤ 5% ATK, ≤ 6% Vida, ≤ 3 crítico, ≤ 20% ouro)', () => {
  MT.setOn(true); const S = { sys: { mentors: { pts: { 0: 9e9, 1: 9e9, 2: 9e9, 3: 9e9, 4: 9e9, 5: 9e9, 6: 9e9, 7: 9e9, 8: 9e9 } } } };
  const b = MT.bonus(S); assert.ok(b.atkPct <= 5 && b.hpPct <= 6 && b.critPct <= 3 && b.defPct <= 2 && b.goldPct <= 20);
});

MT.DATA.on = false;
console.log(`mentors: ${n} testes ok`);
