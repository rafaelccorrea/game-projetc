// node test/sys/integration.test.js — loot/baú/instâncias (fps-30) entregando nos módulos REAIS de forja e pet (fps-e2)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js'), C=require('../../js/sys/chest.js'), I=require('../../js/sys/instances.js');
const F=require('../../js/sys/forge.js'), P=require('../../js/sys/pet.js'), Lv=require('../../js/sys/level.js');
const {makeHost:mh}=require('./_host.js');
const makeHost=o=>mh(Object.assign({stage:70},o));
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

t('abate de chefe: pedra vai para S.sys.forge, ração para S.sys.pet, ovo choca no pet',()=>{
  const S={}, h=makeHost({seed:6,eraMax:1,stage:12});
  const r=L.onKill(S,h,{boss:true,gold:20});                    // 1º chefe: ovo Básico garantido
  assert.strictEqual(F.ensure(S).stones,r.forge,'pedra no estoque da forja');
  assert.strictEqual(P.ensure(S).food>=r.food,true,'ração no estoque do pet');
  assert.deepStrictEqual(r.eggs,[0]); assert.strictEqual(r.hatched.length,1);
  const hz=r.hatched[0]; assert.ok(hz&&('pet' in hz)&&('isNew' in hz),'retorno do addEgg: '+JSON.stringify(hz));
  assert.deepStrictEqual(L.pending(S),{forge:0,food:0,xp:0,stones:0,eggs:{}},'nada pendente com os módulos carregados');
  assert.strictEqual(Lv.ensure(S).total,r.xp,'XP do abate no Sys.level real');
  assert.strictEqual(L.todayCount(S,h,'forge'),r.forge);
});

t('baú e Arsenal entregam pedra na forja e somam no contador da missão',()=>{
  const S={}, h=makeHost({seed:9,eraMax:0});
  C.onKills(S,250,h); const b=C.open(S,h);
  const run=I.start(S,h,'gear',1).run; const out=I.finish(S,h,run.id,{win:true});
  assert.strictEqual(F.ensure(S).stones,b.forge+out.reward.forge); assert.strictEqual(L.todayCount(S,h,'forge'),b.forge+out.reward.forge);
});

t('pendentes de antes do módulo existir saem no flush para os módulos reais',()=>{
  const S={}, h=makeHost({seed:2});
  const sf=globalThis.Sys.forge, sp=globalThis.Sys.pet; delete globalThis.Sys.forge; delete globalThis.Sys.pet;
  L.grant(S,h,{gold:1,gems:0,items:[],forge:4,food:6,eggs:[1]});
  globalThis.Sys.forge=sf; globalThis.Sys.pet=sp;
  const f=L.flushPending(S,h); assert.strictEqual(F.ensure(S).stones,4); assert.ok(P.ensure(S).food>=6); assert.strictEqual(f.eggs.length,1);
});

t('ovo do Chefe de Era (instância) choca no pet real',()=>{
  const h=makeHost({seed:41,eraMax:2}); let hatched=0;
  for(let i=0;i<60;i++){ const S={}; const run=I.start(S,h,'boss',8).run; const out=I.finish(S,h,run.id,{win:true}); if(out.reward.hatched) hatched++; }
  assert.ok(hatched>10,'Difícil 40%: '+hatched+'/60');
});
t('VIP real (vip.js, níveis 1-10): baú, chaves e ouro seguem o perks() do nível; Stats real (stats.js) sorteia os secundários',()=>{
  const V=require('../../js/sys/vip.js'), St=require('../../js/sys/stats.js');
  const S={}, h=makeHost({seed:31,eraMax:6,level:90}); if(V.setLevel) V.setLevel(S,V.DATA.maxLevel||10); else V.setActive(S,true);
  const pk=V.perks(S); assert.ok(pk.chestCapAdd>0&&pk.instanceKeysAdd>0,'VIP máximo tem baú e chave extras');
  let opened=0; for(let i=0;i<40;i++){ C.onKills(S,1000,h); while(C.open(S,h)) opened++; } assert.strictEqual(opened,8+pk.chestCapAdd);
  const ks=I.status(S,h); assert.strictEqual(ks.keys.boss,2+pk.instanceKeysAdd,'entradas POR ÁREA: 2 + VIP'); assert.strictEqual(ks.totalMax,4*(2+pk.instanceKeysAdd));
  const S0={}, h0=makeHost({seed:5}); const g0=L.rollKill(S0,h0,{gold:100}).gold; const h1=makeHost({seed:5}); const g1=L.rollKill(S,h1,{gold:100}).gold;
  const gp=V.perks(S).goldPct; assert.ok(gp>0); assert.ok(Math.abs(g1-g0*(1+gp/100))<=2,'ouro '+g0+'→'+g1+' (VIP +'+gp+'%)');   // VIP opção B: +25%
  for(let i=0;i<3000;i++){ const it=L.rollItem(h,{}); assert.ok(it.subs.every(s=>St.SUB_KEYS.includes(s.k))); assert.strictEqual(it.subs.length,St.subCount?St.subCount(it.r):[0,1,2,2,2][it.r]); }
  delete globalThis.Sys.vip; delete globalThis.Sys.stats;
});
t('OTIMIZADOR (v7): ovos do Chefe de Era Difícil chegam ao pet.js com source:instance e respeitam 1/dia',()=>{
  const seen=[]; const orig=P.addEgg; P.addEgg=(S,h,o)=>{ seen.push(o.source); return orig(S,h,o); };
  const S={}, h=makeHost({seed:7,eraMax:6,level:90});
  for(let d=0;d<60;d++){ h.t+=86400000; let today=0; for(let k=0;k<2;k++){ const r=I.start(S,h,'boss',20); assert.ok(r.ok,'2 entradas no Chefe de Era'); const out=I.finish(S,h,r.run.id,{win:true}); if(out.reward.egg>=0) today++; } assert.ok(today<=1); }
  P.addEgg=orig; assert.ok(seen.length>20&&seen.length<=60,'ovos '+seen.length); assert.ok(seen.every(s=>s==='instance'),'todos com source instance');
});
t('pets 17b (Sys.pet.setV17): ovo de espécie acima do portão nasce pelo Sys.loot.releaseHeld quando o portão abre',()=>{
  const P=require('../../js/sys/pet.js'); const v3=P.DATA.v3; P.DATA.v3=true; assert.ok(P.setV17(true));
  let lvl=40; const h=makeHost({eraMax:4,seed:3}); h.level=()=>lvl; const S={};
  const r=P.addEgg(S,h,{r:3}); assert.ok(r.held&&r.gated,'Mítico antes do Nv 70: guardado no pet.js');
  assert.deepStrictEqual(L.releaseHeld(S,h),[],'portão fechado: nada');
  lvl=75; const out=L.releaseHeld(S,h); assert.strictEqual(out.length,1); assert.ok(out[0].gated&&out[0].hatch.pet==='golem');
  assert.deepStrictEqual(L.releaseHeld(S,h),[],'sai uma vez só');
  P.setV17(false); P.DATA.v3=v3;
});
console.log(`\nintegração: ${n} testes ok`);
