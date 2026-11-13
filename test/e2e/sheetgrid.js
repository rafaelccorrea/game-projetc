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
/* GRADE x IMAGEM (Engenheiro 13; caso do QA: chefe da era 0 piscando depois do reembalo). (1) sheetFix (js/stage.js): com o .json e o .png de versões diferentes
   (um em grade, outro em tira) TODO quadro tem de continuar com a origem DENTRO da imagem; (2) no disco, toda folha com "cols" tem a imagem do tamanho que a grade
   pede; (3) as folhas dos inimigos e do chefe (run, attack, hurt, die) de todas as eras passam pelo mesmo cálculo que o enFrame do js/battle.js usa. */
const sheetFix = new Function(pick(/^function sheetFix\(M, iw, ih\)\{.*$/m) + '\nreturn sheetFix;')();
const inside = (M, cols, iw, ih) => { const Q = Object.assign({}, M, { cols }); for (let f = 0; f < M.frames; f++) { const sx = sheetSX(Q, f), sy = sheetSY(Q, f); if (!(sx >= 0 && sy >= 0 && sx + M.w <= iw && sy + M.h <= ih)) return f; } return -1; };
for (const [frames, w, h, cols] of [[12, 544, 352, 6], [13, 544, 352, 7], [8, 544, 352, 4], [22, 448, 384, 8], [38, 448, 384, 8]]) {
  const M = { frames, w, h, cols }, rows = Math.ceil(frames / cols), tag = frames + ' quadros, ' + cols + ' colunas';
  check('json em grade + imagem em grade: cols do json (' + tag + ')', sheetFix(M, cols * w, rows * h) === cols);
  check('json em grade + imagem ainda em TIRA: desenha como tira (' + tag + ')', sheetFix(M, frames * w, h) === 0 && inside(M, sheetFix(M, frames * w, h), frames * w, h) < 0, 'sem o conserto o quadro ' + inside(M, cols, frames * w, h) + ' cai fora da imagem');
  check('controle: sem o conserto esse caso cai fora da imagem (' + tag + ')', inside(M, cols, frames * w, h) >= 0);
  check('json em TIRA + imagem já em grade: usa as colunas da imagem (' + tag + ')', sheetFix({ frames, w, h }, cols * w, rows * h) === cols && inside(M, cols, cols * w, rows * h) < 0);
  check('json em tira + imagem em tira: tira (' + tag + ')', sheetFix({ frames, w, h }, frames * w, h) === 0); }
check('sheetFix sem medidas não inventa grade', sheetFix({ frames: 0, w: 0, h: 0 }, 100, 100) === 0 && sheetFix({ frames: 12, w: 10, h: 10, cols: 6 }, 0, 0) === 6);
{ const ROOT = path.join(__dirname, '..', '..', 'assets'), pngSize = f => { const b = Buffer.alloc(24), fd = fs.openSync(f, 'r'); fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
  let grids = 0, en = 0; const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name);
      if (f.isDirectory()) { if (!/^_|masks/.test(f.name)) walk(p); continue; } if (!/\.json$/.test(f.name)) continue; const png = p.replace(/\.json$/, '.png'); if (!fs.existsSync(png)) continue;
      let M = null; try { M = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { continue; } if (!M || !(M.frames > 0) || !(M.w > 0) || !(M.h > 0)) continue;
      const isEn = /anim[\\/]hyb[\\/]enemy[\\/]era\d+_(e0|e1|boss)_(run|attack|hurt|die)\.json$/.test(p); if (!(M.cols > 0) && !isEn) continue;
      const [iw, ih] = pngSize(png), rel = path.relative(ROOT, png), c = M.cols > 0 ? M.cols : 0, bad = inside(M, c, iw, ih);
      if (M.cols > 0) { grids++; check('disco: grade do json cabe na imagem · ' + rel, bad < 0 && sheetFix(M, iw, ih) === c, 'imagem ' + iw + 'x' + ih + ', json ' + M.frames + ' quadros de ' + M.w + 'x' + M.h + ', cols ' + c + ', quadro ' + bad + ' fora'); }
      if (isEn) { en++; check('disco: inimigo/chefe, todo quadro dentro da imagem · ' + rel, bad < 0, 'imagem ' + iw + 'x' + ih + ', quadro ' + bad + ' fora (cols ' + c + ')'); } } };
  if (fs.existsSync(path.join(ROOT, 'anim'))) { walk(path.join(ROOT, 'anim')); check('disco: há folhas em grade e folhas de inimigo para conferir', grids > 0 && en > 0, grids + ' em grade, ' + en + ' de inimigo'); } }
console.log(fails ? fails + ' FALHA(S) em ' + n + ' verificações' : 'FOLHA EM GRADE: TUDO OK (' + n + ' verificações)'); process.exit(fails ? 1 : 0);
