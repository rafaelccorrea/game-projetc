// Correio (Q-10): remetente/tipo, validade por carta, formato da caixa do servidor (mail-core), importação e resgate idempotente.
// Teste da fps-e2 (autorizado pela fps-6f a acrescentar só esses pontos ao js/sys/mail.js). Processo próprio.
'use strict';
const assert=require('assert');
const {makeHost}=require('./_host.js');
const M=require('../../js/sys/mail.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; }catch(e){ console.error('FALHOU:',name); throw e; } };
const DAY=864e5;

t('desligado: send/receive não gravam nada',()=>{ const S={}, h=makeHost(); assert.strictEqual(M.send(S,h,{title:'x'}),0); assert.strictEqual(M.receive(S,h,[{id:'a',title:'x'}]),0); assert.deepStrictEqual(M.inbox(S,h),[]); });

M.DATA.enabled=true;
t('tipo e remetente: type explícito, ou pelo source do servidor, ou pelo anexo; validade padrão 30 dias e por carta',()=>{
  const S={}, h=makeHost();
  M.send(S,h,{title:'Prêmio da arena',source:'arena',att:{gems:5}});
  M.send(S,h,{title:'Aviso',type:'system'});
  M.send(S,h,{title:'Guilda',type:'guild',from:'Lobos de Ferro'});
  M.send(S,h,{title:'Evento',source:'evento',att:{goldk:10},expiresAt:h.t+3*DAY});
  M.send(S,h,{title:'Sem nada',att:{forge:2}});
  const L=M.inbox(S,h), by=k=>L.find(m=>m.title===k);
  assert.deepStrictEqual([by('Prêmio da arena').type,by('Aviso').type,by('Guilda').type,by('Evento').type,by('Sem nada').type],['reward','system','guild','event','reward']);
  assert.strictEqual(by('Guilda').from,'Lobos de Ferro'); assert.strictEqual(by('Aviso').from,'Equipe Eonbound'); assert.strictEqual(by('Prêmio da arena').source,'arena');
  assert.strictEqual(by('Aviso').daysLeft,30); assert.strictEqual(by('Evento').daysLeft,3); assert.strictEqual(by('Evento').expiresAt,by('Evento').exp); assert.ok(by('Aviso').createdAt>0);
  h.t+=4*DAY; assert.ok(!M.inbox(S,h).some(m=>m.title==='Evento'),'venceu');
});
t('caixa do servidor: importa no formato do mail-core (id texto), sem duplicar; resgate idempotente pela carta',()=>{
  const S={}, h=makeHost(); const srv=[{id:'m-1',title:'Compensação',body:'Desculpe',att:{gems:20},createdAt:h.t-DAY,expiresAt:h.t+10*DAY,source:'compensacao',ref:'inc-7'},
    {id:'m-2',title:'Ranking',att:{gold:100},createdAt:h.t,expiresAt:h.t+DAY,source:'ranking',claimed:true},{id:'m-3',title:'Velha',expiresAt:h.t-1},{title:'sem id'}];
  assert.strictEqual(M.receive(S,h,srv),2,'a vencida e a sem id ficam fora'); assert.strictEqual(M.receive(S,h,srv),0,'não duplica');
  const c=M.inbox(S,h).find(m=>m.id==='m-1'); assert.deepStrictEqual([c.type,c.from,c.ref],['system','Equipe Eonbound','inc-7']);
  assert.strictEqual(M.claim(S,h,'m-2').reason,'resgatado','o servidor disse que já foi resgatada');
  const g0=h.gems, r=M.claim(S,h,'m-1'); assert.ok(r.ok); assert.strictEqual(M.claim(S,h,'m-1').reason,'resgatado');
  // a carta some (ex.: apagada) e o servidor manda de novo: não paga outra vez
  M.ensure(S).list=M.ensure(S).list.filter(m=>m.id!=='m-1'); M.receive(S,h,[srv[0]]); assert.strictEqual(M.claim(S,h,'m-1').reason,'resgatado','idempotente pela carta');
  assert.ok(h.gems>=g0);
});
t('save sujo e save antigo (só id número, sem tipo) continuam valendo',()=>{
  const S={sys:{mail:{seq:2,list:[{id:1,title:'Antiga',att:{gems:1},at:1,exp:9e15},{id:'',title:'x'},{id:{},title:'y'},null],done:[5,'ok',{}]}}}; M.ensure(S);
  const m=S.sys.mail.list; assert.strictEqual(m.length,1); assert.deepStrictEqual([m[0].type,m[0].from],['reward','Prêmios']); assert.deepStrictEqual(S.sys.mail.done,[5,'ok']);
});
M.DATA.enabled=false;
console.log(`ok: ${n} testes`);
