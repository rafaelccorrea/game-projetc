// PROPOSTA DE DIFICULDADE (fps-69, 13/11): FC recomendada por fase com PAREDES, simulada em 180 dias.
// Uso: node tools/sim-paredes.js   (só lê js/sys; não liga nada). Saída: tabela para docs/PROPOSTA_DIFICULDADE.md
// Ideia: a FC do jogador só cresce com o tempo (XP por dia, Forja, raridade, pet, montaria, coleção). A FC pedida em cada fase é a FC que o
// jogador GRÁTIS ATIVO terá no dia-alvo dessa fase. Nas fases normais o dia-alvo anda rápido; no chefe do meio (fase 5) e no Senhor da Era (fase 10)
// ele pula W dias: é a parede. VIP cresce mais rápido e passa antes; quem não forja nem evolui o pet cresce devagar e TRAVA.
'use strict';
const R=p=>require(process.cwd()+'/js/sys/'+p+'.js');
const FG=R('forge'), ST=R('stats'), FC=R('fc'), LV=R('level'), VIP=R('vip'), MO=R('mount'), TI=R('titles');
ST.setEra9(true); LV.setCap120(true); LV.setKillCap(true); MO.setStarFlat(true);   // como o dono aprovou: nível 120 (1-100 de hoje), teto de XP de abate, montaria +2-3% por estrela
const LIN=[1,12,25,40,55,70,85,100,110], LOUT=[12,25,40,55,70,85,100,110,120];
const eraOfLevel=L=>{ let e=0; for(let i=0;i<9;i++) if(L>=LIN[i]) e=i; return e; };
const KILL=[3663,3180,3024,3934,3909,4854,4846,4842,5799], M={offline:160,missions:230,inst:320}, CAP={mid:0.3,over:0.1};
const capKill=(raw,e)=>{ const t=KILL[e]; return Math.min(raw,t)+CAP.mid*Math.max(0,Math.min(raw,2*t)-t)+CAP.over*Math.max(0,raw-2*t); };
const VT=VIP.DATA.table, X=LV.DATA.xpToNext;
function dayXp(e,L,o){ const v=o.vip||0, xpP=1+(VT.xp9[v]||0)/100, speed=v>=5&&L>=40?4:(v>=1||L>=15)?2:1;
  return capKill(KILL[e]*(L<15?1:Math.min(speed,4)/2),e)*xpP+(M.offline+M.missions+M.inst*(v>=1?1.5:1))*(1+e)*xpP; }
const capR=(L,e)=>L>=105&&e>=7?5:L>=85&&e>=5?4:L>=70&&e>=4?3:L>=25?2:L>=10?1:0, forgeAt=e=>Math.min(15,Math.round(2+1.6*e));
function baseFc(L,e,r,forge,qp){ const S={sys:{level:{lvl:L,xp:0},forge:{lv:{}}}}; for(const s of ST.DATA.slots) S.sys.forge.lv[s]=forge;
  const eq={}; for(const s of ST.DATA.slots){ if(s==='wing'&&(L<50||r<2)) continue; eq[s]={slot:s,e,r:s==='weapon'&&r===3?2:r,lvl:L,subs:[],qp,wing:'angel'}; }
  const h={equipped:()=>eq,eraMax:()=>e,level:()=>L,atk:()=>0,hp:()=>0,now:()=>0}; return Math.round(FC.compute(S,h)); }
const titlesPct=d=>{ let a=0; for(const t of TI.DATA.titles) a+=(t.bonus&&t.bonus.atkPct)||0; return a*Math.min(0.7,d/180*0.7); };
/* pet: parte da FC pela era; com a evolução valendo na hora (Sys.pet.setStageMult): x0,8 filhote, x0,9 adulto (pet Nv 30), x1 evoluído (pet Nv 60).
   O ativo evolui quando o pet chega lá (~nível 40 e 70 do jogador); o preguiçoso não evolui (fica no filhote) e alimenta pouco. */
const petStageM=(L,lazy)=>lazy?0.8:L<40?0.8:L<70?0.9:1;
const petShare=(L,e,lazy)=>L<20?0:[0.08,0.11,0.11,0.14,0.17,0.17,0.17,0.17,0.20][e]*Math.min(1,(L-20)/40+0.3)*(lazy?0.45:1)*petStageM(L,lazy);   // sem evoluir: pet no 1º estágio
const mountPct=(L,d,pay,lazy)=>{ if(!pay&&L<38) return 0; const id=pay?'wolf':(L>=85?'griffin':'horse'), st=lazy?1:Math.min(5,1+Math.floor((pay?d:Math.max(0,d-20))/25)); return MO.pctOf(id,Math.min(60,Math.floor(L/2)),st); };
const guildPct=d=>Math.min(5,d<12?0:(d-12)/90*5);
// FC do jogador por dia (sem trava de fase: a XP do dia não depende de passar de fase; ver ressalva no relatório)
const STEP=0.05;
function levels(o){ let L=1,xp=0; const out=[]; for(let i=0;i<=400/STEP;i++){ out.push(L); xp+=dayXp(eraOfLevel(L),L,o)*STEP; while(L<120&&xp>=X[L-1]){ xp-=X[L-1]; L++; } } return out; }
const memo=new Map();
function fcNow(o,LS,t,eCap){ const i=Math.min(LS.length-1,Math.round(t/STEP)), L=LS[i], d=Math.max(1,t), key=(o.vip||0)+'|'+(o.lazy?1:0)+'|'+L+'|'+eCap+'|'+Math.floor(d);
  if(memo.has(key)) return memo.get(key);
  /* equipamento da era da FASE (cai dos inimigos dela), não do nível; a raridade continua presa ao nível (capR) */
  const e=eCap, f=Math.max(0,Math.min(1,(L-LIN[e])/Math.max(1,LOUT[e]-LIN[e])));
  const r=o.lazy?Math.min(capR(L,e),2):capR(L,e);
  const forge=o.lazy?0:Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
  const pct=1+(titlesPct(d)+mountPct(L,d,!!o.vip,o.lazy)+guildPct(d)+(VT.atk[o.vip||0]||0))/100;
  const v=baseFc(L,e,r,forge,o.vip?6000:4000)*pct/(1-petShare(L,e,o.lazy)); memo.set(key,v); return v; }
function curve(o){ const LS=levels(o); return {o,LS,at:(t,eCap)=>fcNow(o,LS,t,eCap),L:t=>LS[Math.min(LS.length-1,Math.round(t/STEP))]}; }
function curveOld(o){ let L=1,xp=0; const out=[0];
  for(let d=1;d<=400;d++){ xp+=dayXp(eraOfLevel(L),L,o); while(L<120&&xp>=X[L-1]){ xp-=X[L-1]; L++; }
    const e=eraOfLevel(L), f=(L-LIN[e])/Math.max(1,LOUT[e]-LIN[e]);
    const r=o.lazy?Math.min(capR(L,e),2):capR(L,e);                                       // preguiçoso: não troca para raridade alta (não funde)
    const forge=o.lazy?0:Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
    const pct=1+(titlesPct(d)+mountPct(L,d,!!o.vip,o.lazy)+guildPct(d)+(VT.atk[o.vip||0]||0))/100;
    out.push({d,L,e,fc:baseFc(L,e,r,forge,o.vip?6000:4000)*pct/(1-petShare(L,e,o.lazy))}); }
  return out; }
const free=curve({}), vip5=curve({vip:5}), vip10=curve({vip:10}), lazy=curve({lazy:true});
const fcAt=(C,t,eCap)=>C.at(Math.max(0,t),eCap==null?8:eCap);

// ---- calendário-alvo do grátis ativo (fim de cada era, dias) e PAREDES (dias de espera no chefe do meio e no Senhor da Era) ----
const END=[1,3,10,22,40,65,97,135,179];
const WB=[0.1,1,2,2.5,3,3,3,3,3], WM=[0,0,0.5,1,1,1.5,1.5,1.5,1.5];
const plan=[]; let t=0;
for(let e=0;e<9;e++){ const D=END[e]-(e?END[e-1]:0), norm=Math.max(0,D-WB[e]-WM[e])/8;
  for(let s=1;s<=10;s++){ const w=s===10?WB[e]:s===5?WM[e]:norm; t+=w; plan.push({stage:e*10+s,e,s,wall:s===10?'Senhor da Era':s===5&&WM[e]>0?'chefe do meio':'',days:w,target:t,rec:fcAt(free,t,e)}); } }
// ---- jogar: passa a fase no 1º momento (passo de 0,05 dia) em que FC >= 100% da recomendada ----
function play(C){ let i=0, now=0; const pass=[]; while(i<plan.length&&now<400){ if(fcAt(C,now,plan[i].e)>=plan[i].rec){ pass.push(now); i++; } else now+=0.05; }
  return {pass,done:i,stuck:plan.map((p,j)=>pass[j]!=null?pass[j]-(j?pass[j-1]:0):null)}; }
/* DONO (13/11): o VIP também sente a parede em TODA era: no Senhor da Era das eras 1-8 a FC pedida é a maior entre a do grátis e a que o VIP 5 / VIP 10
   terá MIN_VIP_WALL dia depois de chegar. Repete até estabilizar (subir uma parede atrasa a chegada nas seguintes). */
const MIN_VIP_WALL=0.5;
for(let it=0;it<20;it++){ let moved=false;
  for(const C of [vip5,vip10]){ const p=play(C); for(let e=1;e<9;e++){ const j=e*10+9, arr=p.pass[j-1]; if(arr==null||p.pass[j]==null) continue;
    if(p.pass[j]-arr<MIN_VIP_WALL-0.051){ const need=fcAt(C,arr+MIN_VIP_WALL,e)*1.002; if(need>plan[j].rec*1.0001){ plan[j].rec=need; moved=true; } } } }
  if(!moved) break; }
const P={free:play(free),vip5:play(vip5),vip10:play(vip10),lazy:play(lazy)};
const f1=v=>v==null?'—':v<1?(Math.round(v*24)+' h'):(v.toFixed(1).replace('.',',')+' d');
const ab=v=>ST.abbr(v);
console.log('## Paredes por era (grátis ativo; tempo na parede = espera até ter a FC)');
console.log('| Era | Fim da era (grátis · VIP 5 · VIP 10 · sem forjar/pet) | Chefe do meio: FC ao chegar / pedida · espera grátis | Senhor da Era: FC ao chegar / pedida · espera grátis · VIP 5 · VIP 10 |');
console.log('|---|---|---|---|');
for(let e=0;e<9;e++){ const iM=e*10+4, iB=e*10+9, endD=k=>P[k].pass[iB]!=null?Math.ceil(P[k].pass[iB]):'trava';
  const arr=(k,i)=>{ const tt=i?P[k].pass[i-1]:0; return tt==null?null:fcAt(k==='free'?free:k==='vip5'?vip5:k==='vip10'?vip10:lazy,tt,plan[i].e)/plan[i].rec; };
  const m=WM[e]>0?Math.round(arr('free',iM)*100)+'% · '+f1(P.free.stuck[iM]):'—';
  console.log('| '+e+' | '+[endD('free'),endD('vip5'),endD('vip10'),endD('lazy')].join(' · ')+' | '+m+' | '+Math.round(arr('free',iB)*100)+'% · '+f1(P.free.stuck[iB])+' · '+f1(P.vip5.stuck[iB])+' · '+f1(P.vip10.stuck[iB])+' |'); }
for(const k of ['free','vip5','vip10','lazy']){ const p=P[k], last=p.pass[p.done-1]||0, n=Math.ceil(last);
  const below=[]; for(let d=1;d<=Math.min(180,Math.max(n,180));d++){ const i=p.pass.findIndex(x=>x>d); if(i<0) break; if(fcAt(k==='free'?free:k==='vip5'?vip5:k==='vip10'?vip10:lazy,d,plan[i].e)<0.9*plan[i].rec) below.push(d); }
  const daysOnWall=plan.reduce((a,pl,j)=>a+(pl.wall&&p.stuck[j]!=null?p.stuck[j]:0),0);
  console.log(k+': fases vencidas '+p.done+'/90'+(p.done<90?' (TRAVA na fase '+(p.done+1)+', era '+plan[p.done].e+')':'')+' · fim no dia '+(p.done===90?Math.ceil(last):'—')+' · dias em parede '+daysOnWall.toFixed(0)+' · dias abaixo de 90% da FC pedida (até o dia 180): '+below.length); }
console.log('\n## FC pedida (amostra) — fases 1, 5, 9, 10 de cada era');
for(let e=0;e<9;e++) console.log('era '+e+': '+[1,5,9,10].map(s=>'f'+s+' '+ab(plan[e*10+s-1].rec)).join(' · '));
// ---- de onde vem a FC para vencer a parede: ganho de cada ação no meio de cada era (grátis ativo) ----
console.log('\n## Quanto cada ação dá (% da FC do grátis no Senhor da Era)');
for(const e of [1,3,5,7,8]){ const day=END[e]-0.5, L=free.L(day), e2=e, f=(L-LIN[e2])/Math.max(1,LOUT[e2]-LIN[e2]), r=capR(L,e2), fg=Math.round(forgeAt(Math.max(0,e2-1))+(forgeAt(e2)-forgeAt(Math.max(0,e2-1)))*f);
  const b=baseFc(L,e2,r,fg,4000), g=(x)=>Math.round((x/b-1)*1000)/10;
  const rar=r<5?g(baseFc(L,e2,r+1,fg,4000)):null, f1_=g(baseFc(L,e2,r,fg+1,4000)), f2=g(baseFc(L,e2,r,fg+2,4000)), q=g(baseFc(L,e2,r,fg,6000)), lv=g(baseFc(Math.min(120,L+1),e2,r,fg,4000));
  const ps=petShare(L,e2,false), petEvo=Math.round((1/(1-ps)/(1/(1-ps*0.45/1))-1)*1000)/10;
  const m1=Math.round((MO.pctOf('horse',Math.min(60,Math.floor(L/2)),3)-MO.pctOf('horse',Math.min(60,Math.floor(L/2)),2))*10)/10;
  console.log('era '+e2+' (dia '+day+', Nv '+L+', raridade '+r+', Forja +'+fg+'): raridade +1 em tudo '+(rar==null?'—':'+'+rar+'%')+' · Forja +1 em tudo +'+f1_+'% · Forja +2 +'+f2+'% · qualidade 3★→4★ +'+q+'% · nível +1 +'+lv+'% · pet 1º→3º estágio +'+petEvo+'% · montaria +1★ +'+m1+'% · skin na coleção +0,5% · título +1 a +6%'); }

// ---- saída para o docs/balance.json (bloco dificuldade): FC pedida das 90 fases, paredes e calendário ----
if(process.argv.includes("--json")) console.log("JSON "+JSON.stringify({recFc:plan.map(p=>Number(p.rec.toPrecision(3))),wallBossDays:WB,wallMidDays:WM,eraEndDay:END}));
if(process.argv.includes('--dbg')){ const p=play(vip10), j=59; console.log('vip10 era5 chega',p.pass[j-1],'passa',p.pass[j],'rec',plan[j].rec,'fc chegada',fcAt(vip10,p.pass[j-1],5),'fc +0,5',fcAt(vip10,p.pass[j-1]+0.5,5),'L',vip10.L(p.pass[j-1]),vip10.L(p.pass[j-1]+0.5)); }
