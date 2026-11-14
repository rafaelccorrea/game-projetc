// node test/sys/fc-exibida.test.js — "melhor" e "+FC" pela FC EXIBIDA (dono 14/11, via PO: item "melhor" com +0 de FC).
// Sys.fc.delta: diferença que a tela não mostra vira 0 (sem texto, sinal 'same'); rawDiff guarda a conta. itemFC.swap idem; better = a FC exibida sobe.
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','fc'].forEach(m=>require('../../js/sys/'+m+'.js'));
const F=Sys.fc;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const k=F.view(1e6)/1e6, tiny=0.2/k;   // muda menos de meio ponto na FC exibida
t('delta: mudança invisível na tela = 0, sem "+0"',()=>{ const d=F.delta(1000,1000+tiny);
  assert.strictEqual(F.view(1000),F.view(1000+tiny)); assert.strictEqual(d.diff,0); assert.strictEqual(d.text,''); assert.strictEqual(d.sign,'same'); assert.ok(d.rawDiff>0); });
t('delta: mudança visível continua igual (texto, sinal, cor)',()=>{ const d=F.delta(1000,1500); assert.ok(d.diff>0); assert.strictEqual(d.diff,d.rawDiff); assert.strictEqual(d.sign,'up'); assert.ok(d.text.startsWith('+'));
  const e=F.delta(1500,1000); assert.strictEqual(e.sign,'down'); assert.ok(e.text.startsWith('−')); });
t('delta: o texto nunca é "+0" nem "−0" em 2.000 casos',()=>{ for(let i=0;i<2000;i++){ const a=Math.random()*1e6, b=a+(Math.random()-0.5)*4/k; const d=F.delta(a,b);
  assert.ok(!/^[+−]0$/.test(d.text),a+' → '+b+' = '+d.text); assert.strictEqual(d.diff===0,F.view(a)===F.view(b)); } });
console.log(n+' testes ok');
