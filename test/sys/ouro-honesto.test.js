// node test/sys/ouro-honesto.test.js — bônus de ouro do abate (dono 14/11): todas as fontes ligadas no Sys.loot.goldLive, teto +25% no total,
// títulos e prática até +10% cada (a Coleta para no Nv 20 e devolve as pedras dos níveis a mais), o que passa vira XP até +10%. Nenhuma tela mostra ouro que não soma.
'use strict';
const assert=require('assert');
globalThis.Sys={};
['level','loot','titles','practice','mentors','guild'].forEach(m=>require('../../js/sys/'+m+'.js'));
const L=Sys.loot, T=Sys.titles, P=Sys.practice, M=Sys.mentors;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
t('todas as fontes ligadas na chave única',()=>{ for(const s of ['crossroads','guildFire','titles','practice','mentors','guild']) assert.strictEqual(L.goldLive(s),true,s); });
t('títulos: o texto mostra o ouro de verdade e soma no teto de +10%',()=>{
  const S={}; const o=T.ensure(S); for(const x of T.DATA.titles) if(x.bonus&&x.bonus.goldPct) o.unlocked[x.id]=1;
  o.featured='kill10k'; const raw=T.bonus(S).goldPct; assert.ok(raw>10,'os títulos de ouro (com o destaque) passam de 10');
  const b=L.goldBreakdown(S); assert.strictEqual(b.sources.titles,raw); assert.strictEqual(b.applied.titles,10); assert.strictEqual(b.pct,10);
  assert.strictEqual(b.overXp,Math.min(10,Math.round((raw-10)*10)/10),'o que passou vira XP');
  const g=T.DATA.titles.find(x=>x.bonus&&x.bonus.goldPct&&Object.keys(x.bonus).length===1); assert.ok(/ouro/.test(T.bonusText(g,1)));
});
t('prática: a Coleta para no Nv 20 (+10%) e devolve as pedras de quem passou',()=>{
  const S={}, h={eraMax:()=>6}; const o=P.ensure(S); o.stones=1e6; o.lv.gold=20;
  assert.strictEqual(P.capT(P.DATA.tracks.find(x=>x.id==='gold'),h),20); S.sys.level={lvl:60,xp:0}; assert.strictEqual(P.canTrain(S,h,'gold').reason,'cap'); assert.strictEqual(P.bonus(S).goldPct,10);
  const S2={sys:{practice:{stones:0,lv:{gold:24},spent:9999}}}; const o2=P.ensure(S2); assert.strictEqual(o2.lv.gold,20); assert.ok(o2.stones>0&&o2.refund===o2.stones,'pedras devolvidas');
  const st=o2.stones; P.ensure(S2); assert.strictEqual(P.ensure(S2).stones,st,'devolve uma vez só');
  assert.ok(!P.advice(S,h).some(a=>a.id==='practice.gold'),'no teto sai do conselho');
});
t('teto total +25% e XP do excesso no Sys.level',()=>{
  const S={}; const o=T.ensure(S); for(const x of T.DATA.titles) if(x.bonus&&x.bonus.goldPct) o.unlocked[x.id]=1; P.ensure(S).lv.gold=20;
  const Mo=M.ensure(S); if(M.setOn) M.setOn(true); for(const m of M.DATA.list) if(m.stat==='goldPct') Mo.pts[String(m.era)]=1e9;
  const b=L.goldBreakdown(S); assert.ok(b.pct<=25); assert.ok(b.overXp<=10); assert.strictEqual(L.goldPerks(S).goldPct,b.pct);
  if(M.setOn) M.setOn(false);
});
console.log(n+' testes ok');
