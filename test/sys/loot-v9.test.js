// node test/sys/loot-v9.test.js — Divino (r5) no drop e XP do abate com o v9 (pedidos da fps-e2; atrás das chaves dela)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const Sys=globalThis.Sys;
let maxR=4; Sys.stats={maxR:()=>maxR};   // stub do stats.js (5 = era9 ligado)

t('Divino desligado (maxR 4): 5 pesos, teto Lendário, nada de r5',()=>{
  maxR=4; assert.strictEqual(L.rarWeights(8,0).length,5);
  assert.strictEqual(L.maxAllowedR(makeHost({level:200,eraMax:8})),4);
});

t('Divino ligado: peso 0,05 com reforço de era; portão nível 105 + era 7',()=>{
  maxR=5; const w=L.rarWeights(0,0); assert.strictEqual(w.length,6); assert.strictEqual(w[5],0.05);
  assert.ok(L.rarWeights(8,0)[5]>0.05,'reforço de era');
  assert.strictEqual(L.maxAllowedR(makeHost({level:104,eraMax:8})),4,'nível 104: ainda não');
  assert.strictEqual(L.maxAllowedR(makeHost({level:150,eraMax:6})),4,'era 6: ainda não');
  assert.strictEqual(L.maxAllowedR(makeHost({level:105,eraMax:7})),5,'nível 105 + era 7: Divino');
  maxR=4;
});

t('Divino ligado e portão aberto: cai às vezes; nunca acima do portão',()=>{
  maxR=5; const S={}, h=makeHost({level:120,eraMax:8,stage:400,seed:11}); let d=0;
  for(let i=0;i<20000;i++){ const r=L.rollKill(S,h,{gold:5,boss:true}); for(const it of r.items) if(it.r===5) d++; }
  assert.ok(d>0,'algum Divino em 20 mil chefes');
  const S2={}, h2=makeHost({level:90,eraMax:8,stage:400,seed:11});
  for(let i=0;i<20000;i++){ const r=L.rollKill(S2,h2,{gold:5,boss:true}); assert.ok(r.items.every(it=>it.r<=4),'portão fechado'); }
  maxR=4;
});

t('XP v9 desligado: uma chamada sem src (como sempre)',()=>{
  const calls=[]; Sys.level={DATA:{v9:{on:false}},addXp:(S,n,h,src)=>{ calls.push([n,src]); return {levels:0}; }};
  const S={}, h=makeHost({seed:3}); const r=L.rollKill(S,h,{gold:100}); L.grant(S,h,r);
  assert.deepStrictEqual(calls,[[r.xp,undefined]]);
});

t('XP v9 ligado: orbes com src kill; o extra do retorno vai separado, sem src',()=>{
  const calls=[]; Sys.level={DATA:{v9:{on:true}},addXp:(S,n,h,src)=>{ calls.push([n,src]); return {levels:0}; }};
  const S={}, h=makeHost({seed:3}); const r=L.rollKill(S,h,{gold:100}); L.grant(S,h,r);
  assert.deepStrictEqual(calls,[[r.xp,'kill']],'sem retorno: só a chamada kill');
  calls.length=0; const r2=Object.assign({},r,{xp:r.xp*2,xpKill:r.xp,xpExtra:r.xp,items:[],eggs:[],held:[]}); L.grant(S,h,r2);
  assert.deepStrictEqual(calls,[[r.xp,'kill'],[r.xp,undefined]],'retorno: extra sem teto');
});

t('XP v9 ligado: subidas das duas chamadas viram um aviso só',()=>{
  let lv=10; Sys.level={DATA:{v9:{on:true}},addXp:(S,n,h,src)=>{ const f=lv; lv++; return {levels:1,from:f,to:lv,unlocked:[src||'x']}; }};
  const S={}, h=makeHost({seed:3}); const r=L.rollKill(S,h,{gold:100});
  const g=L.grant(S,h,Object.assign({},r,{xp:10,xpKill:5,xpExtra:5,items:[],eggs:[],held:[]}));
  assert.deepStrictEqual([g.levelUp.from,g.levelUp.to,g.levelUp.levels],[10,12,2]); assert.deepStrictEqual(g.levelUp.unlocked,['kill','x']);
  delete Sys.level;
});
console.log(`\nloot-v9: ${n} testes ok`);
