/* Eonbound — Sys.schedule: EVENTOS COM HORA (ordem do dono: "tal hora libera tal evento", pulsando, mostrando que está liberado e qual é).
   Agenda diária/semanal no HORÁRIO DE BRASÍLIA (UTC−3, sem horário de verão desde 2019) com janelas {dias, hora, minuto, duração}.
   API para a tela/HUD (o pulsar é do engenheiro/QA): active(S,host) → eventos abertos AGORA (com quanto falta para fechar); next(S,host) → o próximo e a
   contagem; notices(S,host) → os que abrem nos próximos DATA.noticeMin minutos (aviso antes); canEnter/enter (nível, janela aberta, entradas por janela);
   perks(S,host) → multiplicadores ativos (ouro, drop, ração, forja, pontos de arena) para os módulos donos lerem, como o VIP.
   RELÓGIO: local = relógio do aparelho com TRAVA (nunca volta: se o relógio andar para trás, vale o maior já visto; adiantar abre o evento, mas a
   entrada fica registrada pela janela e não repete). Com servidor: setServerTime(msDoServidor, host) e a hora passa a ser a do servidor.
   Prêmios SEM diamante. Agenda APROVADA pelo dono (12/11). Chave DATA.on (ligada). Estado: S.sys.schedule. Sem DOM. */
(function(root){
'use strict';
const ALL=[0,1,2,3,4,5,6];   // getDay(): 0 = domingo
const DATA={
  on:true, tzOffsetMin:-180, noticeMin:10, backTolerMin:2,   // LIGADO: o dono aprovou a agenda de 6 eventos como proposta (12/11)
  events:[
    {id:'world_boss', name:'Chefe Mundial', icon:'boss', level:24, days:ALL, at:[[12,0],[20,0]], durMin:30, entries:2,
     what:'Um chefe gigante para todos atacarem juntos (online); por enquanto, cada um contra o seu. 2 ataques por janela.',
     prize:'Pedras de forja, Essência e ouro por faixa de dano; fragmentos de montaria para quem passar de 5% da vida'},
    {id:'golden_hour', name:'Hora de Ouro', icon:'gold', level:10, days:ALL, at:[[19,0]], durMin:60, entries:0, perks:{goldPct:30},   // era +100% (×2); +30% (dono aprovou 14/11; docs/ECONOMIA_OURO.md §6: X = 5 min de abate = 120 × goldUnit por resgate)
     what:'Ouro +30% em todos os abates por 1 hora.', prize:'Ouro +30% (abates, chefes e baús)'},
    {id:'era_invasion', name:'Invasão da Era', icon:'invasion', level:18, days:ALL, at:[[21,0]], durMin:20, entries:1, perks:{dropPct:50},
     what:'Ondas da sua era invadem: 20 minutos de drop de item +50% (sem passar da raridade-teto).', prize:'Drop de item +50% · baú da invasão ao fim'},
    {id:'weekend_tourney', name:'Torneio de Fim de Semana', icon:'tourney', level:28, days:[6], at:[[10,0]], durMin:36*60, entries:0, perks:{arenaPct:50},
     what:'Sábado 10h a domingo 22h: pontos de arena +50% e ranking próprio do fim de semana.', prize:'Pedras de treino, forja e fragmentos do Prismático por posição (com o online)'},
    {id:'pet_hunt', name:'Caça aos Pets', icon:'pets', level:20, days:[3,0], at:[[18,0]], durMin:60, entries:0, perks:{foodPct:100,petFragPct:50},
     what:'Quarta e domingo, 18h: ração dobrada e +50% de fragmentos de pet nos drops.', prize:'Ração ×2 · fragmentos de pet +50%'},
    {id:'forge_blessing', name:'Bênção da Forja', icon:'forge', level:12, days:[2,4], at:[[13,0]], durMin:60, entries:0, perks:{forgePct:100},
     what:'Terça e quinta, 13h: pedras de forja dobradas em todos os drops.', prize:'Pedras de forja ×2'},
  ],
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const MIN=60000, DAY=1440*MIN;
const BY={}; for(const e of DATA.events) BY[e.id]=e;
let srvOff=null;   // ms a somar ao relógio do aparelho para dar a hora do servidor
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.schedule.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.schedule; if(!o||typeof o!=='object') o=S.sys.schedule={}; o.v=1; o.seen=int0(o.seen);
  const en=(o.entered&&typeof o.entered==='object')?o.entered:{}; o.entered={}; for(const k in en) if(/^[a-z_]+@\d+$/.test(k)) o.entered[k]=int0(en[k]);
  return o; }
/* hora oficial: servidor se houver; senão o aparelho com trava (nunca volta além da tolerância) */
function now(S,host){ const dev=num(host&&host.now&&host.now(),Date.now()); if(srvOff!=null) return dev+srvOff;
  if(!S) return dev; const o=ensure(S), back=DATA.backTolerMin*MIN; let t=dev; if(o.seen&&dev<o.seen-back) t=o.seen; if(t>o.seen) o.seen=t; return t; }
const setServerTime=(ms,host)=>{ const dev=num(host&&host.now&&host.now(),Date.now()); srvOff=num(ms,NaN)>0?ms-dev:null; return srvOff!=null; };
/* instante em Brasília → {day (0-6), min (minuto do dia), dayStart (ms UTC da meia-noite de Brasília)} */
function br(t){ const z=t+DATA.tzOffsetMin*MIN, d=new Date(z); const dayStart=z-(d.getUTCHours()*60+d.getUTCMinutes())*MIN-d.getUTCSeconds()*1000-d.getUTCMilliseconds()-DATA.tzOffsetMin*MIN;
  return {day:d.getUTCDay(),min:d.getUTCHours()*60+d.getUTCMinutes(),dayStart}; }
/* janelas de um evento que tocam o intervalo [t-dur, t+7 dias]: [{start, end}] em ms UTC */
function windows(ev,t){ const out=[], b=br(t); for(let k=-2;k<=8;k++){ const ds=b.dayStart+k*DAY, wd=((b.day+k)%7+7)%7; if(!ev.days.includes(wd)) continue;
    for(const [h,m] of ev.at){ const st=ds+(h*60+m)*MIN; out.push({start:st,end:st+ev.durMin*MIN}); } } return out.sort((a,b)=>a.start-b.start); }
const view=(ev,w,t)=>({id:ev.id,name:ev.name,icon:ev.icon,level:ev.level,what:ev.what,prize:ev.prize,perks:Object.assign({},ev.perks||{}),start:w.start,end:w.end,
  open:t>=w.start&&t<w.end,msLeft:Math.max(0,w.end-t),msToStart:Math.max(0,w.start-t),key:ev.id+'@'+w.start});
/* abertos agora (pulsar: "evento liberado"), mais novo primeiro */
function active(S,host){ if(!ON()) return []; const t=now(S,host), out=[]; for(const ev of DATA.events) for(const w of windows(ev,t)) if(t>=w.start&&t<w.end) out.push(view(ev,w,t)); return out.sort((a,b)=>a.end-b.end); }
/* próximo a abrir (contagem regressiva) e a lista dos próximos n */
function upcoming(S,host,n){ if(!ON()) return []; const t=now(S,host), out=[]; for(const ev of DATA.events) for(const w of windows(ev,t)) if(w.start>t) out.push(view(ev,w,t)); return out.sort((a,b)=>a.start-b.start).slice(0,n||6); }
const next=(S,host)=>upcoming(S,host,1)[0]||null;
/* aviso X min antes: os que abrem dentro de DATA.noticeMin */
const notices=(S,host)=>upcoming(S,host,20).filter(e=>e.msToStart<=DATA.noticeMin*MIN);
const lvl=(S,host)=>{ const L=root.Sys&&root.Sys.level; return L&&L.level?L.level(S):int0(host&&host.level&&host.level())||1; };
/* pode entrar? {ok, reason: off|id|level|closed|entries, left} — eventos sem entrada (bônus) só precisam do nível e da janela aberta */
function canEnter(S,host,id){ if(!ON()) return {ok:false,reason:'off'}; const ev=BY[id]; if(!ev) return {ok:false,reason:'id'};
  if(lvl(S,host)<ev.level) return {ok:false,reason:'level',needLevel:ev.level}; const a=active(S,host).find(x=>x.id===id); if(!a) return {ok:false,reason:'closed',next:upcoming(S,host,20).find(x=>x.id===id)||null};
  if(!ev.entries) return {ok:true,left:Infinity,key:a.key}; const cap=entriesOf(S,ev), used=int0(ensure(S).entered[a.key]); return used>=cap?{ok:false,reason:'entries',left:0}:{ok:true,left:cap-used,key:a.key}; }
/* entradas por janela + VIP de conveniência (Sys.vip.conv: bossAdd no Chefe Mundial, eventTries nos outros com entrada) */
function entriesOf(S,ev){ const V=root.Sys&&root.Sys.vip; let add=0; try{ const c=V&&V.conv?V.conv(S):null; if(c) add=int0(ev.id==='world_boss'?c.bossAdd:0)+int0(c.eventTries); }catch(e){} return ev.entries+add; }
function enter(S,host,id){ const c=canEnter(S,host,id); if(!c.ok) return c; const o=ensure(S); if(BY[id].entries){ o.entered[c.key]=int0(o.entered[c.key])+1;
    const keep=Object.keys(o.entered).sort((a,b)=>+b.split('@')[1]-+a.split('@')[1]).slice(0,40); const n={}; for(const k of keep) n[k]=o.entered[k]; o.entered=n; }
  return {ok:true,id,left:BY[id].entries?c.left-1:Infinity}; }
/* bônus ativos para os módulos donos (ouro no Sys.loot, ração no Sys.pet, pontos na arena...): soma dos eventos abertos que o nível permite */
function perks(S,host){ const z={goldPct:0,dropPct:0,foodPct:0,forgePct:0,arenaPct:0,petFragPct:0}; if(!ON()) return z; const L=lvl(S,host);
  for(const a of active(S,host)) if(L>=a.level) for(const k in a.perks) z[k]=(z[k]||0)+num(a.perks[k],0); return z; }
/* tabela legível da semana (para o dono aprovar) */
function agendaText(){ const D=['dom','seg','ter','qua','qui','sex','sáb'], hm=([h,m])=>String(h).padStart(2,'0')+':'+String(m).padStart(2,'0');
  return DATA.events.map(e=>({id:e.id,name:e.name,days:e.days.length===7?'todo dia':e.days.map(d=>D[d]).join(', '),at:e.at.map(hm).join(' e '),dur:e.durMin>=120?Math.round(e.durMin/60)+' h':e.durMin+' min',level:e.level,entries:e.entries||'livre',what:e.what,prize:e.prize})); }

const API={DATA,entriesOf,ensure,now,setServerTime,active,upcoming,next,notices,canEnter,enter,perks,agendaText,_br:br};
root.Sys=root.Sys||{}; root.Sys.schedule=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
