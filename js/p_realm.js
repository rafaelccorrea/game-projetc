'use strict';
(function(){   /* escopo próprio */
/* ================= ESCOLHA DE SERVIDOR (decisão do dono: jogo POR SERVIDOR; S1 "Nova Era" agora, depois S2, S3...) =================
   Tela nova, nasce DESLIGADA (PANEL_ON.realm). Entra depois do Login e antes da Criação; também por "Trocar servidor" (Título/Login e Configurações).
   - Lista: "S<n> · <nome>", selo Novo / Recomendado / Lotado / Manutenção, data de abertura e, se o jogador tem personagem ali: retrato, nome, nível e FC.
   - Fonte da lista: GET /v1/realms do Servidor (Sys.net.realms(), ou a chamada genérica), docs/API_SERVIDOR.md. Sem online ou sem a função: só o S1 local
     ("S1 · Nova Era", com o personagem deste aparelho), sem travar. Com UM servidor só, o jogo nem abre esta tela: mostra só o selo (realmBadge()).
   - Trocar: a tela NÃO grava nem lê chave de save. Confirma com o aviso "cada servidor tem o seu progresso" e chama window.Realm.set(id) (do engenheiro:
     grava, troca a chave, bloqueia gravações e recarrega). Servidor atual: window.Realm.id() (ausente = 's1').
   - realmBadge() (global) = "S1 · Nova Era" para o Perfil, o Ranking e o Título lerem. FC na escala de exibição (Sys.fc.viewText). Sem emoji. */
const XR={list:null,loading:false,err:false,cf:null,anim:true,toast:'',toastT:0};
const R_LOCAL=[{id:'s1',code:'S1',n:1,name:'Nova Era',state:'open',recommended:true,openedAt:null}];
const rTry=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const rEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const rCur=()=>rTry(()=>window.Realm&&typeof Realm.id==='function'?Realm.id():'s1','s1')||'s1';
const rNum=id=>{ const m=/^s(\d+)$/i.exec(String(id||'')); return m?+m[1]:1; };
const rLabel=r=>(r.code||('S'+(r.n||rNum(r.id))))+' · '+(r.name||'Nova Era');
/* o personagem DESTE aparelho no servidor atual (sem online, é o único que conhecemos) */
function rMeLocal(){ return {name:rTry(()=>S.name,'Herói'),level:rTry(()=>Sys.level.level(S),1),fc:rTry(()=>Sys.fc.compute(S,Sys.host),0),
  avatar:rTry(()=>Sys.appearance.avatarKey(S,Sys.host),rTry(()=>S.hero==='kaia'?'kaia_phase0':'kael_phase0','kael_phase0'))}; }
function rList(){ const cur=rCur(); const L=(XR.list&&XR.list.length?XR.list:R_LOCAL).map(r=>Object.assign({},r,{n:r.n||rNum(r.id)}));
  for(const r of L) if(r.id===cur&&!r.me) r.me=rMeLocal(); return L.sort((a,b)=>b.n-a.n); }
window.realmBadge=function(){ const cur=rCur(), r=rList().find(x=>x.id===cur)||R_LOCAL[0]; return rLabel(r); };
/* lista do Servidor: GET /v1/realms → [{id, code, name, state:'open'|'new'|'full'|'closed', recommended, openedAt}] (contrato fps-6f/engenheiro).
   Usa Sys.net.realms() quando existir; senão a chamada genérica do Sys.net; sem rede, fica só o servidor atual. */
const rSource=()=>{ const N=window.Sys&&Sys.net; if(!N) return null; if(typeof N.realms==='function') return ()=>N.realms(); if(typeof N._call==='function'&&rTry(()=>N.DATA.on===true,false)) return ()=>N._call('GET','/v1/realms'); return null; };
function rLoad(){ const src=rSource(); if(XR.loading||XR.list||!src) return; XR.loading=true;
  let p=null; try{ p=src(); }catch(e){ p=null; }
  if(!p||typeof p.then!=='function'){ XR.loading=false; if(Array.isArray(p)) XR.list=p; return; }
  p.then(l=>{ const a=Array.isArray(l)?l:(l&&Array.isArray(l.realms)?l.realms:null); XR.list=a&&a.length?a:null; XR.err=false; },()=>{ XR.err=true; }).then(()=>{ XR.loading=false; if(rOn()) render(); }); }
const rOn=()=>typeof view!=='undefined'&&view==='realm';
const R_BADGE={new:['Novo','#5fd068','#0d2410'],recommended:['Recomendado','#ffc94a','#2a1403'],full:['Lotado','#ff6b6b','#2a0a08'],closed:['Fechado','#8a7458','#120d09']};
const rBadge=r=>r.state==='full'?R_BADGE.full:r.state==='closed'?R_BADGE.closed:r.state==='new'?R_BADGE.new:r.recommended?R_BADGE.recommended:null;
function rDate(ms){ if(!ms) return ''; try{ return new Date(ms).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){ return ''; } }
function rCard(r,cur,t44){ const b=rBadge(r), on=r.id===cur, me=r.me, full=(r.state==='full'||r.state==='closed')&&!me, off=false;   // full/closed: só entra quem já tem personagem (contrato fps-6f)
  const ava=me?`<span style="width:56px;height:56px;flex:none;border-radius:14px;overflow:hidden;border:2px solid ${on?'#ffc94a':'#6b5843'};background:#2a1f16"><img src="assets/hero/avatar/${rEsc(me.avatar||'kael_phase0')}.png" alt="" style="width:100%;height:100%;object-fit:cover"></span>`
    :`<span style="width:56px;height:56px;flex:none;border-radius:14px;border:2px dashed #6b5843;background:#16110d;display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8a7458" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>`;
  const info=me?`<span style="font-size:12px;font-weight:900;color:#f6ecdf;overflow-wrap:anywhere">${rEsc(me.name)} · Nv. ${me.level|0}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">FC ${rEsc(rTry(()=>Sys.fc.viewText(me.fc),String(me.fc|0)))}</span>`
    :`<span style="font-size:12px;font-weight:800;color:#c9b9a2">Sem personagem aqui</span>`;
  return `<button data-x="pick" data-id="${rEsc(r.id)}" ${full||off?'aria-disabled="true"':''} aria-label="${rEsc(rLabel(r))}${b?', '+b[0]:''}${on?', servidor atual':''}${me?', '+rEsc(me.name)+' nível '+(me.level|0):''}" style="position:relative;width:100%;min-height:${Math.max(84,t44)}px;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#2c2116':'#1d1611'};color:#f6ecdf;text-align:left;box-sizing:border-box;${full||off?'opacity:.6;':''}">
    ${ava}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
      <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap"><span class="lil" style="font-size:17px;color:${on?'#ffe07a':'#f6ecdf'}">${rEsc(rLabel(r))}</span>${b?`<span style="padding:1px 8px;border-radius:8px;background:${b[1]};color:${b[2]};font-size:10px;font-weight:900;white-space:nowrap">${b[0]}</span>`:''}${on?'<span style="padding:1px 8px;border-radius:8px;border:1px solid #ffc94a;color:#ffc94a;font-size:10px;font-weight:900;white-space:nowrap">Atual</span>':''}</span>
      ${info}${r.openedAt?`<span style="font-size:10px;font-weight:800;color:#8a7458">Aberto em ${rEsc(rDate(r.openedAt))}</span>`:''}</span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="3" stroke-linecap="round" aria-hidden="true" style="flex:none"><polyline points="9 6 15 12 9 18"></polyline></svg></button>`; }
function scrRealm(){ const d=rTry(()=>xDims(240),{s:1}), t44=Math.max(44,Math.ceil(44/((d&&d.s)||1))), cur=rCur(), L=rList(); rLoad();
  const cf=XR.cf&&L.find(r=>r.id===XR.cf);
  const confirm=cf?`<div aria-hidden="true" data-x="cfno" style="position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:4"></div>
    <div role="dialog" aria-label="Trocar de servidor" style="position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);padding:16px;border-radius:18px;background:#1d1611;border:2px solid #ffc94a;z-index:5;display:flex;flex-direction:column;gap:10px;text-align:center">
      <span class="lil" style="font-size:20px;color:#ffe07a">Entrar no ${rEsc(rLabel(cf))}?</span>
      <span style="font-size:13px;font-weight:800;color:#f6ecdf;line-height:1.35">Cada servidor tem o seu próprio progresso. O seu personagem do ${rEsc(rLabel(L.find(r=>r.id===cur)||R_LOCAL[0]))} fica guardado lá, do jeito que está.${cf.me?'':' Aqui você começa um herói novo.'}</span>
      <div style="display:flex;gap:8px"><button data-x="cfno" style="flex:1;height:${Math.max(50,t44)}px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:15px;font-weight:900">Cancelar</button>
        <button data-x="cfyes" class="lil rl-gold" style="flex:1;height:${Math.max(50,t44)}px;border-radius:14px;font-size:17px">Entrar</button></div></div>`:'';
  const note=XR.err?'<div style="margin:0 12px;font-size:12px;font-weight:800;color:#ff8a7a;text-align:center">Sem conexão: mostrando o servidor deste aparelho.</div>'
    :!rSource()?'<div style="margin:0 12px;font-size:12px;font-weight:800;color:#8a7458;text-align:center">Mais servidores aparecem aqui quando abrirem.</div>':XR.loading?'<div style="margin:0 12px;font-size:12px;font-weight:800;color:#c9b9a2;text-align:center">Buscando servidores...</div>':'';
  const html=`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column">
    <div id="rl_scroll" class="x-scroll" style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:10px;padding:10px 0 16px;box-sizing:border-box">
      <div style="margin:0 12px;display:flex;flex-direction:column;gap:2px"><span class="lil" style="font-size:22px;color:#f6ecdf">Escolha o servidor</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">Cada servidor é um mundo separado, com o seu ranking e a sua guilda.</span></div>
      <div role="list" style="margin:0 12px;display:flex;flex-direction:column;gap:8px">${L.map(r=>rCard(r,cur,t44)).join('')}</div>${note}</div>
    ${confirm}<div id="rl_toast">${XR.toast&&Date.now()-XR.toastT<1600?`<div role="status" style="position:absolute;left:0;right:0;top:60px;display:flex;justify-content:center;pointer-events:none;z-index:7"><span style="padding:8px 16px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ffc94a;font-size:14px;font-weight:900;color:#f6ecdf">${rEsc(XR.toast)}</span></div>`:''}</div></div>`;
  V.innerHTML=rTry(()=>xWrap(d,XR.anim?'rl-in':'',html),html); XR.anim=false; }
(function(){ if(typeof document==='undefined'||!document.head) return; const st=document.createElement('style'); st.textContent=`
.rl-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 5px 0 #8a4f0c;border:0}.rl-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
.rl-in{animation:rl-fade .2s ease-out}@keyframes rl-fade{from{opacity:0}to{opacity:1}}#rl_scroll>*{flex-shrink:0}@media (prefers-reduced-motion:reduce){.rl-in{animation:none}}`; document.head.appendChild(st); })();
function rToast(m){ XR.toast=m; XR.toastT=Date.now(); render(); }
function rClick(b){ const a=b.dataset.x, L=rList(), cur=rCur();
  if(a==='pick'){ const r=L.find(x=>x.id===b.dataset.id); rSnd('ui_tap'); if(!r) return;
    if((r.state==='full'||r.state==='closed')&&!r.me){ rToast(r.state==='closed'?'Servidor fechado para novos personagens':'Servidor lotado: escolha outro'); return; }
    if(r.id===cur){ if(window.Panels&&Panels.close) Panels.close(); else rToast('Você já está neste servidor'); return; }
    XR.cf=r.id; render(); }
  else if(a==='cfno'){ rSnd('ui_tap'); XR.cf=null; render(); }
  else if(a==='cfyes'){ const id=XR.cf; XR.cf=null; rSnd('ui_tap');
    if(window.Realm&&typeof Realm.set==='function'){ try{ Realm.set(id); }catch(e){ rToast('Não deu para trocar agora'); } } else rToast('Troca de servidor em breve'); }
}
Panels.add('realm',{title:'Servidor',render:scrRealm,click:rClick,
  onOpen(){ XR.anim=true; XR.cf=null; XR.toast=''; XR.err=false; rLoad(); },
  onClose(){ XR.cf=null; XR.toast=''; } });
window.RealmUI={state:XR,list:rList,click:rClick};
})();
