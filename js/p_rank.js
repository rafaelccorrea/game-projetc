'use strict';
/* ================= 12 RANKING SEMANAL — tela nova, nasce DESLIGADA (PANEL_ON.rank) =================
   Protótipo: docs/proto/Ranking.dc.html (v2 animada: relógio de areia, pódio animado). NENHUMA regra nem número aqui:
   ranking de Força (maior FC da semana) e de Arena (pontos): Sys.arena.ranking(S, host, 'fc'|'arena'); fecha em: Sys.arena.weekInfo(S, host).msLeft;
   prêmios por faixa: Sys.arena.DATA.rewards; meu nível: Sys.level.level(S); meu andar: Sys.tower.ensure(S).best; meu passe: Sys.pass.tier(S).
   Sem emoji: moeda/gema vêm de assets/ui; coroa, relógio e setas são SVG/CSS.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (para não mostrar dado falso):
   - Nível, Torre e Passe não têm ranking sem servidor: a aba mostra SÓ o valor real do jogador e o aviso "este ranking abre com o online";
   - nos rankings de Força e Arena, os outros jogadores hoje são SIMULADOS pelo módulo (bots): a tela diz isso, sempre, e não inventa Nv./era/VIP deles;
   - todos usam o Kael padrão no pódio e na lista (o protótipo avisa "prévia: todos com a skin padrão");
   - os prêmios são os do módulo (gemas, pedras, item, fragmentos) e valem quando o ranking online abrir (aviso fixo).
   Pedido Q-5 (reports/pedidos-entre-agentes.md): carregar este script e ligar PANEL_ON.rank (a Torre já abre o ranking quando Panels.on('rank')). */
const XRK={tab:0,page:0,sec:-1};
const R_MINH=620, R_PER=5;
/* FC na escala visual (Sys.fc.viewText): vale para a FC do jogador, dos bots e para a diferença de FC */
const rkFc=v=>{ try{ if(window.Sys&&Sys.fc&&typeof Sys.fc.viewText==='function') return String(Sys.fc.viewText(v)); }catch(e){} return rkFmt(v); };
const R_TABS=[{k:'fc',label:'Força',hint:'Maior FC da semana',fmt:v=>'FC '+rkFc(v)},{k:'lvl',label:'Nível',hint:'Seu nível de jogador',fmt:v=>'Nv. '+v},{k:'tower',label:'Torre',hint:'Andar mais alto vencido',fmt:v=>'Andar '+v},{k:'arena',label:'Arena',hint:'Pontos de arena da semana',fmt:v=>rkN(v)+' pts'},{k:'pass',label:'Passe',hint:'Nível do Passe da temporada',fmt:v=>'Passe '+v}];
const R_CSS=`.pr-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:prk 1s steps(12,jump-none) infinite}
@keyframes prk{from{background-position:0 0}to{background-position:100% 0}}
.pr-aura{background-size:1600% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:pra 1.333s steps(16,jump-none) infinite}
@keyframes pra{from{background-position:0 0}to{background-position:100% 0}}
.pr-up{animation:pru .6s cubic-bezier(.2,1.2,.4,1) both}
@keyframes pru{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}
.pr-row{animation:prr .3s ease-out both}
@keyframes prr{from{transform:translateX(-10px);opacity:0}to{transform:none;opacity:1}}
.pr-spark{position:absolute;width:4px;height:4px;border-radius:50%;background:#ffe07a;animation:prs 2.2s ease-in-out infinite}
@keyframes prs{0%,100%{opacity:.15}50%{opacity:1}}
.pr-sand{animation:prh 2s ease-in-out infinite}
@keyframes prh{0%,100%{opacity:.55}50%{opacity:1}}
.pr-btn{border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;border-radius:12px;width:46px;height:46px;padding:0;display:flex;align-items:center;justify-content:center}
.pr-btn[disabled]{opacity:.35}
@media (prefers-reduced-motion:reduce){.pr-kid,.pr-aura,.pr-up,.pr-row,.pr-spark,.pr-sand{animation:none}}`;
const rkOk=()=>!!(window.Sys&&Sys.arena&&Sys.arena.ranking&&Sys.arena.weekInfo);
const rkEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function rkFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
/* retrato do PRÓPRIO jogador (js/avatar.js: fase, herói e camadas de cabeça); bots e reserva mantêm o Kael parado */
const rkAv=(sz,fb)=>typeof avatarTag==='function'?avatarTag(sz,'position:absolute;left:0;top:0','Seu retrato'):fb;
const rkN=v=>Math.round(v||0).toLocaleString('pt-BR');
const rkIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||14)+'px;height:'+(z||14)+'px;vertical-align:-2px;object-fit:contain">';
function rkInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pr_css')) return; const st=document.createElement('style'); st.id='pr_css'; st.textContent=R_CSS; document.head.appendChild(st); }
const rkToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const rkSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
function rkClock(ms){ const s=Math.max(0,Math.floor(ms/1000)), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), x=s%60, p=n=>String(n).padStart(2,'0');
  return {head:(d?d+'d ':'')+p(h)+'h '+p(m)+'min ', sec:p(x)+'s'}; }
/* o que cada aba sabe de verdade: lista (só Força/Arena, hoje com jogadores simulados) e o valor do próprio jogador */
function rkData(){ const T=R_TABS[XRK.tab], k=T.k, me={};
  try{ me.lvl=Sys.level&&Sys.level.level?Sys.level.level(S):null; }catch(e){ me.lvl=null; }
  try{ me.tower=Sys.tower&&Sys.tower.ensure?Sys.tower.ensure(S,Sys.host).best:null; }catch(e){ me.tower=null; }
  try{ me.pass=Sys.pass&&Sys.pass.tier?Sys.pass.tier(S):null; }catch(e){ me.pass=null; }
  if(k==='fc'||k==='arena'){ let r=null; try{ r=Sys.arena.ranking(S,Sys.host,k); }catch(e){} if(r&&r.list) return {T,list:r.list,me:r.me,bots:!!r.bots,own:r.me.value}; }
  return {T,list:null,me:null,bots:false,own:me[k]}; }
function rkAura(i){ return ['aura13','aura10','aura7'][i]||'aura7'; }
function rkStep(p,pos,x,h,aura,delay){ const stepY=212-h, nm=rkEsc(p.me?'Você':p.name);
  return `<div class="pr-up" style="animation-delay:${delay}s">
    <div aria-hidden="true" style="position:absolute;left:${x+12}px;top:${stepY+6-110}px;width:88px;height:110px"><div class="pr-aura" style="position:absolute;inset:0;background-image:url(assets/anim/aura/${aura}.png)"></div></div>
    <div role="img" aria-label="${nm}, posição ${pos}" style="position:absolute;left:${x+12}px;top:${stepY+2-84}px;width:88px;height:88px"><div class="pr-kid" style="position:absolute;inset:0"></div></div>
    <div style="position:absolute;left:${x}px;top:${stepY}px;width:112px;height:${h}px;border-radius:10px 10px 0 0;background:${pos===1?'linear-gradient(180deg,#ffe07a,#c77a12)':pos===2?'linear-gradient(180deg,#d8dbe3,#8a8f9c)':'linear-gradient(180deg,#e0a46a,#8a4f22)'};border:2px solid ${pos===1?'#fff0a8':pos===2?'#f6f7fa':'#ffd2a3'};border-bottom:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;padding-top:4px;color:#2a1403">
      <span style="font-family:'Lilita One',sans-serif;font-size:20px;line-height:1.2;text-shadow:0 1px 0 rgba(255,255,255,.4)">${pos}</span>
      <span style="font-size:11px;font-weight:900;max-width:104px;line-height:1.15;overflow-wrap:anywhere;text-align:center">${nm}</span>
      <span style="font-family:'Lilita One',sans-serif;font-size:14px;color:#3a1a06">${rkEsc(R_TABS[XRK.tab].fmt(p.value))}</span></div></div>`; }
function rkPodium(D,K){ K=K||1; const L=D.list, p1=L[0], p2=L[1], p3=L[2]; if(!p1||!p2||!p3) return '';
  return `<div style="position:relative;height:${Math.round(212*K)}px;flex:none;overflow:hidden;border-radius:16px;background:linear-gradient(180deg,rgba(58,40,16,.6),rgba(22,17,13,.2))"><div style="position:absolute;left:0;top:0;width:390px;height:212px;transform:scale(${K});transform-origin:0 0">
    <span class="pr-spark" style="left:40px;top:30px"></span><span class="pr-spark" style="left:340px;top:46px;animation-delay:.6s"></span><span class="pr-spark" style="left:190px;top:12px;animation-delay:1.1s"></span>
    ${rkStep(p2,2,10,82,rkAura(1),.15)}${rkStep(p1,1,139,100,rkAura(0),0)}${rkStep(p3,3,268,70,rkAura(2),.3)}
    <svg width="34" height="24" viewBox="0 0 24 17" aria-hidden="true" style="position:absolute;left:178px;top:12px"><path d="M2 15 L3.5 4 L8.5 9 L12 1 L15.5 9 L20.5 4 L22 15 Z" fill="#ffc94a" stroke="#6a3a08" stroke-width="1.3" stroke-linejoin="round"></path><circle cx="12" cy="10" r="1.6" fill="#ff5a5a"></circle></svg>
    <span style="position:absolute;left:8px;right:8px;top:2px;z-index:3;font-size:10.5px;font-weight:900;color:#ffe07a;text-align:center;background:rgba(14,10,7,.86);border:1px solid #6a5440;border-radius:8px;padding:2px 6px">${D.bots?'Prévia com jogadores simulados e Kael padrão para todos':'Kael padrão para todos'}</span></div></div>`; }
function rkPrizes(){ const A=Sys.arena&&Sys.arena.DATA&&Sys.arena.DATA.rewards; if(!Array.isArray(A)||!A.length) return '';
  const cell=r=>{ const lab=r.from===r.to?String(r.from):(r.to>=1e6?r.from+'+':r.from+'–'+r.to);
    const l1=r.gems?rkIc('gem')+' '+r.gems:(r.stones?r.stones+' pedras':'—'), ex=[]; if(r.item!=null) ex.push('item '+((()=>{ try{ return RAR[r.item].n; }catch(e){ return ''; } })())); if(r.gems&&r.stones) ex.push(r.stones+' pedras'); if(r.prism) ex.push(r.prism+' prism.');
    return `<div style="flex:1;min-width:0;border-radius:10px;background:#1d1611;border:2px solid ${r.from===1?'#ffc94a':'#4a3a2b'};display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15;padding:2px"><span style="font-size:10px;font-weight:900;color:${r.from===1?'#ffc94a':'#c9b9a2'}">Top ${lab}</span><span style="font-size:11px;font-weight:900">${l1}</span><span style="font-size:9px;font-weight:800;color:#c9b9a2;text-align:center;overflow:hidden;max-height:22px">${rkEsc(ex.join(' · '))}</span></div>`; };
  return `<div style="flex:none;display:flex;flex-direction:column;gap:3px"><div role="group" aria-label="Prêmios por posição" style="height:56px;display:flex;gap:3px">${A.map(cell).join('')}</div><span style="font-size:10px;font-weight:800;color:#ffd27a;text-align:center">Os prêmios valem quando o ranking online abrir</span></div>`; }
function rkRow(r,i){ const mine=!!r.me;
  return `<div class="pr-row" style="animation-delay:${i*.04}s;height:46px;flex:none;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:12px;background:${mine?'#3a2c1f':'#1d1611'};border:${mine?'2px solid #ffc94a':'1px solid #4a3a2b'};box-sizing:border-box">
    <span style="width:30px;font-family:'Lilita One',sans-serif;font-size:16px;color:#c9b9a2;text-align:center">${r.rank}</span>
    <span aria-hidden="true" style="flex:none;width:34px;height:34px;border-radius:50%;overflow:hidden;position:relative;background:#2a1f16;border:2px solid ${mine?'#ffc94a':'#6b5843'};box-sizing:border-box">${mine?rkAv(30,'<span class="pr-kid" style="position:absolute;left:-13px;top:-3px;width:58px;height:58px;display:block"></span>'):'<span class="pr-kid" style="position:absolute;left:-13px;top:-3px;width:58px;height:58px;display:block"></span>'}</span>
    <span style="flex:1;min-width:0;font-size:14px;font-weight:900;line-height:1.15;overflow-wrap:anywhere">${rkEsc(mine?'Você · Kael':r.name)}</span>
    <span style="font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a;white-space:nowrap">${rkEsc(R_TABS[XRK.tab].fmt(r.value))}</span></div>`; }
function rkGap(D){ if(!D.list) return 'Seu valor real; a colocação aparece com o online'; const me=D.me, above=D.list[me.rank-2];
  if(!above) return 'Você está em 1º lugar'; return 'Faltam '+rkEsc(R_TABS[XRK.tab].fmt(Math.max(0,above.value-me.value)).replace(/^FC |^Andar |^Passe |^Nv\. /,''))+' para o '+(me.rank-1)+'º lugar'; }
function scrRank(){
  rkInject(); const d=xDims(R_MINH);
  if(!rkOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Ranking indisponível agora.</div>`); return; }
  const D=rkData(), T=D.T, wk=Sys.arena.weekInfo(S,Sys.host), ck=rkClock(wk.msLeft); XRK.sec=ck.sec;
  const tabs=R_TABS.map((t,i)=>`<button role="tab" aria-selected="${i===XRK.tab}" data-x="tab" data-i="${i}" style="flex:1;min-width:0;height:46px;border-radius:11px;border:2px solid ${i===XRK.tab?'#ffc94a':'#4a3a2b'};background:${i===XRK.tab?'#4a3214':'#2a1f16'};color:${i===XRK.tab?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:14px;padding:0">${t.label}</button>`).join('');
  let body='', pageBar='';
  if(D.list){ const rest=D.list.slice(3,50), pages=Math.max(1,Math.ceil(rest.length/R_PER)); XRK.page=Math.max(0,Math.min(XRK.page,pages-1));
    body=rkPodium(D,d.real?Math.max(.55,Math.min(1.4,((d.Wb||390)-4)/390)):1)+rkPrizes()+`<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:4px">${rest.slice(XRK.page*R_PER,XRK.page*R_PER+R_PER).map(rkRow).join('')}</div>`;
    pageBar=`<div style="flex:none;height:46px;display:flex;align-items:center;justify-content:center;gap:10px"><button data-x="prev" class="pr-btn" aria-label="Página anterior" ${XRK.page<=0?'disabled':''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg></button><span style="min-width:130px;text-align:center;font-size:12px;font-weight:900;color:#c9b9a2">Posições ${4+XRK.page*R_PER}–${Math.min(50,3+XRK.page*R_PER+R_PER)} · pág. ${XRK.page+1}/${pages}</span><button data-x="next" class="pr-btn" aria-label="Próxima página" ${XRK.page>=pages-1?'disabled':''}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"></polyline></svg></button></div>`;
  } else body=`<div role="note" style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;text-align:center;border-radius:16px;background:#1d1611;border:2px dashed #8a6a3a"><span style="font-family:'Lilita One',sans-serif;font-size:20px">Ranking de ${T.label}</span><span style="font-size:14px;font-weight:800;color:#c9b9a2">Este ranking só existe com o servidor online. Os outros jogadores aparecem quando ele abrir.</span><span style="font-family:'Lilita One',sans-serif;font-size:22px;color:#ffe07a">${D.own==null?'—':rkEsc(T.fmt(D.own))}</span><span style="font-size:12px;font-weight:800;color:#ffd27a">Seu valor atual</span></div>`+rkPrizes();
  const rk=D.me?D.me.rank:null;
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px 2px 6px">
    <div style="flex:none;height:44px;display:flex;align-items:center;gap:8px"><span style="flex:1;min-width:0;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.15">${rkEsc(T.hint)}</span>
      <span role="timer" aria-label="Fecha em ${rkEsc(ck.head+ck.sec)}" style="display:flex;align-items:center;gap:6px"><svg class="pr-sand" width="18" height="24" viewBox="0 0 12 16" aria-hidden="true"><path d="M1 1 H11 M1 15 H11" stroke="#c77a12" stroke-width="1.6" stroke-linecap="round"></path><path d="M2.2 1.5 C2.2 5.5 5.2 6.6 5.6 8 C5.2 9.4 2.2 10.5 2.2 14.5 H9.8 C9.8 10.5 6.8 9.4 6.4 8 C6.8 6.6 9.8 5.5 9.8 1.5 Z" fill="rgba(255,240,200,.12)" stroke="#ffe07a" stroke-width=".9"></path><path d="M3.4 3.2 H8.6 C8 5.6 6.4 6.6 6 7.4 C5.6 6.6 4 5.6 3.4 3.2 Z" fill="#ffc94a"></path></svg><span style="display:flex;flex-direction:column;align-items:flex-end"><span style="font-size:10px;font-weight:800;color:#c9b9a2">Fecha em</span><span style="font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a;white-space:nowrap">${ck.head}<span id="pr_sec">${ck.sec}</span></span></span></span></div>
    <div role="tablist" aria-label="Tipos de ranking" style="flex:none;height:46px;display:flex;gap:4px">${tabs}</div>
    ${body}${pageBar}</div>
    <div style="flex:none;padding:6px 2px;padding-bottom:max(8px,env(safe-area-inset-bottom))"><button data-x="me" aria-label="Sua posição" style="width:100%;height:58px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:14px;background:linear-gradient(90deg,#4a3214,#2a1f16);border:2px solid #ffc94a;color:#f6ecdf;text-align:left;box-sizing:border-box"><span style="width:42px;font-family:'Lilita One',sans-serif;font-size:18px;color:#ffc94a;text-align:center">${rk?rk+'º':'—'}</span><span aria-hidden="true" style="flex:none;width:38px;height:38px;border-radius:50%;overflow:hidden;position:relative;background:#2a1f16;border:2px solid #ffc94a;box-sizing:border-box">${rkAv(34,'<span class="pr-kid" style="position:absolute;left:-14px;top:-4px;width:64px;height:64px;display:block"></span>')}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:14px;font-weight:900">Você · Kael</span><span style="font-size:12px;font-weight:900;color:#7ef08a">${rkGap(D)}</span></span><span style="font-family:'Lilita One',sans-serif;font-size:16px;color:#ffe07a;white-space:nowrap">${D.own==null?'—':rkEsc(T.fmt(D.own))}</span></button></div>`);
}
function rkClick(b){
  const a=b.dataset.x; if(!rkOk()) return;
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i>=0&&i<R_TABS.length&&i!==XRK.tab){ XRK.tab=i; XRK.page=0; rkSnd('ui_tap'); render(); } return; }
  if(a==='prev'||a==='next'){ XRK.page=Math.max(0,XRK.page+(a==='next'?1:-1)); rkSnd('ui_tap'); render(); return; }
  if(a==='me'){ rkSnd('ui_tap'); const D=rkData(); if(!D.list){ rkToast('A sua colocação aparece quando o ranking online abrir'); return; }
    const r=D.me.rank; if(r<=3){ rkToast('Você está no pódio, em '+r+'º lugar'); return; } if(r>50){ rkToast('Você está em '+r+'º lugar'); return; } XRK.page=Math.floor((r-4)/R_PER); render(); }
}
Panels.add('rank',{title:'Ranking semanal',render:scrRank,click:rkClick,
  tick(){ if(!rkOk()) return; try{ const ck=rkClock(Sys.arena.weekInfo(S,Sys.host).msLeft); if(ck.sec!==XRK.sec){ XRK.sec=ck.sec; const el=document.getElementById('pr_sec'); if(el) el.textContent=ck.sec; } }catch(e){} },
  onOpen(){ XRK.page=0; } });
