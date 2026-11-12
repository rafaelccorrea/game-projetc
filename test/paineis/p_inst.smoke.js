'use strict';
// Teste de fumaça do js/p_inst.js em Node: Sys.instances REAL + host de teste. Rodar: node test/paineis/p_inst.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'instances', 'practice', 'titles', 'tower', 'forge', 'pet', 'pass', 'fc'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, className: '', _h: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.Sys.level = { isUnlocked: () => true, unlockLevel: () => 14, level: () => 60 };
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.ERAS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ n: 'Era' + i })); g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }];
const snds = [], toasts = []; g.snd = n => snds.push(n); g.toast = t => toasts.push(t); let changed = 0; g.render = () => def.render(); g.statsChanged = () => { changed++; };
g.Screens = { close() { g.closed = true; } }; let def = null, opened = 0; g.Panels = { add(n, d) { def = d; return d; }, open() { opened++; def.render(); } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_inst.js'), 'utf8'), { filename: 'p_inst.js' });
assert(def && def.render && def.click);
const btn = (x, t) => ({ dataset: { x, t } }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const I = g.Sys.instances; I.refresh(g.S, host);
// 1) quatro áreas, entradas, renovação, sem emoji
def.onOpen(); def.render(); ['Mina de Ouro', 'Arsenal', 'Chefe de Era', 'Caverna de Cristal', 'Entradas hoje:', 'Renova em'].forEach(has);
assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/\[VALOR\]|PROPOSTA/.test(H())); out.push('4 áreas, entradas e renovação, zero emoji');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 12 && bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push(bt.length + ' botões, todos com ação');
// 2) seletor muda nível
const sel0 = g.PInst.state.sel.gold; assert(sel0 > 0); def.click(btn('prev', 'gold')); assert.strictEqual(g.PInst.state.sel.gold, sel0 - 1); def.click(btn('next', 'gold')); assert.strictEqual(g.PInst.state.sel.gold, sel0); out.push('seletor ok');
// 3) Entrar sem a batalha ligada: explica e NÃO abre entrada
const k0 = I.status(g.S, host).keys.gear; def.click(btn('go', 'gear')); assert(toasts.some(t => /não está ligada/.test(t))); assert.strictEqual(I.ensure(g.S).active, null, 'não abriu entrada'); assert.strictEqual(I.status(g.S, host).keys.gear, k0); out.push('sem batalha ligada: explica, não abre entrada');
// 4) Entrar com a batalha ligada: start + startInstanceRun(run)
let got = null; g.startInstanceRun = r => { got = r; }; def.click(btn('go', 'gear')); assert(got && got.type === 'gear' && got.id, 'entregou a definição'); assert(I.ensure(g.S).active, 'entrada aberta'); I.abort(g.S); delete g.startInstanceRun; out.push('com a batalha ligada: entrega a run');
// 5) Varrer: só depois de vencer; depois mostra o painel e gasta 1 entrada
const o = I.ensure(g.S); const L = g.PInst.state.sel.gold; o.best.gold = L; o.bestKills['gold@' + L] = 30; def.render(); has('vencido'); has('Varrer');
const k1 = I.status(g.S, host).keys.gold; def.click(btn('sweep', 'gold')); assert.strictEqual(I.status(g.S, host).keys.gold, k1 - 1); assert(changed >= 1); has('Varrido!'); has('Coletar'); assert.strictEqual(def.busy(), true);
def.click(btn('sweep', 'gold')); assert.strictEqual(I.status(g.S, host).keys.gold, k1 - 1, 'com o painel aberto o toque não vale'); def.click(btn('ok')); assert(!H().includes('Varrido!')); assert.strictEqual(def.busy(), false); out.push('varrer: gasta 1, mostra o prêmio, Coletar fecha');
// 6) sem entradas
o.keys.gold = 0; def.render(); const kk = o.keys.gold; def.click(btn('sweep', 'gold')); assert(toasts.some(t => /Sem entradas/.test(t))); assert.strictEqual(o.keys.gold, kk); def.click(btn('go', 'gold')); out.push('sem entradas: explica, não gasta');
// 7) nível bloqueado (fase) explica
host.stage = () => 1; host.best = () => 1; def.render(); has('Libera na fase'); out.push('nível fechado: mostra a fase que libera');
// 8) resultado vindo da batalha
g.PInst.showResult({ ok: true, win: true, type: 'boss', level: 0, reward: { gold: 100, gems: 0, items: [{ slot: 'weapon', r: 2, e: 0 }], forge: 3, food: 5, essence: 1, egg: 2, hatched: {} }, keys: 1 }); has('Vitória!'); has('Arma Épico'); has('Ganhou um ovo'); assert(opened >= 1); def.click(btn('ok'));
g.PInst.showResult({ ok: true, win: false, type: 'gold', level: 0 }); has('Não foi dessa vez'); has('não foi gasta'); def.click(btn('ok')); out.push('resultado da batalha (vitória e derrota): ok');
// 9) bloqueio por nível, Voltar, módulo ausente
const lv = g.Sys.level; g.Sys.level = { isUnlocked: () => false, unlockLevel: () => 14 }; def.render(); has('Libera no nível 14'); def.click(btn('back')); assert(g.closed); g.Sys.level = lv;
const ii = g.Sys.instances; delete g.Sys.instances; def.render(); has('indisponíveis'); g.Sys.instances = ii; out.push('bloqueio por nível, Voltar, módulo ausente: ok');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
