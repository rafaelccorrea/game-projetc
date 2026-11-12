// ERA 3 (Era da Polvora): reconstroi camadas, mascaras, decalques e sprites a partir dos brutos.
// uso: node build3.js <pastaTrabalho com raw/ e work/> <pastaSaida>
// brutos (Nano Banana 2, 2K): sky.png far.png mid.png midB.png ground.png (21:9) decals.png props.png props2.png (16:9)
const fs = require('fs'); const { sharp, load, img, keyMagenta, wrap, crop, bbox } = require('./lib.js');
const S = process.argv[2], OUT = process.argv[3]; const info = { spr: {} };
const save = async (o, name, w, q = 86) => { let s = img(o); if (w && w < o.W) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; return r; };
const prev = async (o, name, w = 1500, bg = '#3f8fd0') => img(o).resize(Math.min(w, o.W)).flatten({ background: bg }).jpeg({ quality: 84 }).toFile(S + '/work/p_' + name + '.jpg');
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
// componentes conexos (alfa>60), fundidos quando as caixas ficam a menos de md px; devolve linhas (cortes em fracao da altura) ordenadas por x
function blobs(o, md, minArea, cutsY) { const { d, W, H } = o, lab = new Int32Array(W * H), cs = [];
  for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 60) continue; const st = [p0]; lab[p0] = 1; let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0;
    while (st.length) { const p = st.pop(), x = p % W, y = (p / W) | 0; n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      if (x > 0 && !lab[p - 1] && d[(p - 1) * 4 + 3] > 60) { lab[p - 1] = 1; st.push(p - 1); } if (x < W - 1 && !lab[p + 1] && d[(p + 1) * 4 + 3] > 60) { lab[p + 1] = 1; st.push(p + 1); } if (y > 0 && !lab[p - W] && d[(p - W) * 4 + 3] > 60) { lab[p - W] = 1; st.push(p - W); } if (y < H - 1 && !lab[p + W] && d[(p + W) * 4 + 3] > 60) { lab[p + W] = 1; st.push(p + W); } }
    if (n >= 30) cs.push({ x0, y0, x1, y1, n }); }
  let ch = true; while (ch) { ch = false; for (let i = 0; i < cs.length && !ch; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j]; if (a.x0 - md <= b.x1 && b.x0 - md <= a.x1 && a.y0 - md <= b.y1 && b.y0 - md <= a.y1) { a.x0 = Math.min(a.x0, b.x0); a.y0 = Math.min(a.y0, b.y0); a.x1 = Math.max(a.x1, b.x1); a.y1 = Math.max(a.y1, b.y1); a.n += b.n; cs.splice(j, 1); ch = true; break; } } }
  const big = cs.filter(c => c.n >= minArea), rows = cutsY.map(() => []); rows.push([]); for (const c of big) { const cy = (c.y0 + c.y1) / 2 / H; let k = 0; while (k < cutsY.length && cy >= cutsY[k]) k++; rows[k].push(c); } rows.forEach(r => r.sort((a, b) => a.x0 - b.x0)); return rows; }
const flop = o => { const out = Buffer.alloc(o.d.length); for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) o.d.copy(out, (y * o.W + x) * 4, (y * o.W + o.W - 1 - x) * 4, (y * o.W + o.W - x) * 4); return { d: out, W: o.W, H: o.H }; };
// acrescenta uma faixa transparente embaixo (pecas que boiam no canal ficam acima da linha de base da beira do pier)
const padBottom = (o, frac) => { const H2 = Math.round(o.H / (1 - frac)), out = Buffer.alloc(o.W * H2 * 4); o.d.copy(out, 0); return { d: out, W: o.W, H: H2 }; };
const spr = async (o, name, w, q = 86) => { const r = await img(o).resize(Math.min(w, o.W)).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
const svgOut = async (svg, name, q = 84) => { const r = await sharp(Buffer.from(svg)).webp({ quality: q, alphaQuality: 92, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info.spr[name] = [r.width, r.height]; };
// solta componentes pequenos (sujeira do chroma)
const clean = (o, min = 700) => { const { d, W, H } = o, lab = new Uint8Array(W * H); let n = 0;
  for (let p0 = 0; p0 < W * H; p0++) { if (lab[p0] || d[p0 * 4 + 3] <= 40) continue; const st = [p0], all = [p0]; lab[p0] = 1; while (st.length && all.length < min) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); all.push(q); } }
    if (all.length < min) { all.forEach(p => { d[p * 4 + 3] = 0; }); n++; } else while (st.length) { const p = st.pop(), x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); } } }
  return n; };
const STAGE = (process.argv[4] || 'sky,far,mid,ground,decals,props,props2,proc').split(',');
const has = s => STAGE.indexOf(s) >= 0;
const infoFile = S + '/work/info.json'; if (fs.existsSync(infoFile)) Object.assign(info, JSON.parse(fs.readFileSync(infoFile, 'utf8')));

(async () => {
  // ---------------- ceu + mar: emenda nele mesmo; linha do horizonte e cor do mar la embaixo medidas
  if (has('sky')) { const sky = wrap(await load(S + '/raw/sky.png'), 48); const { d, W, H } = sky; let hy = 0, best = 0;
    for (let y = Math.round(H * 0.5); y < H * 0.85; y++) { let s = 0; for (let x = 0; x < W; x += 16) { const i = (y * W + x) * 4, j = ((y - 5) * W + x) * 4; s += (d[j] - d[j + 2]) - (d[i] - d[i + 2]); } if (s > best) { best = s; hy = y; } }
    info.horizon = (hy - 2) / H; const med = (y0, y1) => { const c = [[], [], []]; for (let y = y0; y < y1; y += 2) for (let x = 0; x < W; x += 7) { const i = (y * W + x) * 4; for (let q = 0; q < 3; q++) c[q].push(d[i + q]); } return c.map(v => v.sort((a, b) => a - b)[v.length >> 1]); };
    info.seaBottom = med(H - 40, H); info.seaTop = med(hy + 20, hy + 60); info.skyLow = med(hy - 60, hy - 20); info.skyTop = med(0, 40); info.skyMid = med(Math.round(hy * 0.5), Math.round(hy * 0.5) + 30);
    console.log('horizonte', hy, info.horizon, 'mar', info.seaTop, info.seaBottom, 'ceu', info.skyTop, info.skyMid, info.skyLow); await save(sky, 'sky', 2048, 88); }

  // ---------------- far: promontorio da fortaleza + farol + ilhas; corta na linha d'agua (a linha escura reta sai); as ilhas cortadas nas bordas viram ilhas inteiras no espelho
  if (has('far')) { let far = safeKey(await load(S + '/raw/far.png')); const { d, W, H } = far; const bb = bbox(far, 60);
    // linha d'agua: primeira linha (de cima) quase toda ocupada
    let wy = 0; for (let y = Math.round(H * 0.6); y < H; y++) { let c = 0; for (let x = 0; x < W; x += 4) if (d[(y * W + x) * 4 + 3] > 128) c++; if (c > W / 4 * 0.97) { wy = y; break; } }
    console.log('far bbox', bb, 'linha d agua', wy); const top = bb.y0 - 8, Hf = wy - top;
    // ladrilho novo, que REPETE (sem espelho: espelhado apareciam 2 farois na mesma tela): [promontorio][vao][ilha = pedaco da borda direita + pedaco da borda esquerda, colados][vao]
    const parts = [[730, 1880], [-250, 250], [2630, 538], [0, 680], [-250, 250]], NW = parts.reduce((a, p) => a + p[1], 0), out = Buffer.alloc(NW * Hf * 4); let ox = 0;
    for (const [sx, w] of parts) { if (sx >= 0) for (let y = 0; y < Hf; y++) d.copy(out, (y * NW + ox) * 4, ((y + top) * W + sx) * 4, ((y + top) * W + sx + w) * 4); ox += w; }
    far = { d: out, W: NW, H: Hf }; info.farCrop = [730, top, NW, Hf];
    await save(far, 'far', 1744, 88); await prev(far, 'far', 1744, '#ffb070'); }

  // ---------------- mid A / mid B: cais de pedra com vao de mar nas duas pontas de cada trecho
  if (has('mid')) { const A = safeKey(await load(S + '/raw/mid.png'), true), B = safeKey(await load(S + '/raw/midB.png'), true); console.log('soltos', clean(A), clean(B));
    // rodada 3: galeao atracado e canos dos canhoes saem da camada e viram sprites animados por meta.props (tools/cut3.js)
    { const { cutShip, cutGuns } = require('./cut3.js'); const sh = cutShip(A), gs = cutGuns(B); info.props = { ship: sh.box, guns: gs.map(g => g.box) };
      const r = await img(sh.img).resize(Math.round(sh.img.W * 2640 / 3168)).webp({ quality: 74, alphaQuality: 100, effort: 6 }).toFile(OUT + '/shipM.webp'); console.log('shipM', r.width, r.height, Math.round(r.size / 1024) + 'KB'); await img(sh.img).resize(900).flatten({ background: '#ff00ff' }).jpeg().toFile(S + '/work/p_ship.jpg');
      for (let k = 0; k < gs.length; k++) { const q = await img(gs[k].img).resize(Math.round(gs[k].img.W * 2640 / 3168)).webp({ quality: 84, alphaQuality: 100, effort: 6 }).toFile(OUT + '/gun' + (k + 1) + '.webp'); console.log('gun' + (k + 1), q.width, q.height, Math.round(q.size / 1024) + 'KB'); } }
    const bA = bbox(A, 60), bB = bbox(B, 60), Hc = Math.max(bA.y1 - bA.y0 + 9, bB.y1 - bB.y0 + 9, 1188);   // 1188 = altura de antes do recorte do galeao (as ancoras do meta dependem dela) console.log('mid bbox', bA, bB, 'Hc', Hc);
    const cA = crop(A, 0, bA.y1 + 1 - Hc, A.W, Hc), cB = crop(B, 0, bB.y1 + 1 - Hc, B.W, Hc); info.midRaw = [A.W, Hc]; info.midTopA = bA.y1 + 1 - Hc; info.midTopB = bB.y1 + 1 - Hc;
    await save(cA, 'midA', 2640, 72); await save(cB, 'midB', 2640, 72); await prev(cA, 'midA', 1584, '#ffb070'); await prev(cB, 'midB', 1584, '#ffb070');
    for (const n of ['midA', 'midB']) { const r = await sharp(OUT + '/' + n + '.webp').resize(880).webp({ quality: 64, alphaQuality: 90 }).toFile(OUT + '/' + n + '_lo.webp'); console.log(n + '_lo', Math.round(r.size / 1024) + 'KB'); } }

  // ---------------- chao: pier de tabuas. Tira a perspectiva (tabuas em leque), recorta de emenda a emenda de tabua, agua de tras no tom do mar do ceu
  if (has('ground')) { const g0 = await load(S + '/raw/ground.png'); const { d, W, H } = g0; const CX = 1584, VY = -7600, u = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) { const s = (y - VY) / (H - 1 - VY); for (let x = 0; x < W; x++) { const sx = CX + (x - CX) * s, x0 = Math.floor(sx), f = sx - x0, i = (y * W + x0) * 4, j = (y * W + Math.min(W - 1, x0 + 1)) * 4, o = (y * W + x) * 4; for (let q = 0; q < 3; q++) u[o + q] = Math.round(d[i + q] * (1 - f) + d[j + q] * f); u[o + 3] = 255; } }
    const DECK = [396, 1002], CURB = [252, 1168], seams = []; let run = -1;
    for (let x = 0; x < W; x++) { let lum = 0, n = 0; for (let y = 480; y < 920; y += 20) { const i = (y * W + x) * 4; lum += u[i] + u[i + 1] + u[i + 2]; n++; } lum /= n; if (lum < 235) { if (run < 0) run = x; } else if (run >= 0) { if (x - run >= 3) seams.push(Math.round((run + x - 1) / 2)); run = -1; } }
    const X0 = seams.find(x => x >= 90), X1 = seams.filter(x => x <= W - 110).pop(), NW = X1 - X0, O = 64; console.log('emendas de tabua', seams.join(' '), '-> corte', X0, X1, NW);
    const sea = info.seaBottom, wm = [[], [], []]; for (let y = 4; y < CURB[0] - 6; y += 3) for (let x = 0; x < W; x += 5) { const i = (y * W + x) * 4; if (u[i] < u[i + 1]) for (let q = 0; q < 3; q++) wm[q].push(u[i + q]); } const wmed = wm.map(v => v.sort((a, b) => a - b)[v.length >> 1]); console.log('agua do chao', wmed, '-> mar do ceu', sea);
    const out = Buffer.alloc(NW * H * 4), RAMP = 64;
    for (let y = 0; y < H; y++) for (let x = 0; x < NW; x++) { const o = (y * NW + x) * 4, i = (y * W + X0 + x) * 4; let c = [u[i], u[i + 1], u[i + 2]];
      if (x < O && (y < DECK[0] || y > DECK[1])) { let t = x / O; t = t * t * (3 - 2 * t); const k = (y * W + X1 + x) * 4; c = c.map((v, q) => v * t + u[k + q] * (1 - t)); }
      if (y < CURB[0] - 2) { // agua de tras: sem os reflexos laranja grandes; desloca para o tom do mar pintado no ceu (em cima) e meio caminho (junto a guia)
        { const tt = Math.max(0, Math.min(1, (72 - (c[1] - c[0])) / 26)); c = c.map((v, q) => v + (wmed[q] - v) * tt); } const t = y / (CURB[0] - 2), k = 1 - 0.45 * t; c = c.map((v, q) => v + (sea[q] - wmed[q]) * k); }
      out[o] = Math.max(0, Math.min(255, Math.round(c[0]))); out[o + 1] = Math.max(0, Math.min(255, Math.round(c[1]))); out[o + 2] = Math.max(0, Math.min(255, Math.round(c[2]))); out[o + 3] = y < RAMP ? Math.round(255 * Math.pow((y + 1) / (RAMP + 1), 1.3)) : 255; }
    const g = { d: out, W: NW, H }; info.road = [DECK[0] / H, DECK[1] / H]; info.curb = [CURB[0] / H, CURB[1] / H]; info.groundRamp = RAMP / H;
    await save(g, 'ground', 1600, 88); await prev(g, 'ground', 1500, '#18808a');
    const w = 500, L = await img(crop(g, NW - w, 0, w, H)).png().toBuffer(), R = await img(crop(g, 0, 0, w, H)).png().toBuffer(); await sharp({ create: { width: 2 * w, height: H, channels: 4, background: '#18808a' } }).composite([{ input: L, left: 0, top: 0 }, { input: R, left: w, top: 0 }]).jpeg({ quality: 86 }).toFile(S + '/work/seam_ground.jpg'); }

  // ---------------- decalques: grade 4 x 5 sobre magenta + espuma procedural (quebra a linha reta da agua junto ao cais)
  if (has('decals')) { const D = safeKey(await load(S + '/raw/decals.png'), true);
    const names = [['puddle1', 'puddle2', 'weed', 'algae', 'ropeS'], ['coin', 'coins3', 'coinpile', 'pouch', 'map'], ['bottle', 'shards', 'conch', 'shellstar', 'coil'], ['plank', 'patch', 'fishbone', 'balls', 'cleat']];
    const rows = cells(D, 50, 62); console.log('decals', rows.map(r => r.length));
    const SC = 0.42, AW = 1100; let ax = 2, ay = 2, rowH = 0; const comp = [], rects = {};
    const put = (buf, ww, hh, nm) => { if (ax + ww + 2 > AW) { ax = 2; ay += rowH + 2; rowH = 0; } comp.push({ input: buf, left: ax, top: ay }); rects[nm] = [ax, ay, ww, hh]; ax += ww + 2; rowH = Math.max(rowH, hh); };
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const sub = cut(D, rows[r][c], 4), nm = names[r][c], ww = Math.round(sub.W * SC), hh = Math.round(sub.H * SC); put(await img(sub).resize(ww, hh).png().toBuffer(), ww, hh, nm); }
    let s = 777; const rn = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let k = 1; k <= 3; k++) { const fw = 150 + k * 22, fh = 34; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + fw + '" height="' + fh + '">';
      for (let pass = 0; pass < 2; pass++) { let s2 = s; for (let i = 0; i < 9 + k * 2; i++) { const x = 12 + rn() * (fw - 24), y = 9 + rn() * (fh - 18), rx = 8 + rn() * 14, ry = 3 + rn() * 3.5; svg += pass ? '<ellipse cx="' + x.toFixed(1) + '" cy="' + (y - 1).toFixed(1) + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" fill="#f4fffb"/>' : '<ellipse cx="' + x.toFixed(1) + '" cy="' + (y + 1.6).toFixed(1) + '" rx="' + (rx + 2.2).toFixed(1) + '" ry="' + (ry + 2).toFixed(1) + '" fill="#8fdcd6" fill-opacity="0.85"/>'; if (i === 8 + k * 2 && !pass) s = s2; } }
      svg += '</svg>'; put(await sharp(Buffer.from(svg)).png().toBuffer(), fw, fh, 'foam' + k); }
    const AH = ay + rowH + 2, buf = await sharp({ create: { width: AW, height: AH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer();
    const rr = await sharp(buf).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(OUT + '/decals.webp'); console.log('decals', rr.width, rr.height, Math.round(rr.size / 1024) + 'KB'); info.decals = { size: [AW, AH], rects };
    await sharp(buf).flatten({ background: '#b97c50' }).jpeg({ quality: 86 }).toFile(S + '/work/p_decals.jpg'); }

  // ---------------- folha 1: 3 nuvens / gaivota (5 poses -> 4 quadros) / galeao, chalupa, bote, boia / 3 bandeiras + vela
  if (has('props')) { const P1 = safeKey(await load(S + '/raw/props.png'), true); const R = blobs(P1, 8, 4000, [0.17, 0.45, 0.76]); console.log('props1', R.map(r => r.length));
    for (let i = 0; i < 3; i++) await spr(cut(P1, R[0][i]), 'cloud' + (i + 1), 480, 82);
    { const F = 700, frames = [], order = [0, 1, 3, 2]; for (const k of order) { const o = cut(P1, R[1][k], 2); let bx = -1, by = 0; for (let x = o.W - 1; x >= 0 && bx < 0; x--) for (let y = 0; y < o.H; y++) { const i = (y * o.W + x) * 4; if (o.d[i + 3] > 200 && o.d[i] > 215 && o.d[i + 1] > 140 && o.d[i + 1] < 215 && o.d[i + 2] < 110) { bx = x; by = y; break; } }   // alinha pela ponta do bico (pixel amarelo mais a direita; a asa pode passar do bico)
        frames.push({ input: await img(o).png().toBuffer(), left: frames.length * F + 640 - bx, top: 330 - by }); console.log('gaivota', k, o.W, o.H, 'bico', bx, by); }
      const sheet = await sharp({ create: { width: F * 4, height: F, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames).png().toBuffer();
      const r = await sharp(sheet).resize(160 * 4).webp({ quality: 88, alphaQuality: 100 }).toFile(OUT + '/gull.webp'); console.log('gull', r.width, r.height, Math.round(r.size / 1024) + 'KB'); await sharp(sheet).resize(1200).flatten({ background: '#ffb070' }).jpeg().toFile(S + '/work/p_gull.jpg'); }
    await spr(cut(P1, R[2][0]), 'galleon', 300); await spr(cut(P1, R[2][1]), 'sloop', 200); await spr(padBottom(cut(P1, R[2][2]), 0.33), 'rowboat', 280); await spr(padBottom(cut(P1, R[2][3]), 0.34), 'buoy', 150);
    await spr(flop(cut(P1, R[3][0])), 'jolly', 300); await spr(flop(cut(P1, R[3][1])), 'pennR', 300); await spr(flop(cut(P1, R[3][2])), 'pennB', 300); await spr(flop(cut(P1, R[3][3])), 'sail', 260); }

  // ---------------- folha 2: primeiro plano / beira do pier / parados
  if (has('props2')) { const P2 = safeKey(await load(S + '/raw/props2.png'), true); const R = blobs(P2, 10, 4000, [0.31, 0.69]); console.log('props2', R.map(r => r.length));
    const n1 = ['pilings', 'piling', 'fronds', 'seagrass', 'barrel', 'rockweed'], w1 = [260, 220, 380, 300, 280, 340];
    for (let i = 0; i < 6; i++) await spr(cut(P2, R[0][i]), n1[i], w1[i], 84);
    await spr(padBottom(cut(P2, R[1][0]), 0.11), 'palm', 360); await spr(cut(P2, R[1][1]), 'torch', 110); await spr(cut(P2, R[1][2]), 'brazier', 220); await spr(cut(P2, R[1][3]), 'parrot', 240); await spr(cut(P2, R[1][4]), 'cat', 260); await spr(flop(cut(P2, R[1][5])), 'cannon', 320);
    await spr(cut(P2, R[2][0]), 'stack', 360); await spr(cut(P2, R[2][1]), 'anchor', 300); await spr(cut(P2, R[2][2]), 'chest', 300); await spr(cut(P2, R[2][3]), 'bollard', 260); await spr(padBottom(cut(P2, R[2][4]), 0.34), 'rock', 240); }

  // ---------------- procedurais: sol, brilho do sol, caminho do sol na agua, ondas (2 tiras que emendam), mascara de brilho do mar, mascara do facho do farol
  if (has('proc')) {
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><radialGradient id="g" cx="50%" cy="46%" r="52%"><stop offset="0" stop-color="#fffbe0"/><stop offset="0.55" stop-color="#ffe58a"/><stop offset="1" stop-color="#ffb347"/></radialGradient></defs><circle cx="100" cy="100" r="92" fill="#e8742c"/><circle cx="100" cy="100" r="86" fill="url(#g)"/></svg>', 'sun', 90);
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><defs><radialGradient id="g"><stop offset="0" stop-color="#fff0b0" stop-opacity="0.75"/><stop offset="0.3" stop-color="#ffc878" stop-opacity="0.42"/><stop offset="0.65" stop-color="#ff9a5a" stop-opacity="0.14"/><stop offset="1" stop-color="#ff8a50" stop-opacity="0"/></radialGradient></defs><circle cx="180" cy="180" r="180" fill="url(#g)"/></svg>', 'sunglow', 80);
    let s = 4242; const rn = () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    { const W = 160, H = 320; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">'; for (let i = 0; i < 46; i++) { const v = (i + rn()) / 46, y = 5 + v * (H - 12), half = 10 + v * 58, x = W / 2 + (rn() - 0.5) * half * 1.5, w = (10 + rn() * 26) * (0.5 + 0.8 * v), h = 2 + 2.6 * v, o = (0.75 - 0.4 * v) * (0.6 + 0.4 * rn()); svg += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (w / 2).toFixed(1) + '" ry="' + (h / 2).toFixed(1) + '" fill="' + (rn() < 0.5 ? '#ffe9a6' : '#ffb868') + '" fill-opacity="' + o.toFixed(2) + '"/>'; } svg += '</svg>'; await svgOut(svg, 'sunpath', 84); }
    for (const [name, H, n, sw] of [['waveS', 34, 30, 2.2], ['waveL', 54, 20, 3.4]]) { const W = 1024; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" fill="none" stroke-linecap="round" stroke-linejoin="round">';
      for (let i = 0; i < n; i++) { const x = (i + 0.15 + 0.7 * rn()) * W / n, y = H * 0.3 + rn() * H * 0.45, w = (H * 0.9) * (0.7 + 0.9 * rn()), a = H * (0.1 + 0.08 * rn()), lt = rn() < 0.62;
        for (const dx of [-W, 0, W]) { const p = 'M' + (x + dx - w / 2).toFixed(1) + ' ' + y.toFixed(1) + ' q' + (w / 4).toFixed(1) + ' ' + (-a * 2).toFixed(1) + ' ' + (w / 2).toFixed(1) + ' 0 q' + (w / 4).toFixed(1) + ' ' + (-a * 2).toFixed(1) + ' ' + (w / 2).toFixed(1) + ' 0';
          svg += '<path d="' + p + '" stroke="#0c6f80" stroke-opacity="0.55" stroke-width="' + (sw + 1.6) + '" transform="translate(0 ' + (sw * 0.7).toFixed(1) + ')"/><path d="' + p + '" stroke="' + (lt ? '#d8fff6' : '#7ff0e0') + '" stroke-opacity="' + (lt ? 0.95 : 0.8) + '" stroke-width="' + sw + '"/>'; } }
      svg += '</svg>'; await svgOut(svg, name, 86); }
    { const W = 640, H = 120; let svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '">';
      for (let i = 0; i < 150; i++) { const v = Math.pow(rn(), 1.2), y = 3 + v * (H - 8), sc = 0.5 + 0.9 * v, w = (8 + rn() * 22) * sc, h = (1.6 + rn() * 1.6) * sc, x = rn() * W, o = (0.55 + 0.45 * rn()).toFixed(2);
        for (const dx of [-W, 0, W]) svg += '<ellipse cx="' + (x + dx).toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="' + (w / 2).toFixed(1) + '" ry="' + (h / 2).toFixed(1) + '" fill="#fff" fill-opacity="' + o + '"/>'; }
      svg += '</svg>'; await svgOut(svg, 'glint', 80); }
    // farol: facho da esquerda e facho da direita (acendem em contrafase = feixe girando) + halo
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90"><defs><linearGradient id="l" x1="1" x2="0"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="300,41 0,6 0,84 300,49" fill="url(#l)"/></svg>', 'beamL', 80); await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="300" height="90"><defs><linearGradient id="l" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.5"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><polygon points="0,41 300,6 300,84 0,49" fill="url(#l)"/></svg>', 'beamR', 80); await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><defs><radialGradient id="g"><stop offset="0" stop-color="#fff" stop-opacity="1"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><circle cx="60" cy="60" r="60" fill="url(#g)"/></svg>', 'halo', 80); }
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
