'use strict';
// Teste de fumaça do js/p_guide.js em Node: Sys.guide REAL com DATA.on=true, DOM falso. Rodar: node test/paineis/p_guide.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'forge', 'pet', 'guide'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, className: '', _h: '', listeners: {}, parentNode: null, setAttribute() {}, addEventListener(t, f) { this.listeners[t] = f; },
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }, removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const app = mkEl('app'); const els = {}; g.document = { head: mkEl('head'), body: mkEl('body'), createElement: () => mkEl(''), getElementById: id => id === 'app' ? app : els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
let timers = []; g.setTimeout = (f, ms) => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host; g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
const toasts = [], views = []; g.snd = () => {}; g.toast = t => toasts.push(t); let changed = 0; g.statsChanged = () => { changed++; }; g.setView = v => views.push(v); g.kf = v => String(Math.round(v));
g.Screens = { reg: {}, open(k) { g.opened = k; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_guide.js'), 'utf8'), { filename: 'p_guide.js' });
assert(def && def.overlay && typeof def.open === 'function', 'overlay registrado'); assert(window.PGuide && PGuide.mount && PGuide.update && PGuide.destroy);
const G = g.Sys.guide, out = []; const root = () => PGuide.state.root; const H = () => root().innerHTML;
const click = x => root().listeners.click({ target: { closest: () => ({ dataset: { x } }) } });
// 1) chave desligada: nada visível
G.DATA.on = false; PGuide.mount(app); assert.strictEqual(root().style.display, 'none'); assert.strictEqual(H(), ''); assert(app.children.includes(root())); out.push('chave desligada: some inteiro');
// 2) ligada: mostra texto, barra e prêmio; sem emoji
G.DATA.on = true; PGuide.update(); const c = G.current(g.S); assert(c, 'há missão da vez'); assert.strictEqual(root().style.display, 'flex'); assert(H().includes(c.text)); assert(H().includes('0/' + c.max) || H().includes(c.cur + '/' + c.max)); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/\[VALOR\]/.test(H()));
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length === 2 && bt.every(b => /data-x="/.test(b))); out.push('missão da vez: "' + c.text + '", barra e prêmio; botões com ação');
// 3) recolher e expandir
click('collapse'); assert(root().className.includes('mini')); assert(H().includes('Expandir missão guia')); click('expand'); assert(root().className.includes('full')); out.push('recolher e expandir');
// 4) ir: battle não faz nada; gear -> setView; tela registrada abre; sem tela avisa
const goto = G.current(g.S).goto; click('go'); const goVia = { battle: () => views.length === 0 && !g.opened, gear: () => views.includes('gear'), summon: () => views.includes('summon'), shop: () => views.includes('shop') };
assert((goVia[goto] || (() => toasts.some(t => /abre mais adiante/.test(t)) || g.opened === goto))(), 'destino ' + goto); out.push('ir para "' + goto + '" tratado');
// 5) toque em "resgatar" antes de cumprir é recusado
const t0 = toasts.length; click('claim'); assert(toasts.length === t0 + 1 && /ainda não foi cumprida/.test(toasts[toasts.length - 1])); out.push('resgatar antes de cumprir: avisa');
// 6) cumprir e resgatar: Sys.guide.claim, statsChanged, prêmio, avança para a próxima
const before = G.current(g.S).id; for (let i = 0; i < 40 && G.current(g.S) && G.current(g.S).id === before && !G.current(g.S).done; i++) G.onEvent(g.S, G.current(g.S).ev || 'kill', 9999);
const ev = (G.DATA.steps.find(s => s.id === before) || {}).ev; G.onEvent(g.S, ev, 9999); G.onEvent(g.S, ev, 9999); PGuide.update(); const cc = G.current(g.S);
if (cc && cc.id === before && cc.done) { assert(root().className.includes('done')); assert(H().includes('Concluída!')); assert(H().includes('Resgatar')); assert(H().includes('data-x="claim"'));
  click('claim'); assert(changed >= 1, 'statsChanged'); assert(toasts.some(t => /^Recompensa:/.test(t)), 'mostra o prêmio'); assert(H().includes('Recompensa enviada!')); assert(G.list(g.S).find(x => x.id === before).done, 'resgatada no módulo');
  while (timers.length) timers.shift()(); const nx = G.current(g.S); if (nx) { assert(nx.id !== before); PGuide.update(); assert(H().includes(nx.text)); } out.push('missão cumprida: resgata, mostra prêmio e passa para a próxima'); }
else out.push('(missão da vez não pôde ser cumprida por evento neste teste: resgate coberto só pelo caso recusado)');
// 7) overlay: Panels open/close monta e desmonta; fila vazia some
def.close(); assert.strictEqual(PGuide.state.root, null); assert(!app.children.some(x => x.id === 'pgd_root')); assert.strictEqual(def.open({ parent: app }), true); assert(root()); G.DATA.on = false; PGuide.update(); assert.strictEqual(root().style.display, 'none'); G.DATA.on = true; def.close(); out.push('overlay: abrir monta, fechar remove, chave off some');
// 8) módulo ausente
const gg = g.Sys.guide; delete g.Sys.guide; PGuide.mount(app); assert.strictEqual(root().style.display, 'none'); g.Sys.guide = gg; PGuide.destroy(); out.push('sem Sys.guide: some sem erro');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
