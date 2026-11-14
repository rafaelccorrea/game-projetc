'use strict';
/* LUTA ESPECIAL: PROVAÇÃO DO MESTRE (Sys.trial + js/p_trial.js) e ENSAIO DE CAMINHO (Sys.pathTry + js/p_path.js), rodando como instância
   (js/instfx.js: ligTrialBattle, ligPathBattle, ligSpecialEnd; regras lidas pelo js/battle.js e pelo js/petfx.js). Sem navegador: node test/e2e/luta_especial.js
   Sobe o jogo de verdade no sandbox e passa pelas TELAS (PTrial.start / PPath.tryStart), como o jogador:
   - Provação: termina nos três jeitos (vitória, derrota, tempo esgotado), cada um com UMA chamada ao Sys.trial.finish; relógio na faixa (PTrial.time);
     regras de cada marco (sem pet, 30 s, sem montaria, sem magias, metade da vida); sem drop, sem abate de fase, fase e onda do jogador de volta no fim;
     mestre = chefe da campanha pelo hpMulToday/dmgMulToday do módulo; fúria (spec.enemy.fury) aos atSec; "Desistir" (dois toques) chama só o Sys.trial.quit;
   - Ensaio: boneco imortal que bate a fração do módulo, herói não cai, bônus do caminho testado só nessa luta, soma o dano e os segundos de atordoado,
     termina no tempo com UMA chamada ao Sys.pathTry.finish; "Sair do ensaio" não anota nada.
   Só lê arquivos do jogo. Sai com código 1 se falhar. */
const boot = require('./sandbox');
let fail = 0, n = 0; const check = (name, ok, det) => { n++; if (!ok) { fail++; console.log('  FALHA ' + name + (det ? ' · ' + det : '')); } };
(async () => {
  /* o JOGO liga a Provação e o Ensaio no arranque (SYS_LIVE, js/farm.js); "?debug=1&sem=trial,pathTry" sobe sem eles, para provar que desligados nada começa */
  { const G0 = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1' }); for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    check('sem parâmetro a Provação e o Ensaio nascem LIGADOS (SYS_LIVE do jogo)', G0.ev('Sys.trial.DATA.on===true&&Sys.pathTry.DATA.on===true')); }
  const G = boot({ realFetch: true, runBoot: true, search: '?debug=1&fresh=1&skip=1&sem=trial,pathTry' }), { ev } = G; for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const J =code => JSON.parse(ev('JSON.stringify((function(){' + code + '})())'));
  ev(`(function(){ S.tut=99; S.welcome=true; B.paused=false; B.res=null; view='battle'; Math.random=()=>0.5; let sd=7; Sys.host.rng=()=>{ sd=(sd*1103515245+12345)%2147483648; return sd/2147483648; };
    const L=Sys.level.ensure(S); L.lvl=60; L.xp=0; S.stage=4; S.best=7; S.wave=2; S.farm=false; startBattle();
    window.__n={tfin:0,tres:[],time:[],pfin:0,pres:[],pcan:0};
    const tf=Sys.trial.finish; Sys.trial.finish=function(a,b,r){ __n.tfin++; __n.tres.push({won:!!r.won,sec:r.sec}); return tf.apply(this,arguments); };
    const pf=Sys.pathTry.finish; Sys.pathTry.finish=function(a,b,r){ __n.pfin++; __n.pres.push(r); return pf.apply(this,arguments); };
    const pc=Sys.pathTry.cancel; Sys.pathTry.cancel=function(){ __n.pcan++; return pc.apply(this,arguments); };
    const tm=PTrial.time; PTrial.time=function(v){ __n.time.push(v); return tm.apply(this,arguments); };
    window.__go=function(sec){ const k=Math.round(sec*30); for(let i=0;i<k&&B.inst;i++){ step(1/30); if(typeof petStep==='function') petStep(1/30); if(B.inst) instStep(1/30); } return !B.inst; };
    window.__snap=()=>({stage:S.stage,wave:S.wave,farm:!!S.farm,kills:S.kills,inv:S.inv.length});
    if(typeof ligBridges==='function') ligBridges(); return 1; })()`);
  check('pontes ligadas: PTrial.battle e PPath.battle são funções', ev("typeof PTrial.battle==='function'&&typeof PPath.battle==='function'"));
  check('chaves DESLIGADAS com &sem=trial,pathTry: Lutar e Testar não começam nada', ev("Sys.trial.DATA.on===false&&Sys.pathTry.DATA.on===false") && ev('PTrial.start(10)') === false && ev("PPath.tryStart('blade')") === false && ev('B.inst==null'));

  /* =================== PROVAÇÃO =================== */
  ev('Sys.trial.setOn(true); 1');
  const snap0 = J('return __snap();');
  /* a) vitória (Nv 10: sem pet) */
  { const r = J(`const spec=Sys.trial.spec(10,Sys.host); const ok=PTrial.start(10); const I=B.inst, run=I&&I.run; for(let i=0;i<120&&B.inst&&!B.en.length;i++){ step(1/30); instStep(1/30); }
      const e=B.en[0], base=mkEnemy(S.stage,'boss'); const o={ok,spec,special:run&&run.special,time:I&&I.run.time,noPet:run&&run.noPet,skip:run&&run.skip,stage:S.stage,pet:petInfo(),hud:instHud(),boss:e&&e.boss,tag:e&&e.tag,hpK:e?e.maxhp/base.maxhp:0,dmgK:e?e.dmg/base.dmg:0,ehp:e?e.maxhp:0,edmg:e?e.dmg:0,fury0:e?e.fury||0:-1,hp:B.hero.hp,max:B.hero.maxhp};
      B.hero.atk=1e15; const ended=__go(20); o.ended=ended; o.n=__n.tfin; o.res=__n.tres[0]; o.passed=Sys.trial.passed(S,10); o.after=__snap(); o.inst=B.inst; o.times=__n.time.length; o.atk=B.hero.atk<1e14; return o;`);
    check('Provação Nv 10 começa pela tela (Sys.trial.start + PTrial.battle) como instância especial', r.ok === true && r.special === 'trial' && r.time === r.spec.sec && r.hud && r.hud.name === 'Provação', JSON.stringify(r).slice(0, 400));
    /* o multiplicador é o hpMulToday/dmgMulToday do módulo (chefe da campanha × fator do marco, convertido para o chefe que a instância monta); sem eles, o hpMul/dmgMul. Nunca os dois multiplicados */
    const en = r.spec.enemy, wantHp = en.hpMulToday > 0 ? en.hpMulToday : en.hpMul, wantDmg = en.dmgMulToday > 0 ? en.dmgMulToday : en.dmgMul;
    check('inimigo = chefe da fase do spec × hpMulToday/dmgMulToday do módulo (um só fator), com o nome do mestre', r.boss === true && r.stage === (en.stage || snap0.stage) && Math.abs(r.hpK - wantHp) < 1e-9 * wantHp && Math.abs(r.dmgK - wantDmg) < 1e-9 * wantDmg && /^Mestre /.test(r.tag || ''), JSON.stringify([r.boss, r.stage, r.hpK, r.dmgK, r.tag, en]));
    if (en.src === 'diff') check('dificuldade nova: a vida e o dano do mestre na luta são os absolutos do módulo (spec.enemy.hp / dmg); a fúria não começa ligada', en.hpMulToday > 0 && en.dmgMulToday > 0 && Math.abs(r.ehp - en.hp) < 1e-6 * en.hp && Math.abs(r.edmg - en.dmg) < 1e-6 * en.dmg && r.fury0 === 0, JSON.stringify([r.ehp, en.hp, r.edmg, en.dmg, r.fury0]));
    else console.log('  (dificuldade nova desligada no sandbox: o mestre usa o hpMul/dmgMul sobre o chefe de hoje)');
    check('regra "sem pet": pet fora da luta (não bate, não cura, não aparece) e fora dos atributos', r.spec.noPet === true && r.noPet === true && r.skip === 'pet' && r.pet === null, JSON.stringify([r.noPet, r.skip, r.pet]));
    check('VITÓRIA: termina quando o chefe cai, com UMA chamada ao finish {won:true}', r.ended && r.n === 1 && r.res.won === true && r.res.sec >= 0 && r.res.sec <= r.spec.sec && r.passed === true, JSON.stringify([r.ended, r.n, r.res, r.passed]));
    check('sem drop de fase, sem abate contado, fase/onda/farm do jogador de volta; herói recalculado', r.inst == null && r.after.stage === snap0.stage && r.after.wave === snap0.wave && r.after.farm === snap0.farm && r.after.kills === snap0.kills && r.after.inv === snap0.inv && r.atk, JSON.stringify([r.after, snap0]));
    check('relógio da faixa: PTrial.time chamado durante a luta', r.times >= 1, String(r.times)); }
  /* b) derrota (Nv 20: só 30 s) */
  { const r = J(`__n.tfin=0; __n.tres=[]; __n.time=[]; const spec=Sys.trial.spec(20,Sys.host); const ok=PTrial.start(20); const t0=B.inst&&B.inst.t; for(let i=0;i<150&&B.inst&&!(B.en[0]&&B.en[0].parked);i++){ step(1/30); instStep(1/30); }
      B.hero.hp=1e-6; B.hero.def=0; B.hero.atk=0; if(B.en[0]){ B.en[0].atkT=0; B.en[0].dmg=1e9; } const ended=__go(25); return {ok,rule:spec.rule.id,sec:spec.sec,t0,ended,n:__n.tfin,res:__n.tres[0],passed:Sys.trial.passed(S,20),after:__snap(),dead:B.deadT,hp:B.hero.hp>0};`);
    check('regra "só 30 s": o relógio da luta é o do módulo', r.rule === 't30' && r.t0 === r.sec && r.sec === 30, JSON.stringify(r));
    check('DERROTA: herói cai, UMA chamada ao finish {won:false}, provação continua aberta', r.ok && r.ended && r.n === 1 && r.res.won === false && r.passed === false, JSON.stringify(r));
    check('depois da derrota: de volta à fase, herói de pé com vida', r.after.stage === snap0.stage && r.after.wave === snap0.wave && r.after.kills === snap0.kills && r.dead === 0 && r.hp, JSON.stringify(r)); }
  /* c) tempo esgotado (Nv 20 de novo: tentar de novo é grátis) */
  { const r = J(`__n.tfin=0; __n.tres=[]; __n.time=[]; const ok=PTrial.start(20); for(let i=0;i<150&&B.inst&&!B.en.length;i++){ step(1/30); instStep(1/30); } B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15; const ended=__go(40);
      const tm=__n.time; let down=true; for(let i=1;i<tm.length;i++) if(tm[i]>tm[i-1]) down=false; return {ok,ended,n:__n.tfin,res:__n.tres[0],times:tm.length,first:tm[0],last:tm[tm.length-1],down,after:__snap(),passed:Sys.trial.passed(S,20)};`);
    check('TEMPO ESGOTADO: termina sozinha no fim do relógio, UMA chamada ao finish {won:false, sec = tempo}', r.ok && r.ended && r.n === 1 && r.res.won === false && Math.abs(r.res.sec - 30) < 0.11 && r.passed === false, JSON.stringify(r));
    check('relógio na tela: 1 chamada por segundo, descendo até 0', r.times >= 29 && r.times <= 33 && r.down && r.last <= 0.05, JSON.stringify([r.times, r.first, r.last, r.down]));
    check('depois do tempo: de volta à fase onde estava', r.after.stage === snap0.stage && r.after.wave === snap0.wave && r.after.kills === snap0.kills, JSON.stringify(r.after)); }
  /* d) regras dos outros marcos */
  { const r = J(`Sys.grimoire.setOn(true); Sys.grimoire.addPages(S,'minotaurSpear',1,'test'); Sys.grimoire.setPreset(S,'fases',['minotaurSpear']); Sys.grimoire.setPreset(S,'chefe',['minotaurSpear']); grimSync(); const g0=!!B.grim; const out={g0};
      PTrial.start(30); out.m={rule:Sys.trial.spec(30,Sys.host).rule.id,noMount:B.inst.run.noMount,skip:B.inst.run.skip,grim:!!B.grim,mode:B.grim&&B.grim.mode}; B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15; __go(70);
      PTrial.start(40); out.s={rule:Sys.trial.spec(40,Sys.host).rule.id,noSpells:B.inst.run.noSpells,grim:B.grim}; B.sysT=0; for(let i=0;i<90;i++){ step(1/30); instStep(1/30); } out.s.grim2=B.grim; B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15; __go(70);
      PTrial.start(50); out.h={rule:Sys.trial.spec(50,Sys.host).rule.id,frac:B.hero.hp/B.hero.maxhp,want:Sys.trial.spec(50,Sys.host).hpStart}; B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15; __go(70);
      out.n=__n.tfin; out.inst=B.inst; out.grimBack=(function(){ grimSync(); return !!B.grim; })(); Sys.grimoire.setOn(false); grimSync(); return out;`);
    check('Nv 30 "sem montaria": a pé (desenho e atributos); magias valem com o conjunto Chefe', r.m.rule === 'nomount' && r.m.noMount === true && r.m.skip === 'mount' && r.m.grim && r.m.mode === 'chefe', JSON.stringify(r.m));
    check('Nv 40 "sem magias": nenhuma magia na luta (mesmo com o Grimório ligado e equipado)', r.g0 && r.s.rule === 'nospell' && r.s.noSpells === true && r.s.grim === null && r.s.grim2 === null, JSON.stringify(r.s));
    check('Nv 50 "metade da vida": o herói entra com a fração do módulo', r.h.rule === 'half' && Math.abs(r.h.frac - r.h.want) < 1e-9 && r.h.want === 0.5, JSON.stringify(r.h));
    check('cada luta chamou o finish uma vez (3 lutas, 3 chamadas a mais) e a batalha voltou; magias voltam fora da provação', r.n === 4 && r.inst == null && r.grimBack, JSON.stringify([r.n, r.grimBack])); }
  /* e) FÚRIA do mestre (spec.enemy.fury do módulo): entra aos atSec segundos de luta, uma vez, com o dmgMult. Nv 30: luta de 60 s (ainda aberta) */
  { const r = J(`__n.tfin=0; __n.tres=[]; const spec=Sys.trial.spec(30,Sys.host), F=spec.enemy.fury||null; const ok=PTrial.start(30); const I=B.inst; for(let i=0;i<150&&B.inst&&!(B.en[0]&&B.en[0].parked);i++){ step(1/30); instStep(1/30); }
      B.hero.atk=0; B.hero.def=0; B.hero.maxhp=B.hero.hp=1e15; const o={ok,F,sec:spec.sec,at:-1,early:false,pre:0,post:0,ban:'',sub:'',n:0};
      for(let i=0;i<30*70&&B.inst;i++){ const h0=B.hero.hp; step(1/30); if(B.inst) instStep(1/30); const e=B.en[0], d=h0-B.hero.hp; if(!B.inst||!e) continue; const t=I.run.time-I.t;
        if(e.fury>1){ if(o.at<0){ o.at=t; o.n++; o.mult=e.fury; o.ban=B.banner&&B.banner.txt; o.sub=B.banner&&B.banner.sub; if(F&&t<F.atSec-1e-9) o.early=true; } else if(e.fury!==o.mult) o.n++; if(d>o.post) o.post=d; }
        else if(d>o.pre) o.pre=d; }
      o.fin=__n.tfin; o.inst=B.inst; return o;`);
    if (r.F) {
      check('FÚRIA: entra aos ' + r.F.atSec + ' s de luta (não antes), uma vez, com o dmgMult do módulo (x' + r.F.dmgMult + ') e o aviso na tela', r.ok && r.sec > r.F.atSec && !r.early && r.at >= r.F.atSec - 1e-9 && r.at < r.F.atSec + 0.1 && r.n === 1 && r.mult === r.F.dmgMult && /FÚRIA/.test(r.ban || '') && r.sub === 'Dano x' + r.F.dmgMult, JSON.stringify(r));
      check('FÚRIA: o golpe do mestre passa a tirar dmgMult vezes mais vida', r.pre > 0 && Math.abs(r.post / r.pre - r.F.dmgMult) < 0.02 * r.F.dmgMult, JSON.stringify([r.pre, r.post, r.post / r.pre]));
    } else { check('sem fúria no spec (dificuldade nova desligada): o mestre nunca entra em fúria', r.ok && r.at < 0, JSON.stringify(r)); console.log('  (spec.enemy.fury não veio: fúria não testada)'); }
    check('a luta com fúria termina no tempo com UM finish', r.fin === 1 && r.inst == null, JSON.stringify([r.fin, r.inst])); }
  /* f) DESISTIR (dois toques): volta à fase, UMA chamada ao Sys.trial.quit, nenhuma ao finish; tentativa desfeita; XP guardada, teto, vencidas e prêmio intactos */
  { const r = J(`__n.tfin=0; window.__q=0; const q0=Sys.trial.quit; Sys.trial.quit=function(){ __q++; return q0.apply(this,arguments); };
      const T=Sys.trial.ensure(S), bank0=T.bank; T.bank=123; const keep=()=>JSON.stringify([Sys.trial.ensure(S).bank,Sys.trial.ensure(S).passed,Sys.trial.cap(S,Sys.host),S.gold,S.gems,Sys.level.ensure(S),S.sys.forge||null,S.inv.length]);
      const s0=__snap(), k0=keep(), tries0=Sys.trial.ensure(S).tries['30']||0;
      const ok=PTrial.start(30); const triesMid=Sys.trial.ensure(S).tries['30']||0, run1=!!PTrial.running(); for(let i=0;i<60&&B.inst;i++){ step(1/30); instStep(1/30); } B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15;
      const a=ligTrialExit(); const mid=!!B.inst, q1=__q; __go(1); const b=ligTrialExit();
      const o={ok,a,mid,q1,b,inst:B.inst,q:__q,fin:__n.tfin,again:ligTrialExit(),cur:Sys.trial.ensure(S).cur,tries0,triesMid,tries:Sys.trial.ensure(S).tries['30']||0,same:keep()===k0,k0,k1:keep(),after:__snap(),s0,run1,run2:PTrial.running(),atk:B.hero.atk>0&&B.hero.maxhp<1e14};
      /* o aviso vence: passado o prazo, o toque seguinte volta a ser o 1º. E a tela começa outra luta normalmente depois de desistir */
      o.re=PTrial.start(30); B.hero.atk=0; B.hero.maxhp=B.hero.hp=1e15; __go(2); o.a2=ligTrialExit(); __go(THIEF.askSec+0.5); o.a3=ligTrialExit(); o.still=!!B.inst; o.q2=__q; o.sure=ligTrialExit(true); o.q3=__q; o.fin3=__n.tfin; o.inst3=B.inst; o.same3=keep()===k0; o.tries3=Sys.trial.ensure(S).tries['30']||0;
      Sys.trial.ensure(S).bank=bank0; Sys.trial.quit=q0; return o;`);
    check('1º toque em "Desistir" só avisa; a luta continua e nada é chamado', r.ok === true && r.run1 && r.a === 'ask' && r.mid && r.q1 === 0, JSON.stringify([r.ok, r.a, r.mid, r.q1]));
    check('2º toque: volta à fase, chama Sys.trial.quit UMA vez e NÃO chama finish', r.b === true && r.inst == null && r.q === 1 && r.fin === 0 && r.again === false && r.cur == null && r.run2 == null, JSON.stringify([r.b, r.inst, r.q, r.fin, r.again, r.cur, r.run2]));
    check('desistir desfaz a tentativa; XP guardada (cofre), teto, provações vencidas, ouro, gemas, XP, Forja e mochila intactos', r.triesMid === r.tries0 + 1 && r.tries === r.tries0 && r.same, JSON.stringify([r.tries0, r.triesMid, r.tries, r.k0, r.k1]));
    check('depois de desistir: fase/onda/abates do jogador de volta e herói recalculado', r.after.stage === r.s0.stage && r.after.wave === r.s0.wave && r.after.kills === r.s0.kills && r.after.inv === r.s0.inv && r.atk, JSON.stringify([r.after, r.s0, r.atk]));
    check('a tela começa outra luta depois de desistir; o aviso vence em 4 s; saída direta (console) chama quit uma vez, sem finish', r.re === true && r.a2 === 'ask' && r.a3 === 'ask' && r.still && r.q2 === 1 && r.sure === true && r.q3 === 2 && r.fin3 === 0 && r.inst3 == null && r.same3 && r.tries3 === r.tries0, JSON.stringify([r.re, r.a2, r.a3, r.still, r.q2, r.sure, r.q3, r.fin3, r.same3, r.tries3])); }
  ev('Sys.trial.setOn(false); 1');

  /* =================== ENSAIO DE CAMINHO =================== */
  ev('Sys.strikes.setOn(true); Sys.path.setOn(true); Sys.pathTry.setOn(true); refreshHero(); 1');
  const D = J('return {paths:Sys.path.DATA.paths,dummy:Sys.pathTry.DATA.dummy,sec:Sys.pathTry.DATA.sec};');
  const P = D.paths.find(p => p.id === 'arcane');
  { const r = J(`const base={critDmg:B.hero.critDmg,aspd:B.hero.aspd,stun:B.stk?B.stk.normal.stun:-1}; const s0=__snap(), gold0=S.gold, xp0=JSON.stringify(Sys.level.ensure(S));
      window.__sum=0; const h0=hitEnemy; hitEnemy=function(e){ const b=e&&e.hp; const r=h0.apply(this,arguments); if(e&&e.immortal) __sum+=b-e.hp; return r; };
      const ok=PPath.tryStart('arcane'); const I=B.inst, run=I&&I.run; for(let i=0;i<150&&B.inst&&!(B.en[0]&&B.en[0].parked);i++){ step(1/30); instStep(1/30); }
      const e=B.en[0]; const o={ok,base,special:run&&run.special,time:run&&run.time,hud:instHud().name,imm:e&&e.immortal,noAff:e&&e.noAff,tag:e&&e.tag,every:e&&e.atkEvery,dmgPct:e?e.dmg/B.hero.maxhp*100:0,raw:e&&e.raw,
        critDmg:B.hero.critDmg,stun:B.stk?B.stk.normal.stun:-1,active:!!Sys.pathTry.active()};
      B.hero.hp=2; const hpA=B.hero.hp; e.atkT=0; for(let i=0;i<60;i++){ step(1/30); instStep(1/30); } o.minOk=B.hero.hp>=run.heroMinHp&&B.deadT===0&&B.hero.hp<=hpA+B.hero.maxhp; o.minHp=run.heroMinHp;
      o.midDmg=I.dmg; o.bar=e.hp===e.maxhp; const ended=__go(70); hitEnemy=h0; o.ended=ended; o.n=__n.pfin; o.res=__n.pres[0]; o.sum=__sum; o.after=__snap(); o.s0=s0; o.gold=S.gold===gold0; o.xp=JSON.stringify(Sys.level.ensure(S))===xp0;
      o.post={critDmg:B.hero.critDmg,stun:B.stk?B.stk.normal.stun:-1,inst:B.inst,active:Sys.pathTry.active()}; o.rows=Sys.pathTry.compare(S).find(x=>x.id==='arcane'); return o;`);
    check('Ensaio começa pela tela (Sys.pathTry.start + PPath.battle) como instância especial de ' + D.sec + ' s', r.ok === true && r.special === 'pathTry' && r.time === D.sec && r.hud === 'Ensaio' && r.active, JSON.stringify(r).slice(0, 300));
    check('Boneco de Treino: imortal, neutro na afinidade, com nome, batendo ' + D.dummy.hitPctHeroHp + '% da vida a cada ' + D.dummy.hitEverySec + ' s (números do módulo)', r.imm === true && r.noAff === true && r.tag === D.dummy.name && r.every === D.dummy.hitEverySec && Math.abs(r.dmgPct - D.dummy.hitPctHeroHp) < 1e-6 && r.raw === true, JSON.stringify([r.imm, r.noAff, r.tag, r.every, r.dmgPct]));
    check('bônus do caminho testado SÓ nesta luta: atordoar +' + P.strikes.stun + ' no perfil, dano crítico +' + P.stat.critDmg, r.base.stun === 0 && r.stun === P.strikes.stun && Math.abs(r.critDmg - (r.base.critDmg + P.stat.critDmg)) < 1e-9, JSON.stringify([r.base, r.stun, r.critDmg]));
    check('o herói não cai (heroMinHp do módulo) e o boneco não perde vida na tela', r.minOk && r.minHp === D.dummy.heroMinHp && r.bar && r.midDmg > 0, JSON.stringify([r.minOk, r.minHp, r.bar, r.midDmg]));
    check('termina no tempo com UMA chamada ao finish', r.ended && r.n === 1 && Math.abs(r.res.sec - D.sec) < 0.11, JSON.stringify([r.ended, r.n, r.res]));
    check('soma o dano causado (= soma dos golpes do herói no boneco) e manda vida / vida máxima / segundos de atordoado', r.res && r.res.damage > 0 && Math.abs(r.res.damage - r.sum) <= Math.max(2, 1e-6 * r.sum) && r.res.life > 0 && r.res.lifeMax >= r.res.life && typeof r.res.stunSec === 'number' && r.res.stunSec >= 0, JSON.stringify([r.res, r.sum]));
    check('o módulo anotou o ensaio (vezes e melhor dano/s)', r.rows && r.rows.tried && r.rows.n === 1 && r.rows.bestDps === Math.floor(r.res.damage / D.sec), JSON.stringify(r.rows));
    check('nada ganho nem mudado: fase, onda, abates, mochila, ouro e XP iguais; bônus some depois', r.after.stage === r.s0.stage && r.after.wave === r.s0.wave && r.after.kills === r.s0.kills && r.after.inv === r.s0.inv && r.gold && r.xp && r.post.inst == null && r.post.stun === r.base.stun && Math.abs(r.post.critDmg - r.base.critDmg) < 1e-9 && r.post.active == null, JSON.stringify([r.after, r.s0, r.gold, r.xp, r.post])); }
  /* atordoado conta os segundos de verdade */
  { const r = J(`__n.pfin=0; __n.pres=[]; const ok=PPath.tryStart('arcane'); for(let i=0;i<150&&B.inst&&!(B.en[0]&&B.en[0].parked);i++){ step(1/30); instStep(1/30); } const I=B.inst, e=B.en[0]; const s0=I.stun; stunEnemy(e,1,'#fff'); e.atkT=0; const hp0=B.hero.hp; let sw=0; for(let i=0;i<27;i++){ step(1/30); instStep(1/30); if(e.sw>0) sw++; }
      return {ok,gain:I.stun-s0,sw};`);
    check('boneco atordoado não ataca e os segundos entram na soma do ensaio', r.ok && r.sw === 0 && Math.abs(r.gain - 0.9) < 0.08, JSON.stringify(r)); }
  /* sair do ensaio: nada anotado */
  { const r = J(`const s0=__snap(), can0=__n.pcan, row0=JSON.stringify(Sys.pathTry.compare(S)); const out=ligPathExit(); return {out,inst:B.inst,n:__n.pfin,can:__n.pcan-can0,active:Sys.pathTry.active(),same:JSON.stringify(Sys.pathTry.compare(S))===row0,after:__snap(),s0,again:ligPathExit()};`);
    check('"Sair do ensaio": volta à fase, chama o cancelar da tela/módulo e NÃO chama finish; nada anotado', r.out === true && r.inst == null && r.n === 0 && r.can >= 1 && r.active == null && r.same && r.after.stage === r.s0.stage && r.again === false, JSON.stringify(r)); }
  /* ensaio solto por fora (o jogador reabriu a tela): a luta devolve a fase sem anotar */
  { const r = J(`__n.pfin=0; const ok=PPath.tryStart('shot'); const combo=B.stk?B.stk.normal.combo:-1; for(let i=0;i<30;i++){ step(1/30); instStep(1/30); } Sys.pathTry.cancel(); for(let i=0;i<5&&B.inst;i++){ step(1/30); instStep(1/30); } return {ok,combo,inst:B.inst,n:__n.pfin,stage:S.stage};`);
    const Ps = D.paths.find(p => p.id === 'shot');
    check('outro caminho (Disparo): combo +' + Ps.strikes.combo + ' na luta; ensaio solto por fora devolve a fase sem finish', r.ok && r.combo === Ps.strikes.combo && r.inst == null && r.n === 0 && r.stage === snap0.stage, JSON.stringify(r)); }
  check('sem console.error do jogo', G.consoleErrs.length === 0, G.consoleErrs.slice(0, 4).join(' | '));
  console.log(fail ? fail + ' FALHA(S) de ' + n + ' (luta especial)' : 'LUTA ESPECIAL OK (' + n + ' verificações): Provação termina nos três jeitos com um finish; Ensaio soma dano e termina no tempo; fase do jogador intacta');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e && e.stack || e); process.exit(1); });
