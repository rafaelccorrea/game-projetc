// Correio × Sys.newDrops (fps-server §14): a carta do servidor com att.newDrops {src, ctx} entrega o prêmio da TABELA do newdrops.js no resgate,
// uma vez por carta; com o Sys.newDrops desligado a carta não é consumida; fonte que não é do servidor é ignorada. Processo próprio.
'use strict';
const assert=require('assert');
const {makeHost}=require('./_host.js');
const M=require('../../js/sys/mail.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };
const calls=[];
// Sys.newDrops falso: registra as chamadas e devolve um "got" reconhecível (a tabela de verdade tem teste próprio no newdrops)
globalThis.Sys=globalThis.Sys||{};
Sys.newDrops={DATA:{on:false}, grant:(S,host,src,ctx)=>{ calls.push({src,ctx}); return {ok:true,got:[{kind:'pet',id:'obsidian',n:20,src}]}; }};
Sys.loot={grantBundle:(S,host,att)=>({bundle:Object.assign({},att)})};
M.DATA.enabled=true;
const srv=h=>[{id:'w-1',title:'Torneio de Fim de Semana',att:{newDrops:{src:'tourney:weekend',ctx:{rank:7}}},createdAt:h.t,expiresAt:h.t+864e5,source:'weekend'},
  {id:'g-1',title:'Baú do território',att:{forge:2,items:[{slot:'armor',r:2}],newDrops:{src:'guild:weekly'}},createdAt:h.t,expiresAt:h.t+864e5,source:'torneio'},
  {id:'x-1',title:'Fonte local',att:{gems:5,newDrops:{src:'tower:floor',ctx:{floor:50}}},createdAt:h.t,expiresAt:h.t+864e5,source:'evento'}];

t('Sys.newDrops desligado: a carta com newDrops NÃO é consumida (fica para quando ligar); as outras resgatam normal',()=>{
  const S={}, h=makeHost(); M.receive(S,h,srv(h)); calls.length=0;
  assert.deepStrictEqual(M.claim(S,h,'w-1'),{ok:false,reason:'novos_desligado'});
  assert.strictEqual(M.inbox(S,h).find(m=>m.id==='w-1').claimed,false,'continua para resgatar');
  const all=M.claimAll(S,h); assert.deepStrictEqual(all.list.map(x=>x.id),['x-1'],'claimAll pula as que esperam a chave');
  assert.strictEqual(calls.length,0);
});
t('ligado: resgate chama Sys.newDrops.grant(src, ctx) da carta, uma vez; o pacote comum vai sem a chave newDrops',()=>{
  Sys.newDrops.DATA.on=true; const S={}, h=makeHost(); M.receive(S,h,srv(h)); calls.length=0;
  const r=M.claim(S,h,'w-1'); assert.strictEqual(r.ok,true); assert.deepStrictEqual(calls,[{src:'tourney:weekend',ctx:{rank:7}}]);
  assert.deepStrictEqual(r.got,{newDrops:[{kind:'pet',id:'obsidian',n:20,src:'tourney:weekend'}]},'só newDrops: sem pacote comum');
  assert.deepStrictEqual(M.claim(S,h,'w-1'),{ok:false,reason:'resgatado'}); assert.strictEqual(calls.length,1,'a mesma carta não entrega de novo');
  const g=M.claim(S,h,'g-1'); assert.deepStrictEqual(g.got.bundle,{forge:2,items:[{slot:'armor',r:2}]}); assert.strictEqual(g.got.newDrops.length,1);
  assert.deepStrictEqual(calls[1],{src:'guild:weekly',ctx:{}},'sem ctx: objeto vazio');
});
t('fonte que NÃO é do servidor (ex.: tower:floor) é ignorada: resgata o resto e não chama o newDrops',()=>{
  const S={}, h=makeHost(); M.receive(S,h,srv(h)); calls.length=0;
  const r=M.claim(S,h,'x-1'); assert.strictEqual(r.ok,true); assert.deepStrictEqual(r.got,{bundle:{gems:5}}); assert.strictEqual(calls.length,0);
});
t('a mesma carta recebida de novo do servidor (já resgatada) não entrega outra vez',()=>{
  const S={}, h=makeHost(); M.receive(S,h,srv(h)); M.claim(S,h,'w-1'); calls.length=0;
  M.receive(S,h,srv(h)); assert.deepStrictEqual(M.claim(S,h,'w-1'),{ok:false,reason:'resgatado'}); assert.strictEqual(calls.length,0);
});
console.log(n+' testes ok');
