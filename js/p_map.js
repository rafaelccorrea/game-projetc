'use strict';
/* ================= 20 MAPA DAS ERAS — tela nova, nasce DESLIGADA (PANEL_ON.map) =================
   Protótipo: docs/proto/MapaEras.dc.html. Duas camadas, como no protótipo:
   (1) MUNDO: mapa-múndi ilustrado (assets/map/world.jpg) com os 9 marcadores das eras na estrada, o Relógio das Eras no céu (assets/map/clock_*),
       pílula da Jornada (pedaços), nível e FC; cartão da era (história, chefe e Senhor da Era, nível de entrada, FC recomendada, o que fecha a era).
   (2) ERA: arte da era (assets/map/era<n>.jpg), trilha com as 100 fases, abas das 4 dificuldades (Fácil/Médio/Difícil/Hell), painel da fase
       (FC recomendada × a sua, prêmios da dificuldade, Desafiar).
   REGRAS E NÚMEROS: só do Sys.phases (js/sys/phases.js): nomes das eras e dificuldades, FC recomendada (fcRec), nível-trava (lvlLock), exigidas (required),
   chefe (50) e Senhor (100), prêmios por dificuldade (rewardOf), quem pode desafiar (canChallenge), progresso (bestOf/eraView/eraMax).
   Nível: Sys.level.level(S). FC: Sys.fc.compute(S, Sys.host) (a FC única do HUD).
   CHAVE DO Sys.phases DESLIGADA (DATA.on=false, hoje): o jogo ainda usa as 10 fases por era. A tela mostra o progresso do save de hoje do mesmo jeito que o
   Sys.phases.migrate vai convertê-lo (eras abaixo de S.eraMax vencidas nas exigidas; na era atual o Fácil em (fase antiga − 1) × 10). "Desafiar":
   na era atual (Fácil) leva para a Batalha de hoje; o resto diz que a jornada de 100 fases abre na próxima versão (nenhum botão sem ação).
   CHAVE LIGADA: "Desafiar" grava Sys.phases.ensure(S).cur = {e,d,n} e abre a Batalha — o engenheiro faz a luta ler essa fase (pedido no relatório).
   O cabeçalho (Voltar, título, moedas) é do jogo; aqui só o conteúdo.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - sem "dias para fechar a era" e sem estrelas por fase: não existem no Sys (não invento número);
   - o retrato do chefe é o primeiro quadro da folha aprovada do chefe da era (assets/anim/hyb/enemy/era<n>_boss_run);
   - a trilha das 100 fases usa o mesmo traçado em S da era 0 do protótipo em todas as eras (as artes das eras 1-8 têm a estrada no mesmo eixo; ajuste fino depois);
   - escala da arte da era reduzida para caber nos 390 px sem rolagem lateral. */
const XM={layer:'world',sel:-1,era:0,diff:0,node:1,clock:false,toast:'',tt:0,scrollTo:'',anim:true};
const M_ERAS=[
  {flag:'#ff7a2a',tint:'#ff8a3a',boss:'Rex Furioso',lord:'o Rex, já tomado pelo brilho do pedaço',o:[670,2610],story:'O pedaço do Relógio caiu num vulcão e enlouqueceu as feras. Na arena de pedra ao pé da cratera, o Rex Furioso brilha com a luz roubada.'},
  {flag:'#ffd24a',tint:'#ffd76a',boss:'Minotauro',lord:'o general no labirinto',o:[522,2090],story:'Um general usou o pedaço para fazer seu exército nunca morrer. No coração do labirinto, o Minotauro guarda o caminho até ele.'},
  {flag:'#e8402a',tint:'#ff5a4e',boss:'Dragão Real',lord:'o Dragão coroado',o:[860,1790],story:'O pedaço caiu no ninho de um dragão, que agora queima os reinos. Só o Dragão coroado sabe onde a luz se esconde.'},
  {flag:'#4aa3ff',tint:'#7fe3ff',boss:'Capitão Fantasma',lord:'o Capitão, que não consegue morrer',o:[585,1590],story:'Piratas acharam o pedaço e navegam um mar que nunca acaba. Enquanto ele estiver a bordo, o Capitão Fantasma não morre.'},
  {flag:'#ff9a4a',tint:'#ff9a4a',boss:'Golem de ferro',lord:'o Golem-motor',o:[720,1420],story:'Uma fábrica usa o pedaço como motor e transforma gente em máquina. O Golem-motor nunca para de trabalhar.'},
  {flag:'#c9d36a',tint:'#c9d36a',boss:'Tanque',lord:'o comandante do Tanque',o:[730,1160],story:'Exércitos disputam o pedaço numa guerra que recomeça todo dia. O comandante do Tanque não deixa ninguém cruzar a linha.'},
  {flag:'#5ad8e6',tint:'#5ad8e6',boss:'Devorador',lord:'o Devorador, que foge ferido para baixo do tempo',o:[790,790],story:'O Devorador de Eras se esconde aqui, num corpo de máquina. Ferido, ele foge para baixo do tempo.'},
  {flag:'#b07cff',tint:'#b07cff',boss:'Senhor Demônio',lord:'a forma verdadeira do Devorador',o:[915,590],story:'Ferido, o Devorador se refugia no Submundo e acorda os demônios. Aqui ele mostra a sua forma verdadeira.'},
  {flag:'#ffe07a',tint:'#ffe07a',boss:'Arcanjo Serafim',lord:'o Serafim, que precisa ser libertado, não destruído',o:[770,330],story:'O último pedaço subiu ao Trono do Tempo. O Serafim que o guarda foi corrompido e não deixa ninguém passar.'}];
const M_DIFF=[{c:'#3fae4a',hi:'#7be08a',dk:'#1d5a24'},{c:'#2f86e0',hi:'#7cc0ff',dk:'#173f6e'},{c:'#8a52e0',hi:'#c49cff',dk:'#40246e'},{c:'#e8401a',hi:'#ffb03a',dk:'#6e1408'}];
const M_ANG=[0,34,71,109,145,180,215,251,289];   /* encaixes do relógio (assets/map/clock_shards/shards.json), horário a partir do topo */
/* geometria do mundo (arte 1536×2752) e da era (mesmo tamanho de arte) */
const MW={S:600/1536,OX:-200*600/1536,SKY:300};
const mwx=x=>x*MW.S+MW.OX, mwy=y=>y*MW.S+MW.SKY, MW_H=Math.round(2752*MW.S+MW.SKY)+90;
const ME={S:0.37,OX:-252*0.37,TOP:0};
const mex=x=>x*ME.S+ME.OX, mey=y=>y*ME.S+ME.TOP, ME_H=Math.round(2752*ME.S)+150;
const M_TRAIL=[[985,2690],[960,2640],[800,2575],[580,2500],[400,2425],[312,2330],[322,2228],[430,2138],[590,2076],[740,2030],
  [900,1965],[1060,1895],[1195,1830],[1250,1730],[1248,1620],[1200,1515],[1085,1435],[945,1362],[830,1292],[700,1215],
  [560,1140],[432,1060],[335,972],[296,880],[334,792],[432,718],[560,668]];
const M_ARENA=[780,612];
const M_GEO=(()=>{ const pts=M_TRAIL.map(p=>[mex(p[0]),mey(p[1])]), dense=[];
  for(let i=0;i<pts.length-1;i++){ const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];
    for(let k=0;k<16;k++){ const t=k/16,t2=t*t,t3=t2*t; dense.push([0,1].map(j=>0.5*((2*p1[j])+(-p0[j]+p2[j])*t+(2*p0[j]-5*p1[j]+4*p2[j]-p3[j])*t2+(-p0[j]+3*p1[j]-3*p2[j]+p3[j])*t3))); } }
  dense.push(pts[pts.length-1]); const acc=[0]; for(let j=1;j<dense.length;j++) acc.push(acc[j-1]+Math.hypot(dense[j][0]-dense[j-1][0],dense[j][1]-dense[j-1][1]));
  const L=acc[acc.length-1], at=d=>{ let a=1; while(a<acc.length-1&&acc[a]<d) a++; const f=(d-acc[a-1])/Math.max(0.001,acc[a]-acc[a-1]); return [dense[a-1][0]+(dense[a][0]-dense[a-1][0])*f,dense[a-1][1]+(dense[a][1]-dense[a-1][1])*f]; };
  const nodes=[]; for(let n=0;n<99;n++) nodes.push(at(L*n/98)); nodes.push([mex(M_ARENA[0]),mey(M_ARENA[1])]);
  const dots=[]; for(let m=0;m<98;m++) for(const q of [0.33,0.66]) dots.push(at(L*(m+q)/98)); return {nodes,dots}; })();
const M_CSS=`.pm-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pmk 1s steps(12,jump-none) infinite;pointer-events:none}
@keyframes pmk{from{background-position:0 0}to{background-position:100% 0}}
.pm-on{animation:pmon 2.2s ease-in-out infinite}
@keyframes pmon{0%,100%{filter:drop-shadow(0 0 3px rgba(255,220,140,.7))}50%{filter:drop-shadow(0 0 12px rgba(255,220,140,1)) brightness(1.15)}}
.pm-ring{position:absolute;border-radius:50%;border:3px solid #ffe07a;animation:pmr 1.6s ease-out infinite;pointer-events:none}
@keyframes pmr{from{transform:scale(.7);opacity:1}to{transform:scale(1.6);opacity:0}}
.pm-node{position:absolute;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;font-family:'Lilita One',sans-serif;line-height:1;transform:translate(-50%,-50%);box-sizing:border-box}
.pm-pop{animation:pmp .3s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pmp{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.pm-veil{animation:pmv .2s ease-out both}@keyframes pmv{from{opacity:0}to{opacity:1}}
.pm-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 5px 0 #8a4f0c;border:0}
.pm-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
.pm-glow{animation:pmg 1.4s ease-in-out infinite}@keyframes pmg{0%,100%{box-shadow:0 5px 0 #8a4f0c,0 0 6px rgba(255,201,74,.3)}50%{box-shadow:0 5px 0 #8a4f0c,0 0 24px rgba(255,201,74,.95)}}
.pm-cloud{position:absolute;left:0;width:200%;height:60px;opacity:.35;background:radial-gradient(ellipse at 20% 50%,#fff 0,transparent 60%),radial-gradient(ellipse at 70% 50%,#fff 0,transparent 55%);animation:pmc 40s linear infinite;pointer-events:none}
@keyframes pmc{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@media (prefers-reduced-motion:reduce){.pm-kid,.pm-on,.pm-ring,.pm-glow,.pm-cloud{animation:none}}`;

/* ---------- leituras isoladas (reserva segura se um módulo faltar) ---------- */
const mP=()=>window.Sys&&Sys.phases&&Sys.phases.DATA?Sys.phases:null;
const mOn=()=>{ const P=mP(); return !!(P&&P.DATA.on===true); };
const mEsc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* FC na tela = escala visual (Sys.fc.viewText); contas e comparações seguem com a FC real */
const mFc=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return mFmt(v); };
const mFmt=n=>{ n=Math.max(0,Math.round(+n||0)); try{ if(typeof kf==='function') return kf(n); }catch(e){}
  const f=(v,u)=>String(v<10?Math.round(v*10)/10:Math.round(v)).replace('.',',')+' '+u; return n>=1e12?f(n/1e12,'tri'):n>=1e9?f(n/1e9,'bi'):n>=1e6?f(n/1e6,'mi'):n>=1e3?f(n/1e3,'mil'):String(n); };
const mLvl=()=>{ try{ if(window.Sys&&Sys.level&&Sys.level.level) return Sys.level.level(S); }catch(e){} try{ return Sys.host.level(); }catch(e){ return 1; } };
const mFC=()=>{ try{ if(window.Sys&&Sys.fc&&Sys.fc.compute) return Sys.fc.compute(S,Sys.host); }catch(e){} return 0; };
const mHostEra=()=>{ try{ return Math.max(0,(Sys.host&&Sys.host.eraMax?Sys.host.eraMax():S.eraMax)|0); }catch(e){ return 0; } };
const mHostStage=()=>{ try{ return Math.max(1,(Sys.host&&Sys.host.stage?Sys.host.stage():S.stage)|0); }catch(e){ return 1; } };
/* progresso: ligado = Sys.phases; desligado = save de hoje convertido como o Sys.phases.migrate fará */
function mBest(e,d){ const P=mP(); if(!P) return 0; if(mOn()) return P.bestOf(S,e,d);
  const s=mHostStage(), ce=Math.min(P.DATA.eras-1,Math.floor((s-1)/10)), cur=Math.max(ce,Math.min(mHostEra(),P.DATA.eras-1));
  if(e<cur) return d<P.DATA.required[e]?P.DATA.perEra:0; if(e===cur&&d===0&&e===ce) return ((s-1)%10)*10; return 0; }
function mCleared(e){ const P=mP(); if(mOn()) return P.eraCleared(S,e); for(let d=0;d<P.DATA.required[e];d++) if(mBest(e,d)<P.DATA.perEra) return false; return true; }
const mOpen=e=>mOn()?mP().eraOpen(S,e):(e===0||mCleared(e-1));
function mCurEra(){ const P=mP(); if(mOn()) return P.eraMax(S); let m=0; for(let e=1;e<P.DATA.eras;e++){ if(mOpen(e)) m=e; else break; } return m; }
const mDiffOpen=(e,d)=>{ const P=mP(); if(mOn()){ const v=P.eraView(S,e); return !!(v&&v.diffs[d]&&v.diffs[d].open); } return mOpen(e)&&(d===0||mBest(e,d-1)>=P.DATA.perEra); };
/* fase onde o jogador parou (Sys.phases.current/ensure().cur): só com o módulo ligado */
function mCurPos(){ const P=mP(); if(!mOn()) return null; try{ const c=P.ensure(S).cur; return c&&P.info(c.e,c.d,c.n)?{e:c.e,d:c.d,n:c.n}:null; }catch(e){ return null; } }
function mInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pm_css')) return; const st=document.createElement('style'); st.id='pm_css'; st.textContent=M_CSS; document.head.appendChild(st); }
function mToast(t){ XM.toast=t; XM.tt=Date.now()+2200; render(); }
/* retrato: 1º quadro da folha aprovada do chefe da era (célula 544×352, pés em 307) */
const mPort=(e,w,h)=>`<div role="img" aria-label="${mEsc(M_ERAS[e].boss)}" style="width:${w}px;height:${h}px;background-image:url(assets/anim/hyb/enemy/era${e}_boss_run.png);background-size:${Math.round(w*8*544/400)}px ${Math.round(h*352/260)}px;background-position:${-Math.round(w*(192-60)/400)}px ${-Math.round(h*30/260)}px;background-repeat:no-repeat"></div>`;

/* ---------- camada MUNDO ---------- */
function mWorld(d){
  const P=mP(), N=P.DATA.eras, cur=mCurEra(), won=Array.from({length:N},(_,e)=>mCleared(e)), wc=won.filter(Boolean).length, lv=mLvl(), fc=mFC();
  const CX=195, CY=150, CR=96;
  const ring=M_ANG.map((a,i)=>{ const r=a*Math.PI/180, x=CX+Math.sin(r)*(CR+16), y=CY-Math.cos(r)*(CR+16);
    return `<span aria-hidden="true" style="position:absolute;left:${Math.round(x-15)}px;top:${Math.round(y-15)}px;width:30px;height:30px;background:url(assets/map/clock_shards/shard_${i}.png) center/contain no-repeat;${won[i]?'':'filter:grayscale(1) brightness(.35);opacity:.55'}" class="${won[i]?'pm-on':''}"></span>`; }).join('');
  const marks=M_ERAS.map((k,e)=>{ const x=Math.round(mwx(k.o[0])), y=Math.round(mwy(k.o[1])), st=won[e]?'won':e===cur?'cur':'lock', name=P.DATA.eraName[e];
    const icon=st==='won'?`<svg width="34" height="44" viewBox="0 0 44 58" aria-hidden="true" style="position:absolute;left:-8px;top:-40px"><line x1="10" y1="55" x2="10" y2="4" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"></line><line x1="10" y1="55" x2="10" y2="4" stroke="#e8c27a" stroke-width="2.6"></line><path d="M12 7 L40 10 L33 18 L40 26 L12 25 Z" fill="${k.flag}" stroke="#2a1a0a" stroke-width="2"></path><path d="M16 12 l3 5 l5 -9" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"></path></svg>`
      :st==='cur'?`<span class="pm-ring" style="left:-22px;top:-12px;width:44px;height:24px"></span><div class="pm-kid" role="img" aria-label="Kael de pé na era atual" style="position:absolute;left:-36px;top:-62px;width:72px;height:72px"></div>`
      :`<svg width="22" height="26" viewBox="0 0 28 32" aria-hidden="true" style="position:absolute;left:-11px;top:-26px"><path d="M8 14 V9 A6 6 0 0 1 20 9 V14" fill="none" stroke="#2a1a0a" stroke-width="6"></path><path d="M8 14 V9 A6 6 0 0 1 20 9 V14" fill="none" stroke="#d8d0c4" stroke-width="3"></path><rect x="3" y="13" width="22" height="17" rx="4" fill="#ffc94a" stroke="#2a1a0a" stroke-width="2"></rect></svg>`;
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:0;height:0">${icon}
      <span style="position:absolute;left:-12px;top:-5px;width:24px;height:10px;border-radius:50%;background:rgba(0,0,0,.4)"></span>
      <span style="position:absolute;left:-60px;top:8px;width:120px;text-align:center;display:flex;flex-direction:column;align-items:center;pointer-events:none">
        <span style="font-family:'Lilita One',sans-serif;font-size:13px;color:${st==='lock'?'#c9b9a2':'#fff'};text-shadow:0 2px 0 #000,0 0 6px #000">${e} · ${mEsc(name)}</span>
        <span style="font-size:10px;font-weight:900;color:${st==='won'?'#7be08a':st==='cur'?'#ffe07a':'#a89a88'};text-shadow:0 1px 0 #000">${st==='won'?'Vencida':st==='cur'?'Você está aqui':'Nível '+P.DATA.lvlEntry[e]}</span></span>
      <button data-x="era" data-e="${e}" aria-label="Era ${e}, ${mEsc(name)}: ${st==='won'?'vencida':st==='cur'?'era atual':'bloqueada'}" style="position:absolute;left:-40px;top:-50px;width:80px;height:84px;background:transparent;border:0;padding:0"></button></div>`; }).join('');
  const minis=won.map((w,i)=>`<span style="width:12px;height:12px;background:url(assets/map/clock_shards/shard_${i}.png) center/contain no-repeat;${w?'':'filter:grayscale(1) brightness(.4);opacity:.6'}"></span>`).join('');
  const scroll=`<div id="pm_world" class="x-scroll" style="position:absolute;inset:0;overflow-y:auto;overflow-x:hidden">
    <div style="position:relative;width:390px;height:${MW_H}px;background:linear-gradient(180deg,#0e1830 0%,#1d2b4a ${MW.SKY-40}px,#2a1d10 ${MW.SKY+20}px)">
      <div class="pm-cloud" style="top:60px"></div><div class="pm-cloud" style="top:210px;animation-duration:60s;opacity:.25"></div>
      <div aria-hidden="true" style="position:absolute;left:${CX-CR}px;top:${CY-CR}px;width:${CR*2}px;height:${CR*2}px;background:url(assets/map/clock_empty.png) center/contain no-repeat;filter:drop-shadow(0 0 14px rgba(255,201,74,.35))"></div>
      ${ring}
      <button data-x="clock" aria-label="Relógio das Eras: ${wc} de 9 pedaços. Toque para ver o objetivo" style="position:absolute;left:${CX-CR}px;top:${CY-CR}px;width:${CR*2}px;height:${CR*2}px;border-radius:50%;background:transparent;border:0;padding:0"></button>
      <div style="position:absolute;left:0;right:0;top:${CY+CR+26}px;text-align:center;font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a;text-shadow:0 2px 0 #000">Relógio das Eras · ${wc}/9 acesos</div>
      <div aria-hidden="true" style="position:absolute;left:${Math.round(MW.OX)}px;top:${MW.SKY}px;width:600px;height:${Math.round(2752*MW.S)}px;background:url(assets/map/world.jpg) 0 0/100% 100% no-repeat;-webkit-mask:linear-gradient(180deg,transparent 0,#000 40px);mask:linear-gradient(180deg,transparent 0,#000 40px)"></div>
      ${marks}</div></div>`;
  const hud=`<div style="position:absolute;left:8px;right:8px;top:6px;display:flex;align-items:center;gap:8px;pointer-events:none">
      <div role="img" aria-label="Jornada do Guardião: ${wc} de 9 pedaços" style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;padding:6px 10px;border-radius:12px;background:rgba(20,14,8,.82);border:2px solid #6a4a1a">
        <span style="font-size:11px;font-weight:900;color:#e8dccb">Jornada do Guardião: <span style="color:#ffe07a">${wc}/9 pedaços</span></span><span style="display:flex;gap:3px">${minis}</span></div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;padding:6px 10px;border-radius:12px;background:rgba(20,14,8,.82);border:2px solid #6a4a1a">
        <span style="font-family:'Lilita One',sans-serif;font-size:14px;color:#fff">Nv. ${lv}</span><span style="font-size:11px;font-weight:900;color:#ffc94a">FC ${mFc(fc)}</span></div></div>
    <button data-x="pickcur" class="pm-gold" style="position:absolute;left:50%;transform:translateX(-50%);bottom:max(12px,env(safe-area-inset-bottom));min-width:250px;height:52px;border-radius:26px;display:flex;align-items:center;gap:10px;padding:0 18px">
      <span aria-hidden="true" style="width:30px;height:30px;background:url(assets/map/clock_shards/shard_${cur}.png) center/contain no-repeat"></span>
      <span style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.05"><span style="font-family:'Lilita One',sans-serif;font-size:17px">Era atual: ${mEsc(P.DATA.eraName[cur])}</span><span style="font-size:11px;font-weight:900;color:#5a330a">Toque numa região para ver detalhes</span></span></button>`;
  return scroll+hud+(XM.sel>=0?mCard(XM.sel,won,cur,fc):'')+(XM.clock?mClock(wc):'');
}
function mCard(e,won,cur,fc){
  const P=mP(), k=M_ERAS[e], open=mOpen(e), st=won[e]?'Vencida':e===cur?'Era atual':'Bloqueada', lv=P.DATA.lvlEntry[e], plv=mLvl();
  const rec=P.fcRec(e,0,1), frac=Math.max(0,Math.min(1,fc/Math.max(1,rec)));
  const reqs=[]; for(let d=0;d<P.DATA.required[e];d++){ const b=mBest(e,d); reqs.push(`<span style="flex:1;min-width:70px;display:flex;flex-direction:column;align-items:center;padding:5px 4px;border-radius:10px;background:${M_DIFF[d].dk};border:2px solid ${M_DIFF[d].c}"><span style="font-family:'Lilita One',sans-serif;font-size:14px;color:${M_DIFF[d].hi}">${mEsc(P.DATA.diffName[d])}</span><span style="font-size:10px;font-weight:900;color:#e8dccb">${b>=P.DATA.perEra?'Fechado':'Fases '+b+'/'+P.DATA.perEra}</span></span>`); }
  const lock=e>0&&!open?`Vença ${mEsc(P.DATA.required[e-1]>1?'as dificuldades exigidas':'o Fácil')} da era ${e-1} (${mEsc(P.DATA.eraName[e-1])}) para abrir.`:'';
  return `<button data-x="close" aria-label="Fechar cartão da era" class="pm-veil" style="position:absolute;inset:0;z-index:20;background:rgba(8,6,4,.65);border:0;padding:0"></button>
  <div role="dialog" aria-label="Era ${e}: ${mEsc(P.DATA.eraName[e])}" class="pm-pop" style="position:absolute;left:10px;right:10px;bottom:10px;z-index:21;max-height:calc(100% - 20px);overflow-y:auto;overflow-x:hidden;border-radius:18px;border:3px solid ${k.tint};background:#1d1611;padding:12px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:10px"><span aria-hidden="true" style="width:34px;height:34px;flex:none;background:url(assets/map/clock_shards/shard_${e}.png) center/contain no-repeat;${won[e]?'':'filter:grayscale(1) brightness(.5)'}"></span>
      <span style="flex:1;display:flex;flex-direction:column;line-height:1.05"><span style="font-size:11px;font-weight:900;color:#c9b9a2;letter-spacing:1px">ERA ${e}</span><span style="font-family:'Lilita One',sans-serif;font-size:22px;color:${k.tint}">${mEsc(P.DATA.eraName[e])}</span></span>
      <span style="padding:3px 10px;border-radius:10px;font-size:11px;font-weight:900;background:${won[e]?'#1d5a24':e===cur?'#6a4a1a':'#3a2e24'};color:${won[e]?'#7be08a':e===cur?'#ffe07a':'#c9b9a2'}">${st}</span>
      <button data-x="close" aria-label="Fechar" style="width:40px;height:40px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:#2a1d0f;color:#ffe07a;padding:0;font-family:'Lilita One',sans-serif;font-size:20px">✕</button></div>
    <p style="margin:0;font-size:13px;font-weight:700;line-height:1.35;color:#e8dccb">${mEsc(k.story)}</p>
    <div style="display:flex;gap:10px;align-items:center;padding:8px;border-radius:14px;background:#140e08;border:1px solid #3a2a18">
      <div style="width:96px;height:72px;flex:none;border-radius:10px;overflow:hidden;background:radial-gradient(circle at 50% 70%,#3a2810,#140e08)">${mPort(e,96,72)}</div>
      <span style="display:flex;flex-direction:column;gap:2px;line-height:1.1"><span style="font-size:10px;font-weight:900;color:#c9b9a2">CHEFE · FASE ${P.DATA.chefe}</span><span style="font-family:'Lilita One',sans-serif;font-size:17px;color:#fff">${mEsc(k.boss)}</span>
        <span style="font-size:10px;font-weight:900;color:#ffc94a;margin-top:4px">SENHOR DA ERA · FASE ${P.DATA.senhor} · GUARDA O PEDAÇO</span><span style="font-size:12px;font-weight:800;color:#e8dccb">${mEsc(k.lord)}</span></span></div>
    <div style="display:flex;align-items:center;gap:8px"><svg width="22" height="24" viewBox="0 0 24 26" aria-hidden="true"><path d="M7 11 V7 A5 5 0 0 1 17 7 V11" fill="none" stroke="${plv>=lv?'#7be08a':'#ff8a6a'}" stroke-width="2.6"></path><rect x="4" y="11" width="16" height="13" rx="3" fill="${plv>=lv?'#7be08a':'#ff8a6a'}"></rect></svg>
      <span style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:14px;font-weight:900">Nível ${lv} para entrar</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">Você está no nível ${plv} · a era vai até o nível ${P.DATA.lvlExit[e]}</span></span></div>
    <div role="img" aria-label="Poder recomendado FC ${mFc(rec)}; você tem FC ${mFc(fc)}" style="display:flex;flex-direction:column;gap:4px">
      <span style="display:flex;justify-content:space-between;font-size:12px;font-weight:900"><span>Poder recomendado <span style="color:#ffc94a">FC ${mFc(rec)}</span></span><span>Você: <span style="color:${fc>=rec?'#7be08a':'#ff8a6a'}">FC ${mFc(fc)}</span></span></span>
      <span style="height:10px;border-radius:5px;background:#0e0a07;border:1px solid #6a4a1a;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(frac*100)}%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></span></span></div>
    <div style="display:flex;flex-direction:column;gap:6px"><span style="font-size:12px;font-weight:900;color:#c9b9a2">Para fechar a era e ganhar o pedaço, vença até a fase ${P.DATA.perEra}:</span><span style="display:flex;gap:6px;flex-wrap:wrap">${reqs.join('')}</span></div>
    ${open?`<button data-x="enter" data-e="${e}" class="pm-gold" style="height:54px;border-radius:16px;font-family:'Lilita One',sans-serif;font-size:21px">Entrar na era</button>`
      :`<div role="status" style="display:flex;align-items:center;gap:8px;padding:10px;border-radius:12px;background:#2a1d0f;border:2px solid #6a4a1a;font-size:13px;font-weight:900;color:#ffe07a">${lock}</div>`}</div>`;
}
function mClock(wc){
  return `<button data-x="closeclock" aria-label="Fechar Relógio" class="pm-veil" style="position:absolute;inset:0;z-index:20;background:rgba(8,6,4,.78);border:0;padding:0"></button>
  <div role="dialog" aria-label="Relógio das Eras" class="pm-pop" style="position:absolute;left:20px;right:20px;top:50%;transform:translateY(-50%);z-index:21;border-radius:18px;border:3px solid #ffc94a;background:#241a10;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:10px">
    <span style="font-family:'Lilita One',sans-serif;font-size:24px;color:#ffe07a">Relógio das Eras</span>
    <span role="img" aria-label="O Relógio das Eras inteiro, como ficará com os 9 pedaços" style="width:200px;height:200px;background:url(assets/map/clock_whole.png) center/contain no-repeat" class="pm-on"></span>
    <p style="margin:0;font-size:14px;font-weight:800;text-align:center;color:#e8dccb;line-height:1.35">Assim ele fica com os 9 pedaços. Cada Senhor da Era vencido devolve um. Você tem <span style="color:#ffe07a">${wc} de 9</span>.</p>
    <button data-x="closeclock" class="pm-gold" style="width:180px;height:50px;border-radius:14px;font-family:'Lilita One',sans-serif;font-size:19px">Continuar</button></div>`;
}

/* ---------- camada ERA ---------- */
function mEraLayer(){
  const P=mP(), e=XM.era, dd=XM.diff, n=XM.node, D=P.DATA, best=mBest(e,dd), dOpen=mDiffOpen(e,dd), fc=mFC(), on=mOn();
  const curN=Math.min(D.perEra,best+1), col=M_DIFF[dd];
  const dots=M_GEO.dots.map(p=>`<span style="position:absolute;left:${Math.round(p[0]-2)}px;top:${Math.round(p[1]-2)}px;width:4px;height:4px;border-radius:50%;background:rgba(255,240,200,.55)"></span>`).join('');
  const nodes=M_GEO.nodes.map((p,i)=>{ const k=i+1, done=k<=best, isCur=dOpen&&k===curN&&best<D.perEra, big=k===D.chefe||k===D.senhor, sel=k===n, s=big?30:20;
    const bg=done?col.c:isCur?'#ffe07a':'#3a2e24', fg=done?'#fff':isCur?'#2a1403':'#a89a88';
    return `<button data-x="node" data-n="${k}" aria-label="Fase ${k}${done?' vencida':isCur?' atual':''}${k===D.chefe?', chefe':k===D.senhor?', Senhor da Era':''}" class="pm-node" style="left:${Math.round(p[0])}px;top:${Math.round(p[1])}px;width:${s}px;height:${s}px;font-size:${big?13:10}px;background:${bg};color:${fg};border:${sel?3:2}px solid ${sel?'#fff':done?col.dk:'#1a120a'};box-shadow:${sel?'0 0 10px #fff':'0 2px 0 rgba(0,0,0,.5)'};z-index:${sel?3:big?2:1}">${k}</button>`; }).join('');
  const cn=M_GEO.nodes[Math.min(D.perEra,curN)-1];
  const kael=dOpen&&best<D.perEra?`<span class="pm-ring" style="left:${Math.round(cn[0]-20)}px;top:${Math.round(cn[1]-8)}px;width:40px;height:20px;z-index:2"></span><div class="pm-kid" role="img" aria-label="Kael de pé na fase atual" style="position:absolute;left:${Math.round(cn[0]-38)}px;top:${Math.round(cn[1]-64)}px;width:60px;height:60px;z-index:4"></div>`:'';
  const ap=M_GEO.nodes[D.perEra-1];
  const arena=`<div style="position:absolute;left:${Math.round(ap[0]-60)}px;top:${Math.round(ap[1]-96)}px;width:120px;height:80px;pointer-events:none">${mPort(e,120,80)}</div>
    <div style="position:absolute;left:${Math.round(ap[0]-70)}px;top:${Math.round(ap[1]+18)}px;width:140px;text-align:center;display:flex;flex-direction:column;pointer-events:none"><span style="font-size:10px;font-weight:900;color:#ffc94a;text-shadow:0 1px 0 #000">Senhor da Era</span><span style="font-family:'Lilita One',sans-serif;font-size:13px;color:#fff;text-shadow:0 2px 0 #000">Fase ${D.senhor} · ${mEsc(M_ERAS[e].boss)}</span></div>`;
  const tabs=D.diffName.map((nm,d)=>{ const b=mBest(e,d), op=mDiffOpen(e,d), on2=d===dd, C=M_DIFF[d];
    return `<button role="tab" aria-selected="${on2}" data-x="diff" data-d="${d}" aria-label="${mEsc(nm)}: ${op?b+' de '+D.perEra:'bloqueada'}" style="flex:1;min-width:0;height:46px;border-radius:12px;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;border:2px solid ${on2?C.hi:C.dk};background:${on2?C.c:'#1d1611'};color:${on2?'#fff':C.hi}">
      <span style="font-family:'Lilita One',sans-serif;font-size:14px;line-height:1">${mEsc(d===3?'HELL':nm)}</span><span style="font-size:10px;font-weight:900;display:flex;align-items:center;gap:2px">${op?'':'<svg width="9" height="10" viewBox="0 0 24 26" aria-hidden="true"><path d="M7 11 V7 A5 5 0 0 1 17 7 V11" fill="none" stroke="currentColor" stroke-width="3"></path><rect x="4" y="11" width="16" height="13" rx="3" fill="currentColor"></rect></svg>'}${b}/${D.perEra}</span></button>`; }).join('');
  const reqN=D.required[e], rule=reqN>=D.diffs?'Todas as 4 dificuldades fecham esta era.':D.diffName.slice(0,reqN).join(reqN===2?' e ':', ')+(reqN>1?' fecham':' fecha')+' esta era'+(reqN<D.diffs?'; '+D.diffName.slice(reqN).join(' e ')+(D.diffs-reqN>1?' são':' é')+' desafio extra com prêmio maior.':'.');
  /* painel da fase */
  const inf=P.info(e,dd,n), rw=P.rewardOf(dd), tag=P.kindOf(n), rec=inf.fcRec;
  let btn='', lockMsg='';
  if(on){ const c=P.canChallenge(S,Sys.host,e,dd,n,fc); if(c.ok) btn=`<button data-x="fight" class="pm-gold ${c.glow?'pm-glow':''}" style="width:100%;height:54px;border-radius:16px;font-family:'Lilita One',sans-serif;font-size:21px">${n<=best?'Jogar de novo':'Desafiar'}</button>`;
    else lockMsg=c.reason==='level'?'Nível '+c.needLevel+' para desafiar esta fase':c.reason==='order'?(n>1?'Vença a fase '+(n-1)+' primeiro':'Feche o '+D.diffName[dd-1]+' até a fase '+D.perEra+' primeiro'):c.reason==='era'?'Feche a era anterior primeiro':'Fase indisponível agora'; }
  else { const cur=mCurEra(); if(e===cur&&dd===0&&n===curN) btn=`<button data-x="play" class="pm-gold pm-glow" style="width:100%;height:54px;border-radius:16px;font-family:'Lilita One',sans-serif;font-size:21px">Desafiar</button>`;
    else lockMsg=!dOpen?(dd>0?'Feche o '+D.diffName[dd-1]+' até a fase '+D.perEra+' primeiro':'Feche a era anterior primeiro'):n<curN?'Fase vencida':'Vença a fase '+(curN)+' primeiro'; }
  const rws=[`<span style="display:flex;align-items:center;gap:3px"><img src="assets/ui/coin.png" alt="" style="width:18px;height:18px"><span style="font-size:12px;font-weight:900">Ouro ×${String(rw.gold).replace('.',',')}</span></span>`,
    `<span style="display:flex;align-items:center;gap:3px"><img src="assets/ui/gem.png" alt="" style="width:18px;height:18px"><span style="font-size:12px;font-weight:900">1ª vitória ×${String(rw.firstWinGems).replace('.',',')}</span></span>`];
  if(rw.firstWinPetFrag) rws.push(`<span style="font-size:12px;font-weight:900;color:#ffb03a">+ fragmento de pet</span>`);
  const panel=`<div style="position:absolute;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:6;border-radius:16px;border:3px solid ${col.c};background:rgba(29,22,17,.96);padding:8px 10px 10px;box-sizing:border-box;display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;align-items:center;gap:8px"><button data-x="prev" aria-label="Fase anterior" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:#2a1d0f;color:#ffe07a;font-family:'Lilita One',sans-serif;font-size:24px;padding:0;visibility:${n>1?'visible':'hidden'}">‹</button>
      <span style="flex:1;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;line-height:1"><span style="font-family:'Lilita One',sans-serif;font-size:21px">Fase ${n}</span><span style="font-size:12px;font-weight:900;color:${col.hi}">${mEsc(inf.diffName)}</span>${tag?`<span style="padding:2px 7px;border-radius:7px;background:#6e1408;color:#ffb03a;font-size:11px;font-weight:900">${tag==='senhor'?'Senhor da Era':'Chefe'}</span>`:''}${n<=best?'<span style="font-size:11px;font-weight:900;color:#7be08a">Vencida</span>':''}</span>
      <button data-x="next" aria-label="Próxima fase" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:#2a1d0f;color:#ffe07a;font-family:'Lilita One',sans-serif;font-size:24px;padding:0;visibility:${n<D.perEra?'visible':'hidden'}">›</button></div>
    <div style="display:flex;align-items:center;gap:8px"><span style="flex:1;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:10px;font-weight:900;color:#c9b9a2">FC recomendada</span><span style="font-family:'Lilita One',sans-serif;font-size:17px;color:#ffc94a">FC ${mFc(rec)}</span><span style="font-size:11px;font-weight:900;color:${fc>=rec?'#7be08a':'#ff8a6a'}">Você: FC ${mFc(fc)}</span></span>
      <span style="display:flex;flex-direction:column;gap:3px;align-items:flex-end">${rws.join('')}</span></div>
    ${btn||`<div role="status" style="display:flex;align-items:center;justify-content:center;gap:6px;height:46px;border-radius:12px;background:#2a1d0f;border:2px solid #6a4a1a;font-size:13px;font-weight:900;color:#ffe07a;text-align:center;padding:0 8px">${mEsc(lockMsg)}</div>`}
    ${on?'':'<span style="font-size:10px;font-weight:800;color:#a89a88;text-align:center">A jornada de 100 fases por dificuldade abre na próxima versão. Hoje a Batalha segue a era atual.</span>'}</div>`;
  const top=`<div style="position:absolute;left:0;right:0;top:0;z-index:5;padding:6px 8px;display:flex;flex-direction:column;gap:6px;background:linear-gradient(180deg,rgba(14,10,7,.95) 70%,rgba(14,10,7,0))">
    <div style="display:flex;align-items:center;gap:8px"><button data-x="world" aria-label="Voltar ao mapa do mundo" style="height:40px;flex:none;border-radius:12px;border:2px solid #6a4a1a;background:#2a1d0f;color:#ffe07a;padding:0 12px;font-weight:900;font-size:13px;display:flex;align-items:center;gap:4px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>Mundo</button>
      <span style="flex:1;display:flex;flex-direction:column;line-height:1.05"><span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:1px">ERA ${e} · ${D.perEra} FASES</span><span style="font-family:'Lilita One',sans-serif;font-size:20px;color:${M_ERAS[e].tint}">${mEsc(D.eraName[e])}</span></span>
      <span aria-hidden="true" style="width:34px;height:34px;background:url(assets/map/clock_shards/shard_${e}.png) center/contain no-repeat;${mCleared(e)?'':'filter:grayscale(1) brightness(.5)'}"></span></div>
    <div role="tablist" aria-label="Dificuldade" style="display:flex;gap:5px">${tabs}</div>
    <span style="font-size:11px;font-weight:800;color:#e8dccb;text-align:center;line-height:1.2">${mEsc(rule)}</span></div>`;
  const map=`<div id="pm_era" class="x-scroll" style="position:absolute;inset:0;overflow-y:auto;overflow-x:hidden">
    <div style="position:relative;width:390px;height:${ME_H+150}px;padding-top:120px;box-sizing:content-box">
      <div style="position:absolute;left:0;top:120px;width:390px;height:${ME_H}px">
        <div aria-hidden="true" style="position:absolute;left:${Math.round(ME.OX)}px;top:0;width:${Math.round(1536*ME.S)}px;height:${Math.round(2752*ME.S)}px;background:url(assets/map/era${e}.jpg) 0 0/100% 100% no-repeat"></div>
        ${dots}${arena}${nodes}${kael}</div></div></div>`;
  return map+top+panel;
}

function scrMap(){
  mInject();
  const d=xDims(640), P=mP();
  if(!P){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Mapa das Eras indisponível agora.</div>`); return; }
  if(XM.toast&&Date.now()>XM.tt) XM.toast='';
  const keepW=document.getElementById('pm_world'), keepE=document.getElementById('pm_era'), sw=keepW?keepW.scrollTop:null, se=keepE?keepE.scrollTop:null;
  const body=XM.layer==='era'?mEraLayer():mWorld(d);
  const toast=XM.toast?`<div role="status" class="pm-pop" style="position:absolute;left:50%;top:40%;transform:translateX(-50%);z-index:40;max-width:300px;padding:10px 16px;border-radius:14px;background:#241a10;border:2px solid #ffc94a;font-size:13px;font-weight:900;color:#ffe07a;text-align:center">${mEsc(XM.toast)}</div>`:'';
  V.innerHTML=xWrap(d,XM.anim?'f-in':'',`<div style="position:relative;flex:1;min-height:${Math.round(d.H)}px;overflow:hidden;background:#0e0a07">${body}${toast}</div>`);
  XM.anim=false;
  /* rolagem: mantém onde estava; ao abrir/trocar de camada, leva até a era atual / à fase escolhida */
  const w=document.getElementById('pm_world'), ea=document.getElementById('pm_era');
  if(w){ if(XM.scrollTo==='world'){ const cur=mCurEra(); w.scrollTop=Math.max(0,mwy(M_ERAS[cur].o[1])-w.clientHeight*0.55); XM.scrollTo=''; } else if(sw!=null) w.scrollTop=sw; }
  if(ea){ if(XM.scrollTo==='era'){ const p=M_GEO.nodes[XM.node-1]; ea.scrollTop=Math.max(0,p[1]+120-ea.clientHeight*0.45); XM.scrollTo=''; } else if(se!=null) ea.scrollTop=se; }
}
/* a LUTA chama window.PMap.win(e,d,n) quando o jogador vence a fase: grava pelo Sys.phases.win e guarda o resultado para o aviso do mapa */
function mWin(e,d,n){ const P=mP(); if(!P||!mOn()) return {ok:false,reason:'off'}; const r=P.win(S,Sys.host,e,d,n); if(r&&r.ok) XM.last={e,d,n,first:r.first,era:r.eraUnlocked,next:r.next}; try{ if(r&&r.ok&&Sys.host&&Sys.host.onChange) Sys.host.onChange(); }catch(x){} return r; }
function mLastNotice(){ const L=XM.last; XM.last=null; if(!L) return ''; const P=mP();
  if(L.era!=null) return 'Era '+L.era+' liberada: '+P.DATA.eraName[L.era]+'!'; return (L.first?'Fase ':'Fase repetida ')+L.n+' vencida'+(L.first&&L.next?'. Próxima: fase '+L.next.n+' ('+P.DATA.diffName[L.next.d]+', era '+L.next.e+')':'')+'.'; }
window.PMap={win:mWin,current:()=>mCurPos(),state:XM};
function mEnter(e){ const P=mP(); XM.layer='era'; XM.era=e; XM.sel=-1;
  const cp=mCurPos(); if(cp&&cp.e===e&&mDiffOpen(e,cp.d)){ XM.diff=cp.d; XM.node=cp.n; XM.scrollTo='era'; XM.anim=true; return; }
  let d=0; for(let k=0;k<P.DATA.diffs;k++){ if(mDiffOpen(e,k)&&mBest(e,k)<P.DATA.perEra){ d=k; break; } d=k; }
  XM.diff=d; XM.node=Math.min(P.DATA.perEra,mBest(e,d)+1); XM.scrollTo='era'; XM.anim=true; }
function mClick(b){
  const a=b.dataset.x, P=mP(); if(!P) return;
  if(a==='era'){ snd('ui_tap'); XM.sel=+b.dataset.e; render(); }
  else if(a==='close'){ snd('ui_tap'); XM.sel=-1; render(); }
  else if(a==='clock'){ snd('ui_tap'); XM.clock=true; render(); }
  else if(a==='closeclock'){ snd('ui_tap'); XM.clock=false; render(); }
  else if(a==='pickcur'){ snd('ui_tap'); XM.sel=mCurEra(); render(); }
  else if(a==='enter'){ snd('claim'); mEnter(+b.dataset.e); render(); }
  else if(a==='world'){ snd('ui_tap'); XM.layer='world'; XM.scrollTo='world'; render(); }
  else if(a==='diff'){ const d=+b.dataset.d; if(!mDiffOpen(XM.era,d)){ snd('ui_tap'); mToast(d>0?'Feche o '+P.DATA.diffName[d-1]+' até a fase '+P.DATA.perEra+' para abrir o '+P.DATA.diffName[d]:'Feche a era anterior primeiro'); return; }
    snd('ui_tap'); XM.diff=d; XM.node=Math.min(P.DATA.perEra,mBest(XM.era,d)+1); XM.scrollTo='era'; render(); }
  else if(a==='node'){ snd('ui_tap'); XM.node=+b.dataset.n; render(); }
  else if(a==='prev'){ if(XM.node>1){ snd('ui_tap'); XM.node--; XM.scrollTo='era'; render(); } }
  else if(a==='next'){ if(XM.node<P.DATA.perEra){ snd('ui_tap'); XM.node++; XM.scrollTo='era'; render(); } }
  else if(a==='fight'){ const c=P.canChallenge(S,Sys.host,XM.era,XM.diff,XM.node,mFC()); if(!c.ok){ snd('ui_tap'); render(); return; }
    snd('claim'); try{ P.ensure(S).cur={e:XM.era,d:XM.diff,n:XM.node}; if(Sys.host&&Sys.host.onChange) Sys.host.onChange(); }catch(e){ console.error('mapa: fase',e); }
    try{ if(window.Screens&&Screens.close) Screens.close(); if(Sys.host&&Sys.host.goTab) Sys.host.goTab('battle'); }catch(e){ console.error('mapa: batalha',e); } }
  else if(a==='play'){ snd('claim'); try{ if(window.Screens&&Screens.close) Screens.close(); if(Sys.host&&Sys.host.goTab) Sys.host.goTab('battle'); }catch(e){ console.error('mapa: batalha',e); } }
}

Panels.add('map',{title:'Mapa das Eras',render:scrMap,click:mClick,
  tick(){ if(XM.toast&&Date.now()>XM.tt){ XM.toast=''; render(); } },
  busy(){ return false; },
  onOpen(o){ XM.layer='world'; XM.sel=-1; XM.clock=false; XM.toast=''; XM.anim=true; XM.scrollTo='world'; const nt=mLastNotice(); if(nt){ XM.toast=nt; XM.tt=Date.now()+4200; }
    if(o&&Number.isInteger(o.era)&&mP()){ mEnter(Math.max(0,Math.min(mP().DATA.eras-1,o.era))); } },
  onClose(){ XM.sel=-1; XM.clock=false; XM.toast=''; } });
