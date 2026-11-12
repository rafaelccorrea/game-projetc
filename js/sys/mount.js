/* Eonbound — Sys.mount: MONTARIA (aprovada pelo PO; reports/spec-oferta-montaria.md). O Kael MONTA nela; ela não ataca sozinha (os golpes são os do
   Kael, com a arma dele) e é separada do pet. Dá % de ATK e % de Vida (os dois iguais), no máximo (Nv 60, 5★): 3 / 4,5 / 6,5 / 9 / 12% por raridade.
   Nível 1-60 com OURO (teto = nível do jogador ÷ 2); estrelas 1-5 por fragmentos (cópia repetida = 10; 10/20/30/40). Nunca sorteio pago: vem da oferta
   de 1ª compra, do passe, da loja direta, de eventos. CHAVE DESLIGADA (DATA.on=false): desligada, bonus() é zero e nada muda. O atributo vale antes da
   arte existir (PO): DATA.visual diz se o jogo desenha o Kael montado. Estado: S.sys.mount. API: reports/sys-e2-api.md §5i. */
(function(root){
'use strict';
const DATA={
  on:false, visual:false, label:'Montaria', icon:'🐎',
  rarName:['Básico','Raro','Épico','Mítico','Lendário'],
  maxPct:[3,4.5,6.5,9,12],               // % de ATK e % de Vida no Nv 60 e 5★
  maxLvl:60, lvlMin:0.4,                  // fator do nível: 0,4 (Nv 1) → 1 (Nv 60), linear
  starBase:0.75, starStep:0.05, maxStars:5, starCost:[10,20,30,40], dupFrags:10,
  // ouro do nível N ao N+1 = goldK × ouro de um abate da fase × (1 + growth·(N−1)) × (1 + raridade·rarCost): acompanha a economia da fase
  cost:{goldK:20, growth:0.05, rarCost:0.5},
  // ESTÁGIO VISUAL por estrela (dono via PO; SÓ visual, os atributos não mudam): o engenheiro desenha pela chave id
  aura:[{stars:1,id:'none',name:'Sem aura',glow:0,smoke:false,particles:false},
        {stars:2,id:'glow',name:'Brilho leve',glow:1,smoke:false,particles:false},
        {stars:3,id:'glow',name:'Brilho leve',glow:1,smoke:false,particles:false},
        {stars:4,id:'aura_smoke',name:'Aura com fumaça',glow:2,smoke:true,particles:false},
        {stars:5,id:'aura_full',name:'Aura forte com fumaça e partículas',glow:3,smoke:true,particles:true}],
  // catálogo (nomes do PO, alinhados com a arte da fps-ff): 1 por raridade no lançamento
  mounts:[
    {id:'pony',    name:'Pônei',            r:0},
    {id:'horse',   name:'Cavalo de guerra', r:1},
    {id:'wolf',    name:'Lobo de guerra',   r:2},   // o da oferta de 1ª compra (arte: assets/mounts/mount_wolf_ref.png)
    {id:'griffin', name:'Grifo dourado',    r:2},   // ÉPICO também (dono); arte: assets/mounts/mount_griffin_ref.png
    {id:'mythic',  name:'(a definir)',      r:3, tbd:true},   // Mítico NOVO a definir (nome e arte com o PO/fps-ff): fora de add() até ter nome
    {id:'wyvern',  name:'Serpe dourada',    r:4},
  ],
};
const BY={}; for(const m of DATA.mounts) BY[m.id]=m;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const playerLevel=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); return int0(host&&host.level&&host.level())||1; };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.mount.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.mount; if(!o||typeof o!=='object') o=S.sys.mount={};
  o.v=1; const ow=(o.owned&&typeof o.owned==='object'&&!Array.isArray(o.owned))?o.owned:{}; o.owned={};
  for(const id in ow) if(BY[id]){ const x=ow[id]||{}; o.owned[id]={stars:clamp(int0(x.stars)||1,1,DATA.maxStars),frags:int0(x.frags),lvl:clamp(int0(x.lvl)||1,1,DATA.maxLvl),gold:int0(x.gold)}; }
  const st=(o.stored&&typeof o.stored==='object')?o.stored:{}; o.stored={}; for(const id in st) if(BY[id]&&!o.owned[id]&&int0(st[id])>0) o.stored[id]=int0(st[id]);
  if(!BY[o.eq]||!o.owned[o.eq]) o.eq=null;
  return o;
}
const lvlCap=(S,host)=>clamp(Math.floor(playerLevel(S,host)/2),1,DATA.maxLvl);
/* % de ATK e de Vida de uma montaria (no nível e estrelas dela) */
function pctOf(id,lvl,stars){ const m=BY[id]; if(!m) return 0; const L=DATA.lvlMin+(1-DATA.lvlMin)*(clamp(lvl,1,DATA.maxLvl)-1)/(DATA.maxLvl-1);
  return Math.round(DATA.maxPct[m.r]*L*(DATA.starBase+DATA.starStep*clamp(stars,1,DATA.maxStars))*1000)/1000; }
function starUp(x){ while(x.stars<DATA.maxStars&&x.frags>=DATA.starCost[x.stars-1]){ x.frags-=DATA.starCost[x.stars-1]; x.stars++; } }
/* ganha uma montaria (oferta, passe, loja, evento). Repetida = 10 fragmentos. A primeira entra equipada se não houver outra melhor. */
function add(S,host,id){ const m=BY[id]; if(!m) return {ok:false,reason:'id'}; if(m.tbd) return {ok:false,reason:'tbd'}; const o=ensure(S), x=o.owned[id];
  if(x){ const a=addFragments(S,id,DATA.dupFrags); return {ok:true,id,isNew:false,frags:DATA.dupFrags,stars:a.stars}; }
  o.owned[id]={stars:1,frags:0,lvl:1,gold:0}; const sv=o.stored[id]||0; delete o.stored[id]; if(sv) addFragments(S,id,sv);
  if(!o.eq||pctOf(id,1,o.owned[id].stars)>pctOf(o.eq,o.owned[o.eq].lvl,o.owned[o.eq].stars)) o.eq=id;
  return {ok:true,id,isNew:true,stars:o.owned[id].stars,equipped:o.eq===id}; }
function addFragments(S,id,n){ const k=int0(n); if(!k||!BY[id]) return {added:0,stars:0}; const o=ensure(S), x=o.owned[id];
  if(!x){ o.stored[id]=(o.stored[id]||0)+k; return {added:k,stored:true,stars:0}; } x.frags+=k; const s0=x.stars; starUp(x); return {added:k,stars:x.stars,up:x.stars-s0}; }
function equip(S,id){ const o=ensure(S); if(id==null){ o.eq=null; return true; } if(!o.owned[id]) return false; o.eq=id; return true; }
/* custo do próximo nível; {ok, reason: off|id|cap|max|money, gold, cap} */
function upgradeCost(S,host,id){ const o=ensure(S), x=o.owned[id], m=BY[id]; if(!x) return {ok:false,reason:'id',gold:0};
  const C=DATA.cost, unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)), gold=Math.ceil(C.goldK*unit*(1+C.growth*(x.lvl-1))*(1+m.r*C.rarCost));
  return {ok:true,gold,lvl:x.lvl,cap:lvlCap(S,host)}; }
function canUpgrade(S,host,id){ if(!ON()) return {ok:false,reason:'off'}; const c=upgradeCost(S,host,id); if(!c.ok) return c; const x=ensure(S).owned[id];
  if(x.lvl>=DATA.maxLvl) return Object.assign(c,{ok:false,reason:'max'}); if(x.lvl>=c.cap) return Object.assign(c,{ok:false,reason:'cap',needLevel:(x.lvl+1)*2});
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(c.gold)) return Object.assign(c,{ok:false,reason:'money'}); return c; }
function upgrade(S,host,id,times){ let n=0, spent=0, why=''; const max=Math.max(1,int0(num(times,1)));
  while(n<max){ const c=canUpgrade(S,host,id); if(!c.ok){ why=c.reason; break; } if(host&&typeof host.spendGold==='function'&&host.spendGold(c.gold)===false){ why='money'; break; }
    const x=S.sys.mount.owned[id]; x.lvl++; x.gold+=c.gold; spent+=c.gold; n++; }
  return {ok:n>0,n,spent,reason:n>0?'':why,lvl:S.sys.mount.owned[id]?S.sys.mount.owned[id].lvl:0}; }
const auraOf=stars=>DATA.aura[clamp(int0(stars)||1,1,DATA.maxStars)-1];
/* para a tela: {id, name, rarity, rarityName, lvl, cap, stars, frags, need, pct, maxPct, equipped} */
function info(S,host,id){ const o=ensure(S), x=o.owned[id], m=BY[id]; if(!m) return null;
  return {id,name:m.name,rarity:m.r,rarityName:DATA.rarName[m.r],owned:!!x,lvl:x?x.lvl:0,cap:lvlCap(S,host),stars:x?x.stars:0,frags:x?x.frags:int0(o.stored[id]),
    need:x&&x.stars<DATA.maxStars?DATA.starCost[x.stars-1]:0,pct:x?pctOf(id,x.lvl,x.stars):0,maxPct:DATA.maxPct[m.r],equipped:o.eq===id,aura:auraOf(x?x.stars:1)}; }
/* bônus no Sys.fc: % de ATK e de Vida da equipada (zero com a chave desligada) */
function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S||!ON()) return b; const o=ensure(S); if(!o.eq) return b;
  const x=o.owned[o.eq], p=pctOf(o.eq,x.lvl,x.stars); b.atkPct=p; b.hpPct=p; return b; }
/* para a batalha: o que desenhar (visual desligado até a arte existir) */
const battleInfo=S=>{ if(!ON()) return null; const o=ensure(S); if(!o.eq) return null; return {id:o.eq,name:BY[o.eq].name,rarity:BY[o.eq].r,visual:DATA.visual===true,sprite:'mount_'+o.eq,stars:o.owned[o.eq].stars,aura:auraOf(o.owned[o.eq].stars)}; };

const API={DATA,auraOf,ensure,add,addFragments,equip,lvlCap,pctOf,upgradeCost,canUpgrade,upgrade,info,bonus,battleInfo};
root.Sys=root.Sys||{}; root.Sys.mount=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
