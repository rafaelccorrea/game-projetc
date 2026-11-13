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
   Pedido ao engenheiro: incluir 'p_arena' na lista de scripts de js/screens.js:823 e abrir pelo menu (FB_UNLOCK.arena, nível 28). */
const XA2={tab:0,view:'lobby',sel:0,fight:null,res:null,step:0,speed:1,timer:0,sec:-1};
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
function paStop(){ if(paRaf&&typeof cancelAnimationFrame==='function'){ cancelAnimationFrame(paRaf); paRaf=0; } if(XA2.timer){ clearTimeout(XA2.timer); XA2.timer=0; } }
function paPlay(){ paStop(); const F=XA2.fight; if(!F) return; const n=(F.r.duel&&F.r.duel.log||[]).length;
  if(XA2.step>=n){ XA2.timer=setTimeout(()=>{ XA2.timer=0; XA2.view='result'; paSnd(F.r.win?'claim':'ui_tap'); render(); },500/XA2.speed); return; }
  XA2.timer=setTimeout(()=>{ XA2.timer=0; XA2.step++; const e=F.r.duel.log[XA2.step-1]; paSnd(e&&e.crit?'crit':'hit'); render(); paPlay(); },(XA2.step===0?900:420)/XA2.speed); }
function paClick(b){ const a=b.dataset.x; if(!paOk()) return; const h=paH();
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i!==XA2.tab&&i>=0&&i<3){ XA2.tab=i; paSnd('ui_tap'); render(); } return; }
  if(a==='sel'){ XA2.sel=parseInt(b.dataset.i,10)||0; paSnd('ui_tap'); render(); return; }
  if(a==='refresh'){ const r=Sys.arena.refresh(S,h); if(!r.ok){ paToast('Sem trocas grátis hoje'); return; } XA2.sel=0; paSnd('ui_tap'); render(); return; }
  if(a==='fight'||a==='again'){ const ops=Sys.arena.opponents(S,h), opp=ops[a==='again'?0:XA2.sel]; if(!opp) return; const myFc=paMyFc(), W=Sys.tower;
    let maxA=1, maxB=1; try{ const me=W.playerStats(S,h), foe=W.scaledFoe(me,opp.fc); maxA=Math.max(1,me.hp); maxB=Math.max(1,foe.hp); }catch(e){}
    const r=Sys.arena.fight(S,h,opp.id); if(!r.ok){ paToast(r.reason==='tries'?'Sem lutas hoje: recarrega à meia-noite':'Luta indisponível agora'); return; }
    try{ if(typeof save==='function') save(); }catch(e){}
    XA2.fight={opp,r,myFc,maxA,maxB}; XA2.step=0; XA2.view='fight'; paSnd('ui_tap'); render(); paPlay(); return; }
  if(a==='skip'){ paStop(); XA2.view='result'; render(); return; }
  if(a==='speed'){ XA2.speed=XA2.speed===1?2:1; render(); return; }
  if(a==='back'){ paStop(); XA2.view='lobby'; XA2.fight=null; render(); return; }
}
Panels.add('arena',{title:'Arena',render:scrArena,click:paClick,
  busy(){ return XA2.view==='fight'; },
  tick(){ if(!paOk()||XA2.view!=='lobby'||XA2.tab!==0) return; try{ const w=document.getElementById('pa_week'), d=document.getElementById('pa_day');
    if(w) w.textContent=paClock(Sys.arena.leagueInfo(S,paH()).msLeft); if(d) d.textContent=paClock(paDayLeft()); }catch(e){} },
  onOpen(){ XA2.view='lobby'; XA2.tab=0; XA2.sel=0; paStop(); }, onClose(){ paStop(); XA2.view='lobby'; XA2.fight=null; } });
