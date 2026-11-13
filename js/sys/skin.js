/* Eonbound — Sys.skin: SKIN DÁ PODER (regra nova do dono; SUBSTITUI "skin nunca dá atributo").
   Skin equipada: arma e roupa +2/+3/+5/+7/+10% de ATK e HP pela raridade (Básico..Lendário), em CADA espaço equipado.
   Chapéu, luvas, botas, colar e asa (decisão do PO): +1/+1,5/+2/+3/+4% (menos que arma/roupa), lidas do Sys.appearance.
   Coleção: cada skin possuída +0,5% de ATK e HP, teto +10%. Recalcula na hora (sem cache): trocar a skin muda a FC na hora.
   Números da v7.1 (aprovada pelo PO); o QA conferiu a regra em 175 combinações. Tela: detail(S). Relatório: reports/sys-e2-api.md */
(function(root){
'use strict';
const DATA={
  label:'Skins', icon:'🎨',
  equippedPct:[2,3,5,7,10],        // por raridade da skin equipada de ARMA e de ROUPA (S.skinEq)
  minorPct:[1,1.5,2,3,4],          // chapéu, luvas, botas, colar, asa (PO: "+1% a +4% por raridade"; o 1,5 do Raro é escolha da fps-e2)
  minorSlots:['hat','gloves','boots','necklace','wing'],
  perSlot:true,                    // DECIDIDO pelo PO: cada espaço de skin equipado SOMA (arma + roupa): 2 Lendárias = +20%
  collectionPer:0.5, collectionCap:10,
  // raridade das skins do passe (ids fora do padrão w{era}{r} / a{era}{r}); host.skinR(id) substitui esta tabela
  passR:{p5:3,p10:3,p15:3,p20:4,p25:4,p30:4},
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let HOST=null;                     // host opcional para skinR (o jogo pode chamar Sys.skin.useHost(host))
function rarOf(id){
  if(HOST&&typeof HOST.skinR==='function'){ const r=HOST.skinR(id); if(typeof r==='number'&&isFinite(r)) return clamp(Math.floor(r),0,4); }
  if(typeof id!=='string') return -1; if(id in DATA.passR) return DATA.passR[id];
  const m=/^[a-z]+(\d)(\d)$/.exec(id); return m?clamp(+m[2],0,4):-1;   // padrão <letra(s)><era><raridade>: w23, a12, h04...
}
/* DONO (13/11, via PO): a arma na mão é SEMPRE o item equipado; a skin de arma não sobrepõe mais. O espaço weapon do S.skinEq é IGNORADO
   (save antigo não é apagado nem migrado): sai do bônus de "equipada" e do detail. As skins de arma possuídas CONTINUAM na coleção (ninguém perde poder). */
DATA.ignoredSlots=['weapon'];
const equippedIds=S=>{ const e=S&&S.skinEq; if(!e||typeof e!=='object') return []; return Object.keys(e).filter(k=>!DATA.ignoredSlots.includes(k)).map(k=>e[k]).filter(x=>typeof x==='string'); };
const ownedCount=S=>Array.isArray(S&&S.skins)?new Set(S.skins.filter(x=>typeof x==='string')).size:0;
const minorIds=S=>{ const a=S&&S.sys&&S.sys.appearance&&S.sys.appearance.skin; if(!a||typeof a!=='object') return [];
  return DATA.minorSlots.map(s=>a[s]).filter(x=>typeof x==='string'); };
function majorPct(S){ const v=equippedIds(S).map(rarOf).filter(r=>r>=0).map(r=>DATA.equippedPct[r]);
  if(!v.length) return 0; return DATA.perSlot?v.reduce((s,x)=>s+x,0):Math.max(...v); }
const minorPct=S=>minorIds(S).map(rarOf).filter(r=>r>=0).reduce((s,r)=>s+DATA.minorPct[r],0);
/* SKIN FIXA (Sys.appearance; Kael Cavaleiro etc.): equipada soma pela raridade, como arma/roupa; possuída conta na coleção */
const fixedOf=S=>{ const A=root.Sys&&root.Sys.appearance; try{ return A&&A.fixedPct?A.fixedPct(S):{r:-1,owned:0}; }catch(e){ return {r:-1,owned:0}; } };
const fixedEq=S=>{ const r=fixedOf(S).r; return r>=0?DATA.equippedPct[clamp(r,0,4)]:0; };
const equippedPct=S=>majorPct(S)+minorPct(S)+fixedEq(S);
const collectionPct=S=>Math.min(DATA.collectionCap,(ownedCount(S)+fixedOf(S).owned)*DATA.collectionPer);
function bonus(S){ const p=Math.round((equippedPct(S)+collectionPct(S))*1e6)/1e6;
  return {atkPct:p,hpPct:p,goldPct:0,critPct:0,defPct:0,fc:0}; }
/* detalhamento para a tela (cartão: "+5% ATK e HP" grande; embaixo "Skins equipadas +4% · Coleção +1%").
   {total, equipped, collection, owned, cap, slots:[{slot, id, r, pct}]} — tudo em pontos %, o mesmo valor para ATK e HP */
function detail(S){
  const e=S&&S.skinEq&&typeof S.skinEq==='object'?S.skinEq:{}, slots=[];
  for(const slot of Object.keys(e)){ const id=e[slot]; if(typeof id!=='string'||DATA.ignoredSlots.includes(slot)) continue; const r=rarOf(id); slots.push({slot,id,r,pct:r>=0?DATA.equippedPct[r]:0}); }
  const a=S&&S.sys&&S.sys.appearance&&S.sys.appearance.skin||{};
  for(const slot of DATA.minorSlots){ const id=a[slot]; if(typeof id!=='string') continue; const r=rarOf(id); slots.push({slot,id,r,pct:r>=0?DATA.minorPct[r]:0}); }
  const eq=equippedPct(S), col=collectionPct(S), rnd=v=>Math.round(v*1e6)/1e6;
  return {total:rnd(eq+col),equipped:rnd(eq),collection:rnd(col),owned:ownedCount(S),cap:DATA.collectionCap,slots};
}
const useHost=h=>{ HOST=h||null; };
const API={DATA,rarOf,equippedPct,collectionPct,ownedCount,detail,bonus,useHost};
root.Sys=root.Sys||{}; root.Sys.skin=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
