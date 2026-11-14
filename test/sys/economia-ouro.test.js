// node test/sys/economia-ouro.test.js — decisões do dono de 14/11 (docs/ECONOMIA_OURO.md §6 e docs/RECOMPENSAS_VIP_PASSE.md D1-D3):
// ouro das fontes antigas no teto de X = 5 min de abate (120 × goldUnit) por resgate; VIP: ouro +5% a +10% (XP igual), offline ×2 sem ouro,
// poder pago do VIP ≤ +10% de ATK e Vida (Fênix gigante e Mecha com poder de Épica e visual Lendário). Processo próprio.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; console.log('ok -',name); }catch(e){ console.error('FALHOU:',name); throw e; } };
const X=120;   // teto por resgate, em abates

t('Hora de Ouro: +30% (era +100%)',()=>{ const SC=require('../../js/sys/schedule.js'); assert.strictEqual(SC.DATA.events.find(e=>e.id==='golden_hour').perks.goldPct,30); });

t('Mina de Ouro: 1 abate de ouro por abate e teto de 120 por corrida, em qualquer dificuldade (antes do % do VIP)',()=>{
  const I=require('../../js/sys/instances.js'), h=makeHost({unit:10});
  assert.strictEqual(I.DATA.types.gold.reward.goldPerKill,1); assert.strictEqual(I.DATA.types.gold.reward.capKills,X);
  for(let L=0;L<9;L++){ const u=h.goldUnit(I.levelInfo(L).stage);
    assert.ok(I.rewardPreview('gold',L,h,40).gold<=Math.round(u*X)+1,'teto no nível '+L);
    assert.strictEqual(I.rewardPreview('gold',L,h,500).gold,Math.round(u*X),'muitos abates batem no teto'); }
  assert.strictEqual(I.rewardPreview('gold',0,h,10).gold,Math.round(h.goldUnit(I.levelInfo(0).stage)*10),'Fácil, 10 abates = 10 abates de ouro');
});

t('Torre: 20 × (1 + 0,015 × andar), teto de 60 abates por andar',()=>{
  const T=require('../../js/sys/tower.js'), h=makeHost({unit:10});
  assert.strictEqual(T.rewardsFor(1,h).gold,Math.round(10*20*1.015));
  assert.strictEqual(T.rewardsFor(100,h).gold,Math.round(10*20*2.5));
  for(const f of [135,200,1000]) assert.strictEqual(T.rewardsFor(f,h).gold,600,'andar '+f);
});

t('Arena: liga semanal Bronze, Prata e Ouro = 120 abates; nenhuma liga passa de X',()=>{
  const A=require('../../js/sys/arena.js');
  assert.deepStrictEqual(A.DATA.leagues.slice(0,3).map(l=>l.prize.goldk),[120,120,120]);
  for(const l of A.DATA.leagues) assert.ok(!(l.prize.goldk>X),l.id);
});

t('Oferta paga: sem ouro',()=>{ const O=require('../../js/sys/offer.js'); assert.strictEqual(O.DATA.goldk,0); });

t('Correio: goldk com teto de 120 por carta (o resto do anexo não muda)',()=>{
  require('../../js/sys/loot.js'); const M=require('../../js/sys/mail.js'), on=M.DATA.enabled; M.DATA.enabled=true;
  try{ const S={}, h=makeHost({unit:10}); const a=M.send(S,h,{title:'Muito',att:{goldk:5000,gems:3}}), b=M.send(S,h,{title:'Pouco',att:{goldk:30}});
    let r=M.claim(S,h,a); assert.ok(r.ok); assert.strictEqual(h.gold,1200); assert.strictEqual(h.gems,3);
    r=M.claim(S,h,b); assert.ok(r.ok); assert.strictEqual(h.gold,1500); }
  finally{ M.DATA.enabled=on; }
});

t('Desligadas antigas (atividade, conquistas, coleção, trilha do evento): nenhum resgate passa de X',()=>{
  const AC=require('../../js/sys/activity.js'), AH=require('../../js/sys/achievements.js'), CX=require('../../js/sys/codex.js'), ET=require('../../js/sys/evtrail.js');
  assert.deepStrictEqual(AC.DATA.milestones.map(c=>c.reward.goldk),[24,24,24,24,48]);
  assert.deepStrictEqual(AH.DATA.tierReward.map(r=>r.goldk),[24,48,96,120]);
  assert.deepStrictEqual(CX.DATA.marks.map(m=>m.prize.goldk),[24,48,72,96,120]);
  assert.deepStrictEqual(ET.DATA.events.default.trail.filter(x=>x.reward.goldk).map(x=>x.reward.goldk),[48,72,96,120]);
});

const V=require('../../js/sys/vip.js'), MT=require('../../js/sys/mount.js');
t('VIP: ouro +5/5/6/6/8/8/9/9/10/10%; XP como antes; levelInfo traz ouro e XP separados',()=>{
  const S={}, gold=[], xp=[]; for(let l=0;l<=10;l++){ V.setLevel(S,l); const p=V.perks(S); gold.push(p.goldPct); xp.push(p.xpPct); }
  assert.deepStrictEqual(gold,[0,5,5,6,6,8,8,9,9,10,10]); assert.deepStrictEqual(xp,[0,10,12,14,16,18,20,21,22,24,25]);
  const i=V.levelInfo(10); assert.strictEqual(i.goldPct,10); assert.strictEqual(i.xpPct,25); assert.strictEqual(i.goldXpPct,10);
});
t('VIP: offline ×2 no VIP 5+ só para XP, itens, pedras e ração; o ouro offline fica ×1 (offlineGoldMult)',()=>{
  const S={}; for(let l=0;l<=10;l++){ V.setLevel(S,l); const p=V.perks(S); assert.strictEqual(p.offlineGoldMult,1); assert.strictEqual(p.offlineMult,l>=5?2:1); }
});
t('Moldura Ouro não é mais do VIP (frame da tabela zerado; VIP N tem a moldura VIP N)',()=>{ for(let l=0;l<=10;l++){ assert.strictEqual(V.levelInfo(l).frame,false); assert.strictEqual(V.levelInfo(l).frameVip,l); } });

t('Fênix gigante e Mecha: visual Lendário, poder de Épica (igual ao Lobo) em todo nível e estrela, com e sem estrela plana e 7★',()=>{
  const st7=MT.stars7On(), sf=MT.DATA.starFlat.on;
  try{ for(const [flat,s7] of [[false,false],[true,false],[true,true]]){ MT.setStarFlat(flat); MT.setStars7(s7);
      for(const id of ['phoenixm','mecha']) for(const lv of [1,30,60]) for(let s=1;s<=MT.DATA.maxStars;s++) assert.strictEqual(MT.pctOf(id,lv,s),MT.pctOf('wolf',lv,s),id+' '+lv+' '+s+'★'); }
  } finally{ MT.setStarFlat(sf); MT.setStars7(st7); }
  const S={}, h=makeHost({level:60}); MT.ensure(S).owned.phoenixm={stars:5,frags:0,lvl:30,gold:0};
  const i=MT.info(S,h,'phoenixm'); assert.deepStrictEqual([i.rarity,i.rarityName,i.powerRarity,i.powerRarityName,i.maxPct],[4,'Lendário',2,'Épico',6.5]);
  MT.ensure(S).owned.wolf={stars:5,frags:0,lvl:30,gold:0}; assert.strictEqual(MT.upgradeCost(S,h,'phoenixm').gold,MT.upgradeCost(S,h,'wolf').gold,'custo de Épica');
  const c=MT.catalog().find(m=>m.id==='mecha'); assert.deepStrictEqual([c.r,c.pr,c.maxPct],[4,2,6.5]);
});

t('Teto do VIP: tabela + montaria exclusiva ≤ +10% de ATK e Vida acima do grátis (que tem Épica) em todo nível de VIP',()=>{
  const sf=MT.DATA.starFlat.on, st7=MT.stars7On();
  try{ for(const [flat,s7] of [[false,false],[true,true]]){ MT.setStarFlat(flat); MT.setStars7(s7);
      const extra=Math.max(...[1,30,60].flatMap(lv=>Array.from({length:MT.DATA.maxStars},(_,k)=>MT.pctOf('phoenixm',lv,k+1)-MT.pctOf('wolf',lv,k+1))));
      for(let l=0;l<=10;l++){ const S={}; V.setLevel(S,l); const b=V.bonus(S), tot=b.atkPct+(l>=8?extra:0);
        assert.ok(tot<=10,'VIP '+l+': +'+tot+'%'); assert.strictEqual(b.atkPct,b.hpPct); } }
  } finally{ MT.setStarFlat(sf); MT.setStars7(st7); }
});

console.log(n+' testes ok');
