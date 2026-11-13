/* Sys.online — LIGA O JOGO AO SERVIDOR (Servidor fps-6f). Nasce DESLIGADO (DATA.on=false). Uma chamada no boot e uma por gravação:
     Sys.online.boot(S, host, ganchos)  → sessão de convidado, save na nuvem (§3.3), entregas de compra (Sys.buy) e correio (Sys.mail)
     Sys.online.saved(S)                → depois de cada save() do jogo: marca sujo e sobe para a nuvem no máximo a cada DATA.pushEveryMs
   Desligado, sem Sys.net ou sem rede: não faz nada e o jogo segue 100% local (nunca trava a abertura).
   ganchos (do jogo):
     summary(S)           → {level, xp, era, stage, fc, gems, playSeconds, maxRarity} (o resumo que o servidor confere; contrato §3)
     apply(save)          → troca o save do aparelho pelo da nuvem (o jogo recarrega a partir dele)
     choose(info)         → Promise<'device'|'cloud'>: os dois mudaram (o jogo mostra a escolha; info = {cloud, device, recommend})
     storage              → {get(k), set(k,v)} do aparelho (padrão: localStorage); clientVersion → VERSION do jogo
   Ordem no boot: sessão → save → entregas → correio. Cada passo falha sozinho (offline, servidor fora) sem impedir os outros. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.Sys = root.Sys || {}; root.Sys.online = api;
})(typeof self !== 'undefined' ? self : globalThis, function (root) {
  'use strict';
  const DATA = { on: false, pushEveryMs: 60000, base: null };
  const X = () => root.Sys || {};
  const st = { booted: false, last: 0, timer: null, hooks: null, S: null, log: [] };
  const note = (k, v) => { st.log.push({ k, v, t: Date.now() }); if (st.log.length > 50) st.log.shift(); };
  const ls = () => { try { const L = root.localStorage; return L ? { get: k => L.getItem(k), set: (k, v) => L.setItem(k, v) } : null; } catch (e) { return null; } };

  function ready() { const N = X().net; return !!(DATA.on && N && N.DATA); }

  async function boot(S, host, hooks) {
    hooks = hooks || {}; st.hooks = hooks; st.S = S; st.host = host;
    if (!ready()) return { ok: false, reason: 'off' };
    const N = X().net, out = { ok: true, save: null, deliveries: 0, mail: 0, errors: [] };
    N.DATA.on = true; if (DATA.base) N.DATA.base = DATA.base;
    N.init({ storage: hooks.storage || ls(), clientVersion: hooks.clientVersion || '0' });
    try { await N.ensureSession(); } catch (e) { note('session', e.code); return { ok: false, reason: e.code || 'session' }; }
    clockSync(host);   // agenda (Sys.schedule) e afins passam a usar a hora do servidor
    /* save na nuvem (contrato §3.3): sobe, não faz nada, baixa, ou pergunta */
    try {
      /* o resumo vai como FUNÇÃO: o Sys.net monta na hora de cada pedido (depois do choose, que pode demorar, o S pode ter mudado) */
      const sum = hooks.summary ? (S2 => hooks.summary(S2)) : {};
      let r = await N.sync(S, sum);
      if (r.action === 'choose') { const side = hooks.choose ? await hooks.choose(r) : r.recommend; r = await N.chooseSide(side === 'cloud' ? 'cloud' : 'device', S, sum); }
      /* o jogo pode RECUSAR (servidor errado) ou deixar PENDENTE (batalha já começou): apply === false → o S do jogo continua o mesmo */
      if (r.action === 'pulled' && r.save && hooks.apply) { if (hooks.apply(r.save) !== false) S = st.S = r.save; else out.pending = true; }
      out.save = r.action; st.synced = true;
    } catch (e) { out.errors.push('save:' + (e.code || 'erro')); note('save', e.code); out.saveFailed = true; st.synced = false; }   // sem comparar com a nuvem nesta abertura: NADA sobe (só marca o aparelho como mudado)
    /* compras: aplica as entregas pendentes (inclusive as confirmadas pelo Google com o app fechado) */
    try { if (X().buy && X().buy.DATA.on) out.deliveries = (await X().buy.sync(S, host)).length; } catch (e) { out.errors.push('buy:' + (e.code || 'erro')); }
    /* correio do servidor → caixa local (Sys.mail junta sem duplicar; o resgate continua idempotente pelo id) */
    try { const M = X().mail; if (M && M.DATA.enabled) { const l = await N.mail(); out.mail = M.receive(S, host, (l && l.items) || l || []); } } catch (e) { out.errors.push('mail:' + (e.code || 'erro')); }
    st.booted = true; st.last = Date.now();
    return out;
  }

  /* hora do servidor para os módulos de horário (cada resposta do servidor atualiza o desvio no Sys.net) */
  function clockSync(host) { try { const Sc = X().schedule, N = X().net; if (Sc && Sc.setServerTime && N && N.serverNow) Sc.setServerTime(N.serverNow(), host); } catch (e) {} }
  /* chamado depois de cada save() local: sobe com intervalo mínimo (o servidor também limita: SAVE_MIN_INTERVAL_SECONDS) */
  function saved(S) {
    if (!ready()) return false;
    const N = X().net;
    /* sem boot (sem rede na abertura): ainda assim marca o aparelho como MUDADO, senão na próxima abertura a nuvem ganharia sem pergunta */
    if (!st.booted || !st.synced) { try { if (N && N.markDirty && st.hooks) N.markDirty(); } catch (e) {} return false; }   // sync da abertura falhou: a próxima abertura compara e decide
    st.S = S || st.S; N.markDirty();
    if (st.timer) return true;
    const wait = Math.max(0, st.last + DATA.pushEveryMs - Date.now());
    st.timer = setTimeout(async () => { st.timer = null; st.last = Date.now();
      try { const h = st.hooks; await N.push(st.S, h && h.summary ? (S2 => h.summary(S2)) : {}); clockSync(st.host); }
      catch (e) { note('push', e.code); if (e.code === 'save_conflict' && st.hooks && st.hooks.conflict) st.hooks.conflict(e.details); } }, wait);
    return true;
  }
  function _reset() { if (st.timer) clearTimeout(st.timer); Object.assign(st, { booted: false, synced: false, last: 0, timer: null, hooks: null, S: null, log: [] }); }
  return { DATA, ready, boot, saved, log: () => st.log.slice(), _reset };
});
