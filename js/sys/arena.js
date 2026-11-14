/* Eonbound — Sys.arena: ARENA (duelo assíncrono contra a "cópia" de outros jogadores) e a FONTE do RANKING semanal (tela 12).
   Por ora os adversários são BOTS locais gerados pela FC do jogador (±10% na lista de luta), atrás de um PROVIDER trocável
   (listOpponents / fight / getRanking / weekInfo): quando houver servidor, troca-se só o provider (Sys.arena.setProvider).
   LUTA AUTORITATIVA: quem decide a luta é provider.fight(S, host, opp) → {win, delta, seed, log?}. O local calcula aqui (Sys.tower.duel com seed);
   o servidor (POST /arena/fight, docs/API_SERVIDOR.md §4) roda o MESMO js/sys no Node e devolve o resultado; o cliente só anima.
   reportResult continua no local (não faz nada) para um provider antigo não quebrar.
   - 5 lutas por dia (vitória ou derrota gastam). 3 adversários por vez; 1 troca grátis por dia.
   - Pontos: começam em 1000 na semana; vitória +winBase·k, derrota −lossBase·k, k = clamp(FC do adversário / FC do jogador, 0,5, 2).
   - Virada semanal (segunda 00:00, hora local; no servidor, um fuso fixo): guarda a posição final e zera os pontos.
   - PRÊMIOS por faixa prontos em DATA.rewards, mas DESLIGADOS contra bots (DATA.rewardsVsBots = false: regra do PO para o ranking,
     "prêmios valem quando o ranking online abrir"; também evita o farm do 1º lugar contra bots). Ligar = uma linha.
   - Ranking de FC (tela 12): a FC do jogador é a MAIOR da semana (Sys.fc.weekMax / record); bots FIXOS na semana, em volta dela.
   Luta: a MESMA do jogo (Sys.tower.duel com a FC única do Sys.fc). Lógica pura, sem DOM. Relatório: reports/sys-e2-api.md */
(function(root){
'use strict';
const DATA={
  label:'Arena', icon:'⚔️',
  attemptsPerDay:3,   // dono (13/11): grátis 3; VIP soma (+2 no VIP 4, +3 no VIP 8: Sys.vip.conv arenaAdd)
  opponentsShown:3, refreshPerDay:1,
  startPoints:1000, winBase:20, lossBase:10, kRange:[0.5,2], minPoints:0,
  oppSpread:0.10,
  /* PRÊMIO POR LUTA (PO, 13/11, dentro da curva de 180 dias): moedas sempre (× ouro de um abate da fase), 1 gema na 1ª VITÓRIA do dia (≤ ~180 no
     total, cabe nos ~10 mil), 1 baú de toque (Sys.chest, respeita o teto diário dele) ao completar as 3 lutas do dia. O prêmio da liga continua no fim da semana. */
  fightRewards:{goldkWin:40, goldkLoss:20, gemsFirstWin:1, chestAt:3},
  /* LUTA PvP (tela 23): mesmo dano médio do Sys.tower.duel, dividido em golpe do herói (k:'hit') e do pet (k:'pet', a cada 2 golpes, com a parte de ATQ
     que o pet dá); ULTIMATE de verdade (k:'ult'): energia +25 por golpe dado e +10 por golpe levado, cheia em 100 = próximo golpe do herói ×3.
     Os dois lados têm as mesmas regras (adversário = cópia na FC dele), então a luta continua justa. O Servidor precisa da MESMA conta (game-rules.ts). */
  pvp:{petEvery:2, enHit:25, enHurt:10, enFull:100, ultMult:3, maxRounds:40, logMax:200},
  /* APARÊNCIA DOS ROBÔS pelo NÍVEL (PO): a pé abaixo do 38; pet a partir do 20; asa do 50; aura do 30. Jogador real usa a aparência real (Servidor). */
  botLook:{mountFrom:38, petFrom:20, wingFrom:50, auraFrom:30, levelSpread:2},                       // adversários da lista: FC do jogador ±10% (pedido do PO)
  bots:{count:49, spread:0.4, weekGain:[60,420]},   // ranking: 49 bots + o jogador; FC ±40% e pontos que sobem ao longo da semana
  rewardsVsBots:false,
  rewards:[                             // por posição final (prontos para o ranking online)
    // prism = fragmentos do Prismático (Revisão 5; só entregues com Sys.pet.DATA.v4 ligada; e nada contra bots, como o resto)
    {from:1,  to:1,   item:4, gems:300, prism:10},
    {from:2,  to:2,   item:3, gems:200, prism:7},
    {from:3,  to:3,   item:3, gems:200, prism:5},
    {from:4,  to:10,  gems:120, stones:30, forge:10, prism:3},
    {from:11, to:50,  gems:50,  stones:15, prism:1},
    {from:51, to:1e9, stones:8},
  ],
  // LIGAS (tela 23, protótipo aprovado): pontos de LIGA (lp) acumulam de semana a semana (os pontos da semana, do ranking, zeram em 1000).
  // Fecha toda semana (virada da semana): lp ≥ mínimo da próxima = SOBE; lp < mínimo da sua = CAI. Prêmio = o da liga em que fechou, entregue só
  // quando o ranking online abrir (rewardsVsBots, como o resto). 💎 só da Platina para cima (PO: caber nos ~10 mil 💎/180 dias do jogador típico,
  // que fica em Ouro/Platina ~26 semanas: ≤ 5 💎/semana ≈ +130 no total; o resto vai em baú e fragmento).
  // goldk = × ouro de um abate da fase; chest = baú do Sys.chest; prism = fragmentos do Prismático (só com a v4); frame/title = visual.
  leagues:[
    {id:'bronze',  name:'Bronze',  min:0,    c1:'#d08a4a',c2:'#6a3a14',c3:'#ffd2a3', prize:{goldk:120}},   // liga: 120 nas três (eram 200/300/400) (dono aprovou 14/11; docs/ECONOMIA_OURO.md §6: X = 5 min de abate = 120 × goldUnit por resgate)
    {id:'silver',  name:'Prata',   min:600,  c1:'#d6dde8',c2:'#5a6270',c3:'#ffffff', prize:{goldk:120,chest:1}},
    {id:'gold',    name:'Ouro',    min:1200, c1:'#ffc94a',c2:'#8a4f0c',c3:'#fff3c4', prize:{goldk:120,chest:2}},
    {id:'platinum',name:'Platina', min:1600, c1:'#5fe0d0',c2:'#136a63',c3:'#e0fffb', prize:{gems:5,chest:2,prism:1}},
    {id:'diamond', name:'Diamante',min:2100, c1:'#6ab8ff',c2:'#1d4a8a',c3:'#e6f4ff', prize:{gems:15,chest:3,prism:3}, wing:true},
    {id:'master',  name:'Mestre',  min:2700, c1:'#c97cff',c2:'#4a1f8a',c3:'#ffd0ff', prize:{gems:25,chest:3,prism:5,frame:true}, wing:true, crown:true},
    {id:'legend',  name:'Lenda',   min:3400, c1:'#ff5a7a',c2:'#6a0f24',c3:'#ffe07a', prize:{gems:40,chest:4,prism:10,title:true}, wing:true, crown:true, rainbow:true},
  ],
  names:{pre:['Kael','Nara','Ícaro','Yara','Odin','Selene','Brutus','Iara','Ragnar','Cauã','Hera','Tita','Bento','Aurora','Zéfiro','Tupã'],
         suf:['do Vale','da Pedra','do Bronze','Rubro','de Ferro','do Vento','Sombrio','Dourado','das Eras','do Norte']},
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(){ let h=2166136261; for(const x of arguments){ const s=String(x); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } h^=124; } return h>>>0; }
const CLK=()=>{ const C=root.Sys&&root.Sys.clock; return C&&typeof C.dayKey==='function'?C:null; };   // fuso único (Brasília com servidor): Sys.clock da fps-30
function dayKey(ms){ const C=CLK(); if(C) return C.dayKey(ms); const d=new Date(ms); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function weekKey(ms){ const F=root.Sys&&root.Sys.fc; if(F&&F.weekKey) return F.weekKey(ms); const d=new Date(ms); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return dayKey(d.getTime()); }
function weekStart(ms){ const C=CLK(); if(C&&typeof C.weekStart==='function') return C.weekStart(ms); const d=new Date(ms); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getTime(); }
const weekFrac=ms=>clamp((ms-weekStart(ms))/(7*86400000),0,1);
const playerFC=(S,host)=>{ const F=root.Sys&&root.Sys.fc; return F&&F.compute?Math.max(1,F.compute(S,host)):1; };
const weekMaxFC=(S,host)=>{ const F=root.Sys&&root.Sys.fc; const m=F&&F.weekMax?F.weekMax(S,host):0; return Math.max(m,playerFC(S,host)); };
const name=rng=>`${DATA.names.pre[Math.floor(rng()*DATA.names.pre.length)]} ${DATA.names.suf[Math.floor(rng()*DATA.names.suf.length)]}`;
const skin=(rng,era)=>({weapon:`w${era}${[0,1,2,4][Math.floor(rng()*4)]}`, armor:`a${era}${Math.floor(rng()*5)}`});
/* era máxima vem do Sys.stats (6 no jogo de 7 eras; 8 com as eras 7-8 ligadas pelo setEra9) */
const maxEraNow=()=>{ const T=root.Sys&&root.Sys.stats; const m=T&&T.DATA&&+T.DATA.maxEra; return m>=6?m:6; };
const eraOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,maxEraNow());

/* ---------------- estado ---------------- */
function ensure(S,host){
  if(!S||typeof S!=='object') throw new Error('Sys.arena.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.arena; if(!o||typeof o!=='object') o=S.sys.arena={};
  o.v=1; o.points=Math.max(DATA.minPoints,num(o.points,DATA.startPoints)); o.fights=int0(o.fights); o.wins=int0(o.wins);
  const maxA=DATA.attemptsPerDay+vipAdd(S,'arenaAdd'); o.attemptsLeft=clamp(int0(num(o.attemptsLeft,maxA)),0,maxA);
  o.refreshLeft=clamp(int0(num(o.refreshLeft,DATA.refreshPerDay)),0,DATA.refreshPerDay); o.refreshes=int0(o.refreshes);
  o.lp=Math.max(0,Math.floor(num(o.lp,0))); o.league=clamp(int0(o.league),0,DATA.leagues.length-1);   // ligas (save antigo: Bronze, 0)
  o.bestRank=int0(o.bestRank); if(typeof o.week!=='string') o.week=''; if(typeof o.day!=='string') o.day='';
  if(!o.botBase||typeof o.botBase!=='object') o.botBase=null;
  if(host){ const t=nowOf(host), wk=weekKey(t), dk=dayKey(t);
    if(o.week!==wk){ if(o.week) closeWeek(S,host,o); o.week=wk; o.points=DATA.startPoints; o.botBase={fc:weekMaxFC(S,host)}; }
    if(o.day!==dk){ o.day=dk; o.attemptsLeft=DATA.attemptsPerDay+vipAdd(S,'arenaAdd'); o.refreshLeft=DATA.refreshPerDay; o.refreshes=0; }
    if(!o.botBase) o.botBase={fc:weekMaxFC(S,host)}; }
  return o;
}
/* fecha a semana: posição final, melhor posição (títulos) e prêmio (só se permitido) */
function closeWeek(S,host,o){
  const rk=localProvider.getRanking(S,host,{kind:'arena',week:o.week,points:o.points,final:true}), me=rk.me;
  const allowed=DATA.rewardsVsBots||!rk.bots, band=DATA.rewards.find(b=>me.rank>=b.from&&me.rank<=b.to)||null;
  o.lastWeek={week:o.week,rank:me.rank,points:o.points,reward:allowed&&band?grant(S,host,band):null,rewardsOff:!allowed};
  if(!o.bestRank||me.rank<o.bestRank) o.bestRank=me.rank;
  closeLeague(S,host,o,allowed);
  const T=root.Sys&&root.Sys.titles; if(T&&T.check) T.check(S,host);
}
/* fecha a liga da semana: sobe/fica/cai pelas linhas; prêmio da liga em que fechou (só se permitido) */
const lgOf=lp=>{ let k=0; DATA.leagues.forEach((L,i)=>{ if(lp>=L.min) k=i; }); return k; };
const vipAdd=(S,k)=>{ const V=root.Sys&&root.Sys.vip; try{ return V&&V.conv?Math.max(0,Math.floor(+V.conv(S)[k]||0)):0; }catch(e){ return 0; } };   // VIP de conveniência (Sys.vip.conv)
const ND=(S,host,src,ctx)=>{ const N=root.Sys&&root.Sys.newDrops; try{ return N&&N.grant?N.grant(S,host,src,ctx):null; }catch(e){ return null; } };   // itens novos (Sys.newDrops, chave própria)
function closeLeague(S,host,o,allowed){ const from=o.league, L=DATA.leagues, nx=L[from+1];
  let to=from; if(nx&&o.lp>=nx.min) to=lgOf(o.lp); else if(o.lp<L[from].min) to=lgOf(o.lp);
  o.lastLeague={week:o.week,from,to,lp:o.lp,move:to>from?'up':to<from?'down':'stay',prize:allowed?grantLeague(S,host,L[from].prize):null,rewardsOff:!allowed}; if(allowed) o.lastLeague.newDrops=ND(S,host,'arena:season',{league:from}); o.league=to; }
function grantLeague(S,host,pz){ const out=grant(S,host,{gems:pz.gems,prism:pz.prism}), sys=root.Sys||{};
  if(pz.goldk&&host&&host.addGold){ out.gold=Math.round(pz.goldk*Math.max(1,num(host.goldUnit&&host.goldUnit(),1))); host.addGold(out.gold); }
  if(pz.chest&&host&&host.addItem){ out.chest=[];   // baú = 1 item de baú por baú (Sys.loot.rollItem, portões de raridade valem)
    for(let i=0;i<pz.chest;i++){ let it=null; if(sys.loot&&sys.loot.rollItem){ try{ it=sys.loot.rollItem(host,{source:'chest'}); }catch(e){ it=null; } } if(it){ host.addItem(it); out.chest.push(it); } } }
  if(pz.frame) out.frame=true; if(pz.title) out.title=true; return out; }
/* para a tela: {idx, league, next, prev, lp, upAt, downAt, toUp, zone: up|stay|down, msLeft, last} */
function leagueInfo(S,host){ const o=ensure(S,host), L=DATA.leagues, i=o.league, nx=L[i+1]||null, cur=L[i];
  const zone=nx&&o.lp>=nx.min?'up':o.lp<cur.min?'down':'stay', wi=weekInfo(S,host);
  return {idx:i,league:cur,next:nx,prev:L[i-1]||null,lp:o.lp,upAt:nx?nx.min:null,downAt:cur.min,toUp:nx?Math.max(0,nx.min-o.lp):0,zone,msLeft:wi.msLeft,last:o.lastLeague||null,rewardsOn:DATA.rewardsVsBots||!(provider.bots)}; }
function grant(S,host,b){ const out={}, sys=root.Sys||{};
  if(b.prism&&sys.pet&&sys.pet.DATA&&sys.pet.DATA.v4===true&&sys.pet.DATA.v3===true){ sys.pet.addFragments(S,'prism',b.prism,host); out.prism=b.prism; }
  if(b.gems&&host&&host.addGems){ host.addGems(b.gems); out.gems=b.gems; }
  if(b.stones&&sys.practice&&sys.practice.addStones){ sys.practice.addStones(S,b.stones,host); out.stones=b.stones; }
  if(b.forge&&sys.forge&&sys.forge.addStones){ sys.forge.addStones(S,b.forge,host); out.forge=b.forge; }
  if(b.item!=null&&host&&host.addItem){ let it=null;
    if(sys.loot&&sys.loot.rollItem){ try{ it=sys.loot.rollItem(host,{minR:b.item}); }catch(e){ it=null; } }   // respeita os portões de raridade
    if(!it) it={slot:'weapon',r:b.item,e:eraOf(host)}; host.addItem(it); out.item=it; }
  return out;
}

/* ---------------- luta PvP (golpe, pet, ultimate) ---------------- */
const defRedOf=(def,atk)=>{ const T=root.Sys&&root.Sys.stats; if(T&&typeof T.defReduction==='function') return T.defReduction(def,atk);
  const d=Math.max(0,num(def,0)); return Math.min(0.75,d/(d+2*Math.max(1e-9,num(atk,0)))); };
/* A e B = {atk, hp, def, critRate, critDmg, aspd, petFrac (0..1 = parte do ATQ que vem do pet)}. {win, rounds, hpA, hpB, log:[{s, k, dmg, crit, hp, en}], timeout} */
function duelPvp(A,B,seed){ const D=DATA.pvp, rng=mulberry(seed>>>0), P=[A,B], max=[Math.max(1,num(A.hp,1)),Math.max(1,num(B.hp,1))], hp=max.slice(), en=[0,0], turn=[0,0], log=[]; let r=0, w=-1;
  const push=e=>{ if(log.length<D.logMax) log.push(e); };
  for(r=1;r<=D.maxRounds&&w<0;r++) for(let s=0;s<2&&w<0;s++){ const a=P[s], d=P[1-s], pf=clamp(num(a.petFrac,0),0,0.9), base=Math.max(0,num(a.atk,0))*(1+Math.max(0,num(a.aspd,0))/100), red=1-defRedOf(d.def,a.atk);
    turn[s]++;
    const crit=rng()*100<clamp(num(a.critRate,12),0,100), ult=en[s]>=D.enFull, var_=0.9+rng()*0.2;
    let dmg=base*(1-pf)*(crit?1+num(a.critDmg,100)/100:1)*var_*red*(ult?D.ultMult:1);
    if(ult) en[s]=0; else en[s]=Math.min(D.enFull,en[s]+D.enHit);
    hp[1-s]-=dmg; en[1-s]=Math.min(D.enFull,en[1-s]+D.enHurt); push({s,k:ult?'ult':'hit',dmg,crit,hp:Math.max(0,hp[1-s]),en:en[s]});
    if(hp[1-s]<=0){ w=s; break; }
    if(pf>0&&turn[s]%D.petEvery===0){ const pd=base*pf*D.petEvery*(0.9+rng()*0.2)*red; hp[1-s]-=pd; push({s,k:'pet',dmg:pd,crit:false,hp:Math.max(0,hp[1-s]),en:en[s]}); if(hp[1-s]<=0) w=s; } }
  return {win:w===0,rounds:Math.min(r-1,D.maxRounds),hpA:Math.max(0,hp[0])/max[0],hpB:Math.max(0,hp[1])/max[1],log,timeout:w<0}; }
/* parte do ATQ que vem do pet (o Sys.tower.playerStats soma o golpe do pet no ATQ: atk × (1 + pet.atk)) */
function petFracOf(S,host){ const F=root.Sys&&root.Sys.fc; try{ if(F&&typeof F.stats==='function'){ const p=(F.stats(S,host)||{}).pet||{}; const k=Math.max(0,num(p.atk,0)); return k/(1+k); } }catch(e){} return 0; }
const levelOf=host=>Math.max(1,int0(host&&host.level&&host.level()));
const PET_POOL=[[20,0,'era0_mammoth',false],[20,0,'pet_shadowwolf',false],[35,1,'era1_sphinx',false],[35,2,'era2_dragon',true],[35,2,'pet_falcon',true],[45,2,'pet_panther',false],
  [55,3,'era3_parrot',true],[60,4,'era4_mechdog',false],[100,7,'era7_cerberus',false],[110,8,'era8_pegasus',true]];
/* aparência do robô pelo nível (e a era do jogador): {hero, mount:{id,stars}|null, pet:{base,stage,fly}|null, wing|null, aura|null} */
function botLook(rng,lvl,era){ const B=DATA.botLook, L=Math.max(1,int0(lvl)), out={hero:rng()<0.5?'kael':'kaia',mount:null,pet:null,wing:null,aura:null};
  if(L>=B.mountFrom){ const ids=L>=100?['griffin','wyvern','mythic']:L>=85?['griffin','wyvern']:L>=60?['wolf','horse']:['horse','pony'];
    out.mount={id:ids[Math.floor(rng()*ids.length)],stars:clamp(1+Math.floor((L-B.mountFrom)/16),1,5)}; }
  if(L>=B.petFrom){ const pool=PET_POOL.filter(p=>L>=p[0]&&int0(era)>=p[1]); const p=pool.length?pool[Math.floor(rng()*pool.length)]:null;
    if(p){ const st=L<45?1:L<75?2:3; out.pet={base:p[2]+['','_mid','_evo'][st-1],stage:st,fly:p[3]}; } }
  if(L>=B.wingFrom) out.wing=rng()<0.5?'angel':'demon';
  if(L>=B.auraFrom&&rng()<0.6) out.aura=L>=100?'aura13':L>=80?'aura10':L>=55?'aura7':'aura4';
  return out; }

/* ---------------- provider LOCAL (bots). Mesma assinatura do futuro servidor. ---------------- */
const localProvider={
  bots:true,
  /* adversários da lista: FC do jogador ±10%, fixos no dia (trocam ao gastar a troca) */
  listOpponents(S,host,n){ const o=ensure(S,host), fc=playerFC(S,host), rng=mulberry(hash('arena-opp',o.week,o.day,o.refreshes)), out=[];
    for(let i=0;i<(n||DATA.opponentsShown);i++){ const k=1+(rng()*2-1)*DATA.oppSpread, f=Math.max(1,Math.round(fc*k));
      const lv=Math.max(1,levelOf(host)+Math.round((rng()*2-1)*DATA.botLook.levelSpread)), id=`bot-${o.week}-${o.day}-${o.refreshes}-${i}`;
      out.push({id,name:name(rng),fc:f,skin:skin(rng,eraOf(host)),points:Math.round(o.points+(rng()*2-1)*80),bot:true,level:lv,look:botLook(mulberry(hash('arena-look',id)),lv,eraOf(host))}); }
    return out; },
  reportResult(S,host,opp,win,delta){ return {ok:true}; },     // local: nada a enviar (antigo; o servidor usa fight)
  /* decide a luta: a "cópia" do jogador na FC do adversário (luta justa: Sys.tower.scaledFoe), duelo com seed fixa da semana/luta */
  fight(S,host,opp){ const o=S.sys.arena, W=root.Sys&&root.Sys.tower; if(!(W&&W.duel&&W.scaledFoe&&W.playerStats)) return {ok:false,reason:'module'};
    const me=W.playerStats(S,host), foe=W.scaledFoe(me,opp.fc), seed=hash('arena-fight',o.week,o.fights,opp.id), pf=petFracOf(S,host);
    me.petFrac=pf; foe.petFrac=opp.look?(opp.look.pet?pf:0):pf; const d=duelPvp(me,foe,seed);
    const k=clamp(opp.fc/Math.max(1,me.fc),DATA.kRange[0],DATA.kRange[1]);
    return {ok:true,win:d.win,delta:Math.round(d.win?DATA.winBase*k:-DATA.lossBase*k),seed,duel:d,log:d.log}; },
  /* ranking da semana. kind 'arena' (pontos) ou 'fc' (maior FC da semana). {list:[{rank,name,value,me,bot}], me:{rank,value}, bots:true} */
  getRanking(S,host,opt){ opt=opt||{}; const o=S.sys&&S.sys.arena||{}, wk=opt.week||o.week||weekKey(nowOf(host)), kind=opt.kind==='fc'?'fc':'arena';
    const base=num(o.botBase&&o.botBase.fc,playerFC(S,host)), frac=opt.final?1:weekFrac(nowOf(host)), rng=mulberry(hash('arena-rank',wk)), rows=[];
    for(let i=0;i<DATA.bots.count;i++){ const sk=rng(), fc=Math.round(base*(1+(sk*2-1)*DATA.bots.spread)), g=DATA.bots.weekGain;
      const pts=Math.round(DATA.startPoints+(g[0]+(g[1]-g[0])*sk)*frac*(0.6+0.8*rng()));
      rows.push({name:name(rng),value:kind==='fc'?fc:pts,me:false,bot:true}); }
    const myVal=kind==='fc'?weekMaxFC(S,host):num(opt.points,num(o.points,DATA.startPoints));
    rows.push({name:'Você',value:myVal,me:true,bot:false});
    rows.sort((a,b)=>(b.value-a.value)||(a.me?-1:b.me?1:0));
    rows.forEach((r,i)=>{ r.rank=i+1; });
    const me=rows.find(r=>r.me); return {kind,week:wk,list:rows,me:{rank:me.rank,value:me.value},bots:true}; },
  weekInfo(S,host){ const t=nowOf(host), st=weekStart(t), end=st+7*86400000; return {week:weekKey(t),start:st,end,msLeft:Math.max(0,end-t)}; },
};
let provider=localProvider;
const setProvider=p=>{ provider=p&&typeof p.getRanking==='function'?p:localProvider; return provider===p; };
const getProvider=()=>provider;

/* ---------------- ações ---------------- */
/* lista de adversários + prévia para a tela: pontos se vencer/perder (mesma conta da luta) e a dificuldade (Sys.tower.difficulty) */
/* prévia de pontos e dificuldade para uma FC dada (a tela passa a FC do retrato, sem refazer a conta) */
function deltaFor(S,fcMe,fcOpp){ const me=Math.max(1,Number(fcMe)||1), k=clamp((Number(fcOpp)||0)/me,DATA.kRange[0],DATA.kRange[1]), W=root.Sys&&root.Sys.tower;
  return {winPts:Math.round(DATA.winBase*k),losePts:Math.round(DATA.lossBase*k),diff:W&&W.difficulty?W.difficulty(me,fcOpp):null}; }
/* opponents(S,host[,fcMe]): fcMe = FC do retrato (opcional); sem ela, Sys.fc.compute */
function opponents(S,host,fcMe){ ensure(S,host); const me=fcMe!=null?Math.max(1,Number(fcMe)||1):playerFC(S,host), W=root.Sys&&root.Sys.tower;
  return provider.listOpponents(S,host,DATA.opponentsShown).map(x=>{ const k=clamp(x.fc/Math.max(1,me),DATA.kRange[0],DATA.kRange[1]);
    return Object.assign({},x,{winPts:Math.round(DATA.winBase*k),losePts:Math.round(DATA.lossBase*k),diff:W&&W.difficulty?W.difficulty(me,x.fc):null}); }); }
function refresh(S,host){ const o=ensure(S,host); if(o.refreshLeft<=0) return {ok:false,reason:'refresh'}; o.refreshLeft--; o.refreshes++; return {ok:true,list:opponents(S,host)}; }
/* luta contra o adversário oppId da lista atual. {ok, reason:'tries'|'opp', win, delta, points, duel} */
function fight(S,host,oppId){
  const o=ensure(S,host); if(o.attemptsLeft<=0) return {ok:false,reason:'tries'};
  const opp=opponents(S,host).find(x=>x.id===oppId); if(!opp) return {ok:false,reason:'opp'};
  // o PROVIDER decide (local: aqui mesmo; servidor: autoritativo). Provider antigo sem fight: usa a conta local e avisa por reportResult.
  const r=typeof provider.fight==='function'?provider.fight(S,host,opp):localProvider.fight(S,host,opp); if(!r||!r.ok) return {ok:false,reason:(r&&r.reason)||'module'};
  if(typeof provider.fight!=='function'&&provider.reportResult) provider.reportResult(S,host,opp,r.win,r.delta);
  o.attemptsLeft--; o.fights++; if(r.win) o.wins++; o.points=r.points!=null?Math.max(DATA.minPoints,Math.floor(r.points)):Math.max(DATA.minPoints,o.points+r.delta);
  o.lp=Math.max(0,o.lp+r.delta);   // pontos de LIGA andam junto (acumulam)
  o.last={opp:opp.name,win:r.win,delta:r.delta,ts:nowOf(host)};
  const rewards=fightRewards(S,host,o,r);
  return {ok:true,win:r.win,delta:r.delta,points:o.points,lp:o.lp,league:o.league,opp,duel:r.duel||null,seed:r.seed,log:r.log||(r.duel&&r.duel.log)||null,rewards};
}
/* prêmio da luta: se o provider (servidor) mandar r.rewards, vale o dele; senão a conta local. Credita pelo host. {gold, gems, chest} */
function fightRewards(S,host,o,r){ const R=DATA.fightRewards, dk=dayKey(nowOf(host));
  if(o.rwDay!==dk){ o.rwDay=dk; o.rwFights=0; o.rwWin=0; }
  o.rwFights=int0(o.rwFights)+1;
  let gold, gems, chest=0;
  if(r.rewards&&typeof r.rewards==='object'){ const gu=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)); gold=r.rewards.gold==null?Math.round(gu*num(r.rewards.goldk,r.win?R.goldkWin:R.goldkLoss)):int0(r.rewards.gold); gems=int0(r.rewards.gems); chest=int0(r.rewards.chest); }
  else { const unit=Math.max(1,num(host&&host.goldUnit&&host.goldUnit(),1)); gold=Math.round(unit*(r.win?R.goldkWin:R.goldkLoss));
    gems=r.win&&!o.rwWin?R.gemsFirstWin:0; chest=o.rwFights===R.chestAt?1:0; }
  if(r.win) o.rwWin=1;
  if(gold&&host&&host.addGold) host.addGold(gold);
  if(gems&&host&&host.addGems) host.addGems(gems);
  if(chest){ const C=root.Sys&&root.Sys.chest; let got=0; try{ if(C&&C.addCharge&&C.need){ const x=C.addCharge(S,C.need()*chest,host); got=int0(x&&x.gained); } }catch(e){ got=0; } chest=got; }
  return {gold,gems,chest}; }
const ranking=(S,host,kind)=>{ ensure(S,host); return provider.getRanking(S,host,{kind}); };
const weekInfo=(S,host)=>provider.weekInfo(S,host);
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,duelPvp,botLook,leagueInfo,lgOf,ensure,deltaFor,opponents,refresh,fight,ranking,weekInfo,setProvider,getProvider,localProvider,bonus,_weekKey:weekKey};
root.Sys=root.Sys||{}; root.Sys.arena=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
