/* Eonbound — Sys.events: EVENTOS temporários. Cada evento tem início e fim, missões próprias que dão PONTOS do evento e uma LOJA de pontos
   (skins e materiais, compra direta: nada de sorteio, nada pago). Depois do fim, a loja fica aberta por graceDays para gastar os pontos; aí os pontos somem.
   Entrega por Sys.loot.grantBundle (portões e itens guardados). Estado em S.sys.events[id]. Relatório: reports/sys-mail-login-eventos.md
   OCORRÊNCIAS (calendário do servidor, docs/CALENDARIO_EVENTOS.md): o servidor manda GET /events → [{id, start, end, graceEnd}] (ms UTC) e cada
   ocorrência tem id PRÓPRIO = <tema>_<AAMMDD do início em Brasília> (ex.: festival_eras_261120). O jogo acha o TEMA pelo prefixo (DATA.themes) e
   guarda tudo por id COMPLETO: pontos, missões, compras (limites), trilha (Sys.evtrail) e ranking (Sys.eventRank). Ocorrência nova = começa do zero.
   Prefixo desconhecido = ignorado (não entra no calendário, estado apagado). setCalendar(lista, S) aplica e guarda uma cópia no save
   (S.sys.evcal) para o próximo boot sem rede; load(S, host) busca no servidor. Sem calendário, vale o evento local de DATA.events (id sem sufixo). */
(function(root){
'use strict';
/* TEMAS: as regras de cada evento (missões, pontos repetíveis, loja). A data vem do calendário. */
const THEMES={
  festival_eras:{
    name:'Festival das Eras', points:'Medalhas do Festival', icon:'🎉', days:14,
    // missões do evento (uma vez cada, valem pelo evento todo)
    // PRISMÁTICO (Revisão 5 aprovada pelo PO; fps-e2): 100 fragmentos por evento, SEM sorteio = 5 missões × 10 (prism) + loja 5 × 10.
    // Só entregam com Sys.pet.DATA.v3 e v4 ligadas; desligadas, as missões dão só os pontos e o item da loja não aparece.
    missions:[
      {id:'f_kill',  k:'kill',    need:2000, pts:40, prism:10, txt:'Derrote 2.000 inimigos'},
      {id:'f_boss',  k:'boss',    need:30,   pts:40, prism:10, txt:'Derrote 30 chefes'},
      {id:'f_inst',  k:'instance',need:15,   pts:40, prism:10, txt:'Vença 15 instâncias'},
      {id:'f_chest', k:'chest',   need:20,   pts:30, prism:10, txt:'Abra 20 baús'},
      {id:'f_ult',   k:'ult',     need:30,   pts:30, prism:10, txt:'Use a ultimate 30 vezes'},
    ],
    // pontos repetíveis: a cada `every` do evento k ganha pts, até `cap` pontos no evento
    repeat:[{k:'kill', every:250, pts:5, cap:200}],
    // loja de pontos (limit = compras por OCORRÊNCIA). Skins são só visuais (quem já tem a skin não compra de novo). Item fixo respeita o portão.
    shop:[
      {id:'s_skin_w', cost:150, limit:1,  reward:{skin:'festival_weapon'}, txt:'Skin de arma "Lâmina do Festival"'},
      {id:'s_skin_a', cost:150, limit:1,  reward:{skin:'festival_armor'},  txt:'Skin de roupa "Traje do Festival"'},
      {id:'s_item',   cost:120, limit:1,  reward:{items:[{slot:'necklace',r:2}]}, txt:'Colar Épico da era atual'},
      {id:'s_ess',    cost:40,  limit:5,  reward:{essence:5}, txt:'5 Essências da Era'},
      {id:'s_forge',  cost:30,  limit:5,  reward:{forge:20},  txt:'20 Pedras de Forja'},
      {id:'s_food',   cost:25,  limit:5,  reward:{food:20},   txt:'20 Rações de Pet'},
      {id:'s_gold',   cost:20,  limit:10, reward:{goldk:50},  txt:'Saco de ouro'},
      {id:'s_prism',  cost:20,  limit:5,  reward:{petFrags:{prism:10}}, needs:'prism', txt:'10 fragmentos do Prismático'},
    ],
  },
  /* TEMAS NOVOS (dono 14/11, via PO: os 3; docs/EVENTOS_TEMAS.md). Mesmo motor e mesmo total de pontos do Festival; ouro igual ao do Festival
     (Saco de ouro 10×; trilha 48/72/96/120); sem missão de invocação, sem ovo, sem baú à venda, sem diamante. Skin e moldura só aparecem na loja
     quando a arte estiver no jogo (needs:'skin'/'frame' + DATA.ready). Entram no calendário nas ocorrências #2, #4 e #6. */
  cacada_chefes:{
    name:'Caçada aos Chefes', points:'Troféus da Caçada', icon:'🏹', days:14,
    missions:[
      {id:'c_boss',  k:'boss',    need:40, pts:40, prism:10, txt:'Derrote 40 chefes'},
      {id:'c_tower', k:'tower',   need:20, pts:40, prism:10, txt:'Vença 20 andares da Torre'},
      {id:'c_evb',   k:'evboss',  need:10, pts:40, prism:10, txt:'Ataque o chefe do evento 10 vezes'},
      {id:'c_inst',  k:'instance',need:15, pts:30, prism:10, txt:'Vença 15 instâncias'},
      {id:'c_ult',   k:'ult',     need:40, pts:30, prism:10, txt:'Use a ultimate 40 vezes'},
    ],
    repeat:[{k:'boss', every:5, pts:5, cap:200}],
    shop:[
      {id:'s_skin_w', cost:150, limit:1,  reward:{skin:'cacada_weapon'}, needs:'skin', txt:'Skin de arma "Lâmina do Caçador"'},
      {id:'s_frame',  cost:100, limit:1,  reward:{frame:'evt_cacada'}, needs:'frame', txt:'Moldura "Caçador"'},
      {id:'s_item',   cost:120, limit:1,  reward:{items:[{slot:'boots',r:2}]}, txt:'Botas Épicas da era atual'},
      {id:'s_ess',    cost:40,  limit:5,  reward:{essence:5}, txt:'5 Essências da Era'},
      {id:'s_forge',  cost:30,  limit:5,  reward:{forge:20},  txt:'20 Pedras de Forja'},
      {id:'s_food',   cost:25,  limit:5,  reward:{food:20},   txt:'20 Rações de Pet'},
      {id:'s_gold',   cost:20,  limit:10, reward:{goldk:50},  txt:'Saco de ouro'},
      {id:'s_prism',  cost:20,  limit:5,  reward:{petFrags:{prism:10}}, needs:'prism', txt:'10 fragmentos do Prismático'},
    ],
  },
  semana_forja:{
    name:'Semana da Forja', points:'Martelos da Forja', icon:'🔨', days:14,
    missions:[
      {id:'w_forge', k:'forge',   need:30,   pts:40, prism:10, txt:'Forje 30 vezes'},
      {id:'w_upg',   k:'upgrade', need:60,   pts:40, prism:10, txt:'Melhore equipamentos 60 vezes'},
      {id:'w_chest', k:'chest',   need:20,   pts:30, prism:10, txt:'Abra 20 baús'},
      {id:'w_boss',  k:'boss',    need:20,   pts:40, prism:10, txt:'Derrote 20 chefes'},
      {id:'w_kill',  k:'kill',    need:2000, pts:30, prism:10, txt:'Derrote 2.000 inimigos'},
    ],
    repeat:[{k:'upgrade', every:10, pts:5, cap:200}],
    shop:[
      {id:'s_skin_w', cost:150, limit:1,  reward:{skin:'forja_weapon'}, needs:'skin', txt:'Skin de arma "Martelo das Eras"'},
      {id:'s_skin_a', cost:150, limit:1,  reward:{skin:'forja_armor'},  needs:'skin', txt:'Skin de roupa "Avental do Ferreiro"'},
      {id:'s_item',   cost:120, limit:1,  reward:{items:[{slot:'gloves',r:2}]}, txt:'Luvas Épicas da era atual'},
      {id:'s_forge',  cost:25,  limit:8,  reward:{forge:20},  txt:'20 Pedras de Forja'},
      {id:'s_ess',    cost:40,  limit:5,  reward:{essence:5}, txt:'5 Essências da Era'},
      {id:'s_gold',   cost:20,  limit:10, reward:{goldk:50},  txt:'Saco de ouro'},
      {id:'s_prism',  cost:20,  limit:5,  reward:{petFrags:{prism:10}}, needs:'prism', txt:'10 fragmentos do Prismático'},
    ],
  },
  festa_pets:{
    name:'Festa dos Pets', points:'Laços da Festa', icon:'🐾', days:14,
    missions:[
      {id:'p_feed',  k:'petfeed', need:100,  pts:40, prism:10, txt:'Alimente o pet 100 vezes'},
      {id:'p_lvl',   k:'petlevel',need:10,   pts:40, prism:10, txt:'Suba o pet 10 níveis'},
      {id:'p_kill',  k:'kill',    need:2000, pts:30, prism:10, txt:'Derrote 2.000 inimigos'},
      {id:'p_boss',  k:'boss',    need:30,   pts:40, prism:10, txt:'Derrote 30 chefes'},
      {id:'p_chest', k:'chest',   need:20,   pts:30, prism:10, txt:'Abra 20 baús'},
    ],
    repeat:[{k:'petfeed', every:20, pts:5, cap:200}],
    shop:[
      {id:'s_frame',  cost:100, limit:1,  reward:{frame:'evt_pets'}, needs:'frame', txt:'Moldura "Festa dos Pets"'},
      {id:'s_food',   cost:20,  limit:8,  reward:{food:20},   txt:'20 Rações de Pet'},
      {id:'s_ess',    cost:40,  limit:5,  reward:{essence:5}, txt:'5 Essências da Era'},
      {id:'s_forge',  cost:30,  limit:5,  reward:{forge:20},  txt:'20 Pedras de Forja'},
      {id:'s_gold',   cost:20,  limit:10, reward:{goldk:50},  txt:'Saco de ouro'},
      {id:'s_prism',  cost:20,  limit:5,  reward:{petFrags:{prism:10}}, needs:'prism', txt:'10 fragmentos do Prismático'},
    ],
  },
};
const occ=(base,id,w)=>Object.assign({},THEMES[base],{id,base},w);
const DATA={
  enabled:false,   // CHAVE (PO): desligado até o dono aprovar a tela; o jogo liga com Sys.events.DATA.enabled=true
  graceDays:2,     // carência da loja quando a ocorrência não traz graceEnd (o calendário do servidor usa fim + 2 dias)
  maxDays:60,      // ocorrência mais longa que o servidor aceita
  themes:THEMES,
  // ARTE PRONTA (Engenheiro/Arte preenchem quando a arte entrar no jogo): ids de skin e de moldura. Item da loja com needs:'skin'|'frame' só aparece
  // se o id estiver aqui; até lá fica ESCONDIDO (ninguém compra o que não existe). Ex.: ready:['cacada_weapon','evt_cacada']
  ready:[],
  calendar:false,  // true depois de setCalendar (DATA.events passa a ser a lista do servidor)
  // evento LOCAL (sem servidor): datas locais (AAAA-MM-DD), fim exclusivo, 14 dias. Com o calendário, DATA.events vira a lista de ocorrências.
  events:[occ('festival_eras','festival_eras',{start:'2026-11-20', end:'2026-12-04'})],
};
const LOCAL=DATA.events.slice();
const EVENTS=['kill','boss','ult','chest','instance','forge','summon','upgrade','tower','evboss','petfeed','petlevel'];   // os 4 últimos: os módulos contam sozinhos (tower.js, evtrail.js, pet.js)
const DAY=86400000, BR=3*3600000;   // Brasília = UTC−3 (sem horário de verão)
const ID_RE=/^[a-z0-9_]{3,40}$/;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const Loot=()=>root.Sys&&root.Sys.loot;
function ms(d){ if(typeof d==='number') return d; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||'')); return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():NaN; }
/* data do calendário: número (ms UTC) ou texto ISO com fuso */
const tms=v=>typeof v==='number'?v:(typeof v==='string'&&/T/.test(v)?Date.parse(v):NaN);
/* tema pelo id: o próprio tema, ou <tema>_<AAMMDD> com data válida. Desconhecido → null */
function sufDay(id){ const m=/^(.+)_(\d{2})(\d{2})(\d{2})$/.exec(id); if(!m) return null; const y=2000+ +m[2], mo=+m[3], d=+m[4], t=Date.UTC(y,mo-1,d)+BR, x=new Date(t-BR);
  return x.getUTCFullYear()===y&&x.getUTCMonth()===mo-1&&x.getUTCDate()===d?{base:m[1],start:t}:null; }
function base(id){ if(typeof id!=='string'||!ID_RE.test(id)) return null; if(Object.prototype.hasOwnProperty.call(THEMES,id)) return id;
  const s=sufDay(id); return s&&Object.prototype.hasOwnProperty.call(THEMES,s.base)?s.base:null; }
const byId=id=>DATA.events.find(e=>e.id===id)||null;
/* definição de um id: a ocorrência do calendário; fora dele, o TEMA (regras e loja) sem janela (fase 'fim'). Serve ao Sys.evtrail.earned no servidor. */
function def(id){ const e=byId(id); if(e) return e; const b=base(id); return b?occ(b,id,{start:NaN,end:NaN}):null; }
/* nome visível: tema + data de início ('Festival das Eras · 20/11/2026') */
function nameOf(id){ const b=base(id); if(!b) return ''; const s=sufDay(id); if(!s||b===id) return THEMES[b].name;
  const d=new Date(s.start-BR), p=n=>String(n).padStart(2,'0'); return THEMES[b].name+' · '+p(d.getUTCDate())+'/'+p(d.getUTCMonth()+1)+'/'+d.getUTCFullYear(); }
/* Prismático ligado? (as duas chaves de pets da fps-e2) */
const prismOn=()=>{ const P=root.Sys&&root.Sys.pet; return !!(P&&P.DATA&&P.DATA.v3===true&&P.DATA.v4===true); };
const ready=id=>typeof id==='string'&&Array.isArray(DATA.ready)&&DATA.ready.includes(id);
const visible=x=>!x.needs||(x.needs==='prism'&&prismOn())||(x.needs==='skin'&&ready(x.reward&&x.reward.skin))||(x.needs==='frame'&&ready(x.reward&&x.reward.frame));
/* moldura do evento no catálogo do Perfil (Sys.profile.frames): null = ainda não está no jogo; {owned} = está */
const frameOf=(S,host,id)=>{ const P=root.Sys&&root.Sys.profile; try{ return P&&typeof P.frames==='function'?(P.frames(S,host)||[]).find(f=>f.id===id)||null:null; }catch(e){ return null; } };
const frameOwned=(S,id)=>{ const f=frameOf(S,null,id); return !!(f&&f.owned); };
const owns=(S,x)=>!!(x.reward&&((x.reward.skin&&S&&Array.isArray(S.skins)&&S.skins.includes(x.reward.skin))||(x.reward.frame&&frameOwned(S,x.reward.frame))));

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.events.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.events; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.events={};
  // guarda o estado de toda ocorrência de tema conhecido (mesmo fora do calendário carregado agora: no boot ele chega depois)
  for(const id in o){ const s=o[id]; if(!base(id)||!s||typeof s!=='object'){ delete o[id]; continue; }
    s.pts=int0(s.pts); s.rep=int0(s.rep); if(!s.p||typeof s.p!=='object') s.p={}; for(const k in s.p){ if(!EVENTS.includes(k)) delete s.p[k]; else s.p[k]=int0(s.p[k]); }
    if(!Array.isArray(s.c)) s.c=[]; if(!s.buys||typeof s.buys!=='object') s.buys={}; for(const k in s.buys) s.buys[k]=int0(s.buys[k]); }
  return o;
}
function st(S,id){ const o=ensure(S); return o[id]||(o[id]={pts:0,rep:0,p:{},c:[],buys:{}}); }

/* ---------------- CALENDÁRIO (ocorrências do servidor) ---------------- */
/* valida uma entrada {id, start, end, graceEnd, requires?, minClientVersion?} → ocorrência ou null (tema desconhecido, datas ruins, > maxDays) */
function parseOcc(x){ if(!x||typeof x!=='object') return null; const id=x.id, b=base(id); if(!b) return null;
  const a=tms(x.start), e=tms(x.end), g=x.graceEnd==null?e+DATA.graceDays*DAY:tms(x.graceEnd);
  if(!(isFinite(a)&&isFinite(e)&&isFinite(g))||!(a<e&&e<=g)||e-a>DATA.maxDays*DAY) return null;
  const w={start:a,end:e,graceEnd:g}; if(Array.isArray(x.requires)) w.requires=x.requires.filter(k=>typeof k==='string').slice(0,10);
  if(typeof x.minClientVersion==='string') w.minClientVersion=x.minClientVersion; return occ(b,id,w); }
/* estado de um evento LOCAL sem sufixo (festival_eras) passa para a ocorrência do calendário que começa no mesmo dia (festival_eras_261120) */
function adopt(S){ if(!S||!S.sys) return; for(const key of ['events','evtrail']){ const o=S.sys[key]; if(!o||typeof o!=='object') continue;
    for(const L of LOCAL){ if(!o[L.id]) continue; const a=ms(L.start); if(!isFinite(a)) continue; const d=new Date(a), p=n=>String(n).padStart(2,'0');
      const to=L.base+'_'+p(d.getFullYear()%100)+p(d.getMonth()+1)+p(d.getDate()); if(byId(to)&&!o[to]){ o[to]=o[L.id]; delete o[L.id]; } } } }
/* aplica a lista do servidor (GET /events). Lista inválida (não é array) não muda nada. Com S, guarda a lista no save e adota o estado local.
   → {ok, n, ignored:[ids]} */
function setCalendar(list,S){ if(!Array.isArray(list)) return {ok:false,reason:'data'}; const out=[], ignored=[], seen=new Set();
  for(const x of list.slice(0,200)){ const o=parseOcc(x); if(!o||seen.has(o.id)){ ignored.push(x&&typeof x.id==='string'?x.id.slice(0,40):'?'); continue; } seen.add(o.id); out.push(o); }
  out.sort((a,b)=>a.start-b.start); DATA.events=out; DATA.calendar=true;
  if(S&&typeof S==='object'){ ensure(S); S.sys.evcal=out.map(o=>{ const r={id:o.id,start:o.start,end:o.end,graceEnd:o.graceEnd}; if(o.requires) r.requires=o.requires.slice(); if(o.minClientVersion) r.minClientVersion=o.minClientVersion; return r; }); adopt(S); }
  return {ok:true,n:out.length,ignored}; }
/* boot sem rede: usa o calendário guardado no save (se o desta sessão ainda não chegou) */
function restore(S){ if(DATA.calendar||!S||!S.sys||!Array.isArray(S.sys.evcal)) return false; setCalendar(S.sys.evcal,null); adopt(S); return true; }
/* busca o calendário no servidor (Sys.net.events) e aplica. Promise {ok, n, ignored} ou {ok:false, reason} */
async function load(S,host){ const N=root.Sys&&root.Sys.net; if(!N||typeof N.events!=='function') return {ok:false,reason:'net_off'};
  let d; try{ d=await N.events(); }catch(e){ return {ok:false,reason:(e&&e.code)||'error'}; } return setCalendar(d,S); }

/* fase do evento agora: 'antes' | 'ativo' | 'loja' (até graceEnd, ou fim + graceDays) | 'fim' */
function phase(ev,host){ const now=nowOf(host), a=ms(ev.start), b=ms(ev.end), g=ev.graceEnd!=null?ms(ev.graceEnd):b+DATA.graceDays*DAY;
  if(!(isFinite(a)&&isFinite(b)&&isFinite(g))) return 'fim'; if(now<a) return 'antes'; if(now<b) return 'ativo'; if(now<g) return 'loja'; return 'fim'; }
const graceOf=ev=>ev.graceEnd!=null?ms(ev.graceEnd):ms(ev.end)+DATA.graceDays*DAY;
/* eventos visíveis agora (ativos ou com loja aberta): [{id, base, name, phase, pts, endsAt}] */
function list(S,host){
  if(!DATA.enabled) return []; restore(S);
  return DATA.events.filter(ev=>['ativo','loja'].includes(phase(ev,host))).map(ev=>{ const s=st(S,ev.id), ph=phase(ev,host);
    return {id:ev.id,base:ev.base,name:ev.name,icon:ev.icon,points:ev.points,phase:ph,pts:s.pts,start:ms(ev.start),endsAt:ph==='ativo'?ms(ev.end):graceOf(ev)}; });
}
/* evento do jogo (abate, chefe, instância...). Só conta em evento ATIVO. Pontos repetíveis entram na hora (até o teto). */
function track(S,host,k,n){
  if(!DATA.enabled||!EVENTS.includes(k)) return; const v=int0(n==null?1:n); if(!v) return; restore(S);
  for(const ev of DATA.events){ if(phase(ev,host)!=='ativo') continue; const s=st(S,ev.id), before=s.p[k]||0; s.p[k]=before+v;
    for(const r of ev.repeat||[]){ if(r.k!==k) continue; const steps=Math.floor(s.p[k]/r.every)-Math.floor(before/r.every);
      const add=Math.max(0,Math.min(steps*r.pts,r.cap-s.rep)); s.rep+=add; s.pts+=add; } }
}
function missions(S,host,id){ restore(S); const ev=byId(id); if(!ev) return []; const s=st(S,id);
  return ev.missions.map(m=>({id:m.id,txt:m.txt,need:m.need,pts:m.pts,prism:prismOn()?int0(m.prism):0,p:Math.min(m.need,s.p[m.k]||0),done:(s.p[m.k]||0)>=m.need,claimed:s.c.includes(m.id)})); }
/* resgata missão do evento (só com o evento ativo ou na loja) → {ok, pts} */
function claimMission(S,host,id,mid){
  if(!DATA.enabled) return {ok:false,reason:'desligado'}; restore(S);
  const ev=byId(id); if(!ev) return {ok:false,reason:'evento'}; if(!['ativo','loja'].includes(phase(ev,host))) return {ok:false,reason:'fechado'};
  const m=missions(S,host,id).find(x=>x.id===mid); if(!m) return {ok:false,reason:'id'}; if(!m.done) return {ok:false,reason:'incompleto'}; if(m.claimed) return {ok:false,reason:'resgatado'};
  const s=st(S,id); s.c.push(mid); s.pts+=m.pts;
  let got=null; if(m.prism){ const L=Loot(); if(L&&L.grantBundle) got=L.grantBundle(S,host,{petFrags:{prism:m.prism}}); }   // fragmentos do Prismático (só com as chaves)
  return {ok:true,pts:m.pts,total:s.pts,prism:m.prism||0,got};
}
function shop(S,host,id){ restore(S); const ev=byId(id); if(!ev) return []; const s=st(S,id);
  return ev.shop.filter(visible).map(x=>{ const own=owns(S,x); return {id:x.id,txt:x.txt,cost:x.cost,limit:x.limit,bought:s.buys[x.id]||0,owned:own,canBuy:!own&&(s.buys[x.id]||0)<x.limit&&s.pts>=x.cost,reward:x.reward}; }); }
/* compra na loja de pontos (compra direta; nunca sorteio) → {ok, got} */
function buy(S,host,id,sid){
  if(!DATA.enabled) return {ok:false,reason:'desligado'}; restore(S);
  const ev=byId(id); if(!ev) return {ok:false,reason:'evento'}; if(!['ativo','loja'].includes(phase(ev,host))) return {ok:false,reason:'fechado'};
  const x=ev.shop.find(y=>y.id===sid); if(!x||!visible(x)) return {ok:false,reason:'id'}; const s=st(S,id);
  if((s.buys[sid]||0)>=x.limit) return {ok:false,reason:'limite'}; if(owns(S,x)) return {ok:false,reason:'possui'}; if(s.pts<x.cost) return {ok:false,reason:'pontos'};
  const L=Loot(); if(!L||!L.grantBundle) return {ok:false,reason:'loot'};
  const rw=Object.assign({},x.reward), fr=rw.frame; delete rw.frame; const P=root.Sys&&root.Sys.profile;
  // moldura vai pelo Sys.profile.grant (o grantBundle não conhece moldura): só vende se ela já está no catálogo do Perfil (need:{grant:true}) e ligada
  if(fr&&!(P&&typeof P.grant==='function'&&frameOf(S,host,fr))) return {ok:false,reason:'profile'};
  s.pts-=x.cost; s.buys[sid]=(s.buys[sid]||0)+1;
  const got=Object.keys(rw).length?L.grantBundle(S,host,rw):{}; if(fr){ try{ P.grant(S,fr,host); }catch(e){} got.frame=fr; }
  return {ok:true,got,left:s.pts};
}
/* depois do fim + carência, apaga o estado da ocorrência (os pontos somem; a trilha do Sys.evtrail da mesma ocorrência também).
   Ocorrência fora do calendário atual: apaga quando passou do maior prazo possível (início + maxDays + graceDays). */
function cleanup(S,host){ restore(S); const o=ensure(S), now=nowOf(host), T=S.sys.evtrail;
  for(const id in o){ const ev=byId(id); let gone;
    if(ev) gone=phase(ev,host)==='fim';
    else { const L=LOCAL.find(x=>x.id===id), s=sufDay(id), a=L?ms(L.start):s?s.start:NaN; gone=!isFinite(a)||now>=a+(DATA.maxDays+DATA.graceDays)*DAY; }
    if(gone){ delete o[id]; if(T&&typeof T==='object') delete T[id]; } } }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,EVENTS,ensure,phase,list,track,missions,claimMission,shop,buy,cleanup,bonus,base,def,nameOf,setCalendar,restore,load};
root.Sys=root.Sys||{}; root.Sys.events=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
