// node test/sys/loot-wing.test.js — asa = item próprio (anjo/demoníaca), regra do Sys.stats.wingForDrop
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

t('sem o stats carregado: asa sai sem item.wing e o nome cai no anjo (nunca a tabela antiga por era)',()=>{
  const saved=globalThis.Sys.stats; delete globalThis.Sys.stats;
  try{ const it=L.rollItem(makeHost({level:60,eraMax:3}),{slot:'wing'});
    assert.strictEqual(it.wing,undefined); assert.strictEqual(L.itemName(it),'Asa de anjo');
    assert.strictEqual(L.itemName({slot:'wing',e:6,r:4,wing:'demon'}),'Asa demoníaca'); assert.ok(!L.DATA.names.wing);
  } finally { if(saved) globalThis.Sys.stats=saved; }
});
t('com o stats: item.wing = wingForDrop(era, dificuldade) e o nome = wingName',()=>{
  require('../../js/sys/stats.js'); const St=globalThis.Sys.stats; const h=makeHost({level:60,eraMax:7});
  const a=L.rollItem(h,{slot:'wing',era:2}); assert.strictEqual(a.wing,'angel'); assert.strictEqual(L.itemName(a),'Asa de anjo');
  const b=L.rollItem(h,{slot:'wing',era:7}); assert.strictEqual(b.wing,'demon'); assert.strictEqual(L.itemName(b),St.wingName(b));
  const c=L.rollItem(h,{slot:'wing',era:1,diff:3}); assert.strictEqual(c.wing,'demon');
  assert.strictEqual(L.rollItem(h,{slot:'boots'}).wing,undefined);
  assert.strictEqual(L.itemName({slot:'wing',e:3,r:2}),'Asa de anjo');           // item antigo sem item.wing: o stats resolve pela mesma regra
  assert.ok(L.itemName({slot:'boots',e:0,r:0}));                                   // os outros espaços seguem com a tabela por era
});
console.log(n+' testes ok');
