/* Eonbound — Sys.guildBoss: GUILDA "AJUDAR TODOS" + CHEFE DA GUILDA NA BATALHA (docs/LOM_VS_EONBOUND.md §5 item 15, P3; contrato docs/SERVIDOR_LOM.md §2).
   CHAVE DESLIGADA (DATA.on=false): desligada, nada aparece e nenhuma rota é chamada. A guilda inteira depende do servidor (Sys.guild / Sys.guildNet).
   1. PEDIDO DE AJUDA (novo; o Sys.guild só tinha pedido de ENTRADA): cada membro abre 1 pedido por dia (boss / forge / food). Os outros ajudam
      (1 toque) ou usam AJUDAR TODOS (ajuda todos os pedidos abertos de uma vez). Pedido cheio → quem pediu resgata o prêmio FIXO do tipo:
      boss = +1 golpe no chefe da guilda HOJE (3 ajudas) · forge = 10 pedras de forja (5) · food = 50 de ração (5).
      Quem ajuda: +1 Brasão e +2 de contribuição por ajuda, até 10 ajudas por dia. Sem ouro, sem diamante, sem sorteio, sem troca entre jogadores.
      O MOTOR do quadro (board*) é puro: o servidor roda o mesmo no Node; o jogo só espelha a resposta (applyHelp).
   2. CHEFE NA BATALHA: espelho do GET /guild/boss (vida, total, meu dano de hoje, golpes restantes) → hud(S, host) devolve a barrinha pronta para a
      tela de batalha. Golpes por dia = Sys.guild.DATA.boss.hitsPerDay (2) + 1 se o pedido 'boss' do dia foi resgatado.
   Rede: o mesmo Sys.net._call do Sys.guildNet (Promise; sem rede = {ok:false, reason:'net_off'}). Estado: S.sys.guildboss. Sem DOM.
   Teste: test/sys/guildboss.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  kinds:{
    boss:{need:3, reward:{bossHits:1}, name:'Golpe extra no chefe', txt:'+1 golpe no chefe da guilda hoje'},
    forge:{need:5, reward:{forge:10}, name:'Pedras de forja', txt:'10 pedras de forja'},
    food:{need:5, reward:{food:50}, name:'Ração de pet', txt:'50 de ração'},
  },
  requestsPerDay:1,
  helpsPerDay:10,
  perHelp:{coin:1, contrib:2},   // Brasão (moeda da loja da guilda) e XP da guilda por ajuda dada
  pollMs:60000,                  // a barra do chefe na batalha pede GET /guild/boss no máximo 1 vez por minuto
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
/* dia de Brasília (UTC−3), o mesmo do contrato */
const dayKey=ms=>new Date(num(ms,Date.now())-3*3600000).toISOString().slice(0,10);
const str=(v,n)=>typeof v==='string'?v.slice(0,n||40):(typeof v==='number'?String(v):'');
const hitsBase=()=>{ const G=SYS().guild; return G&&G.DATA&&G.DATA.boss?int0(G.DATA.boss.hitsPerDay):2; };

/* ================= MOTOR DO QUADRO (puro; o servidor usa o mesmo) =================
   board = {day, requests:[{id, playerId, name, kind, need, got, helpers:[playerId], claimed, at}], used:{playerId:ajudas no dia}} */
function newBoard(day){ return {day:String(day||''),requests:[],used:{}}; }
function boardRoll(b,day){ if(!b||b.day!==day){ const n=newBoard(day); if(b){ b.day=n.day; b.requests=n.requests; b.used=n.used; return b; } return n; } return b; }
function boardRequest(b,me,kind,id,at,name){ const K=DATA.kinds[kind]; if(!K) return {ok:false,reason:'bad_kind'};
  if(b.requests.filter(r=>r.playerId===me).length>=DATA.requestsPerDay) return {ok:false,reason:'already'};
  const r={id:String(id),playerId:String(me),name:str(name,24),kind,need:K.need,got:0,helpers:[],claimed:false,at:int0(at)}; b.requests.push(r); return {ok:true,request:r}; }
const usedOf=(b,me)=>int0(b.used[me]);
function boardHelp(b,me,reqId){ const r=b.requests.find(x=>x.id===String(reqId)); if(!r) return {ok:false,reason:'request'};
  if(r.playerId===me) return {ok:false,reason:'self'}; if(r.helpers.includes(me)) return {ok:false,reason:'helped'}; if(r.got>=r.need) return {ok:false,reason:'full'};
  if(usedOf(b,me)>=DATA.helpsPerDay) return {ok:false,reason:'limit'};
  r.helpers.push(me); r.got++; b.used[me]=usedOf(b,me)+1;
  return {ok:true,coin:DATA.perHelp.coin,contrib:DATA.perHelp.contrib,helpsLeft:DATA.helpsPerDay-b.used[me],request:r}; }
/* AJUDAR TODOS: em ordem de criação, todos os pedidos de OUTROS, não cheios e que eu não ajudei, até acabar o limite. Idempotente por pedido. */
function boardHelpAll(b,me){ if(usedOf(b,me)>=DATA.helpsPerDay) return {ok:false,reason:'limit',helped:[],coin:0,contrib:0,helpsLeft:0};
  const helped=[]; for(const r of b.requests.slice().sort((x,y)=>x.at-y.at)){ if(usedOf(b,me)>=DATA.helpsPerDay) break; if(boardHelp(b,me,r.id).ok) helped.push(r.id); }
  return {ok:true,helped,coin:helped.length*DATA.perHelp.coin,contrib:helped.length*DATA.perHelp.contrib,helpsLeft:DATA.helpsPerDay-usedOf(b,me)}; }
function boardClaim(b,me){ const r=b.requests.find(x=>x.playerId===me); if(!r) return {ok:false,reason:'request'}; if(r.got<r.need) return {ok:false,reason:'not_full'};
  if(r.claimed) return {ok:false,reason:'claimed'}; r.claimed=true; return {ok:true,kind:r.kind,reward:Object.assign({},DATA.kinds[r.kind].reward)}; }
/* a resposta do GET /guild/help a partir do quadro (o servidor monta assim) */
function boardView(b,me){ const pub=r=>({id:r.id,playerId:r.playerId,name:r.name,kind:r.kind,need:r.need,got:r.got,full:r.got>=r.need,helpedByMe:r.helpers.includes(me)});
  const m=b.requests.find(r=>r.playerId===me);
  return {day:b.day,helpsLeft:Math.max(0,DATA.helpsPerDay-usedOf(b,me)),helpsMax:DATA.helpsPerDay,
    mine:m?{id:m.id,kind:m.kind,need:m.need,got:m.got,full:m.got>=m.need,claimed:m.claimed}:null,
    requests:b.requests.filter(r=>r.playerId!==me).map(pub)}; }

/* ================= ESTADO DO JOGO (espelho do servidor) ================= */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.guildBoss.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.guildboss; if(!o||typeof o!=='object') o=S.sys.guildboss={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; o.extraHit=o.extraHit===true; o.got=Array.isArray(o.got)?o.got.filter(x=>typeof x==='string').slice(0,5):[];
  const h=(o.help&&typeof o.help==='object')?o.help:{}; o.help={helpsLeft:clamp(int0(h.helpsLeft),0,DATA.helpsPerDay),mine:h.mine&&typeof h.mine==='object'?h.mine:null,
    requests:Array.isArray(h.requests)?h.requests.filter(r=>r&&typeof r==='object'&&DATA.kinds[r.kind]).slice(0,30):[],at:int0(h.at)};
  const b=(o.boss&&typeof o.boss==='object')?o.boss:null; o.boss=b?{name:str(b.name,30),level:int0(b.level)||1,hp:int0(b.hp),hpMax:int0(b.hpMax),myDamageToday:int0(b.myDamageToday),
    myDamageWeek:int0(b.myDamageWeek),hitsToday:int0(b.hitsToday),hitsMax:int0(b.hitsMax)||hitsBase(),hitsLeft:int0(b.hitsLeft),extraHit:b.extraHit===true,killed:b.killed===true,resetsAt:int0(b.resetsAt),at:int0(b.at)}:null;
  return o; }
/* virada do dia: some o espelho do quadro e o golpe extra */
function roll(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.extraHit=false; o.got=[]; o.help={helpsLeft:DATA.helpsPerDay,mine:null,requests:[],at:0}; } return o; }
const inGuild=S=>{ const G=SYS().guild; try{ return !!(G&&G.inGuild&&G.inGuild(S)); }catch(e){ return false; } };

/* espelha o GET /guild/help */
function applyHelp(S,host,data){ if(!on()) return {ok:false,reason:'off'}; if(!data||typeof data!=='object') return {ok:false,reason:'data'}; const o=roll(S,host);
  o.help={helpsLeft:clamp(int0(data.helpsLeft),0,DATA.helpsPerDay),mine:data.mine&&typeof data.mine==='object'&&DATA.kinds[data.mine.kind]?{id:str(data.mine.id),kind:data.mine.kind,need:int0(data.mine.need),got:int0(data.mine.got),full:data.mine.full===true,claimed:data.mine.claimed===true}:null,
    requests:(Array.isArray(data.requests)?data.requests:[]).filter(r=>r&&DATA.kinds[r.kind]).slice(0,30).map(r=>({id:str(r.id),playerId:str(r.playerId),name:str(r.name,24),kind:r.kind,need:int0(r.need),got:int0(r.got),full:r.full===true,helpedByMe:r.helpedByMe===true})),at:nowOf(host)};
  return {ok:true}; }
/* espelha o GET /guild/boss (ou a resposta do POST /guild/boss/hit) */
/* MESCLA com o espelho anterior (Engenheiro 14/11): a resposta do golpe pode vir parcial ({hp, myDamageToday, hitsLeft}) e não pode zerar nome/vida
   máxima da faixa. Formato antigo do servidor: só hpLeft (sem hp) = a vida atual. Sem vida máxima nem na resposta nem no espelho = sem chefe hoje. */
function applyBoss(S,host,data){ if(!on()) return {ok:false,reason:'off'}; const o=roll(S,host); if(!data||typeof data!=='object') return {ok:false,reason:'data'};
  if(data.boss===null){ o.boss=null; return {ok:true,boss:false}; }   // o servidor diz: sem chefe hoje
  const d=Object.assign({},data); if(d.hp==null&&d.hpLeft!=null) d.hp=d.hpLeft; for(const k in d) if(d[k]==null) delete d[k];
  const m=Object.assign({},o.boss||{},d,{at:nowOf(host)}); if(!(int0(m.hpMax)>0)){ o.boss=null; return {ok:true,boss:false}; }
  if(int0(m.hp)>int0(m.hpMax)) m.hp=m.hpMax; o.boss=m; if(data.extraHit===true) o.extraHit=true; ensure(S); return {ok:true,boss:true}; }

/* ---------- regras para a tela ---------- */
/* golpes no chefe hoje: base + 1 com o pedido 'boss' resgatado */
const hitsMax=(S,host)=>hitsBase()+(roll(S,host).extraHit?1:0);
function canRequest(S,host,kind){ if(!on()) return {ok:false,reason:'off'}; if(!inGuild(S)) return {ok:false,reason:'not_member'}; if(!DATA.kinds[kind]) return {ok:false,reason:'bad_kind'};
  const o=roll(S,host); if(o.help.mine) return {ok:false,reason:'already'}; return {ok:true}; }
/* quantos pedidos o Ajudar todos atenderia agora (o botão mostra "Ajudar todos (N)"; 0 = botão apagado) */
function helpAllCount(S,host){ if(!on()) return 0; const o=roll(S,host); return Math.min(o.help.helpsLeft,o.help.requests.filter(r=>!r.full&&!r.helpedByMe).length); }

/* ---------- a barra do chefe na tela de batalha ---------- */
/* {show, name, level, frac (vida 0-1), hpText, mine (meu dano hoje), hitsLeft, hitsMax, stale (precisa pedir de novo)} — sem guilda/sem chefe: show:false */
function hud(S,host){ if(!on()||!inGuild(S)) return {show:false}; const o=roll(S,host), b=o.boss; const now=nowOf(host);
  if(!b||!b.hpMax) return {show:false,stale:true};
  const k=v=>v>=1e9?(v/1e9).toFixed(1)+'B':v>=1e6?(v/1e6).toFixed(1)+'M':v>=1e3?(v/1e3).toFixed(1)+'K':String(v);
  return {show:true,name:b.name,level:b.level,frac:clamp(b.hp/b.hpMax,0,1),hpText:k(b.hp)+' / '+k(b.hpMax),mine:b.myDamageToday,mineText:k(b.myDamageToday),
    hitsLeft:b.hitsLeft,hitsMax:b.hitsMax,killed:b.killed,stale:now-b.at>=DATA.pollMs,resetsAt:b.resetsAt}; }
function view(S,host){ if(!on()) return {on:false}; const o=roll(S,host);
  return {on:true,inGuild:inGuild(S),helpsLeft:o.help.helpsLeft,helpsMax:DATA.helpsPerDay,mine:o.help.mine,requests:o.help.requests,helpAll:helpAllCount(S,host),
    kinds:Object.keys(DATA.kinds).map(k=>({kind:k,need:DATA.kinds[k].need,name:DATA.kinds[k].name,txt:DATA.kinds[k].txt})),extraHit:o.extraHit,hitsMax:hitsMax(S,host),boss:hud(S,host)}; }

/* ================= REDE (Promise; mesmo Sys.net._call do Sys.guildNet) ================= */
const call=(m,p,b)=>{ const n=SYS().net; if(!n||typeof n._call!=='function') return Promise.reject(Object.assign(new Error('net'),{code:'net_off'})); return n._call(m,p,b); };
const fail=e=>({ok:false,reason:(e&&e.code)||'error',retryAfterMs:(e&&e.retryAfterMs)||0});
const enc=encodeURIComponent;
async function loadHelp(S,host){ if(!on()) return {ok:false,reason:'off'}; try{ const r=await call('GET','/guild/help'); applyHelp(S,host,r); return {ok:true,data:r}; }catch(e){ return fail(e); } }
async function loadBoss(S,host,force){ if(!on()) return {ok:false,reason:'off'}; const o=roll(S,host);
  if(!force&&o.boss&&nowOf(host)-o.boss.at<DATA.pollMs) return {ok:true,cached:true};
  try{ const r=await call('GET','/guild/boss'); applyBoss(S,host,r); return {ok:true}; }catch(e){ return fail(e); } }
/* local: Brasões e contribuição entram no espelho do Sys.guild (o servidor também soma; o próximo refresh da guilda acerta) */
function creditHelp(S,host,r){ const G=SYS().guild; try{ if(G&&G.ensure){ const g=G.ensure(S); g.coin+=int0(r.coin); } }catch(e){} }
async function request(S,host,kind){ const c=canRequest(S,host,kind); if(!c.ok) return c; try{ const r=await call('POST','/guild/help/request',{kind}); await loadHelp(S,host); return Object.assign({ok:true},r); }catch(e){ return fail(e); } }
async function help(S,host,id){ if(!on()) return {ok:false,reason:'off'}; try{ const r=await call('POST','/guild/help/'+enc(id)); creditHelp(S,host,r); await loadHelp(S,host); return Object.assign({ok:true},r); }catch(e){ return fail(e); } }
async function helpAll(S,host){ if(!on()) return {ok:false,reason:'off'}; if(!inGuild(S)) return {ok:false,reason:'not_member'};
  try{ const r=await call('POST','/guild/help-all'); creditHelp(S,host,r); await loadHelp(S,host); return Object.assign({ok:true},r); }catch(e){ return fail(e); } }
/* resgate do meu pedido cheio: forge/food entram pelo Sys.loot.grantBundle; boss liga o golpe extra do dia */
async function claim(S,host){ if(!on()) return {ok:false,reason:'off'}; try{ const r=await call('POST','/guild/help/claim'); const o=roll(S,host), rw=r&&r.reward||{};
    if(int0(rw.bossHits)>0) o.extraHit=true; const L=SYS().loot, b={}; if(rw.forge) b.forge=int0(rw.forge); if(rw.food) b.food=int0(rw.food);
    let got=null; if(Object.keys(b).length&&L&&L.grantBundle) got=L.grantBundle(S,host,b); await loadHelp(S,host); return Object.assign({ok:true},r,{got}); }catch(e){ return fail(e); } }

const API={DATA,on,setOn,dayKey,newBoard,boardRoll,boardRequest,boardHelp,boardHelpAll,boardClaim,boardView,
  ensure,applyHelp,applyBoss,hitsMax,canRequest,helpAllCount,hud,view,loadHelp,loadBoss,request,help,helpAll,claim};
root.Sys=root.Sys||{}; root.Sys.guildBoss=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
