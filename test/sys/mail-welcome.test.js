// node test/sys/mail-welcome.test.js — Sys.mail.welcomeOnce (carta local de boas-vindas, sem anexo, uma vez só)
'use strict';
const assert=require('assert');
const {makeHost}=require('./_host.js');
const M=require('../../js/sys/mail.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };

t('desligado: não manda nada',()=>{ M.DATA.enabled=false; const S={}; assert.strictEqual(M.welcomeOnce(S,makeHost()),0); M.DATA.enabled=true; });
t('manda uma vez, sem anexo, tipo system, texto sem prometer prêmio',()=>{
  M.DATA.enabled=true; const S={}, h=makeHost(); const id=M.welcomeOnce(S,h); assert.ok(id);
  const [m]=M.inbox(S,h); assert.strictEqual(m.title,'Bem-vindo a Eonbound'); assert.strictEqual(m.type,'system'); assert.strictEqual(m.hasAtt,false); assert.strictEqual(m.ref,'boasvindas-v1');
  assert.ok(!/gema|💎|ouro|grátis/i.test(m.body)); assert.strictEqual(M.welcomeOnce(S,h),0); assert.strictEqual(M.inbox(S,h).length,1);
});
t('apagada ou vencida: não volta; save antigo (com outras cartas) recebe uma vez',()=>{
  const S={}, h=makeHost(); M.welcomeOnce(S,h); const id=M.inbox(S,h)[0].id; assert.ok(M.remove(S,h,id)); assert.strictEqual(M.welcomeOnce(S,h),0);
  const S2={}; M.send(S2,h,{title:'Aviso'}); assert.ok(M.welcomeOnce(S2,h)); h.t+=31*86400000; assert.strictEqual(M.inbox(S2,h).length,0); assert.strictEqual(M.welcomeOnce(S2,h),0);
  const S3={sys:{mail:{list:[{id:7,title:'Bem-vindo a Eonbound',ref:'boasvindas-v1',at:h.t,exp:h.t+86400000}]}}}; assert.strictEqual(M.welcomeOnce(S3,h),0);
});
M.DATA.enabled=false;
console.log(n+' testes ok');
