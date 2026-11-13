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
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

/* itens já fechados do lado de sistema (ordem da ARTE_MATRIZ). nome = o que a tela mostra hoje; ult = tier esperado */
const ITENS=[
  {e:0,r:0,fam:'club',nome:'Graveto Afiado',ult:'base',codex:'w-0-0'},
  {e:0,r:1,fam:'club',nome:'Clava de Pedra',ult:'base',codex:'w-0-0'},
  {e:0,r:2,fam:'club',nome:'Lança de Sílex',ult:'base',codex:'w-0-1'},   // nome de lança, arte de clava: decisão de texto com o PO
];
for(const I of ITENS){ const it={slot:'weapon',e:I.e,r:I.r,lvl:1,gold:0,subs:[]}, key='era'+I.e+'_'+RKEY[I.r];
  t(key+' ('+RNAME[I.r]+'): arte no disco (ícone/mão + grip no meta.json) e ultimate da era',()=>{
    assert.ok(has('assets/weapons/'+key+'.png'),key); assert.ok(META[key]&&Array.isArray(META[key].grip),'grip '+key); assert.ok(has('assets/anim/ult/era'+I.e+'_ult.png')); });
  t(key+': família '+I.fam+', ultimate '+I.ult+' com a folha da era pronta',()=>{ assert.strictEqual(ST.weaponType(it),I.fam); const u=ST.ultOf(it); assert.strictEqual(u.tier,I.ult); assert.strictEqual(u.baseReady,true); assert.strictEqual(u.fallback,false); });
  t(key+': efeito '+RNAME[I.r]+' nos 3 golpes (mesmo dano; só visual)',()=>{ for(const k of ['s1','s2','s3']){ const f=ST.skillFx(it,k); assert.strictEqual(f.r,I.r); assert.strictEqual(f.name,RNAME[I.r]); assert.strictEqual(f.dmgMult,1); } });
  t(key+': atributo acima da raridade de baixo; secundários = '+ST.subCount(I.r),()=>{ const a=ST.mainOf(it,1,0).atk; assert.ok(a>0); if(I.r>0) assert.ok(a>ST.mainOf(Object.assign({},it,{r:I.r-1}),1,0).atk); });
  t(key+': fontes: drop da era '+I.e+' ('+RAR_DROP[I.r]+'% das quedas) e Invocação (peso '+LT.DATA.summon.rarWeights[I.r]+')',()=>{ assert.strictEqual(RAR_DROP.length,5); assert.ok(RAR_DROP[I.r]>0); assert.ok(LT.DATA.summon.rarWeights[I.r]>0); });
  t(key+': Códex marca '+I.codex,()=>{ const S={inv:[Object.assign({},it)],sys:{}}; assert.ok(CX.catalog().some(c=>c.id===I.codex)); assert.ok([...CX.scan(S)].includes(I.codex)); });
  t(key+': nome na tela "'+I.nome+'"',()=>{ assert.strictEqual(eraNames(I.e)[I.r],I.nome); });
}
console.log(n+' testes ok');
