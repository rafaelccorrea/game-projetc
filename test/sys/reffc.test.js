// node test/sys/reffc.test.js — Sys.stats.refFromFc: herói de referência = jogador grátis típico da fase, com a FC pedida exata; chave desligada
'use strict';
const assert=require('assert'), fs=require('fs'), path=require('path');
globalThis.Sys={};
['stats','forge','level','fc','tower'].forEach(m=>require('../../js/sys/'+m+'.js'));
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const ST=Sys.stats, FC=Sys.fc;
const fcOf=o=>FC.fcOfStats(Object.assign({},o,{pet:{atk:0,heal:0}}));
const BAL=JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/balance.json'),'utf8')).dificuldade;
t('chave desligada por padrão; setRefFc liga e desliga',()=>{
  assert.strictEqual(ST.refFcOn(),false); assert.strictEqual(ST.setRefFc(true),true); assert.strictEqual(ST.refFcOn(),true); ST.setRefFc(false); assert.strictEqual(ST.refFcOn(),false); });
t('tabela de nível: 90 fases, sem descer, até 113',()=>{ const L=ST.DATA.refFc.lv; assert.strictEqual(L.length,90); for(let i=1;i<90;i++) assert.ok(L[i]>=L[i-1]); assert.strictEqual(L[89],113); });
for(const era9 of [false,true]){
  t('FC exata nas 90 fases (+ fases 91-150) com eras 7-8 '+(era9?'ligadas':'desligadas'),()=>{ ST.setEra9(era9);
    const rec=BAL.pacoteFim.recFc; for(let s=1;s<=150;s++){ const fc=s<=90?rec[s-1]:rec[89]*Math.pow(1.03,s-90), o=ST.refFromFc(fc,s);
      assert.ok(o,'fase '+s); for(const k of ['atk','hp','def','critRate','critDmg','aspd']) assert.ok(Number.isFinite(o[k])&&o[k]>=0,k+' fase '+s);
      assert.ok(Math.abs(fcOf(o)/fc-1)<0.01,'fase '+s+': '+fcOf(o)+' vs '+fc); assert.ok(o.era<=ST.DATA.maxEra); assert.ok(o.rarity<=ST.maxR()); assert.ok(o.level<=120); }
    ST.setEra9(false); });
}
t('diferente da referência antiga (metade/metade): tem DEF e mais VIDA por ATQ, como o jogador de verdade',()=>{ ST.setEra9(true);
  for(const s of [10,30,50,70,90]){ const fc=BAL.pacoteFim.recFc[s-1], a=ST.refFromFc(fc,s), b=Sys.tower.statsFromFC(fc,0);
    assert.ok(a.def>0,'fase '+s+' DEF'); assert.ok(a.hp/a.atk>b.hp/b.atk,'fase '+s+' VIDA/ATQ '+(a.hp/a.atk)+' vs '+(b.hp/b.atk)); }
  ST.setEra9(false); });
t('entrada ruim não quebra: fase 0/texto vira 1, fc negativa vira 0',()=>{ const a=ST.refFromFc(500,0), b=ST.refFromFc(500,'x'), c=ST.refFromFc(-5,10);
  assert.strictEqual(a.level,8); assert.strictEqual(b.level,8); assert.strictEqual(c.atk,0); });
t('sem Sys.fc devolve null (nunca lança)',()=>{ const F=Sys.fc; delete Sys.fc; assert.strictEqual(ST.refFromFc(100,1),null); Sys.fc=F; });
t('recFc suavizado: fase normal pede no máximo 1,3x a anterior dentro da era (fora a abertura da era, o chefe do meio e o Senhor)',()=>{
  for(const r of [BAL.recFc,BAL.pacoteFim.recFc]){ assert.strictEqual(r.length,90); for(let i=1;i<90;i++){ const s=i+1, k=s%10; if(k===1||k===5||k===0) continue; assert.ok(r[i]/r[i-1]<=1.305,'fase '+s+': x'+(r[i]/r[i-1]).toFixed(2)); } } });
console.log(n+' testes ok');
