/* Eonbound — Sys.petSupport: PETS DE APOIO + BÔNUS POR TER (docs/LOM_VS_EONBOUND.md §5 item 10). CHAVE DESLIGADA (DATA.on=false).
   Módulo À PARTE do Sys.pet (o pet.js não muda: desligado, nada muda no jogo e todos os testes do pet seguem iguais).
   1) BÔNUS POR TER (coleção): todo pet que o jogador tem dá um bônus permanente pequeno de ATQ e Vida, pela raridade e pelo estágio
      (filhote ×1, médio ×1,5, evoluído ×2), mesmo fora da luta. Teto de +5% em cada. Dá uso aos pets que não lutam.
   2) 2 PETS DE APOIO atrás do principal ("pet sempre na frente" continua: o principal é o único que ataca). O apoio NÃO ataca, não é alvo e não
      cura: dá uma FRAÇÃO (30%) do lado de vida dele (vínculo + cura do tipo) como vínculo (+Vida do herói), dentro do mesmo teto de pet do Sys.fc
      (maxPetShare / petCap). Espaço 1 abre com 2 pets, espaço 2 com 3 pets. Precisa de um pet principal equipado.
      Pet que está numa tenda do Acampamento (Sys.camp) não conta como apoio (um pet faz uma coisa só); a tela mostra "no acampamento".
   Nada à venda e nada sorteado aqui: os pets vêm das fontes que já existem no Sys.pet.
   Estado: S.sys.petSupport {v, sup:[id|null, id|null]}. bonus(S) entra sozinho na FC (Sys.fc). Sem DOM. Teste: test/sys/petsupport.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  label:'Pets de apoio', icon:'',
  slots:2,
  slotNeed:[2,3],          // pets que o jogador precisa ter para abrir o espaço 1 e o 2
  share:0.30,              // fração do lado de vida (bond + heal do tipo) que o apoio passa como vínculo
  // bônus por ter: ATQ% e Vida% por pet, pela raridade (0 Básico .. 5 Prismático) × estágio
  collection:{r:[0.10,0.15,0.20,0.30,0.40,0.60], stage:[1,1.5,2], capPct:5},
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const PET=()=>root.Sys&&root.Sys.pet;
const zeroB=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0,petAtk:0,petHp:0,petBond:0,petCap:0});
const r4=v=>Math.round(v*1e4)/1e4;
const defOf=id=>{ const P=PET(); return P&&P.DATA&&Array.isArray(P.DATA.pets)?P.DATA.pets.find(p=>p.id===id)||null:null; };
const v17=()=>{ const P=PET(); return !!(P&&P.DATA&&P.DATA.v17&&P.DATA.v17.on===true&&P.DATA.v3===true); };
const specOf=id=>{ const P=PET(); return v17()&&P.DATA.v17.species?P.DATA.v17.species[id]||null:null; };
const rarOf=id=>{ const s=specOf(id), d=defOf(id); return clamp(int0(s&&s.r!=null?s.r:d?d.r:0),0,5); };
const nameOf=id=>{ const s=specOf(id), d=defOf(id); return (s&&s.name)||(d&&d.name)||id; };
function petState(S){ const P=PET(); if(!P||typeof P.ensure!=='function'||!S) return null; try{ return P.ensure(S); }catch(e){ return null; } }
/* índice do estágio (0 filhote, 1 médio, 2 evoluído) pelo Sys.pet.stage */
function stageIdx(S,id){ const P=PET(); if(!P||typeof P.stage!=='function') return 0; let s=null; try{ s=P.stage(S,id); }catch(e){ return 0; } if(!s) return 0;
  if(typeof s.index==='number') return clamp(int0(s.index),0,2); return s.id==='evolved'?2:s.id==='mid'?1:0; }
/* pets numa tenda do Acampamento (lê o save cru: não anda o relógio do Sys.camp) */
function inCamp(S){ const c=S&&S.sys&&S.sys.camp, out={}; if(!c||!c.tents||typeof c.tents!=='object') return out;
  for(const k in c.tents){ const t=c.tents[k]; if(t&&Array.isArray(t.pets)) t.pets.forEach(id=>{ out[id]=k; }); } return out; }

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.petSupport.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.petSupport; if(!o||typeof o!=='object') o=S.sys.petSupport={};
  o.v=1; const a=Array.isArray(o.sup)?o.sup:[], p=petState(S), own=p&&p.owned?p.owned:{}, cnt=Object.keys(own).length, out=[];
  for(let i=0;i<DATA.slots;i++){ const id=a[i]; out.push(typeof id==='string'&&own[id]&&id!==(p&&p.eq)&&!out.includes(id)&&cnt>=DATA.slotNeed[i]?id:null); }
  o.sup=out; return o; }
const ownedCount=S=>{ const p=petState(S); return p&&p.owned?Object.keys(p.owned).length:0; };
const slotOpen=(S,i)=>ownedCount(S)>=DATA.slotNeed[i];

/* coloca o pet id no espaço i (0..1); id null = tira. Se o pet já está no outro espaço, os dois trocam.
   {ok, reason:'off'|'slot'|'locked'|'pet'|'main'|'camp', sup} */
function setSupport(S,i,id){ if(!on()) return {ok:false,reason:'off'}; i=int0(i); if(i>=DATA.slots) return {ok:false,reason:'slot'};
  const o=ensure(S), p=petState(S); if(!slotOpen(S,i)) return {ok:false,reason:'locked',need:DATA.slotNeed[i]};
  if(id==null){ o.sup[i]=null; return {ok:true,sup:o.sup.slice()}; }
  if(!p||!p.owned||!p.owned[id]) return {ok:false,reason:'pet'}; if(id===p.eq) return {ok:false,reason:'main'};
  const camp=inCamp(S); if(camp[id]) return {ok:false,reason:'camp',tent:camp[id]};
  const j=o.sup.indexOf(id); if(j>=0) o.sup[j]=o.sup[i]; o.sup[i]=id; return {ok:true,sup:o.sup.slice()}; }
/* o principal está lutando? (o Sys.pet zera o bônus dele com o pet trancado pelo nível) */
function mainWorks(S){ const P=PET(); if(!P||typeof P.bonus!=='function') return false; try{ const b=P.bonus(S)||{}; return num(b.petBond,0)+num(b.petAtk,0)+num(b.petHp,0)>0; }catch(e){ return false; } }
/* apoios que valem agora (com pet principal lutando, fora do acampamento) */
function active(S){ if(!on()||!S) return []; const o=ensure(S), p=petState(S); if(!p||!p.eq||!mainWorks(S)) return []; const camp=inCamp(S);
  return o.sup.filter(id=>id&&!camp[id]); }
/* vínculo (pontos %) que um apoio dá */
function supportBond(S,id){ const P=PET(), d=defOf(id); if(!P||!d||typeof P.pOf!=='function') return 0; const t=P.DATA.types&&P.DATA.types[d.type]; if(!t) return 0;
  let p=0; try{ p=num(P.pOf(S,id),0); }catch(e){ p=0; } return r4(DATA.share*(num(t.bond,0)+num(t.heal,0))*p*100); }
/* bônus por ter (ATQ% e Vida% iguais) */
function collection(S){ const p=petState(S); if(!p||!p.owned) return {count:0,pct:0,capped:false}; const C=DATA.collection; let s=0, n=0;
  for(const id in p.owned){ if(!defOf(id)) continue; n++; s+=C.r[rarOf(id)]*C.stage[stageIdx(S,id)]; }
  return {count:n,pct:r4(Math.min(C.capPct,s)),capped:s>C.capPct}; }

function bonus(S){ const b=zeroB(); if(!on()||!S||typeof S!=='object') return b;
  const c=collection(S); b.atkPct=c.pct; b.hpPct=c.pct;
  for(const id of active(S)) b.petBond+=supportBond(S,id);
  b.petBond=r4(b.petBond); return b; }

/* tela: {on, main, owned, collection:{count, pct, capped, cap}, slots:[{i, open, need, id, name, bond, camp}], candidates:[{id, name, r, camp}]} */
function view(S){ if(!on()) S=JSON.parse(JSON.stringify(S||{}));   // desligado: a tela pode olhar, o save não muda
  const o=ensure(S), p=petState(S), camp=inCamp(S), c=collection(S), act=active(S);
  return {on:on(),main:p&&p.eq?p.eq:null,owned:ownedCount(S),collection:Object.assign(c,{cap:DATA.collection.capPct}),
    slots:o.sup.map((id,i)=>({i,open:slotOpen(S,i),need:DATA.slotNeed[i],id,name:id?nameOf(id):'',bond:id&&act.includes(id)?supportBond(S,id):0,camp:id?camp[id]||null:null})),
    candidates:p&&p.owned?Object.keys(p.owned).filter(id=>id!==p.eq&&defOf(id)).map(id=>({id,name:nameOf(id),r:rarOf(id),camp:camp[id]||null,bond:supportBond(S,id),inSlot:o.sup.indexOf(id)})):[]}; }

const API={DATA,on,setOn,ensure,setSupport,active,supportBond,collection,bonus,view};
root.Sys=root.Sys||{}; root.Sys.petSupport=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
