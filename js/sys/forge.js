/* Eonbound — Sys.forge: fortalecimento +0..+15 no ESPAÇO de equipamento (arma e armadura), não no item.
   A tentativa pode falhar, mas NUNCA perde nível; cada falha soma pontos de garantia à próxima tentativa daquele espaço.
   Material: Pedra de Forja 🔨 (estoque aqui; os drops da fps-30 entregam por addStones). Nada de forja é vendido por gemas.
   Spec: reports/spec-fortalecimento.md · números: docs/balance.json v5.1 ("forge"). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-forge.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento: docs/balance.json v5.1) ---------------- */
const DATA={
  label:'Forja', icon:'🔨',
  // 7 espaços (regras novas do dono). A aura continua só da ARMA. A asa só existe Épica+ e abre no nível 50 (Sys.stats.canEquip).
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],
  slotName:{weapon:'Arma',armor:'Colete',hat:'Chapéu/Elmo',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'},
  max:15,
  chance:[100,100,100,90,80,70,60,50,40,30,25,20,15,10,5],        // % base para ir de +n a +n+1 (índice n)
  stones:[2,3,4,5,6,6,8,9,10,11,13,16,19,22,25],                  // pedras por TENTATIVA (índice n)
  pityPerFail:5,                                                  // pontos somados à chance a cada falha; zera ao acertar
  bonus:[0,0.03,0.06,0.09,0.12,0.15,0.18,0.23,0.28,0.33,0.41,0.49,0.57,0.69,0.81,0.93],  // multiplicador acumulado do +N
  capByEra:[6,6,9,9,12,12,15],                                    // teto por era liberada (decisão do PO: pares)
  goldPerTryKills:30,           // ouro por tentativa = 30 x ouro por abate da fase atual (só se o host tiver spendGold)
  // aura (só a arma): +0-3 nenhuma · +4-6 azul · +7-9 roxa · +10-12 chamas vermelhas · +13-15 dourada com raios
  auras:[{from:0,id:'none',name:'Sem aura',col:''},{from:4,id:'blue',name:'Aura azul',col:'#4aa3ff'},{from:7,id:'purple',name:'Aura roxa',col:'#b45cff'},
         {from:10,id:'flame',name:'Chamas vermelhas',col:'#ff4d3d'},{from:13,id:'gold',name:'Dourada com raios',col:'#ffd23f'}],
  maxStones:1e9,
  // FORJA +16 A +20 (pacote das últimas eras, dono 13/11; docs/balance.json dificuldade.pacoteFim.forge): DESLIGADO até a medida do Engenheiro.
  // setForge20(true) sobe o teto para 20 e libera +18 na era 7 e +20 na era 8; desligar volta a tudo de antes. A aura de +13 a +20 continua a dourada
  // (não há arte de aura nova para +16; se o dono quiser uma, é pedido de Arte). Desligar com alguém acima de +15 corta o save para +15 (contrato do ensure: teto = DATA.max).
  f20:{on:false, max:20, bonus:[1.05,1.17,1.29,1.41,1.53], chance:[5,5,4,4,3], stones:[28,32,36,40,45], capByEra:[6,6,9,9,12,12,15,18,20]},
};
const BASE15={max:15, bonus:15+1, chance:15, stones:15, capByEra:7};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtN=n=>{ n=num(n,0); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.floor(n)); };
const pct=v=>Math.round(v*100)+'%';
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const isSlot=s=>DATA.slots.includes(s);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.forge.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.forge; if(!o||typeof o!=='object') o=S.sys.forge={};
  o.v=1; o.stones=Math.min(DATA.maxStones,int0(o.stones)); o.earned=int0(o.earned); o.spent=int0(o.spent);
  o.tries=int0(o.tries); o.fails=int0(o.fails);
  const lv=(o.lv&&typeof o.lv==='object')?o.lv:{}, pity=(o.pity&&typeof o.pity==='object')?o.pity:{};
  o.lv={}; o.pity={};
  for(const s of DATA.slots){ o.lv[s]=clamp(int0(lv[s]),0,DATA.max); o.pity[s]=Math.max(0,num(pity[s],0)); }
  return o;
}

const capOf=host=>DATA.capByEra[clamp(eraMaxOf(host),0,DATA.capByEra.length-1)];
/* Forja +16 a +20: liga e desliga sem duplicar */
function setForge20(on){ const F=DATA.f20; F.on=!!on; DATA.max=F.on?F.max:BASE15.max; DATA.bonus.length=BASE15.bonus; DATA.chance.length=BASE15.chance; DATA.stones.length=BASE15.stones; DATA.capByEra.length=BASE15.capByEra;
  if(F.on){ DATA.bonus.push(...F.bonus); DATA.chance.push(...F.chance); DATA.stones.push(...F.stones); DATA.capByEra.push(...F.capByEra.slice(BASE15.capByEra)); } return F.on; }
const forge20On=()=>DATA.f20.on===true;
/* nível que VALE agora (o save pode guardar +16..+20 com a chave desligada) */
const eff=n=>Math.min(int0(n),DATA.max);
const level=(S,slot)=>isSlot(slot)?eff(ensure(S).lv[slot]):0;
/* multiplicador do espaço: o engenheiro aplica em heroStats() → poder × (1 + mult). Não é bonus() de Sys. */
const mult=(S,slot)=>isSlot(slot)?DATA.bonus[eff(ensure(S).lv[slot])]:0;
/* chance da PRÓXIMA tentativa (base + garantia acumulada), em % (0..100) */
function chance(S,slot){ const o=ensure(S), n=eff(o.lv[slot]); if(n>=DATA.max) return 0; return clamp(DATA.chance[n]+o.pity[slot],0,100); }
function goldCost(host){ const u=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)); return Math.round(DATA.goldPerTryKills*u); }
/* desbloqueio pelo nível do jogador (Sys.level); sem o Sys.level carregado, fica liberado. As pedras caem antes e ficam guardadas. */
const LV=()=>root.Sys&&root.Sys.level;
const locked=S=>{ const L=LV(); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'forge')); };
const lockLevel=()=>{ const L=LV(); return L&&L.unlockLevel?L.unlockLevel('forge'):1; };
const LOCK='<svg class="sys-lock-ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15.4" r="1.6" fill="#0008"/></svg>';   // cadeado desenhado (sem emoji, pedido do PO)
/* {ok, reason:'slot'|'locked'|'max'|'cap'|'stones'|'gold', stones, gold, chance} */
function canTry(S,host,slot){
  if(!isSlot(slot)) return {ok:false,reason:'slot',stones:0,gold:0,chance:0};
  const o=ensure(S), n=eff(o.lv[slot]), st=n<DATA.max?DATA.stones[n]:0, g=goldCost(host), ch=chance(S,slot);
  const r={ok:false,reason:'',stones:st,gold:g,chance:ch};
  if(locked(S)){ r.reason='locked'; return r; }
  if(n>=DATA.max){ r.reason='max'; return r; }
  if(n>=capOf(host)){ r.reason='cap'; return r; }
  if(o.stones<st){ r.reason='stones'; return r; }
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(g)){ r.reason='gold'; return r; }
  r.ok=true; return r;
}
/* uma tentativa. {ok, reason, success, slot, lv, chance, roll, pity, stones, gold} — falha NUNCA rebaixa */
function attempt(S,host,slot){
  const c=canTry(S,host,slot); if(!c.ok) return {ok:false,reason:c.reason,success:false,slot};
  const o=ensure(S);
  if(host&&typeof host.spendGold==='function'&&host.spendGold(c.gold)===false) return {ok:false,reason:'gold',success:false,slot};
  o.stones-=c.stones; o.spent+=c.stones; o.tries++;
  const roll=rngOf(host)()*100, success=roll<c.chance;
  if(success){ o.lv[slot]++; o.pity[slot]=0; } else { o.fails++; o.pity[slot]+=DATA.pityPerFail; }
  return {ok:true,reason:'',success,slot,lv:o.lv[slot],chance:c.chance,roll,pity:o.pity[slot],stones:c.stones,gold:typeof (host&&host.spendGold)==='function'?c.gold:0};
}
/* pior caso de tentativas para o próximo nível com a garantia (para a tela: "garantido em até N") */
function worstTries(S,slot){ const o=ensure(S), n=eff(o.lv[slot]); if(n>=DATA.max) return 0; return Math.max(1,Math.ceil((100-chance(S,slot))/DATA.pityPerFail)+1); }

function addStones(S,n,host){
  const k=int0(n); if(!k) return 0; const o=ensure(S), before=o.stones;
  o.stones=Math.min(DATA.maxStones,o.stones+k); o.earned+=o.stones-before; return o.stones-before;
}
/* FORJA PRESA AO ESPAÇO (docs/IDLE_PARECIDOS.md §3 item 1, dono aprovou 13/11). Já é assim desde a v1: o +N mora em S.sys.forge.lv[espaço] e o
   Sys.stats aplica mult(S, espaço) na peça que ESTIVER no espaço; nenhuma peça guarda +N. Trocar de peça mantém o +N, sem chave e sem migração.
   Para o cartão "novo × atual" (o Engenheiro mostra a frase): {slot, lv, mult, keeps:true, text} */
function slotNote(S,slot){ if(!isSlot(slot)) return null; const n=level(S,slot);
  return {slot,lv:n,mult:DATA.bonus[n],keeps:true,text:n>0?`A Forja +${n} é do espaço: a peça nova também fica com +${n}.`:'A Forja é do espaço: o que você fortalecer aqui vale para qualquer peça equipada.'}; }
/* aura da arma (a fps-ff desenha; a cor vem do +N, nunca da skin) */
function aura(S){ const n=level(S,'weapon'); let a=DATA.auras[0]; for(const x of DATA.auras) if(n>=x.from) a=x; return {...a,lv:n}; }

/* o fortalecimento entra em heroStats() (host.atk/hp), por isso não soma nada aqui (senão contaria duas vezes) */
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
/* dica: próximo + de cada espaço. delta aproximado em % do ATK (arma) ou do HP (armadura) */
function advice(S,host){
  const out=[]; for(const s of DATA.slots){ const n=level(S,s), c=canTry(S,host,s); if(c.reason==='max'||c.reason==='cap') continue;
    const g=((1+DATA.bonus[n+1])/(1+DATA.bonus[n])-1)*100;
    out.push({id:'forge.'+s,icon:'forge',label:`Fortalecer ${DATA.slotName[s]} +${n+1} (${c.chance}%)`,delta:s==='weapon'?{atkPct:g}:{hpPct:g},
      cost:`${c.stones} pedras de forja`,ready:c.ok,tab:'forge'}); }
  return out;
}

/* ---------------- UI (opcional): os 7 espaços em linhas compactas, paginadas pela altura real, sem scroll ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{};
  if(locked(S)){ el.innerHTML=`<div class="sys-forge"><div class="sys-card sys-lock">${LOCK}<b>Forja</b><span>Libera no nível ${lockLevel()}</span><small>🔨 ${fmtN(ensure(S).stones)} pedras de forja guardadas</small></div></div>`; el.onclick=null; return; }
  const o=ensure(S), cap=capOf(host), msg=el.__sysForgeMsg||'', au=aura(S);
  // linhas por página pela altura real (cabeçalho ~40, aura ~34, aviso ~20; pager ~48 só se não couber tudo)
  const N=DATA.slots.length, rowH=num(opt.rowH,60), body=num(el.clientHeight,0)-94;
  const per=body<=0||N*rowH<=body?N:clamp(Math.floor((body-48)/rowH),1,N), pages=Math.ceil(N/per), pg=clamp(int0(el.__sysForgePage),0,pages-1); el.__sysForgePage=pg;
  const row=s=>{ const n=eff(o.lv[s]), c=canTry(S,host,s), top=n>=DATA.max, atCap=n>=cap;
    const pityW=top?0:Math.round(o.pity[s]/Math.max(1,100-DATA.chance[n])*100);
    return `<div class="sys-card sys-forge-row">
      <span class="sys-forge-nm"><b>${DATA.slotName[s]}</b><span class="sys-forge-lv">+${n}</span></span>
      <span class="sys-forge-mid"><span>${pct(DATA.bonus[n])}${top?'':` → <b>${pct(DATA.bonus[n+1])}</b>`}</span>
        ${top?'<small>Máximo</small>':atCap?`<small>Teto da era: +${cap}</small>`:`<small>${c.chance}%${o.pity[s]?` (+${o.pity[s]} garantia)`:''} · até ${worstTries(S,s)} tent.</small>
        <span class="sys-forge-pity"><i style="width:${clamp(pityW,0,100)}%"></i></span>`}</span>
      <button class="sys-btn sys-forge-go" data-slot="${s}" ${c.ok?'':'disabled'}>${top?'Máx.':atCap?'Teto':`Fortalecer<small>${c.stones} 🔨</small>`}</button>
    </div>`; };
  el.innerHTML=`<div class="sys-forge">
    <div class="sys-forge-top"><span>🔨 <b>${fmtN(o.stones)}</b> pedras de forja</span><span>Teto da era: +${cap}</span></div>
    <div class="sys-forge-list">${DATA.slots.slice(pg*per,pg*per+per).map(row).join('')}</div>
    ${pages>1?`<div class="sys-pg"><button class="sys-pg-btn" data-pg="-1" ${pg?'':'disabled'}>‹</button><span>${pg+1}/${pages}</span><button class="sys-pg-btn" data-pg="1" ${pg<pages-1?'':'disabled'}>›</button></div>`:''}
    <div class="sys-forge-aura"${au.col?` style="--aura:${au.col}"`:''}>Arma: <b>${esc(au.name)}</b>${au.id==='none'?' <small>(aura a partir do +4)</small>':''}</div>
    <div class="sys-forge-msg">${esc(msg)||'A falha não tira nível: só gasta as pedras e aumenta a chance da próxima.'}</div>
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    if(b.dataset.pg){ el.__sysForgePage=pg+Number(b.dataset.pg); render(el,S,host,opt); return; }
    const r=attempt(S,host,b.dataset.slot); if(!r.ok) return;
    el.__sysForgeMsg=r.success?`${DATA.slotName[r.slot]} +${r.lv}!`:`Falhou (${r.chance}%). Próxima: ${chance(S,r.slot)}%`;
    if(host&&host.toast) host.toast(el.__sysForgeMsg); changed(host); render(el,S,host,opt); };
}

const API={DATA,setForge20,forge20On,ensure,capOf,level,mult,slotNote,chance,canTry,attempt,worstTries,addStones,aura,bonus,advice,render,_goldCost:goldCost};
root.Sys=root.Sys||{}; root.Sys.forge=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
