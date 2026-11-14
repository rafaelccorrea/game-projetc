// node test/sys/pathtry.test.js — Sys.pathTry: ensaio de caminho (docs/IDLE_PARECIDOS.md §3 item 12). Grátis, sem efeito duradouro. Desligado = nada muda.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
require('../../js/sys/pathtry.js');
const {makeHost}=require('./_host.js');
const P=Sys.pathTry;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const withOn=fn=>{ P.setOn(true); try{ fn(); } finally{ P.setOn(false); } };

t('DESLIGADO: não começa, não grava',()=>{
  assert.strictEqual(P.DATA.on,false); const S={}, h=makeHost({level:40});
  assert.strictEqual(P.canTry(S,h,'blade').reason,'off'); assert.strictEqual(P.start(S,h,'blade').ok,false); assert.deepStrictEqual(S,{});
});

t('3 caminhos (Lâmina, Disparo, Arcano), Nv 30, 60 s; trava antes do Nv 30 e depois de escolher',()=>withOn(()=>{
  assert.deepStrictEqual(P.DATA.paths.map(p=>p.name),['Lâmina','Disparo','Arcano']); assert.strictEqual(P.DATA.unlockLevel,30); assert.strictEqual(P.DATA.sec,60);
  assert.deepStrictEqual(P.canTry({},makeHost({level:29}),'blade'),{ok:false,reason:'level',need:30});
  assert.strictEqual(P.canTry({sys:{path:{id:'shot'}}},makeHost({level:40}),'blade').reason,'chosen');
  assert.strictEqual(P.canTry({},makeHost({level:40}),'xx').reason,'id');
}));

t('luta de treino: flags sem prêmio/progresso/morte, boneco imortal, bônus só do caminho; um ensaio por vez',()=>withOn(()=>{
  const S={}, h=makeHost({level:30}), r=P.start(S,h,'arcane'); assert.ok(r.ok);
  const b=r.battle; for(const k of ['noLoot','noXp','noGold','noProgress','noQuest','noEnergy','noDeath']) assert.strictEqual(b[k],true,k);
  assert.strictEqual(b.enemy.immortal,true); assert.strictEqual(b.sec,60); assert.deepStrictEqual(b.bonus.strikes,{stun:3});
  assert.strictEqual(P.canTry(S,h,'blade').reason,'busy'); assert.deepStrictEqual(S,{},'começar não grava'); assert.strictEqual(P.active().id,'arcane');
  assert.strictEqual(P.cancel(),true); assert.strictEqual(P.active(),null);
}));

t('sem efeito duradouro: só anota vezes e melhor dano/s; nada de ouro/gemas/itens; bônus zero; compara os 3',()=>withOn(()=>{
  const S={sys:{forge:{lv:{weapon:3}}},inv:[{id:1}]}, h=makeHost({level:35}), keep=JSON.stringify({f:S.sys.forge,inv:S.inv});
  P.start(S,h,'blade'); let f=P.finish(S,h,{damage:6000,sec:60}); assert.strictEqual(f.dps,100);
  P.start(S,h,'shot'); f=P.finish(S,h,{damage:9000,sec:60}); assert.strictEqual(f.dps,150);
  P.start(S,h,'blade'); f=P.finish(S,h,{damage:3000,sec:60}); assert.strictEqual(f.best,100,'guarda o melhor');
  assert.strictEqual(P.finish(S,h,{damage:1}).reason,'none');
  assert.strictEqual(h.gold,0); assert.strictEqual(h.gems,0); assert.strictEqual(h.items.length,0);
  assert.strictEqual(JSON.stringify({f:S.sys.forge,inv:S.inv}),keep); assert.deepStrictEqual(Object.keys(S.sys).sort(),['forge','pathTry']);
  assert.ok(Object.values(P.bonus()).every(v=>v===0));
  const rows=P.compare(S); assert.deepStrictEqual(rows.map(r=>[r.id,r.n,r.bestDps,r.top]),[['blade',2,100,false],['shot',1,150,true],['arcane',0,null,false]]);
  const v=P.view(S,h); assert.strictEqual(v.free,true); assert.ok(/grátis/i.test(v.text)); assert.strictEqual(v.paths.length,3); assert.strictEqual(v.paths[1].top,true);
}));

t('Sys.path futuro manda nos números; save torto',()=>withOn(()=>{
  Sys.path={DATA:{paths:[{id:'blade',name:'Lâmina',strikes:{counter:5},stat:{}}]},chosen:()=>null};
  try{ assert.deepStrictEqual(P.battle('blade').bonus.strikes,{counter:5}); assert.strictEqual(P.battle('shot'),null); } finally{ delete Sys.path; }
  const S={sys:{pathTry:{tried:{blade:{n:'x',best:-3},zz:{n:1}}}}}; P.ensure(S); assert.deepStrictEqual(S.sys.pathTry.tried,{blade:{n:0,best:0,life:null,lifeMax:null,ctrl:null}});
}));

t('ensaio guarda vida no fim e controle; selo melhor por linha (Comparar com 3 linhas)', () => { const P2=require('../../js/sys/pathtry.js'); const k=P2.DATA.on; P2.DATA.on=true; try{ const S={}, h=require('./_host.js').makeHost({level:40});
  P2.start(S,h,'blade'); P2.finish(S,h,{damage:6000,sec:60,life:1083,lifeMax:3600,stunSec:0}); P2.start(S,h,'shot'); P2.finish(S,h,{damage:9000,sec:60,life:1,lifeMax:3600,stunSec:0}); P2.start(S,h,'arcane'); const f=P2.finish(S,h,{damage:5800,sec:60,life:1,lifeMax:3600,stunSec:4});
  assert.strictEqual(f.ctrl,4); const r=P2.compare(S), by=id=>r.find(x=>x.id===id); assert.ok(by('shot').topDps&&by('blade').topLife&&by('arcane').topCtrl); assert.strictEqual(by('blade').life,1083); } finally { P2.DATA.on=k; P2.cancel(); } });
console.log(`pathtry: ${n} ok`);
