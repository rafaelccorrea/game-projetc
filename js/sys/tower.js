/* Eonbound — Sys.tower: torre de andares infinitos. Cada andar tem FC FIXA e crescente (não escala com o jogador);
   o adversário é um "fantasma" (nome e skin sorteados com semente pelo andar) ou, a cada bossEvery andares, um chefe.
   Luta resolvida por simulação determinística com semente. Só a DERROTA gasta tentativa (lossesPerDay por dia).
   Lógica pura + render opcional. Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-tower.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  label:'Torre', icon:'🗼',
  // FC do andar por âncoras (docs/balance.json v7.1 "tower"): o andar 15·(k+1) = FC mediana do grátis no fim da era k.
  // Interpolação geométrica entre âncoras; depois da última, o crescimento do último trecho continua.
  anchors:[[1,150],[15,1440],[30,12300],[45,395000],[60,13900000],[75,829000000],[90,34300000000],[105,1540000000000]],   // v7.1 (simulador no ritmo real da build)
  bossEvery:10, bossFcMult:1.3,     // chefe a cada 10 andares (dono, confirmado via PO; era 5), com +30% de FC sobre a curva
  lossesPerDay:3,   // dono (13/11): grátis 3 derrotas/dia; VIP soma (+1 no VIP 5, +2 no VIP 10: Sys.vip.conv towerAdd)
  perFloor:{atkPct:0.2, hpPct:0.2}, // bônus permanente por andar vencido (melhor andar)
  // chefe a cada 10 (metade dos chefes): o prêmio POR CHEFE dobrou para o total da torre ficar igual (até o andar 105: 185 → 295 💎 e
  // 18 → 36 pedras de forja, como era com chefe a cada 5). bossGems = 10 + andar/5; forja = 4 por chefe a partir do 20.
  reward:{goldMult:20, goldPerFloor:0.015, goldCapK:60,   // era 0,03 sem teto (andar 135 = 101 abates); 0,015 e teto de 60 abates de ouro por andar (dono aprovou 14/11; docs/ECONOMIA_OURO.md §6: X = 5 min de abate = 120 × goldUnit por resgate)
           stones:1, stonesPer:5, bossGems:10, bossGemsPer:5,
          forgeFrom:20, forgeOnBoss:4},
  // pets (balance v5.1 "pet"): 1 ovo a cada 10 andares até o 100 (mínimo Raro até o 40, Épico de 50 a 90, pesos do chefe de fase);
  // andar 100: com a 17b, ovo Épico à escolha (Dragão/Papagaio); sem ela, a fênix antiga. Depois, 1 fragmento DESSE pet por andar do 101 ao 110 e 1 a cada 10.
  pet:{eggEvery:10, eggWeights:[50,32,13,5,0], minR:[[40,1],[90,2]], phoenixAt:100, fragEach:[101,110], fragEvery:10},
  milestones:[10,25,50,100], milestoneEvery:50, milestoneGems:20,   // depois de 100: a cada 50
  // luta com os 6 atributos (regras novas). Pesos e curva da DEF: os do Sys.fc / Sys.stats quando carregados (função ÚNICA de FC);
  // estes são só a reserva com os mesmos valores.
  duel:{maxRounds:40, baseCrit:12, baseCritDmg:100, wAtk:5, wHp:1, wDef:5, defK:2, maxDefRed:0.75},   // reserva = Sys.stats v7.1
  ghostDef:{per:0.002, max:0.3},    // parte da vida do fantasma que vem da DEF: sobe 0,2 ponto por andar, até 30%
  names:{pre:['Sombra','Eco','Espectro','Reflexo','Fantasma','Vulto'],
         who:['Aurora','Kael','Tupã','Ícaro','Nara','Brutus','Yara','Odin','Zéfiro','Iara','Ragnar','Selene','Cauã','Hera','Tita','Bento']},
  bosses:['Guardião de Pedra','Colosso de Bronze','Cavaleiro Negro','Capitão Pólvora','Titã a Vapor','Comandante de Aço','Sentinela do Vazio'],
  // era da skin do fantasma sobe a cada 15 andares; raridade sorteada entre as que EXISTEM no lançamento
  // (arma Mítica r3 fora até a atualização; a roupa mantém as 5)
  skin:{eraEvery:15, eras:7, weaponR:[0,1,2,4], armorR:[0,1,2,3,4]},
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fcV=n=>{ const F=root.Sys&&root.Sys.fc; return F&&F.viewText?F.viewText(n):fmt(n); };   // FC na escala de exibição (Sys.fc.DATA.viewOn)
function fmt(n){ n=num(n,0); return n>=1e12?(n/1e12).toFixed(1)+'T':n>=1e9?(n/1e9).toFixed(1)+'B':n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'k':String(Math.floor(n)); }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const CLK=()=>{ const C=root.Sys&&root.Sys.clock; return C&&typeof C.dayKey==='function'?C:null; };   // fuso único (Brasília com servidor): Sys.clock da fps-30
function dayKey(ms){ const C=CLK(); if(C) return C.dayKey(ms); const d=new Date(ms); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(){ let h=2166136261; for(const x of arguments){ const s=String(x); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } h^=124; } return h>>>0; }

function ensure(S,host){
  if(!S||typeof S!=='object') throw new Error('Sys.tower.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.tower; if(!o||typeof o!=='object') o=S.sys.tower={};
  o.v=1; o.best=int0(o.best); o.points=int0(o.points); o.fights=int0(o.fights);
  const maxL=DATA.lossesPerDay+vipAdd(S,'towerAdd'); o.lossesLeft=clamp(int0(num(o.lossesLeft,maxL)),0,maxL);
  if(typeof o.day!=='string') o.day='';
  if(!o.last||typeof o.last!=='object') o.last=null;
  if(host){ const k=dayKey(nowOf(host)); if(o.day!==k){ o.day=k; o.lossesLeft=DATA.lossesPerDay+vipAdd(S,'towerAdd'); } }   // virada de dia (+ VIP de conveniência)
  return o;
}
const nextFloor=S=>ensure(S).best+1;
const isBoss=f=>f>0&&f%DATA.bossEvery===0;
/* FC da âncora no andar f (sem o extra de chefe): interpolação geométrica entre âncoras; acima da última, segue o último trecho */
function anchorFC(f){
  const A=DATA.anchors; f=Math.max(1,int0(f));
  for(let i=1;i<A.length;i++){ const [f0,v0]=A[i-1],[f1,v1]=A[i]; if(f<=f1) return v0*Math.pow(v1/v0,(f-f0)/(f1-f0)); }
  const [f0,v0]=A[A.length-2],[f1,v1]=A[A.length-1]; return v1*Math.pow(Math.pow(v1/v0,1/(f1-f0)),f-f1);
}
/* Com chefe a cada 10, os andares-âncora (15, 30, ..., 105) não são todos de chefe. A curva passa a ser a FC do andar COMUM, e o chefe
   fica bossFcMult (×1,3) ACIMA dela. O mediano no fim da era k ainda enfrenta o andar 15·(k+1) com FC igual à dele ("Equilibrado",
   hipótese da simulação); se esse andar for de chefe (30, 60, 90), ele é a parede 30% acima. (Antes, com chefe a cada 5, todo andar-âncora era
   chefe e os comuns ficavam 1,3x abaixo da curva: os comuns ficaram 30% mais duros, o ritmo nas âncoras é o mesmo.) */
const floorFC=f=>Math.round(anchorFC(f)*(isBoss(Math.max(1,int0(f)))?DATA.bossFcMult:1));
function isMilestone(f){ return DATA.milestones.includes(f)||(f>DATA.milestones[DATA.milestones.length-1]&&f%DATA.milestoneEvery===0); }
function nextMilestone(f){ for(const m of DATA.milestones) if(m>=f) return m; return Math.ceil(f/DATA.milestoneEvery)*DATA.milestoneEvery; }

/* pesos da FC: os do Sys.fc (fonte única); reserva: DATA.duel */
const W=()=>{ const F=root.Sys&&root.Sys.fc&&root.Sys.fc.DATA, D=DATA.duel; return {wAtk:F?F.wAtk:D.wAtk, wHp:F?F.wHp:D.wHp, wDef:F&&F.wDef!=null?F.wDef:D.wDef}; };
/* FC -> atributos do fantasma: metade da FC no ataque, metade na vida (parte dela em DEF) */
function statsFromFC(fc,defShare){ const D=DATA.duel, w=W(), cr=D.baseCrit, cd=D.baseCritDmg;
  const aPart=fc*0.5, hPart=fc*0.5, ds=clamp(num(defShare,0),0,0.9);
  return {atk:aPart/(w.wAtk*(1+cr/100*cd/100)), hp:hPart*(1-ds)/w.wHp, def:hPart*ds/w.wDef, critRate:cr, critDmg:cd, aspd:0}; }
/* ADVERSÁRIO JUSTO: uma "cópia" do jogador escalada até a FC alvo (mesmas proporções de ATK, vida, DEF, crítico e velocidade).
   Motivo: a luta depende do produto ATK × vida, e a FC SOMA as partes; um fantasma meio a meio (statsFromFC) vence quase sempre um
   jogador com a mesma FC, porque o jogador real pesa mais na vida (medido: 2% de vitória com FC igual). Com a cópia escalada,
   a chance depende só da razão de FC (FC igual ≈ metade das lutas). k escala ATK, vida e DEF (a FC é linear neles). */
function scaledFoe(me,fc){ const k=Math.max(1e-9,num(fc,0))/Math.max(1,num(me&&me.fc,1));
  return {atk:num(me.atk,0)*k, hp:num(me.hp,0)*k, def:num(me.def,0)*k, critRate:num(me.critRate,DATA.duel.baseCrit), critDmg:num(me.critDmg,DATA.duel.baseCritDmg), aspd:num(me.aspd,0), fc:Math.round(num(fc,0))}; }
/* a MESMA FC do jogo (Sys.fc.fcOfStats); reserva com a mesma fórmula */
function fcOfStats(s){ const F=root.Sys&&root.Sys.fc; if(F&&typeof F.fcOfStats==='function') return F.fcOfStats(s);
  const w=W(); return Math.round(num(s.atk,0)*w.wAtk*(1+num(s.critRate,0)/100*num(s.critDmg,100)/100)*(1+num(s.aspd,0)/100)+num(s.hp,0)*w.wHp+num(s.def,0)*w.wDef); }
const defRed=(def,atk)=>{ const T=root.Sys&&root.Sys.stats; if(T&&T.defReduction) return T.defReduction(def,atk);
  const D=DATA.duel, d=Math.max(0,num(def,0)); return Math.min(D.maxDefRed,d/(d+D.defK*Math.max(1e-9,num(atk,0)))); };

/* adversário do andar f (determinístico: mesmo andar = mesmo adversário) */
function opponent(f){
  f=Math.max(1,int0(f)); const rng=mulberry(hash('tower',f)), boss=isBoss(f), fc=floorFC(f), G=DATA.ghostDef;
  const st=statsFromFC(fc,Math.min(G.max*(boss?1.2:1),f*G.per*(boss?1.5:1))), N=DATA.names, K=DATA.skin, e=clamp(Math.floor((f-1)/K.eraEvery),0,K.eras-1);
  const pick=(list,u)=>list[clamp(Math.floor(u*list.length*Math.min(1,0.35+f/120)),0,list.length-1)];   // raridade sobe com o andar
  const wr=pick(K.weaponR,rng()), ar=pick(K.armorR,rng());
  const name=boss?DATA.bosses[Math.floor(f/DATA.bossEvery-1)%DATA.bosses.length]:`${N.pre[Math.floor(rng()*N.pre.length)]} de ${N.who[Math.floor(rng()*N.who.length)]}`;
  return {floor:f,kind:boss?'boss':'ghost',name,skin:{weapon:`w${e}${wr}`,armor:`a${e}${ar}`},fc,...st};
}
/* atributos do jogador: Sys.fc.stats (todos os bônus e os 7 espaços). O pet luta junto: golpe próprio no ATK, cura no HP (o vínculo já está no HP). */
function playerStats(S,host){
  const F=root.Sys&&root.Sys.fc;
  if(F&&typeof F.stats==='function'){ const s=F.stats(S,host), p=s.pet||{atk:0,heal:0};
    return {atk:s.atk*(1+num(p.atk,0)),hp:s.hp*(1+num(p.heal,0)),def:num(s.def,0),critRate:num(s.critRate,num(s.crit,DATA.duel.baseCrit)),critDmg:num(s.critDmg,DATA.duel.baseCritDmg),aspd:num(s.aspd,0),fc:F.fcOfStats(s)}; }
  const s={atk:Math.max(0,num(host&&host.atk&&host.atk(),0)),hp:Math.max(0,num(host&&host.hp&&host.hp(),0)),def:0,critRate:DATA.duel.baseCrit,critDmg:DATA.duel.baseCritDmg,aspd:0};
  s.fc=fcOfStats(s); return s;
}

/* luta automática, alternada, A começa. Golpe = ATK × (1 + vel. ataque) × (1 + dano crít, se critar) × (1 − redução da DEF do alvo).
   Empate por tempo (maxRounds) = derrota de A. Determinística pela semente. */
function duel(A,B,seed,hpA0,hpB0){
  const D=DATA.duel, rng=mulberry(seed>>>0), max=[Math.max(1,A.hp),Math.max(1,B.hp)], P=[A,B], log=[]; let r=0, w=-1;
  const hp=[hpA0!=null?clamp(num(hpA0,max[0]),1,max[0]):max[0], hpB0!=null?clamp(num(hpB0,max[1]),1,max[1]):max[1]];   // vida inicial (rei da colina)
  for(r=1;r<=D.maxRounds&&w<0;r++) for(let s=0;s<2&&w<0;s++){ const a=P[s], d=P[1-s], crit=rng()*100<clamp(num(a.critRate,num(a.crit,0)),0,100);
    const dmg=Math.max(0,num(a.atk,0))*(1+Math.max(0,num(a.aspd,0))/100)*(crit?1+num(a.critDmg,D.baseCritDmg)/100:1)*(0.9+rng()*0.2)*(1-defRed(d.def,a.atk));
    hp[1-s]-=dmg; if(log.length<80) log.push({s,dmg,crit,hp:Math.max(0,hp[1-s])}); if(hp[1-s]<=0) w=s; }
  return {win:w===0,rounds:Math.min(r-1,D.maxRounds),hpA:Math.max(0,hp[0])/max[0],hpB:Math.max(0,hp[1])/max[1],hpLeftA:Math.max(0,hp[0]),hpLeftB:Math.max(0,hp[1]),log,timeout:w<0};
}
/* REI DA COLINA (torneio das guildas, servidor e jogo): o mesmo duelo, começando com a vida que sobrou do anterior. hpA0/hpB0 em vida ABSOLUTA
   (padrão: cheia). {win, hpLeftA, hpLeftB (absolutas), hpA, hpB (frações), log, timeout}. timeout = empate no tempo (quem decide é a regra do torneio). */
const duelCarry=(A,B,seed,hpA0,hpB0)=>duel(A,B,seed,hpA0,hpB0);
/* texto de dificuldade pela razão de FC */
/* rótulo pela razão de FC (jogador / adversário), calibrado na taxa de vitória MEDIDA com o adversário-cópia (scaledFoe):
   ≥ 1,05 vence ~99% (Fácil) · 0,97-1,05 ~20-90% (Equilibrado) · 0,9-0,97 ~0-20% (Difícil) · < 0,9 ~0% (Muito difícil). A luta varia pouco: 10% de FC decide. */
function difficulty(pfc,ofc){ const k=ofc>0?pfc/ofc:9; return k>=1.05?{id:'easy',txt:'Fácil'}:k>=0.97?{id:'even',txt:'Equilibrado'}:k>=0.9?{id:'hard',txt:'Difícil'}:{id:'nope',txt:'Muito difícil'}; }

/* Revisão 5: fragmentos do Prismático na torre (tabela única Sys.pet.DATA.v4d.prism.tower; só com a v4 da pet ligada) */
function prismAt(f){ const P=root.Sys&&root.Sys.pet; if(!P||P.DATA.v4!==true||P.DATA.v3!==true) return 0; const T=P.DATA.v4d.prism.tower; return f>T.from&&(f-T.from)%T.every===0?T.frags:0; }
function rewardsFor(f,host,S){   // S opcional: com ele, t100Pet diz o pet já escolhido no andar 100
  const R=DATA.reward, unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1));
  const P=DATA.pet, egg=f<P.phoenixAt&&f%P.eggEvery===0, minR=egg?(P.minR.find(([upTo])=>f<=upTo)||[0,2])[1]:0;
  const frag=f>P.phoenixAt&&((f>=P.fragEach[0]&&f<=P.fragEach[1])||f%P.fragEvery===0)?1:0;
  return {gold:Math.round(unit*Math.min(R.goldCapK||Infinity,R.goldMult*(1+R.goldPerFloor*f))), stones:R.stones+Math.floor(f/R.stonesPer),
    gems:(isBoss(f)?R.bossGems+Math.floor(f/R.bossGemsPer):0)+(isMilestone(f)?DATA.milestoneGems:0),
    forge:f>=R.forgeFrom&&isBoss(f)?R.forgeOnBoss:0,
    // andar 100: ovo ÉPICO À ESCOLHA (17b, PO: a fênix saiu) — {r:2, source:'tower100', choice:['drake','parrot']}; sem a 17b, a fênix antiga.
    // Exceção ao portão de raridade (source:'tower100'); os outros ovos respeitam o portão
    egg:f===P.phoenixAt?t100Egg():egg?{weights:P.eggWeights,minR}:null,
    // Revisão 4 (Sys.pet.DATA.v4): 5 fragmentos do Prismático a cada 25 andares acima do 105 (130, 155, ...)
    prismFrags:prismAt(f),
    // fragmentos do pet do andar 100 acima dele: com a 17b vão para o pet ESCOLHIDO (t100Pet; '' = escolha pendente, guardados no ovo à escolha)
    t100Frags:frag, t100Pet:V17()?t100Pet(S):'phoenix',
    phoenixFrags:V17()?0:frag};   // nome antigo (só sem a 17b)
}
const PETM=()=>root.Sys&&root.Sys.pet;
const V17=()=>{ const P=PETM(); return !!(P&&P.DATA&&P.DATA.v17&&P.DATA.v17.on===true&&P.DATA.v3===true); };
const t100Egg=()=>V17()?{r:2,source:'tower100',choice:PETM().DATA.v17.tower100.slice()}:{r:4,source:'tower100',pet:'phoenix'};
const t100Pet=S=>{ try{ return S&&PETM()?PETM().ensure(S).t100||'':''; }catch(e){ return ''; } };
/* entrega cada prêmio pelo módulo dono; se o módulo não estiver carregado, zera o campo (a tela não promete o que não entrega) */
const vipAdd=(S,k)=>{ const V=root.Sys&&root.Sys.vip; try{ return V&&V.conv?Math.max(0,Math.floor(+V.conv(S)[k]||0)):0; }catch(e){ return 0; } };   // VIP de conveniência (Sys.vip.conv)
const ND=(S,host,src,ctx)=>{ const N=root.Sys&&root.Sys.newDrops; try{ return N&&N.grant?N.grant(S,host,src,ctx):null; }catch(e){ return null; } };   // itens novos (Sys.newDrops, chave própria)
function grantRewards(S,host,rw){
  const sys=root.Sys||{};
  if(rw.gold&&host.addGold) host.addGold(rw.gold); if(rw.gems&&host.addGems) host.addGems(rw.gems);
  if(rw.stones){ if(sys.practice&&sys.practice.addStones) sys.practice.addStones(S,rw.stones,host); else rw.stones=0; }
  if(rw.forge){ if(sys.forge&&sys.forge.addStones) sys.forge.addStones(S,rw.forge,host); else rw.forge=0; }
  if(rw.egg){ if(sys.pet&&sys.pet.addEgg) rw.hatched=sys.pet.addEgg(S,host,rw.egg); else rw.egg=null; }
  if(rw.prismFrags){ if(sys.pet&&sys.pet.addFragments) rw.prism=sys.pet.addFragments(S,'prism',rw.prismFrags,host); else rw.prismFrags=0; }
  const tf=rw.phoenixFrags||(V17()?rw.t100Frags:0);   // com a 17b, o Sys.pet manda 'phoenix' para o pet escolhido (ou guarda no ovo à escolha)
  if(tf){ if(sys.pet&&sys.pet.addFragments) rw.t100=rw.phoenix=sys.pet.addFragments(S,'phoenix',tf,host); else { rw.phoenixFrags=0; rw.t100Frags=0; } }
  return rw;
}
/* desbloqueio pelo nível do jogador (Sys.level); sem o Sys.level carregado, fica liberado */
const LV=()=>root.Sys&&root.Sys.level;
const locked=S=>{ const L=LV(); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'tower')); };
const lockLevel=()=>{ const L=LV(); return L&&L.unlockLevel?L.unlockLevel('tower'):1; };
const LOCK='<svg class="sys-lock-ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15.4" r="1.6" fill="#0008"/></svg>';   // cadeado desenhado (sem emoji, pedido do PO)
/* desafia o próximo andar. {ok, reason:'tries', win, floor, opp, duel, rewards} */
function fight(S,host){
  const o=ensure(S,host), f=o.best+1;
  if(locked(S)) return {ok:false,reason:'locked',floor:f,level:lockLevel()};
  if(o.lossesLeft<=0) return {ok:false,reason:'tries',floor:f};
  const opp=opponent(f), me=playerStats(S,host), d=duel(me,scaledFoe(me,opp.fc),hash('fight',f,o.fights)); o.fights++;
  const res={ok:true,win:d.win,floor:f,opp,me,duel:d,rewards:null};
  if(d.win){ o.best=f; o.points+=f; res.rewards=grantRewards(S,host,rewardsFor(f,host,S)); res.newDrops=ND(S,host,'tower:floor',{floor:f});
    const T=root.Sys&&root.Sys.titles; if(T&&T.check) T.check(S,host);
  } else o.lossesLeft--;
  o.last={floor:f,win:d.win,rounds:d.rounds,hp:Math.round((d.win?d.hpA:d.hpB)*100),ts:nowOf(host),name:opp.name};
  return res;
}
const onDayChange=(S,host)=>ensure(S,host);

function bonus(S){ const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S) return b; const o=ensure(S);
  for(const k in DATA.perFloor) b[k]+=o.best*DATA.perFloor[k]; return b; }
function advice(S,host){ const o=ensure(S,host), f=o.best+1, me=playerStats(S,host), ofc=floorFC(f);
  const dif=difficulty(me.fc,ofc);
  return [{id:'tower.next',icon:'🗼',label:`Torre: andar ${f} (${dif.txt.toLowerCase()})`,delta:{...DATA.perFloor},cost:`${o.lossesLeft}/${DATA.lossesPerDay+vipAdd(S,'towerAdd')} tentativas`,
    ready:o.lossesLeft>0&&(dif.id==='easy'||dif.id==='even'),tab:'tower'}]; }

/* ---------------- UI (opcional) ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{};
  if(locked(S)){ el.innerHTML=`<div class="sys-tow"><div class="sys-card sys-lock">${LOCK}<b>Torre</b><span>Libera no nível ${lockLevel()}</span></div></div>`; el.onclick=null; return; }
  const o=ensure(S,host), f=o.best+1, opp=opponent(f), me=playerStats(S,host), dif=difficulty(me.fc,opp.fc), rw=rewardsFor(f,host,S), ms=nextMilestone(f);
  const L=o.last, msg=el.__sysTowMsg||'', SYS=root.Sys||{};
  el.innerHTML=`<div class="sys-tow">
    <div class="sys-tow-top"><span>🗼 Melhor: <b>${o.best}</b></span><span>Bônus: +${(o.best*DATA.perFloor.atkPct).toFixed(1).replace('.',',')}% ATK/HP</span></div>
    <div class="sys-card sys-tow-opp ${opp.kind}">
      <div class="sys-tow-fl">Andar <b>${f}</b>${opp.kind==='boss'?' · CHEFE':''}</div>
      <div class="sys-tow-nm">${opp.kind==='boss'?'👑':'👻'} ${esc(opp.name)}</div>
      <div class="sys-tow-vs"><span>Você<br><b>${fcV(me.fc)}</b></span><span class="sys-tow-x">VS</span><span>FC<br><b>${fcV(opp.fc)}</b></span></div>
      <div class="sys-tow-dif ${dif.id}">${dif.txt}</div>
      <div class="sys-tow-rw">Prêmio: 🪙${fmt(rw.gold)}${rw.stones&&SYS.practice?` · 🪨${rw.stones}`:''}${rw.forge&&SYS.forge?` · 🔨${rw.forge}`:''}${rw.gems?` · 💎${rw.gems}`:''}${
        rw.egg&&SYS.pet?(rw.egg.choice?' · 🥚 ovo Épico à escolha':rw.egg.r===4?' · 🥚 FÊNIX':' · 🥚 ovo de pet'):''}${rw.phoenixFrags&&SYS.pet?` · 🔥${rw.phoenixFrags} fragmento de fênix`:''}${!rw.phoenixFrags&&rw.t100Frags&&SYS.pet?` · ${rw.t100Frags} fragmento ${rw.t100Pet?'do '+((SYS.pet.DATA.pets.find(x=>x.id===rw.t100Pet)||{}).name||'pet'):'do pet do andar 100'}`:''}</div>
    </div>
    <button class="sys-btn sys-tow-go" ${o.lossesLeft>0?'':'disabled'}>${o.lossesLeft>0?'Desafiar':'Sem tentativas hoje'}</button>
    <div class="sys-tow-info">Tentativas: <b>${o.lossesLeft}/${DATA.lossesPerDay}</b> (só a derrota gasta) · Marco: andar ${ms}</div>
    <div class="sys-tow-last">${esc(msg)||(L?`Último: andar ${L.floor} ${L.win?'vencido':'perdido'} contra ${esc(L.name)} em ${L.rounds} rodadas`:'')}</div>
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    const r=fight(S,host); if(!r.ok) return;
    const rw=r.rewards||{}, h=rw.hatched;
    el.__sysTowMsg=r.win?`Andar ${r.floor} vencido!${rw.gems?` +${rw.gems} diamantes`:''}${h?(h.isNew?` Novo pet: ${h.name}!`:` ${h.name} repetido: +${h.frags} fragmentos`):''}`
      :`Derrota no andar ${r.floor} (inimigo com ${Math.round(r.duel.hpB*100)}% de vida)`;
    if(host&&host.toast) host.toast(el.__sysTowMsg); changed(host); render(el,S,host,opt); };
}

const API={DATA,ensure,nextFloor,isBoss,floorFC,isMilestone,nextMilestone,opponent,playerStats,duel,duelCarry,difficulty,statsFromFC,fcOfStats,scaledFoe,rewardsFor,grantRewards,fight,onDayChange,bonus,advice,render,_hash:hash,_dayKey:dayKey};
root.Sys=root.Sys||{}; root.Sys.tower=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
