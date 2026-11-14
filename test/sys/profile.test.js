// node test/sys/profile.test.js — Sys.profile (Perfil V5: trocar nome, moldura/aura/retrato, FC 7 dias, recordes) e o modo estrito do Sys.name
'use strict';
const assert = require('assert');
const { makeHost } = require('./_host.js');
const N = require('../../js/sys/name.js');
const P = require('../../js/sys/profile.js');
require('../../js/sys/clock.js');
global.Sys.name = N;   // o name.js no node registra no module.exports, não no global
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const DAY = 86400000;
const save = () => ({ name: 'Kael', gems: 500, hero: 'kael', sys: {} });

t('DESLIGADO: nada escreve no save e o jogo segue como hoje', () => {
  assert.strictEqual(P.DATA.on, false);
  const S = save(), h = makeHost(), before = JSON.stringify(S);
  assert.deepStrictEqual(P.view(S, h), { on: false });
  assert.strictEqual(P.equipped(S, h), null); assert.strictEqual(P.auraFor(S, h), null);
  assert.strictEqual(P.rename(S, h, 'Kaelzinho').ok, false); assert.strictEqual(P.sampleFC(S, h, 100), null);
  assert.strictEqual(P.record(S, 'hit', 10, h).ok, false); assert.strictEqual(P.equip(S, h, 'frame', 'none').ok, false);
  assert.strictEqual(P.grant(S, 'eterna'), false); assert.strictEqual(P.sync(S, h).ok, false);
  assert.deepStrictEqual(P.frames(S, h), []); assert.strictEqual(P.renameQuote(S, h).on, false);
  assert.strictEqual(JSON.stringify(S), before);
});

P.setOn(true);

/* ---------- filtro de nome (Sys.name estrito) ---------- */
t('nomes normais passam (com acento, nomes compostos no texto livre)', () => {
  for (const s of ['João', 'Maria Clara', 'Ana Luísa', 'Conceição', 'Sebastião', 'Heloísa', 'Pedro Henrique', 'Cássio', 'Débora', 'Modesto', 'Devon', 'Computador', 'Escudo', 'Disputa', 'Pinto', 'Bichano', 'Rolando', 'Mercadinho'])
    { assert.ok(!N.profane(s), 'profane ' + s); assert.ok(!N.impersonates(s), 'imp ' + s); }
  for (const s of ['João', 'MariaClara', 'Maria_Clara', 'Conceição', 'Kael_BR', 'Guardião', 'Ana2012', 'Modesto', 'Devon', 'Pauleta'])
    assert.ok(N.check(s, { strict: true }).ok, s);
  // espaço continua fora no NOME (protótipo: "3 a 14 letras ou números", sem espaço), mesmo não sendo palavrão
  const r = N.check('Maria Clara', { strict: true }); assert.ok(!r.ok); assert.ok(r.clean); assert.ok(!r.chars);
});
t('truques pegos: acento, l33t, letras repetidas, pontos/espaços/traços entre as letras', () => {
  for (const s of ['p.u.t.a', 'p u t a', 'P-0-R-R-4', 'puuuuta', 'pútá', 'm3rd4', 'c@r@lh0', 'f.d.p', 'v4g4bund0', 'arrombado', 'Buc3t4', 'fuck you', 'f u c k', '$exy', 'Nazista', 'xvideos', 'c.a.r.a.l.h.o'])
    assert.ok(N.profane(s), s);
  for (const s of ['Pu74', 'Arromb4d0', 'V4gabundo', 'Caraaalho', 'Escroto', 'Safadinha', 'Gostosa', 'S3xy'])
    assert.ok(!N.check(s, { strict: true }).ok, s);
  assert.strictEqual(N.check('Escroto', { strict: true }).msg, 'Esse nome não é permitido.');
});
t('se passar pela equipe é bloqueado no modo estrito', () => {
  for (const s of ['Admin_Kael', '4dm1n', 'KaelOficial', 'Suporte2', 'GM_Kael', 'e0nb0und', 'EonboundStaff', 'DevKael', 'Moderador', 'Dono', 'Equipe_X', 'Administrador_'])
    { assert.ok(!N.check(s, { strict: true }).ok, s); }
  assert.ok(N.impersonates('Eonbound Staff')); assert.ok(N.impersonates('suporte oficial'));
  assert.strictEqual(N.check('KaelOficial', { strict: true }).msg, 'Esse nome é reservado.');
  // sem strict o check é o MESMO de antes (o teste do name.test.js aceita 'Administrador_')
  assert.ok(N.check('Administrador_').ok); assert.ok(N.check('KaelOficial').ok);
});

/* ---------- trocar nome ---------- */
t('1ª troca grátis, depois 200 gemas; nome atual, palavrão e falta de gemas recusam', () => {
  const S = save(), h = makeHost();
  let q = P.renameQuote(S, h); assert.ok(q.free); assert.strictEqual(q.gems, 0);
  assert.strictEqual(P.rename(S, h, 'Kael').reason, 'nome');
  assert.strictEqual(P.rename(S, h, 'p0rr4').reason, 'nome');
  assert.strictEqual(P.rename(S, h, 'Admin_X').msg, 'Esse nome é reservado.');
  let r = P.rename(S, h, ' João '); assert.ok(r.ok); assert.strictEqual(S.name, 'João'); assert.strictEqual(r.gems, 0); assert.strictEqual(S.gems, 500);
  q = P.renameQuote(S, h); assert.ok(!q.free); assert.strictEqual(q.gems, 200);
  r = P.rename(S, h, 'MariaClara'); assert.ok(r.ok); assert.strictEqual(S.gems, 300);
  S.gems = 150; r = P.rename(S, h, 'Kaelzinho'); assert.strictEqual(r.reason, 'gemas'); assert.strictEqual(S.name, 'MariaClara'); assert.strictEqual(S.gems, 150);
});
t('cobra pelo host.spendGems quando existe; espera opcional (cooldownH)', () => {
  const S = save(), h = makeHost(); let spent = 0; h.gems = () => 1000; h.spendGems = k => { spent += k; return true; };
  P.rename(S, h, 'Kaelino'); P.rename(S, h, 'Kaelito'); assert.strictEqual(spent, 200);
  P.DATA.rename.cooldownH = 24;
  try { const r = P.rename(S, h, 'Kaelao'); assert.strictEqual(r.reason, 'espera'); h.t += 25 * 3600000; assert.ok(P.rename(S, h, 'Kaelao').ok); }
  finally { P.DATA.rename.cooldownH = 0; }
});

/* ---------- moldura, aura, retrato ---------- */
t('molduras: liberadas por nível, VIP, arena, prêmio e fim das 9 eras; travada mostra como ganhar', () => {
  const S = save(), h = makeHost({ level: 12 });
  const own = () => P.frames(S, h).filter(f => f.owned).map(f => f.id);
  assert.deepStrictEqual(own(), ['none', 'bronze']);
  const prata = P.frames(S, h).find(f => f.id === 'prata'); assert.strictEqual(prata.how, 'Nível 30'); assert.strictEqual(prata.cur, 12);
  let r = P.equip(S, h, 'frame', 'prata'); assert.strictEqual(r.reason, 'falta'); assert.strictEqual(r.how, 'Nível 30');
  assert.ok(P.equip(S, h, 'frame', 'bronze').ok); assert.strictEqual(P.equipped(S, h).frame, 'bronze');
  S.sys.vip = { level: 7, active: true, points: 8000 }; S.sys.arena = { bestRank: 7 }; S.sys.erasEnd = { cos: { owned: ['nine_eras'], eq: {} } };
  assert.ok(P.grant(S, 'eterna')); assert.ok(!P.grant(S, 'eterna')); assert.ok(!P.grant(S, 'nao_existe'));
  assert.deepStrictEqual(own(), ['none', 'bronze', 'vip1', 'vip2', 'vip3', 'vip4', 'vip5', 'vip6', 'vip7', 'cristal', 'eterna', 'nine_eras'], 'moldura Ouro não vem mais do VIP 7 (dono 14/11)');
  const ouro = P.frames(S, h).find(f => f.id === 'ouro'); assert.strictEqual(ouro.how, 'Chegar ao nível 60'); assert.strictEqual(ouro.need, 60); assert.strictEqual(ouro.cur, 12);
  const h60 = makeHost({ level: 60 }); assert.ok(P.frames(S, h60).find(f => f.id === 'ouro').owned, 'nível 60 libera a moldura Ouro (conquista)');
  S.sys.vip = { level: 0, active: false, points: 0 }; assert.ok(P.frames(S, h60).find(f => f.id === 'ouro').owned, 'sem VIP também'); S.sys.vip = { level: 7, active: true, points: 8000 };
  assert.ok(P.equip(S, h, 'frame', 'nine_eras').ok);
  assert.ok(P.equip(S, h, 'frame', null).ok); assert.strictEqual(P.equipped(S, h).frame, 'none');
  assert.strictEqual(P.equip(S, h, 'frame', 'xx').reason, 'id'); assert.strictEqual(P.equip(S, h, 'chapeu', 'none').reason, 'tipo');
});
t('auras pela Forja da arma e da asa; escolhida perdida volta a null (o jogo usa a da batalha)', () => {
  require('../../js/sys/forge.js');
  const S = save(), h = makeHost(); S.sys.forge = { lv: { weapon: 7, wing: 10 } };
  global.Sys.forge.ensure(S); S.sys.forge.lv.weapon = 7; S.sys.forge.lv.wing = 10;
  const lv = global.Sys.forge.level(S, 'weapon');
  const owned = () => P.auras(S, h).filter(a => a.owned).map(a => a.id);
  assert.ok(owned().includes('aura4') && owned().includes(lv >= 7 ? 'aura7' : 'aura4'));
  assert.ok(!owned().includes('aura10')); assert.ok(!owned().includes('aura_holy'));   // sem asa de anjo equipada
  S.eq = { wing: { slot: 'wing', wing: 'angel' } };
  assert.ok(owned().includes('aura_holy')); assert.ok(!owned().includes('aura_evil'));
  assert.ok(P.equip(S, h, 'aura', 'aura_holy').ok); assert.strictEqual(P.auraFor(S, h), 'aura_holy');
  S.eq = {}; assert.strictEqual(P.auraFor(S, h), null);   // trocou a asa: a escolha não vale mais
  assert.strictEqual(P.equip(S, h, 'aura', 'aura13').reason, 'falta');
  assert.strictEqual(P.auras(S, h).find(a => a.id === 'aura13').how, 'Arma na Forja +13');
});
t('retrato: padrão do herói e os das skins que tem', () => {
  const S = save(), h = makeHost();
  let ps = P.portraits(S, h); assert.strictEqual(ps[0].avatar, 'kael_phase0'); assert.ok(ps[0].equipped);
  global.Sys.appearance = { fixedSkins: () => [{ id: 'kael_ninja', name: 'Kael Ninja', hero: 'kael', avatar: 'kael_ninja', owned: true }, { id: 'kael_demon', name: 'Kael Demônio', hero: 'kael', avatar: 'kael_demon', owned: false, how: 'Prêmio: VIP 7' }, { id: 'kaia_ninja', hero: 'kaia', avatar: 'kaia_ninja', owned: true }],
    avatarKey: () => 'kael_phase0' };
  try {
    ps = P.portraits(S, h); assert.deepStrictEqual(ps.map(p => p.avatar), ['kael_phase0', 'kael_ninja', 'kael_demon']);
    assert.ok(P.equip(S, h, 'avatar', 'kael_ninja').ok); assert.strictEqual(P.equipped(S, h).avatar, 'kael_ninja');
    const r = P.equip(S, h, 'avatar', 'kael_demon'); assert.strictEqual(r.reason, 'falta'); assert.strictEqual(r.how, 'Prêmio: VIP 7');
    assert.strictEqual(P.equip(S, h, 'avatar', 'kaia_ninja').reason, 'id');
  } finally { delete global.Sys.appearance; }
});

/* ---------- FC 7 dias ---------- */
t('FC: maior amostra do dia, 7 dias, buracos nos dias sem amostra', () => {
  const S = save(), h = makeHost({ now: Date.UTC(2026, 10, 13, 15, 0, 0) });   // sex 13/11, 12h em Brasília
  global.Sys.clock.DATA.tzOffsetMin = -180;
  try {
    P.sampleFC(S, h, 61200); P.sampleFC(S, h, 60000); P.sampleFC(S, h, 66800);
    let c = P.fcChart(S, h); assert.strictEqual(c.points.length, 7); assert.strictEqual(c.points[6].label, 'hoje'); assert.strictEqual(c.points[6].fc, 66800);
    assert.strictEqual(c.points[5].label, 'qui'); assert.strictEqual(c.points[5].gap, true); assert.strictEqual(c.points[5].fc, null);
    h.t += 2 * DAY; P.sampleFC(S, h, 71500);   // domingo; o sábado fica sem amostra
    c = P.fcChart(S, h); assert.deepStrictEqual(c.points.slice(4).map(p => p.fc), [66800, null, 71500]); assert.strictEqual(c.delta, 71500 - 66800);
    // virada pelo dia de Brasília: 23h30 de Brasília ainda é o mesmo dia
    const S2 = save(), h2 = makeHost({ now: Date.UTC(2026, 10, 14, 2, 30, 0) }); P.sampleFC(S2, h2, 10);
    assert.strictEqual(S2.sys.profile.fc[0].d, '2026-11-13');
    for (let i = 0; i < 12; i++) { h.t += DAY; P.sampleFC(S, h, 80000 + i); }
    assert.strictEqual(S.sys.profile.fc.length, 7); c = P.fcChart(S, h); assert.ok(c.points.every(p => !p.gap)); assert.strictEqual(c.max, 80011);
    assert.strictEqual(P.records(S).find(r => r.id === 'fc').v, 80011);
    // save estragado é limpo
    S.sys.profile.fc.push({ d: 'lixo', fc: 1 }, null, { d: '2026-11-20', fc: -5 }); P.ensure(S); assert.strictEqual(S.sys.profile.fc.length, 7);
  } finally { global.Sys.clock.DATA.tzOffsetMin = null; }
});
t('FC sem número: usa o Sys.fc.compute', () => {
  const S = save(), h = makeHost(); global.Sys.fc = { compute: () => 1234.4 };
  try { assert.strictEqual(P.sampleFC(S, h).fc, 1234); } finally { delete global.Sys.fc; }
});

/* ---------- recordes ---------- */
t('recordes: só o melhor (máx; mín para tempo) com a data; soma do dia; sync dos módulos', () => {
  const S = save(), h = makeHost();
  assert.ok(P.record(S, 'hit', 48300, h, 'Ultimate').newRecord);
  assert.ok(!P.record(S, 'hit', 20000, h).newRecord);
  h.t += DAY; const r = P.record(S, 'hit', 50000, h, 'Crítico'); assert.ok(r.newRecord); assert.strictEqual(r.prev, 48300);
  const hit = P.records(S).find(x => x.id === 'hit'); assert.strictEqual(hit.v, 50000); assert.strictEqual(hit.info, 'Crítico'); assert.strictEqual(hit.at, h.t); assert.ok(hit.day);
  assert.ok(P.record(S, 'bossTime', 14, h, 'Guardião de Pedra').newRecord); assert.ok(P.record(S, 'bossTime', 11, h).newRecord); assert.ok(!P.record(S, 'bossTime', 12, h).newRecord);
  assert.strictEqual(P.records(S).find(x => x.id === 'bossTime').text, '11 s');
  assert.strictEqual(P.record(S, 'bossTime', 0, h).ok, false); assert.strictEqual(P.record(S, 'nada', 1, h).reason, 'id'); assert.strictEqual(P.record(S, 'hit', 'x', h).reason, 'valor');
  P.addDaily(S, h, 'goldDay', 300000); P.addDaily(S, h, 'goldDay', 112000);
  h.t += DAY; const d = P.addDaily(S, h, 'goldDay', 5000); assert.strictEqual(d.today, 5000); assert.ok(!d.newRecord);
  assert.strictEqual(P.records(S).find(x => x.id === 'goldDay').v, 412000);
  S.best = 27; S.sys.tower = { best: 7 }; S.sys.arena = { bestRank: 4, lp: 1300, league: 2 };
  const s = P.sync(S, h); assert.ok(s.ok); assert.deepStrictEqual(s.updated.sort(), ['arenaLeague', 'arenaLp', 'arenaRank', 'stage', 'tower']);
  const v = P.view(S, h); assert.ok(v.on); assert.strictEqual(v.records.find(x => x.id === 'arenaRank').text, '4º');
  assert.strictEqual(v.records.find(x => x.id === 'streak').has, false);
  assert.ok(Array.isArray(v.frames) && Array.isArray(v.auras) && Array.isArray(v.portraits) && v.fc.points.length === 7 && v.rename.on);
});

P.setOn(false);
console.log(n + ' testes ok');
