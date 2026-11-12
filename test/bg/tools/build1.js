// ERA 1 (Antiguidade): reconstroi camadas, mascaras, decalques e sprites a partir dos brutos.
// uso: node build1.js <pastaTrabalho com raw/ e work/> <pastaSaida>
// brutos (Nano Banana 2, 2K): sky.png far.png mid.png midB.png ground.png (21:9) decals.png props.png props2.png (16:9)
const fs = require('fs'); const { sharp, load, img, keyMagenta, wrap, crop, bbox } = require('./lib.js');
const S = process.argv[2], OUT = process.argv[3]; const info = {};
const save = async (o, name, w, q = 86) => { let s = img(o); if (w && w < o.W) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; return r; };
const prev = async (o, name, w = 1500, bg = '#3f8fd0') => img(o).resize(Math.min(w, o.W)).flatten({ background: bg }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg');
// chroma seguro: o alfa do keyMagenta so vale a ate 3 px do fundo; por dentro a cor original volta (roxo/vermelho nao ficam translucidos)
function safeKey(o, pink) { const orig = Buffer.from(o.d); keyMagenta(o); const { d, W, H } = o, R = 3, bg = new Uint8Array(W * H), t = new Uint8Array(W * H), near = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) if (d[p * 4 + 3] < 128) bg[p] = 1;
  for (let y = 0; y < H; y++) { let c = 0; for (let x = -R; x < W; x++) { const a = x + R, b = x - R - 1; if (a < W && bg[y * W + a]) c++; if (b >= 0 && bg[y * W + b]) c--; if (x >= 0 && c > 0) t[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let c = 0; for (let y = -R; y < H; y++) { const a = y + R, b = y - R - 1; if (a < H && t[a * W + x]) c++; if (b >= 0 && t[b * W + x]) c--; if (y >= 0 && c > 0) near[y * W + x] = 1; } }
  for (let p = 0; p < W * H; p++) { const i = p * 4; if (!near[p]) { d[i] = orig[i]; d[i + 1] = orig[i + 1]; d[i + 2] = orig[i + 2]; d[i + 3] = 255; } else if (pink && d[i + 3] > 0 && d[i] - d[i + 1] > 50 && d[i + 2] > d[i + 1] - 10 && d[i] + d[i + 1] + d[i + 2] >= 200) d[i + 2] = Math.round(d[i + 1] * 0.55); }   // traco laranja fino sobre magenta ficava rosa
  return o; }
const runs = (occ, minGap, minLen = 8) => { const out = []; let a = -1, gap = 0; for (let i = 0; i <= occ.length; i++) { const on = i < occ.length && occ[i]; if (on) { if (a < 0) a = i; gap = 0; } else if (a >= 0) { gap++; if (gap >= minGap || i === occ.length) { const b = i - gap; if (b - a + 1 >= minLen) out.push([a, b]); a = -1; gap = 0; } } } return out; };
const occX = (o, x0, x1, y0, y1) => { const r = new Uint8Array(x1 - x0); for (let x = x0; x < x1; x++) { let c = 0; for (let y = y0; y < y1; y++) if (o.d[(y * o.W + x) * 4 + 3] > 60 && ++c > 1) break; r[x - x0] = c > 1; } return r; };
const occY = (o, x0, x1, y0, y1) => { const r = new Uint8Array(y1 - y0); for (let y = y0; y < y1; y++) { let c = 0; for (let x = x0; x < x1; x++) if (o.d[(y * o.W + x) * 4 + 3] > 60 && ++c > 1) break; r[y - y0] = c > 1; } return r; };
// corte XY: linhas (vao >= gy) -> colunas (vao >= gx) -> recorte justo
function cells(o, gy, gx) { return runs(occY(o, 0, o.W, 0, o.H), gy, 30).map(([ya, yb]) => runs(occX(o, 0, o.W, ya, yb + 1), gx, 12).map(([xa, xb]) => { const ys = runs(occY(o, xa, xb + 1, ya, yb + 1), 1e9, 4)[0]; return { x0: xa, x1: xb, y0: ya + ys[0], y1: ya + ys[1] }; })); }
const cut = (o, c, pad = 3) => { const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad), x1 = Math.min(o.W, c.x1 + pad + 1), y1 = Math.min(o.H, c.y1 + pad + 1); return crop(o, x0, y0, x1 - x0, y1 - y0); };
// componentes conexos (alfa>60), fundidos quando as caixas ficam a menos de md px; devolve linhas (cortes em fracao da altura) ordenadas por x
function blobs(o, md, minArea, cutsY) { const { d, W, H } = o, lab = new Int32Array(W * H), cs = [];
  for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 60) continue; const st = [p0]; lab[p0] = 1; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
    while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !lab[p - 1] && d[(p - 1) * 4 + 3] > 60) { lab[p - 1] = 1; st.push(p - 1); } if (x < W - 1 && !lab[p + 1] && d[(p + 1) * 4 + 3] > 60) { lab[p + 1] = 1; st.push(p + 1); } if (y > 0 && !lab[p - W] && d[(p - W) * 4 + 3] > 60) { lab[p - W] = 1; st.push(p - W); } if (y < H - 1 && !lab[p + W] && d[(p + W) * 4 + 3] > 60) { lab[p + W] = 1; st.push(p + W); } }
    if (n >= 30) cs.push({ x0, y0, x1, y1, n }); }
  let ch = true; while (ch) { ch = false; for (let i = 0; i < cs.length && !ch; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j]; if (a.x0 - md <= b.x1 && b.x0 - md <= a.x1 && a.y0 - md <= b.y1 && b.y0 - md <= a.y1) { a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0); a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1); a.n += b.n; cs.splice(j, 1); ch = true; break; } } }
  const big = cs.filter(c => c.n >= minArea), rows = cutsY.map(() => []); rows.push([]); for (const c of big) { const cy = (c.y0 + c.y1) / 2 / H; let k = 0; while (k < cutsY.length && cy >= cutsY[k]) k++; rows[k].push(c); } rows.forEach(r => r.sort((a, b) => a.x0 - b.x0)); return rows; }
const flop = o => { const out = Buffer.alloc(o.d.length); for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) o.d.copy(out, (y * o.W + x) * 4, (y * o.W + o.W - 1 - x) * 4, (y * o.W + o.W - x) * 4); return { d: out, W: o.W, H: o.H }; };
const spr = async (o, name, w, q = 86) => { const r = await img(o).resize(Math.min(w, o.W)).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr = info.spr || {}; info.spr[name] = [r.width, r.height]; };
const maskOut = async (hit, W, bx0, by0, w, h, name, outW) => { const d = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const j = (y * w + x) * 4; d[j] = d[j + 1] = d[j + 2] = 255; d[j + 3] = hit[(y + by0) * W + x + bx0] ? 255 : 0; }
  const r = await sharp(d, { raw: { width: w, height: h, channels: 4 } }).blur(1.1).resize(outW).webp({ quality: 80, alphaQuality: 90 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); };

(async () => {
  // ---------------- ceu + mar (bordas sem nuvem): emenda nele mesmo; linha do horizonte medida
  const sky = wrap(await load(S + '/raw/sky.png'), 48);
  { const { d, W, H } = sky; let hy = 0, best = 0; for (let y = Math.round(H * 0.5); y < H * 0.85; y++) { let s = 0; for (let x = 0; x < W; x += 16) { const i = (y * W + x) * 4, j = ((y - 4) * W + x) * 4; s += (d[j] + d[j + 1]) - (d[i] + d[i + 1]); } if (s > best) { best = s; hy = y; } } info.horizon = (hy - 2) / H; console.log('horizonte', hy, info.horizon); }
  await save(sky, 'sky', 2048, 88);

  // ---------------- far: colina da acropole + montanhas; corta nos dois picos laterais (espelho vira pico simetrico) e na linha d'agua
  let far = safeKey(await load(S + '/raw/far.png'));
  { const { d, W, H } = far; const topAt = x => { let y = 0; while (y < H && d[(y * W + x) * 4 + 3] < 128) y++; return y; };
    const peak = (a, b) => { let bx = a, by = 1e9; for (let x = a; x < b; x++) { const t = topAt(x); if (t < by) { by = t; bx = x; } } return bx; };
    const xl = peak(700, 950), xr = peak(2450, 2750), bb = bbox(far, 60); console.log('far picos', xl, xr, 'bbox', bb);
    far = crop(far, xl, bb.y0 - 8, xr - xl, bb.y1 + 1 - (bb.y0 - 8)); }
  for (let p = 0; p < far.W * far.H; p++) { const i = p * 4, m = Math.min(far.d[i], far.d[i + 2]) - far.d[i + 1]; if (m > 45 && far.d[i] > 150) { far.d[i] = Math.round(far.d[i + 1] * 0.9); far.d[i + 2] = Math.round(far.d[i + 1] * 1.05); } }
  await save(far, 'far', 1536, 88); await prev(far, 'far');

  // ---------------- mid A / mid B
  const Ar = await load(S + '/raw/mid.png');
  { // arvore cortada na borda direita do A: sai (cor da oliveira + contorno colado), areia refeita embaixo, contorno refeito no toldo/sacos
    const { d, W, H } = Ar, X0 = 2894, Y0 = 520, SAND = 1178;
    const mag = i => d[i] > 200 && d[i + 2] > 200 && d[i + 1] < 90, magish = i => Math.min(d[i], d[i + 2]) - d[i + 1] > 40, dark = i => d[i] + d[i + 1] + d[i + 2] < 200;
    const sand = i => d[i] > 215 && d[i + 1] > 180 && d[i + 2] < 195 && d[i] - d[i + 2] > 55;
    const tree = i => { const r = d[i], g = d[i + 1], b = d[i + 2]; if (mag(i) || magish(i) || dark(i) || sand(i)) return false; return r - b < 55 && b - r < 25 && Math.abs(r - g) < 45; };
    const w = W - X0, h = H - Y0, T = new Uint8Array(w * h), N = new Uint8Array(w * h), R = 8;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (tree(((y + Y0) * W + x + X0) * 4)) T[y * w + x] = 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!T[y * w + x]) continue; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) N[yy * w + xx] = 1; } }
    const rem = new Uint8Array(w * h); let n = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = ((y + Y0) * W + x + X0) * 4; if (T[y * w + x] || (N[y * w + x] && (dark(i) || magish(i)) && !mag(i))) { rem[y * w + x] = 1; n++; } }
    const sandRow = y => { const c = [[], [], []]; for (let x = 2500; x < W; x += 2) { const i = (y * W + x) * 4; if (sand(i)) for (let q = 0; q < 3; q++) c[q].push(d[i + q]); } return c[0].length > 20 ? c.map(v => v.sort((a, b) => a - b)[v.length >> 1]) : null; };
    for (let y = 0; y < h; y++) { const yy = y + Y0, sr = yy >= SAND ? sandRow(yy) : null; for (let x = 0; x < w; x++) { if (!rem[y * w + x]) continue; const i = (yy * W + x + X0) * 4; if (sr) { d[i] = sr[0]; d[i + 1] = sr[1]; d[i + 2] = sr[2]; } else { d[i] = 255; d[i + 1] = 0; d[i + 2] = 255; } } }
    // contorno novo: pixel removido (acima da areia) a ate 4 px de cor que ficou (toldo, poste, saco)
    const keepCol = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h || rem[y * w + x]) return false; const i = ((y + Y0) * W + x + X0) * 4; return !mag(i) && !magish(i) && !dark(i); };
    const ol = []; for (let y = 0; y < h && y + Y0 < SAND - 2; y++) for (let x = 0; x < w; x++) { if (!rem[y * w + x]) continue; let hit = false; for (let dy = -4; dy <= 4 && !hit; dy++) for (let dx = -4; dx <= 4; dx++) if (dx * dx + dy * dy <= 18 && keepCol(x + dx, y + dy)) { hit = true; break; } if (hit) ol.push(((y + Y0) * W + x + X0) * 4); }
    ol.forEach(i => { d[i] = 44; d[i + 1] = 30; d[i + 2] = 34; }); console.log('arvore direita removida:', n, 'px; contorno refeito:', ol.length); }
  const A = safeKey(Ar, true), B = safeKey(await load(S + '/raw/midB.png'), true);
  { // oliveira da esquerda do A encosta na borda: a silhueta esquerda passa a ser o espelho da direita (eixo AX) e ganha contorno
    const { d, W, H } = A, AX = 213, al = (x, y) => (x < 0 || x >= W) ? 0 : d[(y * W + x) * 4 + 3]; let ya = -1, yb = -1; for (let y = 0; y < 1150; y++) if (al(1, y) > 128) { if (ya < 0) ya = y; yb = y; }
    let top = ya; for (let y = ya; y > 0; y--) { let any = false; for (let x = 0; x < 430; x++) if (al(x, y) > 128) { any = true; break; } if (!any) break; top = y; }
    const car = new Uint8Array(W * H); let n = 0; for (let y = top; y <= yb + 90; y++) for (let x = 0; x < (y > yb + 12 ? 60 : AX); x++) if (al(x, y) > 0 && al(2 * AX - x, y) < 128) { car[y * W + x] = 1; n++; }
    const ol = []; for (let y = top; y <= yb + 96; y++) for (let x = 0; x < AX + 6; x++) { if (car[y * W + x] || al(x, y) < 128) continue; let hit = false; for (let dy = -5; dy <= 5 && !hit; dy++) for (let dx = -5; dx <= 5; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && dx * dx + dy * dy <= 27 && car[yy * W + xx]) { hit = true; break; } } if (hit) ol.push((y * W + x) * 4); }
    for (let p = 0; p < W * H; p++) if (car[p]) d[p * 4 + 3] = 0; ol.forEach(i => { d[i] = 44; d[i + 1] = 36; d[i + 2] = 40; d[i + 3] = 255; }); console.log('oliveira esquerda: linhas', top, ya, yb, 'recortados', n, 'contorno', ol.length); }
  const clean = o => { const { d, W, H } = o, lab = new Uint8Array(W * H); let n = 0;
    for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 40) continue; const st = [p0], all = [p0]; lab[p0] = 1; while (st.length && all.length < 700) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); all.push(q); } }
      if (all.length < 700) { all.forEach(p => { d[p * 4 + 3] = 0; }); n++; } else while (st.length) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); } } }
    let m = 0; for (let x = 0; x < W; x++) { let y = 1100; while (y < H && d[(y * W + x) * 4 + 3] < 128) y++; if (y > 1215 || y < 1160) continue; for (let k = y; k < y + 16; k++) { const i = (k * W + x) * 4, r = d[i], g = d[i + 1], b = d[i + 2]; if (r > 120 && r < 232 && g > 60 && g < 175 && b < 120 && r - b > 70) { d[i] = 250; d[i + 1] = 222; d[i + 2] = 150; m++; } } }
    for (let y = 1120; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (Math.abs(d[i] - 253) < 14 && Math.abs(d[i + 1] - 225) < 16 && Math.abs(d[i + 2] - 158) < 26) { d[i + 1] -= 7; d[i + 2] -= 28; } }   // areia clara do mid no tom da areia do chao
    console.log('limpeza: soltos', n, 'linha da areia', m); };
  clean(A); clean(B);
  const bA = bbox(A, 60), bB = bbox(B, 60), top = Math.min(bA.y0, bB.y0) - 6, Hc = A.H - top; console.log('mid bbox', bA, bB, 'top', top, 'Hc', Hc); info.midTop = top; info.midRaw = [A.W, Hc];
  const cA = crop(A, 0, top, A.W, Hc), cB = crop(B, 0, top, B.W, Hc);
  { // mascaras de agua do mid B: queda do aqueduto (2 jogos de fios alternados, para as faixas andarem em ritmos diferentes) e fonte
    const { d, W, H } = cB, water = i => d[i + 3] > 128 && ((d[i + 2] > 175 && d[i + 2] >= d[i] + 22 && d[i + 1] > 140) || (d[i] > 225 && d[i + 1] > 236 && d[i + 2] > 240));
    const region = (x0, y0, x1, y1) => { const hit = new Uint8Array(W * H); let bx0 = 1e9, by0 = 1e9, bx1 = -1, by1 = -1; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (water((y * W + x) * 4)) { hit[y * W + x] = 1; if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } return { hit, bx0: bx0 - 3, by0: by0 - 3, w: bx1 - bx0 + 7, h: by1 - by0 + 7 }; };
    const F = region(960, 290 - top, 1130, 1190 - top); info.fall = [F.bx0 / W, F.by0 / H, F.w / W, F.h / H]; console.log('queda', F.bx0, F.by0 + top, F.w, F.h);
    const sA = new Uint8Array(W * H), sB = new Uint8Array(W * H); let x = F.bx0, k = 0, s = 7; while (x < F.bx0 + F.w) { const ww = 7 + ((s = (s * 53 + 11) % 97) % 9); for (let xx = x; xx < Math.min(F.bx0 + F.w, x + ww); xx++) for (let y = F.by0; y < F.by0 + F.h; y++) if (F.hit[y * W + xx]) (k % 2 ? sB : sA)[y * W + xx] = 1; x += ww; k++; }
    await maskOut(F.hit, W, F.bx0, F.by0, F.w, F.h, 'fall', 96); await maskOut(sA, W, F.bx0, F.by0, F.w, F.h, 'fallA', 96); await maskOut(sB, W, F.bx0, F.by0, F.w, F.h, 'fallB', 96);
    const Q = region(1150, 840 - top, 1600, 1140 - top); info.fount = [Q.bx0 / W, Q.by0 / H, Q.w / W, Q.h / H]; console.log('fonte', Q.bx0, Q.by0 + top, Q.w, Q.h); await maskOut(Q.hit, W, Q.bx0, Q.by0, Q.w, Q.h, 'fount', 200); }
  await save(cA, 'midA', 2640, 80); await save(cB, 'midB', 2640, 80); await prev(cA, 'midA', 1584); await prev(cB, 'midB', 1584);
  for (const n of ['midA', 'midB']) { const r = await sharp(OUT + '/' + n + '.webp').resize(880).webp({ quality: 64, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); }
  for (const [l, r, n] of [[cA, cB, 'AB'], [cB, cA, 'BA']]) { const w = 700; const L = await img(crop(l, l.W - w, 0, w, Hc)).png().toBuffer(), R = await img(crop(r, 0, 0, w, Hc)).png().toBuffer();
    await sharp({ create: { width: 2 * w, height: Hc, channels: 4, background: '#3f8fd0' } }).composite([{ input: L, left: 0, top: 0 }, { input: R, left: w, top: 0 }]).jpeg({ quality: 84 }).toFile(S + '/work/seam_' + n + '.jpg'); }

  // ---------------- chao: a calcada veio periodica (P px); recorta um periodo exato e emenda nele mesmo
  let g = safeKey(await load(S + '/raw/ground.png')); const bg = bbox(g, 60); const gy0 = bg.y0 - 2; g = crop(g, 0, gy0, g.W, g.H - gy0);
  { const { d, W, H } = g; const err = P => { let s = 0, n = 0; for (let y = 60; y < H - 20; y += 3) for (let x = 0; x < 400; x += 2) { const i = (y * W + x) * 4, j = (y * W + x + P) * 4; s += Math.abs(d[i] - d[j]) + Math.abs(d[i + 1] - d[j + 1]) + Math.abs(d[i + 2] - d[j + 2]); n++; } return s / n; };
    let P = 0, be = 1e9; for (let p = 1400; p <= 1800; p++) { const e = err(p); if (e < be) { be = e; P = p; } } console.log('periodo da calcada', P, 'erro', be.toFixed(1));
    const PAV = [596, 1099]; info.road = [(PAV[0] - gy0) / H, (PAV[1] - gy0) / H]; info.curb = [(520 - gy0) / H, (1176 - gy0) / H]; console.log('chao H', H, 'calcada', info.road, 'guias', info.curb);
    // contorno escuro do topo da areia: recolore para a cor da areia e esmaece (sem linha entre camadas)
    const sc = [254, 219, 132]; for (let x = 0; x < W; x++) { let k = 0; for (let y = 0; y < 60; y++) { const i = (y * W + x) * 4; if (d[i + 3] < 10) continue; const lum = d[i] + d[i + 1] + d[i + 2]; if (y < 34 && lum < 560) { const t = Math.min(1, (560 - lum) / 200); for (let q = 0; q < 3; q++) d[i + q] = Math.round(d[i + q] + (sc[q] - d[i + q]) * t); } if (k < 12) { d[i + 3] = Math.round(d[i + 3] * (k + 1) / 13); k++; } } }
    g = wrap(crop(g, 0, 0, P + 24, H), 24); }
  await save(g, 'ground', 1280, 90); await prev(g, 'ground');

  // ---------------- decalques: grade 4 x 5 sobre magenta
  const D = safeKey(await load(S + '/raw/decals.png'));
  { const names = [['amph', 'shards', 'amphHalf', 'bits', 'plate'], ['branch', 'wreath', 'leaves', 'twig', 'dry'], ['coins3', 'coin', 'coinpile', 'pouch', 'pebbles'], ['slab1', 'slab2', 'cracks', 'tuft1', 'tuft2']];
    const R0 = await load(S + '/raw/decals.png'); const rows = cells(D, 40, 70); console.log('decals', rows.map(r => r.length));
    const SC = 0.42, AW = 1100; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const ce = rows[r][c], sub = cut(D, ce, 4), nm = names[r][c];
      if (nm === 'cracks') { const o = cut(R0, ce, 4); for (let p = 0; p < sub.W * sub.H; p++) { const i = p * 4, a = Math.max(0, Math.min(1, (235 - o.d[i]) / 95)); sub.d[i] = 104; sub.d[i + 1] = 76; sub.d[i + 2] = 58; sub.d[i + 3] = Math.round(255 * a * 0.9); } }   // rachaduras vieram roxas: viram marrom, alfa pela distancia ao magenta
      const ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; }
      comp.push({ input: await img(sub).resize(ww, hh).png().toBuffer(), left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#ead7b2' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: nuvens + sol / pomba em 4 quadros / braseiro, 2 trirremes, 2 barras de toldo
  const P1 = safeKey(await load(S + '/raw/props.png')); let R = blobs(P1, 24, 4000, [0.32, 0.64]); console.log('props1', R.map(r => r.length));
  for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 480, 82); await spr(cut(P1, R[0][3]), 'sun', 220, 86);
  { const F = 760, frames = []; for (const c of R[1].slice(0, 4)) { const o = cut(P1, c, 2); let sx = 0, sy = 0, n = 0; for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) { const i = (y * o.W + x) * 4; if (o.d[i + 3] > 200 && o.d[i] > 215 && o.d[i + 1] > 120 && o.d[i + 1] < 190 && o.d[i + 2] < 110) { sx += x; sy += y; n++; } }   // alinha pelo bico (laranja)
      const bx = Math.round(sx / n), by = Math.round(sy / n); frames.push({ input: await img(o).png().toBuffer(), left: frames.length * F + 490 - bx, top: 380 - by }); console.log('pomba', o.W, o.H, 'bico', bx, by, n); }
    const sheet = await sharp({ create: { width: F * 4, height: F, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames).png().toBuffer();
    const r = await sharp(sheet).resize(160 * 4).webp({ quality: 88, alphaQuality: 100 }).toFile(OUT + '/dove.webp'); console.log('dove', r.width, r.height, Math.round(r.size / 1024) + 'KB'); await sharp(sheet).resize(1200).flatten({ background: '#3f8fd0' }).jpeg().toFile(S + '/work/p_dove.jpg'); }
  await spr(cut(P1, R[2][0]), 'brazier', 240); await spr(cut(P1, R[2][1]), 'ship1', 260); await spr(cut(P1, R[2][2]), 'ship2', 220);
  { const vs = R[2].slice(3).sort((a, b) => a.y0 - b.y0), nm = ['awnR', 'awnB'];
    for (let k = 0; k < 2; k++) { const o = cut(P1, vs[k], 2), hw = o.W >> 1; const tr = Math.round(o.H * (k ? 0.133 : 0.11));   // tira a faixa clara do topo da barra (virava um risco reto sobre as bancas)
      await spr(crop(o, 0, tr, hw, o.H - tr), nm[k] + '1', 200); await spr(crop(o, hw, tr, o.W - hw, o.H - tr), nm[k] + '2', 200); } }

  // ---------------- folha 2: plantas e ruinas do primeiro plano / oliveira, cipreste, gato, cabra, anfora / haste, 2 flamulas, tocheiro, herma, escudo
  const P2 = safeKey(await load(S + '/raw/props2.png')); R = blobs(P2, 24, 4000, [0.31, 0.63]); console.log('props2', R.map(r => r.length));
  const n1 = ['laurel', 'drygrass', 'poppy', 'acanthus', 'drum', 'capital'], n2 = ['olive', 'cypress', 'cat', 'goat', 'amphora'], w1 = [380, 380, 360, 380, 340, 300], w2 = [380, 200, 340, 340, 220];
  for (let i = 0; i < 6; i++) await spr(cut(P2, R[0][i]), n1[i], w1[i], 84); for (let i = 0; i < 5; i++) await spr(cut(P2, R[1][i]), n2[i], w2[i], 86);
  const r3 = R[2]; await spr(cut(P2, r3[0]), 'aquila', 120); await spr(flop(cut(P2, r3[1])), 'flag1', 300); await spr(flop(cut(P2, r3[2])), 'flag2', 300); await spr(cut(P2, r3[3]), 'torch', 130); await spr(cut(P2, r3[4]), 'herm', 170); await spr(cut(P2, r3[5]), 'shield', 240);

  // ---------------- brilho do mar: mascara procedural de tracos horizontais (o flow acende os tracos em ondas)
  { const W = 640, H = 120; let s = 12345; const rn = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">';
    for (let i = 0; i < 150; i++) { const v = Math.pow(rn(), 1.4), y = 3 + v * (H - 8), sc = 0.45 + 0.9 * v, w = (8 + rn() * 22) * sc, h = (1.6 + rn() * 1.6) * sc, x = rn() * W, o = (0.55 + 0.45 * rn()).toFixed(2);
      for (const dx of [-W, 0, W]) svg += '<ellipse cx="' + (x + dx).toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (w / 2).toFixed(1) + '" ry="' + (h / 2).toFixed(1) + '" fill="#fff" fill-opacity="' + o + '"/>'; }
    svg += '</svg>'; const r = await sharp(Buffer.from(svg)).webp({ quality: 80, alphaQuality: 90 }).toFile(OUT + '/glint.webp'); console.log('glint', r.width, r.height, Math.round(r.size / 1024) + 'KB'); }
  fs.writeFileSync(S + '/work/info.json', JSON.stringify(info, null, 1));
})();
