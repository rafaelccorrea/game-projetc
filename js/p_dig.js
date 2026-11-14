'use strict';
/* ================= TELA ESCAVAÇÃO (docs/LIGACOES_LOM_A.md, seção 2) — NASCE DESLIGADA (PANEL_ON.dig = false) =================
   VISUAL: mock A aprovado pelo dono (docs/proto/v2/a/mocks/esc_a.jpg): caverna escura, era e camada à esquerda, picaretas (com a recarga), bomba e
   broca em blocos à direita, grade de blocos de terra e de rocha dentro de uma moldura de terra, buracos escuros com o achado brilhando e o botão
   dourado grande "Descer" embaixo. RESSALVA DO DONO: o HERÓI FICA FORA DA GRADE: ele aparece na beira da escavação, acima da grade, ao lado do
   aviso (bloco próprio, sem posição absoluta). A grade inteira é toque direto nas células.
   Camada de 5 x 6 células, picaretas com recarga, bomba, broca, escada e o total achado.
   NENHUMA regra e NENHUM número aqui. Tudo vem do js/sys/dig.js (Sys.dig):
   - tudo o que a tela mostra: Sys.dig.view(S, host) → {picks, max, nextInMs, bombs, drills, depth, era, eraName, atBottom, stairsOpen, cols, rows,
     cells:[{r, c, open, hp, rock, canDig, item}], got, pend};
   - toque na célula: Sys.dig.hit(S, host, r, c) · bomba: Sys.dig.bomb(S, host, r, c) · broca: Sys.dig.drill(S, host, coluna) · Descer: Sys.dig.descend(S, host).
     UMA chamada por toque; a recusa do módulo vira o aviso (blocked, picks, cell, bombs, drills, stairs);
   - de onde vêm picaretas e ferramentas: Sys.dig.DATA.energy e DATA.grants.
   DOIS TOQUES: bomba e broca (1º toque escolhe a ferramenta, 2º toca a célula; depois a tela volta para a picareta) e Descer (o que ficou na camada
   se perde: 1º toque arma, 2º confirma). A picareta é UM toque por célula: é a regra da especificação ("cada toque gasta 1 picareta").
   NADA À VENDA: não há botão de compra, de recarga nem anúncio. O que falta mostra "Como conseguir".
   HERÓI: window.drawHeroFull (js/battle.js), a pé, com a arma na mão e o pet por último; nunca imagem fixa.
   Chaves: PANEL_ON.dig (esta tela) e Sys.dig.DATA.on (o sistema). Sistema desligado: aviso e Voltar, sem escrever no save.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='dig';

/* ---------- ARTE: UMA função (dgIcon) para os ícones e UMA constante (DG_TILE) para as células.
   A Arte entregou: ladrilhos em assets/ui/dig (dirt, rock, hole, ladder) e ícones em assets/icons/dig (pickaxe, bomb, drill, fragment, chest), todos
   256 x 256. Os ícones vieram pintados SOBRE um ladrilho de terra ("ladrilho + item"): na célula aberta eles ocupam a célula inteira; nos botões de
   ferramenta entram como bloquinho de cantos redondos. chest.png = o baú aberto com pedras (as pedras de prática). A escada é o ladrilho ladder.png.
   Não há ladrilho de rocha rachada: é rock.png com a rachadura em SVG por cima (DG_CRACK).
   RESERVA: o desenho por código (DG_GLY) vem junto, escondido, e aparece sozinho se a imagem falhar (onerror); o ladrilho tem uma cor por baixo. ---------- */
const DG_ART={pick:'assets/icons/dig/pickaxe.png',bomb:'assets/icons/dig/bomb.png',drill:'assets/icons/dig/drill.png',frag:'assets/icons/dig/fragment.png',stones:'assets/icons/dig/chest.png',stairs:'assets/ui/dig/ladder.png'};
const DG_PNG={dirt:'assets/ui/dig/dirt.png',rock:'assets/ui/dig/rock.png',hole:'assets/ui/dig/hole.png'};
const DG_GLY={
  pick:'<path d="M9 28L21 12" fill="none" stroke="#3a2210" stroke-width="5.4" stroke-linecap="round"/><path d="M9 28L21 12" fill="none" stroke="#a8743a" stroke-width="3" stroke-linecap="round"/><path d="M5 12c6-7 17-8 23-2-7-2-14-1-20 4z" fill="#cdd2dc" stroke="#30343e" stroke-width="1.5" stroke-linejoin="round"/>',
  bomb:'<circle cx="15" cy="20" r="9" fill="#33343e" stroke="#0f1016" stroke-width="1.6"/><ellipse cx="12" cy="16.5" rx="3" ry="2" fill="#8d92a6" opacity=".7"/><path d="M21 13l4-4" fill="none" stroke="#8a6a3a" stroke-width="2.4" stroke-linecap="round"/><path d="M25 9l3-1M25 9l1-3M25 9l3 2" fill="none" stroke="#ffb84a" stroke-width="2" stroke-linecap="round"/>',
  drill:'<path d="M10 5h12v7H10z" fill="#e6ac3c" stroke="#5a3a0a" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 12h12l-6 17z" fill="#b3b9c6" stroke="#30343e" stroke-width="1.5" stroke-linejoin="round"/><path d="M11.5 15.5l8.6 2.2M13 19.8l5.8 1.6M14.4 24l3 .9" fill="none" stroke="#30343e" stroke-width="1.4" stroke-linecap="round"/>',
  stones:'<path d="M5 28c3-5 19-5 22 0z" fill="#8a5a30" stroke="#3a2210" stroke-width="1.3" stroke-linejoin="round"/><path d="M16 4l8 6-2 14H10L8 10z" fill="#eef1f6" stroke="#5a5f6c" stroke-width="1.5" stroke-linejoin="round"/><path d="M16 4l-3 8 3 12 3-12z" fill="#fff3a8"/>',
  frag:'<path d="M8 9l11-4 6 8-4 4 3 6-9 5-3-8-6-2z" fill="#ffd66a" stroke="#7a4a0a" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 11l7-2 2 4-9 4z" fill="#fff0b8"/><circle cx="16.5" cy="20" r="2.3" fill="#4aa8ff" stroke="#1b3c6a" stroke-width="1.1"/>',
  stairs:'<path d="M11 4v24M21 4v24M11 9h10M11 15h10M11 21h10M11 27h10" fill="none" stroke="#3a2210" stroke-width="5.2" stroke-linecap="round"/><path d="M11 9h10M11 15h10M11 21h10M11 27h10" fill="none" stroke="#e0ad62" stroke-width="2.4" stroke-linecap="round"/><path d="M11 4v24M21 4v24" fill="none" stroke="#b9843f" stroke-width="2.8" stroke-linecap="round"/>'};
function dgIcon(key){ const k=String(key||'');
  const fb=on=>'<svg class="dg-ic'+(on?' fb':'')+'" viewBox="0 0 32 32" aria-hidden="true">'+(Object.prototype.hasOwnProperty.call(DG_GLY,k)?DG_GLY[k]:'')+'</svg>';
  if(Object.prototype.hasOwnProperty.call(DG_ART,k)) return '<img class="dg-ic" src="'+esc2(DG_ART[k])+'" alt="" onerror="this.style.display=\'none\';this.nextSibling.style.display=\'block\'">'+fb(true);
  return fb(false); }
/* ladrilho de cada estado da célula: a imagem da Arte com uma cor de reserva por baixo. dirtOff / rockOff = o mesmo bloco no escuro (ainda não alcança). */
const DG_TILE={
  dirt:'url('+DG_PNG.dirt+') center/cover no-repeat,#70462a',
  rock:'url('+DG_PNG.rock+') center/cover no-repeat,#7a6c66',
  hole:'url('+DG_PNG.hole+') center/cover no-repeat,#2a180e',
  shade:'linear-gradient(rgba(14,8,4,.58),rgba(14,8,4,.58)),'};
DG_TILE.dirtOff=DG_TILE.shade+DG_TILE.dirt; DG_TILE.rockOff=DG_TILE.shade+DG_TILE.rock;
const DG_CRACK='<svg class="dg-ck" viewBox="0 0 40 40" preserveAspectRatio="none" aria-hidden="true"><path d="M8 4l8 10-4 6 9 6-3 10M16 14l10-4" fill="none" stroke="#1d1611" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const dM=()=>(window.Sys&&Sys.dig)||null;
const dHas=()=>{ const M=dM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.hit==='function'&&typeof M.bomb==='function'&&typeof M.drill==='function'&&typeof M.descend==='function'); };
const dOk=()=>{ try{ return dHas()&&dM().DATA.on===true; }catch(e){ return false; } };
const dHost=()=>(window.Sys&&Sys.host)||null;
const dSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const dRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
/* o módulo já avisa o jogo (host.onChange grava); sem esse gancho, a tela grava */
const dStore=()=>{ try{ const h=dHost(); if(h&&typeof h.onChange==='function') return; if(typeof save==='function') save(); }catch(e){} };
const dNow=()=>Date.now();
const dN=v=>{ try{ return typeof n0==='function'?n0(v):String(Math.round(+v||0)); }catch(e){ return String(Math.round(+v||0)); } };
const dPl=(n,one,many)=>dN(n)+' '+(n===1?one:many);
const dView=()=>{ try{ const v=dM().view(S,dHost()); return v&&Array.isArray(v.cells)?v:null; }catch(e){ return null; } };
const dEra=e=>{ try{ return String(dM().DATA.eraName[e]||''); }catch(e2){ return ''; } };
const dMin=ms=>Math.max(1,Math.ceil((+ms||0)/60000));
/* "próxima em 18 min": o texto é do módulo (Sys.dig.nextText) quando ele tem a função; 0 = cheias */
const dNext=ms=>{ if(!(ms>0)) return 'cheias'; try{ const M=dM(); if(M&&typeof M.nextText==='function'){ const t=String(M.nextText(ms)||''); if(t) return t; } }catch(e){} return 'próxima em '+dN(dMin(ms))+' min'; };

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.dg-root). Paleta do mock A: caverna marrom-escura, creme, ouro (e DG_TILE para os blocos) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.dg-root{--dg-ink:#fbeedb;--dg-mut:#dcc7a6;--dg-soft:#f1e2c6;--dg-gold:#ffc94a;--dg-gold1:#ffe58a;--dg-gold2:#f2a826;--dg-goldsh:#a8690f;--dg-goldline:#4a2a08;--dg-goldink:#2a1403;
  --dg-cave1:rgba(58,32,14,.5);--dg-cave2:rgba(14,7,3,.9);--dg-tile:rgba(24,16,12,.88);--dg-tileline:#6a5642;--dg-rim:#5a3718;--dg-rimline:#2a170a;--dg-pit:#160d07;
  --dg-card:rgba(24,13,6,.78);--dg-line:rgba(255,226,180,.22);--dg-ok:#8df07a;--dg-ok1:#9cf08f;--dg-ok2:#3fae3c;--dg-bad:#ffb3a8;--dg-cellline:#2a170a;--dg-lit:#ffe9c4;color:var(--dg-ink)}
.dg-root,.dg-root *{box-sizing:border-box}
.dg-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.dg-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.dg-cave{flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;background:radial-gradient(ellipse at 50% 42%,var(--dg-cave1),var(--dg-cave2) 82%)}
.dg-in{animation:dg-in .25s ease-out both}
@keyframes dg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes dg-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.dg-ic{display:block;width:26px;height:26px;flex:none;object-fit:contain}
.dg-ic.fb{display:none}
.dg-tl img.dg-ic{width:34px;height:34px;border-radius:8px}
.dg-top{flex:none;display:flex;align-items:center;gap:8px;margin:8px 10px 0;min-width:0}
.dg-hd{flex:1 1 92px;min-width:92px}
.dg-hd b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:15px;line-height:1.15;color:var(--dg-lit);overflow-wrap:anywhere;text-shadow:0 1px 0 #1a0d04}
.dg-tools{flex:0 1 auto;display:grid;grid-template-columns:minmax(0,104px) minmax(0,46px) minmax(0,46px);gap:5px;min-width:0}
.dg-tl,.xs .dg-tl{display:flex;align-items:center;gap:4px;min-width:0;min-height:46px;padding:3px 5px;border-radius:10px;border:2px solid var(--dg-tileline);background:var(--dg-tile);color:var(--dg-ink);text-align:left;box-shadow:inset 0 2px 0 rgba(255,255,255,.08),0 2px 0 rgba(0,0,0,.5)}
.dg-tl.sq,.xs .dg-tl.sq{flex-direction:column;justify-content:center;gap:0;padding:2px;text-align:center}
.dg-tl.sq .dg-ic,.dg-tl.sq img.dg-ic{width:28px;height:28px;border-radius:7px}
.dg-tl.sq.z .dg-ic{opacity:.5}
.dg-tl .t{flex:1;min-width:0;display:flex;flex-direction:column}
.dg-tl b{font-size:14px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums;color:var(--dg-lit)}
.dg-tl.sq b{font-size:12px;line-height:1}
.dg-tl small{font-size:9.5px;font-weight:800;line-height:1.15;color:var(--dg-mut);overflow-wrap:anywhere}
.dg-tl[aria-pressed="true"],.xs .dg-tl[aria-pressed="true"]{border-color:var(--dg-gold);background:rgba(70,44,10,.92);box-shadow:0 0 10px rgba(255,201,74,.45),inset 0 0 0 1px rgba(255,229,138,.5)}
.dg-tl:active{transform:translateY(1px)}
.dg-say{flex:none;display:flex;align-items:flex-end;gap:8px;margin:4px 10px 0;min-width:0}
.dg-hero{flex:none;width:104px;height:68px}
.dg-hero canvas{display:block;width:100%;height:100%}
.dg-msg{flex:1;min-width:0;min-height:36px;display:flex;align-items:center;justify-content:center;padding:2px 4px;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--dg-gold1);overflow-wrap:anywhere}
.dg-msg.bad{color:var(--dg-bad)}
.dg-body{flex:1;min-height:0;padding:2px 10px 16px}
.dg-grid{display:grid;grid-template-columns:repeat(var(--dg-cols,5),minmax(0,1fr));gap:5px;padding:8px;border-radius:16px;background:var(--dg-pit);border:3px solid var(--dg-rim);box-shadow:0 0 0 2px var(--dg-rimline),inset 0 0 16px #000,0 0 22px rgba(255,170,70,.16)}
.dg-c,.xs .dg-c{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:44px;aspect-ratio:1;padding:0;border-radius:9px;border:0;color:var(--dg-ink);overflow:hidden;box-shadow:none}
.dg-c.lit,.xs .dg-c.lit{box-shadow:0 0 0 2px rgba(255,224,160,.85)}
.dg-c:active{transform:translateY(1px)}
.dg-o{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;min-width:0;min-height:44px;aspect-ratio:1;padding-bottom:3px;border-radius:9px;overflow:hidden;font-size:12px;font-weight:900;line-height:1;color:#fff}
.dg-o.gl{box-shadow:0 0 8px 1px rgba(255,214,110,.5)}
.dg-o>*{position:relative}
.dg-o.new .dg-ic,.dg-o.new b{animation:dg-pop .3s ease-out both}
.dg-o img.dg-ic{position:absolute;left:0;top:0;width:100%;height:100%;border-radius:9px}
.dg-o svg.dg-ic{width:60%;height:auto;aspect-ratio:1;max-width:44px;margin:auto}
.dg-o b{padding:1px 5px;border-radius:7px;background:rgba(20,10,4,.82)}
.dg-ck{position:absolute;left:0;top:0;width:100%;height:100%}
.dg-ft{display:flex;gap:8px;align-items:center;justify-content:center;margin-top:14px;min-height:66px;min-width:0}
.dg-ft p,.dg-hint{margin:0;font-size:12px;font-weight:800;line-height:1.4;text-align:center;color:var(--dg-mut);overflow-wrap:anywhere}
.dg-ft p{flex:1;min-width:0}
.dg-hint{margin-top:8px}
.dg-bt,.xs .dg-bt{flex:0 1 236px;min-width:0;min-height:56px;margin:5px;border-radius:14px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:24px;line-height:1.1;padding:4px 10px;text-align:center;overflow-wrap:anywhere;border:3px solid #fff3b8;background:linear-gradient(180deg,var(--dg-gold1),var(--dg-gold2));color:#2a1403;
  box-shadow:0 0 0 3px var(--dg-goldsh),0 0 0 5px var(--dg-goldline),0 5px 0 5px var(--dg-goldline),0 0 22px 6px rgba(255,190,70,.45),inset 0 3px 0 rgba(255,255,255,.5)}
.dg-bt.b,.xs .dg-bt.b{flex:1 1 auto;font-family:Nunito,system-ui,sans-serif;font-weight:900;font-size:14.5px;border-color:#d8ffd0;background:linear-gradient(180deg,var(--dg-ok1),var(--dg-ok2));color:#0d2410;box-shadow:0 0 0 3px #1f6a1c,0 0 0 5px #0d2410,0 5px 0 5px #0d2410}
.dg-bt:active{transform:translateY(2px)}
.dg-box{margin-top:12px;border-radius:14px;background:var(--dg-card);border:2px solid var(--dg-rim);box-shadow:0 0 0 1px var(--dg-rimline);padding:8px 12px 10px;min-width:0}
.dg-h5{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dg-gold1);font-weight:900}
.dg-tot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.dg-tot div{border-radius:10px;background:rgba(255,236,200,.08);padding:6px 2px;text-align:center;min-width:0}
.dg-tot b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;color:var(--dg-ok)}
.dg-tot small{display:block;font-size:10px;font-weight:900;color:var(--dg-mut);line-height:1.2;overflow-wrap:anywhere}
.dg-box p{margin:6px 0 0;font-size:12px;font-weight:800;line-height:1.45;color:var(--dg-soft);overflow-wrap:anywhere}
.dg-box p b{color:var(--dg-ok)}
.dg-box ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.dg-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}
.dg-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--dg-soft);overflow-wrap:anywhere}
.dg-off .dg-bt{flex:none;min-width:150px;font-size:20px}
@media (prefers-reduced-motion:reduce){.dg-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={tool:'pick',arm:false,msg:'',bad:false,msgT:0,fresh:[],anim:true,sig:'',sigT:0,raf:0,t0:0,ts:0,herr:0};
function dSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=dNow(); }
/* fundo: o cenário da era atual (regra da casa), escurecido; o tom de caverna do mock vem do véu marrom por cima (.dg-cave) */
const dBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.5,0.82):'#16110d'; }catch(e){ return '#16110d'; } };

/* ---------- HERÓI NA BEIRA DA ESCAVAÇÃO (fora da grade, por ordem do dono): window.drawHeroFull, a pé; o pet é o último desenho ---------- */
const dIsOn=()=>{ try{ return typeof view!=='undefined'&&view===N; }catch(e){ return false; } };
const dCanHero=()=>{ try{ return !X.herr&&typeof window.drawHeroFull==='function'&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
function dFrame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||104, h=c.clientHeight||68;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  const hs=(typeof HS==='number'&&HS>0)?HS:155, fr=Math.max(36,Math.min(h-6,w*0.62,120)), gy=h-4, hx=Math.round(w*0.4);
  try{ x.save(); x.globalAlpha=0.4; x.fillStyle='#0a0502'; x.beginPath(); x.ellipse(hx,gy+1,fr*0.26,4,0,0,7); x.fill(); x.restore(); }catch(e){}
  x.setTransform(dpr,0,0,dpr,0,0);
  try{ window.drawHeroFull(x,hx,gy,fr/hs,{t:t,mount:false}); }catch(e){ X.herr=1; } }
function dLoop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('dg_hero'); }catch(e){} if(!c||!dIsOn()||!dCanHero()){ X.t0=0; return; }
  X.ts=ts; try{ dFrame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(dLoop); }
function dLoopStart(){ try{ if(!dCanHero()) return; const c=document.getElementById('dg_hero'); if(!c) return; if(X.ts){ try{ dFrame(c,X.ts); }catch(e){} }
    if(!X.raf) X.raf=requestAnimationFrame(dLoop); }catch(e){} }
function dLoopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; X.ts=0; }

/* de onde vêm picaretas e ferramentas (números do DATA do módulo) */
function dSources(){ const D=dM().DATA, E=D.energy||{}, g=D.grants||{}, L=[];
  L.push('Recarga: 1 picareta a cada '+dN(E.everyMin)+' min, até '+dN(E.max));
  if(g.daily) L.push('Missões diárias completas: +'+dPl(g.daily.picks|0,'picareta','picaretas')+', '+dPl(g.daily.daily|0,'vez','vezes')+' por dia');
  if(g.eraLord) L.push('Senhor da Era: '+dPl(g.eraLord.bombs|0,'bomba','bombas')+' na 1ª vitória de cada era');
  if(g.event) L.push('Eventos: '+dPl(g.event.picks|0,'picareta','picaretas')+', '+dPl(g.event.bombs|0,'bomba','bombas')+' e '+dPl(g.event.drills|0,'broca','brocas'));
  L.push('Bomba e broca também aparecem dentro das camadas');
  return L; }
/* motivo de uma recusa do módulo, em texto de jogador */
/* a FONTE do texto é o módulo (Sys.dig.why); a reserva daqui só vale se ele não tiver a função. A tela só acrescenta o tempo da próxima picareta
   (número do módulo) e a dica de onde olhar. */
const DG_WHY={blocked:'Cave perto de uma aberta',picks:'Sem picaretas',cell:'Já está aberta',bombs:'Sem bombas',drills:'Sem brocas',stairs:'Ache a escada primeiro',off:'Escavação desligada'};
const dWhy=k=>{ let t=''; try{ const M=dM(); if(M&&typeof M.why==='function') t=String(M.why(k)||''); }catch(e){ t=''; } return t||DG_WHY[k&&typeof k==='object'?k.reason:k]||'Não deu agora'; };
function dReason(r){ const why=r&&r.reason, t=dWhy(r);
  if(why==='picks') return t+': '+dNext(Math.max(1,r.nextInMs|0));
  if(why==='bombs'||why==='drills') return t+'. Veja em Como conseguir';
  return t; }
/* o que o toque achou (texto do aviso, com o que o módulo devolveu) */
function dFound(r){ const L=[]; if(r.stones>0) L.push('+'+dPl(r.stones,'pedra de prática','pedras de prática'));
  const fe={}; for(const f of (r.frags||[])) fe[f.era]=(fe[f.era]||0)+(f.n|0); for(const e in fe) L.push('+'+dPl(fe[e],'fragmento','fragmentos')+' de '+dEra(e));
  if(r.bombs>0) L.push('+'+dPl(r.bombs,'bomba','bombas')); if(r.drills>0) L.push('+'+dPl(r.drills,'broca','brocas')); if(r.stairs) L.push('Achou a escada');
  return L.join(' · '); }

/* ---------- desenho ---------- */
function dOffHtml(d,msg){ V.innerHTML=xWrap(d,'dg-root '+(X.anim?'dg-in':''),'<div class="dg-w" style="background:'+dBg()+'"><div class="dg-cave"><div class="dg-off"><span role="alert">'+esc2(msg)+'</span><button class="dg-bt" data-x="back">Voltar</button></div></div></div>'); X.anim=false; X.sig='x'; }
function dCell(c){ const pos='linha '+(c.r+1)+', coluna '+(c.c+1);
  if(c.open){ const it=c.item, fr=X.fresh.indexOf(c.r+','+c.c)>=0?' new':''; let in_='', lb='vazio', gl='';
    if(it){ if(it.t==='stones'){ in_=dgIcon('stones')+'<b>+'+dN(it.n)+'</b>'; lb=dPl(it.n|0,'pedra de prática','pedras de prática'); gl=' gl'; }
      else if(it.t==='frag'){ in_=dgIcon('frag')+'<b>+'+dN(it.n)+'</b>'; lb=dPl(it.n|0,'fragmento','fragmentos')+' de '+dEra(it.era); gl=' gl'; }
      else if(it.t==='bomb'){ in_=dgIcon('bomb'); lb='bomba'; } else if(it.t==='drill'){ in_=dgIcon('drill'); lb='broca'; } else if(it.t==='stairs'){ in_=dgIcon('stairs'); lb='escada'; } }
    return '<span class="dg-o'+gl+fr+'" role="img" aria-label="'+esc2('Aberto, '+pos+': '+lb)+'" style="background:'+DG_TILE.hole+'">'+in_+'</span>'; }
  const lit=c.canDig, bg=c.rock?(lit?DG_TILE.rock:DG_TILE.rockOff):(lit?DG_TILE.dirt:DG_TILE.dirtOff), crack=c.rock&&c.hp<2;
  return '<button class="dg-c'+(lit?' lit':'')+'" data-x="cell" data-r="'+c.r+'" data-c="'+c.c+'" aria-label="'+esc2((c.rock?(crack?'Rocha rachada':'Rocha'):'Terra')+', '+pos+(lit?'':', ainda não alcança'))+'" style="background:'+bg+'">'+(crack?DG_CRACK:'')+'</button>'; }
/* picareta: bloco largo com o número e a recarga · bomba e broca: bloco quadrado com o ícone e "×N" (como no mock) */
function dTool(id,num,sub,lb){ const sq=id!=='pick';
  return '<button class="dg-tl'+(sq?' sq'+(sub?'':' z'):'')+'" data-x="tool" data-t="'+id+'" aria-pressed="'+(X.tool===id)+'" aria-label="'+esc2(lb)+'">'+dgIcon(id)+(sq?'<b>'+num+'</b>':'<span class="t"><b>'+num+'</b><small>'+esc2(sub)+'</small></span>')+'</button>'; }
function dDraw(){
  const d=xDims(240)||{};
  if(!dHas()){ dOffHtml(d,'Escavação indisponível agora.'); return; }
  if(!dOk()){ dOffHtml(d,'A Escavação ainda não abriu.'); return; }
  const v=dView(); if(!v){ dOffHtml(d,'Escavação indisponível agora.'); return; }
  if(X.tool==='bomb'&&v.bombs<1) X.tool='pick'; if(X.tool==='drill'&&v.drills<1) X.tool='pick'; if(!v.stairsOpen) X.arm=false;
  let y0=0; try{ const sc0=document.getElementById('dg_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const last=v.era>=8;
  /* ordem do mock: era e camada + ferramentas no alto · (herói na beira, fora da grade, com o aviso ao lado) · grade · Descer; o resto rola abaixo */
  let h='<div class="dg-top"><div class="dg-hd"><b>'+esc2(v.eraName)+' · camada '+dN(v.depth+1)+'</b></div>';
  h+='<div class="dg-tools" role="group" aria-label="Ferramenta">'
    +dTool('pick',dN(v.picks)+'/'+dN(v.max),v.picks>=v.max?'picaretas cheias':dNext(v.nextInMs),'Picareta: '+v.picks+' de '+v.max+', '+dNext(v.nextInMs))
    +dTool('bomb','×'+dN(v.bombs),v.bombs>0?'1':'','Bomba: '+v.bombs+'. Abre em cruz')
    +dTool('drill','×'+dN(v.drills),v.drills>0?'1':'','Broca: '+v.drills+'. Abre a coluna inteira')+'</div></div>';
  h+='<div class="dg-say">'+(dCanHero()?'<div class="dg-hero"><canvas id="dg_hero" role="img" aria-label="Herói na beira da escavação"></canvas></div>':'')
    +'<div id="dg_msg" class="dg-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div></div>';
  h+='<div id="dg_scroll" class="x-scroll dg-body"><div class="dg-grid" style="--dg-cols:'+(v.cols|0)+'">'+v.cells.map(dCell).join('')+'</div>';
  /* escada aberta: botão dourado Descer (dois toques: o que ficou na camada se perde) */
  h+='<div class="dg-ft">'+(v.stairsOpen
    ?(X.arm?'<button class="dg-bt b" data-x="downok">Confirmar: o que ficou nesta camada se perde</button>':'<button class="dg-bt" data-x="down">Descer</button>')
    :'<p>A escada está escondida nesta camada. Ela nunca fica na linha de cima.</p>')+'</div>';
  h+='<p class="dg-hint">'+(v.atBottom?(last?'Você chegou ao fundo da escavação: cada descida traz uma camada nova nesta profundidade.':'Fundo liberado. Para descer mais, chegue à próxima era do jogo; até lá, cada descida traz uma camada nova aqui.'):'Ache a escada para descer. A cada '+dN(dM().DATA.layersPerEra)+' camadas a era muda.')+'</p>';
  const g=v.got||{}, p=v.pend||{}, pf=(p.frags||[]).reduce((a,b)=>a+(b|0),0);
  h+='<section class="dg-box"><div class="dg-h5">Total achado na Escavação</div><div class="dg-tot"><div><b>'+dN(g.stones)+'</b><small>pedras de prática</small></div><div><b>'+dN(g.frags)+'</b><small>fragmentos de relíquia</small></div><div><b>'+dN(g.layers)+'</b><small>camadas descidas</small></div></div>'
    +((p.stones|0)>0||pf>0?'<p>Guardado para entregar: '+[(p.stones|0)>0?dPl(p.stones|0,'pedra de prática','pedras de prática'):'',pf>0?dPl(pf,'fragmento','fragmentos'):''].filter(Boolean).join(' e ')+'. Entra sozinho quando o Treino e as Relíquias estiverem abertos.</p>':'')+'</section>';
  h+='<section class="dg-box"><div class="dg-h5">Como conseguir picaretas e ferramentas</div><ul>'+dSources().map(t=>'<li>'+esc2(t)+'</li>').join('')+'</ul><p><b>Nada à venda.</b> As picaretas voltam sozinhas com o tempo.</p></section></div>';
  V.innerHTML=xWrap(d,'dg-root '+(X.anim?'dg-in':''),'<div class="dg-w" style="background:'+dBg()+'"><div class="dg-cave">'+h+'</div></div>');
  X.anim=false; X.fresh=[]; X.sig=dSigOf(v); X.sigT=dNow();
  if(y0){ try{ const sc=document.getElementById('dg_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  dLoopStart();
}
/* o que muda sozinho: recarga das picaretas (número e minutos), ferramenta ou camada que chega por fora */
const dSigOf=v=>v?[v.picks,v.picks>=v.max?0:dMin(v.nextInMs),v.bombs,v.drills,v.depth,v.round,v.atBottom,v.cells.map(c=>c.open?1:c.hp).join('')].join('|'):'x';

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
function dAfter(r,what){ if(r&&r.ok){ X.fresh=(r.opened||[]).map(p=>p[0]+','+p[1]); dStore(); const f=dFound(r);
    if(f){ dSnd('claim'); dSay(f); } else if(r.hp>0){ dSnd('ui_tap'); dSay('Rocha rachada: falta '+dPl(r.hp|0,'toque','toques')+'.'); } else { dSnd('ui_tap'); dSay(what||''); } }
  else { dSnd('ui_tap'); dSay(dReason(r),true); } }
const ACT={
  back(){ dSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  tool(b){ const t=String(b.dataset.t||''); if(t!=='pick'&&t!=='bomb'&&t!=='drill') return; const v=dView(); if(!v) return; dSnd('ui_tap'); X.arm=false;
    if(t==='bomb'&&v.bombs<1){ X.tool='pick'; dSay(dReason({reason:'bombs'}),true); }
    else if(t==='drill'&&v.drills<1){ X.tool='pick'; dSay(dReason({reason:'drills'}),true); }
    else { X.tool=t; dSay(t==='bomb'?'Bomba pronta: toque numa célula que dá para cavar. Ela abre a célula e as 4 vizinhas.':t==='drill'?'Broca pronta: toque em qualquer célula da coluna. Ela abre a coluna inteira.':''); }
    dRedraw(); },
  cell(b){ const r=parseInt(b.dataset.r,10), c=parseInt(b.dataset.c,10); if(!(r>=0)||!(c>=0)) return; X.arm=false; const t=X.tool, M=dM(), h=dHost(); let out=null;
    try{ out=t==='bomb'?M.bomb(S,h,r,c):t==='drill'?M.drill(S,h,c):M.hit(S,h,r,c); }catch(e){ out={ok:false}; }
    dAfter(out,t==='bomb'?'A bomba abriu o caminho.':t==='drill'?'A broca abriu a coluna.':'');
    if(t!=='pick') X.tool='pick';   /* bomba e broca: uma por vez; cada uso pede escolher a ferramenta de novo */
    dRedraw(); },
  down(){ const v=dView(); if(!v) return; dSnd('ui_tap'); if(!v.stairsOpen){ X.arm=false; dSay(dReason({reason:'stairs'}),true); dRedraw(); return; }
    X.arm=true; dSay('Toque em Confirmar para descer.'); dRedraw(); },
  downok(){ const armed=X.arm; X.arm=false; if(!armed){ dSnd('ui_tap'); dSay('Toque primeiro em Descer.',true); dRedraw(); return; }
    let r=null; try{ r=dM().descend(S,dHost()); }catch(e){ r={ok:false}; }
    if(r&&r.ok){ dSnd('ui_ok'); dStore(); X.tool='pick'; X.anim=true; dSay('Camada '+dN((r.depth|0)+1)+' · '+dEra(r.era)); try{ const sc=document.getElementById('dg_scroll'); if(sc) sc.scrollTop=0; }catch(e){} }
    else { dSnd('ui_tap'); dSay(dReason(r),true); }
    dRedraw(); } };
function dClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!dOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function dUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  for(const k in DG_PNG) if(u.indexOf(DG_PNG[k])<0) u.push(DG_PNG[k]);
  for(const k in DG_ART) if(u.indexOf(DG_ART[k])<0) u.push(DG_ART[k]); return u; }
function dClearMsg(){ X.msg=''; try{ const el=document.getElementById('dg_msg'); if(el) el.innerHTML=''; }catch(e){} }

if(!('dig' in PANEL_ON)) PANEL_ON.dig=false;
Panels.add(N,{title:'Escavação',actions:Object.keys(ACT),iconOf:dgIcon,tiles:DG_TILE,
  render(){ if(typeof pwGate==='function'){ if(pwGate(dUrls())) return; } else if(typeof xGate==='function'&&xGate(dUrls())) return; return dDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return dClick(b); },
  /* relógio das picaretas: confere uma vez por segundo e só redesenha se o número, os minutos ou a camada mudaram */
  tick(){ if(!dOk()) return; if(X.msg&&!X.arm&&X.tool==='pick'&&dNow()-X.msgT>3200) dClearMsg();
    if(X.sig&&X.sig!=='x'&&dNow()-X.sigT>=1000){ X.sigT=dNow(); if(dSigOf(dView())!==X.sig) dRedraw(); } },
  busy(){ return false; },
  onOpen(){ dLoopStop(); X.tool='pick'; X.arm=false; X.msg=''; X.fresh=[]; X.anim=true; X.sig=''; X.herr=0; },
  onClose(){ dLoopStop(); X.tool='pick'; X.arm=false; X.msg=''; } });
})();
