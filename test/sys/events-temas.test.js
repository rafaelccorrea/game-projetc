// node test/sys/events-temas.test.js — os 3 temas novos de evento (dono 14/11; docs/EVENTOS_TEMAS.md): Caçada aos Chefes, Semana da Forja, Festa dos Pets.
// Prefixo no calendário, regras iguais ao Festival (180 pontos de missão, Prismático 100, ouro igual), sem sorteio/diamante, skin e moldura escondidas
// até a arte existir (DATA.ready), e os contadores novos que os módulos contam sozinhos (tower, evboss, petfeed, petlevel).
// SYSDIR (opcional) = pasta dos módulos a testar (padrão js/sys).
'use strict';
const assert=require('assert'), path=require('path');
const D=process.env.SYSDIR||path.join(__dirname,'../../js/sys');
globalThis.Sys={};
['stats','loot','level','fc','profile'].forEach(m=>require(path.join(__dirname,'../../js/sys',m+'.js')));
['events','evtrail','tower','pet'].forEach(m=>require(path.join(D,m+'.js')));
const {makeHost}=require('./_host.js');
const E=Sys.events, X=Sys.evtrail;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const DAY=86400000, BRT=(y,m,d)=>Date.UTC(y,m-1,d,3);
const occ=(id,y,m,d)=>{ const s=BRT(y,m,d), e=s+14*DAY; return {id,start:s,end:e,graceEnd:e+2*DAY}; };
const CAL=[occ('festival_eras_261120',2026,11,20),occ('cacada_chefes_261204',2026,12,4),occ('festival_eras_261218',2026,12,18),
  occ('semana_forja_270101',2027,1,1),occ('festival_eras_270115',2027,1,15),occ('festa_pets_270129',2027,1,29)];
const LOCAL=E.DATA.events.slice();
const fresh=()=>{ E.DATA.events=LOCAL.slice(); E.DATA.calendar=false; E.DATA.ready=[]; };
const withOn=fn=>{ const a=E.DATA.enabled, b=X.DATA.on; E.DATA.enabled=true; X.DATA.on=true; try{ fn(); } finally{ E.DATA.enabled=a; X.DATA.on=b; fresh(); } };
const hostAt=ms=>{ const h=makeHost(); h.t=ms; return h; };
const NEW=['cacada_chefes','semana_forja','festa_pets'];
const TH=E.DATA.themes;

t('prefixos dos 3 temas no calendário (#2 Caçada, #4 Forja, #6 Pets) com nome e data',()=>{ fresh(); const r=E.setCalendar(CAL); assert.strictEqual(r.n,6); assert.deepStrictEqual(r.ignored,[]);
  assert.deepStrictEqual(E.DATA.events.map(e=>e.base),['festival_eras','cacada_chefes','festival_eras','semana_forja','festival_eras','festa_pets']);
  assert.strictEqual(E.nameOf('cacada_chefes_261204'),'Caçada aos Chefes · 04/12/2026'); assert.strictEqual(E.nameOf('semana_forja_270101'),'Semana da Forja · 01/01/2027');
  assert.strictEqual(E.nameOf('festa_pets_270129'),'Festa dos Pets · 29/01/2027'); fresh(); });
t('mesmo total do Festival: 5 missões, 180 pontos, 50 fragmentos nas missões + 50 na loja; repetível com teto 200',()=>{ for(const b of NEW){ const x=TH[b];
  assert.strictEqual(x.missions.length,5,b); assert.strictEqual(x.missions.reduce((s,m)=>s+m.pts,0),180,b); assert.strictEqual(x.missions.reduce((s,m)=>s+m.prism,0),50,b);
  const p=x.shop.find(s=>s.reward.petFrags); assert.deepStrictEqual([p.limit,p.reward.petFrags.prism,p.needs],[5,10,'prism'],b);
  assert.strictEqual(x.repeat.length,1,b); assert.strictEqual(x.repeat[0].cap,200,b); for(const m of x.missions) assert.ok(E.EVENTS.includes(m.k),b+' '+m.k);
  assert.strictEqual(x.days,14,b); } });
t('ouro escasso: o ouro de cada tema é igual ao do Festival (loja e trilha)',()=>{ const gold=sh=>sh.filter(s=>s.reward.goldk||s.reward.gold).map(s=>[s.cost,s.limit,s.reward.goldk,s.reward.gold]);
  const tg=tr=>tr.map(m=>m.reward.goldk||0); const F=gold(TH.festival_eras.shop), FT=tg(X.DATA.events.default.trail);
  for(const b of NEW){ assert.deepStrictEqual(gold(TH[b].shop),F,b); assert.deepStrictEqual(tg(X.DATA.events[b].trail),FT,b); } });
t('sem sorteio e sem diamante: nenhuma missão de invocação, nenhum ovo, baú, relíquia aleatória ou diamante como prêmio',()=>{ for(const b of NEW){
  for(const m of TH[b].missions) assert.notStrictEqual(m.k,'summon',b);
  for(const s of TH[b].shop) for(const k of Object.keys(s.reward)) assert.ok(['skin','frame','items','essence','forge','food','goldk','petFrags'].includes(k),b+' '+s.id+' '+k);
  for(const m of X.DATA.events[b].trail) for(const k of Object.keys(m.reward)) assert.ok(['goldk','forge','food','essence','frame'].includes(k),b+' trilha '+k); } });
t('chefe do evento por tema (Rei da Caçada com bônus 80) e moldura do grande prêmio própria',()=>{
  assert.deepStrictEqual(NEW.map(b=>X.DATA.events[b].boss.name),['Rei da Caçada','Colosso da Bigorna','Fera Ancestral']);
  assert.deepStrictEqual(NEW.map(b=>X.DATA.events[b].boss.killBonus),[80,60,60]);
  assert.deepStrictEqual(NEW.map(b=>X.DATA.events[b].trail.slice(-1)[0].reward.frame),['cacada','forja','pets']); });
t('skin e moldura ficam ESCONDIDAS até a arte entrar (DATA.ready); com a skin pronta, aparece e entrega',()=>withOn(()=>{ E.setCalendar(CAL); const S={skins:[]}, h=hostAt(BRT(2027,1,5)), id='semana_forja_270101';
  E.ensure(S)[id]={pts:999,rep:0,p:{},c:[],buys:{}}; const ids=()=>E.shop(S,h,id).map(x=>x.id);
  assert.ok(!ids().includes('s_skin_w')&&!ids().includes('s_skin_a')); assert.strictEqual(E.buy(S,h,id,'s_skin_w').reason,'id');
  E.DATA.ready=['forja_weapon']; assert.ok(ids().includes('s_skin_w')&&!ids().includes('s_skin_a'));
  const r=E.buy(S,h,id,'s_skin_w'); assert.ok(r.ok,JSON.stringify(r)); assert.strictEqual(r.got.skin,'forja_weapon','entrega pelo host.addSkin'); S.skins.push('forja_weapon'); assert.strictEqual(E.buy(S,h,id,'s_skin_w').reason,'limite'); assert.strictEqual(E.shop(S,h,id).find(x=>x.id==='s_skin_w').owned,true); }));
t('moldura pronta mas fora do catálogo do Perfil: não vende e não gasta ponto',()=>withOn(()=>{ E.setCalendar(CAL); const S={}, h=hostAt(BRT(2026,12,6)), id='cacada_chefes_261204';
  E.ensure(S)[id]={pts:300,rep:0,p:{},c:[],buys:{}}; E.DATA.ready=['evt_cacada']; assert.ok(E.shop(S,h,id).some(x=>x.id==='s_frame'));
  assert.strictEqual(E.buy(S,h,id,'s_frame').reason,'profile'); assert.strictEqual(S.sys.events[id].pts,300); assert.strictEqual(S.sys.events[id].buys.s_frame,undefined); }));
t('Festival: a Lâmina do Festival fica escondida até a skin de arma existir (PO 14/11); o Traje continua',()=>withOn(()=>{ const S={skins:[]}, h=hostAt(new Date(2026,10,22,12).getTime());
  E.ensure(S).festival_eras={pts:999,rep:0,p:{},c:[],buys:{}}; const ids=E.shop(S,h,'festival_eras').map(x=>x.id); assert.ok(!ids.includes('s_skin_w')); assert.ok(ids.includes('s_skin_a'));
  assert.strictEqual(E.buy(S,h,'festival_eras','s_skin_w').reason,'id'); assert.strictEqual(S.sys.events.festival_eras.pts,999); }));
t('moldura da loja: escondida no Perfil até ficar pronta; pronta, vende uma vez, entrega pelo Perfil e some da compra',()=>withOn(()=>{ const P=Sys.profile, pOn=P.DATA.on; P.setOn(true);
  try{ E.setCalendar(CAL); const S={}, h=hostAt(BRT(2027,2,1)), id='festa_pets_270129'; E.ensure(S)[id]={pts:300,rep:0,p:{},c:[],buys:{}};
    assert.ok(!P.frames(S,h).some(f=>f.id==='evt_pets'),'escondida no Perfil'); assert.ok(!E.shop(S,h,id).some(x=>x.id==='s_frame'),'escondida na loja');
    E.DATA.ready=['evt_pets']; const f=P.frames(S,h).find(x=>x.id==='evt_pets'); assert.ok(f&&!f.owned);
    const r=E.buy(S,h,id,'s_frame'); assert.ok(r.ok,JSON.stringify(r)); assert.strictEqual(r.got.frame,'evt_pets'); assert.strictEqual(S.sys.events[id].pts,200);
    assert.ok(P.frames(S,h).find(x=>x.id==='evt_pets').owned); assert.strictEqual(E.shop(S,h,id).find(x=>x.id==='s_frame').owned,true);
    E.DATA.ready=[]; assert.ok(P.frames(S,h).find(x=>x.id==='evt_pets').owned,'quem tem continua vendo'); assert.ok(P.equip(S,h,'frame','evt_pets').ok);
  } finally{ P.DATA.on=pOn; } }));
t('contadores novos entram no save e completam missão; fora do tema/da janela não contam',()=>withOn(()=>{ E.setCalendar(CAL); const S={}, h=hostAt(BRT(2026,12,6));
  E.track(S,h,'tower',20); E.track(S,h,'evboss',10); E.track(S,h,'petfeed',5);
  const id='cacada_chefes_261204', m=E.missions(S,h,id); assert.ok(m.find(x=>x.id==='c_tower').done); assert.ok(m.find(x=>x.id==='c_evb').done);
  assert.strictEqual(S.sys.events[id].p.petfeed,5,'conta, mas nenhuma missão da Caçada usa'); E.ensure(S); assert.strictEqual(S.sys.events[id].p.tower,20,'ensure não apaga o contador novo');
  assert.ok(E.claimMission(S,h,id,'c_tower').ok); assert.strictEqual(S.sys.events.festa_pets_270129,undefined,'Festa ainda não começou'); }));
t('repetível da Caçada: a cada 5 chefes, 5 pontos, até 200',()=>withOn(()=>{ E.setCalendar(CAL); const S={}, h=hostAt(BRT(2026,12,6)), id='cacada_chefes_261204';
  E.track(S,h,'boss',12); assert.strictEqual(S.sys.events[id].pts,10); E.track(S,h,'boss',1000); assert.strictEqual(S.sys.events[id].pts,200); }));
t('Torre conta andar vencido; pet conta alimentação e nível; chefe do evento conta ataque',()=>withOn(()=>{ E.setCalendar(CAL);
  const h=hostAt(BRT(2026,12,6)), S={}; Sys.level.ensure(S).lvl=60; let w=0; for(let i=0;i<3;i++){ const r=Sys.tower.fight(S,h); if(r.win) w++; }
  assert.ok(w>0); assert.strictEqual(S.sys.events.cacada_chefes_261204.p.tower,w);
  const a=X.attack(S,h,'cacada_chefes_261204'); assert.ok(a.ok,JSON.stringify(a)); assert.strictEqual(S.sys.events.cacada_chefes_261204.p.evboss,1);
  const h2=hostAt(BRT(2027,2,1)), P={}; Sys.pet.ensure(P).food=1e6; const f=Sys.pet.feed(P,h2,3); assert.ok(f.ok);
  assert.strictEqual(P.sys.events.festa_pets_270129.p.petfeed,3); assert.strictEqual(P.sys.events.festa_pets_270129.p.petlevel,3); }));
t('servidor (vm com só events.js + evtrail.js, sem calendário): earned dos temas novos pelo prefixo',()=>{ const vm=require('vm'), fs=require('fs'), ctx=vm.createContext({}); ctx.globalThis=ctx;
  for(const f of ['events','evtrail']) vm.runInContext(fs.readFileSync(path.join(D,f+'.js'),'utf8'),ctx);
  ctx.blob={sys:{events:{semana_forja_270101:{pts:40,rep:0,p:{},c:[],buys:{s_item:1,s_forge:3}}}}};
  assert.strictEqual(vm.runInContext("Sys.evtrail.earned(blob,'semana_forja_270101')",ctx),40+120+75); });
console.log(n+' testes ok');
