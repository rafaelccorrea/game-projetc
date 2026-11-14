'use strict';
/* LADRÃO DE BRASAS: A PERSEGUIÇÃO (Sys.thief + js/p_thief.js; luta especial 'thief' do js/instfx.js: startThiefRun, thiefStep, ligThiefExit; ganchos no
   js/battle.js: B.inst.chase, e.noAtk, e.flee, e.bob). Sem navegador: node test/e2e/ladrao.js
   Sobe o jogo de verdade no sandbox e faz o que a TELA faz (Sys.thief.enter → window.startThiefRun(run)); o fim tem de chegar por UMA chamada a
   PThief.finish(score) e a saída por UMA chamada a PThief.cancel(). Prova: chave desligada não começa nada; o ladrão não morre nem ataca; o saco esvazia
   com o dano; o relógio desce; termina no tempo com score = fração esvaziada; saco vazio antes do tempo = score 1; sair (dois toques) cancela sem finish;
   fase, onda, abates, mochila, ouro e XP voltam iguais; a luta não credita nada (as Brasas entram só pelo Sys.thief.finish da tela).
   Campos do run do módulo/servidor (podem não vir): bagHp = vida do saco (sem ele, a medição); escapeAt/escapeEvery/escapeDur + seed = ritmo da fuga
   determinístico (sem eles, o fixo); endsAt limita o relógio; o finish nunca sai antes de 5 s de relógio (o servidor responde too_fast).
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
      o.max0=C.max; o.plan=C.plan; __go(4,each); o.sized=C.max>0; o.max=C.max; o.dmg3=C.dmg; o.tmeas=C.tm; o.out5=C.out; o.f5=C.frac; o.t5=I.t; o.hud5=instHud(); o.barK=e.hp/e.maxhp; o.dead=e.dead;
      B.hero.atk*=0.25;   /* herói mais fraco do que na medição: o saco NÃO esvazia até o fim do tempo */
      let last=0, mono=true, tl=I.t, down=true; const ended=__go(60,()=>{ each(); if(C.frac<last) mono=false; last=C.frac; if(I.t>tl) down=false; tl=I.t; });
      o.ended=ended; o.mono=mono; o.down=down; o.last=last; o.n=__n.fin; o.sc=__n.sc[0]; o.can=__n.can; o.pre=__n.pre[0]; o.post=__n.post[0]; o.out=__n.out; o.inst=B.inst; o.after=__snap(); o.runOpen=Sys.thief.view(S,Sys.host).run; o.nb=C.nb; o.atkBack=B.hero.atk; return o;`);
    check('startThiefRun devolve true e entra na luta especial "thief" por run.secs s (a entrada já foi gasta no enter)', r.run.ok === true && r.used1 === 1 && r.ok === true && r.special === 'thief' && r.t0 === TH.secs && r.run.secs === TH.secs, JSON.stringify([r.run, r.used1, r.ok, r.special, r.t0]));
    check('cabeçalho: nome, relógio e saco', r.hud0 && r.hud0.name === 'Ladrão' && /^0:45 · Saco 100%$/.test(r.hud0.sub) && /^0:4\d · Saco \d+%$/.test(r.hud5.sub), JSON.stringify([r.hud0, r.hud5]));
    check('UM inimigo: o Ladrão de Brasas, imortal, que não ataca; fase do jogador não muda', r.en === 1 && r.thief === true && r.imm === true && r.noAtk === true && r.tag === TH.art.name && r.stage === snap0.stage, JSON.stringify([r.en, r.thief, r.imm, r.noAtk, r.tag, r.stage]));
    check('o ladrão nunca golpeia e o herói não perde vida', r.sw === 0 && r.hpMin >= 1 - 1e-9, JSON.stringify([r.sw, r.hpMin]));
    check('perseguição: o herói corre o tempo todo (B.running) e bate correndo', r.running === true && !r.stopped && r.act1 > 0, JSON.stringify([r.running, r.stopped, r.act1]));
    /* caminho normal (14/11): o enter do módulo SEMPRE manda a vida do saco (run.bagHp) e a lista das fugas (run.escapes); a luta não mede nada */
    check('saco pelo módulo: vida = run.bagHp desde o 1º quadro, sem medição; score = dano no saco ÷ bagHp', r.run.bagHp > 0 && r.max0 === r.run.bagHp && r.sized && r.max === r.run.bagHp && r.dmg3 === 0 && r.tmeas === 0 && r.out5 > 0 && r.f5 > 0 && r.f5 < 1 && Math.abs(r.f5 - Math.min(1, r.out5 / r.run.bagHp)) < 1e-9, JSON.stringify([r.run.bagHp, r.max0, r.max, r.dmg3, r.tmeas, r.out5, r.f5]));
    check('fuga pelo módulo: o plano da luta é a lista run.escapes (segundos já com o desvio da seed) e cada fuga dura run.escapeDur', Array.isArray(r.run.escapes) && r.run.escapes.length >= 3 && r.plan && r.plan.list === true && JSON.stringify(r.plan.at) === JSON.stringify(r.run.escapes.slice().sort((a, b) => a - b)) && r.plan.dur === r.run.escapeDur, JSON.stringify([r.run.escapes, r.run.escapeDur, r.plan]));
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

  /* =================== FOLHA DA CORRIDA (assets/anim/enemy/thief/thief_run.png + .json), tocada pelo js/instfx.js =================== */
  { const META = JSON.parse(G.rd('assets/anim/enemy/thief/thief_run.json'));
    check('a folha da corrida da Arte está em disco: 8 quadros a 12 fps, célula 512x352, pés em 307', require('fs').existsSync(require('path').join(G.ROOT, 'assets/anim/enemy/thief/thief_run.png')) && META.frames === 8 && META.fps === 12 && META.w === 512 && META.h === 352 && META.feetY === 307 && META.padLeft === 96 && META.padTop === 64, JSON.stringify(META).slice(0, 200));
    const r = J(`const META=${JSON.stringify(META)}; const sl=sheetLoad, sp=SPR, c0=ctx, pr0=window.__probe, img={id:'thief_run'}, ST={c:{},w:150,h:236,pad:0,fx:0.25,fy:0.2,fw:0.3,fh:0.672,bot:0.872}; let ready=false, still=true, calls=[]; const o={};
      sheetLoad=function(b){ if(b===THIEF_ART.run){ o.asked=(o.asked||0)+1; return ready?{ok:true,img:img,meta:META}:{ok:false,img:null,meta:null}; } return sl.apply(this,arguments); };
      SPR=function(p){ if(p===THIEF_ART.still) return still?ST:null; return sp.apply(this,arguments); };
      const rec=function(im){ if(im===img){ calls.push(Array.prototype.slice.call(arguments,1)); return; } return c0.drawImage.apply(c0,arguments); }; const cx=new Proxy({},{get:function(t,k){ return k==='drawImage'?rec:c0[k]; },set:function(t,k,v){ c0[k]=v; return true; }}); ctx=cx;
      try{ const run=__enter(); o.ok=window.startThiefRun(run); o.askedAtStart=o.asked>=1; __go(1); const e=B.en[0]; o.bob=e.bob; o.wrapped=drawEnemyAt.thief===true; e.hc=200; e.dhT=200; e.x=e.slot; const gy=GY+LANEY[e.lane];
        /* 1) sem a folha: cai na parada (desenho de sempre), sem erro */
        ready=false; calls=[]; o.d0=thiefDraw(e,e.x); drawEnemyAt(e,e.x,0); o.c0=calls.length;
        /* 2) com a folha: o quadro certo pelo tempo */
        ready=true; o.fr=[]; for(const wt of [0,0.05,0.09,0.26,0.5,0.66,0.67,1,7.99,-3]){ calls=[]; e.wt=wt; e.hit=0; drawEnemyAt(e,e.x,0); o.fr.push([wt,calls.length,calls[0]?calls[0][0]/META.w:-1,calls[0]?calls[0][1]:-1,thiefFrame(META,wt)]); }
        calls=[]; e.wt=0.26; drawEnemyAt(e,e.x,0); const a=calls[0], s=200/(ST.fh*META.h); o.geo={a:a,s:s,x0:e.x-(ST.fx+ST.fw/2)*META.w*s,y0:gy-META.feetY*s,w:META.w*s,h:META.h*s,dw:e.dw,dh:e.dh,dwWant:200*ST.w/ST.h};
        /* 3) golpe: pisca (2º drawImage) e recua */
        calls=[]; e.hit=0.12; drawEnemyAt(e,e.x,0); o.hit={n:calls.length,dx:calls[0]?calls[0][4]-a[4]:null,same:calls.length===2&&JSON.stringify(calls[0])===JSON.stringify(calls[1])}; e.hit=0;
        /* 4) no desenho inteiro da batalha, quadro a quadro */
        const seen=[]; window.__probe=function(en,d){ if(en&&en.thief&&d&&d.sheet) seen.push(d.frame); }; let err=''; try{ for(let i=0;i<12;i++){ __one(); B.en[0].x=B.en[0].slot; draw(); } }catch(er){ err=String(er&&er.stack||er).slice(0,300); } window.__probe=pr0; ctx=cx; o.full={n:seen.length,err:err,frames:Array.from(new Set(seen)).length};
        /* 5) sem a parada carregada (reserva = inimigo comum): a folha não entra */
        const e2=B.en[0]; e2.bob=false; calls=[]; o.d5=thiefDraw(e2,e2.x); e2.bob=true; still=false; o.d6=thiefDraw(e2,e2.x); still=true;
        /* 6) morrendo ou outro inimigo: nunca passa pela folha */
        calls=[]; e2.thief=false; drawEnemyAt(e2,e2.x,0); o.other=calls.length; e2.thief=true; drawEnemyAt(e2,e2.x,0.5); o.dying=calls.length;
      }catch(er){ o.err=String(er&&er.stack||er).slice(0,400); } finally{ sheetLoad=sl; SPR=sp; ctx=c0; window.__probe=pr0; try{ ligThiefExit(true); }catch(e){} } o.inst=B.inst; return o;`);
    check('a perseguição pede a folha da corrida ao começar e o desenho do ladrão passa pelo instfx', !r.err && r.ok && r.askedAtStart && r.bob === true && r.wrapped === true, JSON.stringify([r.err, r.ok, r.askedAtStart, r.bob, r.wrapped]));
    check('SEM a folha carregada: cai na imagem parada (desenho de sempre), sem erro e sem desenhar a folha', !r.err && r.d0 === false && r.c0 === 0, JSON.stringify([r.err, r.d0, r.c0]));
    check('COM a folha: um drawImage por quadro, no quadro certo pelo tempo (12 fps, dá a volta nos 8 quadros)', !r.err && r.fr && r.fr.every(f => f[1] === 1 && f[3] === 0 && f[2] === f[4]) && r.fr.map(f => f[2]).join() === '0,0,1,3,6,7,0,4,7,0', JSON.stringify(r.fr));
    { const g = r.geo || {}, a = g.a || [], near = (x, y) => Math.abs(x - y) < 1e-6;
      check('célula inteira do quadro (512x352), na escala e no centro da parada, com a linha dos pés (feetY) no chão; tamanho do ladrão igual ao da parada', a.length === 8 && a[2] === 512 && a[3] === 352 && near(a[4], g.x0) && near(a[5], g.y0) && near(a[6], g.w) && near(a[7], g.h) && near(g.dh, 200) && near(g.dw, g.dwWant), JSON.stringify(g)); }
    check('sem folha de dano: o golpe pisca (2º drawImage igual, só no golpe) e recua 3 px', r.hit && r.hit.n === 2 && r.hit.same && Math.abs(r.hit.dx - 3) < 1e-6, JSON.stringify(r.hit));
    check('no desenho da batalha: 12 quadros sem erro, a folha desenhada a cada quadro e o quadro anda', r.full && !r.full.err && r.full.n === 12 && r.full.frames >= 2, JSON.stringify(r.full));
    check('reserva do inimigo comum (a parada não carregou): a folha não entra; morrendo ou outro inimigo: nunca', r.d5 === false && r.d6 === false && r.other === 0 && r.dying === 0 && r.inst == null, JSON.stringify([r.d5, r.d6, r.other, r.dying])); }

  /* =================== e) corrida natural (herói sem mexer), só para o relatório =================== */
  { const r = J(`__n.fin=0; __n.sc=[]; const run=__enter(); window.startThiefRun(run); const I=B.inst; __go(60); return {n:__n.fin,sc:__n.sc[0],left:I.t};`);
    check('corrida natural: UM finish, score entre 0 e 1', r.n === 1 && r.sc >= 0 && r.sc <= 1, JSON.stringify(r));
    console.log('  (corrida natural do herói do teste: score ' + (+r.sc).toFixed(3) + ', sobraram ' + (+r.left).toFixed(1) + ' s)'); }
  /* =================== g) VIDA DO SACO pelo run (bagHp) ou pela medição (reserva) =================== */
  { const r = J(`const run=__enter(); const ok=window.startThiefRun(Object.assign({},run,{bagHp:1e12})); const I=B.inst, C=I.chase; const o={ok,max0:C.max,plan:C.plan,ends:I.run.endsAt}; __go(6); o.max6=C.max; o.tm=C.tm; o.out=C.out; o.frac=C.frac; o.dmg=C.dmg; ligThiefExit(true);
      const run2=__enter(); o.mod=run2.bagHp; window.startThiefRun(Object.assign({},run2,{bagHp:0,escapes:null})); const C2=B.inst.chase; o.rplan=C2.plan; o.r0=C2.max; __go(1.5); o.r1=C2.max; __go(3.5); o.r5=C2.max; o.rtm=C2.tm; o.rdmg=C2.dmg; ligThiefExit(true); o.inst=B.inst; return o;`);
    check('run.bagHp: a vida do saco é a do run desde o começo, sem medição; score = dano ÷ bagHp', r.ok && r.max0 === 1e12 && r.max6 === 1e12 && r.tm === 0 && r.dmg === 0 && r.out > 0 && Math.abs(r.frac - r.out / 1e12) < 1e-15 && r.plan && r.plan.list === true && r.ends === 0, JSON.stringify(r));
    check('RESERVA (run com bagHp 0 e sem a lista escapes; o módulo hoje sempre manda os dois): medição dos primeiros ' + TH.cfg.measure + ' s e fuga pela conta escapeAt/escapeEvery + seed', r.mod > 0 && r.rplan && !r.rplan.list && r.rplan.at.length >= 3 && r.r0 === 0 && r.r1 === 0 && r.r5 > 0 && Math.abs(r.r5 - r.rdmg / r.rtm * TH.cfg.bagFrac * TH.secs) < 1e-6 * r.r5 && r.inst == null, JSON.stringify([r.r0, r.r1, r.r5, r.rtm, r.rdmg])); }

  /* =================== h) RITMO DA FUGA pelo run (escapeAt / escapeEvery / escapeDur + seed) =================== */
  { const r = J(`const f={escapeAt:6,escapeEvery:7,escapeDur:1.2}, mk=sd=>thiefPlan(sd===undefined?f:Object.assign({seed:sd},f),45);
      const o={A:mk(123),A2:mk(123),Bp:mk(124),N:mk(),Ss:mk('abc-1'),Ss2:mk('abc-1'),St:mk('abc-2'),none:thiefPlan({seed:5},45),inv:thiefPlan({escapeAt:6,escapeEvery:0,escapeDur:1,seed:5},45)};
      const run=__enter(); o.ok=window.startThiefRun(Object.assign({},run,f,{seed:123,bagHp:1e12,escapes:null})); const I=B.inst, C=I.chase, P=C.plan; o.P=P; let bad=0, was=false; const starts=[];
      __go(40,()=>{ const e=B.en[0], k=thiefOff(C.tt,P); if(Math.abs(e.x-(e.slot+(LW+44-e.slot)*k))>1e-6) bad++; const out=k>0&&C.tt>THIEF.intro; if(out&&!was) starts.push(C.tt); was=out; });
      o.bad=bad; o.starts=starts; ligThiefExit(true);
      /* LISTA run.escapes (prioridade): o ladrão foge exatamente nesses segundos, mesmo com escapeAt/escapeEvery/seed dizendo outra coisa */
      const L=[5.5,12.25,20,31.4]; o.L=L; o.pure={ord:thiefPlan({escapes:[9,3,'x',-1,20.5],escapeDur:1},45),none:thiefPlan({escapes:[],escapeAt:6,escapeEvery:7,escapeDur:1.2,seed:1},45),noDur:thiefPlan({escapes:[4]},45),
        mod:thiefPlan({escapes:Sys.thief.escapesOf(77,45),escapeDur:Sys.thief.DATA.escape.dur},45),modL:Sys.thief.escapesOf(77,45),fleeDur:THIEF.fleeDur};
      const run3=__enter(); o.ok3=window.startThiefRun(Object.assign({},run3,f,{seed:123,bagHp:1e12,escapes:L})); const C3=B.inst.chase, P3=C3.plan; o.P3=P3; let bad3=0, was3=false; const st3=[], en3=[];
      __go(40,()=>{ const e=B.en[0], k=thiefOff(C3.tt,P3); if(Math.abs(e.x-(e.slot+(LW+44-e.slot)*k))>1e-6) bad3++; const out=k>0&&C3.tt>THIEF.intro; if(out&&!was3) st3.push(C3.tt); if(!out&&was3) en3.push(C3.tt); was3=out; });
      o.bad3=bad3; o.st3=st3; o.en3=en3; ligThiefExit(true);
      const run4=__enter(); o.ok4=window.startThiefRun(Object.assign({},run4,{bagHp:1e12,escapes:[]})); const C4=B.inst.chase; let out4=0; __go(30,()=>{ if(thiefOff(C4.tt,C4.plan)>0&&C4.tt>THIEF.intro) out4++; }); o.out4=out4; ligThiefExit(true); return o;`);
    const base = i => 6 + 7 * i, eq = (a, b) => JSON.stringify(a) === JSON.stringify(b), J5 = TH.cfg.jitter;
    check('com seed o ritmo é determinístico: o mesmo seed dá sempre as mesmas fugas (número ou texto)', r.A && r.A.at.length >= 6 && eq(r.A, r.A2) && eq(r.Ss, r.Ss2) && r.A.dur === 1.2, JSON.stringify([r.A, r.A2]));
    check('outro seed muda o ritmo; cada fuga fica a ±' + J5 + ' s do passo do run; sem seed, o passo exato', !eq(r.A, r.Bp) && !eq(r.Ss, r.St) && r.A.at.every((t, i) => Math.abs(t - base(i)) <= J5 + 1e-9) && r.Bp.at.every((t, i) => Math.abs(t - base(i)) <= J5 + 1e-9) && r.A.at.some((t, i) => Math.abs(t - base(i)) > 0.01) && r.N.at.every((t, i) => t === base(i)), JSON.stringify([r.A.at, r.Bp.at, r.N.at]));
    check('sem os campos do ritmo (ou com valor inválido): null = o ritmo fixo de sempre', r.none === null && r.inv === null, JSON.stringify([r.none, r.inv]));
    { const want = r.A.at.filter(t => t < 40 - 0.1);
      check('RESERVA na corrida (sem a lista escapes): o ladrão foge nos segundos da conta escapeAt/escapeEvery + seed (não nos do ritmo fixo)', r.ok && eq(r.P, r.A) && r.bad === 0 && r.starts.length === want.length && r.starts.every((t, i) => t >= want[i] && t - want[i] < 0.07), JSON.stringify([r.bad, r.starts, want])); }
    check('thiefPlan com run.escapes: usa a lista (em ordem, só números válidos), dura run.escapeDur (sem ele, a duração fixa); lista vazia = nenhuma fuga', eq(r.pure.ord, { at: [3, 9, 20.5], dur: 1, list: true }) && eq(r.pure.none, { at: [], dur: 1.2, list: true }) && eq(r.pure.noDur, { at: [4], dur: r.pure.fleeDur, list: true }) && eq(r.pure.mod.at, r.pure.modL) && r.pure.modL.length >= 3, JSON.stringify(r.pure));
    check('com run.escapes o ladrão foge EXATAMENTE nesses segundos (a lista ganha de escapeAt/escapeEvery/seed) e cada fuga dura escapeDur', r.ok3 && eq(r.P3, { at: r.L, dur: 1.2, list: true }) && r.bad3 === 0 && r.st3.length === r.L.length && r.st3.every((t, i) => t >= r.L[i] && t - r.L[i] < 0.07) && r.en3.length === r.L.length && r.en3.every((t, i) => Math.abs(t - (r.L[i] + 1.2)) < 0.07), JSON.stringify([r.bad3, r.st3, r.en3, r.L, r.P3]));
    check('run.escapes vazia: o ladrão não foge nenhuma vez', r.ok4 && r.out4 === 0, JSON.stringify([r.ok4, r.out4])); }

  /* =================== i) NUNCA termina antes de 5 s (o servidor responde too_fast) =================== */
  { const r = J(`__n.fin=0; __n.sc=[]; __n.can=0; const run=__enter(); const ok=window.startThiefRun(Object.assign({},run,{bagHp:1})); const I=B.inst, C=I.chase; const o={ok,tHold:-1,moved:0,hud:'',ban:'',fin3:-1,last:0};
      __go(20,()=>{ const e=B.en[0]; if(C.hold){ if(o.tHold<0){ o.tHold=C.tt; o.hud=instHud().sub; o.ban=B.banner&&B.banner.txt; o.scHold=thiefScore(I); } if(e&&Math.abs(e.x-e.slot)>1e-6) o.moved++; } if(C.tt<=3) o.fin3=__n.fin; o.last=C.tt; });
      o.n=__n.fin; o.sc=__n.sc[0]; o.can=__n.can; o.inst=B.inst; o.out=__n.out;
      __n.fin=0; __n.sc=[]; const run2=__enter(); const sp0=B.speed; B.speed=2; window.startThiefRun(Object.assign({},run2,{bagHp:1})); const C2=B.inst.chase; let last2=0; __go(20,()=>{ last2=C2.tt; }); B.speed=sp0; o.last2=last2; o.n2=__n.fin; o.sc2=__n.sc[0]; return o;`);
    check('saco vazio com 1 golpe (antes de ' + TH.cfg.minEnd + ' s): o fim é SEGURADO; o ladrão para ao alcance com o saco em 0% e o score já é 1', r.ok && r.tHold > 0 && r.tHold < 3 && r.fin3 === 0 && r.moved === 0 && r.scHold === 1 && / · Saco 0%$/.test(r.hud) && r.ban === 'Saco vazio!', JSON.stringify(r));
    check('o finish sai aos ' + TH.cfg.minEnd + ' s de corrida, UMA vez, com score 1 (lote cheio pelo módulo)', r.n === 1 && r.sc === 1 && r.can === 0 && r.inst == null && r.last > TH.cfg.minEnd - 0.1 && r.last < TH.cfg.minEnd + 0.05 && r.out && r.out.won === true, JSON.stringify([r.n, r.sc, r.last, r.out]));
    check('os ' + TH.cfg.minEnd + ' s são de RELÓGIO: em x2 a luta espera ' + 2 * TH.cfg.minEnd + ' s de jogo', r.n2 === 1 && r.sc2 === 1 && r.last2 > 2 * TH.cfg.minEnd - 0.1 && r.last2 < 2 * TH.cfg.minEnd + 0.05, JSON.stringify([r.n2, r.sc2, r.last2])); }

  /* =================== j) endsAt (relógio do servidor) limita o relógio da tela =================== */
  { const r = J(`const N0=Sys.net, sn0=N0&&N0.serverNow; if(!Sys.net) Sys.net={}; window.__clk=1700000000000; Sys.net.serverNow=()=>__clk; const tick=()=>{ __clk+=1000/30; };
      __n.fin=0; __n.sc=[]; let run=__enter(); const ok=window.startThiefRun(Object.assign({},run,{bagHp:1e12,endsAt:__clk+20000})); let I=B.inst; const C=I.chase; const o={ok,t0:I.t,ends:I.run.endsAt===__clk+20000}; __go(1,tick); o.t1=I.t; o.hud1=instHud().sub;
      let last=0; o.ended=__go(30,()=>{ tick(); last=C.tt; }); o.last=last; o.n=__n.fin; o.sc=__n.sc[0];
      run=__enter(); window.startThiefRun(Object.assign({},run,{bagHp:1e12,endsAt:__clk+90000})); I=B.inst; __go(1,tick); o.far=I.t; ligThiefExit(true);
      __n.fin=0; run=__enter(); window.startThiefRun(Object.assign({},run,{bagHp:1e12,endsAt:__clk+2000})); I=B.inst; const C3=I.chase; __go(3,tick); o.t3=I.t; o.fin3=__n.fin; o.alive3=!!B.inst; o.hud3=B.inst?instHud().sub:'';
      let l3=0; o.e3=__go(10,()=>{ tick(); l3=C3.tt; }); o.l3=l3; o.n3=__n.fin;
      if(sn0) Sys.net.serverNow=sn0; else if(N0) delete Sys.net.serverNow; else delete Sys.net; return o;`);
    check('endsAt a 20 s: o relógio da tela cai para min(secs, endsAt − agora) e a corrida termina aí, com UM finish', r.ok && r.ends && r.t0 === TH.secs && r.t1 > 18.5 && r.t1 < 19.1 && /^0:(19|20) /.test(r.hud1) && r.ended && r.last > 19.7 && r.last < 20.1 && r.n === 1 && r.sc < 1, JSON.stringify(r));
    check('endsAt depois do secs: vale o secs (o relógio não cresce)', r.far > TH.secs - 1.1 && r.far < TH.secs - 0.9, String(r.far));
    check('endsAt antes de ' + TH.cfg.minEnd + ' s: o relógio zera, mas o finish só sai aos ' + TH.cfg.minEnd + ' s (uma vez)', r.t3 === 0 && r.fin3 === 0 && r.alive3 && /^0:00 /.test(r.hud3) && r.e3 && r.l3 > TH.cfg.minEnd - 0.1 && r.l3 < TH.cfg.minEnd + 0.05 && r.n3 === 1, JSON.stringify([r.t3, r.fin3, r.alive3, r.hud3, r.e3, r.l3, r.n3])); }
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
