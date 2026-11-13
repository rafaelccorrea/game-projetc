'use strict';
/* ================= 24 EVENTOS — tela nova, nasce DESLIGADA (PANEL_ON.events) =================
   Protótipo aprovado: docs/proto/Eventos.dc.html (v2). NENHUMA regra nem número aqui: tudo vem de Sys.events (js/sys/events.js):
   eventos e datas: Sys.events.DATA.events + Sys.events.phase(ev, host) · eventos abertos e saldo: Sys.events.list(S, host) (pts, endsAt, phase)
   missões: Sys.events.missions(S, host, id) / claimMission(S, host, id, mid) · loja: Sys.events.shop(S, host, id) / buy(S, host, id, sid)
   carência da loja: Sys.events.DATA.graceDays · pontos repetíveis: DATA.events[].repeat. A entrega é do Sys.loot.grantBundle (portões e itens guardados valem).
   O cabeçalho (Voltar, título, moedas, gemas) é do jogo; aqui só o conteúdo, na ordem do protótipo:
   lista de eventos · banner animado com contagem · pontos + botão Missões · abas Trilha / Chefe / Loja · botão fixo · gaveta de missões · confirmação de compra.
   Arte real: assets/icons/menu/events.png, assets/map/world.jpg, assets/map/clock_*.png e clock_shards, Kael (assets/anim/hyb/R), auras (assets/anim/aura),
   chefe (assets/enemies/era6_boss.png), colar (assets/icons/slots), moeda (assets/ui/coin.png). Pedras, essência, ração e fragmento: os SVG do protótipo. Sem emoji.
   DIFERENÇAS CONSCIENTES em relação ao protótipo (para não mostrar dado falso):
   TRILHA e CHEFE: Sys.evtrail (js/sys/evtrail.js; chave Sys.evtrail.DATA.on). trail(S, host, id) / claimTrail(S, host, id, at) e boss(S, host, id) / attack(S, host, id).
     Com o evento aberto, a tela lê o módulo; em prévia (evento futuro ou Sys.events desligado) lê só Sys.evtrail.DATA.events (sem progresso, sem criar estado).
   - TRILHA: marcos e "ganhos" do Sys.evtrail (8 marcos no módulo; o protótipo tinha 9: as posições em serpente são geradas para quantos houver).
     O Kael anda pelo caminho até os pontos ganhos (para no meio do trecho, nunca em cima do marco). Cada marco alcançado é um botão de resgate,
     e a lista embaixo do mapa diz o prêmio em texto. O Relógio do Festival (9 pedaços) não tem regra no módulo: só aparece apagado no "Em breve";
     Sys.evtrail DESLIGADO: a aba mostra o mapa, o caminho e o Kael na largada com o aviso "Em breve" (sem marcos, sem números);
   - CHEFE: vida, ataques do dia, dano e pontos do Sys.evtrail. Sem servidor a vida é só do jogador (aviso pequeno). O botão fixo vira "Atacar".
     Sys.evtrail DESLIGADO: palco do chefe e "Em breve: abre com o online";
   - PONTOS: o saldo do Sys.events; com o Sys.evtrail ligado, a caixa também mostra "Ganhos (trilha)" como no protótipo;
   - a tela abre na aba TRILHA com o Sys.evtrail ligado (como o protótipo); desligado, abre na LOJA (a única com conteúdo real);
   - LOJA: vitrine = a primeira skin do Sys.events ainda não comprada (são duas skins); o resto em páginas de 3. Sem "LENDÁRIO" nem raridade inventada:
     raridade só aparece onde o módulo a tem (o colar, r do item; fragmento = Prismático); materiais dizem "Material", ouro diz "Ouro";
   - missões: as do Sys.events (uma vez cada, valem pelo evento todo). Na carência (fase 'loja') o Sys.events ainda deixa resgatar as completas: a tela segue o módulo;
   - Sys.events DESLIGADO (DATA.enabled=false) ou evento futuro: a tela mostra o evento como EM BREVE, em prévia (missões com 0, loja sem compra),
     e só mostra "Começa em" com o módulo ligado (desligado, a data não é promessa);
   - sem evento nenhum por abrir: estado vazio "Nenhum evento agora".
   PEDIDO ao engenheiro: incluir 'p_events' na lista de scripts de js/screens.js:823 (não editei) e, para conferir, ligar com ?debug=1&painel=events. */
const XEVT={ev:null,tab:2,mPage:0,sPage:0,mis:false,buy:null,sig:'',sec:'',hd:'',anim:true,
  mk:0,mkTo:0,mkEv:null,mkDir:1,mv:null,hit:null,hitT:null};   /* mk = posição do Kael na trilha (em trechos), hit = último ataque ao chefe */
const EVT_MINH=640, EVT_SPER=3, EVT_MPER=4;
/* cara de cada evento (só visual; regras e números são do Sys.events). Evento sem tema usa o do Festival. */
const EVT_TH={
  festival_eras:{bg:'linear-gradient(135deg,#5a2ea0 0%,#a8650c 60%,#3a1a04 100%)',bd:'#ffc94a',t1:'#3a2350',a:'#b07cff',tok:'#8a4dff',map:'assets/map/world.jpg',mapF:'saturate(1.1)',
    fog:'linear-gradient(180deg,rgba(58,35,80,.18),rgba(20,10,30,.4))',shards:true,vit:'rgba(176,124,255,.6)',
    boss:{n:'Devorador do Tempo',img:'assets/enemies/era6_boss.png',c:'#c58bff',hue:'0deg',mist:'rgba(176,124,255,.4)',fog:'linear-gradient(180deg,rgba(40,10,70,.5),rgba(10,4,20,.72))',mapF:'brightness(.5) saturate(1.3) hue-rotate(30deg)'}}};
const EVT_SKHUE={festival_weapon:'250deg',festival_armor:'200deg'};
const EVT_START=[7,81], EVT_NODES=[[27,81],[53,81],[82,81],[75,53],[48,53],[21,53],[26,25],[53,25],[82,25]];   /* caminho em serpente do protótipo (só desenho) */
const EVT_RN=['Básico','Raro','Épico','Mítico','Lendário','Prismático'];
const EVT_RC=['#9aa0a6','#4aa3ff','#b45cff','#ff4d6d','#ffb21e','#8ff5ff'];
const EVT_RG=['rgba(154,160,166,.35)','rgba(74,163,255,.6)','rgba(180,92,255,.7)','rgba(255,77,109,.6)','rgba(255,178,30,.75)','rgba(143,245,255,.75)'];
const EVT_K={kill:'inimigos derrotados',boss:'chefes derrotados',ult:'ultimates usadas',chest:'baús abertos',instance:'instâncias vencidas',forge:'forjas',summon:'invocações',upgrade:'fortalecimentos'};
/* ícones SVG do protótipo (viewBox 24) */
const EVT_ICS={
  stone:{p:['M6 9 L10 4 L17 5 L21 11 L18 19 L9 20 L3 14 Z','M10 4 L12 11 L21 11 M12 11 L9 20 M12 11 L3 14'],f1:'#4aa3ff',f2:'none',st:'#d8ecff',b:[16,8,.9]},
  food:{p:['M14 4 C19 4 21 9 19 13 C17 17 12 18 9 15 C6 12 8 4 14 4 Z','M9 15 L5 19 M4.5 17.5 C3 17 2.5 19 4 19.6 C4.3 21 6.4 20.6 6 19.1'],f1:'#d86a3a',f2:'#f3e3c8',st:'#3a1a06',b:[15,7,.9]},
  ess:{p:['M9 3 H15 M10 3 V8 L5.5 17 C4.6 19 6 21 8 21 H16 C18 21 19.4 19 18.5 17 L14 8 V3','M7 15.5 H17 L18.5 18 C19 19.6 17.8 21 16 21 H8 C6.2 21 5 19.6 5.5 18 Z'],f1:'rgba(255,255,255,.08)',f2:'#5fd068',st:'#d8ffd0',b:[11,16,1.2]}};
const EVT_FRAG='<svg class="pz-pf" viewBox="0 0 24 24"><path d="M12 2 L19 9 L12 22 L5 9 Z" fill="#8ff5ff" stroke="#1d4a5a" stroke-width="1.2" stroke-linejoin="round"></path><path d="M5 9 H19 L12 22 Z" fill="#ff8ad8" opacity=".75"></path><path d="M12 2 L9 9 L12 22 L15 9 Z" fill="#fff" opacity=".45"></path></svg>';
const EVT_CSS=`.pz{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;color:#f6ecdf;font-family:Nunito,system-ui,sans-serif}
.pz button{font-family:Nunito,system-ui,sans-serif;color:#f6ecdf;cursor:pointer}
.pz button:active{transform:scale(.96)}
.pz-ol{text-shadow:1px 0 0 #120c08,-1px 0 0 #120c08,0 1px 0 #120c08,0 -1px 0 #120c08,0 2px 3px rgba(0,0,0,.7)}
.pz-lil{font-family:'Lilita One',sans-serif;font-weight:400}
.pz-kid{background-image:url(assets/anim/hyb/R/kael_idle_era2_t0.png);background-size:1200% 100%;background-repeat:no-repeat;animation:pzsh 1s steps(12,jump-none) infinite}
.pz-au13{background-image:url(assets/anim/aura/aura13.png);background-size:1600% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:pzsh 1.333s steps(16,jump-none) infinite}
.pz-au10{background-image:url(assets/anim/aura/aura10.png);background-size:1600% 100%;background-repeat:no-repeat;mix-blend-mode:screen;animation:pzsh 1.333s steps(16,jump-none) infinite}
@keyframes pzsh{from{background-position:0 0}to{background-position:100% 0}}
@keyframes pzspin{to{transform:rotate(360deg)}}
@keyframes pzgsh{from{background-position:120% 0}to{background-position:-130% 0}}
@keyframes pztwk{0%,100%{transform:scale(.2);opacity:0}50%{transform:scale(1.25);opacity:1}}
@keyframes pzshn{0%,55%{background-position:160% 0}100%{background-position:-60% 0}}
@keyframes pzhue{to{filter:hue-rotate(360deg)}}
.pz-inR{animation:pzinR .35s ease-out both}
@keyframes pzinR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}
.pz-inU{animation:pzinU .4s cubic-bezier(.2,1.2,.4,1) both}
@keyframes pzinU{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}
.pz-evs{flex:none;display:grid;grid-template-columns:repeat(auto-fit,minmax(124px,1fr));gap:6px;padding-bottom:2px}   /* regra do dono: nunca rolagem horizontal; os eventos quebram linha (2 por linha em 288 px) */
.pz-ev{min-height:56px;display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:14px;border:2px solid #4a3a2b;background:#1d1611;text-align:left;min-width:0}
.pz-ev[aria-selected="true"]{border-color:#ffc94a;background:#3a2c1f;box-shadow:inset 0 -3px 0 #ffc94a}
.pz-ev img{width:30px;height:30px;object-fit:contain;flex:none}
.pz-tag{display:inline-block;font-size:10px;font-weight:900;line-height:16px;padding:0 6px;border-radius:6px;white-space:nowrap;color:#fff}
.pz-tag.on{background:#2f8a36;animation:pztp 1.3s ease-in-out infinite}
@keyframes pztp{0%,100%{box-shadow:0 0 0 rgba(95,208,104,0)}50%{box-shadow:0 0 10px rgba(95,208,104,.95)}}
.pz-tag.soon{background:#1d5a9a}
.pz-tag.gr{background:#a8650c;animation:pztp2 1.3s ease-in-out infinite}
@keyframes pztp2{0%,100%{box-shadow:0 0 0 rgba(255,160,60,0)}50%{box-shadow:0 0 10px rgba(255,160,60,.95)}}
.pz-ban{position:relative;flex:none;height:160px;border-radius:18px;overflow:hidden;border:2px solid var(--bd);background:var(--bg);animation:pzbi .5s cubic-bezier(.2,1.2,.4,1) both}
@keyframes pzbi{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}
.pz-ban .pz-rays{position:absolute;right:-10%;top:-40%;width:312px;aspect-ratio:1;border-radius:50%;background:repeating-conic-gradient(rgba(255,230,160,.24) 0deg 8deg,transparent 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 20%,transparent 68%);mask:radial-gradient(circle,#000 20%,transparent 68%);animation:pzspin 16s linear infinite}
.pz-ban::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.14) 50%,transparent 65%);background-size:300% 100%;animation:pzshn 4s ease-in-out infinite;pointer-events:none}
.pz-btxt{position:absolute;left:12px;top:10px;bottom:10px;right:42%;display:flex;flex-direction:column;justify-content:space-between;z-index:2;min-width:0}
.pz-btitle{font-family:'Lilita One',sans-serif;font-size:26px;line-height:1.02;background-image:linear-gradient(100deg,#ffe07a 20%,#fffaf0 45%,#f2a826 60%,#ffe07a 80%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:pzgsh 2.6s linear infinite;filter:drop-shadow(0 2px 0 #3a1a04) drop-shadow(0 0 6px rgba(0,0,0,.6))}
.pz-stg{position:absolute;right:2%;bottom:0;width:40%;height:100%;z-index:1}
.pz-ped{position:absolute;left:16%;right:16%;bottom:6%;height:9%;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#8a6a3a 0%,#4a3420 60%,#22180f 100%);border:2px solid #c9973a;animation:pzpg 2.6s ease-in-out infinite}
@keyframes pzpg{0%,100%{box-shadow:0 0 6px rgba(255,201,74,.3)}50%{box-shadow:0 0 18px rgba(255,201,74,.85)}}
.pz-stg .pz-hero{position:absolute;left:50%;bottom:6.5%;height:86%;aspect-ratio:1;transform:translateX(-50%)}
.pz-stg .pz-aur{position:absolute;left:50%;bottom:10%;height:96%;aspect-ratio:256/320;transform:translateX(-50%);opacity:.85}
.pz-conf{position:absolute;top:-10px;width:6px;height:9px;border-radius:1px;animation:pzcf 3s linear infinite;opacity:0;z-index:1}
@keyframes pzcf{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}85%{opacity:1}100%{transform:translateY(210px) rotate(600deg);opacity:0}}
.pz-spark{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff3c4;box-shadow:0 0 8px 3px rgba(255,201,74,.9);animation:pztwk 1.8s ease-in-out infinite;z-index:1}
.pz-timer{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:10px;background:rgba(10,7,5,.72);border:1px solid rgba(255,236,200,.22);align-self:flex-start;max-width:100%}
.pz-hg{animation:pzhg 3s cubic-bezier(.6,0,.3,1) infinite;transform-origin:50% 50%;flex:none}
@keyframes pzhg{0%,80%{transform:rotate(0)}100%{transform:rotate(180deg)}}
.pz-sT{animation:pzsT 3s linear infinite;transform-origin:50% 100%;transform-box:fill-box}
@keyframes pzsT{0%{transform:scaleY(1)}80%,100%{transform:scaleY(0)}}
.pz-sB{animation:pzsB 3s linear infinite;transform-origin:50% 100%;transform-box:fill-box}
@keyframes pzsB{0%{transform:scaleY(0)}80%,100%{transform:scaleY(1)}}
.pz-pts{flex:none;display:flex;align-items:stretch;gap:6px}
.pz-pbox{position:relative;flex:1;min-width:0;display:flex;align-items:center;gap:8px;min-height:48px;padding:4px 10px;border-radius:14px;background:linear-gradient(90deg,var(--t1),#1d1611);border:2px solid var(--ta)}
.pz-tok{flex:none;animation:pztok 3s ease-in-out infinite}
@keyframes pztok{0%,100%{transform:rotateY(0)}50%{transform:rotateY(180deg)}}
.pz-mbtn{position:relative;flex:none;min-width:96px;min-height:48px;border-radius:14px;border:2px solid var(--ta);background:#33271d;font-family:'Lilita One',sans-serif!important;font-size:15px;display:flex;align-items:center;justify-content:center;gap:5px;padding:0 10px}
.pz-mbtn.go{background:linear-gradient(180deg,#9ff0a6,#3fae3c);color:#0d2410!important;border-color:#c4f7c8;animation:pzclp 1.2s ease-in-out infinite}
.pz-tabs{flex:none;display:flex;gap:4px;padding:4px;border-radius:14px;background:#0e0a07;border:1px solid #4a3a2b}
.pz-tab{position:relative;flex:1;min-width:0;min-height:44px;border:0;border-radius:10px;background:transparent;color:#c9b9a2!important;font-family:'Lilita One',sans-serif!important;font-size:16px;padding:0 6px}
.pz-tab[aria-selected="true"]{background:#3a2c1f;color:#ffc94a!important;box-shadow:inset 0 -3px 0 #ffc94a}
.pz-dot{position:absolute;top:5px;right:8px;min-width:18px;height:18px;border-radius:9px;background:#ff3b30;color:#fff;font-family:Nunito,sans-serif;font-size:11px;font-weight:900;line-height:18px;padding:0 4px;animation:pzdp 1.2s ease-in-out infinite}
.pz-soon{display:inline-block;margin-left:4px;padding:0 5px;border-radius:6px;background:#1d5a9a;color:#fff;font-family:Nunito,sans-serif;font-size:9px;font-weight:900;line-height:14px;vertical-align:2px}
@keyframes pzdp{0%,100%{transform:scale(1)}50%{transform:scale(1.2);box-shadow:0 0 8px #ff3b30}}
.pz-shards{flex:none;display:flex;align-items:center;gap:5px;min-height:34px;padding:2px 8px;border-radius:12px;background:#0e0a07;border:1px solid #4a3a2b}
.pz-clk{width:30px;height:30px;flex:none;border-radius:50%;background:url(assets/map/clock_empty.png) center/100% 100% no-repeat;animation:pzclk 6s linear infinite;box-shadow:0 0 10px rgba(255,201,74,.6)}
@keyframes pzclk{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(6deg)}}
.pz-sh{width:18px;height:23px;flex:none;background-size:contain;background-repeat:no-repeat;background-position:center;filter:grayscale(1) brightness(.4);opacity:.55}
.pz-trail{position:relative;flex:none;height:270px;border-radius:18px;overflow:hidden;border:2px solid var(--ta);background:#120d0a;box-shadow:inset 0 0 0 2px rgba(0,0,0,.4)}
.pz-map{position:absolute;inset:-4%;background-size:cover;background-position:50% 50%;animation:pzkb 24s ease-in-out infinite alternate}
@keyframes pzkb{from{transform:scale(1) translate(0,0)}to{transform:scale(1.08) translate(-2%,1.5%)}}
.pz-fog{position:absolute;inset:0;background:var(--fog);pointer-events:none}
.pz-vg{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,transparent 45%,rgba(0,0,0,.55));pointer-events:none}
.pz-pth{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.pz-dash{animation:pzdash 1.2s linear infinite}
@keyframes pzdash{to{stroke-dashoffset:-14}}
.pz-mk{position:absolute;width:60px;height:60px;margin:-57px 0 0 -30px;z-index:3;pointer-events:none}
.pz-mkTag{position:absolute;left:50%;top:-4px;transform:translateX(-50%);padding:0 6px;border-radius:7px;background:#ffc94a;color:#2a1403;font-size:9.5px;font-weight:900;line-height:14px;white-space:nowrap}
.pz-flag{position:absolute;margin:-30px 0 0 -6px;pointer-events:none;z-index:1}
.pz-flag i{position:absolute;left:3px;top:0;width:20px;height:13px;background:#5fd068;transform-origin:0 50%;clip-path:polygon(0 0,100% 50%,0 100%);animation:pzwave 1s ease-in-out infinite alternate}
@keyframes pzwave{from{transform:skewY(-9deg) scaleX(.85)}to{transform:skewY(7deg) scaleX(1)}}
.pz-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;width:250px;max-width:84%;padding:12px;border-radius:16px;background:rgba(14,10,7,.88);border:2px dashed var(--ta);display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
.pz-boss{position:relative;flex:none;height:230px;border-radius:18px;overflow:hidden;border:2px solid var(--ta);background:#120d0a}
.pz-mist{position:absolute;left:-20%;right:-20%;bottom:6%;height:30%;background:radial-gradient(ellipse 30% 50% at 30% 60%,var(--mc),transparent 70%),radial-gradient(ellipse 30% 50% at 70% 50%,var(--mc),transparent 70%);animation:pzmist 7s ease-in-out infinite alternate;pointer-events:none}
@keyframes pzmist{from{transform:translateX(-6%)}to{transform:translateX(6%)}}
.pz-bfig{position:absolute;right:4%;bottom:12%;width:170px;aspect-ratio:1}
.pz-rune{position:absolute;left:4%;right:4%;bottom:-6%;height:20%;border-radius:50%;background:repeating-conic-gradient(var(--bc) 0deg 6deg,transparent 6deg 18deg);-webkit-mask:radial-gradient(ellipse,transparent 40%,#000 46%,#000 64%,transparent 70%);mask:radial-gradient(ellipse,transparent 40%,#000 46%,#000 64%,transparent 70%);animation:pzspin 6s linear infinite;opacity:.9}
.pz-bfig .pz-au10{position:absolute;left:-12%;width:124%;height:150%;bottom:0;opacity:.95}
.pz-bimg{position:absolute;inset:0;background-size:contain;background-repeat:no-repeat;background-position:50% 100%;animation:pzei 1.8s ease-in-out infinite;transform-origin:50% 100%}
@keyframes pzei{0%,100%{transform:scaleX(-1) scaleY(1)}50%{transform:scaleX(-1) scaleY(1.035)}}
.pz-emb{position:absolute;width:4px;height:4px;border-radius:50%;background:var(--bc);box-shadow:0 0 6px 2px var(--bc);animation:pzrise 2.4s ease-out infinite;opacity:0}
@keyframes pzrise{0%{transform:translateY(0);opacity:0}15%{opacity:1}100%{transform:translateY(-120px);opacity:0}}
.pz-kfig{position:absolute;left:4%;bottom:10%;width:126px;aspect-ratio:1}
.pz-kfig .pz-au13{position:absolute;left:0;width:100%;height:125%;bottom:3%}
.pz-flr{position:absolute;left:0;right:0;bottom:0;height:13%;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.55))}
.pz-chip{display:inline-flex;align-items:center;gap:3px;min-height:24px;padding:1px 7px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;font-size:11px;font-weight:900;line-height:1.1;white-space:nowrap}
.pz-lock{display:flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px;border-radius:14px;border:2px dashed #4a3a2b;background:#1d1611;font-size:13px;font-weight:900;color:#c9b9a2;text-align:center}
.pz-vit{position:relative;flex:none;display:grid;grid-template-columns:44% minmax(0,1fr);min-height:150px;border-radius:18px;overflow:hidden;border:2px solid #ffb21e;background:radial-gradient(ellipse at 22% 70%,var(--vg),#1d1611 70%);animation:pzitg 2s ease-in-out infinite;--rg:rgba(255,178,30,.75)}
.pz-vit::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.14) 50%,transparent 65%);background-size:300% 100%;animation:pzshn 3.4s ease-in-out infinite;pointer-events:none}
.pz-vst{position:relative;min-height:150px}
.pz-vst .pz-vr{position:absolute;left:50%;top:44%;width:210px;height:210px;margin:-105px 0 0 -105px;border-radius:50%;background:repeating-conic-gradient(rgba(255,214,120,.3) 0deg 8deg,transparent 8deg 22deg);-webkit-mask:radial-gradient(circle,#000 18%,transparent 66%);mask:radial-gradient(circle,#000 18%,transparent 66%);animation:pzspin 14s linear infinite}
.pz-vst .pz-ped{left:14%;right:14%;bottom:7%;height:10%;border-color:#ffb21e}
.pz-vst .pz-aur{position:absolute;left:50%;bottom:11%;height:96%;aspect-ratio:256/320;transform:translateX(-50%)}
.pz-vst .pz-hero{position:absolute;left:50%;bottom:calc(12% - 4px);height:80%;aspect-ratio:1;transform:translateX(-50%)}
.pz-vinfo{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:10px 10px 10px 4px;min-width:0}
.pz-rib{align-self:flex-start;padding:1px 8px;border-radius:7px;font-size:10px;font-weight:900;letter-spacing:.8px;line-height:16px;color:#2a1403;background:linear-gradient(100deg,#ffe07a 20%,#fffaf0 45%,#f2a826 60%,#ffe07a 80%);background-size:250% 100%;animation:pzgsh 2.6s linear infinite}
.pz-shop{flex:none;display:grid;grid-template-columns:44px repeat(3,minmax(0,1fr)) 44px;gap:5px;align-items:stretch}
.pz-ghost{min-height:44px;min-width:44px;border-radius:12px;border:2px solid #4a3a2b;background:#33271d;font-weight:900;font-size:14px;padding:0 12px;display:flex;align-items:center;justify-content:center;gap:6px}
.pz-ghost[disabled]{color:#6a5a48!important}
.pz-it{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 5px;border-radius:14px;background:linear-gradient(180deg,#2c2017,#19120d);border:2px solid var(--rc);min-width:0;overflow:hidden}
.pz-it.hot{animation:pzitg 2s ease-in-out infinite}
@keyframes pzitg{0%,100%{box-shadow:0 0 0 rgba(0,0,0,0)}50%{box-shadow:0 0 14px var(--rg)}}
.pz-it::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.1) 50%,transparent 65%);background-size:300% 100%;animation:pzshn 3.4s ease-in-out infinite;pointer-events:none}
.pz-cnr{position:absolute;right:-1px;top:-1px;width:18px;height:18px;background:var(--rc);clip-path:polygon(0 0,100% 0,100% 100%);opacity:.9}
.pz-rlab{position:relative;z-index:1;font-size:9.5px;font-weight:900;letter-spacing:.6px;color:var(--rc);text-transform:uppercase}
.pz-ic{position:relative;width:60px;aspect-ratio:1;flex:none;display:flex;align-items:center;justify-content:center}
.pz-ic svg,.pz-ic img{width:84%;height:84%;object-fit:contain}
.pz-glow{position:absolute;inset:6%;border-radius:50%;background:radial-gradient(circle,var(--rg),transparent 68%);animation:pzglow 2s ease-in-out infinite}
@keyframes pzglow{0%,100%{transform:scale(.85);opacity:.6}50%{transform:scale(1.08);opacity:1}}
.pz-bob{animation:pzbob 2.4s ease-in-out infinite;transform-origin:50% 100%;position:relative}
@keyframes pzbob{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg) scale(1.05)}}
.pz-cspin{animation:pzcs 2.4s linear infinite}
@keyframes pzcs{0%{transform:scaleX(1)}50%{transform:scaleX(.15)}100%{transform:scaleX(1)}}
.pz-pf{animation:pzhue 3s linear infinite,pzpf 1.6s ease-in-out infinite}
@keyframes pzpf{0%,100%{filter:drop-shadow(0 0 2px rgba(143,245,255,.6))}50%{filter:drop-shadow(0 0 9px rgba(143,245,255,1))}}
.pz-bubl{animation:pzbu 1.6s ease-in infinite}
@keyframes pzbu{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(-8px);opacity:0}}
.pz-skf{position:relative;width:90%;aspect-ratio:1;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 40%,#5a3a7a,#120d0a);border:3px solid #ffc94a;box-shadow:0 0 10px rgba(255,201,74,.7)}
.pz-skf .pz-kid{position:absolute;width:182%;height:182%;left:-41%;top:-10%}
.pz-inm{font-size:12px;font-weight:900;text-align:center;line-height:1.1;min-height:2.2em;display:flex;align-items:center;justify-content:center}
.pz-lim{font-size:10.5px;font-weight:800;color:#c9b9a2}
.pz-buy{width:100%;min-height:44px;border-radius:12px;border:0;font-family:'Lilita One',sans-serif!important;font-size:16px;display:flex;align-items:center;justify-content:center;gap:4px;padding:0 4px;position:relative;z-index:1}
.pz-buy.can{background:linear-gradient(180deg,#d9b8ff,#8a4dff);color:#1a0a33!important;box-shadow:0 4px 0 #4a1f8a}
.pz-buy.no{background:#33271d;color:#8a7a68!important;border:2px solid #4a3a2b}
.pz-buy.out{background:transparent;color:#7ef08a!important;border:2px dashed #3fae3c}
.pz-rules{flex:none;display:flex;flex-wrap:wrap;gap:4px;justify-content:center}
.pz-rule{display:inline-flex;align-items:center;gap:4px;min-height:24px;padding:2px 8px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;font-size:11.5px;font-weight:900;color:#e8dccb;line-height:1.1}
.pz-rule.ok{border-color:#3fae3c;color:#b8f5bd}
.pz-gold{width:100%;min-height:56px;border:0;border-radius:16px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403!important;font-family:'Lilita One',sans-serif!important;font-size:21px;box-shadow:0 6px 0 #8a4f0c;display:flex;align-items:center;justify-content:center;gap:10px;position:relative;overflow:hidden;padding:0 10px}
.pz-gold.pulse{animation:pzpulse 1.4s ease-in-out infinite}
.pz-gold.off{background:#4a3a2b;color:#c9b9a2!important;box-shadow:0 6px 0 #2a2018}
@keyframes pzpulse{0%,100%{box-shadow:0 6px 0 #8a4f0c,0 0 0 rgba(255,201,74,0)}50%{box-shadow:0 6px 0 #8a4f0c,0 0 22px rgba(255,201,74,.9)}}
.pz-gold::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 30%,rgba(255,255,255,.6) 50%,transparent 70%);background-size:300% 100%;animation:pzshn 2.6s ease-in-out infinite;pointer-events:none}
.pz-gold.off::after{display:none}
.pz-note{font-size:12px;font-weight:800;color:#c9b9a2;line-height:1.3}
.pz-mis{min-height:60px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:6px 8px 6px 10px;border-radius:14px;background:#1d1611;border:1px solid #4a3a2b}
.pz-mis.done{border-color:#5fd068;background:linear-gradient(90deg,#1f3a1f,#1d1611)}
.pz-mis.claimed{opacity:.62}
.pz-bar{display:block;height:10px;border-radius:5px;background:#0e0a07;border:1px solid #000;overflow:hidden}
.pz-bar i{display:block;height:100%;border-radius:5px;background:linear-gradient(90deg,#b07cff,#e6d0ff);position:relative;overflow:hidden;animation:pzgrow .8s cubic-bezier(.2,1,.4,1) both;transform-origin:0 50%}
.pz-bar i::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.7),transparent);background-size:50% 100%;background-repeat:no-repeat;animation:pzrun 1.8s linear infinite}
.pz-mis.done .pz-bar i{background:linear-gradient(90deg,#3fae3c,#c4f27a)}
@keyframes pzgrow{from{transform:scaleX(0)}to{transform:none}}
@keyframes pzrun{from{background-position:-60% 0}to{background-position:160% 0}}
.pz-cl{min-width:84px;min-height:44px;border-radius:12px;border:0;font-family:'Lilita One',sans-serif!important;font-size:15px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.05;padding:0 8px}
.pz-cl.go{background:linear-gradient(180deg,#9ff0a6,#3fae3c);color:#0d2410!important;box-shadow:0 4px 0 #1f6a1d;animation:pzclp 1.2s ease-in-out infinite}
@keyframes pzclp{0%,100%{box-shadow:0 4px 0 #1f6a1d,0 0 0 rgba(95,208,104,0)}50%{box-shadow:0 4px 0 #1f6a1d,0 0 16px rgba(95,208,104,.95)}}
.pz-cl.wait{background:#33271d;border:2px solid #4a3a2b;color:#e6d0ff!important}
.pz-cl.ok{background:transparent;color:#7ef08a!important}
.pz-sbg{position:absolute;inset:0;z-index:50;background:rgba(8,5,3,.7);display:flex;align-items:flex-end;justify-content:center;animation:pzfade .25s both}
@keyframes pzfade{from{opacity:0}to{opacity:1}}
.pz-sheet{width:100%;max-width:520px;max-height:92%;overflow-y:auto;overflow-x:hidden;border-radius:22px 22px 0 0;background:linear-gradient(180deg,#2c2017,#16110d);border:2px solid #ffc94a;border-bottom:0;padding:14px 14px max(16px,env(safe-area-inset-bottom));box-sizing:border-box;display:flex;flex-direction:column;gap:10px;animation:pzsu .35s cubic-bezier(.2,1.2,.4,1) both}
@keyframes pzsu{from{transform:translateY(100%)}to{transform:none}}
.pz-krun{background-image:url(assets/anim/hyb/R/kael_run_era2_t0.png);background-size:800% 100%;background-repeat:no-repeat;animation:pzsh .66s steps(8,jump-none) infinite}
.pz-katk{background-image:url(assets/anim/hyb/R/kael_attack_era2_t0.png);background-size:1700% 100%;background-repeat:no-repeat;animation:pzsh 1s steps(17,jump-none) both}
.pz-mk .pz-fl{position:absolute;inset:0}
.pz-mk .pz-shd{position:absolute;left:24%;right:24%;bottom:1%;height:9%;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.6),transparent 70%)}
.pz-prog{filter:drop-shadow(0 0 4px rgba(255,201,74,.95))}
.pz-ndr{position:absolute;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;background:repeating-conic-gradient(var(--rg) 0deg 9deg,transparent 9deg 24deg);-webkit-mask:radial-gradient(circle,#000 22%,transparent 68%);mask:radial-gradient(circle,#000 22%,transparent 68%);animation:pzspin 9s linear infinite;pointer-events:none}
.pz-nd{position:absolute;width:48px;height:48px;margin:-24px 0 0 -24px;border-radius:50%;border:3px solid var(--rc);background:radial-gradient(circle at 50% 35%,#5a4632,#140e0a);display:flex;align-items:center;justify-content:center;padding:0;box-shadow:0 4px 0 rgba(0,0,0,.55),0 0 10px var(--rg);z-index:2}
.pz-nd.big{width:60px;height:60px;margin:-30px 0 0 -30px;border-width:4px}
.pz-nd.go{animation:pzndp 1.1s ease-in-out infinite}
@keyframes pzndp{0%,100%{transform:scale(1);box-shadow:0 4px 0 rgba(0,0,0,.55),0 0 6px var(--rg)}50%{transform:scale(1.12);box-shadow:0 4px 0 rgba(0,0,0,.55),0 0 22px var(--rc)}}
.pz-nd.done .pz-ni{filter:saturate(.35) brightness(.7)}
.pz-nd.lock .pz-ni{filter:grayscale(.5) brightness(.6)}
.pz-ni{position:relative;width:70%;height:70%;display:flex;align-items:center;justify-content:center}
.pz-ni img,.pz-ni svg{width:100%;height:100%;object-fit:contain}
.pz-npt{position:absolute;left:50%;top:100%;transform:translate(-50%,3px);min-width:30px;padding:0 5px;border-radius:7px;background:rgba(14,10,7,.92);border:1px solid var(--rc);font-size:10.5px;font-weight:900;line-height:15px;color:#fff;white-space:nowrap}
.pz-nck{position:absolute;right:-5px;top:-5px;width:20px;height:20px;border-radius:50%;background:#3fae3c;border:2px solid #0d2410;display:flex;align-items:center;justify-content:center}
.pz-nbg{position:absolute;right:-6px;top:-6px;width:20px;height:20px;border-radius:50%;background:#ff3b30;border:2px solid #fff;color:#fff;font-size:12px;font-weight:900;line-height:16px;text-align:center;animation:pzdp 1.2s ease-in-out infinite}
.pz-ms{min-height:48px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:8px;padding:4px 6px 4px 10px;border-radius:12px;background:#1d1611;border:1px solid #4a3a2b}
.pz-ms.go{border-color:#5fd068;background:linear-gradient(90deg,#1f3a1f,#1d1611)}
.pz-ms.done{opacity:.62}
.pz-hbar{position:relative;height:20px;border-radius:10px;background:#0e0a07;border:2px solid #000;overflow:hidden}
.pz-hbar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(180deg,#ff9a8a,#c0392b);transition:width .4s ease-out}
.pz-hbar b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:#fff;text-shadow:0 1px 0 #000,0 0 3px #000;white-space:nowrap}
.pz-hbar .pz-mkr{position:absolute;top:0;bottom:0;width:2px;background:rgba(255,255,255,.75)}
.pz-pip{width:15px;height:15px;border-radius:50%;border:2px solid #000;background:#33271d;display:inline-block}
.pz-pip.on{background:radial-gradient(circle at 35% 35%,#fff3c4,var(--ta) 50%,#3a1a04);animation:pztp 1.6s ease-in-out infinite}
.pz-bhit{animation:pzbhit .35s ease-out}
@keyframes pzbhit{0%{filter:none}20%{filter:brightness(2.8) saturate(0);transform:translateX(8px)}100%{filter:none;transform:none}}
.pz-bdp{position:absolute;right:18%;top:22%;font-family:'Lilita One',sans-serif;line-height:1;white-space:nowrap;z-index:5;animation:pzbdp 1.4s ease-out both;pointer-events:none;text-shadow:0 3px 0 #3a0d0a,0 0 10px #000}
@keyframes pzbdp{0%{opacity:0;transform:scale(.4)}15%{opacity:1;transform:scale(1.3)}30%{transform:scale(1)}80%{opacity:1;transform:translateY(-24px)}100%{opacity:0;transform:translateY(-36px)}}
@media (prefers-reduced-motion:reduce){.pz *,.pz *::after{animation:none!important}}`;

/* ---------- leituras do Sys.events isoladas (reserva segura se o módulo não estiver carregado) ---------- */
const evtOk=()=>!!(window.Sys&&Sys.events&&Sys.events.DATA&&Sys.events.phase&&Sys.events.list&&Sys.events.missions&&Sys.events.shop);
const evtHost=()=>(window.Sys&&Sys.host)||{};
const evtNow=()=>{ try{ const h=evtHost(); const n=h.now&&h.now(); if(typeof n==='number'&&isFinite(n)) return n; }catch(e){} return Date.now(); };
const evtEsc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const evtN=v=>Math.round(v||0).toLocaleString('pt-BR');
const evtSnd=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const evtToast=t=>{ try{ if(typeof toast==='function') toast(t); }catch(e){} };
const evtChanged=()=>{ try{ if(typeof statsChanged==='function') statsChanged(); else if(typeof save==='function') save(); }catch(e){} };
const evtTh=id=>EVT_TH[id]||EVT_TH.festival_eras;
/* datas do DATA (AAAA-MM-DD, hora local), lidas igual ao Sys.events */
function evtMs(d){ if(typeof d==='number') return d; const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(d||'')); return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():NaN; }
/* o item com 'needs' só aparece com as chaves do Prismático (igual ao Sys.events.shop) */
const evtPrismOn=()=>{ const P=window.Sys&&Sys.pet; return !!(P&&P.DATA&&P.DATA.v3===true&&P.DATA.v4===true); };
function evtInject(){ if(typeof document==='undefined'||!document.head||document.getElementById('pz_css')) return; const st=document.createElement('style'); st.id='pz_css'; st.textContent=EVT_CSS; document.head.appendChild(st); }
function evtRar(r){ try{ if(typeof RAR!=='undefined'&&RAR[r]&&RAR[r].n) return RAR[r].n; }catch(e){} return EVT_RN[r]||''; }
function evtClock(ms){ const s=Math.max(0,Math.floor(ms/1000)), d=Math.floor(s/86400), h=Math.floor(s%86400/3600), m=Math.floor(s%3600/60), x=s%60, p=n=>String(n).padStart(2,'0');
  return {head:(d>0?d+'d ':'')+p(h)+':'+p(m)+':', sec:p(x), aria:d+' dias, '+h+' horas e '+m+' minutos'}; }

/* tudo o que a tela mostra, lido do Sys.events. live = evento aberto de verdade (módulo ligado e fase 'ativo' ou 'loja'); senão é prévia. */
function evtModel(){
  const E=Sys.events, D=E.DATA, host=evtHost(), on=D.enabled===true;
  let open=[]; if(on){ try{ open=E.list(S,host)||[]; }catch(e){ open=[]; } }
  const evs=(D.events||[]).map(ev=>{ let ph='fim'; try{ ph=E.phase(ev,host); }catch(e){}
    const o=open.find(x=>x.id===ev.id), st=on?(ph==='ativo'?'on':ph==='loja'?'gr':'soon'):'soon';
    return {ev,ph,st,live:!!o,pts:o?o.pts:0,endsAt:o?o.endsAt:(on&&ph==='antes'?evtMs(ev.start):null)}; }).filter(x=>x.ph!=='fim'||x.live);
  if(!evs.length) return {on,evs,cur:null};
  const cur=evs.find(x=>x.ev.id===XEVT.ev)||evs.find(x=>x.st==='on')||evs.find(x=>x.st==='gr')||evs[0];
  XEVT.ev=cur.ev.id;
  let mis, shop;
  if(cur.live){ try{ mis=E.missions(S,host,cur.ev.id)||[]; }catch(e){ mis=[]; } try{ shop=E.shop(S,host,cur.ev.id)||[]; }catch(e){ shop=[]; } }
  else { const pr=evtPrismOn();   /* prévia: as regras do DATA, sem progresso e sem compra (não cria estado no save) */
    mis=(cur.ev.missions||[]).map(m=>({id:m.id,txt:m.txt,need:m.need,pts:m.pts,prism:pr?(m.prism|0):0,p:0,done:false,claimed:false}));
    shop=(cur.ev.shop||[]).filter(x=>!x.needs||(x.needs==='prism'&&pr)).map(x=>({id:x.id,txt:x.txt,cost:x.cost,limit:x.limit,bought:0,canBuy:false,reward:x.reward})); }
  const ready=mis.filter(m=>m.done&&!m.claimed), readySum=ready.reduce((a,m)=>a+(m.pts|0),0);
  const skins=shop.filter(x=>x.reward&&x.reward.skin), vit=skins.find(x=>x.bought<x.limit)||skins[0]||null, grid=shop.filter(x=>x!==vit);
  /* trilha e chefe (Sys.evtrail): lidos do módulo com o evento aberto; prévia = só as regras do DATA (sem criar estado) */
  let tr=null, bs=null; const cf=etOn()?etCfg(cur.ev.id):null;
  if(cf){
    if(cur.live){ try{ tr=Sys.evtrail.trail(S,host,cur.ev.id); }catch(e){ tr=null; } try{ bs=Sys.evtrail.boss(S,host,cur.ev.id); }catch(e){ bs=null; } }
    else { tr={on:true,earned:0,next:(cf.trail||[])[0]||null,milestones:(cf.trail||[]).map(m=>({at:m.at,name:m.name,reward:Object.assign({},m.reward),reached:false,claimed:false})),ready:0};
      bs=cf.boss?{on:true,online:false,open:false,name:cf.boss.name,art:cf.boss.art,hp:0,hpMax:0,attemptsLeft:0,killed:false,myDamage:0,bossPts:0,nextDamage:0,nextPts:0}:null; }
    if(tr&&(!tr.on||!Array.isArray(tr.milestones))) tr=null; if(bs&&!bs.on) bs=null;
    if(bs) bs.max=(cf.boss&&cf.boss.attemptsPerDay)|0; }
  return {on,evs,cur,mis,shop,ready,readySum,vit,grid,canMis:cur.live,shopOpen:cur.live,tr,bs};
}
/* Sys.evtrail ligado? e a configuração do evento (o que não estiver lá usa 'default', igual ao módulo) */
const etOn=()=>!!(window.Sys&&Sys.evtrail&&Sys.evtrail.DATA&&Sys.evtrail.DATA.on===true&&Sys.evtrail.trail&&Sys.evtrail.boss);
const etCfg=id=>{ const E=(Sys.evtrail.DATA&&Sys.evtrail.DATA.events)||{}; return E[id]||E.default||null; };
const evtAbbr=v=>{ try{ if(window.Sys&&Sys.stats&&typeof Sys.stats.abbr==='function') return Sys.stats.abbr(v); }catch(e){} try{ if(typeof kf==='function') return kf(v); }catch(e){} return evtN(v); };
/* texto do prêmio de um marco */
function etRw(rw){ const a=[]; if(!rw) return ''; if(rw.goldk) a.push('Ouro'); if(rw.forge) a.push(rw.forge+' Pedras de forja'); if(rw.food) a.push(rw.food+' Ração'); if(rw.essence) a.push(rw.essence+' Essência'); if(rw.frame) a.push('Moldura do evento'); return a.join(' · '); }
const EVT_FRAME='<svg class="pz-bob" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="none" stroke="#ffe07a" stroke-width="2.6"></rect><rect x="7" y="7" width="10" height="10" rx="2" fill="#8a4dff" stroke="#fff3c4" stroke-width="1.2"></rect><circle cx="3.5" cy="3.5" r="1.8" fill="#ffc94a"></circle><circle cx="20.5" cy="20.5" r="1.8" fill="#ffc94a"></circle></svg>';
function etIc(rw){ rw=rw||{}; if(rw.frame) return EVT_FRAME; if(rw.essence) return evtSvgIc('ess'); if(rw.forge) return evtSvgIc('stone'); if(rw.food) return evtSvgIc('food'); return '<img class="pz-cspin" src="assets/ui/coin.png" alt="">'; }
/* posições dos marcos no mini-mapa: serpente de baixo para cima, 3 por linha (a do protótipo para 9 marcos) */
function etPos(n){ const rows=Math.max(1,Math.ceil(n/3)), out=[];
  for(let i=0;i<n;i++){ const r=Math.floor(i/3), k=i%3, y=rows===1?53:81-r*(56/(rows-1)); out.push([r%2?[75,48,21][k]:[27,53,82][k],+y.toFixed(1)]); } return out; }
/* onde o Kael fica (em "trechos": 0 = largada, i = marco i). Para no meio do trecho, nunca em cima de um marco */
function etF(tr){ const P=[0].concat(tr.milestones.map(m=>m.at)), e=tr.earned|0;
  for(let i=0;i<P.length-1;i++) if(e<P[i+1]){ const t=(e-P[i])/Math.max(1,P[i+1]-P[i]); return i+Math.max(.42,Math.min(.58,t)); }
  return Math.max(0,P.length-1.5); }
function etAt(CO,f){ const i=Math.max(0,Math.min(CO.length-2,Math.floor(f))), t=Math.max(0,Math.min(1,f-i)), a=CO[i], b=CO[i+1]||a; return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]; }
const etReduced=()=>{ try{ return !!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }catch(e){ return false; } };
/* o Kael corre pelo caminho (passa pelas curvas) até a posição nova; mexe só no elemento, sem redesenhar a tela */
function etRun(CO){ if(XEVT.mv) return; XEVT.mv=setInterval(()=>{ const d=XEVT.mkTo-XEVT.mk;
    const el=typeof document!=='undefined'&&document.getElementById?document.getElementById('pz_mk'):null;
    if(Math.abs(d)<.05||!el){ XEVT.mk=XEVT.mkTo; clearInterval(XEVT.mv); XEVT.mv=null; if(el){ const p=etAt(CO,XEVT.mk); el.style.left=p[0].toFixed(2)+'%'; el.style.top=p[1].toFixed(2)+'%'; const sp=el.querySelector&&el.querySelector('.pz-sp'); if(sp) sp.className='pz-sp pz-kid'; } return; }
    const a=etAt(CO,XEVT.mk); XEVT.mk+=Math.sign(d)*Math.min(Math.abs(d),.05); const b=etAt(CO,XEVT.mk); if(b[0]<a[0]-.01) XEVT.mkDir=-1; else if(b[0]>a[0]+.01) XEVT.mkDir=1;
    el.style.left=b[0].toFixed(2)+'%'; el.style.top=b[1].toFixed(2)+'%'; const fl=el.querySelector&&el.querySelector('.pz-fl'); if(fl) fl.style.transform=XEVT.mkDir<0?'scaleX(-1)':'none';
    const sp=el.querySelector&&el.querySelector('.pz-sp'); if(sp&&sp.className.indexOf('pz-krun')<0) sp.className='pz-sp pz-krun'; },40); }
function etStop(){ if(XEVT.mv){ clearInterval(XEVT.mv); XEVT.mv=null; XEVT.mk=XEVT.mkTo; } if(XEVT.hitT){ clearTimeout(XEVT.hitT); XEVT.hitT=null; } }
/* assinatura do que muda por fora (fase, pontos, progresso, compras): o tick redesenha só quando ela muda */
function evtSig(M){ if(!M) return 'x'; if(!M.cur) return 'vazio|'+M.on; const c=M.cur;
  return [M.on,M.evs.map(x=>x.ev.id+':'+x.st).join(','),c.pts,M.mis.map(m=>m.p+(m.claimed?'c':'')).join(','),M.shop.map(x=>x.bought+(x.canBuy?'+':'')).join(','),
    M.tr?M.tr.earned+':'+M.tr.milestones.map(m=>(m.reached?1:0)+(m.claimed?'c':'')).join(''):'-',M.bs?[M.bs.hp,M.bs.hpMax,M.bs.attemptsLeft,M.bs.killed,M.bs.open,M.bs.online].join(':'):'-'].join('|'); }

/* ---------- pedaços de desenho ---------- */
const evtTok=(f,z)=>`<svg ${z?'width="'+z+'" height="'+z+'"':'class="pz-tok" width="32" height="32"'} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${f}" stroke="#fff3c4" stroke-width="1.7"></circle><path d="M12 5.5 L13.9 9.6 L18.3 10 L15 13 L16 17.4 L12 15.1 L8 17.4 L9 13 L5.7 10 L10.1 9.6 Z" fill="#ffe07a" stroke="#6a3a08" stroke-width=".9" stroke-linejoin="round"></path></svg>`;
const evtSvgIc=k=>{ const c=EVT_ICS[k]; return `<svg class="pz-bob" viewBox="0 0 24 24"><path d="${c.p[0]}" fill="${c.f1}" stroke="${c.st}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"></path><path d="${c.p[1]}" fill="${c.f2}" stroke="${c.st}" stroke-width="1.1" stroke-linejoin="round" stroke-linecap="round"></path><circle class="pz-bubl" cx="${c.b[0]}" cy="${c.b[1]}" r="${c.b[2]}" fill="#fff" opacity=".9"></circle></svg>`; };
const evtEra=()=>{ try{ return Math.max(0,Math.min(6,(S.era|0))); }catch(e){ return 0; } };
/* como cada recompensa aparece: ícone, rótulo (só o que o módulo sabe) e cor da moldura */
function evtLook(x){ const w=x.reward||{};
  if(w.skin) return {lab:'Skin',r:4,ic:`<span class="pz-skf"><span class="pz-kid" style="filter:hue-rotate(${EVT_SKHUE[w.skin]||'250deg'}) saturate(1.3)"></span></span>`};
  if(Array.isArray(w.items)&&w.items[0]){ const it=w.items[0], r=Math.max(0,Math.min(4,it.r|0)); return {lab:evtRar(r),r,ic:`<img class="pz-bob" src="assets/icons/slots/era${evtEra()}_${evtEsc(it.slot)}.png" alt="">`}; }
  if(w.petFrags) return {lab:'Prismático',r:5,ic:EVT_FRAG};
  if(w.essence) return {lab:'Material',r:-1,ic:evtSvgIc('ess')};
  if(w.forge) return {lab:'Material',r:-1,ic:evtSvgIc('stone')};
  if(w.food) return {lab:'Material',r:-1,ic:evtSvgIc('food')};
  if(w.goldk||w.gold) return {lab:'Ouro',r:-1,ic:'<img class="pz-cspin" src="assets/ui/coin.png" alt="">'};
  return {lab:'',r:-1,ic:''}; }
const evtRc=r=>r>=0?EVT_RC[r]:'#6b5843', evtRg=r=>r>=0?EVT_RG[r]:'rgba(154,160,166,.25)';
/* nome curto da skin: o que está entre aspas no texto do Sys.events */
function evtSkinName(x){ const m=/"([^"]+)"/.exec(x.txt||''); return m?m[1]:x.txt; }
function evtSkinKind(x){ const i=(x.txt||'').indexOf('"'); return i>0?x.txt.slice(0,i).trim():'Skin'; }

function evtBanner(M,th){ const c=M.cur, ev=c.ev, days=Math.round((evtMs(ev.end)-evtMs(ev.start))/86400000);
  const sub=c.st==='gr'?'Encerrado · use seus pontos na loja antes de sumirem':(isFinite(days)&&days>0?days+' dias · ':'')+'missões e loja de pontos';
  const lbl=c.st==='on'?'Termina em':c.st==='gr'?'Pontos valem por mais':(c.endsAt?'Começa em':'Abre');
  let clk='', aria=lbl;
  if(c.endsAt){ const k=evtClock(c.endsAt-evtNow()); XEVT.sec=k.sec; XEVT.hd=k.head; aria=lbl+' '+k.aria; clk=`<span id="pz_hd">${k.head}</span><span id="pz_sec">${k.sec}</span>`; }
  else { XEVT.sec=''; XEVT.hd=''; clk='Em breve'; }
  const conf=['#ffc94a','#ff5a5a','#5fd068','#4aa3ff','#fff3c4','#b07cff','#ff8ad8','#8ff5ff'].map((cc,i)=>`<span class="pz-conf" style="left:${(8+i*11.5).toFixed(1)}%;background:${cc};animation-delay:${(i*.37).toFixed(2)}s"></span>`).join('');
  return `<div class="pz-ban" style="--bg:${th.bg};--bd:${th.bd}" role="img" aria-label="Banner do evento ${evtEsc(ev.name)}">
    <div class="pz-rays"></div>${conf}
    <span class="pz-spark" style="left:46%;top:18%"></span><span class="pz-spark" style="left:88%;top:12%;animation-delay:.7s"></span><span class="pz-spark" style="left:70%;top:60%;animation-delay:1.3s"></span>
    <div class="pz-stg" aria-hidden="true"><span class="pz-ped"></span><div class="pz-au13 pz-aur"></div><div class="pz-kid pz-hero"></div></div>
    <div class="pz-btxt"><span style="display:flex;flex-direction:column;gap:3px"><span class="pz-btitle">${evtEsc(ev.name)}</span><span class="pz-ol" style="font-size:12.5px;font-weight:900;color:#fff;line-height:1.2">${evtEsc(sub)}</span></span>
      <span class="pz-timer" role="timer" aria-label="${evtEsc(aria)}"><svg class="pz-hg" width="15" height="20" viewBox="0 0 12 16" aria-hidden="true"><path d="M1 1 H11 M1 15 H11" stroke="#c77a12" stroke-width="1.6" stroke-linecap="round"></path><path d="M2.2 1.5 C2.2 5.5 5.2 6.6 5.6 8 C5.2 9.4 2.2 10.5 2.2 14.5 H9.8 C9.8 10.5 6.8 9.4 6.4 8 C6.8 6.6 9.8 5.5 9.8 1.5 Z" fill="rgba(255,240,200,0.12)" stroke="#ffe07a" stroke-width="0.9"></path><path class="pz-sT" d="M3.4 3.2 H8.6 C8 5.6 6.4 6.6 6 7.4 C5.6 6.6 4 5.6 3.4 3.2 Z" fill="#ffc94a"></path><path class="pz-sB" d="M3 14 C3.4 11.6 5.2 10.6 6 10.4 C6.8 10.6 8.6 11.6 9 14 Z" fill="#ffc94a"></path></svg>
        <span style="display:flex;flex-direction:column;line-height:1.05;min-width:0"><span style="font-size:10px;font-weight:800;color:#e8dccb;white-space:nowrap">${lbl}</span><span class="pz-lil" style="font-size:16px;color:#ffe07a;font-variant-numeric:tabular-nums;white-space:nowrap">${clk}</span></span></span></div></div>`; }

/* TRILHA com o Sys.evtrail: mapa, caminho, marcos (botões de resgate), Kael andando pelos pontos ganhos e a lista dos prêmios */
function etTrail(M,th){ const T=M.tr, c=M.cur, pre=!c.live, n=T.milestones.length, NP=etPos(n), CO=[EVT_START].concat(NP), last=n-1;
  const to=pre?.5:etF(T); if(XEVT.mkEv!==c.ev.id||etReduced()||pre){ etStop(); XEVT.mk=to; XEVT.mkEv=c.ev.id; } XEVT.mkTo=to;
  const moving=Math.abs(XEVT.mkTo-XEVT.mk)>.001, mk=XEVT.mk, mp=etAt(CO,mk);
  const seg=Math.min(CO.length-2,Math.floor(mk)), dir=moving?XEVT.mkDir:(CO[seg+1]&&CO[seg+1][0]<CO[seg][0]?-1:1); if(!moving) XEVT.mkDir=dir;
  const all=CO.map(p=>p[0]+','+p[1]).join(' '), done=[]; for(let k=0;k<=Math.min(Math.floor(mk),CO.length-1);k++) done.push(CO[k][0]+','+CO[k][1]); done.push(mp[0].toFixed(2)+','+mp[1].toFixed(2));
  const nx=T.next, hint=pre?'Começa em breve · veja os prêmios':nx?'Próximo marco: '+(nx.name||'')+' em '+evtN(nx.at-T.earned)+' pts':'Trilha completa!';
  const nodes=T.milestones.map((m,i)=>{ const big=!!(m.reward&&m.reward.frame)||i===last, go=m.reached&&!m.claimed, rc=big?'#ffb21e':th.a, rg=big?'rgba(255,178,30,.75)':'rgba(176,124,255,.6)', p=NP[i];
    const st=m.claimed?'resgatado':go?'pronto para resgatar':pre?'prévia':'faltam '+Math.max(0,m.at-T.earned)+' pontos';
    return `${big?`<span class="pz-ndr" style="left:${p[0]}%;top:${p[1]}%;--rg:${rg}"></span>`:''}<button data-x="node" data-at="${m.at}" class="pz-nd${big?' big':''}${go?' go':m.claimed?' done':m.reached?'':' lock'}" aria-label="${evtEsc(m.name)}: ${evtEsc(etRw(m.reward))}, marco de ${m.at} pontos, ${st}" style="left:${p[0]}%;top:${p[1]}%;--rc:${rc};--rg:${rg};animation-delay:${(i*.09).toFixed(2)}s">
      <span class="pz-ni" aria-hidden="true">${etIc(m.reward)}</span><span class="pz-npt">${evtN(m.at)}</span>
      ${m.claimed?'<span class="pz-nck"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg></span>':''}${go?'<span class="pz-nbg" aria-hidden="true">!</span>':''}</button>`; }).join('');
  const list=T.milestones.map(m=>{ const go=m.reached&&!m.claimed;
    return `<div class="pz-ms${go?' go':m.claimed?' done':''}"><span style="min-width:0;display:flex;flex-direction:column;line-height:1.15"><span style="font-size:13px;font-weight:900">${evtEsc(m.name)} <span style="color:#c9b9a2;font-weight:800">· ${evtN(m.at)} pts</span></span><span style="font-size:11.5px;font-weight:800;color:#e8dccb">${evtEsc(etRw(m.reward))}</span></span>
      <button data-x="node" data-at="${m.at}" class="pz-cl ${m.claimed?'ok':go?'go':'wait'}" aria-label="${evtEsc(m.name)}: ${m.claimed?'resgatado':go?'resgatar '+evtEsc(etRw(m.reward)):'faltam '+Math.max(0,m.at-T.earned)+' pontos'}"><span style="font-size:13px">${m.claimed?'resgatado':go?'Resgatar':pre?'prévia':'faltam '+evtN(Math.max(0,m.at-T.earned))}</span></button></div>`; }).join('');
  const html=`<div class="pz-shards" role="status" aria-label="${evtEsc(hint)}"><span style="flex:1;font-size:11.5px;font-weight:900;color:#e8dccb">${evtEsc(hint)}</span>${pre?'<span class="pz-chip" style="border-color:#4aa3ff;color:#cfe6ff">prévia</span>':''}</div>
    <div class="pz-trail" style="--ta:${th.a};--fog:${th.fog}">
    <div class="pz-map" style="background-image:url(${th.map});filter:${th.mapF}${pre?' grayscale(.4) brightness(.8)':''}"></div><div class="pz-fog"></div><div class="pz-vg"></div>
    <svg class="pz-pth" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${all}" fill="none" stroke="rgba(14,8,4,.78)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline><polyline class="pz-dash" points="${all}" fill="none" stroke="rgba(255,240,210,.55)" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>${pre?'':`<polyline class="pz-prog" points="${done.join(' ')}" fill="none" stroke="#ffc94a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline>`}</svg>
    <span class="pz-flag" style="left:${EVT_START[0]}%;top:${EVT_START[1]}%"><svg width="4" height="30" aria-hidden="true"><rect width="3" height="30" fill="#2a180a"></rect></svg><i></i></span>
    ${nodes}
    ${pre?'':`<div id="pz_mk" class="pz-mk" style="left:${mp[0].toFixed(2)}%;top:${mp[1].toFixed(2)}%" role="img" aria-label="Você: ${T.earned} pontos ganhos na trilha"><span class="pz-shd"></span><div class="pz-fl" style="transform:${dir<0?'scaleX(-1)':'none'}"><div class="pz-sp ${moving?'pz-krun':'pz-kid'}" style="position:absolute;inset:0"></div></div><span class="pz-mkTag">VOCÊ</span></div>`}</div>
    <div style="flex:none;display:flex;flex-direction:column;gap:4px" role="list" aria-label="Prêmios da trilha">${list}</div>`;
  if(moving&&!pre) setTimeout(()=>etRun(CO),0);
  return html; }
function evtTrail(M,th){ if(M.tr) return etTrail(M,th); const pre=!M.cur.live, path=[EVT_START].concat(EVT_NODES).map(c=>c[0]+','+c[1]).join(' ');
  const shards=th.shards?`<div class="pz-shards" role="img" aria-label="Relógio do Festival: pedaços apagados, a trilha chega em breve"><span class="pz-clk" aria-hidden="true"></span><span style="font-size:11.5px;font-weight:900;color:#ffe07a;white-space:nowrap">Relógio do Festival</span><span style="flex:1"></span>${Array.from({length:9},(_,i)=>`<span class="pz-sh" aria-hidden="true" style="background-image:url(assets/map/clock_shards/shard_${i}.png)"></span>`).join('')}</div>`:'';
  return `${shards}<div class="pz-trail" style="--ta:${th.a};--fog:${th.fog}">
    <div class="pz-map" style="background-image:url(${th.map});filter:${th.mapF} grayscale(.35) brightness(.8)"></div><div class="pz-fog"></div><div class="pz-vg"></div>
    <svg class="pz-pth" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${path}" fill="none" stroke="rgba(14,8,4,.78)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline><polyline class="pz-dash" points="${path}" fill="none" stroke="rgba(255,240,210,.55)" stroke-width="3" stroke-dasharray="4 10" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"></polyline></svg>
    <span class="pz-flag" style="left:${EVT_START[0]}%;top:${EVT_START[1]}%"><svg width="4" height="30" aria-hidden="true"><rect width="3" height="30" fill="#2a180a"></rect></svg><i></i></span>
    <div class="pz-mk" style="left:${EVT_START[0]+9}%;top:${EVT_START[1]}%" role="img" aria-label="Você, na largada da trilha"><div class="pz-kid" style="position:absolute;inset:0"></div><span class="pz-mkTag">VOCÊ</span></div>
    <div class="pz-card" role="note"><span class="pz-lil pz-ol" style="font-size:19px">Trilha de recompensas</span><span class="pz-chip" style="border-color:#4aa3ff;color:#cfe6ff">Em breve</span><span style="font-size:12px;font-weight:800;color:#e8dccb;line-height:1.25">Os pontos do evento vão levar o Kael pelo mapa até os prêmios.${pre?'':' Por enquanto, gaste-os na loja.'}</span></div></div>`; }

/* CHEFE com o Sys.evtrail: palco (arte do módulo), vida, ataques do dia, dano total e o resultado do último ataque */
function etBoss(M,th){ const b=M.bs, B=th.boss, c=M.cur, pre=!c.live, img=b.art?'assets/enemies/'+evtEsc(b.art)+'.png':B.img, nm=b.name||B.n;
  const hit=XEVT.hit&&XEVT.hit.ev===c.ev.id&&Date.now()-XEVT.hit.t<1400?XEVT.hit:null;
  const emb=[0,1,2,3,4,5].map(i=>`<span class="pz-emb" style="right:${8+i*7}%;bottom:${12+(i*11)%30}%;animation-delay:${(-i*.4).toFixed(1)}s"></span>`).join('');
  const pct=b.hpMax>0?Math.max(0,Math.min(100,b.hp/b.hpMax*100)):0, max=b.max||0;
  const stage=`<div class="pz-boss" style="--ta:${th.a};--fog:${B.fog};--bc:${B.c};--mc:${B.mist}">
    <div class="pz-map" style="background-image:url(${th.map});filter:${B.mapF}"></div><div class="pz-fog"></div><div class="pz-mist"></div><div class="pz-flr"></div>${emb}
    <div class="pz-bfig" role="img" aria-label="${evtEsc(nm)}, chefe do evento${b.killed?', derrotado':''}"><span class="pz-rune"></span><div class="pz-au10" style="filter:hue-rotate(${B.hue}) saturate(1.4)"></div><div class="${hit?'pz-bhit':''}" style="position:absolute;inset:0"><div class="pz-bimg" style="background-image:url(${img})${b.killed?';filter:grayscale(.8) brightness(.55)':''}"></div></div></div>
    <div class="pz-kfig" aria-hidden="true"><div class="pz-au13"></div><div class="${hit?'pz-katk':'pz-kid'}" style="position:absolute;inset:0"></div></div>
    ${hit?`<span class="pz-bdp" role="status" style="color:${hit.killed?'#ffd23a':'#fff'};font-size:${hit.killed?34:28}px">-${evtEsc(evtAbbr(hit.dmg))}<span style="display:block;font-size:18px;color:#7ef08a;margin-top:4px">+${hit.pts} pts</span></span>`:''}
    <div style="position:absolute;left:10px;top:8px;right:10px;z-index:4;display:flex;flex-direction:column;line-height:1.1"><span style="font-size:10.5px;font-weight:900;color:${B.c};letter-spacing:1px;text-shadow:0 1px 2px #000">CHEFE DO EVENTO</span><span class="pz-lil pz-ol" style="font-size:21px">${evtEsc(nm)}</span></div></div>`;
  if(pre) return stage+`<div class="pz-lock" role="note">O chefe aparece com o evento ativo</div>`;
  const pips=Array.from({length:max},(_,i)=>`<span class="pz-pip${b.open&&!b.killed&&i<b.attemptsLeft?' on':''}"></span>`).join('');
  return stage+`<div style="flex:none;display:flex;flex-direction:column;gap:5px">
    <span style="display:flex;justify-content:space-between;gap:6px;font-size:11.5px;font-weight:900;color:#e8dccb"><span>Vida do chefe</span><span style="color:#c9b9a2">${b.online?'compartilhada com todos':'só a sua'}</span></span>
    <div class="pz-hbar" role="progressbar" aria-label="Vida do chefe" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><i style="width:${pct.toFixed(1)}%"></i><span class="pz-mkr" style="left:25%"></span><span class="pz-mkr" style="left:50%"></span><span class="pz-mkr" style="left:75%"></span><b>${b.killed?'Chefe derrotado!':evtEsc(evtAbbr(b.hp))+' / '+evtEsc(evtAbbr(b.hpMax))+' ('+Math.round(pct)+'%)'}</b></div>
    ${b.online?'':'<span class="pz-note" style="font-size:11px">Vida compartilhada com todos quando o online abrir · por enquanto, só a sua</span>'}
    ${b.open&&!b.killed&&b.attemptsLeft>0?`<div style="display:flex;flex-wrap:wrap;gap:4px"><span class="pz-chip" style="border-color:#3fae3c;color:#b8f5bd">Próximo ataque: +${b.nextPts|0} pts</span><span class="pz-chip">dano ${evtEsc(evtAbbr(b.nextDamage))}</span></div>`:''}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;min-height:30px"><span style="font-size:12px;font-weight:900">Seu dano total: <span style="color:#ffe07a">${evtEsc(evtAbbr(b.myDamage))}</span>${b.bossPts?` <span style="color:#c9b9a2">· ${evtN(b.bossPts)} pts</span>`:''}</span>
      <span style="display:flex;align-items:center;gap:6px;--ta:${th.a}"><span style="font-size:11px;font-weight:900;color:#c9b9a2">Ataques hoje ${b.attemptsLeft}/${max}</span>${pips}</span></div></div>`; }
function evtBoss(M,th){ if(M.bs) return etBoss(M,th); const B=th.boss;
  const emb=[0,1,2,3,4,5].map(i=>`<span class="pz-emb" style="right:${8+i*7}%;bottom:${12+(i*11)%30}%;animation-delay:${(-i*.4).toFixed(1)}s"></span>`).join('');
  return `<div class="pz-boss" style="--ta:${th.a};--fog:${B.fog};--bc:${B.c};--mc:${B.mist}">
    <div class="pz-map" style="background-image:url(${th.map});filter:${B.mapF}"></div><div class="pz-fog"></div><div class="pz-mist"></div><div class="pz-flr"></div>${emb}
    <div class="pz-bfig" role="img" aria-label="${evtEsc(B.n)}, chefe do evento"><span class="pz-rune"></span><div class="pz-au10" style="filter:hue-rotate(${B.hue}) saturate(1.4)"></div><div class="pz-bimg" style="background-image:url(${B.img})"></div></div>
    <div class="pz-kfig" aria-hidden="true"><div class="pz-au13"></div><div class="pz-kid" style="position:absolute;inset:0"></div></div>
    <div style="position:absolute;left:10px;top:8px;right:10px;z-index:4;display:flex;flex-direction:column;line-height:1.1"><span style="font-size:10.5px;font-weight:900;color:${B.c};letter-spacing:1px;text-shadow:0 1px 2px #000">CHEFE DO EVENTO</span><span class="pz-lil pz-ol" style="font-size:21px">${evtEsc(B.n)}</span></div></div>
    <div class="pz-lock" role="note" style="flex-direction:column;gap:4px;border-color:#4aa3ff"><span style="color:#cfe6ff;font-size:14px">Em breve: abre com o online</span><span style="font-weight:800;font-size:12px">A vida do chefe é dividida entre todos os jogadores, por isso a luta chega junto com o servidor.</span></div>`; }

function evtShop(M,th){ const c=M.cur, open=M.shopOpen, D=Sys.events.DATA;
  let vit='';
  if(M.vit){ const x=M.vit, out=x.bought>=x.limit, hue=EVT_SKHUE[x.reward.skin]||'250deg', nm=evtSkinName(x);
    vit=`<div class="pz-vit" style="--vg:${th.vit}"><div class="pz-vst" aria-hidden="true"><span class="pz-vr"></span><span class="pz-spark" style="left:12%;top:16%"></span><span class="pz-spark" style="left:82%;top:24%;animation-delay:.7s"></span><span class="pz-spark" style="left:66%;top:70%;animation-delay:1.3s"></span><span class="pz-ped"></span><div class="pz-au13 pz-aur" style="filter:hue-rotate(${hue}) saturate(1.3)"></div><div class="pz-kid pz-hero" style="filter:hue-rotate(${hue}) saturate(1.3)"></div></div>
      <div class="pz-vinfo"><span class="pz-rib">PRÊMIO PRINCIPAL</span><span class="pz-lil pz-ol" style="font-size:21px;line-height:1.05;color:#fff">${evtEsc(nm)}</span><span class="pz-note" style="font-size:11.5px">${evtEsc(evtSkinKind(x))} · só visual, nunca dá atributo</span><span class="pz-lim">limite ${x.bought}/${x.limit} · ${evtN(x.cost)} pontos</span>
        <button data-x="buy" data-id="${evtEsc(x.id)}" class="pz-buy ${out?'out':x.canBuy?'can':'no'}" aria-label="${evtEsc(nm)}${out?', já comprada':', '+x.cost+' pontos'+(x.canBuy?'':open?', saldo insuficiente':', a loja abre com o evento')}">${out?'Comprada':evtTok(th.tok,18)+evtN(x.cost)}</button></div></div>`; }
  const pages=Math.max(1,Math.ceil(M.grid.length/EVT_SPER)); XEVT.sPage=Math.max(0,Math.min(XEVT.sPage,pages-1));
  const items=M.grid.slice(XEVT.sPage*EVT_SPER,XEVT.sPage*EVT_SPER+EVT_SPER).map((x,j)=>{ const L=evtLook(x), out=x.bought>=x.limit, nm=x.reward&&x.reward.skin?evtSkinName(x):x.txt;
    return `<div class="pz-it pz-inU${L.r>=2?' hot':''}" style="--rc:${evtRc(L.r)};--rg:${evtRg(L.r)};animation-delay:${j*.06}s,${j*.06}s"><span class="pz-cnr"></span><span class="pz-rlab">${evtEsc(L.lab)}</span>
      <span class="pz-ic" aria-hidden="true"><span class="pz-glow"></span>${L.ic}</span><span class="pz-inm pz-ol">${evtEsc(nm)}</span><span class="pz-lim">limite ${x.bought}/${x.limit}</span>
      <button data-x="buy" data-id="${evtEsc(x.id)}" class="pz-buy ${out?'out':x.canBuy?'can':'no'}" aria-label="${evtEsc(nm)}${L.lab?', '+evtEsc(L.lab):''}${out?', esgotado':', '+x.cost+' pontos'+(x.canBuy?'':open?', saldo insuficiente':', a loja abre com o evento')}, comprados ${x.bought} de ${x.limit}">${out?'Esgotado':evtTok(th.tok,16)+evtN(x.cost)}</button></div>`; }).join('');
  const arrow=(d,lb,pts,on)=>`<button data-x="spg" data-d="${d}" class="pz-ghost" aria-label="${lb}" style="padding:0" ${on?'':'disabled aria-disabled="true"'}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${pts}"></polyline></svg></button>`;
  const gd=D.graceDays|0;
  return `${open?'':'<div class="pz-lock" role="note">A loja abre junto com o evento. Prévia:</div>'}${vit}
    ${M.grid.length?`<div class="pz-shop">${arrow(-1,'Itens anteriores','15 18 9 12 15 6',XEVT.sPage>0)}${items}${'<span></span>'.repeat(Math.max(0,EVT_SPER-Math.min(EVT_SPER,M.grid.length-XEVT.sPage*EVT_SPER)))}${arrow(1,'Próximos itens','9 18 15 12 9 6',XEVT.sPage<pages-1)}</div>`:''}
    <div class="pz-rules" role="list" aria-label="Regras da loja"><span class="pz-rule ok" role="listitem"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5fd068" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5 12 10 17 19 7"></polyline></svg>Compra direta, nunca sorteio</span><span class="pz-rule" role="listitem">Limite por item · página ${XEVT.sPage+1}/${pages}</span>${gd>0?`<span class="pz-rule" role="listitem">+${gd} ${gd>1?'dias':'dia'} para gastar após o fim</span>`:''}</div>`; }

function evtMisSheet(M,th){ const c=M.cur, pages=Math.max(1,Math.ceil(M.mis.length/EVT_MPER)); XEVT.mPage=Math.max(0,Math.min(XEVT.mPage,pages-1));
  const lock=!c.live?(c.st==='soon'?'As missões abrem quando o evento começar. Prévia:':''):(c.st==='gr'?'Evento encerrado: o progresso parou. Resgate o que já completou antes de a loja fechar.':'');
  const rows=M.mis.slice(XEVT.mPage*EVT_MPER,XEVT.mPage*EVT_MPER+EVT_MPER).map((m,j)=>{ const dn=m.done, cl=m.claimed, pct=m.need?Math.min(100,m.p/m.need*100):0;
    return `<div class="pz-mis pz-inR${dn?' done':''}${cl?' claimed':''}" style="animation-delay:${j*.06}s"><span style="min-width:0;display:flex;flex-direction:column;gap:4px">
      <span style="display:flex;justify-content:space-between;gap:6px;font-size:13px;font-weight:900;line-height:1.15"><span style="min-width:0">${evtEsc(m.txt)}</span><span style="flex:none;color:#c9b9a2;font-variant-numeric:tabular-nums">${cl?'feito':evtN(m.p)+'/'+evtN(m.need)}</span></span>
      <span class="pz-bar"><i style="width:${pct.toFixed(1)}%;animation-delay:${j*.06}s"></i></span>
      ${m.prism?`<span style="display:flex;align-items:center;gap:4px;font-size:11px;font-weight:900;color:#8ff5ff"><span style="width:14px;height:14px;display:inline-flex">${EVT_FRAG}</span>+${m.prism} fragmentos do Prismático</span>`:''}</span>
      <button data-x="claim" data-id="${evtEsc(m.id)}" class="pz-cl ${cl?'ok':dn?'go':'wait'}" aria-label="${evtEsc(m.txt)}: ${cl?'resgatado':dn?'resgatar '+m.pts+' pontos':m.p+' de '+m.need+', vale '+m.pts+' pontos'}"><span style="font-size:11px;font-family:Nunito,sans-serif;font-weight:900">${cl?'resgatado':dn?'Resgatar':'pontos'}</span><span>+${m.pts}</span></button></div>`; }).join('');
  const rep=(c.ev.repeat||[]).map(r=>`<span class="pz-note" style="font-size:11.5px">Também: +${r.pts} pontos a cada ${evtN(r.every)} ${evtEsc(EVT_K[r.k]||r.k)} (até ${evtN(r.cap)} pontos no evento).</span>`).join('');
  const pg=(d,lb,pts,on)=>`<button data-x="mpg" data-d="${d}" class="pz-ghost" aria-label="${lb}" style="padding:0;width:44px" ${on?'':'disabled aria-disabled="true"'}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="${pts}"></polyline></svg></button>`;
  return `<div class="pz-sbg"><div class="pz-sheet" role="dialog" aria-modal="true" aria-label="Missões do evento" style="border-color:${th.a}">
    <div style="display:flex;align-items:center;gap:8px"><span class="pz-lil pz-ol" style="flex:1;font-size:22px">Missões do evento</span><button data-x="misclose" class="pz-ghost" aria-label="Fechar missões" style="padding:0;width:44px"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18"></path></svg></button></div>
    <span class="pz-note">Cada missão vale uma vez no evento e dá ${evtEsc(c.ev.points||'pontos do evento')}, que você gasta na loja.</span>${rep}
    ${lock?`<div class="pz-lock">${lock}</div>`:''}
    <div style="display:flex;flex-direction:column;gap:5px">${rows}</div>
    ${pages>1?`<div style="height:44px;display:flex;align-items:center;justify-content:center;gap:10px">${pg(-1,'Missões anteriores','15 18 9 12 15 6',XEVT.mPage>0)}<span style="min-width:90px;text-align:center;font-size:12px;font-weight:900;color:#c9b9a2">${XEVT.mPage+1}/${pages}</span>${pg(1,'Próximas missões','9 18 15 12 9 6',XEVT.mPage<pages-1)}</div>`:''}
    <button data-x="misall" class="pz-gold ${M.readySum>0?'pulse':'off'}" aria-label="${M.readySum>0?'Resgatar todas as missões prontas, mais '+M.readySum+' pontos':'Nenhuma missão pronta'}"><span style="position:relative;z-index:1">${M.readySum>0?'Resgatar tudo · +'+evtN(M.readySum)+' pts':'Nada para resgatar agora'}</span></button></div></div>`; }

function evtBuySheet(M){ const x=M.shop.find(y=>y.id===XEVT.buy); if(!x){ XEVT.buy=null; return ''; } const nm=x.reward&&x.reward.skin?evtSkinName(x):x.txt, bal=M.cur.pts;
  return `<div class="pz-sbg"><div class="pz-sheet" role="dialog" aria-modal="true" aria-label="Confirmar compra">
    <span class="pz-lil pz-ol" style="font-size:22px;text-align:center">Comprar ${evtEsc(nm)}?</span>
    <span class="pz-note" style="text-align:center">Você leva exatamente este item. Sem sorteio. Restam ${Math.max(0,x.limit-x.bought)} no limite do evento.</span>
    <div style="display:flex;align-items:center;justify-content:center;gap:10px;font-weight:900"><span>Saldo ${evtN(bal)}</span><span style="color:#c9b9a2">→</span><span style="color:#ffe07a">${evtN(bal-x.cost)}</span></div>
    <div style="display:flex;gap:8px"><button data-x="buyno" class="pz-ghost" style="flex:1;min-height:52px">Cancelar</button><button data-x="buyok" class="pz-gold" style="flex:1.4;min-height:52px"><span style="position:relative;z-index:1">Pagar ${evtN(x.cost)}</span></button></div></div></div>`; }

/* botão fixo do rodapé: a ação depende da aba (igual ao protótipo, trocando o que ainda não existe pelas missões) */
function evtFoot(M){ const c=M.cur, b=M.bs;
  if(XEVT.tab===1&&b){ const max=b.max||0;
    if(!c.live||!b.open) return {a:'attack',cls:'off',lbl:'O chefe aparece com o evento ativo'};
    if(b.killed) return {a:'attack',cls:'off',lbl:'Chefe derrotado!'};
    if(b.attemptsLeft<=0) return {a:'attack',cls:'off',lbl:'Volte amanhã'};
    return {a:'attack',cls:'pulse',lbl:'Atacar · '+b.attemptsLeft+'/'+max}; }
  if(XEVT.tab===0&&M.tr&&c.live&&M.tr.ready>0) return {a:'trall',cls:'pulse',lbl:'Resgatar trilha · '+M.tr.ready+(M.tr.ready>1?' prêmios':' prêmio')};
  if(XEVT.tab===2&&M.vit&&M.vit.canBuy) return {a:'buy',id:M.vit.id,cls:'pulse',lbl:'Comprar '+evtSkinName(M.vit)+' · '+evtN(M.vit.cost)};
  if(M.readySum>0) return {a:'misall',cls:'pulse',lbl:'Resgatar missões · +'+evtN(M.readySum)+' pts'};
  if(XEVT.tab===2&&c.live) return {a:'misopen',cls:'',lbl:'Ganhar mais pontos'};
  return {a:'misopen',cls:'',lbl:'Ver missões do evento'}; }

function scrEvents(){
  evtInject(); const d=xDims(EVT_MINH);
  if(!evtOk()){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-weight:800;color:#c9b9a2">Eventos indisponíveis agora.</div>`); XEVT.sig='x'; return; }
  const M=evtModel();
  if(!M.cur){ V.innerHTML=xWrap(d,XEVT.anim?'f-in':'',`<div class="pz" style="align-items:center;justify-content:center;gap:10px;padding:24px;text-align:center"><img src="assets/icons/menu/events.png" alt="" style="width:96px;height:96px;object-fit:contain"><span class="pz-lil" style="font-size:22px">Nenhum evento agora</span><span class="pz-note" style="font-size:14px">O próximo evento aparece aqui quando for anunciado.</span></div>`); XEVT.anim=false; XEVT.sig=evtSig(M); return; }
  const c=M.cur, th=evtTh(c.ev.id), tag={on:'ATIVO',gr:'CARÊNCIA',soon:'EM BREVE'};
  if(!c.live&&XEVT.buy) XEVT.buy=null;
  const evs=`<div class="pz-evs" role="tablist" aria-label="Eventos">${M.evs.map((x,i)=>`<button data-x="ev" data-id="${evtEsc(x.ev.id)}" class="pz-ev pz-inR" role="tab" aria-selected="${x===c}" aria-label="${evtEsc(x.ev.name)}, ${tag[x.st].toLowerCase()}" style="animation-delay:${i*.06}s"><img src="assets/icons/menu/events.png" alt=""><span style="min-width:0;display:flex;flex-direction:column;gap:2px;line-height:1.1"><span style="font-size:12.5px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${evtEsc(x.ev.name)}</span><span><span class="pz-tag ${x.st}">${tag[x.st]}</span></span></span></button>`).join('')}</div>`;
  const nReady=M.ready.length;
  const pts=`<div class="pz-pts" style="--t1:${th.t1};--ta:${th.a}"><div class="pz-pbox" role="group" aria-label="${evtEsc(c.ev.points||'Pontos do evento')}: ${c.pts}">${evtTok(th.tok)}<span style="display:flex;flex-direction:column;line-height:1.05;min-width:0"><small style="font-size:10.5px;font-weight:800;color:#e8dccb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Saldo</small><b class="pz-lil pz-ol" style="font-size:22px;color:#ffe07a">${evtN(c.pts)}</b></span>${M.tr?`<span style="width:1px;align-self:stretch;background:rgba(255,236,200,.18)"></span><span style="display:flex;flex-direction:column;line-height:1.05;min-width:0"><small style="font-size:10.5px;font-weight:800;color:#e8dccb;white-space:nowrap">Ganhos</small><b class="pz-lil pz-ol" style="font-size:22px;color:#fff">${evtN(M.tr.earned)}</b></span>`:''}</div>
    <button data-x="misopen" class="pz-mbtn${M.readySum>0?' go':''}" aria-label="Abrir missões do evento${nReady?', '+nReady+' prontas':''}"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6 H20 M9 12 H20 M9 18 H20"></path><polyline points="3 6 4.5 7.5 7 5"></polyline><polyline points="3 12 4.5 13.5 7 11"></polyline><polyline points="3 18 4.5 19.5 7 17"></polyline></svg>Missões${nReady?`<span class="pz-dot" style="top:-6px;right:-6px">${nReady}</span>`:''}</button></div>`;
  const vDot=M.vit&&M.vit.canBuy?1:0;
  const tabs=`<div class="pz-tabs" role="tablist" aria-label="Seções do evento">${[['Trilha',0,M.tr&&c.live?M.tr.ready:0,M.tr?0:1],['Chefe',1,M.bs&&c.live&&M.bs.open&&!M.bs.killed?M.bs.attemptsLeft:0,M.bs?0:1],['Loja',2,vDot,0]].map(t=>`<button data-x="tab" data-i="${t[1]}" class="pz-tab" role="tab" aria-selected="${XEVT.tab===t[1]}">${t[0]}${t[3]?'<span class="pz-soon">em breve</span>':''}${t[2]?`<span class="pz-dot">${t[2]}</span>`:''}</button>`).join('')}</div>`;
  const body=XEVT.tab===0?evtTrail(M,th):XEVT.tab===1?evtBoss(M,th):evtShop(M,th);
  const F=evtFoot(M);
  V.innerHTML=xWrap(d,XEVT.anim?'f-in':'',`<div class="pz"><div id="pz_scroll" class="x-scroll" style="flex:1;min-height:0;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding:8px 12px 6px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 18%,#2e2040 0%,#1d1611 45%,#16110d 80%)">
    ${evs}${evtBanner(M,th)}${pts}${tabs}${body}<div style="flex:none;height:2px"></div></div>
    <div style="flex:none;padding:8px 12px;padding-bottom:max(12px,env(safe-area-inset-bottom));box-sizing:border-box"><button data-x="foot" data-a="${F.a}"${F.id?` data-id="${evtEsc(F.id)}"`:''} class="pz-gold ${F.cls}" aria-label="${evtEsc(F.lbl)}"><span style="position:relative;z-index:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${evtEsc(F.lbl)}</span></button></div>
    ${XEVT.mis?evtMisSheet(M,th):''}${XEVT.buy?evtBuySheet(M):''}</div>`);
  XEVT.anim=false; XEVT.sig=evtSig(M);
}

/* ---------- ações (só pelo Sys.events) ---------- */
const EVT_WHY={desligado:'Os eventos abrem em breve',evento:'Evento indisponível',fechado:'Este evento já fechou',id:'Item indisponível',incompleto:'Missão ainda não concluída',resgatado:'Missão já resgatada',limite:'Limite do evento atingido',loot:'Loja indisponível agora'};
const EVT_MAT={essence:'essência',forge:'pedras de forja',food:'rações'};
/* resumo do que o Sys.loot.grantBundle entregou (inclui o que ficou guardado por nível) */
function evtGot(g){ if(!g) return ''; const a=[]; if(g.skin) a.push('skin nova'); if(g.gold) a.push(evtN(g.gold)+' moedas'); for(const k in EVT_MAT) if(g[k]) a.push(g[k]+' '+EVT_MAT[k]);
  if(g.items&&g.items.length) a.push(g.items.length+(g.items.length>1?' itens':' item')); if(g.petFrags){ let n=0; for(const k in g.petFrags) n+=(+g.petFrags[k]||0); if(n) a.push(n+' fragmentos'); }
  const held=(g.heldItems||[]).length; if(held) a.push(held+' guardado'+(held>1?'s':'')+' até o nível certo'); return a.join(' · '); }
function evtClaim(M,ids){ const host=evtHost(); let pts=0, prism=0, n=0, why='';
  for(const id of ids){ let r=null; try{ r=Sys.events.claimMission(S,host,M.cur.ev.id,id); }catch(e){ r=null; } if(r&&r.ok){ n++; pts+=r.pts|0; prism+=r.prism|0; } else if(r&&!why) why=EVT_WHY[r.reason]||''; }
  if(n){ evtSnd('claim'); evtChanged(); evtToast('+'+evtN(pts)+' '+(M.cur.ev.points||'pontos')+(prism?' · +'+prism+' fragmentos do Prismático':'')); }
  else { evtSnd('ui_tap'); if(why) evtToast(why); }
  return n; }
function evtTryBuy(M,id){ const x=M.shop.find(y=>y.id===id); if(!x) return;
  if(!M.shopOpen){ evtSnd('ui_tap'); evtToast('A loja abre junto com o evento'); return; }
  if(x.bought>=x.limit){ evtSnd('ui_tap'); evtToast('Limite do evento atingido'); return; }
  if(M.cur.pts<x.cost){ evtSnd('ui_tap'); evtToast('Faltam '+evtN(x.cost-M.cur.pts)+' pontos. Faça as missões do evento'); return; }
  evtSnd('ui_tap'); XEVT.buy=id; render(); }
/* ---------- trilha e chefe (só pelo Sys.evtrail) ---------- */
const ET_WHY={off:'A trilha chega em breve',id:'Marco indisponível',done:'Prêmio já resgatado',closed:'O evento já fechou',tries:'Volte amanhã',dead:'Chefe derrotado!'};
const etGotTxt=g=>{ const t=evtGot(g); return (g&&g.frame?(t?t+' · ':'')+'moldura do evento':t); };
function etNode(M,at){ const T=M.tr; if(!T) return; const m=T.milestones.find(x=>x.at===at); if(!m) return;
  if(!M.cur.live){ evtSnd('ui_tap'); evtToast(m.name+' · '+evtN(m.at)+' pts (prévia)'); return; }
  if(m.claimed){ evtSnd('ui_tap'); evtToast(m.name+': já resgatado'); return; }
  if(!m.reached){ evtSnd('ui_tap'); evtToast(m.name+': faltam '+evtN(m.at-T.earned)+' pontos'); return; }
  let r=null; try{ r=Sys.evtrail.claimTrail(S,evtHost(),M.cur.ev.id,m.at); }catch(e){ r=null; }
  if(r&&r.ok){ const g=etGotTxt(r.got); evtSnd(m.reward&&m.reward.frame?'legendary':'claim'); evtChanged(); evtToast(m.name+' foi para a sua mochila'+(g?' · '+g:'')); }
  else { evtSnd('ui_tap'); evtToast(r&&r.reason==='points'?m.name+': faltam '+evtN(m.at-T.earned)+' pontos':(r&&ET_WHY[r.reason])||'Resgate indisponível agora'); }
  render(); }
function etClaimAll(M){ const T=M.tr; if(!T||!M.cur.live) return; let n=0, big=false, why='';
  for(const m of T.milestones){ if(!m.reached||m.claimed) continue; let r=null; try{ r=Sys.evtrail.claimTrail(S,evtHost(),M.cur.ev.id,m.at); }catch(e){ r=null; }
    if(r&&r.ok){ n++; if(m.reward&&m.reward.frame) big=true; } else if(r&&!why) why=ET_WHY[r.reason]||''; }
  if(n){ evtSnd(big?'legendary':'claim'); evtChanged(); evtToast(n+(n>1?' prêmios da trilha resgatados':' prêmio da trilha resgatado')); } else { evtSnd('ui_tap'); if(why) evtToast(why); }
  render(); }
function etAttack(M){ const b=M.bs; if(!b) return;
  if(!M.cur.live||!b.open){ evtSnd('ui_tap'); evtToast('O chefe aparece com o evento ativo'); return; }
  let r=null; try{ r=Sys.evtrail.attack(S,evtHost(),M.cur.ev.id); }catch(e){ r=null; }
  if(!r||!r.ok){ evtSnd('ui_tap'); evtToast((r&&r.reason==='closed'?'O chefe aparece com o evento ativo':r&&ET_WHY[r.reason])||'Ataque indisponível agora'); render(); return; }
  evtSnd('hit'); evtChanged(); XEVT.hit={ev:M.cur.ev.id,dmg:r.dmg,pts:r.pts,killed:!!r.killed,t:Date.now()};
  evtToast('Dano '+evtAbbr(r.dmg)+' · +'+evtN(r.pts)+' pontos do evento'+(r.killed?' · Chefe derrotado!':''));
  if(XEVT.hitT) clearTimeout(XEVT.hitT);
  XEVT.hitT=setTimeout(()=>{ XEVT.hitT=null; try{ if(window.Panels&&Panels.cur&&Panels.cur()===Panels.defs.events) render(); }catch(e){} },1450);
  render(); }
/* mantém a rolagem depois de atacar/resgatar (o render troca o conteúdo e voltava ao topo); troca de aba/evento continua no topo */
function evtClick(b){ const a=b&&b.dataset&&b.dataset.x, keep=a&&a!=='tab'&&a!=='ev'; let sc=null, top=0; try{ sc=V.querySelector('.x-scroll'); top=sc?sc.scrollTop:0; }catch(e){}
  const r=evtClick0(b); if(keep){ try{ const s2=V.querySelector('.x-scroll'); if(s2) s2.scrollTop=top; }catch(e){} } return r; }
function evtClick0(b){
  const a=b.dataset.x; if(!evtOk()) return; const M=evtModel(); if(!M.cur) return;
  if(a==='ev'){ const id=b.dataset.id; if(id&&id!==XEVT.ev){ evtSnd('ui_tap'); XEVT.ev=id; XEVT.mPage=0; XEVT.sPage=0; XEVT.buy=null; XEVT.mis=false; render(); } return; }
  if(a==='tab'){ const i=parseInt(b.dataset.i,10); if(i>=0&&i<=2&&i!==XEVT.tab){ evtSnd('ui_tap'); XEVT.tab=i; render(); } return; }
  if(a==='misopen'){ evtSnd('ui_tap'); XEVT.mis=true; XEVT.mPage=0; render(); return; }
  if(a==='misclose'){ evtSnd('ui_tap'); XEVT.mis=false; render(); return; }
  if(a==='mpg'||a==='spg'){ const k=a==='mpg'?'mPage':'sPage'; XEVT[k]=Math.max(0,XEVT[k]+(parseInt(b.dataset.d,10)||0)); evtSnd('ui_tap'); render(); return; }
  if(a==='claim'){ const m=M.mis.find(x=>x.id===b.dataset.id); if(!m) return;
    if(!M.canMis){ evtSnd('ui_tap'); evtToast(M.cur.st==='soon'?'As missões abrem quando o evento começar':'Este evento já fechou'); return; }
    if(m.claimed){ evtSnd('ui_tap'); evtToast('Missão já resgatada'); return; }
    if(!m.done){ evtSnd('ui_tap'); evtToast('Faltam '+evtN(m.need-m.p)+' para concluir'); return; }
    evtClaim(M,[m.id]); render(); return; }
  if(a==='misall'||(a==='foot'&&b.dataset.a==='misall')){ if(!M.ready.length){ evtSnd('ui_tap'); return; } evtClaim(M,M.ready.map(m=>m.id)); XEVT.mis=false; render(); return; }
  if(a==='node'){ etNode(M,parseInt(b.dataset.at,10)); return; }
  if(a==='foot'&&b.dataset.a==='trall'){ etClaimAll(M); return; }
  if(a==='foot'&&b.dataset.a==='attack'){ etAttack(M); return; }
  if(a==='foot'){ if(b.dataset.a==='buy') evtTryBuy(M,b.dataset.id); else { evtSnd('ui_tap'); XEVT.mis=true; XEVT.mPage=0; render(); } return; }
  if(a==='buy'){ evtTryBuy(M,b.dataset.id); return; }
  if(a==='buyno'){ evtSnd('ui_tap'); XEVT.buy=null; render(); return; }
  if(a==='buyok'){ const id=XEVT.buy; XEVT.buy=null; if(!id){ render(); return; } let r=null; try{ r=Sys.events.buy(S,evtHost(),M.cur.ev.id,id); }catch(e){ r=null; }
    if(r&&r.ok){ const x=M.shop.find(y=>y.id===id), nm=x?(x.reward&&x.reward.skin?evtSkinName(x):x.txt):'Item', got=evtGot(r.got);
      evtSnd(x&&x.reward&&x.reward.skin?'legendary':'coin'); evtChanged(); evtToast(nm+' foi para a sua mochila'+(got?' · '+got:'')); }
    else { evtSnd('ui_tap'); evtToast(r&&r.reason==='pontos'?'Pontos insuficientes':(r&&EVT_WHY[r.reason])||'Compra indisponível agora'); }
    render(); return; }
}

Panels.add('events',{title:'Eventos',render:scrEvents,click:evtClick,
  tick(){ if(!evtOk()) return; try{ const M=evtModel(); if(evtSig(M)!==XEVT.sig){ render(); return; }
      if(M.cur&&M.cur.endsAt){ const k=evtClock(M.cur.endsAt-evtNow()); if(k.sec!==XEVT.sec){ XEVT.sec=k.sec; const el=document.getElementById('pz_sec'); if(el) el.textContent=k.sec; }
        if(k.head!==XEVT.hd){ XEVT.hd=k.head; const eh=document.getElementById('pz_hd'); if(eh) eh.textContent=k.head; } } }catch(e){} },
  busy(){ return false; },
  onOpen(o){ etStop(); XEVT.tab=etOn()?0:2; XEVT.mPage=0; XEVT.sPage=0; XEVT.mis=false; XEVT.buy=null; XEVT.hit=null; XEVT.mkEv=null; XEVT.anim=true;
    if(o&&o.event) XEVT.ev=o.event; if(o&&o.missions) XEVT.mis=true; if(o&&(o.tab===0||o.tab===1||o.tab===2)) XEVT.tab=o.tab; },
  onClose(){ etStop(); XEVT.mis=false; XEVT.buy=null; XEVT.hit=null; } });
