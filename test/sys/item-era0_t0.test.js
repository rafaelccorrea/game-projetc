// node test/sys/item-era0_t0.test.js — COLUNA DE SISTEMA da Clava Básica (era0_t0), 1º item da matriz (docs/SISTEMA_MATRIZ.md):
// dados do item, família e golpes, Forja +0..+15 (e +16..+20 atrás da chave), aura da Forja, ultimate da era 0, efeito por raridade, fontes, Códex.
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
globalThis.Sys={};
['stats','forge','level','fc','loot','codex'].forEach(m=>require('../../js/sys/'+m+'.js'));
const ST=Sys.stats, FG=Sys.forge, LT=Sys.loot, CX=Sys.codex;
const ROOT=path.join(__dirname,'../..'), has=f=>fs.existsSync(path.join(ROOT,f));
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const CLAVA={slot:'weapon',e:0,r:0,lvl:1,gold:0,subs:[]};

t('arte no disco: ícone/mão (assets/weapons/era0_t0.png + meta.json com grip), ultimate da era 0 (folha + json)',()=>{
  assert.ok(has('assets/weapons/era0_t0.png')); const M=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/weapons/meta.json'),'utf8')).era0_t0;
  assert.ok(M&&Array.isArray(M.grip)&&M.grip.length===2,'grip'); assert.ok(has('assets/anim/ult/era0_ult.png')&&has('assets/anim/ult/era0_ult.json')); });
t('família Clava (corpo a corpo, arte da era 0); ultimate = folha-base era0_ult pronta',()=>{
  assert.strictEqual(ST.weaponType(CLAVA),'club'); assert.strictEqual(ST.weaponStyle(CLAVA),'melee');
  const u=ST.ultOf(CLAVA); assert.strictEqual(u.type,'club'); assert.strictEqual(u.sheet,'assets/anim/ult/era0_ult'); assert.strictEqual(u.baseReady,true); assert.strictEqual(u.fallback,false); });
t('efeito por raridade (Básico) nos 3 golpes: sem brilho, sem partícula extra, dano x1',()=>{ for(const k of ['s1','s2','s3']){ const f=ST.skillFx(CLAVA,k); assert.strictEqual(f.r,0); assert.strictEqual(f.name,'Básico'); assert.strictEqual(f.dmgMult,1); assert.strictEqual(f.glow,0); } });
t('atributo: ATK principal positivo e cresce com o nível e a Forja; Básico é o menor das 5 raridades',()=>{
  const a1=ST.mainOf(CLAVA,1,0).atk, a20=ST.mainOf(CLAVA,20,0).atk, f=ST.mainOf(CLAVA,1,0.93).atk; assert.ok(a1>0&&a20>a1&&f>a1,a1+' '+a20+' '+f);
  for(let r=1;r<=4;r++) assert.ok(ST.mainOf(Object.assign({},CLAVA,{r}),1,0).atk>a1,'r'+r); });
t('Forja hoje: +0..+15, chance e pedras para cada nível, teto pela era (era 0: +6), aura +4 azul, +7 roxa, +10 chamas, +13 dourada',()=>{
  assert.strictEqual(FG.DATA.max,15); assert.strictEqual(FG.DATA.bonus.length,16); assert.strictEqual(FG.DATA.chance.length,15); assert.strictEqual(FG.DATA.stones.length,15);
  assert.strictEqual(FG.capOf({eraMax:()=>0}),6); const S={}; FG.ensure(S);
  for(const [lv,id] of [[0,'none'],[3,'none'],[4,'blue'],[7,'purple'],[10,'flame'],[13,'gold'],[15,'gold']]){ S.sys.forge.lv.weapon=lv; assert.strictEqual(FG.aura(S).id,id,'+'+lv); } });
t('Forja +16..+20 atrás da chave: desligada nada muda; ligada teto 20 (era 7: +18, era 8: +20), bônus 1,05..1,53; desligar corta para +15 (teto do ensure)',()=>{
  assert.strictEqual(FG.forge20On(),false); const snap=JSON.stringify([FG.DATA.max,FG.DATA.bonus,FG.DATA.chance,FG.DATA.stones,FG.DATA.capByEra]);
  FG.setForge20(true); FG.setForge20(true); assert.strictEqual(FG.DATA.max,20); assert.deepStrictEqual(FG.DATA.bonus.slice(16),[1.05,1.17,1.29,1.41,1.53]);
  assert.strictEqual(FG.DATA.chance.length,20); assert.strictEqual(FG.DATA.stones.length,20); assert.strictEqual(FG.capOf({eraMax:()=>7}),18); assert.strictEqual(FG.capOf({eraMax:()=>8}),20);
  const S={}; FG.ensure(S).lv.weapon=20; assert.strictEqual(FG.level(S,'weapon'),20); assert.strictEqual(FG.mult(S,'weapon'),1.53); assert.strictEqual(FG.aura(S).id,'gold');
  FG.setForge20(false); assert.strictEqual(JSON.stringify([FG.DATA.max,FG.DATA.bonus,FG.DATA.chance,FG.DATA.stones,FG.DATA.capByEra]),snap);
  FG.ensure(S); assert.strictEqual(S.sys.forge.lv.weapon,15); assert.strictEqual(FG.level(S,'weapon'),15); assert.strictEqual(FG.mult(S,'weapon'),0.93); assert.strictEqual(FG.chance(S,'weapon'),0); });
t('fontes: é a arma inicial (index.html newState), cai na era 0 (Básico é a raridade mais comum do drop) e sai na Invocação (peso 50 de 100)',()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'); assert.ok(/const w=\{id:1,slot:'weapon',r:0,e:0,lvl:1/.test(html),'arma inicial');
  assert.deepStrictEqual(LT.DATA.summon.rarWeights.slice(0,1),[50]); assert.ok(LT.DATA.summon.rarWeights[0]===Math.max(...LT.DATA.summon.rarWeights)); });
t('Códex: a clava Básica (e a Rara) marca o item w-0-0',()=>{ const S={inv:[Object.assign({},CLAVA)],sys:{}}; assert.ok(CX.catalog().some(c=>c.id==='w-0-0')); assert.ok(CX.scan?[...CX.scan(S)].includes('w-0-0'):true); });
t('nome na tela: ERAS[0].w[0] (index.html) = "Clava de Pedra" (nomes aprovados pelo dono em 14/11, docs/NOMES_ARMAS.md: o nome bate com o desenho)',()=>{
  const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'); const m=/w:\['([^']+)','([^']+)'/.exec(html); assert.ok(m); assert.strictEqual(m[1],'Clava de Pedra'); });
console.log(n+' testes ok');
