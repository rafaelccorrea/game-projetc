// node test/sys/arenanet.test.js — Sys.arenaNet com o Sys.arena DE VERDADE e um servidor falso atrás do Sys.net._call
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
require('../../js/sys/stats.js'); require('../../js/sys/fc.js'); require('../../js/sys/level.js'); require('../../js/sys/tower.js');
const A = require('../../js/sys/arena.js'), AN = require('../../js/sys/arenanet.js');
const { makeHost } = require('./_host.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };

function server(o) {
  o = o || {}; const calls = [];
  const look = { hero: 'kaia', skin: null, armor: 'a12', mount: { id: 'horse', stars: 2 }, pet: null, wing: null, aura: 'aura7', weapon: { e: 1, r: 2, type: 'bow' } };
  const list = [{ id: 'p-real', name: 'Real', fc: 900, skin: null, points: 1010, bot: false, level: 31, look }, { id: 'bot-1', name: 'Robô', fc: 950, skin: null, points: 990, bot: true, level: 30, look: null }];
  let attempts = 3;
  const routes = {
    'POST /arena/snapshot': b => (o.snapFail ? Promise.reject(Object.assign(new Error('x'), { code: 'not_found', status: 404 })) : { ok: true, fc: b.fc }),
    'GET /arena/opponents': () => list, 'GET /arena/status': () => ({ attemptsLeft: attempts, refreshLeft: 1, points: 1000 }),
    'GET /arena/week': () => ({ week: '2026-11-09', start: 1, end: Date.now() + 86400000 }),
    'GET /ranking': () => ({ kind: 'arena', week: '2026-11-09', list: [{ rank: 1, name: 'Real', value: 1010, me: false, bot: false }], me: { rank: 2, value: 1000 }, bots: false }),
    'POST /arena/fight': b => { if (attempts <= 0) return Promise.reject(Object.assign(new Error('x'), { code: 'arena_limit', status: 429 })); attempts--;
      return { ok: true, win: true, delta: 15, points: 1015, seed: 42, attemptsLeft: attempts, rounds: 3, bot: false,
        log: [{ s: 0, k: 'hit', dmg: 5, crit: false, hp: 10, en: 25 }, { s: 0, k: 'ult', dmg: 50, crit: false, hp: 0, en: 0 }],
        rewards: { gold: null, goldk: 40, gems: 1, chest: 0 }, opp: { id: b.opponentId, name: 'Real', fc: 900, level: 31, look, bot: false } }; },
  };
  Sys.net = { _call: async (m, p, b) => { const k = m + ' ' + p.split('?')[0]; calls.push({ k, b }); const h = routes[k]; if (!h) throw Object.assign(new Error('x'), { code: 'not_found', status: 404 }); return h(b); },
    serverNow: () => Date.now() };
  return { calls, look };
}
const world = () => { const h = makeHost({ level: 30 }); h.level = () => 30; return { S: { sys: { level: { lvl: 30, xp: 0 } } }, h }; };

(async () => {
  await t('chave desligada: não chama nada e o provider continua o local', async () => {
    AN._reset(); AN.DATA.on = false; const sv = server(), w = world();
    assert.deepStrictEqual(await AN.start(w.S, w.h), { ok: false, reason: 'off' }); assert.strictEqual(sv.calls.length, 0);
    assert.strictEqual(A.getProvider(), A.localProvider);
  });
  AN.DATA.on = true;
  await t('start: manda a foto (poder + heroSnapshot do Engenheiro) e troca para o provider do servidor; o Sys.arena lê a lista do cache', async () => {
    AN._reset(); const sv = server(), w = world();
    globalThis.heroSnapshot = () => ({ look: { hero: 'kael', mount: null }, level: 30, petFrac: 0.1 });
    assert.deepStrictEqual(await AN.start(w.S, w.h), { ok: true }); assert.strictEqual(A.getProvider(), AN.provider);
    const snap = sv.calls.find(c => c.k === 'POST /arena/snapshot').b;
    assert.deepStrictEqual(Object.keys(snap).sort(), ['aspd', 'atk', 'critDmg', 'critRate', 'def', 'fc', 'hp', 'level', 'look', 'petFrac']);
    assert.deepStrictEqual(snap.look, { hero: 'kael', mount: null }); assert.strictEqual(snap.level, 30);
    const me = Sys.tower.playerStats(w.S, w.h); assert.strictEqual(snap.fc, me.fc, 'a FC que o servidor confere');
    const l = A.opponents(w.S, w.h); assert.deepStrictEqual(l.map(x => x.id), ['p-real', 'bot-1']); assert.strictEqual(l[0].look.mount.id, 'horse'); assert.strictEqual(l[0].level, 31);
    assert.strictEqual(A.ranking(w.S, w.h, 'arena').bots, false); assert.strictEqual(A.ensure(w.S, w.h).attemptsLeft, 3);
    // foto igual não reenvia
    const before = sv.calls.length; assert.deepStrictEqual(await AN.snapshot(w.S, w.h), { ok: true, sent: false }); assert.strictEqual(sv.calls.length, before);
  });
  await t('luta: o SERVIDOR decide; o Sys.arena.fight aplica pela conta dele (pontos, tentativas = as do servidor, log e prêmio do servidor)', async () => {
    AN._reset(); server(); const w = world(); await AN.start(w.S, w.h);
    let gems = 0; w.h.addGems = g => { gems += g; };
    const r = await AN.fight(w.S, w.h, 'p-real');
    assert.strictEqual(r.ok, true); assert.strictEqual(r.win, true); assert.strictEqual(r.delta, 15); assert.strictEqual(r.points, 1015);
    assert.strictEqual(r.log.length, 2); assert.strictEqual(r.log[1].k, 'ult'); assert.strictEqual(r.seed, 42);
    assert.strictEqual(A.ensure(w.S, w.h).attemptsLeft, 2, 'igual ao servidor'); assert.strictEqual(r.rewards.gems, 1); assert.strictEqual(gems, 1, '💎 do servidor creditado UMA vez pelo host');
    assert.strictEqual(r.oppServer.look.weapon.type, 'bow');
    assert.strictEqual(AN.provider.fight(w.S, w.h, { id: 'p-real' }).reason, 'online', 'sem resposta do servidor o provider não inventa luta');
  });
  await t('limite do dia (429): reason tries e o contador local zera; offline não mexe em nada', async () => {
    AN._reset(); server(); const w = world(); await AN.start(w.S, w.h);
    for (let i = 0; i < 3; i++) assert.ok((await AN.fight(w.S, w.h, 'bot-1')).ok);
    assert.deepStrictEqual(await AN.fight(w.S, w.h, 'bot-1'), { ok: false, reason: 'tries' }); assert.strictEqual(A.ensure(w.S, w.h).attemptsLeft, 0);
    Sys.net._call = async () => { throw Object.assign(new Error('x'), { code: 'offline' }); };
    const pts = A.ensure(w.S, w.h).points; assert.deepStrictEqual(await AN.fight(w.S, w.h, 'bot-1'), { ok: false, reason: 'offline' }); assert.strictEqual(A.ensure(w.S, w.h).points, pts);
  });
  await t('arena desligada no servidor (404) ou foto recusada: start falha e o jogo segue com os bots locais', async () => {
    AN._reset(); A.setProvider(null); server({ snapFail: true }); const w = world();
    const r = await AN.start(w.S, w.h); assert.strictEqual(r.ok, false); assert.strictEqual(A.getProvider(), A.localProvider);
    AN.stop(); assert.strictEqual(A.getProvider(), A.localProvider);
  });
  AN.DATA.on = false; A.setProvider(null); delete globalThis.heroSnapshot;
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
