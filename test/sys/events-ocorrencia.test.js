// node test/sys/events-ocorrencia.test.js — calendário do servidor com UM id por ocorrência (<tema>_<AAMMDD>, docs/CALENDARIO_EVENTOS.md):
// tema pelo prefixo, progresso/loja/trilha/ranking por id completo, ocorrência nova zera, recarregar não zera, prefixo desconhecido é ignorado.
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','loot','events','evtrail','titles','profile','eventrank'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const E=Sys.events, X=Sys.evtrail, R=Sys.eventRank;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const DAY=86400000, BRT=(y,m,d)=>Date.UTC(y,m-1,d,3);   // meia-noite de Brasília em ms UTC
const occ=(id,y,m,d,days)=>{ const s=BRT(y,m,d), e=s+days*DAY; return {id,start:s,end:e,graceEnd:e+2*DAY,requires:['events.enabled']}; };
const CAL=[occ('festival_eras_261120',2026,11,20,14),occ('festival_eras_261204',2026,12,4,14)];
const LOCAL=E.DATA.events.slice();
const fresh=()=>{ E.DATA.events=LOCAL.slice(); E.DATA.calendar=false; };
const withOn=fn=>{ const a=E.DATA.enabled, b=X.DATA.on; E.DATA.enabled=true; X.DATA.on=true; try{ fn(); } finally{ E.DATA.enabled=a; X.DATA.on=b; fresh(); } };
const hostAt=ms=>{ const h=makeHost(); h.t=ms; return h; };

t('tema pelo prefixo: id puro, id com data válida; data inválida ou tema desconhecido = null',()=>{
  assert.strictEqual(E.base('festival_eras'),'festival_eras'); assert.strictEqual(E.base('festival_eras_261120'),'festival_eras');
  assert.strictEqual(E.base('festival_eras_261320'),null,'mês 13'); assert.strictEqual(E.base('festival_eras_260231'),null,'31/02');
  assert.strictEqual(E.base('halloween_261031'),null); assert.strictEqual(E.base('Festival_eras_261120'),null); assert.strictEqual(E.base(null),null);
  assert.strictEqual(E.nameOf('festival_eras_261204'),'Festival das Eras · 04/12/2026'); assert.strictEqual(E.nameOf('festival_eras'),'Festival das Eras'); });
t('setCalendar: aceita as ocorrências válidas, ignora prefixo desconhecido, datas ruins, > 60 dias e id repetido',()=>{ fresh();
  const bad=[{id:'xyz_261120',start:1,end:2,graceEnd:3},{id:'festival_eras_270101',start:5,end:4,graceEnd:6},{id:'festival_eras_270102',start:0,end:61*DAY,graceEnd:62*DAY},CAL[0],{id:'../x'},null];
  const r=E.setCalendar(CAL.concat(bad)); assert.ok(r.ok); assert.strictEqual(r.n,2); assert.strictEqual(r.ignored.length,6);
  assert.deepStrictEqual(E.DATA.events.map(e=>e.id),['festival_eras_261120','festival_eras_261204']); assert.strictEqual(E.DATA.events[0].base,'festival_eras');
  assert.strictEqual(E.DATA.events[0].missions.length,5,'regras do tema'); assert.deepStrictEqual(E.DATA.events[0].requires,['events.enabled']);
  assert.strictEqual(E.setCalendar('lixo').ok,false); assert.strictEqual(E.DATA.events.length,2,'lista inválida não muda nada'); fresh(); });
t('fases pelo graceEnd do servidor (meia-noite de Brasília) e 2 ocorrências juntas na virada (loja da 1ª + 2ª ativa)',()=>withOn(()=>{ E.setCalendar(CAL); const a=E.DATA.events[0];
  assert.strictEqual(E.phase(a,hostAt(BRT(2026,11,20)-1)),'antes'); assert.strictEqual(E.phase(a,hostAt(BRT(2026,11,20))),'ativo');
  const S={}, l=E.list(S,hostAt(BRT(2026,12,5))); assert.deepStrictEqual(l.map(x=>[x.id,x.phase]),[['festival_eras_261120','loja'],['festival_eras_261204','ativo']]);
  assert.strictEqual(l[0].endsAt,BRT(2026,12,6)); assert.strictEqual(E.phase(a,hostAt(BRT(2026,12,6))),'fim'); }));
t('ocorrência NOVA começa do zero: pontos, missões, compras com limite e trilha separados por id',()=>withOn(()=>{ E.setCalendar(CAL); const S={skins:[]};
  const h1=hostAt(BRT(2026,11,25)); E.track(S,h1,'kill',2000); assert.ok(E.claimMission(S,h1,'festival_eras_261120','f_kill').ok);
  S.sys.events.festival_eras_261120.pts=500; assert.ok(E.buy(S,h1,'festival_eras_261120','s_item').ok); assert.strictEqual(E.buy(S,h1,'festival_eras_261120','s_item').reason,'limite');
  assert.ok(X.claimTrail(S,h1,'festival_eras_261120',50).ok); assert.strictEqual(X.earned(S,'festival_eras_261120'),500);
  const h2=hostAt(BRT(2026,12,8)); E.track(S,h2,'kill',10);
  const s2=S.sys.events.festival_eras_261204; assert.strictEqual(s2.pts,0); assert.deepStrictEqual(s2.c,[]); assert.deepStrictEqual(s2.buys,{}); assert.strictEqual(s2.p.kill,10);
  assert.strictEqual(E.missions(S,h2,'festival_eras_261204').find(m=>m.id==='f_kill').claimed,false);
  s2.pts=200; assert.ok(E.buy(S,h2,'festival_eras_261204','s_item').ok,'limite de compra não é herdado');
  assert.strictEqual(X.earned(S,'festival_eras_261204'),200); assert.strictEqual(X.trail(S,h2,'festival_eras_261204').milestones[0].claimed,false,'trilha nova');
  assert.strictEqual(S.sys.events.festival_eras_261120.buys.s_item,1,'a ocorrência anterior fica como estava (até o fim da carência)'); }));
t('a MESMA ocorrência não zera ao recarregar (save em JSON, módulo sem calendário até o servidor responder; boot sem rede usa o calendário do save)',()=>withOn(()=>{
  let S={}; E.setCalendar(CAL,S); const h=hostAt(BRT(2026,11,22)); E.track(S,h,'kill',600); S=JSON.parse(JSON.stringify(S));
  fresh(); E.ensure(S); assert.strictEqual(S.sys.events.festival_eras_261120.p.kill,600,'ensure sem calendário não apaga ocorrência de tema conhecido');
  const l=E.list(S,h); assert.deepStrictEqual(l.map(x=>x.id),['festival_eras_261120'],'calendário restaurado do save (S.sys.evcal)'); assert.strictEqual(l[0].pts,10,"600 abates = 2 × 5 pontos");
  E.track(S,h,'kill',400); assert.strictEqual(S.sys.events.festival_eras_261120.p.kill,1000);
  fresh(); E.setCalendar(CAL,S); assert.strictEqual(S.sys.events.festival_eras_261120.p.kill,1000,'o servidor manda a mesma lista: nada zera'); }));
t('prefixo desconhecido no save é apagado com segurança; ocorrência sem id no calendário não abre (fase fim)',()=>withOn(()=>{ E.setCalendar(CAL);
  const S={sys:{events:{halloween_261031:{pts:99},festival_eras_261320:{pts:5},festival_eras_270115:{pts:7,p:{},c:[],buys:{}}}}}; E.ensure(S);
  assert.deepStrictEqual(Object.keys(S.sys.events),['festival_eras_270115']); const h=hostAt(BRT(2027,1,16));
  assert.strictEqual(E.buy(S,h,'festival_eras_270115','s_gold').reason,'evento'); assert.strictEqual(E.claimMission(S,h,'halloween_261031','f_kill').reason,'evento');
  assert.strictEqual(X.claimTrail(S,h,'festival_eras_270115',50).reason,'closed'); assert.strictEqual(X.earned(S,'halloween_261031'),0); }));
t('estado do evento LOCAL sem sufixo (festival_eras) passa para a ocorrência do mesmo dia quando o calendário chega',()=>withOn(()=>{
  const S={}, h=hostAt(new Date(2026,10,21,12).getTime()); E.track(S,h,'kill',300); X.ensure(S).festival_eras={got:[50],hp0:0,dmg:0,day:'',att:0,killed:false,bossPts:0};
  E.setCalendar(CAL,S); assert.strictEqual(S.sys.events.festival_eras,undefined); assert.strictEqual(S.sys.events.festival_eras_261120.p.kill,300);
  assert.deepStrictEqual(S.sys.evtrail.festival_eras_261120.got,[50]); }));
t('cleanup: apaga a ocorrência (e a trilha dela) depois do graceEnd; a seguinte fica',()=>withOn(()=>{ E.setCalendar(CAL); const S={};
  E.track(S,hostAt(BRT(2026,11,21)),'kill',1); E.track(S,hostAt(BRT(2026,12,5)),'kill',1); X.ensure(S).festival_eras_261120={got:[]};
  E.cleanup(S,hostAt(BRT(2026,12,6))); assert.deepStrictEqual(Object.keys(S.sys.events),['festival_eras_261204']); assert.strictEqual(S.sys.evtrail.festival_eras_261120,undefined); }));
t('skin já possuída não é vendida de novo na ocorrência seguinte',()=>withOn(()=>{ E.setCalendar(CAL); const S={skins:['festival_weapon']}, h=hostAt(BRT(2026,12,8));
  E.ensure(S).festival_eras_261204={pts:999,rep:0,p:{},c:[],buys:{}}; const it=E.shop(S,h,'festival_eras_261204').find(x=>x.id==='s_skin_w');
  assert.strictEqual(it.owned,true); assert.strictEqual(it.canBuy,false); assert.strictEqual(E.buy(S,h,'festival_eras_261204','s_skin_w').reason,'possui'); }));
t('ranking por id completo: nome com a data; chaves do prêmio passam no idRe',()=>{ const k=R.prizeFor('festival_eras_261204','top1').frame;
  assert.strictEqual(k,'evt_festival_eras_261204_top1'); assert.ok(R.DATA.idRe.test(k)); assert.strictEqual(R.nameOf(k),'Festival das Eras · 04/12/2026 · Top 1%'); });
t('servidor (vm com só events.js + evtrail.js, sem calendário): earned da ocorrência pelo tema',()=>{ const vm=require('vm'), fs=require('fs'), ctx=vm.createContext({}); ctx.globalThis=ctx;
  for(const f of ['events','evtrail']) vm.runInContext(fs.readFileSync(require.resolve('../../js/sys/'+f+'.js'),'utf8'),ctx);
  ctx.blob={sys:{events:{festival_eras_261204:{pts:40,rep:0,p:{},c:[],buys:{s_item:1,s_gold:2}},festival_eras_261120:{pts:999}}}};
  assert.strictEqual(vm.runInContext("Sys.evtrail.earned(blob,'festival_eras_261204')",ctx),40+120+40); assert.strictEqual(vm.runInContext("Sys.evtrail.earned(blob,'xyz_261204')",ctx),0); });
console.log(n+' testes ok');
