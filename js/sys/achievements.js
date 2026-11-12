/* Eonbound — Sys.achievements: CONQUISTAS permanentes (tela 34 Missões, aprovada pelo PO). 33 conquistas em 5 grupos, cada uma com NÍVEIS de meta
   (ex.: 1.000 / 10.000 / 100.000 abates) e prêmio FIXO por nível (sem sorteio, nada pago). Prêmios: ouro, pedras de treino/forja, ração e, só no
   ÚLTIMO nível de algumas, poucos 💎 (total ÚNICO no jogo inteiro em budget(); a meta de ~10 mil 💎 em 180 dias já estava cheia).
   NÃO dá FC (quem dá FC por conquista é o Sys.titles; aqui é recurso). Progresso de 2 jeitos:
   - CONTADOR: o jogo chama Sys.achievements.track(S, host, evento, n) no MESMO lugar do Sys.pass.track (ptrack do index.html): kill, boss, ult,
     chest, instance, forge, summon, upgrade + novos: fuse, transform, donate, guild_boss, tourney, login, activity100;
   - LEITURA do save (nível, era, FC, torre, arena, pets, montarias, forja, práticas, títulos...): save ANTIGO já entra com o que tem (nada se perde).
   Guarda a MAIOR marca (hi) de cada uma: tirar um item não "desfaz" conquista. CHAVE DESLIGADA (DATA.on=false). Estado: S.sys.achv. Sem DOM. */
(function(root){
'use strict';
const R=(goldk,stones,forge,food,gems)=>({goldk,stones,forge,food,gems});
// prêmio por posição do nível (0..3); gems só onde a conquista pede (lastGems no último nível)
const TIER_REWARD=[R(60,2,0,0,0),R(200,4,2,20,0),R(600,8,4,40,0),R(1500,12,8,80,0)];
const A=(id,group,name,src,tiers,lastGems)=>({id,group,name,src,tiers,lastGems:lastGems||0});
const DATA={
  on:false,
  groups:[{id:'combat',name:'Combate'},{id:'progress',name:'Progressão'},{id:'collection',name:'Coleção'},{id:'forge',name:'Forja'},{id:'social',name:'Social e Guilda'}],
  events:['kill','boss','ult','chest','instance','forge','summon','upgrade','fuse','transform','donate','guild_boss','tourney','login','activity100'],
  list:[
    // COMBATE
    A('kill',     'combat','Caçador',            {ev:'kill'},          [1000,10000,100000,1000000],10),
    A('boss',     'combat','Matador de chefes',  {ev:'boss'},          [10,100,1000],10),
    A('ult',      'combat','Fúria liberada',     {ev:'ult'},           [50,500,5000],5),
    A('phases',   'combat','Conquistador',       {calc:'phases'},      [10,100,1000,3000],10),
    A('tower',    'combat','Escalador da torre', {calc:'tower'},       [10,50,100,150],10),
    A('arena',    'combat','Gladiador',          {calc:'arena'},       [10,100,500],10),
    A('instance', 'combat','Explorador',         {ev:'instance'},      [10,100,500],5),
    // PROGRESSÃO
    A('level',    'progress','Experiente',       {calc:'level'},       [10,50,100,120],10),
    A('era',      'progress','Viajante do tempo',{calc:'era'},         [2,5,8],15),
    A('fc',       'progress','Poderoso',         {calc:'fc'},          [1e4,1e6,1e9,1e12],10),
    A('stage',    'progress','Crescer',          {calc:'stage'},       [1,2,3],10),
    A('chest',    'progress','Caça-tesouros',    {ev:'chest'},         [10,100,1000],5),
    A('activity', 'progress','Dedicado',         {ev:'activity100'},   [7,30,100],10),
    A('login',    'progress','Sempre presente',  {ev:'login'},         [7,30,100],10),
    // COLEÇÃO
    A('pets',     'collection','Domador',        {calc:'pets'},        [1,3,6],10),
    A('petStars', 'collection','Laço forte',     {calc:'petStars'},    [2,4,5],5),
    A('petEvo',   'collection','Evolução',       {calc:'petEvo'},      [1,2],5),
    A('mounts',   'collection','Cavaleiro',      {calc:'mounts'},      [1,3,6],10),
    A('mountLvl', 'collection','Montaria treinada',{calc:'mountLvl'},  [10,30,60],5),
    A('weaponR',  'collection','Arsenal raro',   {calc:'weaponR'},     [2,3,4],10),   // melhor raridade de arma que já teve: Épico, Mítico, Lendário
    A('wings',    'collection','Asas',           {calc:'wings'},       [1,2],5),       // tipos de asa (anjo, demoníaca)
    A('summon',   'collection','Invocador',      {ev:'summon'},        [10,100,1000],5),
    A('titles',   'collection','Colecionador de títulos',{calc:'titles'},[5,15,30],5),
    // FORJA
    A('upgrade',  'forge','Ferreiro',            {ev:'upgrade'},       [20,200,2000],5),
    A('forgeLvl', 'forge','Mestre da forja',     {calc:'forgeLvl'},    [5,10,15],10),
    A('forgeStones','forge','Minerador',         {ev:'forge'},         [100,1000,10000],5),
    A('practice', 'forge','Disciplina',          {calc:'practice'},    [10,50,200],5),
    A('fuse',     'forge','Fusão',               {ev:'fuse'},          [1,10,50],5),
    A('transform','forge','Transformação',       {ev:'transform'},     [1,10,50],5),
    // SOCIAL E GUILDA
    A('guild',    'social','Companheiro',        {calc:'guild'},       [1],5),
    A('donate',   'social','Generoso',           {ev:'donate'},        [1,10,100],5),
    A('guildBoss','social','Ataque em grupo',    {ev:'guild_boss'},    [1,10,50],5),
    A('tourney',  'social','Torneio do Poder',   {ev:'tourney'},       [1,10,50],5),
  ],
  tierReward:TIER_REWARD,
};
const BY={}; for(const a of DATA.list) BY[a.id]=a;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const safe=(f,d)=>{ try{ const v=f(); return num(v,d); }catch(e){ return d; } };

/* leituras do save (cada uma protegida: sem o módulo, vale 0) */
const CALC={
  phases:(S)=>safe(()=>{ const P=SYS().phases; if(P&&P.DATA.on){ const b=P.ensure(S).best; let t=0; for(const e in b) for(const x of b[e]) t+=int0(x); return t; } return int0(S.best)-1; },0),
  tower:(S,h)=>safe(()=>SYS().tower.ensure(S,h).best,0),
  arena:(S,h)=>safe(()=>SYS().arena.ensure(S,h).wins,0),
  level:(S,h)=>safe(()=>SYS().level.level(S),1),
  era:(S,h)=>safe(()=>{ const P=SYS().phases; return P&&P.DATA.on?P.eraMax(S):int0(h&&h.eraMax&&h.eraMax()); },0),
  fc:(S,h)=>safe(()=>SYS().fc.compute(S,h),0),
  stage:(S)=>safe(()=>SYS().level.ensure(S).stg,0),
  pets:(S)=>safe(()=>Object.keys(SYS().pet.ensure(S).owned).length,0),
  petStars:(S)=>safe(()=>Math.max(0,...Object.values(SYS().pet.ensure(S).owned).map(x=>int0(x.stars))),0),
  petEvo:(S)=>safe(()=>Math.max(0,...Object.values(SYS().pet.ensure(S).owned).map(x=>int0(x.stg))),0),
  mounts:(S)=>safe(()=>Object.keys(SYS().mount.ensure(S).owned).length,0),
  mountLvl:(S)=>safe(()=>Math.max(0,...Object.values(SYS().mount.ensure(S).owned).map(x=>int0(x.lvl))),0),
  weaponR:(S)=>safe(()=>Math.max(0,...(Array.isArray(S.inv)?S.inv:[]).filter(i=>i&&i.slot==='weapon').map(i=>int0(i.r))),0),
  wings:(S)=>safe(()=>{ const T=SYS().stats; return new Set((Array.isArray(S.inv)?S.inv:[]).filter(i=>i&&i.slot==='wing').map(i=>T&&T.wingOf?T.wingOf(i):'angel')).size; },0),
  titles:(S)=>safe(()=>Object.keys(SYS().titles.ensure(S).unlocked).length,0),
  forgeLvl:(S)=>safe(()=>Math.max(0,...Object.values(SYS().forge.ensure(S).lv).map(int0)),0),
  practice:(S)=>safe(()=>Object.values(SYS().practice.ensure(S).lv).reduce((t,x)=>t+int0(x),0),0),
  guild:(S)=>safe(()=>SYS().guild.inGuild(S)?1:0,0),
};

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.achievements.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.achv; if(!o||typeof o!=='object') o=S.sys.achv={}; o.v=1;
  const c=(o.c&&typeof o.c==='object')?o.c:{}; o.c={}; for(const k of DATA.events) if(int0(c[k])) o.c[k]=int0(c[k]);
  if(int0(S.kills)>int0(o.c.kill)) o.c.kill=int0(S.kills);   // MIGRAÇÃO: abates do save antigo (contador do jogo) contam
  const hi=(o.hi&&typeof o.hi==='object')?o.hi:{}; o.hi={}; for(const a of DATA.list) if(int0(hi[a.id])) o.hi[a.id]=int0(hi[a.id]);
  const t=(o.t&&typeof o.t==='object')?o.t:{}; o.t={}; for(const a of DATA.list){ const n=Math.min(a.tiers.length,int0(t[a.id])); if(n) o.t[a.id]=n; }
  return o; }
/* evento do jogo (mesmos nomes do Sys.pass.track). Conta mesmo desligado? NÃO: com a chave desligada não grava nada. */
function track(S,host,ev,n){ if(!ON()||!DATA.events.includes(ev)) return 0; const v=int0(n==null?1:n); if(!v) return 0; const o=ensure(S); o.c[ev]=int0(o.c[ev])+v; return o.c[ev]; }
/* valor atual de uma conquista (maior marca já vista) */
function value(S,host,id){ const a=BY[id]; if(!a) return 0; const o=ensure(S);
  const cur=a.src.ev?int0(o.c[a.src.ev]):Math.floor(num(CALC[a.src.calc]&&CALC[a.src.calc](S,host),0));
  if(cur>int0(o.hi[id])) o.hi[id]=cur; return int0(o.hi[id]); }
const rewardOf=(a,i)=>{ const r=Object.assign({},TIER_REWARD[Math.min(i,TIER_REWARD.length-1)]); r.gems=i===a.tiers.length-1?a.lastGems:0; return r; };
/* para a tela: {on, groups:[{id,name,items:[{id,name,value,tier (resgatados), tiers, next, need, done, ready, reward}]}], ready (quantos para resgatar)} */
function status(S,host){ if(!ON()) return {on:false}; const o=ensure(S); let ready=0;
  const items=DATA.list.map(a=>{ const v=value(S,host,a.id), got=int0(o.t[a.id]), reached=a.tiers.filter(x=>v>=x).length, done=got>=a.tiers.length;
    const r=!done&&reached>got; if(r) ready++;
    return {id:a.id,group:a.group,name:a.name,value:v,tier:got,tiers:a.tiers.slice(),need:done?null:a.tiers[got],done,ready:r,reward:done?null:rewardOf(a,got)}; });
  return {on:true,ready,groups:DATA.groups.map(g=>({id:g.id,name:g.name,items:items.filter(i=>i.group===g.id)}))}; }
/* resgata o PRÓXIMO nível alcançado. {ok, reason: off|id|done|need, tier, got} */
function claim(S,host,id){ if(!ON()) return {ok:false,reason:'off'}; const a=BY[id]; if(!a) return {ok:false,reason:'id'}; const o=ensure(S), got=int0(o.t[id]);
  if(got>=a.tiers.length) return {ok:false,reason:'done'}; const v=value(S,host,id); if(v<a.tiers[got]) return {ok:false,reason:'need',need:a.tiers[got],value:v};
  o.t[id]=got+1; const A_=SYS().activity, rw=rewardOf(a,got);
  const out=A_&&A_.give?A_.give(S,host,rw):(()=>{ const r={}, unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)); if(rw.goldk&&host&&host.addGold){ r.gold=Math.round(rw.goldk*unit); host.addGold(r.gold); } if(rw.gems&&host&&host.addGems){ host.addGems(rw.gems); r.gems=rw.gems; } return r; })();
  return {ok:true,id,tier:got+1,got:out}; }
function claimAll(S,host){ const out=[]; let guard=0; for(;;){ const st=status(S,host); if(!st.on||!st.ready||guard++>500) break;
  for(const g of st.groups) for(const i of g.items) if(i.ready) out.push(claim(S,host,i.id)); } return out; }
/* conta para o PO: diamantes do jogo inteiro (uma vez só) e quantos níveis existem */
function budget(){ let gems=0, tiers=0; for(const a of DATA.list){ gems+=a.lastGems; tiers+=a.tiers.length; } return {achievements:DATA.list.length,tiers,gems}; }

const API={DATA,ensure,track,value,status,claim,claimAll,budget};
root.Sys=root.Sys||{}; root.Sys.achievements=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
