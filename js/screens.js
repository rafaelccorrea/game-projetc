'use strict';
/* ================= TELAS APROVADAS NO CANVAS (rodada 7): 05 EQUIPAMENTO · 06 INVOCAR · 07 LOJA =================
   Tela cheia entre o HUD (64 px) e as abas, sem rolagem. Cada tela é desenhada numa base de 390 px de largura (medidas do protótipo) e
   escalada por --s para a largura real; a altura que sobrar ou faltar é absorvida pela paginação (mochila e grade da loja) e pelo palco do baú.
   Lógica: NENHUMA conta aqui. Atributos e FC = Sys.fc / Sys.stats; custos e melhoria = Sys.stats; invocação, garantia e desmontar = Sys.loot;
   skin = Sys.skin; VIP = Sys.vip. Depende de index.html (S, RAR, ERAS, SKINS, SKIN, ICON, SLOT, SLOTS7, iname, itemOf, statsChanged, ...). */
const RC=['#e8e2d8','#4aa3ff','#b07cff','#ff5a5a','#ffc94a'], RT=['#3a352e','#1c3550','#35234f','#4f1f1f','#4f3a12'];
const RN=i=>RAR[i]?RAR[i].n:'';
const BAG_MAX=60, FULL_VIEWS={gear:1,summon:1,shop:1,pass:1,prog:1};
const xBagMax=()=>typeof bagMax==='function'?bagMax():BAG_MAX;   /* limite da mochila com o bônus do VIP (js/vipauto.js); BAG_MAX é só a base/reserva */
/* CHAVES POR TELA (agente B, painéis iguais ao protótipo): false = volta ao comportamento anterior daquela parte, sem mexer no resto.
   fit = encolher a tela até caber o arranjo completo do protótipo (2 fileiras de mochila, 2 de skins, 5 níveis do passe) em vez de cortar linhas;
   real = LAYOUT NOVO dos protótipos convertidos (v0.12.2): tamanho real (sem escala), largura até 600 px centrada, o conteúdo ROLA quando falta altura
          e sobra fica antes das ações de baixo. Desligada, volta o arranjo anterior (escala pela base de 390 + xFit).
   frame = CONTORNO COMUM em tela cheia (cabeçalho + VOLTAR + conteúdo, sem folha e sem barra de baixo): ver xHead/xWrap. Desligada até ser vista no navegador.
   equipFly = itens voando no "Equipar melhor"; equipDrag = arrastar da mochila ao espaço; shopCol = aba "Coleção" (não existe no protótipo).
   rar = RARIDADE PELA BORDA E PELA COR com UM componente (xRar / classe .xr, mais abaixo) em todo lugar que mostra item nos painéis: mochila, espaços,
         comparação, Invocar, Loja, Passe e Forja. Desligada, cada tela volta a desenhar o item exatamente como antes (mesmo HTML). */
const PANEL_V2=window.PANEL_V2=Object.assign({ptNum:true,passScroll:true,frame:false,gate:true,real:true,fit:true,equip:true,equipFly:true,equipDrag:true,summon:true,shop:true,shopCol:false,pass:true,prog:true,rar:true},window.PANEL_V2||{});
const n0=v=>Math.round(v).toLocaleString('pt-BR');
const p1=v=>String(Math.round(v*10)/10).replace('.',',')+'%';
const kf=v=>{ v=Math.max(0,v||0); try{ if(window.Sys&&Sys.stats&&typeof Sys.stats.abbr==='function') return Sys.stats.abbr(v,{pt:!!PANEL_V2.ptNum}); }catch(e){}   /* fonte única dos números abreviados (o corpo abaixo é só reserva: parava em tri) */ const f=(x,u)=>(x>=100?Math.round(x)+'':x.toFixed(1).replace('.',','))+u; const U=PANEL_V2.ptNum?[' tri',' bi',' mi',' mil']:['T','B','M','K'];   /* PANEL_V2.ptNum = sufixos em português (decisão do dono); desligado até o PO mandar ligar junto com a curva de 9 eras */
  return v>=1e12?f(v/1e12,U[0]):v>=1e9?f(v/1e9,U[1]):v>=1e6?f(v/1e6,U[2]):v>=1e3?f(v/1e3,U[3]):String(Math.floor(v)); };
const gNum=v=>v>=1e7?kf(v):n0(v);
/* FC NA TELA (ordem do dono): a FC é MOSTRADA na escala do Sys.fc (view = FC × 31, só visual; texto já abreviado pelo módulo). PONTO ÚNICO das minhas telas:
   todo número de FC escrito na tela (total, diferença "FC +N", recomendada, o que falta) passa por aqui. Contas e comparações continuam com a FC real.
   Sem Sys.fc.viewText: a formatação de antes. */
function fcTxt(fc){ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return Sys.fc.viewText(fc); }catch(e){} return gNum(fc); }
const esc2=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COIN_I=(s)=>`<img src="assets/ui/coin.png" alt="moedas" style="width:${s}px;height:${s}px;object-fit:contain">`;
const GEM_I=(s)=>`<img src="assets/ui/gem.png" alt="gemas" style="width:${s}px;height:${s}px;object-fit:contain">`;
const plv=()=>Sys.level.level(S);
/* aviso padrão de botão sem dinheiro (PO): "Ouro insuficiente: faltam X" / "Diamantes insuficientes: faltam X" */
const needMsg=(cur,cost)=>cur==='gems'?'Diamantes insuficientes: faltam '+n0(Math.max(1,Math.ceil(cost-S.gems))):'Ouro insuficiente: faltam '+kf(Math.max(1,Math.ceil(cost-S.gold)));
const SVG_X='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>';
const SVG_LOCK=(s,c)=>`<svg class="x-lockw" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'currentColor'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>`;
const SVG_UP=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c||'currentColor'}" aria-hidden="true"><path d="M12 3l8 10h-5v8H9v-8H4z"></path></svg>`;
const SVG_DN=(s)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21l-8-10h5V3h6v8h5z"></path></svg>`;
const svgI=body=>"data:image/svg+xml;utf8,"+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64' fill='#c9ccd6' stroke='#2a1f16' stroke-width='3' stroke-linejoin='round' stroke-linecap='round'>"+body+"</svg>");
const STI={
  atk: svgI("<path d='M40 8 L56 8 L56 24 L26 50 L14 38 Z' fill='#ff8a5c'/>"),
  hp:  svgI("<path d='M32 56 L8 32 C0 20 14 4 32 18 C50 4 64 20 56 32 Z' fill='#5fd068'/>"),
  def: svgI("<path d='M32 6 L54 14 L54 32 C54 46 32 58 32 58 C32 58 10 46 10 32 L10 14 Z' fill='#4aa3ff'/>"),
  crit:svgI("<circle cx='32' cy='32' r='22' fill='none' stroke='#ffc94a' stroke-width='5'/><circle cx='32' cy='32' r='7' fill='#ffc94a'/>"),
  cd:  svgI("<path d='M32 4 L40 24 L60 26 L44 40 L50 60 L32 48 L14 60 L20 40 L4 26 L24 24 Z' fill='#ff5a5a'/>"),
  vel: svgI("<path d='M36 4 L12 36 L30 36 L26 60 L52 26 L34 26 Z' fill='#b07cff'/>"),
};

/* ---------- CSS das três telas (classes x-*; animações do protótipo) ---------- */
(function(){ const st=document.createElement('style'); st.textContent=`
body.full #view{display:block;top:var(--hudh);bottom:var(--navh);padding:0;margin:0;border-radius:0;border-top:0;background:#16110d;box-shadow:none;z-index:4;overflow:hidden}
body.full #view::before{display:none}
body.full #view.up{animation:xfade .22s ease-out}
@keyframes xfade{from{opacity:0}to{opacity:1}}
.xs{position:absolute;left:0;top:0;width:390px;transform-origin:0 0;overflow:hidden;background:#16110d;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;display:flex;flex-direction:column;box-sizing:border-box}
.xs button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;color:inherit}
.xs .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.x-ly{position:absolute;left:0;right:0;background-repeat:repeat-x;pointer-events:none}
.x-sky{background-image:url(assets/bg/v2/era2/sky.webp)}.x-cld{background-image:url(assets/bg/v2/era2/cloud1.webp);background-repeat:repeat-x;animation:xdrift 90s linear infinite}
.x-far{background-image:url(assets/bg/v2/era2/far.webp)}.x-gnd{background-image:url(assets/bg/v2/era2/ground.webp)}
@keyframes xdrift{from{background-position-x:0}to{background-position-x:-1200px}}
.x-ped{animation:xpedP 2.6s ease-in-out infinite}
@keyframes xpedP{0%,100%{box-shadow:0 0 14px 2px rgba(255,201,74,.35),inset 0 -6px 0 rgba(0,0,0,.35)}50%{box-shadow:0 0 30px 8px rgba(255,201,74,.7),inset 0 -6px 0 rgba(0,0,0,.35)}}
.x-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#ffe07a;box-shadow:0 0 8px 2px rgba(255,201,74,.85);opacity:0;animation:xrise 3.2s ease-out infinite}
@keyframes xrise{0%{transform:translateY(0) scale(1);opacity:0}15%{opacity:1}100%{transform:translateY(-110px) scale(.3);opacity:0}}
.x-fcbox{position:relative;overflow:hidden}
.x-fcbox::after{content:"";position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.3) 50%,transparent 65%);background-size:260% 100%;animation:xshine 3.8s ease-in-out infinite;pointer-events:none}
@keyframes xshine{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
.x-halo{position:absolute;inset:-3px;border-radius:16px;filter:blur(7px);animation:xhalo 1.9s ease-in-out infinite;pointer-events:none}
@keyframes xhalo{0%,100%{opacity:.35}50%{opacity:.9}}
.x-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.4) 48%,transparent 62%);background-size:280% 100%;animation:xshine 3s ease-in-out infinite;pointer-events:none}
.x-novo{animation:xnovo 1s ease-in-out infinite}
@keyframes xnovo{0%,100%{transform:scale(1) rotate(8deg)}50%{transform:scale(1.18) rotate(8deg)}}
.x-better{animation:xbetter 1.2s ease-in-out infinite}
@keyframes xbetter{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
.x-plus{animation:xplusG 1.6s ease-in-out infinite}
@keyframes xplusG{0%,100%{box-shadow:0 0 4px rgba(255,201,74,.5)}50%{box-shadow:0 0 12px rgba(255,201,74,1)}}
.x-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.x-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.x-green{background:linear-gradient(180deg,#86e88d,#3fae3c);color:#0d2410!important;box-shadow:0 6px 0 #1f6a22;border:0}
.x-green:active{transform:translateY(4px);box-shadow:0 2px 0 #1f6a22}
.x-pulse{animation:xpulse 1.5s ease-in-out infinite}
@keyframes xpulse{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 22px rgba(255,201,74,.85)}}
.x-gpulse{animation:xgpulse 1.4s ease-in-out infinite}
@keyframes xgpulse{0%,100%{box-shadow:0 5px 0 #1f6a27,0 0 0 rgba(95,208,104,0)}50%{box-shadow:0 5px 0 #1f6a27,0 0 22px rgba(95,208,104,.85)}}
.x-sheet{animation:xsheetUp .32s cubic-bezier(.2,1.3,.4,1) both}
@keyframes xsheetUp{from{transform:translateY(100%)}to{transform:none}}
.x-scrim{animation:xfade .25s both}
.x-toast{animation:xtoastIn 2s ease both}
@keyframes xtoastIn{0%{transform:scale(.9);opacity:0}12%{transform:none;opacity:1}80%{opacity:1}100%{opacity:0}}
.x-in .x-cellin{animation:xpop .3s ease both}
@keyframes xpop{from{transform:scale(.8);opacity:0}to{transform:none;opacity:1}}
.x-slot:active,.x-cell:active{transform:scale(.94)}
.x-newcard{animation:xnewGlow 1.6s ease-in-out infinite}
@keyframes xnewGlow{0%,100%{box-shadow:0 0 6px rgba(255,201,74,.3)}50%{box-shadow:0 0 18px rgba(255,201,74,.75)}}
.x-upfx{animation:xupfx .9s ease-out both;pointer-events:none}
@keyframes xupfx{0%{opacity:0;transform:scale(.5)}25%{opacity:1}100%{opacity:0;transform:scale(1.5)}}
.x-stUp{animation:xstUp .7s ease-out both}
@keyframes xstUp{0%{background:#1d1611}30%{background:#1f4a24;box-shadow:0 0 12px rgba(95,208,104,.8)}100%{background:#0e0a07}}
.x-stDn{animation:xstDn .7s ease-out both}
@keyframes xstDn{0%{background:#1d1611}30%{background:#4a1f1a;box-shadow:0 0 12px rgba(255,90,78,.8)}100%{background:#0e0a07}}
.x-fcUp{animation:xfcUp .7s ease-out both}
@keyframes xfcUp{30%{transform:scale(1.12);color:#7ef08a}100%{transform:none}}
.x-lockw{animation:xlockw 2.4s ease-in-out infinite}
@keyframes xlockw{0%,86%,100%{transform:rotate(0)}90%{transform:rotate(-10deg)}95%{transform:rotate(10deg)}}
.x-selring{animation:xselr 1.2s ease-in-out infinite}
@keyframes xselr{0%,100%{box-shadow:0 0 0 2px #ffc94a}50%{box-shadow:0 0 0 2px #ffc94a,0 0 14px 4px rgba(255,201,74,.8)}}
.x-emptyp{animation:xemp 2s ease-in-out infinite}
@keyframes xemp{0%,100%{opacity:.35}50%{opacity:.6}}
/* invocar */
.x-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,201,74,.42) 0deg 8deg,rgba(255,201,74,0) 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 22%,transparent 70%);mask:radial-gradient(circle,#000 22%,transparent 70%);animation:xspin 14s linear infinite}
.x-rays2{animation-duration:22s;animation-direction:reverse;opacity:.6}
@keyframes xspin{to{transform:rotate(360deg)}}
.x-glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,214,110,.7) 0%,rgba(255,150,40,.22) 45%,rgba(255,150,40,0) 70%);animation:xglowP 2.4s ease-in-out infinite}
@keyframes xglowP{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.08);opacity:1}}
.x-chestF{animation:xchestF 3s ease-in-out infinite;transform-origin:50% 92%}
@keyframes xchestF{0%,100%{transform:rotate(-2deg) scale(1)}50%{transform:rotate(2deg) scale(1.03)}}
.x-shadowF{animation:xshadowF 3s ease-in-out infinite}
@keyframes xshadowF{0%,100%{opacity:.55}50%{opacity:.4}}
.x-chestS{animation:xshake .12s linear infinite}
@keyframes xshake{0%{transform:translate(0,0) rotate(0)}25%{transform:translate(-6px,2px) rotate(-5deg)}50%{transform:translate(5px,-2px) rotate(4deg)}75%{transform:translate(-4px,-1px) rotate(-3deg)}100%{transform:translate(6px,1px) rotate(5deg)}}
.x-charge{animation:xcharge .9s ease-in forwards}
@keyframes xcharge{from{transform:scale(.6);opacity:.3}to{transform:scale(1.5);opacity:1}}
.x-flash{animation:xflash .45s ease-out both;pointer-events:none}
@keyframes xflash{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.x-legflash{animation:xlegflash .9s ease-out both;pointer-events:none}
@keyframes xlegflash{0%{opacity:0;transform:scale(.6)}20%{opacity:1}100%{opacity:0;transform:scale(1.6)}}
.x-brown:active{transform:translateY(4px)}
.x-xpfill{position:relative;overflow:hidden}
.x-xpfill::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:xxps 2.2s linear infinite}
@keyframes xxps{from{background-position:-60% 0}to{background-position:160% 0}}
.x-in .x-chip{animation:xchipIn .4s ease both}
@keyframes xchipIn{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.x-cardin{animation:xflip .42s cubic-bezier(.2,1.4,.4,1) both}
@keyframes xflip{0%{transform:perspective(500px) rotateY(90deg) scale(.6);opacity:0}100%{transform:none;opacity:1}}
.x-back{animation:xbackP 1.2s ease-in-out infinite}
@keyframes xbackP{0%,100%{opacity:.75}50%{opacity:1}}
.x-lrays{position:absolute;left:50%;top:50%;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,201,74,.9) 0deg 10deg,rgba(255,201,74,0) 10deg 30deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 70%);mask:radial-gradient(circle,#000 25%,transparent 70%);animation:xlspin 4s linear infinite;pointer-events:none}
@keyframes xlspin{from{transform:translate(-50%,-50%) rotate(0)}to{transform:translate(-50%,-50%) rotate(360deg)}}
.x-legcard{animation:xflip .42s cubic-bezier(.2,1.4,.4,1) both,xlegP 1.2s .45s ease-in-out infinite}
@keyframes xlegP{0%,100%{box-shadow:0 0 12px 2px rgba(255,201,74,.6)}50%{box-shadow:0 0 30px 8px rgba(255,201,74,1)}}
.x-legtag{animation:xlegtag 1s ease-in-out infinite}
@keyframes xlegtag{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.12)}}
/* loja */
.x-rule{animation:xruleIn .6s ease-out both}
@keyframes xruleIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
.x-rule svg{animation:xshieldPulse 2.4s ease-in-out infinite}
@keyframes xshieldPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.x-in .x-feat{animation:xpanelIn .5s .1s ease-out both}
@keyframes xpanelIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
.x-srays{position:absolute;left:50%;top:50%;width:300px;height:300px;margin:-150px 0 0 -150px;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.30) 0deg 10deg,transparent 10deg 30deg);-webkit-mask-image:radial-gradient(circle,#000 20%,transparent 68%);mask-image:radial-gradient(circle,#000 20%,transparent 68%);animation:xspin 14s linear infinite}
.x-turn{animation:xturn 6s ease-in-out infinite}
@keyframes xturn{0%,35%{transform:perspective(500px) rotateY(0deg)}50%{transform:perspective(500px) rotateY(180deg)}65%,100%{transform:perspective(500px) rotateY(360deg)}}
.x-breathe{transform-origin:50% 100%;animation:xbreathe 2.8s ease-in-out infinite}
@keyframes xbreathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.02)}}
.x-prev{position:absolute;left:0;right:0;bottom:0;border-radius:5px;background:rgba(14,10,7,.9);border:1px solid #6b5843;color:#e8dccb;font-size:8px;font-weight:900;text-align:center;line-height:1.2;padding:1px 2px}
.x-sped{position:absolute;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#6b5236 0%,#3a2c1f 60%,#1d1611 100%);border:2px solid #ffc94a;box-shadow:0 0 14px rgba(255,201,74,.55),inset 0 -4px 0 rgba(0,0,0,.4)}
.x-bob{animation:xbob 3s ease-in-out infinite}
@keyframes xbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
.x-tw{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff3c4;box-shadow:0 0 10px 3px rgba(255,201,74,.9);animation:xtwinkle 2.2s ease-in-out infinite;opacity:0}
@keyframes xtwinkle{0%,100%{opacity:0;transform:scale(.4)}50%{opacity:1;transform:scale(1.1)}}
.x-offer{animation:xofferPulse 1.4s ease-in-out infinite}
@keyframes xofferPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.x-cta{animation:xctaGlow 1.8s ease-in-out infinite}
@keyframes xctaGlow{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 10px rgba(255,201,74,.35)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 26px rgba(255,201,74,.85)}}
.x-tile{position:relative;overflow:hidden;transition:transform .12s}
.x-in .x-tile{animation:xtileIn .35s ease-out both}
.x-tile:active{transform:scale(.95)}
.x-in .x-tile:nth-child(2){animation-delay:.05s}.x-in .x-tile:nth-child(3){animation-delay:.1s}.x-in .x-tile:nth-child(4){animation-delay:.15s}.x-in .x-tile:nth-child(5){animation-delay:.2s}.x-in .x-tile:nth-child(6){animation-delay:.25s}
@keyframes xtileIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:none}}
.x-tshine{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);background-size:260% 100%;animation:xshine 3.4s ease-in-out infinite;pointer-events:none}
.x-r4{animation:xglow4 2s ease-in-out infinite!important}
@keyframes xglow4{0%,100%{box-shadow:0 0 6px rgba(255,201,74,.35)}50%{box-shadow:0 0 18px rgba(255,201,74,.9)}}
.x-r3{animation:xglow3 2.4s ease-in-out infinite!important}
@keyframes xglow3{0%,100%{box-shadow:0 0 4px rgba(255,90,90,.3)}50%{box-shadow:0 0 14px rgba(255,90,90,.75)}}
.x-pop{animation:xpopd .32s cubic-bezier(.2,1.4,.4,1) both}
@keyframes xpopd{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.x-burst{position:absolute;left:50%;top:50%;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:6px solid #ffc94a;animation:xburst .9s ease-out both;pointer-events:none}
@keyframes xburst{from{transform:scale(.3);opacity:1}to{transform:scale(4);opacity:0}}
.x-stoast{animation:xstoast 2.2s ease-in-out both}
@keyframes xstoast{0%{opacity:0;transform:translateY(16px)}12%,82%{opacity:1;transform:none}100%{opacity:0;transform:translateY(-10px)}}
.x-tick{animation:xtick 1s steps(1) infinite}
@keyframes xtick{0%{color:#ffe07a}50%{color:#ffffff}}
/* painéis V2 (agente B): sem seleção de texto nem menu de toque longo; arrastar não rola a tela */
.xs{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
.xs img{-webkit-user-drag:none;user-drag:none}
.x-cell{touch-action:none}
.x-aura{position:absolute;background-repeat:no-repeat;background-size:1600% 100%;animation:xsheet16 1.333s steps(16,jump-none) infinite;mix-blend-mode:screen;pointer-events:none}
@keyframes xsheet16{from{background-position:0 0}to{background-position:100% 0}}
.x-spark2{animation-name:xrise2;animation-duration:3s}
@keyframes xrise2{0%{transform:translateY(0) scale(1);opacity:0}15%{opacity:1}100%{transform:translateY(-150px) scale(.3);opacity:0}}
.x-toast2{animation:xtoastIn2 2.2s ease both}
@keyframes xtoastIn2{0%{transform:translateY(-14px);opacity:0}12%{transform:none;opacity:1}80%{opacity:1}100%{opacity:0}}
.x-sheen2{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.55) 48%,transparent 62%);background-size:280% 100%;animation:xshine2 2.2s ease-in-out infinite;pointer-events:none}
@keyframes xshine2{0%,40%{background-position:160% 0}100%{background-position:-60% 0}}
/* Equipar melhor: item voando, espaço que recebe, FC subindo */
.x-ghost{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;border-radius:14px;box-sizing:border-box;border:3px solid #ffc94a;overflow:hidden;display:flex;align-items:center;justify-content:center;will-change:transform}
.x-ghost img{width:70%;height:70%;object-fit:contain;-webkit-user-drag:none}
.x-ghost.drag{box-shadow:0 10px 24px rgba(0,0,0,.6),0 0 18px rgba(255,201,74,.75)}
.x-land{animation:xland .55s cubic-bezier(.2,1.5,.4,1) both}
@keyframes xland{0%{transform:scale(.7);filter:brightness(2.2)}45%{transform:scale(1.16);filter:brightness(1.5)}100%{transform:none;filter:none}}
.x-landring{position:absolute;inset:-4px;border-radius:18px;border:3px solid #fff3c4;pointer-events:none;animation:xlandr .6s ease-out both}
@keyframes xlandr{from{transform:scale(.8);opacity:1}to{transform:scale(1.7);opacity:0}}
.x-fcgain{position:absolute;right:8px;top:4px;font-family:'Lilita One',Nunito,sans-serif;font-size:15px;color:#7ef08a;text-shadow:0 2px 0 #0d2410;pointer-events:none;animation:xfcgain 1.5s ease-out both;white-space:nowrap;z-index:1}
@keyframes xfcgain{0%{opacity:0;transform:translateY(10px) scale(.8)}18%{opacity:1;transform:translateY(0) scale(1.15)}75%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-4px)}}
.x-fcBig{animation:xfcBig 1.1s ease-out both}
@keyframes xfcBig{0%{transform:scale(1)}20%{transform:scale(1.22);color:#7ef08a;text-shadow:0 2px 0 #0d2410,0 0 14px rgba(126,240,138,.9)}60%{transform:scale(1.1);color:#7ef08a}100%{transform:none}}
.x-fcboxUp{animation:xfcboxUp 1.1s ease-out both}
@keyframes xfcboxUp{0%,100%{box-shadow:0 0 0 rgba(95,208,104,0)}30%{box-shadow:0 0 22px rgba(95,208,104,.95);border-color:#7ef08a}}
/* arrastar: espaço certo chama, os outros apagam */
.x-drop{animation:xdrop .7s ease-in-out infinite}
@keyframes xdrop{0%,100%{box-shadow:0 0 0 3px #7ef08a,0 0 10px 2px rgba(126,240,138,.55);transform:scale(1)}50%{box-shadow:0 0 0 3px #7ef08a,0 0 22px 8px rgba(126,240,138,.95);transform:scale(1.07)}}
.x-drop.over{animation:none;box-shadow:0 0 0 4px #fff3c4,0 0 26px 10px rgba(255,243,196,.95);transform:scale(1.14)}
.x-nodrop{opacity:.38;transition:opacity .15s}
.x-dragsrc{opacity:.3}
.x-bestoff{opacity:1}
/* layout novo (protótipo convertido): pouso dourado de todos os espaços juntos, selo "FC +N" na vitrine, arrasto com o anel dourado */
.x-land{animation:xland2 .55s ease-out both!important}
@keyframes xland2{0%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,224,122,0)}35%{transform:scale(1.22);box-shadow:0 0 0 3px #ffe07a,0 0 26px 8px rgba(255,201,74,.9)}100%{transform:scale(1);box-shadow:0 0 0 0 rgba(255,224,122,0)}}
.x-landring{display:none}
.x-gainp{animation:xgainp 1.6s ease-out both}
@keyframes xgainp{0%{transform:translateY(16px) scale(.8);opacity:0}18%{transform:translateY(0) scale(1.12);opacity:1}70%{transform:translateY(-14px) scale(1);opacity:1}100%{transform:translateY(-34px);opacity:0}}
.x-drop{animation:xselr 1.2s ease-in-out infinite!important;transition:transform .12s}
.x-drop.over{animation:xselr 1.2s ease-in-out infinite!important;transform:scale(1.14);box-shadow:0 0 0 2px #ffc94a,0 0 14px 4px rgba(255,201,74,.8)}
.x-nodrop{opacity:1}
.x-dragsrc{opacity:.35}
.x-ghost{box-shadow:0 0 18px 4px rgba(255,201,74,.55)}
.x-ghost.drag{box-shadow:0 12px 24px rgba(0,0,0,.6);opacity:.95}
.x-rulep svg{animation:xshieldPulse 2.4s ease-in-out infinite}
/* rolagem do conteúdo (layout novo): some a barra, rola só na vertical, sem puxar a página */
.x-scroll{overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:none;touch-action:pan-y}
.x-scroll::-webkit-scrollbar{display:none}
/* CONTORNO COMUM (PANEL_V2.frame): o painel ocupa a tela inteira; some a folha da batalha, o HUD antigo e a barra de abas de baixo */
body.full.xframe #view{top:0!important;bottom:0!important;z-index:62!important;border-radius:0!important;animation:xfade .2s ease-out!important}
body.full.xframe #fbsheet,body.full.xframe #fbdim,body.full.xframe #tabs{display:none!important}
.x-head{position:relative;flex:none;display:flex;align-items:center;gap:8px;padding:0 10px;box-sizing:border-box;background:linear-gradient(180deg,#2a2017,#1d1611);border-bottom:1px solid rgba(255,236,200,.16);z-index:3}
.x-hbtn{width:44px;height:44px;flex:none;border-radius:50%;padding:0;display:flex;align-items:center;justify-content:center;color:#f6ecdf;background:rgba(16,11,8,.56);border:1px solid rgba(255,236,200,.16);box-shadow:0 4px 10px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08)}
.x-hbtn:active{transform:scale(.92)}
.x-hpill{height:34px;flex:none;display:flex;align-items:center;gap:4px;padding:0 9px 0 4px;border-radius:999px;background:rgba(16,11,8,.56);border:1px solid rgba(255,236,200,.16);font-size:13px;font-weight:900;color:#f6ecdf;box-sizing:border-box}
.x-body{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.x-in .x-tile.x-r4{animation:xtileIn .35s ease-out both,xglow4 2s ease-in-out infinite!important}
.x-in .x-tile.x-r3{animation:xtileIn .35s ease-out both,xglow3 2.4s ease-in-out infinite!important}
`; document.head.appendChild(st); })();

/* ---------- base comum ---------- */
/* CONTORNO COMUM DOS PAINÉIS: UM lugar só. Cabeçalho (voltar + título + moedas e gemas) + área de conteúdo. Quando os protótipos convertidos
   chegarem, troca-se xHead (e X_HEAD, a altura dele na base de 390) e todas as telas mudam juntas. Com a chave desligada nada disto aparece. */
const X_HEAD=64, xFrameOn=()=>!!PANEL_V2.frame, xHeadH=()=>xFrameOn()?X_HEAD:0;
const X_TITLES={gear:'Equipamento',summon:'Invocar',shop:'Loja',pass:'Passe',prog:'Progresso'};
function xTitle(){ if(view==='pass'&&typeof passTab!=='undefined'&&passTab==='mis') return 'Missões'; const pd=window.Panels&&Panels.defs[view]; return (pd&&pd.title)||X_TITLES[view]||''; }
function xHead(){ return `<div class="x-head" style="height:${X_HEAD}px">
    <button class="x-hbtn" data-x="xback" aria-label="Voltar"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
    <span class="lil" style="flex:1;min-width:0;font-size:24px;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(xTitle())}</span>
    <span class="x-hpill" aria-label="Moedas">${COIN_I(24)}<span id="xf_gold">${kf(S.gold)}</span></span>
    <span class="x-hpill" aria-label="Gemas">${GEM_I(22)}<span id="xf_gems">${n0(S.gems)}</span></span></div>`; }
function xHeadTick(){ if(!xFrameOn()) return; const a=document.getElementById('xf_gold'), b=document.getElementById('xf_gems'); if(a){ const t=kf(S.gold); if(a.textContent!==t) a.textContent=t; } if(b){ const t=n0(S.gems); if(b.textContent!==t) b.textContent=t; } }
/* LAYOUT NOVO (PANEL_V2.real): 1 px da tela = 1 px do protótipo. d.H = altura útil do #view (tela − área segura − cabeçalho de 56 px do index);
   d.Wb = largura do conteúdo (até 600, centrada). Nada encolhe: cada tela põe rolagem (classe x-scroll) onde o protótipo rola. */
/* PAGINADOR COMUM: "‹ 2/5 ›" centrado, com o número ENTRE as setas (para a seta de página não parecer um Voltar) e a seta apagada na primeira/última página.
   act = data-x do toque (o tratador da tela lê b.dataset.d = -1 | 1) · sub = linha pequena opcional sob o número */
const X_CHEV=d=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${d<0?'15 18 9 12 15 6':'9 18 15 12 9 6'}"></polyline></svg>`;
function xPager(act,pg,pages,sub,prevLb,nextLb){ const b=(d,on,lb)=>`<button data-x="${act}" data-d="${d}" aria-label="${lb}" ${on?'':'disabled aria-disabled="true"'} style="width:44px;height:44px;flex:none;border-radius:50%;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;padding:0;display:flex;align-items:center;justify-content:center;opacity:${on?1:.3}">${X_CHEV(d)}</button>`;
  return `<div style="min-height:44px;flex:none;display:flex;align-items:center;justify-content:center;gap:14px">${b(-1,pg>0,prevLb||'Página anterior')}<span style="display:flex;flex-direction:column;align-items:center;line-height:1.15;min-width:60px"><span class="lil" role="status" aria-label="Página ${pg+1} de ${pages}" style="font-size:17px">${pg+1}/${pages}</span>${sub?`<span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${sub}</span>`:''}</span>${b(1,pg<pages-1,nextLb||'Próxima página')}</div>`; }
/* LIBERAÇÃO POR NÍVEL (reports/liberacao-por-nivel.md): nas telas, o que ainda não liberou NÃO APARECE (nem cadeado).
   Fonte: Sys.level.DATA.unlock[id] quando o módulo tem a chave; senão esta tabela (ids que o módulo ainda não tem: trocar aqui = trocar 1 número).
   'pet' usa a tabela (20) porque no módulo ele ainda vale 1 enquanto a chave v20 está desligada. PANEL_V2.gate=false desliga a regra inteira. */
const X_UNLOCK={gemShop:10,pass:18,pet:20,practice:5,forge:12,instances:14,tower:15};
function xUnlockLv(id){ try{ const U=Sys.level.DATA.unlock; if(id!=='pet'&&U&&typeof U[id]==='number') return U[id]; }catch(e){} return X_UNLOCK[id]||1; }
const X_FBID={gemShop:'shopgem',pass:'pass',practice:'practice',forge:'forge',instances:'inst',tower:'tower',pet:'pets'};   /* mesmos níveis do MENU: tabela FB_UNLOCK do agente A (js/fullbattle.js) */
/* SAVE ANTIGO (regra do PO): quem já jogava não perde Loja completa nem Passe. A fonte é do agente A: S.bornV + S.unlKeep, lidos por fbUnl(id)
   (js/fullbattle.js, pedido A-13). Aqui não há marcador próprio. */
function xUnlocked(id){ if(PANEL_V2.gate===false) return true; try{ if(typeof fbUnl==='function'&&X_FBID[id]) return !!fbUnl(X_FBID[id]); return plv()>=xUnlockLv(id); }catch(e){ return true; } }
function xReal(){ const W=V.clientWidth||390, Hp=V.clientHeight||704, Wb=Math.min(W,600); return {s:1,H:Hp,ox:(W-Wb)/2,Wb,full:true,real:true}; }
function xDims(minH){ if(PANEL_V2.real&&!xFrameOn()) return xReal(); const W=V.clientWidth||390, Hp=V.clientHeight||704, hh=xHeadH(), s=Math.min(W/390,Hp/(minH+hh)); return {s,H:Hp/s-hh,ox:(W-390*s)/2,Wb:W/s}; }
/* arranjo COMPLETO do protótipo (fullH, na base de 390) sempre que couber encolhendo até 14% além da largura; senão o arranjo curto (minH), com menos linhas.
   Na folha da batalha em tela cheia sobram 656 px de base (o protótipo tinha 704): a tela encolhe ~3% e mostra tudo, igual ao canvas. */
function xFit(fullH,minH){ if(PANEL_V2.real&&!xFrameOn()) return xReal(); const W=V.clientWidth||390, Hp=V.clientHeight||704, hh=xHeadH(), sw=W/390, sf=Math.min(sw,Hp/(fullH+hh));
  if(PANEL_V2.fit&&sf>=sw*0.86&&sf>=0.76) return {s:sf,H:Hp/sf-hh,ox:(W-390*sf)/2,Wb:W/sf,full:true};   /* 0,76: abaixo disso o espaço de 58 px ficaria com menos de 44 px de toque */
  const d=xDims(minH); d.full=d.H>=fullH; return d; }
const xWrap=(d,cls,inner)=>d.real?`<div class="xs ${cls||''}" style="width:${d.Wb.toFixed(1)}px;height:${d.H.toFixed(1)}px;transform:translateX(${d.ox.toFixed(1)}px)">${inner}</div>`
  :xFrameOn()?`<div class="xs ${cls||''}" style="width:${d.Wb.toFixed(1)}px;height:${(d.H+X_HEAD).toFixed(1)}px;transform:scale(${d.s.toFixed(4)})">${xHead()}<div class="x-body">${inner}</div></div>`
  :PANEL_V2.fit?`<div class="xs ${cls||''}" style="width:${d.Wb.toFixed(1)}px;height:${d.H.toFixed(1)}px;transform:scale(${d.s.toFixed(4)})">${inner}</div>`
  :`<div class="xs ${cls||''}" style="height:${d.H.toFixed(1)}px;transform:translateX(${d.ox.toFixed(1)}px) scale(${d.s.toFixed(4)})">${inner}</div>`;
/* peças em coordenadas fixas do protótipo (vitrine do Kael, palco do baú) ficam numa caixa de 390 px centrada na largura real */
const X390=h=>`position:absolute;left:50%;top:0;width:390px;height:${h}px;margin-left:-195px`;
const itemIcon=(it,sz,extra)=>`<img src="${slotIcon(it.slot,ieraV(it))}" alt="" style="width:${sz}px;height:${sz}px;object-fit:contain;${extra||''}">`;
/* ---------- RARIDADE: UM COMPONENTE para todas as telas dos painéis (chave PANEL_V2.rar) ----------
   MOLDURA = classe .xr + .xr<0..4> + atributo data-rar: borda de 3 px na cor, fundo radial com o tom da raridade, brilho em volta (cresce com a
   raridade) e pulso em Mítico e Lendário. Sai no próprio modelo de HTML da tela (nenhum passe de DOM depois do render). Uso:
     const q=xRar(item | raridade | null, modificador)  →  {on, r, c (cor da moldura), t (cor do nome), cls (' xr xrN'), at (' data-rar="N"')}
     <button class="x-cell${q.cls}"${q.at} style="...${q.on?'':'borda e fundo antigos;'}...">     (com a chave desligada ou sem item: on=false, cls e at vazios)
   Modificador 'xr-s' = sem o pulso do componente, para o elemento que já tem animação própria (x-newcard, x-legcard, x-pop, cartão vendido/bloqueado).
   Fundo especial (ex.: carta lendária, prévia da skin): basta manter o background em linha, que vence o da classe.
   NOME = xRarName(item | raridade, texto) devolve o texto (já escapado) na cor da raridade; onde o <span> do nome já existe, usa-se color:${xRarT(x)}.
   xRarBox(x, miolo, lado) = quadrado pronto com a moldura (mesmas medidas do rarFrame do js/rarity.js).
   MESMAS cores e medidas do js/rarity.js (.rar-f): quando ele está carregado, a paleta vem DELE (RAR_C, RAR_TXT, RAR_GLOW), lida no primeiro desenho
   (ele carrega depois deste arquivo); senão vale a cópia abaixo. O data-rar é o mesmo contrato do rarDecorate: com a chave SCREENS_ON.rarityFx ligada
   ele reconhece estas molduras pelo atributo e põe a classe .rar-f dele por cima, que tem os mesmos valores (nada muda na tela). */
const XR_TXT=['#f0ebe2','#7dbcff','#c9a4ff','#ff8a8a','#ffd872'], XR_GLOW=[4,7,10,13,16];
let XR_PAL=null;
function xRarPal(){ if(XR_PAL) return XR_PAL; const ok=a=>Array.isArray(a)&&a.length>=5;
  const P=XR_PAL={c:typeof RAR_C!=='undefined'&&ok(RAR_C)?RAR_C:RC, t:typeof RAR_TXT!=='undefined'&&ok(RAR_TXT)?RAR_TXT:XR_TXT, g:typeof RAR_GLOW!=='undefined'&&ok(RAR_GLOW)?RAR_GLOW:XR_GLOW};
  let css='.xr[data-rar]{border:3px solid var(--rc);background:radial-gradient(circle at 50% 38%,var(--rb),#120d0a 75%)}\n.xr-n{text-shadow:0 1px 2px #000}\n';
  for(let i=0;i<5;i++){ const c=P.c[i], g=P.g[i];
    css+=`.xr${i}[data-rar]{--rc:${c};--rb:${c}33;box-shadow:0 0 ${g}px ${c}${i?'cc':'55'}}\n`;
    if(i>=3) css+=`.xr${i}[data-rar]:not(.xr-s){animation:xrpulse${i} 1.6s ease-in-out infinite}\n@keyframes xrpulse${i}{0%,100%{box-shadow:0 0 6px ${c}aa}50%{box-shadow:0 0 ${g+8}px ${c}}}\n`
      +`.x-in .x-tile.xr${i}[data-rar]:not(.xr-s){animation:xtileIn .35s ease-out both,xrpulse${i} 1.6s ease-in-out infinite}\n`     /* entrada do cartão da loja + pulso */
      +`.x-cardin.xr${i}[data-rar]:not(.xr-s){animation:xflip .42s cubic-bezier(.2,1.4,.4,1) both,xrpulse${i} 1.6s .45s ease-in-out infinite}\n`; }   /* virada da carta do Invocar + pulso */
  try{ const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st); }catch(e){}
  P.css=css; return P; }
const xRarOn=()=>PANEL_V2.rar!==false;
const xRarR=x=>{ const r=x!=null&&typeof x==='object'?x.r:x; return Math.max(0,Math.min(4,r|0)); };
function xRar(x,mod){ const r=xRarR(x); if(x==null||!xRarOn()) return {on:false,r,c:RC[r],t:RC[r],cls:'',at:''};
  const P=xRarPal(); return {on:true,r,c:P.c[r],t:P.t[r],cls:' xr xr'+r+(mod?' '+mod:''),at:' data-rar="'+r+'"'}; }
const xRarT=x=>xRar(x).t;   /* cor do nome: tom claro da raridade (chave desligada: a cor de antes, RC) */
function xRarName(x,txt){ const q=xRar(x); return q.on?`<span class="xr-n" data-rar="${q.r}" style="color:${q.t}">${esc2(txt)}</span>`:esc2(txt); }
function xRarBox(x,inner,size,extra){ const q=xRar(x), s=size||58; if(!q.on) return '';
  return `<span class="${q.cls.trim()}"${q.at} style="position:relative;display:flex;align-items:center;justify-content:center;width:${s}px;height:${s}px;flex:none;border-radius:${Math.round(s*0.24)}px;box-sizing:border-box;overflow:hidden;${extra||''}">${inner||''}</span>`; }
const forgeLv=slot=>(window.Sys&&Sys.forge)?Sys.forge.level(S,slot):0;
const forgeMult=slot=>(window.Sys&&Sys.forge)?Sys.forge.mult(S,slot):0;
const canEq=it=>Sys.stats.canEquip(it,plv());
const eqItem=slot=>S.eq[slot]!=null?itemOf(S.eq[slot]):null;
/* redesenho pedido de fora (onda vencida, baú, nível): nas telas cheias só redesenha se nada estiver animando */
function softRender(){ if(!FULL_VIEWS[view]){ render(); return; }
  if(view==='summon'&&XS.phase!=='idle') return; if(view==='gear'&&(XG.tw||XG.cf||XG.fly||XG.drag)) return; if(view==='shop'&&(XH.sel||XH.cf)) return; if(view==='pass'&&XP.cf) return; if(view==='prog'&&XR.busy) return; { const pd=window.Panels&&Panels.cur(); if(pd&&pd.busy&&pd.busy()) return; } render(); }
function scrTick(){   // 4x por segundo (updHudExtra): relógios das telas
  if(window.SHOP_RETURN&&view!=='shop'&&view!==window.SHOP_RETURN) window.SHOP_RETURN=null;   /* VIP → Loja → VIP: a marca só vale enquanto a Loja está aberta */
  if(XG.auto&&view!=='gear'){ XG.auto=false; XG.autoMsg=''; }   /* o bloco "Automático" não fica aberto para a próxima visita ao Equipamento */
  if(FULL_VIEWS[view]) xHeadTick(); { const pd=window.Panels&&Panels.cur(); if(pd){ if(pd.tick) pd.tick(); return; } }
  if(view==='summon'){ const el=document.getElementById('xs_free'); if(el) el.textContent=midnightLeft(); else if(XS.phase==='idle'&&!document.getElementById('xs_freebtn')&&Sys.loot.summonFreeLeft(S,Sys.host)>0) render(); }
  else if(view==='shop'){ if(S.shop&&S.shop.date!==todayKey()){ render(); return; } const el=document.getElementById('xh_cd'); if(el) el.textContent=midnightLeft(); }
}
function midnightLeft(){ const d=new Date(), m=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d, p=n=>(n<10?'0':'')+n; return p(Math.floor(m/3600000))+':'+p(Math.floor(m%3600000/60000))+':'+p(Math.floor(m%60000/1000)); }

/* ======================================================================= 05 EQUIPAMENTO ======================================================================= */
const XG={filter:'all',page:0,sel:null,tw:null,twI:0,toast:'',toastT:0,anim:true,cf:null,upfx:false};
const GK=['atk','hp','def','crit','cd','vel','fc'], GL={atk:'ATK',hp:'HP',def:'DEF',crit:'Chance Crítica',cd:'Dano Crítico',vel:'Vel. de Ataque',fc:'FC'};
const GSLOT_POS={hat:[10,8],armor:[10,100],boots:[10,192],weapon:[322,8],gloves:[322,100],necklace:[322,192],wing:[166,6]};
const gFmt=(k,v)=>k==='fc'?fcTxt(v):k==='atk'||k==='hp'||k==='def'?gNum(v):k==='vel'?v.toFixed(2).replace('.',',')+'/s':k==='cd'?'+'+p1(v):p1(v);
function gSnap(opts){ const st=opts?Sys.fc.stats(S,Sys.host,opts):heroStats(); return {atk:st.atk,hp:st.hp,def:st.def,crit:st.critRate,cd:st.critDmg,vel:1/Sys.stats.interval(st),fc:Sys.fc.fcOfStats(st)}; }
function itemLines(it){ const st=Sys.stats.itemStats(it,Sys.stats.itemLevel(it,plv()),forgeMult(it.slot)), out=[];
  for(const [k,lb,pc] of [['atk','ATK +',0],['hp','HP +',0],['def','DEF +',0],['critRate','Crít. +',1],['critDmg','Dano Crít. +',1],['aspd','Vel. +',1],['atkPct','ATK +',1],['hpPct','HP +',1],['defPct','DEF +',1]])
    if(st[k]>0.0001) out.push(lb+(pc?p1(st[k]):gNum(st[k])));
  return out.slice(0,4); }
function gToast(msg){ XG.toast=msg; XG.toastT=Date.now(); const el=document.getElementById('xg_toast'); if(el){ el.innerHTML=`<div class="x-toast" style="position:absolute;left:0;right:0;top:96px;display:flex;justify-content:center;pointer-events:none;z-index:4"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #5fd068;font-size:14px;font-weight:900;color:#f6ecdf;box-shadow:0 0 16px rgba(95,208,104,.5);max-width:230px;text-align:center">${esc2(msg)}</span></div>`; } }
/* muda algo (equipar, tirar, upar, desmontar) e anima a contagem dos atributos do valor antigo ao novo */
function gChange(fn,msg,sndName,opt){ opt=opt||{};
  const from=gSnap(); const r=fn(); if(r===false) return false; statsChanged(); const to=gSnap();
  snd(sndName||(to.fc>=from.fc?'upgrade':'claim')); XG.tw={from,to,t0:Date.now(),dur:opt.dur||650,big:!!opt.big}; XG.upfx=to.fc>from.fc+0.5; XG.land=opt.land||null; render(); XG.land=null; if(msg) gToast(msg);
  clearInterval(XG.twI); XG.twI=setInterval(()=>{ const tw=XG.tw; if(!tw||view!=='gear'){ clearInterval(XG.twI); XG.tw=null; return; }
    const p=Math.min(1,(Date.now()-tw.t0)/tw.dur), e=1-Math.pow(1-p,3);
    for(const k of GK){ const v=tw.from[k]+(tw.to[k]-tw.from[k])*e, a=document.getElementById('xg_s_'+k); if(a) a.textContent=gFmt(k,v); const b=document.getElementById('xg_d_'+k); if(b) b.textContent=gFmt(k,v); }
    if(Date.now()-tw.t0>tw.dur+(tw.big?320:110)){ clearInterval(XG.twI); XG.tw=null; XG.upfx=false; } },30);
  return true; }
function gBest(){ const lv=plv(), eq=Object.assign({},S.eq), real=S.eq; let n=0; S.eq=eq;   // simula em cópia (Sys.host.equipped lê S.eq)
  try{ for(const slot of SLOTS7){ if(!Sys.stats.slotOpen(slot,lv)) continue; let best=eq[slot], bfc=Sys.fc.compute(S,Sys.host);
      for(const x of S.inv){ if(x.slot!==slot||x.id===eq[slot]||!Sys.stats.canEquip(x,lv)) continue; const fc=Sys.fc.compute(S,Sys.host,{item:x}); if(fc>bfc+0.5){ bfc=fc; best=x.id; } }
      if(best!==eq[slot]){ eq[slot]=best; n++; } } }finally{ S.eq=real; }
  return {eq,n}; }
function gMaxPlan(it){ const cap=Math.min(100,plv()); let g=S.gold, l=it.lvl||1, sum=0, n=0; while(l<cap){ const c=Sys.stats.upgradeCost(Object.assign({},it,{lvl:l})).gold; if(g<c) break; g-=c; sum+=c; l++; n++; } return {n,sum,to:l}; }

function scrGear(){
  const d=xFit(680,614), H=d.H, lv=plv(), rows=d.real?2:(d.full?2+Math.min(2,Math.max(0,Math.floor((H-680)/66))):1), PER=rows*5, vitH=d.real?Math.max(236,Math.min(292,Math.round(0.34*(H+56)))):292, now=gSnap(), tw=XG.tw, shown=tw?tw.from:now;
  const wingOpen=Sys.stats.slotOpen('wing',lv); let auraN=0; try{ auraN=({blue:4,purple:7,flame:10,gold:13})[Sys.forge.aura(S).id]||0; }catch(e){}
  /* 7 espaços */
  const slotsH=SLOTS7.map(slot=>{ const [x,y]=GSLOT_POS[slot], it=eqItem(slot), nm=SLOT[slot].n, pos=!d.real?'left:'+x+'px;top:'+y+'px':slot==='wing'?'left:calc(50% - 29px);top:6px':(x<195?'left:10px':'right:10px')+';top:'+(y/292*100).toFixed(2)+'%';
    if(slot==='wing'&&!wingOpen) return `<div style="position:absolute;${pos};width:58px;display:flex;flex-direction:column;align-items:center;gap:2px">
      <button class="x-slot" data-x="wing" data-slot="wing" aria-label="Asa, bloqueado, libera no nível ${Sys.stats.DATA.wing.minLevel}" style="position:relative;width:58px;height:58px;border-radius:14px;border:2px dashed #8a7458;background:rgba(14,10,7,.82);color:#e8dccb;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">
        ${SVG_LOCK(22)}<span style="font-size:9px;font-weight:900;line-height:1.05">Nível ${Sys.stats.DATA.wing.minLevel}</span></button>
      <span style="font-size:10px;font-weight:900;color:#e8dccb;text-shadow:0 1px 2px #000,0 0 4px #000;white-space:nowrap">Asa</span></div>`;
    const c=it?RC[it.r]:'#8a7458', q=xRar(it);   /* equipado = moldura da raridade (xRar); vazio = tracejado neutro */
    return `<div style="position:absolute;${pos};width:58px;display:flex;flex-direction:column;align-items:center;gap:2px">
      <div class="${XG.filter===slot?'x-selring':''} ${XG.land&&XG.land[slot]?'x-land':''}" data-slotbox="${slot}" style="position:relative;width:58px;height:58px;border-radius:14px">${XG.land&&XG.land[slot]?'<span class="x-landring" aria-hidden="true"></span>':''}
        ${it&&it.r>=2&&!q.on?`<span class="x-halo" style="background:${c}"></span>`:''}
        <button class="x-slot${q.cls}" data-x="slot" data-slot="${slot}"${q.at} aria-label="${nm}${it?': '+esc2(iname(it))+', '+RN(it.r)+', item nível '+it.lvl:': vazio'}. Toque para ver os itens deste espaço" style="position:absolute;inset:0;border-radius:14px;${q.on?'':`border:${it?'3px solid '+c:'2px dashed #8a7458'};background:${it?'radial-gradient(circle at 50% 40%,#4a3a2b,#1d1611)':'rgba(14,10,7,.82)'};`}padding:0;overflow:hidden">
          <img src="${it?slotIcon(slot,ieraV(it)):ICON[slot]}" alt="" class="${it?'':'x-emptyp'}" style="width:38px;height:38px;object-fit:contain;margin-top:-8px">
          <span style="position:absolute;left:0;right:0;bottom:0;height:16px;background:rgba(0,0,0,.72);font-size:10px;font-weight:900;color:${it?'#fff':'#c9b9a2'};line-height:16px">${it?'Nv.'+it.lvl:'vazio'}</span></button>
        <span class="x-plus lil" style="position:absolute;top:-7px;right:-8px;padding:1px 5px;border-radius:8px;background:#2a1403;border:2px solid #ffc94a;color:#ffc94a;font-size:12px;line-height:14px">+${forgeLv(slot)}</span>
      </div>
      <span style="font-size:10px;font-weight:900;color:#f6ecdf;text-shadow:0 1px 2px #000,0 0 4px #000;white-space:nowrap">${nm}</span></div>`; }).join('');
  /* skin */
  const sa=SKIN(S.skinEq.armor), sw=SKIN(S.skinEq.weapon), sr=Math.max(sa?sa.r:0,sw?sw.r:0), SD=Sys.skin.detail(S), tier=tierOf(sa?sa.r:0), skinAdj=['Básica','Rara','Épica','Mítica','Lendária'][sr]||RN(sr), lookOn=!!(window.Panels&&Panels.on('look')&&!(window.Screens&&Screens.reg&&Screens.reg.look&&Screens.reg.look.broken));   /* aba Aparência (tela do QA, js/p_look.js) */
  const stats=[['atk','atk'],['hp','hp'],['def','def'],['crit','crit'],['cd','cd'],['vel','vel']].map(([k,ic])=>{ let cls=''; if(tw){ const df=tw.to[k]-tw.from[k]; cls=df>0.001?'x-stUp':df<-0.001?'x-stDn':''; }
    return `<div class="${cls}" style="display:flex;align-items:center;gap:5px;padding:0 6px;border-radius:10px;background:#0e0a07;border:1px solid #4a3a2b;min-width:0">
      <img src="${STI[ic]}" alt="" style="width:18px;height:18px;flex:none"><div style="display:flex;flex-direction:column;line-height:1.05;min-width:0">
      <span style="font-size:9px;font-weight:800;color:#c9b9a2;white-space:nowrap">${GL[k]}</span><span class="lil" id="xg_s_${k}" style="font-size:14px;white-space:nowrap">${gFmt(k,shown[k])}</span></div></div>`; }).join('');
  /* mochila */
  const list=S.inv.filter(x=>XG.filter==='all'||x.slot===XG.filter).sort((a,b)=>(b.nw?1:0)-(a.nw?1:0)||b.r-a.r||b.e-a.e||b.lvl-a.lvl||a.id-b.id);
  const pages=Math.max(1,Math.ceil(list.length/PER)); XG.page=Math.max(0,Math.min(XG.page,pages-1));
  const cells=list.slice(XG.page*PER,XG.page*PER+PER).map(it=>{ const eq=S.eq[it.slot]===it.id, c=RC[it.r], q=xRar(it); let better=false; if(!eq&&canEq(it)){ try{ better=Sys.fc.itemFC(S,Sys.host,it).swap>0.5; }catch(e){} }
    return `<div class="x-cellin" style="position:relative;width:58px;height:58px">${it.r>=2&&!q.on?`<span class="x-halo" style="background:${c}"></span>`:''}
      <button class="x-cell${eq&&it.slot==='weapon'?' eqw':''}${q.cls}" data-x="cell" data-id="${it.id}"${q.at} aria-label="${esc2(iname(it))}, ${RN(it.r)}, nível ${it.lvl}, ${SLOT[it.slot].n}${eq?', equipado':''}${it.nw?', novo':''}" style="position:absolute;inset:0;border-radius:14px;${q.on?'':`border:3px solid ${c};background:radial-gradient(circle at 50% 38%,${c}33,#120d0a 75%);`}padding:0;overflow:hidden">
        ${itemIcon(it,40,'margin-top:-6px')}${it.r>=2?'<span class="x-sheen"></span>':''}
        <span style="position:absolute;left:0;right:0;bottom:0;height:15px;background:rgba(0,0,0,.72);font-size:9px;font-weight:900;color:${c};line-height:15px">Nv.${it.lvl}</span></button>
      ${eq?`<span aria-hidden="true" style="position:absolute;top:-5px;left:-5px;width:20px;height:20px;border-radius:50%;background:#5fd068;border:2px solid #16110d;display:flex;align-items:center;justify-content:center;pointer-events:none"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d2410" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>`:''}
      ${better?`<span class="x-better" aria-hidden="true" style="position:absolute;right:2px;top:2px;width:18px;height:18px;border-radius:6px;background:#5fd068;display:flex;align-items:center;justify-content:center;pointer-events:none">${SVG_UP(12,'#0d2410')}</span>`:''}
      ${it.nw?`<span class="x-novo" style="position:absolute;top:-8px;right:-8px;padding:2px 5px;border-radius:7px;background:#ff4d3d;border:2px solid #16110d;color:#fff;font-size:10px;font-weight:900;letter-spacing:.5px;pointer-events:none">NOVO</span>`:''}</div>`; }).join('')
    ||`<div style="grid-column:1/-1;display:flex;align-items:center;justify-content:center;height:58px;font-size:13px;font-weight:800;color:#c9b9a2">Nenhum item neste espaço ainda. Invoque ou derrote chefes.</div>`;
  const best=gBest(), dots=Array.from({length:pages},(_,i)=>`<span style="width:${i===XG.page?22:8}px;height:8px;border-radius:4px;background:${i===XG.page?'#ffc94a':'#4a3a2b'};transition:width .2s"></span>`).join('');
  const selIt=XG.sel!=null?itemOf(XG.sel):null; if(XG.sel!=null&&!selIt) XG.sel=null;
  /* conveniências do VIP: chip do próximo bônus de mochila e a entrada "Automático" (trancada mostra o menor "VIP n" que falta; ligada conta as preferências) */
  const bagNext=xBagNext(), autoRows=gAutoRows(), autoOn=autoRows?autoRows.filter(r=>r.on).length:0, autoLock=autoRows&&autoRows.every(r=>r.locked)?autoRows.slice().sort((a,b)=>a.need-b.need)[0].lockText:'';
  const sc0=document.getElementById('xg_sc'), scTop=sc0?sc0.scrollTop:0, gain=tw&&tw.big&&tw.to.fc>tw.from.fc+0.5&&!(typeof NEXT_ON!=='undefined'&&NEXT_ON&&typeof fcNotice==='function')?tw.to.fc-tw.from.fc:0;   /* com o aviso único de poder do index (fcNotice, pedido A-19) o meu "FC +N" sai */
  V.innerHTML=xWrap(d,XG.anim?'x-in':'',`
    <div ${d.real?'class="x-scroll" id="xg_sc" style="flex:1;min-height:0;display:flex;flex-direction:column"':'style="display:contents"'}>
    <div style="position:relative;height:${vitH}px;flex:none;overflow:hidden;background:#7fb3d9">
      <div class="x-ly x-sky" style="top:0;height:175px;background-size:auto 175px"></div><div class="x-ly x-cld" style="top:14px;height:46px;background-size:auto 46px"></div>
      <div class="x-ly x-far" style="top:64px;height:123px;background-size:auto 123px"></div><div class="x-ly x-gnd" style="top:191px;height:111px;background-size:auto 111px"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(22,17,13,.25) 0%,rgba(22,17,13,.78) 60%,rgba(22,17,13,.95) 100%)"></div>
      <div style="${d.real?'position:absolute;left:50%;bottom:0;width:390px;height:292px;margin-left:-195px;pointer-events:none':X390(292)}"><div class="x-ped" style="position:absolute;left:120px;top:258px;width:150px;height:28px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#6a5440 0%,#3a2c1f 60%,#241a12 100%);border:2px solid #ffc94a;box-sizing:border-box"></div>
      <span class="x-spark" style="left:136px;top:258px"></span><span class="x-spark" style="left:176px;top:266px;animation-delay:1.1s;width:4px;height:4px"></span><span class="x-spark" style="left:218px;top:262px;animation-delay:2s"></span><span class="x-spark" style="left:250px;top:256px;animation-delay:.6s;width:3px;height:3px"></span>
      ${auraN?'<div class="x-aura" aria-hidden="true" style="left:111px;top:64px;width:168px;height:210px;background-image:url(assets/anim/aura/aura'+auraN+'.png)"></div>':''}<canvas id="gkc" role="img" aria-label="Kael com a arma equipada" style="position:absolute;left:61px;top:110px;width:268px;height:168px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.6));pointer-events:none"></canvas>
      ${XG.upfx?'<div class="x-upfx" aria-hidden="true" style="position:absolute;left:115px;top:110px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(255,250,220,.9) 0%,rgba(255,201,74,.5) 40%,rgba(255,201,74,0) 70%)"></div>':''}
      ${d.real?'</div>':''}${slotsH}<div id="xg_toast"></div>${d.real?'':'</div>'}
      ${gain&&d.real?`<div class="x-gainp" aria-hidden="true" style="position:absolute;left:0;right:0;bottom:64px;display:flex;justify-content:center;z-index:5;pointer-events:none"><span class="lil" style="padding:4px 12px;border-radius:12px;background:rgba(14,10,7,.88);border:2px solid #5fd068;font-size:22px;color:#7ef08a;text-shadow:0 2px 0 #0d2410;box-shadow:0 0 18px rgba(95,208,104,.6);white-space:nowrap">FC +${fcTxt(gain)}</span></div>`:''}
    </div>
    <div style="height:140px;flex:none;margin:8px 12px 0;padding:8px;border-radius:16px;background:#1d1611;border:1px solid #4a3a2b;box-sizing:border-box;display:flex;flex-direction:column;gap:6px">
      <div style="height:46px;flex:none;display:flex;gap:6px">
        <div class="x-fcbox ${tw&&tw.big&&!d.real?'x-fcboxUp':''}" id="xg_fcbox" style="flex:1;display:flex;align-items:center;gap:6px;padding:0 8px;border-radius:12px;background:linear-gradient(180deg,#3a2c1f,#241a12);border:2px solid #ffc94a;box-sizing:border-box;min-width:0">${gain&&!d.real?'<span class="x-fcgain" aria-hidden="true">+'+fcTxt(gain)+'</span>':''}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M13 2 4 14h7l-1 8 9-12h-7z"></path></svg>
          <div style="display:flex;flex-direction:column;line-height:1;min-width:0"><span style="font-size:9px;font-weight:900;color:#c9b9a2;letter-spacing:${d.Wb<380?0:1}px;white-space:nowrap">FORÇA DE COMBATE</span>
            <span class="lil ${tw&&tw.to.fc>tw.from.fc?(tw.big&&!d.real?'x-fcBig':'x-fcUp'):''}" id="xg_s_fc" style="font-size:25px;color:#ffc94a;text-shadow:0 2px 0 #6a3a08;transform-origin:0 50%;white-space:nowrap">${gFmt('fc',shown.fc)}</span></div></div>
        <button data-x="${lookOn?'look':'goskins'}" aria-label="${lookOn?'Aparência: skin '+skinAdj+', mais '+p1(SD.equipped)+' de ATK e HP; coleção de skins mais '+p1(SD.collection)+'. Abrir modo Itens ou Skin, ocultar peças e cosméticos':'Skin equipada e coleção de skins: ir para a loja'}" style="width:${d.real?(d.Wb<380?168:204):168}px;flex:none;display:flex;align-items:center;gap:6px;padding:0 6px;border-radius:12px;background:#33271d;border:2px solid ${RC[sr]};box-sizing:border-box;text-align:left">
          <span style="position:relative;width:34px;height:34px;flex:none;border-radius:9px;background:#1d1611;overflow:hidden">${typeof avatarTag==='function'?avatarTag(34,'position:absolute;left:0;top:0'):`<span class="kidle ${tier?'t'+tier:''}" style="position:absolute;left:-12px;top:-4px;width:58px;height:58px;display:block"></span>`}</span>
          <span style="display:flex;flex-direction:column;line-height:${lookOn?1.12:1.15};min-width:0;flex:1">${lookOn?'<span class="lil" style="display:flex;align-items:center;gap:4px;font-size:13px;color:#f6ecdf"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c9a3ff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"></path><circle cx="12" cy="12" r="3"></circle></svg>Aparência</span>':''}<span style="font-size:${lookOn?10:(d.Wb<380?9.5:11)}px;font-weight:900;color:${sr===2?'#c9a3ff':RC[sr]};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Skin ${skinAdj} +${p1(SD.equipped)} ATK/HP</span>
            <span style="font-size:${lookOn?9.5:10}px;font-weight:800;color:#c9b9a2;white-space:nowrap">Coleção de skins +${p1(SD.collection)}</span></span>${lookOn?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a3ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><polyline points="9 18 15 12 9 6"></polyline></svg>':''}</button>
      </div>
      <div style="flex:1;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:5px">${stats}</div>
    </div>
    <div style="${d.real?'flex:1 0 auto':'flex:1;min-height:0'};margin-top:8px;display:flex;flex-direction:column;gap:6px;padding:8px 12px 8px;background:#1d1611;border-top:2px solid #4a3a2b;border-radius:18px 18px 0 0;box-sizing:border-box">
      <div style="min-height:${d.real?44:40}px;flex:none;display:flex;align-items:center;gap:8px">
        <div style="flex:1;display:flex;flex-direction:column;line-height:1.1;min-width:0;overflow:hidden"><span class="lil" style="font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${XG.filter==='all'?'Todos os itens':'Itens: '+SLOT[XG.filter].n}</span>
          <span style="display:flex;align-items:center;gap:5px;min-width:0"><span style="flex:none;font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">Mochila ${S.inv.length}/${xBagMax()}</span>${bagNext?`<button data-x="bagvip" aria-label="Mochila maior, trancado: ${esc2(bagNext.text)} espaços. Toque para saber mais" style="flex:none;display:flex;align-items:center;gap:3px;height:18px;padding:0 6px;border-radius:9px;border:1px solid #8a7458;background:#33271d;color:#ffc94a;font-size:9.5px;font-weight:900;white-space:nowrap">${SVG_LOCK(10,'#ffc94a')}${esc2(bagNext.text)}</button>`:''}${d.real&&PANEL_V2.equipDrag?'<span style="flex:1;min-width:0;font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">· arraste o item até o espaço</span>':''}</span></div>
        ${XG.filter!=='all'?'<button data-x="all" style="height:44px;padding:0 10px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:12px;font-weight:900;flex:none">Ver todos</button>':''}
        <button data-x="prog" ${SCREENS_ON.progress&&xUnlocked('practice')?'':'hidden'} aria-label="Progresso: práticas e títulos" style="position:relative;width:44px;height:44px;padding:0;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;flex:none;display:flex;align-items:center;justify-content:center"><svg class="x-medal" width="18" height="21" viewBox="0 0 24 28" aria-hidden="true"><path d="M7 1h10l-3 8h-4z" fill="#ff5a4e"></path><circle cx="12" cy="17" r="8" fill="#ffc94a" stroke="#8a4f0c" stroke-width="1.6"></circle></svg>${typeof progAlert==='function'&&progAlert()?'<span aria-hidden="true" style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#ff4d3d;border:2px solid #16110d"></span>':''}</button>
        ${window.Panels&&Panels.on('forge')&&xUnlocked('forge')&&!(window.Screens&&Screens.reg&&Screens.reg.forge&&Screens.reg.forge.broken)?'<button data-x="forge" aria-label="Forja: fortalecer os espaços" class="lil" style="position:relative;height:44px;min-width:44px;padding:0 10px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#ffc94a;font-size:13px;flex:none">Forja'+(typeof forgeAlert==='function'&&forgeAlert()?'<span aria-hidden="true" style="position:absolute;top:-4px;right:-4px;width:10px;height:10px;border-radius:50%;background:#ff4d3d;border:2px solid #16110d"></span>':'')+'</button>':''}
        ${d.real?'':best.n>0?`<button class="x-gold x-pulse lil" data-x="best" id="xg_best" style="height:40px;padding:0 12px;border-radius:12px;font-size:14px;display:flex;align-items:center;gap:5px;flex:none;white-space:nowrap">${SVG_UP(16)}Equipar melhor</button>`
          :'<button class="lil x-bestoff" data-x="best" id="xg_best" aria-disabled="true" aria-label="Equipar melhor: você já está com o melhor" style="height:40px;padding:0 10px;border-radius:12px;border:2px solid #4a3a2b;background:#2a211a;color:#9c8d7a;font-size:12px;line-height:1.05;flex:none;text-align:center">Já está com <br>o melhor</button>'}
      </div>
      <div data-bag="1" style="flex:none;height:${rows*58+(rows-1)*8}px;display:grid;grid-template-columns:repeat(5,58px);grid-auto-rows:58px;justify-content:space-between;row-gap:8px;align-content:start">${cells}</div>
      ${xPager('pg',XG.page,pages)}
      ${autoRows?`<button data-x="auto" aria-label="Automático: desmanchar itens sozinho ao pegar.${autoLock?'Trancado: '+esc2(autoLock):autoOn?autoOn+(autoOn===1?' ligado':' ligados'):'tudo desligado'}. Abrir" style="min-height:44px;flex:none;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;text-align:left;box-sizing:border-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M21 12a9 9 0 1 1-3-6.7"></path><polyline points="21 4 21 9 16 9"></polyline></svg>
        <span class="lil" style="flex:1;min-width:0;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Automático</span>
        ${autoLock?`<span style="flex:none;display:flex;align-items:center;gap:4px;height:24px;padding:0 8px;border-radius:12px;border:1px solid #8a7458;background:#241a12;color:#ffc94a;font-size:11px;font-weight:900;white-space:nowrap">${SVG_LOCK(12,'#ffc94a')}${esc2(autoLock)}</span>`
          :`<span style="flex:none;font-size:11px;font-weight:900;color:${autoOn?'#7ef08a':'#c9b9a2'};white-space:nowrap">${autoOn?autoOn+(autoOn===1?' ligado':' ligados'):'desligado'}</span>`}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><polyline points="9 18 15 12 9 6"></polyline></svg></button>`:''}
    </div>
    </div>
    ${d.real?`<div style="flex:none;display:flex;padding:8px 12px 10px;background:#1d1611;border-top:1px solid #4a3a2b;box-sizing:border-box">${best.n>0
      ?`<button class="x-gold x-pulse lil" data-x="best" id="xg_best" aria-label="Equipar melhor: troca ${best.n} ${best.n===1?'item':'itens'} pelo de maior FC em cada espaço" style="flex:1;height:56px;border-radius:16px;padding:0 14px;font-size:21px;letter-spacing:.5px;display:flex;align-items:center;justify-content:center;gap:8px">${SVG_UP(20)}EQUIPAR MELHOR<span style="min-width:24px;height:24px;padding:0 6px;border-radius:12px;background:#2a1403;color:#ffe07a;font-family:Nunito,system-ui,sans-serif;font-size:13px;font-weight:900;letter-spacing:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${best.n}</span></button>`
      :'<button data-x="best" id="xg_best" aria-disabled="true" aria-label="Equipar melhor: já está com o melhor" style="flex:1;height:56px;border-radius:16px;border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2;padding:0 14px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15"><span class="lil" style="font-size:19px;letter-spacing:.5px">EQUIPAR MELHOR</span><span style="font-size:11px;font-weight:800">Já está com o melhor</span></button>'}</div>`:''}
    ${selIt?gSheet(selIt,H,now,shown):''}${XG.cf?gConfirm():''}${XG.auto?gAuto():''}`);
  { const sc1=document.getElementById('xg_sc'); if(sc1&&scTop) sc1.scrollTop=scTop; }
  XG.anim=false; XG.pages=pages; XG.best=best;
  if(XG.toast&&Date.now()-XG.toastT<1500){ const m=XG.toast; gToast(m); }
}
function gSheet(it,H,now,shown){
  const lv=plv(), cap=Math.min(100,lv), cur=eqItem(it.slot), isEq=!!cur&&cur.id===it.id, c=RC[it.r], cost=Sys.stats.upgradeCost(it), atCap=it.lvl>=cap, isMax=it.lvl>=100;
  const cg=Sys.stats.canUpgrade(S,Sys.host,it,'gold'), cd=Sys.stats.canUpgrade(S,Sys.host,it,'gems'), mx=gMaxPlan(it), eqOk=canEq(it);
  const after=isEq?now:gSnap({item:it}), ifc=Sys.fc.itemFC(S,Sys.host,it), small=H<690, rh=small?23:26;
  const plan=!atCap?Sys.stats.planUpgrade(S,Sys.host,it,'gold'):null;
  const diffs=GK.map(k=>{ const df=after[k]-now[k], eps=k==='vel'?0.004:(k==='atk'||k==='hp'||k==='def'||k==='fc'?0.5:0.05), up=df>eps, dn=df<-eps;
    const dt=k==='fc'?fcTxt(Math.abs(df)):k==='atk'||k==='hp'||k==='def'?gNum(Math.abs(df)):k==='vel'?Math.abs(df).toFixed(2).replace('.',','):p1(Math.abs(df));
    return `<div style="height:${rh}px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:10px;background:${k==='fc'?'#2a2015':'#0e0a07'};border:1px solid #4a3a2b">
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;width:92px">${GL[k]}</span>
      <span style="font-size:13px;font-weight:900;flex:1;white-space:nowrap"><span id="xg_d_${k}">${gFmt(k,shown[k])}</span> <span style="color:#c9b9a2">→</span> ${gFmt(k,after[k])}</span>
      <span class="lil" style="display:flex;align-items:center;gap:3px;font-size:14px;color:${up?'#5fd068':dn?'#ff5a4e':'#c9b9a2'}">${up?SVG_UP(14):dn?SVG_DN(14):''}${up?'+'+dt:dn?'−'+dt:'='}</span></div>`; }).join('');
  /* cartão da comparação: com item, moldura da raridade (3 px; o respiro cai de 6 para 5 px, o cartão não muda de tamanho); 'xr-s' no cartão que já pulsa (x-newcard) */
  const card=(x,tag,tagC,cls,bg)=>{ const q=xRar(x,cls?'xr-s':''); return `<div class="${cls}${q.cls}"${q.at} style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:${q.on?5:6}px;border-radius:14px;${q.on?'':`background:${bg};border:2px solid ${x?RC[x.r]:'#4a3a2b'};`}box-sizing:border-box">
      <span style="font-size:9px;font-weight:900;color:${tagC};letter-spacing:1px">${tag}</span>${x?itemIcon(x,36):`<img src="${ICON[it.slot]}" alt="" class="x-emptyp" style="width:36px;height:36px">`}
      <span style="font-size:11px;font-weight:900;text-align:center;line-height:1.1;color:${x?xRarT(x):'#c9b9a2'}">${x?esc2(iname(x)):'Espaço vazio'}</span>
      ${x?itemLines(x).map(t=>`<span style="font-size:10px;font-weight:800;color:#e8dccb;line-height:1.15;white-space:nowrap">${t}</span>`).join(''):''}</div>`; };
  const off='#33271d', offF='#8a7a68';
  return `<button class="x-scrim" data-x="close" aria-label="Fechar comparação" style="position:absolute;inset:0;border:0;padding:0;background:rgba(8,5,3,.66)"></button>
  <div class="${XG.sheetIn?'x-sheet':''}" role="dialog" aria-label="Comparar item" style="position:absolute;left:0;right:0;bottom:0;height:${Math.min(696,H-8)}px;padding:10px 14px 12px;box-sizing:border-box;background:#1d1611;border-top:3px solid ${c};border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(0,0,0,.6);display:flex;flex-direction:column;gap:${small?6:8}px">
    <div style="display:flex;align-items:center;gap:10px"><div style="flex:1;min-width:0;display:flex;flex-direction:column">
        <span class="lil" style="font-size:21px;color:${xRarT(it)};text-shadow:0 2px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(iname(it))}</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2">${RN(it.r)} · ${ERAS[it.e].n} · ${SLOT[it.slot].n}</span></div>
      <button data-x="close" aria-label="Fechar" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;padding:0;display:flex;align-items:center;justify-content:center">${SVG_X}</button></div>
    <div style="display:flex;align-items:stretch;gap:6px;height:118px;flex:none">
      ${card(cur,'EQUIPADO','#c9b9a2','','#33271d')}
      <div style="width:22px;display:flex;align-items:center;justify-content:center;color:#ffc94a"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="19" y2="12"></line><polyline points="13 6 19 12 13 18"></polyline></svg></div>
      ${card(it,isEq?'EM USO':'ESTE ITEM','#ffc94a','x-newcard','#3a2c1f')}
    </div>
    <div style="flex:none;display:flex;flex-direction:column;gap:6px;padding:8px 10px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b">
      <div style="display:flex;justify-content:space-between;align-items:baseline"><span class="lil" style="font-size:16px">Nv. ${it.lvl} / 100</span>
        <span style="font-size:${cg.aboveCap?9.5:11}px;font-weight:900;color:${atCap?'#ffc94a':'#c9b9a2'};text-align:right;line-height:1.1;max-width:230px">${isMax?'Nível máximo':(cg.aboveCap||atCap)?'Suba ao nível '+(cg.needLevel||it.lvl+1)+' para melhorar':'Teto: seu nível '+lv+' (faltam '+(cap-it.lvl)+')'}</span></div>
      <div style="position:relative;height:12px;border-radius:6px;background:#241a12;border:1px solid #000">
        <div style="position:absolute;left:0;top:0;bottom:0;width:${cap}%;border-radius:6px 0 0 6px;background:rgba(255,201,74,.14)"></div>
        <div style="position:absolute;left:0;top:0;bottom:0;width:${it.lvl}%;border-radius:6px;background:linear-gradient(90deg,#f2a826,#ffe07a);transition:width .5s ease-out"></div>
        <div aria-hidden="true" style="position:absolute;left:${cap}%;top:-4px;width:3px;height:18px;margin-left:-1px;border-radius:2px;background:#ff5a4e;box-shadow:0 0 6px #ff5a4e"></div></div>
      <div style="display:flex;gap:6px">
        <button data-x="upgold" id="g_upgold" style="flex:1;height:46px;border-radius:12px;border:0;background:${cg.ok?'linear-gradient(180deg,#ffe07a,#f2a826)':off};color:${cg.ok?'#2a1403':offF};padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05">
          <span class="lil" style="font-size:15px">Upar</span><span style="display:flex;align-items:center;gap:2px;font-size:11px;font-weight:900">${COIN_I(14)}${atCap?'—':kf(cost.gold)}</span></button>
        <button data-x="upgem" style="flex:1;height:46px;border-radius:12px;border:0;background:${cd.ok?'linear-gradient(180deg,#9fd0ff,#4a8fe0)':off};color:${cd.ok?'#0a1a33':offF};padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05">
          <span class="lil" style="font-size:15px">Upar</span><span style="display:flex;align-items:center;gap:2px;font-size:11px;font-weight:900">${GEM_I(14)}${atCap?'—':cost.gems}</span></button>
        <button data-x="upmax" style="flex:1.2;height:46px;border-radius:12px;border:0;background:${mx.n>0?'linear-gradient(180deg,#7ee27a,#3fae3c)':off};color:${mx.n>0?'#0d2410':offF};padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05">
          <span class="lil" style="font-size:15px">Upar máx.</span><span style="font-size:11px;font-weight:900">${mx.n>0?'+'+mx.n+' nv · '+kf(mx.sum):atCap?'No teto':'Sem ouro'}</span></button>
      </div>
      ${plan&&plan.levels>0&&eqOk?`<button data-x="equp" style="height:36px;border-radius:12px;border:2px solid ${plan.ok||S.gems>=plan.gems?'#ffc94a':'#4a3a2b'};background:${plan.ok||S.gems>=plan.gems?'#3a2c1f':'#33271d'};color:${plan.ok||S.gems>=plan.gems?'#ffc94a':'#8a7a68'};padding:0 8px;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;font-weight:900;white-space:nowrap">
        <span class="lil" style="font-size:14px">${isEq?'Upar':'Equipar e upar'} até o meu nível (${plan.to})</span>${COIN_I(14)}${kf(plan.gold)}</button>`:''}
    </div>
    ${!isEq?`<div style="flex:none;height:${small?34:40}px;display:flex;gap:6px">
      <div style="flex:1;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-radius:10px;background:#2a2015;border:1px solid #4a3a2b"><span style="font-size:11px;font-weight:800;color:#c9b9a2">FC agora</span><span class="lil" style="font-size:15px">${fcTxt(ifc.fc)}</span></div>
      <div class="x-newcard" style="flex:1.25;display:flex;align-items:center;justify-content:space-between;padding:0 10px;border-radius:10px;background:#1f3a22;border:1px solid #5fd068"><span style="font-size:11px;font-weight:800;color:#b8f0bd">FC no seu nível (${cap})</span><span class="lil" style="font-size:15px;color:#7ef08a">${fcTxt(ifc.atPlayerLevel)}</span></div></div>`:''}
    <div style="display:flex;flex-direction:column;gap:3px">${diffs}</div>
    <div style="flex:1"></div>
    <div style="display:flex;gap:10px">
      <button data-x="dism" style="flex:1;height:54px;border-radius:16px;border:2px solid #4a3a2b;background:#33271d;color:${isEq?'#8a7a68':'#f6ecdf'};padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1">
        <span class="lil" style="font-size:16px;display:flex;align-items:center;gap:4px">Desmontar ${COIN_I(18)}+${gNum(Sys.stats.dismantleGold(it))}</span>
        <span style="font-size:10px;font-weight:800;color:#c9b9a2">Devolve 50% do ouro investido</span></button>
      ${isEq?'<button data-x="unequip" class="lil" style="flex:1.3;height:54px;border-radius:16px;border:2px solid #5fd068;background:transparent;color:#5fd068;font-size:18px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05">Em uso<span style="font-family:Nunito,sans-serif;font-size:10px;font-weight:800;color:#b8f0bd">toque para tirar</span></button>'
        :eqOk?'<button class="x-gold lil" data-x="equip" style="flex:1.3;height:54px;border-radius:16px;font-size:20px">Equipar</button>'
        :`<div style="flex:1.3;height:54px;border-radius:16px;border:2px solid #4a3a2b;color:#c9b9a2;font-size:13px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box">${SVG_LOCK(18)}Asa: nível ${Sys.stats.DATA.wing.minLevel}</div>`}
    </div>
  </div>`;
}
/* confirmação do "Equipar e upar até o meu nível": mostra o CUSTO TOTAL antes de cobrar (Sys.stats.planUpgrade) */
function gConfirm(){ const it=itemOf(XG.cf); if(!it){ XG.cf=null; return ''; } const pg=Sys.stats.planUpgrade(S,Sys.host,it,'gold'), pd=Sys.stats.planUpgrade(S,Sys.host,it,'gems'), isEq=S.eq[it.slot]===it.id;
  return `<div class="x-scrim" style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.7);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
    <div class="x-pop" role="alertdialog" aria-label="Confirmar melhoria" style="width:330px;border-radius:18px;border:3px solid #ffc94a;background:#241b14;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.7)">
      <span class="lil" style="font-size:20px;text-align:center">${isEq?'Upar':'Equipar e upar'} até o nível ${pg.to}</span>
      <span style="font-size:14px;font-weight:900;text-align:center;color:${xRarT(it)}">${esc2(iname(it))} · Nv. ${pg.from} → ${pg.to} (+${pg.levels})</span>
      <div style="display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;font-size:14px;font-weight:800">
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c9b9a2">Custo total em ouro</span><span style="display:flex;align-items:center;gap:4px;font-weight:900">${COIN_I(20)}${gNum(pg.gold)}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c9b9a2">Seu ouro</span><span style="font-weight:900">${kf(S.gold)} → <span style="color:${pg.ok?'#c8f5cb':'#ff8a7a'}">${pg.ok?kf(S.gold-pg.gold):'faltam '+kf(pg.gold-S.gold)}</span></span></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c9b9a2">ou em diamantes</span><span style="display:flex;align-items:center;gap:4px;font-weight:900">${GEM_I(20)}${n0(pd.gems)} <span style="color:${pd.ok?'#c8f5cb':'#ff8a7a'};font-size:12px">(você tem ${n0(S.gems)})</span></span></div>
        <span style="font-size:11px;color:#c9b9a2">Desmontar devolve 50% do ouro; diamante não volta.</span></div>
      <div style="display:flex;gap:8px">
        <button data-x="cfno" class="lil" style="flex:1;height:50px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:17px;padding:0">Cancelar</button>
        <button data-x="cfgold" class="lil ${pg.ok?'x-gold':''}" style="flex:1.1;height:50px;border-radius:14px;font-size:16px;padding:0;${pg.ok?'':'border:0;background:#33271d;color:#8a7a68'}">Pagar ouro</button>
        <button data-x="cfgem" class="lil" style="flex:1.1;height:50px;border-radius:14px;border:0;font-size:16px;padding:0;background:${pd.ok?'linear-gradient(180deg,#9fd0ff,#4a8fe0)':'#33271d'};color:${pd.ok?'#0a1a33':'#8a7a68'}">Diamante</button>
      </div></div></div>`; }
/* ---------- CONVENIÊNCIAS DO VIP no Equipamento (tabela: Sys.vip.conv/convTable; preferências: window.VipAuto, js/vipauto.js) ----------
   Nenhum número escrito aqui: nível que libera, texto "VIP n" e valores vêm do módulo. Com a chave Sys.vip.DATA.convOn desligada nada disto aparece. */
function xVipConvOn(){ try{ return !!(window.Sys&&Sys.vip&&Sys.vip.DATA&&Sys.vip.DATA.convOn===true&&typeof Sys.vip.conv==='function'); }catch(e){ return false; } }
const X_VIP_HOW='O VIP sobe com o total gasto na Loja.';
/* próximo degrau do bônus de mochila acima do nível atual: {vip, add, text:'VIP 1: +20'}; null = já está no maior (ou chave desligada) */
function xBagNext(){ try{ if(!xVipConvOn()||typeof Sys.vip.convTable!=='function') return null; const row=Sys.vip.convTable().find(x=>x.id==='bag'), cur=+Sys.vip.conv(S,'bag').value||0, lv=Sys.vip.level(S);
    if(!row||!Array.isArray(row.values)) return null; for(let i=lv+1;i<row.values.length;i++) if(row.values[i]>cur) return {vip:i,add:row.values[i],text:'VIP '+i+': +'+row.values[i]}; }catch(e){} return null; }
/* interruptores do bloco "Automático": [{k (chave do VipAuto.setPref), label, locked, lockText, need, on}]; null = sem o módulo/chave (o bloco não existe).
   A Fusão só entra quando VipAuto.state(S).autoFuse.available (a Fusão ainda não foi votada). */
function gAutoRows(){ try{ if(!xVipConvOn()||!window.VipAuto||typeof VipAuto.state!=='function'||typeof VipAuto.setPref!=='function') return null; const st=VipAuto.state(S); if(!st||!st.autoSell) return null;
    /* 'autoEquip' NÃO entra (decisão do dono: equipar o melhor sozinho é de todos, não é vantagem de VIP); o id é ignorado mesmo que o módulo ainda o liste */
    const sp=st.autoSell.pref||{}, L=[{k:'autoSell0',c:st.autoSell,p:!!sp[0],label:'Desmanchar ao pegar: '+RN(0)},{k:'autoSell1',c:st.autoSell,p:!!sp[1],label:'Desmanchar ao pegar: '+RN(1)}];
    if(st.autoFuse&&st.autoFuse.available) L.push({k:'autoFuse',c:st.autoFuse,p:!!st.autoFuse.pref,label:'Fundir 3 iguais sozinho'});
    return L.map(r=>({k:r.k,label:r.label,locked:!r.c.on,lockText:r.c.lockText||'VIP',need:+r.c.need||0,on:!!r.c.on&&r.p})); }catch(e){ return null; } }
function gAuto(){ const rows=gAutoRows(); if(!rows){ XG.auto=false; return ''; } const anyLock=rows.some(r=>r.locked);
  const row=r=>`<button data-x="autosw" data-k="${r.k}" role="switch" aria-checked="${r.on?'true':'false'}" aria-label="${esc2(r.label)}${r.locked?', trancado: '+esc2(r.lockText):r.on?', ligado':', desligado'}" style="width:100%;min-height:48px;display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;border:1px solid ${r.on?'#5fd068':'#4a3a2b'};background:#16110d;color:#f6ecdf;text-align:left;box-sizing:border-box">
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:13px;font-weight:900">${esc2(r.label)}</span>
        <span style="font-size:11px;font-weight:800;color:${r.locked?'#c9b9a2':r.on?'#7ef08a':'#c9b9a2'}">${r.locked?'Trancado':r.on?'Ligado':'Desligado'}</span></span>
      ${r.locked?`<span style="flex:none;display:flex;align-items:center;gap:4px;height:26px;padding:0 8px;border-radius:13px;border:1px solid #8a7458;background:#33271d;color:#ffc94a;font-size:12px;font-weight:900;white-space:nowrap">${SVG_LOCK(14,'#ffc94a')}${esc2(r.lockText)}</span>`
        :`<span aria-hidden="true" style="flex:none;position:relative;width:46px;height:26px;border-radius:13px;background:${r.on?'#5fd068':'#4a3a2b'};border:1px solid #16110d;box-sizing:border-box"><span style="position:absolute;top:2px;left:${r.on?22:2}px;width:20px;height:20px;border-radius:50%;background:#f6ecdf;transition:left .15s"></span></span>`}</button>`;
  return `<div class="x-scrim" style="position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box"><button data-x="autox" aria-label="Fechar" style="position:absolute;inset:0;border:0;padding:0;background:rgba(8,6,4,.7)"></button>
    <div class="x-pop" role="dialog" aria-label="Automático" style="position:relative;width:100%;max-width:330px;max-height:100%;overflow-y:auto;border-radius:18px;border:3px solid #ffc94a;background:#241b14;padding:14px;box-sizing:border-box;display:flex;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;gap:8px"><span class="lil" style="flex:1;min-width:0;font-size:20px">Automático</span>
        <button data-x="autox" aria-label="Fechar" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;padding:0;display:flex;align-items:center;justify-content:center">${SVG_X}</button></div>
      ${rows.map(row).join('')}
      <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.25">O desmanche vale só para itens novos e nunca toca no equipado.</span>
      <span id="xg_automsg" role="status" style="font-size:12px;font-weight:900;color:#ffc94a;line-height:1.25;${XG.autoMsg?'':'display:none'}">${esc2(XG.autoMsg||'')}</span>
      ${anyLock?`<div style="display:flex;align-items:center;gap:8px"><span style="flex:1;min-width:0;font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.25">${X_VIP_HOW}</span>
        <button data-x="autoshop" class="x-gold lil" style="flex:none;height:44px;padding:0 14px;border-radius:12px;font-size:15px;white-space:nowrap">Ir à Loja</button></div>`:''}
    </div></div>`; }
/* toque num interruptor: quem decide é o VipAuto.setPref (sem o nível devolve {ok:false, lockText}: a tela só explica, nada liga) */
function gAutoToggle(k){ const rows=gAutoRows(), r=rows&&rows.find(x=>x.k===k); if(!r) return;
  let res=null; try{ res=VipAuto.setPref(S,k,!r.on); }catch(e){ res=null; }
  if(res&&res.ok){ snd('ui_tap'); XG.autoMsg=''; }
  else { snd('ui_tap'); XG.autoMsg=res&&res.lockText?res.lockText+': '+r.label+' libera no '+res.lockText+'. '+X_VIP_HOW
      :res&&res.reason==='off'?'A Fusão ainda não está disponível.':'Não deu para mudar agora. Tente de novo.'; }
  render(); }
function gClick(b){
  if(XG.fly||XG.drag||Date.now()<(XG.noClick||0)) return;   /* itens voando, arrasto em curso ou recém-solto: o toque não vale */
  const a=b.dataset.x, it=XG.sel!=null?itemOf(XG.sel):null, lv=plv();
  if(a==='auto'){ snd('ui_tap'); if(gAutoRows()){ XG.auto=true; XG.autoMsg=''; render(); } }
  else if(a==='autox'){ snd('ui_tap'); XG.auto=false; XG.autoMsg=''; render(); }
  else if(a==='autosw'){ gAutoToggle(b.dataset.k); }
  else if(a==='autoshop'){ snd('ui_tap'); XG.auto=false; XG.autoMsg=''; try{ if(xUnlocked('gemShop')) XH.tab='gem'; }catch(e){} setView('shop'); }
  else if(a==='bagvip'){ snd('ui_tap'); const n=xBagNext(); if(n) gToast('Mochila com +'+n.add+' espaços no VIP '+n.vip+'. '+X_VIP_HOW); }
  else if(a==='slot'){ snd('ui_tap'); const s=b.dataset.slot; XG.filter=XG.filter===s?'all':s; XG.page=0; XG.anim=true; render(); }
  else if(a==='wing'){ snd('ui_tap'); gToast(`Asa: libera no nível ${Sys.stats.DATA.wing.minLevel} (você está no ${lv})`); }
  else if(a==='all'){ snd('ui_tap'); XG.filter='all'; XG.page=0; XG.anim=true; render(); }
  else if(a==='pg'){ const p=XG.page+(+b.dataset.d); if(p>=0&&p<(XG.pages||1)){ snd('ui_tap'); XG.page=p; XG.anim=true; render(); } }
  else if(a==='prog'){ if(!xUnlocked('practice')) return; snd('ui_tap'); Screens.open('progress'); }
  else if(a==='look'){ snd('ui_tap'); if(!(window.Panels&&Panels.open('look',{from:'gear'}))) gToast('Aparência: em breve'); }   /* volta ao Equipamento ao fechar */
  else if(a==='forge'){ if(!xUnlocked('forge')) return; snd('ui_tap'); if(window.Panels) Panels.open('forge'); }
  else if(a==='goskins'){ if(!xUnlocked('gemShop')){ snd('ui_tap'); gToast('Loja de skins: libera no nível '+xUnlockLv('gemShop')); return; }   /* loja de skins (gemas) só no nível 10 */ snd('ui_tap'); XH.tab='hero'; setView('shop'); }
  else if(a==='cell'){ snd('ui_tap'); const x=itemOf(+b.dataset.id); if(x){ delete x.nw; XG.sel=x.id; XG.sheetIn=true; render(); XG.sheetIn=false; if(typeof tutEvent==='function') tutEvent('view'); } }
  else if(a==='close'){ snd('ui_tap'); XG.sel=null; render(); }
  else if(a==='best'){ const bst=gBest(); if(!bst.n){ snd('ui_tap'); gToast('Já está com o melhor'); return; }
    if(PANEL_V2.equipFly&&typeof gFlyBest==='function') gFlyBest(bst);   /* js/equipfx.js: itens voam da mochila aos espaços, depois a FC conta */
    else gChange(()=>{ S.eq=bst.eq; XG.sel=null; },bst.n===1?'Equipou 1 item melhor':'Equipou '+bst.n+' itens melhores',null,{big:true,dur:900}); }
  else if(!it) return;
  else if(a==='equip'){ if(!canEq(it)) return; gChange(()=>{ S.eq[it.slot]=it.id; XG.sel=null; },'Equipado: '+iname(it)); }
  else if(a==='unequip'){ gChange(()=>{ delete S.eq[it.slot]; },'Tirou: '+iname(it),'ui_tap'); }
  else if(a==='upgold'||a==='upgem'){ const cur=a==='upgem'?'gems':'gold', c=Sys.stats.canUpgrade(S,Sys.host,it,cur);
    if(!c.ok){ snd('ui_tap'); gToast(c.reason==='max'?'Nível máximo':c.reason==='level'?'Suba ao nível '+(c.needLevel||it.lvl+1)+' para melhorar':needMsg(cur,cur==='gems'?c.gems:c.gold)); return; }
    gChange(()=>{ const r=Sys.stats.upgrade(S,Sys.host,it,cur); if(!r.ok) return false; ptrack('upgrade',1); },'Nível '+(it.lvl+1)+'!','upgrade'); if(typeof tutEvent==='function') tutEvent('up'); }
  else if(a==='upmax'){ const mx=gMaxPlan(it); if(!mx.n){ snd('ui_tap'); gToast(it.lvl>=Math.min(100,lv)?'Suba ao nível '+(it.lvl+1)+' para melhorar':needMsg('gold',Sys.stats.upgradeCost(it).gold)); return; }
    gChange(()=>{ const r=Sys.stats.upgradeTo(S,Sys.host,it,'gold',mx.to); if(!r.ok) return false; ptrack('upgrade',mx.n); },'Subiu para o nível '+mx.to+'!','upgrade'); if(typeof tutEvent==='function') tutEvent('up'); }
  else if(a==='equp'){ snd('ui_tap'); const p=Sys.stats.planUpgrade(S,Sys.host,it,'gold'); if(!(p.levels>0)){ gToast('Suba ao nível '+(p.needLevel||it.lvl+1)+' para melhorar'); return; }   /* item no teto: nada a confirmar (0 níveis) */
    if(!p.ok&&S.gems<p.gems){ gToast(needMsg('gold',p.gold)); return; } XG.cf=it.id; render(); }
  else if(a==='cfno'){ snd('ui_tap'); XG.cf=null; render(); }
  else if(a==='cfgold'||a==='cfgem'){ const cur=a==='cfgem'?'gems':'gold', p=Sys.stats.planUpgrade(S,Sys.host,it,cur);
    if(!p.ok){ snd('ui_tap'); gToast(needMsg(cur,p.cost)); return; }
    XG.cf=null; gChange(()=>{ const r=Sys.stats.upgradeTo(S,Sys.host,it,cur); if(!r.ok) return false; ptrack('upgrade',p.levels); if(canEq(it)) S.eq[it.slot]=it.id; },'Equipado no nível '+p.to+'!','upgrade'); if(typeof tutEvent==='function') tutEvent('up'); }
  else if(a==='dism'){ if(S.eq[it.slot]===it.id){ snd('ui_tap'); gToast('Tire o item antes de desmontar'); return; }
    let r=null; gChange(()=>{ r=Sys.loot.dismantle(S,Sys.host,it); S.inv=S.inv.filter(x=>x.id!==it.id); XG.sel=null; },null,'coin');
    gToast('Desmontado: +'+gNum(r&&r.gold||0)+' moedas'+(r&&r.forge?' · +'+r.forge+' pedra'+(r.forge>1?'s':'')+' de forja':'')); }
}

/* ======================================================================= 06 INVOCAR ======================================================================= */
const XS={phase:'idle',res:[],shown:0,mode:1,timers:[],anim:true,toast:''};
function sLater(fn,ms){ XS.timers.push(setTimeout(fn,ms)); }
function sClear(){ XS.timers.forEach(clearTimeout); XS.timers=[]; }
function sToast(msg){ const el=document.getElementById('xs_toast'); if(el) el.innerHTML=`<div class="x-toast2" style="position:absolute;left:0;right:0;top:6px;display:flex;justify-content:center;pointer-events:none;z-index:3"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.92);border:2px solid #ffc94a;font-size:14px;font-weight:900;box-shadow:0 0 16px rgba(255,201,74,.5);text-align:center">${esc2(msg)}</span></div>`; }
/* chances por raridade: Sys.loot.summonOdds(host) → {byR:[%], cap, pity} (já com o portão e a regra da arma). Trancada = acima do portão. */
function sChances(){ const O=Sys.loot.summonOdds(Sys.host), G=Sys.loot.DATA.gates||[];
  return O.byR.map((p,i)=>{ if(i>O.cap){ const g=G[i]||{}, needL=(g.lvl||0)>plv(); return {i,locked:true,txt:needL?'Nv. '+g.lvl:'Era '+((g.era||0)+1)}; } return {i,locked:false,p:Math.round(p*10)/10}; }); }
function scrSummon(){
  const d=xDims(560), H=d.H, L=Sys.loot, c1=L.summonCost(Sys.host,1), c10=L.summonCost(Sys.host,10), free=L.summonFreeLeft(S,Sys.host)>0, brinde=c1>0?Math.round(10-c10/c1):0;
  const cap=Math.min(L.maxAllowedR(Sys.host),RAR.length-1), P=L.DATA.summon.pity||10, st=(L.ensure(S).summon)||{pity:0}, pity=Math.min(P,st.pity||0), left=Math.max(1,P-pity);
  const stageH=Math.max(170,Math.min(262,H-22-58-70-54-74-40)), cy=d.real?0:stageH-262, stK=H+56<=600?0.6:H+56<=700?0.72:1;   // layout novo: o palco estica (flex) e o conteúdo reduz em tela baixa; antigo: o palco absorve a altura
  const chips=sChances().map((c,i)=>c.locked
    ?`<div class="x-chip" data-x="chiplock" data-msg="${RN(i)}: libera no ${c.txt.replace('Nv.','nível').replace('Era','era')}" style="height:46px;border-radius:12px;background:#120d0a;border:2px dashed #6b5843;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;animation-delay:${i*0.06}s;box-sizing:border-box;color:#c9b9a2" aria-label="${RN(i)}: trancado, libera no ${c.txt}">
        <span style="font-size:10px;font-weight:900;color:${RC[i]};opacity:.75">${RN(i)}</span><span style="display:flex;align-items:center;gap:3px;font-size:11px;font-weight:900">${SVG_LOCK(12)}${c.txt}</span></div>`
    :`<div class="x-chip" style="height:46px;border-radius:12px;background:#1d1611;border:2px solid ${RC[i]};display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.1;animation-delay:${i*0.06}s;box-sizing:border-box">
        <span style="font-size:11px;font-weight:900;color:${RC[i]}">${RN(i)}</span><span class="lil" style="font-size:16px">${String(c.p).replace('.',',')}%</span></div>`).join('');
  const shake=XS.phase==='shake';
  V.innerHTML=xWrap(d,XS.anim?'x-in':'',`<div style="position:relative;flex:1;overflow:hidden;display:flex;flex-direction:column;padding:10px 12px 12px;gap:10px;box-sizing:border-box">
    <div style="position:absolute;inset:0;overflow:hidden;background:#7fb3d9">
      <div class="x-ly x-sky" style="top:0;height:422px;background-size:auto 422px"></div><div class="x-ly x-cld" style="top:30px;height:70px;background-size:auto 70px;animation-duration:140s"></div>
      <div class="x-ly x-far" style="top:155px;height:296px;background-size:auto 296px"></div><div class="x-ly x-gnd" style="top:461px;height:268px;background-size:auto 268px"></div></div>
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 34%,rgba(40,26,14,.55) 0%,rgba(22,17,13,.9) 55%,#16110d 100%)"></div>
    <div style="position:relative;height:58px;flex:none;display:flex;align-items:center;gap:10px;padding:0 12px;border-radius:16px;background:rgba(29,22,17,.92);border:2px solid #4a3a2b;box-sizing:border-box">
      <div style="width:44px;height:44px;flex:none;border-radius:12px;background:linear-gradient(180deg,#c9a3ff,#7a45d6);color:#1a0a33;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1" aria-label="Faltam ${left} para a garantia">
        <span class="lil" style="font-size:18px">${left}</span><span style="font-size:9px;font-weight:900">FALTAM</span></div>
      <div style="flex:1;display:flex;flex-direction:column;gap:5px;min-width:0">
        <span style="font-size:13px;font-weight:900;line-height:1.15">Garantia da melhor raridade liberada a cada ${P}</span>
        <div role="img" aria-label="Garantia: ${pity} de ${P}" style="display:flex;gap:3px">${Array.from({length:P},(_,i)=>`<span style="flex:1;height:8px;border-radius:4px;background:${i<pity?'#b07cff':'#33271d'};transition:background .3s"></span>`).join('')}</div>
      </div></div>
    <div style="position:relative;${d.real?'flex:1 1 262px;min-height:170px;width:100%':'height:'+stageH+'px;flex:none;width:366px'};align-self:center"><div style="${d.real?'position:absolute;left:50%;top:50%;width:366px;height:262px;margin:-131px 0 0 -183px;transform:scale('+stK+')':'position:absolute;inset:0'}">
      <div class="x-rays" style="left:33px;top:${-4+cy/2}px;width:300px;height:300px"></div><div class="x-rays x-rays2" style="left:63px;top:${26+cy/2}px;width:240px;height:240px"></div><div class="x-glow" style="left:88px;top:${50+cy/2}px;width:190px;height:190px"></div>
      <span class="x-spark x-spark2" style="left:110px;top:${210+cy}px"></span><span class="x-spark x-spark2" style="left:150px;top:${228+cy}px;animation-delay:.8s;width:4px;height:4px"></span><span class="x-spark x-spark2" style="left:205px;top:${222+cy}px;animation-delay:1.7s"></span><span class="x-spark x-spark2" style="left:250px;top:${212+cy}px;animation-delay:2.3s;width:3px;height:3px"></span><span class="x-spark x-spark2" style="left:182px;top:${236+cy}px;animation-delay:1.2s;width:3px;height:3px"></span>
      ${shake?`<div class="x-charge" style="position:absolute;left:83px;top:${30+cy}px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(255,240,190,.95) 0%,rgba(255,201,74,.5) 40%,rgba(255,201,74,0) 70%)"></div>
        <img class="x-chestS" src="assets/ui/chest.png" alt="Baú abrindo" style="position:absolute;left:83px;top:${30+cy}px;width:200px;height:200px;object-fit:contain">`
       :`<div class="x-shadowF" style="position:absolute;left:118px;top:${232+cy}px;width:130px;height:18px;border-radius:50%;background:rgba(0,0,0,.55)"></div>
        <img class="x-chestF" src="assets/ui/chest.png" alt="Baú de equipamento" style="position:absolute;left:83px;top:${30+cy}px;width:200px;height:200px;object-fit:contain;filter:drop-shadow(0 8px 14px rgba(0,0,0,.6))">`}
      <div id="xs_toast"></div></div>
    </div>
    <div style="position:relative;flex:none;display:flex;flex-direction:column;gap:6px">
      <span style="font-size:12px;font-weight:900;color:#c9b9a2">Chances neste nível</span>
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">${chips}</div></div>
    <div style="position:relative;flex:none">${free
      ?`<button class="x-gpulse lil" id="xs_freebtn" data-x="pull" data-a="pull" data-k="item" data-n="1" data-free="1" style="width:100%;height:54px;border-radius:16px;border:0;background:linear-gradient(180deg,#7ee27a,#3fae3c);color:#0d2410;font-size:19px;display:flex;align-items:center;justify-content:center;gap:8px">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"></rect><path d="M12 8v13"></path><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"></path><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"></path></svg>
          Abrir grátis <span style="font-family:Nunito,sans-serif;font-size:13px;font-weight:900">· 1 por dia</span></button>`
      :`<div role="status" style="width:100%;height:54px;border-radius:16px;border:2px solid #4a3a2b;background:rgba(29,22,17,.92);display:flex;align-items:center;justify-content:center;gap:8px;font-size:14px;font-weight:800;color:#c9b9a2;box-sizing:border-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"></circle><polyline points="12 9 12 13 15 15"></polyline></svg>
          Grátis de novo em <span class="lil" id="xs_free" style="font-size:18px;color:#f6ecdf">${midnightLeft()}</span></div>`}</div>
    <div style="position:relative;flex:none;display:flex;gap:10px">
      <button class="x-brown" data-x="pull" data-a="pull" data-k="item" data-n="1" style="flex:1;height:74px;border-radius:18px;border:2px solid #ffc94a;background:linear-gradient(180deg,#4a3a2b,#2a1f16);color:#f6ecdf;box-shadow:0 6px 0 #0a0705;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:0;${S.gold>=c1?'':'border-color:#4a3a2b;background:#33271d;color:#8a7a68'}">
        <span class="lil" style="font-size:21px">Abrir x1</span><span style="display:flex;align-items:center;gap:4px;font-size:14px;font-weight:900;color:${S.gold>=c1?'#ffc94a':'#8a7a68'}">${COIN_I(22)}${kf(c1)}</span></button>
      <button class="${S.gold>=c10?'x-gold x-pulse':''}" data-x="pull" data-a="pull" data-k="item" data-n="10" style="position:relative;flex:1.2;height:74px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:0;${S.gold>=c10?'':'border:0;background:#33271d;color:#8a7a68;box-shadow:0 6px 0 #0a0705'}">
        <span class="lil" style="font-size:23px">Abrir x10</span><span style="display:flex;align-items:center;gap:4px;font-size:14px;font-weight:900">${COIN_I(20)}${kf(c10)}</span>${brinde>0?`<span style="position:absolute;top:-9px;right:8px;padding:1px 7px;border-radius:8px;background:#5fd068;color:#0d2410;font-family:Nunito,system-ui,sans-serif;font-size:11px;font-weight:900;white-space:nowrap">${brinde} de brinde</span>`:''}</button>
    </div>
    <div id="xs_over"></div>
  </div>`);
  XS.anim=false;
  if(XS.phase==='reveal') sOverlay(true);
}
function sCard(k,i,shown){ const x10=XS.mode===10, w=x10?62:150, h=x10?92:210, im=x10?48:120, fs=x10?9:15, c=RC[k.r];
  if(!shown) return `<div class="x-back" style="position:absolute;inset:0;border-radius:12px;border:2px solid #6a5440;background:repeating-linear-gradient(45deg,#33271d 0 6px,#2a1f16 6px 12px);display:flex;align-items:center;justify-content:center"><img src="assets/ui/chest.png" alt="" style="width:34px;height:34px;object-fit:contain;opacity:.7"></div>`;
  const tag=k.pity?'GARANTIA':k.r===4?'LENDÁRIO!':'';
  const tagH=tag?`<span class="x-legtag" style="position:absolute;left:50%;top:-10px;padding:1px 6px;border-radius:6px;background:${k.r===4?'#ffc94a':c};color:#2a1403;font-size:${x10?9:11}px;font-weight:900;white-space:nowrap;box-shadow:0 0 10px ${c};z-index:2">${tag}</span>`:'';
  const eqB=k.eq?`<span title="Equipado" style="position:absolute;top:-6px;left:-6px;width:20px;height:20px;border-radius:50%;background:#5fd068;border:2px solid #16110d;display:flex;align-items:center;justify-content:center;z-index:2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0d2410" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>`:'';
  /* moldura da raridade (xRar). Lendária: mesma moldura, com o fundo dourado e o pulso próprios dela ('xr-s'); garantia: mantém o brilho forte em linha */
  const q=xRar(k.r,k.r===4?'xr-s':'');
  if(k.r===4) return `<span class="x-lrays" style="width:${x10?150:340}px;height:${x10?150:340}px"></span>
    <div class="x-legcard${q.cls}"${q.at} style="position:absolute;inset:0;border-radius:12px;${q.on?'':'border:3px solid #ffc94a;'}background:radial-gradient(circle at 50% 35%,#8a5a12 0%,#3a2408 70%);overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box">
      <img src="${slotIcon(k.slot,k.e)}" alt="" style="width:${im}px;height:${im}px;object-fit:contain;filter:drop-shadow(0 0 8px #ffc94a)"><span style="font-size:${fs}px;font-weight:900;text-align:center;line-height:1.05;padding:0 3px;color:${q.on?q.t:'#fff'}">${esc2(k.name)}</span><span class="x-sheen2"></span></div>${tagH}${eqB}`;
  return `<div class="x-cardin${q.cls}"${q.at} style="position:absolute;inset:0;border-radius:12px;${q.on?(k.pity?'box-shadow:0 0 18px 4px '+c+';':''):`border:3px solid ${c};background:radial-gradient(circle at 50% 35%,${c}44 0%,#1d1611 70%);box-shadow:${k.pity?'0 0 18px 4px '+c:k.r>=1?'0 0 '+(6+k.r*4)+'px '+c:'none'};`}overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box">
      <img src="${slotIcon(k.slot,k.e)}" alt="" style="width:${im}px;height:${im}px;object-fit:contain"><span style="font-size:${fs}px;font-weight:900;text-align:center;line-height:1.05;padding:0 3px${q.on?';color:'+q.t:''}">${esc2(k.name)}</span>
      <span style="font-size:9px;font-weight:900;color:${c}">${k.dism?'Desmontado':RN(k.r)}</span>${k.r>=2?'<span class="x-sheen2"></span>':''}</div>${tagH}${eqB}`; }
function sOverlay(full){ const el=document.getElementById('xs_over'); if(!el) return; const x10=XS.mode===10, tot=XS.res.length, all=XS.shown>=tot;
  let best=null; XS.res.slice(0,XS.shown).forEach(x=>{ if(!best||x.r>best.r) best=x; });
  if(full){ el.innerHTML=`<div class="x-scrim" style="position:absolute;inset:0;z-index:4;background:radial-gradient(ellipse at 50% 40%,rgba(58,40,20,.96) 0%,rgba(14,10,7,.98) 70%);display:flex;flex-direction:column;align-items:center;padding:18px 12px 16px;box-sizing:border-box;gap:12px">
      <div class="x-rays" style="left:50%;margin-left:-150px;top:120px;width:300px;height:300px;opacity:.35"></div>
      <div style="position:relative;display:flex;flex-direction:column;align-items:center"><span class="lil" style="font-size:28px;color:#ffc94a;text-shadow:0 3px 0 #6a3a08">Resultado</span><span id="xs_sub" style="font-size:13px;font-weight:800;color:#c9b9a2"></span></div>
      <div style="position:relative;flex:1;width:100%;display:flex;align-items:center;justify-content:center;min-height:0"><div style="display:grid;grid-template-columns:${x10?'repeat(5,62px)':'150px'};gap:10px 8px;justify-content:center">
        ${XS.res.map((k,i)=>`<div id="xs_c${i}" style="position:relative;width:${x10?62:150}px;height:${x10?92:210}px">${sCard(k,i,i<XS.shown)}</div>`).join('')}</div></div>
      <div id="xs_best" style="position:relative;height:22px;font-size:14px;font-weight:800;white-space:nowrap"></div><div id="xs_btn" style="position:relative"></div></div><div id="xs_fl"></div>`; }
  const sub=document.getElementById('xs_sub'); if(sub) sub.textContent=x10?'Abertura x10 · '+XS.shown+' / '+tot:'Abertura x1';
  const bt=document.getElementById('xs_best'); if(bt) bt.innerHTML=best?`Melhor: <span style="color:${xRarT(best.r)}">${esc2(best.name)} (${RN(best.r)})</span>`:'';
  const bn=document.getElementById('xs_btn'); if(bn&&bn.dataset.k!==String(all)){ bn.dataset.k=String(all); bn.innerHTML=all?'<button class="x-gold x-pulse lil" data-x="collect" style="width:240px;height:58px;border-radius:18px;font-size:24px">Coletar</button>'
      :'<button data-x="skip" class="lil" style="width:240px;height:58px;border-radius:18px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:20px">Revelar tudo</button>'; } }
function sRevealNext(){ if(XS.phase!=='reveal'||XS.shown>=XS.res.length) return; const i=XS.shown, it=XS.res[i]; XS.shown++;
  const el=document.getElementById('xs_c'+i); if(el) el.innerHTML=sCard(it,i,true); sOverlay(false);
  if(it.r===4||it.pity){ snd(it.r===4?'legendary':'claim'); if(it.r===4){ const f=document.getElementById('xs_fl'); if(f) f.innerHTML='<div class="x-legflash" style="position:absolute;inset:0;z-index:6;background:radial-gradient(circle at 50% 45%,rgba(255,230,140,.95) 0%,rgba(255,201,74,.55) 30%,rgba(255,201,74,0) 65%)"></div>'; vib(60); } } else snd('ui_tap');
  if(XS.shown<XS.res.length) sLater(sRevealNext,it.r===4||it.pity?700:260); }
function sStart(n,free){
  if(XS.phase!=='idle') return; const L=Sys.loot;
  PULLING=[]; let r=null; try{ r=L.summon(S,Sys.host,n,free?{free:true}:{}); }finally{ var out=PULLING; PULLING=null; }
  if(!r||!r.ok){ snd('ui_tap'); sToast(r&&r.reason==='ouro'?needMsg('gold',r.cost):r&&r.reason==='gratis'?'A grátis de hoje já foi usada':'Invocação indisponível'); return; }
  ptrack('summon',n); statsChanged(); if(typeof tutEvent==='function') tutEvent('pull');
  XS.res=out; XS.shown=0; XS.mode=n; XS.phase='shake'; snd('summon'); render();
  sLater(()=>{ const o=document.getElementById('xs_over'); if(o) o.innerHTML='<div class="x-flash" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#fffbe8 0%,#ffe9a8 40%,rgba(255,233,168,.85) 100%);z-index:5"></div>'; },850);
  sLater(()=>{ XS.phase='reveal'; render(); sRevealNext(); },1250);
}
function sClick(b){ const a=b.dataset.x;
  if(a==='pull') sStart(+b.dataset.n,b.dataset.free==='1');
  else if(a==='chiplock'){ snd('ui_tap'); sToast(b.dataset.msg||'Raridade ainda trancada'); }
  else if(a==='skip'){ sClear(); snd('ui_tap'); if(XS.res.slice(XS.shown).some(x=>x.r===4)) snd('legendary'); XS.shown=XS.res.length; sOverlay(true); }
  else if(a==='collect'){ sClear(); snd('claim'); XS.phase='idle'; XS.res=[]; XS.shown=0; XS.anim=true; render(); }
}

/* ======================================================================= 07 LOJA ======================================================================= */
const XH={tab:'hero',page:{hero:0,weapon:0,item:0},sel:null,cf:null,burst:false,anim:true};
const SHOP_ITEMS_TAB=true;   // aba extra "Itens" (ofertas do dia em ouro, compra direta): NÃO existe no canvas; false = some (decisão do PO pendente)
/* VENDA DE SKIN (decisão do dono via PO): a Loja só mostra para comprar a skin que Sys.appearance.canSell(id, existe) aceita. Skin de arma passa;
   roupa/corpo inteiro só passa quando a Arte entregar as folhas (aí volta sozinha: nada sai do catálogo SKINS, é só filtro de exibição e de compra).
   O que o jogador já tem (S.skins) ou está usando continua aparecendo. Sem o módulo (canSell não existe): tudo como antes.
   existe(caminho): lista de arquivos do assets/manifest.json (tools/asset-manifest.js), lida uma vez; enquanto não chega (ou se falhar), vale o seguro:
   arte de arma existe, folha de corpo inteiro não. */
const XSELL={st:0,set:null};
const xSellOn=()=>!!(window.Sys&&Sys.appearance&&typeof Sys.appearance.canSell==='function');
function xSellLoad(){ if(XSELL.st||typeof fetch!=='function') return; XSELL.st=1;
  try{ fetch('assets/manifest.json').then(r=>r&&r.ok?r.json():null).then(m=>{ if(!m||!m.packs) return; const st=new Set(); for(const k in m.packs) for(const p of (m.packs[k].files||[])) st.add(p);
    XSELL.set=st; XSELL.st=2; if(typeof view!=='undefined'&&view==='shop'&&typeof render==='function') render(); }).catch(()=>{}); }catch(e){} }
const xFileHas=p=>XSELL.set?XSELL.set.has(p):String(p).indexOf('assets/weapons/')===0;
function xCanSell(id){ if(!xSellOn()) return true; xSellLoad(); try{ return !!Sys.appearance.canSell(id,xFileHas); }catch(e){ return true; } }
/* o Passe ainda entrega skin? (Sys.pass.DATA: algum nível com .skin). Hoje não: o nível 25 virou arma + materiais; a skin do passe sai da Loja. */
function xPassSkin(){ try{ const D=Sys.pass.DATA; return (D.premium||[]).concat(D.free||[]).some(r=>r&&r.skin); }catch(e){ return false; } }
/* ESPERA DE IMAGENS (ordem do dono: tela com arte só mostra o conteúdo com as imagens prontas; js/p_wait.js do QA). xGate(urls) = pGate só com as
   imagens que EXISTEM (lista do assets/manifest.json, a mesma do filtro de venda): arquivo que falta não trava a tela (ela já tem reserva para
   imagem ausente). Sem o p_wait, ou enquanto a lista de arquivos não chegou: false (a tela segue como antes). true = o esqueleto está na tela e o
   render volta sozinho. */
function xGate(urls){ try{ if(typeof pGate!=='function') return false; if(!XSELL.set){ xSellLoad(); return false; } const l=[]; for(const u of urls||[]) if(typeof u==='string'&&u&&XSELL.set.has(u)&&l.indexOf(u)<0) l.push(u); return l.length?!!pGate(l):false; }catch(e){ return false; } }
/* imagem que o skinArt usa para uma skin (o mesmo caminho, para a espera) */
const xSkinUrl=sk=>!sk?'':sk.slot==='weapon'?'assets/weapons/'+(typeof wKey==='function'?wKey(sk):'era'+sk.e+'_t'+tierOf(sk.r))+'.png':sk.e===2?'assets/anim/hyb/R/kael_idle_era2_t'+tierOf(sk.r)+'.png':'assets/hero/era'+sk.e+'_t'+tierOf(sk.r)+'.png';
const xSkinShow=sk=>S.skins.includes(sk.id)||S.skinEq[sk.slot]===sk.id||xCanSell(sk.id);
/* ROUPA-SKIN INATIVA (decisão final do dono): Sys.appearance.outfitStatus(id) → {outfit, active, note}. A roupa que o jogador JÁ tem continua aparecendo
   na coleção, com a nota do módulo ("nova skin em breve") e SEM botão de equipar; nada sai do save. Skin de arma: nota vazia, tudo como antes.
   Sem outfitStatus no módulo: nota vazia (comportamento de antes). */
function xOutfitNote(id){ try{ const M=window.Sys&&Sys.appearance; if(!M||typeof M.outfitStatus!=='function') return ''; const o=M.outfitStatus(id); if(!o||!o.outfit||o.active) return '';
    const t=String(o.note||'nova skin em breve'); return t.charAt(0).toUpperCase()+t.slice(1); }catch(e){ return ''; } }
try{ xSellLoad(); }catch(e){}   /* lê a lista de arquivos já na carga, para a Loja não abrir com as roupas escondidas e mostrá-las um instante depois */
const hList=tab=>SKINS.filter(s=>s.slot===(tab==='hero'?'armor':'weapon')&&(!s.pass||(s.id===SEASON_SKIN&&xPassSkin())||S.skins.includes(s.id))&&xSkinShow(s)).sort((a,b)=>(a.pass?1:0)-(b.pass?1:0)||a.e-b.e||a.r-b.r);
function hStatus(sk){ const eq=S.skinEq[sk.slot]===sk.id, own=S.skins.includes(sk.id), locked=!own&&!sk.pass&&sk.e>S.eraMax; return {eq,own:own&&!eq,pass:!own&&!!sk.pass,locked,buy:!own&&!sk.pass&&!locked&&xCanSell(sk.id)}; }
const skinArt=(sk,sz,op,cls)=>sk.slot==='weapon'?`<img class="${cls||''}" src="assets/weapons/${typeof wKey==='function'?wKey(sk):'era'+sk.e+'_t'+tierOf(sk.r)}.png" alt="" style="position:relative;width:${sz}px;height:${sz}px;object-fit:contain;opacity:${op}">`
  :sk.e===2?`<span class="kidle ${tierOf(sk.r)?'t'+tierOf(sk.r):''}" aria-hidden="true" style="position:relative;display:block;width:${sz}px;height:${sz}px;opacity:${op}"></span>`
  :`<img class="x-breathe" src="assets/hero/era${sk.e}_t${tierOf(sk.r)}.png" alt="" style="position:relative;width:${sz}px;height:${sz}px;object-fit:contain;opacity:${op}">`;
/* cartão OFERTA/DESTAQUE: skin do dia ou a melhor à venda DO ESPAÇO DA ABA (skin de arma só aparece na aba "Skins arma": achado do QA).
   Sem nada à venda: a skin em uso ("Na coleção"), menos quando ela é roupa-skin inativa (outfitStatus): aí null = o cartão some e a aba mostra
   "Novas skins em breve" no lugar dele (a skin em uso continua na lista, com a nota). */
function hFeat(tab,sub){ const slot=tab==='weapon'?'weapon':'armor', L=hList(tab); ensureShop();
  const day=(S.shop.skins||[]).map(SKIN).find(s=>s&&s.slot===slot&&!S.skins.includes(s.id)&&s.e<=S.eraMax&&xCanSell(s.id));
  XH.featDay=!!day; const top=day||L.filter(s=>hStatus(s).buy).sort((a,b)=>b.r-a.r||b.e-a.e)[0]; if(top) return top;
  const eq=SKIN(S.skinEq[slot])||null; return eq&&xOutfitNote(eq.id)?null:eq; }
function hToast(txt){ const el=document.getElementById('xh_toast'); if(el) el.innerHTML=`<div style="position:absolute;left:24px;right:24px;bottom:16px;z-index:40;display:flex;justify-content:center;pointer-events:none"><span class="x-stoast" role="status" style="padding:10px 16px;border-radius:12px;background:#12261a;border:2px solid #5fd068;color:#e6fbe7;font-size:14px;font-weight:900;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.6)">${esc2(txt)}</span></div>`; }
function scrShop(){
  ensureShop(); if(XH.tab==='col'&&!PANEL_V2.shopCol) XH.tab='hero';
  const gemOk=xUnlocked('gemShop'); if(!gemOk&&SHOP_ITEMS_TAB&&XH.tab!=='item'){ XH.tab='item'; XH.sel=null; XH.cf=null; }
  const tab=XH.tab, skinTab=tab==='hero'||tab==='weapon', d=skinTab?xFit(684,532):xDims(tab==='item'?568:532), H=d.H, rows=skinTab?(d.real?2:(d.full?2+Math.min(1,Math.max(0,Math.floor((H-684)/158))):1)):2, PER=rows*3, SK=Sys.skin.DATA;
  const tb=(k,lb,fl,extra)=>{ const on=tab===k; return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${k}" class="lil" style="flex:${fl};border-radius:12px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'linear-gradient(180deg,#ffe07a,#f2a826)':'#33271d'};color:${on?'#2a1403':'#c9b9a2'};font-size:13px;line-height:1.05;padding:0;display:flex;align-items:center;justify-content:center;gap:3px">${extra||''}<span>${lb}</span></button>`; };
  let body='';
  if(tab==='hero'||tab==='weapon'){
    const list=hList(tab), pages=Math.max(1,Math.ceil(list.length/PER)); XH.page[tab]=Math.max(0,Math.min(XH.page[tab],pages-1)); const pg=XH.page[tab]; XH.pages=pages;
    if(xGate(list.slice(pg*PER,pg*PER+PER).concat(XH.sel?[SKIN(XH.sel)]:[]).map(xSkinUrl).concat([xSkinUrl(hFeat(tab))]))) return;   /* imagens desta página ainda carregando: esqueleto (p_wait) */
    const feat=hFeat(tab), fs=feat?hStatus(feat):{}, fw=!!feat&&feat.slot==='weapon', owned=list.filter(s=>S.skins.includes(s.id)).length;
    /* cartão de skin: mesma moldura dos itens (xRar); a borda passa de 2 para 3 px e o respiro perde 1 px, o miolo fica do mesmo tamanho; bloqueada = sem pulso */
    const tiles=list.slice(pg*PER,pg*PER+PER).map(sk=>{ const st=hStatus(sk), off=(st.eq||st.own)?xOutfitNote(sk.id):'', c=RC[sk.r], op=st.locked?0.45:1, q=xRar(sk.r,st.locked?'xr-s':'');
      return `<button class="x-tile ${q.on?'':sk.r>=3&&!st.locked?'x-r'+sk.r:''}${q.cls}" data-x="skin" data-id="${sk.id}"${q.at} aria-label="${esc2(sk.n)}, ${RN(sk.r)}${off?', na coleção, '+esc2(off):st.eq?', equipada':st.own?', na coleção':st.pass?', só no passe':st.locked?', bloqueada até a '+ERAS[sk.e].n:', '+SKIN_PRICE[sk.r]+' gemas'}" style="border-radius:14px;${q.on?'':`border:2px solid ${c};background:linear-gradient(180deg,${RT[sk.r]} 0%,#1d1611 60%);`}color:#f6ecdf;padding:${q.on?'5px 3px':'6px 4px'};display:flex;flex-direction:column;align-items:center;gap:2px">
        ${sk.r>=2&&!st.locked?'<span class="x-tshine"></span>':''}<span style="font-size:11px;font-weight:900;color:${c}">${RN(sk.r)}</span>
        <div style="position:relative;width:70px;height:66px;display:flex;align-items:center;justify-content:center">
          ${tab==='hero'?'<span class="x-sped" style="left:13px;top:58px;width:44px;height:9px;border-width:1px"></span>':''}${skinArt(sk,tab==='hero'?70:66,op)}
          ${st.locked?`<span style="position:absolute;right:-6px;top:-4px;width:26px;height:26px;border-radius:50%;background:#0e0a07;border:2px solid #6b5843;display:flex;align-items:center;justify-content:center">${SVG_LOCK(14,'#f6ecdf')}</span>`:''}</div>
        <span style="height:28px;font-size:12px;font-weight:900;line-height:1.15;text-align:center;display:flex;align-items:center${q.on?';color:'+q.t:''}">${esc2(sk.n)}</span>
        ${off?`<span style="min-height:22px;padding:0 6px;border-radius:999px;border:1px solid #6b5843;background:#2a211a;color:#c9b9a2;font-size:10px;font-weight:900;line-height:1.05;text-align:center;display:flex;align-items:center">${esc2(off)}</span>`
          :st.eq?'<span style="height:22px;padding:0 8px;border-radius:999px;background:#5fd068;color:#0d2410;font-size:11px;font-weight:900;display:flex;align-items:center">Equipada</span>'
          :st.own?'<span style="height:22px;padding:0 8px;border-radius:999px;border:1px solid #5fd068;color:#c8f5cb;font-size:11px;font-weight:900;display:flex;align-items:center">Na coleção</span>'
          :st.pass?'<span style="height:22px;padding:0 8px;border-radius:999px;border:1px solid #ffc94a;color:#ffc94a;font-size:11px;font-weight:900;display:flex;align-items:center;gap:3px"><img src="assets/ui/pass.png" alt="" style="width:16px;height:16px;object-fit:contain">Só no Passe</span>'
          :st.locked?`<span style="height:22px;padding:0 8px;border-radius:999px;background:#2a211a;color:#c9b9a2;font-size:11px;font-weight:900;display:flex;align-items:center">${ERAS[sk.e].n.replace('Era da ','').replace('Era ','')}</span>`
          :`<span style="height:22px;padding:0 8px 0 4px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;color:#f6ecdf;font-size:12px;font-weight:900;display:flex;align-items:center;gap:3px">${GEM_I(16)}${SKIN_PRICE[sk.r]}</span>`}</button>`; }).join('');
    const dots=Array.from({length:pages},(_,i)=>`<span style="width:${i===pg?22:8}px;height:8px;border-radius:4px;background:${i===pg?'#ffc94a':'#4a3a2b'};transition:width .25s"></span>`).join('');
    const nw=d.Wb<340;   /* tela estreita: ver comentário do cartão */
    body=(feat?`<div class="x-feat" style="${nw?'min-height:196px':'height:196px'};flex:none;position:relative;display:flex;border-radius:16px;border:2px solid #ffc94a;background:linear-gradient(135deg,#4a361f 0%,#2a1f16 45%,#1d1611 100%);overflow:hidden;box-shadow:0 0 18px rgba(255,201,74,.35)">
        <div style="position:relative;width:${nw?104:168}px;flex:none;overflow:hidden"><div style="position:absolute;left:${nw?-32:0}px;top:0;width:168px;height:196px"><div class="x-srays"></div><div class="x-sped" style="left:24px;top:152px;width:120px;height:20px"></div>
          <div class="${fw?'x-bob':''}" style="position:absolute;left:4px;top:10px;width:160px;height:160px;filter:drop-shadow(0 0 10px rgba(255,201,74,.6))">${skinArt(feat,160,1,fw?'x-turn':'')}</div>
          <span class="x-tw" style="left:22px;top:30px"></span><span class="x-tw" style="left:136px;top:52px;animation-delay:.7s"></span><span class="x-tw" style="left:40px;top:140px;animation-delay:1.3s;width:4px;height:4px"></span><span class="x-tw" style="left:128px;top:150px;animation-delay:1.8s;width:5px;height:5px"></span></div></div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;padding:12px ${nw?8:12}px 12px ${nw?4:2}px;gap:4px">
          <div style="display:flex;align-items:center;${nw?'flex-wrap:wrap;gap:3px 6px':'gap:6px'}">${XH.featDay?'<span class="x-offer" style="padding:3px 8px;border-radius:999px;background:#c0301f;color:#fff;font-size:11px;font-weight:900;letter-spacing:1px">OFERTA</span>':'<span class="x-offer" style="padding:3px 8px;border-radius:999px;background:#33271d;border:1px solid #ffc94a;color:#ffc94a;font-size:11px;font-weight:900;letter-spacing:1px">DESTAQUE</span>'}<span style="font-size:11px;font-weight:900;color:#c9b9a2">${fw?'Skin de arma':'Skin de herói'}</span></div>
          <span class="lil" style="font-size:${nw?19:23}px;line-height:1.05;text-shadow:0 2px 0 #000${nw?';overflow-wrap:anywhere':''}">${esc2(feat.n)}</span>
          <span style="align-self:flex-start;padding:2px 8px;border-radius:6px;border:1px solid ${RC[feat.r]};color:${RC[feat.r]};font-size:12px;font-weight:900;white-space:${nw?'normal;line-height:1.15':'nowrap'}">${RN(feat.r)} · ${ERAS[feat.e].n}</span>
          <div style="display:flex;align-items:center;${nw?'flex-wrap:wrap;gap:0 5px;line-height:1.1':'gap:6px'};margin-top:2px;color:#c9b9a2;font-size:12px;font-weight:800"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="flex:none"><circle cx="12" cy="13" r="8"></circle><polyline points="12 9 12 13 15 15"></polyline><line x1="9" y1="2" x2="15" y2="2"></line></svg>
            ${nw?'<span style="white-space:nowrap">':''}${XH.featDay?'Termina em':'Troca em'}${nw?'</span>':''} <span class="x-tick lil" id="xh_cd" aria-live="off" style="font-size:${nw?'16px;white-space:nowrap':'18px'}">${midnightLeft()}</span></div>
          <div style="flex:1"></div>
          ${fs.buy?`<button class="x-gold x-cta lil" data-x="skin" data-id="${feat.id}" style="height:46px;border-radius:14px;font-size:18px;display:flex;align-items:center;justify-content:center;gap:6px;padding:0">Ver ${GEM_I(24)}${SKIN_PRICE[feat.r]}</button>`
            :`<button data-x="skin" data-id="${feat.id}" class="lil" style="height:46px;border-radius:14px;border:2px solid #5fd068;background:#12261a;color:#c8f5cb;font-size:17px;padding:0">Na coleção · ver</button>`}
        </div></div>
      `:list.length?`<div role="status" style="flex:none;padding:16px 12px;border-radius:14px;border:2px dashed #4a3a2b;color:#c9b9a2;font-size:15px;font-weight:900;text-align:center">Novas skins em breve</div>`:'')+(list.length?`<div style="height:${rows*150+(rows-1)*8}px;flex:none;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(${rows},150px);gap:8px">${tiles}</div>`
        :`<div role="status" style="flex:none;padding:30px 12px;border-radius:14px;border:2px dashed #4a3a2b;color:#c9b9a2;font-size:15px;font-weight:900;text-align:center">Novas skins em breve</div>`)+`
      <div style="flex:none;margin-top:auto">${xPager('pg',pg,pages,owned+' na coleção')}</div>`;
  } else if(tab==='gem'){
    const vOn=Sys.vip.active(S), small=!d.real&&H<640, vLv=Math.max(1,Sys.vip.level?Sys.vip.level(S):1), VI=Sys.vip.levelInfo(vLv), V0=Sys.vip.levelInfo(0);
    /* cartão do VIP: linha do nível atual (ou do VIP 1, o que a compra dá primeiro), pelo Sys.vip.levelInfo; benefício que vale 0 não aparece */
    const vTxt=[VI.atkPct?'+'+VI.atkPct+'% ATK e HP':'',VI.goldXpPct?'+'+VI.goldXpPct+'% XP e ouro':'',VI.offlineMult>1?'offline x'+VI.offlineMult:'',VI.chestPerDay>V0.chestPerDay?'+'+(VI.chestPerDay-V0.chestPerDay)+' baús por dia':'',VI.keys?'+'+VI.keys+' chave'+(VI.keys>1?'s':''):'',VI.speedTier>=1?'velocidade x2 liberada':''].filter(Boolean).join(', ');
    const bundles=['Punhado de gemas','Saco de gemas','Baú de gemas','Tesouro de gemas'].map((n,i)=>`<button class="x-tile" data-x="iap" aria-label="${n}: pagamento em breve" style="border-radius:14px;border:2px solid ${i===3?'#ffc94a':'#4aa3ff'};background:linear-gradient(180deg,#2b3a52 0%,#1d1611 70%);color:#f6ecdf;padding:${small?4:8}px;display:flex;flex-direction:column;align-items:center;gap:${small?1:4}px">
        ${i===3?'<span class="x-tshine"></span>':''}<div class="x-bob" style="height:${small?30:46}px;display:flex;align-items:flex-end;justify-content:center;animation-duration:2.6s">${Array.from({length:i+1},()=>`<img src="assets/ui/gem.png" alt="" style="width:${(small?20:30)+i*4}px;height:${(small?20:30)+i*4}px;object-fit:contain;margin:0 -6px">`).join('')}</div>
        <span style="font-size:13px;font-weight:900">${n}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">compra com dinheiro real</span>
        <span class="x-gold lil" style="height:28px;min-width:96px;border-radius:10px;font-size:15px;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 #8a4f0c">Em breve</span></button>`).join('');
    let mc=null; try{ mc=typeof shMechaCard==='function'?shMechaCard():null; }catch(e){ mc=null; } XH.mc=mc;
    if(mc&&xGate(['assets/mounts/new/war_mecha_ref_prev.png'])) return;
    body=(mc&&mc.html?`<div style="flex:none">${mc.html}</div>`:'')+`<div class="x-feat" style="flex:none;display:flex;flex-direction:column;gap:8px">
        <span class="lil" style="font-size:17px">Comprar gemas</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(2,${small?104:132}px);gap:8px">${bundles}</div>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2;text-align:center;margin-top:${small?0:6}px;line-height:1.35">Só pacotes de gemas, compra direta: você vê quanto recebe antes de pagar. Nada de sorteio pago. Pagamento em breve.</span>
        <button data-x="vip" aria-label="Clube VIP${vOn?', nível '+vLv+', ativo':''}: ${esc2(vTxt)}" style="min-height:60px;border-radius:14px;border:2px solid #ffc94a;background:linear-gradient(90deg,#4a3214,#241a12);color:#f6ecdf;padding:4px 12px;display:flex;align-items:center;gap:10px;box-sizing:border-box;text-align:left">
          <svg width="30" height="24" viewBox="0 0 24 18" fill="#ffc94a" aria-hidden="true" style="flex:none"><path d="M2 16 L4 4 L9 9 L12 1 L15 9 L20 4 L22 16 Z"></path></svg>
          <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2"><span class="lil" style="font-size:17px;color:#ffc94a">Clube VIP${vOn?' · VIP '+vLv+' ativo':''}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">${vTxt}</span></span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>`;
  } else if(tab==='col'){   // COLEÇÃO: a tela de Skins que já existia (prévia animada + por era), movida para dentro da Loja sem refazer o conteúdo
    body='<div id="xh_col" style="flex:1;min-height:0;position:relative;font-family:system-ui,Segoe UI,Roboto,sans-serif;font-size:15px"></div>';
  } else {   // itens do dia, em ouro
    const offers=S.shop.offers, pages=Math.max(1,Math.ceil(offers.length/(PER*(rows===2?1:1)))), per=rows*3; XH.page.item=Math.max(0,Math.min(XH.page.item,Math.ceil(offers.length/per)-1)); const pg=XH.page.item; XH.pages=Math.max(1,Math.ceil(offers.length/per));
    /* cartão de item: moldura da raridade (xRar), nome na cor; borda de 2 para 3 px e respiro 1 px menor (miolo igual); comprado = sem pulso */
    const tiles=offers.map((o,i)=>{ if(i<pg*per||i>=pg*per+per) return ''; const it=shopItem(o), c=RC[o.r], q=xRar(o.r,o.sold?'xr-s':'');
      return `<button class="x-tile ${q.on?'':o.r>=3&&!o.sold?'x-r'+o.r:''}${q.cls}" data-x="offer" data-i="${i}"${q.at} aria-label="${esc2(iname(it))}, ${RN(o.r)}, ${SLOT[o.slot].n}, ${o.sold?'comprado':o.price+' moedas'}" style="border-radius:14px;${q.on?'':`border:2px solid ${c};background:linear-gradient(180deg,${RT[o.r]} 0%,#1d1611 60%);`}color:#f6ecdf;padding:${q.on?'5px 4px':'6px 5px'};display:flex;flex-direction:column;align-items:center;gap:2px;opacity:${o.sold?.6:1}">
        ${o.r>=2&&!o.sold?'<span class="x-tshine"></span>':''}<span style="font-size:11px;font-weight:900;color:${c}">${RN(o.r)}</span>${itemIcon(it,44)}
        <span style="font-size:11px;font-weight:900;line-height:1.1;text-align:center;height:24px;display:flex;align-items:center${q.on?';color:'+q.t:''}">${esc2(iname(it))}</span>
        <span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">${SLOT[o.slot].n} · ${ERAS[o.e].n.replace('Era da ','').replace('Era ','')}</span>
        <span style="display:flex;flex-direction:column;align-items:center;gap:1px;flex:1;min-height:0;overflow:hidden">${itemLines(it).map(t=>`<span style="font-size:10px;font-weight:800;color:#e8dccb;line-height:1.15;white-space:nowrap">${t}</span>`).join('')}</span>
        ${o.sold?'<span style="height:24px;padding:0 8px;border-radius:999px;background:#5fd068;color:#0d2410;font-size:11px;font-weight:900;display:flex;align-items:center;flex:none">Comprado</span>'
          :`<span style="height:24px;padding:0 8px 0 4px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;font-size:12px;font-weight:900;display:flex;align-items:center;gap:3px;flex:none;color:${S.gold>=o.price?'#f6ecdf':'#ff8a7a'}">${COIN_I(16)}${kf(o.price)}</span>`}</button>`; }).join('');
    body=`<div class="x-feat" style="height:40px;flex:none;display:flex;align-items:center;gap:8px">
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span class="lil" style="font-size:17px">Estoque do dia</span>
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">Compra direta: você vê o item inteiro.</span></span>
        <span style="flex:none;display:flex;align-items:center;gap:4px;padding:4px 8px;border-radius:10px;background:#0e0a07;border:1px solid #4a3a2b;font-size:11px;font-weight:800;color:#c9b9a2">Repõe em <span id="xh_cd" class="x-tick lil" style="font-size:15px">${midnightLeft()}</span></span></div>
      <div style="height:${rows*196+(rows-1)*8}px;flex:none;display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(${rows},196px);gap:8px">${tiles}</div>
      ${XH.pages>1?xPager('pg',pg,XH.pages):''}`;
  }
  V.innerHTML=xWrap(d,XH.anim?'x-in':'',`<div class="x-scroll" style="flex:1;position:relative;display:flex;flex-direction:column;gap:8px;padding:8px 12px 10px;box-sizing:border-box;background:radial-gradient(120% 60% at 50% 0%,#2a1f16 0%,#16110d 70%);min-height:0">
      <div style="height:44px;flex:none;display:flex;gap:6px">
        <div class="x-rulep ${XH.anim?'x-rule':''}" role="note" style="flex:1;min-width:0;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:10px;background:#12261a;border:1px solid #2f6b36;color:#c8f5cb;font-size:11px;font-weight:900;line-height:1.2;box-sizing:border-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="8.5 12 11 14.5 15.5 9.5"></polyline></svg>
        <span>${gemOk?'':'Itens do dia: compra direta em ouro, sem sorteio. Você vê o item inteiro antes de pagar.</span><span hidden>'}Skins dão bônus: +${SK.equippedPct[0]}% a +${SK.equippedPct[SK.equippedPct.length-1]}% de ATK e HP pela raridade, e cada skin da coleção soma +${String(SK.collectionPer).replace('.',',')}%</span></div>
        <button data-x="vip" class="x-gold x-cta" aria-label="Clube VIP" style="width:64px;flex:none;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;padding:0"><svg width="20" height="16" viewBox="0 0 24 18" fill="currentColor" aria-hidden="true"><path d="M2 16 L4 4 L9 9 L12 1 L15 9 L20 4 L22 16 Z"></path></svg><span class="lil" style="font-size:16px">VIP</span></button></div>
      <div role="tablist" aria-label="Seções da loja" style="height:44px;flex:none;display:${gemOk?'flex':'none'};gap:4px">${tb('hero','Skins<br>herói',1)}${tb('weapon','Skins<br>arma',1)}${SHOP_ITEMS_TAB?tb('item','Itens<br>(ouro)',1.1,'<img src="assets/ui/coin.png" alt="" style="width:20px;height:20px;object-fit:contain">'):''}${tb('gem','Gemas',0.9,'<img src="assets/ui/gem.png" alt="" style="width:20px;height:20px;object-fit:contain">')}${PANEL_V2.shopCol?tb('col','Coleção',0.9):''}</div>
      ${body}<div id="xh_toast"></div></div>${XH.sel?hPreview():''}${XH.cf?hConfirm():''}`);
  XH.anim=false;
  if(tab==='col'){ const el=document.getElementById('xh_col'); if(el) renderSkins(el,Math.max(300,H-112)); }
}
function shopItem(o){ const it={id:'shop'+o.slot+o.r+o.e,slot:o.slot,r:o.r,e:o.e,lvl:1,gold:0,subs:Array.isArray(o.subs)?o.subs:[]}; if(!Array.isArray(o.subs)){ Sys.stats.ensureSubs(it); o.subs=it.subs; } return it; }
function hPreview(){ const sk=SKIN(XH.sel); if(!sk){ XH.sel=null; return ''; } const st=hStatus(sk), off=(st.eq||st.own)?xOutfitNote(sk.id):'', c=RC[sk.r], q=xRar(sk.r,'xr-s'), hero=sk.slot==='armor'?sk:SKIN(S.skinEq.armor), weap=sk.slot==='weapon'?sk:SKIN(S.skinEq.weapon), SK=Sys.skin.DATA;
  const passLv=xPassSkin()?Object.keys(PASS_SKIN_AT).find(k=>PASS_SKIN_AT[k]===sk.id):null;
  return `<div class="x-scrim" style="position:absolute;inset:0;z-index:20;background:rgba(8,6,4,.82);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box">
    <div class="${XH.popIn?'x-pop':''}${q.cls}"${q.at} role="dialog" aria-label="Prévia: ${esc2(sk.n)}" style="width:358px;max-height:100%;border-radius:20px;${q.on?'':`border:3px solid ${c};`}background:#1d1611;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 0 30px ${c}88">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 10px 6px 16px;flex:none"><div style="flex:1;display:flex;flex-direction:column;min-width:0"><span class="lil" style="font-size:24px;line-height:1.1${q.on?';color:'+q.t:''}">${esc2(sk.n)}</span>
          <span style="font-size:13px;font-weight:900;color:${c}">${RN(sk.r)} · <span style="color:#c9b9a2">${sk.slot==='armor'?'Skin de herói':'Skin de arma'} · ${ERAS[sk.e].n}</span></span></div>
        <button data-x="pvclose" aria-label="Fechar prévia" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;display:flex;align-items:center;justify-content:center;padding:0">${SVG_X}</button></div>
      <div style="position:relative;height:300px;flex:0 1 300px;min-height:180px;margin:0 10px;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 50% 55%,${RT[sk.r]} 0%,#120d0a 70%)">
        <div class="x-srays" style="width:420px;height:420px;margin:-210px 0 0 -210px"></div><div class="x-sped" style="left:89px;bottom:25px;width:160px;height:24px"></div>
        <div style="position:absolute;left:49px;bottom:16px;width:240px;height:240px">${skinArt(hero,240,1)}
          <span style="position:absolute;left:188px;top:-22px;width:76px;height:76px;border-radius:14px;border:2px solid ${c};background:rgba(18,13,10,.88);box-shadow:0 0 14px ${c}88;display:flex;align-items:center;justify-content:center"><img src="assets/weapons/era${weap.e}_t${tierOf(weap.r)}.png" alt="Arma da skin" style="width:62px;height:62px;object-fit:contain"></span></div>
        <span class="x-tw" style="left:40px;top:60px"></span><span class="x-tw" style="left:290px;top:90px;animation-delay:.8s"></span><span class="x-tw" style="left:70px;top:230px;animation-delay:1.4s"></span>${XH.burst?'<span class="x-burst"></span>':''}</div>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 12px 0;padding:8px 10px;border-radius:10px;background:#12261a;border:1px solid #2f6b36;color:#c8f5cb;font-size:12px;font-weight:800;flex:none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        Equipada: +${SK.equippedPct[sk.r]}% de ATK e HP. Na coleção: +${String(SK.collectionPer).replace('.',',')}% por skin (teto +${SK.collectionCap}%).</div>
      <div style="display:flex;gap:8px;padding:12px 12px 18px;flex:none">
        ${st.buy?`<button class="x-gold x-cta lil" data-x="askbuy" style="flex:1;height:54px;border-radius:16px;font-size:22px;display:flex;align-items:center;justify-content:center;gap:8px;padding:0">Comprar ${GEM_I(28)}${SKIN_PRICE[sk.r]}</button>`
        :off?`<div class="lil" role="status" style="flex:1;height:54px;border-radius:16px;border:2px solid #4a3a2b;background:#2a211a;color:#e8dccb;font-size:18px;display:flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box">Na coleção · ${esc2(off)}</div>`   /* roupa-skin inativa: sem botão de equipar */
        :st.own?'<button class="x-green lil" data-x="skequip" style="flex:1;height:54px;border-radius:16px;font-size:22px;padding:0">Equipar</button>'
        :st.eq?'<div class="lil" style="flex:1;height:54px;border-radius:16px;border:2px solid #5fd068;background:#12261a;color:#c8f5cb;font-size:20px;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg>Equipada</div>'
        :st.locked?`<div style="flex:1;height:54px;border-radius:16px;border:2px solid #4a3a2b;background:#2a211a;color:#e8dccb;font-size:15px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box">${SVG_LOCK(20)}Libera na ${ERAS[sk.e].n}</div>`
        :!passLv?''   /* o passe não entrega mais esta skin: sem botão */
        :`<button data-x="gopass" class="x-gold lil" style="flex:1;height:54px;border-radius:16px;font-size:19px;display:flex;align-items:center;justify-content:center;gap:6px"><img src="assets/ui/pass.png" alt="" style="width:30px;height:30px;object-fit:contain">Ganhe no Passe · Nv. ${passLv||''}</button>`}
      </div></div></div>`; }
function hConfirm(){ const cf=XH.cf; let name='', cost=0, have=0, coin=false, lines='', rr=0, box='';   /* rr = raridade (nome na cor); box = o item na moldura da raridade (só com PANEL_V2.rar) */
  if(cf.kind==='skin'){ const sk=SKIN(cf.id); name=sk.n+' ('+RN(sk.r)+')'; cost=SKIN_PRICE[sk.r]; have=S.gems; rr=sk.r; }
  else { const o=S.shop.offers[cf.i], it=shopItem(o); name=iname(it)+' ('+RN(o.r)+' · '+SLOT[o.slot].n+')'; cost=o.price; have=S.gold; coin=true; lines=itemLines(it).join(' · '); rr=o.r; box=xRarBox(o.r,itemIcon(it,40),58,'align-self:center;'); }
  const ok=have>=cost, ic=coin?COIN_I(20):GEM_I(20), unit=coin?'moedas':'gemas';
  return `<div class="x-scrim" style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.7);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
    <div class="x-pop" role="alertdialog" aria-label="Confirmar compra" style="width:320px;border-radius:18px;border:3px solid #ffc94a;background:#241b14;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.7)">
      <span class="lil" style="font-size:22px;text-align:center">Confirmar compra</span>${box}<span style="font-size:15px;font-weight:900;text-align:center">${xRarName(rr,name)}</span>
      <div style="display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;font-size:14px;font-weight:800">
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c9b9a2">Preço</span><span style="display:flex;align-items:center;gap:4px;font-weight:900">${ic}${coin?gNum(cost):cost}</span></div>
        <div style="display:flex;justify-content:space-between;align-items:center"><span style="color:#c9b9a2">${coin?'Seu ouro':'Suas gemas'}</span><span style="font-weight:900">${coin?kf(have):have} → <span style="color:${ok?'#c8f5cb':'#ff8a7a'}">${coin?kf(Math.max(0,have-cost)):have-cost}</span></span></div>${coin?`<span style="font-size:12px;color:#c9b9a2">${lines}</span><span style="font-size:12px;color:#c9b9a2">Vai direto para a mochila. Sem sorteio.</span>`:''}</div>
      ${ok?'':`<span role="alert" style="font-size:14px;font-weight:900;color:#ff8a7a;text-align:center">Faltam ${coin?kf(cost-have):cost-have} ${unit}</span>`}
      <div style="display:flex;gap:8px"><button data-x="cfno" class="lil" style="flex:1;height:50px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:18px;padding:0">Cancelar</button>
        ${ok?'<button class="x-gold lil" data-x="cfyes" style="flex:1.3;height:50px;border-radius:14px;font-size:18px;padding:0">Confirmar</button>':coin?'':'<button class="x-green lil" data-x="gogems" style="flex:1.3;height:50px;border-radius:14px;font-size:18px;padding:0">Ver gemas</button>'}</div></div></div>`; }
function hClick(b){ const a=b.dataset.x;
  if(typeof pWaitClick==='function'&&pWaitClick(b)) return;   /* botões do esqueleto de espera (Tentar de novo / Continuar assim) */
  if(XH.tab==='gem'&&XH.mc&&typeof XH.mc.click==='function'){ let done=false; try{ done=XH.mc.click(b)===true; }catch(e){} if(done) return; }   /* cartão do Mecha */
  if(a==='tab'){ if(b.dataset.t!=='item'&&!xUnlocked('gemShop')) return; snd('ui_tap'); XH.tab=b.dataset.t; XH.anim=true; render(); }
  else if(a==='pg'){ const k=XH.tab, p=XH.page[k]+(+b.dataset.d); if(p>=0&&p<(XH.pages||1)){ snd('ui_tap'); XH.page[k]=p; XH.anim=true; render(); } }
  else if(a==='skin'){ snd('ui_tap'); XH.sel=b.dataset.id; XH.cf=null; XH.burst=false; XH.popIn=true; render(); XH.popIn=false; }
  else if(a==='pvclose'){ snd('ui_tap'); XH.sel=null; XH.cf=null; render(); }
  else if(a==='askbuy'){ snd('ui_tap'); if(!xCanSell(XH.sel)){ hToast('Novas skins em breve'); return; } XH.cf={kind:'skin',id:XH.sel}; render(); }
  else if(a==='offer'){ const o=S.shop.offers[+b.dataset.i]; snd('ui_tap'); if(!o||o.sold){ hToast('Já comprado hoje. Repõe à meia-noite'); return; } if(S.gold<o.price){ hToast(needMsg('gold',o.price)); return; } XH.cf={kind:'item',i:+b.dataset.i}; render(); }
  else if(a==='cfno'){ snd('ui_tap'); XH.cf=null; render(); }
  else if(a==='gogems'){ snd('ui_tap'); XH.sel=null; XH.cf=null; XH.tab='gem'; XH.anim=true; render(); }
  else if(a==='gopass'){ snd('ui_tap'); if(!xUnlocked('pass')){ hToast('Skin do Passe da temporada'); return; } XH.sel=null; setView('pass'); }
  else if(a==='vip'){ snd('ui_tap'); if(typeof scrVip==='function'&&window.Screens) Screens.open('vip'); else hToast('Clube VIP: em breve'); }   /* tela 18 (VIP): entra no item 3 */
  else if(a==='iap'){ snd('ui_tap'); hToast('Pagamento em breve: nada é cobrado agora'); }
  else if(a==='skequip'){ const sk=SKIN(XH.sel); if(!sk||!S.skins.includes(sk.id)) return; if(xOutfitNote(sk.id)){ hToast(xOutfitNote(sk.id)); return; } S.skinEq[sk.slot]=sk.id; pvSkin[sk.slot]=null; preloadAssets(); statsChanged(); snd('upgrade'); render(); hToast('Equipada: '+sk.n+' · FC '+fcTxt(heroFC())); }
  else if(a==='cfyes'){ const cf=XH.cf; if(!cf) return;
    if(cf.kind==='skin'){ const sk=SKIN(cf.id), p=SKIN_PRICE[sk.r]; if(S.skins.includes(sk.id)||S.gems<p||!xCanSell(sk.id)) return; S.gems-=p; S.skins.push(sk.id); XH.cf=null; XH.burst=true; statsChanged(); snd('gem'); render(); XH.burst=false; hToast('Skin desbloqueada: '+sk.n); }
    else { const o=S.shop.offers[cf.i]; if(!o||o.sold||S.gold<o.price) return; if(S.inv.length>=xBagMax()){ XH.cf=null; render(); hToast('Mochila cheia: desmonte itens em Equip.'); return; }
      S.gold-=o.price; o.sold=true; XH.cf=null; const was=PULLING; PULLING=[]; let got; try{ addItemToBag({slot:o.slot,r:o.r,e:o.e,subs:o.subs,origin:'shop'}); got=PULLING[0]; }finally{ PULLING=was; }
      statsChanged(); snd('coin'); render(); hToast(got&&got.eq?'Comprado e equipado: '+got.name:'Comprado: '+(got?got.name:'item')+' (na mochila)'); } }
}

/* ---------- toques das três telas ---------- */
V.addEventListener('click',ev=>{ if(!FULL_VIEWS[view]) return; const b=ev.target.closest('[data-x]'); if(!b||!V.contains(b)) return;
  if(b.dataset.x==='xback'){ if(view==='gear'&&(XG.fly||XG.drag)) return; snd('ui_tap'); if(view==='summon'&&XS.phase!=='idle'){ sClear(); XS.phase='idle'; XS.res=[]; XS.shown=0; } Screens.close(); return; }   /* VOLTAR do contorno comum */
  if(view==='gear') gClick(b); else if(view==='summon') sClick(b); else if(view==='pass') pClick(b); else if(view==='prog') rClick(b); else if(view==='shop') hClick(b);
  else { const pd=window.Panels&&Panels.cur(); if(pd&&pd.click) pd.click(b,ev); } });
if(PANEL_V2.frame) document.body.classList.add('xframe');
addEventListener('resize',()=>{ if(FULL_VIEWS[view]) softRender(); });

/* ---------- arquivos novos dos painéis (agente B): carregados daqui para não mexer no index.html ---------- */
(function(){ const v=(typeof DEBUG!=='undefined'&&DEBUG)?Date.now():(typeof VERSION!=='undefined'?VERSION:'');
  for(const n of ['avatar','equipfx','panels','p_wait','p_forge','p_fuse','p_cfg','p_vip','p_era','p_tower','p_pets','p_rank','p_inst','p_mounts','p_missions','p_arena','p_events','p_tourney','p_map','p_profile','p_pass','p_guide','p_guild','p_codex','p_mail','p_chat','p_intro','p_offer','p_auction','p_look','p_colecao','p_shopmecha']){   /* telas novas (js/p_*.js) entram nesta lista quando estiverem escritas */ const src='js/'+n+'.js?v='+v;
    if(document.readyState==='loading') document.write('<script src="'+src+'"><\/script>');
    else { const el=document.createElement('script'); el.src=src; el.async=false; document.head.appendChild(el); } } })();
