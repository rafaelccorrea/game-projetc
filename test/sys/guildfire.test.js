// node test/sys/guildfire.test.js — Sys.guildFire (Fogueira da Guilda: 1 alimentar grátis por dia, Brasas próprias, baú fixo por nível, nunca à venda)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const CL = require('../../js/sys/clock.js'), LV = require('../../js/sys/level.js'), FG = require('../../js/sys/forge.js'), PET = require('../../js/sys/pet.js'),
  GU = require('../../js/sys/guild.js'), BF = require('../../js/sys/bonfire.js');
const GF = require('../../js/sys/guildfire.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const H = 3600000;

function world(gid, joinedAt) {
  const S = { sys: { level: { lvl: 40, xp: 0 } } };
  const host = { gold: 0, changes: 0, t: new Date(2026, 10, 11, 12).getTime(), goldUnit: () => 10,
    addGold: g => { host.gold += g; }, onChange: () => { host.changes++; } };
  host.now = () => host.t;
  if (gid) GU.applyServer(S, { id: gid, name: 'Clã', role: 'member', level: 1, joinedAt: joinedAt == null ? host.t - H : joinedAt }, host);
  return { S, host };
}
// gancho que o Sys.bonfire ainda NÃO tem: simulado só no teste (o arquivo bonfire.js não muda)
const withHook = fn => { BF.spendBrasas = (S, k) => { const o = BF.ensure(S); if (o.bra < k) return false; o.bra -= k; return true; }; try { fn(); } finally { delete BF.spendBrasas; } };

t('chave desligada: nada muda', () => {
  GF.DATA.on = false; const w = world('g1'); const before = JSON.stringify(w.S);
  assert.strictEqual(GF.contribute(w.S, w.host).reason, 'off'); assert.deepStrictEqual(GF.view(w.S, w.host), { on: false });
  assert.deepStrictEqual(GF.perks(w.S), { goldPct: 0, xpPct: 0 }); assert.strictEqual(JSON.stringify(w.S), before);
});

t('sem guilda: fechada', () => {
  GF.DATA.on = true; const w = world(null);
  assert.strictEqual(GF.contribute(w.S, w.host).reason, 'guild'); assert.strictEqual(GF.view(w.S, w.host).reason, 'guild');
});

t('1 alimentar grátis por dia (+10); volta no dia seguinte', () => {
  GF.DATA.on = true; const w = world('g1');
  const r = GF.contribute(w.S, w.host); assert.ok(r.ok); assert.strictEqual(r.flames, 10); assert.strictEqual(r.total, 10);
  assert.strictEqual(GF.feed(w.S, w.host).reason, 'done');
  w.host.t += 24 * H; assert.ok(GF.feed(w.S, w.host).ok); assert.strictEqual(GF.view(w.S, w.host).flames, 20);
});

t('Brasas: com o gancho do Sys.bonfire (spendBrasas, 80f1c4a) gasta, até 20 por dia; sem o gancho recusaria (hook)', () => {
  GF.DATA.on = true; BF.DATA.on = true; const w = world('g1'); BF.addBrasas(w.S, 'missions', 1);   // 20 Brasas
  { const keep=BF.spendBrasas; delete BF.spendBrasas; try{ assert.strictEqual(GF.contribute(w.S, w.host, 5).reason, 'hook'); } finally { BF.spendBrasas=keep; } } assert.strictEqual(BF.ensure(w.S).bra, 20);
  withHook(() => {
    const r = GF.contribute(w.S, w.host, 5); assert.ok(r.ok); assert.strictEqual(r.flames, 5); assert.strictEqual(BF.ensure(w.S).bra, 15);
    assert.strictEqual(GF.contribute(w.S, w.host, 16).reason, 'day');
    assert.ok(GF.contribute(w.S, w.host, 15).ok); assert.strictEqual(BF.ensure(w.S).bra, 0);
    w.host.t += 24 * H; assert.strictEqual(GF.contribute(w.S, w.host, 1).reason, 'brasas');
  });
  BF.DATA.on = false;
});

t('níveis: 300 × 1,35^(n−1); bônus pequeno fora da FC', () => {
  assert.strictEqual(GF.needOf(1), 300); assert.strictEqual(GF.needOf(2), 405); assert.strictEqual(GF.needOf(10), 0);
  assert.strictEqual(GF.levelOf(299).level, 1); assert.strictEqual(GF.levelOf(300).level, 2); assert.strictEqual(GF.levelOf(GF.totalTo(10)).level, 10);
  assert.ok(GF.totalTo(10) > 11000 && GF.totalTo(10) < 13000);
  assert.deepStrictEqual(GF.perksAt(1), { goldPct: 0, xpPct: 0 }); assert.deepStrictEqual(GF.perksAt(10), { goldPct: 4.5, xpPct: 2.7 });
  assert.strictEqual(GF.levelOf(GF.totalTo(10) + 6500).extra, 2);
});

t('servidor soma todos: subir de nível abre baú fixo para quem já estava; resgate uma vez', () => {
  GF.DATA.on = true; const w = world('g1');
  assert.ok(GF.applyServer(w.S, w.host, { guildId: 'g1', flames: 300 + 405 + 10 }).ok);
  const v = GF.view(w.S, w.host); assert.strictEqual(v.level, 3); assert.deepStrictEqual(v.chests.map(c => c.id), [2, 3]);
  assert.deepStrictEqual(GF.perks(w.S), { goldPct: 1, xpPct: 0.6 });
  const st0 = FG.ensure(w.S).stones, f0 = PET.ensure(w.S).food;
  const r = GF.claim(w.S, w.host, 3); assert.ok(r.ok); assert.deepStrictEqual(r.reward, { gold: 360, stones: 3, food: 30, gems: 0 });   // 12 × 3 × 10 (goldK 12: docs/ECONOMIA_OURO.md)
  assert.strictEqual(FG.ensure(w.S).stones, st0 + 3); assert.strictEqual(PET.ensure(w.S).food, f0 + 30);
  assert.strictEqual(GF.claim(w.S, w.host, 3).reason, 'id'); assert.deepStrictEqual(GF.chests(w.S, w.host).map(c => c.id), [2]);
  assert.strictEqual(GF.applyServer(w.S, w.host, { guildId: 'outra', flames: 99999 }).reason, 'guild');
});

t('pular de guilda: nível alcançado antes de entrar não dá baú', () => {
  GF.DATA.on = true; const w = world('g2', new Date(2026, 10, 11, 12).getTime() + 10 * H);   // entrou daqui a 10 h (o servidor manda a hora certa)
  GF.applyServer(w.S, w.host, { guildId: 'g2', flames: 5000 });
  assert.strictEqual(GF.view(w.S, w.host).level >= 5, true); assert.deepStrictEqual(GF.chests(w.S, w.host), []);
  w.host.t += 11 * H; GF.applyServer(w.S, w.host, { guildId: 'g2', flames: 5000 + GF.needOf(GF.levelOf(5000).level) });
  assert.strictEqual(GF.chests(w.S, w.host).length, 1);
});

t('trocar de guilda: a fogueira é a da nova; bônus some sem guilda', () => {
  GF.DATA.on = true; const w = world('g1'); GF.applyServer(w.S, w.host, { guildId: 'g1', flames: 2000 });
  assert.ok(GF.perks(w.S).goldPct > 0);
  GU.applyServer(w.S, { id: 'g3', name: 'B', role: 'member', joinedAt: w.host.t }, w.host);
  assert.strictEqual(GF.view(w.S, w.host).flames, 0);
  GU.applyServer(w.S, null, w.host); assert.deepStrictEqual(GF.perks(w.S), { goldPct: 0, xpPct: 0 });
});

t('provider do servidor: recusa dele vale e o total vem dele', () => {
  GF.DATA.on = true; const w = world('g1');
  GF.setProvider({ online: true, feed: () => ({ ok: false, reason: 'guild_closed' }) }); assert.strictEqual(GF.feed(w.S, w.host).reason, 'guild_closed');
  GF.setProvider({ online: true, feed: () => ({ ok: true, flames: 900 }) }); const r = GF.feed(w.S, w.host); assert.strictEqual(r.total, 900); assert.strictEqual(r.level, 3);
  GF.setProvider(null); assert.strictEqual(GF.provider.online, false);
});

t('nunca à venda: nenhuma função fala de gema/loja; baú sem gema', () => {
  const src = require('fs').readFileSync(require('path').join(__dirname, '../../js/sys/guildfire.js'), 'utf8');
  assert.ok(!/spendGems|addGems|canSpendGems|shop|offer/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '')));
  assert.strictEqual(GF.chestOf(10, { goldUnit: () => 1 }).gems, 0);
});

t('save torto é arrumado', () => {
  const S = { sys: { guildFire: { gid: 5, flames: -3, day: { free: 'sim', bra: 'x' }, claimed: { g1: [2, {}, 'x1'], g2: 'a' }, reached: { g1: { 2: 'x', 3: 10 } } } } };
  const o = GF.ensure(S); assert.strictEqual(o.gid, null); assert.strictEqual(o.flames, 0); assert.deepStrictEqual(o.day, { k: '', free: false, bra: 0 });
  assert.deepStrictEqual(o.claimed, { g1: [2, 'x1'] }); assert.deepStrictEqual(o.reached, { g1: { 2: 0, 3: 10 } });
});

t('ouro: o baú do nível 10 (e os extras) = 5 min de abate (120 × goldUnit), o teto por resgate', () => {
  assert.strictEqual(GF.DATA.chest.goldK, 12); for (let L = 1; L <= 10; L++) assert.ok(GF.chestOf(L, { goldUnit: () => 1 }).gold <= 120);
  assert.strictEqual(GF.chestOf(10, { goldUnit: () => 7 }).gold, 120 * 7);
});

GF.DATA.on = false; GF.setProvider(null);
console.log(`\n${n} testes ok (guildfire)`);
