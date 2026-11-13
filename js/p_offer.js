'use strict';
/* ================= 22 OFERTA DE PRIMEIRA COMPRA — tela nova, nasce DESLIGADA (PANEL_ON.offer) =================
   Protótipo: docs/proto/OfertaInicial.dc.html. NENHUMA regra de jogo aqui: janela de 24 h, o que já foi comprado/expirou, preço e conteúdo do pacote
   vêm do Sys.offer (js/sys/offer.js, §5i do reports/sys-e2-api.md; spec em reports/spec-oferta-montaria.md).
   O Sys.offer está ATRÁS DE CHAVE e pode nem estar carregado: sem o módulo, ou com a chave dele desligada, a tela mostra "Oferta: em breve".
   A tela NÃO liga nenhuma chave do módulo e NÃO chama Sys.offer.grant: a entrega é do jogo/servidor, depois do pagamento confirmado.
   COMPRA (decisão do PO): pagamento real só existe com o backend. O botão de comprar abre o aviso "Pagamento em breve":
   nada é cobrado, nada é entregue, nada muda no save.
   LAYOUT (PANEL_V2.real): o cabeçalho (Voltar, título, moedas, gemas) é do index.html/fullbattle.js; aqui só o conteúdo, em tamanho real
   (largura de 320 a 600, altura útil d.H). O miolo ROLA (x-scroll, o redesenho devolve o scrollTop); a ação principal fica numa barra fixa embaixo;
   em tela alta a vitrine cresce até 210 px e a sobra fica no fim do miolo, antes da barra.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - o protótipo é um modal sobre a batalha; aqui é um painel: sem a batalha atrás, sem a moldura giratória do modal, sem o botão X e sem
     "Agora não" (quem sai é o Voltar do cabeçalho comum; a tela não tem voltar próprio);
   - sem preço riscado nem "de X por Y" (PO): "Pacote exclusivo · compra única" + o preço que o Sys.offer devolve; sem preço no módulo, nenhum número;
   - comprar abre "Pagamento em breve" (PO); por isso não há "Processando", itens voando nem entrega aqui. O estado "comprado" (carimbo, vistos,
     "Ver no Equipamento") só aparece quando o jogo/servidor já tiver chamado Sys.offer.grant;
   - nome da arma = o texto que o módulo devolve (contents.weapon); ícone = a arma da era atual do jogador (é a era em que ela chega);
   - montaria (POLIMENTO P1): arte REAL, o Kael montado no Lobo de guerra (assets/anim/mounts/kael_<id>_idle_era2_t1.png) na vitrine e no card;
     sem a folha da montaria, volta o marcador neutro (névoa + ferradura). Nome do Sys.mount; o bônus aparece como "até +X%" (teto do Sys.mount);
   - ouro: o módulo guarda "goldk × ouro de um abate"; a tela mostra goldk × Sys.host.goldUnit() (ou "de N abates" se o jogo não der a unidade);
   - estado a mais, que o módulo modela e o protótipo não: quem já fez outra compra (reason 'not_first_purchase') vê "Oferta indisponível";
   - sem os botões "PROTÓTIPO" (pular tempo, reiniciar). */
if(!('offer' in PANEL_ON)) PANEL_ON.offer=false;
const XO={anim:true,dlg:false,sig:'',busy:false};   /* dlg: false | 'soon' | 'pending' | 'erro' (Sys.buy) */

/* ---------- chamadas ao Sys ISOLADAS (valor de reserva seguro; o que falta no módulo está anotado em cada uma) ---------- */
const ofM=()=>(typeof Sys!=='undefined'&&Sys&&Sys.offer)||null;
const ofHost=()=>(typeof Sys!=='undefined'&&Sys&&Sys.host)||null;
const ofNum=v=>typeof v==='number'&&isFinite(v);
/* estado da oferta: soon (sem módulo / chave desligada / erro) · live · done (entregue) · used (já fez outra compra) · expired */
function ofState(){ const M=ofM(); if(!M||typeof M.status!=='function') return {kind:'soon'};
  let st=null; try{ st=M.status(S,ofHost()); }catch(e){ return {kind:'soon'}; }
  if(!st||st.on!==true) return {kind:'soon'};
  const kind=st.claimed?'done':st.available?'live':st.reason==='not_first_purchase'?'used':'expired';
  return {kind,st,ms:ofNum(st.msLeft)?Math.max(0,st.msLeft):0,c:st.contents||{}}; }
/* preço: só o que o módulo der (status().price, em reais). Sem número válido, a tela não mostra preço nenhum */
function ofPrice(o){ const p=o.st&&o.st.price; return ofNum(p)&&p>0?'R$ '+p.toFixed(2).replace('.',','):''; }
/* FALTA NO MÓDULO: o conteúdo traz só o texto da arma (contents.weapon); raridade e qualidade saem de Sys.offer.DATA.weapon (r, qp) */
function ofWeapon(o){ const M=ofM(), W=(M&&M.DATA&&M.DATA.weapon)||{}, r=ofNum(W.r)?W.r:-1; let stars=0, max=0;
  try{ if(ofNum(W.qp)&&Sys.stats&&Sys.stats.qualityStars){ stars=Sys.stats.qualityStars(W.qp)|0; max=(Sys.stats.DATA.quality.stars||[]).length|0; } }catch(e){ stars=0; max=0; }
  const h=ofHost(); let era=0; try{ era=h&&h.eraMax?h.eraMax()|0:(S.eraMax|0); }catch(e){ era=0; }
  return {name:typeof o.c.weapon==='string'&&o.c.weapon?o.c.weapon:'Arma',r,stars,max,slot:typeof W.slot==='string'?W.slot:'weapon',era}; }
/* montaria: nome, raridade e teto do bônus pelo Sys.mount (pode não estar carregado: aí o módulo devolve só o id e a tela diz "Montaria") */
function ofMount(o){ const M=ofM(), id=M&&M.DATA?M.DATA.mount:''; let inf=null, vis=false;
  try{ if(Sys.mount&&Sys.mount.info){ inf=Sys.mount.info(S,ofHost(),id); vis=!!(Sys.mount.DATA&&Sys.mount.DATA.visual===true); } }catch(e){ inf=null; }
  const nm=inf&&inf.name?inf.name:(typeof o.c.mount==='string'&&o.c.mount&&o.c.mount!==id?o.c.mount:'Montaria');
  return {id:/^[a-z0-9_]+$/.test(id)?id:'',name:nm,rar:inf&&inf.rarityName?inf.rarityName:'',r:inf&&ofNum(inf.rarity)?inf.rarity:-1,pct:inf&&ofNum(inf.maxPct)?inf.maxPct:0,vis}; }
/* POLIMENTO P1: arte REAL da montaria = o Kael montado (assets/anim/mounts/kael_<id>_idle_era2_t1.png, 12 quadros de 512x352, patas em 339) */
const ofMountSheet=M=>M&&M.id?'assets/anim/mounts/kael_'+M.id+'_idle_era2_t1.png':'';
/* POLIMENTO (PO): o Kael montado segura a ARMA DA OFERTA (não a espada da folha). Desenho do próprio jogo (drawHero da batalha, com a montaria e a
   arma trocável pelo grip quadro a quadro), num canvas da vitrine; sem o desenho do jogo, fica a folha (of-ride) como antes. */
const OFR={x:0,gy:0,t:0,sk:null,ws:null,walking:false,hurt:0,deadP:-1,act:null,main:false,mount:null}; let ofRaf=0, ofLast=0;
const ofCanDraw=()=>typeof drawHero==='function'&&typeof mainCtx!=='undefined'&&typeof SKIN==='function'&&typeof HS==='number';
/* desenha nos canvases da tela: vitrine (of_rc, inteiro) e card da montaria (of_rc2, mais perto) */
function ofRideDraw(c,zoom,dx){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  const x=c.getContext('2d'), k=c.height/(HS*zoom); x.setTransform(k,0,0,k,0,0); x.clearRect(0,0,c.width/k+2,HS*zoom+2);
  OFR.x=(c.width/k)/2+HS*dx; OFR.gy=HS*(zoom-0.02);
  ctx=x; try{ drawHero(OFR); }finally{ ctx=mainCtx; } }
function ofRideLoop(ts){ ofRaf=0; const c=document.getElementById('of_rc'), c2=document.getElementById('of_rc2');
  if((!c&&!c2)||typeof view==='undefined'||view!=='offer'){ ofLast=0; return; }
  const dt=ofLast?Math.min(0.05,(ts-ofLast)/1000):0; ofLast=ts; OFR.t+=dt;
  try{ if(c) ofRideDraw(c,1.42,-0.12); if(c2) ofRideDraw(c2,1.32,-0.05); }catch(e){ ctx=mainCtx; }
  ofRaf=requestAnimationFrame(ofRideLoop); }
function ofRideStart(W,M){ if(!ofCanDraw()||!M||!M.id) return;
  const e=Math.max(0,Math.min(6,W.era|0)), r=Math.max(0,Math.min(4,W.r|0));
  OFR.sk=SKIN(S.skinEq&&S.skinEq.armor)||SKIN('a00'); OFR.ws=SKIN('w'+e+r)||OFR.ws; OFR.mount={id:M.id,stars:3,aura:null};
  try{ if(typeof preloadAssets==='function') preloadAssets(); }catch(e){}
  if(!ofRaf) ofRaf=requestAnimationFrame(ofRideLoop); }
/* FALTA NO MÓDULO: uma prévia do ouro entregue. A conta do grant é goldk × host.goldUnit(); sem a unidade, a tela diz "de N abates" */
function ofGold(o){ const k=ofNum(o.c.goldk)?o.c.goldk:0, h=ofHost(); let u=0; try{ u=h&&h.goldUnit?+h.goldUnit():0; }catch(e){ u=0; }
  if(!(k>0)) return {big:'',small:''}; return ofNum(u)&&u>0?{big:kf(Math.round(k*Math.max(1,u))),small:'ouro'}:{big:'Ouro',small:'de '+n0(k)+' abates'}; }
const ofPad=n=>(n<10?'0':'')+n;
function ofClock(ms){ const sec=Math.floor(Math.max(0,ms)/1000); return {h:Math.floor(sec/3600),m:Math.floor(sec%3600/60),hh:ofPad(Math.floor(sec/3600)),mm:ofPad(Math.floor(sec%3600/60)),ss:ofPad(sec%60)}; }
/* texto do prazo: as horas da janela vêm de Sys.offer.DATA.windowMs */
function ofWindowTxt(){ const M=ofM(), w=M&&M.DATA?M.DATA.windowMs:0; if(!ofNum(w)||w<=0) return ''; const h=Math.round(w/3600000); return h>=1?'válida por '+h+' h a partir do primeiro acesso':''; }
function ofOn(){ return typeof view!=='undefined'&&view==='offer'; }
/* assinatura do que muda por fora (estado, conteúdo, ouro da fase): o tick redesenha só quando ela muda */
function ofSig(o){ if(o.kind==='soon') return 'soon'; const g=ofGold(o); return [o.kind,ofPrice(o),o.c.weapon,o.c.mount,o.c.gems,g.big,g.small,XO.dlg?1:0].join('|'); }

(function(){ const st=document.createElement('style'); st.textContent=`
.of-in{animation:of-fade .25s ease-out both}
@keyframes of-fade{from{opacity:0}to{opacity:1}}
.of-gtext{background:linear-gradient(100deg,#ffe07a 20%,#fff8de 45%,#f2a826 60%,#ffe07a 80%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:of-gsh 3s linear infinite}
@keyframes of-gsh{from{background-position:120% 0}to{background-position:-130% 0}}
.of-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(rgba(190,140,255,.42) 0deg 8deg,rgba(190,140,255,0) 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 18%,transparent 68%);mask:radial-gradient(circle,#000 18%,transparent 68%);animation:of-spin 18s linear infinite;pointer-events:none}
@keyframes of-spin{to{transform:rotate(360deg)}}
.of-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#f3e6ff;box-shadow:0 0 10px 3px rgba(190,140,255,.9);animation:of-tw 1.8s ease-in-out infinite;pointer-events:none}
@keyframes of-tw{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1.2);opacity:1}}
.of-dig{min-width:44px;height:40px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:linear-gradient(180deg,#2c1a44,#120a1c);border:2px solid #b07cff;display:flex;align-items:center;justify-content:center;font-family:'Lilita One',Nunito,sans-serif;font-size:26px;line-height:1;color:#fff;font-variant-numeric:tabular-nums;box-shadow:inset 0 2px 0 rgba(255,255,255,.08),0 0 10px rgba(176,124,255,.35)}
.of-digS{animation:of-digK 1s ease-in-out infinite}
@keyframes of-digK{0%,100%{box-shadow:inset 0 2px 0 rgba(255,255,255,.08),0 0 6px rgba(176,124,255,.3)}50%{box-shadow:inset 0 2px 0 rgba(255,255,255,.08),0 0 16px rgba(255,201,74,.75);border-color:#ffc94a}}
.of-colon{font-family:'Lilita One',Nunito,sans-serif;font-size:24px;color:#d9b3ff;animation:of-blink 1s steps(2,jump-none) infinite}
@keyframes of-blink{0%{opacity:1}100%{opacity:.35}}
.of-wglow{animation:of-wglowK 1.8s ease-in-out infinite}
@keyframes of-wglowK{0%,100%{box-shadow:0 0 8px 1px rgba(176,124,255,.55),inset 0 0 12px rgba(176,124,255,.35)}50%{box-shadow:0 0 22px 6px rgba(176,124,255,.95),inset 0 0 18px rgba(220,190,255,.55)}}
.of-wimg{animation:of-shineP 1.8s ease-in-out infinite}
.of-hshoe{animation:of-shineP 2.8s ease-in-out infinite}
@keyframes of-shineP{0%,100%{filter:drop-shadow(0 0 2px rgba(220,190,255,.6))}50%{filter:drop-shadow(0 0 7px rgba(255,230,140,1)) brightness(1.2)}}
.of-sheen{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.5) 50%,transparent 65%);background-size:260% 100%;animation:of-gsh 2.6s ease-in-out infinite;pointer-events:none}
.of-star{animation:of-starK 2.4s ease-in-out infinite}
@keyframes of-starK{0%,100%{filter:drop-shadow(0 0 1px rgba(255,201,74,.4))}50%{filter:drop-shadow(0 0 5px rgba(255,201,74,1))}}
.of-rarP{animation:of-rarK 2.2s ease-in-out infinite}
@keyframes of-rarK{0%,100%{box-shadow:0 0 0 rgba(176,124,255,0)}50%{box-shadow:0 0 10px rgba(176,124,255,.95)}}
.of-card{position:relative;min-width:0;border-radius:14px;border:2px solid #b07cff;background:linear-gradient(180deg,#2a1840,#170e24);overflow:hidden;box-sizing:border-box}
.of-in .of-card{animation:of-cardIn .4s cubic-bezier(.2,1.3,.4,1) both}
@keyframes of-cardIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}
.of-got{border-color:#5fd068!important}
.of-off{filter:grayscale(.85) brightness(.7)}
.of-ride{background-repeat:no-repeat;background-size:1200% 100%;animation:of-rideK 1s steps(12,jump-none) infinite}
@keyframes of-rideK{from{background-position:0 0}to{background-position:100% 0}}
.of-mist{position:absolute;inset:0;border-radius:inherit;background:radial-gradient(60% 50% at 50% 60%,rgba(220,190,255,.55),rgba(176,124,255,.18) 55%,rgba(176,124,255,0) 75%);animation:of-mistK 2.8s ease-in-out infinite}
@keyframes of-mistK{0%,100%{opacity:.6;transform:scale(.92)}50%{opacity:1;transform:scale(1.06)}}
.of-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.of-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.of-cta{animation:of-ctaK 1.5s ease-in-out infinite}
@keyframes of-ctaK{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 8px rgba(255,201,74,.3)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 26px rgba(255,201,74,.95)}}
.of-green{background:linear-gradient(180deg,#7fe07a,#3fae3c);color:#0d2410!important;box-shadow:0 6px 0 #1f6a1d;border:0}
.of-green:active{transform:translateY(4px);box-shadow:0 2px 0 #1f6a1d}
.of-grey:active{transform:translateY(2px)}
.of-stamp{transform:rotate(-12deg)}
.of-in .of-stamp{animation:of-stampK .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes of-stampK{0%{opacity:0;transform:rotate(-12deg) scale(2.4)}100%{opacity:1;transform:rotate(-12deg) scale(1)}}
.of-in .of-ribbon,.of-in .of-chk{animation:of-mIn .35s cubic-bezier(.2,1.3,.4,1) both}
.of-dlg{animation:of-mIn .42s cubic-bezier(.2,1.3,.4,1) both}
@keyframes of-mIn{from{opacity:0;transform:scale(.86)}to{opacity:1;transform:none}}
.of-dim{animation:of-fade .25s ease-out both}
.of-soon{animation:of-soonK 2s ease-in-out infinite}
@keyframes of-soonK{0%,100%{opacity:.75}50%{opacity:1}}
@media (prefers-reduced-motion:reduce){.of-gtext,.of-rays,.of-spark,.of-digS,.of-colon,.of-wglow,.of-wimg,.of-hshoe,.of-ride,.of-sheen,.of-star,.of-rarP,.of-mist,.of-cta,.of-soon{animation:none}}
`; document.head.appendChild(st); })();

const OF_BG='radial-gradient(130% 70% at 50% 0%,#3f2166 0%,#1e1230 52%,#140c1f 100%)';
const OF_CLOCK=(s,w)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${w||2.6}" stroke-linecap="round" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>`;
const OF_CHECK=(s,c,w)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M5 12l5 5 9-10"></path></svg>`;
const OF_SHOE=(s,c)=>`<svg class="of-hshoe" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="position:relative"><path d="M6 20V11a6 6 0 0 1 12 0v9"></path><path d="M4 20h4M16 20h4"></path><circle cx="7.6" cy="12" r=".6" fill="${c}"></circle><circle cx="16.4" cy="12" r=".6" fill="${c}"></circle><circle cx="12" cy="6.4" r=".6" fill="${c}"></circle></svg>`;
const OF_GOT=`<span class="of-chk" role="img" aria-label="Recebido" style="position:absolute;right:6px;top:6px;width:24px;height:24px;border-radius:50%;background:#5fd068;display:flex;align-items:center;justify-content:center">${OF_CHECK(14,'#0d2410',4)}</span>`;

/* ---------- estado vazio honesto: sem módulo ou com a chave do módulo desligada ---------- */
function ofSoon(d){
  return xWrap(d,XO.anim?'of-in':'',`<div role="status" style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 28px;text-align:center;box-sizing:border-box;background:${OF_BG}">
    <span class="of-soon" style="width:76px;height:76px;border-radius:50%;border:2px solid #b07cff;background:#1d1030;color:#d9b3ff;display:flex;align-items:center;justify-content:center">${OF_CLOCK(40,2.2)}</span>
    <span class="lil" style="font-size:26px;color:#fff">Oferta: em breve</span>
    <span style="font-size:14px;font-weight:800;color:#d9c4f2;line-height:1.3;max-width:300px">A oferta de primeira compra ainda não está disponível nesta versão do jogo. Nada é cobrado por aqui.</span></div>`);
}
/* ---------- aviso do botão de comprar (PO): nada é cobrado, nada é entregue, nada muda no save ---------- */
/* textos do aviso por situação (compra pelo Sys.buy, js/sys/buy.js): 'soon' = sem Google Play/servidor ainda; 'pending' = pagamento pendente
   (boleto/aprovação): a entrega chega sozinha quando o Google confirmar; 'erro' = não deu certo (nada foi cobrado pelo jogo). */
const OF_DLG={soon:['Pagamento em breve','A compra com dinheiro ainda não está disponível nesta versão do jogo.','Nada foi cobrado e nada foi entregue.'],
  pending:['Pagamento pendente','O Google Play ainda está confirmando o pagamento. Os itens chegam sozinhos assim que ele aprovar.','Você não precisa comprar de novo.'],
  erro:['Não deu certo','A compra não foi concluída. Confira a conexão e tente de novo.','Se algo foi cobrado, os itens chegam na próxima abertura do jogo.']};
function ofDialog(){
  const T=OF_DLG[XO.dlg]||OF_DLG.soon;
  return `<div class="of-dim" data-x="payok" style="position:absolute;inset:0;z-index:20;background:rgba(8,5,14,.78);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box">
    <div class="of-dlg" data-x="noop" role="dialog" aria-modal="true" aria-labelledby="of_pt" style="width:100%;max-width:340px;border-radius:20px;border:2px solid #b07cff;background:linear-gradient(180deg,#2a1840,#170e24);box-shadow:0 0 30px rgba(176,124,255,.5),0 18px 40px rgba(0,0,0,.6);padding:18px 16px 16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center">
      <span style="width:56px;height:56px;border-radius:50%;border:2px solid #b07cff;background:#1d1030;color:#ffe07a;display:flex;align-items:center;justify-content:center">${OF_CLOCK(30,2.4)}</span>
      <span id="of_pt" class="lil" style="font-size:24px;line-height:1.1;color:#fff">${T[0]}</span>
      <span style="font-size:14px;font-weight:800;color:#e2d4f2;line-height:1.3">${T[1]}</span>
      <span style="font-size:13px;font-weight:900;color:#a8f0ae;line-height:1.3">${T[2]}</span>
      <button class="of-gold lil" data-x="payok" style="margin-top:4px;width:100%;height:52px;border-radius:16px;padding:0;font-size:21px">Entendi</button></div></div>`;
}

function scrOffer(){
  const d=xDims(240), o=ofState();
  if(o.kind==='soon'){ XO.dlg=false; V.innerHTML=ofSoon(d); XO.anim=false; XO.sig='soon'; return; }
  if(o.kind!=='live') XO.dlg=false;
  const sc0=XO.anim?null:document.getElementById('of_scroll'), y0=sc0?(+sc0.scrollTop||0):0;   /* o redesenho não pode devolver a rolagem ao topo */
  const live=o.kind==='live', done=o.kind==='done', off=o.kind==='expired'||o.kind==='used';
  const W=ofWeapon(o), M=ofMount(o), G=ofGold(o), price=ofPrice(o), t=ofClock(o.ms), win=ofWindowTxt();
  const rc=r=>(r>=0&&RC[r])||'#b07cff', wCol=rc(W.r), mCol=rc(M.r), wRar=W.r>=0?RN(W.r):'';
  const wIcon=slotIcon(W.slot,W.era), cardCls='of-card'+(done?' of-got':'')+(off?' of-off':''), resCls='of-card'+(off?' of-off':'');
  const sa=SKIN(S.skinEq.armor), tier=tierOf(sa?sa.r:0);
  const pedH=Math.max(14,Math.min(40,Math.round(d.H*0.09)));

  /* ----- faixa de cima: relógio (ids para o tick) ou a faixa do estado ----- */
  const ribbon=(txt,ico,bg,bd,fg)=>`<div class="of-ribbon" role="status" style="flex:none;min-height:44px;padding:4px 10px;box-sizing:border-box;border-radius:12px;background:${bg};border:2px solid ${bd};color:${fg};display:flex;align-items:center;justify-content:center;gap:8px;text-align:center;line-height:1.1;font-family:'Lilita One',Nunito,sans-serif;font-size:${d.Wb<350?18:21}px">${ico}${txt}</div>`;
  const top=live?`<div style="flex:none;display:flex;align-items:center;justify-content:center">
        <div role="timer" aria-live="off" aria-label="Termina em ${t.h} horas e ${t.m} minutos" style="display:flex;align-items:center;gap:4px">
          <span style="font-size:11px;font-weight:900;color:#d9c4f2;line-height:1.1;text-align:right;margin-right:2px">TERMINA<br>EM</span>
          <span class="of-dig" id="of_hh">${t.hh}</span><span class="of-colon">:</span>
          <span class="of-dig" id="of_mm">${t.mm}</span><span class="of-colon">:</span>
          <span class="of-dig of-digS" id="of_ss">${t.ss}</span></div></div>`
    :done?ribbon('Itens entregues no inventário',OF_CHECK(20,'currentColor',3),'rgba(95,208,104,.16)','#5fd068','#a8f0ae')
    :o.kind==='used'?ribbon('Oferta indisponível',OF_CLOCK(20),'#2a2433','#6b5f7a','#e6dcf0')
    :ribbon('Oferta encerrada',OF_CLOCK(20),'#2a2433','#6b5f7a','#e6dcf0');

  /* ----- vitrine: Kael parado ao lado da arma num pedestal (nada flutua; chão em 18 px da base) ----- */
  const show=`<div style="position:relative;flex:1 0 170px;max-height:210px;border-radius:16px;border:1px solid rgba(176,124,255,.5);background:radial-gradient(80% 90% at 55% 60%,#5b2f8f 0%,#2a1640 55%,#150c22 100%);overflow:hidden${off?';filter:grayscale(.7) brightness(.8)':''}">
      <div class="of-rays" style="left:50%;top:50%;width:360px;height:360px;margin:-200px 0 0 -110px"></div>
      <span class="of-spark" style="left:12%;top:18%"></span><span class="of-spark" style="left:86%;top:14%;animation-delay:.5s"></span>
      <span class="of-spark" style="left:52%;top:30%;animation-delay:1s"></span><span class="of-spark" style="left:92%;top:56%;animation-delay:1.4s"></span>
      <div style="position:absolute;left:0;right:0;bottom:0;height:18px;background:linear-gradient(180deg,#4a2f6a,#24163a);border-top:2px solid rgba(220,190,255,.45)"></div>
      <div style="position:absolute;left:14%;width:34%;bottom:10px;height:14px;border-radius:50%;background:rgba(0,0,0,.45)"></div>
      ${ofMountSheet(M)?(ofCanDraw()?`<canvas id="of_rc" role="img" aria-label="Kael montado no ${esc2(M.name)} com a arma da oferta" style="position:absolute;left:4%;bottom:10px;width:62%;height:96%;z-index:2"></canvas>`
        :`<div class="of-ride" role="img" aria-label="Kael montado no ${esc2(M.name)}" style="position:absolute;left:34%;bottom:calc(18px - 3.6%);height:96%;aspect-ratio:512 / 352;transform:translateX(-50%);z-index:2;background-image:url(${ofMountSheet(M)})"></div>`)
        :`<div class="kidle ${tier?'t'+tier:''}" role="img" aria-label="Kael parado ao lado da arma da oferta" style="position:absolute;left:31%;bottom:calc(18px - 4.7%);height:94%;aspect-ratio:1 / 1;transform:translateX(-50%);z-index:2"></div>`}
      <div style="position:absolute;left:72%;bottom:18px;width:76px;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;z-index:2">
        <div class="of-wglow" style="position:relative;width:72px;height:72px;border-radius:16px;border:3px solid ${wCol};background:radial-gradient(circle at 50% 45%,#7a45b8,#2a1640 78%);display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box">
          <img class="of-wimg" src="${xRarIco(wIcon,W.r,60)}" alt="${esc2(W.name)}" style="width:60px;height:60px;object-fit:contain"><span class="of-sheen"></span></div>
        <div style="width:62px;height:8px;background:#6a5a7e;border-radius:3px 3px 0 0;margin-top:2px"></div>
        <div style="width:50px;height:${pedH}px;background:linear-gradient(90deg,#3c3150,#5d4f72 50%,#3c3150);display:flex;align-items:flex-start;justify-content:center;padding-top:${pedH>=22?4:1}px;box-sizing:border-box">
          ${W.stars>0?`<span style="font-size:9.5px;font-weight:900;color:#ffe07a;white-space:nowrap;line-height:12px">${W.stars}<svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style="vertical-align:-1px;margin-left:1px"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"></path></svg></span>`:''}</div>
        <div style="width:68px;height:7px;background:#4c4060;border-radius:3px 3px 0 0"></div></div>
      ${done?`<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;z-index:5;pointer-events:none">
        <span class="of-stamp lil" style="padding:4px 18px;border-radius:12px;border:4px solid #5fd068;background:rgba(13,36,16,.82);color:#a8f0ae;font-size:${d.Wb<350?28:34}px;letter-spacing:2px;box-shadow:0 0 24px rgba(95,208,104,.6)">COMPRADO</span></div>`:''}
    </div>`;

  /* ----- o que vem no pacote (compra direta, sem sorteio) ----- */
  let stars=''; for(let i=0;i<W.max;i++) stars+=`<svg class="of-star" width="13" height="13" viewBox="0 0 24 24" aria-hidden="true" style="animation-delay:${(i*0.15).toFixed(2)}s"><path d="M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z" fill="${i<W.stars?'#ffc94a':'#3a2a4c'}" stroke="#6a3a08" stroke-width="1.4" stroke-linejoin="round"></path></svg>`;
  const tag=(txt,col)=>txt?`<span class="of-rarP" style="align-self:flex-start;padding:1px 7px;border-radius:7px;background:${col};color:#16110d;font-size:11px;font-weight:900;white-space:nowrap">${esc2(txt)}</span>`:'';
  const nameSt=`font-size:16px;line-height:1.05;color:#fff;overflow-wrap:anywhere`, descSt='font-size:11.5px;font-weight:800;line-height:1.2;color:#e2d4f2';
  const mDesc=(M.vis?'O Kael cavalga a montaria na batalha':'Montaria do Kael')+(M.pct>0?' · até +'+String(M.pct).replace('.',',')+'% de ataque e vida':'');
  const res=(img,big,small,col,delay)=>`<div class="${resCls}" style="min-height:50px;padding:4px 10px;display:flex;align-items:center;gap:8px;border-color:${col};animation-delay:${delay}s">
        <img class="of-wimg" src="${img}" alt="" style="width:32px;height:32px;object-fit:contain;flex:none">
        <span style="display:flex;flex-direction:column;line-height:1.05;min-width:0"><b class="lil" style="font-weight:400;font-size:18px;color:#fff;white-space:nowrap">${esc2(big)}</b><span style="font-size:11px;font-weight:900;color:${col==='#ffc94a'?'#f2e0b8':'#c9dcf2'}">${esc2(small)}</span></span></div>`;
  const grid=`<div style="flex:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px">
      <div class="${cardCls}" style="padding:8px;display:flex;flex-direction:column;gap:4px;border-color:${wCol}">
        <div style="display:flex;gap:7px;align-items:center">
          <div class="of-wglow" style="position:relative;width:48px;height:48px;flex:none;border-radius:12px;border:2px solid ${wCol};background:radial-gradient(circle,#7a45b8,#2a1640 78%);display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box">
            <img class="of-wimg" src="${xRarIco(wIcon,W.r,40)}" alt="" style="width:40px;height:40px;object-fit:contain"></div>
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0">${tag(wRar,wCol)}
            ${W.max>0?`<span role="img" aria-label="Qualidade ${W.stars} de ${W.max} estrelas" style="display:flex;gap:1px">${stars}</span>`:''}</div></div>
        <span class="lil" style="${nameSt}">${esc2(W.name)}</span>
        <span style="${descSt}">Chega no seu nível e na sua era · atributos fixos, sem sorteio</span>${done?OF_GOT:''}</div>
      <div class="${cardCls}" style="padding:8px;display:flex;flex-direction:column;gap:4px;border-color:${mCol};animation-delay:.08s">
        <div style="display:flex;gap:7px;align-items:center">
          <div class="of-wglow" role="img" aria-label="${esc2(M.name)}" style="position:relative;width:48px;height:48px;flex:none;border-radius:12px;border:2px ${ofMountSheet(M)?'solid':'dashed'} ${mCol};background:${ofMountSheet(M)?'radial-gradient(circle,#7a45b8,#2a1640 78%)':'#1d1030'};display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box">
            ${ofMountSheet(M)&&ofCanDraw()?`<canvas id="of_rc2" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%"></canvas>`:ofMountSheet(M)?`<span class="of-ride" aria-hidden="true" style="position:absolute;left:50%;bottom:-2px;height:120%;aspect-ratio:512 / 352;transform:translateX(-42%);background-image:url(${ofMountSheet(M)})"></span>`:`<span class="of-mist"></span>${OF_SHOE(28,'#f3e6ff')}`}</div>
          <div style="display:flex;flex-direction:column;gap:3px;min-width:0">${tag(M.rar,mCol)}
            <span style="font-size:10.5px;font-weight:900;color:#d9b3ff;white-space:nowrap">Montaria</span></div></div>
        <span class="lil" style="${nameSt}">${esc2(M.name)}</span>
        <span style="${descSt}">${esc2(mDesc)}</span>${done?OF_GOT:''}</div>
      ${ofNum(o.c.gems)&&o.c.gems>0?res('assets/ui/gem.png',n0(o.c.gems),'gemas','#4aa3ff',.16):''}
      ${G.big?res('assets/ui/coin.png',G.big,G.small,'#ffc94a',.24):''}
    </div>`;

  /* ----- barra fixa de baixo: preço (só o do módulo, sem "de X por Y") + ação principal ----- */
  const btnSt='position:relative;overflow:hidden;flex:none;width:100%;height:58px;border-radius:16px;padding:0';
  const bar=live?`<div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:center;gap:2px 6px;font-weight:900;text-align:center">
        <span style="font-size:13px;color:#c9b9d9">Pacote exclusivo · compra única${price?' ·':''}</span>
        ${price?`<span class="of-gtext lil" style="font-size:24px;line-height:1;white-space:nowrap">${price}</span>`:''}</div>
      <button class="of-gold of-cta lil" data-x="buy" id="of_buy" style="${btnSt};font-size:${d.Wb<350?21:23}px"><span class="of-sheen"></span>${XO.busy?'Processando...':'Comprar'+(price?' '+price:'')}</button>`
    :done?`<button class="of-green lil" data-x="gear" style="${btnSt};font-size:22px">Ver no Equipamento</button>`
    :`<button class="of-grey lil" data-x="shop" style="${btnSt};box-sizing:border-box;border:2px solid #6b5f7a;background:#2a2433;color:#e6dcf0;font-size:${d.Wb<350?18:20}px">Ver outras ofertas na Loja</button>`;
  const note=o.kind==='used'?'Esta oferta vale só para a primeira compra, e a sua conta já tem uma compra.'
    :done?'Compra única: este pacote já é seu.'
    :'Compra única'+(win?' · '+win:'')+'.';

  V.innerHTML=xWrap(d,XO.anim?'of-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;background:${OF_BG}">
    <div id="of_scroll" class="x-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:10px 12px 10px;box-sizing:border-box">
      <div style="flex:none;display:flex;flex-direction:column;align-items:center;gap:2px">
        <span style="height:20px;padding:0 10px;border-radius:10px;background:#b07cff;color:#1a0c2c;font-size:11px;font-weight:900;letter-spacing:${d.Wb<350?.5:1}px;line-height:20px;white-space:nowrap">PRIMEIRA COMPRA · SÓ UMA VEZ</span>
        <span role="heading" aria-level="1" class="of-gtext lil" style="font-size:${Math.max(24,Math.min(30,Math.round(d.Wb*0.074)))}px;line-height:1.1;white-space:nowrap;filter:drop-shadow(0 2px 0 #2a1403)">Oferta do Guardião</span></div>
      ${top}
      ${show}
      <span style="flex:none;font-size:12px;font-weight:900;color:#d9c4f2;text-align:center">VOCÊ RECEBE TUDO ISTO (sem sorteio)</span>
      ${grid}
      <span style="flex:none;font-size:11px;font-weight:800;color:#c9b9d9;text-align:center;line-height:1.3">${esc2(note)}${live?'<br>Menor de idade: peça a um responsável antes de comprar.':''}</span>
    </div>
    <div style="flex:none;display:flex;flex-direction:column;gap:8px;padding:8px 12px 14px;box-sizing:border-box;background:rgba(14,8,22,.92);border-top:1px solid rgba(176,124,255,.4)">${bar}</div>
    ${XO.dlg?ofDialog():''}</div>`);
  if(y0){ const sc=document.getElementById('of_scroll'); if(sc) sc.scrollTop=y0; }
  XO.anim=false; XO.sig=ofSig(o);
  ofRideStart(W,M);
}

function ofClick(b,ev){
  const a=b.dataset.x;
  if(a==='noop') return;                                   /* toque dentro do aviso: não fecha */
  if(a==='payok'){ if(!XO.dlg) return; snd('ui_tap'); XO.dlg=false; render(); return; }
  if(XO.dlg) return;
  if(a==='buy'){ if(XO.busy) return; snd('ui_tap');
    if(ofState().kind!=='live'){ render(); return; }
    /* COMPRA (Sys.buy): sem Google Play/servidor = aviso "Pagamento em breve" (nada é cobrado, nada muda no save).
       Com eles: cobra pela loja, o SERVIDOR confere o recibo e a entrega vem pela lista de entregas (Sys.buy.sync → Sys.offer.grant).
       A tela nunca entrega por conta própria. */
    const SB=window.Sys&&Sys.buy;
    if(!SB||!SB.ready()){ XO.dlg='soon'; render(); return; }
    XO.busy=true; render();
    SB.purchase(S,Sys.host,SB.DATA.offerProduct).then(r=>{ XO.busy=false;
      if(r.ok){ try{ save(); hud(); }catch(e){} }                         /* a oferta já foi entregue pelo Sys.buy.sync: a tela vira "comprado" sozinha */
      else if(r.reason==='pending') XO.dlg='pending';
      else if(r.reason==='soon') XO.dlg='soon';
      else if(r.reason!=='cancelled') XO.dlg='erro';                   /* cancelado pelo jogador: volta à tela sem aviso */
      render(); }).catch(()=>{ XO.busy=false; XO.dlg='erro'; render(); });
  }
  else if(a==='gear'){ snd('ui_tap'); Screens.open('gear'); }
  else if(a==='shop'){ snd('ui_tap'); Screens.open('shop'); }
}

Panels.add('offer',{title:'Oferta',render:scrOffer,click:ofClick,
  /* 4x por segundo: só o texto dos 3 mostradores; redesenha apenas quando o estado muda (acabou o tempo, entrega feita pelo jogo, módulo ligado) */
  tick(){ const o=ofState();
    if(o.kind==='live'){ const t=ofClock(o.ms), put=(id,v)=>{ const el=document.getElementById(id); if(el&&el.textContent!==v) el.textContent=v; };
      put('of_hh',t.hh); put('of_mm',t.mm); put('of_ss',t.ss); }
    if(XO.sig&&ofSig(o)!==XO.sig&&ofOn()) render(); },
  busy(){ return false; },
  onOpen(o){ XO.anim=true; XO.dlg=false; XO.busy=false; },
  onClose(){ XO.dlg=false; } });
