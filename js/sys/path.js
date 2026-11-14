/* Eonbound — Sys.path: CAMINHO DE LUTA do Nv 30 (docs/LOM_VS_EONBOUND.md item 7; protótipo aprovado pelo dono: docs/proto/v2/Caminhos.html).
   Três caminhos: Lâmina, Disparo, Arcano. NÃO muda corpo nem skin: só golpes especiais (somados no Sys.strikes.profile) e atributos (stat, %).
   Regras: libera no Nv 30 (Sys.level / host.level); choose() é a primeira escolha e vale até uma troca; change() = UMA TROCA GRÁTIS POR SEMANA
   (semana na segunda-feira pelo Sys.clock.weekKey, fuso único do jogo = Brasília com servidor). Nada é pago: não existe troca por gemas nem por ouro.
   Os números de DATA.paths são a PROPOSTA (vieram do Sys.pathTry, que agora lê daqui). DESLIGADO (DATA.on=false): current/profile/styleOf = null,
   choose/change recusam e o save não muda. Estado: S.sys.path {v, id, at, wk, changes} (id é o mesmo campo que o Sys.affinity e o Sys.pathTry já liam).
   Sem DOM: roda no servidor. */
(function(root){
'use strict';

const DATA={
  on:false,
  unlockLevel:30,
  changesPerWeek:1,        // 1 troca grátis por semana (dono aprovou). Sem troca paga.
  // PROPOSTA (o QA calibra). strikes = pontos % somados no Sys.strikes (respeita os tetos de lá); stat = pontos % nos atributos (Sys.stats: aspd, critDmg)
  // style = estilo de luta para o Sys.affinity (blade, shot, arcane)
  paths:[
    {id:'blade',  name:'Lâmina',  style:'blade',  desc:'Contra-ataque e roubo de vida: quanto mais apanha, mais devolve', strikes:{counter:8, lifesteal:5}, stat:{}},
    {id:'shot',   name:'Disparo', style:'shot',   desc:'Combo e velocidade de ataque: muitos golpes rápidos',           strikes:{combo:8},                stat:{aspd:10}},
    {id:'arcane', name:'Arcano',  style:'arcane', desc:'Atordoar e dano crítico: golpes que acertam forte',     strikes:{stun:3},                 stat:{critDmg:20}},
  ],
};
const DAY=86400000;

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clone=o=>JSON.parse(JSON.stringify(o));
const on=()=>DATA.on===true;
const pathOf=id=>DATA.paths.find(p=>p&&p.id===id)||null;
const nowOf=host=>{ try{ return num(host&&host.now&&host.now(),Date.now()); }catch(e){ return Date.now(); } };
const levelOf=(S,host)=>{ const L=root.Sys&&root.Sys.level; try{ if(L&&typeof L.level==='function') return int0(L.level(S)); }catch(e){}
  try{ return host&&typeof host.level==='function'?int0(host.level()):0; }catch(e){ return 0; } };
const C=()=>root.Sys&&root.Sys.clock;
function dayKey(ms){ const c=C(); if(c&&typeof c.dayKey==='function') return c.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function weekStart(ms){ const c=C(); if(c&&typeof c.weekStart==='function') return c.weekStart(ms); const d=new Date(ms); d.setHours(0,0,0,0); d.setDate(d.getDate()-(d.getDay()+6)%7); return d.getTime(); }
function weekKey(ms){ const c=C(); if(c&&typeof c.weekKey==='function') return c.weekKey(ms); return dayKey(weekStart(ms)+3600000); }
/* início da próxima semana (ms). +8 dias e volta para a segunda: seguro na troca de horário de verão */
const nextWeek=ms=>weekStart(weekStart(ms)+8*DAY);

/* ---------------- save ---------------- */
function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.path.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.path; if(!o||typeof o!=='object') o=S.sys.path={};
  o.v=1; o.id=pathOf(o.id)?o.id:null; o.at=num(o.at,0); o.wk=typeof o.wk==='string'?o.wk:''; o.changes=int0(o.changes);
  return o;
}
/* caminho gravado no save (sem olhar a chave; leitura crua para quem já lia S.sys.path.id). Não cria nada no save. */
function chosen(S){ const o=S&&S.sys&&S.sys.path; return o&&typeof o==='object'&&pathOf(o.id)?o.id:null; }
/* caminho que VALE no jogo: null desligado */
function current(S){ return on()?chosen(S):null; }

/* ---------------- regras ---------------- */
/* trocas grátis que sobram nesta semana */
function freeLeft(S,host){ const o=S&&S.sys&&S.sys.path; const used=o&&o.wk===weekKey(nowOf(host))?1:0; return Math.max(0,DATA.changesPerWeek-used); }
/* próxima troca grátis: 0 = já pode; senão o instante (ms) da virada da semana */
function nextFreeChange(S,host){ return freeLeft(S,host)>0?0:nextWeek(nowOf(host)); }
/* {ok, reason:'off'|'id'|'level'|'chosen', need} */
function canChoose(S,host,id){
  if(!on()) return {ok:false,reason:'off'};
  if(!pathOf(id)) return {ok:false,reason:'id'};
  if(levelOf(S,host)<DATA.unlockLevel) return {ok:false,reason:'level',need:DATA.unlockLevel};
  if(chosen(S)) return {ok:false,reason:'chosen'};
  return {ok:true,reason:''};
}
/* primeira escolha (definitiva até uma troca; não gasta a troca da semana). → {ok, reason, id} */
function choose(S,host,id){ const c=canChoose(S,host,id); if(!c.ok) return c;
  const o=ensure(S); o.id=id; o.at=nowOf(host); return {ok:true,reason:'',id}; }
/* {ok, reason:'off'|'id'|'level'|'none'|'same'|'week', next} */
function canChange(S,host,id){
  if(!on()) return {ok:false,reason:'off'};
  if(!pathOf(id)) return {ok:false,reason:'id'};
  if(levelOf(S,host)<DATA.unlockLevel) return {ok:false,reason:'level',need:DATA.unlockLevel};
  const cur=chosen(S); if(!cur) return {ok:false,reason:'none'};
  if(cur===id) return {ok:false,reason:'same'};
  if(freeLeft(S,host)<=0) return {ok:false,reason:'week',next:nextFreeChange(S,host)};
  return {ok:true,reason:''};
}
/* troca grátis da semana. Sem custo nenhum. → {ok, reason, id, from, next} */
function change(S,host,id){ const c=canChange(S,host,id); if(!c.ok) return c;
  const o=ensure(S), from=o.id, t=nowOf(host); o.id=id; o.at=t; o.wk=weekKey(t); o.changes++;
  return {ok:true,reason:'',id,from,next:nextFreeChange(S,host)}; }

/* ---------------- bônus ---------------- */
/* perfil para o Sys.strikes (soma em raw, antes dos tetos): {id, name, strikes, stat} ou null (desligado / sem caminho) */
function profile(S){ const id=current(S); if(!id) return null; const p=pathOf(id);
  return {id, name:p.name, strikes:clone(p.strikes||{}), stat:clone(p.stat||{})}; }
/* atributos em pontos % (aspd, critDmg) para o Sys.stats/batalha somarem: {} desligado */
function statOf(S){ const p=profile(S); return p?p.stat:{}; }
/* estilo de luta para o Sys.affinity: 'blade'|'shot'|'arcane' ou null desligado */
function styleOf(S){ const id=current(S); const p=id&&pathOf(id); return p?(p.style||p.id):null; }
/* o Sys.fc soma bonus() como %: o caminho não tem % de ATQ/Vida (a FC entra pelo Sys.strikes.totals) */
function bonus(){ return {atkPct:0,hpPct:0,critPct:0,defPct:0,goldPct:0,fc:0}; }

/* ---------------- tela ---------------- */
/* {on, unlocked, needLevel, level, chosen, chosenName, freeLeft, nextFreeChange (ms, 0 = já), paid:false,
    paths:[{id,name,desc,strikes,stat,chosen,canChoose,canChange}], text} */
function view(S,host){ const lv=levelOf(S,host), ch=on()?chosen(S):null, nf=nextFreeChange(S,host), left=freeLeft(S,host);
  const text=!on()?'':lv<DATA.unlockLevel?`Escolha o seu caminho de luta no Nv ${DATA.unlockLevel}.`:!ch?'Escolha um caminho. A aparência do herói não muda, só o jeito de lutar.'
    :left>0?(left>1?`Você tem ${left} trocas grátis nesta semana.`:'Você tem 1 troca grátis nesta semana.'):'Troca grátis usada nesta semana. A próxima vem na segunda-feira.';
  return {on:on(), unlocked:lv>=DATA.unlockLevel, needLevel:DATA.unlockLevel, level:lv, chosen:ch, chosenName:ch?pathOf(ch).name:null,
    freeLeft:left, nextFreeChange:nf, paid:false, text,
    paths:DATA.paths.map(p=>({id:p.id,name:p.name,desc:p.desc,style:p.style||p.id,strikes:clone(p.strikes||{}),stat:clone(p.stat||{}),chosen:ch===p.id,
      canChoose:canChoose(S,host,p.id),canChange:canChange(S,host,p.id)}))}; }

function setOn(v){ DATA.on=!!v; return DATA.on; }
const API={DATA,on,setOn,ensure,chosen,current,freeLeft,nextFreeChange,canChoose,choose,canChange,change,profile,statOf,styleOf,bonus,view,weekKey};
root.Sys=root.Sys||{}; root.Sys.path=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
