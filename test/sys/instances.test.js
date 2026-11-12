// node test/sys/instances.test.js
'use strict';
const assert=require('assert');
require('../../js/sys/loot.js');
const I=require('../../js/sys/instances.js');
const {makeHost:mh}=require('./_host.js');
const makeHost=o=>mh(Object.assign({stage:70},o));   // por padrão o jogador já passou de todas as fases (o cadeado é testado à parte)
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const ALL={gold:2,gear:2,boss:2,gems:2};

t('ensure: padrão, save antigo e lixo',()=>{
  const S={}; I.ensure(S); const o=S.sys.instances; assert.deepStrictEqual(o.keys,ALL); assert.strictEqual(o.active,null); assert.deepStrictEqual(o.best,{});
  const S2={sys:{instances:{keys:'x',best:{gold:2,xx:5,gear:'a'},active:{type:'nada'},runs:-1}}}; I.ensure(S2);
  assert.deepStrictEqual(S2.sys.instances.keys,ALL); assert.deepStrictEqual(S2.sys.instances.best,{gold:2}); assert.strictEqual(S2.sys.instances.active,null);
  const S3={sys:{instances:{keys:3}}}; I.ensure(S3); assert.deepStrictEqual(S3.sys.instances.keys,ALL,'save antigo (3 no total) vira 2 por área');
  const S4={sys:{instances:{keys:{gold:'z',gear:1,boss:-4,gems:2,xx:9}}}}; I.ensure(S4); assert.deepStrictEqual(S4.sys.instances.keys,{gold:2,gear:1,boss:0,gems:2});
  assert.throws(()=>I.ensure(0));
});

t('2 entradas POR ÁREA por dia (8 no total); virada à meia-noite local renova sem acumular',()=>{
  const S={}, h=makeHost({eraMax:1,stage:15});
  for(let k=0;k<2;k++){ const r=I.start(S,h,'gems',0); assert.ok(r.ok); assert.ok(I.finish(S,h,r.run.id,{win:true}).win); }
  assert.strictEqual(I.status(S,h).keys.gems,0); assert.strictEqual(I.start(S,h,'gems',0).reason,'chave'); assert.ok(I.start(S,h,'gold',0).ok,'outra área continua aberta'); I.abort(S);
  assert.strictEqual(I.status(S,h).total,6); assert.strictEqual(I.status(S,h).totalMax,8);
  h.t=new Date(2026,10,12,23,59,59).getTime(); assert.strictEqual(I.status(S,h).keys.gems,0);
  h.t=new Date(2026,10,13,0,0,1).getTime(); assert.deepStrictEqual(I.status(S,h).keys,ALL);
  h.t=new Date(2026,10,15,9,0,0).getTime(); assert.deepStrictEqual(I.status(S,h).keys,ALL,'não acumula');
  assert.strictEqual(S.sys.instances.day,'2026-11-15');
});

t('derrota não gasta entrada (padrão) e não dá recompensa',()=>{
  const S={}, h=makeHost(); const r=I.start(S,h,'gear',0); const out=I.finish(S,h,r.run.id,{win:false});
  assert.strictEqual(out.win,false); assert.strictEqual(out.keys,2); assert.strictEqual(h.items.length,0); assert.strictEqual(h.gold,0);
  I.DATA.consumeOnFail=true; const r2=I.start(S,h,'gear',0); assert.strictEqual(I.finish(S,h,r2.run.id,{win:false}).keys,1); I.DATA.consumeOnFail=false;
});

t('finish exige a entrada ativa certa',()=>{
  const S={}, h=makeHost(); assert.strictEqual(I.finish(S,h,'x',{win:true}).reason,'sem_entrada');
  const r=I.start(S,h,'gold',0); assert.strictEqual(I.finish(S,h,'outro',{kills:9}).ok,false); assert.ok(I.finish(S,h,r.run.id,{kills:9}).ok);
  assert.strictEqual(I.finish(S,h,r.run.id,{kills:9}).ok,false,'não paga duas vezes');
});

t('entrada abandonada expira em 15 min sem gastar entrada',()=>{
  const S={}, h=makeHost(); const r=I.start(S,h,'gold',0); h.t+=16*60*1000;
  assert.strictEqual(I.status(S,h).active,null); assert.strictEqual(I.finish(S,h,r.run.id,{kills:5}).ok,false); assert.strictEqual(I.status(S,h).keys.gold,2);
});

t('níveis: 3 dificuldades por era liberada; recomendado pela fase',()=>{
  const h=makeHost({eraMax:2,stage:17}); assert.strictEqual(I.levelsUnlocked(h),9);
  assert.strictEqual(I.recommended({},h),4); // era 1 Normal = fase 16
  assert.deepStrictEqual([I.levelInfo(4).era,I.levelInfo(4).d,I.levelInfo(4).stage],[1,1,16]);
  assert.strictEqual(I.start({},h,'gold',9).reason,'nivel'); assert.strictEqual(I.start({},h,'gold',1.5).reason,'nivel');
  assert.strictEqual(I.start({},h,'xyz',0).reason,'tipo');
});

t('definição da horda para a batalha',()=>{
  const h=makeHost({eraMax:3}); const S={};
  const g=I.start(S,h,'gold',2).run; assert.strictEqual(g.mode,'rush'); assert.ok(g.loop); assert.strictEqual(g.time,45); assert.strictEqual(g.waves.length,1);
  assert.ok(g.noNormalLoot&&g.noChest); assert.strictEqual(g.stage,9); assert.ok(Math.abs(g.waves[0][0].hpMult-0.6*1.25)<1e-9);
  I.abort(S); const b=I.start(S,h,'boss',3).run; assert.strictEqual(b.waves[0][0].kind,'boss'); assert.ok(b.waves[0][0].eraBoss); assert.strictEqual(b.goal,'boss');
  I.abort(S); const a=I.start(S,h,'gear',0).run; assert.strictEqual(a.waves.length,3); assert.strictEqual(a.waves[2][2].kind,'boss'); assert.strictEqual(a.waves[2][2].eraBoss,false);
});

t('recompensas: ouro por abate, itens com raridade mínima, gemas por era',()=>{
  const h=makeHost({eraMax:2,unit:10,seed:5}); const S={};
  let r=I.start(S,h,'gold',0); let out=I.finish(S,h,r.run.id,{kills:30}); assert.ok(out.reward.gold>0); assert.strictEqual(h.gold,out.reward.gold);
  r=I.start(S,h,'gear',8); out=I.finish(S,h,r.run.id,{win:true}); // era 2 Difícil: minR 1+1=2
  assert.strictEqual(out.reward.items.length,3); assert.ok(out.reward.items.every(it=>it.r>=2&&it.e===2));
  r=I.start(S,h,'gems',6); out=I.finish(S,h,r.run.id,{win:true}); assert.strictEqual(out.reward.gems,3); // era 2 Fácil: 3 fixos (corte v0.12.0, sem o +2 por era)
  assert.strictEqual(I.rewardPreview('gems',8,h).gems,8); // 3*2,5 = 7,5 → 8
  assert.strictEqual(I.rewardPreview('gold',0,h,0).gold,0);
});

t('Mina de Ouro: 0 abates = derrota (sem gastar entrada)',()=>{
  const S={}, h=makeHost(); const r=I.start(S,h,'gold',0); const out=I.finish(S,h,r.run.id,{kills:0});
  assert.strictEqual(out.win,false); assert.strictEqual(out.keys,2);
});

t('varrer: só nível já vencido, gasta entrada da área, usa recorde de abates',()=>{
  const S={}, h=makeHost({eraMax:1,unit:10}); assert.strictEqual(I.sweep(S,h,'gold',0).ok,false);
  const r=I.start(S,h,'gold',0); I.finish(S,h,r.run.id,{kills:40});
  const g0=h.gold; const s=I.sweep(S,h,'gold',0); assert.ok(s.ok); assert.strictEqual(s.kills,40); assert.strictEqual(h.gold-g0,s.reward.gold);
  assert.strictEqual(I.status(S,h).keys.gold,0,'2 da Mina gastos (entrar + varrer)'); assert.strictEqual(I.canSweep(S,h,'gold',0),false,'sem entrada na área');
  assert.strictEqual(I.status(S,h).keys.gear,2,'as outras áreas não gastam');
});

t('entradas extras como parâmetro (por área)',()=>{
  I.params.extraKeys=2; const S={}, h=makeHost(); assert.strictEqual(I.status(S,h).keys.boss,4); assert.strictEqual(I.status(S,h).totalMax,16); I.params.extraKeys=0;
});

t('Arsenal dá pedras de forja 3/5/8 e elas contam na missão do dia',()=>{
  delete globalThis.Sys.forge; delete globalThis.Sys.pet;
  const L=globalThis.Sys.loot, h=makeHost({eraMax:0,seed:3});
  for(const [d,exp] of [[0,3],[1,5],[2,8]]){ const S={}; const r=I.start(S,h,'gear',d); const out=I.finish(S,h,r.run.id,{win:true});
    assert.strictEqual(out.reward.forge,exp); assert.strictEqual(L.todayCount(S,h,'forge'),exp); assert.strictEqual(L.pending(S).forge,exp); }
  assert.strictEqual(I.rewardPreview('gear',1,h).forge,5);
});

t('Chefe de Era: ração 5/7/10 e ovo 15/25/40% (tabela 34/35/18/12/1; Lendário só no Difícil)',()=>{
  delete globalThis.Sys.forge; let eggs=[]; globalThis.Sys.pet={addFood:()=>{},addEgg:(S,h,o)=>{ eggs.push(o.r); return {pet:o.r}; }};
  const h=makeHost({eraMax:6,seed:17});   // era 6: portões abertos (mede a tabela pura)
  assert.deepStrictEqual([0,1,2].map(d=>I.rewardPreview('boss',d,h).food),[5,7,10]);
  const run=(L,N)=>{ eggs=[]; let got=0; for(let i=0;i<N;i++){ const S={}; const r=I.start(S,h,'boss',L); const out=I.finish(S,h,r.run.id,{win:true}); if(out.reward.egg>=0) got++; } return got/N; };
  const pe=run(0,6000); assert.ok(Math.abs(pe-0.15)<0.015,'Fácil '+pe); assert.ok(!eggs.includes(4),'sem Lendário no Fácil');
  const pn=run(1,6000); assert.ok(Math.abs(pn-0.25)<0.02,'Normal '+pn);
  const pd=run(2,20000); assert.ok(Math.abs(pd-0.40)<0.012,'Difícil '+pd);
  const c=[0,0,0,0,0]; eggs.forEach(r=>c[r]++); const tot=eggs.length;
  assert.ok(Math.abs(c[3]/tot-0.12)<0.025,'Mítico '+(c[3]/tot)); assert.ok(c[4]>0,'Lendário aparece no Difícil');
  delete globalThis.Sys.pet;
});

t('Chefe de Era Difícil: ~10% das armas Lendárias (resto Épico, sem Mítica)',()=>{
  const h=makeHost({eraMax:6,seed:77}); let w=0,leg=0;   // portões abertos
  for(let i=0;i<12000;i++){ const S={}; const r=I.start(S,h,'boss',11); I.finish(S,h,r.run.id,{win:true}); }
  for(const it of h.items) if(it.slot==='weapon'){ w++; if(it.r===4) leg++; assert.ok(it.r===2||it.r===4); }
  assert.ok(Math.abs(leg/w-0.10)<0.015,'Lendária '+(leg/w));
});

t('no máximo 1 ovo de instância por dia; renova à meia-noite',()=>{
  delete globalThis.Sys.pet; const h=makeHost({eraMax:2,seed:5}); const S={}; let eggs=0,days=0;
  for(let d=0;d<300;d++){ h.t+=86400000; days++; let today=0;
    for(let k=0;k<2;k++){ const r=I.start(S,h,'boss',8); assert.ok(r.ok,'2 entradas no Chefe de Era'); const out=I.finish(S,h,r.run.id,{win:true}); if(out.reward.egg>=0) today++; }
    assert.ok(today<=1,'dia com '+today+' ovos'); eggs+=today; }
  const exp=1-Math.pow(0.6,2); assert.ok(Math.abs(eggs/days-exp)<0.07,'ovos/dia '+(eggs/days)+' (esperado ~'+exp.toFixed(2)+')');
});

t('arma Mítica nunca sai das instâncias (lançamento)',()=>{
  const h=makeHost({eraMax:6,seed:23});   // portões abertos (a armadura Mítica precisa de era 4+)
  for(let i=0;i<600;i++){ const S={}; const r=I.start(S,h,'boss',11); I.finish(S,h,r.run.id,{win:true}); }
  assert.ok(!h.items.some(it=>it.slot==='weapon'&&it.r===3)); assert.ok(h.items.some(it=>it.slot==='armor'&&it.r===3));
});

t('cadeado por fase: Fácil abre na fase 3, Normal na 6, Difícil na 9 de cada era',()=>{
  const S={}, h=mh({eraMax:1,stage:5});
  assert.strictEqual(I.levelsUnlocked(h),6,'visíveis: 3 por era liberada');
  assert.ok(I.isOpen(h,0)); assert.ok(!I.isOpen(h,1)); assert.ok(!I.isOpen(h,3));
  const r=I.start(S,h,'boss',1); assert.strictEqual(r.reason,'bloqueado'); assert.strictEqual(r.unlockAt,6);
  h._stage=9; assert.ok(I.isOpen(h,2)); assert.ok(!I.isOpen(h,3),'era 1 Fácil = fase 13');
  h._stage=13; assert.ok(I.isOpen(h,3));
  const h2=mh({eraMax:0,stage:2}); h2.best=()=>9; assert.ok(I.isOpen(h2,2),'usa host.best() quando o jogo expõe');
  const S3={}, h3=mh({eraMax:0,stage:9}); const run=I.start(S3,h3,'gold',2).run; I.finish(S3,h3,run.id,{kills:5});
  h3._stage=4; assert.strictEqual(I.canSweep(S3,h3,'gold',2),false,'varrer também respeita o cadeado');
});

t('PORTÕES nas instâncias: Lendária do Difícil e ovo Mítico/Lendário só com o portão aberto',()=>{
  delete globalThis.Sys.pet;
  const lo=makeHost({level:60,eraMax:6,seed:91}); const eggs=[];
  for(let i=0;i<4000;i++){ const S={}; const r=I.start(S,lo,'boss',20); const out=I.finish(S,lo,r.run.id,{win:true}); if(out.reward.egg>=0) eggs.push(out.reward.egg); }
  assert.ok(lo.items.every(it=>it.r<=2),'nível 60: nada acima de Épico'); assert.ok(eggs.every(r=>r<=2)&&eggs.length>0,'ovo no máximo Épico');
  const hi=makeHost({level:90,eraMax:6,seed:92});
  for(let i=0;i<4000;i++){ const S={}; const r=I.start(S,hi,'boss',20); I.finish(S,hi,r.run.id,{win:true}); }
  assert.ok(hi.items.some(it=>it.slot==='weapon'&&it.r===4),'nível 90 era 6: Lendária volta a sair');
});

t('XP da instância: Sys.level.onInstance com o multiplicador da dificuldade (1 / 1,6 / 2,5), só na vitória',()=>{
  const calls=[]; globalThis.Sys.level={onInstance:(S,h,m)=>{ calls.push(m); return {gained:Math.round(100*(m||1)),levels:0}; }};
  const h=makeHost({eraMax:0});
  for(const d of [0,1,2]){ const S={}; const r=I.start(S,h,'gems',d); const out=I.finish(S,h,r.run.id,{win:true}); assert.strictEqual(out.reward.xp,Math.round(100*[1,1.6,2.5][d])); }
  assert.deepStrictEqual(calls,[1,1.6,2.5]);
  const S={}; const r=I.start(S,h,'gear',0); I.finish(S,h,r.run.id,{win:false}); assert.strictEqual(calls.length,3,'derrota não dá XP');
  delete globalThis.Sys.level;
});

t('VIP: +1 entrada POR ÁREA por dia e +50% de ouro',()=>{
  globalThis.Sys.vip={perks:()=>({instanceKeysAdd:1,goldPct:50})};
  const h=makeHost({eraMax:0,unit:10}); const S={}; assert.deepStrictEqual(I.status(S,h).keys,{gold:3,gear:3,boss:3,gems:3}); assert.strictEqual(I.status(S,h).max,3);
  const r=I.start(S,h,'gear',0); const out=I.finish(S,h,r.run.id,{win:true}); assert.strictEqual(out.reward.gold,Math.round(I.rewardPreview('gear',0,h).gold*1.5));
  delete globalThis.Sys.vip; assert.strictEqual(I.status({},makeHost()).max,2);
});

t('Chefe de Era (instância) dá Essência da Era 1/2/3 por dificuldade; outras instâncias não',()=>{
  const Lo=globalThis.Sys.loot, h=makeHost({eraMax:2,seed:3});
  for(const [d,exp] of [[6,1],[7,2],[8,3]]){ const S={}; const r=I.start(S,h,'boss',d); const out=I.finish(S,h,r.run.id,{win:true}); assert.strictEqual(out.reward.essence,exp); assert.strictEqual(Lo.essence(S),exp); }
  const S={}; const r=I.start(S,h,'gear',8); assert.strictEqual(I.finish(S,h,r.run.id,{win:true}).reward.essence,0);
});

t('dayKey AAAA-MM-DD local',()=>{ assert.strictEqual(I.dayKey(new Date(2026,0,5,13).getTime()),'2026-01-05'); });
console.log(`\ninstances: ${n} testes ok`);
