// ERA 4 (Industrial, steampunk vitoriano): reconstroi camadas, mascaras, decalques e sprites a partir dos brutos.
// uso: node build4.js <pastaTrabalho com raw/ e work/> <pastaSaida> [etapas separadas por virgula]
// brutos (Nano Banana 2, 2K): sky.png far.png mid.png midB.png ground.png (21:9) decals.png props.png props2.png (16:9)
const fs = require('fs'); const { sharp, load, img, keyMagenta, wrap, crop, bbox } = require('./lib.js');
const S = process.argv[2], OUT = process.argv[3]; const info = { spr: {} };
const save = async (o, name, w, q = 86) => { let s = img(o); if (w && w < o.W) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; return r; };
const prev = async (o, name, w = 1500, bg = '#f0b866') => img(o).resize(Math.min(w, o.W)).flatten({ background: bg }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg');
// chroma seguro: o alfa do keyMagenta so vale a ate 3 px do fundo; por dentro a cor original volta (vermelho/rosa nao ficam translucidos)
function safeKey(o, pink) { const orig = Buffer.from(o.d); keyMagenta(o); const { d, W, H } = o, R = 3, bg = new Uint8Array(W * H), t = new Uint8Array(W * H), near = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) if (d[p * 4 + 3] < 128) bg[p] = 1;
  for (let y = 0; y < H; y++) { let c = 0; for (let x = -R; x < W; x++) { const a = x + R, b = x - R - 1; if (a < W && bg[y * W + a]) c++; if (b >= 0 && bg[y * W + b]) c--; if (x >= 0 && c > 0) t[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let c = 0; for (let y = -R; y < H; y++) { const a = y + R, b = y - R - 1; if (a < H && t[a * W + x]) c++; if (b >= 0 && t[b * W + x]) c--; if (y >= 0 && c > 0) near[y * W + x] = 1; } }
  for (let p = 0; p < W * H; p++) { const i = p * 4; if (!near[p]) { d[i] = orig[i]; d[i + 1] = orig[i + 1]; d[i + 2] = orig[i + 2]; d[i + 3] = 255; } else if (pink && d[i + 3] > 0 && d[i] - d[i + 1] > 50 && d[i + 2] > d[i + 1] - 10 && d[i] + d[i + 1] + d[i + 2] >= 200) d[i + 2] = Math.round(d[i + 1] * 0.55); }
  return o; }
const runs = (occ, minGap, minLen = 8) => { const out = []; let a = -1, gap = 0; for (let i = 0; i <= occ.length; i++) { const on = i < occ.length && occ[i]; if (on) { if (a < 0) a = i; gap = 0; } else if (a >= 0) { gap++; if (gap >= minGap || i === occ.length) { const b = i - gap; if (b - a + 1 >= minLen) out.push([a, b]); a = -1; gap = 0; } } } return out; };
const occX = (o, x0, x1, y0, y1) => { const r = new Uint8Array(x1 - x0); for (let x = x0; x < x1; x++) { let c = 0; for (let y = y0; y < y1; y++) if (o.d[(y * o.W + x) * 4 + 3] > 60 && ++c > 1) break; r[x - x0] = c > 1; } return r; };
const occY = (o, x0, x1, y0, y1) => { const r = new Uint8Array(y1 - y0); for (let y = y0; y < y1; y++) { let c = 0; for (let x = x0; x < x1; x++) if (o.d[(y * o.W + x) * 4 + 3] > 60 && ++c > 1) break; r[y - y0] = c > 1; } return r; };
function cells(o, gy, gx) { return runs(occY(o, 0, o.W, 0, o.H), gy, 30).map(([ya, yb]) => runs(occX(o, 0, o.W, ya, yb + 1), gx, 12).map(([xa, xb]) => { const ys = runs(occY(o, xa, xb + 1, ya, yb + 1), 1e9, 4)[0]; return { x0: xa, x1: xb, y0: ya + ys[0], y1: ya + ys[1] }; })); }
const cut = (o, c, pad = 3) => { const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad), x1 = Math.min(o.W, c.x1 + pad + 1), y1 = Math.min(o.H, c.y1 + pad + 1); return crop(o, x0, y0, x1 - x0, y1 - y0); };
// componentes conexos numa mascara reduzida (1/4) e dilatada: pecas a menos de ~dil px ficam juntas, mas caixas que so se cruzam (dirigivel x trem) nao.
function blobs(o, dil, minArea, cutsY) { const { d, W, H } = o, q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q), m = new Uint8Array(w * h), r = Math.max(1, Math.round(dil / q));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 60) m[(y >> 2) * w + (x >> 2)] = 1;
  const dm = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!m[y * w + x]) continue; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) dm[yy * w + xx] = 1; } }
  const lab = new Int32Array(w * h), cs = [];
  for (let p0 = 0; p0 < w * h; p0++) { if (lab[p0] || !dm[p0]) continue; const st = [p0]; lab[p0] = 1; let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (m[p]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x > 0 && !lab[p - 1] && dm[p - 1]) { lab[p - 1] = 1; st.push(p - 1); } if (x < w - 1 && !lab[p + 1] && dm[p + 1]) { lab[p + 1] = 1; st.push(p + 1); } if (y > 0 && !lab[p - w] && dm[p - w]) { lab[p - w] = 1; st.push(p - w); } if (y < h - 1 && !lab[p + w] && dm[p + w]) { lab[p + w] = 1; st.push(p + w); } }
    if (n * q * q >= minArea) cs.push({ x0: x0 * q, y0: y0 * q, x1: Math.min(W - 1, x1 * q + q - 1), y1: Math.min(H - 1, y1 * q + q - 1), n: n * q * q }); }
  const rows = cutsY.map(() => []); rows.push([]); for (const c of cs) { const cy = (c.y0 + c.y1) / 2 / H; let k = 0; while (k < cutsY.length && cy >= cutsY[k]) k++; rows[k].push(c); } rows.forEach(r => r.sort((a, b) => a.x0 - b.x0)); return rows; }
// recorta a caixa e apaga o que nao pertence a peca (vizinhos que entram na caixa): mantem so componentes ligados ao maior
const flop = o => { const out = Buffer.alloc(o.d.length); for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) o.d.copy(out, (y * o.W + x) * 4, (y * o.W + o.W - 1 - x) * 4, (y * o.W + o.W - x) * 4); return { d: out, W: o.W, H: o.H }; };
const spr = async (o, name, w, q = 86) => { const r = await img(o).resize(Math.min(w, o.W)).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
const svgOut = async (svg, name, q = 84, w) => { let s = sharp(Buffer.from(svg)); if (w) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
const clean = (o, min = 700) => { const { d, W, H } = o, lab = new Uint8Array(W * H); let n = 0;
  for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 40) continue; const st = [p0], all = [p0]; lab[p0] = 1; while (st.length && all.length < min) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); all.push(q); } }
    if (all.length < min) { all.forEach(p => { d[p * 4 + 3] = 0; }); n++; } else while (st.length) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); } } }
  return n; };
const STAGE = (process.argv[4] || 'sky,far,mid,ground,decals,props,props2,proc').split(',');
const has = s => STAGE.indexOf(s) >= 0;
const infoFile = S + '/work/info.json'; if (fs.existsSync(infoFile)) Object.assign(info, JSON.parse(fs.readFileSync(infoFile, 'utf8')));
const f1 = v => v.toFixed(1);

(async () => {
  // ---------------- ceu: o gerador deixou 12,5% de cada lado sem nuvens e CORTOU as nuvens a prumo em x=396 e x=2772.
  // As nuvens somem no degrade ao longo de 380 px a partir de cada corte (viram nevoa de carvao); depois a imagem emenda nela mesma.
  if (has('sky')) { const sky0 = await load(S + '/raw/sky.png'); const { d, W, H } = sky0, XL = 396, XR = 2772, D = 380;
    const grad = (xa, xb) => { const g = new Float32Array(H * 3); for (let y = 0; y < H; y++) { let r = 0, gg = 0, b = 0, n = 0; for (let x = xa; x < xb; x += 3) { const i = (y * W + x) * 4; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } g[y * 3] = r / n; g[y * 3 + 1] = gg / n; g[y * 3 + 2] = b / n; } return g; };
    const gL = grad(XL - 90, XL - 6), gR = grad(XR + 6, XR + 90);
    for (let y = 0; y < H; y++) for (let k = 0; k < D; k++) { let t = k / D; t = t * t * (3 - 2 * t); const a = (y * W + XL + k) * 4, b = (y * W + XR - 1 - k) * 4; for (let q = 0; q < 3; q++) { d[a + q] = Math.round(gL[y * 3 + q] * (1 - t) + d[a + q] * t); d[b + q] = Math.round(gR[y * 3 + q] * (1 - t) + d[b + q] * t); } }
    const sky = wrap(sky0, 64); const med = (y0, y1) => { const c = [[], [], []]; for (let y = y0; y < y1; y += 2) for (let x = 0; x < sky.W; x += 7) { const i = (y * sky.W + x) * 4; for (let q = 0; q < 3; q++) c[q].push(sky.d[i + q]); } return c.map(v => v.sort((a, b) => a - b)[v.length >> 1]); };
    info.skyTop = med(0, 30); info.skyHi = med(Math.round(H * 0.2), Math.round(H * 0.2) + 30); info.skyMid = med(Math.round(H * 0.45), Math.round(H * 0.45) + 30); info.skyLow = med(Math.round(H * 0.7), Math.round(H * 0.7) + 30); info.skyBottom = med(H - 40, H);
    console.log('ceu', info.skyTop, info.skyHi, info.skyMid, info.skyLow, info.skyBottom); await save(sky, 'sky', 2048, 86); await prev(sky, 'sky', 1500); }

  // ---------------- far: cidade fabril com viaduto de ferro, chamines, torre do relogio e gasometro. Ladrilho que REPETE (sem espelho), cortado de
  // coroa de arco a coroa de arco do viaduto (x=338 e x=2010): estreito (0,645 SH) para a torre quase nunca sair de cena e nunca aparecerem duas.
  if (has('far')) { const src = safeKey(await load(S + '/raw/far.png')); const X0 = 338, X1 = 2010, O = 40, top = 48, Hf = src.H - top;
    const far = wrap(crop(src, X0, top, X1 - X0 + O, Hf), O); const { d, W, H } = far;
    // base some no degrade do ceu (alfa caindo nos ultimos 17%)
    const F0 = Math.round(H * 0.83); for (let y = F0; y < H; y++) { const t = 1 - (y - F0) / (H - F0), a = t * t * (3 - 2 * t); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4 + 3; d[i] = Math.round(d[i] * a); } }
    // mostrador do relogio: centro e raio medidos pelos pixels amarelo-claros; ponteiro das horas e pino pintados na arte (o dos minutos anda por fx)
    let sx = 0, sy = 0, n = 0, xa = W, xb = 0, ya = H, yb = 0; for (let y = 0; y < H * 0.6; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i] > 240 && d[i + 1] > 225 && d[i + 2] > 150 && d[i + 2] < 235 && d[i + 3] > 200) { sx += x; sy += y; n++; if (x < xa) xa = x; if (x > xb) xb = x; if (y < ya) ya = y; if (y > yb) yb = y; } }
    const R = (yb - ya + 1) / 2, cy = (ya + yb) / 2, cx = xa + R; console.log('relogio', cx, cy, R, 'centroide', sx / n, sy / n);
    const hr = -2.2, hx = cx + Math.cos(hr) * R * 0.5, hy = cy + Math.sin(hr) * R * 0.5;
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><g stroke="#3b2622" stroke-linecap="round" fill="none"><line x1="' + f1(cx) + '" y1="' + f1(cy) + '" x2="' + f1(hx) + '" y2="' + f1(hy) + '" stroke-width="' + f1(R * 0.2) + '"/>' +
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(k => { const a = k * Math.PI / 6, r0 = R * (k % 3 ? 0.84 : 0.76), r1 = R * 0.93; return '<line x1="' + f1(cx + Math.cos(a) * r0) + '" y1="' + f1(cy + Math.sin(a) * r0) + '" x2="' + f1(cx + Math.cos(a) * r1) + '" y2="' + f1(cy + Math.sin(a) * r1) + '" stroke-width="' + f1(R * (k % 3 ? 0.06 : 0.1)) + '" stroke="#6b4a3a"/>'; }).join('') + '</g></svg>';
    const buf = await img(far).composite([{ input: Buffer.from(svg), left: 0, top: 0 }]).raw().toBuffer(); const far2 = { d: buf, W, H };
    info.farCrop = [X0, top, W, H]; info.clock = [cx / W, cy / H, R / W, R / H]; info.deck = (334 - top) / H;
    // topos das chamines (para a fumaca): primeira linha opaca de cada coluna-alvo
    const topOf = x => { for (let y = 0; y < H; y++) if (far2.d[(y * W + x) * 4 + 3] > 128) return y; return H; }; info.farChim = [393 - X0, 535 - X0, 680 - X0].map(x => { let best = [H, x]; for (let xx = x - 40; xx <= x + 40; xx += 2) { const t = topOf(xx); if (t < best[0]) best = [t, xx]; } let a = best[1], b = best[1]; while (topOf(a - 2) < best[0] + 14) a -= 2; while (topOf(b + 2) < best[0] + 14) b += 2; return [(a + b) / 2 / W, best[0] / H]; }); console.log('chamines far', info.farChim);
    await save(far2, 'far', 1240, 82); await prev(far2, 'far', 1400);
    const w = 300, Lb = await img(crop(far2, W - w, 0, w, H)).png().toBuffer(), Rb = await img(crop(far2, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#f0b866' } }).composite([{ input: Lb, left: 0, top: 0 }, { input: Rb, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 86 }).toFile(S + '/work/seam_far.jpg'); }

  // ---------------- mid A (fabrica, caldeira, guindaste) / mid B (banca, lampiao, estacao com locomotiva, oficina com bobina de Tesla)
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png'), true), B = safeKey(await load(S + '/raw/midB.png'), true); console.log('soltos', clean(A), clean(B));
    // vidro da cobertura da estacao fica translucido: a cidade distante (e a torre do relogio) aparece atraves dele
    { const { d, W, H } = B; let n = 0; for (let y = 0; y < Math.round(H * 0.36); y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 250) continue; const r = d[i], g = d[i + 1], b = d[i + 2], l = (r + g + b) / 3; if (b >= r + 6 && g >= r - 4 && l > 62 && l < 215) { d[i + 3] = 150; n++; } } console.log('vidro', n); }
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0, bB.y1 - bB.y0) + 1 + 8; console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    await save(cA, 'midA', 2640, 74); await save(cB, 'midB', 2640, 74); await prev(cA, 'midA', 1584); await prev(cB, 'midB', 1584);
    for (const n of ['midA', 'midB']) { const r = await sharp(OUT + '/' + n + '.webp').resize(880).webp({ quality: 62, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- chao: calcada de lajes, guia, rua de paralelepipedos com 2 trilhos de bonde, guia, calcada. Ladrilho de 2760 px:
  // cada fiada de paralelepipedos e cortada de junta a junta (e esticada ate 2%) para a emenda cair entre duas pedras; faixas lisas tem fusao de 64 px.
  if (has('ground')) { const g0 = await load(S + '/raw/ground.png'); const { d, W, H } = g0, X0 = 120, WT = 2760, O = 64, RAMP = 22;
    const rows = [[0, 348, 401, 3016], [423, 492], [492, 576], [576, 657], [708, 756], [756, 828], [828, 897], [950, 1011], [1011, 1086]];   // fiadas de pedras (y bruto)
    const out = Buffer.alloc(WT * H * 4), rowOf = new Int16Array(H).fill(-1); rows.forEach((r, k) => { for (let y = r[0]; y < r[1]; y++) rowOf[y] = k; });
    const lumCol = (x, ya, yb) => { let s = 0, n = 0; for (let y = ya; y < yb; y += 2) { const i = (y * W + x) * 4; s += d[i] + d[i + 1] + d[i + 2]; n++; } return s / n; };
    const gapNear = (r, xt) => { const ya = Math.round(r[0] + (r[1] - r[0]) * 0.3), yb = Math.round(r[0] + (r[1] - r[0]) * 0.75); let best = 1e9, bx = xt; for (let x = xt - 75; x <= xt + 75; x++) { const l = lumCol(x - 1, ya, yb) + lumCol(x, ya, yb) + lumCol(x + 1, ya, yb) + Math.abs(x - xt) * 0.25; if (l < best) { best = l; bx = x; } } return bx; };
    const seg = rows.map(r => { if (r.length > 2) return [r[2], r[3]]; const a = gapNear(r, X0 + 60), b = gapNear(r, a + WT); return [a, b]; });   // a calcada de cima vai de junta a junta de laje (medidas na imagem) console.log('fiadas', seg.map(s => s[0] + '-' + s[1] + ' (' + ((s[1] - s[0]) / WT).toFixed(3) + ')').join(' '));
    for (let y = 0; y < H; y++) { const k = rowOf[y];
      for (let x = 0; x < WT; x++) { const o = (y * WT + x) * 4; let c;
        if (k >= 0) { const sx = seg[k][0] + x * (seg[k][1] - seg[k][0]) / WT, x0 = Math.floor(sx), f = sx - x0, i = (y * W + x0) * 4, j = i + 4; c = [d[i] * (1 - f) + d[j] * f, d[i + 1] * (1 - f) + d[j + 1] * f, d[i + 2] * (1 - f) + d[j + 2] * f]; }
        else { const i = (y * W + X0 + x) * 4; c = [d[i], d[i + 1], d[i + 2]]; if (x < O) { let t = x / O; t = t * t * (3 - 2 * t); const q = (y * W + X0 + WT + x) * 4; c = c.map((v, n) => v * t + d[q + n] * (1 - t)); } }
        out[o] = Math.round(c[0]); out[o + 1] = Math.round(c[1]); out[o + 2] = Math.round(c[2]); out[o + 3] = y < RAMP ? Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3)) : 255; } }
    const g = { d: out, W: WT, H }; info.road = [420 / H, 1092 / H]; info.curb = [354 / H, 1140 / H]; info.rails = [683 / H, 924 / H]; info.groundRamp = RAMP / H;
    await save(g, 'ground', 1600, 86); await prev(g, 'ground', 1500, '#e8c090');
    const w = 500, L = await img(crop(g, WT - w, 0, w, H)).png().toBuffer(), R = await img(crop(g, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#e8c090' } }).composite([{ input: L, left: 0, top: 0 }, { input: R, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 88 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre magenta
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'), true);
    const names = [['oil1', 'oil2', 'manhole', 'grate', 'paper'], ['bolt', 'bolts', 'gear', 'gears', 'watch'], ['leaves3', 'leaves5', 'coal3', 'stain', 'patch'], ['paperball', 'coalheap', 'wrench', 'pipe', 'can']];
    const rows = cells(D, 50, 80); console.log('decals', rows.map(r => r.length), rows[0].map(c => [c.x0, c.x1, c.y0, c.y1].join(',')).join(' | '));
    const SC = 0.42, AW = 1180; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const sub = cut(D, rows[r][c], 4), nm = names[r][c]; if (nm === 'stain') for (let p = 0; p < sub.W * sub.H; p++) { const i = p * 4, l = (sub.d[i] + sub.d[i + 1] + sub.d[i + 2]) / 3; sub.d[i] = Math.round(l * 1.05 + 8); sub.d[i + 1] = Math.round(l * 0.92 + 5); sub.d[i + 2] = Math.round(l * 0.85 + 4); }   // a mancha de carvao veio roxa: vira cinza-marrom
      const ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); }
    if (fs.existsSync(S + '/raw/props2.png')) { const P2 = safeKey(await load(S + '/raw/props2.png'), true), R2 = blobs(P2, 14, 5000, [0.33, 0.65]), pick = { hydrant: [R2[1][1], 170], mailbox: [R2[2][0], 255], papers: [R2[2][1], 185], cart: [R2[2][2], 215], bench: [R2[2][4], 205], bike: [R2[2][5], 300] };   // objetos parados da calcada (folha 2): altura em px do atlas = altura na cena / pxScale
      for (const nm of Object.keys(pick)) { const sub = cut(P2, pick[nm][0], 3), hh = pick[nm][1], ww = Math.round(sub.W * hh / sub.H); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); } }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#8a6a50' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens / corvo (5 poses -> 6 quadros) / dirigivel grande, trem, dirigivel pequeno / 3 bandeiras + barra de toldo
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png'), true); const R = blobs(P1, 14, 5000, [0.2, 0.47, 0.8]); console.log('props1', R.map(r => r.length), R[2].map(c => [c.x0, c.y0, c.x1, c.y1].join(',')).join(' | '));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 480, 82);
    { const F = 620, frames = [], order = [0, 2, 3, 4, 3, 2]; for (const k of order) { const o = cut(P1, R[1][k], 2); let bx = -1, by = 0; for (let x = o.W - 1; x >= 0 && bx < 0; x--) for (let y = 0; y < o.H; y++) { const i = (y * o.W + x) * 4; if (o.d[i + 3] > 200 && o.d[i] > 215 && o.d[i + 1] > 120 && o.d[i + 1] < 215 && o.d[i + 2] < 110) { bx = x; by = y; break; } }   // alinha pela ponta do bico laranja
        frames.push({ input: await img(o).png().toBuffer(), left: frames.length * F + 600 - bx, top: 310 - by }); console.log('corvo', k, o.W, o.H, 'bico', bx, by); }
      const sheet = await sharp({ create: { width: F * 6, height: F, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames).png().toBuffer();
      const r = await sharp(sheet).resize(150 * 6).webp({ quality: 88, alphaQuality: 100 }).toFile(OUT + '/crow.webp'); console.log('crow', r.width, r.height, Math.round(r.size / 1024) + 'KB'); await sharp(sheet).resize(1500).flatten({ background: '#f0b866' }).jpeg().toFile(S + '/work/p_crow.jpg'); }
    const row = R[2].slice().sort((a, b) => (b.x1 - b.x0) - (a.x1 - a.x0)), train = row[0], ship = row[1], ship2 = row[2];   // por largura: trem, dirigivel grande, dirigivel pequeno
    // as caixas do dirigivel grande e do trem se cruzam: apaga o canto do vagao dentro do recorte do dirigivel e a ponta do dirigivel dentro do recorte do trem
    for (let y = 1000; y < P1.H; y++) for (let x = 1000; x <= ship.x1 + 4; x++) if (y >= train.y0 + 150) P1.d[(y * P1.W + x) * 4 + 3] = P1.d[(y * P1.W + x) * 4 + 3];
    const shipO = cut(P1, ship); { const ox = Math.max(0, ship.x0 - 3), oy = Math.max(0, ship.y0 - 3); for (let y = 0; y < shipO.H; y++) for (let x = 0; x < shipO.W; x++) if (x + ox >= 1000 && y + oy >= 1000) shipO.d[(y * shipO.W + x) * 4 + 3] = 0; }
    await spr(shipO, 'airship', 420); await spr(cut(P1, ship2), 'airship2', 220);
    { const t = cut(P1, train, 2); { const ox = Math.max(0, train.x0 - 2), oy = Math.max(0, train.y0 - 2); for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) if ((x + ox < 1210 || (x + ox > 1340 && x + ox < 1790)) && y + oy < 1000) t.d[(y * t.W + x) * 4 + 3] = 0; } let ly = t.H; for (let y = t.H - 1; y > t.H * 0.6; y--) { let c = 0; for (let x = 0; x < t.W; x++) if (t.d[(y * t.W + x) * 4 + 3] > 128) c++; if (c > t.W * 0.9) ly = y; } console.log('trem', t.W, t.H, 'linha do trilho', ly); await spr(crop(t, 0, 0, t.W, ly - 1), 'train', 640, 88); }
    await spr(flop(cut(P1, R[3][0])), 'pennR', 300); await spr(flop(cut(P1, R[3][1])), 'pennB', 300); await spr(flop(cut(P1, R[3][2])), 'bannerG', 300);
    { const a = cut(P1, R[3][3]), y0 = Math.round(a.H * 0.45), hh = a.H - y0, ww = Math.round(hh * 2.75); await spr(crop(a, Math.round(a.W / 2), y0, ww, hh), 'awn', 300); } }   // pedaco da barra do toldo (2,75:1): 3 deles cobrem o toldo da banca

  // ---------------- folha 2: primeiro plano / beira da rua / parados
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png'), true); const R = blobs(P2, 14, 5000, [0.33, 0.65]); console.log('props2', R.map(r => r.length));
    const n1 = ['thistle', 'drygrass', 'coalpile', 'crate', 'drum', 'pipe'], w1 = [300, 320, 340, 300, 240, 240];
    for (let i = 0; i < 6; i++) await spr(cut(P2, R[0][i]), n1[i], w1[i], 84);
    const n2 = ['torch', null, 'cat', 'robot', 'crowpost', 'brazier'], w2 = [110, 200, 260, 240, 260, 240];   // hidrante e a fileira 3 (caixa de correio, jornais, carrinho, banco, bicicleta) vao para o atlas de decalques
    for (let i = 0; i < 6; i++) if (n2[i]) await spr(cut(P2, R[1][i]), n2[i], w2[i]); }

  // ---------------- procedurais: engrenagem gigante (gira pelo bloco mill), corpo vazio do mill, 12 mascaras do ponteiro dos minutos, 4 raios da bobina de Tesla
  if (has('proc')) {
    { const N = 16, C = 256, Rt = 246, Rr = 212, Ri = 166, Rh = 62, O = '#2b1a14', pts = []; for (let i = 0; i < N; i++) { const a = i * 2 * Math.PI / N, w = 2 * Math.PI / N; [[-0.30, Rr], [-0.17, Rt], [0.17, Rt], [0.30, Rr]].forEach(([f, r]) => pts.push(f1(C + Math.cos(a + f * w) * r) + ',' + f1(C + Math.sin(a + f * w) * r))); }
      const pts2 = []; for (let i = 0; i < N; i++) { const a = i * 2 * Math.PI / N, w = 2 * Math.PI / N; [[-0.25, Rr - 6], [-0.13, Rt - 12], [0.13, Rt - 12], [0.25, Rr - 6]].forEach(([f, r]) => pts2.push(f1(C + Math.cos(a + f * w) * r) + ',' + f1(C + Math.sin(a + f * w) * r))); }
      let s = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><mask id="m"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="' + Ri + '" fill="#000"/></mask></defs>';
      s += '<g mask="url(#m)"><polygon points="' + pts.join(' ') + '" fill="#8b5524" stroke="' + O + '" stroke-width="9" stroke-linejoin="round"/><polygon points="' + pts2.join(' ') + '" fill="#c98a3c"/><circle cx="256" cy="256" r="' + (Rr - 4) + '" fill="#b87833"/><circle cx="256" cy="256" r="' + (Ri + 20) + '" fill="#8b5524"/><circle cx="256" cy="256" r="' + (Rr - 12) + '" fill="none" stroke="#e2aa58" stroke-width="5"/></g>';
      s += '<circle cx="256" cy="256" r="' + Ri + '" fill="none" stroke="' + O + '" stroke-width="8"/>';
      for (let i = 0; i < 6; i++) { const a = i * 60 + 15; s += '<g transform="rotate(' + a + ' 256 256)"><rect x="234" y="' + (C - Ri - 2) + '" width="44" height="' + (Ri - 30) + '" fill="#8b5524" stroke="' + O + '" stroke-width="8"/><rect x="241" y="' + (C - Ri + 4) + '" width="13" height="' + (Ri - 42) + '" fill="#c98a3c"/></g>'; }
      for (let i = 0; i < 12; i++) { const a = (i + 0.5) * Math.PI / 6; s += '<circle cx="' + f1(C + Math.cos(a) * (Ri + 24)) + '" cy="' + f1(C + Math.sin(a) * (Ri + 24)) + '" r="7" fill="#e9b765" stroke="' + O + '" stroke-width="3.5"/>'; }
      s += '<circle cx="256" cy="256" r="' + Rh + '" fill="#8b5524" stroke="' + O + '" stroke-width="9"/><circle cx="256" cy="256" r="' + (Rh - 13) + '" fill="#c98a3c"/><circle cx="256" cy="256" r="' + (Rh - 30) + '" fill="#6a3d1c" stroke="' + O + '" stroke-width="5"/>';
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.26; s += '<circle cx="' + f1(C + Math.cos(a) * (Rh - 16)) + '" cy="' + f1(C + Math.sin(a) * (Rh - 16)) + '" r="4.5" fill="' + O + '"/>'; }
      s += '</svg>'; await svgOut(s, 'gear', 88, 480); }
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"></svg>', 'blank', 80);
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6 - Math.PI / 2; await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><line x1="48" y1="48" x2="' + f1(48 + Math.cos(a) * 36) + '" y2="' + f1(48 + Math.sin(a) * 36) + '" stroke="#fff" stroke-width="6.5" stroke-linecap="round"/><circle cx="48" cy="48" r="6" fill="#fff"/></svg>', 'hand' + k, 90); }
    // raios: poligonais em ziguezague saindo do toroide (centro em 150,170 de uma caixa 300 x 240), com halo
    { let sd = 99173; const rn = () => (sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; const dirs = [[-2.5, 128], [-1.25, 140], [-0.45, 132], [-2.95, 118], [-1.85, 150], [-0.9, 122], [-0.1, 112], [-2.15, 120]];
      for (let k = 0; k < 4; k++) { let s = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="240" fill="none" stroke-linecap="round" stroke-linejoin="round">';
        for (const [ang, len] of [dirs[k * 2], dirs[k * 2 + 1]]) { const pts = [[150, 170]]; const n = 6; for (let i = 1; i <= n; i++) { const t = i / n, j = (rn() - 0.5) * 30 * (i < n ? 1 : 0.4); pts.push([150 + Math.cos(ang) * len * t - Math.sin(ang) * j, 170 + Math.sin(ang) * len * t + Math.cos(ang) * j]); }
          const p = 'M' + pts.map(q => f1(q[0]) + ' ' + f1(q[1])).join(' L'); const b = pts[3], br = ang + (rn() < 0.5 ? 0.8 : -0.8), p2 = 'M' + f1(b[0]) + ' ' + f1(b[1]) + ' L' + f1(b[0] + Math.cos(br) * 26 + (rn() - 0.5) * 10) + ' ' + f1(b[1] + Math.sin(br) * 26) + ' L' + f1(b[0] + Math.cos(br + 0.3) * 48) + ' ' + f1(b[1] + Math.sin(br + 0.3) * 48);
          s += '<path d="' + p + '" stroke="#fff" stroke-opacity="0.28" stroke-width="13"/><path d="' + p2 + '" stroke="#fff" stroke-opacity="0.25" stroke-width="8"/><path d="' + p + '" stroke="#fff" stroke-width="4.2"/><path d="' + p2 + '" stroke="#fff" stroke-width="2.6"/>'; }
        s += '</svg>'; await svgOut(s, 'bolt' + k, 88); } } }
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
