'use strict';
/* DeleteAccount (js/delacct.js): Modo dono recusa; sem online "Precisa de internet"; 1º toque explica, 2º só com EXCLUIR digitado;
   deu certo → OnlineBoot.accountDeleted; falhou → nada apagado. node test/sys/delacct.test.js */
const fs=require('fs'), path=require('path'), vm=require('vm'), assert=require('assert');
function run(extra){ const mk=()=>({id:'',children:[],innerHTML:'',addEventListener(){},removeChild(c){this.children=this.children.filter(x=>x!==c);},appendChild(c){c.parentNode=this;this.children.push(c);return c;},querySelector:()=>null});
  const body=mk(), head=mk(); const ctx={document:{body,head,getElementById:()=>null,createElement:()=>mk()},navigator:{onLine:true},setTimeout,clearTimeout,Promise,console};
  Object.assign(ctx,extra||{}); ctx.window=ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(__dirname,'../../js/delacct.js'),'utf8'),ctx); return {ctx,body}; }
const txt=b=>(b.children[0]?b.children[0].innerHTML:'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
(async()=>{ let n=0; const ok=(c,m)=>{ assert.ok(c,m); n++; };
  { const {ctx}=run({OWNER_MODE:true}); ok(ctx.DeleteAccount.open()===false,'Modo dono recusa'); }
  { const {ctx,body}=run({}); ctx.DeleteAccount.open(); ok(/página de exclusão/.test(txt(body)),'sem Sys.net (online desligado): link da página'); }
  { let called=0, gone=null; const {ctx,body}=run({Sys:{net:{deleteAccount:()=>{ called++; return Promise.resolve({ok:true,until:Date.UTC(2026,11,13,12)}); },hasSession:()=>true}},OnlineBoot:{accountDeleted:o=>{ gone=o; }}});
    ctx.DeleteAccount.open(); const t1=txt(body); ok(/30 dias/.test(t1)&&/Compras não são reembolsadas/.test(t1)&&/TODOS os servidores/.test(t1)&&/também será apagado/.test(t1),'1º passo explica (texto do PO)');
    ok(/excluir-conta/.test(body.children[0].innerHTML),'link da página de exclusão');
    ctx.DeleteAccount._act('next'); ok(/digite EXCLUIR/.test(txt(body)),'2º passo pede EXCLUIR');
    ctx.DeleteAccount._act('go','excluo'); ok(called===0,'palavra errada não envia');
    ctx.DeleteAccount._act('go','excluir'); await new Promise(r=>setTimeout(r,5)); ok(called===1,'EXCLUIR envia'); ok(gone&&gone.localSave==='erase','avisa o OnlineBoot (apagar o local)'); ok(txt(body).includes('13/12/2026')&&/cancelada/.test(txt(body)),'pedido enviado com a data'); }
  { let gone=false; const {ctx,body}=run({Sys:{net:{deleteAccount:()=>Promise.reject({code:'offline'}),hasSession:()=>true}},OnlineBoot:{accountDeleted:()=>{ gone=true; }}});
    ctx.DeleteAccount.open(); ctx.DeleteAccount._act('next'); ctx.DeleteAccount._act('go','EXCLUIR'); await new Promise(r=>setTimeout(r,5));
    ok(!gone&&/nada foi apagado/i.test(txt(body))&&/internet/.test(txt(body)),'offline: nada apagado, tente com internet'); }
  { const {ctx,body}=run({}); ctx.DeleteAccount.DATA.localSave='keep'; ctx.Sys={net:{deleteAccount:()=>Promise.resolve(),hasSession:()=>true}}; ctx.DeleteAccount.open(); ok(/jogo sem conta/.test(txt(body)),'opção B: texto de manter'); }
  { const {ctx,body}=run({Sys:{net:{deleteAccount:()=>Promise.reject({code:'no_session'}),hasSession:()=>false}}}); ctx.DeleteAccount.open(); ok(/página de exclusão/.test(txt(body)),'sem sessão: link da página'); }
  { const {ctx,body}=run({Sys:{net:{deleteAccount:()=>Promise.resolve({ok:true,until:Date.now()}),hasSession:()=>true}},OnlineBoot:{accountDeleted:()=>({ok:false,reason:'storage',step:'save'})}});
    ctx.DeleteAccount.open(); ctx.DeleteAccount._act('next'); ctx.DeleteAccount._act('go','EXCLUIR'); await new Promise(r=>setTimeout(r,5)); ok(/não deu para limpar este aparelho/.test(txt(body)),'limpeza falhou: avisa para fechar e abrir'); }
  console.log('ok: '+n+' verificações'); })().catch(e=>{ console.error('FALHOU:',e.message); process.exit(1); });
