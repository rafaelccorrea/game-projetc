/* Eonbound — Sys.strikes: GOLPES ESPECIAIS NOS ITENS (docs/LOM_VS_EONBOUND.md §5 item 1 e §4 B1; aprovado pelo dono). CHAVE DESLIGADA (DATA.on=false).
   Cinco atributos de golpe que vêm nos itens e aparecem com NOME na batalha: COMBO, CONTRA-ATAQUE, ATORDOADO, ESQUIVA, ROUBO DE VIDA.
   Formato no item: it.stk = [{k, q}] (k = chave abaixo, q = qualidade 0..1), igual ao padrão dos secundários (it.subs). O valor sai de (k, q, raridade, era).
   Quem sorteia: Sys.loot.rollItem/makeFixedItem chamam tag(it, rng) SÓ com a chave ligada (desligada não gasta sorte: drop byte a byte igual).
   Item antigo sem it.stk: ensureItem(it) gera com semente fixa pelo id (sempre o mesmo resultado), só com a chave ligada.
   Batalha: profile(S,host) uma vez por troca de equipamento; onHeroHit(S,ctx,rng) a cada golpe do herói; onHeroHurt(S,ctx,rng) a cada golpe recebido.
   Desligado: profile = zeros, resolvedores devolvem "nada aconteceu" SEM gastar sorte, e a FC (Sys.fc) não muda nada (teste prova).
   FC: fcFactor(totais) → {atk, hp} multiplica a parte de ATQ e a parte de Vida da FC (Sys.fc.parts), pelo valor esperado de cada golpe.
   Regra de coerência de dano (Sys.stats.DATA.dmgRule) mantida: o combo é UM golpe extra de 50% do básico, o contra-ataque UM golpe de 60%; nenhum
   número passa do teto de um golpe s1. Nada aqui é vendido; vem só nos itens que caem jogando. Sem DOM. */
(function(root){
'use strict';

/* ---------------- dados (PROPOSTA; a Sistemas calibra com o QA) ---------------- */
const DATA={
  on:false,
  label:'Golpes especiais',
  keys:['combo','counter','stun','dodge','lifesteal'],
  // nome no item (minúsculo) e rótulo na batalha (MAIÚSCULO, cor fixa)
  name:{combo:'Combo',counter:'Contra-ataque',stun:'Atordoar',dodge:'Esquiva',lifesteal:'Roubo de vida'},
  battle:{combo:'COMBO',counter:'CONTRA-ATAQUE',stun:'ATORDOADO',dodge:'ESQUIVA',lifesteal:'ROUBO DE VIDA'},
  color:{combo:'#ffb030',counter:'#ff5a4a',stun:'#c78bff',dodge:'#7fd8ff',lifesteal:'#5fd068'},
  // quantos golpes especiais por raridade (0 Básico, 1 Raro, 2 Épico, 3 Mítico, 4 Lendário, 5 Divino)
  count:[0,1,1,1,2,2],
  // quais golpes cada espaço pode sortear (sem repetir no mesmo item)
  pool:{
    weapon:  ['combo','stun','lifesteal'],
    armor:   ['counter','dodge','lifesteal'],
    hat:     ['stun','dodge','counter'],
    gloves:  ['combo','counter','stun'],
    boots:   ['dodge','combo'],
    necklace:['lifesteal','stun','combo'],
    wing:    ['combo','counter','stun','dodge','lifesteal'],
  },
  // faixa [mín, máx] em % na raridade Rara, era 0. Valor = (mín + q·(máx−mín)) × rar[r] × (1 + eraStep·era)
  range:{combo:[3,6], counter:[3,6], stun:[1,2], dodge:[1.5,3], lifesteal:[1,2.5]},
  rar:[0,1,1.4,1.9,2.5,3.2],
  eraStep:0.12, maxEra:8,
  // TETOS da soma de todos os itens (pontos %). bossCap vale contra chefe, Senhor da Era e na Arena (PvP): o chefe nunca vira trivial.
  cap:    {combo:50, counter:50, stun:20, dodge:30, lifesteal:20},
  bossCap:{combo:50, counter:50, stun:10, dodge:20, lifesteal:10},
  // efeito de cada golpe
  comboMult:0.5,        // golpe extra = 50% do golpe básico (s1); combo não puxa outro combo
  counterMult:0.6,      // revide = 60% do golpe básico
  stunSec:1.0, stunSecBoss:0.5,     // atordoado: 1 s (chefe 0,5 s)
  stunImmuneSec:3, stunImmuneSecBoss:4,   // depois de atordoado, o mesmo alvo fica imune por N s (não dá para travar o chefe)
  // peso na FC (valor esperado; ver fcFactor)
  fc:{combo:0.4, counter:0.25, stun:0.5, lifesteal:1.5},
};
const NONE_HIT=Object.freeze({combo:false,comboMult:0,stun:false,stunSec:0,immuneUntil:0,lifesteal:0,labels:Object.freeze([])});
const NONE_HURT=Object.freeze({dodge:false,counter:false,counterMult:0,dmg:null,labels:Object.freeze([])});

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const zero=()=>({combo:0,counter:0,stun:0,dodge:0,lifesteal:0});
const isKey=k=>DATA.keys.includes(k);
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const fmtPct=v=>(Math.round(num(v,0)*10)/10).toFixed(1).replace('.',',')+'%';

/* ---------------- itens ---------------- */
const countOf=r=>int0(DATA.count[clamp(int0(r),0,DATA.count.length-1)]);
/* sorteia os golpes de um item novo: [{k,q}] distintos do pool do espaço. Não muda o item. */
function roll(slot,r,rng){ rng=rng||Math.random; const pool=(DATA.pool[slot]||[]).slice(), out=[];
  for(let i=0;i<countOf(r)&&pool.length;i++){ const j=Math.floor(rng()*pool.length)%pool.length; out.push({k:pool.splice(j,1)[0],q:Math.round(rng()*1000)/1000}); }
  return out; }
/* grava it.stk num item recém-criado. Desligado: não faz nada e NÃO gasta sorte (o Sys.loot fica igual). */
function tag(it,rng){ if(!on()||!it||typeof it!=='object'||!DATA.pool[it.slot]) return it; if(Array.isArray(it.stk)) return it; it.stk=roll(it.slot,it.r,rng); return it; }
/* item antigo (ou de antes da chave): gera com semente pelo id/forma do item, sempre igual. Só com a chave ligada. */
function ensureItem(it){ if(!on()||!it||typeof it!=='object'||!DATA.pool[it.slot]) return it;
  if(Array.isArray(it.stk)){ it.stk=it.stk.filter(s=>s&&isKey(s.k)&&(DATA.pool[it.slot]||[]).includes(s.k)).slice(0,countOf(it.r)); return it; }
  it.stk=roll(it.slot,it.r,mulberry(hash('stk|'+(it.id!=null?it.id:JSON.stringify([it.slot,it.e,it.r,it.qp==null?null:it.qp]))))); return it; }
/* valor (pontos %) de um golpe do item */
function value(s,it){ const f=s&&DATA.range[s.k]; if(!f) return 0; const q=clamp(num(s.q,0),0,1), r=clamp(int0(it&&it.r),0,DATA.rar.length-1), e=clamp(int0(it&&it.e),0,DATA.maxEra);
  return (f[0]+q*(f[1]-f[0]))*DATA.rar[r]*(1+DATA.eraStep*e); }
/* golpes do item para a tela: [{k, name, value, text:'Combo +3,2%', color}] */
function describe(it){ if(!it||!Array.isArray(it.stk)) return [];
  return it.stk.filter(s=>s&&isKey(s.k)).map(s=>{ const v=value(s,it); return {k:s.k,name:DATA.name[s.k],value:v,text:DATA.name[s.k]+' +'+fmtPct(v),color:DATA.color[s.k]}; }); }

/* ---------------- totais do herói ---------------- */
/* itens equipados pelo mesmo caminho do Sys.stats (espaços abertos e válidos); ov = {item, remove} como no Sys.fc.itemFC */
function equippedList(S,host,ov){ const T=root.Sys&&root.Sys.stats; let eq={};
  if(T&&typeof T.equippedOf==='function') eq=T.equippedOf(S,host); else { const x=host&&typeof host.equipped==='function'?host.equipped():null; if(x&&typeof x==='object') for(const k in x) if(x[k]) eq[x[k].slot||k]=x[k]; }
  if(ov&&ov.item&&ov.item.slot){ if(ov.remove) delete eq[ov.item.slot]; else eq[ov.item.slot]=ov.item; }
  const lv=host&&typeof host.level==='function'?int0(host.level()):null, out=[];
  for(const s of Object.keys(DATA.pool)){ const it=eq[s]; if(!it) continue; if(T&&typeof T.canEquip==='function'&&lv!=null&&!T.canEquip(it,lv)) continue; out.push(it); }
  return out; }
/* soma SEM teto (pontos %) dos golpes equipados. Desligado: zeros. */
function raw(S,host,ov){ const o=zero(); if(!on()) return o;
  for(const it of equippedList(S,host,ov)){ ensureItem(it); for(const s of it.stk||[]) if(isKey(s.k)) o[s.k]+=value(s,it); }
  const m=mountStrike(S); if(m) o[m.k]+=m.value;
  return o; }
/* MONTARIA REFORÇA 1 GOLPE (Sys.mount.strikeOf; só com a chave Sys.mount.DATA.strike E esta ligadas). A montaria não ataca: só soma no número do Kael. */
function mountStrike(S){ if(!on()) return null; const M=root.Sys&&root.Sys.mount; if(!M||typeof M.strikeOf!=='function') return null;
  try{ const m=M.strikeOf(S); return m&&isKey(m.k)&&num(m.value,0)>0?m:null; }catch(e){ return null; } }
/* perfil da batalha (com teto): {normal:{...}, boss:{...}}. Recalcular só quando trocar item. mount = {id,k,value} só quando a montaria soma algo. */
function profile(S,host,ov){ const r=raw(S,host,ov), n=zero(), b=zero();
  for(const k of DATA.keys){ n[k]=Math.min(r[k],DATA.cap[k]); b[k]=Math.min(r[k],DATA.bossCap[k]); }
  const out={on:on(),normal:n,boss:b,raw:r}, m=mountStrike(S); if(m) out.mount={id:m.id,k:m.k,value:m.value,name:DATA.name[m.k],color:DATA.color[m.k]};
  return out; }
/* totais para a FC (teto normal) ou null desligado (o Sys.fc usa null para não mudar nada) */
function totals(S,host,ov){ if(!on()) return null; return profile(S,host,ov).normal; }
/* FC: multiplicadores pelo valor esperado. ATQ × (1 + 0,4·combo + 0,25·contra + 0,5·atordoar) · Vida × (1/(1−esquiva)) × (1 + 1,5·roubo). */
function fcFactor(t){ if(!t) return {atk:1,hp:1}; const p=k=>clamp(num(t[k],0),0,100)/100, W=DATA.fc;
  return {atk:1+W.combo*p('combo')+W.counter*p('counter')+W.stun*p('stun'), hp:(1/(1-Math.min(0.9,p('dodge'))))*(1+W.lifesteal*p('lifesteal'))}; }

/* ---------------- resolvedores (a batalha chama) ---------------- */
const profOf=(S,ctx)=>ctx&&ctx.profile?ctx.profile:profile(S,ctx&&ctx.host);
const tough=ctx=>!!(ctx&&(ctx.boss||ctx.pvp));
const lab=k=>({k,text:DATA.battle[k],color:DATA.color[k]});
/* golpe do herói acertou. ctx = {profile? | host?, kind:'s1'|'s2'|'s3', dmg, boss?, pvp?, isCombo?, now (s), immuneUntil (s, do alvo)}
   → {combo, comboMult, stun, stunSec, immuneUntil, lifesteal (vida a curar), labels:[{k,text,color}]}
   Combo só no golpe básico (s1) e nunca de um golpe de combo. Atordoar respeita a imunidade do alvo (o jogo guarda immuneUntil no inimigo). */
function onHeroHit(S,ctx,rng){ if(!on()) return NONE_HIT; ctx=ctx||{}; rng=rng||Math.random;
  const P=profOf(S,ctx), t=tough(ctx)?P.boss:P.normal, out={combo:false,comboMult:0,stun:false,stunSec:0,immuneUntil:num(ctx.immuneUntil,0),lifesteal:0,labels:[]};
  const kind=ctx.kind||'s1', now=num(ctx.now,0);
  if(kind==='s1'&&!ctx.isCombo&&t.combo>0&&rng()*100<t.combo){ out.combo=true; out.comboMult=DATA.comboMult; out.labels.push(lab('combo')); }
  if(t.stun>0&&now>=num(ctx.immuneUntil,0)&&rng()*100<t.stun){ const sec=tough(ctx)?DATA.stunSecBoss:DATA.stunSec;
    out.stun=true; out.stunSec=sec; out.immuneUntil=now+sec+(tough(ctx)?DATA.stunImmuneSecBoss:DATA.stunImmuneSec); out.labels.push(lab('stun')); }
  const d=Math.max(0,num(ctx.dmg,0)); if(t.lifesteal>0&&d>0){ out.lifesteal=d*t.lifesteal/100; out.labels.push(lab('lifesteal')); }
  return out; }
/* herói vai apanhar. ctx = {profile? | host?, dmg, boss?, pvp?} → {dodge, counter, counterMult, dmg (o que sobra: 0 na esquiva), labels}
   O contra-ataque sai mesmo na esquiva (o herói desvia e revida). */
function onHeroHurt(S,ctx,rng){ if(!on()) return NONE_HURT; ctx=ctx||{}; rng=rng||Math.random;
  const P=profOf(S,ctx), t=tough(ctx)?P.boss:P.normal, d=Math.max(0,num(ctx.dmg,0)), out={dodge:false,counter:false,counterMult:0,dmg:d,labels:[]};
  if(t.dodge>0&&rng()*100<t.dodge){ out.dodge=true; out.dmg=0; out.labels.push(lab('dodge')); }
  if(t.counter>0&&rng()*100<t.counter){ out.counter=true; out.counterMult=DATA.counterMult; out.labels.push(lab('counter')); }
  return out; }

/* sem bonus(): o Sys.fc soma bonus() de todo módulo como %, e golpe especial não é %. A FC entra por totals()/fcFactor dentro do Sys.fc. */
const API={DATA,on,setOn,roll,tag,ensureItem,value,describe,equippedList,raw,profile,totals,fcFactor,onHeroHit,onHeroHurt,NONE_HIT,NONE_HURT};
root.Sys=root.Sys||{}; root.Sys.strikes=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
