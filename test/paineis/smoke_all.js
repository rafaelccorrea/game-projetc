/* Teste de fumaça SEM navegador: roda os scripts reais do jogo num vm com um DOM falso e chama as telas, para pegar erro de execução
   (variável que não existe, TypeError) nos modelos de HTML. Não confere visual nenhum. Uso: node smoke.js <pasta do jogo> [largura] [altura] */
const fs=require('fs'), path=require('path'), vm=require('vm');
const ROOT=process.argv[2], W=+(process.argv[3]||390), H=+(process.argv[4]||656);
const log=[]; const real={};
function mkStub(name){ const f=function(){}; const p=new Proxy(f,{
  get(t,k){ if(k===Symbol.toPrimitive) return ()=>0; if(k===Symbol.iterator) return function*(){}; if(k==='then') return undefined; if(k in real&&real[k]!==undefined&&name==='el') return real[k];
    if(k==='length') return 0; if(k==='innerHTML'||k==='textContent'||k==='className'||k==='src'||k==='id'||k==='value') return t['_'+String(k)]||'';
    if(k==='style'||k==='dataset') return t['_'+k]||(t['_'+k]={}); if(k==='classList') return {add(){},remove(){},toggle(){},contains(){return false;}};
    if(k==='getBoundingClientRect') return ()=>({left:0,top:0,width:58,height:58,right:58,bottom:58});
    if(k==='clientWidth'||k==='offsetWidth'||k==='width') return W; if(k==='clientHeight'||k==='offsetHeight'||k==='height') return 844;
    if(k==='querySelector'||k==='getElementById'||k==='closest') return ()=>null; if(k==='querySelectorAll'||k==='getElementsByTagName') return ()=>[];
    if(k==='children'||k==='childNodes') return []; if(k==='parentNode') return null; if(k==='matches') return false;
    return p; },
  set(t,k,v){ t['_'+String(k)]=v; return true; }, apply(){ return p; }, construct(){ return p; }, has(){ return true; } }); return p; }
const els={};
const V={clientWidth:W,clientHeight:H,offsetWidth:W,innerHTML:'',scrollTop:0,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false;}},
  addEventListener(){},removeEventListener(){},querySelector(){return null;},querySelectorAll(){return [];},contains(){return true;},appendChild(){},getBoundingClientRect(){return {left:0,top:0,width:W,height:H};}};
const store={};
const document={ readyState:'complete', hidden:false, title:'', body:mkStub('el'), head:mkStub('el'), documentElement:mkStub('el'),
  getElementById(id){ if(id==='view') return V; if(/^(xg_|xs_|xh_|xp_|xr_|g_|res_|fb)/.test(id)) return null; return els[id]||(els[id]=mkStub('el')); },
  createElement(){ return mkStub('el'); }, createTextNode(){ return mkStub('el'); }, querySelector(){ return null; }, querySelectorAll(){ return []; },
  addEventListener(){}, removeEventListener(){}, write(s){ log.push('document.write: '+String(s).slice(0,80)); }, fonts:mkStub('x') };
document.body.classList;
const Q=[]; const flush=()=>{ let n=0; while(Q.length&&n<200){ const f=Q.shift(); n++; try{ if(typeof f==='function') f(); }catch(e){ console.log('ERRO em timer: '+String(e&&e.stack).slice(0,300)); process.exitCode=1; } } return n; }; const sandbox={ flushT:()=>flush(), console, document, V_TEST:V, setTimeout(fn,ms){ Q.push(fn); return Q.length; }, clearTimeout(){}, setInterval(){return 0;}, clearInterval(){}, requestAnimationFrame(){return 0;}, cancelAnimationFrame(){},
  localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}}, navigator:{userAgent:'node',vibrate(){},serviceWorker:undefined},
  location:{search:'?debug=1&fresh=1&skip=1',href:'http://x/?debug=1',pathname:'/',replace(){},reload(){}}, performance:{now:()=>Date.now()}, fetch:()=>({then(){return this;},catch(){return this;}}),
  Image:function(){ return mkStub('el'); }, Audio:function(){ return mkStub('el'); }, matchMedia:()=>({matches:false,addEventListener(){},addListener(){}}), addEventListener(){}, removeEventListener(){}, dispatchEvent(){},
  URL, URLSearchParams, Event:function(){}, devicePixelRatio:1, innerWidth:W, innerHeight:844, screen:{width:W,height:844}, getComputedStyle:()=>mkStub('x'), alert(){}, confirm(){return true;},
  Math, Date, JSON, Object, Array, String, Number, Boolean, RegExp, Error, TypeError, Map, Set, WeakMap, Promise, Symbol, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent, Intl, Proxy, Reflect, Float32Array, Uint8Array };
sandbox.window=sandbox; sandbox.self=sandbox; sandbox.globalThis=sandbox; sandbox.top=sandbox;
vm.createContext(sandbox);
function run(code,name){ try{ vm.runInContext(code,sandbox,{filename:name}); return true; }catch(e){ console.log('ERRO ao carregar '+name+': '+(e&&e.stack?e.stack.split('\n').slice(0,3).join(' | '):e)); return false; } }
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const scripts=[]; html.replace(/<script>([\s\S]*?)<\/script>/g,(m,c)=>{ scripts.push(c); return m; });
console.log('scripts embutidos:',scripts.length,scripts.map(s=>s.length).join(','));
const main=scripts.reduce((a,b)=>b.length>a.length?b:a,'');
let ok=run(main,'index.html#main');
const sysList=(function(){ const m=html.match(/\[([^\]]*'loot'[^\]]*)\]/); if(!m) return ''; let l=m[1]; if(l.indexOf("'fc'")<0) l+=",'fc'"; return l; })()   /* lista de módulos do index (a parte atrás de NEXT_ON não entra; 'fc' é sempre o último) */, jsList=(html.match(/\[([^\]]*'battle'[^\]]*)\]\.forEach\(n=>document\.write\('<script src="js\//)||[])[1];
const names=l=>(l||'').split(',').map(x=>x.trim().replace(/'/g,'')).filter(Boolean);
console.log('sys:',names(sysList).join(' '),'| js:',names(jsList).join(' '));
for(const n of names(sysList)) run(fs.readFileSync(path.join(ROOT,'js/sys',n+'.js'),'utf8'),'sys/'+n+'.js');
for(const n of names(jsList)){ run(fs.readFileSync(path.join(ROOT,'js',n+'.js'),'utf8'),n+'.js'); if(n==='screens'){ const extra=['equipfx','panels'].concat(fs.readdirSync(path.join(ROOT,'js')).filter(x=>/^p_.*\.js$/.test(x)).map(x=>x.replace(/\.js$/,''))); for(const x of extra) if(fs.existsSync(path.join(ROOT,'js',x+'.js'))) run(fs.readFileSync(path.join(ROOT,'js',x+'.js'),'utf8'),x+'.js'); } }
/* arranque mínimo: módulos + estado; depois enche a mochila e chama cada tela */
const T=(label,code)=>{ try{ const r=vm.runInContext(code,sandbox,{filename:'teste:'+label}); console.log('OK   '+label+(r!==undefined?' → '+String(r).slice(0,160):'')); return r; }catch(e){ console.log('FALHA '+label+': '+(e&&e.stack?e.stack.split('\n').slice(0,4).join(' | '):e)); process.exitCode=1; } };
T('sysBoot',"if(typeof sysBoot==='function') sysBoot(); typeof Sys+' host:'+typeof (Sys&&Sys.host)");
T('estado',"S.gold=5e6; S.gems=900; if(window.__plvSet) 0; S.inv.length+' itens, eq '+JSON.stringify(S.eq)");
T('encher mochila',"(function(){ const sl=SLOTS7.filter(s=>s!=='wing'); let n=0; for(let i=0;i<14;i++){ try{ addItemToBag({slot:sl[i%sl.length],r:i%5,e:Math.min(S.eraMax,i%2),subs:undefined}); n++; }catch(e){ return 'addItemToBag: '+e.message; } } return n+' adicionados, mochila '+S.inv.length; })()");
const scr=(v,pre)=>T('tela '+v+(pre?' ['+pre+']':''),"(function(){ "+(pre||'')+"; view='"+v+"'; render(); const h=V_TEST.innerHTML; if(/undefined|NaN|\\[object/.test(h)){ const m=h.match(/.{60}(undefined|NaN|\\[object).{40}/); return 'SUSPEITO: '+(m?m[0]:''); } return h.length+' chars'; })()");
scr('gear'); scr('gear',"XG.filter='weapon'");
T('gBest',"JSON.stringify({n:gBest().n})");
T('equipar melhor (sem voo)',"(function(){ XG.filter='all'; const b=gBest(); if(!b.n) return 'nada a melhorar'; const fc0=heroFC(); PANEL_V2.equipFly=false; gClick({dataset:{x:'best'}}); PANEL_V2.equipFly=true; return 'FC '+Math.round(fc0)+' → '+Math.round(heroFC())+'; sobra '+gBest().n+'; html '+V_TEST.innerHTML.length; })()");
scr('gear',"XG.tw=null");
T('botão apagado',"/Já está com<br>o melhor/.test(V_TEST.innerHTML)");
T('comparação',"(function(){ const it=S.inv.find(x=>S.eq[x.slot]!==x.id)||S.inv[0]; XG.sel=it.id; view='gear'; render(); const h=V_TEST.innerHTML; XG.sel=null; return /undefined|NaN/.test(h)?'SUSPEITO '+h.match(/.{50}(undefined|NaN).{30}/)[0]:h.length+' chars'; })()");
T('gFlyBest sem animate',"(function(){ const it=S.inv.find(x=>S.eq[x.slot]===x.id); if(it) delete S.eq[it.slot]; const b=gBest(); gFlyBest(b); return 'n='+b.n+' fly='+JSON.stringify(XG.fly)+' sobra '+gBest().n; })()");
scr('summon'); scr('shop',"XH.tab='hero'"); scr('shop',"XH.tab='weapon'"); scr('shop',"XH.tab='item'"); scr('shop',"XH.tab='gem'"); scr('shop',"XH.tab='col'");
T('loja: prévia + confirmação',"(function(){ XH.tab='hero'; const sk=hList('hero').find(s=>hStatus(s).buy); if(!sk) return 'sem skin à venda'; XH.sel=sk.id; XH.cf={kind:'skin',id:sk.id}; S.gems=0; view='shop'; render(); S.gems=900; const h=V_TEST.innerHTML; XH.sel=null; XH.cf=null; return (/Faltam/.test(h)?'mostra Faltam; ':'SEM Faltam; ')+h.length; })()");
T('loja: confirmação de item',"(function(){ XH.tab='item'; XH.cf={kind:'item',i:0}; view='shop'; render(); const h=V_TEST.innerHTML; XH.cf=null; return (/Vai direto para a mochila/.test(h)?'ok ':'SEM texto ')+h.length; })()");
scr('pass',"passTab='pass'"); scr('pass',"passTab='mis'; XP.mt='d'"); scr('pass',"passTab='mis'; XP.mt='w'");
scr('prog',"XR.tab='prac'"); scr('prog',"XR.tab='tit'");
/* contorno comum (cabeçalho + voltar) ligado: as 5 telas de novo */
T('contorno ligado',"PANEL_V2.frame=true; 'ok'");
for(const v of ['gear','summon','shop','pass','prog']) scr(v,"XH.tab='hero'; passTab='pass'");
T('contorno: cabeçalho presente',"/x-head/.test(V_TEST.innerHTML)&&/data-x=.xback/.test(V_TEST.innerHTML)");
T('dims com contorno',"JSON.stringify({gear:xFit(680,614),loja:xFit(684,532)})");
T('contorno desligado',"PANEL_V2.frame=false; 'ok'");
/* telas novas registradas (item 3): liga cada uma só aqui no teste e desenha */
T('painéis registrados',"Object.keys(Panels.defs).join(',')||'(nenhum)'");
for(const nm of (function(){ try{ return vm.runInContext('Object.keys(Panels.defs)',sandbox); }catch(e){ return []; } })()){ T('ligar '+nm,"Panels.enable('"+nm+"')"); if(!vm.runInContext("!!Panels.defs['"+nm+"'].overlay",sandbox)){ scr(nm); scr(nm,'PANEL_V2.frame=true'); T('desliga contorno',"PANEL_V2.frame=false; 1"); } }
T('dims',"JSON.stringify({gear:xFit(680,614),loja:xFit(684,532),passe:xFit(682,610)})");
const cls=()=>{ const s=new Set(); return {add(...a){a.forEach(x=>s.add(x));},remove(...a){a.forEach(x=>s.delete(x));},toggle(c,on){ if(on===undefined) on=!s.has(c); on?s.add(c):s.delete(c); },contains(c){return s.has(c);},list:s}; };
const POS={hat:[10,8],armor:[10,100],boots:[10,192],weapon:[322,8],gloves:[322,100],necklace:[322,192],wing:[166,6]};
const boxes={}; for(const k in POS) boxes[k]={dataset:{slotbox:k},classList:cls(),appendChild(){},getBoundingClientRect(){ return {left:POS[k][0],top:POS[k][1]+62,width:58,height:58,right:POS[k][0]+58,bottom:POS[k][1]+120}; }};
const cell=id=>({dataset:{id:String(id)},classList:cls(),parentNode:{classList:cls()},getBoundingClientRect(){ return {left:20,top:560,width:58,height:58,right:78,bottom:618}; },closest(){ return this; }});
V.querySelectorAll=sel=>sel.indexOf('data-slotbox')>=0?Object.values(boxes).filter(b=>sel.indexOf('.x-drop')<0||b.classList.contains('x-drop')):[];
V.querySelector=sel=>{ let m=sel.match(/data-slotbox="([a-z]+)"/); if(m) return boxes[m[1]]||null; m=sel.match(/x-cell.data-id="([0-9]+)"/); if(m) return cell(+m[1]); return null; };
sandbox.cellOf=cell; sandbox.boxes=boxes;
T('voo: equipar melhor com animação',"(function(){ flushT(); XG.tw=null; XG.sel=null; view='gear'; const eqd=S.inv.filter(x=>S.eq[x.slot]===x.id).slice(0,3); eqd.forEach(x=>{ delete S.eq[x.slot]; }); statsChanged(); render(); const fc0=heroFC(), b=gBest(); gClick({dataset:{x:'best'}}); const mid=!!XG.fly; gClick({dataset:{x:'best'}}); const n=flushT(); return 'plano '+b.n+' itens; voando='+mid+'; timers '+n+'; fly depois='+XG.fly+'; FC '+Math.round(fc0)+' → '+Math.round(heroFC())+'; sobra '+gBest().n+'; tw.big='+(XG.tw&&XG.tw.big); })()");
T('voo: html com pouso e +FC',"(function(){ const h=V_TEST.innerHTML; return 'fcgain='+/x-fcgain/.test(h)+' fcBig='+/x-fcBig/.test(h)+' pouso='+/x-landring/.test(h)+' aviso='+XG.toast; })()");
T('arrastar: espaço certo',"(function(){ flushT(); XG.tw=null; const it=S.inv.find(x=>S.eq[x.slot]===x.id&&x.slot==='weapon')||S.inv.find(x=>S.eq[x.slot]===x.id); delete S.eq[it.slot]; statsChanged(); render(); const c=cellOf(it.id); const b=boxes[it.slot].getBoundingClientRect(); gDragDown({isPrimary:true,pointerType:'touch',button:0,pointerId:7,clientX:40,clientY:580,target:c}); gDragMove({pointerId:7,clientX:44,clientY:578,cancelable:true,preventDefault(){}}); const early=!!XG.drag; gDragMove({pointerId:7,clientX:b.left+29,clientY:b.top+29+32,cancelable:true,preventDefault(){}}); const drag=XG.drag, marks=[...boxes[it.slot].classList.list].join(','); gDragEnd({pointerId:7,clientX:b.left+29,clientY:b.top+29+32},false); flushT(); return 'antes de 10px arrasta='+early+'; arrastando='+drag+'; marcas='+marks+'; equipou='+(S.eq[it.slot]===it.id)+'; drag depois='+XG.drag+'; noClick ativo='+(Date.now()<XG.noClick); })()");
T('arrastar: espaço errado volta',"(function(){ flushT(); XG.tw=null; XG.noClick=0; const it=S.inv.find(x=>S.eq[x.slot]!==x.id&&x.slot!=='wing'); if(!it) return 'sem item solto'; const other=SLOTS7.find(s=>s!==it.slot&&s!=='wing'), b=boxes[other].getBoundingClientRect(), before=JSON.stringify(S.eq); const c=cellOf(it.id); gDragDown({isPrimary:true,pointerType:'mouse',button:0,pointerId:1,clientX:40,clientY:580,target:c}); gDragMove({pointerId:1,clientX:b.left+29,clientY:b.top+29,cancelable:true,preventDefault(){}}); gDragEnd({pointerId:1,clientX:b.left+29,clientY:b.top+29},false); flushT(); return 'eq igual='+(before===JSON.stringify(S.eq))+'; aviso='+XG.toast+'; drag='+XG.drag; })()");
T('arrastar: soltar fora volta',"(function(){ flushT(); XG.noClick=0; const it=S.inv.find(x=>S.eq[x.slot]!==x.id&&x.slot!=='wing'); if(!it) return 'sem item solto'; const before=JSON.stringify(S.eq), c=cellOf(it.id); gDragDown({isPrimary:true,pointerType:'touch',button:0,pointerId:3,clientX:40,clientY:580,target:c}); gDragMove({pointerId:3,clientX:200,clientY:450,cancelable:true,preventDefault(){}}); gDragEnd({pointerId:3,clientX:200,clientY:450},true); flushT(); return 'eq igual='+(before===JSON.stringify(S.eq))+'; drag='+XG.drag; })()");
T('toque simples não vira arrasto',"(function(){ XG.noClick=0; const it=S.inv[0], c=cellOf(it.id); gDragDown({isPrimary:true,pointerType:'touch',button:0,pointerId:5,clientX:40,clientY:580,target:c}); gDragMove({pointerId:5,clientX:43,clientY:582,cancelable:true,preventDefault(){}}); gDragEnd({pointerId:5,clientX:43,clientY:582},false); gClick({dataset:{x:'cell',id:String(it.id)}}); const open=XG.sel===it.id; XG.sel=null; return 'abriu a comparação='+open+'; drag='+XG.drag; })()");
T('botão direito / 2º dedo ignorados',"(function(){ const c=cellOf(S.inv[0].id); gDragDown({isPrimary:true,pointerType:'mouse',button:2,pointerId:9,clientX:1,clientY:1,target:c}); const a=!!GFX.p; gDragDown({isPrimary:false,pointerType:'touch',button:0,pointerId:10,clientX:1,clientY:1,target:c}); return 'p='+a+','+!!GFX.p; })()");

