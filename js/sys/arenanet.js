/* Eonbound — Sys.arenaNet: liga o Sys.arena ao SERVIDOR (contrato docs/API_SERVIDOR.md §4 e §4.1). CHAVE DESLIGADA: DATA.on=false = o jogo
   segue com o provider local (bots) e nada sai daqui. Quem liga é o dono (Arena online), junto com ARENA_ON=1 no servidor.

   REGRA §1 (assíncrono × síncrono): o Sys.arena e a tela (js/p_arena.js, do Engenheiro) continuam SÍNCRONOS e leem o CACHE daqui; a rede roda em
   segundo plano. A luta é a única ação que espera o servidor: Sys.arenaNet.fight(S, host, oppId) → Promise. Ela pede POST /arena/fight, guarda a
   resposta e chama o Sys.arena.fight de sempre, cujo provider devolve essa resposta. Assim tentativas, pontos, liga e prêmio passam pela MESMA conta do
   módulo da Sistemas (fightRewards credita uma vez pelo host). O servidor não credita nada.

   FOTO (POST /arena/snapshot): atributos de Sys.tower.playerStats (a FC que o servidor confere) + window.heroSnapshot() do Engenheiro ({look, level,
   petFrac}: fonte única do visual com a tela). Sem heroSnapshot, vai só o poder. Só reenvia quando algo mudou.

   Uso: Sys.arenaNet.start(S, host) depois do boot online (troca o provider e carrega lista, status, ranking e semana); stop() volta ao local.
   refresh(S, host) troca a lista (POST /arena/opponents/refresh); loadRanking(kind); snapshot(S, host) depois de mudar equipamento. */
(function(root){
'use strict';

const DATA={ on:true, opponents:5, minSnapMs:30000 };   // ARENA ONLINE LIGADA (dono: 'liga tudo', 14/11; servidor em produção com ARENA_ON e roteiro de ponta a ponta do Servidor: 25 ok). Sem servidor ou com 404 o jogo segue com os bots locais (start devolve ok:false)
const SYS=()=>root.Sys||{};
const N=()=>SYS().net;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const ST={ started:false, opps:[], status:null, ranking:{}, week:null, pending:{}, lastSnap:'', lastSnapAt:0, err:null, busy:{} };
const call=(m,p,b)=>{ const n=N(); if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const codeOf=e=>(e&&e.code)||'error';
const note=e=>{ ST.err=codeOf(e); return ST.err; };

/* ---------------- cache → formato do provider local ---------------- */
const opp=o=>({id:o.id,name:o.name,fc:num(o.fc,0),skin:o.skin||null,points:num(o.points,0),bot:!!o.bot,level:o.level==null?null:o.level,look:o.look||null});
function applyStatus(S,host,s){ if(!s) return; ST.status=s; const A=SYS().arena; if(!A||!S) return;
  try{ const o=A.ensure(S,host); if(s.attemptsLeft!=null) o.attemptsLeft=Math.max(0,s.attemptsLeft|0); if(s.refreshLeft!=null) o.refreshLeft=Math.max(0,s.refreshLeft|0);
    if(s.points!=null) o.points=s.points; }catch(e){} }

const provider={
  bots:false, online:true,
  listOpponents(S,host,n){ return ST.opps.slice(0,n||DATA.opponents).map(opp); },
  /* chamado pelo Sys.arena.fight DEPOIS que o Sys.arenaNet.fight já tem a resposta do servidor */
  fight(S,host,o){ const r=ST.pending[o.id]; if(!r) return {ok:false,reason:'online'}; return r; },
  getRanking(S,host,opt){ const k=opt&&opt.kind==='fc'?'fc':'arena', r=ST.ranking[k];
    return r||{kind:k,week:ST.week?ST.week.week:'',list:[],me:{rank:null,value:0},bots:false,loading:true}; },
  weekInfo(S,host){ const w=ST.week; if(w) return {week:w.week,start:w.start,end:w.end,msLeft:Math.max(0,w.end-(N()&&N().serverNow?N().serverNow():Date.now()))};
    const A=SYS().arena; return A&&A.localProvider?A.localProvider.weekInfo(S,host):{week:'',start:0,end:0,msLeft:0}; },
};

/* ---------------- rede ---------------- */
async function loadList(S,host){ const l=await call('GET','/arena/opponents?n='+DATA.opponents); ST.opps=Array.isArray(l)?l:[]; return ST.opps.map(opp); }
async function loadStatus(S,host){ const s=await call('GET','/arena/status'); applyStatus(S,host,s); return s; }
async function loadWeek(){ ST.week=await call('GET','/arena/week'); return ST.week; }
async function loadRanking(kind){ const k=kind==='fc'?'fc':'arena'; ST.ranking[k]=await call('GET','/ranking?kind='+k); return ST.ranking[k]; }

/* foto: poder (o que o servidor confere) + visual do Engenheiro. {ok, sent} */
async function snapshot(S,host,force){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const W=SYS().tower; if(!W||typeof W.playerStats!=='function') return {ok:false,reason:'module'};
  let p; try{ p=W.playerStats(S,host); }catch(e){ return {ok:false,reason:'module'}; }
  const body={fc:p.fc,atk:p.atk,hp:p.hp,def:p.def,critRate:p.critRate,critDmg:p.critDmg,aspd:p.aspd};
  try{ const h=root.heroSnapshot; if(typeof h==='function'){ const x=h()||{}; if(x.look) body.look=x.look; if(x.level!=null) body.level=x.level; if(x.petFrac!=null) body.petFrac=x.petFrac; } }catch(e){}
  /* conjunto PvP (Sys.arenaSet, docs/SERVIDOR_LOM.md §1.1; desligado = null, nada vai) */
  try{ const AS=SYS().arenaSet, pv=AS&&typeof AS.snapshotPart==='function'?AS.snapshotPart(S,host):null; if(pv) body.pvp=pv; }catch(e){}
  const key=JSON.stringify(body), now=Date.now();
  if(!force&&key===ST.lastSnap) return {ok:true,sent:false};
  if(!force&&now-ST.lastSnapAt<DATA.minSnapMs){ ST.snapLater=true; return {ok:true,sent:false,later:true}; }
  try{ await call('POST','/arena/snapshot',body); ST.lastSnap=key; ST.lastSnapAt=now; ST.snapLater=false; return {ok:true,sent:true}; }
  catch(e){ return {ok:false,reason:note(e),details:e&&e.details}; }
}

async function start(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const A=SYS().arena; if(!A||typeof A.setProvider!=='function') return {ok:false,reason:'module'};
  try{
    const sn=await snapshot(S,host,true); if(!sn.ok) return {ok:false,reason:sn.reason};
    await Promise.all([loadList(S,host),loadStatus(S,host),loadWeek(),loadRanking('arena')]);
    A.setProvider(provider); ST.started=true; ST.err=null; return {ok:true};
  }catch(e){ return {ok:false,reason:note(e)}; }   // sem servidor/arena desligada (404): fica o provider local
}
function stop(){ const A=SYS().arena; if(A&&A.setProvider) A.setProvider(null); ST.started=false; }

async function refresh(S,host){
  if(!ST.started) return {ok:false,reason:'off'};
  try{ const r=await call('POST','/arena/opponents/refresh',{n:DATA.opponents}); ST.opps=Array.isArray(r&&r.list)?r.list:ST.opps;
    applyStatus(S,host,Object.assign({},ST.status||{},{refreshLeft:r&&r.refreshLeft}));
    try{ const o=SYS().arena.ensure(S,host); o.refreshes=(o.refreshes|0)+1; }catch(e){}
    return {ok:true,list:ST.opps.map(opp),refreshLeft:r&&r.refreshLeft}; }
  catch(e){ const c=note(e); return {ok:false,reason:c==='arena_limit'?'refresh':c}; }
}

/* luta: o SERVIDOR decide; depois o Sys.arena.fight aplica a resposta pela conta dele. → Promise do resultado do Sys.arena.fight */
async function fight(S,host,oppId){
  const A=SYS().arena; if(!ST.started||!A) return {ok:false,reason:'off'};
  if(ST.busy[oppId]) return {ok:false,reason:'busy'}; ST.busy[oppId]=1;
  try{
    let r; try{ r=await call('POST','/arena/fight',{opponentId:oppId}); }
    catch(e){ const c=note(e); if(c==='arena_limit'){ applyStatus(S,host,{attemptsLeft:0}); return {ok:false,reason:'tries'}; } return {ok:false,reason:c}; }
    ST.pending[oppId]={ok:true,win:!!r.win,delta:r.delta|0,points:r.points,seed:r.seed,log:r.log||[],rewards:r.rewards||null,
      duel:{win:!!r.win,rounds:r.rounds,log:r.log||[]},opp:r.opp||null};
    // o Sys.arena.fight desconta 1 tentativa: deixa o contador local = o do servidor + 1 antes
    try{ const o=A.ensure(S,host); o.attemptsLeft=Math.max(1,(r.attemptsLeft|0)+1); }catch(e){}
    const out=A.fight(S,host,oppId);
    if(out&&out.ok&&r.opp) out.oppServer=r.opp;   // aparência e nível do oponente (a tela pode preferir este ao da lista)
    if(ST.status) ST.status=Object.assign({},ST.status,{attemptsLeft:r.attemptsLeft,points:r.points});
    return out;
  } finally { delete ST.pending[oppId]; delete ST.busy[oppId]; }
}

const state=()=>({on:DATA.on===true,started:ST.started,err:ST.err,status:ST.status,opponents:ST.opps.length,week:ST.week&&ST.week.week});
function _reset(){ ST.started=false; ST.opps=[]; ST.status=null; ST.ranking={}; ST.week=null; ST.pending={}; ST.lastSnap=''; ST.lastSnapAt=0; ST.err=null; ST.busy={}; }

const API={DATA,start,stop,snapshot,refresh,fight,loadRanking,loadList,loadStatus,loadWeek,provider,state,_reset};
root.Sys=root.Sys||{}; root.Sys.arenaNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
