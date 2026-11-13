// node test/sys/pass-tier.test.js — Sys.pass.claimTier (resgate de UM nível; pedido B-27)
'use strict';
const assert=require('assert');
require('../../js/sys/loot.js');
const P=require('../../js/sys/pass.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=o=>{ const h=makeHost(Object.assign({level:60,eraMax:2},o)); h.skins=[]; h.addSkin=s=>h.skins.push(s); return h; };

t('regras: trilha, nível, bloqueado, premium, resgatado',()=>{
  const S={}, h=host(); P.addXp(S,350);                                   // nível 3 liberado
  assert.strictEqual(P.claimTier(S,h,'x',1).reason,'trilha'); assert.strictEqual(P.claimTier(S,h,'free',0).reason,'nivel'); assert.strictEqual(P.claimTier(S,h,'free',1.5).reason,'nivel');
  assert.strictEqual(P.claimTier(S,h,'free',4).reason,'bloqueado'); assert.strictEqual(P.claimTier(S,h,'premium',1).reason,'premium');
  const g0=h.gems, r=P.claimTier(S,h,'free',2); assert.ok(r.ok); assert.strictEqual(r.rewards.gems,5); assert.strictEqual(h.gems,g0+5);
  assert.strictEqual(P.claimTier(S,h,'free',2).reason,'resgatado'); assert.strictEqual(h.gems,g0+5);
  const r3=P.claimTier(S,h,'free',3); assert.ok(r3.ok&&r3.rewards.item&&r3.rewards.item.slot==='weapon'&&r3.rewards.item.origin==='pass'); assert.strictEqual(h.items.length,1);
  P.setPremium(S,true); assert.ok(P.claimTier(S,h,'premium',1).ok); assert.deepStrictEqual(S.sys.pass.prem,[1]);
});
t('fora de ordem e misturado com o claimAll: nada em dobro',()=>{
  const S={}, h=host(); P.addXp(S,1000); P.setPremium(S,true);
  assert.ok(P.claimTier(S,h,'free',7).ok); assert.ok(P.claimTier(S,h,'premium',2).ok);
  const all=P.claimAll(S,h); assert.strictEqual(all.n,10+10-2);
  assert.ok(!all.list.some(x=>(x.track==='free'&&x.tier===7)||(x.track==='premium'&&x.tier===2)));
});
t('erro no meio da entrega: sem ter dado nada, desfaz a marca (tenta de novo); com parte dada, fica resgatado e o item vai aos guardados',()=>{
  const S={}, h=host(); P.addXp(S,300);
  const add=h.addItem; h.addItem=()=>{ throw new Error('mochila quebrou'); };
  const r=P.claimTier(S,h,'free',3); assert.deepStrictEqual(r,{ok:false,reason:'erro'}); assert.ok(!S.sys.pass.free.includes(3));
  h.addItem=add; assert.ok(P.claimTier(S,h,'free',3).ok); assert.strictEqual(h.items.length,1);
  // parte dada: a skin entra e o ouro falha
  const S2={}, h2=host(); P.DATA.free[0]={goldk:10,skin:'teste'}; P.addXp(S2,100); h2.addGold=()=>{ throw new Error('x'); };
  const r2=P.claimTier(S2,h2,'free',1); assert.ok(r2.ok&&r2.partial); assert.deepStrictEqual(h2.skins,['teste']); assert.strictEqual(P.claimTier(S2,h2,'free',1).reason,'resgatado');
  P.DATA.free[0]={goldk:10};
});
t('virada de temporada: nível da temporada que acabou não é pago',()=>{
  const S={}, h=host(); P.season(S,h); P.addXp(S,500);
  h.t=S.sys.pass.season.end+1000;                                            // a temporada virou com a tela aberta
  assert.strictEqual(P.claimTier(S,h,'free',2).reason,'bloqueado'); assert.strictEqual(S.sys.pass.xp,0); assert.deepStrictEqual(S.sys.pass.free,[]);
});
t('nível 25 premium: Arma Épica + 30 pedras de forja + 5 Essências + 10 fragmentos de montaria (guardados sem montaria, entram na 1ª)',()=>{
  require('../../js/sys/mount.js');
  const S={}, h=host({level:60}); P.addXp(S,2500); P.setPremium(S,true);
  const L=globalThis.Sys.loot; L.ensure(S);
  const r=P.claimTier(S,h,'premium',25); assert.ok(r.ok&&r.rewards.item&&r.rewards.item.slot==='weapon'&&r.rewards.item.r===2);
  assert.strictEqual(S.sys.loot.mat.forge,30); assert.strictEqual(S.sys.loot.mat.essence,5);
  assert.strictEqual(S.sys.pass.mfrag,10, 'sem montaria: guardados');
  const M=globalThis.Sys.mount; M.ensure(S); const was=M.DATA.on; M.DATA.on=true; M.add(S,h,'wolf'); assert.strictEqual(P.releaseMountFrags(S),10); assert.strictEqual(S.sys.pass.mfrag,0);
  assert.ok(M.ensure(S).owned.wolf.frags>=10||M.ensure(S).owned.wolf.stars>1); M.DATA.on=was;
});
console.log(n+' testes ok');
