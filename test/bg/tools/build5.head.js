// ERA 5 (Moderna, cidade em conflito): reconstroi camadas, decalques e sprites a partir dos brutos (Nano Banana 2.1, 2K).
// uso: node build5.js <pastaTrabalho com raw/ e work/> <pastaSaida> [etapas separadas por virgula]
// brutos: far.png mid.png midB.png ground.png (21:9) decals.png props.png veh.png props2.png (16:9). O ceu e procedural.
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
const STAGE = (process.argv[4] || 'sky,far,mid,ground,decals,props,veh,props2,proc').split(',');
const has = s => STAGE.indexOf(s) >= 0;
const infoFile = S + '/work/info.json'; if (fs.existsSync(infoFile)) Object.assign(info, JSON.parse(fs.readFileSync(infoFile, 'utf8')));
const f1 = v => v.toFixed(1);
