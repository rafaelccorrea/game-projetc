// node test/sys/item-armas.test.js — COLUNA DE SISTEMA das armas da matriz (docs/SISTEMA_MATRIZ.md, ordem da docs/ARTE_MATRIZ.md), um item por vez.
// Para cada arma: arte que o sistema lê, família, ultimate, efeito por raridade, atributo, fontes (drop / invocação), Códex e nome na tela.
// A Forja (+0..+15, aura, +16..+20 atrás da chave) é igual para toda arma: test/sys/item-era0_t0.test.js.
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
globalThis.Sys={};
['stats','forge','level','fc','loot','codex'].forEach(m=>require('../../js/sys/'+m+'.js'));
const ST=Sys.stats, LT=Sys.loot, CX=Sys.codex, ROOT=path.join(__dirname,'../..'), has=f=>fs.existsSync(path.join(ROOT,f));
const HTML=fs.readFileSync(path.join(ROOT,'index.html'),'utf8'), META=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/weapons/meta.json'),'utf8'));
const RKEY=['t0','raro','t1','mitico','t2'], RNAME=['Básico','Raro','Épico','Mítico','Lendário'];
/* nomes da tela: ERAS[e].w (index.html); drop por raridade: RAR[r].drop (index.html) */
const eraNames=e=>{ const blocks=HTML.split(/\n \{n:'/).slice(1); const m=/w:\[([^\]]+)\]/.exec(blocks[e]); return m[1].split(',').map(x=>x.trim().replace(/^'|'$/g,'')); };
const RAR_DROP=[...HTML.matchAll(/\{n:'(Básico|Raro|Épico|Mítico|Lendário)',\s*c:'[^']+',\s*m:[\d.]+,\s*pull:(\d+),\s*drop:([\d.]+)\}/g)].map(m=>+m[3]);
const ERA78=(()=>{ const src=fs.readFileSync(path.join(ROOT,'js/sys/eras.js'),'utf8'), m=[...src.matchAll(/w:\[([^\]]+)\]/g)].map(x=>x[1].split(',').map(y=>y.trim().replace(/^'|'$/g,''))); return {7:m[0],8:m[1]}; })();
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

/* itens já fechados do lado de sistema (ordem da ARTE_MATRIZ). nome = o que a tela mostra hoje; ult = tier esperado */
const ITENS=[
  {e:0,r:0,fam:'club',nome:'Graveto Afiado',ult:'base',codex:'w-0-0'},
  {e:0,r:1,fam:'club',nome:'Clava de Pedra',ult:'base',codex:'w-0-0'},
  {e:0,r:2,fam:'club',nome:'Lança de Sílex',ult:'base',codex:'w-0-1'},   // nome de lança, arte de clava: decisão de texto com o PO
  {e:0,r:3,fam:'club',nome:'Machado de Osso',ult:'boost',codex:'w-0-1',mythic:true},   // arma Mítica: BLOQUEADA no lançamento (abaixo)
  {e:0,r:4,fam:'club',nome:'Presa de Mamute',ult:'own',codex:'w-0-2',own:'assets/anim/ult/club_legend'},   // ultimate própria: o jogo liga no boot (js/battle.js:510 goLive('ults'))
  // itens 6-10: gládio da era 1
  {e:1,r:0,fam:'gladius',nome:'Lança de Bronze',ult:'base',codex:'w-1-0'},{e:1,r:1,fam:'gladius',nome:'Gládio',ult:'base',codex:'w-1-0'},{e:1,r:2,fam:'gladius',nome:'Falcata de Ferro',ult:'base',codex:'w-1-1'},
  {e:1,r:3,fam:'gladius',nome:'Xifos Espartano',ult:'boost',codex:'w-1-1',mythic:true},{e:1,r:4,fam:'gladius',nome:'Lâmina de Aquiles',ult:'own',codex:'w-1-2',own:'assets/anim/ult/gladius_legend'},
  // adiantados: eras 2 a 8 (eras 7-8 com Sys.stats.setEra9; Códex só tem 7 eras: codex null)
  {e:2,r:0,fam:'sword',nome:'Espada Enferrujada',ult:'base',codex:'w-2-0'},
  {e:2,r:1,fam:'sword',nome:'Espada de Aço',ult:'base',codex:'w-2-0'},
  {e:2,r:2,fam:'sword',nome:'Lâmina Rúnica',ult:'base',codex:'w-2-1'},
  {e:2,r:3,fam:'sword',nome:'Espada do Dragão',ult:'boost',codex:'w-2-1',mythic:true},
  {e:2,r:4,fam:'sword',nome:'Excalibur',ult:'own',codex:'w-2-2',own:'assets/anim/ult/sword_legend'},
  {e:3,r:0,fam:'flintlock',nome:'Pistola de Pederneira',ult:'base',codex:'w-3-0'},
  {e:3,r:1,fam:'flintlock',nome:'Mosquete',ult:'base',codex:'w-3-0'},
  {e:3,r:2,fam:'flintlock',nome:'Arcabuz Raro',ult:'base',codex:'w-3-1'},
  {e:3,r:3,fam:'flintlock',nome:'Bacamarte Real',ult:'boost',codex:'w-3-1',mythic:true},
  {e:3,r:4,fam:'flintlock',nome:'Canhão de Mão Dourado',ult:'own',codex:'w-3-2',own:'assets/anim/ult/flintlock_legend'},
  {e:4,r:0,fam:'revolver',nome:'Revólver a Vapor',ult:'base',codex:'w-4-0'},
  {e:4,r:1,fam:'revolver',nome:'Rifle de Repetição',ult:'base',codex:'w-4-0'},
  {e:4,r:2,fam:'revolver',nome:'Carabina Steampunk',ult:'base',codex:'w-4-1'},
  {e:4,r:3,fam:'revolver',nome:'Metralhadora Gatling',ult:'boost',codex:'w-4-1',mythic:true},
  {e:4,r:4,fam:'revolver',nome:'Canhão de Tesla',ult:'own',codex:'w-4-2',own:'assets/anim/ult/revolver_legend'},
  {e:5,r:0,fam:'rifle',nome:'Pistola 9mm',ult:'base',codex:'w-5-0'},
  {e:5,r:1,fam:'rifle',nome:'Fuzil de Assalto',ult:'base',codex:'w-5-0'},
  {e:5,r:2,fam:'rifle',nome:'Fuzil de Precisão',ult:'base',codex:'w-5-1'},
  {e:5,r:3,fam:'rifle',nome:'Minigun',ult:'boost',codex:'w-5-1',mythic:true},
  {e:5,r:4,fam:'rifle',nome:'Railgun Protótipo',ult:'own',codex:'w-5-2',own:'assets/anim/ult/rifle_legend'},
  {e:6,r:0,fam:'plasma',nome:'Blaster Básico',ult:'base',codex:'w-6-0'},
  {e:6,r:1,fam:'plasma',nome:'Espada de Plasma',ult:'base',codex:'w-6-0'},
  {e:6,r:2,fam:'plasma',nome:'Rifle de Íons',ult:'base',codex:'w-6-1'},
  {e:6,r:3,fam:'plasma',nome:'Canhão de Antimatéria',ult:'boost',codex:'w-6-1',mythic:true},
  {e:6,r:4,fam:'plasma',nome:'Lâmina do Vazio',ult:'own',codex:'w-6-2',own:'assets/anim/ult/plasma_legend'},
  {e:7,r:0,fam:'infernal',nome:'Tridente de Brasa',ult:'base',codex:null},
  {e:7,r:1,fam:'infernal',nome:'Foice Sombria',ult:'base',codex:null},
  {e:7,r:2,fam:'infernal',nome:'Lâmina Infernal',ult:'base',codex:null},
  {e:7,r:3,fam:'infernal',nome:'Garra do Abismo',ult:'boost',codex:null,mythic:true},
  {e:7,r:4,fam:'infernal',nome:'Ceifadora do Submundo',ult:'own',codex:null,own:'assets/anim/ult/infernal_legend'},
  {e:8,r:0,fam:'celestial',nome:'Lança de Luz',ult:'base',codex:null},
  {e:8,r:1,fam:'celestial',nome:'Espada Alada',ult:'base',codex:null},
  {e:8,r:2,fam:'celestial',nome:'Lâmina Celeste',ult:'base',codex:null},
  {e:8,r:3,fam:'celestial',nome:'Gládio do Firmamento',ult:'boost',codex:null,mythic:true},
  {e:8,r:4,fam:'celestial',nome:'Juízo do Arcanjo',ult:'own',codex:null,own:'assets/anim/ult/celestial_legend'},
];
ST.goLive('ults');   /* como o jogo faz no boot (js/battle.js:510): liga as ultimates próprias aprovadas e entregues */
for(const I of ITENS){ ST.setEra9(I.e>=7); const it={slot:'weapon',e:I.e,r:I.r,lvl:1,gold:0,subs:[]}, key='era'+I.e+'_'+RKEY[I.r];
  t(key+' ('+RNAME[I.r]+'): arte no disco (ícone/mão + grip no meta.json) e ultimate da era',()=>{
    assert.ok(has('assets/weapons/'+key+'.png'),key); assert.ok(META[key]&&Array.isArray(META[key].grip),'grip '+key); assert.ok(has('assets/anim/ult/era'+I.e+'_ult.png')); });
  t(key+': família '+I.fam+', ultimate '+I.ult+' com a folha da era pronta',()=>{ assert.strictEqual(ST.weaponType(it),I.fam); const u=ST.ultOf(it); assert.strictEqual(u.tier,I.ult); assert.strictEqual(u.baseReady,true); assert.strictEqual(u.fallback,false);
    if(I.own){ assert.strictEqual(u.ownReady,true); assert.strictEqual(u.sheet,I.own); assert.ok(has(I.own+'.png')&&has(I.own+'.json'),'folha própria no disco'); } });
  t(key+': efeito '+RNAME[I.r]+' nos 3 golpes (mesmo dano; só visual)',()=>{ for(const k of ['s1','s2','s3']){ const f=ST.skillFx(it,k); assert.strictEqual(f.r,I.r); assert.strictEqual(f.name,RNAME[I.r]); assert.strictEqual(f.dmgMult,1); } });
  t(key+': atributo acima da raridade de baixo; secundários = '+ST.subCount(I.r),()=>{ const a=ST.mainOf(it,1,0).atk; assert.ok(a>0); if(I.r>0) assert.ok(a>ST.mainOf(Object.assign({},it,{r:I.r-1}),1,0).atk); });
  t(key+': fontes: drop da era '+I.e+' ('+RAR_DROP[I.r]+'% das quedas) e Invocação (peso '+LT.DATA.summon.rarWeights[I.r]+')',()=>{ assert.strictEqual(RAR_DROP.length,5); assert.ok(RAR_DROP[I.r]>0); assert.ok(LT.DATA.summon.rarWeights[I.r]>0); });
  if(I.codex) t(key+': Códex marca '+I.codex,()=>{ const S={inv:[Object.assign({},it)],sys:{}}; assert.ok(CX.catalog().some(c=>c.id===I.codex)); assert.ok([...CX.scan(S)].includes(I.codex)); });
  t(key+': nome na tela "'+I.nome+'"',()=>{ assert.strictEqual(I.e<=6?eraNames(I.e)[I.r]:ERA78[I.e][I.r],I.nome); });
}
/* ARMA MÍTICA: a regra do lançamento (Sys.loot.DATA.launch.noMythicWeapon) troca todo sorteio de arma Mítica por Épica. Hoje ninguém consegue a arma Mítica. */
t('arma Mítica LIBERADA (dono 14/11): a Invocação dá Mítico a 6%; com a regra antiga ligada, só a armadura dá Mítico',()=>{ const {makeHost}=require('./_host.js'), h=makeHost({level:90,eraMax:6}), L=LT.DATA.launch, keep=L.noMythicWeapon;
  try{ assert.strictEqual(keep,false,'liberada'); assert.strictEqual(LT.summonOdds(h).byR[3],6); L.noMythicWeapon=true; const on=LT.summonOdds(h), ws=on.weaponShare/100; assert.ok(Math.abs(on.byR[3]-Math.round((1-ws)*6*100)/100)<0.01,'só armadura: '+on.byR[3]);
    L.noMythicWeapon=false; assert.strictEqual(LT.summonOdds(h).byR[3],6); } finally { L.noMythicWeapon=keep; } });
console.log(n+' testes ok');
