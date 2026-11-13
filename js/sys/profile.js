/* Eonbound — Sys.profile: SISTEMAS DO PERFIL V5 (tela aprovada pelo dono: docs/proto/PerfilV5.html). Só lógica, sem DOM (a tela é do Engenheiro).
   CHAVE DESLIGADA: DATA.on=false → nada escreve no save; view() devolve {on:false}; equipped()/auraFor() devolvem null (o jogo segue como hoje).
   1) TROCAR NOME (lápis ao lado do nome): 3 a 14 letras ou números, sem espaço (regra do protótipo e do Sys.name); a 1ª troca é GRÁTIS, as
      seguintes custam 200 gemas (moeda do jogo; nunca dinheiro). Filtro do Sys.name no MODO ESTRITO (palavrão com acento/l33t/letras repetidas/
      separadores e nome que se passa pela equipe). Nome único só o servidor confirma.
   2) MOLDURA, AURA e RETRATO: o que está liberado (nível, VIP, arena, Forja, fim das 9 eras, prêmio de evento), escolher e equipar; a lista mostra
      o que falta com "como ganhar". Só visual: nada de atributo.
   3) GRÁFICO DO FC (7 dias): 1 amostra por dia (a MAIOR do dia, dia de Brasília pelo Sys.clock), guarda 7 dias; dia sem amostra = buraco.
   4) RECORDES: record(S,key,valor,host,info) guarda só o melhor (maior; "min" para tempo) e a data.
   Estado em S.sys.profile. API para o engenheiro: docs/SISTEMA_MATRIZ.md (seção Perfil V5). */
(function(root){
'use strict';
const DATA={
  on:false,
  rename:{freeFirst:1, gems:200, cooldownH:0},   // protótipo: "A primeira troca é grátis; depois custa 200 gemas." Sem espera no protótipo (cooldownH 0)
  /* r = raridade como no Sys.titles (0 Comum, 1 Raro, 2 Épico, 3 Mítico, 4 Lendário, 5 Divino), a mesma letra do protótipo.
     molduras do retrato (protótipo FRAMES + as do Sys.erasEnd). need: level (nível do jogador) · vip · arenaTop (melhor posição semanal ≤ n)
     · grant (prêmio dado por outro sistema, ex.: Torneio do Poder: Sys.profile.grant) · erasEnd (id guardado em S.sys.erasEnd.cos.owned) */
  frames:[
    {id:'none',      name:'Simples',       r:0, how:'Inicial',                         need:null},
    {id:'bronze',    name:'Bronze',        r:1, how:'Nível 10',                        need:{level:10}},
    {id:'prata',     name:'Prata',         r:2, how:'Nível 30',                        need:{level:30}},
    {id:'ouro',      name:'Ouro',          r:4, how:'VIP 3',                           need:{vip:3}},
    {id:'cristal',   name:'Cristal',       r:3, how:'Top 10 da Arena',                 need:{arenaTop:10}, go:'Arena'},
    {id:'eterna',    name:'Eterna',        r:5, how:'Torneio do Poder',                need:{grant:true}, go:'Torneio'},
    {id:'nine_eras', name:'Nove Eras',     r:5, how:'Vencer a fase 90 (fim das 9 eras)', need:{erasEnd:'nine_eras'}, go:'Mapa das Eras'},
    {id:'mark100',   name:'Além das Eras', r:4, how:'Vencer a fase 100',               need:{erasEnd:'mark100'}, go:'Mapa das Eras'},
    {id:'mark150',   name:'Sem Fim',       r:5, how:'Vencer a fase 150',               need:{erasEnd:'mark150'}, go:'Mapa das Eras'},
  ],
  /* auras (protótipo AURAS, mesmas folhas da batalha: assets/anim/aura/<id>). forge = [espaço, +N] no Sys.forge; wing = asa equipada daquele tipo */
  auras:[
    {id:'none',          name:'Sem aura',      r:0, how:'',                               need:null},
    {id:'aura4',         name:'Forja +4',      r:1, how:'Arma na Forja +4',               need:{forge:['weapon',4]},  go:'Forja'},
    {id:'aura7',         name:'Forja +7',      r:2, how:'Arma na Forja +7',               need:{forge:['weapon',7]},  go:'Forja'},
    {id:'aura10',        name:'Forja +10',     r:4, how:'Arma na Forja +10',              need:{forge:['weapon',10]}, go:'Forja'},
    {id:'aura13',        name:'Forja +13',     r:3, how:'Arma na Forja +13',              need:{forge:['weapon',13]}, go:'Forja'},
    {id:'aura_holy',     name:'Sagrada',       r:4, how:'Asas de Anjo na Forja +10',      need:{forge:['wing',10],wing:'angel'}, go:'Forja'},
    {id:'aura_evil',     name:'Sombria',       r:4, how:'Asas Demoníacas na Forja +10',   need:{forge:['wing',10],wing:'demon'}, go:'Forja'},
    {id:'light_of_eras', name:'Luz das Eras',  r:5, how:'Vencer a fase 90 (fim das 9 eras)', need:{erasEnd:'light_of_eras'}, go:'Mapa das Eras'},
  ],
  fcDays:7,
  dayNames:['dom','seg','ter','qua','qui','sex','sáb'],
  /* recordes: dir 'max' (maior vence) ou 'min' (menor vence, ex.: tempo). unit só para a tela */
  records:[
    {id:'stage',     name:'Fase mais alta',               dir:'max'},
    {id:'fc',        name:'Maior FC',                     dir:'max'},
    {id:'tower',     name:'Andar mais alto da Torre',     dir:'max'},
    {id:'arenaRank', name:'Melhor posição na Arena',      dir:'min'},
    {id:'arenaLeague', name:'Melhor liga da Arena',       dir:'max'},   // índice em Sys.arena.DATA.leagues (0 Bronze ... 6 Lenda)
    {id:'arenaLp',   name:'Mais pontos de liga na Arena', dir:'max'},
    {id:'hit',       name:'Maior dano num golpe',         dir:'max'},   // info: 'Ultimate', 'Crítico'...
    {id:'streak',    name:'Melhor sequência sem morrer',  dir:'max'},   // abates seguidos sem morrer
    {id:'runKills',  name:'Mais abates numa sessão',      dir:'max'},
    {id:'bossTime',  name:'Chefe mais rápido',            dir:'min', unit:'s'},   // info: nome do chefe
    {id:'goldDay',   name:'Mais ouro num dia',            dir:'max'},   // somado por addDaily(S,host,'goldDay',n)
  ],
  daily:['goldDay'],   // recordes que somam no dia (addDaily); o dia vira pelo Sys.clock
};
const REC={}; DATA.records.forEach(r=>{ REC[r.id]=r; });
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const SYS=()=>root.Sys||{};
const on=()=>DATA.on===true;
const OFF={ok:false,reason:'desligado'};
const DAY=86400000;
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const pad=n=>String(n).padStart(2,'0');
/* dia de Brasília: o Sys.clock (fuso único de todos os módulos); sem ele, UTC−3 fixo */
function dayKey(ms){ const C=SYS().clock; if(C&&typeof C.dayKey==='function') return C.dayKey(ms);
  const d=new Date(ms-3*3600000); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; }
const keyIdx=k=>{ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(k)); return m?Math.round(Date.UTC(+m[1],+m[2]-1,+m[3])/DAY):NaN; };
const idxKey=i=>{ const d=new Date(i*DAY); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`; };
const setOn=v=>{ DATA.on=!!v; return DATA.on; };

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.profile.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.profile; if(!o||typeof o!=='object') o=S.sys.profile={};
  o.v=1; o.renames=int0(o.renames); o.lastRename=int0(o.lastRename);
  for(const k of ['frame','aura','avatar']) if(typeof o[k]!=='string') o[k]=null;
  o.grants=Array.isArray(o.grants)?[...new Set(o.grants.filter(id=>typeof id==='string'))]:[];
  const fc=Array.isArray(o.fc)?o.fc:[], seen={};
  for(const p of fc) if(p&&typeof p.d==='string'&&isFinite(keyIdx(p.d))&&num(p.fc,-1)>=0) seen[p.d]=Math.max(num(seen[p.d],0),p.fc);
  o.fc=Object.keys(seen).sort((a,b)=>keyIdx(a)-keyIdx(b)).slice(-DATA.fcDays).map(d=>({d,fc:seen[d]}));
  const rec=o.rec&&typeof o.rec==='object'&&!Array.isArray(o.rec)?o.rec:{}; o.rec={};
  for(const k in rec){ const r=rec[k]; if(REC[k]&&r&&typeof r==='object'&&isFinite(Number(r.v))) o.rec[k]={v:Number(r.v),at:int0(r.at),day:typeof r.day==='string'?r.day:'',info:typeof r.info==='string'?r.info:''}; }
  const dl=o.daily&&typeof o.daily==='object'?o.daily:{}; o.daily={day:typeof dl.day==='string'?dl.day:''};
  for(const k of DATA.daily) o.daily[k]=Math.max(0,num(dl[k],0));
  return o;
}

/* ---------------- leitura do jogo (só lê; nada é escrito nos outros módulos) ---------------- */
function playerLevel(S,host){ if(host&&typeof host.level==='function'){ const l=num(host.level(),NaN); if(isFinite(l)) return l; }
  return int0(S.sys&&S.sys.level&&S.sys.level.lvl)||1; }
function vipLevel(S){ const V=SYS().vip; if(V&&typeof V.level==='function') return int0(V.level(S)); return int0(S.sys&&S.sys.vip&&S.sys.vip.level); }
const arenaBest=S=>int0(S.sys&&S.sys.arena&&S.sys.arena.bestRank);   // 0 = nunca ranqueou
const forgeLv=(S,slot)=>{ if(!S.sys||!S.sys.forge) return 0; const F=SYS().forge; return F&&typeof F.level==='function'?int0(F.level(S,slot)):0; };
function wingKind(S,host){ let it=null; try{ const eq=host&&typeof host.equipped==='function'?host.equipped():null; it=eq&&eq.wing||S.eq&&S.eq.wing||null; }catch(e){ it=null; }
  if(!it) return null; const T=SYS().stats; if(T&&typeof T.wingOf==='function'){ try{ return T.wingOf(it); }catch(e){} } return it.wing||null; }
const erasOwned=(S,id)=>{ const c=S.sys&&S.sys.erasEnd&&S.sys.erasEnd.cos; return !!(c&&Array.isArray(c.owned)&&c.owned.includes(id)); };

/* cumpre a condição? {owned, cur, need} (cur/need para barra de progresso quando houver número) */
function meets(S,host,it){ const n=it.need; if(!n) return {owned:true};
  if(n.level) { const c=playerLevel(S,host); return {owned:c>=n.level,cur:c,need:n.level}; }
  if(n.vip)   { const c=vipLevel(S); return {owned:c>=n.vip,cur:c,need:n.vip}; }
  if(n.arenaTop){ const c=arenaBest(S); return {owned:c>0&&c<=n.arenaTop,cur:c,need:n.arenaTop}; }
  if(n.erasEnd) return {owned:erasOwned(S,n.erasEnd)||ensure(S).grants.includes(it.id)};
  if(n.forge) { const c=forgeLv(S,n.forge[0]), w=!n.wing||wingKind(S,host)===n.wing; return {owned:c>=n.forge[1]&&w,cur:c,need:n.forge[1]}; }
  if(n.grant) return {owned:ensure(S).grants.includes(it.id)};
  return {owned:false}; }
const LIST={frame:()=>DATA.frames, aura:()=>DATA.auras};
function list(S,host,kind){ if(!on()) return []; const o=ensure(S), L=LIST[kind]; if(!L) return [];
  return L().map(it=>{ const m=meets(S,host,it); return {id:it.id,name:it.name,r:it.r,how:it.how,go:it.go||null,owned:m.owned,cur:m.cur,need:m.need,equipped:o[kind]===it.id}; }); }
const frames=(S,host)=>list(S,host,'frame');
const auras=(S,host)=>list(S,host,'aura');
/* retratos = os das skins que o jogador tem (Sys.appearance.fixedSkins) + o padrão do herói */
function portraits(S,host){ if(!on()) return []; const o=ensure(S), A=SYS().appearance, hero=S.hero==='kaia'?'kaia':'kael', def=hero+'_phase0', out=[{avatar:def,name:'Padrão',owned:true,how:''}];
  let sk=[]; try{ sk=A&&typeof A.fixedSkins==='function'?A.fixedSkins(S,host)||[]:[]; }catch(e){ sk=[]; }
  for(const s of sk) if(s&&s.avatar&&s.hero===hero&&!out.some(x=>x.avatar===s.avatar)) out.push({avatar:s.avatar,name:s.name,owned:!!s.owned,how:s.how||'',skin:s.id});
  return out.map(x=>({...x,equipped:(o.avatar||currentAvatar(S,host))===x.avatar})); }
function currentAvatar(S,host){ const A=SYS().appearance; try{ if(A&&typeof A.avatarKey==='function') return A.avatarKey(S,host); }catch(e){} return (S.hero==='kaia'?'kaia':'kael')+'_phase0'; }

/* equipar: kind 'frame' | 'aura' | 'avatar'; id null = volta ao padrão (moldura Simples, aura da batalha, retrato da skin). {ok, reason, how} */
function equip(S,host,kind,id){ if(!on()) return {...OFF};
  if(!['frame','aura','avatar'].includes(kind)) return {ok:false,reason:'tipo'};
  const o=ensure(S);
  if(id==null){ o[kind]=null; changed(host); return {ok:true,kind,id:null}; }
  if(kind==='avatar'){ const p=portraits(S,host).find(x=>x.avatar===id); if(!p) return {ok:false,reason:'id'}; if(!p.owned) return {ok:false,reason:'falta',how:p.how};
    o.avatar=id; changed(host); return {ok:true,kind,id}; }
  const it=LIST[kind]().find(x=>x.id===id); if(!it) return {ok:false,reason:'id'};
  if(!meets(S,host,it).owned) return {ok:false,reason:'falta',how:it.how,go:it.go||null};
  o[kind]=id;
  const E=SYS().erasEnd; if(it.need&&it.need.erasEnd&&E&&typeof E.equip==='function'){ try{ E.equip(S,kind,id); }catch(e){} }   // espelha no Sys.erasEnd (só se ele estiver ligado)
  changed(host); return {ok:true,kind,id}; }
/* prêmio visual de outro sistema (Torneio do Poder, evento): grant(S,'eterna'). Idempotente: true só na 1ª vez */
function grant(S,id,host){ if(!on()) return false; const ok=DATA.frames.some(f=>f.id===id)||DATA.auras.some(a=>a.id===id); if(!ok) return false;
  const o=ensure(S); if(o.grants.includes(id)) return false; o.grants.push(id); changed(host); return true; }
/* o que DESENHAR no perfil (e na batalha, para a aura). null = não escolheu / desligado: o jogo usa o de hoje (aura pelo +N da arma) */
function equipped(S,host){ if(!on()) return null; const o=ensure(S), val=(kind)=>{ const id=o[kind]; if(!id) return null; const it=LIST[kind]().find(x=>x.id===id); return it&&meets(S,host,it).owned?id:null; };
  return {frame:val('frame')||'none',aura:val('aura'),avatar:o.avatar||currentAvatar(S,host)}; }
const auraFor=(S,host)=>{ const e=equipped(S,host); return e?e.aura:null; };

/* ---------------- trocar nome ---------------- */
function renameQuote(S,host){ if(!on()) return {on:false}; const o=ensure(S), R=DATA.rename, free=o.renames<R.freeFirst, cost=free?0:R.gems;
  const waitMs=R.cooldownH>0&&o.lastRename?Math.max(0,o.lastRename+R.cooldownH*3600000-nowOf(host)):0;
  return {on:true,free,gems:cost,canPay:cost<=0||gemsOf(S,host)>=cost,waitMs,renames:o.renames,
    text:free?'A primeira troca é grátis; depois custa '+R.gems+' gemas.':'Custa '+R.gems+' gemas.'}; }
function gemsOf(S,host){ if(host&&typeof host.gems==='function') return num(host.gems(),0); return num(S.gems,0); }
function payGems(S,host,n){ if(n<=0) return true;
  if(host&&typeof host.spendGems==='function') return host.spendGems(n)!==false;
  if(num(S.gems,0)<n) return false; S.gems-=n; return true; }
/* troca o nome: {ok, reason:'desligado'|'nome'|'espera'|'gemas', msg, name, gems}. Valida no Sys.name (estrito), cobra e grava S.name. */
function rename(S,host,name,opt){ if(!on()) return {...OFF,msg:''}; opt=opt||{};
  const N=SYS().name; if(!N||typeof N.check!=='function') return {ok:false,reason:'nome',msg:'Tente de novo em instantes.'};
  const v=String(name==null?'':name).trim(), c=N.check(v,{minor:opt.minor,current:typeof S.name==='string'?S.name:null,strict:true});
  if(!c.ok) return {ok:false,reason:'nome',msg:c.msg||'Esse nome não é permitido.',check:c};
  const q=renameQuote(S,host);
  if(q.waitMs>0) return {ok:false,reason:'espera',msg:'Espere '+Math.ceil(q.waitMs/3600000)+' h para trocar de novo.',waitMs:q.waitMs};
  if(!q.canPay) return {ok:false,reason:'gemas',msg:'Faltam gemas.',gems:q.gems};
  if(!payGems(S,host,q.gems)) return {ok:false,reason:'gemas',msg:'Faltam gemas.',gems:q.gems};
  const o=ensure(S); S.name=v; o.renames++; o.lastRename=nowOf(host); changed(host);
  return {ok:true,name:v,gems:q.gems,msg:'Nome trocado para '+v}; }

/* ---------------- FC dos últimos 7 dias ---------------- */
/* amostra do FC (fc opcional: sem ele, Sys.fc.compute). Guarda a MAIOR do dia; 7 dias. Também alimenta o recorde 'fc'. → {day, fc, max} */
function sampleFC(S,host,fc){ if(!on()) return null;
  let v=num(fc,NaN); if(!isFinite(v)){ const F=SYS().fc; try{ v=F&&typeof F.compute==='function'?num(F.compute(S,host),NaN):NaN; }catch(e){ v=NaN; } }
  if(!isFinite(v)||v<0) return null; v=Math.round(v);
  const o=ensure(S), d=dayKey(nowOf(host)); let p=o.fc.find(x=>x.d===d);
  if(!p){ p={d,fc:0}; o.fc.push(p); o.fc.sort((a,b)=>keyIdx(a.d)-keyIdx(b.d)); }
  if(v>p.fc) p.fc=v;
  const today=keyIdx(d); o.fc=o.fc.filter(x=>keyIdx(x.d)>today-DATA.fcDays&&keyIdx(x.d)<=today);   // fora da janela sai
  record(S,'fc',v,host); return {day:d,fc:v,max:p.fc}; }
/* pontos do gráfico: 7 dias terminando hoje, do mais antigo para hoje: [{day, label, fc|null, gap}] + {max, min, last, delta} */
function fcChart(S,host){ if(!on()) return {on:false,points:[]}; const o=ensure(S), today=keyIdx(dayKey(nowOf(host))), by={};
  for(const p of o.fc) by[p.d]=p.fc;
  const points=[]; for(let i=DATA.fcDays-1;i>=0;i--){ const idx=today-i, d=idxKey(idx), v=by[d];
    points.push({day:d,label:i===0?'hoje':DATA.dayNames[new Date(idx*DAY).getUTCDay()],fc:v==null?null:v,gap:v==null}); }
  const vals=points.filter(p=>!p.gap).map(p=>p.fc), first=vals.length?vals[0]:0, last=vals.length?vals[vals.length-1]:0;
  return {on:true,points,max:vals.length?Math.max(...vals):0,min:vals.length?Math.min(...vals):0,last,delta:last-first,days:vals.length}; }

/* ---------------- recordes ---------------- */
/* guarda só o melhor (dir do DATA.records) e a data. → {ok, newRecord, prev, v} */
function record(S,key,value,host,info){ if(!on()) return {...OFF,newRecord:false}; const R=REC[key]; if(!R) return {ok:false,reason:'id',newRecord:false};
  const v=Number(value); if(!isFinite(v)||v<0||(R.dir==='min'&&v<=0)) return {ok:false,reason:'valor',newRecord:false};
  const o=ensure(S), cur=o.rec[key], better=!cur||(R.dir==='min'?v<cur.v:v>cur.v);
  if(!better) return {ok:true,newRecord:false,prev:cur.v,v:cur.v};
  const t=nowOf(host); o.rec[key]={v,at:t,day:dayKey(t),info:info==null?'':String(info).slice(0,40)};
  return {ok:true,newRecord:true,prev:cur?cur.v:null,v}; }
/* soma do dia (ex.: ouro ganho hoje) e recorde do dia: addDaily(S,host,'goldDay',n) */
function addDaily(S,host,key,n){ if(!on()) return {...OFF}; if(!DATA.daily.includes(key)) return {ok:false,reason:'id'};
  const o=ensure(S), d=dayKey(nowOf(host)); if(o.daily.day!==d){ o.daily.day=d; for(const k of DATA.daily) o.daily[k]=0; }
  o.daily[key]+=Math.max(0,num(Number(n),0)); const r=record(S,key,o.daily[key],host); return {ok:true,today:o.daily[key],newRecord:r.newRecord}; }
/* puxa o que os outros módulos já guardam (fase, torre, arena, FC). Chamar ao abrir o Perfil. Não escreve nos outros módulos. */
function sync(S,host){ if(!on()) return {...OFF}; const out=[], put=(k,v)=>{ if(v>0){ const r=record(S,k,v,host); if(r.newRecord) out.push(k); } }, sys=S.sys||{};
  put('stage',Math.max(int0(S.best),int0(host&&host.stage&&host.stage())));
  put('tower',int0(sys.tower&&sys.tower.best));
  if(sys.arena){ put('arenaRank',int0(sys.arena.bestRank)); put('arenaLp',int0(sys.arena.lp)); if(int0(sys.arena.league)>0) put('arenaLeague',int0(sys.arena.league)); }
  sampleFC(S,host);
  return {ok:true,updated:out}; }
function records(S){ if(!on()) return []; const o=ensure(S), L=SYS().arena&&SYS().arena.DATA&&SYS().arena.DATA.leagues;
  return DATA.records.map(R=>{ const r=o.rec[R.id]; const text=!r?'—':R.id==='arenaLeague'&&L&&L[r.v]?L[r.v].name:R.id==='arenaRank'?r.v+'º':String(r.v)+(R.unit?' '+R.unit:'');
    return {id:R.id,name:R.name,dir:R.dir,unit:R.unit||'',has:!!r,v:r?r.v:null,text,at:r?r.at:0,day:r?r.day:'',info:r?r.info:''}; }); }

/* ---------------- resumo para a tela ---------------- */
function view(S,host){ if(!on()) return {on:false};
  return {on:true,name:typeof S.name==='string'?S.name:'',rename:renameQuote(S,host),equipped:equipped(S,host),
    frames:frames(S,host),auras:auras(S,host),portraits:portraits(S,host),fc:fcChart(S,host),records:records(S)}; }

const API={DATA,setOn,ensure,dayKey,frames,auras,portraits,equip,grant,equipped,auraFor,renameQuote,rename,sampleFC,fcChart,record,addDaily,sync,records,view};
root.Sys=root.Sys||{}; root.Sys.profile=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
