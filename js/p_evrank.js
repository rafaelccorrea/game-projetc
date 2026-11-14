'use strict';
/* ================= TELA RANKING DE EVENTO (docs/LIGACOES_LOM_TELAS.md, seção 6) — NASCE DESLIGADA (PANEL_ON.evrank = false) =================
   Sem mock: visual das telas V2 (cartões escuros sobre o cenário da era). NENHUMA regra e NENHUM número aqui. Tudo vem dos módulos:
   - a EDIÇÃO do evento (cada edição tem id próprio, ex.: festival_eras_261204, e o tema em `base`): calendário do Sys.events (DATA.events + phase);
     o nome com a data ("Festival das Eras · 04/12/2026") é o Sys.events.nameOf(id), que o Sys.eventRank.view devolve em `name`;
   - o ranking da edição (começa do zero em cada uma): await Sys.eventRank.load(S, host, id) UMA vez ao abrir (e no botão Atualizar) e
     Sys.eventRank.view(S, host, id) → {name, points, rank, total, band, bandName, prize, final, bands, top, online, powerFree};
   - selos ganhos: Sys.eventRank.badges(S).
   ESTADOS HONESTOS: carregando · sem conexão (mostra "Seus pontos" e avisa) · ranking ainda desligado no servidor (404 not_found: "abre em breve") ·
   sem edição ativa (ou 404 event): "Próximo evento em <data>" pelo calendário, nunca erro.
   O prêmio do ranking é SÓ VISUAL (moldura, título, selo) e chega pelo correio: a tela não entrega nada, não vende nada e não apressa ninguém.
   ATENÇÃO: com o sistema desligado a tela NÃO chama view/badges (eles preparam o save): mostra o aviso e o Voltar, sem escrever nada.
   O Sys.eventRank não tem why(): os textos dos motivos de rede ficam em ER_WHY, aqui.
   Chaves: PANEL_ON.evrank (esta tela) e Sys.eventRank.DATA.on (o sistema). O arquivo roda em escopo próprio. Ponte: window.PEvRank. */
(function(){
const N='evrank';
const ER_LEVEL_DEFAULT=24;   /* o ranking mora dentro de Eventos: usa o nível de Eventos do jogo (FB_UNLOCK.events); este número é só a reserva */
const ER_MSG_MS=3200;
/* cor de destaque por TEMA (ev.base, nunca ev.id). Tema sem cor aqui usa a dourada */
const ER_TINT={festival_eras:'#ffc94a'};
/* ---------- ARTE: UMA constante. Reserva em SVG (icoOf) até a Arte entregar em ER_ART_DIR: frame.png, title.png, badge.png e medal1.png, medal2.png, medal3.png ---------- */
const ER_ART_ON=false, ER_ART_DIR='assets/evrank/';
const ER_SVG={
  frame:'<rect x="7" y="7" width="26" height="26" rx="5" fill="none" stroke="#ffc94a" stroke-width="4"/><rect x="13" y="13" width="14" height="14" rx="2" fill="#4a3a2b"/>',
  title:'<path d="M5 14h30l-4 6 4 6H5l4-6z" fill="#b5793a" stroke="#ffe0b0" stroke-width="1.6" stroke-linejoin="round"/>',
  badge:'<path d="M20 5l11 4v9c0 8-5 13-11 16-6-3-11-8-11-16V9z" fill="#3f8cff" stroke="#d6e8ff" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 19l4 4 7-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  medal1:'<circle cx="20" cy="22" r="12" fill="#f2a826" stroke="#ffe07a" stroke-width="2"/><path d="M14 4h12l-3 8h-6z" fill="#c0392b"/>',
  medal2:'<circle cx="20" cy="22" r="12" fill="#aeb6c4" stroke="#eef1f6" stroke-width="2"/><path d="M14 4h12l-3 8h-6z" fill="#3f6fb5"/>',
  medal3:'<circle cx="20" cy="22" r="12" fill="#b5793a" stroke="#e8c39a" stroke-width="2"/><path d="M14 4h12l-3 8h-6z" fill="#3f8f5a"/>'};
function icoOf(kind){ if(!Object.prototype.hasOwnProperty.call(ER_SVG,kind)) kind='badge';
  if(ER_ART_ON) return '<img src="'+esc2(ER_ART_DIR+kind+'.png')+'" alt="">';
  return '<svg viewBox="0 0 40 40" aria-hidden="true">'+ER_SVG[kind]+'</svg>'; }
const ico=(kind,cls)=>'<span class="er-i'+(cls?' '+cls:'')+'">'+icoOf(kind)+'</span>';

/* ---------- leituras dos módulos ISOLADAS ---------- */
const RM=()=>(window.Sys&&Sys.eventRank)||null;
const EM=()=>(window.Sys&&Sys.events)||null;
const has=()=>{ const M=RM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.load==='function'&&typeof M.badges==='function'); };
const isOn=()=>{ try{ return has()&&RM().DATA.on===true; }catch(e){ return false; } };
const host=()=>(window.Sys&&Sys.host)||null;
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const redraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const store=()=>{ try{ if(typeof save==='function') return save(); const h=host(); if(h&&typeof h.onChange==='function') h.onChange(); }catch(e){} };
const now=()=>Date.now();
const hostNow=()=>{ try{ const h=host(); return h&&typeof h.now==='function'?h.now():now(); }catch(e){ return now(); } };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const nT=v=>{ try{ return typeof n0==='function'?n0(num(v)):String(Math.round(num(v))); }catch(e){ return String(Math.round(num(v))); } };
const pl=(n,one,many)=>nT(n)+' '+(num(n)===1?one:many);
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
const lvlNow=()=>{ try{ const L=window.Sys&&Sys.level; if(L&&typeof L.level==='function') return num(L.level(S)); const h=host(); return h&&typeof h.level==='function'?num(h.level()):-1; }catch(e){ return -1; } };
const lvlNeed=()=>{ try{ if(typeof FB_UNLOCK!=='undefined'&&FB_UNLOCK&&num(FB_UNLOCK.events)>0) return num(FB_UNLOCK.events); }catch(e){} return ER_LEVEL_DEFAULT; };
const locked=()=>{ const l=lvlNow(); return l>=0&&l<lvlNeed(); };
/* motivos de rede (o módulo não tem why) */
const ER_WHY={net_off:'Sem conexão',offline:'Sem conexão',not_found:'O ranking abre em breve',off:'Ranking de evento desligado'};
const why=r=>{ const k=r&&typeof r==='object'?r.reason:r; return ER_WHY[k]||'Não deu agora'; };

/* ---------- a EDIÇÃO: calendário do Sys.events (só leitura: DATA.events + phase). Ativa primeiro; senão a que está na carência (ranking final) ---------- */
const startMs=ev=>{ const v=ev&&ev.start; if(typeof v==='number') return v; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||'')); return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():NaN; };
function calendar(){ const E=EM(), out={cur:null,next:null}; if(!E||!E.DATA||!Array.isArray(E.DATA.events)||typeof E.phase!=='function') return out;
  try{ if(typeof E.restore==='function') E.restore(S); }catch(e){}   /* sem rede: o calendário guardado no save */
  const h=host(), L=E.DATA.events.map(ev=>{ let ph='fim'; try{ ph=E.phase(ev,h); }catch(e){} return {ev:ev,ph:ph,t:startMs(ev)}; });
  out.cur=(L.find(x=>x.ph==='ativo')||L.find(x=>x.ph==='loja')||{}).ev||null;
  out.next=(L.filter(x=>x.ph==='antes'&&isFinite(x.t)).sort((a,b)=>a.t-b.t)[0]||{}).ev||null; return out; }
/* data da edição: a que o módulo escreve no nome ("Tema · 04/12/2026"); sem ela, o dia de início */
function dateOf(ev){ if(!ev) return ''; try{ const E=EM(), n=E&&typeof E.nameOf==='function'?String(E.nameOf(ev.id)||''):'', m=/(\d{2}\/\d{2}\/\d{4})\s*$/.exec(n); if(m) return m[1]; }catch(e){}
  const t=startMs(ev); if(!isFinite(t)) return ''; const d=new Date(t), p=n=>String(n).padStart(2,'0'); return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear(); }
const baseOf=ev=>{ try{ const E=EM(); return (ev&&ev.base)||(E&&typeof E.base==='function'&&E.base(ev.id))||''; }catch(e){ return ''; } };

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.er-root): o revestimento do mock (quando houver) troca só este bloco ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.er-root{--er-ink:#f6ecdf;--er-mut:#c9b8a2;--er-soft:#efe3d0;--er-gold:#ffc94a;--er-gold1:#ffe07a;--er-gold2:#f2a826;--er-goldsh:#9a5a10;--er-goldink:#2a1403;
  --er-card:rgba(0,0,0,.42);--er-line:rgba(255,236,200,.16);--er-ok:#7fe07a;--er-bad:#ffb3a8;--er-tint:#ffc94a;--er-row:rgba(0,0,0,.3);color:var(--er-ink)}
.er-root,.er-root *{box-sizing:border-box}
.er-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.er-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.er-in{animation:er-in .25s ease-out both}
@keyframes er-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.er-i{flex:none;display:inline-block;width:22px;height:22px;vertical-align:middle}
.er-i svg,.er-i img{display:block;width:100%;height:100%;object-fit:contain}
.er-i.big{width:52px;height:52px}
.er-top{flex:none;margin:8px 12px 0;padding:10px 12px;border-radius:14px;background:var(--er-card);border:1px solid var(--er-line);border-left:5px solid var(--er-tint);min-width:0}
.er-top small{display:block;font-size:11px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--er-mut);overflow-wrap:anywhere}
.er-top h3{margin:2px 0 0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.15;overflow-wrap:anywhere}
.er-me{margin:8px 0 0;display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 12px;min-width:0}
.er-me b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:24px;line-height:1.1;color:var(--er-tint);overflow-wrap:anywhere}
.er-me span{font-size:13px;font-weight:900;color:var(--er-soft);overflow-wrap:anywhere}
.er-msg{flex:none;min-height:36px;margin:4px 12px 0;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--er-gold1);overflow-wrap:anywhere}
.er-msg.bad{color:var(--er-bad)}
.er-body{position:relative;flex:1;min-height:0;padding:4px 12px 20px;display:flex;flex-direction:column;gap:10px}
.er-sec{flex:none;border-radius:16px;background:var(--er-card);border:1px solid var(--er-line);padding:10px 12px 12px;min-width:0}
.er-h5{margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--er-mut);font-weight:900;overflow-wrap:anywhere}
.er-p{margin:0 0 8px;font-size:12.5px;font-weight:700;line-height:1.45;color:var(--er-soft);overflow-wrap:anywhere}
.er-p:last-child{margin-bottom:0}
.er-p b{color:var(--er-ok)}
.er-next{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.2;color:var(--er-gold1);overflow-wrap:anywhere}
.er-rk{display:flex;align-items:center;gap:8px;padding:6px 8px;margin-top:4px;border-radius:10px;background:var(--er-row);border:1px solid var(--er-line);min-width:0}
.er-rk>i{flex:none;width:34px;font-style:normal;font-family:'Lilita One',Nunito,sans-serif;font-size:15px;text-align:center;color:var(--er-mut)}
.er-rk>i .er-i{width:26px;height:26px}
.er-rk>b{flex:1;min-width:0;font-size:13px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.er-rk>span{flex:none;font-size:12.5px;font-weight:900;color:var(--er-gold1);font-variant-numeric:tabular-nums}
.er-bd{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--er-line);min-width:0}
.er-bd:first-of-type{border-top:0}
.er-bd>b{flex:none;width:96px;font-size:12.5px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.er-bd>span{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px 10px;font-size:12px;font-weight:800}
.er-bd>span>span{display:inline-flex;align-items:center;gap:4px}
.er-bd.cur>b{color:var(--er-tint)}
.er-bd em{flex:none;font-style:normal;font-size:11.5px;font-weight:900;color:var(--er-ok)}
.er-bgs{display:flex;flex-wrap:wrap;gap:6px}
.er-bg{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:12px;background:var(--er-row);border:1px solid var(--er-line);font-size:12px;font-weight:800;line-height:1.25;overflow-wrap:anywhere;min-width:0}
.er-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.er-bt,.xs .er-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--er-gold1),var(--er-gold2));color:#2a1403;box-shadow:0 3px 0 var(--er-goldsh)}
.er-bt.o,.xs .er-bt.o{background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:var(--er-ink);box-shadow:none}
.er-bt:active{transform:translateY(2px)}
.er-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.er-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--er-soft);overflow-wrap:anywhere}
.er-off .er-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.er-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={ev:'',want:'',load:'',err:'',noEv:false,calSt:'',msg:'',bad:false,msgT:0,gen:0,anim:true,top:true,sig:''};
function say(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=now(); }
const bg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.55,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
function sig(){ try{ const c=calendar(); return JSON.stringify([S.sys&&S.sys.eventrank||null,c.cur&&c.cur.id,c.next&&c.next.id,X.load,X.err,lvlNow()]); }catch(e){ return ''; } }

/* ---------- rede: UMA leitura por abertura (e por toque em Atualizar) ---------- */
function fetchRank(id,manual){ if(X.load==='load'||!id) return; X.load='load'; X.err=''; X.ev=id; const gen=X.gen;
  const end=r=>{ if(gen!==X.gen) return; X.load='done';
    if(r&&r.ok){ X.err=''; X.noEv=false; store(); if(manual){ sfx('ui_ok'); say('Ranking atualizado.'); } }
    else if(r&&r.reason==='event'){ X.noEv=true; X.err=''; }                     /* 404 event: a edição não está aberta no servidor = sem evento */
    else { X.err=why(r||'error'); if(manual){ sfx('ui_tap'); say(X.err,true); } }
    redraw(); };
  let pr=null; try{ pr=RM().load(S,host(),id); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); }
/* o calendário desta sessão ainda não chegou: pede uma vez (Sys.events.load guarda no save) */
function fetchCal(then){ const E=EM(), N=window.Sys&&Sys.net; if(X.calSt||!E||typeof E.load!=='function'||(E.DATA&&E.DATA.calendar===true)||!N||typeof N.events!=='function') return false; X.calSt='load'; const gen=X.gen;
  const end=r=>{ if(gen!==X.gen) return; X.calSt='done'; if(r&&r.ok) store(); try{ then(); }catch(e){} redraw(); };
  let pr=null; try{ pr=E.load(S,host()); }catch(e){ pr=null; } Promise.resolve(pr).then(end,()=>end(null)); return true; }

/* ---------- HTML ---------- */
function offHtml(d,msg,role){ V.innerHTML=xWrap(d,'er-root '+(X.anim?'er-in':''),'<div class="er-w" style="background:'+bg()+'"><div class="er-off">'+ico('medal1','big')+'<span role="'+(role||'alert')+'">'+esc2(msg)+'</span><button class="er-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
const msgHtml=()=>'<div id="er_msg" class="er-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
const PZ=[['frame','moldura'],['title','título'],['badge','selo']];
const prizeHtml=p=>PZ.filter(k=>p&&p[k[0]]).map(k=>'<span>'+ico(k[0])+k[1]+'</span>').join('');
function badgesHtml(){ let L=[]; try{ L=RM().badges(S)||[]; }catch(e){ L=[]; }
  return '<section class="er-sec"><div class="er-h5">Seus selos de evento</div>'+(L.length?'<div class="er-bgs">'+L.map(b=>'<span class="er-bg">'+ico('badge')+esc2(b.name||'Selo')+'</span>').join('')+'</div>':'<p class="er-p">Nenhum selo ainda. Participe de um evento para ganhar o primeiro.</p>')+'</section>'; }
const RULE='<p class="er-p" style="margin-top:8px"><b>Só visual: não dá poder.</b> Moldura, título e selo chegam pelo correio quando a edição fecha. Nada à venda.</p>';
function noEventHtml(c){ const nx=c.next, dt=dateOf(nx); let nm=''; try{ nm=nx?String((EM().def&&EM().def(nx.id)||nx).name||''):''; }catch(e){ nm=''; }
  return '<section class="er-sec" role="status"><div class="er-h5">Ranking de evento</div><p class="er-p">Nenhum evento aberto agora.</p>'
    +(nx&&dt?'<p class="er-next">Próximo evento em '+esc2(dt)+'</p>'+(nm?'<p class="er-p" style="margin-top:6px">'+esc2(nm)+'. O ranking começa do zero em cada edição.</p>':''):'<p class="er-p">'+(X.calSt==='load'?'Carregando o calendário':'O próximo evento ainda não tem data.')+'</p>')
    +'</section>'; }
function eventHtml(v,ev){ const tint=ER_TINT[baseOf(ev)]||'', loading=X.load==='load';
  let h='<div class="er-top"'+(tint?' style="--er-tint:'+esc2(tint)+'"':'')+'><small>Ranking desta edição'+(v.final?' · resultado final':'')+'</small><h3>'+esc2(v.name||'Evento')+'</h3><div class="er-me">';
  if(v.online&&num(v.rank)>0) h+='<b>'+nT(v.rank)+'º</b><span>de '+nT(v.total)+(v.bandName?' · '+esc2(v.bandName):'')+'</span><span>'+pl(v.points,'ponto','pontos')+'</span>';
  else h+='<b>'+nT(v.points)+'</b><span>Seus pontos'+(v.online?' · ainda fora do ranking':'')+'</span>';
  h+='</div></div>'+msgHtml()+'<div id="er_scroll" class="x-scroll er-body">';
  if(!v.online) h+='<section class="er-sec" role="status"><p class="er-p">'+(loading?'Carregando o ranking':esc2(X.err||ER_WHY.not_found)+'. Por enquanto a tela mostra só os seus pontos nesta edição.')+'</p>'+(loading?'':'<div class="er-acts"><button class="er-bt o" data-x="reload">Tentar de novo</button></div>')+'</section>';
  else { h+='<section class="er-sec"><div class="er-h5">Os primeiros</div>'+((v.top||[]).length?(v.top||[]).map(r=>'<div class="er-rk"><i>'+(r.rank>=1&&r.rank<=3?ico('medal'+r.rank):nT(r.rank)+'º')+'</i><b>'+esc2(r.name||'Jogador')+'</b><span>'+nT(r.points)+'</span></div>').join(''):'<p class="er-p">Ninguém pontuou ainda nesta edição.</p>')
      +(v.final&&v.band?'<p class="er-p" style="margin-top:8px">Edição encerrada. O seu prêmio chega pelo correio.</p>':'')
      +'<div class="er-acts">'+(v.final&&v.band?'<button class="er-bt" data-x="mail">Abrir o correio</button>':'')+'<button class="er-bt o" data-x="reload">'+(loading?'Carregando':'Atualizar')+'</button></div></section>'; }
  h+='<section class="er-sec"><div class="er-h5">Prêmio de cada faixa</div>'+(v.bands||[]).map(b=>'<div class="er-bd'+(v.band===b.id?' cur':'')+'"><b>'+esc2(b.name)+'</b><span>'+prizeHtml(b.prize)+'</span>'+(v.band===b.id?'<em>Sua faixa</em>':'')+'</div>').join('')+RULE+'</section>';
  return h+badgesHtml()+'</div>'; }
function draw(){
  const d=xDims(240)||{};
  if(!has()){ offHtml(d,'Ranking de evento indisponível agora.'); return; }
  if(!isOn()){ offHtml(d,'O ranking de evento ainda não abriu.'); return; }   /* desligado: não chama view/badges (eles preparam o save) */
  if(locked()){ offHtml(d,'O ranking de evento abre no nível '+nT(lvlNeed())+', junto com os Eventos. Continue lutando para liberar.','status'); return; }
  const c=calendar(), ev=X.want&&c.cur&&c.cur.id!==X.want?((EM().DATA.events||[]).find(e=>e.id===X.want)||c.cur):c.cur;
  let y0=0; try{ const sc0=X.top?null:byId('er_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  let h='', v=null;
  if(ev&&!X.noEv){ try{ v=RM().view(S,host(),ev.id); }catch(e){ v=null; } }
  if(v&&v.on&&v.event) h=eventHtml(v,ev);
  else h=msgHtml()+'<div id="er_scroll" class="x-scroll er-body">'+noEventHtml(c)+'<section class="er-sec">'+RULE+'</section>'+badgesHtml()+'</div>';
  V.innerHTML=xWrap(d,'er-root '+(X.anim?'er-in':''),'<div class="er-w" style="background:'+bg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=sig();
  if(y0){ try{ const sc=byId('er_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
}

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  reload(){ if(X.load==='load') return; sfx('ui_tap'); const c=calendar(), id=X.ev||(c.cur&&c.cur.id); if(!id) return; X.msg=''; fetchRank(id,true); redraw(); },
  mail(){ sfx('ui_tap'); try{ if(!(window.Panels&&typeof Panels.open==='function'&&Panels.open('mail',{from:N}))){ say('O correio abre pelo Menu.',true); redraw(); } }catch(e){} } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!isOn()||locked()) return;                         /* desligado ou trancado por nível: só o Voltar funciona */
  return ACT[a](b); }
function urls(){ const u=[]; try{ const b=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(b) u.push(b); }catch(e){}
  if(ER_ART_ON) for(const k in ER_SVG) u.push(ER_ART_DIR+k+'.png'); return u; }
function clearMsg(){ X.msg=''; const el=byId('er_msg'); if(el) el.innerHTML=''; }

if(!('evrank' in PANEL_ON)) PANEL_ON.evrank=false;
const def=Panels.add(N,{title:'Ranking de evento',actions:Object.keys(ACT),iconOf:icoOf,urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.sig==='x') return; if(X.msg&&now()-X.msgT>ER_MSG_MS) clearMsg(); if(X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return false; },
  /* o: {ev:'<id da edição>'} abre nessa edição (a aba de Eventos passa a edição escolhida); sem isso, a edição ativa do calendário */
  onOpen(o){ X.gen++; X.ev=''; X.want=o&&typeof o.ev==='string'?o.ev:''; X.load=''; X.err=''; X.noEv=false; X.calSt=''; X.msg=''; X.anim=true; X.top=true; X.sig='';
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){}
    if(!isOn()||locked()) return;                       /* desligada ou trancada: nenhuma leitura, nenhuma rede */
    /* primeiro o calendário (se o desta sessão ainda não chegou), depois o ranking da edição que ele apontar */
    const go=()=>{ const c=calendar(), id=X.want||(c.cur&&c.cur.id)||''; if(id) fetchRank(id,false); };
    if(!fetchCal(go)) go(); },
  onClose(){ X.gen++; X.load=''; X.msg=''; } });
window.PEvRank={X:X,def:def,urls:urls,calendar:calendar,dateOf:dateOf,open(o){ try{ return !!(window.Panels&&Panels.open(N,o||{})); }catch(e){ return false; } }};
})();
