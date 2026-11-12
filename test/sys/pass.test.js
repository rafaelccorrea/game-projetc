// node test/sys/pass.test.js
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js');
const P=require('../../js/sys/pass.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const host=o=>{ const h=makeHost(o); h.skins=[]; h.addSkin=s=>h.skins.push(s); return h; };
/* joga um dia inteiro: faz todas as diárias e resgata */
function playDay(S,h){ for(const [k,v] of [['kill',150],['ult',3],['chest',1],['instance',1],['boss',2],['forge',15],['summon',1]]) P.track(S,h,k,v);
  for(const m of P.DATA.daily) P.claimMission(S,h,m.id); P.claimMission(S,h,'bonus'); }
function playWeek(S,h){ for(const [k,v] of [['kill',1500],['boss',15],['instance',10],['summon',10],['chest',15],['upgrade',20]]) P.track(S,h,k,v); for(const m of P.DATA.weekly) P.claimMission(S,h,m.id); }

t('tabelas: 30 níveis nas duas trilhas; grátis termina em Épico; premium Raro→Épico→Lendário + skin; sem asa Básica',()=>{
  assert.strictEqual(P.DATA.free.length,30); assert.strictEqual(P.DATA.premium.length,30);
  assert.deepStrictEqual(P.reward('free',30),{item:{slot:'weapon',r:2}});
  assert.ok(P.DATA.free.filter(x=>x.item).slice(0,-1).every(x=>x.item.r===0&&x.item.slot!=='wing'));
  const pr=P.DATA.premium.filter(x=>x.item).map(x=>x.item.r); assert.deepStrictEqual(pr.slice(0,5),[1,1,1,1,1]); assert.strictEqual(pr[pr.length-1],4);
  assert.ok(P.DATA.premium.some(x=>x.skin==='season')); assert.ok(P.DATA.premium.some(x=>x.item&&x.item.slot==='wing'&&x.item.r>=2));
  const gems=tr=>P.DATA[tr].reduce((s,x)=>s+(x.gems||0),0); assert.ok(gems('free')<gems('premium')/3,'grátis com poucos 💎');
});

t('XP do passe só de missões (diárias 90): grátis todo dia = dia 27; perdendo 1 dia/semana = dia 29; premium ~21',()=>{
  const S={}, h=host({}); h.t=new Date(2026,10,16,10).getTime();   // segunda
  let d=0; while(P.tier(S)<30&&d<40){ playDay(S,h); d++; if(d%7===0) playWeek(S,h); h.t+=86400000; }
  assert.strictEqual(d,27,'grátis: dia '+d);
  const S3={}, h3=host({}); h3.t=new Date(2026,10,16,10).getTime(); let d3=0;
  while(P.tier(S3)<30&&d3<40){ d3++; if(d3%7!==3) playDay(S3,h3); if(d3%7===0) playWeek(S3,h3); h3.t+=86400000; }
  assert.ok(d3<=30,'perdendo 1 dia por semana fecha na temporada: dia '+d3);
  const S2={}, h2=host({}); h2.t=new Date(2026,10,16,10).getTime(); P.setPremium(S2,true);
  let d2=0; while(P.tier(S2)<30&&d2<40){ playDay(S2,h2); d2++; if(d2%7===0) playWeek(S2,h2); h2.t+=86400000; }
  assert.ok(d2>=20&&d2<=22,'premium: dia '+d2);
});

t('missões: progresso, viradas (diária à meia-noite, semanal na segunda), não resgata duas vezes, bônus só com as 6',()=>{
  const S={}, h=host({}); h.t=new Date(2026,10,18,23,0).getTime();   // quarta 23h
  P.track(S,h,'kill',100); assert.strictEqual(P.claimMission(S,h,'d_kill').reason,'incompleto');
  P.track(S,h,'kill',60); const r=P.claimMission(S,h,'d_kill'); assert.ok(r.ok); assert.strictEqual(r.xp,15); assert.strictEqual(h.gems,2);
  assert.strictEqual(P.claimMission(S,h,'d_kill').reason,'resgatado'); assert.strictEqual(P.claimMission(S,h,'bonus').reason,'incompleto');
  assert.strictEqual(P.list(S,h).weekly.find(m=>m.id==='w_kill').p,160,'conta também na semanal');
  h.t=new Date(2026,10,19,0,1).getTime(); assert.strictEqual(P.list(S,h).daily.find(m=>m.id==='d_kill').p,0,'diária virou');
  assert.strictEqual(P.list(S,h).weekly.find(m=>m.id==='w_kill').p,160,'semanal não virou na quinta');
  h.t=new Date(2026,10,23,0,1).getTime(); assert.strictEqual(P.list(S,h).weekly.find(m=>m.id==='w_kill').p,0,'semanal virou na segunda');
  P.track(S,h,'xx',5); assert.strictEqual(P.claimMission(S,h,'nada').reason,'id');
});

t('resgatar tudo: grátis sempre; premium só se ativo; não paga duas vezes',()=>{
  const S={}, h=host({eraMax:1,unit:10,level:90}); P.addXp(S,500);
  const a=P.claimAll(S,h); assert.strictEqual(a.n,5); assert.strictEqual(P.claimAll(S,h).n,0);
  P.setPremium(S,true); const b=P.claimAll(S,h); assert.strictEqual(b.n,5,'premium retroativo dos 5 níveis');
  assert.strictEqual(h.items.length,4,'grátis nv3 + premium nv1,3,5'); assert.ok(h.items.every(it=>it.e===1&&it.lvl===1&&it.gold===0));
  assert.ok(h.items.filter(it=>it.r===1).every(it=>it.subs.length===1),'Raro com 1 secundário');
});

t('ITEM DA TEMPORADA: sai NA HORA na melhor raridade permitida e EVOLUI só a raridade até Lendário (era fixa), mantendo o nível',()=>{
  const S={}, h=host({eraMax:1,level:30,seed:3}); P.setPremium(S,true); P.addXp(S,3000*0.8+1); P.claimAll(S,h);
  const season=h.items.filter(it=>it.season); assert.strictEqual(season.length,2); assert.ok(season.every(it=>it.r===2&&it.targetR===4&&it.e===1),'nível 30: Épico agora');
  assert.ok(!P.held(S).some(x=>x.r===4),'nada Lendário guardado para quem pagou');
  season[0].lvl=37; season[0].gold=999;
  h._level=75; h._eraMax=4; let ev=P.evolveSeason(S,h,h.items); assert.strictEqual(ev.length,1,'só o colete vira Mítico (arma não tem Mítica)');
  assert.ok(season.find(it=>it.slot==='armor').r===3);
  h._level=85; h._eraMax=5; ev=P.evolveSeason(S,h,h.items); assert.strictEqual(ev.length,2); assert.ok(season.every(it=>it.r===4&&it.e===1),'Lendário, era de quando foi ganho');
  assert.ok(season.every(it=>it.subs.length===2)); assert.strictEqual(season[0].lvl,37); assert.strictEqual(season[0].gold,999);
  assert.strictEqual(P.evolveSeason(S,h,h.items).length,0,'não passa do alvo');
  h.items.push({slot:'hat',r:0,e:0}); h.itemsFn=()=>h.items; h.items2=null; assert.strictEqual(P.evolveSeason(S,h,[{slot:'hat',r:0}]).length,0,'item comum não evolui');
});

t('TEMPORADA: virada a cada 30 dias zera o passe e o premium; Item da Temporada nunca muda de era',()=>{
  const S={}, h=host({eraMax:1,level:30,seed:8}); h.t=new Date(2026,10,16,10).getTime();
  const se=P.season(S,h); assert.strictEqual(se.n,1); assert.strictEqual(se.end-se.start,30*86400000);
  P.setPremium(S,true); P.addXp(S,2401); P.claimAll(S,h); const it=h.items.find(x=>x.season&&x.slot==='weapon'); assert.strictEqual(it.seasonEnd,se.end);
  h._level=75; h._eraMax=3; P.evolveSeason(S,h,h.items); assert.strictEqual(it.e,1,'arma no portão Mítico não sobe (Épico já é o máximo): era fica');
  h.t=se.end+1000; h._level=90; h._eraMax=6; P.evolveSeason(S,h,h.items);
  assert.strictEqual(it.r,4,'raridade segue evoluindo depois da temporada'); assert.strictEqual(it.e,1,'era fixa');
  const s2=P.season(S,h); assert.strictEqual(s2.n,2); assert.strictEqual(P.progress(S).xp,0); assert.strictEqual(P.progress(S).premium,false,'premium é por temporada');
  const it2=h.items.find(x=>x.season&&x.slot==='armor'); assert.ok(it2.r===4&&it2.e===1);
  const S3={}, h3=host({eraMax:1,level:30,seed:9}); h3.t=new Date(2026,10,16,10).getTime(); P.setPremium(S3,true); P.addXp(S3,2401); P.claimAll(S3,h3);
  const a=h3.items.find(x=>x.season&&x.slot==='armor'); h3._level=90; h3._eraMax=5; P.evolveSeason(S3,h3,h3.items); assert.ok(a.r===4&&a.e===1,'dentro da temporada também: era fixa');
});

t('portão: Épico/asa do premium acima do nível fica GUARDADO e sai com a ERA da liberação',()=>{
  const S={}, h=host({eraMax:1,level:30,seed:3}); P.setPremium(S,true); P.addXp(S,3000*0.8+1);   // premium: +25% → nível 30
  const c=P.claimAll(S,h); const heldOut=c.list.filter(x=>x.held);
  assert.ok(heldOut.some(x=>x.held.slot==='wing'&&x.held.needLevel===50),'asa só no 50'); const before=h.items.length;
  h._level=60; h._eraMax=4; let rel=P.releaseHeld(S,h); assert.ok(rel.some(it=>it.slot==='wing'),'asa sai no 60'); assert.ok(rel.every(it=>it.e===4),'era da liberação');
  assert.strictEqual(P.held(S).length,0); assert.ok(h.items.length>before);
});

t('o Sys.loot.onLevelUp também libera os itens guardados do passe',()=>{
  const S={}, h=host({eraMax:6,level:20}); P.setPremium(S,true); P.addXp(S,2400); P.claimAll(S,h); const nHeld=P.held(S).length; assert.ok(nHeld>0);
  h._level=99; const rel=L.onLevelUp(S,h); assert.strictEqual(rel.filter(x=>x.item).length,nHeld); assert.strictEqual(P.held(S).length,0);
});

t('importa o passe antigo do jogo (S.pass) e conserta lixo',()=>{
  const S={pass:{xp:750,free:[1,2,2,'x',99],prem:[1],on:true}}; const o=P.ensure(S);
  assert.strictEqual(o.xp,750); assert.deepStrictEqual(o.free,[1,2]); assert.deepStrictEqual(o.prem,[1]); assert.ok(o.premium);
  const S2={sys:{pass:{xp:-5,free:'a',d:{p:{kill:9.7,zz:3},c:null},held:[{slot:'hat',r:2},null]}}}; const o2=P.ensure(S2);
  assert.strictEqual(o2.xp,0); assert.deepStrictEqual(o2.free,[]); assert.deepStrictEqual(o2.d.p,{kill:9}); assert.strictEqual(o2.held.length,1);
  assert.throws(()=>P.ensure(null)); assert.strictEqual(P.ensure({}).xp,0);
});

t('CHAVE das instâncias (PO): sem a tela 13, as missões de instância trocam por substitutas de MESMO XP; o bônus das 6 libera',()=>{
  const S={}, h=host({}); const L=P.list(S,h);
  assert.ok(!L.daily.some(m=>m.id==='d_inst')&&L.daily.some(m=>m.id==='d_boss')); assert.ok(!L.weekly.some(m=>m.id==='w_inst')&&L.weekly.some(m=>m.id==='w_summon'));
  assert.strictEqual(L.daily.length,6); assert.strictEqual(L.daily.reduce((s,m)=>s+m.pxp,0),70); assert.strictEqual(L.weekly.reduce((s,m)=>s+m.pxp,0),190);
  for(const [k,v] of [['kill',150],['ult',3],['chest',1],['boss',2],['forge',15],['summon',1]]) P.track(S,h,k,v);
  for(const m of P.list(S,h).daily) assert.ok(P.claimMission(S,h,m.id).ok,m.id); assert.ok(P.claimMission(S,h,'bonus').ok,'bônus das 6 libera sem instância');
  P.DATA.instancesOn=true; const L2=P.list({},h); assert.ok(L2.daily.some(m=>m.id==='d_inst')&&!L2.daily.some(m=>m.id==='d_boss')); P.DATA.instancesOn=false;
});

t('missão de melhoria (semanal) só aparece a partir do nível 5 do jogador',()=>{
  const S={}, h=host({level:3}); assert.ok(!P.list(S,h).weekly.some(m=>m.id==='w_up')); P.track(S,h,'upgrade',30); assert.strictEqual(P.claimMission(S,h,'w_up').reason,'id');
  h._level=5; assert.ok(P.list(S,h).weekly.some(m=>m.id==='w_up')); assert.ok(P.claimMission(S,h,'w_up').ok,'o progresso feito antes conta');
  assert.ok(P.list({},host({})).weekly.some(m=>m.id==='w_up'),'sem nível conhecido: aparece');
});

t('arma Mítica nunca é entregue; alerts conta níveis e missões prontas',()=>{
  const S={}, h=host({eraMax:6,level:99}); assert.strictEqual(P.alerts(S,h),0); P.addXp(S,300); P.track(S,h,'chest',1); assert.strictEqual(P.alerts(S,h),3+1);
});
console.log(`\npass: ${n} testes ok`);
