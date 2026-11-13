'use strict';
// Teste de fumaça do js/p_chat.js em Node (sem navegador). Rodar: node test/paineis/p_chat.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
g.S = { eraMax: 2 }; g.ERAS = [{ n: 'Pré-História' }, { n: 'Antiguidade' }, { n: 'Medieval' }];
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
const toasts = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render();
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_chat.js'), 'utf8'), { filename: 'p_chat.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
// 1) offline: canais, frases, aviso claro, sem mensagens simuladas, sem campo de texto livre, sem emoji
def.onOpen(); def.render(); ['Mundial', 'Era', 'Guilda', 'Era Medieval' === 'x' ? '' : 'Mundial', 'precisa do servidor online: em breve', 'Sem mensagens: o chat abre junto com o online', 'Bom jogo!', 'GG!', 'Chat livre chega em breve', 'Frases prontas'].forEach(has);
assert(!/<input|<textarea|contenteditable/i.test(H()), 'sem texto livre'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/LunaFerro|Tavinho|Rex_Brasa|Prévia: conta/.test(H()), 'sem jogadores simulados');
const nPh = (H().match(/data-x="send"/g) || []).length; assert.strictEqual(nPh, 20); out.push('offline: 3 canais, 20 frases, aviso do online, sem texto livre, sem jogadores simulados, zero emoji');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push(bt.length + ' botões, todos com ação');
// 2) enviar offline: avisa e não cria mensagem
def.click(btn('send', { i: '0' })); assert(toasts.some(t => /precisa do servidor online: em breve/.test(t))); assert(!/Bom jogo!<\/span><\/button>/.test(H().split('role="log"')[1].split('Frases prontas')[0]), 'nada no log'); out.push('enviar offline: avisa "em breve" e não cria mensagem');
// 3) trocar canal; guilda sem provedor
def.click(btn('tab', { i: '1' })); has('Era Medieval'); def.click(btn('tab', { i: '2' })); has('Você não está em uma guilda'); def.click(btn('tab', { i: '0' })); out.push('canais: Era usa a era do jogador; Guilda explica');
// 4) com provedor online (fake): mensagens reais do provedor, enviar, denunciar, bloquear, recarga
const sent = []; let cd = 0, rep = null, blocked = null, nl = 0; const M = [{ id: 1, who: 'u1', name: 'Fulano', title: 'Novato', vip: false, time: '10:00', text: 'Oi, pessoal!', mine: false }, { id: 2, system: true, text: 'Aviso do sistema' }];
g.P_CHAT = { online: () => true, messages: k => (k === 'w' ? M : []), send: (k, i) => { sent.push([k, i]); cd = 3000; return { ok: true }; }, report: (id, r) => { rep = [id, r]; return { ok: true }; }, block: w => { blocked = w; return { ok: true }; }, mute: () => ({ ok: true }), cooldownMs: () => cd, newLeftMs: () => nl, guild: () => true };
def.render(); has('Fulano'); has('Oi, pessoal!'); has('Aviso do sistema'); assert(!H().includes('precisa do servidor online')); out.push('online: mensagens vêm do provedor, aviso some');
def.click(btn('send', { i: '3' })); assert.deepStrictEqual(sent[0], ['w', 3]); has('Próximo envio em'); def.click(btn('send', { i: '4' })); assert.strictEqual(sent.length, 1, 'durante a espera não envia'); assert(toasts.some(t => /Espere/.test(t))); cd = 0; out.push('online: envia uma frase, respeita a espera');
nl = 600000; def.render(); has('Conta nova só lê na 1ª hora'); def.click(btn('send', { i: '4' })); assert.strictEqual(sent.length, 1); nl = 0;
def.click(btn('pick', { id: '1' })); has('Denunciar'); has('Bloquear'); has('Silenciar'); def.click(btn('rep', { id: '1' })); has('Denunciar Fulano'); has('Nossa equipe confere em até 24 h'); def.click(btn('reason', { i: '1' })); assert.deepStrictEqual(rep, [1, 'Spam']); assert(toasts.some(t => /Denúncia de Fulano enviada/.test(t)));
def.click(btn('pick', { id: '1' })); def.click(btn('block', { who: 'u1' })); assert.strictEqual(blocked, 'u1'); def.click(btn('pick', { id: '2' })); out.push('online: conta nova, denunciar (motivo), bloquear: ok');
// 5) tick não quebra
def.tick(); delete g.P_CHAT; def.render(); has('em breve'); out.push('provedor ausente volta ao aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
