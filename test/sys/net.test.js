// node --test test/sys/net.test.js — Sys.net contra um servidor FALSO (fetch simulado), sem rede
const { test } = require('node:test');
const assert = require('node:assert/strict');
const net = require('../../js/sys/net.js');

/** servidor falso: rotas → (body, headers) => [status, json]. Guarda os pedidos. */
function fake(routes) {
  const calls = [];
  const fetch = async (url, o) => {
    const path = url.replace('https://x/v1', ''), key = o.method + ' ' + path.split('?')[0];
    const body = o.body ? JSON.parse(o.body) : null;
    calls.push({ key, path, body, headers: o.headers });
    const h = routes[key];
    if (!h) return resp(404, { error: { code: 'not_found' } });
    const [st, js] = await h(body, o.headers, path);
    return resp(st, js);
  };
  const resp = (status, js) => ({ status, headers: { get: k => (k === 'x-server-time' ? String(Date.now() + 3600000) : null) }, json: async () => js });
  return { fetch, calls };
}
function store() { const m = {}; return { m, get: k => m[k] ?? null, set: (k, v) => { m[k] = v; } }; }
const session = n => ({ accessToken: 'A' + n, refreshToken: 'R' + n, accessExpiresAt: 0, player: { id: 'p1', ageBand: '18+', linked: [] } });
function boot(routes, st = store()) {
  net._reset(); net.DATA.on = true; net.DATA.base = 'https://x/v1';
  const f = fake(routes); net.init({ fetch: f.fetch, storage: st, clientVersion: '0.12.4' });
  return { f, st };
}

test('desligado: toda chamada rejeita net_off (o jogo segue local)', async () => {
  net._reset(); net.DATA.on = false; net.init({ storage: store() });
  await assert.rejects(net.ensureSession(), e => e.code === 'net_off');
  await assert.rejects(net.verifyGoogle({ productId: 'gems_1', purchaseToken: 't' }), e => e.code === 'net_off');
  net.DATA.on = true;
});

test('convidado: guarda os tokens NO APARELHO (nunca no S) e manda os cabeçalhos do contrato', async () => {
  const { f, st } = boot({ 'POST /auth/guest': b => [200, session(1)] });
  const p = await net.ensureSession({ birthDate: '1990-01' });
  assert.equal(p.id, 'p1');
  const c = f.calls[0];
  assert.equal(c.body.birthDate, '1990-01');
  assert.ok(c.body.deviceId && c.headers['x-device-id'] === c.body.deviceId);
  assert.equal(c.headers['x-client-version'], '0.12.4');
  assert.equal(JSON.parse(st.m['eon.net']).refresh, 'R1');
  assert.ok(net.serverNow() - Date.now() > 3500000);   // relógio do servidor pelo x-server-time
});

test('token vencido: renova UMA vez (mesmo com pedidos simultâneos) e repete', async () => {
  let refreshes = 0;
  const { f } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'POST /auth/refresh': b => { refreshes++; assert.equal(b.refreshToken, 'R1'); return [200, session(2)]; },
    'GET /entitlements': (b, h) => h.authorization === 'Bearer A2' ? [200, { vip: { points: 0, level: 0 } }] : [401, { error: { code: 'token_expired' } }],
  });
  await net.ensureSession();
  const [a, b] = await Promise.all([net.entitlements(), net.entitlements()]);
  assert.equal(a.vip.level, 0); assert.equal(b.vip.level, 0);
  assert.equal(refreshes, 1);
  assert.ok(f.calls.length >= 4);
});

test('refresh recusado: a sessão cai e a próxima abertura volta ao convidado do mesmo aparelho', async () => {
  const st = store();
  boot({ 'POST /auth/guest': () => [200, session(1)] }, st);
  await net.ensureSession();
  const dev = JSON.parse(st.m['eon.net']).deviceId;
  const { f } = boot({ 'POST /auth/refresh': () => [401, { error: { code: 'token_invalid' } }], 'POST /auth/guest': b => [200, session(3)] }, st);
  await net.ensureSession();
  assert.equal(f.calls.at(-1).body.deviceId, dev);
  assert.equal(JSON.parse(st.m['eon.net']).refresh, 'R3');
});

test('sem rede: offline', async () => {
  net._reset(); net.DATA.on = true; net.DATA.base = 'https://x/v1';
  net.init({ fetch: async () => { throw new TypeError('failed'); }, storage: store() });
  await assert.rejects(net.ensureSession(), e => e.code === 'offline');
});

test('save §3.3: nuvem vazia sobe; igual e limpo não faz nada; nuvem nova e aparelho limpo baixa; os dois mudaram = escolher', async () => {
  let cloud = null;
  boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /save/head': () => cloud ? [200, { version: cloud.version, summary: cloud.summary }] : [404, { error: { code: 'not_found' } }],
    'GET /save': () => [200, cloud],
    'PUT /save': b => {
      if ((cloud?.version ?? 0) !== b.baseVersion) return [409, { error: { code: 'save_conflict', details: { cloud } } }];
      cloud = { version: b.baseVersion + 1, summary: b.summary, save: b.save }; return [200, { version: cloud.version }];
    },
  });
  await net.ensureSession();
  assert.equal((await net.sync({ a: 1 }, { playSeconds: 10 })).action, 'push');
  assert.equal((await net.sync({ a: 1 }, { playSeconds: 10 })).action, 'none');
  cloud = { version: 5, summary: { playSeconds: 99 }, save: { a: 2 } };          // outro aparelho gravou
  const r = await net.sync({ a: 1 }, { playSeconds: 10 });
  assert.equal(r.action, 'pulled'); assert.deepEqual(r.save, { a: 2 });
  cloud = { version: 6, summary: { playSeconds: 120 }, save: { a: 3 } };
  net.markDirty();
  const c = await net.sync({ a: 9 }, { playSeconds: 200 });
  assert.equal(c.action, 'choose'); assert.equal(c.recommend, 'device');
  assert.equal((await net.chooseSide('device', { a: 9 }, { playSeconds: 200 })).action, 'push');
  assert.deepEqual(cloud.save, { a: 9 });
  // conflito direto no push: rejeita save_conflict com a nuvem nos detalhes
  cloud = { version: 50, summary: {}, save: {} };
  await assert.rejects(net.push({}, {}), e => e.code === 'save_conflict' && e.details.cloud.version === 50);
});

test('compras: só o recibo vai ao servidor (sem preço, sem 💎) e o id ofuscado vem do servidor', async () => {
  const { f } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'GET /purchases/account-id': () => [200, { obfuscatedAccountId: 'abc' }],
    'GET /purchases/can-buy': (b, h, path) => [200, { ok: path.includes('productId=offer_first') }],
    'POST /purchases/google': b => [200, { status: 'granted', grants: [{ gems: 60 }], entitlements: {} }],
  });
  await net.ensureSession();
  assert.equal(await net.accountId(), 'abc');
  assert.equal((await net.canBuy('offer_first')).ok, true);
  const r = await net.verifyGoogle({ productId: 'gems_1', purchaseToken: 'tok', orderId: 'GPA.1', price: 999, gems: 99999 });
  assert.equal(r.status, 'granted');
  assert.deepEqual(Object.keys(f.calls.at(-1).body).sort(), ['orderId', 'productId', 'purchaseToken']);
});

test('save marcado (422 save_implausible): o aparelho guarda a versão gravada e o próximo envio não dá conflito', async () => {
  let ver = 0;
  boot({
    'POST /auth/guest': () => [200, session(1)],
    'PUT /save': b => { if (b.baseVersion !== ver) return [409, { error: { code: 'save_conflict' } }]; ver++; return b.summary.bad ? [422, { error: { code: 'save_implausible', details: { flags: ['x'], version: ver } } }] : [200, { version: ver }]; },
  });
  await net.ensureSession();
  await assert.rejects(net.push({}, { bad: 1 }), e => e.code === 'save_implausible');
  assert.equal(net.saveMeta().version, 1);
  assert.equal((await net.push({}, {})).version, 2);
});

test('login Google: sem plugin = google_unavailable; com plugin manda só o idToken (login ou vínculo); cancelado = cancelled', async () => {
  const { f } = boot({
    'POST /auth/guest': () => [200, session(1)],
    'POST /auth/login/google': b => [200, session(5)],
    'POST /auth/link/google': b => [200, { id: 'p1', ageBand: '18+', linked: ['google'] }],
  });
  assert.equal(net.googleReady(), false);
  await assert.rejects(net.googleSignIn('login'), e => e.code === 'google_unavailable');
  let inits = 0;
  globalThis.Capacitor = { Plugins: { SocialLogin: { initialize: async o => { inits++; assert.equal(o.google.webClientId, net.DATA.googleClientId); }, login: async o => { assert.deepEqual(o, { provider: 'google', options: {} }, 'sem scopes (BridgeActivity padrão recusa)'); return { provider: 'google', result: { idToken: 'gtok' } }; } } } };
  assert.equal(net.googleReady(), true);
  const p = await net.googleSignIn('login');
  const c = f.calls.at(-1); assert.equal(c.key, 'POST /auth/login/google'); assert.equal(c.body.idToken, 'gtok'); assert.ok(c.body.deviceId);
  await net.googleSignIn('link');
  assert.equal(f.calls.at(-1).key, 'POST /auth/link/google'); assert.deepEqual(Object.keys(f.calls.at(-1).body), ['idToken']); assert.equal(inits, 1);
  globalThis.Capacitor.Plugins.SocialLogin.login = async () => { throw { code: 'USER_CANCELLED' }; };
  await assert.rejects(net.googleSignIn('login'), e => e.code === 'cancelled');
  delete globalThis.Capacitor;
});

test('MODO DONO: o save do dono nunca sobe nem desce da nuvem e as entregas reais não caem nele (nenhuma chamada sai)', async () => {
  const { f } = boot({ 'GET /save/head': b => [200, { version: 3 }], 'PUT /save': b => [200, { version: 4 }], 'GET /save': b => [200, { version: 3, save: {} }],
    'GET /purchases/deliveries': b => [200, [{ id: 'd1', grants: [] }]] });
  net.DATA.ownerForce = true;
  try {
    assert.deepEqual(await net.push({ gold: 1 }, {}), { action: 'none', owner: true });
    assert.deepEqual(await net.sync({ gold: 1 }, {}), { action: 'none', owner: true });
    assert.equal(await net.pull(), null);
    assert.deepEqual(await net.chooseSide('device', { gold: 1 }, {}), { action: 'none', owner: true });
    assert.deepEqual(await net.deliveries(), []);
    await net.ackDelivery('d1');
    assert.equal(f.calls.length, 0);
  } finally { net.DATA.ownerForce = false; }
});
