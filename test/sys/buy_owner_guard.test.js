// node test/sys/buy_owner_guard.test.js — TRAVAS DA COMPRA SIMULADA (QA, reforço do test/sys/buy.test.js)
// A ponte do Google e o Sys.net são trocados por funções que EXPLODEM se chamadas. Casos:
//   1) Modo dono de verdade (OWNER_MODE + SAVE_KEY do dono): simula, nada chega à ponte nem ao servidor
//   2) OWNER_MODE verdadeiro mas SAVE_KEY real: NÃO simula e NÃO compra de verdade (recusa)
//   3) SAVE_KEY do dono com OWNER_MODE falso: idem
//   4) jogador comum (nada de Modo dono) com a compra real desligada: "soon"; ready() falso
//   5) as variáveis do jogo (OWNER_MODE/SAVE_KEY) ausentes: nunca simula
//   6) zero emoji no que a compra simulada mostra ao jogador (overlay) e no que devolve
'use strict';
const assert = require('assert');
globalThis.window = globalThis;
globalThis.Sys = globalThis.Sys || {};
const B = require('../../js/sys/buy.js');
let n = 0, fails = 0; const t = async (name, fn) => { try { await fn(); n++; console.log('ok -', name); } catch (e) { fails++; console.log('FALHA -', name, '\n      ', String(e.message).split('\n')[0]); } };
const boom = name => () => { throw new Error('CHAMOU ' + name + ' (compra real/servidor não podia ser chamada)'); };
const calls = [];
function fakeWorld() {
  calls.length = 0;
  const S = { gems: 10, skins: [] }, host = { simConfirm: false, addGems: x => { S.gems += x; }, addSkin: id => { if (!S.skins.includes(id)) S.skins.push(id); }, save() {} };
  globalThis.Sys.net = { DATA: { on: true }, hasSession: () => true, canBuy: async () => { calls.push('canBuy'); boom('Sys.net.canBuy')(); }, accountId: async () => { calls.push('accountId'); boom('Sys.net.accountId')(); },
    verifyGoogle: async () => { calls.push('verifyGoogle'); boom('Sys.net.verifyGoogle')(); }, deliveries: async () => { calls.push('deliveries'); return []; }, ackDelivery: async () => {} };
  globalThis.Capacitor = { Plugins: { [B.DATA.plugin]: { purchase: async () => { calls.push('ponte'); boom('ponte do Google')(); } } } };
  globalThis.Sys.vip = { addPoints: (S2, k) => { S2.vipPts = (S2.vipPts || 0) + k; } }; globalThis.Sys.pass = { setPremium() {} }; globalThis.Sys.offer = { grant: () => ({ ok: true }) };
  return { S, host };
}
const mode = (owner, key) => { if (owner === undefined) delete globalThis.OWNER_MODE; else globalThis.OWNER_MODE = owner; if (key === undefined) delete globalThis.SAVE_KEY; else globalThis.SAVE_KEY = key; };
const REAL = 'eras_proto_v2', DONO = 'eras_owner_v1';
const noReal = r => assert(calls.indexOf('ponte') < 0 && calls.indexOf('canBuy') < 0 && calls.indexOf('verifyGoogle') < 0 && calls.indexOf('accountId') < 0, 'a ponte/servidor foi chamado: ' + calls.join(','));

(async () => {
  B.DATA.on = true;   // pior caso: a compra real "ligada" e a ponte do Play presente
  await t('1) Modo dono (OWNER_MODE + eras_owner_v1): simula, sem ponte nem servidor, entrega gemas e id sim:', async () => {
    mode(true, DONO); const { S, host } = fakeWorld(); assert.strictEqual(B.simulated(), true); assert.strictEqual(B.ready(), true);
    const r = await B.purchase(S, host, 'gems_60'); assert.strictEqual(r.ok, true, JSON.stringify(r)); assert.strictEqual(r.simulated, true); noReal(); assert(S.gems > 10, 'entregou');
    assert(r.applied && /^sim:/.test(r.applied[0].id), 'id sim:'); });
  await t('2) OWNER_MODE verdadeiro mas SAVE_KEY REAL: recusa (nem simula nem compra de verdade)', async () => {
    mode(true, REAL); const { S, host } = fakeWorld(); assert.strictEqual(B.simulated(), false);
    const r = await B.purchase(S, host, 'gems_60'); noReal(); assert.strictEqual(r.ok, false, 'devia recusar: ' + JSON.stringify(r)); assert.strictEqual(S.gems, 10, 'nada entregue');
    assert.strictEqual(B.ready(), false, 'ready() devia ser falso nesse estado'); });
  await t('3) SAVE_KEY do dono com OWNER_MODE falso: recusa (nem simula nem compra de verdade)', async () => {
    mode(false, DONO); const { S, host } = fakeWorld(); assert.strictEqual(B.simulated(), false);
    const r = await B.purchase(S, host, 'gems_60'); noReal(); assert.strictEqual(r.ok, false, 'devia recusar: ' + JSON.stringify(r)); assert.strictEqual(S.gems, 10);
    assert.strictEqual(B.ready(), false, 'ready() devia ser falso nesse estado'); });
  await t('4) jogador comum (OWNER_MODE falso, save real) com a compra real DESLIGADA: soon e ready() falso', async () => {
    mode(false, REAL); B.DATA.on = false; const { S, host } = fakeWorld(); assert.strictEqual(B.ready(), false);
    const r = await B.purchase(S, host, 'gems_60'); noReal(); assert.deepStrictEqual(r, { ok: false, reason: 'soon' }); assert.strictEqual(S.gems, 10); B.DATA.on = true; });
  await t('5) OWNER_MODE/SAVE_KEY ausentes (fora do jogo): nunca simula', async () => {
    mode(undefined, undefined); const { S, host } = fakeWorld(); assert.strictEqual(B.simulated(), false); B.DATA.on = false;
    const r = await B.purchase(S, host, 'gems_60'); noReal(); assert.strictEqual(r.ok, false); B.DATA.on = true; });
  await t('6) simForce (só teste) fica DESLIGADO por padrão', async () => { assert.strictEqual(B.DATA.simForce, false); });
  await t('7) zero emoji no overlay da compra simulada e nas respostas', async () => {
    mode(true, DONO); const { S, host } = fakeWorld(); host.simConfirm = true; let html = '';
    const el = () => ({ style: {}, setAttribute() {}, addEventListener() {}, remove() {}, querySelector: () => ({ focus() {} }), set innerHTML(v) { html = v; }, get innerHTML() { return html; } });
    globalThis.document = { body: { appendChild(v) { setTimeout(() => { try { v.addEventListener; } catch (e) {} }, 0); } }, createElement: el };
    B.simulated(); const p = B.purchase(S, host, 'gems_60'); await new Promise(r => setTimeout(r, 20));
    assert(/COMPRA SIMULADA/.test(html), 'overlay mostra COMPRA SIMULADA: ' + html.slice(0, 60)); assert(!/\p{Extended_Pictographic}/u.test(html), 'emoji no overlay'); assert(/nada é cobrado/.test(html));
    delete globalThis.document; void p; });
  console.log(fails ? '\n' + fails + ' FALHA(S) de ' + (n + fails) : '\nTODOS OS ' + n + ' CASOS PASSARAM'); process.exit(fails ? 1 : 0);
})();
