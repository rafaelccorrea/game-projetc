// node test/sys/mountcharge.test.js — Carga montada (Sys.mount.chargeOf; Sistemas 14/11): chave, modos (só fases e instâncias), trancada antes do Nv 38,
// sem montaria = nada, multiplicador por estrela e raridade, no chefe metade. Não entra na FC.
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','fc','mount'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const M=Sys.mount;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ const a=M.DATA.on, b=M.DATA.charge.on; M.DATA.on=true; M.DATA.charge.on=true; try{ fn(); } finally{ M.DATA.on=a; M.DATA.charge.on=b; } };
const mk=(lv,id,stars)=>{ const S={}; Sys.level.ensure(S).lvl=lv; const o=M.ensure(S); if(id){ o.owned[id]={lvl:1,stars:stars||1}; o.eq=id; } return S; };
t('desligada: null (as duas chaves)',()=>{ assert.strictEqual(M.chargeOf(mk(60,'wolf',3),'fases'),null);
  const a=M.DATA.on; M.DATA.on=true; try{ assert.strictEqual(M.chargeOf(mk(60,'wolf',3),'fases'),null); } finally{ M.DATA.on=a; } });
t('ligada: só fases e instâncias; Arena, Torneio, Torre, Provação e Dupla = null',()=>withOn(()=>{ const S=mk(60,'wolf',3);
  for(const m of ['fases','instancias']) assert.ok(M.chargeOf(S,m),m); for(const m of ['arena','torneio','torre','provacao','dupla','xyz']) assert.strictEqual(M.chargeOf(S,m),null,m);
  const c=M.chargeOf(S,'fases'); assert.strictEqual(c.name,'Carga montada'); assert.strictEqual(c.every,12); assert.strictEqual(c.mult,1.2); assert.strictEqual(c.bossMult,0.6); }));
t('sem montaria equipada ou antes do Nv 38: null',()=>withOn(()=>{ assert.strictEqual(M.chargeOf(mk(60),'fases'),null); assert.strictEqual(M.chargeOf(mk(37,'wolf',3),'fases'),null); }));
t('multiplicador sobe com estrela e raridade: 0,8× a 1,68×',()=>{ const all=M.DATA.mounts.map(m=>[M.chargeMult(m.id,1),M.chargeMult(m.id,5)]);
  for(const [a,b] of all) assert.ok(b>a); assert.strictEqual(Math.min(...all.map(x=>x[0])),0.8); assert.strictEqual(Math.max(...all.map(x=>x[1])),1.68); });
t('a chave da Carga não muda a FC (montaria ligada nos dois casos)',()=>withOn(()=>{ const S=mk(60,'wolf',3), h=makeHost(); M.DATA.charge.on=false; const a=Sys.fc.compute(S,h); M.DATA.charge.on=true; assert.strictEqual(Sys.fc.compute(S,h),a); }));
console.log(n+' testes ok');
