'use strict';
/* ================= ACAMPAMENTO DAS ERAS — tela nova, nasce DESLIGADA (PANEL_ON.camp) =================
   Visual VOTADO pelo dono: mock B, de dia (docs/proto/v2/a/mocks/ac_b.jpg). Regras e momentos: docs/proto/v2/Acampamento.html.
   Decisão do PO: abre no nível 20, só pelo Menu; o que as tendas guardam também volta dentro da janela do tempo fora (js/meta.js, K4-K6).
   NENHUMA regra nem número aqui. Tudo vem do js/sys/camp.js (Sys.camp):
   - modelo da tela: view(S, host) → {on, locked, needLevel, capHours, text, idlePets, tents:[{id,name,res,lv,maxLv,perHour,stored,cap,full,pct,pets,slots,upgrade}]};
   - Coletar tudo: collect(S, host) → {ok, reason, got:{gold, forge, practice}} (o módulo credita sozinho; UMA chamada por toque);
   - Coletar de UMA tenda: o módulo só tem a coleta de tudo. A função collectOne (abaixo) guarda o que as outras tendas juntaram, chama o MESMO
     collect UMA vez e devolve o guardado às outras. Quando o módulo ganhar a coleta por tenda, é só trocar o corpo dessa função;
   - pet na tenda: assign(S, host, tenda, pet) / unassign(S, host, pet) → {ok, reason}; ajuda de cada pet: petBoost(S, pet);
   - Melhorar: canUpgrade / upgrade(S, host, tenda) → {ok, reason:'fixed'|'max'|'money', cost, lv}. A Tenda do Ouro NÃO melhora ('fixed'): sem botão.
   CABEÇALHO: o título "Acampamento das Eras" e o Voltar são os da folha do jogo (def.title); a tela não repete a placa do mock.
   FUNDO: regra da casa, xEraBg() do js/panels.js (cenário da era atual) com um véu claro por cima para ficar de dia.
   HERÓI: window.drawHeroFull (js/battle.js), a pé, com a arma na mão e o pet principal por último (na frente).
   AVISOS: sempre na linha reservada do alto (nunca em cima do herói nem do botão tocado). Melhorar gasta ouro: dois toques (Melhorar, Confirmar).
   Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('camp' in PANEL_ON)) PANEL_ON.camp=false;
const N='camp', TITLE='Acampamento das Eras';
const ACTIONS=['collect','all','tent','close','up','upok','upno','pet','unpet','back'];
const X={msg:'',tone:'',sel:'',arm:'',sig:'',tk:0,raf:0,t0:0,herr:0};

/* ================= ARTE DAS TENDAS (um lugar só) =================
   ART_IMG: a arte pintada da Arte (estilo B votado, PNG transparente de 512 px de largura, com a base embaixo e a placa curta já pintada), por id de tenda do módulo.
   Tenda do módulo SEM caminho aqui (ou com '') cai no desenho de reserva em SVG (ART_SVG) com a placa em CSS por cima.
   Com a arte pintada, o nome COMPLETO do módulo vai numa placa em CSS logo abaixo da imagem (a placa pintada é só enfeite). Barra e botões são CSS (ac-bar, ac-b). */
const ART_IMG={gold:'assets/ui/camp/tent_gold.png',forge:'assets/ui/camp/tent_forge.png',practice:'assets/ui/camp/quarry.png'};
const ART_WH={gold:[512,385],forge:[512,380],practice:[512,354]};
const OUT='stroke="#3a220e" stroke-width="3" stroke-linejoin="round"';
const SHADOW='<ellipse cx="60" cy="84" rx="54" ry="5" fill="#2a1e0a" opacity=".28"/>';
const ART_SVG={
  gold:SHADOW+'<path d="M60 8 L112 82 H8 Z" fill="#e9b23a" '+OUT+'/><path d="M60 8 L86 82 H34 Z" fill="#ffd978" '+OUT+'/><path d="M60 34 L74 82 H46 Z" fill="#4a2c10" '+OUT+'/>'
    +'<path d="M60 2 V10" stroke="#3a220e" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="77" r="6" fill="#ffd25e" stroke="#8a5a10" stroke-width="2"/><circle cx="102" cy="80" r="5" fill="#ffe58a" stroke="#8a5a10" stroke-width="2"/>',
  forge:SHADOW+'<path d="M60 8 L112 82 H60 Z" fill="#2f5fb8" '+OUT+'/><path d="M60 8 L8 82 H60 Z" fill="#d8452f" '+OUT+'/><path d="M60 34 L74 82 H46 Z" fill="#3a1410" '+OUT+'/>'
    +'<path d="M60 2 V10" stroke="#3a220e" stroke-width="3" stroke-linecap="round"/><path d="M12 68h24l-5 5h-4v6h6v4H15v-4h6v-6h-4z" fill="#6a7180" stroke="#22262e" stroke-width="2" stroke-linejoin="round"/>'
    +'<path d="M24 66c-6-5 0-9 0-14 5 4 8 9 0 14z" fill="#ff9a2a" stroke="#a03a08" stroke-width="1.5" stroke-linejoin="round"/>',
  practice:SHADOW+'<path d="M60 8 L112 82 H8 Z" fill="#4f9a4a" '+OUT+'/><path d="M60 8 L86 82 H34 Z" fill="#6cb85e" '+OUT+'/><path d="M42 82V50h36v32z" fill="#a9adb5" '+OUT+'/><rect x="51" y="59" width="18" height="23" fill="#2a2018"/>'
    +'<path d="M60 2 V10" stroke="#3a220e" stroke-width="3" stroke-linecap="round"/><path d="M88 82l5-10 9-2 7 6-2 6z" fill="#9aa0aa" stroke="#3a3f48" stroke-width="2" stroke-linejoin="round"/>'
};
const painted=id=>!!ART_IMG[id];
function art(id){ const u=ART_IMG[id], wh=ART_WH[id]||[512,384]; if(u) return '<img class="ac-tart img" src="'+esc(u)+'" width="'+wh[0]+'" height="'+wh[1]+'" alt="">';
  return '<svg class="ac-tart" viewBox="0 0 120 90" aria-hidden="true">'+(ART_SVG[id]||ART_SVG.gold)+'</svg>'; }
/* AJUDANTE: personagem fixo de cada tenda (a mesma arte nas 3, 258x512, com os pés na base da imagem). É só cenário: sempre trabalha, não tem número e não é tocável à parte.
   Fica à direita da tenda, com os pés na mesma linha da base dela (dentro da caixa da arte da tenda: nunca em cima da barra nem do Coletar); os pets do jogador seguem nas vagas, à esquerda.
   Caminho vazio, ou imagem que não carrega (onerror), = a tenda sem o ajudante, como era antes. */
const HELPER_IMG='assets/ui/camp/helper.png';
const helperHtml=()=>HELPER_IMG?'<img class="ac-help" src="'+esc(HELPER_IMG)+'" width="258" height="512" alt="" onerror="this.style.display=\'none\'">':'';
const tentArt=id=>'<span class="ac-ta">'+art(id)+helperHtml()+'</span>';
/* ícones dos recursos: a moeda do jogo e duas pedras desenhadas (as mesmas formas do Bem-vindo de volta, js/p_intro.js) */
const COIN='assets/ui/coin.png', PET_FALLBACK='assets/icons/menu/pets.png';
const stone=(fill,line)=>'<svg class="ac-ri" viewBox="0 0 64 64" aria-hidden="true"><path d="M10 44 L20 22 L40 16 L54 30 L50 48 L28 54 Z" fill="'+fill+'" stroke="'+line+'" stroke-width="4" stroke-linejoin="round"/><path d="M20 22 L30 36 L54 30 M30 36 L28 54" fill="none" stroke="'+line+'" stroke-width="2.5"/></svg>';
const RES_IC={gold:'<img class="ac-ri" src="'+COIN+'" alt="">',forge:stone('#ff9a3a','#6a2a08'),practice:stone('#8fb6d9','#2a4360')};
const resIc=r=>RES_IC[r]||'';

/* ================= leituras ================= */
const K=()=>{ try{ const k=window.Sys&&Sys.camp; return k&&k.DATA&&k.DATA.on===true&&typeof k.view==='function'&&typeof k.collect==='function'?k:null; }catch(e){ return null; } };
const host=()=>(window.Sys&&Sys.host)||null;
const esc=s=>{ try{ if(typeof esc2==='function') return esc2(s); }catch(e){} return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const nf=v=>{ try{ return typeof kf==='function'?String(kf(num(v))):String(Math.floor(num(v))); }catch(e){ return String(Math.floor(num(v))); } };
const rateTx=v=>{ v=num(v); return v>=1000?nf(v):String(Math.round(v*100)/100).replace('.',','); };
const pctTx=v=>Math.round(num(v)*100)+'%';
const isOn=()=>{ try{ return typeof view!=='undefined'&&view===N; }catch(e){ return false; } };
const lvNow=()=>{ try{ const h=host(); if(h&&typeof h.level==='function') return Math.max(0,Math.floor(num(h.level()))); return Math.max(0,Math.floor(num(Sys.level.level(S)))); }catch(e){ return 0; } };
const RES={gold:'moedas',forge:'pedras de forja',practice:'pedras de prática'};
const WHY={off:'O Acampamento das Eras está fechado agora.',locked:'O Acampamento das Eras ainda está trancado.',id:'Essa tenda não existe.',
  pet:'Esse pet não pode trabalhar: é o principal ou não é seu.',busy:'Esse pet já está em outra tenda.',full:'Essa tenda não tem vaga de pet.',
  fixed:'Esta tenda é fixa: não tem melhoria.',max:'A tenda já está no nível máximo.',money:'Falta ouro para melhorar.',empty:'Ainda não juntou nada para coletar.'};
/* pets: nome e ícone pelas tabelas do Sys.pet (os mesmos arquivos da tela de Equipamento) */
const PET_ART={shadowwolf:'shadow_wolf',falcon:'war_falcon',panther:'spectral_panther',scorpion:'runic_scorpion',crow:'storm_crow',griffin:'black_griffin',obsidian:'obsidian_golem',icedragon:'ice_dragon',wyvernpet:'infernal_wyvern'};
const petDef=id=>{ try{ return Sys.pet.DATA.pets.find(p=>p.id===id)||null; }catch(e){ return null; } };
const petName=id=>{ const d=petDef(id); return d&&d.name?String(d.name):String(id); };
function petImg(id){ if(PET_ART[id]) return 'assets/icons/pets/'+PET_ART[id]+'.png'; const d=petDef(id), sp=d&&d.sprite; let st=0; try{ st=Sys.pet.stage(S,id).index|0; }catch(e){ st=0; }
  return sp?'assets/icons/pets/'+sp+['_ref','_mid','_evo'][Math.max(0,Math.min(2,st))]+'.png':PET_FALLBACK; }
const petBoostTx=(k,id)=>{ let b=0; try{ b=num(k.petBoost(S,id)); }catch(e){ b=0; } return b>0?'+'+pctTx(b)+' na tenda':'não conta agora: é o principal'; };

/* ================= estilo ================= */
(function(){ try{ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.id='ac_css'; el.textContent=`
.ac{position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:#bfe0f5;color:#fff3d6;font-family:Nunito,system-ui,sans-serif}
.ac *{box-sizing:border-box}
.ac button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.ac .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.ac-bg,.ac-veil{position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none}
.ac-veil{background:linear-gradient(180deg,rgba(150,205,255,.5),rgba(235,245,255,.34) 38%,rgba(190,225,130,.3) 60%,rgba(120,180,80,.4))}
.ac-top{position:relative;z-index:2;flex:none;padding:8px 10px 0;display:flex;flex-direction:column;gap:5px}
.ac-info{margin:0;padding:6px 10px;border-radius:11px;background:linear-gradient(180deg,#8a5a2e,#6a4020);border:2px solid #3a220e;box-shadow:0 2px 0 rgba(42,22,8,.5);font-size:11.5px;font-weight:800;line-height:1.3;color:#fff3d6;text-align:center;overflow-wrap:anywhere}
.ac-msg{min-height:34px;display:flex;align-items:center;justify-content:center}
.ac-msg span{max-width:100%;padding:5px 12px;border-radius:10px;background:#2a1a0c;border:1.5px solid #ffc94a;color:#fff3d6;font-size:12px;font-weight:900;line-height:1.25;text-align:center;overflow-wrap:anywhere}
.ac-msg span.bad{border-color:#ff8a7a;color:#ffe1dc}
.ac-main{position:relative;z-index:1;flex:1;min-height:0;display:flex;flex-direction:column}
.ac-scene{flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;scrollbar-width:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 8px;padding:2px 10px 4px}
.ac-scene::-webkit-scrollbar,.ac-sh::-webkit-scrollbar{display:none}
.ac-col{min-width:0;display:flex;flex-direction:column;align-items:center}
.ac-col.l{padding-top:34px}
.ac-col.r{justify-content:space-around;gap:8px}
.ac-card{flex:none;width:100%;max-width:176px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:4px}
.ac-tent,.xs .ac-tent{position:relative;display:block;width:100%;min-height:64px;padding:0;border:0;background:none;color:#fff3d6}
.ac-tart{display:block;width:78%;max-width:132px;height:auto;margin:12px auto 0}
.ac.sm .ac-tart{width:62%}
.ac-tart.img{width:74%;max-width:150px;margin-top:0}
.ac.sm .ac-tart.img{width:58%}
.ac-ta{position:relative;display:block}
.ac-help{position:absolute;right:0;bottom:0;width:auto;height:62%;max-width:none;pointer-events:none;filter:drop-shadow(0 2px 1px rgba(42,30,10,.35))}
.ac-sign.under{position:relative;left:auto;top:auto;transform:none;display:block;margin:-8px auto 0;font-size:12.5px}
.ac-sign{position:absolute;left:50%;top:0;transform:translateX(-50%) rotate(-3deg);width:max-content;max-width:96%;padding:3px 9px 4px;border-radius:7px;background:linear-gradient(180deg,#9a6836,#6a4020);border:2px solid #3a220e;box-shadow:0 2px 0 rgba(42,22,8,.55);font-size:13px;line-height:1.1;color:#fff3d6;text-shadow:0 1px 0 #2a1608;text-align:center;overflow-wrap:anywhere}
.ac-pws{position:absolute;left:4px;bottom:0;display:flex}
.ac-pw{width:30px;height:30px;border-radius:50%;background:#2a1a0c;border:2px solid #ffc94a;object-fit:cover;margin-right:-6px}
.ac-st{width:100%;padding:5px 7px 4px;border-radius:10px;background:rgba(42,26,12,.92);border:1.5px solid #3a220e}
.ac-bar{height:12px;border-radius:6px;background:#1a1009;border:1.5px solid #120a05;overflow:hidden}
.ac-bar i{display:block;height:100%;border-radius:4px;background:linear-gradient(180deg,#8ff06a,#3fae3c)}
.ac-bar.full i{background:linear-gradient(180deg,#ffe58a,#f4a52a)}
.ac-am{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;margin-top:3px;font-size:12.5px;font-weight:900;line-height:1.2;color:#fff3d6}
.ac-ri{display:block;width:16px;height:16px;flex:none}
.ac-rt{font-size:10.5px;font-weight:800;line-height:1.25;color:#f1dfbf;text-align:center;overflow-wrap:anywhere}
.ac-rt b{color:#ffd978}
.ac-b,.xs .ac-b{min-height:42px;min-width:0;padding:4px 12px;border-radius:12px;border:2px solid #3a220e;background:linear-gradient(180deg,#9a6836,#6a4020);color:#fff3d6;box-shadow:0 3px 0 #2a1608;font-weight:900;font-size:14px;line-height:1.15;text-align:center;overflow-wrap:anywhere}
.ac-b:active{transform:translateY(2px);box-shadow:0 1px 0 #2a1608}
.ac-b.gold,.xs .ac-b.gold{background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#2a1403;border-color:#8a4a0c;box-shadow:0 3px 0 #8a4a0c}
.ac-b.ghost,.xs .ac-b.ghost{background:#2a1a0c;color:#fff3d6;box-shadow:none}
.ac-b.off,.xs .ac-b.off{background:#57483a;color:#eadcc6;border-color:#3a2c1f;box-shadow:none}
.ac-b small{display:block;font-size:10.5px;font-weight:800;line-height:1.2}
.ac-card .ac-b{width:100%;max-width:150px}
.ac-hero{position:relative;flex:1;width:100%;min-height:84px}
.ac-hero canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.ac-foot{flex:none;display:flex;justify-content:center;padding:6px 12px;padding-bottom:max(10px,env(safe-area-inset-bottom))}
.ac-foot .ac-b{width:100%;max-width:280px;min-height:52px;font-size:20px}
.ac-ov{position:absolute;left:0;right:0;top:0;bottom:0;z-index:5;background:rgba(30,18,8,.55);display:flex;flex-direction:column;justify-content:flex-end}
.ac-sh{max-height:100%;overflow-x:hidden;overflow-y:auto;scrollbar-width:none;border-radius:18px 18px 0 0;background:linear-gradient(180deg,#4a2f18,#2f1d0e);border:2px solid #ffc94a;border-bottom:0;padding:10px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));color:#fff3d6}
.ac-shh{display:flex;align-items:center;gap:8px;min-width:0}
.ac-shh .ac-tart,.ac.sm .ac-shh .ac-tart{width:56px;height:auto;margin:0;flex:none}
.ac-shh>div{flex:1;min-width:0}
.ac-shh b{display:block;font-size:19px;line-height:1.1;color:#ffd978;overflow-wrap:anywhere}
.ac-shh small{display:block;font-size:11.5px;font-weight:800;line-height:1.25;color:#f1dfbf;overflow-wrap:anywhere}
.ac-shh .ac-b{flex:none}
.ac-kv{display:flex;justify-content:space-between;gap:8px;padding:5px 0;border-top:1px solid rgba(255,236,200,.16);font-size:12.5px;font-weight:800;line-height:1.3}
.ac-kv span{min-width:0;overflow-wrap:anywhere}
.ac-kv b{flex:none;max-width:60%;text-align:right;overflow-wrap:anywhere}
.ac-h{margin:8px 0 4px;font-size:12.5px;font-weight:900;line-height:1.25;color:#ffd978;overflow-wrap:anywhere}
.ac-note{margin:0;font-size:11.5px;font-weight:800;line-height:1.35;color:#f1dfbf;overflow-wrap:anywhere}
.ac-pl{display:flex;flex-wrap:wrap;gap:6px}
.ac-pb,.xs .ac-pb{min-height:44px;max-width:100%;padding:3px 10px 3px 4px;border-radius:22px;border:1.5px solid #ffc94a;background:#2a1a0c;color:#fff3d6;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:900;line-height:1.15;text-align:left}
.ac-pb.in,.xs .ac-pb.in{background:#5a3a10}
.ac-pb img{width:34px;height:34px;border-radius:50%;flex:none;object-fit:cover}
.ac-pb span{min-width:0;overflow-wrap:anywhere}
.ac-pb small{display:block;font-size:10.5px;font-weight:800;line-height:1.2;color:#f1dfbf}
.ac-row{display:flex;gap:8px;margin-top:8px}
.ac-row .ac-b{flex:1;min-height:46px}
.ac-gate{position:relative;z-index:2;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:20px}
.ac-gp{width:100%;max-width:320px;padding:16px;border-radius:16px;background:linear-gradient(180deg,#4a2f18,#2f1d0e);border:2px solid #3a220e;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center}
.ac-gp b{font-size:24px;line-height:1.1;color:#ffd978;overflow-wrap:anywhere}
.ac-gp span{font-size:13px;font-weight:800;line-height:1.4;color:#fff3d6;overflow-wrap:anywhere}
.ac-gp .ac-b{min-height:48px;padding:0 28px;font-size:15px}
`; document.head.appendChild(el); }catch(e){} })();

/* ================= herói no acampamento ================= */
const canDraw=()=>{ try{ return !X.herr&&typeof window.drawHeroFull==='function'&&typeof requestAnimationFrame==='function'; }catch(e){ return false; } };
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||150, h=c.clientHeight||96;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000), x=c.getContext('2d'); x.setTransform(dpr,0,0,dpr,0,0); x.clearRect(0,0,w,h);
  const hs=(typeof HS==='number'&&HS>0)?HS:155, fr=Math.max(40,Math.min(h-10,w*0.9,160)), gy=h-8, hx=Math.round(w*0.42);
  try{ x.save(); x.globalAlpha=0.28; x.fillStyle='#2a1e0a'; x.beginPath(); x.ellipse(hx,gy+2,fr*0.26,5,0,0,7); x.fill(); x.restore(); }catch(e){}
  x.setTransform(dpr,0,0,dpr,0,0);
  try{ window.drawHeroFull(x,hx,gy,fr/hs,{t:t,mount:false}); }catch(e){ X.herr=1; } }   /* a pé; o pet principal é o último desenho do drawHeroFull (na frente) */
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('ac_hero'); }catch(e){} if(!c||!isOn()||!canDraw()){ X.t0=0; return; }
  X.ts=ts; try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!canDraw()) return; const c=document.getElementById('ac_hero'); if(!c) return; if(X.ts){ try{ frame(c,X.ts); }catch(e){} }
    if(!X.raf) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; X.ts=0; }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="ac-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0,0.05):'#bfe0f5')+'"></div><div class="ac-veil"></div>';
function gateHtml(msg,label){ return '<div class="ac">'+bgHtml()+'<div class="ac-gate"><div class="ac-gp" role="dialog" aria-label="'+esc(label)+'"><b class="lil">'+esc(TITLE)+'</b>'
  +'<span role="alert">'+esc(msg)+'</span><button class="ac-b gold" data-x="back">Voltar</button></div></div></div>'; }
function lockTx(v){ const need=Math.max(1,Math.floor(num(v.needLevel))), lv=lvNow(), miss=need-lv;
  return 'Abre no nível '+need+'.'+(lv>0&&miss>0?' Você está no nível '+lv+': '+(miss===1?'falta 1 nível':'faltam '+miss+' níveis')+'.':'')+' Continue lutando para subir de nível.'; }
const pctOf=t=>Math.max(0,Math.min(100,Math.round(num(t.pct))));
function cardHtml(t){ const has=num(t.stored)>0, p=pctOf(t), id=esc(t.id);
  const pets=(t.pets||[]).map(q=>'<img class="ac-pw" src="'+esc(petImg(q))+'" alt="">').join('');
  return '<div class="ac-card">'
    +'<button class="ac-tent" data-x="tent" data-t="'+id+'" aria-label="'+esc(t.name+': abrir a tenda (pets e melhoria)')+'">'+tentArt(t.id)+'<span class="ac-sign lil'+(painted(t.id)?' under':'')+'">'+esc(t.name)+'</span>'+(pets?'<span class="ac-pws">'+pets+'</span>':'')+'</button>'
    +'<div class="ac-st"><div class="ac-bar'+(t.full?' full':'')+'" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+p+'" aria-label="'+esc(t.name+(t.full?': cheia':': enchendo'))+'"><i style="width:'+p+'%"></i></div>'
    +'<div class="ac-am">'+resIc(t.res)+'<span>'+esc(nf(t.stored)+' / '+nf(t.cap))+'</span></div>'
    +'<div class="ac-rt">'+(t.full?'<b>Cheia</b>':'Enchendo')+' · +'+esc(rateTx(t.perHour))+' por hora</div></div>'
    +'<button class="ac-b'+(has?'':' off')+'" data-x="collect" data-t="'+id+'" aria-disabled="'+(!has)+'" aria-label="'+esc('Coletar: '+t.name)+'">Coletar</button></div>'; }
const hHtml=s=>'<div class="ac-h">'+esc(s)+'</div>';
function petBtn(k,act,p,tid){ const inT=act==='unpet';
  return '<button class="ac-pb'+(inT?' in':'')+'" data-x="'+act+'" data-p="'+esc(p)+'"'+(tid?' data-t="'+esc(tid)+'"':'')+' aria-label="'+esc((inT?'Tirar da tenda: ':'Pôr na tenda: ')+petName(p))+'"><img src="'+esc(petImg(p))+'" alt="">'
    +'<span>'+esc(petName(p))+'<small>'+esc(petBoostTx(k,p)+(inT?' · toque para tirar':''))+'</small></span></button>'; }
function petsHtml(t,v,k){ if(!(window.Sys&&Sys.pet)) return ''; const pets=t.pets||[], slots=Math.max(0,Math.floor(num(t.slots))), idle=Array.isArray(v.idlePets)?v.idlePets:[];
  let s=hHtml('Pets na tenda: '+pets.length+' de '+slots);
  s+=pets.length?'<div class="ac-pl">'+pets.map(p=>petBtn(k,'unpet',p,'')).join('')+'</div>':'<p class="ac-note">Nenhum pet nesta tenda.</p>';
  if(pets.length<slots) s+=idle.length?hHtml('Pets parados: toque para pôr na tenda')+'<div class="ac-pl">'+idle.map(p=>petBtn(k,'pet',p,t.id)).join('')+'</div>':'<p class="ac-note">Nenhum pet parado para ajudar agora.</p>';
  return s; }
function upHtml(t,k){ const u=t.upgrade||{}, cost=num(u.cost), id=esc(t.id); let s=hHtml('Melhoria');
  if(u.reason==='fixed') return s+'<p class="ac-note">'+esc(WHY.fixed)+'</p>';
  if(u.reason==='max') return s+'<p class="ac-note">Nível máximo: '+esc(t.lv+' de '+t.maxLv)+'.</p>';
  if(X.arm===t.id&&u.ok===true) return s+'<p class="ac-note" role="alert">Gastar '+esc(nf(cost))+' de ouro para subir do nível '+esc(t.lv)+' para o nível '+esc(t.lv+1)+'?</p>'
    +'<div class="ac-row"><button class="ac-b ghost" data-x="upno">Cancelar</button><button class="ac-b gold" data-x="upok" data-t="'+id+'">Confirmar</button></div>';
  let eff=''; try{ eff='Cada nível dá +'+pctTx(k.DATA.levelRate)+' da produção base.'; }catch(e){ eff=''; }
  return s+(eff?'<p class="ac-note">'+esc(eff)+'</p>':'')+'<div class="ac-row"><button class="ac-b gold'+(u.ok===true?'':' off')+'" data-x="up" data-t="'+id+'" aria-disabled="'+(u.ok!==true)+'">Melhorar para o nível '+esc(t.lv+1)+': '+esc(nf(cost))+' de ouro'
    +(u.reason==='money'?'<small>falta ouro</small>':'')+'</button></div>'; }
function sheetHtml(t,v,k){ const fixed=t.upgrade&&t.upgrade.reason==='fixed';
  return '<div class="ac-ov"><div class="ac-sh" role="dialog" aria-label="'+esc(t.name)+'">'
    +'<div class="ac-shh">'+art(t.id)+'<div><b class="lil">'+esc(t.name)+'</b><small>'+(fixed?'Tenda fixa':'Nível '+esc(t.lv+' de '+t.maxLv))+'</small></div><button class="ac-b ghost" data-x="close">Fechar</button></div>'
    +'<div class="ac-kv" style="margin-top:8px"><span>Produção</span><b>+'+esc(rateTx(t.perHour)+' '+(RES[t.res]||''))+' por hora</b></div>'
    +'<div class="ac-kv"><span>Guardado agora</span><b>'+esc(nf(t.stored)+' de '+nf(t.cap))+'</b></div>'
    +'<p class="ac-note">'+(t.full?'Cheia: colete para voltar a encher.':'Enchendo. A coleta pega só as unidades inteiras; o resto continua na tenda.')+'</p>'
    +petsHtml(t,v,k)+upHtml(t,k)+'</div></div>'; }
const msgHtml=()=>'<div class="ac-msg">'+(X.msg?'<span class="'+(X.tone==='ok'?'ok':'bad')+'" role="'+(X.tone==='ok'?'status':'alert')+'">'+esc(X.msg)+'</span>':'')+'</div>';
const sigOf=v=>{ try{ return v.tents.map(t=>[t.id,t.stored,t.pct,t.lv,(t.pets||[]).join(','),t.upgrade&&t.upgrade.reason].join('/')).join('|')+'#'+(v.idlePets||[]).length; }catch(e){ return ''; } };

function draw(){ const d=xDims(520)||{}, k=K();
  if(!k){ V.innerHTML=xWrap(d,'',gateHtml(WHY.off,'Acampamento das Eras fechado')); X.sig='off'; return; }
  let v=null; try{ v=k.view(S,host()); }catch(e){ v=null; }
  if(!v||v.on!==true||!Array.isArray(v.tents)){ V.innerHTML=xWrap(d,'',gateHtml(WHY.off,'Acampamento das Eras fechado')); X.sig='off'; return; }
  if(v.locked){ V.innerHTML=xWrap(d,'',gateHtml(lockTx(v),'Acampamento das Eras trancado')); X.sig='gate'; return; }
  const any=v.tents.some(t=>num(t.stored)>0), sel=X.sel?v.tents.find(t=>t.id===X.sel)||null:null; if(!sel){ X.sel=''; X.arm=''; }
  /* mock B: Tenda do Ouro à esquerda com o herói abaixo; as outras tendas à direita, uma em cima e outra embaixo */
  const left=v.tents.filter(t=>t.res==='gold'), right=v.tents.filter(t=>t.res!=='gold'), L=left.length?left:right.slice(0,1), R=left.length?right:right.slice(1);
  const hero=canDraw()?'<div class="ac-hero"><canvas id="ac_hero" role="img" aria-label="Herói no Acampamento das Eras"></canvas></div>':'<div class="ac-hero"></div>';
  V.innerHTML=xWrap(d,'','<div class="ac'+((+d.H||0)&&d.H<540?' sm':'')+'">'+bgHtml()
    +'<div class="ac-top"><p class="ac-info">'+esc(v.text)+'</p>'+msgHtml()+'</div>'
    +'<div class="ac-main"><div class="ac-scene"><div class="ac-col l">'+L.map(cardHtml).join('')+hero+'</div><div class="ac-col r">'+R.map(cardHtml).join('')+'</div></div>'
    +'<div class="ac-foot"><button class="ac-b gold'+(any?'':' off')+'" data-x="all" aria-disabled="'+(!any)+'">Coletar tudo</button></div>'
    +(sel?sheetHtml(sel,v,k):'')+'</div></div>');
  X.sig=sigOf(v); loopStart(); }
function redraw(){ try{ if(typeof render==='function'&&isOn()) render(); else draw(); }catch(e){ draw(); } }

/* ================= ações ================= */
const persist=()=>{ try{ if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){} };
const say=(m,tone)=>{ X.msg=String(m||''); X.tone=tone==='ok'?'ok':'bad'; };
const gotTx=g=>['gold','forge','practice'].filter(x=>num(g&&g[x])>0).map(x=>'+'+nf(g[x])+' '+RES[x]).join(' · ');
const tentName=(k,id)=>{ try{ const d=k.DATA.tents.find(t=>t.id===id); return d?String(d.name):''; }catch(e){ return ''; } };
/* COLETA DE UMA TENDA: o módulo só coleta tudo. Anda o relógio, guarda o que as OUTRAS tendas juntaram, chama o collect do módulo UMA vez
   (só a tenda tocada tem o que entregar) e devolve o guardado às outras, sempre (finally). Nenhuma conta de prêmio é feita aqui. */
/* coleta de UMA tenda: a função do módulo (Sys.camp.collectTent, Sistemas e26ae54: mesma conta e tetos do coletar tudo). O bloco de reserva abaixo (zera as outras na memória, coleta e devolve) só vale para módulo antigo */
function collectOne(k,id){ if(typeof k.collectTent==='function') return k.collectTent(S,host(),id);
  const h=host(), o=k.tick(S,h), keep={};
  for(const t in o.tents) if(t!==id){ keep[t]=num(o.tents[t].acc); o.tents[t].acc=0; }
  try{ return k.collect(S,h); }
  finally{ const T=(S.sys&&S.sys.camp&&S.sys.camp.tents)||{}; for(const t in keep) if(T[t]) T[t].acc=num(T[t].acc)+keep[t]; } }
function doCollect(k,id){ let r=null; try{ r=id?collectOne(k,id):k.collect(S,host()); }catch(e){ r=null; }
  if(r&&r.ok){ sfx('claim'); say('Coletou: '+gotTx(r.got),'ok'); persist(); }
  else { sfx('ui_tap'); say(r&&r.reason==='empty'?(id?(tentName(k,id)||'A tenda')+': a'+WHY.empty.slice(1):'As tendas ainda não juntaram nada para coletar.'):(r&&WHY[r.reason])||'Não deu para coletar agora.'); if(id) persist(); } }
function click(b){ const ds=(b&&b.dataset)||{}, a=ds.x||'', k=K();
  if(a==='back'){ sfx('ui_tap'); try{ if(window.Screens&&Screens.close) Screens.close(); }catch(e){} return; }
  if(!k) return;
  let v=null; try{ v=k.view(S,host()); }catch(e){ v=null; } if(!v||v.on!==true||v.locked) return;
  const id=String(ds.t||''), has=v.tents.some(t=>t.id===id);
  if(a==='collect'){ if(!has) return; doCollect(k,id); redraw(); return; }
  if(a==='all'){ doCollect(k,''); redraw(); return; }
  if(a==='tent'){ if(!has) return; sfx('ui_tap'); X.sel=id; X.arm=''; X.msg=''; redraw(); return; }
  if(a==='close'){ sfx('ui_tap'); X.sel=''; X.arm=''; redraw(); return; }
  if(a==='up'){ if(!has) return; sfx('ui_tap'); let c=null; try{ c=k.canUpgrade(S,host(),id); }catch(e){ c=null; }
    if(c&&c.ok){ X.arm=id; X.msg=''; } else { X.arm=''; say((c&&WHY[c.reason])||'Não deu para melhorar agora.'); } redraw(); return; }
  if(a==='upno'){ sfx('ui_tap'); X.arm=''; redraw(); return; }
  if(a==='upok'){ if(!has||X.arm!==id){ X.arm=''; redraw(); return; } X.arm=''; let r=null; try{ r=k.upgrade(S,host(),id); }catch(e){ r=null; }
    if(r&&r.ok){ sfx('claim'); say((tentName(k,id)||'Tenda')+' no nível '+r.lv+': gastou '+nf(r.cost)+' de ouro.','ok'); persist(); } else { sfx('ui_tap'); say((r&&WHY[r.reason])||'Não deu para melhorar agora.'); }
    redraw(); return; }
  if(a==='pet'||a==='unpet'){ const p=String(ds.p||''); let r=null; try{ r=a==='pet'?k.assign(S,host(),id,p):k.unassign(S,host(),p); }catch(e){ r=null; }
    if(r&&r.ok){ sfx('ui_tap'); say(a==='pet'?petName(p)+' foi trabalhar: '+petBoostTx(k,p)+'.':petName(p)+' saiu da tenda.','ok'); persist(); } else { sfx('ui_tap'); say((r&&WHY[r.reason])||'Não deu agora.'); }
    X.arm=''; redraw(); return; }
}
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[COIN]; if(HELPER_IMG) u.push(HELPER_IMG); try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg); for(const id in ART_IMG) if(ART_IMG[id]) u.push(ART_IMG[id]);
    const k=K(); if(k){ const o=S&&S.sys&&S.sys.camp&&S.sys.camp.tents; if(o) for(const t in o) for(const p of (o[t].pets||[])){ const i=petImg(p); if(u.indexOf(i)<0) u.push(i); } } }catch(e){} return u; }

const def=Panels.add(N,{title:TITLE,actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  /* as tendas enchem com a tela aberta: confere 2 vezes por segundo e só redesenha quando um número muda */
  tick(){ try{ if(!isOn()) return; X.tk=(X.tk+1)%2; if(X.tk!==0) return; const k=K(); let s='off';
      if(k){ const v=k.view(S,host()); s=!v||v.on!==true?'off':v.locked?'gate':sigOf(v); }
      if(s!==X.sig) redraw(); }catch(e){} },
  onOpen(){ loopStop(); X.msg=''; X.tone=''; X.sel=''; X.arm=''; X.sig=''; X.tk=0; X.herr=0; },
  onClose(){ loopStop(); X.msg=''; X.sel=''; X.arm=''; } });
/* para o teste de fumaça e para conferir no console */
window.PCamp={X:X,actions:ACTIONS,def:def,urls:urls,ART_IMG:ART_IMG,HELPER_IMG:HELPER_IMG,art:art,collectOne:collectOne};
})();
