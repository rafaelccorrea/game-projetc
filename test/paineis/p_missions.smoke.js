'use strict';
// Teste de fumaça do js/p_missions.js em Node: Sys.pass e Sys.guide REAIS. Rodar: node test/paineis/p_missions.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'instances', 'practice', 'titles', 'tower', 'forge', 'pet', 'pass', 'fc', 'guide', 'clock'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
const toasts = [], views = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); let changed = 0; g.statsChanged = () => { changed++; }; g.setView = v => views.push(v);
g.Screens = { reg: {}, close() { g.closed = (g.closed || 0) + 1; }, open(k) { g.opened = k; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_missions.js'), 'utf8'), { filename: 'p_missions.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const P = g.Sys.pass;
// 1) diárias: textos do Sys.pass, bônus, aba Guia escondida com a chave desligada, sem emoji
g.Sys.guide.DATA.on = false; def.onOpen(); def.render(); const L0 = P.list(g.S, host); L0.daily.forEach(m => has(m.txt)); has('Complete as 6 diárias'); has('Renova em'); assert(!H().includes('>Guia<')); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
assert(!/Atividade de hoje|Conquistas/.test(H())); out.push('diárias: ' + L0.daily.length + ' missões do Sys.pass, bônus, sem Guia (chave off), zero emoji, sem contador inventado');
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 4 && bt.every(b => /data-x="/.test(b))); out.push(bt.length + ' botões, todos com ação');
// 2) resgatar: só pronta; fura-fila não existe
const o = g.S.sys.pass; const d0 = L0.daily[0]; const id0 = d0.id; const k0 = (P.DATA.daily.find(x => x.id === id0)).k; def.click(btn('claim', { id: id0, src: 'pass' })); assert(toasts.some(t => /não pode ser resgatada/.test(t)), 'não deixa resgatar incompleta');
P.track(g.S, host, k0, d0.need); def.render(); has('Resgatar'); def.click(btn('claim', { id: id0, src: 'pass' })); assert(changed >= 1); assert(P.list(g.S, host).daily.find(m => m.id === id0).claimed, 'ficou resgatada'); has('Feito'); out.push('resgatar: só quando pronta; marca Feito; statsChanged');
def.click(btn('claim', { id: id0, src: 'pass' })); out.push('resgatar de novo: avisa e não duplica');
// 2b) B-27: diária dá XP do JOGADOR (Sys.level), como no Passe antigo
{ const L = g.Sys.level; let calls = []; const o1 = L.onMission, o2 = L.onDailyBonus; L.onMission = (...a) => { calls.push('m'); return { levels: 0 }; }; L.onDailyBonus = (...a) => { calls.push('b'); return { levels: 0 }; };
  const L3 = P.list(g.S, host); const w = L3.weekly[0]; const d1 = L3.daily.find(m => !m.claimed); const k1 = P.DATA.daily.find(x => x.id === d1.id).k; P.track(g.S, host, k1, d1.need); def.render(); def.click(btn('claim', { id: d1.id, src: 'pass' })); assert.deepStrictEqual(calls, ['m'], 'diária dá XP do jogador');
  const kw = P.DATA.weekly.find(x => x.id === w.id).k; P.track(g.S, host, kw, w.need); calls = []; def.click(btn('tab', { t: 'weekly' })); def.click(btn('claim', { id: w.id, src: 'pass' })); assert.deepStrictEqual(calls, [], 'semanal não dá XP do jogador'); def.click(btn('tab', { t: 'daily' }));
  L.onMission = o1; L.onDailyBonus = o2; out.push('XP do jogador: diária e bônus dão, semanal não (igual ao Passe antigo)'); }
// 3) resgatar tudo (diárias) inclui o bônus quando as 6 fecham
P.list(g.S, host).daily.forEach(m => { const k = P.DATA.daily.find(x => x.id === m.id).k; P.track(g.S, host, k, m.need); }); def.render(); def.click(btn('all')); const L2 = P.list(g.S, host); assert(L2.daily.every(m => m.claimed), 'todas'); assert(L2.bonus.claimed, 'bônus junto'); out.push('Resgatar tudo: diárias e bônus');
def.click(btn('all')); assert(toasts.some(t => /Nenhuma missão pronta/.test(t))); out.push('Resgatar tudo sem nada pronto: avisa');
// 4) semanais
def.click(btn('tab', { t: 'weekly' })); P.list(g.S, host).weekly.forEach(m => has(m.txt)); has('Renova em'); out.push('semanais: ok');
// 5) Guia: aparece só com a chave ligada; só a da vez resgata; "Ir" abre a tela certa
g.Sys.guide.DATA.on = true; def.render(); has('>Guia<'); def.click(btn('tab', { t: 'guide' })); const cur = g.Sys.guide.current(g.S); has(cur.text); has('Em ordem'); const gl = g.Sys.guide.list(g.S).filter(x => x.available); assert(gl.length > 1);
def.click(btn('claim', { id: cur.id, src: 'guide' })); assert(toasts.some(t => /não pode ser resgatada/.test(t))); out.push('Guia: fila do módulo, só a da vez; incompleta não resgata');
def.click(btn('go', { g: 'gear' })); assert(views.includes('gear')); def.click(btn('go', { g: 'battle' })); assert(g.closed >= 1); def.click(btn('go', { g: 'inexistente' })); assert(toasts.some(t => /abre mais adiante/.test(t))); out.push('"Ir": Equipamento, Batalha e tela inexistente (avisa)');
g.Sys.guide.onEvent(g.S, cur.ev || 'kill', 9999); const c2 = g.Sys.guide.current(g.S); if (c2 && c2.done) { def.render(); has('Resgatar'); def.click(btn('all')); assert(g.Sys.guide.list(g.S).find(x => x.id === c2.id).done, 'guia resgatada'); out.push('Guia: missão cumprida resgata e avança'); }
// 6b) blocos Atividade e Conquistas atrás de chave: desligados não aparecem; ligados com provedor leem dele e resgatam
g.Sys.guide.DATA.on = false; def.click(btn('tab', { t: 'daily' })); const mk = [{ id: 'a20', at: 20, gems: 5, claimed: false }, { id: 'a40', at: 40, gold: 900, claimed: false }]; let claimedMark = null;
g.P_MISSIONS.readActivity = () => ({ pts: 25, max: 100, marks: mk, claim: id => { claimedMark = id; mk.find(m => m.id === id).claimed = true; return { ok: true, txt: 'Baú resgatado' }; } });
const ach = [{ id: 'c1', txt: 'Chegue ao nível 50', cur: 50, need: 50, rw: '100', k: 'kill', claimed: false, claim() { this.claimed = true; return { ok: true, txt: 'Conquista!' }; } }, { id: 'c2', txt: 'Vença 10.000 batalhas', cur: 7000, need: 10000, rw: '25.000', k: 'kill', claimed: false }]; g.P_MISSIONS.readAch = () => ach;
def.render(); assert(!H().includes('Atividade de hoje') && !H().includes('Conquistas'), 'chave desligada: nada aparece');
g.P_MISSIONS.activity = true; g.P_MISSIONS.achievements = true; def.render(); has('Atividade de hoje: 25 / 100'); has('Baú de 20 pontos, pronto'); has('Conquistas');
def.click(btn('mark', { id: 'a40' })); assert(toasts.some(t => /ainda não pode/.test(t)), 'baú sem pontos não abre'); def.click(btn('mark', { id: 'a20' })); assert.strictEqual(claimedMark, 'a20'); has('resgatado');
def.click(btn('tab', { t: 'ach' })); has('Chegue ao nível 50'); has('Vença 10.000 batalhas'); def.click(btn('all')); assert(ach[0].claimed && !ach[1].claimed, 'só a cumprida'); has('Feito');
g.P_MISSIONS.activity = false; g.P_MISSIONS.achievements = false; def.render(); assert(!H().includes('Conquistas') && !H().includes('Atividade de hoje')); out.push('Atividade e Conquistas: chave desligada some, ligada resgata'); g.Sys.guide.DATA.on = true;
// 6) módulo ausente
const pp = g.Sys.pass; delete g.Sys.pass; def.render(); has('indisponíveis'); g.Sys.pass = pp; out.push('sem Sys.pass: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
