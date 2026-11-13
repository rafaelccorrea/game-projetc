/* Eonbound — Sys.activity: ATIVIDADE DE HOJE 0/100 (tela 34 Missões, aprovada pelo PO). Cada MISSÃO DIÁRIA RESGATADA no Sys.pass vale pontos
   (as 6 diárias somam exatamente 100); marcos 20/40/60/80/100 abrem um baú fixo cada (sem sorteio). Zera junto com as diárias (mesmo dia do
   Sys.pass/Sys.clock). Os pontos NÃO são guardados aqui: saem das diárias resgatadas do Sys.pass (nada conta em dobro, nada se perde).
   Prêmios: ouro, pedras de treino, pedras de forja, ração e fragmentos da montaria — SEM diamante (a meta de ~10 mil 💎 em 180 dias já está cheia).
   CHAVE DESLIGADA (DATA.on=false). Estado: S.sys.activity {day, got:[marcos resgatados]}. Sem DOM. */
(function(root){
'use strict';
const DATA={
  on:false, max:100,
  // pontos por missão diária (d_inst e d_boss se substituem: as 6 ativas somam 100 nos dois casos)
  points:{d_kill:20, d_ult:15, d_chest:15, d_inst:20, d_boss:20, d_forge:15, d_summon:15},
  // baús: goldk = × ouro de um abate da fase (host.goldUnit); stones = treino (Sys.practice); forge = forja; food = ração (Sys.pet); mountFrags = montaria equipada
  milestones:[
    {at:20,  name:'Baú de bronze',   reward:{goldk:40}},
    {at:40,  name:'Baú de ferro',    reward:{goldk:40, stones:2}},
    {at:60,  name:'Baú de prata',    reward:{goldk:60, forge:2}},
    {at:80,  name:'Baú de ouro',     reward:{goldk:60, food:40, stones:2}},
    {at:100, name:'Baú de diamante', reward:{goldk:120, forge:3, food:60, mountFrags:1}},   // "diamante" é o nome do baú: não dá 💎
  ],
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const dayKey=host=>{ const P=SYS().pass, C=SYS().clock, t=nowOf(host); if(P&&P.dayKey) return P.dayKey(t); if(C&&C.dayKey) return C.dayKey(t); const d=new Date(t); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };

function ensure(S,host){ if(!S||typeof S!=='object') throw new Error('Sys.activity.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.activity; if(!o||typeof o!=='object') o=S.sys.activity={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; const at=DATA.milestones.map(m=>m.at); o.got=Array.isArray(o.got)?[...new Set(o.got.map(int0).filter(x=>at.includes(x)))]:[];
  if(host){ const dk=dayKey(host); if(o.day!==dk){ o.day=dk; o.got=[]; } }   // virou o dia: baús voltam a fechar (os pontos zeram no Sys.pass)
  return o; }
/* pontos de hoje = soma das diárias RESGATADAS (Sys.pass.list) */
function points(S,host){ const P=SYS().pass; if(!P||!P.list) return 0; let L; try{ L=P.list(S,host); }catch(e){ return 0; }
  return Math.min(DATA.max,(L&&L.daily||[]).reduce((t,m)=>t+(m.claimed?int0(DATA.points[m.id]):0),0)); }
/* para a tela 34: {on, points, max, milestones:[{at, name, reward, reached, claimed}], ready (quantos baús abrir)} */
function status(S,host){ if(!ON()) return {on:false}; const o=ensure(S,host), p=points(S,host);
  const ms=DATA.milestones.map(m=>({at:m.at,name:m.name,reward:Object.assign({},m.reward),reached:p>=m.at,claimed:o.got.includes(m.at)}));
  return {on:true,points:p,max:DATA.max,milestones:ms,ready:ms.filter(m=>m.reached&&!m.claimed).length,day:o.day}; }
/* entrega um prêmio pelos módulos donos; o que não tiver módulo carregado fica fora (a tela não promete o que não entrega) */
function give(S,host,rw){ const out={}, s=SYS(), unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
  if(rw.goldk&&host&&host.addGold){ out.gold=Math.round(rw.goldk*unit); host.addGold(out.gold); }
  if(rw.stones&&s.practice&&s.practice.addStones){ s.practice.addStones(S,rw.stones,host); out.stones=rw.stones; }
  if(rw.forge&&s.forge&&s.forge.addStones){ s.forge.addStones(S,rw.forge,host); out.forge=rw.forge; }
  if(rw.food&&s.pet&&s.pet.addFood){ s.pet.addFood(S,rw.food,host); out.food=rw.food; }
  if(rw.mountFrags&&s.mount&&s.mount.addFragments){ const M=s.mount, eq=M.ensure(S).eq; if(eq){ M.addFragments(S,eq,rw.mountFrags); out.mountFrags=rw.mountFrags; out.mount=eq; } }
  if(rw.gems&&host&&host.addGems){ host.addGems(rw.gems); out.gems=rw.gems; }
  return out; }
/* abre o baú do marco `at`. {ok, reason: off|id|points|done, got} */
const ND=(S,host,src,ctx)=>{ const N=root.Sys&&root.Sys.newDrops; try{ return N&&N.grant?N.grant(S,host,src,ctx):null; }catch(e){ return null; } };   // itens novos (Sys.newDrops, chave própria)
function claim(S,host,at){ if(!ON()) return {ok:false,reason:'off'}; const m=DATA.milestones.find(x=>x.at===int0(at)); if(!m) return {ok:false,reason:'id'};
  const o=ensure(S,host); if(o.got.includes(m.at)) return {ok:false,reason:'done'}; if(points(S,host)<m.at) return {ok:false,reason:'points',need:m.at};
  o.got.push(m.at); const got=give(S,host,m.reward);
  if(m.at>=DATA.max){ const Ac=SYS().achievements; if(Ac&&Ac.track) Ac.track(S,host,'activity100',1); got.newDrops=ND(S,host,'activity:full',{}); }   // conquista "Dedicado": dias com a atividade completa
  return {ok:true,at:m.at,got}; }
function claimAll(S,host){ const st=status(S,host); if(!st.on) return []; return st.milestones.filter(m=>m.reached&&!m.claimed).map(m=>claim(S,host,m.at)); }
/* conta para o PO: prêmio de um dia completo (100 pontos) */
function dayTotal(){ const t={}; for(const m of DATA.milestones) for(const k in m.reward) t[k]=(t[k]||0)+m.reward[k]; return t; }

const API={DATA,ensure,points,status,claim,claimAll,give,dayTotal};
root.Sys=root.Sys||{}; root.Sys.activity=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
