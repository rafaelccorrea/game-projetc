'use strict';
/* ================= LUTA DA INSTÂNCIA (pedido Q-4; v0.12.8) =================
   window.startInstanceRun(run): run = definição do Sys.instances.start (buildRun: waves [[{kind, eraBoss, hpMult, dmgMult}]], loop, time, spawnGap,
   stage, goal 'kills' | 'boss' | 'clear', noNormalLoot). A horda roda na MESMA batalha, com os inimigos aprovados da era de run.stage (mkEnemy),
   sem drops de fase (killEnemy não chama o farmKill), com relógio e o HUD dizendo "Instância". No fim (vitória, derrota ou tempo) chama
   Sys.instances.finish(S, host, run.id, {win, kills}), devolve o jogo ao ponto onde estava (fase, onda, farm) e abre window.PInst.showResult(out).
   Enquanto roda, a fase do save é trocada só em memória (o save() fica suspenso: index.html), para o cenário e os inimigos serem os da instância. */
function instMk(sp){ const e = mkEnemy(S.stage, sp.kind || 'e0'); const hm = sp.hpMult > 0 ? sp.hpMult : 1, dm = sp.dmgMult > 0 ? sp.dmgMult : 1;
  e.maxhp = e.hp = e.hp * hm; e.dmg *= dm; if (sp.eraBoss) e.eraBoss = true;
  /* lutas especiais (docs/LIGACOES_BATALHA.md): nome próprio; Boneco de Treino imortal, neutro na afinidade, bate a fração da vida do herói que o módulo diz (sem DEF, sem variação).
     A vida do boneco é só um colchão enorme (ele nunca cai): o dano do ensaio é a vida que ele perde a cada passo (instStep), devolvida na hora. */
  if (sp.name){ e.name = sp.name; e.tag = sp.name; } if (sp.atkEvery > 0) e.atkEvery = sp.atkEvery;
  if (sp.immortal){ e.immortal = true; e.noAff = true; e.maxhp = e.hp = Math.max(e.maxhp, 1e6, (B.hero ? B.hero.atk : 1) * 1e6); }
  if (sp.dmgPctHero > 0 && B.hero){ e.dmg = B.hero.maxhp * sp.dmgPctHero / 100; e.raw = true; }
  if (sp.thief){ e.thief = true; e.noAtk = true; e.flee = true; }   /* Ladrão de Brasas: não ataca e corre de costas para o herói (a arte de reserva olha para a esquerda: flee espelha; a arte própria entra no thiefStep) */
  e.gold = 0; return e; }
function instWave(i){ const I = B.inst, w = I.run.waves[i] || []; B.en = []; B.toSpawn = w.map(x => Object.assign({}, x)); B.waveN = B.toSpawn.length; B.spawnT = 0.4; B.enemy = null; B.waveT = 0; preloadAssets(); }
if (typeof NEXT_ON !== 'undefined' && NEXT_ON) window.startInstanceRun = function(run){ if (!run || !Array.isArray(run.waves) || !run.waves.length || B.inst) return false;
  if (B.res && B.res.mode === 'era') return false;   /* Troca de era aberta: não entra */
  if (view !== 'battle') setView('battle');
  /* Engenheiro 2 (visto no navegador): se o chefe da campanha morreu no instante da entrada, a tela de Vitória/Derrota abria e ficava presa POR CIMA da instância. Fecha direito antes de começar. */
  if (B.res && typeof resClose === 'function'){ try { resClose(B.res.mode === 'win' ? 'next' : 'farm'); } catch (e) { console.error('resClose', e); } }
  B.inst = { run, wi: 0, kills: 0, dmg: 0, stun: 0, t: run.time > 0 ? run.time : 60, back: { stage: S.stage, wave: S.wave, farm: !!S.farm }, done: false };
  B.grim = null; if (B.stkQ) B.stkQ.length = 0;   /* magias e golpes extras da luta anterior não entram nesta (as recargas recomeçam cheias) */
  if (Number.isInteger(run.stage) && run.stage > 0) S.stage = run.stage; S.wave = 1; S.farm = false;
  const st = heroStats(); B.hero = { hp: st.hp, atkT: 0.3 }; heroApply(B.hero, st); B.deadT = 0; B.deadBoss = false; B.act = null; B.res = null; B.running = true;
  if (run.special){ B.hero.hp = B.hero.maxhp * (run.hpStart > 0 && run.hpStart < 1 ? run.hpStart : 1); B.inst.en0 = B.energy; B.energy = 0; B.cd2 = 0; B.eshots = []; ligExit(run.special === 'pathTry' || run.special === 'thief'); }   /* Provação "metade da vida"; vida cheia pela conta da regra (sem pet / sem montaria); todo ensaio/provação começa igual */
  if (typeof grimSync === 'function') grimSync();
  instWave(0); B.banner = { txt: run.banner || ('Instância: ' + (run.name || '')), pill: true, bg: 'rgba(29,22,17,.92)', bd: '#ffc94a', sh: '#0e0a07', t: 0, dur: 2.2, col: '#ffc94a' };
  if (typeof fbTick === 'function') fbTick(); return true; };
function instStep(dt){ const I = B.inst; if (!I || I.done) return; I.t -= dt;
  if (I.run.special){ const sp = I.run.special;
    if (sp === 'trial'){ const s = Math.ceil(Math.max(0, I.t)); if (s !== I.tk){ I.tk = s; try { if (window.PTrial && typeof PTrial.time === 'function') PTrial.time(Math.max(0, I.t)); } catch (e) {} } }   /* relógio da faixa da regra: só quando o segundo muda */
    else if (sp === 'pathTry'){ for (const e of B.en) if (e.immortal && e.hp < e.maxhp){ I.dmg += e.maxhp - e.hp; e.hp = e.maxhp; }   /* dano causado no boneco (herói, pet e magias) */
      let live = true; try { const T = window.Sys && Sys.pathTry; if (T && typeof T.active === 'function') live = !!T.active(); } catch (e) {}
      if (!live){ ligSpecialEnd(I, false, true); return; } }   /* o ensaio foi solto por fora (o jogador reabriu a tela Caminhos): a luta volta à fase sem anotar nada */
    else if (sp === 'thief'){ if (thiefStep(I, dt)) return; } }   /* Ladrão de Brasas: saco, fuga e Brasas caindo; true = saco vazio (a luta já acabou) */
  if (I.t <= 0){ I.t = 0; instEnd(I.run.goal === 'kills'); } }   // tempo esgotado: na corrida de abates quem decide é o módulo (kills >= mínimo)
function instWaveClear(){ const I = B.inst; if (!I || I.done) return; I.wi++;
  if (I.wi < I.run.waves.length){ instWave(I.wi); return; }
  if (I.run.loop){ I.wi = 0; instWave(0); return; }
  instEnd(true); }
function instEnd(win){ const I = B.inst; if (!I || I.done) return; if (I.run.special){ ligSpecialEnd(I, win); return; } I.done = true; let out = null;
  try { out = Sys.instances.finish(S, Sys.host, I.run.id, { win: !!win, kills: I.kills, timeout: !win && I.t <= 0 }); } catch (e) { console.error('instances.finish', e); out = { ok: false, reason: 'erro' }; }
  S.stage = I.back.stage; S.wave = I.back.wave; S.farm = I.back.farm; B.inst = null;   // volta ao farm onde estava
  B.deadT = 0; B.deadBoss = false; startBattle(); if (typeof refreshHero === 'function') refreshHero(); save(); hud();
  /* Engenheiro 2 (achado dos testes de Sistemas): o PInst.showResult devolve true mesmo sem abrir (tela 'inst' desligada). Só confio nele com a tela ligada;
     senão (ou se ele falhar) sai o aviso de reserva: o jogador SEMPRE vê o resultado. */
  const won = !!(out && out.ok !== false && (out.win || (out.win === undefined && win))), msg = won ? 'Instância vencida! Prêmio entregue' : (I.t <= 0 && !win ? 'Tempo esgotado: instância perdida' : 'Instância perdida');
  let shown = false; if (window.PInst && typeof PInst.showResult === 'function' && window.Panels && typeof Panels.on === 'function' && Panels.on('inst')){ try { shown = PInst.showResult(out) !== false && typeof view !== 'undefined' && view === 'inst'; } catch (e) { console.error('PInst.showResult', e); } }
  if (!shown) toast(msg); }
/* texto do cabeçalho da batalha durante a instância: nome e relógio */
function instHud(){ const I = B.inst; if (!I) return null; const s = Math.max(0, Math.ceil(I.t)); return { name: I.run.hud || 'Instância', sub: Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + (I.run.goal === 'kills' ? ' · ' + I.kills : '') + (I.chase ? ' · Saco ' + Math.round((1 - thiefScore(I)) * 100) + '%' : '') }; }   /* perseguição: relógio e quanto ainda há no saco */

/* ===== LUTAS ESPECIAIS (docs/LIGACOES_BATALHA.md, da Sistemas): Provação do Mestre (Sys.trial) e Ensaio de caminho (Sys.pathTry) =====
   Rodam como uma instância (mesmo laço, sem drop de fase, sem XP, save suspenso, relógio no cabeçalho), com run.special = 'trial' | 'pathTry'. As regras da luta
   ficam no run e a batalha lê de lá (js/battle.js: run.skip e run.bonusStat no heroApply, run.bonusStrikes / run.noMount no perfil dos golpes, run.noSpells nas
   magias, run.heroMinHp no heroHit, run.noMount no desenho; js/petfx.js: run.noPet). O fim NÃO chama o Sys.instances: devolve o jogo à fase onde estava e vai
   para a tela (PTrial.finish / PPath.finish), que faz a ÚNICA chamada ao finish do módulo e abre o resultado / a comparação. Nenhum número de jogo aqui:
   tempo, vida inicial, fatores do chefe, golpe do boneco, vida mínima e bônus vêm do spec/cfg do módulo.
   abort = true (ensaio solto por fora, ou "Sair do ensaio"): volta à fase e NÃO chama finish. */
function ligSpecialEnd(I, win, abort){ if (!I || I.done) return; I.done = true;
  const tot = I.run.time > 0 ? I.run.time : 60, sec = Math.max(0, Math.round((tot - Math.max(0, I.t)) * 10) / 10), h = B.hero;
  const life = h ? Math.round(Math.max(0, h.hp)) : 0, lifeMax = h ? Math.round(h.maxhp) : 0;
  ligExit(false);
  S.stage = I.back.stage; S.wave = I.back.wave; S.farm = I.back.farm; B.inst = null; B.grim = null;
  B.deadT = 0; B.deadBoss = false; startBattle(); if (I.en0 > 0) B.energy = I.en0; save(); hud();
  if (!abort){ try {
    if (I.run.special === 'trial'){ const res = { won: !!win, sec }; if (window.PTrial && typeof PTrial.finish === 'function') PTrial.finish(res); else if (window.Sys && Sys.trial) Sys.trial.finish(S, Sys.host, res); }
    else if (I.run.special === 'pathTry'){ const res = { damage: Math.round(I.dmg || 0), sec, life, lifeMax, stunSec: Math.round((I.stun || 0) * 10) / 10 };
      if (window.PPath && typeof PPath.finish === 'function') PPath.finish(res); else if (window.Sys && Sys.pathTry) Sys.pathTry.finish(S, Sys.host, res); }
    else if (I.run.special === 'thief'){ if (window.PThief && typeof PThief.finish === 'function') PThief.finish(thiefScore(I)); }   /* UMA chamada: a tela roda o Sys.thief.finish (quem credita as Brasas) e abre o resultado. Sem a tela nada é creditado e a corrida fica aberta no módulo */
  } catch (e) { console.error('ligSpecialEnd', e); } }
  if (typeof refreshHero === 'function') refreshHero(); save(); hud(); }   /* depois do finish: a provação vencida dá atributo permanente */
/* PTrial.battle(spec) ← Sys.trial.start(...).spec. Devolve true quando a luta começou. */
function ligTrialBattle(spec){ if (!spec || typeof window.startInstanceRun !== 'function') return false; const en = spec.enemy || {}, m = spec.master || {};
  const run = { special: 'trial', id: 'trial' + (spec.lvl | 0), name: m.name || 'Mestre', hud: 'Provação', banner: 'Provação: ' + (spec.rule && spec.rule.name || ''),
    waves: [[{ kind: 'boss', hpMult: en.hpMul > 0 ? en.hpMul : 1, dmgMult: en.dmgMul > 0 ? en.dmgMul : 1, name: m.name ? 'Mestre ' + m.name : '' }]],
    time: spec.sec > 0 ? spec.sec : 60, goal: 'boss', stage: (en.stage | 0) || S.stage, hpStart: spec.hpStart > 0 ? spec.hpStart : 1,
    noPet: !!spec.noPet, noMount: !!spec.noMount, noSpells: !!spec.noSpells, skip: spec.noPet ? 'pet' : spec.noMount ? 'mount' : '' };
  return window.startInstanceRun(run) !== false; }
/* PPath.battle(cfg) ← Sys.pathTry.start(...).battle. Devolve true quando o ensaio começou. */
function ligPathBattle(cfg){ if (!cfg || typeof window.startInstanceRun !== 'function') return false; const en = cfg.enemy || {}, bo = cfg.bonus || {};
  const run = { special: 'pathTry', id: 'pathTry_' + cfg.path, name: cfg.name || '', hud: 'Ensaio', banner: 'Ensaio: ' + (cfg.name || ''),
    waves: [[{ kind: 'e0', immortal: en.immortal !== false, name: en.name || 'Boneco de Treino', atkEvery: en.hitEverySec > 0 ? en.hitEverySec : 0, dmgPctHero: en.hitPctHeroHp > 0 ? en.hitPctHeroHp : 0 }]],
    time: cfg.sec > 0 ? cfg.sec : 60, goal: 'time', stage: S.stage, heroMinHp: cfg.heroMinHp > 0 ? cfg.heroMinHp : 0, noPet: !!cfg.noPet,
    style: cfg.path, bonusStrikes: bo.strikes || null, bonusStat: bo.stat || {} };
  return window.startInstanceRun(run) !== false; }
/* "Sair do ensaio": volta à fase e avisa a tela (PPath.cancel): nada é anotado. Também serve de gesto pelo console/teste. */
function ligPathExit(){ const I = B.inst; if (!I || I.done || !I.run || I.run.special !== 'pathTry') return false; ligSpecialEnd(I, false, true);
  try { if (window.PPath && typeof PPath.cancel === 'function') PPath.cancel(); else if (window.Sys && Sys.pathTry) Sys.pathTry.cancel(); } catch (e) { console.error('PPath.cancel', e); } return true; }
/* botão "Sair do ensaio" (só existe durante o ensaio): embaixo da barra da fase, no lugar da faixa da Provação; desce se o selo "Fraco contra" estiver na tela */
function ligExit(on){ try { if (typeof document === 'undefined') return; let b = document.getElementById('lig_exit');
    if (!on){ if (b){ if (typeof b.remove === 'function') b.remove(); else if (b.parentNode) b.parentNode.removeChild(b); } return; }
    const h = document.getElementById('fb_w'); if (!h) return; if (!b){ b = document.createElement('button'); b.id = 'lig_exit'; b.type = 'button'; { const th = !!(B.inst && B.inst.run && B.inst.run.special === 'thief');   /* o mesmo botão serve à perseguição do Ladrão de Brasas (sair pede dois toques: ligThiefExit) */
        b.textContent = th ? 'Sair da perseguição' : 'Sair do ensaio'; b.setAttribute('aria-label', th ? 'Sair da perseguição: a entrada não volta' : 'Sair do ensaio: nada é gasto nem anotado'); }
      b.style.cssText = 'position:absolute;left:82px;z-index:6;min-height:44px;padding:0 16px;border-radius:22px;border:2px solid #ffc94a;background:rgba(29,22,17,.92);color:#f6ecdf;font:900 13px/1 Nunito,system-ui,sans-serif;box-shadow:0 2px 0 rgba(0,0,0,.4);cursor:pointer';
      if (b.addEventListener) b.addEventListener('click', () => { try { if (typeof snd === 'function') snd('ui_tap'); } catch (e) {} if (B.inst && B.inst.run && B.inst.run.special === 'thief') ligThiefExit(); else ligPathExit(); }); h.appendChild(b); }
    let top = 122; const w = document.getElementById('wsl_root'); if (w && w.style && w.style.display !== 'none'){ const hh = Math.round(+w.offsetHeight || 0) || 24; top = 122 + hh + 6; } b.style.top = top + 'px';
  } catch (e) {} }
/* liga as pontes das telas (p_trial.js / p_path.js carregam DEPOIS deste arquivo). Chamada no fim do js/fullbattle.js (patch F1 do documento) e, por garantia,
   tentada aqui algumas vezes depois da carga: sem ela o botão Lutar / Testar grátis diz que a luta ainda não está ligada. */
function ligBridges(){ let ok = true; if (window.PTrial){ if (typeof PTrial.battle !== 'function') PTrial.battle = ligTrialBattle; } else ok = false; if (window.PPath){ if (typeof PPath.battle !== 'function') PPath.battle = ligPathBattle; } else ok = false; return ok; }
(function ligBindLater(k){ try { if (ligBridges() || k >= 20) return; } catch (e) { return; } setTimeout(() => ligBindLater(k + 1), 500); })(0);

/* ===== LADRÃO DE BRASAS: a PERSEGUIÇÃO (Sys.thief + js/p_thief.js; mock aprovado docs/proto/v2/a/mocks/la.jpg) =====
   Luta especial 'thief', no molde da Provação: roda como instância (sem drop de fase, sem XP, save suspenso, relógio no cabeçalho) e devolve o jogo à fase onde
   estava. A TELA chama window.startThiefRun({lv, lote, secs}) logo depois do Sys.thief.enter (a entrada já foi gasta lá) e espera UMA chamada a
   PThief.finish(score) no fim, ou PThief.cancel() se o jogador sair. NADA é creditado aqui: as Brasas entram pelo Sys.thief.finish, que a tela chama.
   - O LADRÃO: um inimigo que não morre (immortal), não ataca (noAtk) e corre de costas para o herói (flee). O herói e o cenário correm o tempo todo
     (B.inst.chase: ganchos no step e no draw do js/battle.js) e o herói bate correndo.
   - O SACO: a barra em cima do ladrão. O módulo NÃO diz a vida do saco, então vale a regra de reserva (DECISÃO PENDENTE para a autora do Sys.thief confirmar):
     vida do saco = dano que o herói causa em THIEF.bagFrac (0,8) × run.secs, com o dano por segundo MEDIDO nos primeiros THIEF.measure (3) s da própria corrida
     com o ladrão ao alcance. O que cair nessa medição já conta. Assim o saco inteiro é alcançável, mas não garantido. score = fração do saco que caiu (0 a 1).
   - A FUGA: ritmo FIXO, igual para todos e sem sorte: o ladrão chega ao alcance em THIEF.intro s; a 1ª fuga é aos THIEF.fleeFirst s e depois uma a cada
     THIEF.fleeEvery s; cada fuga dura THIEF.fleeDur s (ele dispara para fora da tela, além do alcance de qualquer arma, e o herói o alcança de novo).
   - ARTE: a criatura PARADA da Arte (THIEF_ART.still) com balanço por código; a folha animada ainda vem. Reserva enquanto a imagem não carrega = o inimigo
     comum da era atual (THIEF_ART.kind), espelhado, com o nome próprio. O especial do herói começa recarregando (a medição do saco pega só o ritmo de base).
   - FIM DE TARDE: um véu de cor por cima do cenário, só durante a perseguição (dois fillRect; sem arte nova). */
/* still: a criatura PARADA entregue pela Arte (uma célula 512x352, pés em y=307, olhando para a DIREITA = o lado da fuga). Sem folha animada ainda: o corpo
   ganha um balanço por código (e.bob, js/battle.js). kind: reserva enquanto a imagem não carrega (ou se faltar) = o inimigo comum da era atual, espelhado */
const THIEF_ART = { kind: 'e0', name: 'Ladrão de Brasas', key: 'thief', still: 'assets/anim/enemy/thief/thief_still.png' };
const THIEF = { bagFrac: 0.8, measure: 3, intro: 0.5, fleeFirst: 7, fleeEvery: 8, fleeDur: 1.4, fleeOut: 0.3, fleeBack: 0.35, ember: 0.04, askSec: 4,
  veil: 'rgba(255,132,40,.14)', veilSky: 'rgba(255,96,72,.10)' };
/* quanto o ladrão está longe (0 = ao alcance, 1 = fora da tela) no segundo tt da corrida. Função pura: o ritmo é o mesmo em toda corrida */
function thiefOff(tt){ let k = 0; if (tt < THIEF.intro) k = 1 - Math.max(0, tt) / THIEF.intro;
  else { const u = tt - THIEF.fleeFirst; if (u >= 0){ const p = u % THIEF.fleeEvery, D = THIEF.fleeDur; if (p < D) k = p < THIEF.fleeOut ? p / THIEF.fleeOut : p > D - THIEF.fleeBack ? (D - p) / THIEF.fleeBack : 1; } }
  return k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k); }
const thiefScore = I => { const C = I && I.chase, f = C ? +C.frac : 0; return f > 0 ? Math.min(1, f) : 0; };
function thiefEmber(x, y, n){ const v = RUNV(); for (let i = 0; i < n; i++) B.parts.push({ x: x + (Math.random() - .5) * 10, y, vx: -v * (0.45 + Math.random() * 0.5), vy: -40 - Math.random() * 70, g: 320, t: 0, life: .5 + Math.random() * .3, col: i % 2 ? '#ffd27a' : '#ff8a2a', sz: 2 + Math.random() * 3, glow: true }); }
/* um passo da perseguição (depois do step da batalha). Devolve true quando a luta acabou (saco vazio) */
function thiefStep(I, dt){ const C = I.chase, e = B.en[0]; if (!C || !e || !e.thief) return false;
  C.tt += dt; if (C.ask > 0){ C.ask -= dt; if (C.ask <= 0) thiefAsk(false); }
  if (!(C.hp > 0)) C.hp = e.maxhp;
  if (!e.bob && SPR(THIEF_ART.still, 'enemy')){ e.spr = THIEF_ART.still; e.key = THIEF_ART.key; e.flee = false; e.bob = true; e.hc = 0; }   /* a arte própria chegou: troca a reserva (já olha para a direita; sem folhas, balanço por código) */
  /* dano no ladrão neste passo (herói, pet e magias). A vida dele é só um colchão enorme: se um golpe passar do colchão o killEnemy devolve a vida cheia (hp > o que deixei) e o golpe vale o colchão inteiro */
  const d = e.hp > C.hp ? e.maxhp : C.hp - e.hp; if (d > 0){ if (C.max > 0) C.out += d; else C.dmg += d; }
  const k = thiefOff(C.tt);
  if (!(C.max > 0)){ if (k === 0) C.tm += dt;   /* medição: só conta o tempo com o ladrão ao alcance */
    if (C.tm >= THIEF.measure){ if (C.dmg > 0){ C.max = C.dmg / C.tm * THIEF.bagFrac * I.run.time; C.out = C.dmg; } else C.tm = 0; } }   /* nenhum dano na janela: mede de novo */
  const f = C.max > 0 ? C.out / C.max : (C.dmg > 0 ? Math.min(C.tm, THIEF.measure) / (THIEF.bagFrac * I.run.time) : 0);
  if (f > C.frac) C.frac = Math.min(1, f);
  /* Brasas caindo do saco: faíscas a cada pedaço e uma Brasa voando a cada Brasa inteira do lote (só desenho; quem credita é o Sys.thief.finish pela tela) */
  { const sx = e.x + (e.dw || 60) * (e.bob ? 0.2 : -0.25), sy = GY - (e.dh || 80) * 0.5, pe = Math.floor(C.frac / THIEF.ember), nb = Math.round((I.run.lote || 0) * C.frac);
    if (pe > C.pe){ C.pe = pe; if (e.x < LW) thiefEmber(sx, sy, 3); }
    if (nb > C.nb){ const q = nb - C.nb; C.nb = nb; let ok = false; try { ok = !!(window.Fogueira && Fogueira.onBrasa(Math.min(LW - 20, sx), sy, q)); } catch (er) {}
      if (!ok) floatText(Math.min(LW - 40, sx), sy - 20, '+' + q + (q === 1 ? ' Brasa' : ' Brasas'), '#ffc27a', 0); } }
  if (C.max > 0 && C.frac >= 1){ instEnd(true); return true; }   /* saco vazio antes do tempo */
  e.hp = C.hp = e.maxhp * Math.max(1e-3, (1 - C.frac) * 0.999);   /* a barra em cima do ladrão é o SACO (cheio → vazio) */
  e.x = e.slot + (LW + 44 - e.slot) * k; e.parked = false; e.hurtT = 0;   /* a posição é a do ritmo da fuga; sempre na folha de corrida */
  if (B.running){ const dx = RUNV() * dt; for (const t of B.fx) t.x += dx; for (const r of B.rings) r.x += dx; }   /* os números de dano ficam com o ladrão (o step os leva com o chão) */
  return false; }
/* véu do fim de tarde, por cima do cenário (chamado pelo draw do js/battle.js só com B.inst.chase) */
function thiefVeil(){ ctx.fillStyle = THIEF.veil; ctx.fillRect(-12, -12, LW + 24, LH + 24); ctx.fillStyle = THIEF.veilSky; ctx.fillRect(-12, -12, LW + 24, GY * 0.55 + 12); }
/* texto do botão de sair: o 1º toque arma o aviso por THIEF.askSec s */
function thiefAsk(on){ try { const b = typeof document !== 'undefined' ? document.getElementById('lig_exit') : null; if (b) b.textContent = on ? 'Sair mesmo? A entrada não volta' : 'Sair da perseguição'; } catch (e) {} }
/* "Sair da perseguição": DOIS toques. O 1º avisa que a entrada não volta (devolve 'ask'); o 2º, dentro de THIEF.askSec s, volta à fase e chama PThief.cancel UMA vez (sem finish). sure = true pula o aviso (console/teste) */
function ligThiefExit(sure){ const I = B.inst; if (!I || I.done || !I.run || I.run.special !== 'thief') return false; const C = I.chase || (I.chase = {});
  if (!sure && !(C.ask > 0)){ C.ask = THIEF.askSec; thiefAsk(true); try { toast('A entrada já foi gasta e não volta. Toque de novo para sair'); } catch (e) {} return 'ask'; }
  ligSpecialEnd(I, false, true);
  try { if (window.PThief && typeof PThief.cancel === 'function') PThief.cancel(); else if (window.Sys && Sys.thief) Sys.thief.cancel(S, Sys.host); } catch (e) { console.error('PThief.cancel', e); } return true; }
/* ponte da tela (js/p_thief.js): run = {lv, lote, secs} do Sys.thief.enter. Devolve true quando a perseguição começou. Só com a chave do módulo ligada */
window.startThiefRun = function(run){ const T = window.Sys && Sys.thief; if (!T || !T.DATA || T.DATA.on !== true) return false;
  if (!run || !(run.secs > 0) || typeof window.startInstanceRun !== 'function') return false;
  const r = { special: 'thief', id: 'thief', name: THIEF_ART.name, hud: 'Ladrão', banner: THIEF_ART.name, time: +run.secs, goal: 'time', stage: S.stage,
    waves: [[{ kind: THIEF_ART.kind, immortal: true, thief: true, name: THIEF_ART.name }]], lote: Math.max(0, Math.floor(+run.lote || 0)), lv: Math.floor(+run.lv || 0) };
  let ok = false; try { ok = window.startInstanceRun(r) !== false; } catch (e) { console.error('startThiefRun', e); ok = false; }
  if (!ok || !B.inst || B.inst.run !== r) return false;
  B.inst.chase = { tt: 0, tm: 0, dmg: 0, max: 0, out: 0, frac: 0, hp: 0, pe: 0, nb: 0, ask: 0 }; B.spawnT = 0;
  if (typeof BAL !== 'undefined' && BAL.s2Cooldown > 0) B.cd2 = BAL.s2Cooldown;   /* o especial começa recarregando: a medição do saco (3 s) pega só o ritmo de base, sem a rajada do especial inflar a vida do saco por sorte de momento (medido: com o especial na janela o score variava de 0,53 a 0,97 no mesmo herói) */
  try { SPR(THIEF_ART.still, 'enemy'); } catch (e) {}   /* pede a arte do ladrão já (ele entra em THIEF.intro s) */
  return true; };
