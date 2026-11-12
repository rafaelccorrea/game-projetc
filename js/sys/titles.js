/* Eonbound — Sys.titles: títulos colecionáveis por conquista. Cada título desbloqueado dá um atributo fixo; o título
   EM DESTAQUE (1 só) aparece no perfil e vale featuredMult vezes. Títulos de coleção de skins são COSMÉTICOS (bônus 0):
   skins são compradas com 💎 e nunca podem virar atributo. Lógica pura + render opcional.
   Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-titles.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
// cond.type: stage (fases vencidas) · era (era liberada) · boss (chefes derrotados) · kills (abates) · tower (melhor andar)
//            arena (melhor posição semanal, 1 = 1º) · practice (soma dos níveis de prática) · skins (skins de arma e roupa possuídas)
//            weaponEras (eras com ARMA conquistada como item) · weapons (armas diferentes conquistadas como item, era+raridade)
//            mounts · pets · petStar (pet X com N estrelas) · hair · eyes · hats
// n:'all' = todos os que existem no catálogo (DATA.catalog ou host.catalog(tipo)): o título acompanha o catálogo sem mudar a lógica.
// bonus: pontos percentuais (ver js/sys/fc.js), multiplicados por bonusMult. cosmetic:true = só visual (marcado na tela), bônus 0.
const DATA={
  label:'Títulos', icon:'🎖️',
  bonusMult:0.5,   // balance v5.1 ("titles"): cada bônus da tabela × 0,5
  featuredMult:2,
  // tamanho do catálogo do LANÇAMENTO (revisão do PO): 28 armas (7 eras × 4 raridades, sem a Mítica), 10 roupas, 5 cabelos, 5 olhos,
  // 4 chapéus, 2 montarias; pets vêm do Sys.pet. host.catalog(tipo) substitui estes números quando existir.
  catalog:{weapons:28, wardrobe:38, hair:5, eyes:5, hats:4, mounts:2, pets:5},
  titles:[
    {id:'stage10', name:'Desbravador',          cond:{type:'stage',n:10},     bonus:{atkPct:1}},
    {id:'stage30', name:'Veterano das Eras',    cond:{type:'stage',n:30},     bonus:{atkPct:2,hpPct:2}},
    {id:'stage50', name:'Conquistador',         cond:{type:'stage',n:50},     bonus:{atkPct:3,hpPct:3}},
    {id:'stage70', name:'Senhor das Eras',      cond:{type:'stage',n:70},     bonus:{atkPct:5,hpPct:5}},
    {id:'era2',    name:'Cavaleiro do Tempo',   cond:{type:'era',n:2},        bonus:{hpPct:2}},
    {id:'era4',    name:'Mente Inventiva',      cond:{type:'era',n:4},        bonus:{goldPct:4}},
    {id:'era6',    name:'Viajante do Futuro',   cond:{type:'era',n:6},        bonus:{critPct:1,goldPct:5}},
    {id:'boss10',  name:'Caçador de Chefes',    cond:{type:'boss',n:10},      bonus:{critPct:0.5}},
    {id:'boss50',  name:'Matador de Titãs',     cond:{type:'boss',n:50},      bonus:{critPct:1.5}},
    {id:'kill1k',  name:'Implacável',           cond:{type:'kills',n:1000},   bonus:{goldPct:3}},
    {id:'kill10k', name:'Lenda da Horda',       cond:{type:'kills',n:10000},  bonus:{goldPct:8}},
    {id:'tow10',   name:'Escalador',            cond:{type:'tower',n:10},     bonus:{defPct:1}},
    {id:'tow25',   name:'Guardião da Torre',    cond:{type:'tower',n:25},     bonus:{defPct:2,hpPct:2}},
    {id:'tow50',   name:'Senhor da Torre',      cond:{type:'tower',n:50},     bonus:{defPct:3,atkPct:3}},
    {id:'tow100',  name:'Imortal',              cond:{type:'tower',n:100},    bonus:{defPct:5,atkPct:5,hpPct:5}},
    {id:'arena10', name:'Gladiador',            cond:{type:'arena',n:10},     bonus:{atkPct:2}},
    {id:'arena3',  name:'Campeão da Arena',     cond:{type:'arena',n:3},      bonus:{atkPct:4,critPct:1}},
    {id:'arena1',  name:'Rei da Arena',         cond:{type:'arena',n:1},      bonus:{atkPct:6,critPct:2}},
    {id:'prac50',  name:'Disciplinado',         cond:{type:'practice',n:50},  bonus:{hpPct:3}},
    {id:'prac200', name:'Mestre do Treino',     cond:{type:'practice',n:200}, bonus:{hpPct:4,defPct:1}},
    // coleção de armas: conta só a arma conquistada como ITEM (decisão do PO); skin de arma não conta (é comprável)
    {id:'weap7',   name:'Armeiro',              cond:{type:'weaponEras',n:7}, bonus:{atkPct:2}},
    {id:'weapAll', name:'Arsenal Completo',     cond:{type:'weapons',n:'all'},bonus:{atkPct:5}},
    // montaria dá poder (dono); vale enquanto a montaria não for vendida por dinheiro sem decisão do dono
    {id:'mount1',  name:'Cavaleiro',            cond:{type:'mounts',n:1},     bonus:{hpPct:2}},
    {id:'mountAll',name:'Senhor das Montarias', cond:{type:'mounts',n:'all'}, bonus:{hpPct:4,critPct:1}},
    // pets (spec-pet-fc.md seção 5): já com o corte × 0,5 aplicado pelo bonusMult (tabela com o valor cheio)
    {id:'pet1',    name:'Amigo dos Bichos',     cond:{type:'pets',n:1},       bonus:{hpPct:1}},
    {id:'pet3',    name:'Domador',              cond:{type:'pets',n:3},       bonus:{hpPct:2}},
    {id:'petAll',  name:'Arca das Eras',        cond:{type:'pets',n:'all'},   bonus:{atkPct:2,hpPct:2}},
    {id:'phoenix5',name:'Laço Lendário',        cond:{type:'petStar',pet:'phoenix',n:5}, bonus:{critPct:2}},
    // visual: sempre cosmético (skins e peças do herói modular)
    {id:'skin10',  name:'Colecionador',         cond:{type:'skins',n:10},     bonus:{}, cosmetic:true},
    {id:'skin25',  name:'Estilista das Eras',   cond:{type:'skins',n:25},     bonus:{}, cosmetic:true},
    {id:'skinAll', name:'Guarda-Roupa Lendário',cond:{type:'skins',n:'all'},  bonus:{}, cosmetic:true},
    {id:'hairAll', name:'Estilo Próprio',       cond:{type:'hair',n:'all'},   bonus:{}, cosmetic:true},
    {id:'eyesAll', name:'Olhar Marcante',       cond:{type:'eyes',n:'all'},   bonus:{}, cosmetic:true},
    {id:'hatsAll', name:'Chapeleiro',           cond:{type:'hats',n:'all'},   bonus:{}, cosmetic:true},
  ],
  condText:{ stage:n=>`Vencer a fase ${n}`, era:n=>`Liberar a era ${n}`, boss:n=>`Derrotar ${n} chefes`, kills:n=>`Derrotar ${n} inimigos`,
    tower:n=>`Chegar ao andar ${n} da torre`, arena:n=>n===1?'Terminar a semana em 1º na arena':`Terminar a semana no top ${n} da arena`,
    practice:n=>`Somar ${n} níveis de prática`, skins:n=>`Ter ${n} skins de arma ou roupa`,
    weaponEras:n=>`Conquistar armas de ${n} eras`, weapons:n=>`Conquistar as ${n} armas`, mounts:n=>n===1?'Ter 1 montaria':`Ter as ${n} montarias`,
    pets:n=>n===1?'Ter 1 pet':`Ter ${n} pets`, petStar:(n,c)=>`Fênix com ${n}★`, hair:n=>`Ter os ${n} cabelos`, eyes:n=>`Ter os ${n} olhos`, hats:n=>`Ter os ${n} chapéus` },
  statText:{atkPct:'ATK',hpPct:'HP',critPct:'crítico',defPct:'defesa',goldPct:'ouro'},
};
const KEYS=['atkPct','hpPct','goldPct','critPct','defPct','fc'];
const BY={}; DATA.titles.forEach(t=>{ BY[t.id]=t; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtN=n=>{ n=num(n,0); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.floor(n)); };
const fmtP=v=>(Math.round(v*100)/100).toString().replace('.',',');
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.titles.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.titles; if(!o||typeof o!=='object') o=S.sys.titles={};
  o.v=1; o.bosses=int0(o.bosses);
  // armas já conquistadas como item ("era-raridade"): a coleção não some quando o item é vendido ou trocado
  o.seenW=Array.isArray(o.seenW)?[...new Set(o.seenW.filter(k=>typeof k==='string'&&/^\d+-\d+$/.test(k)))]:[];
  const u=(o.unlocked&&typeof o.unlocked==='object'&&!Array.isArray(o.unlocked))?o.unlocked:{}; o.unlocked={};
  for(const id in u) if(BY[id]) o.unlocked[id]=num(u[id],0);          // título removido da tabela some do save
  if(o.featured!=null&&!o.unlocked[o.featured]) o.featured=null;
  if(o.featured===undefined) o.featured=null;
  return o;
}

/* valor atual de cada tipo de condição (lido do save do jogo e dos outros Sys; tudo opcional) */
function current(S,host,type){
  const sys=S.sys||{};
  switch(type){
    case 'stage': return Math.max(0,int0(S.best||(host&&host.stage&&host.stage())||1)-1);   // S.best = maior fase alcançada
    case 'era':   return Math.max(int0(host&&host.eraMax&&host.eraMax()),int0(S.eraMax));
    case 'boss':  return ensure(S).bosses;
    case 'kills': return int0(S.kills);
    case 'tower': return int0(sys.tower&&sys.tower.best);
    case 'arena': return int0(sys.arena&&sys.arena.bestRank);   // 0 = nunca ranqueou
    case 'practice': { const lv=sys.practice&&sys.practice.lv; let s=0; if(lv&&typeof lv==='object') for(const k in lv) s+=int0(lv[k]); return s; }
    case 'skins': return Array.isArray(S.skins)?new Set(S.skins).size:0;
    case 'weaponEras': return new Set(seenWeapons(S).map(k=>k.split('-')[0])).size;
    case 'weapons': return seenWeapons(S).length;
    case 'mounts': return owned(S,host,'mounts');
    case 'pets': { const p=sys.pet&&sys.pet.owned; return p&&typeof p==='object'?Object.keys(p).length:0; }
    case 'hair': case 'eyes': case 'hats': return owned(S,host,type);
  }
  return 0;
}
/* junta as armas da mochila ao histórico de conquistadas e devolve a lista */
function seenWeapons(S){
  const o=ensure(S), set=new Set(o.seenW);
  if(Array.isArray(S.inv)) for(const it of S.inv) if(it&&it.slot==='weapon'&&Number.isInteger(it.e)&&Number.isInteger(it.r)) set.add(it.e+'-'+it.r);
  o.seenW=[...set]; return o.seenW;
}
/* quantos itens de um tipo de catálogo o jogador tem: host.owned(tipo) → lista de ids (montaria também em S.sys.mount.owned) */
function owned(S,host,kind){
  if(host&&typeof host.owned==='function'){ let a; try{ a=host.owned(kind); }catch(e){ a=null; } if(Array.isArray(a)) return new Set(a).size; }
  if(kind==='mounts'){ const m=S.sys&&S.sys.mount&&S.sys.mount.owned; if(m&&typeof m==='object') return Array.isArray(m)?new Set(m).size:Object.keys(m).length; }
  return 0;
}
const CAT_KEY={weapons:'weapons',skins:'wardrobe',hair:'hair',eyes:'eyes',hats:'hats',mounts:'mounts',pets:'pets'};
/* quanto a condição pede: número fixo, ou 'all' = tamanho do catálogo */
function need(S,host,c){
  if(c.n!=='all') return Math.max(1,int0(c.n));
  const k=CAT_KEY[c.type]; let n=null;
  if(host&&typeof host.catalog==='function'){ try{ n=host.catalog(k); }catch(e){ n=null; } }
  if(!(typeof n==='number'&&n>0)&&k==='pets'){ const P=root.Sys&&root.Sys.pet; if(P&&P.DATA&&Array.isArray(P.DATA.pets)) n=P.DATA.pets.length; }
  if(!(typeof n==='number'&&n>0)) n=DATA.catalog[k];
  return Math.max(1,int0(n));
}
/* {cur, need, done, frac} — arena é "menor é melhor" */
function progress(S,host,t){
  const c=t.cond;
  if(c.type==='petStar'){ const p=S.sys&&S.sys.pet&&S.sys.pet.owned&&S.sys.pet.owned[c.pet], cur=p?int0(p.stars):0; return {cur,need:c.n,done:cur>=c.n,frac:clamp(cur/c.n,0,1)}; }
  const cur=current(S,host,c.type), nd=need(S,host,c);
  if(c.type==='arena'){ const done=cur>0&&cur<=nd; return {cur,need:nd,done,frac:done?1:0}; }
  return {cur,need:nd,done:cur>=nd,frac:clamp(cur/nd,0,1)};
}
/* desbloqueia o que já foi cumprido; devolve os novos. Chamar após eventos (o próprio onKill já chama). */
function check(S,host,opt){
  const o=ensure(S), fresh=[], silent=!!(opt&&opt.silent);
  for(const t of DATA.titles){ if(o.unlocked[t.id]) continue; if(progress(S,host,t).done){ o.unlocked[t.id]=nowOf(host); fresh.push(t); } }
  if(fresh.length){
    if(!o.featured){ const best=fresh.filter(t=>!t.cosmetic).pop()||fresh[fresh.length-1]; o.featured=best.id; }
    if(!silent&&host&&host.toast) host.toast(fresh.length===1?`🎖️ Novo título: ${fresh[0].name}`:`🎖️ ${fresh.length} novos títulos!`);
  }
  return fresh;
}
function setFeatured(S,id){ const o=ensure(S); if(id==null){ o.featured=null; return true; } if(!o.unlocked[id]) return false; o.featured=id; return true; }
const isUnlocked=(S,id)=>!!ensure(S).unlocked[id];
const featured=S=>{ const id=ensure(S).featured; return id?BY[id]:null; };

/* eventos do contrato: onKill (todo inimigo; conta chefes) · onWaveClear / onBossKill só re-checam */
function onKill(S,host,enemy){ const o=ensure(S); if(enemy&&enemy.boss) o.bosses++; return check(S,host); }
const onWaveClear=(S,host)=>check(S,host);

function titleBonus(t,mult){ const b={}; for(const k of KEYS) b[k]=t.cosmetic?0:num(t.bonus&&t.bonus[k],0)*DATA.bonusMult*mult; return b; }
function bonus(S){
  const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0}; if(!S) return b; const o=ensure(S);
  for(const id in o.unlocked){ const t=BY[id], m=id===o.featured?DATA.featuredMult:1, tb=titleBonus(t,m); for(const k of KEYS) b[k]+=tb[k]; }
  for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6;
  return b;
}
/* texto da condição com o número real (resolve 'all' pelo catálogo) */
const condLabel=(S,host,t)=>DATA.condText[t.cond.type](need(S,host,t.cond),t.cond);
function bonusText(t,mult){ if(t.cosmetic) return 'Cosmético'; const tb=titleBonus(t,mult||1), out=[];
  for(const k in DATA.statText) if(tb[k]) out.push(`+${fmtP(tb[k])}% ${DATA.statText[k]}`); return out.join(' · ')||'—'; }
/* dicas: trocar o destaque pelo título mais forte (pronto agora) e o próximo título a desbloquear */
function advice(S,host){
  const o=ensure(S), out=[], power=t=>{ const tb=titleBonus(t,1); return tb.atkPct*1.2+tb.hpPct+tb.critPct*1.5+tb.defPct*1.5+tb.goldPct*0.2; };
  const cur=o.featured?BY[o.featured]:null, best=Object.keys(o.unlocked).map(id=>BY[id]).filter(t=>!t.cosmetic).sort((a,b)=>power(b)-power(a))[0];
  if(best&&best!==cur){ const d={}; const add=(t,s)=>{ if(!t) return; const tb=titleBonus(t,DATA.featuredMult-1); for(const k of KEYS) d[k]=(d[k]||0)+s*tb[k]; };
    add(best,1); add(cur,-1); out.push({id:'titles.feature',icon:'🎖️',label:`Destacar o título ${best.name}`,delta:d,cost:'grátis',ready:true,tab:'titles'}); }
  const next=DATA.titles.filter(t=>!o.unlocked[t.id]&&!t.cosmetic).map(t=>({t,p:progress(S,host,t)})).sort((a,b)=>b.p.frac-a.p.frac)[0];
  if(next) out.push({id:'titles.'+next.t.id,icon:'🎖️',label:`Título ${next.t.name}: ${condLabel(S,host,next.t)}`,delta:titleBonus(next.t,1),cost:'',ready:false,tab:'titles'});
  return out;
}

/* ---------------- UI (opcional): grade 2 colunas, paginada ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{}; if(check(S,host,{silent:true}).length) changed(host); const o=ensure(S);
  const cardH=num(opt.cardH,74), cols=2, body=num(el.clientHeight,0)-56-40;
  const per=body>0?clamp(Math.floor(body/cardH),1,20)*cols:num(opt.perPage,8);
  const list=DATA.titles.slice().sort((a,b)=>(!!o.unlocked[b.id]-!!o.unlocked[a.id])||(DATA.titles.indexOf(a)-DATA.titles.indexOf(b)));
  const pages=Math.max(1,Math.ceil(list.length/per)), pg=clamp(int0(el.__sysTitPage),0,pages-1); el.__sysTitPage=pg;
  const f=featured(S), nUn=Object.keys(o.unlocked).length;
  const cards=list.slice(pg*per,pg*per+per).map(t=>{ const un=!!o.unlocked[t.id], fe=f&&f.id===t.id, p=progress(S,host,t);
    const prog=un?'':t.cond.type==='arena'?`<small>${p.cur?`melhor: ${p.cur}º`:'sem ranking'}</small>`:`<small>${fmtN(Math.min(p.cur,p.need))}/${fmtN(p.need)}</small><i style="width:${Math.round(p.frac*100)}%"></i>`;
    return `<button class="sys-card sys-tit-card${un?' on':''}${fe?' fe':''}${t.cosmetic?' cos':''}" data-id="${t.id}" ${un?'':'disabled'}>
      <b>${fe?'★ ':''}${esc(t.name)}</b><span class="sys-tit-bn">${esc(bonusText(t,fe?DATA.featuredMult:1))}</span>
      <span class="sys-tit-cd">${un?(fe?'Em destaque':'Toque para destacar'):esc(condLabel(S,host,t))}</span>${prog}</button>`; }).join('');
  el.innerHTML=`<div class="sys-tit">
    <div class="sys-tit-top"><span>🎖️ <b>${nUn}</b>/${DATA.titles.length}</span>
      <span class="sys-tit-f">${f?`Destaque: <b>${esc(f.name)}</b> (x${DATA.featuredMult})`:'Nenhum título em destaque'}</span></div>
    <div class="sys-grid sys-tit-grid">${cards}</div>
    ${pages>1?`<div class="sys-pg"><button class="sys-pg-btn" data-pg="-1" ${pg?'':'disabled'}>‹</button><span>${pg+1}/${pages}</span><button class="sys-pg-btn" data-pg="1" ${pg<pages-1?'':'disabled'}>›</button></div>`:''}
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    if(b.dataset.pg){ el.__sysTitPage=pg+Number(b.dataset.pg); render(el,S,host,opt); return; }
    if(b.dataset.id&&o.featured!==b.dataset.id&&setFeatured(S,b.dataset.id)){ if(host&&host.toast) host.toast(`★ Destaque: ${BY[b.dataset.id].name}`); changed(host); render(el,S,host,opt); } };
}

const API={DATA,ensure,current,progress,need,seenWeapons,check,setFeatured,isUnlocked,featured,onKill,onWaveClear,onBossKill:onWaveClear,bonus,bonusText,condLabel,advice,render};
root.Sys=root.Sys||{}; root.Sys.titles=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
