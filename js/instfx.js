'use strict';
/* ================= LUTA DA INSTÂNCIA (pedido Q-4; v0.12.8) =================
   window.startInstanceRun(run): run = definição do Sys.instances.start (buildRun: waves [[{kind, eraBoss, hpMult, dmgMult}]], loop, time, spawnGap,
   stage, goal 'kills' | 'boss' | 'clear', noNormalLoot). A horda roda na MESMA batalha, com os inimigos aprovados da era de run.stage (mkEnemy),
   sem drops de fase (killEnemy não chama o farmKill), com relógio e o HUD dizendo "Instância". No fim (vitória, derrota ou tempo) chama
   Sys.instances.finish(S, host, run.id, {win, kills}), devolve o jogo ao ponto onde estava (fase, onda, farm) e abre window.PInst.showResult(out).
   Enquanto roda, a fase do save é trocada só em memória (o save() fica suspenso: index.html), para o cenário e os inimigos serem os da instância. */
function instMk(sp){ const e = mkEnemy(S.stage, sp.kind || 'e0'); const hm = sp.hpMult > 0 ? sp.hpMult : 1, dm = sp.dmgMult > 0 ? sp.dmgMult : 1;
  e.maxhp = e.hp = e.hp * hm; e.dmg *= dm; if (sp.eraBoss) e.eraBoss = true; e.gold = 0; return e; }
function instWave(i){ const I = B.inst, w = I.run.waves[i] || []; B.en = []; B.toSpawn = w.map(x => Object.assign({}, x)); B.waveN = B.toSpawn.length; B.spawnT = 0.4; B.enemy = null; B.waveT = 0; preloadAssets(); }
if (typeof NEXT_ON !== 'undefined' && NEXT_ON) window.startInstanceRun = function(run){ if (!run || !Array.isArray(run.waves) || !run.waves.length || B.inst) return false;
  if (view !== 'battle') setView('battle');
  B.inst = { run, wi: 0, kills: 0, t: run.time > 0 ? run.time : 60, back: { stage: S.stage, wave: S.wave, farm: !!S.farm }, done: false };
  if (Number.isInteger(run.stage) && run.stage > 0) S.stage = run.stage; S.wave = 1; S.farm = false;
  const st = heroStats(); B.hero = { hp: st.hp, atkT: 0.3 }; heroApply(B.hero, st); B.deadT = 0; B.deadBoss = false; B.act = null; B.res = null; B.running = true;
  instWave(0); B.banner = { txt: 'Instância: ' + (run.name || ''), pill: true, bg: 'rgba(29,22,17,.92)', bd: '#ffc94a', sh: '#0e0a07', t: 0, dur: 2.2, col: '#ffc94a' };
  if (typeof fbTick === 'function') fbTick(); return true; };
function instStep(dt){ const I = B.inst; if (!I || I.done) return; I.t -= dt; if (I.t <= 0){ I.t = 0; instEnd(I.run.goal === 'kills'); } }   // tempo esgotado: na corrida de abates quem decide é o módulo (kills >= mínimo)
function instWaveClear(){ const I = B.inst; if (!I || I.done) return; I.wi++;
  if (I.wi < I.run.waves.length){ instWave(I.wi); return; }
  if (I.run.loop){ I.wi = 0; instWave(0); return; }
  instEnd(true); }
function instEnd(win){ const I = B.inst; if (!I || I.done) return; I.done = true; let out = null;
  try { out = Sys.instances.finish(S, Sys.host, I.run.id, { win: !!win, kills: I.kills }); } catch (e) { console.error('instances.finish', e); out = { ok: false, reason: 'erro' }; }
  S.stage = I.back.stage; S.wave = I.back.wave; S.farm = I.back.farm; B.inst = null;   // volta ao farm onde estava
  B.deadT = 0; B.deadBoss = false; startBattle(); if (typeof refreshHero === 'function') refreshHero(); save(); hud();
  if (window.PInst && typeof PInst.showResult === 'function'){ try { PInst.showResult(out); } catch (e) { console.error('PInst.showResult', e); toast(win ? 'Instância vencida' : 'Instância perdida'); } }
  else toast(out && out.ok !== false && (out.win || win) ? 'Instância vencida' : 'Instância perdida'); }
/* texto do cabeçalho da batalha durante a instância: nome e relógio */
function instHud(){ const I = B.inst; if (!I) return null; const s = Math.max(0, Math.ceil(I.t)); return { name: 'Instância', sub: Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') + (I.run.goal === 'kills' ? ' · ' + I.kills : '') }; }
