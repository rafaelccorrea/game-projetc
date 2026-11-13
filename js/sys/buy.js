/* Sys.buy — COMPRA PELO GOOGLE PLAY no jogo (Servidor fps-6f). Nasce DESLIGADO (DATA.on=false).
   Contrato: docs/API_SERVIDOR.md §7. Regras duras: o jogo NUNCA entrega por conta própria; quem decide é o servidor (recibo conferido no
   Google). O jogo só (1) abre a cobrança da loja, (2) manda o recibo ao servidor (Sys.net.verifyGoogle) e (3) aplica as ENTREGAS que o servidor
   lista (GET /purchases/deliveries), confirmando cada uma (ack) só DEPOIS de gravar o save.
   Pronto para comprar = DATA.on && Sys.net ligado && sessão && ponte de cobrança nativa (Capacitor) presente. Faltando qualquer um:
   purchase() devolve {ok:false, reason:'soon'} e a tela mostra "Pagamento em breve" (nada é cobrado, nada muda no save).
   Ponte nativa esperada (plugin do APK, a definir pelo agente do APK): window.Capacitor.Plugins[DATA.plugin].purchase({productId, accountId})
   → {purchaseToken, orderId} (accountId = setObfuscatedAccountId, que o servidor confere). Cancelado pelo jogador → reason 'cancelled'.
   Entrega SEM duplicar: o id de cada entrega aplicada vai para S.sys.buy.applied antes do ack; se o app fechar entre gravar e confirmar,
   na próxima abertura a entrega volta da lista, é reconhecida pelo id e só recebe o ack (não é aplicada de novo). */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Sys = root.Sys || {}; root.Sys.buy = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';
  const DATA = {
    on: false,
    plugin: 'EonBilling',          // nome do plugin Capacitor de cobrança (o agente do APK confirma)
    keepApplied: 200,
    /* produto da loja → oferta local (o pacote da 1ª compra é entregue pelo Sys.offer.grant, com a arma da era do jogador) */
    offerProduct: 'first_offer',
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

  /** a tela pergunta antes de mostrar o botão: true = cobrança de verdade; false = "Pagamento em breve" */
  function ready() { const N = net(); return !!(DATA.on && N && bridge() && (!N.hasSession || N.hasSession())); }

  /** compra um produto do catálogo do servidor. Resolve {ok, status, reason, applied} */
  async function purchase(S, host, productId) {
    if (!ready()) return { ok: false, reason: 'soon' };
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
  function applyGrants(S, host, grants, revoke) {
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
        if (!revoke) { if (host && host.addSkin) host.addSkin(g.skinId); else { S.skins = Array.isArray(S.skins) ? S.skins : []; if (!S.skins.includes(g.skinId)) S.skins.push(g.skinId); } }
        else if (Array.isArray(S.skins)) S.skins = S.skins.filter(k => k !== g.skinId);
        out.push({ kind: 'skin', id: g.skinId, on: !revoke });
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
        const got = applyGrants(S, host, d.grants, !!d.revoke);
        o.applied.push(d.id); o.applied = o.applied.slice(-DATA.keepApplied);
        try { if (host && host.save) host.save(); else if (typeof root.save === 'function') root.save(); } catch (e) {}
        done.push({ id: d.id, revoke: !!d.revoke, got });
      }
      try { await N.ackDelivery(d.id); } catch (e) { /* fica pendente no servidor; na próxima abertura volta e só recebe o ack */ }
    }
    return done;
  }

  return { DATA, ensure, ready, purchase, sync, applyGrants };
});
