// node test/sys/fusion.test.js — Sys.fusion: fusão com resultado conhecido (docs/IDLE_PARECIDOS.md §3 item 11). Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['stats','fusion'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const T=Sys.stats, F=Sys.fusion;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=gold=>{ const h=makeHost({eraMax:2,level:40}); h.gold=gold==null?1e9:gold; h.canSpendGold=g=>h.gold>=g; h.spendGold=g=>{ if(h.gold<g) return false; h.gold-=g; return true; }; return h; };
const arm=(id,qp,o)=>Object.assign({id,slot:'armor',e:2,r:1,lvl:id,gold:100*id,qp,subs:[{k:'critRate',q:0.1*id}]},o||{});
const save=()=>({inv:[arm(1,2100),arm(2,2500),arm(3,3900),arm(4,2200,{r:2,subs:[{k:'aspd',q:0.5},{k:'hpPct',q:0.2}]})],eq:{armor:2},nextId:5});
const withOn=fn=>{ const q=T.DATA.quality.on; T.DATA.quality.on=true; F.setOn(true); try{ fn(); } finally{ F.setOn(false); F.DATA.rarity.on=false; T.DATA.quality.on=q; } };

t('DESLIGADO: prévia e fusão recusam (off), autoPlan vazio, save igual',()=>{
  assert.strictEqual(F.DATA.on,false); assert.strictEqual(F.DATA.rarity.on,false);
  const S=save(), before=JSON.stringify(S), h=host();
  assert.strictEqual(F.preview(S,h,[1,2,3]).reason,'off'); assert.strictEqual(F.apply(S,h,[1,2,3]).reason,'off');
  assert.deepStrictEqual(F.autoPlan(S,h),[]); assert.strictEqual(JSON.stringify(S),before); assert.strictEqual(h.gold,1e9);
});

t('estrela: a prévia é o resultado EXATO do Sys.stats.canFuse e o item entregue é igual à prévia; mantém equipado',()=>withOn(()=>{
  const S=save(), h=host(), p=F.preview(S,h,[1,2,3]);
  assert.ok(p.ok,p.reason); const c=T.canFuse(S,h,S.inv.slice(0,3)); assert.deepStrictEqual(p.result,c.result); assert.strictEqual(p.gold,c.gold);
  assert.strictEqual(p.from,2); assert.strictEqual(p.to,3); assert.strictEqual(p.keepsEquipped,true); assert.ok(p.lines[0].includes('3 estrelas'));
  const p2=F.preview(S,h,[3,1,2]); assert.deepStrictEqual(p2.result,p.result,'ordem não muda o resultado'); assert.strictEqual(p2.key,p.key);
  const g0=h.gold, r=F.apply(S,h,[1,2,3],null,p.key); assert.ok(r.ok,r.reason);
  const {id,gotAt,nw,...rest}=r.item; assert.deepStrictEqual(rest,p.result); assert.strictEqual(id,5); assert.strictEqual(S.nextId,6);
  assert.strictEqual(h.gold,g0-p.gold); assert.deepStrictEqual(S.inv.map(x=>x.id),[4,5]); assert.strictEqual(S.eq.armor,5);
}));

t('estrela: sem ouro a prévia mostra o resultado (money) e não cobra; key velha recusa (changed); ids ruins',()=>withOn(()=>{
  const S=save(), h=host(0), p=F.preview(S,h,[1,2,3]);
  assert.strictEqual(p.ok,false); assert.strictEqual(p.reason,'money'); assert.ok(p.result&&p.gold>0);
  const before=JSON.stringify(S); assert.strictEqual(F.apply(S,h,[1,2,3]).reason,'money'); assert.strictEqual(JSON.stringify(S),before);
  const h2=host(); assert.strictEqual(F.apply(S,h2,[1,2,3],null,'123').reason,'changed'); assert.strictEqual(JSON.stringify(S),before);
  assert.strictEqual(F.preview(S,h2,[1,1,2]).reason,'ids'); assert.strictEqual(F.preview(S,h2,[1,2,99]).reason,'ids');
  assert.strictEqual(F.preview(S,h2,[1,2,4]).reason,'different');
}));

t('raridade (PROPOSTA, chave própria): o jogador escolhe qual dos 3 dá aparência/qualidade/secundários; secundário novo fixo pela semente',()=>withOn(()=>{
  const S=save(), h=host();
  assert.strictEqual(F.preview(S,h,[1,2,3],{mode:'rarity',pick:3}).reason,'off'); F.DATA.rarity.on=true;
  assert.strictEqual(F.preview(S,h,[1,2,3],{mode:'rarity'}).reason,'pick','sem escolha não funde');
  const p=F.preview(S,h,[1,2,3],{mode:'rarity',pick:3}); assert.ok(p.ok,p.reason);
  assert.strictEqual(p.result.r,2); assert.strictEqual(p.result.qp,3900); assert.strictEqual(p.result.lvl,3); assert.strictEqual(p.result.gold,600);
  assert.strictEqual(p.result.subs.length,T.subCount(2)); assert.deepStrictEqual(p.result.subs[0],{k:'critRate',q:0.30000000000000004});
  assert.deepStrictEqual(F.preview(S,h,[2,3,1],{mode:'rarity',pick:3}).result,p.result,'mesma semente');
  assert.notDeepStrictEqual(F.preview(S,h,[1,2,3],{mode:'rarity',pick:1}).result.qp,p.result.qp);
  const r=F.apply(S,h,[1,2,3],{mode:'rarity',pick:3},p.key); assert.ok(r.ok); const {id,gotAt,nw,...rest}=r.item; assert.deepStrictEqual(rest,p.result);
  // teto: Mítico é o máximo (Lendário só por drop)
  const S2={inv:[1,2,3].map(i=>arm(i,2000,{r:3}))}; assert.strictEqual(F.preview(S2,h,[1,2,3],{mode:'rarity',pick:1}).reason,'max');
}));

t('autoPlan (VIP autoFuse): nunca o equipado, nunca 5 estrelas, ordem fixa, não mexe no save',()=>withOn(()=>{
  const S={inv:[arm(1,2100),arm(2,2500),arm(3,3900),arm(5,2300),arm(6,8100),arm(7,8200),arm(8,9000)],eq:{armor:5}}, before=JSON.stringify(S), h=host();
  const plan=F.autoPlan(S,h); assert.deepStrictEqual(plan.map(x=>x.ids),[[1,2,3]]); assert.strictEqual(JSON.stringify(S),before);
}));

console.log(`fusion: ${n} ok`);
