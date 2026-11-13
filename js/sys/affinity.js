/* Eonbound — Sys.affinity: AFINIDADE DAS ERAS com o aviso "Fraco contra" (docs/IDLE_PARECIDOS.md §3 item 14, P3, dono aprovou 13/11).
   Os inimigos de cada era são FRACOS contra um estilo de luta (o herói dá +15%) e RESISTEM a outro (o herói dá −10%); o terceiro é neutro.
   Estilos: Lâmina (armas de corpo a corpo), Disparo (pólvora, revólver, fuzil, arco, bumerangue), Arcano (só pelo caminho de luta do Nv 30).
   Estilo do herói: o caminho escolhido (Sys.path / S.sys.path.id), senão o da arma equipada (Sys.stats.weaponStyle: melee → Lâmina; gun/ranged/return → Disparo).
   Regra de justiça: uma era NUNCA resiste ao estilo da arma da própria era (quem joga só com o que caiu ali nunca é punido).
   Cada estilo é forte em 3 eras. Tabela e números = PROPOSTA (o QA calibra). DESLIGADO (DATA.on=false): mult = 1 e o aviso some. */
(function(root){
'use strict';

const DATA={
  on:false,
  weak:0.15,        // inimigo fraco contra o estilo do herói: dano do herói ×1,15
  resist:-0.10,     // inimigo resiste ao estilo do herói: dano do herói ×0,90
  perEra:10,        // fases por era (STAGES_PER_ERA do jogo)
  styles:{blade:'Lâmina', shot:'Disparo', arcane:'Arcano'},
  // estilo da arma da própria era (FAM_BY_ERA do Sys.stats: club, gladius, sword, flintlock, revolver, rifle, plasma, infernal, celestial)
  eraStyle:['blade','blade','blade','shot','shot','shot','blade','blade','blade'],
  eras:[
    {n:'Pré-História',    weak:'blade',  resist:null},
    {n:'Antiguidade',     weak:'arcane', resist:'shot'},
    {n:'Medieval',        weak:'shot',   resist:'arcane'},
    {n:'Era da Pólvora',  weak:'arcane', resist:'blade'},
    {n:'Industrial',      weak:'blade',  resist:'arcane'},
    {n:'Moderna',         weak:'arcane', resist:'blade'},
    {n:'Futurista',       weak:'shot',   resist:null},
    {n:'Submundo',        weak:'shot',   resist:'arcane'},
    {n:'Celestial',       weak:'blade',  resist:'shot'},
  ],
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const pct=v=>(v>0?'+':'−')+Math.round(Math.abs(v)*100)+'%';
/* era da fase: número da fase (1..) ou {era} */
function eraOf(stage,opt){ if(stage&&typeof stage==='object'&&Number.isInteger(stage.era)) return clamp(stage.era,0,DATA.eras.length-1);
  const P=int0(opt&&opt.perEra)||DATA.perEra; return clamp(Math.floor((Math.max(1,int0(stage)||1)-1)/P),0,DATA.eras.length-1); }
/* estilo do herói: opt.style (predefinição) > caminho escolhido > arma equipada > estilo da era */
function heroStyle(S,host,opt){ if(opt&&DATA.styles[opt.style]) return opt.style;
  const P=root.Sys&&root.Sys.path; let p=null; try{ p=P&&typeof P.chosen==='function'?P.chosen(S):null; }catch(e){ p=null; }
  if(!p&&S&&S.sys&&S.sys.path&&typeof S.sys.path.id==='string') p=S.sys.path.id; if(DATA.styles[p]) return p;
  const T=root.Sys&&root.Sys.stats; let w=null; try{ const eq=host&&typeof host.equipped==='function'?host.equipped():null; w=eq&&eq.weapon; }catch(e){ w=null; }
  if(w&&T&&typeof T.weaponStyle==='function'){ const s=T.weaponStyle(w); return s==='melee'?'blade':'shot'; }
  return null; }
/* multiplicador de dano do herói contra os inimigos da fase (1 com a chave desligada) */
function mult(S,host,stage,opt){ if(DATA.on!==true) return 1; const e=DATA.eras[eraOf(stage,opt)], s=heroStyle(S,host,opt);
  return s&&s===e.weak?1+DATA.weak:s&&s===e.resist?1+DATA.resist:1; }
/* aviso da tela da fase: {on, era, eraName, weakAgainst, weakId, resists, resistId, mine, mineId, mult, tone:'good'|'bad'|'neutral', text, tip} */
function warn(S,host,stage,opt){ const ei=eraOf(stage,opt), e=DATA.eras[ei], s=heroStyle(S,host,opt), N=DATA.styles;
  if(DATA.on!==true) return {on:false,era:ei,eraName:e.n,weakAgainst:null,weakId:null,resists:null,resistId:null,mine:null,mineId:null,mult:1,tone:'neutral',text:'',tip:''};
  const m=mult(S,host,stage,opt), tone=m>1?'good':m<1?'bad':'neutral';
  const tip=tone==='good'?`Seu estilo (${N[s]}) acerta ${pct(DATA.weak)} aqui`:tone==='bad'?`Os inimigos resistem a ${N[s]}: ${pct(DATA.resist)} no seu dano`:'';
  return {on:true,era:ei,eraName:e.n,weakAgainst:N[e.weak],weakId:e.weak,resists:e.resist?N[e.resist]:null,resistId:e.resist,
    mine:s?N[s]:null,mineId:s,mult:m,tone,text:`Fraco contra: ${N[e.weak]}`,tip}; }
/* tabela legível (tela de ajuda / Códex) */
const table=()=>DATA.eras.map((e,i)=>({era:i,name:e.n,weak:DATA.styles[e.weak],resist:e.resist?DATA.styles[e.resist]:null,own:DATA.styles[DATA.eraStyle[i]]}));

function setOn(v){ DATA.on=!!v; return DATA.on; }
const API={DATA,setOn,eraOf,heroStyle,mult,warn,table};
root.Sys=root.Sys||{}; root.Sys.affinity=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
