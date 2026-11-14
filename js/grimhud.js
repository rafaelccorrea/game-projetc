'use strict';
/* ================= MAGIAS DO GRIMÓRIO NA BATALHA: COLUNA DE 3 ÍCONES COM ANEL DE RECARGA — arquivo novo, escopo próprio =================
   Só aparece com a chave do módulo ligada (Sys.grimoire.DATA.on) E com magia no conjunto do modo: quem diz isso é a batalha (window.GrimBattle, js/battle.js).
   NENHUMA regra nem número de jogo aqui: a lista viva {id, name, cd, left} (recarga total e segundos que faltam) vem de GrimBattle.list(); o ícone de cada magia
   é o da tela do Grimório (Panels.defs.grim.iconOf(id), js/p_grim.js; sem ela, um círculo com a inicial). As magias lançam SOZINHAS: a coluna é só leitura
   (não é botão, não recebe toque e não cobre toque de ninguém: pointer-events none).
   ONDE FICA (base 390x844 do #fb_w do js/fullbattle.js): coluna da ESQUERDA, x 7 a 55, logo ABAIXO do último ícone visível da coluna esquerda (Equip., Invocar,
   Loja, Passe: mesma conta do botão Bênçãos do js/p_cross.js, 136 + 78 por ícone) — com Equip. e Invocar na tela isso dá y 292 a 473 (3 ícones de 48 px, um a
   cada 66). Com o botão Bênçãos da Encruzilhada na tela (.pc-bb), a coluna desce para baixo dele. Para mudar: GrimHud.POS.
   API (window.GrimHud): mount(host?) (host padrão: #fb_w) · update() (chamar no fbTick, 4 vezes por segundo: só troca texto/estilo do que mudou; o HTML dos
   ícones é refeito só quando o conjunto muda) · unmount(). */
(function(){
const ST={root:null,css:false,sig:'',slots:[],top:-1,shown:false};
const POS={left:7,size:48,pitch:66,below:78};   /* px na base 390x844 */
const GB=()=>window.GrimBattle||null;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const CSS=`#grh_root{position:absolute;left:0;top:0;width:0;height:0;z-index:5;pointer-events:none;font-family:Nunito,system-ui,sans-serif}
.grh-s{position:absolute;border-radius:50%;box-shadow:0 2px 0 rgba(0,0,0,.45);background:#1d1611;border:2px solid #6b5a48;box-sizing:border-box;overflow:hidden}
.grh-s .grh-i{position:absolute;left:0;top:0;right:0;bottom:0;display:grid;place-items:center}
.grh-s .grh-i img,.grh-s .grh-i svg{width:100%;height:100%;display:block;object-fit:cover}
.grh-s .grh-l{font:900 20px/1 Nunito,system-ui,sans-serif;color:#ffc94a}
.grh-s .grh-c{position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%}
.grh-s .grh-t{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font:900 15px/1 Nunito,system-ui,sans-serif;color:#fff;text-shadow:0 1px 0 #000,0 0 4px #000}
.grh-s.rdy{border-color:#ffc94a;box-shadow:0 0 10px rgba(255,201,74,.85),0 2px 0 rgba(0,0,0,.45)}`;
function inject(){ if(ST.css) return; try{ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.id='grh_css'; el.textContent=CSS; document.head.appendChild(el); ST.css=true; }catch(e){} }
function iconHtml(id,name){ try{ const D=window.Panels&&Panels.defs&&Panels.defs.grim; if(D&&typeof D.iconOf==='function'){ const h=D.iconOf(id,false); if(h) return h; } }catch(e){}
  return '<span class="grh-l">'+esc(String(name||'?').charAt(0))+'</span>'; }
/* topo da coluna: abaixo do último ícone visível da coluna esquerda; com o botão Bênçãos na tela, abaixo dele */
function topOf(){ let n=0, top=136+78*2;
  try{ if(typeof FB_MENU!=='undefined'&&Array.isArray(FB_MENU)){ for(const m of FB_MENU){ if(m.side!=='left') continue; if(typeof fbUnl==='function'&&!fbUnl(m.id)) continue; if(typeof m.show==='function'&&!m.show()) continue; n++; } top=136+78*n; } }catch(e){}
  try{ const h=ST.root&&ST.root.parentNode, bb=h&&typeof h.querySelector==='function'?h.querySelector('.pc-bb'):null; if(bb&&bb.style){ const t=parseFloat(bb.style.top); if(isFinite(t)) top=Math.max(top,t+POS.below); } }catch(e){}
  return top; }
function mount(hostEl){ if(ST.root) return true; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='grh_root'; r.style.display='none'; h.appendChild(r); ST.root=r; ST.sig=''; ST.slots=[]; ST.top=-1; ST.shown=false; update(); return true; }catch(e){ return false; } }
function unmount(){ const r=ST.root; ST.root=null; ST.sig=''; ST.slots=[]; ST.shown=false; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
function hide(){ if(ST.shown||ST.sig!=='off'){ ST.shown=false; ST.sig='off'; ST.slots=[]; try{ ST.root.innerHTML=''; ST.root.style.display='none'; }catch(e){} } return false; }
/* chamar no fbTick. Devolve true quando a coluna está na tela. */
function update(){ const r=ST.root; if(!r) return false; const G=GB(); let L=null; try{ L=G&&typeof G.list==='function'?G.list():null; }catch(e){ L=null; }
  if(!L||!L.length) return hide();
  let sig=''; for(let i=0;i<L.length&&i<3;i++) sig+=L[i].id+'|';
  const top=topOf();
  if(sig!==ST.sig||top!==ST.top){ ST.sig=sig; ST.top=top; let h='';
    for(let i=0;i<L.length&&i<3;i++) h+='<div class="grh-s" role="img" style="left:'+POS.left+'px;top:'+(top+POS.pitch*i)+'px;width:'+POS.size+'px;height:'+POS.size+'px"><span class="grh-i">'+iconHtml(L[i].id,L[i].name)+'</span><span class="grh-c"></span><span class="grh-t"></span></div>';
    r.innerHTML=h; r.style.display=''; ST.shown=true; ST.slots=[];
    try{ const els=r.children||[]; for(let i=0;i<els.length;i++){ const el=els[i]; ST.slots.push({el:el,c:el.children&&el.children[1],t:el.children&&el.children[2],k:''}); } }catch(e){ ST.slots=[]; } }
  for(let i=0;i<ST.slots.length&&i<L.length;i++){ const s=ST.slots[i], x=L[i], left=Math.max(0,+x.left||0), cd=Math.max(0.001,+x.cd||0), sec=Math.ceil(left), pc=Math.round(Math.min(1,left/cd)*50)*2, k=sec+'|'+pc;   /* anel em passos de 2% */
    if(k===s.k||!s.el) continue; s.k=k;
    try{ if(s.c&&s.c.style) s.c.style.background=left>0?'conic-gradient(rgba(0,0,0,.72) '+pc+'%,rgba(0,0,0,0) '+pc+'%)':'none';
      if(s.t) s.t.textContent=left>0?String(sec):''; s.el.className=left>0?'grh-s':'grh-s rdy';
      if(typeof s.el.setAttribute==='function') s.el.setAttribute('aria-label',String(x.name||'Magia')+(left>0?': recarga, faltam '+sec+' s':': pronta')); }catch(e){} }
  return true; }
/* para o teste e o console: o que a coluna mostra agora */
function peek(){ const G=GB(); let L=null; try{ L=G&&G.list?G.list():null; }catch(e){} return {mounted:!!ST.root,shown:ST.shown,sig:ST.sig,top:ST.top,n:ST.slots.length,keys:ST.slots.map(s=>s.k),list:L?L.map(x=>({id:x.id,left:x.left,cd:x.cd})):null}; }
window.GrimHud={mount:mount,update:update,unmount:unmount,state:ST,POS:POS,topOf:topOf,iconHtml:iconHtml,peek:peek};
})();
