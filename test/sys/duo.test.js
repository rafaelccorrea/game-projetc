// node test/sys/duo.test.js — Sys.duo (Dupla das Eras: 1 amigo, só frases prontas, sem troca, prêmio igual para os dois)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const CL = require('../../js/sys/clock.js'), LV = require('../../js/sys/level.js'), FG = require('../../js/sys/forge.js');
const DU = require('../../js/sys/duo.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const H = 3600000;

function world(lvl) {
  const S = { sys: { level: { lvl: lvl == null ? 30 : lvl, xp: 0 } } };
  const host = { gold: 0, changes: 0, t: new Date(2026, 10, 11, 12).getTime(), goldUnit: () => 10,
    addGold: g => { host.gold += g; }, onChange: () => { host.changes++; } };
  host.now = () => host.t;
  return { S, host };
}
function paired(lvl) { const w = world(lvl); DU.DATA.on = true; DU.receiveInvite(w.S, w.host, { id: 'p2', name: 'Lia' }); assert.ok(DU.accept(w.S, w.host, 'p2').ok); return w; }

t('chave desligada: nada funciona e o save não muda', () => {
  DU.DATA.on = false; const w = world(); const before = JSON.stringify(w.S);
  assert.strictEqual(DU.invite(w.S, w.host, 'ABC123').reason, 'off'); assert.strictEqual(DU.send(w.S, w.host, 0).reason, 'off');
  assert.strictEqual(DU.track(w.S, w.host, 'kills', 5), 0); assert.deepStrictEqual(DU.view(w.S, w.host), { on: false });
  assert.strictEqual(JSON.stringify(w.S), before);
});

t('portão de nível (16) e formato do código', () => {
  DU.DATA.on = true; const w = world(10);
  assert.strictEqual(DU.invite(w.S, w.host, 'ABC123').reason, 'level');
  w.S.sys.level.lvl = 20;
  assert.strictEqual(DU.invite(w.S, w.host, 'oi tudo bem?').reason, 'code');
  assert.strictEqual(DU.invite(w.S, w.host, 'ABC123', 'abc123').reason, 'self');
  const r = DU.invite(w.S, w.host, 'abc123'); assert.ok(r.ok); assert.strictEqual(r.code, 'ABC123');
  assert.strictEqual(DU.invite(w.S, w.host, 'ABC123').reason, 'dup');
});

t('limite de 5 convites por dia; volta no dia seguinte', () => {
  DU.DATA.on = true; const w = world();
  for (let i = 0; i < 5; i++) assert.ok(DU.invite(w.S, w.host, 'CODE00' + i).ok);
  assert.strictEqual(DU.invite(w.S, w.host, 'CODE009').reason, 'limit');
  w.host.t += 49 * H; assert.ok(DU.invite(w.S, w.host, 'CODE009').ok);
});

t('aceitar convite vira dupla; 1 dupla por vez', () => {
  const w = paired(); const v = DU.view(w.S, w.host);
  assert.strictEqual(v.partner.id, 'p2'); assert.strictEqual(v.partner.name, 'Lia');
  assert.strictEqual(DU.invite(w.S, w.host, 'XYZ999').reason, 'paired');
  assert.strictEqual(DU.receiveInvite(w.S, w.host, { id: 'p3' }).reason, 'paired');
});

t('só frases prontas por índice; cooldown, repetição e teto do dia', () => {
  const w = paired();
  assert.strictEqual(DU.send(w.S, w.host, 'Oi, me passa seu zap').reason, 'phrase');
  assert.strictEqual(DU.send(w.S, w.host, 999).reason, 'phrase');
  assert.strictEqual(DU.send.length, 3);   // (S, host, idx): não existe parâmetro de texto
  const r = DU.send(w.S, w.host, 0); assert.ok(r.ok); assert.strictEqual(r.txt, 'Oi, dupla!');
  assert.strictEqual(DU.send(w.S, w.host, 1).reason, 'wait');
  w.host.t += 5000; assert.ok(DU.send(w.S, w.host, 0).ok);
  w.host.t += 5000; assert.strictEqual(DU.send(w.S, w.host, 0).reason, 'repeat');
  for (let i = 0; i < 28; i++) { w.host.t += 5000; assert.ok(DU.send(w.S, w.host, 1 + (i % 5)).ok, 'msg ' + i); }
  w.host.t += 5000; assert.strictEqual(DU.send(w.S, w.host, 7).reason, 'day');
  assert.ok(DU.receive(w.S, w.host, 6).ok); assert.strictEqual(DU.receive(w.S, w.host, -1).reason, 'phrase');
  const chat = DU.view(w.S, w.host).chat; assert.strictEqual(chat[chat.length - 1].txt, 'Meta fechada! Boa!'); assert.strictEqual(chat[chat.length - 1].me, false);
  assert.ok(DU.DATA.phrases.every(p => typeof p.txt === 'string' && p.txt.length > 0));
});

t('meta diária: soma dos dois + os dois entraram; prêmio igual, sem gema e sem repetir', () => {
  const w = paired(); DU.track(w.S, w.host, 'kills', 200);
  assert.strictEqual(DU.claim(w.S, w.host, 'daily').reason, 'done');
  DU.applyServer(w.S, w.host, { partner: { id: 'p2', name: 'Lia' }, partnerDay: { kills: 100 } });
  assert.strictEqual(DU.claim(w.S, w.host, 'daily').reason, 'done');   // parceiro ainda não "entrou" hoje
  DU.applyServer(w.S, w.host, { partner: { id: 'p2', name: 'Lia' }, partnerPresent: true });
  const st0 = FG.ensure(w.S).stones; const r = DU.claim(w.S, w.host, 'daily');
  assert.ok(r.ok); assert.deepStrictEqual(r.reward, { gold: 300, stones: 1, gems: 0 }); assert.strictEqual(w.host.gold, 300); assert.strictEqual(FG.ensure(w.S).stones, st0 + 1);
  assert.strictEqual(DU.claim(w.S, w.host, 'daily').reason, 'claimed');
  w.host.t += 24 * H; assert.strictEqual(DU.view(w.S, w.host).daily.value, 0);   // dia novo zera
});

t('semanal: 200 abates de chefe juntos; dias juntos; resgate não volta com parceiro novo', () => {
  const w = paired(); DU.track(w.S, w.host, 'bossKills', 120);
  DU.applyServer(w.S, w.host, { partner: { id: 'p2' }, partnerWeek: { bossKills: 80 } });
  const r = DU.claim(w.S, w.host, 'boss200'); assert.ok(r.ok); assert.strictEqual(r.reward.gold, 1200);
  // dias juntos
  DU.applyServer(w.S, w.host, { partner: { id: 'p2' }, partnerDays: [DU.ensure(w.S).day.k] });
  assert.strictEqual(DU.view(w.S, w.host).weekly.find(x => x.id === 'days5').value, 1);
  // sai e faz dupla nova na mesma semana: boss200 continua resgatado
  assert.ok(DU.leave(w.S, w.host).ok); w.host.t += 25 * H;
  DU.receiveInvite(w.S, w.host, { id: 'p9' }); assert.ok(DU.accept(w.S, w.host, 'p9').ok);
  DU.track(w.S, w.host, 'bossKills', 300);
  assert.strictEqual(DU.claim(w.S, w.host, 'boss200').reason, 'claimed');
  assert.strictEqual(DU.claim(w.S, w.host, 'xx').reason, 'id');
});

t('sair: 24 h para outra dupla; progresso só conta com dupla', () => {
  const w = paired(); assert.ok(DU.leave(w.S, w.host).ok);
  assert.strictEqual(DU.track(w.S, w.host, 'kills', 10), 0);
  DU.receiveInvite(w.S, w.host, { id: 'p5' });
  assert.strictEqual(DU.accept(w.S, w.host, 'p5').reason, 'relink'); assert.strictEqual(DU.invite(w.S, w.host, 'ABC123').reason, 'relink');
  w.host.t += 24 * H; assert.ok(DU.accept(w.S, w.host, 'p5').ok);
});

t('bloquear: sai da dupla, some o convite e ele não convida mais', () => {
  const w = paired(); assert.ok(DU.block(w.S, w.host).ok);
  assert.strictEqual(DU.view(w.S, w.host).partner, null);
  assert.strictEqual(DU.receiveInvite(w.S, w.host, { id: 'p2' }).reason, 'blocked');
  assert.strictEqual(DU.applyServer(w.S, w.host, { partner: { id: 'p2' } }).reason, 'blocked');
  w.host.t += 25 * H; DU.receiveInvite(w.S, w.host, { id: 'p7' }); assert.ok(DU.block(w.S, w.host, 'p7').ok);
  assert.strictEqual(DU.view(w.S, w.host).invitesIn.length, 0); assert.ok(DU.unblock(w.S, w.host, 'p7').ok);
});

t('provider do servidor: recusa dele vale; local enfileira', () => {
  const w = paired(); DU.send(w.S, w.host, 0); assert.strictEqual(DU.ensure(w.S).outbox.length, 1);
  DU.setProvider({ online: true, send: () => ({ ok: false, reason: 'muted' }) }); w.host.t += 6000;
  assert.strictEqual(DU.send(w.S, w.host, 2).reason, 'muted'); DU.setProvider(null);
  assert.strictEqual(DU.provider.online, false);
});

t('save torto é arrumado', () => {
  const S = { sys: { duo: { partner: { id: {} }, inv: { out: [{ code: 'x' }, { code: 'ABCDEF', at: 1 }], in: [{}] }, blocked: [1, null, 'a'],
    inbox: [{ idx: 99 }, { idx: 2, at: 5 }], week: { claimed: ['boss200', 'zz'] }, msg: { lastIdx: 50 } } } };
  const o = DU.ensure(S); assert.strictEqual(o.partner, null); assert.strictEqual(o.inv.out.length, 1); assert.strictEqual(o.inv.in.length, 0);
  assert.deepStrictEqual(o.blocked, ['1', 'a']); assert.strictEqual(o.inbox.length, 1); assert.deepStrictEqual(o.week.claimed, ['boss200']); assert.strictEqual(o.msg.lastIdx, -1);
});

DU.DATA.on = false; DU.setProvider(null);
t('teto por dia igual ao do servidor (20.000 abates, 150 chefes, 60 fases, 40 arena); só quem saiu espera 24 h', () => { const D=require('../../js/sys/duo.js'); assert.deepStrictEqual(D.DATA.dayCap,{kills:20000,bossKills:150,stages:60,arenaWins:40}); });
console.log(`\n${n} testes ok (duo)`);
