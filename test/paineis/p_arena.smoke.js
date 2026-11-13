'use strict';
// Teste de fumaça do js/p_arena.js em Node: Sys.arena / tower / fc REAIS + host de teste, SEM o motor de desenho (drawHeroFull, sheetLoad…):
// a luta PvP (Tela 23, chave window.PA_PVP2) tem de abrir, seguir o duel.log na ordem e fechar no resultado mesmo sem canvas. Rodar: node test/paineis/p_arena.smoke.js
// (o desenho de verdade, com a ordem dos sprites e o espelho, é conferido em test/e2e/arena_pvp.js)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'instances', 'practice', 'titles', 'tower', 'forge', 'pet', 'pass', 'fc', 'stats', 'arena'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', className: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
let dims = { Wb: 390, H: 656 };
g.V = { innerHTML: '' }; g.xDims = () => dims; g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.view = 'arena';
const toasts = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); g.save = () => {};
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_arena.js'), 'utf8'), { filename: 'p_arena.js' });
assert(def && def.render && def.click);
const X = c => vm.runInThisContext(c); const H = () => g.V.innerHTML; const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const out = [];
const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
assert.strictEqual(g.PA_PVP2, true, 'a chave da luta nova nasce ligada');
// 1) lobby e abertura VS
def.onOpen(); def.render(); assert(/data-x="fight"/.test(H()), 'lobby sem LUTE!');
const A = g.Sys.arena, o0 = A.ensure(g.S, host), left0 = o0.attemptsLeft, lp0 = o0.lp, gold0 = g.S.gold, gems0 = g.S.gems;
def.click(btn('fight')); let pv = X('XA2.pv'); assert(pv && X('XA2.view') === 'fight' && pv.phase === 'vs', 'a luta nova não abriu');
assert(/pv-ovl pv-vs/.test(H()) && (H().match(/class="pv-bigav"/g) || []).length === 2, 'abertura VS sem os dois retratos'); assert(!/undefined|NaN|\[object/.test(H()), 'undefined/NaN no VS');
assert(def.busy() === true, 'busy() durante a luta'); assert.strictEqual(A.ensure(g.S, host).attemptsLeft, left0 - 1); out.push('LUTE! abre no VS, gasta 1 tentativa');
// 2) o registro é o do módulo e é consumido na ordem
const log = pv.r.duel.log; assert(log.length > 0 && pv.log.length === log.length && pv.log.every((e, i) => e === log[i]), 'registro diferente do duel.log');
for (let i = 0; i < 200 && pv.phase === 'vs'; i++) X('paPvStep(0.05)'); assert.strictEqual(pv.phase, 'run', 'o VS não terminou (sem motor de desenho ele sai pelo tempo)');
let guard = 0, okOrder = true, okHp = true; while (pv.phase !== 'result' && guard++ < 8000) { X('paPvStep(0.05)'); X('paPvDraw()'); if (!pv.used.every((v, i) => v === i)) okOrder = false;
  let h0 = pv.max[0], h1 = pv.max[1]; for (const k of pv.used) { const e = log[k]; if (e.s === 0) h1 = e.hp; else h0 = e.hp; } if (!near(h0, pv.hp[0]) || !near(h1, pv.hp[1])) okHp = false; }
assert(pv.phase === 'result' && X('XA2.view') === 'result', 'não chegou ao resultado'); assert(okOrder && pv.used.length === log.length, 'registro fora de ordem ou incompleto'); assert(okHp, 'vida diferente do registro em algum passo');
const d = pv.r.duel; assert(near(pv.hp[0], d.hpLeftA) && near(pv.hp[1], d.hpLeftB), 'vida final diferente do duelo');
const sum = s => log.filter(e => e.s === s).reduce((v, e) => v + e.dmg, 0); assert(near(pv.dmg[0], sum(0)) && near(pv.dmg[1], sum(1)), 'dano somado diferente do registro');
assert(new RegExp(pv.r.win ? '>VITÓRIA<' : '>DERROTA<').test(H()), 'título diferente do vencedor do módulo'); out.push('luta assistida: ' + log.length + ' golpes na ordem, vida final e vencedor do módulo (' + (pv.r.win ? 'vitória' : 'derrota') + ')');
// 3) resultado: só o que o módulo creditou
const o1 = A.ensure(g.S, host); assert.strictEqual(o1.lp, Math.max(0, lp0 + pv.r.delta)); assert(H().includes('>' + (pv.r.delta >= 0 ? '+' : '−') + Math.abs(pv.r.delta) + ' pontos<'), 'delta fora da tela');
assert(g.S.gold === gold0 && g.S.gems === gems0, 'a luta mexeu em moedas/gemas'); assert(/class="pv-note">Prêmio da liga [^<]* ao fechar a semana/.test(H()), 'faltou a linha do prêmio da liga'); assert(!/Prêmio desta luta/.test(H()) && !/class="pv-rw"/.test(H()) && !/>moedas<|>gemas<|>baús?</.test(H()), 'caixa de prêmio sem r.rewards');
{ const bx = () => (H().match(/<small>(moedas|gemas|baús?)<\/small>/g) || []).map(x => x.replace(/<\/?small>/g, '')).join(','), rw = v => { pv.r.rewards = v; def.render(); const b = bx(), h = H(); delete pv.r.rewards; return [b, h]; };
  let q = rw({ gold: 18400 }); assert(q[0] === 'moedas' && q[1].includes('<b>+18400</b>') && /Prêmio desta luta/.test(q[1]), 'r.rewards só moedas: ' + q[0]);
  q = rw({ gold: 900, gems: 12, chest: 1 }); assert(q[0] === 'moedas,gemas,baú' && q[1].includes('<b>+12</b>') && q[1].includes('<b>+1</b>'), 'r.rewards completo: ' + q[0]);
  q = rw({ gold: 900, gems: 0, chest: 0 }); assert(q[0] === 'moedas', 'gemas/baú zero não têm caixa: ' + q[0]); q = rw({}); assert(q[0] === '' && !/class="pv-rw"/.test(q[1]) && !/undefined|NaN/.test(q[1])); def.render(); }
{ const b = pv.F[1].look, a = pv.F[0].look; assert(!a.mount && !a.pet && !a.wing && !b.mount && !b.pet && !b.wing && !b.aura, 'robô mais equipado que o jogador');
  const k = X('paPvOppLook({id:"z",skin:{weapon:"w01"},look:{pet:{sprite:"era2_dragon",stage:3},wing:"demon"}},{})'); assert(k.pet && k.pet.base === 'era2_dragon_evo' && k.wing === 'demon' && !k.mount, 'opp.look não foi usado inteiro'); }
assert(/data-x="back"/.test(H()) && /data-x="again"/.test(H())); assert(!/undefined|NaN|\[object/.test(H()), 'undefined/NaN no resultado'); out.push('sem r.rewards nenhuma caixa; com r.rewards só o que veio; robô espelha o jogador; opp.look usado inteiro'); out.push('resultado: delta ' + pv.r.delta + ', liga ' + A.leagueInfo(g.S, host).league.name + ', nada além do creditado');
const watched = { hp: pv.hp.slice(), dmg: pv.dmg.slice(), crits: pv.crits, win: pv.r.win, r: pv.r, opp: pv.opp, max: pv.max.slice() };
// 4) Pular = mesmo resultado (o mesmo registro)
X('XA2.view="fight"'); g.__w = watched; X('paPvStart(__w.opp,__w.r,1,__w.max[0],__w.max[1]); XA2.pv.phase="run"'); pv = X('XA2.pv'); for (let i = 0; i < 100; i++) X('paPvStep(0.05)'); const mid = pv.used.length; def.click(btn('skip'));
assert(pv.phase === 'result' && mid > 0 && mid < log.length); assert(near(pv.hp[0], watched.hp[0]) && near(pv.hp[1], watched.hp[1]) && near(pv.dmg[0], watched.dmg[0]) && near(pv.dmg[1], watched.dmg[1]) && pv.crits === watched.crits && pv.used.every((v, i) => v === i) && pv.used.length === log.length, 'Pular deu outro resultado');
out.push('Pular depois de ' + mid + ' golpes: mesmo resultado');
// 5) botões e velocidade
X('XA2.view="fight"; paPvStart(__w.opp,__w.r,1,__w.max[0],__w.max[1]); XA2.pv.phase="run"'); pv = X('XA2.pv'); def.render();
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length === 4 && bt.every(b => /data-x="(pvspd|skip)"/.test(b)), 'botão sem ação na luta');
for (const v of [2, 4, 1]) { def.click(btn('pvspd', { v: String(v) })); assert.strictEqual(pv.speed, v); assert(new RegExp('data-v="' + v + '" aria-pressed="true"').test(H())); }
def.click(btn('skip')); bt = H().match(/<button[^>]*>/g) || []; assert(bt.length === 2 && bt.every(b => /data-x="(back|again)"/.test(b)), 'botão sem ação no resultado');
const f0 = A.ensure(g.S, host).fights; def.click(btn('again')); assert(A.ensure(g.S, host).fights === f0 + 1 && X('XA2.pv.phase') === 'vs' && X('XA2.pv.opp.id') === watched.opp.id, 'Lutar de novo não começou outra luta');
def.click(btn('skip')); A.ensure(g.S, host).attemptsLeft = 0; def.render(); assert(/data-x="again" disabled[^>]*>Sem lutas hoje</.test(H()));
def.click(btn('back')); assert(X('XA2.view') === 'lobby' && X('XA2.pv') === null && /role="tablist"/.test(H())); out.push('x1/x2/x4, Pular, Lutar de novo e Voltar com ação');
// 6) larguras, sem emoji, sem rolagem horizontal
A.ensure(g.S, host).attemptsLeft = 3; X('XA2.view="fight"; paPvStart(__w.opp,__w.r,1,__w.max[0],__w.max[1])');
for (const [w, h] of [[288, 512], [360, 640], [384, 700], [412, 760]]) { dims = { Wb: w, H: h }; for (const ph of ['vs', 'run', 'result']) { X('XA2.pv.phase="' + ph + '"; XA2.view="' + (ph === 'result' ? 'result' : 'fight') + '"'); def.render(); const s = H();
    assert(!/undefined|NaN|\[object/.test(s), w + ' ' + ph + ': undefined/NaN'); assert(!/\p{Extended_Pictographic}|[\u2605\u2606\u2713\u2714]/u.test(s), w + ' ' + ph + ': emoji'); assert(!/overflow-x:\s*(auto|scroll)|overflow:\s*(auto|scroll)|scroll-snap|grid-auto-flow:\s*column/.test(s), w + ' ' + ph + ': rolagem horizontal'); }
  const G = X('paPvGeo(' + w + ',' + h + ')'); assert(G.gy < G.gyP && G.gyP < G.feedTop && G.gy > 150 && G.K > 40, w + ': medidas ' + JSON.stringify(G)); }
assert(!/overflow-x:\s*(auto|scroll)|overflow:\s*(auto|scroll)|scroll-snap/.test(X('PV_CSS')), 'CSS com rolagem'); assert(!/\p{Extended_Pictographic}|[\u2605\u2606\u2713\u2714]/u.test(X('PV_CSS'))); out.push('288/360/384/412: VS, luta e resultado sem undefined, emoji nem rolagem horizontal');
// 7) chave desligada = luta antiga
dims = { Wb: 390, H: 656 }; def.click(btn('back')); g.PA_PVP2 = false; A.ensure(g.S, host).attemptsLeft = 3; def.click(btn('fight')); assert(X('XA2.view') === 'fight' && X('XA2.pv') === null && !/class="pv"/.test(H()), 'chave desligada devia abrir a luta antiga');
def.click(btn('skip')); assert(X('XA2.view') === 'result'); def.click(btn('back')); def.onClose(); g.PA_PVP2 = true; out.push('chave desligada: luta antiga intacta');
console.log('p_arena.smoke OK\n- ' + out.join('\n- '));
