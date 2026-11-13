// MEDIÇÃO SIMULADA do chefe pela FC pedida (13/11, antes da APK v0.13.1; não mexe em js/sys).
// Compara o herói de referência ANTIGO (Sys.tower.statsFromFC: metade da FC em ATQ, metade em VIDA) com o NOVO (jogador grátis TÍPICO da fase,
// rascunho de Sys.stats.refFromFc). O chefe (onda inteira: 2 escoltas + chefe) é calibrado com a referência para vencer em 32 s e aguentar 40 s com 100%;
// fúria x4 aos 40 s. Quem luta é o jogador TÍPICO com r × a FC pedida (e variantes com mais ATQ ou mais VIDA, mesma FC).
// Uso: node tools/sim-chefe.js
'use strict';
const R=p=>require(process.cwd()+'/js/sys/'+p+'.js');
globalThis.Sys=globalThis.Sys||{}; const FG=R('forge'), ST=R('stats'), FC=R('fc'), TW=R('tower');
ST.setEra9(true);
const BAL=JSON.parse(require('fs').readFileSync(process.cwd()+'/docs/balance.json','utf8')).dificuldade;
const REC=BAL.pacoteFim.recFc;
/* herói de referência = Sys.stats.refFromFc (js/sys/stats.js): o jogador grátis típico da fase, escalado para a FC pedida */
function refFromFc(fc,stage){ return ST.refFromFc(fc,stage); }   /* a função do jogo (js/sys/stats.js) */
function oldRef(fc){ const s=TW.statsFromFC(fc,0); return {atk:s.atk,hp:s.hp,def:s.def||0,critRate:s.critRate??12,critDmg:s.critDmg??100,aspd:s.aspd||0}; }
/* DPS esperado (golpe a cada 0,8 s / (1+vel.), crítico, golpe forte x3 a cada 6 s) e vida efetiva (DEF reduz o dano levado, como o jogo) */
const dpsOf=s=>s.atk*(1+s.critRate/100*s.critDmg/100)*(1+s.aspd/100)/0.8+s.atk*3/6;
const ehpOf=(s,bossAtk)=>s.hp/(1-(ST.defReduction?ST.defReduction(s.def,bossAtk):0));
/* onda do chefe calibrada com a referência: vida total = 32 s × DPS; dano/s = vida efetiva / 40 s */
function bossFrom(ref){ const hp=32*dpsOf(ref); let dmg=ref.hp/40; for(let i=0;i<4;i++) dmg=ehpOf(ref,dmg*1.15)/40; return {hp,dps:dmg}; }
function fight(p,B,rnd){ const ex=1+0.07*((rnd()+rnd()+rnd()+rnd())/4-0.5)*3.46, d=p.atk*ex, iv=0.8/(1+p.aspd/100);
  let bh=B.hp, hh=ehpOf(p,B.dps*1.15), t=0, nh=iv, ns=6, nb=1.15;
  while(t<180){ t=Math.min(nh,ns,nb);
    if(t===nh){ nh+=iv; bh-=d*(rnd()*100<p.critRate?1+p.critDmg/100:1); }
    else if(t===ns){ ns+=6; bh-=d*3; }
    else { nb+=1.15; hh-=B.dps*1.15*(t>40?4:1); }
    if(bh<=0) return {w:1,t}; if(hh<=0) return {w:0,t}; }
  return {w:0,t}; }
let seed=7; const rnd=()=>{ seed=(seed*1103515245+12345)&0x7fffffff; return seed/0x7fffffff; };
function measure(stage,refKind){ const rec=REC[stage-1], ref=refKind==='old'?oldRef(rec):refFromFc(rec,stage), B=bossFrom(ref), out={};
  for(const r of [0.8,0.9,1.0,1.2]){ for(const [nm,tilt] of [['típico',1],['+ATQ',1.25],['+VIDA',0.8]]){
      const p0=refFromFc(rec*r,stage), p={...p0,atk:p0.atk*tilt}; const kf=(rec*r)/FC.fcOfStats(Object.assign({},p,{pet:{atk:0,heal:0}})); p.atk*=kf; p.hp*=kf; p.def*=kf;
      let w=0,tt=0; const N=2000; for(let i=0;i<N;i++){ const o=fight(p,B,rnd); if(o.w){ w++; tt+=o.t; } }
      out[nm+'@'+Math.round(r*100)]={win:w/N, t:w?tt/w:null}; } }
  return out; }
const pct=v=>Math.round(v*100)+'%';
for(const kind of ['old','new']){
  console.log('\n## '+(kind==='old'?'ANTES: chefe pela referência metade-metade (statsFromFC)':'DEPOIS: chefe pelo jogador grátis TÍPICO da fase (refFromFc)'));
  console.log('| Senhor (fase) | 80% | 90% | 100% | 120% | 100% com +ATQ | 100% com +VIDA |'); console.log('|---|---|---|---|---|---|---|');
  for(const st of [10,20,30,40,50,60,70,80,90]){ const m=measure(st,kind), c=k=>pct(m[k].win)+(m[k].t?' ('+Math.round(m[k].t)+' s)':'');
    console.log('| '+st+' | '+c('típico@80')+' | '+c('típico@90')+' | '+c('típico@100')+' | '+c('típico@120')+' | '+c('+ATQ@100')+' | '+c('+VIDA@100')+' |'); }
}
