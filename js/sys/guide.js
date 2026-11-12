/* Eonbound — Sys.guide: RASTREADOR DE MISSÃO GUIA (pedido do dono via PO). Uma FILA de missões de tutorial, uma por vez e em ordem, separada das
   diárias/semanais do passe. Aparece na batalha sob a barra de fase: texto, barra de progresso, recompensa; o toque leva à tela certa.
   Conduz o jogador novo pelos primeiros dias da curva de 9 eras (docs/CURVA_9_ERAS.md: era 0 no dia 1, era 1 até o dia 4, era 2 até o dia 11).
   Missões cujo destino ainda não tem tela (instâncias, torre, pets, forja) ficam FORA da fila até a tela entrar (DATA.screens).
   Atrás de chave DESLIGADA (DATA.on=false). Entrega por Sys.loot.grantBundle. Estado em S.sys.guide. Relatório: reports/sys-guide.md */
(function(root){
'use strict';
const DATA={
  on:false,
  // telas que existem hoje no jogo (o engenheiro liga cada uma quando a tela entrar). false = as missões que levam a ela ficam fora da fila.
  screens:{battle:true, equipment:true, summon:true, shop:true, pass:true, practice:true, forge:false, instances:false, tower:false, pets:false},
  // ev: evento contado. Tipos "set" (level, era, stage, forgeLvl) usam o maior valor visto; os outros SOMAM desde o início da missão.
  // reward: pacote do Sys.loot.grantBundle (goldk = × ouro de um abate). goto: tela de destino.
  steps:[
    {id:'g_kill10',  ev:'kill',     need:10, goto:'battle',    reward:{goldk:20},           text:'Derrote 10 inimigos'},
    {id:'g_boss1',   ev:'boss',     need:1,  goto:'battle',    reward:{gems:5},            text:'Derrote o primeiro chefe'},
    {id:'g_equip',   ev:'equip',    need:1,  goto:'equipment', reward:{goldk:30},           text:'Equipe um item novo'},
    {id:'g_up3',     ev:'upgrade',  need:3,  goto:'equipment', reward:{goldk:50},           text:'Melhore um item 3 vezes'},
    {id:'g_summon',  ev:'summon',   need:1,  goto:'summon',    reward:{gems:5},            text:'Faça a invocação grátis'},
    {id:'g_chest',   ev:'chest',    need:1,  goto:'battle',    reward:{forge:5},            text:'Abra um baú de batalha'},
    {id:'g_lv5',     ev:'level',    need:5,  goto:'battle',    reward:{gems:10},            text:'Chegue ao nível 5'},
    {id:'g_era1',    ev:'era',      need:1,  goto:'battle',    reward:{gems:15, essence:1}, text:'Vença o Senhor da Era e entre na Antiguidade'},
    {id:'g_pass',    ev:'mission',  need:1,  goto:'pass',      reward:{gems:5},            text:'Resgate uma missão diária'},
    {id:'g_shop',    ev:'buy',      need:1,  goto:'shop',      reward:{goldk:40},           text:'Compre um item na loja'},
    {id:'g_practice',ev:'practice', need:1,  goto:'practice',  reward:{goldk:40},           text:'Treine uma prática'},
    {id:'g_lv12',    ev:'level',    need:12, goto:'battle',    reward:{gems:15},            text:'Chegue ao nível 12'},
    {id:'g_forge1',  ev:'forgeLvl', need:1,  goto:'forge',     reward:{forge:10},           text:'Fortaleça a arma até +1'},
    {id:'g_summon10',ev:'summon',   need:10, goto:'summon',    reward:{gems:15},            text:'Faça 10 invocações'},
    {id:'g_inst',    ev:'instance', need:1,  goto:'instances', reward:{gems:10},            text:'Vença uma instância'},
    {id:'g_egg',     ev:'egg',      need:1,  goto:'pets',      reward:{food:20},            text:'Choque um ovo de pet'},
    {id:'g_era2',    ev:'era',      need:2,  goto:'battle',    reward:{gems:20, essence:2}, text:'Entre na Era Medieval'},
    {id:'g_tower',   ev:'tower',    need:1,  goto:'tower',     reward:{forge:10},           text:'Suba o 1º andar da torre'},
    {id:'g_lv25',    ev:'level',    need:25, goto:'battle',    reward:{gems:20},            text:'Chegue ao nível 25'},
    {id:'g_up20',    ev:'upgrade',  need:20, goto:'equipment', reward:{goldk:80},           text:'Melhore itens 20 vezes'},
    {id:'g_era3',    ev:'era',      need:3,  goto:'battle',    reward:{gems:30, essence:3}, text:'Entre na Era da Pólvora'},
  ],
};
const SET=['level','era','stage','forgeLvl'];   // valor absoluto (maior visto); os outros somam
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const Loot=()=>root.Sys&&root.Sys.loot;
const avail=s=>DATA.screens[s.goto]!==false;

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.guide.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.guide; if(!o||typeof o!=='object') o=S.sys.guide={};
  o.v=1; if(!Array.isArray(o.done)) o.done=[]; o.done=o.done.filter(id=>DATA.steps.some(s=>s.id===id));
  if(typeof o.cur!=='string') o.cur=''; o.p=int0(o.p);
  if(!o.seen||typeof o.seen!=='object') o.seen={}; for(const k of SET) o.seen[k]=int0(o.seen[k]);
  return o;
}
/* missão da vez: a 1ª da fila que não foi resgatada e cuja tela existe (missão sem tela fica de fora, sem travar a fila) */
function step(S){ const o=ensure(S); return DATA.steps.find(s=>!o.done.includes(s.id)&&avail(s))||null; }
function sync(S){ const o=ensure(S), s=step(S); if(s&&o.cur!==s.id){ o.cur=s.id; o.p=0; } return s; }
function progressOf(o,s){ return SET.includes(s.ev)?Math.min(s.need,o.seen[s.ev]):Math.min(s.need,o.p); }
/* para a tela: {id, text, cur, max, reward, goto, done} ou null (fila terminada ou chave desligada) */
function current(S){
  if(!DATA.on) return null; const s=sync(S); if(!s) return null; const o=ensure(S), c=progressOf(o,s);
  return {id:s.id,text:s.text,cur:c,max:s.need,reward:s.reward,goto:s.goto,done:c>=s.need};
}
/* evento do jogo. Somáveis: kill, boss, upgrade, summon, chest, equip, mission, buy, practice, instance, egg, tower (n = quantos).
   Absolutos: level, era, stage, forgeLvl (n = valor atual). Só conta para a missão da vez. */
function onEvent(S,type,n){
  if(!DATA.on) return; const o=ensure(S), v=num(n,1);
  if(SET.includes(type)){ o.seen[type]=Math.max(o.seen[type],int0(v)); return; }
  const s=sync(S); if(s&&s.ev===type) o.p+=Math.max(0,Math.floor(v));
}
/* resgata a missão da vez (se cumprida), entrega o prêmio e avança. → {ok, got, next} ou {ok:false, reason} */
function claim(S,host){
  if(!DATA.on) return {ok:false,reason:'desligado'};
  const c=current(S); if(!c) return {ok:false,reason:'fim'}; if(!c.done) return {ok:false,reason:'incompleta'};
  const o=ensure(S); o.done.push(c.id); o.cur=''; o.p=0;
  const L=Loot(), got=L&&L.grantBundle?L.grantBundle(S,host,c.reward):null;
  return {ok:true,got,next:current(S)};
}
/* fila inteira para a tela de aprovação: [{id, text, goto, need, available, done}] */
function list(S){ const o=ensure(S); return DATA.steps.map(s=>({id:s.id,text:s.text,goto:s.goto,need:s.need,available:avail(s),done:o.done.includes(s.id)})); }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,current,onEvent,claim,list,bonus};
root.Sys=root.Sys||{}; root.Sys.guide=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
