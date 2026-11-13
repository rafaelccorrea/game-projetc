'use strict';
/* ================= PACOTE DE PETS (v0.12.6) — ovo do nível 20, pet na batalha, avisos de ovo =================
   Módulo: js/sys/pet.js (fps-e2), ligado com v3 + v20 + v17 (reports/ligar-sistemas-e2.md §3). Aqui só o JOGO: quando chocar, o que desenhar,
   quando o pet bate. Nenhuma fórmula própria: dano = st.atk × st.pet.atk × hitMult × rollAttack().mult (Sys.fc.stats + Sys.pet); cura por onda =
   st.hp × st.pet.heal. Arte: assets/anim/pets/<base>_{run,idle,atk1}.png/.json (célula 512x352, pés em feetY do .json, 12 fps), só do pet equipado.
   Chave geral: PETS_ON. Desligada, nada disto roda e o Sys.pet fica como veio (portões fechados). */
const PETS_ON = true;
const PET_DIR = 'assets/anim/pets/', PET_SCALE = [0.60, 0.74, 0.88];
/* v0.12.7 (ORDEM DO DONO): o pet fica AO LADO do Kael, um pouco À FRENTE, na mesma linha do chão, por cima da montaria; nada esconde nada.
   TABELA de posição (um conjunto por pet; '_' = padrão): dx = centro do pet à frente do centro do Kael, em fração da LARGURA do corpo dele (0,35-0,45);
   dy = px para baixo (levemente à frente); h = altura do pet em fração da altura do Kael por estágio (filhote, médio, evoluído: 0,45-0,55, estágio 3 até 0,65);
   fly = quanto o voador paira acima do chão, em fração da altura do Kael (0,10-0,15). */
const PET_TBL = { _: { dx: 0.42, dy: 5, h: [0.46, 0.52, 0.62], fly: 0.12 },
  era0_mammoth: { dx: 0.42, dy: 5, h: [0.46, 0.52, 0.62] }, era1_sphinx: { dx: 0.42, dy: 5, h: [0.46, 0.52, 0.62] }, era2_dragon: { dx: 0.42, dy: 5, h: [0.48, 0.54, 0.64] },
  era3_parrot: { dx: 0.44, dy: 0, h: [0.40, 0.46, 0.56], fly: 0.13 }, era4_mechdog: { dx: 0.42, dy: 5, h: [0.46, 0.52, 0.62] } };
const KAEL_W = 0.56;   // largura do corpo do Kael ÷ lado do quadro (84 de 149 px)
const petTbl = () => { const sp = PETK.info ? PETK.info.draw.sprite : ''; return Object.assign({}, PET_TBL._, PET_TBL[sp] || {}); };
const PET_MOUNT = { dx: 0.62, dy: 9 };   // acréscimos quando há montaria: mais à frente (fração da largura do Kael) e mais para baixo (px)
const petMounted = () => typeof HM !== 'undefined' && !!HM.mount && typeof mountReady === 'function' && mountReady(HM.mount.id);
const petMO = () => (petMounted() && typeof mountPetOff === 'function' && mountPetOff()) || (petMounted() ? PET_MOUNT : null);   // tabela por montaria (js/mountfx.js)
const petX = () => { const mo = petMO(); return HX + HS * KAEL_W * (petTbl().dx + (mo ? mo.dx : 0)); };
/* medida da folha parada (uma vez por folha): altura e meia largura opacas, em px da célula */
const PET_M = {};
function petMetric(base){ let m = PET_M[base]; if (m) return m; const sh = sheetLoad(PET_DIR + base + '_idle', true); if (!sh.ok) return null; const M = sh.meta, ax = (M.padLeft != null ? M.padLeft : 96) + 128; let h = 150, r = 70;
  try { const b = enBounds(sh)[0]; if (b){ h = Math.max(20, b.b - b.t); r = Math.max(10, b.r - ax); } } catch (e) {} return PET_M[base] = { h, r }; }
function petK(){ const I = PETK.info; if (!I) return HS / 256 * 0.5; const m = petMetric(PETK.base), T = petTbl(), f = T.h[Math.max(0, Math.min(2, (I.stage | 0) - 1))] || 0.5; return m ? heroBodyH() * f / m.h : HS / 256 * 0.5; }
/* até onde o pet passa da borda do corpo do Kael (px lógicos): o inimigo da frente guarda a folga a partir daí; o pet não se mistura com ele */
function petFront(){ const I = PETK.info; if (!I || !PETK.base) return 0; const m = petMetric(PETK.base); if (!m) return 0; return Math.max(0, petX() + m.r * petK() - HERO_EDGE); }   // filhote, médio, evoluído: fração da escala do quadro do Kael (o filhote fica menor que ele)
const PET_BACK = 0.34;   // o pet fica ATRÁS do Kael, meio corpo para a esquerda (o Kael está a ~60 px da borda: mais que isso sai da tela)
const PETK = { id: null, info: null, base: '', t: 0, atkT: 0, act: null, infoT: 0 };
const HATCH = { q: [], cur: null, egg: null };
const petOk = () => PETS_ON && typeof Sys !== 'undefined' && !!Sys.pet;
function petBoot(){ if (!petOk()) return;
  try { Sys.pet.DATA.v3 = true; Sys.pet.DATA.v20.on = true; Sys.pet.setV17(true); Sys.pet.ensure(S); } catch (e) { console.error('petBoot', e); return; }
  petLevel(true); }
/* OVO DO NÍVEL 20: ao chegar no nível (ou na carga, se já passou). Os ovos guardados antes do 20 chocam juntos (vêm em r.pre). */
function petLevel(atBoot){ if (!petOk()) return; let r = null; try { r = Sys.pet.firstEgg(S, Sys.host); } catch (e) { console.error('firstEgg', e); return; }
  if (!r || !r.ok) return; petHatchQueue(r.hatch || { pet: r.pet, name: r.name, r: r.rarity }, true); petNotice(r.pre || []);
  if (typeof refreshHero === 'function') refreshHero(); save(); if (typeof fbLayout === 'function') fbLayout(); }
function petHatchQueue(h, first){ if (!h || !h.pet) return; const sp = (Sys.pet.DATA.v17 && Sys.pet.DATA.v17.species && Sys.pet.DATA.v17.species[h.pet]) || {}, info = { name: sp.name, sprite: sp.sprite, r: sp.r }; const r = h.r != null ? h.r : info.r | 0;
  HATCH.q.push({ pet: h.pet, name: h.name || info.name || 'Pet', r: Math.max(0, Math.min(4, r | 0)), sprite: info.sprite || null, first: !!first, dup: !!h.dup }); }
/* AVISOS DE OVO: recebe a lista de respostas do Sys.pet.addEgg (drops, chefe, baú, prêmios). Nunca "chocou undefined". */
function petNotice(list){ if (!petOk() || !Array.isArray(list)) return; if (typeof codexSync === 'function') setTimeout(codexSync, 0);   /* códex: ovo/pet novo */
  for (const x of list){ if (!x) continue;
    if (x.held && x.pre) toast('Ovo guardado: choca no nível ' + (x.needLevel || 20));
    else if (x.choice){ if (Screens.reg && Screens.reg.eggpick && !Screens.reg.eggpick.broken) Screens.open('eggpick', { index: x.index, options: x.options }); else toast('Você ganhou um ovo para escolher: abra Pets'); }
    else if (x.held && x.gated) toast('Ovo de ' + (x.name || 'pet raro') + ' guardado até você liberar essa raridade');
    else if (x.held) toast('Ovo guardado');
    else if (x.pet) petHatchQueue(x, false); } }
function petInfo(){ if (!petOk()) return null; if (B.at - PETK.infoT > 0.5 || !PETK.infoT){ PETK.infoT = B.at || 0.001; let i = null; try { i = Sys.pet.battleInfo(S, Sys.host); } catch (e) { i = null; }
    const old = PETK.info; PETK.info = i && i.draw && i.draw.base ? i : null; const b = PETK.info ? PETK.info.draw.base : '';
    if (b !== PETK.base){   /* Engenheiro 5: pet NOVO (ou estágio novo) só entra com as folhas dele decodificadas; até lá o anterior continua na tela (o pet nunca some) */
      if (b && PETK.base && old && !petReady(b) && !(typeof lookWait === 'function' && lookWait('pet', b))){ PETK.info = old; PETK.infoT = B.at - 0.4; }
      else { PETK.base = b; PETK.act = null; PETK.atkT = 0; } } }
  return PETK.info; }
function petReady(base){ let ok = true; for (const st of ['idle', 'run', 'atk1']){ const s = sheetLoad(PET_DIR + base + '_' + st, true); if (!s.ok && !s.fail) ok = false; } return ok; }
const petSheet = st => PETK.base ? sheetLoad(PET_DIR + PETK.base + '_' + st, true) : null;
/* passo da batalha: o pet bate sozinho no inimigo da frente a cada info.interval segundos */
function petStep(dt){ const I = petInfo(); if (!I || B.deadT > 0 || B.res) return; PETK.t += dt; PETK.atkT += dt;   /* o intervalo conta do INÍCIO de um golpe ao início do outro (a animação do golpe não soma) */
  if (PETK.act){ const a = PETK.act; a.t += dt;
    if (!a.done && a.t >= a.hitT){ a.done = true; const e = (a.e && !a.e.dead) ? a.e : target(); if (e) petHit(e, I); }
    if (a.t >= a.dur) PETK.act = null; return; }
  if (PETK.atkT < (I.interval || 2)) return; const e = target(); if (!e || e.x > LW - 10) return;
  PETK.atkT = 0; const sh = petSheet('atk1'), dur = sh && sh.ok ? sh.meta.frames / (sh.meta.fps || 12) : 0.6; PETK.act = { t: 0, dur, hitT: dur * 0.5, e, done: false }; }
function petHit(e, I){ let st = null, roll = null; try { st = heroStats(); roll = Sys.pet.rollAttack(S, I.id); } catch (er) {}
  const pa = st && st.pet ? st.pet.atk : 0; if (!(pa > 0)) return; const d = st.atk * pa * (I.hitMult || 1) * (roll && roll.mult ? roll.mult : 1); if (!(d > 0)) return;
  const ex = eX(e), ey = eY(e), big = roll && roll.type === 'crit';
  e.hp -= d; e.hit = 0.12; floatText(ex + 10, e.boss ? GY - (e.dh || 150) - 20 : GY - (e.dh || 90) - 6, fmt(d), big ? '#ffd23f' : '#9af0ff', big ? 1 : 0);
  burst(ex - 4, ey + 4, '#9af0ff', big ? 7 : 4); ring(ex - 6, ey, big ? '#ffd23f' : '#9af0ff', big ? 30 : 20);   // impacto por código, na altura do inimigo
  if (window.__stay && e.hp <= 0) e.hp = e.maxhp; if (e.hp <= 0) killEnemy(e); }
/* cura por onda (pets de cura): st.hp × st.pet.heal */
function petWave(){ const I = petInfo(); if (!I || !B.hero) return; let st = null; try { st = heroStats(); } catch (e) {} const ph = st && st.pet ? st.pet.heal : 0; if (!(ph > 0)) return;
  const v = st.hp * ph, h = B.hero, b = h.hp; h.hp = Math.min(h.maxhp, h.hp + v); if (h.hp > b + 0.5) floatText(HX, GY - HS - 6, '+' + fmt(h.hp - b), '#7ee27a', 0); }
/* desenho: atrás do Kael, pés na linha do chão; anda com o cenário, respira parado, golpeia no lugar */
function drawPet(){ const I = petInfo(); if (!I || (B.res && B.res.mode === 'era') || HATCH.cur) return;   /* ordem do dono: o pet NUNCA some (antes sumia na Vitória/Derrota); só não é desenhado atrás da Troca de era, que cobre a tela inteira */ const act = B.res ? null : PETK.act, st = B.deadT > 0 ? 'idle' : act ? 'atk1' : (B.running ? 'run' : 'idle');   /* Engenheiro 17 (P4/P13): com a Vitória/Derrota aberta o petStep para e o golpe em andamento ficava CONGELADO num quadro do ataque (pet no ar / fora do lugar a tela inteira); com resultado aberto o pet fica parado, respirando */
  let sh = petSheet(st); petSheet('idle'); petSheet('run'); petSheet('atk1'); if (!sh || !sh.ok){ sh = petSheet('idle'); if (!sh || !sh.ok) return; }
  const M = sh.meta, n = M.frames || 1, fps = M.fps || 12, fi = act && st === 'atk1' ? Math.min(n - 1, Math.floor(act.t * fps)) : Math.floor(B.at * fps) % n;
  const T = petTbl(), k = petK(), ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
  /* Engenheiro 2: na MORTE do Kael (morte nova) o pet RECUA para trás dele, para não ficar em cima do corpo caído */
  const dieK = (B.deadT > 0 && typeof ART_ON !== 'undefined' && ART_ON.kael_die === true) ? Math.min(1, (1 - B.deadT / 1.6) * 3.2) : 0, backX = HX - HS * KAEL_W * PET_BACK * 1.5;
  const dieE = dieK * dieK * (3 - 2 * dieK), px0 = petX(), px = px0 + (backX - px0) * dieE, gy = GY + T.dy + (petMO() ? petMO().dy * (1 - dieE) : 0),   /* morte nova: o Kael cai A PÉ e a montaria sai; o pet volta para a altura de quem está a pé (antes ficava os px da montaria abaixo da linha) */ fly = I.draw.fly ? heroBodyH() * (T.fly + 0.012 * Math.sin(B.at * 3)) : 0;   // ninguém flutua: o voador paira 10-15% acima do chão, com a sombra NO chão
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(px, gy + HS * 0.012, HS * (fly ? 0.09 : 0.13), HS * 0.032, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, px - ax * k, gy - fly - fy * k, M.w * k, M.h * k); }
/* CHOCAR (por código, sobre a batalha): o ovo treme, racha, luz, o pet salta ao chão; depois o nome e a raridade */
function drawHatch(){ if (!petOk()) return; if (!HATCH.cur){ if (!HATCH.q.length || B.res || B.paused || view !== 'battle') return; const h = HATCH.q.shift(); h.t0 = B.at; HATCH.cur = h; snd('claim');
    if (!HATCH.egg){ HATCH.egg = new Image(); HATCH.egg.src = 'assets/pets/pet_egg.png'; } if (h.sprite) sheetLoad(PET_DIR + h.sprite + '_idle', true); }
  const h = HATCH.cur, T = B.at - h.t0, cx = petX(), gy = GY, eg = HATCH.egg, col = RAR[h.r] ? RAR[h.r].c : '#fff';
  if (T > 5.2){ HATCH.cur = null; return; }
  const ew = HS * 0.5, eh = eg && eg.naturalWidth ? ew * eg.naturalHeight / eg.naturalWidth : ew * 1.25;
  if (T < 2.4 && eg && eg.complete && eg.naturalWidth){ const sh = T < 1.4 ? Math.sin(T * 22) * 0.05 * (T / 1.4) : Math.sin(T * 40) * 0.1; ctx.save(); ctx.translate(cx, gy); ctx.rotate(sh); ctx.drawImage(eg, -ew / 2, -eh, ew, eh);
    if (T > 1.4){ const p = Math.min(1, (T - 1.4) / 0.8); ctx.strokeStyle = '#2a1403'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-ew * 0.28, -eh * 0.55);
      [[-0.12, -0.42], [-0.02, -0.6], [0.1, -0.44], [0.2, -0.62], [0.3, -0.5]].slice(0, Math.ceil(p * 5)).forEach(q => ctx.lineTo(q[0] * ew, q[1] * eh)); ctx.stroke(); }
    ctx.restore(); }
  if (T >= 2.1 && T < 3.1){ const p = T - 2.1; drawGlow('#ffffff', cx, gy - eh * 0.5, HS * (0.3 + 1.4 * p), Math.max(0, 1 - p)); drawGlow(col, cx, gy - eh * 0.5, HS * (0.5 + 1.0 * p), Math.max(0, 0.8 - p)); }
  if (T >= 2.4){ const sh = h.sprite ? sheetLoad(PET_DIR + h.sprite + '_idle', true) : null, p = Math.min(1, (T - 2.4) / 0.7), jump = Math.sin(p * Math.PI) * HS * 0.45, x = cx;
    if (sh && sh.ok){ const M = sh.meta, k = heroBodyH() * 0.46 / Math.max(20, (petMetric(h.sprite) || { h: 150 }).h), fi = Math.floor(B.at * (M.fps || 12)) % M.frames, ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, x - ax * k, gy - jump - fy * k, M.w * k, M.h * k); ctx.restore(); }
    if (!h.said){ h.said = true; B.banner = { txt: h.name + ' · ' + (RAR[h.r] ? RAR[h.r].n : ''), pill: true, bg: 'rgba(29,22,17,.92)', bd: col, sh: '#0e0a07', t: 0, dur: 2.4, col }; }   // nome e raridade na faixa de aviso do jogo (fora das barras do Kael)
  }
}
/* debug / modo dono: ganhar um ovo agora (raridade opcional) */
function petGiveEgg(r){ if (!petOk()) return null; let x = null; try { x = Sys.pet.addEgg(S, Sys.host, r != null ? { r, source: 'test' } : { source: 'test' }); } catch (e) { console.error('addEgg', e); } petNotice([x]); if (typeof refreshHero === 'function') refreshHero(); save(); return x; }
