'use strict';
/* ================= 04c MISSÃO GUIA NA BATALHA — rastreador, nasce DESLIGADO (PANEL_ON.guidehud) =================
   Protótipo: docs/proto/BatalhaTelaCheiaV2.dc.html (".trk": sob a barra de fase, x 76 a 312, y 124 a 172 na base de 390; recolhe num selo de 48 px com o contador).
   NENHUMA regra aqui: missão da vez, progresso, prêmio e destino vêm de Sys.guide.current(S); resgatar = Sys.guide.claim(S, Sys.host) (entrega pelo Sys.loot).
   Some inteiro (nada no DOM visível, sem espaço vazio) quando Sys.guide.DATA.on é false ou não há missão da vez.
   Contrato com o engenheiro (Q-14): PGuide.mount(elementoPai) cria o rastreador dentro do contêiner da batalha (position:absolute; o pai precisa ser position:relative/absolute e
   estar na base de 390 px); PGuide.update() relê Sys.guide e só mexe no DOM se algo mudou (chamar a cada ~0,5 s, junto do HUD); PGuide.destroy() remove.
   Também registrado como overlay: Panels.open('guidehud', {parent}) monta; Panels.add(...).close() desmonta.
   Toque no rastreador: missão em andamento = vai para o destino (battle: nada a fazer, já está lá; gear/summon/shop: setView; tela registrada: Screens.open; senão aviso);
   missão cumprida = resgata. O botão ‹ recolhe; o selo expande. Sem emoji: ícone de pergaminho = assets/icons/menu/missions.png; gema/moeda = assets/ui. */
const XGU={root:null,sig:'',min:false,msg:'',msgT:0,id:'',n:0};
const GU_CSS=`.pgd{position:absolute;left:76px;top:124px;height:48px;border-radius:15px;display:flex;align-items:stretch;overflow:hidden;box-sizing:border-box;z-index:30;background:rgba(20,15,11,.82);border:1px solid rgba(255,236,200,.22);box-shadow:0 4px 12px rgba(0,0,0,.45);color:#f6ecdf;font-family:Nunito,system-ui,sans-serif}
.pgd.full{width:236px}.pgd.mini{width:48px}
.pgd button{font-family:inherit;cursor:pointer}
.pgd-main{flex:1;min-width:0;height:48px;padding:0 4px 0 6px;border:0;background:none;color:#f6ecdf;display:flex;align-items:center;gap:6px;text-align:left}
.pgd-main:active{background:rgba(255,201,74,.12)}
.pgd-col{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
.pgd-txt{font-size:11.5px;line-height:13px;font-weight:900;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px #000}
.pgd-row{display:flex;align-items:center;justify-content:space-between;gap:5px}
.pgd-bar{flex:1;height:6px;border-radius:3px;background:rgba(0,0,0,.6);overflow:hidden}
.pgd-sc{width:34px;height:34px;object-fit:contain;flex:none}
.pgd-x{width:44px;height:48px;padding:0;border:0;border-left:1px solid rgba(255,236,200,.14);background:none;color:#ffe2a8;display:flex;align-items:center;justify-content:center;flex:none}
.pgd-mini{position:relative;width:48px;height:48px;padding:0;border:0;background:none;display:flex;align-items:center;justify-content:center}
.pgd-bdg{position:absolute;right:0;top:2px;min-width:18px;height:16px;border-radius:8px;background:#3a8a38;color:#fff;font-size:10px;font-weight:900;line-height:16px;text-align:center;padding:0 3px;box-sizing:border-box}
.pgd.done{border-color:rgba(255,201,74,.75);animation:pgdh 1.2s ease-in-out infinite}
.pgd.done .pgd-txt{color:#ffe07a}.pgd.done .pgd-bdg{background:#e08a1a}
.pgd.in{animation:pgdi .32s cubic-bezier(.2,.9,.25,1) both}.pgd.done.in{animation:pgdh 1.2s ease-in-out infinite}
@keyframes pgdi{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:none}}
@keyframes pgdh{0%,100%{box-shadow:0 0 0 0 rgba(255,201,74,.0),0 4px 12px rgba(0,0,0,.45)}50%{box-shadow:0 0 12px 2px rgba(255,201,74,.55),0 4px 12px rgba(0,0,0,.45)}}
.pgd-arrow{animation:pgda 1.4s ease-in-out infinite;flex:none}
@keyframes pgda{0%,100%{transform:translateX(0)}50%{transform:translateX(3px)}}
@media (prefers-reduced-motion:reduce){.pgd.done,.pgd.in,.pgd-arrow{animation:none}}`;
const GU_GO={gear:1,summon:1,shop:1};
const guOk=()=>!!(window.Sys&&Sys.guide&&Sys.guide.DATA&&Sys.guide.DATA.on&&Sys.guide.current);
const guEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function guInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pgd_css')) return; const st=document.createElement('style'); st.id='pgd_css'; st.textContent=GU_CSS; document.head.appendChild(st); }
const guToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const guSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
function guFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
/* ícone do prêmio: gemas, senão ouro; outros materiais por texto curto */
function guRwImg(r){ if(r&&r.gems) return 'assets/ui/gem.png'; if(r&&(r.gold||r.goldk)) return 'assets/ui/coin.png'; return 'assets/icons/menu/missions.png'; }
function guRwText(r){ if(!r||typeof r!=='object') return ''; const a=[]; if(r.gems) a.push(r.gems+' gemas'); if(r.gold) a.push(guFmt(r.gold)+' de ouro'); if(r.goldk) a.push('ouro ×'+r.goldk); if(r.stones||r.forge) a.push((r.stones||r.forge)+' pedras'); if(r.essence) a.push(r.essence+' Essência'); if(r.food) a.push(r.food+' ração'); return a.join(' · '); }
function guGot(g){ if(!g||typeof g!=='object') return 'Recompensa recebida'; const a=[]; if(g.gold) a.push(guFmt(g.gold)+' moedas'); if(g.gems) a.push(g.gems+' gemas'); for(const k of ['stones','forge','food','essence']) if(g[k]) a.push(g[k]+' '+({stones:'pedras',forge:'pedras',food:'ração',essence:'Essência'})[k]); if(g.items&&g.items.length) a.push(g.items.length+(g.items.length>1?' itens':' item')); if(g.eggs&&g.eggs.length) a.push(g.eggs.length+(g.eggs.length>1?' ovos':' ovo')); return a.join(' · ')||'Recompensa recebida'; }
function guCur(){ try{ return guOk()?Sys.guide.current(S):null; }catch(e){ return null; } }
function guHtml(c){
  const done=!!c.done, pct=Math.max(0,Math.min(100,Math.round(c.cur/Math.max(1,c.max)*100))), cnt=guFmt(c.cur)+'/'+guFmt(c.max), rw=guRwText(c.reward), img=guRwImg(c.reward);
  const label='Missão guia: '+c.text+'. '+(done?'Cumprida: toque para resgatar. ':'Progresso '+c.cur+' de '+c.max+'. Toque para ir. ')+(rw?'Prêmio: '+rw+'.':'');
  if(XGU.min) return `<button class="pgd-mini" data-x="expand" aria-label="Expandir missão guia: ${guEsc(c.text)}, ${guEsc(cnt)}" aria-expanded="false"><img class="pgd-sc" src="assets/icons/menu/missions.png" alt=""><span class="pgd-bdg">${guEsc(cnt)}</span></button>`;
  const sub=XGU.msg?XGU.msg:(done?'Toque para resgatar':'');
  return `<button class="pgd-main" data-x="${done?'claim':'go'}" aria-label="${guEsc(label)}"><img class="pgd-sc" src="assets/icons/menu/missions.png" alt=""><span class="pgd-col"><span class="pgd-txt">${guEsc(XGU.msg||(done?'Concluída!':c.text))}</span><span class="pgd-row">${done||XGU.msg?`<span style="display:block;width:100px;font-size:10.5px;font-weight:900;color:#ffe07a;white-space:nowrap;overflow:hidden">${guEsc(done?'Resgatar':sub)}</span>`:`<span style="width:100px;display:flex;align-items:center;gap:5px"><span class="pgd-bar"><span style="display:block;width:${pct}%;height:100%;background:linear-gradient(90deg,#3fae3c,#7ee27a);transition:width .4s"></span></span><span style="font-size:10.5px;font-weight:900;color:#e8dccb;white-space:nowrap">${guEsc(cnt)}</span></span>`}<img src="${img}" alt="" style="width:16px;height:16px;object-fit:contain;flex:none"></span></span><svg class="pgd-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffe2a8" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"></path></svg></button><button class="pgd-x" data-x="collapse" aria-label="Recolher missão guia" aria-expanded="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg></button>`; }
function guUpdate(force){
  const el=XGU.root; if(!el) return; const c=guCur();
  if(!c){ if(XGU.sig!=='off'||force){ XGU.sig='off'; el.innerHTML=''; el.style.display='none'; } return; }
  const sig=[c.id,c.cur,c.max,c.done,XGU.min,XGU.msg].join('|'); if(sig===XGU.sig&&!force) return;
  const fresh=c.id!==XGU.id; XGU.id=c.id; XGU.sig=sig; el.style.display='flex'; el.className='pgd '+(XGU.min?'mini':'full')+(c.done?' done':'')+(fresh?' in':''); el.innerHTML=guHtml(c); }
function guClick(ev){
  const b=ev&&ev.target&&ev.target.closest?ev.target.closest('[data-x]'):null; if(!b||!guOk()) return; const a=b.dataset.x;
  if(a==='collapse'){ guSnd('ui_tap'); XGU.min=true; guUpdate(true); return; }
  if(a==='expand'){ guSnd('ui_tap'); XGU.min=false; guUpdate(true); return; }
  if(a==='claim'){ const r=Sys.guide.claim(S,Sys.host); if(!r||!r.ok){ guSnd('ui_tap'); guToast('Esta missão ainda não foi cumprida'); guUpdate(true); return; }
    guSnd('claim'); try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){}
    guToast('Recompensa: '+guGot(r.got)); XGU.msg='Recompensa enviada!'; guUpdate(true); clearTimeout(XGU.msgT); XGU.msgT=setTimeout(()=>{ XGU.msg=''; guUpdate(true); },1400); return; }
  if(a==='go'){ guSnd('ui_tap'); const c=guCur(), g=c&&c.goto; if(!g||g==='battle') return;   /* já está na batalha */
    if(GU_GO[g]&&typeof setView==='function'){ setView(g); return; }
    if(window.Screens&&Screens.reg&&Screens.reg[g]){ Screens.open(g); return; }
    guToast('Esta tela abre mais adiante'); return; }
}
const PGuide={
  mount(parent){ if(typeof document==='undefined') return null; guInject(); const host=parent||document.getElementById('app')||document.body; if(!host) return null;
    PGuide.destroy(); const el=document.createElement('div'); el.id='pgd_root'; el.className='pgd full'; el.style.display='none'; el.addEventListener('click',guClick); host.appendChild(el);
    XGU.root=el; XGU.sig=''; XGU.id=''; guUpdate(true); return el; },
  update(){ guUpdate(false); },
  destroy(){ const el=XGU.root; clearTimeout(XGU.msgT); XGU.msg=''; XGU.sig=''; XGU.id=''; if(el&&el.parentNode&&el.parentNode.removeChild) el.parentNode.removeChild(el); XGU.root=null; },
  state:XGU };
window.PGuide=PGuide;
Panels.add('guidehud',{title:'Missão guia',overlay:true,open(o){ return !!PGuide.mount(o&&o.parent); },close(){ PGuide.destroy(); } });
