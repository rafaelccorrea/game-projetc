/* Eonbound — Sys.guildFireNet: liga a FOGUEIRA DA GUILDA (Sys.guildFire) ao SERVIDOR (contrato docs/API_SERVIDOR.md §16.2; fps-server 679191b e
   seguintes, chave GUILDFIRE_ON). CHAVE DESLIGADA: DATA.on=false → nada sai daqui e o Sys.guildFire segue com o provider LOCAL (só as chamas deste
   aparelho). Liga pelo SYS_LIVE (o sysLive põe DATA.on = true; não há setOn), como o Sys.duoNet.

   Mesmo padrão do Sys.guildNet / Sys.duoNet (regra §1 assíncrono × síncrono):
   - start(S, host): GET /guild/fire → Sys.guildFire.applyServer e TROCA o provider do Sys.guildFire pelo online. Falhou (sem rede, GUILDFIRE_ON
     desligado = 404): fica o local. 403 not_in_guild = o servidor está ligado e o jogador não tem guilda: inicia (a aba diz "entre numa guilda").
   - refresh(S, host): GET /guild/fire → applyServer (chamas somadas de todos, grátis de hoje, Brasas de hoje, minhas chamas). 404 com o online já
     ligado = o servidor desligou a fogueira: volta ao local.
   - feed(S, host, n): n = 0 é o alimentar GRÁTIS do dia; n > 0 = dar n Brasas suas. Confere as regras locais antes de gastar rede; o SERVIDOR decide
     primeiro (POST /guild/fire/feed {kind, n}); só com o ok dele o Sys.guildFire.contribute roda (o provider online devolve a autorização guardada)
     e gasta as Brasas UMA vez. Devolve {ok, kind, flames (somadas agora), total, level, levelUp, chestsMailed, braLeft} ou
     {ok:false, reason, details, retryAfterMs}. reason: off, guild, done (grátis já feito hoje), day (limite de Brasas do dia), hook, brasas,
     brasas_over, brasas_unverified, net_off, timeout... (429 daily_limit do servidor vira done/day, com o retryAfterMs).
   - BAÚS: o servidor manda SOZINHO ao correio de cada membro quando a guilda sobe de nível (PO 14/11). Aqui NADA credita: o feed só conta
     chestsMailed, e com o online ligado o Sys.guildFire.claim recusa ('mailed'). Sem DOM. Teste: test/sys/guildfirenet.test.js */
(function(root){
'use strict';

const DATA={ on:false };   // DESLIGADA até o dono ligar a Fogueira (SYS_LIVE.guildFireNet) e o servidor estar com GUILDFIRE_ON=1
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ST={ started:false, data:null, inGuild:false, err:null, at:0, pending:null };
const fail=e=>{ ST.err=(e&&e.code)||'error'; return {ok:false,reason:ST.err,details:(e&&e.details)||null,retryAfterMs:(e&&e.retryAfterMs)||0}; };
const F=()=>SYS().guildFire;

/* provider ONLINE do Sys.guildFire: só responde ok com a autorização que o servidor acabou de dar (ST.pending, com o total de chamas dele) */
const provider={ online:true, feed:()=>ST.pending||{ok:false,reason:'online'} };

/* GET /guild/fire (ou a resposta do feed, que traz o mesmo formato) → Sys.guildFire.applyServer */
function mirror(S,host,d){ if(!d||typeof d!=='object'||d.guildId==null) return {ok:false,reason:'data'};
  return F().applyServer(S,host,{guildId:d.guildId,flames:int0(d.flames),free:d.free===true,bra:int0(d.bra),mine:d.mine}); }

async function refresh(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const G=F(); if(!G||typeof G.applyServer!=='function') return {ok:false,reason:'module'};
  if(!G.on()) return {ok:false,reason:'off'};
  let d; try{ d=await call('GET','/guild/fire'); }
  catch(e){ if(e&&e.code==='not_in_guild'){ ST.data=null; ST.inGuild=false; ST.err=null; ST.at=Date.now(); return {ok:true,inGuild:false}; }
    if(ST.started&&e&&e.code==='not_found') stop(); return fail(e); }
  if(!d||typeof d!=='object') return {ok:false,reason:'data'};
  ST.data=d; ST.inGuild=true; ST.err=null; ST.at=Date.now();
  const r=mirror(S,host,d);   // 'guild': o Sys.guild ainda não tem esta guilda (o Sys.guildNet não terminou): o próximo refresh espelha
  if(r.ok&&host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,inGuild:true,applied:r.ok===true,level:r.level}; }

async function start(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const G=F(); if(!G||typeof G.setProvider!=='function') return {ok:false,reason:'module'};
  const r=await refresh(S,host); if(!r.ok) return r;   // sem rede / GUILDFIRE_ON desligado (404) / módulo desligado: fica o provider local
  G.setProvider(provider); ST.started=true; return {ok:true,inGuild:r.inGuild}; }
function stop(){ const G=F(); if(G&&G.setProvider) G.setProvider(null); ST.started=false; ST.pending=null; }

/* alimentar: n = 0 grátis; n > 0 Brasas. As mesmas regras do Sys.guildFire ANTES de gastar rede; depois o servidor; com o ok dele, o contribute. */
async function feed(S,host,n){
  if(!ST.started) return {ok:false,reason:'off'};
  const G=F(), k=int0(n), kind=k?'brasa':'free';
  const st=G.status(S,host); if(!st.open) return {ok:false,reason:st.reason||'off'};
  if(!k&&!st.free) return {ok:false,reason:'done'};
  if(k){ if(k>int0(st.braLeft)) return {ok:false,reason:'day',left:int0(st.braLeft)}; if(!st.hook) return {ok:false,reason:'hook'};
    let have=0; try{ have=int0(SYS().bonfire.ensure(S).bra); }catch(e){ have=0; } if(have<k) return {ok:false,reason:'brasas',have}; }
  let r; try{ r=await call('POST','/guild/fire/feed',{kind,n:k}); }
  catch(e){ const f=fail(e);
    if(f.reason==='daily_limit'){ f.reason=k?'day':'done'; await refresh(S,host).catch(()=>null); }   // o servidor já conta o de hoje: espelha
    else if(f.reason==='not_in_guild') f.reason='guild';
    return f; }
  r=r&&typeof r==='object'?r:{};
  let out; ST.pending={ok:true,server:true,flames:int0(r.flames)}; try{ out=G.contribute(S,host,k); }finally{ ST.pending=null; }
  mirror(S,host,r);   // o feed já devolve guildId, flames, free, bra e mine: o save fica igual ao servidor sem outro GET
  if(host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,kind,flames:r.added!=null?int0(r.added):int0(out&&out.flames),total:int0(r.flames),level:int0(r.level)||(out&&out.level)||1,
    levelUp:r.levelUp===true,chestsMailed:int0(r.chestsMailed),braLeft:r.braLeft!=null?int0(r.braLeft):null,
    local:out||null,warn:out&&out.ok===false?out.reason:null}; }   // warn: o servidor aceitou e o gasto local falhou (ex.: Brasas sumiram no meio)

const API={DATA,provider,start,stop,refresh,feed,
  state:()=>({on:DATA.on===true,started:ST.started,err:ST.err,at:ST.at,inGuild:ST.inGuild}),
  view:()=>ST.data,
  _reset(){ ST.started=false; ST.data=null; ST.inGuild=false; ST.err=null; ST.at=0; ST.pending=null; } };
root.Sys=root.Sys||{}; root.Sys.guildFireNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
