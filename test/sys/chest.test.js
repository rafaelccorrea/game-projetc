// node test/sys/chest.test.js
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');      // registra Sys.loot (tabela da era, materiais, contador do dia)
const C=require('../../js/sys/chest.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const clean=()=>{ delete globalThis.Sys.forge; delete globalThis.Sys.pet; delete globalThis.Sys.practice; };

t('ensure: padrão, save v1 (40 abates) e valores inválidos',()=>{
  const S={}; C.ensure(S); assert.deepStrictEqual(S.sys.chest,{v:2,charge:0,stored:0,opened:0,day:'',today:0});
  const S1={sys:{chest:{v:1,charge:39,stored:1,opened:4}}}; C.ensure(S1); assert.strictEqual(S1.sys.chest.charge,39); assert.strictEqual(S1.sys.chest.stored,1);
  const S2={sys:{chest:{charge:'x',stored:99,opened:-3,today:'a'}}}; C.ensure(S2);
  assert.strictEqual(S2.sys.chest.stored,3); assert.strictEqual(S2.sys.chest.charge,0); assert.strictEqual(S2.sys.chest.today,0);
  assert.throws(()=>C.ensure(undefined));
});

t('enche por abate: 250 pontos = 1 baú; chefe vale 5, Senhor da Era 10',()=>{
  const S={}, h=makeHost(); for(let i=0;i<249;i++) C.onKill(S,{},h); assert.strictEqual(C.progress(S,h).stored,0);
  assert.strictEqual(C.onKill(S,{},h).gained,1); assert.strictEqual(C.progress(S,h).charge,0);
  C.onKill(S,{boss:true},h); assert.strictEqual(C.progress(S,h).charge,5);
  C.onKill(S,{boss:true,eraBoss:true},h); assert.strictEqual(C.progress(S,h).charge,15);
});

t('acumula no máximo 3 e a barra para em 100%',()=>{
  const S={}, h=makeHost(); C.onKills(S,100000,h); const p=C.progress(S,h);
  assert.strictEqual(p.stored,3); assert.ok(p.full); assert.strictEqual(p.charge,250); assert.strictEqual(p.pct,1);
});

t('TETO DIÁRIO de 8 baús ganhos: depois a barra para ("volte amanhã"); renova à meia-noite',()=>{
  clean(); const S={}, h=makeHost({seed:5});
  let opened=0; for(let i=0;i<20;i++){ C.onKills(S,1000,h); while(C.open(S,h)) opened++; }
  const p=C.progress(S,h); assert.strictEqual(opened,8); assert.ok(p.capped); assert.strictEqual(p.left,0); assert.strictEqual(p.stored,0);
  assert.strictEqual(C.onKill(S,{},h).gained,0); assert.strictEqual(p.charge,250,'barra parada cheia');
  h.t=new Date(2026,10,13,0,0,1).getTime(); const p2=C.progress(S,h); assert.ok(!p2.capped); assert.strictEqual(p2.today,0);
  C.onKill(S,{},h); assert.strictEqual(C.progress(S,h).stored,1,'a carga parada vira baú no dia seguinte');
});

t('abrir dá 3-5 itens e moedas pelo host; carga parada vira baú ao abrir',()=>{
  clean(); const S={}, h=makeHost({seed:21,eraMax:2,unit:10}); C.onKills(S,5000,h);
  const r=C.open(S,h); assert.ok(r.items.length>=3&&r.items.length<=5);
  assert.strictEqual(h.items.length,r.items.length); assert.ok(r.gold>=150&&r.gold<=300); assert.strictEqual(h.gold,r.gold);
  assert.strictEqual(C.progress(S,h).stored,3,'carga cheia virou baú'); assert.strictEqual(C.progress(S,h).today,4);
  while(C.open(S,h)); assert.strictEqual(C.open(S,h),null);
});

t('pedra de forja 60% de 1-3 e ração 10% de 1; contam no dia e vão para Sys.forge/Sys.pet',()=>{
  clean(); let fo=0,fd=0,boxes=0; const got={forge:0,food:0};
  globalThis.Sys.forge={addStones:(S,n)=>{ got.forge+=n; }}; globalThis.Sys.pet={addFood:(S,n)=>{ got.food+=n; },addEgg:()=>({})};
  const h=makeHost({seed:13});
  for(let d=0;d<500;d++){ const S={}; h.t+=86400000; C.onKills(S,250,h); const r=C.open(S,h); boxes++; fo+=r.forge; fd+=r.food;
    assert.ok(r.forge===0||(r.forge>=1&&r.forge<=3)); assert.ok(r.food===0||r.food===1); assert.strictEqual(L.todayCount(S,h,'forge'),r.forge); }
  assert.ok(Math.abs(fo/boxes-1.2)<0.15,'forja '+fo/boxes); assert.ok(Math.abs(fd/boxes-0.1)<0.04,'ração '+fd/boxes);
  assert.strictEqual(got.forge,fo); assert.strictEqual(got.food,fd); clean();
});

t('raridade do baú melhor que drop comum; arma nunca Mítica',()=>{
  clean(); const h=makeHost({seed:8,eraMax:0}); let hi=0, tot=0;
  for(let i=0;i<400;i++){ const S={}; h.t+=86400000; C.onKills(S,250,h); const r=C.open(S,h); for(const it of r.items){ tot++; if(it.r>=1) hi++; } }
  assert.ok(hi/tot>0.36&&hi/tot<0.46,'r>=1 '+(hi/tot));
  assert.ok(h.items.every(it=>it.r<=4&&it.e===0)); assert.ok(!h.items.some(it=>it.slot==='weapon'&&it.r===3));
});

t('PORTÕES no baú: nível 9 só Básico; nível 30 até Épico',()=>{
  const h=makeHost({level:9,eraMax:6,seed:44});
  for(let i=0;i<200;i++){ const S={}; h.t+=86400000; C.onKills(S,250,h); C.open(S,h); }
  assert.ok(h.items.length>0&&h.items.every(it=>it.r===0));
  const h2=makeHost({level:30,eraMax:6,seed:45});
  for(let i=0;i<300;i++){ const S={}; h2.t+=86400000; C.onKills(S,250,h2); C.open(S,h2); }
  assert.ok(h2.items.every(it=>it.r<=2)&&h2.items.some(it=>it.r===2));
});

t('VIP: teto do baú 8→12 por dia',()=>{
  clean(); globalThis.Sys.vip={perks:()=>({chestCapAdd:4})};
  const S={}, h=makeHost({seed:6}); let opened=0; for(let i=0;i<30;i++){ C.onKills(S,1000,h); while(C.open(S,h)) opened++; }
  assert.strictEqual(opened,12); assert.strictEqual(C.progress(S,h).cap,12); delete globalThis.Sys.vip;
});

t('multiplicadores configuráveis: velocidade, itens, estoque, teto do dia',()=>{
  const h=makeHost({seed:3});
  C.params.mult.speed=2; assert.strictEqual(C.need(),125); C.params.mult.speed=1;
  C.params.maxStoredAdd=2; const S={}; C.onKills(S,99999,h); assert.strictEqual(C.progress(S,h).stored,5); C.params.maxStoredAdd=0;
  C.params.dailyCapAdd=4; assert.strictEqual(C.dailyCap(),12); C.params.dailyCapAdd=0;
  C.params.mult.items=2; const S2={}; C.onKills(S2,250,h); const r=C.open(S2,h); assert.ok(r.items.length>=6&&r.items.length<=10); C.params.mult.items=1;
  C.params.mult.speed=0; assert.ok(C.need()>=1); C.params.mult.speed=1;
});

t('pedras de prática só se Sys.practice existir',()=>{
  clean(); const h=makeHost({seed:1}); const S={}; C.onKills(S,250,h); assert.strictEqual(C.open(S,h).stones,0);
  let got=0; globalThis.Sys.practice={addStones:(S,n)=>{ got+=n; }};
  let st=0; for(let i=0;i<40;i++){ const S3={}; C.onKills(S3,250,h); st+=C.open(S3,h).stones; }
  assert.ok(st>0&&st===got); clean();
});

t('funciona sem Sys.loot (reserva)',()=>{
  const saved=globalThis.Sys.loot; delete globalThis.Sys.loot;
  const S={}, h=makeHost({seed:4,eraMax:1}); C.onKills(S,250,h); const r=C.open(S,h); assert.ok(r.items.length>=3); assert.ok(r.items.every(it=>it.e===1));
  globalThis.Sys.loot=saved;
});

t('valores inválidos não quebram',()=>{
  const S={}, h=makeHost(); assert.strictEqual(C.addCharge(S,NaN,h).gained,0); assert.strictEqual(C.onKills(S,-5,h).gained,0); C.onKill(S,null,h);
  assert.strictEqual(C.progress(S,h).charge,1); C.onKill(S,{}); assert.strictEqual(C.progress(S).charge,2,'sem host usa o relógio do sistema');
});
console.log(`\nchest: ${n} testes ok`);
