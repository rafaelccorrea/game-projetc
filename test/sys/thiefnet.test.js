// node test/sys/thiefnet.test.js — Sys.thiefNet com o Sys.thief, o Sys.bonfire e o Sys.net DE VERDADE e um fetch falso (contrato API_SERVIDOR §15).
// Entrada gasta no enter (no servidor), finish paga o que o servidor diz e credita UMA vez por runId, sweep, 429 daily_limit, 409, 404 → local.
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
['stats', 'level', 'loot', 'forge', 'bonfire', 'thief'].forEach(m => require('../../js/sys/' + m + '.js'));
const NET = require('../../js/sys/net.js'), TN = require('../../js/sys/thiefnet.js');
const { makeHost } = require('./_host.js');
const BF = Sys.bonfire, TH = Sys.thief;
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };
const BASE = 'https://srv.test/v1';
const LOT = lv => { let x = 1; for (const b of [[1, 1], [4, 2], [7, 4], [10, 5], [20, 6], [35, 8], [50, 10]]) if (lv >= b[0]) x = b[1]; return x; };

/* servidor falso com as regras do fps-server (thief-core.ts): entradas no servidor, lote pelo nível da Fogueira do save, 1 fim por corrida */
function server(o) {
  o = o || {}; const calls = [];
  const sv = { calls, down: false, off: false, perDay: o.perDay || 2, entries: 0, fireLv: o.fireLv || 12, runId: null, runDone: true, runMax: 0, runLv: 0,
    bestLv: o.bestLv || 0, total: 0, lastReward: 0, seq: 0 };
  const view = () => ({ day: 20405, perDay: sv.perDay, entriesLeft: Math.max(0, sv.perDay - sv.entries), batch: LOT(sv.fireLv), fireLevel: sv.fireLv,
    lastReward: sv.lastReward, bestLevel: sv.bestLv, sweepBrasas: sv.bestLv ? LOT(sv.bestLv) : 0, canSweep: sv.bestLv > 0,
    run: sv.runId && !sv.runDone ? { runId: sv.runId, endsAt: 2000 } : null, resetsInMs: 3600000, provisional: true });
  const R = {
    'GET /thief': () => view(),
    'POST /thief/enter': () => { if (sv.entries >= sv.perDay) return { err: 'daily_limit', status: 429, retryAfterMs: 3600000, details: { key: 'thief', perDay: sv.perDay } };
      sv.entries++; sv.runId = 'run' + (++sv.seq); sv.runDone = false; sv.runMax = LOT(sv.fireLv); sv.runLv = sv.fireLv;
      return { runId: sv.runId, seed: 77, startsAt: 1000, endsAt: 46000, maxBrasas: sv.runMax, entriesLeft: sv.perDay - sv.entries }; },
    'POST /thief/finish': b => { if (!sv.runId || sv.runId !== String(b.runId)) return { err: 'not_found', status: 404 }; if (sv.runDone) return { err: 'already_finished' };
      const sc = Math.max(0, Math.min(1, Number(b.score) || 0)), br = Math.round(sc * sv.runMax); sv.runDone = true; sv.lastReward = br; sv.total += br;
      if (sc >= 1 && sv.runLv > sv.bestLv) sv.bestLv = sv.runLv; return { brasas: br, score: sc, maxBrasas: sv.runMax, total: sv.total }; },
    'POST /thief/sweep': () => { if (!sv.bestLv) return { err: 'nothing_to_sweep' }; if (sv.entries >= sv.perDay) return { err: 'daily_limit', status: 429, retryAfterMs: 3600000 };
      const br = LOT(sv.bestLv); sv.entries++; sv.lastReward = br; sv.total += br; return { brasas: br, bestLevel: sv.bestLv, entriesLeft: sv.perDay - sv.entries, total: sv.total }; },
  };
  globalThis.__fetch = async (url, init) => {
    if (sv.down) throw new Error('rede');
    const path = url.slice(BASE.length), m = init.method;
    calls.push({ m, path, body: init.body, auth: init.headers.authorization });
    const res = (status, data) => ({ status, headers: { get: () => null }, json: async () => data });
    if (sv.off) return res(404, { error: { code: 'not_found' } });
    const h = R[m + ' ' + path]; if (!h) return res(404, { error: { code: 'not_found' } });
    const r = h(init.body === undefined ? undefined : JSON.parse(init.body));
    if (sv.lose && m === 'POST' && path === '/thief/finish') { sv.lose = false; throw new Error('rede caiu depois do servidor gravar'); }
    return r && r.err ? res(r.status || 409, { error: { code: r.err, details: r.details || {}, retryAfterMs: r.retryAfterMs || 0 } }) : res(200, r);
  };
  return sv;
}
function netOn() {
  const mem = {}; mem['eon.net'] = JSON.stringify({ deviceId: 'dev1', access: 'TOK', refresh: 'R' });
  NET.init({ fetch: (u, i) => globalThis.__fetch(u, i), storage: { get: k => mem[k], set: (k, v) => { mem[k] = v; } } });
  NET.DATA.base = BASE; NET.DATA.on = true;
}
function world(lv) { const S = {}, host = makeHost({ now: Date.UTC(2026, 10, 13, 15, 0, 0) }); BF.ensure(S).lv = lv || 12; return { S, host }; }
function keysOn() { BF.DATA.on = true; TH.DATA.on = true; }
async function started(o, lv) { keysOn(); TH.setProvider(null); TN._reset(); TN.DATA.on = true; const w = world(lv); const sv = server(Object.assign({ fireLv: lv || 12 }, o));
  const r = await TN.start(w.S, w.host); assert.ok(r.ok, JSON.stringify(r)); sv.calls.length = 0; return { w, sv }; }
const bra = S => BF.ensure(S).bra, got = S => BF.ensure(S).got;

(async () => {
  netOn();
  await t('chave desligada (padrão): nada sai e o Sys.thief segue LOCAL', async () => {
    TN._reset(); TH.setProvider(null); assert.strictEqual(TN.DATA.on, false, 'nasce DESLIGADA'); keysOn();
    const w = world(), sv = server();
    for (const r of [await TN.start(w.S, w.host), await TN.refresh(w.S, w.host), await TN.enter(w.S, w.host), await TN.finish(w.S, w.host, 1), await TN.sweep(w.S, w.host)])
      assert.strictEqual(r.reason, 'off');
    assert.strictEqual(sv.calls.length, 0); assert.strictEqual(TH.online(), false);
    assert.ok(TH.enter(w.S, w.host).ok, 'local continua igual'); assert.strictEqual(TH.finish(w.S, w.host, { score: 1 }).brasas, 5);
  });

  await t('404 (THIEF_ON desligado) e sem rede no start: fica o LOCAL', async () => {
    keysOn(); TH.setProvider(null); TN._reset(); TN.DATA.on = true;
    const w = world(), sv = server(); sv.off = true;
    const r = await TN.start(w.S, w.host); assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'not_found');
    assert.strictEqual(TH.online(), false); assert.strictEqual(TN.state().started, false); assert.ok(TH.enter(w.S, w.host).ok, 'local joga');
    sv.off = false; sv.down = true; const w2 = world(); assert.strictEqual((await TN.start(w2.S, w2.host)).reason, 'offline'); assert.strictEqual(TH.online(), false);
  });

  await t('start: GET /v1/thief com o token, espelha entradas e melhor nível; o Sys.thief síncrono recusa (não gasta sozinho)', async () => {
    keysOn(); TH.setProvider(null); TN._reset(); TN.DATA.on = true; const w = world(); const sv = server({ bestLv: 9 }); sv.entries = 1;
    assert.deepStrictEqual(await TN.start(w.S, w.host), { ok: true, left: 1, best: 9 });
    assert.deepStrictEqual(sv.calls.map(c => c.m + ' ' + c.path), ['GET /thief']); assert.strictEqual(sv.calls[0].auth, 'Bearer TOK');
    assert.strictEqual(TH.online(), true); const v = TH.view(w.S, w.host); assert.ok(v.left === 1 && v.best === 9 && v.sweepLote === 4 && v.canSweep);
    for (const r of [TH.enter(w.S, w.host), TH.finish(w.S, w.host, { score: 1 }), TH.sweep(w.S, w.host)]) assert.strictEqual(r.reason, 'online');
    assert.strictEqual(TH.view(w.S, w.host).left, 1, 'nada gasto localmente'); assert.strictEqual(sv.calls.length, 1);
  });

  await t('enter: POST /v1/thief/enter sem corpo; a entrada é gasta AO ENTRAR (no servidor); runId e lote do servidor', async () => {
    const { w, sv } = await started(null, 12);
    const e = await TN.enter(w.S, w.host);
    assert.ok(e.ok && e.runId === 'run1' && e.lote === 5 && e.secs === 45 && e.seed === 77 && e.left === 1, JSON.stringify(e));
    assert.deepStrictEqual(sv.calls.map(c => [c.m, c.path, c.body]), [['POST', '/thief/enter', undefined]]);
    assert.strictEqual(TH.view(w.S, w.host).left, 1); assert.strictEqual(TH.ensure(w.S).run.id, 'run1');
    assert.strictEqual((await TN.enter(w.S, w.host)).reason, 'run', 'uma corrida de cada vez'); assert.strictEqual(sv.calls.length, 1);
    assert.strictEqual(bra(w.S), 0, 'entrar não paga');
  });

  await t('finish: POST {runId, score}; paga o que o servidor diz pelo Sys.bonfire.addBrasas(thief) UMA vez; não gasta outra entrada; score 1 vence o nível', async () => {
    const { w, sv } = await started(null, 12);
    await TN.enter(w.S, w.host); sv.calls.length = 0;
    const r = await TN.finish(w.S, w.host, 1);
    assert.ok(r.ok && r.won && r.drop === 5 && r.brasas === 5 && r.best === 12 && r.left === 1 && r.runId === 'run1' && r.total === 5, JSON.stringify(r));
    assert.deepStrictEqual(sv.calls.map(c => [c.m, c.path, c.body]), [['POST', '/thief/finish', '{"runId":"run1","score":1}'], ['GET', '/thief', undefined]]);
    assert.strictEqual(bra(w.S), 5); assert.strictEqual(got(w.S), 5); assert.strictEqual(sv.entries, 1, 'o fim não gasta entrada');
    assert.strictEqual(TH.ensure(w.S).run, null); assert.deepStrictEqual(TH.ensure(w.S).paid, ['run1']);
    assert.strictEqual((await TN.finish(w.S, w.host, 1)).reason, 'run', 'sem corrida aberta não chama o servidor');
    assert.strictEqual(TH.serverFinish(w.S, w.host, 'run1', { brasas: 5, score: 1, maxBrasas: 5 }).reason, 'paid', 'mesmo runId não credita duas vezes');
    assert.strictEqual(bra(w.S), 5);
  });

  await t('finish parcial: round(lote × score); score acima de 1 vai como 1; nível não vence', async () => {
    const { w, sv } = await started(null, 50);
    await TN.enter(w.S, w.host); const r = await TN.finish(w.S, w.host, 0.34);
    assert.ok(r.ok && !r.won && r.drop === 3 && r.brasas === 3 && r.lote === 10 && r.best === 0);
    await TN.enter(w.S, w.host); sv.calls.length = 0; const r2 = await TN.finish(w.S, w.host, 7);
    assert.strictEqual(JSON.parse(sv.calls[0].body).score, 1); assert.strictEqual(r2.brasas, 10); assert.strictEqual(bra(w.S), 13);
  });

  await t('dois toques no fim ao mesmo tempo: um só pedido e um só crédito', async () => {
    const { w, sv } = await started(null, 12);
    await TN.enter(w.S, w.host); sv.calls.length = 0;
    const [a, b] = await Promise.all([TN.finish(w.S, w.host, 1), TN.finish(w.S, w.host, 1)]);
    assert.ok(a.ok); assert.strictEqual(b.reason, 'busy'); assert.strictEqual(sv.calls.filter(c => c.path === '/thief/finish').length, 1); assert.strictEqual(bra(w.S), 5);
  });

  await t('409 already_finished (resposta perdida) e not_found: sai da corrida sem pagar de novo', async () => {
    const { w, sv } = await started(null, 12);
    await TN.enter(w.S, w.host); sv.lose = true;
    const r = await TN.finish(w.S, w.host, 1); assert.strictEqual(r.reason, 'offline'); assert.strictEqual(TH.ensure(w.S).run.id, 'run1', 'rede: a corrida fica para tentar de novo');
    const r2 = await TN.finish(w.S, w.host, 1); assert.strictEqual(r2.reason, 'already_finished'); assert.strictEqual(r2.local, 'run');
    assert.strictEqual(TH.ensure(w.S).run, null); assert.strictEqual(bra(w.S), 0, 'não credita sem o valor do servidor');
    TH.ensure(w.S).run = { lv: 12, t: 0, id: 'velho', max: 5 };
    assert.strictEqual((await TN.finish(w.S, w.host, 1)).reason, 'not_found'); assert.strictEqual(TH.ensure(w.S).run, null); assert.strictEqual(bra(w.S), 0);
  });

  await t('429 daily_limit no enter: devolve retryAfterMs e local "entries", espelha as entradas do servidor e não abre corrida', async () => {
    const { w, sv } = await started(null, 12); sv.entries = 2;
    const r = await TN.enter(w.S, w.host);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'daily_limit'); assert.strictEqual(r.local, 'entries'); assert.strictEqual(r.retryAfterMs, 3600000);
    assert.deepStrictEqual(r.details, { key: 'thief', perDay: 2 }); assert.strictEqual(TH.ensure(w.S).run, null); assert.strictEqual(TH.view(w.S, w.host).left, 0);
  });

  await t('sweep: POST /v1/thief/sweep gasta 1 entrada e paga o lote cheio do melhor nível; 409 nothing_to_sweep; 429 sem entradas', async () => {
    let { w, sv } = await started(null, 12);
    const n0 = await TN.sweep(w.S, w.host); assert.strictEqual(n0.reason, 'nothing_to_sweep'); assert.strictEqual(n0.local, 'none'); assert.strictEqual(sv.entries, 0);
    ({ w, sv } = await started({ bestLv: 8 }, 40));
    const s = await TN.sweep(w.S, w.host); assert.ok(s.ok && s.lv === 8 && s.drop === 4 && s.brasas === 4 && s.left === 1 && s.total === 4, JSON.stringify(s));
    assert.deepStrictEqual(sv.calls.map(c => [c.m, c.path, c.body]), [['POST', '/thief/sweep', undefined]]);
    await TN.sweep(w.S, w.host); const s3 = await TN.sweep(w.S, w.host); assert.strictEqual(s3.reason, 'daily_limit'); assert.strictEqual(s3.local, 'entries');
    assert.strictEqual(bra(w.S), 8); assert.strictEqual(got(w.S), 8); assert.strictEqual(TH.view(w.S, w.host).left, 0);
  });

  await t('corrida aberta no servidor (outro aparelho / app fechado): o refresh traz o runId e o finish paga', async () => {
    const { w, sv } = await started(null, 12);
    sv.entries = 1; sv.runId = 'runX'; sv.runDone = false; sv.runMax = 5; sv.runLv = 12;
    await TN.refresh(w.S, w.host); assert.strictEqual(TH.view(w.S, w.host).run.lv, 12); assert.strictEqual(TH.ensure(w.S).run.id, 'runX');
    const r = await TN.finish(w.S, w.host, 1); assert.ok(r.ok && r.brasas === 5 && r.runId === 'runX'); assert.strictEqual(bra(w.S), 5);
    await TN.refresh(w.S, w.host); assert.strictEqual(TH.ensure(w.S).run, null);
  });

  await t('o servidor manda: perDay do servidor e melhor nível espelhados; sem corrida no servidor a local some', async () => {
    const { w, sv } = await started({ perDay: 3, bestLv: 20 }, 12);
    let v = TH.view(w.S, w.host); assert.ok(v.entries === 3 && v.left === 3 && v.best === 20);
    TH.ensure(w.S).run = { lv: 5, t: 0 }; await TN.refresh(w.S, w.host); assert.strictEqual(TH.ensure(w.S).run, null);
    sv.entries = 3; await TN.refresh(w.S, w.host); v = TH.view(w.S, w.host); assert.ok(v.left === 0 && !v.canEnter && !v.canSweep);
  });

  await t('404 com o online ligado (servidor desligou THIEF_ON): volta ao LOCAL', async () => {
    const { w, sv } = await started(null, 12); sv.off = true;
    const r = await TN.refresh(w.S, w.host); assert.strictEqual(r.reason, 'not_found');
    assert.strictEqual(TN.state().started, false); assert.strictEqual(TH.online(), false); assert.strictEqual(TH.view(w.S, w.host).entries, 2);
    assert.strictEqual((await TN.enter(w.S, w.host)).reason, 'off'); assert.ok(TH.enter(w.S, w.host).ok, 'local de novo');
  });

  await t('nada à venda: sem preço, gema, produto, anúncio ou sorteio no thiefnet', async () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '../../js/sys/thiefnet.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.ok(!/gems|productId|brl|price|preço|addGems|Math\.random|\bads?\b/i.test(src));
  });

  TH.setProvider(null); TN._reset();
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
