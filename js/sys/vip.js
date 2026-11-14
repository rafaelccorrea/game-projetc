/* Eonbound — Sys.vip: VIP só por COMPRA (regra do dono). Por ora só uma flag/nível no save; o botão "Comprar VIP" só abre a tela, sem cobrar.
   NÍVEIS DE VIP 1 a 10 (regra nova do dono): sobem por PONTOS VIP acumulados nas compras (addPoints). Os benefícios por nível vêm da
   PROPOSTA da tela 18 do protótipo (DATA.table; "o dono escolhe os números"): só crescem com o nível. Os pontos de cada nível (DATA.points)
   ainda são ESPAÇO RESERVADO ("[VALOR]" na tela): o dono define.
   VELOCIDADE DA BATALHA (regra nova do dono): x1 no começo; x2 ao comprar QUALQUER VIP ou, sem VIP, no nível 15 do jogador;
   x4 só com VIP 5+ E nível 40+. Não existe x3. maxSpeed(S, host) devolve o máximo e o motivo de cada bloqueio para a tela.
   Quem aplica cada benefício (sem dobro): bonus() → só ATK/HP, na FC. perks() → lidos pelos outros módulos:
   fps-30 (loot/baú/instâncias): xpPct nos orbes, goldPct no ouro, chestCapAdd, instanceKeysAdd · fps-e2: xpPct no XP de instância/missão/offline
   (Sys.level), offlineMult nas pedras e ração offline · engenheiro: botão de velocidade até maxSpeed().max. Ouro offline (js/meta.js): offlineGoldMult (= 1, sem ×2).
   14/11 (dono aprovou D1-D3 de docs/RECOMPENSAS_VIP_PASSE.md): ouro do VIP +5% a +10% (goldOnly), XP igual; o ×2 do offline não vale para o ouro;
   poder pago do VIP no máximo +10% de ATK e Vida (a Fênix gigante do VIP 8 tem poder de Épica: Sys.mount pr). goldXpPct (levelInfo) = só o ouro. */
(function(root){
'use strict';
const DATA={
  label:'VIP', icon:'👑',
  maxLevel:10,
  // PROPOSTA da tela 18 (project/VIP.dc.html do protótipo do PO), índice = nível do VIP (0 = sem VIP). Copiada como está:
  //   spd: 0 = x1 (x2 no nível 15) · 1 = x2 já · 2 = x2 já e x4 no nível 40 | atk: % de ATK e de Vida | gold: % de Ouro e de XP
  //   key: entradas de instância a mais POR ÁREA por dia (Sys.instances lê por área) | chest: baús/dia (0 = padrão) | off: multiplicador do offline | frame/skin/aura: visuais (1 = sim)
  table:{
    spd:  [0, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],
    atk:  [0, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10],
    gold: [0, 10, 12, 14, 16, 18, 20, 21, 22, 24, 25],   // % de XP (fora do v9). O nome ficou 'gold' por compatibilidade: desde 14/11 é SÓ XP
    // OURO do VIP separado do XP (dono aprovou 14/11, D2 de docs/RECOMPENSAS_VIP_PASSE.md; regra do pouco ouro): era o mesmo número do XP (+10% a +25%)
    goldOnly:[0, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10],
    // xp9: % de XP no v9 (curva das 9 eras, Sys.level.DATA.v9.on): calibrada para o PROGRESSO total do dia (com x4, +1 entrada e o teto diário)
    // dar ×1,13 (VIP 1) ... ×1,30 (VIP 5) ... ×1,50 (VIP 10), nunca mais. Cai do 4 para o 5 porque o x4 do VIP 5 já rende XP; a tela mostra o progresso.
    xp9:  [0,1,5,8,12,3,6,9,12,15,19],
    prog9:[1, 1.13, 1.16, 1.20, 1.25, 1.30, 1.34, 1.38, 1.42, 1.46, 1.50],   // progresso por dia vs grátis (simulação; para a tela)
    key:  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],   // dono: instâncias com 2 entradas POR ÁREA por dia, +1 com QUALQUER VIP (era 0,0,0,1,1,1,2,2,2,3,3 na tela 18)
    chest:[0, 0, 0, 10, 10, 10, 10, 12, 12, 12, 14],
    off:  [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2],   // offline ×2: XP, itens, pedras e ração. NÃO vale para o OURO offline (dono 14/11): perks().offlineGoldMult = 1
    frame:[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],   // moldura Ouro: saiu do VIP 7 (dono 14/11); agora é conquista do nível 60 (Sys.profile). Os VIPs têm a moldura VIP N (frameVip)
    frameVip:[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],   // dono 13/11: moldura VIP N ao chegar no VIP N (só visual, sem atributo; Sys.profile frames vip1..vip10)
    skin: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    aura: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  },
  // VIP DE CONVENIÊNCIA (ordem do dono, 13/11; PROPOSTA, chave convOn DESLIGADA). Acelera e poupa toque; NÃO dá atributo, XP a mais nem diamante
  // (o que já existia na tabela acima continua igual). v = nível de VIP que libera; free = o que o jogador grátis tem. Cada módulo lê conv(S).
  convOn:true,   // APROVADO pelo dono (13/11) como na tabela; arena/torre: grátis 3 (dono), o VIP soma
  conv:[
    {id:'autoCollect', name:'Coleta automática (baús do dia, missões feitas e correio sem item)', v:1, free:'toca um a um'},
    {id:'bag',         name:'Espaços extras na mochila', v:1, val:[0,20,20,20,20,20,40,40,40,40,40], free:'60 espaços'},
    {id:'offlineH',    name:'Mais horas guardando ouro, itens, pedras e ração fora do jogo (o XP fica em 8 h)', v:1, val:[8,10,10,10,10,12,12,12,12,12,14], free:'8 h'},
    {id:'autoFuse',    name:'Fusão automática (junta 3 iguais sozinha; nunca o equipado nem item de 5 estrelas)', v:2, free:'fusão manual na Forja'},
    {id:'autoEquip',   name:'Equipar o melhor sozinho (troca quando o item novo tem mais FC)', v:0, free:'todos'},
    {id:'autoSell',    name:'Desmontar sozinho o que sobra, virando ouro (Básico/Raro, o jogador escolhe; nunca o equipado)', v:2, free:'botão "Desmontar todos"'},   // dono 13/11: no lugar do equipar sozinho (que voltou a ser de todos)
    {id:'skipBoss',    name:'Pular chefe já vencido (resultado na hora, mesmo prêmio)', v:3, free:'luta inteira (até x2/x4)'},
    {id:'arenaAdd',    name:'Entradas na Arena a mais por dia', v:4, val:[0,0,0,0,2,2,2,2,3,3,3], free:'3 por dia'},
    {id:'autoForge',   name:'Forjar até conseguir (até o nível escolhido; mesma chance e custo; para no ouro ou nas pedras)', v:0, free:'todos'},
    {id:'bonfireInstant', name:'Fogueira: o automático solta o lote inteiro de uma vez (mesmas peças, chances e Brasas)', v:4, free:'uma peça por vez'},
    {id:'towerAdd',    name:'Tentativas a mais na Torre por dia (só a derrota gasta)', v:5, val:[0,0,0,0,0,1,1,1,1,1,2], free:'3 por dia'},
    {id:'bossAdd',     name:'Ataques a mais no Chefe Mundial por janela', v:6, val:[0,0,0,0,0,0,1,1,1,1,1], free:'2 por janela'},
    {id:'passXp',      name:'XP do Passe a mais (só o Passe; o nível do jogador não muda)', v:7, val:[0,0,0,0,0,0,0,10,10,15,20], unit:'%', free:'0%'},
    {id:'eventTries',  name:'Entrada extra nos eventos com hora (Invasão, Chefe Mundial)', v:8, val:[0,0,0,0,0,0,0,0,1,1,1], free:'as da agenda'},
  ],
  chestBase:8,                     // teto padrão de baús/dia (Sys.chest); chest da tabela vira chestCapAdd = chest − 8
  // pontos VIP ACUMULADOS para chegar a cada nível (índice = nível). ESPAÇO RESERVADO até o dono definir ("[VALOR]" na tela 18).
  points:[0, 1, 300, 800, 1500, 3000, 5000, 8000, 12000, 18000, 25000],
  // velocidade da batalha (regra do dono): cada degrau libera se QUALQUER regra da lista for cumprida (regra = todas as condições dela).
  // spd = o degrau de velocidade do nível de VIP (DATA.table.spd); level = nível do jogador.
  speeds:[
    {speed:1, rules:[{}]},
    {speed:2, rules:[{spd:1},{level:15}], text:'x2: nível 15 ou VIP 1'},
    {speed:4, rules:[{spd:2, level:40}], text:'x4: VIP 5 e nível 40'},
  ],
};
/* benefícios de um nível de VIP montados da tabela (bonus = FC; perks = os outros módulos) */
function levelData(n){ const T=DATA.table, i=Math.max(0,Math.min(DATA.maxLevel,Math.floor(n)||0)), g=k=>Number(T[k][i])||0;
  return {spd:g('spd'), bonus:{atkPct:g('atk'),hpPct:g('atk')},
    perks:{xpPct:g('gold'), goldPct:g('goldOnly'), offlineMult:Math.max(1,g('off')), offlineGoldMult:1, chestCapAdd:g('chest')?Math.max(0,g('chest')-DATA.chestBase):0,
      instanceKeysAdd:g('key'), frame:!!g('frame'), frameVip:g('frameVip'), vipSkin:!!g('skin'), aura:!!g('aura')}}; }
DATA.levels=Array.from({length:DATA.maxLevel+1},(_,i)=>levelData(i));
// COMPATIBILIDADE: a Loja (js/screens.js, aba Gemas, cartão "Comprar VIP") lê DATA.bonus e DATA.perks da versão de VIP único.
// Sem eles a aba quebrava (VD.bonus.atkPct de undefined). Agora apontam para o VIP 1, o que a compra dá primeiro. Prefira levelInfo(n).
DATA.bonus=DATA.levels[1].bonus; DATA.perks=DATA.levels[1].perks;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));

/* nível do VIP: S.sys.vip.level (0..10). Save antigo com a flag S.vip === true (ou S.sys.vip.active) e sem nível = VIP 1. */
function level(S){
  if(!S) return 0; const o=S.sys&&S.sys.vip;
  if(o&&typeof o.level==='number'&&isFinite(o.level)) return clamp(Math.floor(o.level),0,DATA.maxLevel);
  return (S.vip===true||(o&&o.active===true))?1:0;
}
const active=S=>level(S)>=1;
const pointsOf=S=>int0(S&&S.sys&&S.sys.vip&&S.sys.vip.points);
function store(S,l,pts){ if(!S.sys||typeof S.sys!=='object') S.sys={}; S.sys.vip={level:l, active:l>=1, points:pts}; S.vip=l>=1; }
/* nível manual (testes, debug, migração). Não mexe nos pontos. */
function setLevel(S,n){ if(!S||typeof S!=='object') return false; store(S,clamp(int0(n),0,DATA.maxLevel),pointsOf(S)); prismMax(S); return true; }
/* nível alcançado com p pontos */
function levelForPoints(p){ let l=0; for(let i=1;i<=DATA.maxLevel;i++) if(int0(p)>=int0(DATA.points[i])) l=i; return l; }
/* soma pontos VIP de uma COMPRA (quem chama é a loja; nada é cobrado aqui). O nível só sobe, nunca desce. {points, from, to, levels} */
function addPoints(S,n){ if(!S||typeof S!=='object') return null; const from=level(S), pts=pointsOf(S)+int0(n), to=Math.max(from,levelForPoints(pts));
  store(S,to,pts); prismMax(S); return {points:pts,from,to,levels:to-from}; }
/* Revisão 5: VIP no máximo → 500 fragmentos do Prismático uma vez (Sys.pet decide; só com a v4 ligada) */
function prismMax(S,host){ const N=root.Sys&&root.Sys.newDrops; try{ if(N&&N.grant) N.grant(S,host||(root.Sys&&root.Sys.host),'vip:level',{level:level(S)}); }catch(e){}   // itens novos: VIP 8 Fênix gigante, VIP 9 Serpe infernal (uma vez)
  const P=root.Sys&&root.Sys.pet; return P&&P.prismVipMax?P.prismVipMax(S,host):null; }
/* barra de progresso da tela: {level, points, next, needTotal, missing, frac, max} */
function progress(S){ const l=level(S), p=pointsOf(S), max=l>=DATA.maxLevel, nt=max?0:int0(DATA.points[l+1]), base=int0(DATA.points[l]);
  return {level:l, points:p, next:max?null:l+1, needTotal:nt, missing:max?0:Math.max(0,nt-p), frac:max?1:clamp((p-base)/Math.max(1,nt-base),0,1), max}; }
/* primeiro nível de VIP cujo degrau de velocidade da tabela alcança t */
function vipForSpd(t){ for(let i=0;i<=DATA.maxLevel;i++) if(int0(DATA.table.spd[i])>=t) return i; return DATA.maxLevel; }
const setActive=(S,on)=>setLevel(S,on?Math.max(1,level(S)):0);   // compatível com a versão anterior
const tier=S=>DATA.levels[clamp(level(S),0,DATA.levels.length-1)]||DATA.levels[0];

const playerLevelOf=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); if(host&&typeof host.level==='function') return int0(host.level())||1; return 1; };
/* velocidade máxima liberada e o que falta para cada degrau. {max, speeds:[{speed, unlocked, text, need:{vip?, level?}}], next} */
function maxSpeed(S,host){
  const v=level(S), sp=int0(DATA.table.spd[v]), pl=playerLevelOf(S,host), out=[]; let max=1;
  for(const st of DATA.speeds){
    const ok=st.rules.some(r=>sp>=int0(r.spd)&&pl>=int0(r.level));
    if(ok) max=Math.max(max,st.speed);
    // o que falta: a regra mais perto de cumprir (menos condições faltando); need.vip = nível de VIP que dá o degrau pedido
    let need=null; if(!ok){ for(const r of st.rules){ const n={}; if(int0(r.spd)>sp) n.vip=vipForSpd(int0(r.spd)); if(int0(r.level)>pl) n.level=int0(r.level); if(!need||Object.keys(n).length<Object.keys(need).length) need=n; } }
    out.push({speed:st.speed, unlocked:ok, text:st.text||'', need});
  }
  const next=out.find(x=>!x.unlocked)||null;
  return {max, speeds:out, next, vipLevel:v, playerLevel:pl};
}
/* função única de velocidade (nome pedido pela fps-c9): 1, 2 ou 4. Detalhe e motivos: maxSpeed(S, host). */
const speedMax=(S,host)=>maxSpeed(S,host).max;
/* benefícios do nível atual; speedMax vem de maxSpeed (o host é opcional: sem ele, nível do jogador do Sys.level) */
const v9on=()=>{ const L=root.Sys&&root.Sys.level; return !!(L&&L.DATA&&L.DATA.v9&&L.DATA.v9.on===true); };
function perks(S,host){ const p=Object.assign({},tier(S).perks); if(v9on()) p.xpPct=num(DATA.table.xp9[level(S)],0); p.speedMax=maxSpeed(S,host).max; return p; }
const mult=(S,k)=>{ const p=perks(S); return k==='xp'?1+p.xpPct/100:k==='gold'?1+p.goldPct/100:k==='offline'?p.offlineMult:1; };
function bonus(S){ const t=tier(S).bonus||{}; return {atkPct:num(t.atkPct,0),hpPct:num(t.hpPct,0),goldPct:0,critPct:0,defPct:0,fc:0}; }

/* linha da tabela para a tela (comparar "sem VIP" × "VIP n"): {level, atkPct, goldXpPct, keys, chestPerDay, offlineMult, speed, frame, vipSkin, aura} */
function levelInfo(n){ const d=DATA.levels[clamp(int0(n),0,DATA.maxLevel)];
  return {level:clamp(int0(n),0,DATA.maxLevel), atkPct:d.bonus.atkPct, goldXpPct:d.perks.goldPct, goldPct:d.perks.goldPct, xpPct:d.perks.xpPct, keys:d.perks.instanceKeysAdd,
    chestPerDay:DATA.chestBase+d.perks.chestCapAdd, offlineMult:d.perks.offlineMult, speedTier:d.spd, frame:d.perks.frame, frameVip:d.perks.frameVip, frameVipText:d.perks.frameVip?'Moldura VIP '+d.perks.frameVip:'', vipSkin:d.perks.vipSkin, aura:d.perks.aura}; }
/* conveniências do VIP: {on, level, autoCollect:bool, bag:n, offlineH:n, autoFuse, autoEquip, autoSell, skipBoss, arena:n, autoForge, tower:n, bossTries:n, passXp:%, eventTries:n}
   Desligado (convOn=false): tudo no valor do grátis (val[0] ou false), para os módulos lerem sem condição. */
function conv(S,id){ const l=level(S), on=DATA.convOn===true;
  if(id!=null){ const c=DATA.conv.find(x=>x.id===id); if(!c) return null; const value=c.val?num(c.val[on?l:0],c.val[0]):(on&&l>=c.v);
    return {id,on:on&&l>=c.v,need:c.v,value,name:c.name,free:c.free,lockText:'VIP '+c.v}; }   // conv(S, 'autoCollect') → {on, need, value, lockText}
  const out={on,level:on?l:0}; for(const c of DATA.conv) out[c.id]=c.val?num(c.val[on?l:0],c.val[0]):(on&&l>=c.v); return out; }
/* tabela legível para o dono: benefício · VIP que libera · o que o grátis tem · valor por nível */
const convTable=()=>DATA.conv.filter(c=>c.v>0).map(c=>({id:c.id,name:c.name,vip:c.v,free:c.free,values:c.val?c.val.slice():null,unit:c.unit||''}));
const API={conv,convTable,DATA,level,active,setLevel,setActive,addPoints,levelForPoints,progress,levelInfo,perks,mult,maxSpeed,speedMax,bonus};
root.Sys=root.Sys||{}; root.Sys.vip=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
