/* Eonbound — Sys.duoNet: liga a DUPLA DAS ERAS (Sys.duo) ao SERVIDOR (contrato docs/API_SERVIDOR.md §16.1; fps-server 81f2662/5023345, chave DUO_ON).
   CHAVE DESLIGADA: DATA.on=false → nada sai daqui e o Sys.duo segue com o provider LOCAL (nada muda no jogo).

   Mesmo padrão do Sys.guildNet / Sys.arenaNet (regra §1 assíncrono × síncrono):
   - start(S, host): GET /duo → Sys.duo.applyServer e TROCA o provider do Sys.duo pelo online. Falhou (sem rede, DUO_ON desligado = 404): fica o local.
   - refresh(S, host): manda o progresso do dia (POST /duo/progress com os TOTAIS do dia, só se mudou) e lê GET /duo → applyServer + reflect
     (leftAt/relinkLeftMs, resgates do dia/semana, meus contadores). 404 com o online já ligado = o servidor desligou a dupla: volta ao local.
   - AÇÕES (Promise): invite(code), accept(id), decline(id), leave(), block(id), send(idx), claim(id). O SERVIDOR decide primeiro; só com o ok
     dele a mesma função síncrona do Sys.duo roda (o provider online devolve a autorização guardada, como o fight do Sys.arenaNet) e depois o
     refresh deixa o save igual ao servidor. Erro: {ok:false, reason, details, retryAfterMs}.
   - Com o online ligado, chamar o Sys.duo.* síncrono direto devolve {ok:false, reason:'online'} (sem autorização do servidor): a tela usa o Sys.duoNet.
   Regras combinadas (servidor + PO):
   - Todo id das rotas é o CÓDIGO DE AMIGO (partner.id, invites[].id), nunca id interno.
   - Frase vai SÓ como {idx} 0-17; não existe parâmetro de texto em nenhuma função daqui.
   - Só QUEM SAIU espera 24 h: o servidor manda leftAt só para quem saiu e ainda espera (0 = sem espera, nunca vira "agora").
   - Resgate: o servidor AUTORIZA (soma dos dois, presença, 1 por período) e o Sys.duo PAGA uma vez (§16.1 "o jogo paga"). Sem autorização não
     paga; 409 claimed marca o resgate sem pagar; nada credita duas vezes. Teste: test/sys/duonet.test.js */
(function(root){
'use strict';

const DATA={ on:false, progressMinMs:60000 };   // DESLIGADA até o voto do dono nas telas (e DUO_ON=1 no servidor)
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const enc=encodeURIComponent;
const ST={ started:false, data:null, code:null, err:null, at:0, pending:{}, prog:'', progAt:0 };
const fail=e=>{ ST.err=(e&&e.code)||'error'; return {ok:false,reason:ST.err,details:(e&&e.details)||null,retryAfterMs:(e&&e.retryAfterMs)||0}; };
const D=()=>SYS().duo;

/* provider ONLINE do Sys.duo: só responde ok com a autorização que o servidor acabou de dar (ST.pending[kind]) */
const auth=k=>()=>ST.pending[k]||{ok:false,reason:'online'};
const provider={ online:true, invite:auth('invite'), accept:auth('accept'), decline:auth('decline'), leave:auth('leave'), block:auth('block'),
  send:auth('send'), claim:auth('claim') };
async function withAuth(k,r,fn){ ST.pending[k]=Object.assign({ok:true,server:true},r&&typeof r==='object'?r:{}); try{ return fn(); } finally{ delete ST.pending[k]; } }

/* o que o applyServer do Sys.duo não espelha: espera de 24 h, resgates do período e os meus contadores (o servidor guarda o maior) */
function reflect(S,host,d){ const o=D().ensure(S), t=nowOf(host), rl=D().DATA.relinkMs;
  const left=int0(d.leftAt);   // 0 = sem espera (quem ficou, ou já passou das 24 h): NUNCA vira "agora"
  o.leftAt=left>0?(int0(d.relinkLeftMs)>0?Math.max(1,t+int0(d.relinkLeftMs)-rl):left):0;   // pelo relinkLeftMs: imune à diferença de relógio
  const c=d.claimed&&typeof d.claimed==='object'?d.claimed:null;
  if(c&&d.day===o.day.k&&c.daily===true) o.day.claimed=true;   // nunca "desresgata" (isso pagaria de novo)
  if(c&&d.week===o.week.k&&Array.isArray(c.weekly)) for(const id of c.weekly) if(D().DATA.weekly.some(m=>m.id===id)&&!o.week.claimed.includes(id)) o.week.claimed.push(id);
  if(o.partner){ const ks=D().DATA.counters;
    if(d.day===o.day.k&&d.myDay) for(const k of ks) o.day.mine[k]=Math.max(o.day.mine[k],int0(d.myDay[k]));
    if(d.week===o.week.k&&d.myWeek) for(const k of ks) o.week.mine[k]=Math.max(o.week.mine[k],int0(d.myWeek[k]));
    if(d.week===o.week.k&&Array.isArray(d.myDays)) for(const x of d.myDays) if(typeof x==='string'&&!o.week.days.includes(x)&&o.week.days.length<7) o.week.days.push(x); } }

/* POST /duo/progress: os TOTAIS do dia (reenviar não soma). Só com dupla e se mudou (no máximo 1 a cada progressMinMs, salvo force). */
async function pushProgress(S,host,force){ if(DATA.on!==true) return {ok:false,reason:'off'}; const Du=D(); if(!Du||!Du.on()) return {ok:false,reason:'off'};
  const o=Du.ensure(S); if(!o.partner||!o.day.k) return {ok:true,sent:false};
  const body={}; for(const k of Du.DATA.counters) body[k]=int0(o.day.mine[k]); body.day=o.day.k;
  const key=JSON.stringify(body), t=Date.now(); if(key===ST.prog) return {ok:true,sent:false}; if(!force&&t-ST.progAt<DATA.progressMinMs) return {ok:true,sent:false,later:true};
  try{ const r=await call('POST','/duo/progress',body); ST.prog=key; ST.progAt=t; return {ok:true,sent:true,capped:!!(r&&r.capped)}; }catch(e){ return fail(e); } }

async function refresh(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const Du=D(); if(!Du||typeof Du.applyServer!=='function') return {ok:false,reason:'module'};
  if(ST.started) await pushProgress(S,host,true).catch(()=>null);
  let d; try{ d=await call('GET','/duo'); }catch(e){ if(ST.started&&e&&e.code==='not_found') stop(); return fail(e); }
  if(!d||typeof d!=='object') return {ok:false,reason:'data'};
  const r=Du.applyServer(S,host,d); if(!r.ok) return r;
  reflect(S,host,d); ST.data=d; if(typeof d.code==='string') ST.code=d.code; ST.err=null; ST.at=Date.now();
  if(host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,paired:r.paired}; }

async function start(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const Du=D(); if(!Du||typeof Du.setProvider!=='function') return {ok:false,reason:'module'};
  const r=await refresh(S,host); if(!r.ok) return r;   // sem rede / DUO_ON desligado (404): fica o provider local
  Du.setProvider(provider); ST.started=true; return {ok:true,paired:r.paired}; }
function stop(){ const Du=D(); if(Du&&Du.setProvider) Du.setProvider(null); ST.started=false; ST.pending={}; }

/* GET /v1/me/friend-code → {code} (o meu código, para mostrar e passar como myCode no convite) */
async function friendCode(){ if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call('GET','/me/friend-code'); ST.code=r&&typeof r.code==='string'?r.code:ST.code; return {ok:true,code:ST.code}; }catch(e){ return fail(e); } }

/* ação genérica: servidor → (ok) a função do Sys.duo com a autorização → refresh */
async function act(S,host,k,m,path,body,local){
  if(!ST.started) return {ok:false,reason:'off'};
  let r; try{ r=await call(m,path,body); }catch(e){ return fail(e); }
  const out=await withAuth(k,r,local); await refresh(S,host);
  return Object.assign({},r&&typeof r==='object'?r:{},out&&typeof out==='object'?out:{},{ok:true,server:r||null,local:out||null}); }

const codeOk=c=>{ const Du=D(); const x=String(c==null?'':c).trim().toUpperCase(); return Du&&Du.DATA.codeRe.test(x)?x:null; };
async function invite(S,host,code){ const c=codeOk(code); if(!c) return {ok:false,reason:'code'};
  return act(S,host,'invite','POST','/duo/invite',{code:c},()=>D().invite(S,host,c,ST.code)); }
async function accept(S,host,id){ const c=codeOk(id); if(!c) return {ok:false,reason:'invite'};
  return act(S,host,'accept','POST','/duo/accept/'+enc(c),undefined,()=>D().accept(S,host,c)); }   // o refresh pareia mesmo se o convite local faltar
async function decline(S,host,id){ const c=codeOk(id); if(!c) return {ok:false,reason:'invite'};
  return act(S,host,'decline','POST','/duo/decline/'+enc(c),undefined,()=>D().decline(S,host,c)); }
async function leave(S,host){ return act(S,host,'leave','POST','/duo/leave',undefined,()=>D().leave(S,host)); }
async function block(S,host,id){ const o=D()&&D().ensure(S), c=codeOk(id!=null?id:(o&&o.partner&&o.partner.id)); if(!c) return {ok:false,reason:'id'};
  return act(S,host,'block','POST','/duo/block/'+enc(c),undefined,()=>D().block(S,host,c)); }
/* frase: SÓ o índice. O corpo é exatamente {idx}. */
async function send(S,host,idx){ if(!ST.started) return {ok:false,reason:'off'}; const Du=D();
  const c=Du.canSend(S,host,idx); if(!c.ok) return c;   // as mesmas regras (5 s, 30/dia, 2 seguidas) antes de gastar rede
  let r; try{ r=await call('POST','/duo/phrase',{idx}); }catch(e){ return fail(e); }
  return withAuth('send',r,()=>Du.send(S,host,idx)); }
/* resgate: com mailed:true o servidor credita pelo correio e o jogo só marca; sem mailed (servidor antigo), o servidor autoriza e o Sys.duo paga UMA vez. 409 claimed: marca sem pagar. */
async function claim(S,host,id){ if(!ST.started) return {ok:false,reason:'off'}; const Du=D(), o=Du.ensure(S);
  if(id==='daily'?o.day.claimed:o.week.claimed.includes(id)) return {ok:false,reason:'claimed'};
  let r; try{ r=await call('POST','/duo/claim/'+enc(String(id)),undefined); }
  catch(e){ const f=fail(e); if(f.reason==='claimed'){ await refresh(S,host); if(id==='daily') o.day.claimed=true; else if(Du.DATA.weekly.some(m=>m.id===id)&&!o.week.claimed.includes(id)) o.week.claimed.push(id); } return f; }
  await refresh(S,host);   // traz a soma e a presença do servidor antes de pagar
  /* PO (de9f83c): com mailed:true o SERVIDOR credita pelo correio (carta source duo, att goldk/forge); o jogo só marca resgatado e NÃO paga */
  if(r&&r.mailed===true){ if(id==='daily') o.day.claimed=true; else if(!o.week.claimed.includes(id)) o.week.claimed.push(id);
    return {ok:true,id,mailed:true,reward:r.reward||null,paid:false,period:r.period,value:r.value,target:r.target}; }
  const out=await withAuth('claim',r,()=>Du.claim(S,host,id));
  return Object.assign({},out,{period:r&&r.period,value:r&&r.value,target:r&&r.target}); }

const API={DATA,provider,start,stop,refresh,pushProgress,friendCode,invite,accept,decline,leave,block,send,claim,
  state:()=>({on:DATA.on===true,started:ST.started,err:ST.err,at:ST.at,code:ST.code,
    invitesLeft:ST.data?ST.data.invitesLeft:null,msgLeft:ST.data?ST.data.msgLeft:null,cap:ST.data?ST.data.cap:null}),
  _reset(){ ST.started=false; ST.data=null; ST.code=null; ST.err=null; ST.at=0; ST.pending={}; ST.prog=''; ST.progAt=0; } };
root.Sys=root.Sys||{}; root.Sys.duoNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
