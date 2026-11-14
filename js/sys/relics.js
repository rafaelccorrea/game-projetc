/* Eonbound — Sys.relics: RELÍQUIAS DAS ERAS (docs/LOM_VS_EONBOUND.md §3 "Relíquias", §5 item 8, §7 item 8). CHAVE DESLIGADA (DATA.on=false).
   9 espaços, UM artefato histórico por era. Cada relíquia dá um bônus PASSIVO pequeno (convenção do Sys.fc: pontos %) e sobe de nível com
   FRAGMENTOS DA PRÓPRIA ERA. Uma camada só (nada de almas, runas ou estátua).
   Como se ganha (tudo FIXO e só jogando; nenhuma fonte é sorteio, nada se compra com dinheiro ou diamante, nada de loja):
   - 1ª vitória sobre o Senhor da Era → a relíquia daquela era nasce no Nv 1;
   - Senhor da Era de novo → 2 fragmentos da era (1 vez por era por dia);
   - Escavação (Sys.dig) → fragmentos nas células da camada (quantidade e era fixas pela semente da camada);
   - Torre a cada 10 andares, Chefe Mundial, Arena (semanal) e prêmio fixo de evento → fragmentos em quantidade fixa (tabela grants).
   Fragmentos de uma relíquia que ainda não nasceu ficam guardados; com unlock (20) ela nasce sem precisar do Senhor da Era.
   addFragments/grant RECUSAM fonte de loja (DATA.forbidden). Sem ouro: a relíquia não custa nem dá ouro (ouro escasso, docs/ECONOMIA_OURO.md).
   Estado: S.sys.relics {v, own:{id:{lv}}, frags:[9], first:{era:1}, day:{k, lord:{era:n}}}. bonus(S) entra sozinho na FC (o Sys.fc soma todo
   módulo com bonus). Sem DOM. Teste: test/sys/relics.test.js */
(function(root){
'use strict';

/* ---------------- dados (PROPOSTA; a Sistemas calibra com o QA) ---------------- */
const R_=(id,era,name,stat,desc)=>({id,era,name,stat,desc});
const DATA={
  on:false,
  label:'Relíquias', icon:'',
  eraName:['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'],
  relics:[
    R_('flintAxe',   0,'Machado de Sílex',        'atkPct', 'A primeira ferramenta: lascada à mão, ainda corta.'),
    R_('scarab',     1,'Escaravelho Sagrado',      'hpPct',  'Amuleto de pedra azul que protegia os viajantes do deserto.'),
    R_('knightHelm', 2,'Elmo do Cavaleiro',        'defPct', 'Aço amassado de cem torneios.'),
    R_('compass',    3,'Bússola do Capitão',       'critPct','Sempre aponta para o ponto fraco do inimigo.'),
    R_('brassGear',  4,'Engrenagem de Latão',      'atkPct', 'A peça que fazia girar a primeira fábrica.'),
    R_('fieldRadio', 5,'Rádio de Campanha',        'hpPct',  'Chamava ajuda quando tudo parecia perdido.'),
    R_('plasmaCore', 6,'Núcleo de Plasma',         'critPct','Energia pura presa num cristal.'),
    R_('ferryLantern',7,'Lanterna do Barqueiro',   'defPct', 'A luz que guia pelas margens do Submundo.'),
    R_('judgeFeather',8,'Pena da Balança',         'both',   'Pesa o coração de quem luta: força e vida juntas.'),
  ],
  maxLv:10,
  unlockFrags:20,                       // fragmentos para a relíquia nascer sem o Senhor da Era
  cost:[5,8,12,16,20,25,30,40,50],      // fragmentos da era para ir do Nv n ao n+1 (índice n−1). Total 1→10 = 206
  // bônus por nível: base + step·(nv−1) (Nv 10 = base + 9·step). 'both' = atkPct e hpPct juntos.
  passive:{atkPct:[0.6,0.15], hpPct:[0.6,0.15], defPct:[0.4,0.1], critPct:[0.2,0.05], both:[0.4,0.1]},
  // fontes FIXAS aceitas em grant(S, host, src, {era})
  grants:{
    eraLord:      {unlock:true},               // 1ª vitória sobre o Senhor da Era: a relíquia nasce (Nv 1)
    eraLordRepeat:{frags:2, daily:1},           // Senhor da Era de novo: 2 fragmentos, 1 vez por era por dia
    tower:        {frags:2},                    // a cada 10 andares da Torre (o jogo chama no marco)
    worldBoss:    {frags:3},                    // Chefe Mundial: participação (1 vez por luta do chefe)
    arenaWeek:    {frags:5},                    // fim da semana da Arena (qualquer liga)
    event:        {frags:10},                   // prêmio fixo de evento (a era vem do evento)
  },
  forbidden:['shop','gems','offer','pack','pay','gacha','ad','ads'],   // fontes RECUSADAS: nada à venda dá poder; menores jogam
  maxFrags:1e6,
};
const BY={}, ERA={}; DATA.relics.forEach(r=>{ BY[r.id]=r; ERA[r.era]=r; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,8);
const okEra=e=>typeof e==='number'&&isFinite(e)&&e>=0&&e<=8&&Math.floor(e)===e;
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const fmt1=v=>(Math.round(num(v,0)*100)/100).toString().replace('.',',');
const zeroB=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const badSrc=src=>DATA.forbidden.includes(String(src||'').toLowerCase());
const relic=id=>BY[id]||null;
const byEra=e=>ERA[clamp(int0(e),0,8)]||null;

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.relics.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.relics; if(!o||typeof o!=='object') o=S.sys.relics={};
  o.v=1;
  const own=(o.own&&typeof o.own==='object')?o.own:{}; o.own={};
  for(const r of DATA.relics){ const x=own[r.id]; if(x&&typeof x==='object') o.own[r.id]={lv:clamp(int0(x.lv)||1,1,DATA.maxLv)}; }
  const f=Array.isArray(o.frags)?o.frags:[]; o.frags=[]; for(let e=0;e<9;e++) o.frags.push(Math.min(DATA.maxFrags,int0(f[e])));
  o.first=(o.first&&typeof o.first==='object'&&!Array.isArray(o.first))?o.first:{};
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={k:typeof d.k==='string'?d.k:'',lord:(d.lord&&typeof d.lord==='object')?d.lord:{}};
  o.loose=Math.min(DATA.maxFrags,int0(o.loose));
  if(on()){ releaseHeld(S,o); spendLoose(o); }
  return o;
}
const levelOf=(S,id)=>{ const x=ensure(S).own[id]; return x?x.lv:0; };
function passiveOf(r,lv){ const P=DATA.passive[r.stat]; if(!P||!lv) return 0; return Math.round((P[0]+P[1]*(clamp(lv,1,DATA.maxLv)-1))*1e4)/1e4; }

/* ---------------- fragmentos e fontes (só jogando) ---------------- */
/* fragmentos da era. Desligado: recusa (nada gravado). {ok, era, frags} */
function addFragments(S,era,n,src){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'};
  if(!okEra(era)) return {ok:false,reason:'era'}; const k=int0(n); if(!k) return {ok:false,reason:'n'};
  const o=ensure(S); o.frags[era]=Math.min(DATA.maxFrags,o.frags[era]+k); return {ok:true,era,n:k,frags:o.frags[era]}; }
/* FRAGMENTOS GENÉRICOS (sem era: prêmio da masmorra cooperativa pelo correio, att.relicFrags; docs/SERVIDOR_LOM.md). Regra FIXA, sem sorteio:
   vão para a relíquia que o jogador JÁ TEM com o MENOR nível (empate: a era mais antiga); relíquia no Nv máximo não recebe.
   Sem nenhuma relíquia (ou todas no máximo), ficam soltos em o.loose e entram na 1ª que nascer / na próxima chamada.
   Desligado: recusa (quem chama guarda: o Sys.loot guarda em S.sys.loot.relicFrags e releaseHeld traz quando ligar). {ok, era, n, loose} */
function targetEra(o){ let best=null; for(const r of DATA.relics){ const x=o.own[r.id]; if(!x||x.lv>=DATA.maxLv) continue; if(!best||x.lv<best.lv) best={era:r.era,lv:x.lv}; } return best?best.era:null; }
function addRelicFrags(S,n,src){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'}; const k=int0(n); if(!k) return {ok:false,reason:'n'};
  const o=ensure(S); o.loose+=k; return Object.assign({ok:true,n:k},spendLoose(o)); }
function spendLoose(o){ if(!o.loose) return {era:null,loose:0}; const e=targetEra(o); if(e==null) return {era:null,loose:o.loose};
  o.frags[e]=Math.min(DATA.maxFrags,o.frags[e]+o.loose); o.loose=0; return {era:e,loose:0}; }
/* traz o que o Sys.loot guardou enquanto a chave estava desligada (S.sys.loot.relicFrags). Chamado no ensure com a chave ligada. */
function releaseHeld(S,o){ const L=S&&S.sys&&S.sys.loot; if(!on()||!L||!(int0(L.relicFrags)>0)) return 0; const k=int0(L.relicFrags); L.relicFrags=0; o.loose+=k; spendLoose(o); return k; }
/* nasce a relíquia da era (Nv 1). Interno: quem chama já conferiu a regra. Fragmentos soltos entram nela. */
function birth(o,era){ const r=ERA[era]; if(!r||o.own[r.id]) return false; o.own[r.id]={lv:1}; spendLoose(o); return true; }
/* fontes fixas do jogo. grant(S, host, src, {era}) → {ok, src, era, unlocked (id|null), frags}. O MÓDULO decide se é a 1ª vitória:
   eraLord repetido vira eraLordRepeat (1 por era por dia). era padrão = maior era liberada do herói. */
function grant(S,host,src,opt){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'};
  if(!DATA.grants[src]) return {ok:false,reason:'src'}; opt=opt||{}; const o=ensure(S);
  const era=opt.era!=null?clamp(int0(opt.era),0,8):eraMaxOf(host);
  if(src==='eraLord'&&o.first[era]) src='eraLordRepeat';
  const G=DATA.grants[src], out={ok:true,src,era,unlocked:null,frags:0};
  if(G.daily){ const k=dayKey(nowOf(host)); if(o.day.k!==k){ o.day.k=k; o.day.lord={}; } if(int0(o.day.lord[era])>=G.daily) return {ok:false,reason:'daily',era}; o.day.lord[era]=int0(o.day.lord[era])+1; }
  if(G.unlock){ o.first[era]=1; if(birth(o,era)) out.unlocked=ERA[era].id; }
  if(G.frags){ o.frags[era]=Math.min(DATA.maxFrags,o.frags[era]+G.frags); out.frags=G.frags; }
  changed(host); return out; }

/* ---------------- nascer por fragmentos e subir de nível ---------------- */
function canUnlock(S,id){ if(!on()) return {ok:false,reason:'off'}; const r=relic(id); if(!r) return {ok:false,reason:'id'}; const o=ensure(S);
  if(o.own[id]) return {ok:false,reason:'owned'}; if(o.frags[r.era]<DATA.unlockFrags) return {ok:false,reason:'frags',need:DATA.unlockFrags,have:o.frags[r.era]};
  return {ok:true,cost:DATA.unlockFrags}; }
function unlock(S,id,host){ const c=canUnlock(S,id); if(!c.ok) return c; const o=ensure(S), r=relic(id); o.frags[r.era]-=c.cost; birth(o,r.era); changed(host); return {ok:true,id,lv:1,cost:c.cost}; }
function levelCost(S,id){ const x=ensure(S).own[id]; if(!x||x.lv>=DATA.maxLv) return null; return DATA.cost[x.lv-1]; }
function canLevel(S,id){ if(!on()) return {ok:false,reason:'off'}; const r=relic(id); if(!r) return {ok:false,reason:'id'}; const o=ensure(S), x=o.own[id];
  if(!x) return {ok:false,reason:'locked'}; if(x.lv>=DATA.maxLv) return {ok:false,reason:'max'}; const c=levelCost(S,id);
  if(o.frags[r.era]<c) return {ok:false,reason:'frags',cost:c,have:o.frags[r.era]}; return {ok:true,cost:c}; }
function levelUp(S,id,host){ const c=canLevel(S,id); if(!c.ok) return c; const o=ensure(S), r=relic(id), x=o.own[id]; o.frags[r.era]-=c.cost; x.lv++; changed(host);
  return {ok:true,id,lv:x.lv,cost:c.cost}; }

/* ---------------- bônus (entra na FC pelo Sys.fc) ---------------- */
function bonus(S){ const b=zeroB(); if(!on()||!S||typeof S!=='object') return b; const o=ensure(S);
  for(const id in o.own){ const r=relic(id); if(!r) continue; const v=passiveOf(r,o.own[id].lv); if(r.stat==='both'){ b.atkPct+=v; b.hpPct+=v; } else b[r.stat]+=v; }
  for(const k in b) b[k]=Math.round(b[k]*1e4)/1e4; return b; }
/* "Como ficar mais forte" (Sys.fc.advice): relíquia que dá para subir ou nascer agora */
function advice(S){ if(!on()) return []; const o=ensure(S), out=[];
  for(const r of DATA.relics){ const x=o.own[r.id];
    if(!x){ const c=canUnlock(S,r.id); if(c.ok) out.push({id:'relic.unlock.'+r.id,icon:'relic',label:`Despertar ${r.name}`,delta:deltaOf(r,0,1),cost:`${c.cost} fragmentos`,ready:true,tab:'relics'}); continue; }
    if(x.lv>=DATA.maxLv) continue; const c=canLevel(S,r.id);
    out.push({id:'relic.lv.'+r.id,icon:'relic',label:`${r.name} Nv ${x.lv+1}`,delta:deltaOf(r,x.lv,x.lv+1),cost:`${levelCost(S,r.id)} fragmentos`,ready:!!c.ok,tab:'relics'}); }
  return out; }
function deltaOf(r,a,b){ const v=Math.round((passiveOf(r,b)-passiveOf(r,a))*1e4)/1e4; return r.stat==='both'?{atkPct:v,hpPct:v}:{[r.stat]:v}; }

/* ---------------- tela ---------------- */
const PNAME={atkPct:'ATQ',hpPct:'Vida',defPct:'DEF',critPct:'Crítico',both:'ATQ e Vida'};
const ptxt=(r,lv)=>`${PNAME[r.stat]} +${fmt1(passiveOf(r,lv||1))}${r.stat==='critPct'?' pts':'%'}`;
/* {on, owned, total, maxLv, bonus, bonusText, slots:[{era, eraName, id, name, desc, owned, lv, max, frags, cost, canLevel, canUnlock,
   unlockFrags, passiveText, nextText, locked (era ainda não liberada)}], sources:[texto], paid:false} */
function view(S,host){ const o=ensure(S), b=bonus(S), em=eraMaxOf(host);
  return {on:on(),owned:Object.keys(o.own).length,total:DATA.relics.length,maxLv:DATA.maxLv,bonus:b,paid:false,loose:o.loose,
    bonusText:['atkPct','hpPct','defPct','critPct'].filter(k=>b[k]>0).map(k=>`${PNAME[k]} +${fmt1(b[k])}${k==='critPct'?' pts':'%'}`).join(' · '),
    sources:['1ª vitória sobre o Senhor da Era: a relíquia nasce','Senhor da Era de novo: 2 fragmentos por dia','Escavação','Torre (a cada 10 andares)','Chefe Mundial','Arena (semana)','Eventos'],
    slots:DATA.relics.map(r=>{ const x=o.own[r.id], lv=x?x.lv:0, max=lv>=DATA.maxLv, cl=x?canLevel(S,r.id):null, cu=x?null:canUnlock(S,r.id);
      return {era:r.era,eraName:DATA.eraName[r.era],id:r.id,name:r.name,desc:r.desc,owned:!!x,lv,max,frags:o.frags[r.era],
        cost:x?levelCost(S,r.id):DATA.unlockFrags,canLevel:!!(cl&&cl.ok),canUnlock:!!(cu&&cu.ok),unlockFrags:DATA.unlockFrags,
        passiveText:ptxt(r,lv||1),nextText:x&&!max?ptxt(r,lv+1):'',locked:r.era>em&&!x}; })}; }

const API={DATA,on,setOn,ensure,relic,byEra,levelOf,passiveOf,addFragments,addRelicFrags,grant,canUnlock,unlock,levelCost,canLevel,levelUp,bonus,advice,view,dayKey};
root.Sys=root.Sys||{}; root.Sys.relics=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
