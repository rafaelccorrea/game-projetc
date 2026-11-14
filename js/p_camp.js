'use strict';
/* ================= ACAMPAMENTO DAS ERAS — tela nova, nasce DESLIGADA (PANEL_ON.camp) =================
   Protótipo: docs/proto/v2/Acampamento.html. Decisão do PO: abre no nível 20, só pelo Menu; o que as tendas guardam também volta no "Bem-vindo de volta".
   ESQUELETO DA SISTEMAS (docs/LIGACOES_RECOMPENSAS.md, seção 7): só as LIGAÇÕES com o módulo, desenho mínimo. O Engenheiro troca o desenho pelo do protótipo.
   NENHUMA regra nem número aqui. Tudo vem do js/sys/camp.js (Sys.camp):
   - modelo da tela: view(S, host) → {on, locked, needLevel, capHours, text, idlePets, tents:[{id,name,res,lv,maxLv,perHour,stored,cap,full,pct,pets,slots,upgrade}]};
   - Coletar tudo: collect(S, host) → {ok, reason, got:{gold, forge, practice}} (credita sozinho);
   - pet na tenda: assign(S, host, tenda, pet) / unassign(S, host, pet) → {ok, reason};
   - Melhorar: upgrade(S, host, tenda) → {ok, reason:'fixed'|'max'|'money'|..., cost, lv}. A Tenda do Ouro NÃO tem Melhorar (reason 'fixed', decisão do PO).
   Toques por data-x; a lista fica em def.actions. */
(function(){
if(!('camp' in PANEL_ON)) PANEL_ON.camp=false;
const ACTIONS=['collect','up','pet','unpet','back'];
const X={msg:'',sel:''};
const K=()=>{ const k=window.Sys&&Sys.camp; return k&&k.DATA&&k.DATA.on===true&&typeof k.view==='function'?k:null; };
const host=()=>Sys.host;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const nf=v=>{ try{ return typeof kf==='function'?kf(v):String(v); }catch(e){ return String(v); } };
const RES={gold:'moedas',forge:'pedras de forja',practice:'pedras de treino'};
const WHY={off:'O Acampamento está fechado agora.',locked:'O Acampamento abre no nível 20.',pet:'Esse pet não pode trabalhar (é o principal ou não é seu).',busy:'Esse pet já está em outra tenda.',full:'A tenda já tem 2 pets.',
  fixed:'A Tenda do Ouro não tem melhoria.',max:'A tenda já está no nível máximo.',money:'Falta ouro para melhorar.',empty:'As tendas ainda não juntaram nada.'};
const petName=id=>{ try{ const d=Sys.pet.DATA.pets.find(p=>p.id===id); return d?d.name||id:id; }catch(e){ return id; } };
function tentHtml(t,idle){ const u=t.upgrade||{}, can=u.ok===true;
  return `<div style="flex:none;padding:10px;border-radius:14px;background:#1d1611;border:2px solid ${t.full?'#ffc94a':'#3a2c1f'};display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;justify-content:space-between;font-weight:900"><span>${esc(t.name)} · Nv ${t.lv}</span><span>${nf(t.stored)} / ${nf(t.cap)} ${RES[t.res]||''}</span></div>
    <div style="height:8px;border-radius:4px;background:#2f241a"><i style="display:block;height:100%;width:${t.pct}%;border-radius:4px;background:#ffc94a"></i></div>
    <small style="color:#c9b9a2">${t.perHour} por hora${t.full?' · CHEIA':''}</small>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${t.pets.map(p=>`<button data-x="unpet" data-p="${esc(p)}" class="pr2-btn">${esc(petName(p))} ×</button>`).join('')}
      ${t.pets.length<t.slots&&idle.length?idle.map(p=>`<button data-x="pet" data-t="${esc(t.id)}" data-p="${esc(p)}" class="pr2-btn ghost">+ ${esc(petName(p))}</button>`).join(''):''}</div>
    ${u.reason==='fixed'?'':`<button data-x="up" data-t="${esc(t.id)}" aria-disabled="${!can}" class="pr2-btn">${u.reason==='max'?'Nível máximo':'Melhorar · '+nf(u.cost||0)+' de ouro'}</button>`}</div>`; }
function render(){ const d=xDims(560), k=K();
  if(!k){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;font-weight:800;color:#c9b9a2">${WHY.off}</div>`); return; }
  let v=null; try{ v=k.view(S,host()); }catch(e){ v=null; }
  if(!v||v.locked){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;font-weight:800;color:#c9b9a2">${WHY.locked}</div>`); return; }
  const any=v.tents.some(t=>t.stored>0);
  V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;overflow-x:hidden;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:6px 4px"><p style="margin:0;color:#c9b9a2;font-weight:700">${esc(v.text)}</p>
    ${v.tents.map(t=>tentHtml(t,v.idlePets)).join('')}${X.msg?`<div role="status" style="font-weight:800;color:#ffc94a">${esc(X.msg)}</div>`:''}</div>
    <div style="flex:none;display:flex;gap:8px;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="back" class="pr2-btn ghost" style="flex:1;min-height:52px">Voltar</button><button data-x="collect" aria-disabled="${!any}" class="pr2-btn" style="flex:2;min-height:52px">Coletar tudo</button></div>`); }
function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{}, k=K(); if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; } if(!k) return; let r=null;
  try{ if(a==='collect') r=k.collect(S,host()); else if(a==='up') r=k.upgrade(S,host(),ds.t); else if(a==='pet') r=k.assign(S,host(),ds.t,ds.p); else if(a==='unpet') r=k.unassign(S,host(),ds.p); else return; }catch(e){ r=null; }
  if(r&&r.ok){ sfx('claim'); if(a==='collect'){ const g=r.got||{}; X.msg='Coletou: '+['gold','forge','practice'].filter(x=>g[x]>0).map(x=>'+'+nf(g[x])+' '+RES[x]).join(' · '); } else X.msg=a==='up'?'Tenda no nível '+r.lv:''; try{ if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){} }
  else { sfx('ui_tap'); X.msg=WHY[r&&r.reason]||'Não deu agora.'; }
  render(); }
const def=Panels.add('camp',{title:'Acampamento',render:render,click:click,actions:ACTIONS,tick(){ try{ if(typeof view==='undefined'||view!=='camp') return; const k=K(); const s=k?k.view(S,host()).tents.map(t=>t.stored+'/'+t.lv+'/'+t.pets.length).join('|'):'off'; if(s!==X.sig){ X.sig=s; render(); } }catch(e){} },onOpen(){ X.msg=''; }});
window.PCamp={X:X,actions:ACTIONS,def:def};
})();
