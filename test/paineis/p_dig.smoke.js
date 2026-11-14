'use strict';
// Teste de fumaça do js/p_dig.js (ESCAVAÇÃO: camada 5 x 6, picaretas, bomba, broca, escada, total achado) em Node.
// Módulos REAIS js/sys/dig.js e js/sys/relics.js, ligados só na memória deste teste; o Treino (addStones) é de mentira. DOM de mentira.
// Rodar: node test/paineis/p_dig.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
require(path.join(R, 'js/sys/relics.js')); require(path.join(R, 'js/sys/dig.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, DG = Sys.dig, D = DG.DATA;
assert(DG && D && typeof DG.hit === 'function', 'Sys.dig carregado');
assert.strictEqual(D.on, false, 'a Escavação nasce desligada no jogo');

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { dg_scroll: mkEl('dg_scroll'), dg_msg: mkEl('dg_msg') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 3, stage: 12, eraMax: 2 }); Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 12, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'dig';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_dig.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_dig.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const cell = (r, c) => tap('cell', { r: String(r), c: String(c) });
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="dg_msg" class="dg-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|recarregar|anúncio|\[VALOR\]/i.test(h), tag + ': preço, compra ou recarga paga');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const o = () => g.S.sys.dig;
const spy = name => { const f0 = DG[name]; const s = { n: 0, restore() { DG[name] = f0; } }; DG[name] = function () { s.n++; return f0.apply(this, arguments); }; return s; };
const L = () => DG.layout(o().depth, o().round);
const N_ = D.cols * D.rows;

try {
// 0) registro
assert.strictEqual(addName, 'dig'); assert.strictEqual(g.PANEL_ON.dig, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|\.grant\s*\(|addPicks/.test(SRC), 'o arquivo não liga chave nem entrega picareta');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(/^function dgIcon\(key\)/m.test(SRC) && /^const DG_TILE=/m.test(SRC), 'arte de reserva atrás de UMA função (dgIcon) e UMA constante (DG_TILE)');
// arte da Arte: cada ícone é a imagem em disco e traz junto o desenho por código (reserva escondida, que aparece se a imagem falhar)
for (const k of ['pick', 'bomb', 'drill', 'stones', 'frag', 'stairs']) { const m = /^<img class="dg-ic" src="(assets\/[^"]+\.png)" alt="" onerror="[^"]+"><svg class="dg-ic fb"[^>]*>.+<\/svg>$/.exec(def.iconOf(k)); assert(m, 'ícone com imagem e reserva: ' + k); assert(fs.existsSync(path.join(R, m[1])), 'imagem do ícone existe: ' + m[1]); }
assert(/^<svg class="dg-ic"[^>]*>.*<\/svg>$/.test(def.iconOf('nada')), 'chave sem arte: só o desenho por código');
assert(/\.dg-ic\.fb\{display:none\}/.test(CSS), 'a reserva fica escondida enquanto a imagem carrega');
for (const k of ['dirt', 'rock', 'hole', 'dirtOff', 'rockOff']) { const m = /url\((assets\/ui\/dig\/[a-z]+\.png)\) center\/cover no-repeat,#[0-9a-f]{6}$/.exec(def.tiles[k]); assert(m && fs.existsSync(path.join(R, m[1])), 'ladrilho da Arte com cor de reserva: ' + k); }
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) if (!/ex\.:/.test(SRC.slice(Math.max(0, m.index - 30), m.index))) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert(/\.dg-bt,\.xs \.dg-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
assert(/\.dg-grid\{[^}]*minmax\(0,1fr\)/.test(CSS) && /\.dg-tools\{[^}]*minmax\(0,104px\) minmax\(0,46px\) minmax\(0,46px\)/.test(CSS), 'grades com minmax(0,1fr): sem rolagem lateral');
for (const m of CSS.matchAll(/\.dg-(c|tl|bt),\.xs \.dg-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .dg-' + m[1]);
assert(/\.dg-root\{--dg-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
out.push('registro: dig desligada, ' + def.actions.length + ' ações com tratador, dgIcon com 6 ícones de reserva, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e ausente
{ const before = JSON.stringify(g.S); open(); has('A Escavação ainda não abriu.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1);
  cell(0, 0); tap('tool', { t: 'bomb' }); tap('down'); tap('downok'); def.tick(); assert.strictEqual(JSON.stringify(g.S), before, 'desligado: nada escreve no save'); assert(!g.S.sys.dig);
  closed = 0; tap('back'); assert.strictEqual(closed, 1);
  const m0 = Sys.dig; Sys.dig = null; try { open(); has('Escavação indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); cell(0, 0); def.tick(); } finally { Sys.dig = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; nenhum toque escreve no save');

DG.setOn(true);
// 2) CAMADA NOVA: cabeçalho, picaretas, ferramentas, 30 células (só a linha de cima clara), totais zerados, como conseguir
{ g.S = newSave(); open(); const v = DG.view(g.S, host); has('Pré-História · camada 1'); has('<b>20/20</b>'); has('picaretas cheias'); has('Bomba: 0. Abre em cruz'); has('Broca: 0. Abre a coluna inteira'); has('<b>×0</b>');
  { const h = H(); assert(h.indexOf('class="dg-hd"') < h.indexOf('class="dg-tools"') && h.indexOf('class="dg-tools"') < h.indexOf('class="dg-grid"') && h.indexOf('class="dg-grid"') < h.indexOf('class="dg-ft"') && h.indexOf('class="dg-ft"') < h.indexOf('class="dg-box"'), 'ordem do mock: era e camada, ferramentas, grade, Descer; o resto abaixo'); }
  assert.strictEqual(count(/data-x="cell"/g), N_, '30 células'); assert.strictEqual(count(/class="dg-c lit"/g), D.cols, 'só a linha de cima dá para cavar'); assert.strictEqual(count(/class="dg-o/g), 0);
  assert.strictEqual(count(/aria-label="Rocha, /g), v.cells.filter(c => c.rock).length, 'rochas do view'); assert.strictEqual(count(/data-x="tool"/g), 3); has('data-t="pick" aria-pressed="true"');
  has('A escada está escondida nesta camada.'); not('data-x="down"'); has('Total achado na Escavação'); has('<b>0</b><small>pedras de prática</small>');
  has('Recarga: 1 picareta a cada ' + D.energy.everyMin + ' min, até ' + D.energy.max); has('Missões diárias completas: +' + D.grants.daily.picks + ' picaretas'); has('Nada à venda.'); check('nova');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)'); }
out.push('camada nova: era e camada, 20/20, 30 células com só a linha de cima clara, totais zerados e "Como conseguir" com os números do módulo');

// 3) PICARETA: um toque = hit UMA vez; terra abre, rocha racha e abre no 2º; recusas com motivo
{ const lay = L(), dirtC = [0, 1, 2, 3, 4].find(c => lay[c].k === 'dirt'), rockC = [0, 1, 2, 3, 4].find(c => lay[c].k === 'rock'); assert(dirtC != null, 'há terra na linha de cima');
  const sp = spy('hit'); saves = 0; try { cell(0, dirtC); assert.strictEqual(sp.n, 1, 'hit chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(o().e, 19); has('<b>19/20</b>'); has('próxima em 30 min'); assert.strictEqual(count(/class="dg-o/g), 1); assert.strictEqual(count(/data-x="cell"/g), N_ - 1); assert(host.changes >= 1 && saves === 0, 'o módulo avisa o jogo (host.onChange grava); a tela não grava em dobro');  const it = lay[dirtC].item; if (it && it.t === 'stones') { assert.strictEqual(msg(), '+' + it.n + ' pedras de prática'); has('<b>+' + it.n + '</b>'); } check('abriu');
  if (rockC != null) { cell(0, rockC); assert.strictEqual(msg(), 'Rocha rachada: falta 1 toque.'); has('class="dg-ck"'); has('aria-label="Rocha rachada, linha 1, coluna ' + (rockC + 1) + '"'); assert.strictEqual(o().e, 18); check('rachou'); cell(0, rockC); assert(o().grid[rockC].open, 'rocha abre no 2º toque'); assert.strictEqual(o().e, 17); }
  // recusa: célula que não alcança
  const far = (D.rows - 1) * D.cols + [0, 1, 2, 3, 4].find(c => !DG.view(g.S, host).cells[(D.rows - 1) * D.cols + c].canDig), e0 = o().e;
  cell(D.rows - 1, far % D.cols); assert.strictEqual(msg(), DG.why('blocked')); assert(/class="dg-msg bad"/.test(H())); assert.strictEqual(o().e, e0, 'recusa não gasta picareta'); check('recusa blocked');
  cell(0, dirtC); assert.strictEqual(msg(), DG.why('cell')); cell(99, 99); assert.strictEqual(msg(), DG.why('cell')); assert.strictEqual(o().e, e0);
  // sem picaretas: motivo com o tempo da próxima
  o().e = 0; o().t = host.t; def.render(); has('<b>0/20</b>'); const c2 = [0, 1, 2, 3, 4].find(c => !o().grid[c].open); cell(0, c2); assert.strictEqual(msg(), DG.why('picks') + ': ' + DG.nextText(30 * 60000)); assert(!o().grid[c2].open); check('sem picareta');
  // sem bomba e sem broca: o motivo e a ferramenta continua a picareta
  tap('tool', { t: 'bomb' }); assert.strictEqual(msg(), DG.why('bombs') + '. Veja em Como conseguir'); has('data-t="pick" aria-pressed="true"'); tap('tool', { t: 'drill' }); assert.strictEqual(msg(), DG.why('drills') + '. Veja em Como conseguir'); tap('tool', { t: 'nada' }); check('sem ferramenta'); }
out.push('picareta: hit uma vez por toque, terra abre, rocha racha e abre no 2º; recusas (não alcança, já aberto, sem picareta, sem bomba, sem broca) com motivo e sem gastar');

// 4) relógio: a recarga aparece sozinha (tick)
{ const t0 = Date.now; let add = 0; Date.now = () => t0() + add; try { def.render(); const h0 = H(); add = 300; def.tick(); assert.strictEqual(H(), h0, 'antes de 1 s não confere'); host.t += 10 * 60000; add = 1500; def.tick(); has('próxima em 20 min');
    host.t += 21 * 60000; add = 3000; def.tick(); has('<b>1/20</b>'); has('próxima em 29 min');
    tap('tool', { t: 'bomb' }); assert(msg()); els.dg_msg.innerHTML = 'x'; add = 9000; def.tick(); assert.strictEqual(els.dg_msg.innerHTML, '', 'o aviso some sozinho'); } finally { Date.now = t0; } }
out.push('relógio das picaretas: os minutos e a recarga aparecem sozinhos; o aviso some');

// 5) BOMBA e BROCA: dois toques (escolher, tocar a célula), UMA chamada, sem gastar picareta; depois volta para a picareta
{ assert(DG.grant(g.S, host, 'event').ok); def.render(); has('<b>11/20</b>'); const e0 = o().e, sb = spy('bomb'), sh = spy('hit'), sd = spy('drill');
  try { const c2 = [0, 1, 2, 3, 4].find(c => !o().grid[c].open); tap('tool', { t: 'bomb' }); has('data-t="bomb" aria-pressed="true"'); assert(msg().startsWith('Bomba pronta')); assert.strictEqual(sb.n, 0, 'escolher a bomba não gasta'); assert.strictEqual(o().bombs, 1); check('bomba armada');
    cell(0, c2); assert.strictEqual(sb.n, 1, 'bomb chamado UMA vez'); assert.strictEqual(sh.n, 0); assert.strictEqual(o().bombs, 0); assert.strictEqual(o().e, e0, 'bomba não gasta picareta'); assert(o().grid[c2].open && o().grid[D.cols + c2].open, 'abriu a célula e a de baixo'); has('data-t="pick" aria-pressed="true"'); check('bomba');
    const sc = L().findIndex(c => c.item && c.item.t === 'stairs') % D.cols; tap('tool', { t: 'drill' }); has('data-t="drill" aria-pressed="true"'); assert(msg().startsWith('Broca pronta')); cell(D.rows - 1, sc);
    assert.strictEqual(sd.n, 1, 'drill chamado UMA vez'); assert.strictEqual(sh.n, 0); assert.strictEqual(o().drills, 0); assert.strictEqual(o().e, e0); for (let r = 0; r < D.rows; r++) assert(o().grid[r * D.cols + sc].open, 'coluna aberta'); assert(msg().includes('Achou a escada'), msg()); has('aria-label="Aberto, '); has(': escada"'); check('broca'); }
  finally { sb.restore(); sh.restore(); sd.restore(); } }
out.push('bomba e broca: 1º toque escolhe, 2º usa (uma chamada cada), sem gastar picareta; a escada aparece');

// 6) DESCER: botão dourado só com a escada aberta; dois toques; descend UMA vez
{ has('data-x="down">Descer<'); not('A escada está escondida'); const sp = spy('descend'), d0 = o().depth; saves = 0;
  try { tap('downok'); assert.strictEqual(sp.n, 0, 'confirmar sem armar não desce'); assert.strictEqual(msg(), 'Toque primeiro em Descer.'); tap('down'); assert.strictEqual(sp.n, 0, 'o 1º toque não desce'); assert.strictEqual(o().depth, d0); has('data-x="downok">Confirmar: o que ficou nesta camada se perde<'); not('data-x="down"'); check('descer armado');
    cell(D.rows - 1, [0, 1, 2, 3, 4].find(c => !o().grid[(D.rows - 1) * D.cols + c].open)); has('data-x="down">Descer<'); tap('down'); tap('downok'); assert.strictEqual(sp.n, 1, 'descend chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(o().depth, d0 + 1); has('Pré-História · camada 2'); assert.strictEqual(msg(), 'Camada 2 · Pré-História'); assert.strictEqual(count(/data-x="cell"/g), N_); has('<b>1</b><small>camadas descidas</small>'); not('data-x="down"'); check('desceu');
  tap('down'); assert.strictEqual(msg(), DG.why('stairs')); const l0 = DG.descend; DG.descend = () => ({ ok: false, reason: 'stairs' }); try { tap('downok'); } finally { DG.descend = l0; } }
out.push('Descer: aparece com a escada aberta, 1º toque arma, 2º chama descend uma vez; sem escada mostra o motivo');

// 7) PRÊMIO GUARDADO e entregue: sem Treino e sem Relíquias ligados fica em "guardado"; ligados, entra sozinho
{ const g0 = DG.view(g.S, host); assert(g0.pend.stones > 0 || g0.pend.frags.some(x => x > 0), 'a camada 1 deixou prêmio guardado'); has('Guardado para entregar: '); has('Entra sozinho quando o Treino e as Relíquias estiverem abertos.');
  has('<b>' + g0.got.stones + '</b><small>pedras de prática</small>'); has('<b>' + g0.got.frags + '</b><small>fragmentos de relíquia</small>'); check('guardado');
  let stones = 0; Sys.practice = { addStones: (S, n) => { stones += n; } }; Sys.relics.setOn(true); o().e = 5; def.render();
  cell(0, 0); const v = DG.view(g.S, host); assert.strictEqual(v.pend.stones, 0); assert(v.pend.frags.every(x => x === 0)); assert.strictEqual(stones, v.got.stones, 'as pedras entraram pelo Sys.practice.addStones'); not('Guardado para entregar');
  assert.strictEqual(g.S.sys.relics ? g.S.sys.relics.frags.reduce((a, b) => a + b, 0) : 0, v.got.frags, 'os fragmentos entraram pelo Sys.relics'); check('entregue'); delete Sys.practice; Sys.relics.setOn(false); }
out.push('prêmio guardado aparece com o motivo e entra sozinho quando o Treino e as Relíquias abrem');

// 8) FUNDO LIBERADO pela era do herói: diz o que falta; na última era, o texto do fundo
{ o().depth = DG.maxDepth(host); o().round = 0; o().grid = null; def.render(); has('Medieval · camada ' + (DG.maxDepth(host) + 1)); has('Fundo liberado. Para descer mais, chegue à próxima era do jogo'); check('fundo');
  host._eraMax = 8; o().depth = DG.maxDepth(host); o().grid = null; def.render(); has('Celestial · camada 90'); has('Você chegou ao fundo da escavação'); check('fundo final'); host._eraMax = 2; o().depth = 1; o().grid = null; }
// 9) TEXTO ESCAPADO; módulo desliga com a tela aberta
{ const e0 = D.eraName[0]; D.eraName[0] = '<u>"Pré" & cia</u>'; try { open(); has('&lt;u&gt;&quot;Pré&quot; &amp; cia&lt;/u&gt; · camada 2'); not('<u>"Pré"'); check('escapado'); } finally { D.eraName[0] = e0; }
  D.on = false; def.render(); has('ainda não abriu'); check('desligou aberto'); D.on = true;
  { const oc = host.onChange; delete host.onChange; saves = 0; o().e = 5; try { open(); cell(0, 0); assert(saves >= 1, 'sem host.onChange a tela grava'); } finally { host.onChange = oc; } } }
out.push('fundo liberado diz o que falta; textos do módulo escapados');

// 9b) HERÓI FORA DA GRADE (ressalva do dono): canvas próprio acima da grade, sem posição absoluta; nenhuma célula fica coberta
{ let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
  const calls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { calls.push({ x, y, k, st }); return true; };
  const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
  els.dg_hero = mkEl('dg_hero'); els.dg_hero.getContext = () => ctx; els.dg_hero.clientWidth = 104; els.dg_hero.clientHeight = 68;
  try { open(); has('id="dg_hero"'); const h = H(), gi = h.indexOf('class="dg-grid"'), ge = h.indexOf('class="dg-ft"'), grid = h.slice(gi, ge);
    assert(h.indexOf('id="dg_hero"') < h.indexOf('id="dg_scroll"'), 'o herói fica acima, fora da área rolável da grade');
    assert(!/canvas|dg-hero/.test(grid), 'nada do herói dentro da grade');
    assert.strictEqual((grid.match(/data-x="cell"/g) || []).length + (grid.match(/class="dg-o/g) || []).length, N_, 'a grade inteira continua lá, toda tocável');
    assert.strictEqual(raf.length, 1, 'o laço do herói começa'); raf.shift()(1000); assert.strictEqual(calls.length, 1, 'drawHeroFull chamado'); assert.strictEqual(calls[0].st.mount, false, 'a pé');
    assert(calls[0].x > 0 && calls[0].x < 104 && calls[0].y > 0 && calls[0].y <= 68, 'os pés ficam dentro do canvas do herói');
    const rule = n => (new RegExp('\\.dg-' + n + '\\{([^}]*)\\}').exec(CSS) || ['', ''])[1];
    for (const n of ['hero', 'hero canvas', 'say']) { assert(rule(n), 'regra .dg-' + n); assert(!/position\s*:\s*(absolute|fixed)|margin[^;]*-\d|transform/.test(rule(n)), '.dg-' + n + ' não sai do próprio bloco (não cobre célula)'); }
    assert(!/position\s*:\s*(absolute|fixed)/.test(rule('msg')), 'o aviso fica ao lado do herói, não por cima');
    check('herói'); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar a tela para o laço'); }
  finally { delete g.requestAnimationFrame; delete g.cancelAnimationFrame; delete g.drawHeroFull; delete g.HS; delete els.dg_hero; } }
out.push('herói: desenhado pelo drawHeroFull num canvas acima da grade, a pé; nenhuma célula coberta; o laço para ao fechar');

// 10) larguras e sem fundo; todos os botões em três situações
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); check('largura ' + w); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  let taps = 0; const mid = JSON.stringify(g.S), rich = newSave(); DG.grant(rich, host, 'event'); const sc = DG.layout(0, 0).findIndex(c => c.item && c.item.t === 'stairs') % D.cols; DG.drill(rich, host, sc); DG.grant(rich, host, 'event'); const richJ = JSON.stringify(rich);
  for (const mk of [() => newSave(), () => JSON.parse(mid), () => JSON.parse(richJ)]) { g.S = mk(); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = mk(); open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x); const b2 = buttons().find(q => /dg-bt|data-x="cell"/.test(q.tag)); if (b2) { def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); } } }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('larguras 320 e 390, sem fundo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { D.on = false; Sys.relics.setOn(false); }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
