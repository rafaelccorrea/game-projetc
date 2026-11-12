/* Eonbound — Sys.clock: RELÓGIO CONFIÁVEL (sem servidor) e BÔNUS DE RETORNO. Decisões do PO na curva de 9 eras (docs/CURVA_9_ERAS.md §7).
   Atrás de chave DESLIGADA (DATA.on=false): desligado, now() devolve o relógio do aparelho e nada de retorno é dado.
   RELÓGIO: o tempo nunca anda para trás. Se o aparelho volta o relógio, o jogo continua no maior instante já visto: diárias, instâncias, login
   e offline não reabrem. Avançar o relógio COM O APP ABERTO é detectado (o Date anda muito mais que o tempo real da sessão) e não conta.
   Limite honesto: avançar o relógio com o app FECHADO não dá para distinguir de ficar dias fora sem um servidor.
   RETORNO: quem falta ganha "XP descansada" pelos dias perdidos (até 3): cada dia perdido guarda meio dia de abates; enquanto houver saldo, cada
   abate da campanha dá XP e ouro em DOBRO (o Sys.loot consome). Não compensa abandono: nunca mais de 3 dias.
   Estado em S.sys.clock. Relatório: reports/curva-9-eras-30.md */
(function(root){
'use strict';
const DATA={
  on:false,
  backTolerance:10*60*1000,       // até 10 min para trás (ajuste de fuso/sincronização) não conta como voltar o relógio
  sessionSlack:2*60*1000,         // app aberto: o Date pode andar até 2 min a mais que o tempo real da sessão
  rested:{maxDays:3, killsPerDay:480, mult:2},   // 480 = meio dia de abates (40 min × 24/min ÷ 2); dobra XP e ouro
};
const DAY=86400000;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function dayIndex(ms){ const d=new Date(ms); return Math.floor(new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime()/DAY+0.5); }
const rawNow=host=>num(host&&host.rawNow?host.rawNow():(host&&host.now&&host.now()),Date.now());
const perfNow=host=>num(host&&host.perf?host.perf():(typeof performance!=='undefined'?performance.now():NaN),NaN);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.clock.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.clock; if(!o||typeof o!=='object') o=S.sys.clock={};
  o.v=1; o.max=num(o.max,0); o.lastDay=typeof o.lastDay==='string'?o.lastDay:''; o.lastIdx=int0(o.lastIdx); o.rested=int0(o.rested); o.flags=int0(o.flags);
  return o;
}
/* instante CONFIÁVEL: nunca menor que o maior já visto; com o app aberto, não deixa o Date correr mais que o tempo real.
   O jogo põe isto no Sys.host: host.now = () => Sys.clock.now(S, {rawNow: () => Date.now()}). */
let sess=null;   // {perf0, date0, base}: âncora da sessão (memória, não vai para o save)
function now(S,host){
  const t=rawNow(host); if(!DATA.on) return t;
  const o=ensure(S), p=perfNow(host);
  let g=t;
  if(isFinite(p)){
    if(!sess){ sess={perf0:p,date0:t,base:Math.max(t,o.max)}; }
    const real=sess.base+(p-sess.perf0);                       // tempo real decorrido desde a abertura do app
    if(t>real+DATA.sessionSlack){ g=real; if(!o._fwd){ o.flags++; o._fwd=true; } }   // relógio adiantado com o app aberto
  }
  if(g<o.max-DATA.backTolerance){ if(!o._back){ o.flags++; o._back=true; } g=o.max; }   // relógio voltado
  else g=Math.max(g,o.max-DATA.backTolerance);
  if(g>o.max) o.max=g;
  return Math.max(g,o.max);
}
/* segundos de OFFLINE confiáveis desde lastSeen (o jogo grava lastSeen = Sys.clock.now ao sair). Relógio voltado = 0. */
function offlineSeconds(S,host,lastSeen){ const t=now(S,host); return Math.max(0,(t-num(lastSeen,t))/1000); }
/* chamar 1x por carga/retorno: marca o dia e, com dias perdidos, enche a XP descansada (até 3 dias). → {newDay, missed, added, rested} */
function checkIn(S,host){
  const o=ensure(S), t=now(S,host), k=dayKey(t), idx=dayIndex(t);
  if(o.lastDay===k) return {newDay:false,missed:0,added:0,rested:o.rested};
  const missed=o.lastDay?Math.max(0,Math.min(DATA.rested.maxDays,idx-o.lastIdx-1)):0;
  let added=0; if(DATA.on&&missed){ const cap=DATA.rested.maxDays*DATA.rested.killsPerDay; added=Math.min(cap-o.rested,missed*DATA.rested.killsPerDay); o.rested+=Math.max(0,added); }
  o.lastDay=k; o.lastIdx=idx;
  return {newDay:true,missed,added:Math.max(0,added),rested:o.rested};
}
/* o Sys.loot chama a cada abate da campanha: true = este abate vale em dobro (consome 1 do saldo) */
function takeRested(S){ if(!DATA.on) return false; const o=ensure(S); if(o.rested<=0) return false; o.rested--; return true; }
const rested=S=>ensure(S).rested;

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,now,offlineSeconds,checkIn,takeRested,rested,bonus,dayKey,_reset:()=>{ sess=null; }};
root.Sys=root.Sys||{}; root.Sys.clock=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
