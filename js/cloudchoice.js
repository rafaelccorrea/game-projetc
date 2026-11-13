'use strict';
/* ================= NUVEM × APARELHO (o save do aparelho e o da nuvem mudaram OS DOIS; bloqueia o online da APK) =================
   Contrato (Servidor fps-6f, js/sys/net.js): o OnlineBoot (fps-c8, js/onlineboot.js) chama Sys.net.sync(S, summary); com
   {action:'choose', recommend:'device'|'cloud', device:<resumo do aparelho>, cloud:{version, updatedAt, deviceId, summary}} ele chama
   window.CloudChoice(info) → Promise<'device'|'cloud'>. Esta tela SÓ mostra e devolve a escolha; quem chama Sys.net.chooseSide e troca o save é o OnlineBoot.
   Mostra dois cartões (Aparelho / Nuvem): retrato, nível, FC (escala de exibição), era e fase, data e hora da última gravação, tempo de jogo; o selo
   "Recomendado" no lado com MAIS tempo de jogo (info.recommend). "Usar este" em cada um, com CONFIRMAÇÃO no segundo toque; o texto diz que o outro lado
   fica guardado no histórico do servidor (5 versões, dá para voltar). Sem fechar por fora: o jogador tem de escolher (a promessa só resolve na escolha).
   window.CloudChoice.failed(err) mostra o aviso de falha (sem rede no meio) e fecha. Overlay próprio (não depende do Panels: roda na abertura).
   Sem emoji; alvos de 48 px; aria; prefers-reduced-motion. Modo dono nunca vê (o Sys.net não sincroniza nele). */
(function(){
const cTry=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const cEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cFC=v=>cTry(()=>window.Sys.fc.viewText(v),String(Math.round(v||0)));
const cEra=e=>cTry(()=>ERAS[e].n,'Era '+((e|0)+1));
const cWhen=ms=>{ if(!ms) return 'sem data'; try{ const d=new Date(ms); return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+' às '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } };
const cPlay=s=>{ s=Math.max(0,s|0); const h=Math.floor(s/3600), m=Math.floor(s%3600/60); return h?h+' h '+m+' min':m+' min'; };
const cStage=st=>{ const n=st|0; if(!n) return ''; return cTry(()=>{ const P=typeof STAGES_PER_ERA!=='undefined'?STAGES_PER_ERA:100; return 'fase '+(((n-1)%P)+1); },'fase '+n); };
const cAvatar=sm=>sm&&sm.avatar?sm.avatar:((sm&&sm.hero)==='kaia'?'kaia_phase0':'kael_phase0');
const C={el:null,info:null,pick:null,resolve:null,busy:false};
function inject(){ if(document.getElementById('cc_css')) return; const st=document.createElement('style'); st.id='cc_css'; st.textContent=`
#cc_root{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,6,4,.88);padding:14px;box-sizing:border-box;font-family:inherit}
#cc_root .cc-box{width:100%;max-width:420px;max-height:100%;overflow-y:auto;overflow-x:hidden;border-radius:20px;background:#1d1611;border:2px solid #ffc94a;box-shadow:0 0 24px rgba(255,201,74,.25);padding:16px 14px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;color:#f6ecdf;animation:cc-in .22s ease-out}
#cc_root .cc-cards{display:flex;gap:10px}
#cc_root .cc-card{flex:1;min-width:0;border-radius:16px;border:2px solid #4a3a2b;background:#16110d;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center;position:relative;box-sizing:border-box}
#cc_root .cc-card.rec{border-color:#5fd068;box-shadow:0 0 14px rgba(95,208,104,.35)}
#cc_root .cc-card.pick{border-color:#ffc94a;box-shadow:0 0 16px rgba(255,201,74,.45)}
#cc_root .cc-btn{width:100%;min-height:48px;border-radius:14px;border:0;font-size:16px;font-weight:900;cursor:pointer}
#cc_root .cc-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 5px 0 #8a4f0c}
#cc_root .cc-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
#cc_root .cc-off{background:#33271d;color:#f6ecdf;border:2px solid #4a3a2b}
#cc_root .cc-warn{background:linear-gradient(180deg,#ff9a5a,#e0602a);color:#2a0a02;box-shadow:0 5px 0 #7a2a08}
@keyframes cc-in{from{transform:scale(.96);opacity:0}to{transform:none;opacity:1}}
@media (max-width:330px){#cc_root .cc-cards{flex-direction:column}}
@media (prefers-reduced-motion:reduce){#cc_root .cc-box{animation:none}}`; document.head.appendChild(st); }
/* o contador de tempo de jogo (S.playSeconds) é novo: enquanto os dois lados estiverem em 0, a linha "Jogado" não aparece */
const showPlay=()=>{ const I=C.info||{}; return (+((I.device||{}).playSeconds)||0)>0||(+(((I.cloud||{}).summary||{}).playSeconds)||0)>0; };
function card(side){ const I=C.info, sm=side==='device'?(I.device||{}):((I.cloud&&I.cloud.summary)||{}), when=side==='device'?(I.device&&I.device.savedAt)||cTry(()=>S.lastSeen,0):(I.cloud&&I.cloud.updatedAt);
  const rec=I.recommend===side, pick=C.pick===side, name=cTry(()=>S.name,'Herói');
  const label=side==='device'?'Este aparelho':'Nuvem';
  const icon=side==='device'?'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="2.4" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"></rect><line x1="11" y1="18" x2="13" y2="18"></line></svg>'
    :'<svg width="20" height="18" viewBox="0 0 26 20" fill="none" stroke="#c9b9a2" stroke-width="2.4" aria-hidden="true"><path d="M7 18h12a5 5 0 0 0 .8-9.9A7 7 0 0 0 6.3 7.2 5.4 5.4 0 0 0 7 18z"></path></svg>';
  return `<div class="cc-card${rec?' rec':''}${pick?' pick':''}" role="group" aria-label="${label}${rec?', recomendado':''}">
    ${rec?'<span style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);padding:1px 10px;border-radius:9px;background:#5fd068;color:#0d2410;font-size:11px;font-weight:900;white-space:nowrap">Recomendado</span>':''}
    <span style="display:flex;align-items:center;gap:5px;margin-top:4px;font-size:13px;font-weight:900;color:#c9b9a2">${icon}${label}</span>
    <span style="width:64px;height:64px;border-radius:16px;overflow:hidden;border:2px solid ${rec?'#5fd068':'#6b5843'};background:#2a1f16"><img src="assets/hero/avatar/${cEsc(cAvatar(sm))}.png" alt="" style="width:100%;height:100%;object-fit:cover"></span>
    <span style="font-size:14px;font-weight:900;overflow-wrap:anywhere">${cEsc(name)}</span>
    <span style="font-size:13px;font-weight:900;color:#ffe07a">Nível ${sm.level|0}</span>
    <span style="font-size:12px;font-weight:800">FC ${cEsc(cFC(sm.fc))}</span>
    <span style="font-size:11px;font-weight:800;color:#c9b9a2;line-height:1.25">${cEsc(cEra(sm.era|0))}${sm.stage?' · '+cEsc(cStage(sm.stage)):''}</span>
    ${showPlay()?`<span style="font-size:11px;font-weight:800;color:#c9b9a2">Jogado: ${cEsc(cPlay(sm.playSeconds))}</span>`:''}
    <span style="font-size:11px;font-weight:800;color:#8a7458">Salvo em ${cEsc(cWhen(when))}</span>
    <button class="cc-btn ${pick?'cc-warn':'cc-gold'}" data-cc="${side}" aria-label="${pick?'Confirmar: usar '+label:'Usar '+label}" ${C.busy?'disabled':''}>${pick?'Toque de novo para confirmar':'Usar este'}</button></div>`; }
function draw(){ if(!C.el) return; const other=C.pick==='device'?'da nuvem':'deste aparelho';
  C.el.innerHTML=`<div class="cc-box" role="dialog" aria-modal="true" aria-labelledby="cc_t">
    <span id="cc_t" class="lil" style="font-size:21px;text-align:center;color:#ffe07a">Dois saves diferentes</span>
    <span style="font-size:13px;font-weight:800;text-align:center;line-height:1.35">Este aparelho e a nuvem foram jogados separados. Escolha com qual continuar.</span>
    <div class="cc-cards">${card('device')}${card('cloud')}</div>
    <span style="font-size:12px;font-weight:800;text-align:center;color:${C.pick?'#ffb38a':'#c9b9a2'};line-height:1.35">${C.pick?'O save '+other+' não se perde: fica guardado no histórico do servidor (as últimas 5 versões) e dá para voltar depois.':'O que você não escolher fica guardado no histórico do servidor (as últimas 5 versões) e dá para voltar depois.'}</span>
    ${C.pick?'<button class="cc-btn cc-off" data-cc="back" aria-label="Voltar sem escolher">Voltar</button>':''}</div>`; }
function onClick(ev){ const b=ev.target.closest&&ev.target.closest('[data-cc]'); if(!b||C.busy) return; const a=b.dataset.cc;
  try{ if(typeof snd==='function') snd('ui_tap'); }catch(e){}
  if(a==='back'){ C.pick=null; draw(); return; }
  if(a!=='device'&&a!=='cloud') return;
  if(C.pick!==a){ C.pick=a; draw(); return; }   // 1º toque marca; 2º toque confirma
  C.busy=true; const r=C.resolve; close(); if(r) r(a); }
function close(){ if(C.el&&C.el.parentNode) C.el.parentNode.removeChild(C.el); C.el=null; C.pick=null; C.busy=false; C.resolve=null; }
function open(info){ inject(); close(); C.info=Object.assign({recommend:'device',device:{},cloud:{summary:{}}},info||{}); C.el=document.createElement('div'); C.el.id='cc_root';
  C.el.addEventListener('click',onClick); document.body.appendChild(C.el); draw();
  return new Promise(res=>{ C.resolve=res; }); }
/* falha no meio (sem rede): aviso e fecha; o aparelho segue com o save dele e a pergunta volta na próxima abertura */
function failed(err){ inject(); close(); const el=document.createElement('div'); el.id='cc_root'; el.innerHTML=`<div class="cc-box" role="alertdialog" aria-labelledby="cc_f">
    <span id="cc_f" class="lil" style="font-size:19px;text-align:center;color:#ffb38a">Sem conexão</span>
    <span style="font-size:13px;font-weight:800;text-align:center;line-height:1.35">Seu jogo continua com o save deste aparelho. Vamos perguntar de novo na próxima vez.</span>
    <button class="cc-btn cc-gold" data-cc="ok">Continuar</button></div>`;
  el.addEventListener('click',ev=>{ if(ev.target.closest&&ev.target.closest('[data-cc="ok"]')&&el.parentNode) el.parentNode.removeChild(el); }); document.body.appendChild(el); C.el=null; return err&&err.code||'offline'; }
const _click=a=>onClick({target:{closest:()=>({dataset:{cc:a}})}});   // só para testes
window.CloudChoice=Object.assign(open,{failed,close,_state:C,_click});
})();
