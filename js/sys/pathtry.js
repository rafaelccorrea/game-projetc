/* Eonbound — Sys.pathTry: ENSAIO DE CAMINHO (docs/IDLE_PARECIDOS.md §3 item 12, P3, dono aprovou 13/11).
   Antes de escolher o caminho de luta no Nv 30 (Lâmina, Disparo, Arcano; docs/LOM_VS_EONBOUND.md item 7), o jogador testa cada um numa
   LUTA DE TREINO de 60 s contra o Boneco de Treino. GRÁTIS, SEM LIMITE e SEM EFEITO DURADOURO: nada é gasto, nada é ganho (sem ouro, XP,
   itens, pedras, progresso de fase ou missão), o herói não morre e o bônus do caminho vale só durante o ensaio.
   O save guarda só o que a tela precisa para comparar: quantas vezes testou e o melhor dano por segundo de cada caminho (S.sys.pathTry).
   Ainda NÃO existe o módulo do caminho de luta: os números de DATA.paths são a PROPOSTA do ensaio; quando existir Sys.path com
   DATA.paths no mesmo formato, o ensaio usa os de lá (a escolha de verdade é do Sys.path, não daqui). DESLIGADO (DATA.on=false).
   Sem tela própria: a luta é a batalha normal com as flags de treino (battle()). */
(function(root){
'use strict';

const DATA={
  on:false,
  unlockLevel:30,          // nível em que o caminho é escolhido
  sec:60,                  // duração do ensaio
  afterChoose:false,       // depois de escolher, o ensaio some (a troca do caminho é do Sys.path)
  // PROPOSTA do ensaio (o Sys.path, quando existir, manda). strikes = pontos % no Sys.strikes; stat = pontos % nos atributos do herói.
  paths:[
    {id:'blade',  name:'Lâmina',  desc:'Contra-ataque e roubo de vida: quanto mais apanha, mais devolve', strikes:{counter:8, lifesteal:5}, stat:{}},
    {id:'shot',   name:'Disparo', desc:'Combo e velocidade de ataque: muitos golpes rápidos',           strikes:{combo:8},                stat:{aspd:10}},
    {id:'arcane', name:'Arcano',  desc:'Atordoar e crítico de habilidade: golpes especiais fortes',     strikes:{stun:3},                 stat:{critDmg:20}},
  ],
  // Boneco de Treino: não morre; bate leve de 2 em 2 s (para o contra-ataque e o roubo de vida aparecerem); o herói fica com no mínimo 1 de vida
  dummy:{name:'Boneco de Treino', immortal:true, hitEverySec:2, hitPctHeroHp:4, heroMinHp:1},
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clone=o=>JSON.parse(JSON.stringify(o));
const PATH=()=>root.Sys&&root.Sys.path;
const paths=()=>{ const P=PATH(); return P&&P.DATA&&Array.isArray(P.DATA.paths)&&P.DATA.paths.length?P.DATA.paths:DATA.paths; };
const pathOf=id=>paths().find(p=>p&&p.id===id)||null;
const levelOf=(S,host)=>{ if(host&&typeof host.level==='function') return int0(host.level()); const L=root.Sys&&root.Sys.level; try{ return L&&L.level?int0(L.level(S)):0; }catch(e){ return 0; } };
const chosenOf=S=>{ const P=PATH(); try{ if(P&&typeof P.chosen==='function') return P.chosen(S)||null; }catch(e){} const o=S&&S.sys&&S.sys.path; return o&&typeof o.id==='string'?o.id:null; };

let cur=null;   // ensaio em andamento (só na memória: fechar o jogo no meio não deixa nada)

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.pathTry.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.pathTry; if(!o||typeof o!=='object') o=S.sys.pathTry={};
  o.v=1; const t=o.tried&&typeof o.tried==='object'?o.tried:{}; o.tried={};
  for(const p of paths()){ const x=t[p.id]; if(x&&typeof x==='object') o.tried[p.id]={n:int0(x.n),best:int0(x.best)}; }
  return o;
}

/* {ok, reason:'off'|'id'|'level'|'chosen'|'busy', need} */
function canTry(S,host,id){
  if(DATA.on!==true) return {ok:false,reason:'off'};
  if(!pathOf(id)) return {ok:false,reason:'id'};
  if(levelOf(S,host)<DATA.unlockLevel) return {ok:false,reason:'level',need:DATA.unlockLevel};
  if(!DATA.afterChoose&&chosenOf(S)) return {ok:false,reason:'chosen'};
  if(cur) return {ok:false,reason:'busy'};
  return {ok:true,reason:''};
}
/* configuração da luta de treino para o motor da batalha */
function battle(id){ const p=pathOf(id); if(!p) return null; const D=DATA.dummy;
  return {mode:'pathTry', path:p.id, name:p.name, sec:DATA.sec,
    noLoot:true, noXp:true, noGold:true, noProgress:true, noQuest:true, noEnergy:true, noDeath:true, noPet:false,
    enemy:{name:D.name, immortal:D.immortal, hitEverySec:D.hitEverySec, hitPctHeroHp:D.hitPctHeroHp},
    heroMinHp:D.heroMinHp, bonus:{strikes:clone(p.strikes||{}), stat:clone(p.stat||{})}}; }
/* começa o ensaio. Não grava nada no save. → {ok, reason, battle} */
function start(S,host,id){ const c=canTry(S,host,id); if(!c.ok) return c; const b=battle(id); cur={id,battle:b}; return {ok:true,reason:'',battle:b}; }
function active(){ return cur?{id:cur.id,battle:clone(cur.battle)}:null; }
function cancel(){ const had=!!cur; cur=null; return had; }
/* fim do ensaio. res = {damage, sec} (dano total no boneco e segundos lutados). Só anota vezes e o melhor dano/s. Nunca dá prêmio.
   → {ok, id, dps, best, rows (compare)} */
function finish(S,host,res){ if(!cur) return {ok:false,reason:'none'}; const id=cur.id; cur=null;
  const sec=Math.max(1,Math.min(DATA.sec,num(res&&res.sec,DATA.sec))), dps=int0(num(res&&res.damage,0)/sec);
  const o=ensure(S), t=o.tried[id]||(o.tried[id]={n:0,best:0}); t.n++; t.best=Math.max(t.best,dps);
  return {ok:true,id,dps,best:t.best,rows:compare(S)}; }
/* comparação para a tela: os 3 caminhos com o melhor dano/s de cada (null = ainda não testou) e qual foi o maior */
function compare(S){ const o=ensure(S), rows=paths().map(p=>({id:p.id,name:p.name,tried:!!o.tried[p.id],n:o.tried[p.id]?o.tried[p.id].n:0,bestDps:o.tried[p.id]?o.tried[p.id].best:null}));
  let top=null; for(const r of rows) if(r.bestDps!=null&&(!top||r.bestDps>top.bestDps)) top=r; rows.forEach(r=>{ r.top=!!top&&r===top; }); return rows; }
/* modelo da tela (cartões dos 3 caminhos + botão Testar) */
function view(S,host){ const lv=levelOf(S,host), ch=chosenOf(S), rows=compare(S);
  return {on:DATA.on===true, unlocked:lv>=DATA.unlockLevel, needLevel:DATA.unlockLevel, chosen:ch, sec:DATA.sec, free:true,
    text:`Teste grátis: ${DATA.sec} s contra o ${DATA.dummy.name}. Nada é gasto e nada muda no seu herói.`,
    paths:paths().map((p,i)=>Object.assign({desc:p.desc,strikes:clone(p.strikes||{}),stat:clone(p.stat||{}),can:canTry(S,host,p.id)},rows[i]))}; }
/* o ensaio nunca mexe no poder: bônus fora do ensaio = zero (para quem somar por engano) */
function bonus(){ return {atkPct:0,hpPct:0,critPct:0,defPct:0,goldPct:0,fc:0}; }

function setOn(v){ DATA.on=!!v; if(!DATA.on) cur=null; return DATA.on; }
const API={DATA,setOn,ensure,canTry,battle,start,active,cancel,finish,compare,view,bonus};
root.Sys=root.Sys||{}; root.Sys.pathTry=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
