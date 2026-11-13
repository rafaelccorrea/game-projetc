// node test/sys/newpets3.test.js — Lobo sombrio, Falcão de guerra e Pantera espectral: cada fonte real (Sys.newDrops) entrega e o pet nasce
// nos fragmentos do módulo (60 / 60 / 100). Com as entregas DESLIGADAS (padrão), nada chega. Matriz: docs/SISTEMA_MATRIZ.md.
'use strict';
const assert=require('assert');
globalThis.Sys={};
const P=require('../../js/sys/pet.js'), N=require('../../js/sys/newdrops.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const DAY=86400000;
const host=(d)=>Object.assign(makeHost({level:80,eraMax:5}),{now:()=>Date.UTC(2026,10,16,15)+(d||0)*DAY});
const pet=(S,id)=>P.ensure(S).owned[id]||null, stored=(S,id)=>(P.ensure(S).stored||{})[id]|0;
const withOn=fn=>{ const on=N.DATA.on; N.DATA.on=true; try{ fn(); } finally{ N.DATA.on=on; } };

t('os 3 estão no módulo como combinado: Raro/Raro/Épico, ataque, 60/60/100 fragmentos, ligados por newReady',()=>{
  const by=id=>P.DATA.pets.find(p=>p.id===id); const [w,f,p]=['shadowwolf','falcon','panther'].map(by);
  assert.deepStrictEqual([w.r,f.r,p.r],[1,1,2]); assert.deepStrictEqual([w.hatchFrags,f.hatchFrags,p.hatchFrags],[60,60,100]);
  assert.deepStrictEqual([w.skill.id,f.skill.id,p.skill.id],['dash','ranged','blink']); for(const id of ['shadowwolf','falcon','panther']) assert.strictEqual(P.DATA.newReady[id],true,id); });
t('entregas DESLIGADAS (padrão): nenhuma fonte dá nada',()=>{ assert.strictEqual(N.DATA.on,false); const S={}, h=host();
  for(const [src,c] of [['inst:win',{type:'gear',diff:0,first:true}],['activity:full',{}],['tower:floor',{floor:30}],['missions:daily',{}],['arena:season',{league:3}]]){ const r=N.grant(S,h,src,c); assert.strictEqual(r.ok,false); assert.strictEqual(r.reason,'off'); }
  assert.strictEqual(pet(S,'shadowwolf'),null); assert.strictEqual(pet(S,'falcon'),null); assert.strictEqual(pet(S,'panther'),null); });
t('Lobo sombrio: 1ª vitória na Instância Arsenal dá o pet inteiro, uma vez por dificuldade; repetido vira fragmento',()=>withOn(()=>{ const S={}, h=host();
  N.grant(S,h,'inst:win',{type:'gear',diff:0,first:true}); assert.ok(pet(S,'shadowwolf'),'nasceu');
  const f0=pet(S,'shadowwolf').frags|0; N.grant(S,h,'inst:win',{type:'gear',diff:0,first:true}); assert.strictEqual(pet(S,'shadowwolf').frags|0,f0,'mesma dificuldade não repete');
  N.grant(S,h,'inst:win',{type:'gear',diff:1,first:true}); assert.ok((pet(S,'shadowwolf').frags|0)>f0||pet(S,'shadowwolf').stars>1,'outra dificuldade: repetido vira fragmento');
  N.grant(S,h,'inst:win',{type:'boss',diff:2,first:true}); }));
t('Lobo sombrio: baús da atividade, 2 fragmentos por dia; nasce no dia 30 (60 fragmentos)',()=>withOn(()=>{ const S={};
  for(let d=0;d<29;d++){ N.grant(S,host(d),'activity:full',{}); N.grant(S,host(d),'activity:full',{}); } assert.strictEqual(pet(S,'shadowwolf'),null); assert.strictEqual(stored(S,'shadowwolf'),58,'1 vez por dia');
  N.grant(S,host(29),'activity:full',{}); assert.ok(pet(S,'shadowwolf'),'nasce com 60'); }));
t('Falcão de guerra: Torre andar 30 dá inteiro, uma vez; outros andares não; missões diárias 1 por dia (nasce em 60 dias)',()=>withOn(()=>{ const S={}, h=host();
  N.grant(S,h,'tower:floor',{floor:29}); assert.strictEqual(pet(S,'falcon'),null); N.grant(S,h,'tower:floor',{floor:30}); assert.ok(pet(S,'falcon'));
  const S2={}; for(let d=0;d<59;d++){ N.grant(S2,host(d),'missions:daily',{}); N.grant(S2,host(d),'missions:daily',{}); } assert.strictEqual(stored(S2,'falcon'),59); N.grant(S2,host(59),'missions:daily',{}); assert.ok(pet(S2,'falcon')); }));
t('Pantera espectral: Arena fim de temporada, Prata nada, Ouro 15, Platina+ 30; nasce com 100',()=>withOn(()=>{ const S={}, h=host();
  N.grant(S,h,'arena:season',{league:1}); assert.strictEqual(stored(S,'panther'),0); N.grant(S,h,'arena:season',{league:2}); assert.strictEqual(stored(S,'panther'),15);
  N.grant(S,h,'arena:season',{league:4}); assert.strictEqual(stored(S,'panther'),45); N.grant(S,h,'arena:season',{league:3}); N.grant(S,h,'arena:season',{league:3}); assert.ok(pet(S,'panther'),'105 ≥ 100: nasceu'); }));
console.log(n+' testes ok');
