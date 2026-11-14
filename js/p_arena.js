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
const XA2={tab:0,view:'lobby',sel:0,fight:null,res:null,step:0,speed:1,timer:0,sec:-1,pv:null,pvSpeed:1,cv:null,wait:null,waitT:0,refBusy:false};
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

.pa-spin{width:34px;height:34px;border-radius:50%;border:4px solid #4a3a2b;border-top-color:#ffc94a;animation:paspin .8s linear infinite}@keyframes paspin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.pa-kid,.pa-in,.pa-vs,.pa-dmg,.pa-hit,.pa-shine::after,.pa-spin{animation:none}.pa-hp{transition:none}}`;
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
let paOwn=0;   /* > 0 = som/aviso da própria Arena (passa pelo filtro paPvQuiet enquanto a luta PvP está aberta) */
const paToast=t=>{ paOwn++; try{ if(typeof toast==='function') toast(t); }catch(e){} finally{ paOwn--; } };
const paSnd=n=>{ paOwn++; try{ if(typeof snd==='function') snd(n); }catch(e){} finally{ paOwn--; } };
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
/* moldura do adversário (look.frame do retrato no servidor; bot não tem). frameTag é a fonte única (js/fullbattle.js); id desconhecido = nada */
const paFrame=p=>{ const id=p&&p.look&&typeof p.look.frame==='string'?p.look.frame:null, h=id&&typeof frameTag==='function'?frameTag(id,false):''; return h?'<span style="position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px;pointer-events:none">'+h+'</span>':''; };
function paLobby(){ const h=paH(), li=Sys.arena.leagueInfo(S,h), o=Sys.arena.ensure(S,h), ops=paOpps(), L=li.league, N=li.next, net=!!paNet(), sfc=net?paSrvFc():0;
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
    <button data-x="refresh" class="pa-btn" style="padding:0 12px" aria-busy="${!!XA2.refBusy}" aria-label="Trocar adversários (${o.refreshLeft} grátis hoje)">${XA2.refBusy?'Trocando':'Trocar'} <span style="color:#ffe07a">${o.refreshLeft}</span></button></div>`;
  const dcol={easy:'#5fd068',even:'#ffc94a',hard:'#ff9a3c',nope:'#ff5a5a'};
  const list=ops.map((p,i)=>{ const on=i===XA2.sel, d=p.diff||(p.net?{id:'',txt:''}:{id:'even',txt:''}), fcT=paFCx(p.fc,p.net);
    const ptsA=p.winPts!=null&&p.losePts!=null?'vitória mais '+p.winPts+', derrota menos '+p.losePts+' pontos':p.noPts?'sem pontos':'vitória sobe, derrota desce';
    const pts=p.winPts!=null&&p.losePts!=null?`<span style="color:#5fd068;font-size:16px">+${paEsc(p.winPts)}</span><span style="color:#ff6b6b;font-size:13px">−${paEsc(p.losePts)}</span><span style="font-size:10px;color:#c9b9a2;font-family:inherit;font-weight:800">pts</span>`
      :p.noPts?`<span style="font-size:11px;color:#c9b9a2;font-family:Nunito,system-ui,sans-serif;font-weight:800">sem pontos</span>`
      :`<span style="font-size:11px;color:#5fd068;font-family:Nunito,system-ui,sans-serif;font-weight:800">Vitória: sobe</span><span style="font-size:11px;color:#ff6b6b;font-family:Nunito,system-ui,sans-serif;font-weight:800;margin-top:2px">Derrota: desce</span>`;
    return `<button data-x="sel" data-i="${i}" aria-pressed="${on}" aria-label="${paEsc(p.name)}, FC ${paEsc(fcT)}${p.net?(d.txt?', '+paEsc(d.txt):'')+', '+ptsA:', '+paEsc(d.txt)}" class="pa-in" style="position:relative;animation-delay:${i*.06}s;flex:none;height:72px;display:flex;align-items:center;gap:8px;padding:0 10px;border-radius:14px;background:${on?'#3a2c1f':'#1d1611'};border:2px solid ${on?'#ffc94a':'#4a3a2b'};color:#f6ecdf;text-align:left;width:100%">
      <span aria-hidden="true" style="flex:none;position:relative;display:flex"><span style="flex:none;width:54px;height:54px;border-radius:12px;overflow:hidden;position:relative;background:#2a1f16;border:2px solid ${dcol[d.id]||'#6b5843'}"><span style="position:absolute;left:-13px;top:-6px;width:80px;height:80px;display:block;transform:scaleX(-1)"><span class="pa-kid" style="position:absolute;inset:0;display:block"></span></span></span>${paFrame(p)}</span>
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;gap:2px"><span style="font-size:15px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${paEsc(p.name)}</span>
        <span style="font-size:12px;font-weight:800;color:#c9b9a2">FC ${paEsc(fcT)}${d.txt?` · <span style="color:${dcol[d.id]||'#c9b9a2'}">${paEsc(d.txt)}</span>`:''}</span></span>
      <span style="flex:none;display:flex;flex-direction:column;align-items:flex-end;font-family:'Lilita One',sans-serif;line-height:1.05">${pts}</span>
      ${on?`<span style="position:absolute;right:8px;top:-7px;font-size:9px;font-weight:900;color:#2a1403;background:#ffc94a;border-radius:6px;padding:1px 5px">ESCOLHIDO</span>`:''}</button>`; }).join('');
  return card+fights+`<div role="list" aria-label="Adversários" style="flex:none;display:flex;flex-direction:column;gap:6px">${list}</div>
    <span style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">${net?'Adversários e pontos do servidor'+(sfc>0?' · sua FC na Arena: '+paEsc(paN(sfc)):'')+' · luta automática':(paNetDown()?'Sem ligação com o servidor agora: lutas de treino contra cópias, não valem para o ranking online · luta automática':'Cópias de jogadores com FC até ±10% da sua · luta automática · prêmios valem quando o ranking online abrir')}</span>`; }
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
  if(r.loading||!r.list.length) return `<div role="status" style="flex:1;display:flex;align-items:center;justify-content:center;text-align:center;color:#c9b9a2;font-weight:800">${r.loading?'Carregando o ranking':'Ninguém no ranking desta semana ainda'}</div>`;
  const me=r.me||{}, hasRank=me.rank>0, from=Math.max(0,Math.min((hasRank?me.rank:1)-4,r.list.length-8)), rows=r.list.slice(from,from+8).map(x=>`<div style="flex:none;height:44px;display:flex;align-items:center;gap:8px;padding:0 8px;border-radius:12px;background:${x.me?'#3a2c1f':'#1d1611'};border:${x.me?'2px solid #ffc94a':'1px solid #4a3a2b'}">
      <span style="width:30px;text-align:center;font-family:'Lilita One',sans-serif;color:#c9b9a2">${x.rank}</span><span style="flex:1;min-width:0;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${paEsc(x.me?'Você · '+paMe():x.name)}</span>
      <span style="font-family:'Lilita One',sans-serif;color:#ffe07a">${paN(x.value)} pts</span></div>`).join('');
  const rb=(()=>{ try{ return typeof realmBadge==='function'?realmBadge():''; }catch(e){ return ''; } })();
  return `<span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${rb?'<b style="color:#ffe07a">'+paEsc(rb)+'</b> · ':''}Ranking da sua liga (${paEsc(li.league.name)}) nesta semana${hasRank?' · você em '+me.rank+'º':''}</span>
    <div style="flex:none;display:flex;flex-direction:column;gap:4px">${rows}</div>
    <span style="flex:none;font-size:10.5px;font-weight:800;color:#ffd27a;text-align:center">${r.bots===false?'Ranking do servidor · o prêmio é o da liga em que você fechar a semana':'Prévia com jogadores simulados · prêmios valem quando o ranking online abrir'}</span>`; }
/* ---------- LUTA: VS → golpes do registro → resultado ---------- */
function paFightView(){ const F=XA2.fight, log=(F.r.duel&&F.r.duel.log)||[], st=Math.min(XA2.step,log.length), cur=log[st-1];
  let hpA=1, hpB=1; const mA=F.maxA, mB=F.maxB; for(let i=0;i<st;i++){ const e=log[i]; if(e.s===0) hpB=e.hp/mB; else hpA=e.hp/mA; }
  const bar=(v,c)=>`<div style="height:12px;border-radius:7px;background:#140e08;border:2px solid #4a3a2b;overflow:hidden"><div class="pa-hp" style="height:100%;width:${Math.max(0,Math.round(v*100))}%;background:${c}"></div></div>`;
  const dmg=cur?`<span class="pa-dmg${cur.crit?' c':''}" style="${cur.s===0?'right:12%':'left:12%'};top:30%">${cur.crit?'CRÍTICO ':''}−${paF(cur.dmg)}</span>`:'';
  return `<div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px">
    <div style="flex:none;display:flex;align-items:center;gap:8px"><div style="flex:1;min-width:0"><span style="font-weight:900;font-size:13px">Você · ${paEsc(paMe())}</span><br><span style="font-size:11px;color:#c9b9a2;font-weight:800">FC ${paFCx(F.myFc,F.net)}</span>${bar(hpA,'#5fd068')}</div>
      <span class="pa-vs" style="font-family:'Lilita One',sans-serif;font-size:28px;color:#ffe07a;text-shadow:0 2px 0 #6a3a08">VS</span>
      <div style="flex:1;min-width:0;text-align:right"><span style="font-weight:900;font-size:13px">${paEsc(F.opp.name)}</span><br><span style="font-size:11px;color:#c9b9a2;font-weight:800">FC ${paFCx(F.opp.fc,F.net)}</span>${bar(hpB,'#ff5a5a')}</div></div>
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
    <span style="font-size:13px;font-weight:800;color:#c9b9a2">contra ${paEsc(F.opp.name)} · FC ${paFCx(F.opp.fc,F.net)}</span>
    <div style="display:flex;align-items:center;gap:8px">${paShield(L,44)}<span style="font-family:'Lilita One',sans-serif;font-size:26px;color:${r.delta>=0?'#5fd068':'#ff6b6b'}">${r.delta>=0?'+':'−'}${Math.abs(r.delta)}</span><span style="font-size:12px;font-weight:800;color:#c9b9a2">pontos de arena</span></div>
    <div style="width:86%"><div role="progressbar" aria-label="Pontos de liga" style="height:12px;border-radius:7px;background:#140e08;border:2px solid #4a3a2b;overflow:hidden"><div style="height:100%;width:${Math.round(frac*100)}%;background:${L.c1}"></div></div>
      <span style="font-size:11px;font-weight:800;color:#f6ecdf">Liga ${paEsc(L.name)} · ${paN(li.lp)}${N?' / '+paN(N.min):''} pts</span></div>
    <span style="font-size:11px;font-weight:800;color:#ffd27a">Prêmios valem quando o ranking online abrir</span>
    <div style="width:100%;display:flex;gap:8px;margin-top:6px"><button data-x="back" class="pa-btn" style="flex:1;height:54px">Voltar à arena</button>
      <button data-x="again" class="pa-gold" style="flex:1;height:54px;font-size:18px" ${o.attemptsLeft<=0?'disabled':''}>${o.attemptsLeft>0?'Lutar de novo':'Sem lutas hoje'}</button></div></div>`; }
function scrArena(){ try{ scrArena0(); }catch(e){ try{ console.error('arena',e); }catch(er){}   /* erro de desenho: fica na Arena com o aviso (o index trocaria a tela para a batalha e desligaria a Arena) */
    try{ V.innerHTML=xWrap(xDims(A_MINH),'',`<div role="alert" style="flex:1;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Arena indisponível agora.<button data-x="back" class="pa-btn" style="padding:0 18px">Voltar à arena</button></div>`); }catch(er){} } }
function scrArena0(){
  paInject(); const d=xDims(A_MINH);
  if(!paOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Arena indisponível agora.</div>`); return; }
  if((XA2.view==='fight'||XA2.view==='result')&&XA2.pv){ V.innerHTML=xWrap(d,'',paPvHTML(d)); try{ paPvDraw(); }catch(e){} paPvLoopOn(); return; }   /* luta PvP nova (chave PA_PVP2) */
  if(XA2.view==='fight'){ V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 2px 8px">${paFightView()}</div>`); if(!paRaf) paDrawMe(); return; }
  if(XA2.view==='result'){ V.innerHTML=xWrap(d,'',`<div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:4px 2px 8px">${paResult()}</div>`); return; }
  const asOn=paSetOn(); if(XA2.tab===3&&!asOn) XA2.tab=0;   /* aba "Conjunto PvP" (js/p_arenaset.js): só com a tela e o Sys.arenaSet ligados */
  const TABS=['Arena','Ligas','Ranking'].concat(asOn?[PArenaSet.tab]:[]), tabs=TABS.map((t,i)=>`<button role="tab" aria-selected="${i===XA2.tab}" data-x="tab" data-i="${i}" style="flex:1;height:46px;border-radius:11px;border:2px solid ${i===XA2.tab?'#ffc94a':'#4a3a2b'};background:${i===XA2.tab?'#4a3214':'#2a1f16'};color:${i===XA2.tab?'#ffe07a':'#c9b9a2'};font-family:'Lilita One',sans-serif;font-size:15px">${t}</button>`).join('');
  const body=XA2.tab===1?paLeagues():XA2.tab===2?paRanking():(XA2.tab===3&&asOn)?PArenaSet.html():paLobby(), o=Sys.arena.ensure(S,paH());
  const foot=XA2.tab===0?`<div style="flex:none;padding:6px 2px;padding-bottom:max(8px,env(safe-area-inset-bottom))"><button data-x="fight" class="pa-gold pa-shine" style="width:100%;height:60px;font-size:24px" ${o.attemptsLeft<=0?'disabled':''} aria-label="Lutar contra o adversário escolhido">${o.attemptsLeft>0?'LUTE!':'Sem lutas hoje'}</button></div>`:'';
  V.innerHTML=xWrap(d,'',`<div class="x-scroll f-in" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding:4px 2px 6px">
    <div role="tablist" aria-label="Arena" style="flex:none;display:flex;gap:4px">${tabs}</div>${body}</div>${foot}${paWaitHTML()}`);
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
function paClick(b){ const a=b.dataset.x; if(!paOk()) return; const h=paH(); if(XA2.wait) return;   /* esperando o servidor decidir a luta: nenhum toque vale (o véu cobre a tela) */
  if(window.PArenaSet&&PArenaSet.click(b)){ return; }   /* toques "as-*" do Conjunto PvP */
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i!==XA2.tab&&i>=0&&i<(paSetOn()?4:3)){ XA2.tab=i; paSnd('ui_tap'); render(); if(i===2) paNetRank(); } return; }
  if(a==='sel'){ XA2.sel=parseInt(b.dataset.i,10)||0; paSnd('ui_tap'); render(); return; }
  if(a==='refresh'&&paNet()){ if(XA2.refBusy) return; XA2.refBusy=true; render();   /* online: quem troca a lista é o servidor */
    const fin=r=>{ XA2.refBusy=false; if(!r||!r.ok) paToast(paNetMsg(r&&r.reason,'Não deu para trocar agora')); else { XA2.sel=0; paSnd('ui_tap'); } try{ if(XA2.view==='lobby'&&!XA2.pv) render(); }catch(e){} };
    let p=null; try{ p=paNet().refresh(S,h); }catch(e){ p=null; } Promise.resolve(p||{ok:false,reason:'offline'}).then(fin,()=>fin({ok:false,reason:'offline'})); return; }
  if(a==='refresh'){ const r=Sys.arena.refresh(S,h); if(!r.ok){ paToast('Sem trocas grátis hoje'); return; } XA2.sel=0; paSnd('ui_tap'); render(); return; }
  if(a==='pvspd'){ const v=parseInt(b.dataset.v,10); if(XA2.pv&&(v===1||v===2||v===4)&&v!==XA2.pv.speed){ XA2.pv.speed=XA2.pvSpeed=v; paSnd('ui_tap'); render(); } return; }
  if(a==='fight'||a==='again'){ const ops=paOpps(), prev=XA2.pv&&XA2.pv.opp, opp=(a==='again'&&prev&&ops.find(o=>o.id===prev.id))||ops[a==='again'&&!XA2.pv?0:XA2.sel]; if(!opp) return; const myFc=paMyFc(), W=Sys.tower;
    let maxA=1, maxB=1; try{ const me=W.playerStats(S,h), foe=W.scaledFoe(me,opp.fc); maxA=Math.max(1,me.hp); maxB=Math.max(1,foe.hp); }catch(e){}
    if(paNet()){ paNetFight(opp,myFc,maxA,maxB); return; }   /* Arena online: a luta é decidida no servidor (Promise) */
    const r=Sys.arena.fight(S,h,opp.id); if(!r.ok){ paToast(r.reason==='tries'?'Sem lutas hoje: recarrega à meia-noite':'Luta indisponível agora'); return; }
    if(r.win&&typeof duoTrack==='function') duoTrack('arenaWins',1);   /* Dupla das Eras: vitória na Arena */
    try{ if(typeof save==='function') save(); }catch(e){}
    XA2.fight={opp,r,myFc,maxA,maxB}; XA2.step=0; XA2.view='fight'; paSnd('ui_tap');
    if(window.PA_PVP2===true){ paStop(); paPvStart(opp,r,myFc,maxA,maxB); render(); return; }
    XA2.pv=null; render(); paPlay(); return; }
  if(a==='skip'){ if(XA2.pv){ paPvSkip(); return; } paStop(); XA2.view='result'; render(); return; }
  if(a==='speed'){ XA2.speed=XA2.speed===1?2:1; render(); return; }
  if(a==='back'){ paStop(); paPvFree(); XA2.view='lobby'; XA2.fight=null; render(); paPvReplay(); return; }
}
/* ================= ARENA ONLINE (Sys.arenaNet, js/sys/arenanet.js do Servidor; contrato docs/API_SERVIDOR.md §4.1) =================
   NADA muda com ela desligada: tudo aqui só age quando Sys.arenaNet.state().started é verdadeiro (quem liga é o js/onlineboot.js, depois do boot online; esta
   tela nunca chama start). Ligada:
   - LUTA: Sys.arenaNet.fight(S, host, oppId) → Promise com o mesmo que o Sys.arena.fight devolve (win, delta, points, log com k/en, rewards) + oppServer
     {id, name, fc, level, look}. Enquanto não volta: véu "Procurando adversário" por cima da lista (nada tocável por baixo, toque duplo ignorado). Erro
     {ok:false, reason} = aviso em português e a lista de volta; a tela nunca chama o Sys.arena.fight local nesse caminho (não gasta tentativa local).
     Segurança: 20 s sem resposta = aviso e lista de volta; se a resposta chegar depois (ou com a tela fechada), sai só um aviso com o resultado.
   - LISTA: Trocar chama Sys.arenaNet.refresh; a lista e o ranking continuam lidos do Sys.arena (o provider online responde pelo cache dele).
   - RANKING: ao abrir a aba, Sys.arenaNet.loadRanking('arena') e redesenha quando chega (o de FC, 'fc', é da tela de Ranking, js/p_rank.js).
   - FOTO: Sys.arenaNet.snapshot(S, host) ao abrir a Arena e a cada evento 'herochange' do window (ele mesmo limita a frequência). */
const paNet=()=>{ try{ const N=window.Sys&&Sys.arenaNet; return N&&typeof N.state==='function'&&N.state().started===true?N:null; }catch(e){ return null; } };
/* QA (429 no /auth/guest): a Arena online está LIGADA mas não iniciou (sem sessão, servidor recusou): o lobby local avisa que é treino, para não parecer online */
const paNetDown=()=>{ try{ const N=window.Sys&&Sys.arenaNet; return !!(N&&N.DATA&&N.DATA.on===true&&!(typeof N.state==='function'&&N.state().started===true)); }catch(e){ return false; } };
/* LOBBY ONLINE (correção da 1ª luta real): com a Arena online iniciada, a FC do adversário é a do servidor SEM a escala de exibição (paFCx) e a FC "sua"
   é a do RETRATO (POST /arena/snapshot): o Sys.arenaNet.snapshot manda Sys.tower.playerStats(S,host).fc, a mesma leitura daqui; se um dia o módulo expuser
   o número enviado (state().snapFc), vale o dele. Dificuldade = Sys.tower.difficulty(retrato, FC do servidor). Pontos = a conta do módulo (a mesma que o
   servidor carrega: base × clamp(FC dele / FC do retrato, kRange)) com as constantes de Sys.arena.DATA; contra robô o contrato (§4) diz que não há ponto.
   Sem a FC do retrato não há número: sai "Vitória: sobe / Derrota: desce". O Sys.arena.opponents compara com a FC LOCAL (Sys.fc.compute), por isso aqui
   esses três campos são refeitos. Sem a Arena online, paOpps devolve o Sys.arena.opponents intacto. */
function paSrvFc(){ const N=paNet(); if(!N) return 0; try{ const v=+N.state().snapFc; if(v>0&&isFinite(v)) return v; }catch(e){}
  try{ const v=+Sys.tower.playerStats(S,paH()).fc; return v>0&&isFinite(v)?v:0; }catch(e){ return 0; } }
function paOpps(){ const ops=Sys.arena.opponents(S,paH()); if(!paNet()) return ops; const me=paSrvFc(), D=Sys.arena.DATA, W=Sys.tower, kr=D.kRange||[0.5,2];
  return ops.map(p=>{ const q=Object.assign({},p,{net:true,winPts:null,losePts:null,diff:null,noPts:p.bot===true}), fc=+p.fc;
    if(me>0&&fc>0&&isFinite(fc)&&typeof Sys.arena.deltaFor==='function'){ try{ const d=Sys.arena.deltaFor(S,me,fc); q.diff=d.diff; if(!q.noPts&&d.winPts>0&&d.losePts>0){ q.winPts=d.winPts; q.losePts=d.losePts; } }catch(e){ q.diff=null; } return q; }   /* fonte única (Sistemas fbd1672): a conta de pontos e a dificuldade são as do módulo; o bloco abaixo é só reserva para módulo antigo */
    if(me>0&&fc>0&&isFinite(fc)){ try{ q.diff=W&&W.difficulty?W.difficulty(me,fc):null; }catch(e){ q.diff=null; }
      if(!q.noPts&&D.winBase>0&&D.lossBase>0){ const k=Math.max(kr[0],Math.min(kr[1],fc/Math.max(1,me))); q.winPts=Math.round(D.winBase*k); q.losePts=Math.round(D.lossBase*k); } }
    return q; }); }
const paFCx=(v,net)=>net?paN(v):paFC(v);   /* online: o número do servidor como veio (inteiro, sem a escala de exibição); local: como sempre */
function paNetMsg(reason,dflt){ const r=String(reason||''); if(r==='tries'||r==='arena_limit') return 'Sem lutas hoje: recarrega à meia-noite'; if(r==='busy') return 'Luta em andamento: aguarde';
  if(r==='opp'||r==='not_found') return 'Esse adversário saiu da lista: troque os adversários'; if(r==='refresh') return 'Sem trocas grátis hoje'; if(r==='no_snapshot'||r==='snapshot_mismatch') return 'Seu herói ainda não foi enviado ao servidor: tente de novo em instantes';
  if(/offline|net|network|timeout|fetch|unreachable/i.test(r)) return 'Sem conexão: tente de novo'; return dflt||'Luta indisponível agora'; }
function paNetSnap(){ const N=paNet(); if(!N||typeof N.snapshot!=='function') return false; try{ const p=N.snapshot(S,paH()); if(p&&typeof p.catch==='function') p.catch(()=>{}); }catch(e){} return true; }
function paNetRank(){ const N=paNet(); if(!N||typeof N.loadRanking!=='function') return false; const again=()=>{ try{ if(XA2.view==='lobby'&&XA2.tab===2&&!XA2.wait&&typeof view!=='undefined'&&view==='arena') render(); }catch(e){} };
  try{ const p=N.loadRanking('arena'); if(p&&typeof p.then==='function') p.then(again,()=>{}); }catch(e){} return true; }
let paNetSeq=0;
function paNetStopWait(){ if(XA2.waitT){ try{ clearTimeout(XA2.waitT); }catch(e){} XA2.waitT=0; } XA2.wait=null; }
function paNetFight(opp,myFc,maxA,maxB){ const N=paNet(); if(!N||XA2.wait) return false; const tok=++paNetSeq; paStop(); paPvFree(); XA2.view='lobby'; XA2.wait={tok,name:opp.name}; render();
  const done=r=>{ if(r&&r.ok&&r.win&&typeof duoTrack==='function') duoTrack('arenaWins',1);   /* Dupla das Eras: vitória na Arena online (conta também a resposta que chegou com a tela fechada) */
    if(!XA2.wait||XA2.wait.tok!==tok){ if(r&&r.ok) paToast('Luta contra '+opp.name+': '+(r.win?'vitória':'derrota')+' ('+(r.delta>=0?'+':'−')+Math.abs(r.delta|0)+' pontos)'); return; }   /* resposta atrasada ou tela já fechada: só o aviso */
    paNetStopWait(); if(!r||!r.ok){ paToast(paNetMsg(r&&r.reason)); XA2.view='lobby'; try{ render(); }catch(e){} return; }
    try{ if(typeof save==='function') save(); }catch(e){}
    const sv=r.oppServer&&typeof r.oppServer==='object'?r.oppServer:null, o2=Object.assign({},opp); if(sv){ for(const k of ['name','fc','level','look']) if(sv[k]!=null) o2[k]=sv[k]; }   /* o adversário como o servidor lutou (aparência e nível da foto dele) */
    const sFc=paSrvFc(); if(sFc>0) myFc=sFc;   /* placar da luta online: a FC do retrato (a que o servidor usou), na escala do servidor como a do adversário */
    XA2.fight={opp:o2,r,myFc,maxA,maxB,net:true}; XA2.step=0; XA2.view='fight'; paSnd('ui_tap');
    if(window.PA_PVP2===true){ paStop(); paPvStart(o2,r,myFc,maxA,maxB); if(XA2.pv) XA2.pv.net=true; render(); } else { XA2.pv=null; render(); paPlay(); } };
  let p=null; try{ p=N.fight(S,paH(),opp.id); }catch(e){ p=null; }
  Promise.resolve(p||{ok:false,reason:'offline'}).then(done,()=>done({ok:false,reason:'offline'}));
  try{ XA2.waitT=setTimeout(()=>{ XA2.waitT=0; if(XA2.wait&&XA2.wait.tok===tok){ XA2.wait=null; paToast('O servidor demorou para responder: tente de novo'); XA2.view='lobby'; try{ render(); }catch(e){} } },20000); }catch(e){}
  return true; }
const paWaitHTML=()=>XA2.wait?`<div role="status" aria-live="polite" aria-label="Procurando adversário" style="position:absolute;left:0;right:0;top:0;bottom:0;z-index:40;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:24px;text-align:center;background:rgba(14,10,7,.9)"><span class="pa-spin" aria-hidden="true"></span><span style="font-family:'Lilita One',sans-serif;font-size:22px;color:#ffe07a">Procurando adversário</span><span style="font-size:13px;font-weight:800;color:#c9b9a2;overflow-wrap:anywhere">${paEsc(XA2.wait.name)} · o servidor está decidindo a luta</span></div>`:'';
try{ if(typeof window!=='undefined'&&typeof window.addEventListener==='function') window.addEventListener('herochange',()=>{ paNetSnap(); }); }catch(e){}

/* ================= LUTA PvP (Tela 23 · protótipo APROVADO docs/proto/ArenaPvP.html) =================
   Chave: window.PA_PVP2, LIGADA por padrão (?debug=1&pvp2=0 desliga para comparar). Desligada = a luta antiga acima.
   A LUTA SEGUE O REGISTRO: paPvScript transforma o duel.log do Sys.arena.fight ({s, dmg, crit, hp} por golpe, na ordem) num roteiro com hora marcada;
   paPvStep anda o relógio (x1/x2/x4) e aplica cada golpe na ordem; Pular aplica o resto de uma vez (mesma vida final, mesmo vencedor: r.win do módulo).
   Nada é sorteado aqui e nenhum número é criado: dano, crítico e vida são os do registro.
   FORMATO DO REGISTRO (Sys.arena.duelPvp, commit 53409f3): r.log = r.duel.log, cada entrada {s, k, dmg, crit, hp, en}: s 0 = jogador, 1 = adversário;
   k 'hit' (golpe do herói) | 'pet' (golpe do pet, com número próprio) | 'ult' (ultimate); hp = vida de quem LEVOU; en = energia de quem BATEU depois do
   golpe. A tela não cria nada: ultimate só quando k==='ult', pet só quando k==='pet', barra de energia = en do registro (quem leva ganha DATA.pvp.enHurt,
   como no módulo). Registro sem k (provider antigo): tudo é golpe do herói e a energia fica como vier.
   - aparência do adversário: opp.look {hero, mount:{id,stars}|null, pet:{base,stage,fly}|null, wing|null, aura|null} é usado INTEIRO (sem mount = a pé).
     Só quando look não vem (provider antigo) o robô espelha o jogador: tem montaria / pet / asa / aura só se o jogador tiver (conta fixa pelo id, só visual).
     look.weapon pode ser o id de skin ('w23') ou o objeto da foto {e, r, type}; look.skin = skin fixa (só a pé); look.aura = id ('aura7') ou caminho.
     A foto do jogador local no mesmo formato sai de window.heroSnapshot() (paPvSnapshot, abaixo).
   - prêmio da luta: caixas só para o que vier em r.rewards {gold, gems, chest} (> 0), já creditado pelo módulo; a linha do prêmio da liga continua.
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
.pv-pn{font-weight:900;font-size:13px;line-height:1.15;white-space:nowrap}
.pv-pn.w2{white-space:normal;overflow-wrap:anywhere;height:2.3em;display:flex;align-items:center}
.pv-pl.r .pv-pn.w2{justify-content:flex-end}
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
.pv-league{position:absolute;left:50%;top:84px;transform:translateX(-50%);z-index:5;font-size:10px;font-weight:900;padding:3px 10px;border-radius:10px;background:rgba(5,8,28,.7);border:1px solid rgba(130,150,255,.28);color:#9aa6d6;white-space:nowrap;max-width:calc(100% - 20px);overflow:hidden}
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
.pv-vsrow{display:grid;grid-template-columns:minmax(0,130px) auto minmax(0,130px);grid-template-rows:auto auto;column-gap:10px;row-gap:6px;width:100%;justify-content:center;align-items:center}
.pv-vsc{min-width:0;text-align:center;animation:pvsl .5s cubic-bezier(.2,1.3,.4,1) both}
.pv-vsc.r{animation-name:pvsr}
.pv-vsc.n{align-self:start}
.pv-bigav{width:100%;max-width:110px;aspect-ratio:1;margin:0 auto;border-radius:24px;overflow:hidden;border:3px solid var(--c);box-shadow:0 0 24px var(--c);position:relative;background:#0c1238}
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
.pv-lg{margin:4px 0 10px;text-align:left}
.pv-card p.pv-note{margin:0 0 12px;font-size:11px;color:#ffd27a}
.pv-lg .row{display:flex;justify-content:space-between;gap:8px;font-size:12px;font-weight:900}
.pv-lg .row span:last-child{color:#ffd25e;text-align:right}
.pv-lgb{height:10px;border-radius:5px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:5px;position:relative}
.pv-lgb i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#9fb6ff,#e9efff);animation:pvbar 1.2s ease-out both;transform-origin:0 50%}
.pv-acts{display:flex;gap:8px}
.pv-acts button{flex:1;min-width:0;min-height:50px;border-radius:14px;font-weight:900;font-size:15px;padding:0 6px}
.pv-acts .g{background:linear-gradient(180deg,#ffe58a,#f4a52a);color:#1c1206;border:0;box-shadow:0 3px 0 #9a5a10}
.pv-acts .g.off{opacity:.5;box-shadow:none}
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
function paPvMyLook(){ const L={hero:'kael',skin:null,mount:null,wing:null,weapon:null,wItem:null,armor:null,aura:null,pet:null,ult:{sheet:null,name:'Ultimate'},me:true};
  try{ const fx=Sys.appearance.fixedEquipped(S); L.skin=fx&&typeof fx.id==='string'?fx.id:null; }catch(e){}   /* skin fixa equipada (corpo próprio a pé; montado vale o corpo padrão) */
  try{ const it=S.eq&&S.eq.weapon!=null?itemOf(S.eq.weapon):null; if(it) L.wItem={e:Number.isInteger(it.look)?it.look:(it.e|0),r:it.r|0,type:Sys.stats.weaponType(it)||null}; }catch(e){}   /* a arma na mão é o ITEM equipado */
  try{ L.hero=S.hero==='kaia'?'kaia':'kael'; }catch(e){}
  try{ const lk=heroLook(); L.mount=lk.mount||null; L.wing=(typeof wingNow==='function'?wingNow(lk):lk.wing)||null; L.weapon=(typeof wFamLook==='function'?wFamLook(lk.weapon):lk.weapon)||lk.weapon; L.armor=lk.armor; }catch(e){}
  try{ L.aura=typeof auraPick==='function'?(auraPick({main:true})||null):null; }catch(e){}
  try{ const i=Sys.pet.battleInfo(S,Sys.host); if(i&&i.draw&&i.draw.base) L.pet={base:i.draw.base,stage:i.stage|0,fly:!!i.draw.fly}; }catch(e){}
  try{ const ws=typeof wSkin==='function'?wSkin():L.weapon; L.ult=paPvUlt(typeof wArm==='function'?wArm():ws,ws?ws.e:0); }catch(e){}
  return L; }
/* aparência do ADVERSÁRIO (PO: cada um aparece como é): opp.look INTEIRO quando o provider mandar (sem mount = a pé; sem pet/asa/aura = sem).
   Enquanto não vier, o robô nunca aparece mais equipado que o jogador (my): só tem montaria / pet / asa / aura se o jogador tiver; qual delas sai de uma
   conta fixa pelo id (só visual). A arma e a roupa são a skin que o módulo dá. */
/* arma do adversário: id de skin em texto ('w23') ou o objeto da foto {e, r, type} (era visual, raridade, família), resolvido como o jogo resolve o item
   equipado (wFamLook do js/battle.js): família com arte de era → a skin dessa era; arco / bumerangue ligados → a arma da família; senão a da era */
function paPvWeapon(w){ if(typeof w==='string') return paPvSkin(w); if(!w||typeof w!=='object') return null; const r=Math.max(0,Math.min(4,w.r|0)), e=Math.max(0,Math.min(20,w.e|0));
  let base=paPvSkin('w'+e+r); for(let x=Math.min(e,8);!base&&x>=0;x--) base=paPvSkin('w'+x+r);
  try{ const W=typeof w.type==='string'?Sys.stats.DATA.weaponTypes[w.type]:null; if(W){ if(W.artEra!=null) return paPvSkin('w'+W.artEra+r)||base;
      if(W.on===true&&(W.style==='ranged'||W.style==='return')&&typeof WARM!=='undefined'&&typeof W_FKEY!=='undefined'){ const key=w.type+'_'+W_FKEY[r]; return WARM[key]||(WARM[key]={id:'wf_'+key,slot:'weapon',e:Math.max(0,Math.min(6,W.fromEra|0)),r,wk:key,wt:w.type,style:W.style,fam:W,n:W.name}); } } }catch(er){}
  return base; }
function paPvOppLook(opp,my){ my=my||paPvMyLook(); const k=opp&&opp.look&&typeof opp.look==='object'?opp.look:null, h=paPvHash(opp&&opp.id), sk=(opp&&opp.skin)||{};
  const L={hero:k&&k.hero==='kaia'?'kaia':'kael',skin:null,mount:null,wing:null,weapon:paPvWeapon(k&&k.weapon)||paPvSkin(sk.weapon)||paPvSkin('w00'),wItem:k&&k.weapon&&typeof k.weapon==='object'?k.weapon:null,armor:paPvSkin((k&&k.armor)||sk.armor)||paPvSkin('a00'),aura:null,pet:null,ult:{sheet:null,name:'Ultimate'},me:false};
  if(k&&typeof k.skin==='string'){ try{ const fx=Sys.appearance.FIXED.find(x=>x.id===k.skin); if(fx&&fx.off!==true&&(!fx.hero||fx.hero===L.hero)) L.skin=fx.id; }catch(e){} }   /* skin fixa do adversário: só a que existe, está ligada e é do herói dele */
  const tbl=typeof MOUNT_TBL!=='undefined'?MOUNT_TBL:{};
  if(k){ if(k.mount&&tbl[k.mount.id]) L.mount={id:k.mount.id,stars:Math.max(0,Math.min(5,k.mount.stars|0))}; if(typeof k.wing==='string') L.wing=k.wing; if(typeof k.aura==='string') L.aura=k.aura.indexOf('/')>=0?k.aura:'assets/anim/aura/'+k.aura;
    if(k.pet&&(k.pet.base||k.pet.sprite)){ const st=Math.max(1,Math.min(3,k.pet.stage|0||1)); L.pet={base:k.pet.base||(k.pet.sprite+['','_mid','_evo'][st-1]),stage:st,fly:!!k.pet.fly}; } }
  else { let ids=[]; try{ ids=typeof mountIds==='function'?mountIds().map(m=>m.id):[]; }catch(e){ ids=[]; } if(!ids.length) ids=Object.keys(tbl).filter(id=>id!=='mythic');
    if(ids.length&&my.mount) L.mount={id:ids[h%ids.length],stars:1+((h>>>4)%5)};
    const pets=['era0_mammoth','era1_sphinx','era2_dragon','era3_parrot','era4_mechdog'], sp=pets[(h>>>8)%pets.length], st=1+((h>>>12)%3); if(my.pet) L.pet={base:sp+['','_mid','_evo'][st-1],stage:st,fly:sp==='era3_parrot'};
    if(my.wing) L.wing=((h>>>16)&1)?'demon':'angel';
    const au=[4,7,10,13][(h>>>18)%4]; try{ if(my.aura&&typeof ART_ON!=='undefined'&&ART_ON['aura'+au]===true) L.aura='assets/anim/aura/aura'+au; }catch(e){} }
  if(L.hero==='kaia'&&L.mount){ let ok=false; try{ ok=typeof mountArtOf==='function'&&mountArtOf('kaia',L.mount.id)===true; }catch(e){} if(!ok) L.hero='kael'; }   /* Kaia só monta onde há arte; senão o corpo padrão do Kael */
  try{ const ws=L.weapon||{e:0,r:0}, wi=L.wItem; L.ult=paPvUlt(wi?{slot:'weapon',r:Math.max(0,Math.min(4,wi.r|0)),e:ws.e|0,wt:typeof wi.type==='string'?wi.type:undefined}:{slot:'weapon',r:ws.r|0,e:ws.e|0},ws.e|0); }catch(e){}
  return L; }
/* FOTO DA APARÊNCIA para o servidor (formato fechado com a sessão Servidor; chamada pelo js/sys/arenanet.js ao mudar o equipamento).
   window.heroSnapshot() → {look, level, petFrac}
     look = {hero:'kael'|'kaia', skin: id da skin fixa | null, armor:'aXY' | null (roupa, só a pé), mount:{id, stars 0-5} | null, pet:{base, stage 1-3, fly} | null,
             wing: id | null, aura:'auraN' | null (só o id, nunca caminho), weapon:{e 0-20, r 0-4, type} | null}
     level = nível do jogador (Sys.level) · petFrac = parte do ATQ que vem do pet (pet.atk ÷ (1 + pet.atk), a mesma conta do Sys.arena)
   MESMA leitura da tela (paPvMyLook): a foto e o desenho nunca divergem. O look devolvido aqui é exatamente o que a tela aceita em opp.look.
   Só lê: não muda o save, não lança erro, funciona com save novo (tudo null). Textos só com [a-z0-9_]; o que não passar vira null. */
function paPvSnapshot(){ const out={look:{hero:'kael',skin:null,armor:null,mount:null,pet:null,wing:null,aura:null,weapon:null},level:1,petFrac:0}, id=v=>(typeof v==='string'&&/^[a-z0-9_]{1,40}$/.test(v))?v:null;
  try{ const L=paPvMyLook(), k=out.look; k.hero=L.hero==='kaia'?'kaia':'kael'; k.skin=id(L.skin); k.armor=id(L.armor&&L.armor.id); k.wing=id(L.wing);
    if(L.mount&&id(L.mount.id)) k.mount={id:L.mount.id,stars:Math.max(0,Math.min(5,L.mount.stars|0))};
    if(L.pet&&id(L.pet.base)) k.pet={base:L.pet.base,stage:Math.max(1,Math.min(3,L.pet.stage|0||1)),fly:!!L.pet.fly};
    if(typeof L.aura==='string'){ const m=/([a-z0-9_]+)$/.exec(L.aura); k.aura=m?id(m[1]):null; }
    if(L.wItem) k.weapon={e:Math.max(0,Math.min(20,L.wItem.e|0)),r:Math.max(0,Math.min(4,L.wItem.r|0)),type:id(L.wItem.type)}; }catch(e){}
  try{ const fm=typeof frameMine==='function'?frameMine():null; if(fm&&id(fm)) out.look.frame=fm; }catch(e){}   /* moldura do Perfil (só visual; o servidor precisa aceitar look.frame) */
  try{ const lv=Sys.level&&Sys.level.level?Sys.level.level(S):1; out.level=Math.max(1,Math.floor(+lv||1)); }catch(e){}
  try{ const p=(Sys.fc.stats(S,Sys.host)||{}).pet||{}, a=Math.max(0,+p.atk||0); out.petFrac=isFinite(a)?a/(1+a):0; }catch(e){}
  return out; }
try{ window.heroSnapshot=paPvSnapshot; }catch(e){}
/* medidas da cena para uma tela de W x H px (base do protótipo: 390). f = escala pela largura; hs = encolhe os heróis se faltar altura.
   gy = linha dos pés dos heróis; gyP = linha dos pés dos pets de quem está montado (plano da frente, mais baixo; a pé o pet fica 14 px abaixo dos pés do dono);
   K = lado do quadro do herói; x = âncora do herói montado, xf = centro do herói a pé (do lado dele) */
function paPvGeo(W,H){ W=Math.max(240,+W||390); H=Math.max(360,+H||640); const f=Math.max(0.6,Math.min(1.3,W/390)), feedTop=H-176, gyP=feedTop-8;
  const hs=Math.max(0.5,Math.min(1,(gyP-46*f-104)/(205*f))), gy=gyP-46*f*hs;
  return {W,H,f,hs,gy,gyP,feedTop,K:125*f*hs,x:80*f,xf:96*f,ax:110*f,hitX:120*f,hitY:gy-120*f*hs,ubTop:Math.max(108,gy-150*f*hs)}; }
/* pet do lado i, em coordenadas do LADO DELE (0 = borda de trás do dono): {x centro, k escala, l/r meias larguras, gy, fly}. Preso à metade do dono. */
function paPvPet(P,G,atk,mounted){ let m=null; try{ m=typeof petMetric==='function'?petMetric(P.base):null; }catch(e){ m=null; } if(!m) m={h:150,l:70,r:70};
  let bh=G.K*0.62; try{ if(typeof heroBodyH==='function'&&typeof HS!=='undefined'&&HS>0) bh=heroBodyH()*G.K/HS; }catch(e){}
  const fr=[0.46,0.52,0.62][Math.max(0,Math.min(2,(P.stage|0)-1))], k=bh*fr/Math.max(20,m.h), l=m.l*k, r=m.r*k;
  let x=mounted?(atk?114:82)*G.f:G.xf+0.45*G.K+(atk?18*G.f:0); x=Math.max(x,2+l); x=Math.min(x,G.W/2-4-r);   /* nunca passa do meio da tela: os dois pets não se encostam */
  return {x,k,l,r,gy:mounted?G.gyP:G.gy+14*G.f*G.hs,fly:P.fly?bh*0.12:0}; }
/* caixa do pet na TELA (lado 1 espelhado) */
function paPvPetBox(i,pv,G,atk){ const P=pv.F[i].look.pet; if(!P) return null; const q=paPvPet(P,G,atk,!!pv.F[i].look.mount); return i===0?{l:q.x-q.l,r:q.x+q.r,gy:q.gy}:{l:G.W-(q.x+q.r),r:G.W-(q.x-q.l),gy:q.gy}; }
/* ROTEIRO: o registro na ordem, com hora. lag[s] = segundos do início do golpe ao acerto (montado 0,64; a pé 0,19). Nada é criado: k e en vêm do registro.
   Energia em % (en ÷ DATA.pvp.enFull): a de quem bateu é a do registro; a de quem levou soma enHurt (golpe do herói ou ultimate; golpe de pet não dá) */
function paPvScript(log,lag){ const n=log.length, gap=Math.max(0.7,Math.min(1.35,32/Math.max(1,n))), en=[0,0], out=[]; let T=0.4, full=100, hurt=10;
  try{ const D=Sys.arena.DATA.pvp; if(D){ if(D.enFull>0) full=D.enFull; if(D.enHurt>=0) hurt=D.enHurt; } }catch(e){}
  const pct=v=>Math.max(0,Math.min(100,v/full*100));
  for(let i=0;i<n;i++){ const e=log[i], s=e.s?1:0, pet=e.k==='pet', ult=e.k==='ult', has=typeof e.en==='number'&&isFinite(e.en);
    if(ult){ out.push({t:T,k:'ult',s,i}); if(has) en[s]=e.en; else en[s]=0; en[1-s]=Math.min(full,en[1-s]+(has?hurt:0));
      out.push({t:T+PV_ULT_HIT,k:'hit',s,i,dmg:+e.dmg||0,crit:!!e.crit,ult:true,pet:false,hp:+e.hp||0,en:[pct(en[0]),pct(en[1])]}); T+=PV_ULT_DUR+0.4; }
    else { out.push({t:T,k:'atk',s,i,pet,solo:pet}); if(has){ en[s]=e.en; if(!pet) en[1-s]=Math.min(full,en[1-s]+hurt); }
      out.push({t:T+Math.min(pet?0.5:lag[s],gap-0.05),k:'hit',s,i,dmg:+e.dmg||0,crit:!!e.crit,ult:false,pet,hp:+e.hp||0,en:[pct(en[0]),pct(en[1])]}); T+=pet?Math.min(gap,0.65):gap; } }
  return out; }
/* BATALHA POR TRÁS (dono: "quando acaba a partida da arena, a batalha ainda continua"): a batalha normal é idle e segue rodando atrás de toda tela cheia
   (regra do jogo; pausar o farm é decisão do PO). Enquanto a luta PvP ou o resultado dela está aberto, NADA dela chega ao jogador: os sons (snd) e os
   avisos (toast) da batalha são engolidos; só passam os da própria Arena (paSnd / paToast). O filtro é instalado uma vez, na 1ª luta, e fora da luta
   deixa tudo passar igual a antes. O HUD da batalha já fica escondido pelo jogo (body.fb.full #fbhud{visibility:hidden}) e o painel cobre a cena.
   TROCA DE TELA: um evento da batalha (Troca de era depois de um Senhor da Era vencido no automático: Panels.open('era'); ovo de escolha: Screens.open('eggpick'))
   abria outra tela POR CIMA da luta. Com a luta aberta, toda abertura de tela que não vem da própria Arena é GUARDADA (paPvHeld) e reaberta, na ordem,
   quando o jogador sai da luta (Voltar à arena ou fechar a tela): nada se perde, só espera. O Voltar do cabeçalho (Screens.close) continua livre.
   DECISÃO DO DONO: a batalha das fases NÃO pausa: segue rendendo (ouro, XP, fases) escondida atrás da Arena, como atrás de toda tela cheia. */
let paPvQ=false; const paPvHeld=[];
function paPvReplay(){ if(XA2.pv||!paPvHeld.length) return; const L=paPvHeld.splice(0); for(const h of L){ try{ if(h[0]==='P'&&window.Panels) Panels.open(h[1],h[2]); else if(window.Screens) Screens.open(h[1],h[2]); }catch(e){} } }
function paPvQuiet(){ if(paPvQ) return; paPvQ=true;
  try{ if(window.Screens&&typeof Screens.open==='function'){ const o0=Screens.open; Screens.open=function(name,o){ if(XA2.pv&&!paOwn&&name!=='arena'){ if(paPvHeld.length<8) paPvHeld.push(['S',name,o]); return false; } return o0.apply(this,arguments); }; } }catch(e){}
  try{ if(window.Panels&&typeof Panels.open==='function'){ const p0=Panels.open; Panels.open=function(name,o){ if(XA2.pv&&!paOwn&&name!=='arena'){ if(paPvHeld.length<8) paPvHeld.push(['P',name,o]); return false; } return p0.apply(this,arguments); }; } }catch(e){}
  try{ if(typeof snd==='function'){ const s0=snd; snd=function(){ if(XA2.pv&&!paOwn) return; return s0.apply(this,arguments); }; } }catch(e){}
  try{ if(typeof toast==='function'){ const t0=toast; toast=function(){ if(XA2.pv&&!paOwn) return; return t0.apply(this,arguments); }; } }catch(e){}
  /* popup verde/vermelho de FC (fcNotice do index.html: #fcnote, position:fixed, z-index 80, acima do painel): com a luta aberta não aparece */
  try{ if(typeof fcNotice==='function'){ const f0=fcNotice; fcNotice=function(){ if(XA2.pv) return; return f0.apply(this,arguments); }; } }catch(e){} }
/* ao abrir a luta: some o que já estava na tela (popup de FC, aviso). ao sair: a FC de referência do popup vira a de agora (a diferença acumulada durante a luta
   é descartada, não aparece atrasada) */
function paPvHush(on){ try{ if(on){ const e=document.getElementById('fcnote'); if(e&&e.style) e.style.display='none'; const t=document.getElementById('toast'); if(t&&t.classList) t.classList.remove('on'); }
    if(typeof FCN!=='undefined'&&FCN){ if(on){ FCN.until=0; FCN.base=null; } if(window.Sys&&Sys.fc&&typeof Sys.fc.snapshot==='function'&&Sys.host) FCN.snap=Sys.fc.snapshot(S,Sys.host); } }catch(e){} }
let paPvSeq=0;   /* cada luta tem um id: qualquer coisa atrasada de uma luta anterior (quadro agendado, resposta de rede) confere o id e é ignorada */
function paPvStart(opp,r,myFc,maxA,maxB){ paPvFree(); paPvQuiet(); paPvHush(true); const d=r.duel||{}, log=(Array.isArray(d.log)?d.log:Array.isArray(r.log)?r.log:[]).filter(e=>e&&typeof e==='object'&&(e.s===0||e.s===1));
  const L0=paPvMyLook(), L=[L0,paPvOppLook(opp,L0)], mk=l=>{ const m=!!l.mount; return {look:l,at:-9,dur:m?17/14:0.4,lag:m?0.64:0.19,act:null,shake:0,alpha:1,petT:-9,petDur:1}; }, F=[mk(L[0]),mk(L[1])];
  { let la=0, lb=0; for(const e of log){ if(e.s===0) lb=+e.hp||0; else la=+e.hp||0; }   /* vida cheia = sobra ÷ fração do duelo, quando dá para tirar do registro; senão a calculada antes da luta (a mesma conta do módulo) */
    if(la>0&&d.hpA>0&&d.hpA<=1) maxA=la/d.hpA; if(lb>0&&d.hpB>0&&d.hpB<=1) maxB=lb/d.hpB; }
  XA2.pv={id:++paPvSeq,opp,r,myFc,log,max:[Math.max(1,maxA),Math.max(1,maxB)],hp:[Math.max(1,maxA),Math.max(1,maxB)],en:[0,0],dmg:[0,0],crits:0,used:[],F,script:paPvScript(log,[F[0].lag,F[1].lag]),i:0,
    clock:0,vsT:0,endT:0,phase:'vs',speed:XA2.pvSpeed||1,ULT:null,ub:null,FX:[],feed:[],loser:-1,rdy:false,last:0,off:null,geo:paPvGeo(390,640)}; }
function paPvFree(){ const pv=XA2.pv; if(pv&&pv.off){ try{ pv.off.width=pv.off.height=1; }catch(e){} pv.off=null; } XA2.pv=null; paPvLoopOff(); if(pv) paPvHush(false); }
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
  if(ev.k==='ult'){ pv.en[s]=0; if(!quiet){ pv.ULT={t:ev.t,side:s,i:ev.i,sheet:A.look.ult.sheet,dur:PV_ULT_DUR}; A.at=ev.t+PV_ULT_HIT-A.lag; if(A.look.pet){ A.petT=ev.t+PV_ULT_HIT-0.5; A.petDur=1; }
      paPvUb(pv,{s,name:A.look.ult.name}); paPvFeed(pv,who+' usou '+A.look.ult.name,'u'); paSnd('ult'); paPvHud(); } return; }
  /* acerto: os números do registro */
  pv.hp[1-s]=Math.max(0,ev.hp); pv.dmg[s]+=ev.dmg; if(ev.crit&&s===0) pv.crits++; pv.en[0]=ev.en[0]; pv.en[1]=ev.en[1]; pv.used.push(ev.i);
  if(quiet) return;
  D.shake=ev.crit||ev.ult?1.4:0.8; const dm=!!D.look.mount, lx=dm?G.hitX:G.xf+10*G.f, hy=dm?G.hitY:G.gy-G.K*0.78, hx=1-s===0?lx:G.W-lx, dir=1-s===0?1:-1;   /* número sobre quem levou o golpe (montado é mais alto) */
  pv.FX.push({kind:'n',x:hx+(ev.pet?24*G.f:0)*dir,y:hy+(ev.pet?(dm?70:40)*G.f*G.hs:0),txt:paF(ev.dmg),crit:ev.crit||ev.ult,t:pv.clock}); pv.FX.push({kind:'s',x:hx,y:hy+30*G.f*G.hs,t:pv.clock,s:(ev.i*1.7)%6.28});
  if(ev.crit&&!ev.pet&&!ev.ult) paPvFeed(pv,(s===0?'Crítico seu: ':'Crítico dele: ')+paF(ev.dmg),'k');
  paSnd(ev.crit||ev.ult?'crit':'hit'); paPvHud(); }
function paPvFire(pv,quiet){ while(pv.i<pv.script.length&&(quiet||pv.script[pv.i].t<=pv.clock)) paPvApply(pv,pv.script[pv.i++],quiet);
  if(pv.i>=pv.script.length&&pv.phase==='run'){ pv.phase='end'; pv.endT=0; const l=pv.r.win?1:0; pv.loser=pv.hp[l]<=0?l:-1; } }
/* TÉRMINO ÚNICO da luta (fim natural e Pular). CAUSA do "a luta continua depois do resultado" (dono): a ultimate AGENDA o golpe do herói e o bote do pet para
   depois (F.at e F.petT ficam no FUTURO: o golpe sai ~0,9 s e o pet ~1,05 s depois do início da faixa). Pular nesse intervalo abria o resultado e esses dois
   ainda tocavam por trás do cartão. Aqui tudo o que estava agendado ou em curso é cancelado e o placar fica no valor final do registro. */
function paPvFinish(pv){ if(pv!==XA2.pv||pv.phase==='result') return;   /* luta antiga ou já encerrada: ignora */
  pv.i=pv.script.length; pv.ULT=null; pv.FX=[]; pv.frozen=false; pv.lagPct=null; for(const F of pv.F){ F.at=-9; F.petT=-9; F.shake=0; }   /* acabou: sem golpe, faixa, número ou tremor por trás do resultado */
  { let h0=pv.max[0], h1=pv.max[1]; for(const e of pv.log){ if(e.s===0) h1=Math.max(0,+e.hp||0); else h0=Math.max(0,+e.hp||0); } pv.hp=[h0,h1]; }   /* vida final = a do registro */
  pv.phase='result'; XA2.view='result'; paPvUb(pv,null); paSnd(pv.r.win?'claim':'ui_tap'); try{ render(); }catch(e){} }
/* passo da luta: dt em segundos de relógio real (a velocidade x1/x2/x4 entra aqui) */
function paPvStep(dt){ const pv=XA2.pv; if(!pv||pv.frozen) return; dt=Math.max(0,+dt||0);   /* frozen: cena congelada pelos ganchos de debug do QA (dbgPvpAt / dbgPvpUlt) */
  if(pv.phase==='vs'){ pv.vsT+=dt; if(pv.vsT>=PV_VS&&(pv.rdy||pv.vsT>=PV_VS+4)){ pv.phase='run'; try{ render(); }catch(e){} } return; }
  if(pv.phase==='result'){ pv.clock+=dt; if(pv.loser>=0){ const F=pv.F[pv.loser]; F.alpha=Math.max(PV_FADE,F.alpha-dt*1.5); } return; }   /* ACABOU: só o parado (respiração) segue; vida, placar, energia e números não mudam mais */
  pv.clock+=dt*pv.speed;
  if(pv.phase==='run') paPvFire(pv,false);
  for(const F of pv.F) if(F.shake>0) F.shake=Math.max(0,F.shake-dt*pv.speed*4.8);
  if(pv.ULT&&pv.clock-pv.ULT.t>=pv.ULT.dur) pv.ULT=null;
  if(pv.ub&&(!pv.ULT||pv.clock-pv.ULT.t>1.5)) paPvUb(pv,null);
  if(pv.FX.length) pv.FX=pv.FX.filter(o=>pv.clock-o.t<=1.1);
  if(pv.phase!=='result'){ const e=paPvEl('pa_tm'); if(e) try{ e.textContent=paPvClock(pv.clock); }catch(er){} }
  if(pv.phase==='end'||pv.phase==='result'){ if(pv.loser>=0){ const F=pv.F[pv.loser]; F.alpha=Math.max(PV_FADE,F.alpha-dt*1.5); } }
  if(pv.phase==='end'){ pv.endT+=dt*Math.min(pv.speed,2); if(pv.endT>=1.1&&!pv.ULT) paPvFinish(pv); } }
/* PULAR: aplica o resto do registro de uma vez e abre o resultado */
function paPvSkip(){ const pv=XA2.pv; if(!pv||pv.phase==='result') return; pv.frozen=false; pv.lagPct=null; if(pv.phase==='vs') pv.phase='run'; paPvFire(pv,true); pv.feed=[]; if(pv.loser>=0) pv.F[pv.loser].alpha=PV_FADE; paPvFinish(pv); }
/* ---------- desenho ---------- */
function paPvAura(g,base,cx,by,w,t){ if(!base||typeof sheetLoad!=='function') return; const s=sheetLoad(base,true); if(!s.ok) return; const M=s.meta, fi=Math.floor(t*(M.fps||12))%(M.frames||1), h=w*M.h/M.w;
  g.save(); g.globalAlpha=0.85; if(M.blend==='lighter') g.globalCompositeOperation='lighter'; g.drawImage(s.img,sheetSX(M,fi),sheetSY(M,fi),M.w,M.h,cx-w/2,by-h,w,h); g.restore(); }
/* um lutador no LADO DELE (o adversário chega aqui com o canvas já espelhado): aura → asa, montaria, herói e arma (drawHeroFull) */
function paPvFighter(g,i,pv,G){ const F=pv.F[i], L=F.look, t=pv.clock+i*0.37, hsNow=(typeof HS!=='undefined'&&HS>0)?HS:155, k=G.K/hsNow, x=(L.mount?G.x:G.xf)+(F.shake>0?(Math.random()-0.5)*8*F.shake*G.f:0);
  if(L.aura){ const on=!!L.mount; paPvAura(g,L.aura,on?G.ax:G.x,G.gy+8*G.f*G.hs,G.K*(on?1.68:1.15),t); }
  if(typeof window.drawHeroFull!=='function') return false;
  const el=pv.clock-F.at; let act=null;
  if(el>=0&&el<F.dur){ const ws=L.weapon||{e:0,r:0}; let gun=false; try{ gun=!L.mount&&typeof wIsGun==='function'&&!!wIsGun(ws); }catch(e){}
    act=F.act||(F.act={type:'s1',t:0,era:0,gun:false,col:'#ffffff',hits:[{s:0,t:0,m:1,i:0}],ev:[],dur:F.dur}); act.t=el; act.dur=F.dur; act.era=ws.e|0; act.gun=gun; act.hits[0].s=act.hits[0].t=gun?0.03:F.lag; }
  const st={t,act,pet:false}; if(i===1){ st.mount=L.mount||false; st.wing=L.wing||false; if(L.weapon) st.weapon=L.weapon; if(L.armor) st.armor=L.armor; st.skin=(!L.mount&&L.skin)?L.skin:'default'; st.layers=[]; }   /* a pé: a skin fixa dele; montado: corpo padrão */
  let ok=false, h0=null, sw=false; try{ if(i===1&&typeof S!=='undefined'&&S&&(S.hero==='kaia'?'kaia':'kael')!==L.hero){ h0=S.hero; S.hero=L.hero; sw=true; }   /* corpo do adversário: troca só durante este desenho, devolvida no finally */
    ok=window.drawHeroFull(g,x,G.gy,k,st)!==false; }catch(e){ ok=false; } finally{ if(sw) S.hero=h0; }
  return ok; }
/* pet do lado i, por ÚLTIMO, no plano da frente (pés em gyP, sombra no chão dele) */
function paPvPetDraw(g,i,pv,G){ const F=pv.F[i], P=F.look.pet; if(!P||typeof sheetLoad!=='function') return false; const dir=typeof PET_DIR!=='undefined'?PET_DIR:'assets/anim/pets/', el=pv.clock-F.petT;
  let atk=el>=0&&el<F.petDur, sh=atk?sheetLoad(dir+P.base+'_atk1',true):null; const idle=sheetLoad(dir+P.base+'_idle',true); if(!sh||!sh.ok){ sh=idle; atk=false; } if(!sh.ok) return false;
  const M=sh.meta, n=M.frames||1, fps=M.fps||12, fi=atk?Math.min(n-1,Math.floor(el*fps)):Math.floor((pv.clock+i*0.4)*fps)%n, q=paPvPet(P,G,el>=0&&el<F.petDur,!!F.look.mount);
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
/* ================= GANCHOS DE DEBUG PARA O QA (só com ?debug=1; sem DEBUG nada abaixo é criado) =================
   A captura de tela leva centenas de ms: estes ganchos CONGELAM a luta aberta num instante exato (o desenho continua, o relógio para) até serem soltos.
     dbgPvpAt(i)        congela logo depois da entrada i do registro (0 = primeiro golpe): golpe em andamento, número de dano na tela, vida já descontada e o
                        RASTRO BRANCO parado no valor de antes do golpe. Serve para ver golpe de pet (k:'pet'), crítico e rastro. Sem argumento lista o registro.
     dbgPvpUlt(lado,t)  congela a ULTIMATE do lado 0 (jogador) ou 1 (adversário) no instante t em segundos (0 a 2,5; padrão 1,2): faixa, escurecimento e nome;
                        com t >= 1,55 o número do golpe já está na tela. Usa a 1ª entrada k:'ult' desse lado; se o registro não tiver, mostra só a faixa
                        (semRegistro:true, sem número: nada é inventado na luta de verdade).
     dbgPvpAt(null) / dbgPvpUlt(null)  soltam: a luta segue do ponto em que estava congelada.
   Todos devolvem um resumo ({i, s, k, dmg, crit, en, hp} da entrada do registro). Chamar com a luta aberta (depois do VS ou durante ele). */
function paPvDbgSeek(pv,i,loud){ pv.hp=[pv.max[0],pv.max[1]]; pv.en=[0,0]; pv.dmg=[0,0]; pv.crits=0; pv.used=[]; pv.i=0; pv.FX=[]; pv.feed=[]; pv.ULT=null; pv.ub=null; pv.loser=-1; pv.endT=0; pv.phase='run';
  for(const F of pv.F){ F.at=-9; F.petT=-9; F.shake=0; F.alpha=1; }
  let last=null, pre=null; while(pv.i<pv.script.length&&pv.script[pv.i].i<=i){ const ev=pv.script[pv.i++], cur=ev.i===i; if(cur&&!pre) pre=[paPvPct(pv.hp[0],pv.max[0]),paPvPct(pv.hp[1],pv.max[1])];
    if(cur&&(loud===true||(loud==null)||(loud==='ult'&&ev.k==='ult'))){ pv.clock=ev.t; paPvApply(pv,ev,false); } else paPvApply(pv,ev,true); last=ev; }
  for(const F of pv.F) F.shake=0; pv.lagPct=pre; return last; }
if(typeof DEBUG!=='undefined'&&DEBUG){ const sum=(pv,i)=>{ const e=pv.log[i]; return e?{i,s:e.s,k:e.k||'hit',dmg:e.dmg,crit:!!e.crit,en:e.en,hp:e.hp}:null; }, free=pv=>{ pv.frozen=false; pv.lagPct=null; try{ render(); }catch(e){} return {solto:true}; };
  window.dbgPvpAt=function(i){ const pv=XA2.pv; if(!pv) return {erro:'abra uma luta da Arena antes'}; if(i===null) return free(pv);
    if(i===undefined) return {registro:pv.log.map((e,k)=>k+':'+(e.s?'adv':'eu')+' '+(e.k||'hit')+(e.crit?' crit':''))};
    i=Math.max(0,Math.min(pv.log.length-1,i|0)); if(!pv.log.length) return {erro:'registro vazio'};
    const ev=paPvDbgSeek(pv,i,true); pv.clock=(ev?ev.t:0)+0.12; pv.frozen=true; XA2.view='fight'; try{ render(); }catch(e){} return Object.assign({congelado:true,relogio:+pv.clock.toFixed(2)},sum(pv,i)); };
  window.dbgPvpUlt=function(side,t){ const pv=XA2.pv; if(!pv) return {erro:'abra uma luta da Arena antes'}; if(side===null) return free(pv);
    side=side?1:0; t=(typeof t==='number'&&isFinite(t))?Math.max(0,Math.min(PV_ULT_DUR-0.01,t)):1.2; const i=pv.log.findIndex(e=>e.k==='ult'&&(e.s?1:0)===side), F=pv.F[side];
    if(i<0){ if(pv.phase==='vs') pv.phase='run'; pv.ULT={t:pv.clock-t,side,i:-1,sheet:F.look.ult.sheet,dur:PV_ULT_DUR}; pv.ub={s:side,name:F.look.ult.name}; F.at=pv.clock-t+PV_ULT_HIT-F.lag; pv.frozen=true; pv.lagPct=null; XA2.view='fight'; try{ render(); }catch(e){}
      return {congelado:true,semRegistro:true,lado:side,t,nome:F.look.ult.name,folha:F.look.ult.sheet,ultsNoRegistro:pv.log.filter(e=>e.k==='ult').length}; }
    paPvDbgSeek(pv,i-1,false); const pre=[paPvPct(pv.hp[0],pv.max[0]),paPvPct(pv.hp[1],pv.max[1])]; let t0=0;
    while(pv.i<pv.script.length&&pv.script[pv.i].i===i){ const ev=pv.script[pv.i]; if(ev.k==='ult'){ t0=ev.t; pv.clock=ev.t; paPvApply(pv,ev,false); pv.i++; } else if(t>=PV_ULT_HIT){ pv.clock=ev.t; paPvApply(pv,ev,false); pv.i++; } else break; }
    for(const X of pv.F) X.shake=0; pv.clock=t0+t; pv.lagPct=t>=PV_ULT_HIT?pre:null; pv.frozen=true; XA2.view='fight'; try{ render(); }catch(e){}
    return Object.assign({congelado:true,lado:side,t,nome:F.look.ult.name,folha:F.look.ult.sheet,numeroNaTela:t>=PV_ULT_HIT},sum(pv,i)); }; }
let paPvRaf=0, paPvErr=0, paPvLoopId=0;
function paPvLoop(now){ paPvRaf=0; const pv=XA2.pv; if(!pv) return; if(paPvLoopId!==pv.id){ paPvLoopId=pv.id; pv.last=0; }   /* quadro agendado por uma luta anterior: recomeça o relógio desta, sem pulo */ try{ if(typeof view!=='undefined'&&view!=='arena'){ paPvFree(); paPvReplay(); return; } }catch(e){}
  const dt=pv.last?Math.min(0.05,Math.max(0,(now-pv.last)/1000)):0; pv.last=now;
  try{ paPvStep(dt); paPvDraw(); }catch(e){ if(!paPvErr){ paPvErr=1; try{ console.error('arena pvp',e); }catch(er){} } }
  if(XA2.pv&&!paPvRaf&&typeof requestAnimationFrame==='function') paPvRaf=requestAnimationFrame(paPvLoop); }
function paPvLoopOn(){ if(!paPvRaf&&XA2.pv&&typeof requestAnimationFrame==='function') paPvRaf=requestAnimationFrame(paPvLoop); }
function paPvLoopOff(){ if(paPvRaf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(paPvRaf); paPvRaf=0; }
/* ---------- tela ---------- */
/* texto que tem de caber INTEIRO sem medir no DOM (xTxtEm do js/screens.js; sem ele, 0,6 em por letra) */
const paPvEm=t=>{ t=String(t==null?'':t).replace(/\u00a0/g,' ');   /* o espaço que não quebra mede o mesmo que o espaço comum */ try{ if(typeof xTxtEm==='function') return xTxtEm(t); }catch(e){} return t.length*0.6; };
const paPvFit=(t,avail,base,min)=>Math.max(min,Math.min(base,Math.floor(avail/Math.max(0.01,paPvEm(t))*10)/10));
/* nomes do placar: {fs px, two}. Largura de cada nome = metade da tela menos retrato, folgas e o VS do meio. Uma linha se os DOIS couberem com fonte >= 11;
   senão os dois lados em duas linhas (mesma altura), com a fonte que faz o nome mais comprido caber em duas linhas (mínimo 9) */
function paPvNameFit(names,W){ const avail=Math.max(40,(W-20-12-36)/2-46-7), em=Math.max(paPvEm(names[0]),paPvEm(names[1]),0.01), one=Math.floor(avail/em*10)/10;
  if(one>=11) return {fs:Math.min(13,one),two:false,avail}; return {fs:Math.max(9,Math.min(12,Math.floor(avail*1.7/em*10)/10)),two:true,avail}; }
function paPvLvl(){ try{ return Sys.level&&Sys.level.level?Sys.level.level(S):null; }catch(e){ return null; } }
function paPvPortrait(i,pv,sz){ if(i===0&&typeof avatarTag==='function') return avatarTag(sz,'position:absolute;left:0;top:0;width:100%;height:100%;display:block','');
  const h=i===0?pv.F[0].look.hero:pv.F[1].look.hero; return `<img src="assets/hero/avatar/${h==='kaia'?'kaia':'kael'}_phase0.png" alt="">`; }
/* PRÊMIO DA LUTA (PO): só o que o Sys.arena.fight devolver em r.rewards {gold, gems, chest}; caixa só para o que veio e é > 0. Sem r.rewards não há caixa
   nenhuma (a luta só credita pontos): fica a linha de aviso do prêmio da liga. chest pode vir como número ou lista de itens. */
function paPvPrize(pv){ const rw=pv.r.rewards&&typeof pv.r.rewards==='object'?pv.r.rewards:null; if(!rw) return null; const out=[], num=v=>(typeof v==='number'&&isFinite(v)&&v>0)?v:0;
  const gold=num(rw.gold), gems=num(rw.gems), chest=Array.isArray(rw.chest)?rw.chest.length:num(rw.chest===true?1:rw.chest);
  if(gold) out.push({img:'coin',v:'+'+paF(gold),lb:gold===1?'moeda':'moedas'}); if(gems) out.push({img:'gem',v:'+'+paF(gems),lb:gems===1?'gema':'gemas'}); if(chest) out.push({img:'chest',v:'+'+paF(chest),lb:chest===1?'baú':'baús'});
  try{ const z=window.PArenaSet&&PArenaSet.prize(rw); if(z) out.push(z); }catch(e){}   /* "+1 Brasa" da Arena (Sys.arenaSet.onWin) */
  return out; }
function paSetOn(){ try{ return !!(window.PArenaSet&&PArenaSet.on()); }catch(e){ return false; } }
function paPvResultHTML(pv){ const r=pv.r, win=!!r.win, li=Sys.arena.leagueInfo(S,paH()), L=li.league, N=li.next, o=Sys.arena.ensure(S,paH()), pz=paPvPrize(pv), nb=pv.log.length, tm=nb+(nb===1?' golpe':' golpes');   /* quantos golpes a luta teve (dado do registro); o relógio da tela é só o da animação e não entra aqui */
  const frac=N?Math.max(0,Math.min(1,(li.lp-L.min)/Math.max(1,N.min-L.min))):1, to=!win&&pv.hp[0]>0;
  const hint=li.zone==='down'?'cuidado: abaixo de '+paN(L.min)+' você cai':N?(li.toUp>0?'faltam '+paN(li.toUp)+' para '+N.name:'sobe para '+N.name+' no fechamento'):'liga mais alta';
  return `<div class="pv-ovl pv-res"><div class="pv-card" role="dialog" aria-label="${win?'Vitória':'Derrota'}"><h2 class="${win?'win':'lose'}">${win?'VITÓRIA':'DERROTA'}</h2>
    <p>${win?'Você venceu '+paEsc(pv.opp.name)+' em '+tm:to?'Tempo esgotado: '+paEsc(pv.opp.name)+' venceu':paEsc(pv.opp.name)+' venceu em '+tm}</p>
    ${pz&&pz.length?`<div class="pv-rwt">Prêmio desta luta</div><div class="pv-rw" style="grid-template-columns:repeat(${pz.length},minmax(0,1fr))">${pz.map(x=>`<div><img src="assets/ui/${x.img}.png" alt=""><b>${x.v}</b><small>${x.lb}</small></div>`).join('')}</div>`:'<div style="height:12px"></div>'}
    <div class="pv-lg"><div class="row"><span>Liga ${paEsc(L.name)}</span><span>${r.delta>=0?'+':'−'}${paN(Math.abs(r.delta))} pontos</span></div>
      <div class="pv-lgb" role="progressbar" aria-label="Pontos de liga" aria-valuenow="${li.lp}"><i style="width:${Math.round(frac*100)}%"></i></div>
      <div class="row" style="margin-top:4px;color:#9aa6d6;font-weight:800"><span>${paN(li.lp)}${N?' / '+paN(N.min):''}</span><span>${paEsc(hint)}</span></div></div>
    <p class="pv-note">Prêmio da liga ${paEsc(L.name)} ao fechar a semana${li.rewardsOn?'':' · vale quando o ranking online abrir'}</p>
    <div class="pv-acts"><button class="o" data-x="back">Voltar à arena</button><button class="g${o.attemptsLeft>0?'':' off'}" data-x="again" aria-disabled="${o.attemptsLeft<=0}">${o.attemptsLeft>0?'Lutar de novo · '+o.attemptsLeft:'Sem lutas hoje'}</button></div></div></div>`; }
function paPvHTML(d){ paPvInject(); const pv=XA2.pv, G=pv.geo=paPvGeo(d.Wb||390,d.H||640), li=Sys.arena.leagueInfo(S,paH()), o=Sys.arena.ensure(S,paH()), mx=paMaxTries(), lv=paPvLvl(), fn=o.rwFights>0?Math.floor(o.rwFights):Math.max(1,mx-o.attemptsLeft);   /* nº da luta de hoje: contador do módulo (rwFights); sem ele, máximo − restantes. No Modo dono as tentativas são repostas, então pode passar do máximo: aí sai só "Luta N de hoje" */
  const olv=+pv.opp.level>0?Math.floor(+pv.opp.level):null, nm=[paMe()+(lv!=null?' ·\u00a0Nv\u00a0'+lv:''),pv.opp.name+(olv!=null?' ·\u00a0Nv\u00a0'+olv:'')],   /* espaços que não quebram: "· Nv 69" fica junto e a quebra cai antes do "·" */ fc=[pv.myFc,pv.opp.fc], col=['#5ee7ff','#ff5d7a'], nf=paPvNameFit(nm,G.W), fcs=Math.min(paPvFit('FC '+paFCx(fc[0],pv.net),nf.avail,10,7),paPvFit('FC '+paFCx(fc[1],pv.net),nf.avail,10,7));
  let bg=''; try{ if(typeof bgPath==='function'&&typeof B!=='undefined') bg=bgPath(B.dispEra!=null?B.dispEra:0); }catch(e){ bg=''; }
  const pl=i=>{ const p=paPvPct(pv.hp[i],pv.max[i]); return `<div class="pv-pl${i?' r':''}" style="--c:${col[i]}"><div class="pv-av" aria-hidden="true">${paPvPortrait(i,pv,46)}</div><div class="pv-pi"><div class="pv-pn${nf.two?' w2':''}" style="font-size:${nf.fs}px"><span>${paEsc(nm[i])}</span></div><div class="pv-pf" style="font-size:${fcs}px">FC ${paFCx(fc[i],pv.net)}</div>
    <div class="pv-bar${p<30?' low':''}" id="pa_hb${i}" role="progressbar" aria-label="Vida de ${paEsc(i?pv.opp.name:paMe())}"><i class="lag" id="pa_lg${i}" style="width:${(pv.lagPct?Math.max(p,pv.lagPct[i]):p).toFixed(1)}%${pv.lagPct?';transition:none':''}"></i><i class="hp" id="pa_hp${i}" style="width:${p.toFixed(1)}%"></i><b id="pa_ht${i}">${paF(pv.hp[i])}</b></div>
    <div class="pv-en${pv.en[i]>=100?' full':''}" id="pa_eb${i}" role="progressbar" aria-label="Energia"><i id="pa_en${i}" style="width:${pv.en[i].toFixed(1)}%"></i></div></div></div>`; };
  const vsa=i=>`<div class="pv-vsc${i?' r':''}" style="--c:${col[i]}"><div class="pv-bigav">${paPvPortrait(i,pv,110)}</div></div>`, vsn=i=>`<div class="pv-vsc n${i?' r':''}"><b>${paEsc(i?pv.opp.name:paMe())}</b><span>FC ${paFCx(fc[i],pv.net)}</span></div>`;   /* retratos na 1ª linha da grade (sempre alinhados); nomes na 2ª, com quantas linhas precisarem */
  const ov=pv.phase==='vs'?`<div class="pv-ovl pv-vs" role="status" aria-label="${paEsc(paMe())} contra ${paEsc(pv.opp.name)}"><div class="pv-vsrow">${vsa(0)}<div class="pv-bigvs">VS</div>${vsa(1)}${vsn(0)}<div></div>${vsn(1)}</div><div style="font-weight:900;color:#9aa6d6;font-size:13px;text-align:center">Liga ${paEsc(li.league.name)} · luta automática</div></div>`
    :pv.phase==='result'?paPvResultHTML(pv):'';
  const sp=v=>`<button data-x="pvspd" data-v="${v}" aria-pressed="${pv.speed===v}" aria-label="Velocidade ${v} vezes">x${v}</button>`;
  return `<div class="pv" id="pa_pv">${bg?`<div class="pv-bg" style="height:${Math.round(G.gyP+60)}px;background-image:url(${bg})"></div>`:''}
    <div class="pv-bg2" style="background:linear-gradient(180deg,rgba(11,16,48,.55) 0,rgba(11,16,48,0) ${Math.round(G.gy*0.3)}px,rgba(11,16,48,0) ${Math.round(G.gy-30)}px,#0b1030 ${Math.round(G.gyP+56)}px)"></div>
    <canvas id="pa_cv" class="pv-cv" role="img" aria-label="Luta da arena: ${paEsc(paMe())} contra ${paEsc(pv.opp.name)}"></canvas>
    <div class="pv-hud">${pl(0)}<div class="pv-mid"><div class="pv-vsm">VS</div><div class="pv-tm" id="pa_tm" role="timer">${paPvClock(pv.clock)}</div></div>${pl(1)}</div>
    <div class="pv-league">Liga <b>${paEsc(li.league.name)}</b> · ${fn<=mx?`Luta ${fn} de ${mx} de hoje`:`Luta ${fn} de hoje`}</div>
    <div class="pv-ub" id="pa_ub" style="top:${Math.round(G.ubTop)}px">${paPvUbHTML(pv)}</div>
    <div class="pv-feed" id="pa_feed" aria-live="polite" style="top:${Math.round(G.feedTop)}px">${paPvFeedHTML(pv)}</div>
    <div class="pv-info"><div><small>Dano seu</small><b id="pa_d0">${paF(pv.dmg[0])}</b></div><div><small>Críticos</small><b id="pa_cr">${pv.crits}</b></div><div><small>Dano dele</small><b id="pa_d1">${paF(pv.dmg[1])}</b></div></div>
    ${pv.phase==='result'?'':`<div class="pv-ctr">${sp(1)}${sp(2)}${sp(4)}<button class="skip" data-x="skip">Pular</button></div>`}
    ${ov}</div>`; }
Panels.add('arena',{title:'Arena',render:scrArena,click:paClick,
  busy(){ return XA2.view==='fight'||!!XA2.pv||!!XA2.wait; },   /* luta e resultado: ninguém de fora redesenha a tela (o cartão do resultado não "pula" de novo a cada evento da batalha) */
  tick(){ if(paOk()&&XA2.view==='lobby'&&XA2.tab===3){ try{ if(window.PArenaSet) PArenaSet.tick(); }catch(e){} return; }
    if(!paOk()||XA2.view!=='lobby'||XA2.tab!==0) return; try{ const w=document.getElementById('pa_week'), d=document.getElementById('pa_day');
    if(w) w.textContent=paClock(Sys.arena.leagueInfo(S,paH()).msLeft); if(d) d.textContent=paClock(paDayLeft()); }catch(e){} },
  onOpen(){ XA2.view='lobby'; XA2.tab=0; XA2.sel=0; XA2.refBusy=false; paNetStopWait(); paStop(); paPvFree(); paNetSnap(); }, onClose(){ paNetStopWait(); paStop(); paPvFree(); XA2.view='lobby'; XA2.fight=null; try{ setTimeout(paPvReplay,0); }catch(e){} } });
