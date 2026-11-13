'use strict';
/* ================= 08 PASSE COM ROLAGEM — tela nova, nasce DESLIGADA (PANEL_ON.passv2) =================
   Protótipo: docs/proto/Passe.dc.html (aprovado + "rolagem contínua até o fim, sem páginas"). NENHUMA regra aqui: tudo vem de Sys.pass:
   níveis e XP (progress, DATA.tiers/xpPerTier), recompensas por nível (reward('free'|'premium', n)), já resgatadas (ensure().free/.prem), premium (ensure().premium),
   temporada (season().end), guardados por nível (held), resgatar tudo (claimAll). A tela NÃO substitui a 'pass' atual: registra 'passv2'; o engenheiro troca no MENU.
   Sem emoji: moeda/gema = assets/ui; o resto é texto e formas CSS.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - trilha única rolável com todos os níveis (1 a Sys.pass.DATA.tiers), o nível atual destacado e centralizado ao abrir; sem páginas ‹ ›;
   - NÃO há aba de missões aqui: o botão "Missões" abre a tela de Missões (Panels.open('missions')) quando ela está ligada, senão avisa;
   - o item de equipamento é mostrado pelo espaço e raridade do módulo (sem nome de item inventado) e "Item da temporada" quando season:true;
   - "Resgatar" por nível só existe se o módulo tiver Sys.pass.claimTier(S, host, 'free'|'premium', nível) (hoje só existe claimAll): sem ele o nível pronto mostra "Pronto" e o botão fixo "Resgatar tudo" entrega;
   - "Ativar Premium" NÃO cobra nem liga o premium: abre "Pagamento em breve" (a compra não existe; nada é simulado).
   Pedido Q-13 (reports/pedidos-entre-agentes.md). */
const XPW={center:true,keep:0,dlg:false};
const PW_MINH=560, PW_ROW=88;
const PW_CSS=`.pw-row{display:flex;align-items:stretch;gap:6px;height:80px;flex:none}
.pw-cell{flex:1;min-width:0;border-radius:12px;box-sizing:border-box;padding:6px 8px;display:flex;flex-direction:column;justify-content:center;gap:2px;line-height:1.15;border:2px solid #4a3a2b;background:#1d1611}
.pw-mid{flex:none;width:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-family:'Lilita One',sans-serif;font-size:17px;border:2px solid #4a3a2b;background:#2a1f16;color:#c9b9a2}
.pw-cur .pw-mid{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;border-color:#fff0a8;box-shadow:0 0 14px rgba(255,201,74,.55)}
.pw-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 14px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pw-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pw-btn.sec{background:#33271d;color:#f6ecdf;border:2px solid #6b5843;box-shadow:none}
.pw-btn.off{background:#3a3128;color:#9c8d7a;box-shadow:none}
.pw-pop{animation:pwp .3s cubic-bezier(.2,1.3,.4,1) both}
@keyframes pwp{from{transform:scale(.85);opacity:0}to{transform:none;opacity:1}}
.pw-ready{box-shadow:0 0 0 2px #ffc94a,0 0 12px rgba(255,201,74,.4)}
@media (prefers-reduced-motion:reduce){.pw-pop{animation:none}}`;
const PW_SLOT={weapon:'Arma',armor:'Armadura',hat:'Chapéu',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'};
const pwOk=()=>!!(window.Sys&&Sys.pass&&Sys.pass.progress&&Sys.pass.reward&&Sys.pass.claimAll);
const pwEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pwFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
const pwIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||18)+'px;height:'+(z||18)+'px;vertical-align:-4px;object-fit:contain">';
function pwInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pw_css')) return; const st=document.createElement('style'); st.id='pw_css'; st.textContent=PW_CSS; document.head.appendChild(st); }
const pwToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const pwSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const pwChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const pwRar=r=>{ try{ return RAR[r].n; }catch(e){ return ''; } };
const pwRc=r=>{ try{ return RAR[r].c; }catch(e){ return '#e8e2d8'; } };
const pwUnit=()=>{ try{ return Math.max(1,(Sys.host&&Sys.host.goldUnit&&Sys.host.goldUnit())||1); }catch(e){ return 1; } };
/* o que a recompensa é, pelo que o módulo diz: [{html}] */
function pwBody(rw){ if(!rw) return '<span style="font-size:12px;font-weight:800;color:#9c8d7a">—</span>'; const a=[];
  if(rw.gems) a.push(`<span style="font-size:14px;font-weight:900">${pwIc('gem')} ${rw.gems}</span>`);
  if(rw.goldk) a.push(`<span style="font-size:14px;font-weight:900">${pwIc('coin')} ${pwFmt(Math.round(rw.goldk*pwUnit()))}</span>`);
  if(rw.item){ const r=rw.item.r|0; a.push(`<span style="font-size:13px;font-weight:900;color:${pwRc(r)}">${pwEsc(PW_SLOT[rw.item.slot]||'Item')} ${pwEsc(pwRar(r))}</span>${rw.item.season?'<span style="font-size:10px;font-weight:800;color:#c9b9a2">Item da temporada</span>':''}`); }
  if(rw.skin) a.push(`<span style="font-size:13px;font-weight:900;color:#ffc94a">Skin da temporada</span><span style="font-size:10px;font-weight:800;color:#c9b9a2">só visual</span>`);
  return a.join(''); }
function pwCell(track,t,P,o,canTier){
  const prem=track==='premium', claimed=(prem?o.prem:o.free).includes(t), reached=t<=P.tier, locked=prem&&!o.premium, ready=reached&&!claimed&&!locked, rw=Sys.pass.reward(track,t);
  const st=claimed?'<span style="font-size:11px;font-weight:900;color:#9ff0a8">Resgatado</span>':ready?(canTier?`<button data-x="tier" data-track="${track}" data-t="${t}" class="pw-btn" style="min-height:40px;font-size:13px;padding:0 10px">Resgatar</button>`:'<span style="font-size:11px;font-weight:900;color:#ffe07a">Pronto</span>'):locked?'<span style="font-size:11px;font-weight:900;color:#9c8d7a">Premium</span>':`<span style="font-size:11px;font-weight:800;color:#9c8d7a">No nível ${t}</span>`;
  return `<div class="pw-cell${ready?' pw-ready':''}" role="group" aria-label="${prem?'Premium':'Grátis'}, nível ${t}${claimed?', resgatado':ready?', pronto':locked?', bloqueado':''}" style="${prem?'border-color:'+(locked?'#4a3a2b':'#8a5ad0')+';background:'+(locked?'#18121a':'#241a30'):''};opacity:${claimed?.6:locked?.75:1}">${pwBody(rw)}${st}</div>`; }
function pwRows(P,o,canTier){ const T=Sys.pass.DATA.tiers; let h='';
  for(let t=1;t<=T;t++){ const cur=t===Math.max(1,P.tier);
    h+=`<div class="pw-row${cur?' pw-cur':''}" ${cur?'id="pw_cur" ':''}aria-label="Nível ${t}${cur?', atual':''}">${pwCell('free',t,P,o,canTier)}<span class="pw-mid" aria-hidden="true">${t}</span>${pwCell('premium',t,P,o,canTier)}</div>`; }
  return h; }
function pwReady(P,o){ let n=0; for(let t=1;t<=P.tier;t++){ if(!o.free.includes(t)) n++; if(o.premium&&!o.prem.includes(t)) n++; } return n; }
function pwMsReady(){ try{ if(Sys.pass.list){ const L=Sys.pass.list(S,Sys.host); return L.daily.concat(L.weekly).filter(m=>m.done&&!m.claimed).length+(L.bonus.ready&&!L.bonus.claimed?1:0); } }catch(e){} return 0; }
function pwLeft(){ try{ const e=Sys.pass.season(S,Sys.host).end, now=(Sys.host&&Sys.host.now&&Sys.host.now())||Date.now(), d=Math.max(0,Math.ceil((e-now)/86400000)); return d<=1?'Termina hoje':'Faltam '+d+' dias'; }catch(e){ return ''; } }
function scrPass2(){
  pwInject(); const d=xDims(PW_MINH); try{ const el=document.getElementById('pw_sc'); if(el&&typeof el.scrollTop==='number') XPW.keep=el.scrollTop; }catch(e){}
  if(!pwOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Passe indisponível agora.</div>`); return; }
  const o=Sys.pass.ensure(S), P=Sys.pass.progress(S), T=Sys.pass.DATA.tiers, canTier=typeof Sys.pass.claimTier==='function', n=pwReady(P,o), ms=pwMsReady(), pct=Math.round(P.inTier/Math.max(1,P.per)*100);
  const held=(()=>{ try{ return Sys.pass.held(S).length; }catch(e){ return 0; } })();
  V.innerHTML=xWrap(d,'',`<div style="flex:none;padding:2px 2px 6px;display:flex;flex-direction:column;gap:6px">
      <div style="display:flex;align-items:center;gap:8px"><span style="flex:1;min-width:0;line-height:1.1"><b style="font-family:'Lilita One',sans-serif;font-size:20px">Nível do passe ${P.tier}/${T}</b><br><span style="font-size:11px;font-weight:800;color:#c9b9a2">${pwEsc(pwLeft())}${o.premium?' · Premium ativo':''}</span></span>
        <button data-x="missions" class="pw-btn sec" style="flex:none;position:relative">Missões${ms?`<span aria-label="${ms} para resgatar" style="position:absolute;right:-4px;top:-6px;min-width:20px;height:20px;border-radius:10px;background:#ff5a4e;color:#fff;font-size:12px;font-weight:900;line-height:20px;padding:0 4px;box-sizing:border-box">${ms}</span>`:''}</button></div>
      <span role="img" aria-label="XP do passe: ${P.inTier} de ${P.per}" style="position:relative;height:12px;border-radius:6px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${P.max?100:pct}%;background:linear-gradient(90deg,#2fc9a8,#8ff5dc)"></span></span>
      <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#c9b9a2"><span>${P.max?'Nível máximo':P.inTier+'/'+P.per+' XP do passe'}</span><span>O XP vem das Missões</span></div>
      <div style="display:flex;gap:6px;font-size:12px;font-weight:900"><span style="flex:1;text-align:center;color:#9ff0a8">Grátis</span><span style="width:44px"></span><span style="flex:1;text-align:center;color:#c9a6ff">Premium</span></div>
      ${held?`<span role="note" style="font-size:11px;font-weight:800;color:#ffd27a;text-align:center">${held} ${held>1?'itens guardados':'item guardado'} até você alcançar o nível necessário</span>`:''}</div>
    <div id="pw_sc" class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 10px">${pwRows(P,o,canTier)}</div>
    <div style="flex:none;display:flex;gap:8px;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))">${o.premium?'':'<button data-x="buy" class="pw-btn sec" style="flex:1">Ativar Premium</button>'}<button data-x="all" class="pw-btn${n?'':' off'}" style="flex:1.3;font-family:'Lilita One',sans-serif;font-size:17px">Resgatar tudo${n?' ('+n+')':''}</button></div>
    ${XPW.dlg?`<div role="alertdialog" aria-label="Pagamento em breve" style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:18px"><div class="pw-pop" style="width:100%;max-width:330px;border-radius:18px;background:#1d1611;border:3px solid #8a5ad0;padding:16px;display:flex;flex-direction:column;gap:10px;text-align:center;box-sizing:border-box"><b style="font-family:'Lilita One',sans-serif;font-size:22px">Passe Premium</b><span style="font-size:14px;font-weight:800;color:#e8dccb">Pagamento em breve: a compra ainda não está disponível. Nada foi cobrado.</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">Quando abrir, os níveis já alcançados ficam prontos para resgatar.</span><button data-x="dlg-x" class="pw-btn" style="width:100%">Entendi</button></div></div>`:''}`);
  try{ const el=document.getElementById('pw_sc'), cur=document.getElementById('pw_cur'); if(el&&typeof el.scrollTop==='number'){ if(XPW.center){ XPW.center=false; const t=Math.max(1,P.tier); el.scrollTop=Math.max(0,(t-1)*PW_ROW-((el.clientHeight||360)-80)/2); } else el.scrollTop=XPW.keep; } }catch(e){}
}
function pwGot(r){ if(!r||!r.n) return null; let g=0,c=0,i=0,h=0,s=0; for(const x of r.list){ g+=x.gems||0; c+=x.gold||0; if(x.item) i++; if(x.held) h++; if(x.skin) s++; }
  return [g?g+' gemas':'',c?pwFmt(c)+' moedas':'',i?i+(i>1?' itens':' item'):'',s?'skin':'',h?h+' guardado'+(h>1?'s':'')+' até o nível certo':''].filter(Boolean).join(' · ')||'Recompensa recebida'; }
function pwClick(b){
  const a=b.dataset.x; if(!pwOk()) return;
  if(a==='dlg-x'){ pwSnd('ui_tap'); XPW.dlg=false; render(); return; }
  if(XPW.dlg) return;
  if(a==='buy'){ pwSnd('ui_tap'); XPW.dlg=true; render(); return; }
  if(a==='missions'){ pwSnd('ui_tap'); if(window.Panels&&Panels.on&&Panels.on('missions')) Panels.open('missions'); else pwToast('As Missões abrem em breve'); return; }
  if(a==='all'){ const r=Sys.pass.claimAll(S,Sys.host); if(!r||!r.n){ pwSnd('ui_tap'); pwToast('Nenhuma recompensa pronta para resgatar'); return; } pwSnd('claim'); pwChanged(); pwToast('Resgatado: '+pwGot(r)); render(); return; }
  if(a==='tier'){ if(typeof Sys.pass.claimTier!=='function') return; const t=parseInt(b.dataset.t,10), r=Sys.pass.claimTier(S,Sys.host,b.dataset.track,t); if(!r||r.ok===false){ pwSnd('ui_tap'); pwToast('Esta recompensa ainda não pode ser resgatada'); render(); return; } pwSnd('claim'); pwChanged(); pwToast('Resgatado: '+(pwGot({n:1,list:[r]})||'recompensa')); render(); return; }
}
/* APOSENTADO (decisão do engenheiro): o Passe com rolagem vive em js/screens2.js ('pass'). Este painel só se registra com window.P_PASSV2_ON=true (uso de teste). */
if(window.P_PASSV2_ON) Panels.add('passv2',{title:'Passe',render:scrPass2,click:pwClick,busy(){ return XPW.dlg; },onOpen(){ XPW.center=true; XPW.keep=0; XPW.dlg=false; },onClose(){ XPW.dlg=false; } });
