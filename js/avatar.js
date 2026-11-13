/* js/avatar.js (agente B) — RETRATO DO HERÓI (decisão final do dono: não há fases; o avatar é o retrato da SKIN EQUIPADA do herói).
   BASE: os 8 retratos prontos da Arte em assets/hero/avatar/ (<kael|kaia>_phase<0..3>.png, 256×256, fundo transparente) + avatars.json
   (por retrato, a âncora "head" {x, y, ang, s} em pixels do retrato). Qual retrato: Sys.appearance.avatarKey(S, host) (ver keyOf); sem a função,
   o padrão do herói: kael_phase0 (garoto) / kaia_phase0 (menina), por S.hero. A reserva pela folha parada usa o que o Sys.appearance.sheetFor devolver.
   CAMADAS DE CABEÇA (DESLIGADAS pela chave AVATAR_PIECES, decisão final do dono: o avatar é só o rosto do retrato; o texto abaixo vale se religar): o que Sys.appearance.layers(S, Sys.host) devolver, na ordem dele (o "ocultar" já vem aplicado lá):
     {layer:'hat', hat:'era3'} ou {layer:'hat', era:3} → assets/anim/equip/hats/hats.json (hats['era3']);
     {layer:'glasses'|'mask', cos:'visor'} ou {source:'cos', id:'visor'} → assets/anim/equip/cos/cos.json (items['visor']).
   Desenho de cada peça: translate(head.x, head.y) · rotate(head.ang graus) · scale(head.s / res) · drawImage(png, -pivot.x, -pivot.y).
   RESERVA: enquanto o retrato carrega → o retrato de antes (Kael parado da pasta R) ou, antes dele, um busto desenhado. Se o retrato da Arte FALTAR →
   recorte do rosto na folha parada da fase (Sys.appearance.sheetFor + âncora do <masks>_head.json conferida nos pixels), sem camadas. Nunca vazio.

   API (global):
     avatarFor(S, size)        → <canvas> novo, de size px (CSS), já pintado; ele se repinta sozinho quando as imagens chegam ou o herói muda
     avatarTag(size, css, alt) → HTML '<canvas data-av="size">' para telas de texto (template); o arquivo pinta todo canvas[data-av] que entra na página
     avatarUrl(S, size)        → dataURL do retrato pronto ('' enquanto não está)
     avatarRefresh()           → repinta os retratos da página (há conferência sozinha a cada 1 s)
     evento window 'avatarready' (detail.key) e avatarOnReady(fn): as imagens de um retrato terminaram de carregar
     avatarInfo()              → o que carregou e de onde saiu cada retrato (para o QA) */
(function(){
'use strict';
const W=typeof window!=='undefined'?window:null; if(!W||typeof document==='undefined') return;
const AV={K:2.8,DY:0.08,MIN:64,PADS:[96,-96],/* RESERVA por herói: {img = folha parada que existe, json = o .json QUE EXISTE dela (o kael_idle_era2_t0 só tem .png: o json é o do corpo, mesma grade
     de 12 quadros de 256), head = âncora da cabeça}. Achado do engenheiro: pedir kael_idle_era2_t0.json dava 404. */
  RES:{kael:{img:'assets/anim/hyb/R/kael_idle_era2_t0.png',json:'assets/anim/hyb/R/kael_idle_body.json',head:'assets/anim/hyb/R/masks/kael_idle_head.json'},
       kaia:{img:'assets/anim/hyb/kaia/kaia_idle_body.png',json:'assets/anim/hyb/kaia/kaia_idle_body.json',head:'assets/anim/hyb/kaia/masks/kaia_idle_head.json'}},
  DIR:'assets/hero/avatar/',HATS:'assets/anim/equip/hats/',COS:'assets/anim/equip/cos/'};
/* PEÇAS DE CABEÇA (chapéu, óculos, máscara) por cima do retrato. DECISÃO FINAL DO DONO: o avatar é SÓ o rosto da fase, sem peça nenhuma → false.
   Desligada: não lê hats.json nem cos.json, não carrega imagem de peça e não consulta Sys.appearance.layers. O código fica para o futuro (true religa). */
const AVATAR_PIECES=false;
const res={}, cache=new Map(), live=[], cbs=[], imgs={}, META={st:0,av:null,hats:null,cos:null};
const dpr=()=>Math.min(W.devicePixelRatio||1,2);
const mk=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };
const getJson=u=>(typeof fetch==='function'?fetch(u).then(r=>r&&r.ok?r.json():null).catch(()=>null):Promise.resolve(null));
const getImg=u=>new Promise(ok=>{ if(typeof Image==='undefined'){ ok(null); return; } const i=new Image(); i.onload=()=>ok(i); i.onerror=()=>ok(null); i.src=u; });
const gS=()=>{ try{ return typeof S!=='undefined'?S:null; }catch(e){ return null; } };   /* o save do jogo (global do index.html) */

/* folha + json + âncora da cabeça: carrega uma vez por caminho. st: 0 carregando, 1 pronto, 2 faltou arquivo */
function need(base,headUrl,o){ let r=res[base]; if(r) return r; r=res[base]={st:0,base};
  Promise.all([getImg(o&&o.img?o.img:base+'.png'),getJson(o&&o.json?o.json:base+'.json'),headUrl?getJson(headUrl):Promise.resolve(null)]).then(a=>{
    if(!a[0]){ r.st=2; fire(base); return; } r.img=a[0]; r.meta=a[1]||{}; try{ measure(r,a[2]); r.st=1; }catch(e){ r.st=2; } fire(base); });
  return r; }
/* mede o quadro 0: topo da figura e a âncora conferida */
function measure(r,hj){ const M=r.meta, n=M.frames>0?M.frames:12, w=M.w>0?M.w:Math.round(r.img.width/n), h=M.h>0?M.h:r.img.height, fy=typeof M.feetY==='number'?M.feetY:243;
  r.w=w; r.h=h; r.pad=M.padLeft||0; r.fy=fy;
  const a0=hj&&hj.head&&hj.head[0], has=a0&&typeof a0.x==='number'&&typeof a0.y==='number';
  let px=null; try{ const c=mk(w,h), x=c.getContext('2d'); x.drawImage(r.img,0,0,w,h,0,0,w,h); px=x.getImageData(0,0,w,h).data; }catch(e){ px=null; }
  const L=locate(px,w,h,fy,r.pad,has?a0:null); r.hx=L.hx; r.hy=L.hy; r.hh=L.hh; r.note=L.note; }
/* (pixels RGBA do quadro 0 ou null, largura, altura, linha dos pés, padLeft, âncora {x,y} ou null) → {hx, hy, hh, note} */
function locate(px,w,h,fy,pad,a0){ const has=!!a0; let hx=has?a0.x:null, hy=has?a0.y:null, top=null, note=has?'ancora':'sem ancora';
  if(px){ const span=y=>{ let a=w,b=-1; y=Math.round(y); if(y<0||y>=h) return null; for(let x=0;x<w;x++) if(px[(y*w+x)*4+3]>40){ if(x<a) a=x; b=x; } return b<0?null:[a,b]; };
    for(let y=0;y<h&&top===null;y++){ const s=span(y); if(s&&s[1]-s[0]>=2) top=y; }
    if(top===null) top=0;
    const inside=(x,y)=>{ const s=span(y); return !!s&&x>=s[0]-6&&x<=s[1]+6; };
    if(has&&!inside(hx,hy)){ let fixed=false; for(const d of AV.PADS){ if(inside(hx-d,hy)){ hx-=d; fixed=true; note='ancora corrigida em '+(-d)+' px (fora da figura)'; break; } } if(!fixed) hx=null; }
    if(hx===null){ hy=Math.round(top+0.2*(fy-top)); let sa=0,sn=0; for(let y=top+2;y<=hy;y+=2){ const s=span(y); if(s){ sa+=(s[0]+s[1])/2; sn++; } } hx=sn?sa/sn:w/2; note='cabeca pelo topo da figura (ancora fora ou ausente)'; } }
  else { if(hx===null){ hx=pad+128; hy=fy-170; note='sem leitura de pixels e sem ancora'; } top=hy-45; }
  return {hx,hy,hh:Math.max(14,hy-top),note}; }
/* quadrado do recorte, na grade da célula */
function box(r){ const c=Math.max(AV.MIN,AV.K*r.hh); return {c,x0:r.hx-c/2,y0:r.hy+AV.DY*c-c/2}; }
function sheetFor(sv){ try{ const A=W.Sys&&Sys.appearance; if(A&&typeof A.sheetFor==='function'){ const sh=A.sheetFor(sv,Sys.host,'idle'); if(sh&&sh.body) return sh; } }catch(e){} return null; }
function build(key,r,sh,sv,px){ const B0=box(r), F=px/B0.c, a=mk(px,px), x=a.getContext('2d'); x.imageSmoothingEnabled=true; try{ x.imageSmoothingQuality='high'; }catch(e){}
  x.drawImage(r.img,0,0,r.w,r.h,-B0.x0*F,-B0.y0*F,r.w*F,r.h*F);
  const e={canvas:a,url:null,src:sh?'folha':'reserva'}; cache.set(key,e); return e; }
/* busto desenhado: só enquanto nem a reserva carregou */
function bust(px){ const c=mk(px,px), x=c.getContext('2d'); x.fillStyle='#6b5843'; x.beginPath(); x.arc(px/2,px*0.4,px*0.2,0,7); x.fill(); x.beginPath(); x.ellipse(px/2,px*0.98,px*0.36,px*0.3,0,0,7); x.fill(); return {canvas:c,url:null,src:'busto'}; }
const resHero=sv=>sv&&sv.hero==='kaia'?'kaia':'kael';
const needRes=h=>{ const R=AV.RES[h]||AV.RES.kael; return need('res:'+h,R.head,R); };
function reserve(px,sv){ const h=resHero(sv), k='res|'+h+'|'+px, e=cache.get(k); if(e) return {e,key:k}; const r=needRes(h); if(r.st===1) return {e:build(k,r,null,null,px),key:k};
  const kb='bust|'+px; let eb=cache.get(kb); if(!eb){ eb=bust(px); cache.set(kb,eb); } return {e:eb,key:kb}; }
/* ---------- retratos prontos da Arte + camadas de cabeça ---------- */
function meta(){ if(META.st) return; META.st=1; Promise.all([getJson(AV.DIR+'avatars.json'),AVATAR_PIECES?getJson(AV.HATS+'hats.json'):Promise.resolve(null),AVATAR_PIECES?getJson(AV.COS+'cos.json'):Promise.resolve(null)]).then(a=>{
  META.av=a[0]&&a[0].items?a[0]:null; META.hats=(a[1]&&a[1].hats)||{}; META.cos=(a[2]&&a[2].items)||{}; META.st=META.av?2:3; fire('meta'); }); }
function pic(url){ let o=imgs[url]; if(o) return o; o=imgs[url]={st:0,img:null}; getImg(url).then(i=>{ o.img=i; o.st=i?1:2; fire(url); }); return o; }
/* QUAL RETRATO (decisão final do dono: NÃO há mais fases; o padrão é o garoto/a menina para sempre e o adulto e o guerreiro são SKINS equipáveis):
   Sys.appearance.avatarKey(S, host) → 'kael_phase0' | 'kael_phase2' | … (o retrato da skin equipada), quando o módulo tiver a função e a chave existir no
   avatars.json; senão, o retrato padrão do herói (kael_phase0 / kaia_phase0). Não lê mais Sys.phaseUp. */
function keyOf(sv,items){ const def=(sv&&sv.hero==='kaia'?'kaia':'kael')+'_phase0'; let k=null; items=items||(META.av&&META.av.items)||null;
  try{ const M=W.Sys&&Sys.appearance; if(M&&typeof M.avatarKey==='function') k=M.avatarKey(sv,Sys.host); }catch(e){ k=null; }
  return typeof k==='string'&&items&&items[k]?k:def; }
/* peças de cabeça do herói, na ordem do módulo: [{k, url, m:{pivot, res}}] (m = entrada do hats.json / cos.json) */
function headLayers(sv){ const out=[]; if(!AVATAR_PIECES) return out; let L=[]; try{ L=Sys.appearance.layers(sv,Sys.host)||[]; }catch(e){ L=[]; }
  for(const l of L){ if(!l) continue;
    if(l.layer==='hat'){ const id=l.hat||(l.era!=null?'era'+l.era:null), m=id&&META.hats[id]; if(m&&m.file) out.push({k:'hat/'+id,url:AV.HATS+m.file,m}); }
    else if(l.layer==='glasses'||l.layer==='mask'){ const id=l.cos||(l.source==='cos'?l.id:null), m=id&&META.cos[id]; if(m&&m.file) out.push({k:l.layer+'/'+id,url:AV.COS+m.file,m}); } }
  return out; }
function compose(key,img,size,head,parts,px){ const c=mk(px,px), x=c.getContext('2d'), F=px/size; x.imageSmoothingEnabled=true; try{ x.imageSmoothingQuality='high'; }catch(e){}
  x.scale(F,F); x.drawImage(img,0,0,size,size);
  if(head) for(const p of parts){ const pv=p.m.pivot||{x:0,y:0}, k=(+head.s||1)/(+p.m.res||1); x.save(); x.translate(+head.x||0,+head.y||0); x.rotate((+head.ang||0)*Math.PI/180); x.scale(k,k); x.drawImage(p.img,-pv.x,-pv.y); x.restore(); }
  const e={canvas:c,url:null,src:'retrato'+(parts.length?' + '+parts.map(p=>p.k).join(' + '):'')}; cache.set(key,e); return e; }
/* recorte da folha parada: só quando o retrato da Arte falta */
function fromSheet(sv,px){ const sh=sheetFor(sv); if(!sh) return reserve(px,sv); const r=need(sh.body,sh.masks+'_head.json'); if(r.st!==1) return reserve(px,sv);
  const key='folha|'+sh.hero+'|'+sh.stage+'|'+px; return {e:cache.get(key)||build(key,r,sh,sv,px),key,ok:true}; }
/* o melhor retrato de agora para este save e tamanho: {e:{canvas}, key, ok} */
let bM=null;   /* a mesma resposta vale por 150 ms (vários retratos na mesma tela não refazem a conta); zera quando uma imagem chega */
function best(sv,px){ const now=Date.now(); if(bM&&bM.sv===sv&&bM.px===px&&now-bM.t<150) return bM.r; const r=best0(sv,px); bM={sv,px,t:now,r}; return r; }
function best0(sv,px){ if(!sv) return reserve(px,sv); meta(); if(META.st<2) return reserve(px,sv); if(META.st===3) return fromSheet(sv,px);
  const id=keyOf(sv), it=META.av.items[id]; if(!it||!it.file) return fromSheet(sv,px);
  const P=pic(AV.DIR+it.file); if(P.st===0) return reserve(px,sv); if(P.st===2) return fromSheet(sv,px);
  /* peças: a que ainda está carregando fica de fora por enquanto (o retrato é refeito quando ela chega); a que falta fica de fora de vez */
  const parts=[]; let pend=0; for(const h of headLayers(sv)){ const I=pic(h.url); if(I.st===1) parts.push({k:h.k,m:h.m,img:I.img}); else if(I.st===0) pend++; }
  const key=id+'|'+parts.map(p=>p.k).join(',')+(pend?'|+'+pend:'')+'|'+px;
  return {e:cache.get(key)||compose(key,P.img,+META.av.size||P.img.width||256,it.head,parts,px),key,ok:true}; }
function paint(c,sv){ const size=+c.dataset.av||48, px=Math.max(8,Math.round(size*dpr())), b=best(sv||gS(),px);
  if(c.__ave===b.e&&c.width===px) return; if(c.width!==px||c.height!==px){ c.width=px; c.height=px; }
  const x=c.getContext('2d'); x.clearRect(0,0,px,px); x.drawImage(b.e.canvas,0,0,px,px); c.__ave=b.e; c.__avk=b.key; }
function track(c,sv){ live.push({ref:typeof WeakRef==='function'?new WeakRef(c):{deref:()=>c},own:sv&&sv!==gS()?sv:null,t:Date.now()}); if(live.length>80) prune(); }
function prune(){ const now=Date.now(); for(let i=live.length-1;i>=0;i--){ const c=live[i].ref.deref(); if(!c||(!c.isConnected&&now-live[i].t>15000)) live.splice(i,1); } }
function repaint(){ prune(); for(const L of live){ const c=L.ref.deref(); if(c) try{ paint(c,L.own); }catch(e){} } scan(); }
function scan(){ let l; try{ l=document.querySelectorAll('canvas[data-av]'); }catch(e){ return; } for(const c of l){ if(!c.__avt){ c.__avt=1; track(c,null); } try{ paint(c,null); }catch(e){} } }
let fireT=0;
function fire(key){ bM=null; if(fireT) return; fireT=setTimeout(()=>{ fireT=0; repaint(); try{ W.dispatchEvent(new CustomEvent('avatarready',{detail:{key}})); }catch(e){} for(const f of cbs) try{ f(key); }catch(e){} },0); }

W.avatarFor=function(sv,size){ size=+size>0?+size:48; const c=document.createElement('canvas'); c.dataset.av=String(size); c.style.width=size+'px'; c.style.height=size+'px'; c.style.display='block';
  try{ paint(c,sv||gS()); }catch(e){ try{ const px=Math.round(size*dpr()); c.width=c.height=px; c.getContext('2d').drawImage(bust(px).canvas,0,0); }catch(e2){} }
  c.__avt=1; track(c,sv); return c; };
W.avatarTag=function(size,css,alt){ size=+size>0?+size:48; const px=Math.round(size*dpr());
  return '<canvas data-av="'+size+'" width="'+px+'" height="'+px+'" '+(alt?'role="img" aria-label="'+String(alt).replace(/[&<>"]/g,'')+'"':'aria-hidden="true"')+' style="width:'+size+'px;height:'+size+'px;display:block;'+(css||'')+'"></canvas>'; };
W.avatarUrl=function(sv,size){ try{ const px=Math.max(8,Math.round((+size>0?+size:48)*dpr())), b=best(sv||gS(),px); if(!b.ok) return ''; if(!b.e.url) b.e.url=b.e.canvas.toDataURL('image/png'); return b.e.url; }catch(e){ return ''; } };
W.avatarRefresh=function(){ bM=null; repaint(); };   /* Engenheiro 15: quem pede o retrato de novo (herói/skin mudou: heroChanged) não recebe a resposta guardada dos últimos 150 ms */
W.avatarOnReady=function(fn){ if(typeof fn==='function') cbs.push(fn); };
W.avatarLocate=locate;
W.avatarKeyOf=keyOf;   /* (S, itens do avatars.json) → chave do retrato; para o teste e o QA */
W.avatarInfo=function(){ const o={}; for(const k in res){ const r=res[k]; o[k]={st:r.st,hx:r.hx,hy:r.hy,hh:r.hh,note:r.note}; } const im={}; for(const k in imgs) im[k]=imgs[k].st;
  return {meta:META.st,imagens:im,folhas:o,retratos:Array.from(cache.entries()).map(e=>e[0]+' ['+e[1].src+']')}; };   /* para o QA conferir */

needRes('kael'); meta();   /* a reserva e as tabelas dos retratos já vêm carregando */
try{ if(typeof MutationObserver==='function'){ new MutationObserver(ms=>{ for(const m of ms) if(m.addedNodes&&m.addedNodes.length){ scan(); break; } }).observe(document.documentElement,{childList:true,subtree:true}); } }catch(e){}
try{ setInterval(()=>{ if(live.length) repaint(); },1000); }catch(e){}   /* fase, herói ou camada mudou com o retrato na tela (ex.: cabeçalho): repinta sem a tela precisar avisar */
})();
