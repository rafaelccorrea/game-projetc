'use strict';
/* ================= 21 PERFIL E COLEÇÃO — tela nova, nasce DESLIGADA (PANEL_ON.profile) =================
   Protótipo: docs/proto/Perfil.dc.html. NENHUMA regra aqui. Dados reais:
   cartão: Sys.level.level (nível), Sys.fc.compute (FC), Sys.vip.level (VIP), eras liberadas (host.eraMax), título em destaque (Sys.titles.featured);
   Títulos: Sys.titles.DATA.titles + isUnlocked / progress / condLabel / bonusText / setFeatured (equipar = destacar; o bônus do destaque vale em dobro, é do módulo);
   Estatísticas: Sys.titles.current(S, host, tipo) (abates, chefes, torre, pets) e S.eraMax; Coleção: títulos conquistados / total.
   Sem emoji. Kael parado = assets/anim/hyb/R/kael_idle_era2_t0.png.
   NÃO EXISTEM em nenhum módulo (ficam atrás de chaves desligadas, lidas de funções isoladas que hoje devolvem null; sem espaço vazio):
   - Molduras (P_PROFILE.frames), Auras (P_PROFILE.auras) e Asas (P_PROFILE.wings) escolhíveis, com posse e origem; estatísticas de conta (P_PROFILE.stats: maior dano, tempo jogado);
   - ID da conta e "copiar ID"; raridade dos títulos (o módulo não classifica).
   Contrato esperado (ajustar quando Sistemas mandar a API):
   readFrames()/readAuras()/readWings() → {equipped:id, list:[{id, name, rar, own, how, org?}], equip(id) → {ok}} · readStats() → [{label, val, sub?, pct?}]
   Equipar título chama statsChanged() (o aviso de poder é do jogo, não desta tela). Pedido Q-12 (reports/pedidos-entre-agentes.md). */
const XPR={tab:'tit',filter:'all',pv:null,flash:''};
const PR_MINH=600;
const PR_CSS=`.pr2-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pr2k 1s steps(12,jump-none) infinite}
@keyframes pr2k{from{background-position:0 0}to{background-position:100% 0}}
.pr2-row{animation:pr2r .3s ease-out both}
@keyframes pr2r{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.pr2-btn{border:0;border-radius:12px;font-weight:900;font-size:14px;min-width:92px;min-height:46px;padding:0 10px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pr2-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pr2-btn.on{background:#1f3a22;color:#9ff0a8;box-shadow:none;border:2px solid #5fd068}
.pr2-btn.ghost{background:#33271d;color:#f6ecdf;border:2px solid #6b5843;box-shadow:none}
@media (prefers-reduced-motion:reduce){.pr2-kid,.pr2-row{animation:none}}`;
const PR_TABS=[['tit','Títulos'],['frm','Molduras'],['aur','Auras'],['wng','Asas'],['sta','Estatíst.']];
/* leitores isolados (hoje não há módulo: devolvem null). A chave liga o bloco E exige o leitor definido em window.P_PROFILE. */
window.P_PROFILE=window.P_PROFILE||{frames:false,auras:false,wings:false,stats:false};
const pr2Read=(k,fn)=>{ try{ const p=window.P_PROFILE; if(!p||!p[k]||typeof p[fn]!=='function') return null; return p[fn](); }catch(e){ return null; } };
const pr2Frames=()=>pr2Read('frames','readFrames'), pr2Auras=()=>pr2Read('auras','readAuras'), pr2Wings=()=>pr2Read('wings','readWings'), pr2Stats=()=>pr2Read('stats','readStats');
const pr2Ok=()=>!!(window.Sys&&Sys.titles&&Sys.titles.DATA&&Sys.titles.progress);
const pr2Esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function pr2Fmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
/* o texto de condição do módulo traz uma estrela (símbolo gráfico): a tela mostra "estrelas" (regra: sem emoji/símbolo) */
/* retrato do herói na fase e com chapéu/óculos/máscara (js/avatar.js); sem o arquivo, o Kael parado de antes */
const pr2Av=sz=>typeof avatarTag==='function'?avatarTag(sz,'position:absolute;left:0;top:0','Seu retrato'):'<div class="pr2-kid" style="position:absolute;left:-8px;top:-8px;width:112px;height:112px"></div>';
const pr2Txt=x=>String(x==null?'':x).replace(/\s*★/g,' estrelas');
const pr2N=v=>Math.round(v||0).toLocaleString('pt-BR');
function pr2Inject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pr2_css')) return; const st=document.createElement('style'); st.id='pr2_css'; st.textContent=PR_CSS; document.head.appendChild(st); }
const pr2Toast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const pr2Snd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const pr2Changed=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const pr2Era=e=>{ try{ return (ERAS[e]&&ERAS[e].n)||('Era '+(e+1)); }catch(x){ return 'Era '+(e+1); } };
function pr2Info(){ const I={lvl:null,fc:null,vip:null,era:0};
  try{ I.lvl=Sys.level&&Sys.level.level?Sys.level.level(S):null; }catch(e){}
  try{ I.fc=Sys.fc&&Sys.fc.compute?Sys.fc.compute(S,Sys.host):null; }catch(e){}
  try{ I.vip=Sys.vip&&Sys.vip.level?Sys.vip.level(S):null; }catch(e){}
  try{ I.era=Math.max(0,Math.floor((Sys.host&&Sys.host.eraMax&&Sys.host.eraMax())||0),Math.floor(S.eraMax||0)); }catch(e){}
  return I; }
function pr2Rows(){ const T=Sys.titles, o=T.ensure(S), feat=T.featured(S), out=T.DATA.titles.map(t=>{ const p=T.progress(S,Sys.host,t), own=T.isUnlocked(S,t.id); return {t,p,own,eq:!!(feat&&feat.id===t.id),cos:!!t.cosmetic}; });
  return out.sort((a,b)=>(b.eq-a.eq)||((b.own?1:0)-(a.own?1:0))||0); }
function pr2Card(I,show){ const feat=Sys.titles.featured(S), tt=show?show.name:(feat?feat.name:'Sem título');
  const chip=(l,v)=>`<span style="display:flex;flex-direction:column;align-items:center;line-height:1.1;min-width:0"><span style="font-size:10px;font-weight:800;color:#c9b9a2">${l}</span><span style="font-family:'Lilita One',sans-serif;font-size:16px;color:#ffe07a;white-space:nowrap">${v}</span></span>`;
  return `<div style="flex:none;display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:16px;background:linear-gradient(180deg,#3a2810,#1d1611);border:2px solid #8a6a3a;box-sizing:border-box">
    <div aria-hidden="true" style="flex:none;width:96px;height:96px;border-radius:14px;background:#16110d;border:2px solid #4a3a2b;position:relative;overflow:hidden">${pr2Av(92)}</div>
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px"><span style="font-family:'Lilita One',sans-serif;font-size:22px;line-height:1">Kael</span>
      <span style="font-size:13px;font-weight:900;color:#ffe07a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" aria-label="Título">${pr2Esc(tt)}${show?' <small style="color:#c9b9a2">(prévia)</small>':''}</span>
      <div style="display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:space-between">${chip('Nível',I.lvl==null?'—':I.lvl)}${chip('FC',I.fc==null?'—':pr2Fmt(I.fc))}${chip('Era',pr2Esc(pr2Era(I.era)))}${I.vip?chip('VIP',I.vip):''}</div></div></div>`; }
function pr2TitleRow(r,i){ const T=Sys.titles, t=r.t, cond=pr2Txt(T.condLabel(S,Sys.host,t)), bon=T.bonusText(t,r.eq?T.DATA.featuredMult:1), p=r.p;
  const prog=!r.own&&p&&p.need?` (${pr2N(Math.min(p.cur,p.need))}/${pr2N(p.need)})`:'';
  const btn=r.eq?`<button data-x="noop" class="pr2-btn on" aria-label="Equipado: ${pr2Esc(t.name)}">Equipado</button>`:r.own?`<button data-x="equip" data-id="${pr2Esc(t.id)}" class="pr2-btn" aria-label="Equipar ${pr2Esc(t.name)}">Equipar</button>`:`<button data-x="pv" data-id="${pr2Esc(t.id)}" class="pr2-btn ghost" aria-label="Ver prévia de ${pr2Esc(t.name)}">${XPR.pv===t.id?'Em prévia':'Prévia'}</button>`;
  return `<div class="pr2-row" style="animation-delay:${Math.min(i,12)*.035}s;flex:none;min-height:74px;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#1d1611;border:2px ${r.own?'solid':'dashed'} ${r.eq?'#ffc94a':r.own?'#8a6a3a':'#4a3a2b'};box-sizing:border-box;opacity:${r.own?1:.85}">
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.15"><span style="font-size:15px;font-weight:900;color:${r.own?'#f6ecdf':'#c9b9a2'}">${pr2Esc(t.name)}</span>
      <span style="font-size:12px;font-weight:900;color:${r.cos?'#c9b9a2':'#7ef08a'}">${pr2Esc(r.cos?'Cosmético':bon)}</span>
      <span style="font-size:11px;font-weight:800;color:#c9b9a2">${r.own?'Conquistado: ':''}${pr2Esc(cond)}${prog}</span></span>${btn}</div>`; }
function pr2Tabs(frm,aur,wng){ const tabs=PR_TABS.filter(t=>t[0]==='tit'||t[0]==='sta'||(t[0]==='frm'&&frm)||(t[0]==='aur'&&aur)||(t[0]==='wng'&&wng));
  return `<div role="tablist" aria-label="Seções do perfil" style="flex:none;display:flex;gap:4px">${tabs.map(t=>{ const on=XPR.tab===t[0]; return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${t[0]}" style="flex:1;min-width:0;height:46px;border-radius:11px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#4a3420':'#241b14'};color:${on?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:13px;padding:0">${t[1]}</button>`; }).join('')}</div>`; }
function pr2Look(L,kind,label){ if(!L||!Array.isArray(L.list)) return '';
  return L.list.map((x,i)=>{ const eq=L.equipped===x.id, own=!!x.own; return `<div class="pr2-row" style="animation-delay:${i*.04}s;flex:none;min-height:64px;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:#1d1611;border:2px ${own?'solid':'dashed'} ${eq?'#ffc94a':own?'#8a6a3a':'#4a3a2b'};box-sizing:border-box"><span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.15"><span style="font-size:15px;font-weight:900">${pr2Esc(x.name)}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">${pr2Esc(own?(x.org||''):(x.how||''))}</span></span>${own?`<button data-x="lookeq" data-k="${kind}" data-id="${pr2Esc(x.id)}" class="pr2-btn${eq?' on':''}" aria-label="${eq?'Em uso':'Usar'}: ${pr2Esc(x.name)}">${eq?'Em uso':'Usar'}</button>`:`<span style="flex:none;min-width:92px;text-align:center;font-size:12px;font-weight:900;color:#9c8d7a">Bloqueada</span>`}</div>`; }).join(''); }
function pr2Stat(l,v,sub,pct){ return `<div class="pr2-row" style="flex:none;min-height:60px;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:8px 12px;border-radius:14px;background:#1d1611;border:2px solid #4a3a2b;box-sizing:border-box"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><span style="font-size:13px;font-weight:900;color:#c9b9a2">${pr2Esc(l)}</span><span style="font-family:'Lilita One',sans-serif;font-size:18px;color:#ffe07a;white-space:nowrap">${pr2Esc(v)}</span></div>${pct!=null?`<span role="img" aria-label="${pr2Esc(l)}: ${pct}%" style="position:relative;height:8px;border-radius:4px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${Math.max(0,Math.min(100,pct))}%;background:linear-gradient(90deg,#c9973a,#ffe07a)"></span></span>`:''}${sub?`<span style="font-size:11px;font-weight:800;color:#c9b9a2">${pr2Esc(sub)}</span>`:''}</div>`; }
function pr2Cur(t){ try{ return Sys.titles.current(S,Sys.host,t); }catch(e){ return null; } }
function pr2StatsHtml(){ const T=Sys.titles, I=pr2Info(), a=[], rows=pr2Rows(), own=rows.filter(r=>r.own).length, tot=rows.length;
  const add=(l,t,fn)=>{ const v=pr2Cur(t); if(v!=null) a.push(pr2Stat(l,fn?fn(v):pr2N(v))); };
  add('Inimigos derrotados','kills'); add('Chefes derrotados','boss'); a.push(pr2Stat('Eras liberadas',(I.era+1)+'/9','Agora na '+pr2Era(I.era),Math.round((I.era+1)/9*100))); add('Andar da torre (recorde)','tower'); add('Pets','pets');
  const ex=pr2Stats(); if(ex) for(const x of ex) a.push(pr2Stat(x.label,x.val,x.sub,x.pct));
  const col=`<div class="pr2-row" style="flex:none;padding:8px 12px;border-radius:14px;background:#2a1f16;border:2px solid #8a6a3a;box-sizing:border-box;display:flex;flex-direction:column;gap:4px"><span style="font-family:'Lilita One',sans-serif;font-size:16px">Coleção</span>${pr2Stat('Títulos',own+'/'+tot,Math.round(own/Math.max(1,tot)*100)+'% da categoria',Math.round(own/Math.max(1,tot)*100))}</div>`;
  return a.join('')+col; }
function scrProfile(){
  pr2Inject(); const d=xDims(PR_MINH);
  if(!pr2Ok()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Perfil indisponível agora.</div>`); return; }
  const frm=pr2Frames(), aur=pr2Auras(), wng=pr2Wings(); if((XPR.tab==='frm'&&!frm)||(XPR.tab==='aur'&&!aur)||(XPR.tab==='wng'&&!wng)) XPR.tab='tit';
  const I=pr2Info(), rows=pr2Rows(); let show=null; if(XPR.pv){ const r=rows.find(x=>x.t.id===XPR.pv); show=r&&!r.own?r.t:null; if(!show) XPR.pv=null; }
  let body='';
  if(XPR.tab==='tit'){ const fl=[['all','Todos'],['own','Possuídos'],['lock','Bloqueados']];
    const list=rows.filter(r=>XPR.filter==='all'||(XPR.filter==='own'?r.own:!r.own));
    body=`<div role="group" aria-label="Filtro" style="flex:none;display:flex;gap:6px">${fl.map(f=>`<button data-x="filter" data-f="${f[0]}" aria-pressed="${XPR.filter===f[0]}" style="flex:1;height:44px;border-radius:10px;border:2px solid ${XPR.filter===f[0]?'#ffc94a':'#4a3a2b'};background:${XPR.filter===f[0]?'#4a3420':'#241b14'};color:${XPR.filter===f[0]?'#ffe07a':'#c9b9a2'};font-size:13px;font-weight:900;padding:0">${f[1]}</button>`).join('')}</div>`+(list.length?list.map(pr2TitleRow).join(''):`<div role="note" style="padding:20px;text-align:center;font-weight:800;color:#c9b9a2">Nenhum título aqui.</div>`); }
  else if(XPR.tab==='frm') body=pr2Look(frm,'frame','Moldura'); else if(XPR.tab==='aur') body=pr2Look(aur,'aura','Aura'); else if(XPR.tab==='wng') body=pr2Look(wng,'wing','Asa'); else body=pr2StatsHtml();
  V.innerHTML=xWrap(d,'',`<div style="flex:none;padding:4px 2px 6px;display:flex;flex-direction:column;gap:8px">${pr2Card(I,show)}${pr2Tabs(!!frm,!!aur,!!wng)}</div>
    <div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 10px">${body}</div>
    <div style="flex:none;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="back" class="pr2-btn ghost" style="width:100%;min-height:52px;font-size:16px">Voltar</button></div>`);
}
function pr2Click(b){
  const a=b.dataset.x;
  if(a==='back'){ pr2Snd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(a==='noop'){ pr2Snd('ui_tap'); return; }
  if(a==='tab'){ XPR.tab=b.dataset.t; XPR.pv=null; pr2Snd('ui_tap'); render(); return; }
  if(a==='filter'){ XPR.filter=b.dataset.f; pr2Snd('ui_tap'); render(); return; }
  if(!pr2Ok()) return;
  if(a==='pv'){ XPR.pv=b.dataset.id; pr2Snd('ui_tap'); render(); return; }
  if(a==='equip'){ const id=b.dataset.id; if(!Sys.titles.setFeatured(S,id)){ pr2Snd('ui_tap'); pr2Toast('Você ainda não conquistou este título'); return; } XPR.pv=null; pr2Snd('claim'); pr2Changed(); const t=Sys.titles.DATA.titles.find(x=>x.id===id); pr2Toast('Título equipado: '+(t?t.name:'')); render(); return; }
  if(a==='lookeq'){ const k=b.dataset.k, L=k==='frame'?pr2Frames():k==='aura'?pr2Auras():k==='wing'?pr2Wings():null; const r=L&&L.equip?L.equip(b.dataset.id):null; if(!r||!r.ok){ pr2Snd('ui_tap'); pr2Toast('Não foi possível usar agora'); return; } pr2Snd('claim'); pr2Changed(); render(); return; }
}
Panels.add('profile',{title:'Perfil e Coleção',render:scrProfile,click:pr2Click,onOpen(o){ XPR.tab=(o&&o.tab)||'tit'; XPR.filter='all'; XPR.pv=null; },onClose(){ XPR.pv=null; } });
