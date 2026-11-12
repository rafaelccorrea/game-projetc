// ERA 4, rodada 2 (0 credito): pecas que giram e ciclos de pose, a partir dos arquivos ja entregues + a folha props.png (baixada de novo, sem gerar nada).
// uso: node build4b.js <pastaTrabalho com raw/props.png> <pastaSaida = assets/bg/v2/era4> [etapas: train,vec,ships,shed,pets]
// Grava work/info2.json (tamanhos) para o mkmeta4.js.
const fs = require('fs'); const { sharp, load, img, keyMagenta, crop } = require('./lib.js');
const S = process.argv[2], OUT = process.argv[3], STAGE = (process.argv[4] || 'train,vec,ships,shed,pets').split(','), has = s => STAGE.indexOf(s) >= 0;
const infoFile = S + '/work/info2.json', info = fs.existsSync(infoFile) ? JSON.parse(fs.readFileSync(infoFile, 'utf8')) : {};
const f1 = v => v.toFixed(1);
const out = async (o, name, w, q = 86) => { let s = img(o); if (w && w < o.W) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; };
const svgOut = async (svg, name, w, q = 88) => { let s = sharp(Buffer.from(svg)); if (w) s = s.resize(w); const r = await s.webp({ quality: q, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width, r.height]; };
const loadWebp = async f => { const b = await sharp(fs.readFileSync(f)).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: b.data, W: b.info.width, H: b.info.height }; };
// engrenagem vetorial no traco da arte: N dentes, K raios (o dente tem o mesmo tamanho linear em todas: raio proporcional a N)
function gearSvg(N, K) { const C = 256, sc = N / 16, Rt = 246, Rr = 212, Ri = N >= 12 ? 166 : 150, Rh = N >= 12 ? 62 : 78, O = '#2b1a14', ring = (fr, rr, tr) => { const p = []; for (let i = 0; i < N; i++) { const a = i * 2 * Math.PI / N, w = 2 * Math.PI / N; [[-fr[0], rr], [-fr[1], tr], [fr[1], tr], [fr[0], rr]].forEach(([f, r]) => p.push(f1(C + Math.cos(a + f * w) * r) + ',' + f1(C + Math.sin(a + f * w) * r))); } return p.join(' '); };
  const lw = 9 / Math.sqrt(sc); let s = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><mask id="m"><rect width="512" height="512" fill="#fff"/><circle cx="256" cy="256" r="' + Ri + '" fill="#000"/></mask></defs>';
  s += '<g mask="url(#m)"><polygon points="' + ring([0.30, 0.17], Rr, Rt) + '" fill="#8b5524" stroke="' + O + '" stroke-width="' + f1(lw) + '" stroke-linejoin="round"/><polygon points="' + ring([0.25, 0.13], Rr - 6, Rt - 12) + '" fill="#c98a3c"/><circle cx="256" cy="256" r="' + (Rr - 4) + '" fill="#b87833"/><circle cx="256" cy="256" r="' + (Ri + 20) + '" fill="#8b5524"/><circle cx="256" cy="256" r="' + (Rr - 12) + '" fill="none" stroke="#e2aa58" stroke-width="5"/></g>';
  s += '<circle cx="256" cy="256" r="' + Ri + '" fill="none" stroke="' + O + '" stroke-width="' + f1(lw) + '"/>';
  for (let i = 0; i < K; i++) { const a = i * 360 / K + 15, sw = N >= 12 ? 44 : 60; s += '<g transform="rotate(' + a + ' 256 256)"><rect x="' + (256 - sw / 2) + '" y="' + (C - Ri - 2) + '" width="' + sw + '" height="' + (Ri - 30) + '" fill="#8b5524" stroke="' + O + '" stroke-width="' + f1(lw) + '"/><rect x="' + (256 - sw / 2 + 7) + '" y="' + (C - Ri + 4) + '" width="' + Math.round(sw * 0.3) + '" height="' + (Ri - 42) + '" fill="#c98a3c"/></g>'; }
  const nr = N >= 12 ? 12 : 8; for (let i = 0; i < nr; i++) { const a = (i + 0.5) * 2 * Math.PI / nr; s += '<circle cx="' + f1(C + Math.cos(a) * (Ri + 24)) + '" cy="' + f1(C + Math.sin(a) * (Ri + 24)) + '" r="' + f1(7 / Math.sqrt(sc)) + '" fill="#e9b765" stroke="' + O + '" stroke-width="3.5"/>'; }
  s += '<circle cx="256" cy="256" r="' + Rh + '" fill="#8b5524" stroke="' + O + '" stroke-width="' + f1(lw) + '"/><circle cx="256" cy="256" r="' + (Rh - 14) + '" fill="#c98a3c"/><circle cx="256" cy="256" r="' + (Rh - 34) + '" fill="#6a3d1c" stroke="' + O + '" stroke-width="5"/>';
  return s + '</svg>'; }
// gira uma regiao (mascara in(x,y) em fracao) em torno de um pivo: apaga a regiao e cola a versao girada (amostragem bilinear inversa)
function pose(o, inside, pv, deg) { const { d, W, H } = o, r = Buffer.from(d), a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), px = pv[0] * W, py = pv[1] * H; if (!deg) return { d: r, W, H };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (inside(x / W, y / H)) r[(y * W + x) * 4 + 3] = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const sx = px + (x - px) * c + (y - py) * s, sy = py - (x - px) * s + (y - py) * c, x0 = Math.floor(sx), y0 = Math.floor(sy); if (x0 < 0 || y0 < 0 || x0 >= W - 1 || y0 >= H - 1) continue; const fx = sx - x0, fy = sy - y0; let A = 0, R = 0, G = 0, B = 0;
      for (const [dx, dy, wt] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) { const xx = x0 + dx, yy = y0 + dy, i = (yy * W + xx) * 4; if (!inside(xx / W, yy / H)) continue; const al = d[i + 3] / 255 * wt; A += al; R += d[i] * al; G += d[i + 1] * al; B += d[i + 2] * al; }
      if (A < 0.02) continue; const o4 = (y * W + x) * 4, ob = r[o4 + 3] / 255, na = A + ob * (1 - A); r[o4] = Math.round((R + r[o4] * ob * (1 - A)) / na); r[o4 + 1] = Math.round((G + r[o4 + 1] * ob * (1 - A)) / na); r[o4 + 2] = Math.round((B + r[o4 + 2] * ob * (1 - A)) / na); r[o4 + 3] = Math.round(255 * Math.min(1, na)); }
  return { d: r, W, H }; }
const sheet = async (name, o, inside, pv, degs, w) => { const comp = []; for (let k = 0; k < degs.length; k++) comp.push({ input: await img(pose(o, inside, pv, degs[k])).png().toBuffer(), left: k * o.W, top: 0 }); const b = await sharp({ create: { width: o.W * degs.length, height: o.H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(comp).png().toBuffer(); const r = await sharp(b).webp({ quality: 86, alphaQuality: 100, effort: 6 }).toFile(OUT + '/' + name + '.webp'); console.log(name, r.width, r.height, Math.round(r.size / 1024) + 'KB'); info[name] = [r.width / degs.length, r.height]; };

// apaga componentes soltos pequenos (alfa > 40) dentro de uma caixa
function speck(o, min, x0 = 0, y0 = 0, x1 = o.W, y1 = o.H) { const { d, W } = o, lab = new Uint8Array(W * o.H); let n = 0; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const p0 = y * W + x; if (lab[p0] || d[p0 * 4 + 3] <= 40) continue; const st = [p0], all = [p0]; lab[p0] = 1; let big = false; while (st.length) { const p = st.pop(), px = p % W, py = (p / W) | 0; for (const [qx, qy] of [[px - 1, py], [px + 1, py], [px, py - 1], [px, py + 1]]) { if (qx < x0 || qx >= x1 || qy < y0 || qy >= y1) { if (qx >= 0 && qy >= 0 && qx < W && qy < o.H && d[(qy * W + qx) * 4 + 3] > 40) big = true; continue; } const q = qy * W + qx; if (lab[q] || d[q * 4 + 3] <= 40) continue; lab[q] = 1; st.push(q); all.push(q); } } if (!big && all.length < min) { all.forEach(p => { d[p * 4 + 3] = 0; }); n++; } } return n; }

(async () => {
  // ---------------- trem inteiro (3 vagoes, tender, locomotiva) em resolucao cheia: serve ao trem do viaduto e ao trem que cruza a estacao
  if (has('train')) { const P = await load(S + '/raw/props.png'), X0 = 1016, Y0 = 822, t = crop(P, X0, Y0, 2724 - X0, 1201 - Y0); keyMagenta(t);
    for (let y = 0; y < t.H; y++) for (let x = 0; x < t.W; x++) { const ax = x + X0, ay = y + Y0; if ((ax < 1210 || (ax > 1340 && ax < 1790)) && ay < 1000) t.d[(y * t.W + x) * 4 + 3] = 0; }   // ponta do dirigivel grande e fundo do pequeno
    await out(t, 'train', 1400, 84); info.trainRaw = [t.W, t.H, X0 - 980, Y0 - 820]; }
  // ---------------- vetoriais: engrenagens de 16, 8 e 12 dentes, roda de trem, pa de helice
  if (has('vec')) { await svgOut(gearSvg(16, 6), 'gear', 480); await svgOut(gearSvg(8, 4), 'gear8', 260);
    { const O = '#231a1c'; let s = '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128"><circle cx="64" cy="64" r="59" fill="#3b3338" stroke="' + O + '" stroke-width="7"/><circle cx="64" cy="64" r="43" fill="#6b3a34"/>'; for (let i = 0; i < 6; i++) s += '<rect x="59" y="18" width="10" height="46" fill="#b9463a" stroke="' + O + '" stroke-width="3" transform="rotate(' + (i * 60) + ' 64 64)"/>'; s += '<circle cx="64" cy="64" r="15" fill="#d19a45" stroke="' + O + '" stroke-width="5"/><circle cx="82" cy="64" r="6" fill="#e8c070" stroke="' + O + '" stroke-width="3"/></svg>'; await svgOut(s, 'wheel', 96); }
    await svgOut('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="160"><path d="M20 4 C34 30 30 62 22 80 C30 98 34 130 20 156 C6 130 10 98 18 80 C10 62 6 30 20 4Z" fill="#c9954a" stroke="#2b1a14" stroke-width="5" stroke-linejoin="round"/><circle cx="20" cy="80" r="9" fill="#7a4a22" stroke="#2b1a14" stroke-width="4"/></svg>', 'prop', 30); }
  // ---------------- dirigiveis: apaga o disco borrado da helice (pixels translucidos e rosados na cauda); a helice vira peca que gira
  if (has('ships')) for (const [n, fx] of [['airship', 0.16], ['airship2', 0.34]]) { const o = await loadWebp(OUT + '/' + n + '.webp'), { d, W, H } = o; let c = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W * fx; x++) { const i = (y * W + x) * 4, pink = d[i] > d[i + 1] + 22 && d[i + 2] > d[i + 1] + 8; if (d[i + 3] && (d[i + 3] < 236 || pink)) { d[i + 3] = 0; c++; } } console.log(n, 'apagados', c, 'soltos', speck(o, 260)); await out(o, n, 0, 88); }
  // ---------------- estacao: a locomotiva pintada e a parede do fundo saem; fica um galpao aberto de ferro (o trem de verdade cruza por tras, em actors)
  if (has('shed')) { const o = await loadWebp(OUT + '/midB.webp'), { d, W, H } = o, XA = 942, XB = 1898, YT = 360, YM = 515, YB = 908, keep = new Uint8Array(W * H), col = x => x >= 1161 && x <= 1221;
    const kill = p => { d[p * 4 + 3] = 0; };
    for (let y = YM; y < YB; y++) for (let x = XA; x < XB; x++) { if (col(x) || (y > 888 && x >= 1146 && x <= 1238)) continue; kill(y * W + x); }
    // acima da linha das maos-francesas: sai tijolo, latao e a chamine preta; ferragem grossa fica (abertura morfologica tira os riscos finos)
    for (let y = YT; y < YM; y++) for (let x = XA; x < XB; x++) { const p = y * W + x, i = p * 4; if (col(x) || d[i + 3] < 200) continue; const r = d[i], g = d[i + 1], b = d[i + 2], brick = r - b > 30 && r > 85, brass = r > 140 && g > 95 && b < 120 && r - b > 45, stack = x >= 1622 && x <= 1768 && y >= 404, lamp = x >= 1730 && x <= 1826 && y >= 480; if (!(brick || brass || stack || lamp)) keep[p] = 1; }
    const R = 3, er = new Uint8Array(W * H), di = new Uint8Array(W * H);
    for (let y = YT; y < YM; y++) for (let x = XA; x < XB; x++) { let ok = 1; for (let dy = -R; dy <= R && ok; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy < YT || xx < XA || xx >= XB) continue; if (yy >= YM) continue; if (!keep[yy * W + xx] && !col(xx)) { ok = 0; break; } } er[y * W + x] = ok; }
    for (let y = YT; y < YM; y++) for (let x = XA; x < XB; x++) { if (!er[y * W + x]) continue; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const yy = y + dy, xx = x + dx; if (yy >= YT && yy < YM && xx >= XA && xx < XB) di[yy * W + xx] = 1; } }
    for (let y = YT; y < YM; y++) for (let x = XA; x < XB; x++) { const p = y * W + x; if (!col(x) && !(keep[p] && di[p])) kill(p); }
    console.log('restos soltos', speck(o, 1500, XA, YT, XB, YM + 40));
    const r = await img(o).webp({ quality: 74, alphaQuality: 100, effort: 6 }).toFile(OUT + '/midB.webp'); console.log('midB', r.width, r.height, Math.round(r.size / 1024) + 'KB');
    const l = await sharp(fs.readFileSync(OUT + '/midB.webp')).resize(880).webp({ quality: 62, alphaQuality: 90 }).toFile(OUT + '/midB_lo.webp'); console.log('midB_lo', Math.round(l.size / 1024) + 'KB');
    await sharp(fs.readFileSync(OUT + '/midB.webp')).extract({ left: 820, top: 250, width: 1160, height: 750 }).resize(900).flatten({ background: '#f0b866' }).jpeg({ quality: 80 }).toFile(S + '/work/shed.jpg'); }
  // ---------------- gato, automato e corvo: folhas de 4 quadros derivadas do sprite (uma regiao gira em torno de uma junta)
  if (has('pets')) {
    await sheet('cat', await loadWebp(OUT + '/cat.webp'), (x, y) => x < 0.27, [0.27, 0.87], [-9, 0, 9, 0]);
    await sheet('robot', await loadWebp(OUT + '/robot.webp'), (x, y) => Math.pow((x - 0.63) / 0.37, 2) + Math.pow((y - 0.215) / 0.228, 2) < 1, [0.63, 0.43], [-6, 0, 6, 0]);
    await sheet('crowpost', await loadWebp(OUT + '/crowpost.webp'), (x, y) => !(x > 0.37 && y > 0.6), [0.55, 0.6], [0, -7, 0, 5]); }
  fs.writeFileSync(infoFile, JSON.stringify(info, null, 1));
})();
