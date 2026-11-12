// Gera assets/bg/v2/era3/meta.json a partir de work/info.json (saida do build3.js).
// uso: node mkmeta3.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta3.js --info tools/info.era3.json <pastaSaida>)
// A era 3 usa so tipos que o scene.js ja tinha: nada de codigo novo.
const fs = require('fs');
const infoFile = process.argv[2] === '--info' ? process.argv[3] : process.argv[2] + '/work/info.json';
const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
const OUT = process.argv[process.argv[2] === '--info' ? 4 : 3];
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const L = (id, o, px, height) => Object.assign({ id }, o, { px, height, repeatWidth: r3(height * px[0] / px[1] * (o.tile === 'repeat' ? 1 : 2)) });
const G = { top: 0.60, height: 0.408 }, SKYH = 0.62, FARH = 0.245, MID = { bottom: 0.635, height: 0.50 };
const road = [r3(G.top + info.road[0] * G.height), r3(G.top + info.road[1] * G.height)], curb = [r3(G.top + info.curb[0] * G.height), r3(G.top + info.curb[1] * G.height)];
const horizon = r4(SKYH * info.horizon), farBottom = r3(horizon + 0.012);
const midW = MID.height * info.midA[0] / info.midA[1], farW = FARH * info.far[0] / info.far[1];
const hex = c => '#' + c.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const S = info.spr, hOf = (n, w) => w * S[n][1] / S[n][0];
// ---- ancoras medidas nas imagens (fracao x,y de cada arquivo)
const P = (x, y) => ({ x: r4(x / 1584), y: r4(y / 594) });                  // medidas na previa de 1584 x 594 do mid
const CHIM = [P(805, 100)], WIN = [P(636, 293), P(756, 293), P(815, 293), P(1397, 452), P(1438, 450)], LANT_A = [P(1478, 336)], LANT_B = [P(739, 332), P(946, 332)];
const BOW = [P(968, 556), P(1430, 556)];
const MUZ = [{ x: 0.1017, y: 0.600 }, { x: 0.1829, y: 0.6147 }, { x: 0.247, y: 0.629 }];   // bocas dos 3 canhoes da bateria (mid B)
const FLAGS_A = [Object.assign(P(1208, 12), { flag: 'pennR' }), Object.assign(P(1060, 72), { flag: 'pennB' }), Object.assign(P(1352, 112), { flag: 'pennR' }), Object.assign(P(1058, 296), { flag: 'sail' })];
const FLAGS_B = [Object.assign(P(385, 54), { flag: 'jolly' })];
const LIGHT = { x: r4((0.75 * 3168 - info.farCrop[0]) / info.farCrop[2]), y: 0.12 };                                          // lanterna do farol no ladrilho far
// ---- props (bloco novo do scene.js): galeao atracado e canos dos canhoes recortados do plano medio (tools/cut3.js); caixas em px do bruto -> fracao do arquivo
const RW = info.midRaw[0], RH = info.midRaw[1], pRect = (b, top) => [r4(b[0] / RW), r4((b[1] - top) / RH), r4(b[2] / RW), r4(b[3] / RH)];
const SHIP = pRect(info.props.ship, info.midTopA), inShip = a => ({ flag: a.flag, x: r4((a.x - SHIP[0]) / SHIP[2]), y: r4((a.y - SHIP[1]) / SHIP[3]), w: 0.074, amp: 0.2 });
const up = (a, dx, dy) => a.map(p => ({ x: r4(p.x + dx), y: r4(p.y - dy) }));
// ---- fumaca com contorno: o mesmo plume duas vezes (mesma semente = mesmas posicoes). 1o passe: discos um pouco maiores na cor do traco; 2o passe: os 2 tons por cima.
const OUTL = '#4a3b3f', RIM = 0.0023;
const smokePair = (id, base, fillC, alphaO, fadeO) => [
  Object.assign({ id: id + '_traco', type: 'plume' }, base, { r0: r4(base.r0 + RIM), light: OUTL, dark: OUTL, alpha: alphaO, fade: fadeO }, base.hot ? { hot: '#b5461c', hotDark: '#b5461c' } : {}),
  Object.assign({ id: id, type: 'plume' }, base, fillC)];
// baforada de canhao: 6 bolhas com n=1 e a mesma vida => nascem JUNTAS na boca (clarao amarelo), abrem, sobem e somem; cada canhao atira defasado (0.37 da vida)
const SHOT = 4.6, shotBlobs = [[-0.105, 0.040, 0.011, 0.024], [-0.074, 0.060, 0.013, 0.027], [-0.052, 0.026, 0.012, 0.022], [-0.030, 0.050, 0.010, 0.02], [-0.088, 0.078, 0.009, 0.019], [-0.014, 0.034, 0.010, 0.016]];
const shotBase = (b, k) => ({ layer: 'mid', anchors: [[], up(MUZ, -0.004, 0.006)], n: 1, life: SHOT, rise: b[1], wind: b[0], spread: 0.022, wobble: 0.006, r0: b[2], grow: b[3], fadeIn: 0.012, hotUntil: 0.07, hot: '#fff7c4', hotDark: '#ffa02e', seed: 60 + k, margin: 0.4 });
const shots = shotBlobs.map((b, k) => smokePair('canhao_' + (k + 1), shotBase(b, k), { light: '#f3eee6', dark: '#b8aea8', alpha: 0.97, fade: 0.87 }, 0.9, 0.8));
const chim = smokePair('chamine', { layer: 'mid', anchors: [up(CHIM, 0, 0), []], n: 10, life: 5.2, rise: 0.17, wind: -0.085, spread: 0.022, wobble: 0.01, r0: 0.0075, grow: 0.021, fadeIn: 0.05, seed: 71 }, { light: '#efe6dc', dark: '#b3a59d', alpha: 0.95, fade: 0.78 }, 0.85, 0.66);
const water = { rgb: '236,250,255', glowRgb: '120,210,230' };
const waveRow = (s, w, y, par, drift, alpha) => ({ parallax: par, drift, alpha, period: r3(w * 2), items: [{ s, x: 0, y, w }, { s, x: w, y, w }] });
const m = {
  version: 2, era: 3, nome: 'Era da Polvora - porto pirata no Caribe, 1700: fortaleza, farol, galeoes e pier de tabuas',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0, 1 e 2; a roupa da era 3 ainda nao existe animada). size = lado do quadro 256 em SH (183 px na cena de 692; o boneco fica com 160 px). footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.32, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#f0dcb6', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.004, top: 0 }, info.sky, SKYH), { horizonY: horizon, nota: 'ceu de fim de tarde + MAR na mesma imagem (o mar vai do horizonte ate o topo do chao e aparece nos vaos do porto); repete em si mesmo, sem espelho' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'repeat', parallax: 0.06, drift: 0, offset: -0.05, bottom: farBottom }, info.far, FARH), { nota: 'baia distante: promontorio da fortaleza com o farol na ponta, galeao ancorado e, depois de um vao de mar, uma ilha de palmeiras; repete em si mesmo (as bordas do ladrilho sao mar aberto). A base e a linha d agua, logo abaixo do horizonte. Ladrilho de 0.9 SH com a fortaleza ocupando metade: sempre ha um pedaco dela na tela, e nunca dois farois' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midA, MID.height), { nota: 'porto sobre cais de pedra. A: barris, guindaste, taverna, redes, galeao atracado. B: bateria de canhoes, mastro da bandeira, palmeiras, armazem com lampioes, estaleiro. Cada trecho termina antes das bordas: nos vaos aparece o mar' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, nota: 'pier: agua do canal (topo, com a borda de cima esmaecida sobre o pe do cais), guia de pedra, tabuas (roadY), guia de pedra, agua. Os pes (groundY) caem nas tabuas' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky (ceu + mar)', 'clouds: brilho do sol, sol, nuvens em 2 velocidades, caminho do sol na agua, galeao e chalupa navegando, 4 fileiras de ondas', 'birds (gaivotas)', 'far', 'farFill (transparente)', 'fx(far): brilho do mar, facho e luz do farol, tiro da fortaleza', 'haze', 'fog[0]', 'sunRays', 'mid', 'props(mid): galeao balancando com as flamulas e a vela; canos dos canhoes com recuo', 'towerFlags (bandeira pirata do mastro)', 'fx(mid): luz das janelas e lampioes, fumaca da chamine, baforadas dos canhoes, respingo no casco', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), '#4f9c95', '#e9a873', hex(info.skyLow), '#5cc9b8', hex(info.seaBottom)], ground: [[curb[0], '#17808b'], [road[0], '#d6a56d'], [road[1], '#b9794d'], [curb[1], '#d6a56d'], [1.001, '#1f6f78']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Vale entre todos os grupos de decalques juntos; em roadside e fg a caixa e so horizontal. Deterministico por celula: nao depende da rolagem. reach = quanto olhar alem da tela (SH) para achar vizinhos.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era: atras do porto fica o mar da camada sky' },
  fx: [
    { id: 'brilho_mar', type: 'flow', layer: 'far', tile: 0, mask: 'glint', rect: [0, r4(1 + 0.03 / FARH), 1, r4((G.top - farBottom - 0.03) / FARH)], rgb: '255,238,200', blend: 'lighter', base: 0, loop: 2.6, frames: 26, maxScale: 1,
      bands: [{ len: 0.052, cycles: 1, alpha: 0.95 }, { len: 0.031, cycles: 2, alpha: 0.5, peak: 0.3 }], nota: 'retangulo ABAIXO do ladrilho far (mar): tracos de luz acendendo em ondas. Comeca 0.03 abaixo da linha d agua para nao riscar o casco dos navios' },
    { id: 'farol_facho_esq', type: 'flow', layer: 'far', tile: 0, mask: 'beamL', rect: [r4(LIGHT.x - 0.2), r4(LIGHT.y - 0.075), 0.2, 0.15], rgb: '255,240,170', blend: 'lighter', base: 0.5, pulse: 1, pulseCycles: 1, loop: 3.6, frames: 36, maxScale: 1.5, bands: [], nota: 'farol GIRANDO: o facho da esquerda e o da direita acendem em contrafase (base*(1+sin) e base*(1-sin)): a luz varre de um lado ao outro a cada 3.6 s' },
    { id: 'farol_facho_dir', type: 'flow', layer: 'far', tile: 0, mask: 'beamR', rect: [LIGHT.x, r4(LIGHT.y - 0.075), 0.2, 0.15], rgb: '255,240,170', blend: 'lighter', base: 0.5, pulse: -1, pulseCycles: 1, loop: 3.6, frames: 36, maxScale: 1.5, bands: [] },
    { id: 'farol_halo', type: 'flow', layer: 'far', tile: 0, mask: 'halo', rect: [r4(LIGHT.x - 0.035), r4(LIGHT.y - 0.13), 0.07, 0.26], rgb: '255,244,190', blend: 'lighter', base: 0.45, pulse: 0.7, pulseCycles: 2, loop: 3.6, frames: 36, maxScale: 1.5, bands: [] },
    { id: 'farol_luz', type: 'glow', layer: 'far', anchors: [[LIGHT]], radius: 0.016, alpha: 0.55, pulse: 2.6, rgb: ['255,246,200', '255,210,120', '255,170,60'] },
    { id: 'janelas_e_lampioes', type: 'glow', layer: 'mid', anchors: [WIN.concat(LANT_A), LANT_B], radius: 0.03, alpha: 0.3, pulse: 5.5, rgb: ['255,214,120', '255,160,60', '255,120,30'] }
  ].concat(chim, shots.map(p => p[0]), shots.map(p => p[1]), [
    { id: 'canhao_lampejo_halo', type: 'plume', layer: 'mid', anchors: [[], up(MUZ, -0.012, 0.012)], n: 1, life: SHOT, rise: 0, wind: 0, spread: 0, wobble: 0, r0: 0.036, grow: 0, alpha: 0.45, fade: 0.99, fadeIn: 0.0001, hot: '#fff3b0', hotDark: '#ffb040', hotUntil: 0.03, light: '#ffe08000', dark: '#ff9a3000', seed: 60, margin: 0.4 },
    { id: 'canhao_lampejo', type: 'plume', layer: 'mid', anchors: [[], up(MUZ, -0.012, 0.012)], n: 1, life: SHOT, rise: 0, wind: 0, spread: 0, wobble: 0, r0: 0.02, grow: 0, alpha: 1, fade: 0.99, fadeIn: 0.0001, hot: '#fffdf0', hotDark: '#ffc21e', hotUntil: 0.03, light: '#fff1a000', dark: '#ff8a1e00', seed: 60, margin: 0.4, nota: 'LAMPEJO do disparo: mesma fase da baforada (n=1, mesma life); visivel so nos primeiros 3% da vida (0.14 s) porque depois de hotUntil a cor vira #rrggbb00 (transparente)' },
    { id: 'casco_espuma', type: 'plume', layer: 'mid', anchors: [BOW, []], n: 7, life: 1.3, rise: 0.02, wind: 0, spread: 0.07, wobble: 0.003, r0: 0.004, grow: 0.011, alpha: 0.8, fade: 0.3, light: '#ffffff', dark: '#bfeeea', seed: 73, nota: 'espuma batendo na proa e na popa do galeao atracado' },
    Object.assign({ id: 'casco_gotas', type: 'embers', layer: 'mid', anchors: [BOW, []], n: 8, life: 0.8, angle: 1.9, speed: 0.085, gravity: 0.36, radius: [0.0015, 0.0028], seed: 97 }, water)
  ]),
  fxNota: 'Efeitos presos a uma camada. anchors/rect: fracoes (x,y[,w,h]) dentro do arquivo da camada (indice = posicao em files; em ladrilho espelhado x vira 1-x). flow: laco de loop segundos em frames quadros; cada quadro = mascara (sprite branco com alfa) preenchida por faixas de brilho que descem e/ou por base*(1+pulse*sin(2pi*fase)) (farol). glow: brilho radial aditivo pulsando. plume: n bolhas sem estado; fase p = frac(t/life + k/n + id*0.37); x = ax + wind*p^1.5 + espalhamento; y = ay - rise*p^0.85; raio = r0 + grow*p; cor quente (hot) ate hotUntil. FUMACA COM CONTORNO: cada fumaca e um par de plumes com a MESMA semente (mesmas posicoes): *_traco desenha os discos 0.0023 SH maiores na cor do traco da arte e some antes; o plume seguinte pinta os 2 tons por cima. BAFORADA: plumes com n=1 e a mesma life nascem juntos na boca do canhao (amarelo-claro nos primeiros 7% = clarao), abrem e somem; uma baforada a cada life segundos por canhao, canhoes defasados. embers: particulas aditivas em arco (gravity positivo = gotas d agua).',
  haze: { y: [0.2, farBottom], rgb: '255,196,150', alpha: 0.3 },
  fog: [{ y: r3(horizon - 0.03), height: 0.07, parallax: 0.1, drift: 0.014, alpha: 0.5 }, { y: 0.545, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.32 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '255,224,190', alpha: 0.30, nota: 'textura procedural: elipses radiais com posicoes de hash, repetida na horizontal. fog[0] = bruma morna no horizonte; fog[1] = maresia baixa no pe do cais' },
  sunRays: { origin: [0.4, 0.335], length: 1.0, count: 5, angle0: 2.02, angleStep: 0.2, halfWidth: [0.04, 0.062], alpha: [0.012, 0.06], rgb: '255,212,150', pulse: 0.45, blend: 'lighter', nota: 'saem do centro do sol (clouds.groups[1]) para a esquerda e para baixo' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. Grupos 0 e 1 = brilho e disco do sol poente (fixos, parallax 0). 2 e 3 = nuvens em 2 velocidades. 4 = caminho do sol na agua (fixo). 5 e 6 = galeao e chalupa navegando para a direita (drift negativo), atras das ilhas, com a linha d agua acima da base do far. 7 a 10 = fileiras de ondas (tiras que emendam), cada uma com velocidade e sentido proprios: a agua muda de forma de verdade.',
    groups: [
      { parallax: 0, drift: 0, alpha: 1, period: 50, items: [{ s: 'sunglow', x: 0.19, y: 0.125, w: 0.42 }] },
      { parallax: 0, drift: 0, alpha: 1, period: 50, items: [{ s: 'sun', x: 0.3575, y: 0.2925, w: 0.085 }] },
      { parallax: 0.03, drift: 0.010, alpha: 0.95, period: 2.2, items: [{ s: 'cloud1', x: 0.10, y: 0.15, w: 0.2 }, { s: 'cloud3', x: 1.25, y: 0.115, w: 0.23 }] },
      { parallax: 0.06, drift: 0.024, alpha: 1, period: 2.6, items: [{ s: 'cloud2', x: 0.5, y: 0.03, w: 0.32 }, { s: 'cloud1', x: 1.7, y: 0.065, w: 0.27 }] },
      { parallax: 0, drift: 0, alpha: 0.9, period: 50, items: [{ s: 'sunpath', x: 0.351, y: r3(horizon + 0.004), w: 0.098 }] },
      { parallax: 0.022, drift: -0.016, alpha: 1, period: 2.3, items: [{ s: 'galleon', x: 0.2, y: r3(farBottom - 0.005 - hOf('galleon', 0.105)), w: 0.105 }] },
      { parallax: 0.03, drift: -0.027, alpha: 1, period: 1.7, items: [{ s: 'sloop', x: 0.95, y: r3(farBottom - 0.004 - hOf('sloop', 0.058)), w: 0.058 }] },
      waveRow('waveS', 0.9, r3(horizon + 0.004), 0.03, 0.008, 0.7),
      waveRow('waveS', 1.2, r3(horizon + 0.03), 0.07, -0.016, 0.8),
      waveRow('waveL', 1.2, r3(horizon + 0.07), 0.12, 0.024, 0.85),
      waveRow('waveL', 1.6, r3(horizon + 0.125), 0.2, -0.036, 0.9)]
  },
  birds: { sprite: 'gull', flocks: [{ period: 13, duration: 9, y: 0.1, size: 0.115, n: 2, phase: 1, alpha: 1 }, { period: 21, duration: 14, y: 0.035, size: 0.068, n: 3, phase: 9, alpha: 0.95 }], nota: 'gaivotas (4 quadros): cruzam da esquerda para a direita; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'dy(u) = sin(u*k1 - t*w1 + ph)*amp*h*(0.15+u) + sin(u*k2 - t*w2 + ph*1.7)*amp*h*0.7*u + u*u*h*droop ; u = 0 na ponta presa, 1 na ponta solta' },
  towerFlags: { pole: 0, width: 0.074, amp: 0.2, nota: 'panos presos pela direita, ondulando por fatias. pole 0: prendem direto na ancora (mastros ja pintados)' },
  midAnchors: { nota: 'fracoes (x,y) dentro de cada arquivo da camada mid (indice = posicao em files). mid B: bandeira pirata no mastro da bateria. (As flamulas do galeao agora acompanham o balanco dele: estao em props[0].flags.)', towerFlags: [[], FLAGS_B] },
  props: [
    { id: 'galeao_atracado', sprite: 'shipM', layer: 'mid', tile: 0, front: true, rect: SHIP, bob: { amp: 0.0032, period: 4.6, phase: 0 }, tilt: { deg: 1.1, period: 6.4, phase: 0.15, pivot: [0.5, r4((0.955 - SHIP[1]) / SHIP[3])] }, flags: FLAGS_A.map(inShip),
      nota: 'galeao recortado do mid A (por tras ficou o cais): sobe e desce 2 px e inclina 1.1 grau em torno do meio da linha d agua, devagar; as flamulas e a vela solta vao junto' }
  ].concat(info.props.guns.map((b, k) => ({ id: 'cano_' + (k + 1), sprite: 'gun' + (k + 1), layer: 'mid', tile: 1, front: true, rect: pRect(b, info.midTopB), kick: { dx: 0.0075, dy: 0.0033, period: SHOT, index: k, attack: 0.05, release: 0.6 },
      nota: k ? undefined : 'canos dos 3 canhoes recortados do mid B: no disparo recuam 5-6 px ao longo do eixo e voltam em 0.6 s; kick.period = life da baforada e kick.index = indice da boca em fx: mesma fase do lampejo e da fumaca' }))),
  propsNota: 'Sprites soltos presos a uma camada (scene.js, bloco opcional props; sem ele nada muda). rect [x,y,w,h] em fracao do arquivo da camada; front = desenhado logo depois da camada. bob {amp SH, period s, phase}; tilt {deg, period, phase, pivot em fracao do rect}; kick {dx, dy SH, period, index, attack, release}: pulso com fase frac(t/period + (ladrilho*10+index)*0.37), igual a de um fx plume com n=1; flags: panos (drawFlag) que acompanham o sprite.',
  roadside: {
    parallax: 1, cell: 0.36, prob: 0.9, seed: 11, minGap: 0.05, reach: 0.7, baseY: [0.694, 0.702], nota: 'objetos na beira de tras do pier, atras do heroi; sorteio por celula igual ao dos decalques. Os que boiam no canal (bote, boia, ilhota da palmeira, pedra) tem uma faixa transparente embaixo do sprite: a base deles fica na agua, acima da guia. type: torch (lampiao de poste + chama em quadros), fire (cesto de fogo: 3 chamas em quadros + brilho + faiscas), banner (haste + bandeira ondulando), critter (papagaio e gato: cauda; bote: proa e popa em contrafase = balanco), vent (pedra: respingo de onda em pulsos), sprite com sway (palmeira, boia) ou parado',
    pool: [
      { type: 'torch', h: [0.2, 0.21], weight: 3 },
      { type: 'fire', sprite: 'brazier', h: [0.1, 0.108], weight: 2, fire: { y: 0.8, size: 0.78, glow: 2.1, glowAlpha: 0.14, sparks: { n: 8, life: 1.5, spread: 0.5, wobble: 0.3, wind: 0.55, rise: 2.6, radius: 0.036 } } },
      { type: 'banner', flag: 'pennB', h: [0.3, 0.32], flagW: 0.15, amp: 0.13, weight: 2 },
      { type: 'banner', flag: 'pennR', h: [0.28, 0.3], flagW: 0.15, amp: 0.13, weight: 1 },
      { type: 'critter', sprite: 'parrot', h: [0.125, 0.135], weight: 2, tail: { x: 0.4, amp: 0.05, f: 2.6, k: 1.6 } },
      { type: 'critter', sprite: 'cat', h: [0.125, 0.135], weight: 2, tail: { x: 0.22, amp: 0.07, f: 2.4, k: 2.2 } },
      { type: 'critter', sprite: 'rowboat', h: [0.088, 0.094], weight: 3, tail: { x: 0.5, amp: 0.06, f: 1.7, k: 3.1416 }, head: { x: 0.5, amp: 0.06, f: 1.7 } },
      { type: 'sprite', sprite: 'buoy', h: [0.082, 0.088], sway: true, swayAmp: 0.9, weight: 2 },
      { type: 'sprite', sprite: 'palm', h: [0.3, 0.33], sway: true, swayAmp: 0.3, weight: 3 },
      { type: 'vent', sprite: 'rock', h: [0.086, 0.092], weight: 2, vent: { period: 2.9, duration: 1.5, idle: 0, y: 0.5, dx: -0.05, n: 12, life: 0.8, rise: 0.085, wind: -0.012, spread: 0.075, wobble: 0.004, r0: 0.005, grow: 0.009, alpha: 0.92, fade: 0.45, light: '#ffffff', dark: '#b9ebe8', seed: 75 } },
      { type: 'sprite', sprite: 'cannon', h: [0.088, 0.094], weight: 1 },
      { type: 'sprite', sprite: 'stack', h: [0.1, 0.108], weight: 1 },
      { type: 'sprite', sprite: 'anchor', h: [0.115, 0.125], weight: 1 },
      { type: 'sprite', sprite: 'chest', h: [0.074, 0.08], weight: 1 },
      { type: 'sprite', sprite: 'bollard', h: [0.068, 0.074], weight: 1 }]
  },
  torch: { flameY: 0.63, flameSize: 0.2, glowRadius: 1.9, glowAlpha: 0.22, nota: 'fracoes da altura do lampiao de poste; chama = folha flame (4 quadros, 10 fps), desenhada dentro e na frente do vidro. Vale tambem para as chamas do cesto de fogo.' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 390 px = 1 tela): o MESMO decalque (mesmo nome no atlas) nunca aparece duas vezes a menos dessa distancia horizontal; entre dois candidatos iguais vence o de maior prioridade rnd(i,seed,6) (deterministico, vale entre todos os grupos; reach >= sameTypeGap). footClear = faixa vertical em torno da linha dos pes (groundY 0.78) livre de pecas com volume: garrafa, cacos, conchas, rolo de corda, tabua solta, balas de canhao, cunho, pilha de moedas e bolsa so entram em roadBigBack (base acima da faixa) e roadBigFront (topo abaixo da faixa); pocas, algas, corda solta, moedas soltas, mapa, remendo de tabuas e espinha de peixe (roadFlat) podem passar sob os pes.',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito: para cada celula i (largura cell), se rnd(i,seed,0) < prob, sorteia item do pool por peso (rnd 1), x = (i + 0.15 + 0.7*rnd 2)*cell, base y em yRange (rnd 3), escala em scale (rnd 4), espelha se rnd 5 < 0.5. Nunca repete.',
    groups: [
      { id: 'canalEspuma', parallax: 1, cell: 0.2, prob: 0.7, seed: 5, yRange: [0.628, 0.668], scale: [0.6, 1.0], flip: true, nota: 'espuma boiando no canal entre o cais e o pier', pool: [['foam1', 1], ['foam2', 1], ['foam3', 1]] },
      { id: 'roadFlat', parallax: 1, cell: 0.17, prob: 0.85, seed: 3, yRange: [r3(road[0] + 0.036), r3(road[1] - 0.004)], scale: [0.72, 1.0], flip: true, nota: 'marcas rasas: podem ficar sob os pes',
        pool: [['puddle1', 3], ['puddle2', 2], ['weed', 2], ['algae', 2], ['ropeS', 2], ['coin', 2], ['coins3', 1], ['map', 1], ['patch', 3], ['fishbone', 1]] },
      { id: 'roadBigBack', parallax: 1, cell: 0.42, prob: 0.75, seed: 13, yRange: [r3(road[0] + 0.022), r3(road[0] + 0.04)], scale: [0.7, 0.9], flip: true, nota: 'pecas com volume na borda de tras das tabuas (base acima da faixa dos pes)',
        pool: [['bottle', 2], ['shards', 2], ['conch', 2], ['shellstar', 2], ['coil', 3], ['plank', 2], ['balls', 2], ['cleat', 2], ['coinpile', 1], ['pouch', 1]] },
      { id: 'roadBigFront', parallax: 1, cell: 0.27, prob: 0.85, seed: 17, yRange: [0.872, r3(road[1] - 0.004)], scale: [0.8, 1.05], flip: true, nota: 'pecas com volume na metade da frente das tabuas (topo abaixo da faixa dos pes)',
        pool: [['bottle', 2], ['shards', 2], ['conch', 2], ['shellstar', 2], ['coil', 3], ['plank', 2], ['balls', 2], ['cleat', 2], ['coinpile', 1], ['pouch', 1]] },
      { id: 'aguaFrente', parallax: 1, cell: 0.22, prob: 0.5, seed: 8, yRange: [r3(curb[1] + 0.03), r3(curb[1] + 0.045)], scale: [0.8, 1.1], flip: true, nota: 'espuma na agua da frente', pool: [['foam1', 1], ['foam2', 1], ['foam3', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi, saindo da agua: folhas de palmeira e capim do mar balancam (skew), barril boiando balanca, estacas de amarracao e pedra ficam paradas',
    pool: [
      { sprite: 'fronds', h: [0.12, 0.15], sway: true, weight: 2 }, { sprite: 'seagrass', h: [0.14, 0.17], sway: true, weight: 2 }, { sprite: 'barrel', h: [0.1, 0.115], sway: true, weight: 2 },
      { sprite: 'pilings', h: [0.15, 0.18], weight: 1 }, { sprite: 'piling', h: [0.15, 0.18], weight: 1 }, { sprite: 'rockweed', h: [0.1, 0.12], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 28, yRange: [0.42, 0.96], rgb: '255,226,150', glowRgb: '255,186,90', radius: [0.0012, 0.003], parallax: 0.55, drift: 0.013, blend: 'lighter', nota: 'poeira dourada do fim de tarde flutuando' },
  bottomShade: { from: 0.94, alpha: 0.28, rgb: '20,40,48' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: {
    sun: 'sun.webp', sunglow: 'sunglow.webp', sunpath: 'sunpath.webp', cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', galleon: 'galleon.webp', sloop: 'sloop.webp', waveS: 'waveS.webp', waveL: 'waveL.webp',
    gull: { file: 'gull.webp', frames: 4, fps: 8 }, flame: { file: 'flame.webp', frames: 4, fps: 10 },
    glint: 'glint.webp', beamL: 'beamL.webp', beamR: 'beamR.webp', halo: 'halo.webp',
    jolly: 'jolly.webp', pennR: 'pennR.webp', pennB: 'pennB.webp', sail: 'sail.webp', pole: 'pole.webp',
    shipM: 'shipM.webp', gun1: 'gun1.webp', gun2: 'gun2.webp', gun3: 'gun3.webp',
    torch: 'torch.webp', brazier: 'brazier.webp', parrot: 'parrot.webp', cat: 'cat.webp', rowboat: 'rowboat.webp', buoy: 'buoy.webp', palm: 'palm.webp', rock: 'rock.webp', cannon: 'cannon.webp',
    stack: 'stack.webp', anchor: 'anchor.webp', chest: 'chest.webp', bollard: 'bollard.webp',
    fronds: 'fronds.webp', seagrass: 'seagrass.webp', barrel: 'barrel.webp', pilings: 'pilings.webp', piling: 'piling.webp', rockweed: 'rockweed.webp'
  },
  animated: [
    { id: 'ceu_e_mar_deriva', tipo: 'ceu e mar pintados derivando devagar, independem da corrida' }, { id: 'nuvens_2_vel', tipo: 'nuvens soltas em 2 velocidades' },
    { id: 'raios_de_sol', tipo: 'feixes dourados saindo do sol poente e pulsando' }, { id: 'gaivotas', tipo: '2 grupos de gaivotas batendo asas (4 quadros)' },
    { id: 'navios_ao_longe', tipo: 'galeao e chalupa navegando no horizonte, passando por tras das ilhas' }, { id: 'ondas', tipo: '4 fileiras de ondas deslizando em sentidos e velocidades diferentes' },
    { id: 'brilho_do_mar', tipo: 'tracos de sol acendendo em ondas na agua' }, { id: 'farol', tipo: 'farol girando: o facho varre da esquerda para a direita (2 fachos em contrafase) + halo' }, { id: 'bruma', tipo: 'bruma morna no horizonte e maresia no pe do cais, deslizando' },
    { id: 'galeao_balancando', tipo: 'galeao atracado sobe, desce e inclina devagar (prop)' }, { id: 'flamulas_galeao', tipo: '3 flamulas nos mastros e uma vela solta na verga do galeao tremulando, acompanhando o balanco' }, { id: 'bandeira_pirata_mastro', tipo: 'bandeira pirata no mastro da bateria' },
    { id: 'fumaca_chamine', tipo: 'fumaca da chamine da taverna, com contorno no traco da arte' }, { id: 'janelas_lampioes', tipo: 'luz das janelas da taverna, da popa do galeao e dos lampioes do armazem pulsando' },
    { id: 'canhoes_bateria', tipo: '3 canhoes da muralha atirando em sequencia: lampejo na boca + recuo do cano + baforada de fumaca com contorno' }, { id: 'espuma_casco', tipo: 'espuma e gotas batendo na proa e na popa do galeao' },
    { id: 'lampioes_pier', tipo: 'lampioes de poste no pier com chama em quadros e brilho' }, { id: 'cesto_de_fogo', tipo: 'cesto de fogo: 3 chamas em quadros, brilho e faiscas' },
    { id: 'bandeiras_pier', tipo: 'flamulas listrada e vermelha em hastes na beira do pier (a unica bandeira pirata e a do mastro da bateria)' }, { id: 'papagaio_e_gato', tipo: 'papagaio no toco e gato no barril mexendo a cauda' },
    { id: 'botes', tipo: 'botes balancando no canal (proa e popa em contrafase)' }, { id: 'boias_palmeiras', tipo: 'boias e palmeiras de ilhota balancando' },
    { id: 'respingo_de_onda', tipo: 'onda batendo na pedra do canal em pulsos' },
    { id: 'poeira_dourada', tipo: 'poeira dourada flutuando e piscando' }, { id: 'primeiro_plano', tipo: 'folhas de palmeira, capim do mar e barril boiando balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
console.log('meta.json', s.length, 'bytes', 'horizonte', horizon, 'far.bottom', farBottom, 'tabuas', road, 'guias', curb, 'midW', r3(midW), 'farW', r3(farW));
