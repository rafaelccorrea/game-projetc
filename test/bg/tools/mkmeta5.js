// Gera assets/bg/v2/era5/meta.json a partir de work/info.json (saida do build5.js).
// uso: node mkmeta5.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta5.js --info tools/info.era5.json <pastaSaida>)
// Era 5 (Moderna): usa os blocos opcionais do scene.js (rotors com flap, actors nos slots far e mid com tile/parts/flap, roadside pacer/hopper, fx flow/glow/plume).
const fs = require('fs');
const infoFile = process.argv[2] === '--info' ? process.argv[3] : process.argv[2] + '/work/info.json';
const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
const OUT = process.argv[process.argv[2] === '--info' ? 4 : 3];
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const L = (id, o, px, height) => Object.assign({ id }, o, { px, height, repeatWidth: r3(height * px[0] / px[1] * (o.tile === 'repeat' ? 1 : 2)) });
const G = { top: 0.60, height: 0.408 }, SKYH = 0.62, FARH = 0.5, FARB = 0.565, MID = { bottom: 0.622, height: r3(info.midRaw[1] * 0.0005) };
const gy = f => r3(G.top + f * G.height), road = info.road.map(gy), curb = info.curb.map(gy), line = info.line.map(gy);
const farTop = FARB - FARH, midW = MID.height * info.midA[0] / info.midA[1], farW = FARH * info.far[0] / info.far[1];
const hex = c => '#' + c.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const S = info.spr, hOf = (n, w) => w * S[n][1] / S[n][0];
// ---- ancoras medidas nas previas de 1584 px de largura dos dois trechos do mid (fracao x,y de cada arquivo)
const PW = 1584, PH = 1584 * info.midA[1] / info.midA[0], P = (x, y) => ({ x: r4(x / PW), y: r4(y / PH) });
const WIN_A = [P(518, 325), P(552, 325), P(630, 325), P(697, 322), P(765, 325)], SEARCH = [P(1343, 440)], LAMP = [[891.3, 216.5], [891.3, 254.6], [891.3, 293.7]], LAMPR = 12.2;
const FLAGS_A = [Object.assign(P(1450, 120), { flag: 'flagR' })], FLAGS_B = [];
const RUIN_TOP = [P(655, 80)], RUBBLE = [P(600, 562)], DINER_WIN = [P(1075, 530)], SIGN = [998, 335.3, 109.3, 52.3], FAN = { x: 1178.6, y: 379.1, r: 22.8 }, MAST = { x: 1478.7, y: 101 };
// ---- far: fracoes do arquivo far.webp
const DECK = 0.5596, BEACON = [{ x: 0.3274, y: 0.06 }], FAR_SMOKE = [{ x: 0.2526, y: 0.118 }, { x: 0.697, y: 0.31 }];
const deckY = r4(farTop + DECK * FARH), ROADY = 0.592;
// ---- fumaca com contorno: o mesmo plume duas vezes (mesma semente = mesmas posicoes). 1o passe: discos um pouco maiores na cor do traco; 2o passe: os 2 tons por cima.
const OUTL = '#2e3440', RIM = 0.0023;
const pair = (id, base, fillC, alphaO, fadeO, rim) => [
  Object.assign({ id: id + '_traco', type: 'plume' }, base, { r0: r4(base.r0 + (rim || RIM)), light: OUTL, dark: OUTL, alpha: alphaO, fade: fadeO }),
  Object.assign({ id: id, type: 'plume' }, base, fillC)];
const SMOKE = { light: '#8f96a0', dark: '#5a606b', alpha: 0.95, fade: 0.84 }, DUST = { light: '#d9d6cf', dark: '#aaa69f', alpha: 0.9, fade: 0.8 };
const A = l => [l, []], B = l => [[], l];
// ---- veiculos: rodas medidas pelo build (centro e raio em px do recorte); a roda-sprite gira por cima da roda pintada, no periodo da velocidade
const veh = (name, w, speed) => { const v = info.veh[name], big = name === 'truck' || name === 'jeep'; return { w, h: r4(hOf(name, w)), parts: v.wheels.map((q, k) => ({ sprite: big ? 'wheelT' : 'wheel', x: r4(q[0] / v.px[0]), y: r4(q[1] / v.px[1]), w: r4(2 * q[2] * 1.03 / v.px[0]), period: r3(2 * Math.PI * q[2] / v.px[0] * w / speed), phase: r3(k * 1.9 % 6.28) })) }; };
const car = (id, name, slot, x, w, baseY, parallax, speed, loop) => { const v = veh(name, w, speed); return { id, slot, sprite: name, x, y: r4(baseY - v.h), w, parallax, drift: -speed, loop, parts: v.parts }; };
const FS = 0.07, MS = 0.17;   // velocidade (SH/s) em relacao a camada: viaduto / rua de tras
const lampRect = k => [r4((LAMP[k][0] - LAMPR) / PW), r4((LAMP[k][1] - LAMPR) / PH), r4(2 * LAMPR / PW), r4(2 * LAMPR / PH)];
// semaforo: laco de 9 s em 90 quadros. alfa = base*(1+pulse*sin(2pi*fase*ciclos)), limitado a 0..1 pelo canvas:
//   vermelho aceso com sin > 0.2 (fase 0.03-0.47); verde com sin < -0.2 (0.53-0.97); amarelo com meio ciclo de seno (so perto de 0 e de 1): entre o verde e o vermelho.
const lights = [['vermelho', 0, '255,60,50', -5, -5, 1], ['amarelo', 1, '255,205,60', 6, -10.6, 0.5], ['verde', 2, '70,255,120', -5, 5, 1]].map(q => ({ id: 'semaforo_' + q[0], type: 'flow', layer: 'mid', tile: 0, mask: 'lampmask', rect: lampRect(q[1]), rgb: q[2], blend: 'lighter', loop: 9, frames: 90, maxScale: 2, bands: [], base: q[3], pulse: q[4], pulseCycles: q[5] }));
const hel = { w: 0.22 };
const m = {
  version: 2, era: 5, nome: 'Era Moderna - cidade em conflito de dia: torres de vidro, viaduto com transito, predio em ruinas, posto de controle, radar e rua de asfalto',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0 a 4). size = lado do quadro 256 em SH. footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.34, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#c9cdd3', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.005, top: 0 }, info.sky, SKYH), { nota: 'ceu de dia procedural: degrade vertical azul -> bruma clara. Repete em si mesmo' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'mirror', parallax: 0.06, drift: 0, offset: 0.13, bottom: FARB }, info.far, FARH), { deckY, nota: 'horizonte de torres de vidro (algumas destruidas), torre de radio, guindastes e viaduto de concreto de ponta a ponta (o transito roda em cima dele, em actors slot far). Ladrilho ESPELHADO (normal/espelhado): emenda sem fusao. A base some na bruma (alfa)' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midA, MID.height), { nota: 'A: torre de vidro com sacos de areia e barreira, predio de tijolos com escada de incendio e janelas acesas, semaforo, outdoor em trelica, guarita com cancela e mastro. B: ponto de onibus (vidro translucido), predio em ruinas com entulho, entrada do metro, lanchonete com letreiro e ar-condicionado, estacao de radar com mastro. O topo da torre de vidro passa da borda de cima da cena. Nos vaos aparece a rua de tras (actors slot mid) e a cidade distante' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, lineY: line, nota: 'calcada de lajes (borda de cima esmaecida sobre o pe dos predios), guia, asfalto liso (roadY) com faixa dupla amarela continua (lineY), guia, calcada da frente. Os pes (groundY) caem no asfalto liso, acima da faixa amarela' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky', 'clouds: nuvens em 2 velocidades', 'birds (pombos)', 'far', 'actors(far): transito do viaduto (5 veiculos com rodas girando) e helicoptero', 'farFill (transparente)', 'fx(far): farol da torre de radio, fumaca de 2 predios distantes', 'haze', 'fog[0]', 'actors(mid): rua de tras (ladrilho) e 5 veiculos com rodas girando', 'mid', 'rotors(mid): antena de radar girando, helice do ar-condicionado', 'towerFlags (bandeira no mastro da guarita)', 'fx(mid): semaforo trocando, letreiro piscando, janelas, holofote, fumaca das ruinas e do entulho', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), hex(info.skyHi), hex(info.skyMid), hex(info.skyLow), hex(info.skyBottom), hex(info.skyBottom)], ground: [[curb[0], '#aeb6b6'], [road[0], '#d9d2cf'], [road[1], '#42566c'], [curb[1], '#d9d2cf'], [1.001, '#aeb6b6']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Vale entre todos os grupos de decalques juntos; em roadside e fg a caixa e so horizontal. Deterministico por celula: nao depende da rolagem. reach = quanto olhar alem da tela (SH) para achar vizinhos.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era: atras da cidade fica a bruma clara do ceu' },
  rotors: [
    { id: 'antena_radar', sprite: 'dish', layer: 'mid', tile: 1, front: true, flap: true, ang: 1.5708, x: r4(MAST.x / PW), y: r4((MAST.y + 5) / PH - 0.085 / 2 / MID.height), w: r4(0.085 / midW), period: 5, phase: 0.4 },
    { id: 'helice_ar_condicionado', sprite: 'fan', layer: 'mid', tile: 1, front: true, x: r4(FAN.x / PW), y: r4(FAN.y / PH), w: r4(2 * FAN.r * 0.93 / PW), period: 0.9, phase: 0 }
  ],
  rotorsNota: 'Sprites girando presos a uma camada (x, y = fracao do arquivo; w = fracao da largura do arquivo; period = s por volta; phase em rad; front = depois da camada). flap: true = giro em torno do eixo vertical visto de lado: o sprite fica no angulo ang e achata em cosseno (passa por zero e espelha). ANTENA DE RADAR no mastro da estacao (1 volta em 5 s; o sprite esta guardado deitado e ang = 90 graus o poe em pe). HELICE do ar-condicionado da lanchonete: rotacao continua no plano.',
  actors: [
    car('viaduto_sedan', 'sedan', 'far', 0.3, 0.063, deckY, 0.06, FS, 3.2), car('viaduto_onibus', 'bus', 'far', 1.0, 0.14, deckY, 0.06, FS, 3.2), car('viaduto_taxi', 'taxi', 'far', 1.9, 0.063, deckY, 0.06, FS, 3.2), car('viaduto_caminhao', 'truck', 'far', 2.45, 0.1, deckY, 0.06, FS, 3.2), car('viaduto_jipe', 'jeep', 'far', 2.9, 0.055, deckY, 0.06, FS, 3.2),
    { id: 'helicoptero', slot: 'far', sprite: 'heli', x: 0.4, y: 0.022, w: hel.w, parallax: 0.03, drift: -0.05, loop: 2.6, bob: 0.006, bobF: 0.9, parts: [
      { sprite: 'rotor', x: 0.655, y: 0.065, w: r4(1.08 * S.rotor[0] / S.rotor[1]), period: 0.3, flap: true, ang: 1.5708 },
      { sprite: 'trotor', x: 0.022, y: 0.17, w: 0.085, period: 0.22 }] },
    { id: 'rua_de_tras', slot: 'mid', sprite: 'backroad', tile: true, x: 0, y: r4(ROADY - 0.02), w: 0.36, parallax: 0.38, drift: 0, loop: 0.36 },
    car('rua_caminhao', 'truck', 'mid', 0, 0.4, ROADY, 0.38, MS, 5.6), car('rua_jipe', 'jeep', 'mid', 0.62, 0.2, ROADY, 0.38, MS, 5.6), car('rua_onibus', 'bus', 'mid', 2.0, 0.5, ROADY, 0.38, MS, 5.6), car('rua_taxi', 'taxi', 'mid', 3.3, 0.25, ROADY, 0.38, MS, 5.6), car('rua_sedan', 'sedan', 'mid', 4.4, 0.25, ROADY, 0.38, MS, 5.6)
  ],
  actorsNota: 'Sprites que cruzam a cena (x, y, w em SH; deslocamento = scroll*parallax + t*drift; da a volta a cada loop SH), com pecas presas (x, y = centro em fracao do corpo; w = fracao da largura do corpo; period = s por volta; flap = peca vista de lado, achata em cosseno no angulo ang). slot far = depois da camada far: TRANSITO DO VIADUTO (5 veiculos, todos na mesma velocidade para nunca se atravessarem; a base das rodas fica na pista, logo atras da mureta) e HELICOPTERO (rotor principal de perfil batendo, rotor de cauda girando, sobe e desce de leve). slot mid = antes da camada mid: RUA DE TRAS (tile: true = faixa de guia + asfalto repetida, presa aos predios) e 5 veiculos que passam por tras dos predios e aparecem nos vaos, com a base das rodas no asfalto; rodas-sprite girando no periodo da velocidade.',
  fx: [
    { id: 'farol_torre_radio', type: 'glow', layer: 'far', anchors: [BEACON], radius: 0.012, alpha: 0.75, pulse: 5.5, rgb: ['255,120,110', '255,50,40', '255,0,0'], nota: 'luz vermelha no topo da torre de radio' }
  ].concat(
    pair('fumaca_cidade', { layer: 'far', anchors: [FAR_SMOKE], n: 7, life: 8, rise: 0.11, wind: -0.07, spread: 0.014, wobble: 0.007, r0: 0.005, grow: 0.016, fadeIn: 0.06, seed: 77, margin: 0.25 }, { light: '#9aa3ad', dark: '#6b737d', alpha: 0.8, fade: 0.8 }, 0.62, 0.76, 0.0016),
    [
      { id: 'janelas_predio', type: 'glow', layer: 'mid', anchors: A(WIN_A), radius: 0.03, alpha: 0.2, pulse: 3.1, rgb: ['255,226,150', '255,190,90', '255,150,40'], nota: 'janelas acesas do predio de tijolos tremeluzindo' },
      { id: 'holofote_guarita', type: 'glow', layer: 'mid', anchors: A(SEARCH), radius: 0.035, alpha: 0.32, pulse: 2.2, rgb: ['245,250,255', '190,220,255', '120,170,255'] },
      { id: 'vitrine_lanchonete', type: 'glow', layer: 'mid', anchors: B(DINER_WIN), radius: 0.07, alpha: 0.16, pulse: 1.7, rgb: ['255,226,150', '255,190,90', '255,150,40'] }
    ], lights, [
      { id: 'letreiro_lanchonete', type: 'flow', layer: 'mid', tile: 1, mask: 'signmask', rect: [r4(SIGN[0] / PW), r4(SIGN[1] / PH), r4(SIGN[2] / PW), r4(SIGN[3] / PH)], rgb: '255,70,150', blend: 'lighter', loop: 3.2, frames: 48, maxScale: 2, bands: [], base: 0.42, pulse: 1.25, pulseCycles: 4, nota: 'painel do letreiro piscando em rosa (4 piscadas a cada 3,2 s)' }
    ],
    pair('fumaca_ruinas', { layer: 'mid', anchors: B(RUIN_TOP), n: 8, life: 5.2, rise: 0.2, wind: -0.12, spread: 0.035, wobble: 0.014, r0: 0.012, grow: 0.034, fadeIn: 0.06, seed: 71 }, SMOKE, 0.86, 0.8),
    pair('poeira_entulho', { layer: 'mid', anchors: B(RUBBLE), n: 5, life: 3.6, rise: 0.075, wind: -0.03, spread: 0.03, wobble: 0.01, r0: 0.007, grow: 0.018, fadeIn: 0.1, seed: 73 }, DUST, 0.7, 0.74, 0.0019)),
  fxNota: 'Efeitos presos a uma camada. anchors/rect: fracoes (x,y[,w,h]) dentro do arquivo da camada (indice = posicao em files). flow: laco de loop segundos em frames quadros; cada quadro = mascara (sprite branco com alfa) pintada com rgb e alfa base*(1+pulse*sin(2pi*fase*pulseCycles)), limitado a 0..1 pelo canvas. SEMAFORO: 3 flows (uma mascara redonda por lampada) no mesmo laco de 9 s: vermelho acende com seno > 0,2, verde com seno < -0,2 e amarelo so no fim do verde (meio ciclo de seno): verde -> amarelo -> vermelho -> verde. LETREIRO: 1 flow piscando. glow: brilho radial aditivo pulsando. plume: n bolhas sem estado; fase p = frac(t/life + k/n + id*0.37); x = ax + wind*p^1.5 + espalhamento; y = ay - rise*p^0.85; raio = r0 + grow*p. FUMACA COM CONTORNO: par de plumes com a MESMA semente: *_traco desenha os discos um pouco maiores na cor do traco e some antes; o seguinte pinta os 2 tons por cima.',
  haze: { y: [0.2, FARB], rgb: '214,234,246', alpha: 0.3 },
  fog: [{ y: 0.455, height: 0.12, parallax: 0.1, drift: 0.012, alpha: 0.5 }, { y: 0.548, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.22 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '226,238,246', alpha: 0.30, nota: 'textura procedural: elipses radiais com posicoes de hash, repetida na horizontal. fog[0] = bruma na base da cidade distante; fog[1] = poeira baixa no pe dos predios' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. 2 grupos de nuvens brancas em velocidades diferentes.',
    groups: [
      { parallax: 0.02, drift: 0.008, alpha: 0.95, period: 2.3, items: [{ s: 'cloud1', x: 0.15, y: 0.06, w: 0.3 }, { s: 'cloud3', x: 1.3, y: 0.015, w: 0.34 }] },
      { parallax: 0.04, drift: 0.02, alpha: 1, period: 2.7, items: [{ s: 'cloud2', x: 0.75, y: 0.11, w: 0.26 }, { s: 'cloud1', x: 1.95, y: 0.035, w: 0.22 }] }
    ]
  },
  birds: { sprite: 'pigeon', flocks: [{ period: 13, duration: 7, y: 0.15, size: 0.07, n: 3, phase: 2, alpha: 1 }, { period: 21, duration: 12, y: 0.05, size: 0.045, n: 4, phase: 11, alpha: 0.95 }], nota: 'pombos (6 quadros de 4 poses): cruzam da esquerda para a direita; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'dy(u) = sin(u*k1 - t*w1 + ph)*amp*h*(0.15+u) + sin(u*k2 - t*w2 + ph*1.7)*amp*h*0.7*u + u*u*h*droop ; u = 0 na ponta presa, 1 na ponta solta' },
  towerFlags: { pole: 0, width: 0.105, amp: 0.14, nota: 'pano preso pela direita, ondulando por fatias. pole 0: prende direto na ancora' },
  midAnchors: { nota: 'fracoes (x,y) dentro de cada arquivo da camada mid (indice = posicao em files). mid A: bandeira vermelha no topo do mastro da guarita.', towerFlags: [FLAGS_A, FLAGS_B] },
  roadside: {
    parallax: 1, cell: 0.34, prob: 0.92, seed: 11, minGap: 0.05, sameTypeGap: 0.62, reach: 0.75, baseY: [0.664, 0.671], nota: 'objetos na calcada de tras, junto a guia, atras do heroi; sorteio por celula igual ao dos decalques. Animados e parados disputam o MESMO sorteio: nunca se sobrepoem (minGap) e o mesmo tipo nunca aparece duas vezes a menos de sameTypeGap (0.62 SH, mais que uma tela). CACHORRO (pacer): senta, anda 0.09 SH em ciclo de 4 passos, senta virado e volta. POMBO (hopper): dois pilaretes a 0.13 SH; fica pousado num (em pe / bicando), voa em arco batendo asas ate o outro, pousa, e volta. TAMBOR EM CHAMAS (fire): 3 chamas em quadros + brilho + faiscas. span = espaco extra a direita reservado no sorteio.',
    pool: [
      { type: 'sprite', sprite: 'lamp', h: [0.3, 0.315], weight: 4 },
      { type: 'fire', sprite: 'barrel', h: [0.1, 0.106], weight: 2, fire: { y: 0.93, size: 0.6, glow: 2.0, glowAlpha: 0.1, sparks: { n: 8, life: 1.5, spread: 0.5, wobble: 0.3, wind: 0.55, rise: 2.6, radius: 0.036 } } },
      { type: 'pacer', sprite: 'dog', h: [0.085, 0.09], weight: 3, span: 0.1, walk: { dist: 0.09, period: 7, split: [0.3, 0.5, 0.8], sit: 1, steps: 8 } },
      { type: 'hopper', sprite: 'pigeonsit', h: [r4(0.072 * info.pigeon.frame[1] / info.pigeon.bollardH), r4(0.076 * info.pigeon.frame[1] / info.pigeon.bollardH)], weight: 3, span: 0.13, hop: { post: 'bollardP', dx: 0.13, period: 5, flight: 0.7, fly: 'pigeon', size: 0.085, height: 0.04, cx: 0.5, cy: r4(info.pigeon.cy) } },
      { type: 'sprite', sprite: 'hydrant', h: [0.078, 0.084], weight: 1 }, { type: 'sprite', sprite: 'bin', h: [0.082, 0.088], weight: 1 }, { type: 'sprite', sprite: 'vbox', h: [0.098, 0.104], weight: 1 }, { type: 'sprite', sprite: 'vbox2', h: [0.118, 0.124], weight: 1 },
      { type: 'sprite', sprite: 'bench', h: [0.084, 0.09], weight: 1 }, { type: 'sprite', sprite: 'bike', h: [0.108, 0.114], weight: 1 }, { type: 'sprite', sprite: 'mailbox', h: [0.108, 0.114], weight: 1 }, { type: 'sprite', sprite: 'barrier', h: [0.074, 0.08], weight: 1 },
      { type: 'sprite', sprite: 'signpole', h: [0.2, 0.21], weight: 1 }, { type: 'sprite', sprite: 'sawhorse', h: [0.084, 0.09], weight: 1 }]
  },
  torch: { flameY: 0.7, flameSize: 0.105, glowRadius: 2.3, glowAlpha: 0.2, nota: 'parametros das chamas em quadros (folha flame, 4 quadros, 10 fps): valem para o tambor em chamas.' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 1 tela): o MESMO decalque nunca aparece duas vezes a menos dessa distancia horizontal. footClear = faixa vertical em torno da linha dos pes (groundY 0.78) livre de pecas com volume: lata, tijolo, copo e pedras so entram em ruaTras (base acima da faixa) e ruaFrente (abaixo da faixa amarela). Manchas, tampas, rachaduras, remendo, poca, capsulas, cacos e folhas sao rasos e podem passar sob os pes. NADA cai sobre a faixa dupla amarela (lineY): os grupos param antes dela ou comecam depois.',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito: para cada celula i (largura cell), se rnd(i,seed,0) < prob, sorteia item do pool por peso (rnd 1), x = (i + 0.15 + 0.7*rnd 2)*cell, base y em yRange (rnd 3), escala em scale (rnd 4), espelha se rnd 5 < 0.5. Nunca repete.',
    groups: [
      { id: 'calcada', parallax: 1, cell: 0.3, prob: 0.55, seed: 5, yRange: [0.652, 0.668], scale: [0.5, 0.7], flip: true, nota: 'folhas, jornal e pano na calcada de tras', pool: [['leaves', 3], ['paper', 1], ['cloth', 1], ['glass', 1]] },
      { id: 'ruaTras', parallax: 1, cell: 0.42, prob: 0.7, seed: 13, yRange: [r3(road[0] + 0.03), r3(road[0] + 0.05)], scale: [0.55, 0.72], flip: true, nota: 'pecas com volume na borda de tras da rua (base acima da faixa dos pes)', pool: [['can', 2], ['brick', 2], ['cup', 2], ['rubble3', 3]] },
      { id: 'ruaRasos', parallax: 1, cell: 0.5, prob: 0.8, seed: 3, yRange: [0.782, r3(line[0] - 0.006)], scale: [0.72, 0.9], flip: true, nota: 'pecas rasas grandes na faixa da pisada, sempre acima da faixa amarela',
        pool: [['manhole', 3], ['grate', 2], ['oil1', 2], ['oil2', 3], ['patch', 2], ['puddle', 2], ['crack1', 2], ['crack2', 2]] },
      { id: 'ruaMiudos', parallax: 1, cell: 0.16, prob: 0.75, seed: 7, yRange: [r3(road[0] + 0.03), r3(line[0] - 0.006)], scale: [0.6, 0.9], flip: true, nota: 'miudos rasos no asfalto de tras: podem ficar sob os pes', pool: [['casings', 3], ['glass', 3], ['leaves', 3], ['bolt', 2], ['crack1', 2]] },
      { id: 'ruaFrente', parallax: 1, cell: 0.34, prob: 0.8, seed: 17, yRange: [r3(line[1] + 0.05), r3(road[1] - 0.004)], scale: [0.7, 0.9], flip: true, nota: 'asfalto da frente, abaixo da faixa amarela (o topo de cada peca fica abaixo dela)',
        pool: [['manhole', 2], ['grate', 2], ['oil1', 2], ['oil2', 2], ['crack2', 2], ['patch', 2], ['can', 2], ['brick', 2], ['cup', 1], ['rubble3', 2], ['casings', 2]] },
      { id: 'calcadaFrente', parallax: 1, cell: 0.25, prob: 0.5, seed: 8, yRange: [r3(curb[1] + 0.03), r3(curb[1] + 0.05)], scale: [0.7, 1.0], flip: true, nota: 'folhas, papelao e pano na calcada da frente', pool: [['leaves', 3], ['cardboard', 1], ['cloth', 1], ['paper', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi: ervas com dente-de-leao e capim seco balancam (skew); entulho com vergalhao, cones, sacos de areia e tambor ficam parados',
    pool: [
      { sprite: 'weeds', h: [0.15, 0.18], sway: true, weight: 3 }, { sprite: 'drygrass', h: [0.13, 0.16], sway: true, weight: 3 },
      { sprite: 'rubble', h: [0.11, 0.13], weight: 1 }, { sprite: 'cones', h: [0.11, 0.13], weight: 1 }, { sprite: 'sandbags', h: [0.1, 0.12], weight: 1 }, { sprite: 'drum', h: [0.13, 0.15], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 22, yRange: [0.3, 0.96], rgb: '240,244,250', glowRgb: '200,215,235', radius: [0.0012, 0.0028], parallax: 0.55, drift: 0.016, blend: 'lighter', nota: 'poeira clara flutuando e piscando' },
  bottomShade: { from: 0.94, alpha: 0.26, rgb: '20,28,40' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: {
    cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', pigeon: { file: 'pigeon.webp', frames: 6, fps: 12 }, flame: { file: 'flame.webp', frames: 4, fps: 10 },
    heli: 'heli.webp', rotor: 'rotor.webp', trotor: 'trotor.webp', bus: 'bus.webp', truck: 'truck.webp', sedan: 'sedan.webp', taxi: 'taxi.webp', jeep: 'jeep.webp', wheel: 'wheel.webp', wheelT: 'wheelT.webp', backroad: 'backroad.webp',
    dish: 'dish.webp', fan: 'fan.webp', lampmask: 'lampmask.webp', signmask: 'signmask.webp', flagR: 'flagR.webp',
    lamp: 'lamp.webp', barrel: 'barrel.webp', dog: { file: 'dog.webp', frames: 5, fps: 2 }, pigeonsit: { file: 'pigeonsit.webp', frames: 2, fps: 0.9 }, bollardP: 'bollardP.webp',
    hydrant: 'hydrant.webp', bin: 'bin.webp', vbox: 'vbox.webp', vbox2: 'vbox2.webp', bench: 'bench.webp', bike: 'bike.webp', mailbox: 'mailbox.webp', barrier: 'barrier.webp', signpole: 'signpole.webp', sawhorse: 'sawhorse.webp',
    weeds: 'weeds.webp', drygrass: 'drygrass.webp', rubble: 'rubble.webp', cones: 'cones.webp', sandbags: 'sandbags.webp', drum: 'drum.webp'
  },
  animated: [
    { id: 'ceu_deriva', tipo: 'ceu derivando devagar, independe da corrida' }, { id: 'nuvens_2_vel', tipo: 'nuvens brancas em 2 velocidades' },
    { id: 'pombos', tipo: '2 grupos de pombos batendo asas (quadros)' },
    { id: 'helicoptero', tipo: 'helicoptero militar cruzando o ceu: rotor principal batendo, rotor de cauda girando, sobe e desce de leve' },
    { id: 'transito_viaduto', tipo: 'sedan, onibus, taxi, caminhao e jipe passando no viaduto ao fundo, com as rodas girando' },
    { id: 'farol_torre', tipo: 'luz vermelha pulsando no topo da torre de radio' }, { id: 'fumaca_cidade', tipo: 'fumaca subindo de 2 predios destruidos ao longe, com contorno' },
    { id: 'bruma', tipo: 'bruma deslizando na base da cidade e poeira baixa no pe dos predios' },
    { id: 'transito_rua_de_tras', tipo: 'caminhao militar, jipe, onibus, taxi e sedan passando na rua de tras dos predios (aparecem nos vaos, atras do outdoor e do ponto de onibus), com as rodas girando sobre o asfalto' },
    { id: 'semaforo', tipo: 'semaforo trocando: verde, amarelo, vermelho (laco de 9 s)' },
    { id: 'janelas', tipo: 'janelas acesas do predio de tijolos e vitrine da lanchonete tremeluzindo' }, { id: 'holofote', tipo: 'holofote da guarita pulsando' },
    { id: 'bandeira', tipo: 'bandeira vermelha tremulando no mastro da guarita' },
    { id: 'letreiro', tipo: 'painel do letreiro da lanchonete piscando em rosa' }, { id: 'helice_ar', tipo: 'helice do ar-condicionado girando' },
    { id: 'antena_radar', tipo: 'antena de radar girando no mastro da estacao' },
    { id: 'fumaca_ruinas', tipo: 'fumaca escura subindo do predio em ruinas e poeira no entulho, com contorno' },
    { id: 'tambor_em_chamas', tipo: 'tambor com 3 chamas em quadros, brilho e faiscas' },
    { id: 'cachorro', tipo: 'cachorro vira-lata: senta, anda alguns passos (ciclo de 4 poses), senta e volta' },
    { id: 'pombo_nos_pilaretes', tipo: 'pombo que pula de um pilarete a outro batendo asas, pousa e bica' },
    { id: 'poeira', tipo: 'poeira clara flutuando e piscando' }, { id: 'primeiro_plano', tipo: 'ervas e capim seco balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
console.log('meta.json', s.length, 'bytes', 'far', r3(farTop), FARB, 'pista', deckY, 'rua', road, 'guias', curb, 'faixa', line, 'mid', MID.height, 'midW', r3(midW), 'farW', r3(farW), 'fx', m.fx.length, 'actors', m.actors.length);
