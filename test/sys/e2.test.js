// Testes dos módulos da fps-e2: fc, practice, titles, tower, forge, pet (números da docs/balance.json v5.1).
// Rodar: node test/sys/e2.test.js
'use strict';
const assert=require('assert'), fs=require('fs');
const {makeHost}=require('./_host.js');
const F=require('../../js/sys/fc.js'), P=require('../../js/sys/practice.js'), T=require('../../js/sys/titles.js'),
      W=require('../../js/sys/tower.js'), G=require('../../js/sys/forge.js'), PET=require('../../js/sys/pet.js');
const newS=()=>({best:1,kills:0,eraMax:0,skins:['w00','a00'],inv:[]});
const near=(a,b,eps)=>assert.ok(Math.abs(a-b)<=(eps||1e-9),`${a} != ${b}`);
const strong=(o)=>{ const h=makeHost(o); h.atk=()=>1e16; h.hp=()=>1e17; return h; };
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };

/* ---------- save antigo e lixo ---------- */
t('save antigo e lixo não quebram nenhum módulo',()=>{
  for(const m of [P,T,G,PET]){ m.ensure({sys:{practice:'x',titles:[],tower:5,forge:null,pet:7}}); }
  W.ensure({sys:{tower:'x'}});
  const o=P.ensure({sys:{practice:{stones:-5,lv:{str:'9',vit:3.7,zzz:4}}}});
  assert.strictEqual(o.stones,0); assert.strictEqual(o.lv.str,0); assert.strictEqual(o.lv.vit,3); assert.ok(!('zzz' in o.lv));
  const g=G.ensure({sys:{forge:{lv:{weapon:99,armor:-3},pity:{weapon:'a'}}}}); assert.strictEqual(g.lv.weapon,15); assert.strictEqual(g.lv.armor,0); assert.strictEqual(g.pity.weapon,0);
  const p=PET.ensure({sys:{pet:{owned:{wolf:{stars:9},xyz:{}},eq:'xyz',stored:{wolf:5,phoenix:3}}}});
  assert.strictEqual(p.owned.wolf.stars,5); assert.ok(!p.owned.xyz); assert.strictEqual(p.eq,null);
  assert.ok(!('wolf' in p.stored),'guardado de pet já nascido some'); assert.strictEqual(p.stored.phoenix,3);
  for(const m of [P,T,G,PET]) assert.throws(()=>m.ensure(null));
});

/* ---------- práticas (v5.1) ---------- */
t('practice: 0,5% por nível, teto de 10 por era, custo e ganho de pedras',()=>{
  const S=newS(), h=makeHost({eraMax:0}); P.addStones(S,1e6,h);
  assert.strictEqual(P.train(S,h,'str',3).n,3); near(P.bonus(S).atkPct,1.5);
  assert.strictEqual(P.train(S,h,'crit',3).n,3); assert.strictEqual(P.bonus(S).critPct,0.3,'sem 0,30000000000000004');
  assert.strictEqual(P.train(S,h,'def',Infinity).n,10); assert.strictEqual(P.canTrain(S,h,'def').reason,'cap');
  h._eraMax=6; P.train(S,h,'vit',Infinity); assert.strictEqual(P.level(S,'vit'),70); near(P.bonus(S).hpPct,35);
  assert.strictEqual(P.cost(0),4); assert.strictEqual(P.canTrain(S,h,'nada').reason,'id');
  const S2=newS(); assert.strictEqual(P.canTrain(S2,h,'str').reason,'stones');
  assert.strictEqual(P.onKill(S2,makeHost({eraMax:0}),{boss:true}),2); assert.strictEqual(P.onOffline(S2,h,99*3600),48);
  assert.strictEqual(P.DATA.drop.commonChance,0.08);
});

/* ---------- FC ---------- */
t('fc: soma bônus; módulo com erro conta zero; pet travado em 25% da FC do herói',()=>{
  const S=newS(), h=makeHost(), fc0=F.compute(S,h);
  assert.strictEqual(fc0,Math.round(100*5*1.12+1000));
  P.addStones(S,1000,h); P.train(S,h,'str',2); assert.ok(F.compute(S,h)>fc0);
  globalThis.Sys.bad={bonus(){ throw new Error('x'); }}; assert.ok(isFinite(F.compute(S,h))); delete globalThis.Sys.bad;
  // pet absurdo de um módulo futuro não passa de 25%
  globalThis.Sys.fake={bonus:()=>({petAtk:500,petHp:500})}; const st=F.stats(S,h), heroOnly=Math.round(st.atk*5*1.12+st.hp);
  near(F.compute(S,h),Math.round(heroOnly*1.25),1); assert.strictEqual(st.atk,F.stats(S,h).atk); delete globalThis.Sys.fake;
});

/* ---------- forja ---------- */
t('forge: tabela da v5.1, teto em pares, falha NUNCA rebaixa, garantia acumulada',()=>{
  const S=newS(), h=makeHost({eraMax:0}); G.addStones(S,1e6,h);
  assert.strictEqual(G.capOf(h),6); h._eraMax=2; assert.strictEqual(G.capOf(h),9); h._eraMax=6; assert.strictEqual(G.capOf(h),15);
  let lastLv=0, fails=0;
  for(let i=0;i<5000&&G.level(S,'weapon')<15;i++){ const r=G.attempt(S,h,'weapon'); assert.ok(r.ok);
    assert.ok(r.lv>=lastLv,'nunca perde nível'); if(!r.success){ fails++; } lastLv=r.lv; }
  assert.strictEqual(G.level(S,'weapon'),15); assert.ok(fails>0); assert.strictEqual(G.canTry(S,h,'weapon').reason,'max');
  near(G.mult(S,'weapon'),0.93); assert.strictEqual(G.aura(S).id,'gold');
  // garantia: com 5% base, no pior caso acerta em 20 tentativas
  const S2=newS(); G.ensure(S2).lv.armor=14; G.addStones(S2,1e6,h); const lose=Object.assign(makeHost({eraMax:6}),{rng:()=>0.999999});
  assert.strictEqual(G.worstTries(S2,'armor'),20); let k=0; while(G.level(S2,'armor')<15){ G.attempt(S2,lose,'armor'); k++; } assert.strictEqual(k,20);
  assert.strictEqual(G.ensure(S2).pity.armor,0,'garantia zera ao acertar');
  assert.strictEqual(G.canTry(newS(),h,'weapon').reason,'stones'); assert.strictEqual(G.canTry(S,h,'cabeca').reason,'slot');
  const S3=newS(); G.ensure(S3).lv.weapon=6; G.addStones(S3,99,h); assert.strictEqual(G.canTry(S3,makeHost({eraMax:1}),'weapon').reason,'cap');
});

/* ---------- pet ---------- */
t('pet: chocar, repetido, 5★ vira ovo acima, nível do espaço com teto, p e teto de 20%',()=>{
  const S=newS(), h=makeHost({eraMax:0});
  const a=PET.addEgg(S,h,{r:0}); assert.ok(a.isNew&&a.pet==='wolf'&&a.equipped);
  const b=PET.addEgg(S,h,{r:0}); assert.strictEqual(b.frags,10); assert.strictEqual(PET.ensure(S).owned.wolf.stars,2);
  PET.addFragments(S,'wolf',90,h); assert.strictEqual(PET.ensure(S).owned.wolf.stars,5);
  const c=PET.addEgg(S,h,{r:0}); assert.strictEqual(c.to,'egg'); assert.strictEqual(c.chain.pet,'owl');
  // v5.2: ovo de instância repetido em 5★ NÃO sobe: vira ração (Básico = 5)
  const f0=PET.ensure(S).food, ci=PET.addEgg(S,h,{r:0,source:'instance'}); assert.strictEqual(ci.to,'food'); assert.strictEqual(PET.ensure(S).food-f0,5); assert.strictEqual(ci.chain,null);
  // nível do espaço: teto 8 na era 0, custo ceil(3·1,08^(N−1))
  assert.strictEqual(PET.foodCost(1),3); PET.addFood(S,1e6,h); assert.strictEqual(PET.feed(S,h,Infinity).lvl,8); assert.strictEqual(PET.canFeed(S,h).reason,'cap');
  // fênix máxima = p 0,25 = 20% da FC total
  const S2=newS(); PET.addEgg(S2,h,{r:4}); const o=PET.ensure(S2); o.lvl=50; o.owned.phoenix.stars=5; near(PET.pOf(S2,'phoenix'),0.25);
  const fcB=F.compute({best:1,skins:[],inv:[]},makeHost()), fcT=F.compute(S2,makeHost());
  near((fcT-fcB)/fcT,0.2,0.01);
});
t('pet: golem repetido (auto), fênix guardada e nascendo com as estrelas pagas',()=>{
  const S=newS(), h=makeHost();
  PET.addEgg(S,h,{r:3}); let r=PET.addEgg(S,h,{r:3}); assert.strictEqual(r.to,'golem','sem fênix: vai para o golem'); assert.strictEqual(PET.ensure(S).owned.golem.stars,2);
  PET.addFragments(S,'phoenix',7,h); assert.strictEqual(PET.ensure(S).stored.phoenix,7);
  r=PET.addEgg(S,h,{r:4}); assert.ok(r.isNew); assert.strictEqual(r.fromStored,7); assert.strictEqual(PET.ensure(S).owned.phoenix.stars,1);
  assert.strictEqual(PET.ensure(S).eq,'phoenix','fênix 1★ (0,200) passa o golem 2★');
  r=PET.addEgg(S,h,{r:3}); assert.strictEqual(r.to,'phoenix'); assert.strictEqual(r.frags,7,'com a fênix: 7 fragmentos de fênix (v7.1)');
  assert.ok(PET.setGolemChoice(S,'golem')); r=PET.addEgg(S,h,{r:3}); assert.strictEqual(r.to,'golem');
  // borda 2: nascer com >= 10 guardados já nasce com as estrelas (12 = 2★ com 2 sobrando)
  const S2=newS(); PET.addFragments(S2,'phoenix',12,h); PET.addEgg(S2,h,{r:4}); const ph=PET.ensure(S2).owned.phoenix;
  assert.strictEqual(ph.stars,2); assert.strictEqual(ph.frags,2);
  // borda 1: fênix já existente -> ovo da fênix vira repetido = 10 fragmentos
  r=PET.addEgg(S2,h,{r:4}); assert.strictEqual(r.frags,10);
  // PO: fênix repetida em 5★ = 10 fragmentos de GOLEM (guardados se o golem ainda não nasceu)
  PET.ensure(S2).owned.phoenix.stars=5; r=PET.addEgg(S2,h,{r:4}); assert.strictEqual(r.to,'golem'); assert.strictEqual(r.frags,10);
  assert.strictEqual(PET.ensure(S2).stored.golem,10); PET.addEgg(S2,h,{r:3}); assert.strictEqual(PET.ensure(S2).owned.golem.stars,2,'golem nasce com os 10 guardados = 2★');
  // coruja: FC menor que o lobo no mesmo nível (coleta não é combate) e dá ouro
  const S3=newS(); PET.addEgg(S3,h,{r:1}); assert.ok(PET.bonus(S3).goldPct>0);
});

/* ---------- títulos ---------- */
t('titles: × 0,5, destaque x2, cosméticos, catálogo do lançamento e armas que ficam na coleção',()=>{
  const S=newS(), h=makeHost(); S.best=11; const fr=T.check(S,h);
  assert.deepStrictEqual(fr.map(x=>x.id),['stage10']); assert.strictEqual(T.featured(S).id,'stage10'); near(T.bonus(S).atkPct,1,1e-9);
  S.skins=Array.from({length:12},(_,i)=>'s'+i); T.check(S,h); assert.ok(T.isUnlocked(S,'skin10')); assert.ok(T.setFeatured(S,'skin10')); near(T.bonus(S).atkPct,0.5);
  assert.strictEqual(T.need(S,h,{type:'weapons',n:'all'}),28); assert.strictEqual(T.need(S,h,{type:'skins',n:'all'}),38);
  assert.strictEqual(T.need(S,{...h,catalog:k=>k==='weapons'?35:null},{type:'weapons',n:'all'}),35,'host.catalog substitui');
  for(let e=0;e<7;e++) S.inv.push({slot:'weapon',e,r:0}); T.check(S,h); assert.ok(T.isUnlocked(S,'weap7'));
  S.inv=[]; assert.strictEqual(T.current(S,h,'weaponEras'),7,'vendeu, mas continua na coleção');
  assert.ok(T.condLabel(S,h,{cond:{type:'weapons',n:'all'}}).includes('28'));
  PET.addEgg(S,h,{r:0}); T.check(S,h); assert.ok(T.isUnlocked(S,'pet1'));
  const hh={...h,owned:k=>k==='hats'?['h1','h2','h3','h4']:[]}; T.check(S,hh); assert.ok(T.isUnlocked(S,'hatsAll')); assert.strictEqual(T.bonusText(T.DATA.titles.find(x=>x.id==='hatsAll')),'Cosmético');
  for(let i=0;i<10;i++) T.onKill(S,h,{boss:true}); assert.ok(T.isUnlocked(S,'boss10'));
});

/* ---------- torre ---------- */
t('tower: âncoras v7.1 no andar de chefe, fantasma com a mesma FC, determinismo, só derrota gasta, virada de dia',()=>{
  assert.strictEqual(W.floorFC(15),1440); assert.strictEqual(W.floorFC(105),1540000000000);
  // chefe a cada 10 (dono): a curva é o andar COMUM e o chefe fica 30% acima
  assert.ok(!W.isBoss(5)&&W.isBoss(10)&&W.isBoss(30)&&!W.isBoss(15)); near(W.floorFC(30),12300*1.3,1);
  { let g=0,fo=0; for(let i=1;i<=105;i++){ const r=W.rewardsFor(i,makeHost()); g+=r.gems; fo+=r.forge; } assert.ok(g>=285&&g<=300,'diamantes da torre ≈ os de antes ('+g+' contra 295)'); assert.strictEqual(fo,36); }
  for(const f of [1,15,37,100]) near(F.fcOfStats(W.opponent(f)),W.floorFC(f),1);   // FC única: o fantasma tem exatamente a FC do andar
  assert.ok(W.floorFC(14)<W.floorFC(15));
  assert.ok(W.floorFC(106)>W.floorFC(105)&&W.floorFC(111)<W.floorFC(110),'acima de 105 segue crescendo; o chefe do 110 é a parede');
  const a=W.opponent(7), b=W.opponent(7); assert.deepStrictEqual(a,b); assert.deepStrictEqual(W.duel(a,b,42),W.duel(a,b,42));
  for(let f=1;f<=120;f++) assert.ok(!/^w\d3$/.test(W.opponent(f).skin.weapon),'sem arma Mítica no lançamento');
  const S=newS(), h=makeHost(); let wins=0; for(let i=0;i<40;i++){ const r=W.fight(S,h); if(!r.ok) break; if(r.win) wins++; }
  const o=W.ensure(S,h); assert.strictEqual(o.lossesLeft,0); assert.strictEqual(o.best,wins); assert.ok(wins>3);
  assert.strictEqual(W.fight(S,h).reason,'tries'); h.t+=86400000; W.ensure(S,h); assert.strictEqual(o.lossesLeft,5);
});
t('tower: prêmios v5.1 (ovos, fênix no 100, fragmentos 101-110, forja, pedras) entregues pelos módulos',()=>{
  const rw=f=>W.rewardsFor(f,makeHost());
  assert.deepStrictEqual(rw(10).egg,{weights:[50,32,13,5,0],minR:1}); assert.strictEqual(rw(50).egg.minR,2); assert.strictEqual(rw(11).egg,null);
  assert.deepStrictEqual(rw(100).egg,{r:4,source:'tower100',pet:'phoenix'}); assert.strictEqual(rw(110).egg,null);
  for(const f of [101,105,110,120,130]) assert.strictEqual(rw(f).phoenixFrags,1,'andar '+f); for(const f of [99,100,111,115]) assert.strictEqual(rw(f).phoenixFrags,0,'andar '+f);
  assert.strictEqual(rw(15).forge,0); assert.strictEqual(rw(20).forge,4); assert.strictEqual(rw(21).forge,0); assert.strictEqual(rw(25).forge,0);
  // jogador fortíssimo sobe até o 112: ovo a cada 10, fênix no 100, 10 fragmentos de 101 a 110
  const S=newS(), h=strong(); for(let i=0;i<112;i++) assert.ok(W.fight(S,h).win);
  const p=PET.ensure(S); assert.ok(p.owned.phoenix,'fênix nasceu no 100');
  assert.ok(G.ensure(S).stones>0&&P.ensure(S).stones>0&&h.gold>0);
  assert.ok(T.isUnlocked(S,'tow100'));
});

/* ---------- atributos dos 7 espaços, skin, VIP, nível do item, ranking ---------- */
t('stats: principal por espaço, secundários (exclusão, determinismo), asa, nível do item, golpe e DEF',()=>{
  const ST=require('../../js/sys/stats.js');
  assert.deepStrictEqual(ST.DATA.slots,['weapon','armor','hat','gloves','boots','necklace','wing']);
  near(ST.mainOf({slot:'weapon',e:1,r:2},1,0).atk,8*3*12); near(ST.mainOf({slot:'boots',e:0,r:0},1,0).aspd,4);   // era 0 = valor-base
  const g={slot:'gloves',e:0,r:2,subs:[{k:'critRate',q:1},{k:'aspd',q:1}]}; const gs=ST.itemStats(g,1,0);
  near(gs.critRate,2*1.5,1e-9); near(gs.aspd,6*1.5,1e-9);   // o critRate secundário das luvas é ignorado
  const a={id:42,slot:'hat',e:0,r:3}, b={id:42,slot:'hat',e:0,r:3}; ST.ensureSubs(a); ST.ensureSubs(b);
  assert.deepStrictEqual(a.subs,b.subs); assert.strictEqual(a.subs.length,2); assert.ok(!a.subs.some(s=>s.k==='hpPct'));
  for(let i=0;i<200;i++){ const s=ST.rollSubs('necklace',4,Math.random); assert.ok(!s.some(x=>x.k==='critDmg')&&new Set(s.map(x=>x.k)).size===s.length); }
  assert.ok(!ST.canEquip({slot:'wing',r:4},49)&&!ST.canEquip({slot:'wing',r:1},60)&&ST.canEquip({slot:'wing',r:2},50));
  // nível do item: teto = nível do jogador; sem nível conhecido, sem teto
  // PO: o nível que o item JÁ TEM conta inteiro na força; o teto do jogador vale só para subir
  assert.strictEqual(ST.itemLevel({lvl:80},30),80); assert.strictEqual(ST.itemLevel({lvl:80},null),80); assert.strictEqual(ST.itemLevel({},null),1);
  assert.strictEqual(ST.upgradeCap(30),30); assert.strictEqual(ST.upgradeCap(null),100);
  const h=makeHost(); h.equipped=()=>({weapon:{slot:'weapon',e:0,r:0,lvl:1},armor:{slot:'armor',e:0,r:0,lvl:1}});
  const st=ST.compute({},h,{}); assert.strictEqual(st.atk,13); assert.strictEqual(st.hp,140); assert.strictEqual(st.def,8,'v7.1: DEF-base do colete 8');   // ATK 13 e HP 140 = jogo de hoje
  near(ST.defReduction(100,100),100/300);   // v7.1: defK 2
  // v7.1: tetos de velocidade (100%) e de dano crítico (400%)
  const hc=makeHost(); hc.equipped=()=>{ const o={}; for(const sl of ['weapon','armor','hat','gloves','boots','necklace']) o[sl]={slot:sl,e:6,r:4,lvl:100,subs:[{k:'aspd',q:1},{k:'critDmg',q:1}]}; return o; };
  const sc=ST.compute({},hc,{}); assert.strictEqual(sc.aspd,100); assert.ok(sc.critDmg<=400); assert.ok(ST.defReduction(1e12,1)<=0.75);
  near(ST.hit({atk:100,critRate:0,critDmg:100},3,0,true).dmg,600); near(ST.interval({aspd:100}),0.4);
});
t('stats: melhoria por ouro ou diamante, teto no nível do jogador, ouro investido e desmontar 50%',()=>{
  const ST=require('../../js/sys/stats.js'), L=require('../../js/sys/level.js'), S={}; L.ensure(S).lvl=3;
  const h=makeHost(), it={slot:'weapon',e:0,r:0,lvl:1,gold:0};
  const c1=ST.upgradeCost(it); assert.ok(ST.upgrade(S,h,it,'gold').ok); assert.strictEqual(it.gold,c1.gold);
  assert.ok(ST.upgrade(S,h,it,'gems').ok); assert.strictEqual(it.gold,c1.gold,'diamante não entra no ouro investido');
  assert.strictEqual(it.lvl,3); assert.strictEqual(ST.canUpgrade(S,h,it).reason,'level','teto = nível do jogador');
  // item acima do nível do jogador (save antigo): força com o nível inteiro, não sobe, e a tela recebe os dados do aviso
  const hi={slot:'weapon',e:0,r:0,lvl:25,gold:0}, cu=ST.canUpgrade(S,h,hi); assert.strictEqual(cu.reason,'level'); assert.ok(cu.aboveCap);
  assert.strictEqual(cu.playerLevel,3); assert.strictEqual(cu.itemLevel,25); assert.strictEqual(cu.needLevel,26);
  const pu=ST.planUpgrade(S,h,hi,'gold'); assert.strictEqual(pu.reason,'level'); assert.ok(pu.aboveCap); assert.strictEqual(pu.levels,0);
  near(ST.mainOf(hi,ST.itemLevel(hi,3),0).atk,8*ST.lvlFactor(25));
  assert.strictEqual(ST.dismantleGold(it),Math.floor(c1.gold*0.5));
  const poor=Object.assign(makeHost(),{canSpendGems:()=>false}); const S10={}; L.ensure(S10).lvl=10; assert.strictEqual(ST.canUpgrade(S10,poor,{lvl:1},'gems').reason,'money');
  assert.strictEqual(ST.canUpgrade({},h,{lvl:100}).reason,'max');
  // v7: ouro cresce 3,5^era; "equipar e upar até o meu nível" mostra o custo total antes e cobra de uma vez
  near(ST.upgradeCost({lvl:1,r:0,e:2}).gold,Math.floor(25*3.5*3.5));   // v8: goldBaseV8 25 no 1º nível
  // curva v8 (PO, para teste): Nv 12 = ×2,96, Nv 100 = ×42,5; a v7 continua disponível para comparar
  near(ST.lvlFactor(12),2.96,0.01); near(ST.lvlFactor(100),42.45,0.01);
  ST.DATA.lvlCurve='v7'; near(ST.lvlFactor(12),Math.pow(1.04,11)); ST.DATA.lvlCurve='v8';
  // custo v8 proporcional ao ganho: ouro por ponto de ATK constante (±1 de arredondamento) do Nv 1 ao 99
  const ppg=n=>ST.upgradeCost({lvl:n,r:0,e:0}).gold/(ST.lvlFactor(n+1)-ST.lvlFactor(n)); near(ppg(1),ppg(50),ppg(1)*0.05); near(ppg(1),ppg(99),ppg(1)*0.05);
  let t7=0,t8=0; for(let n=1;n<12;n++){ t8+=ST.upgradeCost({lvl:n,r:0,e:0}).gold; t7+=Math.floor(20*Math.pow(1.06,n-1)); } assert.ok(Math.abs(t8-t7)/t7<0.05,'até o Nv 12: mesmo ouro da v7');
  const S7={}; L.ensure(S7).lvl=10; const it7={slot:'weapon',e:0,r:1,lvl:2,gold:0}, h7=makeHost(); let paid=0; h7.spendGold=n=>{ paid+=n; return true; };
  const plan=ST.planUpgrade(S7,h7,it7,'gold'); assert.strictEqual(plan.from,2); assert.strictEqual(plan.to,10); assert.strictEqual(plan.levels,8);
  let soma=0; for(let n=2;n<10;n++) soma+=ST.upgradeCost({lvl:n,r:1,e:0}).gold; assert.strictEqual(plan.gold,soma);
  const up=ST.upgradeTo(S7,h7,it7,'gold'); assert.ok(up.ok); assert.strictEqual(it7.lvl,10); assert.strictEqual(paid,soma,'uma cobrança só'); assert.strictEqual(it7.gold,soma);
  assert.strictEqual(ST.planUpgrade(S7,h7,it7,'gold').reason,'level','já no teto');
  const broke=Object.assign(makeHost(),{canSpendGems:()=>false}); assert.strictEqual(ST.upgradeTo(S7,broke,{slot:'hat',e:0,r:0,lvl:1},'gems').reason,'money');
  // v7: botas, colar e asa escalam com a era (passo aditivo: era 6 = ×2,5), arma/colete seguem 12^era
  near(ST.mainOf({slot:'boots',e:6,r:0},1,0).aspd,4*2.5); near(ST.mainOf({slot:'necklace',e:2,r:0},1,0).critDmg,10*1.5);
  near(ST.mainOf({slot:'gloves',e:6,r:0},1,0).critRate,2);   // luvas: crítico não escala (fora da lista do PO)
  // TRANSFORMAÇÃO: só para a era atual; mesma raridade e visual; nível 1 e ouro zerado; avisa o ouro perdido
  const hT=makeHost({eraMax:3}), tw={id:9,slot:'weapon',e:1,r:2,lvl:30,gold:900,subs:[{k:'critRate',q:0.5},{k:'atkPct',q:1}]};
  const c=ST.canTransform({},hT,tw); assert.ok(c.ok); assert.strictEqual(c.to,3); assert.strictEqual(c.lostGold,900); assert.strictEqual(c.lostDismantle,450);
  const tr=ST.transform({},hT,tw); assert.ok(tr.ok); assert.strictEqual(tw.e,3); assert.strictEqual(tw.look,1); assert.strictEqual(tw.r,2); assert.ok(!('ve' in tw));
  assert.strictEqual(tw.lvl,1); assert.strictEqual(tw.gold,0); assert.strictEqual(tw.subs.length,2,'secundários mantidos');
  assert.strictEqual(ST.canTransform({},hT,tw).reason,'same'); assert.strictEqual(ST.canTransform({},makeHost({eraMax:2}),{slot:'weapon',e:3,r:0}).reason,'ahead');
  hT._eraMax=5; ST.transform({},hT,tw); assert.strictEqual(tw.look,1);   // o visual de origem não muda numa 2ª transformação assert.strictEqual(tw.e,5);
  assert.ok(ST.mainOf(tw,1,0).atk>ST.mainOf({slot:'weapon',e:1,r:2},30,0).atk);   // era 5 Nv 1 ganha da era 1 Nv 30
  const mig={slot:'hat',e:2,r:0,lvl:1,gold:0}; ST.migrateItem(mig); assert.strictEqual(mig.look,2);   // migração: look = e
  let charged=0; const hP=Object.assign(makeHost({eraMax:4}),{spendGold:n=>{ charged=n; return false; }}), tf={slot:'boots',e:0,r:1,lvl:5,gold:10};
  assert.strictEqual(ST.transform({},hP,tf).reason,'money'); assert.strictEqual(tf.e,0,'sem pagar, o item não muda'); assert.ok(charged>0);
  // migração (PO): item antigo sem gold recebe o ouro estimado pela tabela que o jogador PAGOU (upCost antigo), nunca perde ouro
  const old={id:5,slot:'weapon',e:1,r:2,lvl:4}; ST.migrateItem(old);
  assert.strictEqual(old.gold,[1,2,3].reduce((g,k)=>g+Math.floor(20*Math.pow(1.38,k-1)*(1+2*0.6)*4),0)); assert.ok(old.goldEstimated);
  assert.ok(old.gold>=[1,2,3].reduce((g,k)=>g+ST.upgradeCost({lvl:k,r:2,e:1}).gold,0),'nunca menos que a tabela nova');
  const kept={slot:'weapon',e:0,r:0,lvl:3,gold:77}; ST.migrateItem(kept); assert.strictEqual(kept.gold,77,'item novo não é reestimado');
  const Sm={inv:[{id:1,slot:'armor',e:0,r:1,lvl:2},{id:2,slot:'weapon',e:0,r:0,lvl:1,gold:0}]}; assert.strictEqual(ST.migrateSave(Sm),1); assert.strictEqual(Sm.inv[0].subs.length,1);
});
t('fc: 6 atributos, FC deste item (real e no nível do jogador), troca e ranking com a maior FC da semana',()=>{
  const ST=require('../../js/sys/stats.js'), L=require('../../js/sys/level.js'); const S={}; L.ensure(S).lvl=40;
  const eq={weapon:{slot:'weapon',e:0,r:0,lvl:1},armor:{slot:'armor',e:0,r:0,lvl:1}}, h=makeHost(); h.equipped=()=>eq;
  const st=F.stats(S,h); assert.ok(st.def>0&&st.critDmg===100&&st.aspd===0); assert.strictEqual(st.crit,st.critRate);
  const fc0=F.compute(S,h); eq.boots={slot:'boots',e:0,r:0,lvl:1}; assert.ok(F.compute(S,h)>fc0,'vel. de ataque soma'); delete eq.boots;
  const nw={slot:'weapon',e:1,r:2,lvl:1,subs:[]}, x=F.itemFC(S,h,nw);
  assert.ok(x.fc>0&&x.atPlayerLevel>x.fc,'no nível 40 rende mais'); assert.ok(x.swap>0); assert.strictEqual(F.compute(S,h),fc0,'itemFC não mexe no equipado');
  // ranking: maior FC da semana, zera na segunda
  const r1=F.record(S,h); assert.ok(r1.newMax); eq.weapon=nw; const r2=F.record(S,h); assert.ok(r2.max>r1.max);
  eq.weapon={slot:'weapon',e:0,r:0,lvl:1}; const r3=F.record(S,h); assert.strictEqual(r3.max,r2.max,'tirar o item não baixa a maior da semana');
  h.t+=8*86400000; const r4=F.record(S,h); assert.strictEqual(r4.max,r4.fc); assert.strictEqual(S.sys.fc.last.max,r2.max);
});
t('skin dá poder (equipada por raridade + coleção com teto) e VIP (bônus e perks, offline em dobro)',()=>{
  const SK=require('../../js/sys/skin.js'), V=require('../../js/sys/vip.js');
  const S={skinEq:{weapon:'w04',armor:'a12'},skins:['w04','a12']}; near(SK.bonus(S).atkPct,10+5+1);
  const d=SK.detail(S); near(d.total,16); near(d.equipped,15); near(d.collection,1); assert.strictEqual(d.slots.length,2); assert.strictEqual(d.slots[0].pct,10);
  // PO: skins dos outros 5 espaços dão +1/+1,5/+2/+3/+4% (lidas do Sys.appearance), e contam no mesmo teto de coleção
  const Sm={skinEq:{},skins:[],sys:{appearance:{skin:{hat:'h04',boots:'b12'}}}}; near(SK.equippedPct(Sm),4+2);   // h04 = Lendário (+4), b12 = Épico (+2)
  Sm.sys.appearance.skin.gloves='g01'; near(SK.equippedPct(Sm),4+2+1.5);   // g01 = Raro (+1,5) assert.strictEqual(SK.detail(Sm).slots.length,2);
  S.skins=Array.from({length:40},(_,i)=>'s'+i); near(SK.collectionPct(S),10);   // teto da coleção assert.strictEqual(SK.rarOf('p20'),4);
  assert.strictEqual(V.active({}),false); assert.deepStrictEqual(V.bonus({}).atkPct,0);
  // tabela da tela 18 (proposta): VIP 1 = +5% ATK/HP, +10% ouro/XP, sem baú extra; VIP 5 = +8%, +18%, offline x2, 10 baús/dia, +1 chave
  const Sv={}; V.setActive(Sv,true); assert.strictEqual(V.bonus(Sv).atkPct,5); assert.strictEqual(V.perks(Sv).chestCapAdd,0); assert.strictEqual(V.perks(Sv).xpPct,10); assert.strictEqual(V.perks(Sv).speedMax,2); assert.strictEqual(V.mult(Sv,'offline'),1);
  V.setLevel(Sv,5); assert.strictEqual(V.bonus(Sv).atkPct,8); assert.strictEqual(V.perks(Sv).chestCapAdd,2); assert.strictEqual(V.perks(Sv).instanceKeysAdd,1); assert.strictEqual(V.levelInfo(1).keys,1); assert.strictEqual(V.levelInfo(10).keys,1); assert.strictEqual(V.mult(Sv,'offline'),2);
  for(let n=1;n<=10;n++) for(const k of ['atkPct','goldXpPct','keys','chestPerDay','offlineMult']) assert.ok(V.levelInfo(n)[k]>=V.levelInfo(n-1)[k],'só cresce: '+k+' no VIP '+n);
  // pontos: o nível só sobe
  const Sp={}; assert.strictEqual(V.addPoints(Sp,V.DATA.points[3]).to,3); V.setLevel(Sp,6); assert.strictEqual(V.addPoints(Sp,1).to,6,'pontos não rebaixam');
  // VIP 1-10 e velocidade (regra nova do dono): x1; x2 com qualquer VIP OU nível 15; x4 só com VIP 5+ E nível 40+
  const L2=require('../../js/sys/level.js'), sp=(vip,lv)=>{ const Sx={}; V.setLevel(Sx,vip); L2.ensure(Sx).lvl=lv; return V.speedMax(Sx); };
  assert.strictEqual(sp(0,1),1); assert.strictEqual(sp(0,15),2); assert.strictEqual(sp(1,1),2); assert.strictEqual(sp(4,99),2); assert.strictEqual(sp(5,39),2); assert.strictEqual(sp(5,40),4); assert.strictEqual(sp(10,100),4);
  const Sd={}; V.setLevel(Sd,0); L2.ensure(Sd).lvl=3; const md=V.maxSpeed(Sd); assert.strictEqual(md.next.speed,2); assert.strictEqual(md.next.text,'x2: nível 15 ou VIP');
  assert.ok(md.next.need.vip===1||md.next.need.level===15);
  const Sv5={}; V.setLevel(Sv5,5); L2.ensure(Sv5).lvl=20; assert.deepStrictEqual(V.maxSpeed(Sv5).next.need,{level:40});
  assert.strictEqual(V.level({vip:true}),1,'save antigo com a flag = VIP 1');
  // compatibilidade com a Loja (js/screens.js lê DATA.bonus e DATA.perks): não podem sumir
  assert.strictEqual(typeof V.DATA.bonus.atkPct,'number'); assert.strictEqual(typeof V.DATA.perks.xpPct,'number'); assert.ok(V.setLevel(Sd,99)&&V.level(Sd)===10);
  const h=makeHost(); assert.strictEqual(P.onOffline(Sv,h,8*3600),96,'pedras offline em dobro'); assert.strictEqual(P.onOffline({},h,8*3600),48);
  delete globalThis.Sys.skin; delete globalThis.Sys.vip;   // não vazar para os testes seguintes
});

/* ---------- qualidade do item (atrás de chave; desligada no jogo) ---------- */
t('qualidade: sorteio puxado para baixo, estrelas, ×0,9-1,3 (média ×1), regra de ouro no principal, save antigo ×1 e transformação mantém',()=>{
  const ST=require('../../js/sys/stats.js'), Q=ST.DATA.quality; assert.strictEqual(Q.on,false,'a chave nasce DESLIGADA');
  assert.strictEqual(ST.qualityMult({qp:0}),1,'desligada: sem efeito');
  Q.on=true;
  try{
    const {seeded}=require('./_host.js'), rng=seeded(11); let n6=0,n8=0,N=200000; for(let i=0;i<N;i++){ const q=ST.rollQuality(rng); assert.ok(q>=0&&q<=10000); if(q>=6000) n6++; if(q>=8000) n8++; }
    near(n6/N,0.10,0.005); near(n8/N,0.02,0.002);
    assert.strictEqual(ST.rollQuality(()=>0),10000,'o prêmio de 1 em 1 milhão'); assert.ok(ST.rollQuality(()=>0.9999999)<=100);
    assert.deepStrictEqual([0,1999,2000,5999,6000,8000,10000].map(ST.qualityStars),[1,1,2,3,4,5,5]);
    near(ST.qualityMult({qp:0}),0.9); near(ST.qualityMult({qp:10000}),1.3); near(ST.qualityMult({qp:2500}),1); near(ST.qualityMult({}),1);   // sem qp = 2.500 (a média)
    { let sm=0; const r2=seeded(5); for(let i=0;i<100000;i++) sm+=ST.qualityMult({qp:ST.rollQuality(r2)}); near(sm/100000,1,0.01); }   // média dos sorteados ≈ ×1,00
    // REGRA DE OURO: no mesmo espaço, era e nível, raridade maior com qp 0 vence a menor com qp 10.000 no PRINCIPAL (todos os espaços)
    for(const slot of ST.DATA.slots) for(const e of [0,3,6]) for(const L of [1,50,100]) for(let r=1;r<=4;r++){
      if(slot==='wing'&&r-1<2) continue;
      const hi=ST.mainOf({slot,e,r,qp:0},L,0), lo=ST.mainOf({slot,e,r:r-1,qp:10000},L,0);
      for(const k in hi) if(lo[k]>0) assert.ok(hi[k]>lo[k],`${slot} e${e} Nv${L} r${r}×r${r-1} ${k}: ${hi[k]} ≤ ${lo[k]}`); }
    const old={id:3,slot:'boots',e:1,r:2,lvl:5}; ST.migrateItem(old); assert.strictEqual(old.qp,2500,'item antigo = a média (×1,00)'); assert.strictEqual(old.look,1);
    // degrau ×1,5 exato em velocidade e dano crítico; ×1,55 nos outros %
    near(ST.mainOf({slot:'boots',e:0,r:4,qp:2500},1,0).aspd,4*5.0625); near(ST.mainOf({slot:'wing',e:0,r:4,qp:2500},1,0).atkPct,3*5.77);
    // FUSÃO: 3 iguais 2★ (qp 2.000/3.000/3.999, média 2.999,7) → 3★ na mesma posição relativa (4.000 + 0,5·1.999 ≈ 5.000)
    const mk=(id,qp,lvl,gold)=>({id,slot:'hat',e:2,r:2,lvl,gold,qp,look:2,subs:[{k:'critRate',q:qp/10000}]});
    const hf=makeHost(); let paid=0; hf.spendGold=n=>{ paid+=n; return true; };
    const fu=ST.fuse({},hf,[mk(1,2000,10,100),mk(2,3000,40,50),mk(3,3999,5,0)]); assert.ok(fu.ok); assert.strictEqual(fu.toStars,3);
    assert.strictEqual(fu.result.qp,Math.round(4000+((2000+3000+3999)/3-2000)/1999*1999)); assert.strictEqual(fu.result.lvl,40,'maior nível'); assert.strictEqual(fu.result.gold,150,'soma do ouro');
    assert.strictEqual(fu.result.subs[0].q,0.3999,'secundários do de maior qp'); assert.deepStrictEqual(fu.consumed,[1,2,3]); assert.ok(paid>0);
    assert.strictEqual(ST.canFuse({},hf,[mk(1,8000,1,0),mk(2,9000,1,0),mk(3,9999,1,0)]).reason,'max','5★ não funde');
    assert.strictEqual(ST.canFuse({},hf,[mk(1,6000,1,0),mk(2,7999,1,0),mk(3,7999,1,0)]).result.qp<=9999,true,'o 10.000 só por drop');
    assert.strictEqual(ST.canFuse({},hf,[mk(1,2000,1,0),mk(2,4000,1,0),mk(3,3000,1,0)]).reason,'different','estrelas diferentes');
    assert.strictEqual(ST.canFuse({},hf,[mk(1,2000,1,0),mk(1,2000,1,0),mk(3,3000,1,0)]).reason,'count','o mesmo item duas vezes');
    const tw={slot:'weapon',e:1,r:2,lvl:10,gold:0,qp:8765,subs:[]}; ST.transform({},makeHost({eraMax:3}),tw); assert.strictEqual(tw.qp,8765,'transformação mantém a qualidade');
  } finally { Q.on=false; }
});

t('item de era futura "adormecido": rende como 1 era à frente, no Nv 1, não sobe; acorda na era dele (meta: no máximo +1 fase)',()=>{
  const ST=require('../../js/sys/stats.js'), FE=ST.DATA.futureEra; assert.strictEqual(FE.on,false,'a chave nasce DESLIGADA');
  const h=makeHost({eraMax:2}), w={slot:'weapon',e:4,r:2,lvl:26,subs:[]};
  assert.ok(!ST.isDormant(w,h)); FE.on=true;
  try{
    assert.ok(ST.isDormant(w,h)); assert.strictEqual(ST.dormantInfo(w,h).label,'Adormecido · acorda na era 4'); const v=ST.dormantView(w,h); assert.strictEqual(v.e,3); assert.strictEqual(v.lvl,1); assert.strictEqual(v.look,4,'o visual continua o da era 4');
    assert.strictEqual(w.e,4,'o item guardado não muda'); assert.strictEqual(ST.canUpgrade({},h,w).reason,'dormant'); assert.strictEqual(ST.planUpgrade({},h,w,'gold').reason,'dormant');
    // ritmo: com a arma era 4 adormecida, o jogador da era 2 sobe no máximo 1 fase a mais
    const REC=[1440,12300,395000,13900000,829000000,34300000000,1540000000000], rec=st=>{ const e=Math.min(6,Math.floor((st-1)/10)), i=((st-1)%10)+1, a=e>0?REC[e-1]:264; return a*Math.pow(REC[e]/a,i/10); };
    const reach=fc=>{ let s=1; while(s<70&&rec(s+1)<=fc) s++; return s; };
    const base={}; for(const s of ['weapon','armor','hat','gloves','boots','necklace']) base[s]={slot:s,e:2,r:2,lvl:26,subs:[]}; let eq=base; h.equipped=()=>eq;
    const S={}; const r0=reach(F.compute(S,h)); eq=Object.assign({},base,{weapon:w}); assert.ok(reach(F.compute(S,h))-r0<=1,'no máximo +1 fase');
    h._eraMax=4; assert.ok(!ST.isDormant(w,h),'acordou'); assert.strictEqual(ST.dormantView(w,h),w);
  } finally { FE.on=false; }
});

/* ---------- pets Revisão 3 (atrás de chave; desligada no jogo) ---------- */
t('pet v3: nível por pet até 90, estágios 30/60, ração 1,05, 3 ataques, migração sem perda e teto de 20%',()=>{
  assert.strictEqual(PET.DATA.v3,false,'a chave nasce DESLIGADA (nada no jogo até a tela e a arte)');
  // fênix pelo andar 100 (exceção do portão de raridade, que já está carregado pelos testes anteriores)
  const h=makeHost({eraMax:0}), S=newS(); PET.addEgg(S,h,{r:4,source:'tower100'}); PET.addEgg(S,h,{r:0}); PET.ensure(S).lvl=12;   // nível compartilhado antigo = 12
  assert.ok(!('lvl' in PET.ensure(S).owned.phoenix),'chave desligada: não grava nível por pet (não congela)');
  PET.DATA.v3=true;
  try{
    const o=PET.ensure(S); assert.strictEqual(o.owned.phoenix.lvl,12,'migração: herda o nível compartilhado'); assert.strictEqual(o.owned.wolf.lvl,12);
    assert.strictEqual(PET.lvlCap(h),10); h._eraMax=6; assert.strictEqual(PET.lvlCap(h),90); h._eraMax=8; assert.strictEqual(PET.lvlCap(h),90,'eras 7-8: só estrelas');
    assert.strictEqual(PET.foodCost(10),Math.ceil(3*Math.pow(1.05,9)));
    PET.addFood(S,1e7,h); PET.equip(S,'phoenix'); PET.feed(S,h,18,'phoenix'); assert.strictEqual(o.owned.phoenix.lvl,30); assert.strictEqual(o.owned.wolf.lvl,12,'nível POR pet');
    assert.strictEqual(PET.stage(S,'phoenix').id,'mid'); assert.strictEqual(PET.stage(S,'wolf').next.at,30);
    // salto do estágio: ×1,25 no 30 sobre a curva
    o.owned.phoenix.lvl=29; const p29=PET.pOf(S,'phoenix'); o.owned.phoenix.lvl=30; const p30=PET.pOf(S,'phoenix'); assert.ok(p30/p29>1.2&&p30/p29<1.3);
    // chances: 1★ Nv 1 = 7% / 3%; 5★ Nv 90 = 12% / 6%; média 1,325 → 1,57
    let a=PET.attackOdds(1,1); near(a.crit,0.07); near(a.mid,0.03); near(a.avg,1.325,1e-9);
    a=PET.attackOdds(5,90); near(a.crit,0.12); near(a.mid,0.06); near(a.avg,1.57,1e-9);
    // o sorteio tem média 1 (a FC conta a média): 20 mil golpes
    const {seeded}=require('./_host.js'), rng=seeded(7); let sum=0,cr=0; for(let i=0;i<20000;i++){ const r=PET.rollAttack(S,'phoenix',rng); sum+=r.mult; if(r.type==='crit') cr++; }
    near(sum/20000,1,0.03); near(cr/20000,PET.attackOdds(1,30).crit,0.01);
    // teto: fênix 5★ Nv 90 evoluída = 20% da FC total
    o.owned.phoenix.stars=5; o.owned.phoenix.lvl=90; assert.strictEqual(PET.stage(S,'phoenix').id,'evolved'); near(PET.pOf(S,'phoenix'),0.25,1e-9);
    const fcB=F.compute({best:1,skins:[],inv:[]},makeHost()), fcT=F.compute(S,makeHost()); near((fcT-fcB)/fcT,0.2,0.01);
    assert.strictEqual(PET.canFeed(S,h,'phoenix').reason,'max');
    // LIBERAR: devolve 80% da ração gasta no pet e volta ao Nv 1 (o pet e as estrelas ficam)
    const fw0=o.food, spentW=(()=>{ let g=0; for(let n=12;n<20;n++) g+=PET.foodCost(n); return g; })(); PET.feed(S,h,8,'wolf'); assert.strictEqual(o.owned.wolf.lvl,20);
    assert.strictEqual(o.owned.wolf.food,spentW); const rel=PET.release(S,h,'wolf'); assert.ok(rel.ok); assert.strictEqual(rel.refund,Math.floor(spentW*0.8));
    assert.strictEqual(o.food,fw0-spentW+Math.floor(spentW*0.8)); assert.strictEqual(o.owned.wolf.lvl,1); assert.strictEqual(o.owned.wolf.stars,1); assert.strictEqual(PET.canRelease(S,'wolf').reason,'level');
  } finally { PET.DATA.v3=false; }
  assert.strictEqual(PET.rollAttack(S,'phoenix').mult,1,'com a chave desligada: só o golpe básico de antes'); assert.strictEqual(PET.canRelease(S,'phoenix').reason,'off');
});

/* ---------- luta justa, arena e visual ---------- */
t('luta justa: o adversário-cópia tem a FC pedida e a chance depende só da razão de FC',()=>{
  const ST=require('../../js/sys/stats.js'); const h=makeHost(); h.equipped=()=>({weapon:{slot:'weapon',e:0,r:0,lvl:5},armor:{slot:'armor',e:0,r:0,lvl:5}});
  const S={}, me=W.playerStats(S,h), rate=k=>{ const foe=W.scaledFoe(me,me.fc*k); let w=0; for(let i=0;i<400;i++) if(W.duel(me,foe,i*7919+13).win) w++; return w/400; };
  near(F.fcOfStats(W.scaledFoe(me,me.fc*1.2)),me.fc*1.2,2);
  const r1=rate(1); assert.ok(r1>0.35&&r1<0.8,'FC igual ≈ metade ('+r1+')'); assert.ok(rate(0.9)>0.95); assert.ok(rate(1.12)<0.05);
  assert.strictEqual(W.difficulty(100,100).id,'even'); assert.strictEqual(W.difficulty(110,100).id,'easy'); assert.strictEqual(W.difficulty(80,100).id,'nope');
});
t('arena: 5 lutas/dia, pontos, adversários ±10%, ranking da semana, virada e prêmio desligado contra bots',()=>{
  const A=require('../../js/sys/arena.js'); const h=makeHost(); h.equipped=()=>({weapon:{slot:'weapon',e:0,r:0,lvl:5},armor:{slot:'armor',e:0,r:0,lvl:5}});
  const S={}, fc=F.compute(S,h), ops=A.opponents(S,h); assert.strictEqual(ops.length,3);
  for(const o of ops) assert.ok(o.fc>=fc*0.9-1&&o.fc<=fc*1.1+1,'±10%');
  assert.deepStrictEqual(A.opponents(S,h).map(o=>o.id),ops.map(o=>o.id),'a lista fica fixa no dia');
  let n=0; for(let i=0;i<7;i++){ const r=A.fight(S,h,A.opponents(S,h)[0].id); if(r.ok) n++; else assert.strictEqual(r.reason,'tries'); } assert.strictEqual(n,5);
  assert.strictEqual(A.fight(S,h,'nada').reason,'tries'); const o=A.ensure(S,h); assert.ok(o.points!==1000);
  assert.ok(A.refresh(S,h).ok); assert.strictEqual(A.refresh(S,h).reason,'refresh');
  const rk=A.ranking(S,h,'arena'); assert.strictEqual(rk.list.length,50); assert.ok(rk.list.some(x=>x.me)); assert.ok(rk.bots);
  const rf=A.ranking(S,h,'fc'); assert.strictEqual(rf.me.value,Math.max(F.weekMax(S,h),F.compute(S,h)));
  assert.deepStrictEqual(A.ranking(S,h,'fc').list.map(x=>x.value),rf.list.map(x=>x.value),'bots fixos na semana');
  h.t+=86400000; A.ensure(S,h); assert.strictEqual(A.ensure(S,h).attemptsLeft,5,'virada do dia');
  const gems0=h.gems; h.t+=7*86400000; A.ensure(S,h); const lw=S.sys.arena.lastWeek;
  assert.ok(lw&&lw.rank>=1&&lw.rewardsOff&&lw.reward===null,'contra bots: sem prêmio'); assert.strictEqual(h.gems,gems0);
  assert.strictEqual(S.sys.arena.points,1000); assert.ok(S.sys.arena.bestRank>=1);
  // provider trocável (servidor no futuro)
  const fake={getRanking:()=>({list:[],me:{rank:1,value:9},bots:false}),listOpponents:()=>[],reportResult:()=>({ok:true}),weekInfo:()=>({})};
  assert.ok(A.setProvider(fake)); assert.strictEqual(A.ranking(S,h,'arena').me.rank,1); A.setProvider(null); assert.strictEqual(A.getProvider(),A.localProvider);
});
t('appearance: o que desenhar em cada um dos 7 espaços (skin > visual do item > nada), esconder peça',()=>{
  const AP=require('../../js/sys/appearance.js'), h=makeHost();
  const it={slot:'weapon',e:4,r:2,look:1}; h.equipped=()=>({weapon:it,hat:{slot:'hat',e:0,r:0}});
  const S={skinEq:{armor:'a12'}}; let v=AP.of(S,h);
  assert.strictEqual(v.weapon.key,'item/weapon/e1_r2','usa o look (visual de origem), não a era de poder'); assert.strictEqual(v.armor.source,'skin');
  assert.strictEqual(v.gloves.source,'none'); assert.strictEqual(Object.keys(v).length,7);
  assert.ok(AP.setSkin(S,'weapon','w33')); assert.strictEqual(S.skinEq.weapon,'w33','arma: grava em S.skinEq (conta no poder do Sys.skin)');
  assert.ok(AP.setSkin(S,'hat','h2')); assert.strictEqual(AP.of(S,h).hat.key,'skin/h2'); assert.ok(!('hat' in S.skinEq));
  assert.ok(AP.setHidden(S,'hat',true)); assert.ok(AP.of(S,h).hat.hidden); assert.ok(!AP.setHidden(S,'weapon',true),'a arma não se esconde');
  AP.setSkin(S,'weapon',null); assert.strictEqual(AP.of(S,h).weapon.source,'item');
});

/* ---------- nível do jogador (carregado só aqui no fim: os testes acima rodam sem portões, como sem o Sys.level) ---------- */
t('level: XP, +0,3%/nível na FC, desbloqueios e portões de raridade dos ovos',()=>{
  const L=require('../../js/sys/level.js'), S=newS(), h=makeHost({eraMax:0});
  assert.strictEqual(L.level(S),1); near(L.bonus(S).atkPct,0.3);
  const r=L.addXp(S,L.need(1)+L.need(2)+L.need(3)+L.need(4),h); assert.strictEqual(r.to,5); assert.deepStrictEqual(r.unlocked,['missions','summon','practice']);
  // fonte única (PO): a tabela do Sys.level é a do menu (FB_UNLOCK); 'inst' é apelido de 'instances'; 'pet' (portão do módulo) não aparece duas vezes
  { const FB={missions:2,summon:3,practice:5,mail:7,login:7,profile:10,shopgem:10,forge:12,inst:14,tower:15,pass:18,pets:20,events:24,rank:28,arena:28,guild:32,mount:38,tourney:40,auction:45,wing:50};
    for(const k in FB) assert.strictEqual(L.unlockLevel(k),FB[k],k); assert.strictEqual(L.unlockLevel('pet'),1);
    const Sn=newS(); assert.strictEqual(L.nextUnlock(Sn).feature,'missions'); L.ensure(Sn).lvl=19; assert.strictEqual(L.nextUnlock(Sn).feature,'pets');
    const r20=L.addXp(Sn,L.need(19),makeHost({eraMax:0})); assert.deepStrictEqual(r20.unlocked,['pets']); }
  assert.ok(h.toasts.some(m=>m.includes('Práticas'))); near(L.bonus(S).hpPct,1.5);
  // XP de instância escala com a dificuldade (3º parâmetro); valor inválido vale 1
  const Si=newS(), hi=makeHost({eraMax:0}); const x1=L.onInstance(Si,hi).gained, x25=L.onInstance(Si,hi,2.5).gained;
  assert.strictEqual(x25,Math.round(x1*2.5)); assert.strictEqual(L.onInstance(Si,hi,'x').gained,x1); assert.strictEqual(L.onInstance(Si,hi,-3).gained,x1);
  L.ensure(S).lvl=100; near(L.bonus(S).atkPct,30); assert.strictEqual(L.addXp(S,1e9,h).levels,0,'nível 100 é o máximo');
  assert.ok(L.DATA.xpToNext.every((x,i,a)=>i===0||x>=a[i-1]),'curva crescente');
  // bloqueios: com o Sys.level carregado, forja/torre/práticas respeitam o nível; materiais continuam entrando
  const S2=newS(); G.addStones(S2,100,h); assert.strictEqual(G.canTry(S2,h,'weapon').reason,'locked'); assert.strictEqual(G.ensure(S2).stones,100);
  assert.strictEqual(W.fight(S2,h).reason,'locked'); P.addStones(S2,50,h); assert.strictEqual(P.canTrain(S2,h,'str').reason,'locked');
  const el={clientHeight:480}; G.render(el,S2,h); assert.ok(el.innerHTML.includes('Libera no nível 12'));
  for(const M of [G,W,P]){ M.render(el,S2,h); assert.ok(el.innerHTML.includes('<svg class="sys-lock-ic"')&&!el.innerHTML.includes('🔒'),'cadeado desenhado, sem emoji'); }
  L.ensure(S2).lvl=12; assert.strictEqual(G.canTry(S2,h,'weapon').reason,'');
  // portões: Mítico nível 70 + era 4; Lendário 85 + era 5; abaixo, a raridade permitida mais alta
  const S3=newS(), hh=makeHost({eraMax:3}); L.ensure(S3).lvl=90;
  assert.strictEqual(L.eggMaxR(S3,hh,4),2,'era 3: nem Mítico');
  let e=PET.addEgg(S3,hh,{r:3}); assert.strictEqual(e.pet,'drake'); assert.ok(e.gated);
  hh._eraMax=4; assert.strictEqual(L.eggMaxR(S3,hh,4),3); hh._eraMax=5; assert.strictEqual(L.eggMaxR(S3,hh,4),4);
  L.ensure(S3).lvl=60; hh._eraMax=6; assert.strictEqual(L.eggMaxR(S3,hh,3),2,'nível 60: sem Mítico');
  // exceção: fênix do andar 100
  e=PET.addEgg(S3,hh,{r:4,source:'tower100'}); assert.strictEqual(e.pet,'phoenix');
  // subida em cadeia bloqueada (Épico 5★ → Mítico antes do nível 70) vira ração, sem laço infinito
  PET.ensure(S3).owned.drake.stars=5; const f0=PET.ensure(S3).food; e=PET.addEgg(S3,hh,{r:2});
  assert.strictEqual(e.to,'food'); assert.ok(e.gatedUp); assert.strictEqual(PET.ensure(S3).food-f0,12);
  // fonte única: com o Sys.loot carregado, o portão vem do capEggR da fps-30 e dá o mesmo resultado
  require('../../js/sys/loot.js'); L.ensure(S3).lvl=60; hh._eraMax=6;
  assert.strictEqual(L.eggMaxR(S3,hh,3),2); L.ensure(S3).lvl=75; assert.strictEqual(L.eggMaxR(S3,hh,3),3); assert.strictEqual(L.eggMaxR(S3,hh,4),2+1,'Nv 75: Mítico sim, Lendário não');
  L.ensure(S3).lvl=90; assert.strictEqual(L.eggMaxR(S3,hh,4),4);
  // a FC soma o nível
  const S4=newS(), fcA=F.compute(S4,makeHost()); L.ensure(S4).lvl=100; assert.ok(F.compute(S4,makeHost())>fcA*1.29);
});

/* ---------- Revisões 4 e 5: pets novos e Prismático (chave Sys.pet.DATA.v4, exige v3) ---------- */
t('pet v4/v5: desligada não muda nada; ligada: era 7-8, fênix pelo nome, Prismático com 1.000 fragmentos e fontes sem sorteio',()=>{
  const V=require('../../js/sys/vip.js'), A=require('../../js/sys/arena.js'); globalThis.Sys.vip=V;   // um teste antigo apaga o Sys.vip
  // DESLIGADA: pets novos não aparecem, nenhuma fonte entrega
  { const S=newS(), h=makeHost({eraMax:8}); assert.ok(!PET.avail(PET.DATA.pets.find(p=>p.id==='prism'),h));
    assert.strictEqual(PET.prismBoss(S,h).reason,'off'); assert.strictEqual(PET.addFragments(S,'prism',10,h).reason,'off'); assert.strictEqual(PET.ensure(S).stored.prism,undefined,'desligada não guarda'); V.setLevel(S,10); assert.strictEqual(PET.prismVipMax(S,h).reason,'off');
    assert.strictEqual(W.rewardsFor(130,h).prismFrags,0); for(let i=0;i<300;i++){ const r=PET.addEgg(S,makeHost({eraMax:8,seed:i}),{r:4}); assert.ok(r&&!PET.DATA.pets.find(p=>p.id===r.pet).v4,'ovo não dá pet v4'); } }
  const v3=PET.DATA.v3, v4=PET.DATA.v4; PET.DATA.v3=true; PET.DATA.v4=true;
  try{
    // era: Submundo só na 7, Celestial só na 8; Prismático nunca de ovo
    const seen=e=>{ const s=new Set(); for(let i=0;i<400;i++){ const S=newS(); s.add(PET.addEgg(S,makeHost({eraMax:e,seed:i,level:100}),{r:4}).pet); } return s; };
    const s6=seen(6), s7=seen(7), s8=seen(8);
    assert.ok(!s6.has('underworld')&&!s6.has('celestial')); assert.ok(s7.has('underworld')&&!s7.has('celestial')); assert.ok(s8.has('celestial'));
    for(const s of [s6,s7,s8]) assert.ok(!s.has('prism'),'Prismático não sai de ovo');
    for(let i=0;i<50;i++) assert.strictEqual(PET.addEgg(newS(),makeHost({eraMax:8,seed:i}),{r:4,source:'tower100',pet:'phoenix'}).pet,'phoenix','andar 100 = sempre fênix');
    // 999 guarda, 1.000 nasce; estrelas 50/100/150/200
    const S=newS(), h=makeHost({eraMax:8});
    assert.strictEqual(PET.addFragments(S,'prism',999,h).stored,true); const hb=PET.addFragments(S,'prism',1,h); assert.ok(hb.hatched); assert.strictEqual(hb.stars,1);
    assert.strictEqual(PET.addFragments(S,'prism',49,h).stars,1); assert.strictEqual(PET.addFragments(S,'prism',1,h).stars,2);
    assert.strictEqual(PET.addFragments(S,'prism',100+150+200,h).stars,5);
    // teto POR PET: Prismático 1/3 da FC do herói (25% do total); os outros continuam 0,25
    PET.equip(S,'prism'); const b=PET.bonus(S,h); near(b.petCap,1/3,1e-6);
    near(PET.attackOdds(5,90,'prism').crit,0.14); near(PET.attackOdds(5,90,'prism').mid,0.07); near(PET.attackOdds(5,90,'wolf').crit,0.12);
    // chefe da era 8: 1 por dia; VIP +1 a cada 4 dias; era 7 não dá
    const S2=newS(), h2=makeHost({eraMax:8}); assert.strictEqual(PET.prismBoss(S2,makeHost({eraMax:7})).reason,'era');
    assert.ok(PET.prismBoss(S2,h2).ok); assert.strictEqual(PET.prismBoss(S2,h2).reason,'today'); V.setLevel(S2,1);
    let got=1; for(let d=1;d<8;d++){ h2.t+=86400000; got+=PET.prismBoss(S2,h2).added; } assert.strictEqual(got,8+2,'8 dias + 2 do VIP');
    // VIP 10: 500 uma vez, ao subir de nível (o vip.js chama sozinho)
    const S3=newS(); V.setLevel(S3,9); assert.strictEqual(PET.ensure(S3).stored.prism,undefined); V.setLevel(S3,10); assert.strictEqual(PET.ensure(S3).stored.prism,500);
    V.setLevel(S3,10); assert.strictEqual(PET.prismVipMax(S3,h).reason,'done'); assert.strictEqual(PET.ensure(S3).stored.prism,500);
    // torre: 5 a cada 25 andares acima do 105
    for(const f of [130,155,180]) assert.strictEqual(W.rewardsFor(f,h).prismFrags,5); for(const f of [105,110,125,131]) assert.strictEqual(W.rewardsFor(f,h).prismFrags,0);
    // arena: 10/7/5/3/1 por posição (entregues só quando os prêmios valem: nada contra bots)
    assert.deepStrictEqual([1,2,3,7,30,80].map(r=>(A.DATA.rewards.find(x=>r>=x.from&&r<=x.to).prism||0)),[10,7,5,3,1,0]);
  } finally { PET.DATA.v3=v3; PET.DATA.v4=v4; delete globalThis.Sys.vip; }
});

/* ---------- curva das 9 eras (chaves DESLIGADAS: Sys.level.setV9 e Sys.stats.setEra9) ---------- */
t('curva 9 eras: nível 120, teto diário da XP de abate, XP do VIP, estágios do Kael, Divino e eras 7-8; desligada = como antes',()=>{
  const LV=require('../../js/sys/level.js'), V=require('../../js/sys/vip.js'), ST=require('../../js/sys/stats.js'); globalThis.Sys.vip=V;
  try{
    // desligada: nada muda
    assert.strictEqual(LV.DATA.maxLevel,100); assert.strictEqual(ST.DATA.maxEra,6); assert.strictEqual(ST.maxR(),4);
    { const S=newS(), h=makeHost(); assert.strictEqual(LV.addXp(S,5000,h,'kill').gained,5000,'sem teto desligada'); assert.strictEqual(LV.stage(S,h).on,false);
      assert.strictEqual(V.perks(S).xpPct,0); V.setLevel(S,10); assert.strictEqual(V.perks(S).xpPct,25,'coluna antiga'); }
    LV.setV9(true); ST.setEra9(true);
    assert.strictEqual(LV.DATA.maxLevel,120); assert.strictEqual(LV.DATA.xpToNext.length,119); assert.strictEqual(ST.DATA.maxEra,8); assert.strictEqual(ST.DATA.maxItemLevel,120);
    for(let i=1;i<119;i++) assert.ok(LV.DATA.xpToNext[i]>=LV.DATA.xpToNext[i-1],'curva sem queda no '+(i+1));
    assert.deepStrictEqual(LV.DATA.xpToNext.slice(0,11),LV.DATA.v9off.xpToNext.slice(0,11),'Nv 1-12 = a curva medida (era 0 em 15-18 min)');
    // teto: era 0 T = 3.663 cheio, depois 30% até 2T, depois 10%; outro dia zera; missão sem teto
    const S=newS(), h=makeHost({eraMax:0}); const g=n=>{ const before=LV.ensure(S).total; LV.addXp(S,n,h,'kill'); return LV.ensure(S).total-before; };
    assert.strictEqual(g(3663),3663); assert.strictEqual(g(1000),300); assert.strictEqual(g(2663),799); assert.strictEqual(g(1000),100);
    assert.strictEqual(LV.killCap(S,h).rate,0.1); assert.strictEqual(LV.addXp(S,500,h).gained,500,'sem src = sem teto');
    h.t+=86400000; assert.strictEqual(g(1000),1000,'dia novo zera'); assert.strictEqual(LV.killCap(S,h).left,2663);
    // VIP no v9: coluna xp9 (o ouro não muda) e o teto sobe junto com o XP do VIP
    const S2=newS(); V.setLevel(S2,10); assert.strictEqual(V.perks(S2).xpPct,V.DATA.table.xp9[10]); assert.strictEqual(V.perks(S2).goldPct,25);
    assert.strictEqual(LV.killCap(S2,h).full,Math.round(3663*(1+V.DATA.table.xp9[10]/100)));
    // estágios do Kael: nível E FC
    const S3=newS(), h3=makeHost(); assert.strictEqual(LV.stage(S3,h3).stage,0); assert.strictEqual(LV.evolve(S3,h3).reason,'need');
    LV.ensure(S3).lvl=22; const st=LV.stage(S3,h3); assert.strictEqual(st.next.id,'teen'); assert.strictEqual(st.next.needLvl,0);
    assert.strictEqual(st.ready,st.next.needFc===0,'pronto só com a FC também');
    // Divino: r 5 com ×1,8 nos planos sobre o Lendário
    const m4=ST.mainOf({slot:'weapon',e:7,r:4,lvl:1},1,0).atk, m5=ST.mainOf({slot:'weapon',e:7,r:5,lvl:1},1,0).atk; near(m5/m4,1.8,1e-9);
  } finally { LV.setV9(false); ST.setEra9(false); delete globalThis.Sys.vip; }
  assert.strictEqual(LV.DATA.maxLevel,100); assert.strictEqual(ST.DATA.maxEra,6); assert.strictEqual(ST.maxR(),4);
});

/* ---------- pet no nível 20 (chave Sys.pet.DATA.v20 DESLIGADA) ---------- */
t('pet v20: abre no 20, 1º ovo grátis 79/21 (nunca acima do Raro), ovos de antes guardados e chocam depois, API de batalha',()=>{
  const LV=require('../../js/sys/level.js');
  assert.strictEqual(PET.firstEgg(newS(),makeHost()).reason,'off');
  PET.DATA.v20.on=true;
  try{
    const S=newS(), h=makeHost({eraMax:1,level:100}); LV.ensure(S).lvl=15;
    const pre=PET.addEgg(S,h,{r:2}); assert.ok(pre.held&&pre.pre,'ovo antes do 1º fica guardado'); assert.strictEqual(Object.keys(PET.ensure(S).owned).length,0);
    assert.strictEqual(PET.firstEgg(S,h).reason,'level'); assert.strictEqual(PET.battleInfo(S,h),null);
    LV.ensure(S).lvl=20; const f=PET.firstEgg(S,h); assert.ok(f.ok); assert.ok(f.rarity<=1); assert.strictEqual(PET.ensure(S).eq,f.pet,'entra equipado');
    assert.strictEqual(f.pre.length,1); assert.strictEqual(PET.ensure(S).pre.length,0); assert.strictEqual(PET.firstEgg(S,h).reason,'done');
    assert.deepStrictEqual(PET.firstEggOdds().map(o=>o.pct),[79,21]);
    const b=PET.battleInfo(S,h); assert.strictEqual(b.interval,2); assert.strictEqual(b.hitMult,2.5); assert.ok(b.stage>=1&&b.stage<=3); assert.ok(/^pet_\w+_s[123]$/.test(b.draw.sprite));
    // chances: 20 mil sorteios ≈ 79/21, nunca Épico ou acima
    let c=[0,0,0,0,0]; for(let i=0;i<20000;i++){ const s2=newS(); LV.ensure(s2).lvl=20; c[PET.firstEgg(s2,makeHost({seed:i+1,level:100})).rarity]++; }
    near(c[0]/20000,0.79,0.015); near(c[1]/20000,0.21,0.015); assert.strictEqual(c[2]+c[3]+c[4],0);
    // save antigo com pet: já conta como feito (não ganha outro ovo)
    const old={sys:{pet:{owned:{wolf:{stars:2}}}}}; LV.ensure(old).lvl=30; assert.strictEqual(PET.firstEgg(old,h).reason,'done');
  } finally { PET.DATA.v20.on=false; }
});

/* ---------- coerência de dano (regra do dono): todo golpe sai dos atributos e fica no teto da tabela ---------- */
t('dano: em cada era, o maior golpe possível ÷ ATK ≤ teto da tabela, e nunca passa de 5,5 × FC',()=>{
  const ST=require('../../js/sys/stats.js'), S2N=[1,3,3,2,5,6,2], ULT=[0.125,0.125,0.125,0.125,0.5];
  for(let e=0;e<7;e++) for(const L of [5,20,45,80,100]){ const S={sys:{level:{lvl:L,xp:0}}}, eq={};
    for(const s of ST.DATA.slots){ if(s==='wing'&&L<50) continue; eq[s]={slot:s,e,r:Math.min(4,Math.floor(L/25)),lvl:L,subs:[{k:'critDmg',q:1},{k:'critRate',q:1}]}; }
    const h={equipped:()=>eq,eraMax:()=>e,level:()=>L,atk:()=>0,hp:()=>0,now:()=>0}, st=F.stats(S,h), fc=F.compute(S,h);
    assert.ok(st.critDmg<=ST.DATA.caps.critDmg,'dano crítico no teto');
    const big=(mult,type)=>{ const d=ST.hit(st,mult,0,true).dmg*1.1; const c=ST.checkHit(st,d,type); assert.ok(c.ok,'era '+e+' Nv '+L+' '+type+': '+c.ratio.toFixed(2)+' > '+c.max.toFixed(2)); return d; };
    big(1,'s1'); big(3/S2N[e],'s2'); let mx=0; for(const k of ULT) mx=Math.max(mx,big(10*k,'s3'));
    assert.ok(mx<=5.5*fc,'maior número '+mx.toExponential(2)+' > 5,5 × FC '+fc.toExponential(2)); }
});

t('arena: luta decidida pelo provider (servidor autoritativo); o local dá o mesmo resultado de antes',()=>{
  const A=require('../../js/sys/arena.js'); const mk=()=>{ const h=makeHost(); h.equipped=()=>({weapon:{slot:'weapon',e:0,r:0,lvl:5},armor:{slot:'armor',e:0,r:0,lvl:5}}); return h; };
  const S=newS(), h=mk(), op=A.opponents(S,h)[0]; const r=A.fight(S,h,op.id); assert.ok(r.ok); assert.ok(typeof r.seed==='number'); assert.ok(r.duel);
  // provider "servidor": decide sozinho (win/delta/points); o cliente só guarda e anima
  const srv=Object.assign({},A.localProvider,{fight:(S2,h2,opp)=>({ok:true,win:true,delta:7,points:1234,seed:99,log:[{t:0,who:'me',dmg:1}]})});
  assert.ok(A.setProvider(srv)); try{ const S2=newS(), h2=mk(), o2=A.opponents(S2,h2)[0]; const left=A.ensure(S2,h2).attemptsLeft;
    const f=A.fight(S2,h2,o2.id); assert.ok(f.win); assert.strictEqual(f.points,1234); assert.strictEqual(f.seed,99); assert.strictEqual(f.log.length,1);
    assert.strictEqual(A.ensure(S2,h2).attemptsLeft,left-1); } finally { A.setProvider(null); }
});

t('servidor: os módulos da luta rodam no Node SEM window e SEM DOM, e o duelo devolve o log (contrato /arena/fight)',()=>{
  const vm=require('vm'), path=require('path'); const ctx={console,Math,Date,JSON,Object,Array,Number,String,Set,Map,isFinite,Error}; ctx.globalThis=ctx; vm.createContext(ctx);
  for(const f of ['stats','fc','level','forge','practice','titles','skin','vip','pet','tower','arena']) vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js/sys/'+f+'.js'),'utf8'),ctx,{filename:f});
  assert.ok(!('window' in ctx)&&!('document' in ctx));
  const S=ctx.Sys, s={sys:{}}, h={equipped:()=>({weapon:{slot:'weapon',e:2,r:2,lvl:30},armor:{slot:'armor',e:2,r:2,lvl:30}}),eraMax:()=>2,level:()=>30,now:()=>Date.UTC(2026,10,12),atk:()=>0,hp:()=>0};
  const me=S.tower.playerStats(s,h), d=S.tower.duel(me,S.tower.scaledFoe(me,me.fc),7);
  assert.ok(Array.isArray(d.log)&&d.log.length>0); assert.strictEqual(typeof d.win,'boolean');
  const again=S.tower.duel(me,S.tower.scaledFoe(me,me.fc),7); assert.deepStrictEqual(again,d,'mesma seed = mesmo duelo');
  near(S.fc.fcOfStats(me),me.fc,me.fc*0.01);   // a conferência do snapshot (±1%) aceita o retrato honesto
});

t('pet 17b (tela PETS V2): espécies do protótipo, evoluir manual 30/60, teto por estágio, bônus 8-25% da FC total, ração por toque, redefinir mantém estágio',()=>{
  const v3=PET.DATA.v3; PET.DATA.v3=true; PET.setV17(true);
  try{
    const W=PET.DATA.pets, by=id=>W.find(p=>p.id===id);
    assert.strictEqual(by('wolf').name,'Mamute'); assert.strictEqual(by('owl').name,'Esfinge'); assert.strictEqual(by('golem').name,'Cão mecânico'); assert.strictEqual(by('golem').r,3);
    assert.strictEqual(by('underworld').r,3,'Cérbero Mítico'); assert.strictEqual(by('wolf').sprite,'era0_mammoth');
    const h=makeHost({eraMax:6}); assert.ok(PET.avail(by('parrot'),makeHost({eraMax:3}))); assert.ok(!PET.avail(by('parrot'),makeHost({eraMax:2})));
    const S=newS(); S.sys={pet:{owned:{wolf:{stars:5,lvl:1}},eq:'wolf',food:1e6}}; PET.ensure(S);
    // teto do estágio: para no 30 até evoluir
    PET.feed(S,h,100,'wolf'); assert.strictEqual(PET.levelOf(S,'wolf'),30); assert.strictEqual(PET.canFeed(S,h,'wolf').reason,'evolve');
    assert.ok(PET.stage(S,'wolf').ready); assert.ok(PET.evolve(S,'wolf').ok); assert.strictEqual(PET.stage(S,'wolf').index,1);
    PET.feed(S,h,100,'wolf'); assert.strictEqual(PET.levelOf(S,'wolf'),60); assert.ok(PET.evolve(S,'wolf').ok); assert.strictEqual(PET.evolve(S,'wolf').reason,'max');
    // bônus linear e máximo por raridade (share da FC total)
    const pmax=r=>{ const p=0.25*PET.DATA.rarW[r]; return Math.round(p/(1+p)*1000)/10; }; assert.deepStrictEqual([0,1,2,3,4,5].map(pmax),[8,11,14,17,20,25]);
    // redefinir: Nv 1, 80% da ração, estágio fica
    const rs=PET.resetLevel(S,h,'wolf'); assert.ok(rs.ok); assert.strictEqual(PET.levelOf(S,'wolf'),1); assert.strictEqual(PET.stage(S,'wolf').index,2,'estágio fica');
    // ração por toque: barra parcial
    S.sys.pet.food=10; const ft=PET.feedTap(S,h,'wolf'); assert.ok(ft.ok); assert.ok(ft.given<=10);
  } finally { PET.setV17(false); PET.DATA.v3=v3; }
  assert.strictEqual(PET.DATA.pets.find(p=>p.id==='wolf').name,'Filhote de lobo','desligada volta ao nome antigo'); assert.strictEqual(PET.DATA.rarW[0],0.40);
});

t('pet 17b, decisões do PO: ovo = espécie da era (sem sorteio), andar 100 e eras 5-6 à escolha, fênix vira escolha com o investido, portão guarda, repetido 10 frag., todos combate',()=>{
  const v3=PET.DATA.v3; PET.DATA.v3=true; PET.setV17(true);
  try{
    const H=e=>makeHost({eraMax:e,level:100});
    // (d) ovo de qualquer fonte = espécie da era
    for(const [e,id] of [[0,'wolf'],[1,'owl'],[2,'drake'],[3,'parrot'],[4,'golem']]) for(let i=0;i<20;i++){ const r=PET.addEgg(newS(),makeHost({eraMax:e,level:100,seed:i}),{weights:[50,30,15,4,1]}); assert.strictEqual(r.pet,id,'era '+e); }
    // (a) andar 100: escolha Dragão/Papagaio; os fragmentos 101-110 vão para o escolhido
    const S=newS(), h=H(6); const c=PET.addEgg(S,h,{r:4,source:'tower100',pet:'phoenix'}); assert.ok(c.choice); assert.deepStrictEqual(c.options,['drake','parrot']);
    PET.addFragments(S,'phoenix',3,h); const ch=PET.chooseEgg(S,h,c.index,'parrot'); assert.ok(ch.ok); assert.ok(PET.ensure(S).owned.parrot);
    assert.strictEqual(PET.ensure(S).owned.parrot.frags,3); PET.addFragments(S,'phoenix',2,h); assert.strictEqual(PET.ensure(S).owned.parrot.frags,5);
    // (b) era 5/6: escolha entre as já liberadas da maior raridade permitida
    const S5=newS(); const e5=PET.addEgg(S5,H(5),{r:3}); assert.ok(e5.pet==='golem'||e5.choice,'era 5: Cão mecânico (único Mítico liberado)');
    // fênix antiga vira escolha com o investido (estrelas em fragmentos + ração de volta)
    const So={sys:{pet:{owned:{phoenix:{stars:3,frags:4,lvl:10,food:50},wolf:{stars:1}},eq:'phoenix'}}}; const po=PET.ensure(So);
    assert.ok(!po.owned.phoenix); assert.strictEqual(po.eq,null); assert.strictEqual(po.choices[0].frags,10+20+4); assert.strictEqual(po.choices[0].food,50);
    const f0=po.food; PET.chooseEgg(So,h,0,'drake'); assert.ok(PET.ensure(So).owned.drake.stars>=3); assert.strictEqual(PET.ensure(So).food,f0+50);
    // portão: Cão mecânico (Mítico) antes do Nv 70 fica guardado e sai depois
    const L=require('../../js/sys/level.js'), Sg=newS(); L.ensure(Sg).lvl=60; const hg=makeHost({eraMax:4,level:60}); const g=PET.addEgg(Sg,hg,{});
    assert.ok(g.held&&g.gated); hg._level=70; L.ensure(Sg).lvl=70; const rel=PET.releaseGated(Sg,hg); assert.strictEqual(rel.length,1); assert.strictEqual(rel[0].pet,'golem');
    // (c) repetido = 10 fragmentos; (e) todos combate
    const Sr=newS(); PET.addEgg(Sr,H(0),{}); const rp=PET.addEgg(Sr,H(0),{}); assert.strictEqual(rp.frags,10);
    assert.ok(PET.DATA.pets.every(p=>p.type==='combat')); assert.ok(!PET.avail(PET.DATA.pets.find(p=>p.id==='phoenix'),h));
  } finally { PET.setV17(false); PET.DATA.v3=v3; }
  assert.strictEqual(PET.DATA.pets.find(p=>p.id==='owl').type,'gather','desligada: tipos de volta');
});

t('oferta de 1ª compra: janela de 24 h, uma vez só, arma Épica que acompanha até o Nv 25 (sempre ≥ ×1,15 da normal), montaria, 💎 e ouro',()=>{
  const OF=require('../../js/sys/offer.js'), M=require('../../js/sys/mount.js'), ST=require('../../js/sys/stats.js'), LV=require('../../js/sys/level.js');
  globalThis.Sys.mount=M; globalThis.Sys.stats=ST; globalThis.Sys.level=LV;
  assert.strictEqual(OF.status(newS(),makeHost()).on,false); assert.strictEqual(OF.grant(newS(),makeHost()).reason,'off');
  OF.DATA.on=true; M.DATA.on=true;
  try{
    const S=newS(), h=makeHost({eraMax:0}); LV.ensure(S).lvl=3; const st=OF.status(S,h); assert.ok(st.available); assert.strictEqual(st.msLeft,24*3600*1000);
    h.t+=23*3600*1000; const g=OF.grant(S,h); assert.ok(g.ok); assert.strictEqual(h.gems,300); assert.ok(h.gold>0); assert.strictEqual(h.items[0].r,2);
    assert.strictEqual(OF.grant(S,h).reason,'done'); assert.ok(M.ensure(S).owned.wolf); assert.ok(M.bonus(S).atkPct>0);
    const S2=newS(), h2=makeHost(); OF.status(S2,h2); h2.t+=25*3600*1000; assert.strictEqual(OF.grant(S2,h2).reason,'expired');
    // D11: só para quem nunca comprou (VIP com pontos, passe premium ou qualquer compra marcada)
    const S3=newS(), h3=makeHost(); S3.sys={vip:{level:1,active:true,points:50}}; assert.strictEqual(OF.status(S3,h3).reason,'not_first_purchase'); assert.ok(!OF.status(S3,h3).available);
    const S4=newS(), h4=makeHost(); assert.ok(OF.status(S4,h4).available); OF.markPurchase(S4,h4); assert.ok(!OF.status(S4,h4).available);
    // a arma acompanha: nível e era do jogador até o Nv 25, sempre ≥ ×1,15 da arma normal (Básico < 10, Raro 10-24) da mesma era e nível
    const w=h.items[0]; for(let L=1;L<=25;L++){ const era=L<12?0:L<25?1:2; LV.ensure(S).lvl=L; ST.offerSync(w,S,makeHost({eraMax:era}));
      assert.strictEqual(w.lvl,Math.max(L,3)); assert.strictEqual(w.e,era);
      const normal={slot:'weapon',e:era,r:L>=25?2:L>=10?1:0,lvl:L,qp:2500}; const k=ST.mainOf(w,w.lvl,0).atk/ST.mainOf(normal,L,0).atk;
      if(L<25) assert.ok(k>=1.15,'Nv '+L+': ×'+k.toFixed(2)); else assert.ok(k>=1,'no Nv 25 o Épico é a arma normal: empata (×1,10 com a qualidade ligada)'); }
    LV.ensure(S).lvl=40; ST.offerSync(w,S,makeHost({eraMax:3})); assert.strictEqual(w.lvl,25,'depois do 25 para de acompanhar'); assert.strictEqual(w.e,2);
  } finally { OF.DATA.on=false; M.DATA.on=false; delete globalThis.Sys.mount; }
});
t('montaria: % de ATK e Vida 3/4,5/6,5/9/12 no máximo, nível com ouro até nível do jogador ÷ 2, estrelas por fragmentos; desligada = zero',()=>{
  const M=require('../../js/sys/mount.js'), LV=require('../../js/sys/level.js'); globalThis.Sys.level=LV;
  const S=newS(); M.add(S,makeHost(),'griffin'); assert.strictEqual(M.bonus(S).atkPct,0,'desligada');
  M.DATA.on=true;
  try{
    assert.deepStrictEqual(['pony','horse','wolf','griffin','mythic','wyvern'].map(id=>M.pctOf(id,60,5)),[3,4.5,6.5,6.5,9,12],'lobo e grifo Épicos'); assert.strictEqual(M.add(newS(),makeHost(),'mythic').isNew,true); assert.strictEqual(M.info(newS(),makeHost(),'mythic').name,'Tigre de cristal'); near(M.pctOf('wolf',1,1),6.5*0.4*0.8,1e-3);
    const h=makeHost(); let paid=0; h.spendGold=n=>{ paid+=n; return true; }; LV.ensure(S).lvl=20;
    const u=M.upgrade(S,h,'griffin',100); assert.strictEqual(u.lvl,10,'teto = 20 ÷ 2'); assert.ok(paid>0); assert.strictEqual(M.canUpgrade(S,h,'griffin').reason,'cap');
    for(let i=0;i<4;i++) M.add(S,h,'griffin'); assert.strictEqual(M.ensure(S).owned.griffin.stars,3,'40 fragmentos = 1→2 (10) + 2→3 (20)');
    assert.ok(M.bonus(S).atkPct===M.bonus(S).hpPct); assert.strictEqual(M.battleInfo(S).visual,false,'visual desligado até a arte');
    assert.deepStrictEqual([1,2,3,4,5].map(n=>M.auraOf(n).id),['none','glow','glow','aura_smoke','aura_full']); assert.strictEqual(M.battleInfo(S).aura.id,'glow','3★ = brilho leve');
  } finally { M.DATA.on=false; }
});

t('rei da colina: duelCarry começa com a vida que sobrou; sem vida inicial = o duelo de sempre',()=>{
  const a={atk:100,hp:2000,def:0,critRate:10,critDmg:100,aspd:0}, b={atk:90,hp:2000,def:0,critRate:10,critDmg:100,aspd:0};
  assert.deepStrictEqual(W.duelCarry(a,b,5),W.duel(a,b,5),'sem vida inicial = igual');
  const d1=W.duelCarry(a,b,5); assert.ok(d1.hpLeftA>0||d1.hpLeftB>0);
  const tired=W.duelCarry(a,b,5,200); assert.ok(tired.hpLeftA<=d1.hpLeftA); assert.ok(!tired.win||tired.hpLeftA<200,'cansado começa com 200');
});

t('aparência em camadas (S.look): itens por cima da base (sem colar e luvas), ocultar peça, cosméticos, modo skin; só visual',()=>{
  const AP=require('../../js/sys/appearance.js');
  const eq={weapon:{slot:'weapon',e:2,r:3},armor:{slot:'armor',e:1,r:2},hat:{slot:'hat',e:1,r:1},boots:{slot:'boots',e:0,r:0},gloves:{slot:'gloves',e:1,r:1},necklace:{slot:'necklace',e:1,r:1}};
  const h={equipped:()=>eq}, S={skinEq:{weapon:'w00',armor:'a00'}};
  let L=AP.layers(S,h).map(l=>l.layer); assert.deepStrictEqual(L,['base','boots','armor','hat','weapon'],'colar e luvas não aparecem; skin inicial não esconde o item');
  assert.strictEqual(AP.layers(S,h).find(l=>l.layer==='weapon').key,'item/weapon/e2_r3');
  AP.setLookHidden(S,'hat',true); assert.ok(!AP.layers(S,h).some(l=>l.layer==='hat'),'chapéu oculto');
  assert.ok(AP.addCosmetic(S,'goggles').ok); assert.ok(AP.equipCosmetic(S,'glasses','goggles')); assert.ok(!AP.equipCosmetic(S,'mask','goggles'));
  assert.ok(AP.layers(S,h).some(l=>l.layer==='glasses'&&l.key==='cos/goggles'));
  AP.setMode(S,'skin'); assert.deepStrictEqual(AP.layers(S,h).map(l=>l.layer),['base','boots','armor','glasses','weapon'],'modo skin sem skin escolhida = itens');
  S.skinEq.armor='a31'; assert.deepStrictEqual(AP.layers(S,h).map(l=>l.layer),['base','skin','weapon'],'skin completa esconde as peças');
  assert.deepStrictEqual(AP.bonus(),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0},'só visual');
  assert.strictEqual(AP.look({look:'lixo'}).mode,'items');
  // asa: atrás do corpo, nos dois modos, com olho para ocultar; skin de asa vence o item
  eq.wing={slot:'wing',e:3,r:2}; assert.deepStrictEqual(AP.layers(S,h).map(l=>l.layer),['wing','base','skin','weapon'],'asa também no modo skin');
  AP.setSkin(S,'wing','wing_angel'); assert.strictEqual(AP.layers(S,h)[0].key,'skin/wing_angel'); AP.setLookHidden(S,'wing',true); assert.ok(!AP.layers(S,h).some(l=>l.layer==='wing'));
});

t('fases (Revisão 2): tabela = balance-v9 rev2, inimigo com DEF, ordem, nível, era seguinte e migração',()=>{
  const P=require('../../js/sys/phases.js'), T=require('../../js/sys/stats.js'), R=require('../../docs/balance-v9.json').rev2;
  assert.strictEqual(R.stages.length,3600);
  for(const x of R.stages){ const f=P.fcRec(x.era,x.diff,x.stage); assert.ok(Math.abs(f-x.fcRec)<=Math.max(1,x.fcRec*1e-5),'fc '+JSON.stringify(x));
    assert.strictEqual(P.lvlLock(x.era,x.diff,x.stage),x.lvlLock); assert.strictEqual(P.kindOf(x.stage),x.boss); assert.strictEqual(P.isRequired(x.era,x.diff),x.required); }
  assert.strictEqual(P.fcRec(0,0,0),0); assert.strictEqual(P.enemy(9,0,1),null); assert.strictEqual(P.info(0,4,1),null);
  // DEF na fcRec (ATK ≈ 5,5% da FC): comum 10%, chefe 20%, Senhor 25%; vida ×0,9/×0,8/×0,75
  for(const [n,k,red] of [[30,'common',0.10],[50,'boss',0.20],[100,'boss',0.25]]){ const e=P.enemy(5,2,n,k); near(T.defReduction(e.def,0.055*e.fcRec),red,0.01); }
  assert.strictEqual(P.enemy(3,0,50,'boss').kind,'chefe'); assert.strictEqual(P.enemy(3,0,100,'boss').kind,'senhor'); assert.strictEqual(P.enemy(3,0,100,'common').kind,'common');
  assert.ok(P.enemy(3,1,10,'common').hp===Math.round(P.fcRec(3,1,10)*0.04*0.9));
  // como hoje: o comum cai em ~1 golpe na fcRec; o Senhor aguenta uma ultimate inteira (10× ATK) de quem está na fcRec
  { const e=P.enemy(6,3,100,'boss'), atk=0.055*e.fcRec; assert.ok(T.hit({atk,critRate:0,critDmg:0},10,e.def,false).dmg<e.hp); }
  const S=newS(), h=makeHost({eraMax:0}), L=require('../../js/sys/level.js');
  assert.deepStrictEqual(P.canChallenge(S,h,0,0,1),{ok:false,reason:'off'});
  P.DATA.on=true; try{
    assert.strictEqual(P.canChallenge(S,h,0,0,1).ok,true); assert.strictEqual(P.canChallenge(S,h,0,0,2).reason,'order'); assert.strictEqual(P.canChallenge(S,h,1,0,1).reason,'era');
    assert.strictEqual(P.canChallenge(S,h,0,1,1).reason,'order','Médio só depois do Fácil 100');
    L.ensure(S).lvl=1; let lastLv=0; for(let n=1;n<=100;n++){ const c=P.canChallenge(S,h,0,0,n); if(!c.ok){ assert.strictEqual(c.reason,'level'); L.ensure(S).lvl=c.needLevel; }
      assert.ok(P.lvlLock(0,0,n)>=lastLv); lastLv=P.lvlLock(0,0,n); const w=P.win(S,h,0,0,n); assert.ok(w.ok&&w.first,'fase '+n); if(n===100) assert.strictEqual(w.eraUnlocked,1); }
    assert.strictEqual(P.win(S,h,0,0,5).first,false,'repetir não é 1ª vitória'); assert.ok(P.eraOpen(S,1)&&!P.eraOpen(S,2)); assert.strictEqual(P.eraMax(S),1);
    assert.deepStrictEqual(P.ensure(S).cur,{e:1,d:0,n:1}); assert.strictEqual(P.canChallenge(S,h,0,1,1).ok,true,'Médio da era 0 é opcional mas abre');
    assert.strictEqual(P.lvlLock(0,1,1),12,'opcional: nível de saída');
    // era 2 exige Fácil + Médio
    assert.deepStrictEqual(P.next(S,h,2,0,100),{e:2,d:1,n:1}); assert.deepStrictEqual(P.next(S,h,2,1,100),{e:3,d:0,n:1}); assert.deepStrictEqual(P.next(S,h,8,2,100),{e:8,d:3,n:1}); assert.strictEqual(P.next(S,h,8,3,100),null);
    // migração do save de hoje: fase antiga 27 = era 2, 7ª fase → eras 0-1 vencidas, Fácil da era 2 em 60
    const S2=newS(); const m=P.migrate(S2,h,27); assert.deepStrictEqual([m.era,m.best],[2,60]); assert.ok(P.eraCleared(S2,1)&&P.eraOpen(S2,2)&&!P.eraCleared(S2,2));
    assert.deepStrictEqual(P.ensure(S2).cur,{e:2,d:0,n:61}); assert.strictEqual(P.migrate(S2,h,27).reason,'done');
    const S3={sys:{phases:{best:{0:[999,-3,'x'],7:'lixo'},cur:{e:99}}}}; P.ensure(S3); assert.deepStrictEqual(S3.sys.phases.best,{0:[100,0,0,0]}); assert.deepStrictEqual(S3.sys.phases.cur,{e:0,d:0,n:1});
    assert.deepStrictEqual(P.rewardOf(3),{gold:4,mats:4,topRarChance:2.2,qualityBestOf:3,firstWinGems:3,firstWinPetFrag:1});
  } finally { P.DATA.on=false; }
});

t('ensure NÃO troca a ficha do pet/montaria: feedTap e quem segurou x gravam no save (defeito avisado pela tela de pets)',()=>{
  const P=require('../../js/sys/pet.js'), M=require('../../js/sys/mount.js'); const v3=P.DATA.v3; P.DATA.v3=true; P.setV17(true);
  try{ const S=newS(), h=makeHost({level:100,eraMax:0}); P.addEgg(S,h,{r:0}); const id=Object.keys(P.ensure(S).owned)[0]; P.ensure(S).food=1e6;
    const x=P.ensure(S).owned[id]; P.ensure(S); assert.strictEqual(P.ensure(S).owned[id],x,'mesma ficha depois do ensure');
    const l0=x.lvl, r=P.feedTap(S,h,id,1); assert.ok(r.ok); assert.strictEqual(P.ensure(S).owned[id].fx,1,'barra parcial gravada');
    for(let i=0;i<50;i++) P.feedTap(S,h,id,25); assert.ok(P.ensure(S).owned[id].lvl>l0,'nível gravado');
    const Sm=newS(); M.add(Sm,h,'pony'); const y=M.ensure(Sm).owned.pony; M.ensure(Sm); assert.strictEqual(M.ensure(Sm).owned.pony,y);
  } finally { P.setV17(false); P.DATA.v3=v3; }
});

t('pet 17b na batalha: folhas pelo estágio (filhote/_mid/_evo), atk2/atk3 só no filhote antigo, e todas existem no disco',()=>{
  const P=require('../../js/sys/pet.js'), fs=require('fs'), path=require('path'); const v3=P.DATA.v3; P.DATA.v3=true; P.setV17(true);
  try{ const S=newS(), h=makeHost({level:120,eraMax:8}); require('../../js/sys/level.js').ensure(S).lvl=100; P.ensure(S).owned.underworld={stars:1,frags:0,lvl:1};
    const o=P.ensure(S); o.eq='underworld'; assert.ok(o.owned.underworld,'pet no save'); let b=P.battleInfo(S,h); assert.strictEqual(b.draw.base,'era7_cerberus'); assert.deepStrictEqual(b.draw.extra,[]);
    o.owned.underworld.stg=2; b=P.battleInfo(S,h); assert.strictEqual(b.draw.base,'era7_cerberus_evo'); assert.ok(b.draw.sheets.includes('era7_cerberus_evo_atk1'));
    const dir=path.join(__dirname,'../../assets/anim/pets'); if(fs.existsSync(dir)) for(const sp of ['era0_mammoth','era7_cerberus','era8_pegasus','prism_fox'])
      for(const sh of [sp+'_idle',sp+'_mid_run',sp+'_evo_atk1']) assert.ok(fs.existsSync(path.join(dir,sh+'.png')),'falta '+sh);
  } finally { P.setV17(false); P.DATA.v3=v3; }
});

t('guilda (Sys.guild): desligada não muda nada; sem servidor fica fechada; tetos, vagas, nível, territórios, troca com travas, prêmios',()=>{
  const G=require('../../js/sys/guild.js'), L=require('../../js/sys/level.js'), F=require('../../js/sys/fc.js');
  const S=newS(), h=makeHost({eraMax:3}); h.t=Date.UTC(2026,10,12,12);
  assert.deepStrictEqual(G.status(S,h),{on:false,open:false,reason:'off'}); assert.deepStrictEqual(G.bonus(S),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
  // regras puras
  assert.strictEqual(G.memberCap(1),20); assert.strictEqual(G.memberCap(6),30); assert.strictEqual(G.memberCap(10),30);
  assert.strictEqual(G.xpToNext(1),1000); assert.strictEqual(G.xpToNext(2),1600); assert.strictEqual(G.xpToNext(10),0); assert.deepStrictEqual(G.levelOfXp(2600),{level:3,into:0,need:2560});
  assert.strictEqual(G.bannerCap('atk',10),5); assert.strictEqual(G.bannerCap('def',10),3); assert.strictEqual(G.bannerCap('atk',5),2.5); assert.strictEqual(G.bannerCap('crit',10),0);
  assert.deepStrictEqual(G.territoryBonus([{region:1},{region:2}]),{gold:4,xp:2,drop:2}); assert.deepStrictEqual(G.territoryBonus(Array(9).fill({region:0}).concat([{region:4,capital:true}])),{gold:10,xp:5,drop:5});
  assert.ok(G.canAttackRegion([3,4,5],4)&&!G.canAttackRegion([2,2,8],4)&&!G.canAttackRegion([],0));
  assert.deepStrictEqual(G.tourneyReward(1),{coin:300,prism:3,frame:true}); assert.strictEqual(G.tourneyReward(7).prism,1); assert.strictEqual(G.tourneyReward(60).coin,0);
  assert.strictEqual(G.createCost(h),8000*4);
  G.DATA.on=true; try{
    L.ensure(S).lvl=10; assert.strictEqual(G.status(S,h).reason,'level'); assert.strictEqual(G.status(S,h).needLevel,L.unlockLevel('guild'));
    L.ensure(S).lvl=40; assert.deepStrictEqual([G.status(S,h).open,G.status(S,h).reason],[false,'server'],'sem servidor = fechada');
    assert.strictEqual(G.canCreate(S,h).reason,'server');
    G.setProvider({online:true,status:()=>({open:true})}); assert.strictEqual(G.status(S,h).open,true); assert.ok(G.canCreate(S,h).ok);
    // servidor manda a guilda: tetos valem também aqui (estandarte acima do teto do nível é cortado)
    G.applyServer(S,{id:'g1',name:'Lobos',role:'officer',xp:3000,banners:{atk:9,hp:1,def:2.9,gold:4,food:20},territories:[{region:2},{region:3,capital:true}],coin:50,joinedAt:h.t-10*864e5});
    const o=G.ensure(S); assert.strictEqual(o.level,3); assert.strictEqual(o.banners.atk,1.5); assert.strictEqual(o.banners.def,0.9); assert.strictEqual(o.banners.food,3);
    const b0=F.total?null:null; assert.deepStrictEqual(G.bonus(S),{atkPct:1.5,hpPct:1,goldPct:0,critPct:0,defPct:0.9,fc:0});
    assert.deepStrictEqual(G.perks(S),{goldPct:3+8,xpPct:4,dropPct:4,foodPct:3});
    assert.strictEqual(G.canCreate(S,h).reason,'in_guild');
    // troca: 18+, 7 dias de membro, item comprado não troca, item novo (<24 h) não troca, limites
    const it={slot:'boots',e:3,r:2,lvl:40,gold:1000,qp:5000,subs:[{k:'hpPct',q:0.5}],gotAt:h.t-48*36e5};
    assert.strictEqual(G.canDonate(S,h,it,'u2',{age:15}).reason,'adult'); assert.strictEqual(G.canDonate(S,h,it,'u2',{}).reason,'adult');
    assert.deepStrictEqual(G.canDonate(S,h,it,'u2',{age:20}),{ok:true,goldBack:500});
    assert.strictEqual(G.canDonate(S,h,Object.assign({},it,{offer:true}),'u2',{age:20}).reason,'bought');
    assert.strictEqual(G.canDonate(S,h,Object.assign({},it,{origin:'shop_gem'}),'u2',{age:20}).reason,'bought');
    assert.strictEqual(G.canDonate(S,h,Object.assign({},it,{gotAt:h.t-36e5}),'u2',{age:20}).reason,'item_age');
    G.markDonated(S,h,'u2'); assert.strictEqual(G.canDonate(S,h,it,'u2',{age:20}).reason,'pair_limit'); G.markDonated(S,h,'u3'); G.markDonated(S,h,'u4');
    assert.strictEqual(G.canDonate(S,h,it,'u5',{age:20}).reason,'day_limit'); h.t+=864e5; assert.ok(G.canDonate(S,h,it,'u5',{age:20}).ok,'novo dia zera');
    const rc=G.received(it); assert.deepStrictEqual([rc.lvl,rc.gold,rc.qp,rc.e,rc.r,rc.origin],[1,0,5000,3,2,'guild']); assert.strictEqual(it.lvl,40,'original intacto');
    const S2=newS(); L.ensure(S2).lvl=40; G.applyServer(S2,{id:'g2',role:'member',level:1,joinedAt:h.t-864e5}); assert.strictEqual(G.canDonate(S2,h,it,'x',{age:30}).reason,'member_days');
    // sair: some o bônus; 24 h para outra guilda, 7 dias para a mesma
    G.applyServer(S,null,h); assert.strictEqual(G.inGuild(S),false); assert.deepStrictEqual(G.bonus(S).atkPct,0); assert.strictEqual(G.perks(S).goldPct,0);
    assert.strictEqual(G.canJoin(S,h,'g9').reason,'cooldown'); h.t+=25*36e5; assert.ok(G.canJoin(S,h,'g9').ok); assert.strictEqual(G.canJoin(S,h,'g1').reason,'cooldown');
    h.t+=7*864e5; assert.ok(G.canJoin(S,h,'g1').ok);
    // save sujo
    const S3={sys:{guild:{id:5,banners:{atk:'x'},territories:[null,{region:99}],role:'rei'}}}; G.ensure(S3); assert.strictEqual(S3.sys.guild.id,null); assert.strictEqual(S3.sys.guild.role,'member');
  } finally { G.DATA.on=false; G.setProvider(null); }
});

t('aparência: herói Kael/Kaia (S.hero) escolhe o corpo e a pasta das folhas pela fase; as 8 pastas existem',()=>{
  const A=require('../../js/sys/appearance.js'), L=require('../../js/sys/level.js'), fs=require('fs'), path=require('path'); const v9=L.DATA.v9.on;
  try{ assert.strictEqual(A.heroOf({}),'kael'); assert.strictEqual(A.heroOf({hero:'kaia'}),'kaia'); assert.strictEqual(A.heroOf({hero:'x'}),'kael');
    assert.strictEqual(A.layers({hero:'kaia'},makeHost()).find(l=>l.layer==='base').key,'base/kaia');
    assert.deepStrictEqual(A.sheets({},makeHost()),{hero:'kael',stage:0,dir:'assets/anim/hyb/R/',prefix:'kael_',masks:'assets/anim/hyb/R/masks/'});
    L.setV9(true); const S={hero:'kaia'}; L.ensure(S).lvl=80; L.ensure(S).stg=3; assert.strictEqual(A.sheets(S,makeHost()).dir,'assets/anim/hyb/kaia_phase3/');
    const root=path.join(__dirname,'../..'); if(fs.existsSync(path.join(root,'assets/anim/hyb'))) for(const h of ['kael','kaia']) for(let st=0;st<4;st++){ const T={hero:h}; L.ensure(T).lvl=120; L.ensure(T).stg=st;
      const d=A.sheets(T,makeHost()); assert.strictEqual(d.stage,st); assert.ok(fs.existsSync(path.join(root,d.dir,d.prefix+'idle_body.json')),'falta '+d.dir+d.prefix+'idle_body.json'); }
  } finally { L.setV9(v9); }
});

t('torre com a 17b: andar 100 = ovo Épico À ESCOLHA (Dragão/Papagaio), sem fênix; fragmentos acima do 100 vão para o pet escolhido',()=>{
  const W=require('../../js/sys/tower.js'), P=require('../../js/sys/pet.js'); const v3=P.DATA.v3; P.DATA.v3=true; P.setV17(true);
  try{ const S=newS(), h=makeHost({level:100,eraMax:6});
    const r100=W.rewardsFor(100,h,S); assert.deepStrictEqual(r100.egg,{r:2,source:'tower100',choice:['drake','parrot']}); assert.strictEqual(r100.phoenixFrags,0);
    let r101=W.rewardsFor(101,h,S); assert.strictEqual(r101.t100Frags,1); assert.strictEqual(r101.t100Pet,''); assert.strictEqual(r101.phoenixFrags,0);
    const e=P.addEgg(S,h,r100.egg); assert.ok(e.choice,'vira escolha'); const i=P.ensure(S).choices.findIndex(c=>c.source==='tower100');
    assert.ok(P.chooseEgg(S,h,i,'parrot').ok); assert.strictEqual(W.rewardsFor(101,h,S).t100Pet,'parrot');
    const f0=P.ensure(S).owned.parrot.frags; if(W.grantRewards){ W.grantRewards(S,h,W.rewardsFor(101,h,S)); assert.strictEqual(P.ensure(S).owned.parrot.frags+P.ensure(S).owned.parrot.stars*0,f0+1,'fragmento no papagaio'); }
  } finally { P.setV17(false); P.DATA.v3=v3; }
  assert.deepStrictEqual(W.rewardsFor(100,makeHost()).egg,{r:4,source:'tower100',pet:'phoenix'},'sem a 17b: formato antigo');
});

console.log(`ok: ${n} testes`);
