// ERA 6 (Futurista, cidade neon a noite): reconstroi camadas, decalques e sprites a partir dos brutos (Nano Banana 2, 2K).
// uso: node build6.js <pastaTrabalho com raw/ e work/> <pastaSaida> [etapas separadas por virgula]
// brutos: far.png mid.png midB.png ground.png (21:9) decals.png props.png veh.png props2.png (16:9), todos sobre VERDE #00FF00
// (a arte desta era tem rosa/roxo neon: o magenta das eras anteriores comeria a arte). O ceu e procedural (degrade + estrelas).
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

(async () => {
  // ---------------- ceu procedural: noite indigo -> violeta -> bruma rosa no horizonte, com estrelas (ladrilho de 1024 px que repete; estrelas por hash, inteiras dentro do ladrilho)
  if (has('sky')) { const W = 1024, H = 512, d = Buffer.alloc(W * H * 4), stops = [[0, [12, 10, 38]], [0.3, [26, 20, 70]], [0.58, [58, 34, 110]], [0.8, [120, 58, 150]], [1, [176, 88, 170]]];
    const at = t => { let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++; const a = stops[k], b = stops[k + 1], u = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, q) => v + (b[1][q] - v) * u); };
    for (let y = 0; y < H; y++) { const c = at(y / (H - 1)); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, n = (hash(x, y) - 0.5) * 2; d[i] = Math.round(c[0] + n); d[i + 1] = Math.round(c[1] + n); d[i + 2] = Math.round(c[2] + n); d[i + 3] = 255; } }
    for (let k = 0; k < 150; k++) { const cx = 4 + hash(k, 1) * (W - 8), cy = 3 + Math.pow(hash(k, 2), 1.4) * H * 0.62, big = hash(k, 3) > 0.9, r = big ? 2.2 : 0.8 + hash(k, 4) * 0.9, a = (1 - cy / H / 0.75) * (0.55 + 0.45 * hash(k, 5)), tint = hash(k, 6) < 0.25 ? [255, 190, 240] : hash(k, 6) < 0.5 ? [180, 240, 255] : [255, 255, 255];
      for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) { const dd = Math.hypot(x - cx, y - cy), v = Math.max(0, 1 - dd / (r + 0.6)) * a + (big ? Math.max(0, 1 - Math.abs(x - cx) / 5) * Math.max(0, 1 - Math.abs(y - cy) / 0.8) * 0.5 * a + Math.max(0, 1 - Math.abs(y - cy) / 5) * Math.max(0, 1 - Math.abs(x - cx) / 0.8) * 0.5 * a : 0); if (v <= 0) continue; const i = (y * W + x) * 4; for (let q = 0; q < 3; q++) d[i + q] = Math.round(d[i + q] + (tint[q] - d[i + q]) * Math.min(1, v)); } }
    info.skyTop = at(0); info.skyHi = at(0.2); info.skyMid = at(0.45); info.skyLow = at(0.7); info.skyBottom = at(1); await save({ d, W, H }, 'sky', 1024, 88); }

  // ---------------- far: skyline neon com a via elevada (skyway) de ponta a ponta. Ladrilho ESPELHADO (sem fusao). Base esmaece.
  if (has('far')) { const src = safeKey(await load(S + '/raw/far.png')); const b = bbox(src, 60), top = Math.max(0, b.y0 - 6), Hf = src.H - top; console.log('far bbox', b);
    const far = crop(src, 0, top, src.W, Hf); const { d, W, H } = far;
    // topo do tabuleiro da via: primeira linha (de cima) a partir de 45% em que a faixa ciano clara cobre quase toda a largura
    let deck = -1; for (let y = Math.round(H * 0.4); y < H * 0.7 && deck < 0; y++) { let c = 0; for (let x = 0; x < W; x += 3) { const i = (y * W + x) * 4; if (d[i + 2] > 170 && d[i + 1] > 140) c++; } if (c > W / 3 * 0.85) deck = y; }
    console.log('via elevada (topo da faixa clara) y =', deck, deck / H);
    const F0 = Math.round(H * 0.82); for (let y = F0; y < H; y++) { const t = 1 - (y - F0) / (H - F0), a = t * t * (3 - 2 * t); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4 + 3; d[i] = Math.round(d[i] * a); } }
    info.farCrop = [0, top, W, H]; info.farDeck = deck / H;
    await save(far, 'far', 1900, 80); await prev(far, 'far', 1500); }

  // ---------------- mid A (lojinha de lamen, torre de vidro, eletroposto, painel holografico, guarita com mastro) / mid B (ponto, oficina de robos, quiosque, subestacao, torre de comunicacao)
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png')), B = safeKey(await load(S + '/raw/midB.png')); const ylA = baseline(A), ylB = baseline(B); console.log('soltos', clean(A), clean(B), 'linha de base', ylA, ylB);
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0, bB.y1 - bB.y0) + 1; console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    // vidro do ponto de onibus (mid B): veio esverdeado e opaco; vira vidro azulado translucido (retangulo em px da previa de 1584 = metade do bruto)
    { const { d, W } = cB; let n = 0; for (let y = 330 * 2; y < 575 * 2; y++) for (let x = 45 * 2; x < 390 * 2; x++) { const i = (y * W + x) * 4; const px = x / 2, py = y / 2; if (d[i + 3] < 200 || (px > 62 && px < 150 && py > 410 && py < 566) || (px > 288 && px < 362 && py > 422 && py < 546)) continue; const r = d[i], g = d[i + 1], b = d[i + 2]; if (g > r + 60 && r < 145 && g > b + 8) { const l = (r + g + b) / 3; d[i] = Math.round(l * 0.62); d[i + 1] = Math.round(l * 0.95); d[i + 2] = Math.min(255, Math.round(l * 1.25)); d[i + 3] = 130; n++; } } console.log('vidro', n); }
    // braco robotico no telhado da oficina (mid B): recortado para virar sprite que se mexe (props tilt); acima do telhado so ha fundo, nada a remendar
    { const R0 = [452 * 2, 158 * 2, 618 * 2, 322 * 2], w = R0[2] - R0[0], h = R0[3] - R0[1], arm = crop(cB, R0[0], R0[1], w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cB.d[((y + R0[1]) * cB.W + x + R0[0]) * 4 + 3] = 0;
      info.arm = { rect: [R0[0] / cB.W, R0[1] / cB.H, w / cB.W, h / cB.H] }; await spr(arm, 'arm', 240, 86); }
    await img(cA).png().toFile(S + '/work/midA_full.png'); await img(cB).png().toFile(S + '/work/midB_full.png');
    await save(cA, 'midA', 2500, 72); await save(cB, 'midB', 2500, 72); await prev(cA, 'midA', 1584); await prev(cB, 'midB', 1584);
    for (const n of ['midA', 'midB']) { const r = await sharp(fs.readFileSync(OUT + '/' + n + '.webp')).resize(880).webp({ quality: 60, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- mascaras de neon tiradas da propria arte do mid (pixels de neon dentro de um retangulo; retangulos em px da previa de 1584)
  // tipo: 'pink' (rosa/roxo vivo), 'cyan' (ciano vivo), 'bright' (qualquer pixel muito claro e saturado), 'all' (todo pixel opaco do retangulo)
  if (has('masks')) { const PW = 1584, defs = JSON.parse(fs.readFileSync(__dirname + '/masks6.json', 'utf8')); info.masks = {};
    for (const [tile, file] of [[0, 'midA_full'], [1, 'midB_full']]) { const o = await load(S + '/work/' + file + '.png'), K = o.W / PW;
      for (const m of defs.filter(q => q.tile === tile)) { const [x0, y0, x1, y1] = m.rect.map(v => Math.round(v * K)), w = x1 - x0, h = y1 - y0, c = crop(o, x0, y0, w, h), out = Buffer.alloc(w * h * 4);
        for (let p = 0; p < w * h; p++) { const i = p * 4, r = c.d[i], g = c.d[i + 1], b = c.d[i + 2], al = c.d[i + 3], mx = Math.max(r, g, b), mn = Math.min(r, g, b); let v = 0;
          if (al > 100) { if (m.kind === 'pink') v = (r > 170 && b > 140 && g < r - 40) ? 1 : 0; else if (m.kind === 'cyan') v = (b > 190 && g > 170 && r < g - 30) ? 1 : 0; else if (m.kind === 'bright') v = (mx > 200 && mx - mn > 50) || mn > 215 ? 1 : 0; else v = 1; }
          out[i] = out[i + 1] = out[i + 2] = 255; out[i + 3] = Math.round(255 * v * al / 255); }
        const mo = { d: out, W: w, H: h }; await spr(mo, m.name, Math.min(w, m.maxW || 400), 90); info.masks[m.name] = { tile, rect: [x0 / o.W, y0 / o.H, w / o.W, h / o.H] };
        await img(mo).flatten({ background: '#000' }).jpeg().toFile(S + '/work/m_' + m.name + '.jpg'); } } }

  // ---------------- chao: calcada de placas, guia com fita ciano, pista lisa com 2 linhas rosa, guia, calcada.
  // A pista e remapeada na vertical para as linhas rosa cairem em ~0,56 (como a faixa amarela da era 5) e o ladrilho e cortado num periodo exato das placas, com fusao curta na emenda.
  if (has('ground')) { const g0 = await load(S + '/raw/ground.png'); const { W, H } = g0;
    const map = [[0, 0], [290, 290], [752, 643], [809, 700], [H, H]], srcY = y => { let k = 0; while (k < map.length - 2 && y > map[k + 1][0]) k++; const a = map[k], b = map[k + 1]; return a[1] + (y - a[0]) * (b[1] - a[1]) / (b[0] - a[0]); };
    const g1 = { d: Buffer.alloc(W * H * 4), W, H }; for (let y = 0; y < H; y++) { const sy = srcY(y), y0 = Math.floor(sy), y1 = Math.min(H - 1, y0 + 1), f = sy - y0; for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, a = (y0 * W + x) * 4, b = (y1 * W + x) * 4; for (let q = 0; q < 4; q++) g1.d[i + q] = Math.round(g0.d[a + q] * (1 - f) + g0.d[b + q] * f); } }
    // periodo: diferenca media entre colunas x e x+P (so as calcadas, onde as juntas marcam), P entre 1700 e 3000
    const lum = (x, y) => { const i = (y * W + x) * 4; return g1.d[i] + g1.d[i + 1] + g1.d[i + 2]; };
    let best = 1e18, P = 0; for (let p = 1700; p <= 3000; p++) { let s = 0, n = 0; for (let y = 10; y < H; y += 6) for (let x = 0; x + p < W; x += 5) { s += Math.abs(lum(x, y) - lum(x + p, y)); n++; } s /= n; if (s < best) { best = s; P = p; } }
    console.log('periodo do chao', P, 'dif media', best.toFixed(2));
    const O = 70; let X0 = 0, bc = 1e18; for (let x0 = 0; x0 + P + O < W; x0 += 2) { let c = 0; for (let y = 4; y < H; y += 3) { if (y > 300 && y < 1060) continue; for (let x = x0; x < x0 + O; x += 2) c += Math.abs(lum(x, y) - lum(x + P, y)); } if (c < bc) { bc = c; X0 = x0; } } console.log('emenda do chao em', X0, 'custo', bc); const src = crop(g1, X0, 0, P + O, H); const { wrap } = require('./lib.js'); const g = wrap(src, O); const WT = g.W;
    const RAMP = 22; for (let y = 0; y < RAMP; y++) for (let x = 0; x < WT; x++) g.d[(y * WT + x) * 4 + 3] = Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3));
    // faixas (em fracao do arquivo) medidas no bruto e levadas pelo remapeamento
    const inv = sy => { for (let y = 0; y < H; y++) if (srcY(y) >= sy) return y; return H; };
    info.curb = [inv(150) / H, inv(1080) / H]; info.road = [inv(290) / H, inv(1060) / H]; info.line = [inv(643) / H, inv(700) / H]; info.groundRamp = RAMP / H; console.log('faixas', info.curb, info.road, info.line, 'ladrilho', WT);
    await save(g, 'ground', 1600, 84); await prev(g, 'ground', 1500);
    const w = 400, Lb = await img(crop(g, WT - w, 0, w, H)).png().toBuffer(), Rb = await img(crop(g, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#3a2d6a' } }).composite([{ input: Lb, left: 0, top: 0 }, { input: Rb, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 88 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre verde
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'));
    const names = [['manhole', 'hatch', 'grate', 'oil', 'puddle'], ['crackp', 'crack', 'patch', 'bolts', 'cell'], ['cable', 'can', 'pcb', 'flyer', 'cup'], ['scrap', 'shard', 'leaves', 'chip', 'skid']];
    const R = blobs(D, 14, 600, [0.25, 0.5, 0.75]); console.log('decals', R.map(r => r.length));
    const SC = 0.42, AW = 1180; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const nm = names[r][c]; if (!nm || !R[r][c]) continue; const sub = cut(D, R[r][c], 4), ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#26305a' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens, planeta, lua / passaro-robo (5 poses de voo, em pe, bicando) / cao-robo (4 passos + sentado) / antena, anel holografico, 2 flamulas (vazadas: fora), gato-robo
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png')); const R = blobs(P1, 14, 5000, [0.26, 0.5, 0.75]); if (R[1].length === 6) R[1].splice(5, 1, ...splitX(P1, R[1][5], 6)); console.log('props1', R.map(r => r.length));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 440, 80);
    await spr(cut(P1, R[0][3]), 'planet', 360, 84); await spr(cut(P1, R[0][4]), 'moon', 120, 84);
    { const F = 420, frames = []; for (const k of [0, 1, 2, 3, 2, 1]) { const o = cut(P1, R[1][k], 2); let bx = -1, by = 0; for (let x = o.W - 1; x >= 0 && bx < 0; x--) for (let y = 0; y < o.H; y++) if (o.d[(y * o.W + x) * 4 + 3] > 200) { bx = x; by = y; break; }   // alinha pela ponta do bico
        frames.push({ input: await img(o).png().toBuffer(), left: 404 - bx, top: 215 - by }); console.log('passaro', k, o.W, o.H, 'bico', bx, by); }
      await sheet(frames, F, F, 'rbird', 150 * 6, 86); }
    for (const [k, n] of [[5, 'rb_stand'], [6, 'rb_peck']]) await img(cut(P1, R[1][k], 2)).png().toFile(S + '/work/' + n + '.png');
    { const FW = 560, FH = 430, frames = []; for (const k of [4, 0, 1, 2, 3]) { const f = await place(cut(P1, R[2][k], 2), FW, FH, FW / 2, FH - 4); frames.push(f); console.log('cao', k, f.w, f.h); } await sheet(frames, FW, FH, 'rdog', 5 * 190, 86); }
    { const o = cut(P1, R[3][0]); await spr(rot90(rot90(rot90(o))), 'dish', 240, 84); }   // guardada deitada: o rotor com flap e ang = 90 graus a poe em pe e a faz girar em torno do eixo vertical
    { const o = cut(P1, R[3][R[3].length - 1]); await spr(o, 'rcat', 200, 84); } }

  // ---------------- veiculos: trem maglev, nave-mae / 4 carros flutuantes / onibus, caminhao voador, drone (corpo), helice do drone, moto (fora)
  if (has('veh')) { const V = safeKey(await load(S + '/raw/veh.png')); const R = blobs(V, 14, 3000, [0.45, 0.72]); console.log('veh', R.map(r => r.map(c => [c.x0, c.y0, c.x1, c.y1].join(','))));
    const piece = async (c, name, w) => { const o = cut(V, c, 2); clean(o, 300); info.veh = info.veh || {}; info.veh[name] = { px: [o.W, o.H] }; await spr(o, name, w, 84); return o; };
    await piece(R[0][0], 'train', 900); await piece(R[0][1], 'mship', 700);
    const cars = ['carP', 'taxi', 'van', 'police']; for (let i = 0; i < 4; i++) await piece(R[1][i], cars[i], 300);
    const r2 = R[2].slice().sort((a, b) => a.x0 - b.x0); console.log('fileira 3', r2.map(c => [c.x0, c.y0, c.x1, c.y1].join(',')).join(' | '));
    await piece(r2[0], 'bus', 520); await piece(r2[1], 'truck', 420);
    // drone: helice (barra fina, em cima) e corpo; a fusao pode juntar os dois: separa pela faixa vazia horizontal
    const dr = r2.filter(c => c.x0 > r2[1].x1 && c.x1 < r2[r2.length - 1].x0 + 10 || (r2.length === 4 && c === r2[2]));
    const dc = dr.reduce((a, c) => ({ x0: Math.min(a.x0, c.x0), y0: Math.min(a.y0, c.y0), x1: Math.max(a.x1, c.x1), y1: Math.max(a.y1, c.y1) }), { x0: 1e9, y0: 1e9, x1: 0, y1: 0 });
    const dro = cut(V, dc, 2), rowsY = runs((() => { const r = new Uint8Array(dro.H); for (let y = 0; y < dro.H; y++) { let c = 0; for (let x = 0; x < dro.W; x++) if (dro.d[(y * dro.W + x) * 4 + 3] > 60) c++; r[y] = c > 1; } return r; })(), 4, 4); console.log('drone faixas', JSON.stringify(rowsY));
    const prop = crop(dro, 0, rowsY[0][0], dro.W, rowsY[0][1] - rowsY[0][0] + 1), pb = bbox(prop, 60), propC = crop(prop, pb.x0, pb.y0, pb.x1 - pb.x0 + 1, pb.y1 - pb.y0 + 1);
    const body = crop(dro, 0, rowsY[1][0], dro.W, dro.H - rowsY[1][0]), bb = bbox(body, 60), bodyC = crop(body, bb.x0, bb.y0, bb.x1 - bb.x0 + 1, bb.y1 - bb.y0 + 1);
    info.veh.drone = { px: [bodyC.W, bodyC.H] }; await spr(bodyC, 'drone', 220, 84); info.veh.prop = { px: [propC.W, propC.H] }; await spr(rot90(propC), 'prop', 24, 84);
    await img(bodyC).flatten({ background: '#3a2d6a' }).jpeg().toFile(S + '/work/p_drone.jpg');
    const pvw = []; let px = 0; for (const n of ['train', 'carP', 'taxi', 'van', 'police', 'bus', 'truck', 'drone']) { pvw.push({ input: fs.readFileSync(OUT + '/' + n + '.webp'), left: px, top: 0 }); px += info.spr[n][0] + 10; } await sharp({ create: { width: px, height: 300, channels: 3, background: '#3a2d6a' } }).composite(pvw).jpeg({ quality: 84 }).toFile(S + '/work/p_veh.jpg'); }

  // ---------------- folha 2: primeiro plano / beira da rua
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png')); const R = blobs(P2, 6, 4000, [0.3, 0.7]); console.log('props2', R.map(r => r.length));
    const n1 = ['fern', 'agrass', 'crystal', 'crate', 'cables'], w1 = [320, 260, 260, 260, 300]; for (let i = 0; i < 5; i++) if (R[0][i]) await spr(cut(P2, R[0][i]), n1[i], w1[i], 82);
    const n2 = ['lamp', 'vend', 'bench', 'rbin', 'bollard', 'screen'], w2 = [140, 220, 260, 180, 90, 170]; for (let i = 0; i < 6; i++) if (R[1][i]) await spr(cut(P2, R[1][i]), n2[i], w2[i], 84);
    const n3 = ['barrier', 'hydrant', 'scooter', 'palm', 'pbox', 'vent'], w3 = [260, 150, 280, 180, 170, 200]; for (let i = 0; i < 6; i++) if (R[2][i]) await spr(cut(P2, R[2][i]), n3[i], w3[i], 84);
    // poste de luz ambar: a cabeca fica a 74% da largura; o sprite 'lantern' ganha margem a esquerda para a cabeca cair no centro (o brilho do tipo lantern e centrado)
    { const o = cut(P2, R[1][0]), pad = Math.round((2 * 0.74 - 1) * o.W), W2 = o.W + pad, d = Buffer.alloc(W2 * o.H * 4); for (let y = 0; y < o.H; y++) o.d.copy(d, (y * W2 + pad) * 4, y * o.W * 4, (y + 1) * o.W * 4); await spr({ d, W: W2, H: o.H }, 'lantern', 200, 84); }
    // passaro-robo no pilarete de recarga: pilarete e passaro no MESMO enquadramento (o hopper desenha os dois no mesmo retangulo)
    { const bo = cut(P2, R[1][4], 1), FW = 260, FH = bo.H + 170, PH = Math.round(bo.H * 0.42), bl = { input: await img(bo).png().toBuffer(), left: Math.round((FW - bo.W) / 2), top: FH - bo.H };
      const post = await sharp({ create: { width: FW, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([bl]).png().toBuffer(); const r = await sharp(post).resize(110).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/bollardP.webp'); info.spr.bollardP = [r.width, r.height]; console.log('bollardP', r.width, r.height, r.size);
      const sm = await sharp(S + '/work/rb_stand.png').metadata(), fr = []; for (const n of ['rb_stand', 'rb_peck']) { const m = await sharp(S + '/work/' + n + '.png').metadata(), hh = Math.round(PH * m.height / sm.height), buf = await sharp(S + '/work/' + n + '.png').resize(null, hh).png().toBuffer(), mm = await sharp(buf).metadata(); fr.push({ input: buf, left: Math.round((FW - mm.width) / 2), top: FH - bo.H + 6 - hh }); }
      await sheet(fr, FW, FH, 'rbirdsit', 220, 86); info.rbird = { frame: [FW, FH], bollardH: bo.H, cy: (FH - bo.H + 6 - PH / 2) / FH };
      await sharp({ create: { width: FW, height: FH, channels: 3, background: '#3a2d6a' } }).composite([{ input: post, left: 0, top: 0 }, fr[0]]).jpeg().toFile(S + '/work/p_rbirdsit.jpg'); } }

  // ---------------- procedurais: rua de tras (faixa de luz flutuante), copias reaproveitadas
  if (has('proc')) {
    // arcos eletricos entre as 2 bobinas da subestacao (mid B): 3 ziguezagues brancos (mascaras de flow), retangulo [1100,196,1276,264] da previa de 1584
    for (let k = 0; k < 3; k++) { const W = 352, H = 136; let p = 'M8 ' + (H - 14); for (let i = 1; i <= 9; i++) { const x = 8 + i * (W - 16) / 10, y = 20 + 60 * Math.sin(Math.PI * i / 10) * -1 + H - 40 - 50 * Math.sin(Math.PI * i / 10) + (hash(i, k + 3) - 0.5) * 34; p += ' L' + x.toFixed(1) + ' ' + Math.max(6, y).toFixed(1); } p += ' L' + (W - 8) + ' ' + (H - 14);
      await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '"><path d="' + p + '" fill="none" stroke="#fff" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" opacity="0.55"/><path d="' + p + '" fill="none" stroke="#fff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>', 'arc' + k, 90); }
    const E4 = OUT + '/../era4/'; for (const f of ['hero_run.png']) fs.copyFileSync(E4 + f, OUT + '/' + f); }

  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
