'use strict';
/* ================= 34 MISSÕES — tela nova, nasce DESLIGADA (PANEL_ON.missions) =================
   Protótipo: docs/proto/Missoes.dc.html. FONTE ÚNICA: os mesmos dados que o jogo já usa; a tela não cria regra, contador nem prêmio.
   Diárias, Semanais e o bônus das diárias: Sys.pass.list(S, host) e Sys.pass.claimMission(S, host, id | 'bonus'). Guia: Sys.guide (current / claim / list; atrás de chave:
   Sys.guide.DATA.on). Renovação: Sys.instances.status().resetMs (diárias) e Sys.clock.weekStart (semanais).
   Sem emoji: gema = assets/ui/gem.png; ícones de missão são SVG de traço (os do protótipo).
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - "Atividade de hoje: pts/100" e os baús de marcos NÃO existem nos módulos: não aparecem (nada de contador próprio);
   - a aba "Conquistas" não tem módulo de dados: não aparece (as conquistas reais são Práticas e Títulos, tela própria);
   - o prêmio mostrado é o que o módulo dá: gemas e XP do Passe (nas diárias/semanais); no Guia, o pacote da missão;
   - a aba Guia só aparece quando Sys.guide.DATA.on está ligada; as missões em ordem seguem a fila do módulo (só a da vez resgata).
   Pedido Q-6 (reports/pedidos-entre-agentes.md): carregar este script, ligar PANEL_ON.missions, e no Passe trocar a aba de missões por um botão "Missões" que abre esta tela. */
const XMI={tab:'daily',min:'',flash:''};
/* CHAVES (PO): os dois blocos do protótipo que dependem de módulo novo da sessão de Sistemas. DESLIGADAS: nada aparece (sem espaço vazio nem 'em breve').
   Ligar = trocar para true E fazer mActivity()/mAch() lerem a API de Sistemas. Contrato que a tela espera (ajustar aqui quando a API chegar):
   mActivity() → {pts, max, marks:[{id, at, gems, gold, claimed}], claim(id) → {ok, txt}} · mAch() → [{id, txt, cur, need, rw, k, claimed, claim() → {ok, txt}}] */
window.P_MISSIONS=window.P_MISSIONS||{activity:false,achievements:false};
/* hoje não há módulo: devolvem null. Quando a API de Sistemas chegar, defina window.P_MISSIONS.readActivity / readAch (ou troque o corpo daqui). */
const mActivity=()=>{ const p=window.P_MISSIONS; return p&&typeof p.readActivity==='function'?p.readActivity():null; };
const mAch=()=>{ const p=window.P_MISSIONS; return p&&typeof p.readAch==='function'?p.readAch():null; };
const mActOn=()=>{ try{ return !!(window.P_MISSIONS&&P_MISSIONS.activity&&mActivity()); }catch(e){ return false; } };
const mAchOn=()=>{ try{ return !!(window.P_MISSIONS&&P_MISSIONS.achievements&&mAch()); }catch(e){ return false; } };
const M_MINH=560;
const M_IC={sword:'M14.5 17.5 L3 6 V3 H6 L17.5 14.5 M13 19 L19 13 M16 16 L20 20 M19 21 L21 19',skull:'M12 3 C7 3 4 6.5 4 10.5 C4 13 5.5 14.5 7 15.5 V19 H17 V15.5 C18.5 14.5 20 13 20 10.5 C20 6.5 17 3 12 3 Z M9 11 H9.01 M15 11 H15.01 M10 19 V21 M14 19 V21',star:'M12 2 L14.9 8.6 L22 9.3 L16.6 14 L18.2 21 L12 17.3 L5.8 21 L7.4 14 L2 9.3 L9.1 8.6 Z',hammer:'M15 12 L6 21 L3 18 L12 9 M14 4 L20 10 M11 7 L17 1 L23 7 L17 13',flag:'M5 21 V4 M5 4 H17 L14.5 8 L17 12 H5',bolt:'M13 2 L4 14 H11 L10 22 L20 9 H13 Z',gift:'M3 9 H21 V13 H3 Z M5 13 V21 H19 V13 M12 9 V21 M12 9 C9 9 7 7 8.5 5.5 C10 4 12 6 12 9 C12 6 14 4 15.5 5.5 C17 7 15 9 12 9',map:'M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 Z M9 3 V18 M15 6 V21',bag:'M6 7 H18 L20 21 H4 Z M9 7 V5 A3 3 0 0 1 15 5 V7',tower:'M6 21 V8 H18 V21 M6 8 V4 H8 V6 H11 V4 H13 V6 H16 V4 H18 V8 M10 21 V16 H14 V21'};
const M_BY={kill:['sword','#ff8a6a'],boss:['skull','#ff5a5a'],ult:['bolt','#8ff5ff'],chest:['gift','#ffc94a'],instance:['flag','#8ff5dc'],forge:['hammer','#ffc94a'],summon:['star','#b07cff'],upgrade:['hammer','#ffc94a']};
const M_GO={battle:'Batalha',gear:'Equipamento',forge:'Forja',summon:'Invocar',shop:'Loja',practice:'Práticas',pass:'Passe',tower:'Torre',instances:'Instâncias',inst:'Instâncias',pets:'Pets',pet:'Pets'};
const MI_CSS=`.pm-row{animation:pmr .3s ease-out both}
@keyframes pmr{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.pm-ready{box-shadow:0 0 0 2px #ffc94a,0 0 14px rgba(255,201,74,.45)}
.pm-btn{border:0;border-radius:12px;font-weight:900;font-size:14px;min-width:84px;min-height:46px;padding:0 10px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pm-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pm-btn.go{background:#33271d;color:#f6ecdf;border:2px solid #6b5843;box-shadow:none}
@media (prefers-reduced-motion:reduce){.pm-row{animation:none}}`;
const mOk=()=>!!(window.Sys&&Sys.pass&&Sys.pass.list&&Sys.pass.claimMission);
const mGuideOn=()=>!!(window.Sys&&Sys.guide&&Sys.guide.DATA&&Sys.guide.DATA.on&&Sys.guide.current);
const miEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function miFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
const mGem=z=>'<img src="assets/ui/gem.png" alt="" style="width:'+(z||16)+'px;height:'+(z||16)+'px;vertical-align:-3px;object-fit:contain">';
function miInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pm_css')) return; const st=document.createElement('style'); st.id='pm_css'; st.textContent=MI_CSS; document.head.appendChild(st); }
const miToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const mSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const mChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
function mLeft(kind){ try{ const now=(Sys.host&&Sys.host.now&&Sys.host.now())||Date.now(); let ms=0;
    if(kind==='weekly'&&Sys.clock&&Sys.clock.weekStart) ms=Sys.clock.weekStart(now)+7*86400000-now; else if(Sys.instances&&Sys.instances.status) ms=Sys.instances.status(S,Sys.host).resetMs; else return '';
    const s=Math.max(0,Math.floor(ms/1000)), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), p=n=>String(n).padStart(2,'0'); return (d?d+'d ':'')+p(h)+'h '+p(m)+'min'; }catch(e){ return ''; } }
function mGuideRw(r){ if(!r||typeof r!=='object') return ''; const a=[]; if(r.gems) a.push(mGem(14)+' '+r.gems); if(r.goldk) a.push('ouro ×'+r.goldk); if(r.stones||r.forge) a.push((r.stones||r.forge)+' pedras'); if(r.essence) a.push(r.essence+' Essência'); if(r.food) a.push(r.food+' ração'); return a.join(' · '); }
function mIcon(k,ready){ const q=M_BY[k]||['star','#c9b9a2']; return `<span aria-hidden="true" style="flex:none;width:44px;height:44px;border-radius:12px;background:#16110d;border:2px solid ${ready?'#ffc94a':'#4a3a2b'};display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="${q[1]}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${M_IC[q[0]]}"></path></svg></span>`; }
function mRow(i,o){ /* o: {k,txt,cur,need,rw,state:'ready'|'doing'|'done'|'wait',id,go} */
  const pc=Math.max(0,Math.min(100,Math.round(o.cur/Math.max(1,o.need)*100))), ready=o.state==='ready', done=o.state==='done';
  const act=ready?`<button data-x="claim" data-id="${miEsc(o.id)}" data-src="${o.src}" class="pm-btn">Resgatar</button>`:done?`<span style="flex:none;min-width:84px;text-align:center;font-size:13px;font-weight:900;color:#9ff0a8">Feito</span>`:o.state==='wait'?`<span style="flex:none;min-width:84px;text-align:center;font-size:12px;font-weight:900;color:#9c8d7a">Em ordem</span>`:(o.go?`<button data-x="go" data-g="${miEsc(o.go)}" class="pm-btn go" aria-label="Ir para ${miEsc(M_GO[o.go]||o.go)}">Ir</button>`:`<span style="flex:none;min-width:84px"></span>`);
  return `<div class="pm-row${ready?' pm-ready':''}" style="animation-delay:${i*.04}s;flex:none;min-height:68px;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:${done?'#1a1713':'#1d1611'};border:2px solid ${ready?'#ffc94a':'#4a3a2b'};box-sizing:border-box;opacity:${done||o.state==='wait'?.7:1}">
    ${mIcon(o.k,ready)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;line-height:1.15"><span style="font-size:14px;font-weight:900">${miEsc(o.txt)}</span>
      <span role="img" aria-label="${miEsc(o.txt)}: ${o.cur} de ${o.need}" style="position:relative;height:10px;border-radius:5px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${pc}%;background:${ready||done?'linear-gradient(90deg,#f2a826,#ffe07a)':'linear-gradient(90deg,#2fc9a8,#8ff5dc)'}"></span></span>
      <span style="display:flex;justify-content:space-between;gap:6px;font-size:11px;font-weight:800;color:#c9b9a2"><span>${miFmt(o.cur)}/${miFmt(o.need)}</span><span style="color:#ffe07a">${o.rw}</span></span></span>${act}</div>`; }
function mPassRows(L,src){ return L.map(m=>({id:m.id,k:(window.Sys&&Sys.pass&&Sys.pass.DATA?(Sys.pass.DATA.daily.concat(Sys.pass.DATA.weekly).find(x=>x.id===m.id)||{}).k:''),txt:m.txt,cur:m.p,need:m.need,src,
    rw:(m.gems?mGem(14)+' '+m.gems+' · ':'')+'+'+m.pxp+' XP do Passe',state:m.claimed?'done':m.done?'ready':'doing',go:'battle'}))
  .sort((a,b)=>({ready:0,doing:1,done:2})[a.state]-({ready:0,doing:1,done:2})[b.state]); }
function mActBlock(){ const A=mActivity(), pc=Math.max(0,Math.min(100,Math.round(A.pts/Math.max(1,A.max)*100)));
  const marks=A.marks.map(m=>{ const ready=!m.claimed&&A.pts>=m.at, rw=(m.gems?mGem(14)+' '+m.gems:'')+(m.gold?(m.gems?' ':'')+'ouro '+miFmt(m.gold):'');
    return `<button data-x="mark" data-id="${miEsc(m.id)}" class="pm-btn${ready?'':' go'}" aria-label="Baú de ${m.at} pontos${m.claimed?', resgatado':ready?', pronto':''}" style="flex:1;min-width:0;min-height:56px;padding:2px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:11px;${m.claimed?'opacity:.55':''}"><b style="font-size:12px">${m.at}</b><span>${rw||'—'}</span><span style="font-size:10px">${m.claimed?'Feito':ready?'Resgatar':'Bloqueado'}</span></button>`; }).join('');
  return `<div style="flex:none;padding:8px 10px;border-radius:14px;background:#1d1611;border:2px solid #4a3a2b;display:flex;flex-direction:column;gap:6px"><span style="font-size:13px;font-weight:900">Atividade de hoje: ${A.pts} / ${A.max}</span><span role="img" aria-label="Atividade ${A.pts} de ${A.max}" style="position:relative;height:12px;border-radius:6px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${pc}%;background:linear-gradient(90deg,#f2a826,#ffe07a)"></span></span><div style="display:flex;gap:6px">${marks}</div></div>`; }
function mGuideRows(){ const G=Sys.guide, cur=G.current(S), list=G.list(S).filter(x=>x.available); let seen=false;
  return list.map(x=>{ if(x.done) return {id:x.id,k:'',txt:x.text,cur:x.need,need:x.need,src:'guide',rw:'',state:'done'};
    if(cur&&x.id===cur.id&&!seen){ seen=true; return {id:x.id,k:'',txt:x.text,cur:cur.cur,need:cur.max,src:'guide',rw:mGuideRw(cur.reward),state:cur.done?'ready':'doing',go:cur.goto}; }
    return {id:x.id,k:'',txt:x.text,cur:0,need:x.need,src:'guide',rw:'',state:'wait'}; }); }
function scrMissions(){
  miInject(); const d=xDims(M_MINH);
  if(!mOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Missões indisponíveis agora.</div>`); return; }
  const P=Sys.pass.list(S,Sys.host), guide=mGuideOn(); if(XMI.tab==='guide'&&!guide) XMI.tab='daily';
  const nR=a=>a.filter(m=>m.done&&!m.claimed).length+0, dR=nR(P.daily)+(P.bonus.ready&&!P.bonus.claimed?1:0), wR=nR(P.weekly);
  let gR=0; try{ if(guide){ const c=Sys.guide.current(S); gR=c&&c.done?1:0; } }catch(e){}
  const ach=mAchOn(); if(XMI.tab==='ach'&&!ach) XMI.tab='daily'; const TABS=[['daily','Diárias',dR],['weekly','Semanais',wR]]; if(ach) TABS.push(['ach','Conquistas',mAch().filter(a=>!a.claimed&&a.cur>=a.need).length]); if(guide) TABS.push(['guide','Guia',gR]);
  const tabs=TABS.map(t=>{ const on=XMI.tab===t[0]; return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${t[0]}" style="position:relative;flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#4a3420':'#241b14'};color:${on?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:15px;padding:0">${t[1]}${t[2]?`<span aria-label="${t[2]} para resgatar" style="position:absolute;right:4px;top:-6px;min-width:20px;height:20px;border-radius:10px;background:#ff5a4e;color:#fff;font-size:12px;font-weight:900;line-height:20px;text-align:center;padding:0 4px;box-sizing:border-box">${t[2]}</span>`:''}</button>`; }).join('');
  let rows=[], head='', foot='', all=0;
  if(XMI.tab==='daily'){ rows=mPassRows(P.daily,'pass'); XMI.min=mLeft('daily'); head=XMI.min?`Renova em ${XMI.min}`:'Diárias'; all=dR;
    const b=P.bonus; rows.push({id:'bonus',k:'',txt:b.txt||'Complete as diárias',cur:P.daily.filter(m=>m.claimed).length,need:P.daily.length,src:'pass',rw:(b.gems?mGem(14)+' '+b.gems+' · ':'')+'+'+b.pxp+' XP do Passe',state:b.claimed?'done':b.ready?'ready':'doing'}); }
  else if(XMI.tab==='weekly'){ rows=mPassRows(P.weekly,'pass'); XMI.min=mLeft('weekly'); head=XMI.min?`Renova em ${XMI.min}`:'Semanais'; all=wR; }
  else if(XMI.tab==='ach'){ const L=mAch(); rows=L.map(a=>({id:a.id,k:a.k||'',txt:a.txt,cur:a.cur,need:a.need,src:'ach',rw:a.rw||'',state:a.claimed?'done':a.cur>=a.need?'ready':'doing',go:''})); head='Conquistas'; all=rows.filter(r=>r.state==='ready').length; }
  else { rows=mGuideRows(); head='Missão guia: uma por vez, em ordem'; all=gR; }
  const list=rows.length?rows.map((r,i)=>mRow(i,r)).join(''):`<div role="note" style="padding:20px;text-align:center;font-size:14px;font-weight:800;color:#c9b9a2">Nenhuma missão por aqui agora.</div>`;
  V.innerHTML=xWrap(d,'',`<div style="flex:none;padding:4px 2px 6px;display:flex;flex-direction:column;gap:6px"><div role="tablist" aria-label="Tipos de missão" style="display:flex;gap:6px">${tabs}</div><div style="min-height:20px;display:flex;align-items:center;justify-content:space-between;font-size:12px;font-weight:900;color:#c9b9a2"><span id="pm_head">${miEsc(head)}</span></div></div>
    <div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 8px">${XMI.tab==='daily'&&mActOn()?mActBlock():''}${list}</div>
    <div style="flex:none;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="all" class="pm-btn${all?'':' go'}" style="width:100%;min-height:54px;font-size:18px;font-family:'Lilita One',sans-serif">${XMI.tab==='guide'?'Resgatar a missão da vez':'Resgatar tudo'}${all?' ('+all+')':''}</button></div>`);
}
/* XP do JOGADOR: missão diária e bônus das diárias dão XP (Sys.level), como o resgate do Passe antigo (js/screens2.js 'mclaim'); a semanal não dá */
function mPlayerXp(id){ try{ const P=Sys.pass, daily=id==='bonus'||(P.DATA&&P.DATA.daily||[]).some(x=>x.id===id); if(!daily||!Sys.level) return null;
    const lr=id==='bonus'?Sys.level.onDailyBonus(S,Sys.host):Sys.level.onMission(S,Sys.host); if(lr&&lr.levels>0&&typeof onLevelUp==='function') onLevelUp(lr); return lr; }catch(e){ return null; } }
/* Grimório, fonte do dia: 1 de tinta por missão DIÁRIA (ou bônus das diárias) resgatada; a semanal não entra. Chamado UMA vez por resgate certo, junto do mPlayerXp */
function mGrim(id){ try{ if((id==='bonus'||((Sys.pass.DATA&&Sys.pass.DATA.daily)||[]).some(x=>x.id===id))&&typeof grimSrc==='function'){ const g=grimSrc('mission',{id:id},true); return g&&g.ok?g:null; } }catch(e){} return null; }
const mGrimTxt=(p,i)=>{ try{ return typeof grimSrcTxt==='function'?grimSrcTxt(p|0,i|0):''; }catch(e){ return ''; } };
function mClaim(src,id){ let r;
  if(src==='guide'){ r=Sys.guide.claim(S,Sys.host); if(!r||!r.ok) return null; return {txt:mGuideRw(r.got&&typeof r.got==='object'?r.got:null)||'Recompensa recebida'}; }
  if(src==='ach'){ const a=(mAch()||[]).find(x=>x.id===id); r=a&&a.claim?a.claim():null; return r&&r.ok?{txt:r.txt||'Recompensa recebida'}:null; }
  r=Sys.pass.claimMission(S,Sys.host,id); if(!r||!r.ok) return null; mPlayerXp(id); const gm=mGrim(id); return {txt:[r.gems?'+'+r.gems+' gemas':'', r.xp?'+'+r.xp+' XP do Passe':'', r.tierUp?'Passe subiu de nível':'', gm?mGrimTxt(gm.pages,gm.ink):''].filter(Boolean).join(' · ')}; }
function miClick(b){
  const a=b.dataset.x; if(!mOk()) return;
  if(a==='tab'){ XMI.tab=b.dataset.t; mSnd('ui_tap'); render(); return; }
  if(a==='claim'){ const r=mClaim(b.dataset.src,b.dataset.id); if(!r){ mSnd('ui_tap'); miToast('Esta missão ainda não pode ser resgatada'); render(); return; } mSnd('claim'); mChanged(); miToast(r.txt); render(); return; }
  if(a==='mark'){ const A=mActOn()?mActivity():null; const r=A&&A.claim?A.claim(b.dataset.id):null; if(!r||!r.ok){ mSnd('ui_tap'); miToast('Este baú ainda não pode ser resgatado'); return; } mSnd('claim'); mChanged(); miToast(r.txt||'Baú resgatado'); render(); return; }
  if(a==='all'){ mSnd('ui_tap'); let n=0, gems=0, xp=0, gInk=0; const tryOne=(src,id)=>{ const r=src==='guide'?null:Sys.pass.claimMission(S,Sys.host,id); if(r&&r.ok){ mPlayerXp(id); const gm=mGrim(id); if(gm) gInk+=gm.ink|0; n++; gems+=r.gems||0; xp+=r.xp||0; } };
    if(XMI.tab==='guide'){ const r=Sys.guide.claim(S,Sys.host); if(r&&r.ok) n++; }
    else if(XMI.tab==='ach'){ for(const a of (mAch()||[])) if(!a.claimed&&a.cur>=a.need&&a.claim){ const r=a.claim(); if(r&&r.ok) n++; } }
    else { const P=Sys.pass.list(S,Sys.host), L=XMI.tab==='daily'?P.daily:P.weekly; for(const m of L) if(m.done&&!m.claimed) tryOne('pass',m.id); if(XMI.tab==='daily'){ const B=Sys.pass.list(S,Sys.host).bonus; if(B.ready&&!B.claimed) tryOne('pass','bonus'); } }   /* o bônus só fica pronto depois de resgatar as diárias: relê */
    if(!n){ miToast('Nenhuma missão pronta para resgatar'); return; } mSnd('claim'); mChanged(); miToast(n+(n>1?' missões resgatadas':' missão resgatada')+(gems?' · +'+gems+' gemas':'')+(xp?' · +'+xp+' XP do Passe':'')+(gInk&&mGrimTxt(0,gInk)?' · '+mGrimTxt(0,gInk):'')); render(); return; }
  if(a==='go'){ mSnd('ui_tap'); const g=b.dataset.g;
    if(g==='battle'){ if(window.Screens&&Screens.close) Screens.close(); return; }
    if((g==='gear'||g==='summon'||g==='shop')&&typeof setView==='function'){ if(window.Screens&&Screens.close) Screens.close(); setView(g); return; }
    if(window.Screens&&Screens.reg&&Screens.reg[g]){ Screens.open(g); return; }
    miToast('Esta tela abre mais adiante'); return; }
}
Panels.add('missions',{title:'Missões',render:scrMissions,click:miClick,
  tick(){ if(!mOk()||(XMI.tab!=='daily'&&XMI.tab!=='weekly')) return; const m=mLeft(XMI.tab); if(m&&m!==XMI.min){ XMI.min=m; const el=document.getElementById('pm_head'); if(el) el.textContent='Renova em '+m; } },
  onOpen(o){ XMI.tab=(o&&o.tab)||'daily'; } });
