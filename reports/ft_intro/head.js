'use strict';
/* ================= FLUXO DE ENTRADA (força-tarefa de telas; Servidor fps-6f) — nasce DESLIGADO (PANEL_ON.intro) =================
   Título (logo B Cristal) → Login (convidado / Google) → Prólogo com o avô → Criação (Kael/Kaia) → Nome do jogador → jogo.
   Quem volta: Título → Bem-vindo de volta → jogo. Save antigo (já tem nome) nunca vê prólogo nem criação.
   FONTE: os protótipos aprovados (docs/proto/TituloV2B, Login, Prologo, CriarJogador, NomeJogador, BemVindo .dc.html).
   As telas abaixo (PI_SCREENS) são GERADAS deles por reports/ft_intro/gen.js (arte trocada pela de assets/, faixas de protótipo
   removidas, CSS isolado em #pin). Não edite PI_SCREENS à mão: mude o gerador e rode `node reports/ft_intro/gen.js`.
   Este arquivo traz um interpretador mínimo do formato dos protótipos (sc-if, sc-for, {{valor}}, onClick/onInput, setState),
   então cada tela roda com a MESMA lógica e animação do protótipo; o que é do jogo (nome, nível, ganhos offline, login) entra pelo PI.
   Ligar para conferência: ?debug=1&painel=intro  (ou ?debug=1&painel=intro&pi=Prologo para abrir direto uma tela).
   Desligado: nada aqui roda; o jogo segue com o título e a intro de sempre (index.html / js/intro.js). */
(function(){
const ON=()=>typeof PANEL_ON!=='undefined'&&!!PANEL_ON.intro;
const PI_KAIA=false;   /* chave: true quando a arte da Kaia for aprovada; até lá ela aparece como no protótipo ("arte em produção") */
const piEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- jogo: leituras protegidas ---------- */
const G={
  S:()=>typeof S!=='undefined'?S:{},
  isNew:()=>{ const s=G.S(); return !s.name; },
  name:()=>G.S().name||'',
  level:()=>{ try{ if(window.Sys&&Sys.level&&Sys.level.level) return Sys.level.level(G.S()); }catch(e){} return G.S().lvl||1; },
  hero:()=>G.S().hero==='kaia'?'kaia':'kael',
  fc:()=>{ try{ const v=typeof heroFC==='function'?heroFC():0; return Math.round(v||0).toLocaleString('pt-BR'); }catch(e){ return '0'; } },
  version:()=>typeof VERSION!=='undefined'?VERSION:'',
  snd:n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} },
  music:k=>{ try{ if(typeof music==='function') music(k); }catch(e){} },
};

/* ---------- nome do jogador: regra no Sys.name (js/sys/name.js); reserva local se o módulo não estiver carregado ---------- */
function nameCheck(n,mode){
  try{ if(window.Sys&&Sys.name&&Sys.name.check){ const r=Sys.name.check(n,{minor:minor(),current:mode==='change'?G.name():null}); return r; } }catch(e){}
  /* Sys.name ainda carregando: não aprova nada (nunca "Nome disponível!" sem o filtro) */
  return {len:n.length>=3&&n.length<=14,chars:n.length>0&&/^[A-Za-z0-9_À-ÿ]+$/.test(n),clean:false,uniq:true,ok:false,msg:'Verificando o nome...'};
}
function minor(){ try{ if(window.Sys&&Sys.net&&Sys.net.player){ const p=Sys.net.player(); if(p&&p.ageBand) return p.ageBand!=='18+'; } }catch(e){} return true; }   /* sem saber a idade: regra de menor (a mais rígida) */

/* ---------- interpretador mínimo do formato dos protótipos ---------- */
class DCLogic{ constructor(p){ this.props=p||{}; this.state={}; } setState(p){ if(typeof p==='function') p=p(this.state); Object.assign(this.state,p||{}); if(this.__h) this.__h.dirty(); } }
/* som e música dos protótipos: as URLs viram 'snd:<nome>' / 'mus:<chave>' no gerador e tocam pelo áudio do jogo (respeita o mudo) */
class PIAudio{ constructor(u){ this.u=String(u||''); this.loop=false; this.volume=1; this.currentTime=0; }
  play(){ const u=this.u; if(u.startsWith('snd:')) G.snd(u.slice(4)); else if(u.startsWith('mus:')) G.music(u.slice(4)); return Promise.resolve(); }
  pause(){ if(this.u.startsWith('mus:')) G.music(null); } }
const val=(path,sc)=>{ const ps=path.split('.'); let v=sc; for(const p of ps){ if(v==null) return undefined; v=v[p]; } return v; };
const RX=/\{\{\s*([\w.$]+)\s*\}\}/g;
const interp=(s,sc)=>s.replace(RX,(m,p)=>{ const v=val(p,sc); return v==null||v===false?'':String(v); });
const single=s=>{ const m=/^\{\{\s*([\w.$]+)\s*\}\}$/.exec(s.trim()); return m?m[1]:null; };
function piBuild(node,sc,out){
  if(node.nodeType===3){ out.push(document.createTextNode(interp(node.nodeValue,sc))); return; }
  if(node.nodeType!==1) return;
  const tag=node.localName;
  if(tag==='sc-if'){ const p=single(node.getAttribute('value')||''); if(p&&val(p,sc)) for(const c of node.childNodes) piBuild(c,sc,out); return; }
  if(tag==='sc-for'){ const p=single(node.getAttribute('list')||''), as=node.getAttribute('as')||'item', L=p?val(p,sc):null;
    if(Array.isArray(L)) L.forEach((it,i)=>{ const s2=Object.create(sc); s2[as]=it; s2.$index=i; for(const c of node.childNodes) piBuild(c,s2,out); }); return; }
  const el=node.namespaceURI&&node.namespaceURI!=='http://www.w3.org/1999/xhtml'?document.createElementNS(node.namespaceURI,tag):document.createElement(tag);
  for(const a of node.attributes){ const n=a.name;
    if(/^on[a-z]+$/i.test(n)){ const p=single(a.value); const f=p?val(p,sc):null; if(typeof f==='function'){ (el.__on||(el.__on={}))[n.slice(2).toLowerCase()]=f; } continue; }
    const p=single(a.value); if(p){ const v=val(p,sc); if(v===false||v==null){ if(n==='disabled'||n==='checked'||n==='hidden') continue; el.setAttribute(n,v==null?'':String(v)); continue; } }
    el.setAttribute(n,interp(a.value,sc)); }
  el.__t=node;   /* de qual nó do modelo veio: mesmo nó = mesmo elemento (atualiza); outro nó = elemento novo (a animação de entrada roda) */
  const kids=[]; for(const c of node.childNodes) piBuild(c,sc,kids); for(const k of kids) el.appendChild(k);
  out.push(el);
}
/* troca só o que mudou (as animações em curso não reiniciam) */
function morphKids(par,news){
  let i=0;
  for(;i<news.length;i++){ const o=par.childNodes[i], n=news[i];
    if(!o){ par.appendChild(n); continue; }
    if(!same(o,n)){ const o2=o.nextSibling; if(o2&&same(o2,n)){ par.removeChild(o); i--; continue; }   /* um elemento saiu (sc-if): tira e segue */
      const later=[...par.childNodes].slice(i+1).find(x=>same(x,n)); if(!later){ par.insertBefore(n,o); continue; }   /* entrou um novo antes */
      par.removeChild(o); i--; continue; }   /* o antigo saiu; o par do novo está mais adiante */
    if(o.nodeType===3){ if(o.nodeValue!==n.nodeValue) o.nodeValue=n.nodeValue; continue; }
    patch(o,n); }
  while(par.childNodes.length>news.length) par.removeChild(par.lastChild);
}
function same(o,n){ return o.nodeType===n.nodeType&&(o.nodeType!==1||(o.localName===n.localName&&o.__t===n.__t)); }
function patch(o,n){
  const hero=o.localName==='canvas'&&o.hasAttribute('data-pi-hero');   /* canvas do herói: o tamanho e a folga são do pintor (heroTick), não do modelo */
  const keep=a=>o.localName==='canvas'&&(a==='width'||a==='height'||(hero&&(a==='style'||a==='data-pi-grown')));
  for(const a of [...o.attributes]) if(!n.hasAttribute(a.name)&&!keep(a.name)) o.removeAttribute(a.name);
  for(const a of n.attributes) if(o.getAttribute(a.name)!==a.value&&!(hero&&a.name==='style'&&o.hasAttribute('data-pi-grown'))) o.setAttribute(a.name,a.value);
  o.__on=n.__on;
  if(o.localName==='input'||o.localName==='textarea'){ const v=n.getAttribute('value')||''; if(o.value!==v) o.value=v; return; }
  morphKids(o,[...n.childNodes]);
}
const tplCache={};
function tplOf(id){ if(tplCache[id]) return tplCache[id]; const t=document.createElement('template'); t.innerHTML=PI_SCREENS[id].tpl; return tplCache[id]=t.content; }
const clsCache={};
function compOf(id){ if(clsCache[id]) return clsCache[id];
  /* o script do protótipo roda com o DCLogic e o áudio do jogo; PI = ponte para o jogo (nome, nível, ganhos, navegação) */
  const f=new Function('DCLogic','Audio','PI',PI_SCREENS[id].js+'\n;return Component;');
  return clsCache[id]=f(DCLogic,PIAudio,PI); }

/* ---------- a sobreposição ---------- */
const PI={el:null,root:null,cur:null,id:'',done:null,raf:0,g:G,nameCheck,KAIA_ON:PI_KAIA,
  dirty(){ if(this.raf) return; this.raf=requestAnimationFrame(()=>{ this.raf=0; this.draw(); }); },
  heroT:0, heroRaf:0, heroLast:0,
  heroTick(ts){ this.heroRaf=0; if(!this.root) return; const cs=this.root.querySelectorAll('canvas[data-pi-hero]'); if(!cs.length){ this.heroLast=0; return; }
    const dt=this.heroLast?Math.min(0.05,(ts-this.heroLast)/1000):0; this.heroLast=ts; this.heroT+=dt;
    for(const c of cs){ try{
      /* FOLGA (QA P20): o quadro do protótipo (F×F, pés em 95%) só cabe o herói a pé. Montado, com asa e aura, o conjunto é bem maior: o canvas cresce em volta
         do quadro (×2,4 de largura, ×1,9 de altura, 0,9F de folga em cima), com os pés no MESMO lugar da tela. Transparente, sem borda nem fundo. */
      if(!c.dataset.piGrown){ const F=c.offsetHeight||c.offsetWidth, P=c.offsetParent; if(!F||!P) continue;
        /* posição REAL na tela (inclui transform do CSS, ex.: translateX(-50%)), convertida para o palco sem escala */
        const r0=c.getBoundingClientRect(), pr=P.getBoundingClientRect(), sc=r0.height/F||1, L=(r0.left-pr.left)/sc-P.clientLeft, T=(r0.top-pr.top)/sc-P.clientTop;
        c.style.cssText+=';position:absolute;transform:none;left:'+(L-0.7*F)+'px;top:'+(T-0.9*F)+'px;right:auto;bottom:auto;margin:0;width:'+(2.4*F)+'px;height:'+(1.9*F)+'px;background:none;border:0;outline:0;box-shadow:none;pointer-events:none';
        c.dataset.piGrown=String(F); }
      const r=c.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2), w=Math.round(r.width*dpr), h=Math.round(r.height*dpr); if(!w||!h) continue;
      if(c.width!==w||c.height!==h){ c.width=w; c.height=h; } const x=c.getContext('2d'); x.setTransform(1,0,0,1,0,0); x.clearRect(0,0,w,h);
      const z=+c.dataset.piZoom||1, Fp=h/1.9;   /* F em pixels do canvas */
      drawHeroFull(x,w/2,h*(1.85/1.9),Fp/(HS*z),{t:this.heroT,walking:c.dataset.piHero==='walk',pet:false,...(c.dataset.piMount==='0'?{mount:false}:{})}); }catch(e){} }
    this.heroRaf=requestAnimationFrame(t=>this.heroTick(t)); },
  draw(){ const c=this.cur; if(!c||!this.root) return; let v={}; try{ v=c.renderVals()||{}; }catch(e){ console.error('[intro] '+this.id,e); }
    const sc=Object.assign(Object.create(null),PI.extra(this.id),v); const out=[]; for(const n of tplOf(this.id).childNodes) piBuild(n,sc,out); morphKids(this.root,out); if(!this.heroRaf&&this.root.querySelector('canvas[data-pi-hero]')) this.heroRaf=requestAnimationFrame(t=>this.heroTick(t)); },
  extra(){ const av=typeof window.avatarTag==='function', full=!G.isNew()&&typeof drawHeroFull==='function'&&typeof HS==='number'; return {hasAv:av,noAv:!av,fullHero:full,kidHero:!full,pName:piEsc(G.name()||'Viajante'),pLvl:G.level(),ver:piEsc(G.version()),isNew:G.isNew(),isOld:!G.isNew(),kaiaReady:PI_KAIA,kaiaSoon:!PI_KAIA,googleSoon:!PI.googleReady(),pFc:G.fc()}; },
  fit(){ if(!this.el) return; const app=document.getElementById('app')||document.body, W=app.clientWidth||390, H=app.clientHeight||844, d=PI_SCREENS[this.id]||{};
    const s=d.fluid?W/390:Math.min(W/390,H/844), h=d.fluid?H/s:844;
    this.root.style.cssText=`position:absolute;left:${(W-390*s)/2}px;top:${d.fluid?0:Math.max(0,(H-844*s)/2)}px;width:390px;height:${h}px;transform:scale(${s});transform-origin:0 0;overflow:hidden`; this.root.style.setProperty('--pi-vw','3.9px'); this.root.style.setProperty('--pi-vh',(h/100).toFixed(2)+'px'); this.el.dataset.fit=W+'x'+H+'@'+s.toFixed(3); },
  show(id,props){ if(!PI_SCREENS[id]) return false;
    if(this.cur&&this.cur.componentWillUnmount){ try{ this.cur.componentWillUnmount(); }catch(e){} }
    this.id=id; this.root.className='pi-'+id; this.root.innerHTML=''; this.fit();
    const C=compOf(id); const c=new C(props||{}); c.__h=this; this.cur=c;
    if(PI_SCREENS[id].init) try{ PI_SCREENS[id].init.call(c,PI); }catch(e){ console.error('[intro] init '+id,e); }
    this.draw(); if(c.componentDidMount){ try{ c.componentDidMount(); }catch(e){ console.error(e); } } return true; },
  /* navegação: os links do protótipo (href="X.dc.html") passam por aqui e a regra do fluxo decide a próxima tela */
  nav(target){ const nw=G.isNew(), id=this.id;
    if(id==='TituloV2B'){ this.show(nw?'Login':'BemVindo'); return; }                                   /* PO: o Bem-vindo aparece em toda volta (com o ganho offline quando houver) */                       /* JOGAR / Continuar como */
    if(id==='Login'){ this.show(target==='TituloV2B'?'TituloV2B':'Prologo'); return; }        /* convidado ou conta conectada → Prólogo */
    if(id==='Prologo'){ this.show('CriarJogador'); return; }                                   /* "Começar" do fim do Prólogo */
    if(id==='NomeJogador'){ if(target==='BatalhaTelaCheiaV2'){ const n=this.cur&&this.cur.state&&this.cur.state.nick; if(n) this.commitNew(n); this.finish(); } return; }   /* Continuar: grava herói + nome */
    if(id==='BemVindo'){ this.claimOffline(); this.finish(); return; } },
  open(done){ if(this.el) return; this.done=done||null;
    const el=document.createElement('div'); el.id='pin'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Entrada do jogo');
    el.style.cssText='position:absolute;inset:0;z-index:95;background:#0b0806;overflow:hidden';
    const r=document.createElement('div'); el.appendChild(r); this.el=el; this.root=r;
    if(!document.getElementById('pin_css')){ const st=document.createElement('style'); st.id='pin_css'; st.textContent=PI_CSS+Object.keys(PI_SCREENS).map(k=>PI_SCREENS[k].css).join('\n'); document.head.appendChild(st); }
    (document.getElementById('app')||document.body).appendChild(el);
    el.addEventListener('click',ev=>this.onEv(ev,'click')); el.addEventListener('input',ev=>this.onEv(ev,'input'));
    addEventListener('resize',this._rs=()=>this.fit());
    let first='TituloV2B'; try{ if(typeof DEBUG!=='undefined'&&DEBUG){ const m=/[?&]pi=(\w+)/.exec(location.search); if(m&&PI_SCREENS[m[1]]) first=m[1]; } }catch(e){}
    this.show(first); },
  onEv(ev,type){ let t=ev.target; const r=this.el;
    while(t&&t!==r){ if(t.__on&&t.__on[type]){ try{ t.__on[type](ev); }catch(e){ console.error('[intro]',e); } break; } t=t.parentNode; }
    if(type!=='click') return;
    const a=ev.target.closest&&ev.target.closest('a[href]'); if(a&&r.contains(a)){ ev.preventDefault(); const m=/([A-Za-z0-9]+)\.dc\.html/.exec(a.getAttribute('href')||''); if(m) setTimeout(()=>this.nav(m[1]),0); } },
  toast(msg){ if(!this.el) return; const t=document.createElement('div'); t.className='pi-toast'; t.textContent=msg; this.el.appendChild(t); setTimeout(()=>t.remove(),2200); },
  /* fim do fluxo: grava o que foi escolhido e devolve o controle ao jogo */
  finish(){ const el=this.el; if(!el) return; if(this.cur&&this.cur.componentWillUnmount){ try{ this.cur.componentWillUnmount(); }catch(e){} }
    this.cur=null; this.el=null; removeEventListener('resize',this._rs); el.style.transition='opacity .35s'; el.style.opacity='0';
    const d=this.done; this.done=null; setTimeout(()=>{ el.remove(); if(d) d(); },360); },
  /* TEMPO FORA (Bem-vindo de volta): mesmas contas do modal antigo (js/meta.js showOffline) + Sys.loot.offline (itens) + Sys.level (XP).
     Calcula UMA vez (os itens sorteados são os mesmos que serão entregues); null = nada a receber (o Bem-vindo não aparece). */
  off:null,
  offline(){ if(this.off!==null) return this.off; this.off=false;
    try{ const s=G.S(), away=typeof AWAY!=='undefined'?AWAY:0;
      if(window.__noSave||s.tut<99||away<120||typeof BAL==='undefined') return false;
      const cap=BAL.offlineCapHours*3600, t=Math.min(away,cap), perKill=Math.ceil(BAL.goldBase*Math.pow(BAL.goldGrowth,s.stage-1));
      let om=1; try{ om=Math.max(1,Sys.vip.perks(s).offlineMult||1); }catch(e){}
      const gold=Math.floor(t/60*BAL.offlineKillsPerMin*perKill*BAL.offlineRate*om); if(gold<=0) return false;
      let o=null; try{ if(window.Sys&&Sys.loot&&Sys.host) o=Sys.loot.offline(s,Sys.host,t); }catch(e){}
      /* XP: roda o Sys.level.onOffline numa CÓPIA do save (nada muda no save até o Coletar) */
      let xp=0,lv0=G.level(),lv1=lv0,frac0=0,per=0; const extras=[];
      try{ if(Sys.level&&Sys.level.onOffline&&Sys.level.progress){ const c=JSON.parse(JSON.stringify(s)), quiet=Object.create(Sys.host); for(const k of ['addGold','addGems','addItem','toast','onChange','onLevel','levelUp','snd']) quiet[k]=()=>{};
        const p0=Sys.level.progress(s); frac0=p0&&p0.need?p0.xp/p0.need:0; per=p0&&p0.need?1/p0.need:0; const x0=Sys.level.ensure(c).xp; const r=Sys.level.onOffline(c,quiet,t); const p1=Sys.level.progress(c);
        xp=Math.max(0,Math.round((r&&r.gained)||0));
        /* a barra do protótipo anda em "níveis": xpFrom + xp·xpLv = níveis ganhos + fração final (resultado real do Sys.level na cópia) */
        const gain=(p1.lvl-p0.lvl)+(p1.need?p1.xp/p1.need:0)-frac0; per=xp>0?gain/xp:0; lv1=p1.lvl;
        /* o resto que o tempo fora gera, na MESMA cópia (os números são os que o Coletar entrega) */
        const X=Sys; let n=0;
        try{ if(o&&X.chest&&X.chest.onKills){ const r=X.chest.onKills(c,o.kills,quiet); n=r&&r.gained|0; if(n>0) extras.push({key:'chest',n,label:n>1?'baús de abate':'baú de abate',icon:'assets/ui/chest.png'}); } }catch(e){}
        try{ if(X.practice&&X.practice.onOffline){ n=X.practice.onOffline(c,quiet,t)|0; if(n>0) extras.push({key:'stones',n,label:'pedras de treino',icon:PI_ICON.stones}); } }catch(e){}
        try{ if(X.pet&&X.pet.onOffline){ n=X.pet.onOffline(c,quiet,t)|0; if(n>0) extras.push({key:'food',n,label:'ração de pet',icon:PI_ICON.food}); } }catch(e){}
        if(o){ for(const [k,lb,ic] of [['forge','pedras de forja',PI_ICON.forge],['food','ração de pet',PI_ICON.food],['gems','gemas','assets/ui/gem.png']]){ const v=o[k]|0; if(v>0){ const ex=extras.find(x=>x.key===k); if(ex) ex.n+=v; else extras.push({key:k,n:v,label:lb,icon:ic}); } }
          if(Array.isArray(o.eggs)&&o.eggs.length) extras.push({key:'eggs',n:o.eggs.length,label:o.eggs.length>1?'ovos':'ovo',icon:PI_ICON.egg}); }
      } }catch(e){}
      const hh=Math.floor(t/3600), mm=Math.floor(t%3600/60), items=(o&&o.items||[]);
      /* arte REAL do item: o ícone aprovado do espaço na era do visual (o mesmo da mochila) */
      const icon=it=>{ try{ if(typeof slotIcon==='function') return slotIcon(it.slot,it.look!=null?it.look:it.e); }catch(e){} return it.slot==='weapon'?'assets/icons/menu/equipment.png':'assets/icons/menu/forge.png'; };
      const label=it=>{ try{ const n=Sys.loot&&Sys.loot.itemName&&Sys.loot.itemName(it); if(n) return n; }catch(e){} return it.slot==='weapon'?'Arma':'Equipamento'; };
      this.off={sec:t,away:(hh?hh+'h ':'')+mm+'min',hrs:t/3600,capH:BAL.offlineCapHours,gold,xp,xpFrom:frac0,xpLv:per,lv:lv0,chests:0,
        items:items.slice(0,6).map(it=>[Math.max(0,Math.min(4,it.r|0)),icon(it),label(it)]),lvTo:lv1,extras,more:Math.max(0,items.length-6),ret:false,retGold:0,retXp:0,o,dropRate:(()=>{ try{ return Math.round(Sys.loot.DATA.offline.itemRate*100); }catch(e){ return 10; } })()};
    }catch(e){ console.error('[intro] offline',e); this.off=false; }
    return this.off; },
  /* Coletar: entrega como o modal antigo (idempotente) */
  claimed:false,
  claimOffline(){ const d=this.offline(); if(!d||this.claimed) return; this.claimed=true; const s=G.S();
    try{ s.gold+=d.gold;
      if(typeof SYS_ON!=='undefined'&&SYS_ON){ try{ if(d.o) Sys.loot.grant(s,Sys.host,d.o); if(d.o&&Sys.chest&&Sys.chest.onKills) Sys.chest.onKills(s,d.o.kills,Sys.host);
        const lr=Sys.level.onOffline(s,Sys.host,d.sec); if(lr&&lr.levels>0&&typeof onLevelUp==='function') onLevelUp(lr); if(Sys.practice&&Sys.practice.onOffline) Sys.practice.onOffline(s,Sys.host,d.sec); if(Sys.pet&&Sys.pet.onOffline) Sys.pet.onOffline(s,Sys.host,d.sec); }catch(e){ console.error('[intro] offline grant',e); } }
      if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){ console.error(e); } },
  /* escolhas do jogador novo (gravadas só no fim, no Nome; até lá nada muda no save) */
  pick:{hero:'',name:''},
  commitNew(name){ const s=G.S(); s.hero=this.pick.hero==='kaia'&&PI_KAIA?'kaia':'kael'; s.name=name; try{ if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){} },
  /* login: convidado = local (e, com o Sys.net ligado, sessão de convidado no servidor sem travar o jogo); Google: em breve */
  guest(){ const s=G.S(); s.acct='guest'; try{ if(window.Sys&&Sys.net&&Sys.net.DATA&&Sys.net.DATA.on) Sys.net.ensureSession().catch(()=>{}); }catch(e){} },
  googleReady(){ try{ return !!(window.Sys&&Sys.net&&Sys.net.googleReady&&Sys.net.googleReady()); }catch(e){ return false; } },
  /* convidado já com sessão = VINCULA a conta atual ao Google (não perde nada); sem sessão = entra na conta do Google (aparelho novo) */
  google(){ const N=Sys.net; return N.googleSignIn(N.hasSession&&N.hasSession()?'link':'login').then(p=>{ G.S().acct='google'; try{ if(typeof save==='function') save(); }catch(e){} return p; }); },
};
window.PIntro=PI;
const piSvg=(b)=>'data:image/svg+xml;utf8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'+b+'</svg>');
const PI_ICON={
  stones:piSvg('<path d="M10 44 L20 22 L40 16 L54 30 L50 48 L28 54 Z" fill="#8fb6d9" stroke="#2a4360" stroke-width="3"/><path d="M20 22 L30 36 L54 30 M30 36 L28 54" fill="none" stroke="#2a4360" stroke-width="2"/>'),
  forge:piSvg('<path d="M12 46 L22 20 L44 14 L54 34 L46 50 L24 54 Z" fill="#ff9a3a" stroke="#6a2a08" stroke-width="3"/><path d="M22 20 L32 34 L54 34" fill="none" stroke="#6a2a08" stroke-width="2"/>'),
  food:piSvg('<path d="M14 36 C14 22 28 14 40 16 C52 18 56 30 50 40 C44 50 26 54 18 46 Z" fill="#c9783a" stroke="#5a2e10" stroke-width="3"/><path d="M44 18 L54 8 M50 22 L58 14" stroke="#f1e2c8" stroke-width="5" stroke-linecap="round"/>'),
  egg:piSvg('<path d="M32 6 C46 6 54 26 54 38 C54 52 44 58 32 58 C20 58 10 52 10 38 C10 26 18 6 32 6 Z" fill="#f4e6c8" stroke="#6a5a3a" stroke-width="3"/><path d="M18 34 L26 28 L32 34 L40 28 L48 34" fill="none" stroke="#c9a86a" stroke-width="3"/>'),
};
const PI_CSS=`#pin .pi-TituloV2B .logoWrap .clockBox{z-index:1}
#pin .pi-TituloV2B .logoWrap .word{z-index:3}   /* o nome EONBOUND sempre por cima do relógio e dos anéis (QA) */
#pin .pi-lvfrom{font:900 13px Nunito,system-ui,sans-serif;color:#c9b9a2;margin-right:4px;white-space:nowrap}
#pin .pi-BemVindo .num{white-space:nowrap}
#pin .pi-extras{display:flex;flex-wrap:wrap;gap:6px;padding:8px}
#pin .pi-ex{display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;border-radius:12px;background:rgba(14,10,7,.55);border:1px solid #4a3a2b}
#pin .pi-ex img{width:28px;height:28px;object-fit:contain}
#pin .pi-ex b{display:block;font:400 17px 'Lilita One',sans-serif;color:#fff;line-height:1}
#pin .pi-ex small{display:block;font:800 11px Nunito,system-ui,sans-serif;color:#c9b9a2}
#pin .pi-toast{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);z-index:99;padding:10px 18px;border-radius:14px;background:rgba(14,10,7,.95);border:2px solid #ffc94a;color:#f6ecdf;font:900 14px Nunito,system-ui,sans-serif;white-space:nowrap;animation:pi_t .25s ease-out both}
#pin .pi-logoB{display:flex;flex-direction:column;align-items:center;gap:8px;animation:pi_float 3.6s ease-in-out infinite}
#pin .pi-logoB span{font-family:'Lilita One',sans-serif;font-size:56px;line-height:1;letter-spacing:1px;color:transparent;background-image:linear-gradient(180deg,#ffffff 0%,#d2f8ff 30%,#4ad8ff 52%,#1a5fd0 68%,#7fe8ff 86%,#e8fdff 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-stroke:1.5px #08224d;filter:drop-shadow(0 0 6px rgba(74,216,255,.9)) drop-shadow(0 0 18px rgba(60,140,255,.7)) drop-shadow(0 4px 8px rgba(0,0,0,.7))}
#pin .pi-logoB i{font-style:normal;color:#bff4ff;font-weight:900;font-size:12px;letter-spacing:5px;text-shadow:0 0 8px rgba(74,216,255,.9)}
@keyframes pi_float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
#pin .pi-soon{margin-left:8px;padding:2px 8px;border-radius:8px;background:#1f1f1f;color:#ffe07a;font:900 11px Nunito,system-ui,sans-serif;letter-spacing:.3px}
#pin .pi-kaia{background-image:url(assets/anim/hyb/kaia/kaia_idle_era2_t1.png);background-size:2100% 100%;background-repeat:no-repeat;animation:pi_sheet 1.75s steps(21,jump-none) infinite}
@keyframes pi_sheet{from{background-position:0 0}to{background-position:100% 0}}
#pin .pi-nogain{flex:none;padding:14px 12px;border-radius:14px;background:rgba(42,32,21,.85);border:1px solid #4a3a2b;color:#f6ecdf;font:800 14px/1.4 Nunito,system-ui,sans-serif;text-align:center}
@keyframes pi_t{from{opacity:0;transform:translate(-50%,8px)}to{opacity:1;transform:translate(-50%,0)}}`;

/* ---------- ligação com o jogo (só com a chave ligada) ----------
   O título antigo (#title) e a intro antiga ficam escondidos; JOGAR do fluxo novo faz o mesmo que o "Jogar" antigo (onPlay),
   mas a criação do jogador novo e o Bem-vindo são do fluxo novo. Sem pedido de mudança em index.html: tudo por fora. */
/* espera a tela de carregamento (js/loading.js) sair: a entrada vem DEPOIS do "Toque para continuar", no lugar do título antigo */
function loadingUp(){ const l=document.getElementById('loading'); if(!l) return false; const c=getComputedStyle(l); return c.display!=='none'&&c.visibility!=='hidden'&&+c.opacity>0.05; }
function needName(){ if(window.Sys&&Sys.name) return; if(document.getElementById('pin_name')) return; const sc=document.createElement('script'); sc.id='pin_name'; sc.src='js/sys/name.js'; document.head.appendChild(sc); }
function boot(){ if(!ON()) return; needName(); const t0=document.getElementById('title'); if(t0) t0.style.display='none';
  if(loadingUp()){ setTimeout(boot,200); return; }
  const t=document.getElementById('title'); if(t) t.style.display='none';
  if(typeof B!=='undefined') B.paused=true;
  PI.open(()=>{ if(typeof B!=='undefined') B.paused=false;
    try{ if(typeof unlockAudio==='function') unlockAudio(); }catch(e){}
    try{ if(typeof music==='function'&&typeof eraOf==='function') music('era'+eraOf(G.S().stage)); }catch(e){}
    window.__offDone=true;   /* o Bem-vindo já entregou o tempo fora: o modal antigo não aparece de novo */
    try{ const s=G.S(); if(!s.welcome&&typeof showWelcome==='function') showWelcome(); else if(s.tut<99&&typeof startTut==='function') startTut(); }catch(e){} });
}
if(typeof Panels!=='undefined') Panels.add('intro',{title:'Entrada',overlay:true,open:d=>PI.open(d),close:()=>PI.finish()});
if(document.readyState==='complete') setTimeout(boot,0); else addEventListener('load',()=>setTimeout(boot,0));
