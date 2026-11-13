'use strict';
/* ================= ONLINE NA ABERTURA (Engenheiro 12) =================
   Liga a camada do Servidor (js/sys/net.js + js/sys/online.js, SÓ LEITURA) ao jogo. Todo o código da ligação fica neste arquivo.
   CHAVE ÚNICA: const ONLINE_ON no index.html (false = DESLIGADO: nada é chamado, custo zero). Em debug: ?debug=1&online=1 liga só nesta carga,
   ?debug=1&online=0 desliga, ?debug=1&onlinebase=<url> troca o endereço (servidor de teste). Pagamento real (Sys.buy.DATA.on) NÃO é tocado aqui.
   NUNCA liga: no Modo dono; com save de outro servidor (REALM_MISMATCH); com as gravações bloqueadas (window.__noSave: ?fresh=1, ?era=...).

   window.OnlineBoot:
     start()          → chamado UMA vez no arranque (index.html, depois do save e dos módulos): liga as chaves, aplica o save da nuvem que ficou
                        pendente da sessão anterior (grava e recarrega) ou dispara o Sys.online.boot. Nunca lança erro.
     wait(ms)         → Promise<true>: resolve quando o boot terminar ou em ms (padrão 4000). Desligado = na hora. Com a tela "Nuvem × Aparelho"
                        aberta NÃO corta: espera a escolha e dá mais ms para a troca terminar. (js/loading.js: tarefa "online")
     reboot()         → Promise<{ok, action, pending, ...}>: Sys.online.boot de novo com os mesmos ganchos (depois do login)
     google()         → Promise<{ok, action:'login'|'linked', save, pending, player} | {ok:false, reason, other?}> (ver a função)
     saved(S)         → chamado pelo save() do index.html depois de gravar: repassa ao Sys.online.saved(S) (nunca com save pendente / __noSave)
     state()          → {on, why, booted, booting, lastAction, pending, choosing, started}
     applyPending()   → aplica AGORA o save da nuvem pendente (grava e recarrega); para a tela que avisar "progresso da nuvem encontrado"
   lastAction: 'none' | 'push' | 'applied' (gravou e está recarregando) | 'pending' (chegou com o jogo rodando: fica para a próxima abertura) |
               'refused' (save de outro servidor) | null (sem resposta / erro).
   REGRA DURA: save da nuvem só troca o do aparelho com o jogo ainda no carregamento/título. Depois de JOGAR ele fica em memória e na chave
   'eon_cloud_pending@<realm>' e entra na PRÓXIMA abertura, antes de o jogo começar. Com save pendente nada sobe para a nuvem (o aparelho está atrás).
   Erro técnico nunca aparece para o jogador: só no console, em debug. Teste: node test/e2e/online.js */
(function (W) {
  const ST = { on: false, why: 'off', called: false, bootP: null, booting: false, booted: false, last: null, lastAction: null, pending: null, game: false,
    reloading: false, choosing: false, choiceP: null, choiceMade: false, applyRes: null, beat: 0, gP: null };
  const X = () => W.Sys || {};
  const dbg = (...a) => { try { if (typeof DEBUG !== 'undefined' && DEBUG) console.info('[online]', ...a); } catch (e) {} };
  const qp = k => { try { return (typeof DEBUG !== 'undefined' && DEBUG && typeof QP !== 'undefined') ? QP.get(k) : null; } catch (e) { return null; } };
  const LS = { get(k) { try { return W.localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { W.localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { W.localStorage.removeItem(k); } catch (e) {} } };
  const realm = () => { try { return W.Realm.id(); } catch (e) { return 's1'; } };
  const pendKey = () => 'eon_cloud_pending@' + realm();
  const num = v => (typeof v === 'number' && isFinite(v) && v > 0) ? v : 0;
  const code = e => String((e && (e.code || e.message)) || 'error');
  const emit = () => { try { W.dispatchEvent(new CustomEvent('onlineboot', { detail: state() })); } catch (e) {} };
  const owner = () => { try { if (typeof OWNER_MODE !== 'undefined' && OWNER_MODE === true) return true; return typeof SAVE_KEY === 'string' && /^eras_owner_v1(@|$)/.test(SAVE_KEY); } catch (e) { return true; } };

  /* a chave: ONLINE_ON do index.html; em debug ?online=1 liga e ?online=0 desliga */
  function wanted() { let on = false; try { on = typeof ONLINE_ON !== 'undefined' && ONLINE_ON === true; } catch (e) {} const q = qp('online'); if (q === '1') on = true; else if (q === '0') on = false; return on; }
  function baseUrl() { let b = ''; try { b = typeof ONLINE_BASE === 'string' ? ONLINE_BASE : ''; } catch (e) {} return qp('onlinebase') || b; }
  /* motivo para NÃO ligar mesmo com a chave ligada ('' = pode) */
  function blocked() { if (owner()) return 'owner'; if (W.REALM_MISMATCH) return 'realm'; if (W.__noSave) return 'nosave';
    const N = X().net, O = X().online; if (!N || !N.DATA || !O || !O.DATA || typeof O.boot !== 'function') return 'module'; if (!baseUrl()) return 'base'; return ''; }

  /* O JOGO JÁ COMEÇOU? (trava: uma vez verdadeiro, fica). Começou = o jogador tocou em JOGAR: título escondido ou batalha sem pausa. */
  /* A batalha nasce em pausa (B.paused = true, js/battle.js) e só sai dela no JOGAR: do título antigo (#playb), da entrada nova (js/p_intro.js, que
     esconde o #title e mantém a pausa até o jogador entrar) ou do ?skip=1. Depois o jogo pausa de novo em modais, por isso a trava: o toque no #playb,
     a classe 'out' do título e uma olhada por segundo no B.paused. */
  function started() { if (ST.game) return true; let s = false;
    try { if (typeof B !== 'undefined' && B && B.paused === false) s = true; } catch (e) {}
    try { const t = document.getElementById('title'); if (t && t.classList && t.classList.contains('out') === true) s = true; } catch (e) {}
    if (s) ST.game = true; return s; }
  function watchPlay() { try { document.addEventListener('click', ev => { const t = ev.target; if (t && t.closest && t.closest('#playb')) ST.game = true; }, true); } catch (e) {}
    try { const iv = setInterval(() => { if (started()) clearInterval(iv); }, 1000); } catch (e) {} }

  /* ---------- ganchos do Sys.online.boot ---------- */
  /* RESUMO (contrato §3 do docs/API_SERVIDOR.md: os 8 números são obrigatórios, finitos e >= 0). De onde sai cada um:
       level        Sys.level.level(S)               = S.sys.level.lvl
       xp           S.sys.level.total                (XP ACUMULADA desde o nível 1; a do nível atual é S.sys.level.xp)
       era          S.eraMax                         (era mais alta liberada, 0..; sem o campo: eraOf(S.stage))
       stage        S.stage                          (fase atual, 1..; a mais alta é S.best)
       fc           Sys.fc.compute(S, Sys.host)      (FC REAL, a mesma do heroFC() do index; NUNCA a de exibição ×31)
       gems         S.gems
       playSeconds  S.playSeconds                    (contador deste arquivo: playTick, no fim; save antigo sem o campo = 0)
       maxRarity    maior it.r do S.inv              (0..4)
       hero         S.hero || 'kael'      avatar  Sys.appearance.avatarKey(S, Sys.host)      realm  Realm.id()      name  S.name || ''
       savedAt      S.lastSeen                       (ms da última gravação local; a tela Nuvem × Aparelho mostra) */
  function summary(S) { S = S || {}; const Y = X(); let level = 1, xp = 0, fc = 0, avatar = '', maxRarity = 0, era = 0;
    try { level = num(Y.level.level(S)) || 1; xp = num(Y.level.ensure(S).total); } catch (e) {}
    try { fc = num(Y.fc.compute(S, Y.host)); } catch (e) {}
    try { avatar = String(Y.appearance.avatarKey(S, Y.host) || ''); } catch (e) {}
    try { for (const it of (S.inv || [])) if (it && num(it.r) > maxRarity) maxRarity = it.r | 0; } catch (e) {}
    try { era = Number.isInteger(S.eraMax) ? S.eraMax : (typeof eraOf === 'function' ? eraOf(S.stage || 1) : 0); } catch (e) {}
    return { level, xp, era: num(era), stage: num(S.stage) || 1, fc, gems: num(S.gems), playSeconds: Math.floor(num(S.playSeconds)), maxRarity,
      hero: S.hero === 'kaia' ? 'kaia' : (S.hero || 'kael'), avatar, realm: realm(), name: typeof S.name === 'string' ? S.name : '', savedAt: num(S.lastSeen) }; }

  /* grava o save da nuvem na chave do aparelho, bloqueia as gravações e recarrega. false = não gravou (nada muda). */
  function commit(save) { let j; try { j = JSON.stringify(save); } catch (e) { return false; } if (!j || j[0] !== '{') return false;
    let key; try { key = SAVE_KEY; } catch (e) { return false; }
    if (!LS.set(key, j)) { dbg('não coube no aparelho: save da nuvem não aplicado'); return false; }
    W.__noSave = true; ST.reloading = true; ST.pending = null; LS.del(pendKey());
    try { const g = loopRead(); LS.set('eon_cloud_reload', (g.n + 1) + '|' + Date.now()); } catch (e) {}
    dbg('save da nuvem gravado; recarregando'); emit();
    try { location.href = location.pathname + location.search; } catch (e) {}
    return true; }
  /* guarda contra recarga em laço: 3 recargas por save da nuvem em menos de 30 s = para de recarregar (fica pendente) */
  function loopRead() { const p = String(LS.get('eon_cloud_reload') || '').split('|'), n = +p[0] || 0, t = +p[1] || 0; return Date.now() - t < 30000 ? { n, t } : { n: 0, t: 0 }; }
  const sameRealm = save => !!save && typeof save === 'object' && !Array.isArray(save) && String(save.realm || 's1') === realm();

  /* apply(save): só troca o save se for do servidor atual. Antes de JOGAR: grava e recarrega. Depois: fica pendente para a próxima abertura. */
  function apply(save) {
    if (!ST.on || owner() || W.REALM_MISMATCH) { ST.applyRes = 'refused'; return false; }
    if (!sameRealm(save)) { ST.applyRes = 'refused'; dbg('save da nuvem de outro servidor: recusado', save && save.realm, realm()); return false; }
    if (!started() && loopRead().n < 3 && commit(save)) { ST.applyRes = 'applied'; return true; }
    let j = null; try { j = JSON.stringify({ realm: realm(), at: Date.now(), save }); } catch (e) {}
    ST.pending = save; if (j) LS.set(pendKey(), j); ST.applyRes = 'pending'; dbg('save da nuvem chegou com o jogo rodando: fica para a próxima abertura'); emit();
    return false; }
  /* na abertura: o save que ficou pendente entra AGORA (antes de o jogo começar). true = gravou e está recarregando. */
  function pendingAtOpen() { const j = LS.get(pendKey()); if (!j) return false; let o = null; try { o = JSON.parse(j); } catch (e) {}
    if (!o || !sameRealm(o.save)) { LS.del(pendKey()); return false; }
    if (loopRead().n >= 3) { ST.pending = o.save; return false; }
    if (commit(o.save)) { ST.lastAction = 'applied'; return true; }
    ST.pending = o.save; return false; }
  function applyPending() { if (!ST.on || !ST.pending || owner() || !sameRealm(ST.pending)) return false; const ok = commit(ST.pending); if (ok) ST.lastAction = 'applied'; return ok; }

  /* choose(info): os dois lados mudaram. Com a tela (js/cloudchoice.js: window.CloudChoice(info) → Promise<'device'|'cloud'>) o jogador escolhe; sem ela vale
     info.recommend. Quem chama Sys.net.chooseSide é o Sys.online.boot (logo depois deste gancho): aqui NÃO se chama de novo.
     RECOMENDADO (decisão do coordenador): com tempo de jogo nos DOIS lados (playSeconds > 0) vale o info.recommend do Sys.net (o de mais tempo). Enquanto
     algum lado for 0 (save antigo, de antes do contador S.playSeconds) o recomendado é o lado mais avançado (nível, depois fase, depois FC); tudo igual =
     info.recommend. Sem isso o aparelho novo (nível 1) ganharia sempre do save da conta. */
  function recommend(info) { const rec = info && info.recommend === 'cloud' ? 'cloud' : 'device', d = (info && info.device) || {}, c = (info && info.cloud && info.cloud.summary) || {};
    if (num(d.playSeconds) > 0 && num(c.playSeconds) > 0) return rec;
    for (const k of ['level', 'stage', 'fc']) { const a = num(d[k]), b = num(c[k]); if (a !== b) return a > b ? 'device' : 'cloud'; }
    return rec; }
  function choose(info) { const rec = recommend(info), fn = W.CloudChoice;
    if (typeof fn !== 'function') return Promise.resolve(rec);
    let p; try { p = fn(Object.assign({}, info, { recommend: rec })); } catch (e) { dbg('CloudChoice falhou ao abrir', e); return Promise.resolve(rec); }
    if (!p || typeof p.then !== 'function') return Promise.resolve(rec);
    ST.choosing = true; beatOn(); emit();
    const done = v => { ST.choosing = false; beatOff(); ST.choiceMade = true; emit(); return v === 'cloud' || v === 'device' ? v : rec; };
    return ST.choiceP = Promise.resolve(p).then(done, () => done(rec)); }
  /* com a escolha aberta a tela de carregamento não pode dar "parou" nem abandonar a tarefa "online" (js/preload.js: STALL_MS/TASK_MS): uma tarefa vazia a cada
     5 s marca progresso (o mesmo recurso do "Tentar de novo" do js/loading.js) enquanto o carregamento estiver na frente */
  function beatOn() { beatOff(); try { ST.beat = setInterval(() => { try { if (!ST.choosing) { beatOff(); return; } if (typeof LD !== 'undefined' && LD.el && !LD.closed && !LD.fin && W.Preload && typeof W.Preload.track === 'function') W.Preload.track(Promise.resolve(true), 'online: escolha'); } catch (e) {} }, 5000); } catch (e) {} }
  function beatOff() { try { if (ST.beat) clearInterval(ST.beat); } catch (e) {} ST.beat = 0; }

  const HOOKS = { summary, apply, choose };

  /* ---------- boot ---------- */
  async function doBoot() {
    if (!ST.on) return { ok: false, reason: ST.why || 'off' };
    if (ST.reloading || W.__noSave) return { ok: false, reason: 'nosave' };
    ST.booting = true; ST.applyRes = null; ST.choiceMade = false; let r;
    try { let v = '0'; try { v = VERSION; } catch (e) {} HOOKS.clientVersion = v;
      const O = X().online, N = X().net; O.DATA.on = true; N.DATA.on = true; N.DATA.base = baseUrl();
      r = await O.boot(S, X().host, HOOKS); }
    catch (e) { r = { ok: false, reason: code(e) }; dbg('boot falhou', e); }
    r = r || { ok: false, reason: 'error' };
    ST.booting = false; ST.booted = !!r.ok; ST.last = r;
    ST.lastAction = !r.ok ? null : r.save === 'pulled' ? (ST.applyRes || 'refused') : (r.save || null);
    /* a troca escolhida na tela falhou (sem rede no meio): a tela avisa e o jogo segue com o save do aparelho */
    if (ST.choiceMade) { const bad = (r.errors || []).find(x => /^save:/.test(x)) || (!r.ok ? 'save:' + r.reason : '');
      if (bad) { try { const C = W.CloudChoice; if (C && typeof C.failed === 'function') C.failed({ code: bad.replace(/^save:/, '') }); } catch (e) {} } }
    dbg('boot', r.ok ? 'ok' : 'sem servidor (' + r.reason + ')', 'save:', ST.lastAction, r.errors && r.errors.length ? r.errors : ''); emit();
    return r; }
  /* um boot de cada vez (o de depois do login espera o da abertura) */
  function runBoot() { const p = (ST.bootP || Promise.resolve()).then(doBoot, doBoot).then(r => r, e => ({ ok: false, reason: code(e) })); ST.bootP = p; return p; }
  const result = r => Object.assign({}, r, { action: ST.lastAction, pending: !!ST.pending });

  function start() {
    if (ST.called) return state(); ST.called = true;
    try {
      ST.why = wanted() ? blocked() : 'off';
      if (ST.why) { dbg('desligado (' + ST.why + ')'); return state(); }
      const N = X().net, O = X().online; N.DATA.base = baseUrl(); N.DATA.on = true; O.DATA.on = true; ST.on = true; ST.why = '';
      watchPlay();
      if (pendingAtOpen()) return state();   /* gravou o save pendente e está recarregando: nada mais nesta carga */
      runBoot();
    } catch (e) { dbg('start falhou', e); }
    return state(); }

  function wait(ms) { ms = ms == null ? 4000 : Math.max(0, +ms || 0);
    if (!ST.on || !ST.bootP) return Promise.resolve(true);
    return new Promise(ok => { let d = false, t = 0; const fin = () => { if (d) return; d = true; clearTimeout(t); ok(true); };
      const arm = () => { t = setTimeout(() => { if (d) return;
        /* a escolha Nuvem × Aparelho está aberta: não corta; depois dela, mais ms para a troca terminar */
        if (ST.choosing && ST.choiceP) { ST.choiceP.then(arm, arm); return; } fin(); }, ms); };
      arm(); ST.bootP.then(fin, fin); }); }

  function reboot() { if (!ST.on) return Promise.resolve({ ok: false, reason: ST.why || 'off', action: null, pending: !!ST.pending });
    /* solta a subida agendada da sessão anterior (o que estava por subir continua marcado como mudança no Sys.net) */
    return (ST.bootP || Promise.resolve()).then(() => { try { const O = X().online; if (typeof O._reset === 'function') O._reset(); } catch (e) {} }).then(runBoot).then(result); }

  /* LOGIN GOOGLE (as telas são do Servidor):
       1) Sys.net.googleSignIn('login'): conta já vinculada → entra nela e refaz o boot (o save da conta vem pela regra de sempre)
            → {ok:true, action:'login', save:<lastAction>, pending, player}
       2) 404 not_linked: a conta Google não tem personagem neste servidor → vincula ao convidado ATUAL (o save do aparelho continua)
            → {ok:true, action:'linked', player}
       3) 409 link_taken: essa conta Google é de outro jogador → {ok:false, reason:'link_taken', other: details.otherPlayer}
       qualquer outro erro ou cancelamento → {ok:false, reason} ('cancelled', 'google_unavailable', 'offline'...). Nunca trava nem lança. */
  function google() { if (ST.gP) return ST.gP;
    const run = async () => {
      if (!ST.on) return { ok: false, reason: ST.why || 'off' };
      const N = X().net;
      try { await N.googleSignIn('login'); }
      catch (e) { const c = code(e); if (c !== 'not_linked') return { ok: false, reason: c };
        try { if (!N.hasSession()) await N.ensureSession(); const p = await N.googleSignIn('link'); emit(); return { ok: true, action: 'linked', player: p || N.player() }; }
        catch (e2) { const c2 = code(e2); return c2 === 'link_taken' ? { ok: false, reason: 'link_taken', other: (e2.details && e2.details.otherPlayer) || null } : { ok: false, reason: c2 }; } }
      const r = await reboot(); let pl = null; try { pl = N.player(); } catch (e) {}
      return { ok: true, action: 'login', save: r.action, pending: !!ST.pending, player: pl, boot: r }; };
    const fin = () => { ST.gP = null; };
    ST.gP = run().then(r => { fin(); return r; }, e => { fin(); dbg('google falhou', e); return { ok: false, reason: code(e) }; });
    return ST.gP; }

  /* depois de cada gravação local (save() do index.html). Antes de o boot terminar (ou sem rede) o Sys.online.saved não marca nada: a mudança fica
     marcada direto no Sys.net (senão um aparelho jogado sem rede perderia para a nuvem sem pergunta). Com save pendente nada sobe. */
  function saved(S) { if (!ST.on || ST.pending || ST.reloading || W.__noSave || owner()) return false;
    try { const O = X().online, N = X().net; if (O.saved(S)) return true; if (!ST.booting && !ST.booted && N && typeof N.markDirty === 'function' && N.hasSession && N.hasSession()) N.markDirty(); } catch (e) { dbg('saved falhou', e); }
    return false; }

  /* ---------- TEMPO DE JOGO: S.playSeconds (decisão do coordenador; é dado do SAVE: conta com o online ligado ou desligado) ----------
     Segundos inteiros somados SÓ com a batalha rodando (B.paused === false) e a página visível (document.visibilityState === 'visible'). Um temporizador de
     1 s (sem requestAnimationFrame) chama playTick(agora): soma o tempo REAL decorrido desde o passo anterior, e só se as condições valiam nos DOIS passos
     (o intervalo em pausa/escondido não conta; ganhos offline não contam). Temporizador atrasado não compensa além do relógio real e nunca soma mais de 5 s de
     uma vez (aba congelada, aparelho dormindo); relógio para trás soma 0. Save antigo sem o campo começa em 0. Cada save tem o seu (o Modo dono conta no save
     do dono, o real no real: S é o save carregado). Vai no resumo (summary.playSeconds). playTick(agora) fica exposto para o teste (tempo virtual). */
  const PT = { last: 0, ok: false, acc: 0 };
  function playOk() { try { return typeof B !== 'undefined' && !!B && B.paused === false && document.visibilityState === 'visible'; } catch (e) { return false; } }
  function playTick(now) { now = typeof now === 'number' ? now : Date.now(); const ok = playOk(), was = PT.ok, dt = PT.last ? now - PT.last : 0; PT.last = now; PT.ok = ok;
    if (!ok || !was || !(dt > 0)) { if (!ok) PT.acc = 0; return 0; }
    PT.acc += Math.min(dt, 5000); const add = Math.floor(PT.acc / 1000); if (!add) return 0; PT.acc -= add * 1000;
    try { if (typeof S !== 'object' || !S) return 0; S.playSeconds = Math.floor(num(S.playSeconds)) + add; } catch (e) { return 0; }
    return add; }
  try { setInterval(() => { try { playTick(); } catch (e) {} }, 1000); } catch (e) {}

  function state() { return { on: ST.on, why: ST.why, booted: ST.booted, booting: ST.booting, lastAction: ST.lastAction, pending: !!ST.pending, choosing: ST.choosing, started: ST.game }; }

  W.OnlineBoot = { start, wait, reboot, google, saved, state, applyPending, summary, playTick, _st: ST, _pt: PT };
})(window);
