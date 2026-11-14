// node test/sys/minigame.test.js — Sys.minigame (desligado): minijogo de timing, tema troca a cada 14 dias a partir do Festival das Eras,
// 3 tentativas grátis por dia (nenhuma paga), prêmio fixo pela melhor faixa do dia e marcos do ciclo, só materiais
'use strict';
const assert=require('assert');
globalThis.Sys={};
['stats','loot','practice','events','minigame'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const M=Sys.minigame;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ const a=M.DATA.on; M.DATA.on=true; try{ fn(); } finally{ M.DATA.on=a; } };
const at=(d,h)=>Date.parse(d+'T'+String(h==null?12:h).padStart(2,'0')+':00:00-03:00');   // hora de Brasília
const host=d=>makeHost({now:at(d||'2026-11-21')});
const perfect=r=>r.centers.slice();

t('DESLIGADO por padrão',()=>{ assert.strictEqual(M.DATA.on,false); assert.strictEqual(M.start({},host()).reason,'off'); assert.strictEqual(M.view({},host()).reason,'off'); });
t('calendário: começa com o Festival (20/11), 14 dias por tema em rodízio, dia de Brasília',()=>{
  assert.strictEqual(M.cycleAt(at('2026-11-19',23)).id,-1); const c0=M.cycleAt(at('2026-11-20',0)); assert.strictEqual(c0.id,0); assert.strictEqual(c0.game.id,'forja'); assert.strictEqual(c0.daysLeft,14);
  assert.strictEqual(M.cycleAt(at('2026-12-03',23)).id,0); assert.strictEqual(M.cycleAt(at('2026-12-04',0)).game.id,'pesca'); assert.strictEqual(M.cycleAt(at('2026-12-18')).game.id,'escavacao'); assert.strictEqual(M.cycleAt(at('2027-01-01')).game.id,'forja');
  assert.strictEqual(c0.end-c0.start,14*864e5); assert.strictEqual(c0.start,at('2026-11-20',0));
  withOn(()=>{ const v=M.view({},host('2026-11-15')); assert.ok(!v.open&&v.reason==='soon'&&v.startsAt===at('2026-11-20',0)); }); });
t('nota: perfeito 100, bom 60, raspou 25, errou 0; 10 toques = 1000; faixas Bronze 300 / Prata 550 / Ouro 800',()=>{
  assert.strictEqual(M.grade(0.5,0.5,0.2).pts,100); assert.strictEqual(M.grade(0.56,0.5,0.2).pts,60); assert.strictEqual(M.grade(0.59,0.5,0.2).pts,25); assert.strictEqual(M.grade(0.7,0.5,0.2).pts,0); assert.strictEqual(M.grade(null,0.5,0.2).pts,0); assert.strictEqual(M.grade(NaN,0.5,0.2).pts,0);
  const cs=M.centers(9,0.18); assert.strictEqual(M.score(cs,9,0.18).score,1000); assert.strictEqual(M.score([],9,0.18).score,0); assert.ok(cs.every(c=>c-0.09>=0&&c+0.09<=1));
  assert.deepStrictEqual([M.tierOf(299),M.tierOf(300),M.tierOf(550),M.tierOf(800)],[null,'bronze','prata','ouro']); });
t('3 tentativas grátis por dia (start gasta, desistir não devolve); nenhuma forma de comprar mais; zera no dia seguinte',()=>withOn(()=>{ const S={}, h=host();
  for(let i=0;i<3;i++) assert.ok(M.start(S,h).ok); assert.strictEqual(M.start(S,h).reason,'tries'); assert.strictEqual(M.view(S,h).paidTries,false);
  assert.ok(!Object.keys(M).some(k=>/buy|pay|^ad|gem|extra/i.test(k)),'API sem compra'); h.t+=864e5; assert.strictEqual(M.view(S,h).triesLeft,3); }));
t('partida: finish sem start recusa; melhor do dia fica; dia com Bronze+ conta no ciclo uma vez',()=>withOn(()=>{ const S={}, h=host();
  assert.strictEqual(M.finish(S,h,[]).reason,'run'); let r=M.start(S,h); let f=M.finish(S,h,r.centers.map((c,i)=>i<4?c:null)); assert.strictEqual(f.score,400); assert.strictEqual(f.tier,'bronze');
  assert.strictEqual(M.finish(S,h,[]).reason,'run','partida acabou'); r=M.start(S,h); f=M.finish(S,h,[]); assert.strictEqual(f.best,400); assert.strictEqual(f.record,false);
  r=M.start(S,h); f=M.finish(S,h,perfect(r)); assert.strictEqual(f.bestTier,'ouro'); assert.strictEqual(M.view(S,h).days,1); }));
t('prêmio do dia: pela melhor faixa, 1 vez; sem faixa nada; só materiais (sem ouro/diamante)',()=>withOn(()=>{ const S={}, h=host(); assert.strictEqual(M.claimDay(S,h).reason,'tier');
  const r=M.start(S,h); M.finish(S,h,r.centers.map((c,i)=>i<6?c:null)); const c=M.claimDay(S,h); assert.ok(c.ok); assert.strictEqual(c.tier,'prata'); assert.deepStrictEqual(c.reward,{forge:5,food:20});
  assert.strictEqual(M.claimDay(S,h).reason,'claimed'); assert.strictEqual(h.gold,0); assert.strictEqual(h.gems,0);
  for(const k in M.DATA.dayReward) for(const x of ['gold','goldk','gems']) assert.ok(!(x in M.DATA.dayReward[k])); for(const m of M.DATA.milestones) for(const x of ['gold','goldk','gems']) assert.ok(!(x in m.reward)); }));
t('marcos do ciclo: 3, 7 e 10 dias com Bronze+; uma vez cada; ciclo novo zera',()=>withOn(()=>{ const S={}, h=host('2026-11-20');
  for(let d=0;d<10;d++){ const r=M.start(S,h); M.finish(S,h,perfect(r)); if(d===1) assert.strictEqual(M.claimMilestone(S,h,3).reason,'days'); h.t+=864e5; }
  h.t-=864e5; assert.strictEqual(M.view(S,h).days,10); for(const k of [3,7,10]) assert.ok(M.claimMilestone(S,h,k).ok,k); assert.strictEqual(M.claimMilestone(S,h,3).reason,'claimed'); assert.strictEqual(M.claimMilestone(S,h,5).reason,'id');
  assert.strictEqual(Sys.practice.ensure(S).stones,5); h.t=at('2026-12-05'); const v=M.view(S,h); assert.strictEqual(v.days,0); assert.strictEqual(v.game.id,'pesca'); }));
t('view: tabela de faixas com prêmio, evento ativo do Sys.events (só leitura), mesma semente = mesmas faixas no servidor',()=>withOn(()=>{ const S={}, h=host();
  const ev=Sys.events.DATA.enabled; Sys.events.DATA.enabled=true; try{ const v=M.view(S,h); assert.strictEqual(v.event&&v.event.id,'festival_eras'); assert.strictEqual(v.tiers.length,3); assert.strictEqual(v.milestones.length,3); } finally{ Sys.events.DATA.enabled=ev; }
  assert.deepStrictEqual(M.centers(123,0.16),M.centers(123,0.16)); }));
console.log(n+' testes ok');
