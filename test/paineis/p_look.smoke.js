'use strict';
// Teste de fumaça do js/p_look.js em Node: Sys.appearance REAL + host de teste. Rodar: node test/paineis/p_look.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'stats', 'skin', 'appearance'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
let eqd = { armor: { slot: 'armor', e: 2, r: 2 }, boots: { slot: 'boots', e: 1, r: 1 }, hat: { slot: 'hat', e: 3, r: 3, look: 4 } };
g.Sys.host = { equipped: () => eqd };
g.S = { sys: {} }; g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
g.ERAS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ n: 'Era' + i })); g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }];
const toasts = []; let changed = 0; g.snd = () => {}; g.toast = t => toasts.push(t); g.statsChanged = () => { changed++; }; g.render = () => def.render(); g.Screens = { close() { g.closed = true; } };
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_look.js'), 'utf8'), { filename: 'p_look.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const A = g.Sys.appearance;
// 1) abre: modo Itens, peças reais, cosméticos do módulo, arte de chapéu pela era do VISUAL (look 4), sem emoji, todo botão com ação
def.onOpen(); def.render(); ['Aparência', 'Itens', 'Skin', 'ASA', 'BOTAS', 'COLETE', 'CHAPÉU', 'ÓCULOS', 'MÁSCARA', 'Era2 · Épico', 'Era4 · Mítico', 'hat_era4.png', 'COSMÉTICOS', 'Óculos de proteção', 'Máscara ninja', 'Aparecendo no Kael', 'Nada equipado', 'colar e luvas não aparecem'].forEach(has);
assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); const bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 13 && bt.every(b => /data-x="/.test(b)), 'todo botão com ação: ' + bt.filter(b => !/data-x="/.test(b)).join('|').slice(0, 200)); out.push('abre: peças reais, chapéu pela era do visual, cosméticos do módulo, ' + bt.length + ' botões com ação, zero emoji');
// 2) olho: oculta o chapéu (só visual), some da camada de desenho, atributos intactos (item continua equipado)
const n0 = A.layers(g.S, g.Sys.host).filter(x => x.layer === 'hat').length; assert.strictEqual(n0, 1);
def.click(btn('eye', { k: 'hat' })); assert(A.look(g.S).hidden.hat === true); assert.strictEqual(A.layers(g.S, g.Sys.host).filter(x => x.layer === 'hat').length, 0); assert(changed >= 1); has('Oculta no visual · atributos mantidos'); assert(eqd.hat, 'item continua equipado'); assert(toasts.some(t => /atributos mantidos/.test(t)));
def.click(btn('eye', { k: 'hat' })); assert(!A.look(g.S).hidden.hat); has('Aparecendo no Kael'); out.push('olho: oculta/mostra o chapéu; item continua equipado');
// 3) olho em peça sem item explica e não muda nada
def.click(btn('eye', { k: 'wing' })); assert(toasts.some(t => /Equipe uma peça primeiro/.test(t))); assert(!A.look(g.S).hidden.wing); def.click(btn('eye', { k: 'glasses' })); assert(toasts.some(t => /Equipe um cosmético primeiro/.test(t))); out.push('olho sem peça: explica e não muda');
// 4) cosmético: não possuído explica; possuído equipa/tira; mostra na camada
def.click(btn('cos', { id: 'goggles' })); assert(toasts.some(t => /ainda não dá para obter/.test(t))); assert(!A.look(g.S).cos.eq.glasses);
A.addCosmetic(g.S, 'goggles'); A.addCosmetic(g.S, 'ninja'); def.render(); has('Usar'); def.click(btn('cos', { id: 'goggles' })); assert.strictEqual(A.look(g.S).cos.eq.glasses, 'goggles'); has('Usando'); assert(A.layers(g.S, g.Sys.host).some(x => x.layer === 'glasses' && x.id === 'goggles')); has('goggles.png');
def.click(btn('eye', { k: 'glasses' })); assert(A.look(g.S).hidden.glasses); assert(!A.layers(g.S, g.Sys.host).some(x => x.layer === 'glasses')); def.click(btn('cos', { id: 'goggles' })); assert(!A.look(g.S).cos.eq.glasses); out.push('cosméticos: bloqueado explica; possuído usa/tira; olho oculta');
// 5) modo Skin: sem skin de roupa escolhida o aviso aparece e o módulo cai nas peças; com skin escolhida a camada é a skin completa e as peças somem
def.click(btn('mode', { m: 'skin' })); assert.strictEqual(A.look(g.S).mode, 'skin'); has('Sem skin de roupa escolhida'); assert(A.layers(g.S, g.Sys.host).some(x => x.layer === 'boots'));
g.S.skinEq = { armor: 'a05' }; def.render(); assert(!H().includes('Sem skin de roupa escolhida')); has('Escondida pela skin (modo Skin)'); assert(A.layers(g.S, g.Sys.host).some(x => x.layer === 'skin')); assert(!A.layers(g.S, g.Sys.host).some(x => x.layer === 'boots')); has('Skin completa');
def.click(btn('mode', { m: 'items' })); assert.strictEqual(A.look(g.S).mode, 'items'); assert(A.layers(g.S, g.Sys.host).some(x => x.layer === 'boots')); out.push('modo Itens/Skin: aviso sem skin, camada da skin completa, volta aos itens');
// 6) Voltar e módulo ausente
def.click(btn('back')); assert(g.closed); const ap = g.Sys.appearance; delete g.Sys.appearance; def.render(); has('indisponível'); g.Sys.appearance = ap; out.push('Voltar; sem Sys.appearance: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
