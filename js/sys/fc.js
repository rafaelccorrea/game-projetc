/* Eonbound — Sys.fc: soma os bônus de todos os módulos Sys e calcula a FC (força de combate) única do HUD,
   mais o painel "Como ficar mais forte". Lógica pura + render opcional. Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-fc.md
   Convenção de bônus (todos os módulos): PONTOS PERCENTUAIS. {atkPct:5} = +5% de ATK; critPct = pontos de chance de crítico;
   defPct = % de redução do dano recebido; goldPct = % de ouro; fc = FC plana somada no fim. */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  viewOn:true,     // escala de EXIBIÇÃO da FC (×VIEW.k) LIGADA (12/11: a varredura das telas fechou: painéis 599be94, QA d7b3b49, engenheiro 4e35bc7)
  wAtk:5,         // peso do ATK na FC (no jogo o HP base é ~5x o ATK: 100 x 5 + 8 x 40 por raridade)
  wHp:1,           // peso do HP
  wDef:5,          // peso da DEF plana na parte de vida (colete Básico era 0: 4 DEF ≈ 20 de HP). PROVISÓRIO: a v7 calibra.
  baseCrit:12,     // chance de crítico do próprio jogo, em pontos % (BAL.critChance = 0.12)
  critMult:2,      // multiplicador do crítico do jogo (BAL.critMult)
  maxCrit:75,      // teto da chance de crítico somada (pontos %)
  maxDef:60,       // teto da redução de dano (%)
  maxPetShare:0.25,// FC do pet <= 25% da FC do herói => <= 20% da FC total (reports/spec-pet-fc.md)
  maxAdvice:12,    // máximo de dicas no painel
  // atalhos fixos do painel (aparecem mesmo sem advice do módulo). tab = aba/painel que o jogo abre com host.goTab(tab)
  guide:[
    {id:'gear',     icon:'🗡️', label:'Melhorar e trocar equipamento', tab:'gear'},
    {id:'summon',   icon:'🔮', label:'Invocar equipamentos',          tab:'summon'},
    {id:'practice', icon:'🪨', label:'Práticas (pedras de treino)',   tab:'practice'},
    {id:'titles',   icon:'🎖️', label:'Títulos',                       tab:'titles'},
    {id:'tower',    icon:'🗼', label:'Torre',                         tab:'tower'},
    {id:'arena',    icon:'⚔️', label:'Arena',                         tab:'arena'},
  ],
};
// petAtk / petHp: participação do pet em pontos % (dano próprio e cura). NÃO se aplicam ao ATK/HP do herói:
// o golpe e a cura do pet são da batalha (stats().pet); aqui só entram na FC, travados em maxPetShare.
// petBond: vínculo do pet (+HP real do herói na batalha), mas na FC conta como parte DO PET, dentro da mesma trava.
// petCap: teto da parte do pet (fração da FC do herói) quando o PET equipado tem teto próprio (Prismático: 1/3); 0 = o padrão maxPetShare
const KEYS=['atkPct','hpPct','goldPct','critPct','defPct','fc','petAtk','petHp','petBond','petCap'];
const SKIP={fc:1,host:1,stats:1};  // entradas de Sys que não são módulos de bônus (stats calcula atributos, não soma %)

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const zero=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0,petAtk:0,petHp:0,petBond:0,petCap:0});
const sysRoot=()=>root.Sys||{};
/* números: o formatador único Sys.stats.abbr (vírgula, até o quintilhão, sufixos em português com a chave ptNum); sem ele, o antigo abaixo */
/* ESCALA DE EXIBIÇÃO DA FC (ordem do dono: o jogador SENTE o poder crescer rápido; Nv 20 ≈ 700 mil). SÓ VISUAL: o equilíbrio, a curva, as lutas e as
   comparações usam a FC real. Constante ÚNICA (não cresce com o nível) para que jogador × recomendado × ranking × inimigo fiquem na MESMA escala.
   Toda tela que mostra FC usa view()/viewText(); o +/− do delta já sai na escala. Atributos (ATK/Vida) seguem reais. */
/* CHAVE ÚNICA Sys.fc.DATA.viewOn (pedido do engenheiro): desligada, view() devolve a FC REAL e nada muda na tela; cada sessão troca as suas telas
   para viewText() sem efeito visível e o engenheiro liga tudo de uma vez quando a varredura fechar. Abreviação = Sys.stats.abbr (K/M/B, ou
   mil/mi/bi com a chave ptNum): o MESMO padrão de moedas e dano. */
const VIEW={k:31};
const viewK=()=>DATA.viewOn===true?VIEW.k:1;
const view=fc=>Math.round(num(fc,0)*viewK());
const viewText=fc=>fmt(view(fc));
function fmt(n){ const T=sysRoot().stats; if(T&&typeof T.abbr==='function') return T.abbr(n).replace('−','-');
  n=num(n,0); const a=Math.abs(n), s=n<0?'-':'';
  return s+(a>=1e12?(a/1e12).toFixed(1)+'T':a>=1e9?(a/1e9).toFixed(1)+'B':a>=1e6?(a/1e6).toFixed(1)+'M':a>=1e3?(a/1e3).toFixed(1)+'k':Math.floor(a)+''); }
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function clean(b){ const o=zero(); if(b&&typeof b==='object') for(const k of KEYS) o[k]=num(b[k],0); return o; }
function add(t,b){ for(const k of KEYS) t[k]+=b[k]; return t; }

/* módulos registrados em window.Sys que expõem bonus(S) (inclui módulos futuros: VIP, montaria...) */
function modules(){ const sys=sysRoot(), out=[];
  for(const id of Object.keys(sys)){ if(SKIP[id]) continue; const m=sys[id]; if(m&&typeof m.bonus==='function') out.push({id,m}); }
  return out; }

/* bônus de cada módulo, já validado (um módulo com erro conta como zero e não derruba a FC) */
function sources(S){ return modules().map(({id,m})=>{ let b; try{ b=m.bonus(S); }catch(e){ b=null; }
  return {id,label:(m.DATA&&m.DATA.label)||m.label||id,icon:(m.DATA&&m.DATA.icon)||m.icon||'',bonus:clean(b)}; }); }

/* soma de todos os bônus. opts: {extra:{...} somado, skip:'id' ignora um módulo} */
function total(S,opts){ opts=opts||{}; const t=zero();
  for(const s of sources(S)) if(s.id!==opts.skip) add(t,s.bonus);
  if(opts.extra) add(t,clean(opts.extra));
  return t; }

/* atributos finais (regras novas do dono): atk, hp, def (planos) · critRate, critDmg, aspd (%).
   Com o Sys.stats carregado e host.equipped(), vêm dos 7 espaços + nível do jogador; senão, de host.atk()/hp() (modo antigo).
   `crit` é sinônimo de critRate (compatibilidade). opts.extra pode trazer atk/hp planos (dicas), somados antes dos %. */
function stats(S,host,opts){ opts=opts||{}; const b=total(S,opts), x=opts.extra||{}, T=sysRoot().stats;
  const pct={atkPct:b.atkPct,hpPct:b.hpPct,defPct:b.defPct,critPct:b.critPct,petBond:b.petBond,atk:num(x.atk,0),hp:num(x.hp,0)};
  let a;
  if(T&&typeof T.compute==='function') a=T.compute(S,host,pct,opts.item?{item:opts.item,atLevel:opts.atLevel,remove:!!opts.remove}:null);
  else { const atk0=Math.max(0,num(host&&host.atk&&host.atk(),0)+pct.atk), hp0=Math.max(0,num(host&&host.hp&&host.hp(),0)+pct.hp);
    a={atk:atk0*Math.max(0,1+b.atkPct/100), hp:hp0*Math.max(0,1+(b.hpPct+b.petBond)/100), hpNoPet:hp0*Math.max(0,1+b.hpPct/100), def:0,
       critRate:clamp(DATA.baseCrit+b.critPct,0,DATA.maxCrit), critDmg:(DATA.critMult-1)*100, aspd:0}; }
  // GOLPES ESPECIAIS (Sys.strikes, chave desligada): só com a chave ligada o campo strikes existe; desligada, nada muda (parts igual byte a byte)
  const K=sysRoot().strikes; if(K&&typeof K.on==='function'&&K.on()&&typeof K.totals==='function'){ try{ const t=K.totals(S,host,opts.item?{item:opts.item,remove:!!opts.remove}:null); if(t) a.strikes=t; }catch(e){} }
  return Object.assign(a,{ crit:a.critRate, goldMult:Math.max(0,1+b.goldPct/100), flat:b.fc, bonus:b,
    // para a batalha: golpe do pet = ATK final x pet.atk x 2,0/0,8 a cada 2 s; cura por onda = HP x pet.heal
    pet:{atk:Math.max(0,b.petAtk/100), heal:Math.max(0,b.petHp/100)} }); }

/* FC = função ÚNICA de todos os atributos (a mesma em todo o jogo, inclusive torre e ranking):
   parteATK = ATK × wAtk × (1 + chance crít × dano crít) × (1 + vel. de ataque); parteVida = HP × wHp + DEF × wDef;
   pet = parteATK × dano do pet + vida que o pet deu + parteVida × cura, travado em maxPetShare do herói. */
function parts(st){ const cr=clamp(num(st.critRate,num(st.crit,0)),0,100)/100, cd=Math.max(0,num(st.critDmg,(DATA.critMult-1)*100))/100, sp=Math.max(0,num(st.aspd,0))/100;
  let a=Math.max(0,num(st.atk,0))*DATA.wAtk*(1+cr*cd)*(1+sp), d=Math.max(0,num(st.def,0))*DATA.wDef;
  let hAll=Math.max(0,num(st.hp,0))*DATA.wHp+d, h=num(st.hpNoPet,num(st.hp,0))*DATA.wHp+d; const p=st.pet||{atk:0,heal:0};
  if(st.strikes){ const K=sysRoot().strikes, f=K&&typeof K.fcFactor==='function'?K.fcFactor(st.strikes):{atk:1,hp:1}; a*=f.atk; hAll*=f.hp; h*=f.hp; }   // golpes especiais (só ligado)
  // pet = golpe (parte de ATK) + vínculo (HP que o pet deu) + cura (sobre o HP com vínculo), tudo travado em maxPetShare do herói
  const cap=st.bonus&&st.bonus.petCap>0?st.bonus.petCap:DATA.maxPetShare;   // teto POR PET (Revisão 4)
  const pet=Math.min(cap*(a+h),a*num(p.atk,0)+(hAll-h)+hAll*num(p.heal,0));
  return {atk:a,hp:h,pet,flat:num(st.flat,0)}; }
function fcOfStats(st){ const p=parts(st); return Math.max(0,Math.round(p.atk+p.hp+p.pet+p.flat)); }
function compute(S,host,opts){ return fcOfStats(stats(S,host,opts)); }

/* quanto cada módulo soma à FC hoje (FC com ele - FC sem ele), maior primeiro */
function breakdown(S,host){ const now=compute(S,host);
  return sources(S).map(s=>({id:s.id,label:s.label,icon:s.icon,bonus:s.bonus,fc:now-compute(S,host,{skip:s.id})}))
    .filter(s=>s.fc!==0||KEYS.some(k=>s.bonus[k]!==0)).sort((a,b)=>b.fc-a.fc); }

/* "Como ficar mais forte": junta advice() dos módulos (+ host.advice() opcional) e converte delta em ganho de FC.
   Ordem: o que dá para fazer AGORA primeiro, depois pelo maior ganho. */
function advice(S,host,limit){
  const now=compute(S,host), out=[];
  const push=(it,mod)=>{ if(!it||typeof it!=='object') return;
    const gain=it.delta?compute(S,host,{extra:it.delta})-now:Math.max(0,num(it.gain,0));
    out.push({id:String(it.id||mod),module:mod,icon:it.icon||'',label:String(it.label||mod),cost:it.cost||'',ready:!!it.ready,
      tab:it.tab||mod,gain,pct:now>0?gain/now*100:0}); };
  for(const {id,m} of modules()){ if(typeof m.advice!=='function') continue; let a; try{ a=m.advice(S,host); }catch(e){ a=null; }
    if(Array.isArray(a)) a.forEach(it=>push(it,id)); }
  if(host&&typeof host.advice==='function'){ let a; try{ a=host.advice(S); }catch(e){ a=null; } if(Array.isArray(a)) a.forEach(it=>push(it,'game')); }
  out.sort((a,b)=>(b.ready-a.ready)||(b.gain-a.gain));
  return out.slice(0,Math.max(0,Math.floor(num(limit,DATA.maxAdvice)))); }

/* texto curto para o HUD */
/* FC DESTE ITEM (regra "MELHORIA DE ITEM"): quanto o item soma no espaço dele, como está e projetado no nível do jogador.
   {fc, atPlayerLevel, level, playerLevel, swap}: fc = FC com o item − FC com o espaço vazio; atPlayerLevel = o mesmo com o item no nível
   min(100, nível do jogador); swap = FC com este item no lugar do atual − FC atual (o equipar automático usa este, com o nível REAL). */
function itemFC(S,host,item){
  const T=sysRoot().stats; if(!item||!T) return {fc:0,atPlayerLevel:0,level:1,playerLevel:null,swap:0};
  const L=sysRoot().level, pl=L&&L.level?L.level(S):(host&&typeof host.level==='function'?Math.floor(num(host.level(),1)):null);
  const empty=compute(S,host,{item,remove:true}), as=compute(S,host,{item}), top=Math.max(Math.max(1,Math.floor(num(item.lvl,1))),pl==null?100:Math.min(100,pl));
  return {fc:as-empty, atPlayerLevel:compute(S,host,{item,atLevel:top})-empty, level:Math.max(1,Math.floor(num(item.lvl,1))), playerLevel:pl, swap:as-compute(S,host)};
}
const hud=(S,host)=>'FC '+viewText(compute(S,host));
/* VARIAÇÃO DE PODER (dono via PO: mostrar +/− de FC em TUDO que mexe no poder: título, item, pet, montaria, asa, forja, fusão, estandarte...).
   Uso: const a=Sys.fc.snapshot(S,host); …ação…; const d=Sys.fc.delta(a, Sys.fc.snapshot(S,host)); ou, de uma vez, Sys.fc.measure(S,host,()=>ação).
   delta aceita snapshot ou número. {before, after, diff, pct, sign:'up'|'down'|'same', text:'+1,2 mil'|'−340'|'', color, stats:{atk,hp,def,critRate,critDmg,aspd}}.
   Para PRÉVIA de item sem mexer no save: Sys.fc.itemFC(S,host,item).swap (já existe). */
const SNAP_KEYS=['atk','hp','def','critRate','critDmg','aspd'];
function snapshot(S,host){ const st=stats(S,host), o={fc:fcOfStats(st)}; for(const k of SNAP_KEYS) o[k]=num(st[k],0); return o; }
function delta(a,b){ const A=typeof a==='number'?{fc:a}:(a||{fc:0}), B=typeof b==='number'?{fc:b}:(b||{fc:0}), before=num(A.fc,0), after=num(B.fc,0), diff=after-before;
  const sign=diff>0?'up':diff<0?'down':'same', st={}; for(const k of SNAP_KEYS) if(A[k]!=null&&B[k]!=null) st[k]=num(B[k],0)-num(A[k],0);
  return {before,after,diff,pct:before>0?Math.round(diff/before*10000)/100:0,sign,text:diff>0?'+'+viewText(diff):diff<0?'−'+viewText(-diff):'',viewBefore:view(before),viewAfter:view(after),viewDiff:view(diff),color:diff>0?'#5fd068':diff<0?'#ff6b6b':'#c9b9a2',stats:st}; }
function measure(S,host,fn){ const a=snapshot(S,host); const result=typeof fn==='function'?fn():undefined; return {result,delta:delta(a,snapshot(S,host))}; }

/* RANKING (regra F): cada troca de item/skin grava a FC atual; o ranking semanal usa a MAIOR FC registrada na semana (segunda a domingo,
   hora local). Chamar depois de equipar/desequipar item ou skin, de fortalecer, treinar, alimentar o pet etc. Devolve {fc, week, max, newMax}. */
function weekKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.weekKey==='function') return C.weekKey(ms);   // fuso único com servidor
  const d=new Date(ms); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function record(S,host){
  if(!S||typeof S!=='object') return null; if(!S.sys||typeof S.sys!=='object') S.sys={};
  const now=num(host&&host.now&&host.now(),Date.now()), wk=weekKey(now), fc=compute(S,host);
  let o=S.sys.fc; if(!o||typeof o!=='object') o=S.sys.fc={};
  if(o.week!==wk){ if(o.week) o.last={week:o.week,max:num(o.max,0)}; o.week=wk; o.max=0; }
  const newMax=fc>num(o.max,0); if(newMax){ o.max=fc; o.maxAt=now; }
  return {fc,week:wk,max:o.max,newMax};
}
const weekMax=(S,host)=>{ const o=S&&S.sys&&S.sys.fc, wk=weekKey(num(host&&host.now&&host.now(),Date.now())); return o&&o.week===wk?num(o.max,0):0; };

/* ---------------- UI (opcional): painel "Como ficar mais forte" ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{}; const st=stats(S,host), fc=fcOfStats(st), PER=num(opt.perPage,4);
  const adv=advice(S,host), pages=Math.max(1,Math.ceil(adv.length/PER)), pg=clamp(Math.floor(num(el.__sysFcPage,0)),0,pages-1);
  el.__sysFcPage=pg;
  const row=(k,v)=>`<div class="sys-fc-stat"><span>${k}</span><b>${v}</b></div>`;
  const brk=breakdown(S,host).slice(0,4).map(s=>`<span class="sys-fc-src">${esc(s.icon)} ${esc(s.label)} <b>+${viewText(s.fc)}</b></span>`).join('');
  const list=adv.slice(pg*PER,pg*PER+PER).map(a=>`<button class="sys-fc-adv${a.ready?' ready':''}" data-tab="${esc(a.tab)}">
      <span class="sys-fc-ai">${esc(a.icon)}</span><span class="sys-fc-at">${esc(a.label)}${a.cost?`<small>${esc(a.cost)}</small>`:''}</span>
      <span class="sys-fc-ag">${a.gain>0?'+'+viewText(a.gain)+' FC':''}</span></button>`).join('')
    || DATA.guide.map(g=>`<button class="sys-fc-adv" data-tab="${esc(g.tab)}"><span class="sys-fc-ai">${g.icon}</span><span class="sys-fc-at">${esc(g.label)}</span><span class="sys-fc-ag">›</span></button>`).slice(0,PER).join('');
  el.innerHTML=`<div class="sys-fc">
    <div class="sys-fc-top"><div class="sys-fc-big"><small>Força de combate</small><b>${viewText(fc)}</b></div>
      <div class="sys-fc-stats">${row('ATK',fmt(st.atk))}${row('HP',fmt(st.hp))}${row('DEF',fmt(st.def))}${row('Crítico',num(st.critRate,0).toFixed(1)+'%')}${row('Dano crít.','+'+Math.round(num(st.critDmg,0))+'%')}${row('Vel. ataque','+'+Math.round(num(st.aspd,0))+'%')}</div></div>
    ${brk?`<div class="sys-fc-srcs">${brk}</div>`:''}
    <div class="sys-fc-h">Como ficar mais forte</div>
    <div class="sys-fc-list">${list}</div>
    ${pages>1?`<div class="sys-pg"><button class="sys-pg-btn" data-pg="-1" ${pg?'':'disabled'}>‹</button><span>${pg+1}/${pages}</span><button class="sys-pg-btn" data-pg="1" ${pg<pages-1?'':'disabled'}>›</button></div>`:''}
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    if(b.dataset.pg){ el.__sysFcPage=pg+Number(b.dataset.pg); render(el,S,host,opt); return; }
    if(b.dataset.tab&&host&&typeof host.goTab==='function') host.goTab(b.dataset.tab); };
}

const API={DATA,VIEW,view,viewText,KEYS,snapshot,delta,measure,modules,sources,total,stats,parts,fcOfStats,compute,breakdown,advice,hud,record,weekMax,weekKey,itemFC,render,fmt,
  bonus:()=>zero()};   // o próprio fc não soma nada (é ignorado em modules())
root.Sys=root.Sys||{}; root.Sys.fc=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
