// node test/sys/skin-visual.test.js — skins do VIP 7 (Kael Demônio, Kaia Demônia) são SÓ VISUAIS (teto de +10% do VIP, dono 14/11)
'use strict';
const assert=require('assert');
globalThis.Sys={};
['appearance','skin'].forEach(m=>require('../../js/sys/'+m+'.js'));
const A=Sys.appearance;
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
t('as skins do VIP 7 estão marcadas visualOnly; as outras não',()=>{
  const list=A.FIXED;
  const demon=list.filter(k=>/_demon$/.test(k.id)); assert.ok(demon.length>=2,'achei as skins demônio');
  for(const k of demon) assert.strictEqual(k.visualOnly,true,k.id);
  assert.ok(list.some(k=>!k.visualOnly),'as outras continuam com bônus');
});
console.log(n+' testes ok');
