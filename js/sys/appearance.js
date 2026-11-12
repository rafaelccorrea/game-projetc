/* Eonbound — Sys.appearance: VISUAL do herói por espaço, separado dos atributos (pedido do PO, para a fps-ff e o engenheiro desenharem o
   personagem com as peças equipadas). Para cada um dos 7 espaços (arma, colete, chapéu, luvas, botas, colar, asa) responde O QUE DESENHAR:
   a skin escolhida, se houver; senão a aparência do item equipado (item.look, a era do visual, que não muda na transformação); senão nada.
   - Skins de ARMA e de ROUPA continuam em S.skinEq.weapon / S.skinEq.armor (é o que o Sys.skin lê para o bônus de poder).
   - Skins dos outros espaços ficam em S.sys.appearance.skin[slot] e DÃO poder menor (decisão do PO; o Sys.skin lê daqui: +1% a +4%).
   - hidden[slot] esconde a peça (ex.: chapéu) sem tirar o item: atributos e FC não mudam.
   Lógica pura, sem DOM. Não soma nada na FC. Relatório: reports/sys-e2-api.md */
(function(root){
'use strict';
const DATA={
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],
  skinEqSlots:{weapon:'weapon', armor:'armor'},   // espaços cuja skin vive em S.skinEq (e conta no poder do Sys.skin)
  hideable:['hat','gloves','boots','necklace','wing'],
  // chave do sprite (proposta para a fps-ff): item → "item/<slot>/e<era do visual>_r<raridade>"; skin → "skin/<id>"
  itemKey:(slot,era,r)=>`item/${slot}/e${era}_r${r}`,
  skinKey:id=>`skin/${id}`,
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const isSlot=s=>DATA.slots.includes(s);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.appearance.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.appearance; if(!o||typeof o!=='object') o=S.sys.appearance={};
  o.v=1; const sk=(o.skin&&typeof o.skin==='object')?o.skin:{}, hd=(o.hidden&&typeof o.hidden==='object')?o.hidden:{};
  o.skin={}; o.hidden={};
  for(const s of DATA.slots){ if(!DATA.skinEqSlots[s]&&typeof sk[s]==='string') o.skin[s]=sk[s]; if(DATA.hideable.includes(s)&&hd[s]===true) o.hidden[s]=true; }
  return o;
}
/* skin escolhida para um espaço (arma/roupa: S.skinEq; os outros: estado de aparência) */
function skinOf(S,slot){ if(!isSlot(slot)) return null; const k=DATA.skinEqSlots[slot];
  if(k){ const id=S&&S.skinEq&&S.skinEq[k]; return typeof id==='string'?id:null; } const id=ensure(S).skin[slot]; return typeof id==='string'?id:null; }
/* troca a skin de um espaço (id ou null para voltar à aparência do item). Arma/roupa gravam em S.skinEq (Sys.skin recalcula o poder na hora). */
function setSkin(S,slot,id){ if(!isSlot(slot)||(id!=null&&typeof id!=='string')) return false; const k=DATA.skinEqSlots[slot];
  if(k){ if(!S.skinEq||typeof S.skinEq!=='object') S.skinEq={}; if(id==null) delete S.skinEq[k]; else S.skinEq[k]=id; return true; }
  const o=ensure(S); if(id==null) delete o.skin[slot]; else o.skin[slot]=id; return true; }
function setHidden(S,slot,on){ if(!DATA.hideable.includes(slot)) return false; const o=ensure(S); if(on) o.hidden[slot]=true; else delete o.hidden[slot]; return true; }
const visualEra=it=>Number.isInteger(it&&it.look)?it.look:clamp(int0(it&&it.e),0,6);
/* O QUE DESENHAR em cada espaço. host.equipped() → {slot: item}. Devolve {slot: {source:'skin'|'item'|'none', key, skin, era, r, hidden}} */
function of(S,host){
  const eq=host&&typeof host.equipped==='function'?(host.equipped()||{}):{}, o=ensure(S), out={};
  for(const slot of DATA.slots){
    const it=eq[slot], sk=skinOf(S,slot), hidden=!!o.hidden[slot];
    if(sk) out[slot]={source:'skin',key:DATA.skinKey(sk),skin:sk,era:null,r:null,hidden};
    else if(it) out[slot]={source:'item',key:DATA.itemKey(slot,visualEra(it),clamp(int0(it.r),0,4)),skin:null,era:visualEra(it),r:clamp(int0(it.r),0,4),hidden};
    else out[slot]={source:'none',key:null,skin:null,era:null,r:null,hidden};
  }
  return out;
}
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});   // visual não dá poder (o poder da skin é do Sys.skin)
const API={DATA,ensure,skinOf,setSkin,setHidden,of,bonus};
root.Sys=root.Sys||{}; root.Sys.appearance=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
