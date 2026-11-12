'use strict';
/* ================= 05 EQUIPAMENTO: "EQUIPAR MELHOR" COM ITENS VOANDO + ARRASTAR DA MOCHILA AO ESPAÇO (pedido do dono; agente B) =================
   Carregado pelo js/screens.js (document.write no fim do arquivo), logo depois dele. Usa o que o screens.js já tem: XG, V, RC, SLOT, SLOTS7, itemOf,
   canEq, gBest, gChange, gToast, iname, slotIcon, ieraV, snd, vib, softRender. Nenhuma conta aqui: quem diz qual item é melhor é o gBest (Sys.fc).
   Chaves: PANEL_V2.equipFly (voo dos itens) e PANEL_V2.equipDrag (arrastar). Com as duas desligadas o Equipamento volta a ser só toque.
   - Voo: um "fantasma" de cada item sai da célula da mochila (ou do botão, se o item estiver em outra página) e pousa no espaço dele; quando o último
     pousa, a troca é aplicada de uma vez e a FC conta do valor antigo ao novo, com realce e "+N" (gChange com {big:true}).
   - Arrastar: pointer events (toque, caneta e mouse). O arrasto só começa depois de 10 px de movimento, então o toque simples continua abrindo a
     comparação como antes. Soltar no espaço do item equipa; em outro espaço ou fora, o item volta para a mochila com animação.
   Os fantasmas ficam no <body> com position:fixed, em coordenadas da janela (getBoundingClientRect): não dependem da escala da tela nem da folha. */
const GFX={ghosts:[],p:null};
const gfxReduce=()=>{ try{ return matchMedia('(prefers-reduced-motion: reduce)').matches; }catch(e){ return false; } };
const gfxT=(x,y,s)=>'translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+(s==null?1:s)+')';
function gGhost(it,r,cls){ const g=document.createElement('div'), c=RC[it.r]||'#ffc94a'; g.className='x-ghost '+(cls||''); g.setAttribute('aria-hidden','true');
  g.style.width=r.width.toFixed(1)+'px'; g.style.height=r.height.toFixed(1)+'px'; g.style.borderColor=c; g.style.borderWidth=Math.max(2,r.width*3/58).toFixed(1)+'px';
  g.style.borderRadius=(r.width*14/58).toFixed(1)+'px'; g.style.background='radial-gradient(circle at 50% 38%,'+c+'55,#120d0a 75%)'; g.style.transform=gfxT(r.left,r.top,1);
  const im=document.createElement('img'); im.alt=''; im.draggable=false; im.src=slotIcon(it.slot,ieraV(it)); g.appendChild(im);
  document.body.appendChild(g); GFX.ghosts.push(g); return g; }
function gGhostKill(g){ if(!g) return; const i=GFX.ghosts.indexOf(g); if(i>=0) GFX.ghosts.splice(i,1); if(g.parentNode) g.parentNode.removeChild(g); }
const gSlotBox=slot=>V.querySelector('[data-slotbox="'+slot+'"]')||V.querySelector('.x-slot[data-slot="'+slot+'"]');
function gLandRing(slot){ const box=V.querySelector('[data-slotbox="'+slot+'"]'); if(!box) return; const r=document.createElement('span'); r.className='x-landring'; r.setAttribute('aria-hidden','true'); box.appendChild(r); setTimeout(()=>{ if(r.parentNode) r.parentNode.removeChild(r); },650); }

/* ---------- EQUIPAR MELHOR ---------- */
function gApplyBest(bst,land){ return gChange(()=>{ S.eq=bst.eq; XG.sel=null; },bst.n===1?'Equipou 1 item melhor':'Equipou '+bst.n+' itens melhores',null,{big:true,land:land||null}); }
function gFlyBest(bst){
  if(XG.fly) return;
  const moves=SLOTS7.filter(s=>bst.eq[s]!=null&&bst.eq[s]!==S.eq[s]).map(s=>({slot:s,it:itemOf(bst.eq[s])})).filter(m=>m.it), land={}; moves.forEach(m=>{ land[m.slot]=1; });
  let left=moves.length, ended=false;
  const apply=()=>{ if(ended) return; ended=true; clearTimeout(XG.flyT); XG.fly=null; GFX.ghosts.slice().forEach(gGhostKill);
    if(view!=='gear') return; const b=gBest(); if(!b.n){ render(); return; } gApplyBest(b,land); };   /* recalcula na hora de aplicar: a mochila pode ter mudado durante o voo */
  if(!PANEL_V2.equipFly||!moves.length||gfxReduce()||typeof document.body.animate!=='function'){ apply(); return; }
  const STEP=110, DUR=640, btn=V.querySelector('[data-bag]')||document.getElementById('xg_best'); XG.fly={t:Date.now()}; snd('ui_tap');
  { const sc=document.getElementById('xg_sc'); if(sc) sc.scrollTop=0; }   /* a vitrine tem de estar à vista para os itens pousarem */
  moves.forEach((m,i)=>{ const cell=V.querySelector('.x-cell[data-id="'+m.it.id+'"]'), box=gSlotBox(m.slot), one=()=>{ if(--left<=0) apply(); };
    if(!box){ one(); return; }
    const tb=box.getBoundingClientRect(), fr=(cell||btn||box).getBoundingClientRect(), sz=tb.width*48/58, to={left:tb.left+(tb.width-sz)/2,top:tb.top+(tb.height-sz)/2};   /* fantasma de 48 px (protótipo), centrado no espaço */
    const x0=fr.left+fr.width/2-sz/2, y0=fr.top+fr.height/2-sz/2, dx=to.left-x0, dy=to.top-y0, lift=46;
    const g=gGhost(m.it,{left:x0,top:y0,width:sz,height:sz}); g.style.opacity='0'; let fin=false;
    const done=()=>{ if(fin) return; fin=true; gGhostKill(g); one(); };   /* nada por pouso: os espaços brilham juntos quando a troca aplica */
    try{ const an=g.animate([
        {transform:gfxT(x0,y0,.9),opacity:0,offset:0},
        {transform:gfxT(x0+dx*.12,y0+dy*.12-lift*.2,.98),opacity:1,offset:.12},
        {transform:gfxT(x0+dx*.55,y0+dy*.55-lift,1.25),opacity:1,offset:.55},
        {transform:gfxT(to.left,to.top,.85),opacity:1,offset:1}],{duration:DUR,delay:i*STEP,easing:'cubic-bezier(.45,0,.3,1)',fill:'both'});
      an.onfinish=done; an.oncancel=done;
    }catch(e){ done(); } });
  XG.flyT=setTimeout(apply,DUR+moves.length*STEP+900);   /* rede de segurança: animação que não terminou (aba em segundo plano) não trava a tela */
}

/* ---------- ARRASTAR DA MOCHILA AO ESPAÇO ---------- */
function gDropAt(x,y){ let best=null, bd=1e9; V.querySelectorAll('[data-slotbox],.x-slot[data-slot="wing"]').forEach(el=>{ const r=el.getBoundingClientRect(), pad=Math.max(8,r.width*0.2);
    if(x<r.left-pad||x>r.right+pad||y<r.top-pad||y>r.bottom+pad) return; const d=Math.hypot(x-(r.left+r.width/2),y-(r.top+r.height/2)); if(d<bd){ bd=d; best=el.dataset.slotbox||el.dataset.slot; } });
  return best; }
function gDragMarks(it){ V.querySelectorAll('[data-slotbox]').forEach(el=>{ const ok=!!it&&el.dataset.slotbox===it.slot&&canEq(it)&&S.eq[it.slot]!==it.id; el.classList.remove('x-drop','x-nodrop','over'); if(it) el.classList.add(ok?'x-drop':'x-nodrop'); }); }
function gDragDown(ev){
  if(!PANEL_V2.equipDrag||view!=='gear'||XG.fly||XG.drag||GFX.p||XG.sel!=null||XG.cf) return;
  if(ev.isPrimary===false||(ev.pointerType==='mouse'&&ev.button!==0)) return;
  const b=ev.target&&ev.target.closest?ev.target.closest('.x-cell[data-id]'):null; if(!b||!V.contains(b)) return; const it=itemOf(+b.dataset.id); if(!it) return;
  GFX.p={id:it.id,pid:ev.pointerId,x:ev.clientX,y:ev.clientY,cell:b,on:false,touch:ev.pointerType==='touch'}; }
function gDragStart(p){ const it=itemOf(p.id); if(!it){ GFX.p=null; return false; } const r=p.cell.getBoundingClientRect();
  p.on=true; p.w=r.width; p.h=r.height; p.home={left:r.left,top:r.top}; p.lift=0;   /* protótipo: o item fica centrado no dedo */
  p.g=gGhost(it,r,'drag'); if(p.cell.parentNode) p.cell.parentNode.classList.add('x-dragsrc'); XG.drag=it.id; gDragMarks(it); snd('ui_tap');
  { const sc=document.getElementById('xg_sc'); if(sc&&sc.scrollTop>0){ try{ sc.scrollTo({top:0,behavior:'smooth'}); }catch(e){ sc.scrollTop=0; } } }   /* tela baixa: a vitrine sobe para os espaços de cima ficarem ao alcance */
  return true; }
function gDragMove(ev){ const p=GFX.p; if(!p||ev.pointerId!==p.pid) return; const dx=ev.clientX-p.x, dy=ev.clientY-p.y;
  if(!p.on){ if(Math.abs(dx)+Math.abs(dy)<8) return; if(!gDragStart(p)) return; }
  if(ev.cancelable) ev.preventDefault();
  const cx=ev.clientX, cy=ev.clientY-p.lift; p.g.style.transform=gfxT(cx-p.w/2,cy-p.h/2,1.1)+' rotate(-4deg)';
  const over=gDropAt(cx,cy); if(over!==p.over){ p.over=over; V.querySelectorAll('[data-slotbox].x-drop').forEach(el=>el.classList.toggle('over',el.dataset.slotbox===over)); } }
function gDragEnd(ev,cancel){ const p=GFX.p; if(!p||ev.pointerId!==p.pid) return; GFX.p=null; if(!p.on) return;   /* não chegou a arrastar: é um toque, o clique segue normal */
  XG.noClick=Date.now()+450; const it=itemOf(p.id), cx=ev.clientX, cy=ev.clientY-p.lift, slot=cancel?null:gDropAt(cx,cy), g=p.g; gDragMarks(null);
  const ok=!!it&&slot===it.slot&&canEq(it)&&S.eq[it.slot]!==it.id; let fin=false;
  const finish=()=>{ if(fin) return; fin=true; gGhostKill(g); XG.drag=null; const src=V.querySelector('.x-dragsrc'); if(src) src.classList.remove('x-dragsrc');
    if(view!=='gear') return;
    if(ok&&itemOf(it.id)&&canEq(it)){ const land={}; land[slot]=1; delete it.nw; gChange(()=>{ S.eq[it.slot]=it.id; XG.sel=null; },'Equipado: '+iname(it),null,{land,big:true}); }
    else softRender(); };
  if(!ok&&it&&slot){ snd('ui_tap');
    if(slot!==it.slot) gToast('Esse item vai no espaço '+SLOT[it.slot].n);
    else if(!canEq(it)) gToast('Asa: libera no nível '+Sys.stats.DATA.wing.minLevel+(it.r<Sys.stats.DATA.wing.minR?' (e só Épica ou acima)':''));
    else gToast('Já está equipado'); }
  let to=null; if(ok){ const box=gSlotBox(slot); if(box){ const r=box.getBoundingClientRect(); to={left:r.left+(r.width-p.w)/2,top:r.top+(r.height-p.h)/2}; } }
  if(!to){ const c=V.querySelector('.x-cell[data-id="'+p.id+'"]'), r=c?c.getBoundingClientRect():null; to=r?{left:r.left,top:r.top}:p.home; }   /* a mochila pode ter rolado: volta para onde a célula está agora */
  try{ if(gfxReduce()||typeof g.animate!=='function') throw 0;
    const an=g.animate([{transform:g.style.transform},{transform:gfxT(to.left,to.top,ok?1:.92)}],{duration:ok?150:240,easing:ok?'ease-in':'cubic-bezier(.2,1.2,.4,1)',fill:'forwards'});
    an.onfinish=finish; an.oncancel=finish; setTimeout(finish,500);
  }catch(e){ finish(); } }
V.addEventListener('pointerdown',gDragDown);
addEventListener('pointermove',gDragMove,{passive:false});
addEventListener('pointerup',ev=>gDragEnd(ev,false));
addEventListener('pointercancel',ev=>gDragEnd(ev,true));
/* nada de arrasto nativo de imagem nem menu de toque longo dentro das telas cheias (atrapalham o arrastar no celular) */
V.addEventListener('dragstart',ev=>{ if(ev.target&&ev.target.closest&&ev.target.closest('.xs')) ev.preventDefault(); });
V.addEventListener('contextmenu',ev=>{ if(ev.target&&ev.target.closest&&ev.target.closest('.xs')) ev.preventDefault(); });
/* tela fechada ou redimensionada no meio de um voo/arrasto: limpa os fantasmas */
addEventListener('resize',()=>{ if(GFX.p&&GFX.p.on){ const p=GFX.p; GFX.p=null; gGhostKill(p.g); XG.drag=null; gDragMarks(null); } });
