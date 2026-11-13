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
  if(o.mode==='skin'&&outfit){ const c=comboOf(outfit);   // DONO 12/11: a skin de roupa é uma COMBINAÇÃO de camadas (vale nas 4 fases e nos 2 heróis pelas máscaras de cada fase)
    if(c){ const lay=comboLayers(outfit,c,o); out.splice(0,0,...lay.filter(l=>l.layer==='aura')); out.push(...lay.filter(l=>l.layer!=='aura')); out.push(weapon); return out; }
    out.push({layer:'skin',key:DATA.skinKey(outfit),source:'skin',id:outfit}); out.push(weapon); return out; }
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
function sheets(S,host){ const h=heroOf(S), L=root.Sys&&root.Sys.level, PU=root.Sys&&root.Sys.phaseUp; let st=0;
  try{ if(PU&&PU.DATA&&PU.DATA.on===true) st=clamp(int0(PU.current(S)),0,3); else if(L&&L.stage){ const g=L.stage(S,host); if(g&&g.on!==false) st=clamp(int0(g.stage),0,3); } }catch(e){}   // Sys.phaseUp (níveis 22/35/70) manda quando ligado
  const dir='assets/anim/hyb/'+HERO_DIRS[h][st]+'/'; return {hero:h,stage:st,dir,prefix:h+'_',masks:dir+'masks/'}; }
/* KAIA JOGÁVEL: estados de animação que a batalha toca e onde cada um existe. A Kaia garota (fase 0) só tem run/idle/attack: giro, morte e pistola
   caem na FASE MAIS PRÓXIMA que tem o estado (kaia_phase1), com fallback:true (pedir a arte que falta à fps-75). O Kael garoto tem todos. */
const STATES=['run','idle','attack','spin','die','pistol_idle','pistol_run','pistol_shoot'];
const HAS={kaia:{0:['run','idle','attack']}};   // o que falta em cada fase (o resto existe em todas: conferido no disco em 12/11)
function sheetFor(S,host,state){ const sh=sheets(S,host), h=sh.hero, st=STATES.includes(state)?state:'idle';
  const has=ph=>{ const L=HAS[h]&&HAS[h][ph]; return !L||L.includes(st); };
  let ph=sh.stage; if(!has(ph)){ for(let k=1;k<4;k++){ if(ph+k<=3&&has(ph+k)){ ph=ph+k; break; } if(ph-k>=0&&has(ph-k)){ ph=ph-k; break; } } }
  const dir='assets/anim/hyb/'+HERO_DIRS[h][ph]+'/';
  return {hero:h,state:st,stage:ph,fallback:ph!==sh.stage,dir,body:dir+h+'_'+st+'_body',masks:dir+'masks/'+h+'_'+st}; }
/* troca o herói do save (a criação chama; só 'kael' | 'kaia'). Só visual: atributos e FC iguais (os dois usam os mesmos itens e o mesmo Sys.stats). */
function setHero(S,hero){ if(!S||typeof S!=='object') return false; if(hero!=='kael'&&hero!=='kaia') return false; S.hero=hero; return true; }
/* ROUPA-SKIN = COMBINAÇÃO DE CAMADAS (decisão do dono, 12/11): cada skin de roupa (a<era><r>, 35, e p10/p20/p30 do passe) mantém id, nome e preço, mas
   em vez de um corpo inteiro é chapéu + tinta de colete e botas (nas máscaras R/B de cada fase) + óculos/máscara + aura nas Lendárias. Peças da Arte:
   chapéus por era (assets/anim/equip/hats/hat_<eraN>.png), cosméticos (assets/anim/equip/cos/<id>.png), auras (assets/anim/aura/<id>), tintas abaixo
   (formato da página de aparência da Arte: [R, G, B, ganho]). Save antigo com roupa-skin: MESMA id, passa a desenhar a combinação sozinho. */
const MATERIALS={couro:[150,105,65,1.0],couro_escuro:[95,60,40,0.9],bronze:[205,115,50,1.25],ferro:[150,160,180,1.05],prata:[232,235,245,1.4],
  ouro:[240,190,70,1.35],cristal:[110,200,255,1.45],obsidiana:[120,70,160,1.0],rubi:[210,40,60,1.2],esmeralda:[60,190,110,1.2]};
const RAR_MAT=[['couro','couro'],['couro_escuro','couro'],['bronze','couro_escuro'],['ferro','ferro'],['ouro','ouro']];   // [colete, botas] pela raridade
const PASS_COMBO={p10:{hat:'era3',vest:'rubi',boots:'couro_escuro',mask:'carnival'},      // Casaca da Temporada
  p20:{hat:'era5',vest:'ouro',boots:'ouro',glasses:'visor',aura:'aura10'},                    // Traje Elite Solar
  p30:{hat:'era8',vest:'ouro',boots:'obsidiana',aura:'aura13'}};                              // Imperador das Eras
/* combinação da skin de roupa id → {hat, vest, boots, glasses, mask, aura} ou null (não é roupa-skin) */
function comboOf(id){ if(PASS_COMBO[id]) return Object.assign({hat:null,vest:null,boots:null,glasses:null,mask:null,aura:null},PASS_COMBO[id]);
  const m=/^a(\d)(\d)$/.exec(String(id||'')); if(!m) return null; const e=+m[1], r=Math.min(4,+m[2]); let [vest,boots]=RAR_MAT[r];
  if(e===6&&r>=3) vest='cristal'; if(e===5&&r===3) boots='obsidiana'; if(e===1&&r===4) boots='bronze';   // sabor da era nas raras de cima
  // Arte 12/11 (render das 8 versões): chapéus das eras 4 e 6 já trazem óculos/viseira → sem óculos nelas; aura da Lendária pela era (não fogo em todas)
  const AURA_BY_ERA=['aura7','aura_holy','aura_holy','aura10','aura13','aura_evil','aura4'];
  return {hat:r>=1?'era'+e:null,vest,boots,glasses:r>=2&&e===5?'goggles':null,mask:null,aura:r>=4?AURA_BY_ERA[e]:null}; }
/* camadas da combinação (respeita o que o jogador ocultou; óculos/máscara PRÓPRIOS do jogador vencem os da skin) */
function comboLayers(id,c,o){ const out=[], hid=(o&&o.hidden)||{}, own=(o&&o.cos&&o.cos.eq)||{}, tint=(layer,mat)=>({layer,key:'tint/'+layer+'/'+mat,source:'skin',id,mat,tint:MATERIALS[mat]});
  if(c.aura) out.push({layer:'aura',key:'aura/'+c.aura,source:'skin',id,aura:c.aura,sheet:'assets/anim/aura/'+c.aura});
  if(c.boots&&!hid.boots) out.push(tint('boots',c.boots)); if(c.vest&&!hid.armor) out.push(tint('armor',c.vest));
  if(c.hat&&!hid.hat) out.push({layer:'hat',key:'hat/'+c.hat,source:'skin',id,hat:c.hat});
  for(const cat of ['glasses','mask']){ if(hid[cat]) continue; const mine=own[cat], pick=mine||c[cat]; if(pick) out.push({layer:cat,key:DATA.cosKey(pick),source:mine?'cos':'skin',id:mine||id,cos:pick}); }
  return out; }
/* SKINS × EVOLUÇÃO (ordem do dono: a skin NUNCA se perde quando o herói evolui). Skin e cosmético são do JOGADOR (S.skins, S.skinEq, S.sys.appearance,
   S.look): o phaseUp não toca neles. O que muda com a fase é só A PASTA da folha (sheetFor). Cobertura por tipo:
   - arma (w<era><r>, p5/p15/p25): desenhada na mão pela âncora de cada quadro → vale em todas as fases e nos dois heróis (precisa da arte da arma);
   - camadas (chapéu da era, colete/botas por tinta nas máscaras, óculos, máscara, asa): usam as máscaras/âncoras POR FASE → valem nas 4 fases e nos 2 heróis;
   - CORPO INTEIRO (roupa a<era><r>, p10/p20/p30): precisa de uma folha própria por fase e herói (<pasta>/<herói>_<estado>_skin_<id>). Sem as 8 versões
     (4 fases × Kael/Kaia) ela NÃO pode ir à venda nem cair (canSell). skinCoverage(id, existe) diz o que falta. */
const FULL_SKIN=id=>/^a\d\d$/.test(id)||['p10','p20','p30'].includes(id);
const WEAPON_SKIN=id=>/^w\d\d$/.test(id)||['p5','p15','p25'].includes(id);
/* {id, kind: weapon|full|layer, missing:[{hero, stage, file}], ok} — existe(caminho) diz se o arquivo existe (o teste/ferramenta passa fs.existsSync) */
function skinCoverage(id,exists){ const has=typeof exists==='function'?exists:()=>false, c=FULL_SKIN(id)?comboOf(id):null, out={id,kind:WEAPON_SKIN(id)?'weapon':c?'combo':'layer',missing:[],combo:c};
  // roupa-skin = combinação (dono): vale nas 4 fases × 2 heróis pelas máscaras; precisa só que cada PEÇA exista
  if(c){ const need=[]; if(c.hat) need.push('assets/anim/equip/hats/hat_'+c.hat+'.png'); for(const k of ['glasses','mask']) if(c[k]) need.push('assets/anim/equip/cos/'+c[k]+'.png'); if(c.aura) need.push('assets/anim/aura/'+c.aura+'.png');
    for(const f of need) if(!has(f)) out.missing.push({hero:'*',stage:'*',file:f}); for(const k of ['vest','boots']) if(c[k]&&!MATERIALS[c[k]]) out.missing.push({hero:'*',stage:'*',file:'tinta:'+c[k]}); }
  if(out.kind==='weapon'){ const m=/^w(\d)(\d)$/.exec(id), RK=['t0','raro','t1','mitico','t2']; if(m){ const f='assets/weapons/era'+m[1]+'_'+RK[+m[2]]+'.png'; if(!has(f)) out.missing.push({hero:'*',stage:'*',file:f}); } }
  out.ok=!out.missing.length; return out; }
const canSell=(id,exists)=>skinCoverage(id,exists).ok;
/* evolução: a animação aprovada (evolve_0_1) tem o herói padrão DESENHADO nela; se o jogador usa skin/cosmético/arma visível, a evolução tem que ser
   desenhada por CAMADAS (folha da fase antiga → brilho → folha da fase nova, com as camadas dele) para a skin aparecer. */
function evolveNeedsLayers(S,host){ try{ return layers(S,host).some(l=>l.source==='skin'&&l.layer!=='base'||l.source==='cos'||l.layer==='hat'||l.layer==='wing'); }catch(e){ return false; } }
const API={DATA,MATERIALS,comboOf,STATES,heroOf,setHero,sheets,sheetFor,skinCoverage,canSell,evolveNeedsLayers,ensure,skinOf,setSkin,setHidden,of,bonus,look,setMode,setLookHidden,addCosmetic,equipCosmetic,layers};
root.Sys=root.Sys||{}; root.Sys.appearance=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
