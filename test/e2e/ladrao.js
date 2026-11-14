'use strict';
/* LADRÃO DE BRASAS: A PERSEGUIÇÃO (Sys.thief + js/p_thief.js; luta especial 'thief' do js/instfx.js: startThiefRun, thiefStep, ligThiefExit; ganchos no
   js/battle.js: B.inst.chase, e.noAtk, e.flee, e.bob). Sem navegador: node test/e2e/ladrao.js
   Sobe o jogo de verdade no sandbox e faz o que a TELA faz (Sys.thief.enter → window.startThiefRun(run)); o fim tem de chegar por UMA chamada a
   PThief.finish(score) e a saída por UMA chamada a PThief.cancel(). Prova: chave desligada não começa nada; o ladrão não morre nem ataca; o saco esvazia
   com o dano; o relógio desce; termina no tempo com score = fração esvaziada; saco vazio antes do tempo = score 1; sair (dois toques) cancela sem finish;
   fase, onda, abates, mochila, ouro e XP voltam iguais; a luta não credita nada (as Brasas entram só pelo Sys.thief.finish da tela).
   Só lê arquivos do jogo. Sai com código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const J = code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  ev(`(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; let sd=7; Sys.host.rng=()=>{ sd=(sd*1103515245+12345)%2147483648; return sd/2147483648; };
    const L=Sys.level.ensure(S); L.lvl=60; L.xp=0; S.stage=4; S.best=7; S.wave=2; S.farm=false; startBattle();
    window.__n={fin:0,sc:[],can:0,pre:[],post:[]};
    window.__stock=()=>{ try{ return Sys.bonfire.view(S,Sys.host).stock; }catch(e){ return -1; } };
    window.__snap=()=>({stage:S.stage,wave:S.wave,farm:!!S.farm,kills:S.kills,inv:S.inv.length,gold:S.gold,gems:S.gems,xp:JSON.stringify(Sys.level.ensure(S)),stock:__stock()});
    const pf=PThief.finish; PThief.finish=function(sc){ __n.fin++; __n.sc.push(sc); __n.pre.push(__snap()); const r=pf.apply(this,arguments); __n.out=r; __n.post.push(__snap()); return r; };
    const pc=PThief.cancel; PThief.cancel=function(){ __n.can++; return pc.apply(this,arguments); };
    window.__one=function(){ step(1/30); if(typeof petStep==='function') petStep(1/30); if(B.inst) instStep(1/30); };
    window.__go=function(sec,each){ const k=Math.round(sec*30); for(let i=0;i<k&&B.inst;i++){ __one(); if(each&&B.inst) each(); } return !B.inst; };
    window.__enter=function(){ const o=Sys.thief.ensure(S); o.used=0; o.run=null; const r=Sys.thief.enter(S,Sys.host); return r; };
    return 1; })()`);
  check('a ponte existe: window.startThiefRun é função', ev("typeof window.startThiefRun==='function'"));
  /* chave do módulo desligada: nada começa */
  { const r = J(`const on0=Sys.thief.DATA.on; Sys.thief.DATA.on=false; const ok=window.startThiefRun({lv:1,lote:5,secs:45}); const o={ok,inst:B.inst==null,exit:ligThiefExit()}; Sys.thief.DATA.on=on0; return o;`);
    check('chave do Sys.thief DESLIGADA: startThiefRun devolve false e a batalha não muda', r.ok === false && r.inst && r.exit === false, JSON.stringify(r)); }
  ev('Sys.thief.DATA.on=true; Sys.bonfire.DATA.on=true; Sys.bonfire.ensure(S).lv=10; 1');
  const snap0 = J('return __snap();');
  const TH = J('return {secs:Sys.thief.DATA.secs,cfg:THIEF,art:THIEF_ART};');

  /* =================== a) termina no TEMPO =================== */
  { const r = J(`const run=__enter(); const used1=Sys.thief.ensure(S).used; const ok=window.startThiefRun(run); const I=B.inst, C=I&&I.chase; const o={run,used1,ok,special:I&&I.run.special,t0:I&&I.t,hud0:instHud(),stage:S.stage};
      __go(1); const e=B.en[0]; o.en=B.en.length; o.thief=e&&e.thief; o.imm=e&&e.immortal; o.noAtk=e&&e.noAtk; o.tag=e&&e.tag; o.running=B.running; o.act1=0; o.sw=0; o.hpMin=B.hero.hp/B.hero.maxhp; o.inR=0; o.outR=0; o.fr=[]; o.tm=[]; o.bar=[];
      const each=()=>{ const e=B.en[0]; if(B.act) o.act1++; if(e&&e.sw>0) o.sw++; o.hpMin=Math.min(o.hpMin,B.hero.hp/B.hero.maxhp); if(e&&e.x>LW) o.outR++; else o.inR++; if(!B.running) o.stopped=true; };
      __go(4,each); o.sized=C.max>0; o.max=C.max; o.dmg3=C.dmg; o.tmeas=C.tm; o.f5=C.frac; o.t5=I.t; o.hud5=instHud(); o.barK=e.hp/e.maxhp; o.dead=e.dead;
      B.hero.atk*=0.25;   /* herói mais fraco do que na medição: o saco NÃO esvazia até o fim do tempo */
      let last=0, mono=true, tl=I.t, down=true; const ended=__go(60,()=>{ each(); if(C.frac<last) mono=false; last=C.frac; if(I.t>tl) down=false; tl=I.t; });
      o.ended=ended; o.mono=mono; o.down=down; o.last=last; o.n=__n.fin; o.sc=__n.sc[0]; o.can=__n.can; o.pre=__n.pre[0]; o.post=__n.post[0]; o.out=__n.out; o.inst=B.inst; o.after=__snap(); o.runOpen=Sys.thief.view(S,Sys.host).run; o.nb=C.nb; o.atkBack=B.hero.atk; return o;`);
    check('startThiefRun devolve true e entra na luta especial "thief" por run.secs s (a entrada já foi gasta no enter)', r.run.ok === true && r.used1 === 1 && r.ok === true && r.special === 'thief' && r.t0 === TH.secs && r.run.secs === TH.secs, JSON.stringify([r.run, r.used1, r.ok, r.special, r.t0]));
    check('cabeçalho: nome, relógio e saco', r.hud0 && r.hud0.name === 'Ladrão' && /^0:45 · Saco 100%$/.test(r.hud0.sub) && /^0:4\d · Saco \d+%$/.test(r.hud5.sub), JSON.stringify([r.hud0, r.hud5]));
    check('UM inimigo: o Ladrão de Brasas, imortal, que não ataca; fase do jogador não muda', r.en === 1 && r.thief === true && r.imm === true && r.noAtk === true && r.tag === TH.art.name && r.stage === snap0.stage, JSON.stringify([r.en, r.thief, r.imm, r.noAtk, r.tag, r.stage]));
    check('o ladrão nunca golpeia e o herói não perde vida', r.sw === 0 && r.hpMin >= 1 - 1e-9, JSON.stringify([r.sw, r.hpMin]));
    check('perseguição: o herói corre o tempo todo (B.running) e bate correndo', r.running === true && !r.stopped && r.act1 > 0, JSON.stringify([r.running, r.stopped, r.act1]));
    check('saco medido nos primeiros ' + TH.cfg.measure + ' s: vida = dano/s × ' + TH.cfg.bagFrac + ' × secs; a medição já conta', r.sized && r.dmg3 > 0 && Math.abs(r.max - r.dmg3 / r.tmeas * TH.cfg.bagFrac * TH.secs) < 1e-6 * r.max && r.f5 > 0 && r.f5 < 0.25, JSON.stringify([r.sized, r.max, r.dmg3, r.tmeas, r.f5]));
    check('a barra em cima do ladrão é o saco (desce com o dano) e ele não morre', r.barK < 1 && Math.abs(r.barK - (1 - r.f5) * 0.999) < 0.02 && !r.dead, JSON.stringify([r.barK, r.f5, r.dead]));
    check('o relógio desce e o saco só esvazia', r.t5 < r.t0 && r.down && r.mono, JSON.stringify([r.t5, r.down, r.mono]));
    check('fuga em ritmo fixo: fora do alcance entre 8% e 25% do tempo', r.outR / (r.inR + r.outR) > 0.08 && r.outR / (r.inR + r.outR) < 0.25, JSON.stringify([r.inR, r.outR]));
    check('TEMPO: termina sozinha com UMA chamada a PThief.finish; sem cancel', r.ended && r.n === 1 && r.can === 0 && r.inst == null, JSON.stringify([r.ended, r.n, r.can]));
    check('0 <= score < 1 e score = fração do saco que caiu', r.sc >= 0 && r.sc < 1 && r.sc > r.f5 && Math.abs(r.sc - r.last) < 1e-9, JSON.stringify([r.sc, r.last, r.f5]));
    check('a LUTA não credita nada: até a chamada do finish, estoque de Brasas, ouro, gemas, XP, abates e mochila iguais', JSON.stringify(Object.assign({}, r.pre, { wave: 0, farm: 0 })) === JSON.stringify(Object.assign({}, snap0, { wave: 0, farm: 0 })), JSON.stringify([r.pre, snap0]));
    check('quem credita é o Sys.thief.finish da tela: Brasas = round(lote × score), corrida fechada', r.out && r.out.ok === true && r.out.drop === Math.round(r.out.lote * r.sc) && r.post.stock - r.pre.stock === r.out.brasas && r.runOpen == null && r.nb === Math.round(r.run.lote * r.sc), JSON.stringify([r.out, r.pre.stock, r.post.stock, r.nb]));
    check('de volta: fase, onda, farm, abates, mochila, ouro, gemas e XP do jogador iguais', r.after.stage === snap0.stage && r.after.wave === snap0.wave && r.after.farm === snap0.farm && r.after.kills === snap0.kills && r.after.inv === snap0.inv && r.after.gold === snap0.gold && r.after.gems === snap0.gems && r.after.xp === snap0.xp, JSON.stringify([r.after, snap0])); }

  /* ritmo da fuga: função pura, igual em toda corrida */
  { const r = J(`const o={a:thiefOff(0),b:thiefOff(THIEF.intro+0.01),c:thiefOff(THIEF.fleeFirst-0.01),d:thiefOff(THIEF.fleeFirst+THIEF.fleeDur/2),e:thiefOff(THIEF.fleeFirst+THIEF.fleeDur+0.01),f:thiefOff(THIEF.fleeFirst+THIEF.fleeEvery+THIEF.fleeDur/2)}; let out=0; for(let t=0;t<45;t+=0.01) if(thiefOff(t)>0) out+=0.01; o.out=out; return o;`);
    check('thiefOff: chega em ' + TH.cfg.intro + ' s, foge aos ' + TH.cfg.fleeFirst + ' s e a cada ' + TH.cfg.fleeEvery + ' s por ' + TH.cfg.fleeDur + ' s (1 a 2 s)', r.a === 1 && r.b === 0 && r.c === 0 && r.d === 1 && r.e === 0 && r.f === 1 && TH.cfg.fleeDur >= 1 && TH.cfg.fleeDur <= 2 && r.out > 5 && r.out < 9, JSON.stringify(r)); }

  /* =================== b) SACO VAZIO antes do tempo =================== */
  { const r = J(`__n.fin=0; __n.sc=[]; __n.can=0; __n.pre=[]; __n.post=[]; const s0=__snap(); const run=__enter(); const ok=window.startThiefRun(run); const I=B.inst, C=I.chase; __go(5); const sized=C.max>0; B.hero.atk=1e15; const ended=__go(20);
      return {ok,sized,ended,n:__n.fin,sc:__n.sc[0],can:__n.can,left:I.t,out:__n.out,best:Sys.thief.view(S,Sys.host).best,after:__snap(),s0,atk:B.hero.atk<1e14,enDead:B.en.some(e=>e.thief)};`);
    check('SACO VAZIO: termina antes do tempo com UMA chamada a PThief.finish(1)', r.ok && r.sized && r.ended && r.n === 1 && r.sc === 1 && r.can === 0 && r.left > 20, JSON.stringify(r).slice(0, 300));
    check('score 1 = lote cheio e nível vencido (pelo módulo); herói recalculado e fase de volta', r.out && r.out.won === true && r.out.drop === r.out.lote && r.best >= 10 && r.atk && !r.enDead && r.after.stage === r.s0.stage && r.after.wave === r.s0.wave && r.after.kills === r.s0.kills && r.after.inv === r.s0.inv, JSON.stringify([r.out, r.best, r.after])); }

  /* golpe maior do que o colchão logo no começo (antes da medição): não trava nem estoura */
  { const r = J(`__n.fin=0; __n.sc=[]; const run=__enter(); const ok=window.startThiefRun(run); B.hero.atk=1e15; const ended=__go(50); return {ok,ended,n:__n.fin,sc:__n.sc[0],inst:B.inst};`);
    check('herói forte demais desde o começo: a corrida termina com UM finish e score entre 0 e 1', r.ok && r.ended && r.n === 1 && r.sc >= 0 && r.sc <= 1 && r.inst == null, JSON.stringify(r)); }

  /* =================== c) SAIR (dois toques) =================== */
  { const r = J(`__n.fin=0; __n.sc=[]; __n.can=0; const s0=__snap(); const run=__enter(); const ok=window.startThiefRun(run); __go(6); const I=B.inst; const a=ligThiefExit(); const mid=!!B.inst, can1=__n.can; __go(1); const b=ligThiefExit();
      const o={ok,a,mid,can1,b,inst:B.inst,fin:__n.fin,can:__n.can,again:ligThiefExit(),after:__snap(),s0,v:Sys.thief.view(S,Sys.host)};
      /* o aviso vence: passado o prazo, o toque seguinte volta a ser o 1º */
      const run2=__enter(); window.startThiefRun(run2); __go(2); o.a2=ligThiefExit(); __go(THIEF.askSec+0.5); o.a3=ligThiefExit(); o.still=!!B.inst; o.can2=__n.can; o.sure=ligThiefExit(true); o.can3=__n.can; o.fin3=__n.fin; o.inst3=B.inst; return o;`);
    check('1º toque em "Sair da perseguição" só avisa (a entrada não volta); a luta continua', r.ok && r.a === 'ask' && r.mid && r.can1 === 0, JSON.stringify([r.a, r.mid, r.can1]));
    check('2º toque: volta à fase, chama PThief.cancel UMA vez e NÃO chama finish', r.b === true && r.inst == null && r.can === 1 && r.fin === 0 && r.again === false, JSON.stringify([r.b, r.can, r.fin, r.again]));
    check('sair não devolve a entrada nem credita nada; corrida fechada; fase do jogador igual', r.v.used === 1 && r.v.run == null && r.after.stock === r.s0.stock && r.after.stage === r.s0.stage && r.after.wave === r.s0.wave && r.after.kills === r.s0.kills && r.after.inv === r.s0.inv && r.after.gold === r.s0.gold, JSON.stringify([r.v, r.after, r.s0]));
    check('o aviso vence em ' + TH.cfg.askSec + ' s (o toque seguinte avisa de novo); saída direta (console) cancela uma vez', r.a2 === 'ask' && r.a3 === 'ask' && r.still && r.can2 === 1 && r.sure === true && r.can3 === 2 && r.fin3 === 0 && r.inst3 == null, JSON.stringify([r.a2, r.a3, r.still, r.can2, r.sure, r.can3, r.fin3])); }

  /* =================== d) depois da perseguição a batalha é a de sempre =================== */
  { const r = J(`let ran=false, stood=false; for(let i=0;i<600;i++){ step(1/30); if(B.running) ran=true; else if(B.enemy) stood=true; } let draws=0, err=''; try{ for(let i=0;i<3;i++){ draw(); draws++; } }catch(e){ err=String(e&&e.message||e); }
      return {inst:B.inst,ran,stood,noAtk:B.en.some(e=>e.noAtk||e.thief),kills:S.kills,draws,err};`);
    check('fora da perseguição: sem B.inst, o herói para para lutar e os abates da fase voltam a contar', r.inst == null && r.stood && !r.noAtk && r.kills > snap0.kills, JSON.stringify(r)); }
  /* desenho durante a perseguição (véu, balanço, espelho): não pode estourar */
  { const r = J(`const run=__enter(); const ok=window.startThiefRun(run); let err='', k=0; try{ for(let i=0;i<60&&B.inst;i++){ __one(); draw(); k++; } thiefVeil(); }catch(e){ err=String(e&&e.stack||e).slice(0,300); } const e=B.en[0]; const o={ok,err,k,key:e&&e.key,bob:e&&e.bob,flee:e&&e.flee}; ligThiefExit(true); o.inst=B.inst; return o;`);
    check('o desenho da perseguição roda sem erro (véu do fim de tarde, ladrão)', r.ok && !r.err && r.k === 60 && r.inst == null, JSON.stringify(r));
    console.log('  (arte do ladrão no sandbox: ' + JSON.stringify([r.key, r.bob, r.flee]) + ')'); }

  /* =================== e) corrida natural (herói sem mexer), só para o relatório =================== */
  { const r = J(`__n.fin=0; __n.sc=[]; const run=__enter(); window.startThiefRun(run); const I=B.inst; __go(60); return {n:__n.fin,sc:__n.sc[0],left:I.t};`);
    check('corrida natural: UM finish, score entre 0 e 1', r.n === 1 && r.sc >= 0 && r.sc <= 1, JSON.stringify(r));
    console.log('  (corrida natural do herói do teste: score ' + (+r.sc).toFixed(3) + ', sobraram ' + (+r.left).toFixed(1) + ' s)'); }
  check('sem console.error do jogo', G.consoleErrs.length === 0, G.consoleErrs.slice(0, 4).join(' | '));

  /* =================== f) ARTE do ladrão (sandbox de desenho: as imagens carregam de verdade) =================== */
  { const G2 = boot({ realFetch: true, runBoot: true, draw: true, search: '?debug=1&fresh=1&skip=1' }); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const J2 = code => JSON.parse(G2.ev('JSON.stringify((function(){' + code + '})())'));
    G2.ev(`(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; S.stage=4; S.best=7; S.wave=2; startBattle(); Sys.thief.DATA.on=true; Sys.bonfire.DATA.on=true;
      window.__fin=[]; PThief.finish=function(sc){ __fin.push(sc); return {ok:true}; }; PThief.cancel=function(){ return true; };
      window.__k=function(k){ let err=''; try{ for(let i=0;i<k&&B.inst;i++){ step(1/30); if(B.inst) instStep(1/30); draw(); } }catch(e){ err=String(e&&e.stack||e).slice(0,300); } return err; }; return 1; })()`);
    const a = J2(`const ok=window.startThiefRun({lv:1,lote:5,secs:45}); const err=__k(20); const e=B.en[0]; return {ok,err,key:e&&e.key,flee:e&&e.flee,bob:!!(e&&e.bob)};`);
    for (let i = 0; i < 10; i++) { G2.flush(); await new Promise(r => setTimeout(r, 10)); }
    const b = J2(`const err=__k(240); const e=B.en[0], C=B.inst.chase; const o={err,key:e.key,spr:e.spr,flee:e.flee,bob:e.bob,tag:e.tag,noAtk:e.noAtk,imm:e.immortal,frac:C.frac,sized:C.max>0,dh:e.dh>0}; ligThiefExit(true); o.inst=B.inst; return o;`);
    check('antes de a imagem chegar: reserva = inimigo comum da era, espelhado (corre de costas para o herói)', a.ok && !a.err && /^era\d+_e0$/.test(a.key) && a.flee === true && a.bob === false, JSON.stringify(a));
    check('com a imagem carregada: o ladrão usa ' + TH.art.still + ' (olha para a direita, sem espelho, balanço por código) e continua levando dano', !b.err && b.key === TH.art.key && b.spr === TH.art.still && b.flee === false && b.bob === true && b.tag === TH.art.name && b.noAtk && b.imm && b.sized && b.frac > 0 && b.dh && b.inst == null, JSON.stringify(b));
    check('sem console.error do jogo (desenho)', G2.consoleErrs.length === 0, G2.consoleErrs.slice(0, 4).join(' | ')); }
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (ladrão de brasas)' : 'LADRÃO DE BRASAS OK (' + n + ' verificações): a perseguição entra, o saco esvazia com o dano, termina com UM finish (tempo ou saco vazio), sair cancela sem finish, fase do jogador intacta');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
