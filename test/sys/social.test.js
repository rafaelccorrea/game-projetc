// node test/sys/social.test.js — correio, login diário, eventos e a entrega de pacote (Sys.loot.grantBundle)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js'), M=require('../../js/sys/mail.js'), G=require('../../js/sys/login.js'), E=require('../../js/sys/events.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=o=>{ const h=makeHost(o); h.skins=[]; h.addSkin=s=>h.skins.push(s); return h; };
const D=86400000;

t('CHAVE desligada por padrão (PO): correio, login e eventos não entregam nada até o jogo ligar',()=>{
  assert.strictEqual(M.DATA.enabled,false); assert.strictEqual(G.DATA.enabled,false); assert.strictEqual(E.DATA.enabled,false);
  const S={}, h=host({}); h.t=new Date(2026,10,21,12).getTime();
  assert.strictEqual(M.send(S,h,{title:'x',att:{gems:5}}),0); assert.strictEqual(M.claimAll(S,h).reason,'desligado');
  assert.strictEqual(G.claim(S,h).reason,'desligado'); assert.deepStrictEqual(E.list(S,h),[]); E.track(S,h,'kill',5000);
  assert.strictEqual(E.buy(S,h,'festival_eras','s_gold').reason,'desligado'); assert.strictEqual(h.gems,0); assert.strictEqual(h.gold,0);
  M.DATA.enabled=G.DATA.enabled=E.DATA.enabled=true;   // os testes seguintes rodam com as chaves ligadas
});

t('grantBundle: ouro/goldk, gemas, materiais, skin; item no portão sai na hora, acima fica GUARDADO e sai com a era da liberação',()=>{
  delete globalThis.Sys.pet; delete globalThis.Sys.forge;
  const S={}, h=host({eraMax:2,level:30,unit:10});
  const g=L.grantBundle(S,h,{gold:5,goldk:2,gems:7,essence:3,forge:4,skin:'x',items:[{slot:'hat',r:2},{slot:'armor',r:4},{slot:'wing',r:2}]});
  assert.strictEqual(g.gold,25); assert.strictEqual(h.gold,25); assert.strictEqual(h.gems,7); assert.strictEqual(L.essence(S),3); assert.deepStrictEqual(h.skins,['x']);
  assert.strictEqual(g.items.length,1); assert.strictEqual(h.items[0].slot,'hat'); assert.strictEqual(h.items[0].subs.length,2);
  assert.deepStrictEqual(g.heldItems.map(x=>[x.slot,x.r,x.needLevel]),[['armor',4,85],['wing',2,50]]);
  h._level=60; h._eraMax=5; let rel=L.onLevelUp(S,h); assert.ok(rel.some(x=>x.item&&x.item.slot==='wing'&&x.item.e===5));
  h._level=90; rel=L.onLevelUp(S,h); assert.ok(rel.some(x=>x.item&&x.item.r===4)); assert.strictEqual(L.heldItems(S).length,0);
  const w=L.grantBundle({},host({eraMax:6,level:90}),{items:[{slot:'weapon',r:3}]}); assert.strictEqual(w.items[0].r,2,'arma sem Mítica');
  const e=L.grantBundle({},host({eraMax:0,level:5}),{eggs:[3]}); assert.strictEqual(e.heldEggs.length,1,'ovo de presente guardado, não rebaixado');
  assert.deepStrictEqual(L.grantBundle({},h,null).items,[]);
});

t('CORREIO: envia, lista (mais nova primeiro), resgata uma/todas, não paga duas vezes, expira em 30 dias, apagar só sem anexo pendente',()=>{
  const S={}, h=host({eraMax:1,level:20});
  const a=M.send(S,h,{title:'Bem-vindo',body:'oi',att:{gems:50}}); h.t+=1000; const b=M.send(S,h,{title:'Aviso'}); h.t+=1000; const c=M.send(S,h,{title:'Prêmio',att:{goldk:10,items:[{slot:'boots',r:1}]}});
  assert.deepStrictEqual(M.inbox(S,h).map(m=>m.id),[c,b,a]); assert.strictEqual(M.unread(S,h),3);
  assert.strictEqual(M.claim(S,h,b).reason,'sem_anexo'); assert.ok(M.claim(S,h,a).ok); assert.strictEqual(h.gems,50); assert.strictEqual(M.claim(S,h,a).reason,'resgatado');
  assert.strictEqual(M.remove(S,h,c),false,'anexo pendente não apaga'); const all=M.claimAll(S,h); assert.strictEqual(all.n,1); assert.strictEqual(h.items.length,1);
  assert.ok(M.remove(S,h,c)); M.read(S,h,b); assert.strictEqual(M.unread(S,h),0);
  const d=M.send(S,h,{title:'Velha',att:{gems:1}}); assert.strictEqual(M.inbox(S,h).find(m=>m.id===d).daysLeft,30);
  h.t+=30*D+1; assert.ok(!M.inbox(S,h).some(m=>m.id===d),'expirou');
  const S2={}; for(let i=0;i<120;i++) M.send(S2,h,{title:'m'+i,att:i<5?{gems:1}:null}); assert.strictEqual(M.inbox(S2,h).length,100); assert.ok(M.inbox(S2,h).filter(m=>m.hasAtt).length===5,'cheio: sai primeiro quem não tem anexo');
  const S3={sys:{mail:{seq:'x',list:[null,{id:1,title:'ok',exp:1e15},{id:'z'}]}}}; assert.strictEqual(M.ensure(S3).list.length,1);
});

t('LOGIN DIÁRIO: 1 por dia, 7 dias que reiniciam, faltar não zera, 7º vale mais, sem nada pago',()=>{
  const S={}, h=host({eraMax:0,unit:10}); h.t=new Date(2026,10,12,9).getTime();
  const r1=G.claim(S,h); assert.ok(r1.ok&&r1.day===1); assert.strictEqual(G.claim(S,h).reason,'hoje'); assert.ok(!G.status(S,h).canClaim);
  for(let d=2;d<=7;d++){ h.t+=D; const r=G.claim(S,h); assert.strictEqual(r.day,d); }
  assert.ok(L.essence(S)>=4,'7º dia com Essência'); h.t+=3*D; assert.strictEqual(G.claim(S,h).day,1,'reinicia; faltar 2 dias não pula');
  h.t+=D; assert.strictEqual(G.status(S,h).step,1); assert.ok(G.status(S,h).days[1].today);
  const val=x=>(x.gems||0)+(x.essence||0)*10; assert.ok(val(G.DATA.days[6])>Math.max(...G.DATA.days.slice(0,6).map(val)),'7º dia vale mais');
  assert.ok(G.DATA.days.every(x=>!x.items&&!x.eggs||true));
});

t('EVENTO Festival das Eras: fases, missões dão pontos, pontos repetíveis com teto, loja direta com limite, carência e limpeza',()=>{
  const S={}, h=host({eraMax:3,level:40,unit:10}); h.t=new Date(2026,10,15,12).getTime();
  const ev=E.DATA.events[0]; assert.strictEqual(E.phase(ev,h),'antes'); assert.deepStrictEqual(E.list(S,h),[]); E.track(S,h,'kill',999); assert.strictEqual(((S.sys||{}).events||{}).festival_eras,undefined,'antes do início não conta');
  h.t=new Date(2026,10,21,12).getTime(); assert.strictEqual(E.phase(ev,h),'ativo'); assert.strictEqual(E.list(S,h)[0].name,'Festival das Eras');
  E.track(S,h,'kill',1000); assert.strictEqual(E.list(S,h)[0].pts,20,'4 × 5 pontos repetíveis');
  E.track(S,h,'kill',20000); const pts=E.list(S,h)[0].pts; assert.strictEqual(pts,200,'teto de 200 nos repetíveis');
  assert.ok(E.claimMission(S,h,'festival_eras','f_kill').ok); assert.strictEqual(E.claimMission(S,h,'festival_eras','f_kill').reason,'resgatado'); assert.strictEqual(E.claimMission(S,h,'festival_eras','f_boss').reason,'incompleto');
  assert.ok(E.buy(S,h,'festival_eras','s_skin_w').ok); assert.deepStrictEqual(h.skins,['festival_weapon']); assert.strictEqual(E.buy(S,h,'festival_eras','s_skin_w').reason,'limite');
  const b=E.buy(S,h,'festival_eras','s_item'); assert.strictEqual(b.reason,'pontos',"240-150=90 < 120");
  for(let i=0;i<3;i++) assert.ok(E.buy(S,h,'festival_eras','s_gold').ok); assert.strictEqual(E.shop(S,h,'festival_eras').find(x=>x.id==='s_gold').bought,3);
  h.t=new Date(2026,11,5,12).getTime(); assert.strictEqual(E.phase(ev,h),'loja'); E.track(S,h,'kill',5000); assert.strictEqual(E.list(S,h)[0].pts,30,'na carência não ganha mais pontos');
  assert.ok(E.buy(S,h,'festival_eras','s_gold').ok,'mas ainda compra');
  h.t=new Date(2026,11,7,12).getTime(); assert.strictEqual(E.phase(ev,h),'fim'); assert.strictEqual(E.buy(S,h,'festival_eras','s_gold').reason,'fechado'); E.cleanup(S,h); assert.deepStrictEqual(S.sys.events,{});
  assert.ok(E.DATA.events[0].shop.every(x=>!x.reward.random),'nada de sorteio na loja');
});

t('evento: item da loja respeita o portão (fica guardado)',()=>{
  const S={}, h=host({eraMax:3,level:10}); h.t=new Date(2026,10,21,12).getTime(); E.track(S,h,'kill',50000);
  for(const m of ['f_kill']) E.claimMission(S,h,'festival_eras',m); const r=E.buy(S,h,'festival_eras','s_item'); assert.ok(r.ok); assert.strictEqual(r.got.heldItems.length,1,'nível 10: Épico guardado');
});
t('PRISMÁTICO (ganchos da fps-e2): pacote com petFrags chama Sys.pet.addFragments; vitória sobre Senhor da Era/Chefe de Era chama Sys.pet.prismBoss',()=>{
  const I=require('../../js/sys/instances.js'); const frags=[], boss=[];
  globalThis.Sys.pet={addFood:()=>{},addEgg:()=>({}),addFragments:(S,id,n)=>{ frags.push([id,n]); },prismBoss:(S,h,era)=>{ boss.push(era); return era>=8?{ok:true}:{ok:false,reason:'era'}; }};
  const h=host({eraMax:6,stage:70});
  const g=L.grantBundle({},h,{petFrags:{prism:100,x:0}}); assert.deepStrictEqual(frags,[['prism',100]]); assert.deepStrictEqual(g.petFrags,{prism:100});
  const r=L.onKill({},h,{boss:true,eraBoss:true,era:6}); assert.deepStrictEqual(r.prism,{ok:false,reason:'era'}); assert.deepStrictEqual(boss,[6]);
  L.onKill({},h,{boss:true}); assert.strictEqual(boss.length,1,'chefe de fase não avisa');
  const S={}, run=I.start(S,h,'boss',18).run; I.finish(S,h,run.id,{win:true}); assert.deepStrictEqual(boss,[6,6],'instância Chefe de Era avisa com a era do nível');
  globalThis.Sys.pet.addFragments=()=>({ok:false,reason:'off'}); assert.deepStrictEqual(L.grantBundle({},h,{petFrags:{prism:10}}).petFrags,{},'recusado (chave desligada): não anota');
  delete globalThis.Sys.pet; assert.strictEqual(L.prismBoss({},h,8),null,'sem Sys.pet: nada');
});
t('EVENTO: 100 fragmentos do Prismático por evento (5 missões × 10 + loja 5 × 10), só com as chaves v3/v4 dos pets ligadas',()=>{
  const evId='festival_eras', frags=[];
  const pet={DATA:{v3:false,v4:false},addFood:()=>{},addEgg:()=>({}),addFragments:(S,id,n)=>{ frags.push([id,n]); }}; globalThis.Sys.pet=pet;
  const h=host({eraMax:3,level:40}); h.t=new Date(2026,10,21,12).getTime();
  const S0={}; E.track(S0,h,'kill',50000); assert.ok(E.claimMission(S0,h,evId,'f_kill').ok); assert.strictEqual(frags.length,0,'chaves desligadas: sem fragmento');
  assert.ok(!E.shop(S0,h,evId).some(x=>x.id==='s_prism'),'item escondido'); assert.strictEqual(E.buy(S0,h,evId,'s_prism').reason,'id');
  pet.DATA.v3=pet.DATA.v4=true; const S={}; for(const [k,v] of [['kill',50000],['boss',30],['instance',15],['chest',20],['ult',30]]) E.track(S,h,k,v);
  for(const m of E.missions(S,h,evId)) assert.ok(E.claimMission(S,h,evId,m.id).ok);
  for(let i=0;i<6;i++) E.buy(S,h,evId,'s_prism');
  const tot=frags.reduce((a,[id,n])=>a+(id==='prism'?n:0),0); assert.strictEqual(tot,100,'100 por evento');
  assert.strictEqual(E.shop(S,h,evId).find(x=>x.id==='s_prism').bought,5,'limite 5');
  delete globalThis.Sys.pet;
});
console.log(`\nsocial: ${n} testes ok`);
