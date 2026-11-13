'use strict';
/* FOLHA EM GRADE (campo opcional "cols" do .json): o ajudante único sheetSX/sheetSY/sheetXY (js/stage.js) devolve o MESMO quadro lógico numa folha em tira
   (sem cols) e na mesma folha reembalada em grade (com cols). Sem navegador: lê as 3 definições do js/stage.js e monta duas folhas de mentira (cada "pixel"
   guarda o número do quadro e a posição dentro da célula). Sai com código 1 se algo falhar.   node test/e2e/sheetgrid.js */
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'stage.js'), 'utf8');
const pick = re => { const m = re.exec(src); if (!m) { console.log('FALHA  definição não encontrada no js/stage.js: ' + re); process.exit(1); } return m[0]; };
const code = [pick(/^const sheetSX = .*$/m), pick(/^const sheetSY = .*$/m), pick(/^function sheetXY\(M, f\)\{.*$/m)].join('\n') + '\nreturn { sheetSX, sheetSY, sheetXY };';
const { sheetSX, sheetSY, sheetXY } = new Function(code)();
let fails = 0, n = 0; const check = (name, ok, extra) => { n++; if (!ok) { fails++; console.log('FALHA  ' + name + (extra ? ' → ' + extra : '')); } };
/* folha de mentira: largura × altura de pixels; cada pixel = "quadro:x:y" */
function build(frames, w, h, cols) { const C = cols > 0 ? cols : frames, R = Math.ceil(frames / C), W = C * w, H = R * h, px = new Array(W * H).fill(null);
  for (let f = 0; f < frames; f++) { const cx = (f % C) * w, cy = Math.floor(f / C) * h; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) px[(cy + y) * W + cx + x] = f + ':' + x + ':' + y; }
  return { W, H, px }; }
const cell = (S, sx, sy, w, h) => { const out = []; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out.push(sx + x < S.W && sy + y < S.H ? S.px[(sy + y) * S.W + sx + x] : 'FORA'); return out.join(','); };
for (const [frames, w, h, cols] of [[17, 4, 3, 5], [12, 5, 2, 4], [24, 3, 3, 8], [18, 4, 4, 18], [49, 2, 2, 7], [8, 6, 2, 3], [1, 4, 4, 1]]) {
  const strip = build(frames, w, h, 0), grid = build(frames, w, h, cols), M0 = { frames, w, h }, M1 = { frames, w, h, cols };
  check('grade ' + cols + ' colunas cabe em menos largura que a tira (' + frames + ' quadros)', grid.W <= strip.W && grid.W === Math.min(frames, cols) * w);
  for (let f = 0; f < frames; f++) {
    const a = cell(strip, sheetSX(M0, f), sheetSY(M0, f), w, h), b = cell(grid, sheetSX(M1, f), sheetSY(M1, f), w, h);
    check('quadro ' + f + ' igual na tira e na grade (' + frames + ' quadros, ' + cols + ' colunas)', a === b && a.indexOf('FORA') < 0 && a.split(',')[0] === f + ':0:0', a.slice(0, 40) + ' | ' + b.slice(0, 40));
    const o = sheetXY(M1, f); check('sheetXY = sheetSX/sheetSY (quadro ' + f + ')', o.sx === sheetSX(M1, f) && o.sy === sheetSY(M1, f));
    check('sem cols: uma linha só (quadro ' + f + ')', sheetSX(M0, f) === f * w && sheetSY(M0, f) === 0); } }
for (const bad of [0, null, undefined, -3]) check('cols ' + bad + ' = tira', sheetSX({ w: 10, h: 5, cols: bad }, 7) === 70 && sheetSY({ w: 10, h: 5, cols: bad }, 7) === 0);
console.log(fails ? fails + ' FALHA(S) em ' + n + ' verificações' : 'FOLHA EM GRADE: TUDO OK (' + n + ' verificações)'); process.exit(fails ? 1 : 0);
