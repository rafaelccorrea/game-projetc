/* Eonbound — Sys.eras: CONTEÚDO DAS ERAS 7 (Submundo) e 8 (Celestial) para a curva de 9 eras. O jogo (index.html) só define as 7 primeiras em ERAS;
   aqui estão as duas que faltam NO MESMO FORMATO de cada entrada de ERAS ({n, icon, sky, mtn, gr, gr2, sun, w, a, ws, as, wp, ap, en}), para o engenheiro
   anexar quando ligar a curva: `if(Sys.eras) ERAS.push(...Sys.eras.extra())` (só com Sys.stats.setEra9 ligado; antes, nada muda).
   Inimigos: os nomes seguem a ARTE aprovada em assets/enemies (era7_e0 diabrete, era7_e1 cão infernal de ossos, era7_boss demônio com foice;
   era8_e0 guardião alado, era8_e1 golem rúnico, era8_boss arcanjo). en[0] = e0, en[1] = e1, último = chefe (mesma regra do mkEnemy).
   Números (vida, dano, DEF, FC recomendada, ouro) vêm do Sys.phases; nomes do Senhor da Era por era em senhor[]. Sem emoji (icon vazio: a tela usa arte).
   Só dados: sem estado, sem chave própria (vale o setEra9 do Sys.stats). */
(function(root){
'use strict';
const ERAS78=[
 {n:'Submundo', icon:'', key:'underworld',
  sky:['#2a0a0a','#8a1a0a'], mtn:'#3a0f0a', gr:'#2a1410', gr2:'#4a1a12', sun:'#ff6a2a',
  w:['Tridente de Brasa','Foice Sombria','Lâmina Infernal','Garra do Abismo','Ceifadora do Submundo'],
  a:['Couro Chamuscado','Placas de Obsidiana','Armadura de Cinzas','Couraça do Abismo','Manto do Senhor das Chamas'],
  ws:['Brasa Opaca','Ferro Negro','Obsidiana','Lava Viva','Chama Eterna'],
  as:['Cinza','Obsidiana','Rubro Vulcânico','Sombra Ardente','Fogo Real'],
  wp:['#8a3a2a','#3a2a2a','#1a1a24','#ff5a1a','#ffcf4a'], ap:['#5a2a1a','#2a2028','#7a1a12','#3a0a2a','#ff7a2a'],
  en:[{n:'Diabrete',s:'h',c:'#c8322a',art:'era7_e0'},{n:'Cão Infernal',s:'beast',c:'#3a2a24',art:'era7_e1'},{n:'Demônio Ceifador',s:'h',c:'#a8221a',art:'era7_boss'}]},
 {n:'Celestial', icon:'', key:'celestial',
  sky:['#bfe3ff','#fff4d0'], mtn:'#d8e4f0', gr:'#e8eef6', gr2:'#cfd9e6', sun:'#fffbe0',
  w:['Lança de Luz','Espada Alada','Lâmina Celeste','Gládio do Firmamento','Juízo do Arcanjo'],
  a:['Túnica de Nuvem','Peitoral de Prata','Armadura Seráfica','Couraça Celeste','Manto do Arcanjo'],
  ws:['Prata Clara','Aço Celeste','Ouro Branco','Luz Viva','Aurora Eterna'],
  as:['Nuvem','Prata','Ouro Branco','Céu Profundo','Aurora'],
  wp:['#c9d6e3','#e6eef7','#ffe7a3','#ffffff','#ffd84a'], ap:['#e8eef6','#c0ccd8','#ffe9b8','#8cc8ff','#fff3c4'],
  en:[{n:'Guardião Alado',s:'h',c:'#e8eef6',art:'era8_e0'},{n:'Golem Rúnico',s:'beast',c:'#c9d2dc',art:'era8_e1'},{n:'Arcanjo',s:'h',c:'#ffd84a',art:'era8_boss'}]},
];
/* nome do Senhor da Era (fase 100 de cada dificuldade) para as 9 eras: as 7 primeiras usam o chefe da era como hoje; 7-8 têm nome próprio */
const SENHOR={7:'Senhor do Submundo', 8:'Juiz Celestial'};
const LOAD_NAMES=['Submundo','Celestial'];   // para a lista do carregamento (js/loading.js LOAD_ERAS)
const on=()=>{ const T=root.Sys&&root.Sys.stats; return !!(T&&T.DATA&&T.DATA.era9&&T.DATA.era9.on===true); };
/* entradas para anexar ao ERAS do jogo (cópia: o jogo pode mexer à vontade). Vazio enquanto a curva de 9 eras estiver desligada. */
const extra=()=>on()?JSON.parse(JSON.stringify(ERAS78)):[];
const all78=()=>JSON.parse(JSON.stringify(ERAS78));
const senhorName=e=>SENHOR[e]||null;
/* resumo de uma fase para a tela/mapa: nome da era, inimigos com arte e os números do Sys.phases (vida, dano, DEF com o formato abreviado) */
function stageCard(e,d,n){ const P=root.Sys&&root.Sys.phases, T=root.Sys&&root.Sys.stats, E=ERAS78[e-7]; if(!E||!P) return null;
  const ab=v=>T&&T.abbr?T.abbr(v):String(v), c=P.enemy(e,d,n,'common'), b=P.enemy(e,d,n,'boss');
  return {era:e,eraName:E.n,stage:n,diff:d,fcRec:c.fcRec,fcText:ab(c.fcRec),common:{name:E.en[n%2].n,art:E.en[n%2].art,hp:ab(c.hp),dmg:ab(c.dmg),def:ab(c.def)},
    boss:{name:b.kind==='senhor'?SENHOR[e]:E.en[2].n,art:E.en[2].art,kind:b.kind,hp:ab(b.hp),dmg:ab(b.dmg),def:ab(b.def)}}; }

const API={ERAS78,SENHOR,LOAD_NAMES,extra,all78,senhorName,stageCard};
root.Sys=root.Sys||{}; root.Sys.eras=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
