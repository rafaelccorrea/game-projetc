// node test/sys/eventrank.test.js — Sys.eventRank (desligado): faixas top 1/10/50% e participação, prêmio só visual (moldura no Sys.profile,
// título sem bônus no Sys.titles, selo próprio), gravação idempotente pelo correio, espelho do GET /events/:id/rank, roda sozinho no vm
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','loot','events','evtrail','titles','profile','eventrank'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const R=Sys.eventRank, P=Sys.profile, T=Sys.titles;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ const a=R.DATA.on, b=P.DATA.on; R.DATA.on=true; P.DATA.on=true; try{ fn(); } finally{ R.DATA.on=a; P.DATA.on=b; } };

t('DESLIGADO por padrão: view off, grantVisual recusa',()=>{ assert.strictEqual(R.DATA.on,false); assert.strictEqual(R.view({},makeHost(),'festival_eras').on,false); assert.strictEqual(R.grantVisual({},makeHost(),{badge:'evt_part'}).reason,'off'); });
t('faixas: top 1% (mín. 1 jogador), 10%, 50%, participação; posição inválida = sem faixa',()=>{
  assert.strictEqual(R.bandOf(1,10),'top1'); assert.strictEqual(R.bandOf(2,10),'top50','10 jogadores: o top 10% é só o 1º'); assert.strictEqual(R.bandOf(6,10),'part'); assert.strictEqual(R.bandOf(1,1),'top1');
  assert.strictEqual(R.bandOf(2,100),'top10'); assert.strictEqual(R.bandOf(10,100),'top10'); assert.strictEqual(R.bandOf(11,100),'top50'); assert.strictEqual(R.bandOf(51,100),'part');
  assert.strictEqual(R.bandOf(52,5120),'top1'); assert.strictEqual(R.bandOf(53,5120),'top10'); assert.strictEqual(R.bandOf(512,5120),'top10'); assert.strictEqual(R.bandOf(2560,5120),'top50'); assert.strictEqual(R.bandOf(2561,5120),'part');
  assert.strictEqual(R.bandOf(0,10),null); assert.strictEqual(R.bandOf(11,10),null); assert.deepStrictEqual(R.cuts(5120),{top1:52,top10:512,top50:2560}); });
t('prêmio: ids do contrato; top50 sem moldura; participação = selo evt_part; nada de ouro/atributo',()=>{
  assert.deepStrictEqual(R.prizeFor('festival_eras','top1'),{frame:'evt_festival_eras_top1',title:'evt_festival_eras_top1',badge:'evt_festival_eras_top1'});
  assert.deepStrictEqual(R.prizeFor('festival_eras','top10'),{frame:'evt_festival_eras_top10',title:'evt_festival_eras_top10',badge:'evt_festival_eras_top10'});
  assert.deepStrictEqual(R.prizeFor('festival_eras','top50'),{title:'evt_festival_eras_top50',badge:'evt_festival_eras_top50'});
  assert.deepStrictEqual(R.prizeFor('festival_eras','part'),{badge:'evt_part'}); assert.strictEqual(R.prizeFor('Festival Eras!','top1'),null); assert.strictEqual(R.prizeFor('x','top99'),null); });
t('grantVisual: moldura entra no perfil (equipável), título sem poder, selo guardado; idempotente; id fora do padrão recusa',()=>withOn(()=>{ const S={}, h=makeHost();
  const b0=JSON.stringify(T.bonus(S)); const r=R.grantVisual(S,h,R.prizeFor('festival_eras','top1')); assert.ok(r.ok); assert.strictEqual(r.fresh.length,3);
  assert.ok(P.DATA.frames.some(f=>f.id==='evt_festival_eras_top1'&&f.need.grant)); assert.ok(P.equip(S,h,'frame','evt_festival_eras_top1').ok,'moldura equipável');
  assert.ok(T.isUnlocked(S,'evt_festival_eras_top1')); assert.strictEqual(JSON.stringify(T.bonus(S)),b0,'título sem bônus de poder');
  assert.deepStrictEqual(R.badges(S),[{id:'evt_festival_eras_top1',name:'Festival das Eras · Top 1%'}]);
  assert.strictEqual(R.grantVisual(S,h,R.prizeFor('festival_eras','top1')).fresh.length,0,'2ª carta não duplica');
  assert.strictEqual(R.grantVisual(S,h,{frame:'ouro'}).reason,'id','não dá moldura de outro sistema'); assert.strictEqual(R.grantVisual(S,h,{badge:'qualquer'}).reason,'id');
  R.grantVisual(S,h,{badge:'evt_part'}); assert.strictEqual(R.badges(S)[1].name,'Participou de um evento'); }));
t('perfil desligado na hora: o prêmio fica guardado e o sync aplica depois',()=>{ const S={}, h=makeHost(); R.DATA.on=true;
  try{ R.grantVisual(S,h,R.prizeFor('festival_eras','top10')); assert.ok(R.ensure(S).owned.frames.includes('evt_festival_eras_top10')); P.DATA.on=true; assert.ok(R.sync(S,h)>=1); assert.ok(P.ensure(S).grants.includes('evt_festival_eras_top10')); }
  finally{ R.DATA.on=false; P.DATA.on=false; } });
t('espelho: applyRank guarda posição, faixa calculada AQUI (não a mandada), top 20 com nome cortado; view sem servidor mostra só os pontos',()=>withOn(()=>{ const S={}, h=makeHost();
  const v0=R.view(S,h,'festival_eras'); assert.ok(v0.on&&!v0.online&&v0.rank===null&&v0.band===null&&v0.bands.length===4&&v0.powerFree);
  const top=[]; for(let i=0;i<30;i++) top.push({rank:i+1,name:'n'.repeat(60),points:999-i});
  assert.strictEqual(R.applyRank(S,h,{event:'festival_eras',points:420,rank:37,total:5120,band:'part',top}).band,'top1');
  const v=R.view(S,h,'festival_eras'); assert.ok(v.online&&v.band==='top1'&&v.bandName==='Top 1%'&&v.top.length===20&&v.top[0].name.length===24); assert.deepStrictEqual(v.prize,R.prizeFor('festival_eras','top1'));
  assert.strictEqual(R.applyRank(S,h,{event:'../x'}).reason,'data'); }));
t('vm: bandOf e prizeFor rodam com só este arquivo (o servidor carrega)',()=>{ const vm=require('vm'), fs=require('fs'), ctx=vm.createContext({});
  vm.runInContext(fs.readFileSync(require.resolve('../../js/sys/eventrank.js'),'utf8'),ctx);
  assert.strictEqual(vm.runInContext("Sys.eventRank.bandOf(512,5120)",ctx),'top10'); assert.strictEqual(vm.runInContext("JSON.stringify(Sys.eventRank.prizeFor('festival_eras','top50'))",ctx),JSON.stringify(R.prizeFor('festival_eras','top50'))); });
console.log(n+' testes ok');
