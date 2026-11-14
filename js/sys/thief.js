/* Eonbound — Sys.thief: LADRÃO DE BRASAS (instância diária com "Repetir"). P1 do docs/LOM_VS_EONBOUND.md (seç. 3, 5.3 e 7.3), aprovado pelo dono.
   Números = contrato do servidor (fps-6f). CHAVE DESLIGADA (DATA.on=false): desligada, nada muda no jogo.
   Um goblin ladrão foge com um saco de Brasas por 45 s; o jogador bate para soltar as Brasas. 2 entradas GRÁTIS por dia (zeram na virada do dia de
   Brasília, UTC-3). Não há entrada paga, chave por anúncio, nada à venda nem sorteio pago (o jogo tem menores).
   PRÊMIO: no máximo 1 LOTE por entrada, pelo NÍVEL DA FOGUEIRA (Sys.bonfire.perTap: 1-3 = 1, 4-6 = 2, 7-9 = 4, 10-19 = 5, 20-34 = 6, 35-49 = 8, 50-60 = 10).
   Fixo, sem sorteio. O fim é finish {score 0..1}: Brasas = round(lote × score); score 1 = lote cheio e o nível fica VENCIDO (best = nível da Fogueira).
   A entrada é gasta ao ENTRAR (regra única com o servidor; sair no meio não devolve). REPETIR (sweep): gasta 1 entrada e dá na hora o lote cheio do melhor nível já vencido ("Varrer o último" do LoM).
   O SACO E A FUGA são do módulo (DATA.bag, DATA.escape): o enter (local e serverEnter) grava na corrida run.bagHp (vida do saco), secs, seed, escapeAt,
   escapeEvery, escapeDur, jitter e escapes (inícios das fugas); a luta 'thief' lê da corrida e não mede nada. Online, run.endsAt do servidor limita o relógio.
   As Brasas entram pelo Sys.bonfire.addBrasas(S,'thief',n) (conta no got; o teto do estoque e a chave da Fogueira valem).
   ONLINE (Sys.thiefNet, docs/API_SERVIDOR.md §15, chave THIEF_ON): setProvider({online:true}) faz o SERVIDOR decidir. Aí enter/finish/sweep síncronos
   devolvem {ok:false, reason:'online'} (o módulo não gasta entrada sozinho) e o estado vem do servidor: applyServer (GET /thief: entradas, melhor nível,
   corrida aberta), serverEnter, serverFinish (credita UMA vez por runId: S.sys.thief.paid) e serverSweep. Sem provider (padrão) nada muda.
   Estado: S.sys.thief. Teste: test/sys/thief.test.js e test/sys/thiefnet.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  entries:2,                 // por dia, grátis (LoM: 2 chaves; as +2 por anúncio NÃO existem aqui)
  secs:45,                   // duração da perseguição (a tela usa)
  /* reserva igual ao contrato, usada só se o Sys.bonfire não estiver carregado */
  lote:[{from:1,n:1},{from:4,n:2},{from:7,n:4},{from:10,n:5},{from:20,n:6},{from:35,n:8},{from:50,n:10}],
  maxLevel:60,
  paidKeep:12,               // online: últimos runId já creditados (não credita duas vezes a mesma corrida)
  /* VIDA DO SACO (run.bagHp), decidida NO ENTER e gravada na corrida (recarregar não muda; trocar de equipamento depois não muda):
       bagHp = round(dps de referência do herói × run.secs × frac(nível da Fogueira))
       dps de referência = ATQ × (1 + chance crít × dano crít) × [ (1 + vel. ataque)/s1Sec + s2Mult/s2Sec + ultMult/ultSec ] × pace
       (ATQ, crítico e velocidade do Sys.fc.stats, sem pet, sem golpes especiais e sem magias do Grimório: isso é o que leva ao score 1).
     pace: medido no jogo de verdade (sandbox do test/e2e, luta 'thief' de 45 s, batalha automática; Nv 1/20/60, vel. +50%, crít 40%): o dano real no
     ladrão foi 0,44-0,51 do teórico do kit (especial e ultimate travam o básico enquanto tocam; o ladrão fica ~84% ao alcance). Com pace 0,69 o herói
     típico (sem pet nem Grimório) faz ~0,70 de "dps de referência × secs" na corrida inteira.
     frac sobe com a Fogueira, linear de fracMin (Nv 1) a fracMax (Nv maxLevel): Nv 1 = 0,55, 10 ≈ 0,60, 20 ≈ 0,66, 30 ≈ 0,72, 40 ≈ 0,78, 50 ≈ 0,84, 60 = 0,90.
     Medido com este saco (mesma luta, sem pet nem Grimório): Fogueira 1 e 10 = score 1 (sobra 30% e 16%), Fogueira 30 = 0,91, Fogueira 60 = 0,73-0,77.
     Pet, Grimório e golpes especiais somam por cima e são o que leva ao score 1 nos níveis altos. */
  bag:{fracMin:0.55, fracMax:0.90, pace:0.69, s1Sec:0.8, s2Mult:3, s2Sec:6, ultMult:10, ultSec:20, critRate:12, critDmg:100},
  /* FUGA (a luta lê da corrida): 1ª fuga aos at s, depois a cada every s, cada uma dura dur s; cada início ganha um desvio determinístico pela seed
     (±jitter s). Local: seed derivada do run.rid (id local da corrida); online: a seed do POST /thief/enter. run.escapes = os inícios já calculados */
  escape:{at:7, every:8, dur:1.4, jitter:0.5},
};
let PROV=null; const SRV={per:0};   // provider online (Sys.thiefNet) e entradas por dia do servidor (perDay)
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const ONLINE=()=>!!(PROV&&PROV.online===true);
const PER=()=>ONLINE()&&SRV.per>0?SRV.per:DATA.entries;   // entradas por dia: as do servidor quando online
const SYS=()=>root.Sys||{};
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
/* dia de BRASÍLIA (UTC-3, 'YYYY-MM-DD'), o mesmo que o servidor usa para contar as entradas */
const dayKey=ms=>new Date(ms-3*3600000).toISOString().slice(0,10);

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.thief.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.thief; if(!o||typeof o!=='object') o=S.sys.thief={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; o.used=clamp(int0(o.used),0,Math.max(DATA.entries,PER())); o.best=clamp(int0(o.best),0,DATA.maxLevel); o.total=int0(o.total);
  const r0=o.run; o.run=(r0&&typeof r0==='object'&&int0(r0.lv)>=1)?{lv:clamp(int0(r0.lv),1,DATA.maxLevel),t:num(r0.t,0)}:null;
  if(o.run&&typeof r0.id==='string'&&r0.id){ o.run.id=r0.id; o.run.max=int0(r0.max); }   // corrida do servidor (runId e lote dela)
  if(o.run){ if(typeof r0.rid==='string'&&r0.rid) o.run.rid=r0.rid;   // corrida local (id local, base da seed)
    for(const k of CHASE_KEYS) if(typeof r0[k]==='number'&&isFinite(r0[k])) o.run[k]=r0[k];   // saco e fuga gravados no enter: recarregar não muda
    if(Array.isArray(r0.escapes)) o.run.escapes=r0.escapes.filter(x=>typeof x==='number'&&isFinite(x)); }
  if(o.paid!==undefined) o.paid=Array.isArray(o.paid)?o.paid.filter(x=>typeof x==='string').slice(-DATA.paidKeep):[];
  return o; }
function today(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.used=0; o.run=null; } return o; }

/* nível da Fogueira agora (1 sem o módulo) */
const fireLv=S=>{ const B=SYS().bonfire; try{ return B&&B.ensure?clamp(int0(B.ensure(S).lv)||1,1,DATA.maxLevel):1; }catch(e){ return 1; } };
/* fração do dano de referência que o saco tem no nível da Fogueira (linear de fracMin a fracMax) */
function bagFrac(lv){ const b=DATA.bag; lv=clamp(int0(lv)||1,1,DATA.maxLevel); return b.fracMin+(b.fracMax-b.fracMin)*(lv-1)/Math.max(1,DATA.maxLevel-1); }
/* dano por segundo de referência do herói AGORA (Sys.fc.stats; sem o módulo: host.atk e o crítico de base). host.heroDps(), se existir, manda */
function refDps(S,host){ const b=DATA.bag;
  try{ if(host&&typeof host.heroDps==='function'){ const d=num(host.heroDps(),0); if(d>0) return d; } }catch(e){}
  let atk=0, cr=b.critRate, cd=b.critDmg, sp=0; const F=SYS().fc;
  try{ if(F&&typeof F.stats==='function'){ const st=F.stats(S,host)||{}; atk=num(st.atk,0); cr=num(st.critRate,num(st.crit,cr)); cd=num(st.critDmg,cd); sp=num(st.aspd,0); } }catch(e){ atk=0; }
  if(!(atk>0)){ try{ atk=num(host&&host.atk&&host.atk(),0); }catch(e){ atk=0; } }
  const T=SYS().stats, cap=T&&T.DATA&&T.DATA.caps?T.DATA.caps:{critRate:75,aspd:100,critDmg:400};
  cr=clamp(cr,0,cap.critRate)/100; cd=clamp(cd,0,cap.critDmg)/100; sp=clamp(sp,0,cap.aspd)/100;
  const kit=(1+sp)/b.s1Sec+b.s2Mult/b.s2Sec+b.ultMult/b.ultSec;
  return Math.max(0,atk)*(1+cr*cd)*kit*b.pace; }
/* vida do saco: dps de referência × secs × frac(nível). Mínimo 1 */
const bagOf=(S,host,lv,secs)=>Math.max(1,Math.round(refDps(S,host)*secs*bagFrac(lv)));
/* semente (texto → inteiro) e sequência determinística (mulberry32): a mesma seed dá sempre a mesma fuga */
function hashStr(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function seq(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
/* inícios das fugas (s desde o começo), cada um com o desvio da seed; só os que começam antes do fim */
function escapesOf(seed,secs){ const E=DATA.escape, r=seq(int0(seed)), out=[]; for(let i=0;;i++){ const t0=E.at+i*E.every; if(t0>=secs) break;
    const x=Math.round((t0+(r()*2-1)*E.jitter)*100)/100; if(x<secs) out.push(x); } return out; }
/* campos da corrida que a luta lê (gravados no enter): bagHp, secs, seed e a fuga */
function chaseOf(S,host,lv,secs,seed){ const E=DATA.escape, sd=int0(seed)>>>0;
  return {bagHp:bagOf(S,host,lv,secs),secs,seed:sd,escapeAt:E.at,escapeEvery:E.every,escapeDur:E.dur,jitter:E.jitter,escapes:escapesOf(sd,secs)}; }
const CHASE_KEYS=['bagHp','secs','seed','escapeAt','escapeEvery','escapeDur','jitter','endsAt'];
const seedOf=(v,id)=>v!=null&&v!==''&&isFinite(+v)?Math.abs(Math.floor(+v)):hashStr(id);
const runCopy=r=>{ if(!r) return null; const o=Object.assign({},r); if(Array.isArray(r.escapes)) o.escapes=r.escapes.slice(); return o; };
/* lote (Brasas de uma entrada cheia) no nível da Fogueira */
function loteOf(lv){ lv=clamp(int0(lv)||1,1,DATA.maxLevel); const B=SYS().bonfire; if(B&&typeof B.perTap==='function') return B.perTap(lv);
  let n=1; for(const x of DATA.lote) if(lv>=x.from) n=x.n; return n; }
const left=(S,host)=>Math.max(0,PER()-today(S,host).used);
function give(S,n){ const B=SYS().bonfire; if(!B||typeof B.addBrasas!=='function'||n<=0) return 0; try{ return int0(B.addBrasas(S,'thief',n)); }catch(e){ return 0; } }

/* pode entrar? {ok, lv, lote, reason:'off'|'entries'|'run'} */
function canEnter(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=today(S,host);
  if(o.run) return {ok:false,reason:'run'}; if(left(S,host)<=0) return {ok:false,reason:'entries'};
  const lv=fireLv(S); return {ok:true,lv,lote:loteOf(lv)}; }
/* começa a perseguição. O lote, a VIDA DO SACO e a fuga ficam presos à entrada (nível da Fogueira e herói de AGORA; trocar de equipamento depois não muda).
   {ok, lv, lote, secs, bagHp, seed, escapeAt, escapeEvery, escapeDur, jitter, escapes, rid, t} */
function enter(S,host){ if(ONLINE()&&ON()) return {ok:false,reason:'online'}; const c=canEnter(S,host); if(!c.ok) return c; const o=today(S,host); o.used=Math.min(DATA.entries,o.used+1);   /* REGRA ÚNICA (igual ao servidor, API_SERVIDOR): a entrada é GASTA AO ENTRAR; sair no meio não devolve */
  const t=nowOf(host), rid='L'+o.day+'-'+o.used+'-'+Math.floor(t).toString(36);   // id local da corrida (a seed sai dele)
  o.run=Object.assign({lv:c.lv,t,rid},chaseOf(S,host,c.lv,DATA.secs,hashStr(rid)));
  return Object.assign(runCopy(o.run),{ok:true,lote:c.lote}); }
/* fim da perseguição: {score:0..1} (fração do saco que caiu). Gasta 1 entrada. score 1 = lote cheio e nível vencido.
   {ok, score, lv, lote, drop (o que o ladrão soltou), brasas (as que entraram na Fogueira), won, best, left} */
function finish(S,host,res){ if(!ON()) return {ok:false,reason:'off'}; if(ONLINE()) return {ok:false,reason:'online'}; const o=today(S,host); if(!o.run) return {ok:false,reason:'run'};
  const sc=clamp(num(res&&res.score,0),0,1), lv=o.run.lv, lote=loteOf(lv), drop=clamp(Math.round(lote*sc),0,lote), won=sc>=1;
  o.run=null; if(won&&lv>o.best) o.best=lv;   /* a entrada já foi gasta no enter */
  const got=give(S,drop); o.total+=got; return {ok:true,score:sc,lv,lote,drop,brasas:got,won,best:o.best,left:left(S,host)}; }
/* compatível com {won:true|false, frac}: won = score 1 */
const result=(S,host,res)=>finish(S,host,{score:res&&res.won===true?1:num(res&&(res.score!=null?res.score:res.frac),0)});
/* saiu antes de começar a lutar: não gasta entrada */
function cancel(S,host){ const o=today(S,host); const had=!!o.run; o.run=null; return had; }
/* REPETIR: lote cheio do melhor nível já vencido, na hora. {ok, lv, drop, brasas, left, reason:'off'|'entries'|'none'|'run'} */
function sweep(S,host){ if(!ON()) return {ok:false,reason:'off'}; if(ONLINE()) return {ok:false,reason:'online'}; const o=today(S,host); if(o.run) return {ok:false,reason:'run'};
  if(o.best<1) return {ok:false,reason:'none'}; if(left(S,host)<=0) return {ok:false,reason:'entries'};
  o.used++; const drop=loteOf(o.best), got=give(S,drop); o.total+=got; return {ok:true,lv:o.best,drop,brasas:got,left:left(S,host)}; }

/* para a tela: {on, entries, used, left, lv, lote, best, sweepLote, canEnter, canSweep, secs, run, total} */
function view(S,host){ const o=today(S,host), lv=fireLv(S), L=left(S,host);
  return {on:ON(),entries:PER(),used:o.used,left:L,lv,lote:loteOf(lv),best:o.best,sweepLote:o.best?loteOf(o.best):0,
    canEnter:ON()&&!o.run&&L>0,canSweep:ON()&&!o.run&&o.best>0&&L>0,secs:DATA.secs,run:runCopy(o.run),total:o.total}; }
/* ---------------- ONLINE (só o Sys.thiefNet chama; o servidor já decidiu) ---------------- */
function setProvider(p){ PROV=p&&typeof p==='object'?p:null; if(!PROV) SRV.per=0; return ONLINE(); }
const usedOf=el=>clamp(PER()-int0(el),0,PER());
/* GET /v1/thief → espelha entradas, melhor nível e a corrida aberta. O servidor manda; nada é creditado aqui */
function applyServer(S,host,d){ if(!ON()) return {ok:false,reason:'off'}; if(!d||typeof d!=='object') return {ok:false,reason:'data'}; const o=today(S,host);
  if(int0(d.perDay)>0) SRV.per=int0(d.perDay); if(d.entriesLeft!=null) o.used=usedOf(d.entriesLeft); if(d.bestLevel!=null) o.best=clamp(int0(d.bestLevel),0,DATA.maxLevel);
  const r=d.run&&typeof d.run==='object'&&typeof d.run.runId==='string'&&d.run.runId?d.run:null;
  if(!r) o.run=null;
  else if(!(o.run&&o.run.id===r.runId)&&!(o.paid||[]).includes(r.runId)){ const lv=clamp(int0(d.fireLevel)||fireLv(S),1,DATA.maxLevel);
    o.run=Object.assign({lv,t:num(r.endsAt,nowOf(host)+DATA.secs*1000)-DATA.secs*1000,id:r.runId,max:int0(d.batch)||loteOf(lv)},
      chaseOf(S,host,lv,DATA.secs,seedOf(r.seed,r.runId)));   /* corrida aberta que este save não tinha (outro aparelho): o saco sai do herói de agora */
    if(num(r.endsAt,0)>0) o.run.endsAt=r.endsAt; }
  return {ok:true,left:left(S,host),best:o.best,run:runCopy(o.run)}; }
/* POST /v1/thief/enter deu certo: a entrada já foi gasta NO SERVIDOR; abre a corrida com o runId e o lote dele. O servidor NÃO manda a vida do saco: o jogo
   calcula aqui, igual ao enter local, com a seed do servidor. run.endsAt do servidor é o limite do relógio da luta.
   {ok, lv, lote, secs, runId, seed, endsAt, left, bagHp, escapeAt, escapeEvery, escapeDur, jitter, escapes} */
function serverEnter(S,host,r){ if(!ON()) return {ok:false,reason:'off'}; if(!r||typeof r.runId!=='string'||!r.runId) return {ok:false,reason:'data'}; const o=today(S,host);
  if(r.entriesLeft!=null) o.used=usedOf(r.entriesLeft); const lv=fireLv(S), lote=int0(r.maxBrasas)||loteOf(lv);
  const secs=num(r.endsAt,0)>num(r.startsAt,0)&&num(r.startsAt,0)>0?Math.round((r.endsAt-r.startsAt)/1000):DATA.secs;
  o.run=Object.assign({lv,t:nowOf(host),id:r.runId,max:lote},chaseOf(S,host,lv,secs,seedOf(r.seed,r.runId))); if(num(r.endsAt,0)>0) o.run.endsAt=r.endsAt;
  return Object.assign(runCopy(o.run),{ok:true,lv,lote,secs,runId:r.runId,seed:r.seed,endsAt:r.endsAt,left:left(S,host)}); }
/* POST /v1/thief/finish deu certo: credita as Brasas do SERVIDOR uma vez só por runId. Mesmo formato do finish local (+runId) */
function serverFinish(S,host,runId,r){ if(!ON()) return {ok:false,reason:'off'}; const id=String(runId==null?'':runId); if(!id||!r||typeof r!=='object') return {ok:false,reason:'data'};
  const o=today(S,host); if(!Array.isArray(o.paid)) o.paid=[]; if(o.paid.includes(id)) return {ok:false,reason:'paid'};
  const run=o.run&&o.run.id===id?o.run:null, lv=run?run.lv:fireLv(S), lote=int0(r.maxBrasas)||(run&&run.max)||loteOf(lv);
  const sc=clamp(num(r.score,0),0,1), drop=clamp(int0(r.brasas),0,lote), won=sc>=1;
  if(run) o.run=null; if(won&&lv>o.best) o.best=lv; o.paid.push(id); if(o.paid.length>DATA.paidKeep) o.paid.splice(0,o.paid.length-DATA.paidKeep);
  const got=give(S,drop); o.total+=got; return {ok:true,score:sc,lv,lote,drop,brasas:got,won,best:o.best,left:left(S,host),runId:id}; }
/* POST /v1/thief/sweep deu certo: credita o lote do servidor (uma chamada = um crédito). Mesmo formato do sweep local */
function serverSweep(S,host,r){ if(!ON()) return {ok:false,reason:'off'}; if(!r||typeof r!=='object') return {ok:false,reason:'data'}; const o=today(S,host);
  if(r.entriesLeft!=null) o.used=usedOf(r.entriesLeft); if(r.bestLevel!=null) o.best=clamp(int0(r.bestLevel),0,DATA.maxLevel);
  const drop=int0(r.brasas), got=give(S,drop); o.total+=got; return {ok:true,lv:o.best,drop,brasas:got,left:left(S,host)}; }
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,dayKey,loteOf,bagFrac,refDps,escapesOf,canEnter,enter,finish,result,cancel,sweep,view,bonus,
  setProvider,online:ONLINE,applyServer,serverEnter,serverFinish,serverSweep};
root.Sys=root.Sys||{}; root.Sys.thief=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
