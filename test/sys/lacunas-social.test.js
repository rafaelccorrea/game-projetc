// node test/sys/lacunas-social.test.js — lacunas do docs/LIGACOES_SOCIAL.md §8 fechadas pela Sistemas:
// % de ouro/XP orçados chegam ao abate e à XP (Sys.loot.goldPerkPct, Sys.level.addXp); Dupla e Mentores no Sys.level.DATA.unlock; moldura do parceiro.
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
require('../../js/sys/clock.js'); const LV = require('../../js/sys/level.js'); require('../../js/sys/forge.js'); require('../../js/sys/pet.js');
const L = require('../../js/sys/loot.js'), GU = require('../../js/sys/guild.js'), GF = require('../../js/sys/guildfire.js'), DU = require('../../js/sys/duo.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const H = 3600000;
const host0 = () => { const h = { t: new Date(2026, 10, 14, 12).getTime(), rng: () => 0.5, goldUnit: () => 10, level: () => 40, eraMax: () => 0, toasts: [] };
  h.now = () => h.t; h.toast = s => h.toasts.push(s); return h; };
function world(gid, flames) { const S = { sys: { level: { lvl: 40, xp: 0 } } }, h = host0();
  if (gid) { GU.applyServer(S, { id: gid, name: 'Clã', role: 'member', level: 1, joinedAt: h.t - H }, h); if (flames != null) GF.applyServer(S, h, { guildId: gid, flames }); }
  return { S, h }; }
const gold = (S, h) => L.rollKill(S, h, { gold: 1000 }).gold;
const withSys = (k, v, fn) => { const old = Sys[k]; Sys[k] = v; try { fn(); } finally { if (old === undefined) delete Sys[k]; else Sys[k] = old; } };

t('ouro do abate: tudo desligado = igual ao de antes (só VIP/evento)', () => {
  GU.DATA.on = false; GF.DATA.on = false; const w = world('g1');
  assert.strictEqual(L.goldPerkPct(w.S), 0); assert.strictEqual(gold(w.S, w.h), gold({}, host0()));
});

t('ouro do abate: Fogueira da Guilda nível 10 = +4,5%; sem guilda = 0', () => {
  GU.DATA.on = true; GF.DATA.on = true; const w = world('g1', 20000);
  assert.strictEqual(GF.perks(w.S).goldPct, 4.5); assert.strictEqual(L.goldPerkPct(w.S), 4.5);
  const base = gold({}, host0()); assert.strictEqual(gold(w.S, w.h), Math.round(base * 1.045));
  assert.strictEqual(L.goldPerkPct(world(null).S), 0);
  GF.DATA.on = false; GU.DATA.on = false;
});

t('ouro do abate: Encruzilhada (goldPct do bonus) só com a chave ligada', () => {
  const S = {}, fake = on => ({ DATA: { on }, bonus: () => ({ goldPct: 5 }), perks: () => ({ xpPct: 0 }) });
  withSys('crossroads', fake(false), () => assert.strictEqual(L.goldPerkPct(S), 0));
  const base = gold({}, host0()); withSys('crossroads', fake(true), () => { assert.strictEqual(L.goldPerkPct(S), 5); assert.strictEqual(gold(S, host0()), Math.round(base * 1.05)); });
});

t('ouro do abate: títulos, prática, mentores e estandarte/território de ouro da guilda NÃO entram (fora do orçamento)', () => {
  GU.DATA.on = true; const w = world('g1'); const g = GU.ensure(w.S); g.banners.gold = 10; g.territories = [{ region: 0, capital: true }];
  assert.ok(GU.perks(w.S).goldRaw > 0); assert.strictEqual(GU.perks(w.S).goldPct, 0); assert.strictEqual(GU.perks(w.S).goldSoon, true); assert.strictEqual(L.goldPerkPct(w.S), 0);
  withSys('titles', { bonus: () => ({ goldPct: 20 }) }, () => withSys('practice', { bonus: () => ({ goldPct: 35 }) }, () => assert.strictEqual(L.goldPerkPct(w.S), 0)));
  GU.DATA.on = false;
});

t('XP: Fogueira da Guilda (+0,3%/nível) e territórios da Guilda somam no addXp; desligados = igual', () => {
  GU.DATA.on = false; GF.DATA.on = false; let w = world('g1', 20000);
  assert.strictEqual(LV.addXp(w.S, 1000, w.h).gained, 1000);
  GU.DATA.on = true; GF.DATA.on = true; w = world('g1', 20000);
  assert.strictEqual(GF.perks(w.S).xpPct, 2.7); assert.strictEqual(LV.addXp(w.S, 1000, w.h).gained, 1027);
  GU.ensure(w.S).territories = [{ region: 0, capital: false }]; assert.strictEqual(GU.perks(w.S).xpPct, 1);
  assert.strictEqual(LV.addXp(w.S, 1000, w.h).gained, 1037);
  assert.strictEqual(LV.addXp(w.S, 1000, w.h, 'trial').gained, 1000, 'devolução da Provação não ganha % de novo');
  GU.DATA.on = false; GF.DATA.on = false;
});

t('XP: Encruzilhada continua (+6% com a chave) e soma com a Fogueira', () => {
  GU.DATA.on = true; GF.DATA.on = true; const w = world('g1', 20000);
  withSys('crossroads', { DATA: { on: true }, bonus: () => ({ goldPct: 0 }), perks: () => ({ xpPct: 6 }) }, () => assert.strictEqual(LV.addXp(w.S, 1000, w.h).gained, 1087));
  withSys('crossroads', { DATA: { on: false }, bonus: () => ({ goldPct: 0 }), perks: () => ({ xpPct: 6 }) }, () => assert.strictEqual(LV.addXp(w.S, 1000, w.h).gained, 1027));
  GU.DATA.on = false; GF.DATA.on = false;
});

t('Sys.level.DATA.unlock: Dupla e Mentores no 16 (fonte única do Menu); o aviso "Liberou" só cita com o módulo ligado', () => {
  assert.strictEqual(LV.DATA.unlock.duo, 16); assert.strictEqual(LV.DATA.unlock.mentors, 16); assert.strictEqual(LV.unlockLevel('duo'), 16);
  assert.strictEqual(LV.DATA.unlockName.duo, 'Dupla'); assert.strictEqual(LV.DATA.unlockName.mentors, 'Mentores');
  const need = lv => LV.DATA.xpToNext[lv - 1];
  let S = { sys: { level: { lvl: 15, xp: 0 } } }, h = host0(); DU.DATA.on = false;
  let r = LV.addXp(S, need(15), h); assert.strictEqual(r.to, 16); assert.ok(!r.unlocked.includes('duo') && !r.unlocked.includes('mentors')); assert.ok(r.unlocked.includes('chat'));
  DU.DATA.on = true; S = { sys: { level: { lvl: 15, xp: 0 } } }; r = LV.addXp(S, need(15), host0()); assert.ok(r.unlocked.includes('duo'));
  DU.DATA.on = false;
});

t('Sys.duo.applyServer guarda partner.frame (id curto ou null); lixo vira null; save velho sem frame = null', () => {
  DU.DATA.on = true; DU.setProvider(null); const S = { sys: { level: { lvl: 30, xp: 0 } } }, h = host0();
  assert.ok(DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia', last: 1, frame: 'vip3' } }).ok); assert.strictEqual(DU.ensure(S).partner.frame, 'vip3');
  DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia', frame: 'ouro' } }); assert.strictEqual(DU.ensure(S).partner.frame, 'ouro');
  DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia', frame: '<img src=x>' } }); assert.strictEqual(DU.ensure(S).partner.frame, null);
  DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia', frame: 'prata' } }); DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia' } });
  assert.strictEqual(DU.ensure(S).partner.frame, 'prata', 'sem o campo: fica a que já estava');
  DU.applyServer(S, h, { partner: { id: 'BCDF2345', name: 'Lia', frame: null } }); assert.strictEqual(DU.ensure(S).partner.frame, null);
  const S2 = { sys: { duo: { partner: { id: 'BCDF2345', name: 'Lia' } } } }; assert.strictEqual(DU.ensure(S2).partner.frame, null);
  assert.strictEqual(DU.view(S, h).partner.frame, null); DU.DATA.on = false;
});

console.log(`\n${n} testes ok (lacunas-social)`);
