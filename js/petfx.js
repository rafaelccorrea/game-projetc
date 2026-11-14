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
function petFront(){ const I = PETK.info; if (!I || !PETK.base) return 0; const m = petMetric(PETK.base); if (!m) return 0; return Math.max(0, petX() + m.r * petK() - HERO_EDGE, hatchReserve() - HERO_EDGE); }   /* com ovo chocando à frente do pet, a folga do inimigo conta a partir do OVO (hatchReserve) */   // filhote, médio, evoluído: fração da escala do quadro do Kael (o filhote fica menor que ele)
const PET_BACK = 0.34;   // o pet fica ATRÁS do Kael, meio corpo para a esquerda (o Kael está a ~60 px da borda: mais que isso sai da tela)
const PETK = { id: null, info: null, base: '', t: 0, atkT: 0, act: null, infoT: 0, ov: null };
/* PET TROCÁVEL NO DESENHO (pedido da Sistemas para o StageKit; drawHeroFull com state.pet = {base, stage 1-3, fly}): troca o pet SÓ durante um desenho e devolve
   uma função que desfaz. Não toca no save nem no pet da batalha (PETK.info/base voltam iguais). base = sprite + '' | '_mid' | '_evo' (formato do heroSnapshot). */
function petOvSet(p){ if (!p || typeof p.base !== 'string' || !/^[a-z0-9_]{1,40}$/.test(p.base)) return null; const s0 = { info: PETK.info, base: PETK.base, ov: PETK.ov };
  const m = /^(.*?)(_mid|_evo)?$/.exec(p.base), stage = Math.max(1, Math.min(3, (p.stage | 0) || (m[2] === '_evo' ? 3 : m[2] === '_mid' ? 2 : 1)));
  const I = { id: m[1], stage, interval: 0, hitMult: 0, draw: { base: p.base, sprite: m[1], fly: !!p.fly } }; PETK.ov = I; PETK.info = I; PETK.base = p.base;
  return () => { PETK.info = s0.info; PETK.base = s0.base; PETK.ov = s0.ov; }; }
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
function petInfo(){ if (PETK.ov) return PETK.ov; if (!petOk()) return null; if (B.inst && B.inst.run && B.inst.run.noPet) return null;   /* Provação "sem pet" (docs/LIGACOES_BATALHA.md, P1): não bate, não cura, não aparece */ if (B.at - PETK.infoT > 0.5 || !PETK.infoT){ PETK.infoT = B.at || 0.001; let i = null; try { i = Sys.pet.battleInfo(S, Sys.host); } catch (e) { i = null; }
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
/* GOLPE PRÓPRIO DE CADA PET (PO: item completo). O Sys.pet diz a COR e o TIPO do impacto de cada espécie (I.draw.fx = {color, hit, glow}; tabela PET_BATTLE do
   js/sys/pet.js) e a batalha não lia: todo pet batia com o mesmo estouro azul. PET_HIT = uma receita por tipo, só com as peças que já existem (burst = partículas,
   ring = anel, dust = poeira): sem folha nova e sem custo por quadro além das partículas do golpe. Tipo que a tabela não conhece (pet que vier) = 'impact' na
   cor dele. Sem draw.fx (formato antigo) = o estouro azul de antes. Crítico: mantém o anel dourado por cima. ?debug=1&petfx=0 volta ao estouro de antes.
   (x, y) = ponto do impacto no inimigo · px = onde o pet está · c = cor do pet · n = partículas (mais no crítico) · r = raio do anel */
const PET_HIT_ON = !(typeof DEBUG !== 'undefined' && DEBUG && /[?&]petfx=0/.test(location.search));
const PET_HIT = {
  impact:  (x, y, c, n, r) => { burst(x - 4, y + 4, c, n); ring(x - 6, y, c, r); },
  fire:    (x, y, c, n, r) => { burst(x - 4, y + 4, c, n + 2, 1.25); burst(x - 2, y, '#ffd27a', 3, 0.8); ring(x - 6, y, c, r); },
  ice:     (x, y, c, n, r) => { burst(x - 4, y + 2, c, n, 0.9); burst(x - 4, y - 6, '#ffffff', 3, 0.6); ring(x - 6, y, c, r + 6); },
  spark:   (x, y, c, n, r) => { burst(x - 4, y, '#ffffff', 3, 1.7); burst(x - 4, y + 2, c, n + 1, 1.6); ring(x - 6, y, c, r - 4); },
  sand:    (x, y, c, n, r) => { burst(x - 4, y + 8, c, n + 3, 0.7); dust(x - 6, y + 14, 4, c); ring(x - 6, y + 4, c, r); },
  feather: (x, y, c, n, r) => { burst(x - 4, y - 8, c, n + 1, 0.8); burst(x, y - 12, '#ffffff', 2, 0.5); ring(x - 6, y - 4, c, r); },
  poison:  (x, y, c, n, r) => { burst(x - 4, y + 4, c, n + 1, 0.6); ring(x - 6, y, c, r - 6); ring(x - 6, y, c, r + 8); },
  light:   (x, y, c, n, r) => { burst(x - 4, y, c, n, 1.1); ring(x - 6, y, '#ffffff', r - 4); ring(x - 6, y, c, r + 12); },
  prism:   (x, y, c, n, r) => { for (const q of ['#ff8ad8', '#8ff5ff', '#ffe07a']) burst(x - 4, y + 2, q, Math.max(2, Math.round(n / 2)), 1.1); ring(x - 6, y, c, r + 4); },
  dash:    (x, y, c, n, r, px) => { const d = Math.max(0, x - px); for (let i = 1; i <= 3; i++) burst(px + d * i / 4, y + 6, c, 2, 0.5); burst(x - 4, y + 4, c, n, 1.2); ring(x - 6, y, c, r); },   /* rastro do pet até o inimigo */
  blink:   (x, y, c, n, r, px, py) => { ring(px, py, c, 16); burst(x + 10, y + 2, c, n + 1, 1.1); ring(x + 8, y, c, r); },   /* some de onde está e reaparece ATRÁS do inimigo */
};
function petHitFx(I, ex, ey, big){ const f = PET_HIT_ON && I && I.draw && I.draw.fx; const n = big ? 7 : 4, r = big ? 30 : 20;
  if (!f || typeof f.color !== 'string' || !f.color){ burst(ex - 4, ey + 4, '#9af0ff', n); ring(ex - 6, ey, big ? '#ffd23f' : '#9af0ff', r); return 'antigo'; }
  const kind = PET_HIT[f.hit] ? f.hit : 'impact'; let px = ex - 40, py = ey; try { const p = petPos(); px = p.x; py = p.gy - HS * 0.12; } catch (er) {}
  PET_HIT[kind](ex, ey, f.color, n + Math.min(3, f.glow | 0), r, px, py); if (big) ring(ex - 6, ey, '#ffd23f', r + 4); return kind; }
function petHit(e, I){ let st = null, roll = null; try { st = heroStats(); roll = Sys.pet.rollAttack(S, I.id); } catch (er) {}
  const pa = st && st.pet ? st.pet.atk : 0; if (!(pa > 0)) return; const d = st.atk * pa * (I.hitMult || 1) * (roll && roll.mult ? roll.mult : 1); if (!(d > 0)) return;
  const ex = eX(e), ey = eY(e), big = roll && roll.type === 'crit';
  e.hp -= d; e.hit = 0.12; floatText(ex + 10, e.boss ? GY - (e.dh || 150) - 20 : GY - (e.dh || 90) - 6, fmt(d), big ? '#ffd23f' : '#9af0ff', big ? 1 : 0);
  petHitFx(I, ex, ey, big);   // impacto por código, na altura do inimigo, na cor e no tipo do pet
  if (window.__stay && e.hp <= 0) e.hp = e.maxhp; if (e.hp <= 0) killEnemy(e); }
/* cura por onda (pets de cura): st.hp × st.pet.heal */
function petWave(){ const I = petInfo(); if (!I || !B.hero) return; let st = null; try { st = heroStats(); } catch (e) {} const ph = st && st.pet ? st.pet.heal : 0; if (!(ph > 0)) return;
  const v = st.hp * ph, h = B.hero, b = h.hp; h.hp = Math.min(h.maxhp, h.hp + v); if (h.hp > b + 0.5) floatText(HX, GY - HS - 6, '+' + fmt(h.hp - b), '#7ee27a', 0); }
/* desenho: atrás do Kael, pés na linha do chão; anda com o cenário, respira parado, golpeia no lugar */
/* AURA DO PET POR ESTÁGIO (levantamento da Arte, item 2: a arte existe em assets/anim/aura e o Sys.pet já diz qual é, I.draw.aura = {id, sheet}; faltava desenhar).
   Sai ATRÁS do pet, com a base nos pés dele (âncora [0.5, 1] da folha), largura pela caixa opaca do pet e a mistura da própria folha ("lighter").
   Folha ainda carregando = sem aura neste quadro (nunca segura o pet). ?debug=1&petaura=0 desliga para comparar. petAuraBox() devolve a caixa (teste). */
const PET_AURA_ON = !(typeof DEBUG !== 'undefined' && DEBUG && /[?&]petaura=0/.test(location.search)), PET_AURA_W = 1.45, PET_AURA_A = 0.8;
function petAuraBox(I, px, base, k){ const a = PET_AURA_ON && I && I.draw && I.draw.aura; if (!a || !a.sheet) return null; const s = sheetLoad(a.sheet, true); if (!s || !s.ok) return null;
  const M = s.meta, m = (PETK.base && petMetric(PETK.base)) || { l: 70, r: 70 }, w = (m.l + m.r) * k * PET_AURA_W, h = w * M.h / M.w, cx = px + (m.r - m.l) * k / 2;
  return { s, M, x: cx - w / 2, y: base + HS * 0.02 - h, w, h, fi: Math.floor(B.at * (M.fps || 12)) % (M.frames || 1) }; }
function drawPetAura(I, px, base, k){ const b = petAuraBox(I, px, base, k); if (!b) return false;
  ctx.save(); ctx.globalAlpha = PET_AURA_A; if (b.M.blend === 'lighter') ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(b.s.img, sheetSX(b.M, b.fi), sheetSY(b.M, b.fi), b.M.w, b.M.h, b.x, b.y, b.w, b.h); ctx.restore(); return true; }
function drawPet(){ const I = petInfo(); if (!I || (B.res && B.res.mode === 'era') || hatchHidesPet()) return;   /* ordem do dono: o pet NUNCA some (antes sumia na Vitória/Derrota e por até 5 s a cada ovo chocando); só não é desenhado atrás da Troca de era, que cobre a tela inteira, e enquanto ELE MESMO ainda está dentro do ovo (hatchHidesPet) */ const act = B.res ? null : PETK.act, st = B.deadT > 0 ? 'idle' : act ? 'atk1' : (B.running ? 'run' : 'idle');   /* Engenheiro 17 (P4/P13): com a Vitória/Derrota aberta o petStep para e o golpe em andamento ficava CONGELADO num quadro do ataque (pet no ar / fora do lugar a tela inteira); com resultado aberto o pet fica parado, respirando */
  let sh = petSheet(st); petSheet('idle'); petSheet('run'); petSheet('atk1'); if (!sh || !sh.ok){ sh = petSheet('idle'); if (!sh || !sh.ok) return; }
  const M = sh.meta, n = M.frames || 1, fps = M.fps || 12, fi = act && st === 'atk1' ? Math.min(n - 1, Math.floor(act.t * fps)) : Math.floor(B.at * fps) % n;
  const T = petTbl(), k = petK(), ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
  /* DERROTA (regra do dono: PET SEMPRE NA FRENTE E NUNCA SOME): o pet continua desenhado por ÚLTIMO (draw() do js/battle.js), parado (folha _idle), pés no chão,
     e DESLIZA durante a queda até um lugar em que não tampa o herói caído nem a arma caída (petDieX). petPos() é a posição que o desenho usa (o teste confere por ela). */
  const pp = petPos(), px = pp.x, gy = pp.gy, fly = I.draw.fly ? heroBodyH() * (T.fly + 0.012 * Math.sin(B.at * 3)) : 0;   // ninguém flutua: o voador paira 10-15% acima do chão, com a sombra NO chão
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = '#1e1208'; ctx.beginPath(); ctx.ellipse(px, gy + HS * 0.012, HS * (fly ? 0.09 : 0.13), HS * 0.032, 0, 0, 7); ctx.fill(); ctx.restore();
  drawPetAura(I, px, gy - fly, k);   /* aura do estágio: depois da sombra, antes do corpo */
  ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, px - ax * k, gy - fly - fy * k, M.w * k, M.h * k); }
/* DERROTA: onde o pet fica para NÃO TAMPAR o herói caído nem a arma caída (visto pelo QA: no lugar de sempre ele ficava em cima do peito do herói e cobria a arma)
   NEM ENCOSTAR no inimigo que ficou em cena (visto pelo QA: além da arma ele ficou em cima do tigre da borda direita). dieClear (js/stage.js) dá a caixa do corpo
   deitado + arma no chão; a dos inimigos vivos na tela é eX ± dw/2. 1ª escolha: logo ALÉM da arma/cabeça, do lado do inimigo, se o pet inteiro couber ENTRE a arma
   e o inimigo mais próximo (e na tela); senão do lado oposto, junto aos pés do herói (lá o espaço até a borda é curto: o pet pode ficar por cima da ponta do
   cachecol/dos pés, nunca do tronco, do rosto nem da arma). A caixa do pet = meia largura opaca da folha parada (petMetric l / r) × escala. */
const PET_DIE_GAP = 4, PET_DIE_EDGE = 4;
function enemyLeft(){ let el = LW; try { for (const e of B.en) if (!e.dead && eX(e) - (e.dw || 70) * 0.5 < LW) el = Math.min(el, eX(e) - (e.dw || 70) * 0.5); } catch (er) {} return el; }   /* borda esquerda do inimigo vivo mais próximo (LW = nenhum na tela) */
function petDieX(){ const c = dieClear(HM), m = (PETK.base && petMetric(PETK.base)) || { l: 70, r: 70 }, k = petK(), fr = c.r + PET_DIE_GAP + m.l * k;
  if (fr + m.r * k <= Math.min(LW - PET_DIE_EDGE, enemyLeft() - PET_DIE_GAP)) return fr; return Math.max(m.l * k + PET_DIE_EDGE, c.l - PET_DIE_GAP - m.r * k); }
/* fração da queda (0 → 1 em 1,6 s); com o gancho de debug dbgDieAt, o instante congelado */
const dieP = () => (typeof DBGFX !== 'undefined' && DBGFX && DBGFX.die != null) ? DBGFX.die / 1.6 : 1 - B.deadT / 1.6;
/* posição do pet no desenho: x = centro (À FRENTE do herói: petX), gy = linha dos pés (o chão + os px "levemente à frente" da tabela). Na Derrota (morte nova) vai
   de onde estava até o petDieX num deslize curto e suave (primeiros ~0,5 s da queda; sem teleporte) e, se havia montaria (que sai de cena), volta junto para a
   altura de quem está a pé. Fora da batalha (drawHeroFull zera B.deadT) vale sempre a posição normal. */
function petPos(){ const T = petTbl(), mo = petMO(); let x = petX(), e = 0;
  if (B.deadT > 0 && typeof ART_ON !== 'undefined' && ART_ON.kael_die === true && typeof dieClear === 'function'){ const d = Math.max(0, Math.min(1, dieP() * 3.2)); e = d * d * (3 - 2 * d); x += (petDieX() - x) * e; }
  return { x, gy: GY + T.dy + (mo ? mo.dy * (1 - e) : 0) }; }
/* CHOCAGEM (regra do dono: o pet nunca some): o pet equipado continua desenhado e o ovo aparece AO LADO dele, no chão, dentro da tela (nunca colado na borda:
   HATCH_EDGE), sem cobrir o herói, o pet nem o inimigo da frente; o recém-nascido salta e termina NO MESMO lugar do ovo, no tamanho normal de filhote.
   Visto pelo QA: (1) à direita do pet o ovo cheio cobria o inimigo; (2) a correção anterior encolhia o ovo e, montado, jogava ovo e filhote para trás do herói,
   colados na borda esquerda. Regra atual (hatchPlace escolhe o lugar UMA vez, quando o ovo entra na vez; não anda atrás de ninguém):
     1. À FRENTE do pet, numa VAGA do tamanho do maior entre o ovo e o recém-nascido. Quem abre o espaço é o inimigo: enquanto há ovo na vez ou chocando, a folga
        do inimigo da frente conta a partir da borda da vaga (hatchReserve → petFront → heroEdge do js/battle.js: o mesmo caminho que já afasta o inimigo quando
        o pet evolui). O ovo só COMEÇA a aparecer quando a vaga está livre (ou depois de HATCH_WAIT s, para nunca travar a fila). O ovo usa o tamanho cheio se a
        vaga ainda deixa um inimigo inteiro na tela; senão encolhe até HATCH_EW_MIN.
     2. Sem vaga à frente (montado: a montaria empurra o pet para perto da borda direita) e com vaga inteira ATRÁS do herói, com margem da borda: atrás.
     3. Sem vaga em nenhum dos dois: à frente mesmo, no tamanho mínimo, dentro da tela com margem; o inimigo recua o que o hordeFit conseguir (pode sobrar toque).
   Única exceção ao "ao lado": quando o pet que está no ovo É o equipado (1º ovo do nível 20: ele entra equipado na hora), ele ainda não nasceu; o ovo fica no
   lugar do pet e o pet só passa a ser desenhado quando termina de saltar do ovo (HATCH_BORN). Nada some: ele nasce ali. */
const HATCH_EW = 0.5, HATCH_EW_MIN = 0.24, HATCH_GAP = 4, HATCH_EDGE = 8, HATCH_WAIT = 3, HATCH_NB = 0.46;   // largura do ovo cheia e mínima (× HS) · respiro (px) · margem da borda (px) · espera máx. pela vaga (s) · altura do recém-nascido (× corpo do herói)
/* escala e largura do recém-nascido (filhote): as mesmas do desenho do salto */
function hatchNbK(h){ return heroBodyH() * HATCH_NB / Math.max(20, ((h && h.sprite && petMetric(h.sprite)) || { h: 150 }).h); }
function hatchNbW(h){ const m = (h && h.sprite && petMetric(h.sprite)) || { l: 70, r: 70 }; return 2 * Math.max(m.l || 70, m.r) * hatchNbK(h); }
function hatchPlace(h){ const full = HS * HATCH_EW, mn = HS * HATCH_EW_MIN; if (!PETK.info || hatchOwn(h)) return { x: petX(), ew: full, sw: full, side: 'pet' };
  const m = (PETK.base && petMetric(PETK.base)) || { l: 70, r: 70 }, pr = petX() + m.r * petK(), nb = hatchNbW(h), need = Math.max(mn, nb);
  const hl = HX - HS * (petMO() ? 0.45 : KAEL_W / 2);   /* borda de trás do herói (montado: a garupa da montaria) */
  const fmax = LW - HATCH_EDGE - 70 - HERO_GAP - pr - HATCH_GAP, bmax = hl - HATCH_GAP - HATCH_EDGE;   /* vaga máxima à frente (deixando um inimigo de 70 px + a folga dele na tela) e atrás */
  const front = sw => ({ x: Math.min(LW - HATCH_EDGE - sw / 2, pr + HATCH_GAP + sw / 2), ew: Math.max(mn, Math.min(full, sw)), sw, side: 'front' });
  if (fmax >= need) return front(Math.max(need, Math.min(full, fmax)));
  if (bmax >= need){ const sw = Math.max(need, Math.min(full, bmax)); return { x: hl - HATCH_GAP - sw / 2, ew: Math.max(mn, Math.min(full, sw)), sw, side: 'back' }; }
  return front(need); }
/* borda direita da vaga do ovo que está na vez ou chocando À FRENTE do pet (0 = nada a reservar): o inimigo da frente guarda a folga a partir daqui */
function hatchReserve(){ const h = HATCH.cur || HATCH.q[0]; if (!h || !PETK.info || hatchOwn(h)) return 0; hatchSet(h); return h.side === 'front' ? h.x + h.sw / 2 : 0; }
/* a vaga está livre? (nenhum inimigo vivo dentro dela) */
function hatchFree(h){ hatchSet(h); return h.side !== 'front' || enemyLeft() >= h.x + h.sw / 2 - 0.5; }
function hatchStart(h){ h.t0 = B.at; HATCH.cur = h; snd('claim'); if (!HATCH.egg){ HATCH.egg = new Image(); HATCH.egg.src = 'assets/pets/pet_egg.png'; } if (h.sprite) sheetLoad(PET_DIR + h.sprite + '_idle', true); return hatchSet(h); }
function hatchSet(h){ if (h && h.x == null){ const p = hatchPlace(h); h.x = p.x; h.ew = p.ew; h.sw = p.sw; h.side = p.side; } return h; }
const HATCH_BORN = 3.1;
const hatchOwn = h => !!h && !h.dup && !!PETK.info && PETK.info.id === h.pet;
function hatchHidesPet(){ const h = HATCH.cur; return !!h && hatchOwn(h) && B.at - h.t0 < HATCH_BORN; }
const hatchX = h => hatchSet(h).x;
/* CHOCAR (por código, sobre a batalha): o ovo treme, racha, luz, o pet salta ao chão; depois o nome e a raridade */
function drawHatch(){ dbgFxTick(); if (!petOk()) return; if (!HATCH.cur){ if (!HATCH.q.length || B.res || B.paused || view !== 'battle') return; const h = HATCH.q[0]; if (h.w0 == null) h.w0 = B.at;
    if (!hatchFree(h) && B.at - h.w0 < HATCH_WAIT) return;   /* a vaga à frente do pet ainda tem inimigo: ele está recuando (hatchReserve); o ovo espera, sem cobrir ninguém */
    HATCH.q.shift(); hatchStart(h); }
  const h = hatchSet(HATCH.cur), T = B.at - h.t0, cx = h.x, gy = GY, eg = HATCH.egg, col = RAR[h.r] ? RAR[h.r].c : '#fff';
  if (T > 5.2){ HATCH.cur = null; return; }
  const ew = h.ew, eh = eg && eg.naturalWidth ? ew * eg.naturalHeight / eg.naturalWidth : ew * 1.25;
  if (T < 2.4 && eg && eg.complete && eg.naturalWidth){ const sh = T < 1.4 ? Math.sin(T * 22) * 0.05 * (T / 1.4) : Math.sin(T * 40) * 0.1; ctx.save(); ctx.translate(cx, gy); ctx.rotate(sh); ctx.drawImage(eg, -ew / 2, -eh, ew, eh);
    if (T > 1.4){ const p = Math.min(1, (T - 1.4) / 0.8); ctx.strokeStyle = '#2a1403'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-ew * 0.28, -eh * 0.55);
      [[-0.12, -0.42], [-0.02, -0.6], [0.1, -0.44], [0.2, -0.62], [0.3, -0.5]].slice(0, Math.ceil(p * 5)).forEach(q => ctx.lineTo(q[0] * ew, q[1] * eh)); ctx.stroke(); }
    ctx.restore(); }
  if (T >= 2.1 && T < 3.1){ const p = T - 2.1; drawGlow('#ffffff', cx, gy - eh * 0.5, HS * (0.3 + 1.4 * p), Math.max(0, 1 - p)); drawGlow(col, cx, gy - eh * 0.5, HS * (0.5 + 1.0 * p), Math.max(0, 0.8 - p)); }
  if (T >= 2.4){ const sh = h.sprite ? sheetLoad(PET_DIR + h.sprite + '_idle', true) : null, p = Math.min(1, (T - 2.4) / 0.7), jump = Math.sin(p * Math.PI) * HS * 0.45, x = cx;
    if (sh && sh.ok && !(hatchOwn(h) && T >= HATCH_BORN)){ const M = sh.meta, k = hatchNbK(h), fi = Math.floor(B.at * (M.fps || 12)) % M.frames, ax = (M.padLeft != null ? M.padLeft : 96) + 128, fy = typeof M.feetY === 'number' ? M.feetY : 307;
      ctx.save(); ctx.globalAlpha = Math.min(1, p * 3); ctx.drawImage(sh.img, sheetSX(M, fi), sheetSY(M, fi), M.w, M.h, x - ax * k, gy - jump - fy * k, M.w * k, M.h * k); ctx.restore(); }
    if (!h.said){ h.said = true; B.banner = { txt: h.name + ' · ' + (RAR[h.r] ? RAR[h.r].n : ''), pill: true, bg: 'rgba(29,22,17,.92)', bd: col, sh: '#0e0a07', t: 0, dur: 2.4, col }; }   // nome e raridade na faixa de aviso do jogo (fora das barras do Kael)
  }
}
/* debug / modo dono: ganhar um ovo agora (raridade opcional) */
function petGiveEgg(r){ if (!petOk()) return null; let x = null; try { x = Sys.pet.addEgg(S, Sys.host, r != null ? { r, source: 'test' } : { source: 'test' }); } catch (e) { console.error('addEgg', e); } petNotice([x]); if (typeof refreshHero === 'function') refreshHero(); save(); return x; }
/* ================= GANCHOS DE DEBUG PARA O QA (só com ?debug=1: sem DEBUG, DBGFX é null e nada abaixo é criado) =================
   A captura de tela leva centenas de ms; estes ganchos CONGELAM um instante da animação até serem soltos. Todos devolvem um objeto com o que foi posto na tela.
     dbgDieAt(t[, chefe])   põe o herói na Derrota e para a queda no instante t, em segundos (0 a 1,6). 0 a 0,3 = fade cruzado da montaria (folha montada → imagem parada, que fica respirando); 0 a 0,5 = pet deslizando;
                            0 a 0,7 = arma caindo; 1,4+ = herói deitado. A tela de resultado NÃO abre e a fase não recomeça enquanto estiver congelado; funciona
                            no Modo dono (a vida recomposta não levanta o herói). chefe = true: véu escuro da derrota para o chefe em vez do "DERROTADO".
                            dbgDieAt(null) solta: herói de pé, vida cheia, batalha segue. (Chamar com a tela de resultado fechada.)
     dbgHatchAt(pet, r, t)  põe um ovo desse pet (id da espécie; r = raridade 0 a 4, opcional) e para a chocagem no instante t, em segundos (0 a 5,1; padrão 1):
                            0 a 1,4 treme · 1,4 a 2,4 racha · 2,1 a 3,1 luz · 2,4 a 3,1 o filhote salta · 3,1+ filhote no lugar final. Não espera a vaga abrir:
                            aparece na hora, no lugar que o jogo escolheria (o inimigo recua em ~1 s). Sem argumentos lista os ids. dbgHatchAt(null) solta.
                            Com o id do pet EQUIPADO mostra o caso do 1º ovo (ovo no lugar do pet).
     dbgWing(id)            equipa um ITEM de asa desse tipo (cria o item na mochila se não houver; para as asas novas liga a arte dela só nesta sessão):
                            'angel', 'demon', 'phoenix', 'ice', ... dbgWing() lista os ids e qual está equipada; dbgWing(null) tira a asa.
     dbgMount(id, estrelas) (js/mountfx.js) dá e monta a montaria; dbgMount() lista; dbgMount(null) desmonta.
     dbgLvUp([t])           dispara o letreiro "NÍVEL +1" como numa subida real (efeito sobre o herói, faixa "Nível N!" e som). Com t (segundos, 0 a ~2) o efeito
                            fica parado nesse instante; dbgLvUp(null) solta. */
function dbgFxTick(){ const D = typeof DBGFX !== 'undefined' ? DBGFX : null; if (!D) return;
  if (D.die != null){ B.deadT = Math.max(0.05, 1.6 - D.die); B.act = null; if (B.eshots && B.eshots.length) B.eshots.length = 0; }
  if (D.lv != null) B.lvfx = { t0: B.at - D.lv };
  if (D.hatch != null && HATCH.cur) HATCH.cur.t0 = B.at - D.hatch; }
if (typeof DBGFX !== 'undefined' && DBGFX){ const D = DBGFX, num = (v, a, b, d) => Math.max(a, Math.min(b, (typeof v === 'number' && isFinite(v)) ? v : d));
  window.dbgDieAt = function (t, boss){ if (t == null){ if (D.die != null){ D.die = null; B.deadT = 0; B.deadBoss = false; if (B.hero) B.hero.hp = B.hero.maxhp; } return { solto: true }; }
    if (B.res) return { erro: 'feche a tela de resultado antes' };
    D.die = num(t, 0, 1.6, 0); B.deadT = Math.max(0.05, 1.6 - D.die); B.deadBoss = !!boss; B.act = null; B.dieDustW = 0; B.dieDustB = 0;
    const p = petInfo() ? petPos() : null; return { t: D.die, montaria: HM.mount ? (function(){ const o = MOUNT_REF[HM.mount.id] ? mountStill(HM.mount.id) : null; return (!o || o.fail) ? 'exit' : 'still'; })() : null, imagemParada: HM.mount ? (function(){ const o = MOUNT_REF[HM.mount.id] ? mountStill(HM.mount.id) : null; return !o ? 'sem imagem' : o.ok ? 'ok' : o.fail ? 'falhou' : 'carregando'; })() : null, pet: p && { x: Math.round(p.x), chao: Math.round(p.gy) }, petDestino: p ? Math.round(petDieX()) : null }; };
  window.dbgHatchAt = function (pet, r, t){ if (pet === null){ D.hatch = null; HATCH.cur = null; HATCH.q.length = 0; return { solto: true }; }
    if (!petOk()) return { erro: 'pets desligados' }; const sp = (Sys.pet.DATA.v17 && Sys.pet.DATA.v17.species) || {};
    if (pet === undefined || !sp[pet]) return { erro: 'id de pet desconhecido', ids: Object.keys(sp) };
    HATCH.q.length = 0; HATCH.cur = null; petHatchQueue({ pet, r: r != null ? r : null }, false); const h = HATCH.q.shift(); if (!h) return { erro: 'não enfileirou' };
    hatchStart(h); D.hatch = num(t, 0, 5.1, 1); h.t0 = B.at - D.hatch; return { t: D.hatch, pet: h.pet, nome: h.name, lado: h.side, ovoX: Math.round(h.x), ovoLargura: Math.round(h.ew), vaga: Math.round(h.sw) }; };
  window.dbgLvUp = function (t){ if (t === null){ D.lv = null; return { solto: true }; }
    let lv = 0; try { lv = Sys.level.ensure(S).lvl | 0; } catch (e) {}
    B.lvfx = { t0: B.at }; sheetLoad(LVUP, true); snd('upgrade'); B.banner = { txt: 'Nível ' + lv + '!', pill: true, bg: 'rgba(14,60,52,.9)', bd: '#5ff0cf', sh: '#063a30', t: 0, dur: 2.2, col: '#5ff0cf' };
    D.lv = (typeof t === 'number' && isFinite(t)) ? Math.max(0, t) : null; if (D.lv != null) B.lvfx.t0 = B.at - D.lv; return { nivel: lv, congelado: D.lv }; }; }
if (typeof DBGFX !== 'undefined' && DBGFX){
  window.dbgWing = function (id){ const ST = window.Sys && Sys.stats, WT = (ST && ST.DATA && ST.DATA.wingTypes) || {}, done = () => { if (typeof statsChanged === 'function') statsChanged(); if (typeof refreshHero === 'function') refreshHero(); if (typeof heroChanged === 'function') heroChanged(); };
    const cur = () => { try { const it = S.eq && S.eq.wing != null ? itemOf(S.eq.wing) : null; return it ? (ST && typeof ST.wingOf === 'function' ? ST.wingOf(it) : it.wing) || null : null; } catch (e) { return null; } };
    if (id === null){ S.eq.wing = null; done(); return { semAsa: true }; }
    if (id === undefined || !WT[id]) return { erro: id === undefined ? 'passe o id' : 'id de asa desconhecido', ids: Object.keys(WT), equipada: cur() };
    try { if (WT[id].nw && ST.DATA.newWingReady) ST.DATA.newWingReady[id] = true; } catch (e) {}   /* asa nova: liga a arte dela (só nesta sessão de debug) */
    let it = null; try { it = S.inv.find(x => x && x.slot === 'wing' && x.wing === id); } catch (e) {}
    if (!it){ const n0 = S.nextId; addItemToBag({ slot: 'wing', r: 3, e: 0, wing: id }); it = S.inv.find(x => x && x.id === n0) || S.inv.filter(x => x && x.slot === 'wing').pop(); }
    if (!it) return { erro: 'não consegui criar o item de asa' }; S.eq.wing = it.id; done(); return { id, item: it.id, equipada: cur() }; }; }
