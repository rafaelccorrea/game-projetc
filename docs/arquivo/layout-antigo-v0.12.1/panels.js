'use strict';
/* ================= REGISTRO DAS TELAS NOVAS (item 3; agente B) =================
   Cada tela nova mora num arquivo próprio (js/p_<nome>.js) e se registra aqui: Panels.add('forge', {title, render, click, tick, busy, onOpen, onClose}).
   TODAS NASCEM DESLIGADAS (PANEL_ON.<nome> = false): desligada, a tela não entra em lugar nenhum do jogo e este arquivo não envolve nada.
   Ligar para conferência, sem mexer em código: ?debug=1&painel=forge,vip  (ou window.PANEL_ON = {forge:true} antes dos scripts).
   Com a tela ligada:
   - se o index.html já tiver o registro oficial (Screens.register, pedido B-3 ao agente A), a tela é entregue a ele;
   - senão, este arquivo estende por fora: FULLV/FULL_VIEWS (tela cheia), FB_TITLES (título da folha) e envolve render() e setView() do index.html,
     que continuam sendo chamados para tudo o que não for tela nova. Abrir: Screens.open('<nome>') ou Panels.open('<nome>'); fechar: Screens.close().
   render()  desenha em V (use xFit/xDims + xWrap do screens.js, base de 390 px)
   click(b,ev) recebe o elemento [data-x] tocado · tick() 4x por segundo (relógios) · busy() true = não redesenhar por fora (animação em curso)
   onOpen(opções) / onClose() ao entrar e sair da tela. */
const PANEL_ON=window.PANEL_ON=Object.assign({forge:false,vip:false,era:false,rank:false,inst:false,tower:false,result:false,cfg:false,profile:false,pets:false},window.PANEL_ON||{});
(function(){ try{ if(typeof DEBUG!=='undefined'&&DEBUG){ const m=/[?&]painel=([\w,]+)/.exec(location.search); if(m) m[1].split(',').forEach(k=>{ PANEL_ON[k]=true; }); } }catch(e){} })();
const Panels=window.Panels={ defs:{}, hooked:false, opts:null,
  add(name,def){ def.name=name; this.defs[name]=def; if(PANEL_ON[name]) this.enable(name); return def; },
  on(name){ return !!PANEL_ON[name]&&!!this.defs[name]; },
  /* liga uma tela já registrada (também serve no console: Panels.enable('forge'); Screens.open('forge')) */
  enable(name){ const d=this.defs[name]; if(!d) return false; PANEL_ON[name]=true; if(d.overlay) return true;   /* overlay (10, 11): não é "view", abre por função própria */
    if(window.Screens&&typeof Screens.register==='function'){ try{ Screens.register(name,{title:d.title,render:d.render,onOpen:d.onOpen,onClose:d.onClose}); }catch(e){} }
    if(typeof FULLV!=='undefined') FULLV[name]=1; if(typeof FULL_VIEWS!=='undefined') FULL_VIEWS[name]=1;
    if(typeof FB_TITLES!=='undefined') FB_TITLES[name]=d.title||''; else this.lateTitle=true;
    this.hook(); return true; },
  hook(){ if(this.hooked) return; this.hooked=true; const P=this;
    if(typeof render==='function'&&!(window.Screens&&typeof Screens.register==='function')){ const r0=render; render=function(){ const d=P.defs[view]; if(d&&P.on(view)&&!d.overlay) return d.render(); return r0(); }; }
    if(typeof setView==='function'){ const s0=setView; setView=function(v){ const prev=P.defs[view], next=P.defs[v];
        if(P.lateTitle&&typeof FB_TITLES!=='undefined'){ for(const k in P.defs) if(P.on(k)&&!P.defs[k].overlay) FB_TITLES[k]=P.defs[k].title||''; P.lateTitle=false; }
        if(prev&&P.on(view)&&view!==v&&prev.onClose){ try{ prev.onClose(); }catch(e){} }
        if(next&&P.on(v)&&view!==v&&next.onOpen){ try{ next.onOpen(P.opts||{}); }catch(e){} } P.opts=null;
        return s0(v); }; } },
  open(name,o){ if(!this.on(name)) return false; const d=this.defs[name]; if(d.overlay) return d.open?d.open(o||{}):false; this.opts=o||{}; if(window.Screens) Screens.open(name,o||{}); else setView(name); return true; },
  cur(){ const d=this.defs[typeof view!=='undefined'?view:'']; return d&&this.on(d.name)&&!d.overlay?d:null; } };
