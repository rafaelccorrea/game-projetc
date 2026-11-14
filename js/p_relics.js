'use strict';
/* ================= TELA RELÍQUIAS DAS ERAS (docs/LIGACOES_LOM_A.md, seção 1) — NASCE DESLIGADA (PANEL_ON.relics = false) =================
   VISUAL: mock B aprovado pelo dono (docs/proto/v2/a/mocks/rel_b.jpg): cenário claro da era, placa de madeira com o bônus total, grade 3 x 3 de
   cartões com moldura dourada sobre pedestal de pedra (nome em cima, relíquia no meio, nível e barra de fragmentos no pedestal), cartão cinza com
   cadeado para o que ainda não nasceu e botão dourado "Subir" / "Despertar" embaixo do cartão que já pode. A folha de detalhe continua igual.
   NENHUMA regra e NENHUM número aqui. Tudo vem do js/sys/relics.js (Sys.relics):
   - tudo o que a tela mostra: Sys.relics.view(S, host) → {owned, total, bonusText, loose, sources, slots:[{era, eraName, id, name, desc, owned, lv, max,
     frags, cost, canLevel, canUnlock, unlockFrags, passiveText, nextText, locked}]};
   - Subir: Sys.relics.levelUp(S, id, host) · Despertar: Sys.relics.unlock(S, id, host). UMA chamada por confirmação; a recusa do módulo vira o aviso.
   Subir e Despertar gastam fragmentos: pedem DOIS toques (o 1º arma, o 2º confirma), sempre dentro da folha. O botão embaixo do cartão só abre a folha.
   RELÍQUIA NUNCA É VENDIDA: a tela não tem preço, botão de compra, sorteio nem pressa. O que falta mostra "Como conseguir" (texto do módulo).
   ATENÇÃO: com o sistema desligado a tela NÃO chama o view (o view do módulo prepara o save): mostra o aviso e o Voltar, sem escrever nada.
   Chaves: PANEL_ON.relics (esta tela) e Sys.relics.DATA.on (o sistema). O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='relics';

/* ---------- ARTE DAS 9 RELÍQUIAS: UMA função (iconOf). A Arte entregou assets/icons/relics/r0.png ... r8.png (256 x 256, fundo transparente), na
   ORDEM DAS ERAS: a relíquia é achada pela ERA dela (campo era do módulo) → r<era>.png (rArt). A que não nasceu = a mesma imagem em silhueta preta
   com o cadeado por cima; era trancada = só o cadeado (não mostra a relíquia).
   RESERVA: o desenho por código (símbolo na cor da era) vem junto, escondido, e aparece sozinho se a imagem falhar (onerror → classe rl-e).
   RL_ART_ON=false volta tudo para o desenho por código. Moldura dourada, pedestal de pedra e placa de madeira são CSS (bloco de estilo abaixo). ---------- */
const RL_ART_ON=true, RL_ART_DIR='assets/icons/relics/';
const rArt=r=>RL_ART_DIR+'r'+Math.max(0,Math.min(8,r.era|0))+'.png';
const RL_ERA=['#a8794a','#e0b040','#d64a4a','#2fa7a0','#8a8f9c','#3f8cff','#22c7d8','#9b3fd9','#f0d860'];   /* cor de cada era (igual à do Grimório) */
const RL_GLY={
  flintAxe:'<path d="M11 31L25 13"/><path d="M21 8c6 0 10 4 10 10l-7-1-4-4z"/>',
  scarab:'<ellipse cx="20" cy="22" rx="7" ry="9"/><path d="M20 13v18M13 20H7M33 20h-6M14 27l-5 4M26 27l5 4M16 12l-3-4M24 12l3-4"/>',
  knightHelm:'<path d="M9 30V19a11 11 0 0122 0v11z"/><path d="M9 21h22M20 21v9M15 25v2M25 25v2"/>',
  compass:'<circle cx="20" cy="20" r="12"/><path d="M25 15l-3 7-7 3 3-7z"/>',
  brassGear:'<circle cx="20" cy="20" r="4"/><circle cx="20" cy="20" r="9"/><path d="M20 7v4M20 29v4M7 20h4M29 20h4M11 11l3 3M26 26l3 3M11 29l3-3M26 14l3-3"/>',
  fieldRadio:'<rect x="8" y="15" width="24" height="16" rx="3"/><path d="M27 15L18 6"/><circle cx="15" cy="23" r="3.5"/><path d="M23 21h5M23 25h5"/>',
  plasmaCore:'<path d="M20 6l10 8v12l-10 8-10-8V14z"/><circle cx="20" cy="20" r="4"/><path d="M20 6v10M20 24v10"/>',
  ferryLantern:'<path d="M14 14h12l2 15H12z"/><path d="M16 14c0-6 8-6 8 0M20 5v3M11 31h18"/><path d="M20 19c2 2 2 5 0 6-2-1-2-4 0-6z"/>',
  judgeFeather:'<path d="M10 32C12 18 20 9 31 7c0 11-7 19-19 21"/><path d="M12 28L26 13"/>'};
const rlDark=(c,k)=>{ const v=parseInt(c.slice(1),16), f=x=>Math.round(x*(1-k)).toString(16).padStart(2,'0'); return '#'+f(v>>16)+f((v>>8)&255)+f(v&255); };
const rlLite=(c,k)=>{ const v=parseInt(c.slice(1),16), f=x=>Math.round(x+(255-x)*k).toString(16).padStart(2,'0'); return '#'+f(v>>16)+f((v>>8)&255)+f(v&255); };
/* cadeado de metal (o do mock): pequeno por cima da silhueta, grande sozinho na era trancada */
const RL_PAD='<path d="M16 21v-4a4 4 0 018 0v4" fill="none" stroke="#2a2826" stroke-width="5" stroke-linecap="round"/><path d="M16 21v-4a4 4 0 018 0v4" fill="none" stroke="#cfcac0" stroke-width="2.4" stroke-linecap="round"/>'
  +'<rect x="12.5" y="20" width="15" height="12" rx="2.5" fill="#b9b3a8" stroke="#2a2826" stroke-width="1.6"/><circle cx="20" cy="25" r="1.9" fill="#2a2826"/><path d="M20 25v3.4" stroke="#2a2826" stroke-width="1.8" stroke-linecap="round"/>';
/* iconOf(id, state): state '' = a relíquia · 'sil' = silhueta (ainda não nasceu) · 'lock' = era não liberada (cadeado) */
function iconOf(id,state){ let r=null; try{ r=rM().relic(id); }catch(e){}
  const era=r?Math.max(0,Math.min(RL_ERA.length-1,r.era|0)):0, c=RL_ERA[era];
  const gly=Object.prototype.hasOwnProperty.call(RL_GLY,id)?RL_GLY[id]:'<circle cx="20" cy="20" r="6"/>';
  const G=(col,w)=>'<g fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round">'+gly+'</g>';
  const art=RL_ART_ON&&r&&state!=='lock', o='<svg'+(art?' class="fb"':'')+' viewBox="0 0 40 40" aria-hidden="true">';
  if(state==='lock') return o+'<g transform="translate(-8 -11) scale(1.4)">'+RL_PAD+'</g></svg>';
  const pad='<g transform="translate(4 6) scale(.8)">'+RL_PAD+'</g>';
  const fb=state?o+G('#0b0908',5.4)+pad+'</svg>':o+G(rlDark(c,0.78),5.6)+G(rlLite(c,0.45),2.6)+'</svg>';
  if(!art) return fb;
  return '<img src="'+esc2(rArt(r))+'" alt=""'+(state?' class="sil"':'')+' onerror="this.parentNode.classList.add(\'rl-e\')">'+fb+(state?'<svg class="pd" viewBox="0 0 40 40" aria-hidden="true">'+pad+'</svg>':''); }
const rIco=(id,state)=>'<span class="rl-i">'+iconOf(id,state)+'</span>';
const rState=s=>s.owned?'':s.locked?'lock':'sil';

/* ---------- leituras do módulo ISOLADAS ---------- */
const rM=()=>(window.Sys&&Sys.relics)||null;
const rHas=()=>{ const M=rM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.levelUp==='function'&&typeof M.unlock==='function'&&typeof M.relic==='function'); };
const rOk=()=>{ try{ return rHas()&&rM().DATA.on===true; }catch(e){ return false; } };
const rHost=()=>(window.Sys&&Sys.host)||null;
const rSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const rRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
/* o módulo já avisa o jogo (host.onChange grava e redesenha); sem esse gancho, a tela grava */
const rStore=()=>{ try{ const h=rHost(); if(h&&typeof h.onChange==='function') return; if(typeof save==='function') save(); }catch(e){} };
const rNow=()=>Date.now();
const rN=v=>{ try{ return typeof n0==='function'?n0(v):String(Math.round(+v||0)); }catch(e){ return String(Math.round(+v||0)); } };
const rPl=(n,one,many)=>rN(n)+' '+(n===1?one:many);
const rView=()=>{ try{ const v=rM().view(S,rHost()); return v&&Array.isArray(v.slots)?v:null; }catch(e){ return null; } };
const rClamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.rl-root). Paleta do mock B: madeira, ouro, pedra, creme e barra azul ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.rl-root{--rl-ink:#fff3d6;--rl-mut:#e6cfa6;--rl-soft:#f5e6c6;--rl-gold:#f2c14e;--rl-gold1:#ffe07a;--rl-gold2:#f2a826;--rl-goldsh:#9a5a10;--rl-goldink:#2a1403;
  --rl-wood1:#7b4a22;--rl-wood2:#4f2d12;--rl-woodline:#2c1606;--rl-fr1:#f3bb52;--rl-fr2:#8a5220;--rl-fr3:#55300f;--rl-stone1:#6f675d;--rl-stone2:#49433c;
  --rl-lk1:#4b4b50;--rl-lk2:#2a2a2e;--rl-lkline:#141416;--rl-lockink:#e0dcd4;--rl-gem:#4aa8ff;
  --rl-sheet:#44260f;--rl-sheetline:#f2c14e;--rl-card:rgba(0,0,0,.28);--rl-line:rgba(255,236,200,.2);--rl-ok:#8df07a;--rl-ok1:#9cf08f;--rl-ok2:#3fae3c;--rl-okink:#0d2410;--rl-bad:#ffb3a8;
  --rl-bar1:#1a5fbf;--rl-bar2:#2270d2;--rl-barok1:#1f7a33;--rl-barok2:#27893c;--rl-track:#24170d;color:var(--rl-ink)}
.rl-root,.rl-root *{box-sizing:border-box}
.rl-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.rl-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.rl-in{animation:rl-in .25s ease-out both}
@keyframes rl-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes rl-up{from{transform:translateY(30px);opacity:.3}}
.rl-i{position:relative;flex:none;display:block;width:72%;max-width:88px;aspect-ratio:1}
.rl-i svg,.rl-i img{display:block;width:100%;height:100%;object-fit:contain}
.rl-i svg{filter:drop-shadow(0 2px 1px rgba(44,22,6,.55))}
.rl-i img{filter:drop-shadow(0 3px 2px rgba(44,22,6,.5))}
.rl-i img.sil{filter:brightness(0) opacity(.82)}
.rl-i svg.fb{display:none}
.rl-i svg.pd{position:absolute;left:0;top:0}
.rl-i.rl-e img,.rl-i.rl-e svg.pd{display:none}
.rl-i.rl-e svg.fb{display:block}
.rl-top{position:relative;flex:none;margin:10px 16px 0;padding:7px 20px 8px;border-radius:10px;background:linear-gradient(180deg,var(--rl-wood1),var(--rl-wood2));border:3px solid var(--rl-gold);
  box-shadow:0 0 0 2px var(--rl-woodline),0 4px 0 2px rgba(44,22,6,.55),inset 0 2px 0 rgba(255,220,160,.25);text-align:center;min-width:0}
.rl-top::before,.rl-top::after{content:"";position:absolute;top:50%;width:11px;height:11px;margin-top:-6px;border-radius:2px;transform:rotate(45deg);background:var(--rl-gem);border:2px solid var(--rl-gold);box-shadow:0 0 0 1px var(--rl-woodline)}
.rl-top::before{left:-8px}
.rl-top::after{right:-8px}
.rl-top b{display:block;font-size:15px;font-weight:900;line-height:1.3;color:var(--rl-ink);overflow-wrap:anywhere;text-shadow:0 1px 0 var(--rl-woodline)}
.rl-top b em{font-style:normal;color:var(--rl-ok)}
.rl-top b.z{color:var(--rl-mut)}
.rl-top small{display:block;margin-top:1px;font-size:11px;font-weight:900;letter-spacing:.4px;color:var(--rl-mut);overflow-wrap:anywhere}
.rl-msg{flex:none;align-self:center;max-width:calc(100% - 24px);min-height:22px;margin:5px 12px 0;padding:2px 10px;border-radius:10px;font-size:12.5px;font-weight:900;line-height:1.35;text-align:center;color:var(--rl-gold1);overflow-wrap:anywhere}
.rl-msg:not(:empty){background:rgba(34,18,6,.92);border:1px solid var(--rl-line)}
.rl-msg.bad{color:var(--rl-bad)}
.rl-body{position:relative;flex:1;min-height:0;padding:6px 10px 20px}
.rl-none,.rl-note,.rl-src{border-radius:12px;background:linear-gradient(180deg,rgba(84,48,20,.95),rgba(52,28,10,.95));border:2px solid var(--rl-woodline);box-shadow:inset 0 0 0 1px rgba(242,193,78,.45);min-width:0}
.rl-none{padding:9px 12px;margin-bottom:10px}
.rl-none b{display:block;font-size:14px;font-weight:900;color:var(--rl-gold1);line-height:1.25}
.rl-none p{margin:4px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-note{margin:0 0 10px;padding:7px 12px;font-size:12px;font-weight:800;line-height:1.4;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px 8px;align-items:start}
.rl-sl{display:flex;flex-direction:column;gap:6px;min-width:0}
.rl-cd,.xs .rl-cd{display:flex;flex-direction:column;align-items:stretch;width:100%;min-height:150px;padding:0;border:0;border-radius:12px;background:none;box-shadow:none;color:var(--rl-ink);text-align:center;min-width:0}
.rl-fr{flex:1 1 auto;display:flex;flex-direction:column;align-items:center;gap:2px;margin:0 5px;padding:5px 3px 20px;border-radius:12px;border:3px solid var(--rl-gold);min-width:0;
  background:radial-gradient(ellipse at 50% 60%,var(--rl-fr1) 0%,var(--rl-fr2) 48%,var(--rl-fr3) 100%);box-shadow:0 0 0 2px var(--rl-woodline),0 0 10px 2px rgba(255,208,96,.6),inset 0 0 0 1px rgba(255,240,180,.4)}
.rl-cd b{display:flex;align-items:center;justify-content:center;width:100%;min-height:27px;font-size:11.5px;font-weight:900;line-height:1.13;color:var(--rl-ink);overflow-wrap:anywhere;text-shadow:0 1px 0 var(--rl-woodline),0 0 4px var(--rl-woodline)}
.rl-ped{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;margin-top:-16px;padding:4px 7px 7px;border-radius:10px 10px 6px 6px;min-width:0;
  background:linear-gradient(180deg,var(--rl-stone1),var(--rl-stone2));border:2px solid var(--rl-woodline);box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.25),0 3px 0 rgba(30,16,6,.5)}
.rl-ped em{font-style:normal;font-family:'Lilita One',Nunito,sans-serif;font-size:15px;line-height:1.1;color:var(--rl-ink);text-shadow:0 1px 0 #1c1712,0 0 3px #1c1712}
.rl-ped small{font-size:10px;font-weight:900;line-height:1.2;color:var(--rl-ink);overflow-wrap:anywhere}
.rl-ped small.up{color:var(--rl-ok1)}
.rl-cd.no .rl-fr{border-color:#77777d;background:linear-gradient(180deg,var(--rl-lk1),var(--rl-lk2));box-shadow:0 0 0 2px var(--rl-lkline),inset 0 0 0 1px rgba(255,255,255,.12)}
.rl-cd.no .rl-ped{background:linear-gradient(180deg,#3a3a3f,#232327);border-color:var(--rl-lkline);box-shadow:inset 0 2px 0 rgba(255,255,255,.1),0 3px 0 rgba(0,0,0,.45)}
.rl-cd.no b{color:var(--rl-lockink);text-shadow:0 1px 0 var(--rl-lkline)}
.rl-cd.no .rl-ped small{color:var(--rl-lockink)}
.rl-cd.on .rl-fr{border-color:#fff6c8;box-shadow:0 0 0 2px var(--rl-woodline),0 0 14px 5px rgba(255,236,150,.9),inset 0 0 0 1px rgba(255,240,180,.5)}
.rl-cd:active{transform:translateY(2px)}
.rl-bar{display:block;position:relative;width:100%;height:16px;border-radius:5px;background:var(--rl-track);border:1px solid #120a04;overflow:hidden}
.rl-bar u{position:absolute;left:0;top:0;bottom:0;text-decoration:none;background:linear-gradient(180deg,var(--rl-bar2),var(--rl-bar1))}
.rl-bar.ok u{background:linear-gradient(180deg,var(--rl-barok2),var(--rl-barok1))}
.rl-bar s{position:relative;display:block;text-decoration:none;text-align:center;font-size:10.5px;font-weight:900;line-height:14px;color:#fff;text-shadow:0 1px 0 #0a1428;font-variant-numeric:tabular-nums}
.rl-go,.xs .rl-go{min-height:40px;margin:0 5px;padding:2px 4px;border-radius:10px;border:2px solid var(--rl-goldsh);background:linear-gradient(180deg,var(--rl-gold1),var(--rl-gold2));color:#2a1403;
  font-family:'Lilita One',Nunito,sans-serif;font-size:15px;line-height:1.1;text-align:center;overflow-wrap:anywhere;box-shadow:0 3px 0 var(--rl-goldsh),inset 0 2px 0 rgba(255,255,255,.45);min-width:0}
.rl-go:active{transform:translateY(2px)}
.rl-src{margin-top:16px;padding:8px 12px 12px}
.rl-h5{margin:0 0 4px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--rl-gold1);font-weight:900}
.rl-src ul,.rl-how ul{margin:0;padding-left:16px;font-size:12.5px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.rl-src p{margin:8px 0 0;font-size:12px;font-weight:800;line-height:1.45;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-src p b{color:var(--rl-ok)}
.rl-shade{position:absolute;inset:0;z-index:2;background:rgba(20,10,3,.66)}
.rl-sh{position:absolute;left:0;right:0;bottom:0;z-index:3;max-height:92%;border-radius:20px 20px 0 0;background:linear-gradient(180deg,#5a3518,var(--rl-sheet));border-top:3px solid var(--rl-sheetline);padding:14px 14px 18px;animation:rl-up .28s ease-out;box-shadow:0 -2px 0 var(--rl-woodline),0 -10px 30px rgba(0,0,0,.55)}
.rl-shh{display:flex;align-items:center;gap:10px;min-width:0}
.rl-shh .rl-i{width:64px;max-width:none;border-radius:12px;border:2px solid var(--rl-gold);background:radial-gradient(circle at 50% 55%,var(--rl-fr1),var(--rl-fr2) 60%,var(--rl-fr3));box-shadow:0 0 0 1px var(--rl-woodline)}
.rl-shh .rl-i.no{border-color:#77777d;background:linear-gradient(180deg,var(--rl-lk1),var(--rl-lk2))}
.rl-shh>div{flex:1;min-width:0}
.rl-shh h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.1;overflow-wrap:anywhere}
.rl-shh p{margin:2px 0 0;font-size:11.5px;font-weight:800;color:var(--rl-mut);line-height:1.3;overflow-wrap:anywhere}
.rl-lv{flex:none;align-self:flex-start;padding:4px 9px;border-radius:10px;background:rgba(0,0,0,.35);border:1px solid var(--rl-gold);color:var(--rl-gold1);font-weight:900;font-size:12px;white-space:nowrap}
.rl-lv.no{border-color:rgba(255,236,200,.3);color:var(--rl-mut)}
.rl-dsc{margin:10px 0 0;font-size:13px;font-weight:700;line-height:1.45;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-rows{margin-top:10px;display:flex;flex-direction:column;gap:5px}
.rl-rw{display:flex;gap:8px;align-items:baseline;padding:7px 10px;border-radius:12px;background:var(--rl-card);border:1px solid var(--rl-line);font-size:12.5px;font-weight:800;line-height:1.35;min-width:0}
.rl-rw>span{flex:none;width:86px;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:var(--rl-mut);font-weight:900;overflow-wrap:anywhere}
.rl-rw>div{flex:1;min-width:0;overflow-wrap:anywhere}
.rl-rw em{font-style:normal;color:var(--rl-ok)}
.rl-prg{margin-top:10px;min-width:0}
.rl-prg small{display:flex;justify-content:space-between;gap:4px;font-size:10px;font-weight:900;color:var(--rl-mut);letter-spacing:.6px}
.rl-prg small b{color:var(--rl-ink);font-variant-numeric:tabular-nums}
.rl-prg .rl-bar{height:12px;margin-top:3px}
.rl-how{margin-top:10px;padding:8px 12px;border-radius:12px;background:var(--rl-card);border:1px solid rgba(242,193,78,.45);min-width:0}
.rl-how b{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:var(--rl-gold1)}
.rl-how p{margin:3px 0 0;font-size:12.5px;font-weight:700;line-height:1.45;overflow-wrap:anywhere}
.rl-sh .rl-msg{display:block;max-width:none;margin:8px 0 0}
.rl-sh .rl-msg:not(:empty){background:rgba(0,0,0,.35)}
.rl-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}
.rl-bt,.xs .rl-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--rl-gold1),var(--rl-gold2));color:#2a1403;box-shadow:0 3px 0 var(--rl-goldsh),inset 0 2px 0 rgba(255,255,255,.4)}
.rl-bt.o,.xs .rl-bt.o{background:rgba(0,0,0,.3);border:1px solid rgba(255,236,200,.4);color:var(--rl-ink);box-shadow:none}
.rl-bt.b,.xs .rl-bt.b{background:linear-gradient(180deg,var(--rl-ok1),var(--rl-ok2));color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.rl-bt:active{transform:translateY(2px)}
.rl-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.rl-off span{padding:12px 14px;border-radius:12px;background:rgba(40,22,8,.94);border:2px solid var(--rl-gold);font-weight:800;font-size:14px;line-height:1.4;color:var(--rl-soft);overflow-wrap:anywhere}
.rl-off .rl-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.rl-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={sel:null,arm:'',msg:'',bad:false,msgT:0,anim:true,top:true,sig:''};
function rSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=rNow(); }
const rMsgHtml=id=>'<div id="'+id+'" class="rl-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
/* fundo: o cenário da era atual (regra da casa), quase sem escurecer: o mock B é de dia. Todo texto fica em cima de placa ou cartão */
const rBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.04,0.32):'#16110d'; }catch(e){ return '#16110d'; } };
/* o que falta para a ação da relíquia (texto de jogador, com os números do view do módulo) */
/* quantos fragmentos faltam: o número do módulo (Sys.relics.slot().need) quando ele existe; senão a conta com os campos do view */
const rMiss=s=>Math.max(1,typeof s.need==='number'?s.need:((s.owned?s.cost:s.unlockFrags)|0)-(s.frags|0));
function rNeed(s){ if(s.owned){ if(s.max) return rWhy('max'); return 'Faltam '+rPl(rMiss(s),'fragmento','fragmentos')+' de '+s.eraName; }
  return 'Faltam '+rPl(rMiss(s),'fragmento','fragmentos')+' de '+s.eraName+' ou vencer o Senhor da Era'; }
/* texto de um motivo: a FONTE é o módulo (Sys.relics.why); a reserva daqui só vale se ele não tiver a função */
const RL_WHY={max:'Nível máximo',locked:'Ainda não despertada',owned:'Já despertada',off:'Relíquias desligadas',frags:'Faltam fragmentos'};
const rWhy=k=>{ let t=''; try{ const M=rM(); if(M&&typeof M.why==='function') t=String(M.why(k)||''); }catch(e){ t=''; } return t||RL_WHY[k&&typeof k==='object'?k.reason:k]||'Não dá agora'; };
/* motivo de uma recusa do módulo, em texto de jogador (faltando fragmento, diz quantos e de qual era) */
function rReason(r,s){ if(r&&r.reason==='frags'&&s) return rNeed(s); return rWhy(r); }

/* ---------- desenho ---------- */
function rOffHtml(d,msg){ V.innerHTML=xWrap(d,'rl-root '+(X.anim?'rl-in':''),'<div class="rl-w" style="background:'+rBg()+'"><div class="rl-off"><span role="alert">'+esc2(msg)+'</span><button class="rl-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
/* barra de fragmentos; txt = mostra "tenho/preciso" dentro dela (o cartão do mock) */
function rBar(have,need,txt){ const p=rClamp((have|0)/Math.max(1,need|0),0,1); return '<i class="rl-bar'+(p>=1?' ok':'')+'"><u style="width:'+Math.round(p*100)+'%"></u>'+(txt?'<s>'+rN(have)+'/'+rN(need)+'</s>':'')+'</i>'; }
/* o bônus total do módulo, com os valores em verde (placa do mock): o texto é escapado antes; só os números com sinal ganham a cor */
const rBonus=t=>esc2(t).replace(/[+\-]\d[\d.,]*%?/g,m=>'<em>'+m+'</em>');
/* botão dourado embaixo do cartão que já pode subir ou despertar (o "Subir" do mock): abre a folha, onde ficam os dois toques */
const rGo=(s,t)=>'<button class="rl-go" data-x="sel" data-id="'+esc2(s.id)+'" aria-label="'+esc2(t+': '+s.name)+'">'+t+'</button>';
function rCard(s){ const on=X.sel===s.id?' on':'', st=rState(s), id=esc2(s.id);
  if(s.owned) return '<div class="rl-sl"><button class="rl-cd'+on+'" data-x="sel" data-id="'+id+'" aria-label="'+esc2(s.name+', nível '+s.lv+' de '+rM().DATA.maxLv)+'"><span class="rl-fr"><b>'+esc2(s.name)+'</b>'+rIco(s.id,'')+'</span>'
    +'<span class="rl-ped"><em>Nv '+rN(s.lv)+'</em>'+(s.max?'<small class="up">Nível máximo</small>':rBar(s.frags,s.cost,1))+'</span></button>'+(s.canLevel&&!s.max?rGo(s,'Subir'):'')+'</div>';
  if(s.locked&&!s.canUnlock) return '<div class="rl-sl"><button class="rl-cd no'+on+'" data-x="sel" data-id="'+id+'" aria-label="'+esc2(s.name+', trancada: chegue à era '+s.eraName)+'"><span class="rl-fr"><b>'+esc2(s.eraName)+'</b>'+rIco(s.id,st)+'</span>'
    +'<span class="rl-ped"><small>Chegue a esta era para liberar</small></span></button></div>';
  return '<div class="rl-sl"><button class="rl-cd no'+on+'" data-x="sel" data-id="'+id+'" aria-label="'+esc2(s.name+', ainda não nasceu')+'"><span class="rl-fr"><b>'+esc2(s.name)+'</b>'+rIco(s.id,st)+'</span>'
    +'<span class="rl-ped">'+(s.canUnlock?'':'<small>Senhor da Era ou '+rPl(s.unlockFrags|0,'fragmento','fragmentos')+'</small>')+rBar(s.frags,s.unlockFrags,1)+'</span></button>'+(s.canUnlock?rGo(s,'Despertar'):'')+'</div>'; }
function rSheet(s,v){ const mx=rM().DATA.maxLv|0, st=rState(s);
  let h='<div class="rl-shade" data-x="close"></div><div class="rl-sh x-scroll" role="dialog" aria-label="'+esc2(s.name)+'">';
  h+='<div class="rl-shh"><span class="rl-i'+(s.owned?'':' no')+'">'+iconOf(s.id,st)+'</span><div><h3>'+esc2(s.name)+'</h3><p>Relíquia da era '+esc2(s.eraName)+'</p></div><span class="rl-lv'+(s.owned?'':' no')+'">'+(s.owned?'Nv '+rN(s.lv)+'/'+rN(mx):s.locked?'Era trancada':'Não nasceu')+'</span></div>';
  h+='<p class="rl-dsc">'+esc2(s.desc)+'</p><div class="rl-rows">';
  h+='<div class="rl-rw"><span>'+(s.owned?'Bônus Nv '+rN(s.lv):'Bônus ao nascer')+'</span><div>'+esc2(s.passiveText)+'</div></div>';
  if(s.owned&&s.nextText) h+='<div class="rl-rw"><span>No Nv '+rN(s.lv+1)+'</span><div><em>'+esc2(s.nextText)+'</em></div></div>';
  h+='</div>';
  if(!(s.owned&&s.max)) h+='<div class="rl-prg"><small>FRAGMENTOS DE '+esc2(String(s.eraName).toUpperCase())+' <b>'+rN(s.frags)+'/'+rN(s.owned?s.cost:s.unlockFrags)+'</b></small>'+rBar(s.frags,s.owned?s.cost:s.unlockFrags)+'</div>';
  if(s.locked&&!s.owned) h+='<div class="rl-how"><b>Era trancada</b><p>Chegue à era '+esc2(s.eraName)+' para enfrentar o Senhor da Era dela. Os fragmentos desta era já ficam guardados.</p></div>';
  h+=rMsgHtml('rl_msg2')+'<div class="rl-acts">';
  /* Subir e Despertar gastam fragmentos: dois toques */
  if(s.owned){ if(s.canLevel) h+=X.arm===s.id+':up'
      ?'<button class="rl-bt b" data-x="upok">Confirmar: gasta '+rPl(s.cost|0,'fragmento','fragmentos')+'</button>'
      :'<button class="rl-bt" data-x="up">Subir para o Nv '+rN(s.lv+1)+'</button>';
    else h+='<button class="rl-bt o" data-x="up">'+esc2(rNeed(s))+'</button>'; }
  else { if(s.canUnlock) h+=X.arm===s.id+':wake'
      ?'<button class="rl-bt b" data-x="wakeok">Confirmar: gasta '+rPl(s.unlockFrags|0,'fragmento','fragmentos')+'</button>'
      :'<button class="rl-bt" data-x="wake">Despertar</button>';
    else h+='<button class="rl-bt o" data-x="wake">'+esc2(rNeed(s))+'</button>'; }
  h+='</div><div class="rl-how"><b>Como conseguir</b><ul>'+(v.sources||[]).map(t=>'<li>'+esc2(t)+'</li>').join('')+'</ul></div>';
  h+='<div class="rl-acts" style="margin-top:12px"><button class="rl-bt o" data-x="close">Fechar</button></div></div>';
  return h; }
function rDraw(){
  const d=xDims(240)||{};
  if(!rHas()){ rOffHtml(d,'Relíquias indisponíveis agora.'); return; }
  if(!rOk()){ rOffHtml(d,'As Relíquias das Eras ainda não abriram.'); return; }   /* desligado: não chama o view (ele prepara o save) */
  const v=rView(); if(!v){ rOffHtml(d,'Relíquias indisponíveis agora.'); return; }
  if(X.sel&&!v.slots.some(s=>s.id===X.sel)){ X.sel=null; X.arm=''; } if(X.arm&&X.arm.split(':')[0]!==X.sel) X.arm='';
  let y0=0; try{ const sc0=X.top?null:document.getElementById('rl_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  /* ordem do mock: placa do bônus total, grade de cartões; o que o mock não tem (como conseguir) fica abaixo, rolando */
  let h='<div class="rl-top"><b'+(v.bonusText?'':' class="z"')+'>'+(v.bonusText?rBonus(v.bonusText):'Nenhum bônus ainda')+'</b><small>'+rN(v.owned)+' de '+rN(v.total)+' relíquias</small></div>'+(X.sel?'<div class="rl-msg"></div>':rMsgHtml('rl_msg'));
  h+='<div id="rl_scroll" class="x-scroll rl-body">';
  if(!v.owned) h+='<section class="rl-none"><b>Você ainda não tem relíquias</b><p>Cada era guarda uma. Ela nasce na 1ª vitória sobre o Senhor da Era, ou com '+rPl(rM().DATA.unlockFrags|0,'fragmento','fragmentos')+' da era. Toque numa relíquia para ver como conseguir.</p></section>';
  if((v.loose|0)>0) h+='<p class="rl-note">'+rPl(v.loose|0,'fragmento solto guardado','fragmentos soltos guardados')+': entram na primeira relíquia que nascer.</p>';
  h+='<div class="rl-grid">'+v.slots.map(rCard).join('')+'</div>';
  h+='<section class="rl-src"><div class="rl-h5">Como conseguir</div><ul>'+(v.sources||[]).map(t=>'<li>'+esc2(t)+'</li>').join('')+'</ul><p><b>Nada à venda.</b> Relíquias e fragmentos vêm só jogando, sempre na mesma quantidade.</p></section></div>';
  if(X.sel) h+=rSheet(v.slots.find(s=>s.id===X.sel),v);
  V.innerHTML=xWrap(d,'rl-root '+(X.anim?'rl-in':''),'<div class="rl-w" style="background:'+rBg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=rSig();
  if(y0){ try{ const sc=document.getElementById('rl_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
}
/* assinatura do que muda por fora (fragmento novo, relíquia que nasce, era liberada): leitura crua do save, sem preparar nada */
function rSig(){ try{ const h=rHost(); return JSON.stringify([S.sys&&S.sys.relics||null,S.sys&&S.sys.loot&&S.sys.loot.relicFrags||0,h&&typeof h.eraMax==='function'?h.eraMax():0]); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
/* a relíquia da folha: Sys.relics.slot(S, host, id) (traz need e sources) quando o módulo tem; senão o slot do view */
function rSlot(id){ try{ const M=rM(); if(typeof M.slot==='function'){ const s=M.slot(S,rHost(),id); if(s) return s; } }catch(e){} const v=rView(); return v?v.slots.find(s=>s.id===id)||null:null; }
/* 1º toque: arma (ou mostra o que falta). 2º toque: chama a função do módulo UMA vez */
function rArm(kind){ const s=rSlot(X.sel); if(!s) return; rSnd('ui_tap'); const can=kind==='up'?(s.owned&&s.canLevel):(!s.owned&&s.canUnlock);
  if(!can){ X.arm=''; rSay(kind==='up'&&!s.owned?rReason({reason:'locked'}):kind==='wake'&&s.owned?rReason({reason:'owned'}):rNeed(s),true); rRedraw(); return; }
  X.arm=s.id+':'+kind; rSay('Toque em Confirmar. Os fragmentos são gastos.'); rRedraw(); }
function rDo(kind){ const id=X.sel, s=rSlot(id); if(!s) return; const armed=X.arm===id+':'+kind; X.arm='';
  if(!armed){ rSnd('ui_tap'); rSay('Toque primeiro no botão dourado.',true); rRedraw(); return; }
  let r=null; try{ r=kind==='up'?rM().levelUp(S,id,rHost()):rM().unlock(S,id,rHost()); }catch(e){ r={ok:false}; }
  if(r&&r.ok){ rSnd('ui_ok'); rStore(); const a=rSlot(id); rSay(kind==='up'?s.name+' subiu para o nível '+rN(r.lv)+(a?' · '+a.passiveText:''):s.name+' despertou'+(a?' · '+a.passiveText:'')); }
  else { rSnd('ui_tap'); rSay(rReason(r,s),true); }
  rRedraw(); }
const ACT={
  back(){ rSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  close(){ rSnd('ui_tap'); X.sel=null; X.arm=''; X.msg=''; rRedraw(); },
  sel(b){ const id=String(b.dataset.id||''); if(!rM().relic(id)) return; rSnd('ui_tap'); X.sel=id; X.arm=''; X.msg=''; rRedraw(); },
  up(){ rArm('up'); },
  upok(){ rDo('up'); },
  wake(){ rArm('wake'); },
  wakeok(){ rDo('wake'); } };
function rClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!rOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function rUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  if(RL_ART_ON){ try{ for(const r of rM().DATA.relics){ const a=rArt(r); if(u.indexOf(a)<0) u.push(a); } }catch(e){} } return u; }
function rClearMsg(){ X.msg=''; try{ for(const id of ['rl_msg','rl_msg2']){ const el=document.getElementById(id); if(el) el.innerHTML=''; } }catch(e){} }

if(!('relics' in PANEL_ON)) PANEL_ON.relics=false;
Panels.add(N,{title:'Relíquias das Eras',actions:Object.keys(ACT),iconOf,
  render(){ if(typeof pwGate==='function'){ if(pwGate(rUrls())) return; } else if(typeof xGate==='function'&&xGate(rUrls())) return; return rDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return rClick(b); },
  tick(){ if(!rOk()) return; if(X.msg&&!X.arm&&rNow()-X.msgT>2600) rClearMsg(); if(X.sig&&X.sig!=='x'&&rSig()!==X.sig) rRedraw(); },
  busy(){ return false; },
  onOpen(){ X.sel=null; X.arm=''; X.msg=''; X.anim=true; X.top=true; X.sig=''; },
  onClose(){ X.sel=null; X.arm=''; X.msg=''; } });
})();
