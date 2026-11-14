/* Eonbound — Sys.guildFire: FOGUEIRA DA GUILDA. docs/IDLE_PARECIDOS.md §3 item 10 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   Rotina de guilda de 2 segundos: cada membro faz 1 ALIMENTAR GRÁTIS por dia (+10 chamas). Quem quiser pode dar também BRASAS SUAS (1 chama por
   Brasa, até 20 Brasas por dia), que são ganhas SÓ jogando (Sys.bonfire). NUNCA se compra: não há gema, oferta, pacote, VIP nem anúncio aqui.
   As chamas de todos sobem o NÍVEL da fogueira coletiva (1-10, sem reset: o doc não pede semana). Cada nível novo dá a TODOS os membros um BAÚ FIXO
   (ouro, Pedras de Forja e ração; nada sorteado) e o nível dá um BÔNUS PEQUENO de guilda (ouro e XP %, fora da FC: o único poder de FC da guilda
   continua sendo o estandarte do Sys.guild). No nível 10, cada 3.000 chamas a mais dão mais um baú (a rotina continua valendo).
   Contra pular de guilda: só conta baú de nível alcançado DEPOIS de entrar (joinedAt do Sys.guild); o resgate é guardado por guilda.
   Brasas: gasta pelo gancho Sys.bonfire.spendBrasas(S, n, src) SE existir. HOJE NÃO EXISTE (o Sys.bonfire só tem addBrasas/forge/tap): sem ele,
   dar Brasas devolve {ok:false, reason:'hook'} e só o alimentar grátis funciona. Gancho pedido à dona do bonfire.js (ver docs/SISTEMA_MATRIZ.md).
   PROVIDER trocável (como Sys.guild): LOCAL = a fogueira só com as chamas deste jogador (sem servidor não há guilda de verdade); o servidor (fps-6f)
   soma as chamas de todos e espelha por applyServer(S, host, {guildId, flames, level?}).
   Estado: S.sys.guildFire {v, gid, flames, day:{k, free, bra}, mine, claimed:{gid:[nível|'x'+n]}, reached:{gid:{nível:ms}}}. Sem DOM.
   Teste: test/sys/guildfire.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  free:{flames:10},                      // 1 alimentar grátis por dia
  brasa:{flames:1, perDay:20},           // 1 chama por Brasa, até 20 Brasas por dia por membro
  maxLevel:10,
  need:{base:300, growth:1.35},          // chamas do nível n ao n+1 = 300 × 1,35^(n−1) (total até o 10 ≈ 11,9 mil: ~60 dias com 20 membros só no grátis)
  extraEvery:3000,                       // no nível 10: 1 baú a cada 3.000 chamas a mais
  // bônus de guilda pelo nível (fora da FC): ouro +0,5% e XP +0,3% por nível acima do 1 (nível 10 = +4,5% ouro, +2,7% XP)
  perLevel:{goldPct:0.5, xpPct:0.3},
  // baú fixo do nível L (para cada membro): ouro = goldK × L × ouro de um abate · pedras = L · ração = 10 × L. Extra do nível 10 = baú do 10.
  // goldK 40 → 12 (docs/ECONOMIA_OURO.md): o baú do 10 = 120 abates = 5 min de abate, o teto por resgate (antes 400 = 16,7 min). O servidor espelha (API_SERVIDOR §16.2).
  chest:{goldK:12, stonesPer:1, foodPer:10},
  names:['Faísca','Brasa','Chama','Fogueira','Labareda','Fogaréu','Tocha das Eras','Pira','Farol','Chama Eterna'],
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const pad=n=>String(n).padStart(2,'0');
const dayKey=ms=>{ const C=SYS().clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };

/* ---------------- regras puras (o servidor usa as mesmas) ---------------- */
const needOf=lv=>lv>=DATA.maxLevel?0:Math.round(DATA.need.base*Math.pow(DATA.need.growth,clamp(int0(lv)||1,1,DATA.maxLevel)-1));
const totalTo=lv=>{ let t=0; for(let i=1;i<clamp(int0(lv)||1,1,DATA.maxLevel);i++) t+=needOf(i); return t; };
function levelOf(flames){ let lv=1, left=int0(flames); while(lv<DATA.maxLevel&&left>=needOf(lv)){ left-=needOf(lv); lv++; }
  const extra=lv>=DATA.maxLevel?Math.floor(left/DATA.extraEvery):0;
  return {level:lv,into:lv>=DATA.maxLevel?left%DATA.extraEvery:left,need:lv>=DATA.maxLevel?DATA.extraEvery:needOf(lv),extra}; }
function perksAt(lv){ const k=clamp(int0(lv)||1,1,DATA.maxLevel)-1; return {goldPct:Math.round(DATA.perLevel.goldPct*k*10)/10,xpPct:Math.round(DATA.perLevel.xpPct*k*10)/10}; }
function chestOf(lv,host){ const L=clamp(int0(lv)||1,1,DATA.maxLevel), u=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
  return {gold:Math.round(DATA.chest.goldK*L*u),stones:DATA.chest.stonesPer*L,food:DATA.chest.foodPer*L,gems:0}; }

/* ---------------- guilda (só leitura do Sys.guild) ---------------- */
const guildOf=S=>{ const G=SYS().guild; try{ if(!G||!G.ensure) return null; const g=G.ensure(S); return g.id?{id:g.id,joinedAt:int0(g.joinedAt)}:null; }catch(e){ return null; } };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.guildFire.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.guildFire; if(!o||typeof o!=='object') o=S.sys.guildFire={};
  o.v=1; o.gid=typeof o.gid==='string'&&o.gid?o.gid:null; o.flames=int0(o.flames); o.mine=int0(o.mine);
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={k:typeof d.k==='string'?d.k:'',free:d.free===true,bra:int0(d.bra)};
  const c=(o.claimed&&typeof o.claimed==='object')?o.claimed:{}; o.claimed={};
  for(const g in c) if(Array.isArray(c[g])) o.claimed[g]=c[g].filter(x=>typeof x==='number'||typeof x==='string').slice(0,200);
  const r=(o.reached&&typeof o.reached==='object')?o.reached:{}; o.reached={};
  for(const g in r) if(r[g]&&typeof r[g]==='object'){ o.reached[g]={}; for(const k in r[g]) o.reached[g][k]=int0(r[g][k]); }
  return o; }
/* acompanha a guilda atual: trocou de guilda = fogueira da nova (zera o espelho local) */
function sync(S,host){ const o=ensure(S), g=guildOf(S), t=nowOf(host), dk=dayKey(t);
  if(o.day.k!==dk) o.day={k:dk,free:false,bra:0};
  if(!g){ o.gid=null; o.flames=0; return o; }
  if(o.gid!==g.id){ o.gid=g.id; o.flames=0; }
  return o; }
/* marca a hora em que cada nível foi alcançado (para o baú só de quem já estava) */
function markReached(o,host,before){ const L=levelOf(o.flames), t=nowOf(host), R=o.reached[o.gid]||(o.reached[o.gid]={});
  for(let lv=before.level+1;lv<=L.level;lv++) if(!R[lv]) R[lv]=t;
  for(let x=before.extra+1;x<=L.extra;x++) if(!R['x'+x]) R['x'+x]=t;
  return L; }

/* ---------------- PROVIDER ---------------- */
/* LOCAL: sem servidor, a fogueira tem só as chamas deste jogador. O servidor troca por um que soma todos (resposta: {ok, flames}). */
const localProvider={ online:false, feed:(S,host,kind,n)=>({ok:true}) };
let provider=localProvider;
function setProvider(p){ provider=p&&typeof p==='object'?Object.assign({},localProvider,p):localProvider; return provider.online===true; }

/* ---------------- alimentar ---------------- */
/* status: {on, open, reason: off|guild, free (já fez hoje?), braLeft, hook (há gancho de Brasas?)} */
const hook=()=>{ const B=SYS().bonfire; return !!(B&&typeof B.spendBrasas==='function'); };
function status(S,host){ if(!on()) return {on:false,open:false,reason:'off'}; const o=sync(S,host);
  if(!o.gid) return {on:true,open:false,reason:'guild'};
  return {on:true,open:true,reason:'',free:!o.day.free,braLeft:Math.max(0,DATA.brasa.perDay-o.day.bra),hook:hook()}; }
/* contribute(S, host, n): n vazio/0 = o alimentar GRÁTIS do dia; n > 0 = dar n Brasas suas (gancho do Sys.bonfire).
   {ok, reason: off|guild|done|day|hook|brasas|server, flames (somadas agora), level, levelUp, chests (baús que ficaram prontos)} */
function contribute(S,host,n){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const o=ensure(S), k=int0(n);
  let add=0, kind;
  if(!k){ if(o.day.free) return {ok:false,reason:'done'}; kind='free'; add=DATA.free.flames; }
  else { const left=DATA.brasa.perDay-o.day.bra; if(left<=0) return {ok:false,reason:'day'}; if(k>left) return {ok:false,reason:'day',left};
    if(!hook()) return {ok:false,reason:'hook'};
    let have=0; try{ have=int0(SYS().bonfire.ensure(S).bra); }catch(e){ have=0; } if(have<k) return {ok:false,reason:'brasas',have};
    kind='brasa'; add=k*DATA.brasa.flames; }
  let r; try{ r=provider.feed(S,host,kind,k)||{ok:true}; }catch(e){ r={ok:false,reason:'server'}; } if(!r.ok) return {ok:false,reason:r.reason||'server'};
  if(kind==='brasa'){ let spent=false; try{ spent=SYS().bonfire.spendBrasas(S,k,'guildFire')===true; }catch(e){ spent=false; } if(!spent) return {ok:false,reason:'brasas'}; o.day.bra+=k; }
  else o.day.free=true;
  const before=levelOf(o.flames); o.flames=r.flames!=null?Math.max(o.flames,int0(r.flames)):o.flames+add; o.mine+=add;
  const L=markReached(o,host,before);
  changed(host); return {ok:true,kind,flames:add,total:o.flames,level:L.level,levelUp:L.level>before.level,chests:chests(S,host).length}; }
const feed=(S,host)=>contribute(S,host,0);

/* ---------------- baús ---------------- */
/* baús prontos para ESTE membro: níveis 2..atual (e extras do 10) alcançados depois de entrar na guilda e ainda não resgatados */
function chests(S,host){ if(!on()) return []; const o=sync(S,host); if(!o.gid) return []; const g=guildOf(S), L=levelOf(o.flames), R=o.reached[o.gid]||{}, got=o.claimed[o.gid]||[], out=[];
  const after=k=>{ const at=R[k]; return at!=null&&(!g.joinedAt||at>=g.joinedAt); };
  for(let lv=2;lv<=L.level;lv++) if(after(lv)&&!got.includes(lv)) out.push({id:lv,level:lv,chest:chestOf(lv,host)});
  for(let x=1;x<=L.extra;x++) if(after('x'+x)&&!got.includes('x'+x)) out.push({id:'x'+x,level:DATA.maxLevel,extra:x,chest:chestOf(DATA.maxLevel,host)});
  return out; }
/* resgata um baú (id = nível ou 'x'+n). Entrega pelo host.addGold, Sys.forge.addStones e Sys.pet.addFood. {ok, reason: off|guild|id, reward} */
function claim(S,host,id){ const st=status(S,host); if(!st.open) return {ok:false,reason:st.reason}; const c=chests(S,host).find(x=>x.id===id); if(!c) return {ok:false,reason:'id'};
  const o=ensure(S), rw=c.chest, out={gold:0,stones:0,food:0,gems:0};
  if(rw.gold&&host&&typeof host.addGold==='function'){ host.addGold(rw.gold); out.gold=rw.gold; }
  const F=SYS().forge; if(rw.stones&&F&&typeof F.addStones==='function') out.stones=int0(F.addStones(S,rw.stones,host));
  const P=SYS().pet; if(rw.food&&P&&typeof P.addFood==='function') out.food=int0(P.addFood(S,rw.food,host));
  (o.claimed[o.gid]||(o.claimed[o.gid]=[])).push(id); changed(host); return {ok:true,id,reward:out}; }

/* ---------------- bônus (fora da FC, como o Sys.guild.perks) ---------------- */
function perks(S){ const z={goldPct:0,xpPct:0}; if(!on()||!S) return z; const o=ensure(S); if(!o.gid||!guildOf(S)) return z; return perksAt(levelOf(o.flames).level); }

/* ---------------- espelho do servidor ---------------- */
/* data: {guildId, flames, free?:bool (já alimentou hoje), bra?:n (Brasas dadas hoje)} — o servidor soma todos; só aceita da guilda atual */
function applyServer(S,host,data){ if(!on()) return {ok:false,reason:'off'}; const o=sync(S,host); if(!data||typeof data!=='object') return {ok:false,reason:'data'};
  if(!o.gid||String(data.guildId)!==o.gid) return {ok:false,reason:'guild'};
  const before=levelOf(o.flames); o.flames=int0(data.flames); if(data.free===true) o.day.free=true; if(data.bra!=null) o.day.bra=Math.max(o.day.bra,int0(data.bra));
  markReached(o,host,before);
  return {ok:true,level:levelOf(o.flames).level}; }

/* ---------------- tela ---------------- */
function view(S,host){ const st=status(S,host); if(!st.on) return {on:false}; const o=ensure(S); const L=levelOf(o.flames), P=perksAt(L.level);
  return {on:true,open:st.open,reason:st.reason,online:provider.online===true,level:L.level,name:DATA.names[L.level-1],into:L.into,need:L.need,
    frac:L.need?Math.min(1,L.into/L.need):1,max:L.level>=DATA.maxLevel,flames:o.flames,mine:o.mine,
    free:!!st.free,freeFlames:DATA.free.flames,braLeft:st.braLeft||0,brasaHook:!!st.hook,
    perks:P,perksText:L.level>1?`Ouro +${String(P.goldPct).replace('.',',')}% · XP +${String(P.xpPct).replace('.',',')}%`:'',
    next:L.level<DATA.maxLevel?{level:L.level+1,perks:perksAt(L.level+1),chest:chestOf(L.level+1,host)}:{level:DATA.maxLevel,chest:chestOf(DATA.maxLevel,host),extra:true},
    chests:chests(S,host)}; }

const API={DATA,on,setOn,ensure,needOf,totalTo,levelOf,perksAt,chestOf,setProvider,localProvider,get provider(){ return provider; },
  status,contribute,feed,chests,claim,perks,applyServer,view};
root.Sys=root.Sys||{}; root.Sys.guildFire=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
