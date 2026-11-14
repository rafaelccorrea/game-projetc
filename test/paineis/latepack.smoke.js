/* js/latepack.js: imagem do pacote 'ui:late' que falha. Sem navegador: documento de mentira.
   node test/paineis/latepack.smoke.js [caminho de outro latepack.js] */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(process.argv[2] ? path.resolve(process.argv[2]) : path.join(__dirname, '../../js/latepack.js'), 'utf8');
let handler = null; const state = { ready: false, dir: '' };
const classify = p => /^assets\/(pets\/(?!era0_mammoth_|pet_egg\.)|mentors\/)/.test(p) ? 'ui:late' : 'core';
const win = { Sys: { assets: { classify, isReady: p => classify(p) !== 'ui:late' || state.ready, url: p => (classify(p) === 'ui:late' && state.dir ? state.dir + p : p) } } };
const ctx = { window: win, document: { addEventListener: (t, fn, cap) => { if (t === 'error' && cap === true) handler = fn; } }, setInterval: () => 1, clearInterval: () => {}, Set, Array, String };
vm.createContext(ctx); vm.runInContext(src, ctx);
const LP = win.LatePack; assert.ok(LP && typeof handler === 'function', 'registra o tratador de erro na captura');
const img = (s, inline) => { const at = { src: s }; if (inline) at.onerror = 'x()'; return { tagName: 'IMG', dataset: {}, style: {}, isConnected: true, getAttribute: k => at[k] == null ? null : at[k], get src() { return at.src; }, set src(v) { at.src = v; } }; };
const ev = im => { const e = { target: im, stopped: false, stopPropagation() { this.stopped = true; } }; handler(e); return e; };
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok - ' + name); };

t('caminho relativo e classificação', () => { assert.strictEqual(LP.rel('https://localhost/assets/pets/era2_dragon_ref.png?v=1'), 'assets/pets/era2_dragon_ref.png');
  assert.strictEqual(LP.rel('data:image/png;base64,AAAA'), null); assert.strictEqual(LP.late('assets/pets/era2_dragon_ref.png'), true);
  assert.strictEqual(LP.late('assets/pets/era0_mammoth_ref.png'), false, 'o pet inicial fica na base'); });
t('arte da base que falha: não é com este arquivo', () => { const im = img('assets/icons/menu/x.png'), e = ev(im); assert.strictEqual(e.stopped, false); assert.strictEqual(im.style.visibility, undefined); assert.strictEqual(LP.waiting(), 0); });
t('pacote não chegou, imagem SEM reserva: some e fica na espera', () => { const im = img('assets/mentors/m3.png'), e = ev(im);
  assert.strictEqual(e.stopped, false); assert.strictEqual(im.style.visibility, 'hidden'); assert.strictEqual(LP.waiting(), 1);
  state.ready = true; state.dir = 'pad/inicio/'; LP.tick();
  assert.strictEqual(im.src, 'pad/inicio/assets/mentors/m3.png', 'ao chegar, troca o endereço sozinha'); assert.strictEqual(im.style.visibility, '', 'e volta a aparecer'); assert.strictEqual(LP.waiting(), 0);
  state.ready = false; state.dir = ''; });
t('pacote não chegou, imagem COM reserva própria: a reserva da tela age (não esconde, não segura o evento)', () => { const im = img('assets/pets/era2_dragon_ref.png', true), e = ev(im);
  assert.strictEqual(e.stopped, false); assert.strictEqual(im.style.visibility, undefined); });
t('pacote chegou em outra pasta: troca uma vez e segura a reserva da tela', () => { state.ready = true; state.dir = 'pad/inicio/'; const im = img('assets/pets/era2_dragon_ref.png', true), e = ev(im);
  assert.strictEqual(e.stopped, true); assert.strictEqual(im.src, 'pad/inicio/assets/pets/era2_dragon_ref.png');
  const e2 = ev(im); assert.strictEqual(e2.stopped, false, 'se falhar de novo já no endereço do pacote, não entra em laço'); assert.strictEqual(im.src, 'pad/inicio/assets/pets/era2_dragon_ref.png'); });
t('tudo dentro do app (pacote pronto no mesmo caminho): nada a fazer', () => { state.ready = true; state.dir = ''; const im = img('assets/mentors/m1.png'), e = ev(im); assert.strictEqual(e.stopped, false); assert.strictEqual(im.src, 'assets/mentors/m1.png'); });
t('versão de loja: o pacote chega no MESMO endereço (o app intercepta): a imagem que esperava é pedida de novo, uma vez, e volta a aparecer', () => { state.ready = false; state.dir = ''; const im = img('assets/mentors/m7.png'), w0 = LP.waiting(); ev(im);
  assert.strictEqual(im.style.visibility, 'hidden'); assert.strictEqual(LP.waiting(), w0 + 1);
  state.ready = true; LP.tick(); assert.strictEqual(im.src, 'assets/mentors/m7.png?lp=1'); assert.strictEqual(im.style.visibility, ''); assert.strictEqual(LP.waiting(), 0, 'ninguém mais na espera');
  const e2 = ev(im); assert.strictEqual(e2.stopped, false); assert.strictEqual(im.src, 'assets/mentors/m7.png?lp=1', 'se falhar de novo, não entra em laço'); assert.strictEqual(LP.waiting(), 0); state.ready = false; });
console.log(n + ' testes ok');
