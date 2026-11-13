/* Eonbound — Sys.bossLoss: DERROTA QUE RENDE (docs/IDLE_PARECIDOS.md §3 item 4, P1 aprovado pelo dono 13/11).
   Perder para o chefe dá um prêmio pequeno proporcional ao dano feito (ouro, XP e Pedra de Forja) e 3 dicas grátis com botão Ir.
   NUNCA oferta paga nessa tela: nada de gemas, loja, VIP, pacote, invocação ou sorteio (contra-exemplo do Legend of Slime).
   SÓ LÓGICA (a tela é do Engenheiro). CHAVE DESLIGADA: DATA.on=false → onDefeat devolve {on:false,...} e não credita nada.

   Prêmio = prêmio da VITÓRIA × share (30%) × fração da vida tirada × redutor do dia. Nunca passa de 30% da vitória.
     vitória (ouro) = goldBase × goldGrowth^(fase−1) × bossGoldMult (docs/balance.json: 4 · 1,15 · 5, a mesma conta do js/battle.js mkEnemy)
     vitória (XP)   = Sys.loot.xpFor({boss,stage,era}) (a mesma XP de chefe do abate)
     pedra de forja = 1 (o chefe vencido dá 1-2) só se tirou ≥ 50% e só na 1ª derrota premiada da fase no dia
   Contra farm de derrota de propósito: abaixo de 10% de dano não rende; por fase e por dia só as 3 primeiras derrotas rendem (100%, 50%, 25%);
   no máximo 15 derrotas premiadas por dia no total. Perder 3 vezes a 99% rende < 0,52 de UMA vitória: vencer sempre vale mais.
   Dicas: Sys.advice.all (ranking por ganho de FC, a mesma conta do HUD) numa CÓPIA do save, filtrado como o js/diff.js (diffAdvice) e mais rígido. */
(function(root){
'use strict';

const DATA={
  on:false,                       // CHAVE: liga quando o Engenheiro mostrar na tela da Derrota e o dono aprovar
  minFrac:0.10,                   // menos de 10% da vida do chefe: sem prêmio (só as dicas)
  share:0.30,                     // teto: 30% do prêmio da vitória (com 100% de dano)
  perStageDay:[1,0.5,0.25],       // 1ª, 2ª e 3ª derrota premiada na MESMA fase no dia; da 4ª em diante, nada
  dayMax:15,                      // derrotas premiadas por dia, somando todas as fases
  stone:{minFrac:0.5, n:1},       // Pedra de Forja: só na 1ª derrota premiada da fase no dia
  gold:{base:4, growth:1.15, bossMult:5},   // docs/balance.json goldBase/goldGrowth/bossGoldMult (js/battle.js BAL)
  xpFallback:33,                  // XP de chefe sem o Sys.loot carregado (Sys.loot.DATA.xp.boss)
  top:3,
  stagesPerEra:10,                // só quando o Engenheiro não manda a era (js/battle.js STAGES_PER_ERA)
  /* destinos permitidos (tab do Sys.advice → tela que o Engenheiro abre no Ir). Qualquer outro destino fica fora */
  dests:['gear','forge','pet','mount','titles','hero'],
  /* nunca na tela da Derrota: compra, oferta, VIP, pacote, gemas, invocação, sorteio */
  forbidden:/buy|shop|store|summon|offer|oferta|vip|pack|gacha|gem|pay|premium|loja|compra|invoc|sorteio|ba[uú]/i,
};

const SYS=()=>root.Sys||{};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(Number(v),0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const clone=o=>{ try{ return typeof structuredClone==='function'?structuredClone(o):JSON.parse(JSON.stringify(o)); }catch(e){ return JSON.parse(JSON.stringify(o)); } };
const pad=n=>String(n).padStart(2,'0');
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function dayKey(ms){ const C=SYS().clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms);   // mesmo fuso do Sys.loot (Sys.clock)
  const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }

const offRes=()=>({on:false,reward:{gold:0,xp:0,stones:0,gems:0},tips:[],capped:false,pct:0,text:''});

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.bossLoss.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.bossLoss; if(!o||typeof o!=='object') o=S.sys.bossLoss={};
  o.v=1; o.day=typeof o.day==='string'?o.day:''; o.total=int0(o.total);
  if(!o.n||typeof o.n!=='object'||Array.isArray(o.n)) o.n={};
  for(const k in o.n) o.n[k]=int0(o.n[k]);
  o.gold=int0(o.gold); o.xp=int0(o.xp); o.stones=int0(o.stones);   // somas de sempre (só para conferência)
  return o;
}
function today(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.n={}; o.total=0; } return o; }

/* prêmio da vitória sobre o chefe da fase (referência do teto) */
function winGold(stage){ const G=DATA.gold, st=Math.max(1,int0(stage)); return Math.max(1,Math.ceil(G.base*Math.pow(G.growth,st-1)*G.bossMult)); }
function winXp(host,stage,era,eraBoss){ const L=SYS().loot;
  if(L&&typeof L.xpFor==='function'){ try{ return int0(L.xpFor({boss:true,eraBoss:!!eraBoss,stage:Math.max(1,int0(stage)),era:int0(era)},host,eraBoss?'eraBoss':'boss')); }catch(e){} }
  return DATA.xpFallback; }

/* quanto a PRÓXIMA derrota nesta fase renderia (sem creditar): {mult, capped, nth} */
function slot(S,host,stage){ const o=today(S,host), nth=int0(o.n[String(int0(stage))]);
  if(o.total>=DATA.dayMax) return {mult:0,capped:true,nth};
  const m=nth<DATA.perStageDay.length?num(DATA.perStageDay[nth],0):0; return {mult:m,capped:m<=0,nth}; }

/* as 3 dicas (só ganho de FC, só telas do jogo, nada pago). Mesmo filtro do js/diff.js diffAdvice + lista proibida + destino permitido */
function tips(S,host,limit){ const A=SYS().advice; if(!A||typeof A.all!=='function') return [];
  let list=[]; try{ list=A.all(clone(S),host).list||[]; }catch(e){ list=[]; }   // CÓPIA: torre/instâncias abrem o dia no 1º uso e a Derrota não muda o save
  const out=[], max=clamp(int0(limit==null?DATA.top:limit),0,DATA.top);
  for(const a of list){ if(out.length>=max) break; if(!a) continue;
    const kind=String(a.kind||''), id=String(a.id||''), dest=String(a.tab||'');
    if(/^(buy|shop|summon)/.test(kind)) continue;                                   // igual ao js/diff.js
    if(DATA.forbidden.test(kind)||DATA.forbidden.test(id)||DATA.forbidden.test(dest)) continue;
    if(!DATA.dests.includes(dest)) continue;
    const label=String(a.label||'').trim(); if(!label) continue;   // o rótulo não passa pela lista: nome de item pode conter "gem" (Engrenagem)
    out.push({id,kind,label,gain:Math.max(0,Math.round(num(a.gain,0))),gainText:String(a.gainText||''),dest,ready:!!a.ready}); }
  return out; }

/* conta do prêmio, sem creditar */
function quote(S,host,opts){ opts=opts||{};
  const stage=Math.max(1,int0(opts.stage!=null?opts.stage:(host&&host.stage?host.stage():1)));
  const era=opts.era!=null?int0(opts.era):Math.floor((stage-1)/DATA.stagesPerEra);   // o Engenheiro deve mandar a era (eraOf); sem ela, 10 fases por era como o jogo
  const max=num(Number(opts.bossMaxHp),0), dmg=num(Number(opts.dmgDone),0);
  const frac=max>0?clamp(dmg/max,0,1):0, pct=Math.floor(frac*100);
  const s=slot(S,host,stage), wG=opts.winGold!=null?int0(opts.winGold):winGold(stage), wX=opts.winXp!=null?int0(opts.winXp):winXp(host,stage,era,opts.eraBoss);
  const z={stage,era,frac,pct,mult:s.mult,capped:s.capped,nth:s.nth,winGold:wG,winXp:wX,gold:0,xp:0,stones:0,low:frac<DATA.minFrac};
  if(s.capped||z.low) return z;
  const k=DATA.share*frac*s.mult;
  z.gold=Math.min(Math.floor(wG*DATA.share),Math.floor(wG*k));
  z.xp=Math.min(Math.floor(wX*DATA.share),Math.floor(wX*k));
  z.stones=(s.nth===0&&frac>=DATA.stone.minFrac)?int0(DATA.stone.n):0;
  return z; }

function textOf(z){ if(z.low) return `Você tirou ${z.pct}% da vida do chefe. Tire pelo menos ${Math.round(DATA.minFrac*100)}% para ganhar um prêmio.`;
  if(z.capped) return `Você tirou ${z.pct}% da vida do chefe. O prêmio de derrota desta fase volta amanhã.`;
  return `Você tirou ${z.pct}% da vida do chefe.`; }

/* PRINCIPAL: o Engenheiro chama UMA vez ao perder para o chefe.
   opts: {stage, dmgDone, bossMaxHp, era?, eraBoss?, winGold?, winXp?}. Credita ouro (host.addGold), XP (Sys.level.addXp) e pedra (Sys.forge.addStones).
   → {on, reward:{gold,xp,stones,gems:0}, tips:[{id,kind,label,gain,gainText,dest,ready}], capped, pct, text} */
function onDefeat(S,host,opts){
  if(DATA.on!==true) return offRes();
  if(!S||typeof S!=='object') return offRes();
  const z=quote(S,host,opts), reward={gold:0,xp:0,stones:0,gems:0};
  if(!z.capped&&!z.low&&(z.gold>0||z.xp>0||z.stones>0)){
    const o=today(S,host), key=String(z.stage);
    o.n[key]=int0(o.n[key])+1; o.total++;
    if(z.gold>0&&host&&typeof host.addGold==='function'){ host.addGold(z.gold); reward.gold=z.gold; }
    if(z.xp>0){ const L=SYS().level; try{
      if(L&&typeof L.addXp==='function'){ L.addXp(S,z.xp,host,'bossLoss'); reward.xp=z.xp; }
      else if(host&&typeof host.addXp==='function'){ host.addXp(z.xp); reward.xp=z.xp; } }catch(e){} }
    if(z.stones>0){ const F=SYS().forge; try{ if(F&&typeof F.addStones==='function') reward.stones=int0(F.addStones(S,z.stones,host)); }catch(e){} }
    o.gold+=reward.gold; o.xp+=reward.xp; o.stones+=reward.stones;
    if(host&&typeof host.onChange==='function') host.onChange();
  }
  return {on:true,reward,tips:tips(S,host),capped:z.capped,pct:z.pct,text:textOf(z)}; }

/* para a tela mostrar antes/depois sem creditar (ex.: "derrotas premiadas hoje nesta fase") */
function peek(S,host,opts){ if(DATA.on!==true||!S||typeof S!=='object') return offRes(); const z=quote(clone(S),host,opts);
  return {on:true,reward:{gold:z.gold,xp:z.xp,stones:z.stones,gems:0},tips:[],capped:z.capped,pct:z.pct,text:textOf(z),left:z.capped?0:Math.max(0,DATA.perStageDay.length-z.nth)}; }

const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const API={DATA,setOn,ensure,onDefeat,peek,quote,tips,winGold,winXp,dayKey};
root.Sys=root.Sys||{}; root.Sys.bossLoss=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
