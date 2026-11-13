// Sys.schedule: eventos com hora em Brasília, abertos/próximos/aviso, entradas por janela, bônus, trava do relógio e hora do servidor.
'use strict';
const assert=require('assert');
const {makeHost}=require('./_host.js');
const SC=require('../../js/sys/schedule.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };
const BRT=(y,mo,d,h,mi)=>Date.UTC(y,mo-1,d,h+3,mi||0);   // hora de Brasília (UTC−3) → ms UTC
const host=ms=>{ const h=makeHost(); h.t=ms; h.level=()=>40; return h; };

t('desligado: nada abre',()=>{ assert.deepStrictEqual(SC.active({},host(BRT(2026,11,13,12,5))),[]); assert.strictEqual(SC.next({},host(Date.now())),null); assert.strictEqual(SC.canEnter({},host(0),'world_boss').reason,'off'); });
SC.DATA.on=true;
t('janelas em Brasília: Chefe Mundial às 12h e 20h (30 min), Hora de Ouro 19-20h, fim de semana sáb 10h → dom 22h',()=>{
  const S={}; let h=host(BRT(2026,11,13,12,10));   // sexta 12:10
  assert.deepStrictEqual(SC.active(S,h).map(a=>a.id),['world_boss']); assert.strictEqual(SC.active(S,h)[0].msLeft,20*60000);
  h=host(BRT(2026,11,13,19,30)); assert.deepStrictEqual(SC.active({},h).map(a=>a.id),['golden_hour']);
  h=host(BRT(2026,11,13,20,15)); assert.deepStrictEqual(SC.active({},h).map(a=>a.id).sort(),['world_boss']);
  h=host(BRT(2026,11,14,11,0)); assert.ok(SC.active({},h).some(a=>a.id==='weekend_tourney'),'sábado 11h'); h=host(BRT(2026,11,15,21,59)); assert.ok(SC.active({},h).some(a=>a.id==='weekend_tourney'),'domingo 21:59');
  h=host(BRT(2026,11,15,22,1)); assert.ok(!SC.active({},h).some(a=>a.id==='weekend_tourney'),'fechou domingo 22h');
  h=host(BRT(2026,11,17,13,30)); assert.ok(SC.active({},h).some(a=>a.id==='forge_blessing'),'terça 13h'); h=host(BRT(2026,11,18,13,30)); assert.ok(!SC.active({},h).some(a=>a.id==='forge_blessing'),'quarta não');
});
t('próximo com contagem e aviso 10 min antes',()=>{ const h=host(BRT(2026,11,13,11,52)); const nx=SC.next({},h); assert.strictEqual(nx.id,'world_boss'); assert.strictEqual(nx.msToStart,8*60000);
  assert.deepStrictEqual(SC.notices({},h).map(x=>x.id),['world_boss']); assert.deepStrictEqual(SC.notices({},host(BRT(2026,11,13,11,40))),[],'20 min antes: ainda não avisa'); });
t('entrada: nível, janela aberta e 2 ataques por janela do Chefe Mundial; bônus da Hora de Ouro',()=>{
  const S={}; let h=host(BRT(2026,11,13,12,5)); h.level=()=>10; assert.strictEqual(SC.canEnter(S,h,'world_boss').reason,'level');
  h.level=()=>40; assert.ok(SC.enter(S,h,'world_boss').ok); assert.strictEqual(SC.enter(S,h,'world_boss').left,0); assert.strictEqual(SC.canEnter(S,h,'world_boss').reason,'entries');
  h=host(BRT(2026,11,13,20,5)); assert.ok(SC.canEnter(S,h,'world_boss').ok,'janela das 20h é outra'); assert.strictEqual(SC.canEnter({},host(BRT(2026,11,13,15,0)),'world_boss').reason,'closed');   // save novo: o S já viu 20h05 (a trava não deixa voltar)
  assert.strictEqual(SC.perks({},host(BRT(2026,11,13,19,10))).goldPct,100); assert.strictEqual(SC.perks({},host(BRT(2026,11,13,18,10))).goldPct,0);
  const h2=host(BRT(2026,11,13,19,10)); h2.level=()=>5; assert.strictEqual(SC.perks({},h2).goldPct,0,'abaixo do nível não ganha');
});
t('trava do relógio: voltar a hora não reabre a janela já gasta; servidor manda quando conectado',()=>{
  const S={}; const h=host(BRT(2026,11,13,12,10)); SC.enter(S,h,'world_boss'); SC.enter(S,h,'world_boss');
  h.t=BRT(2026,11,13,11,0); assert.strictEqual(SC.now(S,h),BRT(2026,11,13,12,10),'voltou o relógio: vale o maior já visto'); assert.strictEqual(SC.canEnter(S,h,'world_boss').reason,'entries');
  SC.setServerTime(BRT(2026,11,13,20,5),h); assert.ok(SC.canEnter(S,h,'world_boss').ok,'hora do servidor: janela das 20h'); SC.setServerTime(null,h);
  const S2={sys:{schedule:{seen:'x',entered:{'lixo':3,'world_boss@1':2}}}}; SC.ensure(S2); assert.deepStrictEqual(S2.sys.schedule.entered,{'world_boss@1':2});
});
t('agenda legível para o dono: 6 eventos, nenhum prêmio com diamante',()=>{ const a=SC.agendaText(); assert.strictEqual(a.length,6); assert.ok(a.every(e=>!/diamante|💎|gema/i.test(e.prize))); });
SC.DATA.on=false;
console.log(`ok: ${n} testes`);
