/* Eonbound — Sys.mapChest: BAÚS DE MARCO no Mapa das Eras (protótipo aprovado pelo dono: docs/proto/v2/MapaDasErasV4.html).
   Dois baús por era, nas fases 3 e 7 da era (curva de hoje, 10 fases por era). Com a curva de 100 fases (Sys.phases ligado) os mesmos marcos
   viram as fases 30 e 70 do Fácil da era (mesma proporção). O baú abre quando a fase é vencida e fica ESPERANDO A COLETA (brilho no mapa).
   Cada baú é coletado UMA vez por save (a chave do save é era+baú, não o número da fase: trocar de curva não reabre nem perde baú).
   Prêmio = PROPOSTA. Regra do dono para o ouro: "ouro deve ser difícil, sempre em quantidades pequenas" → todo ouro é medido em MINUTOS DE ABATE
   da fase atual: ouro = min × abates por minuto × host.goldUnit() (ouro de um abate). Os dois números ficam em DATA para auditoria.
   Nunca vendido: não existe compra nem gemas para abrir. Créditos: host.addGold, host.addGems, Sys.forge.addStones.
   DESLIGADO (DATA.on=false): list = [], claim recusa, o save não muda. Estado: S.sys.mapChest {v, got:{'era-baú':instante}}. Sem DOM. */
(function(root){
'use strict';

const DATA={
  on:false,
  eras:9,
  perEra:10,                 // fases por era na curva de hoje (com Sys.phases ligado vale Sys.phases.DATA.perEra = 100)
  killsPerMin:24,            // ritmo de abate da build (Sys.loot DATA.xp: ~24 abates/min; Sys.clock rested: 40 min × 24/min)
  // at = fase da era na curva de 10 (na curva de 100: at × 10, Fácil). goldMin = minutos de abate da fase atual. PROPOSTA.
  chests:[
    {slot:0, at:3, name:'Baú de bronze', goldMin:3, gems:0,  stones:1},
    {slot:1, at:7, name:'Baú de prata',  goldMin:3, gems:20, stones:2},
  ],
  purchasable:false,
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const PH=()=>{ const P=root.Sys&&root.Sys.phases; return P&&P.DATA&&P.DATA.on===true&&typeof P.bestOf==='function'?P:null; };
const perEra=()=>{ const P=PH(); return P?int0(P.DATA.perEra)||100:DATA.perEra; };
const scale=()=>Math.max(1,Math.round(perEra()/DATA.perEra));
const okEra=e=>Number.isInteger(e)&&e>=0&&e<DATA.eras;
const keyOf=(e,slot)=>e+'-'+slot;
const eraName=e=>{ const P=root.Sys&&root.Sys.phases; return P&&P.DATA&&P.DATA.eraName&&P.DATA.eraName[e]||('Era '+(e+1)); };
const unitOf=host=>{ try{ return host&&typeof host.goldUnit==='function'?Math.max(1,num(host.goldUnit(),1)):1; }catch(e){ return 1; } };
/* maior fase vencida na curva de hoje: host.bestStage() se existir, senão a fase atual − 1 (host.stage() = a fase a jogar) */
function clearedOld(host){ try{ if(host&&typeof host.bestStage==='function') return int0(host.bestStage());
  if(host&&typeof host.stage==='function') return Math.max(0,int0(host.stage())-1); }catch(e){} return 0; }

/* ---------------- save ---------------- */
function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.mapChest.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.mapChest; if(!o||typeof o!=='object') o=S.sys.mapChest={};
  o.v=1; const g=o.got&&typeof o.got==='object'?o.got:{}; o.got={};
  for(const k in g){ const m=/^(\d+)-(\d+)$/.exec(k); if(m&&okEra(+m[1])&&DATA.chests.some(c=>c.slot===+m[2])) o.got[k]=num(g[k],1)||1; }
  return o;
}
const got=(S,e,slot)=>{ const o=S&&S.sys&&S.sys.mapChest; return !!(o&&o.got&&o.got[keyOf(e,slot)]); };

/* ---------------- regras ---------------- */
/* fase do baú: n = fase dentro da era (1..perEra), stage = número corrido (era × perEra + n) */
const posOf=(e,c)=>{ const n=c.at*scale(); return {n,stage:e*perEra()+n}; };
/* a fase do baú foi vencida? Curva de 100: Sys.phases.bestOf(S, era, Fácil) ≥ n; curva de hoje: fase vencida ≥ stage */
function cleared(S,host,e,c){ const p=posOf(e,c), P=PH(); if(P){ try{ return int0(P.bestOf(S,e,0))>=p.n; }catch(e2){ return false; } } return clearedOld(host)>=p.stage; }
/* prêmio na fase atual: {gold, gems, stones, goldMin}. ouro = goldMin × killsPerMin × goldUnit */
function rewardOf(host,c){ return {gold:Math.round(num(c.goldMin,0)*DATA.killsPerMin*unitOf(host)),gems:int0(c.gems),stones:int0(c.stones),goldMin:num(c.goldMin,0)}; }
function stateOf(S,host,e,c){ return got(S,e,c.slot)?'collected':cleared(S,host,e,c)?'ready':'closed'; }
/* baús da era: [{era, slot, n, stage, name, state:'closed'|'ready'|'collected', reward:{gold,gems,stones,goldMin}, text}] */
function list(S,host,era){ if(!on()||!okEra(era)) return [];
  return DATA.chests.map(c=>{ const p=posOf(era,c), r=rewardOf(host,c), st=stateOf(S,host,era,c);
    const parts=[]; if(r.gold) parts.push(r.gold+' moedas'); if(r.gems) parts.push(r.gems+' diamantes'); if(r.stones) parts.push(r.stones+(r.stones>1?' pedras de forja':' pedra de forja'));
    return {era,slot:c.slot,n:p.n,stage:p.stage,name:c.name,state:st,reward:r,text:parts.join(' + ')}; }); }
/* acha o baú pelo número corrido da fase (na curva que vale) ou por {era, slot} */
function find(stage){ if(stage&&typeof stage==='object'){ const e=stage.era, c=DATA.chests.find(x=>x.slot===stage.slot); return okEra(e)&&c?{e,c}:null; }
  const s=int0(stage); if(!s) return null; const P=perEra(), e=Math.floor((s-1)/P), n=(s-1)%P+1; if(!okEra(e)) return null;
  const c=DATA.chests.find(x=>x.at*scale()===n); return c?{e,c}:null; }
/* coleta. → {ok, reason:'off'|'id'|'closed'|'collected', era, slot, gold, gems, stones} */
function claim(S,host,stage){ if(!on()) return {ok:false,reason:'off'}; const f=find(stage); if(!f) return {ok:false,reason:'id'};
  const {e,c}=f; if(got(S,e,c.slot)) return {ok:false,reason:'collected'}; if(!cleared(S,host,e,c)) return {ok:false,reason:'closed'};
  const r=rewardOf(host,c), o=ensure(S), out={ok:true,reason:'',era:e,slot:c.slot,name:c.name,gold:0,gems:0,stones:0};
  o.got[keyOf(e,c.slot)]=num(host&&host.now&&host.now(),Date.now())||1;   // marca ANTES de creditar: nunca dá duas vezes
  if(r.gold&&host&&typeof host.addGold==='function'){ host.addGold(r.gold); out.gold=r.gold; }
  if(r.gems&&host&&typeof host.addGems==='function'){ host.addGems(r.gems); out.gems=r.gems; }
  const F=root.Sys&&root.Sys.forge; if(r.stones&&F&&typeof F.addStones==='function') out.stones=int0(F.addStones(S,r.stones,host));
  return out; }
/* baús prontos para coletar (todas as eras; para o "!" no botão do mapa) */
function readyCount(S,host){ if(!on()) return 0; let k=0; for(let e=0;e<DATA.eras;e++) for(const c of DATA.chests) if(stateOf(S,host,e,c)==='ready') k++; return k; }
/* modelo da tela: {on, era, eraName, perEra, chests:list, ready, purchasable:false} */
function view(S,host,era){ const e=okEra(era)?era:0, L=list(S,host,e);
  return {on:on(),era:e,eraName:eraName(e),perEra:perEra(),chests:L,ready:L.filter(x=>x.state==='ready').length,readyAll:readyCount(S,host),purchasable:false}; }
/* não mexe no poder */
function bonus(){ return {atkPct:0,hpPct:0,critPct:0,defPct:0,goldPct:0,fc:0}; }

function setOn(v){ DATA.on=!!v; return DATA.on; }
const API={DATA,on,setOn,ensure,list,find,claim,readyCount,view,rewardOf,bonus};
root.Sys=root.Sys||{}; root.Sys.mapChest=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
