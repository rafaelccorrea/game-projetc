/* Eonbound — Sys.fusion: FUSÃO COM RESULTADO CONHECIDO (docs/IDLE_PARECIDOS.md §3 item 11, P2, dono aprovou 13/11).
   Regra: o jogador vê o item EXATO que vai sair ANTES de confirmar, e recebe exatamente esse item. Nada é sorteado.
   Dois modos, os dois DESLIGADOS (DATA.on=false; o de raridade tem ainda DATA.rarity.on=false):
   - 'star'   (a fusão que já existe no Sys.stats.canFuse/fuse: 3 IGUAIS → 1 com +1 estrela de qualidade). Aqui só embrulha: prévia por ids,
              confirmação que confere a prévia (key), aplicação na mochila (tira os 3, põe o resultado, mantém equipado) e o plano do VIP autoFuse.
              O Sys.stats NÃO é alterado: a conta continua lá (o js/p_fuse.js e o js/p_forge2.js já mostram o canFuse como prévia).
   - 'rarity' (PROPOSTA, "1 escolhido pelo jogador da raridade seguinte"): 3 do MESMO espaço, era e raridade (arma: mesma família) viram 1 da raridade
              seguinte. O JOGADOR ESCOLHE qual dos 3 dá a aparência, a família, a qualidade e os secundários (opt.pick). Secundário que falta na
              raridade nova vem de uma semente fixa pelos 3 ids: a prévia mostra e a fusão entrega o mesmo. Teto: até Mítico (Lendário e Divino só por drop).
   Moeda: só ouro (moeda do jogo). Nada é vendido por dinheiro.
   Depende de Sys.stats (canFuse, fuse, qpOf, qualityStars, weaponType, visualEra, upgradeCost, rollSubs, subCount, maxR). */
(function(root){
'use strict';

const DATA={
  on:false,
  rarity:{on:false, count:3, maxTo:3, goldPerLevel1:5},   // maxTo 3 = Mítico. Custo = 5 × custo do Nv 1→2 do item da raridade NOVA (PROPOSTA, o QA calibra)
  rarName:['Básico','Raro','Épico','Mítico','Lendário','Divino'],
  slotName:{weapon:'Arma',armor:'Armadura',hat:'Elmo',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'},
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ST=()=>root.Sys&&root.Sys.stats;
function seeded(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const clone=o=>JSON.parse(JSON.stringify(o));
const on=()=>DATA.on===true;
const famOf=it=>{ const T=ST(); return it&&it.slot==='weapon'&&T&&T.weaponType?T.weaponType(it):null; };
const isEq=(S,it)=>!!(S&&S.eq&&it&&S.eq[it.slot]===it.id);
/* os itens da mochila pelos ids (na ordem dada); null se faltar algum ou repetir id */
function find(S,ids){ if(!S||!Array.isArray(S.inv)||!Array.isArray(ids)) return null; if(new Set(ids).size!==ids.length) return null;
  const out=ids.map(id=>S.inv.find(x=>x&&x.id===id)); return out.every(Boolean)?out:null; }
const keyOf=(mode,ids,result,gold)=>String(hash(JSON.stringify([mode,ids.slice().sort(),result,gold])));
const payOk=(host,g)=>!(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(g));

/* ---------------- modo 'star' (Sys.stats.canFuse) ---------------- */
function planStar(S,host,items){ const T=ST(); if(!T||typeof T.canFuse!=='function') return {ok:false,reason:'nostats'};
  const free=Object.assign({},host||{},{canSpendGold:()=>true});        // só para mostrar o resultado mesmo sem ouro (a cobrança é a real)
  const c=T.canFuse(S,free,items); if(!c.ok) return {ok:false,reason:c.reason};
  const best=items.slice().sort((x,y)=>T.qpOf(y)-T.qpOf(x))[0], result=clone(c.result);
  if(best.wing!=null) result.wing=best.wing; const fam=famOf(best); if(fam) result.wt=fam;
  return {ok:true,result,gold:c.gold,from:c.fromStars,to:c.toStars}; }

/* ---------------- modo 'rarity' (PROPOSTA) ---------------- */
function planRarity(S,host,items,pickId){ const T=ST(), R=DATA.rarity; if(!T) return {ok:false,reason:'nostats'};
  if(R.on!==true) return {ok:false,reason:'off'};
  if(items.length!==R.count) return {ok:false,reason:'count'};
  const a=items[0], r=int0(a.r);
  for(const x of items) if(x.slot!==a.slot||int0(x.e)!==int0(a.e)||int0(x.r)!==r||famOf(x)!==famOf(a)) return {ok:false,reason:'different'};
  const to=r+1, maxR=typeof T.maxR==='function'?T.maxR():4; if(to>Math.min(R.maxTo,maxR)) return {ok:false,reason:'max'};
  const pick=pickId==null?null:items.find(x=>x.id===pickId); if(!pick) return {ok:false,reason:'pick'};   // o jogador PRECISA escolher
  const subs=(Array.isArray(pick.subs)?pick.subs:[]).map(s=>({k:s.k,q:s.q})), need=typeof T.subCount==='function'?T.subCount(to):subs.length;
  if(subs.length<need&&typeof T.rollSubs==='function'){ const have=new Set(subs.map(s=>s.k));
    for(const s of T.rollSubs(a.slot,to,seeded(hash('fusion|'+items.map(x=>x.id).sort().join(','))))) if(subs.length<need&&!have.has(s.k)){ subs.push({k:s.k,q:s.q}); have.add(s.k); } }
  const result={slot:a.slot,e:int0(a.e),r:to,lvl:Math.max(...items.map(x=>int0(x.lvl)||1)),gold:items.reduce((t,x)=>t+int0(x.gold),0),
    look:T.visualEra?T.visualEra(pick):int0(pick.e),subs};
  if(typeof pick.qp==='number'&&isFinite(pick.qp)) result.qp=pick.qp;
  if(pick.wing!=null) result.wing=pick.wing; const fam=famOf(pick); if(fam) result.wt=fam;
  const gold=R.goldPerLevel1*int0(T.upgradeCost({lvl:1,r:to,e:int0(a.e)}).gold);
  return {ok:true,result,gold,from:r,to}; }

/* ---------------- prévia (o resultado EXATO) ----------------
   preview(S,host,ids,opt) opt = {mode:'star'|'rarity' (padrão 'star'), pick:id (rarity)}
   → {ok, reason, mode, ids, result (o item que vai sair, sem id), gold, canPay, from, to, keepsEquipped, key, lines:[texto]}
   reason: 'off' | 'ids' | 'count' | 'different' | 'max' | 'pick' | 'money' (ok:false mas result e gold presentes) | os do Sys.stats */
function preview(S,host,ids,opt){ opt=opt||{}; const mode=opt.mode==='rarity'?'rarity':'star';
  if(!on()) return {ok:false,reason:'off',mode};
  const items=find(S,ids); if(!items) return {ok:false,reason:'ids',mode};
  const p=mode==='rarity'?planRarity(S,host,items,opt.pick):planStar(S,host,items);
  if(!p.ok) return {ok:false,reason:p.reason,mode};
  const canPay=payOk(host,p.gold), keeps=items.some(x=>isEq(S,x)), r=p.result;
  const name=`${DATA.slotName[r.slot]||r.slot} ${DATA.rarName[r.r]||''}`.trim();
  const lines=[mode==='rarity'?`Sai: ${name} (de ${DATA.rarName[p.from]} para ${DATA.rarName[p.to]})`:`Sai: ${name} com ${p.to} estrelas (de ${p.from} para ${p.to})`,
    `Nível ${r.lvl} · os 3 itens somem`, `Custo: ${p.gold} ouro`];
  if(keeps) lines.push('Fica equipado no lugar do atual');
  return {ok:canPay,reason:canPay?'':'money',mode,ids:ids.slice(),result:r,gold:p.gold,canPay,from:p.from,to:p.to,keepsEquipped:keeps,
    key:keyOf(mode,ids,r,p.gold),lines}; }

/* ---------------- confirmar ----------------
   apply(S,host,ids,opt,key): refaz a prévia; se a key não bate (algo mudou desde a prévia) → {ok:false,reason:'changed'} e nada muda.
   Cobra o ouro (star: Sys.stats.fuse; rarity: host.spendGold), tira os 3 de S.inv, põe o resultado com id novo e mantém equipado.
   → {ok, item, consumed:[ids], gold, mode} */
function apply(S,host,ids,opt,key){ const p=preview(S,host,ids,opt); if(!p.ok) return {ok:false,reason:p.reason};
  if(key!=null&&String(key)!==p.key) return {ok:false,reason:'changed'};
  const items=find(S,ids);
  if(p.mode==='star'){ const r=ST().fuse(S,host,items); if(!r||!r.ok) return {ok:false,reason:r&&r.reason||'money'}; }
  else if(host&&typeof host.spendGold==='function'&&host.spendGold(p.gold)===false) return {ok:false,reason:'money'};
  const item=clone(p.result), top=S.inv.reduce((m,x)=>Math.max(m,+(x&&x.id)||0),0);
  if(!(int0(S.nextId)>top)) S.nextId=top+1; item.id=S.nextId++; item.gotAt=host&&typeof host.now==='function'?host.now():Date.now(); item.nw=1;
  S.inv=S.inv.filter(x=>!ids.includes(x&&x.id)); S.inv.push(item);
  if(p.keepsEquipped) S.eq[item.slot]=item.id;
  if(host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,item,consumed:ids.slice(),gold:p.gold,mode:p.mode}; }

/* ---------------- plano do VIP autoFuse (só modo star): nunca o equipado, nunca 5 estrelas ----------------
   → [{ids, preview}] em ordem fixa (grupo por espaço/era/raridade/estrelas/família; dentro do grupo, os 3 de menor qualidade, desempate pelo id).
   Não mexe no save: quem confirma chama apply para cada um. */
function autoPlan(S,host){ const T=ST(); if(!on()||!T||!S||!Array.isArray(S.inv)) return [];
  const groups={}; for(const it of S.inv){ if(!it||isEq(S,it)) continue; const st=T.qualityStars(T.qpOf(it));
    const k=[it.slot,int0(it.e),int0(it.r),st,famOf(it)||''].join('|'); (groups[k]=groups[k]||[]).push(it); }
  const out=[]; for(const k of Object.keys(groups).sort()){ const g=groups[k].sort((x,y)=>T.qpOf(x)-T.qpOf(y)||(+x.id)-(+y.id));
    for(let i=0;i+3<=g.length;i+=3){ const ids=g.slice(i,i+3).map(x=>x.id), p=preview(S,host,ids,{mode:'star'}); if(p.result) out.push({ids,preview:p}); } }
  return out; }

function setOn(v){ DATA.on=!!v; return DATA.on; }
const API={DATA,setOn,find,preview,apply,autoPlan};
root.Sys=root.Sys||{}; root.Sys.fusion=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
