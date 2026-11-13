'use strict';
/* ================= 25 LEILÃO — tela nova, nasce DESLIGADA (PANEL_ON.auction = false) =================
   Protótipo: docs/proto/Leilao.dc.html (selo "em breve", 4 abas, filtro por espaço, cartões por raridade, vender em 3 passos, folhas de filtros/detalhe/regras).
   Só o CONTEÚDO: o cabeçalho (voltar, título, moedas e gemas) é do index.html/fullbattle.js.
   DECISÃO DO PO: o leilão só abre com o jogo online (servidor), que ainda não existe. Por isso esta tela é uma DEMONSTRAÇÃO DESABILITADA:
   - aviso permanente no topo, em todas as abas: "Em breve: abre com o online";
   - comprar, anunciar, cancelar, moeda, preço e duração: tudo com disabled + aria-disabled; o toque só repete o aviso;
   - NENHUM dado inventado com cara de real: sem vendedor, preço, prazo, contagem de itens ou histórico. Os cartões da aba Comprar são cartões de
     EXEMPLO (etiqueta em cada um; vendedor, preço e tempo com travessão). Os únicos dados reais são os do jogador: ouro (S.gold) e a mochila (S.inv);
   - NENHUMA regra ou número de regra aqui (taxa, duração, limites, faixa de preço): "a definir com o online";
   - nada de rede e nada gravado: esta tela não escreve no save S nem chama save(). Só muda o próprio estado de tela (XA). Relógios não existem. */
if(!('auction' in PANEL_ON)) PANEL_ON.auction=false;
const XA={tab:0,slot:-1,era:-1,rar:-1,star:0,sort:0,page:0,det:-1,sheet:'',anim:true,cards:true,keep:false,shAnim:false,toast:'',toastT:0};
const AU_SOON='Em breve: abre com o online';
const AU_TABS=['Comprar','Vender','Meus anúncios','Histórico'];
const AU_RG=['rgba(232,226,216,.35)','rgba(74,163,255,.6)','rgba(176,124,255,.7)','rgba(255,90,90,.65)','rgba(255,201,74,.8)'];
const AU_RB=['#2c2621','#14304d','#2e1f4a','#4a1a1a','#4a3410'];
const AU_EXR=[1,2,0,4,3,2];                       /* raridade de cada cartão de exemplo quando não há filtro de raridade */
/* ícones em código dos 7 espaços (traços do protótipo), na ordem de SLOTS7; n = rótulo curto do filtro */
const AU_SL={
  weapon:{n:'Arma',p1:'M18 3 H21 V6 L10 17 L7 14 Z',p2:'M5 12 L12 19 M6.5 17.5 L3.5 20.5'},
  armor:{n:'Colete',p1:'M8 3 L12 5.5 L16 3 L20.5 6.5 L18 10 V21 H6 V10 L3.5 6.5 Z',p2:'M12 6 V20 M8 13 H16'},
  hat:{n:'Elmo',p1:'M4 15 C4 8.5 7.5 4 12 4 C16.5 4 20 8.5 20 15 Z',p2:'M3 15 H21 V18 H3 Z M12 4 V9'},
  gloves:{n:'Luvas',p1:'M7 21 V11 L5 7.5 C4.4 6 6.4 5 7.4 6.4 L9 8.5 V4.5 C9 3 11 3 11 4.5 V8 V3.8 C11 2.4 13 2.4 13 3.8 V8 V4.8 C13 3.4 15 3.4 15 4.8 V9 V6.8 C15 5.4 17 5.4 17 6.8 V14 L15 21 Z',p2:'M7 18 H15'},
  boots:{n:'Botas',p1:'M7 3 H13 V13 L19.5 15.5 C21 16.2 21 19 19.5 19 H6 Z',p2:'M6 19 V21 H20 V19 M7 7 H13'},
  necklace:{n:'Colar',p1:'M12 14 L15.5 18 L12 22.5 L8.5 18 Z',p2:'M5 4 C5 12 9 15 12 15 C15 15 19 12 19 4'},
  wing:{n:'Asa',p1:'M12 9 C9 3.5 4 3.5 2 5.5 C5 6.5 5 8.5 3 9.5 C6 10.5 6 12.5 4 13.5 C8 14.5 10 13.5 12 11.5 C14 13.5 16 14.5 20 13.5 C18 12.5 18 10.5 21 9.5 C19 8.5 19 6.5 22 5.5 C20 3.5 15 3.5 12 9 Z',p2:'M12 9 V19'} };
const AU_ALL='M4 4 H10 V10 H4 Z M14 4 H20 V10 H14 Z M4 14 H10 V20 H4 Z M14 14 H20 V20 H14 Z';

/* ---------- leituras isoladas (valor de reserva seguro); nenhuma escreve no save ---------- */
const auSlots=()=>{ try{ return SLOTS7.filter(s=>AU_SL[s]); }catch(e){ return Object.keys(AU_SL); } };
const auEras=()=>{ try{ return ERAS.map(x=>String(x.n||'')); }catch(e){ return []; } };
const auEraN=e=>{ const l=auEras(); return l[Math.max(0,Math.min(l.length-1,e|0))]||''; };
const auSlotN=s=>{ try{ return (SLOT[s]&&SLOT[s].n)||AU_SL[s].n; }catch(e){ return AU_SL[s]?AU_SL[s].n:''; } };
const auRarN=r=>{ try{ return RN(r)||''; }catch(e){ return ''; } };
const auName=it=>{ try{ return iname(it)||auSlotN(it.slot); }catch(e){ return auSlotN(it.slot); } };
const auEraOf=it=>{ try{ return ieraV(it); }catch(e){ return it.e|0; } };
const auIcon=(slot,e)=>{ try{ return slotIcon(slot,e); }catch(e2){ return ''; } };
const auBag=()=>{ try{ return Array.isArray(S.inv)?S.inv.filter(x=>x&&AU_SL[x.slot]):[]; }catch(e){ return []; } };
const auInUse=it=>{ try{ return !!S.eq&&S.eq[it.slot]===it.id; }catch(e){ return false; } };
const auGold=()=>{ try{ return kf(S.gold); }catch(e){ return '—'; } };
/* qualidade por estrelas: só existe se o Sys.stats estiver com a chave ligada (hoje desligada); sem ela a tela não fala em estrelas */
function auStarMax(){ try{ const q=Sys.stats.DATA.quality; return q&&q.on===true&&Array.isArray(q.stars)?q.stars.length:0; }catch(e){ return 0; } }
function auStarsOf(it){ try{ if(!auStarMax()||it.qp==null||typeof Sys.stats.qualityStars!=='function') return 0; return Sys.stats.qualityStars(it.qp)|0; }catch(e){ return 0; } }
function auOn(){ return typeof view!=='undefined'&&view==='auction'; }

(function(){ const st=document.createElement('style'); st.textContent=`
@keyframes au-shn{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
@keyframes au-twk{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1.25);opacity:1}}
@keyframes au-inUp{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
@keyframes au-inR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.au-ol{text-shadow:1px 0 0 #120c08,-1px 0 0 #120c08,0 1px 0 #120c08,0 -1px 0 #120c08,0 2px 3px rgba(0,0,0,.7)}
.au-in .au-soon{animation:au-inUp .4s cubic-bezier(.2,1.2,.4,1) both}
.au-new .au-up{animation:au-inUp .4s cubic-bezier(.2,1.2,.4,1) both}
.au-new .au-r{animation:au-inR .35s ease-out both}
.au-soon{flex:none;display:flex;align-items:center;gap:8px;min-height:52px;padding:4px 4px 4px 10px;border-radius:14px;background:linear-gradient(90deg,#1d4a7a,#13314f 60%,#1d1611);border:2px solid #4aa3ff;position:relative;overflow:hidden;box-sizing:border-box}
.au-soon::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);background-size:300% 100%;animation:au-shn 3s ease-in-out infinite;pointer-events:none}
.au-sig{flex:none;animation:au-sigK 1.6s ease-in-out infinite}
@keyframes au-sigK{0%,100%{filter:drop-shadow(0 0 2px rgba(140,200,255,.5));transform:scale(1)}50%{filter:drop-shadow(0 0 10px rgba(140,200,255,1));transform:scale(1.1)}}
.au-tabs{flex:none;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:3px;padding:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b}
.au-tab{min-width:0;min-height:48px;border:0;border-radius:10px;background:transparent;color:#c9b9a2!important;font-family:'Lilita One',Nunito,sans-serif!important;font-size:14px;line-height:1.05;padding:0 3px}
.au-tab.sel{background:#3a2c1f;color:#ffc94a!important;box-shadow:inset 0 -3px 0 #ffc94a}
.au-tab:active,.au-sl:active,.au-ghost:active,.au-chip:active,.au-card:active{transform:scale(.96)}
.au-slots{flex:none;display:grid;gap:4px}
.au-sl{min-width:0;min-height:52px;border-radius:12px;border:2px solid #4a3a2b;background:#1d1611;color:#c9b9a2!important;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;padding:2px;font-size:10.5px;font-weight:900;line-height:1;box-sizing:border-box}
.au-sl.sel{border-color:#ffc94a;background:#3a2c1f;color:#ffc94a!important}
.au-sl svg{width:24px;height:24px}
.au-ghost{min-height:44px;min-width:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf!important;font-weight:900;font-size:13px;padding:0 10px;display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box}
.au-fcount{min-width:18px;height:18px;border-radius:9px;background:#ffc94a;color:#2a1403;font-size:11px;font-weight:900;line-height:18px;text-align:center;padding:0 4px;box-sizing:border-box}
.au-grid{flex:none;display:grid;gap:8px}
.au-card{position:relative;display:flex;flex-direction:column;align-items:stretch;gap:3px;padding:8px;border-radius:16px;border:2px solid var(--rc);background:linear-gradient(180deg,var(--rb) 0%,#19120d 62%);text-align:left;min-width:0;overflow:hidden;box-sizing:border-box;color:#f6ecdf!important}
.au-card.hi{animation:au-rG 2.2s ease-in-out infinite}
.au-new .au-card{animation:au-cardIn .4s cubic-bezier(.2,1.2,.4,1) both}
.au-new .au-card.hi{animation:au-cardIn .4s cubic-bezier(.2,1.2,.4,1) both,au-rG 2.2s ease-in-out .4s infinite}
@keyframes au-cardIn{from{opacity:0;transform:translateY(12px) scale(.96)}to{opacity:1;transform:none}}
@keyframes au-rG{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 16px var(--rg)}}
.au-card::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.12) 50%,transparent 65%);background-size:300% 100%;animation:au-shn 3.4s ease-in-out infinite;pointer-events:none}
.au-ictop{display:flex;align-items:flex-start;gap:6px}
.au-ic{position:relative;width:54px;height:54px;flex:none;border-radius:12px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.08),rgba(0,0,0,.35));border:1px solid var(--rc);display:flex;align-items:center;justify-content:center;overflow:hidden;box-sizing:border-box}
.au-glow{position:absolute;inset:8%;border-radius:50%;background:radial-gradient(circle,var(--rg),transparent 70%);animation:au-glowP 2s ease-in-out infinite}
@keyframes au-glowP{0%,100%{transform:scale(.85);opacity:.55}50%{transform:scale(1.08);opacity:1}}
.au-ic img,.au-ic svg{position:relative;width:74%;height:74%;object-fit:contain;animation:au-icB 2.6s ease-in-out infinite}
@keyframes au-icB{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) scale(1.05)}}
.au-tw{position:absolute;width:10px;height:10px;background:radial-gradient(circle,#fff 0 22%,rgba(255,240,170,.95) 30%,transparent 65%);clip-path:polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%);animation:au-twk 1.6s ease-in-out infinite}
.au-rp{display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-radius:6px;color:#16110d;white-space:nowrap}
.au-ex{display:inline-block;font-size:9.5px;font-weight:900;letter-spacing:.5px;line-height:14px;padding:0 6px;border-radius:999px;border:1px dashed #8cc8ff;background:rgba(14,10,7,.75);color:#cfe7ff;white-space:nowrap}
.au-nm{font-size:13.5px;font-weight:900;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.au-sub{font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.au-stars{font-size:14px;letter-spacing:1px;line-height:1;white-space:nowrap}
.au-pw{font-size:11px;font-weight:900;color:#e8dccb}
.au-pw b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:13px;color:#fff}
.au-price{display:flex;align-items:center;gap:4px;margin-top:2px;font-family:'Lilita One',Nunito,sans-serif;font-size:17px;color:#ffe07a;line-height:1}
.au-tl{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:900;color:#c9b9a2}
.au-cspin{display:inline-flex;flex:none;animation:au-cspinK 2.4s linear infinite}
@keyframes au-cspinK{0%{transform:scaleX(1)}50%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
.au-row{min-height:58px;flex:none;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:8px;padding:6px 8px;border-radius:14px;background:#1d1611;border:1px dashed #4a3a2b;box-sizing:border-box}
.au-row .au-ic{width:46px;height:46px}
.au-st{font-size:11px;font-weight:900;line-height:16px;padding:0 6px;border-radius:6px;white-space:nowrap;display:inline-block;background:#4a3a2b;color:#fff}
.au-box{flex:none;padding:10px;border-radius:14px;background:#1d1611;border:1px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;box-sizing:border-box}
.au-lbl{font-size:12px;font-weight:900;color:#c9b9a2}
.au-step{display:flex;align-items:center;gap:6px}
.au-step input{flex:1;min-width:0;height:48px;border-radius:12px;border:2px solid #4a3a2b;background:#0e0a07;color:#c9b9a2;font-family:'Lilita One',Nunito,sans-serif;font-size:22px;text-align:center;padding:0 6px;box-sizing:border-box}
.au-seg{display:flex;gap:4px}
.au-seg button{flex:1;min-width:0;min-height:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2!important;font-weight:900;font-size:13px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 6px;box-sizing:border-box}
.au-sum{display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:800;line-height:1.3}
.au-sum b{font-weight:900;white-space:nowrap}
.au-rl{display:flex;align-items:flex-start;gap:6px;font-size:12.5px;font-weight:800;color:#e8dccb;line-height:1.3}
.au-rl svg{flex:none;margin-top:1px}
.au-gold{width:100%;min-height:56px;border:0;border-radius:16px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;font-family:'Lilita One',Nunito,sans-serif!important;font-size:20px;box-shadow:0 6px 0 #8a4f0c;display:flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;padding:0 8px;box-sizing:border-box}
.au-gold::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);background-size:300% 100%;animation:au-shn 2.6s ease-in-out infinite}
.au-gold[disabled]{filter:grayscale(.9) brightness(.65)}
.au-gold[disabled]::after{display:none}
.au-note{font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3}
.au-empty{flex:none;display:flex;align-items:center;justify-content:center;min-height:96px;border-radius:14px;border:2px dashed #4a3a2b;font-size:13px;font-weight:900;color:#c9b9a2;text-align:center;padding:12px;line-height:1.3;box-sizing:border-box}
.au-dis{display:flex;min-width:0;opacity:.6;filter:grayscale(.6)}
.au-dis.au-keep{opacity:1;filter:none}
.au-dis button[disabled],.au-dis input[disabled]{cursor:default;pointer-events:none;transform:none}
.au-sheetbg{position:absolute;inset:0;z-index:50;background:rgba(8,5,3,.72);display:flex;align-items:flex-end;justify-content:center}
.au-sheet{position:relative;width:100%;max-width:560px;max-height:92%;border-radius:22px 22px 0 0;background:linear-gradient(180deg,#2c2017,#16110d);border:2px solid #ffc94a;border-bottom:0;padding:12px 14px 16px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box}
.au-shin{animation:au-fadeIn .25s both}
.au-shin .au-sheet{animation:au-sheetUp .35s cubic-bezier(.2,1.2,.4,1) both}
.au-shin .au-rl{animation:au-inR .35s ease-out both}
@keyframes au-fadeIn{from{opacity:0}to{opacity:1}}
@keyframes au-sheetUp{from{transform:translateY(100%)}to{transform:none}}
.au-chips{display:flex;flex-wrap:wrap;gap:5px}
.au-chip{min-height:44px;min-width:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2!important;font-weight:900;font-size:13px;padding:0 10px;box-sizing:border-box}
.au-chip.sel{border-color:var(--cc,#ffc94a);color:var(--cc,#ffc94a)!important;background:#3a2c1f}
.au-toast{position:absolute;left:0;right:0;top:66px;z-index:60;display:flex;justify-content:center;pointer-events:none;animation:au-toastK 2.4s ease both}
.au-toast span{max-width:92%;padding:10px 14px;border-radius:14px;background:#0e0a07;border:2px solid #4aa3ff;font-size:13px;font-weight:900;text-align:center;box-sizing:border-box}
@keyframes au-toastK{0%{opacity:0;transform:translateY(-10px)}12%,82%{opacity:1;transform:none}100%{opacity:0}}
`; document.head.appendChild(st); })();

/* ---------- peças ---------- */
const AU_X='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"></path></svg>';
const AU_CLOCK='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7 V12 L15 14"></path></svg>';
const AU_WIFI='<svg class="au-sig" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8cc8ff" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M2 9 C8 3 16 3 22 9"></path><path d="M5 12.5 C9 8.5 15 8.5 19 12.5"></path><path d="M8.5 16 C10.5 14 13.5 14 15.5 16"></path><circle cx="12" cy="19.5" r="1.4" fill="#8cc8ff"></circle></svg>';
const AU_EXTAG='<span class="au-ex">EXEMPLO</span>';
const auCoin=px=>`<span class="au-cspin" aria-hidden="true">${COIN_I(px)}</span>`;
const auSlotSvg=(s,col,fill)=>{ const a=AU_SL[s]; return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${a?a.p1:AU_ALL}" fill="${fill||'none'}" stroke="${col||'currentColor'}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"></path>${a?`<path d="${a.p2}" fill="none" stroke="${col||'currentColor'}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"></path>`:''}</svg>`; };
const auRar=r=>Math.max(0,Math.min(4,r|0));
const auVars=r=>`--rc:${RC[r]};--rg:${AU_RG[r]};--rb:${AU_RB[r]}`;
/* botão desabilitado: o toque cai no invólucro (data-x="soon") e só repete o aviso */
const auOff=(inner,sty,keep)=>`<span class="au-dis ${keep?'au-keep':''}" data-x="soon" style="${sty||''}">${inner}</span>`;
const auIcBox=(img,tw)=>`<span class="au-ic" aria-hidden="true"><span class="au-glow"></span>${img}${tw?'<span class="au-tw" style="left:8%;top:10%"></span><span class="au-tw" style="right:8%;bottom:14%;animation-delay:.8s"></span>':''}</span>`;
const auImg=(slot,e)=>{ const u=auIcon(slot,e); return u?`<img src="${esc2(u)}" alt="">`:auSlotSvg(slot,'#f6ecdf'); };

function auToastHtml(msg){ return `<div class="au-toast" role="status"><span>${esc2(msg)}</span></div>`; }
function auSay(msg){ XA.toast=msg; XA.toastT=Date.now(); const el=document.getElementById('au_toast'); if(el) el.innerHTML=auToastHtml(msg); }

/* cartões de EXEMPLO da aba Comprar: só desenho (espaço, era e raridade vêm dos filtros); não são lotes e não têm vendedor, preço nem prazo */
function auExamples(n){ const sl=auSlots(), ne=Math.max(1,Math.min(7,auEras().length||1)), out=[];
  for(let j=0;j<n;j++) out.push({slot:XA.slot>=0&&sl[XA.slot]?sl[XA.slot]:sl[j%sl.length], e:XA.era>=0?XA.era:j%ne, r:XA.rar>=0?auRar(XA.rar):AU_EXR[j%AU_EXR.length]});
  return out; }
const auCols=d=>d.Wb>=600?3:2;

/* ---------- aba Comprar ---------- */
function auPageBuy(d){
  const sl=auSlots(), eras=auEras(), wide=d.Wb>=430, sm=auStarMax();
  const chip=(k,label,svg,aria)=>{ const on=XA.slot===k; return `<button class="au-sl ${on?'sel':''}" data-x="slot" data-k="${k}" aria-pressed="${on}" aria-label="Espaço: ${esc2(aria)}">${svg(on)}<span>${esc2(label)}</span></button>`; };
  const chips=chip(-1,'Todos',on=>auSlotSvg('', 'currentColor',on?'rgba(255,201,74,.25)':'none'),'todos')
    +sl.map((s,i)=>chip(i,AU_SL[s].n,on=>auSlotSvg(s,'currentColor',on?'rgba(255,201,74,.25)':'none'),auSlotN(s))).join('');
  const parts=[]; if(XA.era>=0) parts.push(auEraN(XA.era)); if(XA.rar>=0) parts.push(auRarN(XA.rar)); if(sm&&XA.star>0) parts.push(XA.star+(XA.star===1?' estrela':' estrelas')+' ou mais');
  const cards=auExamples(auCols(d)*2).map((x,j)=>{ const nm=auName(x), r=x.r;
    return `<button class="au-card ${r>=2?'hi':''}" data-x="det" data-i="${j}" aria-label="Cartão de exemplo: ${esc2(nm)}, ${esc2(auRarN(r))}. Sem vendedor, preço nem prazo: abre com o online" style="${auVars(r)};animation-delay:${(j*0.06).toFixed(2)}s,${(0.4+j*0.06).toFixed(2)}s">
      <span class="au-ictop">${auIcBox(auImg(x.slot,x.e),r>=3)}
        <span style="min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px"><span class="au-rp" style="background:${RC[r]}">${esc2(auRarN(r))}</span>${AU_EXTAG}</span></span>
      <span class="au-nm au-ol">${esc2(nm)}</span>
      <span class="au-sub">${esc2(AU_SL[x.slot].n)} · ${esc2(auEraN(x.e))}</span>
      <span class="au-price">${auCoin(20)}<span aria-label="preço a definir com o online">—</span></span>
      <span class="au-tl">${AU_CLOCK}<span aria-label="prazo a definir com o online">—</span></span></button>`; }).join('');
  return `<div class="au-slots" role="group" aria-label="Filtrar por espaço" style="grid-template-columns:repeat(${wide?8:4},minmax(0,1fr))">${chips}</div>
    <div style="flex:none;display:flex;gap:6px;align-items:center">
      <button class="au-ghost" data-x="filt" aria-label="Abrir filtros. ${parts.length?'Ativos: '+esc2(parts.join(', ')):'Nenhum filtro ativo'}" style="flex:1;min-width:0;justify-content:flex-start">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" style="flex:none"><path d="M3 6 H21 M6 12 H18 M10 18 H14"></path></svg>
        <span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${parts.length?esc2(parts.join(' · ')):(sm?'Era, raridade, estrelas':'Era e raridade')}</span>
        ${parts.length?`<span class="au-fcount">${parts.length}</span>`:''}</button>
      <button class="au-ghost" data-x="sort" aria-label="Ordenar: ${XA.sort===0?'acaba antes':'menor preço'}. Toque para trocar" style="flex:none">${XA.sort===0?'Acaba antes':'Menor preço'}</button></div>
    <span class="au-note" style="flex:none">Cartões de exemplo, só para mostrar o desenho. Os lotes de verdade aparecem quando o leilão online abrir.</span>
    <div class="au-grid" style="grid-template-columns:repeat(${auCols(d)},minmax(0,1fr))">${cards}</div>`;
}

/* ---------- aba Vender: a mochila é REAL (S.inv), mas nada pode ser anunciado ---------- */
function auPageSell(d){
  const bag=auBag(), per=auCols(d)*2, pages=Math.max(1,Math.ceil(bag.length/per)); XA.page=Math.max(0,Math.min(pages-1,XA.page|0));
  const cards=bag.slice(XA.page*per,XA.page*per+per).map((it,j)=>{ const r=auRar(it.r), nm=auName(it), st=auStarsOf(it), sm=auStarMax(), use=auInUse(it), lv=it.lvl||1;
    return auOff(`<button class="au-card ${r>=2?'hi':''}" disabled aria-disabled="true" data-act="1" aria-label="${esc2(nm)}, ${esc2(auRarN(r))}, nível ${n0(lv)}. Anunciar: abre com o online" style="flex:1;${auVars(r)};animation-delay:${(j*0.06).toFixed(2)}s,${(0.4+j*0.06).toFixed(2)}s">
      <span class="au-ictop">${auIcBox(auImg(it.slot,auEraOf(it)),false)}
        <span style="min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px"><span class="au-rp" style="background:${RC[r]}">${esc2(auRarN(r))}</span>
          ${st?`<span class="au-stars" aria-hidden="true"><span style="color:#ffc94a">${'<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"></path></svg>'.repeat(st)}</span><span style="color:#4a3a2b">${'<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21l1.4-7L2 9.3l7-.8z"></path></svg>'.repeat(Math.max(0,sm-st))}</span></span>`:''}
          ${use?'<span class="au-st">Em uso</span>':''}</span></span>
      <span class="au-nm au-ol">${esc2(nm)}</span>
      <span class="au-sub">${esc2(AU_SL[it.slot].n)} · ${esc2(auEraN(auEraOf(it)))}</span>
      <span class="au-pw">Nv. <b>${n0(lv)}</b></span></button>`,'',true); }).join('');
  const seg=(label,inner)=>`<div class="au-seg" role="group" aria-label="${label}">${inner}</div>`;
  const sb=(t,aria)=>`<button disabled aria-disabled="true" data-act="1" aria-pressed="false" aria-label="${aria}">${t}</button>`;
  return `<div style="flex:none;display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap">
      <span class="lil au-ol" style="font-size:19px">1. Escolha o item</span><span class="au-note">Pets, skins e VIP não entram</span></div>
    ${bag.length?`<div class="au-grid" style="grid-template-columns:repeat(${auCols(d)},minmax(0,1fr))">${cards}</div>
      ${pages>1?xPager('mypg',XA.page,pages,n0(bag.length)+' na mochila','Itens anteriores','Próximos itens'):`<span class="au-note" style="flex:none;text-align:center">${n0(bag.length)} na mochila</span>`}`
      :'<div class="au-empty">Sua mochila está vazia. Os itens que você ganhar aparecem aqui.</div>'}
    ${auOff(`<div class="au-box au-up" style="flex:1;min-width:0">
      <span class="au-lbl">2. Preço</span>
      <span class="au-note" style="display:flex;align-items:center;gap:5px">${COIN_I(18)} Preço fixo em ouro: você define, quem comprar paga esse valor (sem lances)</span>
      <div class="au-step">
        <button class="au-ghost" disabled aria-disabled="true" data-act="1" aria-label="Diminuir preço: abre com o online" style="width:48px;height:48px;padding:0;font-size:24px">−</button>
        <input type="text" value="—" disabled aria-disabled="true" readonly aria-label="Preço de venda: abre com o online">
        <button class="au-ghost" disabled aria-disabled="true" data-act="1" aria-label="Aumentar preço: abre com o online" style="width:48px;height:48px;padding:0;font-size:24px">+</button></div>
      <span class="au-note" style="font-size:11px">Nunca diamante nem dinheiro real. Faixa de preço: a definir com o online.</span>
      <span class="au-lbl">3. Duração</span>
      ${seg('Duração do anúncio',sb('a definir com o online','Duração do anúncio: a definir com o online'))}</div>`)}
    <div class="au-box au-up" style="animation-delay:.05s;border-color:#5a4630">
      <div class="au-sum"><span>Comprador paga</span><b style="color:#c9b9a2">—</b></div>
      <div class="au-sum"><span>Taxa do leilão</span><b style="color:#c9b9a2">a definir com o online</b></div>
      <div class="au-sum" style="border-top:1px solid #4a3a2b;padding-top:6px"><span>Você recebe</span><b class="lil" style="font-size:18px;font-weight:400;color:#c9b9a2">—</b></div></div>
    <div class="au-box au-up" style="animation-delay:.1s;gap:6px">
      <span class="au-rl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 12 H20 M14 6 L20 12 L14 18"></path></svg>Ao anunciar, o item sai da sua coleção (fica em leilão).</span>
      <span class="au-rl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M20 12 H4 M10 6 L4 12 L10 18"></path></svg>Se não vender no prazo, volta para a coleção como estava.</span>
      <span class="au-rl"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff8a7a" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 4 V20 M6 14 L12 20 L18 14"></path></svg>Vendido, o item vai para o comprador no nível inicial.</span></div>`;
}

/* linha de exemplo das listas (Meus anúncios e Histórico): silhueta, sem nome de item, sem valor */
function auRowEx(slot,title,right,dl){ return `<div class="au-row au-r" style="animation-delay:${dl};--rc:#4a3a2b;--rg:rgba(232,226,216,.2)">
    <span class="au-ic" aria-hidden="true">${auSlotSvg(slot,'#8a7a66')}</span>
    <span style="min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:3px">
      <span class="au-nm" style="max-width:100%">${esc2(title)}</span>${AU_EXTAG}
      <span class="au-tl">${AU_CLOCK}<span>—</span></span></span>
    <span style="display:flex;flex-direction:column;align-items:flex-end;gap:4px"><span class="lil" style="font-size:15px;color:#c9b9a2;white-space:nowrap">—</span>${right||''}</span></div>`; }

function auPageMine(){
  return `<span class="au-note" style="flex:none">Limite de anúncios por dia: a definir com o online. Cancelar devolve o item para a coleção.</span>
    <div class="au-empty">Você não tem anúncios. Eles aparecem aqui quando o leilão online abrir.</div>
    ${auRowEx('weapon','Seu anúncio',auOff('<button class="au-ghost" disabled aria-disabled="true" data-act="1" aria-label="Cancelar anúncio: abre com o online">Cancelar</button>'),'0s')}
    <span class="au-note" style="flex:none;text-align:center">A linha acima é só um exemplo do desenho: não é um anúncio seu.</span>`;
}
function auPageHist(){
  return `<div class="au-empty">Sem histórico. Suas compras e vendas aparecem aqui quando o leilão online abrir.</div>
    ${auRowEx('armor','Venda','','0s')}${auRowEx('necklace','Compra','','.06s')}
    <span class="au-note" style="flex:none;text-align:center">As linhas acima são só exemplos do desenho. No online, o histórico vem do servidor.</span>`;
}

/* ---------- folhas: filtros, detalhe do cartão de exemplo, regras ---------- */
function auSheet(d){
  const s=XA.sheet; if(!s) return '';
  const wrap=(label,inner,bc)=>`<div class="au-sheetbg ${XA.shAnim?'au-shin':''}"><button data-x="shx" aria-label="Fechar" style="position:absolute;inset:0;border:0;padding:0;background:transparent"></button>
    <div class="au-sheet x-scroll" role="dialog" aria-modal="true" aria-label="${label}" style="${bc?'border-color:'+bc:''}">${inner}</div></div>`;
  const xb=lb=>`<button class="au-ghost" data-x="shx" aria-label="${lb}" style="padding:0;width:44px;flex:none">${AU_X}</button>`;
  if(s==='filt'){ const eras=auEras(), sm=auStarMax();
    const ch=(x,v,label,on,cc,aria)=>`<button class="au-chip ${on?'sel':''}" data-x="${x}" data-v="${v}" aria-pressed="${on}" ${aria?'aria-label="'+esc2(aria)+'"':''} style="${cc?'--cc:'+cc:''}">${esc2(label)}</button>`;
    let st=''; for(let n=0;n<=sm;n++) st+=ch('fstar',n,n===0?'Todas':String(n),XA.star===n,'',n===0?'Qualquer estrela':n+' estrelas ou mais');
    return wrap('Filtros',`<div style="display:flex;align-items:center;gap:8px"><span class="lil au-ol" style="flex:1;font-size:22px">Filtros</span>${xb('Fechar filtros')}</div>
      <span class="au-lbl">Era</span>
      <div class="au-chips">${ch('fera',-1,'Todas',XA.era<0)}${eras.map((n,i)=>ch('fera',i,n,XA.era===i)).join('')}</div>
      <span class="au-lbl">Raridade</span>
      <div class="au-chips">${ch('frar',-1,'Todas',XA.rar<0,'#ffc94a')}${RC.map((c,i)=>ch('frar',i,auRarN(i),XA.rar===i,c)).join('')}</div>
      ${sm?`<span class="au-lbl">Estrelas de qualidade (mínimo)</span><div class="au-chips">${st}</div>`:''}
      <div style="display:flex;gap:8px;padding-bottom:6px">
        <button class="au-ghost" data-x="fclr" style="flex:1;min-height:52px">Limpar</button>
        <button class="au-gold" data-x="shx" style="flex:1.4;min-height:52px"><span style="position:relative;z-index:1">Ver exemplos</span></button></div>`); }
  if(s==='det'){ const x=auExamples(auCols(d)*2)[XA.det]; if(!x) return ''; const r=x.r, nm=auName(x);
    return wrap('Detalhe do cartão de exemplo',`<div style="display:flex;align-items:center;gap:8px;${auVars(r)}">
        ${auIcBox(auImg(x.slot,x.e),r>=3)}
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-start;gap:2px">
          <span class="lil au-ol" style="font-size:20px;line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis">${esc2(nm)}</span>
          <span class="au-sub" style="max-width:100%"><span style="color:${RC[r]}">${esc2(auRarN(r))}</span> · ${esc2(AU_SL[x.slot].n)} · ${esc2(auEraN(x.e))}</span>${AU_EXTAG}</span>
        ${xb('Fechar')}</div>
      <div class="au-box" style="gap:5px">
        <div class="au-sum"><span>Vendedor</span><b style="color:#c9b9a2">—</b></div>
        <div class="au-sum"><span>Termina em</span><b style="color:#c9b9a2">—</b></div>
        <div class="au-sum"><span>Preço</span><b class="lil" style="font-size:18px;font-weight:400;color:#c9b9a2">—</b></div></div>
      <span class="au-note">Este é um cartão de exemplo: não existe lote, vendedor nem preço. A compra só vale quando o leilão online abrir.</span>
      ${auOff('<button class="au-gold" disabled aria-disabled="true" data-act="1" aria-label="Comprar: abre com o online"><span style="position:relative;z-index:1">Comprar · abre com o online</span></button>','padding-bottom:6px',true)}`,RC[r]); }
  if(s==='rules'){ const rules=[
      ...((()=>{ try{ if(window.Sys&&Sys.auction&&Sys.auction.rulesText) return Sys.auction.rulesText().map((t,i)=>[t,i===0?'#5fd068':'#ffc94a']); }catch(e){} return [['Preço fixo, só em ouro. Nunca diamante nem dinheiro real.','#5fd068']]; })()),
      ['Preço FIXO: quem anuncia define o valor; não há lances.','#5fd068'],
      ...((window.Sys&&Sys.auction&&Sys.auction.rulesText)?[]:[['Ao anunciar, o item sai da sua coleção. Se não vender no prazo, volta.','#ffc94a'],['Item vendido vai para o comprador no nível inicial.','#ffc94a'],['Pets, skins e VIP não entram no leilão.','#ff8a7a']]),   // sem o módulo: as regras antigas
      ['Precisa do servidor: abre junto com o online.','#8cc8ff']];
    return wrap('Regras do leilão',`<div style="display:flex;align-items:center;gap:8px"><span class="lil au-ol" style="flex:1;font-size:22px">Regras do leilão</span>${xb('Fechar regras')}</div>
      ${rules.map((r,i)=>`<span class="au-rl" style="animation-delay:${(i*0.05).toFixed(2)}s"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${r[1]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg>${esc2(r[0])}</span>`).join('')}
      <div style="padding-bottom:6px"><button class="au-gold" data-x="shx"><span style="position:relative;z-index:1">Entendi</span></button></div>`); }
  return '';
}

function scrAuction(){
  const d=xDims(440);                                   /* layout novo: tamanho real; o miolo rola, o aviso e as abas ficam em cima e o rodapé colado embaixo */
  const old=document.getElementById('au_sc'); let top=0; if(old&&XA.keep) top=+old.scrollTop||0;
  if(!(XA.tab>=0&&XA.tab<AU_TABS.length)) XA.tab=0;
  const small=d.Wb<360;
  const tabs=AU_TABS.map((t,i)=>{ const on=XA.tab===i; return `<button class="au-tab ${on?'sel':''}" role="tab" aria-selected="${on}" data-x="tab" data-i="${i}" style="font-size:${small?12:d.Wb<420?13.5:16}px">${t}</button>`; }).join('');
  const body=XA.tab===0?auPageBuy(d):XA.tab===1?auPageSell(d):XA.tab===2?auPageMine():auPageHist();
  const foot=XA.tab===1
    ?auOff('<button class="au-gold" disabled aria-disabled="true" data-act="1" aria-label="Anunciar: abre com o online"><span style="position:relative;z-index:1">Anunciar · abre com o online</span></button>','flex:1;padding-bottom:6px',true)
    :`<div style="flex:1;min-width:0;min-height:48px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2px 14px;padding:4px 8px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;font-weight:900;font-size:14px;box-sizing:border-box">
        <span style="display:flex;align-items:center;gap:5px" aria-label="Seu ouro">${auCoin(22)}<span id="au_gold">${auGold()}</span></span>
        <span style="font-size:11px;color:#c9b9a2">sem diamante · sem dinheiro real</span></div>`;
  V.innerHTML=xWrap(d,XA.anim?'au-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;background:radial-gradient(ellipse at 50% 14%,#1f3048 0%,#1d1611 45%,#16110d 80%)">
    <div style="flex:none;display:flex;flex-direction:column;gap:7px;padding:8px 12px 0">
      <div class="au-soon" role="note">${AU_WIFI}
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px;line-height:1.15;position:relative;z-index:1">
          <span class="au-ol" style="font-size:${small?13:15}px;font-weight:900">${AU_SOON}</span>
          <span style="font-size:11px;font-weight:800;color:#cfe7ff">Demonstração: compras e vendas só valem quando o leilão online abrir.</span></span>
        <button class="au-ghost" data-x="rules" style="position:relative;z-index:1;flex:none">Regras</button></div>
      <div class="au-tabs" role="tablist" aria-label="Seções do leilão">${tabs}</div></div>
    <div id="au_sc" class="x-scroll ${XA.cards?'au-new':''}" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:7px;padding:7px 12px 8px;box-sizing:border-box">${body}</div>
    <div style="flex:none;display:flex;padding:8px 12px 12px;box-sizing:border-box">${foot}</div>
    ${auSheet(d)}
    <div id="au_toast">${XA.toast&&Date.now()-XA.toastT<1800?auToastHtml(XA.toast):''}</div></div>`);
  if(top){ const nw=document.getElementById('au_sc'); if(nw) nw.scrollTop=top; }
  XA.anim=false; XA.cards=false; XA.keep=true; XA.shAnim=false;
}

/* todo toque só muda o estado de tela (XA); nada é escrito no save e nada é gravado */
function auClick(b,ev){
  const a=b.dataset.x;
  if(a==='soon'){ snd('ui_tap'); auSay(AU_SOON); return; }           /* botão desabilitado: só repete o aviso */
  if(XA.sheet){                                                       /* com folha aberta, só valem os botões dela */
    if(a==='shx'){ snd('ui_tap'); XA.sheet=''; XA.det=-1; render(); }
    else if(XA.sheet==='filt'&&(a==='fera'||a==='frar'||a==='fstar')){ const v=parseInt(b.dataset.v,10); if(isNaN(v)) return; snd('ui_tap');
      if(a==='fera') XA.era=Math.max(-1,Math.min(auEras().length-1,v)); else if(a==='frar') XA.rar=Math.max(-1,Math.min(4,v)); else XA.star=Math.max(0,Math.min(auStarMax(),v));
      render(); }
    else if(XA.sheet==='filt'&&a==='fclr'){ snd('ui_tap'); XA.era=-1; XA.rar=-1; XA.star=0; render(); }
    return; }
  if(a==='tab'){ const i=Math.max(0,Math.min(AU_TABS.length-1,+b.dataset.i|0)); if(i===XA.tab) return; snd('ui_tap'); XA.tab=i; XA.cards=true; XA.keep=false; render(); }
  else if(a==='slot'){ const k=Math.max(-1,Math.min(auSlots().length-1,parseInt(b.dataset.k,10))); if(isNaN(k)||k===XA.slot) return; snd('ui_tap'); XA.slot=k; XA.cards=true; render(); }
  else if(a==='sort'){ snd('ui_tap'); XA.sort=XA.sort?0:1; render(); }
  else if(a==='filt'||a==='rules'){ snd('ui_tap'); XA.sheet=a; XA.shAnim=true; render(); }
  else if(a==='det'){ const i=+b.dataset.i|0; snd('ui_tap'); XA.det=Math.max(0,i); XA.sheet='det'; XA.shAnim=true; render(); }
  else if(a==='mypg'){ const dd=+b.dataset.d||0; if(!dd) return; snd('ui_tap'); XA.page=Math.max(0,(XA.page|0)+(dd<0?-1:1)); XA.cards=true; render(); }
}

Panels.add('auction',{title:'Leilão',render:scrAuction,click:auClick,
  /* só o ouro do jogador muda por fora (a batalha continua): atualiza o texto, sem redesenhar */
  tick(){ const el=document.getElementById('au_gold'); if(el&&auOn()){ const t=auGold(); if(el.textContent!==t) el.textContent=t; } },
  busy(){ return false; },                              /* nenhuma animação que um redesenho de fora possa quebrar; não há operação em curso */
  onOpen(o){ XA.anim=true; XA.cards=true; XA.keep=false; XA.sheet=''; XA.det=-1; XA.shAnim=false; XA.toast=''; XA.page=0;
    XA.tab=o&&(o.tab==='sell'||o.tab===1)?1:o&&(o.tab==='mine'||o.tab===2)?2:o&&(o.tab==='hist'||o.tab===3)?3:0; },
  onClose(){ XA.sheet=''; XA.det=-1; XA.toast=''; } });
