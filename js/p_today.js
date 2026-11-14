'use strict';
/* ================= TELA "HOJE" + "PEGAR TUDO" (docs/LIGACOES_LOM_A.md, seção 4) — NASCE DESLIGADA (PANEL_ON.today = false) =================
   Folha que sobe de baixo com tudo o que dá para fazer AGORA. NENHUMA regra e NENHUM número aqui: tudo vem do js/sys/today.js (Sys.today):
   - a lista: Sys.today.view(S, host) → {on, items:[{id, icon, label, count, kind:'claim'|'go', tab, blocked}], claimable, badge};
   - "Pegar tudo": Sys.today.claimAll(S, host) → {ok, reason, n, by:{id:quantos}, left} (UMA chamada por toque; o módulo nunca gasta nada);
   - tocar numa linha abre a tela dela (Panels.open(tab, {from:'today'}); se não for painel, host.goTab(tab); tab 'battle' = volta para a batalha);
   - texto de recusa e de linha bloqueada: Sys.today.why(reason | blocked).
   O módulo devolve QUANTOS resgates fez por linha (by), não o que cada um deu: o resumo mostra as linhas e, quando o save tem os campos, o ouro e os
   diamantes que entraram (diferença de S.gold / S.gems antes e depois; só leitura).
   Linha que não entra no lote (kind 'go', ou bloqueada pela mochila cheia) fica com o toque próprio: abre a tela.
   Chaves: PANEL_ON.today (esta tela) e Sys.today.DATA.on (o sistema). Sistema desligado: aviso e Voltar, sem escrever no save.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='today';

/* ---------- ÍCONES DAS LINHAS: UMA função (tdIcon). O módulo manda uma chave (item.icon). Quem tem arte em disco usa o arquivo (TD_ART);
   os outros usam a reserva em SVG (TD_GLY) até a Arte entregar (lista no relatório: calendar, activity, trophy, camp, duo, thief, dig, fire, relic). ---------- */
const TD_ART={mail:'assets/icons/menu/mail.png',missions:'assets/icons/menu/missions.png',pass:'assets/icons/menu/pass.png',codex:'assets/icons/menu/codex.png',
  instances:'assets/icons/menu/instances.png',chest:'assets/ui/chest.png'};
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
  if(Object.prototype.hasOwnProperty.call(TD_ART,k)) return '<span class="td-i"><img src="'+esc2(TD_ART[k])+'" alt=""></span>';
  const gly=Object.prototype.hasOwnProperty.call(TD_GLY,k)?TD_GLY[k]:TD_GLY.dot;
  return '<span class="td-i"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="15.5" class="c0"/><g fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" class="g0">'+gly+'</g></svg></span>'; }
const TD_CHEV='<svg class="td-ch" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 5 16 12 9 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

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

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.td-root): o revestimento do mock troca só este bloco ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.td-root{--td-ink:#f6ecdf;--td-mut:#c9b8a2;--td-soft:#efe3d0;--td-gold:#ffc94a;--td-gold1:#ffe07a;--td-gold2:#f2a826;--td-goldsh:#9a5a10;--td-goldink:#2a1403;
  --td-sheet:#1d1611;--td-sheetline:#4a3a2b;--td-card:rgba(0,0,0,.42);--td-line:rgba(255,236,200,.16);--td-ok:#7fe07a;--td-bad:#ffb3a8;--td-ic0:#33271d;--td-ic1:#ffd98a;--td-base:#16110d;
  color:var(--td-ink)}
.td-root,.td-root *{box-sizing:border-box}
.td-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.td-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden}
.td-sh{flex:0 1 auto;min-height:0;max-height:100%;margin-top:28px;display:flex;flex-direction:column;border-radius:22px 22px 0 0;background:var(--td-sheet);border-top:2px solid var(--td-sheetline);padding:12px 12px max(12px,env(safe-area-inset-bottom));box-shadow:0 -10px 30px rgba(0,0,0,.55);min-width:0}
.td-sh.in{animation:td-up .28s ease-out}
@keyframes td-up{from{transform:translateY(30px);opacity:.3}}
.td-hd{flex:none;min-width:0}
.td-hd h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1.1}
.td-hd p{margin:2px 0 0;font-size:12px;font-weight:800;color:var(--td-mut);line-height:1.35;overflow-wrap:anywhere}
.td-list{flex:1 1 auto;min-height:0;margin-top:8px;display:flex;flex-direction:column;gap:6px}
.td-h5{flex:none;margin:6px 0 0;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--td-mut);font-weight:900}
.td-row,.xs .td-row{flex:none;display:flex;align-items:center;gap:9px;width:100%;min-height:54px;padding:7px 10px;border-radius:14px;background:var(--td-card);border:1px solid var(--td-line);color:var(--td-ink);text-align:left;min-width:0}
.td-row:active{transform:translateY(2px)}
.td-i{flex:none;display:block;width:36px;height:36px}
.td-i svg,.td-i img{display:block;width:100%;height:100%;object-fit:contain}
.td-i .c0{fill:var(--td-ic0)}
.td-i .g0{stroke:var(--td-ic1)}
.td-row .t{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.td-row b{font-size:14px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.td-row small{font-size:11px;font-weight:800;color:var(--td-mut);line-height:1.25;overflow-wrap:anywhere}
.td-row small.bad{color:var(--td-bad)}
.td-seal{flex:none;min-width:30px;height:30px;padding:0 8px;border-radius:15px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,var(--td-gold1),var(--td-gold2));color:var(--td-goldink);font-weight:900;font-size:14px;font-variant-numeric:tabular-nums}
.td-num{flex:none;font-weight:900;font-size:14px;color:var(--td-soft);font-variant-numeric:tabular-nums}
.td-ch{flex:none;width:18px;height:18px;color:var(--td-mut)}
.td-none{flex:none;border-radius:16px;background:var(--td-card);border:1px solid var(--td-line);padding:14px 12px;text-align:center;min-width:0}
.td-none b{display:block;font-size:15px;font-weight:900;line-height:1.25}
.td-none p{margin:4px 0 0;font-size:12.5px;font-weight:700;line-height:1.45;color:var(--td-soft);overflow-wrap:anywhere}
.td-sum{flex:none;margin-top:8px;border-radius:14px;background:rgba(127,224,122,.08);border:1px solid rgba(127,224,122,.4);padding:8px 12px;min-width:0}
.td-sum b{display:block;font-size:14px;font-weight:900;color:var(--td-ok);line-height:1.25}
.td-sum ul{margin:4px 0 0;padding-left:16px;font-size:12.5px;font-weight:700;line-height:1.5;color:var(--td-soft);overflow-wrap:anywhere}
.td-msg{flex:none;min-height:20px;margin:6px 0 0;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--td-gold1);overflow-wrap:anywhere}
.td-msg.bad{color:var(--td-bad)}
.td-ft{flex:none;display:flex;gap:8px;margin-top:6px;min-width:0}
.td-bt,.xs .td-bt{flex:2 1 0;min-width:0;min-height:52px;border-radius:14px;font-weight:900;font-size:16px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--td-gold1),var(--td-gold2));color:#2a1403;box-shadow:0 3px 0 var(--td-goldsh)}
.td-bt.o,.xs .td-bt.o{flex:1 1 0;background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:var(--td-ink);box-shadow:none;font-size:14px}
.td-bt[aria-disabled="true"],.xs .td-bt[aria-disabled="true"]{opacity:.45;box-shadow:none}
.td-bt:active{transform:translateY(2px)}
.td-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.td-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--td-soft);overflow-wrap:anywhere}
.td-off .td-bt{flex:none;min-width:140px}
@media (prefers-reduced-motion:reduce){.td-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={msg:'',bad:false,msgT:0,sum:null,anim:true,sig:'',sigT:0};
function tSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=tNow(); }
const tBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.5,0.86):'#16110d'; }catch(e){ return '#16110d'; } };
const tSigOf=v=>v?v.items.map(i=>i.id+':'+i.count+':'+(i.blocked||'')).join('|'):'x';

/* ---------- desenho ---------- */
function tOffHtml(d,msg){ V.innerHTML=xWrap(d,'td-root','<div class="td-w" style="justify-content:center;background:'+tBg()+'"><div class="td-off"><span role="alert">'+esc2(msg)+'</span><button class="td-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
function tRow(it){ const claim=it.kind==='claim', blk=!!it.blocked, here=it.tab==='battle';
  const sub=blk?'<small class="bad">'+esc2(tWhy(it.blocked))+': abra espaço para pegar</small>':claim?'<small>Entra no Pegar tudo</small>':here?'<small>Fica na batalha: toque para voltar</small>':'<small>Toque para abrir</small>';
  const right=claim&&!blk?'<span class="td-seal">'+tN(it.count)+'</span>':'<span class="td-num">'+tN(it.count)+'</span>'+TD_CHEV;
  return '<button class="td-row" data-x="go" data-id="'+esc2(it.id)+'" aria-label="'+esc2(it.label+': '+tN(it.count)+(blk?', '+tWhy(it.blocked):''))+'">'+tdIcon(it.icon)+'<span class="t"><b>'+esc2(it.label)+'</b>'+sub+'</span>'+right+'</button>'; }
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
  let h='<div class="td-hd"><h3>Hoje</h3><p>'+(v.items.length?tPl(v.items.length,'coisa','coisas')+' para fazer agora':'Tudo em dia')+'</p></div>';
  h+='<div id="td_scroll" class="x-scroll td-list">';
  if(!v.items.length) h+='<section class="td-none"><b>Nada para fazer agora</b><p>Os prêmios e avisos aparecem aqui conforme você joga: missões, correio, baús e o que mais estiver pronto.</p></section>';
  if(cl.length) h+='<div class="td-h5">Prêmios prontos</div>'+cl.map(tRow).join('');
  if(go.length) h+='<div class="td-h5">Para fazer</div>'+go.map(tRow).join('');
  h+='</div>'+tSumHtml();
  h+='<div id="td_msg" class="td-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
  h+='<div class="td-ft"><button class="td-bt o" data-x="back">Voltar</button><button class="td-bt" data-x="all" aria-disabled="'+(n<=0)+'">Pegar tudo ('+tN(n)+')</button></div>';
  V.innerHTML=xWrap(d,'td-root','<div class="td-w" style="background:'+tBg()+'"><div class="td-sh'+(X.anim?' in':'')+'" role="dialog" aria-label="Hoje">'+h+'</div></div>');
  X.anim=false; X.sig=tSigOf(v); X.sigT=tNow();
  if(y0){ try{ const sc=document.getElementById('td_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
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
  onOpen(){ X.msg=''; X.sum=null; X.anim=true; X.sig=''; },
  onClose(){ X.msg=''; X.sum=null; } });
})();
