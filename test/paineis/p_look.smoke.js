'use strict';
// Teste de fumaça do js/p_look.js (VITRINE DE SKINS) em Node: Sys.appearance REAL. Rodar: node test/paineis/p_look.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'stats', 'skin', 'appearance'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', width: 520, height: 520, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext() { return ctx; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const calls = []; const ctx = { clearRect() { calls.push('clear'); } };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
g.Sys.host = { equipped: () => ({}) }; g.S = { sys: {} }; g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
g.snd = () => {}; g.render = () => def.render(); g.Screens = { close() { g.closed = true; } };
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_look.js'), 'utf8'), { filename: 'p_look.js' });
assert(def && def.render && def.click && def.onClose, 'Panels.add registrou a tela');
const btn = x => ({ dataset: { x } }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
// 1) abre: skin padrão EQUIPADA, espaço "Novas skins em breve", SEM ocultar/modo/cosméticos, sem emoji, só o Voltar como botão
def.onOpen(); def.render(); ['Kael · skin padrão', 'EQUIPADA', 'Novas skins em breve', 'Voltar'].forEach(has);
assert(!/Ocultar|ocultar|Modo|Itens|COSMÉTICOS|Óculos|Máscara|data-x="eye"|data-x="mode"|data-x="cos"/.test(H()), 'sem ocultar/modo/cosméticos'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
const bt = H().match(/<button[^>]*>/g) || []; assert(bt.length === 1 && /data-x="back"/.test(bt[0]), 'só o Voltar, com ação'); out.push('abre: skin padrão equipada + "Novas skins em breve", sem ocultar/modo/cosméticos, só o Voltar');
// 2) sem drawHeroFull: mostra a reserva (Kael parado) e não desenha
assert(H().includes('pl-kid') && /id="pl_cv"[^>]*display:none/.test(H()), 'reserva visível sem drawHeroFull'); out.push('sem drawHeroFull: reserva (Kael parado)');
// 3) com drawHeroFull: o canvas aparece e desenha com a assinatura (ctx, x, y, scale, state); o laço para ao fechar
let hf = []; g.drawHeroFull = (c2, x, y, s, st) => { hf.push([x, y, s, st]); }; def.render(); assert(!/id="pl_cv"[^>]*display:none/.test(H()), 'canvas visível com drawHeroFull'); els.pl_cv = mkEl('pl_cv'); assert(raf.length >= 1, 'agendou o desenho'); raf.shift()(16); assert(hf.length === 1 && hf[0][0] > 0 && hf[0][1] > 0 && hf[0][2] > 0, 'chamou drawHeroFull com x,y,scale'); assert(Math.abs(hf[0][0] - 520 * 0.45) < 1 && Math.abs(hf[0][1] - 520 * 0.93) < 1 && Math.abs(hf[0][2] - 520 * 0.62 / 155) < 0.01, 'unidades do padrão da Arena: x=0,45·w, y(pés)=0,93·h, scale=h·0,62/HS'); assert(typeof hf[0][3] === 'object'); assert(raf.length >= 1, 'laço continua'); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço'); out.push('com drawHeroFull: desenha (ctx,x,y,scale,state) em laço e para ao fechar');
// 4) drawHeroFull que dá erro: cai na reserva, sem quebrar
g.drawHeroFull = () => { throw new Error('boom'); }; def.onOpen(); def.render(); assert(raf.length >= 1, 'agendou (passo 4)'); els.pl_cv.style.display = ''; els.pl_cv.parentNode = {}; raf.shift()(16); assert.strictEqual(els.pl_cv.style.display, 'none', 'erro: esconde o canvas'); out.push('drawHeroFull com erro: cai na reserva');
// 5) herói Kaia
delete g.drawHeroFull; g.S.hero = 'kaia'; def.onOpen(); def.render(); has('Kaia · skin padrão'); has('skin padrão da Kaia'); has('para a Kaia'); g.S.hero = 'kael'; def.render(); has('skin padrão do Kael'); has('para o Kael'); out.push('Kaia: nome do herói certo');
// 6) Voltar fecha
def.click(btn('back')); assert(g.closed); out.push('Voltar fecha a tela');
// 7) sem Sys.appearance a tela ainda abre (não depende dele)
const ap = g.Sys.appearance; delete g.Sys.appearance; def.render(); has('skin padrão'); g.Sys.appearance = ap; out.push('sem Sys.appearance: ainda abre');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
