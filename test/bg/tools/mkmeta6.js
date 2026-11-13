// Gera assets/bg/v2/era6/meta.json a partir de work/info.json (saida do build6.js).
// uso: node mkmeta6.js <pastaTrabalho> <pastaSaida>     (ou: node mkmeta6.js --info tools/info.era6.json <pastaSaida>)
// Era 6 (Futurista, cidade neon a noite): so blocos que o scene.js ja tem (actors sky/far/mid com parts e smoke, rotors com flap, props com tilt,
// fx flow/glow/plume/embers, sunRays, roadside lantern/pacer/hopper/critter/vent/sway). O scene.js NAO muda.
const fs = require('fs');
const infoFile = process.argv[2] === '--info' ? process.argv[3] : process.argv[2] + '/work/info.json';
const info = JSON.parse(fs.readFileSync(infoFile, 'utf8'));
const OUT = process.argv[process.argv[2] === '--info' ? 4 : 3];
const r3 = v => Math.round(v * 1000) / 1000, r4 = v => Math.round(v * 10000) / 10000;
const L = (id, o, px, height) => Object.assign({ id }, o, { px, height, repeatWidth: r3(height * px[0] / px[1] * (o.tile === 'repeat' ? 1 : 2)) });
const G = { top: 0.60, height: 0.408 }, SKYH = 0.62, FARH = 0.5, FARB = 0.565, MID = { bottom: 0.622, height: r3(info.midRaw[1] * 0.0005) };
const gy = f => r3(G.top + f * G.height), road = info.road.map(gy), curb = info.curb.map(gy), line = info.line.map(gy);
const farTop = FARB - FARH, midW = MID.height * info.midRaw[0] / info.midRaw[1];
const hex = c => '#' + c.map(v => ('0' + Math.round(v).toString(16)).slice(-2)).join('');
const S = info.spr, hOf = (n, w) => w * S[n][1] / S[n][0];
// ---- ancoras medidas nas previas de 1584 px de largura dos dois trechos do mid (fracao x,y de cada arquivo)
const PW = 1584, PH = 1584 * info.midRaw[1] / info.midRaw[0], P = (x, y) => ({ x: r4(x / PW), y: r4(y / PH) });
const A = l => [l, []], B = l => [[], l];
// ---- far: fracoes do arquivo far.webp (topo do tabuleiro da via elevada medido em recorte ampliado)
const DECK = 0.508, deckY = r4(farTop + DECK * FARH);
const FW = 1400, FHraw = 3168 / 1400, farY = py => r4((py * FHraw - info.farCrop[1]) / info.farCrop[3]);
const SPIRES = [[218, 52], [280, 65], [352, 102], [770, 58], [1177, 85], [1284, 47], [107, 120], [527, 200], [856, 170], [1030, 88]].map(q => ({ x: r4(q[0] / FW), y: farY(q[1]) }));
// ---- fumaca/vapor com contorno: o mesmo plume duas vezes (mesma semente). 1o passe: discos maiores na cor do traco; 2o: os 2 tons por cima.
const OUTL = '#1c1838', RIM = 0.0022;
const pair = (id, base, fillC, alphaO, fadeO, rim) => [
  Object.assign({ id: id + '_traco', type: 'plume' }, base, { r0: r4(base.r0 + (rim || RIM)), light: OUTL, dark: OUTL, alpha: alphaO, fade: fadeO }),
  Object.assign({ id: id, type: 'plume' }, base, fillC)];
const STEAM = { light: '#d9d0f2', dark: '#9b8fc6', alpha: 0.85, fade: 0.78 };
// ---- mascaras de neon (retangulos medidos pelo build6 na propria arte)
const MK = info.masks, mrect = n => MK[n].rect.map(r4);
const neon = (id, mask, rgb, o) => Object.assign({ id, type: 'flow', layer: 'mid', tile: MK[mask].tile, mask, rect: mrect(mask), rgb, blend: 'lighter', maxScale: 1.5, bands: [] }, o);
// arcos: retangulo [1100,196,1276,264] da previa; alfa = base*(1+pulse*sin) > 0 so perto do pico do seno (base -2, pulse -1.2 -> acende com sin > 0,83: ~1/5 do ciclo)
const ARC = [r4(1100 / PW), r4(196 / PH), r4(176 / PW), r4(68 / PH)];
const arc = (k, loop, cyc) => ({ id: 'arco_' + k, type: 'flow', layer: 'mid', tile: 1, mask: 'arc' + k, rect: ARC, rgb: '190,245,255', blend: 'lighter', loop, frames: Math.round(loop * 24), maxScale: 1.5, bands: [], base: -2, pulse: -1.2, pulseCycles: cyc });
// ---- veiculos flutuantes: jatos na base (exaustao = plume para baixo, claro e curto)
const JET = { n: 3, life: 0.35, rise: -0.014, wind: -0.01, spread: 0.003, wobble: 0.0015, r0: 0.0016, grow: 0.0028, fadeIn: 0.05, alpha: 0.55, light: '#d8fcff', dark: '#8fe6fb', fade: 0.45, seed: 61 };
const JETS = { carP: [0.19, 0.83], taxi: [0.2, 0.82], van: [0.2, 0.82], police: [0.2, 0.82], bus: [0.27, 0.8], truck: [0.2, 0.81] };
const veh = (id, name, slot, x, w, baseY, parallax, speed, loop, jets, bob) => { const h = r4(hOf(name, w)); const a = { id, slot, sprite: name, x, y: r4(baseY - h), w, parallax, drift: -speed, loop };
  if (bob) { a.bob = bob; a.bobF = 1.7; } if (jets && JETS[name]) a.smoke = [JETS[name][0], JETS[name][1] || 1 - JETS[name][0]].map(jx => Object.assign({ x: jx, y: 0.97 }, JET)); return a; };
const FS = 0.08, MS = 0.16;
const m = {
  version: 2, era: 6, nome: 'Era Futurista - cidade neon a noite: arranha-ceus com fitas de luz, via elevada com trem maglev, carros flutuantes, nave-mae com fachos, holograma e rua de placas com linhas rosa',
  unidades: 'Tudo em FRACAO DA ALTURA DA CENA (SH), inclusive medidas horizontais, salvo quando dito. px = valor * SH. Velocidades em SH por segundo. x do heroi em fracao da LARGURA. Cena de referencia: 390 x 692 px CSS (campo de batalha no topo de uma tela 390x844; linha do chao = 0.78*692 = 540 px = 64% da tela, igual ao jogo).',
  scene: { refWidth: 390, refHeight: 692 },
  groundY: 0.78, runSpeed: 0.275,
  hero: {
    file: 'hero_run.png', frames: 8, fps: 12, frameW: 256, frameH: 256, x: 0.30, size: 0.2643, footY: 0.947, figureHeight: 0.231,
    nota: 'Folha de corrida do Kael (a mesma das eras 0 a 5). size = lado do quadro 256 em SH. footY = fracao do quadro onde ficam os pes. Desenhar em (x*W - size/2, groundY - size*footY).',
    shadow: { rx: 0.21, ry: 0.05, alpha: 0.4, nota: 'elipse sob os pes; rx/ry em fracao de size' },
    stepDust: { color: '#9d93d0', perStep: 3, life: [0.45, 0.65], radius: [0.004, 0.012] }
  },
  layers: [
    Object.assign(L('sky', { file: 'sky.webp', tile: 'repeat', parallax: 0.015, drift: 0.004, top: 0 }, info.sky, SKYH), { nota: 'ceu noturno procedural: indigo -> violeta -> bruma rosa no horizonte, com estrelas. Repete em si mesmo (ladrilho de 1024 px)' }),
    Object.assign(L('far', { file: 'far.webp', tile: 'mirror', parallax: 0.06, drift: 0, offset: 0.13, bottom: FARB }, info.far, FARH), { deckY, nota: 'skyline neon (arranha-ceus com fitas de luz, torres-disco, agulhas, cupulas, telas) e VIA ELEVADA de ponta a ponta (deckY = topo do tabuleiro, em SH): o trem maglev e os carros flutuantes rodam em cima dela (actors slot far). Ladrilho ESPELHADO. A base some na bruma violeta (alfa)' }),
    Object.assign(L('mid', { files: ['midA.webp', 'midB.webp'], filesLow: ['midA_lo.webp', 'midB_lo.webp'], tile: 'sequence', parallax: 0.38, drift: 0, bottom: MID.bottom }, info.midRaw, MID.height), { nota: 'A: lojinha de lamen com placa holografica redonda e toldo, torre de vidro com fitas rosa/ciano, eletroposto com cabos, painel holografico em trelica, guarita com mastro e plataforma (antena girando em cima). B: ponto de onibus de vidro translucido com 2 paineis, oficina de robos (braco robotico do telhado e sprite que se mexe), quiosque com tubos rosa e maquinas, subestacao com 2 bobinas e arcos eletricos, torre de comunicacao com luzes. Nos vaos aparecem a cidade distante e o transito voador de tras (actors slot mid)' }),
    Object.assign(L('ground', { file: 'ground.webp', tile: 'repeat', parallax: 1, drift: 0, top: G.top }, info.ground, G.height), { roadY: road, curbY: curb, lineY: line, nota: 'calcada de placas violeta (borda de cima esmaecida sobre o pe dos predios), guia com fita ciano, pista lisa com grade fina (roadY) e 2 linhas rosa continuas (lineY), guia com fita ciano, calcada. Os pes (groundY) caem na pista, acima das linhas rosa' })
  ],
  tileNota: 'repeat: emenda nela mesma. mirror: alternar normal/espelhada. sequence: arquivos de files em ordem (A,B,A,B...). repeatWidth = largura do ciclo completo em SH. off(camada) = scroll*parallax + t*drift + offset.',
  drawOrder: ['sky (estrelas)', 'clouds: planeta, lua e NAVE-MAE fixos no alto; nuvens violeta em 2 velocidades', 'actors(sky): transito voador alto (onibus, caminhao e 2 carros com jatos)', 'birds (passaros-robo)', 'far', 'actors(far): trem maglev e 4 carros flutuantes na via elevada', 'farFill (transparente)', 'fx(far): luzes piscando nas pontas das agulhas', 'haze', 'fog[0]', 'sunRays: 3 fachos da nave-mae pulsando', 'actors(mid): drone de entrega e transito voador de tras (5 veiculos com jatos)', 'rotors(mid)? nenhum', 'props(mid) antes: nenhum', 'mid', 'props(mid) depois: braco robotico balancando', 'fx(mid): neon da placa, das fitas da torre, do eletroposto, holograma com varredura, paineis do ponto, tubos do quiosque, bobinas, 3 arcos eletricos, faiscas, janelas, luzes da torre, vapor', 'fog[1]', 'ground', 'decals', 'roadside', 'hero', 'motes', 'fg', 'bottomShade'],
  placeholder: { sky: [hex(info.skyTop), hex(info.skyHi), hex(info.skyMid), hex(info.skyLow), hex(info.skyBottom), hex(info.skyBottom)], ground: [[curb[0], '#4a3a86'], [road[0], '#2c3a6c'], [road[1], '#263868'], [curb[1], '#2c3a6c'], [1.001, '#4a3a86']], nota: 'fundo desenhado no primeiro quadro, antes de qualquer imagem: degrade do ceu ate o topo do chao e faixas [ate y, cor] do chao. filesLow = versoes leves (880 px) carregadas primeiro e trocadas pelas definitivas.' },
  spacing: 'Distancia minima (decals.minGap, roadside.minGap, fg.minGap, em SH): cada candidato tem caixa [x0,x1,y0,y1] e prioridade rnd(i,seed,6). Um candidato so e desenhado se nenhum outro candidato cuja caixa, aumentada de minGap, encoste na dele tiver prioridade maior. Vale entre todos os grupos de decalques juntos; em roadside e fg a caixa e so horizontal. Deterministico por celula: nao depende da rolagem. reach = quanto olhar alem da tela (SH) para achar vizinhos.',
  farFill: { color: 'rgba(0,0,0,0)', nota: 'transparente nesta era: atras da cidade fica a bruma rosa do ceu' },
  rotors: [
    { id: 'antena_guarita', sprite: 'dish', layer: 'mid', tile: 0, flap: true, ang: 1.5708, x: r4(1503 / PW), y: r4(178 / PH - 0.048 / 2 / MID.height), w: r4(0.048 / midW), period: 4.2, phase: 0.6 }
  ],
  rotorsNota: 'Sprites girando presos a uma camada (x, y = fracao do arquivo; w = fracao da largura do arquivo; period = s por volta). flap: true = giro em torno do eixo vertical visto de lado: o sprite (guardado deitado) fica no angulo ang e achata em cosseno (passa por zero e espelha). ANTENA PARABOLICA na plataforma do mastro da guarita (1 volta em 4,2 s), apoiada no tampo da plataforma.',
  props: [
    { id: 'braco_robotico', sprite: 'arm', layer: 'mid', tile: 1, front: true, rect: info.arm.rect.map(r4), tilt: { deg: 11, period: 4.6, phase: 0, pivot: [0.229, 0.976] } }
  ],
  propsNota: 'Sprites soltos presos a uma camada (rect = fracao do arquivo da camada). BRACO ROBOTICO do telhado da oficina: recortado da arte e balancando 11 graus em torno da base (pivot), apoiado no telhado.',
  sunRays: { origin: [r4(0.3 + 0.5 * 0.24), r4(-0.004 + 0.72 * 0.24 * S.mship[1] / S.mship[0])], length: 0.34, count: 3, angle0: r4(Math.PI / 2 - 0.33), angleStep: 0.33, halfWidth: [0.04, 0.06], alpha: [0.05, 0.13], pulse: 1.4, rgb: '120,235,255', blend: 'lighter', nota: 'FACHOS DA NAVE-MAE: 3 cones de luz ciano saindo da base da nave fixa no alto, descendo sobre a cidade e pulsando' },
  actors: [
    veh('via_trem', 'train', 'far', 0.3, 0.17, r4(deckY + 0.004), 0.06, FS, 3.2), veh('via_carro_rosa', 'carP', 'far', 1.0, 0.04, deckY, 0.06, FS, 3.2), veh('via_van', 'van', 'far', 1.55, 0.04, deckY, 0.06, FS, 3.2), veh('via_taxi', 'taxi', 'far', 2.1, 0.04, deckY, 0.06, FS, 3.2), veh('via_policia', 'police', 'far', 2.65, 0.04, deckY, 0.06, FS, 3.2),
    veh('ceu_onibus', 'bus', 'sky', 0.2, 0.11, 0.2, 0.025, 0.05, 3.0, true, 0.005), veh('ceu_carro', 'carP', 'sky', 1.4, 0.055, 0.12, 0.03, 0.09, 2.6, true, 0.004),
    veh('ceu_caminhao', 'truck', 'sky', 1.1, 0.085, 0.27, 0.035, 0.035, 3.4, true, 0.004), veh('ceu_policia', 'police', 'sky', 0.4, 0.05, 0.075, 0.02, 0.12, 3.8, true, 0.004),
    { id: 'drone_entrega', slot: 'mid', sprite: 'drone', x: 0.5, y: 0.36, w: 0.075, parallax: 0.25, drift: -0.07, loop: 2.4, bob: 0.008, bobF: 2.2, parts: [
      { sprite: 'prop', x: 0.13, y: 0.1, w: 0.3, period: 0.13, flap: true, ang: 1.5708 }, { sprite: 'prop', x: 0.87, y: 0.1, w: 0.3, period: 0.11, flap: true, ang: 1.5708, phase: 1.1 }] },
    veh('tras_van', 'van', 'mid', 0, 0.2, 0.5, 0.38, MS, 5.6, false, 0.004), veh('tras_onibus', 'bus', 'mid', 1.0, 0.36, 0.48, 0.38, MS, 5.6, false, 0.004), veh('tras_taxi', 'taxi', 'mid', 2.2, 0.2, 0.5, 0.38, MS, 5.6, false, 0.004),
    veh('tras_carro_rosa', 'carP', 'mid', 3.3, 0.2, 0.5, 0.38, MS, 5.6, false, 0.004), veh('tras_policia', 'police', 'mid', 4.5, 0.2, 0.5, 0.38, MS, 5.6, false, 0.004)
  ],
  actorsNota: 'Sprites que cruzam a cena (x, y, w em SH; deslocamento = scroll*parallax + t*drift; da a volta a cada loop SH), com pecas presas (x, y = centro em fracao do corpo; w = fracao da largura do corpo; period = s por volta; flap = peca vista de lado, achata em cosseno no angulo ang) e smoke (plumes presos ao corpo: aqui a EXAUSTAO dos jatos, para baixo). slot far = VIA ELEVADA: trem maglev e 4 carros flutuantes na mesma velocidade (nunca se atravessam), base no tabuleiro. slot sky = transito voador alto, atras da skyline (cada faixa com altura e velocidade proprias). slot mid = atras dos predios do plano medio: DRONE de entrega (2 helices batendo, sobe e desce) e 5 veiculos voadores na mesma faixa e velocidade, que aparecem nos vaos. Todos os veiculos flutuam com jatos ciano embaixo (voam de verdade, nao ha estrada).',
  fx: [
    { id: 'luzes_agulhas', type: 'glow', layer: 'far', anchors: [SPIRES], radius: 0.007, alpha: 0.8, pulse: 4.2, rgb: ['255,150,200', '255,70,150', '255,0,120'], margin: 0.2, nota: 'luzes rosa piscando nas pontas das agulhas distantes' },
    neon('neon_placa_lamen', 'mSign', '210,150,255', { loop: 4, frames: 48, base: 0.35, pulse: 0.85, pulseCycles: 3, nota: 'anel da placa holografica respirando' }),
    neon('neon_fitas_rosa', 'mTowerP', '255,110,210', { loop: 3.2, frames: 48, base: 0.18, pulse: 0.5, pulseCycles: 1, bands: [{ len: 0.12, cycles: 1, alpha: 0.75, peak: 0.6 }], nota: 'pulso de luz descendo pelas fitas rosa da torre' }),
    neon('neon_eletroposto', 'mCanopy', '255,120,220', { loop: 3, frames: 36, base: 0.45, pulse: 1.1, pulseCycles: 5, nota: 'fita rosa do eletroposto piscando' }),
    neon('holograma_painel', 'mBoard', '220,255,255', { loop: 2.4, frames: 36, base: 0.1, pulse: 0.6, pulseCycles: 1, bands: [{ len: 0.022, cycles: 6, alpha: 0.32, peak: 0.5 }, { len: 0.16, cycles: 1, alpha: 0.4 }], nota: 'tela holografica com linhas de varredura descendo' }),
    neon('painel_ponto_esq', 'mPanelL', '210,255,255', { loop: 3.6, frames: 36, base: 0.3, pulse: 0.8, pulseCycles: 2 }),
    neon('painel_ponto_dir', 'mPanelR', '210,255,255', { loop: 2.7, frames: 32, base: 0.3, pulse: 0.8, pulseCycles: 1 }),
    neon('tubos_quiosque', 'mTubes', '255,130,230', { loop: 5.3, frames: 64, base: 0.55, pulse: 0.95, pulseCycles: 9, nota: 'tubos de neon do quiosque tremendo' }),
    neon('bobinas', 'mCoils', '170,245,255', { loop: 1.9, frames: 32, base: 0.3, pulse: 0.9, pulseCycles: 4 }),
    arc(0, 1.7, 1), arc(1, 2.3, 1), arc(2, 3.1, 2),
    { id: 'faiscas_bobinas', type: 'embers', layer: 'mid', anchors: B([P(1108, 254), P(1262, 254)]), n: 7, life: 0.9, speed: 0.05, angle: 2.6, gravity: 0.09, wind: 0, wobble: 0.004, radius: [0.0011, 0.002], rgb: '215,252,255', glowRgb: '90,210,255', seed: 93 },
    { id: 'brilho_bobinas', type: 'glow', layer: 'mid', anchors: B([P(1108, 262), P(1262, 262)]), radius: 0.035, alpha: 0.3, pulse: 7, rgb: ['220,255,255', '120,230,255', '40,160,255'] },
    { id: 'janelas_A', type: 'glow', layer: 'mid', anchors: A([P(240, 488), P(1365, 466), P(1432, 468)]), radius: 0.035, alpha: 0.2, pulse: 2.6, rgb: ['220,255,255', '120,230,255', '60,160,255'] },
    { id: 'porta_torre', type: 'glow', layer: 'mid', anchors: A([P(590, 520)]), radius: 0.045, alpha: 0.2, pulse: 1.6, rgb: ['255,220,255', '255,140,230', '200,60,200'] },
    { id: 'luz_mastro', type: 'glow', layer: 'mid', anchors: A([P(1467, 100)]), radius: 0.012, alpha: 0.85, pulse: 5, rgb: ['255,140,130', '255,60,50', '255,0,0'] },
    { id: 'oficina_e_maquinas', type: 'glow', layer: 'mid', anchors: B([P(605, 480), P(860, 488), P(935, 488)]), radius: 0.04, alpha: 0.2, pulse: 2.1, rgb: ['220,210,255', '150,120,255', '80,60,255'] },
    { id: 'luzes_torre_vermelhas', type: 'glow', layer: 'mid', anchors: B([P(1420, 180), P(1476, 180), P(1500, 65), P(1422, 100)]), radius: 0.012, alpha: 0.8, pulse: 6.3, rgb: ['255,150,140', '255,60,60', '255,0,0'] },
    { id: 'luzes_torre_azuis', type: 'glow', layer: 'mid', anchors: B([P(1448, 180), P(1482, 8)]), radius: 0.012, alpha: 0.8, pulse: 4.1, rgb: ['190,230,255', '80,160,255', '0,80,255'] }
  ].concat(
    pair('vapor_lamen', { layer: 'mid', anchors: A([P(132, 305)]), n: 6, life: 3.6, rise: 0.09, wind: -0.03, spread: 0.014, wobble: 0.008, r0: 0.005, grow: 0.016, fadeIn: 0.08, seed: 75 }, STEAM, 0.7, 0.72, 0.0018),
    pair('vapor_oficina', { layer: 'mid', anchors: B([P(640, 312)]), n: 6, life: 3.2, rise: 0.08, wind: -0.035, spread: 0.012, wobble: 0.008, r0: 0.005, grow: 0.014, fadeIn: 0.08, seed: 79 }, STEAM, 0.7, 0.72, 0.0018)),
  fxNota: 'Efeitos presos a uma camada. anchors/rect: fracoes (x,y[,w,h]) dentro do arquivo da camada (indice = posicao em files). flow: laco de loop segundos em frames quadros; cada quadro = mascara (sprite branco com alfa) pintada com rgb, faixas (bands) descendo e alfa base*(1+pulse*sin(2pi*fase*pulseCycles)), limitado a 0..1 pelo canvas. NEON: as mascaras sao os proprios pixels de neon da arte (rosa ou ciano vivo) recortados pelo build6: a luz pinta exatamente as fitas, placa, tubos e telas. ARCOS: 3 ziguezagues com base -2 e pulse -1,2: so acendem perto do pico do seno (clarao curto, cada um no seu ritmo). glow: brilho radial aditivo pulsando. embers: faiscas. plume: vapor com contorno (par com a mesma semente).',
  haze: { y: [0.2, FARB], rgb: '120,60,170', alpha: 0.28 },
  fog: [{ y: 0.455, height: 0.12, parallax: 0.1, drift: 0.012, alpha: 0.5 }, { y: 0.548, height: 0.075, parallax: 0.5, drift: 0.02, alpha: 0.3 }],
  fogTexture: { w: 768, h: 160, blobs: 22, rgb: '150,90,200', alpha: 0.32, nota: 'textura procedural: elipses radiais com posicoes de hash, repetida na horizontal. fog[0] = bruma violeta na base da cidade distante; fog[1] = bruma baixa no pe dos predios' },
  clouds: {
    nota: 'x inicial, y, largura em SH; deslocamento = scroll*parallax + t*drift; cada grupo da a volta a cada period. Grupo 1 FIXO (parallax 0): planeta, lua e NAVE-MAE (balancam de leve). Grupos 2 e 3: nuvens violeta com borda rosa em 2 velocidades.',
    groups: [
      { parallax: 0, drift: 0, alpha: 1, period: 3, items: [{ s: 'planet', x: 0.012, y: 0.03, w: 0.13 }, { s: 'moon', x: 0.21, y: 0.11, w: 0.026 }, { s: 'mship', x: 0.3, y: -0.004, w: 0.24 }] },
      { parallax: 0.02, drift: 0.008, alpha: 0.92, period: 2.4, items: [{ s: 'cloud1', x: 0.15, y: 0.15, w: 0.26 }, { s: 'cloud3', x: 1.3, y: 0.06, w: 0.3 }] },
      { parallax: 0.04, drift: 0.018, alpha: 1, period: 2.8, items: [{ s: 'cloud2', x: 0.75, y: 0.2, w: 0.22 }, { s: 'cloud1', x: 1.95, y: 0.1, w: 0.2 }] }
    ]
  },
  birds: { sprite: 'rbird', flocks: [{ period: 14, duration: 7, y: 0.03, size: 0.04, n: 3, phase: 3, alpha: 1 }, { period: 23, duration: 11, y: 0.005, size: 0.03, n: 4, phase: 12, alpha: 0.95 }], nota: 'passaros-robo (6 quadros de 4 poses): cruzam da esquerda para a direita no alto do ceu; size = lado do quadro em SH' },
  flagWave: { k1: 6.2, w1: 7, k2: 2.4, w2: 2.6, droop: 0.1, sliceCss: 1.5, nota: 'nao usado nesta era (sem bandeiras); mantido pelo formato' },
  roadside: {
    parallax: 1, cell: 0.34, prob: 0.92, seed: 11, minGap: 0.05, sameTypeGap: 0.62, reach: 0.75, baseY: [0.638, 0.644], nota: 'objetos na calcada de tras, atras do heroi; sorteio por celula igual ao dos decalques. Animados e parados disputam o MESMO sorteio: nunca se sobrepoem (minGap) e o mesmo tipo nunca aparece duas vezes a menos de sameTypeGap (0.62 SH, mais que uma tela). POSTE DE LUZ AMBAR (lantern): brilho pulsando. CAO-ROBO (pacer): senta, anda 0.09 SH em ciclo de 4 passos, senta virado e volta. PASSARO-ROBO (hopper): dois pilaretes de recarga a 0.13 SH; fica pousado num (em pe / bicando), voa em arco batendo asas ate o outro, pousa, e volta. GATO-ROBO (critter): cauda e cabeca. RESPIRO DE VAPOR (vent): baforadas em pulsos. LIXEIRA-ROBO e PALMEIRA balancam. span = espaco extra a direita reservado no sorteio.',
    pool: [
      { type: 'lantern', h: [0.27, 0.285], weight: 4 },
      { type: 'pacer', sprite: 'rdog', h: [0.075, 0.08], weight: 3, span: 0.1, walk: { dist: 0.09, period: 7, split: [0.3, 0.5, 0.8], sit: 1, steps: 8 } },
      { type: 'hopper', sprite: 'rbirdsit', h: [r4(0.06 * info.rbird.frame[1] / info.rbird.bollardH), r4(0.064 * info.rbird.frame[1] / info.rbird.bollardH)], weight: 2, span: 0.13, hop: { post: 'bollardP', dx: 0.13, period: 5, flight: 0.7, fly: 'rbird', size: 0.05, height: 0.04, cx: 0.5, cy: r4(info.rbird.cy) } },
      { type: 'critter', sprite: 'rcat', h: [0.07, 0.075], weight: 2, tail: { x: 0.32, f: 3.2, k: 4, amp: 0.1 }, head: { x: 0.72, f: 1.3, amp: 0.03 } },
      { type: 'vent', sprite: 'vent', h: [0.05, 0.054], weight: 2, vent: { y: 0.75, period: 4.2, duration: 1.8, idle: 0.12, n: 7, life: 1.7, rise: 0.12, wind: -0.02, spread: 0.02, wobble: 0.006, r0: 0.006, grow: 0.02, fadeIn: 0.08, alpha: 0.6, light: '#ddd6f6', dark: '#9d92c8', fade: 0.7, seed: 83 } },
      { type: 'sprite', sprite: 'rbin', h: [0.075, 0.08], weight: 1, sway: true, swayAmp: 0.35 }, { type: 'sprite', sprite: 'palm', h: [0.12, 0.13], weight: 1, sway: true, swayAmp: 0.6 },
      { type: 'sprite', sprite: 'vend', h: [0.13, 0.135], weight: 1 }, { type: 'sprite', sprite: 'bench', h: [0.07, 0.075], weight: 1 }, { type: 'sprite', sprite: 'screen', h: [0.15, 0.16], weight: 1 },
      { type: 'sprite', sprite: 'hydrant', h: [0.07, 0.075], weight: 1 }, { type: 'sprite', sprite: 'pbox', h: [0.1, 0.105], weight: 1 }, { type: 'sprite', sprite: 'scooter', h: [0.08, 0.085], weight: 1 }, { type: 'sprite', sprite: 'barrier', h: [0.07, 0.075], weight: 1 }]
  },
  lantern: { glowY: 0.9, glowRadius: 0.22, glowAlpha: 0.32, nota: 'brilho ambar do poste de luz: centro a glowY da altura (de baixo), raio em fracao da altura; pulsa' },
  decals: {
    file: 'decals.webp', atlas: info.decals.rects, pxScale: 0.00046, minGap: 0.012, reach: 0.62, sameTypeGap: 0.564, footClear: [0.765, 0.8],
    regras: 'sameTypeGap (SH; 0.564 = 1 tela): o MESMO decalque nunca aparece duas vezes a menos dessa distancia horizontal. footClear = faixa vertical em torno da linha dos pes (groundY 0.78) livre de pecas com volume: lata, copo, sucata, celula e cabo so entram em ruaTras (base acima da faixa) e ruaFrente (abaixo das linhas rosa). Tampas, escotilha, grade, pocas, rachaduras, chapa, marca de derrapagem, parafusos, chip e folhas sao rasos e podem passar sob os pes. NADA cai sobre as 2 linhas rosa (lineY).',
    nota: 'atlas: nome -> [x,y,w,h] em px. tamanho na cena = px * pxScale * escala (em SH). Espalhamento pseudoaleatorio infinito por celula (rnd), nunca repete.',
    groups: [
      { id: 'calcada', parallax: 1, cell: 0.32, prob: 0.5, seed: 5, yRange: [0.622, 0.638], scale: [0.4, 0.55], flip: true, nota: 'folhas, panfleto e copo na calcada de tras', pool: [['leaves', 3], ['flyer', 1], ['cup', 1], ['bolts', 1]] },
      { id: 'ruaTras', parallax: 1, cell: 0.42, prob: 0.7, seed: 13, yRange: [r3(road[0] + 0.03), r3(road[0] + 0.05)], scale: [0.5, 0.66], flip: true, nota: 'pecas com volume na borda de tras da pista (base acima da faixa dos pes)', pool: [['can', 2], ['cup', 2], ['scrap', 2], ['cell', 2], ['cable', 2]] },
      { id: 'ruaRasos', parallax: 1, cell: 0.5, prob: 0.8, seed: 3, yRange: [0.782, r3(line[0] - 0.006)], scale: [0.62, 0.8], flip: true, nota: 'pecas rasas grandes na faixa da pisada, sempre acima das linhas rosa',
        pool: [['manhole', 3], ['hatch', 2], ['grate', 2], ['oil', 2], ['puddle', 2], ['patch', 2], ['crackp', 1], ['crack', 2], ['skid', 2]] },
      { id: 'ruaMiudos', parallax: 1, cell: 0.16, prob: 0.75, seed: 7, yRange: [r3(road[0] + 0.03), r3(line[0] - 0.006)], scale: [0.55, 0.8], flip: true, nota: 'miudos rasos na pista de tras: podem ficar sob os pes', pool: [['bolts', 3], ['chip', 3], ['leaves', 3], ['shard', 2], ['flyer', 1], ['crack', 2]] },
      { id: 'ruaFrente', parallax: 1, cell: 0.34, prob: 0.8, seed: 17, yRange: [r3(line[1] + 0.05), r3(road[1] - 0.004)], scale: [0.62, 0.82], flip: true, nota: 'pista da frente, abaixo das linhas rosa (o topo de cada peca fica abaixo delas)',
        pool: [['manhole', 2], ['grate', 2], ['oil', 2], ['puddle', 2], ['crack', 2], ['patch', 2], ['can', 2], ['scrap', 2], ['cup', 1], ['pcb', 2], ['cell', 1], ['skid', 1]] }]
  },
  fg: {
    parallax: 1.3, cell: 0.4, prob: 0.8, seed: 21, minGap: 0.03, reach: 0.6, baseY: [1.02, 1.05], nota: 'primeiro plano, na frente do heroi: samambaia alienigena e capim teal balancam (skew); cristais, caixote e cabos ficam parados',
    pool: [
      { sprite: 'fern', h: [0.14, 0.17], sway: true, weight: 3 }, { sprite: 'agrass', h: [0.13, 0.16], sway: true, weight: 3 },
      { sprite: 'crystal', h: [0.12, 0.14], weight: 1 }, { sprite: 'crate', h: [0.11, 0.13], weight: 1 }, { sprite: 'cables', h: [0.08, 0.1], weight: 1 }]
  },
  sway: { a1: 0.10, f1: 1.9, a2: 0.04, f2: 3.1, bias: -0.05 },
  motes: { count: 24, yRange: [0.3, 0.96], rgb: '190,245,255', glowRgb: '170,110,255', radius: [0.0012, 0.0028], parallax: 0.55, drift: 0.016, blend: 'lighter', nota: 'particulas de luz ciano/violeta flutuando e piscando' },
  bottomShade: { from: 0.94, alpha: 0.32, rgb: '10,6,30' },
  rnd: 'rnd(i,seed,k): x=imul(i|0,0x9E3779B1)^imul(seed*31+k+1,0x85EBCA6B); x^=x>>>15; x=imul(x,0x2C1B3C6D); x^=x>>>12; x=imul(x,0x297A2D39); x^=x>>>15; return (x>>>0)/2^32',
  sprites: {
    cloud1: 'cloud1.webp', cloud2: 'cloud2.webp', cloud3: 'cloud3.webp', planet: 'planet.webp', moon: 'moon.webp', mship: 'mship.webp', rbird: { file: 'rbird.webp', frames: 6, fps: 12 },
    train: 'train.webp', carP: 'carP.webp', taxi: 'taxi.webp', van: 'van.webp', police: 'police.webp', bus: 'bus.webp', truck: 'truck.webp', drone: 'drone.webp', prop: 'prop.webp',
    dish: 'dish.webp', arm: 'arm.webp', arc0: 'arc0.webp', arc1: 'arc1.webp', arc2: 'arc2.webp',
    mSign: 'mSign.webp', mTowerP: 'mTowerP.webp', mCanopy: 'mCanopy.webp', mBoard: 'mBoard.webp', mPanelL: 'mPanelL.webp', mPanelR: 'mPanelR.webp', mTubes: 'mTubes.webp', mCoils: 'mCoils.webp',
    lantern: 'lantern.webp', rdog: { file: 'rdog.webp', frames: 5, fps: 2 }, rbirdsit: { file: 'rbirdsit.webp', frames: 2, fps: 0.9 }, bollardP: 'bollardP.webp', rcat: 'rcat.webp', vent: 'vent.webp',
    rbin: 'rbin.webp', palm: 'palm.webp', vend: 'vend.webp', bench: 'bench.webp', screen: 'screen.webp', hydrant: 'hydrant.webp', pbox: 'pbox.webp', scooter: 'scooter.webp', barrier: 'barrier.webp',
    fern: 'fern.webp', agrass: 'agrass.webp', crystal: 'crystal.webp', crate: 'crate.webp', cables: 'cables.webp'
  },
  animated: [
    { id: 'ceu_deriva', tipo: 'ceu estrelado derivando devagar' }, { id: 'nuvens_2_vel', tipo: 'nuvens violeta com borda rosa em 2 velocidades' },
    { id: 'nave_mae', tipo: 'nave-mae parada no alto balancando de leve, com 3 fachos de luz ciano pulsando sobre a cidade' },
    { id: 'transito_voador_alto', tipo: 'onibus, caminhao e 2 carros voando em faixas e velocidades diferentes atras da skyline, com exaustao dos jatos' },
    { id: 'passaros_robo', tipo: '2 grupos de passaros-robo batendo asas (quadros)' },
    { id: 'via_elevada', tipo: 'trem maglev e 4 carros flutuantes correndo na via elevada ao fundo' },
    { id: 'luzes_agulhas', tipo: 'luzes rosa piscando nas pontas das agulhas distantes' }, { id: 'bruma', tipo: 'bruma violeta deslizando na base da cidade e no pe dos predios' },
    { id: 'drone_entrega', tipo: 'drone de entrega voando entre os predios com 2 helices batendo' },
    { id: 'transito_voador_tras', tipo: 'van, onibus, taxi, caminhao e viatura voando atras dos predios (aparecem nos vaos), com exaustao dos jatos' },
    { id: 'antena', tipo: 'antena parabolica girando na plataforma do mastro da guarita' }, { id: 'braco_robotico', tipo: 'braco robotico balancando no telhado da oficina' },
    { id: 'neon', tipo: 'neon da placa do lamen respirando, pulsos de luz descendo pelas fitas da torre, fita do eletroposto e tubos do quiosque piscando' },
    { id: 'holograma', tipo: 'painel holografico com linhas de varredura descendo; paineis do ponto de onibus pulsando' },
    { id: 'subestacao', tipo: 'bobinas pulsando, 3 arcos eletricos em clarao entre elas e faiscas' },
    { id: 'luzes', tipo: 'janelas, porta da torre, oficina e maquinas tremeluzindo; luzes vermelhas e azuis piscando nas torres' },
    { id: 'vapor', tipo: 'vapor com contorno saindo do telhado do lamen e da oficina' },
    { id: 'poste_ambar', tipo: 'postes de luz ambar com brilho pulsando' }, { id: 'cao_robo', tipo: 'cao-robo: senta, anda alguns passos (4 poses), senta e volta' },
    { id: 'passaro_nos_pilaretes', tipo: 'passaro-robo que pula de um pilarete de recarga a outro batendo asas, pousa e bica' },
    { id: 'gato_robo', tipo: 'gato-robo mexendo cauda e cabeca' }, { id: 'respiro_vapor', tipo: 'respiro de vapor na calcada soltando baforadas' },
    { id: 'lixeira_e_palmeira', tipo: 'lixeira-robo e palmeira balancando' },
    { id: 'particulas', tipo: 'particulas de luz flutuando e piscando' }, { id: 'primeiro_plano', tipo: 'samambaia e capim alienigenas balancando na frente' }, { id: 'poeira_passos', tipo: 'poeirinha nos pes do heroi' }]
};
let s = JSON.stringify(m, null, 1);
for (let k = 0; k < 6; k++) s = s.replace(/([\[{])\n\s+([^\[\]{}]*?)\n\s+([\]}])/g, (a, o, b, c) => o + b.replace(/\n\s+/g, ' ') + c);
JSON.parse(s);
fs.writeFileSync(OUT + '/meta.json', s);
// confere: todo sprite do meta existe na pasta e todo arquivo da pasta e usado
const used = new Set(['meta.json', m.hero.file, m.decals.file].concat(...m.layers.map(l => (l.files || [l.file]).concat(l.filesLow || [])), Object.values(m.sprites).map(v => typeof v === 'string' ? v : v.file)));
const have = fs.readdirSync(OUT); console.log('faltando:', [...used].filter(f => !have.includes(f)).join(' ') || '-', '| sobrando:', have.filter(f => !used.has(f)).join(' ') || '-');
console.log('meta.json', s.length, 'bytes', 'far', r3(farTop), FARB, 'via', deckY, 'rua', road, 'guias', curb, 'linhas', line, 'mid', MID.height, 'midW', r3(midW), 'fx', m.fx.length, 'actors', m.actors.length);
