// node test/sys/ouro-honesto.test.js — nenhuma tela mostra "+% de ouro" que não soma (PO 14/11): Sys.loot.goldLive é a fonte única
'use strict';
const assert=require('assert');
globalThis.Sys={};
['level','loot','titles','practice','mentors','guild'].forEach(m=>require('../../js/sys/'+m+'.js'));
const L=Sys.loot, T=Sys.titles, P=Sys.practice, M=Sys.mentors, G=Sys.guild;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
t('só Encruzilhada e Fogueira da Guilda somam ouro hoje',()=>{
  assert.strictEqual(L.goldLive('crossroads'),true); assert.strictEqual(L.goldLive('guildFire'),true);
  for(const s of ['titles','practice','mentors','guild']) assert.strictEqual(L.goldLive(s),false,s);
});
t('títulos: o texto não promete ouro; título só de ouro diz "Bônus em breve"; bonus().goldPct = 0',()=>{
  const S={}; T.ensure(S); const gold=T.DATA.titles.find(x=>x.bonus&&x.bonus.goldPct&&Object.keys(x.bonus).length===1);
  const txt=T.bonusText?T.bonusText(gold,1):null; if(txt!=null){ assert.ok(!/ouro/.test(txt),txt); assert.strictEqual(txt,'Bônus em breve'); }
  const o=T.ensure(S); o.unlocked[gold.id]=1; assert.strictEqual(T.bonus(S).goldPct,0);
});
t('prática: a Coleta não treina (soon), não soma, some do conselho e o render diz "Em breve"',()=>{
  const S={}, h={}; const o=P.ensure(S); o.stones=1e6; o.lv.gold=4;
  assert.strictEqual(P.canTrain(S,h,'gold').reason,'soon'); assert.strictEqual(P.bonus(S).goldPct,0);
  assert.ok(!P.advice(S,h).some(a=>a.id==='practice.gold'));
  assert.notStrictEqual(P.canTrain(S,h,'str').reason,'soon','as outras trilhas seguem');
});
t('mentores: Inês e Aurora dizem "Bônus em breve" e não somam ouro',()=>{
  const ines=M.DATA.list.find(m=>m.id==='ines'); const S={}; M.ensure(S);
  if(M.setOn) M.setOn(true); const o=M.ensure(S); o.pts[String(ines.era)]=1e9;
  assert.strictEqual(M.bonus(S).goldPct,0);
});
console.log(n+' testes ok');
