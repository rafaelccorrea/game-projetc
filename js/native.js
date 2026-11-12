'use strict';
/* ================= PONTE NATIVA (Android · Capacitor) =================
   Único arquivo com as integrações do app. Fora do Capacitor (navegador, PWA) este arquivo NÃO faz nada: sai na primeira linha.
   Não precisa de empacotador: usa window.Capacitor.Plugins (App e Haptics), que o Capacitor injeta na página.

   O que faz:
   1. VOLTAR do Android: fecha o que estiver aberto (modal, subpainel, painel/tela); na batalha sem nada aberto, pede confirmação para sair.
   2. SEGUNDO PLANO: salva, pausa o jogo e a música; ao voltar, retoma como estava.
   3. VIBRAÇÃO: troca o vib() do jogo (navigator.vibrate) pelo Haptics nativo, respeitando a chave Configurações > Vibração (S.set.vib).
      Os eventos são os que o jogo JÁ tem (crítico, ultimate, chefe, etc.); o único acréscimo é a DERROTA.
   4. TELA CHEIA: o app já é imersivo pelo lado nativo; desliga o requestFullscreen do onPlay (não faz sentido dentro do WebView).
   5. window.EonNative: ponte pública (isNative, vibrate, exit, minimize, version) para uso futuro.

   Depende de nomes globais do jogo: S, B, save, vib, snd, music, modal, mbox, closeModal, Screens, view, toast, LD. Cada uso é protegido. */
(function(){
  const Cap = window.Capacitor;
  if (!Cap || !Cap.isNativePlatform || !Cap.isNativePlatform()) { window.EonNative = { isNative: false }; return; }
  const P = Cap.Plugins || {}, App = P.App, Haptics = P.Haptics;
  const safe = fn => { try { return fn(); } catch (e) { console.error('native', e); } };
  const el = id => document.getElementById(id);

  /* ---------- 4. tela cheia: o nativo cuida; o pedido do navegador fica desligado ---------- */
  safe(() => { const d = document.documentElement; d.requestFullscreen = null; d.webkitRequestFullscreen = null; });

  /* ---------- 3. vibração ---------- */
  let lastVib = 0;
  function nativeVib(ms){
    if (!Haptics) return; const now = Date.now(); if (now - lastVib < 70) return; lastVib = now;   // a batalha em x4 dispara muitos críticos: não enfileira
    safe(() => { const p = Haptics.vibrate({ duration: Math.max(10, Math.min(400, ms | 0 || 30)) }); if (p && p.catch) p.catch(() => {}); });
  }
  const vibOn = () => { try { return !!(S && S.set && S.set.vib); } catch (e) { return false; } };
  if (typeof window.vib === 'function') window.vib = function(ms){ if (vibOn()) nativeVib(ms); };     // mesma assinatura do jogo
  if (typeof window.snd === 'function'){ const snd0 = window.snd;                                       // DERROTA: o jogo toca o som e não vibrava
    window.snd = function(name){ if (name === 'defeat' && vibOn()) nativeVib(140); return snd0.apply(this, arguments); }; }

  /* ---------- 2. segundo plano ---------- */
  let lastMusic = null, bg = false, wasPaused = false;
  if (typeof window.music === 'function'){ const music0 = window.music;
    window.music = function(key){ lastMusic = key; return music0.apply(this, arguments); }; }
  function toBackground(){
    if (bg) return; bg = true;
    safe(() => { if (typeof save === 'function') save(); });
    safe(() => { wasPaused = !!B.paused; B.paused = true; });
    safe(() => { const g = window.GameAudio; if (g && g.stopMusic) g.stopMusic(); });   // o contexto de áudio em si é suspenso pelo js/audio.js (visibilitychange)
  }
  function toForeground(){
    if (!bg) return; bg = false;
    safe(() => { if (!wasPaused) B.paused = false; });
    safe(() => { if (lastMusic && typeof music === 'function') music(lastMusic); });
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden) toBackground(); else toForeground(); });
  if (App && App.addListener){
    safe(() => App.addListener('pause', toBackground));
    safe(() => App.addListener('resume', toForeground));
  }

  /* ---------- 1. botão VOLTAR ---------- */
  const modalOpen = () => { try { return modal.style.display === 'flex'; } catch (e) { return false; } };
  const titleOpen = () => { const t = el('title'); return !!t && t.style.display !== 'none' && !t.classList.contains('out'); };
  function exitApp(){ safe(() => { if (typeof save === 'function') save(); }); if (App && App.exitApp) safe(() => App.exitApp()); }
  function minimize(){ safe(() => { if (typeof save === 'function') save(); }); if (App && App.minimizeApp) safe(() => App.minimizeApp()); }
  function askExit(){
    mbox.innerHTML = '<h3>Sair do jogo?</h3><div class="sm">Seu progresso fica salvo neste aparelho.</div>' +
      '<div class="row"><button class="btn dim grow" id="m_stay">Continuar jogando</button><button class="btn grow" id="m_exit">Sair</button></div>';
    modal.style.display = 'flex';
    el('m_stay').onclick = () => { closeModal(); };
    el('m_exit').onclick = () => { closeModal(); exitApp(); };
  }
  function onBack(){
    /* a) modal aberto: cancela/fecha pelo botão que o próprio modal oferece */
    if (modalOpen()){
      const b = el('m_stay') || el('m_no') || el('m_go') || el('m_ok');   // sair? -> continuar · resetar? -> cancelar · boas-vindas/offline -> o único botão · config -> fechar
      if (b && modal.contains(b)) b.click(); else closeModal();
      return;
    }
    /* b) carregamento, título ou introdução: não há o que fechar; o VOLTAR manda o app para o fundo (não mexe no estado) */
    if (el('loading') || titleOpen() || el('intro')){ minimize(); return; }
    /* c) painel/tela aberta: primeiro o subpainel (comparação de item etc.), depois a tela inteira */
    const cur = (typeof Screens !== 'undefined' && Screens.current) ? Screens.current() : 'battle';
    if (cur !== 'battle'){
      const sub = document.querySelector('#view [data-x="close"]');
      if (sub) sub.click(); else Screens.close();
      return;
    }
    /* d) batalha sem nada aberto: confirma a saída */
    askExit();
  }
  if (App && App.addListener) safe(() => App.addListener('backButton', () => safe(onBack)));

  /* ---------- 6. medição: FPS real do laço de desenho (requestAnimationFrame), no logcat a cada 5 s (adb logcat | findstr EonFPS) ---------- */
  /* DESLIGADO por padrão no jogo: só mede com localStorage.eonfps = '1' (ou window.__eonFps = true antes da carga) */
  if ((function(){ try { return window.__eonFps || localStorage.getItem('eonfps') === '1'; } catch (e) { return false; } })()) (function(){ let n = 0, t0 = performance.now(), worst = 0, last = t0;
    function tick(now){ n++; const d = now - last; last = now; if (d > worst) worst = d;
      if (now - t0 >= 5000){ let extra = ''; try { extra = ' view=' + view + ' paused=' + (!!B.paused) + ' speed=' + B.speed + ' jogo=' + (window.__fps || 0); } catch (e) {}
        console.log('[EonFPS] fps=' + (n * 1000 / (now - t0)).toFixed(1) + ' piorQuadroMs=' + worst.toFixed(0) + extra); n = 0; t0 = now; worst = 0; }
      requestAnimationFrame(tick); }
    requestAnimationFrame(tick); })();

  window.EonNative = { isNative: true, platform: Cap.getPlatform ? Cap.getPlatform() : 'android', vibrate: nativeVib, exit: exitApp, minimize, back: onBack,
    hasHaptics: !!Haptics, hasApp: !!App };
})();
