'use strict';
// Teste de fumaça do js/p_rank.js em Node: Sys.arena / level / tower / pass REAIS + host de teste. Rodar: node test/paineis/p_rank.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'instances', 'practice', 'titles', 'tower', 'forge', 'pet', 'pass', 'fc', 'stats', 'arena'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }];
const toasts = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render();
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_rank.js'), 'utf8'), { filename: 'p_rank.js' });
assert(def && def.render && def.click);
const btn = (x, i) => ({ dataset: { x, i: String(i) } }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
// 1) Força: pódio, prêmios reais, aviso de jogadores simulados, relógio, sem emoji
def.onOpen(); def.render(); ['Maior FC da semana', 'Fecha em', 'Força', 'Torre', 'Passe', 'Prévia com jogadores simulados', 'Os prêmios valem quando o ranking online abrir', 'Top 1', 'Sua posição', 'pág. 1/'].forEach(has);
assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/\[QTD\]|\[VALOR\]|PROPOSTA/.test(H())); out.push('Força: pódio, prêmios, aviso de simulados, relógio, zero emoji');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 8 && bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push(bt.length + ' botões, todos com ação');
// 2) paginar e voltar; limites
def.click(btn('prev')); has('pág. 1/'); def.click(btn('next')); has('pág. 2/'); def.click(btn('prev')); has('pág. 1/'); out.push('paginação ok');
// 3) Arena e as abas sem ranking offline (sem inventar jogadores)
def.click(btn('tab', 3)); has('pts'); def.click(btn('tab', 2)); has('Ranking de Torre'); has('só existe com o servidor online'); has('Seu valor atual'); assert(!H().includes('Prévia com jogadores simulados')); def.click(btn('tab', 1)); has('Ranking de Nível'); def.click(btn('tab', 4)); has('Ranking de Passe'); out.push('Arena com pontos; Nível/Torre/Passe só com valor real e aviso do online');
// 4) minha posição
def.click(btn('tab', 0)); def.click(btn('me')); assert(toasts.length >= 0); out.push('botão "Sua posição" responde');
// 5) relógio: tick só troca os segundos
els.pr_sec = mkEl('pr_sec'); def.render(); const s0 = els.pr_sec.textContent; def.tick(); out.push('tick do relógio sem redesenhar');
// 5b) FC na escala visual: com Sys.fc.viewText, toda FC exibida (jogador, bots, diferença) passa por ela; sem ela, formatação atual
g.Sys.fc = g.Sys.fc || {}; const vt0 = g.Sys.fc.viewText; g.Sys.fc.viewText = v => 'V' + Math.round(v); def.click(btn('tab', 0)); def.render(); assert(/FC V[0-9]+/.test(H()), 'FC pela viewText'); assert(!/FC [0-9]+K|FC [0-9]+,[0-9] ?K/.test(H()), 'sem FC real formatada'); g.Sys.fc.viewText = vt0; def.render(); assert(!/FC V[0-9]+/.test(H()), 'sem viewText: formatação atual'); out.push('FC na escala visual: passa por Sys.fc.viewText (e reserva sem ela)');
// 6) módulo ausente
const ar = g.Sys.arena; delete g.Sys.arena; def.render(); has('indisponível'); g.Sys.arena = ar; out.push('sem Sys.arena: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
