/* Eonbound — Sys.arenaSet: CONJUNTO PvP DA ARENA + BRASA DA ARENA (docs/LOM_VS_EONBOUND.md §5 item 14, P3; contrato docs/SERVIDOR_LOM.md §1).
   CHAVE DESLIGADA (DATA.on=false): desligada, a arena luta exatamente como hoje (Sys.arena.duelPvp) e não dá Brasa.
   O que JÁ existia e é reusado (fonte única, nada copiado aqui):
   - as 3 magias do modo 'arena' do Grimório (Sys.grimoire.loadout(S,'arena'); vazio cai no de Fases);
   - o conjunto de equipamento 'arena' do Sys.loadouts (peças, pet, montaria; trocar = Sys.loadouts.apply / forBattle).
   O que este módulo ACRESCENTA:
   1. pvpSet / snapshotPart: o conjunto PvP que vai no retrato da arena (POST /arena/snapshot, campo pvp) para o servidor guardar;
   2. duel(A, B, seed): a luta da arena COM as magias. Cada magia vira um modificador FIXO do retrato (sem tempo real, sem sorteio a mais) e a luta
      continua sendo o Sys.arena.duelPvp com a mesma semente. Sem magias nos dois lados = resultado idêntico ao de hoje. Tetos por lado em DATA.caps;
   3. onWin(S, host): 1 Brasa por vitória, até 5 por dia (Sys.bonfire.addBrasas 'arena'; o teto mora no bonfire, S.sys.bonfire.ar).
   Nada pago, nada sorteado. Sem estado próprio (tudo vem do grimoire, loadouts e bonfire). Sem DOM. Teste: test/sys/arenaset.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  /* tetos SOMADOS por lado: ATQ +50%, Vida +50% (cura + escudo), velocidade +30 pontos, ATQ do adversário −20% (atordoar + esquiva) */
  caps:{atk:0.5, hp:0.5, aspd:30, foe:0.2},
  healWindowSec:30,   // a cura conta como se a luta durasse 30 s: pct × 30 ÷ recarga
  maxSpells:3,
};
const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };

/* ---------- conjunto PvP (para o retrato) ---------- */
/* {spells:[{id,lv}], gear:{espaço:id}, pet, mount} — magias do preset 'arena' do Grimório, peças do conjunto 'arena' do Sys.loadouts */
function pvpSet(S,host){ const G=SYS().grimoire, L=SYS().loadouts, out={spells:[],gear:{},pet:null,mount:null};
  try{ if(G&&typeof G.loadout==='function') out.spells=G.loadout(S,'arena').slice(0,DATA.maxSpells).map(x=>({id:x.id,lv:int0(x.lv)||1})); }catch(e){ out.spells=[]; }
  try{ if(L&&L.DATA&&L.DATA.on===true&&typeof L.ensure==='function'){ const set=L.ensure(S).sets.arena; if(set){ out.gear=Object.assign({},set.gear); out.pet=set.pet||null; out.mount=set.mount||null; } } }catch(e){}
  return out; }
/* o campo `pvp` do POST /arena/snapshot; desligado = null (o Sys.arenaNet não manda nada) */
const snapshotPart=(S,host)=>on()?pvpSet(S,host):null;

/* ---------- magias → modificadores do retrato (conta pura; o servidor roda a mesma) ---------- */
/* spells: [{id, lv}] → {atk, hp, aspd, foe} (fração somada, já com teto). Id desconhecido é ignorado. */
function mods(spells){ const G=SYS().grimoire, C=DATA.caps, m={atk:0,hp:0,aspd:0,foe:0}; if(!G||typeof G.spell!=='function'||typeof G.stat!=='function') return m;
  const seen=[];
  for(const x of Array.isArray(spells)?spells.slice(0,DATA.maxSpells):[]){ const sp=x&&G.spell(x.id); if(!sp||seen.includes(sp.id)) continue; seen.push(sp.id);
    const st=G.stat(sp,int0(x.lv)||1), cd=Math.max(1,num(st.cd,10));
    if(st.type==='dmg'){ m.atk+=num(st.mult,0)/cd; if(st.stun) m.foe+=num(st.stun,0)/cd; }
    else if(st.type==='heal') m.hp+=num(st.pct,0)/100*DATA.healWindowSec/cd;
    else if(st.type==='shield') m.hp+=num(st.pct,0)/100*num(st.sec,0)/cd;
    else if(st.type==='buff'){ if(st.key==='aspd') m.aspd+=num(st.val,0)*num(st.sec,0)/cd; else if(st.key==='dodge') m.foe+=num(st.val,0)/100*num(st.sec,0)/cd; } }
  m.atk=Math.min(C.atk,m.atk); m.hp=Math.min(C.hp,m.hp); m.aspd=Math.min(C.aspd,m.aspd); m.foe=Math.min(C.foe,m.foe);
  for(const k in m) m[k]=Math.round(m[k]*10000)/10000;
  return m; }
const spellsOf=P=>P&&P.pvp&&Array.isArray(P.pvp.spells)?P.pvp.spells:[];
/* aplica as magias dos dois lados: devolve cópias (nunca muda os retratos) */
function applySpells(A,B){ const ma=mods(spellsOf(A)), mb=mods(spellsOf(B)), a=Object.assign({},A), b=Object.assign({},B);
  a.atk=num(A.atk,0)*(1+ma.atk)*(1-mb.foe); b.atk=num(B.atk,0)*(1+mb.atk)*(1-ma.foe);
  a.hp=num(A.hp,1)*(1+ma.hp); b.hp=num(B.hp,1)*(1+mb.hp);
  a.aspd=num(A.aspd,0)+ma.aspd; b.aspd=num(B.aspd,0)+mb.aspd;
  return {A:a,B:b,mods:{A:ma,B:mb}}; }
/* a luta da arena com o conjunto PvP. Sem magias nos dois lados (ou desligado no jogo e sem pvp nos retratos) = Sys.arena.duelPvp puro. */
function duel(A,B,seed){ const AR=SYS().arena; if(!AR||typeof AR.duelPvp!=='function') throw new Error('Sys.arenaSet.duel: Sys.arena não carregado');
  if(!spellsOf(A).length&&!spellsOf(B).length) return AR.duelPvp(A,B,seed);
  const x=applySpells(A,B), d=AR.duelPvp(x.A,x.B,seed); d.mods=x.mods; return d; }

/* ---------- Brasa da Arena ---------- */
/* chamar depois de cada VITÓRIA na arena (o Sys.arena.fightRewards chama sozinho). Devolve quantas Brasas entraram (0 desligado / teto do dia). */
function onWin(S,host){ if(!on()) return 0; const B=SYS().bonfire; if(!B||typeof B.addBrasas!=='function') return 0; try{ return int0(B.addBrasas(S,'arena',1,{host})); }catch(e){ return 0; } }

/* ---------- tela (aba "Conjunto PvP" da arena) ---------- */
function view(S,host){ if(!on()) return {on:false}; const G=SYS().grimoire, B=SYS().bonfire, set=pvpSet(S,host); let spells=[];
  try{ if(G&&typeof G.loadout==='function') spells=G.loadout(S,'arena').map(x=>({id:x.id,name:x.name,lv:x.lv,text:x.text})); }catch(e){}
  let own=false; try{ const g=G&&G.ensure?G.ensure(S):null; own=!!(g&&g.sets&&g.sets.arena&&g.sets.arena.length); }catch(e){}
  const cap=B&&B.DATA&&B.DATA.arena?B.DATA.arena.dayCap:0, left=B&&B.DATA&&B.DATA.on===true&&typeof B.arenaLeft==='function'?B.arenaLeft(S,host):0;
  return {on:true,spells,ownSpells:own,fromFases:!own&&spells.length>0,gear:set.gear,gearSet:Object.keys(set.gear).length>0,pet:set.pet,mount:set.mount,
    mods:mods(set.spells),brasa:{on:!!(B&&B.DATA&&B.DATA.on===true),left,cap,got:cap-left}}; }

const API={DATA,on,setOn,pvpSet,snapshotPart,mods,applySpells,duel,onWin,view};
root.Sys=root.Sys||{}; root.Sys.arenaSet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
