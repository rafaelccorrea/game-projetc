/* Eonbound — Sys.bonfire: FOGUEIRA DAS ERAS (proposta aprovada para protótipo pelo dono, 14/11/2026; docs/ANALISE_LOOP_INICIAL.md,
   docs/PESQUISA_CONCORRENTES.md, protótipo docs/proto/v2/Fogueira.html). CHAVE DESLIGADA (DATA.on=false): desligada, nada muda no jogo.
   O jogador alimenta a fogueira com BRASAS (ganhas SÓ jogando: pote de abates, fase, chefe, baú, missões; NUNCA à venda, sem pacote, loja, VIP
   ou anúncio — regra de menores). Cada Brasa forja 1 equipamento:
   - a RARIDADE e a QUALIDADE saem do NÍVEL da fogueira (1-60), sempre dentro do portão do jogador (Sys.loot.maxAllowedR);
   - a ERA da peça é a do jogador (Sys.loot.rollItem faz o resto: espaço, secundários, nome);
   - o nível é independente da era; a cada faixa a fogueira EVOLUI de estágio (9, tema das eras; só o visual muda);
   - forjar (1 por Brasa) e desmontar enchem a XP; com a barra cheia, sobe pagando OURO.
   DESMONTAR devolve ouro (Sys.stats.dismantleGold, o mesmo da mochila), pedras de forja (Épico+), 1 Brasa (Mítico+) e XP da fogueira.
   Desmontar rápido (abaixo de uma raridade ou "pior que o equipado"), CADEADO (nunca desmonta), RECUPERAR os últimos 10 desmanches por 5 min,
   mochila cheia desmonta a pior destrancada (nunca para o combate). AUTOMÁTICO cedo (nível 3): lote, equipar o melhor, desmontar abaixo do filtro,
   PAUSA em Épico ou melhor. Estado: S.sys.bonfire. Teste: test/sys/bonfire.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  maxLevel:60,
  stages:[
    {from:1, id:'stones',   name:'Fogueira de pedras',  era:0},
    {from:5, id:'bronze',   name:'Braseiro de bronze',  era:1},
    {from:10,id:'anvil',    name:'Forja de ferreiro',   era:2},
    {from:16,id:'furnace',  name:'Fornalha de pólvora', era:3},
    {from:22,id:'boiler',   name:'Caldeira a vapor',    era:4},
    {from:29,id:'electric', name:'Forno elétrico',      era:5},
    {from:36,id:'reactor',  name:'Reator de plasma',    era:6},
    {from:44,id:'infernal', name:'Forja infernal',      era:7},
    {from:52,id:'altar',    name:'Altar celestial',     era:8}],
  /* chances por nível (pesquisa: o nível da fonte limita a raridade; nível 1 = só Básico) */
  odds:{rare:{from:2,base:6,per:1.2,max:35}, epic:{from:8,per:1.1,max:30}, mythic:{from:20,per:0.6,max:15}, legend:{from:35,per:0.24,max:6}, basicMin:14},
  starsPer:15,                        // qualidade média = 1 + nível ÷ 15 estrelas (5 no 60)
  xp:{base:10, per:3},                // barra = 10 + 3 × nível
  cost:{goldK:375, growth:1.17},      // ouro para subir = goldK × ouro de um abate × 1,17^(nível−1)
  brasas:{max:300, potKills:20, stage:3, boss:5, chest:5, missions:20},
  refund:{stonesFromR:2, brasaFromR:3, xpBase:2, xpPerR:3},
  auto:{level:3, batches:[1,3,5], pauseFromR:2},
  keep:{n:10, ms:5*60*1000},          // recuperar os últimos 10 desmanches por 5 min
  bagMax:30,
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.bonfire.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.bonfire; if(!o||typeof o!=='object') o=S.sys.bonfire={}; o.v=1;
  o.lv=clamp(int0(o.lv)||1,1,DATA.maxLevel); o.xp=clamp(int0(o.xp),0,xpNeed(o.lv)); o.bra=clamp(int0(o.bra),0,DATA.brasas.max); o.pot=clamp(int0(o.pot),0,DATA.brasas.potKills-1);
  o.locked=Array.isArray(o.locked)?o.locked.filter(x=>x!=null).map(String).slice(0,500):[];
  o.recent=Array.isArray(o.recent)?o.recent.filter(x=>x&&x.item&&typeof x.item==='object').slice(0,DATA.keep.n):[];
  const a=(o.auto&&typeof o.auto==='object')?o.auto:{}; o.auto={on:a.on===true,batch:DATA.auto.batches.includes(a.batch)?a.batch:1,equip:a.equip!==false,sellBelow:clamp(int0(a.sellBelow)||1,1,4)};
  return o; }

/* ---------- regras puras ---------- */
const xpNeed=lv=>DATA.xp.base+DATA.xp.per*clamp(int0(lv)||1,1,DATA.maxLevel);
function stageOf(lv){ lv=clamp(int0(lv)||1,1,DATA.maxLevel); let i=0; for(let k=0;k<DATA.stages.length;k++) if(lv>=DATA.stages[k].from) i=k; return i; }
function weights(lv){ const O=DATA.odds, L=clamp(int0(lv)||1,1,DATA.maxLevel);
  const R=L>=O.rare.from?Math.min(O.rare.max,O.rare.base+L*O.rare.per):0, E=L>=O.epic.from?Math.min(O.epic.max,(L-O.epic.from+1)*O.epic.per):0,
    M=L>=O.mythic.from?Math.min(O.mythic.max,(L-O.mythic.from+1)*O.mythic.per):0, G=L>=O.legend.from?Math.min(O.legend.max,(L-O.legend.from+1)*O.legend.per):0;
  return [Math.max(O.basicMin,100-R-E-M-G),R,E,M,G]; }
/* chances em % com o portão do jogador (cap = maior raridade permitida); o peso acima do portão some */
function odds(lv,cap){ const c=clamp(int0(cap),0,4), w=weights(lv).map((x,r)=>r<=c?x:0), t=w.reduce((a,b)=>a+b,0)||1; return w.map(x=>Math.round(x/t*10000)/100); }
const capOf=host=>{ const L=SYS().loot; try{ return L&&L.maxAllowedR?Math.min(4,L.maxAllowedR(host)):4; }catch(e){ return 4; } };
const starsAvg=lv=>Math.min(5,1+clamp(int0(lv)||1,1,DATA.maxLevel)/DATA.starsPer);
const upCost=(lv,host)=>Math.round(DATA.cost.goldK*Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1))*Math.pow(DATA.cost.growth,clamp(int0(lv)||1,1,DATA.maxLevel)-1));
function refundOf(item){ const r=clamp(int0(item&&item.r),0,5), R=DATA.refund, T=SYS().stats;
  return {gold:T&&T.dismantleGold?int0(T.dismantleGold(item)):0, stones:r>=R.stonesFromR?r-1:0, bra:r>=R.brasaFromR?1:0, xp:R.xpBase+R.xpPerR*r}; }

/* ---------- Brasas (só jogando) ---------- */
/* src: 'kill' (pote: 20 abates = 1), 'stage', 'boss', 'chest', 'missions'. Devolve quantas entraram. */
function addBrasas(S,src,n){ if(!ON()) return 0; const o=ensure(S), B=DATA.brasas; let add=0;
  if(src==='kill'){ o.pot+=Math.max(1,int0(n)||1); while(o.pot>=B.potKills){ o.pot-=B.potKills; add++; } }
  else if(B[src]>0) add=B[src]*Math.max(1,int0(n)||1); else return 0;
  const before=o.bra; o.bra=Math.min(B.max,o.bra+add); return o.bra-before; }

/* ---------- forjar ---------- */
function rollStars(rng,lv){ const a=starsAvg(lv), u=(rng?rng():Math.random())-0.5; return clamp(Math.round(a+u*1.6),1,5); }
/* forja 1 item: {ok, item, reason:'off'|'brasas'|'loot'} — entrega pelo host.addItem só quem chama decide (equipar/guardar/desmontar) */
function forge(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=ensure(S); if(o.bra<=0) return {ok:false,reason:'brasas'};
  const L=SYS().loot; if(!L||typeof L.rollItem!=='function') return {ok:false,reason:'loot'};
  const w=weights(o.lv); let item=null; const era=int0(host&&host.eraMax&&host.eraMax());   /* a era da peça é a do jogador (dono) */
  try{ item=L.rollItem(host,{source:'bonfire',rarWeights:w,era}); }catch(e){ item=null; } if(!item) return {ok:false,reason:'loot'};
  const st=rollStars(host&&host.rng,o.lv); item.qp=clamp((st-1)*2000+Math.floor((host&&host.rng?host.rng():Math.random())*2000),0,10000); item.src='bonfire';
  o.bra--; addXp(o,1); return {ok:true,item,stars:st}; }
function addXp(o,v){ if(o.lv>=DATA.maxLevel) return; o.xp=Math.min(xpNeed(o.lv),o.xp+int0(v)); }
/* subir: barra cheia + ouro (host.spendGold). {ok, lv, evolved, stage, reason:'xp'|'gold'|'max'|'off'} */
function levelUp(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=ensure(S); if(o.lv>=DATA.maxLevel) return {ok:false,reason:'max'};
  if(o.xp<xpNeed(o.lv)) return {ok:false,reason:'xp',need:xpNeed(o.lv)-o.xp}; const c=upCost(o.lv,host);
  if(!host||typeof host.spendGold!=='function'||!host.spendGold(c)) return {ok:false,reason:'gold',cost:c};
  const s0=stageOf(o.lv); o.lv++; o.xp=0; const s1=stageOf(o.lv); return {ok:true,lv:o.lv,cost:c,evolved:s1!==s0,stage:DATA.stages[s1]}; }

/* ---------- mochila: cadeado, desmontar, recuperar, cheia ---------- */
const idOf=it=>String(it&&it.id);
const isLocked=(S,item)=>ensure(S).locked.includes(idOf(item));
function lock(S,item,on){ const o=ensure(S), id=idOf(item); o.locked=o.locked.filter(x=>x!==id); if(on) o.locked.push(id); return !!on; }
const equippedIds=host=>{ try{ const e=host&&host.equipped?host.equipped():{}; return new Set(Object.values(e||{}).filter(Boolean).map(x=>String(typeof x==='object'?x.id:x))); }catch(e){ return new Set(); } };
const bagOf=host=>{ try{ return host&&host.items?(typeof host.items==='function'?host.items():host.items):[]; }catch(e){ return []; } };
/* desmonta uma lista (itens da mochila; trancado e equipado nunca). host.removeItem(item) tira da mochila. Devolve o total. */
function dismantle(S,host,list){ const o=ensure(S), eq=equippedIds(host), tot={gold:0,stones:0,bra:0,xp:0,n:0}, now=nowOf(host);
  for(const it of Array.isArray(list)?list:[]){ if(!it||isLocked(S,it)||eq.has(idOf(it))) continue; const r=refundOf(it);
    if(host&&typeof host.removeItem==='function') host.removeItem(it); for(const k of ['gold','stones','bra','xp']) tot[k]+=r[k]; tot.n++;
    o.recent.unshift({item:it,ref:r,t:now}); }
  o.recent=o.recent.filter(x=>now-num(x.t,0)<DATA.keep.ms).slice(0,DATA.keep.n);
  if(tot.gold&&host&&host.addGold) host.addGold(tot.gold); const F=SYS().forge; if(tot.stones&&F&&F.addStones) F.addStones(S,tot.stones,host);
  o.bra=Math.min(DATA.brasas.max,o.bra+tot.bra); addXp(o,tot.xp); return tot; }
/* desmontar rápido: {belowR} = tudo abaixo da raridade; {worse:true} = tudo com FC menor que o equipado (host.delta(item) < 0) */
function quick(S,host,opt){ const op=opt||{}, eq=equippedIds(host);
  const pick=bagOf(host).filter(it=>it&&!isLocked(S,it)&&!eq.has(idOf(it))&&(op.worse?(host&&host.delta?num(host.delta(it),0)<0:false):int0(it.r)<int0(op.belowR)));
  return dismantle(S,host,pick); }
/* recuperar um dos últimos desmanches (até 5 min): devolve o item à mochila e tira o que ele rendeu */
function recover(S,host,id){ const o=ensure(S), now=nowOf(host), i=o.recent.findIndex(x=>idOf(x.item)===String(id)&&now-num(x.t,0)<DATA.keep.ms); if(i<0) return {ok:false,reason:'id'};
  const x=o.recent[i], r=x.ref; if(r.gold&&host&&host.spendGold&&!host.spendGold(r.gold)) return {ok:false,reason:'gold'};
  const F=SYS().forge; try{ if(r.stones&&F&&F.ensure){ const fo=F.ensure(S); fo.stones=Math.max(0,fo.stones-r.stones); } }catch(e){}
  o.bra=Math.max(0,o.bra-r.bra); o.xp=Math.max(0,o.xp-r.xp); o.recent.splice(i,1); if(host&&host.addItem) host.addItem(x.item); return {ok:true,item:x.item}; }
/* mochila cheia: desmonta a PIOR destrancada (menor host.fcOf), nunca para o combate. Devolve o que saiu ou null */
function makeRoom(S,host){ const max=num(host&&host.bagMax&&host.bagMax(),DATA.bagMax), bag=bagOf(host); if(bag.length<max) return null;
  const eq=equippedIds(host), fc=it=>num(host&&host.fcOf?host.fcOf(it):int0(it.r),0), cand=bag.filter(it=>it&&!isLocked(S,it)&&!eq.has(idOf(it))).sort((a,b)=>fc(a)-fc(b))[0];
  if(!cand) return null; const t=dismantle(S,host,[cand]); return {item:cand,refund:t}; }

/* ---------- automático (de todos; cedo) ---------- */
/* forja até o lote; equipa o melhor (host.equip, se delta > 0), desmonta abaixo do filtro, guarda o resto; PAUSA em Épico+ (devolve o item) */
function autoRun(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=ensure(S); if(o.lv<DATA.auto.level) return {ok:false,reason:'level',need:DATA.auto.level};
  const out={ok:true,done:0,equipped:0,sold:0,kept:0,pause:null}; const N=Math.min(o.auto.batch,o.bra);
  for(let i=0;i<N;i++){ const f=forge(S,host); if(!f.ok) break; out.done++; const it=f.item;
    if(int0(it.r)>=DATA.auto.pauseFromR){ out.pause=it; break; }
    if(o.auto.equip&&host&&host.delta&&num(host.delta(it),0)>0&&host.equip){ host.addItem&&host.addItem(it); host.equip(it); out.equipped++; continue; }
    if(int0(it.r)<o.auto.sellBelow){ const r=refundOf(it); if(host&&host.addGold&&r.gold) host.addGold(r.gold); const F=SYS().forge; if(r.stones&&F&&F.addStones) F.addStones(S,r.stones,host); o.bra=Math.min(DATA.brasas.max,o.bra+r.bra); addXp(o,r.xp); out.sold++; continue; }
    makeRoom(S,host); if(host&&host.addItem) host.addItem(it); out.kept++; }
  return out; }
function setAuto(S,patch){ const o=ensure(S), p=patch||{}; if('on' in p) o.auto.on=!!p.on; if(DATA.auto.batches.includes(p.batch)) o.auto.batch=p.batch; if('equip' in p) o.auto.equip=!!p.equip; if(p.sellBelow!=null) o.auto.sellBelow=clamp(int0(p.sellBelow),1,4); return Object.assign({},o.auto); }

/* para a tela: {on, lv, xp, need, bra, pot, stage, next, odds, stars, cost, auto, autoLevel} */
function view(S,host){ const o=ensure(S), si=stageOf(o.lv); return {on:ON(),lv:o.lv,xp:o.xp,need:xpNeed(o.lv),bra:o.bra,pot:o.pot,potKills:DATA.brasas.potKills,stage:DATA.stages[si],next:DATA.stages[si+1]||null,
  odds:odds(o.lv,capOf(host)),stars:starsAvg(o.lv),cost:upCost(o.lv,host),auto:Object.assign({},o.auto),autoLevel:DATA.auto.level,recent:o.recent.slice()}; }
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,xpNeed,stageOf,weights,odds,starsAvg,upCost,refundOf,addBrasas,forge,levelUp,isLocked,lock,dismantle,quick,recover,makeRoom,autoRun,setAuto,view,bonus};
root.Sys=root.Sys||{}; root.Sys.bonfire=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
