'use strict';
// Teste de fumaça do js/p_profile.js em Node: Sys.titles / level / fc / vip REAIS. Rodar: node test/paineis/p_profile.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'stats', 'skin', 'vip', 'practice', 'tower', 'forge', 'pet', 'pass', 'fc', 'titles'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {}; g.S.best = 40; g.S.eraMax = 3;
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.ERAS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ n: 'Era' + i }));
const toasts = []; let changed = 0; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); g.statsChanged = () => { changed++; };
g.Screens = { close() { g.closed = true; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_profile.js'), 'utf8'), { filename: 'p_profile.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const T = g.Sys.titles; T.check(g.S, host);
// 1) cartão e títulos reais; abas sem módulo escondidas; sem emoji
def.onOpen(); def.render(); has('Kael'); has('Nível'); has('FC'); has('Era'); has('Desbravador'); has('Títulos') || 0; assert(!H().includes('Molduras') && !H().includes('Auras') && !H().includes('Asas'), 'abas sem módulo escondidas'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/PROPOSTA|\[VALOR\]|ID 4821/.test(H()));
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 8 && bt.every(b => /data-x="/.test(b))); out.push('cartão, títulos do módulo, abas sem módulo escondidas, zero emoji, ' + bt.length + ' botões com ação');
// 2) equipar título conquistado = setFeatured + statsChanged; bloqueado só dá prévia
const own = T.DATA.titles.find(t => T.isUnlocked(g.S, t.id)), lock = T.DATA.titles.find(t => !T.isUnlocked(g.S, t.id)); assert(own && lock, 'há conquistado e bloqueado');
def.click(btn('equip', { id: own.id })); assert.strictEqual(T.featured(g.S).id, own.id); assert(changed >= 1); has('Equipado'); out.push('equipar título: destaque pelo módulo, statsChanged');
def.click(btn('equip', { id: lock.id })); assert(toasts.some(t => /ainda não conquistou/.test(t))); assert.strictEqual(T.featured(g.S).id, own.id); def.click(btn('pv', { id: lock.id })); has('(prévia)'); has('Em prévia'); assert.strictEqual(T.featured(g.S).id, own.id, 'prévia não equipa'); out.push('bloqueado: só prévia, nada equipado');
// 3) filtros
def.click(btn('tab', { t: 'tit' })); def.click(btn('filter', { f: 'own' })); has(own.name); assert(!H().includes(lock.name)); def.click(btn('filter', { f: 'lock' })); has(lock.name); def.click(btn('filter', { f: 'all' })); out.push('filtros Todos/Possuídos/Bloqueados');
// 4) estatísticas reais e coleção
def.click(btn('tab', { t: 'sta' })); has('Inimigos derrotados'); has('Eras liberadas'); has('Coleção'); has('Títulos'); assert(!/Maior dano|Tempo jogado/.test(H()), 'estatística sem módulo não aparece'); out.push('estatísticas reais e coleção de títulos; sem dado sem módulo');
// 5) blocos atrás de chave: ligados leem do provedor e equipam
let used = null; g.P_PROFILE.readFrames = () => ({ equipped: 'wood', list: [{ id: 'wood', name: 'Madeira', own: true, org: 'Inicial' }, { id: 'rune', name: 'Runas', own: false, how: 'Liberar a Antiguidade' }], equip: id => { used = id; return { ok: true }; } });
g.P_PROFILE.readStats = () => [{ label: 'Tempo jogado', val: '3 h' }];
def.click(btn('tab', { t: 'tit' })); assert(!H().includes('Molduras')); g.P_PROFILE.frames = true; g.P_PROFILE.stats = true; def.render(); has('Molduras'); def.click(btn('tab', { t: 'frm' })); has('Madeira'); has('Bloqueada'); has('Liberar a Antiguidade'); def.click(btn('lookeq', { k: 'frame', id: 'wood' })); assert.strictEqual(used, 'wood');
def.click(btn('tab', { t: 'sta' })); has('Tempo jogado'); g.P_PROFILE.frames = false; g.P_PROFILE.stats = false; def.render(); assert(!H().includes('Molduras') && !H().includes('Tempo jogado')); out.push('molduras e estatísticas de conta: chave desligada some, ligada usa o provedor');
// 6) Voltar e módulo ausente
def.click(btn('back')); assert(g.closed); const tt = g.Sys.titles; delete g.Sys.titles; def.render(); has('indisponível'); g.Sys.titles = tt; out.push('Voltar; sem Sys.titles: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
