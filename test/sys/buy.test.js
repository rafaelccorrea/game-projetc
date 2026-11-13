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
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
