// node test/sys/net-signout.test.js — Sys.net.signOut (sair / trocar de conta, API_SERVIDOR §2.2b) contra um servidor FALSO (fetch simulado), sem rede e sem dormir
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('../../js/sys/net.js');

/** servidor falso: rotas → (body, headers) => [status, json, headers?]. Guarda os pedidos. */
function fake(routes) {
  const calls = [];
  const fetch = async (url, o) => {
    const path = url.replace('https://x/v1', ''), key = o.method + ' ' + path.split('?')[0];
    const body = o.body ? JSON.parse(o.body) : null;
    calls.push({ key, path, body, headers: o.headers });
    const h = routes[key];
    if (!h) return resp(404, { error: { code: 'not_found' } });
    const [st, js, hd] = await h(body, o.headers, path);
    return resp(st, js, hd);
  };
  const resp = (status, js, hd) => ({ status, headers: { get: k => (hd && hd[k.toLowerCase()] != null ? String(hd[k.toLowerCase()]) : null) }, json: async () => js });
  return { fetch, calls };
}
function store() { const m = {}; return { m, get: k => m[k] ?? null, set: (k, v) => { m[k] = v; } }; }
const session = (n, linked = ['google'], id = 'p1') => ({ accessToken: 'A' + n, refreshToken: 'R' + n, accessExpiresAt: 0, player: { id, ageBand: '18+', linked } });
const sleeps = [];
const sleep = async ms => { sleeps.push(ms); };
function boot(routes, st = store()) {
  net._reset(); net.DATA.on = true; net.DATA.base = 'https://x/v1'; net.DATA.signOutOn = true;
  sleeps.length = 0;
  const f = fake(routes); net.init({ fetch: f.fetch, storage: st, clientVersion: '0.13.0', sleep });
  return { f, st };
}
const mem = st => JSON.parse(st.m['eon.net']);
const S = { lvl: 7 };

test('chave desligada: devolve off e não faz nenhum pedido', async () => {
  const { f, st } = boot({ 'POST /auth/guest': () => [200, session(1)] });
  await net.ensureSession();
  net.DATA.signOutOn = false;
  const n = f.calls.length, before = st.m['eon.net'];
  assert.deepEqual(await net.signOut({ save: S }), { ok: false, reason: 'off' });
  assert.equal(f.calls.length, n);
  assert.equal(st.m['eon.net'], before);
  net.DATA.signOutOn = true;
});

test('ordem: save confirmado (PUT com owner) → logout → tokens apagados → deviceId novo', async () => {
  const order = [];
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': b => { order.push('put'); assert.equal(b.owner, 'p1'); assert.deepEqual(b.save, S); return [200, { version: 5, updatedAt: 1 }]; },
    'POST /auth/logout': b => { order.push('logout:' + b.refreshToken); assert.ok(mem(st).refresh, 'tokens ainda guardados no logout'); return [204, null]; },
  });
  await net.ensureSession();
  const oldDev = mem(st).deviceId;
  net.markDirty();
  const r = await net.signOut({ save: S, summary: s => ({ level: s.lvl }) });
  assert.deepEqual(r, { ok: true });
  assert.deepEqual(order, ['put', 'logout:R1']);
  const m = mem(st);
  assert.equal(m.access, undefined); assert.equal(m.refresh, undefined); assert.equal(m.player, undefined); assert.equal(m.save, undefined);
  assert.ok(m.deviceId && m.deviceId !== oldDev, 'deviceId novo');
  assert.equal(net.hasSession(), false);
  assert.equal(f.calls.find(c => c.key === 'PUT /save').body.summary.level, 7);
});

test('sem nada novo: confere GET /save/head (mesma version) e não sobe nada', async () => {
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': () => [200, { version: 3, updatedAt: 1 }],
    'GET /save/head': () => [200, { version: 3, updatedAt: 1, summary: {} }],
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession();
  net.markDirty(); await net.push(S, {});            // aparelho em dia na versão 3
  const puts = f.calls.filter(c => c.key === 'PUT /save').length;
  assert.deepEqual(await net.signOut(), { ok: true });
  assert.equal(f.calls.filter(c => c.key === 'PUT /save').length, puts);
  assert.ok(f.calls.some(c => c.key === 'GET /save/head'));
  assert.equal(mem(st).refresh, undefined);
});

test('head com outra version e sem o S: save_mismatch e nada apagado', async () => {
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /save/head': () => [200, { version: 9, updatedAt: 1, summary: {} }],
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession();
  const before = st.m['eon.net'];
  assert.deepEqual(await net.signOut(), { ok: false, reason: 'save_mismatch' });
  assert.equal(st.m['eon.net'], before);
  assert.ok(!f.calls.some(c => c.key === 'POST /auth/logout'));
});

test('429 no PUT /save: espera o Retry-After (falso) e repete até o 200', async () => {
  let n = 0;
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': () => (++n < 3 ? [429, { error: { code: 'rate_limited', retryAfterMs: 0 } }, { 'retry-after': 20 }] : [200, { version: 2, updatedAt: 1 }]),
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession(); net.markDirty();
  assert.deepEqual(await net.signOut({ getSave: () => S }), { ok: true });
  assert.equal(n, 3);
  assert.deepEqual(sleeps, [20000, 20000]);
  assert.equal(mem(st).refresh, undefined);
  assert.ok(f.calls.some(c => c.key === 'POST /auth/logout'));
});

test('429 sem parar: desiste no limite, devolve rate_limited e NADA é apagado', async () => {
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': () => [429, { error: { code: 'rate_limited', retryAfterMs: 30000 } }],
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession(); net.markDirty();
  const before = st.m['eon.net'];
  const r = await net.signOut({ save: S });
  assert.equal(r.ok, false); assert.equal(r.reason, 'rate_limited');
  assert.equal(r.retryAfterMs, 30000); assert.equal(r.retryAfterMin, 1);
  assert.ok(f.calls.filter(c => c.key === 'PUT /save').length <= net.DATA.signOutTries);
  assert.ok(sleeps.reduce((a, b) => a + b, 0) <= net.DATA.signOutMaxWaitMs);
  assert.equal(st.m['eon.net'], before);
  assert.ok(!f.calls.some(c => c.key === 'POST /auth/logout'));
});

test('falha do save (sem rede / 500): nada apagado, nenhum logout', async () => {
  for (const [put, want] of [[() => { throw new TypeError('rede'); }, 'offline'], [() => [500, { error: { code: 'internal' } }], 'internal']]) {
    const { f, st } = boot({ 'POST /auth/guest': () => [200, session(1)], 'PUT /save': put, 'POST /auth/logout': () => [204, null] });
    await net.ensureSession(); net.markDirty();
    const before = st.m['eon.net'];
    assert.deepEqual(await net.signOut({ save: S }), { ok: false, reason: want });
    assert.equal(st.m['eon.net'], before);
    assert.ok(!f.calls.some(c => c.key === 'POST /auth/logout'));
    assert.equal(net.hasSession(), true);
  }
});

test('aparelho com mudança e sem o S: no_save, nada apagado', async () => {
  const { st } = boot({ 'POST /auth/guest': () => [200, session(1)] });
  await net.ensureSession(); net.markDirty();
  const before = st.m['eon.net'];
  assert.deepEqual(await net.signOut(), { ok: false, reason: 'no_save' });
  assert.equal(st.m['eon.net'], before);
});

test('409 wrong_account chega como reason (no signOut e no push normal)', async () => {
  const { f, st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': b => (b.owner === 'p1' ? [409, { error: { code: 'wrong_account', details: { session: 'p2' } } }] : [200, { version: 1 }]),
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession(); net.markDirty();
  const before = st.m['eon.net'];
  const r = await net.signOut({ save: S });
  assert.deepEqual(r, { ok: false, reason: 'wrong_account', details: { session: 'p2' } });
  assert.equal(st.m['eon.net'], before);
  assert.ok(!f.calls.some(c => c.key === 'POST /auth/logout'));
  await assert.rejects(net.push(S, {}), e => e.code === 'wrong_account' && e.reason === 'wrong_account' && e.status === 409 && e.details.session === 'p2');
});

test('owner vai em todo PUT /save (push e sync), com o id do jogador da sessão', async () => {
  const { f } = boot({
    'POST /auth/guest': () => [200, session(1, [], 'pX')],
    'GET /save/head': () => [404, { error: { code: 'not_found' } }],
    'PUT /save': () => [200, { version: 1 }],
  });
  await net.ensureSession();
  await net.sync(S, {}); net.markDirty(); await net.push(S, {});
  const puts = f.calls.filter(c => c.key === 'PUT /save');
  assert.equal(puts.length, 2);
  for (const p of puts) assert.equal(p.body.owner, 'pX');
});

test('convidado sem Google não sai (perderia a conta): not_google, nada apagado', async () => {
  const { f, st } = boot({ 'POST /auth/guest': () => [200, session(1, [])] });
  await net.ensureSession();
  const before = st.m['eon.net'], n = f.calls.length;
  assert.deepEqual(await net.signOut({ save: S }), { ok: false, reason: 'not_google' });
  assert.equal(st.m['eon.net'], before); assert.equal(f.calls.length, n);
});

test('logout 401 (sessão já morta) segue; logout sem rede para sem apagar', async () => {
  let mode = 401;
  const { st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /save/head': () => [404, { error: { code: 'not_found' } }],
    'PUT /save': () => [200, { version: 1 }],
    'POST /auth/logout': () => { if (mode === 'off') throw new TypeError('rede'); return [401, { error: { code: 'token_invalid' } }]; },
  });
  await net.ensureSession();
  assert.deepEqual(await net.signOut({ save: S }), { ok: true });
  assert.equal(mem(st).refresh, undefined);
  // de novo, agora com o logout sem rede: para sem apagar
  mode = 'off';
  boot({
    'POST /auth/guest': () => [200, session(2)],
    'GET /save/head': () => [404, { error: { code: 'not_found' } }],
    'PUT /save': () => [200, { version: 1 }],
    'POST /auth/logout': () => { throw new TypeError('rede'); },
  }, st);
  await net.ensureSession();
  const dev = mem(st).deviceId;
  assert.deepEqual(await net.signOut({ save: S }), { ok: false, reason: 'offline' });
  assert.equal(mem(st).refresh, 'R2'); assert.equal(mem(st).deviceId, dev);
});

test('as sessões dos outros servidores guardadas no aparelho também saem e ficam com o deviceId novo', async () => {
  const st = store();
  st.m['eon.net@s2'] = JSON.stringify({ deviceId: 'old', access: 'B', refresh: 'RS2', player: { id: 'p1' } });
  const { f } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /save/head': () => [404, { error: { code: 'not_found' } }],
    'PUT /save': () => [200, { version: 1 }],
    'POST /auth/logout': () => [204, null],
  }, st);
  await net.ensureSession();
  assert.deepEqual(await net.signOut({ save: S }), { ok: true });
  const dev = mem(st).deviceId;
  assert.deepEqual(JSON.parse(st.m['eon.net@s2']), { deviceId: dev });
  assert.deepEqual(f.calls.filter(c => c.key === 'POST /auth/logout').map(c => c.body.refreshToken), ['R1', 'RS2']);
});

test('429 no /auth/guest: reason rate_limited com retryAfterMin (Retry-After em minutos, para cima)', async () => {
  boot({ 'POST /auth/guest': () => [429, { error: { code: 'rate_limited', retryAfterMs: 0 } }, { 'retry-after': 1810 }] });
  await assert.rejects(net.ensureSession(), e => e.code === 'rate_limited' && e.reason === 'rate_limited' && e.retryAfterMs === 1810000 && e.retryAfterMin === 31);
  boot({ 'POST /auth/guest': () => [429, { error: { code: 'rate_limited', retryAfterMs: 61000 } }] });
  await assert.rejects(net.ensureSession(), e => e.reason === 'rate_limited' && e.retryAfterMin === 2);
  boot({ 'POST /auth/login/google': () => [429, { error: { code: 'rate_limited', retryAfterMs: 3000 } }] });
  await assert.rejects(net.loginGoogle({ idToken: 't' }), e => e.reason === 'rate_limited' && e.retryAfterMin === 1);
});

test('login Google sem vínculo (404): reason not_linked (com ou sem código no corpo)', async () => {
  boot({ 'POST /auth/login/google': () => [404, { error: { code: 'not_linked' } }] });
  await assert.rejects(net.loginGoogle({ idToken: 't' }), e => e.code === 'not_linked' && e.reason === 'not_linked' && e.status === 404);
  boot({ 'POST /auth/login/google': () => [404, null] });
  await assert.rejects(net.loginGoogle({ idToken: 't' }), e => e.code === 'not_linked' && e.reason === 'not_linked');
});

test('dois toques em Sair: o segundo devolve busy', async () => {
  let release;
  const { st } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /save/head': () => new Promise(r => { release = () => r([200, { version: 0, summary: {} }]); }),
    'POST /auth/logout': () => [204, null],
  });
  await net.ensureSession();
  const a = net.signOut();
  assert.deepEqual(await net.signOut(), { ok: false, reason: 'busy' });
  await new Promise(r => setImmediate(r)); release();
  assert.deepEqual(await a, { ok: true });
  assert.equal(mem(st).refresh, undefined);
});
