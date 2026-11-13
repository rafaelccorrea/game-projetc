// node test/sys/affinity.test.js — Sys.affinity: afinidade das eras e o aviso "Fraco contra" (docs/IDLE_PARECIDOS.md §3 item 14). Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['stats','affinity'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const A=Sys.affinity, T=Sys.stats;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ A.setOn(true); try{ fn(); } finally{ A.setOn(false); } };
const heroWith=w=>Object.assign(makeHost({level:40}),{equipped:()=>({weapon:w})});
const sword={id:1,slot:'weapon',e:2,r:2,wt:'sword'}, rifle={id:2,slot:'weapon',e:5,r:2,wt:'rifle'};

t('DESLIGADO: multiplicador 1 e aviso vazio',()=>{
  assert.strictEqual(A.DATA.on,false); const h=heroWith(sword);
  for(let s=1;s<=90;s+=7) assert.strictEqual(A.mult({},h,s),1); const w=A.warn({},h,41); assert.strictEqual(w.on,false); assert.strictEqual(w.text,''); assert.strictEqual(w.weakAgainst,null);
});

t('tabela: 9 eras, cada estilo fraco em 3 eras, multiplicador pequeno (+15% / −10%)',()=>{
  assert.strictEqual(A.DATA.eras.length,9); assert.ok(A.DATA.weak<=0.15&&A.DATA.weak>=0.10); assert.ok(A.DATA.resist>=-0.15&&A.DATA.resist<=-0.10);
  const c={}; A.DATA.eras.forEach(e=>{ c[e.weak]=(c[e.weak]||0)+1; assert.notStrictEqual(e.weak,e.resist); }); assert.deepStrictEqual(c,{blade:3,arcane:3,shot:3});
  assert.strictEqual(A.table().length,9);
});

t('justiça: nenhuma era resiste ao estilo da arma da própria era (FAM_BY_ERA do Sys.stats)',()=>{
  T.FAM_BY_ERA.forEach((fam,e)=>{ const st=T.DATA.weaponTypes[fam].style==='melee'?'blade':'shot'; assert.strictEqual(A.DATA.eraStyle[e],st,'era '+e);
    assert.notStrictEqual(A.DATA.eras[e].resist,st,'era '+e+' resiste à própria arma'); });
});

t('aviso da fase: "Fraco contra: X"; fase → era (10 por era); tom bom/ruim/neutro pelo estilo do herói',()=>withOn(()=>{
  const hs=heroWith(sword), hr=heroWith(rifle);
  let w=A.warn({},hs,1); assert.strictEqual(w.era,0); assert.strictEqual(w.text,'Fraco contra: Lâmina'); assert.strictEqual(w.tone,'good'); assert.strictEqual(w.mult,1.15);
  w=A.warn({},hs,25); assert.strictEqual(w.era,2); assert.strictEqual(w.weakAgainst,'Disparo'); assert.strictEqual(w.tone,'neutral'); assert.strictEqual(A.mult({},hr,25),1.15);
  w=A.warn({},hs,31); assert.strictEqual(w.era,3); assert.strictEqual(w.tone,'bad'); assert.strictEqual(w.mult,0.9); assert.ok(/resistem a Lâmina/.test(w.tip));
  assert.strictEqual(A.warn({},hs,90).era,8); assert.strictEqual(A.warn({},hs,900).era,8); assert.strictEqual(A.warn({},hs,{era:6}).weakAgainst,'Disparo');
  assert.strictEqual(A.mult({},hs,15,{style:'arcane'}),1.15,'predefinição manda');
  assert.strictEqual(A.mult({sys:{path:{id:'arcane'}}},hs,15),1.15,'caminho escolhido manda sobre a arma');
  assert.strictEqual(A.warn({},makeHost(),1).mineId,null); assert.strictEqual(A.mult({},makeHost(),1),1,'sem arma: neutro');
}));

console.log(`affinity: ${n} ok`);
