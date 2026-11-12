'use strict';
/* ================= 15 FORJA (fortalecer +N do espaço e nível do item) — tela nova, nasce DESLIGADA (PANEL_ON.forge) =================
   Protótipo: docs/proto/Forja.dc.html. NENHUMA conta de jogo aqui:
   - fortalecimento (+0 a +15 por espaço, chance, garantia, pedras, ouro, teto da era, aura da arma): Sys.forge (js/sys/forge.js);
   - nível do item equipado (1 a 100, teto = nível do jogador): Sys.stats (upgradeCost, canUpgrade, upgrade, lvlFactor), igual ao gSheet/gClick;
   - asa bloqueada: Sys.stats.slotOpen('wing', plv()); portão da tela: Sys.level (isUnlocked/unlockLevel 'forge').
   Missões: o evento 'forge' do passe conta PEDRAS COLETADAS (passSync lê Sys.loot.todayCount), não tentativas: aqui não se chama ptrack('forge').
   Subir o nível do item chama ptrack('upgrade',1), como a tela de Equipamento. */
const XF={mode:'forge',slot:'weapon',prev:null,busy:false,fx:null,big:'',small:'',pity0:0,anim:true,cardIn:true,toast:'',toastT:0,t1:0,t2:0,sig:''};
/* cores do protótipo por faixa de aura (0 = sem aura); os limites (+4, +7, +10, +13) e os nomes vêm de Sys.forge.DATA.auras */
const F_TC=['#c9b9a2','#4aa3ff','#b07cff','#ff5a4e','#ffc94a'];
const F_STAT={atk:'Ataque',hp:'Vida',def:'Defesa',critRate:'Chance Crítica',critDmg:'Dano Crítico',aspd:'Vel. de Ataque',atkPct:'Ataque',hpPct:'Vida',defPct:'Defesa'};
const F_HAMMER=(s,c)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c||'#ff8a5c'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M14.5 3.5l6 6-2.5 2.5-6-6z"></path><path d="M12.5 7.5 3.5 16.5l4 4 9-9"></path></svg>`;
const F_SHIELD='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>';
const F_ARROW='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><line x1="4" y1="12" x2="19" y2="12"></line><polyline points="13 6 19 12 13 18"></polyline></svg>';

/* ---------- leituras do Sys isoladas (valor de reserva seguro se o módulo não estiver carregado) ---------- */
const fD=()=>Sys.forge.DATA;
const fAuras=()=>fD().auras;
const fTier=p=>{ const A=fAuras(); let t=0; for(let i=0;i<A.length;i++) if(p>=A[i].from) t=i; return t; };
const fCap=()=>Sys.forge.capOf(Sys.host);
const fPity=slot=>Sys.forge.ensure(S).pity[slot]||0;
const fStones=()=>Sys.forge.ensure(S).stones;
const fPct=v=>String(Math.round(v*1000)/10).replace('.',',');                     /* 0,23 → "23" */
const fMul=L=>'x'+Sys.stats.lvlFactor(L).toFixed(2).replace('.',',');
const fStatName=slot=>{ const m=Sys.stats.DATA.main[slot]||{}; const out=[]; for(const k in m){ const n=F_STAT[k]||k; if(out.indexOf(n)<0) out.push(n); } return out.slice(0,2).join(' e ')||'Bônus'; };
const fWingOpen=()=>Sys.stats.slotOpen('wing',plv());
const fWingLv=()=>Sys.stats.DATA.wing.minLevel;
const fLocked=()=>{ try{ return !!(Sys.level&&Sys.level.isUnlocked&&!Sys.level.isUnlocked(S,'forge')); }catch(e){ return false; } };
const fGateLv=()=>{ try{ return Sys.level.unlockLevel('forge'); }catch(e){ return 1; } };
const fEraName=e=>(typeof ERAS!=='undefined'&&ERAS[e]&&ERAS[e].n)||('Era '+(e+1));
const fEraNow=()=>Math.max(0,Math.min(fD().capByEra.length-1,Sys.host.eraMax()|0));
const fMaxLvl=()=>Sys.stats.DATA.maxItemLevel;

(function(){ const st=document.createElement('style'); st.textContent=`
.f-in{animation:f-fade .22s ease-out}
@keyframes f-fade{from{opacity:0}to{opacity:1}}
.f-ped{animation:f-pedP 2.6s ease-in-out infinite}
@keyframes f-pedP{0%,100%{box-shadow:0 0 12px 2px rgba(255,201,74,.3),inset 0 -6px 0 rgba(0,0,0,.35)}50%{box-shadow:0 0 26px 6px rgba(255,201,74,.6),inset 0 -6px 0 rgba(0,0,0,.35)}}
.f-footglow{position:absolute;border-radius:50%;animation:f-fglow 1.6s ease-in-out infinite;pointer-events:none}
@keyframes f-fglow{0%,100%{opacity:.55;transform:scaleX(.9)}50%{opacity:1;transform:scaleX(1.08)}}
.f-halo{position:absolute;inset:-3px;border-radius:17px;filter:blur(7px);animation:f-haloK 1.9s ease-in-out infinite;pointer-events:none}
@keyframes f-haloK{0%,100%{opacity:.35}50%{opacity:.9}}
.f-sheen{position:absolute;inset:0;background:linear-gradient(115deg,transparent 30%,rgba(255,255,255,.4) 48%,transparent 62%);background-size:280% 100%;animation:f-shine 3s ease-in-out infinite;pointer-events:none}
@keyframes f-shine{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
.f-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 6px 0 #8a4f0c;border:0}
.f-gold:active{transform:translateY(4px);box-shadow:0 2px 0 #8a4f0c}
.f-pulse{animation:f-pulseK 1.5s ease-in-out infinite}
@keyframes f-pulseK{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 22px rgba(255,201,74,.85)}}
.f-hammer{transform-origin:85% 85%;animation:f-hit .32s ease-in infinite alternate;pointer-events:none}
@keyframes f-hit{0%{transform:rotate(-38deg)}100%{transform:rotate(12deg)}}
.f-flashw{animation:f-flashK .7s ease-out both;pointer-events:none}
@keyframes f-flashK{0%{opacity:.95}100%{opacity:0}}
.f-banner{animation:f-ban 1.5s ease-out both;pointer-events:none}
@keyframes f-ban{0%{transform:scale(2.2);opacity:0}14%{transform:scale(1);opacity:1}78%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}
.f-burst{position:absolute;width:7px;height:7px;border-radius:50%;background:#ffe07a;box-shadow:0 0 10px 3px rgba(255,201,74,.9);animation:f-burstK .9s ease-out both;pointer-events:none}
@keyframes f-burstK{0%{transform:translate(0,0) scale(1.2);opacity:1}100%{transform:translate(var(--dx),var(--dy)) scale(.2);opacity:0}}
.f-bright{animation:f-brightK .8s ease-out both}
@keyframes f-brightK{0%{filter:brightness(2.4) drop-shadow(0 0 18px #ffe07a)}100%{filter:none}}
.f-shake{animation:f-shakeK .5s}
@keyframes f-shakeK{20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.f-pitybar{transition:width .7s cubic-bezier(.2,1.4,.4,1)}
.f-pitygrow{animation:f-pityw .7s cubic-bezier(.2,1.4,.4,1) both}
@keyframes f-pityw{from{width:var(--w0)}}
.f-pityglow{animation:f-pityg .9s ease-out both}
@keyframes f-pityg{0%{box-shadow:0 0 0 rgba(255,138,92,0)}35%{box-shadow:0 0 18px rgba(255,138,92,1)}100%{box-shadow:0 0 0 rgba(255,138,92,0)}}
.f-popn{display:inline-block;animation:f-popK .5s cubic-bezier(.2,1.6,.4,1) both}
@keyframes f-popK{from{transform:scale(1.6)}to{transform:none}}
.f-chip:active,.f-slot:active,.f-mini:active{transform:scale(.94)}
.f-cardin{animation:f-cardK .35s ease both}
@keyframes f-cardK{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.f-gatelk{animation:f-gateK 2.2s ease-in-out infinite;transform-origin:50% 60%}
@keyframes f-gateK{0%,80%,100%{transform:rotate(0)}85%{transform:rotate(-8deg)}90%{transform:rotate(7deg)}95%{transform:rotate(-3deg)}}
.f-toast{animation:f-toastK 2.2s ease both}
@keyframes f-toastK{0%{transform:translateY(-14px);opacity:0}12%{transform:none;opacity:1}80%{opacity:1}100%{opacity:0}}
`; document.head.appendChild(st); })();

function fToastHtml(msg){ return `<div class="f-toast" role="status" style="position:absolute;left:0;right:0;top:96px;display:flex;justify-content:center;pointer-events:none;z-index:6"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ff8a5c;font-size:14px;font-weight:900;color:#f6ecdf;box-shadow:0 0 16px rgba(255,138,92,.45);max-width:250px;text-align:center;line-height:1.2">${esc2(msg)}</span></div>`; }
function fToast(msg){ XF.toast=msg; XF.toastT=Date.now(); const el=document.getElementById('f_toast'); if(el) el.innerHTML=fToastHtml(msg); }
function fOn(){ return typeof view!=='undefined'&&view==='forge'; }
function fStop(){ clearTimeout(XF.t1); clearTimeout(XF.t2); XF.busy=false; XF.fx=null; }
/* mostra o resultado (clarão, faixa, tremor) por 1,6 s, como o protótipo */
function fFire(fx,big,small){ clearTimeout(XF.t2); XF.fx=fx; XF.big=big||''; XF.small=small||''; if(fOn()) render();
  XF.t2=setTimeout(()=>{ XF.fx=null; if(fOn()) render(); },1600); }
/* espaços que podem ser escolhidos (a asa só depois do nível dela) */
function fSlotOk(slot){ return fD().slots.indexOf(slot)>=0&&(slot!=='wing'||fWingOpen()); }

/* ---------- portão: forja ainda não liberada ---------- */
function fGate(d){
  return xWrap(d,XF.anim?'f-in':'',`<div role="dialog" aria-label="Forja bloqueada: libera no nível ${fGateLv()}" style="flex:1;min-height:0;background:rgba(12,9,6,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:0 32px;text-align:center;box-sizing:border-box">
    <svg class="f-gatelk" width="72" height="80" viewBox="0 0 24 26" fill="none" stroke="#ffc94a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="13" rx="3" fill="#33271d"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><circle cx="12" cy="17" r="1.8" fill="#ffc94a"></circle><line x1="12" y1="18.5" x2="12" y2="21"></line></svg>
    <span class="lil" style="font-size:26px">Forja</span>
    <span style="padding:6px 14px;border-radius:999px;background:#33271d;border:2px solid #ffc94a;color:#ffc94a;font-size:15px;font-weight:900">Libera no nível ${fGateLv()}</span>
    <span style="font-size:13px;font-weight:800;color:#c9b9a2">Você está no nível ${plv()}. Continue lutando para liberar.</span>
    <span style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:900;color:#e8dccb">${F_HAMMER(18)}${n0(fStones())} Pedras de Forja guardadas</span>
    <button class="f-gold lil" data-x="gate" style="margin-top:6px;height:52px;padding:0 28px;border-radius:16px;font-size:20px">Voltar para a batalha</button></div>`);
}

function scrForge(){
  const d=xFit(710,540), H=d.H;
  if(fLocked()){ V.innerHTML=fGate(d); XF.anim=false; XF.sig='gate'; return; }
  if(!fSlotOk(XF.slot)) XF.slot='weapon';
  const FD=fD(), A=fAuras(), MAX=FD.max, sl=XF.slot, o=Sys.forge.ensure(S), n=o.lv[sl], cap=fCap(), c=Sys.forge.canTry(S,Sys.host,sl);
  const atMax=n>=MAX, atCap=!atMax&&n>=cap, stop=atMax||atCap, stones=o.stones, pity=o.pity[sl]||0, base=stop?0:FD.chance[n], lv=plv();
  const wP=o.lv.weapon, realT=fTier(wP), shownT=XF.prev!=null?fTier(XF.prev):realT, shownP=XF.prev!=null?XF.prev:wP, tc=F_TC[shownT]||F_TC[0];
  const it=eqItem(sl), selT=fTier(n), fx=XF.fx, wingOpen=fWingOpen();
  /* altura: o palco encolhe (escala) antes de qualquer coisa sumir; em tela muito curta sai só a linha de aviso do cartão */
  const rest=H-174, note=rest>=150+236, cardMin=note?236:190, st=Math.max(140,Math.min(244,rest-cardMin)), k=st/244;

  /* ----- modos ----- */
  const modes=[['forge','Fortalecer +N'],['level','Nível']].map(m=>{ const on=XF.mode===m[0];
    return `<button data-x="mode" data-m="${m[0]}" aria-pressed="${on}" style="flex:1;height:36px;border-radius:11px;border:0;background:${on?'#3a2c1f':'transparent'};color:${on?'#ffc94a':'#c9b9a2'};font-size:14px;font-weight:900;padding:0;white-space:nowrap">${m[1]}</button>`; }).join('');

  /* ----- espaço escolhido (grande, no palco) ----- */
  const plusBg=t=>t===0?'#33271d':F_TC[t], plusFg=t=>t===0?'#f6ecdf':t===4?'#2a1403':'#0e0a07';
  const bigSlot=`<div style="position:absolute;left:12px;top:18px;width:96px;display:flex;flex-direction:column;align-items:flex-start;gap:2px">
      <div class="${fx==='fail'?'f-shake':fx?'f-bright':''}" style="position:relative;width:72px;height:72px">
        <span class="f-halo" style="background:#ffc94a"></span>
        <div role="img" aria-label="${esc2(SLOT[sl].n)}${it?': '+esc2(iname(it))+', '+RN(it.r)+', nível '+it.lvl:': vazio'}, mais ${n}" style="position:absolute;inset:0;border-radius:16px;border:3px solid #ffc94a;background:radial-gradient(circle at 50% 40%,#4a3a2b,#1d1611);overflow:hidden;box-sizing:border-box;text-align:center">
          <img src="${it?slotIcon(sl,ieraV(it)):ICON[sl]}" alt="" style="width:52px;height:52px;object-fit:contain;margin-top:0;${it?'':'opacity:.55'}">
          <span class="f-sheen"></span>
          <span style="position:absolute;left:0;right:0;bottom:0;height:18px;background:rgba(0,0,0,.72);font-size:11px;font-weight:900;color:${it?'#fff':'#c9b9a2'};line-height:18px">${it?'Nv.'+it.lvl:'vazio'}</span></div>
        <span class="lil" style="position:absolute;top:-7px;right:-9px;min-width:30px;height:22px;padding:0 5px;border-radius:11px;background:${plusBg(selT)};border:2px solid #16110d;color:${plusFg(selT)};font-size:14px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">+${n}</span>
        ${XF.busy?'<svg class="f-hammer" width="44" height="44" viewBox="0 0 24 24" fill="#c9b9a2" stroke="#16110d" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true" style="position:absolute;right:-28px;top:-18px"><path d="M14.5 3.5l6 6-2.5 2.5-6-6z"></path><path d="M12.5 7.5 3.5 16.5l4 4 9-9z" fill="#8a5a33"></path></svg>':''}
      </div>
      <span style="width:72px;text-align:center;font-size:11px;font-weight:900;color:#ffc94a;text-shadow:0 1px 2px #000;white-space:nowrap">${esc2(SLOT[sl].n)}</span>
      ${it?`<span style="max-width:96px;font-size:10px;font-weight:800;color:${RC[it.r]};text-shadow:0 1px 2px #000,0 0 4px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc2(iname(it))}</span>`:''}</div>`;

  /* ----- prévia das auras (direita): alvo de toque de 44 px, pastilha de 38 px como no protótipo ----- */
  const chips=A.map((a,i)=>{ const on=shownT===i, col=F_TC[i]||F_TC[0];
    return `<button class="f-chip" data-x="chip" data-v="${a.from}" aria-pressed="${on}" aria-label="Ver ${esc2(a.name)} (a partir de +${a.from})" style="width:52px;height:44px;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:center">
      <span class="lil" style="width:52px;height:38px;border-radius:12px;border:2px solid ${on?col:'#4a3a2b'};background:${on?'#3a2c1f':'rgba(29,22,17,.88)'};color:#f6ecdf;display:flex;align-items:center;justify-content:center;gap:4px;font-size:14px;box-sizing:border-box">
        <span style="width:10px;height:10px;border-radius:50%;background:${col};box-shadow:0 0 6px ${col}"></span>+${a.from}</span></button>`; }).join('');
  const auraLabel=(XF.prev!=null?'Prévia +'+shownP+': ':'Arma +'+wP+': ')+A[shownT].name;

  /* ----- efeitos do resultado ----- */
  const bursts=[[-90,-70],[90,-64],[-70,40],[80,46],[0,-100],[-110,-10],[110,-6]].map(p=>`<span class="f-burst" style="left:192px;top:130px;--dx:${p[0]}px;--dy:${p[1]}px"></span>`).join('');
  const fxH=fx==='ok'||fx==='lv'?`<div class="f-flashw" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,rgba(255,255,255,.95),rgba(255,201,74,.55) 35%,rgba(255,201,74,0) 70%)"></div>${bursts}
      <div class="f-banner" style="position:absolute;left:0;right:0;top:64px;display:flex;flex-direction:column;align-items:center;gap:2px;z-index:5">
        <span class="lil" style="font-size:58px;line-height:1;color:#ffc94a;text-shadow:0 4px 0 #6a3a08,0 0 18px rgba(255,201,74,.9)">${esc2(XF.big)}</span>
        <span style="padding:4px 12px;border-radius:10px;background:rgba(14,10,7,.88);border:2px solid #5fd068;font-size:14px;font-weight:900;color:#f6ecdf">${esc2(XF.small)}</span></div>`
    :fx==='fail'?`<div class="f-flashw" style="position:absolute;inset:0;background:radial-gradient(circle at 50% 55%,rgba(255,90,78,.45),rgba(255,90,78,0) 65%)"></div>
      <div class="f-banner" style="position:absolute;left:0;right:0;top:78px;display:flex;flex-direction:column;align-items:center;gap:4px;z-index:5">
        <span class="lil" style="font-size:36px;color:#ffb3a8;text-shadow:0 3px 0 #4a120d">Falhou</span>
        <span style="padding:4px 12px;border-radius:10px;background:rgba(14,10,7,.9);border:2px solid #ff8a5c;font-size:13px;font-weight:900;color:#f6ecdf">Nível mantido · garantia +${FD.pityPerFail}</span></div>`:'';

  /* ----- Kael + aura ----- */
  const sa=SKIN(S.skinEq.armor), tier=tierOf(sa?sa.r:0);
  const stage=`<div class="${fx==='fail'?'f-shake':''}" style="position:relative;height:${st.toFixed(1)}px;flex:none;overflow:hidden;background:#8fc6dc">
      <div class="x-ly x-sky" style="top:0;height:${(171*k).toFixed(1)}px;background-size:auto ${(171*k).toFixed(1)}px"></div><div class="x-ly x-cld" style="top:${(14*k).toFixed(1)}px;height:${(46*k).toFixed(1)}px;background-size:auto ${(46*k).toFixed(1)}px"></div>
      <div class="x-ly x-far" style="top:${(63*k).toFixed(1)}px;height:${(120*k).toFixed(1)}px;background-size:auto ${(120*k).toFixed(1)}px"></div><div class="x-ly x-gnd" style="top:${(187*k).toFixed(1)}px;height:${(108*k).toFixed(1)}px;background-size:auto ${(108*k).toFixed(1)}px"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(22,17,13,.25) 0%,rgba(22,17,13,.8) 64%,rgba(22,17,13,.97) 100%)"></div>
      <div style="position:absolute;left:50%;top:0;width:390px;height:244px;margin-left:-195px;transform:scale(${k.toFixed(4)});transform-origin:50% 0">
        ${shownT>0?`<div class="x-aura" role="img" aria-label="${esc2(A[shownT].name)}" style="left:107px;top:2px;width:176px;height:220px;background-image:url(assets/anim/aura/aura${A[shownT].from}.png)"></div>`:''}
        <div class="f-ped" style="position:absolute;left:122px;top:208px;width:146px;height:28px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#6a5440 0%,#3a2c1f 60%,#241a12 100%);border:2px solid #ffc94a;box-sizing:border-box"></div>
        ${sl!=='weapon'&&selT>0?`<div class="f-footglow" style="left:132px;top:210px;width:126px;height:22px;background:radial-gradient(ellipse,${F_TC[selT]} 0%,rgba(0,0,0,0) 70%)"></div>`:''}
        <div class="${fx==='ok'?'f-bright':''}" style="position:absolute;left:105px;top:51px;width:180px;height:180px"><div class="kidle ${tier?'t'+tier:''}" role="img" aria-label="Kael parado" style="width:180px;height:180px"></div></div>
        ${bigSlot}
        <div role="group" aria-label="Prévia das auras da arma" style="position:absolute;right:10px;top:6px;display:flex;flex-direction:column;align-items:center">
          <span style="font-size:10px;font-weight:900;color:#c9b9a2;text-shadow:0 1px 2px #000;letter-spacing:.5px;line-height:14px">AURA</span>${chips}</div>
        <div style="position:absolute;left:0;right:0;bottom:4px;display:flex;justify-content:center;pointer-events:none">
          <span style="padding:3px 10px;border-radius:9px;background:rgba(14,10,7,.86);border:1px solid ${tc};font-size:11px;font-weight:900;color:#f6ecdf;white-space:nowrap">${esc2(auraLabel)}</span></div>
        ${fxH}<div id="f_toast">${XF.toast&&Date.now()-XF.toastT<1500?fToastHtml(XF.toast):''}</div>
      </div></div>`;

  /* ----- os 7 espaços ----- */
  const strip=FD.slots.map(s=>{ const on=s===sl, x=eqItem(s), p=o.lv[s], t=fTier(p), nm=SLOT[s].n;
    if(s==='wing'&&!wingOpen) return `<button class="f-mini" data-x="slot" data-slot="wing" aria-label="Asa, bloqueada, libera no nível ${fWingLv()}" style="position:relative;flex:1;min-width:0;height:48px;border-radius:12px;border:2px dashed #8a7458;background:rgba(14,10,7,.82);color:#e8dccb;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;box-sizing:border-box">
        ${SVG_LOCK(18)}<span style="font-size:9px;font-weight:900;line-height:1.05;white-space:nowrap">Nível ${fWingLv()}</span></button>`;
    return `<button class="f-mini" data-x="slot" data-slot="${s}" aria-pressed="${on}" aria-label="${esc2(nm)}${x?': '+esc2(iname(x)):': vazio'}, mais ${p}${on?', selecionado':''}" style="position:relative;flex:1;min-width:0;height:48px;border-radius:12px;border:${on?'3px solid #ffc94a':x?'2px solid '+RC[x.r]:'2px dashed #8a7458'};background:${on?'radial-gradient(circle at 50% 40%,#5a4631,#241a12)':'radial-gradient(circle at 50% 40%,#3a2c1f,#16110d)'};padding:0;display:flex;align-items:center;justify-content:center;box-sizing:border-box${on?';box-shadow:0 0 10px rgba(255,201,74,.55)':''}">
        <img src="${x?slotIcon(s,ieraV(x)):ICON[s]}" alt="" style="width:30px;height:30px;object-fit:contain;${x?'':'opacity:.5'}">
        <span class="lil" style="position:absolute;top:-6px;right:-4px;min-width:22px;height:17px;padding:0 3px;border-radius:9px;background:${plusBg(t)};border:2px solid #16110d;color:${plusFg(t)};font-size:11px;line-height:13px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">+${p}</span></button>`; }).join('');

  /* ----- trilha +1 a +15 com o teto da era ----- */
  let pips=''; for(let i=1;i<=MAX;i++){ const t=fTier(i), got=i<=n, lock=i>cap;
    pips+=`<span style="flex:1;height:${got?12:10}px;border-radius:4px;background:${got?(t===0?'#e8e2d8':F_TC[t]):'#241a12'};border:1px solid ${lock?'#33271d':got?'transparent':'#4a3a2b'};opacity:${lock?.35:1};box-shadow:${got&&t>0?'0 0 6px '+F_TC[t]:'none'};box-sizing:border-box;transition:background .4s"></span>`; }
  const track=`<div style="height:30px;flex:none;margin:0 12px;display:flex;align-items:center;gap:8px">
      <div role="img" aria-label="Fortalecimento +${n} de ${MAX}; teto da ${esc2(fEraName(fEraNow()))}: +${cap}" style="flex:1;display:flex;gap:3px;align-items:center">${pips}</div>
      <span style="display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:#c9b9a2;white-space:nowrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>Teto +${cap}</span></div>`;

  const cardCls=(XF.cardIn?'f-cardin ':'')+(fx==='fail'?'f-shake':''), pop=fx?'f-popn':'';
  const cardSt='flex:1;min-height:0;margin:0 12px;padding:10px 12px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;box-sizing:border-box;overflow:hidden';
  const btnOff='border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2';
  let card='';
  if(XF.mode==='forge'){
    /* ----- cartão: fortalecer ----- */
    const ch=c.chance, okGo=c.ok&&!XF.busy, pityRoom=Math.max(1,100-base), pityPct=stop?0:Math.min(100,Math.round(pity/pityRoom*100)), pity0=stop?0:Math.min(100,Math.round(XF.pity0/pityRoom*100));
    const fails=Math.round(pity/Math.max(1,FD.pityPerFail)), curCol=selT===0?'#f6ecdf':F_TC[selT], nT=fTier(n+1), nextCol=stop?'#c9b9a2':nT===0?'#f6ecdf':F_TC[nT];
    let nextCap=null; for(let e=fEraNow()+1;e<FD.capByEra.length;e++) if(FD.capByEra[e]>cap){ nextCap={p:FD.capByEra[e],era:fEraName(e)}; break; }
    const capHint=cap<MAX&&nextCap?'Teto da '+fEraName(fEraNow())+': +'+cap+'; +'+nextCap.p+' na '+nextCap.era+'.':'';
    const lackSt=!stop&&stones<c.stones, lackG=!stop&&S.gold<c.gold;
    const label=XF.busy?'Forjando...':atMax?'Máximo +'+MAX:atCap?'Teto da era':c.reason==='stones'?'Faltam pedras':c.reason==='gold'?'Falta ouro':'Fortalecer';
    card=`<div class="${cardCls}" style="${cardSt}">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="lil" style="font-size:30px;color:${curCol};text-shadow:0 2px 0 #000">+${n}</span>${F_ARROW}
        <span class="lil ${pop}" style="font-size:30px;color:${nextCol};text-shadow:0 2px 0 #000">${atMax?'Máx.':atCap?'Teto':'+'+(n+1)}</span>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-end;line-height:1.15">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(fStatName(sl))} do espaço</span>
          <span style="font-size:15px;font-weight:900;white-space:nowrap">+${fPct(FD.bonus[n])}% <span style="color:#c9b9a2">→</span> <span style="color:#5fd068">${atMax?'máximo':atCap?'máx. da era':'+'+fPct(FD.bonus[n+1])+'%'}</span></span></div></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:84px;height:58px;flex:none;border-radius:12px;background:#0e0a07;border:2px solid ${pity>0&&!stop?'#ff8a5c':'#4a3a2b'};display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-sizing:border-box">
          <span style="font-size:10px;font-weight:900;color:#c9b9a2;letter-spacing:.5px">CHANCE</span>
          <span class="lil ${pop}" style="font-size:28px;color:${stop?'#c9b9a2':ch>=100?'#5fd068':ch>=50?'#ffc94a':'#ff8a5c'}">${stop?'—':p1(ch)}</span></div>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
          <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900"><span>Garantia acumulada</span><span style="color:#ff8a5c">+${n0(pity)} pts</span></div>
          <div class="${fx==='fail'?'f-pityglow':''}" style="height:14px;border-radius:7px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden">
            <div class="f-pitybar ${fx==='fail'?'f-pitygrow':''}" style="--w0:${pity0}%;width:${pityPct}%;height:100%;background:linear-gradient(90deg,#ff8a5c,#ffc94a)"></div></div>
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.15">${atMax?'Sem tentativa: espaço no máximo':atCap?'Sem tentativa: espaço no teto da era':'Base '+p1(base)+' · '+fails+(fails===1?' falha':' falhas')+' · cada falha +'+FD.pityPerFail+' · zera ao acertar'}</span></div></div>
      ${note?`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">${F_SHIELD}
        <span style="font-size:12px;font-weight:800;color:#e8dccb;line-height:1.2">Falhar não perde nível: só gasta o custo da tentativa. ${esc2(capHint)}</span></div>`:''}
      <div style="flex:1;min-height:0"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;flex-direction:column;line-height:1.15;width:112px;flex:none">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2">Custo por tentativa</span>
          <span class="lil" style="display:flex;align-items:center;gap:4px;font-size:20px;color:${lackSt?'#ff5a4e':'#f6ecdf'};white-space:nowrap">${F_HAMMER(18)}${stop?'—':n0(c.stones)+' / '+kf(stones)}</span>
          <span style="display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:${lackG?'#ff5a4e':'#c9b9a2'};white-space:nowrap">${COIN_I(14)}${stop?'—':kf(c.gold)}</span></div>
        <button class="lil ${okGo?'f-gold f-pulse':''}" data-x="forge" id="f_go" aria-disabled="${!okGo}" style="flex:1;height:56px;border-radius:16px;font-size:21px;padding:0;${okGo?'':btnOff}">${label}</button></div></div>`;
  } else {
    /* ----- cartão: nível do item equipado (Sys.stats) ----- */
    const ML=fMaxLvl();
    if(!it){ card=`<div class="${cardCls}" style="${cardSt};align-items:center;justify-content:center;text-align:center">
        <img src="${ICON[sl]}" alt="" style="width:56px;height:56px;object-fit:contain;opacity:.5">
        <span class="lil" style="font-size:20px">Nenhum item em ${esc2(SLOT[sl].n)}</span>
        <span style="font-size:13px;font-weight:800;color:#c9b9a2;line-height:1.25">Equipe um item neste espaço para subir o nível dele. O fortalecimento +${n} já vale para o item que entrar.</span></div>`; }
    else { const cu=Sys.stats.canUpgrade(S,Sys.host,it,'gold'), L=it.lvl||1, isMax=cu.reason==='max', blocked=isMax||cu.reason==='level'||cu.reason==='dormant';
      const label=isMax?'Nível máximo':cu.reason==='level'?'No teto do seu nível':cu.reason==='dormant'?'Item adormecido':cu.reason==='money'?'Falta ouro':'Melhorar';
      const hint=isMax?'Este item já está no nível máximo.':cu.reason==='dormant'?'Item adormecido: desperta quando você chegar na '+fEraName(cu.wakeEra|0)+'.'
        :cu.reason==='level'?'Suba ao nível '+(cu.needLevel||L+1)+' de jogador para melhorar este item.':'O nível é do item e sobe até o seu nível de jogador (Nv. '+lv+').';
      card=`<div class="${cardCls}" style="${cardSt}">
      <div style="display:flex;align-items:center;gap:10px">
        <span class="lil" style="font-size:28px;text-shadow:0 2px 0 #000;white-space:nowrap">Nv. ${L}</span>${F_ARROW}
        <span class="lil ${pop}" style="font-size:28px;color:#5fd068;text-shadow:0 2px 0 #000;white-space:nowrap">${isMax?'Máx':'Nv. '+(L+1)}</span>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;align-items:flex-end;line-height:1.15">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(fStatName(sl))} do item</span>
          <span style="font-size:15px;font-weight:900;white-space:nowrap">${fMul(L)} <span style="color:#c9b9a2">→</span> <span style="color:#5fd068">${isMax?'—':fMul(L+1)}</span></span></div></div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;gap:8px"><span style="min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${RC[it.r]}">${esc2(iname(it))}</span><span style="color:#ffc94a;white-space:nowrap">${L} / ${ML}</span></div>
        <div style="height:14px;border-radius:7px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden">
          <div class="f-pitybar" style="width:${Math.round(L/ML*100)}%;height:100%;background:linear-gradient(90deg,#5fd068,#b6f07a)"></div></div></div>
      ${note?`<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">${F_SHIELD}
        <span style="font-size:12px;font-weight:800;color:#e8dccb;line-height:1.2">${esc2(hint)}</span></div>`:''}
      <div style="flex:1;min-height:0"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;flex-direction:column;line-height:1.15;width:112px;flex:none">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2">Custo</span>
          <span class="lil" style="display:flex;align-items:center;gap:4px;font-size:20px;color:${cu.reason==='money'?'#ff5a4e':'#f6ecdf'};white-space:nowrap">${COIN_I(22)}${blocked?'—':kf(cu.gold)}</span></div>
        <button class="lil ${cu.ok?'f-gold f-pulse':''}" data-x="lvup" id="f_go" aria-disabled="${!cu.ok}" style="flex:1;height:56px;border-radius:16px;font-size:${label.length>14?17:21}px;padding:0;${cu.ok?'':btnOff}">${label}</button></div></div>`; }
  }

  V.innerHTML=xWrap(d,XF.anim?'f-in':'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:8px 0 10px;box-sizing:border-box;overflow:hidden">
    <div style="height:44px;flex:none;margin:0 12px;display:flex;align-items:center;gap:8px">
      <div role="group" aria-label="Modo" style="flex:1;min-width:0;height:44px;display:flex;padding:3px;gap:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">${modes}</div>
      <div role="img" aria-label="${n0(stones)} Pedras de Forja" style="flex:none;display:flex;align-items:center;gap:6px;height:36px;padding:0 12px 0 8px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">
        ${F_HAMMER(22)}<span id="f_stones" style="font-size:15px;font-weight:900">${kf(stones)}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">Pedras de Forja</span></div></div>
    ${stage}
    <div role="group" aria-label="Espaços de equipamento" style="height:50px;flex:none;margin:0 12px;display:flex;align-items:flex-end;gap:5px">${strip}</div>
    ${track}
    ${card}</div>`);
  XF.anim=false; XF.cardIn=false; XF.sig=fSig();
}
/* assinatura do que muda por fora (pedras e ouro caindo da batalha, nível do jogador): o tick redesenha só quando ela muda */
function fSig(){ if(fLocked()) return 'gate'; try{ const c=Sys.forge.canTry(S,Sys.host,XF.slot), it=eqItem(XF.slot), u=it?Sys.stats.canUpgrade(S,Sys.host,it,'gold'):null;
    return [c.reason,c.stones,c.gold,fCap(),fWingOpen()?1:0,u?u.reason:'-',u?u.gold:0].join('|'); }catch(e){ return ''; } }

function fClick(b,ev){
  const a=b.dataset.x;
  if(a==='gate'){ snd('ui_tap'); Screens.close(); return; }
  if(XF.busy) return;                                   /* martelando: o toque não vale */
  if(a==='mode'){ const m=b.dataset.m==='level'?'level':'forge'; snd('ui_tap'); if(m===XF.mode) return; fStop(); XF.mode=m; XF.cardIn=true; render(); }
  else if(a==='slot'){ const s=b.dataset.slot; snd('ui_tap');
    if(s==='wing'&&!fWingOpen()){ fToast('Asa: libera no nível '+fWingLv()+' (você está no '+plv()+')'); return; }
    if(!fSlotOk(s)||s===XF.slot) return; fStop(); XF.slot=s; XF.cardIn=true; render(); }
  else if(a==='chip'){ snd('ui_tap'); const v=+b.dataset.v||0, real=fTier(Sys.forge.level(S,'weapon')); XF.prev=fTier(v)===real?null:v; render(); }
  else if(a==='forge') fForge();
  else if(a==='lvup') fLevelUp();
}
/* uma tentativa: o Sys.forge decide, cobra pedras e ouro e guarda a garantia; a tela só anima (0,7 s de martelo e depois o resultado) */
function fForge(){
  const sl=XF.slot, FD=fD(), c=Sys.forge.canTry(S,Sys.host,sl);
  if(!c.ok){ snd('ui_tap');
    fToast(c.reason==='max'?SLOT[sl].n+' já está no máximo: +'+FD.max
      :c.reason==='cap'?'Teto da '+fEraName(fEraNow())+': +'+fCap()+'. Avance de era para passar.'
      :c.reason==='stones'?'Pedras de Forja insuficientes: faltam '+n0(Math.max(1,c.stones-fStones()))
      :c.reason==='gold'?needMsg('gold',c.gold)
      :c.reason==='locked'?'Forja: libera no nível '+fGateLv():'Não dá para fortalecer este espaço agora');
    return; }
  const n0lv=Sys.forge.level(S,sl), t0=fTier(n0lv); XF.pity0=fPity(sl);
  const r=Sys.forge.attempt(S,Sys.host,sl);
  if(!r.ok){ snd('ui_tap'); fToast(r.reason==='gold'?needMsg('gold',c.gold):'Não dá para fortalecer este espaço agora'); render(); return; }
  /* o resultado já está no save (pedras e ouro gastos; +N se acertou): grava agora, mesmo que o jogador saia antes do fim da animação */
  if(r.success) statsChanged(); else { save(); hud(); }
  snd('ui_tap'); clearTimeout(XF.t1); clearTimeout(XF.t2); XF.busy=true; XF.prev=null; XF.fx=null; render();
  XF.t1=setTimeout(()=>{ XF.busy=false;
    if(r.success){ snd('claim'); vib(40); const nt=fTier(r.lv);
      fFire('ok','+'+r.lv+'!',sl==='weapon'&&nt!==t0?'Nova aura: '+fAuras()[nt].name:fStatName(sl)+' do espaço +'+fPct(FD.bonus[r.lv])+'%'); }
    else { snd('ui_tap'); fFire('fail'); } },700);
}
/* nível do item equipado: as mesmas chamadas da tela de Equipamento (gClick 'upgold') */
function fLevelUp(){
  const sl=XF.slot, it=eqItem(sl);
  if(!it){ snd('ui_tap'); fToast('Equipe um item em '+SLOT[sl].n+' primeiro'); return; }
  const c=Sys.stats.canUpgrade(S,Sys.host,it,'gold');
  if(!c.ok){ snd('ui_tap'); fToast(c.reason==='max'?'Nível máximo':c.reason==='level'?'Suba ao nível '+(c.needLevel||it.lvl+1)+' para melhorar'
      :c.reason==='dormant'?'Item adormecido: desperta na '+fEraName(c.wakeEra|0):needMsg('gold',c.gold)); return; }
  const r=Sys.stats.upgrade(S,Sys.host,it,'gold'); if(!r.ok){ snd('ui_tap'); fToast(needMsg('gold',c.gold)); render(); return; }
  ptrack('upgrade',1); statsChanged(); snd('upgrade'); if(typeof tutEvent==='function') tutEvent('up');
  fFire('lv','Nv. '+it.lvl+'!',fStatName(sl)+' '+fMul(it.lvl));
}

Panels.add('forge',{title:'Forja',render:scrForge,click:fClick,
  tick(){ if(XF.busy||XF.fx) return; const el=document.getElementById('f_stones');
    if(el){ let t=''; try{ t=kf(fStones()); }catch(e){ return; } if(el.textContent!==t) el.textContent=t; }
    if(XF.sig&&fSig()!==XF.sig&&fOn()) render(); },
  busy(){ return XF.busy||!!XF.fx; },
  onOpen(o){ fStop(); XF.anim=true; XF.cardIn=true; XF.prev=null; XF.toast='';
    if(o&&(o.mode==='level'||o.mode==='forge')) XF.mode=o.mode; if(o&&o.slot&&fSlotOk(o.slot)) XF.slot=o.slot; },
  onClose(){ fStop(); XF.prev=null; XF.toast=''; } });
