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
  // ===== APARÊNCIA EM CAMADAS (regra do dono via PO): estado em S.look, SÓ visual (atributos não mudam) =====
  // Roupa base do Kael + CAMADAS dos itens equipados por cima: botas, colete, chapéu, arma (colar e luvas NÃO aparecem). ASA (PO): ATRÁS do corpo,
  // presa às costas, nos DOIS modos (não é da roupa), com olho para ocultar; a skin de asa (demoníaca, anjo) vence o item.
  // Cosméticos de cabeça extras (óculos, máscara): só visuais, por compra direta, evento ou conquista (nunca sorteio).
  // Modo 'items' (mostra as peças) ou 'skin' (a skin completa aparece e esconde as peças e os cosméticos). Ocultar peça por peça.
  starterSkins:['w00','a00'],                       // skins com que todo save nasce = "nenhuma escolhida" (mesma regra do heroLook do engenheiro)
  layerOrder:['wing','base','boots','armor','hat','glasses','mask','weapon'],   // de baixo para cima (a asa fica atrás do corpo)
  itemLayers:['boots','armor','hat','weapon'], lookHideable:['wing','boots','armor','hat','glasses','mask'],
  cosCats:['glasses','mask'],
  cosmetics:[   // ids = os da ARTE (assets/anim/equip/cos/cos.json, fps-ff); nomes e de onde vem (src) ainda PROVISÓRIOS até o PO fechar catálogo e preços
    {id:'goggles',  cat:'glasses', name:'Óculos de proteção', src:'shop'},
    {id:'visor',    cat:'glasses', name:'Viseira',            src:'event'},
    {id:'ninja',    cat:'mask',    name:'Máscara ninja',      src:'achievement'},
    {id:'carnival', cat:'mask',    name:'Máscara de carnaval', src:'shop'},
  ],
  cosKey:id=>`cos/${id}`,   // arquivo: assets/anim/equip/cos/<id>.png; âncora e pivot em cos.json (items[id])
};
const COS={}; for(const c of DATA.cosmetics) COS[c.id]=c;
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
/* estado da aparência em camadas: S.look = {v, mode:'items'|'skin', hidden:{slot:true}, cos:{owned:[ids], eq:{glasses, mask}}} */
function look(S){ if(!S||typeof S!=='object') throw new Error('Sys.appearance.look: save inválido');
  let o=S.look; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.look={};
  o.v=1; o.mode=o.mode==='skin'?'skin':'items'; const hd=(o.hidden&&typeof o.hidden==='object')?o.hidden:{}; o.hidden={};
  for(const k of DATA.lookHideable) if(hd[k]===true) o.hidden[k]=true;
  const old=S.sys&&S.sys.appearance&&S.sys.appearance.hidden; if(old&&!o.migrated){ for(const k of ['hat','boots']) if(old[k]===true) o.hidden[k]=true; o.migrated=true; }   // ocultos antigos
  const c=(o.cos&&typeof o.cos==='object')?o.cos:{}, owned=Array.isArray(c.owned)?c.owned.filter(id=>COS[id]):[], eq={};
  for(const cat of DATA.cosCats){ const id=c.eq&&c.eq[cat]; if(typeof id==='string'&&owned.includes(id)&&COS[id].cat===cat) eq[cat]=id; }
  o.cos={owned:[...new Set(owned)],eq}; return o; }
const setMode=(S,mode)=>{ if(mode!=='items'&&mode!=='skin') return false; look(S).mode=mode; return true; };
function setLookHidden(S,key,on){ if(!DATA.lookHideable.includes(key)) return false; const o=look(S); if(on) o.hidden[key]=true; else delete o.hidden[key]; return true; }
/* ganha um cosmético (compra direta, evento ou conquista; nunca sorteio). {ok, reason: id|owned} */
function addCosmetic(S,id){ if(!COS[id]) return {ok:false,reason:'id'}; const o=look(S); if(o.cos.owned.includes(id)) return {ok:false,reason:'owned'}; o.cos.owned.push(id); return {ok:true,id}; }
function equipCosmetic(S,cat,id){ if(!DATA.cosCats.includes(cat)) return false; const o=look(S); if(id==null){ delete o.cos.eq[cat]; return true; }
  if(!o.cos.owned.includes(id)||COS[id].cat!==cat) return false; o.cos.eq[cat]=id; return true; }
const chosenSkin=(S,k)=>{ const id=S&&S.skinEq&&S.skinEq[k]; return typeof id==='string'&&!DATA.starterSkins.includes(id)?id:null; };
/* CAMADAS PARA DESENHAR, de baixo para cima: [{layer, key, source:'base'|'item'|'skin'|'cos', era, r, id}]. Ocultos e o que não aparece já saem da lista.
   Modo 'skin' COM skin de roupa escolhida: base + a skin completa + a arma (skin de arma ou item). Sem skin escolhida, o modo 'skin' cai no 'items'. */
function layers(S,host){ const o=look(S), eq=host&&typeof host.equipped==='function'?(host.equipped()||{}):{}, out=[];
  if(!o.hidden.wing){ const ws=skinOf(S,'wing'), wi=eq.wing; if(ws) out.push({layer:'wing',key:DATA.skinKey(ws),source:'skin',id:ws});
    else if(wi){ const T=root.Sys&&root.Sys.stats, id=T&&T.wingOf?T.wingOf(wi):(wi.wing||'angel');   // asa = item próprio: a chave é QUAL asa (não muda por era/raridade)
      out.push({layer:'wing',key:'wing/'+id,source:'item',id,era:visualEra(wi),r:clamp(int0(wi.r),0,5)}); } }
  out.push({layer:'base',key:'base/'+heroOf(S),source:'base',hero:heroOf(S)});
  const wSkin=chosenSkin(S,'weapon'), wItem=eq.weapon, weapon=wSkin?{layer:'weapon',key:DATA.skinKey(wSkin),source:'skin',id:wSkin}
    :wItem?{layer:'weapon',key:DATA.itemKey('weapon',visualEra(wItem),clamp(int0(wItem.r),0,5)),source:'item',era:visualEra(wItem),r:clamp(int0(wItem.r),0,5)}:{layer:'weapon',key:DATA.skinKey('w00'),source:'skin',id:'w00'};
  const outfit=chosenSkin(S,'armor');
  if(o.mode==='skin'&&outfit){ out.push({layer:'skin',key:DATA.skinKey(outfit),source:'skin',id:outfit}); out.push(weapon); return out; }
  for(const L of DATA.layerOrder){ if(L==='base'||L==='weapon'||L==='wing') continue; if(o.hidden[L]) continue;
    if(DATA.cosCats.includes(L)){ const id=o.cos.eq[L]; if(id) out.push({layer:L,key:DATA.cosKey(id),source:'cos',id}); continue; }
    const it=eq[L]; if(it) out.push({layer:L,key:DATA.itemKey(L,visualEra(it),clamp(int0(it.r),0,5)),source:'item',era:visualEra(it),r:clamp(int0(it.r),0,5)}); }
  out.push(weapon); return out; }
/* skin escolhida para um espaço (arma/roupa: S.skinEq; os outros: estado de aparência) */
function skinOf(S,slot){ if(!isSlot(slot)) return null; const k=DATA.skinEqSlots[slot];
  if(k){ const id=S&&S.skinEq&&S.skinEq[k]; return typeof id==='string'?id:null; } const id=ensure(S).skin[slot]; return typeof id==='string'?id:null; }
/* troca a skin de um espaço (id ou null para voltar à aparência do item). Arma/roupa gravam em S.skinEq (Sys.skin recalcula o poder na hora). */
function setSkin(S,slot,id){ if(!isSlot(slot)||(id!=null&&typeof id!=='string')) return false; const k=DATA.skinEqSlots[slot];
  if(k){ if(!S.skinEq||typeof S.skinEq!=='object') S.skinEq={}; if(id==null) delete S.skinEq[k]; else S.skinEq[k]=id; return true; }
  const o=ensure(S); if(id==null) delete o.skin[slot]; else o.skin[slot]=id; return true; }
function setHidden(S,slot,on){ if(!DATA.hideable.includes(slot)) return false; const o=ensure(S); if(on) o.hidden[slot]=true; else delete o.hidden[slot]; return true; }
const visualEra=it=>Number.isInteger(it&&it.look)?it.look:clamp(int0(it&&it.e),0,8);   // eras 0-8
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
/* HERÓI (S.hero do engenheiro: 'kael' | 'kaia') e a pasta das folhas pela fase do Sys.level (0 garoto/menina … 3 guerreiro/guerreira).
   sheets(S,host) → {hero, stage, dir:'assets/anim/hyb/<pasta>/', prefix:'kael_'|'kaia_', masks:'<dir>masks/'} (docs/ARTE_LIGAR.md §5 e §9b) */
const HERO_DIRS={kael:['R','phase1','phase2','phase3'],kaia:['kaia','kaia_phase1','kaia_phase2','kaia_phase3']};
const heroOf=S=>S&&S.hero==='kaia'?'kaia':'kael';
function sheets(S,host){ const h=heroOf(S), L=root.Sys&&root.Sys.level; let st=0; try{ if(L&&L.stage){ const g=L.stage(S,host); if(g&&g.on!==false) st=clamp(int0(g.stage),0,3); } }catch(e){}
  const dir='assets/anim/hyb/'+HERO_DIRS[h][st]+'/'; return {hero:h,stage:st,dir,prefix:h+'_',masks:dir+'masks/'}; }
const API={DATA,heroOf,sheets,ensure,skinOf,setSkin,setHidden,of,bonus,look,setMode,setLookHidden,addCosmetic,equipCosmetic,layers};
root.Sys=root.Sys||{}; root.Sys.appearance=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
