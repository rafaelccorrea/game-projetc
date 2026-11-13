/* Eonbound — Sys.guildNet: liga as GUILDAS (Sys.guild da fps-69 e a tela js/p_guild.js) ao SERVIDOR (contrato docs/API_SERVIDOR.md §10.1 e §10.4).
   CHAVE DESLIGADA: DATA.on=false → nada sai daqui e o Sys.guild segue com o provider fechado ("Em breve: abre com o online").

   Mesmo padrão do Sys.arenaNet / Sys.tourneyNet (regra §1 assíncrono × síncrono):
   - start(S, host) busca a guilda do jogador e TROCA o provider do Sys.guild por um que diz "aberto" (status). O Sys.guild continua síncrono.
   - refresh(S, host): GET /guild + GET /guild/blessings → Sys.guild.applyServer(S, {id, name, role, level, xp, coin, joinedAt, members, banners,
     territories}). É assim que os ESTANDARTES (bônus de FC) e os TERRITÓRIOS do torneio (ouro/XP/drop) chegam ao jogo. Sem guilda (404): o jogo fica sem.
   - Todas as AÇÕES são Promise e, depois de mudar algo, refazem o refresh: list, create, join, leave, donate, checkin, accept/decline/kick/promote/
     demote/transfer, boss/bossHit, shop/shopBuy, blessings/upgradeBlessing, missions/claimMission, ranking. Erros: {ok:false, reason, details}.
   - O provider.leave SÍNCRONO do Sys.guild NÃO é trocado: uma Promise não tem .ok e a tela avisaria falha numa saída que deu certo. A tela passa
     a chamar Sys.guildNet.leave(S, host) (Promise) quando for ligada ao online. Nenhuma regra de jogo aqui: o servidor decide com o Sys.guild do jogo. */
(function(root){
'use strict';

const DATA={ on:true };   // ONLINE LIGADO (dono: 'liga tudo', 14/11; servidor em produção e roteiro de ponta a ponta do Servidor ok). Sem servidor ou com 404 o jogo segue no estado local
const SYS=()=>root.Sys||{};
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const ST={ started:false, mine:null, banners:null, err:null, at:0 };
const fail=e=>{ ST.err=(e&&e.code)||'error'; return {ok:false,reason:ST.err,details:(e&&e.details)||null}; };
const enc=encodeURIComponent;

/* provider do Sys.guild quando o servidor responde: só o status (o resto continua o fechado, ver acima) */
const provider={ online:true, status:()=>({open:true,reason:''}) };

/* GET /guild (+ estandartes) → o formato do Sys.guild.applyServer */
function toApply(mine,bl){ const g=mine.guild||{}, me=mine.me||{}, banners={};
  for(const b of (bl&&Array.isArray(bl.list))?bl.list:[]) banners[b.id]=b.value;
  const mem=Array.isArray(mine.members)?mine.members:[], my=mem.find(x=>x.me);
  return {id:g.id,name:g.name,role:me.role,level:g.level,xp:g.xp,coin:me.coin,joinedAt:my?my.joinedAt:undefined,members:mem,banners,
    territories:Array.isArray(mine.territories)?mine.territories:[]}; }

async function refresh(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const G=SYS().guild; if(!G||typeof G.applyServer!=='function') return {ok:false,reason:'module'};
  try{
    let mine=null; try{ mine=await call('GET','/guild'); }catch(e){ if(e&&e.code==='not_in_guild'){ ST.mine=null; ST.banners=null; G.applyServer(S,null,host); ST.err=null; ST.at=Date.now(); return {ok:true,inGuild:false}; } throw e; }
    const bl=await call('GET','/guild/blessings').catch(()=>null);
    ST.mine=mine; ST.banners=bl; G.applyServer(S,toApply(mine,bl),host); ST.err=null; ST.at=Date.now();
    return {ok:true,inGuild:true};
  }catch(e){ return fail(e); }
}
async function start(S,host){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  const G=SYS().guild; if(!G||typeof G.setProvider!=='function') return {ok:false,reason:'module'};
  const r=await refresh(S,host); if(!r.ok) return r;   // guildas desligadas no servidor (404 not_found) ou sem rede: fica o provider fechado
  G.setProvider(provider); ST.started=true; return {ok:true,inGuild:r.inGuild};
}
function stop(){ const G=SYS().guild; if(G&&G.setProvider) G.setProvider(null); ST.started=false; }

/* ações: chama, depois refaz o refresh (o save do jogo fica igual ao servidor) */
function act(m,p,b,opt){ return async function(S,host){ if(DATA.on!==true) return {ok:false,reason:'off'};
  try{ const r=await call(m,typeof p==='function'?p.apply(null,[].slice.call(arguments,2)):p,typeof b==='function'?b.apply(null,[].slice.call(arguments,2)):b);
    if(!(opt&&opt.read)) await refresh(S,host); return Object.assign({ok:true},r&&typeof r==='object'&&!Array.isArray(r)?r:{data:r}); }catch(e){ return fail(e); } }; }
const API={DATA,provider,start,stop,refresh,
  state:()=>({on:DATA.on===true,started:ST.started,err:ST.err,at:ST.at,inGuild:!!ST.mine}),
  mine:()=>ST.mine, blessingsView:()=>ST.banners,
  /* leitura */
  list:act('GET',(q)=>'/guilds'+(q?'?'+Object.keys(q).filter(k=>q[k]!=null&&q[k]!=='').map(k=>enc(k)+'='+enc(q[k])).join('&'):''),null,{read:true}),
  get:act('GET',id=>'/guilds/'+enc(id),null,{read:true}),
  boss:act('GET','/guild/boss',null,{read:true}), shop:act('GET','/guild/shop',null,{read:true}), missions:act('GET','/guild/missions',null,{read:true}),
  blessings:act('GET','/guild/blessings',null,{read:true}),
  ranking:act('GET',(kind,week)=>'/guild-ranking?kind='+enc(kind||'power')+(week?'&week='+enc(week):''),null,{read:true}),
  /* ações */
  create:act('POST','/guilds',b=>b||{}), join:act('POST',id=>'/guilds/'+enc(id)+'/join'), patch:act('PATCH','/guild',b=>b||{}),
  leave:act('POST','/guild/leave'), donate:act('POST','/guild/donate',kind=>({kind})), checkin:act('POST','/guild/checkin'),
  accept:act('POST',pid=>'/guild/requests/'+enc(pid)+'/accept'), decline:act('POST',pid=>'/guild/requests/'+enc(pid)+'/decline'),
  kick:act('POST',pid=>'/guild/members/'+enc(pid)+'/kick'), promote:act('POST',pid=>'/guild/members/'+enc(pid)+'/promote'),
  demote:act('POST',pid=>'/guild/members/'+enc(pid)+'/demote'), transfer:act('POST','/guild/leader',pid=>({playerId:pid})),
  bossHit:act('POST','/guild/boss/hit'), shopBuy:act('POST','/guild/shop/buy',id=>({itemId:id})),
  upgradeBlessing:act('POST',id=>'/guild/blessings/'+enc(id)+'/upgrade'), claimMission:act('POST',id=>'/guild/missions/'+enc(id)+'/claim'),
  _reset(){ ST.started=false; ST.mine=null; ST.banners=null; ST.err=null; ST.at=0; } };
root.Sys=root.Sys||{}; root.Sys.guildNet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
