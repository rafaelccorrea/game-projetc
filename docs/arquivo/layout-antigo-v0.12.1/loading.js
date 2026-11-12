'use strict';
/* ================= TELA DE CARREGAMENTO (protótipo 00 do canvas de design) =================
   Kael corre sem arma atravessando as 7 eras enquanto o pré-carregamento REAL anda; dicas rotativas;
   ao terminar, "Toque para continuar" leva à tela de título. Medidas do protótipo (390x844) escaladas por --s.
   Debug: ?skip=1 pula; ?ldur=N = duração mínima em segundos (padrão 2,4); ?lhold=1 não fecha no toque (para prints). */
const LOAD_TIPS = [
  'Skins só mudam o visual. Seu poder vem dos itens e da evolução.',
  'A Ultimate enche ao bater e ao apanhar. Guarde para o chefe!',
  'Mesmo offline, Kael continua lutando e juntando moedas.',
  'Cada era tem uma arma nova com 3 ataques diferentes.',
];
const LOAD_ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Industrial', 'Moderna', 'Futurista'];
const LOAD_RUN = 'assets/anim/hyb/kael_run_body.png';   // corrida aprovada SEM arma (8 quadros, 12 fps)
const LD = { scn: [], el: null, total: 0, done: 0, shown: 0, t0: 0, fin: false, era: -1, tip: -1, bg: [], closed: false };

function loadTrack(p){ LD.total++; const ok = () => { LD.done++; }; Promise.resolve(p).then(ok, ok); }
function loadImgP(path){ return new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = path; }); }
/* imagem pelo cache do jogo (IMG/IMGS do battle.js): quando a batalha pedir, já está pronta */
function loadGameImg(path){ return new Promise(res => { IMG(path); const o = IMGS[path]; if (!o || o.ok || o.fail) return res(); o.img.addEventListener('load', () => res()); o.img.addEventListener('error', () => res()); }); }
function loadJson(path){ J(path); return fetch(path).then(r => r.ok ? r.json() : null).catch(() => null); }

function initLoading(){
  const el = LD.el = document.getElementById('loading'); if (!el) return;
  if (DEBUG && QP.has('skip')){ el.remove(); LD.closed = true; return; }
  const app = document.getElementById('app');
  const fit = () => { const r = app.getBoundingClientRect(); if (r.height) el.style.setProperty('--s', (r.height / 844).toFixed(4)); };
  fit(); addEventListener('resize', fit);
  document.getElementById('lver').textContent = 'Versão ' + VERSION.replace(/^v/, '');
  LD.t0 = performance.now();

  /* --- fila real de pré-carregamento --- */
  const era = eraOf(S.stage), ae = SKIN(S.skinEq.armor), we = SKIN(S.skinEq.weapon);
  ['assets/hero/anchors.json', 'assets/weapons/meta.json', 'assets/enemies/meta.json', 'assets/bg/meta.json', 'assets/fx/meta.json'].forEach(p => loadTrack(loadJson(p)));
  heroPreload(ae.e).forEach(loadTrack);                                            // folhas do Kael (corrida, parado, golpe)
  [hp('weapons', we.e, tierOf(we.r)), hp('hero', ae.e, tierOf(ae.r))].forEach(p => loadTrack(loadGameImg(p)));
  EN_IDS(era).forEach(k => enPreload(k).forEach(loadTrack));   // corrida dos inimigos que têm folha
  EN_IDS(era).forEach(k => loadTrack(loadGameImg(`assets/enemies/${k}.png`)));
  { const A = FX_ART.ult[we.e]; if (A){ loadTrack(loadGameImg(fxPng(A))); if (A.meta) loadTrack(loadJson(A.sheet + '.json')); } }   // ultimate animada da arma equipada
  const sc = sceneGet(era);                                                        // cenário da era atual: vivo (v2) ou fundo antigo
  if (sc) loadTrack(sc.ready); else loadTrack(loadGameImg(`assets/bg/era${era}.png`));
  ['assets/brand/title_bg.png', 'assets/brand/logo.png'].forEach(p => loadTrack(loadImgP(p)));
  for (let n = 1; n <= 3; n++) loadTrack(loadImgP(`assets/icons/era${we.e}_s${n}.png`));
  ['assets/audio/manifest.json', 'assets/audio/music/title.mp3', `assets/audio/music/era${era}.mp3`].forEach(p => loadTrack(fetch(p).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null)));   // aquece o cache do navegador (a decodificação é do GameAudio, depois do 1º toque)
  /* fundos das 7 eras desta própria tela (o chão de cada um cai na linha dos pés: 78% da altura) */
  const bgMeta = fetch('assets/bg/meta.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  /* linha dos pés da tela de carregamento: 658 de 844 (jogo de hoje) ou 640 com a 04b ligada (mesma linha da batalha em tela cheia) */
  const LOAD_FEET = (typeof FB_GEO !== 'undefined' && FB_GEO) ? 640 : 658;
  if (LOAD_FEET !== 658){ const lr = document.getElementById('lrun'); if (lr) lr.style.top = (507 - (658 - LOAD_FEET)) + 'px'; }
  LOAD_ERAS.forEach((n, i) => { const d = document.getElementById('lbg' + i), path = `assets/bg/era${i}.png`;
    if (sceneOn(i) && d){   // era com cenário novo aprovado (sceneV2): a própria cena viva, com o chão do meta na linha dos pés (658 de 844)
      const base = `assets/bg/v2/era${i}/`;
      loadTrack(fetch(base + 'meta.json').then(r => r.json()).then(meta => { const c = document.createElement('canvas'); c.className = 'lbg lscn'; c.id = 'lbg' + i;
          const w = Math.ceil(d.parentNode.clientWidth) || 390, h = Math.round(LOAD_FEET / (meta.groundY || 0.78)); c.style.width = w + 'px'; c.style.height = h + 'px'; d.replaceWith(c);
          return EonScene.create(c, { base, meta, hero: false, running: true, autoStart: false, width: w, height: h, dpr: Math.min(2, window.devicePixelRatio || 1) }); })
        .then(api => { LD.scn[i] = api; return api.ready; }).then(() => { LD.bg[i] = true; }).catch(() => {}));
      return; }
    loadTrack(Promise.all([loadImgP(path), bgMeta]).then(([im, m]) => { if (!im || !d) return;
      const g = (m['era' + i] || {}).groundY || 0.72, pw = 1100 * im.naturalWidth / im.naturalHeight;
      d.style.backgroundImage = `url(${path})`; d.style.setProperty('--pw', pw.toFixed(1)); d.style.setProperty('--py', (LOAD_FEET - g * 1100).toFixed(1)); d.style.animationDuration = (pw / 241).toFixed(2) + 's'; LD.bg[i] = true; })); });
  loadTrack(loadImgP(LOAD_RUN).then(im => { if (im) document.getElementById('lrun').classList.add('ok'); }));

  /* "Toque para continuar": o toque fecha a tela e NÃO pode atravessar para o botão que está embaixo (no APK abria Configurações). O clique que o
     navegador gera logo depois do pointerup é engolido por 500 ms. */
  el.addEventListener('pointerup', ev => { if (LD.fin && !(DEBUG && QP.has('lhold'))){ ev.preventDefault(); ev.stopPropagation();
      const eat = e => { e.stopPropagation(); e.preventDefault(); }; ['click', 'pointerdown', 'pointerup', 'touchend'].forEach(t => document.addEventListener(t, eat, true));
      setTimeout(() => ['click', 'pointerdown', 'pointerup', 'touchend'].forEach(t => document.removeEventListener(t, eat, true)), 500); closeLoading(); } });
  el.addEventListener('keydown', ev => { if (LD.fin && (ev.key === 'Enter' || ev.key === ' ')) closeLoading(); });
  requestAnimationFrame(loadTick);
}
function loadTick(now){
  if (LD.closed) return;
  const el = LD.el, minDur = Math.max(0.3, +(DEBUG && QP.get('ldur')) || 2.4), el_s = (now - LD.t0) / 1000;
  let real = LD.total ? LD.done / LD.total : 1; if (el_s > 15) real = 1;                         // rede travada: não prende o jogador
  const cap = Math.min(1, el_s / minDur);                                                        // duração mínima: dá tempo de ver a travessia
  LD.shown = Math.max(LD.shown, Math.min(real, cap));
  const p = Math.floor(LD.shown * 100), ei = Math.min(6, Math.floor(LD.shown * 7));
  document.getElementById('lbar').style.width = p + '%'; document.getElementById('lbarw').setAttribute('aria-valuenow', p);
  document.getElementById('lpct').textContent = p + '%';
  if (ei !== LD.era || !LD.bgOn){ LD.era = ei; LD.bgOn = !!LD.bg[ei];
    for (let i = 0; i < 7; i++){ const on = i === ei && LD.bg[i]; document.getElementById('lbg' + i).style.opacity = on ? 1 : 0; const a = LD.scn[i]; if (a){ if (on) a.start(); else a.stop(); } }
    const pill = document.getElementById('lpill'), tx = `Era ${ei + 1} de 7 · ${LOAD_ERAS[ei]}`; if (pill.textContent !== tx){ pill.textContent = tx; pill.classList.remove('erapill'); void pill.offsetWidth; pill.classList.add('erapill'); }
    document.getElementById('lstep').textContent = `Atravessando a ${LOAD_ERAS[ei]}…`; }
  const ti = Math.floor(Math.max(p / 26, el_s / 3.5)) % LOAD_TIPS.length;
  if (ti !== LD.tip && p < 100){ LD.tip = ti; const tp = document.getElementById('ltip'); tp.querySelector('span').textContent = LOAD_TIPS[ti]; tp.classList.remove('tip'); void tp.offsetWidth; tp.classList.add('tip'); }
  if (p >= 100 && !LD.fin){ LD.fin = true; document.getElementById('lstep').textContent = 'Pronto!'; el.classList.add('done'); el.setAttribute('tabindex', '0'); try { el.focus({ preventScroll: true }); } catch (e) {} }
  requestAnimationFrame(loadTick);
}
function closeLoading(){
  if (LD.closed) return; LD.closed = true; const el = LD.el;
  el.classList.add('out'); setTimeout(() => { LD.scn.forEach(a => { try { a && a.stop(); } catch (e) {} }); el.remove(); }, 480);
  if (typeof unlockAudio === 'function') unlockAudio();        // 1º toque: destrava o som e entra o tema do título
  if (typeof music === 'function') music('title');
}
