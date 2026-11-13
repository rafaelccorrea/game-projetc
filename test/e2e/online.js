'use strict';
/* TESTE DO ONLINE NA ABERTURA (Engenheiro 12; sem navegador e SEM REDE). Rodar: node test/e2e/online.js [-v]
   Sobe o jogo no sandbox do e2e (partida real do index.html, runBoot) com os módulos REAIS do Servidor (js/sys/net.js + js/sys/online.js), o
   js/onlineboot.js e a tela real js/cloudchoice.js, contra um SERVIDOR DE MENTIRA (fetch falso: toda URL http(s) cai nele; nada sai para a rede).
   A chave do jogo nasce DESLIGADA (ONLINE_ON = false): os cenários "ligado" usam ?debug=1&online=1.
   Prova: desligado = nenhuma chamada; servidor mudo = entra em até 4 s com o save local; save da nuvem antes da batalha = grava e recarrega (só
   se o servidor bate); depois da batalha = pendente, aplica na abertura seguinte; escolha Nuvem × Aparelho (com a tela e sem ela); saved() a cada
   save(); Modo dono / __noSave / save de outro servidor nunca; servidor s2 usa as chaves do s2; resumo com a FC real; login Google (3 caminhos).
   Sai com código 1 se algo reprovar. */
const VERBOSE = process.argv.includes('-v');
const vm = require('vm');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, total = 0; const check = (name, ok, err) => { total++; if (!ok) fail++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok ? '' : ' — ' + (err == null ? '' : err))); };
const sec = t => { if (VERBOSE) console.log('\n' + t); };

/* o sandbox cria o contexto por dentro: o 1º vm.runInContext de cada jogo entrega o contexto ao teste (fetch falso e chaves do localStorage ANTES da carga) */
let onCtx = null; const rin = vm.runInContext;
vm.runInContext = function (code, ctx) { if (onCtx && ctx && !ctx.__onlineTest) { ctx.__onlineTest = true; const f = onCtx; onCtx = null; f(ctx); } return rin.apply(this, arguments); };

const LOCAL = { gold: 1234, gems: 77, stage: 9, wave: 2, best: 9, eraMax: 0, nextId: 3, name: 'Velho', hero: 'kael', tut: 99, welcome: true, kills: 5, lastSeen: Date.now() - 5000,
  inv: [{ id: 1, slot: 'weapon', r: 2, e: 0, lvl: 1, gold: 0, subs: [] }, { id: 2, slot: 'armor', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }], eq: { weapon: 1, armor: 2 }, skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' } };
const mk = (o) => Object.assign({}, LOCAL, o || {});
const SUM = o => Object.assign({ level: 1, xp: 0, era: 0, stage: 9, fc: 100, gems: 77, playSeconds: 0, maxRarity: 2 }, o || {});
const cloudOf = (version, save, summary) => ({ version, updatedAt: Date.now() - 60000, deviceId: 'outro-aparelho', summary: SUM(summary), save });
const netMem = o => JSON.stringify(Object.assign({ deviceId: 'dev-1', access: 'A0', refresh: 'R0', accessExpiresAt: 0, player: { id: 'p1' } }, o || {}));

/* ---------------- servidor de mentira (contrato docs/API_SERVIDOR.md) ---------------- */
function mkServer(o) {
  const sv = Object.assign({ calls: [], silent: false, cloud: null, google: 'ok', link: 'ok', n: 0, fail: {} }, o || {});
  const resp = (status, js) => ({ status, headers: { get: k => (k === 'x-server-time' ? String(Date.now()) : null) }, json: async () => js });
  const err = (st, code, details) => resp(st, { error: { code, details: details || {} } });
  const sess = id => ({ accessToken: 'A' + (++sv.n), refreshToken: 'R' + sv.n, accessExpiresAt: 0, player: { id, ageBand: '18+', linked: [] } });
  const head = () => ({ version: sv.cloud.version, updatedAt: sv.cloud.updatedAt, deviceId: sv.cloud.deviceId, summary: sv.cloud.summary });
  sv.fetch = (url, opt) => { opt = opt || {}; const path = String(url).replace(/^https?:\/\/[^/]+(\/v1)?/, '').split('?')[0], key = (opt.method || 'GET') + ' ' + path; let body = null; try { body = opt.body ? JSON.parse(opt.body) : null; } catch (e) {}
    sv.calls.push({ key, body, headers: opt.headers || {}, url: String(url) });
    if (sv.silent) return new Promise(() => {});
    if (sv.fail[key]) return Promise.resolve(err(sv.fail[key][0], sv.fail[key][1]));
    switch (key) {
      case 'POST /auth/guest': return Promise.resolve(resp(200, sess('p1')));
      case 'POST /auth/refresh': return Promise.resolve(resp(200, sess(sv.pid || 'p1')));
      case 'GET /save/head': return Promise.resolve(sv.cloud ? resp(200, head()) : err(404, 'not_found'));
      case 'GET /save': return Promise.resolve(sv.cloud ? resp(200, Object.assign(head(), { save: sv.cloud.save })) : err(404, 'not_found'));
      case 'PUT /save': { const cur = sv.cloud ? sv.cloud.version : 0; if (body.baseVersion !== cur) return Promise.resolve(err(409, 'save_conflict', { cloud: head() }));
        sv.cloud = { version: cur + 1, updatedAt: Date.now(), deviceId: body.deviceId, summary: body.summary, save: body.save }; return Promise.resolve(resp(200, { version: cur + 1, updatedAt: sv.cloud.updatedAt })); }
      case 'POST /auth/login/google': if (sv.google === 'ok') sv.pid = 'g1'; return Promise.resolve(sv.google === 'ok' ? resp(200, sess('g1')) : err(404, 'not_linked'));
      case 'POST /auth/link/google': return Promise.resolve(sv.link === 'ok' ? resp(200, { id: 'p1', ageBand: '18+', linked: ['google'] }) : err(409, 'link_taken', { otherPlayer: { level: 12, era: 1, updatedAt: 111 } }));
      case 'GET /mail': return Promise.resolve(resp(200, { items: [] }));
      default: return Promise.resolve(err(404, 'not_found')); } };
  sv.keys = () => sv.calls.map(c => c.key); sv.count = k => sv.calls.filter(c => c.key === k).length; sv.last = k => sv.calls.filter(c => c.key === k).pop();
  return sv;
}

/* ---------------- um jogo ---------------- */
const tick = () => new Promise(r => setImmediate(r));
function game(o) {
  o = o || {}; const sv = o.server || mkServer(), keys = new Set(Object.keys(o.storage || {})), loadErr = [];
  onCtx = ctx => { const f0 = ctx.fetch; ctx.fetch = (u, op) => (/^https?:\/\//.test(String(u)) ? sv.fetch(u, op) : f0(u, op));
    const ls = ctx.localStorage, si = ls.setItem; ls.setItem = (k, v) => { keys.add(k); si(k, v); };
    if (o.noChoice) Object.defineProperty(ctx, 'CloudChoice', { get() { return undefined; }, set() {}, configurable: true }); };
  const G = boot(Object.assign({ runBoot: true, search: o.search || '?debug=1&online=1&skip=1', storage: o.storage || {}, add: (g, n, ok, e) => { if (!ok && !(o.noChoice && /cloudchoice/.test(n))) loadErr.push(n + ': ' + e); } }, o.heavy ? { realFetch: true, draw: true } : {}));
  onCtx = null;
  const g = { G, ev: G.ev, sv, ls: G.sandbox.localStorage, loadErr, timerErr: [],
    snap() { const s = {}; for (const k of keys) { const v = g.ls.getItem(k); if (v != null) s[k] = v; } return s; },
    async settle(n) { for (let i = 0; i < (n || 40); i++) await tick(); },
    async adv(ms) { const step = 250; for (let t = 0; t < ms; t += step) { try { G.inCtx(() => G.advance(Math.min(step, ms - t))); } catch (e) { const s = errStr(e); if (!g.timerErr.includes(s)) g.timerErr.push(s); } await tick(); await tick(); } await g.settle(10); },
    st: () => G.ev('JSON.stringify(OnlineBoot.state())') && JSON.parse(G.ev('JSON.stringify(OnlineBoot.state())')),
    saveKey: () => G.ev('SAVE_KEY'), stored: () => { try { return JSON.parse(g.ls.getItem(G.ev('SAVE_KEY'))); } catch (e) { return null; } },
    reloaded: () => G.sandbox.location.href === G.sandbox.location.pathname + G.sandbox.location.search,
    promise(code) { G.ev('window.__pr=null; (' + code + ').then(function(v){ window.__pr={v:v}; },function(e){ window.__pr={e:String(e&&e.code||e)}; })'); return async (n) => { await g.settle(n || 60); const r = G.ev('window.__pr?JSON.stringify(window.__pr):""'); return r ? JSON.parse(r) : null; }; } };
  return g;
}
const SK = 'eras_proto_v2';

(async () => {
  /* ============ 1. DESLIGADO ============ */
  sec('1. DESLIGADO (chave ONLINE_ON = false)');
  { const g = game({ search: '?debug=1&skip=1', storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    check('1. o jogo carregou sem erro (com cloudchoice e onlineboot na lista)', !g.loadErr.length && g.G.lists.jsList.includes('onlineboot') && g.G.lists.jsList.indexOf('cloudchoice') < g.G.lists.jsList.indexOf('onlineboot') && g.G.lists.jsList.indexOf('cloudchoice') >= 0, g.loadErr.join(' | ') + ' ' + g.G.lists.jsList.join(','));
    check('1. a chave do index nasce DESLIGADA e com o endereço', g.ev('ONLINE_ON') === false && /^https:\/\/.+\/v1$/.test(g.ev('ONLINE_BASE')), g.ev('ONLINE_ON') + ' ' + g.ev('ONLINE_BASE'));
    const st = g.st(); check('1. OnlineBoot.state(): on = false, booted = false, sem pendente', st.on === false && st.booted === false && st.pending === false && st.why === 'off', JSON.stringify(st));
    check('1. Sys.net e Sys.online continuam desligados; Sys.buy não foi tocado', g.ev('Sys.net.DATA.on') === false && g.ev('Sys.online.DATA.on') === false && g.ev('Sys.buy.DATA.on') === false, '');
    g.ev('window.__sv=0; (function(){ const f=Sys.online.saved; Sys.online.saved=function(){ window.__sv++; return f.apply(this,arguments); }; })()');
    g.ev('S.gold=4321; save(); save()'); await g.adv(61000);
    check('1. save() grava no aparelho como hoje', g.stored().gold === 4321, String(g.stored() && g.stored().gold));
    check('1. NENHUMA chamada ao servidor e nenhuma ao Sys.online.saved', g.sv.calls.length === 0 && g.ev('window.__sv') === 0, g.sv.keys().join(',') + ' saved ' + g.ev('window.__sv'));
    const w = await g.promise('OnlineBoot.wait(4000)')(5); check('1. wait() resolve na hora (custo zero)', !!w && w.v === true, JSON.stringify(w));
    const r = await g.promise('OnlineBoot.google()')(); check('1. google() desligado devolve {ok:false, reason:"off"} sem travar', r && r.v && r.v.ok === false && r.v.reason === 'off', JSON.stringify(r));
    const rb = await g.promise('OnlineBoot.reboot()')(); check('1. reboot() desligado não chama nada', rb && rb.v && rb.v.ok === false && g.sv.calls.length === 0, JSON.stringify(rb));
    check('1. nenhuma chave nova no aparelho (sem eon.net, sem pendente)', g.ls.getItem('eon.net') == null && g.ls.getItem('eon_cloud_pending@s1') == null, Object.keys(g.snap()).join(',')); }
  { const g = game({ search: '?debug=1', storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    check('1. desligado, com a tela de carregamento: nenhuma tarefa "online" na barra (abertura igual à de hoje)', g.ev("Preload.pending.indexOf('online')") === -1 && g.sv.calls.length === 0, String(g.ev('Preload.pending.join("|")')).slice(0, 200)); }

  /* ============ 2. LIGADO, SERVIDOR MUDO: entra em até 4 s com o save local ============ */
  sec('2. LIGADO e servidor sem resposta');
  { const run = async (search, sv) => { const g = game({ search, heavy: true, server: sv, storage: { [SK]: JSON.stringify(mk()) } }); const G = g.G;
      const t0 = G.ev("typeof LD!=='undefined'?LD.t0:0") || Date.now(); G.sandbox.performance = { now: () => t0 + G.vnow() };
      let t = 0, fin = false, onlineDoneAt = null, hadOnline = G.ev("Preload.pending.indexOf('online')>=0");
      for (let i = 0; i < 60 * 30 && !fin; i++) { if (i % 12 === 0) { try { G.inCtx(() => G.ev('loadStep')()); } catch (e) {} } try { G.inCtx(() => G.advance(1000 / 30)); } catch (e) {} t += 1 / 30; if (i % 5 === 0) await tick();
        if (hadOnline && onlineDoneAt == null && G.ev("Preload.pending.indexOf('online')") === -1) onlineDoneAt = t; fin = G.ev('LD.fin===true'); }
      return { g, t, fin, onlineDoneAt, hadOnline }; };
    const off = await run('?debug=1', mkServer());
    const on = await run('?debug=1&online=1', mkServer({ silent: true }));
    check('2. desligado: a carga termina sozinha (referência: ' + off.t.toFixed(1) + ' s virtuais), sem tarefa "online"', off.fin && !off.hadOnline && off.g.sv.calls.length === 0, 'fin ' + off.fin + ' online ' + off.hadOnline);
    check('2. ligado: a barra tem a tarefa "online" e o boot foi disparado (pedido de sessão)', on.hadOnline && on.g.sv.count('POST /auth/guest') === 1, 'online ' + on.hadOnline + ' chamadas ' + on.g.sv.keys().join(','));
    check('2. servidor mudo: a tarefa "online" sai da barra em até 4 s (saiu em ' + (on.onlineDoneAt == null ? 'NUNCA' : on.onlineDoneAt.toFixed(1) + ' s') + ')', on.onlineDoneAt != null && on.onlineDoneAt <= 4.3 && on.onlineDoneAt >= 3.7, String(on.onlineDoneAt));
    check('2. servidor mudo: a carga termina (' + on.t.toFixed(1) + ' s) no máximo 4 s + folga depois da referência, sem aviso de falha', on.fin && on.t <= Math.max(off.t, 4) + 1 && !on.g.ev('!!LD.failUI') && on.g.ev('Preload.progress.failed.length') === 0, 't ' + on.t.toFixed(1) + ' ref ' + off.t.toFixed(1) + ' falhas ' + on.g.ev('Preload.progress.failed.join("|")'));
    const st = on.g.st(); check('2. o jogo segue com o save LOCAL (ouro 1234), boot ainda sem resposta, nada recarregou', on.g.ev('S.gold') === 1234 && st.on && !st.booted && st.booting && !on.g.reloaded() && !on.g.ev('!!window.__noSave'), JSON.stringify(st));
    on.g.ev('S.gold=1300; save()'); check('2. sem servidor o save local continua gravando', on.g.stored().gold === 1300, ''); }
  { const g = game({ server: mkServer({ fail: { 'POST /auth/guest': [500, 'internal'] } }), storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    const st = g.st(); check('2. servidor com erro 500 na sessão: boot termina sem travar, jogo local, nenhum erro lançado', st.on && !st.booted && !st.booting && st.lastAction === null && g.ev('S.gold') === 1234, JSON.stringify(st)); }

  /* ============ 3. SAVE DA NUVEM MAIS NOVO, ANTES DA BATALHA ============ */
  sec('3. Nuvem mais nova ANTES da batalha');
  let afterApply = null;
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, name: 'DaNuvem', realm: 's1' })) });
    const g = game({ search: '?debug=1&online=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } });
    check('3. antes de responder: batalha em pausa (carregamento/título)', g.ev('B.paused') === true, String(g.ev('B.paused')));
    await g.settle();
    const st = g.st(), o = g.stored();
    check('3. baixou a nuvem (sessão → cabeça → save)', sv.count('POST /auth/guest') === 1 && sv.count('GET /save/head') === 1 && sv.count('GET /save') === 1 && sv.count('PUT /save') === 0, sv.keys().join(','));
    check('3. APLICOU: gravou o save da nuvem em SAVE_KEY', o && o.gold === 999999 && o.name === 'DaNuvem', JSON.stringify(o).slice(0, 120));
    check('3. bloqueou as gravações (window.__noSave) e RECARREGOU', g.ev('window.__noSave') === true && g.reloaded(), 'noSave ' + g.ev('window.__noSave') + ' href ' + g.G.sandbox.location.href);
    check('3. estado: lastAction = applied, sem pendente, sem chave pendente', st.lastAction === 'applied' && !st.pending && g.ls.getItem('eon_cloud_pending@s1') == null, JSON.stringify(st));
    g.ev('S.gold=1; save()'); check('3. depois de aplicar, o save() da página velha NÃO cobre o save novo', g.stored().gold === 999999, String(g.stored().gold));
    afterApply = { snap: g.snap(), sv }; }
  { const g = game({ search: '?debug=1&online=1', server: afterApply.sv, storage: afterApply.snap }); const n0 = afterApply.sv.calls.length; await g.settle();
    const st = g.st(); check('3. abertura seguinte: o jogo carrega o save da nuvem (ouro 999999, nome DaNuvem)', g.ev('S.gold') === 999999 && g.ev('S.name') === 'DaNuvem', g.ev('S.gold') + ' ' + g.ev('S.name'));
    check('3. abertura seguinte: nuvem igual → nada sobe, nada desce, não recarrega de novo', st.booted && st.lastAction === 'none' && !g.reloaded() && afterApply.sv.calls.slice(n0).every(c => c.key !== 'GET /save' && c.key !== 'PUT /save'), JSON.stringify(st) + ' ' + afterApply.sv.keys().slice(n0).join(',')); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, name: 'DoS2', realm: 's2' })) }); const loc = JSON.stringify(mk());
    const same = g => { const o = g.stored(); return !!o && o.gold === 1234 && o.name === 'Velho'; };
    const g = game({ search: '?debug=1&online=1', server: sv, storage: { [SK]: loc } }); await g.settle(); const st = g.st();
    check('3. save da nuvem de OUTRO servidor (realm s2 no s1): RECUSADO: SAVE_KEY segue com o save local, sem recarga, sem pendente', same(g) && g.ev('S.gold') === 1234 && !g.reloaded() && !g.ev('!!window.__noSave') && st.lastAction === 'refused' && !st.pending && g.ls.getItem('eon_cloud_pending@s1') == null, JSON.stringify(st)); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 555, name: 'SemCarimbo' })) });   /* save.realm ausente = s1 */
    const g = game({ search: '?debug=1&online=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    check('3. save da nuvem sem o campo realm vale como s1: aplica no s1', g.stored().gold === 555 && g.reloaded(), String(g.stored().gold)); }

  /* ============ 4. DEPOIS DE A BATALHA COMEÇAR: pendente ============ */
  sec('4. Nuvem mais nova DEPOIS de a batalha começar');
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, name: 'DaNuvem', realm: 's1' })) }); const loc = JSON.stringify(mk());
    const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: { [SK]: loc } });
    check('4. a batalha já começou (B.paused = false) quando a resposta chega', g.ev('B.paused') === false, String(g.ev('B.paused')));
    await g.settle(); const st = g.st();
    check('4. NÃO aplicou no meio do jogo: SAVE_KEY é o save local, S em memória é o local, sem recarga, gravações liberadas', g.stored().gold === 1234 && g.stored().name === 'Velho' && g.ev('S.gold') === 1234 && !g.reloaded() && !g.ev('!!window.__noSave'), 'ouro ' + g.ev('S.gold') + ' href ' + g.G.sandbox.location.href);
    const pj = g.ls.getItem('eon_cloud_pending@s1'), p = pj ? JSON.parse(pj) : null;
    check('4. ficou PENDENTE: em memória (state.pending) e na chave eon_cloud_pending@s1 (com o save inteiro e o servidor)', st.pending && st.lastAction === 'pending' && p && p.realm === 's1' && p.save.gold === 999999 && p.save.name === 'DaNuvem', JSON.stringify(st) + ' ' + String(pj).slice(0, 80));
    const puts = sv.count('PUT /save'); g.ev('S.gold=2000; save(); save()'); await g.adv(125000);
    check('4. com save pendente o jogo local continua gravando no aparelho', g.stored().gold === 2000, String(g.stored().gold));
    check('4. com save pendente NADA sobe para a nuvem (o aparelho está atrás): nenhum PUT', sv.count('PUT /save') === puts && sv.cloud.version === 5, 'PUT ' + sv.count('PUT /save'));
    /* abertura seguinte */
    const n0 = sv.calls.length, g2 = game({ search: '?debug=1&online=1', server: sv, storage: g.snap() }); await g2.settle(); const st2 = g2.st();
    check('4. ABERTURA SEGUINTE: o pendente entra antes de o jogo começar: SAVE_KEY = save da nuvem, recarrega, chave pendente apagada', g2.stored().gold === 999999 && g2.reloaded() && g2.ev('window.__noSave') === true && g2.ls.getItem('eon_cloud_pending@s1') == null && st2.lastAction === 'applied', JSON.stringify(st2));
    check('4. nessa carga (que vai recarregar) nenhum pedido ao servidor', sv.calls.length === n0, sv.keys().slice(n0).join(','));
    const g3 = game({ search: '?debug=1&online=1', server: sv, storage: g2.snap() }); await g3.settle(); const st3 = g3.st();
    check('4. terceira abertura: joga com o save da nuvem, nuvem igual → "none", sem recarga', g3.ev('S.gold') === 999999 && st3.lastAction === 'none' && !st3.pending && !g3.reloaded(), JSON.stringify(st3) + ' ouro ' + g3.ev('S.gold'));
    g3.ev('B.paused=false; S.gold=1000001; save()'); await g3.adv(61000);
    check('4. e volta a subir normalmente (PUT com a base 5 → versão 6)', sv.cloud.version === 6 && sv.cloud.save.gold === 1000001, 'versão ' + sv.cloud.version); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 42, realm: 's1' })) });
    const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    const ok = g.ev('OnlineBoot.applyPending()'); check('4. OnlineBoot.applyPending() (a pedido da tela): grava o pendente e recarrega na hora', ok === true && g.stored().gold === 42 && g.reloaded() && g.ls.getItem('eon_cloud_pending@s1') == null, String(ok)); }
  { const bad = JSON.stringify({ realm: 's2', at: 1, save: mk({ gold: 7, realm: 's2' }) }), loc = JSON.stringify(mk());
    const g = game({ search: '?debug=1&online=1', storage: { [SK]: loc, 'eon_cloud_pending@s1': bad } }); await g.settle();
    check('4. pendente de OUTRO servidor na chave: descartado, nada aplicado', g.ls.getItem(SK) !== null && g.stored().gold === 1234 && g.ls.getItem('eon_cloud_pending@s1') == null && !g.reloaded(), ''); }
  { const pend = JSON.stringify({ realm: 's1', at: 1, save: mk({ gold: 7, realm: 's1' }) }), loc = JSON.stringify(mk());
    const g = game({ search: '?debug=1&skip=1', storage: { [SK]: loc, 'eon_cloud_pending@s1': pend } }); await g.settle();
    check('4. com a chave DESLIGADA um pendente antigo não é tocado nem aplicado', g.ls.getItem(SK) && g.ev('S.gold') === 1234 && g.ls.getItem('eon_cloud_pending@s1') === pend && !g.reloaded(), ''); }

  /* ============ 5. OS DOIS MUDARAM, SEM A TELA: info.recommend ============ */
  sec('5. Escolha sem a tela (window.CloudChoice ausente)');
  const dirty = { 'eon.net': netMem({ save: { version: 3, dirty: true } }) };
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { playSeconds: 500 }) });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk({ playSeconds: 400 })) }, dirty) }); await g.settle();
    check('5. sem a tela: window.CloudChoice não existe', g.ev('typeof window.CloudChoice') === 'undefined', g.ev('typeof window.CloudChoice'));
    check('5. tempo de jogo nos DOIS lados (nuvem 500 s × aparelho 400 s, aparelho com FC maior): vale o info.recommend = cloud → baixa e aplica', g.stored().gold === 999999 && g.reloaded() && sv.count('GET /save') === 1 && sv.count('PUT /save') === 0, sv.keys().join(',')); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { playSeconds: 500, fc: 1 }) });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, dirty) }); await g.settle();
    check('5. UM lado com tempo 0 (aparelho antigo 0 × nuvem 500 s): ainda vale o mais avançado (aparelho com FC maior) → sobe', sv.count('PUT /save') === 1 && sv.count('GET /save') === 0 && !g.reloaded() && sv.cloud.save.gold === 1234, sv.keys().join(',')); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { playSeconds: 500 }) });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk({ playSeconds: 900 })) }, dirty) }); await g.settle();
    check('5. aparelho com mais tempo de jogo (900 s × 500): recommend = device → sobe por cima (PUT base 5 → versão 6), sem recarga', sv.cloud.version === 6 && sv.cloud.save.gold === 1234 && !g.reloaded() && g.st().lastAction === 'push' && sv.last('PUT /save').body.baseVersion === 5, sv.keys().join(',') + ' ' + JSON.stringify(g.st())); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { level: 30 }) });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, dirty) }); await g.settle();
    check('5. EMPATE de tempo de jogo (0 × 0): vale o lado mais avançado (nuvem nível 30 × aparelho nível 1) → nuvem', g.stored().gold === 999999 && g.reloaded(), sv.keys().join(',')); }
  { const g0 = game({ search: '?debug=1&online=1&skip=1', storage: { [SK]: JSON.stringify(mk()) } }); await g0.settle(); const s = JSON.parse(g0.ev('JSON.stringify(OnlineBoot.summary(S))'));
    const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { level: s.level, stage: s.stage, fc: s.fc }) });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, dirty) }); await g.settle();
    check('5. tudo empatado: vale o info.recommend do Sys.net (device) → sobe', sv.count('PUT /save') === 1 && !g.reloaded() && sv.cloud.save.gold === 1234, sv.keys().join(',')); }

  /* ============ 6. OS DOIS MUDARAM, COM A TELA NUVEM × APARELHO ============ */
  sec('6. Escolha com a tela (js/cloudchoice.js real)');
  const conflict = async (o) => { const sv = mkServer(Object.assign({ cloud: cloudOf(5, mk({ gold: 999999, name: 'DaNuvem', realm: 's1' }), { playSeconds: 500, level: 30 }) }, o || {}));
    const g = game({ search: '?debug=1&online=1', server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, dirty) });
    g.ev("window.__w=0; OnlineBoot.wait(4000).then(function(){ window.__w=1; }); window.__cf=null; (function(){ const f=CloudChoice.failed; CloudChoice.failed=function(e){ window.__cf=e||{}; return f.apply(this,arguments); }; })()");
    await g.settle(); return g; };
  { const g = await conflict(); const st = g.st(), info = JSON.parse(g.ev('JSON.stringify(CloudChoice._state.info||null)'));
    check('6. a tela abriu (state.choosing) com {recommend, device, cloud:{version, updatedAt, summary}}', st.choosing && info && info.recommend === 'cloud' && info.cloud.version === 5 && info.cloud.updatedAt > 0 && info.cloud.summary.level === 30, JSON.stringify(st) + ' ' + JSON.stringify(info).slice(0, 200));
    const d = info.device; check('6. resumo do aparelho traz level, xp, era, stage, fc REAL, playSeconds, hero, avatar e savedAt (= S.lastSeen)', d && d.level >= 1 && d.xp >= 0 && d.era === 0 && d.stage === 9 && d.fc === g.ev('heroFC()') && d.fc > 0 && d.playSeconds === 0 && d.hero === 'kael' && typeof d.avatar === 'string' && d.avatar.length > 0 && d.savedAt === g.ev('S.lastSeen') && d.savedAt > 0, JSON.stringify(d));
    check('6. o OnlineBoot NÃO chamou chooseSide antes da escolha (nenhum GET /save nem PUT)', g.sv.count('GET /save') === 0 && g.sv.count('PUT /save') === 0, g.sv.keys().join(','));
    await g.adv(12000);
    check('6. com a tela aberta, os 4 s NÃO cortam: depois de 12 s a tarefa "online" continua esperando e a batalha não começou', g.ev('window.__w') === 0 && g.ev("Preload.pending.indexOf('online')") >= 0 && g.ev('B.paused') === true && g.st().choosing, 'wait ' + g.ev('window.__w') + ' paused ' + g.ev('B.paused'));
    g.ev("CloudChoice._click('cloud')"); await g.settle(); check('6. o 1º toque só marca (confirmação no 2º): nada trocou ainda', g.st().choosing && g.sv.count('GET /save') === 0, '');
    g.ev("CloudChoice._click('cloud')"); await g.settle(); const s2 = g.st();
    check('6. escolheu NUVEM: UM chooseSide (um GET /save), grava em SAVE_KEY e recarrega', g.sv.count('GET /save') === 1 && g.sv.count('PUT /save') === 0 && g.stored().gold === 999999 && g.reloaded() && s2.lastAction === 'applied' && !s2.choosing, g.sv.keys().join(',') + ' ' + JSON.stringify(s2));
    check('6. depois da escolha a espera do carregamento termina', g.ev('window.__w') === 1, String(g.ev('window.__w')));
    check('6. CloudChoice.failed não foi chamada', g.ev('window.__cf') === null, ''); }
  { const g = await conflict(); g.ev("CloudChoice._click('device'); CloudChoice._click('device')"); await g.settle(); const st = g.st();
    check('6. escolheu APARELHO: sobe por cima da nuvem (um PUT, base 5 → versão 6), sem recarga, save local intacto', g.sv.count('PUT /save') === 1 && g.sv.cloud.version === 6 && g.sv.cloud.save.gold === 1234 && !g.reloaded() && g.ev('S.gold') === 1234 && st.lastAction === 'push', g.sv.keys().join(',') + ' ' + JSON.stringify(st));
    check('6. depois da escolha a espera termina (o jogo segue)', g.ev('window.__w') === 1 && !st.choosing, String(g.ev('window.__w'))); }
  { const g = await conflict(); g.sv.fail['GET /save'] = [503, 'unavailable']; const loc = g.ls.getItem(SK); g.ev("CloudChoice._click('cloud'); CloudChoice._click('cloud')"); await g.settle(); const st = g.st();
    check('6. a troca FALHOU (sem rede no meio): CloudChoice.failed(err) é chamada', g.ev('window.__cf') !== null && g.ev('window.__cf.code') === 'unavailable', JSON.stringify(g.ev('window.__cf&&window.__cf.code')));
    check('6. ...e o jogo segue com o save do aparelho: SAVE_KEY intacta, sem recarga, espera terminada', g.ls.getItem(SK) === loc && !g.reloaded() && !g.ev('!!window.__noSave') && g.ev('window.__w') === 1 && st.lastAction === null, JSON.stringify(st)); }
  { const g = await conflict(); g.sv.silent = true; g.ev("CloudChoice._click('cloud'); CloudChoice._click('cloud')"); await g.settle();
    check('6. escolha feita e servidor mudo: a espera ainda dá 4 s para a troca', g.ev('window.__w') === 0, String(g.ev('window.__w'))); await g.adv(4300);
    check('6. ...e depois libera a barra (nunca trava)', g.ev('window.__w') === 1, String(g.ev('window.__w'))); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' }), { playSeconds: 500 }) });
    const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, dirty) }); await g.settle();
    g.ev("CloudChoice._click('cloud'); CloudChoice._click('cloud')"); await g.settle(); const st = g.st();
    check('6. escolha NUVEM com a batalha já rodando: não aplica no meio; fica pendente para a próxima abertura', st.pending && st.lastAction === 'pending' && g.ev('S.gold') === 1234 && !g.reloaded() && !!g.ls.getItem('eon_cloud_pending@s1'), JSON.stringify(st)); }

  /* ============ 7. saved() A CADA save(); nunca no Modo dono nem com __noSave ============ */
  sec('7. Gravações');
  const spy = g => g.ev('window.__sv=0; (function(){ const f=Sys.online.saved; Sys.online.saved=function(){ window.__sv++; return f.apply(this,arguments); }; })()');
  { const sv = mkServer(); const g = game({ server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle(); spy(g);
    check('7. abertura com nuvem vazia: sobe o save do aparelho (PUT base 0 → versão 1)', sv.cloud && sv.cloud.version === 1 && sv.cloud.save.gold === 1234 && g.st().lastAction === 'push' && g.st().booted, sv.keys().join(','));
    check('7. chaves ligadas na carga: Sys.net.DATA.on, base = ONLINE_BASE, Sys.online.DATA.on; Sys.buy.DATA.on NÃO', g.ev('Sys.net.DATA.on') === true && g.ev('Sys.net.DATA.base===ONLINE_BASE') && g.ev('Sys.online.DATA.on') === true && g.ev('Sys.buy.DATA.on') === false, '');
    check('7. todo pedido foi para o endereço da chave e com a versão do jogo no cabeçalho', sv.calls.every(c => c.url.indexOf(g.ev('ONLINE_BASE') + '/') === 0 && c.headers['x-client-version'] === g.ev('VERSION')), sv.calls.map(c => c.url).slice(0, 3).join(','));
    g.ev('S.gold=1; save(); S.gold=2; save(); S.gold=3; save()');
    check('7. Sys.online.saved(S) chamado a cada save() (3 gravações → 3 chamadas)', g.ev('window.__sv') === 3, String(g.ev('window.__sv')));
    await g.adv(61000);
    check('7. e a nuvem recebe o último estado (um PUT só, no intervalo do Servidor)', sv.count('PUT /save') === 2 && sv.cloud.version === 2 && sv.cloud.save.gold === 3, 'PUT ' + sv.count('PUT /save') + ' ouro ' + (sv.cloud && sv.cloud.save.gold));
    g.ev('window.__noSave=true; S.gold=99; save()');
    check('7. com window.__noSave: nem grava no aparelho nem chama o saved()', g.ev('window.__sv') === 3 && g.stored().gold === 3, 'saved ' + g.ev('window.__sv'));
    g.ev('window.__noSave=false; Sys.online.saved=function(){ throw new Error("quebrou"); }; S.gold=7; save()');
    check('7. erro no online NUNCA impede a gravação local', g.stored().gold === 7, String(g.stored().gold)); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's1' })) }); const g = game({ server: sv, storage: { eon_owner_mode: '1', eras_owner_v1: JSON.stringify(mk({ gold: 50 })) } }); await g.settle(); spy(g);
    const st = g.st(); g.ev('S.gold=51; save(); save()'); await g.adv(61000);
    check('7. MODO DONO com a chave ligada: nunca liga (why = owner), nenhuma chamada ao servidor, saved() nunca chamado, save do dono grava local', g.saveKey() === 'eras_owner_v1' && st.on === false && st.why === 'owner' && sv.calls.length === 0 && g.ev('window.__sv') === 0 && g.stored().gold === 51 && g.ev('Sys.net.DATA.on') === false, JSON.stringify(st) + ' ' + sv.keys().join(',')); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, realm: 's2' })) }); const bad = JSON.stringify(mk({ name: 'DO-S1', realm: 's1' }));
    const g = game({ server: sv, storage: { eon_realm: 's2', 'eras_proto_v2@s2': bad } }); await g.settle(); const st = g.st();
    check('7. save de OUTRO servidor na chave (REALM_MISMATCH): online nunca liga, nenhuma chamada, chave intacta', !!g.ev('window.REALM_MISMATCH') && st.on === false && st.why === 'realm' && sv.calls.length === 0 && g.ls.getItem('eras_proto_v2@s2') === bad, JSON.stringify(st)); }
  { const sv = mkServer(); const g = game({ search: '?debug=1&online=1&fresh=1&skip=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle(); const st = g.st();
    check('7. carga com gravação bloqueada (?fresh=1): online não liga (um save vazio nunca sobe)', st.on === false && st.why === 'nosave' && sv.calls.length === 0, JSON.stringify(st)); }
  { const sv = mkServer({ fail: { 'POST /auth/refresh': [503, 'unavailable'], 'POST /auth/guest': [503, 'unavailable'] } });
    const g2 = game({ server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, { 'eon.net': netMem({ save: { version: 3, dirty: false } }) }) }); await g2.settle(); g2.ev('S.gold=8; save()');
    check('7. sessão sem servidor (boot falhou): a gravação local fica marcada como mudança no aparelho (não perde para a nuvem sem pergunta)', JSON.parse(g2.ls.getItem('eon.net')).save.dirty === true && g2.st().booted === false, g2.ls.getItem('eon.net')); }

  /* ============ 8. SERVIDOR s2 ============ */
  sec('8. Servidor s2');
  { const canary = JSON.stringify(mk({ gold: 424242, name: 'ISCA-S1', realm: 's1' })), loc2 = JSON.stringify(mk({ gold: 22, name: 'NoS2', realm: 's2' }));
    const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 888, name: 'NuvemS2', realm: 's2' })) });
    const g = game({ server: sv, storage: { eon_realm: 's2', eras_proto_v2: canary, 'eras_proto_v2@s2': loc2 } }); await g.settle(); const st = g.st();
    check('8. s2: a sessão é pedida para o realm s2 e guardada em eon.net@s2 (não em eon.net)', sv.last('POST /auth/guest').body.realm === 's2' && !!g.ls.getItem('eon.net@s2') && g.ls.getItem('eon.net') == null, JSON.stringify(sv.last('POST /auth/guest').body));
    check('8. s2, batalha rodando: pendente em eon_cloud_pending@s2 (não na do s1)', st.pending && !!g.ls.getItem('eon_cloud_pending@s2') && g.ls.getItem('eon_cloud_pending@s1') == null, JSON.stringify(st));
    const g2 = game({ search: '?debug=1&online=1', server: sv, storage: g.snap() }); await g2.settle();
    check('8. abertura seguinte no s2: aplica em eras_proto_v2@s2 e recarrega; o save do s1 fica byte a byte igual', JSON.parse(g2.ls.getItem('eras_proto_v2@s2')).gold === 888 && g2.reloaded() && g2.ls.getItem('eras_proto_v2') === canary && g2.ls.getItem('eon_cloud_pending@s2') == null, String(g2.ls.getItem('eras_proto_v2@s2')).slice(0, 80)); }
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 888, realm: 's1' })) }); const loc2 = JSON.stringify(mk({ gold: 22, realm: 's2' }));
    const g = game({ search: '?debug=1&online=1', server: sv, storage: { eon_realm: 's2', 'eras_proto_v2@s2': loc2 } }); await g.settle();
    check('8. no s2, save da nuvem carimbado s1: recusado, chave do s2 segue com o save local', JSON.parse(g.ls.getItem('eras_proto_v2@s2')).gold === 22 && !g.reloaded() && g.st().lastAction === 'refused', JSON.stringify(g.st())); }

  /* ============ 9. RESUMO ============ */
  sec('9. Resumo');
  { const sv = mkServer(); const g = game({ server: sv, storage: { [SK]: JSON.stringify(mk({ gems: 321, eraMax: 1, stage: 14, best: 14, hero: 'kael' })) } }); await g.settle();
    g.ev('try{ const L=Sys.level.ensure(S); L.lvl=7; L.xp=3; L.total=444; }catch(e){}');
    const s = JSON.parse(g.ev('JSON.stringify(OnlineBoot.summary(S))')), fc = g.ev('heroFC()'), view = g.ev("(function(){ try{ return Sys.fc.view?Sys.fc.view(heroFC()):null; }catch(e){ return null; } })()");
    check('9. fc = FC REAL (heroFC() = Sys.fc.compute), e não a de exibição', s.fc === fc && fc > 0 && (view == null || view === fc || s.fc !== view), 'fc ' + s.fc + ' real ' + fc + ' exibição ' + view);
    check('9. level e xp do Sys.level (nível 7, XP acumulada 444)', s.level === 7 && s.xp === 444, s.level + ' ' + s.xp);
    check('9. era = S.eraMax (1), stage = S.stage (14), gems = S.gems (321), maxRarity = maior raridade do inventário (2)', s.era === 1 && s.stage === 14 && s.gems === 321 && s.maxRarity === 2, JSON.stringify(s));
    check('9. hero, avatar (Sys.appearance.avatarKey), realm (Realm.id), name, savedAt (S.lastSeen)', s.hero === 'kael' && s.avatar === g.ev('Sys.appearance.avatarKey(S,Sys.host)') && s.realm === 's1' && s.name === 'Velho' && s.savedAt === g.ev('S.lastSeen'), JSON.stringify(s));
    check('9. playSeconds: save antigo sem o campo → 0; com S.playSeconds ele é lido (inteiro)', s.playSeconds === 0 && g.ev('(S.playSeconds=77.9, OnlineBoot.summary(S).playSeconds)') === 77, String(s.playSeconds));
    const put = sv.last('PUT /save').body.summary;
    check('9. o resumo enviado ao servidor tem os 8 números do contrato (finitos, >= 0) e o save inteiro', ['level', 'xp', 'era', 'stage', 'fc', 'gems', 'playSeconds', 'maxRarity'].every(k => typeof put[k] === 'number' && isFinite(put[k]) && put[k] >= 0) && sv.last('PUT /save').body.save.gold === 1234, JSON.stringify(put));
    const k = JSON.parse(g.ev("JSON.stringify(OnlineBoot.summary({hero:'kaia',stage:3,inv:[]}))")); check('9. Kaia: hero = kaia; save mínimo não quebra', k.hero === 'kaia' && k.stage === 3 && k.maxRarity === 0, JSON.stringify(k)); }

  /* ============ 9b. TEMPO DE JOGO (S.playSeconds) ============ */
  sec('9b. Tempo de jogo');
  { const sv = mkServer(); const g = game({ search: '?debug=1&skip=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();   /* online DESLIGADO: o contador é do save */
    const T = 1e12, tk = t => g.ev('OnlineBoot.playTick(' + (T + t) + ')'), ps = () => g.ev('S.playSeconds'), vis = v => { g.G.document.visibilityState = v; };
    check('9b. save antigo sem o campo: começa em 0 no resumo', g.ev('OnlineBoot.summary(S).playSeconds') === 0 && (ps() === undefined || ps() === 0), String(ps()));
    vis('visible'); g.ev('B.paused=false'); tk(0); let sum = 0; for (let i = 1; i <= 10; i++) sum += tk(i * 1000);
    check('9b. batalha rodando e página visível: +1 por segundo (10 passos de 1 s → 10)', sum === 10 && ps() === 10, sum + ' / ' + ps());
    check('9b. conta com o online DESLIGADO e nenhum pedido ao servidor', g.st().on === false && sv.calls.length === 0, '');
    tk(10400); tk(10800); tk(11200); check('9b. passos mais rápidos que 1 s não somam além do relógio real (1,2 s → +1)', ps() === 11, String(ps()));
    g.ev('B.paused=true'); for (let i = 12; i <= 20; i++) tk(i * 1000); check('9b. batalha em pausa (título, modal): não conta', ps() === 11, String(ps()));
    g.ev('B.paused=false'); tk(21000); check('9b. o intervalo em pausa não entra quando a batalha volta', ps() === 11, String(ps())); tk(22000); check('9b. ...e volta a contar no passo seguinte', ps() === 12, String(ps()));
    vis('hidden'); tk(23000); tk(24000); tk(3600000); check('9b. página escondida (1 h em segundo plano / offline): não conta', ps() === 12, String(ps()));
    vis('visible'); tk(3601000); check('9b. ao voltar, o tempo fora não entra', ps() === 12, String(ps())); tk(3602000); check('9b. ...e segue +1', ps() === 13, String(ps()));
    tk(3602000 + 600000); check('9b. temporizador atrasado 10 min (aba congelada): soma no máximo 5 s', ps() === 18, String(ps()));
    tk(3602000 + 500000); check('9b. relógio para trás: soma 0', ps() === 18, String(ps())); tk(3602000 + 501000);
    check('9b. sempre inteiro; entra no resumo (playSeconds) e no save gravado', Number.isInteger(ps()) && g.ev('OnlineBoot.summary(S).playSeconds') === ps() && (g.ev('save()'), g.stored().playSeconds === ps()), ps() + ' ' + JSON.stringify(g.stored().playSeconds)); }
  { const g = game({ search: '?debug=1&skip=1', storage: { [SK]: JSON.stringify(mk({ playSeconds: 5000 })), eon_owner_mode: '1', eras_owner_v1: JSON.stringify(mk({ gold: 50, playSeconds: 7 })) } }); await g.settle();
    g.G.document.visibilityState = 'visible'; g.ev('B.paused=false; OnlineBoot.playTick(1e12); OnlineBoot.playTick(1e12+1000); OnlineBoot.playTick(1e12+2000); save()');
    check('9b. MODO DONO: conta no save do dono (7 → 9) e o save real fica como estava (5000)', g.stored().playSeconds === 9 && JSON.parse(g.ls.getItem(SK)).playSeconds === 5000, g.stored().playSeconds + ' / ' + JSON.parse(g.ls.getItem(SK)).playSeconds); }

  /* ============ 10. LOGIN GOOGLE ============ */
  sec('10. Login Google');
  const cap = (g, mode) => { g.G.sandbox.__gl = 0; g.G.sandbox.Capacitor = { Plugins: { SocialLogin: { initialize: async () => {}, login: async () => { g.G.sandbox.__gl++; if (mode === 'cancel') throw new Error('user cancelled'); return { result: { idToken: 'tok-1' } }; } } } }; };
  { const sv = mkServer({ cloud: cloudOf(5, mk({ gold: 999999, name: 'ContaGoogle', realm: 's1' }), { level: 30 }), google: 'ok' });
    const g = game({ search: '?debug=1&online=1', noChoice: true, server: sv, storage: Object.assign({ [SK]: JSON.stringify(mk()) }, { 'eon.net': netMem({ save: { version: 5, dirty: false } }) }) }); await g.settle();
    check('10. antes do login: convidado sincronizado (nuvem igual → none)', g.st().lastAction === 'none', JSON.stringify(g.st()));
    sv.cloud = cloudOf(9, mk({ gold: 999999, name: 'ContaGoogle', realm: 's1' }), { level: 30 }); cap(g); const n0 = sv.calls.length;
    const r = await g.promise('OnlineBoot.google()')(120), ks = sv.keys().slice(n0);
    check('10. (a) conta já vinculada: login → reboot (sessão nova, cabeça, save)', r && r.v && r.v.ok === true && r.v.action === 'login' && ks[0] === 'POST /auth/login/google' && ks.includes('GET /save/head') && sv.last('POST /auth/login/google').body.idToken === 'tok-1' && r.v.player && r.v.player.id === 'g1', JSON.stringify(r) + ' ' + ks.join(','));
    check('10. (a) o save da conta entra (título: aplica e recarrega); o resultado diz save = applied', r.v.save === 'applied' && g.stored().name === 'ContaGoogle' && g.reloaded(), JSON.stringify(r.v)); }
  { const sv = mkServer({ google: 'ok' }); const g = game({ search: '?debug=1&online=1&skip=1', noChoice: true, server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle();
    sv.cloud = cloudOf(9, mk({ gold: 999999, name: 'ContaGoogle', realm: 's1' }), { level: 30 }); cap(g);
    const r = await g.promise('OnlineBoot.google()')(120);
    check('10. (a) login com a batalha rodando: o save da conta fica PENDENTE (não troca no meio); resultado {ok, action: login, save: pending, pending: true}', r && r.v && r.v.ok && r.v.save === 'pending' && r.v.pending === true && g.ev('S.gold') === 1234 && !g.reloaded(), JSON.stringify(r)); }
  { const sv = mkServer({ google: 'not_linked', link: 'ok' }); const loc = JSON.stringify(mk()); const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: { [SK]: loc } }); await g.settle(); cap(g); const n0 = sv.calls.length;
    const r = await g.promise('OnlineBoot.google()')(120), ks = sv.keys().slice(n0);
    check('10. (b) 404 not_linked → vincula ao convidado atual (POST /auth/link/google com a sessão)', r && r.v && r.v.ok === true && r.v.action === 'linked' && ks.join(',') === 'POST /auth/login/google,POST /auth/link/google' && /^Bearer /.test(sv.last('POST /auth/link/google').headers.authorization || ''), JSON.stringify(r) + ' ' + ks.join(','));
    check('10. (b) o save do aparelho continua (nada baixado, nada recarregado)', g.ev('S.gold') === 1234 && !g.reloaded() && g.st().pending === false, ''); }
  { const sv = mkServer({ google: 'not_linked', link: 'taken' }); const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle(); cap(g);
    const r = await g.promise('OnlineBoot.google()')(120);
    check('10. (c) 409 link_taken → {ok:false, reason: link_taken, other: details.otherPlayer}', r && r.v && r.v.ok === false && r.v.reason === 'link_taken' && r.v.other && r.v.other.level === 12 && r.v.other.era === 1, JSON.stringify(r));
    check('10. (c) nada mudou no aparelho', g.ev('S.gold') === 1234 && !g.reloaded(), ''); }
  { const sv = mkServer(); const g = game({ search: '?debug=1&online=1&skip=1', server: sv, storage: { [SK]: JSON.stringify(mk()) } }); await g.settle(); cap(g, 'cancel'); const n0 = sv.calls.length;
    const r = await g.promise('OnlineBoot.google()')(60);
    check('10. cancelado pelo jogador → {ok:false, reason: cancelled}, nenhum pedido ao servidor', r && r.v && r.v.ok === false && r.v.reason === 'cancelled' && sv.calls.length === n0, JSON.stringify(r));
    g.G.sandbox.Capacitor = undefined; const r2 = await g.promise('OnlineBoot.google()')(60);
    check('10. sem o plugin (navegador) → {ok:false, reason: google_unavailable}', r2 && r2.v && r2.v.ok === false && r2.v.reason === 'google_unavailable', JSON.stringify(r2));
    cap(g); sv.fail['POST /auth/login/google'] = [500, 'internal']; const r3 = await g.promise('OnlineBoot.google()')(60);
    check('10. erro do servidor no login → {ok:false, reason} sem lançar', r3 && r3.v && r3.v.ok === false && r3.v.reason === 'internal', JSON.stringify(r3)); }

  console.log(fail ? '\n' + fail + ' de ' + total + ' VERIFICAÇÃO(ÕES) REPROVADA(S)' : '\nONLINE NA ABERTURA: ' + total + ' verificações OK');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
