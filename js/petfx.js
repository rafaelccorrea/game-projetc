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
function petMetric(base){ let m = PET_M[base]; if (m) return m; const sh = sheetLoad(PET_DIR + base + '_idle', true); if (!sh.ok) return null; const M = sh.meta, ax = (M.padLeft != null ? M.padLeft : 96) + 128; let h = 150, r = 70, l = 70;
  try { const b = enBounds(sh)[0]; if (b){ h = Math.max(20, b.b - b.t); r = Math.max(10, b.r - ax); l = Math.max(10, ax - b.l); } } catch (e) {} return PET_M[base] = { h, r, l }; }   /* l = meia largura opaca para TRÁS (Derrota: caixa do pet) */
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
function drawPet(){ const I = petInfo(); if (!I || (B.res && B.res.mode === 'era') || hatchHidesPet()) return;   /* ordem do dono: o pet NUNCA some (antes sumia na Vitória/Derrota e por até 5 s a cada ovo chocando); só não é desenhado atrás da Troca de era, que cobre a tela inteira, e enquanto ELE MESMO ainda está dentro do ovo (hatchHidesPet) */ const act = B.res ? null : PETK.act, st = B.deadT > 0 ? 'idle' : act ? 'atk1' : (B.running ? 'run' : 'idle');   /* Engenheiro 17 (P4/P13): com a Vitória/Derrota aberta o petStep para e o golpe em andamento ficava CONGELADO num quadro do ataque (pet no ar / fora do lugar a tela inteira); com resultado aberto o pet fica parado, respirando */
  let sh = petSheet(st); petSheet('idle'); petSheet('run'); petSheet('atk1'); if (!sh || !sh.ok){ sh = petSheet('idle'); if (!sh || !sh.ok) return; }
  const M = sh.meta, n = M.frames || 1, fps = M.fps || 12, fi = act && st === 'atk1' ? Math.min(n - 1, Math.floor(act.t * fps)) : Math.floor(B.at * fps) % n;
  const T = petTbl(), k = petK(), ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
  /* DERROTA (regra do dono: PET SEMPRE NA FRENTE E NUNCA SOME): o pet continua desenhado por ÚLTIMO (draw() do js/battle.js), parado (folha _idle), pés no chão,
     e DESLIZA durante a queda até um lugar em que não tampa o herói caído nem a arma caída (petDieX). petPos() é a posição que o desenho usa (o teste confere por ela). */
  const pp = petPos(), px = pp.x, gy = pp.gy, fly = I.draw.fly ? heroBodyH() * (T.fly + 0.012 * Math.sin(B.at * 3)) : 0;   // ninguém flutua: o voador paira 10-15% acima do chão, com a sombra NO chão
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(px, gy + HS * 0.012, HS * (fly ? 0.09 : 0.13), HS * 0.032, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, px - ax * k, gy - fly - fy * k, M.w * k, M.h * k); }
/* DERROTA: onde o pet fica para NÃO TAMPAR o herói caído nem a arma caída (visto pelo QA: no lugar de sempre ele ficava em cima do peito do herói e cobria a arma).
   dieClear (js/stage.js) dá a caixa do corpo deitado + arma no chão. 1ª escolha: logo ALÉM da arma/cabeça, do lado do inimigo (o pet segue À FRENTE), se o pet
   inteiro couber na tela; senão do lado oposto, junto aos pés do herói. A caixa do pet = meia largura opaca da folha parada (petMetric l / r) × escala. */
const PET_DIE_GAP = 4;
function petDieX(){ const c = dieClear(HM), m = (PETK.base && petMetric(PETK.base)) || { l: 70, r: 70 }, k = petK(), fr = c.r + PET_DIE_GAP + m.l * k;
  if (fr + m.r * k <= LW - 2) return fr; return Math.max(m.l * k + 2, c.l - PET_DIE_GAP - m.r * k); }
/* posição do pet no desenho: x = centro (À FRENTE do herói: petX), gy = linha dos pés (o chão + os px "levemente à frente" da tabela). Na Derrota (morte nova) vai
   de onde estava até o petDieX num deslize curto e suave (primeiros ~0,5 s da queda; sem teleporte) e, se havia montaria (que sai de cena), volta junto para a
   altura de quem está a pé. Fora da batalha (drawHeroFull zera B.deadT) vale sempre a posição normal. */
function petPos(){ const T = petTbl(), mo = petMO(); let x = petX(), e = 0;
  if (B.deadT > 0 && typeof ART_ON !== 'undefined' && ART_ON.kael_die === true && typeof dieClear === 'function'){ const d = Math.max(0, Math.min(1, (1 - B.deadT / 1.6) * 3.2)); e = d * d * (3 - 2 * d); x += (petDieX() - x) * e; }
  return { x, gy: GY + T.dy + (mo ? mo.dy * (1 - e) : 0) }; }
/* CHOCAGEM (regra do dono: o pet nunca some): o pet equipado continua desenhado e o ovo aparece AO LADO dele, no chão, dentro da tela, sem cobrir o herói, o pet
   nem o INIMIGO DA FRENTE (visto pelo QA: à direita do pet o ovo de tamanho cheio cobria o inimigo). hatchPlace escolhe o lugar UMA vez, quando o ovo aparece
   (não anda atrás de inimigo que se mexe):
     1. entre o pet e o inimigo mais próximo (caixa: eX ± dw/2), se couber; o ovo encolhe até HATCH_EW_MIN para caber na folga;
     2. senão do outro lado, junto ao herói, atrás dele (sem cobri-lo), também encolhendo até o mínimo;
     3. sem espaço em nenhum dos dois (montado: a montaria ocupa as costas e o pet fica perto do inimigo): vai para o lado com MAIS folga, SEM respiro, encolhendo
        até HATCH_EW_TINY para caber encostado; só com menos que isso de folga (inimigo no meio do golpe) ele encosta alguns px em alguém.
   Única exceção ao "ao lado": quando o pet que está no ovo É o equipado (1º ovo do nível 20: ele entra equipado na hora), ele ainda não nasceu; o ovo fica no
   lugar do pet e o pet só passa a ser desenhado quando termina de saltar do ovo (HATCH_BORN). Nada some: ele nasce ali. */
const HATCH_EW = 0.5, HATCH_EW_MIN = 0.24, HATCH_EW_TINY = 0.16, HATCH_GAP = 4;   // largura do ovo cheia, mínima e mínima no aperto (× HS) · respiro (px)
function hatchPlace(h){ const full = HS * HATCH_EW, mn = HS * HATCH_EW_MIN; if (!PETK.info || hatchOwn(h)) return { x: petX(), ew: full, side: 'pet' };
  const m = (PETK.base && petMetric(PETK.base)) || { l: 70, r: 70 }, pr = petX() + m.r * petK(); let el = LW - 2;
  try { for (const e of B.en) if (!e.dead && e.x < WAITX - 1) el = Math.min(el, eX(e) - (e.dw || 70) * 0.5); } catch (er) {}   /* borda esquerda do inimigo mais próximo */
  const hl = HX - HS * (petMO() ? 0.45 : KAEL_W / 2), ra = el - pr - 2 * HATCH_GAP, rb = hl - HATCH_GAP - 2;   /* hl = borda de trás do herói (montado: a garupa da montaria); ra / rb = folga à frente / atrás */
  if (ra >= mn){ const ew = Math.min(full, ra); return { x: Math.min(LW - 2 - ew / 2, pr + HATCH_GAP + ew / 2), ew, side: 'front' }; }
  if (rb >= mn){ const ew = Math.min(full, rb); return { x: Math.max(2 + ew / 2, hl - HATCH_GAP - ew / 2), ew, side: 'back' }; }
  const fa = el - pr, fb = hl - 2, tiny = HS * HATCH_EW_TINY;   /* aperto: folga crua (sem respiro) de cada lado */
  if (fa >= fb){ const ew = Math.max(tiny, Math.min(mn, fa)); return { x: Math.min(LW - 2 - ew / 2, pr + ew / 2), ew, side: 'front' }; }
  const ew = Math.max(tiny, Math.min(mn, fb)); return { x: Math.max(2 + ew / 2, hl - ew / 2), ew, side: 'back' }; }
function hatchSet(h){ if (h && h.x == null){ const p = hatchPlace(h); h.x = p.x; h.ew = p.ew; h.side = p.side; } return h; }
const HATCH_BORN = 3.1;
const hatchOwn = h => !!h && !h.dup && !!PETK.info && PETK.info.id === h.pet;
function hatchHidesPet(){ const h = HATCH.cur; return !!h && hatchOwn(h) && B.at - h.t0 < HATCH_BORN; }
const hatchX = h => hatchSet(h).x;
/* CHOCAR (por código, sobre a batalha): o ovo treme, racha, luz, o pet salta ao chão; depois o nome e a raridade */
function drawHatch(){ if (!petOk()) return; if (!HATCH.cur){ if (!HATCH.q.length || B.res || B.paused || view !== 'battle') return; const h = HATCH.q.shift(); h.t0 = B.at; HATCH.cur = h; snd('claim');
    if (!HATCH.egg){ HATCH.egg = new Image(); HATCH.egg.src = 'assets/pets/pet_egg.png'; } if (h.sprite) sheetLoad(PET_DIR + h.sprite + '_idle', true); }
  const h = hatchSet(HATCH.cur), T = B.at - h.t0, cx = h.x, gy = GY, eg = HATCH.egg, col = RAR[h.r] ? RAR[h.r].c : '#fff';
  if (T > 5.2){ HATCH.cur = null; return; }
  const ew = h.ew, eh = eg && eg.naturalWidth ? ew * eg.naturalHeight / eg.naturalWidth : ew * 1.25;
  if (T < 2.4 && eg && eg.complete && eg.naturalWidth){ const sh = T < 1.4 ? Math.sin(T * 22) * 0.05 * (T / 1.4) : Math.sin(T * 40) * 0.1; ctx.save(); ctx.translate(cx, gy); ctx.rotate(sh); ctx.drawImage(eg, -ew / 2, -eh, ew, eh);
    if (T > 1.4){ const p = Math.min(1, (T - 1.4) / 0.8); ctx.strokeStyle = '#2a1403'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-ew * 0.28, -eh * 0.55);
      [[-0.12, -0.42], [-0.02, -0.6], [0.1, -0.44], [0.2, -0.62], [0.3, -0.5]].slice(0, Math.ceil(p * 5)).forEach(q => ctx.lineTo(q[0] * ew, q[1] * eh)); ctx.stroke(); }
    ctx.restore(); }
  if (T >= 2.1 && T < 3.1){ const p = T - 2.1; drawGlow('#ffffff', cx, gy - eh * 0.5, HS * (0.3 + 1.4 * p), Math.max(0, 1 - p)); drawGlow(col, cx, gy - eh * 0.5, HS * (0.5 + 1.0 * p), Math.max(0, 0.8 - p)); }
  if (T >= 2.4){ const sh = h.sprite ? sheetLoad(PET_DIR + h.sprite + '_idle', true) : null, p = Math.min(1, (T - 2.4) / 0.7), jump = Math.sin(p * Math.PI) * HS * 0.45, x = cx;
    if (sh && sh.ok && !(hatchOwn(h) && T >= HATCH_BORN)){ const M = sh.meta, k = heroBodyH() * 0.46 / Math.max(20, (petMetric(h.sprite) || { h: 150 }).h), fi = Math.floor(B.at * (M.fps || 12)) % M.frames, ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, x - ax * k, gy - jump - fy * k, M.w * k, M.h * k); ctx.restore(); }
    if (!h.said){ h.said = true; B.banner = { txt: h.name + ' · ' + (RAR[h.r] ? RAR[h.r].n : ''), pill: true, bg: 'rgba(29,22,17,.92)', bd: col, sh: '#0e0a07', t: 0, dur: 2.4, col }; }   // nome e raridade na faixa de aviso do jogo (fora das barras do Kael)
  }
}
/* debug / modo dono: ganhar um ovo agora (raridade opcional) */
function petGiveEgg(r){ if (!petOk()) return null; let x = null; try { x = Sys.pet.addEgg(S, Sys.host, r != null ? { r, source: 'test' } : { source: 'test' }); } catch (e) { console.error('addEgg', e); } petNotice([x]); if (typeof refreshHero === 'function') refreshHero(); save(); return x; }
