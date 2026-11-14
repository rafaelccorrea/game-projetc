'use strict';
/* ================= TELA DE CARREGAMENTO (protótipo 00 do canvas de design) =================
   Kael corre sem arma atravessando as eras (até a era do jogador) enquanto o pré-carregamento REAL anda; dicas rotativas;
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

/* tarefas só desta tela (fundos da travessia, áudio): contam na barra; nunca viram falha */
function loadTrack(p, label){ PRE().track(PRE().limit(Promise.resolve(p), 20000).then(() => true, () => true), label || 'enfeite'); }   /* enfeite da própria tela: no máximo 20 s na barra, nunca falha */
function loadImgP(path){ return PRE().get(path).p.then(e => e.ok ? e.img : null); }

/* ================= LISTA DA CENA (Engenheiro 5; ordem do dono: tudo carregado ANTES de aparecer) =================
   sceneList(opt) → FUNÇÃO ÚNICA: tudo o que a batalha desenha para (herói, era, equipamentos) de AGORA, ou os de opt = {era, part: 'all' | 'era' | 'hero'}.
   Devolve {urls: [arquivos, .json das folhas incluídos], tasks: [{label, p}] (o que não é um arquivo só: cenário vivo com as camadas do meta.json, fontes)}.
   Ao montar a lista ela já PEDE cada folha pelo carregador do próprio jogo (sheetLoad / IMG / SPR / asa), que usa o cache único do Preload: a imagem que a
   barra espera é a MESMA instância que a batalha desenha. Sys.assets (manifesto de pacotes, hoje DESLIGADO: needed() devolve {on:false}) entra quando ligar:
   os arquivos dos pacotes hero:/mount:/pet:/enemy: que ele pedir e que não estiverem na lista são somados (só .png/.json desses pacotes da era atual). */
function sceneList(opt){ opt = opt || {}; const part = opt.part || 'all', era = opt.era != null ? opt.era : eraOf(S.stage), urls = [], tasks = [], add = u => { if (u && urls.indexOf(u) < 0) urls.push(u); };
  const sheet = s => { if (s && s.base){ add(s.base + '.png'); add(s.base + '.json'); } };
  if (part !== 'hero'){   /* ---- era: cenário, inimigos e chefe ---- */
    const sc = sceneGet(era); if (sc) tasks.push({ label: 'cenário vivo da era ' + era, p: Promise.resolve(sc.ready).then(() => !sc.fail && !!sc.api && Promise.resolve(sc.api.ready).then(() => true)) }); else { IMG(bgPath(era)); add(bgPath(era)); }
    if (era < ERAS.length) EN_IDS(era).forEach(k => { add(`assets/enemies/${k}.png`); IMG(`assets/enemies/${k}.png`); enPreload(k); const T = ENEMY_SETS[k]; if (T) for (const st in T) if (enOn(k, st)) sheet(sheetLoad(T[st], true)); }); }
  if (part !== 'era'){    /* ---- herói, arma, montaria, pet, asa, efeitos ---- */
    ['assets/hero/anchors.json', 'assets/weapons/meta.json', 'assets/enemies/meta.json', 'assets/bg/meta.json', 'assets/fx/meta.json'].forEach(p => { J(p); add(p); });
    const ae = SKIN(S.skinEq.armor), lk = heroLook(), ws = opt.weapon || wFamLook(lk.weapon), F = formRefresh(), set = heroSet(ae.e);
    if (F.hero === 'kael' && F.stage === 0) [set.run, set.idle, set.attack].forEach(b => sheet(sheetLoad(b)));
    else for (const st of ['idle', 'run', 'attack', 'spin']) sheet(phaseSheet(st, F.stage));          // Kaia / skin de corpo próprio: as folhas DELA
    if (ART_ON.kael_die === true) sheet(dieSheet());
    { const sb = spinBase(ws), tb = trailBase(ws); if (sb) sheet(sheetLoad(sb, true)); if (tb) sheet(sheetLoad(tb, true)); }
    { const pe = pistolEra(ws); if (pe >= 0) for (const st of ['idle', 'run', 'shoot']){ sheet(pistolSheet(pe, st)); pistolScale(pe, st); } }   // arma de fogo: as 3 folhas da pistola
    { const t = heroCompTier(ae, ws); if (t >= 0) for (const st of ['run', 'idle', 'attack']){ const u = HERO_DIR + 'kael_' + (st === 'attack' ? 'attack_wide' : st) + '_era2_t' + t + '.png'; IMG(u); add(u); } }
    { const au = auraBase(); if (au) sheet(sheetLoad(au, true)); }
    add(wPng(ws)); IMG(wPng(ws)); { const h0 = hp('hero', ae.e, tierOf(ae.r)); add(h0); IMG(h0); }
    { const mo = opt.mount !== undefined ? opt.mount : lk.mount; if (mo && mo.id && typeof mountSheet === 'function') for (const st of ['idle', 'run', 'attack']) sheet(mountSheet(mo.id, st)); try { if (typeof mountShootOn === 'function' && mountShootOn() && typeof wIsGun === 'function' && wIsGun(wSkin())) mountSheet(mo.id, 'shoot'); } catch (e) {} }   /* tiro montado (chave): pede a folha sem prender a carga (pode não existir ainda) */
    { const b = opt.pet !== undefined ? opt.pet : (typeof petInfo === 'function' && (PETK.infoT = 0, petInfo()) ? PETK.base : ''); if (b) for (const st of ['idle', 'run', 'atk1']) sheet(sheetLoad(PET_DIR + b + '_' + st, true)); }
    { const wg = opt.wing !== undefined ? opt.wing : wingNow(lk); if (wg){ const j = 'assets/anim/equip/wing_' + wg + '.json'; J(j); add(j); wingList(wg).forEach(add); } }
    { const E = Math.min(SKN.length - 1, ws.e), P = ultPlan(wArm(), E, true); if (P){ IMG(P.sheet + '.png'); J(P.sheet + '.json'); add(P.sheet + '.png'); add(P.sheet + '.json'); }
      for (let n = 1; n <= 3; n++) add(`assets/icons/era${E}_s${n}.png`); }
    add('assets/hero/avatar/avatars.json'); add('assets/hero/avatar/' + F.hero + '_phase0.png');                                                   // retrato do cabeçalho
    domImages().forEach(add);                                                                                                                       // ícones do cabeçalho e do menu (o que está na tela)
    try { if (document.fonts && document.fonts.ready && typeof document.fonts.ready.then === 'function') tasks.push({ label: 'fontes', p: document.fonts.ready.then(() => true) }); } catch (e) {}
  }
  /* FONTE DO MÓDULO (Sistemas): quando existirem Sys.assets.sceneSet(S) / nextEraSet(S), as listas dele entram AQUI (ponto único) e o resto acima só soma o que ele não cobrir */
  /* Sys.assets.sceneSet(S, host, {era}) → {files, groups:{hero, weapon, ult, mount, pet, wing, era, enemies, icons}, missing} (commit 616ccb1; precisa do manifesto:
     loadManifest abaixo). BLOQUEIAM a entrada: hero, weapon, ult, mount, pet, wing, era, enemies. Os ícones do grupo icons que não estão na tela vão para "later"
     (carregam logo depois, em segundo plano). Sys.assets.nextEraSet(S, host) → era seguinte. */
  const later = [];
  try { const A = window.Sys && Sys.assets, okf = f => typeof f === 'string' && /\.(png|jpg|jpeg|webp|json)$/i.test(f), cur = eraOf(S.stage);
    /* Engenheiro 7 (medido com save equipado, era 1: o módulo devolvia 367 arquivos, 174 nos grupos que bloqueavam): SÓ O QUE É DA CENA bloqueia. Do módulo entram
       inteiros os grupos em que ele e o jogo dizem o mesmo (weapon, ult, wing, enemies: 0 arquivo a mais). NÃO entram: hero (60 a mais que a batalha não desenha:
       máscaras, pistola sem arma de fogo, chapéus/cabelos), mount (folhas _3star/_5star: a aura por estrela é por código), pet (atk2/atk3 sem uso na batalha) e
       era com cenário vivo (as 46 camadas já são carregadas pelo EonScene: seria decodificar duas vezes). Esses saem da lista do próprio jogo, acima. */
    if (A && LD.man){ let R = null, groups = ['weapon', 'ult', 'wing', 'enemies']; if (!sceneGet(era)) groups.push('era');
      if (part === 'era'){ groups = sceneGet(era) ? ['enemies'] : ['era', 'enemies']; R = (era === cur + 1 && typeof A.nextEraSet === 'function') ? A.nextEraSet(S, Sys.host) : (typeof A.sceneSet === 'function' ? A.sceneSet(S, Sys.host, { era }) : null); }
      else if (typeof A.sceneSet === 'function') R = A.sceneSet(S, Sys.host, { era });
      if (Array.isArray(R)) R.filter(okf).forEach(add);
      else if (R && R.groups){ for (const g of groups) (R.groups[g] || []).filter(okf).forEach(add); if (part !== 'era') (R.groups.icons || []).filter(okf).forEach(f => { if (urls.indexOf(f) < 0) later.push(f); });
        if (DEBUG && R.missing && R.missing.length) console.info('Sys.assets.sceneSet: calculados e ausentes no disco', R.missing); }
      else if (R && Array.isArray(R.files)) R.files.filter(okf).forEach(add); } } catch (e) { console.warn('sceneList: Sys.assets falhou; segue a lista do jogo', e); }
  if (part !== 'era'){
    try { const A = window.Sys && Sys.assets, n = A && A.needed ? A.needed(S, Sys.host) : null; if (n && n.on && Array.isArray(n.packs)) for (const id of n.packs) if (/^(hero|mount|pet|enemy):/.test(id) && !/^enemy:/.test(id) || id === 'enemy:' + era) A.filesOf(id).filter(f => /\.(png|json)$/.test(f)).forEach(add); } catch (e) {}
  }
  return { urls, tasks, later }; }
/* manifesto de pacotes (assets/manifest.json) para o Sys.assets: uma vez, dentro da barra; falhou = segue só com a lista do jogo */
function loadManifest(){ if (LD.manP) return LD.manP; const A = window.Sys && Sys.assets; if (!A || typeof A.setManifest !== 'function' || typeof A.sceneSet !== 'function') return LD.manP = Promise.resolve(false);
  /* sem prazo por tempo total (Engenheiro 7): o pedido termina sozinho (pronto, ou falha depois das tentativas com a rede parada: js/preload.js) */
  return LD.manP = PRE().get('assets/manifest.json').p.then(e => { if (e.ok){ try { LD.man = !!A.setManifest(e.data); } catch (er) { LD.man = false; } } PRE().drop('assets/manifest.json'); return LD.man; }, () => false); }
/* asa: as metades (ou a imagem única); o .json diz qual. Enquanto o .json não chega, pede as duas metades (anjo, demônio e as 8 novas são par L/R) */
function wingList(kind){ const M = PRE().json('assets/anim/equip/wing_' + kind + '.json'), b = 'assets/anim/equip/wing_' + kind; if (M && M.single){ wingPart(kind, ''); return [b + '.png']; } wingPart(kind, 'L'); wingPart(kind, 'R'); return [b + '_L.png', b + '_R.png']; }
/* imagens que já estão na tela do jogo (cabeçalho, menu, botões): <img> visíveis e fundos em CSS dentro de #app, fora desta tela de carregamento. Uma varredura só. */
function domImages(){ const out = [], app = document.getElementById('app'); if (!app || !app.querySelectorAll) return out; const here = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, ''), rel = u => (u.indexOf(here) === 0 ? u.slice(here.length) : u).replace(/\?.*$/, '');
  try { app.querySelectorAll('img').forEach(im => { const u = im.currentSrc || im.src; if (u && !/^data:/.test(u) && im.offsetParent !== null && !im.closest('#loading')) out.push(rel(u)); });
    app.querySelectorAll('button, .ico, [class*="ic"], [class*="btn"], [id^="fb_"]').forEach(el => { if (el.offsetParent === null || el.closest('#loading')) return; const m = /url\(["']?([^"')]+)["']?\)/.exec(getComputedStyle(el).backgroundImage || ''); if (m && !/^data:/.test(m[1])) out.push(rel(m[1])); }); } catch (e) {}
  return out.filter((u, i) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(u) && out.indexOf(u) === i); }
/* põe a lista na barra */
function sceneQueue(old){ if (old){ const era = eraOf(S.stage), ae = SKIN(S.skinEq.armor), we = heroLook().weapon;   /* lista de ANTES (só para comparar): sem montaria, pet, asa, pistola, cabeçalho, fontes */
    heroPreload(ae.e).forEach(loadTrack); [wPng(we), hp('hero', ae.e, tierOf(ae.r))].forEach(p => { IMG(p); PRE().track(p); }); EN_IDS(era).forEach(k => { enPreload(k).forEach(loadTrack); IMG(`assets/enemies/${k}.png`); PRE().track(`assets/enemies/${k}.png`); });
    const sc = sceneGet(era); if (sc) loadTrack(sc.ready); return; }
  const L = sceneList(); L.urls.forEach(u => PRE().track(u)); L.tasks.forEach(t => PRE().track(t.p, t.label)); LD.list = L;
  if (DEBUG) console.info('Cena: ' + L.urls.length + ' arquivos + ' + L.tasks.length + ' tarefas bloqueiam; ' + L.later.length + ' ícones depois; manifesto de Sistemas ' + (LD.man ? 'carregado' : 'AUSENTE (lista só do jogo)'));
  LD.later = L.later || []; }   /* resto dos ícones: em segundo plano, SÓ DEPOIS de a cena fechar (loadLater, chamado quando a barra chega ao fim): antes entravam 1,5 s depois e disputavam a fila com a cena */
function loadLater(){ const L = LD.later; LD.later = null; if (L && L.length) PRE().ready(L, { timeout: 600000 }); }

/* ---------- TROCA DE ERA e TROCA DE EQUIPAMENTO: pré-carga em segundo plano ----------
   eraReady(era) → true quando cenário, inimigos e chefe da era estão decodificados; a 1ª chamada dispara a carga (o jogo chama para a PRÓXIMA era a partir da
   fase 8 e segura a entrada na era nova enquanto for false; js/battle.js). Falha ou 25 s sem resposta = libera com a reserva de sempre (nunca trava). Só a era
   atual e a próxima ficam na memória: sceneTrim solta os cenários vivos das outras. */
const ERA_P = {}, LOAD_STALL_S = 15;
function eraReady(era){ if (era < 0 || era >= ERAS.length) return true; let o = ERA_P[era]; if (!o){ o = ERA_P[era] = { ok: false }; const go = () => { let L; try { L = sceneList({ era, part: 'era' }); } catch (e) { console.error('eraReady', e); o.ok = true; return; }
      Promise.all([PRE().ready(L.urls, { timeout: 25000 }), PRE().all(L.tasks.map(t => t.p), 25000)]).then(r => { o.ok = true; if (r[0] && r[0].failed.length) console.warn('Preload: era ' + era + ' entra com reserva para', r[0].failed); }, () => { o.ok = true; }); };
    loadManifest().then(go, go); }
  return o.ok; }
/* solta os cenários vivos que não são da era atual nem da próxima (memória; o celular chegou a ~800 MB) */
function sceneTrim(){ const cur = eraOf(S.stage); for (const k in SCN.list){ const e = +k, s = SCN.list[k]; if (e === cur || e === cur + 1 || e === SCN.force || s === SCN.cur || (B.dispEra === e)) continue;
    s.dead = true; try { if (s.api){ if (typeof s.api.release === 'function') s.api.release(); else s.api.stop(); } } catch (er) {}   /* Engenheiro 10: cena DESCARTADA solta os bitmaps fixados (api.release do scene.js, b1a3981); a cena guardada (era atual e a próxima) só para (stop) */
    try { s.cv.width = s.cv.height = 1; s.cv.remove(); } catch (er) {} delete SCN.list[k]; delete ERA_P[k]; } }

function initLoading(){
  const el = LD.el = document.getElementById('loading'); if (!el) return;
  if ((DEBUG && QP.has('skip')) || (typeof LIVE_SKIP !== 'undefined' && LIVE_SKIP)){ el.remove(); LD.closed = true; loadManifest(); return; }   /* o manifesto vale mesmo sem a barra (Sys.assets.mountedArt: Kaia montada) */
  const app = document.getElementById('app');
  const fit = () => { const r = app.getBoundingClientRect(); if (r.height) el.style.setProperty('--s', (r.height / 844).toFixed(4)); };
  fit(); addEventListener('resize', fit);
  document.getElementById('lver').textContent = 'Versão ' + VERSION.replace(/^v/, '');
  LD.t0 = performance.now();

  /* --- fila real de pré-carregamento (Engenheiro 5): a lista da PRIMEIRA CENA sai de sceneList(); cada arquivo conta na barra --- */
  PRE().reset(); LD.old = window.PRELOAD_NEW !== true || (DEBUG && QP.get('carga') === 'antiga');   /* PADRÃO = caminho ANTIGO (ordem do PO); o novo só com ?debug=1&carga=nova (chave window.PRELOAD_NEW, js/preload.js) */
  try { const OB = window.OnlineBoot; if (OB && OB.state().on) PRE().track(OB.wait(4000), 'online'); } catch (e) {}   /* Engenheiro 12: a barra espera o online (sessão + save da nuvem) no máximo 4 s; desligado = nenhuma tarefa a mais (js/onlineboot.js) */
  if (LD.old) loadManifest();   /* fora da barra: só para o Sys.assets.mountedArt (Kaia montada) */   /* ?debug=1&carga=antiga: só a lista de antes e a fuga dos 15 s (para comparar o defeito); nunca para o jogador */
  const era = eraOf(S.stage);
  /* um erro aqui NUNCA deixa a barra parada: registra no console e entra pela lista antiga; o cão de guarda abaixo libera a tela se o laço da barra morrer */
  const queue = () => { try { sceneQueue(LD.old); } catch (er) { console.error('Carregamento: a lista da cena falhou; entrando pelo caminho antigo', er); try { sceneQueue(true); } catch (e2) { console.error(e2); } } };
  if (LD.old) queue(); else { let done; PRE().track(new Promise(ok => { done = ok; }), 'manifesto'); loadManifest().then(queue, queue).then(() => done(true)); }   /* 1º o manifesto (Sys.assets.sceneSet precisa dele), depois a lista */
  ['assets/brand/title_bg.png', 'assets/brand/logo.png'].forEach(p => PRE().track(p));
  ['assets/audio/manifest.json', 'assets/audio/music/title.mp3', `assets/audio/music/era${era}.mp3`].forEach(p => loadTrack(fetch(p).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null), 'som ' + p));   // aquece o cache do navegador (a decodificação é do GameAudio, depois do 1º toque)
  /* fundos das 7 eras desta própria tela (o chão de cada um cai na linha dos pés: 78% da altura) */
  const bgMeta = fetch('assets/bg/meta.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  /* linha dos pés da tela de carregamento: 658 de 844 (jogo de hoje) ou 640 com a 04b ligada (mesma linha da batalha em tela cheia) */
  const LOAD_FEET = 640;
  if (LOAD_FEET !== 658){ const lr = document.getElementById('lrun'); if (lr) lr.style.top = (507 - (658 - LOAD_FEET)) + 'px'; }
  /* Engenheiro 7 (ordem do PO): com o fundo de abertura (classe lsplash no #loading, index.html) NÃO há travessia: nenhum cenário das 7 eras é criado só para
     enfeitar esta tela (medido: os 7 cenários vivos seguravam a barra de 5 a 17 s com todos os arquivos da cena prontos em 2,4 s) nem a corrida do Kael. */
  LD.splash = el.classList.contains('lsplash');
  if (LD.splash) document.getElementById('lstep').textContent = 'Carregando…';
  if (!LD.splash) LOAD_ERAS.forEach((n, i) => { const d = document.getElementById('lbg' + i), path = `assets/bg/era${i}.png`;
    if (sceneOn(i) && d){   // era com cenário novo aprovado (sceneV2): a própria cena viva, com o chão do meta na linha dos pés (658 de 844)
      const base = `assets/bg/v2/era${i}/`;
      loadTrack(fetch(base + 'meta.json').then(r => r.json()).then(meta => { const c = document.createElement('canvas'); c.className = 'lbg lscn'; c.id = 'lbg' + i;
          const w = Math.ceil(d.parentNode.clientWidth) || 390, h = Math.round(LOAD_FEET / (meta.groundY || 0.78)); c.style.width = w + 'px'; c.style.height = h + 'px'; d.replaceWith(c);
          return EonScene.create(c, { base, meta, hero: false, running: true, autoStart: false, width: w, height: h, dpr: Math.min(2, window.devicePixelRatio || 1) }); })
        .then(api => { LD.scn[i] = api; return api.ready; }).then(() => { LD.bg[i] = true; }).catch(() => {}), 'travessia: cenário vivo ' + i);
      return; }
    loadTrack(Promise.all([loadImgP(path), bgMeta]).then(([im, m]) => { if (!im || !d) return;
      const g = (m['era' + i] || {}).groundY || 0.72, pw = 1100 * im.naturalWidth / im.naturalHeight;
      d.style.backgroundImage = `url(${path})`; d.style.setProperty('--pw', pw.toFixed(1)); d.style.setProperty('--py', (LOAD_FEET - g * 1100).toFixed(1)); d.style.animationDuration = (pw / 241).toFixed(2) + 's'; LD.bg[i] = true; })); });
  if (!LD.splash) loadTrack(loadImgP(LOAD_RUN).then(im => { if (im) document.getElementById('lrun').classList.add('ok'); }), 'travessia: corrida');

  /* "Toque para continuar": o toque fecha a tela e NÃO pode atravessar para o botão que está embaixo (no APK abria Configurações). O clique que o
     navegador gera logo depois do pointerup é engolido por 500 ms. */
  el.addEventListener('pointerup', ev => { if (LD.fin && !(DEBUG && QP.has('lhold'))){ ev.preventDefault(); ev.stopPropagation();
      const eat = e => { e.stopPropagation(); e.preventDefault(); }; ['click', 'pointerdown', 'pointerup', 'touchend'].forEach(t => document.addEventListener(t, eat, true));
      setTimeout(() => ['click', 'pointerdown', 'pointerup', 'touchend'].forEach(t => document.removeEventListener(t, eat, true)), 500); closeLoading(); } });
  el.addEventListener('keydown', ev => { if (LD.fin && (ev.key === 'Enter' || ev.key === ' ')) closeLoading(); });
  try { loadStep(); } catch (e) { console.error(e); }                                     /* 1º estado da barra e 1ª dica já no boot, sem esperar quadro */
  if (!(DEBUG && QP.get('semraf') === '1')) requestAnimationFrame(loadTick);             /* ?debug=1&semraf=1: prova que a barra anda e fecha SEM nenhum quadro (só o temporizador) */
  LD.iv =setInterval(() => { if (LD.closed){ clearInterval(LD.iv); return; } try { loadStep(); } catch (e) { console.error(e); } }, 400);   /* anda sem quadros (segundo plano) */
  document.addEventListener('visibilitychange', () => { if (!LD.closed){ try { loadStep(); } catch (e) {} } });
  /* cão de guarda: se o próprio laço da barra morrer por um erro, a tela libera o toque sozinha depois do tempo-limite geral */
  const dog = () => { if (LD.fin || LD.closed) return;   /* só age se o LAÇO morreu: página visível e nenhum loadTick há mais de 20 s */
    if (document.hidden || !LD.lastT || performance.now() - LD.lastT < 20000){ setTimeout(dog, 5000); return; }
    console.warn('Carregamento: cão de guarda liberou a tela'); LD.fin = true; try { document.getElementById('lstep').textContent = 'Pronto!'; el.classList.add('done'); } catch (e) {} };
  LD.lastT = performance.now(); setTimeout(dog, 5000);
}
/* Engenheiro 7 (impedimento do APK, QA): a barra NÃO depende de requestAnimationFrame. Aba/app em segundo plano não recebe quadros: a carga já era por
   promessas, mas a barra, o "Pronto!" e o aviso de falha só andavam no rAF (visto pelo QA: 0% parado). loadStep() é chamado pelo rAF (suave, em primeiro
   plano), por um temporizador de 400 ms (anda em segundo plano), a cada troca de visibilidade e direto no boot. O tempo vem do relógio (performance.now). */
function loadTick(){ if (LD.closed) return; loadStep(); requestAnimationFrame(loadTick); }
function loadStep(){
  if (LD.closed) return; const now = performance.now();
  /* Engenheiro 7 (decisão do PO): NADA estoura por tempo total. Enquanto houver progresso a barra continua, por mais lenta que a rede esteja. O aviso
     "Confira a conexão" só aparece (a) quando NADA progrediu por LOAD_STALL_S s com arquivos ainda pendentes (some sozinho se o progresso voltar) ou (b) quando
     tudo terminou e algum arquivo falhou de verdade (erro do servidor / arquivo inexistente depois das tentativas). Página escondida não conta (Preload.idle). */
  LD.lastT = performance.now();
  const el = LD.el, minDur = Math.max(0.3, +(DEBUG && QP.get('ldur')) || 2.4), el_s = (now - LD.t0) / 1000;
  const PG = PRE().progress, pend = PG.total - PG.done, idle = +PRE().idle || 0; let real = PG.total ? PG.done / PG.total : 1; if (LD.old && el_s > 15) real = 1;   /* progresso REAL: arquivos prontos ÷ total */
  if (LD.skipFail) real = 1; else if (LD.retrying) real = Math.min(real, 0.99);
  if (!LD.skipFail && !LD.old && !LD.retrying){
    if (LD.failUI && LD.failUI.stall && (pend <= 0 || idle < 3000)) loadFailOff();                                                   /* o progresso voltou: o aviso sai sozinho */
    if (PG.total && pend <= 0 && PG.failed.length){ loadFail(PG, false); return; }                 /* faltou arquivo: para e oferece "Tentar de novo" */
    if (pend > 0 && idle > LOAD_STALL_S * 1000 && !LD.failUI) loadFail(PG, true); }                                                   /* rede parada: avisa, e a carga continua por trás */
  document.getElementById('lstep').dataset.n = PG.done + '/' + PG.total;
  const cap = Math.min(1, el_s / minDur);                                                        // duração mínima: dá tempo de ver a travessia
  LD.shown = Math.max(LD.shown, Math.min(real, cap));
  /* Engenheiro 2 (QA): a travessia vai da Pré-História até a ERA DO JOGADOR e para nela (jogador novo: só Pré-História); o rótulo é só o nome da era, sem "de 7" */
  const pe = Math.max(0, Math.min(6, eraOf(S.stage))), p = Math.floor(LD.shown * 100), ei = Math.min(pe, Math.floor(LD.shown * (pe + 1)));
  document.getElementById('lbar').style.width = p + '%'; document.getElementById('lbarw').setAttribute('aria-valuenow', p);
  document.getElementById('lpct').textContent = p + '%';
  if (LD.splash){ if (LD.era !== 0){ LD.era = 0; document.getElementById('lstep').textContent = 'Carregando…'; } }
  else if (ei !== LD.era || !LD.bgOn){ LD.era = ei; LD.bgOn = !!LD.bg[ei];
    for (let i = 0; i < 7; i++){ const on = i === ei && LD.bg[i]; document.getElementById('lbg' + i).style.opacity = on ? 1 : 0; const a = LD.scn[i]; if (a){ if (on) a.start(); else a.stop(); } }
    const pill = document.getElementById('lpill'), tx = LOAD_ERAS[ei]; if (pill.textContent !== tx){ pill.textContent = tx; pill.classList.remove('erapill'); void pill.offsetWidth; pill.classList.add('erapill'); }
    document.getElementById('lstep').textContent = `Atravessando a ${LOAD_ERAS[ei]}…`; }
  const ti = Math.floor(Math.max(p / 26, el_s / 3.5)) % LOAD_TIPS.length, tnow = Date.now();
  if (ti !== LD.tip && p < 100 && (LD.tip < 0 || tnow - (LD.tipAt || 0) >= 4000)){ LD.tip = ti; LD.tipAt = tnow;   /* cada dica fica pelo menos 4 s (dono: trocavam rápido demais para ler) */ const tp = document.getElementById('ltip'); tp.querySelector('span').textContent = LOAD_TIPS[ti]; tp.classList.remove('tip'); void tp.offsetWidth; tp.classList.add('tip'); }
  if (p >= 100 && !LD.fin){ LD.fin = true; loadLater(); LD.finMs = Math.round(now - LD.t0); if (DEBUG) console.info('Carregamento: pronto em ' + (LD.finMs / 1000).toFixed(1) + ' s (' + PG.done + '/' + PG.total + ', falhas ' + PG.failed.length + ')');
{ const b = document.getElementById('lbar'); if (b){ b.style.transition = 'none'; b.style.width = '100%'; } }   /* L2 (QA): a barra animava atrás do número ("Pronto! 100%" com a barra em ~75%): no "Pronto!" ela salta para o fim, sem transição */
document.getElementById('lstep').textContent = 'Pronto!'; el.classList.add('done'); el.setAttribute('tabindex', '0'); try { el.focus({ preventScroll: true }); } catch (e) {} }
}
/* arquivos que não vieram depois das tentativas automáticas: aviso claro + "Tentar de novo" (recarrega só os que faltam) + "Continuar mesmo assim"
   (entra com a reserva de sempre para esses arquivos; a lista fica no console). Nunca trava para sempre. */
/* L1 (QA, 288 px): o aviso de falha (texto + nomes + 2 botões, que quebram linha em tela estreita) cresce para cima e cobria a linha "Faltam N de M · 97%" da barra.
   Com o aviso na tela, a caixa da barra sobe para ficar logo ACIMA do rodapé (medido em px do .lwrap, antes da escala); sem o aviso volta ao CSS. */
function loadFailFit(){ const el = LD.el, foot = el && el.querySelector('.lfoot'), bb = el && el.querySelector('.lbarbox'); if (!foot || !bb) return;
  if (!LD.failUI){ bb.style.bottom = ''; return; } const h = foot.offsetHeight || 0; bb.style.bottom = Math.max(120, 36 + h + 12) + 'px'; }
function loadFailOff(){ const box = LD.failUI; if (!box) return; box.remove(); LD.failUI = null; loadFailFit(); const tip = document.getElementById('ltip'); if (tip) tip.style.display = ''; LD.era = -1; }   /* LD.era = -1: o texto "Atravessando..." volta no próximo quadro */
/* solta dos caches do jogo tudo o que ficou marcado com falha (folhas, imagens, tabelas vazias, asas, cenários vivos, camadas e montaria parada): o próximo
   desenho pede de novo ao pré-carregador. Usado pelo "Tentar de novo" da tela de carregamento e pela recuperação sozinha do Preload (rede que voltou). */
function artDropFailed(){
  try { for (const k in SHEETS) if (SHEETS[k].fail) delete SHEETS[k]; } catch (e) {} try { for (const k in IMGS) if (IMGS[k].fail) delete IMGS[k]; } catch (e) {}
  try { for (const k in JSONS) if (JSONS[k] && !Object.keys(JSONS[k]).length) delete JSONS[k]; } catch (e) {} try { for (const k in WING_IMG) if (!WING_IMG[k].ok) delete WING_IMG[k]; } catch (e) {}
  try { for (const k in SCN.list) if (SCN.list[k].fail) delete SCN.list[k]; } catch (e) {}
  try { if (typeof LAYI !== 'undefined') for (const k in LAYI) if (LAYI[k].fail) delete LAYI[k]; } catch (e) {} try { if (typeof MOUNT_STILL !== 'undefined') for (const k in MOUNT_STILL) if (MOUNT_STILL[k].fail) delete MOUNT_STILL[k]; } catch (e) {} }
try { if (window.Preload && typeof Preload.onRecover === 'function') Preload.onRecover(() => { artDropFailed(); try { if (typeof FORM !== 'undefined') FORM.t = -1e9; } catch (e) {} }); } catch (e) {}
function loadFail(PG, stall){ if (LD.failUI) return; const foot = LD.el.querySelector('.lfoot'), box = document.createElement('div'); LD.failUI = box; box.id = 'lfail'; box.stall = !!stall;
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%';
  const n = stall ? PG.total - PG.done : PG.failed.length, bt = 'min-height:44px;padding:0 18px;border-radius:12px;font:800 15px Nunito,system-ui,sans-serif;cursor:pointer;';
  /* NOMES (ordem do PO): o aviso e o console dizem QUEM falta (arquivo ou tarefa): os 3 primeiros na tela, todos no console */
  const names = (stall ? (PRE().pending || []) : PG.failed).slice(), shortN = s => String(s).replace(/^.*\//, '').replace(/[<>&]/g, ''), who = names.slice(0, 3).map(shortN).join(', ') + (names.length > 3 ? ' e mais ' + (names.length - 3) : '');
  box.innerHTML = '<p style="margin:0;font-size:13px;font-weight:800;color:#ffd7a8;text-align:center">' + (stall ? 'O carregamento parou.' : n === 1 ? '1 arquivo não carregou.' : n + ' arquivos não carregaram.') + ' Confira a conexão.</p>' +
    (who ? '<p id="lwho" style="margin:0;font-size:11px;font-weight:700;color:#cfc6ea;text-align:center;word-break:break-word">Falta: ' + who + '</p>' : '') +
    '<div style="display:flex;gap:10px"><button type="button" id="lretry" style="' + bt + 'flex:0 0 auto;white-space:nowrap;border:2px solid #7a4a12;background:#ffc94a;color:#3a2206">Tentar de novo</button>' +
    '<button type="button" id="lskip" style="' + bt + 'border:2px solid #6a5a48;background:#2a2019;color:#f6ecdf">Continuar mesmo assim</button></div>';
  document.getElementById('lstep').textContent = 'Faltam ' + n + ' de ' + PG.total + ' arquivos'; const tip = document.getElementById('ltip'); if (tip) tip.style.display = 'none'; foot.appendChild(box); loadFailFit();
  console.warn(stall ? 'Carregamento: nada progrediu por ' + LOAD_STALL_S + ' s; pendentes (' + n + '): ' + names.join(' | ') : 'Carregamento: arquivos que faltaram: ' + names.join(' | '));
  const off = ev => ev.stopPropagation();
  box.querySelector('#lretry').addEventListener('pointerup', off); box.querySelector('#lskip').addEventListener('pointerup', off);
  box.querySelector('#lretry').addEventListener('click', () => { const wasStall = box.stall; loadFailOff(); document.getElementById('lstep').textContent = 'Tentando de novo…';
    if (wasStall){ PRE().retry(); PRE().track(Promise.resolve(true), 'nova tentativa'); return; }   /* rede parada: os pedidos pendentes seguem (cada um se refaz sozinho); a tarefa vazia marca progresso e dá mais LOAD_STALL_S s antes de avisar de novo */
    /* só o que falhou: solta as folhas/imagens marcadas com falha nos caches do jogo e pede de novo pela mesma lista */
    artDropFailed();
    LD.retrying = true; const again = () => { PRE().reset(); try { sceneQueue(false); } catch (er) { console.error(er); } LD.retrying = false; };   /* enquanto refaz, o laço não reabre o aviso com a conta do lote anterior */
    PRE().retry().then(again, again); });
  box.querySelector('#lskip').addEventListener('click', () => { loadFailOff(); LD.skipFail = true; }); }
function closeLoading(){
  if (LD.closed) return; LD.closed = true; const el = LD.el;
  el.classList.add('out'); setTimeout(() => { LD.scn.forEach(a => { try { if (a) (a.release || a.stop).call(a); } catch (e) {} }); el.remove(); }, 480);   /* cenas da tela de carregamento: descartadas → soltam os bitmaps */
  if (typeof unlockAudio === 'function') unlockAudio();        // 1º toque: destrava o som e entra o tema do título
  if (typeof music === 'function') music('title');
}
