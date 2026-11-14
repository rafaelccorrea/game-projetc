/* Eonbound — Sys.today: LISTA "HOJE" + "PEGAR TUDO" (docs/LOM_VS_EONBOUND.md §5 item 13). CHAVE DESLIGADA (DATA.on=false).
   Junta numa lista só o que dá para fazer AGORA nos outros módulos e um botão "Pegar tudo" que resgata o que é RESGATE PURO.
   Regras do "Pegar tudo" (fixas): NUNCA gasta moeda (ouro, diamante, Brasa, pedra, picareta, entrada), NUNCA começa luta, NUNCA abre nada pago
   (trilha premium do passe fica de fora, mesmo comprada: o jogador pega na tela do passe). Não cria prêmio: cada resgate é a função do próprio
   módulo, com os tetos dele (ouro ≤ 5 min de abate por resgate, docs/ECONOMIA_OURO.md). Nada aqui tem sorteio próprio.
   Lê os módulos DEFENSIVAMENTE: módulo ausente, desligado ou com erro é pulado (nunca derruba a lista).
   Tipos de linha: kind 'claim' (entra no Pegar tudo) · kind 'go' (só aviso; o toque abre a tela: host.goTab(tab)).
   Sem estado no save (S.sys.today não existe). Sem DOM. Teste: test/sys/today.test.js */
(function(root){
'use strict';
const DATA={
  on:false,
  label:'Hoje', icon:'',
  chestMax:20,        // baús de abate abertos por "Pegar tudo" (o resto fica guardado)
  digFullAt:1,        // picaretas para avisar a Escavação (1 = qualquer picareta)
};
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const on=()=>DATA.on===true;
const setOn=v=>{ DATA.on=!!v; return DATA.on; };
const SYS=()=>root.Sys||{};
const fn=(m,k)=>!!(m&&typeof m[k]==='function');
const safe=(f,d)=>{ try{ const r=f(); return r===undefined?d:r; }catch(e){ return d; } };
const bagFull=host=>!!(host&&typeof host.bagFull==='function'&&safe(()=>host.bagFull(),false));

/* ---------------- fontes: cada uma devolve {count, ...} ou null (nada agora) e, se for resgate, claim() ---------------- */
const SOURCES=[
  {id:'login', icon:'calendar', label:'Login do dia', tab:'login', kind:'claim',
    peek:(S,h)=>{ const L=SYS().login; if(!L||!L.DATA||L.DATA.enabled!==true||!fn(L,'status')) return 0; return L.status(S,h).canClaim?1:0; },
    claim:(S,h)=>{ const r=SYS().login.claim(S,h); return r&&r.ok?1:0; }},
  {id:'mail', icon:'mail', label:'Correio com prêmio', tab:'mail', kind:'claim',
    peek:(S,h)=>{ const M=SYS().mail; if(!M||!M.DATA||M.DATA.enabled!==true||!fn(M,'inbox')) return 0; return M.inbox(S,h).filter(m=>m.hasAtt&&!m.claimed).length; },
    claim:(S,h)=>{ const r=SYS().mail.claimAll(S,h); return int0(r&&r.n); }},
  {id:'missions', icon:'missions', label:'Missões prontas', tab:'missions', kind:'claim',
    peek:(S,h)=>{ const P=SYS().pass; if(!fn(P,'list')) return 0; const L=P.list(S,h); let k=[].concat(L.daily||[],L.weekly||[]).filter(m=>m.done&&!m.claimed).length;
      if(L.bonus&&L.bonus.ready&&!L.bonus.claimed) k++; return k; },
    claim:(S,h)=>{ const P=SYS().pass; let k=0; const L=P.list(S,h);
      for(const m of [].concat(L.daily||[],L.weekly||[])) if(m.done&&!m.claimed){ const r=safe(()=>P.claimMission(S,h,m.id),null); if(r&&r.ok) k++; }
      const B=P.list(S,h).bonus; if(B&&B.ready&&!B.claimed){ const r=safe(()=>P.claimMission(S,h,'bonus'),null); if(r&&r.ok) k++; } return k; }},
  {id:'passFree', icon:'pass', label:'Passe: níveis grátis', tab:'pass', kind:'claim',   // só a trilha GRÁTIS
    peek:(S,h)=>{ const P=SYS().pass; if(!fn(P,'ensure')||!fn(P,'tier')||!fn(P,'reward')||!fn(P,'claimTier')) return 0; const o=P.ensure(S), t=P.tier(S); let k=0;
      for(let i=1;i<=t;i++) if(!(o.free||[]).includes(i)&&P.reward('free',i)) k++; return k; },
    claim:(S,h)=>{ const P=SYS().pass; const o=P.ensure(S), t=P.tier(S); let k=0;
      for(let i=1;i<=t;i++) if(!(o.free||[]).includes(i)&&P.reward('free',i)){ const r=safe(()=>P.claimTier(S,h,'free',i),null); if(r&&r.ok) k++; } return k; }},
  {id:'activity', icon:'activity', label:'Baús da atividade', tab:'missions', kind:'claim',   // depois das missões: os pontos saem delas
    peek:(S,h)=>{ const A=SYS().activity; if(!fn(A,'status')) return 0; const s=A.status(S,h); return s&&s.on?int0(s.ready):0; },
    claim:(S,h)=>{ const r=SYS().activity.claimAll(S,h); return Array.isArray(r)?r.filter(x=>x&&x.ok).length:0; }},
  {id:'achievements', icon:'trophy', label:'Conquistas', tab:'achievements', kind:'claim',
    peek:(S,h)=>{ const A=SYS().achievements; if(!fn(A,'status')) return 0; const s=A.status(S,h); return s&&s.on?int0(s.ready):0; },
    claim:(S,h)=>{ const r=SYS().achievements.claimAll(S,h); return Array.isArray(r)?r.filter(x=>x&&x.ok).length:0; }},
  {id:'codex', icon:'codex', label:'Coleção: marcos', tab:'codex', kind:'claim',
    peek:(S,h)=>{ const C=SYS().codex; if(!fn(C,'rewards')) return 0; const r=C.rewards(S,h); return r&&r.on?(r.marks||[]).filter(m=>m.ready).length:0; },
    claim:(S,h)=>{ const C=SYS().codex; let k=0; for(const m of C.rewards(S,h).marks||[]) if(m.ready){ const r=safe(()=>C.claim(S,h,m.p),null); if(r&&r.ok) k++; } return k; }},
  {id:'camp', icon:'camp', label:'Acampamento', tab:'camp', kind:'claim',
    peek:(S,h)=>{ const C=SYS().camp; if(!C||!C.DATA||C.DATA.on!==true||!fn(C,'view')) return 0; const v=C.view(S,h); if(!v||v.locked) return 0;
      return (v.tents||[]).filter(t=>int0(t.stored)>0).length; },
    claim:(S,h)=>{ const r=SYS().camp.collect(S,h); return r&&r.ok?1:0; }},
  {id:'mapChest', icon:'chest', label:'Baús do mapa', tab:'map', kind:'claim',
    peek:(S,h)=>{ const M=SYS().mapChest; if(!fn(M,'readyCount')) return 0; return int0(M.readyCount(S,h)); },
    claim:(S,h)=>{ const M=SYS().mapChest; let k=0; const E=int0(M.DATA&&M.DATA.eras)||9;
      for(let e=0;e<E;e++) for(const c of safe(()=>M.list(S,h,e),[])) if(c.state==='ready'){ const r=safe(()=>M.claim(S,h,{era:e,slot:c.slot}),null); if(r&&r.ok) k++; } return k; }},
  {id:'duo', icon:'duo', label:'Dupla: prêmios', tab:'duo', kind:'claim',
    peek:(S,h)=>{ const D=SYS().duo; if(!fn(D,'view')) return 0; const v=D.view(S,h); if(!v||!v.on||!v.open||!v.partner||v.online) return 0;   // online: a tela usa o Sys.duoNet (Promise)
      return [].concat(v.daily||[],v.weekly||[]).filter(m=>m&&m.done&&!m.claimed).length; },
    claim:(S,h)=>{ const D=SYS().duo, v=D.view(S,h); let k=0; const ids=[]; if(v.daily&&v.daily.done&&!v.daily.claimed) ids.push('daily');
      for(const m of v.weekly||[]) if(m.done&&!m.claimed) ids.push(m.id); for(const id of ids){ const r=safe(()=>D.claim(S,h,id),null); if(r&&r.ok) k++; } return k; }},
  {id:'chest', icon:'chest', label:'Baús de abate', tab:'chest', kind:'claim',   // por último: enche a mochila
    peek:(S,h)=>{ const C=SYS().chest; if(!fn(C,'progress')) return 0; return int0(C.progress(S,h).stored); },
    claim:(S,h)=>{ const C=SYS().chest; let k=0; while(k<DATA.chestMax&&!bagFull(h)){ const r=safe(()=>C.open(S,h),null); if(!r) break; k++; } return k; },
    block:h=>bagFull(h)?'bag':''},
  /* só aviso (gastam entrada/picareta/Brasa ou começam luta) */
  {id:'instances', icon:'instances', label:'Instâncias: chaves', tab:'instances', kind:'go',
    peek:(S,h)=>{ const I=SYS().instances; if(!fn(I,'status')) return 0; return int0(I.status(S,h).total); }},
  {id:'thief', icon:'thief', label:'Ladrão de Brasas', tab:'thief', kind:'go',
    peek:(S,h)=>{ const T=SYS().thief; if(!fn(T,'view')) return 0; const v=T.view(S,h); return v&&v.on?int0(v.left):0; }},
  {id:'dig', icon:'dig', label:'Escavação: picaretas', tab:'dig', kind:'go',
    peek:(S,h)=>{ const D=SYS().dig; if(!fn(D,'picks')||!fn(D,'on')||!D.on()) return 0; const p=int0(D.picks(S,h)); return p>=DATA.digFullAt?p:0; }},
  {id:'bonfire', icon:'fire', label:'Fogueira: Brasas guardadas', tab:'bonfire', kind:'go',
    peek:(S,h)=>{ const B=SYS().bonfire; if(!fn(B,'view')) return 0; const v=B.view(S,h); return v&&v.on?int0(v.bra):0; }},
  {id:'relics', icon:'relic', label:'Relíquias para subir', tab:'relics', kind:'go',
    peek:(S,h)=>{ const R=SYS().relics; if(!fn(R,'view')||!fn(R,'on')||!R.on()) return 0; return (R.view(S,h).slots||[]).filter(x=>x.canLevel||x.canUnlock).length; }},
];

/* lista para a tela: [{id, icon, label, count, kind:'claim'|'go', tab, blocked:''|'bag'}] (só o que tem algo agora). Desligado: []. */
function list(S,host){ if(!on()||!S) return []; const out=[];
  for(const s of SOURCES){ const c=int0(safe(()=>s.peek(S,host),0)); if(c<=0) continue;
    out.push({id:s.id,icon:s.icon,label:s.label,count:c,kind:s.kind,tab:s.tab,blocked:s.block?s.block(host):''}); }
  return out; }
/* número do selo no botão "Hoje" */
const badge=(S,host)=>list(S,host).length;
/* quantas linhas o "Pegar tudo" resgata agora (para acender o botão) */
const claimable=(S,host)=>list(S,host).filter(x=>x.kind==='claim'&&!x.blocked).length;
/* PEGAR TUDO: roda o resgate de cada linha 'claim', na ordem da lista. {ok, reason:'off'|'empty', n (resgates), by:{id:n}, left:[linhas 'go' e as bloqueadas]} */
function claimAll(S,host){ if(!on()) return {ok:false,reason:'off',n:0,by:{},left:[]}; const by={}; let n=0;
  for(const s of SOURCES){ if(s.kind!=='claim') continue; if(s.block&&s.block(host)) continue; const c=int0(safe(()=>s.peek(S,host),0)); if(c<=0) continue;
    const k=int0(safe(()=>s.claim(S,host),0)); if(k>0){ by[s.id]=k; n+=k; } }
  if(n>0&&host&&typeof host.onChange==='function') host.onChange();
  return {ok:n>0,reason:n>0?'':'empty',n,by,left:list(S,host).filter(x=>x.kind!=='claim'||x.blocked)}; }
/* modelo da tela: {on, items (list), claimable, badge} */
function view(S,host){ const L=list(S,host); return {on:on(),items:L,claimable:L.filter(x=>x.kind==='claim'&&!x.blocked).length,badge:L.length}; }
const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});

const API={DATA,on,setOn,SOURCES,list,badge,claimable,claimAll,view,bonus};
root.Sys=root.Sys||{}; root.Sys.today=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
