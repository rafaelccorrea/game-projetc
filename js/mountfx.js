'use strict';
/* ================= PACOTE DE MONTARIAS (v0.12.7) — Kael MONTADO na batalha e na vitrine =================
   Módulo: js/sys/mount.js (fps-e2), ligado com DATA.on + DATA.visual (reports/ligar-sistemas-e2.md §4). Arte: assets/anim/mounts/
   kael_<id>_<idle|run|attack>_body.png/.json (Kael SEM arma; grip por quadro; célula 512x352, patas em feetY 339). A arma da mão é a do heroLook,
   desenhada no grip (mesma regra do Kael a pé). Camadas: aura por estrela (código) → corpo montado → arma → dedos → cabeça do Kael (x < grip.x + 8).
   Só as folhas da montaria em uso são carregadas. Chave geral: MOUNTS_ON. */
const MOUNTS_ON = true;
const MOUNT_DIR = 'assets/anim/mounts/';
/* TABELA DE AJUSTE, um conjunto de números por montaria (px da célula de 256 do herói; escala HS/256):
   dx, dy = deslocamento do quadro montado · wx, wy = quanto as COSTAS do Kael andam em relação ao Kael a pé (para a asa) · sh = largura da sombra (× HS) */
const MOUNT_TBL = {
  /* v0.12.7 (PO): pdx, pdy = quanto o PET vai mais à frente (fração da largura do Kael) e mais para baixo (px) nesta montaria, para as patas da FRENTE
     dela ficarem visíveis (montaria grande = mais à frente) · wings = a montaria tem asas: a asa do Kael sobe e recua (wx2, wy2) e ganha contorno claro */
  pony:    { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.34, pdx: 0.55, pdy: 9 },
  horse:   { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.40, pdx: 0.66, pdy: 9 },
  wolf:    { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.42, pdx: 0.70, pdy: 9 },
  griffin: { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.42, pdx: 0.74, pdy: 10, pdx3: 0.66, wings: true, wx2: -14, wy2: 26 },   /* pdx3 = pet EVOLUÍDO (estágio 3, maior): menos à frente, senão a asa dele encosta no inimigo da frente · 0,86 → 0,74: na fumaça da v0.12.7 o pet ficou perto demais do inimigo da frente */
  mythic:  { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.42, pdx: 0.74, pdy: 10 },
  wyvern:  { dx: 0, dy: 0, wx: 6, wy: 0, sh: 0.44, pdx: 0.74, pdy: 10, wings: true, wx2: -14, wy2: 10 },   /* Engenheiro 2: wy2 26 → 10 (na serpe a sela já é alta: com 26 a asa do Kael ficava solta acima da cabeça) · Serpe dourada V2 APROVADA (v0.12.8): de volta à tabela */
};
const mountOk = () => MOUNTS_ON && typeof Sys !== 'undefined' && !!Sys.mount;
function mountBoot(){ if (!mountOk()) return; try { Sys.mount.DATA.on = true; Sys.mount.DATA.visual = true; Sys.mount.ensure(S); } catch (e) { console.error('mountBoot', e); } }
/* o que o herói monta agora: {id, stars, aura} ou null (sem montaria, módulo desligado ou arte não ligada) */
/* Engenheiro 4: só existem folhas montadas do KAEL (assets/anim/mounts/kael_<montaria>_*). Herói sem folha montada (Kaia): NÃO se desenha o Kael no lugar dela;
   a Kaia aparece A PÉ e a montaria não é desenhada na batalha (o bônus da montaria no Sys.mount continua valendo). Quando a Arte entregar kaia_<montaria>_*,
   basta pôr kaia: 'kaia_' aqui. */
/* Engenheiro 6 (v0.12.9): KAIA MONTADA, POR MONTARIA E POR EXISTÊNCIA DO ARQUIVO. O Kael tem folha de todas as montarias da tabela. A Kaia só monta nas
   montarias cuja arte existe (lote 1: pony e horse). FONTE ÚNICA de "existe arte montada": Sys.assets.mountedArt(herói, montaria) (Sistemas; lê o
   assets/manifest.json que o carregamento entrega ao módulo, js/loading.js loadManifest). true = monta com kaia_; false (sem arte: tigre, lobo,
   grifo, serpe) ou null (manifesto ainda não carregado / módulo ausente) = a Kaia fica a pé, como antes (bônus valendo). As que faltam nunca são
   pedidas (sem 404) e ligam SOZINHAS quando os arquivos entrarem no manifesto. A pré-carga usa o mesmo caminho (mountSheet → mountPrefix).
   mountPrefix(id) → prefixo da folha desse herói nessa montaria, ou null (a pé). Sem id = a montaria equipada. */
const MOUNT_HERO = { kael: 'kael_', kaia: 'kaia_' };
/* RESERVA enquanto o js/sys/assets.js NÃO está na lista de módulos do index.html (hoje não está: Sys.assets não existe no jogo): o mesmo manifesto, lido
   UMA vez e só com a Kaia, com a MESMA regra do mountedArt (pacote 'mount:<id>' com <herói>_<id>_idle_body.png ou _run_body.png). Com o módulo
   carregado esta reserva nunca roda. */
const MOUNT_MAN = { packs: null, asked: false };
function mountManLoad(){ if (MOUNT_MAN.asked) return; MOUNT_MAN.asked = true; fetch('assets/manifest.json').then(r => r.ok ? r.json() : null).then(m => { MOUNT_MAN.packs = (m && m.packs) || {}; }).catch(() => { MOUNT_MAN.packs = {}; }); }
/* Engenheiro 7 (desempenho): a resposta do manifesto (true/false) fica guardada por herói+montaria: com a Kaia o mountPrefix roda várias vezes por quadro e
   cada consulta varria os arquivos do pacote. null (manifesto ainda não chegou) NÃO é guardado. */
const MOUNT_ART_C = {};
function mountArtOf(h, id){ const ck = h + '|' + id, c = MOUNT_ART_C[ck]; if (c !== undefined) return c;
  const A = window.Sys && Sys.assets; if (A && typeof A.mountedArt === 'function'){ try { const r = A.mountedArt(h, id); if (r === true || r === false) MOUNT_ART_C[ck] = r; return r; } catch (e) { return null; } }
  if (!MOUNT_MAN.packs){ mountManLoad(); return null; } const pk = MOUNT_MAN.packs['mount:' + id], b = MOUNT_DIR + h + '_' + id; return !!(pk && Array.isArray(pk.files) && pk.files.some(p => p === b + '_idle_body.png' || p === b + '_run_body.png')); }
function mountPrefix(id){ const h = (typeof S !== 'undefined' && S && S.hero === 'kaia') ? 'kaia' : 'kael'; if (h === 'kael') return MOUNT_HERO.kael;
  if (id == null){ try { const i = Sys.mount.battleInfo(S); id = i && i.id; } catch (e) { id = null; } }
  return id != null && mountArtOf(h, id) === true ? MOUNT_HERO[h] : null; }
function mountLook(){ if (!mountOk()) return null; try { const i = Sys.mount.battleInfo(S); return i && i.visual && MOUNT_TBL[i.id] && mountPrefix(i.id) ? { id: i.id, stars: i.stars | 0, aura: i.aura } : null; } catch (e) { return null; } }
const mountSheet = (id, st) => sheetLoad(MOUNT_DIR + (mountPrefix(id) || 'kael_') + id + '_' + st + '_body');
function mountReady(id){ let ok = true; for (const st of ['idle', 'run', 'attack']) if (!mountSheet(id, st).ok) ok = false; return ok; }
/* medidas da folha parada (uma vez por montaria): quanto o Kael SOBE (linha do pescoço) e até onde a montaria vai à FRENTE (borda opaca direita) */
const MOUNT_M = {};
function mountMetrics(id0){ const id = id0, key = (mountPrefix(id0) || '') + id0; let m = MOUNT_M[key]; if (m) return m; const sh = mountSheet(id, 'idle'); if (!sh.ok) return null; const M = sh.meta, fy = typeof M.feetY === 'number' ? M.feetY : 339, ax = (M.padLeft || 0) + 128;
  let right = 150, top = 200; try { const b = enBounds(sh)[0]; if (b){ right = b.r - ax; top = fy - b.t; } } catch (e) {}
  /* Engenheiro 10: a referência é SEMPRE a folha parada do corpo padrão (montado usa o corpo padrão mesmo com skin fixa); só guarda a medida com ela pronta */
  let rise = 60, h0 = null; try { h0 = SHEET(HERO_SETS[2].idle); if (h0 && sh.neck && sh.neck.length) rise = (fy - sh.neck[0]) - (HERO_FOOT * 256 - (h0.neck[0] || 76)); } catch (e) {}
  const mm = { right, top, rise: Math.max(0, rise) }; if (h0 || sheetLoad(HERO_SETS[2].idle).fail) MOUNT_M[key] = mm; return mm; }   /* medidas por herói + montaria (a folha da Kaia tem as dela) */
/* quanto o Kael montado fica mais ALTO que a pé (px lógicos): as barras de vida/energia e a asa sobem junto */
function heroRise(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return 0; if (typeof B !== 'undefined' && B.deadT > 0 && typeof ART_ON !== 'undefined' && ART_ON.kael_die === true) return 0;   /* morto: o Kael cai a pé (morte nova); as barras descem com ele */ const m = mountMetrics(mo.id); return m ? m.rise * HS / 256 : 0; }
/* até onde a montaria passa da borda do corpo do Kael a pé, para a direita (px lógicos): o inimigo da frente guarda a folga a partir daí */
function mountFront(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return 0; const m = mountMetrics(mo.id); return m ? Math.max(0, m.right * HS / 256 - (HERO_EDGE - HX)) : 0; }
function mountWingOff(H){ const mo = H.mount; if (!mo || !mountReady(mo.id)) return null; const m = mountMetrics(mo.id), T = MOUNT_TBL[mo.id], k = HS / 256; return m ? { x: (T.wx + (T.wings ? T.wx2 || 0 : 0)) * k, y: -(m.rise + T.wy + (T.wings ? T.wy2 || 0 : 0)) * k, winged: !!T.wings } : null; }
/* deslocamento do pet nesta montaria (tabela) */
function mountPetOff(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return null; const T = MOUNT_TBL[mo.id]; const st3 = typeof PETK !== 'undefined' && PETK.info && (PETK.info.stage | 0) >= 3; return { dx: (st3 && T.pdx3) || T.pdx || 0.62, dy: T.pdy || 9 }; }
const MOUNT_AURA = [null, 'rgba(200,230,255,', 'rgba(120,200,255,', 'rgba(120,200,255,', 'rgba(190,140,255,', 'rgba(255,214,120,'];   // visível já em 1 estrela; mais forte a cada estrela
const MOUNT_GLOW_OFF = typeof DEBUG !== 'undefined' && DEBUG && typeof QP !== 'undefined' && QP.get('mglow') === '0';
const MGLOW = new Map(), MGLOW_MAX = 90, MGLOW_K = 0.25, MHALO = {};
function mountHalo(st){ let c = MHALO[st]; if (c !== undefined) return c; const col = MOUNT_AURA[st]; if (!col) return MHALO[st] = null;
  try { c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 64 * 0.125, 64, 64, 64);
    g.addColorStop(0, col + Math.min(0.95, (0.22 + 0.15 * st) * 1.1).toFixed(2) + ')'); g.addColorStop(0.55, col + '0.33)'); g.addColorStop(1, col + '0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); } catch (e) { c = null; }
  return MHALO[st] = c; }
function mountGlow(sh, fi, stN, FW, FH, k){ const key = sh.base + '|' + fi + '|' + stN; let c = MGLOW.get(key); if (c !== undefined) return c;
  try { const blur = Math.max(1, (6 + 2.4 * stN) / Math.max(0.2, k) * MGLOW_K), pad = Math.ceil(blur * 2) + 2, OFF = 4096;
    c = document.createElement('canvas'); c.width = Math.ceil(FW * MGLOW_K) + pad * 2; c.height = Math.ceil(FH * MGLOW_K) + pad * 2; c._pad = pad; const g = c.getContext('2d');
    g.shadowColor = MOUNT_AURA[stN] + (0.7 + 0.06 * stN).toFixed(2) + ')'; g.shadowBlur = blur; g.shadowOffsetX = OFF;   /* o corpo é desenhado fora do canvas: só a sombra cai dentro */
    for (let i = 0, n = stN >= 5 ? 3 : 2; i < n; i++) g.drawImage(sh.img, sheetSX(sh.meta, fi), sheetSY(sh.meta, fi), FW, FH, pad - OFF, pad, FW * MGLOW_K, FH * MGLOW_K); } catch (e) { c = null; }
  MGLOW.set(key, c); if (MGLOW.size > MGLOW_MAX){ const k0 = MGLOW.keys().next().value, v = MGLOW.get(k0); if (v) v.width = v.height = 1; MGLOW.delete(k0); }
  return c; }
/* Engenheiro 18: PEÇAS DA ROUPA-SKIN NO HERÓI MONTADO (colete/botas por tinta, chapéu/óculos/máscara na cabeça). NASCE DESLIGADO: MOUNT_GEAR_ON = false;
   só liga com ?debug=1&mgear=1 (e as camadas em si continuam atrás de LAYERS_ON: ?debug=1&camadas=1). Sem dado da Arte na folha montada NADA muda e NADA é pedido
   à rede (sem 404): o código só age quando o <herói>_<montaria>_<estado>_body.json traz
     "head": [ {x, y, ang, s, ok} por quadro ]   centro da cabeça do cavaleiro na célula 512x352 (mesmo formato do masks/<herói>_<estado>_head.json a pé)
     "gear": { "mask": true, "hair": true }      existem assets/anim/mounts/masks/<herói>_<montaria>_<estado>_mask.png (R = colete, B = botas, alfa = cobertura;
                                                 SÓ o cavaleiro, nunca a montaria) e _hair.png (cabelo, para chapéu com hideHair), do tamanho exato da folha _body.png
   A tinta usa o layBody do js/stage.js (folha pintada UMA vez por folha + combinação e guardada; por quadro é 1 drawImage); a cabeça repete a conta do layHead. */
const MOUNT_GEAR_ON = false;
const MOUNT_GEAR = MOUNT_GEAR_ON || (typeof DEBUG !== 'undefined' && DEBUG && typeof QP !== 'undefined' && QP.get('mgear') === '1');
const MGEAR = { L: null, M: null, v: null };
function mountGearLay(H, M){ if (!MOUNT_GEAR || typeof layNow !== 'function' || typeof layBody !== 'function') return null; const L = layNow(H); if (!L) return null;
  if (MGEAR.L === L && MGEAR.M === M) return MGEAR.v;   /* mesma leitura das camadas e mesma folha: o objeto pronto (nada criado por quadro) */
  const g = M.gear || null, hm = !!(g && g.mask), hh = !!(g && g.hair), hd = Array.isArray(M.head) && M.head.length > 0; let v = null;
  if (hm || hd) v = { vest: hm ? L.vest : null, boots: hm ? L.boots : null, hat: (hd && hh) ? L.hat : null, tints: L.tints, hHat: hd ? L.hat : null, glasses: hd ? L.glasses : null, mask: hd ? L.mask : null };
  MGEAR.L = L; MGEAR.M = M; return MGEAR.v = v; }
/* chapéu, óculos e máscara na âncora "head" do quadro montado; o ctx já está no espaço da célula (0..512) */
function mountGearHead(M, fi, V){ if (!V || !(V.hHat || V.glasses || V.mask)) return; const a = M.head[fi]; if (!a || a.ok === false) return;
  const one = (def, dir) => { if (!def || !def.pivot) return; const im = layLoad(dir + def.file); if (!im.ok) return; const s = (a.s > 0 ? a.s : 1) / (def.res || 1);
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate((a.ang || 0) * Math.PI / 180); ctx.scale(s, s); ctx.drawImage(im.img, -def.pivot.x, -def.pivot.y); ctx.restore(); };
  if (V.hHat) one(layHat(V.hHat), 'assets/anim/equip/hats/');
  if (V.glasses || V.mask){ const ci = J('assets/anim/equip/cos/cos.json').items || {}; if (V.glasses) one(ci[V.glasses], 'assets/anim/equip/cos/'); if (V.mask) one(ci[V.mask], 'assets/anim/equip/cos/'); } }
/* DERROTA, DECISÃO ATUAL DO PO: A MONTARIA FICA, parada ATRÁS do herói caído (drawMountDead → mountStill*, mais abaixo). O que segue (SAÍDA CORRENDO) é agora
   só a RESERVA: vale para montaria sem imagem em MOUNT_REF ou cuja imagem não carregou a tempo. O recorte do cavaleiro (mountCutFrame) serve aos dois caminhos.
   SAÍDA CORRENDO (decisão anterior; o ícone parado de contorno branco foi REPROVADO: "nada parado"). Até a Arte entregar folha da
   montaria SEM cavaleiro, quando o herói cai (a pé, pela folha da morte) a montaria dá meia-volta e corre para trás: quadros da folha de CORRIDA montada,
   espelhados, deslizando para a esquerda e sumindo em MOUNT_EXIT segundos. Patas na linha do chão o tempo todo (mesmo feetY da folha), sombra e aura por estrela
   deslizam e somem junto; sem contorno. A transparência só desce (sem piscar) e, terminado o tempo, nada mais é desenhado.
   HERÓI NA SELA: a folha de corrida traz o herói montado. Para não aparecer um "segundo herói" enquanto o de verdade cai, o quadro é RECORTADO pelas âncoras que o
   .json já tem (grip = mão na rédea): fica só o que está ABAIXO da linha da sela (grip.y + seat; corpo, patas e cauda da montaria) e o que está À FRENTE do
   cavaleiro (x > grip.x + 8: pescoço e cabeça da montaria, mesma fronteira que o desenho montado já usa para a cabeça do herói). Tronco, cabeça, braços e cachecol
   do herói saem. A borda do corte é esfumada (MOUNT_EXIT_SOFT px) para não ficar risco reto. LIMITES (sem máscara da Arte não dá para fazer melhor): a PERNA do
   herói sobre o flanco continua no quadro (fica abaixo da sela) e o que a montaria tem acima da sela atrás do cavaleiro (ponta da asa do grifo/serpe, alto da
   garupa) é cortado junto. São ~0,5 s, em movimento e sumindo. seat pode ser ajustado por montaria na MOUNT_TBL (campo seat, px da célula; padrão MOUNT_SEAT). */
const MOUNT_EXIT = 0.5, MOUNT_SEAT = 12, MOUNT_EXIT_SOFT = 10, MOUNT_EXIT_RUN = 0.9;   // duração (s) · linha da sela abaixo da mão (px da célula) · esfumado do corte (px) · quanto corre para trás (× HS)
let MOUNT_EXIT_CV = null;
const mountExitU = H => Math.max(0, H.deadP) * 1.6 / MOUNT_EXIT;   /* 0 → 1 ao longo da saída (deadP = 1 - B.deadT/1,6: 1,6 s de queda) */
/* chamado pelo drawHeroDie (js/stage.js) ANTES do corpo caído. Devolve true enquanto desenha a saída; false depois que ela terminou (ou sem montaria). */
/* quadro da folha montada (estado st) SEM o cavaleiro acima da sela, num canvas à parte (um só, reaproveitado): { c, M, T, pad, fy } */
function mountCutFrame(id, st, t){ const T = MOUNT_TBL[id], sh = mountSheet(id, st), M = sh.meta, n = M.frames, FW = M.w, FH = M.h;
  let fi = Math.floor(t * (M.fps || 12)) % n; if (!(fi >= 0 && fi < n)) fi = 0;
  if (Array.isArray(M.skip) && M.skip.indexOf(fi) >= 0){ let p = fi - 1; while (p >= 0 && M.skip.indexOf(p) >= 0) p--; if (p < 0){ p = fi + 1; while (p < n && M.skip.indexOf(p) >= 0) p++; } if (p >= 0 && p < n) fi = p; }
  const G = M.grip[fi] || M.grip[0], seat = Math.max(MOUNT_EXIT_SOFT, Math.min(FH - 1, Math.round(G.y + (typeof T.seat === 'number' ? T.seat : MOUNT_SEAT)))), cutx = Math.max(0, Math.min(FW - 1, Math.round(G.x + 8))), sx = sheetSX(M, fi), sy = sheetSY(M, fi);
  const c = MOUNT_EXIT_CV || (MOUNT_EXIT_CV = document.createElement('canvas')); if (c.width !== FW || c.height !== FH){ c.width = FW; c.height = FH; } const g = c.getContext('2d');
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, FW, FH);
  g.drawImage(sh.img, sx, sy + seat - MOUNT_EXIT_SOFT, cutx, MOUNT_EXIT_SOFT, 0, seat - MOUNT_EXIT_SOFT, cutx, MOUNT_EXIT_SOFT);   // faixa do esfumado, logo acima da sela, atrás do corte
  try { const gr = g.createLinearGradient(0, seat - MOUNT_EXIT_SOFT, 0, seat); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-in'; g.fillStyle = gr; g.fillRect(0, 0, FW, FH); } catch (e) { g.clearRect(0, 0, FW, FH); }
  g.globalCompositeOperation = 'source-over';
  g.drawImage(sh.img, sx, sy + seat, FW, FH - seat, 0, seat, FW, FH - seat);                // abaixo da sela: corpo, patas e cauda
  g.drawImage(sh.img, sx + cutx, sy, FW - cutx, seat, cutx, 0, FW - cutx, seat);            // à frente do cavaleiro: pescoço e cabeça da montaria
  return { c, M, T, pad: M.padLeft || 0, fy: typeof M.feetY === 'number' ? M.feetY : 339 }; }
function drawMountExit(H){ const mo = H.mount; if (!mo || !MOUNT_TBL[mo.id] || !mountPrefix(mo.id) || !mountReady(mo.id)) return false; const u = mountExitU(H); if (!(u < 1)) return false;
  const F = mountCutFrame(mo.id, 'run', H.t), T = F.T, k = HS / 256, gy = H.gy;
  const a = Math.min(1, (1 - u) * 1.8), cx = H.x + HS * 0.12 - u * u * HS * MOUNT_EXIT_RUN;   /* some só na 2ª metade; arranca devagar e acelera (u²) */
  ctx.save(); ctx.globalAlpha = 0.3 * a; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(cx, gy + HS * 0.012, HS * T.sh, HS * 0.055, 0, 0, 7); ctx.fill(); ctx.restore();   // sombra das patas, no chão, junto
  { const stN = Math.max(0, Math.min(5, mo.stars | 0)), hc = (stN && !MOUNT_GLOW_OFF) ? mountHalo(stN) : null; if (hc){ const r = HS * (0.75 + 0.06 * stN); ctx.save(); ctx.globalAlpha = a * 0.75; ctx.drawImage(hc, cx - r, gy - HS * 0.45 - r, r * 2, r * 2); ctx.restore(); } }   // aura por estrela: vai e some com a montaria
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, gy); ctx.scale(-k, k); ctx.drawImage(F.c, -(F.pad + 128 - T.dx + 0.12 * 256), -(F.fy - T.dy)); ctx.restore();   /* espelhada em torno do centro dela (o da sombra): virou e corre para trás */
  return true; }
/* ===== DERROTA: A MONTARIA FICA (decisão do PO) =====
   Parada ATRÁS do herói caído, com a imagem LIMPA dela sozinha que o Códex já usa (assets/mounts/<arquivo>.png: fundo transparente, sem contorno de adesivo),
   virada para a direita como na batalha (as 6 artes já olham para a direita; flip: true espelha se alguma vier ao contrário), RESPIRANDO por código (a altura
   varia MOUNT_BREATH_K a partir da BASE, período MOUNT_BREATH s: as patas não saem da linha do chão) e com a sombra no chão; a aura por estrela continua atrás.
   Patas no chão: a borda opaca de baixo da imagem (medida uma vez) assenta em gy. Mesmo lugar e mesma largura da montaria na folha parada (rs ajusta o tamanho
   por montaria, se a arte de 3/4 parecer maior/menor que a de perfil). TRANSIÇÃO sem teleporte: nos primeiros MOUNT_XFADE s a folha montada parada (sem o
   cavaleiro: mountCutFrame) some enquanto a imagem entra, no mesmo lugar (fade cruzado).
   PESO: os arquivos têm 1 a 4 MB (956 a 1901 px). A imagem só é pedida quando a montaria ENTRA EM CENA (1º desenho montado), é reduzida UMA vez para um canvas de
   MOUNT_STILL_W px de largura e o arquivo grande é solto; só a da montaria em uso fica na memória. Montaria sem imagem na tabela, ou imagem que não chegou
   até a queda: vale a saída correndo (drawMountExit). O caminho é escolhido UMA vez por queda (não troca no meio). */
/* face = para onde a cabeça aponta NO ARQUIVO ('R' direita, 'L' esquerda). Conferido abrindo as 6 imagens (13/11): TODAS olham para a DIREITA, como a montaria
   na batalha, então nenhuma é espelhada. Arte nova virada para a esquerda: face 'L' (o desenho espelha). rs = ajuste de tamanho (padrão 1). */
const MOUNT_REF = { pony: { f: 'mount_pony_ref', face: 'R' }, horse: { f: 'mount_horse_ref', face: 'R' }, wolf: { f: 'mount_wolf_ref', face: 'R' }, griffin: { f: 'mount_griffin_ref', face: 'R' }, mythic: { f: 'mount_mythic_opt_tiger', face: 'R' }, wyvern: { f: 'mount_wyvern_ref', face: 'R' } };   /* os mesmos arquivos do Códex (K_MART, js/p_codex.js) */
const MOUNT_STILL_EDGE = 8;   /* margem mínima da montaria parada até as bordas da cena, em px lógicos (a cena tem sempre LW = 330 de largura lógica: 8 px lógicos = 7 px de tela a 288, 8,7 a 360, 9,5 a 390) */
const MOUNT_STILL = {}, MOUNT_STILL_W = 384, MOUNT_XFADE = 0.3, MOUNT_BREATH = 2.6, MOUNT_BREATH_K = 0.015;
function mountStill(id){ let o = MOUNT_STILL[id]; if (o) return o; for (const k in MOUNT_STILL) delete MOUNT_STILL[k];   /* só a da montaria em uso */
  o = MOUNT_STILL[id] = { c: null, ok: false, fail: false, bb: null }; const R = MOUNT_REF[id]; if (!R){ o.fail = true; return o; }
  try { const im = new Image(); im.onerror = () => { o.fail = true; };
    im.onload = () => { try { const w = im.naturalWidth, h = im.naturalHeight; if (!(w > 0 && h > 0)){ o.fail = true; return; }
        const s = Math.min(1, MOUNT_STILL_W / w), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w * s)); c.height = Math.max(1, Math.round(h * s)); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, w, h, 0, 0, c.width, c.height);
        let bb = { l: 0, r: c.width, t: 0, b: c.height };
        try { const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width, Hh = c.height; let l = W, r = -1, t = Hh, b = -1; for (let y = 0; y < Hh; y++){ const row = y * W * 4 + 3; for (let x = 0; x < W; x++) if (d[row + x * 4] > 140){ if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; } }
          if (r > l && b > t) bb = { l, r: r + 1, t, b: b + 1 }; } catch (e) {}
        o.c = c; o.bb = bb; o.ok = true; } catch (e) { o.fail = true; } };
    im.src = 'assets/mounts/' + R.f + '.png'; } catch (e) { o.fail = true; } return o; }
/* respiração: 1 ± MOUNT_BREATH_K na altura (a largura compensa um terço), sempre a partir da base */
const mountBreath = t => { const b = Math.sin(t * 2 * Math.PI / MOUNT_BREATH); return { sx: 1 - MOUNT_BREATH_K * b / 3, sy: 1 + MOUNT_BREATH_K * b }; };
/* a montaria parada cabe INTEIRA na cena, com margem: primeiro reduz a largura se for maior que a cena, depois empurra para dentro (para a direita se saía pela
   borda esquerda; ela fica atrás do herói caído, que é desenhado por cima). Conta pura: { cx, w }. */
function mountStillFit(cx, w){ const mx = LW - 2 * MOUNT_STILL_EDGE; if (w > mx) w = mx; cx = Math.max(MOUNT_STILL_EDGE + w / 2, Math.min(LW - MOUNT_STILL_EDGE - w / 2, cx)); return { cx, w }; }
/* onde e de que tamanho a imagem parada é desenhada: { cx, gy (linha das patas), s (px lógicos por px do canvas reduzido), w, h, sx, sy (respiração), flip,
   xs (escala final em x: > 0 = como no arquivo; < 0 = espelhada), dx (quanto o encaixe na cena a deslocou; a sombra e a aura vão junto) } */
function mountStillGeo(H){ const mo = H.mount, o = mountStill(mo.id), T = MOUNT_TBL[mo.id], R = MOUNT_REF[mo.id] || {}, k = HS / 256, sh = mountSheet(mo.id, 'idle'); let w = HS * 0.9, cx = H.x + HS * 0.12;
  if (sh.ok){ let b = null; try { b = enBounds(sh)[0]; } catch (e) {} if (b && b.r > b.l){ const ax = (sh.meta.padLeft || 0) + 128; w = (b.r - b.l) * k; cx = H.x + ((b.l + b.r) / 2 - ax + T.dx) * k; } }   /* mesmo lugar e mesma largura da montaria na folha parada */
  w *= R.rs > 0 ? R.rs : 1; const cx0 = cx, F = mountStillFit(cx, w); cx = F.cx; w = F.w;
  const bb = o.bb || { l: 0, r: 1, t: 0, b: 1 }, s = w / Math.max(1, bb.r - bb.l), br = mountBreath(H.t), flip = R.face === 'L';   /* a montaria da batalha olha para a DIREITA: só espelha a arte que olha para a esquerda */
  return { cx, gy: H.gy, s, w, h: (bb.b - bb.t) * s, sx: br.sx, sy: br.sy, flip, xs: (flip ? -1 : 1) * s * br.sx, dx: cx - cx0 }; }
/* caminho desta queda: 'still' (fica, imagem parada) | 'exit' (sai correndo, ESPELHADA, para a esquerda) | null (sem montaria). Decidido no começo da queda.
   'exit' agora só para montaria SEM imagem na tabela ou cuja imagem FALHOU. Imagem ainda CARREGANDO no instante da queda NÃO vira saída correndo (era o único
   caminho que desenhava a montaria virada para a esquerda e saindo pela borda esquerda): a folha montada parada (sem o cavaleiro) fica no lugar até a imagem
   chegar e o fade cruzado começa nesse instante. */
function mountDieMode(H){ const mo = H.mount; if (!mo || !MOUNT_TBL[mo.id] || !mountPrefix(mo.id) || !mountReady(mo.id)){ H._md = null; return null; }
  let d = H._md; if (!d || d.id !== mo.id || H.deadP < d.p - 0.2){ const o = MOUNT_REF[mo.id] ? mountStill(mo.id) : null; d = H._md = { id: mo.id, mode: (o && !o.fail) ? 'still' : 'exit', p: H.deadP, ready0: !!(o && o.ok), tr: null }; } d.p = H.deadP; return d.mode; }
/* chamado pelo drawHeroDie (js/stage.js) ANTES do corpo caído */
function drawMountDead(H){ const mode = mountDieMode(H); if (!mode) return false; if (mode === 'exit') return drawMountExit(H);
  const mo = H.mount, o = mountStill(mo.id), T = MOUNT_TBL[mo.id], k = HS / 256, d = H._md;
  if (o.fail){ d.mode = 'exit'; return drawMountExit(H); }   /* a imagem falhou no meio da espera: reserva */
  const cut = a => { const F = mountCutFrame(mo.id, 'idle', H.t); ctx.save(); ctx.globalAlpha = a; ctx.translate(H.x - (F.pad + 128 - T.dx) * k, H.gy - (F.fy - T.dy) * k); ctx.scale(k, k); ctx.drawImage(F.c, 0, 0); ctx.restore(); };   /* folha montada parada, sem o cavaleiro, no lugar e virada como estava */
  const shadow = dx => { ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(H.x + HS * 0.12 + dx, H.gy + HS * 0.012, HS * T.sh, HS * 0.055, 0, 0, 7); ctx.fill(); ctx.restore(); };   // sombra das patas no chão (a mesma da folha montada)
  if (!o.ok){ shadow(0); cut(1); return true; }   /* imagem ainda carregando: espera no lugar, sem piscar nem virar */
  let u; if (d.ready0) u = Math.max(0, H.deadP) * 1.6 / MOUNT_XFADE; else { if (d.tr == null) d.tr = H.t; u = (H.t - d.tr) / MOUNT_XFADE; } u = Math.max(0, Math.min(1, u));
  const G = mountStillGeo(H), bb = o.bb; shadow(G.dx * u);
  { const stN = Math.max(0, Math.min(5, mo.stars | 0)), hc = (stN && !MOUNT_GLOW_OFF) ? mountHalo(stN) : null; if (hc){ const r = HS * (0.75 + 0.06 * stN), pu = 0.5 + 0.2 * Math.sin(H.t * 2.4); ctx.save(); ctx.globalAlpha = Math.min(1, (0.3 * pu + 0.12) / 0.33); ctx.drawImage(hc, H.x + HS * 0.15 + G.dx * u - r, G.gy - HS * 0.45 - r, r * 2, r * 2); ctx.restore(); } }   // aura por estrela: continua, atrás
  ctx.save(); ctx.globalAlpha = u; ctx.translate(G.cx, G.gy); ctx.scale(G.xs, G.s * G.sy); ctx.drawImage(o.c, -(bb.l + bb.r) / 2, -bb.b); ctx.restore();   /* base (borda opaca de baixo) na linha do chão; a respiração estica para cima; xs > 0 = cabeça para a direita */
  if (u < 1) cut(1 - u);   /* fade cruzado: a folha montada (sem o cavaleiro) some no mesmo lugar */
  return true; }
function drawHeroMounted(H){ if (!H.mount || !mountPrefix(H.mount.id)) return false;   /* herói sem folha montada (Kaia): a pé, nunca o Kael no lugar (vale também para state.mount do drawHeroFull) */
  const id = H.mount.id; if (!mountReady(id)) return false; const T = MOUNT_TBL[id]; if (H.main && MOUNT_REF[id]) mountStill(id);   /* a montaria entrou em cena: pede a imagem dela sozinha (Derrota), uma vez */
  const a = H.deadP >= 0 ? null : H.act, st = a ? 'attack' : (H.walking && H.deadP < 0) ? 'run' : 'idle', sh = mountSheet(id, st), M = sh.meta, n = M.frames, FW = M.w, FH = M.h, pad = M.padLeft || 0, fy = typeof M.feetY === 'number' ? M.feetY : 339, t = H.t;
  let fi = a ? Math.min(n - 1, Math.floor(a.t / Math.max(0.01, a.dur) * n)) : Math.floor(t * (M.fps || 12)) % n; if (!(fi >= 0 && fi < n)) fi = 0;
  if (Array.isArray(M.skip) && M.skip.indexOf(fi) >= 0){ let p = fi - 1; while (p >= 0 && M.skip.indexOf(p) >= 0) p--; if (p < 0){ p = fi + 1; while (p < n && M.skip.indexOf(p) >= 0) p++; } if (p >= 0 && p < n) fi = p; }   /* quadro com artefato (campo "skip" da Arte): usa o quadro limpo mais próximo, de preferência o anterior, com o grip e o back dele */
  const G = M.grip[fi] || M.grip[0], k = HS / 256, gy = H.gy, ws = H.ws;
  const P = PZ; P.dx = P.dy = P.rot = P.rec = P.flash = P.trail = 0; P.sx = P.sy = 1; P.wang = 0;
  let ox = H.x, alpha = 1, rot = 0;
  if (H.hurt > 0 && H.deadP < 0) ox += (Math.random() - .5) * 3;
  if (H.deadP >= 0){ const p = H.deadP; rot = -1.2 * Math.min(1, p * 3.2); ox -= Math.min(1, p * 3) * 14; alpha = p > .55 ? Math.max(0.1, 1 - (p - .55) / .45) : 1; }
  ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox + HS * 0.12, gy + HS * 0.012, HS * T.sh, HS * 0.055, 0, 0, 7); ctx.fill(); ctx.restore();   // sombra das patas no chão
  if (H.main && H.deadP < 0) drawAura(ox, gy, t, alpha);
  { const c = MOUNT_AURA[Math.max(0, Math.min(5, H.mount.stars | 0))]; if (c && H.deadP < 0){ const pu = 0.5 + 0.2 * Math.sin(t * 2.4), gx0 = ox + HS * 0.15, gy0 = gy - HS * 0.45, r = HS * (0.75 + 0.06 * (H.mount.stars | 0));   // aura por estrela (código), ATRÁS do sprite
      /* Engenheiro 10 (desempenho): o halo era um createRadialGradient + toFixed POR QUADRO; agora é um desenho pronto por estrela (no pulso máximo) e o pulso entra pela transparência */
      const hc = MOUNT_GLOW_OFF ? null : mountHalo(Math.max(0, Math.min(5, H.mount.stars | 0))); ctx.save();
      if (hc){ ctx.globalAlpha = alpha * Math.min(1, (0.3 * pu + 0.12) / 0.33); ctx.drawImage(hc, gx0 - r, gy0 - r, r * 2, r * 2); ctx.globalAlpha = alpha; }
      else { const g = ctx.createRadialGradient(gx0, gy0, HS * 0.1, gx0, gy0, r); g.addColorStop(0, c + Math.min(0.95, (0.22 + 0.15 * (H.mount.stars | 0)) * (0.75 + pu * 0.5)).toFixed(2) + ')'); g.addColorStop(0.55, c + (0.3 * pu + 0.12).toFixed(2) + ')'); g.addColorStop(1, c + '0)');   /* v0.12.8: mais forte (quase não aparecia) */ ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(gx0 - r, gy0 - r, r * 2, r * 2); }
      if ((H.mount.stars | 0) >= 4){ ctx.fillStyle = c + '0.30)'; for (let i = 0; i < 6; i++){ const ph = (t * 0.5 + i / 6) % 1, sx = ox - HS * 0.28 + i * HS * 0.16 + Math.sin(t * 1.3 + i) * 4; ctx.globalAlpha = alpha * (1 - ph) * ((H.mount.stars | 0) >= 5 ? 0.9 : 0.6); ctx.beginPath(); ctx.ellipse(sx, gy - 2 - ph * HS * 0.16, HS * (0.07 + 0.06 * ph), HS * (0.035 + 0.03 * ph), 0, 0, 7); ctx.fill(); } }   // fumaça nas patas (4 e 5 estrelas)
      ctx.restore(); } }
  if (typeof drawWingsAt === 'function') drawWingsAt(H, sh, fi, ox - (pad + 128 - T.dx) * k, gy - (fy - T.dy) * k, k, !a);   /* asa nas COSTAS do Kael montado: âncora "back" da folha, quadro a quadro, na escala dele na sela */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.translate(-(pad + 128 - T.dx) * k, -(fy - T.dy) * k); ctx.scale(k, k);          // espaço do quadro (0..512); patas em feetY na linha do chão
  const GV = mountGearLay(H, M), bimg = GV ? layBody(sh, GV) : sh.img;   /* Engenheiro 18: corpo com a tinta das peças (chave MOUNT_GEAR, desligada) ou a folha original */
  const bsx = sheetSX(M, fi), bsy = sheetSY(M, fi), body = () => ctx.drawImage(bimg, bsx, bsy, FW, FH, 0, 0, FW, FH);
  /* Engenheiro 2: CONTORNO DE LUZ da aura por estrela, colado na silhueta da montaria (o halo de trás sumia em cima do cenário claro): 1 estrela = fino e claro; 5 = largo e dourado */
  const stN = H.deadP < 0 ? Math.max(0, Math.min(5, H.mount.stars | 0)) : 0, glowC = MOUNT_AURA[stN];
  /* Engenheiro 10 (desempenho): o contorno era o corpo desenhado 2 a 3 vezes com shadowBlur A CADA QUADRO (desfoque de 512x352, caro no celular). Agora o contorno
     de cada quadro é desenhado UMA vez num canvas pequeno (1/4 da célula, só a sombra) e reaproveitado; por quadro: 1 drawImage do contorno + 1 do corpo. O pulso
     entra pela transparência. ?debug=1&mglow=0 volta ao caminho antigo (comparação). */
  const gcv = (glowC && !MOUNT_GLOW_OFF) ? mountGlow(sh, fi, stN, FW, FH, k) : null;
  const body0 = !glowC ? body : gcv ? () => { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * (0.85 + 0.15 * Math.sin(t * 2.4)); ctx.drawImage(gcv, -gcv._pad / MGLOW_K, -gcv._pad / MGLOW_K, gcv.width / MGLOW_K, gcv.height / MGLOW_K); ctx.globalAlpha = ga; body(); } : () => { let dp = 1; try { dp = Math.abs(ctx.getTransform().a) / k; } catch (e) {} ctx.save(); ctx.shadowColor = glowC + (0.7 + 0.06 * stN).toFixed(2) + ')'; ctx.shadowBlur = (6 + 2.4 * stN) * dp * (0.85 + 0.15 * Math.sin(t * 2.4)); body(); body(); if (stN >= 5) body(); ctx.restore(); };
  const wm = J('assets/weapons/meta.json')[wKey(ws)] || {}, w0 = SPR(wPng(ws), 'weapon'), gun = wm.type === 'gun';
  let tip = { x: G.x + 40, y: G.y - 40 }, drawW = null;
  if (w0){ const wimg = skinSpr(w0, ws.r), grip = wm.grip || (gun ? [0.26, 0.6] : [0.5, 0.78]); let kk = 256 * (gun ? 0.44 : 0.5) / Math.max(w0.w, w0.h); if (gun) kk = Math.min(kk, 256 * 0.21 / w0.h);
    if (ws.wk && wm.scale > 0) kk *= wm.scale;   /* Engenheiro 5: arco / bumerangue (tamanho do meta.json) */
    const dw = w0.w * kk, dh = w0.h * kk, gx = ((grip[0] - w0.fx) / w0.fw) * dw, gy2 = ((grip[1] - w0.fy) / w0.fh) * dh, wang = typeof wm.angle === 'number' ? wm.angle : (gun ? 0 : 90), ang = typeof wAngOf === 'function' ? wAngOf(wm, G, gun) : -(G.ang - wang) * Math.PI / 180;
    let tx0, ty0; if (gun){ const mz = wm.muzzle; tx0 = mz ? ((mz[0] - w0.fx) / w0.fw) * dw - gx : dw - gx; ty0 = mz ? ((mz[1] - w0.fy) / w0.fh) * dh - gy2 : dh * 0.42 - gy2; }
    else { const ln = typeof wm.len === 'number' ? wm.len * (dw / w0.fw) : gy2, wa = wang * Math.PI / 180; tx0 = Math.cos(wa) * ln; ty0 = -Math.sin(wa) * ln; }
    const sp = (ws.wk && typeof wSpot === 'function') ? wSpot(wm, w0, dw, dh, gx, gy2) : null; if (sp){ tx0 = sp[0]; ty0 = sp[1]; }   /* arco: nock (saída da flecha); bumerangue: pivô do giro */
    const c = Math.cos(ang), s = Math.sin(ang); tip = { x: G.x + tx0 * c - ty0 * s, y: G.y + tx0 * s + ty0 * c };
    drawW = () => { ctx.save(); ctx.translate(G.x, G.y); ctx.rotate(ang); dspr(wimg, -gx, -gy2, dw, dh); if (sp) wExtra(H, ws, a, tx0, ty0, dw * 0.9); ctx.restore(); };
    if (H.main && ws.wk && typeof boomOut === 'function' && boomOut()) drawW = null; }   /* bumerangue no ar: some da mão (volta com ele) */
  if (drawW && G.behind){ drawW(); body0(); }
  else { body0(); if (drawW){ drawW();
      /* dedos por cima do cabo */
      if (typeof G.ux === 'number'){ const ux = G.ux, uy = G.uy, px = -uy, py = ux, f0 = (G.f0 != null ? G.f0 : -5) - 1.5, f1 = (G.f1 != null ? G.f1 : 5) + 1.5, hh = Math.min(G.hw || 3.4, 4) + 5;
        ctx.save(); ctx.beginPath(); ctx.moveTo(G.x + ux * f0 - px * hh, G.y + uy * f0 - py * hh); ctx.lineTo(G.x + ux * f1 - px * hh, G.y + uy * f1 - py * hh); ctx.lineTo(G.x + ux * f1 + px * hh, G.y + uy * f1 + py * hh); ctx.lineTo(G.x + ux * f0 + px * hh, G.y + uy * f0 + py * hh); ctx.closePath(); ctx.clip(); body(); ctx.restore(); }
      /* cabeça do Kael por cima da arma: só a cabeça dele (x < grip.x + 8), nunca a da montaria */
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, G.x + 8, ((sh.neck && sh.neck[fi]) || 0) + 2); ctx.clip(); body(); ctx.restore(); } }
  if (GV) mountGearHead(M, fi, GV);   /* chapéu/óculos/máscara por cima de tudo, na cabeça do cavaleiro */
  ctx.restore();
  if (H.main){ B.tipW = { x: ox - (pad + 128 - T.dx) * k + tip.x * k, y: gy - (fy - T.dy) * k + tip.y * k };
    if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 1.2, B.tipW.x + 6)); B.reach += (rc - B.reach) * 0.2; } }
  return true; }
/* modo dono / depuração: ganhar e montar uma montaria; estrelas */
const mountIds = () => mountOk() ? Sys.mount.DATA.mounts.filter(m => MOUNT_TBL[m.id]) : [];   // só as montarias LIGADAS (com arte aprovada na tabela)
function mountGive(id){ if (!mountOk() || !MOUNT_TBL[id]) return { ok: false, reason: 'off' }; let r = null; try { r = Sys.mount.add(S, Sys.host, id); Sys.mount.equip(S, id); } catch (e) { console.error('mount.add', e); } if (typeof statsChanged === 'function') statsChanged(); return r; }
function mountStar(d){ if (!mountOk()) return 0; try { const o = Sys.mount.ensure(S); if (!o.eq || !o.owned[o.eq]) return 0; const x = o.owned[o.eq]; x.stars = Math.max(1, Math.min(5, (x.stars | 0) + (d || 1))); if (typeof statsChanged === 'function') statsChanged(); return x.stars; } catch (e) { return 0; } }
function mountOff(){ if (!mountOk()) return; try { Sys.mount.equip(S, null); } catch (e) {} if (typeof statsChanged === 'function') statsChanged(); }
/* GANCHO DE DEBUG DO QA (só com ?debug=1): window.dbgMount(id, estrelas) dá e monta a montaria (id da MOUNT_TBL) com as estrelas pedidas (1 a 5; padrão: as
   que ela já tem); dbgMount() lista os ids; dbgMount(null) desmonta. Por baixo usa o que já existia aqui e continua valendo no console: mountGive(id),
   mountStar(+1 / -1) e mountOff(). Devolve também o estado da imagem parada da Derrota (ok / carregando / falhou). */
if (typeof DEBUG !== 'undefined' && DEBUG){ window.dbgMount = function (id, stars){ if (!mountOk()) return { erro: 'montarias desligadas' };
    if (id === null){ mountOff(); if (typeof heroChanged === 'function') heroChanged(); return { desmontado: true }; }
    if (id === undefined || !MOUNT_TBL[id]) return { erro: 'id de montaria desconhecido', ids: Object.keys(MOUNT_TBL) };
    mountGive(id); let st = 0; try { const o = Sys.mount.ensure(S), x = o.owned[id]; if (x){ if (typeof stars === 'number' && isFinite(stars)) x.stars = Math.max(1, Math.min(5, stars | 0)); st = x.stars | 0; } } catch (e) {}
    if (typeof statsChanged === 'function') statsChanged(); if (typeof heroChanged === 'function') heroChanged(); const o = MOUNT_REF[id] ? mountStill(id) : null;
    return { id, estrelas: st, montado: !!mountLook(), imagemParada: !o ? 'sem imagem' : o.ok ? 'ok' : o.fail ? 'falhou' : 'carregando' }; }; }
