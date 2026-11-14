// node test/sys/lom_telas.test.js — o que as TELAS LoM precisam dos módulos (docs/LIGACOES_LOM_TELAS.md): why() de cada módulo, Sys.relics.slot,
// Sys.dig.syncDaily (missões do dia sem gancho), Sys.today com os nomes reais das telas, Sys.arenaSet.modsText, Sys.minigame.badge,
// Sys.eventRank.load/fromMail, e as decisões das Ruínas em Trio (equilíbrio max(mediana, média), código em minúsculas, frases por GRUPO com sayLeft,
// paid por membro). Tudo com as chaves desligadas por padrão.
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','loot','fc','tower','practice','guild','duo','arena','relics','dig','today','arenaset','coop','coopnet','minigame','events','evtrail','titles','profile','eventrank']
  .forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
let n=0; const T=[]; const t=(name,fn)=>T.push([name,fn]);
const withOn=(mods,fn)=>async()=>{ const old=mods.map(m=>m.DATA.on); mods.forEach(m=>{ m.DATA.on=true; }); try{ await fn(); } finally{ mods.forEach((m,i)=>{ m.DATA.on=old[i]; }); } };
const host=o=>makeHost(Object.assign({now:Date.UTC(2026,10,21,15,0,0),eraMax:2,stage:30,level:40},o||{}));
const R=Sys.relics, D=Sys.dig, TD=Sys.today, AS=Sys.arenaSet, C=Sys.coop, CN=Sys.coopNet, MG=Sys.minigame, ER=Sys.eventRank;

t('tudo DESLIGADO por padrão (inclusive o Sys.coopNet novo)',()=>{ for(const m of [R,D,TD,AS,C,CN,MG,ER]) assert.strictEqual(m.DATA.on,false); });
t('why(): texto para cada reason, aceita string ou objeto; ok = vazio; reason desconhecida = "Não deu agora"',()=>{
  for(const m of [R,D,TD,AS,C,MG]){ assert.strictEqual(typeof m.why,'function'); assert.strictEqual(m.why({ok:true}),''); assert.ok(m.why('off').length>0); assert.strictEqual(m.why('xyz'),'Não deu agora'); }
  assert.strictEqual(R.why({ok:false,reason:'frags'}),'Faltam fragmentos'); assert.strictEqual(D.why('picks'),'Sem picaretas'); assert.strictEqual(TD.why('bag'),'Mochila cheia');
  assert.strictEqual(C.why('limit'),'Sem entradas hoje'); assert.strictEqual(MG.why('tries'),'Sem tentativas hoje'); });
t('relics.slot: folha de UMA relíquia com need (fragmentos que faltam) e a lista de fontes; id ruim = null',withOn([R],()=>{ const S={}, h=host();
  let s=R.slot(S,h,'scarab'); assert.strictEqual(s.owned,false); assert.strictEqual(s.need,20); assert.ok(s.sources.length>=5);
  R.addFragments(S,1,7,'dig'); assert.strictEqual(R.slot(S,h,'scarab').need,13); R.grant(S,h,'eraLord',{era:1}); s=R.slot(S,h,'scarab'); assert.strictEqual(s.owned,true); assert.strictEqual(s.need,0,'7 ≥ custo 5');
  assert.strictEqual(R.slot(S,h,'nada'),null); }));
t('dig.syncDaily: +5 picaretas sozinhas quando o bônus das diárias do Sys.pass foi resgatado; 1 vez por dia; sem pass = nada',withOn([D],()=>{ const S={}, h=host();
  const P0=Sys.pass; let claimed=false; Sys.pass={list:()=>({daily:[],weekly:[],bonus:{ready:true,claimed}})};
  try{ assert.strictEqual(D.view(S,h).picks,20); claimed=true; assert.strictEqual(D.view(S,h).picks,25,'entrou pela leitura'); assert.strictEqual(D.view(S,h).picks,25,'1 vez por dia');
    assert.strictEqual(D.syncDaily(S,h).reason,'daily'); h.t+=864e5; assert.strictEqual(D.view(S,h).picks,30,'dia seguinte: mais 5 (até o teto de 40)');
    delete Sys.pass; h.t+=864e5; assert.strictEqual(D.syncDaily(S,h).reason,'missions'); }
  finally{ if(P0) Sys.pass=P0; else delete Sys.pass; } }));
t('dig.nextText: "próxima em N min"',()=>{ assert.strictEqual(D.nextText(0),''); assert.strictEqual(D.nextText(18*60000),'próxima em 18 min'); assert.strictEqual(D.nextText(90*60000),'próxima em 1 h 30 min'); });
t('today: as abas são NOMES REAIS de tela (inst, missions, battle...), nunca as antigas que não abriam',()=>{ const tabs=TD.SOURCES.map(s=>s.tab);
  for(const bad of ['instances','achievements','chest','bonfire','login']) assert.ok(!tabs.includes(bad),bad);
  assert.ok(tabs.includes('inst')&&tabs.includes('relics')&&tabs.includes('dig')&&tabs.includes('battle')); });
t('arenaSet.modsText: linha pronta da aba Conjunto PvP',()=>{ assert.strictEqual(AS.modsText({atk:0,hp:0,aspd:0,foe:0}),'');
  assert.strictEqual(AS.modsText({atk:0.12,hp:0.08,aspd:0,foe:0.05}),'Na arena: ATQ +12% · Vida +8% · Adversário −5%'); });
t('minigame.badge: 0 desligado e antes do 1º ciclo; 1 sem jogar hoje; prêmio para resgatar conta',withOn([MG],()=>{ const S={};
  assert.strictEqual(MG.badge(S,host({now:Date.UTC(2026,10,15,15)})),0,'antes de 20/11'); const h=host();
  assert.strictEqual(MG.badge(S,h),1,'tem tentativa e não jogou'); const r=MG.start(S,h); MG.finish(S,h,r.centers.slice());
  assert.strictEqual(MG.badge(S,h),1,'Ouro feito: prêmio do dia'); MG.claimDay(S,h); assert.strictEqual(MG.badge(S,h),0); }));
t('eventRank.fromMail: carta eventrank JÁ resgatada grava o visual (idempotente); não resgatada não',withOn([ER,Sys.profile],()=>{ const S={}, h=host();
  const M0=Sys.mail; const box=[{source:'eventrank',claimed:false,att:{cosmetic:{badge:'evt_part'}}},{source:'coop',claimed:true,att:{goldk:1}}];
  Sys.mail={DATA:{enabled:true},inbox:()=>box};
  try{ assert.strictEqual(ER.fromMail(S,h),0); box[0].claimed=true; assert.strictEqual(ER.fromMail(S,h),1); assert.strictEqual(ER.fromMail(S,h),0,'idempotente');
    assert.deepStrictEqual(ER.badges(S).map(b=>b.id),['evt_part']); }
  finally{ if(M0) Sys.mail=M0; else delete Sys.mail; } }));
t('eventRank.load: GET /events/:id/rank → applyRank; 404 = not_found; sem net = net_off',withOn([ER],async()=>{ const S={}, h=host(); const N0=Sys.net;
  try{ delete Sys.net; assert.strictEqual((await ER.load(S,h,'festival_eras')).reason,'net_off'); let path='';
    Sys.net={_call:async(m,p)=>{ path=m+' '+p; return {event:'festival_eras',points:50,rank:3,total:100,top:[]}; }};
    const r=await ER.load(S,h,'festival_eras'); assert.ok(r.ok); assert.strictEqual(r.band,'top10'); assert.strictEqual(path,'GET /events/festival_eras/rank');
    Sys.net={_call:async()=>{ throw Object.assign(new Error('x'),{status:404}); }}; assert.strictEqual((await ER.load(S,h,'festival_eras')).reason,'not_found');
    assert.strictEqual((await ER.load(S,h,'BAD id')).reason,'id'); }
  finally{ if(N0) Sys.net=N0; else delete Sys.net; } }));

/* ---------- Ruínas em Trio: decisões do teste de ponta a ponta do Servidor ---------- */
t('coop EQUILÍBRIO: fcRef = max(mediana, média) × 3; 5000/300/320 não vence os 10 andares com chance 1; grupo de iguais igual a antes',()=>{
  const a=C.run([{fc:5000},{fc:300},{fc:320}],1); assert.strictEqual(a.fcRef,Math.max(320,5620/3)*3); assert.ok(a.floors[a.floors.length-1].p<1);
  let wins=0; for(let s=0;s<200;s++) if(C.run([{fc:5000},{fc:300},{fc:320}],s).reached===10) wins++; assert.ok(wins<40,'forte + 2 fracos chegou ao 10 em '+wins+'/200');   // igual a um grupo de iguais (~8,5%), nunca sempre
  const p10=Math.pow(1/1.04,10)/(Math.pow(1/1.04,10)+1);   /* andar 10 com o time igual ao fcRef: ~40% (tabela 14/11) */
  const eq=C.run([{fc:1000},{fc:1000},{fc:1000}],77); assert.strictEqual(eq.fcRef,3000); assert.ok(p10<0.45);
  let s=0; for(let i=0;i<400;i++) s+=C.run([{fc:1000},{fc:1000},{fc:1000}],i).reached; assert.ok(s/400>5.8&&s/400<7.6,'iguais: '+s/400);   /* tabela 14/11: ~6,7 */ });
t('coop código em minúsculas: canInvite aceita e devolve em maiúsculas',withOn([C],()=>{ const S={}, h=host();
  const r=C.canInvite(S,h,{friendCode:' ab12cd '}); assert.ok(r.ok); assert.strictEqual(r.code,'AB12CD'); assert.strictEqual(C.canInvite(S,h,{friendCode:'ab-1'}).reason,'code'); }));
t('coop frases: 20 por GRUPO por dia (sayLeft do servidor; senão as frases do grupo de hoje); 429 day trava, cooldown só o intervalo',withOn([C],()=>{ const S={}, h=host(); const k=C.dayKey(h.t);
  C.applyStatus(S,h,{entriesLeft:2,party:{id:'p_1',leaderId:'a',members:[{playerId:'a',name:'A',fc:10}],chat:[],sayLeft:1}}); assert.ok(C.canSay(S,h,0).ok);
  C.applyStatus(S,h,{entriesLeft:2,party:{id:'p_1',leaderId:'a',members:[{playerId:'a',name:'A',fc:10}],chat:[],sayLeft:0}}); assert.strictEqual(C.canSay(S,h,0).reason,'limit','o grupo esgotou');
  const chat=[]; for(let i=0;i<20;i++) chat.push({playerId:'b',idx:1,at:h.t-1000}); C.applyStatus(S,h,{entriesLeft:2,party:{id:'p_1',leaderId:'a',members:[{playerId:'a',name:'A',fc:10}],chat}});
  assert.strictEqual(C.groupSaid(S,h),20); assert.strictEqual(C.canSay(S,h,0).reason,'limit','sem sayLeft: as 20 frases de hoje do grupo');
  C.applyStatus(S,h,{entriesLeft:2,party:{id:'p_1',leaderId:'a',members:[{playerId:'a',name:'A',fc:10}],chat:[]}}); assert.ok(C.canSay(S,h,0).ok);
  C.markLimit(S,h,'cooldown'); assert.strictEqual(C.canSay(S,h,0).reason,'limit'); h.t+=6000; assert.ok(C.canSay(S,h,0).ok,'5 s depois');
  C.markLimit(S,h,'day'); h.t+=6000; assert.strictEqual(C.canSay(S,h,0).reason,'limit'); h.t+=864e5; assert.ok(k); assert.ok(C.canSay(S,h,0).ok,'dia novo'); }));
t('coop applyResult: lê members[].paid (minha linha); res.paid do topo é reserva',withOn([C],()=>{ const N0=Sys.net; Sys.net={player:()=>({id:'u1'})};
  try{ const S={}, h=host(); const g0=h.gold;
    let r=C.applyResult(S,h,{runId:'x1',reached:3,members:[{playerId:'u1',paid:false},{playerId:'u2',paid:true}]}); assert.strictEqual(r.got,null,'sem entrada: não credita'); assert.strictEqual(h.gold,g0);
    r=C.applyResult(S,h,{runId:'x2',reached:3,paid:false,members:[{playerId:'u1',paid:true}]}); assert.ok(r.reward,'a linha do membro vale mais que o topo'); assert.ok(h.gold>g0);
    r=C.applyResult(S,h,{runId:'x3',reached:3,paid:false,members:[{playerId:'zz',paid:true}]}); assert.strictEqual(r.got,null,'sem a minha linha: o topo (paid:false)'); }
  finally{ if(N0) Sys.net=N0; else delete Sys.net; } }));

/* ---------- Sys.coopNet (provider online) ---------- */
const fakeNet=(routes,log)=>({ player:()=>({id:'u1'}), _call:async(m,p,b)=>{ log.push(m+' '+p+(b&&Object.keys(b).length?' '+JSON.stringify(b):'')); const f=routes[m+' '+p]; if(!f) throw Object.assign(new Error('404'),{status:404,code:'not_found'}); return typeof f==='function'?f(b):f; } });
const ST0={day:'2026-11-21',entriesLeft:2,entriesMax:2,party:null,invites:[]};
t('coopNet desligado: nada sai; Sys.coop fica no local',withOn([C],async()=>{ const S={}, h=host(), log=[]; const N0=Sys.net; Sys.net=fakeNet({'GET /coop/status':ST0},log);
  try{ assert.strictEqual((await CN.start(S,h)).reason,'off'); assert.strictEqual(log.length,0); assert.strictEqual(C.view(S,h).online,false); } finally{ Sys.net=N0; CN._reset(); C.setProvider(null); } }));
t('coopNet start: status → provider online; COOP_ON desligado (404) = fica o local',withOn([C,CN],async()=>{ const S={}, h=host(), log=[]; const N0=Sys.net;
  try{ Sys.net=fakeNet({},log); const f=await CN.start(S,h); assert.strictEqual(f.reason,'not_found'); assert.strictEqual(C.view(S,h).online,false);
    Sys.net=fakeNet({'GET /coop/status':Object.assign({},ST0,{entriesLeft:1})},log); assert.ok((await CN.start(S,h)).ok); const v=CN.view(S,h); assert.strictEqual(v.online,true); assert.strictEqual(v.entriesLeft,1); }
  finally{ Sys.net=N0; CN._reset(); C.setProvider(null); } }));
t('coopNet ações: código em maiúsculas, frase só índice, 429 day trava, corrida pelo servidor não credita (mailed)',withOn([C,CN],async()=>{ const S={}, h=host(), log=[]; const N0=Sys.net;
  const party={id:'p_1',leaderId:'u1',members:[{playerId:'u1',name:'Eu',fc:900,ghost:false,entryOk:true}],seatsOpen:2,chat:[],sayLeft:20};
  let st=Object.assign({},ST0,{party});
  Sys.net=fakeNet({'GET /coop/status':()=>st,'POST /coop/party':{ok:true,party},'POST /coop/party/invite':{ok:true},'POST /coop/party/leave':{ok:true},
    'POST /coop/party/phrase':()=>{ throw Object.assign(new Error('429'),{status:429,code:'limit',details:{key:'day'},retryAfterMs:5000}); },
    'POST /coop/start':{ok:true,runId:'r_9',seed:1,fcRef:2700,teamPower:2700,floors:[{k:1,win:true,p:0.9},{k:2,win:false,p:0.5}],reached:1,reward:{relicFrags:1,stones:1,goldk:12},
      members:[{playerId:'u1',name:'Eu',fc:900,ghost:false,paid:true}],mailed:true,entriesLeft:1}},log);
  try{ assert.ok((await CN.start(S,h)).ok); assert.strictEqual(CN.view(S,h).leader,true);
    assert.ok((await CN.invite(S,h,{friendCode:'ab12cd'})).ok); assert.ok(log.includes('POST /coop/party/invite {"friendCode":"AB12CD"}'));
    assert.strictEqual((await CN.invite(S,h,{friendCode:'??'})).reason,'code','formato conferido antes: nada sai');
    const ph=await CN.say(S,h,2); assert.strictEqual(ph.reason,'limit'); assert.strictEqual(ph.retryAfterMs,5000); h.t+=10000; assert.strictEqual(C.canSay(S,h,2).reason,'limit','429 day: trava até amanhã');
    const g0=h.gold; st=Object.assign({},ST0,{entriesLeft:1}); const run=await C.start(S,h); assert.ok(run.ok); assert.strictEqual(run.mailed,true); assert.strictEqual(h.gold,g0,'prêmio pelo correio');
    assert.strictEqual(C.ensure(S).lastRun.runId,'r_9'); assert.strictEqual(C.entriesLeft(S,h),1); }
  finally{ Sys.net=N0; CN._reset(); C.setProvider(null); } }));

(async()=>{ for(const [name,fn] of T){ await fn(); n++; console.log('ok -',name); } console.log(`\n${n} testes ok (lom_telas)`); })().catch(e=>{ console.error(e); process.exit(1); });
