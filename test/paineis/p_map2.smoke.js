'use strict';
// Teste de fumaça do js/p_map2.js (MAPA DAS ERAS V4) em Node: DOM de mentira, módulos REAIS de js/sys (forge, erasend, mapchest) ligados só na memória.
// Rodar: node test/paineis/p_map2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['forge', 'erasend', 'mapchest', 'loot'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, MCm = Sys.mapChest, EEm = Sys.erasEnd;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', className: '', width: 0, height: 0, clientWidth: 390, clientHeight: 190, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), hidden: false, createElement: tag => { const e = mkEl(''); if (tag === 'canvas') e.getContext = () => ctx; return e; }, getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let tid = 0; const timers = new Map(); g.setTimeout = f => { timers.set(++tid, f); return tid; }; g.clearTimeout = id => { timers.delete(id); };
const flush = () => { let i = 0; while (timers.size && i++ < 200) { const [id, f] = timers.entries().next().value; timers.delete(id); f(); } assert(i < 200, 'temporizador sem fim'); return i; };

/* ---------- jogo de mentira (só o que a tela lê do index/battle/screens) ---------- */
const ERA_N = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Era Industrial', 'Era Moderna', 'Era Futurista', 'Submundo', 'Celestial'];
const BOSS_N = ['Rex Furioso', 'Minotauro', 'Dragão Real', 'Capitão Fantasma', 'Golem a Vapor', 'Tanque-Robô', 'Devorador Cósmico', 'Senhor do Submundo', 'Juiz Celestial'];
g.ERAS = ERA_N.map((n, i) => ({ n, en: [{ n: 'Comum ' + i }, { n: BOSS_N[i] }] })); g.STAGES_PER_ERA = 10;
g.recFC = s => Math.round(200 * Math.pow(1.25, s - 1)); let FC = 300; g.heroFC = () => FC; g.fcShow = v => 'fc' + Math.round(v);
const host = makeHost({ seed: 7, stage: 1 }); const tabs = []; host.goTab = t => tabs.push(t); host.stage = () => g.S.stage; Sys.host = host;
const newSave = st => ({ gold: 0, gems: 0, stage: st || 1, best: st || 1, eraMax: 0, hero: 'kael', sys: {}, set: {} });
g.S = newSave(1); g.V = { innerHTML: '' }; g.view = 'map2'; g.PANEL_ON = {};
let DIM = { H: 704, Wb: 390 }; g.xDims = () => DIM; g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => String(Math.round(v));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.statsChanged = () => log.push('stats');
const gateSeen = []; g.xGate = u => { gateSeen.push(u.slice()); return false; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_map2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_map2.js' });
const X = g.Map2.X, out = [], imgs = new Set();
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const nodes = () => [...H().matchAll(/<button class="m2-nd ([^"]*)" style="left:(-?[\d.]+)px;top:(-?[\d.]+)px" data-x="st" data-s="(\d+)" aria-pressed="(true|false)"/g)].map(m => ({ cls: m[1].split(' '), x: +m[2], y: +m[3], s: +m[4], sel: m[5] === 'true' }));
const chests = () => [...H().matchAll(/<button class="m2-chest (\w+)" style="left:(-?[\d.]+)px;top:(-?[\d.]+)px" data-x="chest" data-s="(\d+)"/g)].map(m => ({ st: m[1], x: +m[2], s: +m[4] }));
const stateOf = () => nodes().map(n => n.cls.includes('done') ? 'd' : n.cls.includes('now') ? 'n' : 'l').join('');
/* todo <button> tem data-x com ação tratada; sem emoji; sem "undefined"/"NaN"; sem texto proibido; sem reticências; nunca "fim do jogo"; guarda as imagens citadas */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/comprar|compra\b|sorteio|R\$|pre[çc]o|só hoje|últimas horas|oferta/i.test(H()), what + ': texto proibido (jogo com menores)');
  assert(!/fim d[eo] jogo|jogo acab|acabou o jogo|zerou/i.test(H()), what + ': a tela nunca diz que o jogo acabou');
  assert(!/…|\.\.\./.test(H()), what + ': texto com reticências');
  for (const m of H().matchAll(/src="([^"]+)"/g)) imgs.add(un(m[1])); for (const m of H().matchAll(/url\(([^)]+)\)/g)) imgs.add(m[1]); for (const u of g.Map2.urls()) imgs.add(u);
  return bt.length; };
const open = o => { def.onOpen(o); def.render(); };
const setStage = st => { g.S = newSave(st); host.gold = 0; host.gems = 0; };

// 0) registro: painel 'map2', chave nasce DESLIGADA, o arquivo não liga chave, não usa diálogo do navegador, não tem emoji nem reticências
assert.strictEqual(addName, 'map2'); assert.strictEqual(g.PANEL_ON.map2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.busy && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\(/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/text-overflow|…/.test(SRC), 'sem reticências no arquivo');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert(/\.m2-bt,\.xs \.m2-bt\{[^}]*color:#2a1403/.test(SRC) && /\.m2-gbtn,\.xs \.m2-gbtn\{[^}]*color:#2a1403/.test(SRC), 'botão dourado: texto escuro declarado também com .xs');
assert(/fim do jogo/i.test(SRC) === false, 'o arquivo nunca escreve "fim do jogo"');
out.push('registro: map2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji, sem reticências');

// 1) SAVE NOVO (fase 1): era I, fase 1 atual e as outras fechadas; cartão com a FC pedida x a sua e o Lutar; baú nenhum (módulo desligado)
assert.strictEqual(MCm.DATA.on, false, 'o Sys.mapChest nasce desligado');
open(); assert(gateSeen.length >= 1 && gateSeen[gateSeen.length - 1].includes('assets/bg/v2/era0/sky.webp'), 'pede a carga das imagens antes de desenhar');
assert.strictEqual(stateOf(), 'nlllllllll', 'fase 1 atual, as outras fechadas'); assert.deepStrictEqual(nodes().map(n => n.s), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
has('Pré-História'); has('Era I de IX'); has('<b>0/10</b> fases'); has('Rex Furioso'); has('Senhor da Era'); has('>Lutar<'); has('data-x="fight"'); has('Próxima fase');
has('FC pedida<b class="lil">fc' + g.recFC(1) + '</b>'); has('Sua FC (150%)<b class="lil">fc300</b>'); has('>FC suficiente<'); has('id="m2_hc"'); has('FC pedida fc' + g.recFC(10));
has('url(assets/bg/v2/era0/sky.webp)'); has('url(assets/bg/v2/era0/far.webp)'); has('url(assets/bg/v2/era0/ground.webp)'); has('src="assets/enemies/era0_boss.png"');
assert.strictEqual(chests().length, 0, 'módulo desligado: nenhum baú'); not('data-x="chest"'); not('data-x="gate"'); assert.strictEqual(g.Map2.ready(), 0);
assert(nodes()[0].sel, 'a fase atual vem escolhida'); assert(g.Map2.urls().every(u => !/era[1-8]/.test(u)), 'só imagens da era à vista');
sane('save novo'); out.push('save novo: era I, fase 1 atual, 9 fechadas, cartão com FC pedida x a sua e Lutar, nenhum baú com o módulo desligado');

// 2) sem o Sys.mapChest (ausente): nenhum baú; com ele LIGADO na memória: os 2 da era, fechados
{ const m = Sys.mapChest; delete Sys.mapChest; open(); assert.strictEqual(chests().length, 0, 'módulo ausente: nenhum baú'); sane('sem módulo de baús'); Sys.mapChest = m; }
MCm.setOn(true);
try {
  open(); assert.deepStrictEqual(chests().map(c => [c.s, c.st]), [[3, 'lk'], [7, 'lk']], 'save novo: os dois baús fechados, do módulo'); sane('baús fechados');
  def.click(btn('chest', { s: '3' })); has('role="dialog"'); has('Abre quando você vencer a <b>fase 3</b>'); not('data-x="claim"'); has('data-x="cclose"');
  { const L = MCm.list(g.S, host, 0)[0]; has(g.esc2(L.name)); has('>' + g.kf(L.reward.gold) + ' moedas<'); has('>' + L.reward.stones + ' pedra de forja<'); }
  { const c0 = host.gold; def.click(btn('claim', { s: '3' })); assert.strictEqual(host.gold, c0, 'baú fechado não entrega'); }
  sane('baú fechado aberto'); def.click(btn('cclose')); not('role="dialog"');
  out.push('baús: ausente ou desligado = nenhum; ligado = os 2 do Sys.mapChest (fechados no save novo, com o prêmio que o módulo devolve)');

  // 3) SAVE AVANÇADO (fase 24, era III): vencidas, atual e fechadas; chefe do meio; baú pronto e fechado; coleta UMA vez com o prêmio do módulo
  setStage(24); FC = g.recFC(24) * 0.95; open();
  assert.strictEqual(X.view, 2); assert.strictEqual(stateOf(), 'dddnllllll', 'fases 21-23 vencidas, 24 atual, 25-30 fechadas'); has('Medieval'); has('Era III de IX'); has('<b>3/10</b> fases'); has('Dragão Real');
  has('>Um pouco abaixo<'); has('Sua FC (95%)'); assert(nodes()[4].cls.includes('mid'), 'fase 25 = chefe do meio (era III em diante)'); has('Chefe · FC'); has('class="m2-mb'); has('>vencida<');
  assert.deepStrictEqual(chests().map(c => [c.s, c.st]), [[23, 'rdy'], [27, 'lk']], 'baú da 23 pronto, da 27 fechado'); assert.strictEqual(g.Map2.ready(), MCm.readyCount(g.S, host)); assert.strictEqual(g.Map2.ready(), 5, '3,7,13,17 e 23 esperando');
  sane('era III');
  let claims = 0, last = null; const claim0 = MCm.claim; MCm.claim = function () { claims++; last = claim0.apply(this, arguments); return last; };
  def.click(btn('chest', { s: '23' })); has('<b>Pronto!</b> A fase 23 foi vencida.'); has('data-x="claim" data-s="23"'); has('>Coletar<'); sane('baú pronto aberto');
  def.click(btn('st', { s: '22' })); assert.strictEqual(X.sel, 24, 'com a janela do baú aberta a trilha não responde');
  { const exp = MCm.list(g.S, host, 2)[0].reward, g0 = host.gold, st0 = Sys.forge.ensure(g.S).stones | 0; log.length = 0;
    def.click(btn('claim', { s: '23' })); assert.strictEqual(claims, 1, 'chamou o Sys.mapChest.claim'); assert(last.ok); assert.strictEqual(host.gold, g0 + exp.gold, 'ouro creditado pelo módulo');
    assert(log.includes('stats') || log.includes('save'), 'gravou depois da coleta'); assert(log.includes('snd:claim'));
    def.click(btn('claim', { s: '23' })); def.click(btn('claim', { s: '23' })); assert.strictEqual(claims, 1, 'coletar chama claim UMA vez'); assert.strictEqual(host.gold, g0 + exp.gold, 'o prêmio entrou uma vez só');
    const txt = 'Baú coletado: ' + g.kf(last.gold) + ' moedas + ' + last.stones + ' pedra de forja'; assert.strictEqual(X.toast, txt, 'o aviso mostra o que o módulo devolveu'); has(g.esc2(txt)); not('role="dialog"');
    assert.strictEqual((Sys.forge.ensure(g.S).stones | 0) - st0, last.stones, 'pedra creditada pelo Sys.forge'); assert(/top:(\d+)px/.exec(H().match(/class="m2-toast"[^>]*>/)[0])[1] <= 120, 'o aviso fica no alto, longe do cartão e do botão tocado');
    assert.deepStrictEqual(chests().map(c => [c.s, c.st]), [[23, 'got'], [27, 'lk']], 'coletado'); def.render(); def.render(); def.tick(); assert.strictEqual(claims, 1); assert.strictEqual(host.gold, g0 + exp.gold); }
  def.click(btn('chest', { s: '23' })); has('Já coletado.'); not('data-x="claim"'); def.click(btn('cclose')); sane('depois da coleta');
  /* o módulo recusa: a tela avisa e não inventa prêmio */
  { MCm.claim = () => { claims++; return { ok: false, reason: 'collected' }; }; def.click(btn('chest', { s: '27' })); X.chest = 27; const g0 = host.gold; def.click(btn('claim', { s: '27' })); assert.strictEqual(host.gold, g0); assert.strictEqual(X.toast, 'Este baú já foi coletado'); }
  MCm.claim = claim0; out.push('era III (fase 24): 3 vencidas, atual, 6 fechadas, chefe do meio; baú closed/ready/collected pelo módulo; coletar = 1 claim e o aviso mostra o que ele devolveu');

  // 4) fase vencida e fase fechada: só "Ir para a fase atual"; Lutar só na atual, pela rota do js/p_map.js (fecha a tela e abre a Batalha)
  open(); def.click(btn('st', { s: '22' })); assert.strictEqual(X.sel, 22); has('>Vencida<'); not('data-x="fight"'); has('Ir para a fase atual (24)'); sane('fase vencida');
  log.length = 0; tabs.length = 0; def.click(btn('fight')); assert(!log.includes('close') && !tabs.length, 'fase vencida não reabre (o jogo de hoje não volta fase)');
  def.click(btn('st', { s: '28' })); has('Vença a <b>fase 24</b> antes.'); not('data-x="fight"'); sane('fase fechada'); def.click(btn('st', { s: '99' })); assert.strictEqual(X.sel, 28, 'fase fora do trecho não é escolhida');
  def.click(btn('st', { s: '30' })); has('Senhor: Dragão Real'); has('Abre a era Era da Pólvora'); has('Vencer abre o portão para a era <b>Era da Pólvora</b>.');
  def.click(btn('cur')); assert.strictEqual(X.sel, 24); has('data-x="fight"'); def.click(btn('fight')); assert.deepStrictEqual(tabs, ['battle']); assert.strictEqual(log.filter(x => x === 'close').length, 1, 'Lutar fecha a tela e abre a Batalha, uma vez');
  assert.strictEqual(g.S.stage, 24, 'a tela não troca a fase do save'); out.push('Lutar: só na fase atual, pela rota do p_map (Screens.close + goTab battle); vencida e fechada só oferecem voltar à fase atual');

  // 5) trocar de era: anterior (completa, portão aberto, baús prontos), o portão leva à seguinte; era fechada sem baú; setas no limite não fazem nada
  open(); def.click(btn('era', { d: '-1' })); assert.strictEqual(X.view, 1); has('Antiguidade'); has('<b>completa</b>'); assert.strictEqual(stateOf(), 'dddddddddd'); has('Senhor vencido · portão aberto'); has('A era II está completa'); has('m2-gate open');
  has('data-x="gate"'); has('Atravessar: Era III'); has('url(assets/bg/v2/era2/sky.webp)'); assert.deepStrictEqual(chests().map(c => [c.s, c.st]), [[13, 'rdy'], [17, 'rdy']]); not('id="m2_hc"'); not('data-x="fight"'); sane('era anterior');
  assert(g.Map2.urls().includes('assets/bg/v2/era1/sky.webp') && !g.Map2.urls().some(u => /era[03-8]/.test(u)), 'imagens só da era à vista (e a fresta do portão)');
  def.click(btn('gate')); assert.strictEqual(X.view, 2, 'o portão leva à era seguinte'); has('Medieval'); has('id="m2_hc"');
  def.click(btn('era', { d: '1' })); assert.strictEqual(X.view, 3); has('Era da Pólvora'); has('fechada'); assert.strictEqual(stateOf(), 'llllllllll'); assert.strictEqual(chests().length, 0, 'era fechada: sem baú'); has('Era fechada');
  has('Vença <b>Dragão Real</b>, Senhor da era Medieval (fase 30), para abrir esta era.'); not('data-x="gate"'); not('data-x="fight"'); has('m2-lord lk'); sane('era fechada');
  def.click(btn('gate')); assert.strictEqual(X.view, 3, 'portão fechado não leva a lugar nenhum'); def.click(btn('cur')); assert.strictEqual(X.view, 2); assert.strictEqual(X.sel, 24);
  open({ era: 0 }); assert.strictEqual(X.view, 0); def.click(btn('era', { d: '-1' })); assert.strictEqual(X.view, 0); has('aria-disabled="true"');
  for (let i = 0; i < 12; i++) def.click(btn('era', { d: '1' })); assert.strictEqual(X.view, 9, 'a última parada é Além das Eras'); has('Além das Eras'); has('abrem depois da fase 90'); has('Trecho fechado'); has('Depois de <b>Juiz Celestial</b> (fase 90) vêm as <b>fases sem fim</b>'); sane('além das eras, ainda fechado');
  out.push('troca de era: anterior completa com portão aberto e baús prontos, portão leva à seguinte, era fechada sem baú, limites sem erro, Além das Eras fechado antes da fase 90');

  // 6) fase 90 (Senhor da última era): o texto diz que a jornada continua
  setStage(90); FC = g.recFC(90); open(); assert.strictEqual(X.view, 8); assert.strictEqual(stateOf(), 'dddddddddn'); has('Senhor: Juiz Celestial'); has('Completa as 9 eras'); has('a jornada continua nas fases sem fim'); has('>Lutar<'); sane('fase 90');
  out.push('fase 90: "completa as 9 eras, a jornada continua" (nunca fim do jogo)');

  // 7) DEPOIS DA FASE 90 (fase 118): trecho 111-120, marco no topo pelo Sys.erasEnd; prêmios do marco só com a chave do módulo ligada; sem baú
  setStage(118); FC = g.recFC(118) * 1.2; open(); assert.strictEqual(X.view, 9); assert.deepStrictEqual(nodes().map(n => n.s), [111, 112, 113, 114, 115, 116, 117, 118, 119, 120]); assert.strictEqual(stateOf(), 'dddddddnll');
  has('Além das Eras'); has('Fases sem fim · 111 a 120 · você na <b>118</b>'); has('Marco no topo'); has('Marco 120'); has('A jornada continua: novo trecho a cada 10 fases'); has('Fase sem fim 118'); has('>Lutar<'); has('id="m2_hc"');
  assert.strictEqual(chests().length, 0, 'fases sem fim: sem baú de era'); has('url(assets/bg/v2/era8/sky.webp)'); assert(EEm.isMark(120) && !EEm.isMark(118));
  assert.strictEqual(EEm.DATA.on, false); for (const t of EEm.milestoneRewards(120)) not(g.esc2(t)); sane('fase 118, erasEnd desligado');
  def.click(btn('st', { s: '120' })); has('Marco da fase 120'); has('>Fechada<'); has('Vença a <b>fase 118</b> antes.');
  EEm.DATA.on = true; try { def.render(); for (const t of EEm.milestoneRewards(120)) has(g.esc2(t)); has('Prêmio do marco: '); sane('fase 118, erasEnd ligado'); } finally { EEm.DATA.on = false; }
  def.click(btn('era', { d: '1' })); assert.strictEqual(X.view, 9); def.click(btn('era', { d: '-1' })); assert.strictEqual(X.view, 8); has('Celestial'); has('<b>completa</b>'); has('>Além das Eras<'); has('data-x="gate"');
  def.click(btn('gate')); assert.strictEqual(X.view, 9); setStage(121); open(); assert.deepStrictEqual(nodes().map(n => n.s)[0], 121, 'trecho novo depois do marco'); has('Marco 130'); sane('fase 121');
  { const e0 = Sys.erasEnd; delete Sys.erasEnd; open(); has('Topo deste trecho'); not('Marco 130'); sane('sem o Sys.erasEnd'); Sys.erasEnd = e0; }
  out.push('depois da fase 90: trecho 111-120 com estados certos, marco do Sys.erasEnd (prêmios só com a chave ligada), trecho novo depois do marco, sem baú');

  // 8) textos escapados: nome de era e de Senhor com sinais de HTML não viram marcação
  { const n0 = g.ERAS[2].n; g.ERAS[2].n = 'Med<i>"&"'; g.era9Boss = e => e === 2 ? '<b>Dragão "X"</b>' : null; setStage(24); open(); has('Med&lt;i&gt;&quot;&amp;&quot;'); has('&lt;b&gt;Dragão &quot;X&quot;&lt;/b&gt;'); not('Med<i>'); not('<b>Dragão "X"');
    def.click(btn('st', { s: '30' })); has('Senhor: &lt;b&gt;Dragão'); sane('escape'); g.ERAS[2].n = n0; delete g.era9Boss; }
  out.push('textos escapados (nome de era e de Senhor com sinais de HTML)');

  // 9) larguras 320, 390 e 600: nenhum nó, baú, portão ou etiqueta sai da largura (sem rolagem lateral); toque mínimo de 40 px no estilo
  for (const W of [320, 390, 600]) { DIM = { H: W === 320 ? 520 : 704, Wb: W }; setStage(24); open(); const ns = nodes(); assert.strictEqual(ns.length, 10);
    for (const n of ns) assert(n.x - 48 >= 0 && n.x + 48 <= W, W + ' px: nó fora da largura: ' + n.x); for (const c of chests()) assert(c.x - 24 >= 0 && c.x + 24 <= W, W + ' px: baú fora da largura');
    for (const m of H().matchAll(/class="m2-tag[^"]*" style="(left|right):(-?[\d.]+)px;top:[\d.]+px;max-width:(\d+)px"/g)) assert(+m[2] >= 0 && +m[2] + +m[3] <= W, W + ' px: etiqueta fora da largura');
    { const m = /class="m2-gate[^"]*" style="left:(-?[\d.]+)px/.exec(H()); assert(m && +m[1] >= 0 && +m[1] + 220 <= W, W + ' px: portão dentro da largura'); }
    assert(new RegExp('<svg class="m2-path" width="' + W + '"').test(H()), W + ' px: a trilha tem a largura da tela'); sane(W + ' px'); }
  DIM = { H: 704, Wb: 390 };
  { const css = g.document.head.children.map(c => c.textContent).join('\n'); assert(/\.m2-nd,\.xs \.m2-nd\{[^}]*width:68px;height:46px/.test(css) && /\.m2-chest,\.xs \.m2-chest\{[^}]*width:48px;height:48px/.test(css) && /\.m2-arr,\.xs \.m2-arr\{[^}]*width:44px;min-height:58px/.test(css) && /\.m2-bt,\.xs \.m2-bt\{[^}]*min-height:44px/.test(css) && /\.m2-gbtn,\.xs \.m2-gbtn\{[^}]*min-height:46px/.test(css), 'toque mínimo de 40 px');
    assert(/\.m2-trail\{[^}]*overflow-x:hidden/.test(css) && /\.m2-track\{[^}]*overflow:hidden/.test(css) && /\.m2\{[^}]*overflow:hidden/.test(css), 'sem rolagem lateral'); assert(!/white-space:nowrap/.test(css), 'nenhum texto preso em uma linha'); }
  out.push('larguras 320, 390 e 600: nós, baús, etiquetas e portão dentro da tela; toque mínimo de 40 px; sem rolagem lateral');

  // 10) herói na fase atual pela rota única do jogo (drawHeroFull); erro no desenho não derruba a tela; fechar para o laço
  setStage(24); open(); els.m2_hc = mkEl('m2_hc'); els.m2_hc.getContext = () => ctx; els.m2_fx = mkEl('m2_fx'); els.m2_fx.getContext = () => ctx; def.render(); assert(raf.length >= 1, 'o laço do herói e das partículas liga');
  heroCalls = []; drawn = 0; raf.shift()(1000); raf.shift()(1016); assert.strictEqual(heroCalls.length, 2, 'um desenho do herói por quadro'); { const c = heroCalls[1]; assert(c.k > 0 && isFinite(c.k) && c.x > 0 && c.y > 0); assert(c.st.mount === undefined && c.st.pet === undefined && c.st.weapon === undefined && c.st.hero === undefined, 'arma, asa, montaria e pet: os do jogo'); }
  assert(drawn > 10, 'partículas desenhadas'); assert(X.P.length > 0 && X.P.length <= 44, 'no máximo 44 partículas');
  { const m = /id="m2_hc"[^>]*style="left:(-?[\d.]+)px;top:(-?[\d.]+)px"/.exec(H()), n = nodes().find(q => q.s === 24); assert(m && Math.abs(+m[1] + 130 - n.x) < 1 && +m[2] < n.y && +m[2] + 170 > n.y - 30, 'o herói fica em cima do nó da fase atual'); }
  g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(1032); raf.shift()(1048); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
  def.onClose(); assert.strictEqual(raf.length, 0, 'fechar a tela para o laço'); delete els.m2_hc; delete els.m2_fx; raf = [];
  out.push('herói: drawHeroFull na fase atual (arma, asa, montaria e pet do jogo), até 44 partículas, erro no desenho não derruba, fechar para o laço');

  // 11) redesenho leve: escolher fase e abrir baú trocam só os pedaços (o cenário não é recriado) e a rolagem vai suave até a fase
  { setStage(24); def.onOpen(); const ids = ['m2_nodes', 'm2_card', 'm2_ern', 'm2_dots', 'm2_pop', 'm2_toast', 'm2_trail', 'm2_lsky', 'm2_lmid', 'm2_lfront']; for (const id of ids) els[id] = mkEl(id);
    const sc = []; els.m2_trail.scrollTo = o => { sc.push(o); els.m2_trail.scrollTop = o.top; }; els.m2_trail.addEventListener = () => {};
    def.render(); const full = H(); assert(sc.length === 1 && sc[0].behavior === 'smooth', 'ao abrir, rola suave até a fase atual'); assert(/translate3d\(0,[\d.]+px,0\)/.test(els.m2_lmid.style.transform), 'as camadas do cenário andam com a rolagem (transform)');
    def.click(btn('st', { s: '26' })); assert.strictEqual(H(), full, 'escolher fase não recria a tela'); assert(els.m2_card.innerHTML.includes('Vença a <b>fase 24</b> antes.')); assert(/data-s="26" aria-pressed="true"/.test(els.m2_nodes.innerHTML)); assert.strictEqual(sc.length, 2, 'rola até a fase escolhida');
    def.click(btn('chest', { s: '27' })); assert(els.m2_pop.innerHTML.includes('role="dialog"')); def.click(btn('cclose')); assert.strictEqual(els.m2_pop.innerHTML, ''); assert.strictEqual(H(), full);
    /* transição entre eras com a cortina: ocupada enquanto dura, troca a era no meio e solta no fim */
    def.click(btn('era', { d: '-1' })); assert.strictEqual(X.view, 1); els.m2_wipe = mkEl('m2_wipe'); def.click(btn('gate')); assert.strictEqual(def.busy(), true, 'ocupada durante a cortina'); assert.strictEqual(X.view, 1);
    def.click(btn('era', { d: '-1' })); assert.strictEqual(X.view, 1, 'durante a cortina os toques esperam'); flush(); assert.strictEqual(X.view, 2); assert.strictEqual(def.busy(), false); assert.strictEqual(els.m2_wipe.className, 'm2-wipe'); has('Medieval');
    def.click(btn('gate')); def.onClose(); assert.strictEqual(def.busy(), false, 'fechar no meio da cortina solta a tela'); flush();
    for (const id of ids) delete els[id]; delete els.m2_wipe; }
  out.push('redesenho leve por pedaços, rolagem suave até a fase, camadas por transform, cortina entre eras com a tela ocupada');

  // 12) o que muda por fora (fase vencida na batalha): o tick redesenha
  setStage(24); open(); g.S.stage = 25; for (let i = 0; i < 4; i++) def.tick(); assert.strictEqual(stateOf(), 'ddddnlllll', 'o tick acompanha a fase'); assert.strictEqual(X.sel, 24, 'a escolha do jogador fica');
  out.push('tick: acompanha a fase vencida por fora');

  // 13) sem a tabela de eras: explica e só o Voltar funciona
  { const E0 = g.ERAS; g.ERAS = []; open(); has('Mapa das Eras indisponível agora.'); sane('sem eras'); log.length = 0; def.click(btn('fight')); def.click(btn('back')); assert(log.includes('close')); g.ERAS = E0; }
  out.push('sem a tabela de eras: aviso e Voltar');

  // 13b) PRÊMIOS DO CHEFE: lidos do Sys.loot.DATA (pedras = [chance, mín, máx]; ovos = eggs.*). Mudar o módulo muda o texto; sem o campo, o prêmio some
  { const LD = Sys.loot.DATA, keepM = JSON.stringify(LD.mats), keepE = JSON.stringify(LD.eggs), keepD = JSON.stringify(LD.diff), back = () => { LD.mats = JSON.parse(keepM); LD.eggs = JSON.parse(keepE); LD.diff = JSON.parse(keepD); };
    const card = () => { const m = /id="m2_card"[^>]*>([\s\S]*?)<div id="m2_toast">/.exec(H()); assert(m, 'cartão da fase'); return m[1]; };
    const chips = () => [...card().matchAll(/<span>(?:<img[^>]*>|<svg[\s\S]*?<\/svg>)([^<]*)<\/span>/g)].map(m => un(m[1]));
    const sel = s => { def.click(btn('st', { s: String(s) })); assert.strictEqual(X.sel, s); };
    const pct = v => String(Math.round(v * 1000) / 10).replace('.', ',') + '%';
    try {
      { const code = SRC.replace(/\/\*[\s\S]*?\*\//g, ''); assert(!/\d+ a \d+ pedras|\d+ pedras? de forja|\d+\s*% de|a cada \d+ chefes/.test(code), 'nenhum número de prêmio escrito no arquivo'); assert(/\.loot\b/.test(code) && /mats\[cls\]\.forge/.test(code) && /eraBossRepeatChance/.test(code) && /bossChance/.test(code) && /\.pity\b/.test(code), 'lê os campos do Sys.loot.DATA'); }
      setStage(24); FC = g.recFC(24); open();
      // Senhor da Era (fase 30): pedras do mats.eraBoss.forge e ovo garantido na 1ª vitória; a chave "abre a era" continua
      sel(30); { const f = LD.mats.eraBoss.forge; assert.strictEqual(f[0], 1); assert.deepStrictEqual(chips(), [f[1] + ' a ' + f[2] + ' pedras de forja', 'Ovo de pet garantido na 1ª vitória', 'Abre a era Era da Pólvora']); assert(card().includes('src="assets/icons/menu/forge.png"')); assert(g.Map2.urls().includes('assets/icons/menu/forge.png'), 'o ícone da pedra entra na espera de carga'); sane('prêmio do Senhor'); }
      LD.mats.eraBoss.forge = [1, 7, 9]; def.render(); assert.strictEqual(chips()[0], '7 a 9 pedras de forja', 'mudou o módulo, mudou o texto'); LD.mats.eraBoss.forge = [1, 4, 4]; def.render(); assert.strictEqual(chips()[0], '4 pedras de forja'); LD.mats.eraBoss.forge = [1, 1, 1]; def.render(); assert.strictEqual(chips()[0], '1 pedra de forja');
      LD.mats.eraBoss.forge = [0.5, 2, 6]; def.render(); assert.strictEqual(chips()[0], '50% de chance: 2 a 6 pedras de forja', 'a 1ª posição é a chance'); LD.mats.eraBoss.forge = [0, 3, 5]; def.render(); assert.deepStrictEqual(chips(), ['Ovo de pet garantido na 1ª vitória', 'Abre a era Era da Pólvora'], 'chance zero: sem pedra');
      delete LD.mats.eraBoss.forge; def.render(); assert.strictEqual(chips().length, 2, 'campo ausente: o prêmio não aparece'); sane('sem o campo da pedra'); back();
      // a era já deu o ovo da 1ª vitória (marca do módulo no save): passa a valer a chance de repetição do módulo
      g.S.sys.loot = { egg: { eraFirst: [0, 1] } }; def.render(); assert.strictEqual(chips()[1], 'Ovo de pet garantido na 1ª vitória', 'a era III ainda não deu o ovo'); const snap = JSON.stringify(g.S.sys.loot);
      g.S.sys.loot.egg.eraFirst.push(2); def.render(); assert.strictEqual(chips()[1], pct(LD.eggs.eraBossRepeatChance) + ' de chance de ovo de pet'); assert.strictEqual(chips()[1], '25% de chance de ovo de pet');
      LD.eggs.eraBossRepeatChance = 0.4; def.render(); assert.strictEqual(chips()[1], '40% de chance de ovo de pet'); LD.eggs.eraBossRepeatChance = 0; def.render(); assert.deepStrictEqual(chips(), ['3 a 5 pedras de forja', 'Abre a era Era da Pólvora'], 'sem chance de repetição: sem ovo'); sane('era já vencida');
      g.S.sys.loot.egg.eraFirst.pop(); assert.strictEqual(JSON.stringify(g.S.sys.loot), snap, 'a tela só lê a marca do módulo'); delete LD.eggs.eraBossFirstMin; def.render(); assert.deepStrictEqual(chips(), ['3 a 5 pedras de forja', 'Abre a era Era da Pólvora'], 'sem o campo do ovo da 1ª vitória: sem ovo'); back(); delete g.S.sys.loot;
      // chefe do meio (fase 25): pedras do mats.boss.forge e a chance de ovo do chefe de fase com a garantia (pity)
      sel(25); { const f = LD.mats.boss.forge, E = LD.eggs; assert.deepStrictEqual(chips(), [f[1] + ' a ' + f[2] + ' pedras de forja', pct(E.bossChance) + ' de chance de ovo de pet (garantido a cada ' + E.pity + ' chefes sem ovo)']); assert.deepStrictEqual(chips(), ['1 a 2 pedras de forja', '10% de chance de ovo de pet (garantido a cada 10 chefes sem ovo)']); sane('prêmio do chefe do meio'); }
      LD.mats.boss.forge = [1, 2, 4]; LD.eggs.bossChance = 0.125; LD.eggs.pity = 8; def.render(); assert.deepStrictEqual(chips(), ['2 a 4 pedras de forja', '12,5% de chance de ovo de pet (garantido a cada 8 chefes sem ovo)'], 'mudou o módulo, mudou o texto');
      delete LD.eggs.pity; def.render(); assert.strictEqual(chips()[1], '12,5% de chance de ovo de pet', 'sem a garantia no módulo, a tela não promete'); delete LD.eggs.bossChance; def.render(); assert.deepStrictEqual(chips(), ['2 a 4 pedras de forja']); delete LD.mats.boss; def.render(); assert.deepStrictEqual(chips(), []); sane('chefe do meio sem campos'); back();
      // dificuldades do módulo ligadas: o chefe de fase só paga como chefe nas fases de bossStages; o Senhor não muda
      LD.diff.on = true; def.render(); assert.deepStrictEqual(chips(), [], 'fase 25 fora de bossStages: sem prêmio de chefe'); sel(30); assert.strictEqual(chips().length, 3); back();
      // fase comum e fase vencida: sem lista de prêmio; chefe do meio só da era III em diante
      sel(26); assert.deepStrictEqual(chips(), []); sel(22); assert.deepStrictEqual(chips(), []); setStage(4); open(); sel(5); assert.deepStrictEqual(chips(), [], 'eras I e II não têm chefe do meio'); setStage(24); open();
      // sem o Sys.loot: nenhum prêmio de chefe, a tela segue inteira
      { const l0 = Sys.loot; delete Sys.loot; try { open(); sel(30); assert.deepStrictEqual(chips(), ['Abre a era Era da Pólvora']); sel(25); assert.deepStrictEqual(chips(), []); sane('sem o Sys.loot'); } finally { Sys.loot = l0; } }
    } finally { back(); delete g.S.sys.loot; }
    out.push('prêmios do chefe: Senhor = pedras do mats.eraBoss.forge + ovo garantido na 1ª vitória (ou a chance de repetição se a era já deu o ovo); chefe do meio = mats.boss.forge + bossChance com a garantia (pity); mudar o Sys.loot.DATA muda o texto; campo ausente = prêmio some'); }

  // 14) todos os botões, em quatro momentos: tocar em cada um não gera exceção
  let taps = 0; for (const stg of [1, 24, 90, 118]) { setStage(stg); FC = g.recFC(stg); open(); for (const b of buttons()) { open(); try { def.click(b); flush(); for (const b2 of buttons()) if (b2.dataset.x === 'cclose' || b2.dataset.x === 'claim') { def.click(b2); break; } taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane('toque ' + b.dataset.x + ' na fase ' + stg); } }
  def.tick(); def.onClose(); assert.strictEqual(def.busy(), false); out.push('toques: ' + taps + ' botões tocados sem exceção');
} finally { MCm.setOn(false); }
assert.strictEqual(MCm.DATA.on, false); assert.strictEqual(EEm.DATA.on, false);

// 15) toda imagem citada existe em disco (as 9 eras em camadas, os 9 Senhores e os ícones)
for (const u of Object.values(g.Map2.IC)) imgs.add(u); for (let e = 0; e < 9; e++) { imgs.add('assets/enemies/era' + e + '_boss.png'); for (const f of ['sky', 'far', 'ground']) imgs.add('assets/bg/v2/era' + e + '/' + f + '.webp'); }
for (const u of imgs) assert(fs.existsSync(path.join(R, u)), 'imagem citada não existe: ' + u);
assert(![...imgs].some(u => /docs\/proto|\ba\//.test(u)), 'nenhuma arte de exemplo do protótipo');
out.push('imagens: ' + imgs.size + ' citadas, todas em disco');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
