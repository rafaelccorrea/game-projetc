// node test/sys/arena-pvp.test.js — Arena PvP (tela 23): registro com k hit/pet/ult, ultimate de verdade, robô com aparência pelo nível, prêmio por luta
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','fc','tower','chest','arena'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const A=Sys.arena, T=Sys.tower;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const me={atk:100,hp:2000,def:20,critRate:12,critDmg:100,aspd:0}; me.fc=T.fcOfStats(me);
t('registro: cada entrada tem k hit/pet/ult; pet aparece com petFrac; ult bate x3 e zera a energia',()=>{
  const f=T.scaledFoe(me,me.fc); const d=A.duelPvp(Object.assign({},me,{petFrac:0.2}),Object.assign({},f,{petFrac:0.2}),42);
  assert.ok(d.log.length>0&&d.log.every(e=>['hit','pet','ult'].includes(e.k)));
  assert.ok(d.log.some(e=>e.k==='pet')&&d.log.some(e=>e.k==='ult'));
  const u=d.log.find(e=>e.k==='ult'); assert.strictEqual(u.en,0);
  const d0=A.duelPvp(Object.assign({},me,{petFrac:0}),Object.assign({},f,{petFrac:0}),42); assert.ok(!d0.log.some(e=>e.k==='pet'),'sem pet, sem golpe de pet');
});
t('mesma seed = mesma luta (o Servidor pode repetir a conta)',()=>{ const f=T.scaledFoe(me,me.fc*1.02); assert.deepStrictEqual(A.duelPvp(me,f,7),A.duelPvp(me,f,7)); });
t('luta justa: FC 15% maior vence quase sempre; 15% menor quase nunca',()=>{ let hi=0, lo=0; for(let i=0;i<400;i++){ if(A.duelPvp(me,T.scaledFoe(me,me.fc/1.15),i).win) hi++; if(A.duelPvp(me,T.scaledFoe(me,me.fc*1.15),i).win) lo++; }
  assert.ok(hi>=380,'forte '+hi); assert.ok(lo<=20,'fraco '+lo); });
t('robô pelo nível: a pé abaixo do 38, sem pet abaixo do 20, asa do 50; pets só da era alcançada',()=>{
  const r=()=>0.3; let L=A.botLook(r,10,0); assert.strictEqual(L.mount,null); assert.strictEqual(L.pet,null); assert.strictEqual(L.wing,null);
  L=A.botLook(r,37,2); assert.strictEqual(L.mount,null); assert.ok(L.pet);
  L=A.botLook(r,38,2); assert.ok(L.mount&&L.mount.stars>=1); assert.strictEqual(L.wing,null);
  L=A.botLook(r,50,3); assert.ok(L.wing);
  for(let i=0;i<50;i++){ const x=A.botLook(Math.random,120,6); assert.ok(!x.pet||!/era7_|era8_/.test(x.pet.base),'era 6 não tem pet das eras 7-8'); }
});
t('lista: robô traz look e level perto do nível do jogador',()=>{ const h=makeHost({level:40,eraMax:2}), S={}; const L=A.opponents(S,h);
  assert.ok(L.length&&L.every(o=>o.look&&Math.abs(o.level-40)<=2)); });
t('prêmio por luta: ouro sempre, 1 gema na 1ª vitória do dia, baú na 3ª luta; credita pelo host',()=>{ const h=makeHost({level:40,eraMax:2}), S={}; const out=[];
  for(let i=0;i<3;i++){ const L=A.opponents(S,h); out.push(A.fight(S,h,L[0].id)); }
  assert.ok(out.every(r=>r.ok&&r.rewards&&r.rewards.gold>0)); const gems=out.reduce((a,r)=>a+r.rewards.gems,0); assert.ok(gems<=1);
  assert.strictEqual(out[2].rewards.chest,1); assert.strictEqual(out[0].rewards.chest+out[1].rewards.chest,0);
  assert.strictEqual(h.gold,out.reduce((a,r)=>a+r.rewards.gold,0)); assert.strictEqual(h.gems,gems); });
t('provider com rewards (servidor): vale o dele',()=>{ const h=makeHost({level:40,eraMax:2}), S={}; const old=A.getProvider();
  A.setProvider(Object.assign({},A.localProvider,{fight:(S2,h2,opp)=>({ok:true,win:true,delta:10,rewards:{gold:7,gems:0,chest:0}})}));
  try{ const L=A.opponents(S,h); const r=A.fight(S,h,L[0].id); assert.deepStrictEqual(r.rewards,{gold:7,gems:0,chest:0}); assert.strictEqual(h.gold,7); } finally{ A.setProvider(old); } });
t('servidor manda gold:null + goldk: o jogo calcula pelo goldUnit e credita uma vez',()=>{ const h=makeHost({level:40,eraMax:2,unit:4}), S={}; const old=A.getProvider();
  A.setProvider(Object.assign({},A.localProvider,{fight:()=>({ok:true,win:true,delta:10,rewards:{gold:null,goldk:40,gems:1,chest:0}})}));
  try{ const L=A.opponents(S,h); const r=A.fight(S,h,L[0].id); assert.strictEqual(r.rewards.gold,160); assert.strictEqual(h.gold,160); assert.strictEqual(h.gems,1); } finally{ A.setProvider(old); } });
console.log(n+' testes ok');
