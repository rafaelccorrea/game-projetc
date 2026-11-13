'use strict';
/* ================= EVENTOS COM HORÁRIO NO HUD DA BATALHA (Engenheiro 6, v0.12.9) — ATRÁS DA CHAVE SCREENS_ON.evHud (index.html) =================
   Chave DESLIGADA por padrão: com ela desligada este arquivo só define funções, o ícone não é desenhado e nada muda no jogo.
   Para conferir: ?debug=1&ev=1, ou o botão "Eventos com horário" do Modo dono (js/artprev.js).
   Fonte ÚNICA de regra e de hora: Sys.schedule (js/sys/schedule.js, de Sistemas). Aqui NÃO há conta de fuso: a hora "até HH:MM" sai do
   Sys.schedule._br(instante) (minuto do dia em Brasília, do próprio módulo) e a contagem sai do msLeft/msToStart que o módulo devolve.
   (a) ÍCONE: entrada 'event' no FB_MENU (coluna direita, abaixo do Baú). Só existe enquanto há evento aberto que o nível do jogador permite;
       pulsa (só transform/opacidade), mostra o nome e a contagem regressiva (HH:MM:SS ou MM:SS); com mais de um aberto, alterna a cada 4 s.
   (b) FAIXA "X / Evento aberto até HH:MM" quando um evento abre: some sozinha em 5 s, fica no céu da cena (y 246 da base de 390, x 75-289: abaixo do aviso do jogo e do aviso de poder, acima do nome da habilidade e das barras de vida, entre a coluna de ícones da esquerda e o rótulo do evento), sem toque
       (pointer-events: none), longe das barras de vida e dos botões.
   (c) AVISO "X / Começa em N min" quando faltam até DATA.noticeMin (10) minutos: a mesma faixa, UMA vez por janela.
       "Uma vez por janela" é guardado no save (S.evh = {b:{chave:1}, n:{chave:1}}; chave = id@início, a do módulo), podado a cada marca.
   (d) TOQUE no ícone: abre a tela de Eventos pelo mesmo caminho do MENU (fbAct('soon:events')); se a tela ainda não está liberada para o
       jogador (nível 24), o toque diz qual evento está aberto e o que ele dá (nenhum botão sem ação).
   Custo: um setInterval de 1 s (nada por quadro); o DOM só é tocado quando o texto muda (fbSet).
   TESTE SEM ESPERAR O RELÓGIO (só em DEBUG): dbgEvClock('19:00') ou dbgEvClock('11:52', 3) (dia da semana 0-6) ou dbgEvClock(ms); dbgEvClock() volta
   ao relógio real. O relógio de teste NÃO passa pelo save (a trava "nunca volta" do módulo fica num estado descartável), então não suja nada. */
const EVH_ON = () => typeof SCREENS_ON !== 'undefined' && !!SCREENS_ON.evHud && !!(window.Sys && Sys.schedule && Sys.host);
const EVH_ICON = { boss: 'worldboss', gold: 'goldenhour', invasion: 'invasion', tourney: 'weekend', pets: 'pethunt', forge: 'forge' };
const EVH_DAY = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const EVH = { shown: false, cur: null, q: [], band: null, bandUntil: 0, dbg: null, dbgAt: 0, dbgS: null, dbgSeen: null, timer: 0 };
/* IMAGEM SÓ DEPOIS DE CARREGADA (ordem do coordenador): o ícone próprio do evento só é usado quando já está decodificado (img.complete e naturalWidth > 0,
   ou window.Preload.ready([url]) se o pré-carregador existir); até lá vale o ícone de Eventos do menu, que o jogo já carregou. Os 6 arquivos são
   pedidos uma vez, quando a chave está ligada. */
const EVH_FALLBACK = 'assets/icons/menu/events.png', EVH_IMG = {};
const evhUrl = a => 'assets/icons/events/' + (EVH_ICON[a.icon] || 'worldboss') + '.png';
function evhPreload(){ for (const k in EVH_ICON){ const u = 'assets/icons/events/' + EVH_ICON[k] + '.png'; if (!EVH_IMG[u]){ const im = new Image(); im.decoding = 'async'; im.src = u; EVH_IMG[u] = im; } } }
function evhIcon(a){ const u = evhUrl(a), im = EVH_IMG[u]; let ok = !!(im && im.complete && im.naturalWidth > 0);
  if (!ok && window.Preload && typeof Preload.ready === 'function'){ try { ok = Preload.ready([u]) === true; } catch (e) {} }
  return ok ? u : EVH_FALLBACK; }
const evhP2 = n => String(n).padStart(2, '0');
/* [S, host] para o módulo: o save e o host reais; com o relógio de teste, um estado descartável e um host só com a hora de teste (que anda) */
function evhArgs(){ if (EVH.dbg == null) return [S, Sys.host]; return [EVH.dbgS, { now: () => EVH.dbg + (Date.now() - EVH.dbgAt) }]; }
function evhSeen(){ if (EVH.dbg != null) return EVH.dbgSeen; let o = S.evh; if (!o || typeof o !== 'object') o = S.evh = {}; if (!o.b || typeof o.b !== 'object') o.b = {}; if (!o.n || typeof o.n !== 'object') o.n = {}; return o; }
function evhMark(kind, key, now){ const o = evhSeen(); o[kind][key] = 1;
  for (const k of ['b', 'n']) for (const id in o[k]){ const st = +String(id).split('@')[1]; if (!(st > now - 3 * 86400000)) delete o[k][id]; } }   // poda: janelas de mais de 3 dias atrás
const evhLvOk = a => (typeof OWNER_MODE !== 'undefined' && OWNER_MODE) || fbLvl() >= (a.level | 0);
/* contagem: HH:MM:SS a partir de 1 h; abaixo disso MM:SS */
function evhCount(ms){ const s = Math.max(0, Math.ceil(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? evhP2(h) + ':' : '') + evhP2(m) + ':' + evhP2(s % 60); }
/* "HH:MM" de Brasília pelo módulo; se o instante cai em outro dia (torneio de fim de semana), o dia da semana vai junto */
function evhHM(t, ref){ const b = Sys.schedule._br(t), r = Sys.schedule._br(ref), hm = evhP2(Math.floor(b.min / 60)) + ':' + evhP2(b.min % 60); return b.dayStart !== r.dayStart ? EVH_DAY[b.day] + ' ' + hm : hm; }
const evhShown = () => EVH.shown;
/* a tela de Eventos está pronta e liberada para este jogador? (mesmas regras do MENU) */
const evhCanOpen = () => !!(Screens.reg && Screens.reg.events && !Screens.reg.events.broken && fbPanelOn('events') && fbUnl('events'));
function evhTap(b){ const a = EVH.cur;
  if (evhCanOpen()){ fbAct('soon:events', b); return; }
  snd('ui_tap'); toast(a ? 'Evento aberto: ' + a.name + '. ' + a.prize : 'Nenhum evento aberto agora'); }

function evhCss(){ const st = document.createElement('style'); st.textContent = `
#fbm_event .fb-ib{animation:evhp 1.1s ease-in-out infinite}
#fbm_event:active .fb-ib{animation:none}
@keyframes evhp{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
#fbm_event .fb-ib::after{box-shadow:0 0 18px 5px rgba(255,201,74,.95);animation-duration:1.1s}
#fbm_event .fb-lb{align-self:flex-end;display:flex;flex-direction:column;align-items:flex-end;gap:1px;width:96px;margin-top:2px;white-space:normal;text-align:right}
#fb_evn{font-size:10.5px;line-height:12px}   /* nome inteiro, alinhado à direita, em até 2 linhas (Torneio de Fim de Semana) */
#fb_evt{font-family:'Lilita One',Nunito,sans-serif;font-weight:400;font-size:13px;line-height:14px;color:#ffe07a;letter-spacing:.02em}
#fb_evband{position:absolute;left:182px;top:246px;transform:translateX(-50%);z-index:5;display:none;align-items:center;gap:7px;max-width:214px;padding:5px 12px 5px 6px;border-radius:16px;box-sizing:border-box;background:rgba(22,16,12,.9);border:1px solid rgba(255,201,74,.75);box-shadow:0 6px 16px rgba(0,0,0,.45);color:#fff}
#fb_evband.on{display:flex;animation:evhin .28s cubic-bezier(.2,.9,.25,1) both}
#fb_evband.out{display:flex;animation:evhout .35s ease-in both}
#fb_evband.soon{border-color:rgba(95,240,207,.75)}
#fb_evband img{width:30px;height:30px;object-fit:contain;flex:none}
#fb_evband .t{font-size:11px;line-height:13px;font-weight:900;color:#ffc94a;white-space:nowrap}
#fb_evband.soon .t{color:#5ff0cf}
#fb_evband .m{font-size:13px;line-height:15px;font-weight:900;text-shadow:0 1px 2px #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@keyframes evhin{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%)}}
@keyframes evhout{from{opacity:1;transform:translateX(-50%)}to{opacity:0;transform:translateX(-50%) translateY(-8px)}}
`; document.head.appendChild(st); }
/* monta as duas linhas do rótulo (nome + contagem) e a faixa, uma vez, depois que o HUD existe */
function evhMount(){ if (document.getElementById('fb_evband')) return true; const w = document.getElementById('fb_w'), lb = document.getElementById('fbl_event'); if (!w || !lb) return false;
  lb.innerHTML = '<span id="fb_evn"></span><span id="fb_evt"></span>';
  const d = document.createElement('div'); d.id = 'fb_evband'; d.setAttribute('role', 'status'); d.setAttribute('aria-live', 'polite'); d.style.pointerEvents = 'none';
  d.innerHTML = '<img id="fb_evbi" alt=""><div style="min-width:0"><div class="m" id="fb_evbm"></div><div class="t" id="fb_evbt"></div></div>'; w.appendChild(d); return true; }
function evhBandHide(now){ const d = document.getElementById('fb_evband'); if (d && EVH.band){ d.classList.remove('on'); d.classList.add('out'); setTimeout(() => { if (!EVH.band) d.classList.remove('out'); }, 360); } EVH.band = null; EVH.bandUntil = now + 600; }
function evhBandShow(it, now, t){ const d = document.getElementById('fb_evband'); if (!d) return; const a = it.a;
  { const bi = document.getElementById('fb_evbi'), u = evhIcon(a); if (bi.getAttribute('src') !== u) bi.src = u; }
  document.getElementById('fb_evbm').textContent = a.name;
  document.getElementById('fb_evbt').textContent = it.kind === 'n' ? 'Começa em ' + Math.max(1, Math.ceil((a.start - t) / 60000)) + ' min' : 'Evento aberto até ' + evhHM(a.end, t);
  d.classList.remove('out', 'on'); d.classList.toggle('soon', it.kind === 'n'); void d.offsetWidth; d.classList.add('on'); EVH.band = it; EVH.bandT0 = now; EVH.bandUntil = now + 5000; }
function evhOff(){ if (EVH.shown){ EVH.shown = false; EVH.cur = null; if (typeof fbLayout === 'function') fbLayout(); } if (EVH.band) evhBandHide(Date.now()); EVH.q.length = 0; }
/* 1 vez por segundo */
function evhTick(){
  if (!EVH_ON()){ evhOff(); return; }
  if (!document.getElementById('fbhud') || !evhMount()) return;
  evhPreload();
  let act = [], soon = [], t = 0; const ar = evhArgs();
  try { t = Sys.schedule.now(ar[0], ar[1]); act = Sys.schedule.active(ar[0], ar[1]).filter(evhLvOk); soon = Sys.schedule.notices(ar[0], ar[1]).filter(evhLvOk); } catch (e) { console.error('evhud', e); evhOff(); return; }
  const now = Date.now(), seen = evhSeen();
  /* ícone: aparece/some; alterna entre os abertos a cada 4 s */
  const on = act.length > 0; if (EVH.shown !== on){ EVH.shown = on; fbLayout(); }
  if (on){ const a = act[Math.floor(now / 4000) % act.length]; EVH.cur = a;
    { const u = evhIcon(a); if (FBK.evIc !== u){ FBK.evIc = u; const im = document.querySelector('#fbm_event .fb-ico'); if (im) im.src = u; } }
    fbSet('fb_evn', a.name); fbSet('fb_evt', evhCount(a.msLeft));
    if (FBK.evAl !== a.id){ FBK.evAl = a.id; const b = document.getElementById('fbm_event'); if (b) b.setAttribute('aria-label', 'Evento aberto: ' + a.name + '. Abrir Eventos'); } }
  else EVH.cur = null;
  /* faixa: evento que abriu (uma vez por janela) e aviso de 10 min (uma vez por janela) entram na fila */
  for (const a of act) if (!seen.b[a.key]){ evhMark('b', a.key, t); seen.n[a.key] = 1; EVH.q.push({ kind: 'b', a }); }
  for (const a of soon) if (!seen.n[a.key]){ evhMark('n', a.key, t); EVH.q.push({ kind: 'n', a }); }
  const tst = document.getElementById('toast'), toastOn = !!(tst && tst.classList.contains('on'));   /* o aviso do jogo (Drop: ..., Liberou ...) ocupa o mesmo céu: a faixa espera ele sair e, se ele entrar por cima, fica mais 2 s (teto de 12 s) */
  if (EVH.band && toastOn) EVH.bandUntil = Math.min(EVH.bandT0 + 12000, Math.max(EVH.bandUntil, now + 2000));
  if (EVH.band && now >= EVH.bandUntil) evhBandHide(now);
  if (!EVH.band && now >= EVH.bandUntil && view === 'battle' && !B.paused && !toastOn && !(typeof tutOn === 'function' && tutOn()) && !document.getElementById('fbdrop')){   /* espera a batalha livre: sem tutorial apontando e sem o MENU aberto */
    while (EVH.q.length){ const it = EVH.q.shift(); if (it.kind === 'n' ? it.a.start > t : it.a.end > t){ evhBandShow(it, now, t); break; } } }   // o que já passou (aviso de evento que já abriu, evento que já fechou) é descartado
}
/* entrada do ícone no menu da batalha (dados; a disposição é do FB_MENU). Com a Oferta 24h na tela (Modo dono), o evento desce uma casa. */
if (typeof FB_MENU !== 'undefined') FB_MENU.push({ id: 'event', icon: 'events', label: 'Evento', side: 'right', x: 7, y: 220, yf: () => (typeof fbOfferOn === 'function' && fbOfferOn()) ? 296 : 220, act: 'event', prio: 6, hot: true, show: evhShown });
function evhInit(){ evhCss(); if (!EVH.timer) EVH.timer = setInterval(evhTick, 1000); evhTick(); }
if (typeof DEBUG !== 'undefined' && DEBUG) window.dbgEvClock = function(spec, wd){ if (!(window.Sys && Sys.schedule)) return null;
  if (spec == null){ EVH.dbg = null; } else { let ms = spec;
    if (typeof spec === 'string'){ const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(spec); if (!m) return null; const b = Sys.schedule._br(Date.now());   /* meia-noite de Brasília e dia da semana: do módulo */
      ms = b.dayStart + ((+m[1]) * 60 + (+m[2])) * 60000 + (+m[3] || 0) * 1000 + (wd == null ? 0 : (((wd - b.day) % 7 + 7) % 7) * 86400000); }
    EVH.dbg = ms; EVH.dbgAt = Date.now(); }
  EVH.dbgS = { sys: {} }; EVH.dbgSeen = { b: {}, n: {} }; EVH.q.length = 0; if (EVH.band) evhBandHide(Date.now()); EVH.bandUntil = 0; evhTick();
  return EVH.dbg == null ? 'relógio real' : new Date(EVH.dbg).toISOString(); };
