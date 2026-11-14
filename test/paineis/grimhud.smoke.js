'use strict';
// Teste de fumaça do js/grimhud.js (coluna das magias do Grimório na batalha) em Node: SÓ o lugar dos ícones.
// A tela de mentira repete as contas do js/fullbattle.js (fbLayout: escala, coluna esquerda, barras do herói) e do js/fogueira.js (x1/x2/x4 em coluna
// à direita ou em fila deitada à esquerda), e o teste confere que nenhum ícone das magias cruza retângulo de ninguém em 390x844, 360x780, 360x640 e 320x640.
// Rodar: node test/paineis/grimhud.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const FBS = fs.readFileSync(path.join(R, 'js/fullbattle.js'), 'utf8'), FGS = fs.readFileSync(path.join(R, 'js/fogueira.js'), 'utf8'), SRC = fs.readFileSync(path.join(R, 'js/grimhud.js'), 'utf8');
/* números lidos do código dos vizinhos (se alguém mudar lá, o teste avisa em vez de conferir contra número velho) */
const num = (re, src, what) => { const m = re.exec(src); assert(m, 'não achei no código: ' + what); return +m[1]; };
const Y0 = num(/m\.cy = (\d+) \+ 78 \* li/, FBS, 'topo da coluna esquerda'), KEEP = num(/bottomLim = Hb - (\d+) - 6/, FBS, 'limite de baixo da coluna') + 6;
const KBX = num(/id="fb_kb" style="position:absolute;left:(\d+)px/, FBS, 'x das barras do herói'), KBW = num(/id="fb_kb" style="position:absolute;left:\d+px;top:\d+px;width:(\d+)px/, FBS, 'largura das barras');
const ROW_UP = num(/top:' \+ \(Hb - colH - (\d+)\)/, FGS, 'coluna x1/x2/x4 no canto de baixo'), COL_TOP = num(/let top = (\d+); try \{ if \(typeof FB_MENU/, FGS, 'topo da coluna x1/x2/x4');
assert(/FIELD_FEET=640\/844/.test(fs.readFileSync(path.join(R, 'js/battle.js'), 'utf8')), 'linha dos pés em 640/844');

const mkEl = id => ({ id, style: { getPropertyValue(k) { return this[k] || ''; } }, children: [], parentNode: null, _h: '', set innerHTML(v) { this._h = v; this.children = (v.match(/<div class="grh-s"[^>]*>/g) || []).map(() => ({ style: {}, children: [{}, { style: {} }, {}], setAttribute() {} })); }, get innerHTML() { return this._h; },
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }, remove() {}, querySelector(q) { return q === '.pc-bb' ? this._bb || null : null; } });
let els = {}; g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
g.Panels = { defs: {} }; let list = []; g.GrimBattle = { list: () => list };
g.FB_MENU = [{ id: 'gear', side: 'left' }, { id: 'summon', side: 'left' }, { id: 'shop', side: 'left' }, { id: 'pass', side: 'left' }, { id: 'chest', side: 'right', y: 150 }]; let unl = 4; g.fbUnl = id => id === 'chest' || ['gear', 'summon', 'shop', 'pass'].indexOf(id) < unl;
vm.runInThisContext(SRC, { filename: 'grimhud.js' });
const GH = g.GrimHud; assert(GH && typeof GH.place === 'function' && typeof GH.update === 'function');
const hit = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/* monta a tela de mentira como o fbLayout e a Fogueira deixam; devolve os retângulos dos vizinhos */
function scene(W, H, nLeft, bb, fog) { els = {}; unl = nLeft; const s = Math.min(W / 390, Math.max(1, H / 844)), Hb = H / s, Wb = W / s, feet = (640 / 844 * H) / s, fbt = s < 1 ? 44 / s : 44;
  const host = mkEl('fb_w'); host.style.width = Wb.toFixed(1) + 'px'; host.style.height = Hb.toFixed(1) + 'px'; els.fb_w = host; els.app = mkEl('app'); els.app.style['--fbt'] = fbt.toFixed(1) + 'px';
  const obst = [];
  for (let i = 0; i < nLeft; i++) { const y = Y0 + 78 * i; if (y + 70 <= Hb - KEEP) obst.push({ n: 'ícone esquerdo ' + (i + 1), x: 4, y, w: 66, h: 70 }); }
  if (bb) { host._bb = { style: { top: (Y0 + 78 * nLeft) + 'px' } }; obst.push({ n: 'botão Bênçãos', x: 12, y: Y0 + 78 * nLeft, w: 58, h: 74 }); }
  /* barras do herói: corpo parado de ~160 px na base; vão para x 74 quando um ícone da coluna cruza a altura delas (conta do fbLayout) */
  { const top = feet - 160 - 34; let left = KBX; for (let i = 0; i < nLeft; i++) { const y = Y0 + 78 * i; if (y + 70 > top - 2 && y < top + 24) left = Math.max(left, 74); }
    els.fb_kb = mkEl('fb_kb'); els.fb_kb.style.left = left.toFixed(1) + 'px'; els.fb_kb.style.top = top.toFixed(1) + 'px'; obst.push({ n: 'barras do herói', x: left, y: top, w: KBW, h: 24 });
    obst.push({ n: 'herói', x: 58, y: feet - 160, w: 100, h: 160 }); }
  obst.push({ n: 'Baú', x: Wb - 7 - 62, y: 150, w: 62, h: 62 }); els.fbm_chest = mkEl('fbm_chest'); g.FB_MENU[4].cy = 150;
  obst.push({ n: 'barra da fase', x: 78, y: 60, w: Math.min(300, Wb - 152), h: 58 }); obst.push({ n: 'selo Fraco contra', x: 82, y: 122, w: 236, h: 24 });
  obst.push({ n: 'botão Golpes', x: 6, y: Hb - 144, w: 62, h: 66 });
  const sp = mkEl('fb_spd'), par = mkEl(''); par.appendChild(sp); els.fb_spd = sp; let mode = 'fora';
  if (fog) { const top = Math.max(COL_TOP, 150 + 62 + 8), colH = 3 * fbt + 2 * 2 + 8; obst.push({ n: 'Fogueira', x: Wb / 2 - 62, y: Hb - 120, w: 124, h: 120 });
    if (top + colH <= feet - 240) { par.style.right = '6px'; par.style.top = top.toFixed(0) + 'px'; mode = 'coluna'; obst.push({ n: 'x1/x2/x4 em coluna', x: Wb - 6 - (fbt + 6), y: top, w: fbt + 6, h: colH }); }
    else { const t = Hb - colH - ROW_UP; par.style.right = '6px'; par.style.top = t.toFixed(0) + 'px'; mode = 'fila'; obst.push({ n: 'x1/x2/x4 em coluna, canto de baixo', x: Wb - 6 - (fbt + 6), y: t, w: fbt + 6, h: colH }); } }
  else { par.style.right = '6px'; par.style.top = 'calc(100% - 3 * var(--fbt,44px) - 30px)'; obst.push({ n: 'x1/x2/x4 no lugar de sempre', x: Wb - 6 - (fbt + 6), y: Hb - 3 * fbt - 30, w: fbt + 6, h: 3 * fbt + 10 }); }
  return { host, obst, Hb, Wb, feet, mode }; }
const out = []; let cases = 0, rows = 0, narrow = 0;
for (const [W, H] of [[390, 844], [360, 780], [360, 640], [320, 640], [412, 915]]) for (const nLeft of [0, 1, 2, 3, 4]) for (const bb of [false, true]) for (const fog of [true, false]) for (const n of [1, 2, 3]) {
  const sc = scene(W, H, nLeft, bb, fog), tag = W + 'x' + H + ' ícones ' + nLeft + (bb ? ' +Bênçãos' : '') + (fog ? ' Fogueira(' + sc.mode + ')' : '') + ' magias ' + n;
  list = [{ id: 'a', name: 'Raio', cd: 8, left: 0 }, { id: 'b', name: 'Gelo', cd: 8, left: 3 }, { id: 'c', name: 'Fogo', cd: 8, left: 0 }].slice(0, n);
  GH.unmount(); assert.strictEqual(GH.mount(sc.host), true, tag); assert.strictEqual(GH.update(), true, tag); const P = GH.state.place, html = GH.state.root.innerHTML; assert(P && (P.dir === 'v' || P.dir === 'h'), tag);
  const boxes = [...html.matchAll(/class="grh-s" role="img" style="left:(-?\d+)px;top:(-?\d+)px;width:(\d+)px;height:(\d+)px"/g)].map(m => ({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] })); assert.strictEqual(boxes.length, n, tag + ': um ícone por magia');
  for (const b of boxes) { assert(b.w >= GH.POS.min && b.w === b.h, tag + ': ícone legível'); assert(b.x >= 0 && b.x + b.w <= sc.Wb && b.y >= Y0 && b.y + b.h <= sc.Hb, tag + ': ícone dentro da tela: ' + JSON.stringify(b));
    for (const o of sc.obst) assert(!hit(b, o), tag + ': ícone da magia ' + JSON.stringify(b) + ' cruza ' + o.n + ' ' + JSON.stringify(o)); }
  for (let i = 1; i < boxes.length; i++) assert(!hit(boxes[i - 1], boxes[i]), tag + ': ícones não se cobrem');
  if (P.dir === 'v') assert.strictEqual(P.y, GH.topOf(), tag + ': em pé, logo abaixo do último ícone da coluna'); else { rows++; assert(P.y + P.size <= sc.feet - 240 + 1, tag + ': a fila deitada fica acima da faixa dos inimigos'); }
  if (P.size < GH.POS.size) narrow++; cases++; }
assert(rows > 0 && narrow > 0, 'os três arranjos foram exercitados');
// o lugar do protótipo continua valendo quando nada atrapalha, e sem os vizinhos na tela (teste antigo, tela sem Fogueira)
{ els = {}; unl = 2; const host = mkEl('fb_w'); list = [{ id: 'a', name: 'Raio', cd: 8, left: 0 }, { id: 'b', name: 'Gelo', cd: 8, left: 0 }, { id: 'c', name: 'Fogo', cd: 8, left: 0 }]; GH.unmount(); GH.mount(host); GH.update(); const P = GH.state.place;
  assert.deepStrictEqual([P.dir, P.x, P.y, P.size, P.pitch], ['v', GH.POS.left, Y0 + 78 * 2, GH.POS.size, GH.POS.pitch], 'sem vizinhos: coluna do protótipo (x 7, y 292, 48 px a cada 66)');
  const h0 = GH.state.root.innerHTML; GH.update(); assert.strictEqual(GH.state.root.innerHTML, h0, 'mesma tela: o HTML não é refeito');
  list = []; assert.strictEqual(GH.update(), false, 'sem magia: some'); assert.strictEqual(GH.state.root.innerHTML, ''); GH.unmount(); }
assert(/pointer-events:none/.test(SRC) && !/\p{Extended_Pictographic}/u.test(SRC), 'só leitura, sem emoji');
out.push('lugar das magias: ' + cases + ' cenas (5 telas x 0 a 4 ícones x Bênçãos x Fogueira x 1 a 3 magias) sem cruzar ícones, Bênçãos, barras e corpo do herói, Baú, x1/x2/x4 (coluna, fila deitada ou lugar de sempre), Fogueira, golpes, barra da fase nem o selo Fraco contra');
out.push('arranjos: ' + (cases - rows) + ' em pé (' + narrow + ' com ícone menor ao lado das barras do herói) e ' + rows + ' em fila deitada à direita');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
