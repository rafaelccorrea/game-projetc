'use strict';
/* ================= TELA GRIMÓRIO DAS ERAS (docs/proto/v2/GrimorioV3.html, aprovado pelo dono) — NASCE DESLIGADA (PANEL_ON.grim = false) =================
   Só a TELA: lista das 18 magias por era, detalhe, as 3 casas, os 3 conjuntos (Fases, Arena, Chefe) e subir de nível. A luta (magias saindo sozinhas,
   coluna com anel de recarga) NÃO é daqui.
   NENHUMA regra e NENHUM número aqui. De onde vem cada coisa (js/sys/grimoire.js, Sys.grimoire):
   - tudo o que a tela mostra: Sys.grimoire.view(S, host) (eras, magias, nível, páginas, custo, canLevel, bônus, conjuntos, "como conseguir");
   - texto da magia: Sys.grimoire.spell(id).desc; efeito, recarga e bônus do PRÓXIMO nível: Sys.grimoire.catalog(nível + 1);
   - colocar e tirar: Sys.grimoire.equip(S, modo, posição, id | null); subir: Sys.grimoire.levelUp(S, id, host) (a recusa do módulo vira o aviso);
   - de onde vêm páginas e tinta: Sys.grimoire.DATA.grants e DATA.learn.
   MAGIA NUNCA É VENDIDA: a tela não tem preço, botão de compra, sorteio nem pressa. O que falta mostra "como conseguir" (texto do módulo).
   Chaves: PANEL_ON.grim (esta tela) e Sys.grimoire.DATA.on (o sistema). Com o sistema desligado a tela mostra um aviso e o Voltar.
   O cabeçalho (Voltar, título) é do jogo. O arquivo roda em escopo próprio. */
(function(){
const N='grim';

/* ---------- ÍCONES DAS 18 MAGIAS: UMA função (iconOf). Enquanto a Arte não entrega os finais, a reserva é desenhada aqui (círculo na cor da era + símbolo).
   Quando os 18 arquivos existirem em GM_ART_DIR (<id>.png, o id do módulo), basta trocar GM_ART_ON para true. ---------- */
const GM_ART_ON=true, GM_ART_DIR='assets/icons/grimoire/';
const GM_ERA=['#a8794a','#e0b040','#d64a4a','#2fa7a0','#8a8f9c','#3f8cff','#22c7d8','#9b3fd9','#f0d860'];   /* cor de cada era (igual ao protótipo) */
const GM_GLY={
  rollingStone:'<circle cx="20" cy="20" r="9"/><path d="M15 17l4 3-2 4M24 14l-2 5 4 2M8 31h24"/>',
  ancestralFire:'<path d="M20 8c3 5 8 7 8 14a8 8 0 01-16 0c0-4 3-6 3-9 2 2 3 3 3 5 1-3 0-6 2-10z"/>',
  bronzePhalanx:'<path d="M20 8l11 4v8c0 7-5 11-11 13-6-2-11-6-11-13v-8z"/><path d="M20 12v18M12 19h16"/>',
  minotaurSpear:'<path d="M10 30L27 13M13 23l4 4"/><path d="M24 9h7v7z" fill="currentColor"/>',
  knightCharge:'<path d="M15 10l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9v-6z"/><path d="M25 21h8M29 17l4 4-4 4"/>',
  royalBreath:'<path d="M7 20h7M7 14c4 0 6 2 8 2M7 26c4 0 6-2 8-2"/><path d="M18 20c3-6 9-6 14-4-2 1-3 2-3 4s1 3 3 4c-5 2-11 2-14-4z"/>',
  cannonball:'<circle cx="18" cy="23" r="9"/><path d="M24 16l4-4M28 12l3-1M28 12l1-3"/>',
  ghostFog:'<path d="M7 14c3-2 5 2 8 0s5 2 8 0 5 2 8 0M7 20c3-2 5 2 8 0s5 2 8 0 5 2 8 0M7 26c3-2 5 2 8 0s5 2 8 0 5 2 8 0"/>',
  gearSpin:'<circle cx="20" cy="20" r="4"/><circle cx="20" cy="20" r="9"/><path d="M20 7v4M20 29v4M7 20h4M29 20h4M11 11l3 3M26 26l3 3M11 29l3-3M26 14l3-3"/>',
  steamBoiler:'<rect x="11" y="18" width="18" height="13" rx="3"/><path d="M15 14c0-3 3-3 3-6M22 14c0-3 3-3 3-6M15 24h10"/>',
  droneRain:'<path d="M13 12h14M16 12v3h8v-3"/><circle cx="11" cy="11" r="2.5"/><circle cx="29" cy="11" r="2.5"/><path d="M14 21v4M20 20v6M26 21v4M17 29v3M23 29v3"/>',
  medKit:'<rect x="9" y="13" width="22" height="17" rx="3"/><path d="M20 17v9M15.5 21.5h9M16 13v-3h8v3"/>',
  plasmaRay:'<path d="M22 7L12 22h7l-2 11 11-16h-7z"/>',
  ionShield:'<path d="M20 7l11 6.5v13L20 33 9 26.5v-13z"/><path d="M20 13l6 3.5v7L20 27l-6-3.5v-7z"/>',
  underChains:'<g transform="rotate(-30 20 20)"><rect x="6" y="16" width="14" height="8" rx="4"/><rect x="20" y="16" width="14" height="8" rx="4"/></g>',
  infernalFlame:'<path d="M11 31c-3-2-2-6 0-9 2 3 4 5 2 9zM20 31c-4-3-3-9 0-15 3 6 4 12 0 15zM29 31c-2-4 0-6 0-9 2 3 3 6 0 9z"/>',
  judgeBlessing:'<circle cx="20" cy="20" r="6"/><path d="M20 7v4M20 29v4M7 20h4M29 20h4M11 11l3 3M26 26l3 3M11 29l3-3M26 14l3-3"/>',
  lightLance:'<path d="M8 30L26 12M14 33l18-18"/><path d="M21 11h6v6M27 14h6v6"/>'};
const gmLight=c=>{ const v=parseInt(c.slice(1),16); return (0.299*(v>>16)+0.587*((v>>8)&255)+0.114*(v&255))>170; };
const gmDark=(c,k)=>{ const v=parseInt(c.slice(1),16), f=x=>Math.round(x*(1-k)).toString(16).padStart(2,'0'); return '#'+f(v>>16)+f((v>>8)&255)+f(v&255); };
const GM_LOCK='<circle cx="31" cy="31" r="7.5" fill="#1d1611" stroke="#8d96c0" stroke-width="1.5"/><path d="M28 30.5h6v5h-6zM29.3 30.5v-1.8a1.7 1.7 0 013.4 0v1.8" fill="none" stroke="#c9d0f5" stroke-width="1.4" stroke-linejoin="round"/>';
/* iconOf(id, locked): o desenho do ícone de uma magia (sem tamanho: quem usa põe dentro de uma caixa .gm-i) */
function iconOf(id,locked){ let sp=null; try{ sp=gM().spell(id); }catch(e){}
  if(GM_ART_ON&&sp) return '<img src="'+esc2(GM_ART_DIR+id+'.png')+'" alt=""'+(locked?' class="lk"':'')+'>';
  const era=sp?Math.max(0,Math.min(GM_ERA.length-1,sp.era|0)):0, c=locked?'#4a3a2b':GM_ERA[era], gc=locked?'#8d96c0':gmLight(c)?'#2a1a06':'#ffffff';
  const gly=GM_GLY[id]||'<text x="20" y="26" text-anchor="middle" font-size="17" font-weight="900" stroke="none" fill="'+gc+'">'+esc2(String(sp&&sp.name||'?').charAt(0))+'</text>';
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="19.5" fill="'+gmDark(c,0.5)+'"/><circle cx="20" cy="20" r="16.5" fill="'+c+'"/><ellipse cx="20" cy="12" rx="11" ry="5.5" fill="#fff" opacity=".2"/>'
    +'<g fill="none" stroke="'+gc+'" color="'+gc+'" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">'+gly+'</g>'+(locked?GM_LOCK:'')+'</svg>'; }
const gIco=(id,locked)=>'<span class="gm-i">'+iconOf(id,locked)+'</span>';
const GM_INK='<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M13 3c3 5 7 8 7 13a7 7 0 01-14 0c0-5 4-8 7-13z" fill="#5a3fd0" stroke="#c9b8ff" stroke-width="1.6"/><ellipse cx="10.5" cy="15" rx="2" ry="3" fill="#fff" opacity=".35"/></svg>';

/* ---------- leituras do módulo ISOLADAS ---------- */
const gM=()=>(window.Sys&&Sys.grimoire)||null;
const gHas=()=>{ const M=gM(); return !!(M&&M.DATA&&typeof M.view==='function'&&typeof M.equip==='function'&&typeof M.levelUp==='function'&&typeof M.spell==='function'); };
const gOk=()=>{ try{ return gHas()&&gM().DATA.on===true; }catch(e){ return false; } };
const gHost=()=>(window.Sys&&Sys.host)||null;
const gClamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gF1=v=>(Math.round((+v||0)*10)/10).toFixed(1).replace('.',',');
const gSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const gRedraw=()=>{ try{ if(typeof render==='function') render(); }catch(e){} };
const gStore=()=>{ try{ if(typeof save==='function') save(); }catch(e){} };
const gNow=()=>Date.now();
const gPl=(n,one,many)=>n0(n)+' '+(n===1?one:many);

/* ---------- RÓTULOS (só texto de tela; nenhum número de regra) ---------- */
const GM_KIND={dmg:'Dano',heal:'Cura',shield:'Escudo',buff:'Reforço'};
const GM_PN={atkPct:'ATQ',hpPct:'Vida',defPct:'DEF',critPct:'Crítico'};
const GM_HINT={fases:'Usado nas ondas das fases. Se Chefe ou Arena estiverem vazios, a luta usa este.',arena:'Usado na Arena e no Torneio.',chefe:'Usado contra chefe, Senhor da Era e Chefe Mundial.'};
const gPass=(key,val)=>(GM_PN[key]||'Bônus')+' +'+gF1(val)+(key==='critPct'?' pts':'%');

(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.gm-root{color:#f6ecdf}
.gm-root,.gm-root *{box-sizing:border-box}
.gm-root button{font-family:Nunito,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent}
.gm-lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.gm-w{position:relative;flex:1;min-height:0;min-width:0;width:100%;display:flex;flex-direction:column;overflow:hidden}
.gm-in{animation:gm-in .25s ease-out both}
@keyframes gm-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes gm-up{from{transform:translateY(30px);opacity:.3}}
.gm-i{flex:none;display:block;width:44px;height:44px}
.gm-i svg,.gm-i img{display:block;width:100%;height:100%;object-fit:contain}
.gm-i img.lk{filter:grayscale(1) brightness(.55)}
.gm-top{flex:none;display:flex;align-items:center;gap:8px;padding:8px 12px 0;min-width:0}
.gm-cnt{flex:1;min-width:0;font-size:12px;font-weight:900;color:#ffe9c4;line-height:1.25;overflow-wrap:anywhere}
.gm-ink{flex:none;display:flex;align-items:center;gap:5px;min-height:34px;padding:0 11px 0 4px;border-radius:17px;background:rgba(22,16,12,.78);border:1px solid rgba(255,236,200,.3);font-weight:900;font-size:13px;font-variant-numeric:tabular-nums}
.gm-ink svg{width:26px;height:26px;flex:none}
.gm-ink small{font-size:10px;font-weight:900;color:#c9b8a2}
.gm-msg{flex:none;min-height:20px;margin:3px 12px 0;font-size:12px;font-weight:900;line-height:1.3;text-align:center;color:#ffe07a;overflow-wrap:anywhere}
.gm-msg.bad{color:#ffb3a8}
.gm-body{position:relative;flex:1;min-height:0;padding:2px 12px 20px}
.gm-prov{font-size:11px;font-weight:800;color:#c9b8a2;margin:2px 0 8px;line-height:1.4;overflow-wrap:anywhere}
.gm-h5{margin:14px 0 6px;font-size:11px;letter-spacing:1.3px;text-transform:uppercase;color:#c9b8a2;font-weight:900;overflow-wrap:anywhere}
.gm-h5 small{display:block;text-transform:none;letter-spacing:0;font-size:11px;color:#e9dcc8;margin-top:1px}
.gm-box{border-radius:16px;background:rgba(0,0,0,.42);border:1px solid rgba(255,236,200,.16);padding:2px 10px 10px;min-width:0}
.gm-box .gm-h5{margin-top:8px}
.gm-b4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
.gm-b4 div{border-radius:12px;background:rgba(255,236,200,.06);padding:7px 2px;text-align:center;min-width:0}
.gm-b4 b{display:block;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:17px;color:#7fe07a;white-space:nowrap}
.gm-b4 small{display:block;font-size:10px;font-weight:900;color:#c9b8a2;line-height:1.2}
.gm-b4 .z b{color:#7a6a58}
.gm-note{margin:8px 0 0;font-size:10.5px;font-weight:800;color:#c9b8a2;line-height:1.4;overflow-wrap:anywhere}
.gm-none{border-radius:16px;background:rgba(255,201,74,.08);border:1px solid rgba(255,201,74,.35);padding:10px 12px;margin-bottom:10px;min-width:0}
.gm-none b{display:block;font-size:14px;font-weight:900;color:#ffe9c4;line-height:1.25}
.gm-none p{margin:4px 0 0;font-size:12px;font-weight:700;line-height:1.45;color:#efe3d0;overflow-wrap:anywhere}
.gm-none ul{margin:4px 0 0;padding-left:16px;font-size:12px;font-weight:700;line-height:1.5;color:#efe3d0}
.gm-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.gm-tab,.xs .gm-tab{min-width:0;min-height:44px;border-radius:12px;border:1px solid rgba(255,236,200,.3);background:rgba(0,0,0,.4);font-weight:900;font-size:14px;color:#f6ecdf;padding:0 2px}
.gm-tab[aria-selected="true"],.xs .gm-tab[aria-selected="true"]{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#ffc94a}
.gm-hint{margin:6px 0 0;font-size:11px;font-weight:800;color:#c9b8a2;line-height:1.4;overflow-wrap:anywhere}
.gm-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:8px}
.gm-slot,.xs .gm-slot{display:flex;flex-direction:column;align-items:center;gap:3px;min-height:104px;padding:8px 4px;border-radius:14px;border:1.5px dashed rgba(255,236,200,.3);background:rgba(0,0,0,.4);min-width:0;color:#f6ecdf}
.gm-slot .gm-i{width:46px;height:46px}
.gm-emp{flex:none;display:block;width:46px;height:46px;border-radius:50%;border:2px dashed rgba(255,236,200,.35);background:rgba(22,16,12,.5)}
.gm-slot b{font-size:11.5px;font-weight:900;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.gm-slot small{font-size:10px;font-weight:800;color:#c9b8a2}
.gm-slot.sel,.xs .gm-slot.sel{border:2px solid #ffc94a;background:rgba(255,201,74,.1);box-shadow:0 0 12px rgba(255,201,74,.35)}
.gm-era{margin-top:12px}
.gm-era h4{display:flex;align-items:center;gap:7px;margin:0 0 6px;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:16px;letter-spacing:.4px;color:#ffe9c4;overflow-wrap:anywhere}
.gm-era h4 i{width:12px;height:12px;border-radius:50%;flex:none;box-shadow:0 0 6px rgba(255,255,255,.3)}
.gm-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.gm-sp,.xs .gm-sp{display:flex;align-items:center;gap:7px;min-height:66px;padding:8px 6px;border-radius:14px;background:rgba(0,0,0,.42);border:1px solid rgba(255,236,200,.16);text-align:left;min-width:0;color:#f6ecdf}
.gm-sp .gm-i{width:40px;height:40px}
.gm-sp .t{min-width:0;flex:1;display:flex;flex-direction:column;gap:2px}
.gm-sp b{font-size:12px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.gm-sp small{font-size:10px;font-weight:800;color:#c9b8a2;line-height:1.25;overflow-wrap:anywhere}
.gm-sp .tg{display:flex;flex-wrap:wrap;gap:3px}
.gm-sp .tg i{font-style:normal;font-size:9px;font-weight:900;padding:1px 5px;border-radius:6px;background:rgba(255,201,74,.16);color:#ffd98a}
.gm-sp .tg i.up{background:rgba(127,224,122,.18);color:#7fe07a}
.gm-sp.lock,.xs .gm-sp.lock{background:rgba(0,0,0,.3);border-style:dashed}
.gm-sp.lock b{color:#b8a690}
.gm-sp.on,.xs .gm-sp.on{border-color:#ffc94a}
.gm-sp:active,.gm-slot:active{transform:translateY(2px)}
.gm-src{margin-top:14px;border-radius:16px;background:rgba(0,0,0,.42);border:1px solid rgba(255,236,200,.16);padding:2px 12px 12px;min-width:0}
.gm-src ul{margin:0;padding-left:16px;font-size:12px;line-height:1.5;font-weight:700;overflow-wrap:anywhere}
.gm-src li b{color:#ffc94a}
.gm-src p{margin:8px 0 0;font-size:12px;font-weight:800;line-height:1.45;color:#efe3d0;overflow-wrap:anywhere}
.gm-src p b{color:#7fe07a}
.gm-shade{position:absolute;inset:0;z-index:2;background:rgba(10,6,3,.66)}
.gm-sh{position:absolute;left:0;right:0;bottom:0;z-index:3;max-height:92%;border-radius:22px 22px 0 0;background:#1d1611;border-top:2px solid #4a3a2b;padding:14px 14px 18px;animation:gm-up .28s ease-out;box-shadow:0 -10px 30px rgba(0,0,0,.55)}
.gm-shh{display:flex;align-items:center;gap:10px;min-width:0}
.gm-shh .gm-i{width:60px;height:60px}
.gm-shh>div{flex:1;min-width:0}
.gm-shh h3{margin:0;font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:21px;line-height:1.1;overflow-wrap:anywhere}
.gm-shh p{margin:2px 0 0;font-size:11.5px;font-weight:800;color:#c9b8a2;line-height:1.3;overflow-wrap:anywhere}
.gm-lv{flex:none;align-self:flex-start;padding:4px 9px;border-radius:10px;background:rgba(255,201,74,.15);color:#ffc94a;font-weight:900;font-size:12px;white-space:nowrap}
.gm-lv.no{background:rgba(255,255,255,.07);color:#c9b8a2}
.gm-dsc{margin:10px 0 0;font-size:13px;font-weight:700;line-height:1.45;color:#efe3d0;overflow-wrap:anywhere}
.gm-rows{margin-top:10px;display:flex;flex-direction:column;gap:5px}
.gm-rw{display:flex;gap:8px;align-items:baseline;padding:7px 10px;border-radius:12px;background:rgba(0,0,0,.3);border:1px solid rgba(255,236,200,.16);font-size:12.5px;font-weight:800;line-height:1.35;min-width:0}
.gm-rw>span{flex:none;width:78px;font-size:10px;letter-spacing:.6px;text-transform:uppercase;color:#c9b8a2;font-weight:900;overflow-wrap:anywhere}
.gm-rw>div{flex:1;min-width:0;overflow-wrap:anywhere}
.gm-rw em{font-style:normal;color:#7fe07a}
.gm-prg{margin-top:10px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.gm-prg>div{min-width:0}
.gm-prg small{display:flex;justify-content:space-between;gap:4px;font-size:10px;font-weight:900;color:#c9b8a2;letter-spacing:.6px}
.gm-prg small b{color:#f6ecdf;font-variant-numeric:tabular-nums}
.gm-prg i{display:block;position:relative;height:10px;margin-top:3px;border-radius:5px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.gm-prg i u{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:linear-gradient(90deg,#ff8a3c,#ffd25e)}
.gm-prg i.ok u{background:linear-gradient(90deg,#9cf08f,#3fae3c)}
.gm-how{margin-top:10px;padding:8px 12px;border-radius:12px;background:rgba(255,201,74,.07);border:1px solid rgba(255,201,74,.3);min-width:0}
.gm-how b{font-size:11px;letter-spacing:.8px;text-transform:uppercase;color:#ffc94a}
.gm-how p,.gm-how ul{margin:3px 0 0;font-size:12.5px;font-weight:700;line-height:1.45;overflow-wrap:anywhere}
.gm-how ul{padding-left:16px}
.gm-sh .gm-msg{margin:8px 0 0}
.gm-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.gm-bt,.xs .gm-bt{flex:1 1 128px;min-width:0;min-height:48px;border-radius:14px;font-weight:900;font-size:13.5px;line-height:1.15;padding:4px 8px;text-align:center;overflow-wrap:anywhere;border:0;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 3px 0 #9a5a10}
.gm-bt.o,.xs .gm-bt.o{background:rgba(255,236,200,.06);border:1px solid rgba(255,236,200,.25);color:#f6ecdf;box-shadow:none}
.gm-bt.b,.xs .gm-bt.b{background:linear-gradient(180deg,#9cf08f,#3fae3c);color:#0d2410;box-shadow:0 3px 0 #1f6a1c}
.gm-bt:active{transform:translateY(2px)}
.gm-off{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.gm-off span{font-weight:800;font-size:14px;line-height:1.4;color:#efe3d0;overflow-wrap:anywhere}
.gm-off .gm-bt{flex:none;min-width:140px;font-size:16px}
@media (prefers-reduced-motion:reduce){.gm-root *{animation-duration:.01ms!important;animation-iteration-count:1!important}}
`; document.head.appendChild(st); })();

/* ---------- estado da tela (nada disto vai para o save) ---------- */
const X={mode:'fases',slot:0,sel:null,arm:null,msg:'',bad:false,msgT:0,anim:true,top:true,sig:''};
function gSay(m,bad){ X.msg=String(m||''); X.bad=!!bad; X.msgT=gNow(); }
const gMsgHtml=id=>'<div id="'+id+'" class="gm-msg'+(X.msg&&X.bad?' bad':'')+'" role="status">'+(X.msg?esc2(X.msg):'')+'</div>';
const gBg=()=>{ try{ return typeof xEraBg==='function'?xEraBg(0.55,0.9):'#16110d'; }catch(e){ return '#16110d'; } };

/* a visão do módulo achatada: uma linha por magia, com a era e a letra (1ª ou 2ª magia da era) */
function gRows(v){ const out=[]; for(const e of (v.eras||[])) (e.spells||[]).forEach((s,i)=>{ out.push(Object.assign({era:e.era|0,eraName:e.name,first:i===0},s)); }); return out; }
/* motivo de uma recusa do módulo, em texto de jogador */
function gReason(r,row,v){ const c=r&&r.cost, why=r&&r.reason;
  if(why==='pages'&&c&&row) return 'Faltam '+gPl(Math.max(1,c.pages-(row.pages|0)),'página','páginas');
  if(why==='ink'&&c) return 'Faltam '+n0(Math.max(1,c.ink-(v?v.ink|0:0)))+' de tinta';
  if(why==='max') return 'Nível máximo';
  if(why==='notOwned') return 'Aprenda a magia primeiro';
  if(why==='off') return 'O Grimório ainda não abriu';
  return 'Não dá agora'; }
/* por que a magia não sobe agora (a mesma conta do módulo: Sys.grimoire.canLevel) */
function gWhy(row,v){ try{ const c=gM().canLevel(S,row.id); return c.ok?'':gReason(c,row,v); }catch(e){ return 'Não dá agora'; } }

/* ---------- desenho ---------- */
function gOffHtml(d,msg){ V.innerHTML=xWrap(d,'gm-root '+(X.anim?'gm-in':''),'<div class="gm-w" style="background:'+gBg()+'"><div class="gm-off"><span role="alert">'+esc2(msg)+'</span><button class="gm-bt" data-x="back">Voltar</button></div></div>'); X.anim=false; X.sig='x'; }
function gCard(r,D){ const on=X.sel===r.id?' on':'';
  if(!r.owned) return '<button class="gm-sp lock'+on+'" data-x="sp" data-id="'+esc2(r.id)+'" aria-label="'+esc2(r.name+', ainda não aprendida. Como conseguir: '+r.how)+'">'+gIco(r.id,true)+'<span class="t"><b>'+esc2(r.name)+'</b><small>'+esc2(r.how)+'</small></span></button>';
  let kind=''; try{ kind=GM_KIND[gM().spell(r.id).kind]||''; }catch(e){}
  const tg=(r.in||[]).map(k=>'<i>'+esc2(D.modeName[k]||k)+'</i>').join('')+(r.canLevel?'<i class="up">Pode subir</i>':'');
  return '<button class="gm-sp'+on+'" data-x="sp" data-id="'+esc2(r.id)+'" aria-label="'+esc2(r.name+', nível '+r.lv)+'">'+gIco(r.id)+'<span class="t"><b>'+esc2(r.name)+'</b><small>Nv '+n0(r.lv)+(kind?' · '+esc2(kind):'')+' · '+gF1(r.cd)+' s</small>'+(tg?'<span class="tg">'+tg+'</span>':'')+'</span></button>'; }
function gSources(D){ const g=D.grants||{}, L=[];
  if(g.eraLord) L.push('<b>Senhor da Era</b>, 1ª vitória: aprende a 1ª magia da era + '+n0(g.eraLord.ink)+' de tinta');
  if(g.eraLordRepeat) L.push('<b>Senhor da Era</b> de novo: '+gPl(g.eraLordRepeat.n|0,'página','páginas')+' da 1ª magia, '+n0(g.eraLordRepeat.daily)+' por era por dia');
  let mid=5; try{ if(typeof STAGES_PER_ERA==='number'&&STAGES_PER_ERA>0) mid=Math.round(STAGES_PER_ERA/2); }catch(e){}   /* a mesma conta do js/battle.js: o chefe do meio da era (fase 5 de cada era, "1-5") */
  if(g.chief50) L.push('<b>Chefe da fase '+n0(mid)+' de cada era</b>, 1ª vitória: aprende a 2ª magia + '+n0(g.chief50.ink)+' de tinta');
  if(g.instance) L.push('<b>Instância diária</b> vencida: '+gPl(g.instance.n|0,'página','páginas')+' da 2ª magia + '+n0(g.instance.ink)+' de tinta');
  if(g.tower) L.push('<b>Torre</b>: '+n0(g.tower.ink)+' de tinta a cada 10 andares');
  if(g.daily) L.push('<b>Missões diárias</b> completas: '+n0(g.daily.ink)+' de tinta');
  if(g.event) L.push('<b>Eventos</b>: '+gPl(g.event.n|0,'página fixa','páginas fixas')+' da magia que o evento diz');
  return L; }
function gSheet(r,v,D){ const G=gM(), sp=G.spell(r.id), g=D.grants||{}, lv=r.owned?r.lv|0:1, maxLv=D.maxLv|0;
  let nx=null; try{ if(r.owned&&lv<maxLv&&typeof G.catalog==='function') nx=G.catalog(lv+1).find(c=>c.id===r.id)||null; }catch(e){ nx=null; }
  const set=(v.sets.find(s=>s.mode===X.mode)||{ids:[]}).ids, mn=D.modeName[X.mode]||X.mode;
  let h='<div class="gm-shade" data-x="close"></div><div class="gm-sh x-scroll" role="dialog" aria-label="'+esc2(r.name)+'">';
  h+='<div class="gm-shh">'+gIco(r.id,!r.owned)+'<div><h3>'+esc2(r.name)+'</h3><p>'+esc2(r.eraName)+' · '+(r.first?'1ª':'2ª')+' magia da era</p></div><span class="gm-lv'+(r.owned?'':' no')+'">'+(r.owned?'Nv '+n0(lv)+'/'+n0(maxLv):'Não aprendida')+'</span></div>';
  h+='<p class="gm-dsc">'+esc2(sp&&sp.desc||'')+'</p><div class="gm-rows">';
  h+='<div class="gm-rw"><span>Efeito'+(r.owned?' Nv '+n0(lv):'')+'</span><div>'+esc2(r.effectText)+'</div></div>';
  if(nx) h+='<div class="gm-rw"><span>No Nv '+n0(lv+1)+'</span><div><em>'+esc2(nx.effectText)+'</em></div></div>';
  h+='<div class="gm-rw"><span>Recarga</span><div>'+gF1(r.cd)+' s'+(nx&&nx.cd!==r.cd?' <em>depois '+gF1(nx.cd)+' s</em>':'')+'</div></div>';
  h+='<div class="gm-rw"><span>Bônus por ter</span><div>'+esc2(r.passiveText)+(nx?' <em>depois '+esc2(gPass(nx.passiveKey,nx.passive))+'</em>':'')+(r.owned?'':' (ao aprender)')+'</div></div></div>';
  if(r.owned){
    if(r.cost){ const pp=gClamp((r.pages|0)/Math.max(1,r.cost.pages),0,1), ip=gClamp((v.ink|0)/Math.max(1,r.cost.ink),0,1);
      h+='<div class="gm-prg"><div><small>PÁGINAS <b>'+n0(r.pages)+'/'+n0(r.cost.pages)+'</b></small><i class="'+(pp>=1?'ok':'')+'"><u style="width:'+Math.round(pp*100)+'%"></u></i></div><div><small>TINTA <b>'+n0(v.ink)+'/'+n0(r.cost.ink)+'</b></small><i class="'+(ip>=1?'ok':'')+'"><u style="width:'+Math.round(ip*100)+'%"></u></i></div></div>'; }
    h+=gMsgHtml('gm_msg2')+'<div class="gm-acts">';
    /* subir: dois toques, porque gasta páginas e tinta */
    if(r.canLevel&&r.cost) h+=X.arm===r.id
      ?'<button class="gm-bt b" data-x="upok">Confirmar: gasta '+gPl(r.cost.pages|0,'página','páginas')+' e '+n0(r.cost.ink)+' de tinta</button>'
      :'<button class="gm-bt" data-x="up">Subir para o Nv '+n0(lv+1)+'</button>';
    else h+='<button class="gm-bt o" data-x="up">'+esc2(gWhy(r,v))+'</button>';
    const at=set.indexOf(r.id), tgt=X.slot, cur=set[X.slot], curN=cur&&cur!==r.id?(G.spell(cur)||{}).name:'';
    h+=at>=0&&(at===X.slot||X.slot>=set.length)   /* já está na casa escolhida, ou a casa escolhida está vazia (o módulo junta as magias no começo: mover para lá não muda nada) */
      ?'<button class="gm-bt o" data-x="uneq">Tirar do conjunto '+esc2(mn)+'</button>'
      :'<button class="gm-bt b" data-x="eq">'+(at>=0?'Mover para o':'Colocar no')+' espaço '+n0(tgt+1)+' · '+esc2(mn)+(curN?' (troca com '+esc2(curN)+')':'')+'</button>';
    h+='</div>'; }
  else { const ink=r.first?(g.eraLord&&g.eraLord.ink):(g.chief50&&g.chief50.ink);
    h+='<div class="gm-how"><b>Como conseguir</b><p>'+esc2(r.how)+(ink?' (+'+n0(ink)+' de tinta)':'')+'. Ela entra no Grimório no nível 1.</p></div>'+gMsgHtml('gm_msg2'); }
  const pg=[]; if(r.first){ if(g.eraLordRepeat) pg.push('Senhor da Era de novo: '+gPl(g.eraLordRepeat.n|0,'página','páginas')+' por era, por dia'); }
  else if(g.instance) pg.push('Instância diária da era vencida: '+gPl(g.instance.n|0,'página','páginas')+' + '+n0(g.instance.ink)+' de tinta');
  if(g.event) pg.push('Eventos que trazem esta magia: '+gPl(g.event.n|0,'página fixa','páginas fixas'));
  pg.push('Tinta: Torre, missões diárias e instâncias. Nada é vendido');
  h+='<div class="gm-how"><b>Páginas desta magia</b><ul>'+pg.map(s=>'<li>'+esc2(s)+'</li>').join('')+'</ul></div>';
  h+='<div class="gm-acts" style="margin-top:12px"><button class="gm-bt o" data-x="close">Fechar</button></div></div>';
  return h; }
function gDraw(){
  const d=xDims(240)||{};
  if(!gHas()){ gOffHtml(d,'Grimório indisponível agora.'); return; }
  if(!gOk()){ gOffHtml(d,'O Grimório das Eras ainda não abriu.'); return; }
  const G=gM(), D=G.DATA; let v=null; try{ v=G.view(S,gHost()); }catch(e){ v=null; }
  if(!v||!Array.isArray(v.eras)||!Array.isArray(v.sets)){ gOffHtml(d,'Grimório indisponível agora.'); return; }
  const rows=gRows(v), modes=v.sets.map(s=>s.mode), slots=Math.max(1,v.slots|0);
  if(modes.indexOf(X.mode)<0) X.mode=modes[0]; X.slot=gClamp(X.slot|0,0,slots-1);
  if(X.sel&&!rows.some(r=>r.id===X.sel)){ X.sel=null; X.arm=null; } if(X.arm&&X.arm!==X.sel) X.arm=null;
  const set=(v.sets.find(s=>s.mode===X.mode)||{ids:[]}).ids, mn=D.modeName[X.mode]||X.mode, b=v.bonus||{};
  let y0=0; try{ const sc0=X.top?null:document.getElementById('gm_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}

  let h='<div class="gm-top"><span class="gm-cnt">'+n0(v.owned)+' de '+n0(v.total)+' magias aprendidas</span><span class="gm-ink" role="img" aria-label="Tinta: '+n0(v.ink)+'">'+GM_INK+'<b>'+n0(v.ink)+'</b><small>tinta</small></span></div>'+(X.sel?'<div class="gm-msg"></div>':gMsgHtml('gm_msg'));
  h+='<div id="gm_scroll" class="x-scroll gm-body">';
  h+='<p class="gm-prov">Cada era ensina 2 magias. O herói leva '+n0(slots)+' na luta e elas saem sozinhas quando a recarga termina.</p>';
  if(!v.owned) h+='<section class="gm-none"><b>Você ainda não aprendeu nenhuma magia</b><p>Como conseguir, sempre jogando:</p><ul><li>1ª magia de cada era: '+esc2(D.learn&&D.learn.A||'')+'</li><li>2ª magia de cada era: '+esc2(D.learn&&D.learn.B||'')+'</li></ul></section>';
  /* bônus por ter (Sys.grimoire.view().bonus; o teto é a soma do passiveOf no nível máximo) */
  const mx={}; try{ for(const sp of D.spells) mx[sp.passive]=(mx[sp.passive]||0)+G.passiveOf(sp,D.maxLv); }catch(e){}
  h+='<section class="gm-box"><div class="gm-h5">Bônus por ter<small>Vale para sempre, mesmo fora das '+n0(slots)+' da luta</small></div><div class="gm-b4">'
    +Object.keys(GM_PN).map(k=>'<div class="'+(b[k]>0?'':'z')+'"><b>+'+gF1(b[k])+(k==='critPct'?'':'%')+'</b><small>'+GM_PN[k]+(k==='critPct'?' (pontos)':'')+'</small></div>').join('')+'</div>'
    +'<p class="gm-note">Com as '+n0(v.total)+' no nível '+n0(D.maxLv)+': '+Object.keys(GM_PN).filter(k=>mx[k]>0).map(k=>esc2(gPass(k,mx[k]))).join(', ')+'.</p></section>';
  /* conjuntos */
  h+='<div class="gm-h5">Conjuntos de luta</div><div class="gm-tabs" role="tablist" aria-label="Conjunto">'+v.sets.map(s=>'<button class="gm-tab" role="tab" data-x="mode" data-m="'+esc2(s.mode)+'" aria-selected="'+(s.mode===X.mode)+'">'+esc2(s.name)+'</button>').join('')+'</div>';
  h+='<p class="gm-hint">'+esc2(GM_HINT[X.mode]||'')+'</p><div class="gm-slots">';
  for(let i=0;i<slots;i++){ const id=set[i], r=id?rows.find(q=>q.id===id):null;
    h+='<button class="gm-slot'+(i===X.slot?' sel':'')+'" data-x="slot" data-i="'+i+'" aria-pressed="'+(i===X.slot)+'" aria-label="'+esc2('Espaço '+(i+1)+' do conjunto '+mn+(r?': '+r.name:', vazio'))+'">'+(r?gIco(id):'<i class="gm-emp"></i>')+'<b>'+(r?esc2(r.name):'Vazio')+'</b><small>'+(r?'Nv '+n0(r.lv):'Espaço '+(i+1))+'</small></button>'; }
  h+='</div><p class="gm-hint">'+(v.owned?'Escolha um espaço (borda dourada) e toque numa magia para colocar ou trocar.':'Os espaços enchem com as magias que você aprender.')+'</p>';
  /* as 18, por era */
  h+='<div class="gm-h5">Magias por era</div>';
  for(const e of v.eras){ const col=GM_ERA[gClamp(e.era|0,0,GM_ERA.length-1)];
    h+='<div class="gm-era"><h4><i style="background:'+col+'"></i>'+esc2(e.name)+'</h4><div class="gm-cards">'+rows.filter(r=>r.era===(e.era|0)).map(r=>gCard(r,D)).join('')+'</div></div>'; }
  h+='<section class="gm-src"><div class="gm-h5">De onde vêm páginas e tinta</div><ul>'+gSources(D).map(s=>'<li>'+s+'</li>').join('')+'</ul><p><b>Nada à venda.</b> Páginas e tinta vêm só jogando, sempre na mesma quantidade.</p></section></div>';
  if(X.sel) h+=gSheet(rows.find(r=>r.id===X.sel),v,D);

  V.innerHTML=xWrap(d,'gm-root '+(X.anim?'gm-in':''),'<div class="gm-w" style="background:'+gBg()+'">'+h+'</div>');
  X.anim=false; X.top=false; X.sig=gSig();
  if(y0){ try{ const sc=document.getElementById('gm_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
}
/* assinatura do que muda por fora (páginas, tinta, magia nova): o tick redesenha só quando ela muda */
function gSig(){ try{ const o=gM().ensure(S); return JSON.stringify([o.ink,o.own,o.sets]); }catch(e){ return ''; } }

/* ---------- toques (cada data-x da tela tem uma entrada aqui) ---------- */
function gRow(id){ try{ const v=gM().view(S,gHost()); return {v,row:gRows(v).find(r=>r.id===id)||null}; }catch(e){ return {v:null,row:null}; } }
const ACT={
  back(){ gSnd('ui_tap'); try{ if(window.Screens&&typeof Screens.close==='function') Screens.close(); }catch(e){} },
  close(){ gSnd('ui_tap'); X.sel=null; X.arm=null; X.msg=''; gRedraw(); },
  mode(b){ const m=String(b.dataset.m||''); if(gM().DATA.modes.indexOf(m)<0||m===X.mode) return; gSnd('ui_tap'); X.mode=m; X.slot=0; X.arm=null; X.msg=''; gRedraw(); },
  slot(b){ const i=gClamp(parseInt(b.dataset.i,10)||0,0,Math.max(0,(gM().DATA.slots|0)-1)); gSnd('ui_tap'); X.arm=null; X.msg='';
    if(i===X.slot){ const id=gM().ensure(S).sets[X.mode][i]; if(id) X.sel=id; }   /* tocar de novo na casa escolhida abre a magia que está nela */
    X.slot=i; gRedraw(); },
  sp(b){ const id=String(b.dataset.id||''); if(!gM().spell(id)) return; gSnd('ui_tap'); X.sel=id; X.arm=null; X.msg=''; gRedraw(); },
  up(){ const id=X.sel, q=gRow(id); if(!q.row) return; gSnd('ui_tap');
    if(!q.row.owned){ X.arm=null; gSay(gReason({reason:'notOwned'}),true); gRedraw(); return; }
    if(!q.row.canLevel){ X.arm=null; gSay(gWhy(q.row,q.v)||'Não dá agora',true); gRedraw(); return; }
    X.arm=id; gSay('Toque em Confirmar para subir. As páginas e a tinta são gastas.'); gRedraw(); },
  upok(){ const id=X.sel, q=gRow(id); if(!q.row) return; X.arm=null; let r=null; try{ r=gM().levelUp(S,id,gHost()); }catch(e){ r={ok:false}; }
    if(r&&r.ok){ gSnd('ui_ok'); gStore(); const a=gRow(id).row; gSay(q.row.name+' subiu para o nível '+n0(r.lv)+(a?' · bônus '+a.passiveText:'')); }
    else { gSnd('ui_tap'); gSay(gReason(r,q.row,q.v),true); }
    gRedraw(); },
  eq(){ const id=X.sel, G=gM(), sp=G.spell(id); if(!sp) return; X.arm=null; let r=null; try{ r=G.equip(S,X.mode,X.slot,id); }catch(e){ r={ok:false}; }
    if(r&&r.ok){ gSnd('ui_ok'); gStore(); const i=r.set.indexOf(id); if(i>=0) X.slot=i; gSay(sp.name+' no conjunto '+(G.DATA.modeName[X.mode]||X.mode)); }
    else { gSnd('ui_tap'); gSay(gReason(r),true); }
    gRedraw(); },
  uneq(){ const id=X.sel, G=gM(), sp=G.spell(id); if(!sp) return; X.arm=null; const i=G.ensure(S).sets[X.mode].indexOf(id); if(i<0){ gRedraw(); return; }
    let r=null; try{ r=G.equip(S,X.mode,i,null); }catch(e){ r={ok:false}; }
    if(r&&r.ok){ gSnd('ui_tap'); gStore(); X.slot=gClamp(Math.min(X.slot,r.set.length),0,Math.max(0,(G.DATA.slots|0)-1)); gSay(sp.name+' saiu do conjunto '+(G.DATA.modeName[X.mode]||X.mode)); }
    else gSay(gReason(r),true);
    gRedraw(); } };
function gClick(b){ const a=b&&b.dataset?b.dataset.x:''; if(!a||!Object.prototype.hasOwnProperty.call(ACT,a)) return;
  if(a==='back') return ACT.back();
  if(!gOk()) return;
  return ACT[a](b); }
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function gUrls(){ const u=[]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); }catch(e){}
  if(GM_ART_ON){ try{ for(const sp of gM().DATA.spells) u.push(GM_ART_DIR+sp.id+'.png'); }catch(e){} } return u; }
function gClearMsg(){ X.msg=''; try{ for(const id of ['gm_msg','gm_msg2']){ const el=document.getElementById(id); if(el) el.innerHTML=''; } }catch(e){} }

if(!('grim' in PANEL_ON)) PANEL_ON.grim=false;
Panels.add(N,{title:'Grimório das Eras',actions:Object.keys(ACT),iconOf,
  render(){ if(typeof pwGate==='function'){ if(pwGate(gUrls())) return; } else if(typeof xGate==='function'&&xGate(gUrls())) return; return gDraw(); },
  click(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return gClick(b); },
  tick(){ if(!gOk()) return; if(X.msg&&!X.arm&&gNow()-X.msgT>2600) gClearMsg(); if(X.sig&&X.sig!=='x'&&gSig()!==X.sig) gRedraw(); },
  busy(){ return false; },
  onOpen(){ X.sel=null; X.arm=null; X.msg=''; X.slot=0; X.anim=true; X.top=true; X.sig=''; },
  onClose(){ X.sel=null; X.arm=null; X.msg=''; } });
})();
