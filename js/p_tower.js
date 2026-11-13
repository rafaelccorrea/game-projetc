'use strict';
/* ================= 16 TORRE — tela nova, nasce DESLIGADA (PANEL_ON.tower) =================
   Protótipo: docs/proto/Torre.dc.html. NENHUMA regra nem número aqui: tudo vem de Sys.tower (js/sys/tower.js):
   próximo andar (ensure().best+1), adversário (opponent), FC do andar (floorFC), minha FC (playerStats), rótulo (difficulty), prêmios (rewardsFor),
   tentativas (ensure().lossesLeft / DATA.lossesPerDay), marcos (DATA.milestones), a luta (fight → {win, duel.log, rewards}); desbloqueio: Sys.level.
   O cabeçalho (Voltar, título, moedas, gemas) é do jogo; aqui só o conteúdo, na ordem do protótipo:
   tentativas · torre vertical (andar atual com o Kael, próximo andar com o adversário, acima o seguinte) · FC do andar × sua FC · marcos · ranking · botão fixo "Subir".
   A luta é resolvida UMA vez pelo Sys.tower.fight (prêmios já entregues); a tela só REPRODUZ o registro dela (duel.log: quem bateu, dano, vida que sobrou) com
   barras de vida e números de dano, e mostra a faixa "Andar n vencido!" ou "Derrota". Nada é sorteado aqui.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - mostra 3 andares (o atual, o próximo e o seguinte) em vez de uma torre de 20; a câmera só sobe depois de uma vitória;
   - o oponente "fantasma" usa a folha parada do Kael espelhada e escurecida; o chefe usa a imagem do chefe da era do andar (assets/enemies/era<n>_boss.png);
   - o ranking mostra o melhor andar do jogador (dado real); a posição só existe com o servidor, por isso o texto fixo "Valendo quando o online abrir";
   - sem a chuva de moedas/pedras voando até o topo: os prêmios aparecem na faixa de resultado (os mesmos que o Sys.tower entregou).
   Pedido Q-3 (reports/pedidos-entre-agentes.md): carregar este script e ligar PANEL_ON.tower. */
const XTW={k:1,busy:false,msg:'',cam:0,t:[],last:null,from:null,raf:0,n:1,top:100,best:0,boss:false,e:0,sc:0};
const TW_MINH=560;
const TW_CSS=`.pt-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:ptk 1s steps(12,jump-none) infinite}
@keyframes ptk{from{background-position:0 0}to{background-position:100% 0}}
.pt-ghost{transform:scaleX(-1);filter:hue-rotate(200deg) brightness(.7) saturate(1.5);opacity:.88}
.pt-wall{background:repeating-linear-gradient(0deg,#3a2c1f 0 9px,#2f2318 9px 10px),#2f2318}
.pt-wall.pt-boss{background:repeating-linear-gradient(0deg,#4a2420 0 9px,#3a1c19 9px 10px),#3a1c19}
.pt-win{background:#ffd27a;box-shadow:0 0 14px 2px rgba(255,201,74,.8)}.pt-win0{background:#1a130d}
.pt-cam{position:absolute;left:0;top:0;width:390px;transition:transform .9s cubic-bezier(.5,0,.3,1)}
.pt-star{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff;animation:ptt 2.4s ease-in-out infinite}
@keyframes ptt{0%,100%{opacity:.2}50%{opacity:1}}
.pt-dmg{position:absolute;font-family:'Lilita One',sans-serif;font-size:20px;pointer-events:none;animation:ptd .9s ease-out forwards}
@keyframes ptd{from{transform:translateY(0);opacity:1}to{transform:translateY(-34px);opacity:0}}
.pt-ban{animation:ptb .45s cubic-bezier(.2,1.4,.4,1) both}
@keyframes ptb{from{transform:scale(.5);opacity:0}to{transform:none;opacity:1}}
.pt-in{animation:pti .35s ease-out both}
@keyframes pti{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.pt-up{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 6px 0 #8a4f0c;border:0}
.pt-up:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.pt-off{background:#3a3128;color:#9c8d7a;box-shadow:0 6px 0 #1f1912;border:0}
.pt-beam{position:absolute;background:radial-gradient(ellipse at 50% 100%,rgba(255,201,74,.35),rgba(255,201,74,0) 70%);pointer-events:none}
@media (prefers-reduced-motion:reduce){.pt-kid,.pt-star,.pt-dmg,.pt-cam{animation:none;transition:none}}`;

const tOk=()=>!!(window.Sys&&Sys.tower&&Sys.tower.ensure&&Sys.tower.opponent&&Sys.tower.fight);
const twEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* FC na escala visual (Sys.fc.viewText) */
const tFc=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return tFmt(v); };
const tFmt=v=>{ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); };
function twInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pt_css')) return; const st=document.createElement('style'); st.id='pt_css'; st.textContent=TW_CSS; document.head.appendChild(st); }
const tLock=()=>{ try{ const L=Sys.level; return L&&L.isUnlocked&&!L.isUnlocked(S,'tower')?(L.unlockLevel?L.unlockLevel('tower'):1):0; }catch(e){ return 0; } };
const twIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||16)+'px;height:'+(z||16)+'px;vertical-align:-3px;object-fit:contain">';
const tEraOf=f=>Math.max(0,Math.min(6,Math.floor((Math.max(1,f)-1)/15)));
function tReward(rw){ if(!rw) return ''; const P=[]; const sy=window.Sys||{};
  if(rw.gold) P.push(twIc('coin')+' '+tFmt(rw.gold)); if(rw.stones&&sy.practice) P.push(rw.stones+' pedras'); if(rw.forge&&sy.forge) P.push(rw.forge+' de forja'); if(rw.gems) P.push(twIc('gem')+' '+rw.gems);
  if(rw.egg&&sy.pet) P.push(rw.egg.choice?'Ovo Épico à escolha (Dragão ou Papagaio)':rw.egg.r===4?'Ovo raro':'Ovo de pet'); if(rw.prismFrags&&sy.pet) P.push(rw.prismFrags+' fragmento Prismático');
  { const tf=rw.t100Frags||rw.phoenixFrags||0, id=rw.t100Pet, nm={drake:'Dragão',parrot:'Papagaio'}[id]; if(tf&&sy.pet&&id!=='phoenix') P.push(tf+(tf>1?' fragmentos ':' fragmento ')+(nm?'do '+nm:'do pet do andar 100')); }
  return P.join(' · '); }
/* uma linha de andar (110 px): parede, janelas, portas, laje, placa com o número, chefe/marco do andar */
function tFloor(f,top,state){ const boss=Sys.tower.isBoss(f), ms=Sys.tower.isMilestone(f), done=f<=state.best, lit=f<=state.best+1, e=tEraOf(f);
  const plate=done?['#2a2a1a','#6a6a3a','#ffe07a','#c9b9a2']:(f===state.best+1?['#33271d','#ffc94a','#ffc94a','#c9b9a2']:['#1d1611','#4a3a2b','#9c8d7a','#6b5843']);
  const rw=ms||boss?Sys.tower.rewardsFor(f,Sys.host,S):null;
  return `<div style="position:absolute;left:0;top:${top}px;width:390px;height:110px">
    <div class="pt-wall${boss?' pt-boss':''}" style="position:absolute;left:66px;top:0;width:258px;height:110px;border-left:4px solid #241a12;border-right:4px solid #241a12;box-sizing:border-box;opacity:${lit?1:.55}">
      ${boss?'<span aria-hidden="true" style="position:absolute;left:92px;top:0;width:22px;height:46px;background:#a8231a;clip-path:polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)"></span><span aria-hidden="true" style="position:absolute;left:136px;top:0;width:22px;height:46px;background:#a8231a;clip-path:polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)"></span>':''}
      <span class="${lit?'pt-win':'pt-win0'}" aria-hidden="true" style="position:absolute;left:44px;top:14px;width:26px;height:36px;border-radius:13px 13px 3px 3px"></span><span class="${lit?'pt-win':'pt-win0'}" aria-hidden="true" style="position:absolute;right:44px;top:14px;width:26px;height:36px;border-radius:13px 13px 3px 3px"></span>
      <span aria-hidden="true" style="position:absolute;left:4px;bottom:12px;width:30px;height:62px;border-radius:15px 15px 0 0;background:#0b0807;border:3px solid #5a4430;border-bottom:0;box-sizing:border-box"></span><span aria-hidden="true" style="position:absolute;right:4px;bottom:12px;width:30px;height:62px;border-radius:15px 15px 0 0;background:#0b0807;border:3px solid #5a4430;border-bottom:0;box-sizing:border-box"></span></div>
    <div aria-hidden="true" style="position:absolute;left:56px;top:98px;width:278px;height:12px;border-radius:3px;background:${boss?'#6a3a30':'#5a4430'};border-top:2px solid ${boss?'#ff8a7a':'#8a6a3a'};box-sizing:border-box"></div>
    <div role="img" aria-label="Andar ${f}${boss?', chefe':''}${done?', vencido':''}" style="position:absolute;left:6px;top:30px;width:50px;height:50px;border-radius:12px;background:${plate[0]};border:2px solid ${plate[1]};box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1"><span style="font-family:'Lilita One',sans-serif;font-size:${f>=100?16:20}px;color:${plate[2]}">${f}</span><span style="font-size:10px;font-weight:900;color:${plate[3]}">${boss?'CHEFE':'andar'}</span></div>
    ${boss&&rw&&rw.gems?`<div role="img" aria-label="Chefe do andar ${f}: ${rw.gems} gemas" style="position:absolute;left:332px;top:28px;width:52px;height:52px;border-radius:50%;border:3px solid #ff5a4e;background:#2a1210;overflow:hidden;box-sizing:border-box;display:flex;align-items:center;justify-content:center"><img alt="" src="assets/enemies/era${e}_boss.png" style="width:100%;height:100%;object-fit:cover;${done?'filter:grayscale(.8) brightness(.7)':''}"></div>`:''}
    ${ms&&!boss?`<div role="img" aria-label="Marco do andar ${f}: ${rw.gems} gemas" style="position:absolute;left:334px;top:30px;width:48px;height:48px;border-radius:12px;border:2px solid #ffc94a;background:#2a1f16;display:flex;align-items:center;justify-content:center;box-sizing:border-box;">${twIc('gem',30)}</div>`:''}</div>`; }
function tSprite(kind,e,flip){ if(kind==='boss') return `<img alt="" role="img" aria-label="Chefe" src="assets/enemies/era${e}_boss.png" style="position:absolute;left:-12px;top:-24px;width:128px;height:128px;object-fit:contain">`; return `<div class="pt-kid pt-ghost" role="img" aria-label="Adversário fantasma" style="position:absolute;inset:0"></div>`; }

const T_VH=330;
const tTop=(best,n)=>Math.max(100,n+9);   /* andar mais alto desenhado: o 100 (ou 10 acima do próximo) */
const tFlTop=f=>(XTW.top-f)*110;
function tScrollFor(cur,best,n){ const top=(Math.max(100,n+9)-(cur+1))*110, v=top-55, max=(Math.max(100,n+9))*110+220-T_VH; return Math.max(0,Math.min(max,v)); }
function tStart(top){ return `<div style="position:absolute;left:0;top:${top}px;width:390px;height:110px"><div aria-hidden="true" style="position:absolute;left:56px;top:98px;width:278px;height:12px;border-radius:3px;background:#5a4430;border-top:2px solid #8a6a3a;box-sizing:border-box"></div><div role="img" aria-label="Início da torre" style="position:absolute;left:6px;top:30px;width:50px;height:50px;border-radius:12px;background:#33271d;border:2px solid #8a6a3a;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1"><span style="font-family:'Lilita One',sans-serif;font-size:14px;color:#c9b9a2">início</span></div></div>`; }
/* lista virtual: só os andares perto da janela visível (+1 de folga) e os dois personagens */
function tLayer(sc){ const T=Sys.tower, best=XTW.best, n=XTW.n, hi=Math.min(XTW.top,XTW.top-Math.floor(sc/110)+1), lo=Math.max(0,XTW.top-Math.floor((sc+T_VH)/110)-1), state={best};
  let h=''; for(let f=hi;f>=lo;f--) h+=f>0?tFloor(f,tFlTop(f),state):tStart(tFlTop(0));
  const kT=tFlTop(best)+6, fT=tFlTop(n)-2, inK=best>=lo&&best<=hi, inF=n>=lo&&n<=hi;
  if(inK) h+=`<div class="pt-beam" aria-hidden="true" style="left:100px;top:${kT+6}px;width:96px;height:90px"></div><div style="position:absolute;left:100px;top:${kT}px;width:96px;height:96px"><div aria-hidden="true" style="position:absolute;left:22px;right:22px;bottom:2px;height:8px;border-radius:50%;background:rgba(0,0,0,.45)"></div><div class="pt-kid" role="img" aria-label="Kael" style="position:absolute;inset:0"></div><span style="position:absolute;left:22px;right:22px;top:0;height:7px;border-radius:4px;background:rgba(0,0,0,.7);overflow:hidden"><span id="pt_hpk" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#5fd068,#b8f5a0);transition:width .15s"></span></span></div>`;
  if(inF) h+=`<div style="position:absolute;left:196px;top:${fT}px;width:104px;height:104px"><div aria-hidden="true" style="position:absolute;left:22px;right:22px;bottom:2px;height:8px;border-radius:50%;background:rgba(0,0,0,.45)"></div>${tSprite(XTW.boss?'boss':'ghost',XTW.e)}<span style="position:absolute;left:22px;right:22px;top:2px;height:7px;border-radius:4px;background:rgba(0,0,0,.7);overflow:hidden"><span id="pt_hpf" style="display:block;height:100%;width:100%;background:linear-gradient(90deg,#4aa3ff,#9fd8ff);transition:width .15s"></span></span></div>`;
  return h; }
function tPaint(){ if(XTW.busy) return; const sc=document.getElementById('pt_sc'), dy=document.getElementById('pt_dyn'); if(!sc||!dy||typeof sc.scrollTop!=='number') return; XTW.sc=sc.scrollTop/XTW.k; dy.innerHTML=tLayer(sc.scrollTop/XTW.k); }
function tHook(){ const sc=document.getElementById('pt_sc'); if(!sc) return; sc.onscroll=()=>{ if(XTW.busy||XTW.raf) return; XTW.raf=requestAnimationFrame(()=>{ XTW.raf=0; tPaint(); }); }; }
function scrTower(){
  twInject(); const d=xDims(TW_MINH);
  if(!tOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Torre indisponível agora.</div>`); return; }
  const lk=tLock();
  if(lk){ V.innerHTML=xWrap(d,'',`<div role="dialog" aria-label="Torre bloqueada: libera no nível ${lk}" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center"><span style="width:40px;height:30px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2b;box-sizing:border-box" aria-hidden="true"></span><span style="font-family:'Lilita One',sans-serif;font-size:24px">Torre</span><span style="font-size:15px;font-weight:800;color:#c9b9a2">Libera no nível ${lk}</span><button data-x="back" class="pt-up" style="width:200px;height:52px;border-radius:14px;font-family:'Lilita One',sans-serif;font-size:19px;padding:0">Voltar à batalha</button></div>`); return; }
  const T=Sys.tower, o=T.ensure(S,Sys.host), best=o.best, n=best+1, opp=T.opponent(n), me=T.playerStats(S,Sys.host), dif=T.difficulty(me.fc,opp.fc), rw=T.rewardsFor(n,Sys.host,S), max=T.DATA.lossesPerDay, left=o.lossesLeft;
  const state={best}, e=tEraOf(n), boss=opp.kind==='boss';
  const pips=Array.from({length:max},(_,i)=>`<span style="width:10px;height:16px;border-radius:4px;background:${i<left?'#ffc94a':'#4a3a2b'};box-shadow:${i<left?'0 0 6px rgba(255,201,74,.7)':'none'}"></span>`).join('');
  const TH=tTop(best,n)*110+110+110, sc0=XTW.from!=null?tScrollFor(XTW.from,best,n):tScrollFor(best,best,n); XTW.k=d.real?Math.max(.55,Math.min(1.4,((d.Wb||390)-28)/390)):1; const K=XTW.k; XTW.n=n; XTW.top=tTop(best,n); XTW.best=best; XTW.boss=boss; XTW.e=e; XTW.sc=sc0; const layer=tLayer(sc0);
  const ratio=Math.max(0,Math.min(1,me.fc/Math.max(1,opp.fc))), col=dif.id==='easy'?['#5fd068','#0d2410']:dif.id==='even'?['#ffc94a','#2a1403']:dif.id==='hard'?['#ff8a5c','#2a1403']:['#ff5a4e','#2a0a06'];
  const miles=T.DATA.milestones.slice(0,4).map(m=>{ const r=T.rewardsFor(m,Sys.host,S), done=best>=m, g=r.gems|0, egg=!!(r.egg&&window.Sys&&Sys.pet);
    return `<div role="img" aria-label="Marco do andar ${m}: ${g?g+' gemas':''}${egg?(g?' e ':'')+'ovo de pet':''}${done?', conquistado':''}" style="position:relative;flex:1;border-radius:12px;background:${done?'#22301f':'#1d1611'};border:2px solid ${done?'#5fd068':'#4a3a2b'};box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;min-width:0;line-height:1.05"><span style="font-size:11px;font-weight:900;color:${done?'#9ff0a8':'#c9b9a2'}">Andar ${m}</span><span style="height:24px;display:flex;align-items:center;gap:3px;font-size:19px" aria-hidden="true">${g?twIc('gem',24):''}${egg?'<b style="font-size:11px;color:#ffc94a">OVO</b>':''}</span><span style="font-size:10px;font-weight:900;color:${done?'#9ff0a8':'#ffe07a'};white-space:nowrap">${g?'+'+g:''}${egg?(g?' + ovo':'ovo'):''}</span>${done?'<span aria-hidden="true" style="position:absolute;right:4px;top:3px;color:#5fd068;width:12px;height:7px;border-left:3px solid #5fd068;border-bottom:3px solid #5fd068;transform:rotate(-45deg);margin-top:2px"></span>':''}</div>`; }).join('');
  const canTry=left>0;
  V.innerHTML=xWrap(d,'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="pt_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:6px 12px 8px;box-sizing:border-box;overflow-y:auto">
      <div style="flex:none;height:44px;display:flex;align-items:center;justify-content:center"><span role="img" aria-label="Tentativas hoje: ${left} de ${max}. Só a derrota gasta" style="height:40px;display:flex;align-items:center;gap:6px;padding:0 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b"><span style="display:flex;flex-direction:column;line-height:1.05"><span style="font-size:11px;font-weight:800;color:#c9b9a2">Tentativas</span><span style="font-size:10px;font-weight:800;color:#c9b9a2">só a derrota gasta</span></span>${pips}<span style="font-family:'Lilita One',sans-serif;font-size:16px">${left}/${max}</span></span></div>
      <div id="pt_view" role="img" aria-label="Torre inteira: você no andar ${best||'início'}, próximo andar ${n} com ${twEsc(opp.name)}. Role para ver os andares" style="position:relative;flex:none;height:${Math.round(T_VH*K)}px;border-radius:16px;overflow:hidden;border:2px solid #4a3a2b;background:linear-gradient(180deg,#0c1024 0%,#1b2346 35%,#3a2c4a 62%,#6a3a2e 85%,#3a2418 100%)">
        <span class="pt-star" style="left:24px;top:30px"></span><span class="pt-star" style="left:352px;top:60px;animation-delay:.7s"></span><span class="pt-star" style="left:40px;top:150px;animation-delay:1.3s"></span><span class="pt-star" style="left:360px;top:200px;animation-delay:.3s"></span>
        <div id="pt_sc" class="x-scroll pt-sc" style="position:absolute;inset:0;overflow-y:${XTW.busy?'hidden':'auto'};overflow-x:hidden"><div id="pt_in" style="position:relative;width:${Math.round(390*K)}px;height:${Math.round(TH*K)}px"><div style="position:absolute;left:0;top:0;width:390px;height:${TH}px;transform:scale(${K});transform-origin:0 0"><div id="pt_dyn">${layer}</div><div id="pt_fx" style="position:absolute;left:0;top:0;width:390px;height:${TH}px;pointer-events:none"></div></div></div></div>
        <div id="pt_ban" role="status" aria-live="polite" style="position:absolute;left:0;right:0;top:12px;display:flex;flex-direction:column;align-items:center;gap:4px;pointer-events:none"></div></div>
      <div style="flex:none;height:52px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:14px;background:#1d1611;border:2px solid ${col[0]};box-sizing:border-box"><span style="display:flex;flex-direction:column;line-height:1.1;flex:none"><span style="font-size:11px;font-weight:900;color:#c9b9a2">Andar ${n}${boss?' · chefe':''}</span><span style="font-family:'Lilita One',sans-serif;font-size:17px">FC ${tFc(opp.fc)}</span></span>
        <span style="flex:1;display:flex;flex-direction:column;gap:3px"><span aria-hidden="true" style="position:relative;height:10px;border-radius:5px;background:#4aa3ff;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${(ratio*100).toFixed(0)}%;background:linear-gradient(90deg,#5fd068,#b8f5a0)"></span></span><span style="display:flex;justify-content:space-between;font-size:11px;font-weight:900"><span style="color:#9ff0a8">Você ${tFc(me.fc)}</span><span style="color:#9fd8ff">Andar</span></span></span>
        <span style="flex:none;padding:4px 8px;border-radius:10px;background:${col[0]};color:${col[1]};font-size:12px;font-weight:900">${dif.txt}</span></div>
      <div style="flex:none;min-height:30px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:#ffe07a;text-align:center" aria-label="Prêmio do andar ${n}">Prêmio do andar ${n}: ${tReward(rw)||'—'}</div>
      <div style="flex:none;height:62px;display:flex;gap:6px">${miles}</div>
      <button data-x="rank" aria-label="Ranking semanal da torre. Valendo quando o online abrir" style="flex:none;height:46px;display:flex;align-items:center;gap:10px;padding:0 10px;border-radius:14px;background:#2a1f16;border:2px dashed #8a6a3a;box-sizing:border-box;color:#f6ecdf;text-align:left"><img src="assets/icons/menu/ranking.png" alt="" style="width:30px;height:30px;object-fit:contain"><span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:14px;font-weight:900">Ranking semanal da torre</span><span style="font-size:11px;font-weight:800;color:#ffd27a">Valendo quando o online abrir</span></span><span style="font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a;white-space:nowrap">Melhor: ${best}</span><span aria-hidden="true" style="color:#c9b9a2;font-weight:900">›</span></button></div>
    <div style="flex:none;padding:8px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-sizing:border-box"><button data-x="climb" class="${canTry?'pt-up':'pt-off'}" style="width:100%;height:64px;border-radius:18px;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05"><span style="font-family:'Lilita One',sans-serif;font-size:26px">${canTry?'Subir ao andar '+n:'Sem tentativas hoje'}</span><span style="font-size:12px;font-weight:900">${canTry?'Tentativas: '+left+'/'+max+' · só a derrota gasta':'Voltam amanhã'}</span></button></div></div>`);
  { const wasFrom=XTW.from; XTW.from=null; const sc=document.getElementById('pt_sc'); if(sc&&typeof sc.scrollTop==='number'){ sc.scrollTop=sc0*K; tHook();
      if(wasFrom!=null){ requestAnimationFrame(()=>requestAnimationFrame(()=>{ const s2=document.getElementById('pt_sc'); if(s2&&s2.scrollTo) s2.scrollTo({top:tScrollFor(best,best,n)*K,behavior:'smooth'}); })); } } }
}
/* reproduz o registro da luta (Sys.tower.fight → duel.log): barras e números de dano; no fim a faixa de resultado e a tela é redesenhada com o estado novo */
function tPlay(r){
  const log=(r.duel&&r.duel.log)||[], meHp=Math.max(1,r.me.hp), foeHp=Math.max(1,meHp*(r.opp.fc/Math.max(1,r.me.fc))), gap=Math.max(60,Math.min(220,3200/Math.max(1,log.length)));
  const hpk=()=>document.getElementById('pt_hpk'), hpf=()=>document.getElementById('pt_hpf'), fx=()=>document.getElementById('pt_fx'); let k=0;
  const step=()=>{ XTW.t=[]; if(k<log.length){ const g=log[k++]; const el=hpk(), ef=hpf(), box=fx();
      if(g.s===0){ if(ef) ef.style.width=Math.max(0,g.hp/foeHp*100).toFixed(1)+'%'; } else { if(el) el.style.width=Math.max(0,g.hp/meHp*100).toFixed(1)+'%'; }
      if(box&&box.appendChild){ const m=document.createElement('span'); m.className='pt-dmg'; m.textContent=(g.crit?'! ':'')+tFmt(g.dmg); m.style.left=(g.s===0?236:122)+'px'; m.style.top=(tFlTop(g.s===0?XTW.n:XTW.best)+8)+'px'; m.style.color=g.crit?'#ffe07a':'#fff'; m.style.textShadow='0 2px 0 #000'; box.appendChild(m); setTimeout(()=>{ if(m.parentNode) m.parentNode.removeChild(m); },900); }
      try{ if(typeof snd==='function') snd(g.crit?'crit':'hit'); }catch(e){}
      XTW.t.push(setTimeout(step,gap)); return; }
    const win=!!r.win, ban=document.getElementById('pt_ban'), rw=tReward(r.rewards);
    if(ban) ban.innerHTML=`<div class="pt-ban" style="display:flex;flex-direction:column;align-items:center;gap:4px"><span style="padding:6px 18px;border-radius:14px;background:${win?'rgba(40,110,40,.92)':'rgba(120,20,12,.9)'};border:2px solid ${win?'#9ff0a8':'#ff8a7a'};font-family:'Lilita One',sans-serif;font-size:26px;color:#fff;text-shadow:0 2px 0 #000;white-space:nowrap">${win?'Andar '+r.floor+' vencido!':'Derrota'}</span><span style="padding:2px 10px;border-radius:8px;background:rgba(14,10,7,.85);font-size:13px;font-weight:900;color:${win?'#ffe07a':'#ffb3a8'};text-align:center;max-width:340px">${win?(rw||'Sem prêmio extra'):'Contra '+twEsc(r.opp.name)+': o inimigo ficou com '+Math.round((r.duel.hpB||0)*100)+'% de vida'}</span></div>`;
    try{ if(typeof snd==='function') snd(win?'claim':'ui_tap'); }catch(e){}
    XTW.t.push(setTimeout(()=>{ XTW.busy=false; XTW.from=win?XTW.best:null; render(); },1700)); };
  step(); }
function tStop(){ XTW.t.forEach(clearTimeout); XTW.t=[]; XTW.busy=false; }
function twClick(b,ev){
  const a=b.dataset.x;
  if(a==='back'){ snd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(XTW.busy) return;
  if(a==='rank'){ snd('ui_tap'); if(window.Panels&&Panels.on&&Panels.on('rank')) Panels.open('rank'); else if(typeof toast==='function') toast('O ranking semanal abre junto com o online'); return; }
  if(a==='climb'){ if(!tOk()) return; const o=Sys.tower.ensure(S,Sys.host);
    if(o.lossesLeft<=0){ snd('ui_tap'); if(typeof toast==='function') toast('Suas tentativas de hoje acabaram. Voltam amanhã'); return; }
    const r=Sys.tower.fight(S,Sys.host); if(!r||!r.ok){ snd('ui_tap'); if(typeof toast==='function') toast(r&&r.reason==='locked'?'A Torre libera no nível '+(r.level||'?'):'Não foi possível desafiar agora'); render(); return; }
    { const sc=document.getElementById('pt_sc'); if(sc&&typeof sc.scrollTop==='number'){ sc.scrollTop=tScrollFor(XTW.best,XTW.best,XTW.n)*XTW.k; tPaint(); if(sc.style) sc.style.overflowY='hidden'; } }   /* câmera no par de andares da luta e sem rolar durante ela */
    XTW.busy=true; XTW.last=r;
    try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){}   /* a vitória/derrota e os prêmios JÁ estão no save: grava agora, mesmo que o jogador saia antes do fim da animação */
    snd('ui_tap'); tPlay(r); }
}
Panels.add('tower',{title:'Torre',render:function(){ if(typeof pGate==='function'&&pGate(['assets/anim/hyb/R/kael_idle_era2_t0.png'])) return; return scrTower.apply(this,arguments); },click:function(b){ if(typeof pWaitClick==='function'&&pWaitClick(b)) return; return twClick.apply(this,arguments); },
  tick(){ },
  busy(){ return XTW.busy; },
  onOpen(){ tStop(); XTW.cam=0; XTW.last=null; XTW.from=null; },
  onClose(){ tStop(); } });
