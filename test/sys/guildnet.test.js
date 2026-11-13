// node test/sys/guildnet.test.js — Sys.guildNet com o Sys.guild DE VERDADE e um servidor falso atrás do Sys.net._call (§10.1/§10.4)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
require('../../js/sys/level.js');
const G = require('../../js/sys/guild.js'), GN = require('../../js/sys/guildnet.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };

function server(o) {
  o = o || {}; const calls = []; let inGuild = o.inGuild !== false;
  const bk = Object.keys(G.DATA.banners.cap);
  const routes = {
    'GET /guild': () => { if (!inGuild) throw Object.assign(new Error('x'), { code: 'not_in_guild', status: 404 });
      return { guild: { id: 'g1', name: 'Lobos', level: 2, xp: 900, members: 2, maxMembers: 22, leaderId: 'p1' }, me: { role: 'officer', coin: 77, contrib: 10, donatedToday: [] },
        members: [{ id: 'p1', name: 'Líder', role: 'leader', joinedAt: 1 }, { id: 'p2', name: 'Eu', role: 'officer', joinedAt: 5, me: true }], requests: [],
        territories: [{ region: 0, capital: false }, { region: 8, capital: true }] }; },
    'GET /guild/blessings': () => ({ level: 2, xpFree: 100, list: bk.map((k, i) => ({ id: k, value: i === 0 ? G.bannerCap(k, LV) : 0, cap: G.bannerCap(k, LV) })) }),
    'POST /guild/leave': () => { inGuild = false; return { closed: false }; },
    'POST /guild/donate': b => (b.kind === 'gold_s' ? { ok: true, coin: 10 } : Promise.reject(Object.assign(new Error('x'), { code: 'daily_limit', status: 429, details: { kind: b.kind }, retryAfterMs: b.kind === 'gold_l' ? 3600000 : 0 }))),
    'GET /guilds': () => [{ id: 'g1', name: 'Lobos' }],
    'POST /guild/leader': b => ({ ok: true, to: b.playerId }),
  };
  Sys.net = { _call: async (m, p, b) => { const k = m + ' ' + p.split('?')[0]; calls.push({ k, p, b }); if (o.down) throw Object.assign(new Error('x'), { code: 'not_found', status: 404 });
    const h = routes[k]; if (!h) throw Object.assign(new Error('x'), { code: 'not_found', status: 404 }); return h(b); } };
  return { calls, bk };
}
const LV = G.levelOfXp(900).level;   // o jogo tira o nível da guilda do XP (900 no servidor falso)
const lv40 = () => ({ sys: { level: { lvl: 40, xp: 0 } } });   // a guilda abre no nível 30
const host = () => ({ level: () => 40, now: () => Date.UTC(2026, 10, 13, 15) });

(async () => {
  const on0 = G.DATA.on; G.DATA.on = true;
  await t('chave desligada: nada sai e o provider do Sys.guild continua fechado', async () => {
    GN._reset(); GN.DATA.on = false; const sv = server(), S = lv40();
    assert.deepStrictEqual(await GN.start(S, host()), { ok: false, reason: 'off' }); assert.strictEqual(sv.calls.length, 0);
    assert.strictEqual(G.provider.online, false); assert.strictEqual(G.status(S, host()).reason, 'server');
  });
  GN.DATA.on = true;
  await t('start: aplica a guilda do servidor no save (cargo, Brasões, estandartes, territórios do torneio) e abre o status', async () => {
    GN._reset(); const sv = server(), S = lv40();
    assert.deepStrictEqual(await GN.start(S, host()), { ok: true, inGuild: true });
    assert.strictEqual(G.provider.online, true); const st = G.status(S, host()); assert.strictEqual(st.open, true); assert.strictEqual(st.inGuild, true);
    const o = G.ensure(S); assert.strictEqual(o.id, 'g1'); assert.strictEqual(o.role, 'officer'); assert.strictEqual(o.coin, 77); assert.strictEqual(o.joinedAt, 5);
    assert.ok(o.banners[sv.bk[0]] > 0); assert.strictEqual(o.banners[sv.bk[0]], G.bannerCap(sv.bk[0], LV), 'estandarte do servidor vira bônus no jogo (o Sys.guild confere o teto)');
    assert.deepStrictEqual(o.territories, [{ region: 0, capital: false }, { region: 8, capital: true }]);
    const b = G.territoryBonus(o.territories); assert.ok(b.gold > 0, 'o Sys.guild transforma os territórios em bônus');
    assert.strictEqual(typeof G.provider.leave, 'function'); assert.strictEqual(G.provider.leave().reason, 'server', 'o leave SÍNCRONO segue o fechado (a tela usa a Promise)');
  });
  await t('ações: Promise; depois de mudar refaz o refresh (sair da guilda limpa o save); erro do servidor vira {ok:false, reason, details}', async () => {
    GN._reset(); const sv = server(), S = lv40(); await GN.start(S, host());
    assert.strictEqual((await GN.donate(S, host(), 'gold_s')).ok, true);
    assert.deepStrictEqual(await GN.donate(S, host(), 'gems'), { ok: false, reason: 'daily_limit', details: { kind: 'gems' }, retryAfterMs: 0 });
    assert.strictEqual((await GN.donate(S, host(), 'gold_l')).retryAfterMs, 3600000, '429 com tempo: a tela mostra quando volta');
    assert.strictEqual((await GN.transfer(S, host(), 'p1')).to, 'p1'); assert.deepStrictEqual(sv.calls.find(c => c.k === 'POST /guild/leader').b, { playerId: 'p1' });
    const l = await GN.list(S, host(), { search: 'lo', open: 1 }); assert.deepStrictEqual(l.data, [{ id: 'g1', name: 'Lobos' }]); assert.ok(sv.calls.some(c => c.p === '/guilds?search=lo&open=1'));
    const r = await GN.leave(S, host()); assert.strictEqual(r.ok, true);
    assert.strictEqual(G.ensure(S).id, null, 'saiu: o save fica sem guilda'); assert.strictEqual(GN.state().inGuild, false);
  });
  await t('sem guilda no servidor: start dá certo, o jogo fica sem guilda; guildas desligadas (404): o provider continua fechado', async () => {
    GN._reset(); G.setProvider(null); server({ inGuild: false }); const S = lv40();
    assert.deepStrictEqual(await GN.start(S, host()), { ok: true, inGuild: false }); assert.strictEqual(G.ensure(S).id, null);
    GN._reset(); G.setProvider(null); server({ down: true }); const S2 = lv40();
    const r = await GN.start(S2, host()); assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'not_found'); assert.strictEqual(G.provider.online, false);
  });
  GN.DATA.on = false; G.setProvider(null); G.DATA.on = on0; console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
