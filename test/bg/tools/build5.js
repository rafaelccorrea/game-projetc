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
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const loadWebp = async f => { const b = await sharp(fs.readFileSync(f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: b.data, W: b.info.width, H: b.info.height }; };
// apaga a linha de base desenhada sob as pecas onde nao ha nada em cima dela (vaos) e tudo abaixo dela
function baseline(o, from) { const { d, W, H } = o; let best = 0, yl = H - 1; for (let y = Math.round(H * (from || 0.8)); y < H; y++) { let c = 0; for (let x = 0; x < W; x += 2) if (d[(y * W + x) * 4 + 3] > 128) c++; if (c >= best) { best = c; yl = y; } }
  let n = 0; for (let x = 0; x < W; x++) { const up = d[((yl - 12) * W + x) * 4 + 3] > 128; for (let y = yl - 8; y < H; y++) { const i = (y * W + x) * 4 + 3; if (!up || y > yl + 1) { if (d[i]) n++; d[i] = 0; } } } return yl; }
// recorta e centra uma peca num quadro w x h com a base no fundo (ou alinhada por ancora)
const place = async (o, FW, FH, ax, ay) => { const b = bbox(o, 60), c = crop(o, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1); return { input: await img(c).png().toBuffer(), left: Math.round(ax - c.W / 2), top: Math.round(ay - c.H), w: c.W, h: c.H }; };
const sheet = async (frames, FW, FH, name, outW, q = 86) => { const comp = frames.map((f, k) => ({ input: f.input, left: k * FW + f.left, top: f.top })); const b = await sharp({ create: { width: FW * frames.length, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer(); const r = await sharp(b).resize(outW).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width / frames.length, r.height]; await sharp(b).resize(Math.min(1500, FW * frames.length)).flatten({ background: '#8fc4ea' }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg'); };
const rot90 = o => { const out = Buffer.alloc(o.d.length), W = o.H, H = o.W; for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) { const nx = o.H - 1 - y, ny = x; o.d.copy(out, (ny * W + nx) * 4, (y * o.W + x) * 4, (y * o.W + x) * 4 + 4); } return { d: out, W, H }; };   // gira 90 graus no sentido horario

(async () => {
  // ---------------- ceu procedural: degrade vertical de dia (azul -> bruma clara); repete em si mesmo
  if (has('sky')) { const W = 256, H = 512, d = Buffer.alloc(W * H * 4), stops = [[0, [62, 150, 222]], [0.35, [104, 184, 238]], [0.62, [158, 212, 244]], [0.82, [206, 232, 247]], [1, [226, 240, 248]]];
    const at = t => { let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++; const a = stops[k], b = stops[k + 1], u = (t - a[0]) / (b[0] - a[0]); return a[1].map((v, q) => v + (b[1][q] - v) * u); };
    for (let y = 0; y < H; y++) { const c = at(y / (H - 1)); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4, n = (hash(x, y) - 0.5) * 2; d[i] = Math.round(c[0] + n); d[i + 1] = Math.round(c[1] + n); d[i + 2] = Math.round(c[2] + n); d[i + 3] = 255; } }
    info.skyTop = at(0); info.skyHi = at(0.2); info.skyMid = at(0.45); info.skyLow = at(0.7); info.skyBottom = at(1); await save({ d, W, H }, 'sky', 256, 90); }

  // ---------------- far: horizonte de torres de vidro com viaduto de concreto de ponta a ponta. Ladrilho que repete (fusao de O px nas bordas, onde ha o mesmo predio baixo).
  if (has('far')) { const src = safeKey(await load(S + '/raw/far.png')); const b = bbox(src, 60), O = 96, top = Math.max(0, b.y0 - 6), Hf = src.H - top; console.log('far bbox', b);
    const far = crop(src, 0, top, src.W, Hf);   /* tile mirror: a emenda e sempre a imagem com o seu espelho (sem fusao) */ const { d, W, H } = far;
    const F0 = Math.round(H * 0.84); for (let y = F0; y < H; y++) { const t = 1 - (y - F0) / (H - F0), a = t * t * (3 - 2 * t); for (let x = 0; x < W; x++) { const i = (y * W + x) * 4 + 3; d[i] = Math.round(d[i] * a); } }
    info.farCrop = [0, top, W, H]; info.farTopPx = top;
    await save(far, 'far', 1900, 80); await prev(far, 'far', 1500, '#8fc4ea');
}

  // ---------------- mid A (sacos de areia, predio de tijolos, semaforo, outdoor, guarita) / mid B (ponto de onibus, predio em ruinas, metro, lanchonete, radar)
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png'), true), B = safeKey(await load(S + '/raw/midB.png'), true); const ylA = baseline(A), ylB = baseline(B); console.log('soltos', clean(A), clean(B), 'linha de base', ylA, ylB);
    // vidro do ponto de onibus fica translucido
    { const { d, W } = B; let n = 0; for (let y = 880; y < ylB - 30; y++) for (let x = 60; x < 700; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 250) continue; const r = d[i], g = d[i + 1], b = d[i + 2], l = (r + g + b) / 3; if (b >= r + 8 && g >= r - 2 && l > 95 && l < 225) { d[i + 3] = 140; n++; } } console.log('vidro', n); }
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0, bB.y1 - bB.y0) + 1; console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    await save(cA, 'midA', 2500, 72); await save(cB, 'midB', 2500, 72); await prev(cA, 'midA', 1584, '#8fc4ea'); await prev(cB, 'midB', 1584, '#8fc4ea');
    for (const n of ['midA', 'midB']) { const r = await sharp(fs.readFileSync(OUT + '/' + n + '.webp')).resize(880).webp({ quality: 60, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- chao: calcada de lajes, guia, asfalto liso com faixa dupla amarela continua, guia, calcada. Ladrilho cortado de junta a junta de laje.
  if (has('ground')) { const g0 = await load(S + '/raw/ground.png'); const { d, W, H } = g0, lum = (x, y) => { const i = (y * W + x) * 4; return d[i] + d[i + 1] + d[i + 2]; };
    const joints = y => { const r = []; let run = 0; for (let x = 0; x < W; x++) { let s = 0; for (let k = -30; k <= 30; k += 10) s += lum(x, y + k); if (s / 7 < 330) run++; else { if (run >= 2) r.push(Math.round(x - run / 2)); run = 0; } } return r; };
    const jt = joints(120), jb = joints(H - 100); console.log('juntas cima', jt.join(','), '| baixo', jb.join(','));
    // bandas: mede as transicoes verticais na coluna central
    const col = Math.round(W / 2) + 40, prof = []; for (let y = 0; y < H; y++) prof.push(Math.round(lum(col, y) / 3)); let last = prof[0], trans = []; for (let y = 1; y < H; y++) if (Math.abs(prof[y] - last) > 26) { trans.push(y + ':' + last + '>' + prof[y]); last = prof[y]; } else last = last * 0.7 + prof[y] * 0.3; console.log('bandas', trans.join(' '));
    const X0 = jt[1], X1 = jt[11], WT = X1 - X0, RAMP = 22, g = crop(g0, X0, 0, WT, H); for (let y = 0; y < RAMP; y++) for (let x = 0; x < WT; x++) g.d[(y * WT + x) * 4 + 3] = Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3));
    info.road = [324 / H, 1087 / H]; info.curb = [254 / H, 1129 / H]; info.line = [755 / H, 808 / H]; info.groundRamp = RAMP / H; console.log('ladrilho do chao', X0, X1, WT);
    await save(g, 'ground', 1600, 84); await prev(g, 'ground', 1500, '#8fc4ea');
    const w = 400, Lb = await img(crop(g, WT - w, 0, w, H)).png().toBuffer(), Rb = await img(crop(g, 0, 0, w, H)).png().toBuffer(); const j = await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#8fc4ea' } }).composite([{ input: Lb, left: 0, top: 0 }, { input: Rb, left: w, top: 0 }]).png().toBuffer(); await sharp(j).jpeg({ quality: 88 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre magenta (a marca de pneu veio arroxeada: fica fora)
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'), true);
    const names = [['oil1', 'oil2', 'manhole', 'grate', 'paper'], ['crack1', 'crack2', 'patch', 'puddle', null], ['leaves', 'casings', 'can', 'glass', 'cardboard'], ['rubble3', 'brick', 'cup', 'bolt', 'cloth']];
    const R = blobs(D, 40, 1500, [0.25, 0.5, 0.75]); console.log('decals', R.map(r => r.length));
    const SC = 0.42, AW = 1180; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const nm = names[r][c]; if (!nm || !R[r][c]) continue; const sub = cut(D, R[r][c], 4), ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 82, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#40536a' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens / pombo (5 poses de voo, em pe, bicando) / cachorro (4 passos + sentado) / 3 bandeiras + antena de radar
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png'), true); const R = blobs(P1, 14, 5000, [0.23, 0.5, 0.75]); console.log('props1', R.map(r => r.length));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 440, 80);
    { const F = 420, frames = []; for (const k of [0, 1, 2, 3, 2, 1]) { const o = cut(P1, R[1][k], 2); let bx = -1, by = 0; for (let x = o.W - 1; x >= 0 && bx < 0; x--) for (let y = 0; y < o.H; y++) if (o.d[(y * o.W + x) * 4 + 3] > 200) { bx = x; by = y; break; }   // alinha pela ponta do bico
        frames.push({ input: await img(o).png().toBuffer(), left: 404 - bx, top: 215 - by }); console.log('pombo', k, o.W, o.H, 'bico', bx, by); }
      await sheet(frames, F, F, 'pigeon', 150 * 6, 86); }
    for (const [k, n] of [[5, 'pg_stand'], [6, 'pg_peck']]) await img(cut(P1, R[1][k], 2)).png().toFile(S + '/work/' + n + '.png');
    { const FW = 560, FH = 430, frames = []; for (const k of [4, 0, 1, 2, 3]) { const f = await place(cut(P1, R[2][k], 2), FW, FH, FW / 2, FH - 4); frames.push(f); console.log('cao', k, f.w, f.h); } await sheet(frames, FW, FH, 'dog', 5 * 190, 86); }
    for (const [k, n] of [[0, 'flagR'], [2, 'flagO']]) { const o = cut(P1, R[3][k]), x0 = k === 0 ? 30 : 0; await spr(flop(crop(o, x0, 0, o.W - x0, o.H)), n, 280, 82); }   // sem o cabo cinza; presas pela direita
    { const o = cut(P1, R[3][3]); await spr(rot90(rot90(rot90(o))), 'dish', 200, 84); await img(o).resize(300).flatten({ background: '#8fc4ea' }).jpeg().toFile(S + '/work/p_dish.jpg'); } }

  // ---------------- veiculos: helicoptero sem pas + rotor (de perfil) + rotor de cauda / onibus, caminhao / sedan, taxi, jipe, 2 rodas
  if (has('veh')) { const V = safeKey(await load(S + '/raw/veh.png'), true); const R = blobs(V, 14, 4000, [0.33, 0.68]); console.log('veh', R.map(r => r.length)); info.veh = {};
    // rodas: cada trecho opaco a 12 px da base e uma roda; o raio e a maior meia-largura do trecho subindo linha a linha, ate ele se fundir com a carroceria (salto) ou comecar a estreitar
    const wheelsOf = o => { const b = bbox(o, 60), out = [], run = (y, cx) => { let a = cx, e = cx; if (o.d[(y * o.W + cx) * 4 + 3] <= 128) return 0; while (a > 0 && o.d[(y * o.W + a - 1) * 4 + 3] > 128) a--; while (e < o.W - 1 && o.d[(y * o.W + e + 1) * 4 + 3] > 128) e++; return (e - a + 1) / 2; }; let a = -1; const y0 = b.y1 - 12;
      for (let x = 0; x <= o.W; x++) { const on = x < o.W && o.d[(y0 * o.W + x) * 4 + 3] > 128; if (on && a < 0) a = x; if (!on && a >= 0) { const cx = Math.round((a + x - 1) / 2); let r = (x - a) / 2; a = -1; if (r < 14) continue; for (let h = 16; h < 200; h += 3) { const w = run(b.y1 - h, cx); if (w > r * 1.12 + 3 || w < r - 1) break; r = Math.max(r, w); } out.push([cx, Math.round(b.y1 - r), Math.round(r)]); } } return out; };
    const unline = o => { let n = 0; for (let y = o.H - 1; y > o.H * 0.7; y--) { let c = 0; for (let x = 0; x < o.W; x++) if (o.d[(y * o.W + x) * 4 + 3] > 128) c++; if (c > o.W * 0.8) { for (let x = 0; x < o.W; x++) o.d[(y * o.W + x) * 4 + 3] = 0; n++; } else if (n) break; } const b = bbox(o, 60); return crop(o, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1); };
    const veh = async (c, name, w) => { const o = c.d ? c : unline(cut(V, c, 2)); clean(o, 300); const FIXR = { truck: 80, jeep: 63 }, wh = wheelsOf(o).map(q => FIXR[name] ? [q[0], q[1] + q[2] - FIXR[name], FIXR[name]] : q), bb = bbox(o, 60);   /* raio medido a mao onde a deteccao erra */ for (let y = bb.y1 - 9; y <= bb.y1; y++) for (let x = 0; x < o.W; x++) if (!wh.some(q => Math.abs(x - q[0]) < q[2] * 0.62)) o.d[(y * o.W + x) * 4 + 3] = 0;   /* resto da linha de chao entre as rodas */ info.veh[name] = { px: [o.W, o.H], wheels: wh }; console.log(name, o.W, o.H, JSON.stringify(wh)); await spr(o, name, w, 84); };
    await veh(R[1][0], 'bus', 640); await veh(R[1][1], 'truck', 560);
    // fileira de baixo: uma linha de chao liga as pecas; corta a fileira inteira, tira a linha e separa por colunas vazias
    const r2 = R[2], row = (cut(V, { x0: Math.min(...r2.map(c => c.x0)), y0: Math.min(...r2.map(c => c.y0)), x1: Math.max(...r2.map(c => c.x1)), y1: Math.max(...r2.map(c => c.y1)) }, 2)), segs = runs(occX(row, 0, row.W, 0, row.H), 6, 30); console.log('fileira 3', row.W, row.H, JSON.stringify(segs));
    const piece = k => { const c = crop(row, segs[k][0], 0, segs[k][1] - segs[k][0] + 1, row.H), b = bbox(c, 60); return crop(c, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1); };
    await veh(piece(0), 'sedan', 380); await veh(piece(1), 'taxi', 380); await veh(piece(2), 'jeep', 330);
    { const o = cut(V, R[0][0], 2); info.veh.heli = { px: [o.W, o.H] }; await spr(o, 'heli', 430, 84); await img(o).resize(1200).flatten({ background: '#8fc4ea' }).jpeg().toFile(S + '/work/p_heli.jpg'); }
    { const o = cut(V, R[0][1], 2); info.veh.rotor = { px: [o.W, o.H] }; await spr(rot90(o), 'rotor', 30, 84); }
    { const o = cut(V, R[0][2], 2), sd = Math.max(o.W, o.H), q = { input: await img(o).png().toBuffer(), left: Math.round((sd - o.W) / 2), top: Math.round((sd - o.H) / 2) }; const b = await sharp({ create: { width: sd, height: sd, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([q]).png().toBuffer(); const r = await sharp(b).resize(72).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/trotor.webp'); info.spr.trotor = [72, 72]; console.log('trotor', r.size); }
    for (const [k, n, w] of [[3, 'wheel', 96], [4, 'wheelT', 110]]) { const o = piece(k), sd = Math.max(o.W, o.H), b = await sharp({ create: { width: sd, height: sd, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: await img(o).png().toBuffer(), left: Math.round((sd - o.W) / 2), top: Math.round((sd - o.H) / 2) }]).png().toBuffer(); const r = await sharp(b).resize(w).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/' + n + '.webp'); info.spr[n] = [w, w]; console.log(n, o.W, o.H, r.size); }
    const pvw = []; let px = 0; for (const n of ['bus', 'truck', 'sedan', 'taxi', 'jeep']) { pvw.push({ input: fs.readFileSync(OUT + '/' + n + '.webp'), left: px, top: 0 }); px += info.spr[n][0] + 10; } await sharp({ create: { width: px, height: 300, channels: 3, background: '#8fc4ea' } }).composite(pvw).jpeg({ quality: 84 }).toFile(S + '/work/p_veh.jpg'); }

  // ---------------- folha 2: primeiro plano / beira da rua
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png'), true); const R = blobs(P2, 14, 5000, [0.3, 0.66]); console.log('props2', R.map(r => r.length), R.map(r => r.map(c => [c.x0, c.y0, c.x1, c.y1].map(v => Math.round(v / 1.8347)).join(',')).join(' | ')).join(' // '));
    // a dilatacao juntou pecas vizinhas na vertical (ervas + poste; caixa de jornal + placa): essas 4 saem por retangulo medido na previa de 1500 px
    const K = P2.W / 1500, rect = (a, b, c, e) => { const o = crop(P2, Math.round(a * K), Math.round(b * K), Math.round((c - a) * K), Math.round((e - b) * K)), q = bbox(o, 60); return crop(o, Math.max(0, q.x0 - 3), Math.max(0, q.y0 - 3), Math.min(o.W, q.x1 + 4) - Math.max(0, q.x0 - 3), Math.min(o.H, q.y1 + 4) - Math.max(0, q.y0 - 3)); };
    await spr(rect(25, 50, 265, 243), 'weeds', 300, 82); await spr(rect(80, 244, 245, 545), 'lamp', 130, 84); await spr(rect(1118, 345, 1262, 545), 'vbox', 170, 84); await spr(rect(1100, 552, 1222, 828), 'signpole', 110, 84);
    const n1 = ['drygrass', 'rubble', 'cones', 'sandbags', 'drum'], w1 = [300, 340, 300, 340, 220]; for (let i = 0; i < 5; i++) await spr(cut(P2, R[0][i]), n1[i], w1[i], 82);
    const n2 = [null, 'barrel', 'hydrant', 'bin', null, 'vbox2'], w2 = [0, 190, 150, 180, 0, 170]; for (let i = 0; i < 6; i++) if (n2[i]) await spr(cut(P2, R[1][i]), n2[i], w2[i], 84);
    const n3 = ['bench', 'bike', 'mailbox', 'barrier', null, 'sawhorse'], w3 = [260, 250, 170, 300, 0, 230]; for (let i = 0; i < 6; i++) if (n3[i]) await spr(cut(P2, R[2][i]), n3[i], w3[i], 84);
    // pombo no pilarete: pilarete e pombo no MESMO enquadramento (o hopper desenha os dois no mesmo retangulo)
    { const bo = cut(P2, R[1][4], 1), FW = 260, FH = bo.H + 150, PH = Math.round(bo.H * 0.5), bl = { input: await img(bo).png().toBuffer(), left: Math.round((FW - bo.W) / 2), top: FH - bo.H };
      const post = await sharp({ create: { width: FW, height: FH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([bl]).png().toBuffer(); const r = await sharp(post).resize(110).webp({ quality: 84, alphaQuality: 100 }).toFile(OUT + '/bollardP.webp'); info.spr.bollardP = [r.width, r.height]; console.log('bollardP', r.width, r.height, r.size);
      const sm = await sharp(S + '/work/pg_stand.png').metadata(), fr = []; for (const n of ['pg_stand', 'pg_peck']) { const m = await sharp(S + '/work/' + n + '.png').metadata(), hh = Math.round(PH * m.height / sm.height), buf = await sharp(S + '/work/' + n + '.png').resize(null, hh).png().toBuffer(), mm = await sharp(buf).metadata(); fr.push({ input: buf, left: Math.round((FW - mm.width) / 2), top: FH - bo.H + 9 - hh }); }
      await sheet(fr, FW, FH, 'pigeonsit', 220, 86); info.pigeon = { frame: [FW, FH], bollardH: bo.H, cy: (FH - bo.H + 9 - PH / 2) / FH };
      await sharp({ create: { width: FW, height: FH, channels: 3, background: '#c9ccd0' } }).composite([{ input: post, left: 0, top: 0 }, fr[0]]).jpeg().toFile(S + '/work/p_pigeonsit.jpg'); } }

  // ---------------- procedurais: helice do ar-condicionado, mascaras (lampada do semaforo, painel do letreiro), rua de tras (ladrilho), copias reaproveitadas
  if (has('proc')) {
    { let s = '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">'; for (let i = 0; i < 4; i++) s += '<path d="M48 48 C56 30 74 22 80 34 C70 36 60 42 48 48Z" fill="#2c3238" stroke="#15181c" stroke-width="2.5" stroke-linejoin="round" transform="rotate(' + (i * 90) + ' 48 48)"/>'; s += '<circle cx="48" cy="48" r="9" fill="#5a646c" stroke="#15181c" stroke-width="3"/></svg>'; await svgOut(s, 'fan', 88); }
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><defs><radialGradient id="g"><stop offset="0.55" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0.75"/></radialGradient></defs><circle cx="24" cy="24" r="22" fill="url(#g)"/></svg>', 'lampmask', 90);
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="64"><rect x="3" y="3" width="122" height="58" rx="5" fill="#fff"/></svg>', 'signmask', 90);
    // rua de tras: guia clara, sarjeta, asfalto (ladrilho de 512 px que se repete); os veiculos do fundo rodam em cima dela
    { let s = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="112"><rect x="0" y="12" width="512" height="100" fill="#42566c"/><rect x="0" y="12" width="512" height="7" fill="#2f4053"/>'; for (let k = 0; k < 40; k++) s += '<circle cx="' + f1(hash(k, 3) * 512) + '" cy="' + f1(24 + hash(k, 7) * 80) + '" r="1.3" fill="#33465a"/>';
      s += '<rect x="-4" y="1.5" width="520" height="10" fill="#d9d2cf" stroke="#1c2230" stroke-width="3"/>'; for (let k = 0; k < 4; k++) s += '<line x1="' + (k * 128 + 30) + '" y1="2" x2="' + (k * 128 + 30) + '" y2="11" stroke="#1c2230" stroke-width="2"/>'; s += '</svg>';
      const r = await sharp(Buffer.from(s)).webp({ quality: 84, effort: 6 }).toFile(OUT + '/backroad.webp'); info.spr.backroad = [512, 112]; console.log('backroad', r.size); }
    const E4 = OUT + '/../era4/'; for (const f of ['flame.webp', 'hero_run.png']) fs.copyFileSync(E4 + f, OUT + '/' + f); }

  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
