/* Eonbound — Sys.codex: CÓDEX DAS ERAS (livro de coleção da tela 30, js/p_codex.js). Dá à tela o que ela pede atrás de window.P_CODEX:
   readOwned() → ids que o jogador JÁ TEVE/VIU e readRewards() → {claimed, marks:[{p,txt}], claim(p) → {ok,txt}}. CHAVE DESLIGADA (DATA.on=false).
   CATÁLOGO = exatamente o da tela (cdxItems): armas w-<era>-<0|1|2> (7 eras × 3), armaduras a-<era>-<vest|helmet|gloves|boots|necklace|wings> (7 × 6),
   montarias m-<id> (Sys.mount.DATA.mounts com arte; 6), pets p-<espécie>-<0|1|2> (8 espécies × 3 estágios), bestiário b-<era>-<e0|e1|boss> (eras 0-6
   com nome no meta.json; 21) e auras u-<7|10|13> (3). Total 117 com 7 eras.
   POSSE (leitura defensiva do save; cada fonte é opcional, nada é exigido):
   - itens: S.inv {slot,e,r} (os equipados já estão em S.inv). Arma: tier = r<=1?0 : r<=3?1 : 2. Espaços: armor→vest, hat→helmet, gloves, boots, necklace, wing→wings.
   - pets: S.sys.pet.owned (ids do SAVE: wolf→mamute, owl→esfinge, drake→dragao, parrot→papagaio, golem→cao, underworld→cerbero, celestial→pegaso,
     prism→prisma; a fênix saiu e não conta). Estágio .stg 0..2: ter o estágio N conta também os anteriores (ele passou por eles).
   - montarias: S.sys.mount.owned. Auras: S.sys.forge.lv.weapon (maior +N da arma) ≥ 7/10/13 (a aura é da ARMA, como no Sys.forge.aura).
   - bestiário (APROXIMAÇÃO: não há registro de abate por era no save): com Sys.phases ligado, era vencida (todas as dificuldades exigidas até a fase
     final) = e0, e1 e chefe; era com alguma fase vencida = e0 e e1. Sem ele: era e vencida se S.eraMax > e ou S.best > (e+1)×10 fases; a era atual
     (a de S.best) = e0 e e1 (se já houve abate ou progresso).
   VISTOS PERMANENTES: S.sys.codex.seen guarda tudo o que já foi visto; vender/desmontar/perder não "desdescobre". sync(S,host) grava (o jogo chama depois
   de drop, equipar, ovo, montaria, forja e vitória; readOwned também chama). sync grava MESMO desligado (só registro, sem prêmio) para não perder histórico.
   PRÊMIOS: marcos em % da coleção INTEIRA (piso, igual à tela), prêmio FIXO por marco (ouro em goldk, pedras de forja, ração, essência), entregue por
   Sys.loot.grantBundle quando existe. Sem diamantes, nada pago, sem sorteio. Estado: S.sys.codex {v, seen:{id:1}, claimed:[p]}. Sem DOM. */
(function(root){
'use strict';
const R=(goldk,forge,food,essence)=>({goldk,forge,food,essence});
const DATA={
  on:false,
  eras:7,                       // teto da tela (Math.min(7, ERAS.length))
  stagesPerEra:10,              // STAGES_PER_ERA do index.html (sistema antigo de fases)
  slots:[['vest','armor'],['helmet','hat'],['gloves','gloves'],['boots','boots'],['necklace','necklace'],['wings','wing']],   // [id da tela, slot do item]
  pets:{wolf:'mamute',owl:'esfinge',drake:'dragao',parrot:'papagaio',golem:'cao',underworld:'cerbero',celestial:'pegaso',prism:'prisma',shadowwolf:'lobo',falcon:'falcao',panther:'pantera'},   // save → tela
  petOrder:['mamute','esfinge','dragao','papagaio','cao','cerbero','pegaso','prisma'],   // ordem do K_PETS da tela
  // PETS NOVOS (combinado com o Engenheiro, 14/11): entram NO FIM, depois do prisma (nenhum id muda de posição). Só contam quando dá para conseguir:
  // pet ligado no Sys.pet (newPets ou newReady) E as entregas ligadas (Sys.newDrops.DATA.on); senão a coleção nunca chegaria a 100%. +9 itens (3 × 3 estágios).
  petNew:[['lobo','shadowwolf'],['falcao','falcon'],['pantera','panther']],
  mountArt:['pony','horse','wolf','griffin','mythic','wyvern'],   // ids com arte (K_MART): só esses entram no catálogo
  mountFall:['pony','horse','wolf','griffin','mythic','wyvern'],  // sem Sys.mount (K_MFALL)
  bestEras:7, bestKinds:['e0','e1','boss'],                      // meta.json: eras 0-6 têm nome (7 e 8 ficam de fora, como na tela)
  auras:[7,10,13],
  marks:[
    {p:10, prize:R(100,3,20,0)},
    {p:25, prize:R(300,6,40,2)},
    {p:50, prize:R(800,10,80,5)},
    {p:75, prize:R(1500,15,120,8)},
    {p:100,prize:R(3000,25,200,15)},
  ],
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const obj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:null;
const ID_RE=/^(w|a|m|p|b|u)-[a-z0-9-]{1,30}$/;

/* 9 ERAS (dono, 14/11): com as eras 7-8 ligadas (Sys.stats.setEra9), o Códex passa a 9 eras: armas, armaduras e melhores inimigos do Submundo e do Celestial.
   Desligadas: 7, como antes. Os ids não mudam (w-<era>-<tier>, a-<era>-<espaço>, b-<era>-<tipo>); a casa nova entra na mesma ordem por era. */
const era9On=()=>{ try{ const T=SYS().stats; return !!(T&&T.DATA&&T.DATA.era9&&T.DATA.era9.on===true); }catch(e){ return false; } };
const erasMax=()=>era9On()?9:DATA.eras;
const bestEras=()=>era9On()?9:DATA.bestEras;
function eraCount(){ let n=erasMax(); try{ if(typeof ERAS!=='undefined'&&Array.isArray(ERAS)) n=Math.min(erasMax(),ERAS.length); }catch(e){} return n; }   // eslint-disable-line no-undef
function mountIds(){ let L=null; try{ const M=SYS().mount; if(M&&M.DATA&&Array.isArray(M.DATA.mounts)) L=M.DATA.mounts.map(m=>m&&m.id); }catch(e){} if(!L) L=DATA.mountFall.slice();
  return L.filter(id=>DATA.mountArt.includes(id)); }
/* pets novos que já dá para conseguir (ids da tela, na ordem do DATA.petNew) */
function newPets(){ try{ const P=SYS().pet, N=SYS().newDrops; if(!P||!P.DATA||!N||!N.DATA||N.DATA.on!==true) return [];
  return DATA.petNew.filter(([,id])=>{ const d=(P.DATA.pets||[]).find(x=>x&&x.id===id); return !!d&&(P.DATA.newPets===true||(P.DATA.newReady&&P.DATA.newReady[id]===true)); }).map(([c])=>c); }catch(e){ return []; } }
/* catálogo na MESMA ordem da tela: [{id, cat}] (cat = arm|eq|mnt|pet|bes|aur) */
function catalog(){ const A=[], E=eraCount();
  for(let e=0;e<E;e++) for(let t=0;t<3;t++) A.push({id:'w-'+e+'-'+t,cat:'arm'});
  for(let e=0;e<E;e++) for(const s of DATA.slots) A.push({id:'a-'+e+'-'+s[0],cat:'eq'});
  for(const m of mountIds()) A.push({id:'m-'+m,cat:'mnt'});
  for(const p of DATA.petOrder.concat(newPets())) for(let s=0;s<3;s++) A.push({id:'p-'+p+'-'+s,cat:'pet'});
  for(let e=0;e<bestEras();e++) for(const k of DATA.bestKinds) A.push({id:'b-'+e+'-'+k,cat:'bes'});
  for(const n of DATA.auras) A.push({id:'u-'+n,cat:'aur'});
  return A; }

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.codex.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.codex; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.codex={}; o.v=1;
  const sn=obj(o.seen)||(Array.isArray(o.seen)?Object.fromEntries(o.seen.map(k=>[k,1])):{}); o.seen={}; let n=0;
  for(const k in sn) if(sn[k]&&ID_RE.test(k)&&n<1000){ o.seen[k]=1; n++; }
  const ps=DATA.marks.map(m=>m.p), cl=Array.isArray(o.claimed)?o.claimed:[]; o.claimed=ps.filter(p=>cl.includes(p));
  return o; }

/* o que o save mostra AGORA (sem gravar) */
function scan(S){ const out=new Set(), E=eraCount(), sys=obj(S&&S.sys)||{};
  try{ for(const it of Array.isArray(S.inv)?S.inv:[]){ if(!it||typeof it!=='object') continue; const e=int0(it.e), r=int0(it.r); if(e>=E) continue;
    if(it.slot==='weapon') out.add('w-'+e+'-'+(r<=1?0:r<=3?1:2));
    else { const s=DATA.slots.find(x=>x[1]===it.slot); if(s) out.add('a-'+e+'-'+s[0]); } } }catch(e){}
  try{ const ow=obj(obj(sys.pet)&&sys.pet.owned)||{}; for(const id in ow){ const c=DATA.pets[id]; if(!c) continue; const st=Math.min(2,int0(ow[id]&&ow[id].stg));
    for(let s=0;s<=st;s++) out.add('p-'+c+'-'+s); } }catch(e){}
  try{ const ow=obj(obj(sys.mount)&&sys.mount.owned)||{}; for(const id in ow) if(DATA.mountArt.includes(id)) out.add('m-'+id); }catch(e){}
  try{ const lv=obj(obj(sys.forge)&&sys.forge.lv), w=lv?int0(lv.weapon):0; for(const n of DATA.auras) if(w>=n) out.add('u-'+n); }catch(e){}
  try{ const mark=(e,boss)=>{ if(e<0||e>=bestEras()) return; out.add('b-'+e+'-e0'); out.add('b-'+e+'-e1'); if(boss) out.add('b-'+e+'-boss'); };
    const P=SYS().phases, ph=obj(sys.phases), best=ph&&obj(ph.best);
    if(P&&P.DATA&&P.DATA.on===true&&best){ const per=int0(P.DATA.perEra)||100, req=Array.isArray(P.DATA.required)?P.DATA.required:[];
      for(const k in best){ const e=parseInt(k,10), a=Array.isArray(best[k])?best[k]:[]; if(!(e>=0)||!a.some(x=>int0(x)>0)) continue;
        const need=Math.max(1,int0(req[e])||1); let clr=true; for(let d=0;d<need;d++) if(int0(a[d])<per) clr=false; mark(e,clr); } }
    const per=DATA.stagesPerEra, bs=int0(S.best), passed=Math.max(bs>0?Math.floor((bs-1)/per):0,int0(S.eraMax));
    for(let e=0;e<passed;e++) mark(e,true);
    if(bs>1||int0(S.kills)>0||passed>0) mark(passed,false); }catch(e){}
  return out; }

/* grava no "visto" tudo o que o save mostra agora. Devolve quantos ids NOVOS entraram. */
function sync(S,host){ if(!S||typeof S!=='object') return 0; const o=ensure(S); let n=0; for(const id of scan(S)) if(!o.seen[id]){ o.seen[id]=1; n++; } return n; }
/* ids do catálogo que o jogador já teve (visto permanente ∪ save atual), na ordem do catálogo */
function owned(S,host){ if(!S||typeof S!=='object') return []; sync(S,host); const sn=S.sys.codex.seen; return catalog().map(c=>c.id).filter(id=>sn[id]); }
function progress(S,host){ const total=catalog().length, have=owned(S,host).length; return {have,total,pct:total?Math.floor(have*100/total):0}; }

const fmt=n=>String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
const unitOf=host=>{ const g=num(host&&host.goldUnit&&host.goldUnit(),1); return g>0?g:1; };
function prizeTxt(pz,host){ const a=[]; if(pz.goldk) a.push(fmt(pz.goldk*unitOf(host))+' de ouro'); if(pz.forge) a.push(pz.forge+' pedras de forja');
  if(pz.food) a.push(pz.food+' de ração'); if(pz.essence) a.push(pz.essence+' de essência'); return a.join(', '); }
/* {on, claimed:[p], marks:[{p, txt, prize, ready, done}], next (1º marco não pego ou null), pct} */
function rewards(S,host){ const pr=progress(S,host), o=ensure(S);
  const marks=DATA.marks.map(m=>({p:m.p,txt:prizeTxt(m.prize,host),prize:Object.assign({},m.prize),done:o.claimed.includes(m.p),ready:!o.claimed.includes(m.p)&&pr.pct>=m.p}));
  return {on:ON(),claimed:o.claimed.slice(),marks,next:marks.find(m=>!m.done)||null,pct:pr.pct,have:pr.have,total:pr.total}; }
/* pega o prêmio do marco p. {ok, reason: off|id|pct|done, p, got, txt}. Marcos podem ser pegos fora de ordem (cada um uma vez). */
function claim(S,host,p){ if(!ON()) return {ok:false,reason:'off'}; const m=DATA.marks.find(x=>x.p===p); if(!m) return {ok:false,reason:'id'};
  const o=ensure(S); if(o.claimed.includes(p)) return {ok:false,reason:'done',p}; const pr=progress(S,host); if(pr.pct<p) return {ok:false,reason:'pct',p,pct:pr.pct};
  o.claimed.push(p); o.claimed.sort((a,b)=>a-b); const L=SYS().loot, bundle=Object.assign({origin:'codex'},m.prize); let got;
  if(L&&typeof L.grantBundle==='function') got=L.grantBundle(S,host,bundle);
  else { got={}; const g=Math.round(m.prize.goldk*unitOf(host)); if(g&&host&&host.addGold){ host.addGold(g); got.gold=g; }
    const F=SYS().forge; if(m.prize.forge&&F&&typeof F.addStones==='function'){ F.addStones(S,m.prize.forge,host); got.forge=m.prize.forge; } }
  return {ok:true,p,got,txt:'Prêmio de '+p+'%: '+prizeTxt(m.prize,host)}; }

/* o que a tela lê em window.P_CODEX. S e host podem ser o objeto ou uma função que devolve o atual (o save troca ao carregar/reiniciar). */
function screenProvider(getS,getHost){ const s=()=>typeof getS==='function'?getS():getS, h=()=>typeof getHost==='function'?getHost():getHost;
  return {
    get owned(){ return ON(); }, get rewards(){ return ON(); },
    readOwned(){ const S=s(); return S?owned(S,h()):[]; },
    readRewards(){ const S=s(); if(!S) return null; const r=rewards(S,h());
      return {claimed:r.claimed,marks:r.marks.map(m=>({p:m.p,txt:m.txt})),claim(p){ const c=claim(s(),h(),p); return {ok:c.ok,txt:c.ok?c.txt:'',reason:c.reason}; }}; },
  }; }

const API={newPets,era9On,DATA,ensure,catalog,scan,sync,owned,progress,rewards,claim,screenProvider};
root.Sys=root.Sys||{}; root.Sys.codex=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
