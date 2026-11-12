// ERA 4, rodada 3 (0 credito): so recorte/vetor local sobre os arquivos ja entregues em assets/bg/v2/era4.
// uso: node build4c.js <pastaSaida = assets/bg/v2/era4> <pastaPrevias> [etapas: gears,rail,hands,far,shed,robot]
// gears  = engrenagens vetoriais em ferro com ferrugem, borda escura + sprites de sombra (gearSh, gear8Sh)
// rail   = railbed.webp: mureta de tijolo com trilho em cima (ladrilho que se repete), apoio do trem da estacao
// hands  = handM / handH: ponteiros escuros (minutos e horas); far = apaga o ponteiro das horas pintado no mostrador
// shed   = galpao: tira o resto vermelho do limpa-trilhos, descasca o tijolo que sobrou nos arcos e suaviza o alfa da borda
// robot  = folha de 4 quadros do automato refeita a partir do quadro parado, sem fresta no pescoco
const fs = require('fs'); const { sharp, img } = require('./lib.js');
const OUT = process.argv[2], PV = process.argv[3], STAGE = (process.argv[4] || 'gears,rail,hands,far,shed,robot').split(','), has = s => STAGE.indexOf(s) >= 0;
const info = JSON.parse(fs.readFileSync(__dirname + '/info.era4.json', 'utf8'));
const f1 = v => v.toFixed(1);
const raw = async s => { const b = await s.ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: b.data, W: b.info.width, H: b.info.height }; };
const loadWebp = f => raw(sharp(fs.readFileSync(f)));
const save = async (o, name, w, q = 86) => { let s = img(o); if (w && w !== o.W) s = sharp(await s.png().toBuffer()).resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); return r; };
const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
const vn = (x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), a = hash(x0, y0), b = hash(x0 + 1, y0), c = hash(x0, y0 + 1), e = hash(x0 + 1, y0 + 1); return a + (b - a) * sx + (c - a) * sy + (a - b - c + e) * sx * sy; };
const fbm = (x, y) => (vn(x / 46, y / 46) + 0.5 * vn(x / 19 + 7, y / 19 + 3) + 0.25 * vn(x / 8 + 1, y / 8 + 9)) / 1.75;

// engrenagem vetorial: N dentes, K raios; ferro escuro, aro claro, rebites de latao, contorno grosso
function gearSvg(N, K) { const C = 256, sc = N / 16, Rt = 244, Rr = 210, Ri = N >= 12 ? 166 : 150, Rh = N >= 12 ? 62 : 78, O = '#1f1518', D = '#463c41', M = '#5c5056', Lt = '#786b72', ring = (fr, rr, tr) => { const p = []; for (let i = 0; i < N; i++) { const a = i * 2 * Math.PI / N, w = 2 * Math.PI / N; [[-fr[0], rr], [-fr[1], tr], [fr[1], tr], [fr[0], rr]].forEach(([f, r]) => p.push(f1(C + Math.cos(a + f * w) * r) + ',' + f1(C + Math.sin(a + f * w) * r))); } return p.join(' '); };
  const lw = 13 / Math.sqrt(sc); let s = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><mask id="m"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="' + Ri + '" fill="#000"/></mask></defs>';
  s += '<g mask="url(#m)"><polygon points="' + ring([0.30, 0.17], Rr, Rt) + '" fill="' + D + '" stroke="' + O + '" stroke-width="' + f1(lw) + '" stroke-linejoin="round"/><polygon points="' + ring([0.24, 0.12], Rr - 6, Rt - 13) + '" fill="' + Lt + '"/><circle cx="256" cy="256" r="' + (Rr - 4) + '" fill="' + M + '"/><circle cx="256" cy="256" r="' + (Ri + 20) + '" fill="' + D + '"/><circle cx="256" cy="256" r="' + (Rr - 12) + '" fill="none" stroke="#93868d" stroke-width="5"/><circle cx="256" cy="256" r="' + (Ri + 5) + '" fill="none" stroke="#000" stroke-opacity="0.28" stroke-width="10"/></g>';
  s += '<circle cx="256" cy="256" r="' + Ri + '" fill="none" stroke="' + O + '" stroke-width="' + f1(lw) + '"/>';
  for (let i = 0; i < K; i++) { const a = i * 360 / K + 15, sw = N >= 12 ? 44 : 60; s += '<g transform="rotate(' + a + ' 256 256)"><rect x="' + (256 - sw / 2) + '" y="' + (C - Ri - 2) + '" width="' + sw + '" height="' + (Ri - 30) + '" fill="' + D + '" stroke="' + O + '" stroke-width="' + f1(lw) + '"/><rect x="' + (256 - sw / 2 + 8) + '" y="' + (C - Ri + 6) + '" width="' + Math.round(sw * 0.28) + '" height="' + (Ri - 46) + '" fill="' + Lt + '"/></g>'; }
  const nr = N >= 12 ? 12 : 8; for (let i = 0; i < nr; i++) { const a = (i + 0.5) * 2 * Math.PI / nr; s += '<circle cx="' + f1(C + Math.cos(a) * (Ri + 24)) + '" cy="' + f1(C + Math.sin(a) * (Ri + 24)) + '" r="' + f1(7 / Math.sqrt(sc)) + '" fill="#b48648" stroke="' + O + '" stroke-width="4"/>'; }
  s += '<circle cx="256" cy="256" r="' + (Rh + 9) + '" fill="#000" fill-opacity="0.3"/><circle cx="256" cy="256" r="' + Rh + '" fill="' + D + '" stroke="' + O + '" stroke-width="' + f1(lw) + '"/><circle cx="256" cy="256" r="' + (Rh - 14) + '" fill="' + Lt + '"/><circle cx="256" cy="256" r="' + (Rh - 34) + '" fill="#2a2126" stroke="' + O + '" stroke-width="5"/>';
  return s + '</svg>'; }
// manchas de ferrugem em 2 tons (ruido posterizado: mancha chapada, como na arte), fora do contorno
function rust(o, seed) { const { d, W, H } = o; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (d[i + 3] < 30) continue; const lum = (d[i] + d[i + 1] + d[i + 2]) / 3; if (lum < 52 || d[i] - d[i + 2] > 40) continue; const n = fbm(x + seed, y + seed * 2), t = n > 0.6 ? 0.88 : n > 0.555 ? 0.5 : 0; if (!t) continue; const k = 0.62 + lum / 190; d[i] = Math.round(d[i] + (Math.min(255, 150 * k) - d[i]) * t); d[i + 1] = Math.round(d[i + 1] + (78 * k - d[i + 1]) * t); d[i + 2] = Math.round(d[i + 2] + (42 * k - d[i + 2]) * t); } }
// gira uma regiao em torno de um pivo; os buracos perto do pivo sao preenchidos com o original (sem fresta na junta)
function pose(o, inside, pv, deg, fillR) { const { d, W, H } = o, r = Buffer.from(d), a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), px = pv[0] * W, py = pv[1] * H; if (!deg) return { d: r, W, H };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x / W, y / H)) r[(y * W + x) * 4 + 3] = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = px + (x - px) * c + (y - py) * s, sy = py - (x - px) * s + (y - py) * c, x0 = Math.floor(sx), y0 = Math.floor(sy); if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue; const fx = sx - x0, fy = sy - y0; let A = 0, R = 0, G = 0, B = 0;
      for (const [dx, dy, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) { const xx = x0 + dx, yy = y0 + dy, i = (yy * W + xx) * 4; if (!inside(xx / W, yy / H)) continue; const al = d[i + 3] / 255 * wt; A += al; R += d[i] * al; G += d[i + 1] * al; B += d[i + 2] * al; }
      if (A < 0.02) continue; const o4 = (y * W + x) * 4, ob = r[o4 + 3] / 255, na = A + ob * (1 - A); r[o4] = Math.round((R + r[o4] * ob * (1 - A)) / na); r[o4 + 1] = Math.round((G + r[o4 + 1] * ob * (1 - A)) / na); r[o4 + 2] = Math.round((B + r[o4 + 2] * ob * (1 - A)) / na); r[o4 + 3] = Math.round(255 * Math.min(1, na)); }
  let n = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (r[i + 3] < 250 && d[i + 3] > r[i + 3] && Math.hypot(x - px, y - py) < fillR) { const ta = r[i + 3] / 255; for (let k = 0; k < 3; k++) r[i + k] = Math.round(r[i + k] * ta + d[i + k] * (1 - ta)); r[i + 3] = d[i + 3]; n++; } }
  console.log(' pose', deg, 'preenchidos', n); return { d: r, W, H }; }

(async () => {
  if (has('gears')) for (const [N, K, name, w, seed] of [[16, 6, 'gear', 480, 11], [8, 4, 'gear8', 260, 57]]) { const o = await raw(sharp(Buffer.from(gearSvg(N, K)))); rust(o, seed); await save(o, name, w, 88);
    const sh = { d: Buffer.alloc(o.d.length), W: o.W, H: o.H }; for (let p = 0; p < o.W * o.H; p++) { sh.d[p * 4] = 26; sh.d[p * 4 + 1] = 15; sh.d[p * 4 + 2] = 20; sh.d[p * 4 + 3] = Math.round(o.d[p * 4 + 3] * 0.5); }
    const b = await sharp(await img(sh).png().toBuffer()).blur(5).resize(Math.round(w / 2)).webp({ quality: 70, alphaQuality: 80 }).toFile(OUT + '/' + name + 'Sh.webp'); console.log(name + 'Sh', b.width, Math.round(b.size / 1024) + 'KB'); }
  if (has('rail')) { const O = '#231a1c'; let s = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="120">';
    s += '<rect x="0" y="42" width="512" height="78" fill="#96503d"/>';
    for (let r = 0; r < 4; r++) { const y = 42 + r * 19.5; for (let k = 0; k < 8; k++) { const x = k * 64 + (r % 2) * 32, h = hash(k + 3, r + 5); if (h < 0.22) s += '<rect x="' + x + '" y="' + y + '" width="64" height="19.5" fill="#ad644c"/>'; else if (h > 0.8) s += '<rect x="' + x + '" y="' + y + '" width="64" height="19.5" fill="#7d3f32"/>'; if (x + 64 > 512) s += '<rect x="' + (x - 512) + '" y="' + y + '" width="64" height="19.5" fill="' + (h < 0.22 ? '#ad644c' : h > 0.8 ? '#7d3f32' : '#96503d') + '"/>'; }
      for (let k = 0; k < 9; k++) { const x = k * 64 + (r % 2) * 32; s += '<line x1="' + (x % 512) + '" y1="' + y + '" x2="' + (x % 512) + '" y2="' + (y + 19.5) + '" stroke="#552821" stroke-width="2.5"/>'; }
      s += '<line x1="0" y1="' + y + '" x2="512" y2="' + y + '" stroke="#552821" stroke-width="2.5"/>'; }
    s += '<rect x="-4" y="24" width="520" height="18" fill="#c4ae94" stroke="' + O + '" stroke-width="3"/><line x1="0" y1="28.5" x2="512" y2="28.5" stroke="#e3d3ba" stroke-width="2.5"/>'; for (let k = 0; k < 4; k++) s += '<line x1="' + (k * 128 + 40) + '" y1="25" x2="' + (k * 128 + 40) + '" y2="41" stroke="' + O + '" stroke-width="2.5"/>';
    s += '<rect x="0" y="10" width="512" height="14" fill="#4c3e39"/>'; for (let k = 0; k < 8; k++) s += '<rect x="' + (k * 64 + 16) + '" y="11" width="32" height="13" fill="#7c5b3d" stroke="' + O + '" stroke-width="2.5"/>';
    s += '<rect x="-4" y="1.5" width="520" height="9" fill="#3f373c" stroke="' + O + '" stroke-width="3"/><line x1="0" y1="4.2" x2="512" y2="4.2" stroke="#a79ca3" stroke-width="2"/></svg>';
    const r = await sharp(Buffer.from(s)).webp({ quality: 84, effort: 6 }).toFile(OUT + '/railbed.webp'); console.log('railbed', r.width, r.height, Math.round(r.size / 1024) + 'KB'); }
  if (has('hands')) { const mk = async (name, y1, sw) => { const r = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><line x1="64" y1="70" x2="64" y2="' + y1 + '" stroke="#2c2022" stroke-width="' + sw + '" stroke-linecap="round"/><circle cx="64" cy="64" r="' + (sw * 0.75 + 2) + '" fill="#2c2022"/></svg>')).webp({ quality: 90, alphaQuality: 100 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.size); };
    await mk('handM', 17, 6); await mk('handH', 27, 10.5); if (fs.existsSync(OUT + '/hand0.webp')) fs.unlinkSync(OUT + '/hand0.webp'); }
  if (has('far')) { const o = await loadWebp(OUT + '/far.webp'), { d, W, H } = o, c = info.clock, cx = c[0] * W, cy = c[1] * H, rx = c[2] * W, ry = c[3] * H, RM = 0.68, x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry), bw = x1 - x0 + 1, bh = y1 - y0 + 1, mk = new Uint8Array(bw * bh), rad = (x, y) => Math.hypot((x - cx) / rx, (y - cy) / ry);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4; if (rad(x, y) < RM && (d[i] + d[i + 1] + d[i + 2]) / 3 < 170) mk[(y - y0) * bw + x - x0] = 1; }
    const m2 = Uint8Array.from(mk); for (let y = 2; y < bh - 2; y++) for (let x = 2; x < bw - 2; x++) if (mk[y * bw + x]) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) m2[(y + dy) * bw + x + dx] = 1;
    const NB = 40, sum = Array.from({ length: NB }, () => [0, 0, 0, 0]); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const q = rad(x, y); if (q >= RM + 0.04 || m2[(y - y0) * bw + x - x0]) continue; const b = Math.min(NB - 1, Math.floor(q / (RM + 0.04) * NB)), i = (y * W + x) * 4; sum[b][0] += d[i]; sum[b][1] += d[i + 1]; sum[b][2] += d[i + 2]; sum[b][3]++; }
    let n = 0, last = null; const col = sum.map(s => s[3] ? (last = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]) : null); for (let b = NB - 1; b >= 0; b--) { if (col[b]) last = col[b]; else col[b] = last; }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { if (!m2[(y - y0) * bw + x - x0]) continue; const q = rad(x, y); if (q >= RM + 0.04) continue; const b = Math.min(NB - 1, Math.floor(q / (RM + 0.04) * NB)), i = (y * W + x) * 4; d[i] = Math.round(col[b][0]); d[i + 1] = Math.round(col[b][1]); d[i + 2] = Math.round(col[b][2]); n++; }
    console.log('mostrador: pixels repintados', n); await save(o, 'far', 0, 84);
    const r = Math.round(rx * 1.4); await sharp(fs.readFileSync(OUT + '/far.webp')).extract({ left: Math.round(cx) - r, top: Math.round(cy) - r, width: 2 * r, height: 2 * r }).resize(400, 400, { kernel: 'nearest' }).flatten({ background: '#f0b866' }).jpeg().toFile(PV + '/clock.jpg'); }
  if (has('shed')) { const o = await loadWebp(OUT + '/midB.webp'), { d, W, H } = o, XA = 936, XB = 1904, YT = 354, YM = 560; let n1 = 0, n2 = 0;
    // 1) resto vermelho do limpa-trilhos junto ao pilar direito
    // (fica em cima do bloco cinza do fim da plataforma: o vermelho e repintado com a cor do bloco, nao apagado)
    const red = i => d[i + 3] > 0 && d[i] - d[i + 2] > 30 && d[i] - d[i + 1] > 18 && d[i] > 70, sc = [0, 0, 0, 0]; for (let y = 862; y < 900; y++) for (let x = 1975; x < 2040; x++) { const i = (y * W + x) * 4; if (d[i + 3] > 250 && !red(i)) { sc[0] += d[i]; sc[1] += d[i + 1]; sc[2] += d[i + 2]; sc[3]++; } }
    const rm = new Uint8Array(W * H); for (let y = 822; y < 910; y++) for (let x = 1898; x < 1990; x++) if (red((y * W + x) * 4)) rm[y * W + x] = 1;
    for (let y = 824; y < 908; y++) for (let x = 1898; x < 1990; x++) { let hit = 0; for (let dy = -2; dy <= 2 && !hit; dy++) for (let dx = -2; dx <= 2; dx++) if (rm[(y + dy) * W + x + dx]) { hit = 1; break; } if (!hit) continue; const i = (y * W + x) * 4; if (d[i + 3] < 200) continue; d[i] = Math.round(sc[0] / sc[3]); d[i + 1] = Math.round(sc[1] / sc[3]); d[i + 2] = Math.round(sc[2] / sc[3]); n1++; }
    console.log('cor do bloco', sc.map(v => Math.round(v / sc[3])).slice(0, 3).join(','));
    // 2) descasca o tijolo que ficou grudado na borda do recorte: inunda a partir do transparente, so por pixels cor de tijolo (o ferro cinza e o traco escuro param a inundacao)
    const brick = i => d[i] >= 72 && d[i] - d[i + 2] > 22 && d[i] - d[i + 1] > 10, st = [], seen = new Uint8Array(W * H);
    for (let y = YT; y < YM; y++) for (let x = XA; x < XB; x++) if (d[(y * W + x) * 4 + 3] < 40) { st.push(y * W + x); seen[y * W + x] = 1; }
    while (st.length) { const p = st.pop(), px = p % W, py = (p / W) | 0; for (const [qx, qy] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) { if (qx < XA || qx >= XB || qy < YT || qy >= YM) continue; const q = qy * W + qx; if (seen[q]) continue; seen[q] = 1; if (d[q * 4 + 3] >= 40 && !brick(q * 4)) continue; if (d[q * 4 + 3] >= 40) { d[q * 4 + 3] = 0; n2++; } st.push(q); } }
    // 3) suaviza o alfa so na borda do recorte (alfa = minimo entre o original e o desfocado)
    const a = Buffer.alloc(W * H); for (let p = 0; p < W * H; p++) a[p] = d[p * 4 + 3];
    const bl = Buffer.from(a), K = [1, 4, 6, 4, 1], tmp = new Float32Array(W * H); let n3 = 0;   // gaussiano 5x5 separavel, so na caixa
    for (let y = YT - 2; y < 914; y++) for (let x = XA; x < 2000; x++) { let v = 0; for (let k = -2; k <= 2; k++) v += a[y * W + x + k] * K[k + 2]; tmp[y * W + x] = v / 16; }
    for (let y = YT; y < 912; y++) for (let x = XA; x < 2000; x++) { let v = 0; for (let k = -2; k <= 2; k++) v += tmp[(y + k) * W + x] * K[k + 2]; bl[y * W + x] = Math.round(v / 16); }
    for (let y = YT; y < 912; y++) for (let x = XA; x < 2000; x++) { const p = y * W + x; if (bl[p] < a[p] - 6) { d[p * 4 + 3] = bl[p]; n3++; } }
    console.log('galpao: vermelho', n1, 'tijolo', n2, 'borda suavizada', n3);
    const r = await img(o).webp({ quality: 76, alphaQuality: 100, effort: 6 }).toFile(OUT + '/midB.webp'); console.log('midB', r.width, r.height, Math.round(r.size / 1024) + 'KB');
    const l = await sharp(fs.readFileSync(OUT + '/midB.webp')).resize(880).webp({ quality: 62, alphaQuality: 90 }).toFile(OUT + '/midB_lo.webp'); console.log('midB_lo', Math.round(l.size / 1024) + 'KB');
    await sharp(fs.readFileSync(OUT + '/midB.webp')).extract({ left: 900, top: 330, width: 1100, height: 620 }).flatten({ background: '#40e0ff' }).jpeg({ quality: 85 }).toFile(PV + '/shed.jpg'); }
  if (has('robot')) { const s0 = await loadWebp(OUT + '/robot.webp'), fw = s0.W / 4, o = await raw(img(s0).extract({ left: fw, top: 0, width: fw, height: s0.H })), ins = (x, y) => Math.pow((x - 0.63) / 0.4, 2) + Math.pow((y - 0.215) / 0.243, 2) < 1, comp = [], degs = [-6, 0, 6, 0];
    for (let k = 0; k < 4; k++) comp.push({ input: await img(pose(o, ins, [0.63, 0.43], degs[k], 78)).png().toBuffer(), left: k * o.W, top: 0 });
    const b = await sharp({ create: { width: o.W * 4, height: o.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer(); const r = await sharp(b).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(OUT + '/robot.webp'); console.log('robot', r.width, r.height, Math.round(r.size / 1024) + 'KB');
    await sharp(b).resize(1440).flatten({ background: '#40e0ff' }).jpeg({ quality: 85 }).toFile(PV + '/robot.jpg'); }
  if (has('gears') || has('rail')) { const comp = []; if (fs.existsSync(OUT + '/gear.webp')) comp.push({ input: fs.readFileSync(OUT + '/gearSh.webp'), left: 12, top: 16, }, { input: fs.readFileSync(OUT + '/gear.webp'), left: 0, top: 0 }, { input: fs.readFileSync(OUT + '/gear8.webp'), left: 500, top: 0 }, { input: fs.readFileSync(OUT + '/railbed.webp'), left: 500, top: 300 });
    await sharp({ create: { width: 1020, height: 500, channels: 3, background: '#f0b866' } }).composite(comp).jpeg({ quality: 85 }).toFile(PV + '/vec.jpg'); }
})();
