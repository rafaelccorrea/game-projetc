/* Eonbound — Sys.pass: PASSE DE BATALHA (30 níveis, trilhas Grátis e Premium) e as MISSÕES diárias/semanais que dão XP DO PASSE.
   Regras do dono via PO: o nível do passe é SEPARADO do nível do jogador e sobe só com XP de MISSÕES (não de abates). Premium = compra direta
   (não é sorteio) e ganha +25% de XP do passe. Item entregue respeita os portões de raridade do jogador: sem o nível, fica GUARDADO e sai
   quando o portão abrir, com a ERA decidida na liberação (para não chegar obsoleto). Lógica pura + estado em S.sys.pass.
   Spec: reports/spec-loot-bau-instancias.md (seção 6). Relatório: reports/sys-pass.md */
(function(root){
'use strict';

/* ---------------- dados ---------------- */
const DATA={
  tiers:30, xpPerTier:100, seasonDays:30, premiumXpPct:25,
  // recompensas por nível (índice 0 = nível 1). goldk = × ouro de um abate da fase (host.goldUnit). item: {slot, r} (era na entrega).
  // Grátis: pouco 💎, moedas, Básico revezando 6 espaços (asa Básica não existe), ÉPICO no 30.
  free:[
    {goldk:10},{gems:5},{item:{slot:'weapon',r:0}},{goldk:15},{gems:10},{item:{slot:'armor',r:0}},{goldk:20},{gems:5},{item:{slot:'hat',r:0}},{gems:10},
    {goldk:25},{item:{slot:'gloves',r:0}},{goldk:25},{gems:5},{item:{slot:'boots',r:0}},{goldk:30},{gems:5},{item:{slot:'necklace',r:0}},{goldk:30},{gems:10},
    {item:{slot:'weapon',r:0}},{goldk:35},{gems:5},{item:{slot:'armor',r:0}},{gems:10},{goldk:40},{item:{slot:'hat',r:0}},{goldk:40},{gems:10},{item:{slot:'weapon',r:2}},
  ],
  // Premium: Raro nos primeiros, Épico no meio (inclui a asa), Lendário no fim, mais 💎 e a skin da temporada.
  // season:true = ITEM DA TEMPORADA (PO): entregue NA HORA na melhor raridade permitida e EVOLUI sozinho até a raridade-alvo quando o portão abrir.
  premium:[
    {item:{slot:'weapon',r:1}},{gems:15},{item:{slot:'armor',r:1}},{gems:15},{item:{slot:'hat',r:1}},{gems:15},{item:{slot:'gloves',r:1}},{gems:20},{item:{slot:'boots',r:1}},{gems:20},
    {item:{slot:'necklace',r:2}},{gems:20},{item:{slot:'weapon',r:2}},{gems:20},{item:{slot:'armor',r:2}},{gems:25},{item:{slot:'wing',r:2}},{gems:25},{item:{slot:'hat',r:2}},{gems:25},
    {item:{slot:'gloves',r:2}},{gems:25},{item:{slot:'boots',r:2}},{gems:30},{skin:'season'},{gems:30},{item:{slot:'armor',r:4,season:true}},{gems:30},{gems:40},{item:{slot:'weapon',r:4,season:true}},
  ],
  // MISSÕES (XP do passe = pxp). Diárias: todas = 70 + bônus 20 = 90/dia. Semanais: 190/semana (segunda a domingo).
  // Grátis todo dia: nível 30 no dia 27; perdendo 1 dia por semana: dia 29; premium (+25%): dia ~21.
  // CHAVE (PO): enquanto a tela 13 (instâncias) não entra, as missões de instância saem e entram substitutas que já fecham no jogo,
  // com o MESMO XP do passe (o bônus das 6 diárias continua liberando). Voltar: Sys.pass.DATA.instancesOn = true.
  instancesOn:false,
  daily:[
    {id:'d_kill',   k:'kill',    need:150, pxp:15, gems:2, txt:'Derrote 150 inimigos'},
    {id:'d_ult',    k:'ult',     need:3,   pxp:10, gems:2, txt:'Use a ultimate 3 vezes'},
    {id:'d_chest',  k:'chest',   need:1,   pxp:10, gems:2, txt:'Abra 1 baú'},
    {id:'d_inst',   k:'instance',need:1,   pxp:15, gems:2, txt:'Vença 1 instância', needsInstances:true},
    {id:'d_boss',   k:'boss',    need:2,   pxp:15, gems:2, txt:'Derrote 2 chefes', replaces:'d_inst'},
    {id:'d_forge',  k:'forge',   need:15,  pxp:10, gems:2, txt:'Colete 15 pedras de forja (de qualquer fonte)'},   // PO (D3): conta drop, chefe, baú, instância e desmonte
    {id:'d_summon', k:'summon',  need:1,   pxp:10, gems:2, txt:'Faça 1 invocação (a grátis conta)'},
  ],
  dailyBonus:{pxp:20, gems:5, txt:'Complete as 6 diárias'},   // PO: folga → diárias 90/dia (quem perde 1 dia por semana fecha os 30)
  weekly:[
    {id:'w_kill',   k:'kill',    need:1500, pxp:40, gems:8, txt:'Derrote 1.500 inimigos'},
    {id:'w_boss',   k:'boss',    need:15,   pxp:40, gems:8, txt:'Derrote 15 chefes'},
    {id:'w_inst',   k:'instance',need:10,   pxp:40, gems:8, txt:'Vença 10 instâncias', needsInstances:true},
    {id:'w_summon', k:'summon',  need:10,   pxp:40, gems:8, txt:'Faça 10 invocações (a grátis conta)', replaces:'w_inst'},
    {id:'w_chest',  k:'chest',   need:15,   pxp:35, gems:6, txt:'Abra 15 baús'},
    {id:'w_up',     k:'upgrade', need:20,   pxp:35, gems:6, txt:'Melhore equipamentos 20 vezes', minLevel:5},   // PO: só a partir do nível 5 (antes o teto de nível do item tornava impossível)
  ],
  maxHeld:60,
};
const EVENTS=['kill','boss','ult','chest','instance','forge','summon','upgrade'];

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pad=n=>String(n).padStart(2,'0');
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==="function") return C.dayKey(ms);   // fuso único (Sys.clock.DATA.tzOffsetMin; com servidor, Brasília)
  const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function weekKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.weekKey==="function") return C.weekKey(ms);
  const d=new Date(ms); d.setHours(0,0,0,0); const wd=(d.getDay()+6)%7; d.setDate(d.getDate()-wd); return dayKey(d.getTime()); }   // semana começa na segunda (convenção da fps-e2)
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const Loot=()=>root.Sys&&root.Sys.loot;
/* nível do jogador: Sys.level (fps-e2) ou host.level(); sem nenhum, conta como liberado */
const playerLevel=(S,host)=>{ const Lv=root.Sys&&root.Sys.level; if(Lv&&typeof Lv.level==='function') return Lv.level(S); const f=host&&host.level; return typeof f==='function'?num(f(),Infinity):Infinity; };
const maxXp=()=>DATA.tiers*DATA.xpPerTier;
const tierList=a=>Array.isArray(a)?[...new Set(a.filter(t=>Number.isInteger(t)&&t>=1&&t<=DATA.tiers))].sort((x,y)=>x-y):[];

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.pass.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.pass;
  if(!o||typeof o!=='object'){ o=S.sys.pass={};
    if(S.pass&&typeof S.pass==='object'){ o.xp=S.pass.xp; o.free=S.pass.free; o.prem=S.pass.prem; o.premium=!!S.pass.on; } }   // importa o passe antigo do jogo
  o.v=1; o.xp=clamp(int0(o.xp),0,maxXp()); o.free=tierList(o.free); o.prem=tierList(o.prem); o.premium=!!o.premium;
  if(!o.d||typeof o.d!=='object') o.d={day:'',p:{},c:[],bonus:false};
  if(!o.w||typeof o.w!=='object') o.w={week:'',p:{},c:[]};
  for(const B of [o.d,o.w]){ if(!B.p||typeof B.p!=='object') B.p={}; for(const k in B.p){ if(!EVENTS.includes(k)) delete B.p[k]; else B.p[k]=int0(B.p[k]); } if(!Array.isArray(B.c)) B.c=[]; }
  o.d.bonus=!!o.d.bonus;
  if(!Array.isArray(o.held)) o.held=[];
  o.held=o.held.filter(h=>h&&typeof h.slot==='string'&&Number.isInteger(h.r)).slice(0,DATA.maxHeld);
  return o;
}
/* viradas: diárias à meia-noite, semanais na segunda */
const DAY=86400000;
/* TEMPORADA: ciclos de seasonDays a partir de DATA.seasonStart (ms; o jogo pode fixar o calendário) ou da 1ª carga.
   Na virada: XP, resgates e premium do passe zeram (premium é por temporada). */
function season(S,host){
  const o=ensure(S), now=nowOf(host), len=DATA.seasonDays*DAY;
  if(!o.season||typeof o.season!=='object'||!isFinite(o.season.end)){ const st=num(DATA.seasonStart,now); o.season={n:1,start:st,end:st+len}; }
  while(now>=o.season.end){ o.season={n:o.season.n+1,start:o.season.end,end:o.season.end+len}; o.xp=0; o.free=[]; o.prem=[]; o.premium=false; }
  return o.season;
}
function refresh(S,host){
  const o=ensure(S), now=nowOf(host), dk=dayKey(now), wk=weekKey(now); season(S,host);
  if(o.d.day!==dk) o.d={day:dk,p:{},c:[],bonus:false};
  if(o.w.week!==wk) o.w={week:wk,p:{},c:[]};
  return o;
}

/* ---------------- XP do passe ---------------- */
const tier=S=>Math.min(DATA.tiers,Math.floor(ensure(S).xp/DATA.xpPerTier));
function progress(S){ const o=ensure(S), t=tier(S); return {tier:t,xp:o.xp,inTier:t>=DATA.tiers?DATA.xpPerTier:o.xp%DATA.xpPerTier,per:DATA.xpPerTier,max:t>=DATA.tiers,premium:o.premium}; }
/* soma XP do passe (já com o +25% do premium). Devolve {gained, from, to}. */
function addXp(S,n){
  const o=ensure(S), from=tier(S), k=Math.round(int0(n)*(o.premium?1+DATA.premiumXpPct/100:1));
  o.xp=Math.min(maxXp(),o.xp+k); return {gained:k,from,to:tier(S)};
}
/* premium = compra direta (o jogo chama depois do pagamento) */
function setPremium(S,on){ ensure(S).premium=!!on; }

/* ---------------- missões ---------------- */
/* evento do jogo: track(S, host, 'kill'|'boss'|'ult'|'chest'|'instance'|'forge'|'summon'|'upgrade', n) */
function track(S,host,k,n){ if(!EVENTS.includes(k)) return; const o=refresh(S,host), v=int0(n==null?1:n); if(!v) return;
  o.d.p[k]=(o.d.p[k]||0)+v; o.w.p[k]=(o.w.p[k]||0)+v; }
function list(S,host){
  const o=refresh(S,host), row=(B,m)=>({id:m.id,txt:m.txt,need:m.need,pxp:m.pxp,gems:m.gems,p:Math.min(m.need,int0(B.p[m.k])),done:int0(B.p[m.k])>=m.need,claimed:B.c.includes(m.id)});
  const lv=playerLevel(S,host), inst=!!DATA.instancesOn;
  const open=m=>lv>=num(m.minLevel,1)&&(inst?!m.replaces:!m.needsInstances);   // minLevel; chave das instâncias (troca pela substituta)
  const daily=DATA.daily.filter(open).map(m=>row(o.d,m)), weekly=DATA.weekly.filter(open).map(m=>row(o.w,m));
  return {daily,weekly,bonus:{...DATA.dailyBonus,ready:daily.every(m=>m.claimed),claimed:o.d.bonus}};
}
/* resgata uma missão (ou 'bonus'): dá 💎 e XP do passe. Devolve {ok, gems, xp, tier} ou {ok:false, reason} */
function claimMission(S,host,id){
  const o=refresh(S,host), L=list(S,host);
  let m=null, B=null;
  if(id==='bonus'){ if(!L.bonus.ready) return {ok:false,reason:'incompleto'}; if(o.d.bonus) return {ok:false,reason:'resgatado'}; o.d.bonus=true; m=DATA.dailyBonus; }
  else { const r=L.daily.find(x=>x.id===id)||L.weekly.find(x=>x.id===id); if(!r) return {ok:false,reason:'id'}; if(!r.done) return {ok:false,reason:'incompleto'}; if(r.claimed) return {ok:false,reason:'resgatado'};
    B=DATA.daily.some(x=>x.id===id)?o.d:o.w; B.c.push(id); m=r; }
  if(m.gems&&host&&host.addGems) host.addGems(m.gems);
  const x=addXp(S,m.pxp); return {ok:true,gems:m.gems||0,xp:x.gained,tier:x.to,tierUp:x.to>x.from};
}

/* ---------------- recompensas ---------------- */
const reward=(track,t)=>(DATA[track==='premium'?'premium':'free'][t-1])||null;
/* cria o item na hora da entrega (era = era liberada AGORA), com secundários; Mítica de arma não existe no lançamento */
function makeItem(host,spec){
  const L=Loot(), rng=rngOf(host), e=clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);
  let r=clamp(int0(spec.r),0,4); if(spec.slot==='weapon'&&r===3) r=2;
  const subs=L&&L.rollSubs?L.rollSubs(rng,r,spec.slot):[];
  const it={slot:spec.slot,r,e,lvl:1,gold:0,subs,origin:'pass'}; const qp=L&&L.qualityOf?L.qualityOf(rng):null; if(qp!=null) it.qp=qp;   // qualidade (chave da fps-e2)
  return it;
}
/* o jogador pode receber agora? (portão de raridade e regra da asa: nível 50+ e Épica+) */
function canReceive(host,spec){
  const L=Loot(); if(!L||!L.maxAllowedR) return true;
  if(L.maxAllowedR(host)<spec.r) return false;
  if(spec.slot==='wing'){ const lv=host&&typeof host.level==='function'?num(host.level(),Infinity):Infinity; if(lv<num(L.DATA.wing.minLevel,50)||spec.r<num(L.DATA.wing.minR,2)) return false; }
  return true;
}
function giveReward(S,host,rw){
  const out={gems:0,gold:0,item:null,held:null,skin:null};
  if(rw.gems){ out.gems=rw.gems; if(host.addGems) host.addGems(rw.gems); }
  if(rw.goldk){ const u=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)); out.gold=Math.round(rw.goldk*u); if(host.addGold) host.addGold(out.gold); }
  if(rw.skin){ out.skin=rw.skin; if(host.addSkin) host.addSkin(rw.skin); }
  if(rw.item&&rw.item.season){   // ITEM DA TEMPORADA: nunca guardado; sai já na melhor raridade permitida e evolui depois
    const it=makeItem(host,{slot:rw.item.slot,r:seasonR(host,rw.item)}); it.season=true; it.targetR=rw.item.r;
    it.seasonEnd=season(S,host).end;   // informativo (temporada em que foi ganho). PO (v7): o item NÃO sobe de era; só a raridade evolui
    out.item=it; if(host.addItem) host.addItem(it);
  }
  else if(rw.item){
    if(canReceive(host,rw.item)){ const it=makeItem(host,rw.item); out.item=it; if(host.addItem) host.addItem(it); }
    else { const o=ensure(S); o.held.push({slot:rw.item.slot,r:rw.item.r}); out.held={slot:rw.item.slot,r:rw.item.r,needLevel:needLevel(rw.item)}; }
  }
  return out;
}
function needLevel(spec){ const L=Loot(); if(!L) return 1; const g=L.DATA.gates[spec.r]||{lvl:1}; return Math.max(num(g.lvl,1),spec.slot==='wing'?num(L.DATA.wing.minLevel,50):1); }
/* resgata TUDO o que já liberou nas duas trilhas (premium só se ativo). Devolve {n, list:[{track,tier,...}]} */
function claimAll(S,host){
  const o=ensure(S), t=tier(S), out=[];
  for(let i=1;i<=t;i++){
    if(!o.free.includes(i)){ o.free.push(i); out.push({track:'free',tier:i,...giveReward(S,host,reward('free',i))}); }
    if(o.premium&&!o.prem.includes(i)){ o.prem.push(i); out.push({track:'premium',tier:i,...giveReward(S,host,reward('premium',i))}); }
  }
  o.free.sort((a,b)=>a-b); o.prem.sort((a,b)=>a-b);
  return {n:out.length,list:out};
}
/* itens guardados saem quando o portão abre (chamar no level up; o Sys.loot.onLevelUp também chama). Era decidida AGORA. */
function releaseHeld(S,host){
  const o=ensure(S), out=[];
  o.held=o.held.filter(h=>{ if(canReceive(host,h)){ const it=makeItem(host,h); if(host.addItem) host.addItem(it); out.push(it); return false; } return true; });
  if(host&&typeof host.items==='function') evolveSeason(S,host);   // no level up, também evolui os Itens da Temporada (se o jogo expuser host.items)
  return out;
}
const held=S=>ensure(S).held.map(h=>({slot:h.slot,r:h.r,needLevel:needLevel(h)}));
/* raridade permitida agora para um item da temporada (arma não tem Mítica no lançamento) */
function seasonR(host,spec){ const L=Loot(); let r=clamp(int0(spec.r),0,4); if(L&&L.maxAllowedR) r=Math.min(r,L.maxAllowedR(host)); if(spec.slot==='weapon'&&r===3) r=2; return r; }
/* EVOLUI os Itens da Temporada que o jogador tem: sobe só a RARIDADE até a permitida (até targetR). A era NÃO muda (decisão do PO após a v7).
   Mantém lvl, gold e o +N (que é do espaço).
   items: a mochila (array) ou host.items(). Muda os itens NO LUGAR e devolve os que evoluíram. */
function evolveSeason(S,host,items){
  const L=Loot(), rng=rngOf(host), list=Array.isArray(items)?items:(host&&typeof host.items==='function'?host.items():[]), out=[];
  for(const it of list||[]){ if(!it||!it.season) continue;
    const r=seasonR(host,{slot:it.slot,r:int0(it.targetR)});
    if(r>int0(it.r)){ const from=it.r; it.r=r;   // PO (v7): a ERA fica a de quando foi ganho (subindo de era o premium virava quase um VIP)
      const need=L&&L.DATA?num(L.DATA.subs.count[r],0):0, have=(it.subs||[]).map(s=>s.k);
      if(L&&L.rollSubs&&have.length<need){ const extra=L.rollSubs(rng,r,it.slot).filter(s=>!have.includes(s.k)); it.subs=(it.subs||[]).concat(extra.slice(0,need-have.length)); }
      out.push({item:it,from,to:r}); }
  }
  return out;
}
function alerts(S,host){ const o=refresh(S,host), t=tier(S), L=list(S,host); let n=0;
  for(let i=1;i<=t;i++){ if(!o.free.includes(i)) n++; if(o.premium&&!o.prem.includes(i)) n++; }
  n+=L.daily.filter(m=>m.done&&!m.claimed).length+L.weekly.filter(m=>m.done&&!m.claimed).length+(L.bonus.ready&&!L.bonus.claimed?1:0);
  return n; }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,refresh,season,tier,progress,addXp,setPremium,track,list,claimMission,reward,claimAll,releaseHeld,evolveSeason,held,alerts,bonus,dayKey,weekKey};
root.Sys=root.Sys||{}; root.Sys.pass=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
