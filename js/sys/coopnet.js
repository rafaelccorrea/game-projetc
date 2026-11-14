/* Eonbound — Sys.coopNet: liga as RUÍNAS EM TRIO (Sys.coop) ao SERVIDOR (contrato docs/SERVIDOR_LOM.md §3.3; fps-server src/coop, chave COOP_ON).
   CHAVE DESLIGADA: DATA.on=false → nada sai daqui e o Sys.coop segue com o provider LOCAL (o jogador + 2 retratos de mentira, crédito na hora).
   Mesmo padrão do Sys.duoNet / Sys.arenaNet:
   - start(S, host): GET /coop/status → Sys.coop.applyStatus e TROCA o provider do Sys.coop pelo online. Falhou (sem rede; COOP_ON desligado = 404):
     fica o local e devolve {ok:false, reason}.
   - refresh(S, host): GET /coop/status de novo (grupo, convites, frases, entradas, última corrida). 404 com o online ligado = o servidor desligou:
     volta ao local.
   - AÇÕES (Promise, sempre {ok:true, ...} ou {ok:false, reason, retryAfterMs}): create(), invite({friendCode}|{guildMemberId}), join(partyId), leave(),
     say(idx). Cada uma confere ANTES a regra local (formato do código, frase por índice, 5 s entre frases) e depois faz refresh.
   - A CORRIDA: Sys.coop.start(S, host) com o provider online devolve uma Promise: POST /coop/start (só o líder). A resposta passa por
     Sys.coop.applyResult; com mailed:true o prêmio chega PELO CORREIO (carta source 'coop') e nada é creditado aqui (sem crédito duplo).
   Regras: nenhuma função aceita TEXTO (frase só pelo índice da Dupla); nada pago (entradas grátis, 2 por dia); nada aqui sorteia.
   Erros do servidor viram reason com a mesma palavra do contrato: level, in_party, no_party, not_leader, code, not_guild, full, not_invited, party,
   limit, bad_idx, snapshot_required; sem rede = net_off/offline; COOP_ON desligado = not_found. Texto da tela: Sys.coop.why(reason).
   Sem DOM. Teste: test/sys/coopnet.test.js */
(function(root){
'use strict';

const DATA={ on:false };   // DESLIGADA até o voto do dono na tela (e COOP_ON=1 no servidor)
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const C=()=>SYS().coop;
const ST={ started:false, err:null, at:0 };
const codeOf=e=>(e&&(e.code||(e.status===404?'not_found':e.status===429?'limit':null)))||'error';   /* 429 sem code = limit */
const fail=e=>{ ST.err=codeOf(e); return {ok:false,reason:ST.err,details:(e&&e.details)||null,retryAfterMs:int0(e&&e.retryAfterMs)}; };
const ready=()=>{ if(DATA.on!==true) return 'off'; const c=C(); if(!c||typeof c.applyStatus!=='function'||!c.on()) return 'off'; return ''; };
const local=()=>{ const c=C(); if(c&&typeof c.setProvider==='function') c.setProvider(null); ST.started=false; };

/* provider ONLINE do Sys.coop: a corrida é do SERVIDOR (POST /coop/start, só o líder). Devolve Promise. */
const provider={ online:true,
  start(S,host){ return (async()=>{ let res; try{ res=await call('POST','/coop/start',{}); }catch(e){ return fail(e); }
    if(!res||typeof res!=='object'||!res.runId) return {ok:false,reason:'data'};
    const ap=C().applyResult(S,host,res); await refresh(S,host).catch(()=>null);
    return Object.assign({},res,{ok:true,mailed:res.mailed===true,applied:ap}); })(); } };

/* GET /coop/status → Sys.coop.applyStatus. {ok, lastRun} */
async function refresh(S,host){ const r0=ready(); if(r0) return {ok:false,reason:r0};
  let d; try{ d=await call('GET','/coop/status'); }catch(e){ const f=fail(e); if(f.reason==='not_found'&&ST.started) local(); return f; }
  const r=C().applyStatus(S,host,d); ST.at=Date.now(); ST.err=null; return r; }
/* liga: lê o estado e troca o provider. Falhou = fica o local. */
async function start(S,host){ const r0=ready(); if(r0) return {ok:false,reason:r0};
  let d; try{ d=await call('GET','/coop/status'); }catch(e){ local(); return fail(e); }
  C().applyStatus(S,host,d); C().setProvider(provider); ST.started=true; ST.at=Date.now(); ST.err=null; return {ok:true}; }
const need=()=>{ const r0=ready(); if(r0) return r0; return ST.started?'':'offline'; };
/* ação genérica: confere, chama, refresh */
async function act(S,host,method,path,body,extra){ const r0=need(); if(r0) return {ok:false,reason:r0};
  let r; try{ r=await call(method,path,body); }catch(e){ return fail(e); }
  await refresh(S,host).catch(()=>null); return Object.assign({ok:true},extra||{},r&&typeof r==='object'?r:{}); }

/* POST /coop/party: cria o grupo (o jogador vira líder). Antes: status aberto (nível 30). */
async function create(S,host){ const st=C()&&C().status(S,host); if(!st||!st.open) return {ok:false,reason:(st&&st.reason)||'off'}; return act(S,host,'POST','/coop/party',{}); }
/* POST /coop/party/invite {friendCode} ou {guildMemberId}: confere o formato com Sys.coop.canInvite antes (nunca manda texto livre) */
async function invite(S,host,who){ const c=C(); if(!c) return {ok:false,reason:'off'}; who=who||{}; const v=c.canInvite(S,host,who); if(!v.ok) return v;
  const body=v.by==='code'?{friendCode:v.code}:{guildMemberId:String(who.guildMemberId)}; return act(S,host,'POST','/coop/party/invite',body); }
/* POST /coop/party/:id/join (aceitar convite: invites[].partyId) */
async function join(S,host,partyId){ const id=typeof partyId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(partyId)?partyId:''; if(!id) return {ok:false,reason:'party'};
  return act(S,host,'POST','/coop/party/'+encodeURIComponent(id)+'/join',{}); }
/* POST /coop/party/leave (a vaga vira o retrato de quem saiu) */
async function leave(S,host){ return act(S,host,'POST','/coop/party/leave',{}); }
/* POST /coop/party/phrase {idx}: frase pronta da Dupla, só o ÍNDICE. Antes: Sys.coop.canSay (5 s entre frases, 20 por dia). */
async function say(S,host,idx){ const c=C(); if(!c) return {ok:false,reason:'off'}; const v=c.canSay(S,host,idx); if(!v.ok) return v; const r0=need(); if(r0) return {ok:false,reason:r0};
  try{ await call('POST','/coop/party/phrase',{idx}); }catch(e){ const f=fail(e); if(f.reason==='limit') c.markLimit(S,host,f.details&&f.details.key); return f; }   /* 429: key 'day' trava até amanhã; a outra key (5 s) só o intervalo */ c.markSaid(S,host); await refresh(S,host).catch(()=>null); return {ok:true,idx}; }

/* id do jogador logado (para saber se sou o líder): Sys.net.player().id */
function myId(){ try{ const N=SYS().net, p=N&&typeof N.player==='function'?N.player():null; return p&&p.id?String(p.id):''; }catch(e){ return ''; } }
/* modelo da tela com o online: o view do Sys.coop + leader (sou o líder?), myId, started, err */
function view(S,host){ const c=C(); if(!c) return {on:false,open:false,reason:'off'}; const v=c.view(S,host); if(!v||!v.open) return v; const me=myId(), p=v.party;
  return Object.assign({},v,{myId:me,leader:!!(p&&me&&p.leaderId===me),started:ST.started,err:ST.err}); }
function state(){ return {on:DATA.on===true,started:ST.started,err:ST.err,at:ST.at}; }
function _reset(){ ST.started=false; ST.err=null; ST.at=0; }

const API={DATA,provider,start,refresh,create,invite,join,leave,say,view,myId,state,_reset};
root.Sys=root.Sys||{}; root.Sys.coopNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
