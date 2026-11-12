/* Eonbound — Sys.practice: pedras de prática e 5 trilhas permanentes (Força, Vitalidade, Crítico, Defesa, Coleta).
   Custo crescente por nível; teto de nível por era liberada. Lógica pura + render opcional.
   Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-practice.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  label:'Práticas', icon:'🪨',
  // stat = chave do bonus() (pontos percentuais, ver js/sys/fc.js); per = quanto cada nível soma (balance v5.1, aprovado pelo PO:
  // era 6 / Nv 70 = +35% ATK, +35% HP, +7 pts de crítico, +10,5% defesa, +35% ouro)
  tracks:[
    {id:'str',  name:'Força',      icon:'💪', stat:'atkPct',  per:0.5,  unit:'% ATK'},
    {id:'vit',  name:'Vitalidade', icon:'❤️', stat:'hpPct',   per:0.5,  unit:'% HP'},
    {id:'crit', name:'Crítico',    icon:'🎯', stat:'critPct', per:0.1,  unit:'% crítico'},
    {id:'def',  name:'Defesa',     icon:'🛡️', stat:'defPct',  per:0.15, unit:'% defesa'},
    {id:'gold', name:'Coleta',     icon:'🪙', stat:'goldPct', per:0.5,  unit:'% ouro'},
  ],
  cost:{base:4, growth:1.06},     // custo do nível n+1 = ceil(base * growth^n)  (Nv 70 ≈ 236 pedras)
  cap:{base:10, perEra:10},       // teto = base + perEra * eraMax  (era 0: 10 · era 6: 70)
  // ganho de pedras (onKill vale para TODO inimigo, chefe incluso)
  drop:{commonChance:0.08, common:1, boss:2, bossPerEra:1, eraBoss:5, eraBossPerEra:2},
  offline:{perHour:6, capHours:8},
  maxStones:1e9,
};
const TRACK={}; DATA.tracks.forEach(t=>{ TRACK[t.id]=t; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtN=n=>{ n=num(n,0); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.floor(n)); };
const fmtP=v=>(Math.round(v*100)/100).toString().replace('.',',');
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.practice.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.practice; if(!o||typeof o!=='object') o=S.sys.practice={};
  o.v=1; o.stones=Math.min(DATA.maxStones,int0(o.stones)); o.spent=int0(o.spent); o.earned=int0(o.earned);
  const lv=(o.lv&&typeof o.lv==='object')?o.lv:{}; o.lv={};
  for(const t of DATA.tracks) o.lv[t.id]=int0(lv[t.id]);   // trilha desconhecida some; valor inválido vira 0
  return o;
}

const cost=lv=>Math.ceil(DATA.cost.base*Math.pow(DATA.cost.growth,int0(lv)));
const capOf=host=>DATA.cap.base+DATA.cap.perEra*eraMaxOf(host);
const level=(S,id)=>TRACK[id]?ensure(S).lv[id]:0;

/* desbloqueio pelo nível do jogador (Sys.level); sem o Sys.level carregado, fica liberado. As pedras caem antes e ficam guardadas. */
const LV=()=>root.Sys&&root.Sys.level;
const locked=S=>{ const L=LV(); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'practice')); };
const lockLevel=()=>{ const L=LV(); return L&&L.unlockLevel?L.unlockLevel('practice'):1; };
const LOCK='<svg class="sys-lock-ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15.4" r="1.6" fill="#0008"/></svg>';   // cadeado desenhado (sem emoji, pedido do PO)
/* {ok, cost, reason:'id'|'locked'|'cap'|'stones'} */
function canTrain(S,host,id){
  const t=TRACK[id]; if(!t) return {ok:false,cost:0,reason:'id'};
  const o=ensure(S), lv=o.lv[id], c=cost(lv);
  if(locked(S)) return {ok:false,cost:c,reason:'locked'};
  if(lv>=capOf(host)) return {ok:false,cost:c,reason:'cap'};
  if(o.stones<c) return {ok:false,cost:c,reason:'stones'};
  return {ok:true,cost:c,reason:''};
}
/* sobe até `times` níveis (padrão 1; Infinity = o máximo possível). Devolve {ok, n, spent, reason} */
function train(S,host,id,times){
  let n=0, spent=0, why=''; const max=times===Infinity?1e6:Math.max(1,int0(num(times,1)));
  while(n<max){ const c=canTrain(S,host,id); if(!c.ok){ why=c.reason; break; } const o=S.sys.practice; o.stones-=c.cost; o.spent+=c.cost; o.lv[id]++; spent+=c.cost; n++; }
  return {ok:n>0,n,spent,reason:n>0?'':why};
}
function addStones(S,n,host){
  const k=int0(n); if(!k) return 0; const o=ensure(S), before=o.stones;
  o.stones=Math.min(DATA.maxStones,o.stones+k); o.earned+=o.stones-before; return o.stones-before;
}

/* eventos do contrato. onKill: chamar 1x por inimigo morto (horda E chefe; não chamar outro evento para o chefe) */
function onKill(S,host,enemy){
  const D=DATA.drop, era=eraMaxOf(host);
  if(enemy&&enemy.eraBoss) return addStones(S,D.eraBoss+D.eraBossPerEra*era,host);
  if(enemy&&enemy.boss) return addStones(S,D.boss+D.bossPerEra*era,host);
  return rngOf(host)()<D.commonChance?addStones(S,D.common,host):0;
}
const vipOff=S=>{ const V=root.Sys&&root.Sys.vip; let p=null; try{ p=V&&V.perks?V.perks(S):null; }catch(e){ p=null; } return Math.max(1,num(p&&p.offlineMult,1)); };   // VIP: offline em dobro
function onOffline(S,host,seconds){
  const h=clamp(num(seconds,0),0,DATA.offline.capHours*3600)/3600;
  return addStones(S,Math.floor(h*DATA.offline.perHour*vipOff(S)),host);
}

function bonus(S){
  const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S) return b; const o=ensure(S);
  for(const t of DATA.tracks) b[t.stat]+=o.lv[t.id]*t.per;
  for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6;   // 3 x 0,1 = 0,3 (não 0,30000000000000004)
  return b;
}
/* dicas para o painel "Como ficar mais forte" (js/sys/fc.js converte delta em FC) */
function advice(S,host){
  const o=ensure(S), cap=capOf(host), out=[];
  for(const t of DATA.tracks){ const lv=o.lv[t.id]; if(lv>=cap) continue; const c=cost(lv);
    out.push({id:'practice.'+t.id,icon:t.icon,label:`Prática: ${t.name} Nv ${lv+1}`,delta:{[t.stat]:t.per},cost:`${c} 🪨`,ready:o.stones>=c,tab:'practice'}); }
  return out;
}

/* ---------------- UI (opcional) ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{};
  if(locked(S)){ el.innerHTML=`<div class="sys-prac"><div class="sys-card sys-lock">${LOCK}<b>Práticas</b><span>Libera no nível ${lockLevel()}</span><small>🪨 ${fmtN(ensure(S).stones)} pedras guardadas</small></div></div>`; el.onclick=null; return; }
  const o=ensure(S), cap=capOf(host), era=eraMaxOf(host);
  // linhas por página pela altura real do contêiner (cabeçalho ~54px; o pager ~40px só entra se não couber tudo)
  const N=DATA.tracks.length, rowH=num(opt.rowH,58), body=num(el.clientHeight,0)-54;
  const per=body<=0||N*rowH<=body?N:clamp(Math.floor((body-40)/rowH),1,N);
  const pages=Math.ceil(N/per), pg=clamp(int0(el.__sysPracPage),0,pages-1); el.__sysPracPage=pg;
  const rows=DATA.tracks.slice(pg*per,pg*per+per).map(t=>{ const lv=o.lv[t.id], c=canTrain(S,host,t.id), full=lv>=cap;
    return `<div class="sys-prac-row${full?' full':''}">
      <span class="sys-prac-ic">${t.icon}</span>
      <span class="sys-prac-tx"><b>${esc(t.name)}</b> <small>Nv ${lv}/${cap}</small><br><span>+${fmtP(lv*t.per)}${esc(t.unit)}${full?'':` → <b>+${fmtP((lv+1)*t.per)}</b>`}</span></span>
      <button class="sys-btn sys-prac-go" data-id="${t.id}" ${c.ok?'':'disabled'}>${full?'Teto':`Treinar<small>${c.cost} 🪨</small>`}</button>
      <button class="sys-btn sys-prac-max" data-id="${t.id}" data-max="1" ${c.ok?'':'disabled'} aria-label="Treinar o máximo">Máx</button>
    </div>`; }).join('');
  el.innerHTML=`<div class="sys-prac">
    <div class="sys-prac-top"><span class="sys-prac-st">🪨 <b>${fmtN(o.stones)}</b> pedras</span>
      <span class="sys-prac-cap">Teto da era ${era}: Nv ${cap}${era<6?` · próxima era: Nv ${cap+DATA.cap.perEra}`:''}</span></div>
    <div class="sys-prac-list">${rows}</div>
    ${pages>1?`<div class="sys-pg"><button class="sys-pg-btn" data-pg="-1" ${pg?'':'disabled'}>‹</button><span>${pg+1}/${pages}</span><button class="sys-pg-btn" data-pg="1" ${pg<pages-1?'':'disabled'}>›</button></div>`:''}
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    if(b.dataset.pg){ el.__sysPracPage=pg+Number(b.dataset.pg); render(el,S,host,opt); return; }
    const r=train(S,host,b.dataset.id,b.dataset.max?Infinity:1);
    if(r.ok){ const t=TRACK[b.dataset.id]; if(host&&host.toast) host.toast(`${t.icon} ${t.name} Nv ${o.lv[t.id]}${r.n>1?` (+${r.n})`:''}`); changed(host); }
    render(el,S,host,opt); };
}

const API={DATA,ensure,cost,capOf,level,canTrain,train,addStones,onKill,onOffline,bonus,advice,render};
root.Sys=root.Sys||{}; root.Sys.practice=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
