'use strict';
/* Desenhos de reserva (canvas puro) usados enquanto um sprite não carregou ou se faltar. */
function rr(x,y,w,h,r){ ctx.beginPath(); ctx.roundRect?ctx.roundRect(x,y,w,h,r):ctx.rect(x,y,w,h); }
function drawBGOld(){
  const E=ERAS[B.dispEra];
  const g=ctx.createLinearGradient(0,0,0,LH); g.addColorStop(0,E.sky[0]); g.addColorStop(.6,E.sky[1]); g.addColorStop(1,E.gr);
  ctx.fillStyle=g; ctx.fillRect(0,0,LW,LH);
  if(E.stars){ ctx.fillStyle='#fff'; for(let i=0;i<30;i++){ ctx.globalAlpha=.4+.6*Math.abs(Math.sin(B.t*.8+i)); ctx.fillRect((i*97)%LW,(i*53)%(LH*0.5),2,2);} ctx.globalAlpha=1; }
  ctx.fillStyle=E.sun; ctx.beginPath(); ctx.arc(280,LH*0.22,22,0,7); ctx.fill();
  const off=(B.t*10)%LW;
  ctx.fillStyle=E.mtn;
  for(let k=-1;k<2;k++){ const o=k*LW-off*0.4; ctx.beginPath(); ctx.moveTo(o,LH*0.7);
    ctx.lineTo(o+60,LH*0.45); ctx.lineTo(o+120,LH*0.7); ctx.lineTo(o+190,LH*0.4); ctx.lineTo(o+260,LH*0.7); ctx.lineTo(o+320,LH*0.5); ctx.lineTo(o+LW,LH*0.7); ctx.fill(); }
  ctx.fillStyle=E.gr; ctx.fillRect(0,GY,LW,LH);
  ctx.fillStyle=E.gr2; ctx.fillRect(0,GY,LW,5);
}
function drawWeapon(ws){
  const sh=WSHAPE[ws.e];
  if(sh==='musket'||sh==='rifle'){
    const rec=B.swing>0?-3*(B.swing/SWT):0, len=sh==='musket'?34:44;
    ctx.save(); ctx.translate(12,-46);
    if(ws.glow){ ctx.shadowColor=ws.glow; ctx.shadowBlur=10; }
    ctx.fillStyle='#5a3a1e'; ctx.fillRect(rec-10,-2,16,6);
    ctx.fillStyle=ws.col; ctx.fillRect(rec,-3,len,5);
    if(sh==='rifle'){ ctx.fillStyle='#222'; ctx.fillRect(rec+8,2,5,9); }
    ctx.shadowBlur=0;
    if(B.swing>0.15){
      ctx.fillStyle='#ffe27a'; ctx.beginPath(); ctx.arc(rec+len+4,-1,6,0,7); ctx.fill();
      if(B.enemy){ const tx=(B.enemy.x-100)-12-8; ctx.strokeStyle='#ffe27a'; ctx.globalAlpha=.8; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(rec+len+8,-1); ctx.lineTo(tx,10); ctx.stroke(); ctx.globalAlpha=1; }
    }
    ctx.restore(); return;
  }
  const sw=B.swing>0 ? (1-B.swing/SWT) : 0;
  ctx.save(); ctx.translate(14,-50); ctx.rotate(-0.6+sw*2.0);
  if(ws.glow){ ctx.shadowColor=ws.glow; ctx.shadowBlur=16; }
  if(sh==='club'){
    ctx.fillStyle='#6b4a2b'; ctx.fillRect(-2.5,-30,5,40);
    ctx.fillStyle=ws.col; ctx.beginPath(); ctx.ellipse(0,-34,9,14,0,0,7); ctx.fill();
  }else if(sh==='spear'){
    ctx.fillStyle='#6b4a2b'; ctx.fillRect(-1.5,-52,3,66);
    ctx.fillStyle=ws.col; ctx.beginPath(); ctx.moveTo(-5,-52); ctx.lineTo(0,-68); ctx.lineTo(5,-52); ctx.fill();
  }else if(sh==='energy'){
    ctx.fillStyle='#333'; ctx.fillRect(-2,0,4,12); ctx.fillStyle='#888'; ctx.fillRect(-6,-2,12,4);
    ctx.shadowColor=ws.col; ctx.shadowBlur=18; ctx.fillStyle=ws.col; ctx.fillRect(-3,-52,6,52);
    ctx.shadowBlur=0; ctx.fillStyle='#fff'; ctx.fillRect(-1,-50,2,48);
  }else{
    ctx.fillStyle='#6b4a2b'; ctx.fillRect(-2,0,4,12);
    ctx.fillStyle='#d9b24a'; ctx.fillRect(-7,-2,14,4);
    ctx.fillStyle=ws.col; ctx.beginPath(); ctx.moveTo(-3,-2); ctx.lineTo(0,-46); ctx.lineTo(3,-2); ctx.fill();
  }
  ctx.restore();
}
function drawHeroOld(){
  const gy=GY, x=HX, sk=SKIN(S.skinEq.armor), ws=heroLook().weapon   /* arma do item equipado (S.skinEq.weapon é ignorado) */, ae=sk.e;
  const bob=Math.sin(B.t*(B.enemy&&B.enemy.x>175?10:3))*1.5;
  ctx.save(); ctx.translate(x,gy+bob);
  if(B.deadT>0){ ctx.rotate(-1.4); ctx.translate(-10,10); }
  if(B.hurt>0) ctx.globalAlpha=.6;
  ctx.fillStyle='#0004'; ctx.beginPath(); ctx.ellipse(0,0-bob,22,6,0,0,7); ctx.fill();
  // pernas
  ctx.fillStyle=ae===6?'#2a3a5a':ae===5?'#3a4030':'#3a2a20'; ctx.fillRect(-10,-22,8,22); ctx.fillRect(2,-22,8,22);
  // corpo
  if(sk.glow){ ctx.shadowColor=sk.glow; ctx.shadowBlur=14; }
  ctx.fillStyle=sk.col;
  if(ae===0){ // pele: corpo com barra irregular
    rr(-15,-58,30,34,6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-15,-26); ctx.lineTo(-10,-18); ctx.lineTo(-5,-26); ctx.lineTo(0,-17); ctx.lineTo(5,-26); ctx.lineTo(10,-18); ctx.lineTo(15,-26); ctx.fill();
  } else rr(-15,-58,30,38,6), ctx.fill();
  ctx.shadowBlur=0;
  // detalhes por era
  if(ae===0){ ctx.fillStyle='#f0c9a0'; ctx.beginPath(); ctx.arc(-16,-52,6,0,7); ctx.arc(16,-52,6,0,7); ctx.fill(); ctx.fillStyle='#0003'; ctx.fillRect(-4,-52,2,3); ctx.fillRect(5,-46,2,3); }
  else if(ae===1){ ctx.fillStyle='#ffffff55'; ctx.beginPath(); ctx.moveTo(-15,-58); ctx.lineTo(-6,-58); ctx.lineTo(15,-30); ctx.lineTo(6,-30); ctx.fill(); ctx.fillStyle='#0003'; ctx.fillRect(-15,-34,30,4);
    ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(-16,-54,7,0,7); ctx.arc(16,-54,7,0,7); ctx.fill(); }
  else if(ae===2){ ctx.fillStyle='#0003'; ctx.fillRect(-15,-34,30,4); ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(-16,-54,8,0,7); ctx.arc(16,-54,8,0,7); ctx.fill(); }
  else if(ae===3){ ctx.fillStyle='#ffffffaa'; ctx.fillRect(-14,-56,3,34); ctx.fillRect(11,-56,3,34); ctx.fillStyle='#e8c040'; ctx.fillRect(-2,-52,3,3); ctx.fillRect(-2,-44,3,3); ctx.fillRect(-2,-36,3,3);
    ctx.fillStyle=sk.col; ctx.fillRect(-15,-24,30,10); ctx.fillStyle='#0003'; ctx.fillRect(-15,-34,30,3); }
  else if(ae===4){ ctx.fillStyle='#e0b030'; ctx.beginPath(); ctx.arc(-6,-48,4,0,7); ctx.arc(7,-40,3,0,7); ctx.fill(); ctx.strokeStyle='#e0b030'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-15,-34); ctx.lineTo(15,-34); ctx.stroke();
    ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(-16,-54,7,0,7); ctx.arc(16,-54,7,0,7); ctx.fill(); }
  else if(ae===5){ ctx.fillStyle='#0004'; ctx.fillRect(-12,-52,24,18); ctx.fillStyle='#0006'; ctx.fillRect(-10,-50,6,8); ctx.fillRect(4,-50,6,8); ctx.fillRect(-15,-34,30,3);
    ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(-16,-54,7,0,7); ctx.arc(16,-54,7,0,7); ctx.fill(); }
  else { ctx.shadowColor='#5ad1ff'; ctx.shadowBlur=8; ctx.fillStyle='#5ad1ff'; ctx.fillRect(-1,-56,2,32); ctx.fillRect(-12,-40,24,2); ctx.shadowBlur=0;
    ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(-16,-54,8,0,7); ctx.arc(16,-54,8,0,7); ctx.fill(); }
  // cabeça
  ctx.fillStyle='#f0c9a0'; ctx.beginPath(); ctx.arc(0,-70,11,0,7); ctx.fill();
  ctx.fillStyle='#222'; ctx.fillRect(2,-70,3,3);
  // cobertura da cabeça
  if(ae===0){ ctx.fillStyle='#4a3020'; ctx.beginPath(); ctx.arc(0,-73,12.5,Math.PI*0.95,Math.PI*2.05); ctx.fill(); ctx.fillRect(-12,-74,24,4); ctx.fillStyle='#e8dcc2'; ctx.fillRect(-12,-75,24,3); }
  else if(ae===1){ ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(0,-73,12,Math.PI,0); ctx.fill(); ctx.fillRect(-12,-73,24,3); ctx.fillStyle='#c0392b'; ctx.fillRect(-2,-90,4,12); ctx.fillRect(-8,-86,16,4); }
  else if(ae===2){ ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(0,-73,12,Math.PI,0); ctx.fill(); ctx.fillRect(-12,-73,24,4); }
  else if(ae===3){ ctx.fillStyle='#2a2430'; ctx.beginPath(); ctx.moveTo(-18,-77); ctx.lineTo(0,-96); ctx.lineTo(18,-77); ctx.fill(); ctx.fillRect(-18,-79,36,4); ctx.fillStyle='#e8c040'; ctx.fillRect(-18,-79,36,1.5); }
  else if(ae===4){ ctx.fillStyle='#2a2a2a'; ctx.fillRect(-9,-96,18,20); ctx.fillRect(-15,-78,30,4); ctx.fillStyle='#e0b030'; ctx.fillRect(-9,-82,18,3); ctx.strokeStyle='#e0b030'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(-3,-72,4,0,7); ctx.stroke(); }
  else if(ae===5){ ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(0,-73,12.5,Math.PI,0); ctx.fill(); ctx.fillRect(-12.5,-73,25,3); ctx.fillStyle='#111'; ctx.fillRect(-1,-72,12,5); }
  else { ctx.fillStyle=sk.col; ctx.beginPath(); ctx.arc(0,-70,13,0,7); ctx.fill(); ctx.shadowColor='#5ad1ff'; ctx.shadowBlur=10; ctx.fillStyle='#5ad1ff'; rr(-2,-76,14,9,4); ctx.fill(); ctx.shadowBlur=0; }
  drawWeapon(ws);
  ctx.restore();
}
function drawEnemyOld(e,sx,sy,dying){
    ctx.scale(e.size*sx,e.size*sy);
    if(!dying&&e.hit>0) ctx.globalAlpha=.55;
  ctx.fillStyle=e.col;
  if(e.shape==='beast'){
    ctx.fillRect(-20,-28,36,18); ctx.fillRect(-18,-12,6,12); ctx.fillRect(8,-12,6,12);
    ctx.beginPath(); ctx.arc(-22,-30,10,0,7); ctx.fill(); ctx.beginPath(); ctx.moveTo(-26,-38); ctx.lineTo(-22,-48); ctx.lineTo(-18,-38); ctx.fill();
    ctx.fillStyle=e.boss?'#ffdd33':'#111'; ctx.fillRect(-27,-33,4,4);
  } else if(e.shape==='robot'){
    ctx.fillRect(-14,-46,28,34); ctx.fillRect(-10,-14,8,14); ctx.fillRect(2,-14,8,14);
    ctx.fillRect(-12,-62,24,16); ctx.fillRect(-1,-72,2,10);
    ctx.fillStyle='#ff4d4d'; ctx.beginPath(); ctx.arc(0,-74,3,0,7); ctx.fill();
    ctx.shadowColor='#ff4d4d'; ctx.shadowBlur=8; ctx.fillRect(-8,-58,16,5); ctx.shadowBlur=0;
    ctx.fillStyle='#0004'; ctx.fillRect(-14,-34,28,3);
  } else {
    rr(-13,-46,26,34,8); ctx.fill(); ctx.fillRect(-9,-14,7,14); ctx.fillRect(2,-14,7,14);
    ctx.beginPath(); ctx.arc(0,-56,12,0,7); ctx.fill();
    if(e.kind==='Goblin'||e.kind==='Orc'){ ctx.beginPath(); ctx.moveTo(-10,-60); ctx.lineTo(-24,-66); ctx.lineTo(-10,-52); ctx.fill(); ctx.beginPath(); ctx.moveTo(10,-60); ctx.lineTo(24,-66); ctx.lineTo(10,-52); ctx.fill(); }
    if(e.kind==='Cultista'){ ctx.fillStyle='#3a1f55'; ctx.beginPath(); ctx.moveTo(-14,-56); ctx.lineTo(0,-82); ctx.lineTo(14,-56); ctx.fill(); }
    if(e.kind==='Minotauro'){ ctx.fillStyle='#e8e0cc'; ctx.beginPath(); ctx.moveTo(-10,-64); ctx.lineTo(-22,-74); ctx.lineTo(-6,-60); ctx.fill(); ctx.beginPath(); ctx.moveTo(10,-64); ctx.lineTo(22,-74); ctx.lineTo(6,-60); ctx.fill(); }
    ctx.fillStyle='#5a3b1e'; ctx.fillRect(-26,-40,4,34);
    ctx.fillStyle=e.boss?'#ffdd33':'#111'; ctx.fillRect(-7,-58,4,4); ctx.fillRect(3,-58,4,4);
  }
  if(e.boss){ ctx.fillStyle='#e8e0cc'; ctx.beginPath(); ctx.moveTo(-10,-66); ctx.lineTo(-16,-84); ctx.lineTo(-4,-68); ctx.fill(); ctx.beginPath(); ctx.moveTo(10,-66); ctx.lineTo(16,-84); ctx.lineTo(4,-68); ctx.fill(); }
}
