'use strict';
/* ================= SKIN DE ARMA DE EVENTO (decisão do dono, 14/11) =================
   EXCEÇÃO à regra "a arma na mão é sempre o item equipado": o jogador pode usar o VISUAL de uma arma de EVENTO por cima da arma equipada.
   SÓ O VISUAL: o poder, a ultimate, os efeitos, o som e o movimento continuam os da arma EQUIPADA (nenhum atributo muda; o Sys.skin ignora o
   espaço weapon do S.skinEq). As outras skins de arma (w00..w84) continuam fora: só os ids da TABELA abaixo valem.
   De onde vem: a loja do evento (Sys.events) dá reward.skin = <id> → S.skins. O que está em uso fica em S.skinEq.weapon (sempre texto; "Tirar" = 'w00').
   PONTO ÚNICO DO DESENHO: WSkin.look(base), chamado pelo wFamLook do js/battle.js (quem resolve a arma na mão para a batalha, a carga, a Arena e o
   drawHeroFull de todas as telas). Devolve uma CÓPIA da arma equipada com vk = <id>: o wKey/wPng do js/battle.js leem vk primeiro, então o sprite
   (assets/weapons/<id>.png) e o grip (assets/weapons/meta.json, chave = id) passam a ser os da skin; era, raridade e família seguem os da arma equipada.
   Devolve a PRÓPRIA arma equipada (nada muda) quando: nenhuma skin de evento escolhida; o jogador não tem a skin; a linha da tabela está com art:false;
   o sprite ainda não carregou ou falhou (nunca mão vazia, nunca imagem quebrada); o meta.json não tem o grip; a arma equipada é de tiro ou de
   arremesso (arco, bumerangue, arma de fogo: o movimento não combina com uma lâmina).
   Tela: bloco "Visual da arma" na aba Visual do Perfil (js/p_profile2.js chama WSkin.html e WSkin.act). Sem skin de evento, o bloco não existe.
   Teste: node test/paineis/wskin.smoke.js */
(function(root){
/* TABELA ÚNICA das skins de arma de evento. art:true SÓ quando os três existem no disco: o sprite (1024, transparente), o ícone (256) e a entrada
   no assets/weapons/meta.json com a chave = id ({"type":"melee","grip":[x,y],"angle":N,"len":N}). Com art:false nada é pedido à rede e a opção não aparece. */
const TABLE=[
  {id:'festival_weapon', name:'Lâmina do Festival', sprite:'assets/weapons/festival_weapon.png', icon:'assets/icons/weapons/festival_weapon.png', art:true},
  {id:'cacada_weapon',   name:'Lâmina do Caçador',  sprite:'assets/weapons/cacada_weapon.png',   icon:'assets/icons/weapons/cacada_weapon.png',   art:true},
  {id:'forja_weapon',    name:'Martelo das Eras',   sprite:'assets/weapons/forja_weapon.png',    icon:'assets/icons/weapons/forja_weapon.png',    art:true}
];
const NONE='w00';   /* "nenhum visual escolhido": a skin inicial de todo save (o campo precisa continuar texto: js/p_cfg.js confere) */
const META='assets/weapons/meta.json';
const TXT={phrase:'Só muda o visual. O poder é o da arma equipada.', title:'Visual da arma · evento'};
const rowOf=id=>{ for(const r of TABLE) if(r.id===id) return r; return null; };
const save=()=>{ try{ return (typeof S!=='undefined'&&S&&typeof S==='object')?S:null; }catch(e){ return null; } };
const owns=id=>{ const s=save(); return !!(s&&Array.isArray(s.skins)&&s.skins.indexOf(id)>=0); };
/* a skin de evento escolhida (id da tabela) ou null. Qualquer outro valor de S.skinEq.weapon (w00..w84 de save antigo) continua ignorado. */
function chosen(){ const s=save(), id=s&&s.skinEq&&typeof s.skinEq==='object'?s.skinEq.weapon:null; return typeof id==='string'&&rowOf(id)?id:null; }

/* ---------- a arte: pronta | chegando | falhou | não existe ---------- */
const RETRY_MS=30000, RETRY_MAX=2, FAILS={};
function artOf(r){ if(!r||r.art!==true) return 'none';
  try{ if(typeof SPR!=='function') return 'wait';
    const s=SPR(r.sprite,'weapon');
    if(s){ if(!s.v) s.v={1:s,2:s,3:s,4:s,5:s};   /* a skin aparece como a Arte fez: sem a tinta e o brilho da raridade da arma equipada (skinSpr, js/battle.js) */
      return 'ok'; }
    const o=(typeof IMGS!=='undefined'&&IMGS)?IMGS[r.sprite]:null;
    if(o&&o.fail){ const f=FAILS[r.id]||(FAILS[r.id]={n:0,t:0}), now=Date.now();
      if(!f.t) f.t=now;
      else if(f.n<RETRY_MAX&&now-f.t>RETRY_MS){ f.n++; f.t=0; delete IMGS[r.sprite]; try{ if(root.Preload&&typeof root.Preload.drop==='function') root.Preload.drop(r.sprite); }catch(e){} }   /* tenta de novo (rede que caiu): no máximo 2 vezes */
      return 'fail'; }
    return 'wait';
  }catch(e){ return 'fail'; } }
/* o grip da skin: sem a entrada no meta.json a arma ficaria fora da mão → não aplica */
function metaOk(id){ try{ if(typeof J!=='function') return false; const m=J(META)[id]; return !!(m&&Array.isArray(m.grip)&&m.grip.length===2&&(m.type==null||m.type==='melee')); }catch(e){ return false; } }

/* ---------- a arma equipada aceita uma lâmina por cima? ---------- */
/* '' = aceita. Senão, o tipo que não combina: 'arco' | 'bumerangue' | 'arma de fogo' */
function misfit(base){ if(!base) return '';
  if(base.wk) return base.wt==='bow'?'arco':base.wt==='boomerang'?'bumerangue':'arma de arremesso';
  try{ if(typeof wIsGun==='function'&&wIsGun(base)) return 'arma de fogo'; }catch(e){}
  return ''; }
const whyOf=kind=>kind?'Não dá com '+kind+': o movimento não combina. Equipe uma arma corpo a corpo.':'';
/* a arma equipada como o jogo a desenha HOJE (sem skin de evento) */
function baseNow(){ try{ const lk=typeof heroLook==='function'?heroLook():null, w=lk?lk.weapon:null; return typeof wFamLook0==='function'?wFamLook0(w):w; }catch(e){ return null; } }

/* ---------- PONTO ÚNICO: qual arma desenhar na mão ---------- */
const LOOKS={};   /* cópia por (arma equipada, skin): o MESMO objeto a cada chamada (o wSkin do js/battle.js compara por identidade) */
function look(base){ if(!base||typeof base!=='object'||base.vk) return base;
  const id=chosen(); if(!id||!owns(id)) return base;
  if(misfit(base)) return base;
  const r=rowOf(id); if(artOf(r)!=='ok'||!metaOk(id)) return base;
  const k=String(base.id)+'|'+id, c=LOOKS[k]; if(c&&c.base===base) return c;
  return LOOKS[k]=Object.assign({},base,{vk:id,base:base}); }
/* a skin de evento que ESTÁ aparecendo na mão agora (id) ou null */
function active(){ const b=baseNow(), w=look(b); return w&&w!==b&&w.vk?w.vk:null; }

/* ---------- o que a tela mostra ---------- */
/* só as skins de evento que o jogador TEM e que têm arte. [] = o bloco não aparece */
function rows(){ const ch=chosen(), b=baseNow(), kind=misfit(b), why=whyOf(kind), out=[];
  for(const r of TABLE){ if(r.art!==true||!owns(r.id)) continue; const use=ch===r.id; let st='idle', txt='Na coleção';
    if(use){ const a=artOf(r);
      if(kind){ st='paused'; txt='Escolhido, mas parado. '+why; }
      else if(a==='ok'&&metaOk(r.id)){ st='on'; txt='Em uso'; }
      else if(a==='fail'){ st='fail'; txt='A arte não carregou. Aparece a arma equipada.'; }
      else { st='wait'; txt='Em uso. A arte está chegando; até lá aparece a arma equipada.'; } }
    else if(kind){ st='blocked'; txt=why; }
    out.push({id:r.id,name:r.name,icon:r.icon,sprite:r.sprite,use:use,state:st,text:txt,can:use||!kind}); }
  return out; }
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* bloco pronto para a tela. o.attr = atributo do botão que a tela escuta (ex.: 'data-x="wsk"'); o.btn / o.btnOff = classes de botão da tela;
   o.sec / o.hint = classes do título e da frase. Botões com 44 px de altura; o texto quebra (320 a 412 sem corte).
   Opção que não combina com a arma equipada: botão apagado (aria-disabled) com o motivo escrito ao lado; o toque repete o motivo no aviso da tela. */
function html(o){ const L=rows(); if(!L.length) return ''; o=o||{}; const attr=o.attr||'data-wsk="1"', bt=o.btn||'', bo=o.btnOff||bt;
  let h='<div class="wsk" style="margin:0 0 10px;min-width:0"><div class="'+esc(o.sec||'')+'"><span>'+TXT.title+'</span><span>'+L.length+'</span></div>'
    +'<p class="'+esc(o.hint||'')+'" style="margin:0 0 6px">'+TXT.phrase+'</p>';
  for(const r of L){ const lab=r.use?'Tirar':'Usar', off=!r.can;
    h+='<div class="wsk-row" data-wsk-st="'+r.state+'" style="display:flex;align-items:center;gap:10px;min-width:0;padding:8px;margin:0 0 6px;border-radius:12px;background:rgba(10,14,40,.55);border:1px solid '+(r.state==='on'?'#ffd25e':'rgba(255,255,255,.14)')+'">'
      +'<img src="'+esc(r.icon)+'" alt="" width="44" height="44" style="flex:none;width:44px;height:44px;object-fit:contain" onerror="this.style.visibility=\'hidden\'">'
      +'<div style="flex:1;min-width:0"><b style="display:block;font-size:13px;line-height:1.25;overflow-wrap:anywhere">'+esc(r.name)+'</b>'
      +'<small style="display:block;font-size:11px;line-height:1.35;color:#9aa6d6;font-weight:700;overflow-wrap:anywhere">'+esc(r.text)+'</small></div>'
      +'<button type="button" class="'+esc(r.use?bo:bt)+'" '+attr+' data-id="'+esc(r.id)+'" data-op="'+(r.use?'clear':'use')+'"'+(off?' aria-disabled="true"':'')
      +' aria-label="'+esc((r.use?'Tirar o visual ':'Usar o visual ')+r.name+(off?'. '+r.text:''))+'" style="flex:none;min-width:76px;min-height:44px'+(off?';opacity:.45':'')+'">'+lab+'</button></div>'; }
  return h+'</div>'; }

/* ---------- trocar ---------- */
function again(r){ try{ const o=(typeof IMGS!=='undefined'&&IMGS)?IMGS[r.sprite]:null; if(o&&o.p&&typeof o.p.then==='function') o.p.then(()=>{ try{ if(typeof view!=='undefined'&&view==='profile2'&&typeof render==='function') render(); }catch(e){} },()=>{}); }catch(e){} }
/* usa o visual da skin. {ok, reason: id|falta|arte|tipo, msg} */
function use(id){ const r=rowOf(id), s=save(); if(!r||!s) return {ok:false,reason:'id',msg:'Não foi possível trocar agora.'};
  if(r.art!==true) return {ok:false,reason:'arte',msg:'Este visual ainda não está disponível.'};
  if(!owns(id)) return {ok:false,reason:'falta',msg:'Você ainda não tem este visual.'};
  const kind=misfit(baseNow()); if(kind) return {ok:false,reason:'tipo',msg:whyOf(kind)};
  if(!s.skinEq||typeof s.skinEq!=='object') s.skinEq={}; s.skinEq.weapon=id;
  if(artOf(r)!=='ok') again(r);   /* dispara a carga do sprite; a mão troca quando ele chegar */
  return {ok:true,id:id,msg:'Visual da arma: '+r.name+'. O poder continua o da arma equipada.'}; }
/* volta ao visual da arma equipada */
function clear(){ const s=save(); if(!s) return {ok:false,reason:'id',msg:'Não foi possível trocar agora.'}; if(!chosen()) return {ok:true,msg:'O visual já é o da arma equipada.'};
  s.skinEq.weapon=NONE; return {ok:true,msg:'Visual de volta ao da arma equipada.'}; }
/* clique do bloco: op 'use' | 'clear' */
function act(id,op){ return op==='clear'?clear():op==='use'?use(id):{ok:false,reason:'id',msg:'Não foi possível trocar agora.'}; }

const API={TABLE,IDS:TABLE.map(r=>r.id),NONE,TXT,rowOf,owns,chosen,active,artOf,metaOk,misfit,look,rows,html,use,clear,act};
root.WSkin=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
