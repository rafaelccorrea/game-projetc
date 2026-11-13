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
  attemptsPerDay:5, opponentsShown:3, refreshPerDay:1,
  startPoints:1000, winBase:20, lossBase:10, kRange:[0.5,2], minPoints:0,
  oppSpread:0.10,                       // adversários da lista: FC do jogador ±10% (pedido do PO)
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
  // quando o ranking online abrir (rewardsVsBots, como o resto). 💎 por semana só online e só nas ligas altas (conta no reports/sys-e2-api.md §5m).
  // goldk = × ouro de um abate da fase; chest = baú do Sys.chest; prism = fragmentos do Prismático (só com a v4); frame/title = visual.
  leagues:[
    {id:'bronze',  name:'Bronze',  min:0,    c1:'#d08a4a',c2:'#6a3a14',c3:'#ffd2a3', prize:{goldk:200}},
    {id:'silver',  name:'Prata',   min:600,  c1:'#d6dde8',c2:'#5a6270',c3:'#ffffff', prize:{goldk:300,gems:10}},
    {id:'gold',    name:'Ouro',    min:1200, c1:'#ffc94a',c2:'#8a4f0c',c3:'#fff3c4', prize:{gems:20,chest:1}},
    {id:'platinum',name:'Platina', min:1600, c1:'#5fe0d0',c2:'#136a63',c3:'#e0fffb', prize:{gems:30,chest:1,prism:1}},
    {id:'diamond', name:'Diamante',min:2100, c1:'#6ab8ff',c2:'#1d4a8a',c3:'#e6f4ff', prize:{gems:40,chest:2,prism:3}, wing:true},
    {id:'master',  name:'Mestre',  min:2700, c1:'#c97cff',c2:'#4a1f8a',c3:'#ffd0ff', prize:{gems:60,chest:3,prism:5,frame:true}, wing:true, crown:true},
    {id:'legend',  name:'Lenda',   min:3400, c1:'#ff5a7a',c2:'#6a0f24',c3:'#ffe07a', prize:{gems:80,chest:3,prism:10,title:true}, wing:true, crown:true, rainbow:true},
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
const eraOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,6);

/* ---------------- estado ---------------- */
function ensure(S,host){
  if(!S||typeof S!=='object') throw new Error('Sys.arena.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.arena; if(!o||typeof o!=='object') o=S.sys.arena={};
  o.v=1; o.points=Math.max(DATA.minPoints,num(o.points,DATA.startPoints)); o.fights=int0(o.fights); o.wins=int0(o.wins);
  o.attemptsLeft=clamp(int0(num(o.attemptsLeft,DATA.attemptsPerDay)),0,DATA.attemptsPerDay);
  o.refreshLeft=clamp(int0(num(o.refreshLeft,DATA.refreshPerDay)),0,DATA.refreshPerDay); o.refreshes=int0(o.refreshes);
  o.lp=Math.max(0,Math.floor(num(o.lp,0))); o.league=clamp(int0(o.league),0,DATA.leagues.length-1);   // ligas (save antigo: Bronze, 0)
  o.bestRank=int0(o.bestRank); if(typeof o.week!=='string') o.week=''; if(typeof o.day!=='string') o.day='';
  if(!o.botBase||typeof o.botBase!=='object') o.botBase=null;
  if(host){ const t=nowOf(host), wk=weekKey(t), dk=dayKey(t);
    if(o.week!==wk){ if(o.week) closeWeek(S,host,o); o.week=wk; o.points=DATA.startPoints; o.botBase={fc:weekMaxFC(S,host)}; }
    if(o.day!==dk){ o.day=dk; o.attemptsLeft=DATA.attemptsPerDay; o.refreshLeft=DATA.refreshPerDay; o.refreshes=0; }
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
function closeLeague(S,host,o,allowed){ const from=o.league, L=DATA.leagues, nx=L[from+1];
  let to=from; if(nx&&o.lp>=nx.min) to=lgOf(o.lp); else if(o.lp<L[from].min) to=lgOf(o.lp);
  o.lastLeague={week:o.week,from,to,lp:o.lp,move:to>from?'up':to<from?'down':'stay',prize:allowed?grantLeague(S,host,L[from].prize):null,rewardsOff:!allowed}; o.league=to; }
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

/* ---------------- provider LOCAL (bots). Mesma assinatura do futuro servidor. ---------------- */
const localProvider={
  bots:true,
  /* adversários da lista: FC do jogador ±10%, fixos no dia (trocam ao gastar a troca) */
  listOpponents(S,host,n){ const o=ensure(S,host), fc=playerFC(S,host), rng=mulberry(hash('arena-opp',o.week,o.day,o.refreshes)), out=[];
    for(let i=0;i<(n||DATA.opponentsShown);i++){ const k=1+(rng()*2-1)*DATA.oppSpread, f=Math.max(1,Math.round(fc*k));
      out.push({id:`bot-${o.week}-${o.day}-${o.refreshes}-${i}`,name:name(rng),fc:f,skin:skin(rng,eraOf(host)),points:Math.round(o.points+(rng()*2-1)*80),bot:true}); }
    return out; },
  reportResult(S,host,opp,win,delta){ return {ok:true}; },     // local: nada a enviar (antigo; o servidor usa fight)
  /* decide a luta: a "cópia" do jogador na FC do adversário (luta justa: Sys.tower.scaledFoe), duelo com seed fixa da semana/luta */
  fight(S,host,opp){ const o=S.sys.arena, W=root.Sys&&root.Sys.tower; if(!(W&&W.duel&&W.scaledFoe&&W.playerStats)) return {ok:false,reason:'module'};
    const me=W.playerStats(S,host), foe=W.scaledFoe(me,opp.fc), seed=hash('arena-fight',o.week,o.fights,opp.id), d=W.duel(me,foe,seed);
    const k=clamp(opp.fc/Math.max(1,me.fc),DATA.kRange[0],DATA.kRange[1]);
    return {ok:true,win:d.win,delta:Math.round(d.win?DATA.winBase*k:-DATA.lossBase*k),seed,duel:d}; },
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
function opponents(S,host){ ensure(S,host); const me=playerFC(S,host), W=root.Sys&&root.Sys.tower;
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
  return {ok:true,win:r.win,delta:r.delta,points:o.points,lp:o.lp,league:o.league,opp,duel:r.duel||null,seed:r.seed,log:r.log||null};
}
const ranking=(S,host,kind)=>{ ensure(S,host); return provider.getRanking(S,host,{kind}); };
const weekInfo=(S,host)=>provider.weekInfo(S,host);
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,leagueInfo,lgOf,ensure,opponents,refresh,fight,ranking,weekInfo,setProvider,getProvider,localProvider,bonus,_weekKey:weekKey};
root.Sys=root.Sys||{}; root.Sys.arena=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
