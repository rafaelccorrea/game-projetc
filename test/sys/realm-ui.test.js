'use strict';
/* RealmUI.mount (tela de escolha de servidor fora do Panels; v0.13.0): roda antes do boot, sem rede cai no S1, marca eon_realm_seen e só depois troca. node test/sys/realm-ui.test.js */
const fs=require('fs'),vm=require('vm');
function run(extra){ const store={}; const mk=()=>({id:'',children:[],innerHTML:'',listeners:[],addEventListener(t,f){this.listeners.push(f);},removeEventListener(){},appendChild(c){this.children.push(c);return c;}});
  const head=mk(); const ctx={document:{head,getElementById:()=>null,createElement:()=>mk()},localStorage:{setItem:(k,v)=>{store[k]=v;},getItem:k=>store[k]},setTimeout,clearTimeout,setInterval:()=>0,clearInterval(){},console};
  Object.assign(ctx,extra||{}); ctx.window=ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../../js/p_realm.js'),'utf8'),ctx); return {ctx,store,mk}; }
const click=(el,x,id)=>el.listeners[0]({target:{closest:()=>({getAttribute:k=>k==='data-x'?x:id})}});
(async()=>{ const out=[];
  // 1) antes do boot, sem rede, sem Realm/Panels/Sys/S: lista o S1 e não trava
  { const {ctx,store,mk}=run(); const el=mk(); let done=null; const m=ctx.RealmUI.mount(el,{first:true,onDone:id=>{done=id;}}); const t=el.innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    out.push(['1 S1 local',/S1 · Nova Era/.test(t)&&/Novo/.test(t)&&/Recomendado/.test(t)&&/Atual/.test(t)&&/Escolha o seu servidor/.test(t)&&!/Voltar/.test(t)&&!/undefined|NaN/.test(t)]);
    click(el,'pick','s1'); out.push(['2 toque no atual: onDone + marca',done==='s1'&&store.eon_realm_seen==='1']);
    out.push(['3 sem rolagem lateral',!/overflow-x:auto/.test(el.innerHTML)&&/overflow-x:hidden/.test(el.innerHTML)]); out.push(['4 badge',ctx.realmBadge()==='S1 · Nova Era']); }
  // 2) com lista do servidor (S1 atual, S2 novo) e Realm.set: escolher outro confirma, grava a marca ANTES e troca
  { let setTo=null; const realms=[{id:'s1',code:'S1',name:'Nova Era',state:'open',recommended:false,me:{name:'Rafa',level:14,fc:900}},{id:'s2',code:'S2',name:'Aurora',state:'new',recommended:true,openedAt:Date.UTC(2026,10,20)}];
    const {ctx,store,mk}=run({Realm:{id:()=>'s1',set:id=>{ setTo={id,seen:store.eon_realm_seen}; }},Sys:{net:{realms:()=>Promise.resolve(realms)},fc:{viewText:v=>v+' FC'}}});
    const el=mk(); ctx.RealmUI.mount(el,{first:false,onDone:()=>{}}); await new Promise(r=>setTimeout(r,10)); const t=el.innerHTML.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ');
    out.push(['5 lista do servidor (S2 primeiro, Voltar, Rafa Nv 14)',t.indexOf('S2 · Aurora')<t.indexOf('S1 · Nova Era')&&/Voltar/.test(t)&&/Rafa · Nv. 14/.test(t)]);
    click(el,'pick','s2'); out.push(['6 pede confirmação',/Entrar no S2 · Aurora/.test(el.innerHTML)]); click(el,'cfyes');
    out.push(['7 marca antes do Realm.set',setTo&&setTo.id==='s2'&&setTo.seen==='1']); }
  // 3) lotado sem personagem: não entra
  { const {ctx,mk}=run({Realm:{id:()=>'s1',set:()=>{ throw new Error('não devia'); }},Sys:{net:{realms:()=>Promise.resolve([{id:'s1',code:'S1',name:'Nova Era',state:'open'},{id:'s2',code:'S2',name:'Cheio',state:'full'}])}}});
    const el=mk(); ctx.RealmUI.mount(el,{first:true}); await new Promise(r=>setTimeout(r,10)); click(el,'pick','s2'); out.push(['8 lotado sem personagem bloqueia',/Servidor lotado/.test(el.innerHTML)&&!/Entrar no/.test(el.innerHTML)]); }
  // 4) rede caindo: segue com o S1
  { const {ctx,mk}=run({Sys:{net:{realms:()=>Promise.reject({code:'offline'})}}}); const el=mk(); ctx.RealmUI.mount(el,{first:true}); await new Promise(r=>setTimeout(r,10));
    out.push(['9 sem rede: S1 + aviso',/S1 · Nova Era/.test(el.innerHTML)&&/Sem conexão/.test(el.innerHTML)]); }
  for(const [k,v] of out) console.log(v?'OK  ':'FALHA',k); process.exit(out.every(x=>x[1])?0:1); })();
