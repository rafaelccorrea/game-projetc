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
  if (run.special){ B.hero.hp = B.hero.maxhp * (run.hpStart > 0 && run.hpStart < 1 ? run.hpStart : 1); B.inst.en0 = B.energy; B.energy = 0; B.cd2 = 0; B.eshots = []; ligExit(true); }   /* Provação "metade da vida"; vida cheia pela conta da regra (sem pet / sem montaria); todo ensaio/provação começa igual */
  if (typeof grimSync === 'function') grimSync();
  instWave(0); B.banner = { txt: run.banner || ('Instância: ' + (run.name || '')), pill: true, bg: 'rgba(29,22,17,.92)', bd: '#ffc94a', sh: '#0e0a07', t: 0, dur: 2.2, col: '#ffc94a' };
  if (typeof fbTick === 'function') fbTick(); return true; };
function instStep(dt){ const I = B.inst; if (!I || I.done) return; I.t -= dt;
  if (I.run.special){ const sp = I.run.special;
    if (sp !== 'trial'){ const nw = Date.now(); if (!(nw - I.exT < 1000)){ I.exT = nw; ligExit(true); } }   /* "Sair do ensaio" / "Sair da perseguição": o selo "Fraco contra" pode aparecer DEPOIS do começo; o lugar do botão é refeito no máximo 1 vez por segundo (a Provação já refaz a cada segundo, logo abaixo) */
    if (sp === 'trial'){ const s = Math.ceil(Math.max(0, I.t)); if (s !== I.tk){ I.tk = s; try { if (window.PTrial && typeof PTrial.time === 'function') PTrial.time(Math.max(0, I.t)); } catch (e) {} ligExit(true); }   /* relógio da faixa da regra: só quando o segundo muda (e o "Desistir" se acerta embaixo da faixa) */
      if (I.ask > 0){ I.ask -= dt; if (I.ask <= 0) ligTrialAsk(false); }   /* o aviso do "Desistir" vence */
      ligTrialFury(I); }
    else if (sp === 'pathTry'){ for (const e of B.en) if (e.immortal && e.hp < e.maxhp){ I.dmg += e.maxhp - e.hp; e.hp = e.maxhp; }   /* dano causado no boneco (herói, pet e magias) */
      let live = true; try { const T = window.Sys && Sys.pathTry; if (T && typeof T.active === 'function') live = !!T.active(); } catch (e) {}
      if (!live){ ligSpecialEnd(I, false, true); return; } }   /* o ensaio foi solto por fora (o jogador reabriu a tela Caminhos): a luta volta à fase sem anotar nada */
    else if (sp === 'thief'){ if (thiefStep(I, dt)) return; } }   /* Ladrão de Brasas: saco, fuga e Brasas caindo; true = saco vazio (a luta já acabou) ou fim segurado até o tempo mínimo do servidor */
  if (I.t <= 0){ I.t = 0; instEnd(I.run.goal === 'kills'); } }   // tempo esgotado: na corrida de abates quem decide é o módulo (kills >= mínimo)
function instWaveClear(){ const I = B.inst; if (!I || I.done) return; I.wi++;
  if (I.wi < I.run.waves.length){ instWave(I.wi); return; }
  if (I.run.loop){ I.wi = 0; instWave(0); return; }
  instEnd(true); }
function instEnd(win){ const I = B.inst; if (!I || I.done) return; if (I.run.special){ ligSpecialEnd(I, win); return; } I.done = true; let out = null;
  try { out = Sys.instances.finish(S, Sys.host, I.run.id, { win: !!win, kills: I.kills, timeout: !win && I.t <= 0 }); } catch (e) { console.error('instances.finish', e); out = { ok: false, reason: 'erro' }; }
  try { if (out && out.ok !== false && out.win && typeof grimSrc === 'function') grimSrc('instance', { id: I.run.id, era: (Sys.instances.levelInfo(out.level) || {}).era }); } catch (e) { console.error('grimSrc', e); }   /* Grimório: fonte do dia (1 vez por instância vencida; o save vem logo abaixo) */
  try { if (out && out.ok !== false && out.win && typeof ptrack === 'function') ptrack('instance', 1); } catch (e) { console.error('ptrack instance', e); }   /* missões de evento/Passe/Conquistas que contam instância vencida (Sistemas 14/11: 'Vença 15 instâncias' nunca completava) */
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
    /* hpMulToday/dmgMulToday (Sys.trial.enemyOf) = o chefe da CAMPANHA (dificuldade nova) × o fator do marco, já convertido para o chefe que o instMk monta
       (mkEnemy sem a dificuldade). Vem um OU outro, nunca os dois multiplicados: hpMul/dmgMul são só o fator que a tela mostra ("Vida ×0,85") e a reserva */
    waves: [[{ kind: 'boss', hpMult: en.hpMulToday > 0 ? en.hpMulToday : en.hpMul > 0 ? en.hpMul : 1, dmgMult: en.dmgMulToday > 0 ? en.dmgMulToday : en.dmgMul > 0 ? en.dmgMul : 1, name: m.name ? 'Mestre ' + m.name : '' }]],
    fury: en.fury && en.fury.atSec > 0 && en.fury.dmgMult > 1 ? { atSec: +en.fury.atSec, dmgMult: +en.fury.dmgMult } : null,   /* fúria do chefe da campanha: ligTrialFury */
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
/* "Desistir" da Provação: DOIS toques, como na perseguição. O 1º avisa que nada se perde (devolve 'ask'); o 2º, dentro de THIEF.askSec s, volta à fase SEM finish
   e avisa a tela (PTrial.cancel), que faz a ÚNICA chamada ao Sys.trial.quit: a tentativa do start é desfeita e a XP guardada, o teto e o prêmio não mudam.
   sure = true pula o aviso (console/teste) */
function ligTrialAsk(on){ try { const b = typeof document !== 'undefined' ? document.getElementById('lig_exit') : null; if (b) b.textContent = on ? 'Desistir mesmo? Nada se perde' : 'Desistir'; } catch (e) {} }
function ligTrialExit(sure){ const I = B.inst; if (!I || I.done || !I.run || I.run.special !== 'trial') return false;
  if (!sure && !(I.ask > 0)){ I.ask = THIEF.askSec; ligTrialAsk(true); try { toast('Desistir não custa nada: a tentativa não conta. Toque de novo para sair'); } catch (e) {} return 'ask'; }
  ligSpecialEnd(I, false, true);
  try { if (window.PTrial && typeof PTrial.cancel === 'function') PTrial.cancel(); else if (window.Sys && Sys.trial && typeof Sys.trial.quit === 'function') Sys.trial.quit(S, Sys.host); } catch (e) { console.error('PTrial.cancel', e); } return true; }
/* FÚRIA do mestre: a do chefe da campanha (spec.enemy.fury do Sys.trial: {atSec, dmgMult}), aplicada aqui porque o diffStep (js/diff.js) não roda dentro de
   instância. Aos atSec segundos de luta o dano do mestre × dmgMult, pelo mesmo e.fury que o golpe do inimigo já lê (js/battle.js) e com o mesmo aviso da campanha.
   Uma vez por luta; se o e.fury já veio de outro lugar (o diffStep, se um dia rodar aqui), não aplica de novo */
function ligTrialFury(I){ const F = I.run.fury; if (!F || I.fury || !(I.run.time - I.t >= F.atSec)) return;
  for (const e of B.en){ if (!e.boss || e.dead) continue; I.fury = true; if (e.fury > 1) continue;
    e.fury = F.dmgMult; B.banner = { txt: 'FÚRIA DO MESTRE', sub: 'Dano x' + F.dmgMult, t: 0, dur: 1.8, col: '#ff5252' }; B.shake = Math.max(B.shake || 0, .5); try { snd('boss_appear'); } catch (er) {} } }
/* botão de sair da luta especial ("Sair do ensaio", "Sair da perseguição", "Desistir" da Provação): embaixo da barra da fase; desce se o selo "Fraco contra"
   estiver na tela e, na Provação, fica embaixo da faixa da regra (PTrial) */
function ligExit(on){ try { if (typeof document === 'undefined') return; let b = document.getElementById('lig_exit');
    if (!on){ if (b){ if (typeof b.remove === 'function') b.remove(); else if (b.parentNode) b.parentNode.removeChild(b); } return; }
    const h = document.getElementById('fb_w'); if (!h) return; if (!b){ b = document.createElement('button'); b.id = 'lig_exit'; b.type = 'button'; { const k = B.inst && B.inst.run ? B.inst.run.special : '', th = k === 'thief', tr = k === 'trial';   /* o mesmo botão serve à perseguição do Ladrão de Brasas e à Provação (nas duas, sair pede dois toques: ligThiefExit / ligTrialExit) */
        b.textContent = th ? 'Sair da perseguição' : tr ? 'Desistir' : 'Sair do ensaio'; b.setAttribute('aria-label', th ? 'Sair da perseguição: a entrada não volta' : tr ? 'Desistir da provação: nada se perde e a tentativa não conta' : 'Sair do ensaio: nada é gasto nem anotado'); }
      b.style.cssText = 'position:absolute;left:82px;z-index:6;min-height:44px;padding:0 16px;border-radius:22px;border:2px solid #ffc94a;background:rgba(29,22,17,.92);color:#f6ecdf;font:900 13px/1 Nunito,system-ui,sans-serif;box-shadow:0 2px 0 rgba(0,0,0,.4);cursor:pointer';
      if (b.addEventListener) b.addEventListener('click', () => { try { if (typeof snd === 'function') snd('ui_tap'); } catch (e) {} const k = B.inst && B.inst.run ? B.inst.run.special : ''; if (k === 'thief') ligThiefExit(); else if (k === 'trial') ligTrialExit(); else ligPathExit(); }); h.appendChild(b); }
    let top = 122; const w = document.getElementById('wsl_root'); if (w && w.style && w.style.display !== 'none'){ const hh = Math.round(+w.offsetHeight || 0) || 24; top = 122 + hh + 6; }
    if (B.inst && B.inst.run && B.inst.run.special === 'trial'){ let bh = 0;   /* Provação: a faixa da regra (PTrial, 44 px ou mais) ocupa este lugar; o botão vai para baixo dela */
      try { if (window.PTrial && typeof PTrial.hudOn === 'function' && PTrial.hudOn()){ const bd = typeof document.querySelector === 'function' ? document.querySelector('#pt_hud .pt-band') : null; bh = (bd && Math.round(+bd.offsetHeight || 0)) || 44; } } catch (e) { bh = 44; }
      if (bh) top += bh + 6; }
    if (b.style.top !== top + 'px') b.style.top = top + 'px';
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
   - PELO RUN DO MÓDULO (campos que o enter pode trazer; sem eles vale o que está acima): bagHp = vida do saco, sem medição; escapeAt / escapeEvery /
     escapeDur (+ seed: desvio de ± THIEF.jitter s por fuga, determinístico) = ritmo da fuga; endsAt (epoch ms do servidor) = o relógio não passa dele.
     O fim NUNCA sai antes de THIEF.minEnd s de relógio (o servidor responde 409 too_fast): saco vazio antes disso espera o tempo fechar.
   - ARTE: a criatura PARADA da Arte (THIEF_ART.still) com balanço por código; a folha animada ainda vem. Reserva enquanto a imagem não carrega = o inimigo
     comum da era atual (THIEF_ART.kind), espelhado, com o nome próprio. O especial do herói começa recarregando (a medição do saco pega só o ritmo de base).
   - FIM DE TARDE: um véu de cor por cima do cenário, só durante a perseguição (dois fillRect; sem arte nova). */
/* still: a criatura PARADA entregue pela Arte (uma célula 512x352, pés em y=307, olhando para a DIREITA = o lado da fuga). Sem folha animada ainda: o corpo
   ganha um balanço por código (e.bob, js/battle.js). kind: reserva enquanto a imagem não carrega (ou se faltar) = o inimigo comum da era atual, espelhado */
const THIEF_ART = { kind: 'e0', name: 'Ladrão de Brasas', key: 'thief', still: 'assets/anim/enemy/thief/thief_still.png', run: 'assets/anim/enemy/thief/thief_run' };   /* run: folha da corrida (.png + .json: 8 quadros, 12 fps, 512x352, pés em feetY), a mesma célula e a mesma altura da parada */
const THIEF = { bagFrac: 0.8, measure: 3, intro: 0.5, fleeFirst: 7, fleeEvery: 8, fleeDur: 1.4, fleeOut: 0.3, fleeBack: 0.35, ember: 0.04, askSec: 4,
  minEnd: 5, jitter: 0.5,   /* minEnd: o servidor recusa o fim antes de 5 s do enter (409 too_fast); jitter: ± segundos por fuga, tirados do seed do run */
  veil: 'rgba(255,132,40,.14)', veilSky: 'rgba(255,96,72,.10)' };
/* quanto o ladrão está longe (0 = ao alcance, 1 = fora da tela) no segundo tt da corrida. Função pura. Sem P: o ritmo fixo (igual em toda corrida).
   Com P (thiefPlan: o ritmo que veio no run do módulo/servidor): as fugas começam nos segundos de P.at e duram P.dur */
function thiefOff(tt, P){ let k = 0; if (tt < THIEF.intro) k = 1 - Math.max(0, tt) / THIEF.intro;
  else { const D = P ? P.dur : THIEF.fleeDur; let p = -1;
    if (P){ for (const s of P.at){ if (tt < s) break; if (tt - s < D){ p = tt - s; break; } } } else { const u = tt - THIEF.fleeFirst; if (u >= 0) p = u % THIEF.fleeEvery; }
    if (p >= 0 && p < D) k = p < THIEF.fleeOut ? p / THIEF.fleeOut : p > D - THIEF.fleeBack ? (D - p) / THIEF.fleeBack : 1; }
  return k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k); }
/* ritmo da fuga pelo run do módulo: escapeAt (1ª fuga), escapeEvery (intervalo) e escapeDur (duração), em segundos. Com seed, cada fuga ganha um desvio de
   ± THIEF.jitter s tirado de um gerador determinístico (o mesmo seed dá sempre o mesmo ritmo). null = o run não trouxe o ritmo: vale o fixo */
function thiefPlan(run, secs){ const a = +run.escapeAt, ev = +run.escapeEvery, du = +run.escapeDur;
  /* PRIORIDADE: run.escapes = a LISTA dos inícios das fugas (segundos), já com o desvio da seed, calculada pelo módulo/servidor (Sys.thief.escapesOf). A luta usa
     exatamente esses segundos (lista vazia = nenhuma fuga); cada fuga dura run.escapeDur. Sem a lista, a conta abaixo (escapeAt/escapeEvery + seed) é a reserva */
  if (Array.isArray(run.escapes)){ const at = run.escapes.map(x => +x).filter(x => isFinite(x) && x >= 0).sort((x, y) => x - y); return { at, dur: du > 0 ? du : THIEF.fleeDur, list: true }; }
  if (!(a > 0) || !(ev > 0) || !(du > 0)) return null;
  const sd = run.seed; let rnd = null;
  if (sd != null && sd !== ''){ let h = 2166136261; if (typeof sd === 'number' && isFinite(sd)) h = (Math.floor(Math.abs(sd)) % 4294967296) >>> 0;
    else { const s = String(sd); for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h >>>= 0; }
    rnd = () => { h = (h + 0x6D2B79F5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const at = []; for (let i = 0, t = a; t < secs + 1 && i < 200; i++, t += ev) at.push(Math.max(THIEF.intro, t + (rnd ? (rnd() * 2 - 1) * THIEF.jitter : 0)));
  at.sort((x, y) => x - y); return { at, dur: du }; }
/* agora no relógio do SERVIDOR (o endsAt do run é dele); sem o Sys.net, o relógio do aparelho */
const thiefNow = () => { try { const N = window.Sys && Sys.net; if (N && typeof N.serverNow === 'function') return N.serverNow(); } catch (e) {} return Date.now(); };
const thiefScore = I => { const C = I && I.chase, f = C ? +C.frac : 0; return f > 0 ? Math.min(1, f) : 0; };
function thiefEmber(x, y, n){ const v = RUNV(); for (let i = 0; i < n; i++) B.parts.push({ x: x + (Math.random() - .5) * 10, y, vx: -v * (0.45 + Math.random() * 0.5), vy: -40 - Math.random() * 70, g: 320, t: 0, life: .5 + Math.random() * .3, col: i % 2 ? '#ffd27a' : '#ff8a2a', sz: 2 + Math.random() * 3, glow: true }); }
/* um passo da perseguição (depois do step da batalha). Devolve true quando a luta acabou (saco vazio) */
function thiefStep(I, dt){ const C = I.chase, e = B.en[0]; if (!C || !e || !e.thief) return false;
  C.tt += dt; C.wt += dt / (B.speed > 0 ? B.speed : 1);   /* wt: o laço chama este passo B.speed vezes por quadro; dividido, dá o tempo de relógio (o que o servidor conta) */
  if (C.ask > 0){ C.ask -= dt; if (C.ask <= 0) thiefAsk(false); }
  if (I.run.endsAt > 0){ const lf = (I.run.endsAt - thiefNow()) / 1000; if (lf < I.t) I.t = lf; }   /* o relógio da tela não passa do fim que o servidor marcou */
  if (I.t < 0) I.t = 0;
  if (!(C.hp > 0)) C.hp = e.maxhp;
  if (!e.bob && SPR(THIEF_ART.still, 'enemy')){ e.spr = THIEF_ART.still; e.key = THIEF_ART.key; e.flee = false; e.bob = true; e.hc = 0; }   /* a arte própria chegou: troca a reserva (já olha para a direita; sem folhas, balanço por código) */
  /* dano no ladrão neste passo (herói, pet e magias). A vida dele é só um colchão enorme: se um golpe passar do colchão o killEnemy devolve a vida cheia (hp > o que deixei) e o golpe vale o colchão inteiro */
  const d = e.hp > C.hp ? e.maxhp : C.hp - e.hp; if (d > 0){ if (C.max > 0) C.out += d; else C.dmg += d; }
  const k = C.hold ? 0 : thiefOff(C.tt, C.plan);   /* saco vazio à espera do fim: o ladrão não foge mais */
  if (!(C.max > 0)){ if (k === 0) C.tm += dt;   /* medição: só conta o tempo com o ladrão ao alcance */
    if (C.tm >= THIEF.measure){ if (C.dmg > 0){ C.max = C.dmg / C.tm * THIEF.bagFrac * I.run.time; C.out = C.dmg; } else C.tm = 0; } }   /* nenhum dano na janela: mede de novo */
  const f = C.max > 0 ? C.out / C.max : (C.dmg > 0 ? Math.min(C.tm, THIEF.measure) / (THIEF.bagFrac * I.run.time) : 0);
  if (f > C.frac) C.frac = Math.min(1, f);
  /* Brasas caindo do saco: faíscas a cada pedaço e uma Brasa voando a cada Brasa inteira do lote (só desenho; quem credita é o Sys.thief.finish pela tela) */
  { const sx = e.x + (e.dw || 60) * (e.bob ? 0.2 : -0.25), sy = GY - (e.dh || 80) * 0.5, pe = Math.floor(C.frac / THIEF.ember), nb = Math.round((I.run.lote || 0) * C.frac);
    if (pe > C.pe){ C.pe = pe; if (e.x < LW) thiefEmber(sx, sy, 3); }
    if (nb > C.nb){ const q = nb - C.nb; C.nb = nb; let ok = false; try { ok = !!(window.Fogueira && Fogueira.onBrasa(Math.min(LW - 20, sx), sy, q)); } catch (er) {}
      if (!ok) floatText(Math.min(LW - 40, sx), sy - 20, '+' + q + (q === 1 ? ' Brasa' : ' Brasas'), '#ffc27a', 0); } }
  /* saco vazio antes do tempo. O servidor recusa o fim antes de THIEF.minEnd s do enter (409 too_fast): se esvaziou antes disso (golpe gigante), o ladrão para
     ao alcance com o saco vazio (o score já é 1) e o fim sai quando o tempo mínimo fechar. O finish continua sendo UMA chamada */
  if (C.max > 0 && C.frac >= 1){ if (C.wt >= THIEF.minEnd){ instEnd(true); return true; }
    if (!C.hold){ C.hold = true; B.banner = { txt: 'Saco vazio!', pill: true, bg: 'rgba(29,22,17,.92)', bd: '#ffc94a', sh: '#0e0a07', t: 0, dur: 1.6, col: '#ffc94a' }; } }
  e.hp = C.hp = e.maxhp * Math.max(1e-3, (1 - C.frac) * 0.999);   /* a barra em cima do ladrão é o SACO (cheio → vazio) */
  e.x = e.slot + (LW + 44 - e.slot) * k; e.parked = false; e.hurtT = 0;   /* a posição é a do ritmo da fuga; sempre na folha de corrida */
  if (B.running){ const dx = RUNV() * dt; for (const t of B.fx) t.x += dx; for (const r of B.rings) r.x += dx; }   /* os números de dano ficam com o ladrão (o step os leva com o chão) */
  return I.t <= 0 && C.wt < THIEF.minEnd; }   /* true também quando o relógio zerou antes do tempo mínimo do servidor: o instStep ainda não fecha a luta */
/* véu do fim de tarde, por cima do cenário (chamado pelo draw do js/battle.js só com B.inst.chase) */
function thiefVeil(){ ctx.fillStyle = THIEF.veil; ctx.fillRect(-12, -12, LW + 24, LH + 24); ctx.fillStyle = THIEF.veilSky; ctx.fillRect(-12, -12, LW + 24, GY * 0.55 + 12); }
/* FOLHA DA CORRIDA DO LADRÃO (Arte, 14/11). A folha tem a mesma célula e a mesma escala da imagem parada (512x352, pés em feetY), e não a meia resolução das
   folhas de inimigo do js/battle.js (enFrame supõe célula de 256 para arte de 512); por isso é tocada AQUI, com os dados do .json, e não pelo ENEMY_SETS.
   Três degraus: folha carregada = quadro pelo tempo (e.wt, o relógio de corrida que a batalha já anda); folha ainda não chegou = a parada com balanço
   (e.bob, js/battle.js); parada ainda não chegou = o inimigo comum da era. Sem folha de dano: o golpe pisca o corpo e dá um recuo curto, por código.
   Custo por quadro: um drawImage (dois no instante do golpe). */
function thiefSheet(){ try { const sh = sheetLoad(THIEF_ART.run, true), M = sh && sh.meta; return sh && sh.ok && sh.img && M && M.frames > 0 && M.w > 0 && M.h > 0 ? sh : null; } catch (e) { return null; } }
/* quadro da corrida no tempo wt (segundos): anda a M.fps (12) e dá a volta */
function thiefFrame(M, wt){ const n = M.frames | 0; if (!(n > 0)) return 0; const t = +wt; return Math.floor((t > 0 && isFinite(t) ? t : 0) * (M.fps > 0 ? M.fps : 12)) % n; }
/* desenha o ladrão com a folha. Devolve false quando não dá (folha ou parada ainda não carregadas): quem chamou cai no desenho de sempre */
function thiefDraw(e, x){ if (!e.bob) return false; const sh = thiefSheet(); if (!sh) return false; const spr = SPR(THIEF_ART.still, 'enemy'); if (!spr || !(spr.fh > 0)) return false;
  const M = sh.meta, gy = GY + (LANEY[e.lane] || 0), dh = e.hc || e.dhT || SLOTH[Math.min(e.idx, MAXVIS - 1)]; if (!(dh > 0)) return false;
  const dw = dh * spr.w / spr.h; e.dw = dw; e.dh = dh;   /* a barra do saco e as Brasas leem o tamanho daqui, igual ao da parada */
  const s = dh / (spr.fh * M.h), fi = thiefFrame(M, e.wt), hk = e.hit > 0 ? Math.min(1, e.hit / 0.12) : 0;   /* s = px da tela por px da célula (a parada ocupa spr.fh da altura da célula e é desenhada com dh) */
  const ox = x + 3 * hk, x0 = ox - (spr.fx + spr.fw / 2) * M.w * s, y0 = gy - (typeof M.feetY === 'number' ? M.feetY : spr.bot * M.h) * s;   /* mesmo centro da parada; a linha dos pés do .json na linha do chão; golpe = recuo de até 3 px */
  ctx.save();
  try { ctx.globalAlpha = 0.35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, gy + 2, Math.max(20, dw * .42), 5, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    if (window.__probe) window.__probe(e, { x: ox, feet: gy, top: gy - dh, dh, dw, sy: 1, sx: 1, rot: 0, lean: 0, adv: 0, walking: true, atk: false, dying: false, sheet: true, frame: fi });
    const sx = sheetSX(M, fi), sy = sheetSY(M, fi); ctx.drawImage(sh.img, sx, sy, M.w, M.h, x0, y0, M.w * s, M.h * s);
    if (hk > 0){ ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * hk; ctx.drawImage(sh.img, sx, sy, M.w, M.h, x0, y0, M.w * s, M.h * s); }   /* levou golpe: pisca (só os pixels do corpo clareiam) */
  } finally { ctx.restore(); }
  return true; }
/* o desenho do inimigo é do js/battle.js (drawEnemyAt); aqui só o LADRÃO vivo com a folha pronta passa pelo thiefDraw. Qualquer falha cai no desenho de sempre */
if (typeof drawEnemyAt === 'function' && !drawEnemyAt.thief){ const enDraw0 = drawEnemyAt;
  drawEnemyAt = function (e, x, deadP){ if (e && e.thief && !(deadP > 0)){ let ok = false; try { ok = thiefDraw(e, x); } catch (er) { ok = false; } if (ok) return; } return enDraw0(e, x, deadP); };
  drawEnemyAt.thief = true; }
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
    waves: [[{ kind: THIEF_ART.kind, immortal: true, thief: true, name: THIEF_ART.name }]], lote: Math.max(0, Math.floor(+run.lote || 0)), lv: Math.floor(+run.lv || 0),
    bagHp: +run.bagHp > 0 && isFinite(+run.bagHp) ? +run.bagHp : 0, endsAt: +run.endsAt > 0 && isFinite(+run.endsAt) ? +run.endsAt : 0 };   /* campos novos do run do módulo (podem não vir): vida do saco e fim no relógio do servidor */
  let ok = false; try { ok = window.startInstanceRun(r) !== false; } catch (e) { console.error('startThiefRun', e); ok = false; }
  if (!ok || !B.inst || B.inst.run !== r) return false;
  /* max = vida do saco: a do run (bagHp), sem medição; sem ela fica 0 e o thiefStep mede (reserva). plan = ritmo da fuga do run (null = o fixo). wt = segundos de RELÓGIO da corrida (não acelera com x2/x4) */
  B.inst.chase = { tt: 0, tm: 0, dmg: 0, max: r.bagHp, out: 0, frac: 0, hp: 0, pe: 0, nb: 0, ask: 0, wt: 0, hold: false, plan: thiefPlan(run, r.time) }; B.spawnT = 0;
  if (typeof BAL !== 'undefined' && BAL.s2Cooldown > 0) B.cd2 = BAL.s2Cooldown;   /* o especial começa recarregando: a medição do saco (3 s) pega só o ritmo de base, sem a rajada do especial inflar a vida do saco por sorte de momento (medido: com o especial na janela o score variava de 0,53 a 0,97 no mesmo herói) */
  try { SPR(THIEF_ART.still, 'enemy'); } catch (e) {}   /* pede a arte do ladrão já (ele entra em THIEF.intro s) */
  try { sheetLoad(THIEF_ART.run, true); } catch (e) {}   /* e a folha da corrida */
  return true; };
