// Gera assets/bg/v2/era7/meta.json a partir de work/info.json (saida do build7.js).
// uso: node mkmeta7.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta7.js --info tools/info.era7.json <pastaSaida>)
// Era 7 (Submundo): so blocos que o scene.js ja tem (actors sky/far/mid com parts flap e smoke, props com tilt, fx flow/glow/plume/embers,
// roadside fire/lantern/pacer/hopper/critter/vent/sway). O scene.js NAO muda.
const fs = require('fs');
const infoFile = process.argv[2] === '--info' ? process.argv[3] : process.argv[2] + '/work/info.json';
const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
const OUT = process.argv[process.argv[2] === '--info' ? 4 : 3];
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const L = (id, o, px, height) => Object.assign({ id }, o, { px, height, repeatWidth: r3(height * px[0] / px[1] * (o.tile === 'repeat' ? 1 : 2)) });
const G = { top: 0.60, height: 0.408 }, SKYH = 0.62, FARH = 0.5, FARB = 0.565, MID = { bottom: 0.622, height: r3(info.midRaw[1] * 0.0005) };
const gy = f => r3(G.top + f * G.height), road = info.road.map(gy), curb = info.curb.map(gy);
const farTop = FARB - FARH, midW = MID.height * info.midRaw[0] / info.midRaw[1];
const hex = c => '#' + c.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const S = info.spr, hOf = (n, w) => w * S[n][1] / S[n][0];
// ---- ancoras medidas nas previas de 1584 px de largura dos dois trechos do mid (fracao x,y de cada arquivo) e do far
const PW = 1584, PH = 1584 * info.midRaw[1] / info.midRaw[0], P = (x, y) => ({ x: r4(x / PW), y: r4(y / PH) });
const FPH = 1584 * info.far[1] / info.far[0], FP = (x, y) => ({ x: r4(x / PW), y: r4(y / FPH) });
const A = l => [l, []], B = l => [[], l];
const riverY = r4(farTop + info.farRiver * FARH);
// ---- fumaca com contorno (par de plumes com a mesma semente)
const OUTL = '#1a0e10', RIM = 0.0022;
const pair = (id, base, fillC, alphaO, fadeO, rim) => [
  Object.assign({ id: id + '_traco', type: 'plume' }, base, { r0: r4(base.r0 + (rim || RIM)), light: OUTL, dark: OUTL, alpha: alphaO, fade: fadeO }),
  Object.assign({ id: id, type: 'plume' }, base, fillC)];
const SMOKE = { light: '#6e6266', dark: '#463a40', alpha: 0.92, fade: 0.82 }, STEAM = { light: '#d8a8a0', dark: '#9a6a66', alpha: 0.8, fade: 0.76 };
const MK = info.masks, mrect = n => MK[n].rect.map(r4);
const lava = (id, mask, o) => Object.assign({ id, type: 'flow', layer: MK[mask].src === 'far' ? 'far' : 'mid', tile: MK[mask].tile, mask, rect: mrect(mask), rgb: '255,210,90', blend: 'lighter', maxScale: 1.5, bands: [] }, o);
const m = {
  version: 2, era: 7, nome: 'Era do Submundo - montanhas de obsidiana, cidadela demoniaca, cascatas e rio de lava, caveira de rocha, forja de diabretes e estrada de lajes com juntas de lava',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0 a 6). size = lado do quadro 256 em SH. footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.42, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#7a6a6a', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.004, top: 0 }, info.sky, SKYH), { nota: 'ceu procedural: carmim escuro -> vermelho -> brasa laranja no horizonte, com faixas leves de cinza. Repete em si mesmo' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'mirror', parallax: 0.06, drift: 0, offset: 0.13, bottom: FARB }, info.far, FARH), { riverY, nota: 'montanhas e agulhas de obsidiana, cidadela demoniaca no penhasco, 2 cascatas de lava e RIO DE LAVA de ponta a ponta (riverY = superficie, em SH): o barco do barqueiro navega nele (actors slot far). Ladrilho ESPELHADO. A base some na bruma (alfa)' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midRaw, MID.height), { nota: 'A: portal gotico em ruinas com grade de lancas, pedestal com braseiro (fogo roxo por codigo), caveira de rocha com olhos e mandibula de lava, arvore morta, torre em ruinas com janelas acesas. B: cristais de obsidiana, forja de diabretes com bigorna, trono de ossos, forca com GAIOLA (sprite que balanca), pilar quebrado com cascata de lava. Nos vaos aparecem o rio de lava e as montanhas' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, nota: 'rocha escura com rachaduras de lava (borda de cima esmaecida sobre o pe das estruturas), mureta de blocos, estrada de lajes hexagonais e quadradas com juntas de lava (roadY), mureta, rocha. Os pes (groundY) caem nas lajes' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky', 'clouds: LUA DE SANGUE fixa; nuvens de cinza em 2 velocidades', 'actors(sky): SERPE batendo a asa, gargula e corvo voando', 'birds (morcegos)', 'far', 'actors(far): barco do barqueiro no rio de lava', 'farFill (transparente)', 'fx(far): lava descendo nas cascatas, rio brilhando, borbulhas', 'haze', 'fog[0]', 'actors(mid): fantasma e espirito de fogo flutuando atras das estruturas', 'mid', 'props(mid): gaiola balancando', 'fx(mid): fogo roxo do braseiro, olhos e mandibula de lava, janelas da torre, cristais pulsando, boca da forja, faiscas da bigorna, fumaca da chamine, cascata do pilar', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes (brasas subindo)', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), hex(info.skyHi), hex(info.skyMid), hex(info.skyLow), hex(info.skyBottom), hex(info.skyBottom)], ground: [[curb[0], '#3a3036'], [road[0], '#4a4048'], [road[1], '#5a5258'], [curb[1], '#4a4048'], [1.001, '#3a3036']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Deterministico por celula: nao depende da rolagem. reach = quanto olhar alem da tela (SH) para achar vizinhos.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era: atras das montanhas fica a brasa do ceu' },
  props: [
    { id: 'gaiola', sprite: 'cage', layer: 'mid', tile: 1, front: true, rect: info.cuts.cage.rect.map(r4), tilt: { deg: 6, period: 3.4, phase: 0, pivot: [0.484, 0] } }
  ],
  propsNota: 'Sprites soltos presos a uma camada (rect = fracao do arquivo da camada). GAIOLA da forca: corrente e gaiola recortadas da arte, balancando 6 graus em torno do gancho da trave (pivot no topo).',
  actors: [
    { id: 'serpe', slot: 'sky', sprite: 'wyvern', x: 0.3, y: 0.1, w: 0.17, parallax: 0.03, drift: -0.06, loop: 2.2, bob: 0.012, bobF: 1.4, parts: [
      { sprite: 'wing', x: 0.5, y: 0.42, w: 0.62, period: 1.15, flap: true, ang: 0, back: true, phase: 1.2 }, { sprite: 'wing', x: 0.56, y: 0.4, w: 0.62, period: 1.15, flap: true, ang: 0 }] },
    { id: 'gargula', slot: 'sky', sprite: 'gargoyle', x: 1.8, y: 0.2, w: 0.08, parallax: 0.035, drift: -0.08, loop: 3.0, bob: 0.008, bobF: 2.6 },
    { id: 'corvo', slot: 'sky', sprite: 'crow', x: 1.0, y: 0.05, w: 0.05, parallax: 0.025, drift: -0.11, loop: 2.7, bob: 0.006, bobF: 3.4 },
    { id: 'barqueiro', slot: 'far', sprite: 'boat', x: 0.5, y: r4(riverY + 0.006 - hOf('boat', 0.13)), w: 0.13, parallax: 0.06, drift: 0.03, loop: 2.0, bob: 0.0025, bobF: 1.3 },
    { id: 'fantasma', slot: 'mid', sprite: 'ghost', x: 0.6, y: 0.33, w: 0.07, parallax: 0.3, drift: -0.035, loop: 2.2, bob: 0.014, bobF: 1.1 },
    { id: 'espirito_fogo', slot: 'mid', sprite: 'fspirit', x: 1.7, y: 0.25, w: 0.08, parallax: 0.32, drift: -0.05, loop: 2.0, bob: 0.012, bobF: 1.7,
      smoke: [{ x: 0.12, y: 0.55, n: 5, life: 0.7, rise: 0.025, wind: -0.03, spread: 0.008, wobble: 0.004, r0: 0.004, grow: 0.002, fadeIn: 0.05, alpha: 0.75, light: '#ffb347', dark: '#e0581f', hot: '#fff1a0', hotDark: '#ffb347', hotUntil: 0.3, fade: 0.5, seed: 63 }] }
  ],
  actorsNota: 'Sprites que cruzam a cena (x, y, w em SH; deslocamento = scroll*parallax + t*drift; da a volta a cada loop SH), com pecas presas (x, y = centro em fracao do corpo; w = fracao da largura do corpo; period = s por volta; flap = achata em cosseno no angulo ang). SERPE: 2 asas (uma atras do corpo, defasada) batendo em cosseno em torno da linha do ombro (o sprite da asa tem a metade de baixo vazia para o centro cair no ombro); sobe e desce. GARGULA e CORVO cruzam o ceu atras das montanhas. BARQUEIRO (proa de caveira a esquerda: navega para a esquerda): barco com o casco 0,006 SH abaixo da superficie do rio de lava, balancando de leve. FANTASMA e ESPIRITO DE FOGO (com rastro de fagulhas) flutuam atras das estruturas do plano medio.',
  fx: [
    lava('lava_cascatas', 'mFalls', { loop: 2.4, frames: 36, base: 0.12, pulse: 0.4, pulseCycles: 1, bands: [{ len: 0.05, cycles: 2, alpha: 0.75, peak: 0.6 }, { len: 0.12, cycles: 1, alpha: 0.45 }], nota: 'lava descendo pelas 2 cascatas distantes' }),
    lava('lava_rio', 'mRiver', { loop: 5, frames: 40, base: 0.22, pulse: 0.8, pulseCycles: 2, nota: 'rio de lava brilhando em ondas lentas' }),
    { id: 'borbulhas_rio', type: 'embers', layer: 'far', anchors: [[0.08, 0.27, 0.46, 0.63, 0.84].map(x => ({ x, y: r4(info.farRiver + 0.01) }))], n: 3, life: 1.1, speed: 0.02, angle: 1.2, gravity: 0.03, wind: 0, wobble: 0.002, radius: [0.0008, 0.0015], rgb: '255,210,110', glowRgb: '255,90,20', seed: 97, margin: 0.2 },
    lava('lava_mandibula', 'mJaw', { loop: 2.2, frames: 33, base: 0.15, pulse: 0.5, pulseCycles: 1, bands: [{ len: 0.06, cycles: 2, alpha: 0.7, peak: 0.6 }], nota: 'lava escorrendo da mandibula da caveira' }),
    lava('olhos_caveira', 'mEyes', { loop: 3, frames: 36, base: 0.35, pulse: 0.9, pulseCycles: 2, nota: 'olhos da caveira pulsando' }),
    lava('janelas_torre', 'mTowerW', { loop: 4.2, frames: 42, base: 0.25, pulse: 0.7, pulseCycles: 3, rgb: '255,190,90' }),
    Object.assign(lava('cristais', 'mCryst', { loop: 3.6, frames: 36, base: 0.18, pulse: 0.9, pulseCycles: 1, rgb: '200,150,255', nota: 'brilho roxo correndo pelos cristais de obsidiana' })),
    lava('boca_forja', 'mForge', { loop: 1.8, frames: 28, base: 0.35, pulse: 0.7, pulseCycles: 3, nota: 'boca da forja tremendo' }),
    lava('cascata_pilar', 'mLavaP', { loop: 1.6, frames: 32, base: 0.1, pulse: 0.3, pulseCycles: 1, bands: [{ len: 0.05, cycles: 3, alpha: 0.8, peak: 0.6 }], nota: 'lava descendo pela rachadura do pilar' }),
    { id: 'olhos_brilho', type: 'glow', layer: 'mid', anchors: A([P(800, 300), P(868, 300)]), radius: 0.04, alpha: 0.32, pulse: 3.3, rgb: ['255,200,120', '255,110,30', '255,40,0'] },
    { id: 'fogo_roxo_brilho', type: 'glow', layer: 'mid', anchors: A([P(552, 222)]), radius: 0.07, alpha: 0.35, pulse: 6, rgb: ['230,170,255', '170,80,255', '110,20,255'] },
    { id: 'forja_brilho', type: 'glow', layer: 'mid', anchors: B([P(515, 390)]), radius: 0.07, alpha: 0.3, pulse: 5, rgb: ['255,200,120', '255,110,30', '255,40,0'] },
    { id: 'faiscas_bigorna', type: 'embers', layer: 'mid', anchors: B([P(565, 468)]), n: 6, life: 0.8, speed: 0.07, angle: 2.0, gravity: 0.12, wind: 0, wobble: 0.003, radius: [0.0012, 0.002], rgb: '255,230,140', glowRgb: '255,120,30', seed: 91 },
    { id: 'brasas_pilar', type: 'embers', layer: 'mid', anchors: B([P(1408, 545)]), n: 6, life: 1.4, speed: 0.04, angle: 1.4, gravity: -0.01, wind: -0.01, wobble: 0.006, radius: [0.001, 0.002], rgb: '255,200,100', glowRgb: '255,80,20', seed: 95 },
    { id: 'fogo_roxo', type: 'plume', layer: 'mid', anchors: A([P(552, 226)]), n: 9, life: 0.9, rise: 0.06, wind: -0.005, spread: 0.022, wobble: 0.006, r0: 0.011, grow: -0.009, fadeIn: 0.05, alpha: 0.95, light: '#d9a4ff', dark: '#8a3ee0', hot: '#fff0ff', hotDark: '#c78bff', hotUntil: 0.35, fade: 0.55, seed: 69, nota: 'chama roxa de bolhas que sobem e afinam no braseiro do pedestal' },
    { id: 'fagulhas_roxas', type: 'embers', layer: 'mid', anchors: A([P(552, 205)]), n: 5, life: 1.2, speed: 0.05, angle: 0.9, gravity: -0.01, wind: -0.01, wobble: 0.006, radius: [0.001, 0.0018], rgb: '230,190,255', glowRgb: '150,60,255', seed: 99 }
  ].concat(
    pair('fumaca_forja', { layer: 'mid', anchors: B([P(482, 102)]), n: 7, life: 4.6, rise: 0.15, wind: -0.07, spread: 0.02, wobble: 0.01, r0: 0.008, grow: 0.024, fadeIn: 0.06, seed: 71 }, SMOKE, 0.85, 0.8),
    pair('vapor_pilar', { layer: 'mid', anchors: B([P(1408, 552)]), n: 5, life: 3.0, rise: 0.08, wind: -0.03, spread: 0.02, wobble: 0.008, r0: 0.006, grow: 0.016, fadeIn: 0.08, seed: 73 }, STEAM, 0.65, 0.72, 0.0018)),
  fxNota: 'Efeitos presos a uma camada. anchors/rect: fracoes (x,y[,w,h]) dentro do arquivo da camada. flow: laco de loop segundos em frames quadros; cada quadro = mascara (os proprios pixels de lava / cristal da arte, recortados pelo build7) pintada com rgb, faixas descendo (bands) e alfa base*(1+pulse*sin(2pi*fase*pulseCycles)). LAVA: faixas claras descendo = lava escorrendo. glow: brilho radial aditivo. plume: fumaca/vapor (par com contorno) e fogo roxo (bolhas que afinam). embers: fagulhas, faiscas e borbulhas.',
  haze: { y: [0.2, FARB], rgb: '150,40,30', alpha: 0.28 },
  fog: [{ y: 0.455, height: 0.12, parallax: 0.1, drift: 0.012, alpha: 0.5 }, { y: 0.548, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.3 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '170,60,40', alpha: 0.32, nota: 'textura procedural: elipses radiais com posicoes de hash, repetida na horizontal. fog[0] = bruma vermelha na base das montanhas; fog[1] = fumaca baixa no pe das estruturas' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. Grupo 1 FIXO (parallax 0): lua de sangue. Grupos 2 e 3: nuvens de cinza com barriga vermelha em 2 velocidades.',
    groups: [
      { parallax: 0, drift: 0, alpha: 1, period: 3, items: [{ s: 'moon', x: 0.36, y: 0.02, w: 0.14 }] },
      { parallax: 0.02, drift: 0.01, alpha: 0.92, period: 2.4, items: [{ s: 'cloud1', x: 0.15, y: 0.12, w: 0.28 }, { s: 'cloud3', x: 1.3, y: 0.05, w: 0.32 }] },
      { parallax: 0.04, drift: 0.022, alpha: 1, period: 2.8, items: [{ s: 'cloud2', x: 0.75, y: 0.17, w: 0.24 }, { s: 'cloud1', x: 1.95, y: 0.08, w: 0.22 }] }
    ]
  },
  birds: { sprite: 'bat', flocks: [{ period: 12, duration: 6, y: 0.03, size: 0.04, n: 4, phase: 2, alpha: 1 }, { period: 19, duration: 9, y: 0.01, size: 0.03, n: 5, phase: 9, alpha: 0.95 }], nota: 'morcegos (6 quadros de 4 poses): cruzam da esquerda para a direita no alto do ceu; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'nao usado nesta era; mantido pelo formato' },
  roadside: {
    parallax: 1, cell: 0.34, prob: 0.92, seed: 11, minGap: 0.05, sameTypeGap: 0.62, reach: 0.75, baseY: [0.668, 0.676], nota: 'objetos na rocha de tras, atras do heroi; sorteio por celula igual ao dos decalques. Animados e parados disputam o MESMO sorteio (minGap, sameTypeGap 0.62 SH). BRASEIRO (fire): 3 chamas ROXAS em quadros + brilho + faiscas. ESTACA COM CAVEIRA E LANTERNA (lantern): brilho pulsando. DIABRETE (pacer): senta, anda 0.09 SH em 4 passos, senta virado e volta. MORCEGO (hopper): duas colunas quebradas a 0.13 SH; fica pousado numa, voa em arco batendo asas ate a outra, pousa, e volta. GATO PRETO (critter): cauda e cabeca. CALDEIRAO (vent): bolhas de vapor roxo. RESPIRO DE ROCHA (vent): baforadas de fumaca. BACIA DE LAVA (vent): borbulhas quentes. ESPINHEIRO/CAPIM balancam.',
    pool: [
      { type: 'fire', sprite: 'brazier', h: [0.09, 0.096], weight: 3, fire: { y: 0.8, size: 0.85, glow: 1.6, glowAlpha: 0.1, sparks: { n: 7, life: 1.4, spread: 0.5, wobble: 0.3, wind: 0.5, rise: 2.4, radius: 0.034 } } },
      { type: 'lantern', h: [0.2, 0.21], weight: 3 },
      { type: 'pacer', sprite: 'imp', h: [0.08, 0.085], weight: 3, span: 0.1, walk: { dist: 0.09, period: 7, split: [0.3, 0.5, 0.8], sit: 1, steps: 8 } },
      { type: 'hopper', sprite: 'batsit', h: [r4(0.075 * info.bat.frame[1] / info.bat.postH), r4(0.08 * info.bat.frame[1] / info.bat.postH)], weight: 2, span: 0.13, hop: { post: 'perch', dx: 0.13, period: 5, flight: 0.7, fly: 'bat', size: 0.05, height: 0.045, cx: 0.5, cy: r4(info.bat.cy) } },
      { type: 'critter', sprite: 'cat', h: [0.07, 0.075], weight: 2, tail: { x: 0.3, f: 3, k: 4, amp: 0.1 }, head: { x: 0.72, f: 1.2, amp: 0.03 } },
      { type: 'vent', sprite: 'cauldron', h: [0.08, 0.085], weight: 2, vent: { y: 0.82, period: 2.6, duration: 1.6, idle: 0.35, n: 6, life: 1.4, rise: 0.08, wind: -0.015, spread: 0.014, wobble: 0.005, r0: 0.004, grow: 0.012, fadeIn: 0.08, alpha: 0.7, light: '#d7b4ff', dark: '#8650d0', fade: 0.7, seed: 85 } },
      { type: 'vent', sprite: 'ventrock', h: [0.08, 0.085], weight: 1, vent: { y: 0.6, period: 4.4, duration: 1.8, idle: 0.1, n: 7, life: 1.8, rise: 0.12, wind: -0.02, spread: 0.02, wobble: 0.006, r0: 0.006, grow: 0.02, fadeIn: 0.08, alpha: 0.75, light: '#7c6e72', dark: '#4a3e44', fade: 0.75, seed: 87 } },
      { type: 'vent', sprite: 'lavabasin', h: [0.05, 0.054], weight: 1, vent: { y: 0.55, period: 1.8, duration: 1.0, idle: 0.3, n: 4, life: 0.8, rise: 0.03, wind: 0, spread: 0.02, wobble: 0.003, r0: 0.003, grow: 0.004, fadeIn: 0.05, alpha: 0.85, light: '#ffcf6a', dark: '#e0581f', hot: '#fff3b0', hotDark: '#ffb347', hotUntil: 0.4, fade: 0.6, seed: 89 } },
      { type: 'sprite', sprite: 'thorn', h: [0.09, 0.1], weight: 1, sway: true, swayAmp: 0.4 },
      { type: 'sprite', sprite: 'tomb', h: [0.08, 0.085], weight: 1 }, { type: 'sprite', sprite: 'fence', h: [0.085, 0.09], weight: 1 }, { type: 'sprite', sprite: 'bonesign', h: [0.13, 0.14], weight: 1 },
      { type: 'sprite', sprite: 'gstatue', h: [0.12, 0.13], weight: 1 }, { type: 'sprite', sprite: 'chest', h: [0.065, 0.07], weight: 1 }, { type: 'sprite', sprite: 'gallows', h: [0.17, 0.18], weight: 1 }]
  },
  lantern: { glowY: 0.46, glowRadius: 0.28, glowAlpha: 0.3, nota: 'brilho da lanterna pendurada na estaca: centro a glowY da altura (de baixo); pulsa' },
  torch: { flameY: 0.7, flameSize: 0.105, glowRadius: 2.3, glowAlpha: 0.2, nota: 'parametros das chamas em quadros (folha flame: chama ROXA, 4 quadros, 10 fps)' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 1 tela): o MESMO decalque nunca aparece duas vezes a menos dessa distancia horizontal. footClear = faixa em torno da linha dos pes livre de pecas com volume: caveira, capacete, escudo, espada e costelas so entram em ruaTras e ruaFrente. Pocas e rachaduras de lava, cinza, brasas, runa, mancha, laje, arranhoes, moedas e lascas sao rasos e podem passar sob os pes.',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito por celula (rnd), nunca repete.',
    groups: [
      { id: 'rochaTras', parallax: 1, cell: 0.32, prob: 0.45, seed: 5, yRange: [0.64, 0.665], scale: [0.4, 0.55], flip: true, nota: 'ossos, pedrinhas e graveto na rocha de tras', pool: [['bonefrag', 2], ['pebbles', 2], ['twig', 1], ['ash', 1]] },
      { id: 'ruaTras', parallax: 1, cell: 0.42, prob: 0.7, seed: 13, yRange: [r3(road[0] + 0.022), r3(road[0] + 0.045)], scale: [0.5, 0.66], flip: true, nota: 'pecas com volume na borda de tras da estrada (base acima da faixa dos pes)', pool: [['skull', 2], ['helmet', 2], ['ribs', 2], ['sword', 1], ['shield', 1], ['bones', 2]] },
      { id: 'ruaRasos', parallax: 1, cell: 0.5, prob: 0.8, seed: 3, yRange: [0.782, 0.86], scale: [0.6, 0.78], flip: true, nota: 'pecas rasas grandes na faixa da pisada',
        pool: [['lavapool', 2], ['lavacrack', 3], ['rune', 2], ['scorch', 2], ['slab', 2], ['claws', 2], ['ash', 1]] },
      { id: 'ruaMiudos', parallax: 1, cell: 0.16, prob: 0.75, seed: 7, yRange: [r3(road[0] + 0.022), 0.88], scale: [0.55, 0.8], flip: true, nota: 'miudos rasos: podem ficar sob os pes', pool: [['embers', 3], ['coins', 2], ['pebbles', 3], ['bonefrag', 2], ['shard', 2], ['chain', 1]] },
      { id: 'ruaFrente', parallax: 1, cell: 0.34, prob: 0.8, seed: 17, yRange: [0.86, r3(road[1] - 0.004)], scale: [0.62, 0.82], flip: true, nota: 'frente da estrada (abaixo da faixa dos pes)',
        pool: [['skull', 2], ['bones', 2], ['sword', 1], ['shield', 1], ['helmet', 1], ['lavacrack', 2], ['scorch', 1], ['chain', 2], ['coins', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi: espinheiro e capim vermelho balancam (skew); ossos, obsidiana e pedra de lava ficam parados',
    pool: [
      { sprite: 'thorn', h: [0.14, 0.17], sway: true, weight: 3 }, { sprite: 'redgrass', h: [0.13, 0.16], sway: true, weight: 3 },
      { sprite: 'bonepile', h: [0.08, 0.1], weight: 1 }, { sprite: 'obsid', h: [0.12, 0.14], weight: 1 }, { sprite: 'lavarock', h: [0.1, 0.12], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 26, yRange: [0.3, 0.96], rgb: '255,190,90', glowRgb: '255,80,20', radius: [0.0012, 0.0028], parallax: 0.55, drift: 0.02, blend: 'lighter', nota: 'brasas subindo e piscando' },
  bottomShade: { from: 0.94, alpha: 0.32, rgb: '20,6,6' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: {
    cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', moon: 'moon.webp', bat: { file: 'bat.webp', frames: 6, fps: 12 }, flame: { file: 'flame.webp', frames: 4, fps: 10 },
    wyvern: 'wyvern.webp', wing: 'wing.webp', gargoyle: 'gargoyle.webp', crow: 'crow.webp', boat: 'boat.webp', ghost: 'ghost.webp', fspirit: 'fspirit.webp', cage: 'cage.webp',
    mFalls: 'mFalls.webp', mRiver: 'mRiver.webp', mJaw: 'mJaw.webp', mEyes: 'mEyes.webp', mTowerW: 'mTowerW.webp', mCryst: 'mCryst.webp', mForge: 'mForge.webp', mLavaP: 'mLavaP.webp',
    brazier: 'brazier.webp', lantern: 'lantern.webp', imp: { file: 'imp.webp', frames: 5, fps: 2 }, batsit: { file: 'batsit.webp', frames: 2, fps: 0.9 }, perch: 'perch.webp', cat: 'cat.webp',
    cauldron: 'cauldron.webp', ventrock: 'ventrock.webp', lavabasin: 'lavabasin.webp', thorn: 'thorn.webp', tomb: 'tomb.webp', fence: 'fence.webp', bonesign: 'bonesign.webp', gstatue: 'gstatue.webp', chest: 'chest.webp', gallows: 'gallows.webp',
    redgrass: 'redgrass.webp', bonepile: 'bonepile.webp', obsid: 'obsid.webp', lavarock: 'lavarock.webp'
  },
  animated: [
    { id: 'ceu_deriva', tipo: 'ceu de brasa derivando devagar' }, { id: 'nuvens_2_vel', tipo: 'nuvens de cinza em 2 velocidades' }, { id: 'lua', tipo: 'lua de sangue fixa balancando de leve' },
    { id: 'serpe', tipo: 'serpe cruzando o ceu batendo 2 asas, sobe e desce' }, { id: 'gargula_corvo', tipo: 'gargula e corvo voando atras das montanhas' },
    { id: 'morcegos', tipo: '2 bandos de morcegos batendo asas (quadros)' },
    { id: 'cascatas_lava', tipo: 'lava descendo pelas 2 cascatas distantes' }, { id: 'rio_lava', tipo: 'rio de lava brilhando em ondas, com borbulhas' },
    { id: 'barqueiro', tipo: 'barco do barqueiro navegando no rio de lava' }, { id: 'bruma', tipo: 'bruma vermelha deslizando' },
    { id: 'fantasma', tipo: 'fantasma flutuando atras das estruturas' }, { id: 'espirito_fogo', tipo: 'espirito de fogo flutuando com rastro de fagulhas' },
    { id: 'gaiola', tipo: 'gaiola balancando na forca' }, { id: 'fogo_roxo', tipo: 'fogo roxo no braseiro do pedestal, com brilho e fagulhas' },
    { id: 'caveira', tipo: 'olhos da caveira pulsando e lava escorrendo da mandibula' }, { id: 'janelas_torre', tipo: 'janelas da torre tremeluzindo' },
    { id: 'cristais', tipo: 'brilho roxo correndo pelos cristais' }, { id: 'forja', tipo: 'boca da forja tremendo, faiscas na bigorna e fumaca com contorno na chamine' },
    { id: 'pilar', tipo: 'lava descendo pela rachadura do pilar, brasas e vapor na base' },
    { id: 'braseiros', tipo: 'braseiros com 3 chamas roxas em quadros + brilho + faiscas' }, { id: 'lanterna', tipo: 'lanterna da estaca com brilho pulsando' },
    { id: 'diabrete', tipo: 'diabrete: senta, anda alguns passos (4 poses), senta e volta' }, { id: 'morcego_colunas', tipo: 'morcego que pula de uma coluna quebrada a outra batendo asas' },
    { id: 'gato_preto', tipo: 'gato preto mexendo cauda e cabeca' }, { id: 'caldeirao_respiros', tipo: 'caldeirao com vapor roxo, respiro de fumaca e bacia de lava borbulhando' },
    { id: 'brasas', tipo: 'brasas subindo e piscando' }, { id: 'primeiro_plano', tipo: 'espinheiro e capim vermelho balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
const used = new Set(['meta.json', m.hero.file, m.decals.file].concat(...m.layers.map(l => (l.files || [l.file]).concat(l.filesLow || [])), Object.values(m.sprites).map(v => typeof v === 'string' ? v : v.file)));
const have = fs.readdirSync(OUT); console.log('faltando:', [...used].filter(f => !have.includes(f)).join(' ') || '-', '| sobrando:', have.filter(f => !used.has(f)).join(' ') || '-');
console.log('meta.json', s.length, 'bytes', 'far', r3(farTop), FARB, 'rio', riverY, 'rua', road, 'guias', curb, 'mid', MID.height, 'midW', r3(midW), 'fx', m.fx.length, 'actors', m.actors.length);
