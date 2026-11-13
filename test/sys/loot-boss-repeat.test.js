// node test/sys/loot-boss-repeat.test.js — chefe não repete o mesmo item seguido (pedido do dono; só muda a ORDEM do sorteio)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
const N=400, host=makeHost({level:13,eraMax:1});
let same=0, sameSlot=0, prev=null; const slots={};
for(let i=0;i<N;i++){ const it=L.rollItem(host,{minR:1,upChance:0.25,source:'boss'}); slots[it.slot]=(slots[it.slot]||0)+1;
  if(prev){ if(prev.slot===it.slot) sameSlot++; if(prev.slot===it.slot&&prev.e===it.e&&prev.r===it.r) same++; } prev=it; }
console.log('espaço igual ao anterior:',sameSlot+'/'+(N-1),'· visual igual:',same+'/'+(N-1),'· espaços:',JSON.stringify(slots));
assert.ok(sameSlot/(N-1)<0.05,'espaço repetido seguido deve ser raro (era ~20%)');
assert.ok(Object.keys(slots).length>=5,'todos os espaços continuam saindo');
// sem source 'boss' (abate comum) nada muda; com espaço dado, também não
const it=L.rollItem(host,{slot:'weapon',source:'boss'}); assert.strictEqual(it.slot,'weapon');
console.log('3 testes ok');
