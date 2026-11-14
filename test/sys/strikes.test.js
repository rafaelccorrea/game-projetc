// node test/sys/strikes.test.js — Golpes especiais nos itens (Sys.strikes): chave desligada = zero efeito (drop, FC, batalha); sorteio por espaço/raridade; tetos; resolvedores
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['stats','forge','fc','loot','strikes','grimoire'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost,seeded}=require('./_host.js');
const K=Sys.strikes, L=Sys.loot, FC=Sys.fc;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const counter=rng=>{ const f=()=>{ f.n++; return rng(); }; f.n=0; return f; };
const gear=()=>({weapon:{slot:'weapon',e:2,r:4,lvl:10,gold:0,subs:[{k:'critRate',q:0.5},{k:'atkPct',q:0.5}],stk:[{k:'combo',q:1},{k:'lifesteal',q:1}]},
  armor:{slot:'armor',e:2,r:2,lvl:10,gold:0,subs:[{k:'hpPct',q:0.5},{k:'aspd',q:0.5}],stk:[{k:'dodge',q:1}]},
  gloves:{slot:'gloves',e:2,r:1,lvl:5,gold:0,subs:[{k:'atkPct',q:0.2}]}});
const heroHost=eq=>Object.assign(makeHost({eraMax:2,level:40}),{equipped:()=>eq});

t('chave DESLIGADA por padrão: tag não mexe no item nem gasta sorte; resolvedores devolvem nada sem gastar sorte',()=>{
  assert.strictEqual(K.on(),false);
  const it={slot:'weapon',r:4,e:0}, r=counter(seeded(3)); K.tag(it,r); assert.ok(!('stk' in it)); assert.strictEqual(r.n,0);
  const it2={slot:'weapon',r:4,e:0}; K.ensureItem(it2); assert.ok(!('stk' in it2));
  const S={}, h=heroHost(gear()), r2=counter(seeded(4));
  const a=K.onHeroHit(S,{host:h,kind:'s1',dmg:100},r2), b=K.onHeroHurt(S,{host:h,dmg:50},r2);
  assert.strictEqual(r2.n,0); assert.strictEqual(a.combo,false); assert.strictEqual(a.lifesteal,0); assert.strictEqual(a.labels.length,0);
  assert.strictEqual(b.dodge,false); assert.strictEqual(b.counter,false); assert.strictEqual(K.totals(S,h),null);
  assert.deepStrictEqual(K.profile(S,h).normal,{combo:0,counter:0,stun:0,dodge:0,lifesteal:0});
});

t('DESLIGADA: Sys.loot.rollItem sai byte a byte igual com e sem o módulo carregado (300 itens, mesma semente; sem chefe, que guarda memória da sessão)',()=>{
  const run=()=>{ const h=makeHost({seed:77,eraMax:3,level:60}), out=[]; for(let i=0;i<300;i++) out.push(L.rollItem(h,{source:['drop','chest','eraBossInst'][i%3]})); return JSON.stringify(out)+h.rng(); };
  const withMod=run(); const keep=Sys.strikes; delete Sys.strikes; const without=run(); Sys.strikes=keep;
  assert.strictEqual(withMod,without); assert.ok(!withMod.includes('"stk"'));
});

t('DESLIGADA: a FC (compute, snapshot, itemFC) é idêntica com e sem os módulos novos, mesmo com it.stk nos itens',()=>{
  const S={}, eq=gear(), h=heroHost(eq), probe={slot:'boots',e:2,r:3,lvl:3,gold:0,subs:[{k:'critDmg',q:0.4},{k:'atkPct',q:0.9}],stk:[{k:'dodge',q:1}]};
  const a={fc:FC.compute(S,h),snap:FC.snapshot(S,h),item:FC.itemFC(S,h,probe),st:Object.keys(FC.stats(S,h))};
  const ks=Sys.strikes, kg=Sys.grimoire; delete Sys.strikes; delete Sys.grimoire;
  const b={fc:FC.compute(S,h),snap:FC.snapshot(S,h),item:FC.itemFC(S,h,probe),st:Object.keys(FC.stats(S,h))};
  Sys.strikes=ks; Sys.grimoire=kg; assert.deepStrictEqual(a,b); assert.ok(a.fc>0); assert.ok(!a.st.includes('strikes'));
});

t('LIGADA: sorteio respeita quantidade por raridade e a lista do espaço, sem repetir; drop grava it.stk e itemOut leva junto',()=>{
  K.setOn(true); try{
    const rng=seeded(9);
    for(const slot of Object.keys(K.DATA.pool)) for(let r=0;r<=5;r++) for(let i=0;i<20;i++){ const s=K.roll(slot,r,rng);
      assert.strictEqual(s.length,Math.min(K.DATA.count[r],K.DATA.pool[slot].length)); assert.strictEqual(new Set(s.map(x=>x.k)).size,s.length);
      for(const x of s){ assert.ok(K.DATA.pool[slot].includes(x.k)); assert.ok(x.q>=0&&x.q<=1); } }
    const h=makeHost({seed:5,eraMax:2,level:40}); let seen=0;
    for(let i=0;i<60;i++){ const it=L.rollItem(h,{source:'boss',minR:1}); assert.ok(Array.isArray(it.stk)); if(it.r>=1) assert.ok(it.stk.length>=1); seen+=it.stk.length;
      const o=L.itemOut(it); assert.deepStrictEqual(o.stk,it.stk.map(x=>({k:x.k,q:x.q}))); }
    assert.ok(seen>0);
    const tagged={slot:'weapon',r:4,e:0,stk:[{k:'combo',q:0.5}]}; K.tag(tagged,rng); assert.deepStrictEqual(tagged.stk,[{k:'combo',q:0.5}],'tag não re-sorteia');
  } finally { K.setOn(false); }
});

t('valor: cresce com raridade e era; faixa da Rara na era 0 = tabela; describe com nome em português',()=>{
  const v=(k,q,r,e)=>K.value({k,q},{r,e});
  assert.strictEqual(v('combo',0,1,0),3); assert.strictEqual(v('combo',1,1,0),6); assert.strictEqual(v('dodge',1,1,0),3);
  assert.ok(v('combo',0.5,4,0)>v('combo',0.5,2,0)); assert.ok(v('combo',0.5,2,5)>v('combo',0.5,2,0)); assert.strictEqual(v('combo',1,0,0),0);
  assert.strictEqual(v('xx',1,4,0),0);
  const d=K.describe({slot:'weapon',r:1,e:0,stk:[{k:'lifesteal',q:1}]}); assert.strictEqual(d[0].text,'Roubo de vida +2,5%'); assert.strictEqual(d[0].name,'Roubo de vida');
});

t('item antigo: ensureItem gera sempre o mesmo (semente pelo id) e limpa chave inválida',()=>{
  K.setOn(true); try{
    const a={id:'x1',slot:'necklace',r:4,e:3}, b={id:'x1',slot:'necklace',r:4,e:3}; K.ensureItem(a); K.ensureItem(b); assert.deepStrictEqual(a.stk,b.stk); assert.strictEqual(a.stk.length,2);
    const c={slot:'boots',r:1,e:0,stk:[{k:'lifesteal',q:1},{k:'hack',q:1},{k:'dodge',q:0.3}]}; K.ensureItem(c); assert.deepStrictEqual(c.stk,[{k:'dodge',q:0.3}]);
  } finally { K.setOn(false); }
});

t('tetos: soma de 7 itens Divinos da era 8 fica no teto; contra chefe/Arena o atordoar e a esquiva têm teto menor',()=>{
  K.setOn(true); try{
    const eq={}; for(const s of Object.keys(K.DATA.pool)) eq[s]={slot:s,e:8,r:4,lvl:1,gold:0,subs:[],stk:K.DATA.pool[s].slice(0,2).map(k=>({k,q:1}))};
    eq.wing.stk=K.DATA.keys.map(k=>({k,q:1})).slice(0,2);
    const P=K.profile({},heroHost(eq));
    for(const k of K.DATA.keys){ assert.ok(P.normal[k]<=K.DATA.cap[k]); assert.ok(P.boss[k]<=K.DATA.bossCap[k]); }
    assert.strictEqual(P.normal.combo,K.DATA.cap.combo); assert.ok(P.boss.stun<=10&&P.boss.dodge<=20);
  } finally { K.setOn(false); }
});

t('onHeroHit: combo só no básico e nunca de um combo; atordoar respeita a imunidade; roubo de vida = dano × %',()=>{
  K.setOn(true); try{
    const prof={normal:{combo:100,counter:0,stun:100,dodge:0,lifesteal:10},boss:{combo:100,counter:0,stun:100,dodge:0,lifesteal:5}};
    const r=seeded(1);
    let x=K.onHeroHit({},{profile:prof,kind:'s1',dmg:200,now:10},r);
    assert.ok(x.combo); assert.strictEqual(x.comboMult,0.5); assert.ok(x.stun); assert.strictEqual(x.stunSec,1); assert.strictEqual(x.immuneUntil,14); assert.strictEqual(x.lifesteal,20);
    assert.deepStrictEqual(x.labels.map(l=>l.text),['COMBO','ATORDOADO','ROUBO DE VIDA']);
    x=K.onHeroHit({},{profile:prof,kind:'s2',dmg:200,now:12,immuneUntil:14},r); assert.ok(!x.combo); assert.ok(!x.stun,'imune até 14 s');
    x=K.onHeroHit({},{profile:prof,kind:'s1',isCombo:true,dmg:100,now:20},r); assert.ok(!x.combo);
    x=K.onHeroHit({},{profile:prof,kind:'s1',dmg:100,now:20,boss:true},r); assert.strictEqual(x.stunSec,0.5); assert.strictEqual(x.immuneUntil,24.5); assert.strictEqual(x.lifesteal,5);
  } finally { K.setOn(false); }
});

t('onHeroHurt: esquiva zera o dano; contra-ataque sai mesmo na esquiva; frequência perto da chance (2.000 golpes)',()=>{
  K.setOn(true); try{
    let x=K.onHeroHurt({},{profile:{normal:{dodge:100,counter:100},boss:{}},dmg:80},seeded(2)); assert.ok(x.dodge&&x.counter); assert.strictEqual(x.dmg,0); assert.strictEqual(x.counterMult,0.6);
    const P={normal:{combo:0,counter:20,stun:0,dodge:25,lifesteal:0},boss:{combo:0,counter:20,stun:0,dodge:20,lifesteal:0}}, r=seeded(8); let d=0,c=0;
    for(let i=0;i<2000;i++){ const y=K.onHeroHurt({},{profile:P,dmg:10},r); if(y.dodge) d++; if(y.counter) c++; }
    assert.ok(Math.abs(d/2000-0.25)<0.04,'esquiva '+d); assert.ok(Math.abs(c/2000-0.20)<0.04,'contra '+c);
  } finally { K.setOn(false); }
});

t('LIGADA: a FC sobe com os golpes do equipamento e itemFC conta o golpe do item novo',()=>{
  const S={}, eq=gear(), h=heroHost(eq), off=FC.compute(S,h);
  K.setOn(true); try{
    const on=FC.compute(S,h), st=FC.stats(S,h); assert.ok(st.strikes&&st.strikes.combo>0); assert.ok(on>off,'FC '+on+' > '+off);
    const f=K.fcFactor(st.strikes); assert.ok(f.atk>1&&f.hp>1); assert.ok(on/off<1.5,'ganho moderado: '+(on/off).toFixed(3));
    const a={slot:'boots',e:2,r:3,lvl:3,gold:0,subs:[],stk:[{k:'dodge',q:1}]}, b=Object.assign({},a,{stk:[]});
    assert.ok(FC.itemFC(S,h,a).swap>FC.itemFC(S,h,b).swap);
  } finally { K.setOn(false); }
  assert.strictEqual(FC.compute(S,h),off,'desligar volta ao mesmo número');
});
{ const SK=require('../../js/sys/strikes.js'); const k=SK.DATA.on; SK.DATA.on=true; try{ const p=SK.profile({},null,null,{extra:{combo:7},noMount:true}); if(!(p.raw.combo>=7)) throw new Error('extra não somou'); if(p.mount) throw new Error('noMount'); console.log('ok - profile aceita extra e noMount'); } finally { SK.DATA.on=k; } }
console.log(n+' testes ok');
