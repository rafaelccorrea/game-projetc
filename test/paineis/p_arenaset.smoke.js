'use strict';
// Teste de fumaça do js/p_arenaset.js (CONJUNTO PvP DA ARENA: bloco da aba + caixa da Brasa + painel próprio de conferência) em Node.
// Módulos REAIS (stats, grimoire, loadouts, bonfire, arenaset), ligados só na memória deste teste. Rodar: node test/paineis/p_arenaset.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['stats', 'grimoire', 'loadouts', 'bonfire', 'arenaset'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, AS = Sys.arenaSet, G = Sys.grimoire, LO = Sys.loadouts, BF = Sys.bonfire;
assert(AS && G && LO && BF, 'módulos carregados'); assert.strictEqual(AS.DATA.on, false, 'o conjunto PvP nasce desligado');
const KEYS = [AS, G, LO, BF], OLD = KEYS.map(m => m.DATA.on);

/* ---------- DOM de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const ELS = {}; for (const id of ['as_scroll', 'as_msg']) ELS[id] = mkEl(id);
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 6, stage: 35 }); let LV = 30; host.level = () => LV;
const SWORD = { id: 7, slot: 'weapon', r: 2, name: 'Espada <b>' }, HAT = { id: 9, slot: 'hat', r: 1, name: 'Elmo de Ferro' };
host.eq = { weapon: SWORD, hat: HAT }; host.equipped = () => host.eq; host.items = [SWORD, HAT]; host.itemName = it => it.name;
Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 35, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.STAGES_PER_ERA = 10; g.eraOf = st => Math.min(8, Math.floor((st - 1) / 10));
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'arenaset';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {};
let def = null, addName = ''; g.render = () => def.render();
let closed = 0, opened = [], openOk = true; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open(n, o) { opened.push([n, o]); return openOk; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };
let snaps = 0; Sys.arenaNet = { snapshot() { snaps++; return Promise.resolve({ ok: true }); } };

const SRC = fs.readFileSync(path.join(R, 'js/p_arenaset.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_arenaset.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');
const P = g.PArenaSet;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = x => def.click({ dataset: { x } });
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="as_msg" class="as-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|Loja|\[VALOR\]/i.test(h), tag + ': preço, compra ou aba Loja');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra\b/i.test(h), tag + ': pressão');
  assert(!/<input|<textarea|contenteditable/i.test(h), tag + ': campo de texto');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const learn = (S, ids, lv) => { const o = G.ensure(S); for (const id of ids) o.own[id] = { lv: lv || 1, pages: 0 }; };
const spy = (obj, name) => { const f0 = obj[name]; const s = { n: 0, restore() { obj[name] = f0; } }; obj[name] = function () { s.n++; return f0.apply(this, arguments); }; return s; };

try {
// 0) registro e ponte
assert.strictEqual(addName, 'arenaset'); assert.strictEqual(g.PANEL_ON.arenaset, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
for (const k of ['on', 'html', 'click', 'prize', 'urls']) assert.strictEqual(typeof P[k], 'function', 'PArenaSet.' + k); assert.strictEqual(P.tab, 'Conjunto PvP');
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|addBrasas\s*\(|onWin\s*\(/.test(SRC), 'o arquivo não liga chave nem dá Brasa');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(/const AS_ART_ON=false/.test(SRC), 'reserva atrás de uma constante única');
for (const m of SRC.matchAll(/const AS_SPELLS=\[([^\]]+)\]/g)) for (const id of m[1].replace(/'/g, '').split(',')) assert(fs.existsSync(path.join(R, 'assets/icons/grimoire/' + id + '.png')), 'ícone de magia: ' + id);
for (let e = 0; e <= 8; e++) for (const f of ['weapon', 'vest', 'helmet', 'gloves', 'boots', 'necklace', 'wings']) assert(fs.existsSync(path.join(R, 'assets/icons/slots/era' + e + '_' + f + '.png')), 'ícone de peça era ' + e + ' ' + f);
assert(/\.as-gold,\.xs \.as-gold\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs'); assert(/\.as-bt,\.xs \.as-bt\{[^}]*color:#ffffff/.test(CSS), 'botão azul do mock com texto claro, também com .xs');
for (const m of CSS.matchAll(/\.as-(bt|gold),\.xs \.as-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .as-' + m[1]);
assert(/\.as-root\{--as-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
for (const m of CSS.matchAll(/grid-template-columns:([^;}]+)/g)) assert(/minmax\(0,1fr\)/.test(m[1]), 'grades com minmax(0,1fr): sem rolagem lateral');
for (const a of P.actions) assert(/^as-/.test(a), 'os data-x do bloco têm prefixo próprio: ' + a);
out.push('registro: arenaset desligada; ponte PArenaSet {on, tab, html, click, prize, urls}; ' + def.actions.length + ' ações; ícones de magia e de peça existem em disco');

// 1) DESLIGADO e ausente: a aba não aparece, html vazio, nada no save; painel = aviso e Voltar
{ g.PANEL_ON.arenaset = true; const before = JSON.stringify(g.S); assert.strictEqual(P.on(), false, 'módulo desligado: a aba não aparece'); assert.strictEqual(P.html(), ''); assert.deepStrictEqual(P.urls(), []);
  assert.strictEqual(P.click({ dataset: { x: 'as-save' } }), true); assert.strictEqual(P.click({ dataset: { x: 'tab' } }), false, 'o que não é do bloco volta false');
  open(); has(g.esc2(AS.why('off'))); has('role="alert"'); assert.strictEqual(check('desligado'), 1); for (const a of def.actions) if (a !== 'back') tap(a); def.tick();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: nada escreve no save'); closed = 0; tap('back'); assert.strictEqual(closed, 1);
  const m0 = Sys.arenaSet; Sys.arenaSet = null; try { open(); has('Conjunto PvP indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); assert.strictEqual(P.html(), ''); } finally { Sys.arenaSet = m0; }
  g.PANEL_ON.arenaset = false; AS.DATA.on = true; assert.strictEqual(P.on(), false, 'tela desligada: a aba não aparece'); AS.DATA.on = false; g.PANEL_ON.arenaset = true; }
out.push('desligado ou sem módulo: aba some, html vazio, painel com aviso e Voltar, nada no save');

KEYS.forEach(m => { m.DATA.on = true; });
// 2) TRANCADO POR NÍVEL (o nível da Arena do jogo)
{ LV = 10; open(); has('abre no nível 28'); assert.strictEqual(check('nível'), 1); const sp = spy(LO, 'save'); try { tap('as-save'); tap('as-saveok'); assert.strictEqual(sp.n, 0); } finally { sp.restore(); } LV = 30; }
// 3) LIGADO SEM NADA: 3 círculos vazios, peças apagadas, Brasa 0/5; Editar magias abre o Grimório no modo arena
{ g.S = newSave(); assert.strictEqual(P.on(), true); open(); const v = AS.view(g.S, host);
  has('Magias da Arena'); assert.strictEqual(count(/class="as-sp no"/g), 3, '3 círculos vazios'); has('Sem magias no conjunto'); assert.strictEqual(count(/class="as-sl no"/g), 9, '7 peças + pet + montaria apagados'); has('Nenhum equipamento salvo para a Arena');
  has('Brasa da Arena hoje: ' + v.brasa.got + '/' + v.brasa.cap); has('0/5'); has('1 Brasa por vitória na arena.'); has('data-x="as-edit">Editar magias<'); has('data-x="as-save">Salvar equipamento atual<'); has('id="as_hero"'); check('vazio');
  assert(gated.includes('assets/bg/era1.png') && gated.some(u => /assets\/icons\/slots\/era3_weapon\.png/.test(u)), 'pede a carga do cenário e dos ícones antes de desenhar (era do herói)');
  opened = []; tap('as-edit'); assert.deepStrictEqual(opened, [['grim', { from: 'arena', mode: 'arena' }]]); openOk = false; tap('as-edit'); assert.strictEqual(msg(), 'O Grimório abre pelo Menu.'); openOk = true; }
out.push('nível abaixo do da Arena: só o Voltar; ligado sem nada: 3 círculos vazios, peças apagadas, Brasa 0/5, Editar magias abre o Grimório no modo arena');

// 4) MAGIAS PREENCHIDAS (as do conjunto Arena do Grimório, com ícone, nome e nível) e a linha de modificadores do módulo
{ learn(g.S, ['cannonball', 'medKit', 'gearSpin'], 2); G.setPreset(g.S, 'fases', ['gearSpin']); def.render(); let v = AS.view(g.S, host);
  assert(v.fromFases); has('usando o conjunto de Fases'); has('src="assets/icons/grimoire/gearSpin.png"'); assert.strictEqual(count(/class="as-sp no"/g), 2);
  G.setPreset(g.S, 'arena', ['cannonball', 'medKit', 'gearSpin']); def.tick(); v = AS.view(g.S, host); not('usando o conjunto de Fases'); assert.strictEqual(count(/class="as-sp"/g), 3, 'os 3 círculos preenchidos'); assert.strictEqual(count(/class="as-sp no"/g), 0);
  for (const s of v.spells) { has('src="assets/icons/grimoire/' + s.id + '.png"'); has('<b>' + g.esc2(s.name) + '</b>'); has('Nv ' + s.lv); } has(g.esc2(AS.modsText(v.mods))); assert(AS.modsText(v.mods).startsWith('Na arena: ')); check('magias'); }
// 5) SALVAR EQUIPAMENTO em dois toques: Sys.loadouts.save UMA vez, depois o retrato (Sys.arenaNet.snapshot) UMA vez
{ const sp = spy(LO, 'save'); snaps = 0;
  try { tap('as-saveok'); assert.strictEqual(sp.n, 0, 'confirmar sem armar não salva'); assert.strictEqual(msg(), 'Toque primeiro em Salvar equipamento atual.');
    tap('as-save'); assert.strictEqual(sp.n, 0, 'o 1º toque não salva'); has('data-x="as-saveok">Confirmar: salvar o que estou usando<'); not('data-x="as-save"'); check('armado');
    tap('as-edit'); def.render(); has('data-x="as-save"'); tap('as-saveok'); assert.strictEqual(sp.n, 0, 'outro toque desarma');
    tap('as-save'); tap('as-saveok'); assert.strictEqual(sp.n, 1, 'Sys.loadouts.save chamado UMA vez'); assert.strictEqual(snaps, 1, 'o retrato novo é mandado UMA vez'); } finally { sp.restore(); }
  assert.deepStrictEqual(LO.ensure(g.S).sets.arena.gear, { weapon: 7, hat: 9 }); assert.strictEqual(msg(), 'Equipamento da Arena salvo.'); assert.strictEqual(count(/class="as-sl"/g), 2, 'as 2 peças salvas acendem');
  has('Espada &lt;b&gt;'); not('Espada <b>'); has('Elmo de Ferro'); has('src="assets/icons/slots/era3_weapon.png"'); has('src="assets/icons/slots/era3_helmet.png"'); check('salvo');
  // peça que saiu da mochila: avisa
  host.items = [SWORD]; host.eq = { weapon: SWORD }; def.render(); has('Algumas peças salvas não estão mais com você'); host.items = [SWORD, HAT]; host.eq = { weapon: SWORD, hat: HAT };
  // conjuntos desligados: o botão diz o motivo e nada é chamado
  LO.DATA.on = false; const sp2 = spy(LO, 'save'); try { def.render(); has('Os conjuntos de equipamento ainda não abriram'); tap('as-save'); assert.strictEqual(msg(), 'Os conjuntos de equipamento ainda não abriram'); tap('as-saveok'); assert.strictEqual(sp2.n, 0); assert(/class="as-msg bad"/.test(H())); check('conjuntos desligados'); } finally { sp2.restore(); LO.DATA.on = true; } }
out.push('magias preenchidas com ícone, nome e nível; modificadores do módulo; Salvar em dois toques (save e snapshot uma vez); nomes escapados; recusa com motivo');

// 6) BRASA DA ARENA: a linha acompanha o módulo; no teto mostra o texto do módulo; a caixa do resultado
{ for (let i = 0; i < 2; i++) BF.addBrasas(g.S, 'arena', 1, { host }); def.tick(); has('Brasa da Arena hoje: 2/5'); for (let i = 0; i < 5; i++) BF.addBrasas(g.S, 'arena', 1, { host }); def.tick(); has('Brasa da Arena hoje: 5/5'); has(g.esc2(AS.why('brasaCap'))); not('1 Brasa por vitória'); check('teto');
  BF.DATA.on = false; def.render(); not('Brasa da Arena hoje'); BF.DATA.on = true;
  assert.strictEqual(P.prize(null), null); assert.strictEqual(P.prize({ gold: 5 }), null); assert.strictEqual(P.prize({ brasas: 0 }), null);
  const z = P.prize({ brasas: 1 }); assert.deepStrictEqual({ v: z.v, lb: z.lb }, { v: '+1', lb: 'Brasa' }); assert.strictEqual(P.prize({ brasas: 2 }).lb, 'Brasas'); assert(fs.existsSync(path.join(R, 'assets/ui/' + z.img + '.png')), 'a imagem da caixa existe em assets/ui'); }
// 7) o bloco dentro da Arena (html + click), larguras, sem fundo, desliga com o painel aberto; todos os botões
{ const body = P.html(); assert(/^<div class="as-root">/.test(body) && !/data-x="back"/.test(body), 'o bloco não traz Voltar nem moldura de tela'); assert.strictEqual(P.click({ dataset: { x: 'as-save' } }), true); assert.strictEqual(P.X.arm, 'save'); P.reset(); assert.strictEqual(P.X.arm, '');
  for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); check('largura ' + w); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  AS.DATA.on = false; def.render(); has(g.esc2(AS.why('off'))); check('desligou aberto'); AS.DATA.on = true;
  let taps = 0; open(); const n = buttons().length; for (let i = 0; i < n; i++) { open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x); const b2 = buttons().find(q => /as-bt b/.test(q.tag)); if (b2) { def.click(b2); taps++; check('depois ' + b2.dataset.x); } }
  seenActs.add('back'); const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('Brasa hoje/teto do módulo e caixa do resultado; bloco para a Arena sem moldura; larguras 320 e 390; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações; ' + seenImgs.size + ' imagens citadas existem em disco'); }
def.onClose();
} finally { KEYS.forEach((m, i) => { m.DATA.on = OLD[i]; }); }
assert.strictEqual(AS.DATA.on, false, 'o teste devolve as chaves desligadas');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
setTimeout(() => process.exit(0), 50);
