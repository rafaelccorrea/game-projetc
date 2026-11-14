/* Eonbound — Sys.coop: MASMORRA COOPERATIVA DE 3, "Ruínas em Trio" (docs/LOM_VS_EONBOUND.md §5 item 16, P3; contrato docs/SERVIDOR_LOM.md §3).
   CHAVE DESLIGADA (DATA.on=false). ASSÍNCRONA, sem WebSocket (como o Chefe Mundial): o grupo se monta antes e a corrida é uma CONTA com os RETRATOS
   (fantasmas) dos 3, decidida pelo SERVIDOR com semente (run(team, seed), a mesma função daqui rodando no Node). O jogo nunca manda pontos.
   - Grupo de 3: o líder convida por CÓDIGO DE AMIGO (formato da Dupla) ou MEMBRO DA GUILDA. Vaga vazia = retrato de FC parecida (±15%), escolhido pelo
     servidor. Quem sai antes da corrida vira o próprio retrato. Conversa SÓ por frase pronta da Dupla (Sys.duo.DATA.phrases), pelo ÍNDICE.
   - 2 entradas por dia (dia de Brasília), grátis: sem compra, sem anúncio, sem VIP. Humano sem entrada entra como retrato (não gasta, não ganha).
   - 10 andares; prêmio FIXO por andar vencido (fragmentos de relíquia, pedras de prática, ouro). Corrida inteira = 30 / 22 / 120 goldk (1 resgate de
     ouro, docs/ECONOMIA_OURO.md). Os fragmentos entram pelo Sys.loot.grantBundle (relicFrags → Sys.relics.addRelicFrags; desligado = guardados em S.sys.loot.relicFrags).
   PROVIDER LOCAL (sem servidor): o jogador corre com 2 retratos de mentira de FC parecida (a mesma conta), para o modo existir offline e nos testes.
   Estado: S.sys.coop {v, day, used, runs:[runId], party, invites, chat:{day, n, last}, lastRun}. Sem DOM. Teste: test/sys/coop.test.js */
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
  /* EQUILÍBRIO (Sistemas 13/11, teste do Servidor): fcRef = max(mediana, média) × 3. Um forte com duas contas fracas (5000/300/320) não leva mais
     o grupo aos 10 andares: a média sobe junto com o forte, então "forte + fracos" fica igual a um grupo de iguais. Grupo de iguais: mediana = média, nada muda.
     andar: mult (inimigo = fcRef × mult), prêmio fixo. steep = expoente da chance (p = T^steep ÷ (T^steep + E^steep)): grupo igual: ver a tabela abaixo.
     Como T (soma) nunca passa de max(mediana, média) × 3, NENHUM grupo fica acima da própria referência: forte + fracos ~3,4 como os iguais; um fraco
     no grupo puxa para baixo (1000/1000/400 ~1,4). Com a tabela de 0,70-1,60 o andar 10 era impossível (0 em 2.000); a tabela 0,55-1,04 (abaixo) dá: grupo de iguais ~6,7 andares e 8,5% chegam ao 10; um fraco no grupo (T/E 0,77) ~3,2. Ouro médio 12 × 6,7 = 81 goldk por corrida (teto 120 = um resgate). */
  steep:10,
  /* palavra que a TELA mostra para cada reason (Sys.coop.why(r)); inclui os erros do servidor que o Sys.coopNet repassa */
  why:{off:'Ruínas em Trio desligadas',level:'Libera no nível 30',limit:'Sem entradas hoje',code:'Código não encontrado',not_guild:'Não é da sua guilda',
    bad_idx:'Frase inválida',data:'Não deu agora',claimed:'Prêmio já recebido',in_party:'Você já está num grupo',no_party:'Crie um grupo primeiro',full:'Grupo cheio',
    not_leader:'Só o líder pode',not_invited:'Convite vencido',party:'Grupo não existe mais',snapshot_required:'Lute uma vez na Arena primeiro',
    not_found:'Abre com o online',net_off:'Sem conexão',offline:'Sem conexão',error:'Não deu agora'},
  floors:[F(0.55,1,1,12),F(0.62,1,1,12),F(0.68,2,1,12),F(0.73,2,2,12),F(0.78,3,2,12),F(0.83,3,2,12),F(0.88,4,3,12),F(0.93,4,3,12),F(0.98,5,3,12),F(1.04,5,4,12)],   // tabela baixada (Sistemas 14/11): com a referência max(mediana, média) o grupo de iguais chega ~6,7 e 8,5% chegam ao 10
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
/* team: [{fc}] (3 retratos). fcRef = max(mediana, média) × 3; teamPower = soma. Andar k: inimigo = fcRef × mult; x = T ÷ E; p = x^steep ÷ (x^steep + 1); vence se rng() < p.
   Roda sozinha num vm (o servidor carrega só este arquivo): não lê window/document nem outro módulo. */
function run(team,seed){ const fcs=(Array.isArray(team)?team:[]).slice(0,DATA.size).map(m=>Math.max(1,num(m&&m.fc,1))); while(fcs.length<DATA.size) fcs.push(1);
  const sorted=fcs.slice().sort((a,b)=>a-b), med=sorted[1], T=fcs.reduce((a,b)=>a+b,0), fcRef=Math.max(med,T/fcs.length)*DATA.size, rng=mulberry(int0(seed)), floors=[];
  let reached=0; for(let i=0;i<DATA.floors.length;i++){ const E=fcRef*DATA.floors[i].mult, x=Math.pow(T/E,DATA.steep), p=x/(x+1), win=rng()<p; floors.push({k:i+1,win,p:Math.round(p*10000)/10000}); if(!win) break; reached=i+1; }
  return {seed:int0(seed),fcRef,teamPower:T,floors,reached,reward:rewardFor(reached)}; }
/* retrato automático para a vaga vazia (o servidor escolhe um jogador real; aqui, de mentira, para o local) */
function ghost(avgFc,seed,i){ const r=mulberry(hash('coop-ghost',seed,i))(); return {playerId:'ghost-'+i,name:'Retrato',fc:Math.max(1,Math.round(num(avgFc,1)*(1+(r*2-1)*DATA.ghostSpread))),ghost:true,entryOk:false}; }

/* ================= ESTADO ================= */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.coop.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.coop; if(!o||typeof o!=='object') o=S.sys.coop={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; o.used=clamp(int0(o.used),0,DATA.entriesPerDay); delete o.relicFrags;
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
  return {on:true,open:true,reason:'',entriesLeft:entriesLeft(S,host),entriesMax:DATA.entriesPerDay,online:provider!==localProvider,party:o.party,invites:o.invites.slice(),lastRun:o.lastRun}; }
/* convite: código de amigo (formato) OU id de membro da MINHA guilda (do espelho do Sys.guild) */
function canInvite(S,host,who){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; who=who||{};
  if(who.friendCode!=null){ const code=String(who.friendCode).trim().toUpperCase(); return DATA.codeRe.test(code)?{ok:true,by:'code',code}:{ok:false,reason:'code'}; }   /* minúsculas valem (o servidor também põe em maiúsculas) */
  if(who.guildMemberId!=null){ const G=SYS().guild; let ok=false; try{ const g=G&&G.ensure?G.ensure(S):null; ok=!!(g&&g.id&&g.members.some(m=>m.id===String(who.guildMemberId)&&!m.me)); }catch(e){} return ok?{ok:true,by:'guild'}:{ok:false,reason:'not_guild'}; }
  return {ok:false,reason:'code'}; }
/* frase pronta por índice: 1 a cada 5 s, 20 por dia */
function canSay(S,host,idx){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const o=roll(S,host), t=nowOf(host);
  if(!Number.isInteger(idx)||idx<0||idx>=phraseCount()) return {ok:false,reason:'bad_idx'};
  if(groupSaid(S,host)>=DATA.msg.perDay||t-o.chat.last<DATA.msg.gapMs) return {ok:false,reason:'limit'}; return {ok:true}; }
/* frases do GRUPO hoje (contrato: 20 por grupo por dia). Com grupo: o contador que o servidor mandar (party.sayLeft = frases que RESTAM ao grupo hoje, se vier) ou as frases do
   grupo com data de hoje; nunca menos que as minhas do dia. Sem grupo (local): as minhas. */
function groupSaid(S,host){ const o=roll(S,host), k=o.day, p=o.party; if(!p) return o.chat.n;
  const fromSrv=Number.isInteger(p.sayLeft)&&p.chatDay===k?Math.max(0,DATA.msg.perDay-p.sayLeft):null, today=(p.chat||[]).filter(x=>dayKey(x.at)===k).length;
  return Math.max(o.chat.n,fromSrv!=null?fromSrv:today); }
function markSaid(S,host){ const o=roll(S,host); o.chat.n++; o.chat.last=nowOf(host); }
/* o servidor respondeu 429 limit: key 'day' = o grupo esgotou as frases de hoje (trava até amanhã); 'cooldown' = espere os 5 s */
function markLimit(S,host,key){ const o=roll(S,host); if(key==='cooldown') o.chat.last=nowOf(host); else o.chat.n=Math.max(o.chat.n,DATA.msg.perDay); return {ok:false,reason:'limit'}; }
const phraseText=i=>{ const D=SYS().duo; return D&&D.phraseText?D.phraseText(i):''; };

/* resultado de uma corrida, UMA vez por runId. LOCAL: credita aqui. SERVIDOR: a resposta vem com mailed:true e o prêmio chega pelo correio (não credita). */
/* paguei? members[].paid do servidor (a minha linha: id do Sys.net.player(), ou 'me' no local); sem a linha, o res.paid do topo (reserva) */
function myPlayerId(){ try{ const N=SYS().net, p=N&&typeof N.player==='function'?N.player():null; return p&&p.id?String(p.id):''; }catch(e){ return ''; } }
function paidOf(res){ const me=myPlayerId(), L=Array.isArray(res.members)?res.members:[];
  const row=L.find(m=>m&&m.ghost!==true&&typeof m.paid==='boolean'&&(m.playerId==='me'||(me&&String(m.playerId)===me)));
  return row?row.paid:(typeof res.paid==='boolean'?res.paid:undefined); }
function applyResult(S,host,res){ if(!on()) return {ok:false,reason:'off'}; if(!res||typeof res!=='object'||!res.runId) return {ok:false,reason:'data'};
  const o=roll(S,host), id=String(res.runId); o.lastRun={runId:id,reached:int0(res.reached),floors:Array.isArray(res.floors)?res.floors.slice(0,DATA.floors.length):[],members:Array.isArray(res.members)?res.members.slice(0,DATA.size):[],at:nowOf(host)};
  if(o.runs.includes(id)) return {ok:false,reason:'claimed'}; o.runs.push(id); if(o.runs.length>30) o.runs.shift();
  /* paid:false = humano sem entrada; mailed:true = o SERVIDOR credita pelo correio (carta source 'coop', ref r_<runId>:<jogador>): aqui só mostra */
  if(paidOf(res)===false||res.mailed===true) return {ok:true,got:null,mailed:res.mailed===true};
  /* o prêmio é sempre o da TABELA pelo andar (nunca o número mandado), com o teto do ouro */
  const rw=rewardFor(res.reached), L=SYS().loot; let got={};
  if(L&&L.grantBundle) got=L.grantBundle(S,host,{goldk:Math.min(120,rw.goldk),stones:rw.stones,relicFrags:rw.relicFrags});   /* relicFrags: o Sys.loot entrega ao Sys.relics ou guarda */
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
    sayLeft:Number.isInteger(data.party.sayLeft)?clamp(data.party.sayLeft,0,DATA.msg.perDay):null,chatDay:o.day,members:data.party.members.slice(0,DATA.size).map(m=>({playerId:String(m.playerId||''),name:String(m.name||'').slice(0,24),fc:int0(m.fc),ghost:m.ghost===true,entryOk:m.entryOk===true})),
    chat:(Array.isArray(data.party.chat)?data.party.chat:[]).filter(x=>x&&Number.isInteger(x.idx)&&x.idx>=0&&x.idx<phraseCount()).slice(-30).map(x=>({playerId:String(x.playerId||''),idx:x.idx,txt:phraseText(x.idx),at:int0(x.at)}))}:null;
  o.invites=(Array.isArray(data.invites)?data.invites:[]).slice(0,10).map(x=>({partyId:String(x.partyId||''),fromName:String(x.fromName||'').slice(0,24),at:int0(x.at)}));
  let paid=null; if(data.lastRun&&data.lastRun.runId) paid=applyResult(S,host,data.lastRun); return {ok:true,lastRun:paid}; }

/* tabela para a tela ("andar → prêmio") */
const table=()=>DATA.floors.map((f,i)=>({k:i+1,mult:f.mult,reward:Object.assign({},f.reward)}));
function view(S,host){ const st=status(S,host); if(!st.open) return st; return Object.assign({},st,{name:DATA.name,table:table(),total:rewardFor(DATA.floors.length),
  phrases:(()=>{ const D=SYS().duo; return D&&D.phrases?D.phrases():[]; })()}); }

/* texto curto para o reason (string ou {ok:false, reason}); '' quando deu certo */
const why=r=>{ const k=r&&typeof r==='object'?(r.ok?'':r.reason):r; return k?(DATA.why[k]||DATA.why.error):''; };
const API={DATA,on,setOn,dayKey,mulberry,rewardFor,run,ghost,ensure,status,entriesLeft,canInvite,canSay,markSaid,applyResult,applyStatus,why,groupSaid,markLimit,paidOf,
  localProvider,setProvider,get provider(){ return provider; },start,table,view};
root.Sys=root.Sys||{}; root.Sys.coop=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
