// node test/sys/guild-members.test.js — membros da guilda vindos do servidor: nível (members[].level, §10.5) e era (0-8) não se perdem no save
'use strict';
const assert=require('assert');
globalThis.Sys={};
require('../../js/sys/level.js');
const G=require('../../js/sys/guild.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
t('ensure lê level (servidor) ou lvl (save antigo) e guarda era 0-8 (null fora disso)',()=>{
  const S={sys:{level:{lvl:40,xp:0},guild:{id:'g1',name:'Teste',members:[{id:'G',name:'G',level:40,era:3},{id:'A',name:'A',lvl:18},{id:'B',name:'B',level:7,era:12},{id:'C',name:'C',level:9,era:0}]}}};
  const o=G.ensure(S), by=id=>(o.members||[]).find(m=>m.id===id);
  assert.ok(o.members&&o.members.length===4,'membros guardados');
  assert.strictEqual(by('G').lvl,40); assert.strictEqual(by('G').era,3);
  assert.strictEqual(by('A').lvl,18); assert.strictEqual(by('A').era,null);
  assert.strictEqual(by('B').era,null,'era 12 inválida'); assert.strictEqual(by('C').era,0);
});
console.log(n+' testes ok');
