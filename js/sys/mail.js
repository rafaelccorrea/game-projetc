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
/* ITENS NOVOS PELO CORREIO (fps-server §14): a carta do servidor pode trazer att.newDrops = {src, ctx}. O SERVIDOR decide quem ganha e em que posição;
   o PRÊMIO é o da tabela do Sys.newDrops (newdrops.js), chamado aqui no resgate. Só as fontes que o servidor decide (= SERVER_DROP_SOURCES do mail-core).
   Idempotente pela carta (o.done, como o resto do anexo). Com o Sys.newDrops desligado, a carta NÃO é consumida (fica para quando ligar). */
const ND_SRC=['tourney:weekend','guild:weekly','guild:capital','worldboss'];
const NewDrops=()=>root.Sys&&root.Sys.newDrops;
const ndOf=m=>{ const x=m.att&&m.att.newDrops; return x&&typeof x==='object'&&ND_SRC.includes(x.src)?{src:x.src,ctx:(x.ctx&&typeof x.ctx==='object')?x.ctx:{}}:null; };
const ndOn=()=>{ const N=NewDrops(); return !!(N&&N.DATA&&N.DATA.on===true&&typeof N.grant==='function'); };
/* TIPO e REMETENTE (Q-10, autorizado pela fps-6f): type ∈ TYPES; a caixa do servidor manda `source` (arena, ranking, compensacao, equipe, evento, guilda...)
   e o jogo aceita os dois: type explícito vence; senão vem do source (SOURCE_TYPE); sem nada: 'reward' com anexo, 'system' sem. Formato do servidor
   (fps-server mail-core, contrato §8): {id, title, body, att, createdAt, expiresAt, source, ref}; id pode ser número (local) ou texto (servidor). */
const TYPES=['system','reward','guild','event'];
const SOURCE_TYPE={arena:'reward',ranking:'reward',torneio:'reward',passe:'reward',compensacao:'system',equipe:'system',sistema:'system',evento:'event',event:'event',guilda:'guild',guild:'guild'};
const FROM={system:'Equipe Eonbound',reward:'Prêmios',guild:'Guilda',event:'Eventos'};
const typeOf=(t,src,att)=>TYPES.includes(t)?t:(SOURCE_TYPE[String(src||'').toLowerCase()]||(att&&typeof att==='object'&&Object.keys(att).length?'reward':'system'));
const okId=id=>Number.isInteger(id)||(typeof id==='string'&&id.length>0&&id.length<=80);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.mail.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.mail; if(!o||typeof o!=='object') o=S.sys.mail={};
  o.v=1; o.seq=int0(o.seq); if(!Array.isArray(o.list)) o.list=[];
  o.done=Array.isArray(o.done)?o.done.filter(okId).slice(-300):[];   // resgate IDEMPOTENTE pela carta (id): reimportar do servidor não paga de novo
  o.list=o.list.filter(m=>m&&okId(m.id)&&typeof m.title==='string').map(m=>{ const att=m.att&&typeof m.att==='object'?m.att:null, type=typeOf(m.type,m.source,att);
    return {id:m.id,title:m.title,body:String(m.body||''),att,at:num(m.at,0),exp:num(m.exp,0),read:!!m.read,claimed:!!m.claimed||o.done.includes(m.id),
      type,source:typeof m.source==='string'?m.source:'',from:typeof m.from==='string'&&m.from?m.from.slice(0,40):FROM[type],ref:m.ref!=null?String(m.ref).slice(0,80):''}; });
  return o;
}
/* tira as vencidas (com ou sem anexo: o anexo não resgatado se perde, como avisado na tela) */
function purge(S,host){ const o=ensure(S), now=nowOf(host); o.list=o.list.filter(m=>m.exp>now); return o; }
/* envia: {title, body, att, days} → id. Acima de 100 mensagens, sai a mais antiga já resgatada/sem anexo; se não houver, a mais antiga. */
function send(S,host,msg){
  if(!DATA.enabled) return 0;
  const o=purge(S,host); msg=msg||{}; const now=nowOf(host), days=Math.max(1,num(msg.days,DATA.expireDays));
  const att=msg.att&&typeof msg.att==='object'?msg.att:null, type=typeOf(msg.type,msg.source,att), exp=num(msg.expiresAt,0)>now?num(msg.expiresAt,0):now+days*DAY;
  const m={id:++o.seq,title:String(msg.title||'Mensagem'),body:String(msg.body||''),att,at:now,exp,read:false,claimed:false,
    type,source:typeof msg.source==='string'?msg.source:'',from:typeof msg.from==='string'&&msg.from?msg.from.slice(0,40):FROM[type],ref:msg.ref!=null?String(msg.ref).slice(0,80):''};
  o.list.push(m);
  while(o.list.length>DATA.max){ const i=o.list.findIndex(x=>x.claimed||!hasAtt(x)); o.list.splice(i>=0?i:0,1); }
  return m.id;
}
/* caixa de entrada, mais nova primeiro: [{id, title, body, att, at, exp, daysLeft, read, claimed, hasAtt}] */
function inbox(S,host){ const o=purge(S,host), now=nowOf(host);
  return o.list.slice().sort((a,b)=>b.at-a.at||String(b.id).localeCompare(String(a.id))).map(m=>({...m,hasAtt:hasAtt(m),createdAt:m.at,expiresAt:m.exp,daysLeft:Math.max(0,Math.ceil((m.exp-now)/DAY))})); }
/* CAIXA DO SERVIDOR → jogo: [{id, title, body, att, createdAt, expiresAt, source, ref, type?, from?, claimed?}] (mesmo formato do mail-core). Junta sem duplicar
   (pelo id); carta que o servidor diz resgatada, ou já resgatada aqui, não paga de novo. Devolve quantas entraram. */
function receive(S,host,list){ if(!DATA.enabled||!Array.isArray(list)) return 0; const o=purge(S,host), now=nowOf(host); let n=0;
  for(const x of list){ if(!x||!okId(x.id)||o.list.some(m=>m.id===x.id)) continue; const att=x.att&&typeof x.att==='object'?x.att:null, exp=num(x.expiresAt,0)||now+DATA.expireDays*DAY; if(exp<=now) continue;
    const type=typeOf(x.type,x.source,att); if(x.claimed===true&&!o.done.includes(x.id)) o.done.push(x.id);
    o.list.push({id:x.id,title:String(x.title||'Mensagem'),body:String(x.body||''),att,at:num(x.createdAt,now),exp,read:false,claimed:o.done.includes(x.id),type,source:typeof x.source==='string'?x.source:'',from:typeof x.from==='string'&&x.from?x.from.slice(0,40):FROM[type],ref:x.ref!=null?String(x.ref).slice(0,80):''}); n++; }
  while(o.list.length>DATA.max){ const i=o.list.findIndex(x=>x.claimed||!hasAtt(x)); o.list.splice(i>=0?i:0,1); } return n; }
function read(S,host,id){ const m=purge(S,host).list.find(x=>x.id===id); if(m) m.read=true; return !!m; }
/* resgata o anexo de uma mensagem → {ok, got} ou {ok:false, reason:'id'|'sem_anexo'|'resgatado'} */
function claim(S,host,id){
  if(!DATA.enabled) return OFF;
  const o=purge(S,host), m=o.list.find(x=>x.id===id); if(!m) return {ok:false,reason:'id'};   // uma leitura só da caixa: o ensure recria as cartas
  if(!hasAtt(m)) return {ok:false,reason:'sem_anexo'}; if(m.claimed||o.done.includes(m.id)){ m.claimed=true; return {ok:false,reason:'resgatado'}; }
  const nd=ndOf(m); if(nd&&!ndOn()) return {ok:false,reason:'novos_desligado'};   // não consome: o prêmio novo espera a chave do Sys.newDrops
  const L=Loot(); m.claimed=true; m.read=true; o.done.push(m.id); if(o.done.length>300) o.done.shift();
  const att=Object.assign({},m.att); delete att.newDrops;   // o pacote comum vai sem a chave nova
  const ndGot=nd?NewDrops().grant(S,host,nd.src,nd.ctx):null;
  if(L&&L.grantBundle){ const got=Object.keys(att).length?L.grantBundle(S,host,att):{}; if(ndGot) got.newDrops=ndGot.got||[]; return {ok:true,got}; }
  // reserva sem Sys.loot: só ouro e gemas (o resto exige o loot carregado)
  const gold=int0(att.gold), gems=int0(att.gems);
  if(gold&&host.addGold) host.addGold(gold); if(gems&&host.addGems) host.addGems(gems);
  const got={gold,gems}; if(ndGot) got.newDrops=ndGot.got||[]; return {ok:true,got};
}
function claimAll(S,host){ if(!DATA.enabled) return {n:0,list:[],reason:'desligado'}; const out=[]; for(const m of inbox(S,host)) if(m.hasAtt&&!m.claimed){ const r=claim(S,host,m.id); if(r.ok) out.push({id:m.id,got:r.got}); } return {n:out.length,list:out}; }
/* apaga: só sem anexo pendente */
function remove(S,host,id){ const o=purge(S,host), i=o.list.findIndex(x=>x.id===id); if(i<0) return false; const m=o.list[i]; if(hasAtt(m)&&!m.claimed) return false; o.list.splice(i,1); return true; }
function unread(S,host){ return inbox(S,host).filter(m=>!m.read||(m.hasAtt&&!m.claimed)).length; }

/* CARTAS LOCAIS ÚNICAS (decisão do PO: sem servidor, só a de boas-vindas, SEM anexo). Idempotente pela ref, guardada em S.sys.mail.sent:
   apagar a carta ou ela vencer não faz chegar de novo. Save antigo também recebe uma vez. Devolve o id novo, ou 0 (já enviada / desligado). */
const WELCOME={ref:'boasvindas-v1',type:'system',source:'sistema',title:'Bem-vindo a Eonbound',
  body:'Que bom ter você aqui, viajante! Aqui chegam avisos da equipe e, quando o jogo estiver online, os prêmios de ranking, arena e eventos.'};
function sendOnce(S,host,msg){ if(!DATA.enabled||!msg||!msg.ref) return 0; const o=ensure(S); if(!Array.isArray(o.sent)) o.sent=[];
  const ref=String(msg.ref).slice(0,80); if(o.sent.includes(ref)||o.list.some(m=>m.ref===ref)){ if(!o.sent.includes(ref)) o.sent.push(ref); return 0; }
  const id=send(S,host,msg); if(id){ o.sent.push(ref); if(o.sent.length>100) o.sent.shift(); } return id; }
const welcomeOnce=(S,host)=>sendOnce(S,host,WELCOME);

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,TYPES,ensure,send,sendOnce,welcomeOnce,receive,inbox,read,claim,claimAll,remove,unread,bonus};
root.Sys=root.Sys||{}; root.Sys.mail=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
