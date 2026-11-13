// MEDIÇÃO SIMULADA do chefe pela FC pedida (13/11, antes da APK v0.13.1; não mexe em js/sys).
// Compara o herói de referência ANTIGO (Sys.tower.statsFromFC: metade da FC em ATQ, metade em VIDA) com o NOVO (jogador grátis TÍPICO da fase,
// rascunho de Sys.stats.refFromFc). O chefe (onda inteira: 2 escoltas + chefe) é calibrado com a referência para vencer em 32 s e aguentar 40 s com 100%;
// fúria x4 aos 40 s. Quem luta é o jogador TÍPICO com r × a FC pedida (e variantes com mais ATQ ou mais VIDA, mesma FC).
// Uso: node tools/sim-chefe.js
'use strict';
const R=p=>require(process.cwd()+'/js/sys/'+p+'.js');
const FG=R('forge'), ST=R('stats'), FC=R('fc'), TW=R('tower');
ST.setEra9(true);
const BAL=JSON.parse(require('fs').readFileSync(process.cwd()+'/docs/balance.json','utf8')).dificuldade;
const REC=BAL.pacoteFim.recFc;
const LV=[8,10,11,12,12,13,13,14,14,15,15,15,16,16,17,17,18,18,18,20,20,21,22,23,24,25,25,26,27,31,31,31,32,33,35,36,37,39,40,44,44,46,49,51,53,56,58,60,63,68,68,71,74,75,77,79,80,81,82,83,85,86,87,88,89,90,91,92,93,95,95,96,97,98,99,100,101,102,103,104,105,106,107,108,110,110,111,112,112,113];
const capR=(L,e)=>L>=105&&e>=7?5:L>=85&&e>=5?4:L>=70&&e>=4?3:L>=25?2:L>=10?1:0, forgeAt=e=>Math.min(15,Math.round(2+1.6*e));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* rascunho de Sys.stats.refFromFc(fc, stage): atributos do jogador grátis típico da fase, escalados para fcOfStats = fc */
function refFromFc(fc,stage){ const st=Math.max(1,stage|0), e=clamp(Math.floor((st-1)/10),0,8), L=LV[Math.min(st,90)-1], f=((st-1)%10)/9, r=capR(L,e);
  const forge=Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
  const S={sys:{level:{lvl:L,xp:0},forge:{lv:{}}}}; for(const s of ST.DATA.slots) S.sys.forge.lv[s]=forge;
  const eq={}; for(const s of ST.DATA.slots){ if(s==='wing'&&(L<50||r<2)) continue; eq[s]={slot:s,e,r:s==='weapon'&&r===3?2:r,lvl:L,subs:[],qp:4000,wing:'angel'}; }
  const h={equipped:()=>eq,eraMax:()=>e,level:()=>L,atk:()=>0,hp:()=>0,now:()=>0}, s0=FC.stats(S,h);
  const b={atk:+s0.atk||0,hp:+s0.hp||0,def:+s0.def||0,critRate:+(s0.critRate??s0.crit??12),critDmg:+(s0.critDmg??100),aspd:+(s0.aspd||0)};
  const k=fc/FC.fcOfStats(Object.assign({},b,{pet:{atk:0,heal:0}})); return {atk:b.atk*k,hp:b.hp*k,def:b.def*k,critRate:b.critRate,critDmg:b.critDmg,aspd:b.aspd}; }
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
