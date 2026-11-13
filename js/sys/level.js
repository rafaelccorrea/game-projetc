/* Eonbound — Sys.level: NÍVEL DO JOGADOR 1-100. XP de abates, chefes, instâncias, missões e offline; cada nível dá +0,3% de ATK e HP
   (nível 100 = +30%), e o nível LIBERA funções (torre, instâncias, forja, práticas, pet, arena) e os portões de raridade dos ovos.
   Spec: docs/CONTRATO_V2.md ("NÍVEL DO JOGADOR 1-100 e PORTÕES DE RARIDADE"). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-e2-api.md
   Números: docs/balance.json v6 (bloco "level"). Recalibrar = trocar só as tabelas de DATA. */
(function(root){
'use strict';

/* ---------------- dados (PROVISÓRIOS até a simulação v6) ---------------- */
const DATA={
  label:'Nível', icon:'⭐',
  maxLevel:100,
  statPerLevel:0.3,                        // +0,3% de ATK e de HP por nível (nível 100 = +30%) — decisão do PO
  // XP para ir do nível N ao N+1 (índice N-1): docs/balance.json v6 "level.xpToNext" (99 valores; acumulado: Nv 10 = 650, 25 = 32,5 mil, 70 = 264 mil, 100 = 960 mil)
  xpToNext:[20,33,46,59,72,85,98,112,125,322,579,836,1094,1351,1609,1866,2123,2381,2638,2895,3153,3410,3668,3925,4217,4259,4301,4343,4385,4427,4470,4512,4554,4596,4638,4681,4723,4765,4807,4849,4891,4934,4976,5018,5060,5102,5144,5187,5229,5271,5313,5355,5398,5440,5482,5524,5566,5608,5651,5693,5735,5777,5819,5861,5904,5946,5988,6030,6072,6708,7846,8983,10120,11258,12395,13532,14670,15807,16945,18082,19219,20357,21494,22631,23769,24906,26043,27181,28318,29455,30593,31730,32868,34005,35142,36280,37417,38554,39692],
  // XP por fonte, × (1 + era). Provisório. O XP de ABATE (orbes) é do Sys.loot (fps-30, Sys.loot.DATA.xp, sobe com era e fase),
  // que entrega por addXp: por isso não há kill/boss/eraBoss aqui (ordem do dono via PO).
  // v6: instance 25 (× 1 / 1,6 / 2,5 pela dificuldade), mission 30, dailyBonus 50 (todas as missões do dia), offline 20/h
  xp:{instance:25, mission:30, dailyBonus:50, offlinePerHour:20, offlineCapHours:8,   // XP offline: 8 h para TODOS (o VIP de conveniência aumenta o teto do ouro/itens/pedras/ração, não do XP: o calendário está calibrado)
  eraScale:1},
  // FONTE ÚNICA da liberação por nível (PO, 2026-11-12; reports/liberacao-por-nivel.md). As ids são as do MENU (FB_UNLOCK em js/fullbattle.js),
  // que passa a ler daqui. Chaves dos módulos: 'pet' = portão do Sys.pet (1; com o v20 ligado quem manda é Sys.pet.DATA.v20.unlockLevel = 20)
  // e 'instances' (= 'inst' do menu, via DATA.alias). Materiais caem antes e ficam guardados. Função sem tela continua oculta (regra do engenheiro).
  unlock:{missions:2, summon:3, practice:5, mail:7, login:7, profile:10, shopgem:10, forge:12, instances:14, tower:15, pass:18, pets:20,
          events:24, rank:28, arena:28, guild:32, mount:38, tourney:40, auction:45, wing:50, pet:1,
          map:1, codex:12, chat:16},   // PO 12/11: Mapa das Eras no 1 (as dificuldades além do Fácil abrem pelo Sys.phases), Códex 12, Chat 16 (só frases prontas)
  alias:{inst:'instances', mounts:'mount'},
  unlockName:{missions:'Missões',summon:'Invocar',practice:'Práticas',mail:'Correio',login:'Login diário',profile:'Perfil',shopgem:'Loja de gemas',
    forge:'Forja',instances:'Instâncias',tower:'Torre',pass:'Passe',pets:'Pets',events:'Eventos',rank:'Ranking',arena:'Arena',guild:'Guilda',
    mount:'Montaria',tourney:'Torneio do Poder',auction:'Leilão',wing:'Asa',pet:'Pets',map:'Mapa das Eras',codex:'Códex',chat:'Chat'},
  // portões de raridade dos OVOS (decisão do PO): raridade r exige nível E era mínimos. A fênix do andar 100 da torre é exceção.
  eggGate:{3:{level:70,era:4}, 4:{level:85,era:5}},
  // ===== CURVA DAS 9 ERAS (dono via PO; PROPOSTA, DESLIGADA). Spec e simulação: reports/curva-9-eras-e2.md =====
  // setV9(true): nível máximo 100 → 120 e a curva nova (grátis termina a era 8 no dia ~180, VIP 10 no ~120, jogando 40 min/dia + offline).
  // TETO DIÁRIO da XP de ABATE (só a que chega com src 'kill'): cheia até T[era] (os 40 min do grátis, conta da fps-30) × o XP do VIP,
  // 30% de T a 2T, 10% acima de 2T. Quem joga o dobro adianta ~15%. Missão, instância, offline, pacote e XP descansada não têm teto.
  // No v9 o offline em dobro do VIP vale para pedras, ração e ouro, NÃO para a XP (senão o VIP 5 passava de 1,5x).
  // ESTÁGIOS DO KAEL (garoto → adolescente → adulto → guerreiro lendário): nível E FC, os dois. FC = ~75% da FC mediana nesse nível.
  v9:{on:false, maxLevel:120, xpToNext:[20,33,46,59,72,85,98,112,125,322,579,710,730,760,790,820,850,880,910,940,980,1010,1050,1090,1920,1980,2050,2110,2170,2240,2310,2380,2460,2530,2610,2700,2780,2870,2950,4340,4470,4610,4750,4900,5050,5210,5370,5540,5710,5890,6070,6260,6460,6660,7160,7380,7610,7850,8090,8350,8610,8870,9150,9430,9730,10030,10340,10660,10990,12150,12530,12920,13320,13740,14160,14600,15060,15530,16010,16510,17020,17550,18100,18660,19030,19290,19550,19810,20080,20350,20630,20910,21190,21470,21760,22060,22350,22660,22960,31990,33540,35180,36890,38680,40570,42540,44610,46780,49060,50040,50810,51580,52370,53180,53990,54820,55650,56510,57370],
    kill:{T:[3663,3180,3024,3934,3909,4854,4846,4842,5799], mid:0.3, over:0.1},
    stages:[{id:'boy',name:'Garoto',lvl:1,fc:0},{id:'teen',name:'Adolescente',lvl:22,fc:15000},{id:'adult',name:'Adulto',lvl:35,fc:400000},
            {id:'legend',name:'Guerreiro lendário',lvl:70,fc:6e8}]},
  v9off:null,
};
DATA.v9off={maxLevel:DATA.maxLevel, xpToNext:DATA.xpToNext};
/* NÍVEL 120 SEM MEXER NAS ERAS 0-6 (regra do dono: nível máximo 120; pedido do Engenheiro para as eras 7-8 jogáveis).
   setCap120(true): só estende a tabela de hoje. Níveis 1-100 IGUAIS (a curva validada no jogo real), 101-120 continuam o mesmo passo do fim da
   tabela (+1137 por nível, ~1,03 mi de XP no total, quase o mesmo que de 1 a 100). Sem teto diário de abate e sem estágios do Kael (o herói não cresce).
   Número PROVISÓRIO: o tempo das eras 7-8 no jogo real precisa ser medido pelo QA, como foi feito na v7.3. setV9 (curva inteira nova) continua separado. */
DATA.cap120={on:false, maxLevel:120, xpToNext:(()=>{ const o=DATA.v9off.xpToNext, n=o.length, st=o[n-1]-o[n-2], t=o.slice(); while(t.length<119) t.push(t[t.length-1]+st); return t; })()};
function setCap120(on){ if(DATA.v9.on) return false; const src=on?DATA.cap120:DATA.v9off; DATA.cap120.on=!!on; DATA.maxLevel=src.maxLevel; DATA.xpToNext=src.xpToNext; return DATA.cap120.on; }
/* liga/desliga a curva das 9 eras (só troca tabelas; o save não muda: quem está no 100 continua no 100 e volta a subir) */
function setV9(on){ const src=on?DATA.v9:DATA.v9off; DATA.v9.on=!!on; DATA.maxLevel=src.maxLevel; DATA.xpToNext=src.xpToNext; return DATA.v9.on; }
const V9=()=>DATA.v9.on===true;

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.level.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.level; if(!o||typeof o!=='object') o=S.sys.level={};
  o.v=1; o.lvl=clamp(int0(o.lvl)||1,1,DATA.maxLevel); o.xp=int0(o.xp); o.total=int0(o.total); if(typeof o.kd!=='string') o.kd=''; o.kx=int0(o.kx);
  if(o.lvl>=DATA.maxLevel) o.xp=0; else o.xp=Math.min(o.xp,need(o.lvl)-1);
  return o;
}
const need=lvl=>lvl>=DATA.maxLevel?0:Math.max(1,int0(DATA.xpToNext[clamp(lvl,1,DATA.maxLevel-1)-1]));
const level=S=>ensure(S).lvl;
function progress(S){ const o=ensure(S), n=need(o.lvl); return {lvl:o.lvl,xp:o.xp,need:n,frac:n?o.xp/n:1,max:o.lvl>=DATA.maxLevel}; }

/* soma XP e sobe de nível quantas vezes der. Devolve {gained, levels, from, to, unlocked:[funções novas]} */
/* teto diário da XP de abate (v9): devolve quanto de n entra hoje. Estado: o.kd (dia), o.kx (XP de abate BRUTA do dia). */
const dayKeyOf=host=>{ const t=num(host&&host.now&&host.now(),Date.now()), C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(t); const d=new Date(t); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
function killCredit(S,host,n){ const K=DATA.v9.kill, o=ensure(S), dk=dayKeyOf(host); if(o.kd!==dk){ o.kd=dk; o.kx=0; }
  const t=num(K.T[clamp(eraMaxOf(host),0,K.T.length-1)],K.T[K.T.length-1])*vipXp(S), f=x=>Math.min(x,t)+K.mid*Math.max(0,Math.min(x,2*t)-t)+K.over*Math.max(0,x-2*t);
  const a=f(o.kx), b=f(o.kx+n); o.kx+=n; return Math.round(b-a); }
/* quanto ainda entra cheio hoje (para a tela: "XP de abate cheia até ...") */
function killCap(S,host){ if(!V9()) return {on:false}; const K=DATA.v9.kill, o=ensure(S), dk=dayKeyOf(host), raw=o.kd===dk?o.kx:0;
  const t=Math.round(num(K.T[clamp(eraMaxOf(host),0,K.T.length-1)],0)*vipXp(S)); return {on:true,full:t,used:raw,left:Math.max(0,t-raw),rate:raw<t?1:raw<2*t?K.mid:K.over}; }
/* src = 'kill' para a XP dos orbes de abate (passa pelo teto diário no v9); qualquer outro valor (ou nenhum) não tem teto */
function addXp(S,n,host,src){
  let k0=int0(n); if(V9()&&src==='kill'&&k0) k0=killCredit(S,host,k0);
  const k=k0, o=ensure(S), from=o.lvl; if(!k||o.lvl>=DATA.maxLevel) return {gained:0,levels:0,from,to:from,unlocked:[]};
  o.total+=k; o.xp+=k;
  while(o.lvl<DATA.maxLevel&&o.xp>=need(o.lvl)){ o.xp-=need(o.lvl); o.lvl++; }
  if(o.lvl>=DATA.maxLevel) o.xp=0;
  const unlocked=Object.keys(DATA.unlock).filter(f=>f!=='pet'&&DATA.unlock[f]>from&&DATA.unlock[f]<=o.lvl);
  if(o.lvl>from&&host&&host.toast) host.toast(`Nível ${o.lvl}!${unlocked.length?' Liberou: '+unlocked.map(f=>DATA.unlockName[f]||f).join(', '):''}`);
  return {gained:k,levels:o.lvl-from,from,to:o.lvl,unlocked};
}
const eraMul=host=>1+DATA.xp.eraScale*eraMaxOf(host);
/* VIP: +xpPct nas fontes de XP DESTE módulo (instância, missão, bônus diário, offline) e offlineMult no offline. Os orbes de abate são da fps-30. */
const vipXp=S=>{ const V=root.Sys&&root.Sys.vip; let p=null; try{ p=V&&V.perks?V.perks(S):null; }catch(e){ p=null; } return 1+num(p&&p.xpPct,0)/100; };
const vipOff=S=>{ const V=root.Sys&&root.Sys.vip; let p=null; try{ p=V&&V.perks?V.perks(S):null; }catch(e){ p=null; } return Math.max(1,num(p&&p.offlineMult,1)); };
/* eventos: onOffline, onInstance (o Sys.instances já chama), onMission. XP de abate: o Sys.loot entrega por addXp.
   onKill está OBSOLETO: não dá XP (fica só para uma chamada antiga não quebrar nem dar XP em dobro). */
function onKill(S){ ensure(S); return {gained:0,levels:0,from:level(S),to:level(S),unlocked:[],obsolete:true}; }
function onOffline(S,host,sec){ const h=clamp(num(sec,0),0,DATA.xp.offlineCapHours*3600)/3600; return addXp(S,Math.floor(h*DATA.xp.offlinePerHour*eraMul(host)*vipXp(S)*(V9()?1:vipOff(S))),host); }
// mult = multiplicador da dificuldade da instância (Fácil 1 · Normal 1,6 · Difícil 2,5, o mesmo das outras recompensas; o Sys.instances passa)
const onInstance=(S,host,mult)=>addXp(S,Math.round(DATA.xp.instance*eraMul(host)*(typeof mult==='number'&&isFinite(mult)&&mult>0?mult:1)*vipXp(S)),host);
const onMission=(S,host)=>addXp(S,Math.round(DATA.xp.mission*eraMul(host)*vipXp(S)),host);
/* bônus de XP por concluir TODAS as missões do dia (v6: 50 × (1+era)) */
const onDailyBonus=(S,host)=>addXp(S,Math.round(DATA.xp.dailyBonus*eraMul(host)*vipXp(S)),host);

/* desbloqueios. Sem Sys.level carregado, os outros módulos tratam tudo como liberado. */
const unlockKey=f=>(DATA.alias&&DATA.alias[f])||f;
const unlockLevel=f=>num(DATA.unlock[unlockKey(f)],1);
const isUnlocked=(S,f)=>level(S)>=unlockLevel(f);
function nextUnlock(S){ const l=level(S); let best=null; for(const f in DATA.unlock){ if(f==='pet') continue; const u=DATA.unlock[f]; if(u>l&&(!best||u<best.level)) best={feature:f,name:DATA.unlockName[f]||f,level:u}; } return best; }
/* portão de raridade de ovo: maior raridade permitida (<= r) para o nível e a era atuais.
   Fonte única: Sys.loot.capEggR (fps-30, DATA.gates). DATA.eggGate daqui é só a reserva para quando o Sys.loot não estiver carregado. */
function eggMaxR(S,host,r){
  const LO=root.Sys&&root.Sys.loot;
  if(LO&&typeof LO.capEggR==='function'){ const h=Object.assign({},host,{level:()=>level(S)}); return clamp(int0(LO.capEggR(h,r)),0,int0(r)); }
  const l=level(S), e=eraMaxOf(host); let x=int0(r);
  while(x>0){ const g=DATA.eggGate[x]; if(!g||(l>=g.level&&e>=g.era)) break; x--; } return x; }

function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S) return b;
  const v=Math.round(level(S)*DATA.statPerLevel*1e6)/1e6; b.atkPct=v; b.hpPct=v; return b; }
const hud=S=>{ const p=progress(S); return {text:`Nv. ${p.lvl}`,frac:p.frac,max:p.max}; };

/* ESTÁGIO DO KAEL (v9; desligado = sempre o garoto). {on, stage 0..3, id, name, next:{stage,id,name,lvl,fc,needLvl,needFc}|null, ready}.
   Sobe quando nível E FC fecham; nunca desce (S.sys.level.stg). ready = pode evoluir AGORA (a tela toca a animação e chama evolve). Só visual. */
const fcOf=(S,host)=>{ const F=root.Sys&&root.Sys.fc; try{ return F&&F.compute?num(F.compute(S,host),0):0; }catch(e){ return 0; } };
function stage(S,host){ const o=ensure(S), T=DATA.v9.stages; if(!V9()) return {on:false,stage:0,id:T[0].id,name:T[0].name,next:null,ready:false};
  const st=clamp(int0(o.stg),0,T.length-1), nx=T[st+1]||null, fc=nx?fcOf(S,host):0, lv=level(S);
  return {on:true,stage:st,id:T[st].id,name:T[st].name,ready:!!nx&&lv>=nx.lvl&&fc>=nx.fc,
    next:nx?{stage:st+1,id:nx.id,name:nx.name,lvl:nx.lvl,fc:nx.fc,needLvl:Math.max(0,nx.lvl-lv),needFc:Math.max(0,Math.ceil(nx.fc-fc))}:null}; }
function evolve(S,host){ const s0=stage(S,host); if(!s0.ready) return {ok:false,reason:s0.on?'need':'off',stage:s0.stage}; ensure(S).stg=s0.stage+1; return {ok:true,from:s0.stage,stage:s0.stage+1}; }
const API={DATA,setV9,setCap120,killCap,stage,evolve,ensure,need,level,progress,addXp,onKill,onOffline,onInstance,onMission,onDailyBonus,unlockLevel,unlockKey,isUnlocked,nextUnlock,eggMaxR,bonus,hud};
root.Sys=root.Sys||{}; root.Sys.level=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
