'use strict';
/* ================= MAGIAS DO GRIMÓRIO NA BATALHA: COLUNA DE 3 ÍCONES COM ANEL DE RECARGA — arquivo novo, escopo próprio =================
   Só aparece com a chave do módulo ligada (Sys.grimoire.DATA.on) E com magia no conjunto do modo: quem diz isso é a batalha (window.GrimBattle, js/battle.js).
   NENHUMA regra nem número de jogo aqui: a lista viva {id, name, cd, left} (recarga total e segundos que faltam) vem de GrimBattle.list(); o ícone de cada magia
   é o da tela do Grimório (Panels.defs.grim.iconOf(id), js/p_grim.js; sem ela, um círculo com a inicial). As magias lançam SOZINHAS: a coluna é só leitura
   (não é botão, não recebe toque e não cobre toque de ninguém: pointer-events none).
   ONDE FICA (base 390x844 do #fb_w do js/fullbattle.js): coluna da ESQUERDA, x 7 a 55, logo ABAIXO do último ícone visível da coluna esquerda (Equip., Invocar,
   Loja, Passe: mesma conta do botão Bênçãos do js/p_cross.js, 136 + 78 por ícone) — com Equip. e Invocar na tela isso dá y 292 a 473 (3 ícones de 48 px, um a
   cada 66). Com o botão Bênçãos da Encruzilhada na tela (.pc-bb), a coluna desce para baixo dele. Para mudar: GrimHud.POS.
   NADA COBRE NADA (place()): a coluna respeita três vizinhos, lidos da tela a cada batida:
   - as barras do herói (#fb_kb, 128 px a partir de x 44): quando a coluna cruza a altura delas, os ícones encolhem para caber à esquerda (x 3 a 41);
   - o fundo da coluna esquerda (o mesmo limite do js/fullbattle.js: 188 px acima do fundo) e a fila x1/x2/x4 que a Fogueira deita à esquerda em tela baixa;
   - sem altura para os 3 (nem com os ícones encostados), eles viram uma FILA DEITADA no canto direito, abaixo do Baú (ao lado da coluna x1/x2/x4, se ela estiver lá).
   API (window.GrimHud): mount(host?) (host padrão: #fb_w) · update() (chamar no fbTick, 4 vezes por segundo: só troca texto/estilo do que mudou; o HTML dos
   ícones é refeito só quando o conjunto muda) · unmount(). */
(function(){
const ST={root:null,css:false,sig:'',slots:[],top:-1,shown:false};
const POS={left:7,size:48,pitch:66,below:78,keep:188,gap:6,edge:3,min:32,kbH:26,rowTop:232};   /* px na base 390x844. keep = faixa de baixo que a coluna esquerda não usa; kbH = altura das barras do herói; rowTop = topo da fila deitada à direita */
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
const px=v=>{ const n=parseFloat(v); return isFinite(n)?n:NaN; };
const gid=id=>{ try{ return typeof document!=='undefined'&&typeof document.getElementById==='function'?document.getElementById(id):null; }catch(e){ return null; } };
/* onde os n ícones ficam agora: {dir:'v'|'h', x, y, size, pitch, top}. Só LÊ a tela (estilos que o fullbattle e a Fogueira escrevem); sem eles, vale o lugar do protótipo */
function place(n){ const top=topOf(); let size=POS.size, left=POS.left, Hb=844, Wb=390, fbt=44, spCol=0;
  try{ const h=ST.root&&ST.root.parentNode, hs=h&&h.style; if(hs){ const a=px(hs.height), b=px(hs.width); if(a>0) Hb=a; if(b>0) Wb=b; } }catch(e){}
  try{ const a=gid('app'), v=a&&a.style&&typeof a.style.getPropertyValue==='function'?px(a.style.getPropertyValue('--fbt')):NaN; if(v>0) fbt=v; }catch(e){}
  let lim=Hb-POS.keep;
  /* x1/x2/x4: a Fogueira escreve o lugar no pai do #fb_spd (direita = coluna; esquerda com topo em px = fila deitada em tela baixa) */
  try{ const sp=gid('fb_spd'), ps=sp&&sp.parentNode&&sp.parentNode.style, t=ps?px(ps.top):NaN; if(isFinite(t)){ if(ps.right) spCol=fbt+6+POS.gap; else if(ps.left) lim=Math.min(lim,t-POS.gap); } }catch(e){}
  /* barras do herói: cruzando a altura delas, os ícones cabem na faixa à esquerda das barras (ou a coluna para antes delas) */
  try{ const kb=gid('fb_kb'), ks=kb&&kb.style, kl=ks?px(ks.left):NaN, kt=ks?px(ks.top):NaN;
    if(isFinite(kl)&&isFinite(kt)&&kl<left+size&&kt+POS.kbH>top&&kt<top+POS.pitch*(n-1)+size){ const s2=Math.floor(kl-2-POS.edge); if(s2>=POS.min){ size=Math.min(size,s2); left=POS.edge; } else lim=Math.min(lim,kt-POS.gap); } }catch(e){}
  for(const pitch of [POS.pitch,size+4]) if(top+pitch*(n-1)+size<=lim) return {dir:'v',x:left,y:top,size:size,pitch:pitch,top:top};
  /* não cabe em pé: fila deitada à direita, abaixo do último ícone visível desse lado (a mesma conta da coluna x1/x2/x4 do js/fogueira.js) */
  let y=POS.rowTop; try{ if(typeof FB_MENU!=='undefined'&&Array.isArray(FB_MENU)) for(const m of FB_MENU){ if(m.side!=='right') continue; const e=gid('fbm_'+m.id); if(!e||!e.style||e.style.display==='none') continue; y=Math.max(y,(m.cy!=null?m.cy:m.y)+62+8); } }catch(e){}
  const pitch=POS.size+POS.gap; return {dir:'h',x:Wb-6-spCol-(pitch*(n-1)+POS.size),y:y,size:POS.size,pitch:pitch,top:top}; }
function mount(hostEl){ if(ST.root) return true; try{ if(typeof document==='undefined') return false; const h=hostEl||document.getElementById('fb_w'); if(!h) return false; inject();
    const r=document.createElement('div'); r.id='grh_root'; r.style.display='none'; h.appendChild(r); ST.root=r; ST.sig=''; ST.slots=[]; ST.top=-1; ST.shown=false; update(); return true; }catch(e){ return false; } }
function unmount(){ const r=ST.root; ST.root=null; ST.sig=''; ST.slots=[]; ST.shown=false; try{ if(r){ if(typeof r.remove==='function') r.remove(); else if(r.parentNode) r.parentNode.removeChild(r); } }catch(e){} }
function hide(){ if(ST.shown||ST.sig!=='off'){ ST.shown=false; ST.sig='off'; ST.slots=[]; try{ ST.root.innerHTML=''; ST.root.style.display='none'; }catch(e){} } return false; }
/* chamar no fbTick. Devolve true quando a coluna está na tela. */
function update(){ const r=ST.root; if(!r) return false; const G=GB(); let L=null; try{ L=G&&typeof G.list==='function'?G.list():null; }catch(e){ L=null; }
  if(!L||!L.length) return hide();
  let sig=''; for(let i=0;i<L.length&&i<3;i++) sig+=L[i].id+'|';
  const P=place(Math.min(3,L.length)), top=P.top, pk=P.dir+'|'+Math.round(P.x)+'|'+Math.round(P.y)+'|'+P.size+'|'+P.pitch;
  if(sig!==ST.sig||pk!==ST.pk){ ST.sig=sig; ST.top=top; ST.pk=pk; ST.place=P; let h='';
    for(let i=0;i<L.length&&i<3;i++) h+='<div class="grh-s" role="img" style="left:'+Math.round(P.x+(P.dir==='h'?P.pitch*i:0))+'px;top:'+Math.round(P.y+(P.dir==='v'?P.pitch*i:0))+'px;width:'+P.size+'px;height:'+P.size+'px"><span class="grh-i">'+iconHtml(L[i].id,L[i].name)+'</span><span class="grh-c"></span><span class="grh-t"></span></div>';
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
window.GrimHud={mount:mount,update:update,unmount:unmount,state:ST,POS:POS,topOf:topOf,place:place,iconHtml:iconHtml,peek:peek};
})();
