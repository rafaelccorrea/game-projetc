// node test/sys/loot-schedule.test.js — bônus dos eventos com horário (Sys.schedule.perks) no abate
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const avg=(S,h,k,N)=>{ let s=0; for(let i=0;i<N;i++){ const r=L.rollKill(S,h,{gold:100}); s+=k==='items'?r.items.length:r[k]; } return s/N; };

t('sem evento: igual a antes; Hora de Ouro (+100%) dobra o ouro',()=>{
  delete globalThis.Sys.schedule; const h=makeHost({level:60}); const S={};
  const g0=L.rollKill(S,h,{gold:100}).gold;
  globalThis.Sys.schedule={perks:()=>({goldPct:100})};
  const g1=L.rollKill(S,makeHost({level:60}),{gold:100}).gold;
  assert.ok(Math.abs(g1/g0-2)<0.35, g0+' -> '+g1);
  assert.deepStrictEqual(L.rollKill(S,makeHost({level:60}),{gold:100}).event.goldPct,100);
});
t('Invasão (+50% drop): mais itens, raridade ainda presa ao portão',()=>{
  globalThis.Sys.schedule={perks:()=>({})}; const S={};
  const a=avg(S,makeHost({level:60,seed:3}),'items',3000);
  globalThis.Sys.schedule={perks:()=>({dropPct:50})};
  const b=avg(S,makeHost({level:60,seed:3}),'items',3000);
  assert.ok(b>a*1.25, a+' -> '+b);
  /* portão: no nível 1, a maior raridade que sai COM o evento não passa da que sai SEM ele */
  const maxR=(perks)=>{ globalThis.Sys.schedule={perks:()=>perks}; const h=makeHost({level:1,seed:5}), S1={}; let m=-1; for(let i=0;i<3000;i++) for(const it of L.rollKill(S1,h,{gold:100}).items) m=Math.max(m,it.r); return m; };
  assert.ok(maxR({dropPct:50})<=maxR({}));
});
t('Bênção da Forja e Caça aos Pets: mais pedras de forja e ração; valor negativo ou lixo vira 0',()=>{
  globalThis.Sys.schedule={perks:()=>({})}; const S={};
  const f0=avg(S,makeHost({level:60,seed:9}),'forge',3000), r0=avg(S,makeHost({level:60,seed:9}),'food',3000);
  globalThis.Sys.schedule={perks:()=>({forgePct:100,foodPct:100})};
  const f1=avg(S,makeHost({level:60,seed:9}),'forge',3000), r1=avg(S,makeHost({level:60,seed:9}),'food',3000);
  assert.ok(f1>f0*1.5||f0===0, f0+' -> '+f1); assert.ok(r1>r0*1.5||r0===0, r0+' -> '+r1);
  globalThis.Sys.schedule={perks:()=>({goldPct:-90,dropPct:'x'})}; const g=L.rollKill(S,makeHost({level:60}),{gold:100}); assert.ok(g.gold>=80); assert.strictEqual(g.event,null);
  globalThis.Sys.schedule={perks:()=>{ throw new Error('x'); }}; assert.ok(L.rollKill(S,makeHost({level:60}),{gold:100}).gold>0);
  delete globalThis.Sys.schedule;
});
console.log(n+' testes ok');
