// node test/sys/loot-diff.test.js — recompensas por dificuldade (Fácil/Médio/Difícil/Hell), atrás de Sys.loot.DATA.diff.on
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const D=L.DATA.diff;

t('desligado (padrão): dificuldade ignorada; stageWin não dá nada',()=>{
  assert.strictEqual(D.on,false);
  const a=L.rollKill({},makeHost({seed:4}),{gold:100}), b=L.rollKill({},makeHost({seed:4}),{gold:100,diff:3});
  assert.strictEqual(a.gold,b.gold); assert.strictEqual(a.xp,b.xp);
  const h=makeHost(); assert.strictEqual(L.stageWin({},h,{era:0,diff:3,stage:1}).first,false); assert.strictEqual(h.gems,0);
});

t('ligado: ouro e materiais ×1 / 1,6 / 2,5 / 4; XP NÃO multiplica',()=>{
  D.on=true;
  for(const [d,m] of [[0,1],[1,1.6],[2,2.5],[3,4]]){
    const r=L.rollKill({},makeHost({seed:4}),{gold:100,diff:d}); assert.ok(Math.abs(r.gold-100*m*(L.rollKill({},makeHost({seed:4}),{gold:100}).gold/100))<=2,'ouro d'+d);
    assert.strictEqual(r.xp,L.rollKill({},makeHost({seed:4}),{gold:100}).xp,'XP igual d'+d);
  }
  let f0=0,f3=0; for(let i=0;i<40000;i++){ f0+=L.rollKill({},makeHost({seed:i}),{gold:1}).forge; f3+=L.rollKill({},makeHost({seed:i}),{gold:1,diff:3}).forge; }
  assert.ok(f3>f0*3,'forja ×4 no Hell ('+f0+' → '+f3+')');
  const h=makeHost({seed:2}); h.diff=()=>1; assert.strictEqual(L.diffOf(null,h),1,'dificuldade pelo host');
  D.on=false;
});

t('ligado: mais item na raridade-teto, nunca acima do portão',()=>{
  D.on=true; const top=(d)=>{ let k=0; const h=makeHost({level:30,eraMax:3,seed:9}); for(let i=0;i<15000;i++){ const it=L.rollItem(h,{topBoost:D.topBoost[d]}); assert.ok(it.r<=2,'portão Épico'); if(it.r===2) k++; } return k; };
  const e=top(0), hell=top(3); assert.ok(hell>e*1.8,'Hell ~×2,2 no teto ('+e+' → '+hell+')');
  D.on=false;
});

t('ligado: qualidade melhor de 2 (Difícil) e de 3 (Hell)',()=>{
  D.on=true; let k=0; const Q=[0.2,0.9,0.5,0.7,0.1,0.3];
  globalThis.Sys.stats={DATA:{quality:{on:true}},rollQuality:()=>Q[k++%Q.length]};
  assert.strictEqual(L.rollItem(makeHost({seed:1}),{qBest:1}).qp,0.2); k=0;
  assert.strictEqual(L.rollItem(makeHost({seed:1}),{qBest:3}).qp,0.9); k=0;
  const r=L.rollKill({},makeHost({seed:1}),{gold:5,boss:true,diff:2,era:0,stage:50}); assert.ok(r.items[0].qp>=0.2);
  delete globalThis.Sys.stats; D.on=false;
});

t('1ª vitória: 💎 só nos marcos (10 em 10, chefe 50, Senhor 100), inteiros por dificuldade; ouro e XP; repetir não dá',()=>{
  D.on=true; const S={}, h=makeHost({unit:10}); const got=[];
  let r=L.stageWin(S,h,{era:0,diff:0,stage:1}); assert.deepStrictEqual([r.first,r.kind,r.gems,r.gold],[true,'stage',0,50]); assert.ok(r.xp>0);
  const kinds={}; let g=0; for(let s=2;s<=100;s++){ const x=L.stageWin(S,h,{era:0,diff:0,stage:s}); kinds[x.kind]=(kinds[x.kind]||0)+1; g+=x.gems; assert.ok(Number.isInteger(x.gems)); }
  assert.deepStrictEqual([kinds.every,kinds.chief,kinds.lord],[8,1,1]); assert.strictEqual(g,25,'Fácil: 8×2 + 4 + 5');
  assert.deepStrictEqual(L.stageWin(S,h,{era:0,diff:0,stage:50}),{first:false,kind:null,gems:0,gold:0,xp:0,golem:0},'já vencida');
  assert.strictEqual(L.stageWin(S,h,{era:0,diff:1,stage:150}).kind,'chief','fase absoluta: 150 → 50 da era');
  globalThis.Sys.pet={addFragments:(S,id,n)=>{ got.push([id,n]); return {added:n}; }};
  let gold3=0; g=0; for(let s=1;s<=100;s++){ const x=L.stageWin(S,h,{era:1,diff:3,stage:s}); g+=x.gems; if(s===1) gold3=x.gold; }
  assert.strictEqual(g,75,'Hell: 8×6 + 12 + 15'); assert.strictEqual(got.length,10,'golem em cada marco do Hell'); assert.deepStrictEqual(got[0],['golem',1]);
  assert.strictEqual(gold3,200,'ouro × 4 no Hell');
  delete globalThis.Sys.pet; D.on=false;
});

t('XP da 1ª vitória vai como kill (teto diário)',()=>{
  D.on=true; const calls=[]; globalThis.Sys.level={DATA:{v9:{on:true}},addXp:(S,n,h,src)=>{ calls.push(src); return {levels:0}; }};
  L.stageWin({},makeHost(),{era:0,diff:2,stage:7}); assert.deepStrictEqual(calls,['kill']);
  delete globalThis.Sys.level; D.on=false;
});

t('conta do orçamento: 891 💎 nas dificuldades exigidas de 180 dias',()=>{
  const F=D.firstWin, per=d=>8*F.gems.every[d]+F.gems.chief[d]+F.gems.lord[d];
  assert.deepStrictEqual([0,1,2,3].map(per),[25,38,50,75]);
  const req=[[0],[0],[0,1],[0,1],[0,1,2],[0,1,2],[0,1,2,3],[0,1,2,3],[0,1,2]];
  assert.strictEqual(req.reduce((s,ds)=>s+ds.reduce((a,d)=>a+per(d),0),0),891);
});

t('chefe de fase só paga como chefe nas fases 50 e 100 (estrutura nova); Senhor da Era igual',()=>{
  const off=L.rollKill({},makeHost({seed:2}),{gold:0,boss:true,era:0,stage:37}); assert.strictEqual(off.cls,'boss','desligado: chefe normal');
  D.on=true;
  assert.strictEqual(L.rollKill({},makeHost({seed:2}),{boss:true,era:0,stage:37}).cls,'common');
  assert.strictEqual(L.rollKill({},makeHost({seed:2}),{boss:true,era:0,stage:50}).cls,'boss');
  assert.strictEqual(L.rollKill({},makeHost({seed:2,stage:200}),{boss:true}).cls,'boss','fase 200 do host = fase 100 da era 1');
  assert.strictEqual(L.rollKill({},makeHost({seed:2}),{eraBoss:true,era:0,stage:37}).cls,'eraBoss');
  D.on=false;
});
t('ligado: 100 fases por era; XP da fase 100 = a da antiga fase 10 (XP/dia igual)',()=>{
  const off10=L.rollKill({},makeHost({seed:1}),{gold:1,era:0,stage:10}).xp, off1=L.rollKill({},makeHost({seed:1}),{gold:1,era:0,stage:1}).xp;
  D.on=true; assert.strictEqual(L.rollKill({},makeHost({seed:1}),{gold:1,era:0,stage:100}).xp,off10); assert.strictEqual(L.rollKill({},makeHost({seed:1}),{gold:1,era:0,stage:1}).xp,off1);
  assert.strictEqual(L.rollKill({},makeHost({seed:1,stage:150}),{gold:1}).xp,L.rollKill({},makeHost({seed:1}),{gold:1,era:1,stage:50}).xp,'era pelo host: fase 150 = era 1');
  D.on=false;
});
console.log(`\nloot-diff: ${n} testes ok`);