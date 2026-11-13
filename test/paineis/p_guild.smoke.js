'use strict';
// Teste de fumaça do js/p_guild.js em Node: Sys.guild REAL (provider fechado e provider de teste online). Rodar: node test/paineis/p_guild.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'clock', 'guild'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }];
const toasts = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); let changed = 0; g.statsChanged = () => { changed++; };
g.Screens = { close() { g.closed = (g.closed || 0) + 1; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_guild.js'), 'utf8'), { filename: 'p_guild.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const G = g.Sys.guild; const allBtn = () => { const bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 1 && bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); return bt.length; };
const noEmoji = () => assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
// 1) chave desligada: estado + regras reais, sem dado inventado
G.DATA.on = false; g.Sys.level = g.Sys.level || { unlockLevel: () => 32, level: () => 60 }; def.onOpen(); def.render(); has('Guildas: em breve'); has('Como a guilda funciona'); has('Estandartes'); has('Territórios'); has('Torneio do Poder'); has('Regras de troca');
has('até ' + G.DATA.members.max); has('+' + G.DATA.banners.cap.atk + '%'); assert(!/Guardiões|GDT|PRÉVIA|\[QTD\]/.test(H())); noEmoji(); out.push('desligada: estado e regras do módulo, ' + allBtn() + ' botões com ação, zero emoji');
def.click(btn('create')); assert(toasts.some(t => /não foram ligadas/.test(t))); def.click(btn('join')); out.push('criar/procurar explicam o motivo real');
// 2) ligada, servidor fechado: "Em breve: abre com o online"
G.DATA.on = true; def.render(); has('Em breve: abre com o online'); def.click(btn('create')); assert(toasts.some(t => /abre com o online/.test(t))); out.push('ligada com servidor fechado: Em breve');
// 3) nível baixo
const lvl = g.Sys.level; g.Sys.level = { unlockLevel: () => 32, level: () => 5 }; def.render(); has('libera no nível 32'); def.click(btn('create')); assert(toasts.some(t => /nível 32/.test(t))); g.Sys.level = lvl; out.push('nível baixo: avisa o nível');
// 4) servidor online sem guilda
let leaveCalls = 0; G.setProvider({ online: true, status: () => ({ open: true }), leave: () => { leaveCalls++; return { ok: true }; } }); G.ensure(g.S).id = null; def.render(); has('Você ainda não tem guilda'); has('Criar guilda'); noEmoji(); out.push('online sem guilda: criar/procurar');
// 5) em guilda (espelho do servidor)
G.applyServer(g.S, { id: 'g1', name: 'Guardiões do Teste', role: 'leader', level: 4, banners: { atk: 1, hp: 0.5, def: 0, gold: 2, food: 0 }, territories: [{ region: 0, capital: false }], coin: 120, joinedAt: Date.now() - 20 * 864e5 }, host);
def.onOpen(); def.render(); has('Guardiões do Teste'); has('Nível 4'); has('Líder'); has('até ' + G.memberCap(4) + ' membros'); has('120'); has('Check-in'); has('Membros, chat e chefe da semana'); allBtn(); noEmoji();
def.click(btn('checkin')); assert(toasts.some(t => /depende do servidor/.test(t))); def.click(btn('donate')); out.push('em guilda: nome, nível, cargo, vagas, Brasões, ações do servidor dizem em breve');
def.click(btn('tab', { t: 'ban' })); has('Estandartes da guilda'); has('+1%'); has('Teto agora +' + G.bannerCap('atk', 4) + '%'); has('1 território'); def.click(btn('raise', { k: 'atk' })); assert(toasts.some(t => /XP da guilda/.test(t))); allBtn();
G.ensure(g.S).role = 'member'; def.click(btn('raise', { k: 'atk' })); assert(toasts.some(t => /Só o líder e os oficiais/.test(t))); G.ensure(g.S).role = 'leader'; out.push('estandartes: tetos do módulo, território, só líder/oficial');
def.click(btn('tab', { t: 'trade' })); has('Regras de troca'); has('Fazer pedido'); def.click(btn('request')); def.click(btn('tab', { t: 'tour' })); has('Torneio do Poder'); has('300 Brasão'); out.push('troca e torneio: regras e prêmios do módulo');
// 6) sair: confirmação em dois passos, chama o provider, statsChanged
def.click(btn('tab', { t: 'home' })); def.click(btn('leave')); has('Confirmar: sair da guilda'); def.click(btn('leaveno')); has('Sair da guilda'); assert.strictEqual(leaveCalls, 0); def.click(btn('leave')); def.click(btn('leave2'));
assert.strictEqual(leaveCalls, 1); assert(changed >= 1); assert(!G.inGuild(g.S), 'saiu'); has('Você ainda não tem guilda'); out.push('sair: confirma, chama o servidor, atualiza o poder (statsChanged)');
// 7) provider fechado ao sair
G.setProvider(null); G.DATA.on = true; G.applyServer(g.S, { id: 'g2', name: 'X', role: 'member', level: 1, banners: {} }, host); G.setProvider({ online: true, status: () => ({ open: true }) }); def.render(); def.click(btn('leave')); def.click(btn('leave2')); assert(toasts.some(t => /depende do servidor/.test(t))); out.push('sair sem rota no servidor: em breve');
// 8) Voltar e módulo ausente
G.setProvider(null); def.render(); def.click(btn('back')); assert(g.closed >= 1); const gg = g.Sys.guild; delete g.Sys.guild; def.render(); has('indisponível'); g.Sys.guild = gg; out.push('Voltar e sem Sys.guild: ok');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
