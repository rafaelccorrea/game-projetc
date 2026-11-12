/* Eonbound — Sys.login: LOGIN DIÁRIO. Calendário de 7 dias que reinicia; o 7º vale mais. Nada pago, nada sorteado.
   1 resgate por dia de calendário (meia-noite local). Faltar um dia NÃO zera: o calendário continua de onde parou e reinicia depois do 7º.
   Entrega por Sys.loot.grantBundle. Estado em S.sys.login. Relatório: reports/sys-mail-login-eventos.md */
(function(root){
'use strict';
const DATA={
  enabled:false,   // CHAVE (PO): desligado até o dono aprovar a tela; o jogo liga com Sys.login.DATA.enabled=true
  // goldk = × ouro de um abate da fase. 7º dia: Essência da Era (3) + 💎 (escolhido no lugar do ovo para não mexer no balanço de pets já fechado;
  // trocar por eggs:[1] se o PO preferir o ovo).
  days:[
    {goldk:20},
    {gems:10},
    {forge:5},
    {food:10},
    {gems:10},
    {goldk:30, essence:1},
    {essence:3, gems:10},   // corte de 💎 (PO, v0.12.0): 10 · 10 · 10 = 30/semana (era 45)
  ],
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const pad=n=>String(n).padStart(2,'0');
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==="function") return C.dayKey(ms);   // fuso único (Sys.clock.DATA.tzOffsetMin; com servidor, Brasília)
  const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const Loot=()=>root.Sys&&root.Sys.loot;

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.login.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.login; if(!o||typeof o!=='object') o=S.sys.login={};
  o.v=1; o.step=Math.min(DATA.days.length-1,int0(o.step)); if(typeof o.last!=='string') o.last=''; o.total=int0(o.total);
  return o;
}
/* estado para a tela: {step (0-6, o próximo a resgatar), canClaim, days:[{i, reward, claimed, today}], total} */
function status(S,host){
  const o=ensure(S), can=o.last!==dayKey(nowOf(host)), cur=can?o.step:(o.step+DATA.days.length-1)%DATA.days.length;
  return {step:o.step,canClaim:can,total:o.total,days:DATA.days.map((r,i)=>({i,reward:r,claimed:can?i<o.step:i<=cur,today:i===(can?o.step:cur)}))};
}
/* resgata o dia → {ok, day (1-7), got} ou {ok:false, reason:'hoje'} */
function claim(S,host){
  if(!DATA.enabled) return {ok:false,reason:'desligado'};
  const o=ensure(S), k=dayKey(nowOf(host)); if(o.last===k) return {ok:false,reason:'hoje'};
  const i=o.step, rw=DATA.days[i], L=Loot();
  const got=L&&L.grantBundle?L.grantBundle(S,host,rw):null;
  o.last=k; o.total++; o.step=(i+1)%DATA.days.length;
  return {ok:true,day:i+1,got};
}
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,status,claim,bonus,dayKey};
root.Sys=root.Sys||{}; root.Sys.login=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
