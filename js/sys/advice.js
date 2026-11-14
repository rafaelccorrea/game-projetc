/* Eonbound — Sys.advice: DICAS DE FC para a dificuldade nova (pedido do PO 13/11; números combinados com a Sistemas, docs/PROPOSTA_DIFICULDADE.md).
   Sys.advice(S, host, {need}) → "faltam X de FC" (quando o jogo passar a FC pedida da fase/chefe em `need`) e as 3 MELHORES ações, cada uma com o
   ganho e a tela de destino. SÓ LÓGICA (a tela é do Engenheiro). CHAVE DESLIGADA: DATA.on=false → {on:false, actions:[]}.

   NENHUM NÚMERO PRÓPRIO: cada ação é simulada com a função do próprio módulo (numa cópia do save ou trocando o item na conta) e o ganho é
   Sys.fc.compute(depois) − Sys.fc.compute(agora), a MESMA FC do HUD (real; para exibir use gainText/missingText, já na escala de Sys.fc.view).
   `need` vem SEMPRE de quem chama (hoje REC_FC por era; amanhã a tabela por fase da proposta). Sem `need`: só as ações, sem "faltam".

   Ações (Sistemas 13/11):
     equip   — equipar o melhor item da MOCHILA no espaço ("raridade +1" da proposta = trocar por item melhor que já tem; não existe subir o r)
     forge   — Forja +1 no espaço (Sys.forge.advice)
     fuse    — Fundir (+1 estrela de qualidade) o item equipado (Sys.stats.canFuse; precisa de 3 iguais)
     pet     — evoluir o estágio do pet (Sys.pet.canEvolve), alimentar +1 nível, equipar o melhor pet
     mount   — +1 estrela na montaria equipada (fragmentos; Sys.mount.DATA.starCost)
     title   — destacar o melhor título já ganho (Sys.titles.advice)
     level   — subir +1 nível ("falta X% da barra"): NÃO é ação imediata, entra sempre por último
   FORA (Sistemas): práticas e torre (dão recurso, não FC direta), comprar qualquer coisa, invocar (não há sorteio pago).
   Ordem: primeiro o que dá para fazer AGORA (recurso suficiente), depois o maior ganho; desempate pelo menor custo; 3 itens; `level` por último.
   Telas (tab): 'gear', 'forge', 'pet', 'mount', 'titles', 'hero' — o Engenheiro liga cada uma à tela do jogo (host.goTab). */
(function(root){
'use strict';

const DATA={
  on:false,          // CHAVE: liga quando o Engenheiro mostrar na tela e o dono aprovar
  top:3,             // quantas ações devolver
  minGain:1,         // ganho mínimo (FC real) para entrar na lista
  kinds:['equip','forge','fuse','pet','mount','title','level'],
  tabs:{equip:'gear',forge:'forge',fuse:'gear',pet:'pet',mount:'mount',title:'titles',level:'hero'},
  slotName:{weapon:'arma',helmet:'elmo',armor:'armadura',gloves:'luvas',boots:'botas',ring:'anel',amulet:'amuleto',wing:'asa'},
};

const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(Number(v),0)));
const clone=o=>{ try{ return typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o)); }catch(e){ return JSON.parse(JSON.stringify(o)); } };
const F=()=>SYS().fc;
const fcOf=(S,host,opts)=>{ try{ return num(F().compute(S,host,opts),0); }catch(e){ return 0; } };
const view=n=>{ const f=F(); try{ return f&&f.viewText?f.viewText(n):String(Math.round(n)); }catch(e){ return String(Math.round(n)); } };
/* regra do dono: NENHUM emoji nem estrela desenhada em texto do jogo (rótulos de outros módulos passam por aqui também). icon = id curto que a tela troca por imagem */
const noEmoji=t=>String(t==null?'':t).replace(/[★☆]/g,' estrelas').replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu,'').replace(/\s{2,}/g,' ').trim();
const costNum=c=>{ const m=String(c||'').replace(/\./g,'').match(/\d+/); return m?Number(m[0]):0; };

/* ganho de uma mudança feita numa CÓPIA do save (o host lê os itens do jogo, que a cópia não altera) */
function simGain(S,host,now,mut){ let S2; try{ S2=clone(S); }catch(e){ return 0; } let ok; try{ ok=mut(S2); }catch(e){ ok=false; } return ok===false?0:fcOf(S2,host)-now; }

/* ---------------- cada tipo de ação ---------------- */
function equip(S,host,now,out){ const T=SYS().stats; if(!T||!Array.isArray(S.inv)) return;
  const L=SYS().level, pl=L&&L.level?L.level(S):(host&&host.level?host.level():null), eq=S.eq||{}, best={};
  for(const it of S.inv){ if(!it||!it.slot||eq[it.slot]===it.id) continue; if(typeof T.canEquip==='function'&&!T.canEquip(it,pl)) continue;
    const g=fcOf(S,host,{item:it})-now; if(!best[it.slot]||g>best[it.slot].g) best[it.slot]={g,it}; }
  for(const s in best){ const b=best[s]; out.push({id:'equip.'+s,kind:'equip',icon:'equip',label:`Equipar ${b.it.name||'o melhor da mochila'} (${DATA.slotName[s]||s})`,gain:b.g,ready:true,cost:'grátis',costN:0,itemId:b.it.id}); } }

function fromModuleAdvice(S,host,out){ const f=F(); if(!f||typeof f.advice!=='function') return; let list=[]; try{ list=f.advice(S,host,99); }catch(e){ list=[]; }
  for(const a of list){ const id=String(a.id||''); let kind=null;
    if(/^forge\./.test(id)) kind='forge'; else if(id==='pet.feed'||id==='pet.equip') kind='pet'; else if(id==='titles.feature') kind='title';
    if(!kind) continue;   // práticas, torre, baú, instâncias e títulos ainda não ganhos ficam de fora
    out.push({id,kind,icon:kind,label:noEmoji(a.label),gain:a.gain,ready:!!a.ready,cost:noEmoji(a.cost||''),costN:costNum(a.cost)}); } }

function petEvolve(S,host,now,out){ const P=SYS().pet; if(!P||typeof P.canEvolve!=='function') return; let o; try{ o=P.ensure(S); }catch(e){ return; } const id=o&&o.eq; if(!id) return;
  const c=P.canEvolve(S,id); if(!c||c.reason==='off'||c.reason==='max'||c.reason==='pet') return;
  const g=simGain(S,host,now,S2=>{ const r=P.evolve(S2,id); if(r&&r.ok) return true; P.ensure(S2).owned[id].stg=c.stage+1; return true; });
  if(g>=DATA.minGain){ out.push({id:'pet.evolve',kind:'pet',icon:'pet',label:c.ok?`Evoluir o pet (estágio ${c.stage+2})`:`Evoluir o pet: chegue ao Nv ${c.need} do pet`,gain:g,ready:!!c.ok,cost:c.ok?'grátis':'',costN:0}); return; }
  /* tela 17b (Sistemas 13/11): evoluir NÃO dá poder na hora, só libera o teto de nível. No teto do estágio: a dica aparece SEM número */
  const x=o.owned[id], cap=P.DATA.v17&&P.DATA.v17.stageCap?P.DATA.v17.stageCap[c.stage]:null;
  if(c.ok&&cap!=null&&int0(x&&x.lvl)>=cap) out.push({id:'pet.evolve',kind:'pet',icon:'pet',label:'Evoluir o pet para liberar mais níveis',gain:0,ready:true,cost:'grátis',costN:0,noGain:true}); }

function mountStar(S,host,now,out){ const M=SYS().mount; if(!M||typeof M.info!=='function') return; let o; try{ o=M.ensure(S); }catch(e){ return; } const id=o&&o.eq; if(!id) return;
  const inf=M.info(S,host,id); if(!inf||!inf.owned||inf.stars>=M.DATA.maxStars) return;
  const g=simGain(S,host,now,S2=>{ const x=M.ensure(S2).owned[id]; if(!x) return false; x.stars++; return true; });
  const miss=Math.max(0,inf.need-inf.frags);
  out.push({id:'mount.star',kind:'mount',icon:'mount',label:`Montaria ${inf.name} para ${inf.stars+1} estrelas`+(miss?` (faltam ${miss} fragmentos)`:''),gain:g,ready:miss===0,cost:`${inf.need} fragmentos`,costN:inf.need}); }

function fuse(S,host,now,out){ const T=SYS().stats; if(!T||typeof T.canFuse!=='function'||!Array.isArray(S.inv)) return; const eq=S.eq||{};
  for(const s in eq){ const cur=S.inv.find(x=>x&&x.id===eq[s]); if(!cur) continue;
    const same=S.inv.filter(x=>x&&x.id!==cur.id&&x.slot===cur.slot&&int0(x.e)===int0(cur.e)&&int0(x.r)===int0(cur.r));
    for(let i=0;i<same.length;i++) for(let j=i+1;j<same.length;j++){ const c=T.canFuse(S,host,[cur,same[i],same[j]]); if(!c||c.reason==='different'||c.reason==='count') continue;
      if(c.reason==='off'||c.reason==='max') return; const res=c.result||null; if(!res) continue;
      const g=fcOf(S,host,{item:Object.assign({},res,{id:cur.id})})-now;
      out.push({id:'fuse.'+s,kind:'fuse',icon:'fuse',label:`Fundir ${DATA.slotName[s]||s} para ${int0(c.toStars)} estrelas`,gain:g,ready:!!c.ok,cost:c.gold?`${c.gold} ouro`:'',costN:int0(c.gold)}); i=same.length; break; } } }

function levelUp(S,host,now,out){ const L=SYS().level; if(!L||typeof L.progress!=='function') return; const p=L.progress(S); if(!p||p.max) return;
  const g=simGain(S,host,now,S2=>{ const o=L.ensure(S2); o.lvl=int0(o.lvl)+1; o.xp=0; return true; });
  const left=Math.max(0,Math.min(100,Math.ceil((1-num(p.frac,0))*100)));
  out.push({id:'level.up',kind:'level',icon:'level',label:`Subir para o Nv ${p.lvl+1} (falta ${left}% da barra)`,gain:g,ready:false,cost:'',costN:0,last:true}); }

/* ---------------- principal ---------------- */
function all(S,host){ const now=fcOf(S,host), out=[];
  if(!S||typeof S!=='object'||!F()) return {now,list:out};
  const on=k=>DATA.kinds.includes(k);
  if(on('equip')) equip(S,host,now,out);
  fromModuleAdvice(S,host,out);
  if(on('pet')) petEvolve(S,host,now,out);
  if(on('mount')) mountStar(S,host,now,out);
  if(on('fuse')) fuse(S,host,now,out);
  if(on('level')) levelUp(S,host,now,out);
  const list=out.filter(a=>on(a.kind)&&(a.noGain||a.gain>=DATA.minGain)).map(a=>Object.assign(a,{gain:Math.round(a.gain),gainText:a.noGain?'':'+'+view(a.gain)+' FC',tab:DATA.tabs[a.kind]||a.kind}));
  list.sort((a,b)=>(!!a.last-!!b.last)||(b.ready-a.ready)||(b.gain-a.gain)||(a.costN-b.costN));
  return {now,list:gate(S,host,list)}; }
/* destino trancado pelo nível (PO/Engenheiro 14/11): a dica de tela fechada vai para o fim, no máximo UMA, com lockLevel;
   o que o jogador pode fazer agora vem antes. Sem nenhuma aberta: 'jogue as fases anteriores para ganhar peças'.
   host.unlocked(tab) decide se existir; senão, Sys.level.DATA.unlock pelo nível. */
const TAB_FEATURE={forge:'forge',pet:'pets',mount:'mount',titles:null,gear:null,hero:null};
function lockOf(S,host,tab){ if(host&&typeof host.unlocked==='function'){ try{ const r=host.unlocked(tab); if(r===true) return 0; if(r===false) return -1; if(typeof r==='number') return r; }catch(e){} }
  const f=TAB_FEATURE[tab]; if(!f) return 0; const L=SYS().level; if(!L||!L.DATA||!L.DATA.unlock) return 0; const need=int0(L.DATA.unlock[f]); let lv=0; try{ lv=int0(L.level(S)); }catch(e){} return lv>=need?0:need; }
function gate(S,host,list){ const open=[], shut=[]; for(const a of list){ const lk=lockOf(S,host,a.tab); if(lk===0) open.push(a); else shut.push(Object.assign(a,{locked:true,lockLevel:lk>0?lk:null,last:true})); }
  const out=open.slice(); if(!open.length) out.push({id:'farm',kind:'level',tab:'battle',label:'Jogue as fases anteriores para ganhar peças',gain:0,gainText:'',ready:true,noGain:true,last:true,costN:0});
  if(shut.length) out.push(shut[0]); return out; }

function advise(S,host,opts){ opts=opts||{};
  if(DATA.on!==true) return {on:false,fc:0,need:null,missing:null,ok:null,text:'',actions:[]};
  const {now,list}=all(S,host), need=num(Number(opts.need),NaN), has=isFinite(need)&&need>0;
  const missing=has?Math.max(0,Math.ceil(need-now)):null, top=Math.max(0,int0(num(opts.limit,DATA.top)));
  return {on:true,fc:now,need:has?need:null,missing,ok:has?missing===0:null,
    text:!has?'':missing>0?`Faltam ${view(missing)} de FC`:'FC suficiente',
    actions:list.slice(0,top).map(({costN,last,noGain,...a})=>a)}; }

const API=Object.assign(advise,{DATA,advise,all});
root.Sys=root.Sys||{}; root.Sys.advice=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
