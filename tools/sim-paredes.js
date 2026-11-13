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
/* PACOTE DAS ÚLTIMAS ERAS (--late, dono 13/11: paredes das eras 5-8 em 3-5 dias): Forja +16 a +20, Divino mais cedo (Torre/evento, Nv 95 na era 6), títulos das eras 5-8,
   montaria 6 e 7 estrelas, pet Nv 91-120. Sem sorteio pago e sem compra de poder. */
const LATE=process.argv.includes('--late');
if(LATE){ FG.DATA.max=20; FG.DATA.bonus.push(1.05,1.17,1.29,1.41,1.53); }
const lateTitles=(d,e)=>LATE?Math.max(0,Math.min(8,(e-4)*2))*3:0;   // 8 títulos de +3% ATQ e VIDA, 2 por era a partir da era 5 (pelo PROGRESSO)
const lateMount=(d,lazy,e)=>LATE&&!lazy?((e>=7?2.75:0)+(e>=8?2.75:0)):0;   // pelo PROGRESSO: 6ª estrela na era 7, 7ª na era 8 (o VIP chega antes e ganha antes)   // montaria 6ª e 7ª estrelas (dono aprovou 13/11; fragmentos jogando, sem compra)
/* TREINO DE ERA (PO 13/11): abre no Nv 100 (eras 7-8); cada dia de treino feito soma TRAIN_DAY pontos de ATQ e VIDA, teto TRAIN_CAP. Todo jogador ativo treina 1x por dia. */
const TRAIN_LVL=90;   // abre ao chegar na era 7 (o grátis entra nela por volta do Nv 90)
const TRAIN_DAY=+((process.argv.find(a=>a.startsWith('--train='))||'--train=1.5').split('=')[1]), TRAIN_CAP=+((process.argv.find(a=>a.startsWith('--traincap='))||'--traincap=120').split('=')[1]);   // 6ª e 7ª estrelas (+2,75% cada)
const latePet=(L,lazy)=>LATE&&!lazy&&L>=100?1+0.25*Math.min(1,(L-100)/20):1;   // pet Nv 91-120: parte do pet até +25%
const capR=(L,e)=>LATE&&L>=95&&e>=6?5:L>=105&&e>=7?5:L>=85&&e>=5?4:L>=70&&e>=4?3:L>=25?2:L>=10?1:0, forgeAt=e=>LATE?Math.min(20,Math.round(2+1.6*e+(e>=5?(e-4)*0.9:0))):Math.min(15,Math.round(2+1.6*e));
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
  if(LS.t100==null){ const k=LS.findIndex(x=>x>=TRAIN_LVL); LS.t100=k<0?1e9:k*STEP; }
  const TMUL=process.argv.includes('--trainmul'), tdays=LATE&&!o.lazy&&eCap>=7?Math.max(0,Math.floor(t-LS.t100)):0;
  const train=TMUL?0:Math.min(TRAIN_CAP,TRAIN_DAY*tdays), trainMul=TMUL?Math.min(1+TRAIN_CAP/100,Math.pow(1+TRAIN_DAY/100,tdays)):1;
  if(memo.has(key)) return memo.get(key);
  /* equipamento da era da FASE (cai dos inimigos dela), não do nível; a raridade continua presa ao nível (capR) */
  const e=eCap, f=Math.max(0,Math.min(1,(L-LIN[e])/Math.max(1,LOUT[e]-LIN[e])));
  const r=o.lazy?Math.min(capR(L,e),2):capR(L,e);
  const forge=o.lazy?0:Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
  const pct=1+(titlesPct(d)+lateTitles(d,eCap)+lateMount(d,o.lazy,eCap)+train+mountPct(L,d,!!o.vip,o.lazy)+guildPct(d)+(VT.atk[o.vip||0]||0))/100;
  const v=baseFc(L,e,r,forge,o.vip?6000:4000)*pct*trainMul/(1-Math.min(0.3,petShare(L,e,o.lazy)*latePet(L,o.lazy))); memo.set(key,v); return v; }
function curve(o){ const LS=levels(o); return {o,LS,at:(t,eCap)=>fcNow(o,LS,t,eCap),L:t=>LS[Math.min(LS.length-1,Math.round(t/STEP))]}; }
function curveOld(o){ let L=1,xp=0; const out=[0];
  for(let d=1;d<=400;d++){ xp+=dayXp(eraOfLevel(L),L,o); while(L<120&&xp>=X[L-1]){ xp-=X[L-1]; L++; }
    const e=eraOfLevel(L), f=(L-LIN[e])/Math.max(1,LOUT[e]-LIN[e]);
    const r=o.lazy?Math.min(capR(L,e),2):capR(L,e);                                       // preguiçoso: não troca para raridade alta (não funde)
    const forge=o.lazy?0:Math.round(forgeAt(Math.max(0,e-1))+(forgeAt(e)-forgeAt(Math.max(0,e-1)))*f);
    const pct=1+(titlesPct(d)+lateTitles(d,eCap)+lateMount(d,o.lazy,eCap)+mountPct(L,d,!!o.vip,o.lazy)+guildPct(d)+(VT.atk[o.vip||0]||0))/100;
    out.push({d,L,e,fc:baseFc(L,e,r,forge,o.vip?6000:4000)*pct/(1-petShare(L,e,o.lazy))}); }
  return out; }
const free=curve({}), vip5=curve({vip:5}), vip10=curve({vip:10}), lazy=curve({lazy:true});
const fcAt=(C,t,eCap)=>C.at(Math.max(0,t),eCap==null?8:eCap);

// ---- calendário-alvo do grátis ativo (fim de cada era, dias) e PAREDES (dias de espera no chefe do meio e no Senhor da Era) ----
const END=[1,3,10,22,40,65,97,135,179];
const WB=[0.1,1,2,2.5,3,3,3,3,3], WM=[0,0,0.5,1,1,1.5,1.5,1.5,1.5];
/* PAREDES PELA RAZÃO DE FC (13/11, depois da medida no jogo): pelo modelo da luta, chegar com 97% ainda vence ~95%; parede de verdade = chegar com ~83%.
   Senhor da Era: pede 1,2× a FC com que o grátis CHEGA nele; chefe do meio: 1,1×. As outras fases seguem o calendário (dia-alvo × c). c é ajustado para o
   grátis terminar no dia ~180. O tempo de cada parede SAI do crescimento da FC (não é mais escolhido). */
/* razão por era: o 1º Senhor é suave (jogador novo), cresce até 1,15 da era 2 em diante (chegar com 87% = ~1 em 4 vence) */
const STEP_MAX=1.3;
const WR_BOSS=LATE?[1.06,1.1,1.15,1.15,1.15,1.1,1.1,1.1,1.1]:[1.06,1.1,1.15,1.15,1.15,1.15,1.15,1.15,1.15], WR_MID=LATE?1.05:1.07;
function buildPlan(c){ const out=[]; let t=0, now=0;
  for(let e=0;e<9;e++){ const D=(END[e]-(e?END[e-1]:0))*c;
    for(let s=1;s<=10;s++){ t+=D/10; const wall=s===10?'Senhor da Era':(s===5&&e>=2)?'chefe do meio':''; let rec=fcAt(free,t,e);
      if(wall){ rec=Math.max(rec,fcAt(free,now,e)*(s===10?WR_BOSS[e]:WR_MID)); }
      else if(s>1&&out.length){ rec=Math.min(rec,out[out.length-1].rec*STEP_MAX); }   /* fase normal: no máximo 1,3x a anterior (sem salto dentro da era quando abre raridade nova) */
      let tp=now; while(tp<400&&fcAt(free,tp,e)<rec) tp+=0.05; now=tp;
      out.push({stage:e*10+s,e,s,wall,days:0,target:t,rec}); } }
  return {out,end:now}; }
let plan; { let lo=0.3, hi=1.2; for(let k=0;k<18;k++){ const m=(lo+hi)/2, r=buildPlan(m); if(r.end>180) hi=m; else lo=m; } plan=buildPlan(lo).out; console.log('calendário comprimido x'+lo.toFixed(3)); }
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
  console.log(k+': fases vencidas '+p.done+'/90'+(p.done<90?' (TRAVA na fase '+(p.done+1)+', era '+plan[p.done].e+')':'')+' · termina as 9 eras no dia '+(p.done===90?Math.ceil(last):'—')+' · dias em parede '+daysOnWall.toFixed(0)+' · dias abaixo de 90% da FC pedida (até o dia 180): '+below.length); }
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
// ---- ESCALA DO JOGO (13/11, medida do Engenheiro: jogador novo tem FC 260, a fase 1 pedia 947) ----
// A forma das paredes vem da simulação; a ESCALA vem do jogo: fase 1 = 80% da FC de quem começa (REC_FC0 = 264 → 210);
// Senhor da Era e = a FC medida/estimada com que o grátis chega a ele no jogo (docs/balance.json tower.fc_mediana_do_gratis_no_fim_de_cada_era)
// × a parede da simulação (pedida ÷ FC ao chegar). Entre âncoras: interpolação geométrica do fator por fase.
const BALJ=JSON.parse(require('fs').readFileSync(process.cwd()+'/docs/balance.json','utf8')), MED=BALJ.tower.fc_mediana_do_gratis_no_fim_de_cada_era;
const START_GAME=210;
/* fator CONSTANTE por era (mantém a forma da simulação dentro da era, inclusive a parede do Senhor):
   k_e = FC com que o grátis chega ao Senhor da Era e no jogo ÷ a mesma FC na simulação. Era 0: subida suave de 210 até chegar ao Senhor. */
const kEra=[]; for(let e=0;e<9;e++){ const j=e*10+9, arr=P.free.pass[j-1]!=null?fcAt(free,P.free.pass[j-1],e):plan[j].rec; kEra.push(MED[e]/arr); }
const recGame=plan.map((p,i)=>Number((p.rec*kEra[Math.floor(i/10)]).toPrecision(3)));
{ const arr0=MED[0], wall0=plan[9].rec/(P.free.pass[8]!=null?fcAt(free,P.free.pass[8],0):plan[9].rec);
  for(let s1=1;s1<=9;s1++) recGame[s1-1]=Number((START_GAME*Math.pow(arr0/START_GAME,(s1-1)/8)).toPrecision(3));
  recGame[9]=Number((arr0*Math.max(WR_BOSS[0],wall0)).toPrecision(3)); }   // 1º Senhor da Era: a primeira parede (no mínimo +15%)
if(process.argv.includes('--game')){ const ab2=v=>ST.abbr(v);
  console.log('\n## FC pedida NA ESCALA DO JOGO (fase 1, 5, 9, 10 de cada era) — a parede é a razão f10/f9');
  for(let e=0;e<9;e++){ const g=s=>recGame[e*10+s-1]; console.log('era '+e+': f1 '+ab2(g(1))+' · f5 '+ab2(g(5))+' · f9 '+ab2(g(9))+' · f10 '+ab2(g(10))+' · Senhor ÷ fase 9 = x'+(g(10)/g(9)).toFixed(2)+' · medida '+ab2(MED[e])); }
  console.log('JSONGAME '+JSON.stringify(recGame)); }
if(process.argv.includes('--dbg2')){ for(const j of [59,69,79,89]){ const p=play(free), arr=p.pass[j-1]; console.log('fase',j+1,'pedida',ab(plan[j].rec),'chegada x WR',ab(fcAt(free,arr,plan[j].e)*WR_BOSS[plan[j].e]),'alvo',plan[j].target.toFixed(1),'chega',arr.toFixed(1),'passa',p.pass[j].toFixed(1),'L',free.L(arr)); } }
if(process.argv.includes('--levels')){ const p=play(free); const lv=plan.map((pl,j)=>free.L(p.pass[j]!=null?p.pass[j]:p.pass[p.pass.length-1])); console.log('LEVELS '+JSON.stringify(lv)); }

// ---- PÓS-ERAS (--pos, PO 13/11: "acabar as eras não quer dizer que o jogo acabou") ----
// Fases sem fim depois da 90: FC pedida = a da fase 90 × 1,03 por fase; nos MARCOS (100, 110, ...) × POS_WALL a mais (parede curta).
// O que segue crescendo depois da fase 90 (proposta, docs/PROPOSTA_POS_ERAS.md):
//  - treino de era: até o teto x3 continua +2%/dia; acima do teto, +POS_TRAIN%/dia composto, SEM teto (nunca há parede impossível);
//  - Forja Astral +21 a +25: 1 nível a mais liberado em cada marco vencido (pedra só das fases sem fim);
//  - pet Nv 121-150: +1 nível por dia jogado, parte do pet até x1,40 (era x1,25 no Nv 120);
//  - título de marco: +1% ATQ e VIDA a cada marco (100 a 150).
if(process.argv.includes('--pos')){
  const POS_TRAIN=+((process.argv.find(a=>a.startsWith('--postrain='))||'--postrain=1.5').split('=')[1]), POS_WALL=+((process.argv.find(a=>a.startsWith('--poswall='))||'--poswall=1.04').split('=')[1]);
  const LAST=process.argv.includes('--limits')?999:150, GROW=BALJ.dificuldade.afterLastGrowth||1.03;
  FG.DATA.max=25; while(FG.DATA.bonus.length<26) FG.DATA.bonus.push(FG.DATA.bonus[FG.DATA.bonus.length-1]+0.12);
  const fb=k=>baseFc(120,8,5,20+k,4000)/baseFc(120,8,5,20,4000);
  const recPos=s=>plan[89].rec*Math.pow(GROW,s-90)*(s%10===0?POS_WALL:1);
  const ps=petShare(120,8,false);
  function posPlay(C,P0){ const tEnd=P0.pass[89]; if(tEnd==null) return null; fcAt(C,tEnd,8);
    const tCap=C.LS.t100+Math.log(1+TRAIN_CAP/100)/Math.log(1+TRAIN_DAY/100);
    const fcPos=(t,beaten)=>{ const d=t-tEnd, m=Math.min(5,Math.floor((beaten-90)/10));
      const train=Math.pow(1+POS_TRAIN/100,Math.max(0,t-Math.max(tEnd,tCap)));
      const pet=(1-ps*1.25)/(1-Math.min(0.6,ps*Math.min(1.40,1.25+0.005*d)));
      return fcAt(C,t,8)*train*fb(m)*pet*(1+m/100); };
    let s=91, t=tEnd; const at={}; let maxWait=0, last=tEnd;
    while(s<=LAST&&t<tEnd+600){ if(fcPos(t,s-1)>=recPos(s)){ at[s]=t; maxWait=Math.max(maxWait,t-last); last=t; s++; } else t+=0.05; }
    return {fcPos,tEnd,at,maxWait,fcEnd:fcAt(C,tEnd,8),trainEnd:Math.min(1+TRAIN_CAP/100,Math.pow(1+TRAIN_DAY/100,Math.max(0,tEnd-C.LS.t100)))}; }
  console.log('\n## PÓS-ERAS: dia em que chega (vence) a fase · treino acima do teto +'+POS_TRAIN+'%/dia · marco x'+POS_WALL+' · fases sem fim x'+GROW+'/fase');
  console.log('| Jogador | Dia em que termina as 9 eras | Treino no fim das eras | Fase 100 | Fase 110 | Fase 120 | Fase 150 | Maior espera numa fase |');
  console.log('|---|---|---|---|---|---|---|---|');
  for(const [nm,C,k] of [['Grátis ativo',free,'free'],['VIP 5',vip5,'vip5'],['VIP 10',vip10,'vip10']]){ const r=posPlay(C,P[k]); if(!r){ console.log('| '+nm+' | não termina |'); continue; }
    const dd=s=>r.at[s]!=null?'dia '+Math.ceil(r.at[s]):'depois do dia '+Math.ceil(r.tEnd+600);
    console.log('| '+nm+' | '+Math.ceil(r.tEnd)+' | x'+r.trainEnd.toFixed(2).replace('.',',')+' | '+dd(100)+' | '+dd(110)+' | '+dd(120)+' | '+dd(150)+' | '+f1(r.maxWait)+' |'); }
  console.log('Forja Astral +21..+25 vs +20: '+[1,2,3,4,5].map(k=>'+'+(20+k)+' x'+fb(k).toFixed(3)).join(' · ')+' · pet share Nv120 '+(ps*1.25).toFixed(3));
  /* --limits (pedido do Servidor fps-6f, 13/11): teto por dia de conta do jogador MAIS RÁPIDO (VIP 10 ativo), dias 0..400, NA ESCALA DO JOGO
     (FC da simulação × kEra, a mesma conversão do --game). O servidor põe a folga de 20%. maxStage = fase mais alta já ABERTA (vencidas + 1).
     maxGemsTotal: null (a simulação não modela diamantes; ver a mensagem ao Servidor). */
  if(process.argv.includes('--limits')){ const C=vip10, P0=P.vip10, r=posPlay(C,P0), out=[]; let best=0;
    const stageAt=d=>{ let n=0; for(let j=0;j<90;j++) if(P0.pass[j]!=null&&P0.pass[j]<=d) n=j+1; if(n===90&&r) for(const k in r.at) if(r.at[k]<=d) n=Math.max(n,+k); return n; };
    for(let d=0;d<=400;d++){ const won=stageAt(d), open=won+1, e=Math.min(8,Math.floor(Math.max(0,open-1)/10)), L=C.L(d);
      const fcSim=won>=90&&r?r.fcPos(Math.max(d,r.tEnd),won):fcAt(C,d,e), fc=fcSim*kEra[e]; best=Math.max(best,fc);
      out.push({day:d,maxLevel:L,maxEra:e,maxStage:open,maxFc:Number(best.toPrecision(4)),maxGemsTotal:null}); }
    console.log('LIMITS '+JSON.stringify(out)); }
}
