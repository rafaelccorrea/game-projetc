// node test/sys/loot.test.js
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const fresh=()=>{ delete globalThis.Sys.forge; delete globalThis.Sys.pet; };

t('ensure cria estado padrão e conserta save antigo (v1) e inválido',()=>{
  const S={}; L.ensure(S); const o=S.sys.loot;
  assert.strictEqual(o.v,2); assert.deepStrictEqual(o.mat,{forge:0,food:0,xp:0,essence:0,eggs:{}}); assert.strictEqual(o.egg.pity,0); assert.strictEqual(o.egg.first,false);
  const S1={sys:{loot:{v:1,kills:5,gold:9,gems:1,items:2,bosses:0,byR:[1]}}}; L.ensure(S1); assert.strictEqual(S1.sys.loot.kills,5); assert.ok(S1.sys.loot.mat);
  const S2={sys:{loot:{kills:'x',gold:-5,byR:null,mat:{forge:'a',eggs:{'2':3,'x':1,'1':0}},egg:{pity:-1,eraFirst:'z'}}}}; L.ensure(S2);
  assert.strictEqual(S2.sys.loot.kills,0); assert.strictEqual(S2.sys.loot.mat.forge,0); assert.deepStrictEqual(S2.sys.loot.mat.eggs,{'2':3});
  assert.ok(Array.isArray(S2.sys.loot.egg.eraFirst)); L.ensure({sys:'lixo'}); assert.throws(()=>L.ensure(null));
});

t('comum: usa e.gold da batalha e entrega pelo host',()=>{
  fresh(); const S={}, h=makeHost({seed:3}); const r=L.onKill(S,h,{gold:7});
  assert.strictEqual(r.cls,'common'); assert.ok(r.gold>=6&&r.gold<=8); assert.strictEqual(h.gold,r.gold); assert.strictEqual(S.sys.loot.kills,1);
});

t('sem e.gold usa host.goldUnit()',()=>{ const r=L.rollKill({},makeHost({unit:100}),null); assert.ok(r.gold>=90&&r.gold<=110); });

t('horda: item 3,5% · gema 0,5% · pedra de forja 1% · ração 0,4% · sem ovo',()=>{
  const S={}, h=makeHost({seed:7}); let it=0,gm=0,fo=0,fd=0,eg=0; const N=60000;
  for(let i=0;i<N;i++){ const r=L.rollKill(S,h,{gold:5}); it+=r.items.length; gm+=r.gems>0; fo+=r.forge; fd+=r.food; eg+=r.eggs.length; }
  assert.ok(Math.abs(it/N-0.035)<0.004,'item'); assert.ok(Math.abs(gm/N-0.005)<0.0015,'gema '+gm/N);   // corte de 💎 da v0.12.0 (era 1,5%)
  assert.ok(Math.abs(fo/N-0.01)<0.0018,'forja '+fo/N); assert.ok(Math.abs(fd/N-0.004)<0.0012,'ração '+fd/N); assert.strictEqual(eg,0);
});

t('chefe: item r>=1 sempre, pedra 1-2, ração 3-5; Senhor da Era: r>=2, gemas 3-5, pedra 3-5, ração 15-20',()=>{
  const h=makeHost({seed:9,eraMax:3});
  for(let i=0;i<300;i++){ const b=L.rollKill({},h,{boss:true,gold:50}); assert.strictEqual(b.items.length,1); assert.ok(b.items[0].r>=1);
    assert.ok(b.forge>=1&&b.forge<=2); assert.ok(b.food>=3&&b.food<=5); }
  for(let i=0;i<300;i++){ const b=L.rollKill({},h,{boss:true,eraBoss:true,gold:50}); assert.ok(b.items[0].r>=2); assert.ok(b.gems>=3&&b.gems<=5);
    assert.ok(b.forge>=3&&b.forge<=5); assert.ok(b.food>=15&&b.food<=20); }
});

t('LANÇAMENTO: arma nunca Mítica (vira Épica); armadura mantém Mítica',()=>{
  const h=makeHost({seed:12,eraMax:6}); let wM=0,aM=0,wE=0;
  for(let i=0;i<40000;i++){ const it=L.rollItem(h,{}); if(it.slot==='weapon'){ if(it.r===3) wM++; if(it.r===2) wE++; } else if(it.r===3) aM++; }
  assert.strictEqual(wM,0); assert.ok(aM>0); assert.ok(wE>0);
  // fonte Mítico+ (minR 3): arma vai a Épico, ou a Lendário quando a sorte de +1 acerta
  let leg=0,epi=0; for(let i=0;i<4000;i++){ const it=L.rollItem(h,{slot:'weapon',minR:3,upChance:0.3}); assert.ok(it.r===2||it.r===4); if(it.r===4) leg++; else epi++; }
  assert.ok(leg>0&&epi>0);
  L.DATA.launch.noMythicWeapon=false; let m=0; for(let i=0;i<4000;i++) if(L.rollItem(h,{slot:'weapon'}).r===3) m++; L.DATA.launch.noMythicWeapon=true;
  assert.ok(m>0,'desligando a regra a Mítica volta');
});

t('PORTÕES: Raro nv10 · Épico nv25 · Mítico nv70+era4 · Lendário nv85+era5; abaixo cai para a maior permitida',()=>{
  const cap=(level,eraMax)=>L.maxAllowedR(makeHost({level,eraMax}));
  assert.strictEqual(cap(1,6),0); assert.strictEqual(cap(9,6),0); assert.strictEqual(cap(10,6),1); assert.strictEqual(cap(25,0),2);
  assert.strictEqual(cap(69,6),2); assert.strictEqual(cap(70,3),2,'Mítico exige era 4'); assert.strictEqual(cap(70,4),3);
  assert.strictEqual(cap(85,4),3,'Lendário exige era 5'); assert.strictEqual(cap(85,5),4); assert.strictEqual(cap(100,6),4);
  assert.strictEqual(L.maxAllowedR(makeHost({eraMax:3})),2,'sem host.level: só o portão de era vale');
  // sorteio: nível 9 = tudo Básico, mesmo chefe (mínimo Raro) e sorte; nível 30 era 6 = no máximo Épico
  const h9=makeHost({level:9,eraMax:6,seed:3}); for(let i=0;i<3000;i++) assert.strictEqual(L.rollItem(h9,{minR:2,upChance:1}).r,0);
  const h30=makeHost({level:30,eraMax:6,seed:4}); let ep=0; for(let i=0;i<5000;i++){ const r=L.rollItem(h30,{minR:3,upChance:0.5}).r; assert.ok(r<=2); if(r===2) ep++; } assert.strictEqual(ep,5000);
  // nível 70 era 4: Mítico só na ARMADURA (arma não tem Mítica no lançamento → Épico)
  const h70=makeHost({level:70,eraMax:4,seed:5}); for(let i=0;i<4000;i++){ const it=L.rollItem(h70,{minR:4}); assert.strictEqual(it.r,it.slot==='weapon'?2:3); }
});

t('PORTÕES nos ovos: só Mítico/Lendário são barrados',()=>{
  const lo=makeHost({level:5,eraMax:0}); assert.deepStrictEqual([0,1,2,3,4].map(r=>L.capEggR(lo,r)),[0,1,2,2,2]);
  const mid=makeHost({level:75,eraMax:4}); assert.deepStrictEqual([0,1,2,3,4].map(r=>L.capEggR(mid,r)),[0,1,2,3,3]);
  const hi=makeHost({level:90,eraMax:6}); assert.deepStrictEqual([0,1,2,3,4].map(r=>L.capEggR(hi,r)),[0,1,2,3,4]);
  // ovo comum (não marco) do chefe de fase é rebaixado pelo portão
  const Sb={}, hb=makeHost({level:20,eraMax:6,seed:3}); L.rollKill(Sb,hb,{boss:true}); let mx=0;
  for(let i=0;i<20000;i++){ for(const e of L.rollKill(Sb,hb,{boss:true}).eggs) mx=Math.max(mx,e); } assert.strictEqual(mx,2);
});

t('MARCO não piora: ovo Mítico do Senhor da Era 5 com nível 40 fica GUARDADO e choca no nível 70',()=>{
  delete globalThis.Sys.pet; const S={}, h=makeHost({level:40,eraMax:5,seed:9});
  const r=L.onKill(S,h,{boss:true,eraBoss:true,era:5});
  assert.deepStrictEqual(r.eggs,[]); assert.strictEqual(r.held.length,1); assert.ok(r.held[0].r>=3); assert.strictEqual(r.held[0].needLevel,r.held[0].r===3?70:85);
  assert.ok(r.pickups.some(p=>p.type==='egg'&&p.held),'pickup do ovo guardado'); assert.strictEqual(L.held(S).length,1);
  assert.deepStrictEqual(L.onLevelUp(S,h),[],'nível 40: continua guardado');
  const seen=[]; globalThis.Sys.pet={addFood:()=>{},addEgg:(S,h,o)=>{ seen.push(o.r); return {pet:o.r}; }};
  h._level=85; const rel=L.onLevelUp(S,h); assert.strictEqual(rel.length,1); assert.strictEqual(seen[0],r.held[0].r,'choca na raridade ORIGINAL');
  assert.strictEqual(L.held(S).length,0); delete globalThis.Sys.pet;
  // guardado também sai sozinho no próximo abate depois de subir de nível
  const S2={}, h2=makeHost({level:40,eraMax:6,seed:12}); L.onKill(S2,h2,{boss:true,eraBoss:true,era:6}); assert.strictEqual(L.held(S2).length,1);
  h2._level=99; const k=L.onKill(S2,h2,{gold:1}); assert.strictEqual(k.released.length,1); assert.strictEqual(L.held(S2).length,0);
  const S3={sys:{loot:{held:[{r:3},{r:'x'},null,{r:4,source:'instance'}]}}}; L.ensure(S3); assert.deepStrictEqual(S3.sys.loot.held,[{r:3,source:'drop'},{r:4,source:'instance'}]);
});

t('raridade nunca passa do topo da tabela de drop (Mítica r5 não cai)',()=>{
  const h=makeHost({seed:11,eraMax:6}); for(let i=0;i<5000;i++) assert.ok(L.rollItem(h,{minR:4,upChance:1}).r<=4); assert.strictEqual(L.maxDropR(),4);
});

t('era do item: era liberada ou a anterior (30%)',()=>{
  const h=makeHost({seed:5,eraMax:4}); let prev=0; const N=4000;
  for(let i=0;i<N;i++){ const it=L.rollItem(h,{}); assert.ok(it.e===4||it.e===3); if(it.e===3) prev++; }
  assert.ok(Math.abs(prev/N-0.3)<0.03); assert.strictEqual(L.rollItem(makeHost({eraMax:0}),{}).e,0);
});

t('ovo: Básico garantido no 1º chefe; depois 10% com garantia no 10º',()=>{
  fresh(); const S={}, h=makeHost({seed:2});
  const r0=L.rollKill(S,h,{boss:true}); assert.deepStrictEqual(r0.eggs,[0]);
  let gap=0,maxGap=0,eggs=0; const N=20000;
  for(let i=0;i<N;i++){ const r=L.rollKill(S,h,{boss:true}); if(r.eggs.length){ eggs++; maxGap=Math.max(maxGap,gap+1); gap=0; } else gap++; }
  assert.ok(maxGap<=10,'garantia '+maxGap); assert.ok(Math.abs(N/eggs-6.51)<0.3,'chefes por ovo '+(N/eggs));
});

t('ovo do chefe de fase segue 50/32/13/5/0 (sem Lendário)',()=>{
  const S={}, h=makeHost({seed:31,eraMax:6}); const c=[0,0,0,0,0]; let tot=0;   // era 6: portões abertos (mede a tabela pura)
  L.rollKill(S,h,{boss:true}); for(let i=0;i<80000;i++){ const r=L.rollKill(S,h,{boss:true}); for(const e of r.eggs){ c[e]++; tot++; } }
  [50,32,13,5,0].forEach((p,i)=>assert.ok(Math.abs(c[i]/tot*100-p)<1.2,`r${i} ${(c[i]/tot*100).toFixed(1)}`));
});

t('Senhor da Era: 1ª vitória de cada era dá ovo com raridade mínima; repetição 25%',()=>{
  const S={}, h=makeHost({seed:8,eraMax:6});   // portões abertos
  for(let era=0;era<7;era++){ const r=L.rollKill(S,h,{boss:true,eraBoss:true,era}); assert.strictEqual(r.eggs.length,1); assert.ok(r.eggs[0]>=L.DATA.eggs.eraBossFirstMin[era]); }
  let n2=0; for(let i=0;i<8000;i++) n2+=L.rollKill(S,h,{boss:true,eraBoss:true,era:3}).eggs.length; assert.ok(Math.abs(n2/8000-0.25)<0.02);
  const S2={}, h2=makeHost({stage:41}); L.rollKill(S2,h2,{boss:true,eraBoss:true}); assert.deepStrictEqual(S2.sys.loot.egg.eraFirst,[4],'era pela fase do host');
});

t('materiais vão para Sys.forge / Sys.pet; sem os módulos ficam pendentes e saem no flush',()=>{
  fresh(); const S={}, h=makeHost({seed:4});
  L.grant(S,h,{gold:1,gems:0,items:[],forge:3,food:7,eggs:[2,0]});
  assert.deepStrictEqual(L.pending(S),{forge:3,food:7,xp:0,eggs:{'0':1,'2':1}});
  const got={forge:0,food:0,eggs:[]};
  globalThis.Sys.forge={addStones:(S,n)=>{ got.forge+=n; }};
  globalThis.Sys.pet={addFood:(S,n)=>{ got.food+=n; },addEgg:(S,h,o)=>{ got.eggs.push(o.r); return {pet:'p'+o.r,novo:true}; }};
  const f=L.flushPending(S,h); assert.strictEqual(f.forge,3); assert.strictEqual(got.food,7); assert.deepStrictEqual(got.eggs.sort(),[0,2]);
  assert.deepStrictEqual(L.pending(S),{forge:0,food:0,xp:0,eggs:{}});
  const r=L.grant(S,h,{gold:1,gems:0,items:[],forge:2,food:0,eggs:[1]}); assert.strictEqual(got.forge,5); assert.deepStrictEqual(r.hatched,[{pet:'p1',novo:true}]);
  fresh();
});

t('origem do ovo (drop x instância) vai ao pet.js e sobrevive como pendente',()=>{
  fresh(); const S={}, h=makeHost(); L.addEgg(S,h,2,'instance'); L.addEgg(S,h,2); L.addEgg(S,h,3,'lixo');
  assert.deepStrictEqual(L.pending(S).eggs,{'2i':1,'2':1,'3':1});
  const seen=[]; globalThis.Sys.pet={addFood:()=>{},addEgg:(S,h,o)=>{ seen.push(o.r+':'+o.source); return {}; }};
  L.flushPending(S,h); assert.deepStrictEqual(seen.sort(),['2:drop','2:instance','3:drop']);
  L.addEgg(S,h,4,'instance'); assert.strictEqual(seen.pop(),'4:instance');
  const S2={sys:{loot:{mat:{eggs:{'1i':2,'1x':5}}}}}; L.ensure(S2); assert.deepStrictEqual(S2.sys.loot.mat.eggs,{'1i':2});
  fresh();
});

t('contador do dia (missão de 15 pedras) vira à meia-noite',()=>{
  fresh(); const S={}, h=makeHost(); L.addMat(S,h,'forge',9); L.addMat(S,h,'forge',6); assert.strictEqual(L.todayCount(S,h,'forge'),15);
  h.t=new Date(2026,10,13,0,0,5).getTime(); assert.strictEqual(L.todayCount(S,h,'forge'),0);
  assert.strictEqual(L.addMat(S,h,'xx',5),0); assert.strictEqual(L.addMat(S,h,'forge',-3),0);
});

t('pickups: soma por tipo = total; pedra, ração, ovo e item com raridade',()=>{
  const res={gold:1003,gems:7,items:[{slot:'weapon',r:4,e:2}],forge:2,food:5,eggs:[3]}; const p=L.pickups(res,{coins:[5,7]});
  const sum=ty=>p.filter(x=>x.type===ty).reduce((s,x)=>s+x.value,0);
  assert.strictEqual(sum('gold'),1003); assert.strictEqual(sum('gem'),7); assert.strictEqual(sum('forge'),2); assert.strictEqual(sum('food'),5);
  assert.ok(p.filter(x=>x.type==='gem').length<=5); assert.strictEqual(p.find(x=>x.type==='egg').r,3);
  assert.ok(p.find(x=>x.type==='item').big); assert.strictEqual(L.pickups({gold:2,gems:0,items:[]},{coins:[5,5]}).length,2);
});

t('agrupador "+N" junta ganhos seguidos e fecha após a janela',()=>{
  const G=L.createGrouper(0.5); G.add('gold',5,0); G.add('gold',7,0.3); G.add('gem',1,0.35);
  assert.strictEqual(G.live().find(b=>b.type==='gold').total,12); assert.deepStrictEqual(G.due(0.6),[]);
  const d=G.due(0.9); assert.strictEqual(d.length,2); assert.strictEqual(d.find(b=>b.type==='gold').count,2);
  G.add('gold',1,2); G.add('gold',1,3); assert.strictEqual(G.live().length,1); assert.strictEqual(G.add('gold',-3,4),null);
});

t('XP por abate: sobe com era e fase; orbes somam o total; vai ao Sys.level.addXp; nível novo solta ovo guardado',()=>{
  delete globalThis.Sys.level; delete globalThis.Sys.pet;
  const x=(o,e)=>L.xpFor(e,makeHost(o),L.classOf(e));
  assert.strictEqual(x({stage:1},{}),2); assert.strictEqual(x({stage:1},{boss:true}),33); assert.strictEqual(x({stage:1},{boss:true,eraBoss:true}),264);
  assert.ok(x({stage:10},{})>=x({stage:1},{}),'sobe com a fase'); assert.strictEqual(x({stage:11},{}),3,'era 1: 2,2 × 1,15 = 2,53 → 3'); assert.strictEqual(x({stage:31},{}),3,'era 3: 2,2 × 1,45 = 3,19 → 3'); assert.strictEqual(x({stage:61},{boss:true}),63,'era 6 chefe: 33 × 1,9 = 62,7');
  assert.ok(x({stage:40},{boss:true})>x({stage:31},{boss:true}),'fase 10 da era > fase 1');
  const S={}, h=makeHost({seed:2,stage:15});
  const r=L.onKill(S,h,{boss:true,gold:5}); assert.ok(r.xp>0);
  assert.strictEqual(r.pickups.filter(p=>p.type==='xp').reduce((s,p)=>s+p.value,0),r.xp); assert.ok(r.pickups.filter(p=>p.type==='xp').every(p=>p.to==='level'));
  assert.strictEqual(L.pending(S).xp,r.xp,'sem Sys.level: XP pendente');
  let lvl=40, gained=0; globalThis.Sys.level={addXp:(S,n)=>{ gained+=n; const from=lvl; lvl=99; return {gained:n,levels:lvl-from,from,to:lvl}; }};
  globalThis.Sys.pet={addFood:()=>{},addEgg:(S,h,o)=>({pet:o.r})};
  assert.strictEqual(L.flushPending(S,h).xp,r.xp); assert.strictEqual(gained,r.xp);
  // ovo de marco guardado (nível 40) choca no abate que sobe o jogador de nível
  const S2={}, hl=makeHost({level:40,eraMax:6,seed:7}); lvl=40; hl.level=()=>lvl;
  globalThis.Sys.level={addXp:(S,n)=>({gained:n,levels:0,from:40,to:40})};
  const k1=L.onKill(S2,hl,{boss:true,eraBoss:true,era:6}); assert.strictEqual(k1.held.length,1);
  globalThis.Sys.level={addXp:(S,n)=>{ const from=lvl; lvl=90; return {gained:n,levels:lvl-from,from,to:lvl}; }};
  const k2=L.onKill(S2,hl,{gold:1}); assert.ok(k2.levelUp&&k2.levelUp.to===90); assert.strictEqual(k2.released.length,1);
  delete globalThis.Sys.level; delete globalThis.Sys.pet;
});

t('7 ESPAÇOS: distribuição da horda; asa só nível 50+ e Épica+; loja nunca dá asa',()=>{
  const h=makeHost({level:90,eraMax:6,seed:61}); const c={}; const N=60000;
  for(let i=0;i<N;i++){ const it=L.rollItem(h,{source:'drop'}); c[it.slot]=(c[it.slot]||0)+1; if(it.slot==='wing') assert.ok(it.r>=2,'asa Épica+'); }
  assert.deepStrictEqual(Object.keys(c).sort(),['armor','boots','gloves','hat','necklace','weapon','wing']);
  assert.ok(c.weapon/N>0.19&&c.weapon/N<0.25,'arma '+c.weapon/N); assert.ok(c.necklace/N>0.06&&c.necklace/N<0.10,'colar');
  assert.ok(c.wing/N<0.03&&c.wing>0,'asa rara (4% dos sorteios Épicos+): '+c.wing/N);
  const low=makeHost({level:49,eraMax:6,seed:62}); for(let i=0;i<20000;i++) assert.notStrictEqual(L.rollItem(low,{}).slot,'wing','nível 49 sem asa');
  for(let i=0;i<20000;i++) assert.notStrictEqual(L.rollItem(h,{source:'shop'}).slot,'wing','loja sem asa');
  let wInst=0,wDrop=0; for(let i=0;i<20000;i++){ if(L.rollItem(h,{source:'eraBossInst',minR:2}).slot==='wing') wInst++; if(L.rollItem(h,{source:'drop',minR:2}).slot==='wing') wDrop++; }
  assert.ok(wInst>2.5*wDrop,'Chefe de Era é a fonte principal de asa');
  assert.strictEqual(L.rollItem(h,{slot:'wing'}).r>=2,true,'asa forçada nunca abaixo de Épica');
});

t('SECUNDÁRIOS: Básico 0, Raro 1, Épico+ 2; distintos; nunca igual ao principal do espaço',()=>{
  delete globalThis.Sys.stats; const h=makeHost({level:90,eraMax:6,seed:63});
  for(let i=0;i<20000;i++){ const it=L.rollItem(h,{}); const ks=it.subs.map(s=>s.k);
    assert.strictEqual(ks.length,[0,1,2,2,2][it.r]); assert.strictEqual(new Set(ks).size,ks.length);
    assert.ok(ks.every(k=>!L.DATA.subs.excludeBySlot[it.slot].includes(k)),it.slot+' '+ks); assert.ok(it.subs.every(s=>s.q>=0&&s.q<=1)); }
  const out=L.itemOut({slot:'boots',r:2,e:3,subs:[{k:'atkPct',q:0.5,x:1}]}); assert.deepStrictEqual(out,{slot:'boots',r:2,e:3,lvl:1,gold:0,subs:[{k:'atkPct',q:0.5}]});
  globalThis.Sys.stats={rollSubs:(slot,r)=>[{k:'Z'+slot,q:0}]}; assert.deepStrictEqual(L.rollItem(h,{slot:'hat'}).subs,[{k:'Zhat',q:0}],'usa o Sys.stats da fps-e2');
  delete globalThis.Sys.stats;
});

t('VIP (Sys.vip.perks): +50% ouro e XP no abate; offlineMult nos itens offline',()=>{
  const h=makeHost({seed:5,stage:1}); const g0=L.rollKill({},h,{gold:100}).gold, x0=L.rollKill({},h,{boss:true}).xp;
  globalThis.Sys.vip={perks:()=>({goldPct:50,xpPct:50,offlineMult:2})};
  const h2=makeHost({seed:5,stage:1}); const g1=L.rollKill({},h2,{gold:100}).gold, x1=L.rollKill({},h2,{boss:true}).xp;
  assert.ok(g1>=Math.round(g0*1.5)-2&&g1<=Math.round(g0*1.5)+2,'ouro '+g0+'→'+g1); assert.strictEqual(x1,Math.round(x0*1.5));
  assert.strictEqual(L.offline({},makeHost({seed:4}),999999).items.length,20,'offline ×2 bate no teto de 20');
  globalThis.Sys.vip={perks:()=>{ throw new Error('x'); }}; assert.deepStrictEqual(L.vipPerks({}),{chestCapAdd:0,instanceKeysAdd:0,xpPct:0,goldPct:0,offlineMult:1},'VIP com erro = sem VIP');
  delete globalThis.Sys.vip;
});

t('INVOCAÇÃO por ouro: 500·4^era (x10 = 9×), 1 grátis por dia, tabela 50/28/14/6/2 com portões',()=>{
  const mk=o=>{ const h=makeHost(o); h.wallet=o.wallet||0; h.spendGold=n=>{ if(h.wallet<n) return false; h.wallet-=n; return true; }; return h; };
  assert.strictEqual(L.summonCost(makeHost({eraMax:0}),1),500); assert.strictEqual(L.summonCost(makeHost({eraMax:2}),1),8000); assert.strictEqual(L.summonCost(makeHost({eraMax:2}),10),72000);
  const S={}, h=mk({eraMax:1,wallet:8000,seed:3,level:90});
  assert.strictEqual(L.summonFreeLeft(S,h),1); const f=L.summon(S,h,1,{free:true}); assert.ok(f.ok&&f.free&&f.cost===0&&f.items.length===1);
  assert.strictEqual(L.summon(S,h,1,{free:true}).reason,'gratis'); assert.strictEqual(L.summon(S,h,10,{free:true}).reason,'n');
  const p=L.summon(S,h,1); assert.ok(p.ok); assert.strictEqual(p.cost,2000); assert.strictEqual(h.wallet,6000);
  assert.strictEqual(L.summon(S,h,10).reason,'ouro'); assert.strictEqual(h.wallet,6000,'sem ouro: não cobra');
  h.t+=86400000; assert.strictEqual(L.summonFreeLeft(S,h),1,'grátis renova à meia-noite');
  assert.strictEqual(L.summon(S,makeHost({}),1).reason,'host','sem spendGold não invoca');
  // tabela de invocação e portões
  const hb=mk({eraMax:6,wallet:1e15,seed:9,level:90}); const c=[0,0,0,0,0]; let w=0; const pity=L.DATA.summon.pity; L.DATA.summon.pity=0;   // tabela pura (sem a garantia)
  for(let i=0;i<4000;i++){ for(const it of L.summon({},hb,10).items){ c[it.r]++; if(it.slot==='weapon'&&it.r===3) w++; } }
  L.DATA.summon.pity=pity;
  const tot=c.reduce((a,b)=>a+b,0); assert.ok(Math.abs(c[0]/tot-0.5)<0.02,'Básico '+c[0]/tot); assert.strictEqual(w,0,'arma Mítica nunca');
  const hl=mk({eraMax:6,wallet:1e15,seed:10,level:5}); for(let i=0;i<300;i++) assert.ok(L.summon({},hl,10).items.every(it=>it.r===0),'nível 5: só Básico');
});

t('DESMONTAR: 50% do ouro investido (diamante não conta) + pedras por raridade; item novo nasce Nv 1 sem ouro',()=>{
  delete globalThis.Sys.forge; delete globalThis.Sys.stats; const S={}, h=makeHost({seed:1});
  const d=L.dismantle(S,h,{slot:'hat',r:3,e:2,lvl:40,gold:10001}); assert.strictEqual(d.gold,5000); assert.strictEqual(h.gold,5000); assert.strictEqual(d.forge,4);
  assert.strictEqual(L.pending(S).forge,4); assert.strictEqual(L.todayCount(S,h,'forge'),4);
  assert.deepStrictEqual(L.dismantle(S,h,null),{gold:0,forge:0}); assert.strictEqual(L.dismantle(S,h,{r:0,gold:'x'}).gold,0);
  const h2=makeHost({seed:2}); L.onKill({},h2,{boss:true}); assert.ok(h2.items.every(it=>it.lvl===1&&it.gold===0));
});

t('INVOCAÇÃO: garantia da melhor raridade liberada a cada 10 (não zera na virada do dia)',()=>{
  const mk=o=>{ const h=makeHost(o); h.spendGold=()=>true; return h; };
  const S={}, h=mk({eraMax:6,level:30,seed:21});   // melhor liberada = Épico (r2)
  let maxGap=0,gap=0; for(let i=0;i<3000;i++){ const it=L.summon(S,h,1).items[0]; if(it.r>=2){ maxGap=Math.max(maxGap,gap+1); gap=0; } else gap++; }
  assert.ok(maxGap<=10,'maior intervalo '+maxGap);
  const S2={}, h2=mk({eraMax:6,level:90,seed:22}); let leg=0,pityHits=0; for(let i=0;i<500;i++){ for(const it of L.summon(S2,h2,10).items){ if(it.r===4) leg++; if(it.pity) pityHits++; } }
  assert.ok(pityHits>0&&leg>=pityHits,'nível 90: a garantia entrega Lendária');
  const S3={}, h3=mk({eraMax:6,level:30,seed:5}); for(let i=0;i<9;i++) L.summon(S3,h3,1); const p9=S3.sys.loot.summon.pity; h3.t+=86400000; L.summonFreeLeft(S3,h3);
  assert.strictEqual(S3.sys.loot.summon.pity,p9,'pity atravessa o dia');
});

t('ESSÊNCIA DA ERA: Senhor da Era 5 na 1ª vitória de cada era, 2-3 depois; não cai de comum nem de chefe de fase',()=>{
  const S={}, h=makeHost({seed:4,eraMax:6});
  for(let era=0;era<7;era++){ const r=L.onKill(S,h,{boss:true,eraBoss:true,era}); assert.strictEqual(r.essence,5); }
  assert.strictEqual(L.essence(S),35);
  for(let i=0;i<200;i++){ const r=L.rollKill(S,h,{boss:true,eraBoss:true,era:2}); assert.ok(r.essence>=2&&r.essence<=3); }
  for(let i=0;i<2000;i++){ assert.strictEqual(L.rollKill(S,h,{}).essence,0); assert.strictEqual(L.rollKill(S,h,{boss:true}).essence,0); }
  assert.ok(L.onKill(S,h,{boss:true,eraBoss:true,era:1}).pickups.some(p=>p.type==='essence'));
});

t('TRANSFORMAÇÃO: custo por raridade e salto de era; cobra tudo ou nada; não mexe no item (é do stats.js)',()=>{
  const S={}, h=makeHost({eraMax:3}); h.wallet=1e9; h.spendGold=n=>{ if(h.wallet<n) return false; h.wallet-=n; return true; };
  const it={slot:'armor',r:4,e:1,lvl:50,gold:777,subs:[]};
  const c=L.transformCost(S,h,it); assert.ok(c.ok); assert.strictEqual(c.jump,2); assert.strictEqual(c.essence,24); assert.strictEqual(c.gold,6000*64*2);
  assert.strictEqual(L.transformCost(S,h,{slot:'hat',r:0,e:3}).reason,'era','só para a era atual');
  assert.strictEqual(L.transformCost(S,h,{slot:'xx',r:0,e:0}).reason,'item');
  assert.strictEqual(L.payTransform(S,h,it).reason,'essencia'); assert.strictEqual(h.wallet,1e9,'sem essência: não cobra ouro');
  L.addMat(S,h,'essence',30); h.wallet=100; assert.strictEqual(L.payTransform(S,h,it).reason,'ouro'); assert.strictEqual(L.essence(S),30,'sem ouro: não cobra essência');
  h.wallet=1e9; const p=L.payTransform(S,h,it); assert.ok(p.ok); assert.strictEqual(L.essence(S),6); assert.strictEqual(h.wallet,1e9-768000);
  assert.deepStrictEqual([it.e,it.lvl,it.gold],[1,50,777],'item intacto: quem transforma é o Sys.stats');
  const b=L.transformCost(S,makeHost({eraMax:6}),{slot:'boots',r:0,e:5}); assert.strictEqual(b.essence,1); assert.strictEqual(b.gold,100*4096);
});

t('NOMES: 5 espaços × 7 eras × 5 raridades, todos preenchidos e únicos por espaço/era; nome pela era de aparência',()=>{
  for(const s of ['hat','gloves','boots','necklace','wing']){ const tb=L.DATA.names[s]; assert.strictEqual(tb.length,7,s);
    tb.forEach((row,e)=>{ assert.strictEqual(row.length,5,s+e); assert.strictEqual(new Set(row).size,5,s+' era '+e+' repetido'); assert.ok(row.every(n=>typeof n==='string'&&n.length>2)); }); }
  assert.strictEqual(L.itemName({slot:'wing',r:4,e:6}),'Asas do Vazio'); assert.strictEqual(L.itemName({slot:'hat',r:2,e:1}),'Elmo de Bronze');
  assert.strictEqual(L.itemName({slot:'hat',r:2,e:5,look:1}),'Elmo de Bronze','item transformado mantém o nome da aparência');
  assert.strictEqual(L.itemName({slot:'weapon',r:0,e:0}),null,'arma/colete: nome do jogo'); assert.strictEqual(L.itemName(null),null);
});

t('CHANCES EFETIVAS da invocação: portão aplicado e arma sem Mítica; batem com o sorteio real',()=>{
  const o5=L.summonOdds(makeHost({level:5,eraMax:6})); assert.deepStrictEqual(o5.byR,[100,0,0,0,0]); assert.strictEqual(o5.cap,0);
  const o30=L.summonOdds(makeHost({level:30,eraMax:6})); assert.deepStrictEqual(o30.byR,[50,28,22,0,0]);
  const o75=L.summonOdds(makeHost({level:75,eraMax:4})); assert.ok(Math.abs(o75.byR.reduce((a,b)=>a+b,0)-100)<0.05); assert.ok(o75.byR[3]<8&&o75.byR[2]>14,'Mítico só fora da arma');
  assert.strictEqual(o75.pity.weaponAtMythicGate,2);
  // confere contra o sorteio de verdade (sem garantia)
  const h=makeHost({level:75,eraMax:4,seed:31}); h.spendGold=()=>true; const pity=L.DATA.summon.pity; L.DATA.summon.pity=0; const c=[0,0,0,0,0]; let n=0;
  for(let i=0;i<4000;i++) for(const it of L.summon({},h,10).items){ c[it.r]++; n++; } L.DATA.summon.pity=pity;
  c.forEach((k,r)=>assert.ok(Math.abs(k/n*100-o75.byR[r])<1.2,'r'+r+' '+(k/n*100).toFixed(2)+' x '+o75.byR[r]));
});

t('ERA FUTURA (chave desligada por padrão): +1 ~0,5%, +2 ~0,05%, limitada à última era; portão continua o do jogador',()=>{
  assert.strictEqual(L.DATA.futureEra.on,false);
  const h0=makeHost({eraMax:2,seed:41}); for(let i=0;i<20000;i++) assert.ok(L.rollItem(h0,{}).e<=2,'desligada: nunca futura');
  L.DATA.futureEra.on=true; const hx=makeHost({eraMax:2,seed:45}); delete globalThis.Sys.stats;
  for(let i=0;i<20000;i++) assert.ok(L.rollItem(hx,{}).e<=2,'sem a trava do adormecido (stats): nunca futura');
  globalThis.Sys.stats={DATA:{futureEra:{on:true}}};   // as DUAS chaves ligadas
  const h=makeHost({eraMax:2,seed:42}); const c={}; const N=400000;
  for(let i=0;i<N;i++){ const e=L.rollItem(h,{}).e; c[e]=(c[e]||0)+1; }
  assert.ok(Math.abs((c[3]||0)/N-0.005)<0.0007,'+1 '+(c[3]/N)); assert.ok(Math.abs((c[4]||0)/N-0.0005)<0.0002,'+2 '+(c[4]/N)); assert.ok((c[5]||0)>0,'+3');
  const top=makeHost({eraMax:6,seed:43}); for(let i=0;i<50000;i++) assert.ok(L.rollItem(top,{}).e<=6,'nunca passa da era 6');
  const lv=makeHost({eraMax:3,level:30,seed:44}); for(let i=0;i<50000;i++) assert.ok(L.rollItem(lv,{}).r<=2,'item futuro respeita o portão do jogador');
  L.DATA.futureEra.on=false; delete globalThis.Sys.stats;
});

t('QUALIDADE: qp só com a chave da fps-e2 ligada; itemOut e pacotes levam o qp',()=>{
  delete globalThis.Sys.stats; const h=makeHost({seed:3,eraMax:2,level:90});
  assert.ok(!('qp' in L.rollItem(h,{})),'sem Sys.stats: sem qp');
  globalThis.Sys.stats={DATA:{quality:{on:false}},rollQuality:()=>1234}; assert.ok(!('qp' in L.rollItem(h,{})),'chave desligada: sem qp');
  globalThis.Sys.stats.DATA.quality.on=true; const it=L.rollItem(h,{slot:'hat'}); assert.strictEqual(it.qp,1234);
  assert.strictEqual(L.itemOut(it).qp,1234); const g=L.grantBundle({},h,{items:[{slot:'boots',r:1}]}); assert.strictEqual(g.items[0].qp,1234);
  delete globalThis.Sys.stats;
});

t('multiplicadores externos (VIP/Coleta)',()=>{
  const h=makeHost({seed:2}); L.params.mult.gold=2; const r=L.rollKill({},h,{gold:100}); L.params.mult.gold=1; assert.ok(r.gold>=180&&r.gold<=220);
});

t('offline: teto de 8 h, ~10 itens, sem ração (é do Sys.pet.onOffline)',()=>{
  const h=makeHost({seed:4}); const r=L.offline({},h,999999);
  assert.strictEqual(r.seconds,8*3600); assert.strictEqual(r.kills,8*60*6); assert.ok(r.items.length>=9&&r.items.length<=11); assert.strictEqual(r.food,0);
  L.params.offlineMult=5; assert.strictEqual(L.offline({},h,999999).items.length,20); L.params.offlineMult=1;
  assert.strictEqual(L.offline({},h,-50).kills,0); assert.strictEqual(L.offline({},h,'abc').kills,0);
});

t('bonus zerado',()=>{ assert.deepStrictEqual(L.bonus({}),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}); });
console.log(`\nloot: ${n} testes ok`);
