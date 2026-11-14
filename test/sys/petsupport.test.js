// node test/sys/petsupport.test.js — Sys.petSupport (desligado): bônus por ter (raridade × estágio, teto 5%) e 2 pets de apoio atrás do principal
// (30% do lado de vida como vínculo, sem golpe), espaços por quantidade de pets, acampamento não conta, Sys.pet intacto
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','fc','pet','petsupport'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const P=Sys.pet, PS=Sys.petSupport, FC=Sys.fc;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=fn=>{ const a=PS.DATA.on; PS.DATA.on=true; try{ fn(); } finally{ PS.DATA.on=a; } };
const host=()=>makeHost({now:Date.UTC(2026,10,13,15,0,0)});
function save(ids,eq){ const S={}; const o=P.ensure(S); for(const id of ids) o.owned[id]={stars:1,frags:0}; o.eq=eq||null; return S; }

t('DESLIGADO por padrão: bônus zero, FC e bônus do pet iguais, view não grava',()=>{ assert.strictEqual(PS.DATA.on,false); const S=save(['wolf','owl','drake'],'wolf'), h=host();
  const pb=JSON.stringify(P.bonus(S)), fc=FC.compute(S,h); assert.deepStrictEqual(PS.bonus(S),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0,petAtk:0,petHp:0,petBond:0,petCap:0});
  assert.strictEqual(PS.setSupport(S,0,'owl').reason,'off'); PS.view(S); assert.ok(!S.sys.petSupport,'view desligada não grava');
  assert.strictEqual(JSON.stringify(P.bonus(S)),pb); assert.strictEqual(FC.compute(S,h),fc); });
t('bônus por ter: soma pela raridade (0,10/0,15/0,20/0,30/0,40) em ATQ e Vida',()=>on(()=>{ const S=save(['wolf','owl','drake','golem','phoenix']);
  const c=PS.collection(S); assert.strictEqual(c.count,5); assert.strictEqual(c.pct,1.15); const b=PS.bonus(S); assert.strictEqual(b.atkPct,1.15); assert.strictEqual(b.hpPct,1.15); assert.strictEqual(b.petBond,0,'sem principal, sem apoio'); }));
t('estágio multiplica (×1,5 médio, ×2 evoluído) e o teto é 5%',()=>on(()=>{ const S=save(['phoenix']); const keep=P.stage;
  try{ P.stage=()=>({id:'evolved',index:2}); assert.strictEqual(PS.collection(S).pct,0.8); P.stage=()=>({id:'mid'}); assert.strictEqual(PS.collection(S).pct,0.6); } finally{ P.stage=keep; }
  const S2=save(P.DATA.pets.map(p=>p.id)); const keep2=P.stage; try{ P.stage=()=>({index:2}); const c=PS.collection(S2); assert.ok(c.pct===5&&c.capped); } finally{ P.stage=keep2; } }));
t('espaços: 1º abre com 2 pets, 2º com 3; não aceita o principal, pet que não tem ou repetido (troca)',()=>on(()=>{ let S=save(['wolf'],'wolf');
  assert.strictEqual(PS.setSupport(S,0,'owl').reason,'locked'); S=save(['wolf','owl'],'wolf'); assert.ok(PS.setSupport(S,0,'owl').ok); assert.strictEqual(PS.setSupport(S,1,'owl').reason,'locked');
  S=save(['wolf','owl','drake'],'wolf'); assert.strictEqual(PS.setSupport(S,0,'wolf').reason,'main'); assert.strictEqual(PS.setSupport(S,0,'golem').reason,'pet');
  PS.setSupport(S,0,'owl'); PS.setSupport(S,1,'drake'); const r=PS.setSupport(S,0,'drake'); assert.deepStrictEqual(r.sup,['drake','owl'],'troca de lugar'); assert.deepStrictEqual(PS.setSupport(S,1,null).sup,['drake',null]); }));
t('apoio = 30% do lado de vida (vínculo + cura) como petBond; NUNCA petAtk; FC sobe',()=>on(()=>{ const S=save(['wolf','owl','phoenix'],'wolf'), h=host();
  const fc0=FC.compute(S,h), b0=PS.bonus(S); PS.setSupport(S,0,'owl'); PS.setSupport(S,1,'phoenix');
  const tOwl=P.DATA.types.gather, tPh=P.DATA.types.heal, want=Math.round((0.3*(tOwl.bond+tOwl.heal)*P.pOf(S,'owl')+0.3*(tPh.bond+tPh.heal)*P.pOf(S,'phoenix'))*100*1e4)/1e4;
  const b=PS.bonus(S); assert.ok(Math.abs(b.petBond-want)<1e-3,b.petBond+' vs '+want); assert.strictEqual(b.petAtk,0); assert.strictEqual(b.petHp,0); assert.strictEqual(b.goldPct,0);
  assert.ok(b.petBond>0&&b.atkPct===b0.atkPct); assert.ok(FC.compute(S,h)>fc0); }));
t('sem principal equipado: apoio não vale; trocar o principal para um apoio tira ele do espaço',()=>on(()=>{ const S=save(['wolf','owl','drake'],'wolf');
  PS.setSupport(S,0,'owl'); P.equip(S,null); assert.strictEqual(PS.bonus(S).petBond,0); P.equip(S,'owl'); assert.deepStrictEqual(PS.ensure(S).sup,[null,null]); }));
t('pet no Acampamento não conta como apoio e não entra no espaço',()=>on(()=>{ const S=save(['wolf','owl','drake'],'wolf'); PS.setSupport(S,0,'owl');
  S.sys.camp={tents:{gold:{pets:['owl']}}}; assert.strictEqual(PS.bonus(S).petBond,0); assert.strictEqual(PS.view(S).slots[0].camp,'gold');
  assert.strictEqual(PS.setSupport(S,1,'owl').reason,'camp'); }));
t('testes do Sys.pet não dependem deste módulo (pet.js sem mudança)',()=>{ const src=require('fs').readFileSync(require('path').join(__dirname,'../../js/sys/pet.js'),'utf8'); assert.ok(!/petSupport/.test(src)); });
console.log(n+' testes ok');
