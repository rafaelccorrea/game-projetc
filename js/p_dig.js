'use strict';
/* ================= TELA ESCAVAÇÃO (docs/LIGACOES_LOM_A.md, seção 2) — NASCE DESLIGADA (PANEL_ON.dig = false) =================
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
   Chaves: PANEL_ON.dig (esta tela) e Sys.dig.DATA.on (o sistema). Sistema desligado: aviso e Voltar, sem escrever no save.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='dig';

/* ---------- ARTE: UMA função (dgIcon) para os ícones e UMA constante (DG_TILE) para as células. Tudo reserva em SVG/CSS até a Arte entregar
   (lista no relatório). Quando houver arquivo, ponha o caminho em DG_ART[chave] e o ícone passa a ser <img>. ---------- */
const DG_ART={};   /* ex.: {pick:'assets/icons/dig/pick.png'} */
const DG_GLY={
  pick:'<path d="M6 10c7-6 15-6 22 0M17 7v6M17 13L7 29" fill="none" stroke="#e9dcc8" stroke-width="2.6" stroke-linecap="round"/>',
  bomb:'<circle cx="15" cy="20" r="9" fill="#3a3a44" stroke="#c9d0f5" stroke-width="1.6"/><path d="M21 13l4-4M25 9l3-1M25 9l1-3" fill="none" stroke="#ffb84a" stroke-width="2.2" stroke-linecap="round"/>',
  drill:'<path d="M11 5h10v9l-5 14-5-14z" fill="#8a8f9c" stroke="#e9dcc8" stroke-width="1.6" stroke-linejoin="round"/><path d="M12 15l8 3M13 20l6 2" fill="none" stroke="#2a2018" stroke-width="1.6"/>',
  stones:'<path d="M5 24l5-9 7 2 3 7z" fill="#7fb6e8" stroke="#e9f4ff" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 22l4-10 7 4 1 8z" fill="#5a93cf" stroke="#e9f4ff" stroke-width="1.4" stroke-linejoin="round"/>',
  frag:'<path d="M16 4l8 9-4 15H12L8 13z" fill="#ffc94a" stroke="#fff3c8" stroke-width="1.4" stroke-linejoin="round"/><path d="M16 4v24M8 13h16" fill="none" stroke="#9a5a10" stroke-width="1.2"/>',
  stairs:'<path d="M5 27h6v-6h6v-6h6V9h5" fill="none" stroke="#ffe07a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'};
function dgIcon(key){ const k=String(key||'');
  if(Object.prototype.hasOwnProperty.call(DG_ART,k)) return '<img class="dg-ic" src="'+esc2(DG_ART[k])+'" alt="">';
  return '<svg class="dg-ic" viewBox="0 0 32 32" aria-hidden="true">'+(Object.prototype.hasOwnProperty.call(DG_GLY,k)?DG_GLY[k]:'')+'</svg>'; }
/* textura de cada estado da célula (reserva em CSS). A Arte troca por imagem aqui. */
const DG_TILE={
  dirt:'linear-gradient(180deg,#9a6a3c,#6f4a28)', dirtOff:'linear-gradient(180deg,#4a3320,#33230f)',
  rock:'linear-gradient(180deg,#9aa0ab,#6b717c)', rockOff:'linear-gradient(180deg,#484c55,#30333a)',
  hole:'#120d09'};
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

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.dg-root): o revestimento do mock troca só este bloco (e DG_TILE) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.dg-root{--dg-ink:#f6ecdf;--dg-mut:#c9b8a2;--dg-soft:#efe3d0;--dg-gold:#ffc94a;--dg-gold1:#ffe07a;--dg-gold2:#f2a826;--dg-goldsh:#9a5a10;--dg-goldink:#2a1403;
  --dg-card:rgba(0,0,0,.42);--dg-line:rgba(255,236,200,.16);--dg-ok:#7fe07a;--dg-ok1:#9cf08f;--dg-ok2:#3fae3c;--dg-bad:#ffb3a8;--dg-cellline:rgba(0,0,0,.45);--dg-lit:#ffe9c4;color:var(--dg-ink)}
.dg-root,.dg-root *{box-sizing:border-box}
.dg-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.dg-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.dg-in{animation:dg-in .25s ease-out both}
@keyframes dg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes dg-pop{from{transform:scale(.4);opacity:0}to{transform:none;opacity:1}}
.dg-ic{display:block;width:26px;height:26px;flex:none;object-fit:contain}
.dg-hd{flex:none;margin:8px 12px 0;min-width:0}
.dg-hd b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:18px;line-height:1.15;color:var(--dg-lit);overflow-wrap:anywhere}
.dg-hd small{display:block;margin-top:2px;font-size:11.5px;font-weight:800;line-height:1.35;color:var(--dg-mut);overflow-wrap:anywhere}
.dg-tools{flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:8px 12px 0}
.dg-tl,.xs .dg-tl{display:flex;align-items:center;gap:5px;min-width:0;min-height:50px;padding:4px 6px;border-radius:12px;border:1px solid rgba(255,236,200,.3);background:rgba(0,0,0,.45);color:var(--dg-ink);text-align:left}
.dg-tl .t{flex:1;min-width:0;display:flex;flex-direction:column}
.dg-tl b{font-size:14px;font-weight:900;line-height:1.1;font-variant-numeric:tabular-nums}
.dg-tl small{font-size:9.5px;font-weight:800;line-height:1.2;color:var(--dg-mut);overflow-wrap:anywhere}
.dg-tl[aria-pressed="true"],.xs .dg-tl[aria-pressed="true"]{border:2px solid var(--dg-gold);background:rgba(255,201,74,.14);box-shadow:0 0 10px rgba(255,201,74,.3)}
.dg-msg{flex:none;min-height:34px;margin:4px 12px 0;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--dg-gold1);overflow-wrap:anywhere}
.dg-msg.bad{color:var(--dg-bad)}
.dg-body{flex:1;min-height:0;padding:2px 12px 16px}
.dg-grid{display:grid;grid-template-columns:repeat(var(--dg-cols,5),minmax(0,1fr));gap:4px;padding:6px;border-radius:14px;background:rgba(0,0,0,.5);border:1px solid var(--dg-line)}
.dg-c,.xs .dg-c{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:46px;padding:0;border-radius:8px;border:1px solid var(--dg-cellline);color:var(--dg-ink);overflow:hidden}
.dg-c.lit,.xs .dg-c.lit{box-shadow:inset 0 0 0 2px rgba(255,233,196,.55)}
.dg-c:active{transform:translateY(1px)}
.dg-o{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:0;min-height:46px;border-radius:8px;border:1px solid rgba(255,236,200,.08);font-size:11px;font-weight:900;line-height:1.1;color:var(--dg-lit)}
.dg-o.new .dg-ic,.dg-o.new b{animation:dg-pop .3s ease-out both}
.dg-o .dg-ic{width:24px;height:24px}
.dg-ck{position:absolute;inset:0;width:100%;height:100%}
.dg-ft{flex:none;display:flex;gap:8px;align-items:center;margin-top:8px;min-height:50px;min-width:0}
.dg-ft p{flex:1;min-width:0;margin:0;font-size:12px;font-weight:800;line-height:1.4;color:var(--dg-mut);overflow-wrap:anywhere}
.dg-bt,.xs .dg-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:15px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--dg-gold1),var(--dg-gold2));color:#2a1403;box-shadow:0 3px 0 var(--dg-goldsh)}
.dg-bt.b,.xs .dg-bt.b{background:linear-gradient(180deg,var(--dg-ok1),var(--dg-ok2));color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.dg-bt:active{transform:translateY(2px)}
.dg-box{margin-top:10px;border-radius:14px;background:var(--dg-card);border:1px solid var(--dg-line);padding:8px 12px 10px;min-width:0}
.dg-h5{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--dg-mut);font-weight:900}
.dg-tot{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.dg-tot div{border-radius:10px;background:rgba(255,236,200,.06);padding:6px 2px;text-align:center;min-width:0}
.dg-tot b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;color:var(--dg-ok)}
.dg-tot small{display:block;font-size:10px;font-weight:900;color:var(--dg-mut);line-height:1.2;overflow-wrap:anywhere}
.dg-box p{margin:6px 0 0;font-size:12px;font-weight:800;line-height:1.45;color:var(--dg-soft);overflow-wrap:anywhere}
.dg-box p b{color:var(--dg-ok)}
.dg-box ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.dg-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.dg-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--dg-soft);overflow-wrap:anywhere}
.dg-off .dg-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.dg-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={tool:'pick',arm:false,msg:'',bad:false,msgT:0,fresh:[],anim:true,sig:'',sigT:0};
function dSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=dNow(); }
const dBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.6,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
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
function dOffHtml(d,msg){ V.innerHTML=xWrap(d,'dg-root '+(X.anim?'dg-in':''),'<div class="dg-w" style="background:'+dBg()+'"><div class="dg-off"><span role="alert">'+esc2(msg)+'</span><button class="dg-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
function dCell(c){ const pos='linha '+(c.r+1)+', coluna '+(c.c+1);
  if(c.open){ const it=c.item, fr=X.fresh.indexOf(c.r+','+c.c)>=0?' new':''; let in_='', lb='vazio';
    if(it){ if(it.t==='stones'){ in_=dgIcon('stones')+'<b>+'+dN(it.n)+'</b>'; lb=dPl(it.n|0,'pedra de prática','pedras de prática'); }
      else if(it.t==='frag'){ in_=dgIcon('frag')+'<b>+'+dN(it.n)+'</b>'; lb=dPl(it.n|0,'fragmento','fragmentos')+' de '+dEra(it.era); }
      else if(it.t==='bomb'){ in_=dgIcon('bomb'); lb='bomba'; } else if(it.t==='drill'){ in_=dgIcon('drill'); lb='broca'; } else if(it.t==='stairs'){ in_=dgIcon('stairs'); lb='escada'; } }
    return '<span class="dg-o'+fr+'" role="img" aria-label="'+esc2('Aberto, '+pos+': '+lb)+'" style="background:'+DG_TILE.hole+'">'+in_+'</span>'; }
  const lit=c.canDig, bg=c.rock?(lit?DG_TILE.rock:DG_TILE.rockOff):(lit?DG_TILE.dirt:DG_TILE.dirtOff), crack=c.rock&&c.hp<2;
  return '<button class="dg-c'+(lit?' lit':'')+'" data-x="cell" data-r="'+c.r+'" data-c="'+c.c+'" aria-label="'+esc2((c.rock?(crack?'Rocha rachada':'Rocha'):'Terra')+', '+pos+(lit?'':', ainda não alcança'))+'" style="background:'+bg+'">'+(crack?DG_CRACK:'')+'</button>'; }
function dTool(id,num,sub,lb){ return '<button class="dg-tl" data-x="tool" data-t="'+id+'" aria-pressed="'+(X.tool===id)+'" aria-label="'+esc2(lb)+'">'+dgIcon(id)+'<span class="t"><b>'+num+'</b><small>'+esc2(sub)+'</small></span></button>'; }
function dDraw(){
  const d=xDims(240)||{};
  if(!dHas()){ dOffHtml(d,'Escavação indisponível agora.'); return; }
  if(!dOk()){ dOffHtml(d,'A Escavação ainda não abriu.'); return; }
  const v=dView(); if(!v){ dOffHtml(d,'Escavação indisponível agora.'); return; }
  if(X.tool==='bomb'&&v.bombs<1) X.tool='pick'; if(X.tool==='drill'&&v.drills<1) X.tool='pick'; if(!v.stairsOpen) X.arm=false;
  let y0=0; try{ const sc0=document.getElementById('dg_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const last=v.era>=8;
  let h='<div class="dg-hd"><b>'+esc2(v.eraName)+' · camada '+dN(v.depth+1)+'</b><small>'
    +(v.atBottom?(last?'Você chegou ao fundo da escavação: cada descida traz uma camada nova nesta profundidade.':'Fundo liberado. Para descer mais, chegue à próxima era do jogo; até lá, cada descida traz uma camada nova aqui.'):'Ache a escada para descer. A cada '+dN(dM().DATA.layersPerEra)+' camadas a era muda.')+'</small></div>';
  h+='<div class="dg-tools" role="group" aria-label="Ferramenta">'
    +dTool('pick',dN(v.picks)+'/'+dN(v.max),v.picks>=v.max?'picaretas cheias':dNext(v.nextInMs),'Picareta: '+v.picks+' de '+v.max+', '+dNext(v.nextInMs))
    +dTool('bomb',dN(v.bombs),'bomba: abre em cruz','Bomba: '+v.bombs)
    +dTool('drill',dN(v.drills),'broca: abre a coluna','Broca: '+v.drills)+'</div>';
  h+='<div id="dg_msg" class="dg-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
  h+='<div id="dg_scroll" class="x-scroll dg-body"><div class="dg-grid" style="--dg-cols:'+(v.cols|0)+'">'+v.cells.map(dCell).join('')+'</div>';
  /* escada aberta: botão dourado Descer (dois toques: o que ficou na camada se perde) */
  h+='<div class="dg-ft">'+(v.stairsOpen
    ?(X.arm?'<button class="dg-bt b" data-x="downok">Confirmar: o que ficou nesta camada se perde</button>':'<button class="dg-bt" data-x="down">Descer</button>')
    :'<p>A escada está escondida nesta camada. Ela nunca fica na linha de cima.</p>')+'</div>';
  const g=v.got||{}, p=v.pend||{}, pf=(p.frags||[]).reduce((a,b)=>a+(b|0),0);
  h+='<section class="dg-box"><div class="dg-h5">Total achado na Escavação</div><div class="dg-tot"><div><b>'+dN(g.stones)+'</b><small>pedras de prática</small></div><div><b>'+dN(g.frags)+'</b><small>fragmentos de relíquia</small></div><div><b>'+dN(g.layers)+'</b><small>camadas descidas</small></div></div>'
    +((p.stones|0)>0||pf>0?'<p>Guardado para entregar: '+[(p.stones|0)>0?dPl(p.stones|0,'pedra de prática','pedras de prática'):'',pf>0?dPl(pf,'fragmento','fragmentos'):''].filter(Boolean).join(' e ')+'. Entra sozinho quando o Treino e as Relíquias estiverem abertos.</p>':'')+'</section>';
  h+='<section class="dg-box"><div class="dg-h5">Como conseguir picaretas e ferramentas</div><ul>'+dSources().map(t=>'<li>'+esc2(t)+'</li>').join('')+'</ul><p><b>Nada à venda.</b> As picaretas voltam sozinhas com o tempo.</p></section></div>';
  V.innerHTML=xWrap(d,'dg-root '+(X.anim?'dg-in':''),'<div class="dg-w" style="background:'+dBg()+'">'+h+'</div>');
  X.anim=false; X.fresh=[]; X.sig=dSigOf(v); X.sigT=dNow();
  if(y0){ try{ const sc=document.getElementById('dg_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
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
  onOpen(){ X.tool='pick'; X.arm=false; X.msg=''; X.fresh=[]; X.anim=true; X.sig=''; },
  onClose(){ X.tool='pick'; X.arm=false; X.msg=''; } });
})();
