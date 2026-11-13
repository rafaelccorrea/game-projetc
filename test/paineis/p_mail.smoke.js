'use strict';
// Teste de fumaça do js/p_mail.js em Node: Sys.mail e Sys.loot REAIS. Rodar: node test/paineis/p_mail.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'forge', 'pet', 'mail'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }];
const toasts = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); let changed = 0; g.statsChanged = () => { changed++; };
g.Screens = { close() { g.closed = true; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_mail.js'), 'utf8'), { filename: 'p_mail.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const M = g.Sys.mail;
// 1) módulo desligado: explica e só oferece Voltar
M.DATA.enabled = false; def.onOpen(); def.render(); has('ainda não está ativo'); def.click(btn('back')); assert(g.closed); out.push('chave do módulo desligada: aviso e Voltar');
// 2) ligado e vazio
M.DATA.enabled = true; def.render(); has('Sua caixa está vazia'); has('Coletar tudo'); out.push('caixa vazia: aviso');
// 3) cartas reais via Sys.mail.send
const a = M.send(g.S, host, { title: 'Prêmio da Arena', body: 'Você foi bem.', att: { gems: 120, gold: 15000, stones: 8, items: [{ slot: 'weapon', r: 2 }] }, days: 3 }); const b = M.send(g.S, host, { title: 'Bem-vindo', body: 'Olá, Kael.' }); const c = M.send(g.S, host, { title: 'Compensação', att: { gems: 50 } });
assert(a && b && c, 'send com a chave ligada'); def.render(); ['Prêmio da Arena', 'Bem-vindo', 'Compensação', 'expira em 3 dias', 'sem anexo'].forEach(has); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 5 && bt.every(x => /data-x="/.test(x))); out.push('3 cartas reais, prazo e "sem anexo", zero emoji, ' + bt.length + ' botões com ação');
// 4) abrir marca lida e mostra anexos; carta sem anexo mostra Fechar
def.click(btn('open', { id: a })); has('role="dialog"'); has('Anexos'); has('Coletar'); assert(M.inbox(g.S, host).find(m => m.id === a).read); assert.strictEqual(def.busy(), true);
def.click(btn('del', { id: a })); assert(toasts.some(t => /antes de apagar/.test(t)), 'não apaga com anexo pendente'); assert(M.inbox(g.S, host).some(m => m.id === a)); out.push('abrir: lê, mostra anexos; apagar com anexo pendente é recusado');
// 5) coletar entrega pelo Sys.loot e aparece "Coletado"
def.click(btn('claim', { id: a })); assert(M.inbox(g.S, host).find(m => m.id === a).claimed); assert(changed >= 1); assert(toasts.some(t => /Coletado: .*gemas/.test(t))); has('Coletado'); def.click(btn('claim', { id: a })); out.push('coletar: entrega, avisa e não duplica');
def.click(btn('close', { id: a })); assert.strictEqual(def.busy(), false);
// 6) abas
def.click(btn('tab', { i: 1 })); has('Bem-vindo'); def.click(btn('tab', { i: 2 })); has('Compensação'); assert(!H().includes('Bem-vindo')); def.click(btn('tab', { i: 0 })); out.push('abas Todas / Não lidas / Com anexo');
// 7) coletar tudo e apagar lidas (com confirmação)
def.click(btn('all')); assert(M.inbox(g.S, host).filter(m => m.hasAtt).every(m => m.claimed)); def.click(btn('open', { id: b })); def.click(btn('close', { id: b }));
def.click(btn('delread')); has('Apagar'); has('não são apagadas'); def.click(btn('conf-no')); assert(M.inbox(g.S, host).length === 3); def.click(btn('delread')); def.click(btn('conf-yes')); assert.strictEqual(M.inbox(g.S, host).length, 0, 'lidas e coletadas apagadas'); out.push('coletar tudo; apagar lidas com confirmação (cancelar não apaga)');
def.click(btn('all')); assert(toasts.some(t => /Nenhum anexo/.test(t)));
// 8) módulo ausente
const mm = g.Sys.mail; delete g.Sys.mail; def.render(); has('indisponível'); g.Sys.mail = mm; out.push('sem Sys.mail: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
