// node test/sys/duonet.test.js — Sys.duoNet com o Sys.duo e o Sys.net DE VERDADE e um fetch falso (contrato API_SERVIDOR §16.1)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
require('../../js/sys/clock.js'); require('../../js/sys/level.js'); require('../../js/sys/forge.js');
const NET = require('../../js/sys/net.js'), DU = require('../../js/sys/duo.js'), DN = require('../../js/sys/duonet.js');
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok -', name); };
const H = 3600000, BASE = 'https://srv.test/v1';

/* servidor falso atrás do fetch: guarda cada pedido (método, caminho sem /v1, corpo cru) */
function server(o) {
  o = o || {}; const calls = [];
  const sv = { calls, view: o.view || {}, routes: o.routes || {}, down: false, off: false };
  globalThis.__fetch = async (url, init) => {
    if (sv.down) throw new Error('rede');
    const path = url.slice(BASE.length), m = init.method;
    calls.push({ m, path, body: init.body === undefined ? undefined : init.body, auth: init.headers.authorization });
    const res = (status, data) => ({ status, headers: { get: () => null }, json: async () => data });
    if (sv.off) return res(404, { error: { code: 'not_found' } });
    const k = m + ' ' + path.replace(/\/[A-Z0-9]{8}$/, '/:id');
    if (k === 'GET /duo') return res(200, sv.view);
    const h = sv.routes[k]; if (!h) return res(404, { error: { code: 'not_found' } });
    const r = h(init.body === undefined ? undefined : JSON.parse(init.body), path);
    return r && r.err ? res(r.status || 409, { error: { code: r.err, details: r.details || {} } }) : res(200, r);
  };
  return sv;
}
function world() {
  const S = { sys: { level: { lvl: 30, xp: 0 } } };
  const host = { gold: 0, changes: 0, t: new Date(2026, 10, 13, 12).getTime(), goldUnit: () => 10,
    addGold: g => { host.gold += g; }, onChange: () => { host.changes++; } };
  host.now = () => host.t; return { S, host };
}
const dk = ms => Sys.clock.dayKey(ms), wk = ms => Sys.clock.weekKey(ms);
const P = { id: 'BCDF2345', name: 'Lia', since: 1, last: 2 };
function view(w, x) { return Object.assign({ on: true, code: 'ZXCV9876', day: dk(w.host.t), week: wk(w.host.t), needLevel: 16, partner: P, leftAt: 0, relinkLeftMs: 0,
  partnerDay: { kills: 0, bossKills: 0, stages: 0, arenaWins: 0 }, partnerWeek: { kills: 0, bossKills: 0, stages: 0, arenaWins: 0 }, partnerPresent: true,
  partnerDays: [dk(w.host.t)], myDay: { kills: 0, bossKills: 0, stages: 0, arenaWins: 0 }, myWeek: { kills: 0, bossKills: 0, stages: 0, arenaWins: 0 },
  myDays: [dk(w.host.t)], invites: [], invitesOut: 0, invitesLeft: 5, messages: [], msgLeft: 30, claimed: { daily: false, weekly: [] },
  cap: { kills: 20000, bossKills: 150, stages: 60, arenaWins: 40 } }, x || {}); }

function netOn() {
  const mem = {}; mem['eon.net'] = JSON.stringify({ deviceId: 'dev1', access: 'TOK', refresh: 'R' });
  NET.init({ fetch: (u, i) => globalThis.__fetch(u, i), storage: { get: k => mem[k], set: (k, v) => { mem[k] = v; } } });
  NET.DATA.base = BASE; NET.DATA.on = true;
}
async function started(x, routes) { const w = world(); DU.DATA.on = true; DU.setProvider(null); DN._reset(); DN.DATA.on = true;
  const sv = server({ view: view(w, x), routes }); const r = await DN.start(w.S, w.host); assert.ok(r.ok, JSON.stringify(r)); sv.calls.length = 0; return { w, sv }; }

(async () => {
  netOn();
  await t('chave desligada (padrão): nada sai e o Sys.duo segue com o provider local', async () => {
    DN._reset(); assert.strictEqual(DN.DATA.on, false, 'nasce DESLIGADA'); DU.DATA.on = true; DU.setProvider(null);
    const w = world(), sv = server({ view: view(w) });
    for (const r of [await DN.start(w.S, w.host), await DN.refresh(w.S, w.host), await DN.friendCode()]) assert.deepStrictEqual(r, { ok: false, reason: 'off' });
    assert.strictEqual((await DN.send(w.S, w.host, 0)).reason, 'off'); assert.strictEqual((await DN.claim(w.S, w.host, 'daily')).reason, 'off');
    assert.strictEqual(sv.calls.length, 0); assert.strictEqual(DU.provider, DU.localProvider);
    assert.ok(DU.invite(w.S, w.host, 'ABC123').ok, 'local continua igual');
  });

  await t('start: GET /v1/duo com o token, applyServer (parceiro pelo CÓDIGO) e troca o provider; GET /v1/me/friend-code', async () => {
    const w = world(); DU.DATA.on = true; DU.setProvider(null); DN._reset(); DN.DATA.on = true;
    const sv = server({ view: view(w, { invites: [] }), routes: { 'GET /me/friend-code': () => ({ code: 'ZXCV9876' }) } });
    assert.deepStrictEqual(await DN.start(w.S, w.host), { ok: true, paired: true });
    assert.deepStrictEqual(sv.calls.map(c => c.m + ' ' + c.path), ['GET /duo']); assert.strictEqual(sv.calls[0].auth, 'Bearer TOK');
    assert.strictEqual(DU.provider.online, true); assert.strictEqual(DU.ensure(w.S).partner.id, 'BCDF2345'); assert.strictEqual(DN.state().code, 'ZXCV9876');
    assert.deepStrictEqual(await DN.friendCode(), { ok: true, code: 'ZXCV9876' }); assert.strictEqual(sv.calls[1].path, '/me/friend-code');
    assert.strictEqual(DU.send(w.S, w.host, 0).reason, 'online', 'Sys.duo síncrono sem autorização do servidor: recusa');
  });

  await t('leftAt: quem FICOU recebe 0 (sem espera, nunca vira "agora"); quem SAIU espera pelo relinkLeftMs; depois das 24 h volta 0', async () => {
    const { w, sv } = await started();
    sv.view = view(w, { partner: null, leftAt: 0, relinkLeftMs: 0 }); assert.ok((await DN.refresh(w.S, w.host)).ok);
    assert.strictEqual(DU.ensure(w.S).partner, null); assert.strictEqual(DU.ensure(w.S).leftAt, 0); assert.strictEqual(DU.relinkLeft(w.S, w.host), 0, 'quem ficou vincula na hora');
    const srvLeft = w.host.t - 4 * H + 777;   // relógio do servidor um pouco diferente: vale o relinkLeftMs
    sv.view = view(w, { partner: null, leftAt: srvLeft, relinkLeftMs: 20 * H }); await DN.refresh(w.S, w.host);
    assert.strictEqual(DU.relinkLeft(w.S, w.host), 20 * H, 'quem saiu espera o que o servidor diz');
    w.host.t += 25 * H; sv.view = view(w, { partner: null, leftAt: 0, relinkLeftMs: 0 }); await DN.refresh(w.S, w.host);
    assert.strictEqual(DU.ensure(w.S).leftAt, 0); assert.strictEqual(DU.relinkLeft(w.S, w.host), 0);
  });

  await t('frase: POST /v1/duo/phrase com o corpo EXATAMENTE {idx}; índice inválido nem sai; regras do Sys.duo antes da rede', async () => {
    const { w, sv } = await started(null, { 'POST /duo/phrase': b => ({ ok: true, idx: b.idx, left: 29 }) });
    const r = await DN.send(w.S, w.host, 3); assert.ok(r.ok); assert.strictEqual(r.txt, DU.phraseText(3));
    assert.deepStrictEqual(sv.calls.map(c => [c.m, c.path, c.body]), [['POST', '/duo/phrase', '{"idx":3}']]);
    assert.deepStrictEqual(Object.keys(JSON.parse(sv.calls[0].body)), ['idx']);
    for (const bad of [-1, 18, 'Oi, dupla!', 1.5, null]) assert.strictEqual((await DN.send(w.S, w.host, bad)).reason, 'phrase');
    assert.strictEqual((await DN.send(w.S, w.host, 4)).reason, 'wait', 'cooldown de 5 s conferido aqui');
    assert.strictEqual(sv.calls.length, 1); assert.strictEqual(DU.ensure(w.S).outbox.length, 0, 'online não enfileira');
    assert.strictEqual(DN.send.length, 3, 'não existe parâmetro de texto');
  });

  await t('rotas da dupla usam o CÓDIGO: invite {code}, accept/decline/block/:código, leave', async () => {
    const pair = view(world()); const { w, sv } = await started({ partner: null, invites: [{ id: 'QWRT2345', name: 'Ana', at: 0 }] }, {
      'POST /duo/invite': b => ({ ok: true, code: b.code, expiresAt: 1, left: 4 }), 'POST /duo/decline/:id': () => ({ ok: true }),
      'POST /duo/accept/:id': () => { sv.view = Object.assign({}, pair, { partner: { id: 'QWRT2345', name: 'Ana', since: 5, last: 0 } }); return { ok: true, partner: { id: 'QWRT2345' } }; },
      'POST /duo/block/:id': () => { sv.view = Object.assign({}, pair, { partner: null }); return { ok: true, id: 'QWRT2345', ended: true }; },
      'POST /duo/leave': () => ({ ok: true, relinkMs: 24 * H, relinkAt: 9 }) });
    assert.strictEqual(DU.ensure(w.S).inv.in[0].id, 'QWRT2345');
    assert.ok((await DN.invite(w.S, w.host, 'mnbv2345')).ok);
    assert.deepStrictEqual([sv.calls[0].m, sv.calls[0].path, sv.calls[0].body], ['POST', '/duo/invite', '{"code":"MNBV2345"}']);
    assert.strictEqual((await DN.invite(w.S, w.host, 'oi tudo bem')).reason, 'code');
    assert.ok((await DN.accept(w.S, w.host, 'QWRT2345')).ok); assert.ok(sv.calls.some(c => c.path === '/duo/accept/QWRT2345' && c.body === undefined));
    assert.strictEqual(DU.ensure(w.S).partner.id, 'QWRT2345');
    assert.ok((await DN.block(w.S, w.host)).ok); assert.ok(sv.calls.some(c => c.path === '/duo/block/QWRT2345'));
    assert.strictEqual(DU.ensure(w.S).partner, null); assert.ok(DU.ensure(w.S).blocked.includes('QWRT2345'));
    assert.ok((await DN.decline(w.S, w.host, 'ZZZZ2345')).ok); assert.ok(sv.calls.some(c => c.path === '/duo/decline/ZZZZ2345'));
    for (const c of sv.calls) assert.ok(!/\/duo\/(accept|decline|block)\/(?![A-Z0-9]{8}$)/.test(c.path), 'id da rota é sempre o código: ' + c.path);
    const { w: w2, sv: sv2 } = await started(null, { 'POST /duo/leave': () => { sv2.view = view(w2, { partner: null, leftAt: w2.host.t, relinkLeftMs: 24 * H }); return { ok: true, relinkMs: 24 * H }; } });
    assert.ok((await DN.leave(w2.S, w2.host)).ok); assert.strictEqual(DU.ensure(w2.S).partner, null); assert.strictEqual(DU.relinkLeft(w2.S, w2.host), 24 * H);
  });

  await t('progresso: POST /v1/duo/progress com os TOTAIS do dia + day; só reenvia se mudou', async () => {
    const { w, sv } = await started(null, { 'POST /duo/progress': b => ({ ok: true, day: b.day, mine: b, capped: false }) });
    DU.track(w.S, w.host, 'kills', 120); DU.track(w.S, w.host, 'bossKills', 2);
    assert.ok((await DN.pushProgress(w.S, w.host, true)).sent);
    assert.deepStrictEqual(JSON.parse(sv.calls[0].body), { kills: 120, bossKills: 2, stages: 0, arenaWins: 0, day: dk(w.host.t) });
    assert.strictEqual((await DN.pushProgress(w.S, w.host, true)).sent, false, 'igual: não reenvia');
    DU.track(w.S, w.host, 'kills', 30000); await DN.pushProgress(w.S, w.host, true);
    assert.strictEqual(JSON.parse(sv.calls[1].body).kills, 20000, 'teto do dia igual ao do servidor (DATA.dayCap)');
  });

  await t('resgate: o servidor autoriza e o jogo paga UMA vez; sem autorização não paga; 409 claimed marca sem pagar', async () => {
    const { w, sv } = await started({ partnerDay: { kills: 290, bossKills: 0, stages: 0, arenaWins: 0 } }, {
      'POST /duo/claim/daily': () => ({ ok: true, id: 'daily', period: dk(w.host.t), value: 300, target: 300, reward: { goldK: 30, stones: 1, gems: 0 } }),
      'POST /duo/claim/boss200': () => ({ err: 'done', details: { value: 3, target: 200 } }),
      'POST /duo/claim/days5': () => ({ err: 'claimed' }) });
    DU.track(w.S, w.host, 'kills', 10);
    assert.strictEqual(DU.claim(w.S, w.host, 'daily').reason, 'online', 'Sys.duo.claim direto (sem servidor) não paga'); assert.strictEqual(w.host.gold, 0);
    const r = await DN.claim(w.S, w.host, 'daily'); assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(w.host.gold, 300); assert.strictEqual(r.reward.gems, 0);
    assert.ok(sv.calls.some(c => c.m === 'POST' && c.path === '/duo/claim/daily' && c.body === undefined));
    const k = sv.calls.length;
    assert.strictEqual((await DN.claim(w.S, w.host, 'daily')).reason, 'claimed'); assert.strictEqual(DU.claim(w.S, w.host, 'daily').reason, 'claimed');
    assert.strictEqual(sv.calls.length, k, 'já resgatado: nem chama o servidor'); assert.strictEqual(w.host.gold, 300, 'não pagou de novo');
    assert.strictEqual((await DN.claim(w.S, w.host, 'boss200')).reason, 'done'); assert.strictEqual(w.host.gold, 300);
    assert.strictEqual((await DN.claim(w.S, w.host, 'days5')).reason, 'claimed'); assert.strictEqual(w.host.gold, 300);
    assert.ok(DU.ensure(w.S).week.claimed.includes('days5'), 'o servidor diz que já resgatou: marca sem pagar');
  });

  await t('resgate com mailed:true (de9f83c): o SERVIDOR credita pelo correio; o jogo só marca resgatado e NÃO paga', async () => {
    const { w } = await started({ partnerDay: { kills: 290, bossKills: 0, stages: 0, arenaWins: 0 } }, {
      'POST /duo/claim/daily': () => ({ ok: true, id: 'daily', period: dk(w.host.t), value: 300, target: 300, reward: { goldK: 30, stones: 1, gems: 0 }, mailed: true }) });
    DU.track(w.S, w.host, 'kills', 10); const g0 = w.host.gold;
    const r = await DN.claim(w.S, w.host, 'daily'); assert.ok(r.ok && r.mailed && r.paid === false, JSON.stringify(r)); assert.strictEqual(w.host.gold, g0, 'não pagou');
    assert.strictEqual(DU.ensure(w.S).day.claimed, true); assert.strictEqual((await DN.claim(w.S, w.host, 'daily')).reason, 'claimed');
  });

  await t('resgate autorizado com o espelho local atrasado: paga (o servidor conferiu a soma); resgates do servidor no GET viram resgatados', async () => {
    const { w, sv } = await started(null, { 'POST /duo/claim/stages40': () => ({ ok: true, id: 'stages40', period: wk(w.host.t), value: 40, target: 40, reward: { goldK: 120, stones: 4 } }) });
    assert.ok((await DN.claim(w.S, w.host, 'stages40')).ok); assert.strictEqual(w.host.gold, 1200);
    sv.view = view(w, { claimed: { daily: true, weekly: ['arena20', 'nada'] } }); await DN.refresh(w.S, w.host);
    const o = DU.ensure(w.S); assert.strictEqual(o.day.claimed, true); assert.deepStrictEqual(o.week.claimed.sort(), ['arena20', 'stages40']);
    assert.strictEqual(DU.claim(w.S, w.host, 'arena20').reason, 'claimed');
    sv.view = view(w, { claimed: { daily: false, weekly: [] } }); await DN.refresh(w.S, w.host);
    assert.strictEqual(o.day.claimed, true, 'nunca "desresgata" (pagaria de novo)');
  });

  await t('sem rede / DUO_ON desligado: start falha e fica o local; ação offline não muda nada; 404 depois de ligado volta ao local', async () => {
    const w = world(); DU.DATA.on = true; DU.setProvider(null); DN._reset(); DN.DATA.on = true;
    const sv = server({ view: view(w) }); sv.down = true;
    const r = await DN.start(w.S, w.host); assert.strictEqual(r.ok, false); assert.strictEqual(r.reason, 'offline'); assert.strictEqual(DU.provider, DU.localProvider);
    sv.down = false; sv.off = true; assert.strictEqual((await DN.start(w.S, w.host)).reason, 'not_found'); assert.strictEqual(DU.provider, DU.localProvider);
    const { w: w2, sv: s2 } = await started(); const before = JSON.stringify(w2.S.sys.duo); s2.down = true;
    assert.strictEqual((await DN.send(w2.S, w2.host, 0)).reason, 'offline'); assert.strictEqual((await DN.claim(w2.S, w2.host, 'daily')).reason, 'offline');
    assert.strictEqual(JSON.stringify(w2.S.sys.duo), before); assert.strictEqual(w2.host.gold, 0);
    s2.down = false; s2.off = true; await DN.refresh(w2.S, w2.host); assert.strictEqual(DU.provider, DU.localProvider); assert.strictEqual(DN.state().started, false);
  });

  DN.DATA.on = false; DN._reset(); DU.setProvider(null); DU.DATA.on = false; NET.DATA.on = false;
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
