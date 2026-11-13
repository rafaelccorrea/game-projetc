// node test/sys/newdrops-hooks.test.js — ganchos do Sys.newDrops (fps-69) nos módulos do Servidor: loot, instâncias, passe, compras
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
const L=require('../../js/sys/loot.js'); const I=require('../../js/sys/instances.js'); const P=require('../../js/sys/pass.js'); const B=require('../../js/sys/buy.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const calls=[]; globalThis.Sys.newDrops={ grant:(S,h,src,ctx)=>{ calls.push([src,ctx]); return {ok:true,got:[]}; }, wingTypeForDrop:()=>'darkmoth',
  shop:()=>[{productId:'mount_mecha',on:false}], grantProduct:(S,h,id,ord)=>{ calls.push(['product',id,ord]); return {ok:true}; } };

t('chefe de era vencido: boss:era {era, diff}; abate comum não chama',()=>{
  calls.length=0; const S={}, h=makeHost({level:60,eraMax:3});
  L.rollKill(S,h,{gold:10}); assert.strictEqual(calls.length,0);
  const r=L.rollKill(S,h,{gold:10,eraBoss:true,era:2}); assert.deepStrictEqual(calls[0],['boss:era',{era:2,diff:0}]); assert.ok(r.newDrops);
});
t('asa: modelo pelo Sys.newDrops.wingTypeForDrop',()=>{ const it=L.rollItem(makeHost({level:60,eraMax:3}),{slot:'wing',era:2}); assert.strictEqual(it.wing,'darkmoth'); });
t('passe: bônus das diárias completas → missions:daily',()=>{
  calls.length=0; const S={}, h=makeHost({level:60});
  for(const [k,v] of [['kill',500],['ult',10],['chest',5],['instance',5],['boss',10],['forge',50],['summon',5],['upgrade',30]]) P.track(S,h,k,v);
  for(const m of P.DATA.daily) P.claimMission(S,h,m.id); assert.strictEqual(calls.length,0);
  const r=P.claimMission(S,h,'bonus'); if(r.ok){ assert.deepStrictEqual(calls[0],['missions:daily',{}]); assert.ok(r.newDrops); }
});
t('compras: mecha só à venda quando liberado; entrega pelo grantProduct com o id da entrega (idempotente)',()=>{
  assert.strictEqual(B.available('mount_mecha'),false); assert.strictEqual(B.available('gems_60'),true);
  globalThis.Sys.newDrops.shop=()=>[{productId:'mount_mecha',on:true}]; assert.strictEqual(B.available('mount_mecha'),true);
  calls.length=0; const out=B.applyGrants({},{},[{kind:'mount',mountId:'mecha'}],false,'d123'); assert.deepStrictEqual(calls[0],['product','mount_mecha','d123']); assert.ok(out[0].ok);
});
console.log(n+' testes ok');
