/* Eonbound — Sys.phases: CURVA DE 9 ERAS, REVISÃO 2 (100 fases × 4 dificuldades; aprovada pelo PO como base; reports/progressao-9-eras.md §R2).
   O que este módulo dá ao jogo (o engenheiro liga): FC recomendada e nível-trava de cada fase, INIMIGO de cada fase (vida, dano, DEF), multiplicadores de
   prêmio por dificuldade, ordem de liberação (Fácil 1-100 → Médio → ...; a era seguinte abre com as dificuldades EXIGIDAS vencidas) e o progresso no save.
   É CONTA calibrada no jogo de hoje (eras 0-2 jogadas, balance.json v8): inimigo = fração da FC recomendada da fase, a mesma proporção da era 2 de hoje.
   As fórmulas reproduzem docs/balance-v9.json (bloco rev2): FC até 0,2% (arredondamento), nível-trava exato (teste test/sys/e2.test.js).
   DEF dos inimigos (R2.6): na FC recomendada o comum tira 10% do dano, o chefe (fase 50) 20%, o Senhor (fase 100) 25%; a vida cai na mesma proporção.
   CHAVE DESLIGADA (DATA.on=false): desligada, nada muda (o jogo segue com o mkEnemy de hoje). Estado: S.sys.phases. Ligar junto com Sys.level.setV9(true)
   e Sys.stats.setEra9(true) (a curva de 9 eras é uma coisa só). Sem DOM: roda no servidor. API: reports/sys-e2-api.md §5k. */
(function(root){
'use strict';
const DATA={
  on:false, perEra:100, eras:9, diffs:4, step:3,
  diffName:['Fácil','Médio','Difícil','Hell'],
  required:[1,1,2,2,3,3,4,4,3],                     // dificuldades EXIGIDAS por era para liberar a próxima (era 8: o Hell é para depois das 9 eras)
  eraName:['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'],
  // FC recomendada: f0 = Fácil fase 1, f100 = Fácil fase 100 (cresce geométrico entre elas); cada dificuldade = ×3 (degrau fixo)
  f0:  [311,1858,28435,1223694,28142164,537667962,18172296395,1027196806009,39756852025890],
  f100:[1723,27170,393970,9106371,58165876,1970369155,37134650063,1442005005549,79879584079640],   // fcRec da fase 100 do Fácil (docs/balance-v9.json rev2); a razão g é calculada no load
  lvlEntry:[1,12,25,40,55,70,85,100,110], lvlExit:[12,25,40,55,70,85,100,110,120],
  chefe:50, senhor:100,
  // INIMIGO = fração da fcRec da fase (calibrado na era 2 de hoje: comum vida 4,0% / dano 0,34%; chefe da fase vida 60% / dano 1,9%; Senhor ×1,1 / ×0,9)
  // hpDef = a vida cai na proporção da DEF (tempo de luta igual); def = fração da fcRec (ATK de quem está na fcRec ≈ 5,5% dela; redução DEF/(DEF+2·ATK))
  enemy:{
    common:{hp:0.040, dmg:0.0034, def:0.012,  hpDef:0.90},
    boss:  {hp:0.60,  dmg:0.019,  def:0.012,  hpDef:0.90},   // o chefe da última onda de cada fase (como hoje)
    chefe: {hp:0.60,  dmg:0.019,  def:0.0275, hpDef:0.80},   // fase 50
    senhor:{hp:0.66,  dmg:0.017,  def:0.037,  hpDef:0.75},   // fase 100 (Senhor daquela dificuldade)
  },
  // prêmios por dificuldade (R2.5; proposta, quem calibra o drop é a fps-30). XP NÃO multiplica (o teto diário de XP de abate seguraria).
  reward:{gold:[1,1.6,2.5,4], mats:[1,1.6,2.5,4], topRarChance:[1,1.3,1.7,2.2], qualityBestOf:[1,1,2,3], firstWinGems:[1,1.5,2,3], firstWinPetFrag:[0,0,0,1]},
  // ouro/drop do jogo de hoje (fórmula do engenheiro por "fase antiga" 1-90): fase n da era e ≈ fase antiga e×10 + ⌈n/10⌉
  // PO 12/11 (reports/eras-7-8.md): começo das eras 7-8 suavizado — ouro ×1,5 nas fases 1-30 do Fácil (a parede de entrada ficava 3× a da era 2)
  entryGold:{eras:[7,8], diff:0, upTo:30, mult:1.5},
  // PROPOSTA (simulação de 180 dias, reports/sim-180-dias.md): títulos, pet, montaria, guilda e VIP somam ×1,02 (era 1) a ×1,70 (era 8) na FC do jogador
  // grátis típico; sem ajuste as paredes de FC somem (ele fica 1,5-2× acima da FC recomendada e só a trava de nível segura). fcScale multiplica a FC
  // recomendada E os inimigos da era. LIGADO por decisão do dono (12/11, "inimigos mais fortes"); on:false = a tabela da Revisão 2 exata.
  fcScale:{on:true, mult:[1,1,1.08,1.2,1.3,1.35,1.45,1.55,1.7]},
  glow:0.9,                                          // o botão "Desafiar" brilha com 90% da fcRec (como na Revisão 1)
  waves:{short:[0,1], shortWaves:1},                 // R2.1: nas eras 0-1 a fase é 1 onda curta (~15-25 s); da era 2 em diante, fase normal (proposta)
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const G=[]; function regrow(){ for(let e=0;e<DATA.eras;e++) G[e]=Math.pow(DATA.f100[e]/DATA.f0[e],1/(DATA.perEra-1)); } regrow();
const okE=e=>Number.isInteger(e)&&e>=0&&e<DATA.eras, okD=d=>Number.isInteger(d)&&d>=0&&d<DATA.diffs, okN=n=>Number.isInteger(n)&&n>=1&&n<=DATA.perEra;
const valid=(e,d,n)=>okE(e)&&okD(d)&&okN(n);

/* ---------- tabela (pura, vale ligada ou desligada: as telas e o servidor podem consultar) ---------- */
const isRequired=(e,d)=>okE(e)&&okD(d)&&d<DATA.required[e];
const kindOf=n=>n===DATA.senhor?'senhor':n===DATA.chefe?'chefe':null;
const scaleOf=e=>DATA.fcScale&&DATA.fcScale.on===true?num(DATA.fcScale.mult[e],1):1;
function fcRec(e,d,n){ if(!valid(e,d,n)) return 0; return Math.round(DATA.f0[e]*Math.pow(DATA.step,d)*Math.pow(G[e],n-1)*scaleOf(e)); }
/* nível para desafiar: nas exigidas sobe da entrada à saída da era ao longo de Fácil 1-100 → Médio → ...; na opcional = nível de saída da era */
function lvlLock(e,d,n){ if(!valid(e,d,n)) return 0; const a=DATA.lvlEntry[e], b=DATA.lvlExit[e];
  if(!isRequired(e,d)) return b; const T=DATA.required[e]*DATA.perEra, i=d*DATA.perEra+n-1; return a+Math.round((b-a)*i/T); }
/* fase antiga equivalente (1-90) para o ouro/drop da fórmula de hoje */
const oldStage=(e,n)=>okE(e)&&okN(n)?e*10+Math.ceil(n/10):1;
/* inimigo da fase. kind: 'common' | 'boss' (chefe da última onda) — na fase 50/100 o 'boss' vira chefe/Senhor sozinho. {hp, dmg, def, kind, fcRec} */
function enemy(e,d,n,kind){ if(!valid(e,d,n)) return null; const f=fcRec(e,d,n); let k=kind==='boss'?(kindOf(n)||'boss'):'common';
  if(kind==='chefe'||kind==='senhor') k=kind; const E=DATA.enemy[k];
  return {kind:k,hp:Math.max(1,Math.round(f*E.hp*E.hpDef)),dmg:Math.max(1,Math.round(f*E.dmg)),def:Math.round(f*E.def),fcRec:f,
    goldStage:oldStage(e,n),goldMult:DATA.reward.gold[d]*entryMult(e,d,n),name:k==='senhor'?'Senhor da Era':k==='chefe'?'Chefe':null}; }
function info(e,d,n){ if(!valid(e,d,n)) return null;
  return {era:e,diff:d,stage:n,diffName:DATA.diffName[d],eraName:DATA.eraName[e],fcRec:fcRec(e,d,n),lvlLock:lvlLock(e,d,n),required:isRequired(e,d),boss:kindOf(n),
    oldStage:oldStage(e,n),shortWave:DATA.waves.short.indexOf(e)>=0}; }
const entryMult=(e,d,n)=>{ const G=DATA.entryGold; return G&&G.eras.includes(e)&&d===G.diff&&n<=G.upTo?G.mult:1; };
const rewardOf=d=>{ const R=DATA.reward, i=okD(d)?d:0, o={}; for(const k in R) o[k]=R[k][i]; return o; };

/* ---------- progresso no save: S.sys.phases {v, best:{era:[b0,b1,b2,b3]}, cur:{e,d,n}, migrated} ---------- */
function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.phases.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.phases; if(!o||typeof o!=='object') o=S.sys.phases={}; o.v=1;
  const b=(o.best&&typeof o.best==='object'&&!Array.isArray(o.best))?o.best:{}; o.best={};
  for(let e=0;e<DATA.eras;e++){ const a=Array.isArray(b[e])?b[e]:[]; const r=[]; for(let d=0;d<DATA.diffs;d++) r.push(clamp(int0(a[d]),0,DATA.perEra)); if(r.some(x=>x>0)) o.best[e]=r; }
  const c=o.cur||{}; o.cur={e:okE(c.e)?c.e:0,d:okD(c.d)?c.d:0,n:okN(c.n)?c.n:1}; o.migrated=o.migrated===true; return o; }
const bestOf=(S,e,d)=>{ const o=ensure(S); return o.best[e]?o.best[e][d]:0; };
/* era e liberada: era 0 sempre; senão todas as exigidas da era anterior vencidas até a fase 100 */
function eraCleared(S,e){ if(!okE(e)) return false; for(let d=0;d<DATA.required[e];d++) if(bestOf(S,e,d)<DATA.perEra) return false; return true; }
const eraOpen=(S,e)=>okE(e)&&(e===0||eraCleared(S,e-1));
function eraMax(S){ let m=0; for(let e=1;e<DATA.eras;e++){ if(eraOpen(S,e)) m=e; else break; } return m; }
const playerLevel=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); return int0(host&&host.level&&host.level())||1; };
/* pode desafiar? {ok, reason: off|id|era|order|level, needLevel, fcRec, glow} — a FC NÃO trava (quem segura é a luta); glow = FC ≥ 90% da fcRec */
function canChallenge(S,host,e,d,n,fc){ if(!ON()) return {ok:false,reason:'off'}; if(!valid(e,d,n)) return {ok:false,reason:'id'};
  const f=fcRec(e,d,n), lk=lvlLock(e,d,n), out={fcRec:f,needLevel:lk,glow:num(fc,0)>=DATA.glow*f};
  if(!eraOpen(S,e)) return Object.assign(out,{ok:false,reason:'era'});
  // ordem: fase n exige n-1 vencida na mesma dificuldade; a fase 1 de uma dificuldade exige a fase 100 da anterior
  const prevOk=n>1?bestOf(S,e,d)>=n-1:(d===0||bestOf(S,e,d-1)>=DATA.perEra);
  if(!prevOk) return Object.assign(out,{ok:false,reason:'order'});
  if(playerLevel(S,host)<lk) return Object.assign(out,{ok:false,reason:'level'});
  return Object.assign(out,{ok:true,reason:''}); }
/* venceu a fase: grava o melhor e devolve {ok, first, next:{e,d,n}|null, eraUnlocked} (o prêmio é do jogo/fps-30, com rewardOf(d)) */
function win(S,host,e,d,n){ const c=canChallenge(S,host,e,d,n); if(!c.ok) return {ok:false,reason:c.reason};
  const o=ensure(S); if(!o.best[e]) o.best[e]=[0,0,0,0]; const first=o.best[e][d]<n; if(first) o.best[e][d]=n;
  const before=eraOpen(S,e+1)&&first&&n===DATA.perEra&&d===DATA.required[e]-1, nx=next(S,host,e,d,n); if(nx&&first) o.cur=nx;   // repetir fase antiga (farm) não puxa o jogador para trás
  return {ok:true,first,next:nx,eraUnlocked:before&&okE(e+1)?e+1:null,reward:rewardOf(d)}; }
/* próxima fase a jogar depois de (e,d,n): a seguinte da mesma dificuldade; na 100, a próxima dificuldade EXIGIDA; fim das exigidas: era seguinte */
function next(S,host,e,d,n){ if(n<DATA.perEra) return {e,d,n:n+1}; if(d+1<DATA.required[e]) return {e,d:d+1,n:1};
  if(okE(e+1)) return {e:e+1,d:0,n:1}; if(d+1<DATA.diffs) return {e,d:d+1,n:1}; return null; }
/* MIGRAÇÃO do save de hoje (10 fases por era, S.stage 1..N): eras anteriores ficam vencidas nas dificuldades exigidas; na era atual o Fácil fica em
   (fase antiga da era − 1) × 10, para ninguém perder caminho. Idempotente; só roda com a chave ligada. Devolve {migrated, era, best}. */
function migrate(S,host,oldStageN){ if(!ON()) return {migrated:false,reason:'off'}; const o=ensure(S); if(o.migrated) return {migrated:false,reason:'done'};
  const s=Math.max(1,int0(num(oldStageN,num(S&&S.stage,1)))), e=clamp(Math.floor((s-1)/10),0,DATA.eras-1), k=(s-1)%10;
  for(let x=0;x<e;x++){ const r=[0,0,0,0]; for(let d=0;d<DATA.required[x];d++) r[d]=DATA.perEra; o.best[x]=r; }
  if(k>0){ o.best[e]=[k*10,0,0,0]; } o.cur={e,d:0,n:Math.min(DATA.perEra,k*10+1)}; o.migrated=true; return {migrated:true,era:e,best:k*10}; }
/* para a tela do mapa (20): {era, eraName, open, cleared, diffs:[{d, name, required, best, done, open}]} */
function eraView(S,e){ if(!okE(e)) return null; const ds=[];
  for(let d=0;d<DATA.diffs;d++){ const b=bestOf(S,e,d); ds.push({d,name:DATA.diffName[d],required:isRequired(e,d),best:b,done:b>=DATA.perEra,open:eraOpen(S,e)&&(d===0||bestOf(S,e,d-1)>=DATA.perEra)}); }
  return {era:e,eraName:DATA.eraName[e],open:eraOpen(S,e),cleared:eraCleared(S,e),diffs:ds}; }
const current=S=>{ const c=ensure(S).cur; return info(c.e,c.d,c.n); };

const API={DATA,regrow,isRequired,kindOf,fcRec,lvlLock,oldStage,enemy,info,rewardOf,ensure,bestOf,eraCleared,eraOpen,eraMax,canChallenge,win,next,migrate,eraView,current};
root.Sys=root.Sys||{}; root.Sys.phases=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
