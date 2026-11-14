/* Eonbound — Sys.minigame: MINIJOGO DE EVENTO a cada 2 semanas, prêmio FIXO (docs/LOM_VS_EONBOUND.md §5 item 12, P2; docs/SERVIDOR_LOM.md §5).
   CHAVE DESLIGADA (DATA.on=false). Um minijogo de HABILIDADE (timing): um marcador corre de um lado ao outro numa barra e o jogador toca quando ele passa
   na FAIXA; 10 toques por partida, a faixa muda de lugar a cada toque (pela semente da partida). Cada toque: PERFEITO 100 · BOM 60 · RASPOU 25 · ERROU 0.
   - O TEMA troca a cada 14 dias (ciclo), em rodízio: Forja no Ponto → Pesca do Rio → Escavação Relâmpago (velocidade e faixa mudam um pouco).
     O ciclo começa no início do Festival das Eras (Sys.events, '2026-11-20'), então o calendário dos eventos e o do minijogo andam juntos;
     view() mostra o evento ativo do Sys.events (só leitura).
   - 3 TENTATIVAS GRÁTIS por dia de Brasília. NENHUMA tentativa paga, nem por anúncio, nem por VIP (regra de menores).
   - PRÊMIO FIXO e conhecido: pela MELHOR faixa do dia (Bronze 300 / Prata 550 / Ouro 800 pontos), resgatado 1 vez por dia; e MARCOS do ciclo pelos
     dias jogados com Bronze ou melhor (3, 7 e 10 dias). Só materiais (forja, ração, essência, pedras de treino): sem ouro, sem diamante, sem sorteio.
   Estado: S.sys.minigame {v, day:{k, tries, best, tier, claimed}, cyc:{id, days:[dia], got:[marco]}, run:{id, seed, game, at}|null}. Sem DOM.
   Teste: test/sys/minigame.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  epoch:'2026-11-20',             // 1º dia do 1º ciclo (dia de Brasília) = início do Festival das Eras (Sys.events)
  cycleDays:14,
  games:[
    {id:'forja',     name:'Forja no Ponto',      txt:'Bata o martelo quando o ferro brilhar na faixa.', speed:1.00, zone:0.18},
    {id:'pesca',     name:'Pesca do Rio',        txt:'Puxe a linha quando o peixe passar na faixa.',     speed:1.20, zone:0.16},
    {id:'escavacao', name:'Escavação Relâmpago', txt:'Cave quando a pá passar sobre o tesouro.',         speed:1.40, zone:0.15},
  ],
  taps:10,
  triesPerDay:3,
  /* nota de um toque pela distância ao CENTRO da faixa, em frações da LARGURA da faixa (zone) */
  grades:[{max:0.15,pts:100,id:'perfect',name:'PERFEITO'},{max:0.35,pts:60,id:'good',name:'BOM'},{max:0.5,pts:25,id:'graze',name:'RASPOU'}],
  tiers:[{id:'bronze',name:'Bronze',min:300},{id:'prata',name:'Prata',min:550},{id:'ouro',name:'Ouro',min:800}],
  dayReward:{bronze:{forge:3}, prata:{forge:5,food:20}, ouro:{forge:8,food:30,essence:1}},
  milestones:[{days:3,reward:{essence:2}},{days:7,reward:{forge:20}},{days:10,reward:{stones:5}}],
  /* palavra que a TELA mostra para cada reason (Sys.minigame.why(r)) */
  why:{off:'Minijogo desligado',soon:'Começa em breve',tries:'Sem tentativas hoje',run:'Nenhuma partida em andamento',tier:'Faça Bronze para ganhar',
    claimed:'Já resgatado',days:'Ainda faltam dias',id:'Não deu agora'},
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const DAY=86400000;
const dayKey=ms=>new Date(num(ms,Date.now())-3*3600000).toISOString().slice(0,10);   // Brasília
const dayNum=k=>Math.floor(Date.parse(k+'T00:00:00Z')/DAY);
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(){ let h=2166136261; for(const x of arguments){ const s=String(x); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } h^=124; } return h>>>0; }
const TIER_ORDER=['bronze','prata','ouro'];
const tierRank=t=>TIER_ORDER.indexOf(t);

/* ================= CICLO (calendário) ================= */
/* ciclo do dia: {id (0, 1, 2...), game, start, end (ms, dia de Brasília), daysLeft} ou {id:-1, startsAt} antes do 1º */
function cycleAt(ms){ const k=dayKey(ms), d=dayNum(k)-dayNum(DATA.epoch), C=DATA.cycleDays;
  const startMs=n=>Date.parse(DATA.epoch+'T00:00:00Z')+3*3600000+n*C*DAY;
  if(d<0) return {id:-1,game:null,startsAt:startMs(0)};
  const id=Math.floor(d/C), g=DATA.games[id%DATA.games.length];
  return {id,game:Object.assign({},g),start:startMs(id),end:startMs(id+1),daysLeft:C-(d%C)}; }

/* ================= CONTA DA PARTIDA (pura) ================= */
/* centros da faixa nos 10 toques, pela semente (sempre dentro da barra) */
function centers(seed,zone){ const r=mulberry(int0(seed)), z=num(zone,0.15), out=[]; for(let i=0;i<DATA.taps;i++) out.push(Math.round((z/2+0.05+r()*(1-z-0.1))*10000)/10000); return out; }
/* nota de UM toque: posição tocada (0-1) contra o centro da faixa */
function grade(pos,center,zone){ if(typeof pos!=='number'||!isFinite(pos)) return {id:'miss',name:'ERROU',pts:0};
  const d=Math.abs(clamp(pos,0,1)-center)/Math.max(0.01,num(zone,0.15)); for(const g of DATA.grades) if(d<=g.max) return {id:g.id,name:g.name,pts:g.pts}; return {id:'miss',name:'ERROU',pts:0}; }
/* pontos da partida: positions = onde cada toque parou (0-1; null = não tocou). {score, taps:[{grade, pts}], tier} */
function score(positions,seed,zone){ const cs=centers(seed,zone), P=Array.isArray(positions)?positions:[]; let s=0; const taps=[];
  for(let i=0;i<DATA.taps;i++){ const g=grade(P[i],cs[i],zone); s+=g.pts; taps.push({grade:g.id,name:g.name,pts:g.pts}); }
  return {score:s,taps,tier:tierOf(s)}; }
function tierOf(s){ let t=null; for(const x of DATA.tiers) if(int0(s)>=x.min) t=x.id; return t; }

/* ================= ESTADO ================= */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.minigame.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.minigame; if(!o||typeof o!=='object') o=S.sys.minigame={}; o.v=1;
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={k:typeof d.k==='string'?d.k:'',tries:clamp(int0(d.tries),0,DATA.triesPerDay),best:int0(d.best),tier:TIER_ORDER.includes(d.tier)?d.tier:null,claimed:d.claimed===true};
  const c=(o.cyc&&typeof o.cyc==='object')?o.cyc:{}; o.cyc={id:Number.isInteger(c.id)?c.id:-1,days:(Array.isArray(c.days)?c.days:[]).filter(x=>typeof x==='string').slice(0,DATA.cycleDays),got:(Array.isArray(c.got)?c.got:[]).map(int0).filter(x=>DATA.milestones.some(m=>m.days===x))};
  o.run=o.run&&typeof o.run==='object'&&o.run.id?o.run:null; return o; }
function roll(S,host){ const o=ensure(S), t=nowOf(host), k=dayKey(t), cy=cycleAt(t).id; if(o.day.k!==k){ o.day={k,tries:0,best:0,tier:null,claimed:false}; o.run=null; }
  if(o.cyc.id!==cy){ o.cyc={id:cy,days:[],got:[]}; } return o; }

function status(S,host){ if(!on()) return {on:false,open:false,reason:'off'}; const o=roll(S,host), cy=cycleAt(nowOf(host));
  if(cy.id<0) return {on:true,open:false,reason:'soon',startsAt:cy.startsAt}; return {on:true,open:true,reason:'',cycle:cy,triesLeft:DATA.triesPerDay-o.day.tries,triesMax:DATA.triesPerDay}; }
/* começa uma partida: gasta 1 tentativa (desistir não devolve). {ok, runId, game, speed, zone, taps, centers, triesLeft} */
function start(S,host){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const o=roll(S,host);
  if(o.day.tries>=DATA.triesPerDay) return {ok:false,reason:'tries'};
  o.day.tries++; const g=st.cycle.game, seed=hash('mg',o.day.k,o.day.tries,st.cycle.id); o.run={id:o.day.k+'#'+o.day.tries,seed,game:g.id,zone:g.zone,at:nowOf(host)};
  return {ok:true,runId:o.run.id,game:g,speed:g.speed,zone:g.zone,taps:DATA.taps,centers:centers(seed,g.zone),triesLeft:DATA.triesPerDay-o.day.tries}; }
/* termina a partida em andamento com as posições tocadas. Guarda a melhor do dia; dia com Bronze+ conta no ciclo. */
function finish(S,host,positions){ if(!on()) return {ok:false,reason:'off'}; const o=roll(S,host), r=o.run; if(!r) return {ok:false,reason:'run'};
  o.run=null; const sc=score(positions,r.seed,r.zone); const better=sc.score>o.day.best; if(better){ o.day.best=sc.score; o.day.tier=tierOf(sc.score); }
  if(sc.tier&&!o.cyc.days.includes(o.day.k)) o.cyc.days.push(o.day.k);
  return {ok:true,score:sc.score,taps:sc.taps,tier:sc.tier,best:o.day.best,bestTier:o.day.tier,record:better,triesLeft:DATA.triesPerDay-o.day.tries}; }
const grant=(S,host,b)=>{ const L=SYS().loot; return L&&L.grantBundle?L.grantBundle(S,host,b):null; };
/* prêmio do dia pela MELHOR faixa (1 vez por dia; jogar de novo depois do resgate não paga a diferença: resgate quando quiser parar) */
function claimDay(S,host){ if(!on()) return {ok:false,reason:'off'}; const o=roll(S,host); if(!o.day.tier) return {ok:false,reason:'tier'}; if(o.day.claimed) return {ok:false,reason:'claimed'};
  o.day.claimed=true; const rw=Object.assign({},DATA.dayReward[o.day.tier]); return {ok:true,tier:o.day.tier,reward:rw,got:grant(S,host,rw)}; }
function claimMilestone(S,host,days){ if(!on()) return {ok:false,reason:'off'}; const o=roll(S,host), m=DATA.milestones.find(x=>x.days===int0(days)); if(!m) return {ok:false,reason:'id'};
  if(o.cyc.days.length<m.days) return {ok:false,reason:'days'}; if(o.cyc.got.includes(m.days)) return {ok:false,reason:'claimed'};
  o.cyc.got.push(m.days); const rw=Object.assign({},m.reward); return {ok:true,days:m.days,reward:rw,got:grant(S,host,rw)}; }

/* evento ativo do Sys.events (só leitura) para o cabeçalho: "durante o Festival das Eras" */
function eventNow(S,host){ const E=SYS().events; try{ const l=E&&E.list?E.list(S,host):[]; const a=l.find(x=>x.phase==='ativo'); return a?{id:a.id,name:a.name,endsAt:a.endsAt}:null; }catch(e){ return null; } }
function view(S,host){ const st=status(S,host); if(!st.open) return st; const o=roll(S,host);
  return Object.assign({},st,{game:st.cycle.game,best:o.day.best,tier:o.day.tier,claimed:o.day.claimed,canClaim:!!o.day.tier&&!o.day.claimed,
    dayReward:o.day.tier?Object.assign({},DATA.dayReward[o.day.tier]):null,tiers:DATA.tiers.map(t=>({id:t.id,name:t.name,min:t.min,reward:Object.assign({},DATA.dayReward[t.id])})),
    days:o.cyc.days.length,milestones:DATA.milestones.map(m=>({days:m.days,reward:Object.assign({},m.reward),reached:o.cyc.days.length>=m.days,claimed:o.cyc.got.includes(m.days)})),
    event:eventNow(S,host),inRun:!!o.run,paidTries:false}); }

/* texto curto para o reason (string ou {ok:false, reason}); '' quando deu certo */
const why=r=>{ const k=r&&typeof r==='object'?(r.ok?'':r.reason):r; return k?(DATA.why[k]||'Não deu agora'):''; };
/* número do SELO (botão Minijogo na tela de Eventos): prêmio do dia para resgatar + marcos prontos + 1 se ainda não jogou hoje e tem tentativa.
   Desligado, antes do 1º ciclo ou sem save: 0. Só leitura (o roll do dia é o mesmo do view). */
function badge(S,host){ if(!on()||!S) return 0; let v=null; try{ v=view(S,host); }catch(e){ return 0; } if(!v||!v.open) return 0;
  return (v.canClaim?1:0)+v.milestones.filter(m=>m.reached&&!m.claimed).length+(v.triesLeft>0&&v.best===0?1:0); }
const API={DATA,on,setOn,dayKey,cycleAt,centers,grade,score,tierOf,ensure,status,start,finish,claimDay,claimMilestone,view,badge,why};
root.Sys=root.Sys||{}; root.Sys.minigame=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
