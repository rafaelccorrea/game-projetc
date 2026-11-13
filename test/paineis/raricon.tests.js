/* Testes do ÍCONE DE PEÇA POR RARIDADE, "opção C" (xRarIco / XRI no js/screens.js; chave PANEL_V2.rarIcons). Carregado pelo smoke.js dentro do
   mesmo vm do jogo (não roda sozinho). Cada função devolve um texto curto ou LANÇA erro. Sem navegador não há canvas nem imagem: os ganchos
   XRI.cv / img / url / sched são trocados por versões falsas que anotam o que foi desenhado; a pintura (xriPaint) e a fila são as reais.
   Cada teste devolve a chave, o cache e os ganchos como estavam. */
var RARICON_TESTS=(function(){
  const T={};
  function fakeCv(s){ const ops=[], c={width:s,height:s,ops:ops,blur:0,tint:0,
    getContext:function(){ return {save:function(){},restore:function(){},putImageData:function(){ fakeCv.tint=(fakeCv.tint||0)+1; },
      getImageData:function(x,y,w,h){ const d=new Uint8Array(16); for(let i=0;i<16;i++) d[i]=200; return {data:d}; },
      drawImage:function(im,x,y,w,h){ ops.push({im:im,x:x,y:y,w:w,h:h}); if(this.shadowBlur>0) c.blur=this.shadowBlur; },shadowBlur:0,shadowColor:''}; }};
    return c; }
  /* liga a chave com ganchos falsos; fn recebe o ambiente {pend (quadros agendados), made (canvas exportados), step(), all(), fail} */
  function withOn(fn){ const h0={cv:XRI.cv,img:XRI.img,url:XRI.url,sched:XRI.sched}, on0=PANEL_V2.rarIcons, q0=document.querySelectorAll, I0=window.Image; let out, err=null;
    const env={pend:[],made:[],fail:null,imgs:0};
    env.step=function(){ const f=env.pend.shift(); if(f) f(); return !!f; }; env.all=function(){ let n=0; while(env.step()&&n<999) n++; return n; };
    try{ XRI.c={}; XRI.q=[]; XRI.busy=false; XRI.n=0; XRI.seq=0; XRI.gem=[];
      XRI.cv=fakeCv; XRI.sched=function(f){ env.pend.push(f); };
      XRI.img=function(src,cb){ env.imgs++; cb(env.fail&&env.fail(src)?null:{src:src,width:240,height:240}); };
      XRI.url=function(c,cb){ env.made.push(c); cb('blob:teste/'+env.made.length); };
      window.Image=function(){ return {}; };
      PANEL_V2.rarIcons=true; out=fn(env); }catch(e){ err=e; }
    XRI.cv=h0.cv; XRI.img=h0.img; XRI.url=h0.url; XRI.sched=h0.sched; PANEL_V2.rarIcons=on0; document.querySelectorAll=q0; window.Image=I0;
    XRI.c={}; XRI.q=[]; XRI.busy=false; XRI.n=0; XRI.seq=0; XRI.gem=[];
    XG.sel=null; XG.tw=null; XG.cf=null; if(err) throw err; return out; }
  const bad=h=>{ if(/undefined|NaN|\[object/.test(h)) throw new Error('undefined/NaN no HTML: '+(h.match(/.{50}(undefined|NaN|\[object).{30}/)||[''])[0]); return h; };
  /* as telas com ícone de peça: Equipamento, comparação, Loja (itens em ouro e a confirmação), Invocar, Passe e Forja */
  const VIEWS={
    'equipamento':function(){ XG.sel=null; XG.tw=null; XG.cf=null; XG.filter='all'; XG.page=0; view='gear'; },
    'comparação':function(){ XG.tw=null; XG.cf=null; const it=S.inv.find(x=>S.eq[x.slot]!==x.id&&x.r>=1)||S.inv[0]; XG.sel=it.id; view='gear'; },
    'loja de itens':function(){ XG.sel=null; XH.tab='item'; XH.sel=null; XH.cf=null; view='shop'; },
    'loja: confirmação':function(){ XH.tab='item'; XH.sel=null; XH.cf={kind:'item',i:0}; view='shop'; },
    'passe':function(){ XH.cf=null; passTab='pass'; XP.cf=false; view='pass'; },
    'forja':function(){ if(!(window.Panels&&Panels.defs.forge&&Panels.on('forge'))) return false; view='forge'; } };
  function draw(k){ if(VIEWS[k]()===false) return null; render(); render();   /* 2 vezes: o 1º desenho de uma tela/aba leva a animação de entrada */ const h=V_TEST.innerHTML; XG.sel=null; XH.cf=null; return bad(h); }
  function items(){ const sl=SLOTS7.filter(s=>s!=='wing'); for(let r=0;r<5;r++) if(!S.inv.some(x=>x.r===r)) addItemToBag({slot:sl[r%sl.length],r:r,e:0,subs:undefined}); }

  /* a chave nasce LIGADA desde 13/11 (dono aprovou a opção C; commit 2a4adeb): estes dois testes desligam à mão e devolvem como estava */
  function withOff(fn){ const on0=PANEL_V2.rarIcons, st={c:XRI.c,q:XRI.q,busy:XRI.busy,n:XRI.n,seq:XRI.seq}; let out, err=null; PANEL_V2.rarIcons=false; XRI.c={}; XRI.q=[]; XRI.busy=false; XRI.n=0; XRI.seq=0;
    try{ out=fn(); }catch(e){ err=e; } PANEL_V2.rarIcons=on0; XRI.c=st.c; XRI.q=st.q; XRI.busy=st.busy; XRI.n=st.n; XRI.seq=st.seq; if(err) throw err; return out; }
  T['chave desligada: HTML de antes, nada na fila']=function(){ return withOff(function(){
    if(typeof PANEL_V2.rarIcons!=='boolean') throw new Error('PANEL_V2.rarIcons não é chave: '+PANEL_V2.rarIcons); items();
    const src=slotIcon('hat',0); if(xRarIco(src,4,40)!==src||xRarIcoUrl(src,4,40)!==src) throw new Error('desligada: o endereço mudou');
    let n=0; for(const k in VIEWS){ const h=draw(k); if(h===null) continue; n++; if(/data-ric|blob:/.test(h)) throw new Error(k+': marca ou blob com a chave desligada'); if((k==='equipamento'||k==='comparação')&&h.indexOf('assets/icons/slots/')<0) throw new Error(k+': sem ícone de peça no HTML'); }
    if(XRI.seq||XRI.q.length||XRI.busy||XRI.n) throw new Error('fila mexida com a chave desligada: seq '+XRI.seq+' fila '+XRI.q.length);
    return n+' telas sem marca e sem fila'; }); };

  T['desligada → ligada → desligada: HTML idêntico ao de antes']=function(){ return withOff(function(){ items(); const a={}, ch=[]; for(const k in VIEWS) a[k]=draw(k);
    withOn(function(env){ for(const k in VIEWS) draw(k); env.all(); for(const k in VIEWS){ const h=draw(k); if((k==='equipamento'||k==='comparação')&&h===a[k]) throw new Error(k+': ligada não mudou nada'); if(h!==null&&h!==a[k]) ch.push(k); }
      /* Loja e Forja com uma peça de raridade alta à força (o save do teste pode não ter): o ícone tem de sair pintado */
      const o=S.shop&&S.shop.offers&&S.shop.offers[0]; if(o){ const r0=o.r; o.r=3; let h=''; try{ h=draw('loja de itens'); }finally{ o.r=r0; } if(h.indexOf('data-x="offer"')>=0){ if(!/data-ric|blob:teste/.test(h)) throw new Error('loja: oferta Mítica sem ícone pintado'); ch.push('loja (oferta forçada)'); } }
      const eqd=SLOTS7.map(s=>S.eq[s]!=null?itemOf(S.eq[s]):null).filter(Boolean); if(eqd.length){ const r0=eqd.map(x=>x.r); eqd.forEach(x=>{ x.r=4; }); let h=null; const L=Sys.level, u0=L&&L.isUnlocked; if(u0) L.isUnlocked=function(){ return true; };   /* a Forja do save de teste está atrás do portão de nível */
        try{ h=draw('forja'); }finally{ eqd.forEach((x,i)=>{ x.r=r0[i]; }); if(u0) L.isUnlocked=u0; } if(h!==null){ if(!/data-ric|blob:teste/.test(h)) throw new Error('forja: peça Lendária sem ícone pintado'); ch.push('forja (peça forçada)'); } } });
    /* relógios (a Loja mostra a contagem até a troca das ofertas) mudam entre dois desenhos: saem da comparação */
    const nt=h=>h===null?h:h.replace(/\d+:\d\d(:\d\d)?/g,'#').replace(/\d+\s?(h|min|m|s)\b/g,'#');
    for(const k in VIEWS){ const h=draw(k); if(nt(h)!==nt(a[k])){ let i=0; const x=nt(h)||'', y=nt(a[k])||''; while(i<x.length&&x[i]===y[i]) i++; throw new Error(k+': HTML diferente depois de desligar, em: '+x.slice(Math.max(0,i-40),i+60)+' ≠ '+y.slice(Math.max(0,i-40),i+60)); } }
    return 'igual nas '+Object.keys(VIEWS).length+' telas; ligada mudou: '+ch.join(', '); }); };

  T['ligada: nada pintado no quadro do desenho; um por quadro']=function(){ items(); return withOn(function(env){
    const h=draw('equipamento'), marks=(h.match(/data-ric="\d+"/g)||[]).length, combos=Object.keys(XRI.c).length;
    if(!marks||!combos) throw new Error('nenhum ícone marcado'); if(XRI.n||env.made.length||env.imgs) throw new Error('pintou ou carregou imagem dentro do desenho: '+XRI.n+'/'+env.imgs);
    if(env.pend.length!==1) throw new Error('quadros agendados no desenho: '+env.pend.length+' (esperado 1)');
    if(XRI.q.length!==combos) throw new Error('fila '+XRI.q.length+' para '+combos+' combinações');
    for(let i=1;i<=combos;i++){ env.step(); if(XRI.n!==i) throw new Error('quadro '+i+': '+XRI.n+' pinturas'); if(env.pend.length>1) throw new Error('mais de um quadro agendado'); }
    if(env.pend.length||XRI.busy||XRI.q.length) throw new Error('fila não esvaziou');
    return marks+' ícones marcados, '+combos+' combinações, 1 pintura por quadro'; }); };

  T['ligada: cada raridade com tinta, contorno e a gema certa; Básico sem nada']=function(){ items(); return withOn(function(env){
    const src=slotIcon('hat',0); if(xRarIco(src,0,40)!==src) throw new Error('Básico foi marcado'); if(Object.keys(XRI.c).length) throw new Error('Básico entrou no cache');
    const got=[]; for(let r=1;r<=4;r++){ const m=xRarIco(src,r,40); if(m.indexOf(src+'" data-ric="')!==0) throw new Error('raridade '+r+' sem marca enquanto espera: '+m); }
    fakeCv.tint=0; env.all(); if(env.made.length!==4) throw new Error(env.made.length+' pinturas para 4 raridades'); if(fakeCv.tint!==4) throw new Error('tinta aplicada '+fakeCv.tint+' vezes em 4 raridades');
    for(let r=1;r<=4;r++){ const u=xRarIco(src,r,40), e=XRI.c[src+'|'+r+'|'+xriSize(40)]; if(u!==e.u||u.indexOf('blob:teste/')!==0||u.slice(-src.length-1)!=='#'+src) throw new Error('raridade '+r+': endereço '+u);
      const c=env.made[+u.split('/')[1].split('#')[0]-1], gems=c.ops.filter(o=>o.im&&/icons\/rarity\/gem_/.test(o.im.src||''));
      if(gems.length!==1||gems[0].im.src!=='assets/icons/rarity/gem_'+r+'.png') throw new Error('raridade '+r+': gema '+gems.map(o=>o.im.src).join(','));
      const S0=c.width, gs=Math.round(S0*.34), gp=Math.round(S0*.64); if(gems[0].w!==gs||gems[0].x!==gp||gems[0].y!==gp) throw new Error('raridade '+r+': gema fora do canto ('+gems[0].x+','+gems[0].w+')');
      const want=XRI.GLOW[r]*1.4*S0/176; if(Math.abs(c.blur-want)>1e-6) throw new Error('raridade '+r+': contorno '+c.blur+' (esperado '+want+')');
      got.push(RN(r)+' gem_'+r); }
    const blur=env.made.map(c=>c.blur); for(let i=1;i<blur.length;i++) if(!(blur[i]>blur[i-1])) throw new Error('o contorno não cresce com a raridade: '+blur.join(','));
    if(xRarIco('assets/weapons/era0_x.png',4,40)!=='assets/weapons/era0_x.png') throw new Error('arma com imagem própria foi pintada');
    return got.join(' · ')+'; Básico e arma com imagem própria intactos'; }); };

  T['ligada: cache reutilizado, sem pintar duas vezes']=function(){ items(); return withOn(function(env){
    draw('equipamento'); env.all(); const n1=XRI.n, k1=Object.keys(XRI.c).length; if(n1!==k1) throw new Error(n1+' pinturas para '+k1+' combinações');
    for(let i=0;i<5;i++){ const h=draw('equipamento'); if(/data-ric/.test(h)) throw new Error('ainda há marca depois de pronto'); if(h.indexOf('blob:teste/')<0) throw new Error('HTML sem o ícone pintado'); }
    env.all(); if(XRI.n!==n1||env.made.length!==n1) throw new Error('pintou de novo: '+XRI.n+' (era '+n1+')'); if(env.pend.length) throw new Error('quadro agendado sem pedido novo');
    const src=slotIcon('hat',0), a=xRarIco(src,3,38), b=xRarIco(src,3,40); env.all(); const u=xRarIco(src,3,40); if(xRarIco(src,3,38)!==u) throw new Error('38 e 40 px não dividem o mesmo ícone');
    const before=XRI.n; xRarIco(src,3,200); env.all(); if(XRI.n!==before+(xriSize(200)!==xriSize(40)?1:0)) throw new Error('tamanho maior: pinturas '+XRI.n);
    if(xRarIcoUrl(src,3,40)!==u) throw new Error('xRarIcoUrl não devolve o do cache');
    return n1+' pinturas no 1º desenho, 0 nos 5 seguintes; 38 e 40 px no mesmo ícone'; }); };

  T['ligada: troca só os <img> marcados quando fica pronto']=function(){ return withOn(function(env){
    const src=slotIcon('armor',0); xRarIco(src,2,40); const e=XRI.c[src+'|2|'+xriSize(40)], im={src:src,removed:0,removeAttribute:function(a){ if(a==='data-ric') this.removed++; }}; let sel='';
    document.querySelectorAll=function(s){ sel=s; return [im]; };
    env.all(); if(sel!=='img[data-ric="'+e.id+'"]') throw new Error('procurou por: '+sel); if(im.src!==e.u||im.removed!==1) throw new Error('img não trocado: '+im.src);
    return 'img[data-ric] recebeu o ícone pintado e perdeu a marca'; }); };

  T['ligada: gema ou ícone que não carrega = ícone de hoje, sem travar a fila']=function(){ return withOn(function(env){
    const a=slotIcon('boots',0), b=slotIcon('gloves',0); env.fail=function(s){ return s===a||/gem_4/.test(s); };
    xRarIco(a,1,40); xRarIco(b,4,40); xRarIco(b,2,40); env.all();
    if(xRarIco(a,1,40)!==a) throw new Error('ícone que falhou não voltou ao de hoje'); if(xRarIco(b,4,40)!==b) throw new Error('sem a gema: não ficou o ícone de hoje');
    if(xRarIco(b,2,40).indexOf('blob:teste/')!==0) throw new Error('a fila travou depois da falha'); if(XRI.busy||XRI.q.length||env.pend.length) throw new Error('fila presa');
    return '2 falhas com o ícone de hoje, o seguinte pintado'; }); };

  return T; })();
