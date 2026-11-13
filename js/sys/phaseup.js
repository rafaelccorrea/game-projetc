/* Eonbound — Sys.phaseUp: FASES DO HERÓI (Kael ou Kaia, S.hero) — garoto/menina → adolescente (Nv 22) → adulto(a) (Nv 35) → guerreiro(a) lendário(a) (Nv 70).
   Pedido do PO para o engenheiro: GATILHO (quando a fase nova fica pronta) + o que tocar na EVOLUÇÃO. Só visual: atributos e FC não mudam.
   Fluxo: no subir de nível (onLevelUp do jogo) → pending(S, host); se ready, tocar a animação de pending().anim (sobre o herói) e chamar evolve(S, host);
   depois a pasta das folhas sai de Sys.appearance.sheets(S, host) (que lê current() daqui). Uma fase por vez (quem pula níveis evolui em sequência).
   Trava de FC OPCIONAL (DATA.useFc; calibrada na curva de 9 eras: 15 mil / 400 mil / 600 mi), desligada: o PO pediu só os níveis.
   CHAVE DESLIGADA (DATA.on=false): desligada, current() = 0 e nada dispara. Estado: S.sys.phaseup {stg}. Sem DOM. */
(function(root){
'use strict';
const DATA={
  on:false, useFc:false,
  levels:[1,22,35,70], fc:[0,15000,400000,6e8],
  names:{kael:['Garoto','Adolescente','Adulto','Guerreiro lendário'], kaia:['Menina','Adolescente','Adulta','Guerreira lendária']},
  // animação de evolução por passo (de → para). Só existe a 0→1 (assets/anim/fx/evolve_0_1, 38 quadros, pés em (224, 352)); as outras usam a do
  // subir de nível até a arte chegar (fallback:true). Formato do .json: {frames, fps, w, h, feetY, anchorX}; tocar UMA vez, pés do herói no anchor.
  anim:{'0_1':'assets/anim/fx/evolve_0_1'}, fallbackAnim:'assets/anim/fx/levelup',
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const heroOf=S=>S&&S.hero==='kaia'?'kaia':'kael';
const lvlOf=(S,host)=>{ const L=SYS().level; if(L&&L.level) return L.level(S); return int0(host&&host.level&&host.level())||1; };
const fcOf=(S,host)=>{ const F=SYS().fc; try{ return F&&F.compute?F.compute(S,host):0; }catch(e){ return 0; } };
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.phaseUp.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.phaseup; if(!o||typeof o!=='object') o=S.sys.phaseup={};
  o.v=1; o.stg=clamp(int0(o.stg),0,DATA.levels.length-1); return o; }
const current=S=>ON()?ensure(S).stg:0;
const nameOf=(S,i)=>DATA.names[heroOf(S)][clamp(int0(i),0,3)];
/* próxima fase: {to, name, needLevel, needFc, ready, missing:{level, fc}} ou null (já é a última) */
function next(S,host){ if(!ON()) return null; const o=ensure(S), to=o.stg+1; if(to>=DATA.levels.length) return null;
  const lv=lvlOf(S,host), nl=DATA.levels[to], nf=DATA.useFc?DATA.fc[to]:0, fc=nf?fcOf(S,host):0;
  return {to,name:nameOf(S,to),needLevel:nl,needFc:nf,ready:lv>=nl&&fc>=nf,missing:{level:Math.max(0,nl-lv),fc:Math.max(0,nf-fc)}}; }
/* evolução pendente para tocar: {ready, from, to, fromName, toName, hero, anim:{sheet, fallback}} */
function pending(S,host){ const n=next(S,host); if(!n||!n.ready) return {ready:false,next:n};
  const from=n.to-1, key=from+'_'+n.to, sheet=DATA.anim[key]||DATA.fallbackAnim;
  return {ready:true,from,to:n.to,fromName:nameOf(S,from),toName:n.name,hero:heroOf(S),anim:{sheet,fallback:!DATA.anim[key]}}; }
/* aplica UMA fase (depois da animação). {ok, reason: off|max|level|fc, from, to, name} */
function evolve(S,host){ if(!ON()) return {ok:false,reason:'off'}; const n=next(S,host); if(!n) return {ok:false,reason:'max'};
  if(!n.ready) return {ok:false,reason:n.missing.level?'level':'fc',need:n.missing};
  const o=ensure(S), from=o.stg; o.stg=n.to;
  const L=SYS().level; try{ if(L&&L.ensure) L.ensure(S).stg=n.to; }catch(e){}   // mantém o Sys.level em dia (mesma fase nos dois)
  return {ok:true,from,to:n.to,name:n.name}; }
/* save antigo que já passou dos níveis: as fases ficam PENDENTES (cada uma toca a animação uma vez), nada é aplicado sozinho */
const pendingCount=(S,host)=>{ if(!ON()) return 0; const o=ensure(S), lv=lvlOf(S,host); let k=0; for(let i=o.stg+1;i<DATA.levels.length;i++) if(lv>=DATA.levels[i]&&(!DATA.useFc||fcOf(S,host)>=DATA.fc[i])) k++; return k; };

const API={DATA,ensure,current,nameOf,next,pending,evolve,pendingCount};
root.Sys=root.Sys||{}; root.Sys.phaseUp=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
