'use strict';
/* ================= TORRE V2 (desenho novo aprovado pelo dono) — tela nova, nasce DESLIGADA (PANEL_ON.tower2) =================
   Protótipo: docs/proto/v2/Torre.html · passagem: docs/proto/v2/PASSAGEM.md (seção 0). Não substitui o js/p_tower.js: é outra tela ('tower2').
   NENHUMA regra nem número de jogo aqui. Tudo vem dos módulos:
   - andar seguinte (ensure().best+1), adversário (opponent), FC do andar (floorFC), minha FC (playerStats), rótulo da chance (difficulty), prêmios (rewardsFor),
     chefe e marco (isBoss, isMilestone, nextMilestone), tentativas (ensure().lossesLeft e DATA.lossesPerDay), bônus permanente (bonus e DATA.perFloor),
     a luta (fight → {win, duel.log, rewards}) e a vida do adversário-cópia (scaledFoe): Sys.tower;
   - FC na escala de exibição: Sys.fc.viewText · tentativas a mais do VIP: Sys.vip.conv(S,'towerAdd') e Sys.vip.convTable() · portão: Sys.level;
   - ovo à escolha do andar 100: Sys.pet (ensure().choices, chooseEgg, DATA.pets).
   PALCO: window.drawHeroFull (js/battle.js) desenha o herói a pé com a arma NA MÃO, a asa e o PET POR ÚLTIMO (na frente). Do outro lado fica o adversário do
   andar: o fantasma (o OUTRO herói do jogo no corpo padrão, pela mesma rota, espelhado e azulado, com os pés no chão) ou a imagem do chefe da era do andar.
   A LUTA é resolvida UMA vez pelo Sys.tower.fight, que já entrega os prêmios e grava; a tela só REPRODUZ o registro (duel.log) com as barras de vida e os
   números de dano. Nada é decidido nem entregue aqui.
   O cabeçalho (Voltar, título, moedas) é do jogo. O arquivo roda em escopo próprio. Toques por data-x; a lista das ações tratadas fica em def.actions. */
(function(){
if(!('tower2' in PANEL_ON)) PANEL_ON.tower2=false;
const N='tower2';
const ACTIONS=['go','pick','later','back'];
const X={busy:false,fight:null,res:null,pick:false,toast:'',toastT:0,anim:true,top:true,sig:'',tk:0,raf:0,t0:0,t:0,fx:[],timer:0,hold:0,gerr:0};
const ROWS=10;        /* quantos andares a lista "Próximos andares" mostra (só desenho) */
const HOLD_MS=1600;   /* tempo da faixa de resultado no palco (só desenho) */

/* ---------- leituras dos módulos ---------- */
const TW=()=>(window.Sys&&Sys.tower)||null;
const tOk=()=>{ const T=TW(); return !!(T&&T.DATA&&T.ensure&&T.opponent&&T.fight&&T.playerStats&&T.rewardsFor&&T.difficulty); };
const host=()=>(window.Sys&&Sys.host)||null;
const now=()=>Date.now();
const isOn=()=>typeof view!=='undefined'&&view===N;
const redraw=()=>{ try{ if(isOn()&&typeof render==='function') render(); }catch(e){} };
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const call=fn=>{ try{ if(typeof fn==='function') return fn(); }catch(e){} };
const num=v=>(typeof v==='number'&&isFinite(v))?v:0;
const c01=v=>Math.max(0,Math.min(1,v));
const kfT=v=>{ try{ if(typeof kf==='function') return String(kf(v)); }catch(e){} return String(Math.round(num(v))); };
const nT=v=>{ try{ if(typeof n0==='function') return String(n0(v)); }catch(e){} return String(Math.round(num(v))); };
const fcT=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return kfT(v); };
const pcT=v=>(Math.round(num(v)*10)/10).toFixed(1).replace('.',',').replace(/,0$/,'')+'%';
const pl=(n,a,b)=>nT(n)+' '+(n===1?a:b);
const heroId=()=>{ try{ return S.hero==='kaia'?'kaia':'kael'; }catch(e){ return 'kael'; } };
const heroName=()=>heroId()==='kaia'?'Kaia':'Kael';
const lockLv=()=>{ try{ const L=Sys.level; return L&&L.isUnlocked&&!L.isUnlocked(S,'tower')?(L.unlockLevel?L.unlockLevel('tower'):1):0; }catch(e){ return 0; } };
const st=()=>TW().ensure(S,host());
const meNow=()=>{ try{ return TW().playerStats(S,host()); }catch(e){ return {fc:0,hp:1}; } };
/* tentativas por dia: as do módulo mais as do VIP de conveniência (o valor vem do Sys.vip; nenhum número aqui) */
function vipConv(){ try{ return (window.Sys&&Sys.vip&&Sys.vip.conv)?Sys.vip.conv(S,'towerAdd'):null; }catch(e){ return null; } }
function triesMax(){ const c=vipConv(); return TW().DATA.lossesPerDay+(c&&c.on?Math.max(0,Math.floor(+c.value||0)):0); }
/* "VIP 5: 4; VIP 10: 5": os degraus em que o Sys.vip soma tentativas (só com a chave de conveniências do módulo ligada) */
function vipSteps(){ const out=[]; try{ const M=Sys.vip; if(!M||!M.DATA||M.DATA.convOn!==true||typeof M.convTable!=='function') return out;
    const row=M.convTable().find(c=>c.id==='towerAdd'), v=row&&Array.isArray(row.values)?row.values:null; if(!v) return out; const base=TW().DATA.lossesPerDay;
    for(let l=1;l<v.length;l++) if((+v[l]||0)>(+v[l-1]||0)) out.push('VIP '+l+': '+nT(base+(+v[l]||0))); }catch(e){} return out; }
/* era da arte do chefe: a mesma conta da skin do fantasma (Sys.tower.DATA.skin) */
function bossEra(f){ try{ const K=TW().DATA.skin; return Math.max(0,Math.min(K.eras-1,Math.floor((Math.max(1,f)-1)/K.eraEvery))); }catch(e){ return 0; } }
const bossUrl=f=>'assets/enemies/era'+bossEra(f)+'_boss.png';
const bossPct=()=>{ try{ return Math.round((TW().DATA.bossFcMult-1)*100); }catch(e){ return 0; } };
const perFloor=()=>{ try{ return num(TW().DATA.perFloor.atkPct); }catch(e){ return 0; } };
const rarName=r=>{ try{ return (typeof RN==='function'&&RN(r))||''; }catch(e){ return ''; } };
const petDef=id=>{ try{ return (Sys.pet.DATA.pets||[]).find(p=>p.id===id)||null; }catch(e){ return null; } };
const petImg=d=>d&&d.sprite?'assets/icons/pets/'+d.sprite+'_ref.png':IC.egg;
/* ovo à escolha do andar 100 ainda pendente no Sys.pet: {i, options} */
function pendingPick(){ try{ const P=Sys.pet; if(!P||typeof P.chooseEgg!=='function') return null; const ch=P.ensure(S).choices; if(!Array.isArray(ch)) return null;
    for(let i=0;i<ch.length;i++){ const c=ch[i]; if(c&&c.source==='tower100'&&Array.isArray(c.options)&&c.options.length) return {i:i,options:c.options.slice()}; } }catch(e){} return null; }

/* ---------- imagens (só as que já existem no jogo) ---------- */
const IC={coin:'assets/ui/coin.png',gem:'assets/ui/gem.png',forge:'assets/icons/menu/forge.png',egg:'assets/icons/pets/pet_egg.png',tower:'assets/icons/menu/tower.png'};
const ic=(u,z)=>'<img src="'+u+'" alt="" style="width:'+(z||18)+'px;height:'+(z||18)+'px">';

(function(){ if(typeof document==='undefined'||!document.head) return; const el=document.createElement('style'); el.textContent=`
.t2{--night:#0b1030;--glass:rgba(24,33,86,.78);--line:rgba(130,150,255,.28);--line2:rgba(160,180,255,.5);--gold:#ffd25e;--cyan:#5ee7ff;--violet:#a97bff;--rose:#ff6b9a;--green:#5ef0a0;--red:#ff6b6b;--text:#eef1ff;--muted:#9aa6d6;--ink:#1c1206;
  position:relative;flex:1;min-height:0;min-width:0;display:flex;flex-direction:column;overflow:hidden;background:var(--night);color:var(--text);font-family:Nunito,system-ui,sans-serif}
.t2 *{box-sizing:border-box}
.t2 button{color:inherit;font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent}
.t2 .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
.t2-in{animation:t2-fade .22s ease-out}
@keyframes t2-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
.t2-bg{position:absolute;left:0;right:0;top:0;height:380px;pointer-events:none}
.t2-bg2{position:absolute;left:0;right:0;top:230px;height:150px;pointer-events:none;background:linear-gradient(180deg,rgba(11,16,48,0),var(--night))}
.t2-stage{position:relative;z-index:2;flex:none;min-width:0}
.t2-stage canvas{position:absolute;left:0;top:0;width:100%;height:100%}
.t2-hp{position:absolute;z-index:3;top:6px;width:calc(50% - 18px);max-width:150px;min-width:0}
.t2-hp.l{left:10px}
.t2-hp.r{right:10px;text-align:right}
.t2-hp b{display:block;font-size:11px;font-weight:900;line-height:1.15;overflow-wrap:anywhere;text-shadow:0 1px 0 rgba(0,0,0,.6)}
.t2-hpb{height:8px;border-radius:4px;background:rgba(0,0,0,.45);overflow:hidden;margin-top:3px;border:1px solid rgba(255,255,255,.15)}
.t2-hpb i{display:block;height:100%;background:linear-gradient(90deg,#5ef0a0,#22c47a);transition:width .12s linear}
.t2-hp.r .t2-hpb i{background:linear-gradient(90deg,#ff9f9f,#ff6b6b);margin-left:auto}
.t2-ban{position:absolute;z-index:4;left:8px;right:8px;top:54px;text-align:center;font-size:24px;letter-spacing:1px;line-height:1.1;overflow-wrap:anywhere;text-shadow:0 3px 0 rgba(0,0,0,.45);pointer-events:none;animation:t2-pop .5s ease-out both}
.t2-ban.w{color:#7dffb8}
.t2-ban.l{color:#ff9f9f}
@keyframes t2-pop{0%{opacity:0;transform:scale(.5)}70%{opacity:1;transform:scale(1.08)}100%{transform:scale(1)}}
.t2-bt,.xs .t2-bt{flex:1;min-width:0;min-height:44px;padding:4px 10px;border-radius:11px;border:0;font-weight:900;font-size:14px;line-height:1.15;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;box-shadow:0 3px 0 #9a5a10;display:inline-flex;align-items:center;justify-content:center;gap:5px;text-align:center;overflow-wrap:anywhere}
.t2-bt:active{transform:translateY(2px);box-shadow:0 1px 0 #9a5a10}
.t2-bt.off,.xs .t2-bt.off{background:rgba(255,255,255,.06);color:#9aa6d6;box-shadow:none;border:1px solid rgba(130,150,255,.28)}
.t2-bt.ghost,.xs .t2-bt.ghost{background:rgba(255,255,255,.08);color:#eef1ff;box-shadow:none;border:1px solid rgba(160,180,255,.5)}
.t2-fl{position:relative;z-index:3;flex:none;margin:4px 12px 0;padding:9px 10px;border-radius:16px;background:linear-gradient(160deg,rgba(169,123,255,.2),rgba(24,33,86,.94) 60%);border:2px solid rgba(169,123,255,.55);min-width:0}
.t2-fl.boss{background:linear-gradient(160deg,rgba(255,107,107,.22),rgba(24,33,86,.94) 60%);border-color:rgba(255,107,107,.6)}
.t2-flh{display:flex;align-items:center;gap:8px;min-width:0}
.t2-num{flex:none;text-align:center;font-weight:900;font-size:9.5px;color:var(--muted);line-height:1}
.t2-num b{display:block;font-size:30px;color:#fff;line-height:1}
.t2-flh .t{flex:1;min-width:0}
.t2-flh .t b{display:block;font-size:15px;line-height:1.15;overflow-wrap:anywhere}
.t2-flh .t small{display:block;font-size:11px;font-weight:800;color:var(--muted);line-height:1.25;overflow-wrap:anywhere}
.t2-dif{flex:none;max-width:38%;font-size:10px;font-weight:900;padding:3px 8px;border-radius:8px;text-align:center;line-height:1.15}
.t2-dif.easy{background:rgba(94,240,160,.18);color:var(--green)}
.t2-dif.even{background:rgba(255,210,94,.18);color:var(--gold)}
.t2-dif.hard{background:rgba(255,164,52,.2);color:#ffb86b}
.t2-dif.nope{background:rgba(255,107,107,.2);color:#ff9f9f}
.t2-vs{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:center;margin-top:6px}
.t2-vs span{min-width:0;border-radius:10px;background:rgba(5,8,28,.55);padding:5px 8px;font-size:10px;font-weight:900;color:var(--muted);line-height:1.2;text-align:center;overflow-wrap:anywhere}
.t2-vs span b{display:block;font-size:15px;color:var(--text);font-variant-numeric:tabular-nums}
.t2-vs i{font-style:normal;font-size:16px;color:var(--gold)}
.t2-rws{display:flex;flex-wrap:wrap;gap:4px;margin-top:6px;min-width:0}
.t2-rwc{display:inline-flex;align-items:center;gap:3px;min-height:24px;max-width:100%;padding:2px 7px 2px 3px;border-radius:12px;background:rgba(5,8,28,.55);border:1px solid var(--line);font-size:10.5px;font-weight:900;line-height:1.15;overflow-wrap:anywhere}
.t2-rwc img{flex:none;object-fit:contain}
.t2-row{display:flex;gap:8px;margin-top:7px;align-items:center;min-width:0}
.t2-tries{flex:none;text-align:center;font-size:9.5px;font-weight:900;color:var(--muted);line-height:1.1}
.t2-tries b{display:block;font-size:16px;color:var(--text)}
.t2-res{font-size:11px;font-weight:800;line-height:1.4;margin:6px 0 0;overflow-wrap:anywhere}
.t2-res.w{color:var(--green)}
.t2-res.l{color:#ffb3c4}
.t2-scroll{position:relative;z-index:3;flex:1;min-height:0;min-width:0;padding:8px 12px 16px}
.t2-bon{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:13px;background:linear-gradient(90deg,rgba(94,240,160,.14),rgba(24,33,86,.9) 70%);border:1px solid rgba(94,240,160,.45);margin-bottom:6px;min-width:0}
.t2-bon b{font-size:20px;color:var(--green);flex:none}
.t2-bon span{flex:1;min-width:0;font-size:11px;font-weight:800;color:var(--muted);line-height:1.35;overflow-wrap:anywhere}
.t2-bon span em{font-style:normal;color:var(--text)}
.t2-sec{font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:var(--muted);font-weight:900;margin:10px 0 6px;display:flex;justify-content:space-between;gap:8px;align-items:center;min-width:0}
.t2-sec span{min-width:0;overflow-wrap:anywhere}
.t2-sec span:last-child{letter-spacing:0;text-transform:none;text-align:right}
.t2-tw{display:flex;flex-direction:column-reverse;gap:4px}
.t2-fr{display:flex;align-items:center;gap:8px;min-height:34px;padding:5px 9px;border-radius:11px;background:var(--glass);border:1px solid var(--line);min-width:0}
.t2-fr.now{border:2px solid var(--gold);background:rgba(255,210,94,.1)}
.t2-fr.boss{background:rgba(255,107,107,.12)}
.t2-fr .n{flex:none;width:34px;font-size:17px;color:var(--muted);text-align:center}
.t2-fr.now .n{color:var(--gold)}
.t2-fr .mi{flex:1;min-width:0;font-size:11.5px;font-weight:800;line-height:1.25;overflow-wrap:anywhere}
.t2-fr .mi small{color:var(--muted);font-size:inherit}
.t2-tg{flex:none;display:flex;flex-direction:column;gap:2px;align-items:flex-end}
.t2-tg span{font-size:9px;font-weight:900;padding:2px 6px;border-radius:7px;white-space:nowrap}
.t2-tg .b{background:rgba(255,107,107,.2);color:#ffb3b3}
.t2-tg .e{background:rgba(169,123,255,.2);color:#d4bfff}
.t2-tg .m{background:rgba(255,210,94,.2);color:var(--gold)}
.t2-hint{font-size:11px;color:var(--muted);margin:8px 0 0;line-height:1.4;font-weight:700;overflow-wrap:anywhere}
.t2-toast{position:absolute;left:50%;z-index:40;transform:translateX(-50%);width:max-content;max-width:calc(100% - 24px);padding:8px 14px;border-radius:13px;background:rgba(5,8,28,.94);border:1px solid var(--line2);font-weight:900;font-size:12px;line-height:1.25;text-align:center;overflow-wrap:anywhere;pointer-events:none;animation:t2-tin .25s ease-out both}
@keyframes t2-tin{from{opacity:0;transform:translate(-50%,-8px)}}
.t2-ch{position:absolute;inset:0;z-index:30;background:rgba(3,5,18,.82);display:flex;align-items:center;justify-content:center;padding:16px}
.t2-ch>div{width:100%;max-width:340px;min-width:0;border-radius:18px;background:#141c4a;border:1px solid var(--line2);padding:14px;text-align:center}
.t2-ch h3{margin:0 0 4px;font-size:22px;line-height:1.1;overflow-wrap:anywhere}
.t2-ch p{margin:0 0 10px;font-size:12px;font-weight:800;color:var(--muted);line-height:1.35;overflow-wrap:anywhere}
.t2-chg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-bottom:8px}
.t2-chg button,.xs .t2-chg button{min-width:0;min-height:44px;border-radius:14px;border:2px solid var(--line2);background:rgba(5,8,28,.6);color:#eef1ff;padding:8px 4px;font-weight:900;font-size:13px;line-height:1.15;overflow-wrap:anywhere}
.t2-chg button img{width:96px;max-width:100%;height:auto;aspect-ratio:1;object-fit:contain;display:block;margin:0 auto 4px}
.t2-chg button small{display:block;font-size:10px;color:var(--muted);font-weight:800;margin-top:2px}
.t2-gate{position:relative;z-index:3;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center}
.t2-gate .t2-bt{flex:none;min-height:48px;padding:0 26px;font-size:15px}
.t2-msg{font-size:13px;font-weight:800;color:var(--muted);line-height:1.4;overflow-wrap:anywhere}
@media (prefers-reduced-motion:reduce){.t2-in,.t2-ban,.t2-toast{animation:none}.t2-hpb i{transition:none}}
`; document.head.appendChild(el); })();

/* ---------- aviso (dentro da tela, abaixo do palco: nunca por cima do herói) ---------- */
const toastHtml=(m,top)=>'<div class="t2-toast" role="status" style="top:'+top+'px">'+esc2(m)+'</div>';
let toastTop=200;
function say(m){ X.toast=String(m||''); X.toastT=now(); try{ const el=document.getElementById('t2_toast'); if(el) el.innerHTML=toastHtml(X.toast,toastTop); }catch(e){} }

/* ================= PALCO (canvas): chão, adversário do andar, herói do jogo com o pet na frente, números de dano ================= */
const IMG={};
function img(u){ let o=IMG[u]; if(o!==undefined) return o; try{ if(typeof Image==='undefined'){ IMG[u]=null; return null; } o=new Image(); o.src=u; IMG[u]=o; }catch(e){ o=IMG[u]=null; } return o; }
const okImg=i=>!!(i&&i.complete&&i.naturalWidth>0);
const canDraw=()=>{ try{ return typeof window.drawHeroFull==='function'&&typeof HS==='number'&&HS>0; }catch(e){ return false; } };
/* andar que o palco mostra: o da luta em curso (ou recém-acabada, enquanto a faixa está na tela), senão o próximo */
function stageFloor(){ if(X.fight) return X.fight.floor; try{ return st().best+1; }catch(e){ return 1; } }
let GCV=null;
function ghostCv(w,h){ try{ if(!GCV) GCV=document.createElement('canvas'); if(!GCV||typeof GCV.getContext!=='function') return null; if(GCV.width!==w||GCV.height!==h){ GCV.width=w; GCV.height=h; } return GCV; }catch(e){ return null; } }
/* FANTASMA: o outro herói no corpo padrão, pela rota única do jogo (arma na mão, pés no chão), espelhado, azulado e translúcido */
function drawGhost(x,g,t,lunge,hurt){ if(X.gerr||!canDraw()) return; const c=ghostCv(g.pw,g.ph); if(!c) return; const q=c.getContext('2d'); if(!q) return;
  q.setTransform(1,0,0,1,0,0); q.globalCompositeOperation='source-over'; q.globalAlpha=1; q.clearRect(0,0,g.pw,g.ph);
  let ok=false; q.save();
  try{ q.setTransform(g.dpr,0,0,g.dpr,0,0); q.translate(2*g.RX,0); q.scale(-1,1);
    ok=window.drawHeroFull(q,g.RX+lunge*12,g.GY,g.k,{t:t,hero:heroId()==='kael'?'kaia':'kael',skin:'default',mount:false,pet:false})!==false; }
  catch(e){ X.gerr=1; }
  q.restore(); if(!ok) return;
  q.setTransform(1,0,0,1,0,0); q.globalCompositeOperation='source-atop'; q.fillStyle='rgba(120,170,255,.45)'; q.fillRect(0,0,g.pw,g.ph); q.globalCompositeOperation='source-over';
  x.save(); x.setTransform(1,0,0,1,0,0); x.globalAlpha=(hurt>0?0.45:0.78)+0.06*Math.sin(t*3); x.shadowColor='rgba(120,170,255,.9)'; x.shadowBlur=8*g.dpr; x.drawImage(c,0,0); x.restore(); }
/* CHEFE: a imagem do chefe da era do andar (a mesma da tela de hoje), com os pés no chão, virada para o herói como na batalha */
function drawBoss(x,g,t,f,lunge,hurt){ const B=img(bossUrl(f)); if(!okImg(B)) return; const sz=Math.min(g.H*0.8,g.W*0.42), br=1+0.015*Math.sin(t*2), sh=hurt>0?Math.sin(t*90)*3:0;
  x.save(); x.globalAlpha=.3; x.fillStyle='#1e1208'; x.beginPath(); x.ellipse(g.RX,g.GY+3,sz*0.33,7,0,0,7); x.fill(); x.restore();
  x.save(); x.translate(g.RX-lunge*12+sh,g.GY+sz*0.05); x.scale(1,br); x.drawImage(B,-sz/2,-sz,sz,sz); x.restore(); }
function ground(x,g){ const gr=x.createRadialGradient(g.W/2,g.GY,10,g.W/2,g.GY,g.W/2); gr.addColorStop(0,'rgba(169,123,255,.25)'); gr.addColorStop(1,'rgba(169,123,255,0)'); x.fillStyle=gr; x.beginPath(); x.ellipse(g.W/2,g.GY,g.W/2,16,0,0,7); x.fill(); }
function drawFx(x,g,t){ X.fx=X.fx.filter(p=>t-p.t<1.1&&t>=p.t-0.01); for(const p of X.fx){ const a=c01((t-p.t)/1.1), px=p.s===0?g.RX:g.LX, py=g.GY-g.H*0.6-a*30;
    x.save(); x.globalAlpha=1-a; x.font='900 '+(p.big?16:13)+'px Nunito,sans-serif'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.6)'; x.fillStyle=p.c; x.strokeText(p.txt,px,py); x.fillText(p.txt,px,py); x.restore(); } }
function frame(c,ts){ const dpr=Math.min(window.devicePixelRatio||1,2), w=c.clientWidth||390, h=c.clientHeight||190;
  if(c.width!==Math.round(w*dpr)||c.height!==Math.round(h*dpr)){ c.width=Math.round(w*dpr); c.height=Math.round(h*dpr); }
  if(!X.t0) X.t0=ts; const t=Math.max(0,(ts-X.t0)/1000); X.t=t; const x=c.getContext('2d'), base=()=>x.setTransform(dpr,0,0,dpr,0,0);
  base(); x.clearRect(0,0,w,h);
  const hs=(typeof HS==='number'&&HS>0)?HS:155, hk=Math.min(0.6,(h-30)/256);
  const g={W:w,H:h,dpr:dpr,pw:c.width,ph:c.height,LX:Math.round(w*0.3),RX:Math.round(w*0.73),GY:h-20,k:hk*256/hs};
  const F=X.fight, e=F&&F.e, age=e?t-e.t:9, la=e&&e.s===0?Math.max(0,1-age*5):0, lb=e&&e.s===1?Math.max(0,1-age*5):0, hb=e&&e.s===0?Math.max(0,0.3-age):0, f=stageFloor();
  const part=fn=>{ try{ fn(); }catch(err){ try{ x.restore(); }catch(e2){} } base(); };
  part(()=>ground(x,g));
  part(()=>{ if(tOk()&&TW().isBoss(f)) drawBoss(x,g,t,f,lb,hb); else drawGhost(x,g,t,lb,hb); });
  part(()=>{ if(canDraw()) window.drawHeroFull(x,g.LX+la*12,g.GY,g.k,{t:t,mount:false}); });   /* herói a pé; o pet é o último desenho do drawHeroFull (na frente) */
  part(()=>drawFx(x,g,t)); }
function loop(ts){ X.raf=0; let c=null; try{ c=document.getElementById('t2_stc'); }catch(e){} if(!c||!isOn()){ X.t0=0; return; }
  try{ frame(c,ts); }catch(e){}
  X.raf=requestAnimationFrame(loop); }
function loopStart(){ try{ if(!X.raf&&typeof requestAnimationFrame==='function'&&document.getElementById('t2_stc')) X.raf=requestAnimationFrame(loop); }catch(e){} }
function loopStop(){ try{ if(X.raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(X.raf); }catch(e){} X.raf=0; X.t0=0; }

/* ================= HTML ================= */
const bgHtml=()=>'<div class="t2-bg" style="background:'+(typeof xEraBg==='function'?xEraBg(0.45,0.9):'#16110d')+'"></div><div class="t2-bg2"></div>';
function emptyHtml(msg,title){ return '<div class="t2">'+bgHtml()+'<div class="t2-gate" role="dialog" aria-label="'+esc2(title)+'"><span class="lil" style="font-size:26px">Torre</span>'
  +'<span class="t2-msg" role="alert">'+esc2(msg)+'</span><button class="t2-bt" data-x="back">Voltar</button></div></div>'; }
/* prêmios do andar em etiquetas: só o que o módulo dono entrega (sem o módulo carregado, a etiqueta não aparece: a tela não promete o que não vem) */
function chips(rw){ const Y=window.Sys||{}, c=[], chip=(u,txt)=>{ c.push('<span class="t2-rwc">'+ic(u)+esc2(txt)+'</span>'); };
  if(rw.gold) chip(IC.coin,kfT(rw.gold));
  if(rw.stones&&Y.practice) chip(IC.forge,pl(rw.stones,'pedra de treino','pedras de treino'));
  if(rw.gems) chip(IC.gem,nT(rw.gems));
  if(rw.forge&&Y.forge) chip(IC.forge,pl(rw.forge,'pedra de forja','pedras de forja'));
  if(rw.egg&&Y.pet){ if(Array.isArray(rw.egg.choice)) chip(IC.egg,'ovo '+rarName(rw.egg.r)+' à escolha'); else if(rw.egg.minR!=null) chip(IC.egg,'ovo (mín. '+rarName(rw.egg.minR)+')'); else chip(IC.egg,'ovo de pet'); }
  if(rw.prismFrags&&Y.pet){ const d=petDef('prism'); chip(IC.egg,pl(rw.prismFrags,'fragmento','fragmentos')+(d?' do '+d.name:'')); }
  { const tf=rw.t100Frags||rw.phoenixFrags||0; if(tf&&Y.pet){ const d=rw.t100Pet?petDef(rw.t100Pet):null; chip(IC.egg,pl(tf,'fragmento','fragmentos')+(d?' do '+d.name:' do pet do andar 100')); } }
  return c.join(''); }
/* frase do resultado (o que o Sys.tower.fight devolveu; nada é entregue aqui) */
function resHtml(R){ if(!R) return '';
  if(!R.win) return '<p class="t2-res l" role="status">Derrota no andar '+nT(R.floor)+' (o adversário ficou com '+nT(R.left)+'% de vida). Gastou 1 tentativa.</p>';
  const rw=R.rw||{}, h=rw.hatched, P=[]; if(rw.gold) P.push('+'+kfT(rw.gold)+' de ouro'); if(rw.gems) P.push('+'+pl(rw.gems,'diamante','diamantes')); if(rw.stones) P.push('+'+pl(rw.stones,'pedra de treino','pedras de treino')); if(rw.forge) P.push('+'+pl(rw.forge,'pedra de forja','pedras de forja'));
  if(rw.egg) P.push(h&&h.name?(h.isNew?'novo pet: '+h.name:h.name+' repetido'+(h.frags?': +'+pl(h.frags,'fragmento','fragmentos'):'')):Array.isArray(rw.egg.choice)?'1 ovo à escolha':'1 ovo');
  const per=perFloor();
  return '<p class="t2-res w" role="status">Andar '+nT(R.floor)+' vencido'+(P.length?': '+esc2(P.join(', ')):'')+'.'+(per?' Bônus para sempre: +'+pcT(per)+' ATQ e VIDA.':'')+'</p>'; }
function floorHtml(f,me,left,max,busy){ const T=TW(), opp=T.opponent(f), boss=opp.kind==='boss', dif=T.difficulty(me.fc,opp.fc), rw=T.rewardsFor(f,host(),S), can=left>0&&!busy, bp=bossPct();
  return '<div class="t2-fl'+(boss?' boss':'')+'"><div class="t2-flh"><span class="t2-num">ANDAR<b class="lil">'+nT(f)+'</b></span>'
    +'<span class="t"><b>'+esc2(opp.name)+'</b><small>'+(boss?'Chefe'+(bp?' (FC +'+bp+'%)':''):'Fantasma')+' · próximo marco: andar '+nT(T.nextMilestone(f))+'</small></span>'
    +'<span class="t2-dif '+esc2(dif.id)+'">'+esc2(dif.txt)+'</span></div>'
    +'<div class="t2-vs"><span>Você<b>'+esc2(fcT(me.fc))+'</b></span><i class="lil">VS</i><span>Andar '+nT(f)+'<b>'+esc2(fcT(opp.fc))+'</b></span></div>'
    +'<div class="t2-rws" aria-label="Prêmios do andar '+nT(f)+'">'+chips(rw)+'</div>'
    +'<div class="t2-row"><button class="t2-bt'+(can?'':' off')+'" data-x="go" aria-disabled="'+(!can)+'">'+(busy?'Lutando...':left>0?'Desafiar':'Sem tentativas hoje')+'</button>'
    +'<span class="t2-tries" role="img" aria-label="Derrotas que ainda pode ter hoje: '+nT(left)+' de '+nT(max)+'">derrotas<b>'+nT(left)+'/'+nT(max)+'</b></span></div>'
    +(busy?'':resHtml(X.res))+'</div>'; }
function bodyHtml(best,max){ const T=TW(), D=T.DATA, f=best+1, Y=window.Sys||{}, per=perFloor(); let rows='', b=0; try{ b=num(T.bonus(S).atkPct); }catch(e){}
  for(let i=f;i<f+ROWS;i++){ const o=T.opponent(i), rw=T.rewardsFor(i,host(),S), tg=[]; if(o.kind==='boss') tg.push('<span class="b">CHEFE</span>'); if(rw.egg&&Y.pet) tg.push('<span class="e">OVO</span>'); if(T.isMilestone(i)) tg.push('<span class="m">MARCO</span>');
    rows+='<div class="t2-fr'+(i===f?' now':'')+(o.kind==='boss'?' boss':'')+'"><span class="n lil">'+nT(i)+'</span><span class="mi">'+esc2(o.name)+' <small>· FC '+esc2(fcT(o.fc))+(rw.gems?' · '+pl(rw.gems,'diamante','diamantes'):'')+'</small></span>'+(tg.length?'<span class="t2-tg">'+tg.join('')+'</span>':'')+'</div>'; }
  const vs=vipSteps();
  return '<div class="t2-bon"><b class="lil">+'+pcT(b)+'</b><span><em>ATQ e VIDA para sempre</em> '+(best===1?'pelo andar vencido':'pelos '+nT(best)+' andares vencidos')+(per?' (+'+pcT(per)+' cada)':'')+'</span></div>'
    +'<div class="t2-sec"><span>Próximos andares</span><span>chefe a cada '+nT(D.bossEvery)+'</span></div><div class="t2-tw">'+rows+'</div>'
    +'<p class="t2-hint">Só a derrota gasta tentativa: '+nT(max)+' por dia'+(vs.length?' ('+esc2(vs.join('; '))+')':'')+'. Vencer não gasta nada, então dá para subir vários andares no mesmo dia.</p>'; }
function ovHtml(){ const F=X.fight; if(!F) return '';
  let h='<div class="t2-hp l"><b>'+esc2(heroName())+' · FC '+esc2(fcT(F.meFc))+'</b><div class="t2-hpb"><i id="t2_hpa" style="width:'+(c01(F.hpA)*100).toFixed(1)+'%"></i></div></div>'
    +'<div class="t2-hp r"><b>'+esc2(F.name)+'</b><div class="t2-hpb"><i id="t2_hpb" style="width:'+(c01(F.hpB)*100).toFixed(1)+'%"></i></div></div>';
  if(F.done) h+='<div class="t2-ban lil '+(F.win?'w':'l')+'" role="status">'+(F.win?'ANDAR '+nT(F.floor)+' VENCIDO':'DERROTA')+'</div>';
  return h; }
function pickHtml(){ const pk=X.pick?pendingPick():null; if(!pk){ X.pick=false; return ''; }
  const opts=pk.options.map(id=>({id:id,d:petDef(id)})).filter(o=>o.d);
  if(!opts.length){ X.pick=false; return ''; }
  return '<div class="t2-ch" role="dialog" aria-label="Escolha o seu ovo"><div><h3 class="lil">Andar '+nT(TW().DATA.pet.phoenixAt)+'!</h3><p>Escolha o seu ovo. Depois deste andar, os fragmentos vão para o pet escolhido.</p><div class="t2-chg">'
    +opts.map(o=>'<button data-x="pick" data-id="'+esc2(o.id)+'"><img src="'+esc2(petImg(o.d))+'" alt="">'+esc2(o.d.name)+'<small>'+esc2(rarName(o.d.r))+'</small></button>').join('')
    +'</div><button class="t2-bt ghost" data-x="later" style="width:100%">Escolher depois, na tela de Pets</button></div></div>'; }

/* ================= desenho da tela ================= */
function draw(){
  const d=xDims(240)||{};
  if(!tOk()){ V.innerHTML=xWrap(d,'',emptyHtml('Torre indisponível agora.','Torre indisponível')); X.sig='x'; return; }
  const lk=lockLv();
  if(lk){ V.innerHTML=xWrap(d,'',emptyHtml('Libera no nível '+lk+'. Continue lutando para liberar.','Torre bloqueada')); X.sig='gate'; return; }
  let y0=0; try{ const sc0=X.top?null:document.getElementById('t2_scroll'); y0=sc0?(+sc0.scrollTop||0):0; }catch(e){}
  const o=st(), F=X.fight, busy=!!(F&&!F.done), best=busy?F.best0:o.best, f=best+1, max=triesMax(), left=busy?F.left0:o.lossesLeft, me=busy?{fc:F.meFc}:meNow();
  const Hh=+d.H||0, SH=Hh&&Hh<600?164:190; toastTop=SH+8;
  const alt=heroName()+' com a arma na mão e o pet na frente, diante '+(TW().isBoss(stageFloor())?'do chefe':'do fantasma')+' do andar '+stageFloor();
  V.innerHTML=xWrap(d,'','<div class="t2'+(X.anim?' t2-in':'')+'">'+bgHtml()
    +'<div class="t2-stage" style="height:'+SH+'px"><canvas id="t2_stc" role="img" aria-label="'+esc2(alt)+'"></canvas><div id="t2_ov">'+ovHtml()+'</div></div>'
    +floorHtml(f,me,left,max,busy)
    +'<div id="t2_scroll" class="t2-scroll x-scroll">'+bodyHtml(best,max)+'</div>'
    +'<div id="t2_toast">'+(X.toast&&now()-X.toastT<2000?toastHtml(X.toast,toastTop):'')+'</div>'+pickHtml()+'</div>');
  if(y0){ try{ const sc=document.getElementById('t2_scroll'); if(sc) sc.scrollTop=y0; }catch(e){} }
  X.anim=false; X.top=false; X.sig=sig(); loopStart();
}
/* o que muda por fora (FC subindo na batalha, virada do dia, VIP): o tick redesenha só quando muda */
function sig(){ if(!tOk()) return 'x'; if(lockLv()) return 'gate'; try{ const o=st(); return [o.best,o.lossesLeft,triesMax(),Math.round(num(meNow().fc)),heroId()].join('|'); }catch(e){ return ''; } }

/* ================= a luta ================= */
function stopFight(){ clearTimeout(X.timer); clearTimeout(X.hold); X.timer=0; X.hold=0; X.busy=false; X.fight=null; X.fx=[]; }
function setBar(id,v){ try{ const el=document.getElementById(id); if(el&&el.style) el.style.width=(c01(v)*100).toFixed(1)+'%'; }catch(e){} }
function finish(F){ F.done=true; X.busy=false; const r=F.r;
  X.res=r.win?{win:true,floor:F.floor,rw:r.rewards||{}}:{win:false,floor:F.floor,left:Math.round(c01(num(r.duel&&r.duel.hpB))*100)};
  sfx(r.win?'claim':'ui_tap');
  if(r.win&&r.rewards&&r.rewards.egg&&Array.isArray(r.rewards.egg.choice)&&pendingPick()) X.pick=true;
  X.top=!!r.win; redraw();
  X.hold=setTimeout(()=>{ if(X.fight===F){ X.fight=null; redraw(); } },HOLD_MS); }
/* reproduz o registro do duelo (quem bateu, dano, vida que sobrou): barras por id, números no palco. O ritmo é só desenho */
function play(F){ const log=F.log, gap=Math.max(60,Math.min(220,3200/Math.max(1,log.length)));
  const step=()=>{ if(X.fight!==F||F.done) return; if(!isOn()){ stopFight(); return; }
    if(F.k>=log.length){ finish(F); return; }
    const e=log[F.k++]; F.e={s:e.s,t:X.t};
    if(e.s===0){ F.hpB=num(e.hp)/F.maxB; setBar('t2_hpb',F.hpB); } else { F.hpA=num(e.hp)/F.maxA; setBar('t2_hpa',F.hpA); }
    X.fx.push({s:e.s,t:X.t,big:!!e.crit,c:e.crit?'#ffe58a':'#fff',txt:(e.crit?'Crítico! ':'')+'-'+kfT(e.dmg)}); if(X.fx.length>24) X.fx.shift();
    sfx(e.crit?'crit':'hit');
    X.timer=setTimeout(step,gap); };
  X.timer=setTimeout(step,gap); }
function challenge(){ if(X.busy||!tOk()) return; const T=TW(), o=st();
  if(o.lossesLeft<=0){ sfx('ui_tap'); say('Sem tentativas hoje. Elas voltam amanhã'); return; }
  const best0=o.best, left0=o.lossesLeft; let r=null; try{ r=T.fight(S,host()); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='locked'?'A Torre libera no nível '+(r.level||'?'):r&&r.reason==='tries'?'Sem tentativas hoje. Elas voltam amanhã':'Não foi possível desafiar agora'); redraw(); return; }
  /* a vitória ou a derrota e os prêmios JÁ estão no save: grava agora, mesmo que o jogador saia antes do fim da animação */
  call(typeof statsChanged==='function'?statsChanged:typeof save==='function'?save:null);
  clearTimeout(X.timer); clearTimeout(X.hold); X.fx=[]; X.res=null; X.pick=false;
  let maxB=1; try{ maxB=Math.max(1,num(T.scaledFoe(r.me,r.opp.fc).hp)); }catch(e){ maxB=Math.max(1,num(r.me.hp)); }
  const F=X.fight={r:r,floor:r.floor,best0:best0,left0:left0,win:!!r.win,name:r.opp.name,meFc:r.me.fc,log:(r.duel&&r.duel.log)||[],k:0,hpA:1,hpB:1,maxA:Math.max(1,num(r.me.hp)),maxB:maxB,e:null,done:false};
  X.busy=true; sfx('ui_tap'); redraw(); play(F); }
function pickEgg(id){ const pk=pendingPick(); X.pick=false; if(!pk||pk.options.indexOf(id)<0){ redraw(); return; }
  let r=null; try{ r=Sys.pet.chooseEgg(S,host(),pk.i,id); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say('Não deu para escolher agora. O ovo fica guardado na tela de Pets'); redraw(); return; }
  call(typeof statsChanged==='function'?statsChanged:typeof save==='function'?save:null); sfx('claim');
  const d=petDef(id); say('Ovo escolhido: '+(d?d.name:'pet')); redraw(); }

function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{};
  if(a==='back'){ sfx('ui_tap'); try{ if(window.Screens&&Screens.close) Screens.close(); }catch(e){} return; }
  if(X.busy) return;                                   /* durante a luta o resto espera */
  if(a==='pick'){ pickEgg(String(ds.id||'')); return; }
  if(a==='later'){ sfx('ui_tap'); X.pick=false; say('O ovo fica guardado. Escolha na tela de Pets'); redraw(); return; }
  if(X.pick) return;                                   /* escolha de ovo aberta: só as opções dela */
  if(a==='go') challenge();
}
/* imagens que a tela mostra agora (para a espera de carga do jogo) */
function urls(){ const u=[IC.coin,IC.gem,IC.forge,IC.egg]; try{ const bg=typeof xEraBgUrl==='function'?xEraBgUrl():''; if(bg) u.push(bg);
    if(tOk()&&!lockLv()){ const T=TW(), f=st().best+1; for(let i=f;i<f+2;i++) if(T.isBoss(i)){ const b=bossUrl(i); if(u.indexOf(b)<0) u.push(b); } } }catch(e){} return u; }

const def=Panels.add(N,{title:'Torre',actions:ACTIONS,
  render(){ if(typeof pwGate==='function'){ if(pwGate(urls())) return; } else if(typeof xGate==='function'&&xGate(urls())) return; return draw(); },
  click(b,ev){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return click(b,ev); },
  tick(){ if(!isOn()||X.busy) return; if(X.toast&&now()-X.toastT>2200){ X.toast=''; try{ const el=document.getElementById('t2_toast'); if(el) el.innerHTML=''; }catch(e){} }
    if(X.pick||X.fight) return; X.tk=(X.tk+1)%4; if(X.tk===0&&X.sig&&sig()!==X.sig) redraw(); },
  busy(){ return X.busy; },
  onOpen(){ stopFight(); loopStop(); X.res=null; X.pick=false; X.toast=''; X.anim=true; X.top=true; X.sig=''; X.tk=0; X.gerr=0; },
  onClose(){ stopFight(); loopStop(); X.res=null; X.pick=false; X.toast=''; } });
/* para o teste de fumaça e para conferir no console: o estado da tela (somente leitura por convenção) */
window.Tower2={X:X,actions:ACTIONS,def:def,urls:urls,IC:IC};
})();
