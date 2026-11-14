// node test/sys/crossroads-reload.test.js — Encruzilhada (achado do QA): recarregar o jogo ANTES de gravar não pode trocar as 2 bênçãos.
// Antes a semente nascia de Date.now()+Math.random(): save sem semente gravada mostrava outras bênçãos a cada abertura ("rolar de novo" fechando o app).
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
const {makeHost}=require('./_host.js');
const PH=require('../../js/sys/phases.js');
const CR=require('../../js/sys/crossroads.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const ids=a=>a.map(b=>b.id);
const realNow=Date.now, realRnd=Math.random;

t('save sem semente: abrir, fechar sem gravar e abrir de novo dá as MESMAS 2 bênçãos (relógio e sorteio diferentes)',()=>{
  CR.DATA.on=true; PH.DATA.on=false;
  try{
    const gravado=JSON.stringify({gold:10});   // o que estava no disco antes da vitória
    const S1=JSON.parse(gravado), h=makeHost(); const r1=CR.onStage(S1,h,5); assert.strictEqual(r1.due,true); assert.strictEqual(r1.offers.length,2);
    // "fecha o app" sem gravar e abre em outra hora, com outro Math.random
    Date.now=()=>realNow()+987654321; Math.random=()=>0.123;
    const S2=JSON.parse(gravado); const r2=CR.onStage(S2,makeHost(),5);
    assert.deepStrictEqual(ids(r2.offers),ids(r1.offers)); assert.deepStrictEqual(ids(CR.offers(S2,5)),ids(r1.offers));
    // e um terceiro save igual, chamando offers direto (a tela abrindo antes do onStage)
    Math.random=()=>0.987; const S3=JSON.parse(gravado); assert.deepStrictEqual(ids(CR.offers(S3,5)),ids(r1.offers));
  } finally { Date.now=realNow; Math.random=realRnd; CR.DATA.on=false; }
});

t('a mesma entrada dá sempre as mesmas 2 em todas as fases/eras; save gravado (com semente) segue igual depois de recarregar',()=>{
  CR.DATA.on=true; PH.DATA.on=true;
  try{
    for(const st of [10,20,50,90,110,250,890]){ const a=ids(CR.offers({},st)), b=ids(CR.offers(JSON.parse('{}'),st)); assert.deepStrictEqual(a,b,'fase '+st); assert.strictEqual(a.length,2); }
    const S={}; CR.onStage(S,makeHost(),10); const o1=ids(CR.offers(S,10)); const back=JSON.parse(JSON.stringify(S)); Math.random=()=>0.5;
    assert.deepStrictEqual(ids(CR.offers(back,10)),o1);
    // semente própria do save (saves antigos que já gravaram a deles) continua mandando
    const old={sys:{crossroads:{seed:12345}}}; const x=ids(CR.offers(old,20)); assert.deepStrictEqual(ids(CR.offers(JSON.parse(JSON.stringify(old)),20)),x);
    assert.strictEqual(old.sys.crossroads.seed,12345);
    // saves de contas diferentes (S.id) podem ter bênçãos diferentes, mas cada uma é fixa
    const A={id:'conta-a'}, B={id:'conta-b'}; assert.notStrictEqual(A&&CR.ensure(A).seed,CR.ensure(B).seed); assert.strictEqual(CR.ensure({id:'conta-a'}).seed,A.sys.crossroads.seed);
  } finally { Math.random=realRnd; CR.DATA.on=false; PH.DATA.on=false; }
});

console.log(`ok: ${n} testes`);
