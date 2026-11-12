/* Eonbound — Sys.instances: instâncias diárias por chave (3/dia, renovam à meia-noite local).
   Tipos: Ouro, Equipamentos, Chefe de era, Diamantes. Cada entrada é uma horda cronometrada que a BATALHA executa a partir
   da definição devolvida por start(); o resultado volta por finish(). Dificuldade = era liberada x (Fácil/Normal/Difícil).
   Lógica pura + UI opcional (render/showResult). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-instances.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  entriesPerArea:2,             // dono via PO: 2 entradas POR ÁREA (tipo) por dia, +VIP por área (Sys.vip.perks().instanceKeysAdd). Antes: 3 chaves no total.
  consumeOnFail:false,          // derrota/tempo esgotado não gasta chave
  stagesPerEra:10,
  // at = fase dentro da era usada para os atributos dos inimigos · hp/dmg = multiplicador extra · rw = multiplicador da recompensa
  diffs:[{n:'Fácil',at:3,hp:0.8,dmg:0.8,rw:1,minR:0},{n:'Normal',at:6,hp:1,dmg:1,rw:1.6,minR:0},{n:'Difícil',at:9,hp:1.25,dmg:1.15,rw:2.5,minR:1}],
  order:['gold','gear','boss','gems'],
  types:{
    gold:{n:'Mina de Ouro',  icon:'🪙',img:'assets/ui/coin.png', col:'#ffc94a',mode:'rush', time:45,
      desc:'Derrote o máximo que puder em 45 s', hp:0.6,dmg:0.6, wave:['e0','e1','e0','e1','e0','e1'], spawnGap:0.45,
      reward:{goldPerKill:4, minKills:1}},
    gear:{n:'Arsenal',       icon:'⚔️',img:'assets/ui/chest.png',col:'#b45cff',mode:'clear',time:60,
      desc:'Vença 3 ondas e o chefe em 60 s', hp:1,dmg:1, waves:[['e0','e1','e0','e1'],['e1','e0','e1','e0','e1'],['e0','e1','boss']], spawnGap:0.6,
      reward:{items:3,minR:1,upChance:0.2,goldUnits:20,forge:[3,5,8]}},          // forge por dificuldade (Fácil/Normal/Difícil)
    boss:{n:'Chefe de Era',  icon:'👑',img:null,                 col:'#ff5252',mode:'boss', time:45,
      desc:'Derrote o Senhor da Era em 45 s', hp:1,dmg:1, waves:[['eraBoss']], spawnGap:0.5,
      // ovo de pet: chance por dificuldade e tabela B/R/E/M/L; Lendário só no Difícil (nos outros, soma no Mítico) · ração por dificuldade
      // ajuste do PO após o teste do QA (3 chaves no Difícil davam ~1,2 ovo/dia e 30% de armas Lendárias), versão da fps-30:
      // ovo continua 15/25/40% por vitória, mas NO MÁXIMO 1 ovo de instância por dia (eggDailyCap) · sorte de +1 no DIFÍCIL 30% → 10%
      reward:{items:1,minR:2,upChance:[0.3,0.3,0.1],gems:0,goldUnits:40,egg:{chance:[0.15,0.25,0.40],table:[34,35,18,12,1],legendaryOnlyHard:true},food:[5,7,10]}},
    gems:{n:'Caverna de Cristal',icon:'💎',img:'assets/ui/gem.png',col:'#6fd3ff',mode:'clear',time:50,
      desc:'Vença 4 ondas em 50 s', hp:0.9,dmg:0.9, waves:[['e0','e1','e0'],['e1','e0','e1','e0'],['e0','e1','e0','e1'],['e1','e0','e1','e0','e1']], spawnGap:0.55,
      reward:{gems:3,gemsPerEra:0}},   // corte de 💎 (PO, v0.12.0): era 6 + 2 por era
  },
  activeTimeoutMs:15*60*1000,   // entrada aberta e abandonada (app fechado) expira sem gastar chave
  sweepKills:20,                // abates usados ao varrer a Mina de Ouro sem recorde
  eggDailyCap:1,                // no máximo 1 ovo de pet por dia vindo de instâncias (o 2º e o 3º Chefe de Era do dia dão só ração/ouro)
};
const params={extraKeys:0, rewardMult:1};   // VIP (+2 chaves) e eventos ligam depois

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==="function") return C.dayKey(ms);   // fuso único (Sys.clock.DATA.tzOffsetMin; com servidor, Brasília)
  const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function msToMidnight(ms){ const d=new Date(ms); return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d; }
/* VIP (Sys.vip.perks(S) via Sys.loot.vipPerks): +1 chave por dia (instanceKeysAdd) e +ouro (goldPct) */
const vipOf=S=>{ const L=root.Sys&&root.Sys.loot; return L&&L.vipPerks&&S?L.vipPerks(S):{instanceKeysAdd:0,goldPct:0}; };
/* entradas por ÁREA por dia (cada tipo de instância tem as suas) */
const keysMax=S=>Math.max(0,Math.floor(DATA.entriesPerArea+num(params.extraKeys,0))+vipOf(S).instanceKeysAdd);
const fullKeys=S=>{ const k={}; for(const t of DATA.order) k[t]=keysMax(S); return k; };
const keysLeft=o=>DATA.order.reduce((s,t)=>s+int0(o.keys[t]),0);
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const eraMaxOf=host=>clamp(Math.floor(num(host&&host.eraMax&&host.eraMax(),0)),0,99);
// níveis VISÍVEIS (seletor): 3 por era liberada. Cada um só ABRE quando o jogador alcança a fase que ele usa (PO: Fácil 3, Normal 6, Difícil 9 da era).
const levelsUnlocked=host=>(eraMaxOf(host)+1)*DATA.diffs.length;
function levelInfo(L){ const nd=DATA.diffs.length, era=Math.floor(L/nd), d=L%nd, D=DATA.diffs[d];
  return {level:L,era,d,diff:D,stage:era*DATA.stagesPerEra+D.at}; }
/* maior fase já alcançada (host.best() se o jogo expuser; senão a fase atual) */
const bestStage=host=>Math.max(1,num(host&&host.best&&host.best(),0),num(host&&host.stage&&host.stage(),1));
const isOpen=(host,L)=>Number.isInteger(L)&&L>=0&&L<levelsUnlocked(host)&&levelInfo(L).stage<=bestStage(host);

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.instances.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.instances; if(!o||typeof o!=='object') o=S.sys.instances={};
  o.v=1; if(typeof o.day!=='string') o.day='';
  // save antigo (número = chaves no total) ou lixo: todas as áreas cheias. Novo: {gold, gear, boss, gems}.
  if(!o.keys||typeof o.keys!=='object'||Array.isArray(o.keys)) o.keys=fullKeys(S);
  for(const t of DATA.order) o.keys[t]=clamp(Math.floor(num(o.keys[t],keysMax(S))),0,99); for(const k in o.keys) if(!DATA.types[k]) delete o.keys[k];
  if(!o.best||typeof o.best!=='object') o.best={}; if(!o.bestKills||typeof o.bestKills!=='object') o.bestKills={};
  for(const k in o.best) if(!DATA.types[k]||!Number.isInteger(o.best[k])) delete o.best[k];
  o.runs=Math.max(0,Math.floor(num(o.runs,0))); o.eggs=Math.max(0,Math.floor(num(o.eggs,0)));   // ovos de instância hoje
  if(o.active&&(typeof o.active!=='object'||!DATA.types[o.active.type])) o.active=null; if(o.active===undefined) o.active=null;
  return o;
}
/* virada do dia: chaves voltam para o máximo (não acumulam de um dia para o outro). Chamado por todas as funções com host. */
function refresh(S,host){
  const o=ensure(S), now=nowOf(host), k=dayKey(now);
  if(o.day!==k){ o.day=k; o.keys=fullKeys(S); o.eggs=0; }
  if(o.active&&now-num(o.active.at,0)>DATA.activeTimeoutMs) o.active=null;
  return o;
}
const onDayChange=(S,host)=>refresh(S,host);

/* nível recomendado: o mais alto cuja fase não passa da fase atual do jogador */
function recommended(S,host){
  const st=Math.max(1,num(host&&host.stage&&host.stage(),1)); let best=0;
  for(let L=0;L<levelsUnlocked(host);L++) if(levelInfo(L).stage<=st) best=L;
  return best;
}
const unitAt=(host,stage)=>Math.max(1,num(host&&host.goldUnit&&host.goldUnit(stage),1));

/* prévia da recompensa (para a UI e para start). kills só importa na Mina de Ouro. */
function rewardPreview(type,L,host,kills){
  const T=DATA.types[type], I=levelInfo(L), R=T.reward, rw=I.diff.rw*num(params.rewardMult,1), u=unitAt(host,I.stage), out={gold:0,gems:0,items:0,minR:0};
  if(T.mode==='rush') out.gold=Math.round(u*R.goldPerKill*rw*Math.max(0,num(kills,DATA.sweepKills)));
  if(R.goldUnits) out.gold=Math.round(u*R.goldUnits*rw);
  if(R.gems) out.gems=Math.round((R.gems+num(R.gemsPerEra,0)*I.era)*rw);   // Cristal: 3 x dificuldade (gemsPerEra 0 desde o corte da v0.12.0)
  if(R.items){ out.items=R.items; out.minR=Math.max(R.minR||0,(R.minR||0)+I.diff.minR); }
  out.forge=R.forge?num(R.forge[I.d],0):0; out.food=R.food?num(R.food[I.d],0):0;
  out.eggChance=R.egg?num(R.egg.chance[I.d],0):0;
  return out;
}
/* tabela do ovo da instância para a dificuldade d (Lendário só no Difícil; nos outros, o peso vai para o Mítico) */
function eggTable(R,d){ const t=R.egg.table.slice(); if(R.egg.legendaryOnlyHard&&d<DATA.diffs.length-1){ t[3]+=t[4]; t[4]=0; } return t; }

function canEnter(S,host,type,L){
  const o=refresh(S,host);
  if(!DATA.types[type]) return {ok:false,reason:'tipo'};
  if(!Number.isInteger(L)||L<0||L>=levelsUnlocked(host)) return {ok:false,reason:'nivel'};
  if(!isOpen(host,L)) return {ok:false,reason:'bloqueado',unlockAt:levelInfo(L).stage};
  if(int0(o.keys[type])<1) return {ok:false,reason:'chave'};
  return {ok:true};
}
/* definição da horda cronometrada para a batalha executar */
function buildRun(type,L,host){
  const T=DATA.types[type], I=levelInfo(L), hp=T.hp*I.diff.hp, dmg=T.dmg*I.diff.dmg;
  const mk=k=>k==='eraBoss'?{kind:'boss',eraBoss:true,hpMult:hp,dmgMult:dmg}:{kind:k,eraBoss:false,hpMult:hp,dmgMult:dmg};
  const waves=T.mode==='rush'?[T.wave.map(mk)]:T.waves.map(w=>w.map(mk));
  return {type,name:T.n,level:L,era:I.era,diff:I.d,diffName:I.diff.n,stage:I.stage,mode:T.mode,time:T.time,
    waves,loop:T.mode==='rush',spawnGap:T.spawnGap,noNormalLoot:true,noChest:true,
    goal:T.mode==='rush'?'kills':T.mode==='boss'?'boss':'clear',reward:rewardPreview(type,L,host)};
}
/* começa uma entrada (a chave só é gasta no finish com vitória, salvo consumeOnFail) */
function start(S,host,type,L){
  const c=canEnter(S,host,type,L); if(!c.ok) return c;
  const o=refresh(S,host), id=`${type}-${L}-${nowOf(host)}`;
  o.active={id,type,level:L,at:nowOf(host)};
  const run=buildRun(type,L,host); run.id=id; return {ok:true,run};
}
function rollItems(host,n,minR,upChance,era,source){
  const L=root.Sys&&root.Sys.loot, rng=rngOf(host), out=[];
  for(let i=0;i<n;i++){
    if(L) out.push(L.rollItem(host,{era,minR,upChance,source}));
    else out.push({slot:rng()<.5?'weapon':'armor',r:Math.min(4,minR+(rng()<upChance?1:0)),e:era});
  }
  return out;
}
/* XP da instância (só na vitória e no varrer): Sys.level.onInstance(S, host, mult) da fps-e2, com mult = multiplicador da dificuldade
   (Fácil 1 · Normal 1,6 · Difícil 2,5, o mesmo das outras recompensas). Os tipos dão a mesma XP. Ao subir de nível, solta os ovos de marco. */
function giveXp(S,host,L,reward){
  const Lv=root.Sys&&root.Sys.level; if(!Lv||typeof Lv.onInstance!=='function') return;
  const r=Lv.onInstance(S,host,levelInfo(L).diff.rw*num(params.rewardMult,1));
  reward.xp=r?num(r.gained,0):0; reward.levelUp=r&&r.levels>0?r:null;
  const Lo=root.Sys&&root.Sys.loot; if(Lo&&Lo.releaseHeld&&reward.levelUp) reward.released=Lo.releaseHeld(S,host);
}
function grantReward(S,host,type,L,kills){
  const T=DATA.types[type], I=levelInfo(L), p=rewardPreview(type,L,host,kills);
  const up=Array.isArray(T.reward.upChance)?num(T.reward.upChance[I.d],0):num(T.reward.upChance,0);   // pode variar por dificuldade
  const items=p.items?rollItems(host,p.items,p.minR,up,I.era,type==='boss'?'eraBossInst':'arsenal'):[];   // asa: fonte principal = Chefe de Era
  p.gold=Math.round(p.gold*(1+vipOf(S).goldPct/100));   // VIP +ouro
  if(p.gold&&host.addGold) host.addGold(p.gold); if(p.gems&&host.addGems) host.addGems(p.gems);
  const Lx=root.Sys&&root.Sys.loot;
  for(const it of items) if(host.addItem) host.addItem(Lx&&Lx.itemOut?Lx.itemOut(it):{slot:it.slot,r:it.r,e:it.e,subs:[]});
  // materiais e ovo: pelo Sys.loot (conta a pedra na missão do dia e entrega a Sys.forge / Sys.pet, ou deixa pendente)
  const Lo=root.Sys&&root.Sys.loot, rng=rngOf(host), R=T.reward;
  if(Lo){ Lo.addMat(S,host,'forge',p.forge); Lo.addMat(S,host,'food',p.food);
    if(type==='boss'&&Lo.DATA.essence){ p.essence=num(Lo.DATA.essence.instance[I.d],0); Lo.addMat(S,host,'essence',p.essence); } }   // Essência da Era no Chefe de Era
  else { const F=root.Sys&&root.Sys.forge, P=root.Sys&&root.Sys.pet; if(p.forge&&F&&F.addStones) F.addStones(S,p.forge,host); if(p.food&&P&&P.addFood) P.addFood(S,p.food,host); }
  let egg=-1, hatched=null; const st=refresh(S,host);
  if(R.egg&&st.eggs<DATA.eggDailyCap&&rng()<p.eggChance){
    st.eggs++;
    const w=eggTable(R,I.d), tot=w.reduce((s,x)=>s+x,0); let x=rng()*tot; egg=0; for(let i=0;i<w.length;i++){ x-=w[i]; egg=i; if(x<=0) break; }
    if(Lo&&Lo.capEggR) egg=Lo.capEggR(host,egg);   // portão de raridade (Mítico/Lendário pelo nível e era do jogador)
    // source 'instance': repetido em 5★ não sobe de raridade (v5.2, regra aplicada no pet.js)
    if(Lo) hatched=Lo.addEgg(S,host,egg,'instance'); else { const P=root.Sys&&root.Sys.pet; hatched=P&&P.addEgg?P.addEgg(S,host,{r:egg,source:'instance'}):null; }
  }
  return {gold:p.gold,gems:p.gems,items,forge:p.forge,food:p.food,essence:p.essence||0,egg,hatched};
}
/* resultado da batalha: result = {win, kills}. Na Mina de Ouro vence quem fizer >= minKills abates. */
function finish(S,host,id,result){
  const o=refresh(S,host), a=o.active;
  if(!a||a.id!==id) return {ok:false,reason:'sem_entrada'};
  result=result||{}; const T=DATA.types[a.type], kills=Math.max(0,Math.floor(num(result.kills,0)));
  const win=T.mode==='rush'?kills>=T.reward.minKills:!!result.win;
  o.active=null;
  if(!win){ if(DATA.consumeOnFail&&o.keys[a.type]>0) o.keys[a.type]--; return {ok:true,win:false,type:a.type,level:a.level,reward:{gold:0,gems:0,items:[]},keys:o.keys[a.type]}; }
  o.keys[a.type]=Math.max(0,o.keys[a.type]-1); o.runs++;
  o.best[a.type]=Math.max(num(o.best[a.type],-1),a.level);
  if(T.mode==='rush') o.bestKills[a.type+'@'+a.level]=Math.max(num(o.bestKills[a.type+'@'+a.level],0),kills);
  const reward=grantReward(S,host,a.type,a.level,kills);
  giveXp(S,host,a.level,reward);
  if(a.type==='boss'){ const Lo=root.Sys&&root.Sys.loot; if(Lo&&Lo.prismBoss) reward.prism=Lo.prismBoss(S,host,levelInfo(a.level).era); }   // Prismático: chefe da era 8+ (fps-e2)
  return {ok:true,win:true,type:a.type,level:a.level,kills,reward,keys:o.keys[a.type]};
}
function abort(S){ const o=ensure(S); o.active=null; }
/* varrer: repete na hora um nível já vencido, gastando 1 chave (Mina de Ouro usa o recorde de abates daquele nível) */
function canSweep(S,host,type,L){ const o=refresh(S,host); return !!DATA.types[type]&&isOpen(host,L)&&num(o.best[type],-1)>=L&&int0(o.keys[type])>0; }
function sweep(S,host,type,L){
  if(!canSweep(S,host,type,L)) return {ok:false,reason:'varrer'};
  const o=refresh(S,host); o.keys[type]--; o.runs++;
  const kills=DATA.types[type].mode==='rush'?num(o.bestKills[type+'@'+L],DATA.sweepKills):0;
  const reward=grantReward(S,host,type,L,kills);
  giveXp(S,host,L,reward);
  return {ok:true,win:true,sweep:true,type,level:L,kills,reward,keys:o.keys[type]};
}
/* keys = {gold, gear, boss, gems} (restantes por área) · max = por área · total/totalMax = soma (selo) */
function status(S,host){ const o=refresh(S,host); return {keys:Object.assign({},o.keys),max:keysMax(S),total:keysLeft(o),totalMax:keysMax(S)*DATA.order.length,resetMs:msToMidnight(nowOf(host)),best:Object.assign({},o.best),active:o.active}; }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
function advice(S,host){ const st=status(S,host); return st.total?[{id:'instances',label:`Instâncias: ${st.total} entrada${st.total>1?'s':''}`,delta:{},cost:'🔑',ready:true,tab:'instances'}]:[]; }

/* ---------------- UI opcional: seleção (grade 2x2, sem scroll) ----------------
   host opcional: eraName(e), fmt(n), toast(msg), onChange(), sfx(name), itemName(it), rarColor(r), rarName(r)
   opts.onStart(run) → a batalha executa a horda; opts.onResult(out) → depois de varrer */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtN=(host,n)=>host.fmt?host.fmt(n):String(n);
const eraN=(host,e)=>(host.eraName&&host.eraName(e))||('Era '+(e+1));
function hm(ms){ const h=Math.floor(ms/3600000), m=Math.floor(ms%3600000/60000); return `${h}h ${pad(m)}m`; }
function rwText(host,p){ const a=[]; if(p.gold) a.push(`${fmtN(host,p.gold)} 🪙`); if(p.gems) a.push(`${p.gems} 💎`);
  if(p.items) a.push(`${p.items} item${p.items>1?'s':''}${p.minR?' '+((host.rarName&&host.rarName(p.minR))||('R'+p.minR))+'+':''}`);
  if(p.forge) a.push(`${p.forge} 🔨`); if(p.food) a.push(`${p.food} 🍖`); if(p.eggChance) a.push(`🥚 ${Math.round(p.eggChance*100)}%`);
  return a.join(' · '); }

function render(el,S,host,opts){
  if(!el) return; opts=opts||{}; const st=status(S,host), nL=levelsUnlocked(host);
  const sel=el._sysInstSel=el._sysInstSel||{}; const rec=recommended(S,host);
  const cards=DATA.order.map(t=>{ const T=DATA.types[t]; if(sel[t]==null||sel[t]>=nL) sel[t]=Math.min(rec,nL-1);
    const L=sel[t], I=levelInfo(L), p=rewardPreview(t,L,host), done=num(st.best[t],-1)>=L, sw=canSweep(S,host,t,L), open=isOpen(host,L);
    return `<div class="sys-card sys-inst-card" data-t="${t}" style="--c:${T.col}">
      <div class="sys-inst-hd">${T.img?`<img src="${T.img}" alt="" onerror="this.replaceWith('${T.icon}')">`:`<span>${T.icon}</span>`}<b>${esc(T.n)}</b></div>
      <div class="sys-inst-ds">${esc(T.desc)}</div>
      <div class="sys-pg"><button type="button" data-a="prev" aria-label="Nível anterior" ${L<=0?'disabled':''}>‹</button>
        <span>${esc(eraN(host,I.era))}<br><small>${open?'':'🔒 '}${esc(I.diff.n)}${done?' ✓':''}</small></span>
        <button type="button" data-a="next" aria-label="Próximo nível" ${L>=nL-1?'disabled':''}>›</button></div>
      <div class="sys-inst-rw">${T.mode==='rush'?'≈ ':''}${esc(rwText(host,p))}${T.mode==='rush'?' <small>(20 abates)</small>':''}</div>
      <div class="sys-inst-bt">${open?`<button type="button" class="sys-btn" data-a="go" ${int0(st.keys[t])<1?'disabled':''}>Entrar 🔑 ${int0(st.keys[t])}/${st.max}</button>`:`<button type="button" class="sys-btn dim" disabled>🔒 Libera na fase ${I.stage}</button>`}
        ${done?`<button type="button" class="sys-btn alt" data-a="sweep" ${sw?'':'disabled'}>Varrer</button>`:''}</div></div>`; }).join('');
  el.innerHTML=`<div class="sys-inst">
    <div class="sys-inst-top"><b>🏰 Instâncias</b><span>🔑 <b>${st.total}/${st.totalMax}</b> · renova em ${hm(st.resetMs)}</span></div>
    <div class="sys-grid sys-inst-grid">${cards}</div></div>`;
  if(!el._sysInst){ el._sysInst=true;
    el.addEventListener('click',ev=>{
      const b=ev.target.closest('[data-a]'); if(!b||b.disabled) return; const card=b.closest('[data-t]'); if(!card) return;
      const t=card.dataset.t, a=b.dataset.a, s=el._sysInstSel, cur=el._sysInstArgs;
      if(a==='prev') s[t]=Math.max(0,s[t]-1);
      else if(a==='next') s[t]=Math.min(levelsUnlocked(cur.host)-1,s[t]+1);
      else if(a==='go'){ const r=start(cur.S,cur.host,t,s[t]);
        if(!r.ok){ cur.host.toast&&cur.host.toast(r.reason==='chave'?'Sem chaves hoje. Renovam à meia-noite.':r.reason==='bloqueado'?`Libera na fase ${r.unlockAt}.`:'Não dá para entrar agora.'); }
        else { cur.host.sfx&&cur.host.sfx('ui_tap'); if(cur.opts.onStart) cur.opts.onStart(r.run); else cur.host.toast&&cur.host.toast('Instância pronta: a batalha precisa ligar onStart.'); } }
      else if(a==='sweep'){ const r=sweep(cur.S,cur.host,t,s[t]); if(r.ok){ cur.host.sfx&&cur.host.sfx('claim'); cur.host.onChange&&cur.host.onChange();
        if(cur.opts.onResult) cur.opts.onResult(r); else showResult(el.closest&&el.closest('#app')||document.body,r,cur.host); } }
      render(el,cur.S,cur.host,cur.opts);
    });
  }
  el._sysInstArgs={S,host,opts};
}
/* janela de resultado (vitória/derrota) */
function showResult(container,out,host){
  if(!container||!out) return null; const T=DATA.types[out.type]||{n:'Instância'}, rw=out.reward||{gold:0,gems:0,items:[]};
  const its=(rw.items||[]).map(it=>{ const c=(host.rarColor&&host.rarColor(it.r))||'#fff';
    return `<div class="sys-chest-it" style="--c:${c}"><div class="sys-chest-th">${it.slot==='weapon'?'🗡️':'🛡️'}</div><div class="sys-chest-nm">${esc((host.itemName&&host.itemName(it))||(it.slot==='weapon'?'Arma':'Armadura'))}</div></div>`; }).join('');
  const ov=document.createElement('div'); ov.className='sys-chest-ov'+(container===document.body?' fixed':'');
  ov.innerHTML=`<div class="sys-chest-box" role="dialog" aria-label="Resultado da instância">
    <div class="sys-chest-top"><b>${out.win?(out.sweep?'Varrido!':'Vitória!'):'Não foi dessa vez'}</b></div>
    <div class="sys-inst-res">${esc(T.n)}${out.kills?` · ${out.kills} abates`:''}${out.win?'':'<br><small>A chave não foi gasta.</small>'}</div>
    ${its?`<div class="sys-chest-items" style="--n:${rw.items.length}">${its}</div>`:''}
    ${out.win?`<div class="sys-chest-extra">${esc(rwText(host,{gold:rw.gold,gems:rw.gems,items:0,forge:rw.forge,food:rw.food}))}${rw.egg>=0?` · 🥚 Ovo ${esc((host.rarName&&host.rarName(rw.egg))||'')}!`:''}</div>`:''}
    <div class="sys-chest-row"><button type="button" class="sys-btn" data-k="ok">OK</button></div></div>`;
  ov.addEventListener('click',ev=>{ if(ev.target.closest('[data-k]')) ov.remove(); });
  container.appendChild(ov); return ov;
}

const API={DATA,params,ensure,refresh,onDayChange,dayKey,keysMax,levelInfo,levelsUnlocked,isOpen,bestStage,recommended,rewardPreview,canEnter,buildRun,start,finish,abort,canSweep,sweep,status,bonus,advice,render,showResult};
root.Sys=root.Sys||{}; root.Sys.instances=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
