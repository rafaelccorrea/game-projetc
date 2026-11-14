/* Eonbound — Sys.thiefNet: liga o LADRÃO DE BRASAS (Sys.thief) ao SERVIDOR (contrato docs/API_SERVIDOR.md §15; fps-server 3f653d8, chave THIEF_ON).
   CHAVE DESLIGADA: DATA.on=false → nada sai daqui e o Sys.thief segue LOCAL (nada muda no jogo).

   Mesmo padrão do Sys.duoNet / Sys.guildNet (regra §1 assíncrono × síncrono):
   - start(S, host): GET /thief → Sys.thief.applyServer e liga o provider online do Sys.thief. Falhou (sem rede, THIEF_ON desligado = 404): fica o local.
   - refresh(S, host): GET /thief → applyServer (entradas do dia, melhor nível vencido, corrida aberta). 404 com o online ligado = o servidor desligou
     o Ladrão: volta ao local.
   - AÇÕES (Promise), mesmo formato de resposta do Sys.thief síncrono, para a tela trocar só a chamada:
     enter(S,host) → POST /thief/enter (gasta 1 entrada NO SERVIDOR) → Sys.thief.serverEnter (runId, lote do servidor). O servidor NÃO manda a vida do
       saco: o serverEnter calcula run.bagHp igual ao enter local (herói e Fogueira na hora do enter) e a fuga pela seed do servidor; run.endsAt do
       servidor é o limite do relógio da luta. A resposta traz bagHp, escapeAt, escapeEvery, escapeDur, jitter e escapes para a tela passar à luta;
     finish(S,host,score) → POST /thief/finish {runId, score} → Sys.thief.serverFinish (credita as Brasas do servidor UMA vez por runId) → refresh;
     sweep(S,host) → POST /thief/sweep → Sys.thief.serverSweep (credita o lote cheio do melhor nível vencido).
     Erro: {ok:false, reason, details, retryAfterMs, local} (reason = código do servidor; local = a palavra do Sys.thief para a tela:
     daily_limit → 'entries', nothing_to_sweep → 'none').
   - Com o online ligado, o Sys.thief.enter/finish/sweep síncrono devolve {ok:false, reason:'online'}: o módulo não gasta entrada sozinho.
   Regras combinadas com o servidor: a entrada é gasta AO ENTRAR (sair no meio não devolve); o finish paga round(lote do nível na entrada × score) e
   não gasta outra entrada; score 1 vence o nível; o sweep gasta 1 entrada e paga o lote cheio do melhor nível vencido. O SERVIDOR decide; as Brasas
   entram pelo Sys.bonfire.addBrasas(S,'thief',n). Teste: test/sys/thiefnet.test.js */
(function(root){
'use strict';

const DATA={ on:false };   // DESLIGADA até o voto do dono na tela do Ladrão (e THIEF_ON=1 no servidor)
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const LOCAL={daily_limit:'entries',nothing_to_sweep:'none',already_finished:'run',expired:'run',too_fast:'run'};
const ST={ started:false, data:null, err:null, at:0, busy:{} };
const fail=e=>{ ST.err=(e&&e.code)||'error';
  return {ok:false,reason:ST.err,details:(e&&e.details)||null,retryAfterMs:(e&&e.retryAfterMs)||0,local:LOCAL[ST.err]||ST.err}; };
const T=()=>SYS().thief;
const provider={ online:true };

async function refresh(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const M=T(); if(!M||typeof M.applyServer!=='function') return {ok:false,reason:'module'};
  let d; try{ d=await call('GET','/thief'); }catch(e){ if(ST.started&&e&&e.code==='not_found') stop(); return fail(e); }
  if(!d||typeof d!=='object') return {ok:false,reason:'data'};
  const r=M.applyServer(S,host,d); if(!r.ok) return r;
  ST.data=d; ST.err=null; ST.at=Date.now();
  if(host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,left:r.left,best:r.best,run:r.run}; }

async function start(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const M=T(); if(!M||typeof M.setProvider!=='function') return {ok:false,reason:'module'};
  const r=await refresh(S,host); if(!r.ok) return r;   // sem rede / THIEF_ON desligado (404): fica o local
  M.setProvider(provider); ST.started=true; return {ok:true,left:r.left,best:r.best}; }
function stop(){ const M=T(); if(M&&M.setProvider) M.setProvider(null); ST.started=false; ST.busy={}; }

/* uma ação de cada vez (dois toques não pagam duas vezes) */
async function once(k,fn){ if(ST.busy[k]) return {ok:false,reason:'busy'}; ST.busy[k]=true; try{ return await fn(); } finally{ delete ST.busy[k]; } }

/* ENTRAR: o servidor gasta a entrada e devolve o runId e o lote. Sem entrada: 429 daily_limit (retryAfterMs = até a virada de Brasília) */
function enter(S,host){ if(!ST.started) return Promise.resolve({ok:false,reason:'off'});
  return once('run',async()=>{ const M=T(), o=M.ensure(S);
    if(o.run) return {ok:false,reason:'run'};   // termine ou saia da corrida aberta antes
    let r; try{ r=await call('POST','/thief/enter'); }
    catch(e){ const f=fail(e); await refresh(S,host).catch(()=>null); return f; }   // daily_limit: o refresh deixa as entradas iguais às do servidor
    const out=M.serverEnter(S,host,r); if(host&&typeof host.onChange==='function') host.onChange(); return out; }); }

/* FIM: score 0..1. O servidor paga round(lote × score), uma vez por corrida; o jogo credita UMA vez (Sys.thief.serverFinish, por runId) */
function finish(S,host,score){ if(!ST.started) return Promise.resolve({ok:false,reason:'off'});
  return once('run',async()=>{ const M=T(), o=M.ensure(S), run=o.run;
    if(!run||!run.id) return {ok:false,reason:'run'};
    const id=run.id, sc=Math.max(0,Math.min(1,num(score,0)));
    let r; try{ r=await call('POST','/thief/finish',{runId:id,score:sc}); }
    catch(e){ const f=fail(e);
      /* corrida que o servidor já fechou (already_finished, expired, runId desconhecido): sai dela sem pagar. too_fast e rede: a corrida fica para tentar de novo */
      /* reenvio (a resposta do 1º finish se perdeu): o 409 already_finished traz details {brasas, total} = o que ESTA corrida pagou. Credita uma vez (paid por runId) */
      const d=f.details&&typeof f.details==='object'?f.details:null;
      if(f.reason==='already_finished'&&d&&d.brasas!=null){ const out=M.serverFinish(S,host,id,{brasas:d.brasas,score:sc});
        await refresh(S,host).catch(()=>null); if(out.ok){ out.recovered=true; out.best=M.ensure(S).best; out.left=M.view(S,host).left; out.total=d.total; } return out; }
      if(f.reason==='already_finished'||f.reason==='expired'||f.reason==='not_found'){ const x=M.ensure(S); if(x.run&&x.run.id===id) x.run=null; await refresh(S,host).catch(()=>null); }
      return f; }
    const out=M.serverFinish(S,host,id,r); if(!out.ok) return out;
    await refresh(S,host).catch(()=>null);   // melhor nível e entradas iguais aos do servidor
    out.best=M.ensure(S).best; out.left=M.view(S,host).left; out.total=r&&r.total; return out; }); }

/* REPETIR: gasta 1 entrada no servidor e paga o lote cheio do melhor nível vencido. 409 nothing_to_sweep, 429 daily_limit */
function sweep(S,host){ if(!ST.started) return Promise.resolve({ok:false,reason:'off'});
  return once('run',async()=>{ const M=T();
    if(M.ensure(S).run) return {ok:false,reason:'run'};
    let r; try{ r=await call('POST','/thief/sweep'); }
    catch(e){ const f=fail(e); await refresh(S,host).catch(()=>null); return f; }
    const out=M.serverSweep(S,host,r); if(out.ok){ out.total=r&&r.total; if(host&&typeof host.onChange==='function') host.onChange(); } return out; }); }

const API={DATA,provider,start,stop,refresh,enter,finish,sweep,
  state:()=>({on:DATA.on===true,started:ST.started,err:ST.err,at:ST.at,
    resetsInMs:ST.data?ST.data.resetsInMs:null,perDay:ST.data?ST.data.perDay:null,lastReward:ST.data?ST.data.lastReward:null}),
  _reset(){ ST.started=false; ST.data=null; ST.err=null; ST.at=0; ST.busy={}; } };
root.Sys=root.Sys||{}; root.Sys.thiefNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
