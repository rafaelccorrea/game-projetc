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
  BF.addBrasas(S,'missions',100); assert.strictEqual(BF.ensure(S).bra,300); }));
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
console.log(n+' testes ok');
