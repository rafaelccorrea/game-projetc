/* Eonbound — Sys.mail: CORREIO do sistema. Mensagens com anexo (pacote: ouro, gemas, itens, ovos, materiais, skin), resgatar uma ou todas,
   expiração em 30 dias. Quem manda é o jogo (compensações, prêmios de ranking, avisos). A entrega usa Sys.loot.grantBundle (portões e itens guardados).
   Lógica pura; estado em S.sys.mail. Relatório: reports/sys-mail-login-eventos.md */
(function(root){
'use strict';
const DATA={expireDays:30, max:100, enabled:false};   // CHAVE (PO): desligado até o dono aprovar a tela; o jogo liga com Sys.mail.DATA.enabled=true
const OFF={ok:false,reason:'desligado'};
const DAY=86400000;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const Loot=()=>root.Sys&&root.Sys.loot;
const hasAtt=m=>!!(m.att&&typeof m.att==='object'&&Object.keys(m.att).length);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.mail.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.mail; if(!o||typeof o!=='object') o=S.sys.mail={};
  o.v=1; o.seq=int0(o.seq); if(!Array.isArray(o.list)) o.list=[];
  o.list=o.list.filter(m=>m&&Number.isInteger(m.id)&&typeof m.title==='string').map(m=>({id:m.id,title:m.title,body:String(m.body||''),att:m.att&&typeof m.att==='object'?m.att:null,
    at:num(m.at,0),exp:num(m.exp,0),read:!!m.read,claimed:!!m.claimed}));
  return o;
}
/* tira as vencidas (com ou sem anexo: o anexo não resgatado se perde, como avisado na tela) */
function purge(S,host){ const o=ensure(S), now=nowOf(host); o.list=o.list.filter(m=>m.exp>now); return o; }
/* envia: {title, body, att, days} → id. Acima de 100 mensagens, sai a mais antiga já resgatada/sem anexo; se não houver, a mais antiga. */
function send(S,host,msg){
  if(!DATA.enabled) return 0;
  const o=purge(S,host); msg=msg||{}; const now=nowOf(host), days=Math.max(1,num(msg.days,DATA.expireDays));
  const m={id:++o.seq,title:String(msg.title||'Mensagem'),body:String(msg.body||''),att:msg.att&&typeof msg.att==='object'?msg.att:null,at:now,exp:now+days*DAY,read:false,claimed:false};
  o.list.push(m);
  while(o.list.length>DATA.max){ const i=o.list.findIndex(x=>x.claimed||!hasAtt(x)); o.list.splice(i>=0?i:0,1); }
  return m.id;
}
/* caixa de entrada, mais nova primeiro: [{id, title, body, att, at, exp, daysLeft, read, claimed, hasAtt}] */
function inbox(S,host){ const o=purge(S,host), now=nowOf(host);
  return o.list.slice().sort((a,b)=>b.at-a.at||b.id-a.id).map(m=>({...m,hasAtt:hasAtt(m),daysLeft:Math.max(0,Math.ceil((m.exp-now)/DAY))})); }
function read(S,host,id){ const m=purge(S,host).list.find(x=>x.id===id); if(m) m.read=true; return !!m; }
/* resgata o anexo de uma mensagem → {ok, got} ou {ok:false, reason:'id'|'sem_anexo'|'resgatado'} */
function claim(S,host,id){
  if(!DATA.enabled) return OFF;
  const m=purge(S,host).list.find(x=>x.id===id); if(!m) return {ok:false,reason:'id'};
  if(!hasAtt(m)) return {ok:false,reason:'sem_anexo'}; if(m.claimed) return {ok:false,reason:'resgatado'};
  const L=Loot(); m.claimed=true; m.read=true;
  if(L&&L.grantBundle) return {ok:true,got:L.grantBundle(S,host,m.att)};
  // reserva sem Sys.loot: só ouro e gemas (o resto exige o loot carregado)
  const gold=int0(m.att.gold), gems=int0(m.att.gems);
  if(gold&&host.addGold) host.addGold(gold); if(gems&&host.addGems) host.addGems(gems);
  return {ok:true,got:{gold,gems}};
}
function claimAll(S,host){ if(!DATA.enabled) return {n:0,list:[],reason:'desligado'}; const out=[]; for(const m of inbox(S,host)) if(m.hasAtt&&!m.claimed){ const r=claim(S,host,m.id); if(r.ok) out.push({id:m.id,got:r.got}); } return {n:out.length,list:out}; }
/* apaga: só sem anexo pendente */
function remove(S,host,id){ const o=purge(S,host), i=o.list.findIndex(x=>x.id===id); if(i<0) return false; const m=o.list[i]; if(hasAtt(m)&&!m.claimed) return false; o.list.splice(i,1); return true; }
function unread(S,host){ return inbox(S,host).filter(m=>!m.read||(m.hasAtt&&!m.claimed)).length; }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,send,inbox,read,claim,claimAll,remove,unread,bonus};
root.Sys=root.Sys||{}; root.Sys.mail=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
