// node test/sys/guide.test.js — rastreador de missão guia (Sys.guide, atrás de chave)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js'), G=require('../../js/sys/guide.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

t('desligado (padrão): current null, eventos e resgate não fazem nada',()=>{
  assert.strictEqual(G.DATA.on,false); const S={}; assert.strictEqual(G.current(S),null); G.onEvent(S,'kill',50); assert.strictEqual(G.claim(S,makeHost()).reason,'desligado');
  G.DATA.on=true;
});

t('fila em ordem, uma por vez: progresso, resgate entrega o prêmio e avança',()=>{
  const S={}, h=makeHost({unit:10}); let c=G.current(S);
  assert.deepStrictEqual([c.id,c.cur,c.max,c.goto,c.done],['g_kill10',0,10,'battle',false]);
  G.onEvent(S,'boss',1); assert.strictEqual(G.current(S).cur,0,'evento de outra missão não conta');
  G.onEvent(S,'kill',4); G.onEvent(S,'kill',8); c=G.current(S); assert.strictEqual(c.cur,10); assert.ok(c.done);
  const r=G.claim(S,h); assert.ok(r.ok); assert.strictEqual(h.gold,200,'20 × ouro de um abate'); assert.strictEqual(r.next.id,'g_boss1');
  assert.strictEqual(G.current(S).cur,0,'a próxima começa do zero'); assert.strictEqual(G.claim(S,h).reason,'incompleta');
});

t('missões de nível/era usam o maior valor visto (mesmo antes de chegar nelas)',()=>{
  const S={}, h=makeHost(); G.onEvent(S,'level',7); G.onEvent(S,'era',1);
  for(const [ev,v] of [['kill',10],['boss',1],['equip',1],['upgrade',3],['summon',1],['chest',1]]){ G.onEvent(S,ev,v); assert.ok(G.claim(S,h).ok,ev); }
  let c=G.current(S); assert.strictEqual(c.id,'g_lv5'); assert.ok(c.done,'nível 7 já cumpre "nível 5"'); G.claim(S,h);
  c=G.current(S); assert.strictEqual(c.id,'g_era1'); assert.ok(c.done); G.onEvent(S,'level',3); assert.strictEqual(S.sys.guide.seen.level,7,'nunca diminui');
});

t('missões sem tela ficam FORA da fila (forja, instâncias, pets, torre) e voltam quando a tela entra',()=>{
  const ids=G.list({}).filter(x=>!x.available).map(x=>x.id); assert.deepStrictEqual(ids,['g_forge1','g_inst','g_egg','g_tower']);
  const S={}, h=makeHost(); G.onEvent(S,'level',99); G.onEvent(S,'era',9);
  const seq=[]; for(let i=0;i<40;i++){ const c=G.current(S); if(!c) break; seq.push(c.id); const s=G.DATA.steps.find(x=>x.id===c.id); if(!c.done) G.onEvent(S,s.ev,s.need); assert.ok(G.claim(S,h).ok,c.id); }
  assert.ok(!seq.some(id=>['g_forge1','g_inst','g_egg','g_tower'].includes(id))); assert.strictEqual(G.current(S),null,'fila terminada');
  G.DATA.screens.instances=true; assert.strictEqual(G.current(S).id,'g_inst','tela nova: a missão dela entra'); G.DATA.screens.instances=false;
});

t('o prêmio passa pelo grantBundle (portão, Essência)',()=>{
  const S={}, h=makeHost(); G.onEvent(S,'level',99); G.onEvent(S,'era',1);
  for(const [ev,v] of [['kill',10],['boss',1],['equip',1],['upgrade',3],['summon',1],['chest',1]]){ G.onEvent(S,ev,v); G.claim(S,h); }
  G.claim(S,h); const r=G.claim(S,h); assert.strictEqual(r.got.gems,15); assert.strictEqual(L.essence(S),1);
});

t('save antigo e lixo: ids que não existem saem; missões inseridas depois não estragam o save',()=>{
  const S={sys:{guide:{done:['g_kill10','xx'],cur:5,p:'a',seen:{level:'z'}}}}; G.ensure(S);
  assert.deepStrictEqual(S.sys.guide.done,['g_kill10']); assert.strictEqual(S.sys.guide.p,0); assert.strictEqual(S.sys.guide.seen.level,0);
  assert.strictEqual(G.current(S).id,'g_boss1'); assert.throws(()=>G.ensure(null));
  const ids=G.DATA.steps.map(s=>s.id); assert.strictEqual(new Set(ids).size,ids.length,'ids únicos');
  assert.ok(G.DATA.steps.every(s=>s.text.length<=48),'textos curtos para caber sob a barra de fase');
  G.DATA.on=false;
});
console.log(`\nguide: ${n} testes ok`);
