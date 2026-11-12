'use strict';
/* ================= TELA 33 MONTARIAS (docs/proto/Montarias.dc.html) — NASCE DESLIGADA (PANEL_ON.mounts = false) =================
   Só a TELA: palco com o Kael montado (folha animada), aura por estrela, abas Detalhes / Estrelas / Coleção, subir nível, equipar e desmontar.
   Nenhuma regra aqui: lista, posse, nível, teto, custo, estrelas, fragmentos, bônus e aura vêm do Sys.mount (js/sys/mount.js, §5i do
   reports/sys-e2-api.md). A tela NÃO liga nenhuma chave do módulo: sem o módulo carregado ou com Sys.mount.DATA.on desligada mostra
   "Montarias: em breve"; antes do nível de liberação (e sem nenhuma montaria), o portão com Voltar.
   LAYOUT NOVO (PANEL_V2.real do screens.js): tamanho real, largura d.Wb de 320 a 600 px, altura útil d.H; nada encolhe, o miolo ROLA
   (x-scroll, a rolagem é devolvida no redesenho) e a ação principal fica fixa embaixo. O cabeçalho com Voltar, moedas e gemas é do index. */

/* ---------- TABELA DE MONTARIAS LIGADAS (decisão do dono). A fonte é o mountIds() do js/mountfx.js quando ele existe (pedido A-17);
   esta tabela é a reserva, com os MESMOS ids. A serpe (MT_OFF) foi REPROVADA: é cortada sempre, venha de onde vier. ---------- */
const MT_ON=['wolf','griffin','pony','horse','mythic'];
const MT_OFF=['wyvern'];

/* ---------- ARTE (conferida arquivo a arquivo em assets/anim/mounts) ----------
   Kael MONTADO parado: kael_<id>_idle_era2_t1.png, 12 quadros de 512x352 numa fila, 12 fps, patas em y=339 (1,1 a 1,7 MB cada).
   O desenho dos 5 ocupa x 70..376 e y 50..340 (medido): a tela mostra a janela quadrada x0..x0+box, y0..y0+box, com as patas na base.
   As referências de assets/mounts (1,1 a 4,2 MB, paradas) NÃO são usadas. Só a folha da montaria em exibição é pedida no palco;
   MT_TILE_ART: false (padrão) = cartões da Coleção com marcador neutro (ferradura na cor da raridade), nenhum arquivo a mais;
   true = cartões com o 1º quadro das mesmas folhas (as 5 juntas somam ~8,7 MB: só ligar quando a Arte entregar miniaturas leves). */
const MT_ART={pony:1,horse:1,wolf:1,griffin:1,mythic:1};
const MT_SHEET={dir:'assets/anim/mounts/',frames:12,fps:12,w:512,h:352,x0:68,y0:36,box:304};
const MT_TILE_ART=false;

/* ---------- TEXTOS que o módulo não tem (FALTA NO MÓDULO: "como conseguir" por montaria). Só o Lobo tem fonte fechada (oferta de 1ª compra,
   spec-oferta-montaria.md); as outras ficam com a frase geral da spec até o PO fechar a fonte de cada uma. go = tela que o botão abre. ---------- */
const MT_SRC={wolf:{t:'Oferta de 1ª compra',go:'offer',b:'Ver oferta'}};
const MT_SRC_ANY={t:'Passe, loja direta ou evento',go:'',b:''};
const MT_AURA_TXT={none:'Sem aura',glow:'Brilho',aura_smoke:'Fumaça',aura_full:'Aura forte'};   /* nome curto por chave da aura (o nome completo vem do módulo) */
const MT_STAR='M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z';
const MT_SHOE=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21 V11 a7 7 0 0 1 14 0 V21 h-4 V11 a3 3 0 0 0 -6 0 V21 Z" fill="${c}" stroke="#120c08" stroke-width="1.2" stroke-linejoin="round"></path></svg>`;
const MT_MINH=240;   /* altura mínima passada ao xDims: pequena de propósito (no layout novo nada encolhe; o miolo rola) */

/* ---------- chamadas ao Sys.mount ISOLADAS (valor de reserva seguro) ---------- */
const mtM=()=>(window.Sys&&Sys.mount)||null;
const mtHost=()=>(window.Sys&&Sys.host)||null;
function mtReady(){ const M=mtM(); return !!(M&&M.DATA&&M.DATA.on===true&&Array.isArray(M.DATA.mounts)&&typeof M.ensure==='function'&&typeof M.info==='function'); }
function mtCall(fn,args,fb){ const M=mtM(); try{ if(M&&typeof M[fn]==='function'){ const r=M[fn].apply(M,args); return r==null?fb:r; } }catch(e){} return fb; }
const mtSave=()=>mtCall('ensure',[S],{owned:{},stored:{},eq:null});
const mtInfo=id=>mtCall('info',[S,mtHost(),id],null);
const mtAuraOf=n=>mtCall('auraOf',[n],{id:'none',name:'',glow:0,smoke:false,particles:false});
/* ids da tela, na ordem do catálogo do módulo: mountIds() (mountfx.js) ou a tabela de reserva; sempre sem as reprovadas */
function mtIds(){ const M=mtM(); if(!M||!M.DATA||!Array.isArray(M.DATA.mounts)) return []; let src=null;
  try{ if(typeof mountIds==='function'){ const l=mountIds(); if(Array.isArray(l)) src=l.map(m=>m&&typeof m==='object'?m.id:m); } }catch(e){ src=null; }
  if(!src) src=MT_ON;
  return M.DATA.mounts.filter(m=>m&&!m.tbd&&src.indexOf(m.id)>=0&&MT_OFF.indexOf(m.id)<0).map(m=>m.id); }
/* liberação por nível: a mesma regra do MENU (fbUnl do fullbattle.js); sem ela, o nível do Sys.level. Quem JÁ tem montaria (oferta) entra antes. */
function mtLockLv(){ try{ const L=Sys.level; if(L&&typeof L.unlockLevel==='function'){ const v=L.unlockLevel('mount'); if(v>0) return v; }
    const U=L&&L.DATA&&L.DATA.unlock; if(U&&typeof U.mount==='number') return U.mount; }catch(e){} return 0; }
function mtLevelOk(){ try{ if(typeof PANEL_V2!=='undefined'&&PANEL_V2.gate===false) return true; if(typeof fbUnl==='function') return !!fbUnl('mount');
    const n=mtLockLv(); return !n||plv()>=n; }catch(e){ return true; } }
const mtHidden=(list,o)=>!mtLevelOk()&&!list.some(id=>o.owned[id]);
const mtPlv=()=>{ try{ return plv()|0; }catch(e){ return 0; } };
/* teto da montaria = nível do jogador (regra do módulo). Se o nível pedido passa do nível máximo do jogador (Sys.level.DATA.maxLevel), a tela diz isso em vez de pedir um nível que não existe */
const mtPlvMax=()=>{ try{ return Sys.level.DATA.maxLevel|0; }catch(e){ return 0; } };
const mtCapTxt=c=>{ const nl=c&&c.needLevel|0, mx=mtPlvMax(); return mx&&nl>mx?'o nível do jogador já está no máximo':'chegue ao nível '+n0(nl)+' do jogador'; };
/* a oferta de 1ª compra está na tela e ainda vale? (só então aparece o botão que leva a ela) */
function mtOfferOn(){ try{ return !!(window.Panels&&Panels.on('offer')&&Sys.offer&&typeof Sys.offer.status==='function'&&Sys.offer.status(S,mtHost()).available===true); }catch(e){ return false; } }
const mtSrc=id=>MT_SRC[id]||MT_SRC_ANY;
const mtPct=v=>String(Math.round((+v||0)*100)/100).replace('.',',')+'%';
const mtRgb=h=>{ const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(h||'')); return m?parseInt(m[1],16)+','+parseInt(m[2],16)+','+parseInt(m[3],16):'255,201,74'; };
const mtAuraTxt=a=>(a&&(MT_AURA_TXT[a.id]||a.name))||'Sem aura';
const mtStars=n=>n+(n===1?' estrela':' estrelas');

(function(){ const st=document.createElement('style'); st.textContent=`
.mt-root,.mt-root *{box-sizing:border-box}
.mt-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mt-root button.lil{font-family:'Lilita One',Nunito,sans-serif}
.mt-root button:active{transform:scale(.96)}
.mt-in{animation:mtk-pin .28s ease-out both}
.mt-pin{animation:mtk-pin .3s ease-out both}
@keyframes mtk-pin{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.mt-ol{text-shadow:-1px -1px 0 #120c08,1px -1px 0 #120c08,-1px 1px 0 #120c08,1px 1px 0 #120c08,0 2px 0 #120c08}
.mt-L{position:absolute;left:0;right:0;background-repeat:repeat-x;background-size:auto 100%;pointer-events:none}
.mt-Lsky{top:0;height:60%;background-image:url(assets/bg/v2/era0/sky.webp)}
.mt-Lfar{top:22%;height:42%;background-image:url(assets/bg/v2/era0/far.webp)}
.mt-Lmid{top:17.5%;height:50%;background-image:url(assets/bg/v2/era0/midA.webp)}
.mt-Lgnd{top:65.5%;height:40%;background-image:url(assets/bg/v2/era0/ground.webp)}
.mt-Lcld{top:2.5%;height:27%;background-image:url(assets/bg/v2/era0/cloud1.webp);animation:mtk-drift 120s linear infinite}
@keyframes mtk-drift{from{background-position-x:0}to{background-position-x:-2400px}}
@keyframes mtk-sp{from{background-position:0 0}to{background-position:100% 0}}
.mt-ped{position:absolute;left:50%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#8a7a68 0%,#5a4c3e 55%,#3a3028 100%);box-shadow:0 7px 0 #2a2019,0 10px 14px rgba(0,0,0,.45)}
.mt-pedRim{position:absolute;inset:-3px;border-radius:50%;border:3px solid;animation:mtk-rim 2.2s ease-in-out infinite}
@keyframes mtk-rim{0%,100%{opacity:.55}50%{opacity:1}}
.mt-breathe{animation:mtk-breathe 2.6s ease-in-out infinite;transform-origin:50% 100%}
@keyframes mtk-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.03)}}
.mt-shd{position:absolute;left:50%;border-radius:50%;background:rgba(0,0,0,.42);transform:translateX(-50%)}
.mt-au{position:absolute;inset:0;pointer-events:none}
.mt-glow{position:absolute;left:50%;bottom:0;transform:translateX(-50%);border-radius:50%;animation:mtk-auraP 2.4s ease-in-out infinite}
@keyframes mtk-auraP{0%,100%{opacity:.55;transform:translateX(-50%) scale(.95)}50%{opacity:1;transform:translateX(-50%) scale(1.05)}}
.mt-smk{position:absolute;bottom:4%;width:22%;aspect-ratio:1;border-radius:50%;filter:blur(6px);animation:mtk-smk 3.4s ease-out infinite}
@keyframes mtk-smk{0%{transform:translate(0,0) scale(.5);opacity:0}25%{opacity:.75}100%{transform:translate(var(--sx),-150%) scale(1.9);opacity:0}}
.mt-ring{position:absolute;left:50%;bottom:-4%;width:86%;height:16%;border-radius:50%;border:3px solid;transform:translateX(-50%);animation:mtk-ringP 1.6s ease-out infinite}
@keyframes mtk-ringP{0%{opacity:.9;transform:translateX(-50%) scale(.6)}100%{opacity:0;transform:translateX(-50%) scale(1.3)}}
.mt-rays{position:absolute;left:50%;bottom:-8%;width:120%;aspect-ratio:1;margin-left:-60%;border-radius:50%;-webkit-mask:radial-gradient(circle,#000 18%,transparent 66%);mask:radial-gradient(circle,#000 18%,transparent 66%);animation:mtk-spin 8s linear infinite}
@keyframes mtk-spin{to{transform:rotate(360deg)}}
.mt-pt{position:absolute;width:6px;height:6px;border-radius:50%;animation:mtk-rise 2.2s linear infinite}
@keyframes mtk-rise{0%{top:90%;opacity:0;transform:scale(.6)}15%{opacity:1}100%{top:6%;opacity:0;transform:scale(1.2)}}
.mt-flame{position:absolute;left:50%;bottom:0;width:70%;height:96%;margin-left:-35%;border-radius:50% 50% 40% 40%/70% 70% 30% 30%;filter:blur(8px);animation:mtk-flame 1.1s ease-in-out infinite alternate;mix-blend-mode:screen}
@keyframes mtk-flame{from{transform:scale(.96,.94);opacity:.55}to{transform:scale(1.05,1.06);opacity:.9}}
.mt-seal{position:absolute;left:8px;bottom:8px;z-index:4;max-width:calc(100% - 16px);padding:3px 9px;border-radius:9px;background:rgba(14,10,7,.82);border:1px dashed #c9b9a2;font-size:11px;font-weight:900;color:#f6ecdf;display:flex;align-items:center;gap:5px}
.mt-seal i{width:8px;height:8px;flex:none;border-radius:50%;background:#ffc94a;animation:mtk-rim 1.2s ease-in-out infinite}
.mt-chip{flex:none;padding:1px 7px;border-radius:7px;font-size:11px;font-weight:900;color:#16110d}
.mt-rare{position:relative;overflow:hidden}
.mt-rare::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.7) 50%,transparent 70%);background-size:300% 100%;animation:mtk-shn 2.4s ease-in-out infinite;pointer-events:none}
@keyframes mtk-shn{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
.mt-stOn{animation:mtk-stP 2s ease-in-out infinite}
@keyframes mtk-stP{0%,100%{transform:scale(1)}50%{transform:scale(1.15)}}
.mt-lvPop{display:inline-block;animation:mtk-lvPop .6s ease-out both}
@keyframes mtk-lvPop{0%{transform:scale(1)}40%{transform:scale(1.3);color:#fff}100%{transform:scale(1)}}
.mt-box{border-radius:10px;background:#33271d;display:flex;flex-direction:column;justify-content:center;padding:4px 8px;line-height:1.15;min-width:0;min-height:46px}
.mt-box small{font-size:10px;font-weight:800;color:#c9b9a2;line-height:1.1}
.mt-box b{font-size:15px;font-weight:900}
.mt-bar{position:relative;display:block;height:12px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden}
.mt-barF{position:absolute;left:0;top:0;bottom:0;border-radius:999px;transition:width .5s cubic-bezier(.2,1,.4,1)}
.mt-barF::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);background-size:300% 100%;animation:mtk-shn 2.2s ease-in-out infinite}
.mt-btn{min-height:52px;border-radius:14px;border:0;font-size:14px;font-weight:900;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 10px;min-width:0}
.mt-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10}
.mt-green{background:linear-gradient(180deg,#7fe07a,#3fae3c);color:#0d2410;box-shadow:0 3px 0 #1f6a1d}
.mt-ghost{background:#33271d;border:2px solid #4a3a2b;color:#f6ecdf}
.mt-eqd{background:#1f3a22;border:2px solid #5fd068;color:#9ff0a6}
.mt-off{background:#2a221b;border:2px solid #4a3a2b;color:#8f8070;box-shadow:none}
.mt-pulse{animation:mtk-pulse 1.6s ease-in-out infinite}
@keyframes mtk-pulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
.mt-tile{position:relative;border-radius:12px;padding:6px 2px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:96px;min-width:0;color:#f6ecdf;transition:transform .15s}
.mt-tileSel{animation:mtk-tileSel 1.6s ease-in-out infinite}
@keyframes mtk-tileSel{0%,100%{opacity:.55}50%{opacity:1}}
.mt-crest{position:relative;width:56px;height:56px;flex:none;overflow:hidden}
.mt-sil{filter:brightness(0);opacity:.55}
.mt-crestBig{animation:mtk-crestF 3s ease-in-out infinite}
@keyframes mtk-crestF{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.mt-frag{display:inline-block;width:14px;height:16px;flex:none;clip-path:polygon(50% 0,100% 30%,80% 100%,20% 100%,0 30%);animation:mtk-fragG 2.4s ease-in-out infinite}
@keyframes mtk-fragG{0%,100%{filter:brightness(1)}50%{filter:brightness(1.5)}}
.mt-sChip{flex:1;min-width:0;min-height:48px;border-radius:10px;border:2px solid;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:2px;line-height:1.05;color:#f6ecdf}
.mt-burst{position:absolute;inset:0;z-index:6;pointer-events:none;background:radial-gradient(circle at 50% 62%,rgba(255,243,196,.95) 0%,rgba(255,224,122,.5) 30%,rgba(255,224,122,0) 62%);animation:mtk-burst .9s ease-out both}
@keyframes mtk-burst{0%{opacity:0}25%{opacity:1}100%{opacity:0}}
.mt-toast{animation:mtk-toast 2.4s ease both}
@keyframes mtk-toast{0%{opacity:0;transform:translate(-50%,-8px)}10%,85%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,0)}}
.mt-padl{animation:mtk-padl 2.4s ease-in-out infinite;transform-origin:50% 30%}
@keyframes mtk-padl{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-9deg)}92%{transform:rotate(8deg)}}
`; document.head.appendChild(st); })();

/* ---------- estado ---------- */
const XMT={sel:null,tab:'det',view:0,anim:true,pin:true,toast:'',toastT:0,burstT:0,popT:0,sig:null};
function mtToast(msg){ XMT.toast=String(msg||''); XMT.toastT=Date.now(); }
function mtEmpty(d,html){ V.innerHTML=xWrap(d,'mt-root '+(XMT.anim?'mt-in':''),`<div style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:16px;text-align:center">${html}</div>`); XMT.anim=false; }
const mtSoon=d=>mtEmpty(d,`${MT_SHOE(96,'#6a5a48')}<span class="lil" style="font-size:24px">Montarias: em breve</span>`);

/* ---------- peças ---------- */
/* o Kael montado dentro de uma caixa QUADRADA (janela MT_SHEET sobre o quadro de 512x352; patas na base). anim = folha andando; sil = silhueta.
   Sem folha da montaria: marcador neutro (ferradura), nunca um animal desenhado em código. */
function mtSprite(id,anim,sil,alt){ const F=MT_SHEET, lab=alt?`role="img" aria-label="${esc2(alt)}"`:'aria-hidden="true"';
  if(!MT_ART[id]) return `<span ${lab} style="position:absolute;inset:0;display:flex;align-items:flex-end;justify-content:center;opacity:${sil?0.5:1}">${MT_SHOE('70%',sil?'#120c08':'#8a7a68')}</span>`;
  return `<div ${lab} class="${sil?'mt-sil':''}" style="position:absolute;left:${(-F.x0/F.box*100).toFixed(2)}%;top:${(-F.y0/F.box*100).toFixed(2)}%;width:${(F.w/F.box*100).toFixed(2)}%;height:${(F.h/F.box*100).toFixed(2)}%;background:url(${F.dir}kael_${id}_idle_era2_t1.png) 0 0/${F.frames*100}% 100% no-repeat;${anim?`animation:mtk-sp ${(F.frames/F.fps).toFixed(2)}s steps(${F.frames},jump-none) infinite`:''}"></div>`; }
/* aura pelo que o módulo diz da estrela (glow 0-3, smoke, particles): brilho → fumaça → raios, chama, anéis e partículas */
function mtAura(a,c){ if(!a) return ''; const g=a.glow|0, rgb=mtRgb(c); let h='';
  if(g>=1) h+=`<span class="mt-glow" style="width:${g>=2?110:84}%;height:${g>=2?70:42}%;background:radial-gradient(ellipse at 50% 70%,rgba(${rgb},${g>=2?0.75:0.5}) 0%,rgba(${rgb},0) 70%)"></span>`;
  if(a.smoke) h+=[18,34,50,64,26,58].map((l,k)=>`<span class="mt-smk" style="left:${l}%;--sx:${k%2?18:-18}px;background:${k%3===0?'rgba('+rgb+',0.55)':'rgba(200,192,182,0.5)'};animation-delay:${(-k*0.55).toFixed(2)}s"></span>`).join('');
  if(a.particles) h+=`<span class="mt-rays" style="background:repeating-conic-gradient(rgba(${rgb},0.38) 0deg 8deg,transparent 8deg 22deg)"></span>
    <span class="mt-flame" style="background:radial-gradient(ellipse at 50% 85%,rgba(255,255,255,0.7) 0%,rgba(${rgb},0.75) 35%,rgba(${rgb},0) 70%)"></span>
    <span class="mt-ring" style="border-color:${c}"></span><span class="mt-ring" style="border-color:#fff3c4;animation-delay:.8s"></span>`
    +[10,24,38,52,66,80,18,72].map((l,k)=>{ const pc=k%2?'#fff3c4':c; return `<span class="mt-pt" style="left:${l}%;background:${pc};box-shadow:0 0 8px 2px ${pc};animation-delay:${(-k*0.3).toFixed(1)}s"></span>`; }).join('');
  return h?`<div class="mt-au" aria-hidden="true">${h}</div>`:''; }
const mtStarSvg=(sz,on,cls,dl)=>`<svg class="${cls||''}" width="${sz}" height="${sz}" viewBox="0 0 24 24" aria-hidden="true" style="flex:none${dl?';animation-delay:'+dl:''}"><path d="${MT_STAR}" fill="${on?'#ffc94a':'#3a2e24'}" stroke="#6a3a08" stroke-width="1.4" stroke-linejoin="round"></path></svg>`;
const mtUpSig=(id,c)=>id+'|'+(c&&c.ok)+'|'+((c&&c.reason)||'')+'|'+((c&&c.gold)||0);

/* ---------- desenho ---------- */
function scrMounts(){
  const d=xDims(MT_MINH), H=d.H, W=d.Wb; XMT.sig=null;
  if(!mtReady()){ mtSoon(d); return; }
  const M=mtM(), D=M.DATA, host=mtHost(), o=mtSave(), list=mtIds();
  if(!list.length){ mtSoon(d); return; }
  if(mtHidden(list,o)){ const lv=mtLockLv(), off=mtOfferOn();
    mtEmpty(d,`<svg class="mt-padl" width="64" height="74" viewBox="0 0 24 28" aria-hidden="true"><path d="M6 12 V8 A6 6 0 0 1 18 8 V12" fill="none" stroke="#c9b9a2" stroke-width="2.6"></path><rect x="3" y="12" width="18" height="14" rx="3" fill="#ffc94a" stroke="#6a3a08" stroke-width="1.4"></rect><circle cx="12" cy="18.5" r="2" fill="#6a3a08"></circle></svg>
      <span class="lil mt-ol" style="font-size:26px">${lv?'Libera no nível '+n0(lv):'Ainda não liberado'}</span>
      <span style="font-size:14px;font-weight:800;color:#e8dccb;max-width:300px;line-height:1.3">Você está no nível ${n0(mtPlv())}. Continue lutando para liberar.${off?' A oferta de 1ª compra entrega uma montaria antes disso.':''}</span>
      ${off?'<button data-x="offer" class="mt-btn mt-gold mt-pulse" style="min-width:220px;margin-top:4px">Ver oferta de 1ª compra</button>':''}
      <button data-x="back" class="mt-btn ${off?'mt-ghost':'mt-gold'} lil" style="min-width:220px;font-size:18px${off?'':';margin-top:4px'}">Voltar</button>`); return; }
  if(list.indexOf(XMT.sel)<0) XMT.sel=list.indexOf(o.eq)>=0?o.eq:(list.find(q=>o.owned[q])||list[0]);
  const id=XMT.sel, idx=list.indexOf(id), inf=mtInfo(id);
  if(!inf){ mtSoon(d); return; }
  const owned=!!inf.owned, r=inf.rarity|0, qc=xRar(r), q=owned?xRar(r,'xr-s'):xRar(null), rc=qc.c, name=inf.name||'Montaria', rarName=inf.rarityName||'';
  const maxS=D.maxStars|0, maxL=D.maxLvl|0, stars=inf.stars|0, lvl=inf.lvl|0, cap=inf.cap|0, pct=+inf.pct||0, isEq=inf.equipped===true;
  if(!owned||XMT.view===stars) XMT.view=0;
  const vs=owned?(XMT.view||stars):0, aura=owned?mtAuraOf(vs):null, src=mtSrc(id);
  const cu=owned?mtCall('canUpgrade',[S,host,id],{ok:false,reason:'off',gold:0}):{ok:false,reason:'id',gold:0}; XMT.sig=mtUpSig(id,cu);
  const now=Date.now(), pin=XMT.pin?'mt-pin':'', pop=now-XMT.popT<650, burst=now-XMT.burstT<900;
  const stH=Math.round(Math.max(210,Math.min(360,H*0.42))), box=Math.round(Math.max(120,Math.min(stH-74,W-90,300)));
  const sc0=XMT.anim?null:document.getElementById('mt_scroll'), y0=sc0?(+sc0.scrollTop||0):0;   /* o redesenho não devolve a rolagem ao topo */
  const fs=W<350?15:17;

  /* ----- PALCO: Kael montado (ou a silhueta da que ainda não é sua) ----- */
  const stage=`<div class="mt-stage${q.cls}"${q.at} style="position:relative;flex:none;height:${stH}px;border-radius:18px;overflow:hidden;${q.on?'':'border:2px solid #4a3a2b;'}background:#1d1611;display:flex;flex-direction:column">
      <div class="mt-L mt-Lsky"></div><div class="mt-L mt-Lcld"></div><div class="mt-L mt-Lfar"></div><div class="mt-L mt-Lmid"></div><div class="mt-L mt-Lgnd"></div>
      <div aria-hidden="true" style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(10,7,5,0.6) 0%,rgba(10,7,5,0) 28%,rgba(10,7,5,0) 78%,rgba(10,7,5,0.5) 100%)"></div>
      <div style="position:relative;z-index:3;height:52px;flex:none;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:4px 6px">
        <span style="flex:none">${xPager('pg',idx,list.length,null,'Montaria anterior','Próxima montaria')}</span>
        <span class="mt-ol" style="flex:1;min-width:0;text-align:right;font-size:11px;font-weight:900;line-height:1.2">Jogador Nv. ${n0(mtPlv())}<br><span style="color:#ffe07a">Teto: Nv. ${n0(cap)}</span></span>
      </div>
      <div style="position:relative;z-index:2;flex:1;min-height:0">
        ${owned?`<div class="mt-ped" style="bottom:5%;width:min(64%,300px);height:14%"><span class="mt-pedRim" style="border-color:${rc}"></span></div>
        <div style="position:absolute;left:50%;bottom:10%;width:${box}px;height:${box}px;margin-left:-${box/2}px">
          ${mtAura(aura,rc)}
          <span class="mt-shd" aria-hidden="true" style="bottom:-2%;width:70%;height:8%"></span>
          <div class="mt-breathe" style="position:absolute;inset:0">${mtSprite(id,true,false,'Kael montado: '+name)}</div>
        </div>
        <span class="mt-seal"><i></i>${XMT.view?'Prévia da aura com '+mtStars(vs):isEq?'Na batalha: Kael montado':'Prévia do Kael montado'}</span>`
        :`<div class="mt-crestBig" style="position:absolute;left:50%;bottom:10%;width:${box}px;height:${box}px;margin-left:-${box/2}px">${mtSprite(id,false,true,name+' (silhueta, ainda não é sua)')}</div>
        <span class="mt-seal"><i></i>Ainda não é sua</span>`}
        ${burst?'<span class="mt-burst" aria-hidden="true"></span>':''}
      </div>
    </div>`;

  /* ----- nome, raridade, estrelas, nível, aura ----- */
  const info=`<div style="flex:none;display:flex;align-items:center;gap:8px;min-height:50px">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <span style="display:flex;align-items:center;gap:6px;min-width:0"><span class="lil mt-ol" style="font-size:21px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${xRarName(r,name)}</span>
          ${isEq?`<span role="img" aria-label="Equipada" style="flex:none;width:20px;height:20px;border-radius:50%;background:#5fd068;display:flex;align-items:center;justify-content:center"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0d2410" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 12 10 18 20 6"></polyline></svg></span>`:''}</span>
        <span style="display:flex;align-items:center;gap:6px;min-width:0;flex-wrap:wrap">
          <span class="mt-chip${r>=3?' mt-rare':''}" style="background:${rc}">${esc2(rarName)}</span>
          <span role="img" aria-label="${owned?stars+' de '+maxS+' estrelas':'ainda não é sua'}" style="display:flex;gap:1px;flex:none">${Array.from({length:maxS},(_,k)=>mtStarSvg(14,k<stars,k<stars?'mt-stOn':'',(k*0.15).toFixed(2)+'s')).join('')}</span>
          <span class="${pop?'mt-lvPop':''}" style="font-size:13px;font-weight:900;color:#ffe07a;white-space:nowrap">${owned?'Nv. '+n0(lvl):'não obtida'}</span>
        </span>
      </div>
      ${owned?`<div class="mt-box" style="flex:none;max-width:44%;align-items:flex-end;background:#241b14;border:1px solid #4a3a2b">
        <small>${XMT.view?'Prévia com '+mtStars(vs):'Aura com '+mtStars(stars)}</small><b style="font-size:13px;color:${qc.t}">${esc2(mtAuraTxt(aura))}</b></div>`:''}
    </div>`;

  const tabs=`<div role="tablist" aria-label="Seções da montaria" style="height:44px;flex:none;display:flex;gap:4px">${[['det','Detalhes'],['star','Estrelas'],['col','Coleção']].map(t=>{ const on=XMT.tab===t[0];
      return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${t[0]}" class="lil" style="flex:1;min-width:0;border-radius:12px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#4a3420':'#241b14'};color:${on?'#ffe07a':'#c9b9a2'};font-size:15px;padding:0">${t[1]}</button>`; }).join('')}</div>`;

  /* ----- DETALHES ----- */
  const det=()=>`<div class="${pin}" style="display:flex;flex-direction:column;gap:8px">
      <div style="flex:none;display:flex;gap:4px">
        <div class="mt-box" style="flex:1"><small>Ataque</small><b style="color:#ff8a6a">+${mtPct(pct)}</b></div>
        <div class="mt-box" style="flex:1"><small>Vida</small><b style="color:#7fe07a">+${mtPct(pct)}</b></div>
        <div class="mt-box" style="flex:1.3"><small>No máximo (Nv. ${n0(maxL)}, ${mtStars(maxS)})</small><b style="color:#ffe07a">+${mtPct(inf.maxPct)}</b></div>
      </div>
      <div style="flex:none;display:flex;flex-direction:column;gap:3px">
        <span style="display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900"><span style="white-space:nowrap">Nível ${n0(lvl)} / ${n0(cap)}</span><span style="color:#c9b9a2;text-align:right">teto pelo nível do jogador (máx. ${n0(maxL)})</span></span>
        <span class="mt-bar" role="progressbar" aria-label="Nível da montaria" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${lvl}"><span class="mt-barF" style="width:${Math.min(100,Math.round(lvl/Math.max(1,cap)*100))}%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></span></span>
      </div>
      <span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">${owned?(isEq?'O Kael está montado: o bônus de ataque e vida já vale na batalha.':'Equipe para o Kael montar e o bônus valer na batalha.')+' A montaria não ataca sozinha.'
        :'Como conseguir: <b style="color:#f6ecdf">'+esc2(src.t)+'</b>. Nunca por sorteio.'}</span>
    </div>`;

  /* ----- ESTRELAS (a estrela sobe sozinha no módulo quando os fragmentos chegam) ----- */
  const star=()=>{ const need=inf.need|0, have=inf.frags|0, full=owned&&stars>=maxS, sc=Array.isArray(D.starCost)?D.starCost:[];
    const nextGain=owned&&!full?mtCall('pctOf',[id,lvl,stars+1],pct)-pct:0, vA=owned?aura:null;
    return `<div class="${pin}" style="display:flex;flex-direction:column;gap:8px">
      <span style="flex:none;font-size:11px;font-weight:800;color:#c9b9a2">Toque numa estrela para ver a aura no palco</span>
      <div role="group" aria-label="Aura por estrela" style="flex:none;display:flex;gap:4px">${Array.from({length:maxS},(_,k)=>{ const n=k+1, on=owned&&vs===n, got=owned&&n<=stars, a=mtAuraOf(n);
        return `<button data-x="star" data-n="${n}" aria-pressed="${on}" aria-label="${mtStars(n)}: ${esc2(a.name||mtAuraTxt(a))}${got?'':' (prévia)'}" class="mt-sChip" style="border-color:${on?rc:'#4a3a2b'};background:${on?'#3a2c20':'#241b14'}">
          <span style="display:flex;align-items:center;gap:2px"><span class="lil" style="font-size:15px;color:${got?'#ffc94a':'#8f8070'}">${n}</span>${mtStarSvg(13,got,'','')}</span>
          <span style="font-size:9.5px;font-weight:900;color:#c9b9a2;text-align:center">${esc2(mtAuraTxt(a))}</span></button>`; }).join('')}</div>
      ${vA?`<span style="flex:none;font-size:12px;font-weight:900;line-height:1.25">Aura com ${mtStars(vs)}: <span style="color:${qc.t}">${esc2(vA.name||mtAuraTxt(vA))}</span></span>`:''}
      <div style="flex:none;display:flex;flex-direction:column;gap:3px">
        <span style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:900">
          <span class="mt-frag" aria-hidden="true" style="background:linear-gradient(180deg,#fff3c4,${rc})"></span>
          <span style="flex:1;min-width:0">Fragmentos de ${esc2(name)}</span>
          <span style="color:#ffe07a;white-space:nowrap">${!owned?n0(have)+(have===1?' guardado':' guardados'):full?'Máximo':n0(have)+' / '+n0(need)}</span>
        </span>
        <span class="mt-bar" role="progressbar" aria-label="Fragmentos para a próxima estrela" aria-valuemin="0" aria-valuemax="${full?1:Math.max(1,need)}" aria-valuenow="${full?1:Math.min(have,Math.max(1,need))}"><span class="mt-barF" style="width:${!owned?0:full?100:Math.min(100,Math.round(have/Math.max(1,need)*100))}%;background:linear-gradient(90deg,${rc},#fff3c4)"></span></span>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.3">${!owned?'Os fragmentos ficam guardados até a montaria ser sua.':full?'Todas as estrelas alcançadas.':'A estrela sobe sozinha ao juntar '+n0(need)+' fragmentos. Próxima estrela: +'+mtPct(nextGain)+' de ataque e vida.'}</span>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.3">Custo em fragmentos: ${sc.map((c,k)=>(k+2)+'ª estrela '+n0(c)).join(' · ')}${sc.length?' · ':''}cópia repetida = ${n0(D.dupFrags|0)} fragmentos</span>
      </div>
    </div>`; };

  /* ----- COLEÇÃO ----- */
  const col=()=>{ const infs=list.map(q2=>mtInfo(q2)).filter(Boolean), nOwn=infs.filter(m=>m.owned).length;
    return `<div class="${pin}" style="display:flex;flex-direction:column;gap:8px">
      <span style="flex:none;display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900"><span style="white-space:nowrap">Coleção ${n0(nOwn)}/${n0(infs.length)}</span><span style="color:#c9b9a2;text-align:right">Oferta · Passe · Loja · Evento</span></span>
      <div style="flex:none;display:grid;grid-template-columns:repeat(3,1fr);gap:5px">${infs.map(m=>{ const sel=m.id===id, tq=m.owned?xRar(m.rarity|0):xRar(null), tc=xRar(m.rarity|0);
        return `<button data-x="sel" data-id="${m.id}" aria-pressed="${sel}" aria-label="${m.owned?esc2(m.name)+', '+esc2(m.rarityName)+', '+mtStars(m.stars|0)+', nível '+(m.lvl|0)+(m.equipped?', equipada':''):'Montaria '+esc2(m.rarityName)+' ainda não obtida. Como conseguir: '+esc2(mtSrc(m.id).t)}" class="mt-tile${tq.cls}"${tq.at} style="${tq.on?'':'border:2px solid '+(m.owned?tc.c:'#3a2e24')+';'}background:${m.owned?'#2a2019':'#140f0b'}">
          ${sel?'<span class="mt-tileSel" aria-hidden="true" style="position:absolute;inset:2px;border-radius:9px;border:2px solid #ffc94a;pointer-events:none"></span>':''}
          <span class="mt-crest">${MT_TILE_ART?mtSprite(m.id,false,!m.owned,''):`<span aria-hidden="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;opacity:${m.owned?1:0.5}">${MT_SHOE(40,m.owned?tc.c:'#120c08')}</span>`}</span>
          <span style="font-size:11px;font-weight:900;line-height:1.05;text-align:center;color:${m.owned?tc.t:'#8f8070'}">${m.owned?esc2(m.name):'???'}</span>
          <span style="display:flex;align-items:center;justify-content:center;gap:2px;font-size:9.5px;font-weight:900;line-height:1.1;text-align:center;color:${tc.c}">${m.owned?n0(m.stars|0)+mtStarSvg(10,true,'','')+'<span>· Nv. '+n0(m.lvl|0)+'</span>':esc2(mtSrc(m.id).t)}</span>
          ${m.equipped?'<span role="img" aria-label="Equipada" style="position:absolute;top:4px;right:4px;width:14px;height:14px;border-radius:50%;background:#5fd068;border:2px solid #1d1611"></span>':''}
        </button>`; }).join('')}</div>
    </div>`; };

  const body=XMT.tab==='col'?col():XMT.tab==='star'?star():det();
  const panel=`<div style="flex:none;position:relative;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;padding:8px;display:flex;flex-direction:column">${body}</div>`;

  /* ----- AÇÃO PRINCIPAL (fixa embaixo, fora da rolagem) ----- */
  let bar='';
  if(owned){ const atMax=cu.reason==='max', atCap=cu.reason==='cap', noGold=cu.reason==='money', can=cu.ok===true;
    const gain=can||noGold?mtCall('pctOf',[id,lvl+1,stars],pct)-pct:0;
    const note=atMax?'Nível máximo alcançado':atCap?'No teto: '+mtCapTxt(cu):can||noGold?'Próximo nível: +'+mtPct(gain)+' de ataque e vida':'Subir de nível indisponível agora';
    const l1=atMax?'Nível máximo':atCap?'No teto':'Subir nível', l2=atMax?'Nv. '+n0(maxL):atCap?'Nv. '+n0(cap):gNum(cu.gold||0);
    bar=`<span style="display:block;margin-bottom:6px;font-size:11px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.25">${note}</span>
      <div style="display:flex;gap:8px">
        <button data-x="up" class="mt-btn ${can?'mt-gold':'mt-off'}" aria-disabled="${!can}" aria-label="${atMax?'Nível máximo':atCap?'Nível no teto':'Subir nível por '+n0(cu.gold||0)+' de ouro'}" style="flex:1.4">
          <img src="assets/ui/coin.png" alt="" style="width:22px;height:22px;object-fit:contain;flex:none${can||noGold?'':';opacity:.45'}">
          <span style="display:flex;flex-direction:column;line-height:1.05;text-align:left;min-width:0"><span>${l1}</span><span style="font-size:12px">${l2}</span></span></button>
        <button data-x="equip" class="mt-btn lil ${isEq?'mt-eqd':'mt-green'}" aria-pressed="${isEq}" style="flex:1;font-size:${fs}px">${isEq?'Desmontar':'Equipar'}</button>
      </div>`; }
  else { const go=src.go==='offer'&&mtOfferOn();
    bar=`<span style="display:block;margin-bottom:6px;font-size:12px;font-weight:800;color:#c9b9a2;text-align:center;line-height:1.25">Como conseguir: <b style="color:#f6ecdf">${esc2(src.t)}</b>. Nunca por sorteio.</span>
      <div style="display:flex;gap:8px">${go?`<button data-x="offer" class="mt-btn mt-gold mt-pulse lil" style="flex:1;font-size:${fs}px">${esc2(src.b)}</button>`:''}${XMT.tab!=='col'?`<button data-x="gocol" class="mt-btn mt-ghost lil" style="flex:1;font-size:${fs}px">Ver coleção</button>`:''}</div>`; }
  const toast=XMT.toast&&now-XMT.toastT<2400?`<span class="mt-toast" role="status" style="position:absolute;left:50%;bottom:100%;margin-bottom:8px;z-index:6;width:max-content;max-width:calc(100% - 24px);padding:8px 12px;border-radius:12px;background:#0e0a07;border:2px solid #ffc94a;font-size:12px;font-weight:900;text-align:center;line-height:1.25;pointer-events:none">${esc2(XMT.toast)}</span>`:'';
  const foot=`<div style="position:relative;flex:none;padding:8px 10px 10px;border-top:2px solid #33271d;background:#16110d">${toast}${bar}</div>`;

  V.innerHTML=xWrap(d,'mt-root '+(XMT.anim?'mt-in':''),`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="mt_scroll" class="x-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;padding:6px 10px 10px">${stage}${info}${tabs}${panel}</div>${foot}</div>`);
  XMT.anim=false; XMT.pin=false;
  if(y0){ const sc=document.getElementById('mt_scroll'); if(sc) sc.scrollTop=y0; }
}

/* ---------- toques ---------- */
function mtClick(b,ev){
  const a=b.dataset.x;
  if(a==='back'){ snd('ui_tap'); if(window.Screens&&typeof Screens.close==='function') Screens.close(); return; }
  if(a==='offer'){ snd('ui_tap'); if(!(mtOfferOn()&&Panels.open('offer'))){ mtToast('A oferta não está disponível agora'); render(); } return; }
  if(!mtReady()) return;
  const host=mtHost(), o=mtSave(), list=mtIds(); if(!list.length||mtHidden(list,o)) return;
  const id=XMT.sel, idx=list.indexOf(id); if(idx<0) return;
  const inf=mtInfo(id); if(!inf) return; const name=inf.name||'Montaria';
  if(a==='tab'){ if(XMT.tab!==b.dataset.t&&/^(det|star|col)$/.test(b.dataset.t)){ snd('ui_tap'); XMT.tab=b.dataset.t; XMT.view=0; XMT.pin=true; render(); } return; }
  if(a==='pg'){ const i=idx+(+b.dataset.d<0?-1:1); if(i<0||i>=list.length) return; snd('ui_tap'); XMT.sel=list[i]; XMT.view=0; render(); return; }
  if(a==='sel'){ const q=b.dataset.id; if(list.indexOf(q)<0) return; snd('ui_tap'); XMT.sel=q; XMT.view=0; if(!o.owned[q]){ XMT.tab='det'; XMT.pin=true; } render(); return; }
  if(a==='gocol'){ snd('ui_tap'); XMT.tab='col'; XMT.pin=true; render(); return; }
  if(a==='star'){ const n=Math.max(1,Math.min(mtM().DATA.maxStars|0,+b.dataset.n|0)); snd('ui_tap');
    if(!inf.owned) mtToast('Consiga a montaria primeiro: '+mtSrc(id).t); else if(n===(inf.stars|0)&&!XMT.view) mtToast('Esta é a aura atual de '+name);
    else XMT.view=(n===(inf.stars|0)||XMT.view===n)?0:n;
    render(); return; }
  if(!inf.owned){ if(a==='up'||a==='equip'){ mtToast('Consiga a montaria primeiro: '+mtSrc(id).t); render(); } return; }
  if(a==='up'){ const c=mtCall('canUpgrade',[S,host,id],{ok:false,reason:'off'});
    if(!c.ok){ snd('ui_tap');
      mtToast(c.reason==='max'?'Nível máximo alcançado':c.reason==='cap'?'Teto do nível '+n0(c.cap|0)+': '+mtCapTxt(c)
        :c.reason==='money'?'Falta ouro: o próximo nível custa '+n0(c.gold||0):'Subir de nível indisponível agora'); render(); return; }
    const r=mtCall('upgrade',[S,host,id,1],{ok:false});
    if(!r.ok){ snd('ui_tap'); mtToast(r.reason==='money'?'Falta ouro: o próximo nível custa '+n0(c.gold||0):'Não foi possível subir o nível agora'); render(); return; }
    snd('upgrade'); statsChanged(); const n2=mtInfo(id)||inf; XMT.popT=Date.now();
    mtToast(name+' no nível '+n0(n2.lvl|0)+': +'+mtPct(n2.pct)+' de ataque e vida (custou '+n0(r.spent||0)+' de ouro)'); render(); return; }
  if(a==='equip'){
    if(o.eq===id){ if(mtCall('equip',[S,null],false)){ snd('ui_tap'); statsChanged(); mtToast('O Kael desmontou: o bônus de '+name+' parou de valer'); } else mtToast('Não foi possível desmontar agora'); }
    else if(mtCall('equip',[S,id],false)){ snd('claim'); statsChanged(); XMT.burstT=Date.now(); mtToast(name+' equipada: +'+mtPct(inf.pct)+' de ataque e vida'); }
    else mtToast('Não foi possível equipar agora');
    render(); return; }
}

if(!('mounts' in PANEL_ON)) PANEL_ON.mounts=false;
Panels.add('mounts',{title:'Montarias',render:scrMounts,click:mtClick,
  /* 4x por segundo: só redesenha quando muda o que o botão de subir nível mostra (ouro que entrou, nível do jogador que subiu) */
  tick(){ if(XMT.sig===null||!mtReady()||typeof view==='undefined'||view!=='mounts') return;
    const id=XMT.sel, inf=id?mtInfo(id):null; if(!inf||!inf.owned) return;
    if(mtUpSig(id,mtCall('canUpgrade',[S,mtHost(),id],{ok:false,reason:'off',gold:0}))!==XMT.sig) render(); },
  busy(){ return false; },
  onOpen(op){ XMT.anim=true; XMT.pin=true; XMT.view=0; XMT.toast=''; XMT.burstT=0; XMT.popT=0; XMT.sig=null;
    XMT.tab=op&&op.tab&&/^(det|star|col)$/.test(op.tab)?op.tab:'det';
    if(mtReady()){ const o=mtSave(), list=mtIds(); XMT.sel=op&&op.mount&&list.indexOf(op.mount)>=0?op.mount:(list.indexOf(o.eq)>=0?o.eq:XMT.sel); } },
  onClose(){ XMT.view=0; XMT.toast=''; XMT.burstT=0; XMT.popT=0; XMT.sig=null; } });
