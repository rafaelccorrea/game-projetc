// ERA 8 (Celestial: palacio dourado nas nuvens, marmore, cascatas douradas): reconstroi camadas, decalques e sprites a partir dos brutos (Nano Banana 2, 2K). Mesmas funcoes do build6.js.
// uso: node build8.js <pastaTrabalho com raw/ e work/> <pastaSaida> [etapas separadas por virgula]
// brutos: far.png mid.png midB.png ground.png (21:9) decals.png props.png veh.png props2.png (16:9), todos sobre VERDE #00FF00
// (verde: a arte e branca, creme e dourada). O ceu e procedural (azul claro -> creme -> dourado).
const fs = require('fs'); const { sharp, load, img, crop, bbox } = require('./lib.js');
const S = process.argv[2], OUT = process.argv[3]; const info = { spr: {} };
const save = async (o, name, w, q = 86) => { let s = img(o); if (w && w < o.W) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; return r; };
const prev = async (o, name, w = 1500, bg = '#3a2d6a') => img(o).resize(Math.min(w, o.W)).flatten({ background: bg }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg');
// chroma verde -> alfa (espelho do keyMagenta do lib.js: m = g - max(r,b)); despill: tira o excesso de verde perto do fundo
function keyGreen(o, lo = 50, hi = 130) { const { d, W, H } = o, a = new Float32Array(W * H);
  for (let p = 0; p < W * H; p++) { const i = p * 4, m = d[i + 1] - Math.max(d[i], d[i + 2]); a[p] = m <= lo ? 1 : m >= hi ? 0 : 1 - (m - lo) / (hi - lo); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = y * W + x, i = p * 4; let near = a[p] < 1;
    for (let dy = -2; dy <= 2 && !near; dy++) for (let dx = -2; dx <= 2; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (a[yy * W + xx] < 0.5) { near = true; break; } }
    if (near) { const mx = Math.max(d[i], d[i + 2]); if (d[i + 1] > mx) d[i + 1] = Math.round(mx + (d[i + 1] - mx) * 0.15); }
    d[i + 3] = Math.round(255 * a[p]); }
  return o; }
// chroma seguro: o alfa so vale a ate 3 px do fundo; por dentro a cor original volta
function safeKey(o) { const orig = Buffer.from(o.d); keyGreen(o); const { d, W, H } = o, R = 3, bg = new Uint8Array(W * H), t = new Uint8Array(W * H), near = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) if (d[p * 4 + 3] < 128) bg[p] = 1;
  for (let y = 0; y < H; y++) { let c = 0; for (let x = -R; x < W; x++) { const a = x + R, b = x - R - 1; if (a < W && bg[y * W + a]) c++; if (b >= 0 && bg[y * W + b]) c--; if (x >= 0 && c > 0) t[y * W + x] = 1; } }
  for (let x = 0; x < W; x++) { let c = 0; for (let y = -R; y < H; y++) { const a = y + R, b = y - R - 1; if (a < H && t[a * W + x]) c++; if (b >= 0 && t[b * W + x]) c--; if (y >= 0 && c > 0) near[y * W + x] = 1; } }
  for (let p = 0; p < W * H; p++) { const i = p * 4; if (!near[p]) { d[i] = orig[i]; d[i + 1] = orig[i + 1]; d[i + 2] = orig[i + 2]; d[i + 3] = 255; } }
  return o; }
const runs = (occ, minGap, minLen = 8) => { const out = []; let a = -1, gap = 0; for (let i = 0; i <= occ.length; i++) { const on = i < occ.length && occ[i]; if (on) { if (a < 0) a = i; gap = 0; } else if (a >= 0) { gap++; if (gap >= minGap || i === occ.length) { const b = i - gap; if (b - a + 1 >= minLen) out.push([a, b]); a = -1; gap = 0; } } } return out; };
const cut = (o, c, pad = 3) => { const x0 = Math.max(0, c.x0 - pad), y0 = Math.max(0, c.y0 - pad), x1 = Math.min(o.W, c.x1 + pad + 1), y1 = Math.min(o.H, c.y1 + pad + 1); return crop(o, x0, y0, x1 - x0, y1 - y0); };
function blobs(o, dil, minArea, cutsY) { const { d, W, H } = o, q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q), m = new Uint8Array(w * h), r = Math.max(1, Math.round(dil / q));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 60) m[(y >> 2) * w + (x >> 2)] = 1;
  const dm = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!m[y * w + x]) continue; for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < w && yy < h) dm[yy * w + xx] = 1; } }
  const lab = new Int32Array(w * h), cs = [];
  for (let p0 = 0; p0 < w * h; p0++) { if (lab[p0] || !dm[p0]) continue; const st = [p0]; lab[p0] = 1; let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
    while (st.length) { const p = st.pop(), x = p % w, y = (p / w) | 0; if (m[p]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x > 0 && !lab[p - 1] && dm[p - 1]) { lab[p - 1] = 1; st.push(p - 1); } if (x < w - 1 && !lab[p + 1] && dm[p + 1]) { lab[p + 1] = 1; st.push(p + 1); } if (y > 0 && !lab[p - w] && dm[p - w]) { lab[p - w] = 1; st.push(p - w); } if (y < h - 1 && !lab[p + w] && dm[p + w]) { lab[p + w] = 1; st.push(p + w); } }
    if (n * q * q >= minArea) cs.push({ x0: x0 * q, y0: y0 * q, x1: Math.min(W - 1, x1 * q + q - 1), y1: Math.min(H - 1, y1 * q + q - 1), n: n * q * q }); }
  const rows = cutsY.map(() => []); rows.push([]); for (const c of cs) { const cy = (c.y0 + c.y1) / 2 / H; let k = 0; while (k < cutsY.length && cy >= cutsY[k]) k++; rows[k].push(c); } rows.forEach(r => r.sort((a, b) => a.x0 - b.x0)); return rows; }
// divide uma caixa em pecas separadas por colunas vazias (>= gap px)
function splitX(o, c, gap) { const occ = new Uint8Array(c.x1 - c.x0 + 1); for (let x = c.x0; x <= c.x1; x++) { let n = 0; for (let y = c.y0; y <= c.y1; y++) if (o.d[(y * o.W + x) * 4 + 3] > 60 && ++n > 1) break; occ[x - c.x0] = n > 1; }
  return runs(occ, gap, 20).map(([a, b]) => { let y0 = c.y1, y1 = c.y0; for (let y = c.y0; y <= c.y1; y++) for (let x = c.x0 + a; x <= c.x0 + b; x++) if (o.d[(y * o.W + x) * 4 + 3] > 60) { if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0: c.x0 + a, x1: c.x0 + b, y0, y1 }; }); }
const flop = o => { const out = Buffer.alloc(o.d.length); for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) o.d.copy(out, (y * o.W + x) * 4, (y * o.W + o.W - 1 - x) * 4, (y * o.W + o.W - x) * 4); return { d: out, W: o.W, H: o.H }; };
const spr = async (o, name, w, q = 86) => { const r = await img(o).resize(Math.min(w, o.W)).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
const svgOut = async (svg, name, q = 84, w) => { let s = sharp(Buffer.from(svg)); if (w) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
const clean = (o, min = 700) => { const { d, W, H } = o, lab = new Uint8Array(W * H); let n = 0;
  for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 40) continue; const st = [p0], all = [p0]; lab[p0] = 1; while (st.length && all.length < min) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); all.push(q); } }
    if (all.length < min) { all.forEach(p => { d[p * 4 + 3] = 0; }); n++; } else while (st.length) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); } } }
  return n; };
const STAGE = (process.argv[4] || 'sky,far,mid,masks,ground,decals,props,veh,props2,proc').split(',');
const has = s => STAGE.indexOf(s) >= 0;
const infoFile = S + '/work/info.json'; if (fs.existsSync(infoFile)) Object.assign(info, JSON.parse(fs.readFileSync(infoFile, 'utf8')));
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
// apaga a faixa de chao desenhada sob as pecas: acha a linha mais cheia perto da base e apaga dela para baixo; acima dela, nos vaos, nada muda
function baseline(o, from) { const { d, W, H } = o; let best = 0, yl = H - 1; for (let y = Math.round(H * (from || 0.8)); y < H; y++) { let c = 0; for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) c++; if (c > best * 1.0 && c > W * 0.4 && yl === H - 1) { yl = y; } if (c >= best) best = c; }
  for (let y = yl; y < H; y++) for (let x = 0; x < W; x++) d[(y * W + x) * 4 + 3] = 0; return yl; }
const place = async (o, FW, FH, ax, ay) => { const b = bbox(o, 60), c = crop(o, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1); return { input: await img(c).png().toBuffer(), left: Math.round(ax - c.W / 2), top: Math.round(ay - c.H), w: c.W, h: c.H }; };
const sheet = async (frames, FW, FH, name, outW, q = 86) => { const comp = frames.map((f, k) => ({ input: f.input, left: k * FW + f.left, top: f.top })); const b = await sharp({ create: { width: FW * frames.length, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer(); const r = await sharp(b).resize(outW).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width / frames.length, r.height]; await sharp(b).resize(Math.min(1500, FW * frames.length)).flatten({ background: '#3a2d6a' }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg'); };
const rot90 = o => { const out = Buffer.alloc(o.d.length), W = o.H, H = o.W; for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) { const nx = o.H - 1 - y, ny = x; o.d.copy(out, (ny * W + nx) * 4, (y * o.W + x) * 4, (y * o.W + x) * 4 + 4); } return { d: out, W, H }; };
const loadWebp = async f => { const b = await sharp(fs.readFileSync(f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: b.data, W: b.info.width, H: b.info.height }; };
const squareSave = async (o, name, w) => { const sd = Math.max(o.W, o.H), b = await sharp({ create: { width: sd, height: sd, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: await img(o).png().toBuffer(), left: Math.round((sd - o.W) / 2), top: Math.round((sd - o.H) / 2) }]).png().toBuffer(); const r = await sharp(b).resize(w).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/' + name + '.webp'); info.spr[name] = [w, w]; console.log(name, o.W, o.H, r.size); };

// mascara de pixels por cor dentro de uma imagem; devolve imagem branca com alfa. gold = dourado vivo; water = agua clara (ciano/azul claro); bright = muito claro
function colorMask(c, kind) { const out = Buffer.alloc(c.W * c.H * 4); for (let p = 0; p < c.W * c.H; p++) { const i = p * 4, r = c.d[i], g = c.d[i + 1], b = c.d[i + 2], al = c.d[i + 3]; let v = 0;
    if (al > 60) { if (kind === 'gold') v = (r > 200 && g > 140 && b < 130 && r - b > 100) ? 1 : 0; else if (kind === 'water') v = (b > 170 && g > 170 && r < g - 15) ? al / 255 : 0; else if (kind === 'bright') v = Math.min(r, g, b) > 215 ? 1 : 0; else if (kind === 'all') v = 1; }
    out[i] = out[i + 1] = out[i + 2] = 255; out[i + 3] = Math.round(255 * v * al / 255); } return { d: out, W: c.W, H: c.H }; }
// agua verdosa (fundo verde atravessando a agua do chafariz) -> azul clara translucida, so dentro de um retangulo (px do bruto)
function water(o, R) { const { d, W } = o; let n = 0; for (let y = R[1]; y < R[3]; y++) for (let x = R[0]; x < R[2]; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 20) continue; const r = d[i], g = d[i + 1], b = d[i + 2]; if (g > r + 25 && g >= b - 5) { const l = (r + g + b) / 3; d[i] = Math.round(Math.min(255, l * 0.85)); d[i + 1] = Math.round(Math.min(255, l * 1.0)); d[i + 2] = Math.min(255, Math.round(l * 1.18)); d[i + 3] = Math.min(d[i + 3], 170); n++; } } return n; }

(async () => {
  // ---------------- ceu procedural: azul claro no alto -> creme -> brilho dourado no horizonte, com veios claros
  if (has('sky')) { const W = 1024, H = 512, d = Buffer.alloc(W * H * 4), stops = [[0, [132, 190, 236]], [0.35, [182, 214, 240]], [0.62, [240, 232, 214]], [0.82, [255, 226, 176]], [1, [255, 210, 150]]];
    const at = t => { let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++; const a = stops[k], b = stops[k + 1], u = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, q) => v + (b[1][q] - v) * u); };
    for (let y = 0; y < H; y++) { const c = at(y / (H - 1)); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, n = (hash(x, y) - 0.5) * 2, s = 0.5 + 0.5 * Math.sin(x / W * Math.PI * 2 * 3 + y * 0.02) * Math.sin(x / W * Math.PI * 2 * 5 - y * 0.013), band = Math.max(0, 1 - Math.abs(y / H - 0.42) * 3) * s * 12; d[i] = Math.min(255, Math.round(c[0] + n + band)); d[i + 1] = Math.min(255, Math.round(c[1] + n + band)); d[i + 2] = Math.min(255, Math.round(c[2] + n + band * 0.8)); d[i + 3] = 255; } }
    info.skyTop = at(0); info.skyHi = at(0.2); info.skyMid = at(0.45); info.skyLow = at(0.7); info.skyBottom = at(1); await save({ d, W, H }, 'sky', 1024, 88); }

  // ---------------- far: palacio dourado sobre montanhas de nuvem, templos, 2 cascatas douradas, mar de nuvens embaixo. ESPELHADO.
  if (has('far')) { const src = safeKey(await load(S + '/raw/far.png')); const b = bbox(src, 60), top = Math.max(0, b.y0 - 6); console.log('far bbox', b);
    const far = crop(src, 0, top, src.W, src.H - top); const { d, W, H } = far;
    const F0 = Math.round(H * 0.84); for (let y = F0; y < H; y++) { const t = 1 - (y - F0) / (H - F0), a = t * t * (3 - 2 * t); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4 + 3; d[i] = Math.round(d[i] * a); } }
    info.farCrop = [0, top, W, H]; await img(far).png().toFile(S + '/work/far_full.png');
    await save(far, 'far', 1900, 80); await prev(far, 'far', 1584); }

  // ---------------- mid A (gazebo, anjo com trombeta, arvore dourada, chafariz, torre do sino) / mid B (portao, templo, harpa gigante, ponte arco-iris, orbe)
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png')), B = safeKey(await load(S + '/raw/midB.png'));
    { const K = A.W / 1400; for (let y = Math.round(45 * K); y < 112 * K; y++) for (let x = Math.round(395 * K); x < 600 * K; x++) A.d[(y * A.W + x) * 4 + 3] = 0; }   // anjo "fantasma" solto acima da estatua
    { const K = A.W / 1400; console.log('agua do chafariz', water(A, [Math.round(930 * K), Math.round(200 * K), Math.round(1130 * K), Math.round(460 * K)])); }
    // halo do orbe (mid B) veio esverdeado (brilho amarelo sobre o fundo verde): vira halo amarelo
    { const K = B.W / 1400, d = B.d; let n = 0; for (let y = Math.round(40 * K); y < 330 * K; y++) for (let x = Math.round(1130 * K); x < 1390 * K; x++) { const i = (y * B.W + x) * 4; if (d[i + 3] && d[i + 1] > d[i] + 10 && d[i + 1] > d[i + 2] + 40) { d[i] = d[i + 1]; d[i + 2] = Math.round(d[i + 2] * 0.6); n++; } } console.log('halo do orbe', n); }
    const ylA = baseline(A, 0.88), ylB = baseline(B, 0.88); console.log('soltos', clean(A), clean(B), 'linha de base', ylA, ylB);
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0, bB.y1 - bB.y0) + 1; console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    if (fs.existsSync(__dirname + '/cut8.json')) { const C = JSON.parse(fs.readFileSync(__dirname + '/cut8.json', 'utf8')); info.cuts = {};
      for (const q of C) { const src = q.tile ? cB : cA, K = src.W / 1584, R0 = q.rect.map(v => Math.round(v * K)), w = R0[2] - R0[0], h = R0[3] - R0[1], piece = crop(src, R0[0], R0[1], w, h);
        if (q.keep === 'gold') for (let p = 0; p < w * h; p++) { const i = p * 4, r = piece.d[i], g = piece.d[i + 1], bb = piece.d[i + 2]; const gold = r > 120 && r - bb > 60, dark = Math.max(r, g, bb) < 90; if (!(gold || dark)) piece.d[i + 3] = 0; }
        if (q.yoke) for (let y = 0; y < Math.round(h * q.yoke); y++) for (let x = 0; x < w; x++) if (x < w * 0.38 || x > w * 0.62) piece.d[(y * w + x) * 4 + 3] = 0;   // so a alca do sino no alto; o resto da trave fica no mid
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (piece.d[(y * w + x) * 4 + 3] > 0) src.d[((y + R0[1]) * src.W + x + R0[0]) * 4 + 3] = 0;
        if (q.fill) { /* fundo atras da peca: repinta com a cor media da parede de cada linha (pixels vizinhos a esquerda e a direita do retangulo) */ for (let y = R0[1]; y < R0[3]; y++) { const L = (y * src.W + R0[0] - 3) * 4, Rr = (y * src.W + R0[2] + 2) * 4; for (let x = R0[0]; x < R0[2]; x++) { const i = (y * src.W + x) * 4; if (src.d[i + 3] > 0) continue; const u = (x - R0[0]) / w; for (let k = 0; k < 3; k++) src.d[i + k] = Math.round(src.d[L + k] * (1 - u) + src.d[Rr + k] * u); src.d[i + 3] = Math.min(src.d[L + 3], src.d[Rr + 3]); } } }
        info.cuts[q.name] = { tile: q.tile, rect: [R0[0] / src.W, R0[1] / src.H, w / src.W, h / src.H] }; await spr(piece, q.name, q.w || 240, 86); } }
    await img(cA).png().toFile(S + '/work/midA_full.png'); await img(cB).png().toFile(S + '/work/midB_full.png');
    await save(cA, 'midA', 2500, 72); await save(cB, 'midB', 2500, 72); await prev(cA, 'midA', 1584); await prev(cB, 'midB', 1584);
    for (const n of ['midA', 'midB']) { const r = await sharp(fs.readFileSync(OUT + '/' + n + '.webp')).resize(880).webp({ quality: 60, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- mascaras tiradas da arte (far e mid). masks8.json: {name, src: far|midA|midB, kind: gold|water|bright|all, rect em px da previa de 1584}
  if (has('masks')) { const PW = 1584, defs = JSON.parse(fs.readFileSync(__dirname + '/masks8.json', 'utf8')); info.masks = {};
    for (const src of ['far', 'midA', 'midB']) { const list = defs.filter(q => q.src === src); if (!list.length) continue; const o = await load(S + '/work/' + src + '_full.png'), K = o.W / PW;
      for (const m of list) { const [x0, y0, x1, y1] = m.rect.map(v => Math.round(v * K)), w = x1 - x0, h = y1 - y0, mo = colorMask(crop(o, x0, y0, w, h), m.kind);
        await spr(mo, m.name, Math.min(w, m.maxW || 400), 90); info.masks[m.name] = { src, tile: src === 'midB' ? 1 : 0, rect: [x0 / o.W, y0 / o.H, w / o.W, h / o.H] };
        await img(mo).flatten({ background: '#000' }).jpeg().toFile(S + '/work/m_' + m.name + '.jpg'); } } }

  // ---------------- chao: nuvem, friso dourado, lajes de marmore com juntas douradas, friso, nuvem. Ladrilho = periodo exato, emenda de menor diferenca, fusao de 70 px.
  if (has('ground')) { const g1 = await load(S + '/raw/ground.png'); const { W, H } = g1; const lum = (x, y) => { const i = (y * W + x) * 4; return g1.d[i] + g1.d[i + 1] + g1.d[i + 2]; };
    let best = 1e18, P = 0; for (let p = 1300; p <= 3000; p += 2) { let s = 0, n = 0; for (let y = 330; y < 1000; y += 8) for (let x = 0; x + p < W; x += 6) { s += Math.abs(lum(x, y) - lum(x + p, y)); n++; } s /= n; if (s < best) { best = s; P = p; } }
    for (let p = P - 2; p <= P + 2; p++) { let s = 0, n = 0; for (let y = 330; y < 1000; y += 4) for (let x = 0; x + p < W; x += 3) { s += Math.abs(lum(x, y) - lum(x + p, y)); n++; } s /= n; if (s < best) { best = s; P = p; } }
    console.log('periodo do chao', P, 'dif media', best.toFixed(2));
    const O = 70; let X0 = 0, bc = 1e18; for (let x0 = 0; x0 + P + O < W; x0 += 2) { let c = 0; for (let y = 4; y < H; y += 3) for (let x = x0; x < x0 + O; x += 2) c += Math.abs(lum(x, y) - lum(x + P, y)); if (c < bc) { bc = c; X0 = x0; } } console.log('emenda do chao em', X0, 'custo', bc);
    const { wrap } = require('./lib.js'); const g = wrap(crop(g1, X0, 0, P + O, H), O); const WT = g.W;
    const RAMP = 22; for (let y = 0; y < RAMP; y++) for (let x = 0; x < WT; x++) g.d[(y * WT + x) * 4 + 3] = Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3));
    const BANDS = JSON.parse(fs.readFileSync(__dirname + '/bands8.json', 'utf8')); info.curb = BANDS.curb.map(v => v / H); info.road = BANDS.road.map(v => v / H); info.groundRamp = RAMP / H; console.log('ladrilho', WT, 'faixas', info.curb, info.road);
    await save(g, 'ground', 1600, 84); await prev(g, 'ground', 1500);
    const w = 400, Lb = await img(crop(g, WT - w, 0, w, H)).png().toBuffer(), Rb = await img(crop(g, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#8fc4ea' } }).composite([{ input: Lb, left: 0, top: 0 }, { input: Rb, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 88 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre verde (pecas soltas de uma celula sao fundidas ate sobrarem 5 por fileira)
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'));
    const names = [['feather', 'gfeather', 'star', 'halo', 'petals'], ['coins', 'crack', 'lightpool', 'leaf', 'flower'], ['rune', 'scroll', 'gem', 'bell', 'leaves'], ['marble', 'puff', 'trumpet', 'pebbles', 'olive']];
    const R = blobs(D, 14, 600, [0.25, 0.5, 0.75]); console.log('decals', R.map(r => r.length));
    const SC = 0.42, AW = 1180; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) { const row = R[r].slice(); while (row.length > 5) { let bi = 0, bw = 1e9; for (let k = 0; k < row.length - 1; k++) { const g = row[k + 1].x0 - row[k].x1; if (g < bw) { bw = g; bi = k; } } const a = row[bi], b = row[bi + 1]; row.splice(bi, 2, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }); }
      for (let c = 0; c < 5; c++) { const nm = names[r][c]; if (!nm || !row[c]) continue; const sub = cut(D, row[c], 4), ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); } }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#e8d8b8' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens, 2 sois (1 usado) / pomba (5 poses de voo, em pe, bicando) / cordeiro (4 passos + sentado) / chama dourada (4 quadros), aureola, gato com asas
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png')); const R = blobs(P1, 4, 4000, [0.26, 0.5, 0.75]); console.log('props1', R.map(r => r.length));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 440, 80);
    await spr(cut(P1, R[0][3]), 'sun', 260, 84);
    { const F = 420, frames = []; for (const k of [0, 1, 2, 3, 2, 1]) { const o = cut(P1, R[1][k], 2); let bx = -1, by = 0; for (let x = o.W - 1; x >= 0 && bx < 0; x--) for (let y = 0; y < o.H; y++) if (o.d[(y * o.W + x) * 4 + 3] > 200) { bx = x; by = y; break; } frames.push({ input: await img(o).png().toBuffer(), left: 404 - bx, top: 215 - by }); }   // alinha pela ponta do bico
      await sheet(frames, F, F, 'dove', 150 * 6, 86); }
    for (const [k, n] of [[5, 'dv_stand'], [6, 'dv_peck']]) await img(cut(P1, R[1][k], 2)).png().toFile(S + '/work/' + n + '.png');
    { const FW = 560, FH = 460, frames = []; for (const k of [4, 0, 1, 2, 3]) frames.push(await place(cut(P1, R[2][k], 2), FW, FH, FW / 2, FH - 4)); await sheet(frames, FW, FH, 'lamb', 5 * 190, 86); }
    { const FW = 300, FH = 340, frames = []; for (const k of [0, 1, 2, 3]) frames.push(await place(cut(P1, R[3][k], 2), FW, FH, FW / 2, FH - 4)); await sheet(frames, FW, FH, 'flame', 4 * 110, 86); }
    await spr(cut(P1, R[3][R[3].length - 1]), 'wcat', 220, 84); }

  // ---------------- voadores: pegaso (sem asa) + asa, navio dourado / querubim (sem asa) + asa pequena, baleia celeste, fenix
  if (has('veh')) { const V = safeKey(await load(S + '/raw/veh.png')); const R = blobs(V, 14, 3000, [0.5]); console.log('veh', R.map(r => r.map(c => [c.x0, c.y0, c.x1, c.y1].join(','))));
    const piece = async (c, name, w) => { const o = cut(V, c, 2); clean(o, 300); info.veh = info.veh || {}; info.veh[name] = { px: [o.W, o.H] }; await spr(o, name, w, 84); return o; };
    // asa: o ombro fica embaixo; o sprite ganha a mesma altura vazia embaixo para o centro cair na linha do ombro (o flap achata em torno do centro)
    const wing = async (c, name, w) => { const o = cut(V, c, 2); clean(o, 300); const W2 = o.W, H2 = o.H * 2, d = Buffer.alloc(W2 * H2 * 4); for (let y = 0; y < o.H; y++) o.d.copy(d, y * W2 * 4, y * o.W * 4, (y + 1) * o.W * 4); info.veh[name] = { px: [o.W, o.H] }; await spr({ d, W: W2, H: H2 }, name, w, 84); };
    const r0 = R[0].sort((a, b) => a.x0 - b.x0), r1 = R[1].sort((a, b) => a.x0 - b.x0);
    await piece(r0[0], 'pegasus', 420); await wing(r0[1], 'wingP', 300); await piece(r0[2], 'ship', 380);
    await piece(r1[0], 'cherub', 220); await wing(r1[1], 'wingC', 160); await piece(r1[2], 'whale', 480); await piece(r1[3], 'phoenix', 320); }

  // ---------------- folha 2: primeiro plano / beira da estrada
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png')); const R = blobs(P2, 6, 4000, [0.3, 0.7]); console.log('props2', R.map(r => r.length));
    const n1 = ['gbush', 'lilies', 'cloudtuft', 'lcrystal', 'ggrass'], w1 = [300, 280, 300, 260, 260]; for (let i = 0; i < 5; i++) if (R[0][i]) await spr(cut(P2, R[0][i]), n1[i], w1[i], 82);
    const n2 = ['lamppost', 'bench', 'brazier', 'harp', 'column', 'bellpost'], w2 = [110, 260, 200, 200, 160, 220]; for (let i = 0; i < 6; i++) if (R[1][i]) await spr(cut(P2, R[1][i]), n2[i], w2[i], 84);
    const n3 = ['astatue', 'chest', 'roses', 'basin', 'lectern', 'lyre'], w3 = [170, 240, 200, 260, 200, 170]; for (let i = 0; i < 6; i++) if (R[2][i]) await spr(cut(P2, R[2][i]), n3[i], w3[i], 84);
    // poste de luz: o orbe fica centrado no sprite (o brilho do tipo lantern e centrado); vira o sprite 'lantern'
    fs.copyFileSync(OUT + '/lamppost.webp', OUT + '/lantern.webp'); fs.unlinkSync(OUT + '/lamppost.webp'); info.spr.lantern = info.spr.lamppost; delete info.spr.lamppost;
    // pomba na coluna quebrada: poleiro e pomba no MESMO enquadramento (hopper)
    { const bo = cut(P2, R[1][4], 1), FW = 300, FH = bo.H + 200, PH = Math.round(bo.H * 0.4), bl = { input: await img(bo).png().toBuffer(), left: Math.round((FW - bo.W) / 2), top: FH - bo.H };
      const post = await sharp({ create: { width: FW, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([bl]).png().toBuffer(); const r = await sharp(post).resize(120).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/perch.webp'); info.spr.perch = [r.width, r.height];
      const sm = await sharp(S + '/work/dv_stand.png').metadata(), fr = []; for (const n of ['dv_stand', 'dv_peck']) { const m = await sharp(S + '/work/' + n + '.png').metadata(), hh = Math.round(PH * m.height / sm.height), buf = await sharp(S + '/work/' + n + '.png').resize(null, hh).png().toBuffer(), mm = await sharp(buf).metadata(); fr.push({ input: buf, left: Math.round((FW - mm.width) / 2), top: FH - bo.H + 8 - hh }); }
      await sheet(fr, FW, FH, 'dovesit', 240, 86); info.dove = { frame: [FW, FH], postH: bo.H, cy: (FH - bo.H + 8 - PH / 2) / FH }; fs.unlinkSync(OUT + '/column.webp'); delete info.spr.column; } }

  if (has('proc')) { const E4 = OUT + '/../era4/'; for (const f of ['hero_run.png']) fs.copyFileSync(E4 + f, OUT + '/' + f); }
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
