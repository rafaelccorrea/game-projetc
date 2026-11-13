/* Eonbound — Sys.guild: GUILDAS (spec APROVADA pelo PO como base: reports/spec-guildas.md; os pontos da §8 o PO fecha com o dono junto com as telas).
   TUDO DEPENDE DO SERVIDOR (fps-30/fps-6f: rotas, moderação, anti-fraude, batalha do torneio com o js/sys no Node). Aqui, no jogo, só:
   - as REGRAS puras (tetos, custos, vagas, nível da guilda, travas da troca, prêmios do torneio) — o servidor usa as mesmas;
   - o espelho do que o servidor mandou (S.sys.guild) e o BÔNUS no Sys.fc (estandartes: ATK/Vida/DEF) + perks (ouro/XP/drop/ração) para os módulos da fps-30;
   - um PROVIDER trocável, como a arena: sem servidor, a guilda fica FECHADA ("Em breve: abre com o online").
   CHAVE DESLIGADA (DATA.on=false): desligada, bonus() é zero, perks() é zero e status() diz {on:false}. Nada de sorteio pago em nenhum ponto.
   Nível para criar/entrar = Sys.level.unlockLevel('guild') (fonte única; hoje 32, aprovada pelo PO depois da spec, que dizia 30). */
(function(root){
'use strict';
const DATA={
  on:false,
  create:{goldk:8000},                                    // ouro de ~8 h de farm (goldk × ouro de um abate da fase); sem 💎
  members:{base:20, perLevel:2, max:30},                  // 20 no nível 1, +2 por nível, até 30
  roles:['leader','officer','member'], maxOfficers:4, roleName:{leader:'Líder',officer:'Oficial',member:'Membro'},
  // PERMISSÕES por cargo (spec §1): quem pode o quê
  perms:{accept:['leader','officer'], kick:['leader','officer'], promote:['leader'], transfer:['leader'], rename:['leader'], lineup:['leader','officer'],
    declare:['leader','officer'], banner:['leader','officer'], request:['leader','officer','member'], donate:['leader','officer','member'], boss:['leader','officer','member'],
    checkin:['leader','officer','member'], shop:['leader','officer','member']},
  // CONTRIBUIÇÃO (spec §5): XP da guilda que cada ação do membro rende (a mesma tabela das doações/check-in; chefe por faixa de dano, missão semanal)
  contrib:{donate_gold_s:20, donate_gold_l:60, donate_gems:80, checkin:5, boss:30, mission:40, item:15},
  xpLevel:{base:1000, growth:1.6, maxLevel:10},           // XP para ir do nível n ao n+1 = 1.000 × 1,6^(n−1)
  leave:{cooldownH:24, sameGuildDays:7, leaderAbsentDays:7},
  // ESTANDARTES: o único poder (FC) da guilda; teto liberado aos poucos pelo nível (nível 10 = teto)
  banners:{cap:{atk:5,hp:5,def:3,gold:10,food:10}, step:{atk:0.5,hp:0.5,def:0.3,gold:1,food:1}, costXp:{atk:400,hp:400,def:400,gold:300,food:300}},
  // TERRITÓRIOS: ouro/XP/drop (não mexe na FC); Capital ×3; teto somado
  territory:{per:{gold:2,xp:1,drop:1}, capitalMult:3, cap:{gold:10,xp:5,drop:5}, perRegion:3, regions:9, minMedianEra:true},
  // TROCA (doação) com as travas do leilão
  trade:{adult:18, memberDays:7, itemAgeH:24, givePerDay:3, getPerDay:2, pairPerDay:1, goldBack:0.5, logDays:30,
    blocked:['offer','bought','shop_gem','pet','skin','vip','mount','frag','material','currency']},
  // TEMPORADA SEMANAL do torneio (spec §3; relógio do servidor, Brasília): seg-qui declarar (dias 1-4, até 2 ataques/guilda/dia, 1 território
  // defendido por vez), sex-sáb batalhas automáticas às 20h, domingo prêmios com o mapa congelado. getDay(): 0 = domingo.
  season:{declareDays:[1,2,3,4], battleDays:[5,6], battleHour:20, prizeDay:0, attacksPerDay:2, defendOne:true},
  // RANKING de territórios (spec §4): região e vale 1 + e pontos; Capital 15. Capital: só guilda com mediana de era ≥ capitalMinEra (PROPOSTA, a spec
  // não fixa: 8 = só quem já está no Celestial). Baú semanal por território, por membro (spec §3): 1 item da raridade-teto da era DO MEMBRO + materiais.
  rankPoints:{regionBase:1, capital:15}, capitalMinEra:8,
  weeklyChest:{item:'topRarity', mats:{forge:2, food:30, essence:1}},
  // PRÊMIOS do ranking do torneio (por membro que lutou ou estava escalado), sem sorteio
  tourney:{size:15, rewards:[{from:1,to:1,coin:300,prism:3,frame:true},{from:2,to:3,coin:200,prism:2},{from:4,to:10,coin:120,prism:1},{from:11,to:50,coin:60,prism:0}]},
  donate:[{id:'gold_s',goldk:60,coin:10,xp:20},{id:'gold_l',goldk:240,coin:30,xp:60},{id:'gems',gems:50,coin:40,xp:80}],   // 1 de cada por dia
  checkin:{coin:5,xp:5},
  coin:'Brasão',
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const H=3600*1000, D=24*H;
const BK=Object.keys(DATA.banners.cap);
const playerLevel=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); return int0(host&&host.level&&host.level())||1; };
const needLevel=()=>{ const L=root.Sys&&root.Sys.level; return L&&L.unlockLevel?L.unlockLevel('guild'):32; };
const dayKey=ms=>{ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };

/* ---------- regras puras (o servidor usa as mesmas) ---------- */
const xpToNext=n=>n>=DATA.xpLevel.maxLevel?0:Math.round(DATA.xpLevel.base*Math.pow(DATA.xpLevel.growth,clamp(int0(n),1,99)-1));
function levelOfXp(xp){ let n=1, left=int0(xp); while(n<DATA.xpLevel.maxLevel&&left>=xpToNext(n)){ left-=xpToNext(n); n++; } return {level:n,into:left,need:xpToNext(n)}; }
const memberCap=lv=>Math.min(DATA.members.max,DATA.members.base+DATA.members.perLevel*(clamp(int0(lv),1,DATA.xpLevel.maxLevel)-1));
/* teto do estandarte k no nível da guilda lv: sobe linear até o teto no nível 10 */
const bannerCap=(k,lv)=>BK.includes(k)?Math.round(DATA.banners.cap[k]*clamp(int0(lv),1,DATA.xpLevel.maxLevel)/DATA.xpLevel.maxLevel*100)/100:0;
/* bônus de territórios: lista [{region, capital}] → {gold, xp, drop} com teto */
function territoryBonus(list){ const T=DATA.territory, o={gold:0,xp:0,drop:0}; for(const t of Array.isArray(list)?list:[]){ const m=t&&t.capital?T.capitalMult:1; for(const k in o) o[k]+=T.per[k]*m; }
  for(const k in o) o[k]=Math.min(T.cap[k],o[k]); return o; }
/* região e do território: só guilda cuja MEDIANA de era dos escalados seja ≥ e (sem guilda de era 2 dominando a era 8) */
function canAttackRegion(eras,region){ const a=(Array.isArray(eras)?eras:[]).map(int0).sort((x,y)=>x-y); if(!a.length) return false; const m=a.length%2?a[(a.length-1)/2]:(a[a.length/2-1]+a[a.length/2])/2; return m>=int0(region); }
/* pontos de território para o ranking: lista [{region, capital}] → soma (região e = 1 + e; Capital 15) */
function territoryPoints(list){ const R=DATA.rankPoints; let t=0; for(const x of Array.isArray(list)?list:[]){ if(!x) continue; t+=x.capital?R.capital:R.regionBase+clamp(int0(x.region),0,8); } return t; }
const canAttackCapital=eras=>canAttackRegion(eras,DATA.capitalMinEra);
/* fase da temporada num instante (dia da semana do relógio do jogo; com servidor, o do servidor): 'declare' | 'battle' | 'prize' */
function seasonPhase(ms){ const d=new Date(num(ms,Date.now())).getDay(), Z=DATA.season; return Z.declareDays.includes(d)?'declare':Z.battleDays.includes(d)?'battle':'prize'; }
const tourneyReward=pos=>{ const p=int0(pos); const r=DATA.tourney.rewards.find(x=>p>=x.from&&p<=x.to); return r?{coin:r.coin,prism:r.prism,frame:!!r.frame}:{coin:0,prism:0,frame:false}; };
const createCost=host=>Math.round(DATA.create.goldk*Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)));
const goldBackOf=item=>Math.floor(int0(item&&item.gold)*DATA.trade.goldBack);

/* ---------- espelho do servidor no save: S.sys.guild ---------- */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.guild.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.guild; if(!o||typeof o!=='object') o=S.sys.guild={}; o.v=1;
  o.id=typeof o.id==='string'&&o.id?o.id:null; o.name=typeof o.name==='string'?o.name.slice(0,24):''; o.role=DATA.roles.includes(o.role)?o.role:'member';
  o.level=clamp(int0(o.level)||1,1,DATA.xpLevel.maxLevel); o.joinedAt=int0(o.joinedAt); o.leftAt=int0(o.leftAt); o.lastGuild=typeof o.lastGuild==='string'?o.lastGuild:'';
  const b=(o.banners&&typeof o.banners==='object')?o.banners:{}; o.banners={}; for(const k of BK) o.banners[k]=clamp(num(b[k],0),0,bannerCap(k,o.level));
  o.territories=Array.isArray(o.territories)?o.territories.filter(t=>t&&typeof t==='object').slice(0,DATA.territory.regions*DATA.territory.perRegion+1).map(t=>({region:clamp(int0(t.region),0,8),capital:t.capital===true})):[];
  o.coin=int0(o.coin); o.xp=int0(o.xp);
  // membros (espelho do servidor): [{id, name, role, lvl, fc, online, contrib (semana), lastSeen}] — até 30, saneados
  o.members=Array.isArray(o.members)?o.members.filter(m=>m&&typeof m==='object'&&m.id!=null).slice(0,DATA.members.max).map(m=>({id:String(m.id),name:String(m.name||'').slice(0,24),
    role:DATA.roles.includes(m.role)?m.role:'member',lvl:clamp(int0(m.lvl)||1,1,200),fc:int0(m.fc),online:m.online===true,contrib:int0(m.contrib),lastSeen:int0(m.lastSeen),me:m.me===true})):[];
  const ct=(o.contrib&&typeof o.contrib==='object')?o.contrib:{}; o.contrib={week:typeof ct.week==='string'?ct.week:'',pts:int0(ct.pts),total:int0(ct.total),log:Array.isArray(ct.log)?ct.log.filter(x=>x&&typeof x.k==='string').slice(-30).map(x=>({k:x.k,n:int0(x.n),t:int0(x.t)})):[]};
  const tr=(o.trade&&typeof o.trade==='object')?o.trade:{}; o.trade={day:typeof tr.day==='string'?tr.day:'',gave:int0(tr.gave),got:int0(tr.got),pairs:Array.isArray(tr.pairs)?tr.pairs.filter(x=>typeof x==='string').slice(0,10):[]};
  const dn=(o.daily&&typeof o.daily==='object')?o.daily:{}; o.daily={day:typeof dn.day==='string'?dn.day:'',done:Array.isArray(dn.done)?dn.done.filter(x=>typeof x==='string'):[]};
  if(!o.id){ o.members=[]; o.xp=0; o.banners={}; for(const k of BK) o.banners[k]=0; o.territories=[]; }   // sem guilda: sem estandartes nem territórios
  return o; }
const inGuild=S=>!!ensure(S).id;

/* ---------- PROVIDER (como a arena): o servidor troca este objeto ---------- */
const closedProvider={ online:false,
  status:()=>({open:false,reason:'server'}),
  create:()=>({ok:false,reason:'server'}), join:()=>({ok:false,reason:'server'}), leave:()=>({ok:false,reason:'server'}),
  donateItem:()=>({ok:false,reason:'server'}), sync:()=>({ok:false,reason:'server'}) };
let provider=closedProvider;
function setProvider(p){ provider=p&&typeof p==='object'?Object.assign({},closedProvider,p):closedProvider; return provider.online===true; }

/* aplica o que o servidor mandou (GET /guild/me): {id, name, role, level, xp?, banners, territories, coin, joinedAt} — valida tetos aqui também */
function applyServer(S,data,host){ const o=ensure(S); if(!data||typeof data!=='object'||!data.id){ if(o.id){ o.lastGuild=o.id; o.leftAt=int0(data&&data.leftAt)||nowOf(host); } o.id=null; ensure(S); return {ok:true,inGuild:false}; }
  o.id=String(data.id); o.name=String(data.name||''); o.role=data.role; o.level=data.xp!=null?levelOfXp(data.xp).level:int0(data.level)||1; o.joinedAt=int0(data.joinedAt)||o.joinedAt;
  o.banners=Object.assign({},data.banners||{}); o.territories=Array.isArray(data.territories)?data.territories:[]; if(data.coin!=null) o.coin=int0(data.coin);
  if(data.xp!=null) o.xp=int0(data.xp); if(Array.isArray(data.members)) o.members=data.members;
  ensure(S); return {ok:true,inGuild:true}; }

/* ---------- para as telas ---------- */
/* {on, open, reason: off|server|level|'', needLevel, inGuild, ...} */
function status(S,host){ if(!ON()) return {on:false,open:false,reason:'off'}; const o=ensure(S), lv=playerLevel(S,host), nl=needLevel();
  const ps=provider.status?provider.status(S,host):{open:false,reason:'server'};
  if(lv<nl) return {on:true,open:false,reason:'level',needLevel:nl};
  if(!ps.open) return {on:true,open:false,reason:ps.reason||'server',needLevel:nl,text:'Em breve: abre com o online'};
  return {on:true,open:true,reason:'',needLevel:nl,inGuild:!!o.id,name:o.name,role:o.role,level:o.level,members:memberCap(o.level),coin:o.coin}; }
/* pode criar? {ok, reason: off|server|level|in_guild|cooldown|money, gold} (o servidor confere de novo) */
function canCreate(S,host){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason,needLevel:st.needLevel}; const o=ensure(S), gold=createCost(host);
  if(o.id) return {ok:false,reason:'in_guild'}; const cd=cooldownLeft(S,host,null); if(cd>0) return {ok:false,reason:'cooldown',msLeft:cd};
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(gold)) return {ok:false,reason:'money',gold}; return {ok:true,gold}; }
/* espera depois de sair: 24 h para qualquer guilda; 7 dias para voltar à MESMA */
function cooldownLeft(S,host,guildId){ const o=ensure(S); if(!o.leftAt) return 0; const L=DATA.leave, t=nowOf(host)-o.leftAt;
  const need=(guildId&&guildId===o.lastGuild)?L.sameGuildDays*D:L.cooldownH*H; return Math.max(0,need-t); }
function canJoin(S,host,guildId){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason,needLevel:st.needLevel}; const o=ensure(S);
  if(o.id) return {ok:false,reason:'in_guild'}; const cd=cooldownLeft(S,host,guildId); if(cd>0) return {ok:false,reason:'cooldown',msLeft:cd}; return {ok:true}; }

/* ---------- TROCA (doação) — conferência local antes de mandar ao servidor ---------- */
/* item bloqueado? (comprado, oferta, pet, skin, VIP, montaria, fragmento, material, moeda) */
function itemTradable(item){ if(!item||typeof item!=='object'||!item.slot) return {ok:false,reason:'kind'};
  if(item.offer===true||item.bought===true) return {ok:false,reason:'bought'}; const og=String(item.origin||''); if(og==='shop_gem'||og==='offer'||og==='pass_premium') return {ok:false,reason:'bought'};
  if(DATA.trade.blocked.includes(item.kind)) return {ok:false,reason:'kind'}; return {ok:true}; }
/* {ok, reason: off|server|adult|member_days|item_age|bought|kind|day_limit|pair_limit|not_member, goldBack} — me: {age, joinedAt} do jogador */
function canDonate(S,host,item,toId,me){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const o=ensure(S), T=DATA.trade, now=nowOf(host);
  if(!o.id) return {ok:false,reason:'not_member'};
  if(!(me&&int0(me.age)>=T.adult)) return {ok:false,reason:'adult'};   // 18+ até o parecer jurídico (PO); sem idade = não
  if(now-o.joinedAt<T.memberDays*D) return {ok:false,reason:'member_days'};
  const it=itemTradable(item); if(!it.ok) return it;
  if(int0(item.gotAt)&&now-int0(item.gotAt)<T.itemAgeH*H) return {ok:false,reason:'item_age'};
  const dk=dayKey(now); if(o.trade.day!==dk){ o.trade={day:dk,gave:0,got:0,pairs:[]}; }
  if(o.trade.gave>=T.givePerDay) return {ok:false,reason:'day_limit'}; if(toId&&o.trade.pairs.includes(String(toId))) return {ok:false,reason:'pair_limit'};
  return {ok:true,goldBack:goldBackOf(item)}; }
/* o item como CHEGA para quem recebe: nível 1, ouro zerado (o doador recebe 50% do ouro investido); qualidade, era, raridade e secundários ficam */
function received(item){ const o=JSON.parse(JSON.stringify(item||{})); o.lvl=1; o.gold=0; delete o.gotAt; o.origin='guild'; return o; }
function markDonated(S,host,toId){ const o=ensure(S), dk=dayKey(nowOf(host)); if(o.trade.day!==dk) o.trade={day:dk,gave:0,got:0,pairs:[]}; o.trade.gave++; if(toId) o.trade.pairs.push(String(toId)); return o.trade; }

/* ---------- bônus ---------- */
/* Sys.fc: só os ESTANDARTES de ATK/Vida/DEF (o único poder da guilda; teto +5/+5/+3%) */
function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S||!ON()) return b; const o=ensure(S); if(!o.id) return b;
  b.atkPct=o.banners.atk; b.hpPct=o.banners.hp; b.defPct=o.banners.def; return b; }
/* perks para os módulos da fps-30 (como o VIP): ouro = estandarte + territórios (cada um no seu teto), XP e drop = territórios, ração = estandarte */
function perks(S){ const z={goldPct:0,xpPct:0,dropPct:0,foodPct:0}; if(!S||!ON()) return z; const o=ensure(S); if(!o.id) return z; const t=territoryBonus(o.territories);
  return {goldPct:o.banners.gold+t.gold,xpPct:t.xp,dropPct:t.drop,foodPct:o.banners.food}; }

/* ---------------- membros, cargos, contribuição (local agora; servidor manda a lista real em applyServer) ---------------- */
const can=(S,action)=>{ const o=ensure(S), P=DATA.perms[action]; return !!(o.id&&P&&P.includes(o.role)); };
/* lista para a tela: membros ordenados por cargo e contribuição da semana; {list, count, cap, online} */
function members(S){ const o=ensure(S), ord={leader:0,officer:1,member:2};
  const list=o.members.slice().sort((a,b)=>(ord[a.role]-ord[b.role])||(b.contrib-a.contrib)||(b.fc-a.fc)).map(m=>Object.assign({},m,{roleName:DATA.roleName[m.role]}));
  return {list,count:list.length,cap:memberCap(o.level),online:list.filter(m=>m.online).length}; }
/* ranking local da guilda (contribuição da semana): [{rank, id, name, contrib, me}] */
function contribRanking(S){ return ensure(S).members.slice().sort((a,b)=>b.contrib-a.contrib||b.fc-a.fc).map((m,i)=>({rank:i+1,id:m.id,name:m.name,contrib:m.contrib,me:m.me})); }
const weekOf=host=>{ const C=root.Sys&&root.Sys.clock, t=nowOf(host); if(C&&C.weekKey) return C.weekKey(t); const d=new Date(t); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
/* registra a contribuição do jogador (o servidor confirma e soma na guilda). {ok, reason: off|not_member|kind, xp, weekPts} */
function addContribution(S,host,kind,n){ if(!ON()) return {ok:false,reason:'off'}; const o=ensure(S); if(!o.id) return {ok:false,reason:'not_member'};
  const per=DATA.contrib[kind]; if(per==null) return {ok:false,reason:'kind'}; const k=Math.max(1,int0(n==null?1:n)), xp=per*k, wk=weekOf(host);
  if(o.contrib.week!==wk){ o.contrib.week=wk; o.contrib.pts=0; } o.contrib.pts+=xp; o.contrib.total+=xp; o.contrib.log.push({k:kind,n:xp,t:nowOf(host)}); if(o.contrib.log.length>30) o.contrib.log.shift();
  const me=o.members.find(m=>m.me); if(me) me.contrib+=xp;
  return {ok:true,xp,weekPts:o.contrib.pts}; }
/* barra de nível da guilda pelo XP (o servidor manda o XP; local = 0): {level, into, need, frac, max} */
function xpBar(S){ const o=ensure(S), L=levelOfXp(o.xp); return {level:L.level,into:L.into,need:L.need,frac:L.need?L.into/L.need:1,max:L.level>=DATA.xpLevel.maxLevel}; }
const API={DATA,can,members,contribRanking,addContribution,xpBar,territoryPoints,canAttackCapital,seasonPhase,xpToNext,levelOfXp,memberCap,bannerCap,territoryBonus,canAttackRegion,tourneyReward,createCost,goldBackOf,
  ensure,inGuild,setProvider,applyServer,status,canCreate,canJoin,cooldownLeft,itemTradable,canDonate,received,markDonated,bonus,perks,
  get provider(){ return provider; }};
root.Sys=root.Sys||{}; root.Sys.guild=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
