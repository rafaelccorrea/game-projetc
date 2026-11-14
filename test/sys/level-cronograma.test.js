// node test/sys/level-cronograma.test.js — cronograma de liberação aprovado pelo dono (14/11; docs/LIBERACOES.md §c) em Sys.level:
// níveis da tabela, Sys.level.unlocked(S, chave, host) com "existe de verdade" (compra real, evento aberto, online, guilda), aviso "Liberou" sem abas
// e sem o que não existe (Login diário só com o módulo ligado).
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','level','vip','buy','login','events','grimoire','relics'].forEach(m=>{ try{ require('../../js/sys/'+m+'.js'); }catch(e){} });
const {makeHost}=require('./_host.js');
const L=Sys.level;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const at=lv=>{ const S={sys:{level:{lvl:lv,xp:0}}}; return S; };
const need=lv=>L.need(lv);
t('níveis do cronograma aprovado',()=>{ const W={map:4,practice:5,mail:7,thief:8,profile:10,shopgem:10,trial:10,vip:10,forge:12,codex:13,grim:13,instances:14,tower:15,speed:15,
    dig:16,mentors:17,pass:18,chat:19,pets:20,duo:21,camp:22,events:24,rank:26,arena:28,path:30,weak:30,coop:31,guild:32,mount:38,tourney:40,auction:45,wing:50,
    shopOffers:10,shopLook:10,shopVip:10,shopPass:18,shopMount:38,gearSkins:10,gearPets:20,gearMount:38,gearWing:50};
  for(const k in W) assert.strictEqual(L.unlockLevel(k),W[k],k); assert.strictEqual(L.unlockLevel('shopGems'),10); assert.strictEqual(L.unlockLevel('wingSlot'),50); });
t('unlocked: o nível manda nas funções sem condição',()=>{ const h=makeHost(); assert.strictEqual(L.unlocked(at(3),'map',h),false); assert.strictEqual(L.unlocked(at(4),'map',h),true);
  assert.strictEqual(L.unlocked(at(29),'path',h),false); assert.strictEqual(L.unlocked(at(30),'weak',h),true); assert.strictEqual(L.unlocked(at(7),'thief',h),false); assert.strictEqual(L.unlocked(at(8),'thief',h),true); });
t('VIP só com a compra real (Sys.buy.ready)',()=>{ const h=makeHost(), B=Sys.buy, r0=B&&B.ready; assert.strictEqual(L.unlocked(at(60),'vip',h),false); assert.strictEqual(L.unlocked(at(60),'shopVip',h),false);
  if(B){ B.ready=()=>true; try{ assert.strictEqual(L.unlocked(at(10),'vip',h),true); assert.strictEqual(L.unlocked(at(9),'vip',h),false); } finally{ B.ready=r0; } } });
t('Eventos só com o módulo ligado e evento aberto',()=>{ const E=Sys.events, h=makeHost(); h.t=new Date(2026,10,22,12).getTime(); const S=at(30);
  assert.strictEqual(L.unlocked(S,'events',h),false,'módulo desligado'); const a=E.DATA.enabled; E.DATA.enabled=true;
  try{ assert.strictEqual(L.unlocked(S,'events',h),true,'Festival local aberto em 22/11'); h.t=new Date(2026,10,10).getTime(); assert.strictEqual(L.unlocked(S,'events',h),false,'antes de abrir'); } finally{ E.DATA.enabled=a; } });
t('online: Chat, Dupla, Ruínas, Guilda, Leilão só com o online; Torneio só com guilda há 7 dias',()=>{ const S=at(60), off=makeHost(), on=Object.assign(makeHost(),{online:()=>true});
  for(const k of ['chat','guild','auction']){ assert.strictEqual(L.unlocked(S,k,off),false,k); assert.strictEqual(L.unlocked(S,k,on),true,k); }
  assert.strictEqual(L.unlocked(S,'tourney',on),false,'sem guilda'); on.guildDays=()=>6; assert.strictEqual(L.unlocked(S,'tourney',on),false); on.guildDays=()=>7; assert.strictEqual(L.unlocked(S,'tourney',on),true); });
t('host.featureOn manda (o jogo sabe mais), e a chave do módulo (gated) continua valendo',()=>{ const h=Object.assign(makeHost(),{featureOn:k=>k==='chat'?true:k==='map'?false:undefined});
  assert.strictEqual(L.unlocked(at(1),'chat',h),true); assert.strictEqual(L.unlocked(at(60),'map',h),false); assert.strictEqual(L.unlocked(at(60),'dig',h),false,'Escavação com o Sys.dig desligado'); });
t('velocidade x2: Nv 15 ou VIP 1',()=>{ const h=makeHost(), V=Sys.vip; assert.strictEqual(L.unlocked(at(14),'speed',h),false); assert.strictEqual(L.unlocked(at(15),'speed',h),true);
  if(V&&V.level){ const r=V.level; V.level=()=>1; try{ assert.strictEqual(L.unlocked(at(1),'speed',h),true); } finally{ V.level=r; } } });
t('Grimório: Nv 13 ou a 1ª magia, só com o módulo ligado',()=>{ const G=Sys.grimoire, h=makeHost(); if(!G) return; const a=G.DATA.on;
  assert.strictEqual(L.unlocked(at(20),'grim',h),false,'desligado'); G.DATA.on=true;
  try{ assert.strictEqual(L.unlocked(at(13),'grim',h),true); const S=at(5); assert.strictEqual(L.unlocked(S,'grim',h),false); const o=G.ensure(S), id=G.DATA.spells[0].id; o.own[id]={lv:1,pages:0};
    assert.strictEqual(L.unlocked(S,'grim',h),true,'1ª magia antes do 13'); } finally{ G.DATA.on=a; } });
t('aviso "Liberou": sem abas, sem Login diário desligado, sem o que precisa de online',()=>{ const h=makeHost();
  let S=at(6), r=L.addXp(S,need(6),h); assert.ok(!r.unlocked.includes('login'),'login desligado'); assert.ok(r.unlocked.includes('mail'));
  const Lg=Sys.login; if(Lg){ const a=Lg.DATA.enabled; Lg.DATA.enabled=true; try{ S=at(6); r=L.addXp(S,need(6),h); assert.ok(r.unlocked.includes('login')); } finally{ Lg.DATA.enabled=a; } }
  S=at(9); r=L.addXp(S,need(9),h); assert.ok(!r.unlocked.some(k=>/^shop[A-Z]|^gear/.test(k)),'abas não anunciam: '+r.unlocked); assert.ok(!r.unlocked.includes('vip'),'VIP sem compra real');
  assert.ok(r.unlocked.includes('profile')&&r.unlocked.includes('trial'));
  S=at(14); r=L.addXp(S,need(14),h); assert.ok(!r.unlocked.includes('speed')); assert.ok(r.unlocked.includes('tower'));
  S=at(18); r=L.addXp(S,need(18),h); assert.ok(!r.unlocked.includes('chat'),'Chat sem online'); });
t('nextUnlock pula abas e módulos desligados',()=>{ const S=at(36); const x=L.nextUnlock(S); assert.strictEqual(x.feature,'mount'); const S2=at(9); assert.notStrictEqual(L.nextUnlock(S2).feature,'shopOffers'); });
t('unlockedList: só o que existe agora',()=>{ const h=makeHost(), l=L.unlockedList(at(15),h); for(const k of ['map','forge','tower','speed','trial']) assert.ok(l.includes(k),k);
  for(const k of ['vip','events','chat','dig','pets']) assert.ok(!l.includes(k),k); });
console.log(n+' testes ok');
