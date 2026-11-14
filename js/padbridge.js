/* ============================================================
   PONTE DOS PACOTES DE ARTE DA PLAY (Play Asset Delivery) · só na versão de LOJA (AAB)
   Contrato: fps-android/CONTRATO_PACOTES.md (plugin nativo window.Capacitor.Plugins.EonPacks). Plano: docs/PLANO_ASSET_PACKS.md.

   ONDE NÃO FAZ NADA (sai sem tocar em coisa alguma): navegador, PWA, app de desenvolvimento e APK completo de teste. Neles o plugin EonPacks
   não existe (ou responde active:false) e o Sys.assets continua desligado: o jogo carrega tudo de dentro do app, como hoje.

   O QUE FAZ na versão de loja (plugin presente e info().active === true):
     1. liga o Sys.assets (DATA.on = true) e diz a ele o que já está no aparelho: Sys.assets.setInstalled(info.installedIds).
        Os endereços NÃO mudam (o app intercepta https://localhost/assets/... e entrega o arquivo do pacote): por isso é setInstalled, não setPackPath;
     2. pede em segundo plano, SEM segurar o jogador (EonPacks.fetch, que responde na hora), o que falta de:
          - Sys.assets.DATA.fastFollow()  (a Play baixa sozinha depois de instalar, mas pode não ter terminado; inclui 'ui:late', 'ui:frames', 'fx:bonfire');
          - Sys.assets.plan(S, Sys.host, instalados).fetch  (era atual e a próxima, pistola, montaria e pet equipados);
        e confere de novo a cada 10 s (o jogador trocou de era, equipou outra montaria), quando a rede volta e quando o app volta ao primeiro plano;
     3. ouve o evento 'packProgress'; quando um pacote chega: setInstalled de novo, LatePack.tick() (as <img> do 'ui:late' que esperavam voltam),
        Preload.retry(arquivos do pacote) e artDropFailed() (a cena solta as folhas marcadas com falha e se refaz);
     4. pacote parado (sem rede, sem espaço, esperando Wi-Fi): espera crescente por pacote (15 s até 5 min); nunca trava o jogo.

   PARA AS TELAS (opcional): PadBridge.on(fn) recebe {type:'on'|'progress'|'installed'|'stopped', ...}; PadBridge.ensure({packs|files}) espera o
   pacote (contrato §4.2) e nunca rejeita; PadBridge.confirm() abre o diálogo da Play (waiting_wifi / needs_confirmation); PadBridge.state.groups
   tem o último estado de cada asset pack ({pack, state, percent, bytesDownloaded, totalBytes, error}).
   Depende de: Sys.assets (js/sys/assets.js, só pela API pública), e, se existirem, LatePack, Preload, artDropFailed e os globais S e Sys.host.
   ============================================================ */
(function(){
  'use strict';
  const W=window, ACTIVE={pending:1,downloading:1,transferring:1};
  const TICK_MS=10000, STALE_MS=60000, WAIT0=15000, WAIT_MAX=300000;
  const ST={on:false,mode:'',busy:false,next:0,fails:0,groups:{},skip:{},stopped:null,timer:null,handle:null};
  const LIS=[]; let bootP=null;
  const plugin=()=>{ try{ const c=W.Capacitor, p=c&&c.Plugins&&c.Plugins.EonPacks; return p&&typeof p.info==='function'&&typeof p.fetch==='function'?p:null; }catch(e){ return null; } };
  const SA=()=>{ try{ const a=W.Sys&&W.Sys.assets; return a&&a.DATA&&typeof a.setInstalled==='function'&&typeof a.installed==='function'?a:null; }catch(e){ return null; } };
  const now=()=>Date.now();
  function emit(type,d){ const ev=Object.assign({type},d||{}); for(const f of LIS.slice()){ try{ f(ev); }catch(e){ try{ console.error('PadBridge',e); }catch(x){} } } }
  function on(fn){ if(typeof fn!=='function') return ()=>{}; LIS.push(fn); return ()=>{ const i=LIS.indexOf(fn); if(i>=0) LIS.splice(i,1); }; }
  const halted=s=>s!=='installed'&&!ACTIVE[s];

  /* guarda o último estado de um asset pack; parado = espera crescente só para ele */
  function note(g){ if(!g||typeof g.pack!=='string') return null; const old=ST.groups[g.pack], o=Object.assign({},g,{at:now(),fails:0,next:0});
    if(halted(o.state)){ o.fails=((old&&old.fails)||0)+1; o.next=o.at+Math.min(WAIT_MAX,WAIT0*Math.pow(2,o.fails-1)); }
    ST.groups[g.pack]=o; return o; }
  /* ids que NÃO adianta pedir agora: baixando (com notícia recente) ou parados dentro da espera */
  function blocked(force){ const s=new Set(), t=now(); for(const k in ST.groups){ const g=ST.groups[k]; if(!g||!Array.isArray(g.ids)) continue;
      const hold=ACTIVE[g.state]?(t-g.at<STALE_MS):(halted(g.state)&&!force&&t<g.next); if(hold) for(const id of g.ids) s.add(id); } return s; }

  /* pacote(s) que acabaram de chegar */
  function arrived(ids){ const a=SA();
    try{ if(W.LatePack&&typeof W.LatePack.tick==='function') W.LatePack.tick(); }catch(e){}
    try{ const P=W.Preload; if(P&&typeof P.retry==='function'){ let files=[]; try{ if(a&&typeof a.filesOf==='function') for(const id of ids) files=files.concat(a.filesOf(id)); }catch(e){ files=[]; }
        const drop=()=>{ try{ if(typeof artDropFailed==='function') artDropFailed(); }catch(e){} }, r=files.length?P.retry(files):P.retry();   /* sem manifesto: tenta de novo tudo o que falhou */
        if(r&&typeof r.then==='function') r.then(drop,drop); else drop(); } }catch(e){}
    emit('installed',{ids:ids.slice()}); }
  function apply(ids){ const a=SA(); if(!a||!Array.isArray(ids)) return []; const had=new Set(a.installed()); a.setInstalled(ids);
    const got=a.installed().filter(x=>!had.has(x)); if(got.length) arrived(got); return got; }
  /* pergunta ao app o que está no aparelho agora e repassa ao Sys.assets */
  function refresh(){ const ep=plugin(); if(!ST.on||!ep) return Promise.resolve(null);
    return Promise.resolve().then(()=>ep.info()).then(i=>{ if(i&&Array.isArray(i.installedIds)) apply(i.installedIds); return i||null; },()=>null); }

  /* o que falta: fast-follow + o que o jogador precisa agora, menos o que já está no aparelho, o que não vai no app da loja e o que o app não conhece */
  function wanted(){ const a=SA(); if(!a) return []; const out=new Set();
    try{ for(const id of a.DATA.fastFollow()) out.add(id); }catch(e){}
    try{ const s=typeof S!=='undefined'?S:null, h=W.Sys&&W.Sys.host; if(s&&typeof a.plan==='function'){ const p=a.plan(s,h,a.installed()); if(p&&p.on&&Array.isArray(p.fetch)) for(const id of p.fetch) out.add(id); } }catch(e){}
    let have; try{ have=new Set(a.installed()); }catch(e){ have=new Set(); }
    const none=id=>{ try{ return typeof a.deliveryOf==='function'&&a.deliveryOf(id)==='none'; }catch(e){ return false; } };
    return [...out].filter(id=>typeof id==='string'&&id&&!have.has(id)&&!ST.skip[id]&&!none(id)).sort(); }

  function take(r){ if(!r||typeof r!=='object') return false; let bad=null;
    for(const id of [].concat(Array.isArray(r.unknown)?r.unknown:[],Array.isArray(r.absent)?r.absent:[])) if(typeof id==='string') ST.skip[id]=1;   /* id que o app não tem: não insiste */
    const gs=r.groups||{}; for(const k in gs){ const g=note(gs[k]); if(g&&halted(g.state)) bad=bad||g; }
    ST.stopped=bad; if(bad) emit('stopped',{group:bad}); return true; }
  /* pede o que falta e não está em andamento. force = ignora a espera dos pacotes parados (rede voltou, app voltou, "tentar de novo") */
  function pump(force){ const ep=plugin(); if(!ST.on||!ep||ST.busy) return Promise.resolve(false);
    const hold=blocked(!!force), ask=wanted().filter(id=>!hold.has(id));
    if(!ask.length||(!force&&now()<ST.next)) return Promise.resolve(false);
    ST.busy=true;
    return Promise.resolve().then(()=>ep.fetch({packs:ask})).then(r=>{ if(!take(r)) throw new Error('sem resposta'); ST.fails=0; ST.next=0; return refresh(); })
      .then(()=>true,()=>{ ST.fails++; ST.next=now()+Math.min(WAIT_MAX,WAIT0*Math.pow(2,ST.fails-1)); return false; })   /* a chamada em si falhou: espera crescente geral */
      .then(v=>{ ST.busy=false; return v; }); }
  function onProgress(e){ const g=note(e); if(!g) return; emit('progress',{group:g});
    if(g.state==='installed') refresh(); else if(halted(g.state)){ ST.stopped=g; emit('stopped',{group:g}); } }

  /* para as telas: espera o pacote (contrato §4.2). Nunca rejeita; fora da loja responde ok na hora */
  function ensure(req){ const ep=plugin(); if(!ST.on||!ep||typeof ep.ensure!=='function') return Promise.resolve({ok:true,off:true});
    return Promise.resolve().then(()=>ep.ensure(req||{})).then(r=>{ take(r); return refresh().then(()=>r||{ok:false}); },e=>({ok:false,error:String(e&&e.message||e)})); }
  function confirm(){ const ep=plugin(); if(!ST.on||!ep||typeof ep.confirm!=='function') return Promise.resolve({accepted:false});
    return Promise.resolve().then(()=>ep.confirm()).then(r=>r||{accepted:false},()=>({accepted:false})).then(r=>pump(true).then(()=>r)); }

  function boot(){ if(bootP) return bootP; const ep=plugin(), a=SA(); if(!ep||!a) return bootP=Promise.resolve(false);
    return bootP=Promise.resolve().then(()=>ep.info()).then(i=>{ if(!i||i.active!==true) return false;   /* APK completo (modo universal): nada a fazer */
      ST.mode=String(i.mode||''); ST.on=true; a.DATA.on=true; a.setInstalled(Array.isArray(i.installedIds)?i.installedIds:[]);
      try{ if(typeof ep.addListener==='function'){ const h=ep.addListener('packProgress',onProgress); if(h&&typeof h.then==='function') h.then(x=>{ ST.handle=x; },()=>{}); else ST.handle=h||null; } }catch(e){}
      try{ W.addEventListener('online',()=>{ pump(true); }); }catch(e){}
      try{ document.addEventListener('visibilitychange',()=>{ if(!document.hidden) refresh().then(()=>pump(true)); }); }catch(e){}
      try{ if(typeof setInterval==='function') ST.timer=setInterval(()=>{ pump(false); },TICK_MS); }catch(e){}
      emit('on',{mode:ST.mode,installed:a.installed()});
      return pump(true).then(()=>true); },()=>false); }

  W.PadBridge={boot,on,ensure,confirm,refresh,pump,wanted,state:ST};
  boot();
})();
