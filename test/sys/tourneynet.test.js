// node test/sys/tourneynet.test.js — Sys.tourneyNet com um servidor falso atrás do Sys.net._call (formato do contrato §10.3)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const TN = require('../../js/sys/tourneynet.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };

function server(o) {
  o = o || {}; const calls = [];
  const view = { week: '2026-11-09', phase: 'declare', now: 1, size: 15, battles: [{ slot: 'd5', at: 2, lockAt: 1 }, { slot: 'd6', at: 3, lockAt: 2 }],
    map: [{ id: 'r0t1', region: 0, capital: false, owner: null, attacks: [] }, { id: 'capital', region: 8, capital: true, owner: { id: 'g9', name: 'Ursos' }, attacks: [] }],
    my: { guildId: 'g1', role: 'leader', canDeclare: true, canLineup: true, attacksLeftToday: 2, lineups: { d5: [], d6: [] }, territories: [] } };
  const routes = {
    'GET /tourney': () => view,
    'GET /tourney/ranking': (b, p) => ({ kind: /territory/.test(p) ? 'territory' : 'tournament', week: view.week, list: [], me: null }),
    'GET /tourney/battles': () => ({ week: view.week, list: [] }),
    'GET /tourney/lineup': () => ({ slot: 'd5', members: ['p1'], lockAt: 1, locked: false }),
    'POST /tourney/declare': b => { if (b.territory === 'capital') return Promise.reject(Object.assign(new Error('x'), { code: 'era_too_low', status: 403, details: { region: 8 } }));
      view.map[0].attacks.push({ slot: b.slot, attacker: { id: 'g1', name: 'Lobos' } }); view.my.attacksLeftToday--; return { ok: true, declaration: { id: 'd1', territory: b.territory, slot: b.slot, defender: null }, attacksLeftToday: view.my.attacksLeftToday }; },
    'PUT /tourney/lineup': b => ({ ok: true, slot: b.slot, members: b.members, lockAt: 99 }),
  };
  Sys.net = { _call: async (m, p, b) => { const k = m + ' ' + p.split('?')[0]; calls.push({ k, p, b }); if (o.down) throw Object.assign(new Error('x'), { code: 'not_found', status: 404 }); const h = routes[k]; if (!h) throw Object.assign(new Error('x'), { code: 'not_found', status: 404 }); return h(b, p); } };
  return { calls, view };
}

(async () => {
  await t('chave desligada: nada sai e o cache fica vazio (a tela segue no estado vazio honesto)', async () => {
    TN._reset(); TN.DATA.on = false; const sv = server();
    assert.deepStrictEqual(await TN.refresh(), { ok: false, reason: 'off' }); assert.deepStrictEqual(await TN.declare('r0t1', 'd5'), { ok: false, reason: 'off' });
    assert.strictEqual(sv.calls.length, 0); assert.deepStrictEqual(TN.map(), []); assert.strictEqual(TN.state().ready, false);
  });
  TN.DATA.on = true;
  await t('refresh: mapa, fase, minha guilda, horários, ranking e registro no cache (leitura síncrona)', async () => {
    TN._reset(); server();
    assert.deepStrictEqual(await TN.refresh({ territory: true }), { ok: true });
    const s = TN.state(); assert.strictEqual(s.ready, true); assert.strictEqual(s.phase, 'declare'); assert.strictEqual(s.size, 15);
    assert.strictEqual(TN.map().length, 2); assert.strictEqual(TN.map()[1].owner.name, 'Ursos'); assert.strictEqual(TN.my().role, 'leader');
    assert.strictEqual(TN.schedule().length, 2); assert.strictEqual(TN.ranking('tournament').kind, 'tournament'); assert.strictEqual(TN.ranking('territory').kind, 'territory');
    assert.deepStrictEqual(TN.battles().list, []);
  });
  await t('declarar: Promise com o resultado do servidor e o cache atualizado; erro do servidor vira {ok:false, reason, details}', async () => {
    TN._reset(); server(); await TN.refresh();
    const r = await TN.declare('r0t1', 'd5'); assert.strictEqual(r.ok, true); assert.strictEqual(r.attacksLeftToday, 1);
    assert.deepStrictEqual(TN.map()[0].attacks, [{ slot: 'd5', attacker: { id: 'g1', name: 'Lobos' } }]); assert.strictEqual(TN.my().attacksLeftToday, 1);
    assert.deepStrictEqual(await TN.declare('capital', 'd5'), { ok: false, reason: 'era_too_low', details: { region: 8 } });
  });
  await t('escalação: grava, atualiza o cache da minha guilda; leitura da escalação do dia', async () => {
    TN._reset(); const sv = server(); await TN.refresh();
    const r = await TN.setLineup('d5', ['p1', 'p2']); assert.strictEqual(r.ok, true); assert.deepStrictEqual(TN.my().lineups.d5, ['p1', 'p2']);
    assert.deepStrictEqual(TN.lineup('d5').members, ['p1', 'p2']); assert.deepStrictEqual(sv.calls.pop().b, { slot: 'd5', members: ['p1', 'p2'] });
    assert.strictEqual((await TN.loadLineup('d5')).lineup.members[0], 'p1');
  });
  await t('servidor com o torneio desligado (404) ou sem guilda: refresh falha sem quebrar e o cache não inventa nada', async () => {
    TN._reset(); server({ down: true });
    assert.deepStrictEqual(await TN.refresh(), { ok: false, reason: 'not_found', details: null }); assert.deepStrictEqual(TN.map(), []); assert.strictEqual(TN.state().err, 'not_found');
  });
  TN.DATA.on = false; console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
