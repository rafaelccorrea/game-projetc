/* Eonbound — Sys.eventRank: RANKING DE EVENTO com prêmio SÓ VISUAL por faixas (docs/LOM_VS_EONBOUND.md §5 item 17, P3; contrato docs/SERVIDOR_LOM.md §4).
   CHAVE DESLIGADA (DATA.on=false). Métrica = pontos GANHOS na trilha do evento (Sys.evtrail.earned: saldo + gasto na loja) dentro da janela do evento.
   Faixas pela posição final: top 1% / top 10% / top 50% / participação (≥ 1 ponto). Uma faixa só (a melhor). Prêmio = moldura, título e selo, NENHUM
   atributo, nenhum ouro (vantagem de poder que nunca fecha é o que o LoM faz e nós não). Quem mede é o SERVIDOR (GET /events/:id/rank) e quem entrega
   é o CORREIO (source 'eventrank', att.cosmetic); aqui: as regras puras (bandOf, prizeFor; o servidor carrega este arquivo), o espelho, e a gravação:
   - moldura → registrada no Sys.profile.DATA.frames (need:{grant:true}) e dada por Sys.profile.grant;
   - título  → Sys.titles.addTitle (sem bônus: bonus {} = 0 de poder) + Sys.titles.grant;
   - selo    → novo, guardado aqui (S.sys.eventrank.owned.badges); a tela do perfil mostra a fileira de selos (badges(S)).
   Tudo o que foi ganho fica em S.sys.eventrank.owned e é re-aplicado por sync(S) no boot (perfil/títulos desligados na hora não perdem o prêmio).
   Sem servidor: mostra só os pontos (sem posição e sem prêmio, como a arena contra bots). Sem DOM. Teste: test/sys/eventrank.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  bands:[{id:'top1',pct:1,name:'Top 1%'},{id:'top10',pct:10,name:'Top 10%'},{id:'top50',pct:50,name:'Top 50%'}],
  partName:'Participação',
  /* o que cada faixa grava (só visual). r = raridade da moldura no Sys.profile (0-5) */
  prize:{top1:{frame:true,title:true,badge:true,r:5}, top10:{frame:true,title:true,badge:true,r:4}, top50:{title:true,badge:true}, part:{badge:'evt_part'}},
  partBadge:{id:'evt_part',name:'Participou de um evento'},
  idRe:/^evt_[a-z0-9_]{1,40}_(top1|top10|top50)$/,
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const evId=v=>typeof v==='string'&&/^[a-z0-9_]{1,40}$/.test(v)?v:null;
const evName=id=>{ const E=SYS().events; try{ if(E&&typeof E.nameOf==='function'){ const n=E.nameOf(id); if(n) return n; } const ev=E&&E.DATA&&E.DATA.events.find(e=>e.id===id); if(ev) return ev.name; }catch(e){} return 'Evento'; };

/* ================= REGRAS PURAS (o servidor carrega este arquivo) ================= */
/* faixa pela posição final entre `total` jogadores com ≥ 1 ponto: top1 se rank ≤ max(1, ceil(1%·total)); top10 ≤ ceil(10%); top50 ≤ ceil(50%); senão part */
function bandOf(rank,total){ rank=int0(rank); total=int0(total); if(!rank||!total||rank>total) return null;
  for(const b of DATA.bands){ const cut=Math.max(1,Math.ceil(total*b.pct/100)); if(rank<=cut) return b.id; } return 'part'; }
const cuts=total=>{ const o={}; for(const b of DATA.bands) o[b.id]=Math.max(1,Math.ceil(int0(total)*b.pct/100)); return o; };
/* chaves visuais da faixa: {frame?, title?, badge} */
function prizeFor(ev,band){ const id=evId(ev), P=DATA.prize[band]; if(!id||!P) return null; const k='evt_'+id+'_'+band, out={};
  if(P.frame) out.frame=k; if(P.title) out.title=k; out.badge=P.badge===true?k:P.badge; return out; }

/* ================= ESTADO ================= */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.eventRank.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.eventrank; if(!o||typeof o!=='object') o=S.sys.eventrank={}; o.v=1;
  const w=(o.owned&&typeof o.owned==='object')?o.owned:{}, ok=x=>typeof x==='string'&&(DATA.idRe.test(x)||x===DATA.partBadge.id);
  o.owned={frames:(Array.isArray(w.frames)?w.frames:[]).filter(ok).slice(0,200),titles:(Array.isArray(w.titles)?w.titles:[]).filter(ok).slice(0,200),badges:(Array.isArray(w.badges)?w.badges:[]).filter(ok).slice(0,200)};
  o.ranks=(o.ranks&&typeof o.ranks==='object')?o.ranks:{}; for(const k in o.ranks) if(!evId(k)||!o.ranks[k]||typeof o.ranks[k]!=='object') delete o.ranks[k];
  return o; }

/* nome visível de uma chave ('evt_festival_eras_top1' → 'Festival das Eras · Top 1%') */
function nameOf(key){ if(key===DATA.partBadge.id) return DATA.partBadge.name; const m=DATA.idRe.exec(String(key||'')); if(!m) return '';
  const ev=key.slice(4,key.length-m[1].length-1), b=DATA.bands.find(x=>x.id===m[1]); return evName(ev)+' · '+(b?b.name:''); }
/* registra a moldura no Sys.profile e o título no Sys.titles (em tempo de execução, como o Sys.erasEnd faz) */
function register(key,kind){ const nm=nameOf(key); if(!nm) return false; const m=DATA.idRe.exec(key), band=m?m[1]:'part';
  if(kind==='frame'){ const P=SYS().profile; if(!P||!P.DATA||!Array.isArray(P.DATA.frames)) return false; if(!P.DATA.frames.some(f=>f.id===key))
      P.DATA.frames.push({id:key,name:nm,r:int0(DATA.prize[band]&&DATA.prize[band].r),how:'Ranking de evento: '+nm,need:{grant:true},go:'Eventos',event:true}); return true; }
  if(kind==='title'){ const T=SYS().titles; if(!T||typeof T.addTitle!=='function') return false; T.addTitle({id:key,name:nm,text:'Ranking de evento',bonus:{}}); return true; }
  return false; }
/* grava o prêmio visual (carta do correio att.cosmetic, ou o espelho final). Idempotente. {ok, frame, title, badge, fresh} */
function grantVisual(S,host,cos){ if(!on()) return {ok:false,reason:'off'}; if(!cos||typeof cos!=='object') return {ok:false,reason:'data'};
  const o=ensure(S), out={ok:true,fresh:[]}, valid=x=>typeof x==='string'&&(DATA.idRe.test(x)||x===DATA.partBadge.id);
  if(cos.frame!=null){ if(!DATA.idRe.test(cos.frame)) return {ok:false,reason:'id'}; } if(cos.title!=null&&!DATA.idRe.test(cos.title)) return {ok:false,reason:'id'};
  if(cos.badge!=null&&!valid(cos.badge)) return {ok:false,reason:'id'};
  if(cos.frame){ if(!o.owned.frames.includes(cos.frame)){ o.owned.frames.push(cos.frame); out.fresh.push(cos.frame); } out.frame=cos.frame; }
  if(cos.title){ if(!o.owned.titles.includes(cos.title)){ o.owned.titles.push(cos.title); out.fresh.push(cos.title); } out.title=cos.title; }
  if(cos.badge){ if(!o.owned.badges.includes(cos.badge)){ o.owned.badges.push(cos.badge); out.fresh.push(cos.badge); } out.badge=cos.badge; }
  sync(S,host); return out; }
/* re-aplica tudo o que foi ganho no perfil e nos títulos (boot, ou depois de ligar o perfil). Devolve quantos entraram agora. */
function sync(S,host){ if(!on()) return 0; const o=ensure(S), P=SYS().profile, T=SYS().titles; let n=0;
  for(const f of o.owned.frames){ register(f,'frame'); try{ if(P&&P.grant&&P.grant(S,f,host)) n++; }catch(e){} }
  for(const t of o.owned.titles){ register(t,'title'); try{ if(T&&T.grant&&T.grant(S,t,host)) n++; }catch(e){} }
  return n; }
const badges=S=>ensure(S).owned.badges.map(id=>({id,name:nameOf(id)}));

/* ================= ESPELHO DO SERVIDOR ================= */
/* GET /events/:id/rank → guarda e devolve a faixa (o prêmio NÃO entra aqui: vem pela carta do correio) */
function applyRank(S,host,data){ if(!on()) return {ok:false,reason:'off'}; const id=evId(data&&data.event); if(!id) return {ok:false,reason:'data'}; const o=ensure(S);
  const rank=int0(data.rank), total=int0(data.total), band=bandOf(rank,total);
  o.ranks[id]={points:int0(data.points),rank,total,band,cut:cuts(total),closesAt:int0(data.closesAt),final:data.final===true,at:nowOf(host),
    top:(Array.isArray(data.top)?data.top:[]).slice(0,20).map(x=>({rank:int0(x.rank),name:String(x.name||'').slice(0,24),points:int0(x.points),frame:typeof x.frame==='string'?x.frame:null}))};
  return {ok:true,band}; }
/* meus pontos agora (local, sem servidor) */
function myPoints(S,ev){ const E=SYS().evtrail; try{ return E&&E.earned?int0(E.earned(S,ev)):0; }catch(e){ return 0; } }
/* tela do ranking do evento: {on, event, name, points, rank, total, band, bandName, prize (o que a faixa atual daria), next (faixa acima e quantos
   pontos faltam, se o servidor mandou os cortes de pontos), bands (tabela de prêmios), top, online} */
function view(S,host,ev){ if(!on()) return {on:false}; const id=evId(ev); if(!id) return {on:true,ok:false,reason:'id'}; fromMail(S,host); const o=ensure(S), r=o.ranks[id]||null;
  const table=DATA.bands.map(b=>({id:b.id,name:b.name,prize:prizeFor(id,b.id)})).concat([{id:'part',name:DATA.partName,prize:prizeFor(id,'part')}]);
  const band=r?r.band:null, bn=band?(DATA.bands.find(b=>b.id===band)||{name:DATA.partName}).name:null;
  return {on:true,event:id,name:evName(id),points:r?r.points:myPoints(S,id),rank:r?r.rank:null,total:r?r.total:null,band,bandName:bn,prize:band?prizeFor(id,band):null,
    final:!!(r&&r.final),bands:table,top:r?r.top:[],online:!!r,powerFree:true}; }

/* GET /events/:id/rank pela camada online (Sys.net._call) e applyRank. Promise: {ok, band} ou {ok:false, reason ('off'|'id'|'net_off'|'not_found'|...)}.
   404 = EVENTRANK_ON desligado no servidor ou evento fora da janela: a tela fica no modo 'Seus pontos' (view().online=false). */
async function load(S,host,ev){ if(!on()) return {ok:false,reason:'off'}; const id=evId(ev); if(!id) return {ok:false,reason:'id'}; const N=SYS().net;
  if(!N||typeof N._call!=='function') return {ok:false,reason:'net_off'};
  let d; try{ d=await N._call('GET','/events/'+encodeURIComponent(id)+'/rank'); }catch(e){ return {ok:false,reason:(e&&(e.code||(e.status===404?'not_found':null)))||'error'}; }
  return applyRank(S,host,d); }
/* CORREIO SEM GANCHO: as cartas source 'eventrank' JÁ RESGATADAS (por qualquer caminho: tela do Correio, Resgatar tudo, Pegar tudo) gravam o prêmio
   visual aqui. Idempotente (grantVisual não repete). Chamar no boot e ao abrir a aba Ranking (o view chama sozinho). Devolve quantas cartas leu. */
function fromMail(S,host){ if(!on()) return 0; const M=SYS().mail; let L=[]; try{ L=M&&M.DATA&&M.DATA.enabled===true&&typeof M.inbox==='function'?M.inbox(S,host):[]; }catch(e){ L=[]; }
  let n=0; for(const m of L) if(m&&m.source==='eventrank'&&m.claimed&&m.att&&m.att.cosmetic&&typeof m.att.cosmetic==='object'){ const r=grantVisual(S,host,m.att.cosmetic); if(r&&r.ok&&r.fresh.length) n++; } return n; }
const API={DATA,on,setOn,bandOf,cuts,prizeFor,ensure,nameOf,register,grantVisual,sync,badges,applyRank,myPoints,view,load,fromMail};
root.Sys=root.Sys||{}; root.Sys.eventRank=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
