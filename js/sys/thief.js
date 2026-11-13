/* Eonbound — Sys.thief: LADRÃO DE BRASAS (instância diária com "Repetir"). P1 do docs/LOM_VS_EONBOUND.md (seç. 3, 5.3 e 7.3), aprovado pelo dono.
   Números = contrato do servidor (fps-6f). CHAVE DESLIGADA (DATA.on=false): desligada, nada muda no jogo.
   Um goblin ladrão foge com um saco de Brasas por 45 s; o jogador bate para soltar as Brasas. 2 entradas GRÁTIS por dia (zeram na virada do dia de
   Brasília, UTC-3). Não há entrada paga, chave por anúncio, nada à venda nem sorteio pago (o jogo tem menores).
   PRÊMIO: no máximo 1 LOTE por entrada, pelo NÍVEL DA FOGUEIRA (Sys.bonfire.perTap: 1-3 = 1, 4-6 = 2, 7-9 = 4, 10-19 = 5, 20-34 = 6, 35-49 = 8, 50-60 = 10).
   Fixo, sem sorteio. O fim é finish {score 0..1}: Brasas = round(lote × score); score 1 = lote cheio e o nível fica VENCIDO (best = nível da Fogueira).
   Cada fim gasta 1 entrada. REPETIR (sweep): gasta 1 entrada e dá na hora o lote cheio do melhor nível já vencido ("Varrer o último" do LoM).
   As Brasas entram pelo Sys.bonfire.addBrasas(S,'thief',n) (conta no got; o teto do estoque e a chave da Fogueira valem).
   Estado: S.sys.thief. Teste: test/sys/thief.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  entries:2,                 // por dia, grátis (LoM: 2 chaves; as +2 por anúncio NÃO existem aqui)
  secs:45,                   // duração da perseguição (a tela usa)
  /* reserva igual ao contrato, usada só se o Sys.bonfire não estiver carregado */
  lote:[{from:1,n:1},{from:4,n:2},{from:7,n:4},{from:10,n:5},{from:20,n:6},{from:35,n:8},{from:50,n:10}],
  maxLevel:60,
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
/* dia de BRASÍLIA (UTC-3, 'YYYY-MM-DD'), o mesmo que o servidor usa para contar as entradas */
const dayKey=ms=>new Date(ms-3*3600000).toISOString().slice(0,10);

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.thief.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.thief; if(!o||typeof o!=='object') o=S.sys.thief={}; o.v=1;
  o.day=typeof o.day==='string'?o.day:''; o.used=clamp(int0(o.used),0,DATA.entries); o.best=clamp(int0(o.best),0,DATA.maxLevel); o.total=int0(o.total);
  o.run=(o.run&&typeof o.run==='object'&&int0(o.run.lv)>=1)?{lv:clamp(int0(o.run.lv),1,DATA.maxLevel),t:num(o.run.t,0)}:null;
  return o; }
function today(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.used=0; o.run=null; } return o; }

/* nível da Fogueira agora (1 sem o módulo) */
const fireLv=S=>{ const B=SYS().bonfire; try{ return B&&B.ensure?clamp(int0(B.ensure(S).lv)||1,1,DATA.maxLevel):1; }catch(e){ return 1; } };
/* lote (Brasas de uma entrada cheia) no nível da Fogueira */
function loteOf(lv){ lv=clamp(int0(lv)||1,1,DATA.maxLevel); const B=SYS().bonfire; if(B&&typeof B.perTap==='function') return B.perTap(lv);
  let n=1; for(const x of DATA.lote) if(lv>=x.from) n=x.n; return n; }
const left=(S,host)=>Math.max(0,DATA.entries-today(S,host).used);
function give(S,n){ const B=SYS().bonfire; if(!B||typeof B.addBrasas!=='function'||n<=0) return 0; try{ return int0(B.addBrasas(S,'thief',n)); }catch(e){ return 0; } }

/* pode entrar? {ok, lv, lote, reason:'off'|'entries'|'run'} */
function canEnter(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=today(S,host);
  if(o.run) return {ok:false,reason:'run'}; if(left(S,host)<=0) return {ok:false,reason:'entries'};
  const lv=fireLv(S); return {ok:true,lv,lote:loteOf(lv)}; }
/* começa a perseguição (não gasta entrada; quem gasta é o fim). O lote fica preso ao nível da Fogueira na entrada. {ok, lv, lote, secs} */
function enter(S,host){ const c=canEnter(S,host); if(!c.ok) return c; const o=ensure(S); o.run={lv:c.lv,t:nowOf(host)}; return {ok:true,lv:c.lv,lote:c.lote,secs:DATA.secs}; }
/* fim da perseguição: {score:0..1} (fração do saco que caiu). Gasta 1 entrada. score 1 = lote cheio e nível vencido.
   {ok, score, lv, lote, drop (o que o ladrão soltou), brasas (as que entraram na Fogueira), won, best, left} */
function finish(S,host,res){ if(!ON()) return {ok:false,reason:'off'}; const o=today(S,host); if(!o.run) return {ok:false,reason:'run'};
  const sc=clamp(num(res&&res.score,0),0,1), lv=o.run.lv, lote=loteOf(lv), drop=clamp(Math.round(lote*sc),0,lote), won=sc>=1;
  o.run=null; o.used=Math.min(DATA.entries,o.used+1); if(won&&lv>o.best) o.best=lv;
  const got=give(S,drop); o.total+=got; return {ok:true,score:sc,lv,lote,drop,brasas:got,won,best:o.best,left:left(S,host)}; }
/* compatível com {won:true|false, frac}: won = score 1 */
const result=(S,host,res)=>finish(S,host,{score:res&&res.won===true?1:num(res&&(res.score!=null?res.score:res.frac),0)});
/* saiu antes de começar a lutar: não gasta entrada */
function cancel(S,host){ const o=today(S,host); const had=!!o.run; o.run=null; return had; }
/* REPETIR: lote cheio do melhor nível já vencido, na hora. {ok, lv, drop, brasas, left, reason:'off'|'entries'|'none'|'run'} */
function sweep(S,host){ if(!ON()) return {ok:false,reason:'off'}; const o=today(S,host); if(o.run) return {ok:false,reason:'run'};
  if(o.best<1) return {ok:false,reason:'none'}; if(left(S,host)<=0) return {ok:false,reason:'entries'};
  o.used++; const drop=loteOf(o.best), got=give(S,drop); o.total+=got; return {ok:true,lv:o.best,drop,brasas:got,left:left(S,host)}; }

/* para a tela: {on, entries, used, left, lv, lote, best, sweepLote, canEnter, canSweep, secs, run, total} */
function view(S,host){ const o=today(S,host), lv=fireLv(S), L=left(S,host);
  return {on:ON(),entries:DATA.entries,used:o.used,left:L,lv,lote:loteOf(lv),best:o.best,sweepLote:o.best?loteOf(o.best):0,
    canEnter:ON()&&!o.run&&L>0,canSweep:ON()&&!o.run&&o.best>0&&L>0,secs:DATA.secs,run:o.run?Object.assign({},o.run):null,total:o.total}; }
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,dayKey,loteOf,canEnter,enter,finish,result,cancel,sweep,view,bonus};
root.Sys=root.Sys||{}; root.Sys.thief=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
