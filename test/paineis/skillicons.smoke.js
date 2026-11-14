'use strict';
// Fumaça em Node do ÍCONE DE RECARGA DA INVESTIDA (js/skillicons.js): chave desligada = nada no DOM; anel e segundos lidos do MountCharge.info().
// Rodar: node test/paineis/skillicons.smoke.js   (SKI_SRC: testar uma cópia antes de gravar no jogo)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), g = globalThis; g.window = g;
let made = 0;
const mkEl = id => { const e = { id: id || '', children: [], style: {}, textContent: '', className: '', parentNode: null, attrs: {}, _h: '',
  setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; } } };
  /* innerHTML de mentira: o HTML do ícone vira a árvore que o arquivo lê (círculo com 3 filhos + rótulo) */
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; if (/ski-s/.test(v)) { const s = mkEl(''); s.className = 'ski-s'; s.children = [mkEl(''), mkEl(''), mkEl('')]; this.children = [s, mkEl('')]; } } });
  return e; };
const head = mkEl('head'), fbw = mkEl('fb_w');
g.document = { head, createElement: () => { made++; return mkEl(''); }, getElementById: id => id === 'fb_w' ? fbw : null };
g.DEBUG = false; g.location = { search: '' }; g.SYS_LIVE = { skillIcons: false };
const INFO = { show: true, cd: 12, left: 12, running: false }; let reads = 0; g.MountCharge = { info: () => { reads++; return INFO; } };

vm.runInThisContext(fs.readFileSync(process.env.SKI_SRC || path.join(R, 'js/skillicons.js'), 'utf8'), { filename: 'skillicons.js' });
const K = g.SkillIcons; assert(K && typeof K.mount === 'function' && typeof K.update === 'function' && typeof K.unmount === 'function');

/* 1. chave desligada: nada no DOM, nem leitura do relógio */
assert.strictEqual(K.on(), false); assert.strictEqual(K.mount(fbw), false); assert.strictEqual(K.update(), false);
assert.strictEqual(made, 0); assert.strictEqual(fbw.children.length, 0); assert.strictEqual(head.children.length, 0); assert.strictEqual(reads, 0);

/* 2. ligada em debug */
g.DEBUG = true; g.location.search = '?debug=1&com=mountCharge,skillIcons'; K.setOn(null); assert.strictEqual(K.on(), true);
assert.strictEqual(K.mount(), true); assert.strictEqual(fbw.children.length, 1); assert.strictEqual(head.children.length, 1); assert.strictEqual(made, 2);
const root = fbw.children[0], slot = root.children[0], ring = slot.children[1], txt = slot.children[2];
assert.strictEqual(root.id, 'ski_root'); assert.strictEqual(root.style.right, K.POS.right + 'px'); assert(/Investida/.test(root.innerHTML)); assert(!/<button/.test(root.innerHTML), 'não é botão');
assert.strictEqual(K.mount(), true); assert.strictEqual(made, 2, 'montar de novo não cria nada');

/* 3. recarga cheia → meio → pronta */
assert.strictEqual(root.style.display, ''); assert.strictEqual(txt.textContent, '12'); assert(/conic-gradient\(rgba\(0,0,0,\.72\) 100%/.test(ring.style.background)); assert.strictEqual(slot.className, 'ski-s');
INFO.left = 5.4; assert.strictEqual(K.update(), true); assert.strictEqual(txt.textContent, '6'); assert(/ 46%/.test(ring.style.background)); assert(/faltam 6 s/.test(slot.attrs['aria-label']));
{ const k = K.peek().k; ring.style.background = 'marca'; INFO.left = 5.5; K.update(); assert.strictEqual(K.peek().k, k); assert.strictEqual(ring.style.background, 'marca', 'sem mudança de passo, não toca no DOM'); }
INFO.left = 0; K.update(); assert.strictEqual(txt.textContent, ''); assert.strictEqual(ring.style.background, 'none'); assert.strictEqual(slot.className, 'ski-s rdy'); assert(/pronta/.test(slot.attrs['aria-label']));
INFO.left = 12; INFO.running = true; K.update(); assert.strictEqual(slot.className, 'ski-s rdy', 'durante a investida o ícone fica aceso'); INFO.running = false; K.update(); assert.strictEqual(txt.textContent, '12');

/* 4. sem o que mostrar (a pé, instância, Investida desligada): some sem sair do DOM; volta sozinho */
INFO.show = false; assert.strictEqual(K.update(), false); assert.strictEqual(root.style.display, 'none'); INFO.show = true; assert.strictEqual(K.update(), true); assert.strictEqual(root.style.display, '');
{ const mc = g.MountCharge; g.MountCharge = undefined; assert.strictEqual(K.update(), false); assert.strictEqual(root.style.display, 'none'); g.MountCharge = { info() { throw new Error('x'); } }; assert.strictEqual(K.update(), false); g.MountCharge = mc; }

/* 5. desmontar */
K.unmount(); assert.strictEqual(fbw.children.length, 0); assert.strictEqual(K.update(), false); assert.strictEqual(K.peek().mounted, false);
console.log('skillicons.smoke: ok');
