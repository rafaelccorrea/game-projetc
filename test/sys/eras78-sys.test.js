// node test/sys/eras78-sys.test.js — eras 7-8 do lado dos módulos: nível 120 sem mexer em 1-100, Arena até a era 8, chefes das eras 7-8 entregam o anunciado
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','pet','mount','newdrops','loot','arena'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const LV=Sys.level, ST=Sys.stats;
t('setCap120: 1-100 iguais, 120 de teto, desligar volta ao 100',()=>{
  const old=LV.DATA.xpToNext.slice(); assert.strictEqual(LV.DATA.maxLevel,100);
  assert.strictEqual(LV.setCap120(true),true); assert.strictEqual(LV.DATA.maxLevel,120); assert.strictEqual(LV.DATA.xpToNext.length,119);
  assert.deepStrictEqual(LV.DATA.xpToNext.slice(0,old.length),old);
  for(let i=old.length;i<119;i++) assert.ok(LV.DATA.xpToNext[i]>LV.DATA.xpToNext[i-1],'curva sobe');
  const S={}; LV.ensure(S); S.sys.level.lvl=100; const r=LV.addXp(S,5e6); assert.strictEqual(r.to,120);
  LV.setCap120(false); assert.strictEqual(LV.DATA.maxLevel,100); assert.deepStrictEqual(LV.DATA.xpToNext,old);
});
t('setCap120 não briga com o setV9',()=>{ LV.setV9(true); assert.strictEqual(LV.setCap120(true),false); assert.strictEqual(LV.DATA.xpToNext,LV.DATA.v9.xpToNext); LV.setV9(false); assert.strictEqual(LV.DATA.maxLevel,100); });
t('Arena: bots na era do jogador até a 8 com as eras 7-8 ligadas; 6 no jogo de 7 eras',()=>{
  const skinEra=on=>{ ST.setEra9(on); const S={}, h=makeHost({level:110,eraMax:8}); const L=Sys.arena.localProvider.listOpponents(S,h); const b=L.find(x=>x&&x.skin); return b?+b.skin.weapon[1]:null; };
  assert.strictEqual(skinEra(false),6); assert.strictEqual(skinEra(true),8); ST.setEra9(false);
});
t('chefes das eras 7 e 8: fragmentos anunciados chegam (Serpe infernal, Cavalo infernal, Tigre celestial)',()=>{
  ST.setEra9(true); LV.setCap120(true); Sys.newDrops.DATA.on=true;
  const S={}, h=makeHost({level:110,eraMax:8,stage:80}); Sys.host=h;
  const g7=Sys.loot.rollKill(S,h,{gold:10,eraBoss:true,era:7,stage:80}).newDrops.got, g8=Sys.loot.rollKill(S,h,{gold:10,eraBoss:true,era:8,stage:90}).newDrops.got;
  assert.ok(g7.some(x=>x.id==='wyvernpet'&&x.frags===3)&&g7.some(x=>x.id==='hellhorse'&&x.frags===2),JSON.stringify(g7));
  assert.ok(g8.some(x=>x.id==='celtiger'&&x.frags===2),JSON.stringify(g8));
  Sys.newDrops.DATA.on=false; LV.setCap120(false); ST.setEra9(false);
});
console.log(n+' testes ok');
