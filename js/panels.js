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
const PANEL_ON=window.PANEL_ON=Object.assign({forge:true,cfg:true,vip:true,pets:true,rank:true,   /* ligadas: vistas por mim no navegador */
  tower:true,era:true,missions:true,profile:true,codex:true,guild:true,chat:true, intro:true, look:true,   /* aba Aparência do Equipamento (js/p_look.js, do QA): desligada até a conferência */   /* conferida pelo QA (fluxo novo e de quem volta) */    /* telas iniciais do Servidor (js/p_intro.js, arquivo GERADO): desligada */   /* ligadas: conferidas pelo QA na aba dele ("pode ligar") */
  mail:true,   /* conferida pelo QA; carta local de boas-vindas (Sys.mail.welcomeOnce, o engenheiro liga o módulo no boot) */     /* espera Sys.mail.DATA.enabled (Servidor) */  inst:true,   /* luta da instância vista pelo engenheiro no navegador (vitória, derrota, tempo esgotado): pedido A-22 */
  mounts:true,   /* conferida pelo QA no navegador (equipar, nível, aura, batalha) */  result:false,   /* escritas por mim, ainda não vistas rodando */  eggpick:false,   /* liga sozinha junto com pets */
  offer:false,   /* só no Modo dono até existir compra real (PO) */  auction:true,   /* demonstração "Em breve: abre com o online" (PO); conferida pelo QA */    /* esperam pagamento / servidor */
  arena:true,events:true,tourney:true,   /* Sistemas: conferidas pelo QA no navegador ("pode ligar") */  map:false,passv2:false,guidehud:false,
  fuse:false   /* Fusão (js/p_fuse.js, de Sistemas): DESLIGADA; só liga junto com Sys.stats.DATA.quality.on (qualidade/fusão é da v0.13, sem voto ainda) */},window.PANEL_ON||{});
(function(){ try{ if(typeof DEBUG!=='undefined'&&DEBUG){ const m=/[?&]painel=([\w,]+)/.exec(location.search); if(m) m[1].split(',').forEach(k=>{ PANEL_ON[k]=true; }); } }catch(e){} })();
const Panels=window.Panels={ defs:{}, hooked:false, opts:null,
  add(name,def){ def.name=name; this.defs[name]=def; if(PANEL_ON[name]) this.enable(name); return def; },
  on(name){ return !!PANEL_ON[name]&&!!this.defs[name]; },
  /* liga uma tela já registrada (também serve no console: Panels.enable('forge'); Screens.open('forge')) */
  enable(name){ const d=this.defs[name]; if(!d) return false; PANEL_ON[name]=true; if(d.overlay) return true;   /* overlay (10, 11): não é "view", abre por função própria */
    if(window.Screens&&typeof Screens.register==='function'){ try{ Screens.register(name,{title:d.title,render:d.render,onOpen:d.onOpen,onClose:d.onClose}); }catch(e){} }
    if(typeof FULLV!=='undefined') FULLV[name]=1; if(typeof FULL_VIEWS!=='undefined') FULL_VIEWS[name]=1;
    if(typeof FB_TITLES!=='undefined') FB_TITLES[name]=d.title||''; else this.lateTitle=true;
    if(d.parent) this.hookClose();
    if(name==='cfg') this.hookCfg();
    if(name==='pets'&&this.defs.eggpick&&!PANEL_ON.eggpick) this.enable('eggpick');   /* a escolha de ovo (pedido A-15) liga junto com a tela de Pets */
    this.hook(); return true; },
  /* SUBTELA (decisão do PO: Forja é subtela do Equipamento): o Voltar leva à tela-mãe (def.parent), não à batalha. Contorno do pedido B-11:
     enquanto o Screens.close() do index não ler 'parent', ele é envolvido aqui, só quando uma subtela é ligada. */
  /* CONFIGURAÇÕES NOVAS (tela 09) no lugar do modal antigo: todo lugar do jogo que chama openSettings(false) passa a abrir o painel.
     openSettings(true) (confirmação de reset do modal antigo) continua indo para o original. Só envolve quando a tela 'cfg' é ligada. */
  hookCfg(){ if(this.cfgHooked||typeof openSettings!=='function') return; this.cfgHooked=true; const P=this, o0=openSettings;
    openSettings=function(confirmReset){ if(confirmReset||!P.on('cfg')) return o0(confirmReset); if(!P.open('cfg')) return o0(confirmReset); }; },
  hookClose(){ if(this.closeHooked||!window.Screens||typeof Screens.close!=='function') return; this.closeHooked=true; const P=this, c0=Screens.close.bind(Screens);
    Screens.close=function(){ const cur=P.cur(); const bt=cur&&P.back&&P.back[cur.name]; if(bt&&typeof setView==='function'){ P.back[cur.name]=null; if(typeof Screens.register==='function'&&cur.onClose){ try{ cur.onClose(); }catch(e){} } setView(bt); return; }
      if(cur&&cur.parent&&typeof setView==='function'){ if(typeof Screens.register==='function'&&cur.onClose){ try{ cur.onClose(); }catch(e){} } setView(cur.parent); return; } return c0(); }; },
  hook(){ if(this.hooked) return; this.hooked=true; const P=this;
    if(typeof render==='function'&&!(window.Screens&&typeof Screens.register==='function')){ const r0=render; render=function(){ const d=P.defs[view]; if(d&&P.on(view)&&!d.overlay) return d.render(); return r0(); }; }
    if(typeof setView==='function'&&!(window.Screens&&typeof Screens.register==='function')){ const s0=setView;   /* com o registro oficial, quem chama onOpen/onClose é o index */ setView=function(v){ const prev=P.defs[view], next=P.defs[v];
        if(P.lateTitle&&typeof FB_TITLES!=='undefined'){ for(const k in P.defs) if(P.on(k)&&!P.defs[k].overlay) FB_TITLES[k]=P.defs[k].title||''; P.lateTitle=false; }
        if(prev&&P.on(view)&&view!==v&&prev.onClose){ try{ prev.onClose(); }catch(e){} }
        if(next&&P.on(v)&&view!==v&&next.onOpen){ try{ next.onOpen(P.opts||{}); }catch(e){} } P.opts=null;
        return s0(v); }; } },
  /* ROTA ÚNICA: Panels.open(nome, o) e Screens.open(nome, o) abrem a MESMA tela. Panels.open só confere a chave (desligada = false, nada abre) e
     entrega ao Screens.open, que troca a tela (setView) e chama onOpen. Overlays (era, result) abrem pela função open da própria tela. */
  open(name,o){ if(!this.on(name)) return false; const d=this.defs[name]; if(d.overlay) return d.open?d.open(o||{}):false; this.opts=o||{};
    /* VOLTAR PARA ONDE VEIO: quem abre passando {from:'<tela>'} (ex.: o botão Missões do Passe) recebe o jogador de volta nessa tela ao fechar */
    this.back=this.back||{}; this.back[name]=(o&&typeof o.from==='string')?o.from:null; if(this.back[name]) this.hookClose();
    if(window.Screens&&typeof Screens.open==='function'){ if(typeof Screens.register==='function'&&!(Screens.reg&&Screens.reg[name])) this.enable(name); return Screens.open(name,o||{})!==false; }
    setView(name); return true; },
  cur(){ const d=this.defs[typeof view!=='undefined'?view:'']; return d&&this.on(d.name)&&!d.overlay?d:null; } };
