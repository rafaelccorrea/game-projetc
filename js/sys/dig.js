/* Eonbound — Sys.dig: ESCAVAÇÃO ARQUEOLÓGICA (docs/LOM_VS_EONBOUND.md §3 "Mina", §5 item 9, §7 item 8). CHAVE DESLIGADA (DATA.on=false).
   Uma pausa ativa dentro do jogo passivo: o herói cava camadas de terra de 5 × 6 células. Cada toque numa célula gasta 1 PICARETA; terra cai com
   1 toque, rocha com 2. Só se cava a linha de cima ou uma célula vizinha (cima/baixo/lados) de uma já aberta. Achar a ESCADA libera a próxima
   camada; a cada 10 camadas a profundidade muda de era (Pré-História → Celestial), até a maior era liberada do herói.
   O QUE TEM NA CAMADA É FIXO PELA SEMENTE DA CAMADA (profundidade + volta): o mesmo para todo jogador, sem sorteio na hora de cavar.
   Dá PEDRAS DE PRÁTICA (Sys.practice.addStones), FRAGMENTOS DE RELÍQUIA (Sys.relics.addFragments, era fixa na célula) e ferramentas
   (bomba abre a célula e as 4 vizinhas; broca abre a coluna inteira), tudo sem gastar picareta extra. NÃO DÁ OURO (ouro escasso).
   PICARETAS: grátis, voltam com o tempo (1 a cada 30 min, até 20). Há fontes fixas jogando (missões do dia, Senhor da Era, evento).
   NADA À VENDA: não existe picareta paga, recarga paga, anúncio ou diamante (grant/addPicks recusam fonte de loja; jogo com menores).
   Sem o Sys.practice / Sys.relics ligados, o prêmio fica guardado em `pend` e entra sozinho na próxima ação (nada se perde).
   Estado: S.sys.dig {v, e, t, depth, round, grid:[{hp, open}], bombs, drills, pend:{stones, frags:[9]}, got:{stones, frags, layers}}.
   Sem DOM. Teste: test/sys/dig.test.js */
(function(root){
'use strict';

/* ---------------- dados (PROPOSTA; a Sistemas calibra com o QA) ---------------- */
const DATA={
  on:false,
  label:'Escavação', icon:'',
  eraName:['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'],
  cols:5, rows:6,
  energy:{max:20, everyMin:30, over:40},   // picaretas: teto da recarga 20, +1 a cada 30 min; fontes fixas podem passar do teto até 40
  layersPerEra:10,
  rock:{base:0.30, perEra:0.03, max:0.55}, // fração de rocha (2 toques) na camada, cresce com a era da profundidade
  // conteúdo FIXO por camada (posições e valores tirados da semente da camada)
  stones:{cells:6, min:2, spread:3, perEra:0.5},   // 6 células de pedras: 2..4 pedras + floor(era × 0,5)
  frags:{cells:2, n:1},                            // 2 células com 1 fragmento de relíquia; era da célula = uma era de 0 até a da profundidade
  bombEvery:3, drillEvery:5,                       // camada com bomba: (prof+1) múltiplo de 3; com broca: múltiplo de 5
  // fontes FIXAS de picareta e ferramenta (grant)
  grants:{
    daily:   {picks:5, daily:1},      // missões diárias completas: +5 picaretas (1 vez por dia)
    eraLord: {bombs:1},               // vitória sobre o Senhor da Era: 1 bomba (1 vez por era)
    event:   {picks:10, bombs:1, drills:1},   // prêmio fixo de evento
  },
  forbidden:['shop','gems','offer','pack','pay','gacha','ad','ads','refill'],
  /* palavra que a TELA mostra para cada reason de erro (a tela chama Sys.dig.why(r)) */
  why:{off:'Escavação desligada',cell:'Já está aberta',blocked:'Cave perto de uma aberta',picks:'Sem picaretas',bombs:'Sem bombas',drills:'Sem brocas',
    stairs:'Ache a escada primeiro',daily:'Já ganhou hoje',done:'Já ganhou nesta era',forbidden:'Fonte não permitida',src:'Não deu agora',missions:'Complete as missões do dia'},
};

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const SYS=()=>root.Sys||{};
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const C=SYS().clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,8);
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const badSrc=src=>DATA.forbidden.includes(String(src||'').toLowerCase());
const N=()=>DATA.cols*DATA.rows;
const EVERY=()=>DATA.energy.everyMin*60000;
/* gerador com semente (mulberry32) — só para MONTAR a camada a partir da semente fixa; cavar não sorteia nada */
function prng(seed){ let a=seed>>>0; return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const seedOf=(depth,round)=>(Math.imul(int0(depth)+1,2654435761)^Math.imul(int0(round)+7,40503))>>>0;
const eraOfDepth=d=>clamp(Math.floor(int0(d)/DATA.layersPerEra),0,8);
const maxDepth=host=>(eraMaxOf(host)+1)*DATA.layersPerEra-1;   // última camada liberada pela era do herói

/* camada FIXA: [{k:'dirt'|'rock', hp0, item:null|{t:'stairs'}|{t:'stones',n}|{t:'frag',era,n}|{t:'bomb'}|{t:'drill'}}] */
function layout(depth,round){ const rnd=prng(seedOf(depth,round)), era=eraOfDepth(depth), n=N();
  const rockP=Math.min(DATA.rock.max,DATA.rock.base+DATA.rock.perEra*era);
  const cells=[]; for(let i=0;i<n;i++){ const rock=rnd()<rockP; cells.push({k:rock?'rock':'dirt',hp0:rock?2:1,item:null}); }
  // posições sem repetir (embaralha 0..n−1 pela semente); a escada nunca na 1ª linha
  const idx=[]; for(let i=DATA.cols;i<n;i++) idx.push(i); for(let i=idx.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
  const top=[]; for(let i=0;i<DATA.cols;i++) top.push(i); const free=idx.slice(1).concat(top); for(let i=free.length-1;i>0;i--){ const j=Math.floor(rnd()*(i+1)); [free[i],free[j]]=[free[j],free[i]]; }
  cells[idx[0]].item={t:'stairs'}; let p=0;
  for(let i=0;i<DATA.stones.cells;i++) cells[free[p++]].item={t:'stones',n:DATA.stones.min+Math.floor(rnd()*DATA.stones.spread)+Math.floor(era*DATA.stones.perEra)};
  for(let i=0;i<DATA.frags.cells;i++) cells[free[p++]].item={t:'frag',era:Math.floor(rnd()*(era+1)),n:DATA.frags.n};
  if((int0(depth)+1)%DATA.bombEvery===0) cells[free[p++]].item={t:'bomb'};
  if((int0(depth)+1)%DATA.drillEvery===0) cells[free[p++]].item={t:'drill'};
  return cells; }

function freshGrid(depth,round){ return layout(depth,round).map(c=>({hp:c.hp0,open:false})); }
function ensure(S,host){
  if(!S||typeof S!=='object') throw new Error('Sys.dig.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.dig; if(!o||typeof o!=='object') o=S.sys.dig={};
  const fresh=o.v!==1; o.v=1;
  o.e=fresh?DATA.energy.max:clamp(int0(o.e),0,DATA.energy.over); o.t=num(o.t,0)||nowOf(host);
  o.depth=int0(o.depth); o.round=int0(o.round); o.bombs=int0(o.bombs); o.drills=int0(o.drills);
  const L=layout(o.depth,o.round);
  if(!Array.isArray(o.grid)||o.grid.length!==N()) o.grid=freshGrid(o.depth,o.round);
  else o.grid=o.grid.map((c,i)=>{ const open=!!(c&&c.open); return {hp:open?0:clamp(int0(c&&c.hp)||L[i].hp0,1,L[i].hp0),open}; });
  const pd=(o.pend&&typeof o.pend==='object')?o.pend:{}, pf=Array.isArray(pd.frags)?pd.frags:[]; o.pend={stones:int0(pd.stones),frags:[]}; for(let e=0;e<9;e++) o.pend.frags.push(int0(pf[e]));
  const g=(o.got&&typeof o.got==='object')?o.got:{}; o.got={stones:int0(g.stones),frags:int0(g.frags),layers:int0(g.layers)};
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={k:typeof d.k==='string'?d.k:'',daily:int0(d.daily)};
  o.lord=(o.lord&&typeof o.lord==='object'&&!Array.isArray(o.lord))?o.lord:{};
  return o; }

/* picaretas: recarga pelo tempo (relógio para trás só move o marcador) */
function refill(S,host,noSync){ const o=tick(S,host); if(!noSync&&on()) syncDaily(S,host,o); return o; }
function tick(S,host){ const o=ensure(S,host), now=nowOf(host), ev=EVERY();
  if(now<o.t){ o.t=now; return o; }
  if(o.e>=DATA.energy.max){ o.t=now; return o; }
  const k=Math.floor((now-o.t)/ev); if(k>0){ o.e=Math.min(DATA.energy.max,o.e+k); o.t=o.e>=DATA.energy.max?now:o.t+k*ev; }
  return o; }
const nextInMs=(S,host)=>{ const o=refill(S,host); return o.e>=DATA.energy.max?0:Math.max(0,o.t+EVERY()-nowOf(host)); };

/* entrega (ou guarda) o prêmio */
function flush(S,host){ const o=ensure(S,host), P=SYS().practice, R=SYS().relics;
  if(o.pend.stones>0&&P&&typeof P.addStones==='function'){ try{ P.addStones(S,o.pend.stones,host); o.pend.stones=0; }catch(e){} }
  if(R&&typeof R.addFragments==='function') for(let e=0;e<9;e++) if(o.pend.frags[e]>0){ let r=null; try{ r=R.addFragments(S,e,o.pend.frags[e],'dig'); }catch(x){} if(r&&r.ok) o.pend.frags[e]=0; }
  return o.pend; }
function reward(S,host,o,item,out){ if(!item) return;
  if(item.t==='stones'){ o.pend.stones+=item.n; o.got.stones+=item.n; out.stones+=item.n; }
  else if(item.t==='frag'){ o.pend.frags[item.era]+=item.n; o.got.frags+=item.n; out.frags.push({era:item.era,n:item.n}); }
  else if(item.t==='bomb'){ o.bombs++; out.bombs++; }
  else if(item.t==='drill'){ o.drills++; out.drills++; }
  else if(item.t==='stairs') out.stairs=true; }
const at=(r,c)=>r*DATA.cols+c;
const inGrid=(r,c)=>Number.isInteger(r)&&Number.isInteger(c)&&r>=0&&c>=0&&r<DATA.rows&&c<DATA.cols;
function canDigCell(o,r,c){ if(!inGrid(r,c)) return false; if(o.grid[at(r,c)].open) return false; if(r===0) return true;
  return [[r-1,c],[r+1,c],[r,c-1],[r,c+1]].some(([a,b])=>inGrid(a,b)&&o.grid[at(a,b)].open); }
function openCell(S,host,o,L,r,c,out){ const g=o.grid[at(r,c)]; if(g.open) return; g.open=true; g.hp=0; out.opened.push([r,c]); reward(S,host,o,L[at(r,c)].item,out); }
const blank=()=>({ok:true,opened:[],stones:0,frags:[],bombs:0,drills:0,stairs:false});
const stairsOpen=(o,L)=>L.some((c,i)=>c.item&&c.item.t==='stairs'&&o.grid[i].open);

/* um toque de picareta na célula (r, c). {ok, reason:'off'|'cell'|'blocked'|'picks', hp (o que falta), opened, stones, frags, bombs, drills, stairs, picks} */
function hit(S,host,r,c){ if(!on()) return {ok:false,reason:'off'}; const o=refill(S,host);
  if(!inGrid(r,c)) return {ok:false,reason:'cell'}; if(o.grid[at(r,c)].open) return {ok:false,reason:'cell'};
  if(!canDigCell(o,r,c)) return {ok:false,reason:'blocked'}; if(o.e<1) return {ok:false,reason:'picks',nextInMs:nextInMs(S,host)};
  if(o.e>=DATA.energy.max) o.t=nowOf(host); o.e--; const L=layout(o.depth,o.round), g=o.grid[at(r,c)], out=blank();
  g.hp--; if(g.hp<=0) openCell(S,host,o,L,r,c,out); flush(S,host); changed(host);
  return Object.assign(out,{hp:g.hp,picks:o.e}); }
/* bomba: abre a célula e as 4 vizinhas (precisa poder cavar a célula). Não gasta picareta. */
function bomb(S,host,r,c){ if(!on()) return {ok:false,reason:'off'}; const o=refill(S,host); if(o.bombs<1) return {ok:false,reason:'bombs'};
  if(!canDigCell(o,r,c)) return {ok:false,reason:'blocked'}; o.bombs--; const L=layout(o.depth,o.round), out=blank();
  for(const [a,b] of [[r,c],[r-1,c],[r+1,c],[r,c-1],[r,c+1]]) if(inGrid(a,b)) openCell(S,host,o,L,a,b,out);
  flush(S,host); changed(host); return out; }
/* broca: abre a coluna c inteira, de cima para baixo. Não gasta picareta. */
function drill(S,host,c){ if(!on()) return {ok:false,reason:'off'}; const o=refill(S,host); if(o.drills<1) return {ok:false,reason:'drills'};
  if(!inGrid(0,c)) return {ok:false,reason:'cell'}; let any=false; for(let r=0;r<DATA.rows;r++) if(!o.grid[at(r,c)].open) any=true; if(!any) return {ok:false,reason:'cell'};
  o.drills--; const L=layout(o.depth,o.round), out=blank(); for(let r=0;r<DATA.rows;r++) openCell(S,host,o,L,r,c,out);
  flush(S,host); changed(host); return out; }
/* desce pela escada aberta. No fundo liberado (era do herói), a próxima camada é OUTRA na mesma profundidade (volta + 1).
   O que ficou na camada para trás se perde (como na mina do LoM). {ok, reason:'off'|'stairs', depth, round, era} */
function descend(S,host){ if(!on()) return {ok:false,reason:'off'}; const o=refill(S,host), L=layout(o.depth,o.round);
  if(!stairsOpen(o,L)) return {ok:false,reason:'stairs'};
  if(o.depth<maxDepth(host)){ o.depth++; o.round=0; } else o.round++;
  o.grid=freshGrid(o.depth,o.round); o.got.layers++; changed(host);
  return {ok:true,depth:o.depth,round:o.round,era:eraOfDepth(o.depth)}; }

/* fontes FIXAS: grant(S, host, 'daily'|'eraLord'|'event', {era}). Picaretas podem passar do teto da recarga até energy.over. */
function grant(S,host,src,opt){ const r=give(S,host,src,opt); if(r.ok) changed(host); return r; }
function give(S,host,src,opt){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'};
  const G=DATA.grants[src]; if(!G) return {ok:false,reason:'src'}; opt=opt||{}; const o=refill(S,host,true);
  if(G.daily){ const k=dayKey(nowOf(host)); if(o.day.k!==k){ o.day.k=k; o.day.daily=0; } if(o.day.daily>=G.daily) return {ok:false,reason:'daily'}; o.day.daily++; }
  if(src==='eraLord'){ const e=opt.era!=null?clamp(int0(opt.era),0,8):eraMaxOf(host); if(o.lord[e]) return {ok:false,reason:'done'}; o.lord[e]=1; }
  const out={ok:true,src,picks:0,bombs:0,drills:0};
  if(G.picks){ const before=o.e; o.e=Math.min(DATA.energy.over,o.e+G.picks); out.picks=o.e-before; }
  if(G.bombs){ o.bombs+=G.bombs; out.bombs=G.bombs; } if(G.drills){ o.drills+=G.drills; out.drills=G.drills; }
  return out; }
/* MISSÕES DO DIA SEM GANCHO: as +5 picaretas entram sozinhas quando o bônus "todas as diárias" do Sys.pass foi resgatado hoje (seja pela tela de
   Missões, pelo Passe, pelo VIP automático ou pelo "Pegar tudo"). Chamado pelo refill (logo, por view, hit, picks...). 1 vez por dia (o grant 'daily'
   já guarda). Não chama host.onChange (a leitura da tela não pode redesenhar a tela): o save grava na próxima ação. {ok, picks} ou {ok:false, reason} */
function syncDaily(S,host,o){ if(!on()) return {ok:false,reason:'off'}; const P=SYS().pass; let done=false;
  try{ if(P&&typeof P.list==='function'){ const b=P.list(S,host).bonus; done=!!(b&&b.claimed); } }catch(e){ done=false; }
  if(!done) return {ok:false,reason:'missions'}; o=o||ensure(S,host); const k=dayKey(nowOf(host)); if(o.day.k===k&&o.day.daily>=DATA.grants.daily.daily) return {ok:false,reason:'daily'};
  return give(S,host,'daily'); }

/* para a tela e para a lista "Hoje": {on, picks, max, nextInMs, bombs, drills, depth, round, era, eraName, maxDepth, atBottom,
   stairsOpen, cols, rows, cells:[{r, c, open, hp, rock, canDig, item (só aberta)}], got, pend, paid:false} */
function view(S,host){ if(!on()) S=JSON.parse(JSON.stringify(S||{}));   // desligado: a tela pode olhar, o save não muda
  const o=refill(S,host), L=layout(o.depth,o.round), md=maxDepth(host);
  return {on:on(),picks:o.e,max:DATA.energy.max,nextInMs:nextInMs(S,host),bombs:o.bombs,drills:o.drills,depth:o.depth,round:o.round,
    era:eraOfDepth(o.depth),eraName:DATA.eraName[eraOfDepth(o.depth)],maxDepth:md,atBottom:o.depth>=md,stairsOpen:stairsOpen(o,L),
    cols:DATA.cols,rows:DATA.rows,paid:false,got:Object.assign({},o.got),pend:{stones:o.pend.stones,frags:o.pend.frags.slice()},
    cells:o.grid.map((g,i)=>{ const r=Math.floor(i/DATA.cols), c=i%DATA.cols; return {r,c,open:g.open,hp:g.hp,rock:L[i].k==='rock',canDig:canDigCell(o,r,c),
      item:g.open&&L[i].item?Object.assign({},L[i].item):null}; })}; }
/* para o Sys.today: picaretas cheias ou quase (não gasta nada) */
const picks=(S,host)=>on()?refill(S,host).e:0;
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});

/* texto curto para o reason (string ou {ok:false, reason}); '' quando deu certo */
const why=r=>{ const k=r&&typeof r==='object'?(r.ok?'':r.reason):r; return k?(DATA.why[k]||'Não deu agora'):''; };
/* "próxima em 18 min" (a tela mostra; 0 = cheia) */
const nextText=ms=>{ const m=Math.ceil(int0(ms)/60000); return m<=0?'':m>=60?`próxima em ${Math.floor(m/60)} h ${m%60} min`:`próxima em ${m} min`; };
const API={DATA,on,setOn,ensure,layout,seedOf,eraOfDepth,maxDepth,refill,nextInMs,nextText,hit,bomb,drill,descend,grant,syncDaily,flush,view,picks,bonus,why,dayKey};
root.Sys=root.Sys||{}; root.Sys.dig=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
