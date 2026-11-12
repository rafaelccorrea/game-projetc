/* Eonbound — Sys.chest: baú de toque. A barra enche por abate; quando enche, o baú fica pulsando no canto da batalha
   (acumula até 3). O toque abre e dá 3 a 5 itens pela tabela de drop da era (Sys.loot), mais moedas.
   Lógica pura + UI opcional (render/update/showOpen). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-chest.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  killsPerChest:250,            // v5.1: 1 baú a cada 250 pontos de abate (40 dava ~50 baús/dia no jogo longo)
  dailyCap:8,                   // v5.1: no máximo 8 baús GANHOS por dia (renova à meia-noite local); depois a barra para ("volte amanhã")
  killWeight:{common:1, boss:5, eraBoss:10},
  maxStored:3,
  items:[3,5],                  // itens por baú (inclusive)
  rarityBoost:0.5,              // reforço nos pesos r>=1 da tabela da era (baú é melhor que drop comum)
  minR:0,
  goldUnits:[15,30],            // moedas = host.goldUnit() x sorteio no intervalo
  gemChance:0.15, gems:[2,5],   // corte de 💎 (PO, v0.12.0): era 25%
  stones:{chance:0.5, n:[1,2]}, // pedras de PRÁTICA → Sys.practice.addStones (fps-e2); ignorado se o módulo não existir
  forge:{chance:0.6, n:[1,3]},  // pedras de FORJA → Sys.loot.addMat (conta na missão do dia) → Sys.forge.addStones
  food:{chance:0.1, n:[1,1]},   // ração de pet (v5.1: "10% de 1") → Sys.loot.addMat → Sys.pet.addFood
  // reserva usada só se Sys.loot não estiver carregado
  fallbackWeights:[70,22,6,1.6,0.4], slots:['weapon','armor'],
  rarNames:['Básico','Raro','Épico','Mítico','Lendário'], rarColors:['#9aa0a6','#4aa3ff','#b45cff','#ff4d6d','#ffb21e'],
};
// multiplicadores configuráveis (VIP/eventos ligam depois; fora do save)
const params={mult:{speed:1, items:1, rarity:1, gold:1}, maxStoredAdd:0, dailyCapAdd:0};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const randInt=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
const Loot=()=>root.Sys&&root.Sys.loot;
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.chest.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.chest; if(!o||typeof o!=='object') o=S.sys.chest={};
  o.v=2; o.charge=Math.max(0,num(o.charge,0)); o.stored=clamp(Math.floor(num(o.stored,0)),0,maxStored()); o.opened=Math.max(0,Math.floor(num(o.opened,0)));
  if(typeof o.day!=='string') o.day=''; o.today=clamp(Math.floor(num(o.today,0)),0,999);
  o.charge=Math.min(o.charge,need());   // save v1 (40 abates) não vira vários baús de uma vez
  return o;
}
const need=()=>Math.max(1,Math.round(DATA.killsPerChest/Math.max(0.01,num(params.mult.speed,1))));
const maxStored=()=>Math.max(1,DATA.maxStored+Math.floor(num(params.maxStoredAdd,0)));
/* teto do dia: 8 + params.dailyCapAdd + VIP (Sys.vip.perks(S).chestCapAdd: 8→12) */
const vipOf=S=>{ const L=Loot(); return L&&L.vipPerks&&S?L.vipPerks(S):{chestCapAdd:0,goldPct:0}; };
const dailyCap=S=>Math.max(1,DATA.dailyCap+Math.floor(num(params.dailyCapAdd,0))+vipOf(S).chestCapAdd);
/* virada do dia: zera os baús ganhos hoje */
function refresh(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.today=0; } return o; }
/* converte carga em baús enquanto houver espaço no estoque e no teto do dia */
function settle(o,nd,mx,cap){ let gained=0; while(o.charge>=nd&&o.stored<mx&&o.today<cap){ o.charge-=nd; o.stored++; o.today++; gained++; } return gained; }

/* soma carga. Estoque cheio (3) ou teto do dia (8) atingido: a barra fica parada em 100% (não acumula além de 1 baú). */
function addCharge(S,k,host){
  const o=refresh(S,host); k=Math.max(0,num(k,0)); if(!k) return {gained:0,stored:o.stored,capped:o.today>=dailyCap(S)};
  const nd=need(), mx=maxStored(), cap=dailyCap(S);
  o.charge+=k; const gained=settle(o,nd,mx,cap);
  o.charge=Math.min(o.charge,nd);
  return {gained,stored:o.stored,capped:o.today>=cap};
}
/* evento do contrato: 1x por inimigo morto (campanha; na instância o baú não enche) */
function onKill(S,enemy,host){
  const cls=(enemy&&enemy.eraBoss)?'eraBoss':(enemy&&enemy.boss)?'boss':'common';
  return addCharge(S,DATA.killWeight[cls],host);
}
/* vários abates de uma vez (offline: Sys.loot.offline(...).kills) */
function onKills(S,n,host){ return addCharge(S,Math.floor(Math.max(0,num(n,0))),host); }

function progress(S,host){
  const o=refresh(S,host), nd=need(), mx=maxStored(), cap=dailyCap(S);
  return {charge:o.charge,need:nd,pct:clamp(o.charge/nd,0,1),stored:o.stored,max:mx,full:o.stored>=mx,
    today:o.today,cap,capped:o.today>=cap,left:Math.max(0,cap-o.today)};
}

function rollOne(host,rng){
  const L=Loot(); const boost=DATA.rarityBoost*num(params.mult.rarity,1);
  if(L) return L.rollItem(host,{boost,minR:DATA.minR,source:'chest'});
  const w=DATA.fallbackWeights.map((x,r)=>r?x*(1+boost):x), tot=w.reduce((s,x)=>s+x,0); let x=rng()*tot, r=0;
  for(let i=0;i<w.length;i++){ x-=w[i]; r=i; if(x<=0) break; }
  const em=Math.max(0,Math.floor(num(host&&host.eraMax&&host.eraMax(),0)));
  return {slot:DATA.slots[Math.floor(rng()*2)%2],r:Math.max(r,DATA.minR),e:em};
}
/* abre 1 baú: sorteia, entrega pelo host e devolve {items,gold,gems,stones,left}. null se não houver baú. */
function open(S,host){
  const o=refresh(S,host); if(o.stored<1) return null;
  const rng=rngOf(host), m=params.mult;
  o.stored--; o.opened++;
  settle(o,need(),maxStored(),dailyCap(S));   // barra parada cheia vira baú agora (se ainda couber no teto do dia)
  const n=clamp(Math.round(randInt(rng,DATA.items[0],DATA.items[1])*num(m.items,1)),1,20), items=[];
  for(let i=0;i<n;i++) items.push(rollOne(host,rng));
  const unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
  const gold=Math.max(1,Math.round(unit*randInt(rng,DATA.goldUnits[0],DATA.goldUnits[1])*num(m.gold,1)*(1+vipOf(S).goldPct/100)));   // VIP +ouro
  const gems=rng()<DATA.gemChance?randInt(rng,DATA.gems[0],DATA.gems[1]):0;
  const P=root.Sys&&root.Sys.practice; let stones=0;
  if(P&&typeof P.addStones==='function'&&rng()<DATA.stones.chance){ stones=randInt(rng,DATA.stones.n[0],DATA.stones.n[1]); P.addStones(S,stones,host); }
  const L=Loot(), roll=sp=>rng()<sp.chance?randInt(rng,sp.n[0],sp.n[1]):0;
  const forge=roll(DATA.forge), food=roll(DATA.food);
  if(host.addGold) host.addGold(gold); if(gems&&host.addGems) host.addGems(gems);
  for(const it of items) if(host.addItem) host.addItem(L&&L.itemOut?L.itemOut(it):{slot:it.slot,r:it.r,e:it.e,subs:[]});
  if(L){ L.addMat(S,host,'forge',forge); L.addMat(S,host,'food',food); const lo=L.ensure(S); lo.items+=items.length; items.forEach(it=>{ lo.byR[it.r]=(lo.byR[it.r]||0)+1; }); }
  else { const F=root.Sys&&root.Sys.forge, Pt=root.Sys&&root.Sys.pet;
    if(forge&&F&&F.addStones) F.addStones(S,forge,host); if(food&&Pt&&Pt.addFood) Pt.addFood(S,food,host); }
  return {items,gold,gems,stones,forge,food,left:o.stored};
}

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
function advice(S,host){ const p=progress(S,host); return p.stored?[{id:'chest',label:`Abrir baú (${p.stored})`,delta:{},cost:'grátis',ready:true,tab:'battle'}]:[]; }

/* ---------------- UI opcional (DOM; classes sys-chest-*, css em js/sys/sys.css) ----------------
   host opcional: itemName(it), rarName(r), rarColor(r), thumb(it) → url, sfx(name), toast(msg), onChange(), fmt(n) */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rName=(host,r)=>(host.rarName&&host.rarName(r))||DATA.rarNames[r]||('R'+r);
const rCol=(host,r)=>(host.rarColor&&host.rarColor(r))||DATA.rarColors[r]||'#ffffff';
const fmtN=(host,n)=>host.fmt?host.fmt(n):String(n);
const iName=(host,it)=>(host.itemName&&host.itemName(it))||((it.slot==='weapon'?'Arma':'Armadura')+' · Era '+(it.e+1));

/* botão do baú (anel de progresso + contador). Monta 1x; chamadas seguintes só atualizam. opts.overlay: onde abrir. */
function render(el,S,host,opts){
  if(!el) return; opts=opts||{}; ensure(S);
  if(!el._sysChest){
    el.innerHTML=`<button type="button" class="sys-chest-btn" aria-label="Baú de batalha">
      <svg class="sys-chest-ring" viewBox="0 0 48 48" aria-hidden="true"><circle class="bg" cx="24" cy="24" r="21"/><circle class="fg" cx="24" cy="24" r="21" pathLength="100"/></svg>
      <img src="assets/ui/chest.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{textContent:'🎁',className:'sys-chest-emo'}))">
      <b class="sys-chest-n"></b></button>`;
    el.querySelector('button').addEventListener('click',()=>{
      const a=el._sysChestArgs, p=progress(a.S,a.host);
      if(!p.stored){ a.host.toast&&a.host.toast(p.capped?`Baú: limite de ${p.cap} por dia atingido. Volte amanhã!`:`Baú: ${Math.floor(p.charge)}/${p.need} abates`); return; }
      const res=open(a.S,a.host); a.host.sfx&&a.host.sfx('claim'); a.host.onChange&&a.host.onChange(); update(el,a.S,a.host);
      if(a.opts.onOpen) a.opts.onOpen(res); else showOpen(a.opts.overlay||(el.closest&&el.closest('#app'))||document.body,res,a.S,a.host,()=>update(el,a.S,a.host));
    });
    el._sysChest=true;
  }
  el._sysChestArgs={S,host,opts};
  update(el,S,host);
}
function update(el,S,host){
  if(!el||!el._sysChest) return; host=host||(el._sysChestArgs&&el._sysChestArgs.host);
  const p=progress(S,host), b=el.querySelector('.sys-chest-btn');
  b.classList.toggle('ready',p.stored>0); b.classList.toggle('full',p.full); b.classList.toggle('capped',p.capped&&!p.stored);
  el.querySelector('.fg').style.strokeDasharray=`${(p.stored?100:p.pct*100).toFixed(1)} 100`;
  const n=el.querySelector('.sys-chest-n'); n.textContent=p.stored>1?'x'+p.stored:p.stored?'!':p.capped?'⏾':''; n.style.display=(p.stored||p.capped)?'':'none';
  b.setAttribute('aria-label',p.stored?`Abrir baú (${p.stored} guardado${p.stored>1?'s':''})`:p.capped?'Baú: limite do dia atingido, volte amanhã':`Baú: ${Math.floor(p.charge)} de ${p.need} abates`);
}
/* janela de abertura (cabe em 390x690 sem scroll: até 5 itens numa linha) */
function showOpen(container,res,S,host,after){
  if(!container||!res) return null;
  const ov=document.createElement('div'); ov.className='sys-chest-ov'+(container===document.body?' fixed':'');
  const cards=res.items.map((it,i)=>{ const c=rCol(host,it.r), th=host.thumb&&host.thumb(it);
    return `<div class="sys-chest-it${it.r>=3?' hot':''}" style="--c:${c};animation-delay:${0.25+i*0.12}s">
      <div class="sys-chest-th">${th?`<img src="${esc(th)}" alt="">`:(it.slot==='weapon'?'🗡️':'🛡️')}</div>
      <div class="sys-chest-nm">${esc(iName(host,it))}</div><div class="sys-chest-rr">${esc(rName(host,it.r))}</div></div>`; }).join('');
  const extra=[`+${esc(fmtN(host,res.gold))} 🪙`]; if(res.gems) extra.push(`+${res.gems} 💎`); if(res.stones) extra.push(`+${res.stones} 🪨`); if(res.forge) extra.push(`+${res.forge} 🔨`); if(res.food) extra.push(`+${res.food} 🍖`);
  ov.innerHTML=`<div class="sys-chest-box" role="dialog" aria-label="Baú aberto">
    <div class="sys-chest-top"><img src="assets/ui/chest.png" alt="" onerror="this.remove()"><b>Baú aberto!</b></div>
    <div class="sys-chest-items" style="--n:${res.items.length}">${cards}</div>
    <div class="sys-chest-extra">${extra.join(' · ')}</div>
    <div class="sys-chest-row"><button type="button" class="sys-btn" data-k="ok">Coletar</button>
    ${res.left?`<button type="button" class="sys-btn alt" data-k="more">Abrir outro (${res.left})</button>`:''}</div></div>`;
  ov.addEventListener('click',ev=>{
    const k=ev.target.closest('[data-k]'); if(!k) return; ov.remove();
    if(k.dataset.k==='more'){ const r2=open(S,host); host.sfx&&host.sfx('claim'); host.onChange&&host.onChange(); if(r2) showOpen(container,r2,S,host,after); }
    if(after) after();
  });
  container.appendChild(ov); return ov;
}

const API={DATA,params,ensure,refresh,need,maxStored,dailyCap,addCharge,onKill,onKills,progress,open,bonus,advice,render,update,showOpen};
root.Sys=root.Sys||{}; root.Sys.chest=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
