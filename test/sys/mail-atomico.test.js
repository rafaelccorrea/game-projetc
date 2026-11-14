// node test/sys/mail-atomico.test.js — Correio (achados do QA): entrega ATÔMICA do prêmio (falha no meio não marca a carta nem entrega parte),
// resgatar tudo com uma carta quebrada, caixa cheia que não apaga carta com prêmio pendente, e o.done que não esquece carta resgatada
// (servidor reenviando não paga de novo). Processo próprio.
'use strict';
const assert=require('assert');
globalThis.Sys=globalThis.Sys||{};
const {makeHost}=require('./_host.js');
const M=require('../../js/sys/mail.js');
let n=0; const t=(name,fn)=>{ try{ fn(); n++; console.log('ok -',name); }catch(e){ console.error('FALHOU:',name); throw e; } };
const DAY=864e5;
// Sys.loot falso que entrega na ordem: ouro (host), pedras (no save), itens (host) e QUEBRA quando o pacote pede 'boom'
Sys.loot={grantBundle:(S,host,b)=>{ const out={gold:0,items:[]};
  if(b.gold){ host.addGold(b.gold); out.gold=b.gold; }
  if(b.forge){ S.sys.forge=S.sys.forge||{stones:0}; S.sys.forge.stones+=b.forge; out.forge=b.forge; }
  for(const it of b.items||[]){ host.addItem(it); out.items.push(it); }
  if(b.boom) throw new Error('grant quebrou no meio');
  if(b.skin){ host.addSkin(b.skin); out.skin=b.skin; }
  return out; }};
M.DATA.enabled=true;
const host=()=>{ const h=makeHost(); h.skins=[]; h.addSkin=id=>{ h.skins.push(id); }; return h; };

t('falha no meio da entrega: a carta NÃO fica resgatada e nada é entregue (nem ouro, nem pedras, nem item)',()=>{
  const S={gold:0}, h=host(); const id=M.send(S,h,{title:'Quebrada',att:{gold:50,forge:3,items:[{slot:'hat',r:1}],boom:true,skin:'x'}});
  const before=JSON.stringify(S);
  const r=M.claim(S,h,id); assert.strictEqual(r.ok,false); assert.strictEqual(r.reason,'falha'); assert.ok(/quebrou/.test(r.error));
  assert.strictEqual(JSON.stringify(S),before,'o save voltou ao que era');
  assert.deepStrictEqual([h.gold,h.items.length,h.skins.length],[0,0,0],'o host não recebeu nada');
  const m=M.inbox(S,h).find(x=>x.id===id); assert.strictEqual(m.claimed,false); assert.ok(!S.sys.mail.done.includes(id));
  // conserta o pacote e tenta de novo: entrega tudo uma vez
  S.sys.mail.list.find(x=>x.id===id).att.boom=false;
  const r2=M.claim(S,h,id); assert.strictEqual(r2.ok,true); assert.deepStrictEqual([h.gold,h.items.length,h.skins.length,S.sys.forge.stones],[50,1,1,3]);
  assert.strictEqual(M.claim(S,h,id).reason,'resgatado'); assert.strictEqual(h.gold,50,'sem crédito duplo');
});

t('resgatar tudo: cada carta é atômica; a quebrada fica pendente e não derruba as outras',()=>{
  const S={}, h=host();
  const a=M.send(S,h,{title:'A',att:{gold:10}}), b=M.send(S,h,{title:'B',att:{gold:99,forge:5,boom:true}}), c=M.send(S,h,{title:'C',att:{forge:2}});
  const r=M.claimAll(S,h); assert.deepStrictEqual(r.list.map(x=>x.id).sort(),[a,c].sort()); assert.deepStrictEqual(r.fail,[{id:b,reason:'falha'}]);
  assert.strictEqual(h.gold,10); assert.strictEqual(S.sys.forge.stones,2,'as 5 pedras da quebrada não entraram');
  const L=M.inbox(S,h); assert.deepStrictEqual([a,b,c].map(id=>L.find(m=>m.id===id).claimed),[true,false,true]);
});

t('sem Sys.loot: carta com o que a reserva não sabe entregar NÃO é consumida (antes os itens se perdiam)',()=>{
  const L=Sys.loot; delete Sys.loot;
  try{ const S={}, h=host(); const id=M.send(S,h,{title:'Itens',att:{gold:5,items:[{slot:'hat',r:1}]}});
    assert.deepStrictEqual(M.claim(S,h,id),{ok:false,reason:'sem_loot'}); assert.strictEqual(h.gold,0); assert.strictEqual(M.inbox(S,h)[0].claimed,false);
    const g=M.send(S,h,{title:'Gemas',att:{gems:7}}); assert.strictEqual(M.claim(S,h,g).ok,true); assert.strictEqual(h.gems,7);
  } finally { Sys.loot=L; }
});

t('falha no host na hora de aplicar: volta tudo também',()=>{
  const S={}, h=host(); let calls=0; h.addItem=()=>{ calls++; throw new Error('mochila quebrou'); };
  const id=M.send(S,h,{title:'X',att:{gold:30,forge:4,items:[{slot:'hat',r:1}]}});
  const r=M.claim(S,h,id); assert.strictEqual(r.reason,'falha'); assert.strictEqual(calls,1);
  assert.ok(!(S.sys.forge&&S.sys.forge.stones),'pedras voltaram'); assert.strictEqual(M.inbox(S,h)[0].claimed,false);
});

t('caixa cheia: carta com prêmio pendente nunca é apagada sozinha; saem antes as lidas sem prêmio',()=>{
  const S={}, h=host(); const max=M.DATA.max;
  const ids=[]; for(let i=0;i<max;i++){ ids.push(M.send(S,h,{title:'P'+i,att:{gold:1}})); h.t+=1; }
  const extra=M.send(S,h,{title:'Nova',att:{gold:2}}); const L=M.inbox(S,h);
  assert.strictEqual(L.length,max+1,'todas com prêmio: passa do limite'); assert.ok(L.some(m=>m.id===ids[0]),'a mais antiga com prêmio continua');
  // aviso sem anexo lido e um não lido: com a caixa acima do limite, sai o LIDO
  const lido=M.send(S,h,{title:'Aviso lido'}); M.read(S,h,lido); const naoLido=M.send(S,h,{title:'Aviso novo'});
  const L2=M.inbox(S,h); assert.ok(!L2.some(m=>m.id===lido),'o lido sai'); assert.ok(L2.some(m=>m.id===naoLido)||L2.length>=max,'nenhuma com prêmio saiu');
  assert.strictEqual(L2.filter(m=>m.hasAtt&&!m.claimed).length,max+1,'todas as com prêmio pendente continuam');
  // receive (servidor) também respeita
  M.receive(S,h,[{id:'s-1',title:'Servidor',att:{gems:1},expiresAt:h.t+DAY}]); assert.ok(M.inbox(S,h).some(m=>m.id===ids[0]));
  assert.ok(M.inbox(S,h).some(m=>m.id===extra));
});

t('o.done não esquece: 350 cartas resgatadas e o servidor reenvia a 1ª → não paga de novo',()=>{
  const S={}, h=host(); const srv=i=>({id:'m-'+i,title:'R'+i,att:{gold:1},createdAt:h.t,expiresAt:h.t+10*DAY});
  for(let i=0;i<350;i++){ M.receive(S,h,[srv(i)]); assert.strictEqual(M.claim(S,h,'m-'+i).ok,true); M.remove(S,h,'m-'+i); }
  assert.strictEqual(h.gold,350);
  M.receive(S,h,[srv(0)]); assert.strictEqual(M.claim(S,h,'m-0').reason,'resgatado','antes (300 ids) pagava de novo'); assert.strictEqual(h.gold,350);
  // depois de vencer + 30 dias de folga o id pode sair: o servidor mandando a carta vencida é recusado pelo receive
  h.t+=41*DAY; M.inbox(S,h); assert.ok(S.sys.mail.done.length<350,'poda por data');
  assert.strictEqual(M.receive(S,h,[{...srv(0),createdAt:h.t-50*DAY,expiresAt:h.t-31*DAY}]),0,'vencida não entra');
  // save antigo (só ids, sem validade): continua valendo
  const S2={sys:{mail:{done:[1,'a'],list:[{id:'a',title:'x',att:{gold:1},at:1,exp:h.t+DAY}]}}}; assert.strictEqual(M.claim(S2,h,'a').reason,'resgatado');
});

M.DATA.enabled=false;
console.log(`ok: ${n} testes`);
