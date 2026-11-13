'use strict';
/* ================= 27 TORNEIO DO PODER — tela nova, nasce DESLIGADA (PANEL_ON.tourney) =================
   Protótipo APROVADO: docs/proto/TorneioPoder.dc.html. Guerra de territórios entre guildas no mapa-múndi das 9 eras (assets/map/world.jpg,
   mesmo recorte e mesmas posições do protótipo). Ordem do protótipo: selo "Em breve" · abas Mapa / Batalha / Ranking · folha do território.
   REGRAS E NÚMEROS: só do Sys.guild (js/sys/guild.js) — DATA.territory (9 regiões × perRegion territórios + Capital, bônus por território,
   capitalMult, tetos), DATA.tourney (size = lutadores por lado, rewards = faixas de prêmio), DATA.coin (nome da moeda), status(S,host)
   (on/open/reason off|server|level), territoryBonus(lista), canAttackRegion(eras, região), tourneyReward(pos), levelOfXp(xp), memberCap(nível).
   TUDO DEPENDE DO SERVIDOR (guildas, dono de cada território, batalhas): a tela mostra DADOS DE DEMONSTRAÇÃO LOCAIS (guildas de exemplo),
   sempre com o selo visível "Em breve: abre com o online"; todo botão que precisaria do servidor (Atacar, Defender, Começar a batalha) responde
   com essa mensagem — nenhum botão morto. Com o módulo desligado (status.on=false) ou sem servidor (reason 'server'), o selo é o mesmo.
   O cabeçalho (Voltar, título, moedas/gemas) é do jogo; aqui só o conteúdo (igual ao p_vip.js).
   DIFERENÇAS CONSCIENTES em relação ao protótipo:
   - o protótipo tem 1 território por era; o Sys.guild tem 9 regiões × 3 territórios + 1 Capital (28). Cada bandeira do mapa é uma REGIÃO
     (cor do dono da maioria + 3 marcas, uma por território) e a Capital tem bandeira própria no centro; a folha lista os 3 territórios da região;
   - bônus por território são os do Sys.guild (iguais em todas as regiões; Capital × capitalMult), não os valores de protótipo por era;
     o mapa mostra o bônus somado da sua guilda já com o teto (territoryBonus);
   - a batalha é a de DATA.tourney.size lutadores por lado (o protótipo tinha 5) e NÃO é simulada aqui: a batalha real roda no servidor
     (Sys.tower.duel). A aba mostra a escalação de exemplo, a regra "rei da colina" e a trava da mediana de era (canAttackRegion);
     sem placar ao vivo, sem botão x2, sem "Pular" e sem tela de resultado (seriam números inventados);
   - faixas de prêmio vêm de DATA.tourney.rewards (Brasões + fragmentos do Prismático + moldura no 1º); sem a faixa "Todas: Baú de participação"
     e sem "[QTD]", que não existem no Sys.guild; sem "Prêmio diário do dono";
   - sem contagem regressiva da temporada nem contagem das guerras: o calendário semanal (seg-qui declarar, sex-sáb batalhas às 20h, dom prêmios)
     não está no Sys.guild.DATA. Se o dono do sistema criar DATA.season ({declareDays, battleDays, battleHour, prizeDay}), a tela já mostra a
     faixa da temporada e o relógio até o dia de prêmios;
   - ranking "Territórios" ordena pela QUANTIDADE de territórios (a pontuação 1+e / Capital 15 da spec §4 não está no Sys.guild);
   - sem sons de arquivo próprios: usa snd('ui_tap') do jogo; sem emoji (moeda de ouro e baú vêm de assets/ui, Prismático de assets/pets).
   PEDIDO AO ENGENHEIRO: acrescentar 'p_tourney' à lista de scripts de js/screens.js:823 (não editei esse arquivo). */
const XT={tab:0,sel:-1,rk:0,page:0,anim:true,sig:'',toast:'',toastT:0,mapTop:null};
const T_MINH=640, T_PER=5, T_MAPW=366, T_MAPH=Math.round(T_MAPW*2752/1136);
const T_ERA0=['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'];
/* posição de cada região na arte de 1536×2752 (as mesmas do protótipo) e o lado da placa */
const T_POS=[[670,2610,'r'],[522,2090,'r'],[860,1790,'l'],[585,1590,'r'],[720,1420,'l'],[730,1160,'r'],[790,790,'l'],[915,590,'l'],[770,330,'r']];
const T_CAP=[1150,1330,'l'];
const T_SYM=['M7 4 H17 M7 20 H17 M8 4 C8 9 12 10 12 12 C12 14 8 15 8 20 M16 4 C16 9 12 10 12 12 C12 14 16 15 16 20','M12 2 L14 5 V15 H10 V5 Z M6 15 H18 M12 15 V21',
  'M4 17 L5 7 L9 11 L12 5 L15 11 L19 7 L20 17 Z','M12 3 C15 8 18 10 18 14 A6 6 0 0 1 6 14 C6 10 9 9 9 6 C10 8 11 9 12 9 Z',
  'M12 3 L14.6 9 L21 9.5 L16 13.6 L17.6 20 L12 16.5 L6.4 20 L8 13.6 L3 9.5 L9.4 9 Z','M12 3 L19 13 H15 L18 18 H6 L9 13 H5 Z M12 18 V22'];
/* ---------- DEMONSTRAÇÃO LOCAL (some quando o servidor mandar o mapa real) ---------- */
const T_GU=[
  {name:'Guardiões do Tempo',tag:'GDT',c:'#c8322a',hue:'none',sym:0,xp:9000,pow:61.2e6,me:true},
  {name:'Lobos de Ferro',tag:'LDF',c:'#2f86e0',hue:'hue-rotate(200deg) saturate(1.2)',sym:1,xp:14000,pow:66.4e6},
  {name:'Ordem da Aurora',tag:'ODA',c:'#e8a21a',hue:'hue-rotate(40deg) saturate(1.3)',sym:4,xp:11000,pow:48.9e6},
  {name:'Clã do Trovão',tag:'CDT',c:'#8a52e0',hue:'hue-rotate(255deg)',sym:2,xp:60000,pow:74.0e6},
  {name:'Filhos do Sol',tag:'FDS',c:'#3fae4a',hue:'hue-rotate(110deg)',sym:3,xp:5000,pow:31.5e6},
  {name:'Corvos Rúnicos',tag:'CRR',c:'#1aa8a8',hue:'hue-rotate(165deg)',sym:5,xp:9000,pow:44.7e6}];
const T_OTHER=[['Raposas de Cristal','#d86aff',3.9e6],['Lâminas Livres','#6a8aa8',3.1e6],['Dragões de Bronze','#c98a4a',2.8e6],['Guarda Celeste','#8cc8ff',2.4e6],
  ['Era de Ouro','#ffd24a',2.2e6],['Maré Vermelha','#e8402a',1.9e6],['Os Imortais','#9a9a9a',1.7e6],['Filhos da Névoa','#5ad8e6',1.5e6],['Punho de Pedra','#a87a5a',1.2e6]];
const T_OWN=[[4,4,0],[2,2,0],[0,0,1],[0,1,1],[1,1,0],[1,3,3],[3,3,5],[5,5,3],[3,3,3]], T_CAPOWN=3;
const T_WARS={3:1,4:0,7:3};   /* região → guilda que ataca */
const T_MYERAS=[2,2,3,3,3,4,4,4,4,5,5,5,6,6,7];   /* eras dos escalados de exemplo da sua guilda */
const T_NAMES=['Rex_Brasa','LunaFerro','Mari Lâmina','Você','Caio Trovão','Dani Rocha','Leo Faísca','Bia Escudo','Rafa Vento','Gabi Lua','Tom Ferro','Nina Brisa','Davi Forte','Lara Sol','Beto Raio'];
const T_FOES=['Lobo Alfa','Duda Gelo','Enzo Aço','Igor Lobo','Malu Escudo','Kiko','Pedro Gume','Ana Gelo','Lia Fera','Rui Presa','Vivi','Otto','Caco','Mila','Zeca'];
const T_CSS=`.pt-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:ptk 1s steps(12,jump-none) infinite}
@keyframes ptk{from{background-position:0 0}to{background-position:100% 0}}
.pt-head{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-position:0 18%;background-repeat:no-repeat}
.pt-soon{position:relative;overflow:hidden}
.pt-soon::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);background-size:300% 100%;animation:ptsh 3s ease-in-out infinite;pointer-events:none}
@keyframes ptsh{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
.pt-sig{animation:ptsg 1.6s ease-in-out infinite}
@keyframes ptsg{0%,100%{filter:drop-shadow(0 0 2px rgba(140,200,255,.5));transform:scale(1)}50%{filter:drop-shadow(0 0 10px rgba(140,200,255,1));transform:scale(1.1)}}
.pt-bdg{animation:ptb 1.2s ease-in-out infinite}
@keyframes ptb{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
.pt-tab{min-width:0;min-height:48px;border:0;border-radius:10px;background:transparent;color:#c9b9a2;font-family:'Lilita One',sans-serif;font-size:16px;line-height:1.05;padding:0 3px;position:relative;display:flex;align-items:center;justify-content:center;gap:6px}
.pt-tab[aria-selected="true"]{background:#3a2c1f;color:#ffc94a;box-shadow:inset 0 -3px 0 #ffc94a}
.pt-dot{position:absolute;top:3px;right:5px;min-width:16px;height:16px;border-radius:8px;background:#ff3b30;color:#fff;font-family:Nunito,sans-serif;font-size:10px;font-weight:900;line-height:16px;padding:0 3px}
.pt-gh{min-height:44px;min-width:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;color:#f6ecdf;font-weight:900;font-size:13px;padding:0 10px;display:flex;align-items:center;justify-content:center;gap:6px}
.pt-gh[aria-pressed="true"]{border-color:#ffc94a;color:#ffc94a;background:#3a2c1f}
.pt-gh[aria-disabled="true"]{opacity:.4}
.pt-gold{min-height:54px;border-radius:14px;border:0;font-family:'Lilita One',sans-serif;font-size:19px;display:flex;align-items:center;justify-content:center;gap:8px;color:#fff;padding:0 12px}
.pt-red{background:linear-gradient(180deg,#ff6a4a,#c8261a);box-shadow:0 5px 0 #6a1408}
.pt-blue{background:linear-gradient(180deg,#5ab4ff,#1d6ac8);box-shadow:0 5px 0 #0d3a6a}
.pt-lock{background:linear-gradient(180deg,#5a4a3a,#3a2c1f);box-shadow:0 5px 0 #1a120a;color:#c9b9a2}
.pt-gold:active{transform:translateY(3px)}
.pt-pulse{animation:ptp 1.5s ease-in-out infinite}
@keyframes ptp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.18)}}
.pt-flag{transform-origin:12px 20px;animation:ptf 2.2s ease-in-out infinite}
@keyframes ptf{0%,100%{transform:skewY(0)}50%{transform:skewY(-4deg)}}
.pt-terr{position:absolute;left:-46px;top:-30px;width:92px;height:60px;border-radius:50%;animation:ptt 3s ease-in-out infinite;pointer-events:none}
@keyframes ptt{0%,100%{opacity:.55;transform:scale(.95)}50%{opacity:.9;transform:scale(1.05)}}
.pt-war{position:absolute;left:-30px;top:-20px;width:60px;height:40px;border-radius:50%;border:3px solid #ff7a3a;animation:ptw 1.4s ease-out infinite;pointer-events:none}
@keyframes ptw{from{transform:scale(.6);opacity:1}to{transform:scale(1.6);opacity:0}}
.pt-sel{position:absolute;left:-24px;top:-14px;width:48px;height:28px;border-radius:50%;border:3px solid #ffe07a;box-shadow:0 0 12px #ffe07a;pointer-events:none}
.pt-plate{position:absolute;display:flex;flex-direction:column;width:98px;padding:2px 6px 3px;border-radius:9px;background:rgba(14,10,7,.88);border:1px solid #6a4a1a;line-height:1.1;pointer-events:none}
.pt-plate.mine{border-color:#ffc94a;box-shadow:0 0 8px rgba(255,201,74,.55)}
.pt-in{animation:ptin .3s ease-out both}
@keyframes ptin{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
.pt-up{animation:ptu .35s cubic-bezier(.2,1.2,.4,1) both}
@keyframes ptu{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
.pt-sym{transform-box:view-box;transform-origin:24px 28px;animation:ptsy 3.2s ease-in-out infinite}
@keyframes ptsy{0%,100%{transform:scale(1) rotate(0)}50%{transform:scale(1.08) rotate(-4deg)}}
.pt-cur{outline:2px solid #ffe07a;outline-offset:1px}
@media (prefers-reduced-motion:reduce){.pt-kid,.pt-soon::after,.pt-sig,.pt-bdg,.pt-pulse,.pt-flag,.pt-terr,.pt-war,.pt-in,.pt-up,.pt-sym{animation:none}}`;

/* ---------- leituras isoladas ---------- */
const tG=()=>(window.Sys&&Sys.guild&&Sys.guild.DATA&&Sys.guild.territoryBonus)?Sys.guild:null;
const tEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const tEra=i=>{ try{ if(typeof ERAS!=='undefined'&&ERAS[i]&&ERAS[i].n) return ERAS[i].n; }catch(e){} return T_ERA0[i]||('Era '+i); };
const tX=x=>((x-200)/1136*100).toFixed(2)+'%', tY=y=>(y/2752*100).toFixed(2)+'%';
function tFC(n){ const f=(v,u)=>String(v<10?Math.round(v*10)/10:Math.round(v)).replace('.',',')+' '+u; return n>=1e6?f(n/1e6,'mi'):n>=1e3?f(n/1e3,'mil'):String(Math.round(n)); }
function tInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pt_css')) return; const st=document.createElement('style'); st.id='pt_css'; st.textContent=T_CSS; document.head.appendChild(st); }
function tStatus(){ const G=tG(); if(!G) return {on:false,open:false,reason:'off'}; try{ return G.status(S,(window.Sys&&Sys.host)||null)||{on:false,reason:'off'}; }catch(e){ return {on:false,open:false,reason:'off'}; } }
const tLv=g=>{ const G=tG(); try{ return G.levelOfXp(g.xp).level; }catch(e){ return 1; } };
function tEmb(c,sym,w,extra){ return `<span style="position:relative;display:block;flex:none;width:${w}px;aspect-ratio:48/56;filter:drop-shadow(0 0 4px ${c}) drop-shadow(0 2px 0 rgba(0,0,0,.6));${extra||''}"><svg viewBox="0 0 48 56" aria-hidden="true" style="width:100%;height:100%;display:block;overflow:visible"><path d="M24 1 L46 8.5 V27 C46 43 35 51 24 55 C13 51 2 43 2 27 V8.5 Z" fill="#2a1a0a"></path><path d="M24 4 L43 10.5 V27 C43 41 33.5 48.5 24 52 C14.5 48.5 5 41 5 27 V10.5 Z" fill="${c}" stroke="#ffe9b0" stroke-width="2"></path><g class="pt-sym"><path d="${T_SYM[sym%T_SYM.length]}" transform="translate(12 16)" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path></g></svg></span>`; }
const T_SW='M4 3 L14 13 M20 3 L10 13 M5 17 L8 14 M19 17 L16 14', T_SH='M12 3 L20 6 V12 C20 17 16 20 12 21 C8 20 4 17 4 12 V6 Z', T_MAPI='M3 6 L9 3 L15 6 L21 3 V18 L15 21 L9 18 L3 21 Z M9 3 V18 M15 6 V21';
const tIc=(d,z,col)=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" fill="none" stroke="${col||'currentColor'}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="${d}"></path></svg>`;
const tCoinIc=z=>`<svg width="${z}" height="${z}" viewBox="0 0 24 24" aria-hidden="true" style="flex:none;vertical-align:-3px"><path d="M12 2 L21 5 V11 C21 17 17 20.5 12 22 C7 20.5 3 17 3 11 V5 Z" fill="#c8322a" stroke="#ffe07a" stroke-width="2"></path><path d="M8 11 L12 7 L16 11 L12 15 Z" fill="#ffe07a"></path></svg>`;

/* ---------- dados da demonstração, com as regras do Sys.guild ---------- */
const tPerRegion=()=>{ const G=tG(); return G?G.DATA.territory.perRegion:3; };
const tRegions=()=>{ const G=tG(); return G?G.DATA.territory.regions:9; };
function tOwnerOf(r){ const o=T_OWN[r]||[]; const n={}; let best=o[0], bn=0; for(const g of o){ n[g]=(n[g]||0)+1; if(n[g]>bn){ bn=n[g]; best=g; } } return best; }
function tMine(){ const L=[]; for(let r=0;r<tRegions();r++) for(let t=0;t<tPerRegion();t++) if(T_GU[(T_OWN[r]||[])[t]]&&T_GU[T_OWN[r][t]].me) L.push({region:r,capital:false}); if(T_GU[T_CAPOWN].me) L.push({region:4,capital:true}); return L; }
function tCount(gi){ let n=0; for(let r=0;r<tRegions();r++) for(let t=0;t<tPerRegion();t++) if((T_OWN[r]||[])[t]===gi) n++; if(T_CAPOWN===gi) n++; return n; }
function tCanAtk(r){ const G=tG(); try{ return !!G.canAttackRegion(T_MYERAS,r); }catch(e){ return false; } }
function tMedian(){ const a=T_MYERAS.slice().sort((x,y)=>x-y); return a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2; }
function tSeason(){ const G=tG(), Z=G&&G.DATA.season; if(!Z||typeof Z!=='object'||typeof Z.prizeDay!=='number') return null;
  let now=Date.now(); try{ if(window.Sys&&Sys.host&&Sys.host.now) now=Sys.host.now(); }catch(e){}
  const d=new Date(now); let add=(Z.prizeDay-d.getDay()+7)%7; const end=new Date(now); end.setHours(0,0,0,0); end.setDate(end.getDate()+add); let left=end.getTime()-now; if(left<=0) left+=7*864e5;
  const s=Math.floor(left/1000), dd=Math.floor(s/86400), hh=Math.floor(s%86400/3600), mm=Math.floor(s%3600/60), p=n=>String(n).padStart(2,'0');
  const day=d.getDay(), ph=Array.isArray(Z.declareDays)&&Z.declareDays.includes(day)?'Declarar ataques':Array.isArray(Z.battleDays)&&Z.battleDays.includes(day)?'Batalhas'+(typeof Z.battleHour==='number'?' às '+Z.battleHour+'h':''):day===Z.prizeDay?'Prêmios':'Temporada';
  return {ph,left:(dd?dd+'d ':'')+p(hh)+':'+p(mm)}; }
function tRanking(){ const all=T_GU.map((g,i)=>({name:g.name,c:g.c,sym:g.sym,lv:tLv(g),pow:g.pow,me:!!g.me,ter:tCount(i)}))
    .concat(T_OTHER.map((o,i)=>({name:o[0],c:o[1],sym:i%T_SYM.length,lv:tLv({xp:1000+i*700}),pow:o[2]*10,me:false,ter:0})));
  all.sort(XT.rk===0?(a,b)=>(b.ter-a.ter)||(b.pow-a.pow):(a,b)=>b.pow-a.pow); return all; }

/* ---------- partes da tela ---------- */
function tBanner(st){ const Z=tSeason();
  const sub=st.reason==='level'?'Libera no nível '+tEsc(st.needLevel)+' · prévia com guildas de exemplo':'Prévia com guildas de exemplo';
  return `<div class="pt-soon" role="note" style="flex:none;display:flex;align-items:center;gap:8px;min-height:44px;padding:3px 4px 3px 10px;border-radius:14px;background:linear-gradient(90deg,#1d4a7a,#13314f 60%,#1d1611);border:2px solid #4aa3ff">
    <svg class="pt-sig" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8cc8ff" stroke-width="2.2" stroke-linecap="round" aria-hidden="true" style="flex:none"><path d="M2 9 C8 3 16 3 22 9"></path><path d="M5 12.5 C9 8.5 15 8.5 19 12.5"></path><path d="M8.5 16 C10.5 14 13.5 14 15.5 16"></path><circle cx="12" cy="19.5" r="1.4" fill="#8cc8ff"></circle></svg>
    <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15;position:relative;z-index:1"><span style="font-size:13px;font-weight:900"><span class="pt-bdg" style="display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-radius:6px;background:#ffc94a;color:#2a1403">EM BREVE</span> Abre com o online</span>
    <span style="font-size:11px;font-weight:800;color:#cfe7ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${sub}</span></span>
    ${Z?`<span role="timer" aria-label="${tEsc(Z.ph)}, temporada termina em ${tEsc(Z.left)}" style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:flex-end;padding:3px 8px;border-radius:10px;background:#0e0a07;border:1px solid #4a3a2b;line-height:1.1;flex:none"><span style="font-size:10px;font-weight:800;color:#c9b9a2">${tEsc(Z.ph)}</span><span style="font-family:'Lilita One',sans-serif;font-size:14px;color:#ffe07a;font-variant-numeric:tabular-nums;white-space:nowrap">${tEsc(Z.left)}</span></span>`:''}</div>`; }
function tTabs(){ const n=Object.keys(T_WARS).length;
  const T=[['Mapa',T_MAPI,n],['Batalha',T_SW+' M3 21 L6 18 M21 21 L18 18',0],['Ranking','M7 3 H17 V8 A5 5 0 0 1 7 8 Z M12 13 V17 M8 21 H16 M9 17 H15 V21 H9 Z',0]];
  return `<div role="tablist" aria-label="Seções do torneio" style="flex:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:3px;padding:3px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b">${T.map((t,i)=>`<button class="pt-tab" role="tab" data-x="tab" data-i="${i}" aria-selected="${XT.tab===i}">${tIc(t[1],20)}${t[0]}${t[2]?`<span class="pt-dot" aria-label="${t[2]} regiões em guerra">${t[2]}</span>`:''}</button>`).join('')}</div>`; }

function tFlag(x,y,side,c,sym,pips,title,owner,mine,war,sel,aria,act,z){
  const lx=side==='r'?'24px':'-122px';   // plaquinha estreita (98 px) para caber no mapa de 390 px sem cobrir as vizinhas
  return `<div style="position:absolute;left:${tX(x)};top:${tY(y)};width:0;height:0;z-index:${z}">
    <span class="pt-terr" style="background:radial-gradient(ellipse,${c} 0%,${c}66 45%,transparent 72%)"></span>
    ${war?'<span class="pt-war"></span><span class="pt-war" style="animation-delay:.7s"></span>':''}${sel?'<span class="pt-sel"></span>':''}
    <span style="position:absolute;left:-14px;top:-5px;width:28px;height:10px;border-radius:50%;background:rgba(0,0,0,.5)"></span>
    <svg width="52" height="66" viewBox="0 0 52 66" aria-hidden="true" style="position:absolute;left:-12px;top:-64px;overflow:visible">
      <ellipse cx="10" cy="63" rx="9" ry="3.5" fill="#6a4a2a" stroke="#2a1a0a" stroke-width="1.5"></ellipse><line x1="10" y1="63" x2="10" y2="4" stroke="#2a1a0a" stroke-width="5" stroke-linecap="round"></line><line x1="10" y1="63" x2="10" y2="4" stroke="#e8c27a" stroke-width="2.6" stroke-linecap="round"></line><circle cx="10" cy="4" r="3.6" fill="#ffe07a" stroke="#2a1a0a" stroke-width="1.5"></circle>
      <g class="pt-flag"><path d="M12 7 L48 10 L40 21 L48 32 L12 30 Z" fill="${c}" stroke="#2a1a0a" stroke-width="2" stroke-linejoin="round"></path><path d="${T_SYM[sym%T_SYM.length]}" transform="translate(19 10) scale(.66)" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path></g>
      ${pips.map((pc,k)=>`<circle cx="${18+k*9}" cy="40" r="3.6" fill="${pc}" stroke="#2a1a0a" stroke-width="1.4"></circle>`).join('')}</svg>
    <div class="pt-plate${mine?' mine':''}" style="left:${lx};top:-26px"><span style="font-family:'Lilita One',sans-serif;font-size:12px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tEsc(title)}</span><span style="font-size:10px;font-weight:900;color:${mine?'#ffd84a':'#e8dccb'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tEsc(owner)}</span>${war?`<span style="display:flex;align-items:center;gap:4px;margin-top:1px"><span style="font-size:9.5px;font-weight:900;padding:0 5px;border-radius:5px;background:#ff5a2a;color:#fff">GUERRA</span><span style="font-size:10.5px;font-weight:900;color:#ffcfb8">${tEsc(war)}</span></span>`:''}</div>
    <button data-x="${act}" aria-label="${tEsc(aria)}" style="position:absolute;left:-26px;top:-66px;width:56px;height:76px;border:0;padding:0;background:transparent"></button></div>`; }

function tMap(){ const G=tG(), my=tMine(), B=G.territoryBonus(my), cap=G.DATA.territory.cap;
  const flags=[];
  for(let r=0;r<tRegions()&&r<T_POS.length;r++){ const P=T_POS[r], ow=T_OWN[r]||[], gi=tOwnerOf(r), g=T_GU[gi], n=ow.filter(x=>T_GU[x]&&T_GU[x].me).length, w=T_WARS[r];
    const owner=n?(n===ow.length?'Sua guilda':'Sua · '+n+' de '+ow.length):g.name;
    const war=w!=null?(T_GU[w].me?'Você ataca':T_GU[w].tag+' ataca'):'';
    flags.push(tFlag(P[0],P[1],P[2],n?T_GU[0].c:g.c,n?T_GU[0].sym:g.sym,ow.map(x=>T_GU[x].c),tEra(r),owner,!!n,war,XT.sel===r,
      'Região '+tEra(r)+', '+ow.length+' territórios, '+(n?n+' da sua guilda':'dono '+g.name)+(war?', em guerra':'')+'. Abrir detalhes','reg" data-i="'+r,XT.sel===r?6:(w!=null?4:3))); }
  const cg=T_GU[T_CAPOWN];
  flags.push(tFlag(T_CAP[0],T_CAP[1],T_CAP[2],cg.c,cg.sym,[],'Capital',cg.me?'Sua guilda':cg.name,!!cg.me,'',XT.sel===99,'Capital, dono '+cg.name+'. Abrir detalhes','reg" data-i="99',XT.sel===99?6:5));
  const wn=Object.keys(T_WARS).length;
  const bon=(k,lab)=>`<b style="color:${B[k]>=cap[k]?'#ffe07a':'#f6ecdf'}">+${B[k]}%</b> ${lab}`;
  return `<div class="pt-in" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px">
    <div style="flex:none;display:flex;flex-wrap:wrap;gap:4px">
        <span style="flex:1;min-width:0;display:flex;align-items:center;gap:6px;padding:4px 8px;border-radius:12px;background:rgba(14,10,7,.86);border:1px solid #d9a441">
          <span style="font-family:'Lilita One',sans-serif;font-size:18px;color:#ffe07a">${my.length}</span>
          <span style="font-size:11.5px;font-weight:900;line-height:1.15">territórios seus<br><span style="color:#ffcfb8">${wn} ${wn===1?'região':'regiões'} em guerra</span></span></span>
        <span aria-label="Bônus somado da sua guilda: ouro ${B.gold}%, XP ${B.xp}%, drop ${B.drop}%" style="flex:none;display:flex;flex-direction:column;justify-content:center;padding:4px 8px;border-radius:12px;background:rgba(14,10,7,.86);border:1px solid #d9a441;font-size:11px;font-weight:800;line-height:1.2;color:#c9b9a2"><span>${bon('gold','ouro')} · ${bon('xp','XP')}</span><span>${bon('drop','drop')} <span style="font-size:10px">(teto ${cap.gold}/${cap.xp}/${cap.drop})</span></span></span></div>

    <div style="position:relative;flex:1;min-height:0;border-radius:16px;overflow:hidden;border:2px solid #d9a441;box-shadow:inset 0 0 0 2px #5a3a12;background:#0d0a08">
      <div id="pt_map" class="x-scroll" style="position:absolute;inset:0;display:flex;flex-direction:column-reverse">
        <div style="position:relative;flex:none;width:100%;aspect-ratio:1136/2752;overflow:hidden">
          <div role="img" aria-label="Mapa-múndi das 9 eras dividido em territórios de guildas" style="position:absolute;inset:0;background-image:url(assets/map/world.jpg);background-size:135.21% 100%;background-position:50% 0;background-repeat:no-repeat"></div>
          ${flags.join('')}</div></div>
</div>
    <div aria-hidden="true" style="flex:none;display:flex;gap:10px;justify-content:center;padding:4px 8px;border-radius:10px;background:#1d1611;border:1px solid #4a3a2b;font-size:11px;font-weight:900;color:#e8dccb">
        <span style="display:flex;align-items:center;gap:4px"><i style="width:10px;height:10px;border-radius:50%;background:${T_GU[0].c};box-shadow:0 0 6px ${T_GU[0].c}"></i>Sua guilda</span>
        <span style="display:flex;align-items:center;gap:4px"><i style="width:10px;height:10px;border-radius:50%;background:#ff7a3a"></i>Em guerra</span><span>Toque numa região</span></div></div>`; }

function tSheet(st){ const G=tG(), T=G.DATA.territory, cap=XT.sel===99, r=XT.sel;
  const rows=cap?[{g:T_CAPOWN,capital:true}]:(T_OWN[r]||[]).map(g=>({g,capital:false}));
  const w=cap?null:T_WARS[r], ok=cap?tCanAtk(tRegions()-1):tCanAtk(r), med=tMedian();
  const need=cap?tRegions()-1:r;
  const head=cap?'CAPITAL · CENTRO DO MAPA':'REGIÃO · ERA '+r, name=cap?'Capital':tEra(r);
  const list=rows.map((x,k)=>{ const g=T_GU[x.g], m=x.capital?T.capitalMult:1, mine=!!g.me;
    const btn=mine?['Defender','pt-blue',T_SH]:ok?['Atacar','pt-red',T_SW]:['Atacar','pt-lock','M6 11 V8 A6 6 0 0 1 18 8 V11 M5 11 H19 V21 H5 Z'];
    return `<div class="pt-up" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:12px;background:${mine?'rgba(255,201,74,.1)':'#1d1611'};border:1px solid ${mine?'#ffc94a':'#4a3a2b'};animation-delay:${(k*0.05).toFixed(2)}s">
      ${tEmb(g.c,g.sym,34)}
      <span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.15;gap:2px">
        <span style="font-size:11px;font-weight:900;color:#e8c27a">${x.capital?'Capital (bônus ×'+T.capitalMult+')':'Território '+(k+1)}</span>
        <span style="font-size:13.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tEsc(g.name)}${mine?' (sua)':''}</span>
        <span style="display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:900;color:#c9b9a2;white-space:nowrap"><img src="assets/ui/coin.png" alt="" style="width:14px;height:14px">+${T.per.gold*m}% ouro · +${T.per.xp*m}% XP · <img src="assets/ui/chest.png" alt="" style="width:14px;height:14px">+${T.per.drop*m}% drop</span></span>
      <button data-x="act" data-i="${k}" class="pt-gold ${btn[1]}" aria-label="${btn[0]} ${x.capital?'a Capital':'o território '+(k+1)}" style="flex:none;min-height:46px;font-size:15px;padding:0 10px">${tIc(btn[2],18)}${btn[0]}</button></div>`; }).join('');
  const warBox=w!=null?`<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:12px;background:linear-gradient(90deg,#5a1a0a,#2a1208);border:2px solid #ff7a3a">${tIc(T_SW,24,'#ffcfb8')}<span style="flex:1;min-width:0;font-size:13px;font-weight:900;line-height:1.25">${T_GU[w].me?'Sua guilda está atacando esta região.':tEsc(T_GU[w].name)+' está atacando esta região.'}</span></div>`:'';
  const lock=ok?'':`<span style="font-size:12px;font-weight:900;color:#ffcfb8;line-height:1.3;text-align:center">Para atacar aqui, a mediana de era dos ${G.DATA.tourney.size} escalados precisa ser pelo menos Era ${need}. A da sua guilda é Era ${String(med).replace('.',',')}.</span>`;
  return `<div style="position:absolute;inset:0;z-index:30;background:rgba(8,6,4,.72);display:flex;align-items:flex-end">
    <button data-x="close" aria-label="Fechar" style="position:absolute;inset:0;border:0;padding:0;background:transparent"></button>
    <div role="dialog" aria-label="${tEsc(name)}" class="pt-up" style="position:relative;width:100%;max-height:88%;overflow-y:auto;border-radius:20px 20px 0 0;border:2px solid #d9a441;border-bottom:0;background:linear-gradient(180deg,#2a1d12,#16110d);padding:12px 12px max(14px,env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:8px"><span style="flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.05"><span style="font-size:11px;font-weight:900;color:#e8c27a;letter-spacing:.6px">${head}</span><span style="font-family:'Lilita One',sans-serif;font-size:25px;color:#fff">${tEsc(name)}</span></span>
        ${w!=null?'<span style="padding:3px 9px;border-radius:9px;background:#ff5a2a;color:#fff;font-size:12px;font-weight:900">Em guerra</span>':''}
        <button data-x="close" class="pt-gh" aria-label="Fechar" style="padding:0;width:44px">${tIc('M6 6 L18 18 M18 6 L6 18',18)}</button></div>
      <span style="font-family:'Lilita One',sans-serif;font-size:15px;color:#e8c27a">Bônus para todos os membros do dono</span>
      ${list}${warBox}${lock}
      <span style="font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3;text-align:center">Os ${G.DATA.tourney.size} escalados de cada guilda lutam em duelos automáticos. Vencer muda a cor do território. Teto somado: ouro +${T.cap.gold}%, XP +${T.cap.xp}%, drop +${T.cap.drop}%.</span></div></div>`; }

function tBattle(){ const G=tG(), N=G.DATA.tourney.size, r=Object.keys(T_WARS).map(Number).find(k=>T_GU[T_WARS[k]].me), reg=r==null?0:r, foe=tOwnerOf(reg), F=T_GU[0], Fo=T_GU[foe];
  const q=(names,g,right)=>`<span aria-hidden="true" style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;${right?'direction:rtl':''}">${names.slice(0,N).map((n,j)=>`<span title="${tEsc(n)}" class="${j===0?'pt-cur':''}" style="width:22px;height:22px;border-radius:6px;background:#0e0a07;border:1px solid ${g.c};overflow:hidden;position:relative"><span class="pt-head" style="position:absolute;left:-9px;top:-3px;width:40px;height:40px;filter:${right?Fo.hue:F.hue};${right?'transform:scaleX(-1)':''}"></span></span>`).join('')}</span>`;
  const side=(g,names,right)=>`<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;align-items:${right?'flex-end':'flex-start'}"><span style="display:flex;align-items:center;gap:5px;${right?'flex-direction:row-reverse':''}">${tEmb(g.c,g.sym,24)}<span style="font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100px">${tEsc(g.name)}</span></span>${q(names,g,right)}</div>`;
  const bg=reg<=6?'assets/bg/era'+reg+'.png':'assets/bg/era'+reg+'_ref.png', med=tMedian(), ok=tCanAtk(reg);
  return `<div class="pt-in" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px">
    <div style="flex:none;display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:14px;background:#1d1611;border:2px solid #4a3a2b">${side(F,T_NAMES,false)}
      <div style="flex:none;display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-family:'Lilita One',sans-serif;font-size:26px;color:#fff;line-height:1">VS</span><span style="font-size:10px;font-weight:900;color:#e8dccb;white-space:nowrap">Ataque · ${tEsc(tEra(reg))}</span><span style="font-size:10px;font-weight:900;color:#c9b9a2">${N} x ${N}</span></div>
      ${side(Fo,T_FOES,true)}</div>
    <div role="img" aria-label="Duelo de exemplo: ${tEsc(T_NAMES[0])} contra ${tEsc(T_FOES[0])}" style="position:relative;flex:1;min-height:150px;border-radius:16px;overflow:hidden;border:2px solid #6a4a1a;background:#2a1d12 url(${bg}) center/cover no-repeat">
      <span style="position:absolute;left:50%;top:8px;transform:translateX(-50%);padding:2px 10px;border-radius:9px;background:rgba(14,10,7,.82);font-size:12px;font-weight:900;white-space:nowrap">Os ${N} escalados de cada lado, em fila por FC</span>
      <span style="position:absolute;left:calc(20% - 6px);bottom:10%;width:96px;height:18px;border-radius:50%;background:radial-gradient(ellipse,${F.c}aa,transparent 70%)"></span>
      <span style="position:absolute;right:calc(20% - 6px);bottom:10%;width:96px;height:18px;border-radius:50%;background:radial-gradient(ellipse,${Fo.c}aa,transparent 70%)"></span>
      <div class="pt-kid" style="position:absolute;left:20%;bottom:10%;width:110px;height:110px;filter:${F.hue}"></div>
      <div style="position:absolute;right:20%;bottom:10%;width:110px;height:110px;transform:scaleX(-1)"><div class="pt-kid" style="position:absolute;inset:0;filter:${Fo.hue};animation-delay:-.4s"></div></div>
      <span class="pt-bdg" style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);font-family:'Lilita One',sans-serif;font-size:40px;color:#ffe07a;text-shadow:0 3px 0 #6a3a08,0 0 14px rgba(255,201,74,.8)">VS</span>
      <span style="position:absolute;left:6px;bottom:6px;padding:1px 6px;border-radius:6px;background:rgba(14,10,7,.82);font-size:11px;font-weight:900">${tEsc(T_NAMES[0])}</span>
      <span style="position:absolute;right:6px;bottom:6px;padding:1px 6px;border-radius:6px;background:rgba(14,10,7,.82);font-size:11px;font-weight:900">${tEsc(T_FOES[0])}</span></div>
    <div role="note" style="flex:none;display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:12px;background:#1d1611;border:1px solid #4a3a2b">${tIc(T_SW,20,'#ffe07a')}<span style="font-size:12px;font-weight:800;line-height:1.3;color:#e8dccb">Quem vence o duelo fica com a vida que sobrou e enfrenta o próximo. Ganha quem tiver o último lutador; no empate, o defensor fica. Mediana de era dos seus escalados: Era ${String(med).replace('.',',')}${ok?'':' (abaixo do exigido aqui)'}.</span></div>
    <div style="flex:none;display:flex;gap:8px">
      <button data-x="start" class="pt-gold ${ok?'pt-red pt-pulse':'pt-lock'}" style="flex:1">${tIc(T_SW,22)}Começar o ataque</button>
      <button data-x="tab" data-i="0" class="pt-gh" aria-label="Voltar ao mapa" style="flex:none;width:54px">${tIc(T_MAPI,22)}</button></div></div>`; }

function tRank(){ const G=tG(), all=tRanking(), pages=Math.max(1,Math.ceil(all.length/T_PER)), page=Math.min(XT.page,pages-1), myIdx=Math.max(0,all.findIndex(g=>g.me)), me=all[myIdx], above=myIdx>0?all[myIdx-1]:null;
  const RC=['#ffc94a','#e8e2d8','#e8a26a','#4aa3ff','#8a7a68'];
  const bands=G.DATA.tourney.rewards.map((b,k)=>{ const my=myIdx+1>=b.from&&myIdx+1<=b.to, t=b.from===b.to?b.from+'º':b.from+'º-'+b.to+'º', rw=G.tourneyReward(b.from);
    return `<div role="listitem" aria-label="Posição ${t}: ${rw.coin} ${tEsc(G.DATA.coin)}${rw.prism?', '+rw.prism+' fragmentos do Prismático':''}${rw.frame?', moldura de guilda':''}${my?', faixa atual da sua guilda':''}" class="pt-up" style="min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 2px;border-radius:10px;background:#1d1611;border:2px solid ${my?RC[k]:'#3a2c1f'};${my?'box-shadow:0 0 10px '+RC[k]:''};animation-delay:${(k*0.06).toFixed(2)}s">
      <b style="font-family:'Lilita One',sans-serif;font-weight:400;font-size:15px;color:${RC[k]}">${t}</b>
      ${rw.prism?`<img src="assets/pets/prism_fox_mid.png" alt="" style="width:30px;height:30px;object-fit:contain">`:tCoinIc(28)}
      <span style="font-size:11px;font-weight:900;white-space:nowrap">${rw.prism?rw.prism+' frag.':rw.coin+' '}${rw.prism?'':tCoinIc(12)}</span>
      <span style="font-size:10px;font-weight:800;color:#c9b9a2;white-space:nowrap">${rw.prism?'+ '+rw.coin+' ':''}${rw.prism?tCoinIc(11):tEsc(G.DATA.coin)}${rw.frame?' + moldura':''}</span></div>`; }).join('');
  const rows=all.slice(page*T_PER,page*T_PER+T_PER).map((g,j)=>{ const rk=page*T_PER+j;
    return `<div class="pt-up" style="flex:none;display:grid;grid-template-columns:30px 36px 1fr auto;align-items:center;gap:8px;min-height:52px;padding:4px 8px;border-radius:12px;background:${g.me?'rgba(255,201,74,.1)':'#1d1611'};border:1px solid ${g.me?'#ffc94a':'#3a2c1f'};animation-delay:${(j*0.05).toFixed(2)}s">
      <span style="font-family:'Lilita One',sans-serif;font-size:17px;color:${rk<3?RC[rk]:'#c9b9a2'};text-align:center">${rk+1}</span>${tEmb(g.c,g.sym,34)}
      <span style="min-width:0;display:flex;flex-direction:column;line-height:1.15;gap:2px"><span style="font-size:13.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tEsc(g.name)}</span><span style="font-size:11px;font-weight:800;color:#c9b9a2;white-space:nowrap">Nv. ${g.lv} · ${G.memberCap(g.lv)} vagas · FC ${tFC(g.pow)}</span></span>
      <span style="display:flex;flex-direction:column;align-items:flex-end;gap:2px"><span aria-hidden="true" style="display:flex;gap:2px">${Array.from({length:Math.min(g.ter,8)},()=>`<i style="width:7px;height:10px;border-radius:1px 1px 3px 3px;background:${g.c}"></i>`).join('')}</span>
        <span style="font-family:'Lilita One',sans-serif;font-size:14px;color:#ffe07a;white-space:nowrap">${XT.rk===0?g.ter+(g.ter===1?' território':' territórios'):tFC(g.pow)}</span></span></div>`; }).join('');
  const gap=above?(XT.rk===0?(above.ter>me.ter?'Faltam '+(above.ter-me.ter)+' território(s) para passar '+above.name:'Empate em territórios, desempate pelo poder'):'Faltam '+tFC(above.pow-me.pow)+' de poder para passar '+above.name):'Sua guilda lidera a temporada';
  const pb=(a,lab,d,on)=>`<button data-x="${a}" class="pt-gh" aria-label="${lab}" aria-disabled="${!on}" style="padding:0;width:44px">${tIc(d,20)}</button>`;
  return `<div class="pt-in" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:6px">
    <div role="group" aria-label="Ordenar ranking" style="flex:none;display:flex;gap:4px"><button data-x="rk" data-i="0" class="pt-gh" aria-pressed="${XT.rk===0}" style="flex:1">Territórios</button><button data-x="rk" data-i="1" class="pt-gh" aria-pressed="${XT.rk===1}" style="flex:1">Poder total</button></div>
    <div role="list" aria-label="Faixas de prêmio da temporada" style="flex:none;display:grid;grid-template-columns:repeat(${G.DATA.tourney.rewards.length},minmax(0,1fr));gap:4px">${bands}</div>
    <span style="flex:none;font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3">Prêmios para cada membro que lutou ou estava escalado. Faixa pela posição no fim da temporada.</span>
    <div class="x-scroll" style="flex:1;min-height:0;display:flex;flex-direction:column;gap:4px">${rows}</div>
    <div style="flex:none;display:flex;align-items:center;justify-content:center;gap:8px">${pb('prev','Página anterior','M15 18 L9 12 L15 6',page>0)}<span style="min-width:110px;text-align:center;font-size:12px;font-weight:900;color:#c9b9a2">Página ${page+1}/${pages}</span>${pb('next','Próxima página','M9 18 L15 12 L9 6',page<pages-1)}</div>
    <button data-x="mine" aria-label="Sua guilda está em ${myIdx+1}º. Ir para a página dela" style="flex:none;display:grid;grid-template-columns:30px 36px 1fr auto;align-items:center;gap:8px;min-height:56px;padding:4px 8px;border-radius:12px;background:rgba(255,201,74,.12);border:2px solid #ffc94a;color:#f6ecdf;text-align:left">
      <span style="font-family:'Lilita One',sans-serif;font-size:18px;color:#ffc94a;text-align:center">${myIdx+1}º</span>${tEmb(me.c,me.sym,34)}
      <span style="min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:13.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Sua guilda · ${tEsc(me.name)}</span><span style="font-size:11.5px;font-weight:900;color:#7ef08a">${tEsc(gap)}</span></span>
      <span style="font-family:'Lilita One',sans-serif;font-size:15px;color:#ffe07a;white-space:nowrap">${XT.rk===0?me.ter+' terr.':tFC(me.pow)}</span></button></div>`; }

function scrTourney(){
  tInject();
  const d=xDims(T_MINH);
  if(!tG()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Torneio do Poder indisponível agora.</div>`); XT.sig='x'; return; }
  const st=tStatus();
  const mp=typeof document!=='undefined'&&document.getElementById?document.getElementById('pt_map'):null; if(mp) XT.mapTop=mp.scrollTop;
  const body=XT.tab===1?tBattle():XT.tab===2?tRank():tMap();
  const sheet=XT.tab===0&&XT.sel>=0?tSheet(st):'';
  const toast=XT.toast?`<div role="status" class="pt-up" style="position:absolute;left:50%;top:58px;transform:translateX(-50%);z-index:40;max-width:92%;padding:8px 14px;border-radius:12px;background:#13314f;border:2px solid #4aa3ff;font-size:13px;font-weight:900;text-align:center;box-shadow:0 6px 16px rgba(0,0,0,.5)">${tEsc(XT.toast)}</div>`:'';
  V.innerHTML=xWrap(d,XT.anim?'f-in':'',`<div style="position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;padding:8px 12px max(10px,env(safe-area-inset-bottom));box-sizing:border-box;background:radial-gradient(ellipse at 50% 10%,#3a2414 0%,#1d1611 45%,#16110d 80%)">
    ${tBanner(st)}${tTabs()}${body}${sheet}${toast}</div>`);
  if(XT.tab===0&&XT.mapTop!=null&&typeof document!=='undefined'&&document.getElementById){ const m2=document.getElementById('pt_map'); if(m2) m2.scrollTop=XT.mapTop; }
  XT.anim=false; XT.sig=tSig(st);
}
/* assinatura do que muda por fora (módulo ligado, servidor, nível): o tick redesenha só quando ela muda */
function tSig(st){ const s=st||tStatus(), Z=tSeason(); return [s.on,s.open,s.reason,s.needLevel,Z?Z.left:''].join('|'); }
function tSoon(t){ XT.toast=t||'Em breve: abre com o online'; XT.toastT=Date.now(); render(); }
function tClick(b){
  const a=b.dataset.x, i=Number(b.dataset.i);
  if(a==='tab'){ if(XT.tab===i) return; tSnd('ui_tap'); XT.tab=i; XT.sel=-1; render(); }
  else if(a==='reg'){ tSnd('ui_tap'); XT.sel=i; render(); }
  else if(a==='close'){ tSnd('ui_tap'); XT.sel=-1; render(); }
  else if(a==='act'){ tSnd('ui_tap'); const cap=XT.sel===99, r=cap?tRegions()-1:XT.sel, own=cap?T_CAPOWN:(T_OWN[XT.sel]||[])[i], mine=T_GU[own]&&T_GU[own].me;
    if(!mine&&!tCanAtk(r)) tSoon('Mediana de era dos escalados abaixo da Era '+r+'. Em breve: abre com o online'); else tSoon(); }
  else if(a==='start'){ tSnd('ui_tap'); tSoon(); }
  else if(a==='rk'){ if(XT.rk===i) return; tSnd('ui_tap'); XT.rk=i; XT.page=0; render(); }
  else if(a==='prev'){ if(XT.page<=0) return tSoon('Você já está na primeira página'); tSnd('ui_tap'); XT.page--; render(); }
  else if(a==='next'){ const pages=Math.ceil(tRanking().length/T_PER); if(XT.page>=pages-1) return tSoon('Você já está na última página'); tSnd('ui_tap'); XT.page++; render(); }
  else if(a==='mine'){ tSnd('ui_tap'); XT.page=Math.floor(Math.max(0,tRanking().findIndex(g=>g.me))/T_PER); render(); }
}

Panels.add('tourney',{title:'Torneio do Poder',render:scrTourney,click:tClick,
  tick(){ if(!tG()) return; if(XT.toast&&Date.now()-XT.toastT>2600){ XT.toast=''; render(); return; } if(XT.sig&&tSig()!==XT.sig) render(); },
  busy(){ return false; },
  onOpen(o){ XT.tab=o&&typeof o.tab==='number'?Math.max(0,Math.min(2,o.tab)):0; XT.sel=-1; XT.page=0; XT.toast=''; XT.anim=true; XT.mapTop=null; },
  onClose(){ XT.sel=-1; XT.toast=''; } });
