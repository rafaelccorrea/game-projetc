'use strict';
/* ================= CENÁRIO VIVO (EonScene) + KAEL POR FOLHAS HÍBRIDAS =================
   Depende de index.html (ERAS, DEBUG, QP, S) e js/battle.js (B, ctx, LW, LH, GY, HS, HX, SPR, skinSpr, dspr...).
   O módulo test/bg/scene.js é carregado como está (window.EonScene); aqui só se cria a cena e se dá o ritmo. */

/* ---------- 1. cenário em camadas ----------
   Liga/desliga por era: chave sceneV2 na tabela ERAS do index.html (pasta assets/bg/v2/era<N>/ com meta.json).
   Debug: ?v2=0 desliga todas. Sem a chave (ou se algo falhar ao carregar) vale o fundo antigo. */
const V2_OFF = DEBUG && QP.get('v2') === '0';
const GROUND_FRAC = FIELD_FEET;                 // linha dos pés em fração da altura do CAMPO (#stage = campo entre o HUD e as abas); 0,78 = groundY do meta: a cena ocupa o campo inteiro
const SCN = { list: {}, cur: null, tf: '', force: null };
const sceneOn = era => (!!(ERAS[era] && ERAS[era].sceneV2) || era === SCN.force) && !!window.EonScene && !V2_OFF;
/* PRÉVIA DE CENÁRIO (Modo dono / debug): as eras 7 (Submundo) e 8 (Celestial) ainda não existem na tabela ERAS; sceneForce(7|8) põe o cenário vivo delas
   atrás da batalha atual; sceneForce(null) devolve o da era do jogador. Só vale no Modo dono ou com ?debug=1 (?debug=1&scn=7). Nada muda para o jogador. */
window.sceneForce = n => { SCN.force = (n == null || !((typeof OWNER_MODE !== 'undefined' && OWNER_MODE) || DEBUG)) ? null : (n | 0); return SCN.force; };
if (DEBUG && QP.has('scn')) SCN.force = +QP.get('scn') | 0;
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
  if (SCN.force != null) era = SCN.force;
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
  if (ART_ON.kael_die === true) out.push(dieSheet().p);
  { const F = heroForm(); if (F.hero !== 'kael' || F.stage > 0) for (const st of ['idle', 'run', 'attack', 'spin']){ const q = phaseSheet(st, F.stage); if (q) out.push(q.p); } }   /* Kaia e skins de corpo próprio: as folhas delas */   /* morte: a folha da fase atual */
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
/* H (opcional) = herói que está sendo desenhado: a aura da ROUPA-SKIN (camada 'aura' do Sys.appearance) entra aqui; no herói da batalha vale a MAIOR entre ela e a
   da Forja (uma aura só na tela); nas prévias (H.main falso) só a da roupa-skin. ps = escala da fase. */
function auraPick(H){ const L = H ? layNow(H) : null, la = L && L.aura ? L.aura : null, b = (!H || H.main) ? auraBase() : null; if (!la) return b; if (!b) return la;
  const n = s => +((/aura(\d+)$/.exec(s) || [0, 0])[1]); const x = n(la); return (!x || x >= n(b)) ? la : b; }   /* aura da skin com nome próprio (aura_evil, aura_holy): vale a da skin */
function drawAura(ox, gy, t, alpha, H, ps){ const b = auraPick(H); if (!b) return; const s = sheetLoad(b, true); if (!s.ok) return; const M = s.meta, fi = Math.floor(t * (M.fps || 12)) % M.frames, w = HS * (ps || 1), h = w * M.h / M.w;
  ctx.save(); ctx.globalAlpha = alpha; if (M.blend === 'lighter') ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(s.img, fi * M.w, 0, M.w, M.h, ox - w / 2, gy + HS * 0.022 - h, w, h); ctx.restore(); }
function drawHeroSpin(H){ const a = H.act, sh = a.spin || a.trail, M = sh.meta, k = HS / 256, gy = H.gy, ox = H.x; let fi = Math.min(M.frames - 1, Math.max(0, Math.floor(a.t / a.dur * M.frames)));
  if (!a.spin){ const th = a.hits[0] ? a.hits[0].t : a.dur * 0.45; fi = a.t < th ? Math.min(TRAIL_HIT, Math.floor(a.t / th * TRAIL_HIT)) : Math.min(M.frames - 1, TRAIL_HIT + Math.floor((a.t - th) / Math.max(0.01, a.dur - th) * (M.frames - TRAIL_HIT))); }
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  drawAura(ox, gy, H.t, 1, H); drawWingsAt(H, null, 0, 0, 0, 0, false);   /* giro/rastro: a folha composta não tem âncora; vale a última */
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
function drawHeroPistolWait(H){ { const F = heroForm(); if (F.hero !== 'kael' || F.stage > 0){ drawHeroPhase(H, F.stage); return true; } }   /* Kaia: a folha dela (nunca o Kael) */
  const sh = SHEET(heroSet(H.sk.e).idle); if (!sh) return true; const M = sh.meta, k = HS / M.w, fi = Math.floor(H.t * (M.fps || 12)) % M.frames;
  drawWingsAt(H, sh, fi, H.x - HS / 2, H.gy - HS * HERO_FOOT, k, true);
  const L = layNow(H); ctx.save(); ctx.translate(H.x - HS / 2, H.gy - HS * HERO_FOOT); ctx.scale(k, k); ctx.drawImage(layBody(sh, L), fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h); layHead(sh, fi, L); ctx.restore(); return true; }
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
/* Engenheiro 4: a folha da pistola sai da pasta-base do HERÓI (Sys.appearance.sheetFor: R/kael_ ou kaia/kaia_), nunca de um caminho fixo do Kael; quadros, pés e
   "shots" vêm do .json da folha; o tamanho da arma vem do .json da era na subpasta pistol/ do mesmo herói. Só sem o módulo vale o caminho antigo do Kael. */
const pistolSheet = (e, st) => { const s = phaseSheet('pistol_' + st, null, true);   /* a pasta que o sheetFor devolver: herói padrão ou skin fixa */ return s || sheetLoad(HERO_DIR + 'kael_pistol_' + st + '_body', true); };   /* v0.12.5: corpo sem arma (mesmos quadros e âncoras da mão); a arma da raridade é desenhada na mão por código */
const pistolScale = (e, st) => { const m = /^(.*\/)([a-z]+)_pistol_/.exec(pistolSheet(e, st).base), j = J((m ? m[1] + 'pistol/' + m[2] : PISTOL_DIR + 'kael') + '_pistol_' + st + '_era' + e + '_t0.json'); if (j && typeof j.scale === 'number') return j.scale * 1024;
  if (m && heroPhase() > 0){ const j2 = J(m[1] + m[2] + '_pistol_' + st + '_era5_t0.json'); if (j2 && typeof j2.scale === 'number') return j2.scale * 1024; }   /* skins de corpo próprio: só existe o .json da era 5, na própria pasta */
  return 80; };   // lado da imagem da arma (1024 px) em px do quadro, do .json aprovado da era
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
  const G = M.grip[fi] || M.grip[0], k = HS / 256 * phaseK(), gy = H.gy, fy = typeof M.feetY === 'number' ? M.feetY : 243;   /* escala da skin (padrão = 1) */
  const P = PZ; P.dx = P.dy = P.rot = P.rec = P.flash = P.trail = 0; P.sx = P.sy = 1; P.wang = 0;
  let ox = H.x, alpha = 1, rot = 0;
  if (H.hurt > 0 && H.deadP < 0) ox += (Math.random() - .5) * 3;
  if (H.deadP >= 0){ const p = H.deadP; rot = -1.45 * Math.min(1, p * 3.2); ox -= Math.min(1, p * 3) * 14; alpha = p > .55 ? Math.max(0.1, 1 - (p - .55) / .45) : 1; }
  ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  const L = layNow(H), bimg = layBody(sh, L);
  if (H.deadP < 0) drawAura(ox, gy, t, alpha, H);
  drawWingsAt(H, sh, fi, ox - (pad + 128) * k, gy - fy * k, k, !a);   /* asa nas costas (âncora da folha da pistola) */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  if (a && a.type === 's3' && a.t < 1.95) drawGlow(a.col, 0, -HS * .45, HS * (0.5 + 0.2 * Math.min(1, a.t)), 0.5 + 0.2 * Math.sin(t * 20));
  ctx.translate(-(128 + pad) * k, -fy * k); ctx.scale(k, k);          // espaço do quadro largo (0..448); a célula de 256 começa em padLeft
  const body = () => ctx.drawImage(bimg, fi * FW, 0, FW, FH, 0, 0, FW, FH);
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
  layHead(sh, fi, L);   /* chapéu, óculos e máscara da roupa-skin */
  if (H.hurt > 0 && H.deadP < 0){ HFLx.globalCompositeOperation = 'source-over'; HFLx.clearRect(0, 0, 256, 256); HFLx.drawImage(sh.img, fi * FW + pad, 0, 256, FH, 0, 0, 256, 256); HFLx.globalCompositeOperation = 'source-atop'; HFLx.fillStyle = '#ff3030'; HFLx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = alpha * Math.min(1, H.hurt / 0.15 * 0.65); ctx.drawImage(HFL, pad, 0, 256, FH); }
  ctx.restore();
  if (H.main){ B.tipW = { x: ox + (mz.x - pad - 128) * k, y: gy - fy * k + mz.y * k };
    if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 0.62, B.tipW.x + 3)); B.reach += (rc - B.reach) * 0.2; } }
  return true;
}
/* MORTE NOVA DO KAEL (aprovada, v0.12.8): folha assets/anim/hyb/R/kael_die_body (448x256, padLeft 96, pés em feetY; 18 quadros a 12 fps; o último,
   deitado, segura). Cai de joelho e de bruços; a arma cai por código ao lado; poeira ao bater no chão; a tela escurece (battle.js). Vale montado
   (não há folha da montaria sem o Kael: ele cai a pé e a montaria sai de cena) e com pet (o pet para). Chave: ART_ON.kael_die. */
/* A folha da morte é a da FASE (Sys.appearance.sheetFor → phase1|2|3/kael_die_body), na escala da fase, pés no chão: o herói nunca "volta a ser criança" ao morrer. */
function dieSheet(){ const s = phaseSheet('die', heroPhase(), true); if (s) return s; return sheetLoad(HERO_DIR + 'kael_die_body', true); }   /* a pasta que o sheetFor devolver (herói e skin); sem o módulo, a do Kael */
function drawHeroDie(H){ const sh = dieSheet(); if (!sh.ok) return heroForm().hero !== 'kael'; const PS = phaseK(), M = sh.meta, n = M.frames, pad = M.padLeft || 0, fy = typeof M.feetY === 'number' ? M.feetY : 243, k = HS / 256 * PS;
  const T = Math.max(0, H.deadP) * 1.6, fi = Math.min(n - 1, Math.floor(T * (M.fps || 12))), ox = H.x, gy = H.gy, alpha = 1;
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox + HS * 0.05 * Math.min(1, T), gy + HS * 0.012, HS * (0.21 + 0.12 * Math.min(1, T)), HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(ox - (pad + 128) * k, gy - fy * k); ctx.scale(k, k);
  /* a arma cai por código: sai da mão, gira e deita no chão à frente */
  const ws = H.ws, w0 = ws ? SPR(wPng(ws), 'weapon') : null, p = Math.min(1, T / 0.7), e2 = p * p;
  /* P20: a arma termina DEITADA conforme o ângulo nativo dela (meta.json: espada 90 = gira 90°, como antes; pistola 0 = já está deitada) e o ponto mais baixo para em fy-2: nada abaixo do chão */
  const wm = ws ? (J('assets/weapons/meta.json')[wKey(ws)] || {}) : {}, a1 = (typeof wm.angle === 'number' ? wm.angle : (wm.type === 'gun' ? 0 : 90)) * Math.PI / 180;
  if (w0){ const kk = 256 * 0.5 / Math.max(w0.w, w0.h), dw = w0.w * kk, dh = w0.h * kk, x = pad + 128 + 34 + 46 * p, hh = (Math.abs(dw * Math.sin(a1)) + Math.abs(dh * Math.cos(a1))) / 2, y = (fy - 112) + (110 - hh) * e2, ang = -0.3 + (a1 + 0.3) * e2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = alpha; dspr(skinSpr(w0, ws.r), -dw / 2, -dh / 2, dw, dh); ctx.restore(); }
  { const L = layNow(H); ctx.drawImage(layBody(sh, L), fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h); layHead(sh, fi, L); } ctx.restore();
  if (H.main){ B.tipW = null; const imp = (M.impact && M.impact.body) || 16;
    if (p >= 1 && !B.dieDustW){ B.dieDustW = 1; dust(ox + HS * 0.45, gy - 2, 3, '#c8b496'); }
    if (fi >= imp && !B.dieDustB){ B.dieDustB = 1; dust(ox + HS * 0.1, gy - 2, 5, '#c8b496'); dust(ox - HS * 0.1, gy - 2, 3, '#c8b496'); } }
  return true; }
function drawHeroAnim(H){
  if (H.deadP >= 0 && ART_ON.kael_die === true){ if (drawHeroDie(H)) return true; } else if (H.main && H.deadP < 0){ B.dieDustW = 0; B.dieDustB = 0; }
  if (H.main && typeof evoHidesHero === 'function' && evoHidesHero()) return true;   /* evolução 0→1 com folha própria: o herói é o da folha */
  if (H.mount && typeof drawHeroMounted === 'function' && drawHeroMounted(H)) return true;   // Kael MONTADO (js/mountfx.js); sem as folhas carregadas, segue a pé
  const F = heroForm();
  { const pe = pistolEra(H.ws); if (pe >= 0) return drawHeroPistol(H, pe) || drawHeroPistolWait(H); }   /* pistola: folhas pistol_* da pasta do herói/skin (antes as skins de corpo próprio seguravam a pistola na pose da espada, apontada para o chão) */
  if (F.stage > 0 && drawHeroPhase(H, F.stage)) return true;   /* skin fixa com corpo próprio (pastas phase2/phase3 e kaia_phase2/3): folhas de 448 */
  if (F.hero !== 'kael'){ drawHeroPhase(H, F.stage); return true; }   /* KAIA (Engenheiro 4): sempre as folhas DELA; enquanto carregam não aparece nada por um instante (nunca o Kael no lugar) */
  const L = layNow(H);   /* camadas da roupa-skin (ou null) */
  if (!L && H.main && H.deadP < 0 && H.act && ((H.act.type === 's2' && H.act.spin && H.act.spin.ok) || (H.act.type === 's1' && H.act.trail && H.act.trail.ok))) return drawHeroSpin(H);   /* com roupa-skin em camadas a folha composta (corpo já pintado) não vale: corpo + arma na mão */
  const set = heroSet(H.sk.e), a = H.deadP >= 0 ? null : H.act, ws = H.ws, gun = wIsGun(ws), t = H.t;
  const st = a ? 'attack' : (H.walking && H.deadP < 0) ? 'run' : 'idle';
  const sh = SHEET(set[st]); if (!sh) return false;
  const CT = L ? -1 : heroCompTier(H.sk, H.ws), comp = CT >= 0 ? heroCompImg(st, CT) : null, bimg = layBody(sh, L);   // folha composta (ou null = corpo + arma na mão)
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
  if (H.deadP < 0) drawAura(ox, gy, t, alpha, H);   // aura (Forja ou roupa-skin) ATRÁS do herói, base no chão
  drawWingsAt(H, sh, fi, ox - HS / 2, gy - HS * HERO_FOOT, k, !a);   /* asa nas costas, atrás do corpo */
  ctx.save(); ctx.translate(ox, gy); ctx.rotate(rot); ctx.globalAlpha = alpha;
  const T = tierOf(H.sk.r);
  if (T === 2){ const au = fxSpr('aura', RAR[H.sk.r].c), al = 0.45 + 0.15 * Math.sin(t * 3); if (au){ ctx.save(); ctx.globalAlpha = alpha * (al + .2); ctx.globalCompositeOperation = 'lighter'; ctx.translate(0, -HS * .45); ctx.rotate(t * 0.5); ctx.drawImage(au, -HS * .6, -HS * .6, HS * 1.2, HS * 1.2); ctx.restore(); } else drawGlow(RAR[H.sk.r].c, 0, -HS * .5, HS * .7, alpha * al); }
  if (a && a.type === 's3' && a.t < 1.95) drawGlow(a.col, 0, -HS * .45, HS * (0.5 + 0.2 * Math.min(1, a.t)), 0.5 + 0.2 * Math.sin(t * 20));
  ctx.translate(-HS / 2, -HS * HERO_FOOT); ctx.scale(k, k);          // daqui em diante: espaço do quadro (0..256)
  const wide = comp && st === 'attack';   // folha larga: o quadro de 448 é desenhado com a célula de 256 no mesmo lugar (96 px para cada lado)
  const body = () => wide ? ctx.drawImage(comp, fi * HERO_WIDE_W, 0, HERO_WIDE_W, FH, -HERO_WIDE_PAD, 0, HERO_WIDE_W, FH) : ctx.drawImage(comp || bimg, fi * FW, 0, FW, FH, 0, 0, FW, FH);
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
  layHead(sh, fi, L);   /* chapéu, óculos e máscara da roupa-skin, por cima de tudo (a cabeça já fica por cima da lâmina) */
  if (H.hurt > 0 && H.deadP < 0){ HFLx.globalCompositeOperation = 'source-over'; HFLx.clearRect(0, 0, 256, 256); HFLx.drawImage(comp || sh.img, wide ? fi * HERO_WIDE_W + HERO_WIDE_PAD : fi * FW, 0, FW, FH, 0, 0, 256, 256); HFLx.globalCompositeOperation = 'source-atop'; HFLx.fillStyle = '#ff3030'; HFLx.fillRect(0, 0, 256, 256);
    ctx.globalAlpha = alpha * Math.min(1, H.hurt / 0.15 * 0.65); ctx.drawImage(HFL, 0, 0, FW, FH); }
  ctx.restore();
  return true;
}

/* ================= KAEL POR FASE (Engenheiro 2; ordem do dono: "nível 60 e não evoluiu") =================
   Garoto (nível 1) → adolescente (22) → adulto (35) → guerreiro (70): gatilho do Sys.phaseUp; a FOLHA de cada estado vem de
   Sys.appearance.sheetFor(S, host, estado) (pastas R / phase1 / phase2 / phase3; serve à Kaia quando ligar). Chave: PHASES_ON (index.html).
   Fase 0 = o desenho de sempre (drawHeroAnim). Fases 1 a 3: drawHeroPhase (folhas de 448 com padLeft/feetY do .json; corpo SEM arma + a arma do item
   na mão pelo grip do quadro; asa na âncora das costas; escala PH_SCALE com os pés na linha do chão). Skin/cosméticos do jogador não são tocados. */
const PH_SCALE = [1.00, 1.12, 1.25, 1.30];
const PH_DIRS = ['R', 'phase1', 'phase2', 'phase3'];
/* FORMA DO HERÓI (Engenheiro 4; DECISÃO FINAL DO DONO: não há mais crescimento; padrão = garoto/menina; adulto e guerreiro são SKINS FIXAS). PONTO ÚNICO: herói, pasta
   e escala saem do que Sys.appearance.sheetFor(S, host, 'idle') devolver; o desenho NÃO lê Sys.phaseUp. stage = número da pasta (R/kaia = 0; phaseN/kaia_phaseN = N),
   só para saber o formato da folha; ps = escala: campo scale do módulo quando existir; até lá, derivada da pasta (PH_SCALE). Relido 5x por segundo; formRefresh() na hora. */
const formOk = () => typeof Sys !== 'undefined' && !!Sys.appearance && typeof Sys.appearance.sheetFor === 'function';
/* FORM.ov = skin pedida pelo drawHeroFull (state.skin: id de skin fixa ou 'default' = corpo padrão), para desenhar uma skin que NÃO é a equipada (vitrine da Aparência).
   vai como 4º parâmetro do Sys.appearance.sheetFor(S, host, estado, {skin}) (API de Sistemas, f0c17a4), que devolve dir/body/scale dessa skin. */
const FORM = { t: -1e9, v: null, k: '', ov: null };
const formStage = dir => { const m = /phase(\d)\/$/.exec(dir || ''); return m ? Math.max(0, Math.min(3, +m[1])) : 0; };   /* número da pasta: só diz o FORMATO da folha (0 = 256 do garoto/menina; N = 448) */
const formAsk = st => { const ov = FORM.ov; return ov != null ? Sys.appearance.sheetFor(S, Sys.host, st, { skin: ov }) : Sys.appearance.sheetFor(S, Sys.host, st); };
function heroForm(){ const now = performance.now(), ov = FORM.ov; if (ov == null && FORM.v && now - FORM.t < 200) return FORM.v; let hero = (typeof S !== 'undefined' && S && S.hero === 'kaia') ? 'kaia' : 'kael', stage = 0, ps = 1;
  if (formOk()){ try { const r = formAsk('idle'); if (r){ if (r.hero === 'kaia' || r.hero === 'kael') hero = r.hero; stage = formStage(r.dir); ps = (typeof r.scale === 'number' && r.scale > 0) ? r.scale : (PH_SCALE[stage] || 1); } } catch (e) {} }
  if (ov != null) return { hero, stage, ps };
  const k = hero + '|' + stage + '|' + ps; if (k !== FORM.k){ FORM.k = k; if (FORM.v && typeof avatarRefresh === 'function'){ try { avatarRefresh(); } catch (e) {} } }   /* herói/skin mudou: retrato do cabeçalho */
  FORM.t = now; return FORM.v = { hero, stage, ps }; }
function formRefresh(){ FORM.t = -1e9; return heroForm(); }
const phasesOk = () => typeof PHASES_ON !== 'undefined' && PHASES_ON && typeof Sys !== 'undefined' && !!Sys.phaseUp && !!Sys.appearance && typeof Sys.appearance.sheetFor === 'function';
function phaseBoot(){ if (!phasesOk()) return; try { Sys.phaseUp.DATA.on = true; Sys.phaseUp.ensure(S); phaseCheck(true); } catch (e) { console.error('phaseBoot', e); } }
/* fase DESENHADA agora (durante a animação de evolução: a antiga até a metade, depois a nova) */
function heroPhase(){ let st = heroForm().stage; const ev = typeof B !== 'undefined' ? B.evo : null; if (ev && (B.at - ev.t0) < ev.dur * (ev.swap || 0.5)) st = ev.from; return Math.max(0, Math.min(3, st)); }
const phaseK = () => { const F = heroForm(); return heroPhase() === F.stage ? F.ps : (PH_SCALE[heroPhase()] || 1); };
const stageK = stage => { const F = heroForm(); return stage === F.stage ? F.ps : (PH_SCALE[stage] || 1); };
function phaseSheet(st, stage, noNeck){ if (!formOk()) return null; let r = null; try { r = formAsk(st); } catch (e) { return null; } if (!r || !r.body) return null; let base = r.body;
  if (stage != null && stage !== formStage(r.dir)) base = base.replace(/hyb\/[^/]+\//, 'hyb/' + (r.hero === 'kaia' ? (stage ? 'kaia_phase' + stage : 'kaia') : PH_DIRS[stage]) + '/');   /* pedido explícito de outra pasta (pistola na pasta-base; evolução inerte) */
  return sheetLoad(base, noNeck || st === 'die'); }
function phaseReady(stage){ let ok = true; for (const st of ['idle', 'run', 'attack']){ const s = phaseSheet(st, stage); if (!s || !s.ok) ok = false; } phaseSheet('spin', stage); phaseSheet('die', stage); return ok; }
/* altura do corpo parado nesta fase (px lógicos): barras de vida, pet e folgas usam esta */
const PH_H = {};
function phaseBodyH(){ const p = heroPhase(), F = heroForm(), hk = F.hero + p; if (!p && F.hero === 'kael') return 0; if (PH_H[hk]) return PH_H[hk] * HS / 256 * stageK(p); const sh = phaseSheet('idle', p); if (!sh || !sh.ok) return 0; let h = 0;
  try { const b = enBounds(sh)[0], fy = typeof sh.meta.feetY === 'number' ? sh.meta.feetY : 243; if (b) h = fy - b.t; } catch (e) {} if (h > 0) PH_H[hk] = h; return h * HS / 256 * stageK(p); }
/* EVOLUÇÃO: save antigo que já passou dos níveis evolui DIRETO para a fase certa, com UMA animação (decisão do dono); a fase vai para o save na hora
   (recarregar não repete). 0→1 sem skin/cosmético visível: folha própria (evolve_0_1, que já traz o herói); nos outros casos o herói é desenhado por
   camadas (fase antiga → clarão → fase nova) com a animação de subir de nível por cima. */
/* NA CARGA (save antigo): Sys.phaseUp.catchUp põe a fase certa de uma vez (rotina do módulo; uma só, sem fila); aqui só sai UM aviso + UMA animação para a fase
   final. JOGANDO (subiu de nível): pending → evolve, um passo. Efeito: com skin/cosmético visível (anim.layered) ou sem folha própria, o herói antigo com as
   camadas → efeito indicado pelo módulo (anim.fx = assets/anim/fx/evolve_<de>_<para>_fx, só o efeito; troca de fase no quadro 27) → herói novo com as camadas;
   se o arquivo do efeito faltar, a animação de subir de nível + clarão por código (reserva). */
const EVO_LV = 'assets/anim/fx/levelup', EVO_SWAP = 27 / 38;
function phaseCheck(atBoot){ if (!phasesOk() || (typeof B !== 'undefined' && B.evo)) return; let first = null, last = null, n = 0, stg0 = 0;
  try { stg0 = Sys.phaseUp.current(S) | 0;
    /* carga: o módulo aplica de uma vez tudo MENOS a última fase (catchUp); a última vem no pending() e toca UMA animação */
    if (atBoot && typeof Sys.phaseUp.catchUp === 'function') Sys.phaseUp.catchUp(S, Sys.host);
    for (let i = 0; i < 4; i++){ const p = Sys.phaseUp.pending(S, Sys.host); if (!p || !p.ready) break; if (!first) first = p; last = p; const r = Sys.phaseUp.evolve(S, Sys.host); if (!r || !r.ok) break; n++; }
    const stg1 = Sys.phaseUp.current(S) | 0;
    if (!last && stg1 > stg0){ n = stg1 - stg0; last = { from: stg1 - 1, to: stg1, toName: Sys.phaseUp.nameOf(S, stg1), anim: { fallback: true, fx: 'assets/anim/fx/evolve_' + (stg1 - 1) + '_' + stg1 + '_fx' } }; }   /* módulo que aplica tudo no catchUp: ainda assim UM aviso */
    first = last;   /* só a evolução FINAL aparece (herói da fase anterior à final → efeito → fase final) */
  } catch (e) { console.error('phaseCheck', e); }
  if (!last || (Sys.phaseUp.current(S) | 0) === stg0) return; save(); const an = last.anim || {}, own = !!an.sheet && !an.fallback && !an.layered && !heroLook().mount, fx = !own && an.fx ? an.fx : null, base = own ? an.sheet : (fx || EVO_LV);
  sheetLoad(base, true); phaseReady(last.to); phaseReady(first.from);
  B.evo = { t0: (B.at || 0) + (atBoot ? 1.2 : 0.1), from: first.from, to: last.to, sheet: base, own, fx: !!fx, swap: fx ? EVO_SWAP : 0.5, dur: (own || fx) ? 38 / 12 : 1.6, name: last.toName };
  B.lvfx = null;   /* a evolução já tem o seu efeito: sem a animação de subir de nível por cima (visto: as duas juntas) */
  B.banner = { txt: 'Evoluiu: ' + last.toName + '!', pill: true, bg: 'rgba(60,40,8,.92)', bd: '#ffc94a', sh: '#2a1403', t: -(atBoot ? 1.2 : 0.1), dur: 2.6, col: '#ffe07a' };
  if (typeof snd === 'function') snd('legendary'); if (typeof fbLayout === 'function') setTimeout(fbLayout, 50); }
function drawEvo(){ const ev = B.evo; if (!ev) return; const t = B.at - ev.t0; if (t < 0) return;
  if (t >= ev.dur){ B.evo = null; if (typeof fbLayout === 'function') fbLayout(); if (typeof layoutHorde === 'function'){ try { layoutHorde(); } catch (e) {} } return; }
  if (ev.fx){ const f = sheetLoad(ev.sheet, true); if (f.fail){ ev.fx = false; ev.sheet = EVO_LV; ev.swap = 0.5; ev.dur = Math.max(1.6, t + 0.8); } }   /* efeito do módulo não existe no disco: reserva */
  const u = t / ev.dur, gl = Math.max(0, 1 - Math.abs(u - 0.5) * 4);
  if (!ev.own && !ev.fx && gl > 0){ const r = HS * (0.6 + 0.5 * gl), g = ctx.createRadialGradient(HX, GY - HS * 0.5, 2, HX, GY - HS * 0.5, r); g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * gl).toFixed(2) + ')'); g.addColorStop(0.5, 'rgba(255,224,122,' + (0.6 * gl).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,224,122,0)'); ctx.fillStyle = g; ctx.fillRect(HX - r, GY - HS * 0.5 - r, r * 2, r * 2); }
  if (ev.sheet === EVO_LV){ if (typeof drawLevelUpCode === 'function') drawLevelUpCode(t, ev.dur); return; }   /* a folha levelup traz o Kael garoto desenhado: na evolução vale o efeito por código */
  const sh = sheetLoad(ev.sheet, true); if (!sh.ok) return; const M = sh.meta, fi = Math.min(M.frames - 1, Math.floor(u * M.frames)), k = HS / 256 * (ev.own ? 1 : PH_SCALE[ev.to]);
  ctx.drawImage(sh.img, fi * M.w, 0, M.w, M.h, HX - (M.anchorX || M.w / 2) * k, GY - (M.feetY || M.h) * k, M.w * k, M.h * k); }
/* PONTO ÚNICO da compensação do "pad duplo" das folhas não-paradas das fases 1 a 3 (aviso da Arte: pés ~96 px à direita de padLeft+128; a parada está certa).
   Se o .json trouxer padFix (número), vale ele (0 = folha corrigida). Sem o campo, a diferença do xf.ox para a folha parada (medido: 96 px exatos em run, attack e
   spin das 3 fases). QUANDO A ARTE CORRIGIR OS ARQUIVOS: apagar esta função e trocar a chamada por 0 (ou a Arte grava "padFix": 0). */
function phasePadFix(M, idM){ if (typeof M.padFix === 'number') return M.padFix; const d = (idM && idM.xf && M.xf) ? (M.xf.ox - idM.xf.ox) : 0; return Math.abs(d) > 48 ? d : 0; }   /* Engenheiro 4: só o defeito de 96 px conta; diferenças pequenas do xf (giro da Kaia menina: 6 px de outra escala de origem) não são deslocamento */
const evoHidesHero = () => !!(typeof B !== 'undefined' && B.evo && B.evo.own && B.at >= B.evo.t0);
/* desenho do herói nas fases 1 a 3. Devolve false se as folhas da fase ainda não carregaram (aí vale o desenho da fase 0 por um instante). */
function drawHeroPhase(H, stage){ if (!phaseReady(stage)) return false;
  const a = H.deadP >= 0 ? null : H.act, ws = H.ws, gun = wIsGun(ws), t = H.t, PS = stageK(stage), k = HS / 256 * PS, gy = H.gy;
  let st = a ? (a.type === 's2' ? 'spin' : 'attack') : (H.walking && H.deadP < 0) ? 'run' : 'idle', sh = phaseSheet(st, stage); if (!sh || !sh.ok){ st = a ? 'attack' : 'idle'; sh = phaseSheet(st, stage); }
  if (H.deadP >= 0){ const d = phaseSheet('die', stage); if (d && d.ok) return drawHeroPhaseDie(H, d, k); }
  const M = sh.meta, n = M.frames, FW = M.w, FH = M.h, pad = M.padLeft || 0, fy = typeof M.feetY === 'number' ? M.feetY : 243;
  let fi = a ? (st === 'spin' ? Math.min(n - 1, Math.floor(a.t / Math.max(0.01, a.dur) * n)) : atkFrame(a, gun, HERO_SETS[2].atk)) : Math.floor(t * (M.fps || 12)) % n; if (!(fi >= 0 && fi < n)) fi = 0;
  const G = (M.grip && (M.grip[fi] || M.grip[0])) || { x: pad + 150, y: 190, ang: 45, ux: 0.7, uy: -0.7 };
  const P = PZ; P.dx = P.dy = P.rot = P.rec = P.flash = P.trail = 0; P.sx = P.sy = 1; P.wang = 0;
  if (a && gun){ const s = shotEnv(a, a.type === 's1' ? 0.22 : 0.13); P.rec = s * 5; P.flash = shotEnv(a, 0.09); }
  let ox = H.x, alpha = 1; if (H.hurt > 0 && H.deadP < 0) ox += (Math.random() - .5) * 3;
  if (H.deadP >= 0) alpha = H.deadP > .55 ? Math.max(0.1, 1 - (H.deadP - .55) / .45) : 1;
  ctx.save(); ctx.globalAlpha = 0.3 * alpha; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(ox - HS * 0.02, gy + HS * 0.012, HS * 0.21 * PS, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  const L = layNow(H), bimg = layBody(sh, L);
  if (H.deadP < 0) drawAura(ox, gy, t, alpha, H);
  /* nas fases 1 a 3 as folhas de corrida, golpe e giro têm o corpo 96 px mais à direita na célula do que a folha parada (campo xf.ox do .json; o padLeft diz 96 nas duas):
     a diferença do xf.ox para a folha parada entra na âncora, senão o Kael pula para a frente ao sair do parado */
  const idM = st !== 'idle' ? (phaseSheet('idle', stage) || {}).meta : null, dxf = phasePadFix(M, idM);
  const x0 = ox - (pad + 128 + dxf) * k, y0 = gy - fy * k;
  drawWingsAt(H, sh, fi, x0, y0, k, !a);
  ctx.save(); ctx.globalAlpha = alpha;
  if (tierOf(H.sk.r) === 2) drawGlow(RAR[H.sk.r].c, ox, gy - HS * .5 * PS, HS * .7 * PS, alpha * (0.45 + 0.15 * Math.sin(t * 3)));   // skin de raridade alta: o brilho da skin continua
  if (a && a.type === 's3' && a.t < 1.95) drawGlow(a.col, ox, gy - HS * .45 * PS, HS * (0.5 + 0.2 * Math.min(1, a.t)) * PS, 0.5 + 0.2 * Math.sin(t * 20));
  ctx.translate(x0, y0); ctx.scale(k, k);
  const body = () => ctx.drawImage(bimg, fi * FW, 0, FW, FH, 0, 0, FW, FH);
  const wk = wKey(ws), wm = J('assets/weapons/meta.json')[wk] || {}, w0 = SPR(wPng(ws), 'weapon'), fx = WFIX[wk] || WFIX[heroKey(ws)] || {};
  let drawW = null, tip = { x: G.x + 40, y: G.y - 40 };
  if (w0){ const wimg = skinSpr(w0, ws.r), grip = wm.grip || (gun ? [0.26, 0.6] : [0.5, 0.78]); let kk = 256 * (gun ? 0.44 : 0.5) * (fx.s || 1) / Math.max(w0.w, w0.h); if (gun) kk = Math.min(kk, 256 * 0.21 * (fx.s || 1) / w0.h);
    const dw = w0.w * kk, dh = w0.h * kk, gx = ((grip[0] - w0.fx) / w0.fw) * dw, gy2 = ((grip[1] - w0.fy) / w0.fh) * dh, wang = typeof wm.angle === 'number' ? wm.angle : (gun ? 0 : 90), ang = -(G.ang - wang) * Math.PI / 180;
    let tx0, ty0; if (gun){ const mz = wm.muzzle; tx0 = mz ? ((mz[0] - w0.fx) / w0.fw) * dw - gx : dw - gx; ty0 = mz ? ((mz[1] - w0.fy) / w0.fh) * dh - gy2 : dh * 0.42 - gy2; }
    else { const ln = typeof wm.len === 'number' ? wm.len * (dw / w0.fw) : gy2, wa = wang * Math.PI / 180; tx0 = Math.cos(wa) * ln; ty0 = -Math.sin(wa) * ln; }
    const c = Math.cos(ang), s = Math.sin(ang); tip = { x: G.x + tx0 * c - ty0 * s, y: G.y + tx0 * s + ty0 * c };
    drawW = () => { ctx.save(); ctx.translate(G.x + (fx.dx || 0), G.y + (fx.dy || 0)); ctx.rotate(ang); if (gun) ctx.translate(-P.rec, 0); dspr(wimg, -gx, -gy2, dw, dh);
      if (gun && P.flash > 0){ const c0 = a && a.col !== '#ffffff' ? a.col : '#ffd45a'; drawGlow(c0, tx0 + 5, ty0, 26 + 16 * P.flash, P.flash); }
      ctx.restore(); }; }
  const behind = !!G.behind || Math.cos(G.ang * Math.PI / 180) < -0.25;
  if (drawW && behind){ drawW(); body(); }
  else { body(); if (drawW){ drawW();
      if (typeof G.ux === 'number'){ const ux = G.ux, uy = G.uy, px = -uy, py = ux, f0 = (G.f0 != null ? G.f0 : -12) - 1.5, f1 = (G.f1 != null ? G.f1 : 12) + 1.5, hh = Math.min(G.hw || 3.3, 6) + 5;   // dedos por cima do cabo
        ctx.save(); ctx.beginPath(); ctx.moveTo(G.x + ux * f0 - px * hh, G.y + uy * f0 - py * hh); ctx.lineTo(G.x + ux * f1 - px * hh, G.y + uy * f1 - py * hh); ctx.lineTo(G.x + ux * f1 + px * hh, G.y + uy * f1 + py * hh); ctx.lineTo(G.x + ux * f0 + px * hh, G.y + uy * f0 + py * hh); ctx.closePath(); ctx.clip(); body(); ctx.restore(); }
      if (sh.neck && sh.neck[fi]){ ctx.save(); ctx.beginPath(); ctx.rect(0, 0, FW, sh.neck[fi] + 2); ctx.clip(); body(); ctx.restore(); } } }   // cabeça por cima da lâmina
  layHead(sh, fi, L);   /* chapéu, óculos e máscara da roupa-skin */
  ctx.restore();
  if (H.main){ B.tipW = { x: x0 + tip.x * k, y: y0 + tip.y * k };
    if (!a && H.deadP < 0 && !H.walking){ const rc = Math.max(HX + HS * 0.36, Math.min(HX + HS * 0.62 * PS, B.tipW.x + (gun ? 3 : 6))); B.reach += (rc - B.reach) * 0.2; } }
  return true; }
function drawHeroPhaseDie(H, sh, k){ const M = sh.meta, n = M.frames, pad = M.padLeft || 0, fy = typeof M.feetY === 'number' ? M.feetY : 243, T = Math.max(0, H.deadP) * 1.6, fi = Math.min(n - 1, Math.floor(T * (M.fps || 12)));
  ctx.save(); ctx.globalAlpha = 0.3; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(H.x, H.gy + HS * 0.012, HS * 0.3, HS * 0.05, 0, 0, 7); ctx.fill(); ctx.restore();
  const L = layNow(H); ctx.save(); ctx.translate(H.x - (pad + 128) * k, H.gy - fy * k); ctx.scale(k, k); ctx.drawImage(layBody(sh, L), fi * M.w, 0, M.w, M.h, 0, 0, M.w, M.h); layHead(sh, fi, L); ctx.restore(); return true; }

/* ================= CAMADAS DA ROUPA-SKIN (Engenheiro 3; decisão do dono de 12/11: a roupa-skin é uma COMBINAÇÃO de camadas) =================
   Fonte: Sys.appearance.layers(S, Sys.host) (js/sys/appearance.js) → {layer:'aura', sheet} · {layer:'armor'|'boots', mat, tint:[R,G,B,ganho]} · {layer:'hat', hat:'eraN'} ·
   {layer:'glasses'|'mask', cos}. Tudo é desenhado DENTRO do desenho do herói (fase 0, fases 1 a 3, pistola, morte), então vale na batalha, na evolução e nas prévias.
   - TINTA de colete (canal R da máscara) e botas (canal B): conta copiada da página da Arte (test/anim/look/index.html): m = canal/255 × alfa;
     l = luminância(0,30 R + 0,59 G + 0,11 B)/128 × ganho; cor = cor×(1−m) + min(255, tinta×l)×m (colete primeiro, botas depois). A folha inteira do estado é pintada
     UMA vez e guardada (chave: folha + colete + botas + cabelo apagado); por quadro é só um drawImage da cópia. No máximo LAY_MAX cópias (as menos usadas saem).
   - Chapéu com hideHair: o cabelo é apagado na MESMA cópia (máscara _hair, destination-out), nunca no canvas do jogo.
   - Chapéu/óculos/máscara: âncora da cabeça por quadro (masks/<herói>_<estado>_head.json): translate(x,y) rotate(ang) scale(s/res) drawImage(png, -pivot). ok:false = não desenha.
   - Máscara com célula mais larga que a folha (garoto: golpe de 256 com máscara de 448): entra centrada (folga igual dos dois lados).
   - Montado: as folhas de montaria não têm máscara nem âncora de cabeça (Arte): o Kael montado não ganha camadas.
   Chave: LAYERS_ON (index.html), DESLIGADA por decisão final do dono (sem combinações de camadas para o jogador); só liga com ?debug=1&camadas=1. H.lay (prévias) = camadas já lidas; sem ele, as do save (relidas 4x por segundo). */
const LAY_MAX = 6, LAYC = new Map(), LAYI = {}, LAYN = { t: -1e9, v: null }, LAYS = {}; let LAYU = 0, LAYB = -1e9, LAYT = null;
const layersOk = () => typeof LAYERS_ON !== 'undefined' && LAYERS_ON && typeof Sys !== 'undefined' && !!Sys.appearance && typeof Sys.appearance.layers === 'function';
function layParse(list){ if (!Array.isArray(list)) return null; const o = { aura: null, vest: null, boots: null, hat: null, glasses: null, mask: null, tints: {} }; let any = false;
  for (const l of list){ if (!l) continue;
    if (l.layer === 'aura' && l.sheet){ o.aura = l.sheet; any = true; }
    else if ((l.layer === 'armor' || l.layer === 'boots') && l.mat && Array.isArray(l.tint)){ o[l.layer === 'armor' ? 'vest' : 'boots'] = l.mat; o.tints[l.mat] = l.tint; any = true; }
    else if (l.layer === 'hat' && l.hat){ o.hat = l.hat; any = true; }
    else if ((l.layer === 'glasses' || l.layer === 'mask') && (l.cos || (l.source === 'cos' && l.id))){ o[l.layer] = l.cos || l.id; any = true; } }
  return any ? o : null; }
/* combinação de uma roupa-skin pela id (vitrine da Coleção: mostra a skin olhada, não a vestida) */
function layOfSkin(id){ if (id in LAYS) return LAYS[id]; let v = null; try { const c = Sys.appearance.comboOf(id), M = Sys.appearance.MATERIALS; if (c){ const l = [];
      if (c.aura) l.push({ layer: 'aura', sheet: 'assets/anim/aura/' + c.aura }); if (c.boots && M[c.boots]) l.push({ layer: 'boots', mat: c.boots, tint: M[c.boots] }); if (c.vest && M[c.vest]) l.push({ layer: 'armor', mat: c.vest, tint: M[c.vest] });
      if (c.hat) l.push({ layer: 'hat', hat: c.hat }); if (c.glasses) l.push({ layer: 'glasses', cos: c.glasses }); if (c.mask) l.push({ layer: 'mask', cos: c.mask }); v = layParse(l); } } catch (e) { v = null; }
  return LAYS[id] = v; }
function layNow(H){ if (!layersOk()) return null; if (H && H.lay !== undefined) return H.lay;
  const now = performance.now(); if (now - LAYN.t > 250){ LAYN.t = now; try { LAYN.v = layParse(Sys.appearance.layers(S, Sys.host)); } catch (e) { LAYN.v = null; } } return LAYN.v; }
function layLoad(p){ let o = LAYI[p]; if (!o){ o = LAYI[p] = { img: null, ok: false, fail: false }; const im = new Image(); im.onload = () => { o.img = im; o.ok = true; }; im.onerror = () => { o.fail = true; }; im.src = p; } return o; }
const layMaskBase = sh => { const m = /^(.*\/)([a-z]+_[a-z_]+)_body$/.exec(sh.base); return m ? m[1] + 'masks/' + m[2] : null; };
const layHat = id => { const h = J('assets/anim/equip/hats/hats.json').hats; return h ? (h[id] || null) : undefined; };   // undefined = tabela ainda carregando
/* folha do corpo com a tinta (e o cabelo apagado) da roupa-skin; enquanto não fica pronta, a folha original */
function layBody(sh, L){ if (!L || !sh || !sh.ok || !sh.img) return sh.img; let hide = false;
  if (L.hat){ const h = layHat(L.hat); if (h === undefined) return sh.img; hide = !!(h && h.hideHair); }
  if (!L.vest && !L.boots && !hide) return sh.img;
  const mb = layMaskBase(sh); if (!mb) return sh.img; const key = sh.base + '|' + (L.vest || '') + '|' + (L.boots || '') + '|' + (hide ? 1 : 0); let e = LAYC.get(key);
  if (e){ e.use = ++LAYU; e.at = performance.now(); return e.cv; }
  const mk = (L.vest || L.boots) ? layLoad(mb + '_mask.png') : null, hr = hide ? layLoad(mb + '_hair.png') : null;
  if ((mk && !mk.ok && !mk.fail) || (hr && !hr.ok && !hr.fail)) return sh.img;          // máscaras carregando
  const now = performance.now(); if (now - LAYB < 30) return sh.img; LAYB = now;         // no máximo uma folha pintada por quadro
  let cv = sh.img;
  try { const W = sh.img.naturalWidth, Hh = sh.img.naturalHeight, n = sh.meta.frames, FW = sh.meta.w;
    if (!LAYT) LAYT = document.createElement('canvas'); LAYT.width = W; LAYT.height = Hh; const g = LAYT.getContext('2d', { willReadFrequently: true });
    const put = im => { const mw = im.naturalWidth / n; if (Math.abs(mw - FW) < 1) g.drawImage(im, 0, 0, W, Hh); else { const off = (mw - FW) / 2; for (let i = 0; i < n; i++) g.drawImage(im, i * mw + off, 0, FW, im.naturalHeight, i * FW, 0, FW, Hh); } };
    if (mk && mk.ok){ g.clearRect(0, 0, W, Hh); put(mk.img); const md = g.getImageData(0, 0, W, Hh).data; g.clearRect(0, 0, W, Hh); g.drawImage(sh.img, 0, 0);
      const out = g.getImageData(0, 0, W, Hh), d = out.data, chs = [[0, L.vest ? L.tints[L.vest] : null], [2, L.boots ? L.tints[L.boots] : null]];
      for (let i = 0; i < d.length; i += 4){ const a = md[i + 3] / 255; if (!a) continue;
        for (let q = 0; q < 2; q++){ const t = chs[q][1]; if (!t) continue; const m = md[i + chs[q][0]] / 255 * a; if (m <= 0) continue; const l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 128 * t[3];
          for (let k = 0; k < 3; k++) d[i + k] = d[i + k] * (1 - m) + Math.min(255, t[k] * l) * m; } }
      g.putImageData(out, 0, 0); }
    else { g.clearRect(0, 0, W, Hh); g.drawImage(sh.img, 0, 0); }
    if (hr && hr.ok){ g.globalCompositeOperation = 'destination-out'; put(hr.img); g.globalCompositeOperation = 'source-over'; }
    cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; cv.getContext('2d').drawImage(LAYT, 0, 0); LAYT.width = LAYT.height = 1;
  } catch (er) { cv = sh.img; if (!window.__layErr){ window.__layErr = 1; console.error('layBody', er); } }
  LAYC.set(key, { cv, use: ++LAYU, at: now });
  while (LAYC.size > LAY_MAX){ let ok = null, ou = 1e18; for (const [k2, v] of LAYC) if (v.use < ou && now - v.at > 2000){   /* nunca tira uma cópia usada nos últimos 2 s (duas fases na evolução, prévias): sem vai-e-vem */ ou = v.use; ok = k2; } if (ok){ const v = LAYC.get(ok); if (v.cv && v.cv.getContext) v.cv.width = v.cv.height = 1; LAYC.delete(ok); } else break; }
  return cv; }
/* chapéu, óculos e máscara na âncora da cabeça do quadro; o ctx já está no espaço da CÉLULA da folha */
function layHead(sh, fi, L){ if (!L || !(L.hat || L.glasses || L.mask) || !sh) return; const mb = layMaskBase(sh); if (!mb) return; const hj = J(mb + '_head.json'), a = hj.head && hj.head[fi]; if (!a || a.ok === false) return;
  /* garoto, golpe e giro: a âncora da cabeça vem na célula LARGA da máscara (448, padLeft 96) e a folha do corpo é de 256: desconta a folga (medido: cabeça em x≈246 numa célula de 256) */
  const mj = J(mb + '_mask.json'), hx = (mj.w > 0 && sh.meta && mj.w !== sh.meta.w) ? (mj.w - sh.meta.w) / 2 : 0; if (!('w' in mj) && !('frames' in mj) && !('note' in mj) && sh.meta && sh.meta.w < 448 && /_(attack|spin)$/.test(mb)) return;   /* .json da máscara ainda carregando */
  const one = (def, dir) => { if (!def || !def.pivot) return; const im = layLoad(dir + def.file); if (!im.ok) return; const s = (a.s > 0 ? a.s : 1) / (def.res || 1);
    ctx.save(); ctx.translate(a.x - hx, a.y); ctx.rotate((a.ang || 0) * Math.PI / 180); ctx.scale(s, s); ctx.drawImage(im.img, -def.pivot.x, -def.pivot.y); ctx.restore(); };
  if (L.hat) one(layHat(L.hat), 'assets/anim/equip/hats/');
  if (L.glasses || L.mask){ const ci = J('assets/anim/equip/cos/cos.json').items || {}; if (L.glasses) one(ci[L.glasses], 'assets/anim/equip/cos/'); if (L.mask) one(ci[L.mask], 'assets/anim/equip/cos/'); } }
