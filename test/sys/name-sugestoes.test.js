// node test/sys/name-sugestoes.test.js — o filtro de nome NUNCA recusa os nomes que o próprio jogo sugere (js/p_intro.js PRE × SUF, com e sem número),
// nem para menor nem no modo estrito (QA no S24 14/11: "MarteloRubro" e "MarteloDeFerro" eram recusados)
'use strict';
const assert=require('assert');
const fs=require('fs'), path=require('path');
const N=require('../../js/sys/name.js');
const src=fs.readFileSync(path.join(__dirname,'../../js/p_intro.js'),'utf8');
const list=k=>{ const i=src.indexOf('var '+k+' = ['); assert.ok(i>=0,'achei a lista '+k+' no p_intro.js'); const j=src.indexOf(']',i);
  return src.slice(src.indexOf('[',i)+1,j).split(',').map(s=>s.trim().replace(/^\\?'|\\?'$/g,'')).filter(Boolean); };
const PRE=list('PRE'), SUF=list('SUF'); assert.ok(PRE.length>=5&&SUF.length>=5,'listas: '+PRE+' / '+SUF);
const bad=[];
for(const a of PRE) for(const b of SUF) for(const tail of ['','7','42']){ const nm=(a+b+tail).slice(0,14);
  for(const o of [{minor:true},{minor:true,strict:true},{}]){ const r=N.check(nm,o); if(!r.ok) bad.push(nm+' '+JSON.stringify(o)+' -> '+r.msg); } }
assert.deepStrictEqual(bad,[],'sugestões recusadas:\n'+bad.join('\n'));
console.log('ok - '+PRE.length*SUF.length*3+' sugestões aceitas (menor, estrito e adulto)');
