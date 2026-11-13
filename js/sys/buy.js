/* Sys.buy — COMPRA PELO GOOGLE PLAY no jogo (Servidor fps-6f). Nasce DESLIGADO (DATA.on=false).
   Contrato: docs/API_SERVIDOR.md §7. Regras duras: o jogo NUNCA entrega por conta própria; quem decide é o servidor (recibo conferido no
   Google). O jogo só (1) abre a cobrança da loja, (2) manda o recibo ao servidor (Sys.net.verifyGoogle) e (3) aplica as ENTREGAS que o servidor
   lista (GET /purchases/deliveries), confirmando cada uma (ack) só DEPOIS de gravar o save.
   Pronto para comprar = DATA.on && Sys.net ligado && sessão && ponte de cobrança nativa (Capacitor) presente. Faltando qualquer um:
   purchase() devolve {ok:false, reason:'soon'} e a tela mostra "Pagamento em breve" (nada é cobrado, nada muda no save).
   Ponte nativa esperada (plugin do APK, a definir pelo agente do APK): window.Capacitor.Plugins[DATA.plugin].purchase({productId, accountId})
   → {purchaseToken, orderId} (accountId = setObfuscatedAccountId, que o servidor confere). Cancelado pelo jogador → reason 'cancelled'.
   Entrega SEM duplicar: o id de cada entrega aplicada vai para S.sys.buy.applied antes do ack; se o app fechar entre gravar e confirmar,
   na próxima abertura a entrega volta da lista, é reconhecida pelo id e só recebe o ack (não é aplicada de novo).
   COMPRA SIMULADA (pedido do dono, 13/11): SÓ no Modo dono (OWNER_MODE do app de teste E save separado 'eras_owner_v1'; o app do jogador nunca
   entra aqui). purchase() não chama Google nem servidor: mostra "COMPRA SIMULADA — nada é cobrado", monta as MESMAS entregas que o servidor daria
   (fps-server catalog.ts + PurchaseCore.resolveGrants: 💎 em dobro na 1ª compra do pacote, pontos VIP = reais gastos, passe da temporada) e aplica
   pelo MESMO applyGrants, com id 'sim:...' em S.sys.buy.applied (o caminho de verdade, só sem a cobrança). */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Sys = root.Sys || {}; root.Sys.buy = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';
  const DATA = {
    on: false,
    plugin: 'EonBilling',          // nome do plugin Capacitor de cobrança (o agente do APK confirma)
    simForce: false,               // só testes: força o modo simulado sem OWNER_MODE (nunca ligar no jogo)
    ownerSaveKey: 'eras_owner_v1', // a simulação exige o save SEPARADO do Modo dono
    keepApplied: 200,
    /* produto da loja → oferta local (o pacote da 1ª compra é entregue pelo Sys.offer.grant, com a arma da era do jogador) */
    offerProduct: 'first_offer',
    /* CATÁLOGO para as telas desenharem (MESMOS ids e preços do servidor: fps-server/src/core/purchases/catalog.ts; o servidor é quem vale).
       Lista para o dono cadastrar no Play Console: reports/play-console-produtos.md. once = uma vez por conta (trava no servidor). */
    products: [
      { id: 'gems_60', kind: 'gems', name: '60 Diamantes', brl: 4.90, gems: 60, firstDouble: true },
      { id: 'gems_130', kind: 'gems', name: '130 Diamantes', brl: 9.90, gems: 130, firstDouble: true },
      { id: 'gems_350', kind: 'gems', name: '350 Diamantes', brl: 24.90, gems: 350, firstDouble: true },
      { id: 'gems_750', kind: 'gems', name: '750 Diamantes', brl: 49.90, gems: 750, firstDouble: true },
      { id: 'gems_1600', kind: 'gems', name: '1.600 Diamantes', brl: 99.90, gems: 1600, firstDouble: true },
      { id: 'gems_3400', kind: 'gems', name: '3.400 Diamantes', brl: 199.90, gems: 3400, firstDouble: true },
      { id: 'monthly_card', kind: 'monthly_card', name: 'Cartão Mensal', brl: 19.90, gems: 300, daily: 60, days: 30 },
      { id: 'pass_premium', kind: 'pass_premium', name: 'Passe Premium', brl: 24.90, oncePerSeason: true },
      { id: 'first_offer', kind: 'offer', name: 'Oferta do Guardião', brl: 29.90, once: true },
      { id: 'mount_mecha', kind: 'mount', name: 'Mecha de Guerra', brl: 49.90, mountId: 'mecha', once: true },
      { id: 'skin_kael_paladin', kind: 'skin', name: 'Kael Paladino', brl: 24.90, skinId: 'kael_paladin', hero: 'kael', once: true },
      { id: 'skin_kaia_harlequin', kind: 'skin', name: 'Kaia Arlequina', brl: 24.90, skinId: 'kaia_harlequin', hero: 'kaia', once: true },
      { id: 'skin_kael_cyborg', kind: 'skin', name: 'Kael Ciborgue', brl: 39.90, skinId: 'kael_cyborg', hero: 'kael', once: true },
    ],
  };
  const Sys = () => root.Sys || {};
  const int0 = v => Math.max(0, Math.floor(typeof v === 'number' && isFinite(v) ? v : 0));

  function ensure(S) {
    if (!S || typeof S !== 'object') throw new Error('Sys.buy.ensure: save inválido');
    if (!S.sys || typeof S.sys !== 'object') S.sys = {};
    let o = S.sys.buy; if (!o || typeof o !== 'object') o = S.sys.buy = {};
    o.v = 1; if (!Array.isArray(o.applied)) o.applied = []; o.applied = o.applied.filter(x => typeof x === 'string').slice(-DATA.keepApplied);
    o.purchasedGems = int0(o.purchasedGems);   // 💎 comprados (nunca circulam entre contas; o servidor guarda a carteira real)
    return o;
  }
  const net = () => { const N = Sys().net; return N && N.DATA && N.DATA.on ? N : null; };
  const bridge = () => { try { const P = root.Capacitor && root.Capacitor.Plugins; const b = P && P[DATA.plugin]; return b && typeof b.purchase === 'function' ? b : null; } catch (e) { return null; } };

  /* ---------- MODO DONO: compra simulada ---------- */
  /** true só no app de teste com o Modo dono ligado E o save separado (as duas travas; o save real nunca é tocado) */
  function simulated() {
    if (DATA.simForce === true) return true;
    try { return typeof OWNER_MODE !== 'undefined' && OWNER_MODE === true && typeof SAVE_KEY !== 'undefined' && SAVE_KEY === DATA.ownerSaveKey; } catch (e) { return false; }   // eslint-disable-line no-undef
  }
  function simState(S) { const o = ensure(S); let z = o.sim; if (!z || typeof z !== 'object') z = o.sim = {};
    z.cents = int0(z.cents); z.n = int0(z.n); if (!z.bought || typeof z.bought !== 'object') z.bought = {}; if (!Array.isArray(z.log)) z.log = [];
    if (!z.card || typeof z.card !== 'object') z.card = { until: 0, last: '' }; return z; }
  const dayKey = ms => { const C = Sys().clock; if (C && C.dayKey) return C.dayKey(ms); const d = new Date(ms); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const nowOf = host => { const t = host && host.now && host.now(); return typeof t === 'number' && isFinite(t) ? t : Date.now(); };
  /** as entregas que o SERVIDOR daria para este produto (mesma regra do catalog.ts + resolveGrants) */
  function simGrants(S, p) {
    const z = simState(S), first = (z.bought[p.id] | 0) === 0, cents = Math.round(p.brl * 100), g = [];
    if (p.kind === 'gems') g.push({ kind: 'gems', amount: p.gems * (p.firstDouble && first ? 2 : 1), firstDouble: !!(p.firstDouble && first) });
    else if (p.kind === 'monthly_card') { g.push({ kind: 'gems', amount: p.gems }); g.push({ kind: 'monthly_card', days: p.days, daily: p.daily }); }
    else if (p.kind === 'pass_premium') g.push({ kind: 'pass_premium', season: 'current' });
    else if (p.kind === 'offer') { g.push({ kind: 'bundle', att: { offer: 'first_offer' } }); g.push({ kind: 'gems', amount: 300, deliveredBy: 'offer' }); }
    else if (p.kind === 'mount') g.push({ kind: 'mount', mountId: p.mountId });
    else if (p.kind === 'skin') g.push({ kind: 'skin', skinId: p.skinId });
    const pts = Math.floor((z.cents + cents) / 100) - Math.floor(z.cents / 100);   // VIP = reais gastos (centavos somados, como o servidor)
    if (pts > 0) g.push({ kind: 'vip_points', amount: pts });
    return { grants: g, cents };
  }
  /** pode comprar de novo? (as travas do servidor: oferta só antes de qualquer compra, Mecha/skin uma vez, passe uma vez na temporada) */
  function simCheck(S, p) {
    const z = simState(S), X = Sys();
    if (p.once && (z.bought[p.id] | 0) > 0) return 'owned';
    if (p.kind === 'offer' && Object.keys(z.bought).some(k => (z.bought[k] | 0) > 0)) return 'not_eligible';
    if (p.kind === 'pass_premium') { try { const o = X.pass && X.pass.ensure ? X.pass.ensure(S) : null; if (o && o.premium) return 'owned'; } catch (e) {} }
    if (p.kind === 'skin') { try { const A = X.appearance, x = A && A.skinProducts ? A.skinProducts(S).find(q => q.productId === p.id) : null; if (x && x.owned) return 'owned'; if (x && x.available === false) return 'wrong_hero'; } catch (e) {} }
    return '';
  }
  /** confirmação na tela (só no navegador; sem DOM, ex. testes ou servidor, segue direto) */
  function simConfirm(p) {
    const D = root.document; if (!D || !D.body || typeof D.createElement !== 'function') return Promise.resolve(true);
    return new Promise(res => {
      const v = D.createElement('div'); v.setAttribute('role', 'alertdialog'); v.setAttribute('aria-label', 'Compra simulada');
      v.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(8,6,4,.82);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;font-family:Nunito,system-ui,sans-serif';
      const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      v.innerHTML = '<div style="max-width:320px;width:100%;background:#241b14;border:2px solid #ffcf4a;border-radius:18px;padding:18px;color:#f6ecdf;text-align:center;display:flex;flex-direction:column;gap:10px">'
        + '<b style="font-family:Lilita One,sans-serif;font-size:22px;color:#ffcf4a">COMPRA SIMULADA</b>'
        + '<span style="font-size:15px;font-weight:800">' + esc(p.name) + ' · ' + esc(priceText(p.id)) + '</span>'
        + '<span style="font-size:13px;font-weight:700;color:#e8dccb">Modo dono: nada é cobrado. A entrega é a mesma que o servidor daria, no save de teste.</span>'
        + '<div style="display:flex;gap:8px;margin-top:4px"><button data-k="0" style="flex:1;min-height:48px;border-radius:14px;border:2px solid #4a3a2b;background:#3a2c20;color:#f6ecdf;font:900 15px Nunito,sans-serif">Cancelar</button>'
        + '<button data-k="1" style="flex:1;min-height:48px;border-radius:14px;border:0;background:linear-gradient(#ffd75e,#f0a92a);color:#3a2408;font:900 15px Nunito,sans-serif">Comprar (simulado)</button></div></div>';
      const done = ok => { try { v.remove(); } catch (e) {} res(ok); };
      v.addEventListener('click', e => { const b = e.target && e.target.closest ? e.target.closest('button[data-k]') : null; if (b) done(b.getAttribute('data-k') === '1'); else if (e.target === v) done(false); });
      D.body.appendChild(v); try { v.querySelector('button[data-k="1"]').focus(); } catch (e) {}
    });
  }
  async function simPurchase(S, host, p) {
    const why = simCheck(S, p); if (why) return { ok: false, reason: why, simulated: true };
    if (!(host && host.simConfirm === false) && !(await simConfirm(p))) return { ok: false, reason: 'cancelled', simulated: true };
    const z = simState(S), { grants, cents } = simGrants(S, p), id = 'sim:' + p.id + ':' + (++z.n);
    const got = applyGrants(S, host, grants, false, id), o = ensure(S);
    if (p.kind === 'monthly_card') { const now = nowOf(host); z.card.until = Math.max(now, z.card.until) + p.days * 86400000; }
    z.cents += cents; z.bought[p.id] = (z.bought[p.id] | 0) + 1; z.log.push({ id, p: p.id, at: nowOf(host) }); z.log = z.log.slice(-50);
    o.applied.push(id); o.applied = o.applied.slice(-DATA.keepApplied);
    try { if (host && host.save) host.save(); else if (typeof root.save === 'function') root.save(); } catch (e) {}
    return { ok: true, status: 'granted', simulated: true, applied: [{ id, revoke: false, got }] };
  }
  /** Cartão Mensal simulado: 60 💎 por dia enquanto valer (no jogo de verdade é POST /purchases/monthly-card/claim) */
  function cardStatus(S, host) { const z = simState(S), now = nowOf(host); return { active: z.card.until > now, daysLeft: Math.max(0, Math.ceil((z.card.until - now) / 86400000)), claimedToday: z.card.last === dayKey(now), simulated: simulated() }; }
  function cardClaim(S, host) {
    if (!simulated()) return { ok: false, reason: 'soon' };
    const st = cardStatus(S, host); if (!st.active) return { ok: false, reason: 'no_card' }; if (st.claimedToday) return { ok: false, reason: 'claimed' };
    const p = product('monthly_card'), z = simState(S); z.card.last = dayKey(nowOf(host)); if (host && host.addGems) host.addGems(p.daily); else S.gems = int0(S.gems) + p.daily;
    try { if (host && host.save) host.save(); } catch (e) {} return { ok: true, gems: p.daily, simulated: true };
  }
  /** atalho do Modo dono: põe o VIP no nível n (pontos = o mínimo do nível; os benefícios ligam como no jogo) */
  function simVip(S, n) {
    if (!simulated()) return { ok: false, reason: 'soon' };
    const V = Sys().vip; if (!V || !V.DATA || !V.setLevel) return { ok: false, reason: 'no_vip' };
    const l = Math.max(0, Math.min(V.DATA.maxLevel, int0(n))), pts = int0(V.DATA.points[l]);
    if (!S.sys || typeof S.sys !== 'object') S.sys = {}; S.sys.vip = Object.assign({}, S.sys.vip, { points: pts }); V.setLevel(S, l);
    return { ok: true, level: l, points: pts, simulated: true };
  }

  /** a tela pergunta antes de mostrar o botão: true = cobrança de verdade (ou a SIMULADA do Modo dono); false = "Pagamento em breve" */
  function ready() { if (simulated()) return true; const N = net(); return !!(DATA.on && N && bridge() && (!N.hasSession || N.hasSession())); }

  /** compra um produto do catálogo do servidor. Resolve {ok, status, reason, applied} */
  async function purchase(S, host, productId) {
    if (simulated()) { const p = product(productId); if (!p) return { ok: false, reason: 'unavailable' }; return simPurchase(S, host, p); }
    if (!ready()) return { ok: false, reason: 'soon' };
    if (!available(productId, S)) return { ok: false, reason: 'unavailable' };
    const N = net(), B = bridge();
    try {
      const can = await N.canBuy(productId);
      if (can && can.ok === false) return { ok: false, reason: can.reason || 'unavailable' };
      const accountId = await N.accountId();
      let r;
      try { r = await B.purchase({ productId, accountId }); }
      catch (e) { const m = String(e && (e.code || e.message) || ''); return { ok: false, reason: /cancel/i.test(m) ? 'cancelled' : 'store_error' }; }
      if (!r || !r.purchaseToken) return { ok: false, reason: 'cancelled' };
      const v = await N.verifyGoogle({ productId, purchaseToken: r.purchaseToken, orderId: r.orderId });
      const applied = await sync(S, host);                 // o que entregar vem SEMPRE das entregas (a resposta acima é só informativa)
      return { ok: v.status === 'granted' || v.status === 'already_granted', status: v.status, reason: v.status === 'pending' ? 'pending' : '', applied };
    } catch (e) { return { ok: false, reason: e && e.code === 'offline' ? 'offline' : (e && e.code) || 'error' }; }
  }

  /* ---------- aplicar uma entrega (contrato §7 "Como o jogo aplica cada entrega") ---------- */
  function applyGrants(S, host, grants, revoke, ref) {
    const sign = revoke ? -1 : 1, X = Sys(), o = ensure(S), out = [];
    for (const g of grants || []) {
      if (!g || typeof g !== 'object') continue;
      if (g.kind === 'gems') {
        if (g.deliveredBy === 'offer') continue;                     // a oferta soma os 💎 dela no Sys.offer.grant
        const n = int0(g.amount); if (!n) continue;
        if (!revoke) { if (host && host.addGems) host.addGems(n); o.purchasedGems += n; }
        else { const cur = int0(S.gems), take = Math.min(cur, n); if (host && host.addGems) host.addGems(-take); else S.gems = cur - take; o.purchasedGems = Math.max(0, o.purchasedGems - n); }
        out.push({ kind: 'gems', n: sign * n });
      } else if (g.kind === 'bundle') {
        if (g.att && g.att.offer) {
          if (!revoke && X.offer && X.offer.grant) { const r = X.offer.grant(S, host, { ignoreWindow: true }); out.push({ kind: 'offer', ok: !!(r && r.ok), reason: r && r.reason }); }
          else if (revoke) out.push({ kind: 'offer', revoke: true });   // estorno da oferta: o servidor já marcou; o item fica (sem tirar arma da mão)
        } else if (!revoke && g.att && X.loot && X.loot.grantBundle) { X.loot.grantBundle(S, host, g.att); out.push({ kind: 'bundle' }); }
      } else if (g.kind === 'vip_points') {
        if (X.vip && X.vip.addPoints) { X.vip.addPoints(S, sign * int0(g.amount)); out.push({ kind: 'vip', n: sign * int0(g.amount) }); }
      } else if (g.kind === 'pass_premium') {
        if (X.pass && X.pass.setPremium) { X.pass.setPremium(S, !revoke); out.push({ kind: 'pass', on: !revoke, season: g.season || null }); }
      } else if (g.kind === 'skin') {
        if (!g.skinId) continue;
        /* skin FIXA do Sys.appearance (as 3 à venda): grantFixed com source 'shop'; skin antiga (lista do jogo): host.addSkin */
        const A = X.appearance; let fx = null;
        if (!revoke) { try { if (A && A.grantFixed && A.FIXED && A.FIXED.some(f => f.id === g.skinId)) fx = A.grantFixed(S, g.skinId, { source: 'shop' }); } catch (e) { fx = null; }
          if (!fx) { if (host && host.addSkin) host.addSkin(g.skinId); else { S.skins = Array.isArray(S.skins) ? S.skins : []; if (!S.skins.includes(g.skinId)) S.skins.push(g.skinId); } } }
        else if (Array.isArray(S.skins)) S.skins = S.skins.filter(k => k !== g.skinId);
        out.push({ kind: 'skin', id: g.skinId, on: !revoke, fixed: !!fx, ok: fx ? fx.ok !== false : true, reason: fx && fx.reason });
      } else if (g.kind === 'mount') {
        /* montaria comprada inteira (Mecha de guerra): Sys.mount.add. Estorno: a compra fica marcada no servidor (GET /entitlements); a montaria
           não é tirada da mão do jogador aqui (decisão de produto pendente; o servidor já não conta como comprada) */
        if (!revoke && g.mountId) { const N = X.newDrops; let r = null;
          if (N && N.grantProduct) r = N.grantProduct(S, host, 'mount_' + g.mountId, ref || g.mountId);   // fps-69: idempotente pelo pedido; 2ª compra = 10 fragmentos
          else if (X.mount && X.mount.add) r = X.mount.add(S, host, g.mountId);
          out.push({ kind: 'mount', id: g.mountId, ok: !!(r && r.ok !== false), r }); }
        else if (revoke) out.push({ kind: 'mount', id: g.mountId, revoke: true });
      } else if (g.kind === 'monthly_card') out.push({ kind: 'card' });   // só mostra; o resgate diário é POST /purchases/monthly-card/claim
    }
    return out;
  }

  /** busca as entregas pendentes, aplica as novas, grava (host.save) e confirma. Devolve a lista do que foi aplicado agora. */
  async function sync(S, host) {
    const N = net(); if (!DATA.on || !N) return [];
    const o = ensure(S), list = await N.deliveries(), done = [];
    for (const d of Array.isArray(list) ? list : []) {
      if (!d || typeof d.id !== 'string') continue;
      if (!o.applied.includes(d.id)) {
        const got = applyGrants(S, host, d.grants, !!d.revoke, d.id);
        o.applied.push(d.id); o.applied = o.applied.slice(-DATA.keepApplied);
        try { if (host && host.save) host.save(); else if (typeof root.save === 'function') root.save(); } catch (e) {}
        done.push({ id: d.id, revoke: !!d.revoke, got });
      }
      try { await N.ackDelivery(d.id); } catch (e) { /* fica pendente no servidor; na próxima abertura volta e só recebe o ack */ }
    }
    return done;
  }

  /** produto do catálogo pelo id (ou null) e o preço em texto pt-BR ("R$ 49,90") */
  const product = id => DATA.products.find(p => p.id === id) || null;
  /** à venda AGORA? montaria só quando o Sys.newDrops diz que ela está liberada (Sys.mount.add recusa montaria com a chave desligada);
      skin só com a venda ligada (Sys.appearance.DATA.skinsOn), a ARTE pronta (sem arte ela entra na coleção mas não equipa) e, com o save S,
      do herói certo e ainda não comprada */
  const available = (id, S) => { const p = product(id); if (!p) return false;
    if (p.kind === 'skin') { try { const A = Sys().appearance, x = A && A.skinProducts ? A.skinProducts(S).find(q => q.productId === id) : null;
      return !!(x && x.on && x.art && x.available && !x.owned); } catch (e) { return false; } }
    if (p.kind !== 'mount') return true;
    try { const N = Sys().newDrops, s = N && N.shop ? N.shop() : []; const x = s.find(q => q.productId === id); return !!(x && x.on); } catch (e) { return false; } };
  const priceText = id => { const p = product(id); return p ? 'R$ ' + p.brl.toFixed(2).replace('.', ',') : ''; };
  return { DATA, ensure, ready, purchase, sync, applyGrants, product, priceText, available, simulated, simVip, cardStatus, cardClaim };
});
