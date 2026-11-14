// node test/sys/codex.test.js — Códex das Eras (Sys.codex): catálogo igual ao da tela, posse pelo save, vistos permanentes, marcos e P_CODEX
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path'), vm=require('vm');
const C=require('../../js/sys/codex.js'), MT=require('../../js/sys/mount.js'), L=require('../../js/sys/loot.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const clean=()=>{ delete globalThis.Sys.forge; delete globalThis.Sys.pet; delete globalThis.Sys.phases; };

t('CHAVE desligada por padrão: claim recusa, a tela vê owned/rewards falsos',()=>{
  clean(); assert.strictEqual(C.DATA.on,false); const S={}, h=makeHost({});
  assert.strictEqual(C.claim(S,h,10).reason,'off'); const P=C.screenProvider(S,h); assert.strictEqual(P.owned,false); assert.strictEqual(P.rewards,false);
});

t('catálogo = exatamente o cdxItems() da tela (mesmos ids, mesma ordem, com o meta.json carregado)',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../../js/p_codex.js'),'utf8');
  const ctx={Sys:{mount:MT},Panels:{add(){}},console}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
  ctx.__meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../../assets/enemies/meta.json'),'utf8'));
  const ids=vm.runInContext('XK.meta=__meta; cdxItems().map(i=>i.id)',ctx);
  assert.deepStrictEqual(C.catalog().map(c=>c.id),Array.from(ids));
  const cnt={}; for(const c of C.catalog()) cnt[c.cat]=(cnt[c.cat]||0)+1;
  assert.deepStrictEqual(cnt,{arm:21,eq:42,mnt:8,pet:24,bes:21,aur:3}); assert.strictEqual(C.catalog().length,119);   /* 7 montarias: as 6 de lançamento + a Fênix gigante, liberada (73349f0) */
});

t('posse pelo save: armas por tier de raridade, espaços mapeados, pets (id do save → tela, estágios anteriores), montarias, auras da forja',()=>{
  clean(); const h=makeHost({});
  const S={inv:[{slot:'weapon',e:0,r:0},{slot:'weapon',e:1,r:3},{slot:'weapon',e:2,r:4},{slot:'armor',e:0,r:0},{slot:'hat',e:1,r:2},{slot:'wing',e:3,r:2},{slot:'weapon',e:8,r:0},null,{slot:'xx',e:0}],
    sys:{pet:{owned:{wolf:{stars:1},golem:{stg:2},phoenix:{stg:1},bogus:{}}},mount:{owned:{pony:{},horse:{lvl:3},zzz:{}}},forge:{lv:{weapon:10,armor:15}}}};
  const o=C.owned(S,h);
  for(const id of ['w-0-0','w-1-1','w-2-2','a-0-vest','a-1-helmet','a-3-wings','p-mamute-0','p-cao-0','p-cao-1','p-cao-2','m-pony','m-horse','u-7','u-10']) assert.ok(o.includes(id),id);
  for(const id of ['u-13','p-mamute-1','m-zzz']) assert.ok(!o.includes(id),id);
  assert.ok(!o.some(x=>x.startsWith('p-')&&/fenix|phoenix/.test(x))); assert.ok(o.every(id=>C.catalog().some(c=>c.id===id)),'só ids do catálogo');
});

t('vistos permanentes: vender o item/perder a montaria não tira do códex; save velho/torto migra',()=>{
  clean(); const h=makeHost({}); const S={inv:[{slot:'boots',e:4,r:1}]}; C.sync(S,h); S.inv=[]; delete S.sys.mount;
  assert.ok(C.owned(S,h).includes('a-4-boots'));
  const T={sys:{codex:{seen:['w-0-0','<script>',5],claimed:[10,33,'x']}}}; const o=C.ensure(T);
  assert.deepStrictEqual(o.seen,{'w-0-0':1}); assert.deepStrictEqual(o.claimed,[10]);
  const U={sys:{codex:'lixo'}}; C.ensure(U); assert.deepStrictEqual(U.sys.codex.seen,{});
  assert.throws(()=>C.ensure(null)); assert.deepStrictEqual(C.owned(null,h),[]);
});

t('bestiário (aproximação): sistema antigo por S.best/S.eraMax; Sys.phases ligado usa fases vencidas',()=>{
  clean(); const h=makeHost({});
  assert.deepStrictEqual(C.owned({best:1},h).filter(x=>x[0]==='b'),[],'save novo sem abate: nada');
  let b=C.owned({best:25,kills:10},h).filter(x=>x[0]==='b');
  assert.deepStrictEqual(b,['b-0-e0','b-0-e1','b-0-boss','b-1-e0','b-1-e1','b-1-boss','b-2-e0','b-2-e1']);
  b=C.owned({best:1,eraMax:1},h).filter(x=>x[0]==='b'); assert.deepStrictEqual(b,['b-0-e0','b-0-e1','b-0-boss','b-1-e0','b-1-e1']);
  globalThis.Sys.phases={DATA:{on:true,perEra:100,required:[1,2,2]}};
  b=C.owned({best:1,sys:{phases:{best:{0:[100,0,0,0],1:[100,40,0,0],3:[5,0,0,0]}}}},h).filter(x=>x[0]==='b');
  assert.deepStrictEqual(b,['b-0-e0','b-0-e1','b-0-boss','b-1-e0','b-1-e1','b-3-e0','b-3-e1']);
  clean();
});

t('marcos: % da coleção inteira (piso), prêmio fixo via grantBundle, sem diamantes, cada um uma vez, fora de ordem ok',()=>{
  clean(); C.DATA.on=true;
  for(const m of C.DATA.marks) assert.ok(!m.prize.gems,'sem diamante');
  assert.deepStrictEqual(C.DATA.marks.map(m=>m.p),[10,25,50,75,100]);
  const h=makeHost({unit:10}), S={inv:[]};
  assert.deepStrictEqual(C.progress(S,h),{have:0,total:119,pct:0}); assert.strictEqual(C.claim(S,h,10).reason,'pct'); assert.strictEqual(C.claim(S,h,11).reason,'id');
  const ids=C.catalog().map(c=>c.id); S.sys.codex.seen={}; for(let i=0;i<30;i++) S.sys.codex.seen[ids[i]]=1;   // 30/118 = 25%
  const pr=C.progress(S,h); assert.strictEqual(pr.pct,25);
  const r=C.rewards(S,h); assert.strictEqual(r.next.p,10); assert.ok(r.marks[0].ready&&r.marks[1].ready&&!r.marks[2].ready);
  assert.strictEqual(r.marks[0].txt,'240 de ouro, 3 pedras de forja, 20 de ração');
  const c=C.claim(S,h,25); assert.ok(c.ok); assert.strictEqual(h.gold,480,'ouro do marco 25%: 48 abates (dono 14/11; era 300)'); assert.strictEqual(h.gems,0); assert.strictEqual(L.essence(S),2); assert.strictEqual(c.got.forge,6);
  assert.strictEqual(C.claim(S,h,25).reason,'done'); assert.ok(C.claim(S,h,10).ok); assert.deepStrictEqual(C.rewards(S,h).claimed,[10,25]);
  assert.strictEqual(C.claim(S,h,50).reason,'pct'); assert.strictEqual(C.rewards(S,h).next.p,50);
  C.DATA.on=false;
});

t('screenProvider: formato exato do window.P_CODEX que a tela lê (owned/rewards, readOwned, readRewards.claim) e segue o save atual',()=>{
  clean(); C.DATA.on=true; let S={inv:[{slot:'weapon',e:0,r:0}]}; const h=makeHost({});
  const P=C.screenProvider(()=>S,()=>h); assert.strictEqual(P.owned,true); assert.strictEqual(P.rewards,true);
  assert.deepStrictEqual(P.readOwned(),['w-0-0']);
  let R=P.readRewards(); assert.deepStrictEqual(R.claimed,[]); assert.deepStrictEqual(Object.keys(R.marks[0]),['p','txt']);
  assert.deepStrictEqual(R.claim(10),{ok:false,txt:'',reason:'pct'});
  const ids=C.catalog().map(c=>c.id); for(let i=0;i<12;i++) S.sys.codex.seen[ids[i]]=1;   // 12/118 = 10%
  R=P.readRewards(); const c=R.claim(10); assert.ok(c.ok); assert.ok(/^Prêmio de 10%: /.test(c.txt)); assert.deepStrictEqual(P.readRewards().claimed,[10]);
  S={}; assert.deepStrictEqual(P.readOwned(),[],'save trocado');
  C.DATA.on=false; assert.strictEqual(P.owned,false);
  // a tela de verdade: cdxOwned/cdxRewards da p_codex.js leem este objeto
  const src=fs.readFileSync(path.join(__dirname,'../../js/p_codex.js'),'utf8'), ctx={Sys:{mount:MT},Panels:{add(){}}}; ctx.window=ctx; vm.createContext(ctx); vm.runInContext(src,ctx);
  C.DATA.on=true; S={inv:[{slot:'gloves',e:2,r:0}]}; ctx.P_CODEX=C.screenProvider(()=>S,()=>h);
  assert.deepStrictEqual(Array.from(vm.runInContext('Array.from(cdxOwned())',ctx)),['a-2-gloves']);
  assert.strictEqual(vm.runInContext('cdxRewards().marks.length',ctx),5);
  C.DATA.on=false; assert.strictEqual(vm.runInContext('cdxOwned()',ctx),null,'desligado: tela sem posse');
});

t('sem aleatoriedade: o mesmo save dá o mesmo resultado; sync grava mesmo desligado (só registro)',()=>{
  clean(); const h=makeHost({}); const mk=()=>({best:15,inv:[{slot:'necklace',e:5,r:4}],sys:{pet:{owned:{prism:{stg:1}}}}});
  assert.deepStrictEqual(C.owned(mk(),h),C.owned(mk(),h)); const S=mk(); assert.ok(C.sync(S,h)>0); assert.strictEqual(C.sync(S,h),0);
});

t('pets novos (lobo, falcão, pantera): no FIM, depois do prisma, só com o pet ligado E as entregas ligadas; +9 itens; posse pelo estágio',()=>{
  clean(); const P=require('../../js/sys/pet.js'), N=require('../../js/sys/newdrops.js'); globalThis.Sys.pet=P; globalThis.Sys.newDrops=N; const on0=N.DATA.on;
  try{ N.DATA.on=false; assert.strictEqual(C.catalog().length,119); assert.deepStrictEqual(C.newPets(),[]);
    N.DATA.on=true; assert.deepStrictEqual(C.newPets(),['lobo','falcao','pantera']); const cat=C.catalog().map(c=>c.id); assert.strictEqual(cat.length,127);
    const pi=cat.filter(id=>id.startsWith('p-')); assert.deepStrictEqual(pi.slice(-9),['p-lobo-0','p-lobo-1','p-lobo-2','p-falcao-0','p-falcao-1','p-falcao-2','p-pantera-0','p-pantera-1','p-pantera-2']);
    assert.strictEqual(pi[23],'p-prisma-2','os antigos não mudam de posição');
    const S={sys:{pet:{owned:{falcon:{stars:1,frags:0,lvl:35,stg:1}}}}}, h=makeHost({}); const own=C.owned(S,h); assert.ok(own.includes('p-falcao-0')&&own.includes('p-falcao-1')&&!own.includes('p-falcao-2'));
    const rd=P.DATA.newReady.panther; P.DATA.newReady.panther=false; assert.deepStrictEqual(C.newPets(),['lobo','falcao']); P.DATA.newReady.panther=rd;
  } finally { N.DATA.on=on0; clean(); delete globalThis.Sys.newDrops; }
});
t('9 eras (dono 14/11): com as eras 7-8 ligadas, armas, armaduras e melhores inimigos do Submundo e do Celestial entram (+24); desligadas, 117 como antes',()=>{
  clean(); const ST=require('../../js/sys/stats.js'); globalThis.Sys.stats=ST; const was=ST.DATA.era9.on;
  try{ ST.setEra9(false); assert.strictEqual(C.catalog().length,119); assert.strictEqual(C.era9On(),false);
    ST.setEra9(true); const cat=C.catalog().map(c=>c.id); assert.strictEqual(cat.length,142); assert.strictEqual(C.era9On(),true);
    for(const id of ['w-7-0','w-7-2','w-8-1','a-7-vest','a-8-wings','b-7-boss','b-8-e0']) assert.ok(cat.includes(id),id);
    const S={inv:[{slot:'weapon',e:8,r:4,lvl:1,subs:[]},{slot:'armor',e:7,r:1,lvl:1,subs:[]}],sys:{}}; const sc=[...C.scan(S)]; assert.ok(sc.includes('w-8-2')&&sc.includes('a-7-vest'),sc.join(','));
  } finally { ST.setEra9(was); delete globalThis.Sys.stats; clean(); }
});
t('Fênix gigante (phoenixm) no Códex só quando a montaria está liberada (newReady), no fim das montarias',()=>{
  clean(); const M=require('../../js/sys/mount.js'); globalThis.Sys.mount=M; const r0=M.DATA.newReady.phoenixm;
  try{ M.DATA.newReady.phoenixm=false; assert.ok(!C.catalog().some(c=>c.id==='m-phoenixm'));
    M.DATA.newReady.phoenixm=true; const mm=C.catalog().filter(c=>c.cat==='mnt').map(c=>c.id); assert.strictEqual(mm[mm.length-1],'m-phoenixm');
    const S={sys:{mount:{owned:{phoenixm:{stars:1,frags:0,lvl:1,gold:0}}}}}; assert.ok([...C.scan(S)].includes('m-phoenixm')); } finally { M.DATA.newReady.phoenixm=r0; delete globalThis.Sys.mount; clean(); }
});
console.log(n+' testes ok');
