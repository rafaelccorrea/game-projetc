'use strict';
/* ================= TELA FIM DAS 9 ERAS (docs/proto/v2/FimDasEras.html; PASSAGEM.md seção 10) — NASCE DESLIGADA (PANEL_ON.end9 = false) =================
   A festa depois de vencer o Senhor da última era (fase 90, Juiz Celestial). REGRA DO DONO: a fase 90 é o FIM DAS 9 ERAS, nunca o fim da jornada:
   a tela termina em "A jornada continua", com o próximo marco e o botão para seguir para a fase 91.
   É um OVERLAY (def.overlay, como o js/p_era.js): não é uma "view"; abre por cima da batalha com
     Panels.open('end9', {stage, boss, gems, essence, milestone, prizes, onDone})      (tudo opcional)
       stage     fase vencida (sem o campo: a última fase das eras, ERAS.length × STAGES_PER_ERA)
       boss      nome do chefe vencido (sem o campo: era9Boss(era) ou o último inimigo da era na tabela ERAS)
       gems      diamantes que a batalha deu nesta vitória (sem o campo, a linha não aparece) · essence: idem, Essência da Era
       milestone {stage, rewards:[texto]} próximo marco informado por quem chama (para o dia em que a Sistemas ligar o pós-eras)
       prizes    [{title, text}] prêmios já ENTREGUES por quem chama (para o dia em que os prêmios das 9 eras forem aprovados)
       onDone    chamada ao fechar ("Seguir para a fase 91")
   O jogo fica parado enquanto a tela está aberta (B.res, igual à Troca de era) e volta sozinho ao fechar. Nada é escrito no save por esta tela.
   NENHUMA regra e NENHUM número aqui. De onde vem cada coisa:
   - as eras e os chefes: ERAS (index.html + js/eras9.js) e era9Boss; a cor do emblema é o céu da era (ERAS[i].sky);
   - FC pedida: fcNeed (js/diff.js; cai no recFC de sempre com a chave da dificuldade desligada); a sua FC: heroFC; texto: fcShow;
   - resumo: Sys.titles.current (fases, chefes, abates, torre, pets), Sys.level, Sys.mount, Sys.pet, S.playSeconds (js/onlineboot.js);
   - "já é seu": títulos de fase e de era já conquistados (Sys.titles) e a conquista de era (Sys.achievements, só com a chave do módulo ligada);
   - próximo marco: o.milestone, ou o próximo título de fase ainda fechado do Sys.titles; sem nenhum dos dois, a próxima fase e a FC que ela pede;
   - "o que continua crescendo": títulos mais perto de abrir (Sys.titles.progress), nível (Sys.level), pets, montarias e torre.
   O QUE O MÓDULO NÃO INFORMA NÃO APARECE: os prêmios propostos (docs/balance.json fimDasEras) e os marcos do pós-eras (posEras) não estão em nenhum
   módulo de js/sys, então a tela não os mostra. Nada à venda, nada sorteado.
   PALCO: cenário em camadas da era (assets/bg/v2/era<N>/sky, far, ground), o chefe se desfazendo em luz no 1º passo e o herói pela rota única do jogo
   (window.drawHeroFull do js/battle.js: arma na mão, asa, montaria e o PET POR ÚLTIMO, na frente). A faixa do título fica ABAIXO dos pés do herói
   (na emenda entre o cenário e o painel): nenhum aviso passa por cima dele. O arquivo roda em escopo próprio. */
(function(){
const N='end9';
const IMG_GEM='assets/ui/gem.png';
const E={el:null,open:false,o:null,steps:[],i:0,raf:0,t0:0,now:0,at:0,bn:0,hx:-1,cf:[],err:0,boss:null,bossUrl:'',tok:0};

/* ---------- leituras ISOLADAS (reserva segura se algum pedaço do jogo não estiver carregado) ---------- */
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const fin=v=>typeof v==='number'&&isFinite(v);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nf=v=>{ try{ if(typeof n0==='function') return n0(v); }catch(e){} return Math.round(v).toLocaleString('pt-BR'); };
const Y=()=>window.Sys||{};
const hostOf=()=>Y().host||null;
const eras=()=>{ try{ return (typeof ERAS!=='undefined'&&Array.isArray(ERAS))?ERAS:[]; }catch(e){ return []; } };
const perEra=()=>{ try{ return (typeof STAGES_PER_ERA==='number'&&STAGES_PER_ERA>0)?STAGES_PER_ERA:10; }catch(e){ return 10; } };
const lastStage=()=>eras().length*perEra();
const eraIdx=st=>clamp(Math.floor((Math.max(1,st|0)-1)/perEra()),0,Math.max(0,eras().length-1));
const eraName=i=>{ const e=eras()[i]; return (e&&e.n)||('Era '+(i+1)); };
const ownBoss=i=>{ try{ return (typeof era9Boss==='function'&&era9Boss(i))||null; }catch(e){ return null; } };
const bossOf=i=>{ const own=ownBoss(i); if(own) return own; const e=eras()[i]; try{ return (e&&e.en&&e.en.length&&e.en[e.en.length-1].n)||'Senhor da Era'; }catch(x){ return 'Senhor da Era'; } };
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroN=()=>heroId()==='kaia'?'Kaia':'Kael';
const sndP=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const fcT=v=>{ try{ if(typeof fcShow==='function') return String(fcShow(v)); }catch(e){} try{ const F=Y().fc; if(F&&typeof F.viewText==='function') return String(F.viewText(v)); }catch(e){} return nf(v); };
const needFC=st=>{ try{ const f=typeof fcNeed==='function'?fcNeed:(typeof recFC==='function'?recFC:null); const v=f?f(st):null; return fin(v)&&v>0?v:null; }catch(e){ return null; } };
const myFC=()=>{ try{ if(typeof heroFC==='function'){ const v=heroFC(); if(fin(v)&&v>0) return v; } }catch(e){} try{ const F=Y().fc; const v=F&&F.compute?F.compute(S,hostOf()):null; return fin(v)&&v>0?v:null; }catch(e){ return null; } };
const cur=t=>{ try{ const T=Y().titles; const v=T&&typeof T.current==='function'?T.current(S,hostOf(),t):null; return fin(v)?v:null; }catch(e){ return null; } };
const STAR_RX=new RegExp(' *'+String.fromCharCode(9733),'g');   /* o módulo escreve "5 (estrela)" com o sinal; a tela escreve por extenso */
const noStar=x=>String(x==null?'':x).replace(STAR_RX,' estrelas');
/* montaria e pet em uso: lidos do save sem normalizar (a tela não escreve nada) */
function mountNow(){ try{ const o=S.sys&&S.sys.mount, M=Y().mount; if(!o||!o.eq||!M||!M.DATA) return null; const d=(M.DATA.mounts||[]).find(q=>q.id===o.eq); return d&&o.owned&&o.owned[d.id]?d:null; }catch(e){ return null; } }
function petNow(){ try{ const o=S.sys&&S.sys.pet, P=Y().pet; if(!o||!o.eq||!P||!P.DATA) return null; const d=(P.DATA.pets||[]).find(q=>q.id===o.eq); return d&&o.owned&&o.owned[d.id]?d:null; }catch(e){ return null; } }
function mountCount(){ try{ const o=S.sys&&S.sys.mount, M=Y().mount; if(!M||!M.DATA) return null; const all=(M.DATA.mounts||[]).filter(d=>typeof M.live!=='function'||M.live(d)===true);
    const own=o&&o.owned&&typeof o.owned==='object'?Object.keys(o.owned).length:0; return {own,all:Math.max(own,all.length)}; }catch(e){ return null; } }
function petCount(){ try{ const o=S.sys&&S.sys.pet, P=Y().pet; if(!P||!P.DATA) return null; const all=(P.DATA.pets||[]).filter(d=>typeof P.avail!=='function'||P.avail(d,hostOf())===true);
    const own=o&&o.owned&&typeof o.owned==='object'?Object.keys(o.owned).length:0; return {own,all:Math.max(own,all.length)}; }catch(e){ return null; } }
function levelNow(){ try{ const L=Y().level; if(!L||typeof L.level!=='function') return null; const lvl=L.level(S)|0, max=L.DATA&&L.DATA.maxLevel|0; return {lvl,max:max>0?max:0}; }catch(e){ return null; } }
const reduced=()=>{ try{ return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches===true; }catch(e){ return false; } };

/* ---------- CSS (classes e9-*; paleta do protótipo V2) ---------- */
const CSS=`
.e9-ov{position:absolute;inset:0;z-index:95;overflow:hidden;background:#0b1030;font-family:Nunito,system-ui,sans-serif;color:#eef1ff;display:flex;flex-direction:column;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}
.e9-ov,.e9-ov *{box-sizing:border-box}
.e9-ov button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.e9-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.e9-wait{flex:1;background:#0b1030}
.e9-scene{position:relative;flex:none;overflow:hidden;cursor:pointer;background:#0b1030}
.e9-ly{position:absolute;left:0;right:0;background-repeat:repeat-x;pointer-events:none}
.e9-dim{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,rgba(11,16,48,.38) 0%,rgba(11,16,48,.05) 30%,rgba(11,16,48,0) 70%,rgba(11,16,48,.75) 92%,#0b1030 100%)}
.e9-cv{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.e9-still{position:absolute;left:50%;transform:translateX(-50%);object-fit:contain;pointer-events:none}
.e9-top{position:absolute;z-index:6;left:0;right:0;top:0;display:flex;align-items:center;gap:8px;padding:max(10px,env(safe-area-inset-top)) 12px 0;pointer-events:none;min-width:0}
.e9-pill{flex:none;height:30px;padding:0 11px;border-radius:15px;background:rgba(5,8,28,.7);border:1px solid rgba(130,150,255,.28);display:flex;align-items:center;font-weight:900;font-size:12px;white-space:nowrap}
.e9-dots{flex:1;min-width:0;display:flex;justify-content:center;gap:6px}
.e9-dots i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.35)}
.e9-dots i.on{background:#ffd25e;width:20px;border-radius:4px}
.e9-ov .e9-skip{flex:none;pointer-events:auto;min-height:40px;min-width:64px;padding:0 14px;border-radius:12px;border:1px solid rgba(160,180,255,.5);background:rgba(5,8,28,.72);color:#eef1ff;font-weight:900;font-size:13px;display:inline-flex;align-items:center;justify-content:center;gap:4px}
.e9-ban{position:relative;z-index:5;flex:none;display:flex;flex-direction:column;align-items:center;padding:0 14px 6px;pointer-events:none;min-width:0}
.e9-rib{max-width:100%;min-width:0;padding:6px 20px 7px;font-size:22px;letter-spacing:1px;line-height:1.08;color:#fff6d6;text-align:center;text-transform:uppercase;overflow-wrap:anywhere;text-wrap:balance;background:#b9761f;border-radius:10px;box-shadow:0 3px 0 #6a3a0c,0 0 22px rgba(255,210,94,.5);text-shadow:0 2px 0 rgba(0,0,0,.35);animation:e9pop .5s ease-out both}
.e9-rib.blue{background:#33479f;box-shadow:0 3px 0 #18225e,0 0 20px rgba(94,231,255,.4)}
.e9-rib.go{font-size:25px;background:#1fae6b;box-shadow:0 4px 0 #0b5a35,0 0 28px rgba(94,240,160,.55)}
.e9-rib small{display:block;font-family:Nunito,system-ui,sans-serif;font-weight:900;font-size:11px;letter-spacing:1.2px;line-height:1.25;color:#ffe9b0;margin-top:2px;overflow-wrap:anywhere}
.e9-rib.go small{color:#e6fff1}
.e9-tap{margin-top:5px;padding:3px 10px;border-radius:10px;background:rgba(5,8,28,.66);font-size:11px;font-weight:800;color:#dfe5ff;text-align:center;animation:e9blink 1.6s ease-in-out infinite}
.e9-pc{position:relative;flex:1;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;padding:4px 12px 8px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
.e9-pc::-webkit-scrollbar{display:none}
.e9-in{width:100%;max-width:600px;margin:0 auto;min-width:0}
.e9-pf{flex:none;padding:8px 12px;padding-bottom:max(14px,env(safe-area-inset-bottom));background:#0b1030;min-width:0}
.e9-pf>div{display:flex;gap:8px;align-items:stretch;width:100%;max-width:600px;margin:0 auto;min-width:0}
.e9-pan{border-radius:16px;background:rgba(24,33,86,.78);border:1px solid rgba(130,150,255,.28);padding:10px;margin-bottom:8px;min-width:0;animation:e9in .3s ease-out both}
.e9-nxt{border-radius:16px;padding:10px;margin-bottom:8px;background:rgba(34,196,122,.13);border:2px solid #5ef0a0;min-width:0;animation:e9in .3s ease-out both}
.e9-nxt h3{margin:0 0 2px;font-size:20px;letter-spacing:.5px;line-height:1.15;color:#eafff3;overflow-wrap:anywhere}
.e9-bar{height:12px;border-radius:6px;background:rgba(5,8,28,.6);overflow:hidden;margin:6px 0 4px}
.e9-bar i{display:block;height:100%;border-radius:6px;background:#3fdc8e}
.e9-bl{display:flex;justify-content:space-between;gap:8px;font-size:11px;font-weight:900;color:#9aa6d6;min-width:0}
.e9-bl span{min-width:0;overflow-wrap:anywhere}
.e9-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#9aa6d6;font-weight:900;margin:0 0 7px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.e9-sec span{min-width:0;overflow-wrap:anywhere}
.e9-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.e9-lead{font-size:13px;line-height:1.45;margin:0 0 6px;font-weight:700;overflow-wrap:anywhere}
.e9-lead b{color:#ffd25e}
.e9-hint{font-size:11px;color:#9aa6d6;margin:7px 0 0;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.e9-kv{display:flex;justify-content:space-between;gap:10px;font-size:12px;font-weight:800;padding:5px 0;border-top:1px solid rgba(130,150,255,.15);min-width:0;line-height:1.3}
.e9-kv.f{border-top:0}
.e9-kv span:first-child{color:#9aa6d6;flex:none;max-width:46%}
.e9-kv span:last-child{text-align:right;min-width:0;overflow-wrap:anywhere}
.e9-kv b{color:#ffd25e}
.e9-eras{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.e9-em{min-width:0;border-radius:12px;border:1px solid var(--ec);background:rgba(5,8,28,.55);padding:6px 3px 5px;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;animation:e9lit .45s ease-out both}
.e9-em svg{width:40px;height:40px;flex:none}
.e9-em b{font-size:11px;font-weight:900;line-height:1.15;max-width:100%;overflow-wrap:anywhere}
.e9-em small{font-size:9.5px;font-weight:800;line-height:1.15;color:#5ef0a0;max-width:100%;overflow-wrap:anywhere}
.e9-cnt{font-size:22px;color:#ffd25e;text-align:center;margin-top:6px;letter-spacing:1px}
.e9-stats{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.e9-sc{min-width:0;border-radius:12px;background:rgba(5,8,28,.55);border:1px solid rgba(130,150,255,.28);padding:7px 9px}
.e9-sc small{display:block;font-size:9.5px;letter-spacing:.8px;color:#9aa6d6;font-weight:900;text-transform:uppercase;line-height:1.2;overflow-wrap:anywhere}
.e9-sc b{display:block;font-size:21px;line-height:1.1;color:#ffd25e;overflow-wrap:anywhere}
.e9-sc em{display:block;font-style:normal;font-size:10px;font-weight:800;color:#9aa6d6;line-height:1.25;overflow-wrap:anywhere}
.e9-rw{display:flex;gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(130,150,255,.15);min-width:0}
.e9-rw.f{border-top:0}
.e9-ri{flex:none;width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(5,8,28,.6);border:1px solid rgba(160,180,255,.5)}
.e9-ri img{width:32px;height:32px;object-fit:contain}
.e9-ri svg{width:28px;height:28px}
.e9-rt{flex:1;min-width:0}
.e9-rt b{display:block;font-size:13px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.e9-rt span{display:block;font-size:11px;font-weight:700;color:#9aa6d6;line-height:1.35;overflow-wrap:anywhere}
.e9-gl{display:flex;gap:8px;align-items:flex-start;font-size:12px;font-weight:800;padding:5px 0;border-top:1px solid rgba(130,150,255,.15);min-width:0;line-height:1.35}
.e9-gl.f{border-top:0}
.e9-gl i{flex:none;width:8px;height:8px;margin-top:5px;border-radius:50%;background:#5ef0a0}
.e9-gl span{min-width:0;overflow-wrap:anywhere}
.e9-gl b{color:#ffd25e}
.e9-fr{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.3fr) minmax(0,1fr);gap:8px;align-items:center;font-size:12px;font-weight:900;padding:4px 0;border-top:1px solid rgba(130,150,255,.12)}
.e9-fr.f{border-top:0}
.e9-fr span:first-child{color:#9aa6d6;min-width:0}
.e9-fr i{display:block;height:10px;border-radius:5px;background:#f4a52a}
.e9-fr.now i{background:#3fdc8e}
.e9-fr span:last-child{text-align:right;color:#ffd25e;min-width:0;overflow-wrap:anywhere}
.e9-ov .e9-bt,.xs .e9-bt{flex:1 1 0;min-width:0;min-height:50px;padding:6px 12px;border-radius:14px;border:0;font-weight:900;font-size:16px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 4px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-align:center}
.e9-ov .e9-bt:active{transform:translateY(2px);box-shadow:0 2px 0 #9a5a10}
.e9-ov .e9-bt.grn,.xs .e9-bt.grn{background:linear-gradient(180deg,#7dffb8,#22c47a);color:#05301b;box-shadow:0 4px 0 #0d6b40}
.e9-ov .e9-lnk{flex:none;min-height:50px;min-width:44px;padding:0 10px;border:0;background:none;color:#9aa6d6;font-weight:900;font-size:12px;text-decoration:underline}
.e9-bt svg{width:16px;height:16px;flex:none}
@keyframes e9in{from{opacity:.001;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes e9pop{0%{opacity:0;transform:scale(.5)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:none}}
@keyframes e9lit{0%{opacity:.4;filter:grayscale(1);transform:scale(.85)}60%{opacity:1;filter:none;transform:scale(1.06)}100%{opacity:1;filter:none;transform:none}}
@keyframes e9blink{50%{opacity:.45}}
@media (prefers-reduced-motion:reduce){.e9-ov *{animation-duration:.01ms!important;animation-delay:0s!important;animation-iteration-count:1!important}}
`;
function inject(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('e9_css')) return; const st=document.createElement('style'); st.id='e9_css'; st.textContent=CSS; document.head.appendChild(st); }catch(e){} }
const SV={
  next:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
  skip:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l6 6-6 6M13 6l6 6-6 6"></path></svg>',
  sun:'<svg viewBox="0 0 24 24" fill="none" stroke="#ffd25e" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="#ffe58a"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"></path></svg>',
  scroll:'<svg viewBox="0 0 24 24" fill="none" stroke="#5ee7ff" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><path d="M6 4h11a2 2 0 012 2v12a2 2 0 01-2 2H7a3 3 0 01-3-3V6a2 2 0 012-2z"></path><path d="M8 9h8M8 13h8M8 17h5"></path></svg>',
  medal:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h4l1 5-3 1zM17 2h-4l-1 5 3 1z" fill="#ff6b9a"></path><circle cx="12" cy="15" r="6.5" fill="#ffd25e" stroke="#9a5a10" stroke-width="1.5"></circle><path d="M12 11.5l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" fill="#9a5a10"></path></svg>' };

/* ---------- o que esta abertura mostra ---------- */
const stageWon=()=>(E.o&&E.o.stage>0)?E.o.stage:lastStage();
const eraWon=()=>eraIdx(stageWon());
const bossName=()=>(E.o&&E.o.boss)||bossOf(eraWon());
const nEras=()=>eras().length;
/* fases vencidas segundo o jogo (Sys.titles.current 'stage' = S.best − 1), nunca menos que a fase que acabou de cair */
const wonCount=()=>{ const c=cur('stage'); return Math.max(stageWon(),c==null?0:c); };
function col(v,d){ return (typeof v==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(v))?v:d; }
const ROM=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'];
function eraSvg(i){ const e=eras()[i]||{}, sk=Array.isArray(e.sky)?e.sky:[], a=col(sk[0],'#3d4fb8'), b=col(sk[1],'#26338a'), r=ROM[i]||String(i+1);
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="e9g${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"></stop><stop offset="1" stop-color="${b}"></stop></linearGradient></defs><path d="M20 2l15 6v11c0 9-6.5 15.5-15 19C11.5 34.5 5 28 5 19V8z" fill="url(#e9g${i})" stroke="#ffd25e" stroke-width="2"></path><text x="20" y="25" text-anchor="middle" font-family="Lilita One,Impact,sans-serif" font-size="${r.length>2?10:13}" fill="#fff" stroke="rgba(0,0,0,.55)" stroke-width="2.5" paint-order="stroke">${r}</text></svg>`; }
/* PRÊMIOS: só o que o jogo já entregou. {ic, t, s} */
function prizeRows(){ const out=[], o=E.o||{}, T=Y().titles, L=stageWon();
  if(o.gems>0) out.push({ic:'gem',t:'+'+nf(o.gems)+(o.gems===1?' diamante':' diamantes'),s:'Pela vitória na fase '+nf(L)});
  if(o.essence>0) out.push({ic:'sun',t:'+'+nf(o.essence)+' Essência da Era',s:'Deixada por: '+bossName()});
  for(const p of Array.isArray(o.prizes)?o.prizes:[]){ if(p&&p.title) out.push({ic:'sun',t:String(p.title),s:String(p.text||'')}); }
  try{ if(T&&T.DATA&&typeof T.isUnlocked==='function'){ const feat=typeof T.featured==='function'?T.featured(S):null;
      for(const ty of ['stage','era']){ const t=T.DATA.titles.filter(q=>q.cond&&q.cond.type===ty&&typeof q.cond.n==='number'&&T.isUnlocked(S,q.id)).sort((a,b)=>b.cond.n-a.cond.n)[0]; if(!t) continue;
        const on=!!(feat&&feat.id===t.id), bn=typeof T.bonusText==='function'?T.bonusText(t,on?T.DATA.featuredMult:1):'', cd=typeof T.condLabel==='function'?noStar(T.condLabel(S,hostOf(),t)):'';
        out.push({ic:'medal',t:'Título: '+t.name,s:[cd,bn&&bn!=='—'?bn+(on?' (em destaque)':''):''].filter(Boolean).join(' · ')}); } } }catch(e){}
  try{ const A=Y().achievements; if(A&&A.DATA&&A.DATA.on===true&&typeof A.status==='function'){ const st=A.status(S,hostOf()); let it=null; for(const g of (st&&st.groups)||[]) for(const q of g.items||[]) if(q.id==='era') it=q;
      if(it){ const got=it.tiers.filter(x=>it.value>=x).length; if(got>0) out.push({ic:'scroll',t:'Conquista: '+it.name+' (nível '+nf(got)+' de '+nf(it.tiers.length)+')',s:it.ready?'Prêmio pronto para resgatar em Missões':'Prêmio já resgatado'}); } } }catch(e){}
  return out; }
/* PRÓXIMO MARCO: o de quem chama, ou o próximo título de fase ainda fechado; null = o jogo não informa nenhum */
function milestone(){ const o=E.o||{}, won=wonCount();
  try{ const m=o.milestone; if(m&&fin(+m.stage)&&+m.stage>won) return {stage:Math.floor(+m.stage),rows:(Array.isArray(m.rewards)?m.rewards:[]).map(x=>noStar(x)).filter(Boolean)}; }catch(e){}
  try{ const T=Y().titles; const t=T.DATA.titles.filter(q=>q.cond&&q.cond.type==='stage'&&typeof q.cond.n==='number'&&q.cond.n>won&&!T.isUnlocked(S,q.id)).sort((a,b)=>a.cond.n-b.cond.n)[0];
    if(t){ const bn=T.bonusText(t,1); return {stage:t.cond.n,rows:['Título '+t.name+(bn&&bn!=='—'?': '+bn:'')]}; } }catch(e){}
  return null; }
/* O QUE CONTINUA CRESCENDO: só o que os módulos sabem dizer. Lista de HTML já escapado */
function growRows(){ const out=[], T=Y().titles;
  try{ if(T&&T.DATA&&typeof T.progress==='function'){ const l=T.DATA.titles.filter(t=>!t.cosmetic&&!T.isUnlocked(S,t.id)).map(t=>({t,p:T.progress(S,hostOf(),t)})).filter(x=>x.p&&x.p.need>0&&x.t.cond.type!=='arena').sort((a,b)=>b.p.frac-a.p.frac).slice(0,2);
      for(const x of l) out.push('Título <b>'+esc(x.t.name)+'</b>: '+esc(noStar(T.condLabel(S,hostOf(),x.t)))+' ('+nf(Math.min(x.p.cur,x.p.need))+' de '+nf(x.p.need)+')'); } }catch(e){}
  { const L=levelNow(); if(L&&L.max>0&&L.lvl<L.max) out.push('Nível do herói: <b>'+nf(L.lvl)+'</b> de '+nf(L.max)); }
  { const p=petCount(); if(p&&p.all>p.own) out.push('Pets: <b>'+nf(p.own)+'</b> de '+nf(p.all)); }
  { const m=mountCount(); if(m&&m.all>m.own) out.push('Montarias: <b>'+nf(m.own)+'</b> de '+nf(m.all)); }
  { const tw=cur('tower'); if(tw!=null&&Y().tower) out.push(tw>0?'Torre: seu recorde é o andar <b>'+nf(tw)+'</b>':'Torre: suba os andares para ganhar títulos'); }
  return out; }
/* FC pedida das próximas fases: só aparece se o jogo disser que ela CRESCE depois da última fase das eras */
function fcRows(){ const L=stageWon(), st=[L+1,L+10,L+30,L+60], base=needFC(L); if(!base) return null; const v=st.map(needFC); let p=base; for(const q of v){ if(!(q>p)) return null; p=q; } return {st,v,base}; }
function stepsOf(){ const out=['boss','eras','sum']; if(prizeRows().length) out.push('prize'); out.push('next'); return out; }

/* ---------- textos de cada passo ---------- */
function bannerOf(sk){ const n=nEras(), L=stageWon();
  if(sk==='boss') return [bossName()+' derrotado','Fase '+nf(L)+' · Senhor da Era '+eraName(eraWon()),''];
  if(sk==='eras') return ['As '+n+' eras concluídas',n+' Senhores das Eras vencidos',''];
  if(sk==='sum'){ const lv=levelNow(); return ['Sua jornada até aqui',heroN()+(lv?' · nível '+nf(lv.lvl):''),'blue']; }
  if(sk==='prize') return ['Prêmios das '+n+' eras','Nada sorteado, nada à venda',''];
  const m=milestone(); return ['A jornada continua',m?'Próximo marco: fase '+nf(m.stage):'Próxima fase: '+nf(L+1),'go']; }
function banHtml(){ const sk=E.steps[E.i], last=E.i>=E.steps.length-1;
  if(sk==='boss'&&!E.bn) return `<div class="e9-tap">${esc(bossName())} cai</div>`;
  const b=bannerOf(sk); return `<div class="e9-rib e9-lil ${b[2]}">${esc(b[0])}<small>${esc(b[1])}</small></div>${last?'':'<div class="e9-tap">Toque no cenário ou em Próximo para continuar</div>'}`; }
const kv=(l,v,first)=>`<div class="e9-kv${first?' f':''}"><span>${esc(l)}</span><span>${v}</span></div>`;
function panelHtml(sk){ const L=stageWon(), ei=eraWon(), n=nEras();
  if(sk==='boss'){ const need=needFC(L), fc=myFC(), mt=mountNow(), pt=petNow(), rows=[];
    rows.push(['Chefe',esc(bossName())+' · '+esc(eraName(ei))]); rows.push(['Fase','<b>'+nf(L)+'</b> de '+nf(lastStage())]);
    if(need) rows.push(['FC pedida na fase '+nf(L),'<b>'+esc(fcT(need))+'</b>']); if(fc) rows.push(['Sua FC','<b>'+esc(fcT(fc))+'</b>']);
    rows.push(['Herói',esc(heroN())+(mt?' em '+esc(mt.name):'')+(pt?' · pet '+esc(pt.name):'')]);
    return `<div class="e9-pan"><p class="e9-lead"><b>${esc(bossName())}</b> caiu. Era o Senhor da Era ${esc(eraName(ei))}, o último chefe das ${n} eras.</p>${rows.map((r,i)=>kv(r[0],r[1],i===0)).join('')}</div>`; }
  if(sk==='eras') return `<div class="e9-pan"><div class="e9-sec"><span>As ${n} eras</span><span>cada era com o seu Senhor vencido</span></div>
    <div class="e9-eras">${eras().map((e,i)=>{ const sk2=Array.isArray(e.sky)?e.sky:[]; return `<div class="e9-em" style="--ec:${i===n-1?'#ffd25e':col(sk2[1],'#7f93ff')};animation-delay:${(i*.3).toFixed(2)}s">${eraSvg(i)}<b>${esc(eraName(i))}</b><small>${esc(bossOf(i))}</small></div>`; }).join('')}</div>
    <div class="e9-cnt e9-lil">${n} de ${n} eras</div></div>`;
  if(sk==='sum'){ const c=(l,v,s)=>`<div class="e9-sc"><small>${esc(l)}</small><b class="e9-lil">${esc(v)}</b>${s?'<em>'+esc(s)+'</em>':''}</div>`, a=[];
    const tot=lastStage(), won=wonCount(); a.push(c('Fases vencidas',nf(Math.min(won,tot))+' de '+nf(tot),won>tot?'e mais '+nf(won-tot)+' depois das eras':'todas as '+n+' eras'));
    a.push(c('Senhores das Eras',n+' de '+n,'de '+bossOf(0)+' a '+bossOf(n-1)));
    { const v=cur('boss'); if(v>0) a.push(c('Chefes vencidos',nf(v),'')); }
    { const v=cur('kills'); if(v>0) a.push(c('Inimigos derrotados',nf(v),'')); }
    { const fc=myFC(), need=needFC(L); if(fc) a.push(c('Sua FC',fcT(fc),need?'a fase '+nf(L)+' pede '+fcT(need):'')); }
    { const lv=levelNow(); if(lv) a.push(c('Nível do herói',nf(lv.lvl),lv.max?'máximo '+nf(lv.max):'')); }
    { const p=petCount(), pt=petNow(); if(p&&p.own>0) a.push(c('Pets',nf(p.own)+' de '+nf(p.all),pt?'em uso: '+pt.name:'')); }
    { const m=mountCount(), mt=mountNow(); if(m&&m.own>0) a.push(c('Montarias',nf(m.own)+' de '+nf(m.all),mt?'em uso: '+mt.name:'')); }
    { const v=cur('tower'); if(v>0) a.push(c('Torre',nf(v),'seu recorde de andar')); }
    try{ const T=Y().titles; if(T&&T.DATA){ const own=T.DATA.titles.filter(t=>T.isUnlocked(S,t.id)).length; if(own>0) a.push(c('Títulos',nf(own)+' de '+nf(T.DATA.titles.length),'')); } }catch(e){}
    try{ const s=Math.floor(+S.playSeconds||0); if(s>=60) a.push(c('Tempo de jogo',s>=3600?nf(Math.floor(s/3600))+' h':nf(Math.floor(s/60))+' min','')); }catch(e){}
    return `<div class="e9-pan"><div class="e9-sec"><span>Resumo</span><span>do seu jogo</span></div><div class="e9-stats">${a.join('')}</div></div>`; }
  if(sk==='prize'){ const rows=prizeRows();
    return `<div class="e9-pan"><div class="e9-sec"><span>Já é seu</span><span>fica com você</span></div>${rows.map((r,i)=>`<div class="e9-rw${i?'':' f'}"><span class="e9-ri">${r.ic==='gem'?`<img src="${IMG_GEM}" alt="">`:SV[r.ic]||SV.sun}</span><span class="e9-rt"><b>${esc(r.t)}</b>${r.s?'<span>'+esc(r.s)+'</span>':''}</span></div>`).join('')}
      <p class="e9-hint">Nada sorteado e nada à venda nesta tela.</p></div>`; }
  /* último passo (DESTAQUE): a jornada continua */
  const m=milestone(), won=wonCount(), nx=L+1, need=needFC(nx), fc=myFC(), gr=growRows(), fr=fcRows(); let h='';
  if(m){ const span=Math.max(1,m.stage-L), pct=clamp(Math.round((won-L)/span*100),4,100), left=Math.max(0,m.stage-won);
    h+=`<div class="e9-nxt"><h3 class="e9-lil">Próximo marco: fase ${nf(m.stage)}</h3>
      <div class="e9-bar" role="progressbar" aria-label="Caminho até a fase ${nf(m.stage)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
      <div class="e9-bl"><span>fase ${nf(nx)}</span><span>${left===1?'falta 1 fase':'faltam '+nf(left)+' fases'}</span><span>fase ${nf(m.stage)}</span></div>
      ${m.rows.map((r,i)=>`<div class="e9-gl${i?'':' f'}"><i></i><span>${esc(r)}</span></div>`).join('')}</div>`; }
  else h+=`<div class="e9-nxt"><h3 class="e9-lil">Próxima fase: ${nf(nx)}</h3>${need?kv('FC pedida na fase '+nf(nx),'<b>'+esc(fcT(need))+'</b>',true):''}${fc?kv('Sua FC','<b>'+esc(fcT(fc))+'</b>',!need):''}</div>`;
  h+=`<div class="e9-pan"><p class="e9-lead">As ${n} eras terminaram, a jornada não. Depois da fase ${nf(L)} vêm as <b>fases sem fim</b> na Era ${esc(eraName(ei))}.</p>
    ${gr.length?`<div class="e9-sec"><span>O que continua crescendo</span><span>do seu jogo</span></div>${gr.map((r,i)=>`<div class="e9-gl${i?'':' f'}"><i></i><span>${r}</span></div>`).join('')}`:''}
    <p class="e9-hint">Tudo o que você tem continua com você: equipamento, forja, pets, montarias e títulos.</p></div>`;
  if(fr){ const mx=Math.log(fr.v[fr.v.length-1]/fr.base)||1;
    h+=`<div class="e9-pan"><div class="e9-sec"><span>FC pedida</span><span>cresce a cada fase</span></div>${fr.st.map((s,i)=>{ const w=clamp(12+88*Math.log(fr.v[i]/fr.base)/mx,6,100); return `<div class="e9-fr${i?'':' f now'}"><span>Fase ${nf(s)}</span><i style="width:${w.toFixed(1)}%"></i><span>${esc(fcT(fr.v[i]))}</span></div>`; }).join('')}</div>`; }
  return h; }
function footHtml(){ const last=E.i>=E.steps.length-1;
  if(!last) return `<div><button class="e9-bt" data-x="next">Próximo ${SV.next}</button></div>`;
  return `<div><button class="e9-bt grn" data-x="cont">Seguir para a fase ${nf(stageWon()+1)} ${SV.next}</button><button class="e9-lnk" data-x="again">Ver de novo</button></div>`; }

/* ---------- PALCO ---------- */
const bgDir=()=>'assets/bg/v2/era'+eraWon()+'/';
const bossUrl=()=>'assets/enemies/era'+eraWon()+'_boss.png';
const canDraw=()=>{ try{ return !E.err&&typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
const mounted=()=>{ try{ return typeof heroLook==='function'&&!!heroLook().mount; }catch(e){ return false; } };
function stillUrl(){ try{ const A=Y().appearance, k=A&&typeof A.avatarKey==='function'?A.avatarKey(S,hostOf()):null; return k?'assets/hero/avatar/'+k+'.png':null; }catch(e){ return null; } }
function bossImg(){ const u=bossUrl(); if(E.boss&&E.bossUrl===u) return E.boss; try{ if(typeof Image==='undefined') return null; E.boss=new Image(); E.bossUrl=u; E.boss.src=u; }catch(e){ E.boss=null; } return E.boss; }
const CFC=['#ffd25e','#5ee7ff','#a97bff','#ff6b9a','#5ef0a0','#fff3c4'];
function burst(n,W){ for(let i=0;i<n&&E.cf.length<70;i++) E.cf.push({x:Math.random()*W,y:-10-Math.random()*W*0.6,vx:(Math.random()-.5)*30,vy:55+Math.random()*60,r:Math.random()*6.3,vr:(Math.random()-.5)*8,w:4+Math.random()*4,h:2+Math.random()*3,c:CFC[E.cf.length%CFC.length],sw:Math.random()*6.3,life:0}); }
/* cada parte do palco é protegida: um erro numa parte não derruba as outras (o estado do canvas é devolvido) */
function part(x,fn){ x.save(); try{ fn(); }catch(e){} x.restore(); }
function draw(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth, h=c.clientHeight; if(!w||!h) return;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!E.t0) E.t0=ts; const t=Math.max(0,(ts-E.t0)/1000), dt=clamp(t-E.now,0,0.1); E.now=t;
  const x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,c.width,c.height);
  const W=c.width, H=c.height, u=H/400, GY=H*0.78, sk=E.steps[E.i], ts2=Math.max(0,t-E.at), calm=reduced();
  const tx=W*(sk==='boss'?0.34:0.5); if(E.hx<0) E.hx=tx; E.hx+=(tx-E.hx)*Math.min(1,dt*3.2); const hx=E.hx, BX=W*0.78, BS=210*u;
  /* raios de luz atrás do herói (no 1º passo só depois que o chefe some) */
  part(x,()=>{ const amp=sk==='boss'?clamp((ts2-2.6)/1.2,0,1):1, cy=GY-112*u; if(!(amp>0)) return; x.globalCompositeOperation='lighter';
    if(!calm) for(let i=0;i<14;i++){ const a=t*0.18+i*Math.PI/7, L=330*u, g=x.createRadialGradient(hx,cy,10*u,hx,cy,L); g.addColorStop(0,'rgba(255,236,170,'+(0.30*amp).toFixed(3)+')'); g.addColorStop(1,'rgba(255,236,170,0)');
      x.fillStyle=g; x.beginPath(); x.moveTo(hx,cy); x.arc(hx,cy,L,a-0.09,a+0.09); x.closePath(); x.fill(); }
    const g2=x.createRadialGradient(hx,cy,4*u,hx,cy,120*u); g2.addColorStop(0,'rgba(255,250,220,'+(0.35*amp).toFixed(3)+')'); g2.addColorStop(1,'rgba(255,250,220,0)'); x.fillStyle=g2; x.beginPath(); x.arc(hx,cy,120*u,0,7); x.fill(); });
  /* chão iluminado */
  part(x,()=>{ const g=x.createRadialGradient(hx,GY,8*u,hx,GY,170*u); g.addColorStop(0,'rgba(255,226,140,.35)'); g.addColorStop(1,'rgba(255,226,140,0)'); x.fillStyle=g; x.beginPath(); x.ellipse(hx,GY,170*u,24*u,0,0,7); x.fill(); });
  /* 1º PASSO: o chefe derrotado some na luz (pés no chão) */
  if(sk==='boss') part(x,()=>{ const B0=bossImg(), light=clamp((ts2-0.3)/1.0,0,1), a=1-clamp((ts2-1.3)/1.6,0,1), colA=light*(1-clamp((ts2-2.9)/1.2,0,1));
    if(colA>0){ x.save(); x.globalCompositeOperation='lighter'; const g=x.createLinearGradient(BX-60*u,0,BX+60*u,0); g.addColorStop(0,'rgba(255,246,200,0)'); g.addColorStop(.5,'rgba(255,246,200,'+(0.55*colA).toFixed(3)+')'); g.addColorStop(1,'rgba(255,246,200,0)'); x.fillStyle=g; x.fillRect(BX-60*u,0,120*u,GY+6*u); x.restore(); }
    if(B0&&B0.complete&&B0.naturalWidth>0&&a>0){ x.save(); x.globalAlpha=.28*a; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(BX,GY+3*u,58*u,8*u,0,0,7); x.fill(); x.restore();
      const bh=BS*(B0.naturalHeight/B0.naturalWidth||1); x.globalAlpha=a; x.drawImage(B0,BX-BS/2,GY+4*u-bh*0.95,BS,bh); x.globalAlpha=1; }
    if(!calm&&ts2>0.8&&ts2<4.2){ x.globalCompositeOperation='lighter'; for(let i=0;i<28;i++){ const s=((i*7919)%997)/997, s2=((i*104729)%991)/991, p=((ts2-0.8)*(0.35+0.3*s)+s2)%1;
        x.fillStyle='rgba(255,240,190,'+(Math.sin(Math.PI*p)*0.9*colA).toFixed(3)+')'; x.beginPath(); x.arc(BX+(s-0.5)*110*u+Math.sin(ts2*2+i)*5*u,GY-p*240*u,(1.4+2*(1-p))*u,0,7); x.fill(); } } });
  /* herói pela rota única do jogo: arma na mão, asa, montaria e o pet por último (na frente) */
  window.drawHeroFull(x,hx,GY,H*(mounted()?0.40:0.48)/HS,{t:t});
  /* confete nas cores do jogo: cai do alto, pousa no chão e some (não no último passo) */
  part(x,()=>{ if(calm){ E.cf.length=0; return; } const fl=GY+30*u; if(sk!=='boss'&&sk!=='next'&&E.cf.length<70&&Math.random()<dt*14) burst(1,W);
    for(const p of E.cf){ if(p.vy!==0){ p.sw+=dt*3; p.x+=(p.vx+Math.sin(p.sw)*22)*dt*u; p.y+=p.vy*dt*u; p.r+=p.vr*dt; if(p.y>=fl) p.vy=0; } else p.life+=dt;
      const al=p.vy===0?Math.max(0,1-p.life/1.2):1; if(al<=0) continue;
      x.save(); x.globalAlpha=al; x.translate(p.x,p.y); x.rotate(p.r); x.scale(1,Math.abs(Math.cos(p.sw*1.3))*0.8+0.2); x.fillStyle=p.c; x.fillRect(-p.w*u/2,-p.h*u/2,p.w*u,p.h*u); x.restore(); }
    E.cf=E.cf.filter(p=>!(p.vy===0&&p.life>1.2)&&p.x>-20&&p.x<W+20); });
  /* a faixa do 1º passo entra quando o chefe termina de sumir */
  if(sk==='boss'&&!E.bn&&ts2>=2.4){ E.bn=1; putBan(); } }
function loop(ts){ E.raf=0; if(!E.open||!E.el) return; const c=document.getElementById('e9_cv'); if(!c) return;
  try{ draw(c,ts); }catch(e){ E.err=1; E.bn=1; frame(); return; }   /* o desenho do jogo falhou: retrato parado, a tela continua funcionando */
  E.raf=requestAnimationFrame(loop); }
function start(){ try{ if(!E.raf&&canDraw()&&document.getElementById('e9_cv')) E.raf=requestAnimationFrame(loop); }catch(e){} }
function stop(){ try{ if(E.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(E.raf); }catch(e){} E.raf=0; }
function putBan(){ try{ const b=document.getElementById('e9_ban'); if(b) b.innerHTML=banHtml(); }catch(e){} }

/* ---------- desenho da tela ---------- */
function frame(){ if(!E.el) return; const W=E.el.clientWidth||390, H=E.el.clientHeight||844, SH=Math.round(clamp(H*0.46,250,420)), f=SH/400, sk=E.steps[E.i], last=E.i>=E.steps.length-1, n=E.steps.length, dir=bgDir(), can=canDraw();
  if(!can) E.bn=1;
  const px=v=>(v*f).toFixed(1)+'px', still=can?null:stillUrl();
  const alt=heroN()+' comemorando com a arma na mão'+(mountNow()?', em '+mountNow().name:'')+(petNow()?', com o pet '+petNow().name+' na frente':'');
  E.el.innerHTML=`<div class="e9-scene" data-x="next" style="height:${SH}px">
      <div class="e9-ly" style="top:0;height:${px(248)};background-image:url(${dir}sky.webp);background-size:${px(496)} ${px(248)}"></div>
      <div class="e9-ly" style="top:${px(26)};height:${px(200)};background-image:url(${dir}far.webp);background-size:${px(501)} ${px(200)};background-position:${px(-52)} 0"></div>
      <div class="e9-ly" style="top:${px(240)};height:${px(163)};background-image:url(${dir}ground.webp);background-size:${px(193)} ${px(163)}"></div>
      ${can?`<canvas id="e9_cv" class="e9-cv" role="img" aria-label="${esc(alt)}"></canvas>`:still?`<img class="e9-still" src="${esc(still)}" alt="${esc(heroN())}" style="bottom:${px(88)};height:${px(190)}">`:''}
      <div class="e9-dim"></div></div>
    <div class="e9-top"><span class="e9-pill" role="status" aria-label="Passo ${E.i+1} de ${n}">${E.i+1}/${n}</span><div class="e9-dots" aria-hidden="true">${E.steps.map((s,i)=>`<i class="${i===E.i?'on':''}"></i>`).join('')}</div>${last?'':`<button class="e9-skip" data-x="skip" aria-label="Pular para o último passo">Pular ${SV.skip}</button>`}</div>
    <div class="e9-ban" id="e9_ban" style="margin-top:${(-Math.max(40,SH*0.22-10)).toFixed(0)}px">${banHtml()}</div>
    <div class="e9-pc" id="e9_pc"><div class="e9-in">${panelHtml(sk)}</div></div>
    <div class="e9-pf">${footHtml()}</div>`;
  try{ const pc=document.getElementById('e9_pc'); if(pc) pc.scrollTop=0; }catch(e){}
  start(); }
function go(i){ E.i=clamp(i|0,0,E.steps.length-1); E.at=E.now; const sk=E.steps[E.i]; if(sk!=='boss') E.bn=1; if(sk==='next') E.cf=[]; else if(sk==='eras'&&!reduced()) burst(60,(E.el&&E.el.clientWidth||390)*Math.min(window.devicePixelRatio||1,2));
  frame(); sndP(sk==='eras'?'claim':sk==='next'?'gem':'ui_tap'); }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
const ACT={
  next(){ if(E.i<E.steps.length-1) go(E.i+1); },
  skip(){ go(E.steps.length-1); },
  again(){ E.bn=0; E.hx=-1; E.cf=[]; E.t0=0; E.now=0; go(0); },
  cont(){ sndP('ui_tap'); close(); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!E.open||!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return false; ACT[a](b); return true; }

/* ---------- abrir e fechar ---------- */
function urls(){ const d=bgDir(), u=[d+'sky.webp',d+'far.webp',d+'ground.webp',bossUrl(),IMG_GEM]; if(!canDraw()){ const s=stillUrl(); if(s) u.push(s); } return u; }
/* pede a carga das imagens ANTES de desenhar (window.Preload do js/preload.js); sem o carregador, desenha direto. Nunca trava: passou do prazo, segue */
function load(list,cb){ let done=false; const end=()=>{ if(done) return; done=true; cb(); };
  try{ const P=window.Preload; if(P&&typeof P.ready==='function'){ const allIn=typeof P.has==='function'&&list.every(u=>{ try{ return P.has(u)===true; }catch(e){ return false; } }); if(allIn){ end(); return; }
      Promise.resolve(P.ready(list,{timeout:6000})).then(end,end); return; } }catch(e){}
  end(); }
/* opcional: quem chama pode pedir a carga adiantada (ex.: quando a luta do Senhor da última era começa), para a tela abrir sem espera */
function preload(){ try{ if(!eras().length) return false; const l=urls(); bossImg(); const P=window.Preload; if(P&&typeof P.ready==='function') P.ready(l,{timeout:6000}); return true; }catch(e){ return false; } }
function close(){ if(!E.open) return false; E.open=false; E.tok++; stop(); if(E.el&&E.el.parentNode){ try{ E.el.parentNode.removeChild(E.el); }catch(e){} } E.el=null; E.cf=[];
  try{ if(typeof B!=='undefined'&&B.res&&B.res.mode===N){ B.res=null; B.running=true; } }catch(e){}
  const cb=E.o&&E.o.onDone; E.o=null; if(typeof cb==='function'){ try{ cb(); }catch(e){} } return true; }
function open(o){ o=o||{}; if(E.open||typeof document==='undefined'||!eras().length) return false;
  const host=document.getElementById('app')||document.body; if(!host||typeof host.appendChild!=='function') return false;
  E.o={stage:Math.floor(+o.stage)>0?Math.floor(+o.stage):0,boss:typeof o.boss==='string'?o.boss:'',gems:Math.max(0,Math.floor(+o.gems||0)),essence:Math.max(0,Math.floor(+o.essence||0)),milestone:o.milestone||null,prizes:Array.isArray(o.prizes)?o.prizes:null,onDone:o.onDone};
  inject(); E.open=true; E.i=0; E.bn=0; E.hx=-1; E.cf=[]; E.err=0; E.t0=0; E.now=0; E.at=0; E.steps=stepsOf(); const tok=++E.tok;
  E.el=document.createElement('div'); E.el.className='e9-ov'; E.el.setAttribute('role','dialog'); E.el.setAttribute('aria-label','As '+nEras()+' eras concluídas: a jornada continua');
  if(typeof E.el.addEventListener==='function') E.el.addEventListener('click',ev=>{ const b=ev.target&&ev.target.closest?ev.target.closest('[data-x]'):null; if(b) click(b); });
  E.el.innerHTML='<div class="e9-wait"></div>'; host.appendChild(E.el);
  try{ if(typeof B!=='undefined'&&!B.res){ B.res={mode:N}; B.act=null; B.banner=null; B.running=false; B.eshots=[]; } }catch(e){}
  bossImg(); load(urls(),()=>{ if(E.open&&E.tok===tok) go(0); });
  return true; }

if(!('end9' in PANEL_ON)) PANEL_ON.end9=false;
Panels.add(N,{title:'Fim das 9 eras',overlay:true,actions:Object.keys(ACT),open:open,close:close,click:click});
window.PEnd9={open:open,close:close,click:click,go:go,preload:preload,state:E,steps:stepsOf};   /* depuração e teste de fumaça: Panels.enable('end9'); Panels.open('end9',{gems:10}) */
})();
