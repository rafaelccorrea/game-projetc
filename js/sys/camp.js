/* Eonbound — Sys.camp: ACAMPAMENTO DAS ERAS (docs/IDLE_PARECIDOS.md §3 item 13, P3, dono aprovou 13/11).
   3 tendas que enchem com o tempo (também com o jogo fechado) e são coletadas na volta:
     Tenda do Ouro (ouro) · Forja do Acampamento (Pedra de Forja, Sys.forge) · Pedreira (pedras de prática, Sys.practice).
   Cada tenda tem 1 Ajudante fixo (sempre trabalha) e até 2 vagas para PETS PARADOS (pets que o jogador tem e que NÃO são o principal).
   Pet na tenda só acelera a tenda: continua do jogador, não perde nível e não muda a batalha. O principal não pode trabalhar
   (se um pet da tenda virar principal, ele para de contar sozinho).
   Teto: cada tenda guarda no máximo as horas do offline (8 h; com o VIP de conveniência offlineH, as mesmas 10/12/14 h do resto do jogo).
   Melhoria da tenda (Nv 1 a 10): só OURO (moeda do jogo); nada vendido por dinheiro, nada sorteado.
   Relógio: voltar a hora do aparelho não rende nada (o marcador só anda para frente). DESLIGADO (DATA.on=false). Números = PROPOSTA (o QA calibra). */
(function(root){
'use strict';

const DATA={
  on:false,
  unlockLevel:20,                         // PROPOSTA: abre no Nv 20 (antes do caminho de luta)
  capHours:8,                             // igual ao offline grátis (Sys.vip conv offlineH = 8 h no grátis)
  maxLevel:10,
  levelRate:0.15,                         // cada nível da tenda: +15% da produção base (Nv 10 = ×2,35)
  petSlots:2,
  // pet trabalhando: +10% × (raridade+1) + 5% por estrela (Lendário 5★ = +75%)
  petRate:{perRarity:0.10, perStar:0.05},
  tents:[
    {id:'gold',     name:'Tenda do Ouro',         res:'gold',     perHour:3, unit:'goldUnit', capMin:5},   // 3 "abates" de ouro por hora (× host.goldUnit da fase atual); guarda no máximo capMin minutos de abate
    {id:'forge',    name:'Forja do Acampamento',  res:'forge',    perHour:1},                     // Pedra de Forja por hora
    {id:'practice', name:'Pedreira',              res:'practice', perHour:2},                     // pedras de prática por hora
  ],
  // custo da melhoria do Nv n para n+1 = ceil(base × growth^(n−1)) × host.goldUnit (ouro da fase atual)
  upgrade:{base:300, growth:1.6},
  killsPerMin:24,   // ritmo de abate da build (o mesmo do Sys.mapchest): capMin × 24 × goldUnit
  /* OURO (docs/ECONOMIA_OURO.md): Tenda do Ouro 40 → 3 abates/h e teto de 5 min de abate (120 × goldUnit) por coleta. Antes, Nv 10 com 2 pets
     Lendários 5★ dava ~137 min de abate por coleta (14 h VIP) e ~235 min por dia. O custo da melhoria NÃO baixou (as tendas de pedra usam a mesma conta). */
};
const TENT={}; DATA.tents.forEach(t=>{ TENT[t.id]=t; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>host&&typeof host.now==='function'?num(host.now(),Date.now()):Date.now();
const unitOf=host=>{ try{ return host&&typeof host.goldUnit==='function'?Math.max(0,num(host.goldUnit(),0)):0; }catch(e){ return 0; } };
const PET=()=>root.Sys&&root.Sys.pet;
const levelOf=(S,host)=>{ if(host&&typeof host.level==='function') return int0(host.level()); const L=root.Sys&&root.Sys.level; try{ return L&&L.level?int0(L.level(S)):0; }catch(e){ return 0; } };
/* teto em horas: o mesmo do offline (VIP de conveniência offlineH; grátis 8 h) */
function capHours(S){ const V=root.Sys&&root.Sys.vip; try{ const c=V&&V.conv?V.conv(S,'offlineH'):null; return Math.max(DATA.capHours,c?num(+c.value,DATA.capHours):DATA.capHours); }catch(e){ return DATA.capHours; } }

function ensure(S,host){
  if(!S||typeof S!=='object') throw new Error('Sys.camp.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.camp; if(!o||typeof o!=='object') o=S.sys.camp={};
  o.v=1; o.t=num(o.t,0); if(!(o.t>0)) o.t=nowOf(host);
  const T=o.tents&&typeof o.tents==='object'?o.tents:{}; o.tents={}; const used=new Set();
  for(const d of DATA.tents){ const x=T[d.id]&&typeof T[d.id]==='object'?T[d.id]:{};
    const pets=[]; for(const id of Array.isArray(x.pets)?x.pets:[]) if(typeof id==='string'&&!used.has(id)&&pets.length<DATA.petSlots){ pets.push(id); used.add(id); }
    const lv=clamp(int0(x.lv)||1,1,DATA.maxLevel), acc=Math.max(0,num(x.acc,0));
    for(const k of Object.keys(x)) delete x[k]; o.tents[d.id]=Object.assign(x,{lv,pets,acc}); }   // no lugar: quem segurou a tenda continua gravando no save
  return o;
}
const locked=(S,host)=>levelOf(S,host)<DATA.unlockLevel;

/* pets que podem trabalhar: os que o jogador tem, menos o principal */
function idlePets(S){ const P=PET(); if(!P||!S) return []; let o; try{ o=P.ensure(S); }catch(e){ return []; }
  return Object.keys(o.owned||{}).filter(id=>id!==o.eq&&P.DATA.pets.some(p=>p.id===id)); }
function petBoost(S,id){ const P=PET(); if(!P) return 0; const o=P.ensure(S), d=P.DATA.pets.find(p=>p.id===id), x=o.owned&&o.owned[id];
  if(!d||!x||id===o.eq) return 0; return DATA.petRate.perRarity*(int0(d.r)+1)+DATA.petRate.perStar*int0(x.stars); }
/* produção por hora de uma tenda (já com nível e pets) */
function rate(S,host,id){ const d=TENT[id]; if(!d) return 0; const o=ensure(S,host), t=o.tents[id];
  const m=(1+DATA.levelRate*(t.lv-1))*(1+t.pets.reduce((s,p)=>s+petBoost(S,p),0));
  return d.perHour*m*(d.unit==='goldUnit'?unitOf(host):1); }
const capOf=(S,host,id)=>{ const d=TENT[id], c=rate(S,host,id)*capHours(S); if(!d||!(d.capMin>0)||d.unit!=='goldUnit') return c;
  return Math.min(c,d.capMin*num(DATA.killsPerMin,24)*unitOf(host)); };   // teto do ouro em minutos de abate

/* anda o relógio: soma o produzido desde o último marcador (teto por tenda). Relógio para trás: só move o marcador. */
function tick(S,host){
  if(DATA.on!==true) return ensure({sys:{camp:S&&S.sys&&S.sys.camp?JSON.parse(JSON.stringify(S.sys.camp)):{}}},host);   // desligado: não escreve no save
  const o=ensure(S,host), now=nowOf(host), dt=now-o.t; o.t=Math.max(o.t,now); if(!(dt>0)||locked(S,host)) return o;   // antes de abrir não acumula
  const h=dt/3600000; for(const d of DATA.tents){ const t=o.tents[d.id], cap=capOf(S,host,d.id); t.acc=Math.min(cap,t.acc+rate(S,host,d.id)*h); }
  return o; }

/* coleta tudo (parte inteira; a fração fica). → {ok, reason, got:{gold, forge, practice}} */
function collect(S,host){ if(DATA.on!==true) return {ok:false,reason:'off',got:{gold:0,forge:0,practice:0}};
  if(locked(S,host)){ tick(S,host); return {ok:false,reason:'locked',got:{gold:0,forge:0,practice:0}}; }   // tick só anda o marcador
  const o=tick(S,host), got={gold:0,forge:0,practice:0};
  for(const d of DATA.tents){ const t=o.tents[d.id], n=Math.floor(t.acc); if(n<=0) continue;
    if(d.res==='gold'){ if(host&&typeof host.addGold==='function'){ host.addGold(n); got.gold=n; t.acc-=n; } }
    else if(d.res==='forge'){ const F=root.Sys&&root.Sys.forge; if(F&&F.addStones){ F.addStones(S,n,host); got.forge=n; t.acc-=n; } }
    else if(d.res==='practice'){ const P=root.Sys&&root.Sys.practice; if(P&&P.addStones){ P.addStones(S,n,host); got.practice=n; t.acc-=n; } } }
  const any=got.gold+got.forge+got.practice>0; if(any&&host&&typeof host.onChange==='function') host.onChange();
  return {ok:any,reason:any?'':'empty',got}; }

/* pôr / tirar pet da tenda (o que já foi produzido fica; a mudança vale daqui para frente) */
function assign(S,host,tentId,petId){ if(DATA.on!==true) return {ok:false,reason:'off'}; if(!TENT[tentId]) return {ok:false,reason:'id'};
  if(locked(S,host)) return {ok:false,reason:'locked'};
  if(!idlePets(S).includes(petId)) return {ok:false,reason:'pet'};   // não tem o pet, ou é o principal
  const o=tick(S,host), t=o.tents[tentId];
  for(const k in o.tents) if(o.tents[k].pets.includes(petId)) return {ok:false,reason:'busy',tent:k};
  if(t.pets.length>=DATA.petSlots) return {ok:false,reason:'full'};
  t.pets.push(petId); return {ok:true}; }
function unassign(S,host,petId){ if(DATA.on!==true) return {ok:false,reason:'off'}; const o=tick(S,host); for(const k in o.tents){ const t=o.tents[k], i=t.pets.indexOf(petId); if(i>=0){ t.pets.splice(i,1); return {ok:true,tent:k}; } }
  return {ok:false,reason:'pet'}; }

/* melhoria da tenda: só ouro. → {ok, reason:'off'|'id'|'locked'|'max'|'money', cost, lv} */
function upgradeCost(S,host,id){ const o=ensure(S,host), t=o.tents[id]; if(!t) return 0; const u=Math.max(1,unitOf(host));
  return Math.ceil(Math.round(DATA.upgrade.base*Math.pow(DATA.upgrade.growth,t.lv-1)*1e6)/1e6)*Math.ceil(u); }   /* arredonda antes do ceil (300×1,6² = 768, não 769) */
function canUpgrade(S,host,id){ if(DATA.on!==true) return {ok:false,reason:'off'}; if(!TENT[id]) return {ok:false,reason:'id'};
  if(locked(S,host)) return {ok:false,reason:'locked'}; const o=ensure(S,host), t=o.tents[id], cost=upgradeCost(S,host,id);
  if(t.lv>=DATA.maxLevel) return {ok:false,reason:'max',cost,lv:t.lv};
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(cost)) return {ok:false,reason:'money',cost,lv:t.lv};
  return {ok:true,reason:'',cost,lv:t.lv}; }
function upgrade(S,host,id){ const c=canUpgrade(S,host,id); if(!c.ok) return c; tick(S,host);
  if(host&&typeof host.spendGold==='function'&&host.spendGold(c.cost)===false) return {ok:false,reason:'money',cost:c.cost,lv:c.lv};
  const t=S.sys.camp.tents[id]; t.lv++; if(host&&typeof host.onChange==='function') host.onChange(); return {ok:true,reason:'',cost:c.cost,lv:t.lv}; }

/* modelo da tela */
function view(S,host){ if(DATA.on!==true) S=JSON.parse(JSON.stringify(S||{}));   // desligado: a tela pode olhar, o save não muda
  const o=tick(S,host), capH=capHours(S), idle=idlePets(S);
  return {on:DATA.on===true, locked:locked(S,host), needLevel:DATA.unlockLevel, capHours:capH,
    text:`As tendas enchem até ${capH} h. Pets parados ajudam; o pet principal fica na luta.`,
    idlePets:idle.filter(id=>!Object.values(o.tents).some(t=>t.pets.includes(id))),
    tents:DATA.tents.map(d=>{ const t=o.tents[d.id], r=rate(S,host,d.id), cap=capOf(S,host,d.id);   /* o mesmo teto do tick (o ouro para em capMin minutos de abate) */
      return {id:d.id,name:d.name,res:d.res,lv:t.lv,maxLv:DATA.maxLevel,perHour:Math.round(r*100)/100,stored:Math.floor(t.acc),cap:Math.floor(cap),
        full:cap>0&&t.acc>=cap-1e-9,pct:cap>0?Math.min(100,Math.round(t.acc/cap*100)):0,pets:t.pets.slice(),slots:DATA.petSlots,
        upgrade:canUpgrade(S,host,d.id)}; })}; }

function setOn(v){ DATA.on=!!v; return DATA.on; }
const API={DATA,setOn,ensure,capHours,idlePets,petBoost,rate,tick,collect,assign,unassign,upgradeCost,canUpgrade,upgrade,view};
root.Sys=root.Sys||{}; root.Sys.camp=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
