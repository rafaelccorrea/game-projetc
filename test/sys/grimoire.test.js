// node test/sys/grimoire.test.js — Grimório das Eras (Sys.grimoire): 18 magias, 3 equipadas, bônus por ter, níveis com páginas/tinta só jogando, conjuntos Fases/Arena/Chefe
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
['stats','forge','fc','grimoire'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const G=Sys.grimoire, FC=Sys.fc;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ G.setOn(true); try{ fn(); } finally { G.setOn(false); } };

t('catálogo: 18 magias, 2 por era nas 9 eras, ids e nomes únicos, recarga e efeito em toda',()=>{
  const c=G.catalog(); assert.strictEqual(c.length,18);
  for(let e=0;e<9;e++) assert.strictEqual(c.filter(s=>s.era===e).length,2,'era '+e);
  assert.strictEqual(new Set(c.map(s=>s.id)).size,18); assert.strictEqual(new Set(c.map(s=>s.name)).size,18);
  for(const s of c){ assert.ok(s.cd>0&&s.effectText&&s.desc&&s.learn,s.id); assert.ok(['atkPct','hpPct','defPct','critPct'].includes(s.passiveKey)); }
});

t('dano dentro da regra de coerência: nenhuma magia passa de 3× o ATQ no total, nem no nível 10; recarga cai com o nível',()=>{
  for(const sp of G.DATA.spells){ const a=G.stat(sp,1), b=G.stat(sp,10);
    if(sp.kind==='dmg'){ assert.ok(b.mult<=3+1e-9&&a.mult<=b.mult,sp.id); assert.ok(Math.abs(a.hits.reduce((x,y)=>x+y,0)-1)<0.02,sp.id+' golpes somam 1'); }
    assert.ok(b.cd<a.cd,sp.id); }
});

t('DESLIGADO por padrão: bônus zero, nada se ganha, loadout vazio; a FC é idêntica com e sem o módulo',()=>{
  assert.strictEqual(G.DATA.on,false); const S={sys:{grimoire:{own:{rollingStone:{lv:10,pages:0},medKit:{lv:5}}}}}, h=makeHost({});
  assert.deepStrictEqual(G.bonus(S),{atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
  assert.strictEqual(G.addPages(S,'cannonball',3,'tower').reason,'off'); assert.strictEqual(G.grant(S,h,'eraLord',{era:0}).reason,'off');
  assert.strictEqual(G.levelUp(S,'rollingStone').reason,'off'); assert.deepStrictEqual(G.loadout(S,'fases'),[]);
  const a=FC.compute(S,h); const g=Sys.grimoire; delete Sys.grimoire; const b=FC.compute(S,h); Sys.grimoire=g; assert.strictEqual(a,b);
});

t('aprender: Senhor da Era ensina a 1ª, chefe da fase 50 ensina a 2ª; instância só junta página de magia já aprendida',()=>withOn(()=>{
  const S={}, h=makeHost({eraMax:1});
  let r=G.grant(S,h,'eraLord',{era:1}); assert.strictEqual(r.learned,'bronzePhalanx'); assert.strictEqual(r.ink,20);
  r=G.grant(S,h,'instance'); assert.strictEqual(r.pages,null,'a B da era 1 ainda não foi aprendida');
  r=G.grant(S,h,'chief50',{era:1}); assert.strictEqual(r.learned,'minotaurSpear');
  r=G.grant(S,h,'instance'); assert.deepStrictEqual(r.pages,{id:'minotaurSpear',n:1}); assert.strictEqual(G.ensure(S).own.minotaurSpear.pages,1);
  assert.strictEqual(G.ensure(S).ink,20+10+2*G.DATA.grants.instance.ink);   /* instância: tinta das fontes do dia (DATA.sources, hoje 3) */
}));

t('Senhor da Era repetido: 1 página por era por dia; no dia seguinte volta',()=>withOn(()=>{
  const S={}, h=makeHost({}); G.grant(S,h,'eraLord',{era:0});
  assert.ok(G.grant(S,h,'eraLordRepeat',{era:0}).ok); assert.strictEqual(G.grant(S,h,'eraLordRepeat',{era:0}).reason,'daily');
  assert.ok(G.grant(S,h,'eraLordRepeat',{era:2}).ok,'outra era conta à parte (e ensina a A dela)');
  h.t+=86400000; assert.ok(G.grant(S,h,'eraLordRepeat',{era:0}).ok); assert.strictEqual(G.ensure(S).own.rollingStone.pages,2);
}));

t('SEM COMPRA: fonte de loja/diamante/oferta/pacote é recusada em tudo; fonte desconhecida também',()=>withOn(()=>{
  const S={}, h=makeHost({});
  for(const src of ['shop','gems','offer','pack','pay','gacha','SHOP']){ assert.strictEqual(G.addPages(S,'cannonball',5,src).reason,'forbidden',src);
    assert.strictEqual(G.addInk(S,100,src).reason,'forbidden',src); assert.strictEqual(G.grant(S,h,src).reason,'forbidden',src); }
  assert.strictEqual(G.grant(S,h,'lootbox').reason,'src'); assert.deepStrictEqual(G.ensure(S).own,{}); assert.strictEqual(G.ensure(S).ink,0);
  for(const k of Object.keys(G.DATA.grants)) assert.ok(!G.DATA.forbidden.includes(k));
}));

t('subir de nível: gasta páginas e tinta da tabela, recusa sem material, para no 10',()=>withOn(()=>{
  const S={}; G.addPages(S,'cannonball',1,'event'); assert.strictEqual(G.levelOf(S,'cannonball'),1);
  assert.strictEqual(G.levelUp(S,'cannonball').reason,'pages'); G.addPages(S,'cannonball',200,'event'); assert.strictEqual(G.levelUp(S,'cannonball').reason,'ink');
  G.addInk(S,5000,'tower'); const ink0=G.ensure(S).ink; let lv=1;
  while(G.levelUp(S,'cannonball').ok) lv++; assert.strictEqual(lv,10); assert.strictEqual(G.levelUp(S,'cannonball').reason,'max');
  assert.strictEqual(ink0-G.ensure(S).ink,G.DATA.ink.reduce((a,b)=>a+b,0)); assert.strictEqual(200-G.ensure(S).own.cannonball.pages,G.DATA.pages.reduce((a,b)=>a+b,0));
  assert.strictEqual(G.levelUp(S,'medKit').reason,'notOwned'); assert.strictEqual(G.levelUp(S,'zzz').reason,'spell');
}));

t('bônus por ter: soma de todas as aprendidas (mesmo fora do conjunto), cresce com o nível, teto modesto com as 18 no 10',()=>withOn(()=>{
  const S={}; G.addPages(S,'rollingStone',1,'event'); assert.strictEqual(G.bonus(S).atkPct,0.4);
  G.addPages(S,'medKit',1,'event'); assert.strictEqual(G.bonus(S).hpPct,0.4);
  const T={sys:{grimoire:{own:Object.fromEntries(G.DATA.spells.map(s=>[s.id,{lv:10,pages:0}]))}}}, b=G.bonus(T);
  assert.ok(b.atkPct>5&&b.atkPct<8,'ATQ '+b.atkPct); assert.ok(b.hpPct>5&&b.hpPct<8,'Vida '+b.hpPct); assert.ok(b.critPct<=4&&b.defPct<=4);
  const h=makeHost({}), fcAll=FC.compute(T,h); G.setOn(false); const fc0=FC.compute(T,h); G.setOn(true); assert.ok(fcAll>fc0&&fcAll/fc0<1.2,(fcAll/fc0).toFixed(3));
}));

t('conjuntos Fases/Arena/Chefe: 3 por modo, só aprendidas, sem repetir; equip troca de lugar; batalha pega o conjunto do modo',()=>withOn(()=>{
  const S={}; for(const id of ['rollingStone','ancestralFire','cannonball','medKit','plasmaRay']) G.addPages(S,id,1,'event');
  assert.ok(G.setPreset(S,'fases',['rollingStone','ancestralFire','cannonball']).ok);
  assert.strictEqual(G.setPreset(S,'arena',['a','b']).reason,'notOwned'); assert.strictEqual(G.setPreset(S,'chefe',['rollingStone','ancestralFire','cannonball','medKit']).reason,'tooMany');
  assert.strictEqual(G.setPreset(S,'xx',[]).reason,'mode'); assert.strictEqual(G.equip(S,'arena',0,'lightLance').reason,'notOwned');
  G.setPreset(S,'chefe',['plasmaRay','cannonball']); G.equip(S,'chefe',0,'cannonball'); assert.deepStrictEqual(G.ensure(S).sets.chefe,['cannonball','plasmaRay'],'troca de lugar');
  G.equip(S,'chefe',2,'medKit'); assert.deepStrictEqual(G.ensure(S).sets.chefe,['cannonball','plasmaRay','medKit']);
  /* espaço pedido respeitado (QA): equipar no espaço 3 com o conjunto vazio fica no espaço 3, com as casas antes dele vazias (null) */
  { const r=G.equip(S,'arena',2,'medKit'); assert.ok(r.ok); assert.deepStrictEqual(r.set,[null,null,'medKit']); assert.deepStrictEqual(G.ensure(S).sets.arena,[null,null,'medKit']);
    G.equip(S,'arena',0,'plasmaRay'); assert.deepStrictEqual(G.ensure(S).sets.arena,['plasmaRay',null,'medKit']);
    G.equip(S,'arena',1,'medKit'); assert.deepStrictEqual(G.ensure(S).sets.arena,['plasmaRay','medKit'],'mover para uma casa vazia: a de origem fica vazia (e o null do fim sai)');
    G.equip(S,'arena',2,'cannonball'); G.equip(S,'arena',0,null); assert.deepStrictEqual(G.ensure(S).sets.arena,['medKit','cannonball'],'tirar junta no começo, como antes');
    G.setPreset(S,'arena',[]); G.equip(S,'arena',1,'rollingStone');
    const S2=JSON.parse(JSON.stringify(S)); assert.deepStrictEqual(G.ensure(S2).sets.arena,[null,'rollingStone'],'o buraco sobrevive à recarga');
    assert.deepStrictEqual(G.loadout(S,'arena').map(x=>x.id),['rollingStone'],'a batalha só vê as magias (sem null)');
    assert.strictEqual(G.view(S,makeHost({})).sets.find(s=>s.mode==='arena').ids[1],'rollingStone','a tela vê a magia no espaço 2');
    G.setPreset(S,'arena',[]); }
  assert.strictEqual(G.modeFor({boss:true}),'chefe'); assert.strictEqual(G.modeFor({pvp:true}),'arena'); assert.strictEqual(G.modeFor({}),'fases');
  assert.deepStrictEqual(G.loadout(S,'chefe').map(x=>x.id),['cannonball','plasmaRay','medKit']);
  assert.deepStrictEqual(G.loadout(S,'arena').map(x=>x.id),['rollingStone','ancestralFire','cannonball'],'arena vazia cai no de Fases');
  const L=G.loadout(S,'fases')[0]; assert.ok(L.cd>0&&L.effect.type==='dmg'&&L.effect.area&&L.text);
}));

t('save velho/torto: ensure limpa magia inexistente, nível fora da faixa, conjunto com repetida ou não aprendida',()=>{
  const S={sys:{grimoire:{ink:-4,own:{cannonball:{lv:99,pages:-1},hack:{lv:3},medKit:'x'},sets:{fases:['cannonball','cannonball','medKit','hack'],arena:'x'}}}};
  const o=G.ensure(S); assert.deepStrictEqual(o.own,{cannonball:{lv:10,pages:0}}); assert.strictEqual(o.ink,0);
  assert.deepStrictEqual(o.sets,{fases:['cannonball'],arena:[],chefe:[]}); assert.throws(()=>G.ensure(null));
});

t('view para a tela: 9 eras × 2, contagem, texto do bônus, custo, onde está equipada',()=>withOn(()=>{
  const S={}; G.addPages(S,'rollingStone',3,'event'); G.addInk(S,10,'daily'); G.setPreset(S,'fases',['rollingStone']);
  const v=G.view(S,makeHost({})); assert.strictEqual(v.eras.length,9); assert.strictEqual(v.owned,1); assert.strictEqual(v.total,18);
  const s=v.eras[0].spells[0]; assert.strictEqual(s.owned,true); assert.strictEqual(s.canLevel,true); assert.deepStrictEqual(s.cost,{pages:1,ink:10}); assert.deepStrictEqual(s.in,['fases']);
  assert.strictEqual(v.bonusText,'ATQ +0,4%'); assert.strictEqual(v.eras[8].spells[1].owned,false); assert.ok(v.eras[8].spells[1].how);
}));
t('grant idempotente: eraLord 2× na mesma era vira eraLordRepeat (1 página, 1 por dia); chief50 só uma vez por era', () => { const G=require('../../js/sys/grimoire.js'); const k=G.DATA.on; G.DATA.on=true; try{ const S={}, h=require('./_host.js').makeHost({level:60,eraMax:3}); const a=G.grant(S,h,'eraLord',{era:2}); assert.ok(a.ok&&a.learned); const b=G.grant(S,h,'eraLord',{era:2}); assert.strictEqual(b.src,'eraLordRepeat'); assert.strictEqual(G.grant(S,h,'eraLord',{era:2}).reason,'daily'); assert.ok(G.grant(S,h,'chief50',{era:2}).ok); assert.strictEqual(G.grant(S,h,'chief50',{era:2}).reason,'done'); assert.ok(G.grant(S,h,'chief50',{era:3}).ok); } finally { G.DATA.on=k; } });
t('cast: dano total pelo ATQ, área dividida entre os alvos, atordoar pela metade no chefe, cura e escudo pela vida máxima', () => { const G=require('../../js/sys/grimoire.js'); const k=G.DATA.on; G.DATA.on=true; try{ const S={}, h=require('./_host.js').makeHost({level:60,eraMax:3});
  G.grant(S,h,'eraLord',{era:0}); G.grant(S,h,'eraLord',{era:2}); G.grant(S,h,'chief50',{era:0});
  assert.strictEqual(G.cast(S,'cannonball',{atk:100}).reason,'locked'); const r=G.cast(S,'rollingStone',{atk:100,targets:4}); assert.ok(r.aoe&&r.targets===4&&r.dmg===200&&r.hits[0]===50);
  const kc=G.cast(S,'knightCharge',{atk:100,boss:true}); assert.strictEqual(kc.stun,0.5); assert.strictEqual(G.cast(S,'ancestralFire',{hpMax:1000}).heal,120); } finally { G.DATA.on=k; } });
console.log(n+' testes ok');
