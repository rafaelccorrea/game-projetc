// node test/sys/camp-tenda.test.js — Sys.camp.collectTent (pedido do Engenheiro): coletar UMA tenda, com a mesma conta do coletar tudo
// (tetos, arredondamento, Tenda do Ouro com teto de 5 min de abate). Coletar as 3 tendas uma a uma = coletar tudo.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['forge','practice','vip','pet','camp'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const C=Sys.camp, P=Sys.pet;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=o=>{ const h=makeHost(Object.assign({level:25,unit:1},o)); h.canSpendGold=g=>h.gold>=g; h.spendGold=g=>{ if(h.gold<g) return false; h.gold-=g; return true; }; return h; };
const hours=(h,x)=>{ h.t+=x*3600000; };
const withOn=fn=>{ C.setOn(true); try{ fn(); } finally{ C.setOn(false); } };
const petSave=()=>{ const S={}; const o=P.ensure(S); o.owned.wolf={stars:1,frags:0,lvl:1}; o.owned.drake={stars:3,frags:0,lvl:1}; o.owned.golem={stars:1,frags:0,lvl:1}; o.eq='wolf'; P.ensure(S); return S; };

t('desligado / tenda que não existe / antes do Nv 20',()=>{
  const S={}, h=host(); assert.strictEqual(C.collectTent(S,h,'gold').reason,'off'); assert.deepStrictEqual(S,{});
  withOn(()=>{ assert.strictEqual(C.collectTent({},host(),'xx').reason,'id');
    const S2={}, h2=host({level:10}); C.ensure(S2,h2); hours(h2,3); const r=C.collectTent(S2,h2,'forge'); assert.strictEqual(r.reason,'locked'); assert.deepStrictEqual(r.got,{gold:0,forge:0,practice:0}); });
});

t('coletar por tenda bate com o coletar tudo (frações, pets, níveis, teto do ouro em 5 min de abate, teto de 8 h)',()=>withOn(()=>{
  for(const [dt,unit,capH] of [[0.37,1],[2.5,1],[7.9,3.3],[100,1],[100,7.5],[100,1,60],[100,2.2,60]]){ const capH0=C.DATA.capHours; if(capH) C.DATA.capHours=capH;   // 60 h: o ouro bate no teto de 5 min de abate antes do teto de horas
    try{
    const mk=()=>{ const S=petSave(), h=host({unit}); C.ensure(S,h); C.assign(S,h,'forge','drake'); C.assign(S,h,'practice','golem'); S.sys.camp.tents.practice.lv=4; hours(h,dt); return {S,h}; };
    const A=mk(), B=mk();
    const all=C.collect(A.S,A.h);
    const g=C.collectTent(B.S,B.h,'gold'), f=C.collectTent(B.S,B.h,'forge'), p=C.collectTent(B.S,B.h,'practice');
    assert.deepStrictEqual({gold:g.got.gold,forge:f.got.forge,practice:p.got.practice},all.got,'soma das tendas = tudo (dt '+dt+', unit '+unit+')');
    assert.deepStrictEqual([g.got.forge,g.got.practice,f.got.gold,f.got.practice,p.got.gold,p.got.forge],[0,0,0,0,0,0],'cada uma só traz o seu recurso');
    assert.deepStrictEqual(Object.values(B.S.sys.camp.tents).map(x=>x.acc),Object.values(A.S.sys.camp.tents).map(x=>x.acc),'a fração que fica é a mesma');
    assert.strictEqual(B.h.gold,A.h.gold); const st=(S,k)=>(S.sys[k]&&S.sys[k].stones)|0; assert.strictEqual(st(B.S,"forge"),st(A.S,"forge")); assert.strictEqual(st(B.S,"practice"),st(A.S,"practice"));
    if(capH) assert.strictEqual(g.got.gold,Math.floor(5*24*unit),'Tenda do Ouro: teto de 5 min de abate');
    else if(dt>=100) assert.strictEqual(g.got.gold,Math.floor(3*8*unit),'teto de 8 h');
    assert.strictEqual(g.tent,'gold');
    } finally { C.DATA.capHours=capH0; }
  }
}));

t('coletar uma tenda não mexe nas outras (elas seguem enchendo) e a vazia dá empty',()=>withOn(()=>{
  const S={}, h=host(); C.ensure(S,h); hours(h,2);
  const r=C.collectTent(S,h,'forge'); assert.deepStrictEqual(r.got,{gold:0,forge:2,practice:0}); assert.strictEqual(r.ok,true);
  const v=C.view(S,h).tents; assert.deepStrictEqual(v.map(x=>x.stored),[6,0,4]); assert.strictEqual(h.gold,0);
  assert.strictEqual(C.collectTent(S,h,'forge').reason,'empty');
  hours(h,1); assert.deepStrictEqual(C.collect(S,h).got,{gold:9,forge:1,practice:6});
  assert.strictEqual(C.canUpgrade(S,h,'gold').reason,'fixed','Tenda do Ouro continua sem Melhorar');
}));

console.log(`ok: ${n} testes`);
