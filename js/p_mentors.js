'use strict';
/* ================= TELA MENTORES DAS ERAS (voto do dono: GALERIA = mock B, TELA DO MENTOR = mock A) — NASCE DESLIGADA (PANEL_ON.mentors = false) =================
   Galeria 3 x 3 (um mentor por era, cartão com retrato, placa do nome e a barra de amizade em 5 marcos) e a tela de um mentor (fala no balão, retrato grande,
   "Amizade k/5" com as 5 medalhas, botão dourado "Dar presente", o bônus, o título e a Provação do Mestre da era dele).
   NENHUMA regra e NENHUM número aqui. Tudo vem do js/sys/mentors.js (Sys.mentors):
   - o que a tela mostra: Sys.mentors.view(S, host) → {open, needLevel, stones, food, stonesPer, foodPer, mentors:[{era, eraName, name, role, unlocked, pts, mark,
     maxMark, next, statText, lines, newLine, title, fav}]}; peças que podem virar presente: Sys.mentors.giftable(S, host); valor: Sys.mentors.itemValue(peça, era);
   - Dar presente: Sys.mentors.gift(S, host, era, {items, stones, food}), UMA chamada por confirmação (dois toques: o presente é definitivo); a recusa vira o aviso;
   - fala nova mostrada: Sys.mentors.seen(S, era);
   - Provação do Mestre: Sys.trial.view(S, host).list (a linha cujo master.era é a era do mentor); o botão abre Panels.open('trial', {from:'mentors'}).
   NADA É VENDIDO: a tela não tem preço, compra, sorteio nem pressa.
   ATENÇÃO: com o sistema desligado a tela NÃO chama o view (o view do módulo prepara o save): mostra o aviso e o Voltar, sem escrever nada.
   Chaves: PANEL_ON.mentors (esta tela) e Sys.mentors.DATA.on (o sistema). O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='mentors';

/* ---------- RETRATOS DOS 9 MENTORES: UMA função (artOf). Enquanto a Arte não entrega, a reserva é desenhada aqui (busto na cor da era + medalha com a inicial).
   Quando os 9 arquivos existirem em ME_ART_DIR (m0.png a m8.png, pela era), basta trocar ME_ART_ON para true. ---------- */
const ME_ART_ON=true, ME_ART_DIR='assets/mentors/';
const ME_ERA=['#a8794a','#e0b040','#d64a4a','#2fa7a0','#8a8f9c','#3f8cff','#22c7d8','#9b3fd9','#f0d860'];   /* cor de cada era (igual à do Grimório e das Relíquias) */
const meMix=(c,k)=>{ const v=parseInt(c.slice(1),16), f=x=>Math.round(x*(1-k)).toString(16).padStart(2,'0'); return '#'+f(v>>16)+f((v>>8)&255)+f(v&255); };
const ME_LOCK='<circle cx="50" cy="62" r="19" fill="#120d09" stroke="#ffc94a" stroke-width="2.5"/><path d="M41 60h18v14H41zM45 60v-6a5 5 0 0110 0v6" fill="none" stroke="#ffd25e" stroke-width="3.4" stroke-linejoin="round"/>';
/* artOf(era, state): state '' = o mentor · 'lock' = ainda não chegou (silhueta escura com cadeado, sem nome) */
function artOf(era,state){ era=Math.max(0,Math.min(ME_ERA.length-1,era|0));
  if(ME_ART_ON) return '<img src="'+esc2(ME_ART_DIR+'m'+era+'.png')+'" alt=""'+(state?' class="lk"':'')+'>';
  let ini=''; try{ const m=mM().byEra(era); ini=m&&m.name?String(m.name).charAt(0).toUpperCase():''; }catch(e){ ini=''; }
  const c=ME_ERA[era];
  if(state) return '<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="120" fill="#1b1714"/><circle cx="50" cy="44" r="20" fill="#060403"/><path d="M12 120c0-27 17-41 38-41s38 14 38 41z" fill="#060403"/>'+ME_LOCK+'</svg>';
  return '<svg viewBox="0 0 100 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100" height="120" fill="'+meMix(c,0.35)+'"/><ellipse cx="50" cy="30" rx="46" ry="34" fill="'+c+'" opacity=".55"/>'
    +'<circle cx="50" cy="44" r="20" fill="'+meMix(c,0.72)+'"/><path d="M12 120c0-27 17-41 38-41s38 14 38 41z" fill="'+meMix(c,0.72)+'"/>'
    +'<circle cx="50" cy="99" r="14" fill="#ffd25e" stroke="#9a5a10" stroke-width="2.5"/><text x="50" y="105" text-anchor="middle" font-family="Nunito,system-ui,sans-serif" font-size="17" font-weight="900" fill="#2a1403">'+esc2(ini)+'</text></svg>'; }
const ME_RC=['#a9b3c9','#4fa3ff','#b46bff','#ff4f6d','#ffa434','#8ff5ff'];   /* cores de raridade das telas V2 */
const ME_RN=['Básico','Raro','Épico','Mítico','Lendário','Divino'];
const ME_HEART='<svg class="me-hrt" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 17.5C4 13 1.5 10 1.5 6.8A4.3 4.3 0 0110 5a4.3 4.3 0 018.5 1.8c0 3.200-2.500 6.200-8.500 10.700z" fill="#ff5a6e" stroke="#7a1626" stroke-width="1.2"/></svg>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const mM=()=>(window.Sys&&Sys.mentors)||null;
const mHas=()=>{ const M=mM(); return !!(M&&M.DATA&&['view','gift','seen','giftable','itemValue','markOf','byEra'].every(k=>typeof M[k]==='function')); };
const mOk=()=>{ try{ return mHas()&&mM().DATA.on===true; }catch(e){ return false; } };
const mHost=()=>(window.Sys&&Sys.host)||null;
const mSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const mRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const mNow=()=>Date.now();
const mN=v=>{ try{ return typeof n0==='function'?n0(v):String(Math.round(+v||0)); }catch(e){ return String(Math.round(+v||0)); } };
const mPl=(n,one,many)=>mN(n)+' '+(n===1?one:many);
const mClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mView=()=>{ try{ const v=mM().view(S,mHost()); return v&&v.on&&Array.isArray(v.mentors)?v:null; }catch(e){ return null; } };
const mLevel=()=>{ try{ const L=window.Sys&&Sys.level; if(L&&typeof L.level==='function') return L.level(S)|0; const h=mHost(); return h&&typeof h.level==='function'?h.level()|0:0; }catch(e){ return 0; } };
const mBag=()=>{ try{ const b=mM().giftable(S,mHost()); return Array.isArray(b)?b:[]; }catch(e){ return []; } };
const mEraName=(v,e)=>{ const m=v.mentors.find(x=>x.era===e); return (m&&m.eraName)||('Era '+((e|0)+1)); };
/* depois de um presente: a força muda (statsChanged do jogo grava e atualiza); sem ele, o módulo já avisou pelo host.onChange; sem os dois, a tela grava */
const mAfter=()=>{ try{ if(typeof statsChanged==='function'){ statsChanged(); return; } }catch(e){} try{ const h=mHost(); if(h&&typeof h.onChange==='function') return; if(typeof save==='function') save(); }catch(e){} };
const mSave=()=>{ try{ if(typeof save==='function') save(); }catch(e){} };
/* a Provação do Mestre da era deste mentor (linha da tabela do Sys.trial) ou null */
function mTrial(era){ try{ const T=window.Sys&&Sys.trial; if(!T||!T.DATA||T.DATA.on!==true||typeof T.view!=='function') return null; const v=T.view(S,mHost());
  if(!v||!Array.isArray(v.list)) return null; return v.list.find(x=>x&&x.master&&x.master.era===era)||null; }catch(e){ return null; } }

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.me-root) ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.me-root{--me-ink:#f6ecdf;--me-mut:#d9c8b0;--me-soft:#efe3d0;--me-gold:#ffc94a;--me-gold1:#ffe07a;--me-gold2:#f2a826;--me-goldsh:#9a5a10;--me-goldink:#2a1403;
  --me-paper:#f7e8c6;--me-paperline:#7a5630;--me-paperink:#2a1a06;--me-papermut:#5a3d1c;--me-wood:#2a1e14;--me-woodline:#6b4a2a;
  --me-sheet:#1d1611;--me-sheetline:#4a3a2b;--me-card:rgba(13,9,6,.72);--me-line:rgba(255,236,200,.2);--me-ok:#8fe88a;--me-ok1:#9cf08f;--me-ok2:#3fae3c;--me-okink:#0d2410;--me-bad:#ffb3a8;
  --me-seg:#3b2a1c;--me-bar1:#c56bff;--me-bar2:#ff7ab8;color:var(--me-ink)}
.me-root,.me-root *{box-sizing:border-box}
.me-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.me-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.me-in{animation:me-in .25s ease-out both}
@keyframes me-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes me-up{from{transform:translateY(30px);opacity:.3}}
.me-msg{flex:none;min-height:22px;margin:6px 12px 0;padding:2px 10px;border-radius:10px;font-size:12.5px;font-weight:900;line-height:1.35;text-align:center;color:var(--me-gold1);overflow-wrap:anywhere}
.me-msg.has{background:rgba(13,9,6,.86)}
.me-msg.bad{color:var(--me-bad)}
.me-body{position:relative;flex:1;min-height:0;padding:8px 12px 22px}
.me-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 8px}
.me-cd,.xs .me-cd{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:0;min-height:150px;padding:4px;border-radius:14px;background:var(--me-wood);border:3px solid var(--me-woodline);color:var(--me-ink);text-align:center;min-width:0;box-shadow:0 4px 0 rgba(0,0,0,.45)}
.me-cd.max,.xs .me-cd.max{border-color:var(--me-gold)}
.me-cd.no,.xs .me-cd.no{background:#17120e;border-color:#3d342c}
.me-cd:active{transform:translateY(2px)}
.me-por{display:block;width:100%;aspect-ratio:5/6;border-radius:9px;overflow:hidden;background:#120d09}
.me-por svg,.me-por img{display:block;width:100%;height:100%;object-fit:cover}
.me-por img.lk{filter:brightness(0) opacity(.6)}
.me-pl{display:flex;flex-direction:column;justify-content:center;min-height:40px;margin:-10px -2px 0;padding:3px 4px;border-radius:8px;background:var(--me-paper);border:2px solid var(--me-paperline);position:relative;min-width:0}
.me-pl b{font-size:12.5px;font-weight:900;line-height:1.15;color:var(--me-paperink);overflow-wrap:anywhere}
.me-pl small{font-size:10px;font-weight:800;line-height:1.15;color:var(--me-papermut);overflow-wrap:anywhere}
.me-cd.no .me-pl{background:#2b2420;border-color:#4a4038}
.me-cd.no .me-pl b{color:#f6ecdf;letter-spacing:2px}
.me-cd.no .me-pl small{color:#d9c8b0}
.me-hb{display:flex;align-items:center;gap:4px;margin:6px 2px 0;min-width:0}
.me-hrt{flex:none;width:16px;height:16px}
.me-segs{flex:1;min-width:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;height:9px;padding:1px;border-radius:5px;background:#120d09;border:1px solid rgba(255,255,255,.14)}
.me-segs i{position:relative;display:block;border-radius:2px;background:var(--me-seg);overflow:hidden}
.me-segs i u{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--me-bar1),var(--me-bar2))}
.me-st{display:block;margin:4px 0 2px;font-size:10.5px;font-weight:900;line-height:1.2;color:var(--me-ok);overflow-wrap:anywhere}
.me-new{position:absolute;top:-7px;right:-5px;z-index:1;padding:2px 7px;border-radius:9px;background:var(--me-gold);color:var(--me-goldink);font-size:10px;font-weight:900;line-height:1.3;border:2px solid #1a110b}
.me-note{margin:14px 0 0;padding:8px 12px;border-radius:12px;background:var(--me-card);border:1px solid var(--me-line);font-size:12px;font-weight:800;line-height:1.45;color:var(--me-soft);overflow-wrap:anywhere}
.me-homerow{display:flex;margin:0 0 8px}
.me-bub{position:relative;margin:0 6px 18px;padding:12px 14px;border-radius:18px;background:var(--me-paper);border:3px solid var(--me-paperline);color:var(--me-paperink);text-align:center;min-width:0}
.me-bub::after{content:"";position:absolute;left:50%;bottom:-11px;width:18px;height:18px;margin-left:-9px;background:var(--me-paper);border-right:3px solid var(--me-paperline);border-bottom:3px solid var(--me-paperline);transform:rotate(45deg)}
.me-bub small{display:block;margin-bottom:3px;font-size:10px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--me-papermut)}
.me-bub p{margin:0;font-size:15px;font-weight:800;line-height:1.4;overflow-wrap:anywhere}
.me-big{display:block;width:176px;max-width:60%;aspect-ratio:5/6;margin:0 auto;border-radius:18px;overflow:hidden;border:3px solid var(--me-gold);background:#120d09;box-shadow:0 8px 22px rgba(0,0,0,.6)}
.me-big svg,.me-big img{display:block;width:100%;height:100%;object-fit:cover}
.me-who{margin:8px 0 0;text-align:center;min-width:0}
.me-who h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;line-height:1.1;color:var(--me-ink);overflow-wrap:anywhere}
.me-who p{margin:2px 0 0;font-size:12.5px;font-weight:800;line-height:1.3;color:var(--me-mut);overflow-wrap:anywhere}
.me-fr{margin:14px 0 0;text-align:center;font-size:16px;font-weight:900;color:#f3dfb4}
.me-mds{position:relative;display:flex;justify-content:space-between;align-items:center;margin:8px 6px 0}
.me-trk{position:absolute;left:22px;right:22px;top:50%;height:10px;margin-top:-5px;border-radius:5px;background:#3b2a1c;border:1px solid rgba(0,0,0,.5);overflow:hidden}
.me-trk u{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,var(--me-gold2),var(--me-gold1))}
.me-md,.xs .me-md{position:relative;flex:none;width:46px;height:46px;min-height:46px;padding:0;border-radius:50%;border:3px solid #3b2714;background:#6a4526;color:#f3dfb4;font-size:17px;font-weight:900;line-height:1}
.me-md.ok,.xs .me-md.ok{border-color:var(--me-goldsh);background:radial-gradient(circle at 50% 35%,var(--me-gold1),var(--me-gold2));color:var(--me-goldink);box-shadow:0 0 12px rgba(255,201,74,.55)}
.me-md.on,.xs .me-md.on{outline:3px solid #fff;outline-offset:2px}
.me-pts{margin:8px 0 0;text-align:center;font-size:12.5px;font-weight:800;line-height:1.35;color:var(--me-mut);overflow-wrap:anywhere}
.me-pts b{color:var(--me-ink);font-variant-numeric:tabular-nums}
.me-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.me-bt,.xs .me-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:15px;line-height:1.15;padding:4px 10px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--me-gold1),var(--me-gold2));color:#2a1403;box-shadow:0 3px 0 var(--me-goldsh)}
.me-bt.o,.xs .me-bt.o{background:rgba(13,9,6,.6);border:1px solid rgba(255,236,200,.35);color:var(--me-ink);box-shadow:none}
.me-bt.b,.xs .me-bt.b{background:linear-gradient(180deg,var(--me-ok1),var(--me-ok2));color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.me-bt.s,.xs .me-bt.s{flex:none;min-height:44px;font-size:13px;padding:4px 14px}
.me-bt:active{transform:translateY(2px)}
.me-bon{margin:12px 0 0;text-align:center;font-size:14px;font-weight:800;line-height:1.4;color:var(--me-soft);overflow-wrap:anywhere}
.me-bon em{font-style:normal;font-weight:900;color:var(--me-ok)}
.me-box{margin-top:12px;border-radius:16px;background:var(--me-card);border:1px solid var(--me-line);padding:10px 12px 12px;min-width:0}
.me-h5{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--me-mut);font-weight:900}
.me-box p{margin:0;font-size:13px;font-weight:700;line-height:1.45;color:var(--me-soft);overflow-wrap:anywhere}
.me-box p b{color:var(--me-gold1)}
.me-box p em{font-style:normal;font-weight:900;color:var(--me-ok)}
.me-shade{position:absolute;inset:0;z-index:2;background:rgba(10,6,3,.7)}
.me-sh{position:absolute;left:0;right:0;bottom:0;z-index:3;max-height:94%;border-radius:22px 22px 0 0;background:var(--me-sheet);border-top:2px solid var(--me-sheetline);padding:14px 14px 18px;animation:me-up .28s ease-out;box-shadow:0 -10px 30px rgba(0,0,0,.55)}
.me-sh h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.15;overflow-wrap:anywhere}
.me-sub{margin:3px 0 10px;font-size:12px;font-weight:800;line-height:1.4;color:var(--me-mut);overflow-wrap:anywhere}
.me-its{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.me-it,.xs .me-it{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;min-height:84px;padding:6px 4px;border-radius:12px;border:2px solid var(--rc,#a9b3c9);background:#120d09;color:var(--me-ink);text-align:center;min-width:0}
.me-it img{width:34px;height:34px;object-fit:contain}
.me-it b{font-size:11px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.me-it small{font-size:10px;font-weight:800;line-height:1.2;color:var(--me-mut);overflow-wrap:anywhere}
.me-it em{font-style:normal;font-size:11.5px;font-weight:900;color:var(--me-ok)}
.me-it.sel,.xs .me-it.sel{background:#3a2c1f;border-color:var(--me-gold);box-shadow:0 0 0 2px var(--me-gold) inset}
.me-fav{font-size:10px;font-weight:900;color:var(--me-gold1)}
.me-rw{display:flex;align-items:center;gap:8px;margin-top:8px;padding:6px 8px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid var(--me-line);min-width:0}
.me-rw>div{flex:1;min-width:0}
.me-rw b{display:block;font-size:13px;font-weight:900;line-height:1.2;overflow-wrap:anywhere}
.me-rw small{display:block;font-size:11px;font-weight:800;line-height:1.3;color:var(--me-mut);overflow-wrap:anywhere}
.me-rw output{flex:none;min-width:34px;text-align:center;font-size:16px;font-weight:900;font-variant-numeric:tabular-nums}
.me-sp,.xs .me-sp{flex:none;width:44px;height:44px;min-height:44px;padding:0;border-radius:12px;border:1px solid rgba(255,236,200,.35);background:rgba(255,236,200,.08);color:var(--me-ink);font-size:22px;font-weight:900;line-height:1}
.me-sum{margin:10px 0 0;font-size:13.5px;font-weight:900;line-height:1.4;text-align:center;color:var(--me-soft);overflow-wrap:anywhere}
.me-sum em{font-style:normal;color:var(--me-ok)}
.me-sh .me-msg{margin:6px 0 0}
.me-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.me-off span{padding:10px 14px;border-radius:14px;background:var(--me-card);font-weight:800;font-size:14px;line-height:1.45;color:var(--me-soft);overflow-wrap:anywhere}
.me-off .me-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.me-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={era:null,line:0,fresh:false,gift:null,arm:false,msg:'',bad:false,msgT:0,anim:true,top:true,sig:''};
function mSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=mNow(); }
const mMsgHtml=id=>'<div id="'+id+'" class="me-msg'+(X.msg?' has':'')+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
const mBg=(a,b)=>{ try{ return typeof xEraBg==='function'?xEraBg(a,b):'#16110d'; }catch(e){ return '#16110d'; } };
/* texto de uma recusa do módulo (reason do Sys.mentors.gift) */
const ME_WHY={off:'Os Mentores estão fechados agora',locked:'Esse mentor ainda não chegou',max:'Amizade máxima: não precisa de presente',empty:'Escolha uma peça, pedras ou ração',
  items:'Essa peça não pode virar presente',stones:'Pedras de forja insuficientes',food:'Ração insuficiente',era:'Mentor não encontrado'};
const mWhy=r=>{ const k=r&&typeof r==='object'?r.reason:r; return Object.prototype.hasOwnProperty.call(ME_WHY,k)?ME_WHY[k]:'Não dá agora'; };
/* quanto do caminho até o próximo marco já foi andado (0 a 1) */
function mFrac(m){ const mk=mM().DATA.marks||[], lo=m.mark>0?(mk[m.mark-1]|0):0, hi=m.next==null?lo:(m.next|0); return hi>lo?mClamp(((m.pts|0)-lo)/(hi-lo),0,1):0; }
/* o presente montado na folha: peças escolhidas que ainda podem ser dadas, pedras e ração dentro do que o jogador tem */
function mGift(v){ const g=X.gift; if(!g) return null; const bag=mBag(), sp=Math.max(1,v.stonesPer|0), fp=Math.max(1,v.foodPer|0);
  g.sel=g.sel.filter(id=>bag.some(it=>String(it.id)===id));
  g.st=mClamp(g.st-g.st%sp,0,(v.stones|0)-(v.stones|0)%sp); g.fd=mClamp(g.fd-g.fd%fp,0,(v.food|0)-(v.food|0)%fp);
  const items=bag.filter(it=>g.sel.includes(String(it.id))); let pts=g.st/sp+g.fd/fp;
  for(const it of items){ try{ pts+=mM().itemValue(it,X.era)|0; }catch(e){} }
  return {bag,items,pts,sp,fp}; }
function mGiftText(g,G){ const p=[]; if(G.items.length) p.push(mPl(G.items.length,'peça','peças')); if(g.st) p.push(mPl(g.st,'pedra','pedras')); if(g.fd) p.push(mN(g.fd)+' de ração');
  return p.length>1?p.slice(0,-1).join(', ')+' e '+p[p.length-1]:p.join(''); }

/* ---------- desenho ---------- */
function mOffHtml(d,msg){ V.innerHTML=xWrap(d,'me-root '+(X.anim?'me-in':''),'<div class="me-w" style="background:'+mBg(0.55,0.9)+'"><div class="me-off"><span role="alert">'+esc2(msg)+'</span><button class="me-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig=mSig(); }
function mSegs(m){ const f=mFrac(m); let h='<span class="me-segs">'; for(let i=0;i<(m.maxMark|0);i++) h+='<i><u style="width:'+(i<m.mark?100:i===m.mark?Math.round(f*100):0)+'%"></u></i>'; return h+'</span>'; }
function mCard(m,v){ const en=mEraName(v,m.era);
  if(!m.unlocked) return '<button class="me-cd no" data-x="open" data-era="'+(m.era|0)+'" aria-label="'+esc2('Mentor da era '+en+': ainda não chegou')+'"><span class="me-por">'+artOf(m.era,'lock')+'</span><span class="me-pl"><b>???</b><small>'+esc2('Chegue à era '+en)+'</small></span></button>';
  const max=m.mark>=m.maxMark;
  return '<button class="me-cd'+(max?' max':'')+'" data-x="open" data-era="'+(m.era|0)+'" aria-label="'+esc2(m.name+', '+m.role+', marco '+m.mark+' de '+m.maxMark+(m.newLine?', fala nova':''))+'">'
    +(m.newLine?'<span class="me-new">Fala nova</span>':'')+'<span class="me-por">'+artOf(m.era,'')+'</span><span class="me-pl"><b>'+esc2(m.name)+'</b><small>'+esc2(m.role)+'</small></span>'
    +'<span class="me-hb">'+ME_HEART+mSegs(m)+'</span><small class="me-st">'+esc2(m.statText)+'</small></button>'; }
function mGallery(v){
  return mMsgHtml('me_msg')+'<div id="me_scroll" class="x-scroll me-body"><div class="me-grid">'+v.mentors.map(m=>mCard(m,v)).join('')+'</div>'
    +'<p class="me-note">Cada era tem um mentor. Dê de presente as peças que sobraram na mochila: cada marco de amizade deixa você mais forte e conta um pedaço da história da era.</p></div>'; }
/* a fala do balão: a do marco escolhido nas medalhas, senão a mais recente */
function mBubble(m){ const k=X.line||m.mark, mk=mM().DATA.marks||[];
  if(k>=1&&k<=m.lines.length) return '<div class="me-bub"><small>'+(X.fresh&&k===m.mark?'Fala nova · ':'')+'Marco '+k+'</small><p>'+esc2(m.lines[k-1])+'</p></div>';
  if(k>m.mark&&k<=m.maxMark) return '<div class="me-bub"><small>Marco '+k+'</small><p>Esta história chega no marco '+k+', com '+mN(mk[k-1]|0)+' de amizade.</p></div>';
  return '<div class="me-bub"><p>'+esc2('Dê um presente para ouvir a primeira história de '+m.name+'.')+'</p></div>'; }
function mMedals(m){ const max=m.mark>=m.maxMark, pos=max?1:m.mark<1?0:mClamp((m.mark-1+mFrac(m))/Math.max(1,m.maxMark-1),0,1), cur=X.line||m.mark;
  let h='<div class="me-mds"><i class="me-trk"><u style="width:'+Math.round(pos*100)+'%"></u></i>';
  for(let i=1;i<=(m.maxMark|0);i++) h+='<button class="me-md'+(i<=m.mark?' ok':'')+(i===cur?' on':'')+'" data-x="mark" data-i="'+i+'" aria-label="Marco '+i+(i<=m.mark?', alcançado':', ainda não alcançado')+'">'+i+'</button>';
  return h+'</div>'; }
function mTrialBox(m){ const r=mTrial(m.era); if(!r) return ''; const lv=mN(r.lvl);
  let h='<section class="me-box"><div class="me-h5">Provação do Mestre</div>';
  if(r.passed) h+='<p>'+esc2('Você já venceu '+m.name+' na Provação do nível '+lv+'.')+'</p>';
  else if(r.open) h+='<p>'+esc2(m.name+' espera você na Provação do nível '+lv+'.')+'</p><div class="me-acts"><button class="me-bt b" data-x="trial">Ir à Provação</button></div>';
  else h+='<p>'+esc2(m.name+' é o mestre da Provação do nível '+lv+'. Ela abre quando você chegar a esse nível.')+'</p>';
  return h+'</section>'; }
function mMentor(m,v){ const max=m.mark>=m.maxMark; let tt=''; try{ tt=String(mM().byEra(m.era).title||''); }catch(e){ tt=''; }
  let h='<div id="me_scroll" class="x-scroll me-body"><div class="me-homerow"><button class="me-bt o s" data-x="home">Todos os mentores</button></div>';
  h+=mBubble(m)+'<span class="me-big">'+artOf(m.era,'')+'</span><div class="me-who"><h3>'+esc2(m.name)+'</h3><p>'+esc2(m.role+' · era '+mEraName(v,m.era))+'</p></div>';
  h+='<div class="me-fr">Amizade '+mN(m.mark)+'/'+mN(m.maxMark)+'</div>'+mMedals(m);
  h+='<p class="me-pts">'+(max?'Amizade máxima · <b>'+mN(m.pts)+'</b> no total':'<b>'+mN(m.pts)+' / '+mN(m.next)+'</b> de amizade para o marco '+(m.mark+1))+'</p>';
  h+=(X.gift?'<div class="me-msg"></div>':mMsgHtml('me_msg'));
  h+='<div class="me-acts">'+(max?'<button class="me-bt o" data-x="gift">Amizade máxima</button>':'<button class="me-bt" data-x="gift">Dar presente</button>')+'</div>';
  h+='<p class="me-bon">'+(m.goldSoon?'':'Bônus: ')+'<em>'+esc2(m.statText)+'</em></p>';
  if(tt) h+='<section class="me-box"><div class="me-h5">Título</div><p>'+(m.title?'Você conquistou o título <b>'+esc2(m.title)+'</b>. Ele aparece no seu perfil.':'No marco '+mN(m.maxMark)+' você ganha o título <b>'+esc2(tt)+'</b>.')+'</p></section>';
  h+=mTrialBox(m);
  if(m.fav>0&&!max) h+='<section class="me-box"><div class="me-h5">Presente favorito</div><p>'+esc2('Você tem '+mPl(m.fav,'peça','peças')+' da era '+mEraName(v,m.era)+' sobrando: para '+m.name+', elas valem mais.')+'</p></section>';
  return h+'</div>'; }
function mItem(it,v,g){ const id=String(it.id), sel=g.sel.includes(id), r=mClamp(it.r|0,0,ME_RC.length-1); let val=0, nm='', ic='', e=0;
  try{ val=mM().itemValue(it,X.era)|0; }catch(er){}
  try{ e=typeof ieraV==='function'?ieraV(it)|0:(it.look!=null?it.look|0:it.e|0); }catch(er){ e=it.e|0; }
  try{ nm=typeof iname==='function'?String(iname(it)||''):''; }catch(er){ nm=''; }
  if(!nm){ try{ nm=(typeof SLOT!=='undefined'&&SLOT[it.slot]&&SLOT[it.slot].n)||'Peça'; }catch(er){ nm='Peça'; } }
  try{ const u=typeof slotIcon==='function'?slotIcon(it.slot,e,it.r):''; if(u) ic='<img src="'+esc2(u)+'" alt="">'; }catch(er){ ic=''; }
  let rn=''; try{ rn=typeof RN==='function'?RN(r):''; }catch(er){ rn=''; } rn=rn||ME_RN[r];
  const fav=e===X.era;
  return '<button class="me-it'+(sel?' sel':'')+'" style="--rc:'+ME_RC[r]+'" data-x="pick" data-id="'+esc2(id)+'" aria-pressed="'+sel+'" aria-label="'+esc2(nm+', '+rn+', era '+mEraName(v,e)+', mais '+val+' de amizade'+(fav?', favorita':'')+(sel?', escolhida':''))+'">'
    +ic+'<b>'+esc2(nm)+'</b><small>'+esc2(rn+' · '+mEraName(v,e))+'</small><em>+'+mN(val)+'</em>'+(fav?'<span class="me-fav">Favorita</span>':'')+(sel?'<span class="me-fav">Escolhida</span>':'')+'</button>'; }
function mStep(k,label,have,cur,per){ return '<div class="me-rw"><div><b>'+label+'</b><small>Você tem '+mN(have)+' · '+mN(per)+' = 1 de amizade</small></div>'
  +'<button class="me-sp" data-x="step" data-k="'+k+'" data-d="-1" aria-label="Menos '+label+'">−</button><output>'+mN(cur)+'</output><button class="me-sp" data-x="step" data-k="'+k+'" data-d="1" aria-label="Mais '+label+'">+</button></div>'; }
function mSheet(m,v){ const g=X.gift, G=mGift(v), D=mM().DATA, favP=Math.round(((+D.favMult||1)-1)*100); let k2=m.mark; try{ k2=mM().markOf((m.pts|0)+G.pts)|0; }catch(e){}
  let h='<div class="me-shade" data-x="gclose"></div><div id="me_gs" class="me-sh x-scroll" role="dialog" aria-label="'+esc2('Presente para '+m.name)+'">';
  h+='<h3>'+esc2('Presente para '+m.name)+'</h3><p class="me-sub">'+esc2('Peças que sobraram na mochila. Peça equipada ou trancada na Fogueira nunca aparece aqui.'+(favP>0?' Peça da era '+mEraName(v,m.era)+' vale '+favP+'% a mais.':''))+'</p>';
  h+=G.bag.length?'<div class="me-its">'+G.bag.map(it=>mItem(it,v,g)).join('')+'</div>':'<section class="me-box" style="margin-top:0"><p>Nenhuma peça sobrando na mochila agora. Você ainda pode dar pedras de forja ou ração.</p></section>';
  h+=mStep('st','Pedras de forja',v.stones|0,g.st,G.sp)+mStep('fd','Ração de pet',v.food|0,g.fd,G.fp);
  h+='<p class="me-sum">Este presente: <em>+'+mN(G.pts)+' de amizade</em>'+(k2>m.mark?' · chega ao marco '+mN(k2):'')+'</p>'+mMsgHtml('me_msg2')+'<div class="me-acts">';
  if(G.pts>0) h+=X.arm?'<button class="me-bt b" data-x="giveok">'+esc2('Confirmar: '+mGiftText(g,G))+'</button>':'<button class="me-bt" data-x="give">Dar presente</button>';
  else h+='<button class="me-bt o" data-x="give">Escolha o presente</button>';
  return h+'<button class="me-bt o" data-x="gclose">Fechar</button></div></div>'; }
function mDraw(){
  const d=xDims(240)||{};
  if(!mHas()){ mOffHtml(d,'Mentores indisponíveis agora.'); return; }
  if(!mOk()){ mOffHtml(d,'Os Mentores das Eras ainda não abriram.'); return; }   /* desligado: não chama o view (ele prepara o save) */
  const v=mView(); if(!v){ mOffHtml(d,'Mentores indisponíveis agora.'); return; }
  if(!v.open){ const lv=mLevel(), need=v.needLevel|0, f=Math.max(1,need-lv); X.era=null; X.gift=null;
    mOffHtml(d,'Os Mentores das Eras abrem no nível '+mN(need)+'. Você está no nível '+mN(lv)+': '+(f===1?'falta 1 nível.':'faltam '+mN(f)+' níveis.')); return; }
  let m=X.era==null?null:v.mentors.find(x=>x.era===X.era)||null;
  if(X.era!=null&&(!m||!m.unlocked)){ X.era=null; X.gift=null; X.arm=false; m=null; }
  if(!X.gift) X.arm=false;
  let y0=0, y1=0; try{ const a=X.top?null:document.getElementById('me_scroll'), b=document.getElementById('me_gs'); y0=a?(+a.scrollTop||0):0; y1=b&&X.gift?(+b.scrollTop||0):0; }catch(e){}
  const h=m?mMentor(m,v)+(X.gift?mSheet(m,v):''):mGallery(v);
  V.innerHTML=xWrap(d,'me-root '+(X.anim?'me-in':''),'<div class="me-w" style="background:'+(m?mBg(0.74,0.95):mBg(0.18,0.55))+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=mSig();
  try{ const a=document.getElementById('me_scroll'), b=document.getElementById('me_gs'); if(a&&y0) a.scrollTop=y0; if(b&&y1) b.scrollTop=y1; }catch(e){}
}
/* assinatura do que muda por fora (amizade, mochila, era nova, nível): leitura crua do save, sem preparar nada */
function mSig(){ try{ const h=mHost(), F=S.sys&&S.sys.forge, P=S.sys&&S.sys.pet; return JSON.stringify([mOk(),S.sys&&S.sys.mentors||null,(S.inv||[]).length,h&&typeof h.eraMax==='function'?h.eraMax():0,mLevel(),F&&F.stones||0,P&&P.food||0]); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
const mCur=()=>{ const v=mView(); if(!v||!v.open||X.era==null) return null; const m=v.mentors.find(x=>x.era===X.era); return m&&m.unlocked?{v,m}:null; };
const ACT={
  back(){ mSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  home(){ mSnd('ui_tap'); X.era=null; X.gift=null; X.arm=false; X.line=0; X.fresh=false; X.msg=''; X.top=true; mRedraw(); },
  /* abre um mentor; a fala nova é mostrada no balão e marcada como vista (Sys.mentors.seen, uma vez) */
  open(b){ const era=parseInt(b.dataset.era,10), v=mView(); if(!v||!v.open) return; const m=v.mentors.find(x=>x.era===era); if(!m) return; mSnd('ui_tap');
    if(!m.unlocked){ mSay('Chegue à era '+mEraName(v,era)+' para conhecer este mentor.',true); mRedraw(); return; }
    X.era=era; X.gift=null; X.arm=false; X.line=0; X.fresh=false; X.msg=''; X.top=true;
    if(m.newLine){ X.fresh=true; X.line=m.mark; let ok=false; try{ ok=mM().seen(S,era)===true; }catch(e){} if(ok) mSave(); }
    mRedraw(); },
  mark(b){ const c=mCur(); if(!c) return; const i=parseInt(b.dataset.i,10); if(!(i>=1&&i<=c.m.maxMark)) return; mSnd('ui_tap'); X.line=i; X.fresh=false; X.msg=''; mRedraw(); },
  gift(){ const c=mCur(); if(!c) return; mSnd('ui_tap'); if(c.m.mark>=c.m.maxMark){ mSay(mWhy('max'),true); mRedraw(); return; }
    X.gift={sel:[],st:0,fd:0}; X.arm=false; X.msg=''; mRedraw(); },
  gclose(){ mSnd('ui_tap'); X.gift=null; X.arm=false; X.msg=''; mRedraw(); },
  pick(b){ const c=mCur(), g=X.gift; if(!c||!g) return; const id=String(b.dataset.id||''); mSnd('ui_tap'); X.arm=false; X.msg='';
    if(!mBag().some(it=>String(it.id)===id)){ mSay(mWhy('items'),true); mRedraw(); return; }
    const i=g.sel.indexOf(id); if(i>=0) g.sel.splice(i,1); else g.sel.push(id); mRedraw(); },
  step(b){ const c=mCur(), g=X.gift; if(!c||!g) return; const k=b.dataset.k==='fd'?'fd':'st', dn=b.dataset.d==='-1'?-1:1; mSnd('ui_tap'); X.arm=false; X.msg='';
    const per=Math.max(1,(k==='st'?c.v.stonesPer:c.v.foodPer)|0), have=(k==='st'?c.v.stones:c.v.food)|0, nx=g[k]+dn*per;
    if(nx<0){ mRedraw(); return; }
    if(nx>have){ mSay(mWhy(k==='st'?'stones':'food'),true); mRedraw(); return; }
    g[k]=nx; mRedraw(); },
  /* 1º toque: arma (o presente é definitivo). 2º toque (giveok): chama o Sys.mentors.gift UMA vez */
  give(){ const c=mCur(), g=X.gift; if(!c||!g) return; mSnd('ui_tap'); const G=mGift(c.v);
    if(!G||!(G.pts>0)){ X.arm=false; mSay(mWhy('empty'),true); mRedraw(); return; }
    X.arm=true; mSay('Toque em Confirmar. O presente é definitivo: não volta para a mochila.'); mRedraw(); },
  giveok(){ const c=mCur(), g=X.gift; if(!c||!g) return; const armed=X.arm; X.arm=false;
    if(!armed){ mSnd('ui_tap'); mSay('Toque primeiro em Dar presente.',true); mRedraw(); return; }
    const era=X.era, name=c.m.name; let r=null; try{ r=mM().gift(S,mHost(),era,{items:g.sel.slice(),stones:g.st,food:g.fd}); }catch(e){ r={ok:false}; }
    if(r&&r.ok){ mSnd('ui_ok'); X.gift=null; const nm=Array.isArray(r.newMarks)?r.newMarks:[]; let t='+'+mN(r.pts)+' de amizade com '+name;
      if(nm.length){ const last=nm[nm.length-1]; X.line=last.mark|0; X.fresh=true; t+='. Chegou ao marco '+mN(last.mark)+(last.title?'. Título novo: '+last.title:''); try{ mM().seen(S,era); }catch(e){} }
      mAfter(); mSay(t); }
    else { mSnd('ui_tap'); mSay(mWhy(r),true); }
    mRedraw(); },
  trial(){ const c=mCur(); if(!c) return; mSnd('ui_tap'); const r=mTrial(c.m.era);
    if(!r||r.passed||!r.open){ mSay('A Provação deste mentor não está aberta agora.',true); mRedraw(); return; }
    let ok=false; try{ ok=!!(window.Panels&&typeof Panels.open==='function'&&Panels.open('trial',{from:N})); }catch(e){ ok=false; }
    if(!ok){ mSay('A Provação não abriu agora.',true); mRedraw(); } } };
function mClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!mOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function mUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  if(ME_ART_ON){ for(let e=0;e<ME_ERA.length;e++) u.push(ME_ART_DIR+'m'+e+'.png'); } return u; }
function mClearMsg(){ X.msg=''; try{ for(const id of ['me_msg','me_msg2']){ const el=document.getElementById(id); if(el){ el.innerHTML=''; el.className='me-msg'; } } }catch(e){} }

if(!('mentors' in PANEL_ON)) PANEL_ON.mentors=false;
Panels.add(N,{title:'Mentores das Eras',actions:Object.keys(ACT),artOf,
  render(){ if(typeof pwGate==='function'){ if(pwGate(mUrls())) return; } else if(typeof xGate==='function'&&xGate(mUrls())) return; return mDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return mClick(b); },
  tick(){ if(X.msg&&!X.arm&&mNow()-X.msgT>2600) mClearMsg(); if(X.sig&&mSig()!==X.sig) mRedraw(); },
  busy(){ return false; },
  onOpen(){ X.era=null; X.line=0; X.fresh=false; X.gift=null; X.arm=false; X.msg=''; X.anim=true; X.top=true; X.sig=''; },
  onClose(){ X.era=null; X.gift=null; X.arm=false; X.msg=''; } });
})();
