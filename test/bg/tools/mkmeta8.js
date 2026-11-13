// Gera assets/bg/v2/era8/meta.json a partir de work/info.json (saida do build8.js).
// uso: node mkmeta8.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta8.js --info tools/info.era8.json <pastaSaida>)
// Era 8 (Celestial): so blocos que o scene.js ja tem (actors sky/far/mid com parts flap e smoke, props com tilt, sunRays, fx flow/glow/plume/embers,
// roadside fire/lantern/pacer/hopper/critter/vent/sway). O scene.js NAO muda por causa desta era.
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
const PW = 1584, PH = 1584 * info.midRaw[1] / info.midRaw[0], P = (x, y) => ({ x: r4(x / PW), y: r4(y / PH) });
const FPH = 1584 * info.far[1] / info.far[0], FP = (x, y) => ({ x: r4(x / PW), y: r4(y / FPH) });
const A = l => [l, []], B = l => [[], l];
const SEA = 0.624, seaY = r4(farTop + SEA * FARH);   // topo do mar de nuvens no far (medido na previa de 1584)
const MK = info.masks, mrect = n => MK[n].rect.map(r4);
const shine = (id, mask, o) => Object.assign({ id, type: 'flow', layer: MK[mask].src === 'far' ? 'far' : 'mid', tile: MK[mask].tile, mask, rect: mrect(mask), rgb: '255,240,180', blend: 'lighter', maxScale: 1.5, bands: [] }, o);
const SPARK = { rgb: '255,245,200', glowRgb: '255,200,80' };
const m = {
  version: 2, era: 8, nome: 'Era Celestial - palacio dourado sobre montanhas de nuvem, cascatas douradas, mar de nuvens, gazebo, chafariz, sino, portao dourado, harpa e estrada de marmore',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0 a 7). size = lado do quadro 256 em SH. footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.26, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#fff2cc', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.004, top: 0 }, info.sky, SKYH), { nota: 'ceu procedural: azul claro -> creme -> brilho dourado no horizonte, com veios claros. Repete em si mesmo' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'mirror', parallax: 0.06, drift: 0, offset: 0.13, bottom: FARB }, info.far, FARH), { seaY, nota: 'palacio de cupulas douradas e templos de marmore sobre montanhas de nuvem, 2 cascatas douradas, MAR DE NUVENS embaixo (seaY = topo, em SH): o navio dourado navega nele (actors slot far). Ladrilho ESPELHADO. A base some (alfa)' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midRaw, MID.height), { nota: 'A: gazebo de colunas douradas, anjo com trombeta no pedestal, arvore dourada, chafariz de 3 bacias (agua azul translucida), torre com SINO (sprite que balanca). B: portao dourado, templo, harpa gigante, ponte arco-iris, orbe dourado com anel. Nuvens creme na base de cada estrutura. Nos vaos aparecem o mar de nuvens e o palacio' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, nota: 'chao de nuvem fofa com florzinhas (borda de cima esmaecida sobre o pe das estruturas), friso dourado, estrada de lajes de marmore creme com juntas douradas (roadY), friso, nuvem. Os pes (groundY) caem nas lajes' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky', 'clouds: SOL fixo; nuvens de borda dourada em 2 velocidades', 'actors(sky): baleia celeste, PEGASO batendo 2 asas, fenix com rastro de brilho', 'birds (pombas)', 'far', 'actors(far): navio dourado no mar de nuvens', 'farFill (transparente)', 'fx(far): ouro descendo nas 2 cascatas', 'haze', 'fog[0]', 'sunRays: raios do sol', 'actors(mid): QUERUBIM batendo as asas atras das estruturas', 'mid', 'props(mid): sino balancando', 'fx(mid): agua do chafariz descendo, brilhos do chafariz, cupula, portao, orbe e arco-iris, folhas douradas caindo da arvore', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes (brilhos dourados)', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), hex(info.skyHi), hex(info.skyMid), hex(info.skyLow), hex(info.skyBottom), hex(info.skyBottom)], ground: [[curb[0], '#f4f6fa'], [road[0], '#e2b25a'], [road[1], '#f3e6d0'], [curb[1], '#e2b25a'], [1.001, '#f4f6fa']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Deterministico por celula: nao depende da rolagem.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era' },
  props: [
    { id: 'sino', sprite: 'bell', layer: 'mid', tile: 0, front: true, rect: info.cuts.bell.rect.map(r4), tilt: { deg: 14, period: 2.6, phase: 0, pivot: [0.5, 0.02] } }
  ],
  propsNota: 'Sprites soltos presos a uma camada (rect = fracao do arquivo da camada). SINO da torre: recortado da arte (atras dele o arco e vazado), balancando 14 graus pendurado na trave pela alca (pivot no topo).',
  sunRays: { origin: [0.09, 0.07], length: 0.62, count: 5, angle0: 0.25, angleStep: 0.3, halfWidth: [0.035, 0.06], alpha: [0.04, 0.11], pulse: 0.9, rgb: '255,236,170', blend: 'lighter', nota: 'raios dourados saindo do sol fixo no canto de cima, abrindo para baixo e para a direita, pulsando' },
  actors: [
    { id: 'baleia', slot: 'sky', sprite: 'whale', x: 1.2, y: 0.14, w: 0.2, parallax: 0.02, drift: -0.025, loop: 3.2, bob: 0.01, bobF: 0.7 },
    { id: 'pegaso', slot: 'sky', sprite: 'pegasus', x: 0.2, y: 0.07, w: 0.15, parallax: 0.03, drift: -0.07, loop: 2.4, bob: 0.012, bobF: 1.6, parts: [
      { sprite: 'wingP', x: 0.4, y: 0.34, w: 0.7, period: 1.0, flap: true, ang: 0, back: true, phase: 1.1 }, { sprite: 'wingP', x: 0.46, y: 0.32, w: 0.7, period: 1.0, flap: true, ang: 0 }] },
    { id: 'fenix', slot: 'sky', sprite: 'phoenix', x: 1.9, y: 0.03, w: 0.07, parallax: 0.025, drift: -0.1, loop: 2.8, bob: 0.008, bobF: 2.4,
      smoke: [{ x: 0.12, y: 0.82, n: 6, life: 0.8, rise: 0.01, wind: -0.035, spread: 0.006, wobble: 0.004, r0: 0.0025, grow: 0.0015, fadeIn: 0.05, alpha: 0.8, light: '#fff3b8', dark: '#f0b84a', hot: '#ffffff', hotDark: '#ffe08a', hotUntil: 0.3, fade: 0.5, seed: 67 }] },
    { id: 'navio_dourado', slot: 'far', sprite: 'ship', x: 0.3, y: r4(seaY + 0.006 - hOf('ship', 0.09)), w: 0.09, parallax: 0.06, drift: -0.03, loop: 2.2, bob: 0.003, bobF: 1.1 },
    { id: 'querubim', slot: 'mid', sprite: 'cherub', x: 0.8, y: 0.3, w: 0.06, parallax: 0.3, drift: -0.03, loop: 2.0, bob: 0.014, bobF: 1.9, parts: [
      { sprite: 'wingC', x: 0.36, y: 0.42, w: 0.62, period: 0.5, flap: true, ang: 0, back: true, phase: 0.8 }, { sprite: 'wingC', x: 0.42, y: 0.4, w: 0.62, period: 0.5, flap: true, ang: 0 }] }
  ],
  actorsNota: 'Sprites que cruzam a cena (x, y, w em SH; deslocamento = scroll*parallax + t*drift; da a volta a cada loop SH), com pecas presas (x, y = centro em fracao do corpo; w = fracao da largura do corpo; period = s por volta; flap = achata em cosseno). PEGASO e QUERUBIM: 2 asas (uma atras do corpo, defasada) batendo em torno da linha do ombro (o sprite da asa tem a metade de baixo vazia para o centro cair no ombro). BALEIA CELESTE nada devagar no ceu, atras do palacio; FENIX com rastro de brilho. NAVIO DOURADO com o casco 0,006 SH dentro do mar de nuvens, balancando de leve.',
  fx: [
    shine('ouro_cascata_esq', 'mFallL', { loop: 2, frames: 30, base: 0.1, pulse: 0.3, pulseCycles: 1, bands: [{ len: 0.05, cycles: 2, alpha: 0.8, peak: 0.6 }], nota: 'ouro escorrendo na cascata da esquerda' }),
    shine('ouro_cascata_dir', 'mFallR', { loop: 2.3, frames: 34, base: 0.1, pulse: 0.3, pulseCycles: 1, bands: [{ len: 0.05, cycles: 2, alpha: 0.8, peak: 0.6 }] }),
    shine('agua_chafariz', 'mWater', { loop: 1.4, frames: 28, base: 0.12, pulse: 0.3, pulseCycles: 1, rgb: '235,250,255', bands: [{ len: 0.025, cycles: 3, alpha: 0.75, peak: 0.6 }], nota: 'agua descendo pelas bacias do chafariz' }),
    shine('cupula_gazebo', 'mDome', { loop: 4.5, frames: 36, base: 0.05, pulse: 0.6, pulseCycles: 1, bands: [{ len: 0.06, cycles: 1, alpha: 0.5 }], nota: 'brilho correndo pela cupula dourada' }),
    shine('portao_dourado', 'mGate', { loop: 5, frames: 40, base: 0.04, pulse: 0.5, pulseCycles: 1, bands: [{ len: 0.08, cycles: 1, alpha: 0.45 }], nota: 'faixa de brilho descendo pelo portao' }),
    shine('orbe', 'mOrb', { loop: 3, frames: 36, base: 0.18, pulse: 0.8, pulseCycles: 2, nota: 'orbe dourado pulsando' }),
    shine('arco_iris', 'mRainb', { loop: 3.6, frames: 36, base: 0.08, pulse: 0.8, pulseCycles: 1, rgb: '255,255,255', bands: [{ len: 0.04, cycles: 2, alpha: 0.35 }], nota: 'arco-iris cintilando' }),
    { id: 'orbe_brilho', type: 'glow', layer: 'mid', anchors: B([P(1430, 200)]), radius: 0.09, alpha: 0.3, pulse: 2.4, rgb: ['255,250,210', '255,220,120', '255,180,40'] },
    { id: 'faiscas_chafariz', type: 'embers', layer: 'mid', anchors: A([P(1160, 205), P(1160, 300)]), n: 5, life: 1.1, speed: 0.03, angle: 2.4, gravity: 0.04, wind: 0, wobble: 0.004, radius: [0.001, 0.0018], rgb: SPARK.rgb, glowRgb: '160,220,255', seed: 101 },
    { id: 'folhas_douradas', type: 'embers', layer: 'mid', anchors: A([P(780, 230), P(960, 260), P(870, 150)]), n: 3, life: 3.2, speed: 0.008, angle: 1.0, gravity: 0.012, wind: -0.006, wobble: 0.02, radius: [0.0018, 0.003], rgb: '255,215,90', glowRgb: '255,190,60', seed: 103, nota: 'folhas/brilhos dourados caindo da copa, balancando' },
    { id: 'brilho_anjo', type: 'glow', layer: 'mid', anchors: A([P(640, 145), P(232, 100)]), radius: 0.03, alpha: 0.35, pulse: 3.1, rgb: ['255,255,230', '255,230,150', '255,200,80'] }
  ],
  fxNota: 'Efeitos presos a uma camada. flow: laco de loop segundos em frames quadros; cada quadro = mascara (os proprios pixels dourados / da agua / do arco-iris da arte, recortados pelo build8) pintada com rgb, faixas descendo (bands) e alfa base*(1+pulse*sin(2pi*fase*pulseCycles)). glow: brilho radial aditivo. embers: brilhos do chafariz e folhas douradas caindo.',
  haze: { y: [0.2, FARB], rgb: '255,240,215', alpha: 0.25 },
  fog: [{ y: 0.455, height: 0.12, parallax: 0.1, drift: 0.012, alpha: 0.45 }, { y: 0.548, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.3 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '255,250,240', alpha: 0.32, nota: 'textura procedural repetida na horizontal. fog[0] = bruma clara na base do palacio; fog[1] = nevoa baixa no pe das estruturas' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. Grupo 1 FIXO (parallax 0): sol. Grupos 2 e 3: nuvens de borda dourada em 2 velocidades.',
    groups: [
      { parallax: 0, drift: 0, alpha: 1, period: 3, items: [{ s: 'sun', x: 0.03, y: 0.01, w: 0.12 }] },
      { parallax: 0.02, drift: 0.008, alpha: 0.95, period: 2.4, items: [{ s: 'cloud1', x: 0.2, y: 0.13, w: 0.26 }, { s: 'cloud3', x: 1.3, y: 0.05, w: 0.3 }] },
      { parallax: 0.04, drift: 0.018, alpha: 1, period: 2.8, items: [{ s: 'cloud2', x: 0.75, y: 0.19, w: 0.22 }, { s: 'cloud1', x: 1.95, y: 0.08, w: 0.2 }] }
    ]
  },
  birds: { sprite: 'dove', flocks: [{ period: 13, duration: 7, y: 0.03, size: 0.042, n: 3, phase: 2, alpha: 1 }, { period: 21, duration: 11, y: 0.008, size: 0.032, n: 4, phase: 10, alpha: 0.95 }], nota: 'pombas brancas (6 quadros de 4 poses): cruzam da esquerda para a direita no alto do ceu; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'nao usado nesta era; mantido pelo formato' },
  roadside: {
    parallax: 1, cell: 0.34, prob: 0.92, seed: 11, minGap: 0.05, sameTypeGap: 0.62, reach: 0.75, baseY: [0.668, 0.676], nota: 'objetos na nuvem de tras, atras do heroi; sorteio por celula igual ao dos decalques. Animados e parados disputam o MESMO sorteio (minGap, sameTypeGap 0.62 SH). POSTE COM ORBE DE LUZ (lantern): brilho pulsando. BRASEIRO DOURADO (fire): 3 chamas DOURADAS em quadros + brilho + faiscas. CORDEIRO (pacer): senta, anda 0.09 SH em 4 passos, senta virado e volta. POMBA (hopper): duas colunas quebradas a 0.13 SH; pousa numa (em pe / bicando), voa ate a outra e volta. GATO COM ASAS (critter). FONTE PEQUENA (vent): borrifos de agua. SINO NO POSTE, ARBUSTO E LIRIOS balancam.',
    pool: [
      { type: 'lantern', h: [0.24, 0.25], weight: 4 },
      { type: 'fire', sprite: 'brazier', h: [0.08, 0.085], weight: 2, fire: { y: 0.82, size: 0.8, glow: 1.6, glowAlpha: 0.1, sparks: { n: 7, life: 1.4, spread: 0.5, wobble: 0.3, wind: 0.5, rise: 2.4, radius: 0.034 } } },
      { type: 'pacer', sprite: 'lamb', h: [0.075, 0.08], weight: 3, span: 0.1, walk: { dist: 0.09, period: 7, split: [0.3, 0.5, 0.8], sit: 1, steps: 8, turn: 0.3, pause: 0.5 } },
      { type: 'hopper', sprite: 'dovesit', h: [r4(0.07 * info.dove.frame[1] / info.dove.postH), r4(0.074 * info.dove.frame[1] / info.dove.postH)], weight: 2, span: 0.13, hop: { post: 'perch', dx: 0.13, period: 5, flight: 0.7, turn: 0.25, fly: 'dove', size: 0.05, height: 0.045, cx: 0.5, cy: r4(info.dove.cy) } },
      { type: 'critter', sprite: 'wcat', h: [0.065, 0.07], weight: 2, tail: { x: 0.3, f: 3, k: 4, amp: 0.1 }, head: { x: 0.72, f: 1.2, amp: 0.03 } },
      { type: 'vent', sprite: 'basin', h: [0.07, 0.075], weight: 2, vent: { y: 0.92, period: 2.2, duration: 1.4, idle: 0.4, n: 6, life: 0.9, rise: 0.05, wind: 0, spread: 0.018, wobble: 0.004, r0: 0.0025, grow: 0.004, fadeIn: 0.05, alpha: 0.75, light: '#f2fbff', dark: '#9fd4f0', fade: 0.6, seed: 105 } },
      { type: 'sprite', sprite: 'bellpost', h: [0.12, 0.13], weight: 1, sway: true, swayAmp: 0.2 }, { type: 'sprite', sprite: 'gbush', h: [0.08, 0.09], weight: 1, sway: true, swayAmp: 0.4 },
      { type: 'sprite', sprite: 'bench', h: [0.075, 0.08], weight: 1 }, { type: 'sprite', sprite: 'harp', h: [0.12, 0.13], weight: 1 }, { type: 'sprite', sprite: 'astatue', h: [0.14, 0.15], weight: 1 },
      { type: 'sprite', sprite: 'chest', h: [0.065, 0.07], weight: 1 }, { type: 'sprite', sprite: 'roses', h: [0.09, 0.095], weight: 1 }, { type: 'sprite', sprite: 'lectern', h: [0.1, 0.105], weight: 1 }, { type: 'sprite', sprite: 'lyre', h: [0.09, 0.095], weight: 1 }]
  },
  lantern: { glowY: 0.9, glowRadius: 0.2, glowAlpha: 0.3, nota: 'brilho do orbe no alto do poste: centro a glowY da altura (de baixo); pulsa' },
  torch: { flameY: 0.7, flameSize: 0.105, glowRadius: 2.3, glowAlpha: 0.2, nota: 'parametros das chamas em quadros (folha flame: chama DOURADA, 4 quadros, 10 fps)' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 1 tela): o MESMO decalque nunca aparece duas vezes a menos dessa distancia. footClear = faixa em torno da linha dos pes livre de pecas com volume: trombeta, pergaminho, sino, moedas, gema e lasca de marmore so entram em ruaTras e ruaFrente. Penas, petalas, folhas, estrela, poca de luz, runa, aureola, rachadura e pedrinhas sao rasos e podem passar sob os pes.',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito por celula (rnd), nunca repete.',
    groups: [
      { id: 'nuvemTras', parallax: 1, cell: 0.32, prob: 0.45, seed: 5, yRange: [0.64, 0.665], scale: [0.4, 0.55], flip: true, nota: 'flores, petalas e folhas na nuvem de tras', pool: [['flower', 2], ['petals', 2], ['leaf', 1], ['puff', 1]] },
      { id: 'ruaTras', parallax: 1, cell: 0.42, prob: 0.7, seed: 13, yRange: [r3(road[0] + 0.022), r3(road[0] + 0.045)], scale: [0.5, 0.66], flip: true, nota: 'pecas com volume na borda de tras da estrada', pool: [['trumpet', 1], ['scroll', 2], ['bell', 2], ['coins', 2], ['gem', 1], ['marble', 2]] },
      { id: 'ruaRasos', parallax: 1, cell: 0.5, prob: 0.8, seed: 3, yRange: [0.782, 0.86], scale: [0.6, 0.78], flip: true, nota: 'pecas rasas grandes na faixa da pisada', pool: [['rune', 2], ['lightpool', 3], ['halo', 2], ['crack', 1], ['olive', 2], ['leaves', 2]] },
      { id: 'ruaMiudos', parallax: 1, cell: 0.16, prob: 0.75, seed: 7, yRange: [r3(road[0] + 0.022), 0.88], scale: [0.55, 0.8], flip: true, nota: 'miudos rasos: podem ficar sob os pes', pool: [['feather', 3], ['gfeather', 2], ['star', 3], ['petals', 2], ['pebbles', 2], ['leaf', 2]] },
      { id: 'ruaFrente', parallax: 1, cell: 0.34, prob: 0.8, seed: 17, yRange: [0.86, r3(road[1] - 0.004)], scale: [0.62, 0.82], flip: true, nota: 'frente da estrada (abaixo da faixa dos pes)', pool: [['coins', 2], ['scroll', 1], ['trumpet', 1], ['bell', 1], ['lightpool', 2], ['halo', 1], ['feather', 2], ['marble', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi: lirios, capim dourado e tufo de nuvem balancam (skew); arbusto dourado e cristais de luz ficam parados',
    pool: [
      { sprite: 'lilies', h: [0.14, 0.17], sway: true, weight: 3 }, { sprite: 'ggrass', h: [0.13, 0.16], sway: true, weight: 3 }, { sprite: 'cloudtuft', h: [0.08, 0.1], sway: true, weight: 1 },
      { sprite: 'gbush', h: [0.11, 0.13], weight: 1 }, { sprite: 'lcrystal', h: [0.12, 0.14], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 26, yRange: [0.3, 0.96], rgb: '255,246,200', glowRgb: '255,210,110', radius: [0.0012, 0.0028], parallax: 0.55, drift: 0.016, blend: 'lighter', nota: 'brilhos dourados flutuando e piscando' },
  bottomShade: { from: 0.94, alpha: 0.18, rgb: '120,90,40' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: {
    cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', sun: 'sun.webp', dove: { file: 'dove.webp', frames: 6, fps: 12 }, flame: { file: 'flame.webp', frames: 4, fps: 10 },
    whale: 'whale.webp', pegasus: 'pegasus.webp', wingP: 'wingP.webp', phoenix: 'phoenix.webp', ship: 'ship.webp', cherub: 'cherub.webp', wingC: 'wingC.webp', bell: 'bell.webp',
    mFallL: 'mFallL.webp', mFallR: 'mFallR.webp', mWater: 'mWater.webp', mDome: 'mDome.webp', mGate: 'mGate.webp', mOrb: 'mOrb.webp', mRainb: 'mRainb.webp',
    lantern: 'lantern.webp', brazier: 'brazier.webp', lamb: { file: 'lamb.webp', frames: 5, fps: 2 }, dovesit: { file: 'dovesit.webp', frames: 2, fps: 0.9 }, perch: 'perch.webp', wcat: 'wcat.webp', basin: 'basin.webp',
    bellpost: 'bellpost.webp', gbush: 'gbush.webp', bench: 'bench.webp', harp: 'harp.webp', astatue: 'astatue.webp', chest: 'chest.webp', roses: 'roses.webp', lectern: 'lectern.webp', lyre: 'lyre.webp',
    lilies: 'lilies.webp', ggrass: 'ggrass.webp', cloudtuft: 'cloudtuft.webp', lcrystal: 'lcrystal.webp'
  },
  animated: [
    { id: 'ceu_deriva', tipo: 'ceu derivando devagar' }, { id: 'nuvens_2_vel', tipo: 'nuvens de borda dourada em 2 velocidades' }, { id: 'sol_raios', tipo: 'sol fixo com 5 raios dourados pulsando' },
    { id: 'baleia', tipo: 'baleia celeste nadando devagar no ceu' }, { id: 'pegaso', tipo: 'pegaso cruzando o ceu batendo 2 asas' }, { id: 'fenix', tipo: 'fenix voando com rastro de brilho' },
    { id: 'pombas', tipo: '2 bandos de pombas batendo asas (quadros)' }, { id: 'cascatas', tipo: 'ouro escorrendo nas 2 cascatas distantes' }, { id: 'navio', tipo: 'navio dourado navegando no mar de nuvens' },
    { id: 'bruma', tipo: 'bruma clara deslizando' }, { id: 'querubim', tipo: 'querubim voando atras das estruturas batendo as asinhas' }, { id: 'sino', tipo: 'sino da torre balancando' },
    { id: 'chafariz', tipo: 'agua descendo pelas 3 bacias, com brilhos' }, { id: 'brilhos_dourados', tipo: 'brilho correndo na cupula do gazebo e no portao; orbe pulsando; arco-iris cintilando' },
    { id: 'folhas_douradas', tipo: 'folhas douradas caindo da arvore' }, { id: 'brilho_anjo', tipo: 'brilho na trombeta do anjo e no topo da cupula' },
    { id: 'postes_orbe', tipo: 'postes com orbe de luz pulsando' }, { id: 'braseiros', tipo: 'braseiros dourados com 3 chamas em quadros' }, { id: 'cordeiro', tipo: 'cordeiro: senta, anda alguns passos (4 poses), vira e volta' },
    { id: 'pomba_colunas', tipo: 'pomba que pula de uma coluna quebrada a outra batendo asas' }, { id: 'gato_asas', tipo: 'gato com asas mexendo cauda e cabeca' }, { id: 'fonte_pequena', tipo: 'fonte pequena borrifando' },
    { id: 'balanco', tipo: 'sino no poste e arbusto dourado balancando' }, { id: 'brilhos', tipo: 'brilhos dourados flutuando' }, { id: 'primeiro_plano', tipo: 'lirios, capim dourado e tufo de nuvem balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha clara nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
const used = new Set(['meta.json', m.hero.file, m.decals.file].concat(...m.layers.map(l => (l.files || [l.file]).concat(l.filesLow || [])), Object.values(m.sprites).map(v => typeof v === 'string' ? v : v.file)));
const have = fs.readdirSync(OUT); console.log('faltando:', [...used].filter(f => !have.includes(f)).join(' ') || '-', '| sobrando:', have.filter(f => !used.has(f) && !/^preview_sheet/.test(f)).join(' ') || '-');
console.log('meta.json', s.length, 'bytes', 'far', r3(farTop), FARB, 'mar', seaY, 'rua', road, 'guias', curb, 'mid', MID.height, 'midW', r3(midW), 'fx', m.fx.length, 'actors', m.actors.length);
