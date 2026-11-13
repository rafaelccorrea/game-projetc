'use strict';
/* ================= 26 GUILDA V2 — tela nova, nasce DESLIGADA (PANEL_ON.guild) =================
   Protótipo: docs/proto/Guilda.dc.html. NENHUMA regra nem número aqui: tudo vem de Sys.guild (js/sys/guild.js): status (off|server|level|aberta), ensure (espelho do servidor:
   nome, cargo, nível, estandartes, territórios, Brasões), DATA (vagas, custo, estandartes, territórios, troca, torneio, doações), perks, createCost, canCreate, canJoin,
   cooldownLeft, memberCap, bannerCap, tourneyReward, provider.leave. Sem emoji: moeda/gema/baú de assets/ui; ícones de estandarte e território são SVG/CSS.
   O MÓDULO É SÓ O ESPELHO + REGRAS: tudo que muda de verdade (criar, entrar, doar, subir estandarte, check-in, pedidos, chat, chefe, membros, ranking, torneio) é do SERVIDOR.
   Por isso, sem guilda aberta a tela mostra o estado ("Em breve: abre com o online" / "Libera no nível N" / "ainda não ligada") e as REGRAS reais; com guilda (espelho do
   servidor) mostra o que o módulo sabe: nome, nível, cargo, vagas, estandartes e tetos, territórios e bônus, regras da troca e prêmios do torneio.
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - NÃO aparecem (sem dado no módulo, nada inventado): lista de membros, chat, chefe da semana, "na guilda agora", mural de pedidos, ranking de dano, missões da semana, loja de Brasões;
     a aba Guilda diz, em texto, que esses itens chegam com o online;
   - ações que dependem do servidor (criar, procurar, doar, subir estandarte, check-in, pedir item) respondem com o motivo real (canCreate/canJoin) ou "em breve";
   - "Sair da guilda" pede confirmação e chama Sys.guild.provider.leave (fechado hoje: o servidor responde "em breve");
   - sem "PRÉVIA" nem números fictícios (Guardiões do Tempo, GDT, Nv. 78...): nome e nível vêm do espelho.
   Pedido Q-7 (reports/pedidos-entre-agentes.md). */
const XG={tab:'home',confirm:false};
const G_MINH=560;
const G_CSS=`.pg-card{border-radius:16px;background:#1d1611;border:2px solid #4a3a2b;box-sizing:border-box;padding:10px;display:flex;flex-direction:column;gap:6px}
.pg-btn{border:0;border-radius:12px;font-weight:900;font-size:15px;min-height:46px;padding:0 14px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;box-shadow:0 4px 0 #8a4f0c}
.pg-btn:active{transform:translateY(3px);box-shadow:0 1px 0 #8a4f0c}
.pg-btn.alt{background:#33271d;color:#f6ecdf;border:2px solid #6b5843;box-shadow:none}
.pg-btn.red{background:linear-gradient(180deg,#ff8a7a,#c0301f);color:#fff;box-shadow:0 4px 0 #6a140c}
.pg-in{animation:pgi .3s ease-out both}
@keyframes pgi{from{transform:translateY(8px);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.pg-in{animation:none}}`;
const gOk=()=>!!(window.Sys&&Sys.guild&&Sys.guild.status&&Sys.guild.DATA);
const gEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function gFmt(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return String(Math.round(v||0)); }
const gIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||16)+'px;height:'+(z||16)+'px;vertical-align:-3px;object-fit:contain">';
function gInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pg_css')) return; const st=document.createElement('style'); st.id='pg_css'; st.textContent=G_CSS; document.head.appendChild(st); }
const gToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const gSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const gFlag=c=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c||'#ffc94a'}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21 V3 M5 4 H18 V13 L12 11 L5 13"></path></svg>`;
const G_ROLE={leader:'Líder',officer:'Oficial',member:'Membro'};
const G_BK={atk:['ATK','#ff8a6a'],hp:['Vida','#8ff09a'],def:['DEF','#8cc8ff'],gold:['Ouro','#ffc94a'],food:['Ração','#ff8ad8']};
const gRar=r=>{ try{ return RAR[r].n; }catch(e){ return ''; } };
function gHm(ms){ const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000); return h>=24?Math.floor(h/24)+'d '+String(h%24).padStart(2,'0')+'h':h+'h '+String(m).padStart(2,'0')+'min'; }
function gWhy(r,host){ const R=r&&r.reason;
  if(R==='off') return 'As guildas ainda não foram ligadas';
  if(R==='server') return 'Em breve: abre com o online';
  if(R==='level') return 'A guilda libera no nível '+(r.needLevel||'?');
  if(R==='in_guild') return 'Você já está em uma guilda';
  if(R==='cooldown') return 'Espere '+gHm(r.msLeft||0)+' depois de sair de uma guilda';
  if(R==='money') return 'Faltam moedas: criar custa '+gFmt(r.gold||0);
  return 'Não dá para fazer isso agora'; }
function gStatusCard(st){ const R=st.reason, txt=R==='off'?'Guildas: em breve':R==='level'?'A guilda libera no nível '+st.needLevel:'Em breve: abre com o online';
  return `<div role="status" class="pg-card pg-in" style="align-items:center;text-align:center;gap:8px;border-color:#8a6a3a;border-style:dashed"><span style="width:52px;height:52px;border-radius:14px;background:#2a1f16;border:2px solid #8a6a3a;display:flex;align-items:center;justify-content:center">${gFlag('#ffc94a')}</span><b style="font-family:'Lilita One',sans-serif;font-size:22px">Guilda</b><span style="font-size:14px;font-weight:800;color:#c9b9a2">${gEsc(txt)}</span></div>`; }
/* regras reais do módulo (cartões informativos) */
function gRules(){ const D=Sys.guild.DATA, host=Sys.host, mem=D.members, B=D.banners, T=D.territory, tr=D.trade;
  const row=(a,b)=>`<div style="display:flex;justify-content:space-between;gap:8px;font-size:13px;font-weight:800"><span style="color:#c9b9a2">${a}</span><span style="color:#f6ecdf;text-align:right">${b}</span></div>`;
  let cost=''; try{ cost=gFmt(Sys.guild.createCost(host)); }catch(e){}
  return `<div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Como a guilda funciona</b>${row('Vagas',mem.base+' no nível 1, até '+mem.max)}${row('Criar',cost?cost+' de ouro':'ouro de farm')}${row('Cargos','Líder (1), Oficiais (até '+D.maxOfficers+') e Membros')}${row('Nível da guilda','1 a '+D.xpLevel.maxLevel+', por XP da guilda')}</div>
    <div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Estandartes (o poder da guilda)</b><span style="font-size:12px;font-weight:700;color:#c9b9a2">Valem para todos os membros. Teto no nível ${D.xpLevel.maxLevel} da guilda:</span>${Object.keys(B.cap).map(k=>row(G_BK[k][0],'+'+B.cap[k]+'%')).join('')}</div>
    <div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Territórios</b>${row('Por território','ouro +'+T.per.gold+'%, XP +'+T.per.xp+'%, drop +'+T.per.drop+'%')}${row('Capital','×'+T.capitalMult)}${row('Teto somado','ouro +'+T.cap.gold+'%, XP +'+T.cap.xp+'%, drop +'+T.cap.drop+'%')}</div>`; }
function gTradeCard(){ const T=Sys.guild.DATA.trade;
  const li=[`O item chega no nível 1; quem doa recebe ${Math.round(T.goldBack*100)}% do ouro investido de volta.`,'Não troca: itens comprados, ofertas, pets, skins, VIP, montarias, fragmentos, materiais e moedas.',`Doar ${T.givePerDay} e receber ${T.getPerDay} por dia; o mesmo par, ${T.pairPerDay} por dia.`,`${T.memberDays} dias de membro para doar e receber; item obtido há menos de ${T.itemAgeH} h não pode ser doado.`,`Só ${T.adult}+: menor de idade não doa nem recebe.`,`Registro de ${T.logDays} dias visível ao líder e aos oficiais. É doação: nenhuma moeda entra na troca.`];
  return `<div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Regras de troca</b>${li.map((t,i)=>`<div style="display:flex;gap:8px;font-size:13px;font-weight:700;line-height:1.25"><b style="flex:none;width:18px;height:18px;border-radius:50%;background:#4a3214;color:#ffe07a;text-align:center;font-size:11px;line-height:18px">${i+1}</b><span>${gEsc(t)}</span></div>`).join('')}</div>`; }
function gTourney(){ const D=Sys.guild.DATA.tourney, G=Sys.guild;
  const rows=D.rewards.map(r=>{ const lab=r.from===r.to?r.from+'º':(r.to>=100?r.from+'º+':r.from+'º a '+r.to+'º');
    return `<div style="display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 8px;border-radius:10px;background:#16110d;border:1px solid #4a3a2b"><b style="width:64px;font-size:13px;color:${r.from===1?'#ffc94a':'#c9b9a2'}">${lab}</b><span style="flex:1;font-size:13px;font-weight:900">${r.coin} ${gEsc(G.DATA.coin)}s${r.prism?' · '+r.prism+' fragmento'+(r.prism>1?'s':'')+' Prismático':''}${r.frame?' · moldura':''}</span></div>`; }).join('');
  return `<div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Torneio do Poder</b><span style="font-size:12px;font-weight:700;color:#c9b9a2">Até ${D.size} membros escalados por guilda. Prêmio por membro que lutou ou estava escalado, sem sorteio.</span>${rows}<span style="font-size:12px;font-weight:800;color:#ffd27a">As batalhas e o ranking do torneio chegam com o online: em breve</span></div>`; }
function gHome(st,o){ const D=Sys.guild.DATA, G=Sys.guild, pk=G.perks(S), items=[];
  items.push(`<div class="pg-card pg-in" style="gap:8px"><div style="display:flex;align-items:center;gap:10px"><span style="flex:none;width:52px;height:52px;border-radius:14px;background:#2a1f16;border:2px solid #ffc94a;display:flex;align-items:center;justify-content:center">${gFlag('#ffc94a')}</span><span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15"><b style="font-family:'Lilita One',sans-serif;font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${gEsc(o.name||'Sua guilda')}</b><span style="font-size:12px;font-weight:800;color:#c9b9a2">Nível ${o.level} · ${gEsc(G_ROLE[o.role]||'Membro')} · até ${G.memberCap(o.level)} membros</span></span></div>
    <div style="display:flex;gap:8px"><div style="flex:1;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;padding:6px 8px"><div style="font-size:11px;font-weight:800;color:#c9b9a2">${gEsc(D.coin)}s</div><b style="font-family:'Lilita One',sans-serif;font-size:18px;color:#ffe07a">${gIc('coin',18)} ${gFmt(o.coin)}</b></div><div style="flex:1;border-radius:12px;background:#16110d;border:1px solid #4a3a2b;padding:6px 8px"><div style="font-size:11px;font-weight:800;color:#c9b9a2">Bônus de território</div><b style="font-size:13px;color:#9ff0a8">ouro +${+(pk.goldPct).toFixed(1)}% · XP +${pk.xpPct}%</b></div></div></div>`);
  items.push(`<div class="pg-card pg-in"><b style="font-size:14px">Check-in e doações</b><span style="font-size:13px;font-weight:700;color:#c9b9a2">Check-in diário: +${D.checkin.coin} ${gEsc(D.coin)}s e ${D.checkin.xp} XP da guilda. Doação: 1 de cada por dia (ouro, ouro grande ou gemas).</span><div style="display:flex;gap:8px"><button data-x="checkin" class="pg-btn" style="flex:1">Check-in</button><button data-x="donate" class="pg-btn alt" style="flex:1">Doar</button></div></div>`);
  items.push(`<div class="pg-card pg-in"><b style="font-size:14px">Membros, chat e chefe da semana</b><span style="font-size:13px;font-weight:700;color:#c9b9a2">A lista de membros, o chat com frases prontas, o chefe da guilda e o ranking de dano chegam com o online: em breve.</span></div>`);
  items.push(`<div style="padding:4px 0">${XG.confirm?`<button data-x="leave2" class="pg-btn red" style="width:100%">Confirmar: sair da guilda</button><button data-x="leaveno" class="pg-btn alt" style="width:100%;margin-top:8px">Ficar</button>`:`<button data-x="leave" class="pg-btn alt" style="width:100%">Sair da guilda</button>`}</div>`);
  return items.join(''); }
function gBanners(o){ const G=Sys.guild, B=G.DATA.banners; const canUp=o.role==='leader'||o.role==='officer';
  const rows=Object.keys(B.cap).map(k=>{ const cur=o.banners[k]||0, cap=G.bannerCap(k,o.level), full=B.cap[k], pc=Math.round(cur/Math.max(0.01,full)*100), unit='%';
    return `<div style="display:flex;align-items:center;gap:8px;min-height:56px;padding:6px 8px;border-radius:12px;background:#16110d;border:1px solid #4a3a2b"><span aria-hidden="true" style="flex:none;width:34px;height:34px;border-radius:10px;background:#2a1f16;border:2px solid ${G_BK[k][1]};display:flex;align-items:center;justify-content:center">${gFlag(G_BK[k][1])}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;line-height:1.15"><span style="font-size:14px;font-weight:900">${G_BK[k][0]} <span style="color:#ffe07a">+${+cur.toFixed(2)}${unit}</span></span><span role="img" aria-label="${G_BK[k][0]}: ${cur} de ${full}" style="position:relative;height:8px;border-radius:4px;background:#0e0a07;overflow:hidden"><span style="position:absolute;left:0;top:0;bottom:0;width:${Math.min(100,pc)}%;background:${G_BK[k][1]}"></span></span><span style="font-size:11px;font-weight:700;color:#c9b9a2">Teto agora +${cap}% · no nível ${G.DATA.xpLevel.maxLevel} +${full}% · cada passo +${B.step[k]}% por ${B.costXp[k]} XP</span></span>
      <button data-x="raise" data-k="${k}" class="pg-btn${canUp?'':' alt'}" style="flex:none;min-width:76px;padding:0 8px;font-size:13px">Subir</button></div>`; }).join('');
  return `<div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Estandartes da guilda</b><span style="font-size:12px;font-weight:700;color:#c9b9a2">Valem para todos os membros. Líder e oficiais sobem com XP da guilda. Quem sai perde os estandartes.</span>${rows}</div>`; }
function gTerritories(o){ const G=Sys.guild, T=G.DATA.territory, n=o.territories.length;
  return `<div class="pg-card pg-in"><b style="font-size:15px;color:#ffe07a">Territórios</b>${n?`<span style="font-size:13px;font-weight:800">${n} território${n>1?'s':''}${o.territories.some(t=>t.capital)?' (com a Capital)':''}</span>`:`<span style="font-size:13px;font-weight:700;color:#c9b9a2">Sua guilda ainda não tem territórios. As batalhas chegam com o online: em breve.</span>`}</div>`; }
function scrGuild(){
  gInject(); const d=xDims(G_MINH);
  if(!gOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Guilda indisponível agora.</div>`); return; }
  const G=Sys.guild, st=G.status(S,Sys.host), o=G.ensure(S);
  if(!st.open){
    V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 8px">${gStatusCard(st)}
      <div style="display:flex;gap:8px"><button data-x="create" class="pg-btn" style="flex:1">Criar guilda</button><button data-x="join" class="pg-btn alt" style="flex:1">Procurar guilda</button></div>${gRules()}${gTradeCard()}${gTourney()}</div>
      <div style="flex:none;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="back" class="pg-btn alt" style="width:100%">Voltar</button></div>`); return; }
  if(!st.inGuild){
    V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:4px 2px 8px"><div role="status" class="pg-card pg-in" style="align-items:center;text-align:center"><b style="font-family:'Lilita One',sans-serif;font-size:20px">Você ainda não tem guilda</b><span style="font-size:13px;font-weight:700;color:#c9b9a2">Crie a sua ou procure uma para entrar.</span></div>
      <div style="display:flex;gap:8px"><button data-x="create" class="pg-btn" style="flex:1">Criar guilda</button><button data-x="join" class="pg-btn alt" style="flex:1">Procurar guilda</button></div>${gRules()}${gTradeCard()}${gTourney()}</div>`); return; }
  const tabs=[['home','Guilda'],['ban','Estandartes'],['trade','Troca'],['tour','Torneio']];
  const body=XG.tab==='ban'?gBanners(o)+gTerritories(o):XG.tab==='trade'?gTradeCard()+`<button data-x="request" class="pg-btn" style="width:100%">Fazer pedido</button>`:XG.tab==='tour'?gTourney():gHome(st,o);
  V.innerHTML=xWrap(d,'',`<div style="flex:none;padding:2px 2px 6px"><div role="tablist" aria-label="Guilda" style="display:flex;gap:4px">${tabs.map(t=>{ const on=XG.tab===t[0]; return `<button role="tab" aria-selected="${on}" data-x="tab" data-t="${t[0]}" style="flex:1;min-width:0;height:46px;border-radius:11px;border:2px solid ${on?'#ffc94a':'#4a3a2b'};background:${on?'#4a3214':'#2a1f16'};color:${on?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:13px;padding:0">${t[1]}</button>`; }).join('')}</div></div>
    <div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding:2px 2px 10px">${body}</div>`);
}
function gClick(b){
  const a=b.dataset.x;
  if(a==='back'){ gSnd('ui_tap'); if(window.Screens&&Screens.close) Screens.close(); return; }
  if(!gOk()) return; const G=Sys.guild;
  if(a==='tab'){ XG.tab=b.dataset.t; XG.confirm=false; gSnd('ui_tap'); render(); return; }
  gSnd('ui_tap');
  if(a==='create'){ const c=G.canCreate(S,Sys.host); gToast(c.ok?'Criar guilda: o servidor abre isso em breve':gWhy(c)); return; }
  if(a==='join'){ const c=G.canJoin(S,Sys.host,null); gToast(c.ok?'Procurar guilda: o servidor abre isso em breve':gWhy(c)); return; }
  if(a==='checkin'||a==='donate'||a==='request'){ gToast('Isso depende do servidor: em breve'); return; }
  if(a==='raise'){ const o=G.ensure(S); gToast(o.role==='leader'||o.role==='officer'?'Subir estandarte usa o XP da guilda, que vem do servidor: em breve':'Só o líder e os oficiais sobem estandartes'); return; }
  if(a==='leave'){ XG.confirm=true; render(); return; }
  if(a==='leaveno'){ XG.confirm=false; render(); return; }
  if(a==='leave2'){ XG.confirm=false; let r=null; try{ r=G.provider&&G.provider.leave?G.provider.leave(S,Sys.host):null; }catch(e){}
    if(r&&r.ok){ try{ G.applyServer(S,{leftAt:(Sys.host&&Sys.host.now&&Sys.host.now())||Date.now()},Sys.host); }catch(e){} try{ if(typeof statsChanged==='function') statsChanged(); }catch(e){} gToast('Você saiu da guilda'); }
    else gToast(r&&r.reason==='server'||!r?'Sair da guilda depende do servidor: em breve':'Não foi possível sair agora'); render(); return; }
}
Panels.add('guild',{title:'Guilda',render:scrGuild,click:gClick,onOpen(){ XG.tab='home'; XG.confirm=false; },onClose(){ XG.confirm=false; } });
