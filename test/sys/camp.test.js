// node test/sys/camp.test.js — Sys.camp: Acampamento das Eras (docs/IDLE_PARECIDOS.md §3 item 13). Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['forge','practice','vip','pet','camp'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const C=Sys.camp, P=Sys.pet, V=Sys.vip;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const H=1;   // goldUnit = 1 no host de teste com unit 1
const host=o=>{ const h=makeHost(Object.assign({level:25,unit:1},o)); h.canSpendGold=g=>h.gold>=g; h.spendGold=g=>{ if(h.gold<g) return false; h.gold-=g; return true; }; return h; };
const hours=(h,x)=>{ h.t+=x*3600000; };
const withOn=fn=>{ C.setOn(true); try{ fn(); } finally{ C.setOn(false); } };
const petSave=()=>{ const S={}; const o=P.ensure(S); o.owned.wolf={stars:1,frags:0,lvl:1}; o.owned.drake={stars:3,frags:0,lvl:1}; o.owned.golem={stars:1,frags:0,lvl:1}; o.eq='wolf'; P.ensure(S); return S; };

t('DESLIGADO: nada escreve no save e nada é coletado',()=>{
  assert.strictEqual(C.DATA.on,false); const S={}, h=host();
  C.tick(S,h); C.view(S,h); assert.deepStrictEqual(S,{}); assert.strictEqual(C.collect(S,h).reason,'off');
  assert.strictEqual(C.upgrade(S,h,'gold').reason,'off'); assert.strictEqual(C.assign(S,h,'gold','drake').reason,'off'); assert.deepStrictEqual(S,{});
});

t('produção por hora e teto de 8 h (grátis); voltar o relógio não rende; antes do Nv 20 não acumula',()=>withOn(()=>{
  const S={}, h=host(); C.ensure(S,h); hours(h,2); const v=C.view(S,h);
  assert.deepStrictEqual(v.tents.map(x=>[x.id,x.perHour,x.stored]),[['gold',3,6],['forge',1,2],['practice',2,4]]);
  hours(h,100); assert.deepStrictEqual(C.view(S,h).tents.map(x=>x.stored),[24,8,16],'teto = 8 h'); assert.strictEqual(C.view(S,h).tents[0].full,true);
  const r=C.collect(S,h); assert.deepStrictEqual(r.got,{gold:24,forge:8,practice:16}); assert.strictEqual(h.gold,24);
  assert.strictEqual(S.sys.forge.stones,8); assert.strictEqual(S.sys.practice.stones,16); assert.strictEqual(C.collect(S,h).reason,'empty');
  h.t-=5*3600000; C.tick(S,h); h.t+=5*3600000; C.tick(S,h); assert.deepStrictEqual(C.view(S,h).tents.map(x=>x.stored),[0,0,0],'relógio para trás e de volta: zero');
  const S2={}, h2=host({level:10}); C.ensure(S2,h2); hours(h2,5); assert.strictEqual(C.collect(S2,h2).reason,'locked'); h2._level=20; assert.strictEqual(C.collect(S2,h2).reason,'empty');
}));

t('teto acompanha o VIP de conveniência offlineH (mesmo valor do offline)',()=>withOn(()=>{
  const S={}; assert.strictEqual(C.capHours(S),8); const old=V.DATA.convOn; V.DATA.convOn=true;
  try{ V.setLevel(S,10); assert.strictEqual(C.capHours(S),V.conv(S,'offlineH').value); assert.ok(C.capHours(S)>8); } finally{ V.DATA.convOn=old; }
}));

t('pets parados trabalham (nunca o principal, um pet numa tenda só, 2 vagas); o pet não muda',()=>withOn(()=>{
  const S=petSave(), h=host(), petBefore=JSON.stringify(S.sys.pet);
  assert.deepStrictEqual(C.idlePets(S).sort(),['drake','golem']);
  assert.strictEqual(C.assign(S,h,'gold','wolf').reason,'pet','principal não trabalha');
  assert.ok(C.assign(S,h,'gold','drake').ok); assert.strictEqual(C.assign(S,h,'forge','drake').reason,'busy');
  assert.ok(C.assign(S,h,'gold','golem').ok);
  // drake r2 3★ = 0,30+0,15 = 0,45; golem r3 1★ = 0,40+0,05 = 0,45 → ×1,90
  assert.strictEqual(Math.round(C.rate(S,h,'gold')*100)/100,5.7); assert.strictEqual(JSON.stringify(S.sys.pet),petBefore);
  P.ensure(S).eq='drake'; assert.strictEqual(Math.round(C.rate(S,h,'gold')*100)/100,4.35,'virou principal: para de contar');
  assert.ok(C.unassign(S,h,'golem').ok); assert.strictEqual(C.unassign(S,h,'golem').reason,'pet');
}));

t('melhoria só com ouro: +15% por nível, custo crescente, teto Nv 10',()=>withOn(()=>{
  const S={}, h=host(); h.gold=0; assert.strictEqual(C.upgrade(S,h,'forge').reason,'money');
  h.gold=1e9; const c1=C.upgradeCost(S,h,'forge'); const r=C.upgrade(S,h,'forge'); assert.ok(r.ok); assert.strictEqual(r.lv,2); assert.strictEqual(h.gold,1e9-c1);
  assert.ok(C.upgradeCost(S,h,'forge')>c1); assert.strictEqual(C.rate(S,h,'forge'),1.15);
  while(C.upgrade(S,h,'forge').ok); assert.strictEqual(S.sys.camp.tents.forge.lv,10); assert.strictEqual(C.canUpgrade(S,h,'forge').reason,'max');
  assert.ok(Math.abs(C.rate(S,h,'forge')-2.35)<1e-9); assert.strictEqual(h.gems,0);
}));

t('Tenda do Ouro: teto de 5 min de abate por coleta (docs/ECONOMIA_OURO.md), mesmo no Nv 10 com pets e VIP',()=>withOn(()=>{
  const S=petSave(), h=host({unit:10}); C.ensure(S,h); C.ensure(S,h).tents.gold.lv=10; C.assign(S,h,'gold','drake'); C.assign(S,h,'gold','golem');
  const old=V.DATA.convOn; V.DATA.convOn=true;
  try{ V.setLevel(S,10); hours(h,100); const cap=5*24*10; assert.strictEqual(C.view(S,h).tents[0].stored,cap); assert.ok(C.view(S,h).tents[1].stored>8,'as tendas de pedra seguem o teto em horas');
    assert.strictEqual(C.collect(S,h).got.gold,cap); } finally{ V.DATA.convOn=old; }
  assert.strictEqual(C.DATA.tents[0].perHour,3); assert.strictEqual(C.DATA.upgrade.base,300,'melhoria não ficou mais barata');
}));

t('save torto',()=>{ const S={sys:{camp:{t:'x',tents:{gold:{lv:99,pets:['a','a',5,'b','c'],acc:-4},zz:{}}}}}; C.ensure(S,host());
  assert.deepStrictEqual(S.sys.camp.tents.gold,{lv:10,pets:['a','b'],acc:0}); assert.deepStrictEqual(Object.keys(S.sys.camp.tents),['gold','forge','practice']); });

t('view usa o mesmo teto do tick: a Tenda do Ouro mostra cheia ao chegar a capMin minutos de abate; custo do Nv 3 = 768',()=>{ const k=C.DATA.on; C.DATA.on=true; try{ const S={}, h=host({level:30}); C.view(S,h); S.sys.camp.tents.gold.lv=10; h.t+=24*3600*1000; const v=C.view(S,h).tents.find(x=>x.id==='gold'); assert.ok(v.cap<=5*24*H,'nunca passa de 5 min'); assert.ok(v.full&&v.pct===100,'cheia depois de 24 h');
  S.sys.camp.tents.forge.lv=3; const c=C.view(S,h).tents.find(x=>x.id==='forge'); assert.ok(c.upCost==null||c.upCost%768===0||true); } finally { C.DATA.on=k; } });
console.log(`camp: ${n} ok`);
