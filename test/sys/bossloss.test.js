// node test/sys/bossloss.test.js — Sys.bossLoss (derrota no chefe dá prêmio pelo dano e 3 dicas com Ir, sem oferta paga)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const F = require('../../js/sys/fc.js'), ST = require('../../js/sys/stats.js'), LV = require('../../js/sys/level.js'), G = require('../../js/sys/forge.js'),
  PET = require('../../js/sys/pet.js'), M = require('../../js/sys/mount.js'), TI = require('../../js/sys/titles.js'), PR = require('../../js/sys/practice.js'),
  LO = require('../../js/sys/loot.js'), A = require('../../js/sys/advice.js');
const BL = require('../../js/sys/bossloss.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

function world(o) {
  o = o || {};
  const S = { inv: [], eq: {}, sys: { level: { lvl: o.lvl || 30, xp: 0 } } }; let id = 1;
  const add = (it, on) => { it.id = id++; S.inv.push(it); if (on) S.eq[it.slot] = it.id; return it; };
  const host = { gold: 0, gems: 0, changes: 0, t: Date.UTC(2026, 10, 13, 15),
    equipped: () => { const r = {}; for (const s in S.eq) { const it = S.inv.find(x => x.id === S.eq[s]); if (it) r[s] = it; } return r; },
    eraMax: () => 0, stage: () => 10, level: () => LV.level(S), atk: () => 0, hp: () => 0, canSpendGold: () => true,
    addGold: g => { host.gold += g; }, addGems: g => { host.gems += g; }, onChange: () => { host.changes++; } };
  host.now = () => host.t;
  return { S, host, add };
}
const D = BL.DATA, xpOf = S => LV.ensure(S).total;

t('chave desligada: não credita, não mexe no save, sem dicas', () => {
  D.on = false; const w = world(); const before = JSON.stringify(w.S);
  const r = BL.onDefeat(w.S, w.host, { stage: 10, dmgDone: 900, bossMaxHp: 1000 });
  assert.deepStrictEqual(r, { on: false, reward: { gold: 0, xp: 0, stones: 0, gems: 0 }, tips: [], capped: false, pct: 0, text: '' });
  assert.strictEqual(w.host.gold, 0); assert.strictEqual(JSON.stringify(w.S), before);
});

D.on = true;

t('ouro de referência = a mesma conta do js/battle.js (goldBase 4 · goldGrowth 1,15 · bossGoldMult 5)', () => {
  assert.strictEqual(BL.winGold(1), 20); assert.strictEqual(BL.winGold(10), Math.ceil(4 * Math.pow(1.15, 9) * 5));
  assert.strictEqual(BL.winXp({ stage: () => 10 }, 10, 0, false), LO.xpFor({ boss: true, stage: 10, era: 0 }, {}, 'boss'));
});

t('prêmio proporcional ao dano, até 30% da vitória; nunca gemas', () => {
  const w = world(), wg = BL.winGold(10), xp0 = xpOf(w.S);
  const r = BL.onDefeat(w.S, w.host, { stage: 10, dmgDone: 600, bossMaxHp: 1000 });
  assert.strictEqual(r.on, true); assert.strictEqual(r.pct, 60); assert.strictEqual(r.capped, false);
  assert.strictEqual(r.reward.gold, Math.floor(wg * 0.3 * 0.6)); assert.strictEqual(w.host.gold, r.reward.gold);
  assert.ok(r.reward.xp > 0 && xpOf(w.S) - xp0 === r.reward.xp, 'XP entra pelo Sys.level.addXp');
  assert.strictEqual(r.reward.stones, 1); assert.strictEqual(G.ensure(w.S).stones, 1);
  assert.strictEqual(r.reward.gems, 0); assert.strictEqual(w.host.gems, 0); assert.ok(w.host.changes >= 1);
  const w2 = world(), r2 = BL.onDefeat(w2.S, w2.host, { stage: 10, dmgDone: 300, bossMaxHp: 1000 });
  assert.strictEqual(r2.reward.gold, Math.floor(wg * 0.3 * 0.3)); assert.strictEqual(r2.reward.stones, 0, 'pedra só com 50%+');
  const w3 = world(), r3 = BL.onDefeat(w3.S, w3.host, { stage: 10, dmgDone: 5000, bossMaxHp: 1000 });
  assert.strictEqual(r3.reward.gold, Math.floor(wg * 0.3), 'teto de 30% (dano acima da vida conta como 100%)');
  assert.strictEqual(r3.reward.xp, Math.floor(BL.winXp(w3.host, 10, 0) * 0.3));
});

t('menos de 10% de dano: sem prêmio e não gasta a vez do dia', () => {
  const w = world(), r = BL.onDefeat(w.S, w.host, { stage: 10, dmgDone: 50, bossMaxHp: 1000 });
  assert.deepStrictEqual(r.reward, { gold: 0, xp: 0, stones: 0, gems: 0 }); assert.ok(/pelo menos 10%/.test(r.text));
  assert.strictEqual(BL.ensure(w.S).total, 0);
});

t('contra farm: 100%, 50%, 25% e nada da 4ª em diante na mesma fase; volta no dia seguinte; pedra só na 1ª', () => {
  const w = world(), wg = BL.winGold(10), o = { stage: 10, dmgDone: 800, bossMaxHp: 1000 };
  const g = [1, 2, 3, 4].map(() => BL.onDefeat(w.S, w.host, o));
  assert.deepStrictEqual(g.map(r => r.reward.gold), [Math.floor(wg * 0.24), Math.floor(wg * 0.12), Math.floor(wg * 0.06), 0]);
  assert.deepStrictEqual(g.map(r => r.reward.stones), [1, 0, 0, 0]); assert.strictEqual(g[3].capped, true); assert.ok(/volta amanhã/.test(g[3].text));
  const sum = g.reduce((s, r) => s + r.reward.gold, 0); assert.ok(sum < wg * 0.53, 'perder de propósito rende menos que UMA vitória');
  assert.strictEqual(BL.onDefeat(w.S, w.host, { stage: 11, dmgDone: 800, bossMaxHp: 1000 }).capped, false, 'outra fase tem a própria conta');
  w.host.t += 86400000; const r = BL.onDefeat(w.S, w.host, o); assert.strictEqual(r.capped, false); assert.strictEqual(r.reward.gold, Math.floor(wg * 0.24));
});

t('teto do dia: no máximo 15 derrotas premiadas somando as fases', () => {
  const w = world(); let paid = 0;
  for (let s = 1; s <= 20; s++) { const r = BL.onDefeat(w.S, w.host, { stage: s, dmgDone: 500, bossMaxHp: 1000 }); if (r.reward.gold > 0) paid++; else assert.strictEqual(r.capped, true); }
  assert.strictEqual(paid, 15);
});

t('peek não credita nem conta a vez', () => {
  const w = world(), p = BL.peek(w.S, w.host, { stage: 10, dmgDone: 600, bossMaxHp: 1000 });
  assert.ok(p.reward.gold > 0); assert.strictEqual(p.left, 3); assert.strictEqual(w.host.gold, 0); assert.ok(!w.S.sys.bossLoss);
});

t('dicas: até 3, cada uma com destino e ganho, do Sys.advice (mesma ordem), sem mexer no save', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 0, lvl: 30 }, true); w.add({ slot: 'armor', e: 1, r: 0, lvl: 30 }, true);
  w.add({ slot: 'weapon', e: 1, r: 2, lvl: 30, name: 'Lâmina Rara' }); w.add({ slot: 'armor', e: 1, r: 4, lvl: 30 }); G.ensure(w.S).stones = 50;
  const all = A.all(JSON.parse(JSON.stringify(w.S)), w.host).list;
  const r = BL.onDefeat(w.S, w.host, { stage: 10, dmgDone: 700, bossMaxHp: 1000 });
  assert.ok(r.tips.length >= 1 && r.tips.length <= 3, 'qtde ' + r.tips.length);
  for (const tp of r.tips) { assert.ok(D.dests.includes(tp.dest)); assert.strictEqual(typeof tp.gain, 'number'); assert.ok(tp.label); }
  assert.deepStrictEqual(r.tips.map(x => x.id), all.slice(0, r.tips.length).map(x => x.id));
});

t('dicas: compra, oferta, VIP, loja, invocação, sorteio e tela fora da lista NUNCA entram; no máximo 3', () => {
  const real = A.all; A.all = () => ({ now: 0, list: [
    { id: 'shop.pack', kind: 'shop', tab: 'shop', label: 'Pacote', gain: 9999 },
    { id: 'vip.up', kind: 'vip', tab: 'vip', label: 'VIP 3', gain: 9000 },
    { id: 'summon.x10', kind: 'summon', tab: 'gear', label: 'Invocar x10', gain: 8000 },
    { id: 'offer.daily', kind: 'equip', tab: 'gear', label: 'Oferta', gain: 7000 },
    { id: 'gems.buy', kind: 'gems', tab: 'gear', label: 'Gemas', gain: 6500 },
    { id: 'chest.open', kind: 'chest', tab: 'chest', label: 'Abrir baú', gain: 6000 },
    { id: 'practice.x', kind: 'practice', tab: 'practice', label: 'Prática', gain: 5000 },
    { id: 'forge.weapon', kind: 'forge', tab: 'forge', label: 'Forja +2 na arma', gain: 300, gainText: '+300 FC', ready: true },
    { id: 'equip.armor', kind: 'equip', tab: 'gear', label: 'Equipar Engrenagem (armadura)', gain: 200, ready: true },
    { id: 'pet.feed', kind: 'pet', tab: 'pet', label: 'Pet Nv 10', gain: 100 },
    { id: 'mount.star', kind: 'mount', tab: 'mount', label: 'Montaria', gain: 50 } ] });
  try {
    const w = world(), r = BL.onDefeat(w.S, w.host, { stage: 10, dmgDone: 700, bossMaxHp: 1000 });
    assert.deepStrictEqual(r.tips.map(x => x.id), ['forge.weapon', 'equip.armor', 'pet.feed']);
    assert.deepStrictEqual(r.tips[0], { id: 'forge.weapon', kind: 'forge', label: 'Forja +2 na arma', gain: 300, gainText: '+300 FC', dest: 'forge', ready: true });
  } finally { A.all = real; }
});

t('save torto e sem Sys.advice: não quebra', () => {
  const w = world(); w.S.sys.bossLoss = { n: 'x', total: 'y', day: 5 };
  const r = BL.onDefeat(w.S, w.host, { stage: 'abc', dmgDone: null, bossMaxHp: 0 }); assert.strictEqual(r.on, true); assert.strictEqual(r.reward.gold, 0);
  const adv = Sys.advice; delete Sys.advice; try { assert.deepStrictEqual(BL.tips(w.S, w.host), []); } finally { Sys.advice = adv; }
});

D.on = false;
console.log(`\n${n} testes ok`);
