// node test/sys/coop.test.js — Sys.coop (Ruínas em Trio, desligado): corrida determinística de 3 retratos, 10 andares com prêmio fixo
// (30 fragmentos / 22 pedras / 120 goldk no total), 2 entradas por dia, convite por código ou guilda, frases prontas por índice, crédito 1 vez por corrida
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','loot','fc','tower','practice','guild','duo','arena','coop'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const C=Sys.coop;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ const a=C.DATA.on; C.DATA.on=true; try{ fn(); } finally{ C.DATA.on=a; C.setProvider(null); } };
const host=o=>makeHost(Object.assign({level:40,eraMax:2,stage:30},o||{}));

t('DESLIGADO por padrão: status off, start recusa',()=>{ assert.strictEqual(C.DATA.on,false); const S={}; assert.strictEqual(C.status(S,host()).reason,'off'); assert.strictEqual(C.start(S,host()).reason,'off'); });
t('tabela: 10 andares, inimigo sobe, total 30 fragmentos / 22 pedras / 120 goldk (1 resgate de ouro); sem diamante, sem sorteio no prêmio',()=>{
  assert.strictEqual(C.DATA.floors.length,10); for(let i=1;i<10;i++) assert.ok(C.DATA.floors[i].mult>C.DATA.floors[i-1].mult);
  assert.deepStrictEqual(C.rewardFor(10),{relicFrags:30,stones:22,goldk:120}); assert.deepStrictEqual(C.rewardFor(0),{relicFrags:0,stones:0,goldk:0}); assert.deepStrictEqual(C.rewardFor(3),{relicFrags:4,stones:3,goldk:36});
  assert.deepStrictEqual(C.rewardFor(99),C.rewardFor(10)); for(const f of C.DATA.floors) assert.deepStrictEqual(Object.keys(f.reward).sort(),['goldk','relicFrags','stones']); });
t('corrida: mesma semente = mesmo resultado; fcRef = mediana × 3; para no 1º andar perdido; mulberry igual à da arena',()=>{
  const team=[{fc:1000},{fc:1100},{fc:900}], a=C.run(team,77), b=C.run(team,77); assert.deepStrictEqual(a,b); assert.strictEqual(a.fcRef,3000); assert.strictEqual(a.teamPower,3000);
  assert.strictEqual(a.floors.length,Math.min(10,a.reached+1)); assert.ok(a.floors.slice(0,a.reached).every(f=>f.win)); assert.deepStrictEqual(a.reward,C.rewardFor(a.reached));
  const r1=C.mulberry(5), r2=C.mulberry(5); assert.strictEqual(r1(),r2()); });
t('equilíbrio: grupo igual chega ~ao andar 3-4 em média; forte + 2 iguais fica igual ao grupo de iguais (fcRef = max(mediana, média) × 3)',()=>{ let s=0, sStrong=0; for(let i=0;i<400;i++){ s+=C.run([{fc:1000},{fc:1000},{fc:1000}],i).reached; sStrong+=C.run([{fc:3000},{fc:1000},{fc:1000}],i).reached; }
  const avg=s/400, avgS=sStrong/400; assert.ok(avg>2.8&&avg<4.2,'média '+avg); assert.ok(Math.abs(avgS-avg)<0.6,'forte '+avgS+' × iguais '+avg); });
t('local: 2 entradas por dia de Brasília, credita ouro (≤120 goldk) e pedras pela tabela, fragmentos guardados sem Sys.relics; zera no dia seguinte',()=>withOn(()=>{ const S={}, h=host();
  const r1=C.start(S,h); assert.ok(r1.ok&&r1.members.length===3&&r1.members.filter(m=>m.ghost).length===2); const g1=h.gold; assert.strictEqual(C.entriesLeft(S,h),1);
  assert.strictEqual(g1,Math.round(r1.reward.goldk*h.goldUnit())); assert.strictEqual(S.sys.loot.relicFrags,r1.reward.relicFrags,'sem Sys.relics: guardados no Sys.loot'); assert.strictEqual(Sys.practice.ensure(S).stones,r1.reward.stones);
  C.start(S,h); assert.strictEqual(C.start(S,h).reason,'limit'); h.t+=864e5; assert.strictEqual(C.entriesLeft(S,h),2); }));
t('nível 30 para abrir',()=>withOn(()=>{ const S={}; assert.strictEqual(C.status(S,host({level:29})).reason,'level'); }));
t('applyResult: credita 1 vez por runId e sempre pela TABELA (ignora prêmio mandado); paid:false só mostra',()=>withOn(()=>{ const S={}, h=host();
  const r=C.applyResult(S,h,{runId:'r1',reached:2,reward:{goldk:99999,relicFrags:999}}); assert.deepStrictEqual(r.reward,{relicFrags:2,stones:2,goldk:24}); const g=h.gold;
  assert.strictEqual(C.applyResult(S,h,{runId:'r1',reached:2}).reason,'claimed'); assert.strictEqual(h.gold,g);
  assert.strictEqual(C.applyResult(S,h,{runId:'r2',reached:9,paid:false}).got,null); assert.strictEqual(h.gold,g); assert.strictEqual(C.ensure(S).lastRun.runId,'r2');
  const m=C.applyResult(S,h,{runId:'r3',reached:10,mailed:true,reward:{relicFrags:30,stones:22,goldk:120}}); assert.ok(m.ok&&m.mailed&&m.got===null); assert.strictEqual(h.gold,g,'servidor manda pelo correio: não credita'); assert.strictEqual(S.sys.loot.relicFrags,2); }));
t('Sys.relics ligado recebe os fragmentos pelo Sys.loot (nada guardado)',()=>withOn(()=>{ const S={}, h=host(); let got=0; Sys.relics={addRelicFrags:(S,k)=>{ got+=k; return {ok:true,era:0}; }};
  try{ C.applyResult(S,h,{runId:'x',reached:3}); assert.strictEqual(got,4); assert.ok(!S.sys.loot.relicFrags); } finally{ delete Sys.relics; } }));
t('convite: código no formato da Dupla ou membro da MINHA guilda; texto livre nunca',()=>withOn(()=>{ const S={}, h=host();
  assert.ok(C.canInvite(S,h,{friendCode:'AB12CD'}).ok); assert.strictEqual(C.canInvite(S,h,{friendCode:'oi tudo bem'}).reason,'code'); assert.strictEqual(C.canInvite(S,h,{}).reason,'code');
  assert.strictEqual(C.canInvite(S,h,{guildMemberId:'u2'}).reason,'not_guild'); Sys.guild.DATA.on=true;
  try{ Sys.guild.applyServer(S,{id:'g',name:'G',role:'member',level:1,members:[{id:'u1',name:'Eu',me:true},{id:'u2',name:'Bia'}]}); assert.ok(C.canInvite(S,h,{guildMemberId:'u2'}).ok); assert.strictEqual(C.canInvite(S,h,{guildMemberId:'u1'}).reason,'not_guild','eu mesmo não'); } finally{ Sys.guild.DATA.on=false; } }));
t('frases: só índice válido da Dupla, 1 a cada 5 s, 20 por dia',()=>withOn(()=>{ const S={}, h=host(); assert.strictEqual(C.canSay(S,h,99).reason,'bad_idx'); assert.strictEqual(C.canSay(S,h,'oi').reason,'bad_idx');
  assert.ok(C.canSay(S,h,0).ok); C.markSaid(S,h); assert.strictEqual(C.canSay(S,h,1).reason,'limit'); h.t+=5000; assert.ok(C.canSay(S,h,1).ok);
  for(let i=0;i<19;i++){ C.markSaid(S,h); h.t+=6000; } assert.strictEqual(C.canSay(S,h,2).reason,'limit'); }));
t('applyStatus: espelha grupo (frase vira texto da lista, índice ruim some), entradas e paga o lastRun de quem estava fora',()=>withOn(()=>{ const S={}, h=host();
  C.applyStatus(S,h,{entriesLeft:1,party:{id:'p',leaderId:'a',seatsOpen:1,members:[{playerId:'a',name:'Ana',fc:100},{playerId:'b',name:'x'.repeat(80),fc:90,ghost:true}],chat:[{playerId:'a',idx:0,at:1},{playerId:'a',idx:500}]},
    invites:[{partyId:'q',fromName:'Bia',at:2}],lastRun:{runId:'z',reached:1}});  // lastRun sem mailed = provider antigo/local
  const st=C.status(S,h); assert.strictEqual(st.entriesLeft,1); assert.strictEqual(st.party.members[1].name.length,24); assert.strictEqual(st.party.chat.length,1); assert.strictEqual(st.party.chat[0].txt,'Oi, dupla!');
  assert.ok(h.gold>0,'lastRun pago'); }));
t('provider do servidor: start vai para ele',()=>withOn(()=>{ const S={}, h=host(); let called=0; C.setProvider({start:()=>{ called++; return Promise.resolve({ok:true}); }}); assert.ok(C.start(S,h) instanceof Promise); assert.strictEqual(called,1); assert.ok(C.status(S,h).online); }));
t('vm: Sys.coop.run roda sozinho num contexto sem window/document e sem outro módulo (como o servidor carrega)',()=>{ const vm=require('vm'), fs=require('fs'), ctx=vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../../js/sys/coop.js'),'utf8'),ctx); const r=vm.runInContext('Sys.coop.run([{fc:1000},{fc:1200},{fc:900}],42)',ctx); assert.deepStrictEqual(JSON.parse(JSON.stringify(r)),JSON.parse(JSON.stringify(C.run([{fc:1000},{fc:1200},{fc:900}],42)))); });
console.log(n+' testes ok');
