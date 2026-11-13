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
const A = g.Sys.arena, o0 = A.ensure(g.S, host), left0 = o0.attemptsLeft, lp0 = o0.lp, gold0 = host.gold, gems0 = host.gems;
def.click(btn('fight')); let pv = X('XA2.pv'); assert(pv && X('XA2.view') === 'fight' && pv.phase === 'vs', 'a luta nova não abriu');
assert(/pv-ovl pv-vs/.test(H()) && (H().match(/class="pv-bigav"/g) || []).length === 2, 'abertura VS sem os dois retratos'); assert(!/undefined|NaN|\[object/.test(H()), 'undefined/NaN no VS');
assert(def.busy() === true, 'busy() durante a luta'); assert.strictEqual(A.ensure(g.S, host).attemptsLeft, left0 - 1); out.push('LUTE! abre no VS, gasta 1 tentativa');
// 2) o registro é o do módulo e é consumido na ordem
const log = pv.r.duel.log; assert(log.length > 0 && pv.log.length === log.length && pv.log.every((e, i) => e === log[i]), 'registro diferente do duel.log');
for (let i = 0; i < 200 && pv.phase === 'vs'; i++) X('paPvStep(0.05)'); assert.strictEqual(pv.phase, 'run', 'o VS não terminou (sem motor de desenho ele sai pelo tempo)');
let guard = 0, okOrder = true, okHp = true; while (pv.phase !== 'result' && guard++ < 8000) { X('paPvStep(0.05)'); X('paPvDraw()'); if (!pv.used.every((v, i) => v === i)) okOrder = false;
  let h0 = pv.max[0], h1 = pv.max[1]; for (const k of pv.used) { const e = log[k]; if (e.s === 0) h1 = e.hp; else h0 = e.hp; } if (!near(h0, pv.hp[0]) || !near(h1, pv.hp[1])) okHp = false; }
assert(pv.phase === 'result' && X('XA2.view') === 'result', 'não chegou ao resultado'); assert(okOrder && pv.used.length === log.length, 'registro fora de ordem ou incompleto'); assert(okHp, 'vida diferente do registro em algum passo');
const d = pv.r.duel; assert(near(pv.hp[0], d.hpA * pv.max[0]) && near(pv.hp[1], d.hpB * pv.max[1]), 'vida final diferente da fração do duelo x vida cheia');
{ const full = A.DATA.pvp.enFull, Hh = pv.script.filter(e => e.k === 'hit'); assert(log.every(e => e.k === 'hit' || e.k === 'pet' || e.k === 'ult'), 'registro sem k');
  assert(pv.script.filter(e => e.k === 'ult').map(e => e.i).join() === log.map((e, i) => e.k === 'ult' ? i : -1).filter(i => i >= 0).join() && Hh.every(e => e.ult === (log[e.i].k === 'ult') && e.pet === (log[e.i].k === 'pet')), 'ultimate/pet fora do que o registro diz');
  assert(Hh.every(e => Math.abs(e.en[e.s] - Math.min(100, log[e.i].en / full * 100)) < 1e-9), 'energia diferente do en do registro'); out.push('ultimate só em k:ult (' + log.filter(e => e.k === 'ult').length + '), pet só em k:pet (' + log.filter(e => e.k === 'pet').length + '), energia = en do registro'); }
const sum = s => log.filter(e => e.s === s).reduce((v, e) => v + e.dmg, 0); assert(near(pv.dmg[0], sum(0)) && near(pv.dmg[1], sum(1)), 'dano somado diferente do registro');
assert(new RegExp(pv.r.win ? '>VITÓRIA<' : '>DERROTA<').test(H()), 'título diferente do vencedor do módulo'); out.push('luta assistida: ' + log.length + ' golpes na ordem, vida final e vencedor do módulo (' + (pv.r.win ? 'vitória' : 'derrota') + ')');
// 3) resultado: só o que o módulo creditou
const o1 = A.ensure(g.S, host); assert.strictEqual(o1.lp, Math.max(0, lp0 + pv.r.delta)); assert(H().includes('>' + (pv.r.delta >= 0 ? '+' : '−') + Math.abs(pv.r.delta) + ' pontos<'), 'delta fora da tela');
const RW = pv.r.rewards; assert(RW && typeof RW.gold === 'number' && host.gold - gold0 === RW.gold && host.gems - gems0 === RW.gems, 'saldo diferente do r.rewards: ' + JSON.stringify([RW, host.gold - gold0, host.gems - gems0])); assert(/class="pv-note">Prêmio da liga [^<]* ao fechar a semana/.test(H()), 'faltou a linha do prêmio da liga');
{ const got = (H().match(/<small>(moedas?|gemas?|baús?)<\/small>/g) || []).map(x => x.replace(/<\/?small>/g, '')).join(','), want = [RW.gold > 0 ? (RW.gold === 1 ? 'moeda' : 'moedas') : '', RW.gems > 0 ? (RW.gems === 1 ? 'gema' : 'gemas') : '', RW.chest > 0 ? (RW.chest > 1 ? 'baús' : 'baú') : ''].filter(Boolean).join(',');
  assert(/Prêmio desta luta/.test(H()) && got === want && H().includes('<b>+' + Math.round(RW.gold) + '</b>'), 'caixas diferentes do r.rewards: ' + got + ' / ' + want); }
{ const bx = () => (H().match(/<small>(moedas?|gemas?|baús?)<\/small>/g) || []).map(x => x.replace(/<\/?small>/g, '')).join(','), rw = v => { const r0 = pv.r.rewards; pv.r.rewards = v; def.render(); const b = bx(), h = H(); pv.r.rewards = r0; return [b, h]; };
  { const u = rw(undefined); assert(u[0] === '' && !/class="pv-rw"/.test(u[1]) && !/Prêmio desta luta/.test(u[1]) && /class="pv-note"/.test(u[1]), 'sem r.rewards (provider antigo) não pode haver caixa'); }
  let q = rw({ gold: 18400 }); assert(q[0] === 'moedas' && q[1].includes('<b>+18400</b>') && /Prêmio desta luta/.test(q[1]), 'r.rewards só moedas: ' + q[0]);
  q = rw({ gold: 900, gems: 12, chest: 1 }); assert(q[0] === 'moedas,gemas,baú' && q[1].includes('<b>+12</b>') && q[1].includes('<b>+1</b>'), 'r.rewards completo: ' + q[0]);
  q = rw({ gold: 900, gems: 0, chest: 0 }); assert(q[0] === 'moedas', 'gemas/baú zero não têm caixa: ' + q[0]); q = rw({ gold: 1, gems: 1, chest: 1 }); assert(q[0] === 'moeda,gema,baú', 'singular: ' + q[0]); q = rw({ gold: 2, gems: 2, chest: 2 }); assert(q[0] === 'moedas,gemas,baús', 'plural: ' + q[0]); q = rw({}); assert(q[0] === '' && !/class="pv-rw"/.test(q[1]) && !/undefined|NaN/.test(q[1])); def.render(); }
{ const b = pv.F[1].look, k = pv.opp.look; assert(k && (b.wing || '') === (k.wing || '') && (b.pet ? b.pet.base : '') === (k.pet ? k.pet.base : '') && (b.aura || '') === (k.aura ? 'assets/anim/aura/' + k.aura : ''), 'o robô não aparece como o opp.look diz: ' + JSON.stringify([b, k]));
  assert(H().includes(' ·\u00a0Nv\u00a0' + pv.opp.level), 'faltou o nível do adversário'); const nl = Object.assign({}, pv.opp); delete nl.look; g.__nl = nl; const m = X('paPvOppLook(__nl,{})'); assert(!m.mount && !m.pet && !m.wing && !m.aura, 'reserva sem look: robô mais equipado que o jogador');
  const k2 = X('paPvOppLook({id:"z",skin:{weapon:"w01"},look:{pet:{sprite:"era2_dragon",stage:3},wing:"demon"}},{})'); assert(k2.pet && k2.pet.base === 'era2_dragon_evo' && k2.wing === 'demon' && !k2.mount, 'opp.look não foi usado inteiro'); }
assert(/data-x="back"/.test(H()) && /data-x="again"/.test(H())); assert(H().includes(' em ' + log.length + ' golpes<') && !/ em \d+:\d\d</.test(H()), 'resultado tem de dizer os golpes do registro, não o relógio'); assert(!/undefined|NaN|\[object/.test(H()), 'undefined/NaN no resultado'); out.push('sem r.rewards nenhuma caixa; com r.rewards só o que veio; robô espelha o jogador; opp.look usado inteiro'); out.push('resultado: delta ' + pv.r.delta + ', liga ' + A.leagueInfo(g.S, host).league.name + ', nada além do creditado');
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
def.click(btn('skip')); A.ensure(g.S, host).attemptsLeft = 0; def.render(); assert(/data-x="again" aria-disabled="true"[^>]*>Sem lutas hoje</.test(H()) && !/data-x="again"[^>]*\sdisabled/.test(H()), 'sem tentativas: botão tem de dizer e continuar tocável');
{ const t0 = toasts.length, f1 = A.ensure(g.S, host).fights; def.click(btn('again')); assert(toasts.length === t0 + 1 && /Sem lutas hoje/.test(toasts[t0]) && A.ensure(g.S, host).fights === f1 && X('XA2.view') === 'result', 'sem tentativas: tocar tem de avisar e não lutar'); }
def.click(btn('back')); assert(X('XA2.view') === 'lobby' && X('XA2.pv') === null && /role="tablist"/.test(H())); out.push('x1/x2/x4, Pular, Lutar de novo e Voltar com ação');
// 6) larguras, sem emoji, sem rolagem horizontal
A.ensure(g.S, host).attemptsLeft = 3; X('XA2.view="fight"; paPvStart(__w.opp,__w.r,1,__w.max[0],__w.max[1])');
for (const [w, h] of [[288, 512], [360, 640], [384, 700], [412, 760]]) { dims = { Wb: w, H: h }; for (const ph of ['vs', 'run', 'result']) { X('XA2.pv.phase="' + ph + '"; XA2.view="' + (ph === 'result' ? 'result' : 'fight') + '"'); def.render(); const s = H();
    assert(!/undefined|NaN|\[object/.test(s), w + ' ' + ph + ': undefined/NaN'); assert(!/\p{Extended_Pictographic}|[\u2605\u2606\u2713\u2714]/u.test(s), w + ' ' + ph + ': emoji'); assert(!/overflow-x:\s*(auto|scroll)|overflow:\s*(auto|scroll)|scroll-snap|grid-auto-flow:\s*column/.test(s), w + ' ' + ph + ': rolagem horizontal'); }
  const G = X('paPvGeo(' + w + ',' + h + ')'); assert(G.gy < G.gyP && G.gyP < G.feedTop && G.gy > 150 && G.K > 40, w + ': medidas ' + JSON.stringify(G)); }
assert(!/overflow-x:\s*(auto|scroll)|overflow:\s*(auto|scroll)|scroll-snap/.test(X('PV_CSS')), 'CSS com rolagem'); assert(!/\p{Extended_Pictographic}|[\u2605\u2606\u2713\u2714]/u.test(X('PV_CSS'))); out.push('288/360/384/412: VS, luta e resultado sem undefined, emoji nem rolagem horizontal');
// 6b) placar estreito: nomes inteiros (sem reticências), os dois lados iguais; VS em grade (retratos alinhados)
assert(!/\.pv-pn\{[^}]*(ellipsis|overflow:hidden)/.test(X('PV_CSS')), 'nome do placar com corte'); assert(/\.pv-vsrow\{display:grid;[^}]*grid-template-rows:auto auto/.test(X('PV_CSS')), 'VS sem grade');
{ const a = X('paPvNameFit(["Kael · Nv 50","Odin das Eras"],288)'), b = X('paPvNameFit(["Kael · Nv 50","Odin das Eras"],360)'); assert(a.two === true && a.fs >= 9 && b.two === false && b.fs >= 11, 'ajuste do nome: ' + JSON.stringify([a, b]));
  dims = { Wb: 288, H: 512 }; X('XA2.pv.phase="run"; XA2.view="fight"'); def.render(); assert((H().match(/class="pv-pn w2"/g) || []).length === 2, '288: os dois nomes em duas linhas');
  X('XA2.pv.phase="vs"'); def.render(); const kids = (H().match(/<div class="pv-(vsc[^"]*|bigvs)"/g) || []).map(x => x.replace(/<div class="pv-/, '').replace(/"$/, '')).join(','); assert.strictEqual(kids, 'vsc,bigvs,vsc r,vsc n,vsc n r'); out.push('288: nomes do placar inteiros em duas linhas iguais; VS com retratos na mesma linha'); }
// 6c) foto da aparência sem o motor do jogo (como um save novo sem nada): não lança erro, tudo null, só [a-z0-9_], save intacto
{ const s0 = JSON.stringify(g.S), sn = g.heroSnapshot(), k = sn.look; assert.strictEqual(typeof g.heroSnapshot, 'function'); assert.strictEqual(JSON.stringify(g.S), s0, 'heroSnapshot mudou o save');
  assert.strictEqual(Object.keys(sn).sort().join(), 'level,look,petFrac'); assert.strictEqual(Object.keys(k).sort().join(), 'armor,aura,hero,mount,pet,skin,weapon,wing');
  assert(k.hero === 'kael' && k.skin === null && k.mount === null && k.pet === null && k.wing === null && k.aura === null && k.weapon === null && k.armor === null && sn.level >= 1 && sn.petFrac >= 0 && sn.petFrac < 1, 'foto vazia: ' + JSON.stringify(sn));
  const b = X('paPvOppLook({id:"s",skin:{weapon:"w01"},look:' + JSON.stringify(k) + '},{})'); assert(!b.mount && !b.pet && !b.wing && !b.aura && !b.skin, 'a tela não aceitou a foto vazia'); out.push('heroSnapshot sem motor: {look, level, petFrac} com tudo null, save intacto, aceito pela tela'); }
// 7) chave desligada = luta antiga
dims = { Wb: 390, H: 656 }; def.click(btn('back')); g.PA_PVP2 = false; A.ensure(g.S, host).attemptsLeft = 3; def.click(btn('fight')); assert(X('XA2.view') === 'fight' && X('XA2.pv') === null && !/class="pv"/.test(H()), 'chave desligada devia abrir a luta antiga');
def.click(btn('skip')); assert(X('XA2.view') === 'result'); def.click(btn('back')); def.onClose(); g.PA_PVP2 = true; out.push('chave desligada: luta antiga intacta');
// 8) ARENA ONLINE: o Sys.arenaNet REAL (js/sys/arenanet.js) com uma rede de mentira (Sys.net._call). Servidor: adversários com FC 320 e 280; retrato com FC 260.
//    A tela mostra 320 e 280 como vieram (sem a escala de exibição), compara com a FC do RETRATO (o número do POST /arena/snapshot), não com a FC local, e o
//    resultado mostra os pontos que o servidor devolveu. Com o provider local a lista volta a ser exatamente a de antes.
(async () => {
  const T = g.Sys.tower, F = g.Sys.fc, view0 = F.DATA.viewOn; F.DATA.viewOn = true;   // escala de exibição LIGADA: é ela que transformava 320 em 9,9 mil
  const scaled320 = F.viewText(320), scaled280 = F.viewText(280); assert(scaled320 !== '320' && scaled280 !== '280', 'a escala de exibição não está agindo no teste');
  const rows = () => H().split('<button data-x="sel"').slice(1), noClock = s => s.replace(/(\d+d )?\d\d:\d\d:\d\d/g, 'T');
  g.PA_PVP2 = true; A.ensure(g.S, host).attemptsLeft = 3; def.onOpen(); def.render(); const local0 = noClock(H()), localFc = F.compute(g.S, host), lo = A.opponents(g.S, host);
  assert(rows().length === 3 && rows().every((r, i) => r.includes('FC ' + F.viewText(lo[i].fc) + ' ·') && r.includes('>+' + lo[i].winPts + '<') && r.includes('>−' + lo[i].losePts + '<')) && /Cópias de jogadores/.test(H()), 'lobby local diferente do Sys.arena.opponents');
  require(path.join(R, 'js/sys/arenanet.js')); const NET = g.Sys.arenaNet; NET._reset(); NET.DATA.on = true;
  const ps0 = T.playerStats; let snapFc = 260; T.playerStats = (S, h) => Object.assign(ps0(S, h), { fc: snapFc });
  assert(localFc > 1000 && localFc !== 260, 'a FC local do teste tem de ser bem diferente da do retrato: ' + localFc);
  const posts = [], o = A.ensure(g.S, host), srvLog = [{ s: 0, k: 'hit', dmg: 10, crit: false, hp: 90, en: 25 }, { s: 1, k: 'hit', dmg: 200, crit: true, hp: 0, en: 25 }];
  const list = [{ id: 'u1', name: 'Rival <b>x', fc: 320, bot: false, level: 5, look: null, points: 1000 }, { id: 'u2', name: 'Iara de Ferro', fc: 280, bot: true, level: 5, look: null, points: 1000 }, { id: 'u3', name: 'Ragnar do Vento', fc: 280, bot: false, level: 5, look: null, points: 1000 }];
  g.Sys.net = { serverNow: () => Date.now(), _call: async (m, p, b) => { posts.push([m, p, b]);
    if (p === '/arena/snapshot') return { ok: true }; if (p.startsWith('/arena/opponents')) return list; if (p === '/arena/week') return { week: o.week, start: Date.now() - 1000, end: Date.now() + 86400000 };
    if (p === '/arena/status') return { week: o.week, day: o.day, attemptsLeft: o.attemptsLeft, refreshLeft: o.refreshLeft, points: o.points };
    if (p.startsWith('/ranking')) return { kind: 'arena', week: o.week, list: [], me: { rank: null, value: 0 }, bots: false };
    if (p === '/arena/fight') return { ok: true, win: false, delta: -12, points: o.points - 12, seed: 1, attemptsLeft: o.attemptsLeft - 1, rounds: 1, log: srvLog, opp: { id: 'u1', name: 'Rival <b>x', fc: 320, level: 5, look: null, bot: false }, rewards: { gold: null, goldk: 20, gems: 0, chest: 0 } };
    throw Object.assign(new Error('404'), { code: 'not_found' }); } };
  const st = await NET.start(g.S, host); assert(st.ok === true && NET.state().started === true, 'o Sys.arenaNet não iniciou: ' + JSON.stringify(st));
  const sent = posts.find(x => x[1] === '/arena/snapshot')[2].fc; assert.strictEqual(sent, 260, 'retrato enviado');
  def.onOpen(); def.render(); let rw = rows(); assert.strictEqual(rw.length, 3);
  assert(rw[0].includes('FC 320 ·') && rw[1].includes('FC 280 ·') && rw[2].includes('FC 280 ·'), 'a FC do adversário não é a do servidor'); assert(!H().includes(scaled320) && !H().includes(scaled280), 'a FC do servidor saiu reescalada');
  assert.strictEqual(X('paSrvFc()'), sent, 'a FC "sua" do lobby tem de ser a do retrato enviado'); assert(H().includes('sua FC na Arena: 260') && !/Cópias de jogadores/.test(H()), 'rodapé online');
  const kr = A.DATA.kRange, K = fc => Math.max(kr[0], Math.min(kr[1], fc / sent)), W1 = Math.round(A.DATA.winBase * K(320)), L1 = Math.round(A.DATA.lossBase * K(320)), W3 = Math.round(A.DATA.winBase * K(280)), L3 = Math.round(A.DATA.lossBase * K(280));
  assert.deepStrictEqual([W1, L1, W3, L3], [25, 12, 22, 11]); const bug = A.opponents(g.S, host)[0];
  assert(bug.winPts !== W1 && bug.losePts !== L1 && bug.diff.txt !== T.difficulty(260, 320).txt, 'o teste não reproduz o defeito (conta pela FC local): ' + JSON.stringify([bug.winPts, bug.losePts, bug.diff]));
  assert(rw[0].includes('>+25<') && rw[0].includes('>−12<') && rw[0].includes('>' + T.difficulty(260, 320).txt + '<') && !rw[0].includes('>' + bug.diff.txt + '<') && !rw[0].includes('>+' + bug.winPts + '<'), 'previsão/dificuldade de 260 x 320: ' + rw[0]);
  assert(rw[2].includes('>+22<') && rw[2].includes('>−11<') && rw[2].includes('>' + T.difficulty(260, 280).txt + '<'), 'previsão/dificuldade de 260 x 280');
  assert(rw[1].includes('>sem pontos<') && !/>[+−]\d+</.test(rw[1]) && rw[1].includes('>' + T.difficulty(260, 280).txt + '<'), 'robô online: sem número de ponto');
  assert(H().includes('Rival &lt;b&gt;x') && !H().includes('Rival <b>x'), 'nome do servidor sem escape'); assert(!/undefined|NaN|\[object/.test(H()) && !/\p{Extended_Pictographic}/u.test(H()));
  out.push('online: FC 320/280 como o servidor mandou (não ' + scaled320 + '), retrato 260 (FC local ' + Math.round(localFc) + '): ' + T.difficulty(260, 320).txt + ' +25/−12 e ' + T.difficulty(260, 280).txt + ' +22/−11; robô sem pontos; pela FC local sairia ' + bug.diff.txt + ' +' + bug.winPts + '/−' + bug.losePts);
  // sem a FC do retrato: nenhum número inventado
  snapFc = 0; def.render(); rw = rows(); assert(rw[0].includes('FC 320') && rw[0].includes('>Vitória: sobe<') && rw[0].includes('>Derrota: desce<') && !/>[+−]\d+</.test(rw[0]) && !H().includes('sua FC na Arena') && !/undefined|NaN/.test(H()), 'sem retrato tem de sair o texto sem número'); snapFc = 260;
  out.push('online sem FC do retrato: "Vitória: sobe / Derrota: desce", sem número');
  // a luta real: o resultado mostra o delta do servidor (o mesmo que a lista previu) e o placar usa 260 x 320
  def.render(); const lp1 = o.lp, pts1 = o.points; def.click(btn('sel', { i: '0' })); def.click(btn('fight')); assert(X('XA2.wait') && /Procurando adversário/.test(H()), 'faltou o véu de espera');
  for (let i = 0; i < 20 && X('XA2.wait'); i++) await new Promise(r => setTimeout(r, 5));
  pv = X('XA2.pv'); assert(pv && pv.net === true && pv.phase === 'vs' && pv.myFc === 260 && pv.opp.fc === 320, 'a luta online não abriu com as FCs do servidor'); def.render();
  assert(H().includes('<span>FC 260</span>') && H().includes('<span>FC 320</span>') && !H().includes(scaled320), 'VS online: FC fora da escala do servidor');
  def.click(btn('skip')); assert(X('XA2.view') === 'result' && />DERROTA</.test(H()) && H().includes('>−12 pontos<'), 'o resultado não mostra os pontos do servidor'); assert(o.lp === Math.max(0, lp1 - 12) && o.points === pts1 - 12, 'pontos aplicados diferentes dos do servidor');
  def.click(btn('back')); out.push('luta online: placar FC 260 x FC 320, resultado −12 pontos (o do servidor, igual à previsão da lista)');
  // provider local de volta: a lista é a de antes, caractere por caractere (fora os relógios)
  NET.stop(); T.playerStats = ps0; assert(X('paNet()') === null); const oo = A.ensure(g.S, host); oo.attemptsLeft = 3; oo.lp = lp1; oo.points = pts1; def.onOpen(); def.render();
  // online LIGADO mas sem sessão (QA: 429 no /auth/guest): o lobby local avisa que é treino; com a chave desligada volta ao texto de sempre
  if (NET.DATA && NET.DATA.on === true){ assert(/Sem ligação com o servidor agora: lutas de treino/.test(H()), 'online ligado e parado: faltou o aviso de treino'); NET.DATA.on = false; def.render(); out.push('online ligado sem sessão: aviso de treino no lobby'); }
  assert(!/Sem ligação com o servidor/.test(H()), 'aviso de treino com a chave desligada');
  assert.strictEqual(noClock(H()), local0, 'com o provider local o lobby mudou'); assert.deepStrictEqual(X('paOpps()'), A.opponents(g.S, host)); out.push('provider local: lobby idêntico ao de antes');
  def.onClose(); F.DATA.viewOn = view0; delete g.Sys.net;
  console.log('p_arena.smoke OK\n- ' + out.join('\n- '));
})().catch(e => { console.error(e); process.exit(1); });
