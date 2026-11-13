// node test/sys/auction.test.js — leilão (Sys.auction): chave desligada, regras puras, travas do item, portões, provider offline/online
'use strict';
const assert=require('assert');
const A=require('../../js/sys/auction.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const H=3600000;
const host=o=>{ const h=makeHost(Object.assign({level:50,eraMax:3},o||{})); h.age=()=>h._age; h._age=(o&&o.age!=null)?o.age:30;
  h.canSpendGold=x=>h.gold>=x; h.gold=1e9; return h; };
const item=o=>Object.assign({id:'i1',slot:'boots',r:2,e:1,lvl:12,gold:1000,qp:2500,origin:'drop',gotAt:0},o||{});

t('CHAVE desligada por padrão: nada abre, nada muda no save',()=>{
  assert.strictEqual(A.DATA.on,false); const S={}, h=host();
  assert.deepStrictEqual(A.status(S,h),{on:false,open:false,reason:'off'});
  assert.strictEqual(A.canList(S,h,item(),5000,24).reason,'off'); assert.strictEqual(A.list(S,h,item(),5000,24).reason,'off');
  assert.strictEqual(A.canBuy(S,h,{id:'x',item:item(),price:10}).reason,'off'); assert.strictEqual(A.buy(S,h,{id:'x',item:item(),price:10}).reason,'off');
  assert.strictEqual(A.cancel(S,h,'x').reason,'off'); assert.strictEqual(A.search(S,h,{}).on,false);
  assert.deepStrictEqual(S,{},'desligado não escreve no save');
});

t('regras puras: taxa de anúncio, taxa de venda, resumo, faixa de preço, durações',()=>{
  assert.strictEqual(A.feeOf(10000,12),100); assert.strictEqual(A.feeOf(10000,24),200); assert.strictEqual(A.feeOf(10000,48),300);
  assert.strictEqual(A.feeOf(100,24),10,'mínimo 10'); assert.strictEqual(A.feeOf(10000,7),200,'duração inválida conta como 24 h');
  assert.strictEqual(A.taxOf(10000),1000);
  assert.deepStrictEqual(A.summary(10000,24,{gold:1001}),{buyerPays:10000,fee:200,tax:1000,net:9000,goldBack:500});
  assert.ok(A.validHours(12)&&A.validHours(24)&&A.validHours(48)&&!A.validHours(6));
  const a=A.priceRange(item()), b=A.priceRange(item({lvl:90,gold:9e9}));
  assert.deepStrictEqual(a,b,'nível e ouro investido não mexem no valor (zeram na venda)');
  assert.ok(a.min>=100&&a.max===Math.round(a.ref*5)&&a.min===Math.max(100,Math.round(a.ref*0.5)));
  assert.ok(A.priceRange(item({r:4})).ref>a.ref,'raridade maior vale mais'); assert.ok(A.priceRange(item({e:3})).ref>a.ref,'era maior vale mais');
  assert.ok(A.priceRange({slot:'hat',r:0,e:0}).min>=100,'piso de 100');
});

t('itemTradable e received: comprados, pets, skins etc. nunca; chega no Nv 1 com ouro 0',()=>{
  assert.ok(A.itemTradable(item()).ok);
  for(const x of [{offer:true},{bought:true},{origin:'shop_gem'},{origin:'offer'},{origin:'pass_premium'}]) assert.strictEqual(A.itemTradable(item(x)).reason,'bought');
  for(const k of ['pet','skin','vip','mount','frag','material','currency']) assert.strictEqual(A.itemTradable(item({kind:k})).reason,'kind');
  assert.strictEqual(A.itemTradable({kind:'pet'}).reason,'kind'); assert.strictEqual(A.itemTradable(null).reason,'kind'); assert.strictEqual(A.itemTradable(item({slot:'mount'})).reason,'kind');
  const src=item(), r=A.received(src); assert.strictEqual(r.lvl,1); assert.strictEqual(r.gold,0); assert.strictEqual(r.origin,'auction');
  assert.strictEqual(r.r,2); assert.strictEqual(r.qp,2500); assert.strictEqual(src.lvl,12,'não muda o original');
});

t('ligado + offline: status fechado, busca vazia com texto, anunciar/comprar = server; validações locais funcionam',()=>{
  A.DATA.on=true; A.setProvider(null); const S={}, h=host();
  const st=A.status(S,h); assert.strictEqual(st.open,false); assert.strictEqual(st.reason,'server'); assert.strictEqual(st.text,'O leilão abre com o online');
  const s=A.search(S,h,{slot:'boots'}); assert.deepStrictEqual([s.online,s.list.length,s.text],[false,0,'O leilão abre com o online']);
  assert.strictEqual(A.canList(S,h,item(),5000,24).reason,'server'); assert.strictEqual(A.list(S,h,item(),5000,24).reason,'server');
  assert.strictEqual(A.canBuy(S,h,{id:'x',item:item(),price:10}).reason,'server');
  const low=host({level:10}); assert.strictEqual(A.status({},low).reason,'level'); assert.strictEqual(A.status({},low).needLevel,45);
  const sl=A.sellable(S,h,[item(),item({id:'i2',offer:true}),item({id:'i3',gotAt:h.t-H}),item({id:'i4'})],{boots:'i4'});
  assert.deepStrictEqual(sl.map(x=>x.reason),['','bought','item_age','equipped']); assert.ok(sl[0].range.min>0); assert.ok(sl[1].text);
  assert.ok(A.rulesText().some(x=>/10% do preço/.test(x))&&A.rulesText().some(x=>/18 anos/.test(x)));
});

function online(){ const calls=[]; let id=0;
  A.setProvider({online:true,status:()=>({open:true}),
    search:q=>{ calls.push(['search',q]); return {ok:true,list:[{id:'s1',item:item({lvl:40,gold:5000}),price:5000,hours:24,endsAt:Date.now()+H,seller:'Fulano',sellerId:7}],total:1}; },
    list:p=>{ calls.push(['list',p]); return {ok:true,id:'L'+(++id)}; }, buy:p=>{ calls.push(['buy',p]); return {ok:true}; }, cancel:p=>{ calls.push(['cancel',p]); return {ok:true}; }});
  return calls; }

t('online: anunciar com travas (18+, idade do item, duração, faixa, limites, ouro para a taxa)',()=>{
  const calls=online(), S={}, h=host(), it=item(), R=A.priceRange(it), p=R.min*2;
  assert.strictEqual(A.status(S,h).open,true);
  h._age=17; assert.strictEqual(A.canList(S,h,it,p,24).reason,'adult'); h._age=null; assert.strictEqual(A.canList(S,h,it,p,24).reason,'adult','sem idade = não');
  assert.ok(A.canList(S,h,it,p,24,{age:18}).ok,'idade por argumento'); h._age=30;
  assert.strictEqual(A.canList(S,h,item({gotAt:h.t-23*H}),p,24).reason,'item_age'); assert.ok(A.canList(S,h,item({gotAt:h.t-25*H}),p,24).ok);
  assert.strictEqual(A.canList(S,h,it,p,6).reason,'hours'); assert.strictEqual(A.canList(S,h,it,R.min-1,24).reason,'price_low'); assert.strictEqual(A.canList(S,h,it,R.max+1,24).reason,'price_high');
  assert.strictEqual(A.canList(S,h,it,p,24,{equipped:true}).reason,'equipped'); assert.strictEqual(A.canList(S,h,item({bought:true}),p,24).reason,'bought');
  const c=A.canList(S,h,it,p,48); assert.ok(c.ok); assert.strictEqual(c.fee,A.feeOf(p,48)); assert.strictEqual(c.net,p-A.taxOf(p)); assert.strictEqual(c.goldBack,500);
  h.gold=c.fee-1; assert.strictEqual(A.canList(S,h,it,p,48).reason,'money'); h.gold=1e9;
  const r=A.list(S,h,it,p,48); assert.ok(r.ok); assert.strictEqual(r.endsAt,h.t+48*H); assert.strictEqual(calls[0][0],'list');
  assert.strictEqual(A.canList(S,h,it,p,24).reason,'in_auction'); assert.strictEqual(A.myListings(S,h)[0].msLeft,48*H);
  for(let i=2;i<=5;i++) assert.ok(A.list(S,h,item({id:'i'+i}),p,24).ok);
  assert.strictEqual(A.canList(S,h,item({id:'i9'}),p,24).reason,'day_limit');
  h.t+=24*H; assert.ok(A.canList(S,h,item({id:'i9'}),p,24).ok,'zera no dia seguinte');
  assert.ok(A.cancel(S,h,'L1').ok); assert.strictEqual(A.myListings(S,h).find(x=>x.id==='L1').state,'cancelled'); assert.strictEqual(A.cancel(S,h,'L1').reason,'listing');
});

t('online: busca anônima, compra com limites, portões do comprador (guardado/adormecido) e histórico',()=>{
  online(); const S={}, h=host({eraMax:1});
  const s=A.search(S,h,{slot:'boots'}); assert.strictEqual(s.list.length,1); const L=s.list[0];
  assert.ok(!('seller' in L)&&!('sellerId' in L),'anônimo'); assert.strictEqual(L.item.lvl,1);
  const b=A.canBuy(S,h,L); assert.ok(b.ok); assert.strictEqual(b.dormant,false);
  assert.strictEqual(A.canBuy(S,h,Object.assign({},L,{mine:true})).reason,'mine');
  assert.strictEqual(A.canBuy(S,h,Object.assign({},L,{endsAt:h.t-1})).reason,'ended');
  h.gold=10; assert.strictEqual(A.canBuy(S,h,L).reason,'money'); h.gold=1e9;
  assert.strictEqual(A.canBuy(S,h,Object.assign({},L,{item:item({e:3})})).dormant,true,'era futura chega adormecido');
  globalThis.Sys.loot={maxAllowedR:()=>1}; assert.strictEqual(A.canBuy(S,h,L).held,true,'acima da raridade chega guardado'); delete globalThis.Sys.loot;
  const r=A.buy(S,h,L); assert.ok(r.ok); assert.strictEqual(r.item.lvl,1); assert.strictEqual(r.item.gold,0); assert.strictEqual(r.item.origin,'auction');
  assert.strictEqual(A.history(S)[0].k,'buy'); assert.strictEqual(A.history(S)[0].price,5000);
  for(let i=0;i<9;i++) assert.ok(A.buy(S,h,L).ok); assert.strictEqual(A.canBuy(S,h,L).reason,'day_limit');
  h._age=16; assert.strictEqual(A.canBuy(S,h,L).reason,'adult');
});

t('ensure/applyServer: migra save velho ou quebrado e saneia o que vem do servidor',()=>{
  const S={sys:{auction:{mine:'x',log:[null,{k:'hack'}],day:5}}}; const o=A.ensure(S);
  assert.deepStrictEqual([o.v,o.mine,o.log,o.day.listed],[1,[],[],0]);
  assert.ok(A.applyServer(S,{mine:[{id:3,item:item(),price:'x',seller:'a'},{bad:1}],log:[{k:'sale',item:item(),price:9000,gold:8100,t:1}],day:{listed:2,bought:1}},host()).ok);
  assert.strictEqual(o.mine.length,1); assert.strictEqual(S.sys.auction.mine[0].price,0); assert.strictEqual(S.sys.auction.mine[0].mine,true); assert.ok(!('seller' in S.sys.auction.mine[0]));
  assert.strictEqual(A.history(S)[0].gold,8100); assert.strictEqual(A.status(S,host()).left.list,3);
  assert.throws(()=>A.ensure(null));
  A.setProvider(null); A.DATA.on=false;
});
console.log(`\nauction: ${n} testes ok`);
