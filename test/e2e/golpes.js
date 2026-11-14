'use strict';
/* GOLPES ESPECIAIS COM NOME (Sys.strikes → js/battle.js: stkRefresh, stkHit, heroGuard, stkStep) e ATRIBUTOS DO CAMINHO (Sys.path.statOf → heroApply).
   Sem navegador: node test/e2e/golpes.js
   Sobe o jogo de verdade no sandbox. A sorte do jogo (Sys.host.rng) é trocada por um valor fixo: 0 = todo golpe especial acontece, 0,999 = nenhum.
   Confere: chave desligada = nada (sem perfil, sem rótulo, sem gastar sorte); COMBO = UM golpe extra com o multiplicador do módulo; ATORDOADO = o inimigo não
   ataca por stunSec e fica imune depois; ROUBO DE VIDA cura; ESQUIVA zera o dano; CONTRA-ATAQUE = UM golpe de volta; cada um mostra o rótulo do módulo
   (texto e cor) acima do número; velocidade de ataque e dano crítico do caminho entram só com o Sys.path ligado. Só lê arquivos do jogo. Código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  /* o JOGO liga golpes, caminho e afinidade no arranque (SYS_LIVE, js/farm.js). Este teste sobe com "&sem=strikes,path,affinity": os dois primeiros para provar o
     "desligado = como antes"; a afinidade para ISOLAR os golpes (as contas abaixo são ATQ × multiplicador do golpe; a afinidade tem o teste dela, afinidade.js) */
  { const G0 = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    check('sem parâmetro golpes e caminho nascem LIGADOS (SYS_LIVE do jogo)', G0.ev('Sys.strikes.DATA.on===true&&Sys.path.DATA.on===true')); }
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1&sem=strikes,path,affinity' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const J =code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  ev(`(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; Math.random=()=>0.5; window.__rng=0; window.__rngN=0; Sys.host.rng=()=>{ window.__rngN++; return window.__rng; };
    window.__mk=function(kind){ const e=mkEnemy(S.stage,kind||'e0'); e.maxhp=e.hp=1e7; e.dmg=5; B.en=[e]; B.toSpawn=[]; B.eshots=[]; placeNow(); B.fx.length=0; B.stkQ.length=0; B.hero.hp=B.hero.maxhp; B.hero.critRate=0; B.deadT=0; B.act=null; B.stkLsT=null; return e; };
    window.__A={type:'s1',col:'#ffffff',hits:[],ev:[]}; window.__lab=t=>B.fx.filter(f=>f.txt===t);
    const L=Sys.level.ensure(S); L.lvl=40; L.xp=0; return 1; })()`);
  const D = J('const K=Sys.strikes.DATA; return {battle:K.battle,color:K.color,comboMult:K.comboMult,counterMult:K.counterMult,stunSec:K.stunSec,stunSecBoss:K.stunSecBoss,imm:K.stunImmuneSec,paths:Sys.path.DATA.paths};');
  const path = id => D.paths.find(p => p.id === id);
  /* ---------- 1) tudo desligado ---------- */
  check('chaves DESLIGADAS com &sem=strikes,path (strikes, path)', ev('Sys.strikes.DATA.on===false&&Sys.path.DATA.on===false'));
  { const r = J(`refreshHero(); const base={aspd:B.hero.aspd,critDmg:B.hero.critDmg,ivl:B.hero.ivl}; const e=__mk(); __rngN=0; hitEnemy(e,1,__A,null); const d=1e7-e.hp; const hp0=B.hero.hp; heroHit(10,e); for(let i=0;i<30;i++) step(1/30);
      return {stk:B.stk,q:B.stkQ.length,rng:__rngN,d,atk:B.hero.atk,hurt:hp0-B.hero.hp>0,labels:B.fx.filter(f=>/[A-Z]{4}/.test(f.txt)).map(f=>f.txt),base};`);
    check('desligado: sem perfil, sem fila, sem rótulo, sem gastar a sorte do jogo', r.stk === null && r.q === 0 && r.rng === 0 && r.labels.length === 0, JSON.stringify(r));
    check('desligado: golpe e dano no herói como hoje', Math.abs(r.d - r.atk) < 1e-6 * r.atk && r.hurt, JSON.stringify(r)); G.base = r.base; }
  /* ---------- 2) COMBO + velocidade de ataque (caminho Disparo) ---------- */
  ev("(function(){ Sys.strikes.setOn(true); Sys.path.setOn(true); S.sys.path={v:1,id:'shot',at:0,wk:'',changes:0}; refreshHero(); return 1; })()");
  { const P = path('shot'), r = J(`const e=__mk(); __rng=0; hitEnemy(e,1,__A,null); const d1=1e7-e.hp, q=B.stkQ.length, lab=__lab('${D.battle.combo}')[0], num=B.fx.find(f=>f.txt===fmt(d1)); stkStep(0.5); const d2=1e7-e.hp-d1, q2=B.stkQ.length;
      return {combo:B.stk&&B.stk.normal.combo,d1,d2,q,q2,lab:lab?{col:lab.col,y:lab.y}:null,numY:num?num.y:null,n:__lab('${D.battle.combo}').length,aspd:B.hero.aspd,ivl:B.hero.ivl,want:Sys.stats.interval({aspd:B.hero.aspd}),atk:B.hero.atk};`);
    check('perfil refeito no refreshHero: combo do caminho = ' + P.strikes.combo, r.combo === P.strikes.combo, JSON.stringify(r));
    check('COMBO: rótulo do módulo, na cor do módulo, ACIMA do número do dano', !!r.lab && r.lab.col === D.color.combo && r.numY != null && r.lab.y <= r.numY - 14, JSON.stringify(r));
    check('COMBO: UM golpe extra na fila, com o multiplicador do módulo sobre o básico', r.q === 1 && Math.abs(r.d2 - r.atk * D.comboMult) < 1e-6 * r.atk, JSON.stringify(r));
    check('COMBO: o golpe de combo não puxa outro combo', r.q2 === 0 && r.n === 1, JSON.stringify(r));
    check('caminho Disparo: velocidade de ataque +' + P.stat.aspd + ' na batalha (intervalo do básico menor)', Math.abs(r.aspd - (G.base.aspd + P.stat.aspd)) < 1e-9 && r.ivl < G.base.ivl && Math.abs(r.ivl - r.want) < 1e-9, JSON.stringify([r.aspd, r.ivl, G.base]));
    const s = J(`const e=__mk(); __rng=0; hitMany([e],2,{type:'s2',col:'#ffffff',hits:[],ev:[]},{m:2}); return {q:B.stkQ.length};`); check('COMBO só no golpe básico (especial s2 não puxa)', s.q === 0, JSON.stringify(s));
    const z = J(`const e=__mk(); __rng=0.999; hitEnemy(e,1,__A,null); return {q:B.stkQ.length,l:__lab('${D.battle.combo}').length};`); check('sem sorte, sem combo e sem rótulo', z.q === 0 && z.l === 0, JSON.stringify(z)); }
  /* ---------- 3) ATORDOADO + dano crítico (caminho Arcano) ---------- */
  ev("(function(){ S.sys.path.id='arcane'; refreshHero(); return 1; })()");
  { const P = path('arcane'), r = J(`const e=__mk(); __rng=0; const t0=B.t; hitEnemy(e,1,__A,null); const st=e.stunT, imm=e.imm-t0, lab=__lab('${D.battle.stun}')[0]; e.atkT=0; const hp0=B.hero.hp; let sw=0; for(let i=0;i<24;i++){ step(1/30); if(e.sw>0) sw++; }
      const hurtStun=hp0-B.hero.hp; __rng=0.999; e.stunT=0; e.atkT=0; let sw2=0; for(let i=0;i<45;i++){ step(1/30); if(e.sw>0) sw2++; } const hurtFree=hp0-B.hero.hp;
      __rng=0; B.fx.length=0; hitEnemy(e,1,__A,null); const again=e.stunT>0, lab2=__lab('${D.battle.stun}').length;
      return {stun:B.stk.normal.stun,st,imm,lab:lab?lab.col:null,sw,hurtStun,sw2,hurtFree,again,lab2,critDmg:B.hero.critDmg};`);
    check('ATORDOADO: segundos e imunidade do módulo (' + D.stunSec + ' s, imune ' + D.imm + ' s depois)', Math.abs(r.st - D.stunSec) < 1e-9 && Math.abs(r.imm - (D.stunSec + D.imm)) < 1e-9, JSON.stringify(r));
    check('ATORDOADO: rótulo e cor do módulo', r.lab === D.color.stun, JSON.stringify(r));
    check('ATORDOADO: o inimigo não começa golpe nem tira vida enquanto dura', r.sw === 0 && r.hurtStun === 0, JSON.stringify(r));
    check('fim do atordoamento: o inimigo volta a atacar', r.sw2 > 0 && r.hurtFree > 0, JSON.stringify(r));
    check('imunidade respeitada: outro golpe com sorte não atordoa de novo', r.again === false && r.lab2 === 0, JSON.stringify(r));
    check('caminho Arcano: dano crítico +' + P.stat.critDmg + ' na batalha', Math.abs(r.critDmg - (G.base.critDmg + P.stat.critDmg)) < 1e-9, r.critDmg + ' x ' + G.base.critDmg);
    const b = J(`const e=__mk('boss'); __rng=0; hitEnemy(e,1,__A,null); return {st:e.stunT};`); check('chefe: atordoado pela metade (o módulo devolve ' + D.stunSecBoss + ' s)', Math.abs(b.st - D.stunSecBoss) < 1e-9, JSON.stringify(b)); }
  /* ---------- 4) ROUBO DE VIDA + CONTRA-ATAQUE (caminho Lâmina) ---------- */
  ev("(function(){ S.sys.path.id='blade'; refreshHero(); return 1; })()");
  { const P = path('blade'), r = J(`const e=__mk(); __rng=0.999; B.hero.hp=B.hero.maxhp*0.5; const h0=B.hero.hp; hitEnemy(e,1,__A,null); const d=1e7-e.hp, heal=B.hero.hp-h0, l1=__lab('${D.battle.lifesteal}'); hitEnemy(e,1,__A,null); const heal2=B.hero.hp-h0-heal, l2=__lab('${D.battle.lifesteal}').length;
      return {ls:B.stk.normal.lifesteal,d,heal,heal2,l1:l1.length,col:l1[0]&&l1[0].col,l2};`);
    check('ROUBO DE VIDA: cura = dano × ' + P.strikes.lifesteal + '% (do módulo)', Math.abs(r.heal - r.d * P.strikes.lifesteal / 100) < 1e-6 * r.d && r.heal > 0, JSON.stringify(r));
    check('ROUBO DE VIDA: rótulo e cor do módulo; o 2º golpe seguido cura de novo sem repetir o rótulo', r.l1 === 1 && r.col === D.color.lifesteal && r.heal2 > 0 && r.l2 === 1, JSON.stringify(r));
    const c = J(`const e=__mk(); __rng=0; B.stk=Sys.strikes.profile(S,Sys.host,null,{extra:{}}); const hp0=B.hero.hp, e0=e.hp; const fell=heroHit(10,e); const lab=__lab('${D.battle.counter}')[0], q=B.stkQ.length, took=hp0-B.hero.hp; B.hero.hp=B.hero.maxhp; const hA=B.hero.hp; stkStep(0.5);
      return {counter:B.stk.normal.counter,fell,lab:lab?lab.col:null,q,took,d:e0-e.hp,atk:B.hero.atk,q2:B.stkQ.length};`);
    check('CONTRA-ATAQUE: rótulo e cor do módulo; o herói ainda leva o dano', c.lab === D.color.counter && c.took > 0 && c.fell === false, JSON.stringify(c));
    check('CONTRA-ATAQUE: UM golpe de volta em quem bateu, com o multiplicador do módulo', c.q === 1 && c.q2 === 0 && Math.abs(c.d - c.atk * D.counterMult) < 1e-6 * c.atk, JSON.stringify(c)); }
  /* ---------- 5) ESQUIVA (bônus temporário pelo próprio módulo: profile com extra) ---------- */
  { const r = J(`const e=__mk(); B.stk=Sys.strikes.profile(S,Sys.host,null,{extra:{dodge:10}}); __rng=0; const hp0=B.hero.hp, en0=B.energy; B.hurt=0; const fell=heroHit(10,e); const lab=__lab('${D.battle.dodge}')[0], took=hp0-B.hero.hp, hurt=B.hurt;
      __rng=0.999; B.fx.length=0; heroHit(10,e); return {dodge:B.stk.normal.dodge,fell,lab:lab?lab.col:null,took,hurt,took2:hp0-B.hero.hp,l2:__lab('${D.battle.dodge}').length};`);
    check('ESQUIVA: dano zerado, herói não pisca, rótulo e cor do módulo', r.took === 0 && r.hurt === 0 && r.lab === D.color.dodge && r.fell === false, JSON.stringify(r));
    check('sem sorte: o golpe entra e não há rótulo', r.took2 > 0 && r.l2 === 0, JSON.stringify(r)); }
  /* ---------- 6) a luta inteira roda com tudo ligado; desligar volta ao de hoje em até 1 s de jogo ---------- */
  { let ok = true; try { ev("(function(){ __rng=0; S.sys.path.id='shot'; startBattle(); for(let i=0;i<600;i++) step(1/30); return 1; })()"); } catch (e) { ok = false; console.log(String(e && e.message)); }
    const r = J(`return {kills:S.kills,labels:B.fx.length,hp:B.hero.hp,max:B.hero.maxhp,err:0};`); check('20 s de luta com golpes especiais ligados, sem erro e com abates', ok && r.kills > 0 && isFinite(r.hp) && r.hp <= r.max + 1e-6, JSON.stringify(r));
    const o = J(`Sys.strikes.setOn(false); Sys.path.setOn(false); B.sysT=0; for(let i=0;i<40;i++) step(1/30); return {stk:B.stk,aspd:B.hero.aspd,critDmg:B.hero.critDmg};`);
    check('chaves desligadas no meio da luta: perfil some e os atributos voltam (conferência de 1 s)', o.stk === null && Math.abs(o.aspd - G.base.aspd) < 1e-9 && Math.abs(o.critDmg - G.base.critDmg) < 1e-9, JSON.stringify(o)); }
  check('sem console.error do jogo', G.consoleErrs.length === 0, G.consoleErrs.slice(0, 3).join(' | '));
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (golpes especiais)' : 'GOLPES ESPECIAIS OK (' + n + ' verificações): combo, contra-ataque, atordoado, esquiva e roubo de vida com rótulo; atributos do caminho; desligado = como hoje');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
