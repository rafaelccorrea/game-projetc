// host falso para os testes dos módulos js/sys (rng com semente, relógio controlável)
'use strict';
function seeded(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function makeHost(o){
  o=o||{}; const h={gold:0,gems:0,items:[],toasts:[],changes:0,t:o.now!=null?o.now:new Date(2026,10,12,10,0,0).getTime(),
    _stage:o.stage||1,_eraMax:o.eraMax||0,_unit:o.unit||4,rng:seeded(o.seed||1)};
  Object.assign(h,{
    atk:()=>100, hp:()=>1000, stage:()=>h._stage, eraMax:()=>h._eraMax,
    goldUnit:(stage)=>h._unit*(stage?Math.pow(1.15,stage-h._stage):1),
    addGold:n=>{ h.gold+=n; }, addGems:n=>{ h.gems+=n; }, addItem:it=>{ h.items.push(it); },
    now:()=>h.t, toast:m=>{ h.toasts.push(m); }, onChange:()=>{ h.changes++; },
  });
  if(o.level!=null){ h._level=o.level; h.level=()=>h._level; }   // nível do jogador (portões de raridade); sem ele, o portão de nível fica desligado
  return h;
}
module.exports={makeHost,seeded};
