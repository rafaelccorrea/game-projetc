'use strict';
/* ================= TELA MINIJOGO DE EVENTO (docs/LIGACOES_LOM_TELAS.md, seção 6) — NASCE DESLIGADA (PANEL_ON.minigame = false) =================
   Minijogo de TIMING: um marcador corre de um lado ao outro da barra e o jogador toca em "Toque!" quando ele passa na faixa. 10 toques por partida.
   NENHUMA regra e NENHUM número de prêmio aqui. Tudo vem do js/sys/minigame.js (Sys.minigame):
   - o que a tela mostra: Sys.minigame.view(S, host) (tema da quinzena, tentativas, melhor do dia, faixas e prêmios, marcos);
   - Jogar: Sys.minigame.start(S, host) (gasta 1 das 3 tentativas grátis do dia) → {speed, zone, centers[10]};
   - cada toque: a posição do marcador NO INSTANTE do toque (posAt, a MESMA conta que desenha o marcador) vai para Sys.minigame.grade(pos, centro, zone);
   - fim: Sys.minigame.finish(S, host, posições) UMA vez (10 toques, ou saída: o que não foi tocado conta como erro);
   - prêmio do dia: Sys.minigame.claimDay · marcos: Sys.minigame.claimMilestone(dias).
   JUSTO E SEM SORTE ESCONDIDA: a tela não sorteia nada; a faixa de cada toque vem do módulo e é mostrada antes; o ponto é só onde o marcador parou.
   REGRAS DE MENORES: nenhuma tentativa comprada, nenhum prêmio em ouro, nenhuma pressa.
   GASTA TENTATIVA = DOIS TOQUES (o 1º arma, o 2º confirma). Resgatar o prêmio do dia também (resgatar encerra o prêmio de hoje). Sair da partida também.
   ATENÇÃO: com o sistema desligado a tela NÃO chama status/view (eles preparam o save): mostra o aviso e o Voltar, sem escrever nada.
   A velocidade da passada (1,6 s dividido pelo speed do módulo) é do guia de ligação: fica em MG_PASS_MS.
   Chaves: PANEL_ON.minigame (esta tela) e Sys.minigame.DATA.on (o sistema). O arquivo roda em escopo próprio. Ponte: window.PMinigame. */
(function(){
const N='minigame';
const MG_PASS_MS=1600, MG_PAUSE_MS=450, MG_MSG_MS=3200;
const MG_LEVEL_DEFAULT=24;   /* o minijogo mora dentro de Eventos: usa o nível de Eventos do jogo (FB_UNLOCK.events); este número é só a reserva */

/* ---------- VISUAL: mock A votado pelo dono (docs/proto/v2/a/mocks/mini_a.jpg): a festa das lanternas em cima com o herói no meio, a barra de moldura dourada
   com a faixa vermelha acesa, o "Toque!" gigante, a faixa Toques / Acertos e os três baús ligados por um trilho (as três faixas de prêmio do dia).
   ARTE: UMA constante. Reserva em CSS/SVG (icoOf, lanternas .mg-lt) até a Arte entregar em MG_ART_DIR: chest.png, open.png (baú com pedras, sem moedas),
   forge.png, food.png, essence.png, stones.png, item.png (prêmios) e forja.png, pesca.png, escavacao.png (emblema de cada tema). Depois, troque MG_ART_ON para true.
   A cena pintada do mock (multidão da festa, barracas, logotipo) não existe em assets/: fica o cenário da era velado de noite, as lanternas em CSS e o herói do jogo. ---------- */
const MG_ART_ON=false, MG_ART_DIR='assets/minigame/';
const MG_SVG={
  forge:'<path d="M9 28l6-15 11-4 6 9-4 12-12 2z" fill="#c9652e" stroke="#ffd9a8" stroke-width="1.6" stroke-linejoin="round"/><path d="M15 13l8 7 9-2" stroke="#ffd9a8" stroke-width="1.2" fill="none"/>',
  food:'<path d="M8 20c0 8 5 12 12 12s12-4 12-12z" fill="#b5793a" stroke="#ffe0b0" stroke-width="1.6" stroke-linejoin="round"/><path d="M14 16c0-3 3-3 3-6M21 16c0-3 3-3 3-6" stroke="#ffe0b0" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
  essence:'<path d="M20 5c7 9 10 13 10 18a10 10 0 01-20 0c0-5 3-9 10-18z" fill="#7a5cff" stroke="#d9d0ff" stroke-width="1.6" stroke-linejoin="round"/><ellipse cx="16" cy="22" rx="2.5" ry="4" fill="#fff" opacity=".35"/>',
  stones:'<path d="M8 27l5-13 10-5 9 8-2 13-13 3z" fill="#8a8f9c" stroke="#e6e9f2" stroke-width="1.6" stroke-linejoin="round"/><path d="M13 14l8 6 11-3M21 20l-4 13" stroke="#e6e9f2" stroke-width="1.2" fill="none"/>',
  item:'<rect x="9" y="12" width="22" height="18" rx="4" fill="#7a5226" stroke="#ffc94a" stroke-width="1.6"/><path d="M9 19h22" stroke="#ffc94a" stroke-width="1.6"/>',
  chest:'<rect x="6" y="17" width="28" height="16" rx="3" fill="#8a5a28" stroke="#3a2410" stroke-width="1.6"/><path d="M6 17c0-6 4-9 14-9s14 3 14 9z" fill="#a8702f" stroke="#3a2410" stroke-width="1.6"/><path d="M6 23h28M11 9v24M29 9v24" stroke="#e8b24a" stroke-width="1.8"/><rect x="18" y="20" width="4" height="6" rx="1" fill="#ffe07a" stroke="#3a2410" stroke-width="1"/>',
  open:'<path d="M7 20l2-13h22l2 13" fill="#6b4420" stroke="#3a2410" stroke-width="1.6" stroke-linejoin="round"/><path d="M20 6l6 6-6 9-6-9z" fill="#3f8cff" stroke="#d6e8ff" stroke-width="1.4" stroke-linejoin="round"/><rect x="6" y="20" width="28" height="13" rx="3" fill="#a8702f" stroke="#3a2410" stroke-width="1.6"/><path d="M11 20v13M29 20v13" stroke="#e8b24a" stroke-width="1.8"/><rect x="18" y="23" width="4" height="5" rx="1" fill="#ffe07a" stroke="#3a2410" stroke-width="1"/>',
  forja:'<path d="M7 16h20l6 4h-8v4l4 8H13l4-8v-4H7z" fill="#5c5f6b" stroke="#e6e9f2" stroke-width="1.6" stroke-linejoin="round"/>',
  pesca:'<path d="M6 21c6-8 16-8 22 0-6 8-16 8-22 0z" fill="#2fa7a0" stroke="#bff3ee" stroke-width="1.6"/><path d="M28 21l6-5v10z" fill="#2fa7a0" stroke="#bff3ee" stroke-width="1.6" stroke-linejoin="round"/><circle cx="13" cy="19.500" r="1.6" fill="#fff"/>',
  escavacao:'<path d="M10 31L26 12" stroke="#c9a06a" stroke-width="3" stroke-linecap="round"/><path d="M22 7l11 7-5 4-8-6z" fill="#8a8f9c" stroke="#e6e9f2" stroke-width="1.6" stroke-linejoin="round"/>'};
/* icoOf(kind): o ÚNICO lugar que decide entre o arquivo da Arte e a reserva */
function icoOf(kind){ if(!Object.prototype.hasOwnProperty.call(MG_SVG,kind)) kind='item';
  if(MG_ART_ON) return '<img src="'+esc2(MG_ART_DIR+kind+'.png')+'" alt="">';
  return '<svg viewBox="0 0 40 40" aria-hidden="true">'+MG_SVG[kind]+'</svg>'; }
const ico=(kind,cls)=>'<span class="mg-i'+(cls?' '+cls:'')+'">'+icoOf(kind)+'</span>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const MM=()=>(window.Sys&&Sys.minigame)||null;
const has=()=>{ const M=MM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.status==='function'&&typeof M.start==='function'&&typeof M.finish==='function'&&typeof M.grade==='function'&&typeof M.claimDay==='function'&&typeof M.claimMilestone==='function'&&typeof M.why==='function'); };
const isOn=()=>{ try{ return has()&&MM().DATA.on===true; }catch(e){ return false; } };
const host=()=>(window.Sys&&Sys.host)||null;
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const redraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
/* o Sys.minigame não avisa o jogo quando muda o save: a tela grava */
const store=()=>{ try{ if(typeof save==='function') return save(); const h=host(); if(h&&typeof h.onChange==='function') h.onChange(); }catch(e){} };
const now=()=>Date.now();
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const c01=v=>Math.max(0,Math.min(1,v));
const nT=v=>{ try{ return typeof n0==='function'?n0(num(v)):String(Math.round(num(v))); }catch(e){ return String(Math.round(num(v))); } };
const pl=(n,one,many)=>nT(n)+' '+(num(n)===1?one:many);
const byId=id=>{ try{ return document.getElementById(id); }catch(e){ return null; } };
const why=r=>{ let t=''; try{ t=String(MM().why(r)||''); }catch(e){ t=''; } return t||'Não deu agora'; };
const viewNow=()=>{ try{ return MM().view(S,host())||null; }catch(e){ return null; } };
const lvlNow=()=>{ try{ const L=window.Sys&&Sys.level; if(L&&typeof L.level==='function') return num(L.level(S)); const h=host(); return h&&typeof h.level==='function'?num(h.level()):-1; }catch(e){ return -1; } };
const lvlNeed=()=>{ try{ if(typeof FB_UNLOCK!=='undefined'&&FB_UNLOCK&&num(FB_UNLOCK.events)>0) return num(FB_UNLOCK.events); }catch(e){} return MG_LEVEL_DEFAULT; };
const locked=()=>{ const l=lvlNow(); return l>=0&&l<lvlNeed(); };   /* sem leitura de nível no jogo, a tela não tranca */
const dayText=ms=>{ try{ const d=new Date(num(ms)-3*3600000); return String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0'); }catch(e){ return ''; } };

/* ---------- estilo. AS CORES FICAM NAS VARIÁVEIS DO TOPO (.mg-root): o revestimento do mock troca só este bloco ---------- */
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.mg-root{--mg-ink:#fff3d6;--mg-mut:#cdbfae;--mg-soft:#f1e4c8;--mg-gold:#ffc94a;--mg-gold1:#ffe07a;--mg-gold2:#f2a826;--mg-goldsh:#9a5a10;--mg-goldink:#2a1403;
  --mg-night1:rgba(16,12,40,.90);--mg-night2:rgba(22,14,44,.88);--mg-wine:rgba(70,20,34,.92);--mg-card:rgba(10,8,26,.55);--mg-line:rgba(255,214,140,.28);
  --mg-cream:#ffe9b0;--mg-glow:rgba(255,190,90,.85);--mg-lantern1:#ffd98a;--mg-lantern2:#ff9a3c;
  --mg-ok:#7fe07a;--mg-ok1:#9cf08f;--mg-ok2:#3fae3c;--mg-okink:#0d2410;--mg-bad:#ffb3a8;
  --mg-perfect:#ffd25e;--mg-good:#7fe07a;--mg-graze:#6fb6ff;--mg-miss:#7d7468;
  --mg-track:#23223a;--mg-trackline:#e0a93c;--mg-fill1:#58c4f0;--mg-fill2:#2f86c8;--mg-zone:#ff5a3c;--mg-zoneglow:rgba(255,90,60,.7);--mg-mk:#ffd25e;color:var(--mg-ink)}
.mg-root,.mg-root *{box-sizing:border-box}
.mg-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.mg-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.mg-in{animation:mg-in .25s ease-out both}
@keyframes mg-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes mg-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes mg-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.mg-i{flex:none;display:inline-block;width:20px;height:20px;vertical-align:middle}
.mg-i svg,.mg-i img{display:block;width:100%;height:100%;object-fit:contain}
.mg-i.big{width:48px;height:48px}
.mg-i.chest{width:64px;height:64px}
.mg-body{position:relative;flex:1;min-height:0;padding:0 0 20px;display:flex;flex-direction:column;gap:10px}
.mg-scene{flex:none;position:relative;height:150px;overflow:hidden;border-bottom:1px solid var(--mg-line)}
.mg-scene canvas{position:absolute;left:50%;bottom:0;width:120px;height:124px;margin-left:-60px}
.mg-lt{position:absolute;width:22px;height:28px;border-radius:45% 45% 40% 40%;background:radial-gradient(circle at 50% 60%,var(--mg-lantern1),var(--mg-lantern2));box-shadow:0 0 14px 4px var(--mg-glow);opacity:.9;animation:mg-float 3.6s ease-in-out infinite}
.mg-ttl{position:absolute;left:8px;right:8px;top:6px;text-align:center;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:20px;line-height:1.1;color:var(--mg-gold1);text-shadow:0 2px 0 #5a2a08,0 0 12px var(--mg-glow);overflow-wrap:anywhere}
.mg-ttl small{display:block;margin-top:2px;font-family:Nunito,system-ui,sans-serif;font-size:10.5px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;color:var(--mg-soft);text-shadow:0 1px 2px #000;overflow-wrap:anywhere}
.mg-pad{flex:none;padding:0 14px;min-width:0}
.mg-bar{position:relative;height:40px;border-radius:20px;background:var(--mg-track);border:3px solid var(--mg-trackline);box-shadow:0 0 0 2px #5a3a10,0 3px 0 rgba(0,0,0,.4)}
.mg-fill{position:absolute;left:0;top:0;bottom:0;border-radius:17px 0 0 17px;background:linear-gradient(180deg,var(--mg-fill1),var(--mg-fill2))}
.mg-zone{position:absolute;top:-5px;bottom:-5px;border-left:4px solid var(--mg-zone);border-right:4px solid var(--mg-zone);border-radius:12px;box-shadow:0 0 12px 2px var(--mg-zoneglow),inset 0 0 10px var(--mg-zoneglow)}
.mg-zone u{position:absolute;top:5px;bottom:5px;left:50%;transform:translateX(-50%);border-radius:6px;background:rgba(127,224,122,.28)}
.mg-zone u.p{background:rgba(255,210,94,.6)}
.mg-mk{position:absolute;top:-9px;bottom:-9px;width:12px;margin-left:-6px;border-radius:6px;background:linear-gradient(180deg,#fff0b0,var(--mg-mk));border:2px solid #7a4a10;box-shadow:0 0 8px var(--mg-glow)}
.mg-gr{min-height:26px;margin:8px 0 0;font-family:'Lilita One',Nunito,sans-serif;font-size:19px;line-height:1.2;text-align:center}
.mg-gr.perfect{color:var(--mg-perfect)}
.mg-gr.good{color:var(--mg-good)}
.mg-gr.graze{color:var(--mg-graze)}
.mg-gr.miss{color:var(--mg-mut)}
.mg-txt{margin:8px 0 0;font-size:12.5px;font-weight:800;line-height:1.4;text-align:center;color:var(--mg-soft);overflow-wrap:anywhere}
.mg-tap,.xs .mg-tap{display:block;width:100%;min-height:132px;border:0;border-radius:18px;background:transparent;color:var(--mg-cream);font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:52px;line-height:1.1;text-shadow:0 0 18px var(--mg-glow),0 3px 0 #7a4a10;animation:mg-pulse 1.2s ease-in-out infinite}
.mg-tap:active{transform:scale(.96)}
.mg-score{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:30px;line-height:1.15;text-align:center;color:var(--mg-cream);text-shadow:0 0 14px var(--mg-glow),0 2px 0 #7a4a10;overflow-wrap:anywhere}
.mg-dots{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:4px;margin-top:8px}
.mg-dots i{display:block;height:10px;border-radius:5px;background:rgba(255,255,255,.1);border:1px solid var(--mg-line)}
.mg-dots i.perfect{background:var(--mg-perfect)}
.mg-dots i.good{background:var(--mg-good)}
.mg-dots i.graze{background:var(--mg-graze)}
.mg-dots i.miss{background:var(--mg-miss)}
.mg-leg{display:flex;flex-wrap:wrap;justify-content:center;gap:4px 12px;margin:8px 0 0;font-size:11.5px;font-weight:800;color:var(--mg-soft)}
.mg-leg span{display:inline-flex;align-items:center;gap:4px}
.mg-leg i{display:inline-block;width:10px;height:10px;border-radius:50%}
.mg-stats{flex:none;display:flex;justify-content:space-between;gap:10px;padding:8px 18px;border-top:1px solid var(--mg-line);border-bottom:1px solid var(--mg-line);background:rgba(8,6,20,.4);min-width:0}
.mg-stats>div{min-width:0}
.mg-stats>div:last-child{text-align:right}
.mg-stats small{display:block;font-family:'Lilita One',Nunito,sans-serif;font-size:14px;color:var(--mg-gold1);overflow-wrap:anywhere}
.mg-stats b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:24px;line-height:1.1;color:#fff}
.mg-msg{flex:none;min-height:36px;margin:0 14px;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:900;line-height:1.3;text-align:center;color:var(--mg-gold1);overflow-wrap:anywhere}
.mg-msg.bad{color:var(--mg-bad)}
.mg-chs{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:8px 6px 10px;border-radius:16px;border:2px solid var(--mg-line);background:rgba(40,14,22,.5)}
.mg-rail{position:absolute;left:16%;right:16%;top:44px;height:10px;border-radius:5px;background:var(--mg-track);border:2px solid #5a3a10}
.mg-rail u{position:absolute;left:0;top:0;bottom:0;border-radius:3px;background:linear-gradient(180deg,var(--mg-gold1),var(--mg-gold2))}
.mg-ch{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;text-align:center;min-width:0}
.mg-ch.z .mg-i.chest{filter:saturate(.55) brightness(.8)}
.mg-ch.on .mg-i.chest{filter:drop-shadow(0 0 8px var(--mg-glow))}
.mg-ch b{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:15px;line-height:1.1;color:var(--mg-gold1);overflow-wrap:anywhere}
.mg-ch small{font-size:10.5px;font-weight:800;color:var(--mg-mut);overflow-wrap:anywhere}
.mg-ch em{font-style:normal;font-size:10.5px;font-weight:900;color:var(--mg-ok)}
.mg-ch .mg-rw{font-size:11px;justify-content:center}
.mg-rw{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:900;overflow-wrap:anywhere}
.mg-sec{flex:none;margin:0 14px;border-radius:16px;background:var(--mg-card);border:1px solid var(--mg-line);padding:10px 12px 12px;min-width:0}
.mg-h5{margin:0 0 6px;font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--mg-mut);font-weight:900;overflow-wrap:anywhere}
.mg-p{margin:0 0 8px;font-size:12.5px;font-weight:700;line-height:1.45;color:var(--mg-soft);overflow-wrap:anywhere}
.mg-p:last-child{margin-bottom:0}
.mg-p b{color:var(--mg-ok)}
.mg-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.mg-bt,.xs .mg-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:14px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,var(--mg-gold1),var(--mg-gold2));color:#2a1403;box-shadow:0 3px 0 var(--mg-goldsh)}
.mg-bt.go,.xs .mg-bt.go{flex:1 1 100%;min-height:60px;border-radius:16px;border:2px solid #7a4a10;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:22px;box-shadow:0 5px 0 var(--mg-goldsh)}
.mg-bt.o,.xs .mg-bt.o{background:rgba(255,236,200,.08);border:1px solid rgba(255,236,200,.3);color:var(--mg-ink);box-shadow:none}
.mg-bt.b,.xs .mg-bt.b{background:linear-gradient(180deg,var(--mg-ok1),var(--mg-ok2));color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.mg-bt.dim,.xs .mg-bt.dim{opacity:.75}
.mg-bt.sm,.xs .mg-bt.sm{flex:none;min-height:44px;padding:4px 14px;font-size:13px}
.mg-bt:active{transform:translateY(2px)}
.mg-tr{display:flex;align-items:center;gap:8px;padding:7px 0;border-top:1px solid var(--mg-line);min-width:0}
.mg-tr:first-of-type{border-top:0}
.mg-tr>b{flex:none;width:64px;font-size:12.5px;font-weight:900;line-height:1.25;overflow-wrap:anywhere}
.mg-tr>span{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:4px 10px}
.mg-tr em{flex:none;font-style:normal;font-size:11.5px;font-weight:900;color:var(--mg-ok)}
.mg-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.mg-off span{font-weight:800;font-size:14px;line-height:1.4;color:var(--mg-soft);overflow-wrap:anywhere}
.mg-off .mg-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.mg-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={run:null,res:null,arm:'',msg:'',bad:false,msgT:0,anim:true,top:true,sig:'',raf:0,timer:0,t0:0};
function say(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=now(); }
/* fundo: regra da casa (cenário da era atual pelo xEraBg) com o véu de noite de festa do mock por cima (azul-noite em cima, vinho embaixo) */
const bg=()=>{ try{ return typeof xEraBg==='function'?'linear-gradient(180deg,var(--mg-night1),var(--mg-night2) 55%,var(--mg-wine)),'+xEraBg(0.3,0.6):'#120c28'; }catch(e){ return '#120c28'; } };
const bgOff=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.6,0.9):'#16110d'; }catch(e){ return '#16110d'; } };
function sig(){ try{ const h=host(), M=MM(); return JSON.stringify([S.sys&&S.sys.minigame||null,M.dayKey(h&&typeof h.now==='function'?h.now():now()),lvlNow()]); }catch(e){ return ''; } }

/* ---------- O MARCADOR: posição (0 a 1) no instante t. É a MESMA conta para desenhar e para pontuar (nada de sorte escondida).
   Vai e volta; uma passada dura MG_PASS_MS dividido pelo speed do módulo. Depois de cada toque o marcador volta ao começo e espera MG_PAUSE_MS. ---------- */
function posAt(t){ const R=X.run; if(!R) return 0; const dt=t-R.t0; if(dt<=0) return 0; const pass=MG_PASS_MS/Math.max(0.2,num(R.r.speed)||1), ph=(dt/pass)%2; return c01(ph<=1?ph:2-ph); }
const paused=t=>{ const R=X.run; return !!(R&&t<R.t0); };
/* o herói da cena: o herói do jogo a pé, com a arma na mão (window.drawHeroFull), pés no chão da festa */
const canHero=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
function heroFrame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||120, h=c.clientHeight||124;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const x=c.getContext('2d'); if(!x) return; x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  x.save(); x.globalAlpha=.35; x.fillStyle='#000'; x.beginPath(); x.ellipse(w/2,h-6,30,6,0,0,7); x.fill(); x.restore();
  try{ window.drawHeroFull(x,w/2,h-8,(h-14)/HS,{t:Math.max(0,(ts-X.t0)/1000),mount:false,pet:false}); }catch(e){} x.setTransform(dpr,0,0,dpr,0,0); }
function loop(ts){ X.raf=0; const el=byId('mg_mk'), fl=byId('mg_fill'), cv=byId('mg_hero'), R=X.run; if(!isOn()||(!cv&&!(el&&R))){ X.t0=0; return; }
  if(el&&R){ const t=now(), p=(100*(paused(t)&&R.pos.length?num(R.pos[R.pos.length-1]):posAt(t))).toFixed(2)+'%'; try{ el.style.left=p; if(fl) fl.style.width=p; }catch(e){} }
  if(cv&&canHero()){ try{ heroFrame(cv,num(ts)||now()); }catch(e){} }
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&((X.run&&byId('mg_mk'))||(canHero()&&byId('mg_hero')))) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }
function stopTimer(){ if(X.timer){ try{ clearTimeout(X.timer); }catch(e){} X.timer=0; } }

/* ---------- HTML ---------- */
const RW={forge:['pedra de forja','pedras de forja'],food:['ração de pet','rações de pet'],essence:['essência','essências'],stones:['pedra de treino','pedras de treino']};
const rwText=(k,n)=>RW[k]?pl(n,RW[k][0],RW[k][1]):nT(n)+' '+String(k);
/* prêmio em etiquetas: só o que o módulo devolveu e é > 0 */
function rwHtml(rw){ const c=[]; rw=rw||{}; for(const k of Object.keys(rw)){ const n=num(rw[k]); if(n>0) c.push('<span class="mg-rw">'+ico(RW[k]?k:'item')+esc2(rwText(k,n))+'</span>'); } return c.join(''); }
const rwLine=rw=>Object.keys(rw||{}).filter(k=>num(rw[k])>0).map(k=>rwText(k,num(rw[k]))).join(', ');
const tierName=(v,id)=>{ const t=(v.tiers||[]).find(x=>x.id===id); return t?t.name:''; };
const tapsN=()=>{ try{ return Math.max(1,MM().DATA.taps|0); }catch(e){ return 10; } };
function offHtml(d,msg,role){ V.innerHTML=xWrap(d,'mg-root '+(X.anim?'mg-in':''),'<div class="mg-w" style="background:'+bgOff()+'"><div class="mg-off">'+ico('forja','big')+'<span role="'+(role||'alert')+'">'+esc2(msg)+'</span><button class="mg-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
const msgHtml=()=>'<div id="mg_msg" class="mg-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
/* A CENA (topo do mock): a festa das lanternas. A multidão pintada do mock não existe em assets/: ficam as lanternas em CSS (MG_LANTERNS) e o herói do jogo no centro */
const MG_LANTERNS=[[6,30,0],[18,12,.8],[31,34,1.6],[44,8,.4],[58,30,2.1],[70,10,1.2],[83,32,.2],[93,14,1.9]];
function sceneHtml(v){ const G=v.game||{};
  return '<div class="mg-scene">'+MG_LANTERNS.map(l=>'<i class="mg-lt" style="left:'+l[0]+'%;top:'+(l[1]+26)+'px;animation-delay:-'+l[2]+'s"></i>').join('')
    +'<canvas id="mg_hero" role="img" aria-label="Seu herói na festa do evento"></canvas><div class="mg-ttl">'+esc2(G.name||'Minijogo')+'<small>'+(v.event&&v.event.name?esc2(v.event.name):'Minijogo de evento')+'</small></div></div>'; }
/* a barra do mock: trilho escuro com moldura dourada, enchimento azul até o marcador, faixa vermelha acesa (largura zone, centrada em center, com as partes
   de BOM e PERFEITO nas frações do módulo) e o marcador dourado */
function barHtml(center,zone,mk,live){ const G=(()=>{ try{ return MM().DATA.grades||[]; }catch(e){ return []; } })(), fr=id=>{ const g=G.find(x=>x.id===id); return g?c01(num(g.max)*2):0; };
  const z=c01(num(zone)), l=c01(num(center)-z/2), p=(c01(num(mk))*100).toFixed(2)+'%';
  return '<div class="mg-bar" role="img" aria-label="Barra do minijogo: toque quando o marcador passar dentro da faixa"><span'+(live?' id="mg_fill"':'')+' class="mg-fill" style="width:'+p+'"></span>'
    +'<span class="mg-zone" style="left:'+(l*100).toFixed(2)+'%;width:'+(z*100).toFixed(2)+'%"><u style="width:'+(fr('good')*100).toFixed(1)+'%"></u><u class="p" style="width:'+(fr('perfect')*100).toFixed(1)+'%"></u></span>'
    +'<i'+(live?' id="mg_mk"':'')+' class="mg-mk" style="left:'+p+'"></i></div>'; }
const dotsHtml=(marks,total)=>{ let h=''; for(let i=0;i<total;i++){ const g=marks[i]; h+='<i'+(g?' class="'+esc2(g.id||g.grade||'miss')+'"':'')+'></i>'; } return '<div class="mg-dots" role="img" aria-label="'+esc2(marks.length+' de '+total+' toques')+'">'+h+'</div>'; };
const LEG='<div class="mg-leg" aria-hidden="true"><span><i style="background:var(--mg-perfect)"></i>Perfeito</span><span><i style="background:var(--mg-good)"></i>Bom</span><span><i style="background:var(--mg-graze)"></i>Raspou</span><span><i style="background:var(--mg-miss)"></i>Errou</span></div>';
const statsHtml=(a,av,b,bv)=>'<div class="mg-stats"><div><small>'+a+'</small><b>'+av+'</b></div><div><small>'+b+'</small><b>'+bv+'</b></div></div>';
/* o meio da tela: a barra, o "Toque!" gigante (durante a partida) ou o botão dourado Jogar, e a faixa Toques / Acertos do mock */
function playHtml(v){ const R=X.run, taps=tapsN(), G=v.game||{}; let h='<div class="mg-pad">';
  if(R){ const t=now(), pz=paused(t)&&R.pos.length>0, i=pz?R.i-1:R.i, last=R.marks[R.marks.length-1], hits=R.marks.filter(g=>g&&g.id!=='miss').length;
    h+=barHtml(R.r.centers[i],R.r.zone,pz?R.pos[R.pos.length-1]:posAt(t),true)+'<p class="mg-gr '+(last?esc2(last.id):'')+'" role="status">'+(last?esc2(last.name)+' +'+nT(last.pts):'')+'</p>'
      +'<button class="mg-tap" data-x="hit" aria-label="Toque para parar o marcador">Toque!</button></div>'+statsHtml('Toques',nT(R.i)+'/'+nT(taps),'Acertos',nT(hits))
      +'<div class="mg-pad">'+dotsHtml(R.marks,taps)+'<div class="mg-acts">'+(X.arm==='quit'?'<button class="mg-bt b sm" data-x="quitok">Confirmar: sair da partida</button>':'<button class="mg-bt o sm" data-x="quit">Sair da partida</button>')+'</div></div>'; return h; }
  const left=num(v.triesLeft), max=Math.max(0,Math.round(num(v.triesMax)));
  h+=barHtml(0.5,G.zone,0.22,false);
  if(X.res){ const r=X.res, tn=tierName(v,r.tier);
    h+='<p class="mg-score" role="status" style="margin-top:10px">'+pl(r.score,'ponto','pontos')+(tn?' · '+esc2(tn):'')+'</p>'+dotsHtml(r.taps.map(x=>({id:x.grade})),taps)+LEG+(r.record?'<p class="mg-txt">Novo melhor resultado de hoje.</p>':''); }
  else h+='<p class="mg-txt">'+esc2(G.txt||'')+' São '+nT(taps)+' toques: quanto mais perto do meio da faixa, mais pontos.</p>'+LEG;
  if(X.arm==='play'&&left>0) h+='<p class="mg-txt">Gasta 1 das suas tentativas de hoje. Sair no meio não devolve.</p><div class="mg-acts"><button class="mg-bt b go" data-x="playok">Confirmar: gastar 1 tentativa</button></div>';
  else h+='<div class="mg-acts"><button class="mg-bt go'+(left>0?'':' o dim')+'" data-x="play">'+esc2(left>0?(X.res?'Jogar de novo':'Jogar'):why('tries'))+'</button></div>';
  return h+'</div>'+statsHtml('Tentativas',nT(left)+'/'+nT(max),'Melhor de hoje',nT(v.best)); }
/* OS TRÊS BAÚS (base do mock) = as três faixas de prêmio do dia, ligados pelo trilho que enche até a melhor faixa de hoje. Baú com pedras, nunca moedas */
function chestsHtml(v){ const T=v.tiers||[]; if(!T.length) return ''; const at=T.findIndex(t=>t.id===v.tier), fill=at<=0?0:Math.min(100,at*100/Math.max(1,T.length-1));
  let h='<div class="mg-pad"><div class="mg-chs" role="group" aria-label="Prêmio do dia por faixa"><span class="mg-rail"><u style="width:'+fill.toFixed(0)+'%"></u></span>';
  T.forEach((t,i)=>{ const on=at>=i; h+='<div class="mg-ch '+(on?'on':'z')+'">'+ico(on?'open':'chest','chest')+'<b>'+esc2(t.name)+'</b><small>'+pl(t.min,'ponto','pontos')+'</small>'+rwHtml(t.reward)+(v.tier===t.id?'<em>'+(v.claimed?'Resgatado':'Sua faixa')+'</em>':'')+'</div>'; });
  return h+'</div></div>'; }
function prizeHtml(v){ let h='<section class="mg-sec"><div class="mg-h5">Prêmio do dia</div><p class="mg-p">'+(num(v.best)>0?'Melhor de hoje: '+pl(v.best,'ponto','pontos')+(v.tier?' · '+esc2(tierName(v,v.tier)):'')+'.':'Você ainda não jogou hoje.')+' O prêmio é o da sua melhor faixa, uma vez por dia.</p>';
  if(v.claimed) h+='<p class="mg-p">Prêmio de hoje resgatado.</p>';
  else if(v.canClaim){ h+=X.arm==='claim'?'<p class="mg-p">Resgatar encerra o prêmio de hoje. Para tentar uma faixa melhor, jogue antes de resgatar.</p><div class="mg-acts"><button class="mg-bt b" data-x="claimok">Confirmar: resgatar '+esc2(tierName(v,v.tier))+'</button></div>'
      :'<div class="mg-acts"><button class="mg-bt" data-x="claim">Resgatar o prêmio do dia</button></div>'; }
  else h+='<div class="mg-acts"><button class="mg-bt o dim" data-x="claim">'+esc2(why('tier'))+'</button></div>';
  return h+'</section>'; }
function mileHtml(v){ const L=v.milestones||[]; if(!L.length) return ''; const days=num(v.days);
  let h='<section class="mg-sec"><div class="mg-h5">Marcos do tema</div><p class="mg-p">Dias com '+esc2(((v.tiers||[])[0]||{}).name||'a 1ª faixa')+' ou mais neste tema: '+nT(days)+'.</p>';
  for(const m of L){ const miss=Math.max(0,num(m.days)-days);
    h+='<div class="mg-tr"><b>'+pl(m.days,'dia','dias')+'</b><span>'+rwHtml(m.reward)+'</span>'+(m.claimed?'<em>Resgatado</em>':m.reached?'<button class="mg-bt sm" data-x="mile" data-d="'+esc2(m.days)+'">Resgatar</button>':'<em style="color:var(--mg-mut)">faltam '+pl(miss,'dia','dias')+'</em>')+'</div>'; }
  return h+'<p class="mg-p" style="margin-top:8px"><b>Nada à venda.</b> As tentativas são grátis e voltam todo dia.</p></section>'; }
function draw(){
  const d=xDims(240)||{};
  if(!has()){ loopStop(); offHtml(d,'Minijogo indisponível agora.'); return; }
  if(!isOn()){ loopStop(); offHtml(d,'O minijogo de evento ainda não abriu.'); return; }   /* desligado: não chama status/view (eles preparam o save) */
  if(locked()){ loopStop(); offHtml(d,'O minijogo abre no nível '+nT(lvlNeed())+', junto com os Eventos. Continue lutando para liberar.','status'); return; }
  const v=viewNow(); if(!v){ loopStop(); offHtml(d,'Minijogo indisponível agora.'); return; }
  if(!v.open){ loopStop(); offHtml(d,v.reason==='soon'?why('soon')+(v.startsAt?': dia '+dayText(v.startsAt):'')+'.':why(v.reason||'off'),'status'); return; }
  let y0=0; try{ const sc0=X.top?null:byId('mg_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const h='<div id="mg_scroll" class="x-scroll mg-body">'+sceneHtml(v)+playHtml(v)+msgHtml()+chestsHtml(v)+(X.run?'':prizeHtml(v)+mileHtml(v))+'</div>';
  V.innerHTML=xWrap(d,'mg-root '+(X.anim?'mg-in':''),'<div class="mg-w" style="background:'+bg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=sig();
  if(y0){ try{ const sc=byId('mg_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  loopStart();
}

/* ---------- a partida ---------- */
/* fim: Sys.minigame.finish UMA vez com as posições tocadas (o que faltou conta como não tocado) */
function finishRun(quiet){ const R=X.run; if(!R) return null; X.run=null; X.arm=''; stopTimer(); loopStop(); let r=null; try{ r=MM().finish(S,host(),R.pos.slice()); }catch(e){ r=null; }
  store(); if(quiet) return r;
  if(r&&r.ok){ X.res=r; sfx(r.tier?'claim':'ui_tap'); X.msg=''; } else { X.res=null; say(why(r||'error'),true); }
  X.top=true; return r; }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
const ACT={
  back(){ sfx('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  /* 1º toque: arma (ou diz por que não dá). Nada é chamado no módulo */
  play(){ if(X.run) return; sfx('ui_tap'); const v=viewNow(); if(!v||!v.open) return;
    if(num(v.triesLeft)<=0){ X.arm=''; say(why('tries'),true); return redraw(); }
    X.arm='play'; say('Toque em Confirmar para começar.'); redraw(); },
  /* 2º toque: Sys.minigame.start UMA vez */
  playok(){ if(X.run) return; if(X.arm!=='play'){ sfx('ui_tap'); say('Toque primeiro no botão dourado.',true); return redraw(); } X.arm='';
    let r=null; try{ r=MM().start(S,host()); }catch(e){ r=null; }
    if(!r||!r.ok||!Array.isArray(r.centers)||!r.centers.length){ sfx('ui_tap'); say(why(r||'error'),true); return redraw(); }
    store(); sfx('ui_ok'); X.res=null; X.msg=''; X.run={r:r,i:0,pos:[],marks:[],t0:now()+MG_PAUSE_MS}; X.top=true; redraw(); },
  /* PARAR: a posição é a do marcador neste instante; a nota é a do módulo */
  hit(){ const R=X.run; if(!R) return; const t=now(); if(t<R.t0) return;   /* na pausa entre toques nada conta */
    const p=posAt(t); let g=null; try{ g=MM().grade(p,R.r.centers[R.i],R.r.zone); }catch(e){ g=null; } if(!g) g={id:'miss',name:'ERROU',pts:0};
    R.pos.push(p); R.marks.push(g); R.i++; X.arm=''; sfx(g.id==='miss'?'ui_tap':g.id==='perfect'?'crit':'hit');
    if(R.i>=R.r.centers.length){ finishRun(false); return redraw(); }
    R.t0=t+MG_PAUSE_MS; stopTimer(); if(typeof setTimeout==='function') X.timer=setTimeout(()=>{ X.timer=0; if(X.run) redraw(); },MG_PAUSE_MS+20);
    redraw(); },
  quit(){ if(!X.run) return; sfx('ui_tap'); X.arm='quit'; say('Sair agora encerra a partida: os toques que faltam contam como erro.'); redraw(); },
  quitok(){ if(!X.run) return; if(X.arm!=='quit'){ sfx('ui_tap'); say('Toque primeiro em Sair da partida.',true); return redraw(); } finishRun(false); redraw(); },
  claim(){ if(X.run) return; sfx('ui_tap'); const v=viewNow(); if(!v||!v.open) return;
    if(v.claimed){ X.arm=''; say(why('claimed'),true); return redraw(); }
    if(!v.canClaim){ X.arm=''; say(why('tier'),true); return redraw(); }
    X.arm='claim'; say('Toque em Confirmar para resgatar.'); redraw(); },
  claimok(){ if(X.run) return; if(X.arm!=='claim'){ sfx('ui_tap'); say('Toque primeiro no botão dourado.',true); return redraw(); } X.arm='';
    let r=null; try{ r=MM().claimDay(S,host()); }catch(e){ r=null; }
    if(r&&r.ok){ store(); sfx('claim'); const v=viewNow(); say('Prêmio de '+(v?tierName(v,r.tier):'hoje')+' recebido: '+rwLine(r.reward)+'.'); } else { sfx('ui_tap'); say(why(r||'error'),true); }
    redraw(); },
  mile(b){ if(X.run) return; const dd=parseInt(b.dataset.d,10); let r=null; try{ r=MM().claimMilestone(S,host(),dd); }catch(e){ r=null; } X.arm='';
    if(r&&r.ok){ store(); sfx('claim'); say('Marco de '+pl(r.days,'dia','dias')+' recebido: '+rwLine(r.reward)+'.'); } else { sfx('ui_tap'); say(why(r||'error'),true); }
    redraw(); } };
function click(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!isOn()||locked()) return;                         /* desligado ou trancado por nível: só o Voltar funciona */
  if(a!=='playok'&&a!=='claimok'&&a!=='quitok'&&a!=='play'&&a!=='claim'&&a!=='quit'&&a!=='hit') X.arm='';
  return ACT[a](b); }

/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[]; try{ const b=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(b) u.push(b); }catch(e){}
  if(MG_ART_ON) for(const k in MG_SVG) u.push(MG_ART_DIR+k+'.png'); return u; }
function clearMsg(){ X.msg=''; const el=byId('mg_msg'); if(el) el.innerHTML=''; }
const panelOn=()=>{ try{ return !!(window.Panels&&typeof Panels.on==='function'&&Panels.on(N)); }catch(e){ return false; } };
/* selo (aba ou item de Eventos): o número do módulo. Tela ou módulo desligado, ou trancado = 0 (e nada é lido do save) */
function alerts(){ try{ if(!panelOn()||!isOn()||locked()) return 0; return num(MM().badge(S,host())); }catch(e){ return 0; } }

if(!('minigame' in PANEL_ON)) PANEL_ON.minigame=false;
const def=Panels.add(N,{title:'Minijogo de evento',actions:Object.keys(ACT),iconOf:icoOf,urls:urls,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.sig==='x'||X.run) return;
    if(X.msg&&!X.arm&&now()-X.msgT>MG_MSG_MS) clearMsg();
    if(X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return !!X.run; },
  onOpen(){ stopTimer(); loopStop(); X.run=null; X.res=null; X.arm=''; X.msg=''; X.anim=true; X.top=true; X.sig='';
    try{ if(typeof pwLoad==='function') pwLoad(urls()); }catch(e){} },
  /* sair da tela no meio da partida: a partida é encerrada com o que foi tocado (a tentativa já foi gasta no começo) */
  onClose(){ if(X.run&&isOn()) finishRun(true); stopTimer(); loopStop(); X.run=null; X.res=null; X.arm=''; X.msg=''; } });
window.PMinigame={X:X,def:def,urls:urls,alerts:alerts,posAt:posAt,PASS_MS:MG_PASS_MS,PAUSE_MS:MG_PAUSE_MS,open(){ try{ return !!(window.Panels&&Panels.open(N)); }catch(e){ return false; } }};
})();
