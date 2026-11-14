// node test/sys/guildfirenet.test.js — Sys.guildFireNet com o Sys.guildFire e o Sys.net DE VERDADE e um fetch falso (contrato API_SERVIDOR §16.2)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
require('../../js/sys/clock.js'); require('../../js/sys/level.js'); require('../../js/sys/forge.js'); require('../../js/sys/pet.js');
const GU = require('../../js/sys/guild.js'), BF = require('../../js/sys/bonfire.js');
const NET = require('../../js/sys/net.js'), GF = require('../../js/sys/guildfire.js'), GFN = require('../../js/sys/guildfirenet.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };
const H = 3600000, BASE = 'https://srv.test/v1';

/* servidor falso atrás do fetch: guarda cada pedido (método, caminho sem /v1, corpo) */
function server(o) {
  o = o || {}; const calls = [];
  const sv = { calls, view: o.view || {}, routes: o.routes || {}, down: false, off: false, noGuild: false };
  globalThis.__fetch = async (url, init) => {
    if (sv.down) throw new Error('rede');
    const path = url.slice(BASE.length), m = init.method;
    calls.push({ m, path, body: init.body === undefined ? undefined : JSON.parse(init.body), auth: init.headers.authorization });
    const res = (status, data) => ({ status, headers: { get: () => null }, json: async () => data });
    if (sv.off) return res(404, { error: { code: 'not_found' } });
    if (sv.noGuild) return res(403, { error: { code: 'not_in_guild' } });
    const k = m + ' ' + path;
    if (k === 'GET /guild/fire') return res(200, sv.view);
    const h = sv.routes[k]; if (!h) return res(404, { error: { code: 'not_found' } });
    const r = h(init.body === undefined ? undefined : JSON.parse(init.body), path);
    return r && r.err ? res(r.status || 409, { error: { code: r.err, details: r.details || {}, retryAfterMs: r.retryAfterMs || 0 } }) : res(200, r);
  };
  return sv;
}
function world(gid) {
  const S = { sys: { level: { lvl: 40, xp: 0 } } };
  const host = { gold: 0, changes: 0, t: new Date(2026, 10, 14, 12).getTime(), goldUnit: () => 10,
    addGold: g => { host.gold += g; }, onChange: () => { host.changes++; } };
  host.now = () => host.t;
  if (gid) GU.applyServer(S, { id: gid, name: 'Clã', role: 'member', level: 1, joinedAt: host.t - H }, host);
  return { S, host };
}
const view = x => Object.assign({ guildId: 'g1', flames: 715, level: 3, free: false, bra: 0, braLeft: 20, freeFlames: 10, mine: 40, fed: 0, chests: [] }, x || {});
function netOn() {
  const mem = {}; mem['eon.net'] = JSON.stringify({ deviceId: 'dev1', access: 'TOK', refresh: 'R' });
  NET.init({ fetch: (u, i) => globalThis.__fetch(u, i), storage: { get: k => mem[k], set: (k, v) => { mem[k] = v; } } });
  NET.DATA.base = BASE; NET.DATA.on = true;
}
async function started(x, routes) {
  const w = world('g1'); GU.DATA.on = true; GF.DATA.on = true; BF.DATA.on = true; GF.setProvider(null); GFN._reset(); GFN.DATA.on = true;
  const sv = server({ view: view(x), routes }); const r = await GFN.start(w.S, w.host); assert.ok(r.ok, JSON.stringify(r)); sv.calls.length = 0; return { w, sv };
}

(async () => {
  netOn();
  await t('chave desligada (padrão): nada sai e o Sys.guildFire segue com o provider local', async () => {
    GFN._reset(); assert.strictEqual(GFN.DATA.on, false, 'nasce DESLIGADA'); GU.DATA.on = true; GF.DATA.on = true; GF.setProvider(null);
    const w = world('g1'), sv = server({ view: view() });
    for (const r of [await GFN.start(w.S, w.host), await GFN.refresh(w.S, w.host)]) assert.deepStrictEqual(r, { ok: false, reason: 'off' });
    assert.strictEqual((await GFN.feed(w.S, w.host, 0)).reason, 'off');
    assert.strictEqual(sv.calls.length, 0); assert.strictEqual(GF.provider, GF.localProvider);
    assert.ok(GF.feed(w.S, w.host).ok, 'local continua igual'); assert.deepStrictEqual(GFN.state(), { on: false, started: false, err: null, at: 0, inGuild: false });
  });

  await t('módulo Sys.guildFire desligado: não chama o servidor', async () => {
    GFN._reset(); GFN.DATA.on = true; GF.DATA.on = false; GF.setProvider(null); const w = world('g1'), sv = server({ view: view() });
    assert.deepStrictEqual(await GFN.start(w.S, w.host), { ok: false, reason: 'off' }); assert.strictEqual(sv.calls.length, 0);
  });

  await t('start: GET /v1/guild/fire com o token, applyServer (chamas de TODOS, grátis e Brasas de hoje, minhas chamas) e troca o provider', async () => {
    const w = world('g1'); GU.DATA.on = true; GF.DATA.on = true; GF.setProvider(null); GFN._reset(); GFN.DATA.on = true;
    const sv = server({ view: view({ free: true, bra: 5, mine: 60 }) });
    assert.deepStrictEqual(await GFN.start(w.S, w.host), { ok: true, inGuild: true });
    assert.deepStrictEqual(sv.calls.map(c => c.m + ' ' + c.path), ['GET /guild/fire']); assert.strictEqual(sv.calls[0].auth, 'Bearer TOK');
    assert.strictEqual(GF.provider.online, true); const v = GF.view(w.S, w.host);
    assert.strictEqual(v.flames, 715); assert.strictEqual(v.level, 3); assert.strictEqual(v.free, false, 'grátis de hoje já feito'); assert.strictEqual(v.braLeft, 15); assert.strictEqual(v.mine, 60);
    assert.strictEqual(v.online, true); const st = GFN.state(); assert.ok(st.on && st.started && st.inGuild && st.at > 0);
    assert.strictEqual(GF.feed(w.S, w.host).reason, 'done');
  });

  await t('servidor desligado (404 GUILDFIRE_ON) ou sem rede: fica o local', async () => {
    for (const k of ['off', 'down']) {
      const w = world('g1'); GF.DATA.on = true; GF.setProvider(null); GFN._reset(); GFN.DATA.on = true;
      const sv = server({ view: view() }); sv[k] = true; const r = await GFN.start(w.S, w.host);
      assert.strictEqual(r.ok, false); assert.strictEqual(GF.provider, GF.localProvider); assert.strictEqual(GFN.state().started, false);
    }
  });

  await t('403 not_in_guild: o servidor está ligado e o jogador não tem guilda: inicia sem guilda (a aba diz "entre numa guilda")', async () => {
    const w = world(null); GF.DATA.on = true; GF.setProvider(null); GFN._reset(); GFN.DATA.on = true;
    const sv = server({ view: view() }); sv.noGuild = true;
    assert.deepStrictEqual(await GFN.start(w.S, w.host), { ok: true, inGuild: false }); assert.strictEqual(GFN.state().inGuild, false);
    assert.strictEqual((await GFN.feed(w.S, w.host, 0)).reason, 'guild'); assert.strictEqual(sv.calls.length, 1, 'feed recusado antes da rede');
  });

  await t('Sys.guild ainda sem a guilda (o guildNet não terminou): inicia e o próximo refresh espelha', async () => {
    const w = world(null); GF.DATA.on = true; GF.setProvider(null); GFN._reset(); GFN.DATA.on = true; server({ view: view() });
    const r = await GFN.start(w.S, w.host); assert.ok(r.ok); assert.strictEqual(GF.view(w.S, w.host).flames, 0);
    GU.applyServer(w.S, { id: 'g1', name: 'Clã', role: 'member', level: 1, joinedAt: w.host.t - H }, w.host);
    const r2 = await GFN.refresh(w.S, w.host); assert.strictEqual(r2.applied, true); assert.strictEqual(GF.view(w.S, w.host).flames, 715);
  });

  await t('feed grátis: POST /v1/guild/fire/feed {kind:free, n:0}; o servidor decide e o total vem dele; chestsMailed sem crédito local', async () => {
    let body = null;
    const { w, sv } = await started({}, { 'POST /guild/fire/feed': b => { body = b; return { ok: true, kind: 'free', added: 10, guildId: 'g1', flames: 1100, level: 4, levelUp: true, free: true, bra: 0, braLeft: 20, mine: 50, fed: 0, chests: 0, chestsMailed: 1 }; } });
    const g0 = w.host.gold, r = await GFN.feed(w.S, w.host, 0);
    assert.deepStrictEqual(body, { kind: 'free', n: 0 });
    assert.strictEqual(r.ok, true); assert.strictEqual(r.kind, 'free'); assert.strictEqual(r.flames, 10); assert.strictEqual(r.total, 1100); assert.strictEqual(r.level, 4);
    assert.strictEqual(r.levelUp, true); assert.strictEqual(r.chestsMailed, 1); assert.strictEqual(r.warn, null);
    const v = GF.view(w.S, w.host); assert.strictEqual(v.flames, 1100); assert.strictEqual(v.free, false); assert.strictEqual(v.mine, 50);
    assert.strictEqual(w.host.gold, g0, 'o baú vai pelo correio: nada de ouro local');
    assert.strictEqual(GF.claim(w.S, w.host, 4).reason, 'mailed', 'com o online, o claim local não credita');
    assert.strictEqual((await GFN.feed(w.S, w.host, 0)).reason, 'done'); assert.strictEqual(sv.calls.length, 1, 'o 2º grátis nem sai do aparelho');
    assert.strictEqual(GF.contribute(w.S, w.host, 0).reason, 'done');
  });

  await t('Sys.guildFire síncrono direto com o online ligado: recusa (sem autorização do servidor)', async () => {
    const { w, sv } = await started();
    assert.strictEqual(GF.feed(w.S, w.host).reason, 'online'); assert.strictEqual(sv.calls.length, 0); assert.strictEqual(GF.view(w.S, w.host).free, true, 'nada marcado');
  });

  await t('dar Brasas: servidor primeiro; com o ok, gasta as Brasas UMA vez', async () => {
    const { w, sv } = await started({}, { 'POST /guild/fire/feed': b => ({ ok: true, kind: 'brasa', added: b.n, guildId: 'g1', flames: 715 + b.n, level: 3, levelUp: false, free: false, bra: b.n, braLeft: 20 - b.n, mine: 45, chestsMailed: 0 }) });
    BF.ensure(w.S).bra = 30; BF.ensure(w.S).got = 30;
    const r = await GFN.feed(w.S, w.host, 5);
    assert.strictEqual(r.ok, true); assert.strictEqual(r.flames, 5); assert.strictEqual(r.total, 720); assert.strictEqual(r.braLeft, 15);
    assert.deepStrictEqual(sv.calls[0].body, { kind: 'brasa', n: 5 }); assert.strictEqual(BF.ensure(w.S).bra, 25, 'gastou 5, uma vez');
    assert.strictEqual(GF.view(w.S, w.host).braLeft, 15);
  });

  await t('Brasas: regras locais antes da rede (faltam Brasas, limite do dia)', async () => {
    const { w, sv } = await started({ bra: 18 }, { 'POST /guild/fire/feed': () => ({ ok: true }) });
    BF.ensure(w.S).bra = 1;
    assert.strictEqual((await GFN.feed(w.S, w.host, 2)).reason, 'brasas');
    BF.ensure(w.S).bra = 30; const d = await GFN.feed(w.S, w.host, 5); assert.strictEqual(d.reason, 'day'); assert.strictEqual(d.left, 2);
    assert.strictEqual(sv.calls.length, 0); assert.strictEqual(BF.ensure(w.S).bra, 30);
  });

  await t('recusas do servidor: brasas_over / brasas_unverified passam; 429 daily_limit vira done/day com o retryAfterMs; nada gasta', async () => {
    let next = null;
    const { w, sv } = await started({}, { 'POST /guild/fire/feed': () => next });
    BF.ensure(w.S).bra = 30;
    next = { err: 'brasas_over', details: { left: 3 } }; let r = await GFN.feed(w.S, w.host, 5);
    assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'brasas_over'); assert.deepStrictEqual(r.details, { left: 3 }); assert.strictEqual(BF.ensure(w.S).bra, 30);
    next = { err: 'brasas_unverified' }; assert.strictEqual((await GFN.feed(w.S, w.host, 1)).reason, 'brasas_unverified');
    next = { err: 'daily_limit', status: 429, retryAfterMs: 3600000 }; sv.view = view({ free: true });
    r = await GFN.feed(w.S, w.host, 0); assert.strictEqual(r.reason, 'done'); assert.strictEqual(r.retryAfterMs, 3600000); assert.strictEqual(GF.view(w.S, w.host).free, false, 'o refresh espelhou o grátis do servidor');
    assert.ok(sv.calls.some(c => c.m === 'GET'), 'refresh depois do daily_limit');
    next = { err: 'daily_limit', status: 429 }; assert.strictEqual((await GFN.feed(w.S, w.host, 1)).reason, 'day');
    assert.strictEqual(BF.ensure(w.S).bra, 30, 'nenhuma recusa gastou Brasa');
  });

  await t('refresh: 404 com o online ligado = o servidor desligou a fogueira: volta ao local', async () => {
    const { w, sv } = await started(); sv.off = true;
    const r = await GFN.refresh(w.S, w.host); assert.strictEqual(r.ok, false); assert.strictEqual(GF.provider, GF.localProvider); assert.strictEqual(GFN.state().started, false);
    assert.strictEqual((await GFN.feed(w.S, w.host, 0)).reason, 'off');
  });

  await t('stop: volta ao provider local', async () => {
    const { w } = await started(); GFN.stop(); assert.strictEqual(GF.provider, GF.localProvider); assert.ok(GF.feed(w.S, w.host).ok);
  });

  GF.setProvider(null); GF.DATA.on = false; GFN._reset(); GFN.DATA.on = false;
  console.log(`\n${n} testes ok (guildfirenet)`);
})().catch(e => { console.error(e); process.exit(1); });
