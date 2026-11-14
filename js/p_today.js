'use strict';
/* ================= TELA "HOJE" + "PEGAR TUDO" (docs/LIGACOES_LOM_A.md, seção 4) — NASCE DESLIGADA (PANEL_ON.today = false) =================
   VISUAL: mock B aprovado pelo dono (docs/proto/v2/a/mocks/hoje_b.jpg): cenário claro da era com o herói (na montaria, se tiver) no palco de cima;
   embaixo, a folha de pergaminho com a faixa dourada "Hoje", uma linha clara por coisa (ícone redondo, nome com a quantidade, visto verde no que
   entra no "Pegar tudo" e "Ir" com seta no que abre outra tela) e o botão dourado "Pegar tudo (N)" no centro.
   NENHUMA regra e NENHUM número aqui: tudo vem do js/sys/today.js (Sys.today):
   - a lista: Sys.today.view(S, host) → {on, items:[{id, icon, label, count, kind:'claim'|'go', tab, blocked}], claimable, badge};
   - "Pegar tudo": Sys.today.claimAll(S, host) → {ok, reason, n, by:{id:quantos}, left} (UMA chamada por toque; o módulo nunca gasta nada);
   - tocar numa linha abre a tela dela (Panels.open(tab, {from:'today'}); se não for painel, host.goTab(tab); tab 'battle' = volta para a batalha);
   - texto de recusa e de linha bloqueada: Sys.today.why(reason | blocked).
   O módulo devolve QUANTOS resgates fez por linha (by), não o que cada um deu: o resumo mostra as linhas e, quando o save tem os campos, o ouro e os
   diamantes que entraram (diferença de S.gold / S.gems antes e depois; só leitura).
   Linha que não entra no lote (kind 'go', ou bloqueada pela mochila cheia) fica com o toque próprio: abre a tela.
   HERÓI: window.drawHeroFull (js/battle.js), como está no jogo (montaria, asa e pet); nunca imagem fixa.
   Chaves: PANEL_ON.today (esta tela) e Sys.today.DATA.on (o sistema). Sistema desligado: aviso e Voltar, sem escrever no save.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='today';

/* ---------- ÍCONES DAS LINHAS: UMA função (tdIcon). O módulo manda uma chave (item.icon) e TD_ART diz a imagem de cada tipo de linha:
   as da Arte para esta tela (assets/icons/today: calendar, activity = sino, trophy) e peças que já existiam (Menu, Escavação, Fogueira, títulos).
   dig e relic são "ladrilho + item" da Escavação: entram com os cantos redondos.
   RESERVA: o desenho por código (TD_GLY: medalhão azul com aro) vale para tipo desconhecido e vem junto, escondido, para aparecer sozinho se a
   imagem falhar (onerror). O visto verde, a seta dourada, a faixa e o pergaminho são SVG/CSS. ---------- */
const TD_ART={mail:'assets/icons/menu/mail.png',missions:'assets/icons/menu/missions.png',pass:'assets/icons/menu/pass.png',codex:'assets/icons/menu/codex.png',
  instances:'assets/icons/menu/instances.png',chest:'assets/ui/chest.png',
  calendar:'assets/icons/today/calendar.png',activity:'assets/icons/today/activity.png',trophy:'assets/icons/today/trophy.png',
  camp:'assets/icons/menu/camp.png',duo:'assets/icons/menu/duo.png',thief:'assets/icons/titles/thief.png',
  dig:'assets/icons/dig/pickaxe.png',fire:'assets/ui/fogueira/fg_s1.png',relic:'assets/icons/dig/fragment.png'};
const TD_SQ={dig:1,relic:1};   /* imagens quadradas (ladrilho): cantos redondos */
const TD_GLY={
  calendar:'<rect x="5" y="7" width="22" height="20" rx="3"/><path d="M5 13h22M11 4v6M21 4v6M11 19h4M19 19h2"/>',
  activity:'<path d="M5 25h22M8 25V15M14 25V9M20 25v-7M26 25V12"/>',
  trophy:'<path d="M10 6h12v7a6 6 0 01-12 0zM10 8H5c0 5 2 7 5 7M22 8h5c0 5-2 7-5 7M16 19v5M11 27h10"/>',
  camp:'<path d="M4 26L16 6l12 20zM16 6v20M12 26l4-7 4 7"/>',
  duo:'<circle cx="11" cy="11" r="4"/><circle cx="22" cy="12" r="3.5"/><path d="M4 26c0-5 3-8 7-8s7 3 7 8M19 19c5-1 9 2 9 7"/>',
  thief:'<path d="M6 13c3-5 17-5 20 0l-2 6c-4 3-12 3-16 0z"/><circle cx="12" cy="15" r="1.6"/><circle cx="20" cy="15" r="1.6"/><path d="M11 24c3 2 7 2 10 0"/>',
  dig:'<path d="M7 9c6-5 13-5 19 0M16 6v6M16 12L7 27"/>',
  fire:'<path d="M16 4c3 5 8 8 8 14a8 8 0 01-16 0c0-4 3-6 3-9 2 2 3 3 3 5 1-3 0-6 2-10z"/>',
  relic:'<path d="M16 4l9 6v8c0 5-4 8-9 10-5-2-9-5-9-10v-8z"/><path d="M16 11l3 4-3 5-3-5z"/>',
  dot:'<circle cx="16" cy="16" r="6"/>'};
function tdIcon(key){ const k=String(key||'');
  const art=Object.prototype.hasOwnProperty.call(TD_ART,k), gly=Object.prototype.hasOwnProperty.call(TD_GLY,k)?TD_GLY[k]:TD_GLY.dot;
  const svg='<svg'+(art?' class="fb"':'')+' viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14.6" class="c0"/><g transform="translate(4.8 4.8) scale(.7)" fill="none" stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round" class="g0">'+gly+'</g></svg>';
  if(!art) return '<span class="td-i">'+svg+'</span>';
  return '<span class="td-i"><img src="'+esc2(TD_ART[k])+'" alt=""'+(Object.prototype.hasOwnProperty.call(TD_SQ,k)?' class="sq"':'')+' onerror="this.parentNode.classList.add(\'td-e\')">'+svg+'</span>'; }
const TD_CHEV='<svg class="td-ch" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4l11 8-11 8z" fill="#f2b632" stroke="#5a3208" stroke-width="2.2" stroke-linejoin="round"/></svg>';
const TD_OK='<svg class="td-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13l5 5L20 6" fill="none" stroke="#14501a" stroke-width="6.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 13l5 5L20 6" fill="none" stroke="#56d444" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const tM=()=>(window.Sys&&Sys.today)||null;
const tHas=()=>{ const M=tM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.claimAll==='function'); };
const tOk=()=>{ try{ return tHas()&&tM().DATA.on===true; }catch(e){ return false; } };
const tHost=()=>(window.Sys&&Sys.host)||null;
const tSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const tRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
/* o módulo já avisa o jogo (host.onChange grava e redesenha o HUD); sem esse gancho, a tela grava */
const tStore=()=>{ try{ const h=tHost(); if(h&&typeof h.onChange==='function') return; if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){} };
const tNow=()=>Date.now();
const tN=v=>{ try{ return typeof n0==='function'?n0(v):String(Math.round(+v||0)); }catch(e){ return String(Math.round(+v||0)); } };
const tPl=(n,one,many)=>tN(n)+' '+(n===1?one:many);
const tView=()=>{ try{ const v=tM().view(S,tHost()); return v&&Array.isArray(v.items)?v:null; }catch(e){ return null; } };
const tWallet=()=>{ const o={}; try{ if(typeof S.gold==='number'&&isFinite(S.gold)) o.gold=S.gold; if(typeof S.gems==='number'&&isFinite(S.gems)) o.gems=S.gems; }catch(e){} return o; };
/* texto de um motivo (reason do claimAll ou blocked da linha): a FONTE é o módulo (Sys.today.why); a reserva daqui só vale se ele não tiver a função */
const TD_WHY={off:'A lista Hoje ainda não abriu',empty:'Nada para pegar agora',bag:'Mochila cheia'};
const tWhy=k=>{ let t=''; try{ const M=tM(); if(M&&typeof M.why==='function') t=String(M.why(k)||''); }catch(e){ t=''; } return t||TD_WHY[k&&typeof k==='object'?k.reason:k]||'Não deu para pegar agora'; };

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.td-root). Paleta do mock B: pergaminho, linhas cor de areia, texto marrom, ouro e verde ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.td-root{--td-ink:#3b2412;--td-mut:#6b4a2a;--td-soft:#4a2f18;--td-gold:#f2b632;--td-gold1:#ffe58a;--td-gold2:#f2a826;--td-goldsh:#8a5a12;--td-goldink:#2a1403;
  --td-sheet1:#f8ebcd;--td-sheet2:#eedab0;--td-sheetline:#c9984a;--td-sheetedge:#6a4416;--td-row:#e5cd9d;--td-rowline:#cfb07a;--td-rib1:#ffe493;--td-rib2:#f2bd45;--td-rib3:#d99a25;--td-ribtail:#c58a20;--td-ribink:#3b1d05;
  --td-ok:#1d5c22;--td-okbg:rgba(46,125,50,.14);--td-okline:#2e7d32;--td-bad:#a3231a;--td-ic0:#2f4f86;--td-icring:#162a4d;--td-ic1:#fff0c8;--td-base:#16110d;
  color:var(--td-ink)}
.td-root,.td-root *{box-sizing:border-box}
.td-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.td-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.td-st{flex:1 1 0;min-height:96px;min-width:0;width:100%}
.td-st canvas{display:block;width:100%;height:100%}
.td-sh{flex:0 1 auto;min-height:0;display:flex;flex-direction:column;margin:0 10px;border-radius:16px 16px 0 0;background:linear-gradient(180deg,var(--td-sheet1),var(--td-sheet2));border:3px solid var(--td-sheetline);border-bottom:0;
  padding:0 10px max(12px,env(safe-area-inset-bottom));box-shadow:0 0 0 2px var(--td-sheetedge),0 -8px 22px rgba(30,16,4,.4),inset 0 0 0 2px rgba(255,255,255,.35);min-width:0}
.td-sh.in{animation:td-up .28s ease-out}
@keyframes td-up{from{transform:translateY(30px);opacity:.3}}
.td-rib{position:relative;flex:none;align-self:center;min-width:58%;max-width:calc(100% - 52px);margin-top:-24px;padding:4px 22px 6px;border-radius:5px;text-align:center;
  background:linear-gradient(180deg,var(--td-rib1),var(--td-rib2) 60%,var(--td-rib3));border:2px solid var(--td-goldsh);box-shadow:0 3px 0 rgba(60,34,6,.45),inset 0 2px 0 rgba(255,255,255,.55)}
.td-rib::before,.td-rib::after{content:"";position:absolute;top:7px;width:22px;height:100%;background:var(--td-ribtail);border:2px solid var(--td-goldsh)}
.td-rib::before{left:-22px;border-right:0;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,40% 50%)}
.td-rib::after{right:-22px;border-left:0;clip-path:polygon(0 0,100% 0,60% 50%,100% 100%,0 100%)}
.td-rib h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:24px;line-height:1.1;color:var(--td-ribink)}
.td-hd{flex:none;min-width:0;text-align:center}
.td-hd p{margin:6px 0 0;font-size:12px;font-weight:900;color:var(--td-mut);line-height:1.35;overflow-wrap:anywhere}
.td-list{flex:1 1 auto;min-height:0;margin-top:6px;display:flex;flex-direction:column;gap:5px}
.td-row,.xs .td-row{flex:none;display:flex;align-items:center;gap:9px;width:100%;min-height:48px;padding:5px 10px;border-radius:9px;background:var(--td-row);border:1px solid var(--td-rowline);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);color:var(--td-ink);text-align:left;min-width:0}
.td-row:active{transform:translateY(2px)}
.td-i{flex:none;display:block;width:36px;height:36px}
.td-i svg,.td-i img{display:block;width:100%;height:100%;object-fit:contain}
.td-i img.sq{border-radius:9px}
.td-i svg.fb{display:none}
.td-i.td-e img{display:none}
.td-i.td-e svg.fb{display:block}
.td-i .c0{fill:var(--td-ic0);stroke:var(--td-icring);stroke-width:2.4}
.td-i .g0{stroke:var(--td-ic1)}
.td-row .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.td-row .l{display:block;min-width:0;font-size:15px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.td-row b{font-weight:900}
.td-row small{font-size:11px;font-weight:800;color:var(--td-mut);line-height:1.25;overflow-wrap:anywhere}
.td-row small.bad{color:var(--td-bad)}
.td-seal,.td-num{margin-left:5px;font-weight:900;font-variant-numeric:tabular-nums;white-space:nowrap}
.td-seal::before{content:"("}
.td-seal::after{content:")"}
.td-ok{flex:none;width:30px;height:30px}
.td-go{flex:none;font-size:15px;font-weight:900;color:var(--td-ink)}
.td-ch{flex:none;width:20px;height:20px;margin-left:-4px}
.td-none{flex:none;border-radius:10px;background:var(--td-row);border:1px solid var(--td-rowline);padding:14px 12px;text-align:center;min-width:0}
.td-none b{display:block;font-size:15px;font-weight:900;line-height:1.25}
.td-none p{margin:4px 0 0;font-size:12.5px;font-weight:700;line-height:1.45;color:var(--td-soft);overflow-wrap:anywhere}
.td-sum{flex:none;margin-top:8px;border-radius:10px;background:var(--td-okbg);border:2px solid var(--td-okline);padding:7px 12px;min-width:0}
.td-sum b{display:block;font-size:14px;font-weight:900;color:var(--td-ok);line-height:1.25}
.td-sum ul{margin:4px 0 0;padding-left:16px;font-size:12.5px;font-weight:800;line-height:1.5;color:var(--td-soft);overflow-wrap:anywhere}
.td-msg{flex:none;min-height:20px;margin:6px 0 0;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--td-soft);overflow-wrap:anywhere}
.td-msg.bad{color:var(--td-bad)}
.td-ft{flex:none;display:flex;justify-content:center;gap:8px;margin-top:6px;padding-bottom:5px;min-width:0}
.td-bt,.xs .td-bt{flex:0 1 250px;min-width:0;min-height:52px;border-radius:14px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:21px;line-height:1.15;padding:4px 10px;text-align:center;overflow-wrap:anywhere;border:2px solid var(--td-goldsh);background:linear-gradient(180deg,var(--td-gold1),var(--td-gold2));color:#2a1403;box-shadow:0 4px 0 var(--td-goldsh),inset 0 2px 0 rgba(255,255,255,.55)}
.td-bt[aria-disabled="true"],.xs .td-bt[aria-disabled="true"]{background:linear-gradient(180deg,#e6dcc0,#cdbf9c);border-color:#7a6a4a;box-shadow:0 4px 0 #7a6a4a}
.td-bt:active{transform:translateY(2px)}
.td-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center}
.td-off span{padding:14px 16px;border-radius:12px;background:linear-gradient(180deg,var(--td-sheet1),var(--td-sheet2));border:3px solid var(--td-sheetline);box-shadow:0 0 0 2px var(--td-sheetedge);font-weight:800;font-size:14px;line-height:1.4;color:var(--td-ink);overflow-wrap:anywhere}
.td-off .td-bt{flex:none;min-width:150px}
@media (prefers-reduced-motion:reduce){.td-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={msg:'',bad:false,msgT:0,sum:null,anim:true,sig:'',sigT:0,raf:0,t0:0,ts:0,herr:0};
function tSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=tNow(); }
/* fundo: o cenário da era atual (regra da casa), quase sem escurecer em cima (o mock B é de dia) e um pouco mais escuro atrás da folha */
const tBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.02,0.42):'#16110d'; }catch(e){ return '#16110d'; } };
const tSigOf=v=>v?v.items.map(i=>i.id+':'+i.count+':'+(i.blocked||'')).join('|'):'x';

/* ---------- HERÓI NO PALCO (acima da folha): window.drawHeroFull, como está no jogo (montaria, asa, pet por último) ---------- */
const tIsOn=()=>{ try{ return typeof view!=='undefined'&&view===N; }catch(e){ return false; } };
const tCanHero=()=>{ try{ return !X.herr&&typeof window.drawHeroFull==='function'&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
function tFrame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||160;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  /* os pés ficam 34 px acima da base do palco: a faixa "Hoje" sobe 24 px e não pode cobrir o herói */
  const hs=(typeof HS==='number'&&HS>0)?HS:155, fr=Math.max(40,Math.min((h-40)*0.72,w*0.46,180)), gy=h-34, hx=Math.round(w*0.5);
  try{ x.save(); x.globalAlpha=0.3; x.fillStyle='#1c1206'; x.beginPath(); x.ellipse(hx,gy+2,fr*0.34,Math.max(4,fr*0.05),0,0,7); x.fill(); x.restore(); }catch(e){}
  x.setTransform(dpr,0,0,dpr,0,0);
  try{ window.drawHeroFull(x,hx,gy,fr/hs,{t:t}); }catch(e){ X.herr=1; } }
function tLoop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('td_hero'); }catch(e){} if(!c||!tIsOn()||!tCanHero()){ X.t0=0; return; }
  X.ts=ts; try{ tFrame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(tLoop); }
function tLoopStart(){ try{ if(!tCanHero()) return; const c=document.getElementById('td_hero'); if(!c) return; if(X.ts){ try{ tFrame(c,X.ts); }catch(e){} }
    if(!X.raf) X.raf=requestAnimationFrame(tLoop); }catch(e){} }
function tLoopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; X.ts=0; }

/* ---------- desenho ---------- */
function tOffHtml(d,msg){ V.innerHTML=xWrap(d,'td-root','<div class="td-w" style="justify-content:center;background:'+tBg()+'"><div class="td-off"><span role="alert">'+esc2(msg)+'</span><button class="td-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
/* linha do mock: ícone redondo, nome com a quantidade, e à direita o visto verde (entra no Pegar tudo) ou "Ir" com a seta (abre a tela) */
function tRow(it){ const claim=it.kind==='claim', blk=!!it.blocked, here=it.tab==='battle';
  const sub=blk?'<small class="bad">'+esc2(tWhy(it.blocked))+': abra espaço para pegar</small>':here?'<small>Fica na batalha: toque para voltar</small>':'';
  const cnt=claim&&!blk?'<span class="td-seal">'+tN(it.count)+'</span>':'<span class="td-num">'+tN(it.count)+'</span>';
  const right=claim&&!blk?TD_OK:'<span class="td-go">Ir</span>'+TD_CHEV;
  return '<button class="td-row" data-x="go" data-id="'+esc2(it.id)+'" aria-label="'+esc2(it.label+': '+tN(it.count)+(blk?', '+tWhy(it.blocked):claim?', entra no Pegar tudo':', toque para abrir'))+'">'+tdIcon(it.icon)+'<span class="t"><span class="l"><b>'+esc2(it.label)+'</b>'+cnt+'</span>'+sub+'</span>'+right+'</button>'; }
function tSumHtml(){ const s=X.sum; if(!s) return '';
  let h='<section class="td-sum" role="status"><b>Pegou '+tPl(s.n,'prêmio','prêmios')+'</b><ul>'+s.lines.map(l=>'<li>'+esc2(l.label)+': '+tN(l.k)+'</li>').join('');
  if(s.gold>0) h+='<li>Ouro: +'+tN(s.gold)+'</li>'; if(s.gems>0) h+='<li>Diamantes: +'+tN(s.gems)+'</li>';
  return h+'</ul></section>'; }
function tDraw(){
  const d=xDims(240)||{};
  if(!tHas()){ tOffHtml(d,'Lista Hoje indisponível agora.'); return; }
  if(!tOk()){ tOffHtml(d,'A lista Hoje ainda não abriu.'); return; }
  const v=tView(); if(!v){ tOffHtml(d,'Lista Hoje indisponível agora.'); return; }
  const cl=v.items.filter(i=>i.kind==='claim'), go=v.items.filter(i=>i.kind!=='claim'), n=Math.max(0,v.claimable|0);
  let y0=0; try{ const sc0=document.getElementById('td_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  /* ordem do mock: palco com o herói · faixa "Hoje" · linhas (primeiro as de pegar, depois as de ir) · Pegar tudo */
  let h='<div class="td-rib"><h3>Hoje</h3></div><div class="td-hd"><p>'+(v.items.length?tPl(v.items.length,'coisa','coisas')+' para fazer agora':'Tudo em dia')+'</p></div>';
  h+='<div id="td_scroll" class="x-scroll td-list">';
  if(!v.items.length) h+='<section class="td-none"><b>Nada para fazer agora</b><p>Os prêmios e avisos aparecem aqui conforme você joga: missões, correio, baús e o que mais estiver pronto.</p></section>';
  h+=cl.map(tRow).join('')+go.map(tRow).join('');
  h+='</div>'+tSumHtml();
  h+='<div id="td_msg" class="td-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
  h+='<div class="td-ft"><button class="td-bt" data-x="all" aria-disabled="'+(n<=0)+'">Pegar tudo ('+tN(n)+')</button></div>';
  const stage='<div class="td-st">'+(tCanHero()?'<canvas id="td_hero" role="img" aria-label="Seu herói"></canvas>':'')+'</div>';
  V.innerHTML=xWrap(d,'td-root','<div class="td-w" style="background:'+tBg()+'">'+stage+'<div class="td-sh'+(X.anim?' in':'')+'" role="dialog" aria-label="Hoje">'+h+'</div></div>');
  X.anim=false; X.sig=tSigOf(v); X.sigT=tNow();
  if(y0){ try{ const sc=document.getElementById('td_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  tLoopStart();
}

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
/* abre a tela da linha: painel (com a volta para cá) ou, se não for painel, a rota do jogo (host.goTab) */
function tOpen(tab){ let ok=false; try{ if(window.Panels&&typeof Panels.open==='function') ok=Panels.open(tab,{from:N})===true; }catch(e){ ok=false; }
  if(!ok){ try{ const h=tHost(); if(h&&typeof h.goTab==='function'){ h.goTab(tab); ok=typeof view!=='undefined'&&view!==N; } }catch(e){ ok=false; } }
  /* tab 'battle' (Baú, Fogueira, login moram na batalha): se a rota do jogo não trocou a tela, o Voltar do jogo leva para lá */
  if(!ok&&tab==='battle'){ try{ if(window.Screens&&typeof Screens.close==='function'){ Screens.close(); ok=true; } }catch(e){ ok=false; } }
  return ok; }
const ACT={
  back(){ tSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  go(b){ const id=String(b.dataset.id||''), v=tView(), it=v?v.items.find(i=>i.id===id):null; if(!it) return; tSnd('ui_tap'); X.sum=null;
    if(tOpen(it.tab)) return;
    tSay('Esta tela ainda não abre por aqui. Procure por ela no Menu.',true); tRedraw(); },
  all(){ const v0=tView(); if(!v0) return; X.sum=null;
    if((v0.claimable|0)<=0){ tSnd('ui_tap'); const bk=v0.items.find(i=>i.blocked); tSay(bk?tWhy(bk.blocked)+': abra espaço para pegar '+bk.label:tWhy('empty'),true); tRedraw(); return; }
    const w0=tWallet(); let r=null; try{ r=tM().claimAll(S,tHost()); }catch(e){ r=null; }
    if(r&&r.ok&&r.n>0){ tSnd('claim'); tStore(); const w1=tWallet(), by=r.by||{};
      X.sum={n:r.n|0,lines:v0.items.filter(i=>by[i.id]>0).map(i=>({label:i.label,k:by[i.id]|0})),gold:Math.max(0,(w1.gold||0)-(w0.gold||0)),gems:Math.max(0,(w1.gems||0)-(w0.gems||0))};
      tSay(''); }
    else { tSnd('ui_tap'); tSay(tWhy(r),true); }
    tRedraw(); } };
function tClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!tOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function tUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  try{ if(tOk()){ const v=tView(); if(v) for(const it of v.items) if(Object.prototype.hasOwnProperty.call(TD_ART,it.icon)&&u.indexOf(TD_ART[it.icon])<0) u.push(TD_ART[it.icon]); } }catch(e){}
  return u; }
function tClearMsg(){ X.msg=''; try{ const el=document.getElementById('td_msg'); if(el) el.innerHTML=''; }catch(e){} }

if(!('today' in PANEL_ON)) PANEL_ON.today=false;
Panels.add(N,{title:'Hoje',actions:Object.keys(ACT),iconOf:tdIcon,
  render(){ if(typeof pwGate==='function'){ if(pwGate(tUrls())) return; } else if(typeof xGate==='function'&&xGate(tUrls())) return; return tDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return tClick(b); },
  /* a lista muda sozinha (recarga, missão que fecha): confere a cada 2 s e só redesenha se mudou */
  tick(){ if(!tOk()) return; if(X.msg&&tNow()-X.msgT>2600) tClearMsg();
    if(X.sig&&X.sig!=='x'&&tNow()-X.sigT>=2000){ X.sigT=tNow(); if(tSigOf(tView())!==X.sig) tRedraw(); } },
  busy(){ return false; },
  onOpen(){ tLoopStop(); X.msg=''; X.sum=null; X.anim=true; X.sig=''; X.herr=0; },
  onClose(){ tLoopStop(); X.msg=''; X.sum=null; } });
})();
