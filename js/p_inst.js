'use strict';
/* ================= 17 INSTÂNCIAS — tela nova, nasce DESLIGADA (PANEL_ON.inst) =================
   Protótipo: docs/proto/Instancias.dc.html. NENHUMA regra nem número aqui: tudo vem de Sys.instances (js/sys/instances.js):
   entradas por área (status().keys / max), renovação (status().resetMs), níveis (levelsUnlocked, levelInfo, isOpen, recommended), prêmio (rewardPreview),
   varrer (canSweep / sweep), entrar (canEnter / start). Desbloqueio: Sys.level.
   Sem emoji (regra do jogo): moeda e gema usam assets/ui, o resto é texto ou forma por CSS.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (que era "áreas por era" com FC recomendada e VIP):
   - o módulo tem 4 ÁREAS (Mina de Ouro, Arsenal, Chefe de Era, Caverna de Cristal) e, em cada uma, um seletor de era + dificuldade; a tela segue o módulo;
   - FC recomendada e "Sua FC" não existem no módulo: não aparecem; a trava é a fase da campanha ("Libera na fase N"), que o módulo informa;
   - VIP: a entrada extra já vem somada em status().max; a tela só mostra "entradas hoje x/y";
   - a batalha da instância (horda cronometrada) NÃO é desta tela: "Entrar" entrega a definição ao jogo por window.startInstanceRun(run). Se o jogo ainda não ligou isso,
     o toque explica e NÃO gasta nem abre entrada (pedido Q-4).
   Resultado: varrer mostra o painel "Vitória!/Varrido!" daqui; a batalha chama window.PInst.showResult(out) com o que Sys.instances.finish devolveu. */
const XI={sel:{},res:null,min:'',busy:false};
const I_MINH=560;
const I_CSS=`.pi-card{border-radius:16px;background:#1d1611;border:2px solid var(--c);box-sizing:border-box;padding:10px;display:flex;flex-direction:column;gap:6px}
.pi-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 12px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pi-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pi-btn.alt{background:linear-gradient(180deg,#8fd0ff,#3b8fd8);color:#06213a;box-shadow:0 4px 0 #1d4f80}
.pi-btn.off{background:#3a3128;color:#9c8d7a;box-shadow:0 4px 0 #1f1912}
.pi-arrow{flex:none;width:46px;height:46px;border-radius:12px;border:2px solid #4a3a2b;background:#2a1f16;color:#f6ecdf;font-size:24px;font-weight:900}
.pi-arrow[disabled]{opacity:.35}
.pi-pop{animation:pip .35s cubic-bezier(.2,1.4,.4,1) both}
@keyframes pip{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pi-pop{animation:none}}`;
const iOk=()=>!!(window.Sys&&Sys.instances&&Sys.instances.status&&Sys.instances.rewardPreview&&Sys.instances.levelInfo);
const iEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const iFmt=v=>{ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); };
const iIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||16)+'px;height:'+(z||16)+'px;vertical-align:-3px;object-fit:contain">';
function iInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pi_css')) return; const st=document.createElement('style'); st.id='pi_css'; st.textContent=I_CSS; document.head.appendChild(st); }
const iLock=()=>{ try{ const L=Sys.level; return L&&L.isUnlocked&&!L.isUnlocked(S,'instances')?(L.unlockLevel?L.unlockLevel('instances'):1):0; }catch(e){ return 0; } };
const iEra=e=>{ try{ return (ERAS[e]&&ERAS[e].n)||('Era '+(e+1)); }catch(x){ return 'Era '+(e+1); } };
const iRar=r=>{ try{ return RAR[r]?RAR[r].n:''; }catch(e){ return ''; } };
const iHm=ms=>{ const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000); return h+'h '+String(m).padStart(2,'0')+'min'; };
const iToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const iSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
/* linha de prêmio: só o que o módulo informa (rewardPreview) */
function iReward(p,rush){ if(!p) return '';
  const a=[]; if(p.gold) a.push((rush?'≈ ':'')+iIc('coin')+' '+iFmt(p.gold)); if(p.gems) a.push(iIc('gem')+' '+p.gems);
  if(p.items) a.push(p.items+(p.items>1?' itens':' item')+(p.minR?' '+iRar(p.minR)+'+':'')); if(p.forge) a.push(p.forge+' de forja'); if(p.food) a.push(p.food+' de ração');
  if(p.eggChance) a.push('ovo '+Math.round(p.eggChance*100)+'%'); return a.join(' · '); }
function iSel(t,nL,rec){ if(XI.sel[t]==null||XI.sel[t]>=nL) XI.sel[t]=Math.min(rec,nL-1); return XI.sel[t]; }
function iCard(t,st,nL,rec){
  const I=Sys.instances, T=I.DATA.types[t], L=iSel(t,nL,rec), inf=I.levelInfo(L), p=I.rewardPreview(t,L,Sys.host), open=I.isOpen(Sys.host,L), done=(st.best[t]!=null?st.best[t]:-1)>=L, sw=I.canSweep(S,Sys.host,t,L), k=st.keys[t]||0, rush=T.mode==='rush';
  const img=t==='boss'?'assets/enemies/era'+inf.era+'_boss.png':T.img;
  const go=!open?`<button data-x="lock" data-t="${t}" class="pi-btn off" style="flex:1">Libera na fase ${inf.stage}</button>`:`<button data-x="go" data-t="${t}" class="pi-btn${k<1?' off':''}" style="flex:1">Entrar · ${k}/${st.max}</button>`;
  return `<section class="pi-card" style="--c:${T.col}" aria-label="${iEsc(T.n)}">
    <div style="display:flex;align-items:center;gap:10px"><span style="flex:none;width:46px;height:46px;border-radius:12px;background:#2a1f16;border:2px solid ${T.col};box-sizing:border-box;display:flex;align-items:center;justify-content:center">${img?`<img src="${img}" alt="" style="width:36px;height:36px;object-fit:contain" onerror="this.style.display='none'">`:''}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><b style="font-family:'Lilita One',sans-serif;font-size:19px;color:#f6ecdf">${iEsc(T.n)}</b><span style="font-size:12px;font-weight:700;color:#c9b9a2">${iEsc(T.desc)}</span></span></div>
    <div style="display:flex;align-items:center;gap:8px"><button data-x="prev" data-t="${t}" class="pi-arrow" aria-label="Nível anterior" ${L<=0?'disabled':''}>‹</button>
      <span style="flex:1;min-width:0;text-align:center;line-height:1.15"><b style="font-size:15px;color:#f6ecdf">${iEsc(iEra(inf.era))}</b><br><span style="font-size:12px;font-weight:900;color:${open?'#ffc94a':'#9c8d7a'}">${iEsc(inf.diff.n)}${done?' · vencido':''}</span></span>
      <button data-x="next" data-t="${t}" class="pi-arrow" aria-label="Próximo nível" ${L>=nL-1?'disabled':''}>›</button></div>
    <div style="min-height:20px;text-align:center;font-size:13px;font-weight:900;color:#ffe07a" aria-label="Prêmio">${iReward(p,rush)||'—'}${rush?` <small style="color:#c9b9a2">(${I.DATA.sweepKills} abates)</small>`:''}</div>
    <div style="display:flex;gap:8px">${go}${done?`<button data-x="sweep" data-t="${t}" class="pi-btn alt${sw?'':' off'}" style="flex:none;min-width:96px">Varrer</button>`:''}</div></section>`; }
function iResult(r){ if(!r) return ''; const T=Sys.instances.DATA.types[r.type]||{n:'Instância'}, rw=r.reward||{}, P=[];
  if(rw.gold) P.push(iIc('coin',20)+' '+iFmt(rw.gold)); if(rw.gems) P.push(iIc('gem',20)+' '+rw.gems); if(rw.forge) P.push(rw.forge+' de forja'); if(rw.food) P.push(rw.food+' de ração'); if(rw.essence) P.push(rw.essence+' Essência da Era'); if(rw.xp) P.push(rw.xp+' XP');
  const its=(rw.items||[]).map(it=>`<span style="padding:4px 8px;border-radius:10px;background:#2a1f16;border:2px solid ${(()=>{ try{ return RAR[it.r].c; }catch(e){ return '#9aa0a6'; } })()};font-size:12px;font-weight:900">${it.slot==='weapon'?'Arma':'Armadura'} ${iEsc(iRar(it.r))}</span>`).join('');
  const egg=rw.egg>=0&&rw.hatched!==undefined?`<div style="font-size:14px;font-weight:900;color:#ffc94a">Ganhou um ovo ${iEsc(iRar(rw.egg))}!</div>`:'';
  return `<div role="dialog" aria-label="Resultado da instância" style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px">
    <div class="pi-pop" style="width:100%;max-width:340px;border-radius:18px;background:#1d1611;border:3px solid ${r.win?'#ffc94a':'#8a6a3a'};padding:16px;display:flex;flex-direction:column;align-items:center;gap:10px;box-sizing:border-box;text-align:center">
      <b style="font-family:'Lilita One',sans-serif;font-size:26px;color:${r.win?'#ffe07a':'#f6ecdf'}">${r.win?(r.sweep?'Varrido!':'Vitória!'):'Não foi dessa vez'}</b>
      <span style="font-size:14px;font-weight:800;color:#c9b9a2">${iEsc(T.n)}${r.kills?' · '+r.kills+' abates':''}</span>
      ${r.win?`<div style="display:flex;flex-wrap:wrap;gap:8px 12px;justify-content:center;font-size:15px;font-weight:900;color:#ffe07a">${P.join('<span aria-hidden="true">·</span>')||'—'}</div>${its?`<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${its}</div>`:''}${egg}`:'<span style="font-size:13px;font-weight:800;color:#c9b9a2">A entrada não foi gasta.</span>'}
      <button data-x="ok" class="pi-btn" style="width:100%">Coletar</button></div></div>`; }
function scrInst(){
  iInject(); const d=xDims(I_MINH);
  if(!iOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Instâncias indisponíveis agora.</div>`); return; }
  const lk=iLock();
  if(lk){ V.innerHTML=xWrap(d,'',`<div role="dialog" aria-label="Instâncias bloqueadas: libera no nível ${lk}" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center"><span style="width:40px;height:30px;border-radius:6px;background:#8a6a3a;border:3px solid #4a3a2b;box-sizing:border-box" aria-hidden="true"></span><span style="font-family:'Lilita One',sans-serif;font-size:24px">Instâncias</span><span style="font-size:15px;font-weight:800;color:#c9b9a2">Libera no nível ${lk}</span><button data-x="back" class="pi-btn" style="width:200px">Voltar</button></div>`); return; }
  const I=Sys.instances, st=I.status(S,Sys.host), nL=I.levelsUnlocked(Sys.host), rec=I.recommended(S,Sys.host); XI.min=iHm(st.resetMs);
  const cards=I.DATA.order.map(t=>iCard(t,st,nL,rec)).join('');
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:2px 2px 12px">
    <div style="flex:none;min-height:46px;display:flex;align-items:center;gap:10px;padding:0 12px;border-radius:14px;background:#2a1f16;border:2px solid #4a3a2b;box-sizing:border-box"><b style="font-family:'Lilita One',sans-serif;font-size:20px;color:#f6ecdf;flex:1">Entradas hoje: ${st.total}/${st.totalMax}</b><span style="font-size:12px;font-weight:900;color:#c9b9a2">Renova em ${XI.min}</span></div>
    ${cards}</div>${XI.res?iResult(XI.res):''}`);
}
function iClick(b,ev){
  const a=b.dataset.x, t=b.dataset.t;
  if(a==='back'){ iSnd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(!iOk()) return; const I=Sys.instances;
  if(a==='ok'){ iSnd('ui_tap'); XI.res=null; render(); return; }
  if(XI.res) return;
  if(a==='prev'||a==='next'){ const nL=I.levelsUnlocked(Sys.host); XI.sel[t]=Math.max(0,Math.min(nL-1,(XI.sel[t]||0)+(a==='next'?1:-1))); iSnd('ui_tap'); render(); return; }
  if(a==='lock'){ iSnd('ui_tap'); const inf=I.levelInfo(XI.sel[t]||0); iToast('Avance na campanha: libera na fase '+inf.stage); return; }
  if(a==='go'){ const L=XI.sel[t]||0, c=I.canEnter(S,Sys.host,t,L); iSnd('ui_tap');
    if(!c.ok){ iToast(c.reason==='chave'?'Sem entradas hoje nesta área. Renovam à meia-noite':c.reason==='bloqueado'?'Libera na fase '+c.unlockAt:'Não dá para entrar agora'); return; }
    if(typeof window.startInstanceRun!=='function'){ iToast('A batalha das instâncias ainda não está ligada'); return; }   /* não abre entrada que ninguém vai fechar */
    const r=I.start(S,Sys.host,t,L); if(!r||!r.ok){ iToast('Não dá para entrar agora'); return; }
    window.startInstanceRun(r.run); return; }
  if(a==='sweep'){ const L=XI.sel[t]||0; if(!I.canSweep(S,Sys.host,t,L)){ iSnd('ui_tap'); iToast((I.status(S,Sys.host).keys[t]||0)<1?'Sem entradas hoje nesta área. Renovam à meia-noite':'Vença este nível antes de varrer'); return; }
    const r=I.sweep(S,Sys.host,t,L); if(!r||!r.ok){ iToast('Não foi possível varrer agora'); return; }
    try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){}
    iSnd('claim'); XI.res=r; render(); }
}
/* a batalha chama isto com o retorno de Sys.instances.finish (vitória ou derrota) */
function iShow(out){ if(!out) return false; XI.res=out; try{ if(window.Panels&&Panels.open) Panels.open('inst'); else if(typeof render==='function') render(); }catch(e){} return true; }
window.PInst={showResult:iShow,state:XI};
Panels.add('inst',{title:'Instâncias',render:scrInst,click:iClick,
  tick(){ if(!iOk()||XI.res) return; try{ const m=iHm(Sys.instances.status(S,Sys.host).resetMs); if(m!==XI.min){ XI.min=m; render(); } }catch(e){} },
  busy(){ return !!XI.res; },
  onOpen(){ XI.sel={}; },
  onClose(){ XI.res=null; } });
