'use strict';
/* ================= 23 ARENA — tela nova, nasce DESLIGADA (PANEL_ON.arena) =================
   Protótipo: docs/proto/Arena.dc.html. NENHUMA regra nem número aqui: tudo vem de Sys.arena (js/sys/arena.js):
   liga da semana (leagueInfo: liga, pontos de liga, linha de subida e de queda, fecha em), adversários (opponents: FC ±10%, pontos se vencer/perder,
   dificuldade), lutas e trocas do dia (ensure: attemptsLeft/refreshLeft), luta AUTORITATIVA (fight → win, delta, duel.log golpe a golpe: a animação
   segue a luta de verdade), ranking da liga (ranking 'arena') e prêmios por liga (DATA.leagues[].prize). Sem emoji (moeda/gema de assets/ui; resto SVG).
   Fluxo do protótipo: Arena (liga + lutas do dia + 3 adversários) · abas Ligas e Ranking · VS → luta animada (Pular, x2) → Vitória/Derrota (pontos,
   barra da liga, posição) → Voltar à arena / Lutar de novo.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (para não mostrar dado falso):
   - adversários e ranking são SIMULADOS pelo módulo até o online (aviso fixo, como no protótipo); o nome/título/nível inventados do protótipo não
     aparecem: só nome e FC que o módulo dá; todos com o Kael padrão;
   - prêmios das ligas são os do Sys.arena (no lugar de "[QTD]") e só são entregues quando o ranking online abrir (aviso fixo);
   - a luta usa o registro do duelo do módulo (golpes e críticos reais); o corte da ultimate do protótipo vira o banner do golpe crítico.
   Pedido ao engenheiro: incluir 'p_arena' na lista de scripts de js/screens.js:823 e abrir pelo menu (FB_UNLOCK.arena, nível 28).
   LUTA PvP NOVA (Tela 23 aprovada, protótipo docs/proto/ArenaPvP.html): bloco "LUTA PvP" no fim deste arquivo, atrás da chave window.PA_PVP2
   (desligada = a luta antiga abaixo, intacta). */
const XA2={tab:0,view:'lobby',sel:0,fight:null,res:null,step:0,speed:1,timer:0,sec:-1,pv:null,pvSpeed:1,cv:null};
const A_MINH=640;
const A_CSS=`.pa-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pak 1s steps(12,jump-none) infinite}
@keyframes pak{from{background-position:0 0}to{background-position:100% 0}}
.pa-in{animation:pai .35s cubic-bezier(.2,1.2,.4,1) both}@keyframes pai{from{transform:translateY(14px);opacity:0}to{transform:none;opacity:1}}
.pa-vs{animation:pav .7s cubic-bezier(.2,1.4,.4,1) both}@keyframes pav{from{transform:scale(2.2);opacity:0}to{transform:none;opacity:1}}
.pa-hp{transition:width .28s ease-out}
.pa-dmg{position:absolute;font-family:'Lilita One',sans-serif;font-size:22px;color:#fff;text-shadow:0 2px 0 #000,0 0 6px #000;animation:pad .7s ease-out both;pointer-events:none}
.pa-dmg.c{color:#ffe07a;font-size:28px}@keyframes pad{from{transform:translateY(0);opacity:1}to{transform:translateY(-34px);opacity:0}}
.pa-hit{animation:pah .25s ease-out}@keyframes pah{0%{transform:translateX(0)}30%{transform:translateX(-6px)}60%{transform:translateX(5px)}100%{transform:none}}
.pa-btn{border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;border-radius:12px;min-height:46px;font-weight:900}
.pa-btn[disabled]{opacity:.4}
.pa-gold{background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403 !important;text-shadow:0 1px 0 rgba(255,255,255,.5);box-shadow:0 5px 0 #8a4f0c;border:0;border-radius:14px;font-family:'Lilita One',sans-serif}
.pa-gold:active{transform:translateY(3px);box-shadow:0 2px 0 #8a4f0c}
.pa-shine{position:relative;overflow:hidden}.pa-shine::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);pointer-events:none;background-size:220% 100%;animation:pas 2.4s linear infinite}
@keyframes pas{from{background-position:120% 0}to{background-position:-120% 0}}
@media (prefers-reduced-motion:reduce){.pa-kid,.pa-in,.pa-vs,.pa-dmg,.pa-hit,.pa-shine::after{animation:none}.pa-hp{transition:none}}`;
const paOk=()=>!!(window.Sys&&Sys.arena&&Sys.arena.leagueInfo&&Sys.arena.opponents&&Sys.arena.fight);
const paEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const paN=v=>Math.round(v||0).toLocaleString('pt-BR');
/* FC na escala de EXIBIÇÃO do dono (Sys.fc.viewText; só visual): jogador e adversários na mesma escala. Dano da luta segue real (paF). */
const paFC=v=>{ try{ if(window.Sys&&Sys.fc&&Sys.fc.viewText) return Sys.fc.viewText(v); }catch(e){} return paF(v); };
/* VIP de conveniência (Sys.vip.conv 'arenaAdd'): o máximo do dia = grátis (DATA.attemptsPerDay, 3) + o do VIP; quem não tem vê o bônus trancado */
const paConv=()=>{ try{ return window.Sys&&Sys.vip&&Sys.vip.conv?Sys.vip.conv(S,'arenaAdd'):null; }catch(e){ return null; } };
const paMaxTries=()=>{ const c=paConv(); return Sys.arena.DATA.attemptsPerDay+(c&&c.value>0?c.value:0); };
function paVipChip(){ const c=paConv(); if(!c||c.value>0) return ''; let add=2; try{ add=(Sys.vip.DATA.conv.find(x=>x.id==='arenaAdd').val||[])[c.need]||2; }catch(e){}
  return ` <span aria-label="Lutas extras com VIP ${c.need}: mais ${add}" style="display:inline-flex;align-items:center;gap:3px;margin-left:4px;padding:1px 7px;border-radius:8px;background:#2a1f16;border:1px solid #6b5843;color:#c9b9a2;font-size:10px;font-weight:900;white-space:nowrap"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#c9b9a2" stroke-width="3" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V7a4 4 0 0 1 8 0v4"></path></svg>VIP ${c.need}: +${add}</span>`; }
function paF(v){ try{ if(typeof kf==='function') return kf(v); }catch(e){} return paN(v); }
const paIc=(n,z)=>'<img src="assets/ui/'+n+'.png" alt="" style="width:'+(z||14)+'px;height:'+(z||14)+'px;vertical-align:-2px;object-fit:contain">';
const paToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const paSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const paH=()=>Sys.host;
/* o jogador de verdade (ordem do dono: o herói segue a fase e o herói escolhido): nome do save e Kael/Kaia */
const paMe=()=>{ try{ return (S.name&&String(S.name).trim())||(S.hero==='kaia'?'Kaia':'Kael'); }catch(e){ return 'Kael'; } };
function paInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pa_css')) return; const st=document.createElement('style'); st.id='pa_css'; st.textContent=A_CSS; document.head.appendChild(st); }
function paClock(ms){ const s=Math.max(0,Math.floor(ms/1000)), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), x=s%60, p=n=>String(n).padStart(2,'0'); return (d?d+'d ':'')+p(h)+':'+p(m)+':'+p(x); }
function paDayLeft(){ const n=new Date(), m=new Date(n); m.setDate(n.getDate()+1); m.setHours(0,0,0,0); return m-n; }
const paMyFc=()=>{ try{ return Sys.fc.compute(S,paH()); }catch(e){ return 0; } };
const paLg=L=>`linear-gradient(135deg,${L.c1},${L.c2})`;
/* escudo da liga (SVG; cores da liga, coroa nas ligas altas) */
function paShield(L,z){ z=z||44; return `<svg width="${z}" height="${z}" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3 L35 9 V20 C35 29 28 35 20 38 C12 35 5 29 5 20 V9 Z" fill="${L.c1}" stroke="${L.c2}" stroke-width="2.5"></path><path d="M20 9 L29 12.5 V20 C29 26 25 30 20 32 C15 30 11 26 11 20 V12.5 Z" fill="${L.c2}" opacity=".45"></path>${L.crown?`<path d="M12 6 L14 1.5 L17 4.5 L20 0.5 L23 4.5 L26 1.5 L28 6 Z" fill="#ffe07a" stroke="#6a3a08" stroke-width="1"></path>`:''}</svg>`; }
function paPrize(pz){ const out=[]; if(pz.goldk) out.push(paIc('coin')+' ouro'); if(pz.gems) out.push(paIc('gem')+' '+pz.gems); if(pz.chest) out.push(paIc('chest')+' '+pz.chest);
  if(pz.prism) out.push(pz.prism+' frag. Prismático'); if(pz.frame) out.push('moldura'); if(pz.title) out.push('título'); return out.join(' · '); }

/* ---------- ARENA (aba 0): liga, lutas do dia, adversários ---------- */
function paLobby(){ const h=paH(), li=Sys.arena.leagueInfo(S,h), o=Sys.arena.ensure(S,h), ops=Sys.arena.opponents(S,h), L=li.league, N=li.next;
  XA2.sel=Math.max(0,Math.min(XA2.sel,ops.length-1));
  const frac=N?Math.max(0,Math.min(1,(li.lp-L.min)/Math.max(1,N.min-L.min))):1;
  const zoneTxt=li.zone==='up'?'Acima da linha: sobe para '+N.name+' no fechamento':li.zone==='down'?'Abaixo do mínimo: cai no fechamento':N?'Faltam '+paN(li.toUp)+' pts para subir para '+N.name:'Liga mais alta';
  const card=`<div class="pa-in" style="flex:none;display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:16px;background:${paLg(L)};border:2px solid ${L.c3};box-shadow:0 0 14px ${L.c1}66">
    ${paShield(L,52)}<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px">
      <span style="font-size:11px;font-weight:900;color:${L.c3};letter-spacing:.06em">LIGA DA SEMANA</span>
      <span style="font-family:'Lilita One',sans-serif;font-size:22px;line-height:1;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.4)">${paEsc(L.name)}</span>
      <div role="progressbar" aria-label="Pontos de liga" aria-valuenow="${li.lp}" style="height:10px;border-radius:6px;background:rgba(0,0,0,.35);overflow:hidden"><div style="height:100%;width:${Math.round(frac*100)}%;background:${L.c3}"></div></div>
      <span style="font-size:11px;font-weight:800;color:#fff">${paN(li.lp)} pts${N?' / '+paN(N.min):''} · ${paEsc(zoneTxt)}</span></div>
    <div style="flex:none;display:flex;flex-direction:column;align-items:flex-end;line-height:1.1"><span style="font-size:10px;font-weight:800;color:${L.c3}">Fecha em</span><span id="pa_week" role="timer" style="font-family:'Lilita One',sans-serif;font-size:14px;color:#fff">${paClock(li.msLeft)}</span></div></div>`;
  const fights=`<div style="flex:none;height:46px;display:flex;align-items:center;gap:8px">
    <span style="flex:1;min-width:0;font-size:13px;font-weight:900">Lutas hoje <span style="color:#ffe07a">${o.attemptsLeft}/${paMaxTries()}</span> <span style="font-size:11px;color:#c9b9a2;font-weight:800">· recarrega em <span id="pa_day">${paClock(paDayLeft())}</span></span>${paVipChip()}</span>
    <button data-x="refresh" class="pa-btn" style="padding:0 12px" aria-label="Trocar adversários (${o.refreshLeft} grátis hoje)">Trocar <span style="color:#ffe07a">${o.refreshLeft}</span></button></div>`;
  const dcol={easy:'#5fd068',even:'#ffc94a',hard:'#ff9a3c',nope:'#ff5a5a'};
  const list=ops.map((p,i)=>{ const on=i===XA2.sel, d=p.diff||{id:'even',txt:''};
    return `<button data-x="sel" data-i="${i}" aria-pressed="${on}" aria-label="${paEsc(p.name)}, FC ${paFC(p.fc)}, ${paEsc(d.txt)}" class="pa-in" style="position:relative;animation-delay:${i*.06}s;flex:none;height:72px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:14px;background:${on?'#3a2c1f':'#1d1611'};border:2px solid ${on?'#ffc94a':'#4a3a2b'};color:#f6ecdf;text-align:left;width:100%">
      <span aria-hidden="true" style="flex:none;width:54px;height:54px;border-radius:12px;overflow:hidden;position:relative;background:#2a1f16;border:2px solid ${dcol[d.id]||'#6b5843'}"><span style="position:absolute;left:-13px;top:-6px;width:80px;height:80px;display:block;transform:scaleX(-1)"><span class="pa-kid" style="position:absolute;inset:0;display:block"></span></span></span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${paEsc(p.name)}</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2">FC ${paFC(p.fc)} · <span style="color:${dcol[d.id]||'#c9b9a2'}">${paEsc(d.txt)}</span></span></span>
      <span style="flex:none;display:flex;flex-direction:column;align-items:flex-end;font-family:'Lilita One',sans-serif;line-height:1.05"><span style="color:#5fd068;font-size:16px">+${p.winPts}</span><span style="color:#ff6b6b;font-size:13px">−${p.losePts}</span><span style="font-size:10px;color:#c9b9a2;font-family:inherit;font-weight:800">pts</span></span>
      ${on?`<span style="position:absolute;right:8px;top:-7px;font-size:9px;font-weight:900;color:#2a1403;background:#ffc94a;border-radius:6px;padding:1px 5px">ESCOLHIDO</span>`:''}</button>`; }).join('');
  return card+fights+`<div role="list" aria-label="Adversários" style="flex:none;display:flex;flex-direction:column;gap:6px">${list}</div>
    <span style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Cópias de jogadores com FC até ±10% da sua · luta automática · prêmios valem quando o ranking online abrir</span>`; }
/* ---------- LIGAS (aba 1) ---------- */
function paLeagues(){ const li=Sys.arena.leagueInfo(S,paH()), A=Sys.arena.DATA.leagues;
  const rows=A.map((L,i)=>{ const me=i===li.idx, nx=A[i+1];
    return `<div class="pa-in" style="animation-delay:${i*.04}s;flex:none;min-height:56px;display:flex;align-items:center;gap:8px;padding:4px 10px;border-radius:14px;background:${me?paLg(L):'#1d1611'};border:2px solid ${me?L.c3:'#4a3a2b'}">
      ${paShield(L,36)}<span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px"><span style="font-family:'Lilita One',sans-serif;font-size:16px;color:${me?'#fff':L.c1}">${paEsc(L.name)}${me?' <span style="font-family:inherit;font-size:10px;font-weight:900;color:#2a1403;background:#ffc94a;border-radius:6px;padding:1px 5px;vertical-align:2px">VOCÊ</span>':''}</span>
        <span style="font-size:11px;font-weight:800;color:${me?'#fff':'#c9b9a2'}">${paN(L.min)}${nx?'–'+paN(nx.min-1):'+'} pts</span></span>
      <span style="flex:none;max-width:150px;font-size:11px;font-weight:800;color:${me?'#fff':'#f6ecdf'};text-align:right;line-height:1.25">${paPrize(L.prize)}</span></div>`; }).join('');
  return `<span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.25">Toda semana: quem fecha acima da linha da próxima liga <b style="color:#5fd068">sobe</b>; quem fica abaixo do mínimo da sua <b style="color:#ff6b6b">cai</b>. O prêmio é o da liga em que você fechar.</span>
    <div style="flex:none;display:flex;flex-direction:column;gap:5px">${rows}</div>
    <span style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Fragmentos do Prismático a partir da Platina · prêmios valem quando o ranking online abrir</span>`; }
/* ---------- RANKING (aba 2) ---------- */
function paRanking(){ const li=Sys.arena.leagueInfo(S,paH()); let r=null; try{ r=Sys.arena.ranking(S,paH(),'arena'); }catch(e){}
  if(!r||!r.list) return `<div role="note" style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;color:#c9b9a2;font-weight:800">O ranking abre com o online</div>`;
  const me=r.me, from=Math.max(0,Math.min(me.rank-4,r.list.length-8)), rows=r.list.slice(from,from+8).map(x=>`<div style="flex:none;height:44px;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:12px;background:${x.me?'#3a2c1f':'#1d1611'};border:${x.me?'2px solid #ffc94a':'1px solid #4a3a2b'}">
      <span style="width:30px;text-align:center;font-family:'Lilita One',sans-serif;color:#c9b9a2">${x.rank}</span><span style="flex:1;min-width:0;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${paEsc(x.me?'Você · '+paMe():x.name)}</span>
      <span style="font-family:'Lilita One',sans-serif;color:#ffe07a">${paN(x.value)} pts</span></div>`).join('');
  const rb=(()=>{ try{ return typeof realmBadge==='function'?realmBadge():''; }catch(e){ return ''; } })();
  return `<span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${rb?'<b style="color:#ffe07a">'+paEsc(rb)+'</b> · ':''}Ranking da sua liga (${paEsc(li.league.name)}) nesta semana · você em ${me.rank}º</span>
    <div style="flex:none;display:flex;flex-direction:column;gap:4px">${rows}</div>
    <span style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">Prévia com jogadores simulados · prêmios valem quando o ranking online abrir</span>`; }
/* ---------- LUTA: VS → golpes do registro → resultado ---------- */
function paFightView(){ const F=XA2.fight, log=(F.r.duel&&F.r.duel.log)||[], st=Math.min(XA2.step,log.length), cur=log[st-1];
  let hpA=1, hpB=1; const mA=F.maxA, mB=F.maxB; for(let i=0;i<st;i++){ const e=log[i]; if(e.s===0) hpB=e.hp/mB; else hpA=e.hp/mA; }
  const bar=(v,c)=>`<div style="height:12px;border-radius:7px;background:#140e08;border:2px solid #4a3a2b;overflow:hidden"><div class="pa-hp" style="height:100%;width:${Math.max(0,Math.round(v*100))}%;background:${c}"></div></div>`;
  const dmg=cur?`<span class="pa-dmg${cur.crit?' c':''}" style="${cur.s===0?'right:12%':'left:12%'};top:30%">${cur.crit?'CRÍTICO ':''}−${paF(cur.dmg)}</span>`:'';
  return `<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px">
    <div style="flex:none;display:flex;align-items:center;gap:8px"><div style="flex:1;min-width:0"><span style="font-weight:900;font-size:13px">Você · ${paEsc(paMe())}</span><br><span style="font-size:11px;color:#c9b9a2;font-weight:800">FC ${paFC(F.myFc)}</span>${bar(hpA,'#5fd068')}</div>
      <span class="pa-vs" style="font-family:'Lilita One',sans-serif;font-size:28px;color:#ffe07a;text-shadow:0 2px 0 #6a3a08">VS</span>
      <div style="flex:1;min-width:0;text-align:right"><span style="font-weight:900;font-size:13px">${paEsc(F.opp.name)}</span><br><span style="font-size:11px;color:#c9b9a2;font-weight:800">FC ${paFC(F.opp.fc)}</span>${bar(hpB,'#ff5a5a')}</div></div>
    <div style="flex:1;min-height:220px;position:relative;border-radius:16px;overflow:hidden;background:linear-gradient(180deg,#3a2a18,#1a120b 70%);border:2px solid #4a3a2b">
      <div style="position:absolute;left:0;right:0;bottom:0;height:70px;background:linear-gradient(180deg,#5a4026,#2a1c10)"></div>
      ${typeof window.drawHeroFull==='function'?`<canvas id="pa_me" width="256" height="256" role="img" aria-label="${paEsc(paMe())}" class="${cur&&cur.s===1?'pa-hit':''}" style="position:absolute;left:2%;bottom:46px;width:46%;aspect-ratio:1"></canvas>`
        :`<div role="img" aria-label="${paEsc(paMe())}" style="position:absolute;left:2%;bottom:46px;width:46%;aspect-ratio:1"><div class="pa-kid${cur&&cur.s===1?' pa-hit':''}" style="position:absolute;inset:0"></div></div>`}
      <div role="img" aria-label="${paEsc(F.opp.name)}" style="position:absolute;right:2%;bottom:46px;width:46%;aspect-ratio:1;transform:scaleX(-1)"><div class="pa-kid${cur&&cur.s===0?' pa-hit':''}" style="position:absolute;inset:0"></div></div>
      ${dmg}<span style="position:absolute;left:8px;top:6px;font-size:11px;font-weight:900;color:#c9b9a2">Golpe ${st}/${log.length}</span></div>
    <div style="flex:none;display:flex;gap:8px"><button data-x="speed" class="pa-btn" style="flex:1" aria-label="Velocidade">x${XA2.speed===1?2:1}</button><button data-x="skip" class="pa-btn" style="flex:2">Pular</button></div></div>`; }
function paResult(){ const F=XA2.fight, r=F.r, li=Sys.arena.leagueInfo(S,paH()), L=li.league, N=li.next, win=r.win;
  const frac=N?Math.max(0,Math.min(1,(li.lp-L.min)/Math.max(1,N.min-L.min))):1, o=Sys.arena.ensure(S,paH());
  return `<div class="pa-in" style="flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center">
    <span style="font-family:'Lilita One',sans-serif;font-size:44px;line-height:1;color:${win?'#ffe07a':'#ff6b6b'};text-shadow:0 3px 0 ${win?'#8a4f0c':'#5a0f0f'}">${win?'VITÓRIA!':'DERROTA'}</span>
    <span style="font-size:13px;font-weight:800;color:#c9b9a2">contra ${paEsc(F.opp.name)} · FC ${paFC(F.opp.fc)}</span>
    <div style="display:flex;align-items:center;gap:8px">${paShield(L,44)}<span style="font-family:'Lilita One',sans-serif;font-size:26px;color:${r.delta>=0?'#5fd068':'#ff6b6b'}">${r.delta>=0?'+':'−'}${Math.abs(r.delta)}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">pontos de arena</span></div>
    <div style="width:86%"><div role="progressbar" aria-label="Pontos de liga" style="height:12px;border-radius:7px;background:#140e08;border:2px solid #4a3a2b;overflow:hidden"><div style="height:100%;width:${Math.round(frac*100)}%;background:${L.c1}"></div></div>
      <span style="font-size:11px;font-weight:800;color:#f6ecdf">Liga ${paEsc(L.name)} · ${paN(li.lp)}${N?' / '+paN(N.min):''} pts</span></div>
    <span style="font-size:11px;font-weight:800;color:#ffd27a">Prêmios valem quando o ranking online abrir</span>
    <div style="width:100%;display:flex;gap:8px;margin-top:6px"><button data-x="back" class="pa-btn" style="flex:1;height:54px">Voltar à arena</button>
      <button data-x="again" class="pa-gold" style="flex:1;height:54px;font-size:18px" ${o.attemptsLeft<=0?'disabled':''}>${o.attemptsLeft>0?'Lutar de novo':'Sem lutas hoje'}</button></div></div>`; }
function scrArena(){
  paInject(); const d=xDims(A_MINH);
  if(!paOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Arena indisponível agora.</div>`); return; }
  if((XA2.view==='fight'||XA2.view==='result')&&XA2.pv){ V.innerHTML=xWrap(d,'',paPvHTML(d)); try{ paPvDraw(); }catch(e){} paPvLoopOn(); return; }   /* luta PvP nova (chave PA_PVP2) */
  if(XA2.view==='fight'){ V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 2px 8px">${paFightView()}</div>`); if(!paRaf) paDrawMe(); return; }
  if(XA2.view==='result'){ V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 2px 8px">${paResult()}</div>`); return; }
  const TABS=['Arena','Ligas','Ranking'], tabs=TABS.map((t,i)=>`<button role="tab" aria-selected="${i===XA2.tab}" data-x="tab" data-i="${i}" style="flex:1;height:46px;border-radius:11px;border:2px solid ${i===XA2.tab?'#ffc94a':'#4a3a2b'};background:${i===XA2.tab?'#4a3214':'#2a1f16'};color:${i===XA2.tab?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:15px">${t}</button>`).join('');
  const body=XA2.tab===1?paLeagues():XA2.tab===2?paRanking():paLobby(), o=Sys.arena.ensure(S,paH());
  const foot=XA2.tab===0?`<div style="flex:none;padding:6px 2px;padding-bottom:max(8px,env(safe-area-inset-bottom))"><button data-x="fight" class="pa-gold pa-shine" style="width:100%;height:60px;font-size:24px" ${o.attemptsLeft<=0?'disabled':''} aria-label="Lutar contra o adversário escolhido">${o.attemptsLeft>0?'LUTE!':'Sem lutas hoje'}</button></div>`:'';
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding:4px 2px 6px">
    <div role="tablist" aria-label="Arena" style="flex:none;display:flex;gap:4px">${tabs}</div>${body}</div>${foot}`);
}
/* herói completo na luta: window.drawHeroFull do jogo (mesmo código da batalha: fase certa, pet, montaria, asa e camadas) */
let paRaf=0;
function paDrawMe(){ paRaf=0; if(XA2.view!=='fight') return; const c=typeof document!=='undefined'&&document.getElementById('pa_me'); if(!c||typeof window.drawHeroFull!=='function') return;
  const g=c.getContext('2d'); if(!g) return; g.clearRect(0,0,c.width,c.height); const hs=(typeof HS!=='undefined'&&HS>0)?HS:155;
  try{ window.drawHeroFull(g,c.width*0.42,c.height*0.94,c.height*0.62/hs,{t:(typeof performance!=='undefined'?performance.now():Date.now())/1000}); }catch(e){}
  if(typeof requestAnimationFrame==='function') paRaf=requestAnimationFrame(paDrawMe); }
function paStop(){ paPvLoopOff(); if(paRaf&&typeof cancelAnimationFrame==='function'){ cancelAnimationFrame(paRaf); paRaf=0; } if(XA2.timer){ clearTimeout(XA2.timer); XA2.timer=0; } }
function paPlay(){ paStop(); const F=XA2.fight; if(!F) return; const n=(F.r.duel&&F.r.duel.log||[]).length;
  if(XA2.step>=n){ XA2.timer=setTimeout(()=>{ XA2.timer=0; XA2.view='result'; paSnd(F.r.win?'claim':'ui_tap'); render(); },500/XA2.speed); return; }
  XA2.timer=setTimeout(()=>{ XA2.timer=0; XA2.step++; const e=F.r.duel.log[XA2.step-1]; paSnd(e&&e.crit?'crit':'hit'); render(); paPlay(); },(XA2.step===0?900:420)/XA2.speed); }
function paClick(b){ const a=b.dataset.x; if(!paOk()) return; const h=paH();
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i!==XA2.tab&&i>=0&&i<3){ XA2.tab=i; paSnd('ui_tap'); render(); } return; }
  if(a==='sel'){ XA2.sel=parseInt(b.dataset.i,10)||0; paSnd('ui_tap'); render(); return; }
  if(a==='refresh'){ const r=Sys.arena.refresh(S,h); if(!r.ok){ paToast('Sem trocas grátis hoje'); return; } XA2.sel=0; paSnd('ui_tap'); render(); return; }
  if(a==='pvspd'){ const v=parseInt(b.dataset.v,10); if(XA2.pv&&(v===1||v===2||v===4)&&v!==XA2.pv.speed){ XA2.pv.speed=XA2.pvSpeed=v; paSnd('ui_tap'); render(); } return; }
  if(a==='fight'||a==='again'){ const ops=Sys.arena.opponents(S,h), prev=XA2.pv&&XA2.pv.opp, opp=(a==='again'&&prev&&ops.find(o=>o.id===prev.id))||ops[a==='again'&&!XA2.pv?0:XA2.sel]; if(!opp) return; const myFc=paMyFc(), W=Sys.tower;
    let maxA=1, maxB=1; try{ const me=W.playerStats(S,h), foe=W.scaledFoe(me,opp.fc); maxA=Math.max(1,me.hp); maxB=Math.max(1,foe.hp); }catch(e){}
    const r=Sys.arena.fight(S,h,opp.id); if(!r.ok){ paToast(r.reason==='tries'?'Sem lutas hoje: recarrega à meia-noite':'Luta indisponível agora'); return; }
    try{ if(typeof save==='function') save(); }catch(e){}
    XA2.fight={opp,r,myFc,maxA,maxB}; XA2.step=0; XA2.view='fight'; paSnd('ui_tap');
    if(window.PA_PVP2===true){ paStop(); paPvStart(opp,r,myFc,maxA,maxB); render(); return; }
    XA2.pv=null; render(); paPlay(); return; }
  if(a==='skip'){ if(XA2.pv){ paPvSkip(); return; } paStop(); XA2.view='result'; render(); return; }
  if(a==='speed'){ XA2.speed=XA2.speed===1?2:1; render(); return; }
  if(a==='back'){ paStop(); paPvFree(); XA2.view='lobby'; XA2.fight=null; render(); return; }
}
/* ================= LUTA PvP (Tela 23 · protótipo APROVADO docs/proto/ArenaPvP.html) =================
   Chave: window.PA_PVP2, LIGADA por padrão (?debug=1&pvp2=0 desliga para comparar). Desligada = a luta antiga acima.
   A LUTA SEGUE O REGISTRO: paPvScript transforma o duel.log do Sys.arena.fight ({s, dmg, crit, hp} por golpe, na ordem) num roteiro com hora marcada;
   paPvStep anda o relógio (x1/x2/x4) e aplica cada golpe na ordem; Pular aplica o resto de uma vez (mesma vida final, mesmo vencedor: r.win do módulo).
   Nada é sorteado aqui e nenhum número é criado: dano, crítico e vida são os do registro.
   O QUE O REGISTRO AINDA NÃO TRAZ (pedido a Sistemas no relatório) e como a tela se vira até lá, sem inventar número:
   - ultimate: sem campo no registro, a ENERGIA é só visual (+22 por golpe dado, +12 por golpe levado, como no protótipo; em luta longa enche mais devagar) e, cheia, o PRÓXIMO golpe real
     daquele lado é mostrado como ultimate (o dano é o do registro). Se o registro trouxer k:'ult' (ou ult:true), vale o registro;
   - pet: sem golpe de pet no registro, o pet ataca JUNTO do dono (nos críticos e a cada 3º golpe), sem número próprio. Com k:'pet' vale o registro;
   - aparência do adversário: opp.look {hero, mount:{id,stars}, pet:{base,stage,fly}, wing, aura}; sem ele (bots de hoje só têm skin de arma/roupa),
     montaria, pet, asa e aura saem de uma conta fixa pelo id do adversário (só visual; o mesmo adversário tem sempre a mesma aparência).
   DESENHO: o MESMO código da batalha (window.drawHeroFull: montado com a folha da montaria, arma do item na mão, asa na âncora das costas de cada
   quadro, aura por estrela); o adversário é o mesmo desenho ESPELHADO pelo canvas, com a aparência dele e o corpo padrão. Pets desenhados aqui, por
   ÚLTIMO, no plano da frente, cada um preso à metade do dono (paPvPet): nunca cruzam. Ultimate = receita da batalha (faixa da largura do campo + 24,
   apoiada 9% da largura abaixo dos pés, espelhada para o adversário, escurecimento leve). */
window.PA_PVP2=(function(){ let on=typeof window.PA_PVP2==='boolean'?window.PA_PVP2:true;   /* tela aprovada pelo dono: nasce LIGADA */ try{ if(typeof DEBUG!=='undefined'&&DEBUG&&typeof QP!=='undefined'){ const q=QP.get('pvp2'); if(q==='1') on=true; else if(q==='0') on=false; } }catch(e){} return on; })();
const PV_CSS=`.pv{position:relative;flex:1;min-height:0;overflow:hidden;background:radial-gradient(120% 60% at 50% 40%,#2a0f2e,#0b1030 70%);color:#eef1ff;font-family:Nunito,system-ui,sans-serif}
.pv *{box-sizing:border-box}
.pv button{font-family:Nunito,system-ui,sans-serif;color:inherit}
.pv-bg{position:absolute;left:0;right:0;top:0;background-position:center;background-size:cover;filter:saturate(1.1) brightness(.5) hue-rotate(310deg)}
.pv-bg2{position:absolute;left:0;right:0;top:0;bottom:0}
.pv-cv{position:absolute;left:0;top:0;width:100%;height:100%;display:block}
.pv-hud{position:absolute;left:10px;right:10px;top:8px;z-index:5;display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:6px;align-items:start}
.pv-pl{display:flex;gap:7px;align-items:center;min-width:0}
.pv-pl.r{flex-direction:row-reverse;text-align:right}
.pv-av{flex:none;width:46px;height:46px;border-radius:13px;overflow:hidden;position:relative;border:2px solid var(--c);box-shadow:0 0 10px var(--c);background:#0c1238}
.pv-av img{position:absolute;left:-3px;top:-3px;width:52px;height:52px;object-fit:cover}
.pv-pl.r .pv-av img{transform:scaleX(-1)}
.pv-pi{flex:1;min-width:0}
.pv-pn{font-weight:900;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv-pf{font-size:10px;font-weight:800;color:#ffd25e;white-space:nowrap}
.pv-bar{height:11px;border-radius:6px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.18);overflow:hidden;margin-top:3px;position:relative}
.pv-bar i{position:absolute;top:0;bottom:0;left:0;transition:width .25s ease-out}
.pv-bar i.lag{background:#fff;opacity:.55;transition:width .9s ease-in .25s}
.pv-bar i.hp{background:linear-gradient(180deg,#7dffb0,#1fbf6c)}
.pv-pl.r .pv-bar i{left:auto;right:0}
.pv-bar.low i.hp{background:linear-gradient(180deg,#ff8a8a,#e23b4b)}
.pv-bar b{position:absolute;left:0;right:0;top:0;bottom:0;font-size:8px;font-weight:900;display:grid;place-items:center;text-shadow:0 1px 0 #000;color:#fff}
.pv-en{height:5px;border-radius:3px;background:rgba(0,0,0,.55);overflow:hidden;margin-top:2px;position:relative}
.pv-en i{position:absolute;top:0;bottom:0;left:0;background:linear-gradient(90deg,#5ee7ff,#a97bff);transition:width .3s}
.pv-pl.r .pv-en i{left:auto;right:0}
.pv-en.full i{box-shadow:0 0 8px #5ee7ff;animation:pvpulse .6s ease-in-out infinite alternate}
.pv-mid{display:flex;flex-direction:column;align-items:center;gap:2px;padding-top:4px}
.pv-vsm{font-family:'Lilita One',sans-serif;font-size:22px;color:#ffd25e;text-shadow:0 2px 0 #000,0 0 12px rgba(255,210,94,.6);line-height:1}
.pv-tm{font-size:10px;font-weight:900;color:#9aa6d6;font-variant-numeric:tabular-nums}
.pv-league{position:absolute;left:50%;top:72px;transform:translateX(-50%);z-index:5;font-size:10px;font-weight:900;padding:3px 10px;border-radius:10px;background:rgba(5,8,28,.7);border:1px solid rgba(130,150,255,.28);color:#9aa6d6;white-space:nowrap;max-width:calc(100% - 20px);overflow:hidden}
.pv-league b{color:#c9d6ff}
.pv-feed{position:absolute;left:12px;right:12px;z-index:5;display:flex;flex-direction:column;gap:4px;align-items:center;pointer-events:none}
.pv-feed div{font-size:11px;font-weight:800;padding:3px 10px;border-radius:9px;background:rgba(5,8,28,.7);border:1px solid rgba(130,150,255,.28);animation:pvfin .25s ease-out;white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.pv-feed .k{color:#ffd25e}.pv-feed .u{color:#d9b8ff}
.pv-ctr{position:absolute;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:6;display:flex;gap:8px}
.pv-ctr button{height:48px;border-radius:14px;border:1px solid rgba(160,180,255,.5);background:rgba(24,33,86,.8);font-weight:900;font-size:14px;flex:1;min-width:0;padding:0}
.pv-ctr button[aria-pressed="true"]{background:linear-gradient(180deg,#3d4fb8,#26338a);border-color:#7f93ff}
.pv-ctr .skip{flex:1.3;background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;border:0;box-shadow:0 3px 0 #9a5a10;font-family:'Lilita One',sans-serif;font-weight:400;font-size:17px}
.pv-info{position:absolute;left:12px;right:12px;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 56px);z-index:5;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.pv-info div{border-radius:12px;background:rgba(10,14,44,.78);border:1px solid rgba(130,150,255,.28);padding:5px 6px;text-align:center;min-width:0}
.pv-info small{display:block;font-size:9px;color:#9aa6d6;font-weight:900;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap}
.pv-info b{font-family:'Lilita One',sans-serif;font-weight:400;font-size:17px;font-variant-numeric:tabular-nums;white-space:nowrap}
.pv-ovl{position:absolute;left:0;right:0;top:0;bottom:0;z-index:20;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:20px 16px}
.pv-vs{background:radial-gradient(circle,rgba(40,10,40,.85),rgba(5,8,28,.95))}
.pv-vsrow{display:flex;align-items:center;gap:10px;width:100%;justify-content:center}
.pv-vsc{flex:1 1 0;min-width:0;max-width:130px;text-align:center;animation:pvsl .5s cubic-bezier(.2,1.3,.4,1) both}
.pv-vsc.r{animation-name:pvsr}
.pv-bigav{width:100%;max-width:110px;aspect-ratio:1;margin:0 auto 6px;border-radius:24px;overflow:hidden;border:3px solid var(--c);box-shadow:0 0 24px var(--c);position:relative;background:#0c1238}
.pv-bigav img{position:absolute;left:-5%;top:-5%;width:110%;height:110%;object-fit:cover}
.pv-vsc.r .pv-bigav img{transform:scaleX(-1)}
.pv-vsc b{display:block;font-family:'Lilita One',sans-serif;font-weight:400;font-size:19px;overflow-wrap:anywhere;line-height:1.1}
.pv-vsc span{font-size:12px;font-weight:900;color:#ffd25e}
.pv-bigvs{flex:none;font-family:'Lilita One',sans-serif;font-size:50px;color:#ffd25e;text-shadow:0 4px 0 #7a2a00,0 0 30px rgba(255,180,60,.8);animation:pvvs .6s .3s cubic-bezier(.2,1.6,.4,1) both}
.pv-res{background:rgba(3,5,18,.78)}
.pv-card{width:100%;max-width:420px;border-radius:24px;background:linear-gradient(180deg,#1d2768,#0f1540);border:1px solid rgba(160,180,255,.5);padding:18px 14px;text-align:center;animation:pvup .35s cubic-bezier(.2,1.3,.4,1)}
.pv-card h2{font-family:'Lilita One',sans-serif;font-weight:400;font-size:40px;margin:0;line-height:1}
.pv-card h2.win{color:#ffd25e;text-shadow:0 3px 0 #7a4a00,0 0 24px rgba(255,210,94,.6)}
.pv-card h2.lose{color:#ff9aa8;text-shadow:0 3px 0 #5a0010}
.pv-card p{margin:6px 0 0;color:#9aa6d6;font-size:13px;font-weight:800;overflow-wrap:anywhere}
.pv-rwt{margin:12px 0 0;font-size:10px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:#9aa6d6}
.pv-rw{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:6px 0 12px}
.pv-rw div{border-radius:14px;background:rgba(5,8,28,.55);border:1px solid rgba(130,150,255,.28);padding:8px 4px;min-width:0}
.pv-rw img{width:28px;height:28px;display:block;margin:0 auto;object-fit:contain}
.pv-rw b{display:block;font-family:'Lilita One',sans-serif;font-weight:400;font-size:18px;white-space:nowrap}
.pv-rw small{font-size:10px;color:#9aa6d6;font-weight:800}
.pv-lg{margin:4px 0 14px;text-align:left}
.pv-lg .row{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900}
.pv-lg .row span:last-child{color:#ffd25e;text-align:right}
.pv-lgb{height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:5px;position:relative}
.pv-lgb i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#9fb6ff,#e9efff);animation:pvbar 1.2s ease-out both;transform-origin:0 50%}
.pv-acts{display:flex;gap:8px}
.pv-acts button{flex:1;min-width:0;min-height:50px;border-radius:14px;font-weight:900;font-size:15px;padding:0 6px}
.pv-acts .g{background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;border:0;box-shadow:0 3px 0 #9a5a10}
.pv-acts .g[disabled]{opacity:.45}
.pv-acts .o{background:rgba(255,255,255,.06);border:1px solid rgba(160,180,255,.5)}
.pv-ub{position:absolute;left:0;right:0;z-index:15;text-align:center;pointer-events:none}
.pv-ub div{display:inline-block;max-width:100%;padding:8px 22px;font-family:'Lilita One',sans-serif;font-size:22px;color:#fff;background:linear-gradient(90deg,transparent,rgba(169,123,255,.85),transparent);text-shadow:0 2px 0 #000;animation:pvban 1.4s ease-out both}
.pv-ub small{display:block;font-family:Nunito,system-ui,sans-serif;font-size:11px;font-weight:900;color:#e7dcff;letter-spacing:1px}
@keyframes pvpulse{to{opacity:.6}}
@keyframes pvfin{from{opacity:0;transform:translateY(6px)}}
@keyframes pvsl{from{transform:translateX(-160px);opacity:0}}
@keyframes pvsr{from{transform:translateX(160px);opacity:0}}
@keyframes pvvs{from{transform:scale(3);opacity:0}}
@keyframes pvup{from{transform:translateY(40px) scale(.95);opacity:0}}
@keyframes pvbar{from{transform:scaleX(.6)}}
@keyframes pvban{0%{opacity:0;transform:scaleX(.2)}15%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.pv *{animation-duration:.01ms !important}}`;
const PV_ULT_DUR=2.5, PV_ULT_HIT=1.55, PV_VS=1.9, PV_FADE=0.35;   /* duração da folha da ultimate (a da batalha) · instante do golpe dela · abertura VS (s) · transparência mínima de quem perdeu */
function paPvInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pv_css')) return; const st=document.createElement('style'); st.id='pv_css'; st.textContent=PV_CSS; document.head.appendChild(st); }
const paPvHash=s=>{ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; };
const paPvSkin=id=>{ try{ return typeof SKIN==='function'?(SKIN(id)||null):null; }catch(e){ return null; } };
/* ultimate de uma arma: {sheet (folha da batalha, ou null = efeito por código), name} */
function paPvUlt(arm,era){ let sheet=null, name='Ultimate'; try{ const E=Math.max(0,Math.min((typeof SKN!=='undefined'?SKN.length:1)-1,era|0)); if(typeof SKN!=='undefined'&&SKN[E]&&SKN[E][1]) name=SKN[E][1];
    const P=typeof ultPlan==='function'?ultPlan(arm,E):null; if(P&&P.sheet){ sheet=P.sheet; if(typeof IMG==='function') IMG(sheet+'.png'); if(typeof J==='function') J(sheet+'.json'); } }catch(e){}
  return {sheet,name}; }
/* a MINHA aparência: a do jogo (heroLook: item equipado na mão, montaria equipada, asa equipada; pet e aura do save) */
function paPvMyLook(){ const L={hero:'kael',mount:null,wing:null,weapon:null,armor:null,aura:null,pet:null,ult:{sheet:null,name:'Ultimate'},me:true};
  try{ L.hero=S.hero==='kaia'?'kaia':'kael'; }catch(e){}
  try{ const lk=heroLook(); L.mount=lk.mount||null; L.wing=(typeof wingNow==='function'?wingNow(lk):lk.wing)||null; L.weapon=(typeof wFamLook==='function'?wFamLook(lk.weapon):lk.weapon)||lk.weapon; L.armor=lk.armor; }catch(e){}
  try{ L.aura=typeof auraPick==='function'?(auraPick({main:true})||null):null; }catch(e){}
  try{ const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base) L.pet={base:i.draw.base,stage:i.stage|0,fly:!!i.draw.fly}; }catch(e){}
  try{ const ws=typeof wSkin==='function'?wSkin():L.weapon; L.ult=paPvUlt(typeof wArm==='function'?wArm():ws,ws?ws.e:0); }catch(e){}
  return L; }
/* aparência do ADVERSÁRIO: opp.look quando o provider mandar; senão a skin que o módulo dá + montaria/pet/asa/aura por conta fixa do id (só visual) */
function paPvOppLook(opp){ const k=opp&&opp.look&&typeof opp.look==='object'?opp.look:null, h=paPvHash(opp&&opp.id), sk=(opp&&opp.skin)||{};
  const L={hero:k&&k.hero==='kaia'?'kaia':'kael',mount:null,wing:null,weapon:paPvSkin((k&&k.weapon)||sk.weapon)||paPvSkin('w00'),armor:paPvSkin((k&&k.armor)||sk.armor)||paPvSkin('a00'),aura:null,pet:null,ult:{sheet:null,name:'Ultimate'},me:false};
  const tbl=typeof MOUNT_TBL!=='undefined'?MOUNT_TBL:{};
  if(k){ if(k.mount&&tbl[k.mount.id]) L.mount={id:k.mount.id,stars:Math.max(0,Math.min(5,k.mount.stars|0))}; if(typeof k.wing==='string') L.wing=k.wing; if(typeof k.aura==='string') L.aura=k.aura.indexOf('/')>=0?k.aura:'assets/anim/aura/'+k.aura;
    if(k.pet&&(k.pet.base||k.pet.sprite)){ const st=Math.max(1,Math.min(3,k.pet.stage|0||1)); L.pet={base:k.pet.base||(k.pet.sprite+['','_mid','_evo'][st-1]),stage:st,fly:!!k.pet.fly}; } }
  else { let ids=[]; try{ ids=typeof mountIds==='function'?mountIds().map(m=>m.id):[]; }catch(e){ ids=[]; } if(!ids.length) ids=Object.keys(tbl).filter(id=>id!=='mythic');
    if(ids.length) L.mount={id:ids[h%ids.length],stars:1+((h>>>4)%5)};
    const pets=['era0_mammoth','era1_sphinx','era2_dragon','era3_parrot','era4_mechdog'], sp=pets[(h>>>8)%pets.length], st=1+((h>>>12)%3); L.pet={base:sp+['','_mid','_evo'][st-1],stage:st,fly:sp==='era3_parrot'};
    L.wing=((h>>>16)&1)?'demon':'angel';
    const au=[4,7,10,13][(h>>>18)%4]; try{ if(typeof ART_ON!=='undefined'&&ART_ON['aura'+au]===true) L.aura='assets/anim/aura/aura'+au; }catch(e){} }
  if(L.hero==='kaia'&&L.mount){ let ok=false; try{ ok=typeof mountArtOf==='function'&&mountArtOf('kaia',L.mount.id)===true; }catch(e){} if(!ok) L.hero='kael'; }   /* Kaia só monta onde há arte; senão o corpo padrão do Kael */
  try{ const ws=L.weapon||{e:0,r:0}; L.ult=paPvUlt({slot:'weapon',r:ws.r|0,e:ws.e|0},ws.e|0); }catch(e){}
  return L; }
/* medidas da cena para uma tela de W x H px (base do protótipo: 390). f = escala pela largura; hs = encolhe os heróis se faltar altura.
   gy = linha dos pés dos heróis; gyP = linha dos pés dos pets (plano da frente, mais baixo); K = lado do quadro do herói; x = pés do herói (do lado dele) */
function paPvGeo(W,H){ W=Math.max(240,+W||390); H=Math.max(360,+H||640); const f=Math.max(0.6,Math.min(1.3,W/390)), feedTop=H-176, gyP=feedTop-8;
  const hs=Math.max(0.5,Math.min(1,(gyP-46*f-104)/(205*f))), gy=gyP-46*f*hs;
  return {W,H,f,hs,gy,gyP,feedTop,K:125*f*hs,x:80*f,ax:110*f,hitX:120*f,hitY:gy-120*f*hs,ubTop:Math.max(96,gy-150*f*hs)}; }
/* pet do lado i, em coordenadas do LADO DELE (0 = borda de trás do dono): {x centro, k escala, l/r meias larguras, gy, fly}. Preso à metade do dono. */
function paPvPet(P,G,atk){ let m=null; try{ m=typeof petMetric==='function'?petMetric(P.base):null; }catch(e){ m=null; } if(!m) m={h:150,l:70,r:70};
  let bh=G.K*0.62; try{ if(typeof heroBodyH==='function'&&typeof HS!=='undefined'&&HS>0) bh=heroBodyH()*G.K/HS; }catch(e){}
  const fr=[0.46,0.52,0.62][Math.max(0,Math.min(2,(P.stage|0)-1))], k=bh*fr/Math.max(20,m.h), l=m.l*k, r=m.r*k;
  let x=(atk?114:82)*G.f; x=Math.max(x,2+l); x=Math.min(x,G.W/2-4-r);   /* nunca passa do meio da tela: os dois pets não se encostam */
  return {x,k,l,r,gy:G.gyP,fly:P.fly?bh*0.12:0}; }
/* caixa do pet na TELA (lado 1 espelhado) */
function paPvPetBox(i,pv,G,atk){ const P=pv.F[i].look.pet; if(!P) return null; const q=paPvPet(P,G,atk); return i===0?{l:q.x-q.l,r:q.x+q.r,gy:q.gy}:{l:G.W-(q.x+q.r),r:G.W-(q.x-q.l),gy:q.gy}; }
/* ROTEIRO: o registro na ordem, com hora. lag[s] = segundos do início do golpe ao acerto (montado 0,64; a pé 0,19) */
function paPvScript(log,lag){ const n=log.length, gap=Math.max(0.7,Math.min(1.35,32/Math.max(1,n))), ek=Math.min(1,14/Math.max(1,n)), en=[0,0], cnt=[0,0], out=[]; let T=0.4;   /* ek: luta longa enche a energia mais devagar (cerca de 2 ultimates por lado) */
  for(let i=0;i<n;i++){ const e=log[i], s=e.s?1:0, pet=e.k==='pet'||e.pet===true, ult=!pet&&(e.k==='ult'||e.ult===true||(e.k==null&&e.ult==null&&en[s]>=100));
    if(ult){ en[s]=0; out.push({t:T,k:'ult',s,i}); out.push({t:T+PV_ULT_HIT,k:'hit',s,i,dmg:+e.dmg||0,crit:!!e.crit,ult:true,pet:false,hp:+e.hp||0,en:en.slice()}); T+=PV_ULT_DUR+0.4; }
    else { cnt[s]++; out.push({t:T,k:'atk',s,i,pet:pet||!!e.crit||cnt[s]%3===0,solo:pet}); en[s]=Math.min(100,en[s]+22*ek); en[1-s]=Math.min(100,en[1-s]+12*ek);
      out.push({t:T+Math.min(pet?0.6:lag[s],gap-0.05),k:'hit',s,i,dmg:+e.dmg||0,crit:!!e.crit,ult:false,pet,hp:+e.hp||0,en:en.slice()}); T+=gap; } }
  return out; }
function paPvStart(opp,r,myFc,maxA,maxB){ paPvFree(); const d=r.duel||{}, log=(Array.isArray(d.log)?d.log:Array.isArray(r.log)?r.log:[]).filter(e=>e&&typeof e==='object'&&(e.s===0||e.s===1));
  const L=[paPvMyLook(),paPvOppLook(opp)], mk=l=>{ const m=!!l.mount; return {look:l,at:-9,dur:m?17/14:0.4,lag:m?0.64:0.19,act:null,shake:0,alpha:1,petT:-9,petDur:1}; }, F=[mk(L[0]),mk(L[1])];
  if(d.hpLeftA>0&&d.hpA>0) maxA=d.hpLeftA/d.hpA; if(d.hpLeftB>0&&d.hpB>0) maxB=d.hpLeftB/d.hpB;   /* vida cheia = a do duelo (sobra ÷ fração); sem isso, a calculada antes da luta */
  XA2.pv={opp,r,myFc,log,max:[Math.max(1,maxA),Math.max(1,maxB)],hp:[Math.max(1,maxA),Math.max(1,maxB)],en:[0,0],dmg:[0,0],crits:0,used:[],F,script:paPvScript(log,[F[0].lag,F[1].lag]),i:0,
    clock:0,vsT:0,endT:0,phase:'vs',speed:XA2.pvSpeed||1,ULT:null,ub:null,FX:[],feed:[],loser:-1,rdy:false,last:0,off:null,geo:paPvGeo(390,640)}; }
function paPvFree(){ const pv=XA2.pv; if(pv&&pv.off){ try{ pv.off.width=pv.off.height=1; }catch(e){} pv.off=null; } XA2.pv=null; paPvLoopOff(); }
const paPvEl=id=>{ try{ return typeof document!=='undefined'?document.getElementById(id):null; }catch(e){ return null; } };
const paPvPct=(v,m)=>Math.max(0,Math.min(100,v/m*100));
const paPvClock=t=>{ const s=Math.max(0,Math.floor(t)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
const paPvFeedHTML=pv=>pv.feed.map(x=>`<div class="${x.c}">${paEsc(x.t)}</div>`).join('');
const paPvUbHTML=pv=>pv.ub?`<div><small>ULTIMATE · ${pv.ub.s===0?'SUA':'ADVERSÁRIO'}</small>${paEsc(pv.ub.name)}</div>`:'';
/* barras e contadores direto no DOM (sem redesenhar a tela a cada golpe) */
function paPvHud(){ const pv=XA2.pv; if(!pv) return; const set=(id,fn)=>{ const e=paPvEl(id); if(e) try{ fn(e); }catch(er){} };
  for(let i=0;i<2;i++){ const p=paPvPct(pv.hp[i],pv.max[i]), w=p.toFixed(1)+'%'; set('pa_hp'+i,e=>{ e.style.width=w; }); set('pa_lg'+i,e=>{ e.style.width=w; }); set('pa_ht'+i,e=>{ e.textContent=paF(pv.hp[i]); });
    set('pa_hb'+i,e=>{ e.className='pv-bar'+(p<30?' low':''); }); set('pa_en'+i,e=>{ e.style.width=pv.en[i].toFixed(1)+'%'; }); set('pa_eb'+i,e=>{ e.className='pv-en'+(pv.en[i]>=100?' full':''); }); }
  set('pa_d0',e=>{ e.textContent=paF(pv.dmg[0]); }); set('pa_d1',e=>{ e.textContent=paF(pv.dmg[1]); }); set('pa_cr',e=>{ e.textContent=String(pv.crits); }); set('pa_tm',e=>{ e.textContent=paPvClock(pv.clock); }); }
function paPvFeed(pv,t,c){ pv.feed.unshift({t,c:c||''}); if(pv.feed.length>2) pv.feed.length=2; const e=paPvEl('pa_feed'); if(e) try{ e.innerHTML=paPvFeedHTML(pv); }catch(er){} }
function paPvUb(pv,ub){ pv.ub=ub; const e=paPvEl('pa_ub'); if(e) try{ e.innerHTML=paPvUbHTML(pv); }catch(er){} }
/* aplica UM evento do roteiro. quiet = Pular (sem efeitos; os números são os mesmos) */
function paPvApply(pv,ev,quiet){ const s=ev.s, A=pv.F[s], D=pv.F[1-s], G=pv.geo, who=s===0?'Você':pv.opp.name;
  if(ev.k==='atk'){ if(!quiet){ if(!ev.solo) A.at=ev.t; if(ev.pet&&A.look.pet){ A.petT=ev.t+(ev.solo?0:0.3); A.petDur=1; } } return; }
  if(ev.k==='ult'){ pv.en[s]=0; if(!quiet){ pv.ULT={t:ev.t,side:s,sheet:A.look.ult.sheet,dur:PV_ULT_DUR}; A.at=ev.t+PV_ULT_HIT-A.lag; if(A.look.pet){ A.petT=ev.t+PV_ULT_HIT-0.5; A.petDur=1; }
      paPvUb(pv,{s,name:A.look.ult.name}); paPvFeed(pv,who+' usou '+A.look.ult.name,'u'); paSnd('ult'); paPvHud(); } return; }
  /* acerto: os números do registro */
  pv.hp[1-s]=Math.max(0,ev.hp); pv.dmg[s]+=ev.dmg; if(ev.crit&&s===0) pv.crits++; pv.en[0]=ev.en[0]; pv.en[1]=ev.en[1]; pv.used.push(ev.i);
  if(quiet) return;
  D.shake=ev.crit||ev.ult?1.4:0.8; const hx=1-s===0?G.hitX:G.W-G.hitX, dir=1-s===0?1:-1;
  pv.FX.push({kind:'n',x:hx+(ev.pet?24*G.f:0)*dir,y:G.hitY+(ev.pet?70*G.f*G.hs:0),txt:paF(ev.dmg),crit:ev.crit||ev.ult,t:pv.clock}); pv.FX.push({kind:'s',x:hx,y:G.hitY+30*G.f*G.hs,t:pv.clock,s:(ev.i*1.7)%6.28});
  if(ev.crit&&!ev.pet&&!ev.ult) paPvFeed(pv,(s===0?'Crítico seu: ':'Crítico dele: ')+paF(ev.dmg),'k');
  paSnd(ev.crit||ev.ult?'crit':'hit'); paPvHud(); }
function paPvFire(pv,quiet){ while(pv.i<pv.script.length&&(quiet||pv.script[pv.i].t<=pv.clock)) paPvApply(pv,pv.script[pv.i++],quiet);
  if(pv.i>=pv.script.length&&pv.phase==='run'){ pv.phase='end'; pv.endT=0; const l=pv.r.win?1:0; pv.loser=pv.hp[l]<=0?l:-1; } }
function paPvFinish(pv){ pv.phase='result'; XA2.view='result'; paPvUb(pv,null); paSnd(pv.r.win?'claim':'ui_tap'); try{ render(); }catch(e){} }
/* passo da luta: dt em segundos de relógio real (a velocidade x1/x2/x4 entra aqui) */
function paPvStep(dt){ const pv=XA2.pv; if(!pv) return; dt=Math.max(0,+dt||0);
  if(pv.phase==='vs'){ pv.vsT+=dt; if(pv.vsT>=PV_VS&&(pv.rdy||pv.vsT>=PV_VS+4)){ pv.phase='run'; try{ render(); }catch(e){} } return; }
  pv.clock+=dt*(pv.phase==='result'?1:pv.speed);
  if(pv.phase==='run') paPvFire(pv,false);
  for(const F of pv.F) if(F.shake>0) F.shake=Math.max(0,F.shake-dt*pv.speed*4.8);
  if(pv.ULT&&pv.clock-pv.ULT.t>=pv.ULT.dur) pv.ULT=null;
  if(pv.ub&&(!pv.ULT||pv.clock-pv.ULT.t>1.5)) paPvUb(pv,null);
  if(pv.FX.length) pv.FX=pv.FX.filter(o=>pv.clock-o.t<=1.1);
  if(pv.phase!=='result'){ const e=paPvEl('pa_tm'); if(e) try{ e.textContent=paPvClock(pv.clock); }catch(er){} }
  if(pv.phase==='end'||pv.phase==='result'){ if(pv.loser>=0){ const F=pv.F[pv.loser]; F.alpha=Math.max(PV_FADE,F.alpha-dt*1.5); } }
  if(pv.phase==='end'){ pv.endT+=dt*Math.min(pv.speed,2); if(pv.endT>=1.1&&!pv.ULT) paPvFinish(pv); } }
/* PULAR: aplica o resto do registro de uma vez e abre o resultado */
function paPvSkip(){ const pv=XA2.pv; if(!pv||pv.phase==='result') return; if(pv.phase==='vs') pv.phase='run'; paPvFire(pv,true); pv.ULT=null; pv.FX=[]; pv.feed=[]; if(pv.loser>=0) pv.F[pv.loser].alpha=PV_FADE; paPvFinish(pv); }
/* ---------- desenho ---------- */
function paPvAura(g,base,cx,by,w,t){ if(!base||typeof sheetLoad!=='function') return; const s=sheetLoad(base,true); if(!s.ok) return; const M=s.meta, fi=Math.floor(t*(M.fps||12))%(M.frames||1), h=w*M.h/M.w;
  g.save(); g.globalAlpha=0.85; if(M.blend==='lighter') g.globalCompositeOperation='lighter'; g.drawImage(s.img,sheetSX(M,fi),sheetSY(M,fi),M.w,M.h,cx-w/2,by-h,w,h); g.restore(); }
/* um lutador no LADO DELE (o adversário chega aqui com o canvas já espelhado): aura → asa, montaria, herói e arma (drawHeroFull) */
function paPvFighter(g,i,pv,G){ const F=pv.F[i], L=F.look, t=pv.clock+i*0.37, hsNow=(typeof HS!=='undefined'&&HS>0)?HS:155, k=G.K/hsNow, x=G.x+(F.shake>0?(Math.random()-0.5)*8*F.shake*G.f:0);
  if(L.aura){ const on=!!L.mount; paPvAura(g,L.aura,on?G.ax:G.x,G.gy+8*G.f*G.hs,G.K*(on?1.68:1.15),t); }
  if(typeof window.drawHeroFull!=='function') return false;
  const el=pv.clock-F.at; let act=null;
  if(el>=0&&el<F.dur){ const ws=L.weapon||{e:0,r:0}; let gun=false; try{ gun=!L.mount&&typeof wIsGun==='function'&&!!wIsGun(ws); }catch(e){}
    act=F.act||(F.act={type:'s1',t:0,era:0,gun:false,col:'#ffffff',hits:[{s:0,t:0,m:1,i:0}],ev:[],dur:F.dur}); act.t=el; act.dur=F.dur; act.era=ws.e|0; act.gun=gun; act.hits[0].s=act.hits[0].t=gun?0.03:F.lag; }
  const st={t,act,pet:false}; if(i===1){ st.mount=L.mount||false; st.wing=L.wing||false; if(L.weapon) st.weapon=L.weapon; if(L.armor) st.armor=L.armor; st.skin='default'; st.layers=[]; }
  let ok=false, h0=null, sw=false; try{ if(i===1&&typeof S!=='undefined'&&S&&(S.hero==='kaia'?'kaia':'kael')!==L.hero){ h0=S.hero; S.hero=L.hero; sw=true; }   /* corpo do adversário: troca só durante este desenho, devolvida no finally */
    ok=window.drawHeroFull(g,x,G.gy,k,st)!==false; }catch(e){ ok=false; } finally{ if(sw) S.hero=h0; }
  return ok; }
/* pet do lado i, por ÚLTIMO, no plano da frente (pés em gyP, sombra no chão dele) */
function paPvPetDraw(g,i,pv,G){ const F=pv.F[i], P=F.look.pet; if(!P||typeof sheetLoad!=='function') return false; const dir=typeof PET_DIR!=='undefined'?PET_DIR:'assets/anim/pets/', el=pv.clock-F.petT;
  let atk=el>=0&&el<F.petDur, sh=atk?sheetLoad(dir+P.base+'_atk1',true):null; const idle=sheetLoad(dir+P.base+'_idle',true); if(!sh||!sh.ok){ sh=idle; atk=false; } if(!sh.ok) return false;
  const M=sh.meta, n=M.frames||1, fps=M.fps||12, fi=atk?Math.min(n-1,Math.floor(el*fps)):Math.floor((pv.clock+i*0.4)*fps)%n, q=paPvPet(P,G,el>=0&&el<F.petDur);
  const ax=(M.padLeft!=null?M.padLeft:96)+128, fy=typeof M.feetY==='number'?M.feetY:307, fly=q.fly?q.fly*(1+0.1*Math.sin(pv.clock*3)):0;
  g.save(); g.globalAlpha=0.28; g.fillStyle='#05020e'; g.beginPath(); g.ellipse(q.x,q.gy+G.K*0.012,G.K*(fly?0.09:0.13),G.K*0.032,0,0,7); g.fill(); g.restore();
  g.drawImage(sh.img,sheetSX(M,fi),sheetSY(M,fi),M.w,M.h,q.x-ax*q.k,q.gy-fly-fy*q.k,M.w*q.k,M.h*q.k); return true; }
/* ULTIMATE pela receita da batalha (fnSheet, screen 'full'): faixa da largura do campo + 24, apoiada 9% da largura abaixo dos pés, do lado de quem soltou */
function paPvUltDraw(g,pv,G){ const U=pv.ULT, t=pv.clock-U.t; if(t<0) return; const im=U.sheet&&typeof IMG==='function'?IMG(U.sheet+'.png'):null, M=U.sheet&&typeof J==='function'?J(U.sheet+'.json'):null;
  const ww=G.W+24*G.f, base=G.gy+G.W*0.09*G.hs; g.save(); if(U.side===1){ g.translate(G.W,0); g.scale(-1,1); }
  if(im&&M&&M.frames>0&&M.w>0){ const fi=Math.min(M.frames-1,Math.floor(t/U.dur*M.frames)), cols=M.cols>0?M.cols:M.frames, hh=ww*M.h/M.w; if(M.blend==='lighter') g.globalCompositeOperation='lighter';
    g.drawImage(im,(fi%cols)*M.w,Math.floor(fi/cols)*M.h,M.w,M.h,-12*G.f,base-hh,ww,hh); }
  else { const a=Math.max(0,Math.sin(Math.min(1,t/U.dur)*Math.PI))*0.6, hh=130*G.f*G.hs, gr=g.createLinearGradient(0,base-hh,0,base);   /* arma sem folha de ultimate: feixe por código */
    gr.addColorStop(0,'rgba(169,123,255,0)'); gr.addColorStop(0.6,'rgba(190,150,255,'+a.toFixed(3)+')'); gr.addColorStop(1,'rgba(255,255,255,0)'); g.globalCompositeOperation='lighter'; g.fillStyle=gr; g.fillRect(-12*G.f,base-hh,ww*Math.min(1,t*2.2),hh); }
  g.restore(); }
function paPvDraw(){ const pv=XA2.pv; if(!pv) return false; const c=XA2.cv||paPvEl('pa_cv'); if(!c||typeof c.getContext!=='function') return false; const g=c.getContext('2d'); if(!g) return false;
  const G=pv.geo, dpr=Math.max(1,Math.min(2,(typeof window!=='undefined'&&window.devicePixelRatio)||1)), cw=Math.round(G.W*dpr), ch=Math.round(G.H*dpr);
  if(c.width!==cw||c.height!==ch){ c.width=cw; c.height=ch; }
  g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,G.W,G.H); const cx=G.W/2;
  /* chão da arena */
  { const gr=g.createRadialGradient(cx,G.gy,20*G.f,cx,G.gy,190*G.f); gr.addColorStop(0,'rgba(255,93,122,.28)'); gr.addColorStop(1,'rgba(255,93,122,0)'); g.fillStyle=gr; g.beginPath(); g.ellipse(cx,G.gy,190*G.f,30*G.f,0,0,7); g.fill();
    g.save(); g.strokeStyle='rgba(255,210,94,.45)'; g.setLineDash([6,7]); g.lineDashOffset=-pv.clock*12; g.lineWidth=1.5; g.beginPath(); g.ellipse(cx,G.gy,170*G.f,22*G.f,0,0,7); g.stroke(); g.restore(); }
  if(pv.ULT){ const t=pv.clock-pv.ULT.t; g.fillStyle='rgba(5,0,20,'+Math.max(0,Math.min(0.22,t)).toFixed(3)+')'; g.fillRect(0,0,G.W,G.H); }   /* escurecimento leve */
  const side=(gg,i,fn)=>{ gg.save(); if(i===1){ gg.translate(G.W,0); gg.scale(-1,1); } let r=false; try{ r=fn(gg,i,pv,G); }finally{ gg.restore(); } return r; };
  const fighter=i=>{ const F=pv.F[i]; if(F.alpha>=1) return side(g,i,paPvFighter);
    /* quem perdeu fica translúcido: desenhado inteiro num canvas à parte e composto com a transparência (o desenho da batalha fixa a própria transparência) */
    let o=pv.off; if(!o){ try{ o=pv.off=document.createElement('canvas'); }catch(e){ o=null; } } if(!o||typeof o.getContext!=='function') return side(g,i,paPvFighter);
    if(o.width!==cw||o.height!==ch){ o.width=cw; o.height=ch; } const og=o.getContext('2d'); if(!og) return side(g,i,paPvFighter); og.setTransform(dpr,0,0,dpr,0,0); og.clearRect(0,0,G.W,G.H);
    const r=side(og,i,paPvFighter); g.save(); g.globalAlpha=F.alpha; g.drawImage(o,0,0,G.W,G.H); g.restore(); return r; };
  let r0, r1;
  if(pv.ULT){ const a=pv.ULT.side; if(a===0){ r1=fighter(1); paPvUltDraw(g,pv,G); r0=fighter(0); } else { r0=fighter(0); paPvUltDraw(g,pv,G); r1=fighter(1); } }   /* quem solta fica por cima da faixa, como na batalha */
  else { r0=fighter(0); r1=fighter(1); }
  if(r0&&r1) pv.rdy=true;
  side(g,0,paPvPetDraw); side(g,1,paPvPetDraw);   /* pets SEMPRE por último */
  /* números de dano (crítico em dourado) e faíscas */
  for(const o of pv.FX){ const t=pv.clock-o.t; if(t<0||t>1.1) continue;
    if(o.kind==='n'){ g.save(); g.globalAlpha=1-Math.max(0,t-0.6)/0.5; g.font='400 '+Math.round((o.crit?30:22)*G.f)+'px "Lilita One",Impact,sans-serif'; g.textAlign='center'; g.lineWidth=4; g.strokeStyle='#000'; const y=o.y-t*50*G.f; g.strokeText(o.txt,o.x,y); g.fillStyle=o.crit?'#ffe07a':'#fff'; g.fillText(o.txt,o.x,y);
      if(o.crit){ g.font='900 '+Math.round(11*G.f)+'px Nunito,sans-serif'; g.strokeText('CRÍTICO',o.x,y-24*G.f); g.fillStyle='#ffb347'; g.fillText('CRÍTICO',o.x,y-24*G.f); } g.restore(); }
    else { g.save(); g.globalCompositeOperation='lighter'; for(let j=0;j<10;j++){ const a=j/10*6.28+o.s, rr=t*120*G.f; g.fillStyle='rgba(255,'+(200-j*8)+',120,'+Math.max(0,1-t).toFixed(2)+')'; g.beginPath(); g.arc(o.x+Math.cos(a)*rr,o.y+Math.sin(a)*rr*0.6,3*(1-t)+1,0,7); g.fill(); } g.restore(); } }
  return true; }
let paPvRaf=0, paPvErr=0;
function paPvLoop(now){ paPvRaf=0; const pv=XA2.pv; if(!pv) return; try{ if(typeof view!=='undefined'&&view!=='arena'){ paPvFree(); return; } }catch(e){}
  const dt=pv.last?Math.min(0.05,Math.max(0,(now-pv.last)/1000)):0; pv.last=now;
  try{ paPvStep(dt); paPvDraw(); }catch(e){ if(!paPvErr){ paPvErr=1; try{ console.error('arena pvp',e); }catch(er){} } }
  if(XA2.pv&&!paPvRaf&&typeof requestAnimationFrame==='function') paPvRaf=requestAnimationFrame(paPvLoop); }
function paPvLoopOn(){ if(!paPvRaf&&XA2.pv&&typeof requestAnimationFrame==='function') paPvRaf=requestAnimationFrame(paPvLoop); }
function paPvLoopOff(){ if(paPvRaf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(paPvRaf); paPvRaf=0; }
/* ---------- tela ---------- */
function paPvLvl(){ try{ return Sys.level&&Sys.level.level?Sys.level.level(S):null; }catch(e){ return null; } }
function paPvPortrait(i,pv,sz){ if(i===0&&typeof avatarTag==='function') return avatarTag(sz,'position:absolute;left:0;top:0;width:100%;height:100%;display:block','');
  const h=i===0?pv.F[0].look.hero:pv.F[1].look.hero; return `<img src="assets/hero/avatar/${h==='kaia'?'kaia':'kael'}_phase0.png" alt="">`; }
/* prêmios da faixa: o que a LUTA creditou (r.rewards, se o módulo passar a dar) ou, sem isso, o prêmio da liga no fechamento da semana (Sys.arena.DATA.leagues) */
function paPvPrize(pv,li){ const rw=pv.r.rewards&&typeof pv.r.rewards==='object'?pv.r.rewards:null; let gold=0, gems=0, chest=0, title='';
  if(rw){ gold=+rw.gold||0; gems=+rw.gems||0; chest=Array.isArray(rw.chest)?rw.chest.length:(+rw.chest||0); title='Prêmio desta luta'; }
  else { const pz=(li.league&&li.league.prize)||{}; let u=1; try{ u=Math.max(1,+(paH().goldUnit&&paH().goldUnit())||1); }catch(e){ u=1; } gold=pz.goldk?Math.round(pz.goldk*u):0; gems=pz.gems|0; chest=pz.chest|0;
    title='Prêmio da liga '+li.league.name+' ao fechar a semana'+(li.rewardsOn?'':' · vale quando o ranking online abrir'); }
  return {gold,gems,chest,title,plus:rw?'+':''}; }
function paPvResultHTML(pv){ const r=pv.r, win=!!r.win, li=Sys.arena.leagueInfo(S,paH()), L=li.league, N=li.next, o=Sys.arena.ensure(S,paH()), pz=paPvPrize(pv,li), tm=paPvClock(pv.script.length?pv.script[pv.script.length-1].t:0);
  const frac=N?Math.max(0,Math.min(1,(li.lp-L.min)/Math.max(1,N.min-L.min))):1, to=!win&&pv.hp[0]>0;
  const hint=li.zone==='down'?'cuidado: abaixo de '+paN(L.min)+' você cai':N?(li.toUp>0?'faltam '+paN(li.toUp)+' para '+N.name:'sobe para '+N.name+' no fechamento'):'liga mais alta';
  return `<div class="pv-ovl pv-res"><div class="pv-card" role="dialog" aria-label="${win?'Vitória':'Derrota'}"><h2 class="${win?'win':'lose'}">${win?'VITÓRIA':'DERROTA'}</h2>
    <p>${win?'Você venceu '+paEsc(pv.opp.name)+' em '+tm:to?'Tempo esgotado: '+paEsc(pv.opp.name)+' venceu':paEsc(pv.opp.name)+' venceu em '+tm}</p>
    <div class="pv-rwt">${paEsc(pz.title)}</div>
    <div class="pv-rw"><div><img src="assets/ui/coin.png" alt=""><b>${pz.plus}${paF(pz.gold)}</b><small>moedas</small></div><div><img src="assets/ui/gem.png" alt=""><b>${pz.plus}${paN(pz.gems)}</b><small>gemas</small></div><div><img src="assets/ui/chest.png" alt=""><b>${paN(pz.chest)}</b><small>baú da liga</small></div></div>
    <div class="pv-lg"><div class="row"><span>Liga ${paEsc(L.name)}</span><span>${r.delta>=0?'+':'−'}${paN(Math.abs(r.delta))} pontos</span></div>
      <div class="pv-lgb" role="progressbar" aria-label="Pontos de liga" aria-valuenow="${li.lp}"><i style="width:${Math.round(frac*100)}%"></i></div>
      <div class="row" style="margin-top:4px;color:#9aa6d6;font-weight:800"><span>${paN(li.lp)}${N?' / '+paN(N.min):''}</span><span>${paEsc(hint)}</span></div></div>
    <div class="pv-acts"><button class="o" data-x="back">Voltar à arena</button><button class="g" data-x="again" ${o.attemptsLeft<=0?'disabled':''}>${o.attemptsLeft>0?'Lutar de novo · '+o.attemptsLeft:'Sem lutas hoje'}</button></div></div></div>`; }
function paPvHTML(d){ paPvInject(); const pv=XA2.pv, G=pv.geo=paPvGeo(d.Wb||390,d.H||640), li=Sys.arena.leagueInfo(S,paH()), o=Sys.arena.ensure(S,paH()), mx=paMaxTries(), lv=paPvLvl();
  const nm=[paMe()+(lv!=null?' · Nv '+lv:''),pv.opp.name], fc=[pv.myFc,pv.opp.fc], col=['#5ee7ff','#ff5d7a'];
  let bg=''; try{ if(typeof bgPath==='function'&&typeof B!=='undefined') bg=bgPath(B.dispEra!=null?B.dispEra:0); }catch(e){ bg=''; }
  const pl=i=>{ const p=paPvPct(pv.hp[i],pv.max[i]); return `<div class="pv-pl${i?' r':''}" style="--c:${col[i]}"><div class="pv-av" aria-hidden="true">${paPvPortrait(i,pv,46)}</div><div class="pv-pi"><div class="pv-pn">${paEsc(nm[i])}</div><div class="pv-pf">FC ${paFC(fc[i])}</div>
    <div class="pv-bar${p<30?' low':''}" id="pa_hb${i}" role="progressbar" aria-label="Vida de ${paEsc(i?pv.opp.name:paMe())}"><i class="lag" id="pa_lg${i}" style="width:${p.toFixed(1)}%"></i><i class="hp" id="pa_hp${i}" style="width:${p.toFixed(1)}%"></i><b id="pa_ht${i}">${paF(pv.hp[i])}</b></div>
    <div class="pv-en${pv.en[i]>=100?' full':''}" id="pa_eb${i}" role="progressbar" aria-label="Energia"><i id="pa_en${i}" style="width:${pv.en[i].toFixed(1)}%"></i></div></div></div>`; };
  const vsc=i=>`<div class="pv-vsc${i?' r':''}" style="--c:${col[i]}"><div class="pv-bigav">${paPvPortrait(i,pv,110)}</div><b>${paEsc(i?pv.opp.name:paMe())}</b><span>FC ${paFC(fc[i])}</span></div>`;
  const ov=pv.phase==='vs'?`<div class="pv-ovl pv-vs" role="status" aria-label="${paEsc(paMe())} contra ${paEsc(pv.opp.name)}"><div class="pv-vsrow">${vsc(0)}<div class="pv-bigvs">VS</div>${vsc(1)}</div><div style="font-weight:900;color:#9aa6d6;font-size:13px;text-align:center">Liga ${paEsc(li.league.name)} · luta automática</div></div>`
    :pv.phase==='result'?paPvResultHTML(pv):'';
  const sp=v=>`<button data-x="pvspd" data-v="${v}" aria-pressed="${pv.speed===v}" aria-label="Velocidade ${v} vezes">x${v}</button>`;
  return `<div class="pv" id="pa_pv">${bg?`<div class="pv-bg" style="height:${Math.round(G.gyP+60)}px;background-image:url(${bg})"></div>`:''}
    <div class="pv-bg2" style="background:linear-gradient(180deg,rgba(11,16,48,.55) 0,rgba(11,16,48,0) ${Math.round(G.gy*0.3)}px,rgba(11,16,48,0) ${Math.round(G.gy-30)}px,#0b1030 ${Math.round(G.gyP+56)}px)"></div>
    <canvas id="pa_cv" class="pv-cv" role="img" aria-label="Luta da arena: ${paEsc(paMe())} contra ${paEsc(pv.opp.name)}"></canvas>
    <div class="pv-hud">${pl(0)}<div class="pv-mid"><div class="pv-vsm">VS</div><div class="pv-tm" id="pa_tm" role="timer">${paPvClock(pv.clock)}</div></div>${pl(1)}</div>
    <div class="pv-league">Liga <b>${paEsc(li.league.name)}</b> · Luta ${Math.max(1,mx-o.attemptsLeft)} de ${mx} de hoje</div>
    <div class="pv-ub" id="pa_ub" style="top:${Math.round(G.ubTop)}px">${paPvUbHTML(pv)}</div>
    <div class="pv-feed" id="pa_feed" aria-live="polite" style="top:${Math.round(G.feedTop)}px">${paPvFeedHTML(pv)}</div>
    <div class="pv-info"><div><small>Dano seu</small><b id="pa_d0">${paF(pv.dmg[0])}</b></div><div><small>Críticos</small><b id="pa_cr">${pv.crits}</b></div><div><small>Dano dele</small><b id="pa_d1">${paF(pv.dmg[1])}</b></div></div>
    ${pv.phase==='result'?'':`<div class="pv-ctr">${sp(1)}${sp(2)}${sp(4)}<button class="skip" data-x="skip">Pular</button></div>`}
    ${ov}</div>`; }
Panels.add('arena',{title:'Arena',render:scrArena,click:paClick,
  busy(){ return XA2.view==='fight'; },
  tick(){ if(!paOk()||XA2.view!=='lobby'||XA2.tab!==0) return; try{ const w=document.getElementById('pa_week'), d=document.getElementById('pa_day');
    if(w) w.textContent=paClock(Sys.arena.leagueInfo(S,paH()).msLeft); if(d) d.textContent=paClock(paDayLeft()); }catch(e){} },
  onOpen(){ XA2.view='lobby'; XA2.tab=0; XA2.sel=0; paStop(); paPvFree(); }, onClose(){ paStop(); paPvFree(); XA2.view='lobby'; XA2.fight=null; } });
