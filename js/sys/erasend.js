/* Eonbound — Sys.erasEnd: FIM DAS 9 ERAS e PÓS-ERAS (tela aprovada: docs/proto/v2/FimDasEras.html; números: docs/balance.json blocos "fimDasEras"
   e "posEras"; proposta: docs/PROPOSTA_POS_ERAS.md). REGRA DO DONO: a fase 90 é o FIM DAS 9 ERAS, nunca o fim do jogo; depois dela vêm as fases sem fim.
   O que este módulo faz (tudo DESLIGADO com DATA.on=false: nenhuma função escreve no save, nenhum título entra na tabela):
   1) PRÊMIOS DO FIM DAS 9 ERAS, uma vez por save (S.sys.erasEnd.final): título "Lenda das 9 Eras" (Sys.titles), moldura "Nove Eras" e aura "Luz das Eras"
      (só visuais, guardadas aqui), 300 diamantes UMA vez e a carta no correio (os diamantes vão como anexo da carta; com o correio desligado, direto).
   2) MARCOS a cada 10 fases a partir da 100: título "Marco N" (+1% ATQ e +1% VIDA efetivos até o 150; depois só o nome), 30 diamantes, moldura na 100
      ("Além das Eras") e na 150 ("Sem Fim"), pedras astrais e carta. Uma vez por marco (S.sys.erasEnd.marks).
   3) FORJA ASTRAL +21 a +25 por espaço, continuação da Forja +16..+20 (Sys.forge.DATA.f20). Cada nível só abre ao vencer o marco (100 → +21 ... 140 → +25).
      Pedra astral só nas fases sem fim. A falha nunca tira nível (garantia igual à da Forja). Chance, custo e queda de pedras: PROPOSTA (DATA.astral._proposta).
   Nada sorteado à venda, nada pago: as pedras não têm loja. Estado em S.sys.erasEnd. Sem DOM. API para o engenheiro: docs/SISTEMA_MATRIZ.md. */
(function(root){
'use strict';
const DATA={
  on:false, label:'Fim das 9 eras', finalStage:90,
  mailDays:3650,   // a carta com diamantes não vence (o correio apaga anexo não resgatado em 30 dias; prêmio único não pode se perder)
  final:{
    title:{id:'legend9',name:'Lenda das 9 Eras',r:5,eff:{atkPct:3,hpPct:3},text:'Vencer o Juiz Celestial (fase 90)'},   // eff = bônus efetivo (já com o bonusMult do Sys.titles)
    frame:{id:'nine_eras',name:'Nove Eras',kind:'frame'},
    aura:{id:'light_of_eras',name:'Luz das Eras',kind:'aura'},
    gems:300,
    mail:{ref:'fim9eras-v1',subject:'As 9 eras concluídas: a jornada continua',body:'Você venceu o Juiz Celestial. A jornada continua nas fases sem fim.'},
  },
  marks:{
    from:100, every:10, gems:30, bonusUntil:150, eff:{atkPct:1,hpPct:1},
    frames:{100:{id:'mark100',name:'Além das Eras',kind:'frame'},150:{id:'mark150',name:'Sem Fim',kind:'frame'}},
    mail:{subject:'Marco da fase {fase}',body:'Você venceu a fase {fase}. Próximo marco: fase {prox}.'},
    // PROPOSTA (Sistemas): raridade do título de marco (Mítico até a 140, Lendário da 150 em diante) e ícone único (Arte: assets/icons/titles/mark.png)
    r:3, rFrom150:4, icon:'assets/icons/titles/mark.png',
  },
  astral:{
    levels:[21,22,23,24,25], bonus:[1.65,1.77,1.89,2.01,2.13], unlockStage:[100,110,120,130,140], stone:'pedra astral', base:20,
    // PROPOSTA (não está no balance.json): chance segue a descida da Forja +16..+20 (5,5,4,4,3); custo por tentativa em pedras astrais; garantia +5 por falha
    chance:[3,3,3,2,2], stones:[4,4,5,5,6], pityPerFail:5,
    perStage:3,      // pedras por fase sem fim vencida pela 1ª vez (s > 90)
    perMark:30,      // pedras a mais no prêmio de cada marco
    _proposta:'chance/custo/queda escolhidos pela Sistemas: ~60 pedras a cada 10 fases ≈ 3 níveis de espaço; o nível nunca anda na frente do marco',
  },
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const SYS=()=>root.Sys||{};
const on=()=>DATA.on===true;
const OFF={ok:false,reason:'desligado'};
const SLOTS=['weapon','armor','hat','gloves','boots','necklace','wing'];
const fill=(s,o)=>String(s).replace(/\{(\w+)\}/g,(m,k)=>o[k]!=null?String(o[k]):m);
const isMark=s=>s>=DATA.marks.from&&(s-DATA.marks.from)%DATA.marks.every===0;
const nextMark=s=>s<DATA.marks.from?DATA.marks.from:DATA.marks.from+(Math.floor((s-DATA.marks.from)/DATA.marks.every)+1)*DATA.marks.every;
const fmtP=v=>(Math.round(v*100)/100).toString().replace('.',',');

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.erasEnd.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.erasEnd; if(!o||typeof o!=='object') o=S.sys.erasEnd={};
  o.v=1; o.final=int0(o.final);                                   // momento da entrega (0 = ainda não)
  o.marks=Array.isArray(o.marks)?[...new Set(o.marks.map(int0).filter(isMark))].sort((a,b)=>a-b):[];
  o.top=Math.max(DATA.finalStage,int0(o.top));                    // maior fase sem fim já paga em pedras astrais
  o.stones=int0(o.stones); o.earned=int0(o.earned); o.spent=int0(o.spent);
  const c=o.cos&&typeof o.cos==='object'?o.cos:{}, ow=Array.isArray(c.owned)?c.owned.filter(id=>!!COS[id]):[], eq=c.eq&&typeof c.eq==='object'?c.eq:{};
  o.cos={owned:[...new Set(ow)],eq:{}}; for(const k of ['frame','aura']) if(typeof eq[k]==='string'&&o.cos.owned.includes(eq[k])&&COS[eq[k]].kind===k) o.cos.eq[k]=eq[k];
  const lv=o.lv&&typeof o.lv==='object'?o.lv:{}, pity=o.pity&&typeof o.pity==='object'?o.pity:{}; o.lv={}; o.pity={};
  for(const s of SLOTS){ o.lv[s]=clamp(int0(lv[s]),0,DATA.astral.levels.length); o.pity[s]=Math.max(0,num(pity[s],0)); }
  return o;
}
const COS={}; [DATA.final.frame,DATA.final.aura,...Object.values(DATA.marks.frames)].forEach(c=>{ COS[c.id]=c; });

/* ---------------- títulos (Sys.titles.addTitle/grant) ---------------- */
const T=()=>SYS().titles;
const tbl=eff=>{ const m=num(T()&&T().DATA&&T().DATA.bonusMult,0.5)||0.5, b={}; for(const k in eff) b[k]=eff[k]/m; return b; };   // efetivo → valor da tabela
const markId=s=>'mark'+s;
function markDef(s){ const M=DATA.marks, withB=s<=M.bonusUntil;
  return {id:markId(s),name:'Marco '+s,r:s>=150?M.rFrom150:M.r,icon:M.icon,text:'Vencer a fase '+s,bonus:withB?tbl(M.eff):{},cosmetic:!withB}; }
function finalDef(){ const t=DATA.final.title; return {id:t.id,name:t.name,r:t.r,text:t.text,bonus:tbl(t.eff)}; }
/* registra os títulos na tabela do Sys.titles (só ligado): o final, os marcos com bônus (100..150) e os marcos já ganhos depois da 150 */
function register(S){ const Ti=T(); if(!on()||!Ti||typeof Ti.addTitle!=='function') return 0; let n=0;
  if(Ti.addTitle(finalDef())) n++;
  for(let s=DATA.marks.from;s<=DATA.marks.bonusUntil;s+=DATA.marks.every) if(Ti.addTitle(markDef(s))) n++;
  if(S){ for(const s of ensure(S).marks) if(Ti.addTitle(markDef(s))) n++; }
  return n; }
function unregister(){ const Ti=T(); if(!Ti||typeof Ti.removeTitle!=='function') return 0; let n=0;
  for(const t of (Ti.DATA.titles||[]).slice()) if(t.added&&(t.id===DATA.final.title.id||/^mark\d+$/.test(t.id))&&Ti.removeTitle(t.id)) n++; return n; }
/* o save guarda aqui o que foi ganho; se o Sys.titles perdeu (ex.: chave desligada num boot), devolve sem pagar de novo */
function resync(S,host){ if(!on()) return; const o=ensure(S), Ti=T(); if(!Ti||typeof Ti.grant!=='function') return; register(S);
  if(o.final) Ti.grant(S,DATA.final.title.id,host); for(const s of o.marks) Ti.grant(S,markId(s),host); }
function setOn(v){ DATA.on=!!v; if(DATA.on) register(null); else unregister(); return DATA.on; }

/* ---------------- entrega ---------------- */
function giveGems(S,host,n,mail){ const Mm=SYS().mail;
  if(Mm&&Mm.DATA&&Mm.DATA.enabled===true&&typeof Mm.sendOnce==='function'){
    const sent=(Mm.ensure(S).sent||[]); if(sent.includes(mail.ref)) return {via:'mail',mailId:0};   // carta já enviada antes: nunca paga duas vezes
    const id=Mm.sendOnce(S,host,Object.assign({type:'reward',source:'sistema',att:{gems:n},days:DATA.mailDays},mail)); if(id) return {via:'mail',mailId:id}; }
  const L=SYS().loot; if(L&&typeof L.grantBundle==='function') L.grantBundle(S,host,{gems:n,origin:'erasEnd'}); else if(host&&typeof host.addGems==='function') host.addGems(n);
  return {via:'direct',mailId:0}; }
function own(o,c){ if(c&&!o.cos.owned.includes(c.id)) o.cos.owned.push(c.id); }
const prizeTitle=(def,eff)=>({title:'Título: '+def.name,text:Object.keys(eff).length?`+${fmtP(eff.atkPct||0)}% ATQ e +${fmtP(eff.hpPct||0)}% VIDA (o dobro em destaque)`:'Só o nome (sem bônus)'});

/* VENCEU A FASE 90 (o Juiz Celestial, Senhor da 9ª era). Idempotente: a 2ª chamada não paga nada (given:false) e devolve os mesmos textos.
   → {ok, given, prizes:[{title,text}], milestone:{stage, rewards:[texto]}, gemsVia} — prizes e milestone no formato do Panels.open('end9',{prizes,milestone}). */
function onFinal(S,host){ if(!on()) return OFF; const o=ensure(S), F=DATA.final; let given=false, via='';
  if(!o.final){ o.final=Math.max(1,nowOf(host)); given=true; register(S);
    const Ti=T(); if(Ti&&typeof Ti.grant==='function') Ti.grant(S,F.title.id,host);
    own(o,F.frame); own(o,F.aura);
    via=giveGems(S,host,F.gems,{ref:F.mail.ref,title:F.mail.subject,body:F.mail.body}).via;
    if(host&&typeof host.onChange==='function') host.onChange(); }
  return {ok:true,given,prizes:finalPrizes(),milestone:nextMilestone(S),gemsVia:via}; }
function finalPrizes(){ const F=DATA.final; return [prizeTitle(F.title,F.title.eff),
  {title:'Moldura de perfil: '+F.frame.name,text:'Só visual: um anel com as cores das 9 eras'},
  {title:'Aura do herói: '+F.aura.name,text:'Só visual: contorno dourado e faíscas no herói'},
  {title:F.gems+' diamantes',text:'Uma vez, pelo fim das 9 eras'}]; }

/* o que o PRÓXIMO marco dá (para a tela do fim das 9 eras e a tela de vitória). stage = maior fase vencida (sem ela: a do save) */
function milestoneRewards(s){ const M=DATA.marks, out=[], d=markDef(s), i=DATA.astral.unlockStage.indexOf(s);
  out.push(d.cosmetic?`Título Marco ${s}`:`Título Marco ${s} (+${fmtP(M.eff.atkPct)}% ATQ e VIDA)`); out.push(`${M.gems} diamantes`);
  out.push(`${DATA.astral.perMark} pedras astrais`); if(i>=0) out.push(`Forja Astral +${DATA.astral.levels[i]} liberada`);
  if(M.frames[s]) out.push(`Moldura ${M.frames[s].name}`); return out; }
function nextMilestone(S,stage){ const won=stage!=null?int0(stage):beaten(S); const s=nextMark(Math.max(won,DATA.finalStage)); return {stage:s,rewards:milestoneRewards(s)}; }
/* fases vencidas pelo save (a mesma conta do Sys.titles: S.best − 1) */
function beaten(S){ return Math.max(0,int0(S&&S.best)-1); }

function giveMark(S,host,s){ const o=ensure(S), M=DATA.marks; if(!isMark(s)||o.marks.includes(s)) return null;
  o.marks.push(s); o.marks.sort((a,b)=>a-b); const d=markDef(s), Ti=T(); if(Ti&&typeof Ti.addTitle==='function'){ Ti.addTitle(d); Ti.grant(S,d.id,host); }
  if(M.frames[s]) own(o,M.frames[s]); addAstral(S,DATA.astral.perMark);
  const via=giveGems(S,host,M.gems,{ref:'marco-'+s,title:fill(M.mail.subject,{fase:s}),body:fill(M.mail.body,{fase:s,prox:s+M.every})}).via;
  return {stage:s,title:d.name,gems:M.gems,stones:DATA.astral.perMark,frame:M.frames[s]?M.frames[s].id:null,astralUnlock:DATA.astral.unlockStage.includes(s)?DATA.astral.levels[DATA.astral.unlockStage.indexOf(s)]:0,gemsVia:via}; }

/* VENCEU UMA FASE (toda vitória de fase; o módulo ignora as fases < 90). Na 90 entrega o fim das 9 eras; acima da 90 paga pedras astrais na 1ª vez
   de cada fase e, nas fases 100, 110, 120..., o prêmio do marco. → {ok, final?, mark?, stones, milestone} */
function onStageClear(S,host,stage){ if(!on()) return OFF; const s=int0(stage), o=ensure(S), out={ok:true,final:null,mark:null,stones:0,milestone:null};
  if(s<DATA.finalStage) return out;
  if(s>=DATA.finalStage&&!o.final) out.final=onFinal(S,host);
  if(s>o.top){ const n=(s-o.top)*DATA.astral.perStage; o.top=s; out.stones=addAstral(S,n); }   // pulou fases (não deveria): paga as que faltaram, sem repetir
  if(isMark(s)){ const m=giveMark(S,host,s); if(m){ out.mark=m; out.stones+=m.stones; } }
  out.milestone=nextMilestone(S,s); if(host&&typeof host.onChange==='function'&&(out.stones||out.mark)) host.onChange(); return out; }

/* BOOT / SAVE ANTIGO: quem já passou da 90 quando a chave ligou recebe o fim das 9 eras e os marcos já vencidos (uma vez; sem pedras das fases
   comuns já passadas). Também devolve ao Sys.titles os títulos guardados aqui. Chamar ao carregar o save, com a chave ligada. */
function sync(S,host){ if(!on()) return OFF; const o=ensure(S), won=beaten(S), out={ok:true,final:null,marks:[]};
  if(won>=DATA.finalStage&&!o.final) out.final=onFinal(S,host);
  for(let s=DATA.marks.from;s<=won;s+=DATA.marks.every){ const m=giveMark(S,host,s); if(m) out.marks.push(m); }
  if(won>o.top) o.top=won; resync(S,host); return out; }

/* ---------------- visuais (moldura e aura): só visual, nada de atributo ---------------- */
function cosmetics(S){ const o=ensure(S); return o.cos.owned.map(id=>({...COS[id],equipped:o.cos.eq[COS[id].kind]===id})); }
function equip(S,kind,id){ if(!on()) return false; if(kind!=='frame'&&kind!=='aura') return false; const o=ensure(S);
  if(id==null){ delete o.cos.eq[kind]; return true; } if(!o.cos.owned.includes(id)||COS[id].kind!==kind) return false; o.cos.eq[kind]=id; return true; }
const equipped=(S,kind)=>{ if(!on()||!S||!S.sys||!S.sys.erasEnd) return null; const id=ensure(S).cos.eq[kind]; return id?{...COS[id]}:null; };

/* ---------------- Forja Astral ---------------- */
function addAstral(S,n){ const k=int0(n); if(!k) return 0; const o=ensure(S); o.stones+=k; o.earned+=k; return k; }
/* níveis astrais liberados = marcos de unlockStage já vencidos */
function astralCap(S){ const o=ensure(S); return DATA.astral.unlockStage.filter(s=>o.marks.includes(s)).length; }
const forgeLv=(S,slot)=>{ const F=SYS().forge; return F&&typeof F.level==='function'?F.level(S,slot):0; };
const astralLevel=(S,slot)=>SLOTS.includes(slot)&&on()?ensure(S).lv[slot]:0;   // 0..5 (5 = +25)
/* nível da forja que VALE no espaço (16..25 com tudo ligado): Forja comum + astral */
const totalLevel=(S,slot)=>{ const a=astralLevel(S,slot); return a?DATA.astral.levels[a-1]:forgeLv(S,slot); };
/* multiplicador do espaço PARA O ENGENHEIRO: usa no lugar do Sys.forge.mult(S,slot). Desligado ou sem nível astral = Sys.forge.mult exato. */
function forgeMult(S,slot){ const a=astralLevel(S,slot); if(a) return DATA.astral.bonus[a-1]; const F=SYS().forge; return F&&typeof F.mult==='function'?F.mult(S,slot):0; }
function astralChance(S,slot){ const o=ensure(S), a=o.lv[slot]; if(a>=DATA.astral.levels.length) return 0; return clamp(DATA.astral.chance[a]+o.pity[slot],0,100); }
/* {ok, reason:'desligado'|'slot'|'base'|'marco'|'max'|'pedras', stones, chance, next, needStage} */
function canAstral(S,host,slot){ if(!on()) return {...OFF,stones:0,chance:0};
  if(!SLOTS.includes(slot)) return {ok:false,reason:'slot',stones:0,chance:0};
  const o=ensure(S), a=o.lv[slot], A=DATA.astral, r={ok:false,reason:'',stones:a<A.levels.length?A.stones[a]:0,chance:astralChance(S,slot),next:a<A.levels.length?A.levels[a]:0,needStage:a<A.levels.length?A.unlockStage[a]:0};
  if(a>=A.levels.length){ r.reason='max'; return r; }
  if(a===0&&forgeLv(S,slot)<A.base){ r.reason='base'; return r; }                 // precisa do +20 da Forja (Sys.forge com a f20 ligada)
  if(a>=astralCap(S)){ r.reason='marco'; return r; }                                 // o nível só abre ao vencer o marco
  if(o.stones<r.stones){ r.reason='pedras'; return r; }
  r.ok=true; return r; }
/* uma tentativa: falha NUNCA tira nível, soma garantia. {ok, success, slot, level (21..25 ou 20), chance, roll, stones} */
function astralTry(S,host,slot){ const c=canAstral(S,host,slot); if(!c.ok) return {ok:false,reason:c.reason,success:false,slot};
  const o=ensure(S), rng=host&&typeof host.rng==='function'?host.rng:Math.random; o.stones-=c.stones; o.spent+=c.stones;
  const roll=rng()*100, success=roll<c.chance; if(success){ o.lv[slot]++; o.pity[slot]=0; } else o.pity[slot]+=DATA.astral.pityPerFail;
  if(host&&typeof host.onChange==='function') host.onChange();
  return {ok:true,success,slot,level:totalLevel(S,slot),chance:c.chance,roll,stones:c.stones}; }

/* resumo para telas (Fim das 9 eras, Perfil, Forja) */
function view(S,host){ if(!on()) return {on:false}; const o=ensure(S);
  return {on:true,final:!!o.final,marks:o.marks.slice(),next:nextMilestone(S),stones:o.stones,astralCap:astralCap(S),
    astral:SLOTS.map(s=>({slot:s,level:totalLevel(S,s),astral:o.lv[s],can:canAstral(S,host,s)})),cosmetics:cosmetics(S)}; }

const API={DATA,setOn,ensure,register,unregister,resync,onFinal,finalPrizes,onStageClear,sync,nextMilestone,milestoneRewards,isMark,nextMark,
  cosmetics,equip,equipped,addAstral,astralCap,astralLevel,totalLevel,forgeMult,astralChance,canAstral,astralTry,view};
root.Sys=root.Sys||{}; root.Sys.erasEnd=API;
if(DATA.on) register(null);
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
