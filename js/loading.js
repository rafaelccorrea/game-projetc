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
function loadTrack(p){ PRE().track(Promise.resolve(p).then(() => true, () => true)); }
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
    const sc = sceneGet(era); if (sc) tasks.push({ label: 'cenário vivo da era ' + era, p: Promise.resolve(sc.ready).then(() => !sc.fail && !!sc.api && Promise.resolve(sc.api.ready).then(() => true)) }); else { IMG(`assets/bg/era${era}.png`); add(`assets/bg/era${era}.png`); }
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
    { const mo = opt.mount !== undefined ? opt.mount : lk.mount; if (mo && mo.id && typeof mountSheet === 'function') for (const st of ['idle', 'run', 'attack']) sheet(mountSheet(mo.id, st)); }
    { const b = opt.pet !== undefined ? opt.pet : (typeof petInfo === 'function' && (PETK.infoT = 0, petInfo()) ? PETK.base : ''); if (b) for (const st of ['idle', 'run', 'atk1']) sheet(sheetLoad(PET_DIR + b + '_' + st, true)); }
    { const wg = opt.wing !== undefined ? opt.wing : wingNow(lk); if (wg){ const j = 'assets/anim/equip/wing_' + wg + '.json'; J(j); add(j); wingList(wg).forEach(add); } }
    { const E = Math.min(SKN.length - 1, ws.e), P = ultPlan(wArm(), E); if (P){ IMG(P.sheet + '.png'); J(P.sheet + '.json'); add(P.sheet + '.png'); add(P.sheet + '.json'); }
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
    if (A && LD.man){ let R = null, groups = ['hero', 'weapon', 'ult', 'mount', 'pet', 'wing', 'era', 'enemies'];
      if (part === 'era'){ groups = ['era', 'enemies']; R = (era === cur + 1 && typeof A.nextEraSet === 'function') ? A.nextEraSet(S, Sys.host) : (typeof A.sceneSet === 'function' ? A.sceneSet(S, Sys.host, { era }) : null); }
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
  return LD.manP = PRE().limit(PRE().get('assets/manifest.json').p.then(e => { if (e.ok){ try { LD.man = !!A.setManifest(e.data); } catch (er) { LD.man = false; } } PRE().drop('assets/manifest.json'); return LD.man; }), 15000); }
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
  if (L.later && L.later.length) setTimeout(() => { PRE().ready(L.later, { timeout: 120000 }); }, 1500); }   /* resto dos ícones: em segundo plano, depois da cena (as telas esperam por PRE().ready) */

/* ---------- TROCA DE ERA e TROCA DE EQUIPAMENTO: pré-carga em segundo plano ----------
   eraReady(era) → true quando cenário, inimigos e chefe da era estão decodificados; a 1ª chamada dispara a carga (o jogo chama para a PRÓXIMA era a partir da
   fase 8 e segura a entrada na era nova enquanto for false; js/battle.js). Falha ou 25 s sem resposta = libera com a reserva de sempre (nunca trava). Só a era
   atual e a próxima ficam na memória: sceneTrim solta os cenários vivos das outras. */
const ERA_P = {}, LOAD_MAX_S = 60;
function eraReady(era){ if (era < 0 || era >= ERAS.length) return true; let o = ERA_P[era]; if (!o){ o = ERA_P[era] = { ok: false }; const go = () => { let L; try { L = sceneList({ era, part: 'era' }); } catch (e) { console.error('eraReady', e); o.ok = true; return; }
      Promise.all([PRE().ready(L.urls, { timeout: 25000 }), PRE().all(L.tasks.map(t => t.p), 25000)]).then(r => { o.ok = true; if (r[0] && r[0].failed.length) console.warn('Preload: era ' + era + ' entra com reserva para', r[0].failed); }, () => { o.ok = true; }); };
    loadManifest().then(go, go); }
  return o.ok; }
/* solta os cenários vivos que não são da era atual nem da próxima (memória; o celular chegou a ~800 MB) */
function sceneTrim(){ const cur = eraOf(S.stage); for (const k in SCN.list){ const e = +k, s = SCN.list[k]; if (e === cur || e === cur + 1 || e === SCN.force || s === SCN.cur || (B.dispEra === e)) continue;
    try { if (s.api) s.api.stop(); } catch (er) {} try { s.cv.width = s.cv.height = 1; s.cv.remove(); } catch (er) {} delete SCN.list[k]; delete ERA_P[k]; } }

function initLoading(){
  const el = LD.el = document.getElementById('loading'); if (!el) return;
  if (DEBUG && QP.has('skip')){ el.remove(); LD.closed = true; return; }
  const app = document.getElementById('app');
  const fit = () => { const r = app.getBoundingClientRect(); if (r.height) el.style.setProperty('--s', (r.height / 844).toFixed(4)); };
  fit(); addEventListener('resize', fit);
  document.getElementById('lver').textContent = 'Versão ' + VERSION.replace(/^v/, '');
  LD.t0 = performance.now();

  /* --- fila real de pré-carregamento (Engenheiro 5): a lista da PRIMEIRA CENA sai de sceneList(); cada arquivo conta na barra --- */
  PRE().reset(); LD.old = DEBUG && QP.get('carga') === 'antiga';   /* ?debug=1&carga=antiga: só a lista de antes e a fuga dos 15 s (para comparar o defeito); nunca para o jogador */
  const era = eraOf(S.stage);
  /* um erro aqui NUNCA deixa a barra parada: registra no console e entra pela lista antiga; o tempo-limite geral (LOAD_MAX_S, no loadTick) fecha a barra de qualquer jeito */
  const queue = () => { try { sceneQueue(LD.old); } catch (er) { console.error('Carregamento: a lista da cena falhou; entrando pelo caminho antigo', er); try { sceneQueue(true); } catch (e2) { console.error(e2); } } };
  if (LD.old) queue(); else { let done; PRE().track(new Promise(ok => { done = ok; }), 'manifesto'); loadManifest().then(queue, queue).then(() => done(true)); }   /* 1º o manifesto (Sys.assets.sceneSet precisa dele), depois a lista */
  ['assets/brand/title_bg.png', 'assets/brand/logo.png'].forEach(p => PRE().track(p));
  ['assets/audio/manifest.json', 'assets/audio/music/title.mp3', `assets/audio/music/era${era}.mp3`].forEach(p => loadTrack(fetch(p).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null)));   // aquece o cache do navegador (a decodificação é do GameAudio, depois do 1º toque)
  /* fundos das 7 eras desta própria tela (o chão de cada um cai na linha dos pés: 78% da altura) */
  const bgMeta = fetch('assets/bg/meta.json').then(r => r.ok ? r.json() : {}).catch(() => ({}));
  /* linha dos pés da tela de carregamento: 658 de 844 (jogo de hoje) ou 640 com a 04b ligada (mesma linha da batalha em tela cheia) */
  const LOAD_FEET = 640;
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
  /* cão de guarda: se o próprio laço da barra morrer por um erro, a tela libera o toque sozinha depois do tempo-limite geral */
  setTimeout(() => { if (!LD.fin && !LD.closed && !LD.failUI){ console.warn('Carregamento: cão de guarda liberou a tela'); LD.fin = true; try { document.getElementById('lstep').textContent = 'Pronto!'; el.classList.add('done'); } catch (e) {} } }, (LOAD_MAX_S + 6) * 1000);
}
function loadTick(now){
  if (LD.closed) return;
  const el = LD.el, minDur = Math.max(0.3, +(DEBUG && QP.get('ldur')) || 2.4), el_s = (now - LD.t0) / 1000;
  const PG = PRE().progress; let real = PG.total ? PG.done / PG.total : 1; if (LD.old && el_s > 15) real = 1;   /* progresso REAL: arquivos prontos ÷ total. Cada arquivo tem tempo-limite e 3 tentativas (js/preload.js): a barra sempre chega ao fim */
  if (el_s > LOAD_MAX_S && !LD.failUI && !LD.skipFail){ LD.skipFail = true; console.warn('Carregamento: tempo-limite geral de ' + LOAD_MAX_S + ' s; entrando com o que carregou', PG); }   /* nunca fica preso */
  if (LD.skipFail) real = 1;
  if (PG.total && PG.done >= PG.total && PG.failed.length && !LD.skipFail && !LD.old){ loadFail(PG); requestAnimationFrame(loadTick); return; }   /* faltou arquivo: para e oferece "Tentar de novo" */
  document.getElementById('lstep').dataset.n = PG.done + '/' + PG.total;
  const cap = Math.min(1, el_s / minDur);                                                        // duração mínima: dá tempo de ver a travessia
  LD.shown = Math.max(LD.shown, Math.min(real, cap));
  /* Engenheiro 2 (QA): a travessia vai da Pré-História até a ERA DO JOGADOR e para nela (jogador novo: só Pré-História); o rótulo é só o nome da era, sem "de 7" */
  const pe = Math.max(0, Math.min(6, eraOf(S.stage))), p = Math.floor(LD.shown * 100), ei = Math.min(pe, Math.floor(LD.shown * (pe + 1)));
  document.getElementById('lbar').style.width = p + '%'; document.getElementById('lbarw').setAttribute('aria-valuenow', p);
  document.getElementById('lpct').textContent = p + '%';
  if (ei !== LD.era || !LD.bgOn){ LD.era = ei; LD.bgOn = !!LD.bg[ei];
    for (let i = 0; i < 7; i++){ const on = i === ei && LD.bg[i]; document.getElementById('lbg' + i).style.opacity = on ? 1 : 0; const a = LD.scn[i]; if (a){ if (on) a.start(); else a.stop(); } }
    const pill = document.getElementById('lpill'), tx = LOAD_ERAS[ei]; if (pill.textContent !== tx){ pill.textContent = tx; pill.classList.remove('erapill'); void pill.offsetWidth; pill.classList.add('erapill'); }
    document.getElementById('lstep').textContent = `Atravessando a ${LOAD_ERAS[ei]}…`; }
  const ti = Math.floor(Math.max(p / 26, el_s / 3.5)) % LOAD_TIPS.length;
  if (ti !== LD.tip && p < 100){ LD.tip = ti; const tp = document.getElementById('ltip'); tp.querySelector('span').textContent = LOAD_TIPS[ti]; tp.classList.remove('tip'); void tp.offsetWidth; tp.classList.add('tip'); }
  if (p >= 100 && !LD.fin){ LD.fin = true; document.getElementById('lstep').textContent = 'Pronto!'; el.classList.add('done'); el.setAttribute('tabindex', '0'); try { el.focus({ preventScroll: true }); } catch (e) {} }
  requestAnimationFrame(loadTick);
}
/* arquivos que não vieram depois das tentativas automáticas: aviso claro + "Tentar de novo" (recarrega só os que faltam) + "Continuar mesmo assim"
   (entra com a reserva de sempre para esses arquivos; a lista fica no console). Nunca trava para sempre. */
function loadFail(PG){ if (LD.failUI) return; const foot = LD.el.querySelector('.lfoot'), box = document.createElement('div'); LD.failUI = box; box.id = 'lfail';
  box.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;width:100%';
  const n = PG.failed.length, bt = 'min-height:44px;padding:0 18px;border-radius:12px;font:800 15px Nunito,system-ui,sans-serif;cursor:pointer;';
  box.innerHTML = '<p style="margin:0;font-size:13px;font-weight:800;color:#ffd7a8;text-align:center">' + (n === 1 ? '1 arquivo não carregou.' : n + ' arquivos não carregaram.') + ' Confira a conexão.</p>' +
    '<div style="display:flex;gap:10px"><button type="button" id="lretry" style="' + bt + 'border:2px solid #7a4a12;background:#ffc94a;color:#3a2206">Tentar de novo</button>' +
    '<button type="button" id="lskip" style="' + bt + 'border:2px solid #6a5a48;background:#2a2019;color:#f6ecdf">Continuar mesmo assim</button></div>';
  document.getElementById('lstep').textContent = 'Faltam ' + n + ' de ' + PG.total + ' arquivos'; const tip = document.getElementById('ltip'); if (tip) tip.style.display = 'none'; foot.appendChild(box);
  console.warn('Carregamento: arquivos que faltaram', PG.failed);
  const off = ev => ev.stopPropagation();
  box.querySelector('#lretry').addEventListener('pointerup', off); box.querySelector('#lskip').addEventListener('pointerup', off);
  box.querySelector('#lretry').addEventListener('click', () => { box.remove(); LD.failUI = null; if (tip) tip.style.display = ''; document.getElementById('lstep').textContent = 'Tentando de novo…';
    /* só o que falhou: solta as folhas/imagens marcadas com falha nos caches do jogo e pede de novo pela mesma lista */
    for (const k in SHEETS) if (SHEETS[k].fail) delete SHEETS[k]; for (const k in IMGS) if (IMGS[k].fail) delete IMGS[k]; for (const k in JSONS) if (JSONS[k] && !Object.keys(JSONS[k]).length) delete JSONS[k]; for (const k in WING_IMG) if (!WING_IMG[k].ok) delete WING_IMG[k];
    for (const k in SCN.list) if (SCN.list[k].fail) delete SCN.list[k];
    PRE().retry().then(() => { PRE().reset(); sceneQueue(false); }); });
  box.querySelector('#lskip').addEventListener('click', () => { box.remove(); LD.failUI = null; LD.skipFail = true; }); }
function closeLoading(){
  if (LD.closed) return; LD.closed = true; const el = LD.el;
  el.classList.add('out'); setTimeout(() => { LD.scn.forEach(a => { try { a && a.stop(); } catch (e) {} }); el.remove(); }, 480);
  if (typeof unlockAudio === 'function') unlockAudio();        // 1º toque: destrava o som e entra o tema do título
  if (typeof music === 'function') music('title');
}
