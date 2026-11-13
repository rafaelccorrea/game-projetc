// node test/sys/online.test.js — Sys.online com Sys.net/Sys.buy/Sys.mail FALSOS (sem rede)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const O = require('../../js/sys/online.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };
function fakeNet(o) {
  const calls = [];
  return Object.assign({ DATA: { on: false }, calls, init() { calls.push('init'); }, ensureSession: async () => { calls.push('session'); }, markDirty() { calls.push('dirty'); },
    sync: async () => ({ action: 'push', version: 1 }), chooseSide: async side => (calls.push('choose:' + side), side === 'cloud' ? { action: 'pulled', save: { from: 'cloud' } } : { action: 'push' }),
    push: async () => { calls.push('push'); return { version: 2 }; }, mail: async () => [{ id: 'm1', title: 'Prêmio', att: { gems: 5 } }] }, o);
}
(async () => {
  await t('desligado: não chama nada (jogo segue local)', async () => {
    O._reset(); O.DATA.on = false; Sys.net = fakeNet();
    assert.deepStrictEqual(await O.boot({}, {}, {}), { ok: false, reason: 'off' }); assert.deepStrictEqual(Sys.net.calls, []);
    assert.strictEqual(O.saved({}), false);
  });
  await t('boot: sessão → save → entregas → correio', async () => {
    O._reset(); O.DATA.on = true; Sys.net = fakeNet();
    Sys.buy = { DATA: { on: true }, sync: async () => [{ id: 'd1' }] };
    let got = null; Sys.mail = { DATA: { enabled: true }, receive: (S, h, l) => (got = l, l.length) };
    const r = await O.boot({ a: 1 }, {}, { summary: () => ({ level: 3 }) });
    assert.deepStrictEqual([r.ok, r.save, r.deliveries, r.mail, r.errors], [true, 'push', 1, 1, []]); assert.strictEqual(got[0].id, 'm1');
    assert.deepStrictEqual(Sys.net.calls.slice(0, 2), ['init', 'session']);
  });
  await t('agenda: no boot o Sys.schedule recebe a hora do servidor', async () => {
    O._reset(); O.DATA.on = true; Sys.net = fakeNet({ serverNow: () => 123456789 }); Sys.buy = null; Sys.mail = null;
    let got = null; Sys.schedule = { setServerTime: (ms, h) => { got = [ms, h && h.tag]; } };
    await O.boot({}, { tag: 'host' }, {}); assert.deepStrictEqual(got, [123456789, 'host']); delete Sys.schedule;
  });
  await t('os dois mudaram: pergunta ao jogo; "nuvem" troca o save', async () => {
    O._reset(); O.DATA.on = true; Sys.net = fakeNet({ sync: async () => ({ action: 'choose', recommend: 'device' }) }); Sys.buy = null; Sys.mail = null;
    let applied = null; const r = await O.boot({ a: 1 }, {}, { choose: async () => 'cloud', apply: s => { applied = s; } });
    assert.strictEqual(r.save, 'pulled'); assert.deepStrictEqual(applied, { from: 'cloud' }); assert.ok(Sys.net.calls.includes('choose:cloud'));
  });
  await t('offline na sessão: não trava e não tenta o resto', async () => {
    O._reset(); O.DATA.on = true; Sys.net = fakeNet({ ensureSession: async () => { throw Object.assign(new Error('x'), { code: 'offline' }); } });
    assert.deepStrictEqual(await O.boot({}, {}, {}), { ok: false, reason: 'offline' });
  });
  await t('erro em um passo não impede os outros', async () => {
    O._reset(); O.DATA.on = true; Sys.net = fakeNet({ sync: async () => { throw Object.assign(new Error('x'), { code: 'save_implausible' }); } });
    Sys.buy = { DATA: { on: true }, sync: async () => [{ id: 'a' }, { id: 'b' }] }; Sys.mail = null;
    const r = await O.boot({}, {}, {}); assert.deepStrictEqual([r.deliveries, r.errors], [2, ['save:save_implausible']]);
  });
  await t('saved(): marca sujo e sobe uma vez por intervalo', async () => {
    O._reset(); O.DATA.on = true; O.DATA.pushEveryMs = 30; Sys.net = fakeNet(); Sys.buy = null; Sys.mail = null;
    await O.boot({}, {}, {}); Sys.net.calls.length = 0;
    O.saved({ v: 1 }); O.saved({ v: 2 }); O.saved({ v: 3 });
    await new Promise(r => setTimeout(r, 80));
    assert.strictEqual(Sys.net.calls.filter(c => c === 'push').length, 1); assert.strictEqual(Sys.net.calls.filter(c => c === 'dirty').length, 3);
    O._reset();
  });
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
