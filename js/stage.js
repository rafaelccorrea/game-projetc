'use strict';
/* ================= CENÁRIO VIVO (EonScene) + KAEL POR FOLHAS HÍBRIDAS =================
   Depende de index.html (ERAS, DEBUG, QP, S) e js/battle.js (B, ctx, LW, LH, GY, HS, HX, SPR, skinSpr, dspr...).
   O módulo test/bg/scene.js é carregado como está (window.EonScene); aqui só se cria a cena e se dá o ritmo. */

/* ---------- 1. cenário em camadas ----------
   Liga/desliga por era: chave sceneV2 na tabela ERAS do index.html (pasta assets/bg/v2/era<N>/ com meta.json).
   Debug: ?v2=0 desliga todas. Sem a chave (ou se algo falhar ao carregar) vale o fundo antigo. */
const V2_OFF = DEBUG && QP.get('v2') === '0';
const GROUND_FRAC = FIELD_FEET;                 // linha dos pés em fração da altura do CAMPO (#stage = campo entre o HUD e as abas); 0,78 = groundY do meta: a cena ocupa o campo inteiro
const sceneOn = era => !!(ERAS[era] && ERAS[era].sceneV2) && !!window.EonScene && !V2_OFF;
const SCN = { list: {}, cur: null, tf: '' };
function sceneDims(s){ const st = document.getElementById('stage'); return { w: st.clientWidth, h: Math.round(st.clientHeight * GROUND_FRAC / s.gy) }; }
function sceneFit(s){ const d = sceneDims(s); if (!d.w || !d.h) return; if (d.w === s.w && d.h === s.h) return; s.w = d.w; s.h = d.h; s.cv.style.width = d.w + 'px'; s.cv.style.height = d.h + 'px'; if (s.api){ s.api.resize(d.w, d.h); s.api.draw(); } }
function sceneGet(era){
  if (!sceneOn(era)) return null;
  let s = SCN.list[era]; if (s) return s.fail ? null : s;
  const cv = document.createElement('canvas'); cv.className = 'scn'; cv.style.display = 'none';
  const st = document.getElementById('stage'); st.insertBefore(cv, st.firstChild);
  s = SCN.list[era] = { era, cv, api: null, fail: false, ready: null, gy: 0.78, w: 0, h: 0, shade: '10,20,10' };
  const base = `assets/bg/v2/era${era}/`;
  s.ready = fetch(base + 'meta.json', { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('meta'); return r.json(); }).then(meta => {
      s.gy = meta.groundY || 0.78; s.run0 = meta.runSpeed; if (meta.bottomShade && meta.bottomShade.rgb) s.shade = meta.bottomShade.rgb;
      const d = sceneDims(s); s.w = d.w; s.h = d.h; cv.style.width = d.w + 'px'; cv.style.height = d.h + 'px';
      return EonScene.create(cv, { base, meta, hero: false, running: false, autoStart: false, width: d.w || 390, height: d.h || 692 }); })
    .then(api => { s.api = api; return api.ready; })
    .catch(() => { s.fail = true; if (SCN.cur === s) SCN.cur = null; try { if (s.api) s.api.stop(); } catch (e) {} cv.remove(); });
  return s;
}
/* chamado a cada quadro pelo drawBG: devolve a cena em uso (ou null = fundo antigo) */
function sceneFrame(era){
  const s0 = sceneGet(era), use = s0 && s0.api && !s0.fail ? s0 : null;
  if (SCN.cur !== use){
    if (SCN.cur){ SCN.cur.cv.style.display = 'none'; try { SCN.cur.api.stop(); } catch (e) {} }
    SCN.cur = use; SCN.tf = '';
    if (use){ use.cv.style.display = 'block'; sceneFit(use); use.api.start(); }
  }
  if (!use) return null;
  const k = cv.clientWidth / LW, run = B.running && B.deadT <= 0 && !B.paused;
  use.api.setRunning(run);
  if (use.h) use.api.meta.runSpeed = RUNV() * k * (B.speed || 1) / use.h;     // o chão rola na velocidade da passada (x2 = dobro)
  const tf = `translate3d(${((B.shx || 0) * k).toFixed(1)}px,${((GY - LH * GROUND_FRAC) * k).toFixed(1)}px,0)`;   // tremor: o MESMO deslocamento horizontal dos personagens (B.shx, js/battle.js); nunca vertical
  if (tf !== SCN.tf){ SCN.tf = tf; use.cv.style.transform = tf; }
  return use;
}
addEventListener('resize', () => { for (const k in SCN.list){ const s = SCN.list[k]; if (s.api && !s.fail) sceneFit(s); } });

/* ---------- 2. Kael: folhas híbridas (corpo por quadros + arma trocável na âncora da mão do .json) ----------
   Uma entrada por ERA DA ROUPA (skin de armadura). Cada conjunto = corrida, parado e golpe no formato de assets/anim/hyb/R
   (folha horizontal 256x256 + .json com a mão por quadro). Era sem entrada cai no conjunto da era 2. */
const HERO_DIR = 'assets/anim/hyb/R/';
const HERO_IDLE_DIR = 'assets/anim/hyb/R/';      // fonte única do PARADO (trocar aqui se precisar voltar para 'assets/anim/hyb/')
const HERO_SETS = {
  2: { run: HERO_DIR + 'kael_run_body', idle: HERO_IDLE_DIR + 'kael_idle_body', attack: HERO_DIR + 'kael_attack_body',
       // quadros do golpe por papel (índices na folha attack)
       atk: { ready: 3, wind: [4, 5, 8], strike: [9, 10, 11, 12], ret: [13, 14, 15, 16], aim: 10, aimIn: 13 } },
};
const heroSet = era => HERO_SETS[era] || HERO_SETS[2];
const HERO_FOOT = 242 / 256;                     // linha dos pés dentro do quadro
const HERO_RUN_K = 1.04;                         // velocidade do chão = 1,04 lado-do-quadro por segundo (a mesma do cenário aprovado: runSpeed 0,275 SH/s com quadro de 0,2643 SH)
const RUNV = () => HERO_RUN_K * HS;              // px lógicos por segundo

const SHEETS = {};
function sheetLoad(base, noNeck){
  let s = SHEETS[base]; if (s) return s;
  s = SHEETS[base] = { base, img: null, meta: null, neck: null, ok: false, fail: false, p: null };
  const pi = new Promise((ok, er) => { const im = new Image(); im.onload = () => { s.img = im; ok(); }; im.onerror = () => er(new Error('img ' + base)); im.src = base + '.png'; });
  const pj = fetch(base + '.json').then(r => { if (!r.ok) throw new Error('json ' + base); return r.json(); }).then(j => { s.meta = j; });
  s.p = Promise.all([pi, pj]).then(() => { s.neck = noNeck ? [] : neckRows(s); s.ok = true; return s; }).catch(() => { s.fail = true; return null; });
  return s;
}
const SHEET = base => { const s = sheetLoad(base); return s.ok ? s : null; };
/* linha do pescoço por quadro (primeiro pixel vermelho do cachecol): a cabeça é redesenhada por cima da lâmina */
function neckRows(s){
  const n = s.meta.frames, fw = s.meta.w, fh = s.meta.h, out = [];
  try { const c = document.createElement('canvas'); c.width = s.img.naturalWidth; c.height = fh; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(s.img, 0, 0);
    for (let i = 0; i < n; i++){ const d = g.getImageData(i * fw, 0, fw, fh).data; let top = Math.round(fh * 0.3);
      scan: for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++){ const k = (y * fw + x) * 4; if (d[k + 3] > 200 && d[k] > 140 && d[k + 1] < 70 && d[k + 2] < 70){ top = y; break scan; } }
      out.push(top); }
  } catch (e) { for (let i = 0; i < n; i++) out.push(Math.round(fh * 0.3)); }
  return out;
}
function heroPreload(era){ const set = heroSet(era), out = [sheetLoad(set.run).p, sheetLoad(set.idle).p, sheetLoad(set.attack).p];
  const ws = heroLook().weapon, sp = ws && spinBase(ws); if (sp) out.push(sheetLoad(sp, true).p);
  { const pe = pistolEra(ws); if (pe >= 0) for (const st of ['idle', 'run', 'shoot']) out.push(pistolSheet(pe, st).p); }
  if (ART_ON.kael_die === true) out.push(sheetLoad(HERO_DIR + 'kael_die_body', true).p);
  { const tb = ws && trailBase(ws); if (tb) out.push(sheetLoad(tb, true).p); }
  const au = auraBase(); if (au) out.push(sheetLoad(au, true).p);
  return out; }
/* ESPECIAL ANIMADO (Corte Giratório, era 2): folha composta (corpo + arma + rastro) assets/anim/hyb/R/kael_spin_era2_t<tier>, quadro 448x256,
   pés em x = padLeft + 128 e y = feetY (do .json). Só entra com a chave ART_ON['s2_era2_t<tier>'] ligada; senão vale o golpe por código. */
function spinBase(ws){ if (!ws || ws.e !== 2 || ws.r % 2) return null; const t = tierOf(ws.r); return ART_ON['s2_era2_t' + t] === true ? HERO_DIR + 'kael_spin_era2_t' + t : null; }
/* GOLPE BÁSICO COM RASTRO (s1-era2_t<tier>, aprovado): folha composta assets/anim/hyb/R/kael_attack_trail_era2_t<tier> (17 quadros, 448x256,
   pés em x = padLeft + 128, y = feetY; golpe no quadro 6). Toca dentro da duração do golpe básico (o ritmo do balanceamento não muda): os quadros
   0-6 até o instante do acerto e os 7-16 na volta. Só com skin de arma da era 2 e a chave ART_ON['s1_era2_t<tier>']. */
const TRAIL_HIT = 6;
function trailBase(ws){ if (!ws || ws.e !== 2 || ws.r % 2) return null; const t = tierOf(ws.r); return ART_ON['s1_era2_t' + t] === true ? HERO_DIR + 'kael_attack_trail_era2_t' + t : null; }
function heroTrailSheet(ws){ const b = trailBase(ws); if (!b) return null; const s = sheetLoad(b, true); return s.ok ? s : null; }
function heroSpinSheet(ws){ const b = spinBase(ws); if (!b) return null; const s = sheetLoad(b, true); return s.ok ? s : null; }
/* AURA DE FORTALECIMENTO (auras +4/+7/+10/+13 aprovadas): o nível vem do +N do espaço da ARMA no Sys.forge (Sys.forge.aura(S).id).
   Enquanto a Forja não tiver tela, o +N é 0 e nenhuma aura aparece. Debug: window.__aura = 4 | 7 | 10 | 13. */
const AURA_OF = { blue: 4, purple: 7, flame: 10, gold: 13 };
function auraBase(){ let n = 0; if (DEBUG && window.__aura) n = +window.__aura; else { try { n = AURA_OF[Sys.forge.aura(S).id] || 0; } catch (e) { n = 0; } }
  return n && ART_ON['aura' + n] === true ? 'assets/anim/aura/aura' + n : null; }
function drawAura(ox, gy, t, alpha){ const b = auraBase(); if (!b) return; const s = sheetLoad(b, true); if (!s.ok) return; const M = s.meta, fi = Math.floor(t * (M.fps || 12)) % M.frames, w = HS, h = HS * M.h / M.w;
  ctx.save(); ctx.globalAlpha = alpha; if (M.blend === 'lighter') ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s.img, fi * M.w, 0, M.w, M.h, ox - w / 2, gy + HS * 0.022 - h, w, h); ctx.restore(); }
function drawHeroSpin(H){ const a = H.act, sh = a.spin || a.trail, M = sh.meta, k = HS / 256, gy = H.gy, ox = H.x; let fi = Math.min(M.frames - 1, Math.max(0, Math.floor(a.t / a.dur * M.frames)));
  if (!a.spin){ const th = a.hits[0] ? a.hits[0].t : a.dur * 0.45; fi = a.t < th ? Math.min(TRAIL_HIT, Math.floor(a.t / th * TRAIL_HIT)) : Math.min(M.frames - 1, TRAIL_HIT + Math.floor((a.t - th) / Math.max(0.01, a.dur - th) * (M.frames - TRAIL_HIT))); }
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  drawAura(ox, gy, H.t, 1); drawWingsAt(H, null, 0, 0, 0, 0, false);   /* giro/rastro: a folha composta não tem âncora; vale a última */
  const fy = typeof M.feetY === 'number' ? M.feetY : 243;
  ctx.drawImage(sh.img, fi * M.w, 0, M.w, M.h, ox - ((M.padLeft || 0) + 128) * k, gy - fy * k, M.w * k, M.h * k);
  if (H.hurt > 0){ ctx.save(); ctx.globalAlpha = 0.25; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(sh.img, fi * M.w, 0, M.w, M.h, ox - ((M.padLeft || 0) + 128) * k, gy - fy * k, M.w * k, M.h * k); ctx.restore(); }
  B.tipW = { x: ox + HS * 0.42, y: gy - HS * 0.42 }; return true; }

/* quadro do golpe conforme os instantes de acerto da ação (preparo -> corte -> volta); arma de fogo: pose de mira */
function atkFrame(a, gun, K){
  const t = a.t; let last = -1, next = 1e9;
  for (const h of a.hits){ const ht = h.s != null ? h.s : h.t; if (ht <= t) last = Math.max(last, ht); else next = Math.min(next, ht); }
  const since = t - last, to = next - t;
  if (gun){
    if (t < 0.03 && last < 0) return K.aimIn;
    if (next > 1e8 && since > 0.14) return K.ret[Math.min(K.ret.length - 1, Math.floor((since - 0.14) / 0.04))];
    return K.aim;
  }
  if (last >= 0 && since < 0.11) return K.strike[Math.min(K.strike.length - 1, Math.floor(since / 0.03))];
  if (to < 0.17) return to > 0.11 ? K.wind[0] : to > 0.05 ? K.wind[1] : K.wind[2];
  if (last < 0) return a.type === 's3' ? K.wind[2] : K.ready;
  if (next > 1e8) return K.ret[Math.min(K.ret.length - 1, Math.floor((since - 0.11) / 0.035))];
  return K.strike[K.strike.length - 1];
}

/* pistola ainda carregando (só no primeiro instante do jogo: depois o wSkin segura a arma anterior): Kael parado da folha do corpo, sem a pose de tiro antiga */
function drawHeroPistolWait(H){ const sh = SHEET(heroSet(H.sk.e).idle); if (!sh) return true; const M = sh.meta, k = HS / M.w, fi = Math.floor(H.t * (M.fps || 12)) % M.frames;
  drawWingsAt(H, sh, fi, H.x - HS / 2, H.gy - HS * HERO_FOOT, k, true);
  ctx.save(); ctx.translate(H.x - HS / 2, H.gy - HS * HERO_FOOT); ctx.scale(k, k); ctx.drawImage(sh.img, fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h); ctx.restore(); return true; }
/* ASA NO KAEL (v0.12.4): duas metades (assets/anim/equip/wing_<anjo|demon>_L/R.png; raiz de cada uma no .json), ATRÁS do corpo, presas às costas,
   batendo de leve (escala em x a partir da raiz). Mesma escala do quadro do herói. H.wing = 'angel' | 'demon' (heroLook). */
const WING_IMG = {};
function wingPart(kind, side){ const k = kind + side; let o = WING_IMG[k]; if (!o){ o = WING_IMG[k] = { img: null, ok: false }; const im = new Image(); im.onload = () => { o.img = im; o.ok = true; }; im.src = 'assets/anim/equip/wing_' + kind + (side ? '_' + side : '') + '.png'; } return o; }
/* ASA NAS COSTAS (ordem do dono; Engenheiro 2). A raiz da asa (root do wing_<tipo>.json) vai na ÂNCORA DAS COSTAS de cada quadro: campo "back" dos
   *_body.json (Arte): {x, y em px da célula, ang em graus (0 = tronco vertical, + = para a direita), s = escala do Kael na folha}. Receita da Arte:
   translate(back) · rotate(ang) · scale(s × escala da asa) · drawImage(metade, -root.x·w, -root.y·h), ANTES do corpo. Par L/R (anjo, demônio) ou asa única
   de perfil ("single": dragão, energia). A âncora das folhas do garoto e do adolescente treme de quadro para quadro (medida automática): nas folhas em laço
   (parado, correndo) o x é a MEDIANA da folha e y/ângulo passam por mediana de 3 quadros; nos golpes, mediana de 3 em tudo. Sem âncora na folha (giro,
   rastro) vale a última posição usada; sem nenhuma, a posição antiga. */
const WING_SCALE = 0.62;
function backAt(sh, fi, loop){ const M = sh && sh.meta; if (!M || !Array.isArray(M.back) || !M.back.length) return null; let c = sh._bk;
  if (!c){ const A = M.back, n = A.length, med = a => { const s = a.slice().sort((x, y) => x - y); return s[s.length >> 1]; }, nb = (i, d) => loop ? A[(i + d + n) % n] : A[Math.max(0, Math.min(n - 1, i + d))];
    c = sh._bk = { mx: med(A.map(b => b.x)), sm: A.map((b, i) => { const p = nb(i, -1), q = nb(i, 1); return { x: med([p.x, b.x, q.x]), y: med([p.y, b.y, q.y]), ang: med([p.ang || 0, b.ang || 0, q.ang || 0]), s: b.s > 0 ? b.s : 1 }; }) }; }
  const b = c.sm[Math.max(0, Math.min(c.sm.length - 1, fi | 0))]; return loop ? { x: c.mx, y: b.y, ang: b.ang, s: b.s } : b; }
/* ox0, oy0 = canto (0,0) da célula do quadro em px lógicos; kc = px lógicos por px da célula; loop = folha em laço */
function drawWingsAt(H, sh, fi, ox0, oy0, kc, loop){ const kind = H.wing; if (!kind || H.deadP >= 0) return; const M = J('assets/anim/equip/wing_' + kind + '.json'); if (!M || !(M.single || M.L)) return;
  const b = backAt(sh, fi, loop); let ax, ay, ang, sc;
  if (b){ ax = ox0 + b.x * kc; ay = oy0 + b.y * kc; ang = b.ang; sc = kc * WING_SCALE * b.s * (typeof WING_FIT !== 'undefined' && WING_FIT[kind] || 1); H._wb = { dx: ax - H.x, dy: ay - H.gy, ang, sc }; }
  else if (H._wb){ ax = H.x + H._wb.dx; ay = H.gy + H._wb.dy; ang = H._wb.ang; sc = H._wb.sc; }
  else { ax = H.x - HS * 0.10; ay = H.gy - HS * 0.31; ang = 0; sc = HS / 256 * WING_SCALE; }
  const fl = 1 + 0.07 * Math.sin(H.t * 3.2), winged = !!(H.mount && typeof MOUNT_TBL !== 'undefined' && MOUNT_TBL[H.mount.id] && MOUNT_TBL[H.mount.id].wings);
  ctx.save(); ctx.translate(ax, ay); ctx.rotate(ang * Math.PI / 180); ctx.scale(sc, sc); if (winged){ ctx.shadowColor = 'rgba(255,255,255,.9)'; ctx.shadowBlur = 5; }   // montaria com asas: contorno claro para a asa do Kael não se confundir com a dela
  if (M.single){ const W = wingPart(kind, ''); if (W.ok){ ctx.rotate(0.05 * Math.sin(H.t * 3.2)); ctx.drawImage(W.img, -M.root[0] * M.w, -M.root[1] * M.h, M.w, M.h); } }
  else { const L = wingPart(kind, 'L'), R = wingPart(kind, 'R');
    if (L.ok){ ctx.save(); ctx.scale(fl, 1); ctx.drawImage(L.img, -M.L.root[0] * M.L.w, -M.L.root[1] * M.L.h, M.L.w, M.L.h); ctx.restore(); }
    if (R.ok){ ctx.save(); ctx.scale(fl, 1); ctx.drawImage(R.img, -M.R.root[0] * M.R.w, -M.R.root[1] * M.R.h, M.R.w, M.R.h); ctx.restore(); } }
  ctx.restore(); }
function drawWings(H){ drawWingsAt(H, null, 0, 0, 0, 0, false); }   // reserva (sprite parado antigo): última âncora ou a posição padrão
const HFL = document.createElement('canvas'); HFL.width = HFL.height = 256; const HFLx = HFL.getContext('2d');
/* H: {x,gy,t,sk,ws,walking,hurt,deadP,act,main}. Devolve false se as folhas ainda não carregaram (cai no sprite antigo). */
/* KAEL EM FOLHA COMPOSTA (decisão do PO): com a skin de ROUPA e a de ARMA da era 2 no MESMO tier, a batalha usa a folha aprovada
   assets/anim/hyb/R/kael_<run|idle|attack>_era2_t<tier>.png (corpo + roupa + arma num quadro só; mesmos quadros, fps e pés do .json do corpo, que é o
   .json do conjunto). Em qualquer outro caso (roupa ou arma de outra era, tiers diferentes) vale corpo + arma na mão. Chave: ART_ON.kael_hybR_t<tier>.
   A hyb-attack-era2_t* (assets/anim/hyb/, REPROVADA) nunca é usada: só a pasta R. */
function heroCompTier(sk, ws){ if (!sk || !ws || sk.e !== 2 || ws.e !== 2 || ws.r % 2) return -1;   /* Raro e Mítico têm arte própria: corpo + arma na mão */ const t = tierOf(sk.r); return t === tierOf(ws.r) && ART_ON['kael_hybR_t' + t] === true ? t : -1; }
/* GOLPE: folha LARGA aprovada pelo PO como correção técnica (kael_attack_wide_era2_t<tier>: 17 quadros, 448x256, padLeft 96, pés em x = padLeft+128,
   feetY 243): a de 256 cortava a arma em alguns quadros. Parado e corrida continuam nas de 256. */
const HERO_WIDE_PAD = 96, HERO_WIDE_W = 448;
const heroCompImg = (st, t) => IMG(HERO_DIR + 'kael_' + (st === 'attack' ? 'attack_wide' : st) + '_era2_t' + t + '.png');
/* PISTOLA APROVADA (v0.12.3): com arma de fogo (regra heroLook) nas eras 3, 5 e 6 o Kael usa as folhas assets/anim/hyb/R/pistol/kael_pistol_<idle|run|shoot>_era<E>_t0
   (448x256, padLeft 96, pés em feetY do .json; a pistola da era já vem pintada no quadro; grip[quadro] = {hand, ang, muzzle, shot}; shots = quadros do disparo).
   A pose de tiro antiga (corpo + arma girada por código) SAIU. Era 4: só com ART_ON.pistol_era4 (desligada): sem ela o wIsGun devolve false e vale a espada. */
const PISTOL_DIR = 'assets/anim/hyb/R/pistol/', PISTOL_ERAS = { 3: 1, 5: 1, 6: 1 };
const pistolEra = ws => (ws && wIsGun(ws) && (PISTOL_ERAS[ws.e] || (ws.e === 4 && ART_ON.pistol_era4 === true))) ? ws.e : -1;
const pistolSheet = (e, st) => sheetLoad(HERO_DIR + 'kael_pistol_' + st + '_body', true);   /* v0.12.5: corpo sem arma (mesmos quadros e âncoras da mão); a arma da raridade é desenhada na mão por código */
const pistolScale = (e, st) => { const j = J(PISTOL_DIR + 'kael_pistol_' + st + '_era' + e + '_t0.json'); return (j && typeof j.scale === 'number') ? j.scale * 1024 : 80; };   // lado da imagem da arma (1024 px) em px do quadro, do .json aprovado da era
function pistolReady(e){ let ok = true; for (const st of ['idle', 'run', 'shoot']) if (!pistolSheet(e, st).ok) ok = false; return ok; }
function drawHeroPistol(H, E){
  const a = H.deadP >= 0 ? null : H.act, st = a ? 'shoot' : (H.walking && H.deadP < 0) ? 'run' : 'idle', sh = pistolSheet(E, st); if (!pistolReady(E)) return false;
  const M = sh.meta, n = M.frames, FW = M.w, FH = M.h, pad = M.padLeft || 0, fps = M.fps || 12, t = H.t; let fi;
  if (a){ const s0 = (M.shots && M.shots.length) ? M.shots[0] : 3, s1 = (M.shots && M.shots.length > 1) ? M.shots[1] : 14; let last = -1; for (const h of a.hits) if (a.t >= h.t) last = Math.max(last, h.t);
    /* o quadro do disparo ("shot") cai EXATAMENTE no instante do tiro; antes dele, a preparação; depois, o coice e a volta (a cada tiro recomeça) */
    if (last < 0){ const h0 = a.hits.length ? a.hits[0].t : 0.1; fi = Math.min(s0 - 1, Math.floor(s0 * a.t / Math.max(0.001, h0))); }
    else fi = Math.min(s1 - 1, s0 + Math.floor((a.t - last) * fps * 2)); }
  else fi = Math.floor(t * fps) % n;
  if (!(fi >= 0 && fi < n)) fi = 0;
  const G = M.grip[fi] || M.grip[0], k = HS / 256, gy = H.gy, fy = typeof M.feetY === 'number' ? M.feetY : 243;
  const P = PZ; P.dx = P.dy = P.rot = P.rec = P.flash = P.trail = 0; P.sx = P.sy = 1; P.wang = 0;
  let ox = H.x, alpha = 1, rot = 0;
  if (H.hurt > 0 && H.deadP < 0) ox += (Math.random() - .5) * 3;
  if (H.deadP >= 0){ const p = H.deadP; rot = -1.45 * Math.min(1, p * 3.2); ox -= Math.min(1, p * 3) * 14; alpha = p > .55 ? Math.max(0.1, 1 - (p - .55) / .45) : 1; }
  ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  if (H.main && H.deadP < 0) drawAura(ox, gy, t, alpha);
  drawWingsAt(H, sh, fi, ox - (pad + 128) * k, gy - fy * k, k, !a);   /* asa nas costas (âncora da folha da pistola) */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  if (a && a.type === 's3' && a.t < 1.95) drawGlow(a.col, 0, -HS * .45, HS * (0.5 + 0.2 * Math.min(1, a.t)), 0.5 + 0.2 * Math.sin(t * 20));
  ctx.translate(-HS / 2 - pad * k, -fy * k); ctx.scale(k, k);          // espaço do quadro largo (0..448); a célula de 256 começa em padLeft
  const body = () => ctx.drawImage(sh.img, fi * FW, 0, FW, FH, 0, 0, FW, FH);
  body();
  /* arma da raridade na mão: pivô = grip do meta.json; direção = ângulo da mão do .json menos o ângulo nativo da arma; tamanho = scale do .json aprovado da era */
  const ws = H.ws, wm = J('assets/weapons/meta.json')[wKey(ws)] || {}, w0 = SPR(wPng(ws), 'weapon'), S0 = pistolScale(E, st), fl = a ? shotEnv(a, 0.09) : 0, rec = a ? shotEnv(a, 0.16) * 4 : 0;
  let mz = { x: G.x + 50, y: G.y - 20 };
  if (w0){ const wimg = skinSpr(w0, ws.r), grip = wm.grip || [0.2, 0.65], mzf = wm.muzzle || [0.88, 0.38], wang = typeof wm.angle === 'number' ? wm.angle : 0, ang = -(G.ang - wang) * Math.PI / 180;
    const dw = w0.fw * S0, dh = w0.fh * S0, gx = (grip[0] - w0.fx) * S0, gy2 = (grip[1] - w0.fy) * S0, tx0 = (mzf[0] - w0.fx) * S0 - gx, ty0 = (mzf[1] - w0.fy) * S0 - gy2, c = Math.cos(ang), sn = Math.sin(ang);
    mz = { x: G.x + (tx0 - rec) * c - ty0 * sn, y: G.y + (tx0 - rec) * sn + ty0 * c };
    ctx.save(); ctx.translate(G.x, G.y); ctx.rotate(ang); ctx.translate(-rec, 0); dspr(wimg, -gx, -gy2, dw, dh);
    if (fl > 0){ const c0 = a.col && a.col !== '#ffffff' ? a.col : '#ffd45a', r = 22 + 14 * fl, L = r * (0.9 + 1.1 * fl);   // clarão SAINDO DO CANO, no quadro do disparo
      drawGlow(c0, tx0 + 5, ty0, r, fl); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * fl;
      [[0, 1.5], [-0.45, 0.8], [0.45, 0.8]].forEach((q, i) => { ctx.fillStyle = i ? c0 : '#ffffff'; ctx.beginPath(); ctx.moveTo(tx0, ty0 - 3); ctx.lineTo(tx0 + Math.cos(q[0]) * L * q[1], ty0 + Math.sin(q[0]) * L * q[1]); ctx.lineTo(tx0, ty0 + 3); ctx.fill(); }); }
    ctx.restore();
    /* dedos por cima do cabo: redesenha o trecho do corpo em volta da mão */
    if (typeof G.ux === 'number'){ const ux = G.ux, uy = G.uy, px = -uy, py = ux, f0 = (G.f0 != null ? G.f0 : -5) - 1.5, f1 = (G.f1 != null ? G.f1 : 5) + 1.5, hh = (G.hw || 3.4) + 5;
      ctx.save(); ctx.beginPath(); ctx.moveTo(G.x + ux * f0 - px * hh, G.y + uy * f0 - py * hh); ctx.lineTo(G.x + ux * f1 - px * hh, G.y + uy * f1 - py * hh); ctx.lineTo(G.x + ux * f1 + px * hh, G.y + uy * f1 + py * hh); ctx.lineTo(G.x + ux * f0 + px * hh, G.y + uy * f0 + py * hh); ctx.closePath(); ctx.clip(); body(); ctx.restore(); } }
  if (H.hurt > 0 && H.deadP < 0){ HFLx.globalCompositeOperation = 'source-over'; HFLx.clearRect(0, 0, 256, 256); HFLx.drawImage(sh.img, fi * FW + pad, 0, 256, FH, 0, 0, 256, 256); HFLx.globalCompositeOperation = 'source-atop'; HFLx.fillStyle = '#ff3030'; HFLx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = alpha * Math.min(1, H.hurt / 0.15 * 0.65); ctx.drawImage(HFL, pad, 0, 256, FH); }
  ctx.restore();
  if (H.main){ B.tipW = { x: ox - HS / 2 + (mz.x - pad) * k, y: gy - fy * k + mz.y * k };
    if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 0.62, B.tipW.x + 3)); B.reach += (rc - B.reach) * 0.2; } }
  return true;
}
/* MORTE NOVA DO KAEL (aprovada, v0.12.8): folha assets/anim/hyb/R/kael_die_body (448x256, padLeft 96, pés em feetY; 18 quadros a 12 fps; o último,
   deitado, segura). Cai de joelho e de bruços; a arma cai por código ao lado; poeira ao bater no chão; a tela escurece (battle.js). Vale montado
   (não há folha da montaria sem o Kael: ele cai a pé e a montaria sai de cena) e com pet (o pet para). Chave: ART_ON.kael_die. */
function drawHeroDie(H){ const sh = sheetLoad(HERO_DIR + 'kael_die_body', true); if (!sh.ok) return false; const M = sh.meta, n = M.frames, pad = M.padLeft || 0, fy = typeof M.feetY === 'number' ? M.feetY : 243, k = HS / 256;
  const T = Math.max(0, H.deadP) * 1.6, fi = Math.min(n - 1, Math.floor(T * (M.fps || 12))), ox = H.x, gy = H.gy, alpha = 1;
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox + HS * 0.05 * Math.min(1, T), gy + HS * 0.012, HS * (0.21 + 0.12 * Math.min(1, T)), HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(ox - (pad + 128) * k, gy - fy * k); ctx.scale(k, k);
  /* a arma cai por código: sai da mão, gira e deita no chão à frente */
  const ws = H.ws, w0 = ws ? SPR(wPng(ws), 'weapon') : null, p = Math.min(1, T / 0.7), e2 = p * p;
  if (w0){ const kk = 256 * 0.5 / Math.max(w0.w, w0.h), dw = w0.w * kk, dh = w0.h * kk, x = pad + 128 + 34 + 46 * p, y = (fy - 112) + (112 - 10) * e2, ang = -0.3 + (Math.PI / 2 + 0.3) * e2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha; dspr(skinSpr(w0, ws.r), -dw / 2, -dh / 2, dw, dh); ctx.restore(); }
  ctx.drawImage(sh.img, fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h); ctx.restore();
  if (H.main){ B.tipW = null; const imp = (M.impact && M.impact.body) || 16;
    if (p >= 1 && !B.dieDustW){ B.dieDustW = 1; dust(ox + HS * 0.45, gy - 2, 3, '#c8b496'); }
    if (fi >= imp && !B.dieDustB){ B.dieDustB = 1; dust(ox + HS * 0.1, gy - 2, 5, '#c8b496'); dust(ox - HS * 0.1, gy - 2, 3, '#c8b496'); } }
  return true; }
function drawHeroAnim(H){
  if (H.deadP >= 0 && ART_ON.kael_die === true){ if (drawHeroDie(H)) return true; } else if (H.main && H.deadP < 0){ B.dieDustW = 0; B.dieDustB = 0; }
  if (H.mount && typeof drawHeroMounted === 'function' && drawHeroMounted(H)) return true;   // Kael MONTADO (js/mountfx.js); sem as folhas carregadas, segue a pé
  { const pe = pistolEra(H.ws); if (pe >= 0) return drawHeroPistol(H, pe) || drawHeroPistolWait(H); }
  if (H.main && H.deadP < 0 && H.act && ((H.act.type === 's2' && H.act.spin && H.act.spin.ok) || (H.act.type === 's1' && H.act.trail && H.act.trail.ok))) return drawHeroSpin(H);
  const set = heroSet(H.sk.e), a = H.deadP >= 0 ? null : H.act, ws = H.ws, gun = wIsGun(ws), t = H.t;
  const st = a ? 'attack' : (H.walking && H.deadP < 0) ? 'run' : 'idle';
  const sh = SHEET(set[st]); if (!sh) return false;
  const CT = heroCompTier(H.sk, H.ws), comp = CT >= 0 ? heroCompImg(st, CT) : null;   // folha composta (ou null = corpo + arma na mão)
  if (CT >= 0){ heroCompImg('run', CT); heroCompImg('idle', CT); heroCompImg('attack', CT); }   // deixa as três carregadas: sem troca de modo no meio da ação
  const M = sh.meta, FW = M.w, FH = M.h, n = M.frames;
  let fi = a ? atkFrame(a, gun, set.atk) : Math.floor(t * (M.fps || 12)) % n; if (!(fi >= 0 && fi < n)) fi = 0;
  const G = M.grip[fi] || M.grip[0], k = HS / FW, gy = H.gy;
  const P = PZ; P.dx = P.dy = P.rot = P.rec = P.flash = P.trail = 0; P.sx = P.sy = 1; P.wang = 0;
  if (a && gun){ const s = shotEnv(a, a.type === 's1' ? 0.22 : 0.13); P.rec = s * (a.type === 's1' ? 5 : 6); P.flash = shotEnv(a, 0.09);
    if (a.type === 's3' && (a.era === 3 || a.era === 5)) P.wang = -0.9 * Math.min(1, a.t / 0.5) * (a.t < 1.95 ? 1 : Math.max(0, 1 - (a.t - 1.95) / 0.3)); }
  else if (a){ const S = set.atk.strike; P.trail = (fi === S[0] || fi === S[1]) ? 1 : 0; }
  let ox = H.x, alpha = 1, rot = 0;
  if (H.hurt > 0 && H.deadP < 0) ox += (Math.random() - .5) * 3;
  if (H.deadP >= 0){ const p = H.deadP; rot = -1.45 * Math.min(1, p * 3.2); ox -= Math.min(1, p * 3) * 14; alpha = p > .55 ? Math.max(0.1, 1 - (p - .55) / .45) : 1; }
  // sombra presa ao chão
  ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  if (H.main && H.deadP < 0) drawAura(ox, gy, t, alpha);   // aura de fortalecimento ATRÁS do herói, base no chão
  drawWingsAt(H, sh, fi, ox - HS / 2, gy - HS * HERO_FOOT, k, !a);   /* asa nas costas, atrás do corpo */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  const T = tierOf(H.sk.r);
  if (T === 2){ const au = fxSpr('aura', RAR[H.sk.r].c), al = 0.45 + 0.15 * Math.sin(t * 3); if (au){ ctx.save(); ctx.globalAlpha = alpha * (al + .2); ctx.globalCompositeOperation = 'lighter'; ctx.translate(0, -HS * .45); ctx.rotate(t * 0.5); ctx.drawImage(au, -HS * .6, -HS * .6, HS * 1.2, HS * 1.2); ctx.restore(); } else drawGlow(RAR[H.sk.r].c, 0, -HS * .5, HS * .7, alpha * al); }
  if (a && a.type === 's3' && a.t < 1.95) drawGlow(a.col, 0, -HS * .45, HS * (0.5 + 0.2 * Math.min(1, a.t)), 0.5 + 0.2 * Math.sin(t * 20));
  ctx.translate(-HS / 2, -HS * HERO_FOOT); ctx.scale(k, k);          // daqui em diante: espaço do quadro (0..256)
  const wide = comp && st === 'attack';   // folha larga: o quadro de 448 é desenhado com a célula de 256 no mesmo lugar (96 px para cada lado)
  const body = () => wide ? ctx.drawImage(comp, fi * HERO_WIDE_W, 0, HERO_WIDE_W, FH, -HERO_WIDE_PAD, 0, HERO_WIDE_W, FH) : ctx.drawImage(comp || sh.img, fi * FW, 0, FW, FH, 0, 0, FW, FH);
  // arma: pivô = grip do meta.json da arma, na mão do quadro; direção = eixo da mão (bastão-guia) do .json
  const wk = wKey(ws), wm = J('assets/weapons/meta.json')[wk] || {}, w0 = SPR(wPng(ws), 'weapon'), fx = WFIX[wk] || WFIX[heroKey(ws)] || {};
  if (H.main) B.tipW = null;
  let drawW = null;
  if (w0){
    const wimg = skinSpr(w0, ws.r), grip = wm.grip || (gun ? [0.26, 0.6] : [0.5, 0.78]);
    let kk = FW * (gun ? 0.44 : 0.5) * (fx.s || 1) / Math.max(w0.w, w0.h); if (gun) kk = Math.min(kk, FW * 0.21 * (fx.s || 1) / w0.h);
    const dw = w0.w * kk, dh = w0.h * kk, gx = ((grip[0] - w0.fx) / w0.fw) * dw, gy2 = ((grip[1] - w0.fy) / w0.fh) * dh;
    const wang = typeof wm.angle === 'number' ? wm.angle : (gun ? 0 : 90);
    const ang = -(G.ang - wang) * Math.PI / 180 + (fx.rot || 0) + P.wang;
    let tx0, ty0;   // ponta (boca do cano / ponta da lâmina) no espaço da arma
    if (gun){ const mz = wm.muzzle; tx0 = mz ? ((mz[0] - w0.fx) / w0.fw) * dw - gx : dw - gx; ty0 = mz ? ((mz[1] - w0.fy) / w0.fh) * dh - gy2 : dh * 0.42 - gy2; }
    else { const ln = typeof wm.len === 'number' ? wm.len * (dw / w0.fw) : gy2, wa = wang * Math.PI / 180; tx0 = Math.cos(wa) * ln; ty0 = -Math.sin(wa) * ln; }
    drawW = () => {
      ctx.save(); ctx.translate(G.x + (fx.dx || 0), G.y + (fx.dy || 0)); ctx.rotate(ang); if (gun) ctx.translate(-P.rec, 0);
      dspr(wimg, -gx, -gy2, dw, dh);
      if (gun){ if (P.flash > 0){ const mz = fxSpr('muzzle', a ? a.col : '#ffffff'), r = 26 + 16 * P.flash;
          if (mz){ ctx.globalAlpha = alpha * P.flash; ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(mz, tx0 - 3, ty0 - r, r * 2, r * 2); }
          else { const c0 = a && a.col !== '#ffffff' ? a.col : '#ffd45a', L = r * (0.9 + 1.1 * P.flash);   // clarão em código: brilho + línguas de fogo que encolhem
            drawGlow(c0, tx0 + 5, ty0, r, P.flash); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alpha * P.flash;
            [[0, 1.5], [-0.45, 0.8], [0.45, 0.8], [-0.9, 0.45], [0.9, 0.45]].forEach((q, i) => { ctx.fillStyle = i ? c0 : '#ffffff'; ctx.beginPath(); ctx.moveTo(tx0, ty0 - 3); ctx.lineTo(tx0 + Math.cos(q[0]) * L * q[1], ty0 + Math.sin(q[0]) * L * q[1]); ctx.lineTo(tx0, ty0 + 3); ctx.fill(); }); } } }
      else if (P.trail){ const col = a ? a.col : '#ffffff', sl = fxSpr('slash', col), R = Math.hypot(tx0, ty0), ta = Math.atan2(ty0, tx0);
        ctx.globalAlpha = alpha * 0.6; ctx.globalCompositeOperation = 'lighter';
        if (sl){ const W = R * 1.5; ctx.translate(tx0 * .5, ty0 * .5); ctx.rotate(ta + Math.PI / 2); ctx.drawImage(sl, -W * 0.35, -W / 2, W, W); }
        else { ctx.strokeStyle = col; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, R * 0.9, ta - 1.0, ta - 0.06); ctx.stroke(); } }
      ctx.restore();
    };
    if (H.main){ const c = Math.cos(ang), s = Math.sin(ang), rx = tx0 - (gun ? P.rec : 0), lx = G.x + rx * c - ty0 * s, ly = G.y + rx * s + ty0 * c;
      B.tipW = { x: ox - HS / 2 + lx * k, y: gy - HS * HERO_FOOT + ly * k };
      if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 0.62, B.tipW.x + (gun ? 3 : 6))); B.reach += (rc - B.reach) * 0.2; } }
  }
  if (comp) drawW = null;   // a arma já está no quadro composto (a ponta B.tipW continua vindo da âncora da mão do .json)
  const behind = !!G.behind || Math.cos(G.ang * Math.PI / 180) < -0.25;
  if (drawW && behind){ drawW(); body(); }
  else {
    body();
    if (drawW){ drawW();
      // dedos por cima do cabo: redesenha o trecho do quadro em volta da mão
      const ux = G.ux, uy = G.uy, px = -uy, py = ux, f0 = (G.f0 != null ? G.f0 : -12) - 1.5, f1 = (G.f1 != null ? G.f1 : 12) + 1.5, hh = (G.hw || 3.3) + 5;
      ctx.save(); ctx.beginPath(); ctx.moveTo(G.x + ux * f0 - px * hh, G.y + uy * f0 - py * hh); ctx.lineTo(G.x + ux * f1 - px * hh, G.y + uy * f1 - py * hh); ctx.lineTo(G.x + ux * f1 + px * hh, G.y + uy * f1 + py * hh); ctx.lineTo(G.x + ux * f0 + px * hh, G.y + uy * f0 + py * hh); ctx.closePath(); ctx.clip(); body(); ctx.restore();
      // cabeça por cima da lâmina
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, FW, (sh.neck[fi] || 0) + 2); ctx.clip(); body(); ctx.restore(); }
  }
  if (H.hurt > 0 && H.deadP < 0){ HFLx.globalCompositeOperation = 'source-over'; HFLx.clearRect(0, 0, 256, 256); HFLx.drawImage(comp || sh.img, wide ? fi * HERO_WIDE_W + HERO_WIDE_PAD : fi * FW, 0, FW, FH, 0, 0, 256, 256); HFLx.globalCompositeOperation = 'source-atop'; HFLx.fillStyle = '#ff3030'; HFLx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = alpha * Math.min(1, H.hurt / 0.15 * 0.65); ctx.drawImage(HFL, 0, 0, FW, FH); }
  ctx.restore();
  return true;
}
