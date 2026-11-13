'use strict';
/* ================= 15 FORJA (fortalecer +N do espaço e nível do item) — tela nova, nasce DESLIGADA (PANEL_ON.forge) =================
   Protótipo: docs/proto/Forja.dc.html. NENHUMA conta de jogo aqui:
   - fortalecimento (+0 a +15 por espaço, chance, garantia, pedras, ouro, teto da era, aura da arma): Sys.forge (js/sys/forge.js);
   - nível do item equipado (1 a 100, teto = nível do jogador): Sys.stats (upgradeCost, canUpgrade, upgrade, lvlFactor), igual ao gSheet/gClick;
   - asa bloqueada: Sys.stats.slotOpen('wing', plv()); portão da tela: Sys.level (isUnlocked/unlockLevel 'forge').
   Missões: o evento 'forge' do passe conta PEDRAS COLETADAS (passSync lê Sys.loot.todayCount), não tentativas: aqui não se chama ptrack('forge').
   Subir o nível do item chama ptrack('upgrade',1), como a tela de Equipamento.
   LAYOUT (protótipo convertido): o cabeçalho (Voltar, título, moedas, gemas) é do index.html/fullbattle.js; aqui só o conteúdo, na ordem do protótipo:
   saldo de pedras (44) · modos (52) · palco (258) · [faixa dos 7 espaços] · trilha (30) · cartão (cresce; o botão da ação fica no fim dele).
   No layout novo do screens.js (PANEL_V2.real) o xDims devolve escala 1: 1 px da tela = 1 px do protótipo, largura real de 320 a 600 (centrada).
   Por isso o palco não usa mais caixa fixa de 390: o centro (aura, pedestal, Kael) vai em calc(50% - x) e as bordas em left/right, como o protótipo.
   Em tela alta o cartão estica e a ação cola embaixo; em tela baixa o conteúdo ROLA (classe x-scroll), como o protótipo; nada encolhe para caber.
   No modo antigo com escala (contorno comum ligado) a altura mínima pequena passada ao xDims faz a escala depender só da largura.
   A Forja é subtela do Equipamento (parent:'gear'); não há botão de voltar próprio.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - 7 espaços (regra do dono; o protótipo ainda desenha só Arma e Armadura no palco): o escolhido aparece grande no palco e os 7 ficam numa faixa abaixo dele;
   - sem o modo "Transformar": no protótipo ele só tem marcadores ([OURO], [N], valores ilustrativos) e o Sys.forge não tem função de transformar;
   - "Nível" é o nível do ITEM equipado (1 a 100, Sys.stats), não um nível do espaço até 60; textos do cartão seguem essa regra;
   - custo mostra pedras E ouro reais (o protótipo diz "+ ouro 30× abate (a confirmar)"); por isso o aviso diz "só gasta o custo da tentativa";
   - auras +4/+7/+10/+13 com as folhas reais (assets/anim/aura), sem os rótulos "prévia provisória"/"arte aprovada"; chance sem dobro;
   - alvos de toque: os 7 espaços são botões sem vão entre si (largura = (tela − 8) / 7: 44,6 px em 320) com a caixa desenhada por dentro;
     se a tela vier com escala menor que 1 (modo antigo), modos, pastilhas de aura e espaços crescem (44/escala) e o palco cresce só o necessário. */
const XF={mode:'forge',slot:'weapon',prev:null,busy:false,fx:null,big:'',small:'',pity0:0,anim:true,cardIn:true,toast:'',toastT:0,t1:0,t2:0,sig:''};
const F_MINH=240;   /* altura mínima passada ao xDims: pequena de propósito; no modo com escala ela faz a escala depender só da largura */
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

function fToastHtml(msg){ return `<div class="f-toast" role="status" style="position:absolute;left:0;right:0;top:150px;display:flex;justify-content:center;pointer-events:none;z-index:6"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ff8a5c;font-size:14px;font-weight:900;color:#f6ecdf;box-shadow:0 0 16px rgba(255,138,92,.45);max-width:250px;text-align:center;line-height:1.2">${esc2(msg)}</span></div>`; }
function fToast(msg){ XF.toast=msg; XF.toastT=Date.now(); const el=document.getElementById('f_toast'); if(el) el.innerHTML=fToastHtml(msg); }
function fOn(){ return typeof view!=='undefined'&&view==='forge'; }
function fStop(){ clearTimeout(XF.t1); clearTimeout(XF.t2); clearTimeout(XF.t3); XF.busy=false; XF.fx=null; XF.auto=null; XF.lockTip=false; }
/* ---------- FORJA AUTOMÁTICA (conveniência do VIP 'autoForge': Sys.vip.conv; nível e texto "VIP n" vêm do módulo) ----------
   Repete a MESMA tentativa do botão "Fortalecer" (fForge: Sys.forge.attempt, mesmos custos, sons e avisos), uma por passo com pausa, até o alvo
   escolhido, até faltar pedra/ouro, até o teto, ou até o jogador tocar em "Parar". Nunca passa do alvo. Sem o nível de VIP nada roda: só explica.
   XF.auto = {slot, goal, from, to, tries, wins, stones, gold, run, why}; com run=false é o resumo mostrado no cartão. */
const fAutoConv=()=>{ try{ if(!(Sys.vip&&Sys.vip.DATA&&Sys.vip.DATA.convOn===true&&typeof Sys.vip.conv==='function')) return null; return Sys.vip.conv(S,'autoForge')||null; }catch(e){ return null; } };
const fGoalMax=()=>Math.min(fD().max,fCap());
function fGoal(sl){ const n=Sys.forge.level(S,sl), mx=fGoalMax(); let g=XF.goal|0; if(!(g>n)) g=n+1; return Math.min(g,mx); }
const fPl=(n,a,b)=>n0(n)+' '+(n===1?a:b);
function fAutoEnd(why,quiet){ const A=XF.auto; if(!A) return; clearTimeout(XF.t3); A.run=false; A.why=why; A.to=Sys.forge.level(S,A.slot); if(!quiet&&fOn()&&!XF.busy) render(); }
function fAutoStart(){ const cv=fAutoConv(), sl=XF.slot; if(!cv) return;
  if(!cv.on){ snd('ui_tap'); XF.lockTip=!XF.lockTip; render(); return; }   /* trancada: a explicação abre DENTRO da própria linha (o aviso flutuante cobria o rótulo da aura: defeito E3 do QA) */
  const n=Sys.forge.level(S,sl), goal=fGoal(sl); XF.auto=null;
  if(!(goal>n)){ fForge(); return; }                    /* no máximo ou no teto: o mesmo aviso do botão comum */
  XF.auto={slot:sl,goal,from:n,to:n,tries:0,wins:0,stones:0,gold:0,run:true,why:''}; fAutoStep(); }
function fAutoStep(){ const A=XF.auto; if(!A||!A.run) return;
  if(!fOn()||XF.slot!==A.slot||XF.mode!=='forge'){ fAutoEnd('stop'); return; }
  if(Sys.forge.level(S,A.slot)>=A.goal){ fAutoEnd('goal'); return; }
  const cv=fAutoConv(); if(!cv||!cv.on){ fAutoEnd('stop'); return; }
  const o=fForge({ tried(r){ A.tries++; if(r.success) A.wins++; A.stones+=r.stones||0; A.gold+=r.gold||0; },
    /* depois do resultado: decide se há próximo passo (sem redesenhar: quem desenha é o fFire logo em seguida) */
    after(){ if(XF.auto!==A||!A.run) return false; if(Sys.forge.level(S,A.slot)>=A.goal){ fAutoEnd('goal',true); return false; }
      const c=Sys.forge.canTry(S,Sys.host,A.slot); if(!c.ok){ fAutoEnd(c.reason,true); return false; } return true; } });
  if(o&&o.stop){ if(A.tries) fAutoEnd(o.stop); else XF.auto=null; } }   /* recusa já no primeiro passo: o aviso comum explicou; não há resumo de zero tentativas */
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
    <button class="f-gold lil" data-x="gate" style="margin-top:6px;height:${Math.max(52,fTouch(d))}px;padding:0 28px;border-radius:16px;font-size:20px">Voltar ao Equipamento</button></div>`);
}
/* lado mínimo de um alvo de toque para dar 44 px reais: 44 no layout novo (escala 1); maior só se a tela vier reduzida (modo antigo com escala) */
function fTouch(d){ return Math.max(44,Math.ceil(44/(d.s||1)-1e-6)); }

function scrForge(){
  const d=xDims(F_MINH);                                 /* nunca encolhe pela altura: o que sobra estica o cartão, o que falta rola */
  if(fLocked()){ V.innerHTML=fGate(d); XF.anim=false; XF.sig='gate'; return; }
  const sc0=XF.anim?null:document.getElementById('f_scroll'), y0=sc0?(+sc0.scrollTop||0):0;   /* o redesenho não pode devolver a rolagem ao topo */
  if(!fSlotOk(XF.slot)) XF.slot='weapon';
  const FD=fD(), A=fAuras(), MAX=FD.max, sl=XF.slot, o=Sys.forge.ensure(S), n=o.lv[sl], cap=fCap(), c=Sys.forge.canTry(S,Sys.host,sl);
  const atMax=n>=MAX, atCap=!atMax&&n>=cap, stop=atMax||atCap, stones=o.stones, pity=o.pity[sl]||0, base=stop?0:FD.chance[n], lv=plv();
  const wP=o.lv.weapon, realT=fTier(wP), shownT=XF.prev!=null?fTier(XF.prev):realT, shownP=XF.prev!=null?XF.prev:wP, tc=F_TC[shownT]||F_TC[0];
  const it=eqItem(sl), selT=fTier(n), fx=XF.fx, wingOpen=fWingOpen();
  /* alvos de toque: tc44 = lado que dá 44 px reais (44 com escala 1). O palco tem os 258 px do protótipo e só cresce
     quando as 5 pastilhas de aura, com esse lado, não cabem nele (só acontece no modo antigo com escala) */
  const tc44=fTouch(d), tight=tc44>44, chTop=tight?2:8, chGap=tight?0:2, chW=Math.max(52,tc44), stH=Math.max(258,chTop+12+chGap*5+5*tc44+4);

  /* ----- modos ----- */
  const modes=[['forge','Fortalecer +N'],['level','Nível']].map(m=>{ const on=XF.mode===m[0];
    return `<button data-x="mode" data-m="${m[0]}" aria-pressed="${on}" style="flex:1;height:${tc44}px;border-radius:11px;border:0;background:${on?'#3a2c1f':'transparent'};color:${on?'#ffc94a':'#c9b9a2'};font-size:14px;font-weight:900;padding:0;white-space:nowrap">${m[1]}</button>`; }).join('')
    /* FUSÃO (js/p_fuse.js, de Sistemas): terceira opção da fileira, SÓ com PANEL_ON.fuse ligada e a tela registrada; abre a tela e volta para a Forja */
    +(window.Panels&&Panels.defs&&Panels.defs.fuse&&Panels.on('fuse')?`<button data-x="fuse" aria-label="Fusão: juntar 3 itens iguais. Abrir" style="flex:1;height:${tc44}px;border-radius:11px;border:0;background:transparent;color:#c9b9a2;font-size:14px;font-weight:900;padding:0;white-space:nowrap">Fusão</button>`:'');

  /* ----- espaço escolhido (grande, no palco) ----- */
  const plusBg=t=>t===0?'#33271d':F_TC[t], plusFg=t=>t===0?'#f6ecdf':t===4?'#2a1403':'#0e0a07';
  /* com item: a moldura única da raridade (xRar, js/screens.js) no lugar da borda dourada e do halo; vazio (ou PANEL_V2.rar desligada): como antes */
  const qB=xRar(it);
  const bigSlot=`<div style="position:absolute;left:12px;top:18px;width:96px;display:flex;flex-direction:column;align-items:flex-start;gap:2px">
      <div class="${fx==='fail'?'f-shake':fx?'f-bright':''}" style="position:relative;width:72px;height:72px">
        ${qB.on?'':'<span class="f-halo" style="background:#ffc94a"></span>'}
        <div${qB.on?' class="'+qB.cls.trim()+'"'+qB.at:''} role="img" aria-label="${esc2(SLOT[sl].n)}${it?': '+esc2(iname(it))+', '+RN(it.r)+', nível '+it.lvl:': vazio'}, mais ${n}" style="position:absolute;inset:0;border-radius:16px;${qB.on?'':'border:3px solid #ffc94a;background:radial-gradient(circle at 50% 40%,#4a3a2b,#1d1611);'}overflow:hidden;box-sizing:border-box;text-align:center">
          <img src="${it?xRarIco(slotIcon(sl,ieraV(it)),it.r,58):ICON[sl]}" alt="" style="width:58px;height:58px;object-fit:contain;margin-top:2px;${it?'':'opacity:.55'}">
          <span class="f-sheen"></span>
          <span style="position:absolute;left:0;right:0;bottom:0;height:18px;background:rgba(0,0,0,.72);font-size:11px;font-weight:900;color:${it?'#fff':'#c9b9a2'};line-height:18px">${it?'Nv.'+it.lvl:'vazio'}</span></div>
        <span class="lil" style="position:absolute;top:-7px;right:-9px;min-width:30px;height:22px;padding:0 5px;border-radius:11px;background:${plusBg(selT)};border:2px solid #16110d;color:${plusFg(selT)};font-size:14px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">+${n}</span>
        ${XF.busy?'<svg class="f-hammer" width="44" height="44" viewBox="0 0 24 24" fill="#c9b9a2" stroke="#16110d" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true" style="position:absolute;right:-28px;top:-18px"><path d="M14.5 3.5l6 6-2.5 2.5-6-6z"></path><path d="M12.5 7.5 3.5 16.5l4 4 9-9z" fill="#8a5a33"></path></svg>':''}
      </div>
      <span style="width:72px;text-align:center;font-size:11px;font-weight:900;color:#ffc94a;text-shadow:0 1px 2px #000;white-space:nowrap">${esc2(SLOT[sl].n)}</span>
      ${it?`<span style="max-width:96px;font-size:10px;font-weight:800;color:${xRarT(it)};text-shadow:0 1px 2px #000,0 0 4px #000;line-height:1.1;overflow-wrap:anywhere">${esc2(iname(it))}</span>`:''}</div>`;

  /* ----- prévia das auras (direita): pastilha de 52x44 como no protótipo; o botão em volta é o alvo de toque (cresce em tela estreita) ----- */
  const chips=A.map((a,i)=>{ const on=shownT===i, col=F_TC[i]||F_TC[0];
    return `<button class="f-chip" data-x="chip" data-v="${a.from}" aria-pressed="${on}" aria-label="Ver ${esc2(a.name)} (a partir de +${a.from})" style="width:${chW}px;height:${tc44}px;flex:none;border:0;background:transparent;padding:0;display:flex;align-items:center;justify-content:center">
      <span class="lil" style="width:52px;height:44px;border-radius:12px;border:2px solid ${on?col:'#4a3a2b'};background:${on?'#3a2c1f':'rgba(29,22,17,.88)'};color:#f6ecdf;display:flex;align-items:center;justify-content:center;gap:4px;font-size:14px;box-sizing:border-box">
        <span style="width:10px;height:10px;border-radius:50%;background:${col};box-shadow:0 0 6px ${col}"></span>+${a.from}</span></button>`; }).join('');
  const auraLabel=(XF.prev!=null?'Prévia +'+shownP+': ':'Arma +'+wP+': ')+A[shownT].name;

  /* ----- efeitos do resultado ----- */
  const bursts=[[-90,-70],[90,-64],[-70,40],[80,46],[0,-100],[-110,-10],[110,-6]].map(p=>`<span class="f-burst" style="left:calc(50% - 3px);top:130px;--dx:${p[0]}px;--dy:${p[1]}px"></span>`).join('');
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
  const stage=`<div class="${fx==='fail'?'f-shake':''}" style="position:relative;height:${stH}px;flex:none;overflow:hidden;background:#8fc6dc">
      <div class="x-ly x-sky" style="top:0;height:171px;background-size:auto 171px"></div><div class="x-ly x-cld" style="top:14px;height:46px;background-size:auto 46px"></div>
      <div style="position:absolute;left:0;right:0;top:171px;height:28px;background:#6b93a6"></div>
      <div class="x-ly x-far" style="top:63px;height:120px;background-size:auto 120px"></div><div class="x-ly x-gnd" style="top:187px;height:108px;background-size:auto 108px"></div>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 60%,rgba(22,17,13,.25) 0%,rgba(22,17,13,.8) 64%,rgba(22,17,13,.97) 100%)"></div>
      <div style="position:absolute;inset:0">
        ${shownT>0?`<div class="x-aura" role="img" aria-label="${esc2(A[shownT].name)}" style="left:calc(50% - 88px);top:2px;width:176px;height:220px;background-image:url(assets/anim/aura/aura${A[shownT].from}.png)"></div>`:''}
        <div class="f-ped" style="position:absolute;left:calc(50% - 73px);top:208px;width:146px;height:28px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#6a5440 0%,#3a2c1f 60%,#241a12 100%);border:2px solid #ffc94a;box-sizing:border-box"></div>
        ${sl!=='weapon'&&selT>0?`<div class="f-footglow" style="left:calc(50% - 63px);top:210px;width:126px;height:22px;background:radial-gradient(ellipse,${F_TC[selT]} 0%,rgba(0,0,0,0) 70%)"></div>`:''}
        <div class="${fx==='ok'?'f-bright':''}" style="position:absolute;left:calc(50% - 90px);top:51px;width:180px;height:180px"><div class="kidle ${tier?'t'+tier:''}" role="img" aria-label="Kael parado" style="width:180px;height:180px"></div></div>
        ${bigSlot}
        <div role="group" aria-label="Prévia das auras da arma" style="position:absolute;right:${10-(chW-52)/2}px;top:${chTop}px;display:flex;flex-direction:column;gap:${chGap}px;align-items:center">
          <span style="font-size:10px;font-weight:900;color:#c9b9a2;text-shadow:0 1px 2px #000;letter-spacing:.5px;line-height:12px">AURA</span>${chips}</div>
        <div style="position:absolute;left:0;right:0;bottom:4px;display:flex;justify-content:center;pointer-events:none">
          <span style="padding:3px 10px;border-radius:9px;background:rgba(14,10,7,.86);border:1px solid ${tc};font-size:11px;font-weight:900;color:#f6ecdf;white-space:nowrap">${esc2(auraLabel)}</span></div>
        ${fxH}
      </div></div>`;

  /* ----- os 7 espaços: o botão (transparente, sem vão entre vizinhos) é o alvo de toque: largura (tela − 8) / 7 = 44,6 px em 320;
     a caixa desenhada dentro dele tem 48 px de altura e no máximo 58 de largura (em tela larga não estica) ----- */
  const miniH=Math.max(50,tc44), miniBtn=`position:relative;flex:1;min-width:0;height:${miniH}px;border:0;background:transparent;padding:0 3px;display:flex;align-items:flex-end;justify-content:center;box-sizing:border-box`;
  const strip=FD.slots.map(s=>{ const on=s===sl, x=eqItem(s), p=o.lv[s], t=fTier(p), nm=SLOT[s].n;
    if(s==='wing'&&!wingOpen) return `<button class="f-mini" data-x="slot" data-slot="wing" aria-label="Asa, bloqueada, libera no nível ${fWingLv()}" style="${miniBtn}">
        <span style="flex:1;min-width:0;max-width:58px;height:48px;border-radius:12px;border:2px dashed #8a7458;background:rgba(14,10,7,.82);color:#e8dccb;display:flex;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box">
        ${SVG_LOCK(18)}<span style="font-size:9px;font-weight:900;line-height:1.05;white-space:nowrap">Nível ${fWingLv()}</span></span></button>`;
    const q=xRar(x);   /* com item: moldura da raridade; o escolhido ganha um anel dourado POR DENTRO da moldura (a cor da raridade continua visível). Vazio: como antes */
    return `<button class="f-mini" data-x="slot" data-slot="${s}" aria-pressed="${on}" aria-label="${esc2(nm)}${x?': '+esc2(iname(x)):': vazio'}, mais ${p}${on?', selecionado':''}" style="${miniBtn}">
        <span${q.on?' class="'+q.cls.trim()+'"'+q.at:''} style="position:relative;flex:1;min-width:0;max-width:58px;height:48px;border-radius:12px;${q.on?'':`border:${on?'3px solid #ffc94a':x?'2px solid '+RC[x.r]:'2px dashed #8a7458'};background:${on?'radial-gradient(circle at 50% 40%,#5a4631,#241a12)':'radial-gradient(circle at 50% 40%,#3a2c1f,#16110d)'};`}display:flex;align-items:center;justify-content:center;box-sizing:border-box${on&&!q.on?';box-shadow:0 0 10px rgba(255,201,74,.55)':''}">
        ${q.on&&on?'<span aria-hidden="true" style="position:absolute;inset:0;border-radius:9px;border:2px solid #ffc94a;box-sizing:border-box;pointer-events:none"></span>':''}<img src="${x?xRarIco(slotIcon(s,ieraV(x)),x.r,30):ICON[s]}" alt="" style="width:30px;height:30px;object-fit:contain;${x?'':'opacity:.5'}">
        <span class="lil" style="position:absolute;top:-6px;right:-4px;min-width:22px;height:17px;padding:0 3px;border-radius:9px;background:${plusBg(t)};border:2px solid #16110d;color:${plusFg(t)};font-size:11px;line-height:13px;display:flex;align-items:center;justify-content:center;box-sizing:border-box">+${p}</span></span></button>`; }).join('');

  /* ----- trilha +1 a +15 com o teto da era ----- */
  let pips=''; for(let i=1;i<=MAX;i++){ const t=fTier(i), got=i<=n, lock=i>cap;
    pips+=`<span style="flex:1;height:${got?12:10}px;border-radius:4px;background:${got?(t===0?'#e8e2d8':F_TC[t]):'#241a12'};border:1px solid ${lock?'#33271d':got?'transparent':'#4a3a2b'};opacity:${lock?.35:1};box-shadow:${got&&t>0?'0 0 6px '+F_TC[t]:'none'};box-sizing:border-box;transition:background .4s"></span>`; }
  const track=`<div style="height:30px;flex:none;margin:0 12px;display:flex;align-items:center;gap:8px">
      <div role="img" aria-label="Fortalecimento +${n} de ${MAX}; teto da ${esc2(fEraName(fEraNow()))}: +${cap}" style="flex:1;display:flex;gap:3px;align-items:center">${pips}</div>
      <span style="display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:#c9b9a2;white-space:nowrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>Teto +${cap}</span></div>`;

  const cardCls=(XF.cardIn?'f-cardin ':'')+(fx==='fail'?'f-shake':''), pop=fx?'f-popn':'';
  const cardSt='flex:1 0 auto;margin:0 12px;padding:10px 12px;border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:8px;box-sizing:border-box';
  const btnOff='border:2px solid #4a3a2b;background:#33271d;color:#c9b9a2';
  let card='';
  if(XF.mode==='forge'){
    /* ----- cartão: fortalecer ----- */
    const AU=XF.auto&&XF.auto.slot===sl?XF.auto:null, run=!!(AU&&AU.run), cv=fAutoConv(), goal=stop?n:fGoal(sl);
    const ch=c.chance, okGo=c.ok&&!XF.busy&&!run, pityRoom=Math.max(1,100-base), pityPct=stop?0:Math.min(100,Math.round(pity/pityRoom*100)), pity0=stop?0:Math.min(100,Math.round(XF.pity0/pityRoom*100));
    const fails=Math.round(pity/Math.max(1,FD.pityPerFail)), curCol=selT===0?'#f6ecdf':F_TC[selT], nT=fTier(n+1), nextCol=stop?'#c9b9a2':nT===0?'#f6ecdf':F_TC[nT];
    let nextCap=null; for(let e=fEraNow()+1;e<FD.capByEra.length;e++) if(FD.capByEra[e]>cap){ nextCap={p:FD.capByEra[e],era:fEraName(e)}; break; }
    const capHint=cap<MAX&&nextCap?'Teto '+fEraName(fEraNow())+' +'+cap+'; +'+nextCap.p+' na '+nextCap.era+'.':'';
    const lackSt=!stop&&stones<c.stones, lackG=!stop&&S.gold<c.gold;
    /* forja automática: rodando = progresso + Parar; parada = resumo; depois o seletor de alvo + "Forjar até +N" (ou a linha trancada com "VIP n") */
    const stepB=(dd,lb,off)=>`<button data-x="goal" data-d="${dd}" aria-label="${lb}" aria-disabled="${off}" class="lil" style="width:44px;height:44px;flex:none;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:${off?'#8a7a68':'#f6ecdf'};font-size:22px;line-height:1;padding:0">${dd<0?'−':'+'}</button>`;
    const AWHY={goal:'Chegou ao alvo',max:'Chegou ao máximo',cap:'Parou no teto da era',stones:'Parou: faltaram pedras',gold:'Parou: faltou ouro',stop:'Parada por você'};
    const autoH=!cv?'':run?`<div role="status" style="display:flex;align-items:center;gap:10px;padding:6px 6px 6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #ffc94a">
        <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2"><span style="font-size:12px;font-weight:900">Forjando até +${AU.goal} · agora +${n}</span>
          <span id="f_autop" style="font-size:11px;font-weight:800;color:#c9b9a2">${fPl(AU.tries,'tentativa','tentativas')}, ${fPl(AU.wins,'acerto','acertos')}</span></span>
        <button data-x="autostop" class="lil" style="flex:none;height:44px;padding:0 16px;border-radius:12px;border:2px solid #ff8a5c;background:#33271d;color:#ffb3a8;font-size:16px">Parar</button></div>`
      :(AU?`<div id="f_autosum" role="status" style="display:flex;flex-direction:column;gap:2px;padding:6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #5fd068;line-height:1.2">
        <span style="font-size:12px;font-weight:900;color:#f6ecdf">Forja automática: ${AWHY[AU.why]||'Parou'} · +${AU.from} → +${AU.to}</span>
        <span style="font-size:11px;font-weight:800;color:#c9b9a2">${fPl(AU.tries,'tentativa','tentativas')}, ${fPl(AU.wins,'acerto','acertos')} · gasto: ${fPl(AU.stones,'pedra','pedras')}${AU.gold?' e '+kf(AU.gold)+' de ouro':''}</span></div>`:'')
      +(!cv.on?`<button data-x="autogo" aria-expanded="${XF.lockTip?'true':'false'}" aria-label="Forja automática até o nível escolhido, trancada: ${esc2(cv.lockText)}. Toque para saber mais" style="min-height:44px;display:flex;align-items:center;gap:8px;padding:${XF.lockTip?6:0}px 10px;border-radius:12px;border:2px solid ${XF.lockTip?'#8a7458':'#4a3a2b'};background:#33271d;color:#c9b9a2;text-align:left;box-sizing:border-box">
          <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span class="lil" style="font-size:14px;line-height:1.1">Forjar até o nível escolhido</span>
            ${XF.lockTip?`<span id="f_locktip" role="status" style="font-size:11px;font-weight:800;color:#e8dccb;line-height:1.2">Forja automática: libera no ${esc2(cv.lockText)}. O VIP sobe com o total gasto na Loja.</span>`:''}</span>
          <span style="flex:none;display:flex;align-items:center;gap:4px;height:26px;padding:0 8px;border-radius:13px;border:1px solid #8a7458;background:#241a12;color:#ffc94a;font-size:12px;font-weight:900;white-space:nowrap">${SVG_LOCK(14,'#ffc94a')}${esc2(cv.lockText)}</span></button>`
        :stop?'':`<div role="group" aria-label="Forja automática" style="display:flex;align-items:center;gap:6px">
          ${stepB(-1,'Alvo menor',goal<=n+1)}<span class="lil" id="f_goal" role="status" aria-label="Alvo: mais ${goal}" style="min-width:40px;flex:none;text-align:center;font-size:20px;color:#ffc94a">+${goal}</span>${stepB(1,'Alvo maior',goal>=fGoalMax())}
          <button data-x="autogo" id="f_autogo" class="lil" aria-disabled="${!c.ok}" style="flex:1;min-width:0;height:44px;border-radius:12px;padding:0 4px;font-size:15px;line-height:1.05;${c.ok&&!XF.busy?'border:2px solid #ffc94a;background:#3a2c1f;color:#ffc94a':btnOff}">Forjar até +${goal}</button></div>`);
    const label=XF.busy||run?'Forjando...':atMax?'Máximo +'+MAX:atCap?'Teto da era':c.reason==='stones'?'Faltam pedras':c.reason==='gold'?'Falta ouro':'Fortalecer';
    card=`<div class="${cardCls}" style="${cardSt}">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px">
        <span class="lil" style="font-size:30px;color:${curCol};text-shadow:0 2px 0 #000">+${n}</span>${F_ARROW}
        <span class="lil ${pop}" style="font-size:30px;color:${nextCol};text-shadow:0 2px 0 #000">${atMax?'Máx.':atCap?'Teto':'+'+(n+1)}</span>
        <div style="flex:1 0 auto;display:flex;flex-direction:column;align-items:flex-end;line-height:1.15">
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
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">${F_SHIELD}
        <span style="font-size:12px;font-weight:800;color:#e8dccb;line-height:1.2">Falhar não perde nível: só gasta o custo da tentativa. ${esc2(capHint)}</span></div>
      <div style="flex:1"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;flex-direction:column;line-height:1.15;width:112px;flex:none">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2">Custo por tentativa</span>
          <span class="lil" style="display:flex;align-items:center;gap:4px;font-size:20px;color:${lackSt?'#ff5a4e':'#f6ecdf'};white-space:nowrap">${F_HAMMER(18)}${stop?'—':n0(c.stones)+' / '+kf(stones)}</span>
          <span style="display:flex;align-items:center;gap:3px;font-size:12px;font-weight:900;color:${lackG?'#ff5a4e':'#c9b9a2'};white-space:nowrap">${COIN_I(14)}${stop?'—':kf(c.gold)}</span></div>
        <button class="lil ${okGo?'f-gold f-pulse':''}" data-x="forge" id="f_go" aria-disabled="${!okGo}" style="flex:1;height:56px;border-radius:16px;font-size:21px;padding:0;${okGo?'':btnOff}">${label}</button></div>
      ${autoH}</div>`;
  } else {
    /* ----- cartão: nível do item equipado (Sys.stats) ----- */
    const ML=fMaxLvl();
    if(!it){ card=`<div class="${cardCls}" style="${cardSt};min-height:200px;align-items:center;justify-content:center;text-align:center">
        <img src="${ICON[sl]}" alt="" style="width:56px;height:56px;object-fit:contain;opacity:.5">
        <span class="lil" style="font-size:20px">Nenhum item em ${esc2(SLOT[sl].n)}</span>
        <span style="font-size:13px;font-weight:800;color:#c9b9a2;line-height:1.25">Equipe um item neste espaço para subir o nível dele. O fortalecimento +${n} já vale para o item que entrar.</span></div>`; }
    else { const cu=Sys.stats.canUpgrade(S,Sys.host,it,'gold'), L=it.lvl||1, isMax=cu.reason==='max', blocked=isMax||cu.reason==='level'||cu.reason==='dormant';
      const label=isMax?'Nível máximo':cu.reason==='level'?'No teto do seu nível':cu.reason==='dormant'?'Item adormecido':cu.reason==='money'?'Falta ouro':'Melhorar';
      const hint=isMax?'Este item já está no nível máximo.':cu.reason==='dormant'?'Item adormecido: desperta quando você chegar na '+fEraName(cu.wakeEra|0)+'.'
        :cu.reason==='level'?'Suba ao nível '+(cu.needLevel||L+1)+' de jogador para melhorar este item.':'O nível é do item e sobe até o seu nível de jogador (Nv. '+lv+').';
      card=`<div class="${cardCls}" style="${cardSt}">
      <div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px">
        <span class="lil" style="font-size:28px;text-shadow:0 2px 0 #000;white-space:nowrap">Nv. ${L}</span>${F_ARROW}
        <span class="lil ${pop}" style="font-size:28px;color:#5fd068;text-shadow:0 2px 0 #000;white-space:nowrap">${isMax?'Máx':'Nv. '+(L+1)}</span>
        <div style="flex:1 0 auto;display:flex;flex-direction:column;align-items:flex-end;line-height:1.15">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">${esc2(fStatName(sl))} do item</span>
          <span style="font-size:15px;font-weight:900;white-space:nowrap">${fMul(L)} <span style="color:#c9b9a2">→</span> <span style="color:#5fd068">${isMax?'—':fMul(L+1)}</span></span></div></div>
      <div style="display:flex;flex-direction:column;gap:4px">
        <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:900;gap:8px"><span style="min-width:0;overflow-wrap:anywhere;color:${xRarT(it)}">${esc2(iname(it))}</span><span style="color:#ffc94a;white-space:nowrap">${L} / ${ML}</span></div>
        <div style="height:14px;border-radius:7px;background:#0e0a07;border:1px solid #4a3a2b;overflow:hidden">
          <div class="f-pitybar" style="width:${Math.round(L/ML*100)}%;height:100%;background:linear-gradient(90deg,#5fd068,#b6f07a)"></div></div></div>
      <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b">${F_SHIELD}
        <span style="font-size:12px;font-weight:800;color:#e8dccb;line-height:1.2">${esc2(hint)}</span></div>
      <div style="flex:1"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="display:flex;flex-direction:column;line-height:1.15;width:112px;flex:none">
          <span style="font-size:11px;font-weight:800;color:#c9b9a2">Custo</span>
          <span class="lil" style="display:flex;align-items:center;gap:4px;font-size:20px;color:${cu.reason==='money'?'#ff5a4e':'#f6ecdf'};white-space:nowrap">${COIN_I(22)}${blocked?'—':kf(cu.gold)}</span></div>
        <button class="lil ${cu.ok?'f-gold f-pulse':''}" data-x="lvup" id="f_go" aria-disabled="${!cu.ok}" style="flex:1;height:56px;border-radius:16px;font-size:${label.length>14?17:21}px;padding:0;${cu.ok?'':btnOff}">${label}</button></div></div>`; }
  }

  /* ordem do protótipo: saldo de pedras · modos · palco · (faixa dos 7 espaços) · trilha · cartão. Só o miolo rola; o aviso fica fora da rolagem */
  V.innerHTML=xWrap(d,XF.anim?'f-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="f_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:8px 0 10px;box-sizing:border-box">
    <div style="height:44px;flex:none;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:0 12px;box-sizing:border-box">
      <div role="img" aria-label="${n0(stones)} Pedras de Forja" style="display:flex;align-items:center;gap:6px;height:36px;padding:0 12px 0 8px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">
        ${F_HAMMER(22)}<span id="f_stones" style="font-size:15px;font-weight:900">${kf(stones)}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">Pedras de Forja</span></div></div>
    <div role="group" aria-label="Modo" style="height:${tc44+8}px;flex:none;margin:0 12px;display:flex;padding:3px;gap:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b;box-sizing:border-box">${modes}</div>
    ${stage}
    <div role="group" aria-label="Espaços de equipamento" style="height:${miniH}px;flex:none;margin:0 4px;display:flex;align-items:flex-end">${strip}</div>
    ${track}
    ${card}</div>
    <div id="f_toast">${XF.toast&&Date.now()-XF.toastT<1500?fToastHtml(XF.toast):''}</div></div>`);
  if(y0){ const sc=document.getElementById('f_scroll'); if(sc) sc.scrollTop=y0; }
  XF.anim=false; XF.cardIn=false; XF.sig=fSig();
}
/* assinatura do que muda por fora (pedras e ouro caindo da batalha, nível do jogador): o tick redesenha só quando ela muda */
function fSig(){ if(fLocked()) return 'gate'; try{ const c=Sys.forge.canTry(S,Sys.host,XF.slot), it=eqItem(XF.slot), u=it?Sys.stats.canUpgrade(S,Sys.host,it,'gold'):null;
    return [c.reason,c.stones,c.gold,fCap(),fWingOpen()?1:0,u?u.reason:'-',u?u.gold:0].join('|'); }catch(e){ return ''; } }

function fClick(b,ev){
  const a=b.dataset.x;
  if(a==='gate'){ snd('ui_tap'); Screens.open('gear'); return; }      /* a Forja é subtela do Equipamento (decisão do PO) */
  if(a==='autostop'){ snd('ui_tap'); if(XF.auto&&XF.auto.run) fAutoEnd('stop'); return; }   /* vale mesmo martelando: a tentativa em curso (já cobrada) termina e nenhuma outra começa */
  if(XF.busy||(XF.auto&&XF.auto.run)) return;           /* martelando ou forja automática rodando: o toque não vale (só o "Parar") */
  if(a==='autogo'){ fAutoStart(); return; }
  if(a==='goal'){ snd('ui_tap'); const sl=XF.slot, n=Sys.forge.level(S,sl), mx=fGoalMax(), g=fGoal(sl)+(+b.dataset.d<0?-1:1);
    if(g<=n){ fToast('Alvo mínimo: +'+(n+1)); return; } if(g>mx){ fToast(mx>=fD().max?'Alvo máximo: +'+mx:'Teto da '+fEraName(fEraNow())+': +'+mx); return; }
    XF.goal=g; XF.auto=null; render(); return; }
  if(a==='forge') XF.auto=null;                          /* tentativa comum: o resumo da automática sai */
  if(a==='fuse'){ snd('ui_tap'); fStop(); if(!(window.Panels&&Panels.open('fuse',{from:'forge'}))) render(); return; }   /* Fusão (só aparece com a chave ligada) */
  if(a==='mode'){ const m=b.dataset.m==='level'?'level':'forge'; snd('ui_tap'); if(m===XF.mode) return; fStop(); XF.mode=m; XF.cardIn=true; render(); }
  else if(a==='slot'){ const s=b.dataset.slot; snd('ui_tap');
    if(s==='wing'&&!fWingOpen()){ fToast('Asa: libera no nível '+fWingLv()+' (você está no '+plv()+')'); return; }
    if(!fSlotOk(s)||s===XF.slot) return; fStop(); XF.slot=s; XF.cardIn=true; render(); }
  else if(a==='chip'){ snd('ui_tap'); const v=+b.dataset.v||0, real=fTier(Sys.forge.level(S,'weapon')); XF.prev=fTier(v)===real?null:v; render(); }
  else if(a==='forge') fForge();
  else if(a==='lvup') fLevelUp();
}
/* uma tentativa: o Sys.forge decide, cobra pedras e ouro e guarda a garantia; a tela só anima (0,7 s de martelo e depois o resultado) */
/* hook (só a forja automática passa): {tried(r), after()}; devolve {stop:motivo} quando a tentativa não aconteceu, {r} quando aconteceu */
function fForge(hook){
  const sl=XF.slot, FD=fD(), c=Sys.forge.canTry(S,Sys.host,sl);
  if(!c.ok){ snd('ui_tap');
    fToast(c.reason==='max'?SLOT[sl].n+' já está no máximo: +'+FD.max
      :c.reason==='cap'?'Teto da '+fEraName(fEraNow())+': +'+fCap()+'. Avance de era para passar.'
      :c.reason==='stones'?'Pedras de Forja insuficientes: faltam '+n0(Math.max(1,c.stones-fStones()))+'. Elas caem de chefes e inimigos e vêm ao desmontar itens.'
      :c.reason==='gold'?needMsg('gold',c.gold)
      :c.reason==='locked'?'Forja: libera no nível '+fGateLv():'Não dá para fortalecer este espaço agora');
    return {stop:c.reason||'no'}; }
  const n0lv=Sys.forge.level(S,sl), t0=fTier(n0lv); XF.pity0=fPity(sl);
  const r=Sys.forge.attempt(S,Sys.host,sl);
  if(!r.ok){ snd('ui_tap'); fToast(r.reason==='gold'?needMsg('gold',c.gold):'Não dá para fortalecer este espaço agora'); render(); return {stop:r.reason||'no'}; }
  /* o resultado já está no save (pedras e ouro gastos; +N se acertou): grava agora, mesmo que o jogador saia antes do fim da animação */
  if(r.success) statsChanged(); else { save(); hud(); }
  if(hook) hook.tried(r);
  snd('ui_tap'); clearTimeout(XF.t1); clearTimeout(XF.t2); XF.busy=true; XF.prev=null; XF.fx=null; render();
  XF.t1=setTimeout(()=>{ XF.busy=false; const more=hook?hook.after():false;
    if(r.success){ snd('claim'); vib(40); const nt=fTier(r.lv);
      fFire('ok','+'+r.lv+'!',sl==='weapon'&&nt!==t0?'Nova aura: '+fAuras()[nt].name:fStatName(sl)+' do espaço +'+fPct(FD.bonus[r.lv])+'%'); }
    else { snd('ui_tap'); fFire('fail'); }
    if(more){ clearTimeout(XF.t3); XF.t3=setTimeout(fAutoStep,550); } },hook?450:700);   /* automática: martelo mais curto e 0,55 s de resultado antes do próximo passo */
  return {r};
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

Panels.add('forge',{title:'Forja',parent:'gear',render:scrForge,click:fClick,
  tick(){ if(XF.busy||XF.fx||(XF.auto&&XF.auto.run)) return; const el=document.getElementById('f_stones');
    if(el){ let t=''; try{ t=kf(fStones()); }catch(e){ return; } if(el.textContent!==t) el.textContent=t; }
    if(XF.sig&&fSig()!==XF.sig&&fOn()) render(); },
  busy(){ return XF.busy||!!XF.fx; },
  onOpen(o){ fStop(); XF.anim=true; XF.cardIn=true; XF.prev=null; XF.toast='';
    if(o&&(o.mode==='level'||o.mode==='forge')) XF.mode=o.mode; if(o&&o.slot&&fSlotOk(o.slot)) XF.slot=o.slot; },
  onClose(){ fStop(); XF.prev=null; XF.toast=''; } });

/* SELO DE NOVIDADE da entrada "Forja" no Equipamento (decisão do PO): há algo para fazer na forja? = a forja está liberada e pelo menos um
   espaço aberto pode ser fortalecido agora (Sys.forge.canTry: tem pedra, tem ouro, não está no teto da era nem no máximo). Sem conta própria.
   Quem desenha o ponto é o cabeçalho da mochila (js/screens.js), como já faz com o progAlert() do Progresso. */
function forgeAlert(){ try{ if(!(window.Sys&&Sys.forge&&Sys.host)||fLocked()) return false; const lv=plv();
    return Sys.forge.DATA.slots.some(sl=>Sys.stats.slotOpen(sl,lv)&&Sys.forge.canTry(S,Sys.host,sl).ok); }catch(e){ return false; } }
