// ERA 7 (Submundo: lava, obsidiana, cidadela demoniaca): reconstroi camadas, decalques e sprites a partir dos brutos (Nano Banana 2, 2K). Mesmas funcoes do build6.js.
// uso: node build7.js <pastaTrabalho com raw/ e work/> <pastaSaida> [etapas separadas por virgula]
// brutos: far.png mid.png midB.png ground.png (21:9) decals.png props.png veh.png props2.png (16:9), todos sobre VERDE #00FF00
// (verde: a arte tem vermelho, laranja e roxo e o magenta comeria a arte). O ceu e procedural (degrade carmim -> brasa).
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

// apaga a borda branca de "adesivo" que o gerador poe em volta das pecas (preenchimento a partir do transparente so por pixels quase brancos e neutros)
function unsticker(o) { const { d, W, H } = o, st = [], seen = new Uint8Array(W * H); let n = 0; const white = p => { const i = p * 4, mn = Math.min(d[i], d[i + 1], d[i + 2]), mx = Math.max(d[i], d[i + 1], d[i + 2]); return d[i + 3] > 0 && mn > 168 && mx - mn < 46; };
  for (let p = 0; p < W * H; p++) if (d[p * 4 + 3] < 40) { seen[p] = 1; st.push(p); }
  while (st.length) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || seen[q]) continue; seen[q] = 1; if (white(q)) { d[q * 4 + 3] = 0; n++; st.push(q); } } }
  // anel de transicao (antisserrilhado entre o branco e o contorno escuro): pixels claros vizinhos do transparente perdem alfa
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const p = y * W + x, i = p * 4; if (!d[i + 3]) continue; const mn = Math.min(d[i], d[i + 1], d[i + 2]); if (mn < 120) continue; if (!d[(p - 1) * 4 + 3] || !d[(p + 1) * 4 + 3] || !d[(p - W) * 4 + 3] || !d[(p + W) * 4 + 3]) d[i + 3] = Math.round(d[i + 3] * Math.max(0, (200 - mn) / 80)); }
  return n; }
// mascara de pixels "lava" (laranja/amarelo vivo) ou "roxo" dentro de uma imagem; devolve imagem branca com alfa
function colorMask(c, kind) { const out = Buffer.alloc(c.W * c.H * 4); for (let p = 0; p < c.W * c.H; p++) { const i = p * 4, r = c.d[i], g = c.d[i + 1], b = c.d[i + 2], al = c.d[i + 3]; let v = 0;
    if (al > 100) { if (kind === 'lava') v = (r > 200 && g > 70 && b < 90 && r - b > 150) ? 1 : 0; else if (kind === 'purple') v = (b > 150 && r > 110 && g < r - 30 && g < b - 40) ? 1 : 0; else if (kind === 'bright') v = Math.min(r, g, b) > 125 ? 1 : 0; else if (kind === 'all') v = 1; }
    out[i] = out[i + 1] = out[i + 2] = 255; out[i + 3] = Math.round(255 * v * al / 255); } return { d: out, W: c.W, H: c.H }; }

(async () => {
  // ---------------- ceu procedural: carmim escuro no alto -> vermelho -> brasa laranja no horizonte, com faixas leves de cinza; ladrilho de 1024 px
  if (has('sky')) { const W = 1024, H = 512, d = Buffer.alloc(W * H * 4), stops = [[0, [26, 8, 14]], [0.35, [62, 16, 22]], [0.62, [116, 28, 26]], [0.82, [178, 58, 30]], [1, [226, 104, 44]]];
    const at = t => { let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++; const a = stops[k], b = stops[k + 1], u = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, q) => v + (b[1][q] - v) * u); };
    for (let y = 0; y < H; y++) { const c = at(y / (H - 1)); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, n = (hash(x, y) - 0.5) * 2, s = 0.5 + 0.5 * Math.sin(x / W * Math.PI * 2 * 3 + y * 0.02) * Math.sin(x / W * Math.PI * 2 * 5 - y * 0.013), band = Math.max(0, 1 - Math.abs(y / H - 0.5) * 3) * s * 10; d[i] = Math.round(c[0] + n - band * 0.6); d[i + 1] = Math.round(c[1] + n - band * 0.3); d[i + 2] = Math.round(c[2] + n - band * 0.2); d[i + 3] = 255; } }
    info.skyTop = at(0); info.skyHi = at(0.2); info.skyMid = at(0.45); info.skyLow = at(0.7); info.skyBottom = at(1); await save({ d, W, H }, 'sky', 1024, 88); }

  // ---------------- far: montanhas de obsidiana, cidadela, 2 cascatas de lava e RIO DE LAVA de ponta a ponta. Recorte horizontal onde o rio e continuo (as bordas tinham rocha por cima do rio). ESPELHADO.
  if (has('far')) { const src0 = safeKey(await load(S + '/raw/far.png')), X0 = 102, X1 = 3066, src = crop(src0, X0, 0, X1 - X0, src0.H); const b = bbox(src, 60), top = Math.max(0, b.y0 - 6); console.log('far bbox', b);
    const far = crop(src, 0, top, src.W, src.H - top); const { d, W, H } = far;
    let river = -1; for (let y = Math.round(H * 0.55); y < H * 0.9 && river < 0; y++) { let c = 0; for (let x = 0; x < W; x += 3) { const i = (y * W + x) * 4; if (d[i] > 200 && d[i + 1] > 80 && d[i + 2] < 90) c++; } if (c > W / 3 * 0.85) river = y; }
    console.log('rio de lava (topo) y =', river, river / H);
    const F0 = Math.round(H * 0.84); for (let y = F0; y < H; y++) { const t = 1 - (y - F0) / (H - F0), a = t * t * (3 - 2 * t); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4 + 3; d[i] = Math.round(d[i] * a); } }
    info.farCrop = [X0, top, W, H]; info.farRiver = river / H; await img(far).png().toFile(S + '/work/far_full.png');
    await save(far, 'far', 1900, 80); await prev(far, 'far', 1584); }

  // ---------------- mid A (portal com grade, pedestal com braseiro vazio, caveira de rocha, arvore morta, torre) / mid B (cristais, forja, trono de ossos, forca com gaiola, pilar com cascata de lava)
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png')), B = safeKey(await load(S + '/raw/midB.png'));
    { const K = A.W / 1400; for (let y = Math.round(120 * K); y < 180 * K; y++) for (let x = Math.round(170 * K); x < 260 * K; x++) A.d[(y * A.W + x) * 4 + 3] = 0; }   // mancha solta no alto do mid A
    const ylA = baseline(A), ylB = baseline(B); console.log('soltos', clean(A), clean(B), 'linha de base', ylA, ylB);
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0, bB.y1 - bB.y0) + 1; console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    // pecas recortadas da arte para se mexer (cut7.json: {name, tile, rect em px da previa de 1584, keep: 'dark' = so pixels escuros (corrente/gaiola), w})
    if (fs.existsSync(__dirname + '/cut7.json')) { const C = JSON.parse(fs.readFileSync(__dirname + '/cut7.json', 'utf8')); info.cuts = {};
      for (const q of C) { const src = q.tile ? cB : cA, K = src.W / 1584, R0 = q.rect.map(v => Math.round(v * K)), w = R0[2] - R0[0], h = R0[3] - R0[1], piece = crop(src, R0[0], R0[1], w, h);
        if (q.keep === 'dark') for (let p = 0; p < w * h; p++) { const i = p * 4; if (Math.max(piece.d[i], piece.d[i + 1], piece.d[i + 2]) >= 150) piece.d[i + 3] = 0; }
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (piece.d[(y * w + x) * 4 + 3] > 0) src.d[((y + R0[1]) * src.W + x + R0[0]) * 4 + 3] = 0;
        info.cuts[q.name] = { tile: q.tile, rect: [R0[0] / src.W, R0[1] / src.H, w / src.W, h / src.H] }; await spr(piece, q.name, q.w || 240, 86); } }
    await img(cA).png().toFile(S + '/work/midA_full.png'); await img(cB).png().toFile(S + '/work/midB_full.png');
    await save(cA, 'midA', 2500, 72); await save(cB, 'midB', 2500, 72); await prev(cA, 'midA', 1584); await prev(cB, 'midB', 1584);
    for (const n of ['midA', 'midB']) { const r = await sharp(fs.readFileSync(OUT + '/' + n + '.webp')).resize(880).webp({ quality: 60, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- mascaras de lava/roxo tiradas da arte (far e mid). masks7.json: {name, src: far|midA|midB, kind: lava|purple|all, rect em px da previa de 1584}
  if (has('masks')) { const PW = 1584, defs = JSON.parse(fs.readFileSync(__dirname + '/masks7.json', 'utf8')); info.masks = {};
    for (const src of ['far', 'midA', 'midB']) { const list = defs.filter(q => q.src === src); if (!list.length) continue; const o = await load(S + '/work/' + src + '_full.png'), K = o.W / PW;
      for (const m of list) { const [x0, y0, x1, y1] = m.rect.map(v => Math.round(v * K)), w = x1 - x0, h = y1 - y0, mo = colorMask(crop(o, x0, y0, w, h), m.kind);
        await spr(mo, m.name, Math.min(w, m.maxW || 400), 90); info.masks[m.name] = { src, tile: src === 'midB' ? 1 : 0, rect: [x0 / o.W, y0 / o.H, w / o.W, h / o.H] };
        await img(mo).flatten({ background: '#000' }).jpeg().toFile(S + '/work/m_' + m.name + '.jpg'); } } }

  // ---------------- chao: rocha com rachaduras de lava, mureta, lajes com juntas de lava, mureta, rocha. Ladrilho = periodo exato, emenda onde a diferenca e menor, fusao de 70 px.
  if (has('ground')) { const g1 = await load(S + '/raw/ground.png'); const { W, H } = g1; const lum = (x, y) => { const i = (y * W + x) * 4; return g1.d[i] + g1.d[i + 1] + g1.d[i + 2]; };
    let best = 1e18, P = 0; for (let p = 1300; p <= 3000; p += 2) { let s = 0, n = 0; for (let y = 300; y < 1050; y += 8) for (let x = 0; x + p < W; x += 6) { s += Math.abs(lum(x, y) - lum(x + p, y)); n++; } s /= n; if (s < best) { best = s; P = p; } }
    for (let p = P - 2; p <= P + 2; p++) { let s = 0, n = 0; for (let y = 300; y < 1050; y += 4) for (let x = 0; x + p < W; x += 3) { s += Math.abs(lum(x, y) - lum(x + p, y)); n++; } s /= n; if (s < best) { best = s; P = p; } }
    console.log('periodo do chao', P, 'dif media', best.toFixed(2));
    const O = 70; let X0 = 0, bc = 1e18; for (let x0 = 0; x0 + P + O < W; x0 += 2) { let c = 0; for (let y = 4; y < H; y += 3) for (let x = x0; x < x0 + O; x += 2) c += Math.abs(lum(x, y) - lum(x + P, y)); if (c < bc) { bc = c; X0 = x0; } } console.log('emenda do chao em', X0, 'custo', bc);
    const { wrap } = require('./lib.js'); const g = wrap(crop(g1, X0, 0, P + O, H), O); const WT = g.W;
    const RAMP = 22; for (let y = 0; y < RAMP; y++) for (let x = 0; x < WT; x++) g.d[(y * WT + x) * 4 + 3] = Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3));
    const BANDS = JSON.parse(fs.readFileSync(__dirname + '/bands7.json', 'utf8')); info.curb = BANDS.curb.map(v => v / H); info.road = BANDS.road.map(v => v / H); info.groundRamp = RAMP / H; console.log('ladrilho', WT, 'faixas', info.curb, info.road);
    await save(g, 'ground', 1600, 84); await prev(g, 'ground', 1500);
    const w = 400, Lb = await img(crop(g, WT - w, 0, w, H)).png().toBuffer(), Rb = await img(crop(g, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#3a2020' } }).composite([{ input: Lb, left: 0, top: 0 }, { input: Rb, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 88 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre verde (pecas soltas de uma celula sao fundidas ate sobrarem 5 por fileira)
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'));
    const names = [['skull', 'bones', 'ribs', 'lavapool', 'lavacrack'], ['ash', 'embers', 'chain', 'sword', 'helmet'], ['rune', 'shard', 'scorch', 'slab', 'pebbles'], ['claws', 'shield', 'coins', 'bonefrag', 'twig']];
    const R = blobs(D, 14, 600, [0.25, 0.5, 0.75]); console.log('decals', R.map(r => r.length));
    const SC = 0.42, AW = 1180; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) { const row = R[r].slice(); while (row.length > 5) { let bi = 0, bw = 1e9; for (let k = 0; k < row.length - 1; k++) { const g = row[k + 1].x0 - row[k].x1; if (g < bw) { bw = g; bi = k; } } const a = row[bi], b = row[bi + 1]; row.splice(bi, 2, { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }); }
      for (let c = 0; c < 5; c++) { const nm = names[r][c]; if (!nm || !row[c]) continue; const sub = cut(D, row[c], 4), ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); } }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#3a3036' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens de cinza, lua de sangue / morcego (5 poses de voo + 2 pousado) / diabrete (4 passos + sentado) / chama roxa (4 quadros), fantasminha, gato preto
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png')); const R = blobs(P1, 4, 5000, [0.26, 0.5, 0.75]); console.log('props1', R.map(r => r.length));
    if (R[1].length === 6) R[1].splice(5, 1, ...splitX(P1, R[1][5], 6));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 440, 80);
    await spr(cut(P1, R[0][3]), 'moon', 260, 84);
    { const F = 420, frames = []; for (const k of [0, 1, 2, 3, 2, 1]) { const o = cut(P1, R[1][k], 2), b = bbox(o, 60); frames.push({ input: await img(o).png().toBuffer(), left: Math.round(F / 2 - (b.x0 + b.x1) / 2), top: Math.round(F / 2 - (b.y0 + b.y1) / 2) }); }   // centra o corpo
      await sheet(frames, F, F, 'bat', 150 * 6, 86); }
    for (const [k, n] of [[5, 'bt_stand'], [6, 'bt_lean']]) await img(cut(P1, R[1][k], 2)).png().toFile(S + '/work/' + n + '.png');
    { const FW = 560, FH = 430, frames = []; for (const k of [4, 0, 1, 2, 3]) frames.push(await place(cut(P1, R[2][k], 2), FW, FH, FW / 2, FH - 4)); await sheet(frames, FW, FH, 'imp', 5 * 190, 86); }
    { const FW = 300, FH = 340, frames = []; for (const k of [0, 1, 2, 3]) frames.push(await place(cut(P1, R[3][k], 2), FW, FH, FW / 2, FH - 4)); await sheet(frames, FW, FH, 'flame', 4 * 110, 86); }
    await spr(cut(P1, R[3][4]), 'ghostS', 160, 84); await spr(cut(P1, R[3][R[3].length - 1]), 'cat', 200, 84); }

  // ---------------- criaturas voadoras: serpe (corpo sem asa) + asa, barco com barqueiro / gargula, fantasma, espirito de fogo, corvo
  if (has('veh')) { const V = safeKey(await load(S + '/raw/veh.png')); const R = blobs(V, 14, 3000, [0.5]); console.log('veh', R.map(r => r.map(c => [c.x0, c.y0, c.x1, c.y1].join(','))));
    const row0 = R[0].filter(c => (c.x1 - c.x0) > 300).sort((a, b) => a.x0 - b.x0);   // descarta a cabeca solta do canto
    const piece = async (c, name, w) => { const o = cut(V, c, 2); clean(o, 300); info.veh = info.veh || {}; info.veh[name] = { px: [o.W, o.H] }; await spr(o, name, w, 84); return o; };
    { const o = cut(V, row0[0], 2); const { d, W, H } = o, lab = new Int32Array(W * H); let best = 0, bl = 0, id = 0;   // so o maior componente (a cabeca solta do canto entra na caixa)
      for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] < 40) continue; id++; let n = 0; const st = [p0]; lab[p0] = id; while (st.length) { const p = st.pop(), x = p % W; n++; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] < 40) continue; lab[q] = id; st.push(q); } } if (n > best) { best = n; bl = id; } }
      for (let p = 0; p < W * H; p++) if (lab[p] !== bl) d[p * 4 + 3] = 0; const b = bbox(o, 30), c = crop(o, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1); info.veh = info.veh || {}; info.veh.wyvern = { px: [c.W, c.H] }; await spr(c, 'wyvern', 420, 84); await img(c).flatten({ background: '#3a2020' }).jpeg().toFile(S + '/work/p_wyvern.jpg'); }
    // asa: o ombro fica embaixo a esquerda; o sprite ganha a mesma altura vazia embaixo para o centro cair na linha do ombro (o flap achata em torno do centro)
    { const o = cut(V, row0[1], 2); clean(o, 300); const W2 = o.W, H2 = o.H * 2, d = Buffer.alloc(W2 * H2 * 4); for (let y = 0; y < o.H; y++) o.d.copy(d, y * W2 * 4, y * o.W * 4, (y + 1) * o.W * 4); info.veh.wing = { px: [o.W, o.H] }; await spr({ d, W: W2, H: H2 }, 'wing', 260, 84); }
    await piece(row0[2], 'boat', 520);
    const r1 = R[1].sort((a, b) => a.x0 - b.x0); await piece(r1[0], 'gargoyle', 300); await piece(r1[1], 'ghost', 200); await piece(r1[2], 'fspirit', 240); await piece(r1[3], 'crow', 260); }

  // ---------------- folha 2: primeiro plano / beira da estrada (com borda branca de adesivo, removida)
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png')); console.log('borda branca removida', unsticker(P2), 'px'); const R = blobs(P2, 6, 4000, [0.3, 0.7]); console.log('props2', R.map(r => r.length));
    const n1 = ['thorn', 'bonepile', 'obsid', 'lavarock', 'redgrass'], w1 = [300, 300, 260, 300, 260]; for (let i = 0; i < 5; i++) if (R[0][i]) await spr(cut(P2, R[0][i]), n1[i], w1[i], 82);
    const n2 = ['brazier', 'tomb', 'fence', 'cauldron', 'bonesign', 'gallows'], w2 = [200, 180, 260, 220, 180, 220]; for (let i = 0; i < 6; i++) if (R[1][i]) await spr(cut(P2, R[1][i]), n2[i], w2[i], 84);
    const n3 = ['pike', 'ventrock', 'gstatue', 'column', 'chest', 'lavabasin'], w3 = [140, 260, 230, 170, 240, 260]; for (let i = 0; i < 6; i++) if (R[2][i]) await spr(cut(P2, R[2][i]), n3[i], w3[i], 84);
    // estaca com caveira e lanterna: a lanterna fica a ~76% da largura; margem a esquerda para ela cair no centro (o brilho do tipo lantern e centrado)
    { const o = cut(P2, R[2][0]), pad = Math.round((2 * 0.76 - 1) * o.W), W2 = o.W + pad, d = Buffer.alloc(W2 * o.H * 4); for (let y = 0; y < o.H; y++) o.d.copy(d, (y * W2 + pad) * 4, y * o.W * 4, (y + 1) * o.W * 4); await spr({ d, W: W2, H: o.H }, 'lantern', 200, 84); }
    // morcego na coluna quebrada: poleiro e morcego no MESMO enquadramento (hopper)
    { const bo = cut(P2, R[2][3], 1), FW = 300, FH = bo.H + 200, PH = Math.round(bo.H * 0.42), bl = { input: await img(bo).png().toBuffer(), left: Math.round((FW - bo.W) / 2), top: FH - bo.H };
      const post = await sharp({ create: { width: FW, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([bl]).png().toBuffer(); const r = await sharp(post).resize(120).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/perch.webp'); info.spr.perch = [r.width, r.height];
      const sm = await sharp(S + '/work/bt_stand.png').metadata(), fr = []; for (const n of ['bt_stand', 'bt_lean']) { const m = await sharp(S + '/work/' + n + '.png').metadata(), hh = Math.round(PH * m.height / sm.height), buf = await sharp(S + '/work/' + n + '.png').resize(null, hh).png().toBuffer(), mm = await sharp(buf).metadata(); fr.push({ input: buf, left: Math.round((FW - mm.width) / 2), top: FH - bo.H + 10 - hh }); }
      await sheet(fr, FW, FH, 'batsit', 240, 86); info.bat = { frame: [FW, FH], postH: bo.H, cy: (FH - bo.H + 10 - PH / 2) / FH };
      await sharp({ create: { width: FW, height: FH, channels: 3, background: '#3a2020' } }).composite([{ input: post, left: 0, top: 0 }, fr[0]]).jpeg().toFile(S + '/work/p_batsit.jpg'); } }

  if (has('proc')) { const E4 = OUT + '/../era4/'; for (const f of ['hero_run.png']) fs.copyFileSync(E4 + f, OUT + '/' + f); }
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
