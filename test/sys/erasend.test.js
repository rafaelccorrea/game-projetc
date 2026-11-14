// node test/sys/erasend.test.js — Sys.erasEnd: prêmios do fim das 9 eras (fase 90), marcos do pós-eras (100, 110...) e Forja Astral +21..+25. Desligado = nada muda.
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
globalThis.Sys={};
['titles','forge','mail','erasend'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const E=Sys.erasEnd, Ti=Sys.titles, F=Sys.forge, M=Sys.mail;
const BAL=JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/balance.json'),'utf8'));
const r2=v=>Math.round(v*1e6)/1e6;

t('desligado: nada escreve no save, tabela de títulos e FC iguais, forgeMult = Sys.forge.mult',()=>{
  const len=Ti.DATA.titles.length, S={best:121}, h=makeHost();
  assert.strictEqual(E.DATA.on,false);
  for(const r of [E.onFinal(S,h),E.onStageClear(S,h,90),E.onStageClear(S,h,100),E.sync(S,h),E.astralTry(S,h,'weapon')]) assert.strictEqual(r.ok,false);
  assert.strictEqual(E.equip(S,'frame','nine_eras'),false); assert.strictEqual(E.equipped(S,'aura'),null); assert.deepStrictEqual(E.view(S,h),{on:false});
  assert.ok(!S.sys||!S.sys.erasEnd); assert.strictEqual(Ti.DATA.titles.length,len); assert.strictEqual(h.gems,0);
  F.ensure(S); S.sys.forge.lv.weapon=12; assert.strictEqual(E.forgeMult(S,'weapon'),F.mult(S,'weapon'));
  assert.deepStrictEqual(Ti.bonus(S),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
});
t('Sys.stats soma a Forja Astral (itemsTotal usa Sys.erasEnd.forgeMult; desligada = Sys.forge.mult de sempre)',()=>{
  if(!Sys.stats) require('../../js/sys/stats.js');
  const St=Sys.stats, S={}, it={id:1,slot:'weapon',r:2,e:0,lvl:10,subs:[]}, h=makeHost(); h.equipped=()=>({weapon:it}); h.level=()=>50;
  F.ensure(S); S.sys.forge.lv.weapon=20; const base=St.itemsTotal(S,h).atk;
  E.setOn(true); try{ E.ensure(S).lv.weapon=1; const up=St.itemsTotal(S,h).atk; assert.ok(up>base,'+21 aumenta o ATK ('+base+' -> '+up+')');
    assert.strictEqual(up,St.itemStats(it,St.itemLevel(it,50),1.65).atk);
  } finally{ E.setOn(false); } assert.strictEqual(St.itemsTotal(S,h).atk,base,'desligada: igual a antes');
});
t('números iguais aos do docs/balance.json (fimDasEras e posEras)',()=>{
  const fd=BAL.fimDasEras, pe=BAL.posEras, D=E.DATA;
  assert.strictEqual(fd.on,false); assert.strictEqual(D.finalStage,fd.trigger.stage);
  assert.strictEqual(D.final.title.id,fd.title.id); assert.strictEqual(D.final.title.name,fd.title.name); assert.strictEqual(D.final.title.r,fd.title.rarity);
  assert.deepStrictEqual(D.final.title.eff,fd.title.bonus);
  assert.deepStrictEqual([D.final.frame.id,D.final.frame.name,D.final.aura.id,D.final.aura.name],[fd.frame.id,fd.frame.name,fd.aura.id,fd.aura.name]);
  assert.strictEqual(D.final.gems,fd.gems); assert.strictEqual(D.final.mail.subject,fd.mail.subject); assert.strictEqual(D.final.mail.body,fd.mail.body);
  const ms=pe.milestones; assert.strictEqual(D.marks.from,ms.from); assert.strictEqual(D.marks.every,ms.every); assert.strictEqual(D.marks.gems,ms.gems);
  assert.strictEqual(D.marks.bonusUntil,ms.title.bonusUntilStage); assert.deepStrictEqual(D.marks.eff,{atkPct:ms.title.bonusEffectivePct.atk,hpPct:ms.title.bonusEffectivePct.hp});
  for(const k in ms.frames){ assert.strictEqual(D.marks.frames[k].id,ms.frames[k].id); assert.strictEqual(D.marks.frames[k].name,ms.frames[k].name); }
  assert.strictEqual(D.marks.mail.subject,ms.mail.subject); assert.strictEqual(D.marks.mail.body,ms.mail.body);
  assert.deepStrictEqual(D.astral.levels,pe.astralForge.levels); assert.deepStrictEqual(D.astral.bonus,pe.astralForge.bonus); assert.deepStrictEqual(D.astral.unlockStage,pe.astralForge.unlockStage);
  assert.strictEqual(D.astral.bonus[0]-F.DATA.f20.bonus[4]>0,true,'astral continua acima do +20');
});
t('texto: fase 90 é o fim das 9 eras, nunca "fim do jogo"',()=>{
  const src=fs.readFileSync(path.join(__dirname,'../../js/sys/erasend.js'),'utf8').replace(/nunca o fim do jogo/g,'');
  assert.ok(!/fim do jogo|jogo acabou|game over/i.test(src));
});
t('ligado: fase 90 entrega título (3% efetivo), moldura, aura e 300 diamantes UMA vez; correio desligado = direto',()=>{
  E.setOn(true); const S={best:91}, h=makeHost();
  assert.ok(Ti.DATA.titles.some(x=>x.id==='legend9')&&Ti.DATA.titles.some(x=>x.id==='mark150'));
  assert.strictEqual(E.onStageClear(S,h,89).final,null); assert.strictEqual(h.gems,0);
  const r=E.onStageClear(S,h,90).final; assert.strictEqual(r.given,true); assert.strictEqual(r.gemsVia,'direct'); assert.strictEqual(h.gems,300);
  assert.ok(Ti.isUnlocked(S,'legend9')); Ti.ensure(S).unlocked.stage10=1; Ti.setFeatured(S,'stage10');
  const b=Ti.bonus(S); assert.strictEqual(r2(b.atkPct-1),3); assert.strictEqual(r2(b.hpPct),3);   // stage10 em destaque dá 1% de ATQ
  Ti.setFeatured(S,'legend9'); assert.strictEqual(r2(Ti.bonus(S).atkPct),6.5);
  assert.deepStrictEqual(E.cosmetics(S).map(c=>c.id).sort(),['light_of_eras','nine_eras']);
  assert.strictEqual(E.equip(S,'aura','nine_eras'),false); assert.strictEqual(E.equip(S,'aura','light_of_eras'),true); assert.strictEqual(E.equipped(S,'aura').name,'Luz das Eras');
  const again=E.onFinal(S,h); assert.strictEqual(again.given,false); assert.strictEqual(h.gems,300);
  assert.strictEqual(E.onStageClear(S,h,90).final,null); assert.strictEqual(h.gems,300);
  assert.strictEqual(r.prizes.length,4); assert.ok(r.prizes.every(p=>p.title&&p.text)); assert.deepStrictEqual(r.milestone.stage,100);
  assert.ok(r.milestone.rewards.some(x=>/Forja Astral \+21/.test(x)));
  E.setOn(false); assert.ok(!Ti.DATA.titles.some(x=>x.added));
});
t('correio ligado: 300 diamantes na carta (não vence), resgate paga uma vez, sem carta repetida',()=>{
  E.setOn(true); M.DATA.enabled=true; try{
    const S={}, h=makeHost(); const r=E.onFinal(S,h); assert.strictEqual(r.gemsVia,'mail'); assert.strictEqual(h.gems,0);
    const box=M.inbox(S,h); assert.strictEqual(box.length,1); assert.strictEqual(box[0].title,BAL.fimDasEras.mail.subject); assert.deepStrictEqual(box[0].att,{gems:300});
    assert.ok(box[0].daysLeft>365);
    assert.strictEqual(M.claim(S,h,box[0].id).ok,true); assert.strictEqual(h.gems,300); assert.strictEqual(M.claim(S,h,box[0].id).ok,false);
    delete S.sys.erasEnd; E.onFinal(S,h); assert.strictEqual(M.inbox(S,h).length,1); assert.strictEqual(h.gems,300);   // estado perdido: a carta já enviada não paga de novo
  } finally{ M.DATA.enabled=false; E.setOn(false); }
});
t('marcos: 100 dá título Marco 100 (+1%), 30 diamantes, moldura Além das Eras, pedras e Forja Astral +21; uma vez; 160 só nome',()=>{
  E.setOn(true); const S={}, h=makeHost(); E.onStageClear(S,h,90); const g0=h.gems;
  const a=E.onStageClear(S,h,91); assert.strictEqual(a.stones,3); assert.strictEqual(a.mark,null); assert.strictEqual(a.milestone.stage,100);
  assert.strictEqual(E.onStageClear(S,h,91).stones,0,'fase repetida não paga');
  for(let s=92;s<100;s++) E.onStageClear(S,h,s);
  const m=E.onStageClear(S,h,100); assert.strictEqual(m.mark.title,'Marco 100'); assert.strictEqual(m.mark.astralUnlock,21); assert.strictEqual(m.mark.frame,'mark100');
  assert.strictEqual(m.stones,3+30); assert.strictEqual(h.gems-g0,30); assert.strictEqual(E.astralCap(S),1); assert.strictEqual(m.milestone.stage,110);
  assert.strictEqual(E.ensure(S).stones,30+10*3);
  Ti.setFeatured(S,'legend9'); assert.strictEqual(r2(Ti.bonus(S).atkPct),6+1);
  assert.strictEqual(E.onStageClear(S,h,100).mark,null); assert.strictEqual(h.gems-g0,30);
  const S2={}; E.ensure(S2).final=1; const x=E.onStageClear(S2,h,160).mark; assert.strictEqual(x.title,'Marco 160');
  const t160=Ti.DATA.titles.find(q=>q.id==='mark160'); assert.ok(t160.cosmetic); assert.strictEqual(Ti.bonusText(t160),'Cosmético');
  assert.ok(E.milestoneRewards(150).includes('Moldura Sem Fim')); assert.ok(!E.milestoneRewards(150).some(r=>/Forja Astral/.test(r)));
  E.setOn(false);
});
t('save antigo (já na fase 121): sync entrega fim das 9 eras e marcos 100-120 uma vez; resync devolve títulos sem pagar',()=>{
  E.setOn(true); const S={best:122}, h=makeHost(); const r=E.sync(S,h);
  assert.ok(r.final&&r.final.given); assert.deepStrictEqual(r.marks.map(x=>x.stage),[100,110,120]); assert.strictEqual(h.gems,300+90);
  assert.strictEqual(E.sync(S,h).marks.length,0); assert.strictEqual(h.gems,390);
  E.setOn(false); Ti.ensure(S); assert.ok(!Ti.isUnlocked(S,'legend9'),'desligado: o Sys.titles tira da tabela');
  E.setOn(true); E.resync(S,h); assert.ok(Ti.isUnlocked(S,'legend9')&&Ti.isUnlocked(S,'mark120')); assert.strictEqual(h.gems,390);
  E.setOn(false);
});
t('Forja Astral: precisa do +20, abre por marco, falha não tira nível, garantia, multiplicador',()=>{
  E.setOn(true); F.setForge20(true); try{
    const S={}, h=makeHost({seed:7}); F.ensure(S); E.ensure(S).final=1; E.addAstral(S,1000);
    assert.strictEqual(E.canAstral(S,h,'weapon').reason,'base');
    S.sys.forge.lv.weapon=20; assert.strictEqual(E.canAstral(S,h,'weapon').reason,'marco');
    assert.strictEqual(E.forgeMult(S,'weapon'),F.mult(S,'weapon'));
    E.onStageClear(S,h,100); const c=E.canAstral(S,h,'weapon'); assert.ok(c.ok); assert.strictEqual(c.next,21); assert.strictEqual(c.chance,3);
    let tries=0, r; do{ r=E.astralTry(S,h,'weapon'); tries++; assert.ok(r.ok); assert.ok(r.level>=20); }while(!r.success);
    assert.ok(tries<=Math.ceil((100-3)/5)+1); assert.strictEqual(r.level,21); assert.strictEqual(E.forgeMult(S,'weapon'),1.65);
    assert.strictEqual(E.canAstral(S,h,'weapon').reason,'marco','+22 só com o marco 110');
    E.onStageClear(S,h,110); assert.ok(E.canAstral(S,h,'weapon').ok);
    const o=E.ensure(S); o.stones=0; assert.strictEqual(E.canAstral(S,h,'weapon').reason,'pedras');
    o.lv.armor=5; assert.strictEqual(E.canAstral(S,h,'armor').reason,'max'); assert.strictEqual(E.totalLevel(S,'armor'),25); assert.strictEqual(E.forgeMult(S,'armor'),2.13);
    const v=E.view(S,h); assert.strictEqual(v.astral.length,7); assert.strictEqual(v.astralCap,2);
    E.setOn(false); assert.strictEqual(E.forgeMult(S,'armor'),F.mult(S,'armor'),'desligado volta à Forja comum');
  } finally{ F.setForge20(false); E.setOn(false); }
});
t('save torto não quebra',()=>{
  const S={sys:{erasEnd:{final:'x',marks:[100,'a',105,110,110],stones:-4,cos:{owned:['nine_eras','zzz'],eq:{frame:'light_of_eras',aura:'light_of_eras'}},lv:{weapon:99},pity:{weapon:'q'}}}};
  const o=E.ensure(S); assert.strictEqual(o.final,0); assert.deepStrictEqual(o.marks,[100,110]); assert.strictEqual(o.stones,0);
  assert.deepStrictEqual(o.cos.owned,['nine_eras']); assert.deepStrictEqual(o.cos.eq,{}); assert.strictEqual(o.lv.weapon,5); assert.strictEqual(o.pity.weapon,0);
});
console.log(n+' testes ok');
