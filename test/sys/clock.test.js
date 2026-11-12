// node test/sys/clock.test.js — relógio confiável e bônus de retorno (Sys.clock, atrás de chave)
'use strict';
const assert=require('assert');
const L=require('../../js/sys/loot.js'), K=require('../../js/sys/clock.js'), P=require('../../js/sys/pass.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const H=3600000, D=86400000;
/* host com relógio do aparelho (raw) e tempo real da sessão (perf) controláveis */
function dev(start){ const d={raw:start,perf:0}; d.host={rawNow:()=>d.raw,perf:()=>d.perf}; return d; }

t('desligado (padrão): now() é o relógio do aparelho e não há retorno',()=>{
  K._reset(); assert.strictEqual(K.DATA.on,false); const S={}, d=dev(1e12);
  assert.strictEqual(K.now(S,d.host),1e12); d.raw-=5*D; assert.strictEqual(K.now(S,d.host),1e12-5*D,'desligado: volta junto');
  const r=K.checkIn(S,d.host); assert.strictEqual(r.added,0); assert.strictEqual(K.takeRested(S),false);
});

t('RELÓGIO VOLTADO: o tempo não anda para trás (diárias não reabrem); 10 min de tolerância',()=>{
  K._reset(); K.DATA.on=true; const S={}, d=dev(new Date(2026,10,12,10).getTime());
  const a=K.now(S,d.host); d.perf+=H; d.raw+=H; const b=K.now(S,d.host); assert.strictEqual(b-a,H);
  K._reset(); d.raw-=2*D; assert.strictEqual(K.now(S,d.host),b,'voltar 2 dias (nova sessão): fica no maior instante visto');
  assert.ok(S.sys.clock.flags>=1,'marcado');
  K._reset(); const S2={}, d2=dev(1e12); K.now(S2,d2.host); d2.raw-=5*60*1000; assert.ok(K.now(S2,d2.host)>=1e12-5*60*1000,'5 min para trás: tolerado');
  K.DATA.on=false;
});

t('RELÓGIO ADIANTADO COM O APP ABERTO: não conta; o dia segue o tempo real da sessão',()=>{
  K._reset(); K.DATA.on=true; const S={}, start=new Date(2026,10,12,22).getTime(), d=dev(start);
  K.now(S,d.host); d.perf+=30*60*1000; d.raw+=3*D;                       // 30 min reais, Date pulou 3 dias
  const g=K.now(S,d.host); assert.ok(Math.abs(g-(start+30*60*1000))<1000,'segue o tempo real');
  const h=makeHost({}); h.now=()=>K.now(S,d.host); assert.strictEqual(P.dayKey(h.now()),'2026-11-12','não virou o dia');
  K.DATA.on=false;
});

t('OFFLINE: segundos confiáveis; relógio voltado dá 0',()=>{
  K._reset(); K.DATA.on=true; const S={}, d=dev(1e12); const seen=K.now(S,d.host);
  K._reset(); d.raw=seen+5*H; assert.strictEqual(Math.round(K.offlineSeconds(S,d.host,seen)),5*3600);
  K._reset(); d.raw=seen-3*D; assert.strictEqual(K.offlineSeconds(S,d.host,seen+5*H),0);
  K.DATA.on=false;
});

t('RETORNO: dias perdidos viram XP descansada (meio dia de abates por dia, até 3); abate em dobro de XP e ouro',()=>{
  K._reset(); K.DATA.on=true; const S={}, d=dev(new Date(2026,10,12,10).getTime());
  assert.strictEqual(K.checkIn(S,d.host).missed,0,'primeiro acesso não dá nada');
  K._reset(); d.raw+=D; let r=K.checkIn(S,d.host); assert.strictEqual(r.missed,0,'dia seguinte: sem falta');
  K._reset(); d.raw+=3*D; r=K.checkIn(S,d.host); assert.strictEqual(r.missed,2); assert.strictEqual(r.added,960);
  K._reset(); d.raw+=10*D; r=K.checkIn(S,d.host); assert.strictEqual(r.rested,3*480,'nunca mais de 3 dias');
  const h=makeHost({seed:3}); const base=L.rollKill({},h,{gold:100}); const g2=L.rollKill(S,makeHost({seed:3}),{gold:100});
  assert.ok(g2.rested&&Math.abs(g2.gold-base.gold*2)<=2,'ouro em dobro'); assert.strictEqual(g2.xp,base.xp*2,'XP em dobro');
  assert.strictEqual(K.rested(S),3*480-1);
  S.sys.clock.rested=0; assert.strictEqual(L.rollKill(S,makeHost({seed:3}),{gold:100}).rested,false,'saldo zerado: normal');
  K.DATA.on=false;
});

t('save antigo e lixo',()=>{ const S={sys:{clock:{max:'x',rested:-3,lastDay:5}}}; K.ensure(S); assert.deepStrictEqual([S.sys.clock.max,S.sys.clock.rested,S.sys.clock.lastDay],[0,0,'']); assert.throws(()=>K.ensure(null)); });
console.log(`\nclock: ${n} testes ok`);
