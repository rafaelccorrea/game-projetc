// node test/sys/bonfire.test.js — Sys.bonfire (Fogueira das Eras, PROPOSTA, desligada): Brasas só jogando, raridade pelo nível dentro do portão,
// era do jogador, estágios, subir com XP + ouro, desmontar/rápido/cadeado/recuperar/mochila cheia, automático cedo que pausa em Épico+
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','loot','forge','bonfire'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const BF=Sys.bonfire;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=fn=>{ const k=BF.DATA.on; BF.DATA.on=true; try{ fn(); } finally{ BF.DATA.on=k; } };
function host(o){ const h=makeHost(Object.assign({level:60,eraMax:5,seed:7},o||{})); h.wallet=1e12; h.spendGold=c=>{ if(h.wallet<c) return false; h.wallet-=c; return true; };
  h.removeItem=it=>{ h.items=h.items.filter(x=>x!==it); }; h.eq={}; h.equipped=()=>h.eq; h.equip=it=>{ h.eq[it.slot]=it; }; h.fcOf=it=>(it.r+1)*100+(it.qp||0)/100;
  h.delta=it=>{ const c=h.eq[it.slot]; return h.fcOf(it)-(c?h.fcOf(c):0); }; h.bagMax=()=>30; return h; }

t('DESLIGADA por padrão: nada forja, Brasa não entra',()=>{ assert.strictEqual(BF.DATA.on,false); const S={}, h=host();
  assert.strictEqual(BF.forge(S,h).reason,'off'); assert.strictEqual(BF.addBrasas(S,'stage'),0); assert.strictEqual(BF.levelUp(S,h).reason,'off'); });
t('Brasas só jogando: pote de 20 abates = 1, fase +3, chefe +5, baú +5, missões +20, teto 300; fonte desconhecida (compra) não existe',()=>on(()=>{ const S={};
  assert.strictEqual(BF.addBrasas(S,'kill',19),0); assert.strictEqual(BF.addBrasas(S,'kill',1),1); assert.strictEqual(BF.addBrasas(S,'stage'),3); assert.strictEqual(BF.addBrasas(S,'boss'),5);
  assert.strictEqual(BF.addBrasas(S,'chest'),5); assert.strictEqual(BF.addBrasas(S,'missions'),20); for(const x of ['shop','vip','buy','ad','pack']) assert.strictEqual(BF.addBrasas(S,x,100),0,x);
  BF.addBrasas(S,'missions',100); assert.strictEqual(BF.ensure(S).bra,300);
  const o=BF.ensure(S); assert.strictEqual(o.got,300,'got = o que entrou'); o.bra=0; BF.addBrasas(S,'stage'); assert.strictEqual(o.got,303,'got só sobe'); }));
t('chances: nível 1 só Básico; Raro no 2, Épico no 8, Mítico no 20, Lendário no 35; portão corta o que passar; somam 100',()=>{
  assert.deepStrictEqual(BF.odds(1,4),[100,0,0,0,0]); assert.ok(BF.odds(2,4)[1]>0&&BF.odds(7,4)[2]===0&&BF.odds(8,4)[2]>0&&BF.odds(19,4)[3]===0&&BF.odds(20,4)[3]>0&&BF.odds(34,4)[4]===0&&BF.odds(35,4)[4]>0);
  for(const lv of [1,5,10,20,35,60]) for(const cap of [0,2,4]){ const o=BF.odds(lv,cap); assert.ok(Math.abs(o.reduce((a,b)=>a+b,0)-100)<0.05,lv+'/'+cap); o.forEach((p,r)=>{ if(r>cap) assert.strictEqual(p,0); }); }
  assert.ok(BF.weights(60)[0]>=14,'Básico nunca abaixo de 14'); });
t('estágios: 9, pelo nível (1, 5, 10, 16, 22, 29, 36, 44, 52), independentes da era',()=>{ const f=BF.DATA.stages.map(s=>s.from); assert.deepStrictEqual(f,[1,5,10,16,22,29,36,44,52]);
  assert.strictEqual(BF.stageOf(4),0); assert.strictEqual(BF.stageOf(5),1); assert.strictEqual(BF.stageOf(60),8); });
t('forjar: gasta 1 Brasa, dá 1 XP, o item é da ERA do jogador e respeita o portão; nível 1 = só Básico',()=>on(()=>{ const S={}, h=host({level:5,eraMax:3});
  BF.addBrasas(S,'missions',2); for(let i=0;i<40;i++){ const f=BF.forge(S,h); assert.ok(f.ok); assert.strictEqual(f.item.e,3,'era do jogador'); assert.strictEqual(f.item.r,0,'nível 1: Básico'); }
  assert.strictEqual(BF.ensure(S).bra,0); assert.strictEqual(BF.forge(S,h).reason,'brasas'); }));
t('nível alto com jogador fraco: a raridade não passa do portão do jogador',()=>on(()=>{ const S={}, h=host({level:12,eraMax:0}); BF.ensure(S).lv=60; BF.addBrasas(S,'missions',5);
  const cap=Sys.loot.maxAllowedR(h); for(let i=0;i<100;i++){ const f=BF.forge(S,h); assert.ok(f.item.r<=cap,'r'+f.item.r+' > portão '+cap); } }));
t('subir: só com a barra cheia, paga ouro; na faixa nova EVOLUI de estágio',()=>on(()=>{ const S={}, h=host(); const o=BF.ensure(S);
  assert.strictEqual(BF.levelUp(S,h).reason,'xp'); o.xp=BF.xpNeed(1); const w0=h.wallet, r=BF.levelUp(S,h); assert.ok(r.ok&&r.lv===2&&!r.evolved&&h.wallet<w0);
  o.lv=4; o.xp=BF.xpNeed(4); const r2=BF.levelUp(S,h); assert.ok(r2.ok&&r2.evolved&&r2.stage.id==='bronze');
  h.wallet=0; o.xp=BF.xpNeed(o.lv); assert.strictEqual(BF.levelUp(S,h).reason,'gold'); }));
t('desmontar: ouro, pedras (Épico+), 1 Brasa (Mítico+), XP; cadeado e equipado nunca',()=>on(()=>{ const S={}, h=host(); const a={id:1,slot:'boots',r:3,e:2,lvl:10,gold:1000}, b={id:2,slot:'hat',r:0,e:2,lvl:10,gold:100}, c={id:3,slot:'weapon',r:4,e:2,lvl:10,gold:5000};
  h.items=[a,b,c]; h.eq.weapon=c; BF.lock(S,b,true); const st0=Sys.forge.ensure(S).stones; const tot=BF.dismantle(S,h,[a,b,c]);
  assert.strictEqual(tot.n,1); assert.ok(h.items.includes(b)&&h.items.includes(c)&&!h.items.includes(a)); assert.strictEqual(tot.stones,2); assert.strictEqual(tot.bra,1); assert.ok(tot.gold>0&&h.gold===tot.gold);
  assert.strictEqual(Sys.forge.ensure(S).stones,st0+2); }));
t('desmontar rápido: abaixo da raridade e "pior que o equipado"; trancado fica',()=>on(()=>{ const S={}, h=host(); const mk=(id,slot,r,qp)=>({id,slot,r,e:2,lvl:5,gold:50,qp:qp||0});
  h.items=[mk(1,'boots',0),mk(2,'boots',1),mk(3,'hat',2),mk(4,'hat',0)]; BF.lock(S,h.items[3],true); BF.quick(S,h,{belowR:2}); assert.deepStrictEqual(h.items.map(x=>x.id).sort(),[3,4]);
  h.eq.hat={id:9,slot:'hat',r:3,e:2,qp:0}; h.items.push(mk(5,'hat',2)); BF.quick(S,h,{worse:true}); assert.deepStrictEqual(h.items.map(x=>x.id).sort(),[4]); }));
t('recuperar: os últimos 10 desmanches por 5 min; devolve o item e tira o que rendeu',()=>on(()=>{ const S={}, h=host(); const items=Array.from({length:12},(_,i)=>({id:i+1,slot:'boots',r:1,e:2,lvl:5,gold:100}));
  h.items=items.slice(); BF.dismantle(S,h,items); assert.strictEqual(BF.ensure(S).recent.length,10); const g=h.gold, w=h.wallet;
  const r=BF.recover(S,h,12); assert.ok(r.ok&&h.items.some(x=>x.id===12)&&h.wallet<w); h.t+=5*60*1000+1; assert.strictEqual(BF.recover(S,h,11).reason,'id','passou de 5 min'); }));
t('mochila cheia: desmonta a PIOR destrancada, nunca a trancada nem a equipada',()=>on(()=>{ const S={}, h=host(); h.items=Array.from({length:30},(_,i)=>({id:i+1,slot:'boots',r:i===0?0:2,e:2,lvl:5,gold:10,qp:i*100}));
  BF.lock(S,h.items[0],true); const out=BF.makeRoom(S,h); assert.ok(out&&out.item.id!==1&&h.items.length===29); }));
t('automático: abre no nível 3 (cedo), lote, equipa o melhor, desmonta abaixo do filtro, PAUSA em Épico+',()=>on(()=>{ const S={}, h=host({level:60,eraMax:6}); const o=BF.ensure(S); o.bra=50;
  assert.strictEqual(BF.autoRun(S,h).reason,'level'); o.lv=3; BF.setAuto(S,{batch:5,equip:true,sellBelow:1}); const r=BF.autoRun(S,h); assert.ok(r.ok&&r.done>=1&&r.done<=5&&r.pause===null,'nível 3: sem Épico');
  o.lv=60; let paused=false; for(let k=0;k<20&&!paused;k++){ const x=BF.autoRun(S,h); if(x.pause){ paused=true; assert.ok(x.pause.r>=2); } } assert.ok(paused,'pausou em Épico+'); }));
t('nada à venda: o módulo não tem preço em dinheiro, gema ou produto de loja',()=>{ const src=require('fs').readFileSync(require('path').join(__dirname,'../../js/sys/bonfire.js'),'utf8');
  assert.ok(!/gems\s*:|productId|brl|price|preço\s*:/i.test(src.replace(/\/\*[\s\S]*?\*\//g,'')),'sem preço em dinheiro/gema'); });
t('lote por nível (contrato): 1-3=1, 4-6=2, 7-9=4, 10-19=5, 20-34=6, 35-49=8, 50-60=10; toque gasta 1 Brasa por peça e devolve a lista; com menos Brasas forja o que tiver',()=>on(()=>{
  assert.deepStrictEqual([1,3,4,6,7,9,10,19,20,34,35,49,50,60].map(BF.perTap),[1,1,2,2,4,4,5,5,6,6,8,8,10,10]);
  const S={}, h=host({level:60,eraMax:3}), o=BF.ensure(S); o.lv=10; o.bra=12;
  const a=BF.tap(S,h); assert.ok(a.ok&&a.n===5&&a.items.length===5&&a.perTap===5&&a.stars.length===5); assert.strictEqual(o.bra,7); a.items.forEach(it=>assert.strictEqual(it.e,3));
  BF.tap(S,h); const c=BF.tap(S,h); assert.strictEqual(c.n,2,'sobraram 2 Brasas'); assert.strictEqual(o.bra,0); assert.strictEqual(BF.tap(S,h).reason,'brasas'); }));
t('desligada: toque não forja',()=>{ const r=BF.tap({},host()); assert.ok(!r.ok&&r.reason==='off'&&r.items.length===0); });
t('estoque à vista: view tem stock, max, pot, perTap, nextTap e o que o próximo nível abre',()=>on(()=>{ const S={}, h=host(), o=BF.ensure(S); o.bra=42; o.pot=7;
  let v=BF.view(S,h); assert.ok(v.stock===42&&v.max===300&&v.pot===7&&v.potKills===20&&v.perTap===1); assert.deepStrictEqual(v.nextTap,{lv:4,n:2});
  assert.ok(v.unlock.lv===2&&v.unlock.rarity===1&&v.unlock.perTap===null);
  o.lv=3; v=BF.view(S,h); assert.ok(v.unlock.perTap===2&&v.unlock.stage===null); o.lv=4; v=BF.view(S,h); assert.ok(v.unlock.perTap===null&&v.unlock.stage.id==='bronze'); o.lv=2; assert.strictEqual(BF.view(S,h).unlock.auto,true);
  o.lv=7; assert.strictEqual(BF.view(S,h).unlock.rarity,2,'Épico no 8'); assert.deepStrictEqual(BF.view(S,h).nextTap,{lv:10,n:5}); o.lv=60; v=BF.view(S,h); assert.ok(v.unlock===null&&v.nextTap===null&&v.perTap===10); }));
t('só abate NOVO enche o pote: fase abaixo da maior já alcançada não conta; got conta',()=>on(()=>{ const S={}, o=BF.ensure(S);
  assert.strictEqual(BF.addBrasas(S,'kill',20,{stage:10,maxStage:10}),1); assert.strictEqual(o.best,10);
  assert.strictEqual(BF.addBrasas(S,'kill',40,{stage:9,maxStage:10}),0,'fase velha'); assert.strictEqual(o.pot,0);
  assert.strictEqual(BF.addBrasas(S,'kill',40,{stage:9}),0,'best guardado basta'); assert.strictEqual(BF.addBrasas(S,'kill',10,{stage:5,maxStage:3}),0,'best 10 vence o maxStage menor');
  assert.strictEqual(BF.addBrasas(S,'kill',20,{stage:11,maxStage:11}),1); assert.strictEqual(o.best,11); assert.strictEqual(o.got,2);
  assert.ok(BF.killCounts(S,11,11)&&!BF.killCounts(S,10,11)); }));
t('offline: 1 Brasa a cada 18 min, teto de 12 h e 40 por dia, menos de 5 min não conta; resto dos segundos fica; got conta; resumo para o painel',()=>on(()=>{
  const S={}, h=host(), o=BF.ensure(S);
  let r=BF.offline(S,h,4*60); assert.strictEqual(r.brasas,0);
  r=BF.offline(S,h,60*60); assert.strictEqual(r.brasas,3); assert.strictEqual(o.off.acc,6*60); assert.strictEqual(o.got,3);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(o.off.day)&&o.off.n===3,'off = {day Brasília, n}'); for(const k of ['gold','xp','items','stones']) assert.ok(k in r&&r[k]===null,k+' é do engenheiro');
  r=BF.offline(S,h,48*3600); assert.ok(r.capped&&r.counted===12*3600); assert.strictEqual(r.brasas,37,'teto do dia: 40 - 3'); assert.strictEqual(r.dayLeft,0);
  assert.strictEqual(BF.offline(S,h,3600).brasas,0,'dia cheio');
  h.t+=24*3600*1000; r=BF.offline(S,h,12*3600); assert.strictEqual(r.brasas,40,'dia novo; 12 h = 40'); assert.strictEqual(o.got,80);
  o.bra=299; h.t+=24*3600*1000; r=BF.offline(S,h,3600); assert.ok(r.brasas===1&&r.full,'estoque cheio'); }));
t('offline desligado: nada entra, resumo vazio',()=>{ const S={}; const r=BF.offline(S,host(),3600); assert.ok(!r.on&&r.brasas===0); });
t('fonte thief (Ladrão de Brasas): entra pela quantia e conta no got',()=>on(()=>{ const S={}; assert.strictEqual(BF.addBrasas(S,'thief',12),12); assert.strictEqual(BF.ensure(S).got,12); }));
console.log(n+' testes ok');
