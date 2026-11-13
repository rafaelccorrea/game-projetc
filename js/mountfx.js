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
function mountArtOf(h, id){ const A = window.Sys && Sys.assets; if (A && typeof A.mountedArt === 'function'){ try { return A.mountedArt(h, id); } catch (e) { return null; } }
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
  let rise = 60; try { const h0 = SHEET(heroSet(2).idle); if (h0 && sh.neck && sh.neck.length) rise = (fy - sh.neck[0]) - (HERO_FOOT * 256 - (h0.neck[0] || 76)); } catch (e) {}
  return MOUNT_M[key] = { right, top, rise: Math.max(0, rise) }; }   /* medidas por herói + montaria (a folha da Kaia tem as dela) */
/* quanto o Kael montado fica mais ALTO que a pé (px lógicos): as barras de vida/energia e a asa sobem junto */
function heroRise(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return 0; if (typeof B !== 'undefined' && B.deadT > 0 && typeof ART_ON !== 'undefined' && ART_ON.kael_die === true) return 0;   /* morto: o Kael cai a pé (morte nova); as barras descem com ele */ const m = mountMetrics(mo.id); return m ? m.rise * HS / 256 : 0; }
/* até onde a montaria passa da borda do corpo do Kael a pé, para a direita (px lógicos): o inimigo da frente guarda a folga a partir daí */
function mountFront(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return 0; const m = mountMetrics(mo.id); return m ? Math.max(0, m.right * HS / 256 - (HERO_EDGE - HX)) : 0; }
function mountWingOff(H){ const mo = H.mount; if (!mo || !mountReady(mo.id)) return null; const m = mountMetrics(mo.id), T = MOUNT_TBL[mo.id], k = HS / 256; return m ? { x: (T.wx + (T.wings ? T.wx2 || 0 : 0)) * k, y: -(m.rise + T.wy + (T.wings ? T.wy2 || 0 : 0)) * k, winged: !!T.wings } : null; }
/* deslocamento do pet nesta montaria (tabela) */
function mountPetOff(){ const mo = typeof HM !== 'undefined' ? HM.mount : null; if (!mo || !mountReady(mo.id)) return null; const T = MOUNT_TBL[mo.id]; const st3 = typeof PETK !== 'undefined' && PETK.info && (PETK.info.stage | 0) >= 3; return { dx: (st3 && T.pdx3) || T.pdx || 0.62, dy: T.pdy || 9 }; }
const MOUNT_AURA = [null, 'rgba(200,230,255,', 'rgba(120,200,255,', 'rgba(120,200,255,', 'rgba(190,140,255,', 'rgba(255,214,120,'];   // visível já em 1 estrela; mais forte a cada estrela
function drawHeroMounted(H){ if (!H.mount || !mountPrefix(H.mount.id)) return false;   /* herói sem folha montada (Kaia): a pé, nunca o Kael no lugar (vale também para state.mount do drawHeroFull) */
  const id = H.mount.id; if (!mountReady(id)) return false; const T = MOUNT_TBL[id];
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
      const g = ctx.createRadialGradient(gx0, gy0, HS * 0.1, gx0, gy0, r); g.addColorStop(0, c + Math.min(0.95, (0.22 + 0.15 * (H.mount.stars | 0)) * (0.75 + pu * 0.5)).toFixed(2) + ')'); g.addColorStop(0.55, c + (0.3 * pu + 0.12).toFixed(2) + ')'); g.addColorStop(1, c + '0)');   /* v0.12.8: mais forte (quase não aparecia) */ ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(gx0 - r, gy0 - r, r * 2, r * 2);
      if ((H.mount.stars | 0) >= 4){ ctx.fillStyle = c + '0.30)'; for (let i = 0; i < 6; i++){ const ph = (t * 0.5 + i / 6) % 1, sx = ox - HS * 0.28 + i * HS * 0.16 + Math.sin(t * 1.3 + i) * 4; ctx.globalAlpha = alpha * (1 - ph) * ((H.mount.stars | 0) >= 5 ? 0.9 : 0.6); ctx.beginPath(); ctx.ellipse(sx, gy - 2 - ph * HS * 0.16, HS * (0.07 + 0.06 * ph), HS * (0.035 + 0.03 * ph), 0, 0, 7); ctx.fill(); } }   // fumaça nas patas (4 e 5 estrelas)
      ctx.restore(); } }
  if (typeof drawWingsAt === 'function') drawWingsAt(H, sh, fi, ox - (pad + 128 - T.dx) * k, gy - (fy - T.dy) * k, k, !a);   /* asa nas COSTAS do Kael montado: âncora "back" da folha, quadro a quadro, na escala dele na sela */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.translate(-(pad + 128 - T.dx) * k, -(fy - T.dy) * k); ctx.scale(k, k);          // espaço do quadro (0..512); patas em feetY na linha do chão
  const body = () => ctx.drawImage(sh.img, fi * FW, 0, FW, FH, 0, 0, FW, FH);
  /* Engenheiro 2: CONTORNO DE LUZ da aura por estrela, colado na silhueta da montaria (o halo de trás sumia em cima do cenário claro): 1 estrela = fino e claro; 5 = largo e dourado */
  const stN = H.deadP < 0 ? Math.max(0, Math.min(5, H.mount.stars | 0)) : 0, glowC = MOUNT_AURA[stN];
  const body0 = !glowC ? body : () => { let dp = 1; try { dp = Math.abs(ctx.getTransform().a) / k; } catch (e) {} ctx.save(); ctx.shadowColor = glowC + (0.7 + 0.06 * stN).toFixed(2) + ')'; ctx.shadowBlur = (6 + 2.4 * stN) * dp * (0.85 + 0.15 * Math.sin(t * 2.4)); body(); body(); if (stN >= 5) body(); ctx.restore(); };
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
  ctx.restore();
  if (H.main){ B.tipW = { x: ox - (pad + 128 - T.dx) * k + tip.x * k, y: gy - (fy - T.dy) * k + tip.y * k };
    if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 1.2, B.tipW.x + 6)); B.reach += (rc - B.reach) * 0.2; } }
  return true; }
/* modo dono / depuração: ganhar e montar uma montaria; estrelas */
const mountIds = () => mountOk() ? Sys.mount.DATA.mounts.filter(m => MOUNT_TBL[m.id]) : [];   // só as montarias LIGADAS (com arte aprovada na tabela)
function mountGive(id){ if (!mountOk() || !MOUNT_TBL[id]) return { ok: false, reason: 'off' }; let r = null; try { r = Sys.mount.add(S, Sys.host, id); Sys.mount.equip(S, id); } catch (e) { console.error('mount.add', e); } if (typeof statsChanged === 'function') statsChanged(); return r; }
function mountStar(d){ if (!mountOk()) return 0; try { const o = Sys.mount.ensure(S); if (!o.eq || !o.owned[o.eq]) return 0; const x = o.owned[o.eq]; x.stars = Math.max(1, Math.min(5, (x.stars | 0) + (d || 1))); if (typeof statsChanged === 'function') statsChanged(); return x.stars; } catch (e) { return 0; } }
function mountOff(){ if (!mountOk()) return; try { Sys.mount.equip(S, null); } catch (e) {} if (typeof statsChanged === 'function') statsChanged(); }
