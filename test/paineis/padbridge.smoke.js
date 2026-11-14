/* js/padbridge.js: ponte dos pacotes de arte da Play (versão de loja). Sem navegador e sem aparelho: Capacitor, plugin EonPacks e documento de mentira;
   o Sys.assets é o DE VERDADE (js/sys/assets.js), para provar que a ponte só usa a API que ele já expõe.
   node test/paineis/padbridge.smoke.js [caminho de outro padbridge.js] */
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '../..');
const SRC = fs.readFileSync(process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT, 'js/padbridge.js'), 'utf8');
const SYS = fs.readFileSync(path.join(ROOT, 'js/sys/assets.js'), 'utf8');
const LATE = 'assets/mentors/m3.png', BASE = 'assets/icons/menu/x.png';

/* plugin de mentira com o formato do CONTRATO_PACOTES.md §3 */
function fakePlugin(A, opt) { const o = Object.assign({ active: true, got: [], state: {}, unknown: [] }, opt || {}), P = { calls: [], lis: null, o };
  const base = () => A.DATA.basePacks(), apack = id => A.apackOf(id);
  const group = (k, ids) => ({ pack: k, state: o.state[k] || 'pending', delivery: 'fast-follow', ids, bytesDownloaded: 0, totalBytes: 100, percent: 0, error: o.state[k] === 'failed' ? 'play:-6' : null });
  const result = req => { const groups = {}, unknown = []; for (const id of (req && req.packs) || []) { if (o.unknown.includes(id)) { unknown.push(id); continue; } const k = apack(id); if (k === 'base') continue; (groups[k] = groups[k] || group(k, [])).ids.push(id); }
    const failed = Object.keys(groups).filter(k => groups[k].state !== 'installed'); return { ok: !failed.length && !unknown.length, mode: 'pacotes', groups, failed, unknown, absent: [] }; };
  P.info = () => { P.calls.push(['info']); return Promise.resolve({ mode: o.active ? 'pacotes' : 'universal', active: o.active, installedIds: base().concat(o.got), packs: {} }); };
  P.fetch = req => { P.calls.push(['fetch', req.packs.slice()]); return o.reject ? Promise.reject(new Error('x')) : Promise.resolve(result(req)); };
  P.ensure = req => { P.calls.push(['ensure', req]); return Promise.resolve(result(req)); };
  P.confirm = () => { P.calls.push(['confirm']); return Promise.resolve({ accepted: true }); };
  P.addListener = (n, fn) => { P.lis = fn; return Promise.resolve({ remove() {} }); };
  P.fetched = () => P.calls.filter(c => c[0] === 'fetch').map(c => c[1]);
  return P; }
/* um "app" novo por caso: Sys.assets de verdade + a ponte */
function world(mk) { const win = { addEventListener() {} }, timers = [], seen = { tick: 0, retry: [], drop: 0 };
  win.LatePack = { tick: () => { seen.tick++; } }; win.Preload = { retry: l => { seen.retry.push(l); return Promise.resolve({ ok: true, failed: [] }); } };
  const ctx = { window: win, document: { hidden: false, addEventListener() {} }, setInterval: fn => { timers.push(fn); return timers.length; }, console, Promise, Date, Set, Object, Array, String, Math, Error,
    artDropFailed: () => { seen.drop++; } };
  vm.createContext(ctx); vm.runInContext(SYS, ctx); const A = win.Sys.assets;
  A.setManifest({ packs: { 'ui:late': { bytes: 1, files: [LATE] }, 'era:4': { bytes: 1, files: ['assets/bg/era4.png'] } } });
  const plug = mk ? mk(A, win, ctx) : null; vm.runInContext(SRC, ctx);
  return { win, A, plug, timers, seen, PB: win.PadBridge, ctx }; }
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);   /* os objetos vêm de outro contexto (vm): compara pelo conteúdo */
let n = 0; const t = async (name, fn) => { await fn(); n++; console.log('ok - ' + name); };

(async () => {
  await t('navegador (sem Capacitor): não faz nada', async () => { const w = world(); assert.strictEqual(await w.PB.boot(), false);
    assert.strictEqual(w.A.DATA.on, false); assert.strictEqual(w.timers.length, 0); assert.strictEqual(w.A.isReady(LATE), true, 'tudo dentro do app, como hoje');
    same(await w.PB.ensure({ packs: ['ui:late'] }), { ok: true, off: true }); assert.strictEqual(await w.PB.pump(true), false); });
  await t('APK completo de teste (Capacitor sem o plugin EonPacks): não faz nada', async () => { const w = world((A, win) => { win.Capacitor = { Plugins: { App: {}, Haptics: {} } }; return null; });
    assert.strictEqual(await w.PB.boot(), false); assert.strictEqual(w.A.DATA.on, false); assert.strictEqual(w.timers.length, 0); assert.strictEqual(w.A.isReady(LATE), true); });
  await t('plugin presente mas modo universal (active:false): não liga o Sys.assets nem pede nada', async () => { const w = world((A, win) => { const p = fakePlugin(A, { active: false }); win.Capacitor = { Plugins: { EonPacks: p } }; return p; });
    assert.strictEqual(await w.PB.boot(), false); assert.strictEqual(w.A.DATA.on, false); assert.strictEqual(w.plug.fetched().length, 0); assert.strictEqual(w.timers.length, 0); });

  const loja = opt => world((A, win, ctx) => { const p = fakePlugin(A, opt); win.Capacitor = { Plugins: { EonPacks: p } }; if (opt && opt.S) { ctx.S = opt.S; win.Sys.host = opt.host; } return p; });
  await t('loja, 1ª abertura: liga o Sys.assets, só a base está pronta e o fast-follow é pedido sem esperar', async () => { const w = loja(); assert.strictEqual(await w.PB.boot(), true);
    assert.strictEqual(w.A.DATA.on, true); assert.strictEqual(w.A.isReady(BASE), true); assert.strictEqual(w.A.isReady(LATE), false, "'ui:late' ainda não chegou");
    same(w.plug.fetched(), [w.A.DATA.fastFollow().slice().sort()], 'um pedido só, com os ids do fast-follow');
    assert.ok(w.plug.fetched()[0].includes('ui:late')); assert.strictEqual(w.timers.length, 1, 'conferência periódica armada');
    assert.strictEqual(w.PB.state.groups.inicio.state, 'pending'); assert.strictEqual(w.seen.tick, 0); });
  await t('enquanto baixa: não pede de novo; o progresso chega às telas', async () => { const w = loja(); await w.PB.boot(); const ev = []; w.PB.on(e => ev.push(e));
    assert.strictEqual(await w.PB.pump(false), false); w.timers[0](); await flush(); assert.strictEqual(w.plug.fetched().length, 1);
    w.plug.lis({ pack: 'inicio', ids: ['fx:bonfire', 'ui:frames', 'ui:late'], state: 'downloading', bytesDownloaded: 40, totalBytes: 100, percent: 40, error: null });
    assert.strictEqual(ev.length, 1); assert.strictEqual(ev[0].type, 'progress'); assert.strictEqual(ev[0].group.percent, 40); assert.strictEqual(w.A.isReady(LATE), false); });
  await t("o pacote 'inicio' chega: Sys.assets fica sabendo, LatePack.tick, Preload.retry só dos arquivos dele e a cena se refaz", async () => { const w = loja(); await w.PB.boot(); const ev = []; w.PB.on(e => ev.push(e.type));
    w.plug.o.got = ['fx:bonfire', 'ui:frames', 'ui:late']; w.plug.o.state.inicio = 'installed';
    w.plug.lis({ pack: 'inicio', ids: ['fx:bonfire', 'ui:frames', 'ui:late'], state: 'installed', bytesDownloaded: 100, totalBytes: 100, percent: 100, error: null }); await flush();
    assert.strictEqual(w.A.isReady(LATE), true); assert.strictEqual(w.A.url(LATE), LATE, 'o endereço não muda (o app intercepta)'); assert.strictEqual(w.seen.tick, 1);
    same(w.seen.retry, [[LATE]]); assert.strictEqual(w.seen.drop, 1); same(ev, ['progress', 'installed']);
    assert.ok(!w.PB.wanted().includes('ui:late')); });
  await t('abertura seguinte com o fast-follow já no aparelho: pronto na hora, nada a pedir', async () => { const w = loja({ got: ['fx:bonfire', 'ui:frames', 'ui:late', 'aura', 'era:2', 'era:3', 'enemy:2', 'enemy:3', 'gun:3'] });
    assert.strictEqual(await w.PB.boot(), true); assert.strictEqual(w.A.isReady(LATE), true); assert.strictEqual(w.plug.fetched().length, 0); assert.strictEqual(w.seen.tick, 0, 'nada chegou DEPOIS da abertura'); });
  await t('o que o jogador precisa agora (era 4) entra no pedido; id que o app não conhece não é pedido de novo', async () => {
    const w = loja({ S: { hero: 'kael', inv: [] }, host: { eraMax: () => 4 }, unknown: ['hero:kael:1'] }); await w.PB.boot(); const f = w.plug.fetched()[0];
    for (const id of ['era:4', 'enemy:4', 'gun:4', 'era:5', 'enemy:5', 'ui:late']) assert.ok(f.includes(id), id); assert.ok(!f.includes('core') && !f.includes('hero:kael:0'), 'a base nunca é pedida');
    assert.ok(f.includes('hero:kael:1')); assert.ok(!w.PB.wanted().includes('hero:kael:1')); });
  await t('pacote parado (sem rede): espera crescente, não martela; "tentar de novo" (force) pede na hora', async () => { const w = loja({ state: { inicio: 'failed' } }); const ev = []; await w.PB.boot(); w.PB.on(e => ev.push(e));
    assert.strictEqual(w.PB.state.groups.inicio.state, 'failed'); assert.strictEqual(w.PB.state.stopped.error, 'play:-6'); assert.strictEqual(w.plug.fetched().length, 1);
    w.timers[0](); await flush(); assert.strictEqual(w.plug.fetched().length, 1, 'dentro da espera, só o que não está parado nem baixando');
    assert.strictEqual(await w.PB.pump(true), true); const last = w.plug.fetched().pop(); same(last, ['fx:bonfire', 'ui:frames', 'ui:late']); assert.strictEqual(ev[0].type, 'stopped');
    assert.strictEqual(w.A.isReady(LATE), false); });
  await t('a chamada ao plugin falha: a ponte não quebra e espera antes de tentar de novo', async () => { const w = loja({ reject: true }); assert.strictEqual(await w.PB.boot(), true);
    assert.strictEqual(w.PB.state.busy, false); assert.ok(w.PB.state.next > Date.now()); assert.strictEqual(await w.PB.pump(false), false); assert.strictEqual(w.plug.fetched().length, 1); });
  await t('para as telas: ensure espera o pacote e atualiza o Sys.assets; confirm abre o diálogo e tenta de novo', async () => { const w = loja(); await w.PB.boot();
    w.plug.o.got = ['era:4']; w.plug.o.state.era_4 = 'installed'; const r = await w.PB.ensure({ packs: ['era:4'] });
    assert.strictEqual(r.ok, true); assert.strictEqual(w.A.isReady('assets/bg/era4.png'), true); same(w.seen.retry, [['assets/bg/era4.png']]);
    const c = await w.PB.confirm(); assert.strictEqual(c.accepted, true); assert.ok(w.plug.calls.some(x => x[0] === 'confirm')); });
  console.log(n + ' testes ok');
})().catch(e => { console.error(e); process.exit(1); });
