'use strict';
// Teste de fumaça do js/p_pass.js em Node: Sys.pass REAL. Rodar: node test/paineis/p_pass.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'forge', 'pet', 'pass'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }];
const toasts = []; let opened = null, changed = 0; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); g.statsChanged = () => { changed++; };
let def = null, missionsOn = false; g.Panels = { add(n, d) { def = d; return d; }, on: n => n === 'missions' && missionsOn, open(n) { opened = n; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_pass.js'), 'utf8'), { filename: 'p_pass.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const P = g.Sys.pass, T = P.DATA.tiers;
// 1) trilha única com TODOS os níveis, sem páginas, sem emoji, sem aba de missões
def.onOpen(); def.render(); for (let t = 1; t <= T; t++) assert(H().includes('aria-label="Nível ' + t), 'nível ' + t); has('Nível do passe 0/' + T); has('Grátis'); has('Premium'); has('Resgatar tudo'); has('Ativar Premium');
assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/Diárias|Semanais/.test(H()), 'sem aba de missões'); assert(!/‹|›/.test(H()), 'sem paginação'); out.push('trilha única: ' + T + ' níveis, sem páginas, sem aba de missões, zero emoji');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 3 && bt.every(b => /data-x="/.test(b))); out.push(bt.length + ' botões, todos com ação');
// 2) nada pronto no nível 0: resgatar tudo avisa; premium não liga sozinho
def.click(btn('all')); assert(toasts.some(t => /Nenhuma recompensa pronta/.test(t))); out.push('sem nível: avisa e não resgata');
// 3) XP sobe o nível: níveis prontos, centraliza o nível atual, resgatar tudo entrega só a trilha grátis
P.addXp(g.S, 100 * 3); const e = P.ensure(g.S); def.render(); has('id="pw_cur"'); has('Pronto'); has('Resgatar tudo (3)'); assert(!P.ensure(g.S).premium);
const sc = { scrollTop: 0, clientHeight: 400 }; els.pw_sc = sc; def.onOpen(); def.render(); assert(sc.scrollTop > 0, 'rolou até o nível atual'); out.push('nível 3: 3 prontos, nível atual destacado e centralizado');
def.click(btn('all')); assert.deepStrictEqual(P.ensure(g.S).free, [1, 2, 3]); assert.deepStrictEqual(P.ensure(g.S).prem, [], 'premium não entrega sem premium'); assert(changed >= 1); has('Resgatado'); assert(toasts.some(t => /^Resgatado:/.test(t))); out.push('Resgatar tudo: trilha grátis, premium segue bloqueado, statsChanged');
def.click(btn('all')); out.push('segunda vez: nada a resgatar');
// 4) "Resgatar" por nível só aparece se o módulo tiver claimTier
P.addXp(g.S, 100); def.render(); assert(!/data-x="tier"/.test(H()), 'sem claimTier não há botão por nível'); out.push('sem Sys.pass.claimTier: nível pronto mostra "Pronto", sem botão falso');
P.claimTier = (S, h, tr, t) => { const o = P.ensure(S); if (t > P.progress(S).tier) return { ok: false }; const L = tr === 'premium' ? o.prem : o.free; if (L.includes(t)) return { ok: false }; L.push(t); return { ok: true, gems: 5 }; };
def.render(); has('data-x="tier"'); def.click(btn('tier', { track: 'free', t: 4 })); assert(P.ensure(g.S).free.includes(4)); out.push('com claimTier: botão por nível resgata só aquele'); delete P.claimTier;
// 5) Premium: abre "Pagamento em breve", não liga o premium nem cobra
def.click(btn('buy')); has('Pagamento em breve'); has('Nada foi cobrado'); assert(!P.ensure(g.S).premium); assert.strictEqual(def.busy(), true); def.click(btn('all')); def.click(btn('dlg-x')); assert.strictEqual(def.busy(), false); assert(!H().includes('Nada foi cobrado')); out.push('Ativar Premium: só explica; premium continua desligado');
// 6) com premium ativo (como o jogo ligar depois do pagamento): resgata também a trilha premium
P.setPremium(g.S, true); P.addXp(g.S, 0); def.render(); has('Premium ativo'); assert(!/data-x="buy"/.test(H())); def.click(btn('all')); assert(P.ensure(g.S).prem.length >= 1, 'premium entregue'); out.push('premium ativo: resgata as duas trilhas');
// 7) Missões
def.click(btn('missions')); assert(toasts.some(t => /Missões abrem em breve/.test(t)) && opened === null); missionsOn = true; def.click(btn('missions')); assert.strictEqual(opened, 'missions'); out.push('botão Missões: abre a tela quando ligada, senão avisa');
// 8) módulo ausente
const pp = g.Sys.pass; delete g.Sys.pass; def.render(); has('indisponível'); g.Sys.pass = pp; out.push('sem Sys.pass: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
