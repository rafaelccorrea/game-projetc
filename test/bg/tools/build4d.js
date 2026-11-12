// ERA 4, rodada 4 (0 credito): so recorte local sobre os arquivos ja entregues em assets/bg/v2/era4.
// uso: node build4d.js <pastaSaida = assets/bg/v2/era4> <pastaPrevias> [etapas: train,block,pillars,crow,cat]
// train   = apaga a fumaca pintada e a biela pintada do sprite do trem (viram particulas e pecas por codigo)
// block   = recompoe a textura do bloco do fim da plataforma (cada linha copia a cor da mesma linha logo a direita)
// pillars = prolonga ate a plataforma os 3 tocos de pilar que ficavam pendurados nos arcos do galpao (extrusao vertical + base)
// crow    = separa corvo e toco: post.webp (toco com topo refeito), crowsit.webp (4 poses, mesmo enquadramento), crowhop.webp (voo, bico cinza)
// cat     = folha do gato com 6 quadros: 0-3 sentado (cauda), 4-5 passo gingado (corpo inclina em torno das patas)
const fs = require('fs'); const { sharp, img } = require('./lib.js');
const OUT = process.argv[2], PV = process.argv[3], STAGE = (process.argv[4] || 'train,block,pillars,crow,cat').split(','), has = s => STAGE.indexOf(s) >= 0;
const raw = async s => { const b = await s.ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: b.data, W: b.info.width, H: b.info.height }; };
const loadWebp = f => raw(sharp(fs.readFileSync(f)));
const save = async (o, name, q = 86) => { const r = await img(o).webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); return r; };
const pv = (file, ext, zoom, name) => sharp(fs.readFileSync(OUT + '/' + file)).extract(ext).resize(Math.round(ext.width * zoom), null, { kernel: zoom > 2 ? 'nearest' : 'lanczos3' }).flatten({ background: '#40e0ff' }).jpeg({ quality: 86 }).toFile(PV + '/' + name + '.jpg');
// gira o sprite inteiro em torno de um pivo (bilinear)
function tilt(o, pvt, deg) { const { d, W, H } = o, r = Buffer.alloc(d.length), a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), px = pvt[0] * W, py = pvt[1] * H; if (!deg) return { d: Buffer.from(d), W, H };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = px + (x - px) * c + (y - py) * s, sy = py - (x - px) * s + (y - py) * c, x0 = Math.floor(sx), y0 = Math.floor(sy); if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue; const fx = sx - x0, fy = sy - y0; let A = 0, R = 0, G = 0, B = 0;
      for (const [dx, dy, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) { const i = ((y0 + dy) * W + x0 + dx) * 4, al = d[i + 3] / 255 * wt; A += al; R += d[i] * al; G += d[i + 1] * al; B += d[i + 2] * al; }
      if (A < 0.02) continue; const o4 = (y * W + x) * 4; r[o4] = Math.round(R / A); r[o4 + 1] = Math.round(G / A); r[o4 + 2] = Math.round(B / A); r[o4 + 3] = Math.round(255 * Math.min(1, A)); }
  return { d: r, W, H }; }
const strip = async (frames, name, q) => { const W = frames[0].W, H = frames[0].H, comp = []; for (let k = 0; k < frames.length; k++) comp.push({ input: await img(frames[k]).png().toBuffer(), left: k * W, top: 0 }); const b = await sharp({ create: { width: W * frames.length, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer(); const r = await sharp(b).webp({ quality: q || 86, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); };
const frame = async (o, k, n) => { const fw = o.W / n; return raw(img(o).extract({ left: k * fw, top: 0, width: fw, height: o.H })); };

(async () => {
  if (has('train')) { const o = await loadWebp(OUT + '/train.webp'), { d, W, H } = o; let n1 = 0, n2 = 0;
    for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (!d[i + 3]) continue; if (y < 114 || (d[i] + d[i + 1] + d[i + 2]) / 3 > 150) { d[i + 3] = 0; n1++; } }
    // biela pintada: cinza claro entre as duas rodas grandes e da roda da frente ate a cruzeta
    const rod = i => d[i + 3] > 60 && (d[i] + d[i + 1] + d[i + 2]) / 3 > 95 && Math.abs(d[i] - d[i + 2]) < 28 && Math.abs(d[i] - d[i + 1]) < 20, mk = new Uint8Array(W * H);
    for (const [x0, x1, y0, y1] of [[1116, 1142, 277, 298], [1196, 1227, 257, 298]]) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (rod((y * W + x) * 4)) mk[y * W + x] = 1;
    const m2 = Uint8Array.from(mk); for (let y = 250; y < 305; y++) for (let x = 1110; x < 1232; x++) if (mk[y * W + x]) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) m2[(y + dy) * W + x + dx] = 1;
    for (let y = 250; y < 305; y++) for (let x = 1110; x < 1232; x++) { if (!m2[y * W + x]) continue; let solid = 0; for (const dy of [-8, 8]) { const q = (y + dy) * W + x; if (y + dy < H && !m2[q] && d[q * 4 + 3] > 200) solid++; } const i = (y * W + x) * 4; if (solid) { d[i] = 43; d[i + 1] = 37; d[i + 2] = 42; d[i + 3] = 255; } else d[i + 3] = 0; n2++; }
    console.log('trem: fumaca', n1, 'biela', n2); await save(o, 'train', 84); await pv('train.webp', { left: 1020, top: 0, width: 380, height: 311 }, 3, 'loco'); }
  if (has('block') || has('pillars')) { const o = await loadWebp(OUT + '/midB.webp'), { d, W, H } = o;
    if (has('block')) { let n = 0; for (let y = 824; y <= 862; y++) { const rs = [[], [], []]; for (let x = 1991; x <= 1996; x++) for (let k = 0; k < 3; k++) rs[k].push(d[(y * W + x) * 4 + k]); const ref = rs.map(a => a.sort((p, q) => p - q)[3]);
        for (let x = y < 837 ? 1952 : 1899; x < 1991; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 200 || (d[i] + d[i + 1] + d[i + 2]) / 3 > 100) continue; d[i] = ref[0]; d[i + 1] = ref[1]; d[i + 2] = ref[2]; n++; } } console.log('bloco: pixels recompostos', n); }
    if (has('pillars')) { const SRC = 503, Y0 = 506, YB = 909, O = [35, 26, 32]; for (const [x0, x1] of [[1061, 1094], [1304, 1342], [1593, 1622]]) { const med = [0, 0, 0]; let c = 0;
        for (let x = x0; x <= x1; x++) { const s = (SRC * W + x) * 4; if (d[s + 3] > 250 && d[s] > 55) { med[0] += d[s]; med[1] += d[s + 1]; med[2] += d[s + 2]; c++; } for (let y = Y0; y < YB; y++) { const i = (y * W + x) * 4; d[i] = d[s]; d[i + 1] = d[s + 1]; d[i + 2] = d[s + 2]; d[i + 3] = d[s + 3]; } }
        const col = med.map(v => Math.round(v / c)); for (let y = 886; y < YB; y++) for (let x = x0 - 9; x <= x1 + 9; x++) { const i = (y * W + x) * 4, edge = y < 889 || x < x0 - 6 || x > x1 + 6; d[i] = edge ? O[0] : col[0]; d[i + 1] = edge ? O[1] : col[1]; d[i + 2] = edge ? O[2] : col[2]; d[i + 3] = 255; }
        for (let y = 876; y < 886; y++) for (let x = x0 - 4; x <= x1 + 4; x++) { const i = (y * W + x) * 4, edge = y < 879 || x < x0 - 1 || x > x1 + 1; d[i] = edge ? O[0] : Math.min(255, col[0] + 14); d[i + 1] = edge ? O[1] : Math.min(255, col[1] + 12); d[i + 2] = edge ? O[2] : Math.min(255, col[2] + 14); d[i + 3] = 255; } } console.log('pilares prolongados'); }
    const r = await img(o).webp({ quality: 76, alphaQuality: 100, effort: 6 }).toFile(OUT + '/midB.webp'); console.log('midB', Math.round(r.size / 1024) + 'KB');
    const l = await sharp(fs.readFileSync(OUT + '/midB.webp')).resize(880).webp({ quality: 62, alphaQuality: 90 }).toFile(OUT + '/midB_lo.webp'); console.log('midB_lo', Math.round(l.size / 1024) + 'KB');
    await pv('midB.webp', { left: 900, top: 330, width: 1100, height: 620 }, 1, 'shed'); await pv('midB.webp', { left: 1880, top: 780, width: 200, height: 140 }, 5, 'block'); }
  if (has('crow') && fs.existsSync(OUT + '/crowpost.webp')) { const s0 = await loadWebp(OUT + '/crowpost.webp'), o = await frame(s0, 1, 4), { d, W, H } = o, PX0 = 108, PX1 = 198, CUT = 218;
    // toco: abaixo de CUT e o original; acima, extrusao vertical da linha CUT ate um topo abaulado, com traco
    const post = { d: Buffer.alloc(d.length), W, H }, cx = (PX0 + PX1) / 2; let a0 = W, a1 = 0; for (let x = PX0; x <= PX1; x++) if (d[((CUT + 4) * W + x) * 4 + 3] > 128) { a0 = Math.min(a0, x); a1 = Math.max(a1, x); } const hw = (a1 - a0) / 2 + 0.5, mx = (a0 + a1) / 2;
    for (let y = CUT; y < H; y++) for (let x = PX0; x <= PX1; x++) { const i = (y * W + x) * 4; for (let k = 0; k < 4; k++) post.d[i + k] = d[i + k]; }
    for (let x = a0; x <= a1; x++) { const u = (x - mx) / hw, top = Math.round(200 - 7 * Math.sqrt(Math.max(0, 1 - u * u))), s = ((CUT + 3) * W + x) * 4; for (let y = top; y < CUT; y++) { const i = (y * W + x) * 4, edge = y < top + 4; post.d[i] = edge ? 43 : Math.min(255, post.d[s] + (y < top + 12 ? 26 : 0)); post.d[i + 1] = edge ? 26 : Math.min(255, post.d[s + 1] + (y < top + 12 ? 20 : 0)); post.d[i + 2] = edge ? 20 : Math.min(255, post.d[s + 2] + (y < top + 12 ? 12 : 0)); post.d[i + 3] = post.d[s + 3]; } }
    await save(post, 'post', 86);
    // corvo sem o toco: tira a madeira (marrom) e tudo abaixo do corte na faixa do toco; as garras escuras ficam
    for (let y = 190; y < H; y++) for (let x = PX0 - 2; x <= PX1 + 2; x++) { const i = (y * W + x) * 4; const dark = (d[i] + d[i + 1] + d[i + 2]) / 3 < 72; if (!(dark && y < 213 && x >= 120 && x <= 187)) d[i + 3] = 0; }   // so as garras (escuras, acima do corte) ficam
    await strip([0, -7, 0, 5].map(g => tilt(o, [0.58, 0.69], g)), 'crowsit');
    // voo: os mesmos quadros dos corvos do ceu, com bico e patas em cinza (o corvo pousado tem bico cinza)
    const f = await loadWebp(OUT + '/crow.webp'); for (let p = 0; p < f.W * f.H; p++) { const i = p * 4; if (f.d[i + 3] && f.d[i] > 110 && f.d[i] - f.d[i + 2] > 45 && f.d[i] - f.d[i + 1] > 18) { const l = (f.d[i] + f.d[i + 1] + f.d[i + 2]) / 3 * 0.62; f.d[i] = Math.round(l * 1.02); f.d[i + 1] = Math.round(l * 0.98); f.d[i + 2] = Math.round(l * 1.08); } }
    await save(f, 'crowhop', 84); fs.unlinkSync(OUT + '/crowpost.webp');
    const c = [{ input: fs.readFileSync(OUT + '/post.webp'), left: 0, top: 0 }, { input: await sharp(fs.readFileSync(OUT + '/crowsit.webp')).extract({ left: 0, top: 0, width: 260, height: 299 }).png().toBuffer(), left: 0, top: 0 }, { input: fs.readFileSync(OUT + '/post.webp'), left: 280, top: 0 }, { input: await sharp(fs.readFileSync(OUT + '/crowsit.webp')).extract({ left: 260, top: 0, width: 780, height: 299 }).png().toBuffer(), left: 560, top: 0 }, { input: fs.readFileSync(OUT + '/crowhop.webp'), left: 280, top: 0 }];
    await sharp({ create: { width: 1340, height: 299, channels: 3, background: '#40e0ff' } }).composite(c).jpeg({ quality: 86 }).toFile(PV + '/crow.jpg'); }
  if (has('cat')) { const s0 = await loadWebp(OUT + '/cat.webp'), n = Math.round(s0.W / 260), fr = []; for (let k = 0; k < 4; k++) fr.push(await frame(s0, k, n)); fr.push(tilt(fr[1], [0.62, 0.97], -5), tilt(fr[3], [0.62, 0.97], 4)); await strip(fr, 'cat');
    await sharp(fs.readFileSync(OUT + '/cat.webp')).extract({ left: 780, top: 0, width: 780, height: 288 }).flatten({ background: '#40e0ff' }).jpeg({ quality: 86 }).toFile(PV + '/cat.jpg'); }
})();
