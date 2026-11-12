// Gera assets/bg/v2/era4/meta.json a partir de work/info.json (saida do build4.js).
// uso: node mkmeta4.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta4.js --info tools/info.era4.json <pastaSaida>)
// Rodadas 2 e 3: usa os blocos opcionais rotors[] e actors[] (com tile), roadside.sameTypeGap e folhas de quadros na beira, acrescentados ao scene.js.
const fs = require('fs');
const infoFile = process.argv[2] === '--info' ? process.argv[3] : process.argv[2] + '/work/info.json';
const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
const OUT = process.argv[process.argv[2] === '--info' ? 4 : 3];
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const L = (id, o, px, height) => Object.assign({ id }, o, { px, height, repeatWidth: r3(height * px[0] / px[1] * (o.tile === 'repeat' ? 1 : 2)) });
const G = { top: 0.60, height: 0.408 }, SKYH = 0.62, FARH = 0.5, FARB = 0.565, MID = { bottom: 0.622, height: 0.54 };
const gy = f => r3(G.top + f * G.height), road = info.road.map(gy), curb = info.curb.map(gy), rails = info.rails.map(gy);
const farTop = FARB - FARH, deckY = r4(farTop + info.deck * FARH), midW = MID.height * info.midA[0] / info.midA[1], farW = FARH * info.far[0] / info.far[1];
const hex = c => '#' + c.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const S = info.spr, hOf = (n, w) => w * S[n][1] / S[n][0];
// ---- ancoras medidas nas previas de 1584 x 638 dos dois trechos do mid (fracao x,y de cada arquivo)
const PW = 1584, PH = 1584 * info.midA[1] / info.midA[0], P = (x, y) => ({ x: r4(x / PW), y: r4(y / PH) });
const CHIM_A = [P(216, 50), P(350, 50)], CRANE = [P(1487, 292)], WIN_A = [P(203, 455), P(302, 455), P(400, 455), P(523, 394), P(595, 394), P(667, 394)];
const BOILER_TOP = [P(1112, 240)], VALVE_L = [P(978, 470)], VALVE_R = [P(1244, 497)], WELD = [P(1392, 478)];
const STACK_B = [P(1017, 252)], DOME_B = [P(853, 274)], CYL_B = [P(1046, 506)], GRATE_B = [P(1022, 578)], TESLA = P(1375, 95);
const LIGHTS_B = [P(467, 287), P(1272, 448), P(1375, 448), P(1478, 448)];
const AWN = [194, 291, 388].map(x => Object.assign(P(x, 392), { flag: 'awn' })), FLAGS_B = AWN.concat([Object.assign(P(958, 9), { flag: 'pennR' })]), FLAGS_A = [Object.assign(P(1241, 152), { flag: 'pennB' })];
// par engrenado: 16 dentes (raio 105 px da previa) e 8 dentes (metade do raio, dobro da velocidade, sentido oposto). Distancia entre centros = soma dos raios primitivos (0.931 do raio externo).
const G1 = { x: 835, y: 330, r: 105, n: 16 }, ALFA = -0.6109, DC = 0.931 * (G1.r + G1.r / 2), G2 = { x: G1.x + Math.cos(ALFA) * DC, y: G1.y + Math.sin(ALFA) * DC, r: G1.r / 2, n: 8 }, TURN = 18;
// trem: rodas medidas na folha (x, y, raio em px do recorte de 1708 x 379)
const TR = info.trainRaw, WH = [[1365, 333, 42], [1462, 333, 42], [1552, 362, 19], [1640, 363, 19]].concat([1110, 1150, 1215, 1255, 775, 815, 955, 992, 438, 478, 618, 655, 100, 140, 280, 318].map(x => [x, 362, 22]));
const wheels = (speed, sc) => { const fx = v => r4((v - TR[2]) / TR[0]), fy = v => r4((v - TR[3]) / TR[1]), per = r3(2 * Math.PI * 42 * sc / speed), PH = 0.6, crank = r4(18 / 128 * 2 * 42 * 1.04 / TR[0]);
  return WH.map((q, k) => ({ sprite: 'wheel', x: fx(q[0]), y: fy(q[1]), w: r4(q[2] * 2.08 / TR[0]), period: r3(2 * Math.PI * q[2] * sc / speed), phase: k < 2 ? PH : r3(k * 1.7 % 6.28) })).concat([
    { rod: true, x: fx(WH[0][0]), y: fy(WH[0][1]), x2: fx(WH[1][0]), y2: fy(WH[1][1]), r: crank, w: 0.0026, period: per, phase: PH },
    { rod: true, slide: true, x: fx(WH[1][0]), y: fy(WH[1][1]), x2: fx(1526.8), y2: fy(331.4), r: crank, w: 0.0026, period: per, phase: PH }]); };
// fumaca do trem por codigo: par de plumes (traco + 2 tons) preso a boca da chamine; wind negativo = fica para tras
const CHIMNEY = { x: r4(1282 / 1400), y: r4(117 / 311) }, trainSmoke = (id, base, rim) => pair(id, base, SMOKE, 0.86, 0.8, rim).map(p => Object.assign(p, CHIMNEY));
const HAND = 40, RAILW = 0.36, RAILY = 0.5505, CL = info.clock;                                                                         // [cx, cy, rx, ry] do mostrador no ladrilho far
// ---- fumaca e vapor com contorno: o mesmo plume duas vezes (mesma semente = mesmas posicoes). 1o passe: discos um pouco maiores na cor do traco; 2o passe: os 2 tons por cima.
const OUTL = '#43322f', RIM = 0.0023;
const pair = (id, base, fillC, alphaO, fadeO, rim) => [
  Object.assign({ id: id + '_traco', type: 'plume' }, base, { r0: r4(base.r0 + (rim || RIM)), light: OUTL, dark: OUTL, alpha: alphaO, fade: fadeO }),
  Object.assign({ id: id, type: 'plume' }, base, fillC)];
const SMOKE = { light: '#eadfce', dark: '#b29d8f', alpha: 0.95, fade: 0.84 }, STEAM = { light: '#fbf7ee', dark: '#cfc4b6', alpha: 0.96, fade: 0.86 };
const A = l => [l, []], B = l => [[], l];
// jato de vapor em pulsos: bolhas com n=1 e a mesma vida nascem JUNTAS na valvula, abrem para o lado e somem; um jato a cada life segundos
const jet = (id, anchors, life, blobs, seed) => blobs.map((b, k) => pair(id + '_' + (k + 1), { layer: 'mid', anchors, n: 1, life, rise: b[1], wind: b[0], spread: 0.012, wobble: 0.004, r0: b[2], grow: b[3], fadeIn: 0.02, seed: seed + k, margin: 0.4 }, STEAM, 0.9, 0.82));
const fxs = [].concat(
  pair('fumaca_chamines', { layer: 'mid', anchors: A(CHIM_A), n: 8, life: 6.2, rise: 0.2, wind: -0.1, spread: 0.03, wobble: 0.012, r0: 0.0125, grow: 0.03, fadeIn: 0.05, seed: 71 }, SMOKE, 0.86, 0.8),
  pair('fumaca_guindaste', { layer: 'mid', anchors: A(CRANE), n: 5, life: 3.4, rise: 0.085, wind: -0.04, spread: 0.014, wobble: 0.006, r0: 0.0045, grow: 0.012, fadeIn: 0.06, seed: 72 }, SMOKE, 0.86, 0.8, 0.0019),
  pair('vapor_caldeira', { layer: 'mid', anchors: A(BOILER_TOP), n: 6, life: 1.5, rise: 0.085, wind: -0.012, spread: 0.012, wobble: 0.004, r0: 0.0035, grow: 0.012, fadeIn: 0.06, seed: 73 }, STEAM, 0.9, 0.82, 0.0019),
  ...jet('jato_valvula_esq', A(VALVE_L), 3.3, [[-0.062, 0.018, 0.005, 0.016], [-0.04, 0.03, 0.006, 0.014], [-0.022, 0.012, 0.005, 0.011]], 60),
  ...jet('jato_valvula_dir', A(VALVE_R), 4.1, [[0.062, 0.02, 0.005, 0.016], [0.04, 0.034, 0.006, 0.014], [0.022, 0.012, 0.005, 0.011]], 64),
  pair('vapor_bueiro', { layer: 'mid', anchors: B(GRATE_B), n: 7, life: 2.8, rise: 0.105, wind: -0.02, spread: 0.035, wobble: 0.012, r0: 0.006, grow: 0.017, fadeIn: 0.08, seed: 76 }, STEAM, 0.86, 0.8));
// ---- raios da bobina de Tesla: 4 mascaras em ziguezague; cada uma acende em rajadas curtas (mesma formula, limiar alto) com lacos de duracoes diferentes
const boltRect = [r4(TESLA.x - 150 / PW), r4(TESLA.y - 170 / PH), r4(300 / PW), r4(240 / PH)];
const bolts = [[1.7, 3, 0.52, 1], [2.3, 4, 0.6, -1], [2.9, 5, 0.56, 1], [3.7, 7, 0.64, -1]].map((q, k) => ({ id: 'raio_' + k, type: 'flow', layer: 'mid', tile: 1, mask: 'bolt' + k, rect: boltRect, rgb: '205,225,255', blend: 'lighter', loop: q[0], frames: Math.round(q[0] * 14), maxScale: 2, bands: [], base: r3(-6 * q[2]), pulse: r4(-q[3] / q[2]), pulseCycles: q[1] }));
const farChim = pair('fumaca_cidade', { layer: 'far', anchors: [info.farChim.map(c => ({ x: r4(c[0]), y: r4(c[1] + 0.004) }))], n: 6, life: 7.5, rise: 0.085, wind: -0.05, spread: 0.012, wobble: 0.006, r0: 0.0042, grow: 0.011, fadeIn: 0.06, seed: 77, margin: 0.2 }, { light: '#e6cdb0', dark: '#b89684', alpha: 0.85, fade: 0.82 }, 0.7, 0.78, 0.0016);
const m = {
  version: 2, era: 4, nome: 'Era Industrial - cidade fabril steampunk ao entardecer: fabrica, caldeira, estacao de trem, bobina de Tesla e rua de paralelepipedos',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0 a 3; a roupa da era 4 ainda nao existe animada). size = lado do quadro 256 em SH (183 px na cena de 692; o boneco fica com 160 px). footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.34, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#d9c7ae', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.005, top: 0 }, info.sky, SKYH), { nota: 'entardecer ambar e cobre; o terco de baixo e nevoa de carvao clara (aparece atras da cidade e nos vaos entre os predios). Repete em si mesmo, sem espelho' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'repeat', parallax: 0.06, drift: 0, offset: 0.13, bottom: FARB }, info.far, FARH), { deckY, clock: { x: r4(CL[0]), y: r4(CL[1]), rx: r4(CL[2]), ry: r4(CL[3]) }, nota: 'cidade fabril distante: viaduto de ferro de ponta a ponta (o trem passa por tras dele, em actors), 3 chamines, torre do relogio (mostrador pintado sem ponteiros; os dois ponteiros giram em rotors) e gasometro. Repete em si mesmo, sem espelho; ladrilho de 0.645 SH: a torre quase nunca sai de cena e nunca aparecem duas inteiras. A base some no degrade do ceu (alfa)' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midA, MID.height), { nota: 'A: caixotes e carvao, fabrica de tijolos com janelas acesas, anexo (o par de engrenagens gira por tras dele), caldeira de cobre com tubos e valvulas, guindaste a vapor. B: banca de jornal, lampiao a gas, galpao aberto da estacao de ferro e vidro (vidro translucido; o trem cruza por tras, em actors), tampa de bueiro, oficina do inventor com bobina de Tesla. Cada trecho termina antes das bordas: nos vaos aparece a cidade distante na nevoa' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, railsY: rails, nota: 'calcada de lajes (topo, com a borda de cima esmaecida sobre o pe dos predios), guia, rua de paralelepipedos (roadY) com 2 trilhos de bonde embutidos (railsY), guia, calcada da frente. Os pes (groundY) caem nos paralelepipedos, atras do primeiro trilho' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky', 'clouds: nuvens de fuligem em 2 velocidades', 'actors(sky): 2 dirigiveis com helices, trem do viaduto com rodas', 'birds (corvos)', 'far', 'rotors(far): ponteiros das horas e dos minutos', 'farFill (transparente)', 'fx(far): brilho do mostrador, fumaca das chamines distantes', 'haze', 'fog[0]', 'actors(mid): mureta com trilho, trem da estacao', 'rotors(mid): par de engrenagens (atras do mid)', 'mid', 'towerFlags (barra do toldo da banca, flamulas)', 'fx(mid): luz das janelas e lampioes, fumaca das chamines, vapor da caldeira e das valvulas, faiscas de solda, vapor do bueiro, raios e brilho da bobina de Tesla', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), hex(info.skyHi), hex(info.skyMid), hex(info.skyLow), hex(info.skyBottom), hex(info.skyBottom)], ground: [[curb[0], '#d9c2a2'], [road[0], '#e6d3b3'], [road[1], '#8c7458'], [curb[1], '#d9c2a2'], [1.001, '#a38d7c']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Vale entre todos os grupos de decalques juntos; em roadside e fg a caixa e so horizontal. Deterministico por celula: nao depende da rolagem. reach = quanto olhar alem da tela (SH) para achar vizinhos.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era: atras da cidade fica a nevoa clara da camada sky' },
  rotors: [
    { id: 'engrenagem_16', sprite: 'gear', layer: 'mid', tile: 0, x: r4(G1.x / PW), y: r4(G1.y / PH), w: r4(2 * G1.r / PW), period: TURN, phase: 0 },
    { id: 'engrenagem_8', sprite: 'gear8', layer: 'mid', tile: 0, x: r4(G2.x / PW), y: r4(G2.y / PH), w: r4(2 * G2.r / PW), period: -TURN / 2, phase: r4(3 * ALFA + Math.PI - Math.PI / 8) },
    { id: 'ponteiro_horas', sprite: 'handH', layer: 'far', tile: 0, front: true, x: r4(CL[0]), y: r4(CL[1]), w: r4(CL[2] * 1.86), period: HAND * 12, phase: r4(2 * Math.PI * 10 / 12) },
    { id: 'ponteiro_minutos', sprite: 'handM', layer: 'far', tile: 0, front: true, x: r4(CL[0]), y: r4(CL[1]), w: r4(CL[2] * 1.86), period: HAND, phase: 0 }
  ],
  rotorsNota: 'Sprites girando em torno do proprio centro, presos a uma camada (x, y = fracao do arquivo; w = fracao da largura do arquivo; period = s por volta, negativo = anti-horario; phase em rad). PAR ENGRENADO atras da fabrica, em ferro com ferrugem: 16 dentes (1 volta em 18 s) e 8 dentes (sentido oposto, 1 volta em 9 s: mesma velocidade no dente); a fase da menor poe um vao dela de frente para um dente da maior. Sem sombra projetada: atras delas so ha ceu e cidade (nao ha parede para receber sombra); ficam a sombra interna do aro e do cubo. PONTEIROS da torre: os dois sao sprites escuros (o mostrador pintado ficou sem ponteiro); minutos = 1 volta em 40 s; horas = 1/12 da velocidade (1 volta em 480 s), partindo das 10 h.',
  actors: [
    { id: 'dirigivel_pequeno', slot: 'sky', sprite: 'airship2', x: 0.9, y: 0.07, w: 0.095, parallax: 0.02, drift: -0.02, loop: 1.9, bob: 0.004, bobF: 0.6, parts: [{ sprite: 'prop', x: 0.075, y: 0.33, w: 0.085, period: 0.42, flap: true }, { sprite: 'prop', x: 0.2, y: 0.74, w: 0.055, period: 0.36, phase: 1, flap: true }] },
    { id: 'dirigivel_grande', slot: 'sky', sprite: 'airship', x: 0.02, y: 0.018, w: 0.2, parallax: 0.035, drift: -0.034, loop: 1.75, bob: 0.004, bobF: 0.5, parts: [{ sprite: 'prop', x: 0.035, y: 0.335, w: 0.05, period: 0.5, flap: true }] },
    { id: 'trem_viaduto', slot: 'sky', sprite: 'train', x: 0.2, y: r4(deckY - hOf('train', 0.32) * 0.99), w: 0.32, parallax: 0.06, drift: -0.078, loop: 1.55, parts: wheels(0.078, 0.32 / TR[0]), smoke: trainSmoke('fumaca_trem_viaduto', { n: 7, life: 2.2, rise: 0.04, wind: -0.15, spread: 0.01, wobble: 0.003, r0: 0.0032, grow: 0.0105, fadeIn: 0.05, seed: 82 }, 0.0013) },
    { id: 'trilho_estacao', slot: 'mid', sprite: 'railbed', tile: true, x: 0, y: RAILY, w: RAILW, parallax: 0.38, drift: 0, loop: RAILW },
    { id: 'trem_estacao', slot: 'mid', sprite: 'train', x: -2.26, y: r4(RAILY + 0.0006 - hOf('train', 1.382)), w: 1.382, parallax: 0.38, drift: -0.19, loop: 5.2, parts: wheels(0.19, 1.382 / TR[0]), smoke: trainSmoke('fumaca_trem_estacao', { n: 9, life: 2.4, rise: 0.15, wind: -0.4, spread: 0.035, wobble: 0.012, r0: 0.013, grow: 0.042, fadeIn: 0.04, seed: 81 }) }
  ],
  actorsNota: 'Sprites que cruzam a cena (x, y, w em SH; deslocamento = scroll*parallax + t*drift; da a volta a cada loop SH), com pecas presas (x, y = centro em fracao do corpo; w = fracao da largura do corpo; period = s por volta; flap = helice vista de lado, achata em cosseno). slot sky = depois das nuvens, antes do far (dirigiveis e trem do viaduto passam por tras das chamines e da torre). slot mid = antes da camada mid: o TREM DA ESTACAO entra, cruza o galpao aberto e sai (anda 0.19 SH/s em relacao aos predios), passando por tras da ferragem, dos predios e das engrenagens; rodas girando na velocidade do trem. BIELAS (parts com rod: true): haste entre os pinos das duas rodas grandes e haste da roda da frente ate a cruzeta (slide), com o mesmo periodo e fase das rodas grandes. FUMACA (smoke): plumes presos a boca da chamine, soprados para tras conforme a velocidade do trem (a fumaca pintada saiu do sprite). TRILHO DA ESTACAO (tile: true = a faixa se repete a cada loop): mureta de tijolo com dormentes e trilho em cima, presa aos predios (mesmo parallax do mid), continua de ponta a ponta; o topo do trilho fica na linha da base das rodas do trem em todo o percurso. Aparece nos vaos entre os predios; no galpao a plataforma cobre a mureta e a base das rodas.',
  fx: [
    { id: 'brilho_mostrador', type: 'glow', layer: 'far', anchors: [[{ x: r4(CL[0]), y: r4(CL[1]) }]], radius: 0.034, alpha: 0.2, pulse: 1.3, rgb: ['255,244,200', '255,214,130', '255,180,80'] }
  ].concat(farChim, [
    { id: 'janelas_fornalha', type: 'glow', layer: 'mid', anchors: A(WIN_A), radius: 0.05, alpha: 0.3, pulse: 4.6, rgb: ['255,206,110', '255,150,50', '255,110,30'], nota: 'janelas da fabrica pulsando com o fogo das fornalhas' },
    { id: 'luzes_estacao', type: 'glow', layer: 'mid', anchors: B(LIGHTS_B), radius: 0.036, alpha: 0.3, pulse: 5.5, rgb: ['255,222,140', '255,170,70', '255,130,40'], nota: 'lampiao a gas e 3 vigias da oficina' }
  ], fxs.map(p => p), [
    { id: 'solda_clarao', type: 'glow', layer: 'mid', anchors: A(WELD), radius: 0.026, alpha: 0.55, pulse: 23, rgb: ['235,245,255', '150,200,255', '90,140,255'] },
    { id: 'solda_faiscas', type: 'embers', layer: 'mid', anchors: A(WELD), n: 14, life: 0.75, angle: 2.6, speed: 0.15, gravity: 0.75, radius: [0.0012, 0.0026], rgb: '255,248,220', glowRgb: '255,190,90', seed: 91, nota: 'faiscas de solda caindo em arco na base do guindaste' },
    { id: 'tesla_brilho', type: 'glow', layer: 'mid', anchors: B([TESLA]), radius: 0.05, alpha: 0.42, pulse: 11, rgb: ['225,238,255', '150,190,255', '90,120,255'] }
  ], bolts),
  fxNota: 'Efeitos presos a uma camada. anchors/rect: fracoes (x,y[,w,h]) dentro do arquivo da camada (indice = posicao em files). flow: laco de loop segundos em frames quadros; cada quadro = mascara (sprite branco com alfa) pintada com rgb e alfa base*(1+pulse*sin(2pi*fase*pulseCycles)), limitado a 0..1 pelo canvas (aqui sem faixas). Os ponteiros do relogio nao sao mais flow: giram em rotors. RAIOS: 4 flows com limiar alto: cada raio acende em rajadas curtas, com lacos de duracoes diferentes. glow: brilho radial aditivo pulsando. plume: n bolhas sem estado; fase p = frac(t/life + k/n + id*0.37); x = ax + wind*p^1.5 + espalhamento; y = ay - rise*p^0.85; raio = r0 + grow*p. FUMACA E VAPOR COM CONTORNO: cada um e um par de plumes com a MESMA semente (mesmas posicoes): *_traco desenha os discos um pouco maiores na cor do traco da arte e some antes; o plume seguinte pinta os 2 tons por cima. JATO: plumes com n=1 e a mesma life nascem juntos na valvula, abrem para o lado e somem (um jato a cada life segundos). embers: particulas aditivas em arco (faiscas de solda).',
  haze: { y: [0.2, FARB], rgb: '247,196,128', alpha: 0.36 },
  fog: [{ y: 0.455, height: 0.12, parallax: 0.1, drift: 0.012, alpha: 0.6 }, { y: 0.548, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.34 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '250,214,160', alpha: 0.30, nota: 'textura procedural: elipses radiais com posicoes de hash, repetida na horizontal. fog[0] = nevoa de carvao na base da cidade distante; fog[1] = nevoa baixa no pe dos predios' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. Grupos 0 e 1 = nuvens de fuligem em 2 velocidades. Os dirigiveis e o trem do viaduto sairam daqui: estao em actors (slot sky).',
    groups: [
      { parallax: 0.03, drift: 0.011, alpha: 0.92, period: 2.3, items: [{ s: 'cloud1', x: 0.15, y: 0.075, w: 0.26 }, { s: 'cloud3', x: 1.3, y: 0.03, w: 0.3 }] },
      { parallax: 0.06, drift: 0.026, alpha: 1, period: 2.7, items: [{ s: 'cloud2', x: 0.75, y: -0.012, w: 0.36 }, { s: 'cloud1', x: 1.95, y: 0.035, w: 0.3 }] }
      ]
  },
  birds: { sprite: 'crow', flocks: [{ period: 14, duration: 8, y: 0.07, size: 0.105, n: 2, phase: 2, alpha: 1 }, { period: 23, duration: 13, y: 0.025, size: 0.06, n: 3, phase: 11, alpha: 0.95 }], nota: 'corvos (6 quadros de 4 poses): cruzam da esquerda para a direita; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'dy(u) = sin(u*k1 - t*w1 + ph)*amp*h*(0.15+u) + sin(u*k2 - t*w2 + ph*1.7)*amp*h*0.7*u + u*u*h*droop ; u = 0 na ponta presa, 1 na ponta solta' },
  towerFlags: { pole: 0, width: r4(97 / PW * midW), amp: 0.16, nota: 'panos presos pela direita, ondulando por fatias. pole 0: prendem direto na ancora' },
  midAnchors: { nota: 'fracoes (x,y) dentro de cada arquivo da camada mid (indice = posicao em files). mid A: flamula na ponta da lanca do guindaste. mid B: 3 panos da barra do toldo da banca de jornal + flamula no pinaculo da estacao.', towerFlags: [FLAGS_A, FLAGS_B] },
  roadside: {
    parallax: 1, cell: 0.34, prob: 0.92, seed: 11, minGap: 0.05, sameTypeGap: 0.62, reach: 0.75, baseY: [0.69, 0.698], nota: 'objetos ANIMADOS na calcada de tras, junto a guia, atras do heroi; sorteio por celula igual ao dos decalques. Animados e parados disputam o MESMO sorteio: nunca se sobrepoem (minGap) e o mesmo tipo nunca aparece duas vezes a menos de sameTypeGap (0.62 SH, mais que uma tela): nunca dois gatos, dois automatos ou duas bandeiras iguais juntos. GATO (pacer): fica sentado mexendo a cauda (quadros 0-3), anda 0.04 SH em 6 passos gingando (quadros 4-5 alternados, base no chao), senta virado para tras e volta. CORVO (hopper): dois tocos a 0.115 SH; fica pousado num (4 poses), voa em arco batendo asas ate o outro, pousa, e depois volta. span = espaco extra a direita reservado no sorteio. Automato: folha de 4 quadros. type: torch (poste de luz a gas + chama em quadros), fire (cesto de carvao em brasa: 3 chamas em quadros + brilho + faiscas), banner (haste + bandeira ondulando), critter (gato: cauda e cabeca; corvo no toco: cauda), sprite com sway (automato balancando a cabeca e o corpo) ou parado',
    pool: [
      { type: 'torch', h: [0.268, 0.28], weight: 5 },
      { type: 'fire', sprite: 'brazier', h: [0.095, 0.102], weight: 2, fire: { y: 0.72, size: 0.62, glow: 2.1, glowAlpha: 0.14, sparks: { n: 8, life: 1.5, spread: 0.5, wobble: 0.3, wind: 0.55, rise: 2.6, radius: 0.036 } } },
      { type: 'banner', flag: 'bannerG', h: [0.3, 0.32], flagW: 0.13, amp: 0.08, weight: 1 },
      { type: 'banner', flag: 'pennR', h: [0.28, 0.3], flagW: 0.14, amp: 0.12, weight: 1 },
      { type: 'pacer', sprite: 'cat', h: [0.08, 0.086], weight: 2, span: 0.045, walk: { dist: 0.04, period: 6, split: [0.38, 0.5, 0.86], sit: 4, steps: 6 } },
      { type: 'sprite', sprite: 'robot', h: [0.1, 0.108], sway: true, swayAmp: 0.75, weight: 2 },
      { type: 'hopper', sprite: 'crowsit', h: [0.112, 0.12], weight: 2, span: 0.115, hop: { post: 'post', dx: 0.115, period: 5, flight: 0.7, fly: 'crowhop', size: 0.16, height: 0.035, cx: 0.42, cy: 0.4 } },
      { type: 'sprite', sprite: 'hydrant', h: [0.078, 0.084], weight: 1 }, { type: 'sprite', sprite: 'mailbox', h: [0.116, 0.122], weight: 1 }, { type: 'sprite', sprite: 'papers', h: [0.084, 0.09], weight: 1 },
      { type: 'sprite', sprite: 'cart', h: [0.098, 0.104], weight: 1 }, { type: 'sprite', sprite: 'bench', h: [0.092, 0.098], weight: 1 }, { type: 'sprite', sprite: 'bike', h: [0.135, 0.142], weight: 1 }]
  },
  torch: { flameY: 0.7, flameSize: 0.105, glowRadius: 2.3, glowAlpha: 0.26, nota: 'fracoes da altura do poste; chama = folha flame (4 quadros, 10 fps), desenhada dentro e na frente do vidro da lanterna. Vale tambem para as chamas do cesto de carvao.' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 390 px = 1 tela): o MESMO decalque (mesmo nome no atlas) nunca aparece duas vezes a menos dessa distancia horizontal; entre dois candidatos iguais vence o de maior prioridade rnd(i,seed,6) (deterministico, vale entre todos os grupos; reach >= sameTypeGap). footClear = faixa vertical em torno da linha dos pes (groundY 0.78) livre de pecas com volume: carvao, bola de jornal, cano quebrado e lata so entram em roadBigBack (base acima da faixa) e roadBigFront (topo abaixo da faixa); pocas de oleo, tampas de bueiro, jornal aberto, parafusos, engrenagens, relogio, folhas, mancha de carvao, remendo de pedras e chave inglesa sao rasos e podem passar sob os pes.',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito: para cada celula i (largura cell), se rnd(i,seed,0) < prob, sorteia item do pool por peso (rnd 1), x = (i + 0.15 + 0.7*rnd 2)*cell, base y em yRange (rnd 3), escala em scale (rnd 4), espelha se rnd 5 < 0.5. Nunca repete.',
    groups: [
      { id: 'calcada', parallax: 1, cell: 0.3, prob: 0.6, seed: 5, yRange: [0.672, 0.69], scale: [0.5, 0.7], flip: true, nota: 'folhas secas e jornal na calcada de tras', pool: [['leaves3', 2], ['leaves5', 2], ['paper', 1], ['stain', 1]] },
      { id: 'ruaTampas', parallax: 1, cell: 0.5, prob: 0.8, seed: 3, yRange: [0.785, 0.799], scale: [0.72, 0.9], flip: true, nota: 'pecas rasas grandes na faixa da pisada, entre a guia e o primeiro trilho',
        pool: [['manhole', 3], ['grate', 2], ['oil2', 3], ['patch', 2], ['paper', 2], ['stain', 2]] },
      { id: 'ruaMiudos', parallax: 1, cell: 0.15, prob: 0.8, seed: 7, yRange: [r3(road[0] + 0.03), r3(road[1] - 0.004)], scale: [0.6, 0.9], flip: true, nota: 'miudos rasos por toda a rua: podem ficar sob os pes',
        pool: [['bolt', 3], ['bolts', 3], ['gear', 3], ['gears', 2], ['watch', 1], ['leaves3', 3], ['leaves5', 3], ['oil1', 3], ['wrench', 1]] },
      { id: 'entreTrilhos', parallax: 1, cell: 0.45, prob: 0.7, seed: 9, yRange: [r3(rails[1] - 0.014), r3(rails[1] - 0.009)], scale: [0.7, 0.85], flip: true, nota: 'pecas rasas grandes entre os dois trilhos',
        pool: [['manhole', 2], ['grate', 3], ['oil2', 3], ['patch', 2], ['stain', 2]] },
      { id: 'roadBigBack', parallax: 1, cell: 0.42, prob: 0.7, seed: 13, yRange: [r3(road[0] + 0.022), r3(road[0] + 0.036)], scale: [0.6, 0.78], flip: true, nota: 'pecas com volume na borda de tras da rua (base acima da faixa dos pes)',
        pool: [['coal3', 3], ['coalheap', 2], ['paperball', 2], ['pipe', 2], ['can', 2]] },
      { id: 'roadBigFront', parallax: 1, cell: 0.3, prob: 0.8, seed: 17, yRange: [r3(rails[1] - 0.013), r3(rails[1] - 0.009)], scale: [0.7, 0.88], flip: true, nota: 'pecas com volume ENTRE os dois trilhos (topo abaixo do primeiro trilho, base acima do segundo): nunca em cima do trilho',
        pool: [['coal3', 3], ['coalheap', 2], ['paperball', 2], ['pipe', 2], ['can', 2]] },
      { id: 'roadBigCurb', parallax: 1, cell: 0.38, prob: 0.6, seed: 19, yRange: [r3(road[1] - 0.004), r3(road[1] - 0.001)], scale: [0.55, 0.7], flip: true, nota: 'pecas com volume pequenas entre o segundo trilho e a guia da frente', pool: [['coal3', 3], ['paperball', 2], ['can', 2]] },
      { id: 'calcadaFrente', parallax: 1, cell: 0.25, prob: 0.5, seed: 8, yRange: [r3(curb[1] + 0.03), r3(curb[1] + 0.05)], scale: [0.7, 1.0], flip: true, nota: 'folhas e manchas na calcada da frente', pool: [['leaves3', 2], ['leaves5', 2], ['stain', 1], ['bolt', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi: cardos e capim seco balancam (skew); monte de carvao com pa, caixote com engrenagens, tambor de oleo e cano de latao com registro ficam parados',
    pool: [
      { sprite: 'thistle', h: [0.15, 0.18], sway: true, weight: 3 }, { sprite: 'drygrass', h: [0.13, 0.16], sway: true, weight: 3 },
      { sprite: 'coalpile', h: [0.11, 0.13], weight: 1 }, { sprite: 'crate', h: [0.12, 0.14], weight: 1 }, { sprite: 'drum', h: [0.13, 0.15], weight: 1 }, { sprite: 'pipe', h: [0.13, 0.15], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 30, yRange: [0.3, 0.96], rgb: '255,214,140', glowRgb: '255,150,70', radius: [0.0012, 0.003], parallax: 0.55, drift: 0.016, blend: 'lighter', nota: 'fuligem em brasa e poeira flutuando e piscando' },
  bottomShade: { from: 0.94, alpha: 0.3, rgb: '40,24,18' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: Object.assign({
    cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', airship: 'airship.webp', airship2: 'airship2.webp', train: 'train.webp', gear: 'gear.webp', gear8: 'gear8.webp', wheel: 'wheel.webp', prop: 'prop.webp', handM: 'handM.webp', handH: 'handH.webp', railbed: 'railbed.webp',
    crow: { file: 'crow.webp', frames: 6, fps: 11 }, flame: { file: 'flame.webp', frames: 4, fps: 10 },
    pennR: 'pennR.webp', pennB: 'pennB.webp', bannerG: 'bannerG.webp', awn: 'awn.webp', pole: 'pole.webp',
    torch: 'torch.webp', brazier: 'brazier.webp', cat: { file: 'cat.webp', frames: 6, fps: 2.6 }, robot: { file: 'robot.webp', frames: 4, fps: 2.2 }, crowsit: { file: 'crowsit.webp', frames: 4, fps: 1.7 }, post: 'post.webp', crowhop: { file: 'crowhop.webp', frames: 6, fps: 11 }, hydrant: 'hydrant.webp', mailbox: 'mailbox.webp', papers: 'papers.webp', cart: 'cart.webp', bench: 'bench.webp', bike: 'bike.webp',
    thistle: 'thistle.webp', drygrass: 'drygrass.webp', coalpile: 'coalpile.webp', crate: 'crate.webp', drum: 'drum.webp', pipe: 'pipe.webp',
    bolt0: 'bolt0.webp', bolt1: 'bolt1.webp', bolt2: 'bolt2.webp', bolt3: 'bolt3.webp'
  }),
  animated: [
    { id: 'ceu_deriva', tipo: 'ceu derivando devagar, independe da corrida' }, { id: 'nuvens_2_vel', tipo: 'nuvens de fuligem em 2 velocidades' },
    { id: 'dirigiveis', tipo: '2 dirigiveis cruzando o ceu em distancias e velocidades diferentes, flutuando, com as helices girando' },
    { id: 'trem_no_viaduto', tipo: 'trem a vapor cruzando o viaduto de ferro ao fundo, por tras das chamines e da torre, com rodas e bielas girando e fumaca saindo da chamine' },
    { id: 'corvos', tipo: '2 grupos de corvos batendo asas (quadros)' },
    { id: 'relogio_da_torre', tipo: 'ponteiro dos minutos em rotacao continua (1 volta em 40 s), ponteiro das horas a 1/12 da velocidade + mostrador pulsando' },
    { id: 'fumaca_cidade', tipo: 'fumaca das 3 chamines distantes, com contorno' }, { id: 'nevoa', tipo: 'nevoa de carvao deslizando na base da cidade e no pe dos predios' },
    { id: 'engrenagem_gigante', tipo: 'par engrenado girando de verdade por tras da fabrica: 16 dentes num sentido, 8 dentes no sentido oposto com o dobro da velocidade' },
    { id: 'fumaca_chamines', tipo: 'fumaca das 2 chamines da fabrica e da chamine do guindaste em baforadas, com contorno no traco da arte' },
    { id: 'janelas_fornalha', tipo: '6 janelas da fabrica pulsando com o fogo das fornalhas' },
    { id: 'vapor_valvulas', tipo: 'vapor continuo no topo da caldeira + jatos em pulsos nas 2 valvulas, com contorno' },
    { id: 'faiscas_de_solda', tipo: 'clarao azulado piscando e faiscas caindo em arco no guindaste' },
    { id: 'flamulas_e_toldo', tipo: 'flamula no guindaste, flamula na estacao e barra do toldo da banca tremulando' },
    { id: 'trem_da_estacao', tipo: 'trem a vapor que entra, cruza o galpao aberto da estacao e sai, por tras da ferragem e dos predios, com rodas e bielas girando sobre o trilho da mureta e fumaca ficando para tras' },
    { id: 'vapor_do_bueiro', tipo: 'vapor subindo da tampa de bueiro da estacao, com contorno' },
    { id: 'bobina_de_tesla', tipo: '4 raios em ziguezague piscando em rajadas + brilho azulado' },
    { id: 'luzes', tipo: 'lampiao a gas da estacao e vigias da oficina pulsando' },
    { id: 'postes_a_gas', tipo: 'postes de luz a gas na calcada com chama em quadros e brilho' }, { id: 'cesto_de_brasas', tipo: 'cesto de carvao: 3 chamas em quadros, brilho e faiscas' },
    { id: 'bandeiras_calcada', tipo: 'estandarte da engrenagem e flamula vermelha em hastes' },
    { id: 'gato', tipo: 'gato preto: senta mexendo a cauda, anda alguns passos gingando e volta' }, { id: 'automato', tipo: 'automato de latao: cabeca em 4 quadros + corpo balancando' }, { id: 'corvo_nos_tocos', tipo: 'corvo que pula de um toco a outro batendo asas e pousa' },
    { id: 'fuligem_e_poeira', tipo: 'fuligem em brasa e poeira flutuando e piscando' }, { id: 'primeiro_plano', tipo: 'cardos e capim seco balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
console.log('meta.json', s.length, 'bytes', 'far', r3(farTop), FARB, 'deck', deckY, 'rua', road, 'guias', curb, 'trilhos', rails, 'midW', r3(midW), 'farW', r3(farW), 'fx', m.fx.length, 'engrenagem 8', r3(G2.x), r3(G2.y));
