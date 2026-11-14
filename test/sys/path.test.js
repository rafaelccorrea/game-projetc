// node test/sys/path.test.js — Sys.path: caminho de luta do Nv 30 (Lâmina, Disparo, Arcano). 1 troca grátis por semana, nada pago. Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
require('../../js/sys/path.js');
require('../../js/sys/strikes.js');
require('../../js/sys/affinity.js');
require('../../js/sys/pathtry.js');
const {makeHost}=require('./_host.js');
const P=Sys.path, K=Sys.strikes, A=Sys.affinity, T=Sys.pathTry;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ P.setOn(true); try{ fn(); } finally{ P.setOn(false); } };
const DAY=86400000;

t('DESLIGADO: recusa, não grava, perfil/estilo nulos, strikes e afinidade iguais',()=>{
  assert.strictEqual(P.DATA.on,false); const S={}, h=makeHost({level:40});
  assert.strictEqual(P.choose(S,h,'blade').reason,'off'); assert.strictEqual(P.change(S,h,'shot').reason,'off'); assert.deepStrictEqual(S,{});
  const S2={sys:{path:{id:'arcane'}}};
  assert.strictEqual(P.current(S2),null); assert.strictEqual(P.profile(S2),null); assert.strictEqual(P.styleOf(S2),null); assert.deepStrictEqual(P.statOf(S2),{});
  assert.strictEqual(P.chosen(S2),'arcane','leitura crua do save continua (pathTry/affinity já liam S.sys.path.id)');
  K.setOn(true); try{ const pr=K.profile(S2,h); assert.strictEqual(pr.path,undefined); assert.ok(Object.values(pr.raw).every(v=>v===0)); } finally{ K.setOn(false); }
  A.setOn(true); try{ assert.strictEqual(A.mult(S2,makeHost(),15),1.15,'arcano gravado vale como antes'); } finally{ A.setOn(false); }
  assert.strictEqual(P.view(S2,h).on,false);
});

t('números = os do ensaio (pathTry lê daqui) e nada pago',()=>{
  assert.deepStrictEqual(P.DATA.paths.map(p=>[p.id,p.name,p.strikes,p.stat]),[
    ['blade','Lâmina',{counter:8,lifesteal:5},{}],['shot','Disparo',{combo:8},{aspd:10}],['arcane','Arcano',{stun:3},{critDmg:20}]]);
  assert.deepStrictEqual(T.DATA.paths.map(p=>p.strikes),P.DATA.paths.map(p=>p.strikes),'reserva do pathTry igual');
  T.setOn(true); try{ assert.deepStrictEqual(T.battle('shot').bonus.stat,{aspd:10}); } finally{ T.setOn(false); }
  assert.strictEqual(P.DATA.changesPerWeek,1); assert.ok(!/gem|price|cost/i.test(JSON.stringify(P.DATA)));
});

t('escolha: Nv 30, id válido, uma vez; não muda o herói',()=>withOn(()=>{
  const S={hero:{skin:'kael'}}, h=makeHost({level:29});
  assert.deepStrictEqual(P.choose(S,h,'blade'),{ok:false,reason:'level',need:30}); assert.strictEqual(S.sys,undefined);
  h._level=30; assert.strictEqual(P.choose(S,h,'xx').reason,'id');
  assert.ok(P.choose(S,h,'blade').ok); assert.strictEqual(P.current(S),'blade'); assert.strictEqual(P.choose(S,h,'shot').reason,'chosen');
  assert.deepStrictEqual(S.hero,{skin:'kael'}); assert.strictEqual(P.freeLeft(S,h),1,'escolher não gasta a troca');
}));

t('troca: 1 grátis por semana (segunda-feira), sem custo; mesma/sem caminho recusa',()=>withOn(()=>{
  const thu=new Date(2026,10,12,10,0,0).getTime(), S={}, h=makeHost({level:40,now:thu});
  assert.strictEqual(P.change(S,h,'shot').reason,'none');
  P.choose(S,h,'blade'); assert.strictEqual(P.change(S,h,'blade').reason,'same');
  const r=P.change(S,h,'shot'); assert.ok(r.ok); assert.strictEqual(r.from,'blade'); assert.strictEqual(h.gold,0); assert.strictEqual(h.gems,0);
  const w=P.change(S,h,'arcane'); assert.strictEqual(w.reason,'week'); assert.strictEqual(w.next,new Date(2026,10,16).getTime(),'próxima segunda');
  assert.strictEqual(P.nextFreeChange(S,h),new Date(2026,10,16).getTime());
  h.t=new Date(2026,10,15,23,59).getTime(); assert.strictEqual(P.change(S,h,'arcane').reason,'week','domingo ainda é a mesma semana');
  h.t=new Date(2026,10,16,0,1).getTime(); assert.strictEqual(P.nextFreeChange(S,h),0); assert.ok(P.change(S,h,'arcane').ok);
  assert.strictEqual(S.sys.path.changes,2); assert.strictEqual(P.current(S),'arcane');
}));

t('perfil soma no Sys.strikes (antes do teto) e estilo vai para a afinidade',()=>withOn(()=>{
  const S={sys:{path:{id:'blade'}}}, h=makeHost({level:40});
  assert.deepStrictEqual(P.profile(S),{id:'blade',name:'Lâmina',strikes:{counter:8,lifesteal:5},stat:{}});
  assert.deepStrictEqual(K.profile(S,h).raw,{combo:0,counter:0,stun:0,dodge:0,lifesteal:0},'strikes desligado: zeros');
  K.setOn(true); try{ const pr=K.profile(S,h); assert.strictEqual(pr.raw.counter,8); assert.strictEqual(pr.raw.lifesteal,5); assert.strictEqual(pr.boss.lifesteal,5);
    assert.deepStrictEqual(pr.path,{id:'blade',name:'Lâmina',strikes:{counter:8,lifesteal:5}}); } finally{ K.setOn(false); }
  assert.deepStrictEqual(P.statOf({sys:{path:{id:'shot'}}}),{aspd:10});
  assert.strictEqual(P.styleOf(S),'blade');
  A.setOn(true); try{ assert.strictEqual(A.heroStyle(S,makeHost()),'blade'); assert.strictEqual(A.mult(S,makeHost(),1),1.15,'Pré-História fraca contra Lâmina'); } finally{ A.setOn(false); }
}));

t('tela e save torto',()=>withOn(()=>{
  const S={}, h=makeHost({level:40}), v=P.view(S,h);
  assert.strictEqual(v.unlocked,true); assert.strictEqual(v.chosen,null); assert.strictEqual(v.paid,false); assert.strictEqual(v.paths.length,3); assert.ok(v.paths[0].canChoose.ok);
  P.choose(S,h,'shot'); const v2=P.view(S,h); assert.strictEqual(v2.chosenName,'Disparo'); assert.strictEqual(v2.paths[1].chosen,true); assert.ok(v2.paths[0].canChange.ok);
  assert.strictEqual(v2.nextFreeChange,0); assert.strictEqual(P.view({},makeHost({level:5})).unlocked,false);
  const B={sys:{path:{id:'zz',wk:5,changes:-2}}}; P.ensure(B); assert.deepStrictEqual(B.sys.path,{id:null,wk:'',changes:0,v:1,at:0});
  assert.ok(Object.values(P.bonus()).every(x=>x===0));
}));

console.log(`path: ${n} ok`);
