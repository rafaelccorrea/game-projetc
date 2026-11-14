'use strict';
/* ================= INVESTIDA MONTADA (docs/LOM_VS_EONBOUND.md, item B6; item 11 da lista de prioridade) — arquivo novo, escopo próprio =================
   ATRÁS DE CHAVE DESLIGADA: SYS_LIVE.mountCharge (js/farm.js) nasce false. Desligada: os dois ganchos não fazem nada (o passo sai na primeira linha e o
   avanço devolve 0). Para conferir: ?debug=1&com=mountCharge (com o ícone de recarga: ?debug=1&com=mountCharge,skillIcons).
   REGRA DO DONO MANTIDA: a montaria NÃO ataca. A investida é um golpe DO HERÓI: a cada MC.every segundos de luta, com o herói MONTADO na tela, ele avança
   montado e acerta TODOS os inimigos visíveis. O dano entra pelo caminho de dano do herói (hitMany → hitEnemy do js/battle.js: mesma conta do Sys.stats.hit,
   crítico, "Fraco contra", golpes especiais e recordes). Não dá energia de ultimate (não é básico nem especial) e não mexe na FC.
   SEM ARTE NOVA: o desenho é o Kael montado que já está na tela (o avanço é só um deslocamento do desenho) mais a onda de choque e a poeira do Golpe Sísmico.
   QUANDO NÃO ACONTECE: sem montaria na tela (nenhuma equipada, módulo desligado, herói sem folha montada = a pé), em instância (Torre, Ladrão, Provação, ensaio:
   lutas com conta própria, ficam como hoje), herói caído, tela de resultado aberta, herói correndo sem alvo ou no meio da ultimate (aí ela espera pronta).
   O relógio é tempo de LUTA (anda com x2/x4, como a recarga do especial) e só conta com o herói montado; ao desmontar, volta ao começo.
   NÚMEROS PROVISÓRIOS, PRECISAM DA SISTEMAS (não há valor em docs/balance.json nem em docs/EQUILIBRIO*.md): MC.every e MC.mult, só aqui.
   GANCHOS (uma linha cada, js/battle.js): step → mcStep(dt) · draw → HM.x soma mcLunge().
   API (window.MountCharge): on() · setOn(v) · step(dt) · lunge() · info() → {show, cd, left, running} (o MESMO objeto a cada chamada: só leitura) · MC · state.
   Teste: node test/paineis/mountcharge.smoke.js */
(function(){
const KEY='mountCharge';
/* every = segundos de luta entre investidas ("~12 s" do documento) · mult = multiplicador do ATQ em CADA inimigo atingido (1 = o mesmo de um golpe básico;
   conservador de propósito: PROVISÓRIO até a Sistemas dar o número) · dur / hitAt = duração do avanço e instante do acerto (s) · reach = avanço máximo do
   desenho (px na base de 390) · col = cor da onda e do rótulo. */
const MC={every:12,mult:1,dur:0.6,hitAt:0.3,reach:40,col:'#ffd27a',label:'INVESTIDA'};
const ST={left:MC.every,run:-1,hit:false,still:false,n:0};
const ACT={type:'mc',col:MC.col,fx:null,stk:''}, HIT={m:MC.mult,fin:false}, LIST=[], INFO={show:false,cd:MC.every,left:MC.every,running:false};
let ON=null;
function on(){ if(ON!==null) return ON; let v=false, known=false;
  try{ if(typeof SYS_LIVE!=='undefined'&&SYS_LIVE){ known=true; v=SYS_LIVE[KEY]===true; } }catch(e){}
  try{ if(typeof DEBUG!=='undefined'&&DEBUG&&typeof location!=='undefined'){ const q=String(location.search||''), c=/[?&]com=([\w,]+)/.exec(q), s=/[?&]sem=([\w,]+)/.exec(q);
      if(known&&SYS_LIVE[KEY]===false&&c&&c[1].split(',').indexOf(KEY)>=0) v=true;   /* só liga por "com" o que está na tabela com false (regra do sysLive) */
      if(s&&s[1].split(',').indexOf(KEY)>=0) v=false; } }catch(e){}
  if(known) ON=v; return v; }
function setOn(v){ ON=v==null?null:!!v; return ON; }   /* teste e console; null = ler a chave de novo */
/* o herói está MONTADO na tela e a luta é a das fases (HM.mount = a montaria que o js/battle.js está desenhando) */
function mounted(){ try{ return typeof HM!=='undefined'&&!!(HM&&HM.mount)&&typeof B!=='undefined'&&!!B&&!B.inst; }catch(e){ return false; } }
function reduced(){ try{ return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches===true; }catch(e){ return false; } }
function reset(){ ST.left=MC.every; ST.run=-1; ST.hit=false; }
/* o acerto: todos os inimigos vivos e visíveis, pelo caminho de dano do herói */
function strike(){ const L=B.en, hx=HX+lunge(); LIST.length=0; for(let i=0;i<L.length;i++){ const e=L[i]; if(e&&!e.dead&&e.x<=LW+20) LIST.push(e); }
  try{ if(typeof wfx==='function'&&typeof fnShock==='function'){ wfx(fnShock,0.45,{x:hx+46,r:120,col:MC.col,layer:0}); wfx(fnShock,0.55,{x:hx+46,r:84,col:'#ffffff',layer:0,delay:0.07}); }
    if(typeof dust==='function') dust(hx+40,GY,10);
    if(typeof floatText==='function') floatText(hx+24,GY-HS*0.95,MC.label,MC.col,0); }catch(e){}
  HIT.m=MC.mult; if(LIST.length) hitMany(LIST,MC.mult,ACT,HIT); LIST.length=0; ST.n++; }
/* chamar no step(dt) do js/battle.js, depois do golpe do herói (ali o herói está vivo e a tela de resultado está fechada) */
function step(dt){ if(!on()) return; dt=+dt||0;
  if(!mounted()){ if(ST.run>=0||ST.left!==MC.every) reset(); return; }
  if(ST.run>=0){ ST.run+=dt; if(!ST.hit&&ST.run>=MC.hitAt){ ST.hit=true; try{ strike(); }catch(e){ try{ console.error('MountCharge',e); }catch(e2){} } } if(ST.run>=MC.dur) ST.run=-1; return; }
  if(ST.left>0){ ST.left-=dt; if(ST.left>0) return; ST.left=0; }
  if(B.deadT>0||B.res||B.running||!B.enemy||(B.act&&B.act.type==='s3')) return;   /* pronta: espera um alvo ao alcance e a ultimate acabar */
  ST.run=0; ST.hit=false; ST.left=MC.every; ST.still=reduced(); }
/* quanto o desenho do herói avança agora (px lógicos do canvas). Sem investida em curso, caído ou com "reduzir movimento": 0 */
function lunge(){ if(!(ST.run>=0)||ST.still) return 0; try{ if(typeof B!=='undefined'&&B&&(B.deadT>0||B.res)) return 0; }catch(e){ return 0; }
  const u=Math.min(1,ST.run/MC.dur), hu=MC.hitAt/MC.dur; let k; if(u<hu){ const q=1-u/hu; k=1-q*q*q; } else { const s=(u-hu)/(1-hu); k=1-s*s*(3-2*s); }
  return MC.reach*(typeof PX==='number'?PX:1)*k; }
/* para o ícone de recarga (js/skillicons.js): devolve SEMPRE o mesmo objeto */
function info(){ const sh=on()&&mounted(); INFO.show=sh; INFO.cd=MC.every; INFO.left=sh?Math.max(0,ST.left):MC.every; INFO.running=sh&&ST.run>=0; return INFO; }

const W=typeof window!=='undefined'?window:globalThis;
W.mcStep=step; W.mcLunge=lunge;
W.MountCharge={KEY:KEY,on:on,setOn:setOn,step:step,lunge:lunge,info:info,reset:reset,MC:MC,state:ST};
})();
