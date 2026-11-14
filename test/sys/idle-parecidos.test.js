// node test/sys/idle-parecidos.test.js — docs/IDLE_PARECIDOS.md §3 itens 1-3 (P1, dono aprovou 13/11):
// 1) Forja presa ao espaço (já é assim: prova e frase do cartão); 2) trocar pet/montaria principal sem perder (chaves swapKeep);
// 3) cada montaria reforça 1 golpe especial (chave Sys.mount.DATA.strike + Sys.strikes). Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['stats','forge','fc','loot','strikes','grimoire','pet','mount'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const F=Sys.forge, P=Sys.pet, M=Sys.mount, K=Sys.strikes, FC=Sys.fc;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const heroHost=eq=>Object.assign(makeHost({eraMax:2,level:40}),{equipped:()=>eq});
const gear=()=>({weapon:{id:'wA',slot:'weapon',e:2,r:2,lvl:10,gold:0,subs:[{k:'atkPct',q:0.5}],stk:[]},armor:{id:'aA',slot:'armor',e:2,r:2,lvl:10,gold:0,subs:[{k:'hpPct',q:0.5}],stk:[]}});

/* ---------------- 1. Forja presa ao espaço ---------------- */
t('Forja: o +N mora no espaço; trocar de peça mantém o +N (a peça nova recebe o mesmo multiplicador) e nenhuma peça guarda +N',()=>{
  const S={}, eq=gear(), h=heroHost(eq), o=F.ensure(S); o.lv.weapon=5;
  const nova={id:'wB',slot:'weapon',e:2,r:3,lvl:12,gold:0,subs:[{k:'atkPct',q:0.3}]};
  const fcA=FC.compute(S,h); eq.weapon=nova; const fcB5=FC.compute(S,h);
  assert.strictEqual(F.level(S,'weapon'),5); assert.strictEqual(F.mult(S,'weapon'),F.DATA.bonus[5]);
  o.lv.weapon=0; const fcB0=FC.compute(S,h); o.lv.weapon=5;
  assert.ok(fcB5>fcB0,'a peça nova recebe o +5 do espaço'); assert.ok(fcA>0);
  assert.ok(!JSON.stringify(eq).includes('forge'),'peça sem campo de forja'); assert.deepStrictEqual(Object.keys(S.sys.forge.lv),F.DATA.slots);
  const note=F.slotNote(S,'weapon'); assert.strictEqual(note.lv,5); assert.strictEqual(note.keeps,true); assert.ok(/\+5/.test(note.text));
  assert.strictEqual(F.slotNote(S,'xx'),null); assert.ok(F.slotNote({},'armor').text.length>10);
});

/* ---------------- 2. Trocar sem perder ---------------- */
const petS=()=>{ const S={}; const o=P.ensure(S); o.owned.wolf={stars:3,frags:4,lvl:40,food:900,stg:1,fx:7}; o.owned.drake={stars:1,frags:0,lvl:5,food:40}; o.eq='wolf'; o.food=123; P.ensure(S); return S; };
const petSum=S=>{ const o=S.sys.pet; let l=0,f=0,g=0,x=0,st=0,fr=0; for(const id in o.owned){ const p=o.owned[id]; l+=p.lvl|0; f+=p.food|0; g+=p.stg|0; x+=p.fx|0; st+=p.stars; fr+=p.frags; } return {l,f,g,x,st,fr,stock:o.food}; };
const withPet3=fn=>{ const v3=P.DATA.v3, v17=P.DATA.v17.on; P.DATA.v3=true; P.setV17(true); try{ fn(); } finally{ P.setV17(v17); P.DATA.v3=v3; P.DATA.swapKeep.on=false; } };

t('pet DESLIGADO: equip igual a antes (nada passa), swapMain/swapPreview = off',()=>withPet3(()=>{
  assert.strictEqual(P.DATA.swapKeep.on,false); const S=petS(), before=JSON.stringify(S);
  assert.deepStrictEqual(P.swapMain(S,null,'drake'),{ok:false,reason:'off'}); assert.strictEqual(P.swapPreview(S,'drake'),null); assert.strictEqual(JSON.stringify(S),before);
  assert.strictEqual(P.equip(S,'drake'),true); const exp=JSON.parse(before); exp.sys.pet.eq='drake'; assert.deepStrictEqual(S,exp);
}));

t('pet LIGADO: o novo principal fica com nível, ração gasta, estágio e barra; o antigo com o que o novo tinha; somas iguais; estrelas ficam',()=>withPet3(()=>{
  P.DATA.swapKeep.on=true; const S=petS(), s0=petSum(S);
  assert.deepStrictEqual(P.swapPreview(S,'drake'),{moved:true,lvlNew:40,lvlOld:5});
  const r=P.swapMain(S,null,'drake'); assert.strictEqual(r.ok,true); assert.strictEqual(r.moved,true); assert.strictEqual(r.lvl,40);
  const w=S.sys.pet.owned.wolf, d=S.sys.pet.owned.drake;
  assert.deepStrictEqual([d.lvl,d.food,d.stg,d.fx,d.stars],[40,900,1,7,1]); assert.deepStrictEqual([w.lvl,w.food,w.stg,w.fx,w.stars,w.frags],[5,40,undefined,undefined,3,4]);
  assert.deepStrictEqual(petSum(S),s0); assert.strictEqual(S.sys.pet.eq,'drake'); P.ensure(S); assert.deepStrictEqual(petSum(S),s0,'ensure mantém');
  P.swapMain(S,null,'wolf'); assert.strictEqual(S.sys.pet.owned.wolf.lvl,40); assert.strictEqual(S.sys.pet.owned.drake.lvl,5); assert.deepStrictEqual(petSum(S),s0,'voltar desfaz');
}));

t('pet LIGADO: ir e voltar 60 vezes (equip e swapMain) não cria nem some nada; o Redefinir nível devolve só 80% do que está no pet',()=>withPet3(()=>{
  P.DATA.swapKeep.on=true; const S=petS(); P.ensure(S).owned.golem={stars:2,frags:1,lvl:20,food:300}; P.ensure(S); const s0=petSum(S), ids=['wolf','drake','golem'];
  for(let i=0;i<60;i++){ const id=ids[(i*7+3)%3]; if(i%2) P.equip(S,id); else P.swapMain(S,null,id); assert.deepStrictEqual(petSum(S),s0); }
  const lv=Object.values(S.sys.pet.owned).map(p=>p.lvl).sort((a,b)=>a-b); assert.deepStrictEqual(lv,[5,20,40]);
  assert.strictEqual(S.sys.pet.owned[S.sys.pet.eq].lvl,40,'o principal está sempre com o maior');
  const eq=S.sys.pet.eq, fo=S.sys.pet.owned[eq].food, st=S.sys.pet.food, rr=P.release(S,null,eq); assert.strictEqual(rr.refund,Math.floor(fo*0.8)); assert.strictEqual(S.sys.pet.food,st+rr.refund);
}));

t('pet LIGADO: novo já mais forte não troca nada; sem principal não troca; v2 (nível do espaço) não mexe',()=>{
  withPet3(()=>{ P.DATA.swapKeep.on=true; const S=petS(); S.sys.pet.owned.drake.lvl=60; const b=JSON.stringify(S.sys.pet.owned);
    const r=P.swapMain(S,null,'drake'); assert.strictEqual(r.moved,false); assert.strictEqual(JSON.stringify(S.sys.pet.owned),b);
    const S2=petS(); P.equip(S2,null); const b2=JSON.stringify(S2.sys.pet.owned); P.equip(S2,'drake'); assert.strictEqual(JSON.stringify(S2.sys.pet.owned),b2); });
  P.DATA.swapKeep.on=true; try{ const S={}; const o=P.ensure(S); o.owned.wolf={stars:1,frags:0}; o.owned.drake={stars:1,frags:0}; o.eq='wolf'; o.lvl=30; P.ensure(S);
    const b=JSON.stringify(S.sys.pet.owned); const r=P.swapMain(S,null,'drake'); assert.strictEqual(r.moved,false); assert.strictEqual(r.lvl,30); assert.strictEqual(JSON.stringify(S.sys.pet.owned),b);
  } finally{ P.DATA.swapKeep.on=false; }
});

const mS=()=>{ const S={}; const o=M.ensure(S); o.owned.horse={stars:4,frags:3,lvl:30,gold:5000}; o.owned.wolf={stars:1,frags:0,lvl:3,gold:80}; o.owned.pony={stars:2,frags:0,lvl:10,gold:900}; o.eq='horse'; M.ensure(S); return S; };
const mSum=S=>{ let l=0,g=0,st=0,fr=0; for(const id in S.sys.mount.owned){ const x=S.sys.mount.owned[id]; l+=x.lvl; g+=x.gold; st+=x.stars; fr+=x.frags; } return {l,g,st,fr}; };

t('montaria DESLIGADO: equip igual a antes; swapMain = off',()=>{
  assert.strictEqual(M.DATA.swapKeep.on,false); const S=mS(), b=JSON.stringify(S); assert.deepStrictEqual(M.swapMain(S,null,'wolf'),{ok:false,reason:'off'});
  assert.strictEqual(M.swapPreview(S,'wolf'),null); assert.strictEqual(JSON.stringify(S),b); M.equip(S,'wolf'); const e=JSON.parse(b); e.sys.mount.eq='wolf'; assert.deepStrictEqual(S,e);
});

t('montaria LIGADO: a nova fica com nível e ouro da antiga; estrelas ficam; ir e voltar 60x sem criar nem perder; a % de ATK do principal não cai',()=>{
  M.DATA.swapKeep.on=true; try{ const S=mS(), s0=mSum(S), pct0=M.pctOf('wolf',30,1);
    assert.deepStrictEqual(M.swapPreview(S,'wolf'),{moved:true,lvlNew:30,lvlOld:3});
    const r=M.swapMain(S,null,'wolf'); assert.deepStrictEqual([r.ok,r.moved,r.lvl,r.gold],[true,true,30,5000]);
    assert.deepStrictEqual(S.sys.mount.owned.horse,{stars:4,frags:3,lvl:3,gold:80}); assert.strictEqual(S.sys.mount.owned.wolf.stars,1); assert.deepStrictEqual(mSum(S),s0);
    assert.strictEqual(M.pctOf('wolf',S.sys.mount.owned.wolf.lvl,1),pct0);
    const ids=['horse','wolf','pony']; for(let i=0;i<60;i++){ const id=ids[(i*5+1)%3]; if(i%2) M.equip(S,id); else M.swapMain(S,null,id); assert.deepStrictEqual(mSum(S),s0); assert.strictEqual(S.sys.mount.owned[S.sys.mount.eq].lvl,30); }
    assert.deepStrictEqual(Object.values(S.sys.mount.owned).map(x=>x.lvl).sort((a,b)=>a-b),[3,10,30]);
    assert.deepStrictEqual(M.swapMain(S,null,'wyvern'),{ok:false,reason:'id'});
  } finally{ M.DATA.swapKeep.on=false; }
});

/* ---------------- 3. Montaria reforça 1 golpe ---------------- */
const withMount=fn=>{ const on=M.DATA.on; M.DATA.on=true; try{ fn(); } finally{ M.DATA.on=on; M.DATA.strike.on=false; K.setOn(false); } };
const ownedS=(id,stars)=>{ const S={}; const o=M.ensure(S); o.owned[id]={stars,frags:0,lvl:1,gold:0}; o.eq=id; M.ensure(S); return S; };

t('tabela: as 16 montarias têm 1 golpe válido; cada golpe tem 3+ montarias; valor = por estrela × estrelas × raridade',()=>{
  for(const m of M.DATA.mounts){ assert.ok(K.DATA.keys.includes(M.DATA.strike.map[m.id]),m.id); }
  for(const id in M.DATA.strike.map) assert.ok(M.DATA.mounts.some(m=>m.id===id),id);
  for(const k of K.DATA.keys) assert.ok(Object.values(M.DATA.strike.map).filter(x=>x===k).length>=3,k);
  M.DATA.strike.on=true; try{ assert.deepStrictEqual(M.strikeInfo('wolf',3),{k:'combo',value:3.6,next:4.8}); assert.strictEqual(M.strikeInfo('wyvern',5).value,3.75);
    assert.strictEqual(M.strikeInfo('mecha',5).value,6,'Mecha: visual Lendário, poder de Épica (dono 14/11)'); assert.strictEqual(M.strikeInfo('wyvern',5).next,null); } finally{ M.DATA.strike.on=false; }
  assert.strictEqual(M.strikeInfo('wolf',3),null);
});

t('DESLIGADO (qualquer das duas chaves): perfil, FC e save iguais a antes; a montaria só ligada não muda nada',()=>withMount(()=>{
  const eq=gear(), h=heroHost(eq), S=ownedS("wolf",5), b=JSON.stringify(S.sys.mount);
  const p0=K.profile(S,h), f0=FC.compute(S,h); assert.ok(!('mount' in p0)); assert.deepStrictEqual(p0.normal,{combo:0,counter:0,stun:0,dodge:0,lifesteal:0});
  M.DATA.strike.on=true; assert.deepStrictEqual(K.profile(S,h),p0,'strikes desligado'); assert.strictEqual(FC.compute(S,h),f0); M.DATA.strike.on=false;
  K.setOn(true); const p1=K.profile(S,h), f1=FC.compute(S,h); assert.ok(!('mount' in p1)); assert.strictEqual(p1.normal.combo,0);
  const keep=Sys.mount; delete Sys.mount; const p2=K.profile(S,h); Sys.mount=keep; assert.deepStrictEqual(p1,p2); assert.strictEqual(FC.compute(S,h),f1);
  assert.strictEqual(M.strikeOf(S),null); assert.strictEqual(JSON.stringify(S.sys.mount),b); assert.strictEqual(M.strikeOf(undefined),null);
}));

t('LIGADO (as duas): o golpe da montaria entra no perfil (com teto), na FC e nos resolvedores; a montaria não ataca (bonus e battleInfo iguais)',()=>withMount(()=>{
  const eq=gear(), h=heroHost(eq), S=ownedS('wolf',3); K.setOn(true); const f0=FC.compute(S,h), bo0=M.bonus(S), bi0=JSON.stringify(M.battleInfo(S));
  M.DATA.strike.on=true; const p=K.profile(S,h);
  assert.strictEqual(p.normal.combo,3.6); assert.deepStrictEqual(p.mount,{id:'wolf',k:'combo',value:3.6,name:'Combo',color:K.DATA.color.combo});
  assert.ok(FC.compute(S,h)>f0,'FC sobe com o combo da montaria'); assert.deepStrictEqual(M.bonus(S),bo0); assert.strictEqual(JSON.stringify(M.battleInfo(S)),bi0);
  const hit=K.onHeroHit(S,{host:h,kind:'s1',dmg:100},()=>0); assert.strictEqual(hit.combo,true);
  const S2=ownedS('wyvern',5); assert.strictEqual(K.profile(S2,h).normal.lifesteal,3.75); assert.strictEqual(K.onHeroHit(S2,{host:h,kind:'s2',dmg:200},()=>0.99).lifesteal,7.5);
  const S3=ownedS('blackdragon',5); assert.strictEqual(K.profile(S3,h).normal.stun,3); assert.strictEqual(K.profile(S3,h).boss.stun,3);
  const big={}; for(const s of Object.keys(K.DATA.pool)) big[s]={slot:s,e:8,r:5,lvl:1,gold:0,subs:[],stk:[{k:'lifesteal',q:1},{k:'stun',q:1}].filter(x=>K.DATA.pool[s].includes(x.k))};
  const pb=K.profile(S2,heroHost(big)); assert.strictEqual(pb.normal.lifesteal,K.DATA.cap.lifesteal); assert.strictEqual(pb.boss.lifesteal,K.DATA.bossCap.lifesteal);
  M.equip(S,null); assert.ok(!('mount' in K.profile(S,h)),'sem montaria em uso, nada');
}));

console.log(`\n${n} testes ok`);
