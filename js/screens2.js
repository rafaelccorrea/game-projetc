'use strict';
/* ================= TELAS APROVADAS NO CANVAS (rodada 9): 10 VITÓRIA/DERROTA DO CHEFE · 08 PASSE · 16 PRÁTICAS E TÍTULOS =================
   Cada tela é um PAINEL INDEPENDENTE: abre e fecha por Screens.open(nome, opções) / Screens.close() (index.html) e tem o próprio botão de sair;
   a barra de abas só chama essa função. Nenhuma conta aqui: passe e missões = Sys.pass; práticas = Sys.practice; títulos = Sys.titles;
   atributos e FC = Sys.fc (os módulos expõem bonus(S) e o Sys.fc soma sozinho); saque do chefe = o que o Sys.loot.onKill devolveu.
   Depende de index.html (S, RAR, ERAS, SKIN, ICON, SLOT, iname, heroFC, recFC, statsChanged, ptrack...), js/screens.js (xDims, xWrap, RC, RN, kf,
   gNum, esc2, SVG_LOCK, gClick, XG) e js/battle.js (B, GY, LW, cv, startBattle, challengeBoss). */
const f1c=v=>(Math.round(v*100)/100).toString().replace('.',',');
const Y_CHK=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'#5fd068'}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg>`;
const Y_CLOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8"></circle><polyline points="12 9 12 13 15 15"></polyline></svg>';
const Y_BACK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>';
const Y_FWD='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg>';
const Y_X='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18"></line><line x1="18" y1="6" x2="6" y2="18"></line></svg>';
const Y_MEDAL=(w,h,star)=>`<svg class="y-medal" width="${w}" height="${h}" viewBox="0 0 24 28" fill="none" stroke-linejoin="round" aria-hidden="true"><path d="M7 1h10l-3 8h-4z" fill="#ff5a4e" stroke="#16110d" stroke-width="1.2"></path><circle cx="12" cy="17" r="8" fill="#ffc94a" stroke="#8a4f0c" stroke-width="1.6"></circle>${star?'<path d="M12 12.5l1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4z" fill="#fff3c4"></path>':''}</svg>`;
const Y_EGG=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="13" rx="7.5" ry="9.5" fill="${c}" stroke="#2a1f16" stroke-width="1.6"></ellipse><path d="M6 12l3 2 3-3 3 3 3-2" fill="none" stroke="#2a1f16" stroke-width="1.4" stroke-linejoin="round"></path><ellipse cx="9.4" cy="8.6" rx="1.8" ry="2.6" fill="#fff" opacity=".55"></ellipse></svg>`;
const Y_ORB=s=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="#5fd068" opacity=".35"></circle><circle cx="12" cy="12" r="6" fill="#9be89f"></circle><circle cx="10" cy="10" r="2.2" fill="#fff"></circle></svg>`;
const Y_STONE=s=>`<svg class="y-stone" width="${s}" height="${s}" viewBox="0 0 24 24" fill="#8fc7ff" stroke="#2a4a6a" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l4-5h5l4 5-3 10H9z"></path><path d="M6 9h13M10 4l-1 5 3 10M15 4l1 5-4 10" fill="none"></path></svg>`;

(function(){ const st=document.createElement('style'); st.textContent=`
.y-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.y-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.y-cta{animation:ycta 1.6s ease-in-out infinite}
@keyframes ycta{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 8px rgba(255,201,74,.3)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 24px rgba(255,201,74,.9)}}
.y-pulse{animation:ypu 1.4s ease-in-out infinite}
@keyframes ypu{0%,100%{transform:scale(1);box-shadow:0 6px 0 #8a4f0c,0 0 16px rgba(255,184,74,.4)}50%{transform:scale(1.04);box-shadow:0 6px 0 #8a4f0c,0 0 36px rgba(255,184,74,.95)}}
.y-pop{animation:ypop .32s cubic-bezier(.2,1.4,.4,1) both}
@keyframes ypop{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}
.y-veil{animation:yfade .2s ease-out both}
@keyframes yfade{from{opacity:0}to{opacity:1}}
.y-toast{animation:ytoast 2.2s ease-in-out both}
@keyframes ytoast{0%{opacity:0;transform:translateY(16px)}12%,82%{opacity:1;transform:none}100%{opacity:0}}
.y-medal{animation:yswing 2.8s ease-in-out infinite;transform-origin:50% 10%}
@keyframes yswing{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
.y-stone{animation:ytw 2.6s ease-in-out infinite}
@keyframes ytw{0%,100%{filter:drop-shadow(0 0 0 rgba(150,210,255,0))}50%{filter:drop-shadow(0 0 6px rgba(150,210,255,.95))}}
.y-spin{animation:yspin 12s linear infinite}
@keyframes yspin{to{transform:rotate(360deg)}}
.y-bob{animation:ybo 1.6s ease-in-out infinite}
@keyframes ybo{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
.y-flip{animation:ysc 1.8s ease-in-out infinite}
@keyframes ysc{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}
.y-fly{position:absolute;width:40px;height:40px;z-index:70;pointer-events:none;object-fit:contain;animation:yfly 1s cubic-bezier(.5,0,.6,1) both}
@keyframes yfly{0%{transform:translate(0,0) scale(.6);opacity:0}15%{transform:translate(0,-30px) scale(1.4);opacity:1}85%{opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.45);opacity:0}}
.y-bump{animation:ybump .45s ease-out}
@keyframes ybump{0%{transform:scale(1)}40%{transform:scale(1.25)}100%{transform:scale(1)}}
/* ---- 08 Passe ---- */
.p-in .p-hdr{animation:ypanel .5s ease-out both}
@keyframes ypanel{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:none}}
.p-aura{position:absolute;left:50%;top:50%;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.32) 0deg 10deg,transparent 10deg 30deg);-webkit-mask-image:radial-gradient(circle,#000 18%,transparent 68%);mask-image:radial-gradient(circle,#000 18%,transparent 68%);animation:yspin 12s linear infinite}
.p-ped{position:absolute;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#6b5236 0%,#3a2c1f 60%,#1d1611 100%);border:2px solid #ffc94a;box-shadow:0 0 12px rgba(255,201,74,.5),inset 0 -3px 0 rgba(0,0,0,.4)}
.p-glow{animation:pglow 2.4s ease-in-out infinite}
@keyframes pglow{0%,100%{filter:drop-shadow(0 0 4px rgba(255,201,74,.45))}50%{filter:drop-shadow(0 0 14px rgba(255,201,74,1))}}
.p-pxp{background:linear-gradient(90deg,#6a3cff,#b07cff 60%,#7fe3ff)}
.p-fill{position:relative;overflow:hidden;transition:width .5s cubic-bezier(.2,.8,.2,1)}
.p-in .p-fill{animation:pfill 1.4s .2s cubic-bezier(.2,.8,.2,1) both}
@keyframes pfill{from{width:0}}
.p-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.55) 50%,transparent 70%);background-size:220% 100%;animation:pshine 2.2s linear infinite}
@keyframes pshine{from{background-position:160% 0}to{background-position:-60% 0}}
.p-in .p-row,.p-in .p-mrow{animation:prow .35s ease-out both}
.p-in .p-row:nth-child(2),.p-in .p-mrow:nth-child(2){animation-delay:.05s}.p-in .p-row:nth-child(3),.p-in .p-mrow:nth-child(3){animation-delay:.1s}.p-in .p-row:nth-child(4),.p-in .p-mrow:nth-child(4){animation-delay:.15s}.p-in .p-row:nth-child(5){animation-delay:.2s}
@keyframes prow{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
.p-can{animation:pcan 1.3s ease-in-out infinite}
@keyframes pcan{0%,100%{box-shadow:0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 0 16px rgba(255,201,74,.85)}}
.p-pill{animation:ppill 1.3s ease-in-out infinite}
@keyframes ppill{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.p-card{transition:transform .12s}.p-card:active{transform:scale(.96)}
.p-cur{position:absolute;inset:-6px;border-radius:50%;border:3px solid #ffc94a;animation:pring 1.6s ease-out infinite;pointer-events:none}
@keyframes pring{from{transform:scale(.8);opacity:1}to{transform:scale(1.35);opacity:0}}
.p-prem{background:linear-gradient(180deg,#d6b3ff,#8a4dff);color:#1a0b33!important;box-shadow:0 6px 0 #4a1f9a;border:0}
.p-prem:active{transform:translateY(4px);box-shadow:0 2px 0 #4a1f9a}
.p-premsh{position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.5) 50%,transparent 65%);background-size:260% 100%;animation:pshine 2.8s ease-in-out infinite;pointer-events:none}
.p-slot{position:relative;width:40px;height:40px;flex:none;border-radius:10px;border:2px solid;box-sizing:border-box;display:flex;align-items:center;justify-content:center}
.p-rglow{animation:prglow 1.8s ease-in-out infinite}
@keyframes prglow{0%,100%{box-shadow:0 0 3px var(--rc)}50%{box-shadow:0 0 12px var(--rc)}}
/* trilha contínua (PANEL_V2.passScroll): a lista rola sozinha, a legenda fica presa no topo dela, os níveis futuros ficam apagados. Sem scroll-behavior:smooth:
   a tela redesenha inteira a cada toque e devolve o scrollTop na hora (com rolagem suave a lista "andaria" a cada resgate). */
.p-trail{flex:1;min-height:0;position:relative;margin:0 -12px;padding:0 12px;-webkit-mask-image:linear-gradient(180deg,#000 calc(100% - 18px),transparent);mask-image:linear-gradient(180deg,#000 calc(100% - 18px),transparent)}
.p-thd{position:sticky;top:0;z-index:4;margin:0 -12px;padding:0 12px;background:rgba(27,21,34,.94);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border-bottom:1px solid rgba(176,124,255,.28);box-shadow:0 6px 12px rgba(0,0,0,.35)}
.p-row.p-fut{filter:saturate(.45) brightness(.62)}
.p-curn{animation:pcurn 1.6s ease-in-out infinite}
@keyframes pcurn{0%,100%{box-shadow:0 0 6px rgba(176,124,255,.6)}50%{box-shadow:0 0 18px rgba(176,124,255,1)}}
.p-nav{transition:transform .12s}.p-nav:active{transform:scale(.98)}
.p-lvup{animation:plvup .7s cubic-bezier(.2,1.5,.4,1)}
@keyframes plvup{0%{transform:scale(1)}35%{transform:scale(1.35);filter:brightness(1.6)}100%{transform:scale(1)}}
/* ---- 16 Práticas e Títulos ---- */
.r-in .r-pane{animation:rpane .35s ease both}
@keyframes rpane{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
.r-in .r-row{animation:rrow .4s ease both}
@keyframes rrow{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.r-bar{transition:width .6s cubic-bezier(.2,1.3,.4,1)}
.r-barf{position:relative;overflow:hidden}
.r-barf::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:rrun 2.2s linear infinite}
@keyframes rrun{from{background-position:-60% 0}to{background-position:160% 0}}
.r-rowup{animation:rrowup .8s ease-out both!important}
@keyframes rrowup{0%{box-shadow:0 0 0 rgba(95,208,104,0);border-color:#5fd068}30%{box-shadow:0 0 22px rgba(95,208,104,.8);border-color:#5fd068}100%{box-shadow:0 0 0 rgba(95,208,104,0)}}
.r-float{animation:rfloat 1s ease-out both;pointer-events:none}
@keyframes rfloat{0%{opacity:0;transform:translateY(6px) scale(.8)}20%{opacity:1;transform:translateY(0) scale(1.15)}100%{opacity:0;transform:translateY(-30px)}}
.r-popn{animation:rpopn .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes rpopn{from{transform:scale(1.6)}to{transform:none}}
.r-pulse{animation:rpulse 1.5s ease-in-out infinite}
@keyframes rpulse{0%,100%{box-shadow:0 5px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 5px 0 #8a4f0c,0 0 18px rgba(255,201,74,.85)}}
.r-won{position:relative;overflow:hidden}
.r-won::after{content:"";position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.28) 48%,transparent 62%);background-size:280% 100%;animation:rshine 3.4s ease-in-out infinite;pointer-events:none}
@keyframes rshine{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
.r-feat{animation:rfeat 1.8s ease-in-out infinite}
@keyframes rfeat{0%,100%{box-shadow:0 0 6px rgba(255,201,74,.35)}50%{box-shadow:0 0 20px rgba(255,201,74,.9)}}
.r-unlock{animation:runlock 1.4s ease-out both!important}
@keyframes runlock{0%{transform:scale(.7);filter:brightness(2.4)}30%{transform:scale(1.08);filter:brightness(1.6)}100%{transform:none;filter:none}}
.r-banner{animation:rban 2.6s ease-out both;pointer-events:none}
@keyframes rban{0%{transform:scale(1.8);opacity:0}12%{transform:scale(1);opacity:1}82%{opacity:1}100%{opacity:0;transform:translateY(-16px)}}
.r-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(255,201,74,.4) 0deg 9deg,rgba(255,201,74,0) 9deg 30deg);-webkit-mask:radial-gradient(circle,#000 25%,transparent 70%);mask:radial-gradient(circle,#000 25%,transparent 70%);animation:yspin 8s linear infinite}
.r-card:active,.r-tbtn:active{transform:scale(.96)}
.r-lockp{animation:rlockp 2s ease-in-out infinite}
@keyframes rlockp{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
/* ---- 10 Resultado do chefe (docs/proto/ResultadoChefe.dc.html, versão aprovada) ---- */
/* a tela cobre a batalha inteira: o HUD da batalha (z-index 30) some enquanto ela está aberta, como já acontece com os painéis em tela cheia */
body.resui #fbhud{visibility:hidden}body.resui #fbhud *,body.resui #fbhud *::after{animation-play-state:paused!important}
#res{position:absolute;inset:0;z-index:40;overflow:hidden;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
#res .rw{position:absolute;left:0;top:0;width:390px;transform-origin:0 0}
#res button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;color:inherit;margin:0}
#res .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
#res .q-veil{position:absolute;inset:0;pointer-events:none;animation:yfade .5s ease-out both}
#res .q-dark{position:absolute;inset:0;pointer-events:none;animation:yfade .8s ease-out both}
#res .q-fx{position:absolute;inset:0;pointer-events:none}
#res .q-lbox{position:absolute;left:0;right:0;height:46px;background:#000;animation:qlbox 1.7s ease-in-out both}
@keyframes qlbox{0%{transform:scaleY(0)}12%,80%{transform:scaleY(1)}100%{transform:scaleY(0)}}
#res .q-vign{position:absolute;inset:0;animation:qvign 1.7s ease-in-out both}
@keyframes qvign{0%{opacity:0}12%,80%{opacity:1}100%{opacity:0}}
#res .q-flash{position:absolute;inset:0;animation:qflash .9s ease-out both}
@keyframes qflash{0%{opacity:0}18%{opacity:1}100%{opacity:0}}
#res .q-glow{position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(255,224,122,.85),rgba(255,201,74,0) 65%);animation:qglw 1s ease-in-out infinite}
@keyframes qglw{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.15);opacity:1}}
#res .q-chin{transform-origin:50% 100%;animation:qchin .5s cubic-bezier(.2,1.6,.4,1) both,qwig .18s .55s ease-in-out infinite alternate}
@keyframes qchin{0%{transform:scale(0,.2);opacity:0}100%{transform:scale(1);opacity:1}}
@keyframes qwig{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
#res .q-chbo{transform-origin:50% 100%;animation:qchbo .5s ease-out both}
@keyframes qchbo{0%{transform:scale(1);opacity:1;filter:brightness(1)}35%{transform:scale(1.35,1.2);filter:brightness(2.6)}100%{transform:scale(1.7);opacity:0;filter:brightness(3)}}
#res .q-ring{position:absolute;border-radius:50%;border:6px solid #ffe07a;box-shadow:0 0 30px #ffc94a,inset 0 0 20px #ffc94a;animation:qring .7s ease-out both}
@keyframes qring{0%{transform:scale(.1);opacity:1}100%{transform:scale(2.2);opacity:0}}
#res .q-coin{position:absolute;width:24px;height:24px}
#res .q-cb{animation:qcb .8s cubic-bezier(.3,.6,.5,1) both}
@keyframes qcb{0%{transform:translate(calc(var(--dx) * -1),-26px) scale(.3);opacity:0}10%{opacity:1}45%{transform:translate(calc(var(--dx) * -.45),var(--h)) scale(1.1)}80%{transform:translate(0,0) scale(1)}89%{transform:translate(0,-10px)}100%{transform:translate(0,0)}}
#res .q-cf{animation:qcf .65s cubic-bezier(.55,0,.8,.4) both}
@keyframes qcf{0%{transform:translate(0,0) scale(1);opacity:1}85%{opacity:.5}100%{transform:translate(var(--tx),var(--ty)) scale(.75);opacity:0}}
#res .q-cspin{animation:qcspin .7s linear infinite}
@keyframes qcspin{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.25)}}
#res .q-bma{animation:qbma .25s ease-out}#res .q-bmb{animation:qbmb .25s ease-out}
@keyframes qbma{50%{transform:scale(1.18);box-shadow:0 0 18px rgba(255,201,74,.9)}}
@keyframes qbmb{50%{transform:scale(1.18);box-shadow:0 0 18px rgba(255,201,74,.9)}}
#res .q-rays{position:absolute;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.35) 0deg 8deg,transparent 8deg 24deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%);animation:yspin 14s linear infinite}
#res .q-title{animation:qtitle .8s cubic-bezier(.2,1.5,.4,1) both,qglowt 2s .8s ease-in-out infinite}
@keyframes qtitle{0%{transform:scale(2.6);opacity:0;letter-spacing:14px}100%{transform:none;opacity:1;letter-spacing:2px}}
@keyframes qglowt{0%,100%{text-shadow:0 5px 0 #6a3a08,0 0 10px rgba(255,201,74,.5)}50%{text-shadow:0 5px 0 #6a3a08,0 0 30px rgba(255,201,74,1),0 0 60px rgba(255,140,40,.7)}}
#res .q-sub{animation:qrise .5s .5s ease-out both}
@keyframes qrise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
#res .q-conf{position:absolute;top:-16px;width:8px;height:14px;border-radius:2px;animation:qcnf linear infinite;opacity:0}
@keyframes qcnf{0%{opacity:0;transform:translateY(0) rotate(0)}8%{opacity:1}100%{opacity:0;transform:translateY(700px) rotate(620deg)}}
#res .q-card{animation:qcard .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes qcard{0%{transform:translateX(70px) scale(.9);opacity:0}100%{transform:none;opacity:1}}
#res .q-cup{animation:qcup .5s cubic-bezier(.2,1.3,.4,1) both}
@keyframes qcup{0%{transform:translateY(40px) scale(.85);opacity:0}100%{transform:none;opacity:1}}
#res .q-myth{animation:qmy 1.4s ease-in-out infinite}
@keyframes qmy{0%,100%{box-shadow:0 0 10px var(--rc),inset 0 0 10px rgba(255,255,255,.08)}50%{box-shadow:0 0 28px var(--rc),inset 0 0 18px rgba(255,255,255,.18)}}
#res .q-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);background-size:250% 100%;animation:qsh 2.6s ease-in-out infinite;pointer-events:none}
@keyframes qsh{0%,40%{background-position:150% 0}100%{background-position:-60% 0}}
#res .q-wob{animation:qwob 1.6s ease-in-out infinite}
@keyframes qwob{0%,100%{transform:rotate(-8deg) scale(1)}50%{transform:rotate(8deg) scale(1.1)}}
#res .q-new{animation:qnew 1.1s ease-in-out infinite}
@keyframes qnew{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
#res .q-xpf{transition:width 1.1s cubic-bezier(.2,.8,.2,1)}
#res .q-fcbar{animation:qfcb 1s cubic-bezier(.2,.8,.2,1) .6s both;transform-origin:0 50%}
@keyframes qfcb{from{transform:scaleX(0)}to{transform:scaleX(1)}}
/* botões: a entrada usa "backwards" (não "both") para o :active continuar valendo depois que a animação termina */
#res .q-go{animation:qpi .45s cubic-bezier(.2,1.6,.4,1) backwards,qpulse 1.4s .45s ease-in-out infinite}
@keyframes qpi{0%{opacity:0;transform:scale(.4)}100%{opacity:1;transform:none}}
@keyframes qpulse{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 30px rgba(255,201,74,.95)}}
#res .q-skip:active{transform:scale(.95)}
#res .q-farm{animation:qcup .5s 1.7s cubic-bezier(.2,1.3,.4,1) backwards,qpulse 1.4s 2.2s ease-in-out infinite}
#res .q-red{animation:qcup .5s 1.82s cubic-bezier(.2,1.3,.4,1) backwards,qred 2s 2.4s ease-in-out infinite}
#res .q-red:active{transform:scale(.97)}
@keyframes qred{0%,100%{border-color:#7a2a20}50%{border-color:#ff7a6e}}
#res .q-lose{animation:qlose .6s .2s cubic-bezier(.2,1.3,.4,1) both}
@keyframes qlose{0%{opacity:0;transform:scale(1.4)}60%{opacity:1;transform:scale(.97)}100%{transform:none}}
#res .q-orbs{position:absolute;width:44px;height:44px;transform:scaleY(.38);pointer-events:none;animation:yfade .4s .3s ease-out both}
#res .q-orb{position:absolute;left:16px;top:16px;width:12px;height:12px;animation:qorb 1.1s linear infinite}
@keyframes qorb{from{transform:rotate(0deg) translateX(18px) rotate(0deg)}to{transform:rotate(360deg) translateX(18px) rotate(-360deg)}}
#res .q-path{animation:qcup .5s cubic-bezier(.2,1.3,.4,1) backwards}
#res .q-path:active{transform:scale(.96)}
#res .q-picon{animation:qpicon 2.4s ease-in-out infinite}
@keyframes qpicon{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.08) rotate(-4deg)}}
#res .q-fspin{animation:yspin 2.2s linear infinite}
#res .q-pfx{animation:qpfx 2s ease-in-out infinite}
@keyframes qpfx{0%,100%{opacity:.75}50%{opacity:1}}
#res .q-auto{position:absolute;left:0;bottom:0;height:5px;background:rgba(42,20,3,.55);border-radius:0 3px 3px 0;pointer-events:none}
`; document.head.appendChild(st); })();

/* voo de um ícone até o topo (moedas, gemas, avatar) e pulo do contador */
function yFly(fromEl,kind,delay){ const app=document.getElementById('app'); let to=document.getElementById(kind==='gold'?'gold':kind==='gem'?'gems':'lvb');
  if(document.body.classList.contains('fb')&&typeof fbTarget==='function'){ const t2=fbTarget(kind==='gold'?'gold':kind==='gem'?'gems':'level'); if(t2) to=t2; }   /* batalha em tela cheia: o destino é a peça nova do HUD */
  if(typeof xFrameOn==='function'&&xFrameOn()&&kind!=='item'){ const t3=document.getElementById(kind==='gold'?'xf_gold':'xf_gems'); if(t3) to=t3.parentNode||t3; }   /* contorno comum: o HUD fica coberto, o destino é a pílula do cabeçalho do painel */
  if(!fromEl||!to||!app) return;
  const ar=app.getBoundingClientRect(), a=fromEl.getBoundingClientRect(), b=to.getBoundingClientRect(), im=document.createElement('img');
  im.className='y-fly'; im.alt=''; im.src=kind==='gold'?'assets/ui/coin.png':kind==='gem'?'assets/ui/gem.png':'assets/ui/pass.png';
  const x=a.left+a.width/2-ar.left-20, y=a.top+a.height/2-ar.top-20;
  im.style.cssText=`left:${x}px;top:${y}px;--dx:${(b.left+b.width/2-ar.left-20-x).toFixed(0)}px;--dy:${(b.top+b.height/2-ar.top-20-y).toFixed(0)}px;animation-delay:${delay||0}ms`;
  app.appendChild(im); setTimeout(()=>{ im.remove(); const p=to.closest('.hpill')||to.closest('.x-hpill')||to; p.classList.remove('y-bump'); void p.offsetWidth; p.classList.add('y-bump'); },1000+(delay||0)); }

/* ======================================================================= 08 PASSE ======================================================================= */
/* PANEL_V2.passScroll (ligada por padrão; a chave vive no objeto PANEL_V2 do js/screens.js): trilha de prêmios numa lista só, com rolagem, e Missões fora do Passe
   (botão que abre a tela 34 'missions'; sem ela, a lista de missões daqui). Com PANEL_V2.passScroll=false volta tudo ao que era: páginas (XP.page) e a aba Missões dentro. */
const pScrollOn=()=>PANEL_V2.passScroll!==false;
const P_THD=44, P_ROWH=70, P_GAP=6, P_PAD=6;   /* medidas da trilha contínua: legenda presa, linha, vão e respiro de cima (as mesmas do protótipo) */
const P_MIS_I='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4h6v3H9zM9 5.5H5v15h14v-15h-4M8.5 13.5l2.5 2.5 4.5-4.5"></path></svg>';
const XP={page:-1,mt:'d',mpage:0,cf:false,anim:true,toast:'',toastT:0,lvfx:false,scKey:''};
/* a tela 34 (js/p_missions.js: Panels.add('missions'), chave PANEL_ON.missions) ligada, registrada e inteira? Só então o botão Missões abre ela. */
function pMisScreen(){ try{ const R=window.Screens&&Screens.reg&&Screens.reg.missions; if(!R||R.broken) return false; return !(window.Panels&&Panels.defs&&Panels.defs.missions)||Panels.on('missions'); }catch(e){ return false; } }
/* abre a tela 34 pelo caminho que ela pede (pedido Q-6: Panels.open('missions'); sem o Panels, Screens.open). Devolve true só se a tela 34 ficou na frente:
   enquanto o setView do index.html trocar 'missions' por 'pass', a chamada cai na lista de missões daqui e isto devolve false (quem chama garante a lista). */
function pMisOpen(){ try{ if(window.Panels&&Panels.defs&&Panels.defs.missions&&typeof Panels.open==='function') Panels.open('missions',{tab:'daily',from:'pass'}); else Screens.open('missions',{tab:'daily'}); }catch(e){ console.error('Passe: abrir Missões',e); }
  return typeof view!=='undefined'&&(view==='missions'||view==='missions34'); }   /* 'missions34' = a tela 34 pelo gancho provisório do js/panels.js */
/* trilha já rolada até o nível atual do passe, com a linha dele no meio da parte visível (abaixo da legenda presa). Conta por medida fixa (linha de 70 + vão de 6),
   só a altura da lista é lida da tela; se ela ainda não tiver altura, tenta de novo no quadro seguinte. */
function pScrollCur(sc,cur){ const lv=Math.max(1,cur||1), go=()=>{ const h=sc.clientHeight||0; if(!h) return false; sc.scrollTop=Math.max(0,Math.round(P_PAD+(lv-1)*(P_ROWH+P_GAP)-(h-P_THD-P_ROWH)/2)); return true; };
  if(!go()&&typeof requestAnimationFrame==='function') requestAnimationFrame(()=>{ try{ if(sc.isConnected!==false) go(); }catch(e){} }); }
/* a peça está à vista dentro da lista rolável? (o voo de moeda só sai de cartão visível; senão sai do meio da trilha) */
function pVisible(el,sc){ try{ if(!sc) return true; const a=sc.getBoundingClientRect(), b=el.getBoundingClientRect(); return !(b.bottom<a.top+P_THD||b.top>a.bottom); }catch(e){ return true; } }
const P_MICON={kill:'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4',boss:'M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z',ult:'M13 2 4 14h7l-1 8 9-12h-7z',chest:'M3 10h18v10H3zM3 10l2-5h14l2 5M12 10v4',
  instance:'M4 21V9l8-6 8 6v12M9 21v-6h6v6',forge:'M5 9h9l5 3-5 2v3H7v-3H5zM7 20h8',summon:'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',upgrade:'M12 20V5M5 12l7-7 7 7'};
const P_GO={summon:'summon',upgrade:'gear'};
const pEvOf=id=>{ const D=Sys.pass.DATA, m=D.daily.concat(D.weekly).find(x=>x.id===id); return m?m.k:'kill'; };
/* produto do Passe Premium no catálogo do Sys.buy (kind 'pass_premium'), só com a compra ligada (Sys.buy.ready()); senão null */
function pPremProd(){ try{ return typeof xBuyReady==='function'&&xBuyReady()?(xBuyProds('pass_premium')[0]||null):null; }catch(e){ return null; } }
function pToast(msg){ XP.toast=msg; XP.toastT=Date.now(); const el=document.getElementById('xp_toast'); if(el) el.innerHTML=`<div style="position:absolute;left:24px;right:24px;bottom:112px;z-index:40;display:flex;justify-content:center;pointer-events:none"><span class="y-toast" role="status" style="padding:10px 16px;border-radius:12px;background:#12261a;border:2px solid #5fd068;color:#e6fbe7;font-size:14px;font-weight:900;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.6)">${esc2(msg)}</span></div>`; }
/* PACOTE DE UM NÍVEL (Sys.pass: rw.mat = {forge, essence, ...} e rw.mountFrags): nada de número fixo aqui, tudo vem do prêmio que o módulo devolve.
   Ícones = os que o jogo já usa: pedra de forja (Y_STONE, a mesma das missões e da Vitória), essência e ração (Q_ESS / Q_FOOD da Vitória) e o
   fragmento de montaria (a mesma forma da tela de Montarias). */
const P_FRAG=s=>`<span aria-hidden="true" style="display:inline-block;width:${Math.round(s*0.86)}px;height:${s}px;flex:none;clip-path:polygon(50% 0,100% 30%,80% 100%,20% 100%,0 30%);background:linear-gradient(180deg,#fff3c4,#ffc94a)"></span>`;
const pIcSz=(svg,s)=>String(svg).replace('width="20" height="20"','width="'+s+'" height="'+s+'" style="flex:none"');
function pExtras(rw){ const ex=[], m=(rw&&rw.mat&&typeof rw.mat==='object')?rw.mat:{}, q=v=>Math.max(0,Math.round(+v||0));
  if(q(m.forge)) ex.push({k:'forge',n:q(m.forge),ic:s=>Y_STONE(s),nm:q(m.forge)===1?'pedra de forja':'pedras de forja'});
  if(q(m.essence)) ex.push({k:'essence',n:q(m.essence),ic:s=>pIcSz(Q_ESS,s),nm:q(m.essence)===1?'Essência':'Essências'});
  if(q(m.food)) ex.push({k:'food',n:q(m.food),ic:s=>pIcSz(Q_FOOD,s),nm:'de ração de pet'});
  { const mf=rw&&rw.mountFrags, o=mf&&typeof mf==='object'?mf:null, k=q(o?o.n:mf);   /* tabela do prêmio: número; resgate: {n, id, stars, up} ou {n, stored:true} */
    if(k) ex.push({k:'mfrag',n:k,ic:s=>P_FRAG(s),nm:(k===1?'fragmento de montaria':'fragmentos de montaria')+(o&&o.stored?' (guardados até a 1ª montaria)':o&&o.up?' (estrela nova na montaria)':'')}); }
  return ex; }
const pExTxt=ex=>ex&&ex.length?ex.map(x=>', '+gNum(x.n)+' '+x.nm).join(''):'';   /* para o aria-label e o aviso */
const pExHtml=(ex,s,fs)=>ex&&ex.length?`<span aria-hidden="true" style="display:flex;align-items:center;gap:${s>14?8:5}px;flex-wrap:nowrap;font-size:${fs||10}px;font-weight:900;color:#f6ecdf;white-space:nowrap">${ex.map(x=>`<span style="display:flex;align-items:center;gap:2px">${x.ic(s||13)}${gNum(x.n)}</span>`).join('')}</span>`:'';
/* o nível Premium que entrega o pacote (hoje o 25): o primeiro que traz materiais ou fragmentos. null = módulo antigo (aí vale a vitrine de antes). */
function pBig(){ try{ const L=Sys.pass.DATA.premium||[]; for(let i=0;i<L.length;i++){ const rw=L[i]; if(rw&&(rw.mat||rw.mountFrags)) return {lv:i+1,rw}; } }catch(e){} return null; }
/* o que cada nível dá, para desenhar: {kind:'coin'|'eq'|'skin', ...}; ex = pacote que vem junto do item */
function pInfo(rw){ if(!rw) return {kind:'coin',img:'assets/ui/gem.png',txt:''};
  if(rw.skin){ const sk=SKIN(SEASON_SKIN); return {kind:'skin',r:sk?sk.r:3,rc:RC[sk?sk.r:3],tag:RN(sk?sk.r:3)+' · Skin',txt:sk?sk.n:'Skin da temporada'}; }   /* r = raridade, para a moldura única (xRar do js/screens.js) */
  if(rw.item){ const it=rw.item, r=it.season?4:it.r; return {ex:pExtras(rw),kind:'eq',slot:it.slot,r,rc:RC[r],tag:it.season?'Item da Temporada':RN(r)+' · '+SLOT[it.slot].n,txt:it.season?SLOT[it.slot].n+' · evolui até Lendário':iname({slot:it.slot,r:it.r,e:S.eraMax})}; }
  if(rw.gems) return {kind:'coin',img:'assets/ui/gem.png',fly:'gem',txt:rw.gems+' diamantes'};
  return {kind:'coin',img:'assets/ui/coin.png',fly:'gold',txt:kf((rw.goldk||0)*Sys.host.goldUnit())+' moedas'}; }
function pPending(){ const o=Sys.pass.ensure(S), t=Sys.pass.tier(S), out=[]; for(let i=1;i<=t;i++){ if(!o.free.includes(i)) out.push(['free',i]); if(o.premium&&!o.prem.includes(i)) out.push(['premium',i]); } return out; }
/* resgata UM nível de UMA trilha. O módulo só tem claimAll: o jogo marca os outros níveis como já resgatados só durante a chamada e devolve o estado
   depois (nada é dado duas vezes: o nível pedido entra na lista de resgatados pelo próprio claimAll). */
/* motivo do Sys.pass.claimTier quando ok:false, em texto curto para o jogador */
const P_WHY={trilha:'Trilha inválida',nivel:'Este nível não existe no passe',bloqueado:'Ainda não liberou: suba o nível do passe',premium:'Exige o Passe Premium',resgatado:'Recompensa já resgatada',sem_premio:'Este nível não tem prêmio nesta trilha',erro:'Não foi possível resgatar agora. Tente de novo'};
/* resgata UM nível de UMA trilha. Fonte: Sys.pass.claimTier (função própria do módulo: trata virada de temporada e erro no meio da entrega).
   Devolve no formato do claimAll ({n, list}) para o pAfterClaim; se não resgatou, {n:0, why}. Sem a função (módulo antigo), cai no caminho de reserva. */
function pClaimOne(track,lv){ if(typeof Sys.pass.claimTier==='function'){ let r=null; try{ r=Sys.pass.claimTier(S,Sys.host,track,lv); }catch(e){ r={ok:false,reason:'erro'}; }
    if(r&&r.ok){ const rw=r.rewards||{}; return {n:1,list:[{track:r.track||track,tier:r.tier||lv,gems:rw.gems,gold:rw.gold,item:rw.item,held:rw.held,skin:rw.skin,mat:rw.mat,mountFrags:rw.mountFrags}]}; }
    return {n:0,why:(r&&r.partial?'Item guardado: sai quando o nível liberar':P_WHY[r&&r.reason]||P_WHY.erro)}; }
  return pClaimOneOld(track,lv); }
/* RESERVA (só sem claimTier): reaproveita o claimAll marcando os outros níveis como resgatados durante a chamada */
function pClaimOneOld(track,lv){ const o=Sys.pass.ensure(S), sf=o.free.slice(), sp=o.prem.slice(), all=[]; for(let i=1;i<=Sys.pass.DATA.tiers;i++) all.push(i);
  let res=null; try{ o.free=track==='free'?all.filter(i=>i!==lv||sf.includes(i)):all.slice(); o.prem=track==='premium'?all.filter(i=>i!==lv||sp.includes(i)):all.slice(); res=Sys.pass.claimAll(S,Sys.host); }
  finally{ const got=!!(res&&res.n); o.free=track==='free'&&got?sf.concat(lv).sort((a,b)=>a-b):sf; o.prem=track==='premium'&&got?sp.concat(lv).sort((a,b)=>a-b):sp; }
  return res; }
function pAfterClaim(res,els){ if(!res||!res.n){ snd('ui_tap'); if(res&&res.why){ statsChanged(); XP.anim=false; render(); } pToast(res&&res.why?res.why:'Nada novo para resgatar'); return; }
  const items=[], held=[]; let k=0, exT='';
  for(const r of res.list){ if(r.item) items.push(iname(r.item)); if(r.held) held.push(r.held); if(r.skin){ const sk=SKIN(SEASON_SKIN); items.push(sk?sk.n:'Skin da temporada'); }
    if(r.mat||r.mountFrags) exT+=pExTxt(pExtras(r)).replace(/, /g,' · +');   /* pacote do nível: pedras, essências, fragmentos */
    const el=(els&&els[r.track+r.tier])||(pScrollOn()&&document.getElementById('xp_sc'))||document.getElementById('xp_all');   /* cartão fora da vista (lista rolada): o voo sai do meio da trilha */
    if(k<8){ if(r.gems) yFly(el,'gem',k*90); if(r.gold) yFly(el,'gold',k*90+60); if(r.item||r.skin||r.held||r.mat||r.mountFrags) yFly(el,'item',k*90); k++; } }
  snd('claim'); if(res.list.some(r=>r.gold)) setTimeout(()=>snd('coin'),250); statsChanged(); XP.anim=false; render();
  const hTxt=held.length?(held.length===1?'Item guardado: sai no nível '+held[0].needLevel:held.length+' itens guardados até o nível liberar'):'';
  pToast(res.n===1?(items.length?items[0]+' (veja em Equip.)'+exT:hTxt?hTxt+exT:exT?exT.replace(/^ · /,''):'Recompensa resgatada'):'Resgatou '+res.n+' recompensas'+(items.length?' · '+items.length+(items.length>1?' itens':' item'):'')+(hTxt?' · '+hTxt:'')); }
function pRenew(mt){ const d=new Date(); if(mt==='d'){ const m=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d, h=Math.floor(m/3600000); return h>=1?'Renova em '+h+'h':'Renova em '+Math.max(1,Math.ceil(m/60000))+'min'; }
  const wd=(d.getDay()+6)%7, days=7-wd, m=new Date(d.getFullYear(),d.getMonth(),d.getDate()+days)-d, dd=Math.floor(m/86400000); return dd>=1?'Renova em '+dd+'d':'Renova em '+Math.max(1,Math.floor(m/3600000))+'h'; }
function passTick(){ const el=document.getElementById('xp_renew'); if(el){ const t=pRenew(XP.mt); if(el.textContent!==t) el.textContent=t; } }
function scrPass(){
  if(!PASS_OK()){ V.innerHTML=''; return; }
  const passOk=xUnlocked('pass'); if(!passOk) passTab='mis';
  /* TELA 34 ligada: a lista de missões de dentro do Passe não aparece mais; qualquer caminho que peça Missões (aba antiga, Screens.open('pass',{tab:'missions'}),
     jogador abaixo do nível do Passe) vai para a tela nova. O Passe fica só com a trilha de prêmios e o XP. */
  if(passTab==='mis'&&window.Panels&&Panels.on('missions')&&window.Screens&&Screens.reg&&Screens.reg.missions&&!Screens.reg.missions.broken){ passTab='pass'; V.innerHTML=''; setTimeout(()=>{ if(typeof view!=='undefined'&&view==='pass') Panels.open('missions',{tab:XP.mt==='w'?'weekly':'daily'}); },0); return; }   /* antes do nível do Passe (18) o painel é só MISSÕES: sem cabeçalho da temporada, sem aba de recompensas, sem Premium */
  const d=xFit(682,610), H=d.H, PER=d.real?5:(d.full?5+Math.min(2,Math.max(0,Math.floor((H-682)/75))):4), P=Sys.pass, T=P.DATA.tiers, o=P.refresh(S,Sys.host), pr=P.progress(S), CUR=pr.tier, prem=pr.premium, lvP=plv(), premP=pPremProd();   /* premP: produto do Passe Premium no Sys.buy quando a compra está ligada; null = "Pagamento em breve" como sempre */
  const sea=P.season(S,Sys.host), days=Math.max(0,Math.ceil((sea.end-Date.now())/86400000)), L=P.list(S,Sys.host), isMs=passTab==='mis';
  const ready=L.daily.concat(L.weekly).filter(m=>m.done&&!m.claimed).length+(L.bonus.ready&&!L.bonus.claimed?1:0), sk=SKIN(SEASON_SKIN), skT=sk?tierOf(sk.r):0, big=pBig(), bigI=big?pInfo(big.rw):null;
  const seg=on=>on?'background:linear-gradient(180deg,#b07cff,#6a3cff);color:#fff':'background:transparent;color:#c9b9a2';
  /* SC = trilha contínua com rolagem (padrão). A lista que rola tem id xp_sc (a trilha no Passe; o miolo inteiro nas Missões): a tela redesenha inteira a cada toque,
     então o scrollTop é guardado aqui e devolvido no fim (igual ao xg_sc do Equipamento). "first" = abertura ou troca de modo: aí a trilha vai para o nível atual. */
  const SC=pScrollOn(), scKey=(isMs?'m':'p')+(SC?1:0), first=XP.anim||XP.scKey!==scKey, sc0=document.getElementById('xp_sc'), scTop=sc0&&!first?sc0.scrollTop:0;
  let body='';
  if(!isMs){
    const pages=Math.ceil(T/PER); if(XP.page<0) XP.page=Math.floor(Math.max(0,Math.min(T,CUR+1)-1)/PER); XP.page=Math.max(0,Math.min(pages-1,XP.page)); const pg=XP.page;   /* páginas: só com a chave desligada */
    const lvA=SC?1:pg*PER+1, lvB=SC?T:Math.min(T,pg*PER+PER);
    /* etiqueta do prêmio ("Raro · Chapéu/Elmo"): inteira, sem reticências. Em tela estreita (menos de 380 px o cartão tem ~46 a 90 px de texto) fica só a
       raridade: o espaço já está no nome do item, na linha de baixo. O que sobrar quebra linha. */
    const pTag=t=>{ const s=String(t||''); return (d.real?d.Wb:390)<380?s.split(' · ')[0]:s; };
    /* recompensa de equipamento e de skin: a MESMA moldura por raridade das outras telas (xRar, js/screens.js); com PANEL_V2.rar desligada, o desenho de antes */
    const cell=(inf,op)=>{ if(inf.kind==='coin') return `<img src="${inf.img}" alt="" style="width:38px;height:38px;object-fit:contain;flex:none;opacity:${op}">`; const q=xRar(inf.r);
      return inf.kind==='eq'?`<span class="p-slot${q.on?q.cls:' p-rglow'}"${q.at} style="${q.on?'':`border-color:${inf.rc};--rc:${inf.rc};background:radial-gradient(circle,${inf.rc}33,#120d0a 75%);`}opacity:${op}"><img src="${xRarIco(slotIcon(inf.slot,S.eraMax),inf.r,28)}" alt="" style="width:28px;height:28px;object-fit:contain"></span>`
      :`<span class="p-slot${q.cls}"${q.at} style="${q.on?'':`border-color:${inf.rc};`}overflow:hidden;background:#241a38;opacity:${op}"><span class="kidle ${skT?'t'+skT:''}" style="position:absolute;left:-6px;top:-8px;width:48px;height:48px;display:block"></span></span>`; };
    const rwName=inf=>inf.kind==='coin'?esc2(inf.txt):xRarName(inf.r,inf.txt);   /* nome da recompensa na cor da raridade */
    /* CARTÃO EM TELA ESTREITA (QA, 288 px: "150 diamantes", "Resgatado" e "No nível N" saíam da borda). Cada cartão tem (largura − 24 − 44 − 12) / 2 px; tirando
       respiro, borda, ícone e vão sobram ~44 px de texto em 288. Abaixo de 340 px: ícone desenhado em 26 px (o mesmo desenho, reduzido), texto com ~58 px,
       nome com a fonte que cabe a palavra mais longa (mínimo 8,5 px) e quebra de linha, estados mais curtos (sem o ícone do visto). De 340 px para cima, igual. */
    const pW0=d.real?d.Wb:390, pNar=pW0<340, pTxW=Math.max(40,(pW0-24-44-12)/2-16-(pNar?26+4:40+6));
    const pCell=(inf,op)=>pNar?`<span style="flex:none;width:26px;height:26px;display:flex;align-items:center;justify-content:center"><span style="flex:none;display:flex;transform:scale(.65)">${cell(inf,op)}</span></span>`:cell(inf,op);
    const pNmSt=inf=>{ const ex=inf.ex&&inf.ex.length; if(!pNar) return 'font-size:12px;font-weight:900;line-height:1.1'+(ex?';white-space:nowrap;overflow:hidden;text-overflow:ellipsis':'');
      const wd=String(inf.txt||'').split(/\s+/).reduce((a,b)=>xTxtEm(b)>xTxtEm(a)?b:a,''); return 'font-size:'+xFitPx(wd,pTxW-4,ex?10:12,8.5)+'px;font-weight:900;line-height:1.05;overflow-wrap:anywhere'; };
    const state=(can,done,fut,lv)=>can?`<span class="p-pill y-gold lil" style="align-self:flex-start;height:${pNar?20:22}px;padding:0 ${pNar?4:9}px;border-radius:8px;font-size:${pNar?10.5:12}px;display:flex;align-items:center;box-shadow:0 3px 0 #8a4f0c">Resgatar</span>`
      :done?(pNar?'<span style="font-size:10px;font-weight:900;color:#8fe596;white-space:nowrap">Resgatado</span>':`<span style="display:flex;align-items:center;gap:3px;font-size:11px;font-weight:900;color:#8fe596">${Y_CHK(14)}Resgatado</span>`):fut?`<span style="font-size:${pNar?9.5:11}px;font-weight:800;color:#c9b9a2${pNar?';white-space:nowrap':''}">No nível ${lv}</span>`:'';
    let rows='';
    for(let lv=lvA;lv<=lvB;lv++){ const fi=pInfo(P.reward('free',lv)), pi=pInfo(P.reward('premium',lv)), reached=lv<=CUR;
      const fDone=o.free.includes(lv), fCan=reached&&!fDone, fFut=!reached, pDone=o.prem.includes(lv), pCan=prem&&reached&&!pDone, pFut=prem&&!reached, pLock=!prem;
      const fOp=fDone?.6:fFut?.85:1, pOp=pLock||pDone?.6:1, cur=lv===CUR;
      rows+=`<div class="p-row${SC&&!reached?' p-fut':''}" data-lv="${lv}" style="${SC?'position:relative;':''}height:${P_ROWH}px;flex:none;display:grid;grid-template-columns:1fr 44px 1fr;gap:6px">
        <button class="p-card ${fCan?'p-can':''}" data-x="claim" data-t="free" data-lv="${lv}" id="xp_free${lv}" aria-label="Nível do passe ${lv}, grátis: ${esc2(fi.tag?fi.tag+', ':'')}${esc2(fi.txt+pExTxt(fi.ex))}${fCan?', resgatar':fDone?', resgatado':', libera no nível do passe '+lv}" style="position:relative;border-radius:14px;border:2px solid ${fCan?'#ffc94a':fi.kind==='eq'?fi.rc+'99':'#4a3a2b'};background:${fCan?'linear-gradient(180deg,#4a361f,#241b14)':'#1d1611'};padding:4px 6px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0;opacity:${fOp}">
          ${pCell(fi,1)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">${fi.tag&&!(fi.ex&&fi.ex.length)?`<span style="font-size:9px;font-weight:900;color:${fi.rc};line-height:1.05;overflow-wrap:anywhere">${esc2(pTag(fi.tag))}</span>`:''}<span style="${pNmSt(fi)}">${rwName(fi)}</span>${pExHtml(fi.ex)}${state(fCan,fDone,fFut,lv)}</span></button>
        <div style="position:relative;display:flex;align-items:center;justify-content:center">
          ${SC?'':`<span style="position:absolute;left:20px;top:-3px;width:4px;height:38px;background:${lv===1?'transparent':reached?'#b07cff':'#4a3a2b'}"></span><span style="position:absolute;left:20px;top:35px;width:4px;height:38px;background:${lv===T?'transparent':lv+1<=CUR?'#b07cff':'#4a3a2b'}"></span>`}
          <span class="lil${SC&&cur?' p-curn':''}" style="position:relative;width:40px;height:40px;border-radius:50%;border:3px solid ${reached?'#b07cff':'#4a3a2b'};background:${cur?'linear-gradient(180deg,#b07cff,#6a3cff)':reached?'#2e1f4a':'#1d1611'};color:${cur?'#fff':reached?'#d9b3ff':'#c9b9a2'};font-size:17px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${lv}${cur?'<span class="p-cur"></span>':''}</span></div>
        <button class="p-card ${pCan?'p-can':''}" data-x="claim" data-t="premium" data-lv="${lv}" id="xp_premium${lv}" aria-label="Nível do passe ${lv}, premium: ${esc2(pi.tag?pi.tag+', ':'')}${esc2(pi.txt+pExTxt(pi.ex))}${pLock?', exige Premium':pCan?', resgatar':pDone?', resgatado':', libera no nível do passe '+lv}" style="position:relative;overflow:hidden;border-radius:14px;border:2px solid ${pCan?'#ffc94a':pi.kind==='coin'?'#5a3f8a':pi.rc};background:${pi.kind==='coin'?'linear-gradient(180deg,#2a2038,#1d1611)':'linear-gradient(180deg,#3a2a55,#1d1611)'};padding:4px 6px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0">
          ${pCell(pi,pOp)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;opacity:${pOp}">${pi.tag&&!(pi.ex&&pi.ex.length)?`<span style="font-size:9px;font-weight:900;color:${pi.rc};line-height:1.05;overflow-wrap:anywhere">${esc2(pTag(pi.tag))}</span>`:''}<span style="${pNmSt(pi)}">${rwName(pi)}</span>${pExHtml(pi.ex)}${state(pCan,pDone,pFut,lv)}</span>
          ${pLock?`<span style="position:absolute;right:${pNar?2:4}px;top:${pNar?2:4}px;width:${pNar?18:24}px;height:${pNar?18:24}px;border-radius:50%;background:#0e0a07;border:2px solid #8a4dff;display:flex;align-items:center;justify-content:center">${SVG_LOCK(13,'#e6d4ff')}</span>`:''}</button></div>`; }
    const pend=pPending(), dots=Array.from({length:pages},(_,i)=>`<span style="width:${i===pg?22:8}px;height:8px;border-radius:4px;background:${i===pg?'#b07cff':i*PER+1<=CUR?'#6a4a9a':'#4a3a2b'};transition:width .25s"></span>`).join('');
    /* legenda das trilhas: com rolagem fica presa no topo da lista (p-thd, 44 px); paginado, é a linha de 38 px de antes */
    const legend=`<div ${SC?`class="p-thd" style="height:${P_THD}px;`:'style="height:38px;flex:none;'}display:grid;grid-template-columns:1fr 44px 1fr;gap:6px;align-items:center">
        <span style="display:flex;flex-direction:column;align-items:center;line-height:1.1"><span class="lil" style="font-size:15px;color:#e8dccb">Grátis</span><span style="font-size:9px;font-weight:800;color:#c9b9a2;text-align:center">diamantes, moedas, Básico · Épico no 30</span></span>
        <span style="text-align:center;font-size:9px;font-weight:900;color:#c9b9a2">NÍVEL DO PASSE</span>
        <span style="display:flex;flex-direction:column;align-items:center;line-height:1.1"><span class="lil" style="display:flex;align-items:center;gap:4px;font-size:15px;color:#d9b3ff">${prem?'':SVG_LOCK(13,'#e6d4ff')}Premium</span><span style="font-size:9px;font-weight:800;color:#d9c8ff;text-align:center">Raro, Épico e Lendário, + diamantes, skin</span></span></div>`;
    /* com rolagem: TODOS os níveis numa lista só (id xp_sc), linha de progresso contínua atrás dos números (cheia até o nível atual), fim da temporada no pé; as ações ficam fora da rolagem */
    const step=P_ROWH+P_GAP, trail=SC?`<div class="x-scroll p-trail" id="xp_sc" role="region" aria-label="Trilha do passe, níveis 1 a ${T}">${legend}
        <div style="position:relative;display:flex;flex-direction:column;gap:${P_GAP}px;padding:${P_PAD}px 0 4px">
          <span aria-hidden="true" style="position:absolute;left:calc(50% - 2px);top:${P_PAD+P_ROWH/2}px;width:4px;height:${(T-1)*step}px;border-radius:2px;background:#3a2c1f"></span>
          <span aria-hidden="true" style="position:absolute;left:calc(50% - 2px);top:${P_PAD+P_ROWH/2}px;width:4px;height:${Math.max(0,Math.min(CUR,T)-1)*step}px;border-radius:2px;background:linear-gradient(180deg,#7fe3ff,#b07cff 30%,#8a4dff);box-shadow:0 0 8px rgba(176,124,255,.8)"></span>
          ${rows}</div>
        <div style="padding:8px 0 14px;text-align:center;font-size:12px;font-weight:800;color:#c9b9a2">Fim da temporada · ${T} níveis · itens da sua era</div></div>`
      :`${legend}
      <div style="height:${PER*70+(PER-1)*5}px;flex:none;display:flex;flex-direction:column;gap:5px">${rows}</div>`;
    body=`${trail}
      <div style="height:52px;flex:none;display:flex;gap:8px;${SC?'':'margin-top:auto'}">
        <button class="lil ${pend.length?'y-gold y-cta':''}" data-x="all" id="xp_all" style="flex:1;height:50px;border-radius:14px;${pend.length?'':'border:2px solid #4a3a2b;background:#241b14;color:#c9b9a2;'}font-size:16px;padding:0">${pend.length?'Resgatar tudo ('+pend.length+')':'Tudo resgatado'}</button>
        ${prem?`<div class="lil" style="flex:1.3;height:50px;border-radius:14px;border:2px solid #8a4dff;background:#241a38;color:#e6d4ff;font-size:16px;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box"><img src="assets/ui/pass.png" alt="" style="width:26px;height:26px;object-fit:contain">Premium ativo</div>`
          :`<button class="p-prem" data-x="askprem" style="position:relative;overflow:hidden;flex:1.3;height:50px;border-radius:14px;padding:0 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05"><span class="p-premsh"></span><span class="lil" style="font-size:16px">Ativar Premium</span><span style="font-size:10px;font-weight:900;color:#2a1250">${premP?esc2(xBuyPrice(premP.id)):'Pagamento em breve'}</span></button>`}</div>
      ${SC?'':xPager('pg',pg,pages,'Níveis '+(pg*PER+1)+'–'+Math.min(T,pg*PER+PER)+' de '+T+' · itens da sua era','Níveis anteriores','Próximos níveis')}`;
    XP.pages=pages;
  } else {
    const src=XP.mt==='d'?L.daily:L.weekly, list=src.map(m=>({m,ev:pEvOf(m.id)}));
    if(XP.mt==='d') list.push({bonus:true,m:{id:'bonus',txt:L.bonus.txt||'Complete as diárias',pxp:L.bonus.pxp,gems:L.bonus.gems,p:L.daily.filter(x=>x.claimed).length,need:L.daily.length,done:L.bonus.ready,claimed:L.bonus.claimed},ev:'boss'});
    const avail=H-260, nAll=list.length, hAll=Math.floor((avail-(nAll-1)*8)/Math.max(1,nAll)), noPg=!!d.real||hAll>=74, rowH=d.real?86:(noPg?Math.min(86,hAll):86);   /* layout novo: linha de 86 px, sem páginas (a tela rola) */
    const per=noPg?nAll:Math.max(2,Math.floor((H-260-46+8)/94)), pages=Math.max(1,Math.ceil(list.length/per)); XP.mpage=Math.max(0,Math.min(pages-1,XP.mpage)); XP.mpages=pages;
    const rows=list.slice(XP.mpage*per,XP.mpage*per+per).map(({m,ev,bonus})=>{ const can=m.done&&!m.claimed, off=ev==='instance'&&!m.done, pct=Math.round(Math.min(1,m.p/m.need)*100);
      return `<div class="p-mrow" style="height:${rowH}px;flex:none;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:16px;border:2px solid ${can?'#ffc94a':'#4a3a2b'};background:${can?'linear-gradient(90deg,#3a2c1f,#1d1611)':'#1d1611'};box-sizing:border-box;opacity:${m.claimed?.6:1}">
        <span style="width:46px;height:46px;flex:none;border-radius:12px;background:#16110d;border:2px solid #5a3f8a;color:#d9b3ff;display:flex;align-items:center;justify-content:center">${bonus?'<img src="assets/ui/pass.png" alt="" style="width:30px;height:30px;object-fit:contain">':`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P_MICON[ev]||P_MICON.kill}"></path></svg>`}</span>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="font-size:14px;font-weight:900;line-height:1.15">${esc2(m.txt)}</span>
          <span style="font-size:12px;font-weight:900;color:#d9c8ff">${passOk?'+'+m.pxp+' XP do passe':''}${m.gems?(passOk?' · ':'')+'+'+m.gems+' diamantes':''}${!passOk&&!m.gems?'+'+m.pxp+' XP do passe (o Passe abre no nível '+xUnlockLv('pass')+')':''}</span>
          <span style="display:flex;align-items:center;gap:6px"><span style="flex:1;height:8px;border-radius:4px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden"><span class="p-pxp" style="display:block;width:${pct}%;height:100%;transition:width .5s"></span></span><span style="flex:none;font-size:11px;font-weight:900;color:#e8dccb">${n0(m.p)}/${n0(m.need)}</span></span></div>
        ${can?`<button class="y-gold y-cta lil" data-x="mclaim" data-id="${m.id}" aria-label="${esc2(m.txt)}, resgatar" style="width:92px;height:46px;flex:none;border-radius:12px;font-size:16px;padding:0">Resgatar</button>`
          :m.claimed?`<span style="width:92px;flex:none;display:flex;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:900;color:#8fe596">${Y_CHK(14)}Feito</span>`
          :off?`<span style="width:92px;height:46px;flex:none;border-radius:12px;border:2px dashed #4a3a2b;color:#c9b9a2;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:4px;box-sizing:border-box">${SVG_LOCK(14)}Em breve</span>`
          :`<button data-x="mgo" data-ev="${ev}" aria-label="${esc2(m.txt)}, ${m.p} de ${m.need}, ir jogar" style="width:92px;height:46px;flex:none;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:13px;font-weight:900;padding:0">Ir</button>`}</div>`; }).join('');
    const mdots=Array.from({length:pages},(_,i)=>`<span style="width:${i===XP.mpage?22:8}px;height:8px;border-radius:4px;background:${i===XP.mpage?'#b07cff':'#4a3a2b'}"></span>`).join('');
    body=`<div style="height:52px;flex:none;display:flex;align-items:center;gap:8px">
        <div role="radiogroup" aria-label="Tipo de missão" style="flex:1;display:flex;height:52px;padding:3px;gap:3px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">
          <button role="radio" aria-checked="${XP.mt==='d'}" data-x="mt" data-m="d" style="flex:1;border-radius:9px;border:0;${seg(XP.mt==='d')};font-size:14px;font-weight:900;padding:0">Diárias</button>
          <button role="radio" aria-checked="${XP.mt==='w'}" data-x="mt" data-m="w" style="flex:1;border-radius:9px;border:0;${seg(XP.mt==='w')};font-size:14px;font-weight:900;padding:0">Semanais</button></div>
        <span style="flex:none;display:flex;align-items:center;gap:4px;font-size:12px;font-weight:900;color:#c9b9a2">${Y_CLOCK}<span id="xp_renew">${pRenew(XP.mt)}</span></span></div>
      <div style="flex:1 0 auto;display:flex;flex-direction:column;gap:8px">${rows}</div>
      ${pages>1?`<div style="height:40px;flex:none;display:flex;align-items:center;justify-content:center;gap:12px"><button data-x="mpg" data-d="-1" aria-label="Missões anteriores" style="width:48px;height:40px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:${XP.mpage>0?'#f6ecdf':'#6b5843'};padding:0;display:flex;align-items:center;justify-content:center">${Y_BACK}</button><div style="display:flex;gap:5px">${mdots}</div><button data-x="mpg" data-d="1" aria-label="Próximas missões" style="width:48px;height:40px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:${XP.mpage<pages-1?'#f6ecdf':'#6b5843'};padding:0;display:flex;align-items:center;justify-content:center">${Y_FWD}</button></div>`:''}
      <div style="${passOk?'':'display:none!important;'}height:44px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:12px;background:#1d1611;border:1px dashed #5a3f8a;font-size:12px;font-weight:800;color:#d9c8ff;text-align:center;padding:0 10px;box-sizing:border-box">XP do passe sobe o NÍVEL DO PASSE (${P.DATA.xpPerTier} XP por nível). Não muda o nível do jogador.</div>`;
  }
  const pct=pr.max?100:Math.round(pr.inTier/pr.per*100);
  /* no lugar das abas (chave ligada, Passe liberado): no Passe, o BOTÃO Missões (abre a tela 34; sem ela, a lista daqui); nas Missões, o caminho de volta ao Passe */
  const pendN=SC&&passOk&&isMs?pPending().length:0;
  const nav=!SC||!passOk?'':!isMs?`<button class="p-nav" data-x="mis" aria-label="Abrir Missões${ready?', '+ready+(ready===1?' pronta':' prontas')+' para resgatar':''}" style="position:relative;height:48px;flex:none;display:flex;align-items:center;gap:10px;padding:0 10px 0 12px;border-radius:13px;border:2px solid #5a3f8a;background:linear-gradient(180deg,#2e1f4a,#1d1611);color:#e6d4ff;text-align:left;box-sizing:border-box">
        <span style="flex:none;display:flex">${P_MIS_I}</span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.1"><span class="lil" style="font-size:17px;color:#fff">Missões</span><span style="font-size:11px;font-weight:800;color:#d9c8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${ready?(ready===1?'1 pronta':ready+' prontas')+' para resgatar':'Ganhe XP do passe'}</span></span>
        ${ready?`<span class="p-pill" style="flex:none;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:#ff5a4e;color:#fff;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${ready}</span>`:''}
        <span style="flex:none;display:flex;color:#d9b3ff">${Y_FWD}</span></button>`
    :`<button class="p-nav" data-x="tab" data-t="pass" aria-label="Voltar ao Passe${pendN?', '+pendN+(pendN===1?' prêmio':' prêmios')+' para resgatar':''}" style="position:relative;height:48px;flex:none;display:flex;align-items:center;gap:8px;padding:0 12px 0 8px;border-radius:13px;border:2px solid #5a3f8a;background:linear-gradient(180deg,#2e1f4a,#1d1611);color:#e6d4ff;text-align:left;box-sizing:border-box">
        <span style="flex:none;display:flex;color:#d9b3ff">${Y_BACK}</span>
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.1"><span class="lil" style="font-size:17px;color:#fff">Voltar ao Passe</span><span style="font-size:11px;font-weight:800;color:#d9c8ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${pendN?(pendN===1?'1 prêmio':pendN+' prêmios')+' para resgatar':'Prêmios da temporada'}</span></span>
        ${pendN?`<span class="p-pill" style="flex:none;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:#ffc94a;color:#2a1403;font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${pendN}</span>`:''}
        <img src="assets/ui/pass.png" alt="" style="width:26px;height:26px;flex:none;object-fit:contain"></button>`;
  /* CABEÇALHO DA TEMPORADA EM TELA ESTREITA (QA, 288 px: prazo, "jogador: Nv." e o texto do XP cortados). Coluna de texto = largura − 24 (margens) − 4 (borda)
     − 92 (arte) − 16 (respiro): 152 px em 288, 224 em 360, 254 em 390. Quando título + prazo (+ o X) não cabem na mesma linha (hW<...): o título fica sozinho
     com a fonte que cabe, o prazo desce para a linha do "jogador", o selo do nível ajusta a fonte e o texto do XP encolhe/abrevia e pode quebrar. A altura
     do cartão passa a ser mínima (92 px): cresce só quando uma linha quebra. De ~375 px para cima o desenho é o de antes. */
  const hW=(d.real?d.Wb:390)-24-4-92-16, hClose=!(xFrameOn()||document.body.classList.contains('fb')), hDays=days+' dia'+(days===1?'':'s'), hClockW=14+3+xTxtEm(hDays)*12+(hClose?38:0);
  const hTitle='Temporada Solar', hNar=xTxtEm(hTitle)*18+6+hClockW>hW, hChip='Nível do passe '+CUR, hPl='jogador: Nv. '+lvP;
  const hTitlePx=hNar?xFitPx(hTitle,hW-(hClose?38:0)-8,18,13):18, hChipPx=xFitPx(hChip,hW-16-8,15,11);   /* −8 px: folga para o erro da estimativa de largura (sem medir no DOM) */
  const hXpL=pr.max?'Nível máximo do passe':pr.inTier+'/'+pr.per+' XP do passe · ganhe nas Missões', hXpS=pr.max?hXpL:pr.inTier+'/'+pr.per+' XP · ganhe nas Missões', hXp=xTxtEm(hXpL)*11<=hW?hXpL:hXpS, hXpPx=xFitPx(hXp,hW-6,11,9.5);
  const hClock=`<span style="flex:none;display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:#e8dccb;white-space:nowrap">${Y_CLOCK}${hDays}</span>`;
  const hX=`<button data-x="close" aria-label="Fechar o Passe" ${hClose?'':'hidden '}style="flex:none;width:40px;height:40px;margin:-8px -6px -8px 0;border-radius:10px;border:2px solid #5a3f8a;background:#1d1611;color:#e6d4ff;padding:0;display:flex;align-items:center;justify-content:center">${Y_X}</button>`;
  /* com rolagem, no Passe o miolo NÃO rola (só a trilha rola: cartão da temporada e botão Missões em cima, ações embaixo, tudo preso); nas Missões o miolo rola como antes */
  V.innerHTML=xWrap(d,XP.anim?'p-in':'',`<div ${SC&&!isMs?'':`class="x-scroll"${SC?' id="xp_sc"':''} `}style="flex:1;position:relative;display:flex;flex-direction:column;gap:6px;padding:8px 12px 10px;box-sizing:border-box;${SC&&!isMs?'overflow:hidden;':''}background:radial-gradient(120% 50% at 50% 0%,#2c2140 0%,#16110d 70%);min-height:0">
    <div class="p-hdr" style="${passOk?'':'display:none!important;'}min-height:92px;flex:none;position:relative;display:flex;border-radius:16px;border:2px solid #8a4dff;background:linear-gradient(120deg,#2e1f4a 0%,#1d1611 70%);overflow:hidden">
      <div style="position:relative;width:92px;flex:none;overflow:hidden"><div class="p-aura"></div><div class="p-ped" style="left:18px;top:76px;width:56px;height:12px"></div>
        ${big?`<div role="img" aria-label="Prêmio do nível ${big.lv} do passe Premium: ${esc2(bigI.tag||'')}${esc2(pExTxt(bigI.ex))}" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:5px 2px 6px;box-sizing:border-box">
            <span style="font-size:9px;font-weight:900;color:#e6d4ff;white-space:nowrap;letter-spacing:.2px">Prêmio Nv. ${big.lv}</span>
            ${bigI.kind==='eq'?`<img class="p-glow" src="${xRarIco(slotIcon(bigI.slot,S.eraMax),bigI.r,44)}" alt="" style="width:44px;height:44px;object-fit:contain;filter:drop-shadow(0 0 6px ${bigI.rc})">`:''}
            ${pExHtml(bigI.ex,12,9)}</div>`
          :`<div class="kidle ${skT?'t'+skT:''} p-glow" role="img" aria-label="Skin da temporada, prêmio Premium do passe" style="position:absolute;left:6px;top:6px;width:80px;height:80px"></div>`}</div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:6px 12px 6px 4px">
        <div data-phl="1" data-w="${hW.toFixed(0)}" style="display:flex;align-items:${hNar?'center':'baseline'};justify-content:space-between;gap:6px"><span class="lil" style="min-width:0;font-size:${hTitlePx}px;line-height:1.05;white-space:nowrap">${hTitle}</span>
          ${hNar?hX:`<span style="flex:none;display:flex;align-items:center">${hClock}${hX}</span>`}</div>
        ${hNar?`<div data-phl="2" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1px 8px"><span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${hPl}</span>${hClock}</div>`:''}
        <div data-phl="3" style="display:flex;align-items:center;flex-wrap:wrap;gap:2px 8px"><span class="lil ${XP.lvfx?'p-lvup':''}" style="flex:none;padding:2px 8px;border-radius:9px;background:linear-gradient(180deg,#b07cff,#6a3cff);color:#fff;font-size:${hChipPx}px;white-space:nowrap">${hChip}</span>
          ${hNar?'':`<span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${hPl}</span>`}</div>
        <div role="progressbar" aria-label="XP do passe" aria-valuemin="0" aria-valuemax="${pr.per}" aria-valuenow="${pr.inTier}" style="height:12px;border-radius:6px;background:#0e0a07;border:1px solid #5a3f8a;overflow:hidden"><div class="p-fill p-pxp" style="width:${pct}%;height:100%"></div></div>
        <span data-phl="4" style="font-size:${hXpPx}px;font-weight:800;line-height:1.15;color:#d9c8ff;overflow-wrap:anywhere">${hXp}</span></div></div>
    ${SC?nav:`<div role="tablist" aria-label="Passe" style="${passOk?'':'display:none!important;'}height:52px;flex:none;display:flex;gap:6px;padding:3px;border-radius:13px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">
      <button role="tab" class="lil" aria-selected="${!isMs}" data-x="tab" data-t="pass" style="flex:1;border-radius:10px;border:0;${seg(!isMs)};font-size:16px;padding:0">Recompensas</button>
      <button role="tab" class="lil" aria-selected="${isMs}" data-x="tab" data-t="mis" style="position:relative;flex:1;border-radius:10px;border:0;${seg(isMs)};font-size:16px;padding:0">Missões${ready?`<span class="p-pill" style="position:absolute;top:4px;right:10px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ff5a4e;color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${ready}</span>`:''}</button></div>`}
    ${body}<div id="xp_toast"${SC&&!isMs?' style="position:absolute;left:0;right:0;bottom:0;height:0"':''}></div></div>
    ${XP.cf?`<div class="y-veil" style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.78);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
      <div class="y-pop" role="alertdialog" aria-label="Ativar Premium" style="width:330px;max-width:100%;border-radius:18px;border:3px solid #8a4dff;background:#221a30;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 30px rgba(138,77,255,.5)">
        <span class="lil" style="font-size:22px;text-align:center">Ativar Passe Premium</span>
        <div style="display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;font-size:13px;font-weight:800">
          <span>Equipamentos melhores: Raro e Épico ao longo do passe e 2 Itens da Temporada (níveis 27 e 30) que evoluem até Lendário</span>
          ${big?`<span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span>No nível ${big.lv} do passe:</span>${bigI.kind==='eq'?`<span style="display:flex;align-items:center;gap:3px;color:${bigI.rc}"><img src="${xRarIco(slotIcon(bigI.slot,S.eraMax),bigI.r,20)}" alt="" style="width:20px;height:20px;object-fit:contain">${esc2(bigI.tag||'')}</span>`:''}${pExHtml(bigI.ex,16,13)}</span>`:'<span>Skin da temporada no passe</span>'}<span>Mais diamantes nos outros níveis e +${P.DATA.premiumXpPct}% de XP do passe</span>
          <span style="font-size:12px;color:#c9b9a2">Compra direta pela loja do aparelho (Google Play / App Store), sem sorteio. Níveis já alcançados ficam prontos para resgatar.</span>
          ${premP?(xBuySim()?'<span role="note" style="padding:6px 8px;border-radius:8px;background:#3a2c1f;border:1px solid #ffc94a;color:#ffe07a;font-size:12px;font-weight:900;text-align:center">Modo dono: compra simulada, nada é cobrado.</span>':'')
            :'<span role="note" style="padding:6px 8px;border-radius:8px;background:#3a2c1f;border:1px solid #ffc94a;color:#ffe07a;font-size:12px;font-weight:900;text-align:center">Pagamento em breve: a compra ainda não está disponível.</span>'}</div>
        ${premP?`<button class="p-prem lil" data-x="buyprem" aria-label="Comprar ${esc2(premP.name)}: ${esc2(xBuyPrice(premP.id))}" style="position:relative;overflow:hidden;height:52px;border-radius:14px;font-size:18px;padding:0 8px;white-space:nowrap">Ativar · ${esc2(xBuyPrice(premP.id))}</button>`:''}
        <button class="lil" data-x="cfno" style="height:50px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:18px;padding:0">Fechar</button></div></div>`:''}`);
  XP.anim=false; XP.lvfx=false; XP.scKey=scKey;
  { const sc1=document.getElementById('xp_sc'); if(sc1){ if(first&&SC&&!isMs) pScrollCur(sc1,CUR); else if(scTop) sc1.scrollTop=scTop; } }   /* abertura: trilha no nível atual; redesenho: a rolagem fica onde estava */
  if(XP.toast&&Date.now()-XP.toastT<1600) pToast(XP.toast);
}
function pClick(b){ const a=b.dataset.x, P=Sys.pass;
  if(a==='close'){ snd('ui_tap'); Screens.close(); }
  else if(a==='tab'){ if(b.dataset.t!=='mis'&&!xUnlocked('pass')) return; snd('ui_tap'); passTab=b.dataset.t; XP.anim=true; render(); }   /* também é o "Voltar ao Passe" das Missões (data-t="pass") */
  else if(a==='mis'){ snd('ui_tap'); if(pMisScreen()&&pMisOpen()) return;   /* tela 34 ligada e aberta: pronto */
    if(typeof view!=='undefined'&&view!=='pass') return;   /* outra tela ficou na frente: não desenha por cima */
    passTab='mis'; XP.anim=true; render(); }   /* sem a tela 34 (ou desviada pelo setView): a lista de missões daqui (título "Missões", com o Voltar ao Passe em cima) */
  else if(a==='mt'){ snd('ui_tap'); XP.mt=b.dataset.m; XP.mpage=0; XP.anim=true; render(); }
  else if(a==='pg'){ const p=XP.page+(+b.dataset.d); if(p>=0&&p<(XP.pages||1)){ snd('ui_tap'); XP.page=p; XP.anim=true; render(); } }
  else if(a==='mpg'){ const p=XP.mpage+(+b.dataset.d); if(p>=0&&p<(XP.mpages||1)){ snd('ui_tap'); XP.mpage=p; XP.anim=true; render(); } }
  else if(a==='askprem'){ snd('ui_tap'); XP.cf=true; render(); }
  else if(a==='cfno'){ snd('ui_tap'); XP.cf=false; render(); }
  /* "Ativar Premium" pelo Sys.buy (o botão só existe com Sys.buy.ready() verdadeiro; produto do catálogo, kind 'pass_premium'): quem liga o Premium é a entrega do módulo */
  else if(a==='buyprem'){ snd('ui_tap'); const pp=pPremProd(); if(!pp){ pToast('Pagamento em breve: nada é cobrado agora'); return; }
    xBuy(pp.id,(r,p)=>{ if(r&&r.ok){ XP.cf=false; snd('claim'); try{ if(typeof passSync==='function') passSync(); }catch(e){} } if(typeof view!=='undefined'&&view==='pass') render(); pToast(r&&r.ok?'Passe Premium ativado':xBuyMsg(r,p)); }); }
  else if(a==='all'){ const els={}, sc=pScrollOn()?document.getElementById('xp_sc'):null; pPending().forEach(([t,l])=>{ const e=document.getElementById('xp_'+t+l); if(e&&pVisible(e,sc)) els[t+l]=e; }); pAfterClaim(P.claimAll(S,Sys.host),els); }
  else if(a==='claim'){ const t=b.dataset.t, lv=+b.dataset.lv, o=P.ensure(S), reached=lv<=P.tier(S);
    if(t==='premium'&&!o.premium){ snd('ui_tap'); XP.cf=true; render(); return; }
    if(!reached||(t==='free'?o.free:o.prem).includes(lv)){ snd('ui_tap'); pToast(!reached?'Libera no nível '+lv+' do passe':'Recompensa já resgatada'); return; }
    const els={}; els[t+lv]=b; pAfterClaim(pClaimOne(t,lv),els); }
  else if(a==='mclaim'){ const id=b.dataset.id, daily=id==='bonus'||P.DATA.daily.some(x=>x.id===id), r=P.claimMission(S,Sys.host,id); if(!r.ok){ snd('ui_tap'); return; }
    snd('claim'); if(r.gems) yFly(b,'gem',0); if(r.tierUp){ setTimeout(()=>snd('upgrade'),250); XP.lvfx=true; XP.page=-1; }
    try{ if(daily&&Sys.level){ const lr=id==='bonus'?Sys.level.onDailyBonus(S,Sys.host):Sys.level.onMission(S,Sys.host); if(lr&&lr.levels>0) onLevelUp(lr); } }catch(e){}   /* missão diária também dá XP do JOGADOR (Sys.level) */
    save(); hud(); render(); pToast('+'+r.xp+' XP do passe'+(r.tierUp?' · Nível do passe '+r.tier+'!':'')); }
  else if(a==='mgo'){ snd('ui_tap'); setView(P_GO[b.dataset.ev]||'battle'); }
}

/* ======================================================================= 16 PRÁTICAS E TÍTULOS ======================================================================= */
const XR={tab:'prac',filter:'all',page:0,anim:true,rowFx:null,floatTxt:'',banner:'',bannerT:0,fresh:null,newDot:false,back:'gear',busy:false,stFx:0};
const R_COL={str:'#ff8a5c',vit:'#5fd068',crit:'#ffc94a',def:'#4aa3ff',gold:'#ffe07a'}, R_UNIT={str:'% ATK',vit:'% HP',crit:' pt crítico',def:'% defesa',gold:'% ouro'};
const R_ICON={str:'<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"></polyline><line x1="13" y1="19" x2="19" y2="13"></line><line x1="16" y1="16" x2="20" y2="20"></line>',
  vit:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"></path>',
  crit:'<circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="4"></circle><line x1="12" y1="1" x2="12" y2="5"></line><line x1="12" y1="19" x2="12" y2="23"></line>',
  def:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>'};
const pracLocked=()=>!!(Sys.level&&Sys.level.isUnlocked&&!Sys.level.isUnlocked(S,'practice'));
const pracNeed=()=>Sys.level&&Sys.level.unlockLevel?Sys.level.unlockLevel('practice'):5;
/* há algo para fazer na tela? (ponto vermelho no botão "Progresso" do Equipamento) */
function progAlert(){ try{ if(XR.newDot) return true; if(pracLocked()) return false; return Sys.practice.DATA.tracks.some(t=>Sys.practice.canTrain(S,Sys.host,t.id).ok); }catch(e){ return false; } }
/* pedra de prática caiu (abate): com a tela aberta, o contador sobe com "+1" */
function progStone(n){ if(view!=='prog'||XR.tab!=='prac') return; const el=document.getElementById('xr_st'); if(!el) return; el.textContent=n0(Sys.practice.ensure(S).stones); el.classList.remove('r-popn'); void el.offsetWidth; el.classList.add('r-popn');
  const f=document.getElementById('xr_stf'); if(f) f.innerHTML=`<span class="r-float lil" style="position:absolute;left:28px;top:-10px;font-size:15px;color:#8fc7ff;text-shadow:0 2px 0 #000">+${n}</span>`; }
/* título novo (Sys.titles.check): aviso na tela 16, ou ponto vermelho até o jogador abrir a aba */
function progFresh(fresh){ const t=fresh[fresh.length-1]; XR.fresh=t.id; if(view==='prog'){ rBanner(fresh.length===1?'Novo título: '+t.name+'!':fresh.length+' novos títulos!'); snd('legendary'); XR.newDot=XR.tab!=='tit'; render(); } else XR.newDot=true; }
function rBanner(txt){ XR.banner=txt; XR.bannerT=Date.now(); }
function rCond(t){ const c=t.cond, T=Sys.titles, n=T.need(S,Sys.host,c);
  if(c.type==='weaponEras') return 'Armas de '+n+' eras, só ITEM (skin não conta)'; if(c.type==='weapons') return 'As '+n+' armas como ITEM (skin não conta)';
  if(c.type==='era') return 'Liberar a '+(ERAS[n]?ERAS[n].n:'era '+n); if(c.type==='kills') return 'Derrotar '+n0(n)+' inimigos'; if(c.type==='skins') return n+' skins de arma ou roupa';
  return T.condLabel(S,Sys.host,t); }
function scrProg(){
  if(typeof SYS_E2==='undefined'||!SYS_E2){ V.innerHTML=''; return; }
  const d=xDims(622), H=d.H, P=Sys.practice, T=Sys.titles, lvP=plv(), isP=XR.tab==='prac';
  const tabs=[['prac','Práticas'],['tit','Títulos']].map(x=>{ const on=XR.tab===x[0]; return `<button data-x="tab" data-t="${x[0]}" aria-pressed="${on}" style="position:relative;flex:1;height:44px;padding:0 12px;border-radius:11px;border:0;background:${on?'#3a2c1f':'transparent'};color:${on?'#ffc94a':'#c9b9a2'};font-size:14px;font-weight:900">${x[1]}${x[0]==='tit'&&XR.newDot?'<span aria-hidden="true" style="position:absolute;top:3px;right:3px;width:8px;height:8px;border-radius:50%;background:#ff4d3d"></span>':''}</button>`; }).join('');
  let pane='';
  if(isP){
    const o=P.ensure(S), cap=P.capOf(Sys.host), lock=pracLocked(), need=pracNeed(), b=P.bonus(S); let anyCan=false;
    const rows=P.DATA.tracks.map((t,i)=>{ const lv=o.lv[t.id], full=lv>=cap, c=P.canTrain(S,Sys.host,t.id), can=c.ok, col=R_COL[t.id]||'#ffc94a', un=R_UNIT[t.id]||t.unit, fx=XR.rowFx===t.id; if(can) anyCan=true;
      return `<div class="r-row ${fx?'r-rowup':''}" style="position:relative;height:80px;flex:none;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;box-sizing:border-box;animation-delay:${(i*0.06).toFixed(2)}s;${lock?'opacity:.55':''}">
        <div style="width:48px;height:48px;flex:none;border-radius:14px;background:radial-gradient(circle at 50% 40%,#4a3a2b,#120d0a);border:2px solid ${col};display:flex;align-items:center;justify-content:center;color:${col}">${t.id==='gold'?'<img src="assets/ui/coin.png" alt="" style="width:34px;height:34px;object-fit:contain">':`<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${R_ICON[t.id]||R_ICON.str}</svg>`}</div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;align-items:baseline;gap:6px"><span class="lil" style="font-size:17px">${esc2(t.name)}</span><span class="${fx?'r-popn':''}" style="font-size:12px;font-weight:900;color:${full?'#5fd068':'#ffc94a'}">Nv ${lv}/${cap}</span></div>
          <div style="height:10px;border-radius:5px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden"><div class="r-bar r-barf" style="width:${Math.round(lv/cap*100)}%;height:100%;background:linear-gradient(90deg,${col},#ffe07a)"></div></div>
          <span style="font-size:12px;font-weight:800;color:#c9b9a2;white-space:nowrap">+${f1c(lv*t.per)}${un} <span style="color:#5fd068">${full?'· máximo da era':'→ +'+f1c((lv+1)*t.per)+un}</span></span></div>
        <button class="r-tbtn ${can?'y-gold r-pulse':''}" data-x="train" data-id="${t.id}" aria-label="${lock?'Práticas: libera no nível '+need:full?esc2(t.name)+' no teto da era':'Treinar '+esc2(t.name)+' por '+c.cost+' pedras de prática'}" style="width:88px;height:44px;flex:none;border-radius:12px;${can?'box-shadow:0 5px 0 #8a4f0c;':'border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2;'}padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1">
          <span class="lil" style="font-size:15px">${lock?'Nível '+need:full?'Máx.':'Treinar'}</span><span style="font-size:11px;font-weight:900">${lock?'bloqueado':full?'teto da era':c.cost+' pedras'}</span></button>
        ${fx?`<span class="r-float lil" style="position:absolute;right:108px;top:6px;font-size:18px;color:#5fd068;text-shadow:0 2px 0 #000">${esc2(XR.floatTxt)}</span>`:''}</div>`; }).join('');
    pane=`<div class="r-pane" style="flex:1 0 auto;display:flex;flex-direction:column;gap:8px;position:relative">
      <div style="height:48px;flex:none;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:14px;background:#1d1611;border:1px solid #4a3a2b">
        <div style="position:relative;display:flex;align-items:center;gap:6px">${Y_STONE(26)}<div style="display:flex;flex-direction:column;line-height:1.05"><span class="lil" id="xr_st" style="font-size:19px">${n0(o.stones)}</span><span style="font-size:10px;font-weight:800;color:#c9b9a2">Pedras de prática</span></div><span id="xr_stf"></span></div>
        <div style="flex:1"></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.15"><span style="font-size:13px;font-weight:900">Teto Nv ${cap} <span style="color:#c9b9a2;font-weight:800">· ${ERAS[S.eraMax].n}</span></span><span style="font-size:11px;font-weight:800;color:#c9b9a2">+${P.DATA.cap.perEra} níveis a cada era liberada</span></div></div>
      <div style="flex:1 0 auto;display:flex;flex-direction:column;gap:8px;position:relative">${rows}
        ${lock?`<div style="position:absolute;left:40px;right:40px;top:120px;padding:14px 12px;border-radius:16px;background:rgba(14,10,7,.95);border:2px solid #ffc94a;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center;box-shadow:0 0 22px rgba(0,0,0,.7)"><span class="r-lockp" style="color:#ffc94a;display:flex">${SVG_LOCK(34,'#ffc94a')}</span><span class="lil" style="font-size:20px;color:#ffc94a">Libera no nível ${need}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">Você está no nível ${lvP}. As pedras de prática que caem ficam guardadas.</span></div>`:''}</div>
      <div style="height:56px;flex:none;display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:56px;display:flex;flex-direction:column;justify-content:center;padding:0 12px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;line-height:1.25;box-sizing:border-box;min-width:0"><span style="font-size:11px;font-weight:800;color:#c9b9a2">Total das práticas</span>
          <span style="font-size:13px;font-weight:900;line-height:1.2">+${f1c(b.atkPct)}% ATK · +${f1c(b.hpPct)}% HP · +${f1c(b.critPct)} crít. · +${f1c(b.defPct)}% def. · +${f1c(b.goldPct)}% ouro</span></div>
        <button class="lil ${anyCan?'y-gold':''}" data-x="trainall" aria-label="Treinar o máximo possível" style="width:96px;height:56px;border-radius:14px;${anyCan?'box-shadow:0 5px 0 #8a4f0c;':'border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2;'}font-size:17px;line-height:1.05;padding:0">Treinar<br>máx.</button></div></div>`;
  } else {
    const o=T.ensure(S), feat=T.featured(S), all=T.DATA.titles.map(t=>({t,w:!!o.unlocked[t.id],p:T.progress(S,Sys.host,t)}));
    all.sort((a,b)=>(b.w?1:0)-(a.w?1:0)||b.p.frac-a.p.frac);
    const fl=all.filter(x=>XR.filter==='all'||(XR.filter==='won'?x.w:!x.w)), PERP=8, pages=Math.max(1,Math.ceil(fl.length/PERP)); XR.page=Math.max(0,Math.min(pages-1,XR.page)); XR.pages=pages;
    const lvOf=f=>Sys.level&&Sys.level.unlockLevel?Sys.level.unlockLevel(f):1;
    const cards=fl.slice(XR.page*PERP,XR.page*PERP+PERP).map(({t,w,p},i)=>{ const cos=!!t.cosmetic, isF=!!feat&&feat.id===t.id, fresh=XR.fresh===t.id, ty=t.cond.type;
      const gate=ty==='arena'?lvOf('arena'):ty==='tower'?lvOf('tower'):0, gl=gate>lvP;
      const prog=gl?'Libera no nível '+gate:ty==='arena'?'sem ranking':n0(Math.min(p.cur,p.need))+'/'+n0(p.need), bon=T.bonusText(t,1);
      return `<button class="r-card r-row ${w?'r-won ':''}${isF?'r-feat ':''}${fresh?'r-unlock':''}" data-x="title" data-id="${t.id}" aria-label="${esc2(t.name)}, ${w?'conquistado':'bloqueado'}, ${esc2(bon)}, ${esc2(rCond(t))}${isF?', em destaque':''}" style="position:relative;min-height:0;border-radius:14px;border:2px solid ${isF?'#ffc94a':w?(cos?'#b07cff':'#c9973a'):'#4a3a2b'};background:${w?'linear-gradient(180deg,#3a2c1f,#241a12)':'#1a140f'};padding:7px 9px;display:flex;flex-direction:column;align-items:stretch;gap:3px;text-align:left;color:#f6ecdf;box-sizing:border-box;animation-delay:${(i*0.04).toFixed(2)}s">
        <span style="display:flex;align-items:center;gap:6px">${w?`<svg width="18" height="20" viewBox="0 0 24 28" aria-hidden="true" style="flex:none"><path d="M7 1h10l-3 8h-4z" fill="${cos?'#4aa3ff':'#ff5a4e'}"></path><circle cx="12" cy="17" r="8" fill="${cos?'#b07cff':'#ffc94a'}" stroke="#16110d" stroke-width="1.4"></circle></svg>`:`<span style="flex:none;display:flex">${SVG_LOCK(16,'#c9b9a2')}</span>`}
          <span class="lil" style="flex:1;min-width:0;font-size:14px;line-height:1.1;color:${w?'#f6ecdf':'#c9b9a2'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(t.name)}</span>
          ${isF?'<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc94a" aria-hidden="true" style="flex:none"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"></path></svg>':''}</span>
        <span style="font-size:12px;font-weight:900;color:${cos?'#d4b8ff':w?'#5fd068':'#a9d9ad'}">${esc2(bon)}</span>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.15">${esc2(rCond(t))}</span><span style="flex:1"></span>
        ${w?`<span style="font-size:11px;font-weight:900;color:${isF?'#ffc94a':'#c9b9a2'}">${isF?'Em destaque (x'+T.DATA.featuredMult+')':cos?'Cosmético, sem destaque':'Toque para destacar'}</span>`
          :`<span style="display:flex;align-items:center;gap:6px"><span style="flex:1;height:7px;border-radius:4px;background:#0e0a07;overflow:hidden"><span class="r-bar" style="display:block;width:${Math.round(p.frac*100)}%;height:100%;background:${p.frac>0.9?'linear-gradient(90deg,#ffc94a,#ffe07a)':'#6a5440'}"></span></span><span style="font-size:10px;font-weight:900;color:#e8dccb;white-space:nowrap">${prog}</span></span>`}</button>`; }).join('')
      ||'<div style="grid-column:1/-1;grid-row:1/-1;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#c9b9a2;text-align:center">Nenhum título aqui ainda. Vença fases e chefes para conquistar o primeiro.</div>';
    const filters=[['all','Todos'],['won','Conquistados'],['lock','Bloqueados']].map(f=>{ const on=XR.filter===f[0]; return `<button data-x="filter" data-f="${f[0]}" aria-pressed="${on}" style="flex:1;height:44px;border-radius:9px;border:0;background:${on?'#3a2c1f':'transparent'};color:${on?'#ffc94a':'#c9b9a2'};font-size:13px;font-weight:900;padding:0">${f[1]}</button>`; }).join('');
    const dots=Array.from({length:pages},(_,i)=>`<span style="width:${i===XR.page?22:8}px;height:8px;border-radius:4px;background:${i===XR.page?'#ffc94a':'#4a3a2b'};transition:width .2s"></span>`).join('');
    pane=`<div class="r-pane" style="flex:1 0 auto;display:flex;flex-direction:column;gap:8px">
      <div class="r-feat" style="height:56px;flex:none;display:flex;align-items:center;gap:10px;padding:0 12px;border-radius:14px;background:linear-gradient(180deg,#3a2c1f,#241a12);border:2px solid #ffc94a;box-sizing:border-box">${Y_MEDAL(30,34,true)}
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:1px">EM DESTAQUE · VALE x${T.DATA.featuredMult}</span><span class="lil" style="font-size:17px;color:#ffc94a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${feat?esc2(feat.name):'Nenhum'}</span></div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.15"><span style="font-size:13px;font-weight:900;color:#5fd068;white-space:nowrap">${feat?esc2(T.bonusText(feat,T.DATA.featuredMult)):''}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${Object.keys(o.unlocked).length}/${T.DATA.titles.length} conquistados</span></div></div>
      <div role="group" aria-label="Filtro" style="height:52px;flex:none;display:flex;padding:3px;gap:3px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">${filters}</div>
      <div style="flex:1 0 auto;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(4,minmax(100px,1fr));gap:8px">${cards}</div>
      ${xPager('pg',XR.page,pages)}</div>`;
  }
  const ban=XR.banner&&Date.now()-XR.bannerT<2500;
  V.innerHTML=xWrap(d,XR.anim?'r-in':'',`<div class="x-scroll" style="position:relative;flex:1;display:flex;flex-direction:column;gap:8px;padding:8px 12px 10px;box-sizing:border-box;min-height:0">
    <div style="height:52px;flex:none;display:flex;align-items:center;gap:8px">
      <div role="group" aria-label="Seção" style="flex:1;display:flex;height:52px;padding:3px;gap:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">${tabs}</div></div>
    ${pane}
    ${ban?`<div class="r-banner" style="position:absolute;left:0;right:0;top:230px;display:flex;justify-content:center;z-index:5"><div style="position:relative;width:300px;height:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px"><div class="r-rays" style="left:50px;top:-50px;width:200px;height:200px"></div><span style="position:relative;display:flex">${Y_MEDAL(54,62,true)}</span><span class="lil" style="position:relative;padding:6px 14px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ffc94a;font-size:18px;color:#ffc94a;text-align:center">${esc2(XR.banner)}</span></div></div>`:''}</div>`);
  XR.anim=false; if(XR.fresh&&!isP){ /* o brilho de "novo" toca uma vez */ setTimeout(()=>{ XR.fresh=null; },1500); }
}
function rAfter(rowId,txt,banner){ XR.rowFx=rowId; XR.floatTxt=txt||''; if(banner) rBanner(banner); XR.busy=true; statsChanged();
  try{ const fr=Sys.titles.check(S,Sys.host,{silent:true}); if(fr&&fr.length){ XR.fresh=fr[fr.length-1].id; XR.newDot=true; rBanner('Novo título: '+fr[fr.length-1].name+'!'); statsChanged(); } }catch(e){}
  render(); { const el=document.getElementById(document.body.classList.contains('fb')?'fb_fc':'fcv'); if(el){ el.classList.remove('y-bump'); void el.offsetWidth; el.classList.add('y-bump'); } }
  clearTimeout(XR.fxT); XR.fxT=setTimeout(()=>{ XR.rowFx=null; XR.busy=false; },1000); }
function rClick(b){ const a=b.dataset.x, P=Sys.practice, T=Sys.titles;
  if(a==='back'){ snd('ui_tap'); Screens.close(); }
  else if(a==='tab'){ snd('ui_tap'); XR.tab=b.dataset.t; if(XR.tab==='tit') XR.newDot=false; XR.anim=true; XR.rowFx=null; render(); }
  else if(a==='filter'){ snd('ui_tap'); XR.filter=b.dataset.f; XR.page=0; XR.anim=true; render(); }
  else if(a==='pg'){ const p=XR.page+(+b.dataset.d); if(p>=0&&p<(XR.pages||1)){ snd('ui_tap'); XR.page=p; XR.anim=true; render(); } }
  else if(a==='train'){ const t=P.DATA.tracks.find(x=>x.id===b.dataset.id), r=P.train(S,Sys.host,b.dataset.id,1);
    if(!r.ok){ snd('ui_tap'); let m='Libera no nível '+pracNeed(); if(r.reason!=='locked'){ let full=false, cost=0; try{ full=P.ensure(S).lv[b.dataset.id]>=P.capOf(Sys.host); cost=P.canTrain(S,Sys.host,b.dataset.id).cost; }catch(e){} m=full?'No teto da era: avance de era para treinar mais':'Faltam pedras de prática'+(cost?': custa '+cost:''); } rBanner(m); render(); return; }   /* nunca mudo: diz o motivo */
    snd('claim'); rAfter(t.id,'+'+f1c(t.per)+(R_UNIT[t.id]||t.unit)); }
  else if(a==='trainall'){ let n=0, guard=0;   /* treina sempre a trilha mais barata que couber (como no canvas) */
    while(guard++<2000){ let best=null, bc=Infinity; for(const t of P.DATA.tracks){ const c=P.canTrain(S,Sys.host,t.id); if(c.ok&&c.cost<bc){ bc=c.cost; best=t.id; } } if(!best||!P.train(S,Sys.host,best,1).ok) break; n++; }
    if(!n){ snd('ui_tap'); rBanner(pracLocked()?'Libera no nível '+pracNeed():'Nada para treinar agora: faltam pedras ou está no teto da era'); render(); return; }
    snd('claim'); rAfter(null,'','+'+n+(n===1?' nível de prática':' níveis de prática')); }
  else if(a==='title'){ const id=b.dataset.id, t=T.DATA.titles.find(x=>x.id===id), f=T.featured(S);
    if(!t||!T.isUnlocked(S,id)||t.cosmetic||(f&&f.id===id)){ snd('ui_tap'); if(t){ rBanner(!T.isUnlocked(S,id)?'Bloqueado: '+rCond(t):t.cosmetic?'Título cosmético: não entra em destaque':'Este título já está em destaque'); render(); } return; }
    if(T.setFeatured(S,id)){ snd('claim'); XR.fresh=null; rAfter(null,'','Destaque: '+t.name+' (x'+T.DATA.featuredMult+')'); } }
}

/* ======================================================================= 10 VITÓRIA / DERROTA DO CHEFE (chave SCREENS_ON.bossResult, index.html) =======================================================================
   Fonte APROVADA pelo dono: docs/proto/ResultadoChefe.dc.html (versão refeita). A tela abre POR CIMA da batalha (que espera: step() não anda com
   B.res) e não redesenha ninguém: o chefe e o Kael são os do canvas. O HUD da batalha some enquanto ela está aberta (body.resui, CSS no topo).
   VITÓRIA: a morte aprovada do chefe toca INTEIRA no canvas (a tela não segura mais o corpo: ele some no fim da folha, como no protótipo); só
   depois vêm o baú no lugar do chefe, as moedas até o contador, o letreiro, os cartões um a um e o "Continuar". "Pular" (ou um toque fora dos
   botões) mostra tudo na hora. O saque JÁ foi creditado no abate (Sys.loot.onKill): a tela só mostra o que veio em o.loot.
   DERROTA: título, FC sua x recomendada, 3 caminhos (Forja, Equipamento, Invocar: caminho não liberado NÃO aparece), "Modo farm" (botão
   principal, com a contagem) e "Tentar de novo".
   O jogo é só automático: a tela nunca trava o jogo. Vitória: segue sozinha RES_AUTO_NEXT s depois de o "Continuar" aparecer. Derrota: entra no
   modo farm sozinha RES_AUTO_FARM s depois de os botões aparecerem. Qualquer toque na tela cancela a contagem. */
const RES={el:null,mode:'',o:null,t:0,ev:[],ei:0,end:false,auto:-1,autoOn:true,cards:[],geo:null,lay:null,gain:0,g0:0,cnt:-1,bt:0,bm:false,xpAt:-1,conf:false,fc:0,rec:0,fcK:-1,sub:''};
const RES_AUTO_NEXT=4, RES_AUTO_FARM=10, RES_LOSE_BTN=1.7, RES_LOSE_PATH=1.1, RES_LOSE_H=392, RES_DEATH_MAX=3;
/* moedas do baú (protótipo): [desvio x do pouso em relação ao baú, altura do arco, y do pouso em relação à linha do chão] */
const RES_COINS=[[-150,-150,-16],[-122,-190,-20],[-96,-130,-12],[-70,-210,-18],[-44,-160,-14],[-18,-230,-20],[14,-180,-12],[40,-140,-18],[62,-200,-14],[80,-120,-20],[-134,-110,-10],[-58,-240,-16]];
const RES_CONF=[[22,'#ffc94a',3.2,0],[64,'#4aa3ff',3.8,.5],[108,'#ff4d6d',3,.2],[150,'#5fd068',3.6,1.1],[196,'#ffe07a',3.3,.7],[238,'#b45cff',3.9,.3],[282,'#ffc94a',3.1,1.4],[322,'#4aa3ff',3.5,.9],[362,'#ff4d6d',3.4,.1]];
const Q_STAR='M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5-6.5 4.5 2-7.5L2 9h7z';
const Q_ESS='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l7 10-7 10-7-10z" fill="#c9a4ff" stroke="#3a1f6a" stroke-width="1.6" stroke-linejoin="round"></path><path d="M12 2l-2.5 10L12 22" fill="none" stroke="#fff" stroke-width="1.2" opacity=".6"></path></svg>';
const Q_CHEV=s=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>`;
const resEl=id=>document.getElementById(id);
function resAdd(id,html){ const el=resEl(id); if(el) el.insertAdjacentHTML('beforeend',html); }
/* NOME DO CHEFE: o mesmo que a batalha mostra = nome próprio de assets/enemies/meta.json pela chave do inimigo (ex.: era0_boss = "Rex Furioso");
   sem ele, o nome do tipo (kindName). */
const Q_FOOD='<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11h16a8 8 0 0 1-16 0z" fill="#c98a4a" stroke="#2a1f16" stroke-width="1.6" stroke-linejoin="round"></path><path d="M8 9.5c0-2 1.6-3 4-3s4 1 4 3" fill="#e8b56a" stroke="#2a1f16" stroke-width="1.6"></path></svg>';   /* tigela de ração (desenhada) */
function resBossName(b){ let nm=''; try{ const own=b&&b.key&&typeof era9Name==='function'?era9Name(b.key):null; if(own) return own; }catch(e){}   /* eras 7-8: nome próprio do chefe (js/eras9.js) */ try{ if(b&&b.key&&typeof J==='function') nm=((J('assets/enemies/meta.json')||{})[b.key]||{}).name||''; }catch(e){} return nm||(b&&b.kindName)||''; }
function resBoss(mode){ let e=null; if(mode==='win'){ for(const c of B.corpses) if(c.e.boss) e=c.e; } else e=B.en.find(x=>x.boss)||null; return e; }
/* medidas na base de 390: linha do chão, lado do quadro do Kael, x do Kael e do chefe. Sem medida real do canvas vale a tela inteira (batalha em tela cheia). */
function resGeo(boss){ const app=resEl('app'), W=app.clientWidth||390, H=app.clientHeight||844, s=W/390, Hb=H/s; let cw=W, ct=0, cl=0;
  try{ const cr=cv.getBoundingClientRect(), ar=app.getBoundingClientRect(); if(cr.width>W*0.5){ cw=cr.width; ct=cr.top-ar.top; cl=cr.left-ar.left; } }catch(er){}
  const k=cw/LW, X=x=>(cl+x*k)/s;
  return {s,Hb,feet:(ct+GY*k)/s,hs:HS*k/s,hx:X(HX),bx:Math.max(70,Math.min(320,X(boss&&boss.x>0?boss.x:LW*0.77)))}; }
/* o bloco de cima nunca cobre o Kael: se faltar altura ele sobe (arranjo compacto) e encolhe a partir do topo.
   Vitória: letreiro em 108 e cartões em 232 (protótipo); compacto = contador de moedas na linha do topo, letreiro em 58, cartões em 154.
   Derrota: bloco em 74 (protótipo) ou 64; o limite é o Kael CAÍDO (o chefe fica atrás do escuro, como no protótipo). */
function resLay(mode,G,cardsH){
  if(mode==='win'){ const avail=G.feet-G.hs*0.92-4, compact=232+cardsH>avail, top=compact?154:232;
    return {compact,top,f:compact?Math.max(0.72,Math.min(1,(avail-top)/Math.max(1,cardsH))):1,tt:compact?58:108,th:compact?92:110,cx:compact?292:30,cy:compact?35:86}; }
  const LH=RES_LOSE_H+(cardsH||0);   /* Derrota: cardsH = altura a mais (ou a menos) do quadro do Sys.bossLoss no lugar do "Fique mais forte"; 0 = a tela de hoje */
  const avail=G.feet-G.hs*0.55-10, fit=74+LH<=avail, top=fit?74:64;
  return {compact:!fit,top,f:fit?1:Math.max(0.7,Math.min(1,(avail-top)/LH)),low:G.Hb-156<G.feet+6}; }
const resCardsH=()=>RES.cards.reduce((a,c)=>a+c.h,0)+8*Math.max(0,RES.cards.length-1);
/* DERROTA: o Kael fica caído e visível enquanto a tela está aberta (protótipo). O canvas desenha o herói tombado e a cena escura sem letreiro
   quando B.deadT > 0 com B.deadBoss ligado (js/battle.js: HM.deadP e o véu da derrota); com B.res o step() não anda, então o valor fica parado em
   0,8 (deadP = 0,5: tombado, ainda opaco). resClose devolve os dois campos antes de recomeçar a luta. */
function resHeroDown(on){ if(typeof heroDown==='function') heroDown(!!on); else { B.deadT=on?0.8:0; B.deadBoss=!!on; } }   /* fonte única: heroDown(on) do js/battle.js (pedido A-20); o corpo antigo é só reserva */
const resEggR=x=>Math.max(0,Math.min(4,(x&&typeof x==='object'?(x.r!=null?x.r:(x.egg&&x.egg.r)):x)|0));
/* cartões da vitória, na ordem do protótipo: moedas (com as gemas da fase), XP, extras (ovos, pedras, essência: só se vieram) e o item de maior raridade */
function resLoot(o){ const L=o.loot||{}, n=v=>Math.max(0,Math.round(+v||0)), cards=[], gold=n(L.gold), gems=n(o.gems)+n(L.gems), xp=n(L.xp);
  if(gold||gems) cards.push({k:'gold',h:62,gold,gems});
  if(xp){ let lv='', f1=1, f0=1, up=false; try{ const p=Sys.level.progress(S); up=!!(L.levelUp&&L.levelUp.to>L.levelUp.from); lv='Nv. '+p.lvl; f1=p.max?1:Math.max(0,Math.min(1,p.frac)); f0=p.max?1:up?0:Math.max(0,f1-(p.need?xp/p.need:0)); }catch(er){}
    cards.push({k:'xp',h:62,xp,lv,f0,f1,up}); }
  const ex=[], egg=(g,note)=>{ if(g&&typeof g==='object'&&g.ok===false) return; const r=resEggR(g); ex.push({ic:Y_EGG(22,RC[r]||'#e8e2d8'),r,tx:'Ovo '+RN(r),note}); };
  for(const g of Array.isArray(L.eggs)?L.eggs:[]) egg(g,'');
  for(const hd of Array.isArray(L.held)?L.held:[]) egg(hd,hd&&hd.needLevel?'guardado até o nível '+hd.needLevel:'guardado');
  /* QA no S24: com ovo + pedras + ração a linha passava da largura e era cortada. Com 3 ou mais prêmios o texto fica curto (tx2); o ícone e o aria dizem o resto */
  if(n(L.forge)) ex.push({ic:Y_STONE(20),tx:'+'+gNum(n(L.forge))+(n(L.forge)===1?' pedra de forja':' pedras de forja'),tx2:'+'+gNum(n(L.forge))+(n(L.forge)===1?' pedra':' pedras')});
  if(n(L.essence)) ex.push({ic:Q_ESS,tx:'+'+gNum(n(L.essence))+' de essência',tx2:'+'+gNum(n(L.essence))+' essência'});
  if(n(L.astral)) ex.push({ic:Y_STONE(20),tx:'+'+gNum(n(L.astral))+(n(L.astral)===1?' pedra astral':' pedras astrais'),tx2:'+'+gNum(n(L.astral))+' astral'});   /* Sys.erasEnd: fases acima da 90 */
  if(n(L.food)) ex.push({ic:Q_FOOD,tx:'+'+gNum(n(L.food))+' de ração de pet',tx2:'+'+gNum(n(L.food))+' ração'});
  if(ex.length>=3) for(const x of ex){ if(x.tx2){ x.full=x.tx; x.tx=x.tx2; } }
  if(ex.length) cards.push({k:'extra',h:46,ex});
  const its=Array.isArray(L.items)?L.items.filter(x=>x&&SLOT[x.slot]):[];
  if(its.length){ const it0=its.slice().sort((a,b)=>b.r-a.r)[0], ni=normItem(it0), mine=S.inv.filter(x=>x.slot===it0.slot&&x.r===it0.r&&x.e===it0.e).pop(), eq=mine&&S.eq[mine.slot]===mine.id; let sw=0; try{ if(mine&&!eq) sw=Sys.fc.itemFC(S,Sys.host,mine).swap; }catch(er){}
    cards.push({k:'item',h:100,r:ni.r,slot:ni.slot,e:ni.e,nm:iname(ni),sub:SLOT[ni.slot].n+' · '+ERAS[ni.e].n,st:eq?'Equipado':sw>0.5?'Melhor que o seu':'',more:its.length-1}); }
  return cards; }
/* HTML de um cartão (fast = sem a animação de entrada e com a barra de XP já no valor final: "Pular") */
function resCardHtml(c,fast){ const cls=fast?'':'q-card', base='flex:none;box-sizing:border-box;display:flex;align-items:center;background:rgba(29,22,17,.95)';
  if(c.k==='gold'){ const g='+'+gNum(c.gold);
    return `<div class="${cls}" style="${base};height:62px;border-radius:16px;border:2px solid #ffc94a;box-shadow:0 0 18px rgba(255,201,74,.35);gap:10px;padding:0 14px">
      <img class="q-cspin" src="assets/ui/coin.png" alt="" style="width:40px;height:40px;flex:none;object-fit:contain">
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.1"><span class="lil" style="font-size:${g.length>8?19:24}px;color:#ffe07a;white-space:nowrap">${g}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2;white-space:nowrap">Moedas de ouro</span></span>
      ${c.gems?`<span role="img" aria-label="Mais ${gNum(c.gems)} gemas" style="flex:none;height:32px;padding:0 9px 0 5px;border-radius:16px;background:#16110d;border:2px solid #4aa3ff;display:flex;align-items:center;gap:4px;box-sizing:border-box"><img src="assets/ui/gem.png" alt="" style="width:20px;height:20px;object-fit:contain"><span class="lil" style="font-size:16px;color:#9fd0ff">+${gNum(c.gems)}</span></span>`:''}
      <span style="flex:none;font-size:12px;font-weight:900;color:#c9b9a2;text-align:right;line-height:1.2">Total<br><span style="color:#f6ecdf;font-size:14px">${gNum(S.gold)}</span></span></div>`; }
  if(c.k==='xp'){ const p0=Math.round((fast?c.f1:c.f0)*100), p1=Math.round(c.f1*100), x='+'+gNum(c.xp)+' XP';
    return `<div class="${cls}" style="${base};height:62px;border-radius:16px;border:2px solid #5fd068;gap:12px;padding:0 14px">
      <svg class="q-wob" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true" style="flex:none"><circle cx="20" cy="20" r="18" fill="#1f4a22" stroke="#5fd068" stroke-width="3"></circle><path d="M20 8l3.4 7.6 8.1.7-6.2 5.3 1.9 8-7.2-4.4-7.2 4.4 1.9-8-6.2-5.3 8.1-.7z" fill="#c4f27a"></path></svg>
      <span style="min-width:78px;flex:none;display:flex;flex-direction:column;line-height:1.1"><span class="lil" style="font-size:${x.length>8?19:24}px;color:#9be89f;white-space:nowrap">${x}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">Kael</span></span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px"><span style="display:flex;justify-content:space-between;gap:6px;font-size:12px;font-weight:900;white-space:nowrap"><span>${esc2(c.lv)}${c.up?' <span style="color:#ffe07a">Subiu de nível</span>':''}</span><span id="res_xpt" style="color:#9be89f">${p0}%</span></span>
        <span role="progressbar" aria-label="XP do nível" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p1}" style="height:10px;border-radius:5px;background:#0e0a07;border:1px solid #2f5a32;overflow:hidden;display:block"><span class="q-xpf" id="res_xpf" style="display:block;height:100%;width:${p0}%;background:linear-gradient(90deg,#5fd068,#c4f27a)"></span></span></span></div>`; }
  if(c.k==='extra') return `<div class="${cls}" style="${base};height:46px;border-radius:14px;border:2px solid #4a3a2b;gap:12px;padding:0 12px;overflow:hidden">${c.ex.map((x,i)=>`<span ${x.full?'aria-label="'+esc2(x.full)+'" ':''}style="flex:${i===c.ex.length-1?'0 1 auto;min-width:0':'none'};display:flex;align-items:center;gap:5px;font-size:12px;font-weight:900;white-space:nowrap">${x.ic}<span style="min-width:0;overflow:hidden;text-overflow:ellipsis">${x.r!=null?xRarName(x.r,x.tx):esc2(x.tx)}${x.note?` <span style="color:#c9b9a2;font-weight:800">${esc2(x.note)}</span>`:''}</span></span>`).join('')}</div>`;
  /* item ganho: moldura e nome pelo componente único de raridade (xRar / xRarBox / xRarName, js/screens.js) */
  const q=xRar(c.r,'xr-s'), col=q.c, img=`<img class="q-wob" src="${xRarIco(slotIcon(c.slot,c.e),c.r,54)}" alt="" style="width:54px;height:54px;object-fit:contain">`;
  const box=q.on?xRarBox(c.r,img,72):`<div style="width:72px;height:72px;flex:none;border-radius:14px;background:radial-gradient(circle,${col}99,#16110d 72%);border:3px solid ${col};display:flex;align-items:center;justify-content:center;box-sizing:border-box">${img}</div>`;
  return `<div class="${cls}" style="position:relative;height:100px;flex:none;border-radius:16px;overflow:hidden">
    <div class="${c.r>=3?'q-myth':''}" style="position:absolute;inset:0;border-radius:16px;--rc:${col};background:linear-gradient(90deg,${col}52,rgba(29,22,17,.96) 62%);border:3px solid ${col};box-sizing:border-box;display:flex;align-items:center;gap:12px;padding:0 12px">${box}
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:12px;font-weight:900;color:${q.t};letter-spacing:1px;white-space:nowrap">ITEM · ${esc2(RN(c.r).toUpperCase())}${c.more>0?' · MAIS '+c.more:''}</span>
        <span class="lil" style="font-size:${String(c.nm||'').length>16?18:22}px;line-height:1.12;overflow-wrap:anywhere">${xRarName(c.r,c.nm)}</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(c.sub)}${c.st?` · <span style="color:#5fd068">${c.st}</span>`:''}</span></div>
      <span class="q-new" style="flex:none;align-self:flex-start;margin-top:10px;padding:3px 8px;border-radius:8px;background:${col};color:${c.r===0||c.r===4?'#2a1403':'#fff'};font-size:11px;font-weight:900">NOVO</span></div><span class="q-shine"></span></div>`; }
function resTitleHtml(){ const Y=RES.lay;
  return `<div class="q-rays" aria-hidden="true" style="left:35px;top:${Y.th/2-160}px;width:320px;height:320px"></div>
    <h1 class="q-title lil" style="position:relative;margin:0;font-size:${Y.compact?50:60}px;line-height:1;color:#ffc94a;letter-spacing:2px;text-shadow:0 5px 0 #6a3a08,0 0 10px rgba(255,201,74,.5)">VITÓRIA!</h1>
    <span class="q-sub" style="position:relative;margin-top:8px;padding:0 12px;font-size:14px;font-weight:900;text-shadow:0 2px 4px #000;text-align:center">${RES.sub}</span>`; }
/* botões da vitória: "Pular" enquanto a apresentação roda; "Continuar" (único botão do protótipo) no fim, com a barra fina da contagem automática */
function resActHtml(end){
  return end?`<button class="y-gold q-go lil" data-q="next" style="position:absolute;left:24px;right:24px;bottom:24px;height:64px;border-radius:18px;font-size:28px;display:flex;align-items:center;justify-content:center;gap:10px;overflow:hidden">Continuar${Q_CHEV(24)}<i class="q-auto" id="res_au" style="width:0"></i></button>`
    :`<button class="q-skip lil" data-q="skip" aria-label="Pular a apresentação" style="position:absolute;right:16px;bottom:30px;height:44px;padding:0 16px;border-radius:14px;border:2px solid #4a3a2b;background:rgba(29,22,17,.88);color:#f6ecdf;font-size:17px;display:flex;align-items:center;gap:6px">Pular<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 5 L13 12 L4 19 Z M13 5 L22 12 L13 19 Z"></path></svg></button>`; }
/* os 3 caminhos da derrota, com a regra de liberação: o que ainda não liberou NÃO aparece. Equipamento existe desde o nível 1. */
function resPaths(){ const p=[]; let fg=false, sm=true;
  try{ fg=!!(window.Panels&&Panels.on('forge')&&xUnlocked('forge')); }catch(er){ fg=false; }
  try{ sm=(typeof PANEL_V2!=='undefined'&&PANEL_V2.gate===false)?true:typeof fbUnl==='function'?!!fbUnl('summon'):xUnlocked('summon'); }catch(er){ sm=true; }
  if(fg) p.push({id:'forge',bd:'#ff9a3c',rgb:'255,154,60',ic:'forge',t1:'Forja',t2:'Melhore a arma'});
  p.push({id:'gear',bd:'#4aa3ff',rgb:'74,163,255',ic:'equipment',t1:'Equipamento',t2:'Use o melhor'});
  if(sm) p.push({id:'summon',bd:'#b45cff',rgb:'180,92,255',ic:'summon',t1:'Invocar',t2:'Novos itens'});
  return p; }
const RES_FC_W=(390-32-28-4)/2-8;   /* largura de cada número de FC no cartão da Derrota (base 390: margens 16+16, respiro 14+14, borda 2+2, vão) */
/* ===== DERROTA QUE RENDE (Sys.bossLoss, js/sys/bossloss.js; protótipo aprovado docs/proto/v2/Derrota.html) =====
   Atrás da chave do módulo (Sys.bossLoss.DATA.on): desligada, nada daqui roda e a Derrota é a de hoje, byte a byte.
   Ligada: no lugar do bloco "Fique mais forte" entram o PRÊMIO pelo dano (ouro, XP, pedra) e até 3 DICAS com "Ir". Nunca loja, VIP, oferta, gemas ou invocação.
   resBossLoss() é chamada UMA vez por derrota pelo js/battle.js (quando o herói caído termina de cair no chefe): é ela que credita (onDefeat).
   A tela só MOSTRA o que veio em o.loss: reabrir ou redesenhar a Derrota não credita de novo. */
const RES_LOSS_BOX=194;   /* altura do bloco de hoje que o quadro novo substitui: título "Fique mais forte" (12+24+8) + caixa de 150 */
const RES_TIP={gear:['equipment','Equipamento'],forge:['forge','Forja'],pet:['pets','Pet'],mount:['mounts','Montaria'],titles:['codex','Títulos'],hero:['map','Lutar']};   /* destino da dica → [ícone do menu, nome no cartão]. Destino fora daqui não aparece */
const RES_XP_IC='<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="10" fill="#7a5aff" stroke="#2a1a6a" stroke-width="2"></circle><text x="12" y="16" text-anchor="middle" font-size="9" font-weight="900" fill="#fff" font-family="Nunito,sans-serif">XP</text></svg>';
function resBossLoss(){ try{ const M=window.Sys&&Sys.bossLoss; if(!M||!M.DATA||M.DATA.on!==true||typeof M.onDefeat!=='function') return null;
    /* o chefe continua em B.en enquanto o herói está caído (o step() não anda com B.deadT>0): vida tirada = maxhp - hp. Caiu antes de o chefe entrar = 0 */
    const b=B.en.find(x=>x.boss)||null, max=b?Math.max(0,+b.maxhp||0):0, dmg=b?Math.max(0,Math.min(max,max-Math.max(0,+b.hp||0))):0, stage=S.stage;
    const opts={stage,dmgDone:dmg,bossMaxHp:max,era:eraOf(stage),eraBoss:!!(b?b.eraBoss:stage%STAGES_PER_ERA===0)};
    let z=null; try{ z=M.quote(JSON.parse(JSON.stringify(S)),Sys.host,opts); }catch(e){ z=null; }   /* numa CÓPIA, antes de creditar: qual derrota do dia é esta (só para o texto) */
    const r=M.onDefeat(S,Sys.host,opts); if(!r||r.on!==true) return null;
    return Object.assign({},r,{stage,nth:z?z.nth:-1,mult:z?z.mult:0,low:!!(z&&z.low),part:z?M.DATA.share*z.frac*z.mult:0}); }catch(e){ try{ console.error('resBossLoss',e); }catch(e2){} return null; } }
/* aviso quando a tela da Derrota não pôde abrir (jogador em outra tela): diz o que entrou. '' = sem prêmio */
function resLossToast(L){ const R=(L&&L.reward)||{}, g=Math.max(0,Math.round(+R.gold||0)), x=Math.max(0,Math.round(+R.xp||0)), s=Math.max(0,Math.round(+R.stones||0)), p=[];
  if(g) p.push('+'+gNum(g)+' de ouro'); if(x) p.push('+'+gNum(x)+' XP'); if(s) p.push('+'+s+(s===1?' Pedra de Forja':' Pedras de Forja'));
  return p.length?'Derrotado pelo chefe. Prêmio pelo dano: '+p.join(', '):''; }
/* dicas do módulo → só as que têm tela (diffRoute do js/diff.js, o mesmo DIFF_ROUTE do cartão "Faltam X de FC"); no máximo 3 */
function resLossTips(L){ const out=[]; if(typeof diffRoute!=='function') return out; const tx=typeof diffTxt==='function'?diffTxt:(s=>String(s==null?'':s));
  for(const t of (L&&Array.isArray(L.tips)?L.tips:[])){ if(out.length>=3) break; const m=t&&RES_TIP[t.dest]; if(!m) continue; let route=null; try{ route=diffRoute(t.dest); }catch(e){ route=null; } if(!route) continue;
    const label=tx(t.label); if(!label) continue; out.push({id:t.id,kind:t.kind,tab:t.dest,label,gainText:tx(t.gainText),ready:!!t.ready,route,ic:m[0],name:m[1]}); }
  return out; }
/* o quadro: {h, html}. h = altura estimada na base de 390 (o resOpen confere com a altura real depois de montar). Textos do módulo sempre escapados (esc2). */
function resLossBox(L,tips,stage){ const D=Sys.bossLoss.DATA, R=L.reward||{}, n=v=>Math.max(0,Math.round(+v||0)), gold=n(R.gold), xp=n(R.xp), st=n(R.stones), has=gold+xp+st>0, pct=n(L.pct);
  const steps=Array.isArray(D.perStageDay)?D.perStageDay:[], ord=L.nth>=0?Math.min(steps.length+1,L.nth+1):0, dayCap=!!L.capped&&L.nth>=0&&L.nth<steps.length;   /* dayCap = acabou pelo limite do dia inteiro, não pela fase */
  const fase='Fase '+(eraOf(stage)+1)+'-'+(((stage-1)%STAGES_PER_ERA)+1), em=t=>`<span style="color:#ffc94a;font-weight:900">${t}</span>`, mult=+L.mult||0;
  const title=has?'Prêmio pelo dano':L.capped&&!L.low?'Prêmio do dia já recebido':'Sem prêmio desta vez', side=has&&ord?ord+'ª derrota hoje nesta fase':fase;
  const txt=has?`Você tirou ${em(pct+'%')} da vida do chefe: ${em(Math.round((+L.part||0)*100)+'%')} do prêmio da vitória${mult>0&&mult<1&&ord?' (×'+String(mult).replace('.',',')+' por ser a '+ord+'ª)':''}`
    :esc2(L.text||'')+(L.low?' Esta derrota não gasta a sua vez do dia.':'');
  const chip=(ic,t)=>`<span style="flex:1;min-width:0;display:flex;align-items:center;justify-content:center;gap:4px;height:26px;border-radius:13px;background:rgba(0,0,0,.35);border:1px solid rgba(255,236,200,.16);font-weight:900;font-size:12.5px;white-space:nowrap;box-sizing:border-box">${ic}${t}</span>`;
  const chips=has?`<div style="display:flex;gap:6px;margin-top:5px">${gold?chip('<img src="assets/ui/coin.png" alt="" style="width:18px;height:18px;flex:none;object-fit:contain">','+'+gNum(gold)):''}${xp?chip(RES_XP_IC,'+'+gNum(xp)+' XP'):''}${st?chip(Y_STONE(18),'+'+st+(st===1?' Pedra':' Pedras')):''}</div>`:'';
  const showRule=ord>0&&!dayCap&&steps.length>0, rule=showRule?`<div style="display:flex;gap:4px;margin-top:5px">${steps.map((m,i)=>(i+1)+'ª: '+Math.round(m*100)+'%').concat([(steps.length+1)+'ª: nada']).map((t,i)=>`<span style="flex:1;min-width:0;height:16px;line-height:16px;text-align:center;font-size:9.5px;font-weight:900;border-radius:7px;white-space:nowrap;${i===ord-1?'background:#ffc94a;color:#2a1403':i<ord-1?'background:rgba(0,0,0,.3);color:#c9b8a2;text-decoration:line-through':'background:rgba(0,0,0,.3);color:#8a7a66'}">${t}</span>`).join('')}</div>`:'';
  const rwH=4+14+20+2+32+(has?31:0)+(showRule?21:0);
  let h=8+rwH, html=`<div class="q-cup" id="res_rw" role="group" aria-label="${esc2(title)}" style="flex:none;margin-top:8px;animation-delay:${RES_LOSE_PATH}s;border-radius:16px;border:2px solid ${has?'#ffc94a':'#6a5a48'};background:linear-gradient(180deg,#3a2a18,#24180f);padding:7px 10px;box-sizing:border-box">
      <div style="display:flex;align-items:baseline;justify-content:space-between;gap:6px;height:20px"><span class="lil" style="font-size:17px;line-height:20px;color:#ffc94a;white-space:nowrap">${title}</span><span style="font-size:10px;font-weight:900;color:#c9b8a2;white-space:nowrap">${side}</span></div>
      <div style="margin-top:2px;min-height:32px;font-size:12px;font-weight:800;line-height:16px;overflow-wrap:anywhere">${txt}</div>${chips}${rule}</div>`;
  if(tips.length){ const lines=Math.max.apply(null,tips.map(t=>Math.max(1,Math.ceil(t.label.length/17)))), tipH=Math.max(68,Math.ceil(62+11.5*lines)); h+=6+21+tipH;
    html+=`<span class="q-cup lil" style="flex:none;margin:6px 2px 3px;font-size:15px;line-height:18px;color:#ffc94a;animation-delay:${RES_LOSE_PATH}s">Fique mais forte</span>
      <div id="res_tips" style="flex:none;min-height:${tipH}px;display:flex;gap:6px">${tips.map((t,i)=>{ const lk=t.route.lock;
        return `<button class="q-path" data-q="tip:${i}" aria-label="${esc2(t.name+', '+t.label+': '+t.gainText+'. '+(lk?t.route.why:'Ir para '+t.name))}" style="position:relative;flex:1 1 0;min-width:0;min-height:68px;border-radius:14px;background:#2a1f16;border:2px solid ${i===0&&!lk?'#4aa3ff':'#4a3a2b'};padding:4px 3px;display:flex;flex-direction:column;align-items:center;color:#f6ecdf;box-sizing:border-box;animation-delay:${(RES_LOSE_PATH+0.15+i*0.15).toFixed(2)}s">
          <span class="lil" style="position:absolute;right:3px;top:3px;padding:0 6px;height:18px;border-radius:9px;font-size:12px;line-height:18px;white-space:nowrap;${lk?'background:#16110d;border:1px solid #4a3a2b;color:#c9b9a2':'background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 1px 0 #9a5a10'}">${lk?'Nv '+lk:'Ir'}</span>
          <img src="assets/icons/menu/${t.ic}.png" alt="" style="width:24px;height:24px;flex:none;object-fit:contain">
          <span style="font-size:11px;line-height:13px;font-weight:900;text-align:center">${esc2(t.name)}</span>
          <span style="max-width:100%;font-size:10px;line-height:11.5px;font-weight:800;color:#c9b8a2;text-align:center;overflow-wrap:anywhere">${esc2(t.label)}</span>
          <span style="max-width:100%;font-size:11px;line-height:13px;font-weight:900;color:#7fe07a;text-align:center;overflow-wrap:anywhere">${esc2(t.gainText)}</span></button>`; }).join('')}</div>`; }
  return {h,html}; }
/* toque numa dica: a MESMA rota do cartão do js/diff.js (diffGo): trancada por nível = aviso e a tela fica; senão fecha a Derrota (modo farm atrás) e abre o destino */
function resTipGo(i){ const a=RES.tips&&RES.tips[i]; if(!a||typeof diffGo!=='function'||typeof DIFF==='undefined') return null; DIFF.card={adv:{actions:RES.tips},from:'lose'}; return diffGo(i,'lose'); }
function resLoseHtml(Y,bname,lord,lossHtml){ const fc=RES.fc, rec=RES.rec, pct=Math.max(4,Math.min(100,Math.round(fc/Math.max(1,rec)*100))), miss=Math.max(0,Math.ceil(rec-fc));
  /* "SUA FC" e "RECOMENDADA" lado a lado, inteiras: a tela é desenhada na base de 390 px (resGeo), o cartão tem 326 px úteis; cada número fica com
     metade menos o vão. A fonte (base 26) só desce para valores muito longos; '999,9 mil' entra na conta porque a contagem de 0 até a FC passa por ele. */
  const fcPx=typeof xFitPx==='function'?Math.min(xFitPx(fcTxt(fc),RES_FC_W,26,12),xFitPx(fcTxt(rec),RES_FC_W,26,12),xFitPx('999,9 mil',RES_FC_W,26,12)):26;
  const paths=resPaths().map((p,i)=>`<button class="q-path" data-q="${p.id}" aria-label="${p.t1}: ${p.t2}" style="flex:1;min-width:0;border-radius:16px;border:2px solid ${p.bd};background:linear-gradient(180deg,#3a2c1f,#241a12);color:#f6ecdf;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:8px 4px;box-sizing:border-box;animation-delay:${(RES_LOSE_PATH+i*0.15).toFixed(2)}s">
      <span style="width:64px;height:64px;flex:none;border-radius:50%;background:radial-gradient(circle,rgba(${p.rgb},.45),rgba(22,17,13,.9) 70%);display:flex;align-items:center;justify-content:center"><img class="q-picon" src="assets/icons/menu/${p.ic}.png" alt="" style="width:54px;height:54px;object-fit:contain;animation-delay:${(i*0.5).toFixed(1)}s"></span>
      <span class="lil" style="font-size:18px;line-height:1.1">${p.t1}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.15">${p.t2}</span><span class="q-pfx" style="font-size:12px;font-weight:900;color:#5fd068;animation-delay:${(i*0.5).toFixed(1)}s">+FC</span></button>`).join('');
  return `<div id="res_p" style="position:absolute;left:16px;right:16px;top:${Y.top}px;display:flex;flex-direction:column;transform-origin:50% 0;transform:scale(${Y.f.toFixed(3)})">
    <div class="q-lose" style="height:82px;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;text-align:center"><h1 class="lil" style="margin:0;font-size:34px;line-height:1.05;color:#ff8a7e;text-shadow:0 4px 0 #4a0d08,0 0 22px rgba(255,90,78,.55);white-space:nowrap">O chefe foi mais forte</h1>
      <span style="font-size:14px;line-height:1.15;font-weight:800;color:#e8dccb">Fique mais forte e volte para vencer ${lord?'o Senhor da Era':'o chefe'}${bname?' '+bname:''}.</span></div>
    <div class="q-cup" style="flex:none;animation-delay:.6s;padding:12px 14px;border-radius:18px;background:rgba(29,22,17,.96);border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-end"><span style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:12px;font-weight:900;color:#c9b9a2">SUA FC</span><span class="lil" id="res_fc" style="font-size:${fcPx}px;color:#ffc94a">0</span></span>
        <span style="display:flex;flex-direction:column;align-items:flex-end;line-height:1.1"><span style="font-size:12px;font-weight:900;color:#c9b9a2">RECOMENDADA</span><span class="lil" id="res_rec" style="font-size:${fcPx}px;white-space:nowrap;color:#f6ecdf">${fcTxt(rec)}</span></span></div>
      <div role="progressbar" aria-label="Sua FC é ${pct}% da recomendada" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="position:relative;height:18px;border-radius:9px;background:#0e0a07;border:1px solid #6a4a1a;overflow:hidden"><div class="q-fcbar" style="width:${pct}%;height:100%;border-radius:9px;background:linear-gradient(90deg,#c0301f,#f2a826 70%,#ffe07a)"></div><span class="q-shine" style="width:${pct}%"></span></div>
      <span style="font-size:13px;line-height:1.2;font-weight:800;color:${miss>0?'#ffb3a8':'#9be89f'}">${miss>0?`Faltam <span style="color:#fff;font-weight:900">${fcTxt(miss)} de FC</span> para a recomendada`:'Sua FC já alcança a recomendada: tente de novo'}</span></div>
    ${lossHtml||`<span class="q-cup lil" style="flex:none;margin:12px 2px 8px;font-size:20px;line-height:24px;color:#ffc94a;text-shadow:0 2px 0 #000;animation-delay:${RES_LOSE_PATH}s">Fique mais forte</span>
    ${(typeof diffLoseRows==='function'&&diffLoseRows(rec))||`<div style="flex:none;height:150px;display:flex;gap:8px">${paths}</div>`}`}</div>`; }   /* lossHtml = quadro do Sys.bossLoss (chave ligada) no lugar do "Fique mais forte"; sem ele, o bloco de hoje */   /* dificuldade com paredes (js/diff.js): ligada, as 3 ações do Sys.advice na mesma caixa de 150 px; desligada, os caminhos de sempre */
/* botões da derrota: "Modo farm" é o PRINCIPAL (com a contagem); "Tentar de novo" embaixo. low = tela baixa: os dois encolhem para não encostar no Kael */
function resLoseBtns(low){
  return `<button class="y-gold q-farm" data-q="farm" style="position:absolute;left:20px;right:20px;bottom:${low?74:90}px;height:${low?58:66}px;border-radius:18px;display:flex;align-items:center;gap:12px;padding:0 16px;box-sizing:border-box;text-align:left">
      <svg class="q-fspin" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M21 12a9 9 0 0 1-15.5 6.2"></path><polyline points="3 20 5.5 18.2 7 21"></polyline><path d="M3 12a9 9 0 0 1 15.5-6.2"></path><polyline points="21 4 18.5 5.8 17 3"></polyline></svg>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.1"><span class="lil" style="font-size:25px">Modo farm</span><span style="font-size:12px;font-weight:900">Continua farmando automático</span></span>
      <span id="res_cd" aria-live="polite" class="lil" style="flex:none;min-width:44px;height:36px;padding:0 8px;border-radius:12px;background:rgba(42,20,3,.85);color:#ffe07a;font-size:17px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${RES_AUTO_FARM}s</span></button>
    <button class="q-red lil" data-q="retry" style="position:absolute;left:20px;right:20px;bottom:${low?16:22}px;height:${low?50:56}px;border-radius:16px;border:2px solid #7a2a20;background:rgba(29,22,17,.95);color:#f6ecdf;font-size:21px;display:flex;align-items:center;justify-content:center;gap:10px;box-sizing:border-box"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff8a7e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"></path></svg>Tentar de novo</button>`; }
function resOpen(mode,o,force){
  if(B.res||!SCREENS_ON.bossResult) return false; o=o||{};   /* a tela só abre com a chave ligada (SCREENS_ON.bossResult, index.html) */
  if(!force&&(view!=='battle'||window.__noRes||(typeof tutOn==='function'&&tutOn())||B.paused||(typeof modal!=='undefined'&&modal.style.display==='flex'))) return false;
  mode=mode==='lose'?'lose':'win';
  const app=resEl('app'), boss=resBoss(mode), stage=o.stage||S.stage, e=eraOf(stage), inEra=((stage-1)%STAGES_PER_ERA)+1, bname=boss?esc2(resBossName(boss)):'', lord=!!(boss&&boss.eraBoss), G=resGeo(boss);
  /* d = quanto falta da morte aprovada do chefe (folha *_die do canvas): nada da tela entra na cena antes disso, e a tela NÃO segura o corpo */
  let d=0; if(mode==='win') for(const c of B.corpses) if(c.e.boss) d=Math.max(d,(c.life||0.6)-c.t); d=Math.max(0,Math.min(RES_DEATH_MAX,d));
  B.res={mode}; B.act=null; B.banner=null; B.running=false; B.swing=0; B.eshots=[]; B.slow=0; document.body.classList.add('resui');
  if(mode==='lose') resHeroDown(true);
  Object.assign(RES,{mode,o,t:0,ev:[],ei:0,end:false,auto:-1,autoOn:true,cards:[],geo:G,lay:null,gain:0,g0:0,cnt:-1,bt:0,bm:false,xpAt:-1,conf:false,fc:0,rec:0,fcK:-1,sub:''});
  const top=`<div style="position:absolute;top:10px;left:14px;right:${mode==='win'?134:14}px;height:50px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;pointer-events:none"><span class="lil" style="font-size:18px;text-shadow:0 2px 0 #000;white-space:nowrap">${ERAS[e].n} ${e+1}-${inEra}</span><span style="font-size:11px;font-weight:900;color:#ffb3a8;white-space:nowrap;text-shadow:0 1px 2px #000">${lord?'SENHOR DA ERA':'CHEFE'}${bname?' · '+bname:''}</span></div>`;
  let h;
  if(mode==='win'){
    const cards=RES.cards=resLoot(o), Y=RES.lay=resLay('win',G,resCardsH());
    RES.gain=cards.length&&cards[0].k==='gold'?cards[0].gold:0; RES.g0=Math.max(0,S.gold-RES.gain);
    RES.sub=o.newEra>=0&&ERAS[o.newEra]?'Nova era liberada: '+ERAS[o.newEra].n:(bname||(()=>{ try{ return Sys.eras.bossName(stage,{perEra:STAGES_PER_ERA}); }catch(e){ return 'Chefe'; } })())+' derrotado · Fase '+(eraOf(stage+1)+1)+'-'+((stage%STAGES_PER_ERA)+1)+' liberada';
    /* linha do tempo (s), nos tempos do protótipo contados a partir do fim da morte do chefe: clarão · baú +0,15 · baú estoura +0,7 · letreiro +0,9 ·
       moedas voam +1,7 · cartões +3,3 / +3,9 / +4,6 (+0,7 cada um a mais) · "Continuar" 0,8 s depois do último cartão */
    const ev=RES.ev; if(d>0.3) ev.push([d-0.3,'flash']); ev.push([d+0.15,'chest'],[d+0.7,'boom'],[d+0.9,'title'],[d+1.7,'fly']);
    let tc=d+3.3; cards.forEach((c,i)=>{ ev.push([tc,'card',i]); tc+=i===0?0.6:0.7; }); ev.push([cards.length?tc+0.1:d+2.6,'end']);
    const a=(G.feet-G.hs*0.92-12)/G.Hb*100, b=(G.feet+17)/G.Hb*100, bxp=(G.bx/3.9).toFixed(0), byp=(G.feet/G.Hb*100-8).toFixed(0);
    h=`<div class="q-veil" style="background:linear-gradient(180deg,rgba(10,7,5,.78) 0%,rgba(10,7,5,.45) ${(a*0.65).toFixed(1)}%,rgba(10,7,5,.05) ${a.toFixed(1)}%,rgba(10,7,5,.1) ${b.toFixed(1)}%,rgba(10,7,5,.9) 100%)"></div>
    <div class="rw" id="res_w" style="height:${G.Hb.toFixed(1)}px;transform:scale(${G.s.toFixed(4)})">
      <div class="q-fx" id="res_fx">${d>0.5?`<div class="q-vign" style="background:radial-gradient(ellipse at ${bxp}% ${byp}%,transparent 30%,rgba(0,0,0,.75) 100%);animation-duration:${d.toFixed(2)}s"></div><div class="q-lbox" style="top:0;transform-origin:50% 0;animation-duration:${d.toFixed(2)}s"></div><div class="q-lbox" style="bottom:0;transform-origin:50% 100%;animation-duration:${d.toFixed(2)}s"></div>`:''}</div>
      <div class="q-fx" id="res_cf"></div>${top}
      <div id="res_cc" class="q-bmb" role="status" aria-label="Moedas" style="position:absolute;${Y.compact?'right:12px;top:17px':'left:12px;top:68px'};height:36px;padding:0 12px 0 4px;border-radius:18px;background:rgba(14,10,7,.88);border:2px solid #6a4a1a;display:flex;align-items:center;gap:6px;box-sizing:border-box"><img src="assets/ui/coin.png" alt="" style="width:28px;height:28px;object-fit:contain"><span class="lil" id="res_ct" style="font-size:18px;color:#ffe07a">${gNum(RES.g0)}</span></div>
      <div id="res_tt" style="position:absolute;left:0;right:0;top:${Y.tt}px;height:${Y.th}px;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none"></div>
      <div id="res_p" style="position:absolute;left:16px;right:16px;top:${Y.top}px;display:flex;flex-direction:column;gap:8px;transform-origin:50% 0;transform:scale(${Y.f.toFixed(3)})"></div>
      <div id="res_a" style="position:absolute;left:0;right:0;bottom:0;height:0">${resActHtml(false)}</div></div>`;
  } else {
    /* Sys.bossLoss: o.loss só vem do js/battle.js com a chave ligada (resBossLoss, já creditado). Sem ele: RES.loseX=0 e a tela de hoje */
    let lossBox=null; RES.tips=[]; RES.loseX=0; RES.loss=null;
    if(o.loss&&o.loss.on===true&&window.Sys&&Sys.bossLoss){ try{ RES.tips=resLossTips(o.loss); lossBox=resLossBox(o.loss,RES.tips,stage); RES.loss=o.loss; RES.loseX=lossBox.h-RES_LOSS_BOX; }catch(er){ try{ console.error('resLossBox',er); }catch(e2){} lossBox=null; RES.tips=[]; RES.loseX=0; RES.loss=null; } }
    RES.fc=heroFC(); RES.rec=(typeof fcNeed==='function'?fcNeed:recFC)(stage); const Y=RES.lay=resLay('lose',G,RES.loseX), kx=G.hx-G.hs*0.4, star=dl=>`<svg class="q-orb" viewBox="0 0 24 24" aria-hidden="true" style="animation-delay:${dl}s"><path d="${Q_STAR}" fill="#ffe07a"></path></svg>`;
    /* escuro por cima do chefe, mais leve em volta do Kael caído (o canvas já escurece a cena enquanto o herói está no chão) */
    h=`<div class="q-dark" style="background:radial-gradient(ellipse at ${(kx/3.9).toFixed(0)}% ${((G.feet-G.hs*0.15)/G.Hb*100).toFixed(0)}%,rgba(20,6,4,.12) 0%,rgba(12,5,4,.72) 45%,rgba(6,3,2,.88) 100%)"></div>
    <div class="rw" id="res_w" style="height:${G.Hb.toFixed(1)}px;transform:scale(${G.s.toFixed(4)})">${top}
      <div class="q-orbs" aria-hidden="true" style="left:${(G.hx-G.hs*0.72-22).toFixed(1)}px;top:${(G.feet-G.hs*0.25-22).toFixed(1)}px">${star(0)}${star(-.37)}${star(-.74)}</div>
      ${resLoseHtml(Y,bname,lord,lossBox?lossBox.html:'')}
      <div id="res_a" style="position:absolute;left:0;right:0;bottom:0;height:0">${resLoseBtns(Y.low)}</div></div>`;
  }
  const el=document.createElement('div'); el.id='res'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',mode==='win'?'Vitória sobre o chefe':'Derrota para o chefe'); el.innerHTML=h;
  app.appendChild(el); RES.el=el;
  /* quadro do Sys.bossLoss: a altura veio de uma estimativa (as dicas quebram em linhas); com a tela montada vale a altura REAL, para o bloco nunca cobrir o Kael caído */
  if(mode==='lose'&&RES.loss){ try{ const p=resEl('res_p'), hh=p?p.offsetHeight:0, Y=RES.lay; if(hh>0&&Math.abs(hh-(RES_LOSE_H+RES.loseX))>1){ RES.loseX=hh-RES_LOSE_H; const avail=G.feet-G.hs*0.55-10; Y.f=Y.top+hh>avail?Math.max(0.7,Math.min(1,(avail-Y.top)/hh)):1; p.style.transform=`scale(${Y.f.toFixed(3)})`; } }catch(er){} }
  el.addEventListener('pointerdown',()=>{ RES.autoOn=false; const a=resEl('res_au'); if(a) a.style.width='0'; const c=resEl('res_cd'); if(c) c.style.display='none'; });   // tocou: a tela espera o jogador
  el.addEventListener('click',ev=>{ const b=ev.target.closest('[data-q]'); if(b) resAct(b.dataset.q); else if(RES.mode==='win'&&!RES.end) resAct('skip'); });   // toque fora dos botões durante a apresentação = Pular
  return true;
}
/* um passo da linha do tempo da vitória (fast = veio do "Pular": sem som nem efeito de cena) */
function resEvent(n,i,fast){ const G=RES.geo, Y=RES.lay, bx=G.bx, ft=G.feet;
  if(n==='flash'){ if(!fast) resAdd('res_fx',`<div class="q-flash" style="background:radial-gradient(circle at ${(bx/3.9).toFixed(0)}% ${(ft/G.Hb*100-8).toFixed(0)}%,#fff 0%,#fff4c8 45%,rgba(255,233,168,.9) 100%)"></div>`); }
  else if(n==='chest'){ if(fast) return; resAdd('res_fx',`<div class="q-glow" id="res_gl" style="left:${(bx-80).toFixed(1)}px;top:${(ft-118).toFixed(1)}px;width:160px;height:140px"></div><img id="res_ch" class="q-chin" src="assets/ui/chest.png" alt="Baú do chefe" style="position:absolute;left:${(bx-55).toFixed(1)}px;top:${(ft-96).toFixed(1)}px;width:110px;height:98px;object-fit:contain;filter:drop-shadow(0 0 16px rgba(255,201,74,.7))">`); snd('summon'); }
  else if(n==='boom'){ resConf(); if(fast) return; const ch=resEl('res_ch'); if(ch) ch.className='q-chbo';
    let hc=`<div class="q-ring" style="left:${(bx-40).toFixed(1)}px;top:${(ft-83).toFixed(1)}px;width:80px;height:80px"></div>`;
    if(RES.gain>0) RES_COINS.forEach((c,j)=>{ const lx=Math.max(20,Math.min(370,bx+c[0])), ty=ft+c[2];
      hc+=`<div class="q-coin q-cb" style="left:${(lx-12).toFixed(1)}px;top:${ty.toFixed(1)}px;--dx:${(lx-bx).toFixed(1)}px;--h:${c[1]}px;--tx:${(Y.cx-lx).toFixed(1)}px;--ty:${(Y.cy-12-ty).toFixed(1)}px;animation-delay:${(j*0.025).toFixed(3)}s"><img class="q-cspin" src="assets/ui/coin.png" alt="" style="width:24px;height:24px;object-fit:contain;display:block;animation-delay:${(-j*0.09).toFixed(2)}s"></div>`; });
    resAdd('res_fx',hc); snd('claim'); snd('coin'); vib(30); }
  else if(n==='title'){ const t=resEl('res_tt'); if(t&&!t.firstChild) t.innerHTML=resTitleHtml(); if(fast) return; snd('legendary');
    for(let j=0;j<24;j++) emit({x:HX+(Math.random()-.5)*60,y:GY-Math.random()*HS*0.9,vx:(Math.random()-.5)*50,vy:-50-Math.random()*90,g:0,t:0,life:1+Math.random()*.6,col:Math.random()<.6?'#ffc94a':'#fff3c4',sz:2+Math.random()*3,glow:true}); }
  else if(n==='fly'){ if(fast) return; const gl=resEl('res_gl'), ch=resEl('res_ch'); if(gl) gl.remove(); if(ch) ch.remove();
    if(RES.gain>0){ if(RES.el) RES.el.querySelectorAll('.q-coin').forEach((c,j)=>{ c.classList.remove('q-cb'); c.classList.add('q-cf'); c.style.animationDelay=(j*0.06).toFixed(2)+'s'; }); RES.cnt=RES.t+0.65; snd('coin'); } }
  else if(n==='card'){ const c=RES.cards[i]; if(!c) return; resAdd('res_p',resCardHtml(c,fast)); if(fast) return;
    if(c.k==='xp'){ RES.xpAt=RES.t+0.3; snd('upgrade'); } else if(c.k==='item') { snd(c.r>=3?'legendary':'upgrade'); vib(50); } else snd(c.k==='gold'?'coin':'gem'); }
  else if(n==='end'){ RES.end=true; RES.auto=0; RES.cnt=-1; resConf(); const fx=resEl('res_fx'), ct=resEl('res_ct'), a=resEl('res_a'); if(fx) fx.innerHTML=''; if(ct) ct.textContent=gNum(S.gold); if(a) a.innerHTML=resActHtml(true); if(!fast) snd('ui_tap'); }
}
function resConf(){ if(RES.conf) return; RES.conf=true; resAdd('res_cf',RES_CONF.map(c=>`<span class="q-conf" style="left:${c[0]}px;background:${c[1]};animation-duration:${c[2]}s;animation-delay:${c[3]}s"></span>`).join('')); }
function resXp(){ const c=RES.cards.find(x=>x.k==='xp'), f=resEl('res_xpf'), t=resEl('res_xpt'); if(!c) return; const p=Math.round(c.f1*100)+'%'; if(f) f.style.width=p; if(t) t.textContent=p; }
/* "Pular": mostra o letreiro, todos os cartões e o "Continuar" na hora (o que ainda não tinha entrado entra sem animação) */
function resSkip(){ if(RES.mode!=='win'||RES.end) return; snd('ui_tap'); RES.xpAt=-1; resXp();
  while(RES.ei<RES.ev.length){ const e=RES.ev[RES.ei++]; resEvent(e[1],e[2],true); } }
function resAct(q){ if(!B.res||!RES.el) return;
  if(RES.mode==='win'){ if(q==='skip') resSkip(); else if(q==='next'&&RES.end){ snd('claim'); resClose('next'); } return; }
  if(q==='farm'||q==='retry'){ if(RES.t<RES_LOSE_BTN) return; snd('ui_tap'); resClose(q); }   // antes de o botão aparecer o toque não vale
  else if(q==='forge'||q==='gear'||q==='summon'){ if(RES.t<RES_LOSE_PATH) return; snd('ui_tap'); resClose('farm');   // o jogo segue no modo farm atrás da tela aberta
    if(q==='forge'){ if(!(window.Screens&&Screens.open('forge'))) setView('gear'); } else setView(q); }
  else if(q.indexOf('adv:')===0){ if(RES.t<RES_LOSE_PATH) return; if(typeof diffGo==='function') diffGo(+q.slice(4),'lose'); }   /* ação do Sys.advice (js/diff.js) */
  else if(q.indexOf('tip:')===0){ if(RES.t<RES_LOSE_PATH) return; resTipGo(+q.slice(4)); }   /* dica do Sys.bossLoss: "Ir" */
}
/* fecha a tela: 'next' (vitória: a batalha segue na fase nova) · 'retry' = desafia o chefe de novo · 'farm' / 'close' = modo farm (repete as ondas 1 a 4) */
function resClose(how){ const r=B.res; if(!r) return; B.res=null; document.body.classList.remove('resui'); if(RES.el){ RES.el.remove(); RES.el=null; }
  if(r.mode==='lose'){ resHeroDown(false); if(how!=='retry') S.farm=true; S.wave=1; startBattle(); if(how==='retry'&&challengeBoss()){ try{ B.hero.hp=B.hero.maxhp; }catch(e){} toast('Desafiando o chefe!'); } }   /* depois da Derrota o herói volta com a vida cheia (o desafio sozinho agora só cura uma parte) */
  save(); hud(); }
/* relógio da tela (tempo real, chamado pelo laço do jogo): anda a linha do tempo da vitória, o contador de moedas, a barra de XP e as contagens automáticas */
function resTick(dt){ if(!B.res||!RES.el) return; RES.t+=dt; const t=RES.t;
  if(RES.mode==='win'){
    while(RES.ei<RES.ev.length&&t>=RES.ev[RES.ei][0]){ const e=RES.ev[RES.ei++]; resEvent(e[1],e[2],false); }
    if(RES.cnt>=0&&t>=RES.cnt){ const k=Math.min(1,(t-RES.cnt)/0.8), c=resEl('res_ct'); if(c) c.textContent=gNum(RES.g0+(S.gold-RES.g0)*k);
      if(t-RES.bt>=0.07){ RES.bt=t; RES.bm=!RES.bm; const p=resEl('res_cc'); if(p) p.className=RES.bm?'q-bma':'q-bmb'; } if(k>=1) RES.cnt=-1; }
    if(RES.xpAt>=0&&t>=RES.xpAt){ RES.xpAt=-1; resXp(); }
    if(RES.end&&RES.autoOn){ RES.auto=Math.max(0,RES.auto)+dt; const a=resEl('res_au'); if(a) a.style.width=Math.min(100,RES.auto/RES_AUTO_NEXT*100).toFixed(1)+'%'; if(RES.auto>=RES_AUTO_NEXT) resClose('next'); } }
  else if(RES.mode==='lose'){
    if(t>=0.6&&RES.fcK<1){ RES.fcK=Math.min(1,(t-0.6)/0.9); const f=resEl('res_fc'); if(f) f.textContent=fcTxt(RES.fc*RES.fcK); }   // a FC sobe de 0 até o valor (protótipo)
    if(t>=RES_LOSE_BTN&&RES.autoOn){ RES.auto=Math.max(0,RES.auto)+dt; const left=RES_AUTO_FARM-RES.auto, c=resEl('res_cd'); if(c) c.textContent=Math.max(0,Math.ceil(left))+'s'; if(left<=0) resClose('farm'); } }
}
addEventListener('resize',()=>{ if(!B.res||!RES.el||!RES.geo||!RES.lay) return; const w=resEl('res_w'), p=resEl('res_p'); if(!w) return;
  const G=resGeo(null), Y=RES.lay; G.bx=RES.geo.bx; RES.geo=G; w.style.transform=`scale(${G.s.toFixed(4)})`; w.style.height=G.Hb.toFixed(1)+'px';
  if(p){ const win=RES.mode==='win', hh=win?resCardsH():RES_LOSE_H+(RES.loseX||0), avail=G.feet-G.hs*(win?0.92:0.55)-(win?4:10); Y.f=Y.top+hh>avail?Math.max(win?0.72:0.7,Math.min(1,(avail-Y.top)/Math.max(1,hh))):1; p.style.transform=`scale(${Y.f.toFixed(3)})`; } });
/* debug: abre a tela 10 sem lutar. dbgResult('win') | dbgResult('lose') */
window.dbgResult=function(mode){ if(!DEBUG) return; if(mode==='lose') return resOpen('lose',arguments[1]?{stage:S.stage,loss:arguments[1]}:{stage:S.stage},true);   /* dbgResult('lose', resultado do Sys.bossLoss) = ver o quadro do prêmio sem creditar */
  return resOpen('win',{stage:Math.max(1,S.stage-1),gems:10,newEra:-1,loot:{gold:1860,gems:0,xp:33,items:[{slot:'weapon',r:3,e:eraOf(S.stage),subs:[]}],eggs:[],held:[{r:3,needLevel:70}]}},true); };
