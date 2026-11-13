// node test/sys/buy.test.js — Sys.buy contra um Sys.net FALSO (sem rede) e uma ponte de cobrança falsa
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const B = require('../../js/sys/buy.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };

function world(dels) {
  const acks = [], saves = [];
  const S = { gems: 10, skins: [] };
  const host = { addGems: x => { S.gems += x; }, addSkin: id => { if (!S.skins.includes(id)) S.skins.push(id); }, save: () => saves.push(JSON.stringify(S)) };
  globalThis.Sys.net = { DATA: { on: true }, hasSession: () => true, deliveries: async () => dels.filter(d => !acks.includes(d.id)), ackDelivery: async id => { acks.push(id); },
    canBuy: async () => ({ ok: true }), accountId: async () => 'acc', verifyGoogle: async b => { world.last = b; return { status: 'granted' }; } };
  globalThis.Sys.vip = { addPoints: (S2, k) => { S2.vipPts = (S2.vipPts || 0) + k; } };
  globalThis.Sys.pass = { setPremium: (S2, on) => { S2.premium = on; } };
  globalThis.Sys.offer = { grant: (S2) => { S2.offerGot = (S2.offerGot || 0) + 1; return { ok: true }; } };
  return { S, host, acks, saves };
}

(async () => {
  await t('desligado ou sem ponte nativa: "em breve", nada muda', async () => {
    const { S, host } = world([]); B.DATA.on = false;
    assert.deepStrictEqual(await B.purchase(S, host, 'gems_60'), { ok: false, reason: 'soon' });
    B.DATA.on = true; assert.strictEqual(B.ready(), false);                   // sem window.Capacitor
    assert.deepStrictEqual(await B.purchase(S, host, 'gems_60'), { ok: false, reason: 'soon' }); assert.strictEqual(S.gems, 10);
  });
  await t('entregas: aplica cada uma UMA vez, grava antes do ack, e a oferta não soma 💎 em dobro', async () => {
    const dels = [
      { id: 'd1', grants: [{ kind: 'gems', amount: 120, firstDouble: true }] },
      { id: 'd2', grants: [{ kind: 'bundle', att: { offer: true } }, { kind: 'gems', amount: 300, deliveredBy: 'offer' }] },
      { id: 'd3', grants: [{ kind: 'vip_points', amount: 2990 }, { kind: 'pass_premium', season: 's1' }, { kind: 'skin', skinId: 'kael_neon' }] },
    ];
    const { S, host, acks, saves } = world(dels); B.DATA.on = true;
    const got = await B.sync(S, host);
    assert.strictEqual(got.length, 3); assert.strictEqual(S.gems, 130); assert.strictEqual(S.offerGot, 1);
    assert.strictEqual(S.vipPts, 2990); assert.strictEqual(S.premium, true); assert.deepStrictEqual(S.skins, ['kael_neon']);
    assert.deepStrictEqual(acks, ['d1', 'd2', 'd3']); assert.strictEqual(saves.length, 3);
    assert.strictEqual(S.sys.buy.purchasedGems, 120);
    assert.strictEqual((await B.sync(S, host)).length, 0); assert.strictEqual(S.gems, 130);
  });
  await t('app fechou entre gravar e confirmar: a entrega volta, só recebe o ack (não aplica de novo)', async () => {
    const dels = [{ id: 'x1', grants: [{ kind: 'gems', amount: 60 }] }];
    const { S, host, acks } = world(dels); B.DATA.on = true;
    const ack0 = Sys.net.ackDelivery; Sys.net.ackDelivery = async () => { throw Object.assign(new Error('offline'), { code: 'offline' }); };
    await B.sync(S, host); assert.strictEqual(S.gems, 70); assert.deepStrictEqual(acks, []);
    Sys.net.ackDelivery = ack0;
    assert.strictEqual((await B.sync(S, host)).length, 0); assert.strictEqual(S.gems, 70); assert.deepStrictEqual(acks, ['x1']);
  });
  await t('montaria comprada (Mecha de guerra): Sys.mount.add uma vez', async () => {
    const dels = [{ id: 'm1', grants: [{ kind: 'mount', mountId: 'mecha' }] }];
    const { S, host } = world(dels); B.DATA.on = true; const added = [];
    globalThis.Sys.mount = { add: (S2, h, id) => { added.push(id); return { ok: true, id }; } };
    const got = await B.sync(S, host); assert.deepStrictEqual(added, ['mecha']); assert.strictEqual(got[0].got[0].kind, 'mount');
    assert.strictEqual((await B.sync(S, host)).length, 0); assert.deepStrictEqual(added, ['mecha']);
    delete globalThis.Sys.mount;
  });
  await t('skin à venda (fixa do Sys.appearance): grantFixed com source shop, uma vez', async () => {
    const dels = [{ id: 's1', grants: [{ kind: 'skin', skinId: 'kael_paladin' }] }];
    const { S, host } = world(dels); B.DATA.on = true; const got = [];
    globalThis.Sys.appearance = { FIXED: [{ id: 'kael_paladin' }], grantFixed: (S2, id, o) => { got.push([id, o.source]); return { ok: true }; } };
    const r = await B.sync(S, host); assert.deepStrictEqual(got, [['kael_paladin', 'shop']]); assert.strictEqual(r[0].got[0].fixed, true); assert.deepStrictEqual(S.skins, []);
    assert.strictEqual(B.priceText('skin_kael_cyborg'), 'R$ 39,90');
    delete globalThis.Sys.appearance;
  });
  await t('skin só à venda com venda ligada, arte pronta, herói certo e não comprada', async () => {
    const row = o => Object.assign({ productId: 'skin_kael_paladin', on: true, art: true, available: true, owned: false }, o);
    let r = row({}); globalThis.Sys.appearance = { skinProducts: () => [r] };
    assert.strictEqual(B.available('skin_kael_paladin', {}), true);
    for (const o of [{ on: false }, { art: false }, { available: false }, { owned: true }]) { r = row(o); assert.strictEqual(B.available('skin_kael_paladin', {}), false, JSON.stringify(o)); }
    assert.strictEqual(B.available('skin_kael_cyborg', {}), false);   // fora da lista do Sys.appearance
    delete globalThis.Sys.appearance; assert.strictEqual(B.available('skin_kael_paladin', {}), false);
  });
  await t('estorno (revoke): tira 💎 até zero, a skin e o passe', async () => {
    const dels = [{ id: 'g', grants: [{ kind: 'gems', amount: 500 }, { kind: 'skin', skinId: 'k1' }, { kind: 'pass_premium' }] },
      { id: 'r', revoke: true, grants: [{ kind: 'gems', amount: 500 }, { kind: 'skin', skinId: 'k1' }, { kind: 'pass_premium' }] }];
    const { S, host } = world(dels); B.DATA.on = true;
    await B.sync(S, host);
    assert.strictEqual(S.gems, 10 + 500 - 500); assert.deepStrictEqual(S.skins, []); assert.strictEqual(S.premium, false);
  });
  await t('compra completa com a ponte nativa: só o recibo vai ao servidor, a entrega vem da lista', async () => {
    const dels = [{ id: 'p1', grants: [{ kind: 'gems', amount: 60 }] }];
    const { S, host } = world(dels); B.DATA.on = true;
    globalThis.Capacitor = { Plugins: { EonBilling: { purchase: async o => { assert.deepStrictEqual(o, { productId: 'gems_60', accountId: 'acc' }); return { purchaseToken: 'tok', orderId: 'GPA.1' }; } } } };
    const r = await B.purchase(S, host, 'gems_60');
    assert.strictEqual(r.ok, true); assert.strictEqual(S.gems, 70); assert.deepStrictEqual(world.last, { productId: 'gems_60', purchaseToken: 'tok', orderId: 'GPA.1' });
    globalThis.Capacitor.Plugins.EonBilling.purchase = async () => { throw { code: 'USER_CANCELLED' }; };
    assert.deepStrictEqual(await B.purchase(S, host, 'gems_60'), { ok: false, reason: 'cancelled' });
    delete globalThis.Capacitor;
  });
  await t('MODO DONO: compra SIMULADA nunca chama a ponte do Google nem o servidor; entrega = a do servidor (dobro na 1ª, VIP = reais)', async () => {
    const S = { gems: 0, skins: [] }, host = { simConfirm: false, addGems: x => { S.gems += x; }, addSkin: id => S.skins.push(id), save: () => {} };
    const boom = () => { throw new Error('não podia chamar'); };
    globalThis.Capacitor = { Plugins: { EonBilling: { purchase: boom } } };
    const oldNet = globalThis.Sys.net; globalThis.Sys.net = { DATA: { on: true }, canBuy: boom, accountId: boom, verifyGoogle: boom, deliveries: boom, ackDelivery: boom };
    const vipAdds = []; globalThis.Sys.vip = { addPoints: (S2, n) => vipAdds.push(n) };
    globalThis.Sys.pass = { ensure: () => ({ premium: S.prem === true }), setPremium: (S2, on) => { S.prem = on; } };
    B.DATA.on = false; B.DATA.simForce = true;
    try {
      assert.strictEqual(B.simulated(), true); assert.strictEqual(B.ready(), true);
      let r = await B.purchase(S, host, 'gems_60'); assert.strictEqual(r.ok, true); assert.strictEqual(r.simulated, true); assert.strictEqual(S.gems, 120);   // dobro na 1ª
      r = await B.purchase(S, host, 'gems_60'); assert.strictEqual(S.gems, 180);                                                                           // depois, normal
      assert.deepStrictEqual(vipAdds, [4, 5]);                                                // R$ 4,90 + R$ 4,90 = R$ 9,80 → 4 + 5 pontos (centavos somados como no servidor)
      assert.ok(B.ensure(S).applied.every(id => id.startsWith('sim:gems_60:')));
      r = await B.purchase(S, host, 'pass_premium'); assert.strictEqual(S.prem, true);
      assert.strictEqual((await B.purchase(S, host, 'pass_premium')).reason, 'owned');
      assert.strictEqual((await B.purchase(S, host, 'first_offer')).reason, 'not_eligible');  // a oferta é só para quem nunca comprou
      r = await B.purchase(S, host, 'monthly_card'); assert.strictEqual(S.gems, 480);
      const c = B.cardClaim(S, host); assert.strictEqual(c.gems, 60); assert.strictEqual(B.cardClaim(S, host).reason, 'claimed');
      assert.strictEqual((await B.purchase(S, host, 'nada')).reason, 'unavailable');
    } finally { B.DATA.simForce = false; delete globalThis.Capacitor; globalThis.Sys.net = oldNet; delete globalThis.Sys.vip; delete globalThis.Sys.pass; }
    assert.strictEqual(B.simulated(), false); assert.strictEqual((await B.purchase(S, host, 'gems_60')).reason, 'soon');   // fora do Modo dono: nada
  });
  await t('MODO DONO por servidor: a chave do dono com realm (eras_owner_v1@s2) também simula; chave de jogador com @ não', async () => {
    globalThis.OWNER_MODE = true;
    try {
      globalThis.SAVE_KEY = 'eras_owner_v1@s2'; assert.strictEqual(B.simulated(), true);
      globalThis.SAVE_KEY = 'eras_owner_v1'; assert.strictEqual(B.simulated(), true);
      globalThis.SAVE_KEY = 'eras_proto_v2@s2'; assert.strictEqual(B.simulated(), false); assert.strictEqual(B.ready(), false);
      assert.strictEqual((await B.purchase({}, {}, 'gems_60')).reason, 'owner_guard');
      globalThis.SAVE_KEY = 'eras_owner_v1x'; assert.strictEqual(B.simulated(), false);
    } finally { delete globalThis.OWNER_MODE; delete globalThis.SAVE_KEY; }
  });
  await t('Cartão Mensal REAL: resgate pelo servidor (claim + entrega pela lista) e status pelo /entitlements', async () => {
    const S = { gems: 0 }, host = { addGems: x => { S.gems += x; }, save: () => {} }, dels = [];
    globalThis.Capacitor = { Plugins: { EonBilling: { purchase: async () => ({}) } } };
    const old = globalThis.Sys.net; let claimed = false;
    globalThis.Sys.net = { DATA: { on: true }, hasSession: () => true, entitlements: async () => ({ monthlyCard: { active: true, daysLeft: 12, claimedToday: claimed } }),
      claimMonthlyCard: async () => { if (claimed) throw { code: 'already_claimed' }; claimed = true; dels.push({ id: 'card1', grants: [{ kind: 'gems', amount: 60 }] }); return { gems: 60, daysLeft: 12 }; },
      deliveries: async () => dels.slice(), ackDelivery: async id => { const i = dels.findIndex(d => d.id === id); if (i >= 0) dels.splice(i, 1); } };
    B.DATA.on = true;
    try {
      assert.deepStrictEqual(await B.cardStatusLive(S, host), { active: true, daysLeft: 12, claimedToday: false, simulated: false });
      const r = await B.cardClaim(S, host); assert.strictEqual(r.ok, true); assert.strictEqual(r.gems, 60); assert.strictEqual(S.gems, 60);
      assert.strictEqual((await B.cardClaim(S, host)).reason, 'claimed'); assert.strictEqual(S.gems, 60);
      assert.strictEqual((await B.cardStatusLive(S, host)).claimedToday, true);
    } finally { B.DATA.on = false; globalThis.Sys.net = old; delete globalThis.Capacitor; }
    assert.strictEqual((await B.cardClaim(S, host)).reason, 'soon');
  });
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
