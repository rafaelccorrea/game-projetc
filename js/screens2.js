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
/* ---- 10 Resultado do chefe ---- */
#res{position:absolute;inset:0;z-index:20;overflow:hidden;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;animation:yfade .25s ease-out both}
#res .rw{position:absolute;left:0;top:0;width:390px;transform-origin:0 0}
#res button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;color:inherit}
#res .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
#res .q-rays{animation:yspin 14s linear infinite}
#res .q-banner{animation:qban .7s cubic-bezier(.2,1.6,.4,1) both}
@keyframes qban{0%{transform:scale(2.2);opacity:0}100%{transform:scale(1);opacity:1}}
#res .q-shake{animation:qshk .6s ease-out both}
@keyframes qshk{0%{opacity:0;transform:scale(1.3)}30%{opacity:1;transform:scale(1) translateX(-8px)}50%{transform:translateX(7px)}70%{transform:translateX(-4px)}100%{transform:none}}
#res .q-popin{animation:qpi .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes qpi{0%{opacity:0;transform:scale(.3) rotate(-8deg)}100%{opacity:1;transform:none}}
#res .q-fly{animation:qfl .6s ease-in both}
@keyframes qfl{0%{transform:none;opacity:1}100%{transform:translateY(-260px) scale(.4);opacity:0}}
#res .q-myth{animation:qmy 1.4s ease-in-out infinite}
@keyframes qmy{0%,100%{box-shadow:0 0 10px var(--rc),inset 0 0 10px rgba(255,255,255,.08)}50%{box-shadow:0 0 28px var(--rc),inset 0 0 18px rgba(255,255,255,.18)}}
#res .q-shine{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);background-size:250% 100%;animation:qsh 2.6s ease-in-out infinite;pointer-events:none}
@keyframes qsh{0%,40%{background-position:150% 0}100%{background-position:-60% 0}}
#res .q-conf{position:absolute;top:-16px;width:8px;height:14px;border-radius:2px;animation:qcf linear infinite;opacity:0}
@keyframes qcf{0%{opacity:0;transform:translateY(0) rotate(0)}10%{opacity:1}100%{opacity:0;transform:translateY(520px) rotate(540deg)}}
#res .q-slot{border:2px dashed rgba(201,185,162,.35);border-radius:14px;box-sizing:border-box}
#res .q-fcbar{animation:qfcb 1s ease-out .4s both;transform-origin:0 50%}
@keyframes qfcb{from{transform:scaleX(0)}to{transform:scaleX(1)}}
#res .q-cardin{animation:qci .4s ease-out both}
@keyframes qci{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
#res .q-auto{position:absolute;left:0;bottom:0;height:5px;background:rgba(42,20,3,.55);border-radius:0 3px 3px 0}
#res .q-auto.d{background:#c9b9a2}
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
const XP={page:-1,mt:'d',mpage:0,cf:false,anim:true,toast:'',toastT:0,lvfx:false};
const P_MICON={kill:'M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4',boss:'M12 2l3 7h7l-6 4 2 8-6-5-6 5 2-8-6-4h7z',ult:'M13 2 4 14h7l-1 8 9-12h-7z',chest:'M3 10h18v10H3zM3 10l2-5h14l2 5M12 10v4',
  instance:'M4 21V9l8-6 8 6v12M9 21v-6h6v6',forge:'M5 9h9l5 3-5 2v3H7v-3H5zM7 20h8',summon:'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18',upgrade:'M12 20V5M5 12l7-7 7 7'};
const P_GO={summon:'summon',upgrade:'gear'};
const pEvOf=id=>{ const D=Sys.pass.DATA, m=D.daily.concat(D.weekly).find(x=>x.id===id); return m?m.k:'kill'; };
function pToast(msg){ XP.toast=msg; XP.toastT=Date.now(); const el=document.getElementById('xp_toast'); if(el) el.innerHTML=`<div style="position:absolute;left:24px;right:24px;bottom:112px;z-index:40;display:flex;justify-content:center;pointer-events:none"><span class="y-toast" role="status" style="padding:10px 16px;border-radius:12px;background:#12261a;border:2px solid #5fd068;color:#e6fbe7;font-size:14px;font-weight:900;text-align:center;box-shadow:0 6px 18px rgba(0,0,0,.6)">${esc2(msg)}</span></div>`; }
/* o que cada nível dá, para desenhar: {kind:'coin'|'eq'|'skin', ...} */
function pInfo(rw){ if(!rw) return {kind:'coin',img:'assets/ui/gem.png',txt:''};
  if(rw.skin){ const sk=SKIN(SEASON_SKIN); return {kind:'skin',r:sk?sk.r:3,rc:RC[sk?sk.r:3],tag:RN(sk?sk.r:3)+' · Skin',txt:sk?sk.n:'Skin da temporada'}; }   /* r = raridade, para a moldura única (xRar do js/screens.js) */
  if(rw.item){ const it=rw.item, r=it.season?4:it.r; return {kind:'eq',slot:it.slot,r,rc:RC[r],tag:it.season?'Item da Temporada':RN(r)+' · '+SLOT[it.slot].n,txt:it.season?SLOT[it.slot].n+' · evolui até Lendário':iname({slot:it.slot,r:it.r,e:S.eraMax})}; }
  if(rw.gems) return {kind:'coin',img:'assets/ui/gem.png',fly:'gem',txt:rw.gems+' diamantes'};
  return {kind:'coin',img:'assets/ui/coin.png',fly:'gold',txt:kf((rw.goldk||0)*Sys.host.goldUnit())+' moedas'}; }
function pPending(){ const o=Sys.pass.ensure(S), t=Sys.pass.tier(S), out=[]; for(let i=1;i<=t;i++){ if(!o.free.includes(i)) out.push(['free',i]); if(o.premium&&!o.prem.includes(i)) out.push(['premium',i]); } return out; }
/* resgata UM nível de UMA trilha. O módulo só tem claimAll: o jogo marca os outros níveis como já resgatados só durante a chamada e devolve o estado
   depois (nada é dado duas vezes: o nível pedido entra na lista de resgatados pelo próprio claimAll). */
function pClaimOne(track,lv){ const o=Sys.pass.ensure(S), sf=o.free.slice(), sp=o.prem.slice(), all=[]; for(let i=1;i<=Sys.pass.DATA.tiers;i++) all.push(i);
  let res=null; try{ o.free=track==='free'?all.filter(i=>i!==lv||sf.includes(i)):all.slice(); o.prem=track==='premium'?all.filter(i=>i!==lv||sp.includes(i)):all.slice(); res=Sys.pass.claimAll(S,Sys.host); }
  finally{ const got=!!(res&&res.n); o.free=track==='free'&&got?sf.concat(lv).sort((a,b)=>a-b):sf; o.prem=track==='premium'&&got?sp.concat(lv).sort((a,b)=>a-b):sp; }
  return res; }
function pAfterClaim(res,els){ if(!res||!res.n){ snd('ui_tap'); pToast('Nada novo para resgatar'); return; }
  const items=[], held=[]; let k=0;
  for(const r of res.list){ if(r.item) items.push(iname(r.item)); if(r.held) held.push(r.held); if(r.skin){ const sk=SKIN(SEASON_SKIN); items.push(sk?sk.n:'Skin da temporada'); }
    const el=els&&els[r.track+r.tier]; if(k<8){ if(r.gems) yFly(el||document.getElementById('xp_all'),'gem',k*90); if(r.gold) yFly(el||document.getElementById('xp_all'),'gold',k*90+60); if(r.item||r.skin||r.held) yFly(el||document.getElementById('xp_all'),'item',k*90); k++; } }
  snd('claim'); if(res.list.some(r=>r.gold)) setTimeout(()=>snd('coin'),250); statsChanged(); XP.anim=false; render();
  const hTxt=held.length?(held.length===1?'Item guardado: sai no nível '+held[0].needLevel:held.length+' itens guardados até o nível liberar'):'';
  pToast(res.n===1?(items.length?items[0]+' (veja em Equip.)':hTxt||'Recompensa resgatada'):'Resgatou '+res.n+' recompensas'+(items.length?' · '+items.length+(items.length>1?' itens':' item'):'')+(hTxt?' · '+hTxt:'')); }
function pRenew(mt){ const d=new Date(); if(mt==='d'){ const m=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d, h=Math.floor(m/3600000); return h>=1?'Renova em '+h+'h':'Renova em '+Math.max(1,Math.ceil(m/60000))+'min'; }
  const wd=(d.getDay()+6)%7, days=7-wd, m=new Date(d.getFullYear(),d.getMonth(),d.getDate()+days)-d, dd=Math.floor(m/86400000); return dd>=1?'Renova em '+dd+'d':'Renova em '+Math.max(1,Math.floor(m/3600000))+'h'; }
function passTick(){ const el=document.getElementById('xp_renew'); if(el){ const t=pRenew(XP.mt); if(el.textContent!==t) el.textContent=t; } }
function scrPass(){
  if(!PASS_OK()){ V.innerHTML=''; return; }
  const passOk=xUnlocked('pass'); if(!passOk) passTab='mis';   /* antes do nível do Passe (18) o painel é só MISSÕES: sem cabeçalho da temporada, sem aba de recompensas, sem Premium */
  const d=xFit(682,610), H=d.H, PER=d.real?5:(d.full?5+Math.min(2,Math.max(0,Math.floor((H-682)/75))):4), P=Sys.pass, T=P.DATA.tiers, o=P.refresh(S,Sys.host), pr=P.progress(S), CUR=pr.tier, prem=pr.premium, lvP=plv();
  const sea=P.season(S,Sys.host), days=Math.max(0,Math.ceil((sea.end-Date.now())/86400000)), L=P.list(S,Sys.host), isMs=passTab==='mis';
  const ready=L.daily.concat(L.weekly).filter(m=>m.done&&!m.claimed).length+(L.bonus.ready&&!L.bonus.claimed?1:0), sk=SKIN(SEASON_SKIN), skT=sk?tierOf(sk.r):0;
  const seg=on=>on?'background:linear-gradient(180deg,#b07cff,#6a3cff);color:#fff':'background:transparent;color:#c9b9a2';
  let body='';
  if(!isMs){
    const pages=Math.ceil(T/PER); if(XP.page<0) XP.page=Math.floor(Math.max(0,Math.min(T,CUR+1)-1)/PER); XP.page=Math.max(0,Math.min(pages-1,XP.page)); const pg=XP.page;
    /* recompensa de equipamento e de skin: a MESMA moldura por raridade das outras telas (xRar, js/screens.js); com PANEL_V2.rar desligada, o desenho de antes */
    const cell=(inf,op)=>{ if(inf.kind==='coin') return `<img src="${inf.img}" alt="" style="width:38px;height:38px;object-fit:contain;flex:none;opacity:${op}">`; const q=xRar(inf.r);
      return inf.kind==='eq'?`<span class="p-slot${q.on?q.cls:' p-rglow'}"${q.at} style="${q.on?'':`border-color:${inf.rc};--rc:${inf.rc};background:radial-gradient(circle,${inf.rc}33,#120d0a 75%);`}opacity:${op}"><img src="${slotIcon(inf.slot,S.eraMax)}" alt="" style="width:28px;height:28px;object-fit:contain"></span>`
      :`<span class="p-slot${q.cls}"${q.at} style="${q.on?'':`border-color:${inf.rc};`}overflow:hidden;background:#241a38;opacity:${op}"><span class="kidle ${skT?'t'+skT:''}" style="position:absolute;left:-6px;top:-8px;width:48px;height:48px;display:block"></span></span>`; };
    const rwName=inf=>inf.kind==='coin'?esc2(inf.txt):xRarName(inf.r,inf.txt);   /* nome da recompensa na cor da raridade */
    const state=(can,done,fut,lv)=>can?'<span class="p-pill y-gold lil" style="align-self:flex-start;height:22px;padding:0 9px;border-radius:8px;font-size:12px;display:flex;align-items:center;box-shadow:0 3px 0 #8a4f0c">Resgatar</span>'
      :done?`<span style="display:flex;align-items:center;gap:3px;font-size:11px;font-weight:900;color:#8fe596">${Y_CHK(14)}Resgatado</span>`:fut?`<span style="font-size:11px;font-weight:800;color:#c9b9a2">No nível ${lv}</span>`:'';
    let rows='';
    for(let lv=pg*PER+1;lv<=Math.min(T,pg*PER+PER);lv++){ const fi=pInfo(P.reward('free',lv)), pi=pInfo(P.reward('premium',lv)), reached=lv<=CUR;
      const fDone=o.free.includes(lv), fCan=reached&&!fDone, fFut=!reached, pDone=o.prem.includes(lv), pCan=prem&&reached&&!pDone, pFut=prem&&!reached, pLock=!prem;
      const fOp=fDone?.6:fFut?.85:1, pOp=pLock||pDone?.6:1, cur=lv===CUR;
      rows+=`<div class="p-row" style="height:70px;flex:none;display:grid;grid-template-columns:1fr 44px 1fr;gap:6px">
        <button class="p-card ${fCan?'p-can':''}" data-x="claim" data-t="free" data-lv="${lv}" id="xp_free${lv}" aria-label="Nível do passe ${lv}, grátis: ${esc2(fi.tag?fi.tag+', ':'')}${esc2(fi.txt)}${fCan?', resgatar':fDone?', resgatado':', libera no nível do passe '+lv}" style="position:relative;border-radius:14px;border:2px solid ${fCan?'#ffc94a':fi.kind==='eq'?fi.rc+'99':'#4a3a2b'};background:${fCan?'linear-gradient(180deg,#4a361f,#241b14)':'#1d1611'};padding:4px 6px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0;opacity:${fOp}">
          ${cell(fi,1)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px">${fi.tag?`<span style="font-size:9px;font-weight:900;color:${fi.rc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(fi.tag)}</span>`:''}<span style="font-size:12px;font-weight:900;line-height:1.1">${rwName(fi)}</span>${state(fCan,fDone,fFut,lv)}</span></button>
        <div style="position:relative;display:flex;align-items:center;justify-content:center">
          <span style="position:absolute;left:20px;top:-3px;width:4px;height:38px;background:${lv===1?'transparent':reached?'#b07cff':'#4a3a2b'}"></span><span style="position:absolute;left:20px;top:35px;width:4px;height:38px;background:${lv===T?'transparent':lv+1<=CUR?'#b07cff':'#4a3a2b'}"></span>
          <span class="lil" style="position:relative;width:40px;height:40px;border-radius:50%;border:3px solid ${reached?'#b07cff':'#4a3a2b'};background:${cur?'linear-gradient(180deg,#b07cff,#6a3cff)':reached?'#2e1f4a':'#1d1611'};color:${cur?'#fff':reached?'#d9b3ff':'#c9b9a2'};font-size:17px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${lv}${cur?'<span class="p-cur"></span>':''}</span></div>
        <button class="p-card ${pCan?'p-can':''}" data-x="claim" data-t="premium" data-lv="${lv}" id="xp_premium${lv}" aria-label="Nível do passe ${lv}, premium: ${esc2(pi.tag?pi.tag+', ':'')}${esc2(pi.txt)}${pLock?', exige Premium':pCan?', resgatar':pDone?', resgatado':', libera no nível do passe '+lv}" style="position:relative;overflow:hidden;border-radius:14px;border:2px solid ${pCan?'#ffc94a':pi.kind==='coin'?'#5a3f8a':pi.rc};background:${pi.kind==='coin'?'linear-gradient(180deg,#2a2038,#1d1611)':'linear-gradient(180deg,#3a2a55,#1d1611)'};padding:4px 6px;display:flex;align-items:center;gap:6px;text-align:left;min-width:0">
          ${cell(pi,pOp)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;opacity:${pOp}">${pi.tag?`<span style="font-size:9px;font-weight:900;color:${pi.rc};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(pi.tag)}</span>`:''}<span style="font-size:12px;font-weight:900;line-height:1.1">${rwName(pi)}</span>${state(pCan,pDone,pFut,lv)}</span>
          ${pLock?`<span style="position:absolute;right:4px;top:4px;width:24px;height:24px;border-radius:50%;background:#0e0a07;border:2px solid #8a4dff;display:flex;align-items:center;justify-content:center">${SVG_LOCK(13,'#e6d4ff')}</span>`:''}</button></div>`; }
    const pend=pPending(), dots=Array.from({length:pages},(_,i)=>`<span style="width:${i===pg?22:8}px;height:8px;border-radius:4px;background:${i===pg?'#b07cff':i*PER+1<=CUR?'#6a4a9a':'#4a3a2b'};transition:width .25s"></span>`).join('');
    body=`<div style="height:38px;flex:none;display:grid;grid-template-columns:1fr 44px 1fr;gap:6px;align-items:center">
        <span style="display:flex;flex-direction:column;align-items:center;line-height:1.1"><span class="lil" style="font-size:15px;color:#e8dccb">Grátis</span><span style="font-size:9px;font-weight:800;color:#c9b9a2;text-align:center">diamantes, moedas, Básico · Épico no 30</span></span>
        <span style="text-align:center;font-size:9px;font-weight:900;color:#c9b9a2">NÍVEL DO PASSE</span>
        <span style="display:flex;flex-direction:column;align-items:center;line-height:1.1"><span class="lil" style="display:flex;align-items:center;gap:4px;font-size:15px;color:#d9b3ff">${prem?'':SVG_LOCK(13,'#e6d4ff')}Premium</span><span style="font-size:9px;font-weight:800;color:#d9c8ff;text-align:center">Raro → Épico → Lendário, + diamantes, skin</span></span></div>
      <div style="height:${PER*70+(PER-1)*5}px;flex:none;display:flex;flex-direction:column;gap:5px">${rows}</div>
      <div style="height:52px;flex:none;display:flex;gap:8px;margin-top:auto">
        <button class="lil ${pend.length?'y-gold y-cta':''}" data-x="all" id="xp_all" style="flex:1;height:50px;border-radius:14px;${pend.length?'':'border:2px solid #4a3a2b;background:#241b14;color:#c9b9a2;'}font-size:16px;padding:0">${pend.length?'Resgatar tudo ('+pend.length+')':'Tudo resgatado'}</button>
        ${prem?`<div class="lil" style="flex:1.3;height:50px;border-radius:14px;border:2px solid #8a4dff;background:#241a38;color:#e6d4ff;font-size:16px;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box"><img src="assets/ui/pass.png" alt="" style="width:26px;height:26px;object-fit:contain">Premium ativo</div>`
          :`<button class="p-prem" data-x="askprem" style="position:relative;overflow:hidden;flex:1.3;height:50px;border-radius:14px;padding:0 6px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05"><span class="p-premsh"></span><span class="lil" style="font-size:16px">Ativar Premium</span><span style="font-size:10px;font-weight:900;color:#2a1250">Pagamento em breve</span></button>`}</div>
      ${xPager('pg',pg,pages,'Níveis '+(pg*PER+1)+'–'+Math.min(T,pg*PER+PER)+' de '+T+' · itens da sua era','Níveis anteriores','Próximos níveis')}`;
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
  V.innerHTML=xWrap(d,XP.anim?'p-in':'',`<div class="x-scroll" style="flex:1;position:relative;display:flex;flex-direction:column;gap:6px;padding:8px 12px 10px;box-sizing:border-box;background:radial-gradient(120% 50% at 50% 0%,#2c2140 0%,#16110d 70%);min-height:0">
    <div class="p-hdr" style="${passOk?'':'display:none!important;'}height:92px;flex:none;position:relative;display:flex;border-radius:16px;border:2px solid #8a4dff;background:linear-gradient(120deg,#2e1f4a 0%,#1d1611 70%);overflow:hidden">
      <div style="position:relative;width:92px;flex:none;overflow:hidden"><div class="p-aura"></div><div class="p-ped" style="left:18px;top:76px;width:56px;height:12px"></div>
        <div class="kidle ${skT?'t'+skT:''} p-glow" role="img" aria-label="Skin da temporada, prêmio Premium do nível 25 do passe" style="position:absolute;left:6px;top:6px;width:80px;height:80px"></div></div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:6px 12px 6px 4px">
        <div style="display:flex;align-items:baseline;justify-content:space-between;gap:6px"><span class="lil" style="font-size:18px;line-height:1.05;white-space:nowrap">Temporada Solar</span>
          <span style="flex:none;display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:#e8dccb">${Y_CLOCK}${days} dia${days===1?'':'s'}
            <button data-x="close" aria-label="Fechar o Passe" ${xFrameOn()||document.body.classList.contains('fb')?'hidden ':''}style="width:32px;height:32px;margin:-4px -2px -4px 4px;border-radius:10px;border:2px solid #5a3f8a;background:#1d1611;color:#e6d4ff;padding:0;display:flex;align-items:center;justify-content:center">${Y_X}</button></span></div>
        <div style="display:flex;align-items:center;gap:8px"><span class="lil ${XP.lvfx?'p-lvup':''}" style="flex:none;padding:2px 8px;border-radius:9px;background:linear-gradient(180deg,#b07cff,#6a3cff);color:#fff;font-size:15px;white-space:nowrap">Nível do passe ${CUR}</span>
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">jogador: Nv. ${lvP}</span></div>
        <div role="progressbar" aria-label="XP do passe" aria-valuemin="0" aria-valuemax="${pr.per}" aria-valuenow="${pr.inTier}" style="height:12px;border-radius:6px;background:#0e0a07;border:1px solid #5a3f8a;overflow:hidden"><div class="p-fill p-pxp" style="width:${pct}%;height:100%"></div></div>
        <span style="font-size:11px;font-weight:800;color:#d9c8ff;white-space:nowrap">${pr.max?'Nível máximo do passe':pr.inTier+'/'+pr.per+' XP do passe · ganhe nas Missões'}</span></div></div>
    <div role="tablist" aria-label="Passe" style="${passOk?'':'display:none!important;'}height:52px;flex:none;display:flex;gap:6px;padding:3px;border-radius:13px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">
      <button role="tab" class="lil" aria-selected="${!isMs}" data-x="tab" data-t="pass" style="flex:1;border-radius:10px;border:0;${seg(!isMs)};font-size:16px;padding:0">Recompensas</button>
      <button role="tab" class="lil" aria-selected="${isMs}" data-x="tab" data-t="mis" style="position:relative;flex:1;border-radius:10px;border:0;${seg(isMs)};font-size:16px;padding:0">Missões${ready?`<span class="p-pill" style="position:absolute;top:4px;right:10px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#ff5a4e;color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;box-sizing:border-box">${ready}</span>`:''}</button></div>
    ${body}<div id="xp_toast"></div></div>
    ${XP.cf?`<div class="y-veil" style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.78);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box">
      <div class="y-pop" role="alertdialog" aria-label="Ativar Premium" style="width:330px;border-radius:18px;border:3px solid #8a4dff;background:#221a30;padding:16px;box-sizing:border-box;display:flex;flex-direction:column;gap:10px;box-shadow:0 0 30px rgba(138,77,255,.5)">
        <span class="lil" style="font-size:22px;text-align:center">Ativar Passe Premium</span>
        <div style="display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;font-size:13px;font-weight:800">
          <span>Equipamentos melhores: Raro e Épico ao longo do passe e 2 Itens da Temporada (níveis 27 e 30) que evoluem até Lendário</span>
          <span>Skin da temporada no nível 25 do passe</span><span>Mais diamantes nos outros níveis e +${P.DATA.premiumXpPct}% de XP do passe</span>
          <span style="font-size:12px;color:#c9b9a2">Compra direta pela loja do aparelho (Google Play / App Store), sem sorteio. Níveis já alcançados ficam prontos para resgatar.</span>
          <span role="note" style="padding:6px 8px;border-radius:8px;background:#3a2c1f;border:1px solid #ffc94a;color:#ffe07a;font-size:12px;font-weight:900;text-align:center">Pagamento em breve: a compra ainda não está disponível.</span></div>
        <button class="lil" data-x="cfno" style="height:50px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:18px;padding:0">Fechar</button></div></div>`:''}`);
  XP.anim=false; XP.lvfx=false;
  if(XP.toast&&Date.now()-XP.toastT<1600) pToast(XP.toast);
}
function pClick(b){ const a=b.dataset.x, P=Sys.pass;
  if(a==='close'){ snd('ui_tap'); Screens.close(); }
  else if(a==='tab'){ if(b.dataset.t!=='mis'&&!xUnlocked('pass')) return; snd('ui_tap'); passTab=b.dataset.t; XP.anim=true; render(); }
  else if(a==='mt'){ snd('ui_tap'); XP.mt=b.dataset.m; XP.mpage=0; XP.anim=true; render(); }
  else if(a==='pg'){ const p=XP.page+(+b.dataset.d); if(p>=0&&p<(XP.pages||1)){ snd('ui_tap'); XP.page=p; XP.anim=true; render(); } }
  else if(a==='mpg'){ const p=XP.mpage+(+b.dataset.d); if(p>=0&&p<(XP.mpages||1)){ snd('ui_tap'); XP.mpage=p; XP.anim=true; render(); } }
  else if(a==='askprem'){ snd('ui_tap'); XP.cf=true; render(); }
  else if(a==='cfno'){ snd('ui_tap'); XP.cf=false; render(); }
  else if(a==='all'){ const els={}; pPending().forEach(([t,l])=>{ const e=document.getElementById('xp_'+t+l); if(e) els[t+l]=e; }); pAfterClaim(P.claimAll(S,Sys.host),els); }
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

/* ======================================================================= 10 VITÓRIA / DERROTA DO CHEFE (DESLIGADA: SCREENS_ON.bossResult = false) =======================================================================
   O dono REPROVOU esta tela depois de ela estar escrita: nada daqui aparece no jogo. Conferência só em debug (?debug=1&res=1).
   Abre por cima da batalha (que fica esperando: step() não anda com B.res). Os personagens são os da própria batalha, na linha do chão do jogo:
   o herói parado e o chefe caído (vitória) ou de pé (derrota). O saque JÁ foi creditado no abate (Sys.loot.onKill): a tela só mostra.
   O jogo é só automático: a tela não trava o jogo. Vitória: depois de revelar tudo, coleta sozinha em 2,5 s e segue em 1,5 s. Derrota: volta a farmar
   sozinha em 10 s. Qualquer toque na tela cancela a contagem. */
const RES={el:null,t:0,step:0,collected:false,auto:-1,tiles:[],item:null,o:null};
const RES_AUTO_COLLECT=2.5, RES_AUTO_NEXT=1.5, RES_AUTO_FARM=10;
function resBoss(mode){ let e=null; if(mode==='win'){ for(const c of B.corpses) if(c.e.boss) e=c.e; } else e=B.en.find(x=>x.boss)||null; return e; }
function resOpen(mode,o,force){
  if(B.res||!SCREENS_ON.bossResult) return false; o=o||{};   /* tela REPROVADA pelo dono: fica desligada (SCREENS_ON.bossResult, index.html) */
  if(!force&&(view!=='battle'||window.__noRes||(typeof tutOn==='function'&&tutOn())||B.paused||(typeof modal!=='undefined'&&modal.style.display==='flex'))) return false;
  const app=document.getElementById('app'), boss=resBoss(mode), stage=o.stage||S.stage, e=eraOf(stage), inEra=((stage-1)%STAGES_PER_ERA)+1;
  const bname=boss?boss.kindName:(mode==='win'?'O chefe':'o chefe'), lord=boss&&boss.eraBoss;
  B.res={mode}; B.act=null; B.banner=null; B.running=false; B.swing=0; B.eshots=[]; B.slow=0; document.body.classList.add('resui');
  if(mode==='win') for(const c of B.corpses) if(c.e.boss) c.e.holdC=true;
  RES.t=0; RES.step=0; RES.collected=false; RES.auto=-1; RES.o=o; RES.mode=mode; RES.autoOn=true;   /* o jogo é só automático (ordem do dono): a contagem sempre roda; o toque na tela ainda a cancela */ RES.done=false;
  const s=app.clientWidth/390, Hb=app.clientHeight/s, cr=cv.getBoundingClientRect(), ar=app.getBoundingClientRect(), k=cr.width/LW;
  const feet=(cr.top-ar.top+GY*k)/s, btop=feet-((boss&&boss.dh)||180)*k/s;   // linha do chão e topo do chefe, na base de 390
  let h=`<div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,7,5,.86) 0%,rgba(10,7,5,.6) ${(btop/Hb*100-6).toFixed(1)}%,rgba(10,7,5,.08) ${(btop/Hb*100+4).toFixed(1)}%,rgba(10,7,5,.08) ${(feet/Hb*100+1).toFixed(1)}%,rgba(10,7,5,.92) ${(feet/Hb*100+9).toFixed(1)}%,rgba(10,7,5,.97) 100%)"></div>
    ${mode==='lose'?'<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(120,10,10,.25),rgba(40,0,0,.55))"></div>':''}
    <div class="rw" id="res_w" style="height:${Hb.toFixed(1)}px;transform:scale(${s.toFixed(4)})">
    <div style="position:absolute;top:12px;left:14px;right:12px;display:flex;flex-direction:column"><span class="lil" style="font-size:20px;text-shadow:0 2px 0 #000">${ERAS[e].n} · ${e+1}-${inEra}</span><span style="font-size:11px;font-weight:900;color:#ffb3a8">${lord?'SENHOR DA ERA':'CHEFE'} · ${esc2(bname)}</span></div>`;
  if(mode==='win'){
    const L=o.loot||{}, tiles=[{k:'gold',v:L.gold||0,lb:'Moedas',bd:'#ffc94a',c:'#ffe07a',snd:'coin'},{k:'gem',v:(o.gems||0)+(L.gems||0),lb:'Gemas',bd:'#4aa3ff',c:'#9fd0ff',snd:'gem'},{k:'xp',v:L.xp||0,lb:'XP',bd:'#5fd068',c:'#9be89f',snd:'claim'}];
    for(const r of L.eggs||[]) tiles.push({k:'egg',r,lb:'Ovo '+RN(r),bd:RC[r]||'#e8e2d8',c:RC[r]||'#e8e2d8',snd:'claim'});
    for(const hd of L.held||[]) tiles.push({k:'egg',r:hd.r,held:true,lb:'guardado · Nv. '+hd.needLevel,bd:RC[hd.r]||'#e8e2d8',c:RC[hd.r]||'#e8e2d8',snd:'claim'});
    const its=L.items||[], it0=its.length?its.slice().sort((a,b)=>b.r-a.r)[0]:null; let item=null;
    if(it0){ const nm=iname(normItem(it0)), mine=S.inv.filter(x=>x.slot===it0.slot&&x.r===it0.r&&x.e===it0.e).pop(), eq=mine&&S.eq[mine.slot]===mine.id; let sw=0; try{ if(mine&&!eq) sw=Sys.fc.itemFC(S,Sys.host,mine).swap; }catch(er){}
      item={r:it0.r,slot:it0.slot,e:it0.e,nm,sub:SLOT[it0.slot].n+' · '+ERAS[it0.e].n+' · Nv 1',st:eq?'Equipado':sw>0.5?'Melhor que o seu':'',more:its.length-1}; }
    RES.tiles=tiles; RES.item=item; RES.total=tiles.length+(item?1:0);
    /* tempos (s) em que cada recompensa aparece: 0,7 · 1,15 · 1,6 · ... e o item 0,7 s depois da última */
    RES.times=tiles.map((_,i)=>0.7+0.45*i); if(item) RES.times.push(RES.times[RES.times.length-1]+0.7);
    const sub=o.newEra>=0?'Nova era liberada: '+ERAS[o.newEra].n:esc2(bname)+' derrotado · Fase '+(eraOf(stage+1)+1)+'-'+(((stage)%STAGES_PER_ERA)+1)+' liberada';
    const conf=[[30,'#ffc94a',3.2,.3],[84,'#4aa3ff',3.8,.9],[140,'#ff4d6d',3,.1],[200,'#5fd068',3.6,1.4],[252,'#ffc94a',3.3,.6],[306,'#b45cff',3.9,1.1],[356,'#ffe07a',3.1,.4]].map(c=>`<span class="q-conf" style="left:${c[0]}px;background:${c[1]};animation-duration:${c[2]}s;animation-delay:${c[3]}s"></span>`).join('');
    h+=`${conf}<div style="position:absolute;top:46px;left:0;right:0;height:108px;display:flex;flex-direction:column;align-items:center;justify-content:center">
        <div class="q-rays" aria-hidden="true" style="position:absolute;left:75px;top:-66px;width:240px;height:240px;border-radius:50%;background:repeating-conic-gradient(rgba(255,201,74,.28) 0deg 10deg,rgba(255,201,74,0) 10deg 24deg);-webkit-mask:radial-gradient(circle,#000 30%,transparent 70%);mask:radial-gradient(circle,#000 30%,transparent 70%)"></div>
        <div class="q-banner" style="position:relative;display:flex;flex-direction:column;align-items:center"><div style="padding:4px 30px 8px;border-radius:14px;background:linear-gradient(180deg,#ffe07a,#f2a826);box-shadow:0 6px 0 #8a4f0c,0 0 30px rgba(255,201,74,.6)"><span class="lil" style="font-size:46px;color:#2a1403;letter-spacing:2px;line-height:1.1">VITÓRIA!</span></div>
          <span style="margin-top:12px;font-size:15px;font-weight:900;text-shadow:0 2px 4px #000;text-align:center">${sub}</span></div></div>
      <div id="res_p" style="position:absolute;top:160px;left:16px;right:16px;padding:12px;border-radius:20px;background:rgba(29,22,17,.94);border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;transform-origin:50% 0;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:center"><span class="lil" style="font-size:18px;color:#ffc94a">Recompensas</span><span id="res_n" style="font-size:12px;font-weight:800;color:#c9b9a2">0 de ${RES.total}</span></div>
        <div style="display:flex;gap:8px">${tiles.map((_,i)=>`<div class="q-slot" id="res_s${i}" style="flex:1;min-width:0;height:92px;position:relative"></div>`).join('')}</div>
        ${item?`<div class="q-slot" id="res_s${tiles.length}" style="height:86px;position:relative"></div>`:''}</div>
      <div id="res_a" style="position:absolute;left:24px;right:24px;bottom:22px;display:flex;flex-direction:column;gap:12px;align-items:stretch"></div>`;
  } else {
    const fc=heroFC(), rec=recFC(stage), pct=Math.max(4,Math.min(100,Math.round(fc/rec*100))); let best=''; try{ const O=Sys.loot.summonOdds(Sys.host); best=RN(O.best); }catch(er){}
    const card=(act,dl,ic,t1,t2)=>`<button class="q-cardin" data-q="${act}" style="min-height:56px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;display:flex;align-items:center;gap:12px;padding:6px 10px;box-sizing:border-box;animation-delay:${dl}s;text-align:left">${ic}<span style="flex:1;display:flex;flex-direction:column"><span style="font-size:15px;font-weight:900">${t1}</span><span style="font-size:11px;font-weight:700;color:#c9b9a2">${t2}</span></span><span style="font-size:12px;font-weight:900;color:#5fd068">+FC</span></button>`;
    const box=(bd,inner)=>`<span style="width:44px;height:44px;flex:none;border-radius:12px;background:#16110d;border:2px solid ${bd};color:${bd};display:flex;align-items:center;justify-content:center">${inner}</span>`;
    h+=`<div class="q-shake" style="position:absolute;top:50px;left:0;right:0;display:flex;flex-direction:column;align-items:center;gap:4px"><span class="lil" style="font-size:48px;line-height:1.1;color:#ff7a6e;text-shadow:0 4px 0 #4a0d08,0 0 24px rgba(255,90,78,.6)">Derrota</span>
        <span style="font-size:15px;font-weight:900;text-shadow:0 2px 4px #000;text-align:center;padding:0 16px">Faltou força. ${lord?'O Senhor da Era':'O chefe'} ${esc2(bname)} resistiu.</span></div>
      <div id="res_p" style="position:absolute;top:142px;left:16px;right:16px;padding:12px;border-radius:20px;background:rgba(29,22,17,.95);border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;transform-origin:50% 0;box-sizing:border-box">
        <div style="display:flex;flex-direction:column;gap:4px"><div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900"><span>Sua FC <span style="color:#ffc94a">${gNum(fc)}</span></span><span style="color:#c9b9a2">Recomendada ${gNum(rec)}</span></div>
          <div style="position:relative;height:12px;border-radius:6px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden"><div class="q-fcbar" style="width:${pct}%;height:100%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></div></div></div>
        <span class="lil" style="font-size:18px;color:#ffc94a;margin-top:2px">Como ficar mais forte</span>
        ${card('weapon',.3,box('#4aa3ff',`<img src="${slotIcon('weapon',S.eraMax)}" alt="" style="width:34px;height:34px;object-fit:contain">`),'Melhorar a arma','Equip. · use suas moedas')}
        ${card('best',.45,box('#5fd068','<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 12 9 15 12"></polyline><line x1="12" y1="9" x2="12" y2="16"></line></svg>'),'Equipar o melhor','Equip. · troca pelos itens mais fortes')}
        ${card('summon',.6,box('#b45cff','<img class="y-bob" src="assets/ui/chest.png" alt="" style="width:36px;height:32px;object-fit:contain">'),'Invocar itens','Invocar · '+(best?'itens até '+best:'itens novos')+', em ouro')}</div>
      <div id="res_a" style="position:absolute;left:24px;right:24px;bottom:22px;display:flex;flex-direction:column;gap:12px">
        <button class="y-gold y-pulse lil" data-q="retry" style="height:64px;border-radius:18px;font-size:28px;display:flex;align-items:center;justify-content:center;gap:10px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.5 15a9 9 0 1 0 2.1-9.4L1 10"></path></svg>Tentar de novo</button>
        <button data-q="farm" style="position:relative;overflow:hidden;height:52px;border-radius:16px;border:2px solid #4a3a2b;background:rgba(29,22,17,.92);color:#f6ecdf;font-size:15px;font-weight:900;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15">Farmar ondas<span style="font-size:11px;font-weight:700;color:#c9b9a2">repete as ondas 1-4 e junta moedas</span><i class="q-auto d" id="res_au" style="width:0"></i></button></div>`;
    RES.total=0; RES.times=[]; RES.tiles=[]; RES.item=null;
  }
  const el=document.createElement('div'); el.id='res'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',mode==='win'?'Vitória sobre o chefe':'Derrota para o chefe'); el.innerHTML=h+'</div>';
  app.appendChild(el); RES.el=el;
  el.addEventListener('pointerdown',()=>{ RES.autoOn=false; const a=document.getElementById('res_au'); if(a) a.style.width='0'; });   // tocou: a tela espera o jogador
  el.addEventListener('click',ev=>{ const b=ev.target.closest('[data-q]'); if(b) resAct(b.dataset.q); });
  /* o painel nunca cobre o chefe: se faltar altura, encolhe a partir do topo */
  { const p=document.getElementById('res_p'); if(p){ const top=parseFloat(p.style.top), lim=btop-10, hh=p.offsetHeight; if(top+hh>lim){ const f=Math.max(0.72,(lim-top)/hh); p.style.transform=`scale(${f.toFixed(3)})`; } } }
  if(mode==='win') resActions(); else snd('defeat');
  if(mode==='win') for(let i=0;i<24;i++) emit({x:HX+(Math.random()-.5)*60,y:GY-Math.random()*HS*0.9,vx:(Math.random()-.5)*50,vy:-50-Math.random()*90,g:0,t:0,life:1+Math.random()*.6,col:Math.random()<.6?'#ffc94a':'#fff3c4',sz:2+Math.random()*3,glow:true});
  return true;
}
function resTile(i){ const el=document.getElementById('res_s'+i); if(!el||el.firstChild) return; const T=RES.tiles[i];
  if(T){ const ic=T.k==='gold'?'<img class="y-flip" src="assets/ui/coin.png" alt="" style="width:40px;height:40px;object-fit:contain">':T.k==='gem'?'<img class="y-bob" src="assets/ui/gem.png" alt="" style="width:38px;height:38px;object-fit:contain">':T.k==='xp'?`<span class="y-bob" style="display:flex">${Y_ORB(38)}</span>`:`<span class="y-bob" style="display:flex">${Y_EGG(38,T.c)}</span>`;
    el.innerHTML=`<div class="q-popin q-t" style="position:absolute;inset:-2px;border-radius:14px;background:#33271d;border:2px solid ${T.bd};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box">${ic}
      <span class="lil" style="font-size:${T.k==='egg'?15:20}px;color:${T.c};white-space:nowrap">${T.k==='egg'?(T.held?'Ovo '+RN(T.r):'+1'):'+'+kf(T.v)+(T.k==='xp'?' XP':'')}</span><span style="font-size:${T.held?9.5:11}px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(T.lb)}</span></div>`; snd(T.snd); }
  else if(RES.item){ const I=RES.item, c=RC[I.r];
    el.innerHTML=`<div class="q-popin q-t" style="position:absolute;inset:-2px;border-radius:14px;overflow:hidden"><div class="${I.r>=2?'q-myth':''}" style="position:absolute;inset:0;border-radius:14px;--rc:${c};background:linear-gradient(90deg,${c}47,#33271d 60%);border:2px solid ${c};display:flex;align-items:center;gap:12px;padding:0 12px;box-sizing:border-box">
        <div style="width:64px;height:64px;flex:none;border-radius:12px;background:radial-gradient(circle,${c}8c,#16110d 70%);border:2px solid ${c};display:flex;align-items:center;justify-content:center;box-sizing:border-box"><img class="y-bob" src="${slotIcon(I.slot,I.e)}" alt="" style="width:50px;height:50px;object-fit:contain"></div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:11px;font-weight:900;color:${c};letter-spacing:1px">ITEM GARANTIDO · ${RN(I.r).toUpperCase()}${I.more>0?' · +'+I.more:''}</span><span class="lil" style="font-size:19px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(I.nm)}</span>
          <span style="font-size:12px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(I.sub)}${I.st?` · <span style="color:#5fd068">${I.st}</span>`:''}</span></div></div><span class="q-shine"></span></div>`; snd(I.r>=3?'legendary':'upgrade'); }
  const n=document.getElementById('res_n'); if(n) n.textContent=RES.step+' de '+RES.total; }
function resActions(){ const a=document.getElementById('res_a'); if(!a) return; const done=RES.step>=RES.total;
  a.innerHTML=!RES.collected?`<button class="y-gold lil ${done?'y-pulse':''}" data-q="collect" style="position:relative;overflow:hidden;height:64px;border-radius:18px;font-size:28px;letter-spacing:1px">${done?'Coletar':'Mostrar tudo'}<i class="q-auto" id="res_au" style="width:0"></i></button>
      <button data-q="next" style="height:52px;border-radius:16px;border:2px solid #4a3a2b;background:rgba(29,22,17,.92);color:#f6ecdf;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px">Próxima fase<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg></button>`
    :`<div class="q-popin" role="status" style="height:64px;border-radius:18px;border:2px solid #5fd068;background:rgba(29,22,17,.92);color:#9be89f;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:8px;box-sizing:border-box">${Y_CHK(22,'currentColor')}Prêmios guardados</div>
      <button class="y-gold y-pulse lil" data-q="next" style="position:relative;overflow:hidden;height:56px;border-radius:18px;font-size:24px;display:flex;align-items:center;justify-content:center;gap:8px">Próxima fase<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg><i class="q-auto" id="res_au" style="width:0"></i></button>`; }
function resCollect(){ if(RES.collected) return; RES.collected=true; RES.auto=-1; snd('claim'); setTimeout(()=>snd('coin'),250); vib(30);
  if(RES.el) RES.el.querySelectorAll('.q-t').forEach(t=>{ t.classList.remove('q-popin'); t.classList.add('q-fly'); });
  const n=document.getElementById('res_n'); if(n) n.textContent='Guardado'; resActions(); }
function resAct(q){ if(!B.res) return;
  if(q==='collect'){ if(RES.step<RES.total){ snd('ui_tap'); while(RES.step<RES.total){ RES.step++; resTile(RES.step-1); } RES.done=true; RES.auto=-1; resActions(); } else resCollect(); }
  else if(q==='next'){ snd('ui_tap'); resClose('next'); }
  else if(q==='retry'){ snd('ui_tap'); resClose('retry'); }
  else if(q==='farm'){ snd('ui_tap'); resClose('farm'); }
  else if(q==='weapon'||q==='best'||q==='summon'){ snd('ui_tap'); resClose('farm');
    if(q==='summon') setView('summon');
    else { if(q==='weapon'&&S.eq.weapon!=null&&itemOf(S.eq.weapon)) XG.sel=S.eq.weapon; setView('gear'); if(q==='weapon'){ if(S.eq.weapon!=null&&itemOf(S.eq.weapon)){ XG.sel=S.eq.weapon; XG.sheetIn=true; render(); XG.sheetIn=false; } } else gClick({dataset:{x:'best'}}); } }
}
/* fecha a tela: 'next' (vitória) · 'retry' = Desafiar chefe · 'farm' / 'close' = volta a farmar as ondas 1 a 4 */
function resClose(how){ const r=B.res; if(!r) return; B.res=null; document.body.classList.remove('resui'); if(RES.el){ RES.el.remove(); RES.el=null; }
  for(const c of B.corpses) if(c.e.holdC){ c.e.holdC=false; c.t=Math.max(c.t,(c.life||0.6)*0.8); }
  if(r.mode==='lose'){ S.wave=1; startBattle(); if(how==='retry'&&challengeBoss()) toast('Desafiando o chefe!'); }
  save(); hud(); }
/* relógio da tela (tempo real, chamado pelo loop): revela as recompensas uma a uma e conta o fechamento automático no AUTO */
function resTick(dt){ if(!B.res||!RES.el) return; RES.t+=dt;
  if(RES.mode==='win'){
    while(RES.step<RES.total&&RES.t>=RES.times[RES.step]){ RES.step++; resTile(RES.step-1); if(RES.step>=RES.total){ RES.done=true; RES.auto=-1; resActions(); } }
    if(RES.step>=RES.total&&RES.autoOn){ if(RES.auto<0) RES.auto=0; RES.auto+=dt; const lim=RES.collected?RES_AUTO_NEXT:RES_AUTO_COLLECT, a=document.getElementById('res_au'); if(a) a.style.width=Math.min(100,RES.auto/lim*100)+'%';
      if(RES.auto>=lim){ if(!RES.collected) resCollect(); else resClose('next'); } } }
  else if(RES.autoOn){ if(RES.auto<0) RES.auto=0; RES.auto+=dt; const a=document.getElementById('res_au'); if(a) a.style.width=Math.min(100,RES.auto/RES_AUTO_FARM*100)+'%'; if(RES.auto>=RES_AUTO_FARM) resClose('farm'); }
}
addEventListener('resize',()=>{ if(B.res&&RES.el){ const app=document.getElementById('app'), w=document.getElementById('res_w'), s=app.clientWidth/390; if(w){ w.style.transform=`scale(${s.toFixed(4)})`; w.style.height=(app.clientHeight/s).toFixed(1)+'px'; } } });
/* debug: abre a tela 10 sem lutar. dbgResult('win') | dbgResult('lose') */
window.dbgResult=function(mode){ if(!DEBUG) return; if(mode==='lose') return resOpen('lose',{stage:S.stage},true);
  return resOpen('win',{stage:Math.max(1,S.stage-1),gems:10,newEra:-1,loot:{gold:1860,gems:0,xp:33,items:[{slot:'weapon',r:2,e:eraOf(S.stage),subs:[]}],eggs:[],held:[{r:3,needLevel:70}]}},true); };
