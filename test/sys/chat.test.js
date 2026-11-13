// node test/sys/chat.test.js — Sys.chat: frases prontas (sem texto livre), canais, anti-spam, conta nova, silenciar/bloquear, denúncia, provider e P_CHAT
'use strict';
const assert=require('assert');
const C=require('../../js/sys/chat.js');
const {makeHost}=require('./_host.js');
let n=0; const t=(name,fn)=>{ fn(); n++; console.log('ok -',name); };
const H=3600000;
const SCREEN=['Bom jogo!','Valeu!','Oi, pessoal!','Boa sorte no chefe!','Alguém para a guilda?','Entrem na minha guilda!','Parabéns!','Que sorte!','Bora subir no ranking!','Ajuda no chefe?','Já volto!','Bom dia!','Boa noite!','Foi por pouco!','Que drop lindo!','Vamos de arena?','Obrigado pela ajuda!','Nova era liberada!','Até mais!','GG!'];
/* servidor falso: guarda envios e denúncias; mensagens por canal */
function fakeServer(){ const f={sent:[],reports:[],msgs:{world:[],era:[],guild:[]}};
  f.p={online:true,messages:(S,h,ch)=>f.msgs[ch],send:(S,h,ch,i,id)=>{ f.sent.push([ch,i,id]); return {ok:true}; },report:(S,h,r)=>{ f.reports.push(r); return {ok:true}; }};
  return f; }
const born=(S,h)=>{ C.ensure(S,h); S.sys.chat.born=h.t-2*H; };   // conta antiga (passou da 1ª hora)

t('CHAVE desligada por padrão: tudo responde off e o save não muda',()=>{
  assert.strictEqual(C.DATA.on,false); const S={}, h=makeHost();
  assert.deepStrictEqual(C.status(S,h),{on:false,online:false,reason:'off',text:''});
  assert.strictEqual(C.canSend(S,h,'world',0).reason,'off'); assert.strictEqual(C.send(S,h,'world',0).ok,false);
  assert.strictEqual(C.mute(S,h,'p1').reason,'off'); assert.strictEqual(C.block(S,h,'p1').reason,'off'); assert.strictEqual(C.report(S,h,'p1','spam').reason,'off');
  assert.strictEqual(C.isMuted(S,h,'p1'),false); assert.deepStrictEqual(C.messages(S,h,'world'),[]); assert.strictEqual(C.newLeftMs(S,h),0);
  C.ensure(S,h); assert.strictEqual(S.sys.chat.born,0,'desligada: não marca nascimento');
  const P=C.screenProvider(S,h); assert.strictEqual(P.online(),false); assert.strictEqual(P.guild(),false); assert.strictEqual(P.send('w',0).ok,false);
  C.DATA.on=true;
});

t('FRASES: ~40, 20 primeiras = as da tela na mesma ordem; categorias; ids únicos; sem parâmetro de texto livre',()=>{
  const all=C.phrases(); assert.strictEqual(all.length,40); assert.deepStrictEqual(all.slice(0,20).map(p=>p.txt),SCREEN);
  assert.strictEqual(new Set(all.map(p=>p.id)).size,40); assert.strictEqual(new Set(all.map(p=>p.txt)).size,40);
  const cats=C.categories(); for(const c of ['cumprimento','guilda','batalha','agradecimento','ajuda','despedida']) assert.ok(cats.find(x=>x.id===c).n>=5,c);
  assert.strictEqual(cats.reduce((a,c)=>a+c.n,0),40); assert.ok(all.every(p=>cats.some(c=>c.id===p.cat)));
  assert.ok(C.phrases('guilda').every(p=>p.cat==='guilda'&&C.phrase(p.i).txt===p.txt));
  assert.strictEqual(C.phrase(40),null); assert.strictEqual(C.phrase('Oi'),null); assert.strictEqual(C.phrase(1.5),null);
  assert.ok(C.reportReasons().map(r=>r.id).join()==='ofensa,spam,golpe,nome,outro');
});

t('PROVIDER padrão OFFLINE: sem mensagens nem jogadores simulados; enviar diz server',()=>{
  C.setProvider(null); const S={}, h=makeHost(); born(S,h);
  assert.deepStrictEqual(C.status(S,h),{on:true,online:false,reason:'server',text:'O chat precisa do servidor online: em breve'});
  assert.deepStrictEqual(C.messages(S,h,'world'),[]); assert.strictEqual(C.canSend(S,h,'world',0).reason,'server');
  const r=C.send(S,h,'world',0); assert.strictEqual(r.reason,'server'); assert.strictEqual(S.sys.chat.last,0,'não anota envio');
  assert.strictEqual(C.screenProvider(S,h).online(),false);
});

t('CANAIS: mundial e era sempre; guilda só com Sys.guild ligado e o jogador numa guilda',()=>{
  const f=fakeServer(); C.setProvider(f.p); const S={}, h=makeHost(); born(S,h); delete globalThis.Sys.guild;
  assert.strictEqual(C.channels(S,h).find(c=>c.id==='guild').available,false); assert.strictEqual(C.canSend(S,h,'guild',0).reason,'channel');
  assert.strictEqual(C.canSend(S,h,'nada',0).reason,'channel');
  globalThis.Sys.guild={DATA:{on:false},inGuild:()=>true}; assert.strictEqual(C.inGuild(S),false,'guilda desligada');
  globalThis.Sys.guild.DATA.on=true; assert.strictEqual(C.channels(S,h).find(c=>c.id==='guild').available,true); assert.ok(C.send(S,h,'g',4).ok);
  assert.deepStrictEqual(f.sent,[['guild',4,'alguem_guilda']]);
  globalThis.Sys.guild.inGuild=()=>{ throw new Error('x'); }; assert.strictEqual(C.inGuild(S),false,'erro no Sys.guild não derruba');
  delete globalThis.Sys.guild;
});

t('CONTA NOVA só lê na 1ª hora (nascimento no 1º ensure com a chave; host.accountCreated tem prioridade; servidor pode alongar)',()=>{
  const f=fakeServer(); C.setProvider(f.p); const S={}, h=makeHost(); C.ensure(S,h); assert.strictEqual(S.sys.chat.born,h.t);
  const r=C.canSend(S,h,'world',0); assert.strictEqual(r.reason,'new'); assert.strictEqual(r.msLeft,H);
  h.t+=H-1; assert.strictEqual(C.newLeftMs(S,h),1); h.t+=1; assert.ok(C.canSend(S,h,'world',0).ok);
  h.t-=10*H; assert.strictEqual(C.newLeftMs(S,h),H,'relógio voltado: nunca mais de 1 h');
  const S2={}, h2=makeHost(); h2.accountCreated=()=>h2.t-2*H; assert.strictEqual(C.newLeftMs(S2,h2),0,'conta antiga pelo host');
  f.p.newLeftMs=()=>5000; C.setProvider(f.p); assert.strictEqual(C.newLeftMs(S2,h2),5000,'servidor manda'); delete f.p.newLeftMs; C.setProvider(f.p);
});

t('ANTI-SPAM: 1 a cada 3 s, máx 10/min, mesma frase 3x seguidas bloqueada',()=>{
  const f=fakeServer(); C.setProvider(f.p); const S={}, h=makeHost(); born(S,h);
  assert.ok(C.send(S,h,'world',0).ok); let r=C.send(S,h,'world',1); assert.strictEqual(r.reason,'cooldown'); assert.strictEqual(r.msLeft,3000);
  h.t+=2999; assert.strictEqual(C.cooldownMs(S,h),1); h.t+=1; assert.ok(C.send(S,h,'world',0).ok,'2ª igual ok');
  h.t+=3000; assert.strictEqual(C.send(S,h,'world',0).reason,'repeat','3ª igual seguida não'); assert.ok(C.send(S,h,'world',1).ok,'outra frase ok');
  h.t+=3000; assert.ok(C.send(S,h,'world',0).ok,'depois de outra, volta');
  const S2={}; born(S2,h); const t0=h.t; for(let i=0;i<10;i++){ assert.ok(C.send(S2,h,'world',i).ok,'envio '+i); h.t+=3000; }
  r=C.send(S2,h,'world',11); assert.strictEqual(r.reason,'rate'); assert.strictEqual(r.msLeft,t0+60000-h.t);
  h.t=t0+60000; assert.ok(C.send(S2,h,'world',11).ok,'o mais antigo saiu da janela');
  assert.strictEqual(C.canSend(S2,h,'world',-1).reason,'phrase'); assert.strictEqual(C.canSend(S2,h,'world','GG!').reason,'phrase');
  h.t-=100000; assert.ok(C.cooldownMs(S2,h)<=3000,'relógio voltado: espera no máximo 3 s');
});

t('servidor recusa: não anota; erro do provider não derruba',()=>{
  const f=fakeServer(); f.p.send=()=>({ok:false,reason:'muted_by_mod',cdMs:9000}); C.setProvider(f.p); const S={}, h=makeHost(); born(S,h);
  const r=C.send(S,h,'world',0); assert.deepStrictEqual([r.ok,r.reason,r.msLeft],[false,'muted_by_mod',9000]); assert.strictEqual(S.sys.chat.last,0);
  f.p.send=()=>{ throw new Error('rede'); }; C.setProvider(f.p); assert.strictEqual(C.send(S,h,'world',0).reason,'server');
  C.setProvider({online:()=>{ throw new Error('x'); }}); assert.strictEqual(C.status(S,h).online,false);
});

t('SILENCIAR (por tempo) e BLOQUEAR: locais, no save, escondem as mensagens',()=>{
  const f=fakeServer(); C.setProvider(f.p); const S={}, h=makeHost(); born(S,h);
  f.msgs.world=[{id:'m1',who:'p1',name:'Ana',text:'Oi, pessoal!'},{id:'m2',who:'p2',name:'Bia',text:'GG!'},{id:'m3',system:true,text:'aviso'},{id:'m4',who:'me',mine:true,text:'Valeu!'}];
  assert.strictEqual(C.messages(S,h,'world').length,4);
  assert.ok(C.mute(S,h,'p1',H).ok); assert.ok(C.isMuted(S,h,'p1')); assert.deepStrictEqual(C.messages(S,h,'w').map(m=>m.id),['m2','m3','m4']);
  h.t+=H; assert.ok(!C.isMuted(S,h,'p1'),'silêncio acaba'); C.mute(S,h,'p1'); assert.ok(C.unmute(S,h,'p1').ok); assert.ok(!C.isMuted(S,h,'p1'));
  C.mute(S,h,'p1',1e15); assert.ok(S.sys.chat.muted.p1<=h.t+30*24*H,'teto de 30 dias');
  assert.ok(C.block(S,h,'p2').ok); assert.ok(C.block(S,h,'p2').ok); assert.deepStrictEqual(S.sys.chat.blocked,['p2']); assert.ok(C.isBlocked(S,h,'p2'));
  assert.deepStrictEqual(C.messages(S,h,'world').map(m=>m.id),['m3','m4']); assert.ok(C.unblock(S,h,'p2').ok); assert.ok(!C.isBlocked(S,h,'p2'));
  assert.strictEqual(C.block(S,h,'').reason,'who'); assert.strictEqual(C.mute(S,h,{x:1}).reason,'who');
});

t('DENÚNCIA: motivos por id ou rótulo da tela, fila local, vai ao servidor quando online, sem duplicar, limite por dia',()=>{
  C.setProvider(null); const S={}, h=makeHost(); born(S,h);
  const r=C.report(S,h,'p1','Golpe ou fraude',{msg:'m9'}); assert.ok(r.ok); assert.strictEqual(r.sent,false); assert.strictEqual(C.pendingReports(S).length,1);
  assert.strictEqual(C.pendingReports(S)[0].reason,'golpe'); assert.ok(C.report(S,h,'p1','golpe',{msg:'m9'}).dup);
  assert.strictEqual(C.report(S,h,'p1','xingou').reason,'reason'); assert.strictEqual(C.report(S,h,null,'spam').reason,'who');
  const f=fakeServer(); C.setProvider(f.p); assert.strictEqual(C.flushReports(S,h),1); assert.strictEqual(f.reports[0].reason,'golpe'); assert.strictEqual(C.pendingReports(S).length,0);
  for(let i=1;i<20;i++) assert.ok(C.report(S,h,'x'+i,'spam').ok); assert.strictEqual(C.report(S,h,'x99','spam').reason,'limit');
  h.t+=25*H; assert.ok(C.report(S,h,'x99','spam').ok,'no dia seguinte volta');
});

t('ensure: save sujo não quebra',()=>{
  const S={sys:{chat:{born:'x',last:-5,lastPhrase:999,streak:'a',sent:[1,'x',null,NaN,2],muted:[1,2],blocked:[null,'a','a',{},'b'],reports:[null,{who:'p',reason:'spam'},{who:'p',reason:'nada'},{reason:'spam'}],seq:-1}}};
  const o=C.ensure(S,makeHost()); assert.strictEqual(o.lastPhrase,-1); assert.deepStrictEqual(o.sent,[1,2]); assert.deepStrictEqual(o.muted,{}); assert.deepStrictEqual(o.blocked,['a','b']);
  assert.strictEqual(o.reports.length,1); assert.strictEqual(o.last,0);
  const S2={sys:{chat:'lixo'}}; C.ensure(S2); assert.strictEqual(typeof S2.sys.chat,'object'); C.ensure({sys:null});
  assert.throws(()=>C.ensure(null));
});

t('screenProvider = window.P_CHAT da tela (canal w/e/g, índice da frase, textos pt-BR, getter do save)',()=>{
  const f=fakeServer(); C.setProvider(f.p); let S={}; const h=makeHost(); C.ensure(S,h);
  const P=C.screenProvider(()=>S,h); for(const k of ['online','messages','send','report','block','mute','cooldownMs','newLeftMs','guild']) assert.strictEqual(typeof P[k],'function',k);
  assert.strictEqual(P.online(),true); assert.strictEqual(P.newLeftMs(),H); const r=P.send('w',0); assert.strictEqual(r.ok,false); assert.strictEqual(r.reason,'Conta nova só lê na 1ª hora'); assert.strictEqual(r.cdMs,H);
  S={}; born(S,h); assert.strictEqual(P.newLeftMs(),0,'segue o save novo');
  assert.deepStrictEqual(P.send('w',19),{ok:true}); assert.deepStrictEqual(f.sent.pop(),['world',19,'gg']); assert.ok(P.cooldownMs()>0); assert.ok(/Espere/.test(P.send('e',1).reason));
  assert.strictEqual(P.send('g',1).ok,false); assert.strictEqual(P.guild(),false);
  f.msgs.era=[{id:'e1',who:'p7',name:'Caio',text:'GG!'}]; assert.strictEqual(P.messages('e').length,1);
  assert.ok(P.report('e1','Spam').ok); assert.deepStrictEqual([f.reports[0].who,f.reports[0].msg,f.reports[0].reason],['p7','e1','spam']);
  assert.ok(P.mute('p7',H).ok); assert.strictEqual(P.messages('e').length,0); assert.ok(P.block('p8').ok);
  assert.strictEqual(P.report('e1','qualquer').ok,false);
});
console.log(`\nchat: ${n} testes ok`);
