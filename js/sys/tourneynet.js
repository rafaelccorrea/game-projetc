/* Eonbound — Sys.tourneyNet: liga o TORNEIO DO PODER (tela js/p_tourney.js) ao SERVIDOR (contrato docs/API_SERVIDOR.md §10.3).
   CHAVE DESLIGADA: DATA.on=false → nada sai daqui e a tela segue no estado vazio honesto. Quem liga é o dono, junto com TOURNEY_ON=1 no servidor.

   REGRA §1 (assíncrono × síncrono), como o Sys.arenaNet: a tela lê o CACHE de forma síncrona (state(), map(), my(), ranking(kind), battles());
   a rede roda em segundo plano (refresh). As ações que mudam o servidor devolvem Promise: declare(territory, slot) e setLineup(slot, ids).
   NENHUMA regra aqui: fases, limites, regra de era e prêmios são decididos pelo servidor com o Sys.guild do jogo; erros chegam como {ok:false, reason}.
   Formato do mapa = o do servidor: [{id:'r<era>t<1-3>'|'capital', region, capital, owner:{id,name}|null, attacks:[{slot:'d5'|'d6', attacker:{id,name}}]}].
   Os territórios da MINHA guilda (bônus de ouro/XP/drop) chegam pelo GET /guild (campo territories) e o Sys.guild.applyServer já os lê. */
(function(root){
'use strict';

const DATA={ on:true };   // ONLINE LIGADO (dono: 'liga tudo', 14/11; servidor em produção e roteiro de ponta a ponta do Servidor ok). Sem servidor ou com 404 o jogo segue no estado local
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const ST={ view:null, ranking:{}, battles:null, lineup:{}, err:null, at:0, busy:false };
const codeOf=e=>(e&&e.code)||'error';
const fail=e=>{ ST.err=codeOf(e); return {ok:false,reason:ST.err,details:e&&e.details||null}; };

/* ---------------- leitura (cache, síncrona) ---------------- */
const state=()=>({on:DATA.on===true,ready:!!ST.view,err:ST.err,at:ST.at,phase:ST.view?ST.view.phase:null,week:ST.view?ST.view.week:null,size:ST.view?ST.view.size:null});
const map=()=>ST.view?ST.view.map.slice():[];
const my=()=>ST.view?ST.view.my:null;
const schedule=()=>ST.view?ST.view.battles.slice():[];
const ranking=kind=>ST.ranking[kind==='territory'?'territory':'tournament']||null;
const battles=()=>ST.battles;
const lineup=slot=>ST.lineup[slot]||(ST.view&&ST.view.my&&ST.view.my.lineups?{slot,members:ST.view.my.lineups[slot]||[]}:null);

/* ---------------- rede ---------------- */
/** busca tudo (mapa/fase/minha guilda, ranking do torneio e o registro da semana). {ok} | {ok:false, reason} (404 = desligado no servidor ou sem guilda) */
async function refresh(opt){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  if(ST.busy) return {ok:false,reason:'busy'}; ST.busy=true;
  try{
    ST.view=await call('GET','/tourney');
    const [rk,bt]=await Promise.all([call('GET','/tourney/ranking?kind=tournament'),call('GET','/tourney/battles')]);
    ST.ranking.tournament=rk; ST.battles=bt;
    if(opt&&opt.territory) ST.ranking.territory=await call('GET','/tourney/ranking?kind=territory');
    ST.err=null; ST.at=Date.now(); return {ok:true};
  }catch(e){ return fail(e); }
  finally{ ST.busy=false; }
}
async function loadRanking(kind){ if(DATA.on!==true) return {ok:false,reason:'off'}; const k=kind==='territory'?'territory':'tournament';
  try{ ST.ranking[k]=await call('GET','/tourney/ranking?kind='+k); return {ok:true,ranking:ST.ranking[k]}; }catch(e){ return fail(e); } }
async function loadBattles(week){ if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call('GET','/tourney/battles'+(week?'?week='+encodeURIComponent(week):'')); if(!week) ST.battles=r; return {ok:true,battles:r}; }catch(e){ return fail(e); } }
async function loadLineup(slot){ if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call('GET','/tourney/lineup?slot='+encodeURIComponent(slot)); ST.lineup[slot]=r; return {ok:true,lineup:r}; }catch(e){ return fail(e); } }

/* ---------------- ações (Promise) ---------------- */
/** declarar ataque (líder/oficial). {ok, declaration, attacksLeftToday} | {ok:false, reason: tourney_phase|own_territory|daily_limit|territory_busy|defender_busy|era_too_low|forbidden|...} */
async function declare(territory,slot){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call('POST','/tourney/declare',{territory,slot}); await refresh().catch(()=>{}); return Object.assign({ok:true},r); }catch(e){ return fail(e); } }
/** escalação do dia (até size; líder/oficial). {ok, slot, members, lockAt} | {ok:false, reason: lineup_locked|member_too_new|bad_request|forbidden} */
async function setLineup(slot,members){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call('PUT','/tourney/lineup',{slot,members}); ST.lineup[slot]={slot,members:r.members,lockAt:r.lockAt,locked:false};
    if(ST.view&&ST.view.my&&ST.view.my.lineups) ST.view.my.lineups[slot]=r.members.slice(); return Object.assign({ok:true},r); }catch(e){ return fail(e); } }

function _reset(){ ST.view=null; ST.ranking={}; ST.battles=null; ST.lineup={}; ST.err=null; ST.at=0; ST.busy=false; }
const API={DATA,state,map,my,schedule,ranking,battles,lineup,refresh,loadRanking,loadBattles,loadLineup,declare,setLineup,_reset};
root.Sys=root.Sys||{}; root.Sys.tourneyNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
