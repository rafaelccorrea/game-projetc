'use strict';
// Teste de fumaça do js/p_look.js (VITRINE DE SKINS: padrão + skins fixas do herói atual) em Node. Rodar: node test/paineis/p_look.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', width: 440, height: 440, nextElementSibling: { style: {} }, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext() { return ctx; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const ctx = { clearRect() {} }; let cvs = [];
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null, querySelectorAll: () => cvs }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let owned = { kcav: true, kleg: false }, eqId = null; const calls = [];
g.Sys = { host: {}, appearance: { heroOf: S => S.hero === 'kaia' ? 'kaia' : 'kael',
  fixedSkins: () => [{ id: 'kcav', name: 'Kael Cavaleiro', hero: 'kael', owned: owned.kcav, equipped: eqId === 'kcav', how: 'Passe da temporada', bonus: '+2% ATK' }, { id: 'kleg', name: 'Kael Guerreiro Lendário', hero: 'kael', owned: owned.kleg, equipped: eqId === 'kleg', how: 'Evento de lançamento' }, { id: 'acav', name: 'Kaia Cavaleira', hero: 'kaia', owned: true, equipped: false, how: '' }],
  equipFixed: (S, id) => { calls.push(id); eqId = id; return true; } } };
g.S = { sys: {} }; g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
const toasts = []; let changed = 0; g.snd = () => {}; g.toast = t => toasts.push(t); g.statsChanged = () => { changed++; }; g.render = () => def.render(); g.Screens = { close() { g.closed = true; } };
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_look.js'), 'utf8'), { filename: 'p_look.js' });
assert(def && def.render && def.click && def.onClose);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
// 1) abre: padrão EQUIPADA + só as skins fixas do herói atual (Kael), como obter nas não possuídas, Equipar na possuída, sem "Fase", sem ocultar/modo/cosméticos, sem emoji
def.onOpen(); def.render(); ['Kael · skin padrão', 'EQUIPADA', 'Kael Cavaleiro', 'Kael Guerreiro Lendário', 'Evento de lançamento', '+2% ATK', 'Novas skins em breve', 'Voltar'].forEach(has);
assert(!/Kaia Cavaleira/.test(H()), 'só as skins do herói atual'); assert(!/Fase \d|fase do herói/.test(H()), 'sem "Fase n do herói"'); assert(!/Ocultar|Modo|COSMÉTICOS|data-x="eye"|data-x="mode"|data-x="cos"/.test(H())); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
assert((H().match(/class="pl-btn"/g) || []).length === 1, 'Equipar só na possuída'); assert(!/Comprar/.test(H()), 'sem botão de comprar inventado'); out.push('abre: padrão equipada + skins fixas do herói (como obter / Equipar), sem fase/ocultar/modo/cosmético');
const bt = H().match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push(bt.length + ' botões, todos com ação');
// 2) equipar a possuída
def.click(btn('equip', { id: 'kcav' })); assert.deepStrictEqual(calls, ['kcav']); assert(changed >= 1); assert(toasts.some(t => /Equipada: Kael Cavaleiro/.test(t))); assert(/aria-label="Kael Cavaleiro, equipada"/.test(H())); assert(!/aria-label="Kael · skin padrão, equipada"/.test(H())); assert(/data-id="default"/.test(H()), 'padrão ganha Equipar'); out.push('equipar a possuída: equipFixed, aviso, selo muda');
// 3) voltar ao padrão
def.click(btn('equip', { id: 'default' })); assert.strictEqual(calls[calls.length - 1], null); assert(/aria-label="Kael · skin padrão, equipada"/.test(H())); out.push('voltar ao padrão: equipFixed(null)');
// 4) não possuída: explica e não equipa
def.click(btn('equip', { id: 'kleg' })); assert(toasts.some(t => /Evento de lançamento/.test(t))); assert.strictEqual(calls.length, 2); out.push('não possuída: explica como obter, não equipa');
// 5) Kaia
g.S.hero = 'kaia'; def.render(); has('Kaia · skin padrão'); has('Kaia Cavaleira'); assert(!/Kael Cavaleiro/.test(H())); g.S.hero = 'kael'; out.push('Kaia: skin padrão e fixas dela');
// 6) sem a API de skins fixas
const fx = g.Sys.appearance.fixedSkins; delete g.Sys.appearance.fixedSkins; def.render(); has('Kael · skin padrão'); has('Novas skins em breve'); assert(!/class="pl-btn"/.test(H())); def.click(btn('equip', { id: 'kcav' })); assert(toasts.some(t => /ainda não estão disponíveis|não está disponível/.test(t))); g.Sys.appearance.fixedSkins = fx; out.push('sem fixedSkins: só a padrão + em breve');
// 7) desenho
cvs = []; def.render(); assert(H().includes('pl-kid')); let hf = []; g.drawHeroFull = (c, x, y, sc, st) => { hf.push({ x, y, sc, st }); }; def.render(); assert(!/data-plsk="[^"]*"[^>]*display:none/.test(H()), 'canvas visível com drawHeroFull');
cvs = [mkEl('c1'), mkEl('c2')]; cvs[0].dataset.plsk = 'default'; cvs[1].dataset.plsk = 'kcav'; assert(raf.length >= 1); raf.shift()(16); assert.strictEqual(hf.length, 2, 'um desenho por cartão'); assert.deepStrictEqual(hf.map(h => h.st.skin), ['default', 'kcav']); assert(Math.abs(hf[0].x - 440 * 0.45) < 1 && Math.abs(hf[0].y - 440 * 0.93) < 1 && Math.abs(hf[0].sc - 440 * 0.62 / 155) < 0.01, 'unidades da Arena'); assert(raf.length >= 1); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço');
out.push('desenho: um por cartão com state.skin, unidades da Arena, laço para ao fechar');
g.drawHeroFull = () => { throw new Error('boom'); }; def.onOpen(); def.render(); cvs.forEach(c => { c.style.display = ''; }); raf.shift()(16); assert(cvs[0].style.display === 'none', 'erro: cai na reserva'); out.push('drawHeroFull com erro: reserva');
// 7b) FORMATO REAL do módulo (Sistemas): fixedSkins devolve as 4 skins com r, soon, available, how, bonus; a tela filtra por herói, mostra raridade e "Em breve" (sem o preço de proposta), sem "undefined"
{ global.window = global; try { require(path.join(R, 'js/sys/skin.js')); } catch (e) {} const real = require(path.join(R, 'js/sys/appearance.js')); const keepA = g.Sys.appearance; g.Sys.appearance = real; g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }];
  g.S = { sys: {}, look: {} }; def.onOpen(); def.render(); has('Kael Cavaleiro'); has('Kael Guerreiro Lendário'); assert(!/Kaia/.test(H()), 'filtra pelo herói atual (Kael)'); has('Em breve: ainda não dá para obter'); assert(!/proposta|R\$|undefined|null|NaN/.test(H()), 'sem texto de proposta/undefined'); has('Mítico'); has('Lendário'); has('+7% ATK e Vida'); has('+10% ATK e Vida'); assert(!/class="pl-btn"/.test(H()), 'não possui nenhuma: sem Equipar');
  const rr = real.grantFixed(g.S, 'kael_knight', { owner: true }); assert(rr.ok); def.render(); assert((H().match(/class="pl-btn"/g) || []).length === 1, 'possuída ganha Equipar'); def.click(btn('equip', { id: 'kael_knight' })); assert(real.fixedSkins(g.S, {}).find(x => x.id === 'kael_knight').equipped, 'equipou de verdade'); assert(/aria-label="Kael Cavaleiro, equipada"/.test(H())); def.click(btn('equip', { id: 'default' })); assert(!real.fixedSkins(g.S, {}).find(x => x.id === 'kael_knight').equipped, 'voltou ao padrão'); assert(/aria-label="Kael · skin padrão, equipada"/.test(H()));
  g.S.hero = 'kaia'; def.render(); has('Kaia Cavaleira'); has('Kaia Guerreira Lendária'); assert(!/Kael Cavaleiro/.test(H()), 'Kaia: só as dela'); g.S.hero = 'kael'; g.Sys.appearance = keepA; g.S = { sys: {} }; out.push('formato real do Sys.appearance: filtro por herói, raridade, "Em breve", Equipar/voltar ao padrão de verdade'); }
// 8) Voltar
def.click(btn('back')); assert(g.closed); out.push('Voltar fecha');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
