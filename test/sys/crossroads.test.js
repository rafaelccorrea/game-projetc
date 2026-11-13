// node test/sys/crossroads.test.js — Sys.crossroads (Encruzilhada das Eras: 2 bênçãos a cada 10 fases, valem até o fim da era)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const { makeHost } = require('./_host.js');
const PH = require('../../js/sys/phases.js');
const FC = require('../../js/sys/fc.js');
const CR = require('../../js/sys/crossroads.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const save = seed => ({ sys: { crossroads: { seed } } });

t('chave desligada: nada abre, bônus zero, save intacto', () => {
  CR.DATA.on = false; const S = save(7), h = makeHost(); const before = JSON.stringify(S);
  assert.deepStrictEqual(CR.onStage(S, h, 5), { due: false, reason: 'off' });
  assert.strictEqual(CR.choose(S, 5, 'furia', h).reason, 'off');
  assert.deepStrictEqual(CR.bonus(S), { atkPct: 0, hpPct: 0, goldPct: 0, critPct: 0, defPct: 0, fc: 0 });
  assert.deepStrictEqual(CR.view(S, h), { on: false }); assert.strictEqual(JSON.stringify(S), before);
});

t('pontos: curva de hoje (10 por era) = fase 5; curva de 100 por era = 10..90, nunca a última', () => {
  PH.DATA.on = false;
  assert.deepStrictEqual([1, 5, 10, 15, 20].map(CR.isPoint), [false, true, false, true, false]);
  PH.DATA.on = true;
  assert.ok(CR.isPoint(10) && CR.isPoint(90) && !CR.isPoint(100) && CR.isPoint(110) && !CR.isPoint(55));
  assert.deepStrictEqual(CR.where(120), { era: 1, n: 20, key: '1:20', point: true });
  assert.ok(CR.isPoint({ era: 3, n: 40 }));
  PH.DATA.on = false;
});

t('oferta: 2 bênçãos diferentes, sempre as mesmas para o mesmo save e fase; outro save muda', () => {
  CR.DATA.on = true; const A = save(11), B = save(11), C = save(99);
  const a = CR.offers(A, 5), b = CR.offers(B, 5), a2 = CR.offers(A, 5);
  assert.strictEqual(a.length, 2); assert.notStrictEqual(a[0].id, a[1].id);
  assert.deepStrictEqual(a, b); assert.deepStrictEqual(a, a2);
  let diff = false; for (let s = 1; s <= 20 && !diff; s++) diff = JSON.stringify(CR.offers(save(s), 5)) !== JSON.stringify(a); assert.ok(diff);
  assert.ok(CR.offers(C, 5).length === 2); assert.deepStrictEqual(CR.offers(A, 6), []);
  assert.strictEqual(typeof CR.reroll, 'undefined');   // não existe rolar de novo
});

t('vencer a fase abre; escolher grava, dá o bônus na FC e não deixa trocar', () => {
  CR.DATA.on = true; const S = save(5), h = makeHost(); globalThis.Sys.crossroads = CR;
  const r = CR.onStage(S, h, 5); assert.ok(r.due); assert.strictEqual(r.offers.length, 2);
  assert.strictEqual(CR.view(S, h).open.length, 1);
  const pick = r.offers[0]; assert.strictEqual(CR.choose(S, 5, 'nao_existe', h).reason, 'id');
  const c = CR.choose(S, 5, pick.id, h); assert.ok(c.ok);
  assert.strictEqual(CR.choose(S, 5, r.offers[1].id, h).reason, 'done');
  assert.strictEqual(CR.onStage(S, h, 5).due, false);
  assert.strictEqual(CR.view(S, h).open.length, 0); assert.strictEqual(CR.active(S).length, 1);
  const tot = FC.totalBonus ? FC.totalBonus(S) : null;
  const b = CR.bonus(S), p = CR.perks(S), sum = Object.values(b).reduce((x, y) => x + y, 0) + p.xpPct + p.brasaPot + Object.values(p.strikes).reduce((x, y) => x + y, 0);
  assert.ok(sum > 0);
  if (tot) for (const k in pick.stat) assert.ok(tot[k] >= pick.stat[k]);
});

t('Sys.fc soma a bênção sozinho (bonus(S) do módulo)', () => {
  CR.DATA.on = true; const S = save(3), h = makeHost(); globalThis.Sys.crossroads = CR;
  let st = null; for (let s = 1; s < 400 && !st; s++) { const o = CR.offers(save(s), 5).find(x => x.stat.atkPct); if (o) st = { s, id: o.id }; }
  const S2 = save(st.s); CR.onStage(S2, h, 5); CR.choose(S2, 5, st.id, h);
  const src = FC.sources ? FC.sources(S2) : null;
  if (src) { const me = src.find(x => x.id === 'crossroads'); assert.ok(me && me.bonus.atkPct === 3); }
  assert.strictEqual(CR.bonus(S2).atkPct, 3); assert.strictEqual(CR.bonus(S).atkPct, 0);
});

t('era nova apaga as bênçãos da anterior; encruzilhada antiga não abre mais', () => {
  CR.DATA.on = true; PH.DATA.on = true; const S = save(8), h = makeHost();
  for (const st of [10, 20, 30]) { const r = CR.onStage(S, h, st); assert.ok(r.due); assert.ok(CR.choose(S, st, r.offers[0].id, h).ok); }
  CR.onStage(S, h, 40);   // aberta e não escolhida
  assert.strictEqual(CR.active(S).length, 3); assert.strictEqual(CR.view(S, h).open.length, 1);
  CR.onStage(S, h, 101);  // era 1
  assert.strictEqual(CR.active(S).length, 0); assert.strictEqual(CR.view(S, h).open.length, 0);
  assert.deepStrictEqual(CR.bonus(S).atkPct + CR.bonus(S).hpPct, 0);
  assert.strictEqual(CR.onStage(S, h, 50).due, false); assert.strictEqual(CR.choose(S, 40, CR.offers(S, 40)[0].id, h).reason, 'old');
  assert.ok(CR.onStage(S, h, 110).due);
  PH.DATA.on = false;
});

t('"once": Brasa Viva não volta a aparecer na mesma era depois de escolhida', () => {
  CR.DATA.on = true; PH.DATA.on = true; const h = makeHost();
  let S = null; for (let s = 1; s < 500 && !S; s++) { const x = save(s); if (CR.offers(x, 10).some(o => o.id === 'brasa')) S = x; }
  CR.onStage(S, h, 10); assert.ok(CR.choose(S, 10, 'brasa', h).ok);
  for (let st = 20; st <= 90; st += 10) assert.ok(!CR.offers(S, st).some(o => o.id === 'brasa'));
  assert.strictEqual(CR.perks(S).brasaPot, 1);
  PH.DATA.on = false;
});

t('save sujo é limpo; nove escolhas na era somam no máximo +36% numa chave de combate', () => {
  CR.DATA.on = true; const S = { sys: { crossroads: { seed: 1, era: 'x', picks: { '0:5': { id: 'xx' }, '0:10': { id: 'furia', era: 0 } }, open: [3, '0:20'] } } };
  const o = CR.ensure(S); assert.strictEqual(o.era, 0); assert.deepStrictEqual(Object.keys(o.picks), ['0:10']); assert.deepStrictEqual(o.open, ['0:20']);
  const max = Math.max(...CR.DATA.pool.flatMap(b => ['atkPct', 'hpPct', 'critPct', 'defPct'].map(k => (b.stat || {})[k] || 0))) * 9; assert.ok(max <= 36);   // combate: até +36% (4 x 9); ouro +8 x 9 = 72%
  assert.ok(CR.DATA.pool.filter(b => !b.once).length >= 10);   // sempre há 2 opções nas 9 encruzilhadas
});

CR.DATA.on = false;
console.log(`crossroads: ${n} testes ok`);
