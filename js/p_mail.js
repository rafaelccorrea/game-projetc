'use strict';
/* ================= 31 CORREIO — tela nova, nasce DESLIGADA (PANEL_ON.mail) =================
   Protótipo: docs/proto/Correio.dc.html. NENHUMA regra aqui: caixa de entrada = Sys.mail.inbox(S, host); abrir = Sys.mail.read; coletar = Sys.mail.claim / claimAll
   (a entrega é do Sys.loot.grantBundle: portões e itens guardados valem); apagar = Sys.mail.remove (só sem anexo pendente); não lidas = Sys.mail.unread.
   Chave do módulo: Sys.mail.DATA.enabled (desligada até o dono liberar): sem ela a tela diz que o Correio ainda não está ativo e só oferece Voltar.
   Sem emoji: moeda e gema = assets/ui; o resto é texto/SVG de traço.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (para não mostrar dado falso):
   - o módulo não guarda remetente nem tipo da carta: o ícone é o do sistema e a linha mostra só a data; nada de "Arena/Ranking/Evento" inventado;
   - "carta sem anexo some 7 dias depois de lida" não existe no módulo (tudo expira em Sys.mail.DATA.expireDays dias): a tela só mostra o prazo real;
   - o anexo é mostrado pelo que o pacote tem (ouro, gemas, materiais, itens, ovos, skin, fragmentos de pet), sem raridade inventada;
   - sem animação de voo dos anexos até o cabeçalho: o resultado vem no aviso "Coletado: ...".
   Pedido Q-10 (reports/pedidos-entre-agentes.md): carregar este script, ligar PANEL_ON.mail e um item/ícone de Correio no MENU. */
const XMA={tab:0,open:null,conf:false};
const MA_MINH=560;
const MA_CSS=`.pa-row{animation:par .3s ease-out both}
@keyframes par{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
.pa-pop{animation:pap .3s cubic-bezier(.2,1.3,.4,1) both}
@keyframes pap{from{transform:scale(.8);opacity:0}to{transform:none;opacity:1}}
.pa-bob{animation:pab 1.4s ease-in-out infinite}
@keyframes pab{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.pa-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 14px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pa-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pa-btn.sec{background:#33271d;color:#f6ecdf;border:2px solid #6b5843;box-shadow:none}
.pa-btn.off{background:#3a3128;color:#9c8d7a;box-shadow:none}
@media (prefers-reduced-motion:reduce){.pa-row,.pa-pop,.pa-bob{animation:none}}`;
const MA_TABS=['Todas','Não lidas','Com anexo'];
const MA_ICO='M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1z M15 9a4 4 0 0 1 0 6 M18 6a8 8 0 0 1 0 12';
const maOk=()=>!!(window.Sys&&Sys.mail&&Sys.mail.inbox&&Sys.mail.claim);
const maOn=()=>!!(maOk()&&Sys.mail.DATA&&Sys.mail.DATA.enabled);
const maEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function maFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
const maIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||18)+'px;height:'+(z||18)+'px;vertical-align:-4px;object-fit:contain">';
function maInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pa_css')) return; const st=document.createElement('style'); st.id='pa_css'; st.textContent=MA_CSS; document.head.appendChild(st); }
const maToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const maSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const maChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const maRar=r=>{ try{ return RAR[r].n; }catch(e){ return ''; } };
const maNow=()=>{ try{ return (Sys.host&&Sys.host.now&&Sys.host.now())||Date.now(); }catch(e){ return Date.now(); } };
function maDate(at){ const d=new Date(at), n=new Date(maNow()), a=Date.UTC(n.getFullYear(),n.getMonth(),n.getDate()), b=Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()), ago=Math.round((a-b)/86400000), hh=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  return (ago<=0?'hoje':ago===1?'ontem':'há '+ago+' dias')+(ago<=1?' '+hh:''); }
/* anexos pelo que o pacote tem de verdade: [{img|txt, q}] */
const MA_MAT={stones:'Pedra de forja',forge:'Pedra de forja',food:'Ração',essence:'Essência'};
function maAtts(att){ if(!att||typeof att!=='object') return []; const a=[];
  if(att.gold) a.push({img:'coin',n:'Moedas',q:att.gold}); if(att.goldk) a.push({txt:'Ouro ×'+att.goldk,n:'Ouro',q:0}); if(att.gems) a.push({img:'gem',n:'Gemas',q:att.gems});
  for(const k in MA_MAT) if(att[k]) a.push({txt:MA_MAT[k],n:MA_MAT[k],q:att[k]});
  for(const it of Array.isArray(att.items)?att.items:[]) a.push({txt:(it.slot==='weapon'?'Arma':it.slot==='armor'?'Armadura':'Item')+' '+maRar(it.r),n:'Item',q:0});
  for(const r of Array.isArray(att.eggs)?att.eggs:[]) a.push({txt:'Ovo '+maRar(r),n:'Ovo',q:0});
  if(att.skin) a.push({txt:'Skin',n:'Skin',q:0}); if(att.petFrags&&typeof att.petFrags==='object') for(const id in att.petFrags) a.push({txt:'Fragmento de pet',n:'Fragmento',q:att.petFrags[id]});
  return a; }
const maQ=q=>q>1?(q>=1000?maFmt(q):'×'+q):'';
function maChip(x,done){ const art=x.img?maIc(x.img,28):`<span style="font-size:11px;font-weight:900;text-align:center;line-height:1.05;padding:0 2px">${maEsc(x.txt)}</span>`;
  return `<span role="img" aria-label="${maEsc(x.n)}${x.q>1?' '+x.q:''}${done?', coletado':''}" style="flex:none;min-width:44px;height:44px;border-radius:10px;background:#16110d;border:2px solid ${done?'#4a3a2b':'#8a6a3a'};box-sizing:border-box;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;padding:0 4px;opacity:${done?.55:1}">${art}${x.q>1?`<b style="font-size:10px;color:#ffe07a">${maQ(x.q)}</b>`:''}</span>`; }
function maExp(m){ if(!m.hasAtt) return {t:'sem anexo',c:'#8a7a68',long:'Sem anexo'}; if(m.claimed) return {t:'coletado',c:'#7ef08a',long:'Anexos coletados'};
  const l=m.daysLeft, t=l<=1?'expira amanhã':'expira em '+l+' dias'; return {t,c:l<=2?'#ff7a5a':'#ffe07a',long:'Anexos '+(l<=1?'expiram amanhã':'expiram em '+l+' dias')+' · colete antes'}; }
const maPend=m=>m.hasAtt&&!m.claimed;
function maIcon(pend){ return `<span class="${pend?'pa-bob':''}" aria-hidden="true" style="flex:none;width:44px;height:44px;border-radius:12px;background:linear-gradient(180deg,#5a7a9a,#2a3a4a);display:flex;align-items:center;justify-content:center"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#e0f0ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${MA_ICO}"></path></svg></span>`; }
function maRow(m,i){ const unread=!m.read, e=maExp(m), atts=maAtts(m.att);
  return `<button data-x="open" data-id="${m.id}" class="pa-row" aria-label="${unread?'Não lida. ':''}${maEsc(m.title)}. ${maEsc(maDate(m.at))}. ${maEsc(e.t)}" style="animation-delay:${i*.05}s;flex:none;min-height:68px;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:14px;background:${unread?'#2a2016':'#1d1611'};border:2px solid ${unread?'#ffc94a':'#4a3a2b'};box-sizing:border-box;text-align:left;color:#f6ecdf;width:100%">
    ${maIcon(maPend(m))}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.15"><span style="font-size:14px;font-weight:${unread?900:700};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${maEsc(m.title)}</span>
      <span style="font-size:11px;font-weight:800;color:#c9b9a2">${maEsc(maDate(m.at))}</span>
      ${atts.length?`<span style="display:flex;flex-wrap:wrap;gap:4px">${atts.slice(0,3).map(x=>maChip(x,m.claimed)).join('')}</span>`:''}</span>
    <span style="flex:none;font-size:11px;font-weight:900;color:${e.c};text-align:right;max-width:76px">${maEsc(e.t)}</span></button>`; }
function maOpenView(m){ const e=maExp(m), atts=maAtts(m.att), pend=maPend(m);
  return `<div role="dialog" aria-label="Carta: ${maEsc(m.title)}" style="position:fixed;inset:0;z-index:50;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:14px">
    <div class="pa-pop" style="width:100%;max-width:350px;max-height:92%;overflow-y:auto;border-radius:18px;background:#1d1611;border:3px solid #6b5843;padding:14px;display:flex;flex-direction:column;gap:10px;box-sizing:border-box">
      <div style="display:flex;align-items:center;gap:10px">${maIcon(false)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><b style="font-family:'Lilita One',sans-serif;font-size:18px">${maEsc(m.title)}</b><span style="font-size:11px;font-weight:800;color:#c9b9a2">${maEsc(maDate(m.at))}</span></span></div>
      ${m.body?`<p style="margin:0;font-size:14px;font-weight:700;color:#e8dccb;line-height:1.35;white-space:pre-wrap">${maEsc(m.body)}</p>`:''}
      ${atts.length?`<div><span style="font-size:12px;font-weight:900;color:#c9b9a2">Anexos</span><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${atts.map(x=>maChip(x,m.claimed)).join('')}</div></div>`:''}
      <span style="font-size:12px;font-weight:900;color:${e.c}">${maEsc(e.long)}</span>
      <div style="display:flex;gap:8px"><button data-x="del" data-id="${m.id}" class="pa-btn sec${pend?' off':''}" style="flex:none">Apagar</button><button data-x="${pend?'claim':'close'}" data-id="${m.id}" class="pa-btn" style="flex:1">${pend?'Coletar':(m.hasAtt?'Coletado · Fechar':'Fechar')}</button></div></div></div>`; }
function maConfirm(n){ return `<div role="alertdialog" aria-label="Apagar cartas lidas" style="position:fixed;inset:0;z-index:60;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:16px"><div class="pa-pop" style="width:100%;max-width:320px;border-radius:18px;background:#1d1611;border:3px solid #6b5843;padding:16px;display:flex;flex-direction:column;gap:10px;text-align:center;box-sizing:border-box"><b style="font-family:'Lilita One',sans-serif;font-size:20px">Apagar ${n} ${n>1?'cartas lidas':'carta lida'}?</b><span style="font-size:13px;font-weight:800;color:#c9b9a2">Cartas com anexo ainda não coletado não são apagadas.</span><div style="display:flex;gap:8px"><button data-x="conf-no" class="pa-btn sec" style="flex:1">Cancelar</button><button data-x="conf-yes" class="pa-btn" style="flex:1">Apagar</button></div></div></div>`; }
function maList(){ return Sys.mail.inbox(S,Sys.host); }
function scrMail(){
  maInject(); const d=xDims(MA_MINH);
  if(!maOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Correio indisponível agora.</div>`); return; }
  if(!maOn()){ V.innerHTML=xWrap(d,'',`<div role="note" style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center"><span style="font-family:'Lilita One',sans-serif;font-size:24px">Correio</span><span style="font-size:15px;font-weight:800;color:#c9b9a2">O Correio ainda não está ativo. Prêmios de arena, ranking, torneio e eventos vão chegar aqui.</span><button data-x="back" class="pa-btn" style="width:200px">Voltar</button></div>`); return; }
  const all=maList(), un=all.filter(m=>!m.read||maPend(m)).length, pend=all.filter(maPend), readDel=all.filter(m=>m.read&&!maPend(m));
  const shown=all.filter(m=>XMA.tab===0?true:XMA.tab===1?!m.read:m.hasAtt).sort((a,b)=>((a.read?1:0)-(b.read?1:0))||(maPend(b)-maPend(a))||(b.at-a.at));
  const tabs=MA_TABS.map((t,i)=>`<button role="tab" aria-selected="${i===XMA.tab}" data-x="tab" data-i="${i}" style="flex:1;min-width:0;height:46px;border-radius:12px;border:2px solid ${i===XMA.tab?'#ffc94a':'#4a3a2b'};background:${i===XMA.tab?'#4a3420':'#241b14'};color:${i===XMA.tab?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:14px;padding:0">${t}${i===1&&un?` (${all.filter(m=>!m.read).length})`:''}</button>`).join('');
  const rows=shown.length?shown.map(maRow).join(''):`<div role="note" style="padding:28px 12px;text-align:center;font-size:14px;font-weight:800;color:#c9b9a2">${XMA.tab===1?'Nenhuma carta nova.':XMA.tab===2?'Nenhuma carta com anexo.':'Sua caixa está vazia.'}<br><span style="font-size:12px;font-weight:700">Prêmios de arena, ranking, torneio e eventos chegam aqui.</span></div>`;
  const cur=XMA.open!=null?all.find(m=>m.id===XMA.open):null;
  V.innerHTML=xWrap(d,'',`<div style="flex:none;padding:4px 2px 6px;display:flex;flex-direction:column;gap:6px"><div role="tablist" aria-label="Filtro do correio" style="display:flex;gap:6px">${tabs}</div>
      <span style="font-size:12px;font-weight:800;color:#c9b9a2">${un?un+(un>1?' cartas para ler ou coletar. ':' carta para ler ou coletar. '):''}Os anexos expiram em ${Sys.mail.DATA.expireDays} dias.</span></div>
    <div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding:2px 2px 8px">${rows}</div>
    <div style="flex:none;display:flex;gap:8px;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="delread" class="pa-btn sec${readDel.length?'':' off'}" style="flex:1">Apagar lidas${readDel.length?' ('+readDel.length+')':''}</button><button data-x="all" class="pa-btn${pend.length?'':' off'}" style="flex:1.2">Coletar tudo${pend.length?' ('+pend.length+')':''}</button></div>
    ${cur?maOpenView(cur):''}${XMA.conf?maConfirm(readDel.length):''}`);
}
/* resumo do que o Sys.loot.grantBundle entregou (inclui o que ficou guardado por nível) */
function maGot(g){ if(!g) return 'Recompensa recebida'; const a=[]; if(g.gold) a.push(maFmt(g.gold)+' moedas'); if(g.gems) a.push(g.gems+' gemas'); for(const k in MA_MAT) if(g[k]) a.push(g[k]+' '+MA_MAT[k].toLowerCase()); if(g.items&&g.items.length) a.push(g.items.length+(g.items.length>1?' itens':' item')); if(g.eggs&&g.eggs.length) a.push(g.eggs.length+(g.eggs.length>1?' ovos':' ovo'));
  const held=(g.heldItems||[]).length+(g.heldEggs||[]).length; if(held) a.push(held+' guardado'+(held>1?'s':'')+' até o nível certo'); return a.join(' · ')||'Recompensa recebida'; }
function maClick(b){
  const a=b.dataset.x; if(a==='back'){ maSnd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(!maOn()) return; const M=Sys.mail, id=parseInt(b.dataset.id,10);
  if(a==='tab'){ XMA.tab=parseInt(b.dataset.i,10)||0; maSnd('ui_tap'); render(); return; }
  if(a==='open'){ maSnd('ui_tap'); M.read(S,Sys.host,id); XMA.open=id; maChanged(); render(); return; }
  if(a==='close'){ maSnd('ui_tap'); XMA.open=null; render(); return; }
  if(a==='claim'){ const r=M.claim(S,Sys.host,id); if(!r||!r.ok){ maSnd('ui_tap'); maToast(r&&r.reason==='resgatado'?'Os anexos desta carta já foram coletados':'Não foi possível coletar agora'); render(); return; } maSnd('claim'); maChanged(); maToast('Coletado: '+maGot(r.got)); render(); return; }
  if(a==='del'){ const ok=M.remove(S,Sys.host,id); if(!ok){ maSnd('ui_tap'); maToast('Colete os anexos antes de apagar esta carta'); return; } maSnd('ui_tap'); XMA.open=null; maChanged(); render(); return; }
  if(a==='all'){ maSnd('ui_tap'); const r=M.claimAll(S,Sys.host); if(!r||!r.n){ maToast('Nenhum anexo para coletar'); return; } maSnd('claim'); maChanged(); maToast(r.n+(r.n>1?' cartas coletadas':' carta coletada')); render(); return; }
  if(a==='delread'){ maSnd('ui_tap'); if(!maList().some(m=>m.read&&!maPend(m))){ maToast('Não há cartas lidas para apagar'); return; } XMA.conf=true; render(); return; }
  if(a==='conf-no'){ maSnd('ui_tap'); XMA.conf=false; render(); return; }
  if(a==='conf-yes'){ maSnd('ui_tap'); let n=0; for(const m of maList()) if(m.read&&!maPend(m)&&M.remove(S,Sys.host,m.id)) n++; XMA.conf=false; if(n) maChanged(); maToast(n+(n===1?' carta apagada':' cartas apagadas')); render(); return; }
}
Panels.add('mail',{title:'Correio',render:scrMail,click:maClick,busy(){ return XMA.open!=null||XMA.conf; },onOpen(){ XMA.tab=0; XMA.open=null; XMA.conf=false; },onClose(){ XMA.open=null; XMA.conf=false; } });
