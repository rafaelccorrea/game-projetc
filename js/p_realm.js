'use strict';
/* ================= ESCOLHA DE SERVIDOR (dono: jogo POR SERVIDOR; S1 "Nova Era"; a v0.13.0 sai com esta tela LIGADA, mesmo com um servidor só) =================
   DUAS entradas, o mesmo desenho:
   - window.RealmUI.mount(el, {first, onDone(id)}): desenha DENTRO de el, fora do Panels (no Título/Login o jogo ainda não começou). first:true = 1º acesso
     (depois do Login, antes da Criação): sem fechar, texto de primeira vez. first:false = "Trocar servidor" (Título e Configurações): com Voltar.
     Escolher o servidor ATUAL → grava localStorage 'eon_realm_seen'='1' e chama onDone(id). Escolher OUTRO → confirma ("cada servidor tem o seu progresso"),
     grava a MESMA marca ANTES e chama window.Realm.set(id) (o engenheiro: grava, troca a chave do save e RECARREGA; no Modo dono usa a chave do dono).
   - Painel 'realm' (Panels, PANEL_ON.realm) para as Configurações: o mesmo desenho dentro de V.
   Lista: GET /v1/realms do Servidor (Sys.net.realms(); contrato docs/API_SERVIDOR.md §11): [{id:'s1', code:'S1', name, state:'new'|'open'|'full'|'closed',
   recommended, openedAt, me:{name, level, fc, hero, avatar}|null}]. 'full'/'closed' só deixam entrar quem já tem personagem. Sem rede ou sem Sys.net:
   o S1 local, sem travar (resposta que não vem em 6 s também cai no S1). Servidor atual: window.Realm.id() (ausente = 's1').
   Roda ANTES do boot: nada aqui exige Panels, Sys, S, snd ou ERAS (tudo protegido). Só rolagem VERTICAL (regra do dono), cabe em 360 px. Sem emoji.
   window.realmBadge() = "S1 · Nova Era" (Perfil, Ranking, Título). */
(function(){
const R_LOCAL=[{id:'s1',code:'S1',name:'Nova Era',state:'new',recommended:true,openedAt:null,me:null}];
const SEEN='eon_realm_seen';
const rTry=(f,d)=>{ try{ const v=f(); return v==null?d:v; }catch(e){ return d; } };
const rEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const rCur=()=>rTry(()=>window.Realm&&typeof window.Realm.id==='function'?window.Realm.id():'s1','s1')||'s1';
const rNum=id=>{ const m=/^s(\d+)$/i.exec(String(id||'')); return m?+m[1]:1; };
const rLabel=r=>(r.code||('S'+rNum(r.id)))+' · '+(r.name||'Nova Era');
const rSeen=()=>{ try{ localStorage.setItem(SEEN,'1'); }catch(e){} };
const R={list:null,loading:false,err:false,cf:null,toast:'',toastT:0};
/* o personagem DESTE aparelho no servidor atual (só depois do boot; antes, sem cartão de personagem) */
function meLocal(){ if(typeof S==='undefined'||!S||!S.name) return null;
  return {name:S.name,level:rTry(()=>window.Sys.level.level(S),1),fc:rTry(()=>window.Sys.fc.compute(S,window.Sys.host),0),
    avatar:rTry(()=>window.Sys.appearance.avatarKey(S,window.Sys.host),S.hero==='kaia'?'kaia_phase0':'kael_phase0')}; }
function list(){ const cur=rCur(); const L=(R.list&&R.list.length?R.list:R_LOCAL).map(r=>Object.assign({},r));
  for(const r of L) if(r.id===cur&&!r.me) r.me=meLocal(); return L.sort((a,b)=>rNum(b.id)-rNum(a.id)); }
window.realmBadge=function(){ const cur=rCur(), r=list().find(x=>x.id===cur)||R_LOCAL[0]; return rLabel(r); };
const source=()=>{ const N=window.Sys&&window.Sys.net; if(!N) return null; if(typeof N.realms==='function') return ()=>N.realms(); if(typeof N._call==='function'&&rTry(()=>N.DATA.on===true,false)) return ()=>N._call('GET','/v1/realms'); return null; };
function load(redraw){ const src=source(); if(R.loading||R.list||!src) return; R.loading=true; let p=null; try{ p=src(); }catch(e){ p=null; }
  const done=()=>{ R.loading=false; if(redraw) redraw(); };
  if(!p||typeof p.then!=='function'){ if(Array.isArray(p)&&p.length) R.list=p; done(); return; }
  let to=null; try{ to=setTimeout(()=>{ if(R.loading){ R.err=true; done(); } },6000); }catch(e){}
  p.then(l=>{ const a=Array.isArray(l)?l:(l&&Array.isArray(l.realms)?l.realms:null); if(a&&a.length) R.list=a; R.err=false; },()=>{ R.err=true; })
   .then(()=>{ try{ clearTimeout(to); }catch(e){} if(R.loading) done(); }); }
const BADGE={new:['Novo','#5fd068','#0d2410'],recommended:['Recomendado','#ffc94a','#2a1403'],full:['Lotado','#ff6b6b','#2a0a08'],closed:['Fechado','#8a7458','#120d09']};
const badges=r=>{ const out=[]; if(r.state==='full') out.push(BADGE.full); else if(r.state==='closed') out.push(BADGE.closed); else if(r.state==='new') out.push(BADGE.new);
  if(r.recommended&&r.state!=='full'&&r.state!=='closed') out.push(BADGE.recommended); return out; };
const blocked=r=>(r.state==='full'||r.state==='closed')&&!r.me;
const fcText=v=>rTry(()=>window.Sys.fc.viewText(v),String(Math.round(+v||0)));
const dateText=ms=>{ if(!ms) return ''; try{ return new Date(ms).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}); }catch(e){ return ''; } };
function card(r,cur){ const on=r.id===cur, me=r.me, bl=blocked(r);
  const ava=me?`<span style="width:56px;height:56px;flex:none;border-radius:14px;overflow:hidden;border:2px solid ${on?'#ffc94a':'#6b5843'};background:#2a1f16"><img src="assets/hero/avatar/${rEsc(me.avatar||'kael_phase0')}.png" alt="" style="width:100%;height:100%;object-fit:cover"></span>`
    :`<span style="width:56px;height:56px;flex:none;border-radius:14px;border:2px dashed #6b5843;background:#16110d;display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8a7458" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></span>`;
  const info=me?`<span style="font-size:12px;font-weight:900;color:#f6ecdf;overflow-wrap:anywhere">${rEsc(me.name)} · Nv. ${me.level|0}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">FC ${rEsc(fcText(me.fc))}</span>`
    :`<span style="font-size:12px;font-weight:800;color:#c9b9a2">${bl?'Fechado para personagens novos':'Comece um herói aqui'}</span>`;
  const tags=badges(r).map(b=>`<span style="padding:1px 8px;border-radius:8px;background:${b[1]};color:${b[2]};font-size:10px;font-weight:900;white-space:nowrap">${b[0]}</span>`).join('')
    +(on?'<span style="padding:1px 8px;border-radius:8px;border:1px solid #ffc94a;color:#ffc94a;font-size:10px;font-weight:900;white-space:nowrap">Atual</span>':'');
  return `<button data-x="pick" data-id="${rEsc(r.id)}" ${bl?'aria-disabled="true"':''} aria-label="${rEsc(rLabel(r))}${on?', servidor atual':''}${me?', '+rEsc(me.name)+' nível '+(me.level|0):''}" style="width:100%;min-height:84px;display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#2c2116':'#1d1611'};color:#f6ecdf;text-align:left;box-sizing:border-box;cursor:pointer;${bl?'opacity:.6;':''}">
    ${ava}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
      <span class="lil" style="font-size:17px;color:${on?'#ffe07a':'#f6ecdf'};overflow-wrap:anywhere">${rEsc(rLabel(r))}</span>
      ${tags?`<span style="display:flex;gap:5px;flex-wrap:wrap">${tags}</span>`:''}${info}
      ${r.openedAt?`<span style="font-size:10px;font-weight:800;color:#8a7458">Aberto em ${rEsc(dateText(r.openedAt))}</span>`:''}</span>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="3" stroke-linecap="round" aria-hidden="true" style="flex:none"><polyline points="9 6 15 12 9 18"></polyline></svg></button>`; }
/* o desenho inteiro (string), igual nas duas entradas */
function html(o){ const first=!!(o&&o.first), cur=rCur(), L=list(), cf=R.cf&&L.find(r=>r.id===R.cf);
  const back=first?'':`<button data-x="back" aria-label="Voltar" style="flex:none;min-width:44px;height:44px;padding:0 12px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:13px;font-weight:900;cursor:pointer">Voltar</button>`;
  const note=R.err?'Sem conexão: mostrando o servidor deste aparelho.':!source()?(first?'':'Mais servidores aparecem aqui quando abrirem.'):R.loading?'Buscando servidores...':'';
  const confirm=cf?`<div data-x="cfno" aria-hidden="true" style="position:absolute;inset:0;background:rgba(0,0,0,.55);z-index:4"></div>
    <div role="dialog" aria-label="Trocar de servidor" style="position:absolute;left:12px;right:12px;top:50%;transform:translateY(-50%);padding:16px;border-radius:18px;background:#1d1611;border:2px solid #ffc94a;z-index:5;display:flex;flex-direction:column;gap:10px;text-align:center;box-sizing:border-box">
      <span class="lil" style="font-size:20px;color:#ffe07a;overflow-wrap:anywhere">Entrar no ${rEsc(rLabel(cf))}?</span>
      <span style="font-size:13px;font-weight:800;color:#f6ecdf;line-height:1.35">Cada servidor tem o seu próprio progresso. O seu herói daqui fica guardado do jeito que está.${cf.me?'':' Lá você começa um herói novo.'}</span>
      <div style="display:flex;gap:8px"><button data-x="cfno" style="flex:1;min-width:0;height:50px;border-radius:14px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-size:15px;font-weight:900;cursor:pointer">Cancelar</button>
        <button data-x="cfyes" class="lil rl-gold" style="flex:1;min-width:0;height:50px;border-radius:14px;font-size:17px;cursor:pointer">Entrar</button></div></div>`:'';
  const toast=R.toast&&Date.now()-R.toastT<1800?`<div role="status" style="position:absolute;left:12px;right:12px;top:64px;display:flex;justify-content:center;pointer-events:none;z-index:7"><span style="padding:8px 14px;border-radius:12px;background:rgba(14,10,7,.94);border:2px solid #ffc94a;font-size:13px;font-weight:900;color:#f6ecdf;text-align:center">${rEsc(R.toast)}</span></div>`:'';
  return `<div class="rl-root" style="position:relative;width:100%;height:100%;max-width:100%;overflow:hidden;display:flex;flex-direction:column;box-sizing:border-box">
    <div class="rl-scroll" style="flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;display:flex;flex-direction:column;gap:10px;padding:12px 12px 16px;box-sizing:border-box">
      <div style="display:flex;align-items:flex-start;gap:8px"><div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
        <span class="lil" style="font-size:22px;color:#f6ecdf;overflow-wrap:anywhere">${first?'Escolha o seu servidor':'Trocar servidor'}</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">${first?'Cada servidor é um mundo separado, com o seu ranking e a sua guilda. Você pode trocar depois, no Título ou nas Configurações.':'Cada servidor é um mundo separado, com o seu próprio progresso.'}</span></div>${back}</div>
      <div role="list" style="display:flex;flex-direction:column;gap:8px">${L.map(r=>card(r,cur)).join('')}</div>
      ${note?`<div style="font-size:12px;font-weight:800;color:${R.err?'#ff8a7a':'#8a7458'};text-align:center">${rEsc(note)}</div>`:''}</div>${confirm}${toast}</div>`; }
(function(){ if(typeof document==='undefined'||!document.head||(document.getElementById&&document.getElementById('rl_css'))) return; const st=document.createElement('style'); st.id='rl_css'; st.textContent=`
.rl-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;box-shadow:0 5px 0 #8a4f0c;border:0}.rl-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
.rl-root,.rl-root *{max-width:100%}.rl-scroll>*{flex-shrink:0}`; document.head.appendChild(st); })();
const toastMsg=(m,redraw)=>{ R.toast=m; R.toastT=Date.now(); redraw(); };
/* ação de um toque; o: {first, onDone, redraw, close} */
function act(a,id,o){ const L=list(), cur=rCur();
  if(a==='pick'){ const r=L.find(x=>x.id===id); rSnd('ui_tap'); if(!r) return;
    if(blocked(r)){ toastMsg(r.state==='closed'?'Servidor fechado para personagens novos':'Servidor lotado: escolha outro',o.redraw); return; }
    if(r.id===cur){ rSeen(); if(o.onDone) o.onDone(r.id); return; }
    R.cf=r.id; o.redraw(); }
  else if(a==='cfno'){ rSnd('ui_tap'); R.cf=null; o.redraw(); }
  else if(a==='cfyes'){ const to=R.cf; R.cf=null; rSnd('ui_tap'); rSeen();
    if(window.Realm&&typeof window.Realm.set==='function'){ try{ window.Realm.set(to); }catch(e){ toastMsg('Não deu para trocar agora',o.redraw); } } else toastMsg('Troca de servidor em breve',o.redraw); }
  else if(a==='back'){ rSnd('ui_tap'); R.cf=null; if(o.close) o.close(); else if(o.onDone) o.onDone(cur); } }
/* (1) entrada fora do Panels: Título / Login / 1º acesso */
function mount(el,opts){ const o=Object.assign({first:false,onDone:null},opts||{}); if(!el) return null; R.cf=null; R.toast='';
  const redraw=()=>{ el.innerHTML=html(o); }; o.redraw=redraw;
  const attr=(b,k)=>b.getAttribute?b.getAttribute(k):(b.dataset||{})[k==='data-x'?'x':'id'];
  const onClick=ev=>{ const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-x]'):null; if(!b) return; act(attr(b,'data-x'),attr(b,'data-id'),o); };
  try{ el.addEventListener('click',onClick); }catch(e){}
  redraw(); load(redraw);
  return {redraw,act:(a,id)=>act(a,id,o),destroy(){ try{ el.removeEventListener('click',onClick); }catch(e){} el.innerHTML=''; }}; }
window.RealmUI={mount,list,state:R,seenKey:SEEN};
/* (2) painel das Configurações (quando o Panels existir; este arquivo pode carregar antes dele) */
function addPanel(){ if(!window.Panels||typeof window.Panels.add!=='function') return false; if(addPanel.done) return true; addPanel.done=true;
  const po={first:false,onDone:()=>{ try{ window.Panels.close(); }catch(e){} },close:()=>{ try{ window.Panels.close(); }catch(e){} }};
  po.redraw=()=>{ try{ render(); }catch(e){} };
  window.Panels.add('realm',{title:'Servidor',
    render(){ const d=rTry(()=>xDims(240),{s:1}), h=html(po); V.innerHTML=rTry(()=>xWrap(d,'',h),h); load(po.redraw); },
    click(b){ act(b.dataset.x,b.dataset.id,po); },
    onOpen(){ R.cf=null; R.toast=''; R.err=false; } });
  return true; }
if(!addPanel()){ let n=0; const t=setInterval(()=>{ if(addPanel()||++n>200) clearInterval(t); },50); }
})();
