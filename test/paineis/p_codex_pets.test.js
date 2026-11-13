'use strict';
// Códex × módulo: os pets da TELA (js/p_codex.js, cdxItems) são os mesmos, na MESMA ordem, do Sys.codex.catalog() (js/sys/codex.js), com os 3 pets novos
// desligados (hoje) e ligados (Sys.newDrops.DATA.on + newReady). E toda imagem de pet da tela existe em disco. Rodar: node test/paineis/p_codex_pets.test.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'stats', 'mount', 'pet', 'newdrops', 'codex'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: () => null };
g.fetch = u => Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(fs.readFileSync(path.join(R, u), 'utf8'))) });
g.ERAS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ n: 'Era' + i, w: ['a', 'b', 'c', 'd', 'e'].map(x => 'Arma' + i + x), a: ['Colete' + i, 'x', 'x', 'x', 'x'] }));
g.RAR = [{ n: 'Básico', c: '#999', m: 1 }, { n: 'Raro', c: '#48f', m: 1.7 }, { n: 'Épico', c: '#b5f', m: 3 }, { n: 'Mítico', c: '#f46', m: 5.5 }, { n: 'Lendário', c: '#fb2', m: 10 }];
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.snd = () => {}; g.toast = () => {}; g.render = () => {}; g.setView = () => {}; g.statsChanged = () => {};
g.Screens = { reg: {}, close() {}, open() {} }; g.Panels = { add(n, d) { return d; }, cur: () => 'codex' };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_codex.js'), 'utf8'), { filename: 'p_codex.js' });
const C = g.Sys.codex, P = g.Sys.pet, N = g.Sys.newDrops; assert(C && typeof C.catalog === 'function' && typeof C.newPets === 'function', 'Sys.codex.catalog/newPets');
const scr = () => cdxItems().filter(x => x.cat === 'pet'), mod = () => C.catalog().filter(x => x.cat === 'pet').map(x => x.id), out = [];
const same = tag => { const a = scr().map(x => x.id), b = mod(); assert.deepStrictEqual(a, b, tag + ': tela ≠ módulo\n tela   ' + a.join(' ') + '\n módulo ' + b.join(' ')); return a.length; };
const n0 = N.DATA.on; N.DATA.on = false; assert.deepStrictEqual(C.newPets(), []); const off = same('entregas desligadas'); assert(!scr().some(x => /p-(lobo|falcao|pantera)-/.test(x.id)), 'pets novos fora da tela'); out.push('entregas desligadas (hoje): ' + off + ' itens de pet, tela = módulo, sem os 3 novos');
N.DATA.on = true; const on = C.newPets(); assert.deepStrictEqual(on, ['lobo', 'falcao', 'pantera'], 'newPets ligado: ' + on); const tot = same('entregas ligadas'); assert.strictEqual(tot, off + 9);
const novo = scr().filter(x => /p-(lobo|falcao|pantera)-/.test(x.id)); assert.strictEqual(novo.length, 9);
for (const x of novo) { assert(x.n && x.attr && /^Golpe: \S/.test(x.attr) && x.how && x.en === '', 'campos de ' + x.id); assert(!/Era-?\d|undefined|NaN/.test(x.n + x.attr + x.how), 'texto de ' + x.id + ': ' + x.how); }
assert(novo.filter(x => /-0$/.test(x.id)).every(x => !/^Ovo da/.test(x.how)), 'origem própria no 1º estágio'); out.push('entregas ligadas: +9 itens (lobo, falcão, pantera × 3 estágios) no fim, na ordem do módulo, com golpe e origem');
P.DATA.newReady.falcon = false; assert.deepStrictEqual(C.newPets(), ['lobo', 'pantera']); same('um pet desligado no Sys.pet'); P.DATA.newReady.falcon = true; out.push('pet desligado no Sys.pet some da tela junto com o módulo');
let miss = 0, seen = 0; for (const x of scr()) { const m = /assets\/pets\/[a-z0-9_]+\.png/.exec(JSON.stringify(x.art)); assert(m, 'arte de ' + x.id); seen++; if (!fs.existsSync(path.join(R, m[0]))) { miss++; console.error('falta ' + m[0]); } }
assert.strictEqual(miss, 0, 'imagens de pet em disco'); out.push(seen + ' imagens de pet do Códex existem em disco');
N.DATA.on = n0; console.log(out.map(t => '- ' + t).join('\n') + '\nCÓDEX × MÓDULO (PETS) OK');
/* MONTARIAS: a Fênix gigante entra no FIM, só quando o Sys.mount a liga (a paridade com o catalog() é conferida no test/sys/codex.test.js, da Sistemas) */
{ const M = g.Sys.mount, mts = () => cdxItems().filter(x => x.cat === 'mnt').map(x => x.id), on = mts();
  assert.strictEqual(on[on.length - 1], 'm-phoenixm', 'Fênix no fim das montarias: ' + on.join(' ')); assert.strictEqual(on.length, 7); const it = cdxItems().find(x => x.id === 'm-phoenixm');
  assert(it && it.n === 'Fênix gigante' && /mount_giant_phoenix_ref\.png/.test(JSON.stringify(it.art)) && it.how === 'VIP 8' && fs.existsSync(path.join(R, 'assets/mounts/mount_giant_phoenix_ref.png')), 'dados da Fênix no Códex');
  const keep = M.DATA.newReady.phoenixm; M.DATA.newReady.phoenixm = false; const off = mts(); M.DATA.newReady.phoenixm = keep;
  assert(off.length === 6 && off.indexOf('m-phoenixm') < 0, 'Fênix desligada no módulo some do Códex: ' + off.join(' ')); assert(!mts().some(id => /raptor|scorpion|mecha/.test(id)), 'montaria nova desligada não aparece');
  console.log('- montarias: Fênix gigante no fim (7) quando ligada no Sys.mount; desligada some (6); as outras novas não aparecem\nCÓDEX: MONTARIAS OK'); }
