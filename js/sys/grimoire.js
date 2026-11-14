/* Eonbound — Sys.grimoire: GRIMÓRIO DAS ERAS (docs/LOM_VS_EONBOUND.md §5 item 4; aprovado pelo dono). CHAVE DESLIGADA (DATA.on=false).
   18 magias, 2 por era (9 eras). O herói leva 3 equipadas na batalha (lançam sozinhas com recarga) e CADA magia aprendida dá um bônus permanente
   pequeno ("bônus por ter"), mesmo fora do conjunto. Sobe de nível com PÁGINAS repetidas da mesma magia + TINTA, que vêm SÓ jogando, de fontes FIXAS
   (Senhor da Era, chefe da fase 50, instâncias, Torre, eventos, missões). SEM SORTEIO: nenhuma fonte é aleatória, nada se compra com dinheiro ou
   diamante (addPages/addInk recusam fonte de loja). Jogo com menores: nada de gacha, nem com cupom.
   Conjuntos salvos por modo: Fases / Arena / Chefe (cada um com as suas 3). A batalha pede loadout(S, modo).
   Dano das magias dentro da regra de coerência (Sys.stats.DATA.dmgRule): no máximo 3× o ATQ no total, como a habilidade especial (s2).
   Estado: S.sys.grimoire {v, on:{id:{lv,pages}}, ink, sets:{fases,arena,chefe}, day:{k, lord:{era:1}}}. bonus(S) entra sozinho na FC (Sys.fc). Sem DOM. */
(function(root){
'use strict';

/* ---------------- dados (PROPOSTA; a Sistemas calibra com o QA) ---------------- */
// efeito: dmg = dano (mult × ATQ, repartido em hits; area = divide entre a fila) · heal = cura % da vida · shield = escudo % da vida por sec
//         buff = +val no atributo key por sec · stun = atordoa por sec (chefe: metade, mesma imunidade do Sys.strikes)
// passive = bônus por ter (convenção do Sys.fc: pontos %), cresce com o nível
const S_=(id,era,name,kind,cd,fx,pk,desc)=>({id,era,name,kind,cd,fx,passive:pk,desc});
const DATA={
  on:false,
  label:'Grimório', icon:'',
  eraName:['Pré-História','Antiguidade','Medieval','Pólvora','Industrial','Moderna','Futurista','Submundo','Celestial'],
  slots:3,
  modes:['fases','arena','chefe'],
  modeName:{fases:'Fases',arena:'Arena',chefe:'Chefe'},
  maxLv:10,
  // custo para ir do nível n ao n+1 (índice n−1): páginas repetidas da magia + tinta
  pages:[1,2,3,4,5,6,8,10,12],
  ink:[10,20,40,60,90,130,180,240,320],
  // magia por nível: dano × (1 + dmgStep·(nv−1)) até o teto de 3× · cura/escudo/buff × (1 + fxStep·(nv−1)) · recarga × (1 − cdStep·(nv−1))
  dmgStep:0.04, fxStep:0.04, cdStep:0.02, dmgCap:3,
  // bônus por ter: base + step·(nv−1) por magia (atkPct/hpPct/defPct em %, critPct em pontos)
  passive:{atkPct:[0.4,0.08], hpPct:[0.4,0.08], defPct:[0.3,0.06], critPct:[0.2,0.04]},
  spells:[
    S_('rollingStone',0,'Pedra Rolante','dmg',10,{mult:2.0,hits:[1],area:true},'atkPct','Uma pedra enorme rola pela fila e acerta todos (dano dividido).'),
    S_('ancestralFire',0,'Fogueira Ancestral','heal',16,{pct:12},'hpPct','O herói se aquece na fogueira e recupera vida.'),
    S_('bronzePhalanx',1,'Falange de Bronze','shield',18,{pct:15,sec:5},'defPct','Escudos de bronze formam uma parede que segura o dano.'),
    S_('minotaurSpear',1,'Lança do Minotauro','dmg',12,{mult:2.5,hits:[1]},'atkPct','Uma lança pesada num único inimigo.'),
    S_('knightCharge',2,'Investida do Cavaleiro','dmg',14,{mult:2.0,hits:[1],stun:1},'critPct','Avança com o escudo e atordoa o inimigo da frente.'),
    S_('royalBreath',2,'Sopro do Dragão Real','dmg',15,{mult:2.4,hits:[0.34,0.33,0.33],area:true},'atkPct','Três baforadas de fogo na fila (dano dividido).'),
    S_('cannonball',3,'Bala de Canhão','dmg',18,{mult:3.0,hits:[1]},'atkPct','Um tiro de canhão no inimigo da frente.'),
    S_('ghostFog',3,'Névoa do Capitão Fantasma','buff',20,{key:'dodge',val:20,sec:4},'hpPct','Uma névoa fantasma: o herói esquiva mais por alguns segundos.'),
    S_('gearSpin',4,'Engrenagem Giratória','dmg',10,{mult:1.8,hits:[0.34,0.33,0.33],area:true},'critPct','Uma engrenagem gira pela fila e volta.'),
    S_('steamBoiler',4,'Caldeira a Vapor','buff',18,{key:'aspd',val:15,sec:5},'hpPct','Vapor nas juntas: o herói ataca mais rápido.'),
    S_('droneRain',5,'Chuva de Drones','dmg',14,{mult:2.2,hits:[0.25,0.25,0.25,0.25],area:true},'atkPct','Quatro drones mergulham na fila (dano dividido).'),
    S_('medKit',5,'Kit Médico','heal',20,{pct:15},'hpPct','Um kit de primeiros socorros recupera vida.'),
    S_('plasmaRay',6,'Raio de Plasma','dmg',14,{mult:2.8,hits:[1]},'critPct','Um raio de plasma num único inimigo.'),
    S_('ionShield',6,'Escudo de Íons','shield',22,{pct:20,sec:5},'defPct','Um escudo de energia segura o dano.'),
    S_('underChains',7,'Correntes do Submundo','dmg',18,{mult:1.2,hits:[1],area:true,stun:1.2},'defPct','Correntes prendem a fila inteira por um instante.'),
    S_('infernalFlame',7,'Chama Infernal','dmg',16,{mult:2.6,hits:[0.34,0.33,0.33],area:true},'atkPct','Uma onda de fogo em três partes na fila.'),
    S_('judgeBlessing',8,'Bênção do Juiz','heal',22,{pct:18},'hpPct','Uma luz do céu recupera muita vida.'),
    S_('lightLance',8,'Lança de Luz','dmg',16,{mult:3.0,hits:[0.5,0.5]},'hpPct','Duas lanças de luz no inimigo da frente.'),
  ],
  // como aprender (1ª página) e como juntar páginas: tudo FIXO e só jogando. A = 1ª magia da era, B = 2ª.
  learn:{A:'1ª vitória sobre o Senhor da Era',B:'1ª vitória sobre o chefe do meio da era'},
  // fontes aceitas em grant(): o que cada uma dá, sempre igual (nunca sorteio)
  grants:{
    eraLord:      {learn:'A', ink:20},             // 1ª vitória sobre o Senhor da Era: aprende a A + 20 tinta
    eraLordRepeat:{pages:'A', n:1, daily:1},       // Senhor da Era de novo: 1 página da A, 1 por era por dia
    chief50:      {learn:'B', ink:10},             // 1ª vitória sobre o chefe da fase 50: aprende a B + 10 tinta
    /* as 4 abaixo são o TEXTO da tela (js/p_grim.js lê daqui) e o caminho antigo sem teto. No jogo elas entram por onSource() (DATA.sources, com teto
       diário e id único); os números aqui são os MESMOS de DATA.sources (o teste grimoire-fontes confere). */
    instance:     {pagesEra:'B', n:1, ink:3},      // instância diária vencida: 1 página da B da era (se já aprendida) + 3 tinta
    tower:        {ink:5},                         // a cada 10 andares da Torre: 5 tinta
    daily:        {ink:5},                         // missões diárias resgatadas: 1 tinta cada, até 5 por dia
    event:        {pick:true, n:1},                // prêmio de evento resgatado: 1 página da magia que o evento diz
  },
  /* FONTES DO DIA (pedido do PO: o protótipo aprovado GrimorioV3 diz que Instância diária, Torre, Missões diárias e Eventos dão páginas e tinta).
     Entram por onSource(S, host, src, ctx). Quantias PEQUENAS, teto por fonte e teto do dia somado, id único por prêmio (nunca paga 2 vezes).
     CONTA (calibração): o jogador ATIVO vence ~1 era por dia (10 fases). Os chefes dão nesse dia: Senhor da Era 1ª vez 20 tinta + 1 magia (1 página),
     chefe do meio da era 1ª vez 10 tinta + 1 magia (1 página), e ~2 repetições do Senhor da Era (1 página cada) = 30 tinta e 4 páginas por dia.
     Metade disso = 15 tinta e 2 páginas. As 4 fontes somadas, no teto de cada uma, dão 3+5+5+2 = 15 tinta e 1+1 = 2 páginas; o TETO DO DIA corta
     para 12 tinta e 2 páginas (40% da tinta e 50% das páginas dos chefes). Para comparar: subir UMA magia do nível 1 ao 10 custa 65 páginas e
     1.090 de tinta, então as fontes do dia sozinhas levam ~3 meses para isso. No fim do jogo (eras mais lentas) o teto fixo segura o ritmo.
     Tudo fixo, nada sorteado, nada à venda. */
  sources:{
    instance:{pages:1, ink:3, cap:{pages:1, ink:3}},   // por instância vencida (ou varrida): página da B da era só se a B já foi aprendida
    tower:   {ink:5, every:10, cap:{ink:5}},           // só no andar múltiplo de 10 (ctx.floor); outros andares devolvem reason 'skip'
    mission: {ink:1, cap:{ink:5}},                     // por missão DIÁRIA resgatada; o id vale só no dia (o módulo junta o dia ao id)
    event:   {pages:1, ink:2, cap:{pages:1, ink:2}},   // por prêmio de evento: página da magia ctx.spell (pode ensinar, como o grant 'event'); sem ctx.spell, só a tinta
  },
  sourceCap:{pages:2, ink:12},                         // teto do DIA, as 4 fontes somadas
  forbidden:['shop','gems','offer','pack','pay','gacha'],   // fontes RECUSADAS (regra: nada à venda dá poder sorteado; menores jogam)
};
const IDX={}; DATA.spells.forEach((s,i)=>{ IDX[s.id]=i; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const spell=id=>DATA.spells[IDX[id]]||null;
const isMode=m=>DATA.modes.includes(m);
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms); const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,8);
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const fmt1=v=>(Math.round(num(v,0)*10)/10).toFixed(1).replace('.',',');
const zeroB=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.grimoire.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.grimoire; if(!o||typeof o!=='object') o=S.sys.grimoire={};
  o.v=1; o.ink=int0(o.ink);
  const own=(o.own&&typeof o.own==='object')?o.own:{}; o.own={};
  for(const s of DATA.spells){ const x=own[s.id]; if(x&&typeof x==='object') o.own[s.id]={lv:clamp(int0(x.lv)||1,1,DATA.maxLv),pages:int0(x.pages)}; }
  const sets=(o.sets&&typeof o.sets==='object')?o.sets:{}; o.sets={};
  for(const m of DATA.modes){ const a=Array.isArray(sets[m])?sets[m]:[], out=[];
    for(const id of a) if(o.own[id]&&!out.includes(id)&&out.length<DATA.slots) out.push(id);
    o.sets[m]=out; }
  const f=(o.first&&typeof o.first==='object')?o.first:{}; o.first={eraLord:(f.eraLord&&typeof f.eraLord==='object')?f.eraLord:{},chief50:(f.chief50&&typeof f.chief50==='object')?f.chief50:{}};   /* 1ª vitória por era (grant idempotente) */
  const d=(o.day&&typeof o.day==='object')?o.day:{}; o.day={k:typeof d.k==='string'?d.k:'',lord:(d.lord&&typeof d.lord==='object')?d.lord:{}};
  return o;
}
const owned=(S,id)=>!!ensure(S).own[id];
const levelOf=(S,id)=>{ const x=ensure(S).own[id]; return x?x.lv:0; };

/* catálogo para a tela: as 18 com nome, era, efeito e recarga no nível dado (padrão 1) */
function stat(sp,lv){ lv=clamp(int0(lv)||1,1,DATA.maxLv); const f=sp.fx, k=lv-1, o={type:sp.kind,cd:Math.round(sp.cd*(1-DATA.cdStep*k)*10)/10};
  if(sp.kind==='dmg'){ o.mult=Math.min(DATA.dmgCap,f.mult*(1+DATA.dmgStep*k)); o.hits=f.hits.slice(); o.area=!!f.area; if(f.stun) o.stun=f.stun; }
  else if(sp.kind==='heal') o.pct=f.pct*(1+DATA.fxStep*k);
  else if(sp.kind==='shield'){ o.pct=f.pct*(1+DATA.fxStep*k); o.sec=f.sec; }
  else if(sp.kind==='buff'){ o.key=f.key; o.val=f.val*(1+DATA.fxStep*k); o.sec=f.sec; }
  return o; }
function passiveOf(sp,lv){ const P=DATA.passive[sp.passive]; if(!P||!lv) return 0; return P[0]+P[1]*(clamp(lv,1,DATA.maxLv)-1); }
const PNAME={atkPct:'ATQ',hpPct:'Vida',defPct:'Defesa',critPct:'Crítico'};
function effectText(sp,st){ switch(st.type){
  case 'dmg': return `Dano ${fmt1(st.mult*100)}% do ATQ${st.hits.length>1?` em ${st.hits.length} golpes`:''}${st.area?' na fila':''}${st.stun?`, atordoa ${fmt1(st.stun)} s`:''}`;
  case 'heal': return `Cura ${fmt1(st.pct)}% da vida`;
  case 'shield': return `Escudo de ${fmt1(st.pct)}% da vida por ${st.sec} s`;
  case 'buff': return `${st.key==='dodge'?'Esquiva':'Velocidade de ataque'} +${fmt1(st.val)}% por ${st.sec} s`;
  } return ''; }
function catalog(lv){ return DATA.spells.map(sp=>{ const st=stat(sp,lv); return {id:sp.id,era:sp.era,eraName:DATA.eraName[sp.era],name:sp.name,kind:sp.kind,cd:st.cd,
  effect:st,effectText:effectText(sp,st),passiveKey:sp.passive,passive:passiveOf(sp,clamp(int0(lv)||1,1,DATA.maxLv)),desc:sp.desc,
  learn:DATA.learn[DATA.spells.filter(x=>x.era===sp.era)[0].id===sp.id?'A':'B']}; }); }
const letterOf=sp=>DATA.spells.filter(x=>x.era===sp.era)[0].id===sp.id?'A':'B';
const spellOfEra=(era,letter)=>DATA.spells.filter(x=>x.era===clamp(int0(era),0,8))[letter==='B'?1:0];

/* ---------------- ganhar páginas e tinta (só jogando) ---------------- */
const badSrc=src=>DATA.forbidden.includes(String(src||'').toLowerCase());
/* páginas de uma magia: a 1ª ensina (nível 1), as outras guardam para subir. Desligado: recusa (nada é gravado). */
function addPages(S,id,n,src){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'};
  const sp=spell(id); if(!sp) return {ok:false,reason:'spell'}; let k=int0(n); if(!k) return {ok:false,reason:'n'};
  const o=ensure(S); let learned=false; if(!o.own[id]){ o.own[id]={lv:1,pages:0}; k--; learned=true; } o.own[id].pages+=k;
  return {ok:true,id,learned,pages:o.own[id].pages}; }
function addInk(S,n,src){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'}; const k=int0(n); if(!k) return {ok:false,reason:'n'};
  const o=ensure(S); o.ink+=k; return {ok:true,ink:o.ink}; }
/* fontes fixas do jogo. grant(S, host, src, {era, id}) → o que entregou. eraLordRepeat: 1 por era por dia. */
function grant(S,host,src,opt){ if(!on()) return {ok:false,reason:'off'}; if(badSrc(src)) return {ok:false,reason:'forbidden'};
  if(!DATA.grants[src]) return {ok:false,reason:'src'}; opt=opt||{}; const o=ensure(S);
  const era=opt.era!=null?clamp(int0(opt.era),0,8):eraMaxOf(host);
  /* o MÓDULO decide se é a 1ª vitória (pedido do Engenheiro): eraLord repetido vira eraLordRepeat; chief50 só uma vez por era */
  if(src==='eraLord'&&o.first.eraLord[era]) src='eraLordRepeat';
  if(src==='chief50'&&o.first.chief50[era]) return {ok:false,reason:'done'};
  const G=DATA.grants[src], out={ok:true,src,learned:null,pages:null,ink:0};
  if(G.daily){ const k=dayKey(nowOf(host)); if(o.day.k!==k){ o.day.k=k; o.day.lord={}; } if(int0(o.day.lord[era])>=G.daily) return {ok:false,reason:'daily'}; o.day.lord[era]=int0(o.day.lord[era])+1; }
  if(G.learn){ const sp=spellOfEra(era,G.learn); if(!o.own[sp.id]){ addPages(S,sp.id,1,src); out.learned=sp.id; } else { addPages(S,sp.id,1,src); out.pages={id:sp.id,n:1}; } }
  if(G.pages){ const sp=spellOfEra(era,G.pages); const r=addPages(S,sp.id,G.n,src); out.pages={id:sp.id,n:G.n}; if(r.learned) out.learned=sp.id; }
  if(G.pagesEra){ const sp=spellOfEra(era,G.pagesEra); if(o.own[sp.id]){ addPages(S,sp.id,G.n,src); out.pages={id:sp.id,n:G.n}; } }   // só junta página de magia já aprendida
  if(G.pick){ const sp=spell(opt.id); if(!sp) return {ok:false,reason:'spell'}; const r=addPages(S,sp.id,G.n,src); out.pages={id:sp.id,n:G.n}; if(r.learned) out.learned=sp.id; }
  if(G.ink){ o.ink+=G.ink; out.ink=G.ink; }
  if(src==='eraLord') o.first.eraLord[era]=1; if(src==='chief50') o.first.chief50[era]=1;
  changed(host); return out; }

/* FONTES DO DIA: onSource(S, host, src, ctx) com src 'instance' | 'tower' | 'mission' | 'event' e ctx = {id (OBRIGATÓRIO, único por prêmio),
   era (instância: era do nível jogado; padrão = era liberada), floor (Torre: andar vencido), spell (evento: id da magia)}.
   → {ok, src, pages, ink, spell (id da magia que ganhou a página ou null), learned, reason}
   reason: '' pagou (pode ser parte, se o teto cortou) · 'off' chave desligada · 'cap' teto do dia (da fonte ou o somado) · 'dup' este id já pagou
           · 'skip' andar da Torre que não é múltiplo de 10 · 'id' sem ctx.id · 'src' fonte desconhecida. Só grava quando paga algo.
   Os ids pagos ficam guardados no dia e no dia anterior (o resgate perto da meia-noite não paga de novo); a missão diária junta o dia ao id. */
const SRC_IDS=60;   // por dia; com os tetos acima no máximo ~8 ids pagam por dia
function srcDay(o,host){ const k=dayKey(nowOf(host)); let d=(o.src&&typeof o.src==='object')?o.src:{};
  if(d.k!==k){ d={k,prevK:typeof d.k==='string'?d.k:'',prev:(d.ids&&typeof d.ids==='object')?d.ids:{},ids:{},by:{},tot:{pages:0,ink:0}}; }
  if(!d.ids||typeof d.ids!=='object') d.ids={}; if(!d.prev||typeof d.prev!=='object') d.prev={};
  if(!d.by||typeof d.by!=='object') d.by={}; if(!d.tot||typeof d.tot!=='object') d.tot={pages:0,ink:0};
  d.tot.pages=int0(d.tot.pages); d.tot.ink=int0(d.tot.ink); o.src=d; return d; }
function onSource(S,host,src,ctx){ const no=(reason)=>({ok:false,src,pages:0,ink:0,spell:null,learned:false,reason});
  if(!on()) return no('off'); const D=DATA.sources[src]; if(!D) return no('src'); ctx=ctx||{};
  const raw=ctx.id==null?'':String(ctx.id).slice(0,80); if(!raw) return no('id');
  const o=ensure(S), d=srcDay(o,host), id=src+':'+(src==='mission'?d.k+':':'')+raw;
  if(d.ids[id]||d.prev[id]) return no('dup');
  if(src==='tower'){ const f=int0(ctx.floor); if(!f||f%D.every!==0) return no('skip'); }
  const by=d.by[src]=(d.by[src]&&typeof d.by[src]==='object')?d.by[src]:{pages:0,ink:0}; by.pages=int0(by.pages); by.ink=int0(by.ink);
  const C=D.cap||{}, T=DATA.sourceCap;
  /* quanto cabe: o menor entre o que sobra no teto da fonte e no teto do dia */
  const left=k=>Math.max(0,Math.min(int0(C[k])-by[k],int0(T[k])-d.tot[k]));
  let sp=null;
  if(int0(D.pages)>0){
    if(src==='instance'){ const era=ctx.era!=null?clamp(int0(ctx.era),0,8):eraMaxOf(host), b=spellOfEra(era,'B'); if(o.own[b.id]) sp=b; }   // só junta página de magia já aprendida
    else if(src==='event'){ sp=spell(ctx.spell); } }
  const pages=sp?Math.min(int0(D.pages),left('pages')):0, ink=Math.min(int0(D.ink),left('ink'));
  if(!pages&&!ink) return no('cap');
  let learned=false; if(pages){ const r=addPages(S,sp.id,pages,src); learned=!!(r&&r.learned); }
  if(ink) o.ink+=ink;
  by.pages+=pages; by.ink+=ink; d.tot.pages+=pages; d.tot.ink+=ink;
  if(Object.keys(d.ids).length<SRC_IDS) d.ids[id]=1;
  changed(host); return {ok:true,src,pages,ink,spell:pages?sp.id:null,learned,reason:''}; }
/* quanto ainda cabe hoje (para a tela, se quiser mostrar "hoje: 3/12 de tinta") */
function sourceToday(S,host){ const o=ensure(S), d=srcDay(o,host), out={day:d.k,tot:{pages:d.tot.pages,ink:d.tot.ink},cap:Object.assign({},DATA.sourceCap),by:{}};
  for(const k in DATA.sources){ const b=d.by[k]||{}; out.by[k]={pages:int0(b.pages),ink:int0(b.ink),cap:Object.assign({},DATA.sources[k].cap)}; } return out; }

/* ---------------- subir de nível ---------------- */
function levelCost(S,id){ const x=ensure(S).own[id]; if(!x||x.lv>=DATA.maxLv) return null; return {pages:DATA.pages[x.lv-1],ink:DATA.ink[x.lv-1]}; }
function canLevel(S,id){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S), x=o.own[id]; if(!spell(id)) return {ok:false,reason:'spell'}; if(!x) return {ok:false,reason:'notOwned'};
  if(x.lv>=DATA.maxLv) return {ok:false,reason:'max'}; const c=levelCost(S,id);
  if(x.pages<c.pages) return {ok:false,reason:'pages',cost:c}; if(o.ink<c.ink) return {ok:false,reason:'ink',cost:c}; return {ok:true,cost:c}; }
function levelUp(S,id,host){ const c=canLevel(S,id); if(!c.ok) return c; const o=ensure(S), x=o.own[id]; x.pages-=c.cost.pages; o.ink-=c.cost.ink; x.lv++; changed(host); return {ok:true,id,lv:x.lv,cost:c.cost}; }

/* ---------------- conjuntos (Fases / Arena / Chefe) ---------------- */
/* coloca uma magia na posição i (0..2) do conjunto do modo; se ela já estava em outra posição, troca as duas de lugar. id null = tira. */
function equip(S,mode,i,id){ if(!on()) return {ok:false,reason:'off'}; if(!isMode(mode)) return {ok:false,reason:'mode'}; i=int0(i); if(i>=DATA.slots) return {ok:false,reason:'slot'};
  const o=ensure(S), a=o.sets[mode].slice(); while(a.length<DATA.slots) a.push(null);
  if(id==null){ a[i]=null; } else { if(!o.own[id]) return {ok:false,reason:'notOwned'}; const j=a.indexOf(id); if(j>=0) a[j]=a[i]; a[i]=id; }
  o.sets[mode]=a.filter(Boolean); return {ok:true,mode,set:o.sets[mode].slice()}; }
/* troca o conjunto inteiro do modo (até 3, aprendidas, sem repetir) */
function setPreset(S,mode,ids){ if(!on()) return {ok:false,reason:'off'}; if(!isMode(mode)) return {ok:false,reason:'mode'}; const o=ensure(S), out=[];
  for(const id of Array.isArray(ids)?ids:[]){ if(!o.own[id]) return {ok:false,reason:'notOwned',id}; if(!out.includes(id)) out.push(id); }
  if(out.length>DATA.slots) return {ok:false,reason:'tooMany'}; o.sets[mode]=out; return {ok:true,mode,set:out.slice()}; }
/* modo da batalha → conjunto: fase normal = fases; Senhor da Era/chefe/Chefe Mundial = chefe; Arena/Torneio = arena. Conjunto vazio cai no de Fases. */
function modeFor(ctx){ ctx=ctx||{}; if(ctx.pvp||ctx.arena) return 'arena'; if(ctx.boss||ctx.worldBoss) return 'chefe'; return 'fases'; }
/* o que a batalha lança: [{id, name, era, cd, effect:{type, mult, hits, area, stun | pct, sec | key, val, sec}}]. Desligado: []. */
function loadout(S,mode){ if(!on()) return []; const o=ensure(S); let m=isMode(mode)?mode:'fases'; let ids=o.sets[m]; if(!ids.length&&m!=='fases') ids=o.sets.fases;
  return ids.map(id=>{ const sp=spell(id), lv=o.own[id].lv, st=stat(sp,lv); return {id,name:sp.name,era:sp.era,lv,cd:st.cd,effect:st,text:effectText(sp,st)}; }); }

/* LANÇAR na luta (pedido do Engenheiro: o laço só cuida do relógio, do alcance e de aplicar; a regra fica aqui).
   ctx = {atk (ATQ do herói, já com tudo), hpMax, boss, pvp, targets (inimigos em alcance)}.
   → {ok, id, kind, label, color, dmg (dano total), hits:[dano de cada golpe POR ALVO], aoe (acerta todos em alcance), targets, heal, shield:{amount,sec}, stun (s), buff:{key,val,sec}, cd}
   Dano em área é DIVIDIDO entre os alvos (como diz a magia); atordoar no chefe vale a metade (igual aos golpes especiais). */
/* cor da era para a faixa e o efeito da magia (a mesma família de cores dos ícones provisórios) */
const ERA_COLOR=['#ff8a3c','#e0b860','#7aa8ff','#c0503a','#b07a40','#5ee7ff','#a86aff','#ff3a2a','#ffe08a'];
function cast(S,id,ctx){ if(!on()) return {ok:false,reason:'off'}; const o=ensure(S), sp=spell(id); if(!sp) return {ok:false,reason:'spell'}; const x=o.own[id]; if(!x) return {ok:false,reason:'locked'};
  const st=stat(sp,x.lv), c=ctx||{}, atk=Math.max(0,Number(c.atk)||0), hpMax=Math.max(0,Number(c.hpMax)||0), n=Math.max(1,Math.floor(Number(c.targets)||1));
  const out={ok:true,id,kind:sp.kind,label:sp.name,color:ERA_COLOR[sp.era]||'#ffc94a',dmg:0,hits:[],aoe:false,targets:1,heal:0,shield:null,stun:0,buff:null,cd:st.cd};
  if(sp.kind==='dmg'){ const total=atk*st.mult; out.aoe=!!st.area; out.targets=out.aoe?n:1; out.dmg=Math.round(total); const per=out.aoe?total/n:total;
    out.hits=st.hits.map(f=>Math.round(per*f)); if(st.stun) out.stun=c.boss?st.stun*0.5:st.stun; }
  else if(sp.kind==='heal') out.heal=Math.round(hpMax*st.pct/100);
  else if(sp.kind==='shield') out.shield={amount:Math.round(hpMax*st.pct/100),sec:st.sec};
  else if(sp.kind==='buff') out.buff={key:st.key,val:Math.round(st.val*10)/10,sec:st.sec};
  return out; }

/* ---------------- bônus por ter (entra na FC pelo Sys.fc) ---------------- */
function bonus(S){ const b=zeroB(); if(!on()||!S||typeof S!=='object') return b; const o=ensure(S);
  for(const id in o.own){ const sp=spell(id); if(sp) b[sp.passive]+=passiveOf(sp,o.own[id].lv); }
  for(const k in b) b[k]=Math.round(b[k]*1000)/1000; return b; }

/* ---------------- tela ---------------- */
function view(S,host){ const o=ensure(S), b=bonus(S);
  return {on:on(),ink:o.ink,owned:Object.keys(o.own).length,total:DATA.spells.length,slots:DATA.slots,
    sets:DATA.modes.map(m=>({mode:m,name:DATA.modeName[m],ids:o.sets[m].slice()})),
    bonus:b,bonusText:Object.keys(PNAME).filter(k=>b[k]>0).map(k=>`${PNAME[k]} +${fmt1(b[k])}${k==='critPct'?' pts':'%'}`).join(' · '),
    eras:DATA.eraName.map((nm,e)=>({era:e,name:nm,spells:DATA.spells.filter(s=>s.era===e).map(sp=>{ const x=o.own[sp.id], lv=x?x.lv:1, st=stat(sp,lv), c=x?canLevel(S,sp.id):null;
      return {id:sp.id,name:sp.name,owned:!!x,lv:x?x.lv:0,pages:x?x.pages:0,cost:x?levelCost(S,sp.id):null,canLevel:!!(c&&c.ok),max:!!(x&&x.lv>=DATA.maxLv),
        cd:st.cd,effectText:effectText(sp,st),passiveText:`${PNAME[sp.passive]} +${fmt1(passiveOf(sp,lv))}${sp.passive==='critPct'?' pts':'%'}`,
        how:DATA.learn[letterOf(sp)],in:DATA.modes.filter(m=>o.sets[m].includes(sp.id))}; })}))}; }

const API={cast,DATA,on,setOn,ensure,spell,catalog,stat,passiveOf,owned,levelOf,addPages,addInk,grant,onSource,sourceToday,levelCost,canLevel,levelUp,equip,setPreset,modeFor,loadout,bonus,view};
root.Sys=root.Sys||{}; root.Sys.grimoire=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
