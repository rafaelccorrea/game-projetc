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

  const HOLD = 'eon_online_hold';
  /* a chave: ONLINE_ON do index.html; em debug ?online=1 liga e ?online=0 desliga */
  function wanted() { let on = false; try { on = typeof ONLINE_ON !== 'undefined' && ONLINE_ON === true; } catch (e) {} const q = qp('online'); if (q === '1') on = true; else if (q === '0') on = false; return on; }
  function baseUrl() { let b = ''; try { b = typeof ONLINE_BASE === 'string' ? ONLINE_BASE : ''; } catch (e) {} return qp('onlinebase') || b; }
  /* motivo para NÃO ligar mesmo com a chave ligada ('' = pode) */
  function blocked() { if (owner()) return 'owner'; if (W.REALM_MISMATCH) return 'realm'; if (W.__noSave) return 'nosave'; if (LS.get(HOLD)) return 'hold';   /* hold: conta excluída com o save mantido (accountDeleted) */
    const N = X().net, O = X().online; if (!N || !N.DATA || !O || !O.DATA || typeof O.boot !== 'function') return 'module'; if (!baseUrl()) return 'base'; return ''; }

  /* O JOGO JÁ COMEÇOU? (trava: uma vez verdadeiro, fica). Começou = o jogador tocou em JOGAR: título escondido ou batalha sem pausa. */
  /* A batalha nasce em pausa (B.paused = true, js/battle.js) e só sai dela no JOGAR: do título antigo (#playb), da entrada nova (js/p_intro.js, que
     esconde o #title e mantém a pausa até o jogador entrar) ou do ?skip=1. Depois o jogo pausa de novo em modais, por isso a trava: o toque no #playb,
     a classe 'out' do título e uma olhada por segundo no B.paused. */
  function started() { if (ST.game) return true; let s = false;
    try { if (typeof B !== 'undefined' && B && B.paused === false) s = true; } catch (e) {}
    try { const t = document.getElementById('title'); if (t && t.classList && t.classList.contains('out') === true) s = true; } catch (e) {}
    if (s) ST.game = true; return s; }
  function watchPlay() { try { document.addEventListener('click', ev => { const t = ev.target; if (t && t.closest && t.closest('#playb')) { ST.game = true; play(); } }, true); } catch (e) {}
    try { const iv = setInterval(() => { if (started()) { clearInterval(iv); play(); } }, 1000); } catch (e) {} }   /* o jogo começou por qualquer caminho = JOGAR (ver play) */

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

  /* o gancho summary é a FUNÇÃO: o Sys.net a chama na hora de cada pedido, junto com o save (d786848). Nada aqui guarda resumo de antes. */
  /* A CONTA DE CONVIDADO SÓ NASCE NO JOGAR (decisão do PO; Servidor 03e7dee: Sys.online.boot pergunta hooks.mayCreate()). Aparelho com sessão guardada
     ou com save com progresso: tudo como antes (renova / cria sozinho). Aparelho VAZIO e sem sessão (1ª abertura, ou logo depois de Excluir conta): abrir
     o Título NÃO cria conta; o boot termina em {ok:false, reason:'no_session'} sem nenhum pedido (não é erro: só espera). A conta nasce quando o jogador
     toca em JOGAR (OnlineBoot.play(), chamado pelo Título do js/p_intro.js; e também sozinho quando a batalha sai da pausa por qualquer caminho) ou entra
     com o Google. */
  function mayCreate() { return !ST.blank || !!ST.play || started(); }
  const HOOKS = { summary, apply, choose, mayCreate };
  /* play() → Promise<{ok, action, pending, ...}>: marca que o jogador tocou em JOGAR e, se o boot terminou (ou terminar) em 'no_session', refaz o boot,
     agora podendo criar o convidado. Chamar de novo devolve a MESMA promessa (cria uma vez só). Espera o boot em curso (sem corrida). Desligado /
     Modo dono / hold / outro servidor: não faz nada. */
  function play() { if (ST.playP) return ST.playP; ST.play = true;
    if (!ST.on) return Promise.resolve({ ok: false, reason: ST.why || 'off', action: null, pending: !!ST.pending });
    const again = () => (!ST.reloading && ST.last && !ST.last.ok && ST.last.reason === 'no_session') ? runBoot() : (ST.last || { ok: false, reason: 'nosave' });
    return ST.playP = (ST.bootP || Promise.resolve()).then(again).then(result, e => ({ ok: false, reason: code(e) })); }

  /* ---------- APARELHO SEM SAVE × NUVEM COM PROGRESSO (perda de save achada pelo QA no servidor real; regra do dono: NUNCA subir) ----------
     O Sys.net guarda "a versão da nuvem que o aparelho conhece" na chave da sessão (eon.net), separada do save. Se o save local some (dados do jogo
     apagados, chave removida) a sessão continua dizendo "versão 5, sem mudança": o sync devolve 'none' (ou 'push', se uma gravação do save novo marcar
     "mudou" antes) e o save VAZIO recém-criado cobre a nuvem. Por isso, com o save do aparelho VAZIO (sem abates, fase 1, nível 1, 0 s de
     jogo), ANTES do Sys.online.boot: abre a sessão, lê a cabeça da nuvem e, se ela tem progresso, BAIXA (Sys.net.pull) e passa pelo apply de sempre
     (carregamento/título: grava e recarrega; jogo rodando: pendente). Erro no meio = o boot desta abertura para ali (nada sobe). Nuvem vazia ou sem
     progresso = segue o caminho normal. Enquanto isso as gravações do save vazio não são repassadas (saved). */
  function blank(S) { try { if (!S || typeof S !== 'object') return true; let lv = 1; try { lv = num(X().level.level(S)) || 1; } catch (e) {}
      /* o nome não entra na conta: save antigo sem nome ganha "Kael" sozinho (js/farm.js) e o ?skip=1 também põe */
      return !(S.kills > 0) && !(S.stage > 1) && !(S.best > 1) && !num(S.playSeconds) && lv <= 1; } catch (e) { return false; } }
  const progress = s => !!s && (num(s.level) > 1 || num(s.stage) > 1 || num(s.era) > 0 || num(s.xp) > 0 || num(s.playSeconds) > 0);
  async function rescue() { const N = X().net;
    N.init({ storage: { get: LS.get, set: LS.set }, clientVersion: HOOKS.clientVersion });
    if (!N.hasSession() && !mayCreate()) return null;   /* aparelho vazio, sem sessão e sem JOGAR: nenhum pedido (nada a proteger: sem sessão não há nuvem deste aparelho) */
    await N.ensureSession(); const h = await N.head();
    if (!h || !progress(h.summary)) return null;
    dbg('aparelho sem save e nuvem com progresso: baixa a nuvem (nada sobe)');
    const r = await N.pull(); if (!r || !r.save) throw Object.assign(new Error('pull'), { code: 'pull_failed' });
    apply(r.save); return r; }

  /* ---------- boot ---------- */
  async function doBoot() {
    if (!ST.on) return { ok: false, reason: ST.why || 'off' };
    if (ST.reloading || W.__noSave) return { ok: false, reason: 'nosave' };
    ST.booting = true; ST.applyRes = null; ST.choiceMade = false; ST.blank = ST.blank0 != null ? ST.blank0 : blank(S); ST.blank0 = null; let r, resc = null;   /* 1º boot: o save como estava na abertura (start) */
    try { let v = '0'; try { v = VERSION; } catch (e) {} HOOKS.clientVersion = v;
      const O = X().online, N = X().net; O.DATA.on = true; N.DATA.on = true; N.DATA.base = baseUrl();
      if (ST.blank) resc = await rescue();
      r = ST.reloading ? { ok: true, save: 'pulled', deliveries: 0, mail: 0, errors: [] } : await O.boot(S, X().host, HOOKS); }
    catch (e) { r = { ok: false, reason: code(e) }; dbg('boot falhou', e); }
    r = r || { ok: false, reason: 'error' };
    ST.booting = false; ST.booted = !!r.ok; ST.last = r;
    ST.lastAction = !r.ok ? null : (resc || r.save === 'pulled') ? (ST.applyRes || 'refused') : (r.save || null);
    /* a troca escolhida na tela falhou (sem rede no meio): a tela avisa e o jogo segue com o save do aparelho */
    if (ST.choiceMade) { const bad = (r.errors || []).find(x => /^save:/.test(x)) || (!r.ok ? 'save:' + r.reason : '');
      if (bad) { try { const C = W.CloudChoice; if (C && typeof C.failed === 'function') C.failed({ code: bad.replace(/^save:/, '') }); } catch (e) {} } }
    if (!ST.reloading) LS.del('eon_cloud_reload');   /* a guarda contra recarga em laço só vale entre recargas seguidas: abertura que não recarrega limpa a chave */
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
      watchPlay(); ST.blank0 = blank(S);
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
       2) 404 not_linked: a conta Google não tem personagem neste servidor → vincula ao convidado ATUAL (o save do aparelho continua) com o MESMO
          idToken (e.idToken do erro, Sys.net e763f75: a janela do Google abre UMA vez; é o que o modo 'auto' faz por dentro, mas em dois passos para
          saber se foi 'login' ou 'linked'). Sys.net antigo, sem e.idToken: caminho antigo (abre a janela de novo)
            → {ok:true, action:'linked', player}
       3) 409 link_taken: essa conta Google é de outro jogador → {ok:false, reason:'link_taken', other: details.otherPlayer}
       qualquer outro erro ou cancelamento → {ok:false, reason} ('cancelled', 'google_unavailable', 'offline'...). Nunca trava nem lança. */
  function google() { if (ST.gP) return ST.gP;
    const run = async () => {
      /* conta excluída com o save mantido (hold): entrar com o Google é o jogador "entrando de novo". As chaves ligam só para o pedido; o hold só sai
         se o login/vínculo der certo (senão tudo volta a ficar desligado). */
      const held = !ST.on && ST.why === 'hold';
      if (!ST.on && !held) return { ok: false, reason: ST.why || 'off' };
      const N = X().net, O = X().online;
      if (held) { let v = '0'; try { v = VERSION; } catch (e) {} N.DATA.base = baseUrl(); N.DATA.on = true; N.init({ storage: { get: LS.get, set: LS.set }, clientVersion: v }); }
      const lift = () => { if (held) { LS.del(HOLD); O.DATA.on = true; ST.on = true; ST.why = ''; watchPlay(); } }, drop = r => { if (held) N.DATA.on = false; return r; };
      try { await N.googleSignIn('login'); }
      catch (e) { const c = code(e); if (c !== 'not_linked') return drop({ ok: false, reason: c });
        try { ST.play = true;   /* entrar com o Google também é o jogador pedindo a conta: o convidado pode nascer para receber o vínculo */
          if (!N.hasSession()) await N.ensureSession(); const p = await (e && e.idToken ? N.googleSignIn('link', { idToken: e.idToken }) : N.googleSignIn('link')); lift(); if (held || !ST.booted) runBoot(); emit(); return { ok: true, action: 'linked', player: p || N.player() }; }
        catch (e2) { const c2 = code(e2); return drop(c2 === 'link_taken' ? { ok: false, reason: 'link_taken', other: (e2.details && e2.details.otherPlayer) || null } : { ok: false, reason: c2 }); } }
      ST.play = true; lift(); const r = await reboot(); let pl = null; try { pl = N.player(); } catch (e) {}
      return { ok: true, action: 'login', save: r.action, pending: !!ST.pending, player: pl, boot: r }; };
    const fin = () => { ST.gP = null; };
    ST.gP = run().then(r => { fin(); return r; }, e => { fin(); dbg('google falhou', e); return { ok: false, reason: code(e) }; });
    return ST.gP; }

  /* depois de cada gravação local (save() do index.html): repassa ao Sys.online.saved (que sobe no intervalo dele e, sem boot, marca o aparelho como
     mudado: e763f75). Com save pendente nada sobe. Com o boot EM ANDAMENTO e o jogo ainda no carregamento/título não repassa: as gravações de arrumação
     da abertura marcariam "aparelho mudou" antes de o sync ler, e a tela Nuvem × Aparelho abriria sem o jogador ter jogado. */
  function saved(S) { if (!ST.on || ST.pending || ST.reloading || W.__noSave || owner()) return false;
    if (ST.booting && (!started() || ST.blank)) return false;   /* ST.blank: save vazio com o boot em andamento (ver rescue) */
    try { return !!X().online.saved(S); } catch (e) { dbg('saved falhou', e); }
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

  /* ---------- CONTA EXCLUÍDA (tela do Sistemas: js/delacct.js, depois de Sys.net.deleteAccount() dar certo) ----------
     accountDeleted({localSave:'erase'|'keep', until, delayMs}) → {ok:true, localSave, reloadInMs} | {ok:false, reason, step}
       1) ANTES de tudo: bloqueia as gravações (window.__noSave), a trava interna e desliga o online desta página (nenhum pedido, nenhuma subida agendada).
       2) apaga do aparelho o que é da CONTA: a sessão do Sys.net de TODOS os servidores ('eon.net', 'eon.net@sN': guardam o id do aparelho; se ficasse,
          a próxima abertura entraria como convidado na MESMA conta e o servidor cancelaria a exclusão), o save da nuvem pendente do servidor atual
          ('eon_cloud_pending@<realm>') e 'eon_cloud_reload'.
       3) 'erase': apaga o save de JOGADOR do servidor atual (Realm.key(Realm.id(), false)) e a marca 'eon_realm_seen'. Nunca a chave do Modo dono nem o save
          de outro servidor. 'keep': o save fica e o aparelho ganha a marca 'eon_online_hold': enquanto ela existir o online NÃO liga na abertura
          (state().why = 'hold': nenhum convidado novo é criado e o save não sobe sozinho). A marca sai quando o jogador ENTRA de novo: OnlineBoot.google()
          (login ou vínculo com sucesso) ou OnlineBoot.resume() (botão "voltar a jogar online": cria convidado novo e sobe o save).
       4) recarrega no Título (mesmo caminho do Realm.set) depois de delayMs (padrão 2500 ms: a tela mostra "Pedido enviado"; 0 = na hora).
     Modo dono: não faz nada → {ok:false, reason:'owner'}. Erro em algum passo: para ali (não apaga o resto), libera as gravações locais de novo (o online
     continua desligado nesta página) e devolve {ok:false, reason:'storage', step}. */
  function accountDeleted(opts) { opts = opts || {};
    if (owner()) return { ok: false, reason: 'owner' };
    const keep = opts.localSave === 'keep', was = W.__noSave, rm = k => { try { W.localStorage.removeItem(k); return W.localStorage.getItem(k) == null; } catch (e) { return false; } };
    W.__noSave = true; ST.reloading = true; ST.on = false; ST.why = 'deleted'; ST.pending = null; beatOff();
    try { const O = X().online, N = X().net; if (O) { if (typeof O._reset === 'function') O._reset(); if (O.DATA) O.DATA.on = false; } if (N && N.DATA) N.DATA.on = false; } catch (e) {}
    const failAt = step => { W.__noSave = was; ST.reloading = false; dbg('accountDeleted parou em', step); return { ok: false, reason: 'storage', step }; };
    let playerKey = ''; try { playerKey = W.Realm.key(W.Realm.id(), false); } catch (e) { return failAt('realm'); }
    if (!playerKey || /^eras_owner_v1/.test(playerKey)) return failAt('realm');
    /* 2) o que é da conta */
    const sk = []; try { const b = (X().net && X().net.DATA && X().net.DATA.storageKey) || 'eon.net', L = W.localStorage; sk.push(b);
      if (typeof L.length === 'number' && typeof L.key === 'function') { for (let i = 0; i < L.length; i++) { const k = L.key(i); if (k && k.indexOf(b + '@') === 0 && sk.indexOf(k) < 0) sk.push(k); } }
      else for (let i = 2; i <= 60; i++) sk.push(b + '@s' + i); } catch (e) { return failAt('session'); }
    for (const k of sk) if (!rm(k)) return failAt('session');
    if (!rm(pendKey())) return failAt('pending');
    if (!rm('eon_cloud_reload')) return failAt('reload');
    /* 3) o save do aparelho */
    if (keep) { if (!LS.set(HOLD, JSON.stringify({ at: Date.now(), until: +opts.until || 0 }))) return failAt('hold'); }
    else { if (!rm(playerKey)) return failAt('save'); if (!rm('eon_realm_seen')) return failAt('seen'); rm(HOLD); }
    /* 4) Título */
    const ms = opts.delayMs == null ? 2500 : Math.max(0, +opts.delayMs || 0), go = () => { try { location.href = location.pathname + location.search; } catch (e) {} };
    if (ms) setTimeout(go, ms); else go();
    emit(); return { ok: true, localSave: keep ? 'keep' : 'erase', reloadInMs: ms }; }
  /* depois do 'keep': o jogador pede para voltar ao online sem o Google → sai a marca e o online liga (convidado novo; o save do aparelho sobe) */
  function resume() { if (owner() || ST.reloading) return Promise.resolve({ ok: false, reason: owner() ? 'owner' : 'nosave' });
    ST.play = true; LS.del(HOLD); if (ST.on) return (ST.bootP || Promise.resolve()).then(result);
    ST.called = false; start(); return ST.on && ST.bootP ? ST.bootP.then(result) : Promise.resolve({ ok: false, reason: ST.why || 'off' }); }

  function state() { return { on: ST.on, why: ST.why, booted: ST.booted, booting: ST.booting, lastAction: ST.lastAction, pending: !!ST.pending, choosing: ST.choosing, started: ST.game,
    waitingPlay: ST.on && !ST.booting && !ST.booted && !!ST.last && ST.last.reason === 'no_session' };   /* waitingPlay: sem conta ainda; nasce no JOGAR (não é erro) */ }

  W.OnlineBoot = { start, wait, reboot, play, google, saved, state, applyPending, accountDeleted, resume, summary, playTick, _st: ST, _pt: PT };
})(window);
