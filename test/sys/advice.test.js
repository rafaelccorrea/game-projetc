// node test/sys/advice.test.js — Sys.advice (dicas de FC da dificuldade nova) com os módulos de verdade (fc, stats, level, forge, pet, mount, titles, practice)
'use strict';
const assert = require('assert');
globalThis.Sys = globalThis.Sys || {};
const F = require('../../js/sys/fc.js'), ST = require('../../js/sys/stats.js'), LV = require('../../js/sys/level.js'), G = require('../../js/sys/forge.js'),
  PET = require('../../js/sys/pet.js'), M = require('../../js/sys/mount.js'), TI = require('../../js/sys/titles.js'), PR = require('../../js/sys/practice.js');
const A = require('../../js/sys/advice.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };

/* save e host como os do jogo: itens em S.inv, equipados em S.eq (id), host.equipped() lê dali */
function world(o) {
  o = o || {};
  const S = { inv: [], eq: {}, sys: { level: { lvl: o.lvl || 30, xp: 0 } } }; let id = 1;
  const add = (it, on) => { it.id = id++; S.inv.push(it); if (on) S.eq[it.slot] = it.id; return it; };
  const host = { equipped: () => { const r = {}; for (const s in S.eq) { const it = S.inv.find(x => x.id === S.eq[s]); if (it) r[s] = it; } return r; },
    eraMax: () => 1, level: () => LV.level(S), atk: () => 0, hp: () => 0, now: () => Date.UTC(2026, 10, 13, 15), canSpendGold: () => true };
  return { S, host, add };
}
const fcNow = w => F.compute(w.S, w.host);

t('chave desligada: não calcula nada', () => {
  A.DATA.on = false; const w = world();
  assert.deepStrictEqual(A(w.S, w.host, { need: 999 }), { on: false, fc: 0, need: null, missing: null, ok: null, text: '', actions: [] });
});

A.DATA.on = true;

t('equipar o melhor da MOCHILA ("raridade +1"): ganho = FC com o item − FC de hoje, pela mesma conta do HUD', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 0, lvl: 30 }, true); const better = w.add({ slot: 'weapon', e: 1, r: 3, lvl: 30, name: 'Lâmina Épica' });
  w.add({ slot: 'weapon', e: 1, r: 0, lvl: 5 });   // pior: não entra
  const r = A(w.S, w.host), eq = r.actions.find(a => a.kind === 'equip');
  assert.ok(eq, 'tem a ação de equipar'); assert.strictEqual(eq.tab, 'gear'); assert.strictEqual(eq.ready, true);
  assert.strictEqual(eq.gain, Math.round(F.compute(w.S, w.host, { item: better }) - fcNow(w)));
  assert.ok(/Lâmina Épica/.test(eq.label)); assert.ok(eq.gainText.startsWith('+') && /FC$/.test(eq.gainText));
});

t('"faltam X de FC" só com need; FC suficiente; sem need não inventa', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 1, lvl: 30 }, true); const now = fcNow(w);
  const a = A(w.S, w.host, { need: now + 500 }); assert.strictEqual(a.missing, 500); assert.strictEqual(a.ok, false);
  assert.strictEqual(a.text, 'Faltam ' + F.viewText(500) + ' de FC');
  const b = A(w.S, w.host, { need: now - 1 }); assert.strictEqual(b.missing, 0); assert.strictEqual(b.text, 'FC suficiente');
  const c = A(w.S, w.host); assert.strictEqual(c.need, null); assert.strictEqual(c.missing, null); assert.strictEqual(c.text, '');
});

t('ordem: o que dá AGORA primeiro, depois o maior ganho; subir de nível sempre por último; no máximo 3', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 0, lvl: 30 }, true); w.add({ slot: 'armor', e: 1, r: 0, lvl: 30 }, true);
  w.add({ slot: 'weapon', e: 1, r: 2, lvl: 30 }); w.add({ slot: 'armor', e: 1, r: 4, lvl: 30 });
  const all = A.all(w.S, w.host).list; assert.ok(all.length >= 3, 'há candidatos: ' + all.map(a => a.id).join(','));
  for (let i = 1; i < all.length; i++) { const p = all[i - 1], q = all[i];
    if (p.last || q.last) { assert.ok(!p.last || q.last, 'nível por último'); continue; }
    assert.ok(p.ready >= q.ready, 'prontas antes'); if (p.ready === q.ready) assert.ok(p.gain >= q.gain, 'maior ganho antes'); }
  const r = A(w.S, w.host); assert.ok(r.actions.length <= 3);
  assert.strictEqual(all[all.length - 1].kind, 'level'); assert.ok(/falta \d+% da barra/.test(all[all.length - 1].label));
  assert.ok(r.actions.every(a => !('costN' in a) && !('last' in a)), 'campos internos não vazam');
});

t('fora da lista: práticas, torre, baú, compras e invocação (mesmo com o módulo de práticas carregado e com recurso)', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 0, lvl: 30 }, true); PR.ensure(w.S).stones = 1e6;
  const ids = A.all(w.S, w.host).list.map(a => a.id);
  assert.ok(ids.every(id => !/^(practice|tower|chest|instances|summon|shop|buy)/.test(id)), ids.join(','));
  assert.ok(A.all(w.S, w.host).list.every(a => A.DATA.kinds.includes(a.kind)));
});

t('pet e montaria: simulados numa CÓPIA (o save real não muda); ganho = diferença real de FC; sem ganho não aparece', () => {
  const v3 = PET.DATA.v3; PET.DATA.v3 = true; assert.ok(PET.setV17(true)); const mOn = M.DATA.on; M.DATA.on = true;
  try {
    const w = world(); w.add({ slot: 'weapon', e: 1, r: 1, lvl: 30 }, true);
    const pid = PET.DATA.pets[0].id, po = PET.ensure(w.S); po.owned[pid] = { lvl: 60, stars: 1, stg: 0, frags: 0 }; po.eq = pid;
    const mid = M.catalog()[0].id, mo = M.ensure(w.S); mo.owned[mid] = { stars: 1, frags: 3, lvl: 1, gold: 0 }; mo.eq = mid;
    fcNow(w); F.advice(w.S, w.host, 99);   // o jogo já chama isto (o ensure dos módulos arruma o save); daqui em diante nada pode mudar
    const before = JSON.stringify(w.S), list = A.all(w.S, w.host).list; assert.strictEqual(JSON.stringify(w.S), before, 'nada mudou no save');
    assert.ok(PET.canEvolve(w.S, pid).ok, 'o pet pode evoluir');
    // ganho real de evoluir (cópia): hoje o estágio não muda o bônus do pet → 0 FC → a dica não aparece (não mostramos ação sem ganho)
    const c = JSON.parse(before); PET.ensure(c).owned[pid].stg = 1; const evGain = Math.round(F.compute(c, w.host) - fcNow(w));
    const ev = list.find(a => a.id === 'pet.evolve');
    if (evGain >= 1) { assert.ok(ev); assert.strictEqual(ev.gain, evGain); assert.strictEqual(ev.tab, 'pet'); } else { assert.ok(ev, 'no teto do estágio (Nv 60 ≥ 30) a dica aparece'); assert.strictEqual(ev.label, 'Evoluir o pet para liberar mais níveis'); assert.strictEqual(ev.gainText, '', 'sem número'); assert.strictEqual(ev.gain, 0); assert.strictEqual(ev.ready, true); }
    const c2 = JSON.parse(before); M.ensure(c2).owned[mid].stars = 2; const msGain = Math.round(F.compute(c2, w.host) - fcNow(w));
    const ms = list.find(a => a.id === 'mount.star'); assert.ok(msGain >= 1 && ms, 'montaria +1★ dá ' + msGain + ' FC');
    assert.strictEqual(ms.gain, msGain); assert.strictEqual(ms.ready, false); assert.ok(/faltam 7 fragmentos/.test(ms.label), ms.label); assert.strictEqual(ms.tab, 'mount');
    console.log('   (montaria +1★: +' + msGain + ' FC sobre ' + fcNow(w) + '; evoluir o pet: ' + evGain + ' FC)');
  } finally { PET.DATA.v3 = v3; PET.setV17(false); M.DATA.on = mOn; }
});

t('regra do dono: nenhum emoji nem estrela desenhada nos rótulos, custos e ícones (ícone = id para a tela)', () => {
  const w = world(); w.add({ slot: 'weapon', e: 1, r: 0, lvl: 30 }, true); w.add({ slot: 'weapon', e: 1, r: 3, lvl: 30 });
  const bad = /[★☆]|[🀀-🫿☀-➿]/u;
  for (const a of A.all(w.S, w.host).list) { assert.ok(!bad.test(a.label + a.cost + a.icon), a.id + ': ' + a.label); assert.ok(/^[a-z]+$/.test(a.icon), 'ícone ' + a.icon); }
});

t('save vazio/estranho não quebra', () => {
  const w = world(); assert.ok(Array.isArray(A(w.S, w.host).actions)); assert.ok(Array.isArray(A({}, {}).actions)); assert.ok(Array.isArray(A(null, null).actions));
});

t('dica de tela trancada: vai para o fim, no máximo uma, com lockLevel; sem nada aberto, jogue as fases anteriores', () => {
  A.DATA.on = true; const w = world({ lvl: 1 });
  const r = A.all(w.S, w.host).list; const shut = r.filter(a => a.locked); assert.ok(shut.length <= 1, 'no máximo 1 trancada');
  const firstShut = r.findIndex(a => a.locked); if (firstShut >= 0) assert.strictEqual(firstShut, r.length - 1, 'a trancada fica no fim');
  assert.ok(r.length >= 1);
  const w2 = world({ lvl: 1 }); w2.host.unlocked = () => false; const r2 = A.all(w2.S, w2.host).list; assert.strictEqual(r2[0].id, 'farm'); assert.ok(/fases anteriores/.test(r2[0].label));
});

A.DATA.on = false;
console.log(n + ' testes ok');
