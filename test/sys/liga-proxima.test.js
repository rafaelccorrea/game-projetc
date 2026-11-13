// node test/sys/liga-proxima.test.js — CONFERÊNCIA para ligar na próxima versão (dono, 14/11): entregas dos itens novos (Sys.newDrops.DATA.on)
// e skins (Sys.appearance.DATA.skinsOn). Com as duas ligadas: (1) nenhuma skin adulta/retirada (off) volta, por nenhum caminho; (2) nada é SORTEADO
// por dinheiro (as fontes pagas entregam item conhecido); (3) toda skin que uma fonte entrega existe, tem arte e não é retirada; (4) o Kael Anjo é sempre sem asa.
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
globalThis.Sys={};
['stats','level','loot','pet','mount','appearance','newdrops'].forEach(m=>require('../../js/sys/'+m+'.js'));
const {makeHost}=require('./_host.js');
const AP=Sys.appearance, ND=Sys.newDrops, ROOT=path.join(__dirname,'../..');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const on=fn=>{ const a=ND.DATA.on, b=AP.DATA.skinsOn; ND.DATA.on=true; AP.DATA.skinsOn=true; try{ fn(); } finally{ ND.DATA.on=a; AP.DATA.skinsOn=b; } };
const OFF=AP.FIXED.filter(k=>k.off===true).map(k=>k.id), LIVE=AP.FIXED.filter(k=>k.off!==true);

t('as duas chaves LIGADAS por padrão (dono 14/11, "liga tudo")',()=>{ assert.strictEqual(ND.DATA.on,true); assert.strictEqual(AP.DATA.skinsOn,true); });
t('skins adultas/retiradas ('+OFF.join(', ')+'): recusadas por TODAS as fontes e pelo Modo dono, mesmo com as chaves ligadas',()=>on(()=>{ assert.ok(OFF.length>=4,'as 4 adultas marcadas off');
  for(const id of OFF) for(const opt of [undefined,{source:'reward'},{source:'shop'},{source:'pass'},{source:'offer'},{owner:true}]){ const S={hero:id.startsWith('kaia')?'kaia':'kael'}; const r=AP.grantFixed(S,id,opt); assert.strictEqual(r.ok,false,id+' '+JSON.stringify(opt)); }
  for(const id of OFF){ const S={hero:id.startsWith('kaia')?'kaia':'kael'}; assert.strictEqual(AP.equipFixed(S,id).ok,false,'equipar '+id); }
  assert.ok(!AP.fixedSkins({hero:'kael'}).some(k=>OFF.includes(k.id)),'não aparece na lista'); assert.ok(!AP.skinProducts({}).some(p=>OFF.includes(p.id)),'não está à venda'); }));
t('toda skin que o newDrops entrega existe, está viva e tem a pasta no disco (nenhuma retirada)',()=>{ const ids=new Set();
  for(const [src,rules] of Object.entries(ND.DATA.sources)) for(const r of rules) if(r.skin) for(const id of Object.values(r.skin)) ids.add(id);
  assert.ok(ids.size>0); for(const id of ids){ const k=AP.FIXED.find(x=>x.id===id); assert.ok(k,'existe '+id); assert.notStrictEqual(k.off,true,'viva '+id);
    const dir=k.dir||id; assert.ok(fs.existsSync(path.join(ROOT,'assets/anim/skins',String(dir).replace(/^assets\/anim\/skins\//,''))),'pasta '+id+' ('+dir+')'); } });
t('nada sorteado por dinheiro: as fontes pagas (loja e VIP) entregam item CONHECIDO, inteiro, sem sorteio',()=>{
  for(const r of ND.DATA.sources['shop:product']) assert.ok(r.skin||(r.mount&&r.whole),JSON.stringify(Object.keys(r)));
  for(const r of ND.DATA.sources['vip:level']) assert.ok(r.skin||r.whole,JSON.stringify(Object.keys(r)));
  /* as regras do newDrops não sorteiam: cada regra dá um item fixo (pet/montaria/skin/asa com id), nunca um pool */
  for(const [src,rules] of Object.entries(ND.DATA.sources)) for(const r of rules) assert.ok(r.pet||r.mount||r.skin||r.wing,src); });
t('com as duas chaves ligadas, a loja entrega a skin comprada (direta) e o VIP 7 a Demônio, sem sorteio',()=>on(()=>{ const h=makeHost({level:60});
  const S={hero:'kael'}; ND.grant(S,h,'shop:product',{productId:'skin_kael_cyborg',orderId:'o1'}); assert.ok(AP.fixedSkins(S).find(k=>k.id==='kael_cyborg').owned);
  const S2={hero:'kaia'}; ND.grant(S2,h,'vip:level',{level:7}); assert.ok(AP.fixedSkins(S2).find(k=>k.id==='kaia_demon').owned); }));
t('Kael Anjo: SEMPRE a pasta sem asa (regra do dono), também com as chaves ligadas',()=>on(()=>{ const k=AP.FIXED.find(x=>x.id==='kael_angel'); assert.ok(/kael_angel_nowing$/.test(String(k.dir)),String(k.dir)); assert.ok(!k.noWingDir); }));
console.log(n+' testes ok');
