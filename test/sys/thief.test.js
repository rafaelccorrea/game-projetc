// node test/sys/thief.test.js — Sys.thief (Ladrão de Brasas, desligado): 2 entradas grátis por dia (Brasília), 1 lote por entrada pelo nível da
// Fogueira, fim por score, Repetir (sweep) do melhor nível vencido, Brasas pelo Sys.bonfire.addBrasas('thief') contando no got, nada à venda
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','loot','forge','bonfire','thief'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const BF=Sys.bonfire, TH=Sys.thief;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=fn=>{ const a=BF.DATA.on, b=TH.DATA.on; BF.DATA.on=true; TH.DATA.on=true; try{ fn(); } finally{ BF.DATA.on=a; TH.DATA.on=b; } };
const host=()=>makeHost({now:Date.UTC(2026,10,13,15,0,0)});   // 12:00 em Brasília
const DAY=86400000;

t('DESLIGADO por padrão: não entra, não varre',()=>{ assert.strictEqual(TH.DATA.on,false); const S={}, h=host();
  assert.strictEqual(TH.enter(S,h).reason,'off'); assert.strictEqual(TH.sweep(S,h).reason,'off'); assert.strictEqual(TH.finish(S,h,{score:1}).reason,'off'); assert.strictEqual(TH.view(S,h).canEnter,false); });
t('lote pelo nível da Fogueira (contrato): 1-3=1, 4-6=2, 7-9=4, 10-19=5, 20-34=6, 35-49=8, 50-60=10',()=>{
  assert.deepStrictEqual([1,3,4,6,7,9,10,19,20,34,35,49,50,60].map(TH.loteOf),[1,1,2,2,4,4,5,5,6,6,8,8,10,10]); });
t('entrar e terminar: score 1 = lote cheio e nível vencido; Brasas entram pela Fogueira e contam no got',()=>on(()=>{ const S={}, h=host(); BF.ensure(S).lv=12;
  const e=TH.enter(S,h); assert.ok(e.ok&&e.lv===12&&e.lote===5&&e.secs===45); assert.strictEqual(TH.enter(S,h).reason,'run','uma de cada vez');
  const r=TH.finish(S,h,{score:1}); assert.ok(r.ok&&r.won&&r.drop===5&&r.brasas===5&&r.best===12&&r.left===1);
  assert.strictEqual(BF.ensure(S).bra,5); assert.strictEqual(BF.ensure(S).got,5); assert.strictEqual(TH.finish(S,h,{score:1}).reason,'run','fim sem entrar não vale'); }));
t('score parcial: arredonda a fração do lote, não vence o nível',()=>on(()=>{ const S={}, h=host(); BF.ensure(S).lv=50;
  TH.enter(S,h); const r=TH.finish(S,h,{score:0.34}); assert.ok(r.drop===3&&!r.won&&r.best===0); TH.enter(S,h); assert.strictEqual(TH.finish(S,h,{score:7}).drop,10,'score acima de 1 vira 1'); }));
t('2 entradas por dia; virada do dia de Brasília (03:00 UTC) devolve as entradas',()=>on(()=>{ const S={}, h=host();
  for(let i=0;i<2;i++){ TH.enter(S,h); TH.finish(S,h,{score:0}); } assert.strictEqual(TH.enter(S,h).reason,'entries'); assert.strictEqual(TH.view(S,h).left,0);
  h.t=Date.UTC(2026,10,14,2,59,0); assert.strictEqual(TH.view(S,h).left,0,'23:59 em Brasília ainda é o mesmo dia');
  h.t=Date.UTC(2026,10,14,3,0,0); assert.strictEqual(TH.view(S,h).left,2,'00:00 em Brasília'); assert.strictEqual(TH.ensure(S).day,'2026-11-14'); }));
t('Repetir: lote cheio do melhor nível vencido, na hora, gasta 1 entrada; sem vitória não varre',()=>on(()=>{ const S={}, h=host(); BF.ensure(S).lv=8;
  assert.strictEqual(TH.sweep(S,h).reason,'none'); TH.enter(S,h); TH.finish(S,h,{score:1});
  BF.ensure(S).lv=40; const v=TH.view(S,h); assert.ok(v.canSweep&&v.sweepLote===4&&v.lote===8);
  const s=TH.sweep(S,h); assert.ok(s.ok&&s.lv===8&&s.drop===4&&s.brasas===4&&s.left===0); assert.strictEqual(TH.sweep(S,h).reason,'entries');
  assert.strictEqual(BF.ensure(S).got,8); h.t+=DAY; assert.strictEqual(TH.sweep(S,h).drop,4,'dia novo'); }));
t('regra única com o servidor: a entrada é gasta AO ENTRAR; sair no meio não devolve; result {won} compatível',()=>on(()=>{ const S={}, h=host(); TH.enter(S,h); assert.strictEqual(TH.view(S,h).left,1,'gastou ao entrar'); assert.strictEqual(TH.cancel(S,h),true); assert.strictEqual(TH.view(S,h).left,1,'sair não devolve');
  TH.enter(S,h); assert.ok(TH.result(S,h,{won:true}).won); }));
t('VIDA DO SACO no enter: run.bagHp = dps de referência × secs × frac(Fogueira); frac 0,55 no Nv 1 e 0,90 no Nv 60, sobe com o nível',()=>on(()=>{
  const B=TH.DATA.bag; assert.strictEqual(TH.bagFrac(1),B.fracMin); assert.strictEqual(TH.bagFrac(60),B.fracMax); assert.ok(B.fracMin===0.55&&B.fracMax===0.9);
  for(let lv=2;lv<=60;lv++) assert.ok(TH.bagFrac(lv)>TH.bagFrac(lv-1),'sobe no Nv '+lv);
  const h=host(), ref=100*(1+0.12*1)*(1/0.8+3/6+10/20)*B.pace;   // host de teste: ATQ 100, sem Sys.fc: crítico de base 12% × +100%
  assert.ok(Math.abs(TH.refDps({},h)-ref)<1e-9,String(TH.refDps({},h)));
  const bags=[1,10,30,60].map(lv=>{ const S={}; BF.ensure(S).lv=lv; const e=TH.enter(S,h); assert.ok(e.ok); assert.strictEqual(e.bagHp,Math.round(ref*45*TH.bagFrac(lv))); assert.strictEqual(TH.view(S,h).run.bagHp,e.bagHp); return e.bagHp; });
  for(let i=1;i<bags.length;i++) assert.ok(bags[i]>bags[i-1],JSON.stringify(bags));
  const S={}; BF.ensure(S).lv=20; const h2=host(); h2.heroDps=()=>500; assert.strictEqual(TH.enter(S,h2).bagHp,Math.round(500*45*TH.bagFrac(20)),'host.heroDps manda quando existe'); }));
t('o saco fica FIXO depois do enter: herói mais forte, Fogueira subindo e recarga do save não mudam bagHp nem a fuga',()=>on(()=>{ const S={}, h=host(); BF.ensure(S).lv=15;
  const e=TH.enter(S,h); h.atk=()=>5000; BF.ensure(S).lv=40; const v=TH.view(S,h).run; assert.strictEqual(v.bagHp,e.bagHp); assert.deepStrictEqual(v.escapes,e.escapes);
  const S2=JSON.parse(JSON.stringify(S)); const v2=TH.view(S2,h).run; assert.strictEqual(v2.bagHp,e.bagHp); assert.strictEqual(v2.seed,e.seed); assert.deepStrictEqual(v2.escapes,e.escapes); assert.strictEqual(v2.rid,e.rid);
  const r=TH.finish(S2,h,{score:1}); assert.ok(r.ok&&r.lv===15,'fim usa o nível da entrada'); }));
t('FUGA na corrida: escapeAt 7, escapeEvery 8, escapeDur 1,4; inícios com desvio de até ±0,5 s pela seed (local: do rid), sempre iguais para a mesma seed',()=>on(()=>{
  const S={}, h=host(); const e=TH.enter(S,h); assert.ok(e.escapeAt===7&&e.escapeEvery===8&&e.escapeDur===1.4&&e.jitter===0.5&&e.secs===45,JSON.stringify(e));
  assert.ok(typeof e.rid==='string'&&e.rid&&Number.isInteger(e.seed)); assert.strictEqual(e.escapes.length,5);
  e.escapes.forEach((x,i)=>assert.ok(Math.abs(x-(7+8*i))<=0.5+1e-9&&x<45,JSON.stringify(e.escapes)));
  assert.deepStrictEqual(TH.escapesOf(e.seed,45),e.escapes); assert.deepStrictEqual(TH.escapesOf(12345,45),TH.escapesOf(12345,45));
  assert.notDeepStrictEqual(TH.escapesOf(1,45),TH.escapesOf(2,45),'seeds diferentes, fugas diferentes');
  TH.cancel(S,h); h.t+=60000; const e2=TH.enter(S,h); assert.notStrictEqual(e2.rid,e.rid,'cada corrida local tem o seu id'); }));
t('nada à venda: sem preço, gema, produto, anúncio ou sorteio',()=>{ const src=require('fs').readFileSync(require('path').join(__dirname,'../../js/sys/thief.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/.*$/gm,'');
  assert.ok(!/gems|productId|brl|price|preço|addGems|rng|Math\.random|\bads?\b/i.test(src)); });
console.log(n+' testes ok');
