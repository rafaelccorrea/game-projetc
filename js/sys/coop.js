/* Eonbound — Sys.coop: MASMORRA COOPERATIVA DE 3, "Ruínas em Trio" (docs/LOM_VS_EONBOUND.md §5 item 16, P3; contrato docs/SERVIDOR_LOM.md §3).
   CHAVE DESLIGADA (DATA.on=false). ASSÍNCRONA, sem WebSocket (como o Chefe Mundial): o grupo se monta antes e a corrida é uma CONTA com os RETRATOS
   (fantasmas) dos 3, decidida pelo SERVIDOR com semente (run(team, seed), a mesma função daqui rodando no Node). O jogo nunca manda pontos.
   - Grupo de 3: o líder convida por CÓDIGO DE AMIGO (formato da Dupla) ou MEMBRO DA GUILDA. Vaga vazia = retrato de FC parecida (±15%), escolhido pelo
     servidor. Quem sai antes da corrida vira o próprio retrato. Conversa SÓ por frase pronta da Dupla (Sys.duo.DATA.phrases), pelo ÍNDICE.
   - 2 entradas por dia (dia de Brasília), grátis: sem compra, sem anúncio, sem VIP. Humano sem entrada entra como retrato (não gasta, não ganha).
   - 10 andares; prêmio FIXO por andar vencido (fragmentos de relíquia, pedras de prática, ouro). Corrida inteira = 30 / 22 / 120 goldk (1 resgate de
     ouro, docs/ECONOMIA_OURO.md). Os fragmentos vão para o Sys.relics se ele tiver addFrags; senão ficam guardados em S.sys.coop.relicFrags.
   PROVIDER LOCAL (sem servidor): o jogador corre com 2 retratos de mentira de FC parecida (a mesma conta), para o modo existir offline e nos testes.
   Estado: S.sys.coop {v, day, used, runs:[runId], relicFrags, party, invites, chat:{day, n, last}, lastRun}. Sem DOM. Teste: test/sys/coop.test.js */
(function(root){
'use strict';
const F=(mult,relicFrags,stones,goldk)=>({mult,reward:{relicFrags,stones,goldk}});
const DATA={
  on:false,
  name:'Ruínas em Trio',
  needLevel:30,
  size:3,
  entriesPerDay:2,
  ghostSpread:0.15,               // retrato automático: FC média dos humanos ±15%
  invitesPerDay:10,
  codeRe:/^[A-Z0-9]{6,10}$/,       // mesmo formato do código de amigo da Dupla
  msg:{gapMs:5000, perDay:20},
  /* andar: mult (inimigo = fcRef × mult), prêmio fixo. steep = expoente da chance (p = T^steep ÷ (T^steep + E^steep)): grupo igual chega ~ao andar 3,4;
     grupo 33% acima da mediana ~6,5; o dobro ~9,7 (simulado) */
  steep:10,
  floors:[F(0.70,1,1,12),F(0.78,1,1,12),F(0.86,2,1,12),F(0.94,2,2,12),F(1.02,3,2,12),F(1.10,3,2,12),F(1.20,4,3,12),F(1.32,4,3,12),F(1.45,5,3,12),F(1.60,5,4,12)],
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const dayKey=ms=>new Date(num(ms,Date.now())-3*3600000).toISOString().slice(0,10);   // Brasília, igual ao servidor
/* mulberry32: a MESMA do Sys.arena (o servidor repete a conta com a semente) */
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(){ let h=2166136261; for(const x of arguments){ const s=String(x); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } h^=124; } return h>>>0; }
const phraseCount=()=>{ const D=SYS().duo; return D&&D.DATA&&Array.isArray(D.DATA.phrases)?D.DATA.phrases.length:0; };

/* ================= CONTA DA CORRIDA (pura; o servidor roda a mesma) ================= */
/* prêmio fixo de quem venceu `reached` andares */
function rewardFor(reached){ const out={relicFrags:0,stones:0,goldk:0}; for(let k=0;k<clamp(int0(reached),0,DATA.floors.length);k++){ const r=DATA.floors[k].reward; for(const x in out) out[x]+=r[x]; } return out; }
/* team: [{fc}] (3 retratos). fcRef = mediana × 3; teamPower = soma. Andar k: inimigo = fcRef × mult; x = T ÷ E; p = x^steep ÷ (x^steep + 1); vence se rng() < p.
   Roda sozinha num vm (o servidor carrega só este arquivo): não lê window/document nem outro módulo. */
function run(team,seed){ const fcs=(Array.isArray(team)?team:[]).slice(0,DATA.size).map(m=>Math.max(1,num(m&&m.fc,1))); while(fcs.length<DATA.size) fcs.push(1);
  const sorted=fcs.slice().sort((a,b)=>a-b), med=sorted[1], fcRef=med*DATA.size, T=fcs.reduce((a,b)=>a+b,0), rng=mulberry(int0(seed)), floors=[];
  let reached=0; for(let i=0;i<DATA.floors.length;i++){ const E=fcRef*DATA.floors[i].mult, x=Math.pow(T/E,DATA.steep), p=x/(x+1), win=rng()<p; floors.push({k:i+1,win,p:Math.round(p*10000)/10000}); if(!win) break; reached=i+1; }
  return {seed:int0(seed),fcRef,teamPower:T,floors,reached,reward:rewardFor(reached)}; }
/* retrato automático para a vaga vazia (o servidor escolhe um jogador real; aqui, de mentira, para o local) */
function ghost(avgFc,seed,i){ const r=mulberry(hash('coop-ghost',seed,i))(); return {playerId:'ghost-'+i,name:'Retrato',fc:Math.max(1,Math.round(num(avgFc,1)*(1+(r*2-1)*DATA.ghostSpread))),ghost:true,entryOk:false}; }

/* ================= ESTADO ================= */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.coop.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.coop; if(!o||typeof o!=='object') o=S.sys.coop={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; o.used=clamp(int0(o.used),0,DATA.entriesPerDay); o.relicFrags=int0(o.relicFrags);
  o.runs=Array.isArray(o.runs)?o.runs.filter(x=>typeof x==='string').slice(-30):[];
  o.party=o.party&&typeof o.party==='object'&&Array.isArray(o.party.members)?o.party:null; o.invites=Array.isArray(o.invites)?o.invites.filter(x=>x&&typeof x==='object').slice(0,10):[];
  const c=(o.chat&&typeof o.chat==='object')?o.chat:{}; o.chat={day:typeof c.day==='string'?c.day:'',n:int0(c.n),last:int0(c.last)};
  o.lastRun=o.lastRun&&typeof o.lastRun==='object'?o.lastRun:null; return o; }
function roll(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.used=0; } if(o.chat.day!==k){ o.chat.day=k; o.chat.n=0; } return o; }
const levelOf=(S,host)=>{ const L=SYS().level; try{ if(L&&L.level) return L.level(S); }catch(e){} return int0(host&&host.level&&host.level())||1; };
const myFc=(S,host)=>{ const W=SYS().tower, Fc=SYS().fc; try{ if(W&&W.playerStats) return Math.max(1,num(W.playerStats(S,host).fc,1)); }catch(e){} try{ if(Fc&&Fc.total) return Math.max(1,num(Fc.total(S,host),1)); }catch(e){} return Math.max(1,num(host&&host.fc&&host.fc(),1)); };
const entriesLeft=(S,host)=>Math.max(0,DATA.entriesPerDay-roll(S,host).used);

function status(S,host){ if(!on()) return {on:false,open:false,reason:'off'}; const o=roll(S,host), lv=levelOf(S,host);
  if(lv<DATA.needLevel) return {on:true,open:false,reason:'level',needLevel:DATA.needLevel};
  return {on:true,open:true,reason:'',entriesLeft:entriesLeft(S,host),entriesMax:DATA.entriesPerDay,online:provider!==localProvider,party:o.party,invites:o.invites.slice(),lastRun:o.lastRun,relicFrags:o.relicFrags}; }
/* convite: código de amigo (formato) OU id de membro da MINHA guilda (do espelho do Sys.guild) */
function canInvite(S,host,who){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; who=who||{};
  if(who.friendCode!=null){ return DATA.codeRe.test(String(who.friendCode))?{ok:true,by:'code'}:{ok:false,reason:'code'}; }
  if(who.guildMemberId!=null){ const G=SYS().guild; let ok=false; try{ const g=G&&G.ensure?G.ensure(S):null; ok=!!(g&&g.id&&g.members.some(m=>m.id===String(who.guildMemberId)&&!m.me)); }catch(e){} return ok?{ok:true,by:'guild'}:{ok:false,reason:'not_guild'}; }
  return {ok:false,reason:'code'}; }
/* frase pronta por índice: 1 a cada 5 s, 20 por dia */
function canSay(S,host,idx){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const o=roll(S,host), t=nowOf(host);
  if(!Number.isInteger(idx)||idx<0||idx>=phraseCount()) return {ok:false,reason:'bad_idx'};
  if(o.chat.n>=DATA.msg.perDay||t-o.chat.last<DATA.msg.gapMs) return {ok:false,reason:'limit'}; return {ok:true}; }
function markSaid(S,host){ const o=roll(S,host); o.chat.n++; o.chat.last=nowOf(host); }
const phraseText=i=>{ const D=SYS().duo; return D&&D.phraseText?D.phraseText(i):''; };

/* resultado de uma corrida, UMA vez por runId. LOCAL: credita aqui. SERVIDOR: a resposta vem com mailed:true e o prêmio chega pelo correio (não credita). */
function applyResult(S,host,res){ if(!on()) return {ok:false,reason:'off'}; if(!res||typeof res!=='object'||!res.runId) return {ok:false,reason:'data'};
  const o=roll(S,host), id=String(res.runId); o.lastRun={runId:id,reached:int0(res.reached),floors:Array.isArray(res.floors)?res.floors.slice(0,DATA.floors.length):[],members:Array.isArray(res.members)?res.members.slice(0,DATA.size):[],at:nowOf(host)};
  if(o.runs.includes(id)) return {ok:false,reason:'claimed'}; o.runs.push(id); if(o.runs.length>30) o.runs.shift();
  /* paid:false = humano sem entrada; mailed:true = o SERVIDOR credita pelo correio (carta source 'coop', ref r_<runId>:<jogador>): aqui só mostra */
  if(res.paid===false||res.mailed===true) return {ok:true,got:null,mailed:res.mailed===true};
  /* o prêmio é sempre o da TABELA pelo andar (nunca o número mandado), com o teto do ouro */
  const rw=rewardFor(res.reached), L=SYS().loot; let got={};
  if(L&&L.grantBundle) got=L.grantBundle(S,host,{goldk:Math.min(120,rw.goldk),stones:rw.stones});
  const R=SYS().relics; let stored=rw.relicFrags; try{ if(R&&typeof R.addFrags==='function'&&rw.relicFrags){ const x=R.addFrags(S,rw.relicFrags,'coop',host); if(!(x&&x.ok===false)) stored=0; } }catch(e){}
  o.relicFrags+=stored; got.relicFrags=rw.relicFrags; got.relicStored=stored;
  return {ok:true,reward:rw,got}; }

/* ================= PROVIDER ================= */
/* LOCAL: o jogador + 2 retratos de mentira; gasta 1 entrada e credita na hora */
const localProvider={ online:false,
  start(S,host){ const o=roll(S,host); if(entriesLeft(S,host)<=0) return {ok:false,reason:'limit'};
    const fc=myFc(S,host), t=nowOf(host), seed=hash('coop',o.day,o.used,Math.round(fc)), me={playerId:'me',name:'Você',fc,ghost:false,entryOk:true,paid:true};
    const team=[me,ghost(fc,seed,1),ghost(fc,seed,2)], r=run(team,seed); o.used++;
    const res=Object.assign({ok:true,runId:'local-'+o.day+'-'+o.used+'-'+seed},r,{members:team,entriesLeft:entriesLeft(S,host)}); applyResult(S,host,res); res.at=t; return res; } };
let provider=localProvider;
function setProvider(p){ provider=p&&typeof p==='object'&&typeof p.start==='function'?p:localProvider; return provider!==localProvider; }
/* começar a corrida (só o líder, no servidor). Local: síncrono; servidor: o provider devolve Promise (o Engenheiro aguarda). */
function start(S,host){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; if(entriesLeft(S,host)<=0) return {ok:false,reason:'limit'}; return provider.start(S,host); }

/* espelho do GET /coop/status */
function applyStatus(S,host,data){ if(!on()) return {ok:false,reason:'off'}; if(!data||typeof data!=='object') return {ok:false,reason:'data'}; const o=roll(S,host);
  if(data.entriesLeft!=null) o.used=clamp(DATA.entriesPerDay-int0(data.entriesLeft),0,DATA.entriesPerDay);
  o.party=data.party&&Array.isArray(data.party.members)?{id:String(data.party.id||''),leaderId:String(data.party.leaderId||''),seatsOpen:int0(data.party.seatsOpen),
    members:data.party.members.slice(0,DATA.size).map(m=>({playerId:String(m.playerId||''),name:String(m.name||'').slice(0,24),fc:int0(m.fc),ghost:m.ghost===true,entryOk:m.entryOk===true})),
    chat:(Array.isArray(data.party.chat)?data.party.chat:[]).filter(x=>x&&Number.isInteger(x.idx)&&x.idx>=0&&x.idx<phraseCount()).slice(-30).map(x=>({playerId:String(x.playerId||''),idx:x.idx,txt:phraseText(x.idx),at:int0(x.at)}))}:null;
  o.invites=(Array.isArray(data.invites)?data.invites:[]).slice(0,10).map(x=>({partyId:String(x.partyId||''),fromName:String(x.fromName||'').slice(0,24),at:int0(x.at)}));
  let paid=null; if(data.lastRun&&data.lastRun.runId) paid=applyResult(S,host,data.lastRun); return {ok:true,lastRun:paid}; }

/* tabela para a tela ("andar → prêmio") */
const table=()=>DATA.floors.map((f,i)=>({k:i+1,mult:f.mult,reward:Object.assign({},f.reward)}));
function view(S,host){ const st=status(S,host); if(!st.open) return st; return Object.assign({},st,{name:DATA.name,table:table(),total:rewardFor(DATA.floors.length),
  phrases:(()=>{ const D=SYS().duo; return D&&D.phrases?D.phrases():[]; })()}); }

const API={DATA,on,setOn,dayKey,mulberry,rewardFor,run,ghost,ensure,status,entriesLeft,canInvite,canSay,markSaid,applyResult,applyStatus,
  localProvider,setProvider,get provider(){ return provider; },start,table,view};
root.Sys=root.Sys||{}; root.Sys.coop=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
