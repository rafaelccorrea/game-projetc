/* Eonbound — Sys.evtrail: TRILHA e CHEFE DO EVENTO (tela 24 Eventos; regra do dono via PO: "tudo aprovado tem que funcionar").
   Complementa o Sys.events (da fps-6f, que não é editado aqui): lê o estado do evento e, para dar pontos do chefe, usa Sys.events.addPoints se existir
   (senão soma no mesmo saldo S.sys.events[id].pts, documentado no reports/sys-e2-api.md §5n).
   TRILHA: marcos por PONTOS GANHOS no evento (nunca diminuem: saldo + o que já foi gasto na loja). Cada marco = prêmio FIXO, resgatado uma vez.
   CHEFE: vida COMPARTILHADA por todos os jogadores quando o online abrir (provider do servidor); até lá, vida PESSOAL local (DATA.boss.localHpFc × a FC
   do jogador no 1º ataque do evento). 2 ataques por dia de 30 s; dano = os ATRIBUTOS reais do jogador (regra de coerência: ATK × crítico × velocidade
   × golpes em 30 s, a mesma conta do Sys.fc), pontos do evento por FAIXA de dano (fixos, sem sorteio) e bônus ao derrubar.
   Nada pago, nada sorteado, sem diamante. CHAVE DESLIGADA (DATA.on=false). Estado: S.sys.evtrail[eventoId]. Sem DOM. */
(function(root){
'use strict';
const DATA={
  on:false,
  // por evento (id do Sys.events); o que não estiver aqui usa 'default'
  events:{
    default:{
      trail:[
        {at:50,  reward:{goldk:60},                 name:'Marco 1'},
        {at:100, reward:{forge:10},                 name:'Marco 2'},
        {at:150, reward:{food:30},                  name:'Marco 3'},
        {at:200, reward:{goldk:120, essence:3},     name:'Marco 4'},
        {at:300, reward:{forge:20, food:40},        name:'Marco 5'},
        {at:400, reward:{essence:6, goldk:200},     name:'Marco 6'},
        {at:500, reward:{forge:30, essence:8},      name:'Marco 7'},
        {at:650, reward:{goldk:400, frame:'festival'}, name:'Grande prêmio'},   // moldura do evento (visual)
      ],
      boss:{name:'Devorador do Tempo', art:'era6_boss', attemptsPerDay:2, fightSec:30, localHpFc:60,
        // pontos por ataque pela fração da vida TOTAL do chefe tirada no ataque (local: a vida pessoal)
        bands:[{min:0,pts:10},{min:0.02,pts:15},{min:0.04,pts:20},{min:0.07,pts:25}], killBonus:60},
    },
  },
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ON=()=>DATA.on===true;
const SYS=()=>root.Sys||{};
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const cfg=id=>DATA.events[id]||DATA.events.default;
const dayKey=host=>{ const C=SYS().clock, t=nowOf(host); if(C&&C.dayKey) return C.dayKey(t); const d=new Date(t); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); };
const evDef=id=>{ const E=SYS().events; return E&&E.DATA&&E.DATA.events?E.DATA.events.find(e=>e.id===id)||null:null; };
const evOpen=(id,host)=>{ const E=SYS().events, ev=evDef(id); return !!(E&&E.DATA&&E.DATA.enabled&&ev&&E.phase&&E.phase(ev,host)==='ativo'); };

function ensure(S){ if(!S||typeof S!=='object') throw new Error('Sys.evtrail.ensure: save inválido'); if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.evtrail; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.evtrail={};
  for(const id in o){ const s=o[id]; if(!s||typeof s!=='object'){ delete o[id]; continue; }
    s.got=Array.isArray(s.got)?[...new Set(s.got.map(int0))]:[]; s.hp0=int0(s.hp0); s.dmg=int0(s.dmg); s.day=typeof s.day==='string'?s.day:''; s.att=int0(s.att); s.killed=s.killed===true; s.bossPts=int0(s.bossPts); }
  return o; }
const st=(S,id)=>{ const o=ensure(S); return o[id]||(o[id]={got:[],hp0:0,dmg:0,day:'',att:0,killed:false,bossPts:0}); };

/* ---------------- TRILHA ---------------- */
/* pontos GANHOS no evento = saldo + gasto na loja (o Sys.events guarda as compras por item) */
function earned(S,id){ const E=SYS().events, ev=evDef(id); if(!E||!ev) return 0; let s; try{ s=E.ensure(S)[id]; }catch(e){ s=null; } if(!s) return 0;
  let spent=0; for(const x of ev.shop||[]) spent+=int0(s.buys&&s.buys[x.id])*int0(x.cost); return int0(s.pts)+spent; }
/* {on, earned, next, milestones:[{at, name, reward, reached, claimed}]} */
function trail(S,host,id){ if(!ON()) return {on:false}; const T=cfg(id).trail, e=earned(S,id), s=st(S,id);
  const ms=T.map(m=>({at:m.at,name:m.name,reward:Object.assign({},m.reward),reached:e>=m.at,claimed:s.got.includes(m.at)}));
  return {on:true,earned:e,next:(T.find(m=>e<m.at)||null),milestones:ms,ready:ms.filter(m=>m.reached&&!m.claimed).length}; }
function give(S,host,rw){ const L=SYS().loot, b=Object.assign({},rw); delete b.frame; const out=L&&L.grantBundle?L.grantBundle(S,host,b):{};
  if(rw.frame){ out.frame=rw.frame; } return out; }
/* resgata o marco `at` (com o evento ativo ou na loja). {ok, reason: off|id|points|done|closed, got} */
function claimTrail(S,host,id,at){ if(!ON()) return {ok:false,reason:'off'}; const m=cfg(id).trail.find(x=>x.at===int0(at)); if(!m) return {ok:false,reason:'id'};
  const E=SYS().events, ev=evDef(id); if(!E||!ev||!E.DATA.enabled||!['ativo','loja'].includes(E.phase(ev,host))) return {ok:false,reason:'closed'};
  const s=st(S,id); if(s.got.includes(m.at)) return {ok:false,reason:'done'}; if(earned(S,id)<m.at) return {ok:false,reason:'points',need:m.at};
  s.got.push(m.at); return {ok:true,at:m.at,got:give(S,host,m.reward)}; }

/* ---------------- CHEFE ---------------- */
let provider=null;   // servidor: {online:true, boss(S,host,id) → {hp, hpMax}, attack(S,host,id,dmg) → {ok, hp, killed}}
const setProvider=p=>{ provider=p&&p.online===true?p:null; return !!provider; };
/* dano de um ataque de 30 s com os atributos REAIS (mesma base do Sys.fc: ATK × (1 + crítico × dano crítico) × golpes, golpes = 30 s ÷ intervalo) */
function attackDamage(S,host){ const F=SYS().fc, T=SYS().stats; let a; try{ a=F.stats(S,host); }catch(e){ return 0; }
  const atk=num(a&&a.atk,0), cr=clamp(num(a.critRate,0),0,100)/100, cd=Math.max(0,num(a.critDmg,100))/100;
  const ivl=T&&T.interval?num(T.interval(a),0.8):0.8/(1+Math.max(0,num(a.aspd,0))/100), hits=Math.floor(cfg('').boss.fightSec/Math.max(0.1,ivl));
  return Math.round(atk*(1+cr*cd)*hits); }
/* {on, online, name, hp, hpMax, attemptsLeft, killed, myDamage, bossPts, pts (prévia do próximo ataque)} */
function boss(S,host,id){ if(!ON()) return {on:false}; const B=cfg(id).boss, s=st(S,id), dk=dayKey(host); if(s.day!==dk){ s.day=dk; s.att=0; }
  let hp, hpMax;
  if(provider){ const r=provider.boss(S,host,id)||{}; hp=int0(r.hp); hpMax=Math.max(1,int0(r.hpMax)); }
  else { if(!s.hp0){ const F=SYS().fc; s.hp0=Math.max(1000,Math.round(num(F&&F.compute?F.compute(S,host):0,0)*B.localHpFc)); } hpMax=s.hp0; hp=Math.max(0,hpMax-s.dmg); }
  const dmg=attackDamage(S,host);
  return {on:true,online:!!provider,open:evOpen(id,host),name:B.name,art:B.art,hp,hpMax,attemptsLeft:Math.max(0,B.attemptsPerDay-s.att),killed:s.killed||hp<=0,
    myDamage:s.dmg,bossPts:s.bossPts,nextDamage:dmg,nextPts:ptsFor(B,dmg/hpMax)}; }
const ptsFor=(B,frac)=>{ let p=B.bands[0].pts; for(const b of B.bands) if(frac>=b.min) p=b.pts; return p; };
/* ataca o chefe (evento ATIVO). {ok, reason: off|closed|tries|dead, dmg, pts, killed, hp} — pontos entram no saldo do evento */
function attack(S,host,id){ if(!ON()) return {ok:false,reason:'off'}; if(!evOpen(id,host)) return {ok:false,reason:'closed'};
  const b=boss(S,host,id), B=cfg(id).boss, s=st(S,id); if(b.attemptsLeft<=0) return {ok:false,reason:'tries'}; if(b.killed&&!provider) return {ok:false,reason:'dead'};
  const dmg=b.nextDamage; let hp, killed;
  if(provider){ const r=provider.attack(S,host,id,dmg)||{}; if(!r.ok) return {ok:false,reason:r.reason||'server'}; hp=int0(r.hp); killed=!!r.killed; }
  else { s.dmg+=Math.min(dmg,b.hp); hp=Math.max(0,b.hpMax-s.dmg); killed=hp<=0&&!s.killed; }
  s.att++; let pts=ptsFor(B,dmg/b.hpMax); if(killed){ pts+=B.killBonus; s.killed=true; } s.bossPts+=pts;
  const E=SYS().events; if(E&&typeof E.addPoints==='function') E.addPoints(S,host,id,pts,'boss'); else { try{ const o=E.ensure(S); if(!o[id]) o[id]={pts:0,rep:0,p:{},c:[],buys:{}}; o[id].pts=int0(o[id].pts)+pts; }catch(e){} }
  return {ok:true,dmg,pts,killed,hp,hpMax:b.hpMax,attemptsLeft:b.attemptsLeft-1}; }

const API={DATA,ensure,earned,trail,claimTrail,boss,attack,attackDamage,setProvider};
root.Sys=root.Sys||{}; root.Sys.evtrail=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
