/* Eonbound — Sys.trial: PROVAÇÃO DO MESTRE. docs/IDLE_PARECIDOS.md §3 item 7 (P2, dono aprovou). CHAVE DESLIGADA (DATA.on=false).
   A cada 10 níveis (10, 20, 30 ...) o herói bate num TETO: o nível não passa de 10 (20, 30 ...) até vencer a Provação daquele nível, uma luta CURTA
   com REGRA ESPECIAL fixa ("sem pet", "só 30 s", "sem montaria", "sem magias", "começa com metade da vida"). O mestre de cada provação é o MENTOR da
   era (Sys.mentors: Nv 10 = Nara, Nv 20 = Tales ... Nv 90+ = Aurora). Vencer:
   - sobe o teto para o próximo marco e devolve a XP guardada enquanto o teto segurava (até 1 nível de XP; o que passa disso não é guardado);
   - dá ATRIBUTO DE BASE permanente (+1% ATK e +1% Vida por provação; Sys.fc soma pelo bonus(S));
   - dá um prêmio fixo na 1ª vitória (ouro PEQUENO = 3 min de abate da fase atual, pedras de forja, ração) e ABRE FUNÇÕES (Nv 10: automático da Fogueira).
     O prêmio de verdade é o +1% ATK/Vida permanente; o ouro segue o teto por resgate do docs/ECONOMIA_OURO.md (X = 5 min de abate).
   Tentar de novo é GRÁTIS e SEM LIMITE (sem energia, sem gema, sem anúncio). Perder não custa nada.
   Teto da XP: o Sys.level não é desta sessão; o Engenheiro passa a XP por gateXp(S, host, n) antes do Sys.level.addXp (ver docs/SISTEMA_MATRIZ.md).
   Save antigo (herói já acima de um marco quando a chave liga): o nível NUNCA desce; o teto é o primeiro marco não vencido >= nível atual, e as
   provações antigas ficam abertas para pegar o prêmio. Estado: S.sys.trial. Sem DOM. Teste: test/sys/trial.test.js */
(function(root){
'use strict';

const DATA={
  on:false,
  label:'Provação do Mestre', icon:'',
  every:10,                 // marco a cada N níveis
  cap:true,                 // o teto de nível vale (gateXp). false = só a luta e o prêmio, sem segurar o nível
  bankLevels:1,             // XP guardada no teto: até 1 nível (o do marco)
  sec:60,                   // luta curta: 60 s (a regra 't30' usa 30 s)
  enemy:{hpMul:1.2, dmgMul:1.0},   // mestre = chefe da fase mais alta do jogador × estes fatores (o Engenheiro monta com o inimigo de hoje)
  rules:[                   // ciclo pelos marcos (Nv 10 = 1ª, Nv 20 = 2ª ...)
    {id:'nopet',   name:'Sem pet',          text:'O pet descansa: só você e o mestre.'},
    {id:'t30',     name:'Só 30 s',          text:'Vença em 30 segundos.', sec:30},
    {id:'nomount', name:'Sem montaria',     text:'Lute a pé.'},
    {id:'nospell', name:'Sem magias',       text:'Só golpes da arma, sem o Grimório.'},
    {id:'half',    name:'Metade da vida',   text:'Comece a luta com 50% da Vida.', hpStart:0.5},
  ],
  stat:{atkPct:1, hpPct:1},  // atributo de base por provação vencida (PROPOSTA)
  killsPerMin:24,           // ritmo de abate da build (~24 abates/min; o mesmo do Sys.mapchest): 1 min de abate = 24 × host.goldUnit()
  // ouro = goldMin × killsPerMin × host.goldUnit() (FIXO, não cresce com a provação; dono 14/11: 60 × k × goldUnit era "muito alto", ~86,7 mi no Nv 90)
  // pedras e ração: × número da provação (1, 2, 3 ...). docs/ECONOMIA_OURO.md
  reward:{goldMin:3, stones:4, food:20},
  opens:{10:[{id:'bonfireAuto',name:'Automático da Fogueira'}], 30:[{id:'loadoutsAuto',name:'Troca automática de conjunto'}]},   // PROPOSTA: o PO completa
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const LV=()=>SYS().level;
const maxLevel=()=>{ const L=LV(); return int0(L&&L.DATA&&L.DATA.maxLevel)||100; };
function levelOf(S,host){ const L=LV(); try{ if(L&&L.level) return L.level(S); }catch(e){} return int0(host&&host.level&&host.level())||1; }
/* marcos: 10, 20 ... abaixo do nível máximo */
function marks(){ const out=[]; for(let l=DATA.every;l<maxLevel();l+=DATA.every) out.push(l); return out; }
const isMark=l=>int0(l)>0&&int0(l)%DATA.every===0&&int0(l)<maxLevel();
const idxOf=l=>int0(l)/DATA.every;   // 1, 2, 3 ...

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.trial.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.trial; if(!o||typeof o!=='object') o=S.sys.trial={};
  o.v=1; const p=(o.passed&&typeof o.passed==='object')?o.passed:{}, t=(o.tries&&typeof o.tries==='object')?o.tries:{}; o.passed={}; o.tries={};
  for(const k in p) if(isMark(+k)) o.passed[k]=int0(p[k])||1;
  for(const k in t) if(isMark(+k)) o.tries[k]=int0(t[k]);
  o.bank=int0(o.bank); o.cur=(o.cur&&isMark(o.cur.lvl))?{lvl:int0(o.cur.lvl),at:int0(o.cur.at)}:null;
  return o; }
const passed=(S,l)=>!!ensure(S).passed[String(int0(l))];

/* mestre de um marco: o mentor da era (Sys.mentors), era = provação − 1, no máximo a última */
function master(l){ const e=Math.min(8,Math.max(0,idxOf(l)-1)), M=SYS().mentors, m=M&&M.byEra?M.byEra(e):null;
  return {era:e,id:m?m.id:'m'+e,name:m?m.name:'Mestre',role:m?m.role:'',portrait:'assets/mentors/m'+e+'.png'}; }
function rule(l){ const r=DATA.rules[(idxOf(l)-1)%DATA.rules.length]; return Object.assign({sec:DATA.sec,hpStart:1},r); }
/* prêmio da 1ª vitória (sem host: ouro em abates; goldMin = minutos de abate) */
function rewardOf(l,host){ const k=idxOf(l), u=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
  return {gold:Math.round(num(DATA.reward.goldMin,0)*num(DATA.killsPerMin,24)*u),goldMin:num(DATA.reward.goldMin,0),stones:DATA.reward.stones*k,food:DATA.reward.food*k,stat:Object.assign({},DATA.stat),
    opens:(DATA.opens[int0(l)]||[]).map(x=>Object.assign({},x))}; }
/* tabela inteira (tela e QA) */
function table(host){ return marks().map(l=>({lvl:l,rule:rule(l),master:master(l),reward:rewardOf(l,host)})); }

/* TETO: primeiro marco não vencido >= nível atual (o nível nunca desce) */
function cap(S,host){ const lv=levelOf(S,host); if(!on()||!DATA.cap) return maxLevel(); for(const l of marks()) if(l>=lv&&!passed(S,l)) return l; return maxLevel(); }
/* provações abertas: marcos já alcançados e não vencidos (a do teto primeiro) */
function dueList(S,host){ if(!on()) return []; const lv=levelOf(S,host); return marks().filter(l=>l<=lv&&!passed(S,l)); }
function due(S,host){ if(!on()) return {due:false,reason:'off'}; const d=dueList(S,host); if(!d.length) return {due:false,reason:'none'};
  const c=cap(S,host), l=d.includes(c)?c:d[0]; return {due:true,lvl:l,atCap:l===c&&levelOf(S,host)>=c,rule:rule(l),master:master(l)}; }

/* XP até chegar ao nível do teto (a XP dentro do nível do teto fica guardada) */
function roomTo(S,host,c){ const L=LV(); if(!L||!L.progress||!L.need) return Infinity; const p=L.progress(S); if(p.lvl>=c) return 0;
  let r=L.need(p.lvl)-p.xp; for(let l=p.lvl+1;l<c;l++) r+=L.need(l); return Math.max(0,r); }
const bankMax=(S,c)=>{ const L=LV(); let s=0; for(let i=0;i<DATA.bankLevels;i++) s+=L&&L.need?int0(L.need(c+i)):0; return s; };
/* O Engenheiro passa a XP por aqui ANTES do Sys.level.addXp: devolve quanto entra agora; o resto (até 1 nível) fica guardado para depois da provação.
   {give, banked, lost, cap}. Desligado ou sem teto: give = n (nada muda). */
function gateXp(S,host,n){ const k=int0(n); if(!on()||!DATA.cap) return {give:k,banked:0,lost:0,cap:maxLevel()};
  const c=cap(S,host); if(c>=maxLevel()) return {give:k,banked:0,lost:0,cap:c};
  const room=roomTo(S,host,c), give=Math.min(k,room), rest=k-give; if(!rest) return {give,banked:0,lost:0,cap:c};
  const o=ensure(S), bm=bankMax(S,c), add=Math.max(0,Math.min(rest,bm-o.bank)); o.bank+=add;
  return {give,banked:add,lost:rest-add,cap:c}; }

/* começa a provação (grátis, sem limite). {ok, lvl, spec} | {ok:false, reason: off|lvl|done|level} */
function start(S,host,lvl){ if(!on()) return {ok:false,reason:'off'}; const d=due(S,host); const l=lvl==null?(d.due?d.lvl:0):int0(lvl);
  if(!isMark(l)) return {ok:false,reason:'lvl'}; if(passed(S,l)) return {ok:false,reason:'done'}; if(levelOf(S,host)<l) return {ok:false,reason:'level'};
  const o=ensure(S); o.cur={lvl:l,at:nowOf(host)}; o.tries[String(l)]=int0(o.tries[String(l)])+1;
  return {ok:true,lvl:l,spec:spec(l,host)}; }
/* o que a batalha monta: regra, tempo, mestre e o inimigo (chefe da fase mais alta × fatores) */
function spec(l,host){ const r=rule(l); return {lvl:l,rule:r,sec:r.sec,hpStart:r.hpStart,noPet:r.id==='nopet',noMount:r.id==='nomount',noSpells:r.id==='nospell',
  master:master(l),enemy:{kind:'boss',stage:int0(host&&host.stage&&host.stage())||1,hpMul:DATA.enemy.hpMul,dmgMul:DATA.enemy.dmgMul}}; }

/* fim da luta. res = {won, sec}. Vitória fora do tempo da regra conta como derrota.
   {ok, won, lvl, reward?, released?, retry:true} | {ok:false, reason: off|none} */
function finish(S,host,res){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S); if(!o.cur) return {ok:false,reason:'none'};
  const l=o.cur.lvl, r=rule(l), sec=num(res&&res.sec,0), won=!!(res&&res.won)&&!(sec>r.sec); o.cur=null;
  if(!won||passed(S,l)){ changed(host); return {ok:true,won:false,lvl:l,retry:true,free:true,late:!!(res&&res.won)&&sec>r.sec}; }
  o.passed[String(l)]=nowOf(host); const rw=rewardOf(l,host), out={gold:0,stones:0,food:0};
  if(rw.gold&&host&&typeof host.addGold==='function'){ host.addGold(rw.gold); out.gold=rw.gold; }
  const F=SYS().forge; if(rw.stones&&F&&typeof F.addStones==='function') out.stones=int0(F.addStones(S,rw.stones,host));
  const P=SYS().pet; if(rw.food&&P&&typeof P.addFood==='function') out.food=int0(P.addFood(S,rw.food,host));
  const released=release(S,host);
  changed(host); return {ok:true,won:true,lvl:l,reward:Object.assign(out,{stat:rw.stat,opens:rw.opens}),released,cap:cap(S,host)}; }
/* devolve a XP guardada pelo teto novo (o que ainda não cabe continua guardado) */
function release(S,host){ const o=ensure(S), L=LV(); if(!o.bank||!L||typeof L.addXp!=='function') return 0; const k=o.bank; o.bank=0;
  const g=gateXp(S,host,k); if(g.give) L.addXp(S,g.give,host,'trial'); return g.give; }

/* função aberta por provação. Desligado: sempre aberta (nada muda). */
function isOpen(S,feature){ if(!on()) return true; for(const l in DATA.opens) if(DATA.opens[l].some(x=>x.id===feature)) return !!(S&&passed(S,+l)); return true; }
function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!on()||!S) return b; const n=Object.keys(ensure(S).passed).length;
  for(const k in DATA.stat) b[k]+=DATA.stat[k]*n; for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6; return b; }

function view(S,host){ if(!on()) return {on:false}; const o=ensure(S), lv=levelOf(S,host), c=cap(S,host), d=due(S,host);
  return {on:true,level:lv,cap:c,atCap:DATA.cap&&lv>=c&&c<maxLevel(),bank:o.bank,due:d.due?d.lvl:null,bonus:bonus(S),
    list:table(host).map(x=>Object.assign(x,{passed:passed(S,x.lvl),open:lv>=x.lvl,tries:int0(o.tries[String(x.lvl)])}))}; }

const API={DATA,on,setOn,ensure,marks,isMark,master,rule,rewardOf,table,cap,dueList,due,gateXp,start,spec,finish,release,isOpen,bonus,view,passed};
root.Sys=root.Sys||{}; root.Sys.trial=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
