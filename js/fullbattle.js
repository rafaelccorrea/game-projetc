'use strict';
/* ================= TELA 04b BATALHA EM TELA CHEIA (aprovada pelo dono) — ÚNICO LAYOUT DA BATALHA desde a v0.12.2 =================
   Chave DESLIGADA por padrão: com ela desligada este arquivo não faz nada. Para conferir: ?debug=1&fb=1.
   Fonte: docs/proto/BatalhaTelaCheia.dc.html. Sem barra de abas e sem faixa de topo: a cena ocupa a tela inteira (pés em y=640 de 844), e o HUD vira
   peças de vidro soltas, nas posições do protótipo (base de 390 px de largura, escalada pela largura real; o bloco de cima ancora no topo, o de baixo no
   fundo da tela). Ícones ilustrados aprovados: assets/icons/menu/*.png.
   v0.12.2: o HUD antigo (#hud, #ftop, #colL, #colR, #hpe, #skills, #tabs) foi APAGADO do index.html; este é o único HUD da batalha.
   Telas: Equip., Invocar, Loja, Passe e Missões abrem por Screens.open/setView dentro de uma FOLHA que sobe de baixo (718 px, com título e X), com o
   jogo seguindo atrás. Ícone de tela ainda não feita ou reprovada (Instâncias, Torre, Ranking, VIP, Pets, Forja, Correio, Eventos) mostra "Em breve". */
const FB_SHEET_H = 718, FB_HEAD = 62, FB_TUT_SHOW = 6;
/* abreviação oficial curta de cada era, usada só quando o nome inteiro não cabe na faixa da fase (o número da fase nunca é cortado) */
const FB_ERA_SHORT = ['Pré-Hist.', 'Antiguid.', 'Medieval', 'Pólvora', 'Industrial', 'Moderna', 'Futurista'];
const FB_TITLES = { gear: 'Equipamento', summon: 'Invocar', shop: 'Loja', pass: 'Passe', prog: 'Progresso' };
const FB_SOON = { inst: 'Instâncias', tower: 'Torre', rank: 'Ranking', vip: 'VIP', pets: 'Pets', forge: 'Forja', mail: 'Correio', events: 'Eventos' };
const FB_LOCK = '<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ffc94a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';

function fbCss(){ const st = document.createElement('style'); st.textContent = `
body.fb #stage{top:0;bottom:0}
body.fb #toast{top:calc(var(--fbsafe,0px) + 128px * var(--fbs,1));max-width:230px}   /* avisos (Drop: ...) SEMPRE abaixo do cabeçalho e da faixa da fase, contando o entalhe e a escala do HUD */
body.fb [data-x=close][aria-label="Fechar o Passe"]{display:none!important}   /* na folha o X é o da folha: o Passe não mostra o dele */
#fbhud{position:absolute;inset:0;z-index:30;pointer-events:none;overflow:hidden;font-family:Nunito,system-ui,sans-serif;color:#f6ecdf}
#fbhud .fbw{position:absolute;left:0;top:0;width:390px;transform-origin:0 0}
/* painel aberto por cima (tela cheia opaca): o HUD da batalha não aparece; some e as animações dele param */
body.fb.full #fbhud{visibility:hidden}body.fb.full #fbhud *,body.fb.full #fbhud *::after{animation-play-state:paused!important}
#fbhud .fbw>*{pointer-events:auto}
#fbhud #fb_menu{pointer-events:none}#fbhud #fb_menu>*{pointer-events:auto}
.fb-it.big{width:66px;height:70px;gap:3px}.fb-it.big .fb-ib{width:54px;height:54px}.fb-it.big .fb-ico{width:48px;height:48px}.fb-it.big .fb-lb{font-size:11.5px;line-height:13px}
.fb-mbtn{position:absolute;right:8px;top:58px;width:64px;height:70px;padding:0;border:0;background:none;display:flex;flex-direction:column;align-items:center;gap:3px;color:#ffe2a8;z-index:56}
.fb-mbtn .fb-ib{width:52px;height:52px;border-radius:16px}.fb-mbtn:active .fb-ib{transform:scale(.9)}
.fb-mgrid{display:grid;grid-template-columns:repeat(2,9px);gap:4px}.fb-mgrid i{display:block;width:9px;height:9px;border-radius:3px;background:linear-gradient(180deg,#ffe07a,#f2a826);box-shadow:0 1px 0 #8a4f0c;animation:fbmg 3.2s ease-in-out infinite}
.fb-mgrid i:nth-child(2){animation-delay:.2s}.fb-mgrid i:nth-child(3){animation-delay:.6s}.fb-mgrid i:nth-child(4){animation-delay:.4s}
@keyframes fbmg{0%,70%,100%{transform:scale(1)}80%{transform:scale(1.22)}}
.fb-mbtn .fb-mx{display:none}.fb-mbtn.open .fb-mx{display:block}.fb-mbtn.open .fb-mgrid{display:none}
#fbdrop{position:absolute;inset:0;z-index:55;pointer-events:auto}
.fb-mdim{position:absolute;inset:-400px;background:rgba(6,4,3,.58);animation:fbdim .2s ease-out both}
.fb-mpanel{position:absolute;right:10px;top:138px;width:calc(100% - 20px);max-width:370px;padding:12px 10px;border-radius:22px;background:linear-gradient(180deg,rgba(44,33,24,.98),rgba(24,18,13,.98));border:1px solid rgba(255,236,200,.22);box-shadow:0 18px 40px rgba(0,0,0,.6);box-sizing:border-box;transform-origin:calc(100% - 26px) 0;animation:fbmin .22s cubic-bezier(.2,.9,.25,1) both}
@keyframes fbmin{from{opacity:0;transform:translateY(-18px) scale(.9)}to{opacity:1;transform:none}}
.fb-mi{position:relative;height:76px;padding:0;border:0;border-radius:16px;background:rgba(255,236,200,.05);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;color:#ffe2a8;animation:fbmi .16s ease-out both;transition:background .12s}
.fb-mi:active{background:rgba(255,201,74,.16)}.fb-mi:active .fb-ib{transform:scale(.9)}.fb-mi .fb-ib{width:50px;height:50px}.fb-mi .fb-ico{width:42px;height:42px}
@keyframes fbmi{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
/* TUTORIAL na 04b: balão pequeno colado no alvo; some sozinho depois de alguns segundos (o anel continua) e nunca cobre a faixa da fase */
/* alvo de toque invisível >= 44 px (--fbt) onde o protótipo desenha menor: pílulas de moedas e gemas (38 de altura) e botão de música (38) */
.fb-pill,.fb-rb{position:relative}
.fb-pill::after{content:"";position:absolute;left:0;right:0;top:calc((38px - var(--fbt,44px))/2);bottom:calc((38px - var(--fbt,44px))/2)}
.fb-rb::after{content:"";position:absolute;inset:calc((38px - var(--fbt,44px))/2)}
body.fb #tut .tbub{max-width:180px;padding:7px 9px;font-size:12px;line-height:1.2;transition:opacity .3s}
body.fb #tut .tbub small{display:none}body.fb #tut .tbub .row{margin-top:6px}body.fb #tut .tbub .btn{min-height:44px!important;min-width:60px;font-size:12px!important;padding:0 10px}
body.fb #tut.fbq .tbub{opacity:0;pointer-events:none}
body.fb #tut .tring{box-shadow:0 0 0 3px #ffc94a,0 0 18px 6px rgba(255,201,74,.75)!important;background:none!important}   /* só o anel no alvo: sem escurecer a tela (a faixa da fase e o HUD continuam legíveis durante a luta) */
/* v0.12.2 (aprovado pelo dono): VIDA e ENERGIA sobre a cabeça do Kael. Sem sombra/blur animados: tremor = transform; brilho = opacidade de pseudo-elemento */
.fb-hpw{position:relative;flex:1;min-width:0}
.fb-hpw::after{content:"";position:absolute;inset:0;border-radius:5px;pointer-events:none;box-shadow:0 0 10px 2px var(--g,rgba(255,90,78,.85));opacity:0}
.fb-hpw.on::after{animation:fbop 1s ease-in-out infinite}
.fb-hps{animation:fbhps .4s linear both}
@keyframes fbhps{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,1px)}40%{transform:translate(3px,-1px)}60%{transform:translate(-2px,0)}80%{transform:translate(2px,0)}}
.fb-hpfl{animation:fbhpf .35s ease-out both}@keyframes fbhpf{0%{opacity:.9}100%{opacity:0}}
#fbhud button{font-family:inherit;cursor:pointer}
#fbhud .lil{font-family:'Lilita One',Nunito,sans-serif;font-weight:400}
#fbhud .shade{position:absolute;inset:0;pointer-events:none!important;background:linear-gradient(180deg,rgba(10,7,5,.5) 0%,rgba(10,7,5,0) 17%,rgba(10,7,5,0) 77%,rgba(10,7,5,.7) 100%)}
/* v0.12.2 (DESEMPENHO, medido no S24: 56 FPS contra 113 do layout antigo): SEM backdrop-filter em nada que fica sobre o canvas (cada quadro do canvas
   refazia o desfoque de todos os vidros). Vidro = fundo sólido semitransparente. Pulsos contínuos animam só OPACIDADE/TRANSFORM de um pseudo-elemento
   (composição na GPU), nunca box-shadow nem filter. */
.fb-gl{background:rgba(22,16,12,.74);border:1px solid rgba(255,236,200,.16);box-shadow:0 6px 16px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08)}
.fb-it{position:relative;width:62px;height:62px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:0;border:0;background:none;color:#ffe2a8}
.fb-ib{position:relative;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-sizing:border-box;transition:transform .12s}
.fb-ib::after{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:0 0 14px 2px rgba(255,201,74,.42);opacity:0;animation:fbop 3.4s ease-in-out infinite;animation-delay:inherit}
.fb-ib.fb-hot::after{box-shadow:0 0 18px 4px rgba(255,201,74,.85);animation-duration:1.6s}
@keyframes fbop{0%,100%{opacity:0}50%{opacity:1}}
.fb-it:active .fb-ib{transform:scale(.9)}
.fb-ico{width:44px;height:44px;object-fit:contain;display:block;pointer-events:none}
.fb-hot{border-color:rgba(255,201,74,.55)}
.fb-lb{font-size:10.5px;line-height:12px;font-weight:900;color:#fff;text-shadow:0 1px 2px #000,0 0 5px #000;white-space:nowrap}
.fb-bdg{position:absolute;top:-4px;right:-5px;min-width:19px;height:19px;padding:0 4px;box-sizing:border-box;border-radius:10px;background:#ff3b30;border:2px solid #1a110b;color:#fff;font-size:11px;font-weight:900;line-height:1;display:flex;align-items:center;justify-content:center;animation:fbbdg 1.8s ease-in-out infinite}
.fb-bdg:empty{display:none}
.fb-novo{position:absolute;left:50%;top:-9px;transform:translateX(-50%);height:15px;padding:0 6px;border-radius:8px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:9.5px;line-height:15px;font-weight:900;white-space:nowrap;border:1px solid #2a1403;animation:fbbdg 1s ease-in-out infinite;z-index:2}
.fb-tag{position:absolute;left:50%;top:-7px;transform:translateX(-50%);height:14px;padding:0 5px;border-radius:7px;background:#ffc94a;color:#2a1403;font-size:8.5px;line-height:14px;font-weight:900;white-space:nowrap;border:1px solid #2a1403}
@keyframes fbbdg{0%,80%,100%{transform:scale(1)}88%{transform:scale(1.25)}}
.fb-pill{height:38px;display:flex;align-items:center;gap:5px;padding:0 4px;border-radius:999px;color:#f6ecdf;box-sizing:border-box}
.fb-plus{width:24px;height:24px;border-radius:50%;background:linear-gradient(180deg,#7fe07a,#3fae3c);color:#0d2410;font-size:17px;font-weight:900;line-height:24px;text-align:center;box-shadow:0 2px 0 #1f6a1d}
.fb-rb{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#f6ecdf;padding:0;box-sizing:border-box}
.fb-eq{display:flex;gap:2px;align-items:flex-end;height:14px}.fb-eq i{width:3px;height:100%;background:#ffe2a8;border-radius:1px;animation:fbeqa .9s ease-in-out infinite;transform-origin:50% 100%}.fb-eq i:nth-child(2){animation-delay:.2s}.fb-eq i:nth-child(3){animation-delay:.4s}
@keyframes fbeqa{0%,100%{transform:scaleY(.3)}50%{transform:scaleY(1)}}
.fb-ring{animation:fbring 2.4s linear infinite}@keyframes fbring{0%,100%{opacity:1}50%{opacity:.65}}
.fb-ultr{animation:fbur 1.2s ease-in-out infinite}@keyframes fbur{0%,100%{box-shadow:0 0 10px rgba(208,123,255,.6),0 6px 16px rgba(0,0,0,.45)}50%{box-shadow:0 0 30px rgba(208,123,255,1),0 6px 16px rgba(0,0,0,.45)}}
.fb-finger{animation:fbtap 1s ease-in-out infinite}@keyframes fbtap{0%,100%{transform:rotate(180deg) translate(0,0)}50%{transform:rotate(180deg) translate(0,-5px) scale(.92)}}
.fb-cbump{animation:fbcb .35s ease-out}@keyframes fbcb{0%{transform:scale(1)}50%{transform:scale(1.18)}100%{transform:scale(1)}}
.fb-desglow::after{content:"";position:absolute;inset:-1px;border-radius:inherit;pointer-events:none;box-shadow:0 0 22px 5px rgba(255,201,74,1);opacity:0;animation:fbop 1.2s ease-in-out infinite}
/* folha que sobe de baixo: as telas cheias (Equip., Invocar, Loja, Passe, Progresso) abrem dentro dela */
#fbdim{display:none;position:absolute;inset:0;z-index:59;background:rgba(6,4,3,.62);animation:fbdim .25s ease-out both}
@keyframes fbdim{from{opacity:0}to{opacity:1}}
#fbsheet{display:none;position:absolute;left:0;right:0;top:var(--fbtop,126px);height:var(--fbhead,62px);z-index:61;border-radius:26px 26px 0 0;background:rgba(42,32,23,.98);border-top:1px solid rgba(255,236,200,.22);box-shadow:0 -12px 40px rgba(0,0,0,.55);box-sizing:border-box;padding:10px 18px 0;animation:fbup .32s cubic-bezier(.2,.9,.25,1) both;font-family:Nunito,system-ui,sans-serif}
#fbsheet .hd{display:block;margin:0 auto;width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,.22)}
#fbsheet .rw{display:flex;align-items:center;justify-content:space-between;margin-top:2px}
#fbsheet .tt{font-family:'Lilita One',Nunito,sans-serif;font-size:26px;color:#fff}
#fbsheet button{width:44px;height:44px;border-radius:50%;padding:0;color:#f6ecdf;display:flex;align-items:center;justify-content:center;cursor:pointer}
body.fb.full #fbdim,body.fb.full #fbsheet{display:block}
body.fb.full #view{top:calc(var(--fbtop,126px) + var(--fbhead,62px));bottom:0;z-index:61;animation:fbup .32s cubic-bezier(.2,.9,.25,1) both}
@keyframes fbup{from{transform:translateY(100%)}to{transform:translateY(0)}}
/* v0.12.1 (PO): PAINEL EM TELA CHEIA. Sem barra de baixo e sem a batalha aparecendo atrás: cabeçalho de 56 px (Voltar, título, moedas e gemas) logo
   abaixo do recorte da câmera, e o painel (#view) do cabeçalho até o fim da tela. Altura útil do painel = altura da tela - safe-area - 56 px. */
#fbdim{background:#16110d;animation:none}
#fbsheet{top:0;height:calc(var(--fbsafe,0px) + 56px);padding:var(--fbsafe,0px) 10px 0;border-radius:0;border-top:0;border-bottom:2px solid #4a3a2b;background:#1d1611;box-shadow:none;animation:fbfade .18s ease-out both}
#fbsheet .rw{height:56px;margin:0;gap:5px;justify-content:flex-start}
#fbsheet .tt{flex:1;min-width:0;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#fbsheet #fb_x{width:auto;min-width:44px;height:44px;padding:0 8px 0 3px;border-radius:14px;gap:2px;font:900 13px Nunito,system-ui,sans-serif}
#fbsheet .cur{display:flex;align-items:center;gap:2px;height:32px;padding:0 6px 0 3px;border-radius:999px;background:#0e0a07;border:1px solid #4a3a2b;color:#f6ecdf;font:900 13px Nunito,system-ui,sans-serif;flex:none}
#fbsheet .cur img{width:22px;height:22px;object-fit:contain}
body.fb.full #view{top:calc(var(--fbsafe,0px) + 56px);bottom:0;animation:fbfade .18s ease-out both}
@keyframes fbfade{from{opacity:0}to{opacity:1}}
`; document.head.appendChild(st); }

const FBK = {};   // último valor escrito em cada peça (só mexe no DOM quando muda)
function fbSet(id, v){ if (FBK[id] === v) return false; FBK[id] = v; const el = document.getElementById(id); if (el) el.textContent = v; return true; }
function fbSoon(k){ snd('ui_tap'); toast(k === 'auction' ? 'Leilão em breve: abre com o online' : (FB_SOON[k] || 'Esta tela') + ': em breve'); }
/* ÍCONES DE MENU: CAMADA SEPARADA, DIRIGIDA POR DADOS. A disposição vai mudar (V2 do canvas, em voto: melhor distribuídos + botão MENU com lista).
   Para trocar a disposição, mude SÓ esta tabela: id · icon (arquivo em assets/icons/menu, sem .png) · label · x, y (px na base de 390x844, canto do
   botão; y a partir do topo) · group (hoje só informativo: 'left' | 'right' | 'top'; a V2 usa para o botão MENU) · act (o que o toque faz: nome de tela
   para o Screens/fbAct, ou 'soon:<chave>' = "Em breve") · hot (pulso dourado) · badge (id do contador) · small (botão de 44 px, sem rótulo).
   POSIÇÕES PROVISÓRIAS = as do protótipo atual, menos Pets e Forja: o PO reservou a faixa direita x 300-390, y 400-650 (chefe e comuns, sem ícone por
   cima), então os dois foram para uma 2ª coluna à esquerda da coluna direita (x 263, y 150 e 212), sem capricho: a V2 troca a tabela. */
const FB_MENU = [   /* V2 APROVADA (docs/proto/BatalhaTelaCheiaV2.dc.html). x = distância da borda do lado (side); y a partir do topo; prio = ordem de permanência */
  { id: 'gear',   icon: 'equipment', label: 'Equip.',  side: 'left',  x: 4, y: 136, big: true, act: 'gear',   prio: 1 },
  { id: 'summon', icon: 'summon',    label: 'Invocar', side: 'left',  x: 4, y: 214, big: true, act: 'summon', prio: 2 },
  { id: 'shop',   icon: 'shop',      label: 'Loja',    side: 'left',  x: 4, y: 292, big: true, act: 'shop',   prio: 3 },
  { id: 'pass',   icon: 'pass',      label: 'Passe',   side: 'left',  x: 4, y: 370, big: true, act: 'pass',   prio: 4, hot: true, badge: 'fb_bp' },
  { id: 'chest',  icon: '',          label: 'Baú',     side: 'right', x: 7, y: 150, act: 'chest', prio: 5, chest: true, badge: 'fb_bc' },
  /* alerta "Evento" (prio 6, side right, y 220): só entra quando existir evento no jogo; hoje não há, então não é desenhado (Eventos fica no MENU, "Em breve") */
];
/* itens do botão MENU (drop down), na ordem do protótipo. act 'soon:<chave>' = tela ainda não aprovada/feita: mostra "Em breve" */
const FB_DROP = [
  { id: 'forge',    icon: 'forge',     label: 'Forja',      act: 'soon:forge' },
  { id: 'pets',     icon: 'pets',      label: 'Pets',       act: 'soon:pets' },
  { id: 'tower',    icon: 'tower',     label: 'Torre',      act: 'soon:tower' },
  { id: 'inst',     icon: 'instances', label: 'Instâncias', act: 'soon:inst' },
  { id: 'rank',     icon: 'ranking',   label: 'Ranking',    act: 'soon:rank' },
  { id: 'missions', icon: 'missions',  label: 'Missões',    act: 'missions', alerts: () => missionAlerts() },
  { id: 'vip',      icon: 'vip',       label: 'VIP',        act: 'soon:vip' },
  { id: 'mail',     icon: 'mail',      label: 'Correio',    act: 'soon:mail' },
  { id: 'events',   icon: 'events',    label: 'Eventos',    act: 'soon:events' },
  { id: 'cfg',      icon: 'settings',  label: 'Config.',    act: 'cfg' },
  /* LEILÃO (PO): pronto e DESLIGADO (on:false) até o agente B ver a tela rodando. Ícone provisório = o da Loja com um martelinho desenhado por código
     (hammer:true), até a arte chegar. tag = SELO de texto opcional do item (campo novo, vale para qualquer entrada). */
  { id: 'auction',  icon: 'shop',      label: 'Leilão',     act: 'soon:auction', tag: 'Em breve', hammer: true, on: false },
];
const FB_HAMMER = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="position:absolute;right:-3px;bottom:-3px;filter:drop-shadow(0 1px 1px #000)"><rect x="10" y="9" width="4" height="13" rx="1.5" fill="#8a5a2b" stroke="#2a1403" stroke-width="1" transform="rotate(-40 12 12)"/><rect x="3" y="3" width="13" height="7" rx="2" fill="#ffc94a" stroke="#2a1403" stroke-width="1.2" transform="rotate(-40 12 12)"/></svg>';
/* ============ LIBERAÇÃO POR NÍVEL (regra do dono, níveis confirmados pelo PO; reports/liberacao-por-nivel.md) ============
   Cada função fica OCULTA (nem cadeado) até o nível do jogador. Função sem tela pronta continua oculta mesmo passado o nível (nada de "Em breve").
   Ao liberar, o ícone aparece UMA vez com o selo "NOVO!" e um balão curto; um por vez, em fila; S.unl guarda o que já foi anunciado.
   Trocar o nível = trocar 1 número aqui. (O Sys.level.isUnlocked só conhece as chaves do módulo: practice, forge, instances, tower, arena, pet;
   as outras ainda não estão lá, por isso a tabela fica aqui e a conta usa Sys.level.level(S).) Sem entrada na tabela = desde o início. */
const FB_UNLOCK = { missions: 2, summon: 3, practice: 5, mail: 7, login: 7, profile: 10, shopgem: 10, forge: 12, inst: 14, tower: 15, pass: 18, pets: 20, events: 24, rank: 28, arena: 28, guild: 32, mount: 38, tourney: 40, auction: 45, wing: 50 };
const FB_UNLOCK_TXT = { missions: 'Missões diárias: metas do dia com prêmio', summon: 'Invocar: 1 item grátis por dia', pass: 'Passe da temporada: prêmios por jogar', forge: 'Forja: deixe seus itens mais fortes', inst: 'Instâncias: fases especiais com prêmio', tower: 'Torre: suba andares, ganhe prêmios', pets: 'Pets: um companheiro na batalha', mail: 'Correio: presentes e avisos', events: 'Eventos: missões por tempo limitado', rank: 'Ranking: veja os mais fortes' };
const fbLvl = () => { try { return Sys.level.level(S); } catch (e) { return 1; } };
/* SAVE ANTIGO NÃO PERDE ACESSO (PO, v0.12.4): quem já jogava antes da liberação por nível continua vendo o que já usava, em qualquer nível.
   Marcador no save: S.bornV ('old' = save anterior à regra; senão a versão em que o save nasceu). Lista herdada: S.unlKeep = {id:1}.
   Só jogador novo segue a tabela de níveis. Quem lê (agente B): fbUnl(id) já devolve verdadeiro para o que está em S.unlKeep. */
const FB_KEEP_OLD = ['missions', 'summon', 'practice', 'shopgem', 'pass'];
function fbLegacy(){ try { if (S.bornV === undefined) S.bornV = ((S.kills | 0) > 0 || (S.stage | 0) > 1 || fbLvl() > 1) ? 'old' : VERSION;
    if (S.bornV === 'old' && !S.unlKeep){ S.unlKeep = {}; if (!S.unl || typeof S.unl !== 'object') S.unl = {}; for (const id of FB_KEEP_OLD){ S.unlKeep[id] = 1; S.unl[id] = 1; } save(); } } catch (e) {} }
const fbLvU = id => { try { const u = Sys.level.unlockLevel(id); return u > 1 ? u : (FB_UNLOCK[id] || u || 1); } catch (e) { return FB_UNLOCK[id] || 1; } };   /* chave que o módulo não conhece devolve 1: aí vale a reserva (senão 'inst' e 'rank' liberariam no nível 1) */   // fonte única: Sys.level.DATA.unlock (fps-e2); FB_UNLOCK fica só de reserva
const fbUnl = id => (typeof OWNER_MODE !== 'undefined' && OWNER_MODE) || !!(S.unlKeep && S.unlKeep[id]) || !(FB_UNLOCK[id] && fbLvU(id) > fbLvl());   // MODO DONO (app de teste): tudo que tem tela aparece, sem regra de nível
const fbHasScreen = m => m.act.indexOf('soon:') !== 0 || !!(Screens.reg && Screens.reg[m.act.slice(5)] && !Screens.reg[m.act.slice(5)].broken);
const fbShown = m => m.on !== false && fbUnl(m.id) && fbHasScreen(m);
const FBN = { id: null, el: null, until: 0 };
function fbNovoTick(){ if (view !== 'battle' || B.paused || document.getElementById('fbdrop') || (typeof tutOn === 'function' && tutOn() && !(typeof tutWait !== 'undefined' && tutWait))) return; const now = Date.now(); if (FBN.until > now) return;
  if (FBN.id){ if (FBN.el){ const s = FBN.el.querySelector('.fb-novo'); if (s) s.remove(); } FBN.id = null; FBN.el = null; }
  if (!S.unl || typeof S.unl !== 'object') S.unl = {};
  for (const m of FB_MENU.concat(FB_DROP)){ if (!FB_UNLOCK[m.id] || S.unl[m.id] || !fbShown(m)) continue;
    S.unl[m.id] = 1; save(); const own = document.getElementById('fbm_' + m.id), el = (own && own.style.display !== 'none') ? own : document.getElementById('fb_mbtn'), ib = el && el.querySelector('.fb-ib');
    if (ib){ const s = document.createElement('span'); s.className = 'fb-novo'; s.textContent = 'NOVO!'; ib.appendChild(s); }
    toast(FB_UNLOCK_TXT[m.id] || (m.label + ' liberado')); snd('claim'); FBN.id = m.id; FBN.el = el; FBN.until = now + 4500; return; } }
const FB_BAND = 240;        // faixa livre de ícones: do chão até 240 px acima (base de 390), em x >= 300, RELATIVA à linha dos pés, em qualquer altura de tela
const FB_HIDDEN = {};       // ícones principais que não couberam nesta tela: vão para o MENU (nunca encolhem abaixo de 44 px)
const fbChestInner = '<img src="assets/ui/chest.png" alt="" style="width:32px;height:30px;object-fit:contain;margin-top:-6px"><span style="position:absolute;left:10px;right:10px;bottom:7px;height:4px;border-radius:2px;background:rgba(0,0,0,.65);overflow:hidden"><span id="fb_chp" style="display:block;width:0;height:100%;background:linear-gradient(90deg,#f2a826,#ffe07a);transition:width .4s"></span></span>';
function fbMenuHtml(){ return '<div id="fb_menu" style="position:absolute;left:0;top:0;right:0;height:0">' + FB_MENU.map((m, i) => { const d = (i * 0.4).toFixed(1);
    const inner = m.chest ? fbChestInner : `<img class="fb-ico" src="assets/icons/menu/${m.icon}.png" alt="">`;
    return `<button class="fb-it ${m.big ? 'big' : ''}" data-fb="${m.act}" id="fbm_${m.id}" aria-label="${m.label}" style="position:absolute;${m.side}:${m.x}px;top:${m.y}px"><span class="fb-ib fb-gl ${m.hot || m.chest ? 'fb-hot' : ''}" style="animation-delay:${d}s${m.chest ? ';overflow:visible' : ''}">${inner}${m.badge ? `<span class="fb-bdg" id="${m.badge}"></span>` : ''}</span><span class="fb-lb" id="fbl_${m.id}">${m.label}</span></button>`; }).join('') + '</div>'; }
/* botão MENU e o drop down (desce do canto superior direito; toque fora fecha) */
function fbMenuClose(){ const d = document.getElementById('fbdrop'); if (d) d.remove(); const b = document.getElementById('fb_mbtn'); if (b){ b.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); } FBK.mb = null; fbTick(); }
function fbMenuToggle(){ if (document.getElementById('fbdrop')){ fbMenuClose(); return; }
  const items = FB_DROP.filter(fbShown).concat(FB_MENU.filter(m => FB_HIDDEN[m.id] && fbUnl(m.id)).map(m => ({ id: m.id, icon: m.icon, label: m.label, act: m.act, chest: m.chest, alerts: m.id === 'pass' ? () => passAlerts() : m.chest ? () => { try { return Sys.chest.progress(S, Sys.host).stored; } catch (e) { return 0; } } : null })));
  const el = document.createElement('div'); el.id = 'fbdrop'; el.innerHTML = '<div class="fb-mdim" data-fb="menu"></div><div role="dialog" aria-modal="true" aria-label="Menu" class="fb-mpanel"><div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px 10px"><span class="lil" style="font-size:20px;color:#fff">Menu</span><span style="font-size:11px;font-weight:800;color:#c9b9a2">toque fora para fechar</span></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px 6px">'
    + items.map((m, i) => { const n = m.alerts ? m.alerts() : 0; return `<button class="fb-mi" data-fb="${m.act}" data-drop="1" aria-label="${m.label}" style="animation-delay:${(i * 0.02).toFixed(2)}s"><span class="fb-ib fb-gl" style="animation-delay:${(i * 0.2).toFixed(1)}s">${m.chest ? '<img src="assets/ui/chest.png" alt="" style="width:34px;height:32px;object-fit:contain">' : `<img class="fb-ico" src="assets/icons/menu/${m.icon}.png" alt="">`}${m.hammer ? FB_HAMMER : ''}${n ? `<span class="fb-bdg">${n}</span>` : ''}${m.tag ? `<span class="fb-tag">${m.tag}</span>` : ''}</span><span class="fb-lb">${m.label}</span></button>`; }).join('') + '</div></div>';
  document.getElementById('fb_w').appendChild(el); const b = document.getElementById('fb_mbtn'); b.classList.add('open'); b.setAttribute('aria-expanded', 'true'); FBK.mb = null; fbTick(); }
function fbBuild(){
  const app = document.getElementById('app'), el = document.createElement('div'); el.id = 'fbhud';
  const B0 = 844;   // posições "de baixo" do protótipo viram distância até o fundo da tela
  const bot = top => `top:calc(100% - ${B0 - top}px)`;
  el.innerHTML = `<div class="shade"></div><div class="fbw" id="fb_w">
  <button data-fb="gear" id="fb_av" aria-label="Kael: nível e força. Abrir Equipamento" style="position:absolute;left:6px;top:10px;width:68px;height:90px;padding:0;border:0;background:none;display:flex;flex-direction:column;align-items:center">
    <span id="fb_ring" style="position:relative;width:58px;height:58px;border-radius:50%;background:conic-gradient(#5ff0cf 0deg,rgba(255,255,255,.16) 0);display:block;box-shadow:0 4px 14px rgba(0,0,0,.45)">
      <span style="position:absolute;left:4px;top:4px;width:50px;height:50px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 50% 35%,#4a3a2b,#1d1611);display:block"><span class="kidle" id="fb_kid" style="position:absolute;left:-20px;top:-6px;width:90px;height:90px;display:block"></span></span>
      <span class="lil" id="fb_lv" style="position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);height:18px;padding:0 7px;border-radius:9px;background:linear-gradient(180deg,#ffe07a,#f2a826);color:#2a1403;font-size:12px;line-height:18px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.5)">Nv. 1</span></span>
    <span id="fb_fc" style="margin-top:12px;height:17px;padding:0 7px;border-radius:9px;background:rgba(22,16,12,.74);border:1px solid rgba(255,236,200,.16);font-size:11.5px;line-height:16px;font-weight:900;color:#fff;white-space:nowrap;box-sizing:border-box">FC 0</span></button>
  <div style="position:absolute;right:10px;top:12px;display:flex;align-items:center;gap:6px">
    <button data-fb="shopitem" class="fb-gl fb-pill" id="fb_goldp" aria-label="Moedas. Abrir a loja"><img src="assets/ui/coin.png" alt="" style="width:24px;height:24px;object-fit:contain"><span id="fb_gold" style="font-size:13.5px;font-weight:900">0</span><span class="fb-plus" aria-hidden="true">+</span></button>
    <button data-fb="shopgem" class="fb-gl fb-pill" id="fb_gemp" aria-label="Gemas. Comprar na loja"><img src="assets/ui/gem.png" alt="" style="width:22px;height:22px;object-fit:contain"><span id="fb_gems" style="font-size:13.5px;font-weight:900">0</span><span class="fb-plus" aria-hidden="true">+</span></button>
    <button data-fb="music" class="fb-gl fb-rb" id="fb_mus" aria-label="Música e som"></button>
</div>
  <button data-fb="menu" id="fb_mbtn" class="fb-mbtn" aria-label="Menu" aria-expanded="false" aria-haspopup="dialog"><span class="fb-ib fb-gl fb-hot" style="animation-delay:.2s"><span class="fb-mgrid" aria-hidden="true"><i></i><i></i><i></i><i></i></span><svg class="fb-mx" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f6ecdf" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"></path></svg><span class="fb-bdg" id="fb_bmenu"></span></span><span class="fb-lb">Menu</span></button>
  <div class="fb-gl" style="position:absolute;left:78px;right:74px;top:60px;height:58px;max-width:300px;margin:0 auto;border-radius:18px;display:flex;align-items:center;justify-content:space-between;gap:5px;padding:0 6px 0 10px;box-sizing:border-box">
    <div style="display:flex;flex-direction:column;gap:5px;min-width:0;flex:1"><span class="lil" style="display:flex;gap:4px;min-width:0;font-size:15px;line-height:1;color:#fff;text-shadow:0 2px 0 rgba(0,0,0,.6);white-space:nowrap"><span id="fb_stg" style="min-width:0;overflow:hidden;text-overflow:ellipsis;padding-bottom:2px;margin-bottom:-2px"></span><span id="fb_stgx" style="flex:none"></span></span>
      <div id="fb_wv" role="img" style="display:flex;gap:3px;align-items:center"></div></div>
    <button data-fb="boss" id="fb_boss" class="lil" aria-label="Desafiar o chefe" style="position:relative;flex:none;height:44px;padding:0 8px 0 2px;border-radius:14px;border:1px solid rgba(255,180,160,.6);background:linear-gradient(180deg,#ff6a50,#c0301f);color:#fff;font-size:13px;display:flex;align-items:center;gap:2px;box-shadow:0 4px 12px rgba(192,48,31,.5),inset 0 1px 0 rgba(255,255,255,.3);box-sizing:border-box"><img id="fb_bossi" alt="" style="width:30px;height:30px;object-fit:contain">Desafiar</button></div>
  ${fbMenuHtml()}
  <div id="fb_kb" style="position:absolute;left:44px;top:448px;width:128px;z-index:6;pointer-events:none"><div id="fb_kbi" style="display:flex;flex-direction:column;gap:3px">
    <div style="display:flex;align-items:center;gap:4px"><span id="fb_hpt" style="min-width:34px;font-size:11px;line-height:12px;font-weight:900;color:#eaffe4;text-align:right;text-shadow:0 1px 2px #000,0 0 4px #000;transition:color .3s"></span>
      <div class="fb-hpw" id="fb_hpw"><div role="img" aria-label="Vida do Kael" id="fb_hpbar" style="position:relative;height:10px;border-radius:5px;background:rgba(10,7,5,.72);border:1px solid rgba(255,236,200,.35);overflow:hidden;box-sizing:border-box">
        <div id="fb_hpl" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:rgba(255,240,220,.85);transition:width .5s ease-in .25s"></div>
        <div id="fb_hpb" style="position:absolute;left:0;top:0;bottom:0;width:100%;background:linear-gradient(180deg,#9cf08f,#3fae3c);transition:width .15s ease-out"></div>
        <div style="position:absolute;left:0;right:0;top:0;height:40%;background:rgba(255,255,255,.28)"></div>
        <div id="fb_hpf" style="position:absolute;inset:0;background:#fff;opacity:0"></div></div></div></div>
    <div style="display:flex;align-items:center;gap:4px"><span style="min-width:34px;display:flex;justify-content:flex-end"><svg width="10" height="10" viewBox="0 0 24 24" fill="#d07bff" stroke="none" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"></path></svg></span>
      <div class="fb-hpw" id="fb_enw" style="--g:rgba(208,123,255,1)"><div role="img" aria-label="Energia da ultimate" style="height:6px;border-radius:3px;background:rgba(10,7,5,.72);border:1px solid rgba(208,123,255,.45);overflow:hidden;box-sizing:border-box"><div id="fb_enb" style="width:0;height:100%;background:linear-gradient(90deg,#8a4dff,#d07bff);transition:width .6s"></div></div></div></div></div></div>
  <div style="position:absolute;left:10px;${bot(772)};transform:translateY(calc(44px - var(--fbt,44px)))">
    <div class="fb-gl" role="group" aria-label="Velocidade" id="fb_spd" style="height:calc(var(--fbt,44px) + 6px);border-radius:14px;padding:3px;box-sizing:border-box;display:flex;gap:2px"></div></div>
  <div style="position:absolute;right:73px;${bot(664)};width:48px;display:flex;flex-direction:column;align-items:center;gap:1px">
    <div role="img" aria-label="Ataque básico, automático" class="fb-gl" style="width:48px;height:48px;border-radius:50%;overflow:hidden;padding:0;box-sizing:border-box"><img id="fb_s1" alt="" style="width:100%;height:100%;object-fit:cover;display:block"></div><span class="fb-lb">Básico</span></div>
  <div style="position:absolute;right:122px;${bot(716)};width:64px;display:flex;flex-direction:column;align-items:center;gap:1px">
    <button data-fb="s2" id="fb_s2b" aria-label="Especial" style="position:relative;width:62px;height:62px;border-radius:50%;border:2px solid #4aa3ff;background:#1d1611;overflow:hidden;padding:0;box-shadow:0 6px 16px rgba(0,0,0,.45)"><img id="fb_s2" alt="" style="width:100%;height:100%;object-fit:cover;display:block"><span id="fb_s2c" style="position:absolute;left:0;right:0;bottom:0;height:0;background:rgba(0,0,0,.65)"></span><span class="lil" id="fb_s2t" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:20px;color:#fff;text-shadow:0 2px 0 #000"></span></button>
    <span class="fb-lb" id="fb_s2n"></span></div>
  <button data-fb="s3" id="fb_s3b" aria-label="Ultimate" style="position:absolute;right:16px;${bot(734)};width:88px;height:88px;border-radius:50%;border:3px solid #6a5a48;background:#1d1611;overflow:hidden;padding:0;box-shadow:0 6px 16px rgba(0,0,0,.45)"><img id="fb_s3" alt="" style="width:100%;height:100%;object-fit:cover;display:block"><span id="fb_s3c" style="position:absolute;left:0;right:0;bottom:0;height:100%;background:rgba(0,0,0,.6)"></span><span class="lil" id="fb_s3t" style="position:absolute;left:0;right:0;bottom:9px;text-align:center;font-size:13px;color:#fff;text-shadow:0 2px 0 #000"></span></button>
  <div id="fb_tip" style="display:none;position:absolute;right:6px;${bot(668)};width:66px;flex-direction:column;align-items:center;pointer-events:none"><span style="padding:4px 6px;border-radius:10px;background:#f6ecdf;color:#2a1403;font-size:10.5px;line-height:12px;font-weight:900;text-align:center;box-shadow:0 4px 10px rgba(0,0,0,.4)">Ultimate pronta!</span><svg class="fb-finger" width="26" height="26" viewBox="0 0 24 24" fill="#f6ecdf" stroke="#2a1403" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V10l5.2 1.1a2 2 0 0 1 1.6 2.3l-.8 5A3 3 0 0 1 15 21h-4.2a3 3 0 0 1-2.4-1.2L5 15.4a1.5 1.5 0 0 1 2.2-2L9 15z"></path></svg></div>
  </div>`;
  app.appendChild(el);
  const dim = document.createElement('div'); dim.id = 'fbdim'; dim.addEventListener('click', () => { snd('ui_tap'); Screens.close(); }); app.appendChild(dim);
  const sh = document.createElement('div'); sh.id = 'fbsheet'; sh.innerHTML = '<div class="rw"><button class="fb-gl" id="fb_x" aria-label="Voltar para a batalha"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>Voltar</button><span class="tt" id="fb_tt"></span><span class="cur"><img src="assets/ui/coin.png" alt="Moedas"><span id="fbp_gold"></span></span><span class="cur"><img src="assets/ui/gem.png" alt="Gemas"><span id="fbp_gems"></span></span></div>'; app.appendChild(sh);
  document.getElementById('fb_x').addEventListener('click', () => { snd('ui_tap'); Screens.close(); });
  el.addEventListener('click', ev => { const b = ev.target.closest('[data-fb]'); if (b) fbAct(b.dataset.fb, b); });
  /* habilidades respondem no toque (pointerdown), como os botões antigos */
  /* SÓ AUTOMÁTICO (ordem do dono): os botões de habilidade são indicadores de recarga e energia; o toque só lembra que disparam sozinhos */
  el.addEventListener('pointerdown', ev => { const b = ev.target.closest('[data-fb=s2],[data-fb=s3]'); if (!b) return; ev.preventDefault(); toast(b.dataset.fb === 's2' ? 'O especial dispara sozinho quando recarrega' : 'A ultimate dispara sozinha quando a energia enche'); });
}
function fbAct(a, b){
  if (a === 's2' || a === 's3') return;
  if (a === 'menu'){ snd('ui_tap'); fbMenuToggle(); return; }
  if (b && b.dataset && b.dataset.drop) fbMenuClose();
  if (a.indexOf('soon:') === 0){ const k = a.slice(5); if (Screens.reg && Screens.reg[k]){ snd('ui_tap'); Screens.open(k); return; } fbSoon(k); return; }   // tela registrada (Screens.register) abre; sem registro, "Em breve"
  snd('ui_tap');
  if (a === 'gear' || a === 'summon' || a === 'shop') setView(a);
  else if (a === 'shopitem'){ if (typeof XH !== 'undefined') XH.tab = 'item'; setView('shop'); }
  else if (a === 'shopgem'){ if (!fbUnl('shopgem')){ toast('Loja de gemas: libera no nível ' + FB_UNLOCK.shopgem); return; } if (typeof XH !== 'undefined') XH.tab = 'gem'; setView('shop'); }
  else if (a === 'missions') Screens.open('pass', { tab: 'missions' });
  else if (a === 'pass') Screens.open('pass', { tab: 'rewards' });
  else if (a === 'cfg') openSettings(false);
  else if (a === 'music'){ toggleSound(); toast(S.set.sound ? 'Som ligado' : 'Som desligado'); }
  else if (a === 'boss') bossTap();          // mesma regra do botão antigo (brilho, FC que falta, 2º toque)

  else if (a.indexOf('spd') === 0){ const n = +a.slice(3); if (canSpeed(n)){ B.speed = n; S.set.spd = n; save(); syncSpeed(); } else { let tx = ''; try { const m = Sys.vip.maxSpeed(S, Sys.host).speeds.find(x => x.speed === n); tx = m && m.text; } catch (e) {} toast(tx || ('x' + n + ' bloqueada')); } fbTick(); }
  else if (a === 'chest'){ const p = Sys.chest.progress(S, Sys.host);
    if (!p.stored){ toast(p.capped ? 'Baú: limite de ' + p.cap + ' por dia atingido. Volte amanhã!' : 'Baú: ' + Math.floor(p.charge) + '/' + p.need + ' abates'); return; }
    const res = Sys.chest.open(S, Sys.host); snd('claim'); Sys.host.onChange(); if (res) Sys.chest.showOpen(document.getElementById('app'), res, S, Sys.host, () => fbTick()); fbTick(); }
}
/* destino do voo dos pickups (moeda, gema, XP, item) no HUD novo */
function fbTarget(to){ return document.getElementById(to === 'gold' ? 'fb_goldp' : to === 'gems' ? 'fb_gemp' : to === 'level' ? 'fb_ring' : 'fbm_gear'); }
/* RESPONSIVO (decisão do PO): a base é 390 px de largura; a escala é a da largura, mas nunca maior que a da altura (tablet: o HUD não estoura).
   Ícone NUNCA encolhe: o que não cabe vai para o MENU, do menos prioritário para o mais (evento, baú, Passe, Loja, Invocar, Equip.). A faixa livre
   (x >= 300, do chão até FB_BAND px acima) é relativa à linha dos pés. O topo respeita o recorte da câmera (safe-area). */
function fbSafeTop(){ let el = document.getElementById('fb_safe'); if (!el){ el = document.createElement('div'); el.id = 'fb_safe'; el.style.cssText = 'position:absolute;left:0;top:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'; document.getElementById('app').appendChild(el); } return el.offsetHeight || 0; }
function fbLayout(){ const app = document.getElementById('app'), w = document.getElementById('fb_w'); if (!w) return; const W = app.clientWidth, H = app.clientHeight, st = fbSafeTop();
  const s = Math.min(W / 390, Math.max(1, H / 844)), Hb = (H - st) / s;
  app.style.setProperty('--fbsafe', st + 'px'); document.documentElement.style.setProperty('--fbsafe', st + 'px'); document.documentElement.style.setProperty('--fbs', s.toFixed(4));   // o #toast fica fora do #app
  w.style.transform = `scale(${s.toFixed(4)})`; w.style.top = st + 'px'; w.style.width = (W / s).toFixed(1) + 'px'; w.style.height = Hb.toFixed(1) + 'px';
  /* alvo de toque nunca abaixo de 44 px na tela: em tela estreita (escala < 1) Desafiar e velocidade ganham altura na base */
  { const mh = (s < 1 ? 44 / s : 44).toFixed(1) + 'px'; app.style.setProperty('--fbt', mh); const e = document.getElementById('fb_boss'); if (e) e.style.height = mh; }
  /* barras do Kael: ancoradas na linha dos pés + altura do corpo PARADO (não seguem golpe nem dano). Protótipo: x 44, 34 px acima do topo da cabeça */
  { const kb = document.getElementById('fb_kb'), cvw = (typeof cv !== 'undefined' && cv.clientWidth) || W, k = cvw / LW / s; if (kb){ const top = (FIELD_FEET * H - st) / s - heroBodyH() * k - 34; let left = HX * k - 64;
      /* tela curta (360x640): a coluna esquerda de ícones (x 4-70) desce até a altura das barras; aí as barras começam depois da coluna, sem encostar no ícone */
      if (FB_MENU.some((m, i) => { if (m.side !== 'left' || !fbUnl(m.id)) return false; const y = 136 + 78 * FB_MENU.filter((q, j) => j < i && q.side === 'left' && fbUnl(q.id)).length; return y + (m.big ? 70 : 62) > top - 2 && y < top + 24; })) left = Math.max(left, 74);
      kb.style.left = left.toFixed(1) + 'px'; kb.style.top = top.toFixed(1) + 'px'; } }
  const feet = (FIELD_FEET * H - st) / s, bandTop = feet - FB_BAND, bottomLim = Hb - 182 - 6; let changed = false;
  { let li = 0; FB_MENU.forEach(m => { m.cy = m.y; if (m.side === 'left' && fbUnl(m.id)){ m.cy = 136 + 78 * li; li++; } }); }   // coluna esquerda: só os liberados, de cima para baixo, sem buraco
  FB_MENU.forEach(m => { const b = document.getElementById('fbm_' + m.id); if (!b) return; if (!fbUnl(m.id)){ FB_HIDDEN[m.id] = false; b.style.display = 'none'; return; } b.style.top = m.cy + 'px'; const bot = m.cy + (m.big ? 70 : 62), lim = m.side === 'right' ? Math.min(bandTop, bottomLim) : bottomLim, hide = bot > lim;
    if (!!FB_HIDDEN[m.id] !== hide) changed = true; FB_HIDDEN[m.id] = hide; b.style.display = hide ? 'none' : ''; });
  if (changed && document.getElementById('fbdrop')) fbMenuClose();
  app.style.setProperty('--fbtop', Math.max(0, H - FB_SHEET_H * Math.min(s, H / 844 > 1 ? s : s)).toFixed(0) + 'px'); app.style.setProperty('--fbhead', (FB_HEAD * Math.min(1.2, s)).toFixed(0) + 'px'); }
function fbTick(){
  if (!document.getElementById('fbhud')) return; const f = typeof gNum === 'function' ? gNum : fmt, kf2 = typeof kf === 'function' ? kf : fmt;
  fbSet('fb_gold', kf2(S.gold)); fbSet('fb_gems', String(S.gems)); fbSet('fbp_gold', kf2(S.gold)); fbSet('fbp_gems', String(S.gems)); fbSet('fb_fc', 'FC ' + f(heroFC()));
  try { const h = Sys.level.hud(S), deg = Math.round((h.max ? 1 : h.frac) * 360); fbSet('fb_lv', h.text); if (FBK.ring !== deg){ FBK.ring = deg; document.getElementById('fb_ring').style.background = `conic-gradient(#5ff0cf ${deg}deg,rgba(255,255,255,.16) 0)`; } } catch (e) {}
  { const sk = SKIN(S.skinEq.armor), t = sk ? tierOf(sk.r) : 0, c = 'kidle' + (t ? ' t' + t : ''); if (FBK.kid !== c){ FBK.kid = c; document.getElementById('fb_kid').className = c; } }
  const e = eraOf(S.stage), inEra = ((S.stage - 1) % STAGES_PER_ERA) + 1; if (B.inst && typeof instHud === 'function'){ const ih = instHud(); fbSet('fb_stg', ih.name); fbSet('fb_stgx', ih.sub); }
    else if (B.inst && typeof instHud === 'function'){ const ih = instHud(); fbSet('fb_stg', ih.name); fbSet('fb_stgx', ih.sub); }
    else if (fbSet('fb_stg', ERAS[e].n)){ const el = document.getElementById('fb_stg'); if (el && el.scrollWidth > el.clientWidth + 1){ el.textContent = FB_ERA_SHORT[e] || ERAS[e].n; FBK.fb_stg = ERAS[e].n; } }   /* nome inteiro; só se não couber entra a abreviação oficial da tabela */ fbSet('fb_stgx', (e + 1) + '-' + inEra);   // era com reticências se faltar largura; o número da fase nunca é cortado
  { const NW = S.farm ? 4 : 5, tot = Math.max(1, B.waveN || 1), left = B.en.length + B.toSpawn.length, pc = Math.round(100 * Math.max(0, Math.min(1, (tot - left) / tot))), k = S.wave + '|' + NW + '|' + pc;
    if (FBK.wv !== k){ FBK.wv = k; let h = ''; for (let i = 1; i <= NW; i++){ const boss = i === 5, cur = i === S.wave;
        h += `<span class="${cur ? 'fb-ring' : ''}" style="width:14px;height:6px;border-radius:3px;background:${i < S.wave ? '#ffc94a' : cur ? `linear-gradient(90deg,${boss ? '#ff5a4e' : '#ffc94a'} ${pc}%,rgba(255,255,255,.25) ${pc}%)` : boss ? 'rgba(255,90,78,.55)' : 'rgba(255,255,255,.25)'}${boss ? ';box-shadow:0 0 0 1px #ff8a7a' : ''}"></span>`; }
      h += `<span style="font-size:10px;font-weight:900;color:#ffd0c8;margin-left:2px">${S.farm ? 'FARM ' : ''}${S.wave}/${NW}</span>`; const w = document.getElementById('fb_wv'); w.innerHTML = h; w.setAttribute('aria-label', 'Onda ' + S.wave + ' de ' + NW); } }
  { const inB = S.wave === 5, gl = !inB && heroFC() >= BOSS_GLOW_AT * recFC(S.stage), k = e + '|' + inB + '|' + gl; if (FBK.boss !== k){ FBK.boss = k; const b = document.getElementById('fb_boss'); document.getElementById('fb_bossi').src = 'assets/enemies/era' + e + '_boss.png';
      b.classList.toggle('fb-desglow', gl); b.style.filter = gl ? '' : 'grayscale(.75) brightness(.8)'; } }
  { const nm = missionAlerts(), np = passAlerts(); fbSet('fb_bm', nm ? String(nm) : ''); fbSet('fb_bp', np ? String(np) : ''); }
  try { const p = Sys.chest.progress(S, Sys.host), w = Math.round((p.stored ? 1 : p.pct) * 100); fbSet('fb_bc', p.stored ? String(p.stored) : ''); if (FBK.chp !== w){ FBK.chp = w; document.getElementById('fb_chp').style.width = w + '%'; } } catch (er) {}
  { const gp = fbUnl('shopgem') ? 1 : 0; if (FBK.gp !== gp){ FBK.gp = gp; const pl = document.querySelector('#fb_gemp .fb-plus'); if (pl) pl.style.display = gp ? '' : 'none'; } }   // o "+" das gemas só aparece quando a loja de gemas existe para o jogador
  { const k = S.set.sound ? 1 : 0; if (FBK.mus !== k){ FBK.mus = k; document.getElementById('fb_mus').innerHTML = k ? '<span class="fb-eq"><i></i><i></i><i></i></span>' : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>'; } }
  { const k = B.speed + '|' + [1, 2, 4].map(n => canSpeed(n) ? 1 : 0).join(''); if (FBK.spd !== k){ FBK.spd = k;
      document.getElementById('fb_spd').innerHTML = [1, 2, 4].map(n => { const ok = canSpeed(n), on = B.speed === n; return `<button data-fb="spd${n}" class="lil" aria-label="Velocidade x${n}${ok ? '' : ', bloqueada'}" aria-pressed="${on}" style="position:relative;width:var(--fbt,44px);height:var(--fbt,44px);border-radius:11px;border:0;padding:0;background:${on ? 'linear-gradient(180deg,#ffe07a,#f2a826)' : 'transparent'};color:${on ? '#2a1403' : ok ? '#f6ecdf' : '#9c8d7a'};font-size:14px;display:flex;align-items:center;justify-content:center">x${n}${ok ? '' : `<span style="position:absolute;right:1px;top:1px;width:14px;height:14px;border-radius:50%;background:#1a110b;display:flex;align-items:center;justify-content:center">${FB_LOCK}</span>`}</button>`; }).join(''); } }
  { let lab = 'Baú'; try { if (Sys.chest.progress(S, Sys.host).stored) lab = 'Baú cheio'; } catch (e) {} fbSet('fbl_chest', lab); }
  { let n = fbUnl('missions') ? missionAlerts() : 0; if (FB_HIDDEN.pass && fbUnl('pass')) n += passAlerts(); fbSet('fb_bmenu', n ? String(n) : ''); }
  { const lv = fbLvl() + '|' + Object.keys(Screens.reg || {}).length; if (FBK.unl !== lv){ FBK.unl = lv; fbLayout(); } fbNovoTick(); }   // subiu de nível (ou uma tela foi registrada): refaz o que aparece
  fbFast();
}
/* parte rápida (10x por segundo): vida, energia, recarga do especial e da ultimate */
function fbFast(){ const h = B.hero; if (!h || !document.getElementById('fbhud')) return; const f = typeof kf === 'function' ? kf : fmt;
  const hp = Math.max(0, Math.ceil(h.hp)), hr = Math.max(0, Math.min(1, h.hp / h.maxhp));
  if (fbSet('fb_hpt', f(hp))){ const w = (hr * 100).toFixed(1) + '%', fill = document.getElementById('fb_hpb'), tone = hr > 0.5 ? 0 : hr > 0.25 ? 1 : 2;
    fill.style.width = w; document.getElementById('fb_hpl').style.width = w;   // o rastro (fb_hpl) encolhe atrasado pela transição: mostra o pedaço perdido
    if (FBK.hpTone !== tone){ FBK.hpTone = tone; fill.style.background = ['linear-gradient(180deg,#9cf08f,#3fae3c)', 'linear-gradient(180deg,#ffe07a,#e0a020)', 'linear-gradient(180deg,#ff8a7a,#d0301f)'][tone];
      document.getElementById('fb_hpt').style.color = ['#eaffe4', '#ffe9a0', '#ffb3a8'][tone]; document.getElementById('fb_hpw').classList.toggle('on', tone === 2); }
    if (FBK.hpv != null && hp < FBK.hpv){ const k = document.getElementById('fb_kbi'), fl = document.getElementById('fb_hpf');   // tomou dano: treme e pisca
      k.classList.remove('fb-hps'); fl.classList.remove('fb-hpfl'); void k.offsetWidth; k.classList.add('fb-hps'); fl.classList.add('fb-hpfl'); }
    FBK.hpv = hp; }
  { const full = B.energy >= 100; if (FBK.enFull !== full){ FBK.enFull = full; document.getElementById('fb_enw').classList.toggle('on', full); } }
  const en = Math.floor(B.energy), rdy = B.energy >= 100; if (fbSet('fb_ent', rdy ? 'PRONTA' : en + '%')){ document.getElementById('fb_enb').style.width = Math.min(100, en) + '%'; document.getElementById('fb_s3c').style.height = (100 - Math.min(100, en)) + '%'; fbSet('fb_s3t', rdy ? 'PRONTA' : en + '%'); }
  if (FBK.rdy !== rdy){ FBK.rdy = rdy; const b = document.getElementById('fb_s3b'); b.classList.toggle('fb-ultr', rdy); b.style.borderColor = rdy ? '#d07bff' : '#6a5a48'; }
  { const E = wSkin().e; if (FBK.ske !== E){ FBK.ske = E; for (let n = 1; n <= 3; n++) document.getElementById('fb_s' + n).src = 'assets/icons/era' + E + '_s' + n + '.png'; fbSet('fb_s2n', SKN[E][0].split(' ').pop()); document.getElementById('fb_s2b').setAttribute('aria-label', SKN[E][0]); document.getElementById('fb_s3b').setAttribute('aria-label', 'Ultimate: ' + SKN[E][1]); } }
  { const p = Math.max(0, Math.ceil(B.cd2 / BAL.s2Cooldown * 20)); if (FBK.cd !== p){ FBK.cd = p; document.getElementById('fb_s2c').style.height = (p * 5) + '%'; document.getElementById('fb_s2b').style.boxShadow = '0 6px 16px rgba(0,0,0,.45),0 0 ' + (p ? 0 : 16) + 'px rgba(74,163,255,.8)'; } fbSet('fb_s2t', B.cd2 > 0 ? String(Math.ceil(B.cd2)) : ''); }
  { const tp = document.getElementById('fb_tip'); if (tp && FBK.tip !== 0){ FBK.tip = 0; tp.style.display = 'none'; } }   // só automático: a dica "toque na ultimate" saiu
  /* tutorial: o balão fica FB_TUT_SHOW s por passo; depois some (o anel fica). Passo só de leitura ("Entendi") avança sozinho. */
  if (typeof tutOn === 'function'){ const tu = document.getElementById('tut'); if (tu && tutOn() && !(typeof tutWait !== 'undefined' && tutWait)){ const st = TUT[S.tut], q = st ? st.sel() : '', k = S.tut + '|' + q;
      if (FBK.tut !== k){ FBK.tut = k; FBK.tutT = Date.now(); tu.classList.remove('fbq');
        /* o alvo é um ícone da batalha e há um painel aberto por cima: fecha o painel antes de apontar (senão o anel fica num canto vazio) */
        if (/^#fb/.test(q) && view !== 'battle') setTimeout(() => { if (view !== 'battle' && tutOn() && /^#fb/.test(TUT[S.tut] ? TUT[S.tut].sel() : '')) Screens.close(); }, 700); }
      else if (Date.now() - FBK.tutT > FB_TUT_SHOW * 1000 && !tu.classList.contains('fbq')){ const ok = document.getElementById('t_ok'); if (ok) ok.click(); else tu.classList.add('fbq'); }   // some em 6 s em TODOS os passos (o anel fica); passo de leitura (com Entendi) avança sozinho, senão ficaria preso com o botão escondido
      /* posição do balão na batalha: colado ACIMA do alvo e do lado dele (direita para os botões da direita), fora do painel de vida do herói (x 10-186) e das barras dos inimigos */
      const bub = tu.querySelector('.tbub'), el = q && q !== '#cv' ? document.querySelector(q) : null;
      if (bub && el && /^#fb/.test(q) && view === 'battle'){ const ar = document.getElementById('app').getBoundingClientRect(), r = el.getBoundingClientRect(), bh = bub.offsetHeight || 60, right = r.left + r.width / 2 - ar.left > ar.width / 2;
        const bw = bub.offsetWidth || 180, hp = document.getElementById('fb_kb').getBoundingClientRect(); let top = r.top - ar.top - bh - 12, left;
        if (!right && r.left - ar.left < 100){ left = r.right - ar.left + 8; top = r.top - ar.top; }                         /* ícone da coluna esquerda: balão AO LADO, não por cima do ícone de cima */
        else { left = right ? r.right - ar.left - bw : r.left - ar.left; if (left < hp.right - ar.left + 6 && top + bh > hp.top - ar.top && top < hp.bottom - ar.top) left = hp.right - ar.left + 6; }   /* nunca por cima do painel de vida do herói */
        left = Math.max(8, Math.min(ar.width - bw - 8, left)); top = Math.max(8, top);
        bub.style.setProperty('top', top + 'px', 'important'); bub.style.setProperty('left', left + 'px', 'important'); bub.style.setProperty('right', 'auto', 'important'); bub.style.setProperty('transform', 'none', 'important'); }
      else if (bub && FBK.tutPos !== q){ ['top', 'left', 'right', 'transform'].forEach(pp => bub.style.removeProperty(pp)); } FBK.tutPos = q; } }
  { const t = FB_TITLES[view] || (Screens.reg && Screens.reg[view] && Screens.reg[view].title) || ''; fbSet('fb_tt', view === 'pass' && typeof passTab !== 'undefined' && passTab === 'mis' ? 'Missões' : t); }
}
/* TUTORIAL na 04b: os passos apontam para as abas e os botões antigos (escondidos). Aqui o alvo de cada passo é trocado pelo equivalente novo. */
/* textos curtos (uma linha) dos 5 passos na 04b */
const FB_TUT_TXT = [
  'Seu herói luta <b>sozinho</b>.',
  'O <b>Especial</b> dispara sozinho.',
  () => view !== 'gear' ? 'Abra <b>Equip.</b>' : !document.getElementById('g_upgold') ? 'Toque na sua <b>arma</b>.' : (typeof tutCapped === 'function' && tutCapped()) ? 'O item sobe até o <b>seu nível</b>.' : 'Toque em <b>Upar</b>.',
  'A <b>Ultimate</b> dispara sozinha.',
  () => view === 'summon' ? 'Toque na invocação <b>grátis</b>.' : 'Abra <b>Invocar</b>.',
];
function fbInit(){ fbLegacy(); fbCss();
  if (typeof TUT !== 'undefined') TUT.forEach((st, i) => { if (FB_TUT_TXT[i]) st.txt = FB_TUT_TXT[i]; }); document.body.classList.add('fb'); fbBuild(); fbLayout(); addEventListener('resize', fbLayout); if (typeof resize === 'function') resize(); fbLayout(); fbTick(); setInterval(fbFast, 100); }
