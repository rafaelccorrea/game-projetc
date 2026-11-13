// node test/sys/loadouts.test.js — Sys.loadouts (3 conjuntos salvos: Fases / Arena / Chefe; magias = Sys.grimoire)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const ST = require('../../js/sys/stats.js'), LV = require('../../js/sys/level.js'), PET = require('../../js/sys/pet.js'), M = require('../../js/sys/mount.js'),
  GR = require('../../js/sys/grimoire.js');
const LO = require('../../js/sys/loadouts.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

function world(lvl) {
  const S = { inv: [], eq: {}, sys: { level: { lvl: lvl || 60, xp: 0 } } }; let id = 1;
  const add = (slot, r, on) => { const it = { id: id++, slot, e: 0, r: r == null ? 1 : r, lvl: 1, subs: [], name: slot + id }; S.inv.push(it); if (on) S.eq[slot] = it.id; return it; };
  const host = { changes: 0, t: Date.UTC(2026, 10, 13, 15), items: () => S.inv,
    equipped: () => { const r = {}; for (const s in S.eq) { const it = S.inv.find(x => x.id === S.eq[s]); if (it) r[s] = it; } return r; },
    equip: it => { const x = S.inv.find(q => q.id === it.id); if (!x) return false; S.eq[x.slot] = x.id; return true; },
    level: () => LV.level(S), onChange: () => { host.changes++; } };
  host.now = () => host.t;
  return { S, host, add };
}
const own = (S, pets, mounts) => { const p = PET.ensure(S); for (const k of pets) p.owned[k] = { stars: 1, frags: 0 }; const m = M.ensure(S); for (const k of mounts) m.owned[k] = { stars: 1, frags: 0, lvl: 1, gold: 0 }; };

t('chave desligada: save/apply recusam e o save não muda', () => {
  LO.DATA.on = false; const w = world(); w.add('weapon', 1, true); const before = JSON.stringify(w.S);
  assert.deepStrictEqual(LO.save(w.S, 'fases', w.host), { ok: false, reason: 'off' });
  assert.deepStrictEqual(LO.apply(w.S, 'fases', w.host), { ok: false, reason: 'off' });
  assert.strictEqual(JSON.stringify(w.S), before); assert.strictEqual(LO.view(w.S, w.host).on, false);
});

t('salvar fotografa peças (com a asa), pet e montaria', () => {
  LO.DATA.on = true; const w = world(); own(w.S, ['wolf', 'drake'], ['pony', 'horse']);
  const a = w.add('weapon', 1, true), b = w.add('armor', 1, true), wg = w.add('wing', 2, true);
  PET.equip(w.S, 'drake'); M.equip(w.S, 'horse');
  const r = LO.save(w.S, 'chefe', w.host);
  assert.ok(r.ok); assert.deepStrictEqual(r.set.gear, { weapon: a.id, armor: b.id, wing: wg.id });
  assert.strictEqual(r.set.pet, 'drake'); assert.strictEqual(r.set.mount, 'horse'); assert.strictEqual(LO.ensure(w.S).cur, 'chefe');
  assert.deepStrictEqual(LO.save(w.S, 'x', w.host), { ok: false, reason: 'mode' });
});

t('aplicar troca tudo num toque e marca em uso', () => {
  LO.DATA.on = true; const w = world(); own(w.S, ['wolf', 'drake'], ['pony', 'horse']);
  const a1 = w.add('weapon', 1, true), h1 = w.add('hat', 1, true); PET.equip(w.S, 'wolf'); M.equip(w.S, 'pony');
  LO.save(w.S, 'fases', w.host);
  const a2 = w.add('weapon', 2), h2 = w.add('hat', 2); w.host.equip(a2); w.host.equip(h2); PET.equip(w.S, 'drake'); M.equip(w.S, 'horse');
  LO.save(w.S, 'arena', w.host);
  const r = LO.apply(w.S, 'fases', w.host);
  assert.ok(r.ok); assert.strictEqual(r.equipped, 4); assert.deepStrictEqual(r.skipped, []);
  assert.strictEqual(w.S.eq.weapon, a1.id); assert.strictEqual(w.S.eq.hat, h1.id);
  assert.strictEqual(PET.ensure(w.S).eq, 'wolf'); assert.strictEqual(M.ensure(w.S).eq, 'pony');
  const v = LO.view(w.S, w.host); assert.strictEqual(v.modes[0].inUse, true); assert.strictEqual(v.modes[1].inUse, false);
  const r2 = LO.apply(w.S, 'fases', w.host); assert.strictEqual(r2.equipped, 0);   // já está: nada muda
  assert.strictEqual(LO.apply(w.S, 'chefe', w.host).reason, 'empty');
});

t('peça que não existe mais é pulada; espaço vazio do conjunto não desequipa', () => {
  LO.DATA.on = true; const w = world(); own(w.S, ['wolf'], []);
  const a1 = w.add('weapon', 1, true); LO.save(w.S, 'fases', w.host);
  const a2 = w.add('weapon', 2), b2 = w.add('boots', 1); w.host.equip(a2); w.host.equip(b2);
  w.S.inv = w.S.inv.filter(x => x.id !== a1.id);   // desmontou a arma salva
  const r = LO.apply(w.S, 'fases', w.host);
  assert.strictEqual(r.equipped, 0); assert.deepStrictEqual(r.skipped.map(x => [x.slot, x.reason]), [['weapon', 'gone']]);
  assert.strictEqual(w.S.eq.weapon, a2.id); assert.strictEqual(w.S.eq.boots, b2.id);
  assert.strictEqual(LO.view(w.S, w.host).modes[0].missing, 1);
});

t('asa antes do nível e pet/montaria que não tem: pulados', () => {
  LO.DATA.on = true; const w = world(60); own(w.S, ['wolf', 'drake'], ['pony', 'horse']);
  const wg = w.add('wing', 2, true); PET.equip(w.S, 'drake'); M.equip(w.S, 'horse'); LO.save(w.S, 'arena', w.host);
  delete w.S.eq.wing; PET.equip(w.S, 'wolf'); M.equip(w.S, 'pony');
  w.S.sys.level.lvl = 10; delete PET.ensure(w.S).owned.drake; delete M.ensure(w.S).owned.horse;
  const r = LO.apply(w.S, 'arena', w.host);
  assert.deepStrictEqual(r.skipped.map(x => x.kind + ':' + x.reason).sort(), ['gear:locked', 'mount:gone', 'pet:gone']);
  assert.strictEqual(w.S.eq.wing, undefined); assert.ok(wg);
});

t('modeFor = o do Grimório; magias vêm do Sys.grimoire (sem cópia)', () => {
  LO.DATA.on = true; assert.strictEqual(LO.modeFor({ boss: true }), 'chefe'); assert.strictEqual(LO.modeFor({ pvp: true }), 'arena'); assert.strictEqual(LO.modeFor({}), 'fases');
  const w = world(); GR.DATA.on = true; GR.addPages(w.S, 'rollingStone', 1, 'eraLord'); GR.setPreset(w.S, 'chefe', ['rollingStone']);
  w.add('weapon', 1, true); LO.save(w.S, 'chefe', w.host);
  assert.strictEqual(LO.ensure(w.S).sets.chefe.spells, undefined);
  assert.deepStrictEqual(LO.view(w.S, w.host).modes[2].spells.map(x => x.id), ['rollingStone']);
  GR.DATA.on = false;
});

t('auto: forBattle troca só com a opção ligada e o conjunto salvo', () => {
  LO.DATA.on = true; const w = world(); const a1 = w.add('weapon', 1, true); LO.save(w.S, 'chefe', w.host);
  const a2 = w.add('weapon', 2); w.host.equip(a2);
  assert.strictEqual(LO.forBattle(w.S, w.host, { boss: true }).applied, false); assert.strictEqual(w.S.eq.weapon, a2.id);
  LO.setAuto(w.S, true);
  assert.strictEqual(LO.forBattle(w.S, w.host, {}).reason, 'empty');
  assert.strictEqual(LO.forBattle(w.S, w.host, { boss: true }).applied, true); assert.strictEqual(w.S.eq.weapon, a1.id);
});

t('save torto é arrumado', () => {
  const S = { sys: { loadouts: { sets: { fases: { gear: { weapon: 3, foo: 9, armor: {} }, pet: 7 }, lixo: {} }, cur: 'x', auto: 'sim' } } };
  const o = LO.ensure(S); assert.deepStrictEqual(o.sets, { fases: { gear: { weapon: 3 }, pet: null, mount: null, at: 0 } }); assert.strictEqual(o.cur, null); assert.strictEqual(o.auto, false);
});

LO.DATA.on = false;
console.log(`\n${n} testes ok (loadouts)`);
