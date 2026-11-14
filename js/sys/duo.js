/* Eonbound — Sys.duo: DUPLA DAS ERAS. docs/IDLE_PARECIDOS.md §3 item 9 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   O social mais leve possível, pensado para MENORES:
   - Vincula UM amigo de verdade, por CÓDIGO DE AMIGO (gerado pelo servidor, só letras/números; não é texto livre) + aceite do outro. Sem busca de
     estranhos, sem lista pública. Convite vence em 48 h; até 5 convites por dia; 1 dupla por vez.
   - Conversa SÓ por FRASES PRONTAS (DATA.phrases, pelo ÍNDICE). Nenhuma função aceita texto do jogador. Anti-spam: 1 frase a cada 5 s, 30 por dia,
     a mesma no máximo 2 vezes seguidas. O que chega do parceiro também é só índice (o texto sai da lista daqui).
   - NENHUMA troca: não há envio de item, moeda, gema, pet, nada. O prêmio é IGUAL para os dois e cada um recebe o SEU (nada é transferível).
   - Meta DIÁRIA conjunta ("Juntos hoje"): os dois entram no dia e somam 300 abates. Missões SEMANAIS conjuntas (o doc: "juntos, 200 abates de chefe").
     O progresso é a SOMA dos dois; cada um resgata o próprio prêmio quando a soma chega. Prêmio = ouro (× ouro de um abate da fase) + Pedras de Forja.
     Nunca gemas, nunca sorteio, nunca loja.
   - Sair: a dupla acaba para os dois; QUEM SAIU espera 24 h para vincular outro (quem ficou, não) (contra troca de parceiro só para farmar). Bloquear: sai e aquele jogador não
     pode mais convidar. Missão já resgatada na semana NÃO volta com parceiro novo (o resgate é por semana, não por dupla).
   PROVIDER trocável (como Sys.arena / Sys.guild): o padrão é LOCAL (sem servidor: tudo fica no save, o parceiro vem do que applyServer espelhou;
   offline o progresso do parceiro é o último recebido). O servidor (fps-6f) troca por setProvider(p) e espelha com applyServer(S, data).
   Estado: S.sys.duo {v, partner, inv:{out,in}, blocked, leftAt, day:{k, mine, partner, pDay, claimed}, week:{k, mine, partner, days, pDays, claimed},
   msg:{last, lastIdx, streak, day, n}, inbox, outbox, sent}. Relógio só por host.now; dia/semana pelo Sys.clock. Teste: test/sys/duo.test.js */
(function(root){
'use strict';
const H=3600000, D=24*H;
const DATA={
  on:false,
  needLevel:16,                         // PROPOSTA: junto com o Chat (Sys.level.DATA.unlock.chat=16); se o Sys.level ganhar 'duo', vale o de lá
  codeRe:/^[A-Z0-9]{6,10}$/,             // código de amigo: o servidor gera; aqui só confere o formato (nunca vira texto na tela de outro)
  invite:{ttlMs:48*H, perDay:5, maxOut:5, maxIn:10},
  relinkMs:24*H,                        // depois de sair, espera para vincular outro
  msg:{cooldownMs:5000, perDay:30, repeatMax:2, inbox:20},
  counters:['kills','bossKills','stages','arenaWins'],
  dayCap:{kills:20000,bossKills:150,stages:60,arenaWins:40},   // teto por dia de cada um (o mesmo do servidor, API_SERVIDOR §16): acima disso não conta
  // META DIÁRIA: os dois entram no dia (presença) e somam 300 abates. Prêmio igual para os dois.
  daily:{id:'daily',name:'Juntos hoje',counter:'kills',target:300,both:true,reward:{goldK:30,stones:1}},
  // MISSÕES SEMANAIS (soma dos dois). bothDays = dias da semana em que OS DOIS entraram.
  weekly:[
    {id:'boss200', name:'Juntos, 200 abates de chefe',   counter:'bossKills',target:200,reward:{goldK:120,stones:4}},
    {id:'stages40',name:'Juntos, 40 fases vencidas',      counter:'stages',   target:40, reward:{goldK:120,stones:4}},
    {id:'arena20', name:'Juntos, 20 vitórias na Arena',   counter:'arenaWins',target:20, reward:{goldK:80, stones:3}},
    {id:'days5',   name:'Os dois entram em 5 dias',       counter:'bothDays', target:5,  reward:{goldK:120,stones:5}}],   // goldK 150 → 120: teto de 5 min de abate por resgate (docs/ECONOMIA_OURO.md; o servidor espelha)
  // FRASES PRONTAS (amigáveis). Novas entram SEMPRE NO FIM (o índice é o que viaja).
  phrases:[
    {id:'oi',          txt:'Oi, dupla!'},
    {id:'bom_dia',     txt:'Bom dia!'},
    {id:'boa_noite',   txt:'Boa noite!'},
    {id:'bora',        txt:'Bora jogar?'},
    {id:'meta',        txt:'Vamos fechar a meta de hoje!'},
    {id:'quase',       txt:'Falta pouco para a meta!'},
    {id:'fechou',      txt:'Meta fechada! Boa!'},
    {id:'chefe',       txt:'Derrubei um chefe!'},
    {id:'era',         txt:'Cheguei numa era nova!'},
    {id:'arena',       txt:'Vou para a Arena!'},
    {id:'forja',       txt:'Estou na Forja.'},
    {id:'parabens',    txt:'Parabéns!'},
    {id:'valeu',       txt:'Valeu, dupla!'},
    {id:'voce_manda',  txt:'Você manda bem!'},
    {id:'ja_volto',    txt:'Já volto!'},
    {id:'amanha',      txt:'Até amanhã!'},
    {id:'gg',          txt:'GG!'},
    {id:'joinha',      txt:'Combinado!'}],
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const pad=n=>String(n).padStart(2,'0');
const dayKey=ms=>{ const C=SYS().clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const weekKey=ms=>{ const C=SYS().clock; if(C&&typeof C.weekKey==='function') return C.weekKey(ms); const d=new Date(ms); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return dayKey(d.getTime()); };
const zc=()=>{ const o={}; for(const k of DATA.counters) o[k]=0; return o; };
const cnt=x=>{ const o=zc(); if(x&&typeof x==='object') for(const k of DATA.counters) o[k]=int0(x[k]); return o; };
const strId=v=>(typeof v==='string'||typeof v==='number')&&String(v).length&&String(v).length<=64?String(v):null;
/* nível e era do outro (servidor 2b77eb6, GET /duo e invites[]): número ou null; era 0-8 */
const lvOf=v=>{ const n=int0(v); return n>0?n:null; }, eraOf2=v=>{ if(v==null||v==='') return null; const n=int0(v); return n>=0&&n<=8?n:null; };
/* moldura do Perfil do outro (servidor: partner.frame no GET /duo): id curto [a-z0-9_] ou null. Só visual; qualquer outra coisa vira null. */
const frameOf=v=>typeof v==='string'&&/^[a-z0-9_]{1,32}$/.test(v)?v:null;
const cleanName=v=>String(v==null?'':v).slice(0,24);   // nome vem do SERVIDOR (já moderado na criação da conta); aqui só corta
const needLevel=()=>{ const L=SYS().level; const u=L&&L.DATA&&L.DATA.unlock; return u&&u.duo!=null?int0(u.duo):DATA.needLevel; };
const levelOf=(S,host)=>{ const L=SYS().level; try{ if(L&&L.level) return L.level(S); }catch(e){} return int0(host&&host.level&&host.level())||1; };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.duo.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.duo; if(!o||typeof o!=='object') o=S.sys.duo={};
  o.v=1; const p=o.partner; o.partner=p&&typeof p==='object'&&strId(p.id)?{id:strId(p.id),name:cleanName(p.name),since:int0(p.since),last:int0(p.last),lv:lvOf(p.lv),era:eraOf2(p.era),frame:frameOf(p.frame)}:null;
  const iv=(o.inv&&typeof o.inv==='object')?o.inv:{};
  o.inv={out:(Array.isArray(iv.out)?iv.out:[]).filter(x=>x&&typeof x.code==='string'&&DATA.codeRe.test(x.code)).slice(0,DATA.invite.maxOut).map(x=>({code:x.code,at:int0(x.at)})),
    in:(Array.isArray(iv.in)?iv.in:[]).filter(x=>x&&strId(x.id)).slice(0,DATA.invite.maxIn).map(x=>({id:strId(x.id),name:cleanName(x.name),at:int0(x.at),lv:lvOf(x.lv),era:eraOf2(x.era)})),
    day:typeof iv.day==='string'?iv.day:'',n:int0(iv.n)};
  o.blocked=(Array.isArray(o.blocked)?o.blocked:[]).map(strId).filter(Boolean).slice(0,200);
  o.leftAt=int0(o.leftAt);
  const d=(o.day&&typeof o.day==='object')?o.day:{};
  o.day={k:typeof d.k==='string'?d.k:'',mine:cnt(d.mine),partner:cnt(d.partner),pDay:d.pDay===true,claimed:d.claimed===true};
  const w=(o.week&&typeof o.week==='object')?o.week:{};
  o.week={k:typeof w.k==='string'?w.k:'',mine:cnt(w.mine),partner:cnt(w.partner),
    days:(Array.isArray(w.days)?w.days:[]).filter(x=>typeof x==='string').slice(0,7),pDays:(Array.isArray(w.pDays)?w.pDays:[]).filter(x=>typeof x==='string').slice(0,7),
    claimed:(Array.isArray(w.claimed)?w.claimed:[]).filter(x=>DATA.weekly.some(m=>m.id===x))};
  const m=(o.msg&&typeof o.msg==='object')?o.msg:{};
  o.msg={last:int0(m.last),lastIdx:Number.isInteger(m.lastIdx)&&m.lastIdx>=0&&m.lastIdx<DATA.phrases.length?m.lastIdx:-1,streak:int0(m.streak),day:typeof m.day==='string'?m.day:'',n:int0(m.n)};
  const okMsg=x=>x&&Number.isInteger(x.idx)&&x.idx>=0&&x.idx<DATA.phrases.length;
  o.inbox=(Array.isArray(o.inbox)?o.inbox:[]).filter(okMsg).slice(-DATA.msg.inbox).map(x=>({idx:x.idx,at:int0(x.at),me:x.me===true}));
  o.outbox=(Array.isArray(o.outbox)?o.outbox:[]).filter(okMsg).slice(-DATA.msg.inbox).map(x=>({idx:x.idx,at:int0(x.at)}));   // fila para o servidor
  return o; }

/* vira o dia / a semana (zera o progresso; o resgate da semana fica por semana) */
function roll(o,host){ const t=nowOf(host), dk=dayKey(t), wk=weekKey(t);
  if(o.day.k!==dk){ o.day={k:dk,mine:zc(),partner:zc(),pDay:false,claimed:false}; }
  if(o.week.k!==wk){ o.week={k:wk,mine:zc(),partner:zc(),days:[],pDays:[],claimed:[]}; }
  if(o.partner&&!o.week.days.includes(dk)) o.week.days.push(dk);   // eu entrei hoje (com dupla)
  return o; }
const S_=(S,host)=>roll(ensure(S),host);

/* ---------------- PROVIDER ---------------- */
/* LOCAL: sem servidor. Convites e frases ficam numa fila do save (outbox / inv.out) que o servidor leva quando ligar; o parceiro e o progresso dele
   chegam por applyServer. Toda regra (limites, cooldown, bloqueio) é conferida AQUI antes de chamar o provider; o servidor confere de novo. */
const localProvider={ online:false,
  invite:(S,host,code)=>({ok:true,queued:true}),
  accept:(S,host,id)=>({ok:true,queued:true}),
  decline:(S,host,id)=>({ok:true}),
  leave:(S,host)=>({ok:true}),
  block:(S,host,id)=>({ok:true}),
  send:(S,host,idx)=>({ok:true,queued:true}),
  claim:(S,host,id)=>({ok:true}),
};
let provider=localProvider;
function setProvider(p){ provider=p&&typeof p==='object'?Object.assign({},localProvider,p):localProvider; return provider.online===true; }
const call=(k,...a)=>{ try{ const r=provider[k](...a); return r&&typeof r==='object'&&typeof r.then!=='function'?r:{ok:true,async:true}; }catch(e){ return {ok:false,reason:'server'}; } };

/* ---------------- portão ---------------- */
function status(S,host){ if(!on()) return {on:false,open:false,reason:'off'}; const o=S_(S,host), nl=needLevel(), lv=levelOf(S,host);
  if(lv<nl) return {on:true,open:false,reason:'level',needLevel:nl};
  return {on:true,open:true,reason:'',needLevel:nl,online:provider.online===true,paired:!!o.partner,relinkLeft:relinkLeft(S,host)}; }
const gate=(S,host)=>{ const st=status(S,host); return st.open?null:{ok:false,reason:st.reason,needLevel:st.needLevel}; };
function relinkLeft(S,host){ const o=ensure(S); return o.leftAt?Math.max(0,o.leftAt+DATA.relinkMs-nowOf(host)):0; }

/* ---------------- vincular ---------------- */
/* convida pelo código do amigo. {ok, reason: off|level|paired|relink|code|self|limit|dup} */
function invite(S,host,code,myCode){ const g=gate(S,host); if(g) return g; const o=S_(S,host), t=nowOf(host), dk=dayKey(t);
  if(o.partner) return {ok:false,reason:'paired'}; if(relinkLeft(S,host)>0) return {ok:false,reason:'relink',ms:relinkLeft(S,host)};
  const c=String(code==null?'':code).trim().toUpperCase(); if(!DATA.codeRe.test(c)) return {ok:false,reason:'code'};
  if(myCode&&String(myCode).toUpperCase()===c) return {ok:false,reason:'self'};
  if(o.inv.day!==dk){ o.inv.day=dk; o.inv.n=0; } o.inv.out=o.inv.out.filter(x=>t-x.at<DATA.invite.ttlMs);
  if(o.inv.out.some(x=>x.code===c)) return {ok:false,reason:'dup'};
  if(o.inv.n>=DATA.invite.perDay||o.inv.out.length>=DATA.invite.maxOut) return {ok:false,reason:'limit'};
  const r=call('invite',S,host,c); if(!r.ok) return r;
  o.inv.n++; o.inv.out.push({code:c,at:t}); changed(host); return {ok:true,code:c,left:DATA.invite.perDay-o.inv.n,queued:!!r.queued}; }
/* convite que CHEGOU (o servidor/provider chama). Bloqueado ou já em dupla: ignora. */
function receiveInvite(S,host,from){ if(!on()) return {ok:false,reason:'off'}; const o=S_(S,host), id=strId(from&&from.id); if(!id) return {ok:false,reason:'id'};
  if(o.blocked.includes(id)) return {ok:false,reason:'blocked'}; if(o.partner) return {ok:false,reason:'paired'};
  const t=nowOf(host); o.inv.in=o.inv.in.filter(x=>t-x.at<DATA.invite.ttlMs&&x.id!==id); o.inv.in.push({id,name:cleanName(from.name),at:t,lv:lvOf(from.lv),era:eraOf2(from.era)}); o.inv.in=o.inv.in.slice(-DATA.invite.maxIn);
  return {ok:true}; }
function accept(S,host,id){ const g=gate(S,host); if(g) return g; const o=S_(S,host), t=nowOf(host); id=strId(id);
  if(o.partner) return {ok:false,reason:'paired'}; if(relinkLeft(S,host)>0) return {ok:false,reason:'relink',ms:relinkLeft(S,host)};
  const iv=o.inv.in.find(x=>x.id===id&&t-x.at<DATA.invite.ttlMs); if(!iv) return {ok:false,reason:'invite'}; if(o.blocked.includes(id)) return {ok:false,reason:'blocked'};
  const r=call('accept',S,host,id); if(!r.ok) return r;
  pair(o,{id,name:iv.name},t); roll(o,host); changed(host); return {ok:true,partner:Object.assign({},o.partner)}; }
function decline(S,host,id){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); id=strId(id); const n0=o.inv.in.length; o.inv.in=o.inv.in.filter(x=>x.id!==id);
  if(n0===o.inv.in.length) return {ok:false,reason:'invite'}; call('decline',S,host,id); changed(host); return {ok:true}; }
function pair(o,p,t){ o.partner={id:p.id,name:cleanName(p.name),since:t,last:int0(p.last),lv:lvOf(p.lv),era:eraOf2(p.era),frame:frameOf(p.frame)}; o.inv={out:[],in:[],day:o.inv.day,n:o.inv.n}; o.inbox=[]; o.outbox=[];
  o.day.partner=zc(); o.day.pDay=false; o.week.partner=zc(); o.week.pDays=[]; }
function unpair(o,t){ o.partner=null; o.leftAt=t; o.inbox=[]; o.outbox=[]; o.day.partner=zc(); o.day.pDay=false; o.week.partner=zc(); o.week.pDays=[]; }
/* sair da dupla (para os dois). Espera 24 h para vincular outro. */
function leave(S,host){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); if(!o.partner) return {ok:false,reason:'none'};
  const r=call('leave',S,host); if(!r.ok) return r; unpair(o,nowOf(host)); changed(host); return {ok:true,relinkMs:DATA.relinkMs}; }
/* bloquear: sai da dupla (se for o parceiro) e esse jogador não convida mais. Funciona também num convite recebido. */
function block(S,host,id){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); id=strId(id)||(o.partner&&o.partner.id); if(!id) return {ok:false,reason:'id'};
  call('block',S,host,id); if(!o.blocked.includes(id)) o.blocked.push(id); o.inv.in=o.inv.in.filter(x=>x.id!==id);
  if(o.partner&&o.partner.id===id) unpair(o,nowOf(host)); changed(host); return {ok:true,id}; }
function unblock(S,host,id){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); id=strId(id); const i=o.blocked.indexOf(id); if(i<0) return {ok:false,reason:'id'}; o.blocked.splice(i,1); return {ok:true}; }

/* ---------------- frases prontas ---------------- */
const phrases=()=>DATA.phrases.map((p,i)=>({idx:i,id:p.id,txt:p.txt}));
const phraseText=i=>Number.isInteger(i)&&DATA.phrases[i]?DATA.phrases[i].txt:'';
/* pode mandar a frase idx agora? {ok, reason: off|level|none|phrase|wait|day|repeat, ms} */
function canSend(S,host,idx){ const g=gate(S,host); if(g) return g; const o=S_(S,host), t=nowOf(host), dk=dayKey(t), M=DATA.msg;
  if(!o.partner) return {ok:false,reason:'none'}; if(!Number.isInteger(idx)||idx<0||idx>=DATA.phrases.length) return {ok:false,reason:'phrase'};
  if(t-o.msg.last<M.cooldownMs) return {ok:false,reason:'wait',ms:M.cooldownMs-(t-o.msg.last)};
  if(o.msg.day===dk&&o.msg.n>=M.perDay) return {ok:false,reason:'day'};
  if(o.msg.lastIdx===idx&&o.msg.streak>=M.repeatMax) return {ok:false,reason:'repeat'};
  return {ok:true}; }
/* manda SÓ pelo índice. Não existe parâmetro de texto. */
function send(S,host,idx){ const c=canSend(S,host,idx); if(!c.ok) return c; const o=ensure(S), t=nowOf(host), dk=dayKey(t);
  const r=call('send',S,host,idx); if(!r.ok) return r;
  if(o.msg.day!==dk){ o.msg.day=dk; o.msg.n=0; } o.msg.n++; o.msg.streak=o.msg.lastIdx===idx?o.msg.streak+1:1; o.msg.lastIdx=idx; o.msg.last=t;
  o.inbox.push({idx,at:t,me:true}); o.inbox=o.inbox.slice(-DATA.msg.inbox); if(r.queued){ o.outbox.push({idx,at:t}); o.outbox=o.outbox.slice(-DATA.msg.inbox); }
  changed(host); return {ok:true,idx,txt:phraseText(idx),left:DATA.msg.perDay-o.msg.n}; }
/* frase que chegou do parceiro (servidor manda só o índice) */
function receive(S,host,idx,at){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); if(!o.partner) return {ok:false,reason:'none'};
  if(!Number.isInteger(idx)||idx<0||idx>=DATA.phrases.length) return {ok:false,reason:'phrase'};
  o.inbox.push({idx,at:int0(at)||nowOf(host),me:false}); o.inbox=o.inbox.slice(-DATA.msg.inbox); return {ok:true,txt:phraseText(idx)}; }

/* ---------------- progresso conjunto ---------------- */
/* o jogo avisa o que o jogador fez: kind ∈ DATA.counters. Conta só com dupla (e com a chave). */
function track(S,host,kind,n){ if(!on()) return 0; if(!DATA.counters.includes(kind)) return 0; const o=S_(S,host); if(!o.partner) return 0; const k=Math.max(1,int0(n==null?1:n));
  const cap=int0(DATA.dayCap&&DATA.dayCap[kind])||Infinity, add=Math.max(0,Math.min(k,cap-o.day.mine[kind])); if(!add) return 0;
  o.day.mine[kind]+=add; o.week.mine[kind]+=add; return add; }
const bothDays=o=>o.week.days.filter(d=>o.week.pDays.includes(d)).length;
const joint=(o,scope,counter)=>counter==='bothDays'?bothDays(o):(o[scope].mine[counter]||0)+(o[scope].partner[counter]||0);
const today=(o)=>o.day.k;
function dailyState(o){ const G=DATA.daily, v=joint(o,'day',G.counter), both=!G.both||(o.partner&&o.day.pDay&&o.week.days.includes(today(o)));
  return {id:G.id,name:G.name,target:G.target,value:Math.min(v,G.target),mine:o.day.mine[G.counter],partner:o.day.partner[G.counter],both:!!both,
    done:v>=G.target&&!!both,claimed:o.day.claimed,reward:G.reward}; }
function weeklyState(o){ return DATA.weekly.map(m=>{ const v=joint(o,'week',m.counter);
  return {id:m.id,name:m.name,target:m.target,value:Math.min(v,m.target),mine:m.counter==='bothDays'?null:o.week.mine[m.counter],
    partner:m.counter==='bothDays'?null:o.week.partner[m.counter],done:v>=m.target,claimed:o.week.claimed.includes(m.id),reward:m.reward}; }); }
const goldUnit=host=>Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
function pay(S,host,rw){ const gold=Math.round(int0(rw.goldK)*goldUnit(host)); if(gold&&host&&typeof host.addGold==='function') host.addGold(gold);
  let stones=0; const F=SYS().forge; if(rw.stones&&F&&typeof F.addStones==='function') stones=int0(F.addStones(S,rw.stones,host));
  return {gold,stones,gems:0}; }
/* resgata o PRÓPRIO prêmio ('daily' ou id da semanal). O parceiro resgata o dele. {ok, reason: off|none|id|done|claimed, reward} */
function claim(S,host,id){ const g=gate(S,host); if(g) return g; const o=S_(S,host); if(!o.partner) return {ok:false,reason:'none'};
  let st, rw;
  if(id==='daily'){ st=dailyState(o); rw=DATA.daily.reward; } else { st=weeklyState(o).find(x=>x.id===id); if(!st) return {ok:false,reason:'id'}; rw=DATA.weekly.find(m=>m.id===id).reward; }
  if(st.claimed) return {ok:false,reason:'claimed'}; if(!st.done&&provider.online!==true) return {ok:false,reason:'done'};
  const r=call('claim',S,host,id); if(!r.ok) return r;
  if(!st.done&&r.server!==true) return {ok:false,reason:'done'};   // online: quem confere a soma e a presença é o servidor (Sys.duoNet); o espelho local pode estar atrasado
  if(id==='daily') o.day.claimed=true; else o.week.claimed.push(id);
  const reward=pay(S,host,rw); changed(host); return {ok:true,id,reward}; }

/* ---------------- espelho do servidor ---------------- */
/* data: {partner:{id,name,last}|null, partnerDay:{kills..}, partnerWeek:{..}, partnerPresent:bool, partnerDays:[dayKey], invites:[{id,name,at}], messages:[{idx,at}]} */
function applyServer(S,host,data){ if(!on()) return {ok:false,reason:'off'}; const o=S_(S,host); if(!data||typeof data!=='object') return {ok:false,reason:'data'}; const t=nowOf(host);
  /* a dupla acabou do outro lado: só QUEM SAIU espera 24 h (servidor, API_SERVIDOR §16); quem ficou pode vincular outro na hora. data.leftAt só vem quando fui eu que saí */
  if(data.partner===null){ if(o.partner) unpair(o,int0(data.leftAt)||0); }
  else if(data.partner&&strId(data.partner.id)){ const id=strId(data.partner.id); if(o.blocked.includes(id)) return {ok:false,reason:'blocked'};
    if(!o.partner||o.partner.id!==id){ pair(o,data.partner,int0(data.partner.since)||t); roll(o,host); } o.partner.name=cleanName(data.partner.name||o.partner.name); o.partner.last=int0(data.partner.last); if('lv' in data.partner) o.partner.lv=lvOf(data.partner.lv); if('era' in data.partner) o.partner.era=eraOf2(data.partner.era); if('frame' in data.partner) o.partner.frame=frameOf(data.partner.frame); }
  if(o.partner){ if(data.partnerDay) o.day.partner=cnt(data.partnerDay); if(data.partnerWeek) o.week.partner=cnt(data.partnerWeek);
    if(data.partnerPresent===true){ o.day.pDay=true; if(!o.week.pDays.includes(o.day.k)) o.week.pDays.push(o.day.k); }
    if(Array.isArray(data.partnerDays)) o.week.pDays=data.partnerDays.filter(x=>typeof x==='string').slice(0,7);
    if(Array.isArray(data.messages)) for(const m of data.messages) receive(S,host,m&&m.idx,m&&m.at);
    if(data.sent===true) o.outbox=[]; }
  if(Array.isArray(data.invites)) for(const x of data.invites) receiveInvite(S,host,x);
  return {ok:true,paired:!!o.partner}; }

/* ---------------- tela ---------------- */
function view(S,host){ const st=status(S,host); if(!st.on) return {on:false}; const o=S_(S,host), t=nowOf(host);
  return {on:true,open:st.open,reason:st.reason,needLevel:st.needLevel,online:provider.online===true,
    partner:o.partner?Object.assign({},o.partner):null,relinkLeft:relinkLeft(S,host),
    invitesIn:o.inv.in.filter(x=>t-x.at<DATA.invite.ttlMs).map(x=>Object.assign({},x)),invitesOut:o.inv.out.filter(x=>t-x.at<DATA.invite.ttlMs).length,
    invitesLeft:Math.max(0,DATA.invite.perDay-(o.inv.day===dayKey(t)?o.inv.n:0)),
    daily:dailyState(o),weekly:weeklyState(o),
    phrases:phrases(),chat:o.inbox.map(m=>({txt:phraseText(m.idx),idx:m.idx,at:m.at,me:m.me})),
    msgLeft:Math.max(0,DATA.msg.perDay-(o.msg.day===dayKey(t)?o.msg.n:0)),blocked:o.blocked.length}; }

const API={DATA,on,setOn,ensure,status,setProvider,localProvider,get provider(){ return provider; },
  invite,receiveInvite,accept,decline,leave,block,unblock,relinkLeft,phrases,phraseText,canSend,send,receive,track,claim,applyServer,view};
root.Sys=root.Sys||{}; root.Sys.duo=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
