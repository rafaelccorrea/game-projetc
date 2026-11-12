/* Eonbound — Sys.events: EVENTOS temporários. Cada evento tem início e fim, missões próprias que dão PONTOS do evento e uma LOJA de pontos
   (skins e materiais, compra direta: nada de sorteio, nada pago). Depois do fim, a loja fica aberta por graceDays para gastar os pontos; aí os pontos somem.
   Entrega por Sys.loot.grantBundle (portões e itens guardados). Estado em S.sys.events[id]. Relatório: reports/sys-mail-login-eventos.md */
(function(root){
'use strict';
const DATA={
  enabled:false,   // CHAVE (PO): desligado até o dono aprovar a tela; o jogo liga com Sys.events.DATA.enabled=true
  graceDays:2,
  events:[{
    id:'festival_eras', name:'Festival das Eras', points:'Medalhas do Festival', icon:'🎉',
    start:'2026-11-20', end:'2026-12-04',   // datas locais (AAAA-MM-DD), fim exclusivo: 14 dias. O jogo pode trocar o calendário.
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
    // loja de pontos (limit = compras por evento). Skins são só visuais. Item fixo respeita o portão (acima dele, fica guardado).
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
  }],
};
const EVENTS=['kill','boss','ult','chest','instance','forge','summon','upgrade'];
const DAY=86400000;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
const Loot=()=>root.Sys&&root.Sys.loot;
function ms(d){ if(typeof d==='number') return d; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||'')); return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():NaN; }
const byId=id=>DATA.events.find(e=>e.id===id)||null;
/* Prismático ligado? (as duas chaves de pets da fps-e2) */
const prismOn=()=>{ const P=root.Sys&&root.Sys.pet; return !!(P&&P.DATA&&P.DATA.v3===true&&P.DATA.v4===true); };
const visible=x=>!x.needs||(x.needs==='prism'&&prismOn());

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.events.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.events; if(!o||typeof o!=='object'||Array.isArray(o)) o=S.sys.events={};
  for(const id in o){ const s=o[id]; if(!byId(id)||!s||typeof s!=='object'){ delete o[id]; continue; }
    s.pts=int0(s.pts); s.rep=int0(s.rep); if(!s.p||typeof s.p!=='object') s.p={}; for(const k in s.p){ if(!EVENTS.includes(k)) delete s.p[k]; else s.p[k]=int0(s.p[k]); }
    if(!Array.isArray(s.c)) s.c=[]; if(!s.buys||typeof s.buys!=='object') s.buys={}; for(const k in s.buys) s.buys[k]=int0(s.buys[k]); }
  return o;
}
function st(S,id){ const o=ensure(S); return o[id]||(o[id]={pts:0,rep:0,p:{},c:[],buys:{}}); }
/* fase do evento agora: 'antes' | 'ativo' | 'loja' (fim + graceDays) | 'fim' */
function phase(ev,host){ const now=nowOf(host), a=ms(ev.start), b=ms(ev.end);
  if(!(isFinite(a)&&isFinite(b))) return 'fim'; if(now<a) return 'antes'; if(now<b) return 'ativo'; if(now<b+DATA.graceDays*DAY) return 'loja'; return 'fim'; }
/* eventos visíveis agora (ativos ou com loja aberta): [{id, name, phase, pts, endsIn}] */
function list(S,host){
  if(!DATA.enabled) return [];
  return DATA.events.filter(ev=>['ativo','loja'].includes(phase(ev,host))).map(ev=>{ const s=st(S,ev.id), ph=phase(ev,host);
    return {id:ev.id,name:ev.name,icon:ev.icon,points:ev.points,phase:ph,pts:s.pts,endsAt:ph==='ativo'?ms(ev.end):ms(ev.end)+DATA.graceDays*DAY}; });
}
/* evento do jogo (abate, chefe, instância...). Só conta em evento ATIVO. Pontos repetíveis entram na hora (até o teto). */
function track(S,host,k,n){
  if(!DATA.enabled||!EVENTS.includes(k)) return; const v=int0(n==null?1:n); if(!v) return;
  for(const ev of DATA.events){ if(phase(ev,host)!=='ativo') continue; const s=st(S,ev.id), before=s.p[k]||0; s.p[k]=before+v;
    for(const r of ev.repeat||[]){ if(r.k!==k) continue; const steps=Math.floor(s.p[k]/r.every)-Math.floor(before/r.every);
      const add=Math.max(0,Math.min(steps*r.pts,r.cap-s.rep)); s.rep+=add; s.pts+=add; } }
}
function missions(S,host,id){ const ev=byId(id); if(!ev) return []; const s=st(S,id);
  return ev.missions.map(m=>({id:m.id,txt:m.txt,need:m.need,pts:m.pts,prism:prismOn()?int0(m.prism):0,p:Math.min(m.need,s.p[m.k]||0),done:(s.p[m.k]||0)>=m.need,claimed:s.c.includes(m.id)})); }
/* resgata missão do evento (só com o evento ativo ou na loja) → {ok, pts} */
function claimMission(S,host,id,mid){
  if(!DATA.enabled) return {ok:false,reason:'desligado'};
  const ev=byId(id); if(!ev) return {ok:false,reason:'evento'}; if(!['ativo','loja'].includes(phase(ev,host))) return {ok:false,reason:'fechado'};
  const m=missions(S,host,id).find(x=>x.id===mid); if(!m) return {ok:false,reason:'id'}; if(!m.done) return {ok:false,reason:'incompleto'}; if(m.claimed) return {ok:false,reason:'resgatado'};
  const s=st(S,id); s.c.push(mid); s.pts+=m.pts;
  let got=null; if(m.prism){ const L=Loot(); if(L&&L.grantBundle) got=L.grantBundle(S,host,{petFrags:{prism:m.prism}}); }   // fragmentos do Prismático (só com as chaves)
  return {ok:true,pts:m.pts,total:s.pts,prism:m.prism||0,got};
}
function shop(S,host,id){ const ev=byId(id); if(!ev) return []; const s=st(S,id);
  return ev.shop.filter(visible).map(x=>({id:x.id,txt:x.txt,cost:x.cost,limit:x.limit,bought:s.buys[x.id]||0,canBuy:(s.buys[x.id]||0)<x.limit&&s.pts>=x.cost,reward:x.reward})); }
/* compra na loja de pontos (compra direta; nunca sorteio) → {ok, got} */
function buy(S,host,id,sid){
  if(!DATA.enabled) return {ok:false,reason:'desligado'};
  const ev=byId(id); if(!ev) return {ok:false,reason:'evento'}; if(!['ativo','loja'].includes(phase(ev,host))) return {ok:false,reason:'fechado'};
  const x=ev.shop.find(y=>y.id===sid); if(!x||!visible(x)) return {ok:false,reason:'id'}; const s=st(S,id);
  if((s.buys[sid]||0)>=x.limit) return {ok:false,reason:'limite'}; if(s.pts<x.cost) return {ok:false,reason:'pontos'};
  const L=Loot(); if(!L||!L.grantBundle) return {ok:false,reason:'loot'};
  s.pts-=x.cost; s.buys[sid]=(s.buys[sid]||0)+1;
  return {ok:true,got:L.grantBundle(S,host,x.reward),left:s.pts};
}
/* depois do fim + carência, apaga o estado do evento (os pontos somem) */
function cleanup(S,host){ const o=ensure(S); for(const id in o){ const ev=byId(id); if(!ev||phase(ev,host)==='fim') delete o[id]; } }

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});
const API={DATA,ensure,phase,list,track,missions,claimMission,shop,buy,cleanup,bonus};
root.Sys=root.Sys||{}; root.Sys.events=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
