// node test/sys/mapchest.test.js — Sys.mapChest: baús de marco (fases 3 e 7 de cada era), 1 vez por save, ouro em minutos de abate, nunca vendido.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
require('../../js/sys/forge.js');
require('../../js/sys/phases.js');
require('../../js/sys/mapchest.js');
const {makeHost}=require('./_host.js');
const M=Sys.mapChest, F=Sys.forge, PH=Sys.phases;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ M.setOn(true); try{ fn(); } finally{ M.setOn(false); } };

t('DESLIGADO: lista vazia, coleta recusa, save não muda',()=>{
  assert.strictEqual(M.DATA.on,false); const S={}, h=makeHost({stage:20});
  assert.deepStrictEqual(M.list(S,h,0),[]); assert.strictEqual(M.claim(S,h,3).reason,'off'); assert.strictEqual(M.readyCount(S,h),0);
  assert.deepStrictEqual(S,{}); assert.strictEqual(h.gold,0); assert.strictEqual(M.view(S,h,0).on,false);
});

t('números: fases 3 e 7; ouro = 3 min × 24 abates/min × goldUnit; 1 pedra / 20 diamantes + 2 pedras; nunca vendido',()=>{
  assert.strictEqual(M.DATA.killsPerMin,24); assert.deepStrictEqual(M.DATA.chests.map(c=>[c.at,c.goldMin,c.gems,c.stones]),[[3,3,0,1],[7,3,20,2]]);
  assert.strictEqual(M.DATA.purchasable,false); const h=makeHost({unit:4});
  assert.deepStrictEqual(M.rewardOf(h,M.DATA.chests[0]),{gold:288,gems:0,stones:1,goldMin:3});
  assert.deepStrictEqual(M.rewardOf(h,M.DATA.chests[1]),{gold:288,gems:20,stones:2,goldMin:3});
});

t('estados fechado/pronto/coletado pela fase vencida (curva de 10)',()=>withOn(()=>{
  const S={}, h=makeHost({stage:4,unit:4});   // fase atual 4 = venceu a 3
  assert.deepStrictEqual(M.list(S,h,0).map(c=>[c.stage,c.state]),[[3,'ready'],[7,'closed']]);
  assert.deepStrictEqual(M.list(S,h,1).map(c=>[c.stage,c.state]),[[13,'closed'],[17,'closed']]);
  assert.strictEqual(M.claim(S,h,7).reason,'closed'); assert.strictEqual(M.claim(S,h,5).reason,'id'); assert.strictEqual(M.claim(S,h,95).reason,'id');
  assert.strictEqual(M.list(S,h,0)[0].text,'288 moedas + 1 pedra de forja');
}));

t('coleta credita ouro, diamantes e pedras uma vez só',()=>withOn(()=>{
  const S={}, h=makeHost({stage:18,unit:4});
  assert.strictEqual(M.readyCount(S,h),4);
  const a=M.claim(S,h,3); assert.ok(a.ok); assert.strictEqual(a.gold,288); assert.strictEqual(a.stones,1); assert.strictEqual(h.gold,288); assert.strictEqual(F.ensure(S).stones,1);
  assert.strictEqual(M.claim(S,h,3).reason,'collected'); assert.strictEqual(h.gold,288);
  const b=M.claim(S,h,{era:1,slot:1}); assert.ok(b.ok); assert.strictEqual(b.gems,20); assert.strictEqual(b.stones,2); assert.strictEqual(h.gems,20); assert.strictEqual(F.ensure(S).stones,3);
  assert.deepStrictEqual(M.list(S,h,0).map(c=>c.state),['collected','ready']); assert.strictEqual(M.readyCount(S,h),2);
  const v=M.view(S,h,1); assert.strictEqual(v.ready,1); assert.strictEqual(v.readyAll,2); assert.strictEqual(v.purchasable,false);
}));

t('curva de 100 (Sys.phases ligado): fases 30 e 70 do Fácil; baú coletado na curva antiga não reabre',()=>withOn(()=>{
  PH.DATA.on=true; try{
    const S={sys:{mapChest:{got:{'0-0':1}},phases:{best:{0:[45,0,0,0]}}}}, h=makeHost({stage:1});
    assert.deepStrictEqual(M.list(S,h,0).map(c=>[c.n,c.stage,c.state]),[[30,30,'collected'],[70,70,'closed']]);
    assert.strictEqual(M.claim(S,h,30).reason,'collected'); assert.strictEqual(M.claim(S,h,3).reason,'id');
    S.sys.phases.best[0]=[100,0,0,0]; assert.ok(M.claim(S,h,70).ok); assert.strictEqual(M.list(S,h,1)[0].stage,130);
  } finally{ PH.DATA.on=false; }
  const B={sys:{mapChest:{got:{'0-0':1,'99-0':1,'0-5':1,x:1}}}}; M.ensure(B); assert.deepStrictEqual(Object.keys(B.sys.mapChest.got),['0-0']);
  assert.ok(Object.values(M.bonus()).every(x=>x===0));
}));

console.log(`mapchest: ${n} ok`);
