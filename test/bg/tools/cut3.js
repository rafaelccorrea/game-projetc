// ERA 3, rodada 3: recorta do plano medio as pecas que viram props animados (meta.props): o galeao atracado (mid A) e os 3 canos de canhao (mid B).
// Entrada: imagens brutas ja com chroma (RGBA, 3168 px de largura). Devolve os sprites e a caixa de cada um em px do bruto; a camada fica sem a peca
// (galeao: cais copiado de um trecho limpo por tras; canos: cor de alem da boca puxada ao longo do eixo, que e o que aparece quando o cano recua).
const { crop } = require('./lib.js');
const comps = (m, W, H, x0, y0, x1, y1) => { const lab = new Int32Array(W * H), out = []; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const p0 = y * W + x; if (!m[p0] || lab[p0]) continue; const st = [p0], px = []; lab[p0] = 1; let bx0 = W, by0 = H, bx1 = 0, by1 = 0;
      while (st.length) { const p = st.pop(), xx = p % W, yy = (p / W) | 0; px.push(p); if (xx < bx0) bx0 = xx; if (xx > bx1) bx1 = xx; if (yy < by0) by0 = yy; if (yy > by1) by1 = yy; for (const q of [p - 1, p + 1, p - W, p + W]) { const qx = q % W, qy = (q / W) | 0; if (qx < x0 || qx >= x1 || qy < y0 || qy >= y1 || Math.abs(qx - xx) > 1 || lab[q] || !m[q]) continue; lab[q] = 1; st.push(q); } }
      out.push({ px, x0: bx0, y0: by0, x1: bx1, y1: by1 }); } return out; };
const grow = (m, W, H, n, ok) => { let front = []; for (let p = 0; p < W * H; p++) if (m[p]) front.push(p); for (let k = 0; k < n; k++) { const nx = []; for (const p of front) { const x = p % W; for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1 || m[q] || (ok && !ok(q))) continue; m[q] = 1; nx.push(q); } } front = nx; } return m; };
const erode = (m, W, H, n) => { const inv = new Uint8Array(W * H); for (let p = 0; p < W * H; p++) inv[p] = m[p] ? 0 : 1; grow(inv, W, H, n, null); for (let p = 0; p < W * H; p++) m[p] = inv[p] ? 0 : 1; return m; };
const bboxOf = (m, W, H) => { let x0 = W, y0 = H, x1 = 0, y1 = 0; for (let p = 0; p < W * H; p++) if (m[p]) { const x = p % W, y = (p / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } return { x0, y0, x1, y1 }; };
const sprite = (o, m, b, pad = 2) => { const x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), w = Math.min(o.W, b.x1 + pad + 1) - x0, h = Math.min(o.H, b.y1 + pad + 1) - y0, s = crop(o, x0, y0, w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!m[(y + y0) * o.W + x + x0]) s.d[(y * w + x) * 4 + 3] = 0; return { img: s, box: [x0, y0, w, h] }; };

function cutShip(A) { const { d, W, H } = A, X0 = 1700, X1 = 3090, YS = 995, YW = 1006, SHIFT = 1120, orig = Buffer.from(d);
  const cls = p => { const i = p * 4; if (d[i + 3] <= 60) return 0; const r = d[i], g = d[i + 1], b = d[i + 2]; const l = r + g + b; if (l < 230) return 3; return (g > r || (l >= 330 && b > r * 0.42)) ? 1 : 2; };   // 1 = pedra/ferro/musgo, 2 = madeira do casco, 3 = traco escuro
  // abaixo do topo do cais o casco fica na frente das pedras: contorno tracado a mao (px do bruto), ajustado na borda pela cor (pedra clara fica de fora)
  const POLY = [[1838, 990], [2948, 990], [2940, 1012], [2933, 1050], [2883, 1074], [2851, 1122], [2848, 1166], [2848, 1192], [2819, 1196], [2810, 1210], [2781, 1262], [2781, 1300], [2029, 1300], [2029, 1255], [1999, 1222], [1975, 1179], [1953, 1133], [1923, 1089], [1885, 1051], [1853, 1012], [1840, 1012]];
  const poly = new Uint8Array(W * H); for (let y = 985; y < H; y++) { const xs = []; for (let k = 0; k < POLY.length; k++) { const [x1, y1] = POLY[k], [x2, y2] = POLY[(k + 1) % POLY.length]; if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + (y - y1) * (x2 - x1) / (y2 - y1)); } xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) poly[y * W + x] = 1; }
  const inner = erode(Uint8Array.from(poly), W, H, 8), outer = grow(Uint8Array.from(poly), W, H, 8, null), m = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) { if (!outer[p] || d[p * 4 + 3] <= 60) continue; const c = cls(p); if (inner[p] || ((c === 2 || c === 3) && (poly[p] || p > 1014 * W))) m[p] = 1; }   // fora do contorno, na altura do topo do cais, o traco escuro e do cais
  // acima do topo do cais: tudo o que estiver ligado ao casco (mastros, cordame, velas, lanterna)
  grow(m, W, H, 1e9, q => { const y = (q / W) | 0, x = q % W; return y < YS + 2 && x >= X0 && x < X1 && d[q * 4 + 3] > 60; });
  // buracos fechados (portinholas dos canhoes, cinza) entram na mascara
  const outside = new Uint8Array(W * H), st = []; const b = bboxOf(m, W, H), bx0 = b.x0 - 3, by0 = b.y0 - 3, bx1 = b.x1 + 3, by1 = Math.min(H - 1, b.y1 + 3);
  for (let x = bx0; x <= bx1; x++) { st.push(by0 * W + x, by1 * W + x); } for (let y = by0; y <= by1; y++) { st.push(y * W + bx0, y * W + bx1); }
  while (st.length) { const p = st.pop(); if (outside[p] || m[p]) continue; const x = p % W, y = (p / W) | 0; if (x < bx0 || x > bx1 || y < by0 || y > by1) continue; outside[p] = 1; st.push(p - 1, p + 1, p - W, p + W); }
  let holes = 0; for (let y = Math.max(by0, YS); y <= by1; y++) for (let x = bx0; x <= bx1; x++) { const p = y * W + x; if (!m[p] && !outside[p]) { m[p] = 1; holes++; } }
  const out = sprite(A, m, bboxOf(m, W, H)); console.log('galeao: caixa', out.box, 'buracos fechados', holes);
  // camada sem o galeao: por tras dele, o cais copiado de um trecho limpo (SHIFT px a esquerda); acima do cais, transparente
  const md = grow(Uint8Array.from(m), W, H, 2, null); for (let p = 0; p < W * H; p++) { if (!md[p]) continue; const y = (p / W) | 0, i = p * 4; if (y < YW) { d[i + 3] = 0; continue; } const j = (p - SHIFT) * 4; d[i] = orig[j]; d[i + 1] = orig[j + 1]; d[i + 2] = orig[j + 2]; d[i + 3] = orig[j + 3]; }
  return out; }

function cutGuns(B) { const { d, W, H } = B, X0 = 250, X1 = 1150, Y0 = 690, Y1 = 1000, orig = Buffer.from(d), U = [-0.917, -0.4];
  const iron = p => { const i = p * 4, r = d[i], g = d[i + 1], b = d[i + 2], l = r + g + b; return d[i + 3] > 128 && Math.abs(r - b) <= 22 && g <= Math.max(r, b) + 6 && l <= 480; };   // ferro: cinza/preto neutro (o traco da madeira e marrom)
  const f = new Uint8Array(W * H); for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) if (iron(y * W + x)) f[y * W + x] = 1;
  erode(f, W, H, 5); grow(f, W, H, 5, iron);   // abre: tira tracos finos soltos
  // os 3 canos se tocam pelos tracos: separa por faixas paralelas ao eixo, uma por boca (MUZ em px do bruto)
  const MUZ = [[335, 791], [592, 808], [795, 825]], cs = MUZ.map(([mx, my]) => { const ck = -0.4 * mx + 0.917 * my, ak = 0.917 * mx + 0.4 * my, band = new Uint8Array(W * H); for (let y = Y0; y < Y1; y++) for (let x = X0; x < X1; x++) { if (!f[y * W + x]) continue; const c = -0.4 * x + 0.917 * y, al = 0.917 * x + 0.4 * y; if (Math.abs(c - ck) <= 37 && al >= ak - 16 && al <= ak + 352) band[y * W + x] = 1; }
    return comps(band, W, H, X0, Y0, X1, Y1).sort((p, q) => q.px.length - p.px.length)[0]; }); console.log('canos:', cs.map(c => c.px.length + ' @' + c.x0 + ',' + c.y0 + '-' + c.x1 + ',' + c.y1).join(' | '));
  const all = new Uint8Array(W * H), guns = [];
  for (const c of cs) { const m = new Uint8Array(W * H); c.px.forEach(p => { m[p] = 1; }); grow(m, W, H, 4, q => { const i = q * 4; return d[i + 3] > 60 && (d[i] + d[i + 1] + d[i + 2] < 150 || iron(q)); });
    guns.push(sprite(B, m, bboxOf(m, W, H))); for (let p = 0; p < W * H; p++) if (m[p]) all[p] = 1; }
  // camada sem os canos: cada pixel recebe a cor que esta alem da boca, andando ao longo do eixo (e o que aparece quando o cano recua)
  const md = grow(all, W, H, 1, null); for (let p = 0; p < W * H; p++) { if (!md[p]) continue; const x = p % W, y = (p / W) | 0; let t = 1, q = p; for (; t < 600; t++) { const xx = Math.round(x + U[0] * t), yy = Math.round(y + U[1] * t); q = yy * W + xx; if (xx < 0 || yy < 0 || !md[q]) { q = Math.round(y + U[1] * (t + 2)) * W + Math.round(x + U[0] * (t + 2)); break; } }
    const i = p * 4, j = q * 4; d[i] = orig[j]; d[i + 1] = orig[j + 1]; d[i + 2] = orig[j + 2]; d[i + 3] = orig[j + 3]; }
  return guns; }
module.exports = { cutShip, cutGuns };
