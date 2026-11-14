// node test/sys/fchelp.test.js — Sys.fcHelp "Como ganhar FC" (dono 14/11, via PO): fraco/muito fraco, só fontes já liberadas, ganho pelo motor
// das dicas (Sys.advice.all + Sys.fc.advice), nada de loja/compra/sorteio, ordem (agora > falta recurso > sem número > subir de nível).
// SYSDIR (opcional) = pasta do fchelp.js a testar.
'use strict';
const assert=require('assert'), path=require('path');
globalThis.Sys={};
['stats','level','fc','advice','forge','pet','practice','tower','titles','events'].forEach(m=>require('../../js/sys/'+m+'.js'));
require(path.join(process.env.SYSDIR||path.join(__dirname,'../../js/sys'),'fchelp.js'));
const {makeHost}=require('./_host.js');
const H=Sys.fcHelp;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=fn=>{ const a=H.DATA.on, adv=Sys.advice.all, fa=Sys.fc.advice; H.DATA.on=true; try{ fn(); } finally{ H.DATA.on=a; Sys.advice.all=adv; Sys.fc.advice=fa; } };
const mk=lv=>{ const S={inv:[],eq:{}}; Sys.level.ensure(S).lvl=lv; return S; };
const fake=(kinds,mods)=>{ Sys.advice.all=()=>({now:0,list:kinds}); Sys.fc.advice=()=>mods; };

t('chave desligada: nada',()=>{ const r=H(mk(30),makeHost(),{need:1e9}); assert.strictEqual(r.on,false); assert.deepStrictEqual(r.sources,[]); });
t('fraco / muito fraco / ok pela FC pedida (85%)',()=>on(()=>{ fake([],[]); const S=mk(1), h=makeHost(), fc=Sys.fc.compute(S,h);
  assert.strictEqual(H(S,h,{need:fc/0.9}).state,'fraco'); assert.strictEqual(H(S,h,{need:fc/0.8}).state,'muito_fraco'); assert.strictEqual(H(S,h,{need:fc}).state,'ok');
  const r=H(S,h,{need:fc*2}); assert.ok(r.missing>0); assert.ok(/^Faltam /.test(r.text)); assert.strictEqual(H(S,h,{}).state,null); }));
t('só fontes já liberadas: Nv 1 não vê Forja, Pets, Torre, Prática; Nv 20 vê',()=>on(()=>{ fake([],[]); const h=makeHost();
  const ids=lv=>H(mk(lv),h,{limit:99}).sources.map(x=>x.id);
  const a=ids(1); for(const x of ['forge','pet','tower','practice','mount','events']) assert.ok(!a.includes(x),'Nv 1: '+x); assert.ok(a.includes('gear')&&a.includes('level'));
  const b=ids(20); for(const x of ['forge','pet','tower','practice']) assert.ok(b.includes(x),'Nv 20: '+x); assert.ok(!b.includes('mount'),'montaria abre no 38'); }));
t('módulo desligado não aparece (Grimório, Relíquias, Mentores com a chave off); host.featureOn manda',()=>on(()=>{ fake([],[]);
  const ids=(h)=>H(mk(60),h,{limit:99}).sources.map(x=>x.id); const a=ids(makeHost()); for(const x of ['grimoire','relics','mentors','guild']) assert.ok(!a.includes(x),x);
  const h=makeHost(); h.featureOn=id=>id==='grimoire'?true:id==='forge'?false:undefined; const b=ids(h); assert.ok(b.includes('grimoire')); assert.ok(!b.includes('forge')); }));
t('ganho do motor das dicas: melhor ação por fonte; ordem agora > falta recurso > sem número > subir de nível',()=>on(()=>{ const S=mk(20), h=makeHost(), big=1e6;
  fake([{kind:'equip',id:'equip.weapon',label:'Equipar Espada (arma)',gain:big,ready:true},{kind:'level',id:'level.up',label:'Subir para o Nv 21',gain:5*big,ready:false}],
       [{module:'forge',id:'forge.weapon',label:'Forja +1 na arma',gain:3*big,ready:false},{module:'practice',id:'practice.atk',label:'Treinar Força',gain:2*big,ready:true}]);
  const r=H(S,h,{need:1e12,limit:99}), ids=r.sources.map(x=>x.id);
  assert.deepStrictEqual(ids.slice(0,3),['practice','gear','forge'],'prontas por ganho, depois a que falta recurso'); assert.strictEqual(ids[ids.length-1],'level');
  const g=r.sources.find(x=>x.id==='gear'); assert.strictEqual(g.txt,'Equipar Espada (arma)'); assert.strictEqual(g.tab,'gear'); assert.strictEqual(g.actionId,'equip.weapon'); assert.ok(g.gainText.startsWith('+'));
  const p=r.sources.find(x=>x.id==='pet'); assert.strictEqual(p.gain,null); assert.strictEqual(p.gainText,''); assert.ok(p.txt.length>0,'sem número: texto do catálogo'); }));
t('nada pago: dica de loja, compra, oferta, VIP, diamante, invocação ou baú some',()=>on(()=>{ const S=mk(20), h=makeHost();
  fake([],[{module:'forge',id:'forge.shop',label:'Comprar pedras na loja',gain:1e9,ready:true},{module:'practice',id:'practice.x',label:'Pacote VIP de prática',gain:1e9,ready:true},
    {module:'tower',id:'tower.gem',label:'Pular andar com diamante',gain:1e9,ready:true}]);
  const r=H(S,h,{limit:99}); for(const s of r.sources){ assert.ok(!/loja|VIP|diamante/i.test(s.txt),s.txt); assert.strictEqual(s.actionId,null); } }));
t('ganho que a tela não mostra não conta (sem "+0 FC")',()=>on(()=>{ const S=mk(20), h=makeHost(); fake([],[{module:'practice',id:'practice.atk',label:'Treinar',gain:1e-6,ready:true}]);
  const p=H(S,h,{limit:99}).sources.find(x=>x.id==='practice'); assert.strictEqual(p.gain,null); assert.strictEqual(p.actionId,null); }));
t('não mexe no save (só lê; os motores rodam numa cópia)',()=>on(()=>{ const S=mk(30), h=makeHost(), before=JSON.stringify(S); H(S,h,{need:1e12,limit:99}); assert.strictEqual(JSON.stringify(S),before); }));
console.log(n+' testes ok');
