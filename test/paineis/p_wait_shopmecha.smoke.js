'use strict';
// Fumaça do js/p_wait.js (invólucro do pré-carregador) e do js/p_shopmecha.js (cartão do Mecha). Rodar: node test/paineis/p_wait_shopmecha.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.document = { head: { appendChild() {} }, getElementById: () => null, createElement: () => ({}) };
g.V = { innerHTML: '' }; let renders = 0; g.render = () => { renders++; };
const toasts = []; g.toast = t => toasts.push(t); g.snd = () => {}; g.statsChanged = () => {}; g.S = { sys: {} };
const load = f => vm.runInThisContext(fs.readFileSync(path.join(R, 'js', f), 'utf8'), { filename: f });
load('p_wait.js'); load('p_shopmecha.js');
const out = []; const tick = () => new Promise(r => setTimeout(r, 5));
(async () => {
  // 1) tudo pronto: a tela segue
  g.Preload = { has: u => true, ready: async () => ({ ok: true, failed: [] }) };
  assert.strictEqual(pGate(['a.png', 'b.png']), false); out.push('imagens prontas: a tela segue (pGate false)');
  // 2) carregando: esqueleto, depois render() sozinho
  let pend; g.Preload = { has: () => false, ready: u => new Promise(r => { pend = () => r({ ok: true, failed: [] }); }) };
  renders = 0; assert.strictEqual(pGate(['c.png']), true); assert(/role="status"/.test(V.innerHTML) && /Carregando/.test(V.innerHTML)); assert.strictEqual(pGate(['c.png']), true, 'segunda chamada não reinicia'); pend(); await tick(); assert.strictEqual(renders, 1, 'render uma vez ao terminar'); assert.strictEqual(pGate(['c.png']), false, 'depois de pronto segue'); out.push('carregando: esqueleto, render sozinho, sem reiniciar');
  // 3) falha: Tentar de novo / Continuar assim
  g.Preload = { has: () => false, ready: async () => ({ ok: false, failed: ['d.png'] }) }; renders = 0; V.innerHTML = '';
  assert.strictEqual(pGate(['d.png']), true); await tick(); assert(/Tentar de novo/.test(V.innerHTML) && /Continuar assim/.test(V.innerHTML) && /data-x="pw-retry"/.test(V.innerHTML) && /data-x="pw-go"/.test(V.innerHTML), 'falha mostra as duas ações');
  assert.strictEqual(pGate(['d.png']), true, 'continua no aviso de falha'); assert(/Tentar de novo/.test(V.innerHTML));
  assert.strictEqual(pWaitClick({ dataset: { x: 'pw-retry' } }), true); assert.strictEqual(renders, 1); await tick();
  assert.strictEqual(pGate(['d.png']), true); await tick(); assert.strictEqual(pWaitClick({ dataset: { x: 'pw-go' } }), true); assert.strictEqual(renders, 2); out.push('falha: Tentar de novo e Continuar assim, ambos com ação');
  assert.strictEqual(pWaitClick({ dataset: { x: 'outro' } }), false); assert(!/\p{Extended_Pictographic}/u.test(V.innerHTML), 'sem emoji');
  // 4) sem Preload: carregador próprio com a mesma semântica
  delete g.Preload; g.Image = class { set src(u) { this._u = u; } decode() { return /ruim/.test(this._u) ? Promise.reject(new Error('x')) : Promise.resolve(); } };
  assert.strictEqual(pGate(['ok1.png', 'ok2.png']), true); await tick(); await tick(); assert.strictEqual(pGate(['ok1.png', 'ok2.png']), false, 'próprio: pronto depois do decode'); out.push('sem Preload: carregador próprio (Image+decode)');
  g.Image = class { set src(u) { this._u = u; } decode() { return Promise.reject(new Error('x')); } }; V.innerHTML = ''; assert.strictEqual(pGate(['ruim.png']), true); await tick(); await tick(); assert(/Tentar de novo/.test(V.innerHTML)); out.push('sem Preload: falha vira Tentar de novo');
  // 5) pWait em elemento + tempo-limite
  const el = { innerHTML: '' }; let got = null; g.Preload = { has: () => false, ready: async (u, o) => { assert(o.timeout === 1234, 'timeout repassado'); return { ok: true, failed: [] }; } };
  assert.strictEqual(pWait(el, ['e.png'], { timeout: 1234, onReady: r => { got = r; } }), true); await tick(); assert(got && got.ok, 'onReady chamado'); out.push('pWait em elemento: onReady e timeout repassado');
  // 6) cartão do Mecha: chave desligada = não existe
  g.PANEL_ON = { shopmecha: false }; const prod = { id: 'mount_mecha', kind: 'mount', name: 'Mecha de Guerra', brl: 49.90, mountId: 'mecha', once: true }; let ready = false, owned = {}; const bought = [];
  g.Sys = { buy: { product: id => id === 'mount_mecha' ? prod : null, ready: () => ready, priceText: () => 'R$ 49,90', purchase: async (S, h, id) => { bought.push(id); return { ok: true }; } }, mount: { DATA: { mounts: [{ id: 'mecha', name: 'Mecha de guerra', r: 4 }] }, ensure: () => ({ owned }) }, host: {} };
  g.RAR = [0, 1, 2, 3, { n: 'Lendário' }].map(x => x || { n: 'x' });
  assert.strictEqual(shMechaCard(), null); out.push('chave desligada: o cartão não existe');
  g.PANEL_ON.shopmecha = true; let c = shMechaCard(); assert(c && c.html.includes('Mecha de Guerra') && c.html.includes('Lendário')); assert(!/R\$|49/.test(c.html), 'sem preço quando a compra não está ligada'); assert(c.html.includes('Em breve') && c.html.includes('data-x="shm-buy"')); assert(!/\p{Extended_Pictographic}/u.test(c.html));
  c.click({ dataset: { x: 'shm-buy' } }); assert(toasts.includes('Pagamento em breve')); assert.strictEqual(bought.length, 0); out.push('compra desligada: "Em breve", sem preço, aviso "Pagamento em breve", nada comprado');
  ready = true; c = shMechaCard(); assert(c.html.includes('R$ 49,90') && !c.html.includes('Em breve>')); c.click({ dataset: { x: 'shm-buy' } }); await tick(); assert.deepStrictEqual(bought, ['mount_mecha']); assert(toasts.includes('Mecha de Guerra é sua!')); out.push('compra ligada: preço de Sys.buy.priceText e compra pelo Sys.buy');
  owned.mecha = { stars: 1 }; c = shMechaCard(); assert(c.html.includes('Você tem') && !/data-x="shm-buy"/.test(c.html)); assert.strictEqual(c.click({ dataset: { x: 'outro' } }), false); out.push('já tem: "Você tem", sem botão');
  g.Sys.buy.product = () => null; assert.strictEqual(shMechaCard(), null); out.push('sem produto: sem cartão');
  console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
