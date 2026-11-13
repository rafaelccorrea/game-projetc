'use strict';
/* E2E SEM NAVEGADOR (fps-ff, para rodar depois de cada commit do engenheiro): carrega o jogo inteiro num vm com DOM falso, na MESMA ordem do
   index.html (scripts embutidos, js/sys da lista do index + os demais js/sys, test/bg/scene.js, js/<lista do index>, e logo depois de screens.js
   a lista de painéis do js/screens.js), e então: liga e desenha cada painel registrado, toca em todo [data-x], chama tick(); confere a tabela de
   liberação por nível (FB_UNLOCK x Sys.level) e o FC na tela (Sys.fc / Sys.stats.abbr). Uso: node test/e2e/run.js [-v]
   As listas são lidas dos arquivos a cada execução: o teste acompanha o que o engenheiro ligar. Sai com código 1 se algo falhar. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), VERBOSE = process.argv.includes('-v');
const W = 390, H = 704, TIMEOUT = 8000, MAX_CLICKS = 120;
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const results = [];   // {group, name, ok, err}
const add = (group, name, ok, err) => { results.push({ group, name, ok, err }); if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + group + ' · ' + name + (err ? ' → ' + err : '')); };
const warns = [];

/* ---------------- DOM falso (mesma ideia do test/paineis/smoke_all.js) ---------------- */
function mkStub() { const f = function () {}; const p = new Proxy(f, {
  get(t, k) { if (k === Symbol.toPrimitive) return () => 0; if (k === Symbol.iterator) return function* () {}; if (k === 'then') return undefined;
    if (k === 'length') return 0; if (['innerHTML', 'textContent', 'className', 'src', 'id', 'value', 'innerText'].includes(k)) return t['_' + String(k)] || '';
    if (k === 'style') return t._style || (t._style = styleObj()); if (k === 'dataset') return t._dataset || (t._dataset = {}); if (k === 'classList') return { add() {}, remove() {}, toggle() {}, contains() { return false; } };
    if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 58, height: 58, right: 58, bottom: 58 });
    if (k === 'clientWidth' || k === 'offsetWidth' || k === 'width') return W; if (k === 'clientHeight' || k === 'offsetHeight' || k === 'height') return 844;
    if (k === 'getElementById' || k === 'closest') return () => null; if (k === 'querySelector') return () => mkStub(); if (k === 'querySelectorAll' || k === 'getElementsByTagName' || k === 'getElementsByClassName') return () => [];
    if (k === 'children' || k === 'childNodes') return []; if (k === 'parentNode' || k === 'parentElement') return null; if (k === 'matches') return () => false;
    if (k === 'getAttribute') return () => null; if (k === 'contains') return () => false;
    return p; },
  set(t, k, v) { t['_' + String(k)] = v; return true; }, apply() { return p; }, construct() { return p; }, has() { return true; } }); return p; }
function styleObj() { return { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; }, getPropertyValue(k) { return this[k] || ''; }, cssText: '' }; }
const cls = () => ({ add() {}, remove() {}, toggle() {}, contains() { return false; } });
const V = { clientWidth: W, clientHeight: H, offsetWidth: W, offsetHeight: H, innerHTML: '', scrollTop: 0, scrollLeft: 0, style: styleObj(), dataset: {}, classList: cls(),
  addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, contains() { return true; }, appendChild(c) { return c; },
  removeChild() {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { left: 0, top: 0, width: W, height: H, right: W, bottom: H }; }, scrollTo() {} };
const els = {}, store = {}, Q = [];
const document = { readyState: 'complete', hidden: false, title: '', body: mkStub(), head: mkStub(), documentElement: mkStub(), fonts: mkStub(),
  getElementById(id) { if (id === 'view') return V; if (/^(xg_|xs_|xh_|xp_|xr_|g_|res_|fb)/.test(id)) return null; return els[id] || (els[id] = mkStub()); },
  createElement() { return mkStub(); }, createTextNode() { return mkStub(); }, querySelector() { return null; }, querySelectorAll() { return []; },
  addEventListener() {}, removeEventListener() {}, write() {} };
const consoleErrs = [];   /* erros que o próprio jogo pega e manda para console.error (não derrubam, mas aparecem como aviso) */
const sandbox = { console: { log() {}, info() {}, warn() {}, debug() {}, error(...a) { consoleErrs.push(a.map(x => (x && x.message) ? errStr(x) : String(x)).join(' ').slice(0, 240)); } }, document, V_TEST: V,
  setTimeout(fn) { Q.push(fn); return Q.length; }, clearTimeout() {}, setInterval() { return 0; }, clearInterval() {}, requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
  localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear() {} },
  navigator: { userAgent: 'node', vibrate() {}, language: 'pt-BR' }, location: { search: '?debug=1&fresh=1&skip=1', href: 'http://x/?debug=1&fresh=1&skip=1', pathname: '/', hash: '', replace() {}, reload() {} },
  performance: { now: () => Date.now() }, fetch: () => ({ then() { return this; }, catch() { return this; } }), Image: function () { return mkStub(); }, Audio: function () { return mkStub(); },
  matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
  URL, URLSearchParams, Event: function () {}, CustomEvent: function () {}, devicePixelRatio: 1, innerWidth: W, innerHeight: 844, screen: { width: W, height: 844 },
  getComputedStyle: () => mkStub(), alert() {}, confirm() { return true; }, prompt() { return null; }, Intl, Proxy, Reflect, Float32Array, Uint8Array, TextEncoder, TextDecoder };
sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox; sandbox.top = sandbox; sandbox.parent = sandbox;
vm.createContext(sandbox);
const flush = () => { let n = 0; while (Q.length && n < 300) { const f = Q.shift(); n++; if (typeof f === 'function') f(); } };
/* roda fn dentro do contexto com limite de tempo (pega laço infinito) */
const inCtx = fn => { sandbox.__e2eFn = fn; try { return vm.runInContext('__e2eFn()', sandbox, { timeout: TIMEOUT }); } finally { sandbox.__e2eFn = null; } };
const ev = code => vm.runInContext(code, sandbox, { timeout: TIMEOUT });
/* erro curto + primeiro arquivo:linha do jogo na pilha */
const errStr = e => { const msg = String(e && e.message || e); const st = String(e && e.stack || ''); const m = st.split('\n').map(l => l.match(/\(?((?:js|index|sys|test)[^\s():]*\.(?:js|html)[^\s():]*):(\d+):\d+\)?/)).find(Boolean);
  return msg.slice(0, 220) + (m ? ' [' + m[1] + ':' + m[2] + ']' : ''); };
const load = (file, code) => { try { vm.runInContext(code != null ? code : rd(file), sandbox, { filename: file, timeout: TIMEOUT }); add('carga', file, true); return true; } catch (e) { add('carga', file, false, errStr(e)); return false; } };

/* ---------------- carga, na ordem do index.html ---------------- */
const html = rd('index.html');
const inline = []; html.replace(/<script>([\s\S]*?)<\/script>/g, (m, c) => { inline.push(c); return m; });
const main = inline.reduce((a, b) => (b.length > a.length ? b : a), '');
load('index.html#principal', main);
/* lista de js/sys: avalia a própria expressão do index ([...].concat(NEXT_ON?[...]:[],['fc'])) com o NEXT_ON verdadeiro do jogo */
let sysList = [];
{ const m = html.match(/(\[[^\]]*'loot'[\s\S]*?)\.forEach\(n=>document\.write\('<script src="js\/sys\//);
  try { sysList = ev(m[1]); } catch (e) { add('listas', 'lista js/sys do index.html', false, m ? errStr(e) : 'não achei a lista'); } }
const sysAll = fs.readdirSync(path.join(ROOT, 'js/sys')).filter(f => /\.js$/.test(f)).map(f => f.replace(/\.js$/, ''));
const sysExtra = sysAll.filter(n => !sysList.includes(n));
const sysOrder = sysList.filter(n => n !== 'fc').concat(sysExtra, sysList.includes('fc') ? ['fc'] : []);   /* 'fc' por último, como no index */
const jsList = ((html.match(/\[([^\]]*'battle'[^\]]*)\]\.forEach\(n=>document\.write\('<script src="js\//) || [])[1] || '').split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean);
const scr = rd('js/screens.js');
const panList = ((scr.match(/for\s*\(\s*const\s+n\s+of\s+\[([^\]]*'panels'[^\]]*)\]/) || [])[1] || '').split(',').map(x => x.trim().replace(/'/g, '')).filter(Boolean);
if (!jsList.length) add('listas', 'lista js/ do index.html', false, 'não achei'); if (!panList.length) add('listas', 'lista de painéis do js/screens.js', false, 'não achei');
console.log('js/sys (index): ' + sysList.join(' ') + (sysExtra.length ? '\njs/sys (extras): ' + sysExtra.join(' ') : '') + '\njs (index): ' + jsList.join(' ') + '\npainéis (screens.js): ' + panList.join(' '));
const pUnlisted = fs.readdirSync(path.join(ROOT, 'js')).filter(f => /^p_.*\.js$/.test(f)).map(f => f.replace(/\.js$/, '')).filter(n => !panList.includes(n));
for (const n of sysOrder) load('js/sys/' + n + '.js');
if (fs.existsSync(path.join(ROOT, 'test/bg/scene.js'))) load('test/bg/scene.js');
for (const n of jsList) { if (!fs.existsSync(path.join(ROOT, 'js', n + '.js'))) { add('carga', 'js/' + n + '.js', false, 'arquivo não existe'); continue; }
  load('js/' + n + '.js'); if (n === 'screens') for (const p of panList) { if (fs.existsSync(path.join(ROOT, 'js', p + '.js'))) load('js/' + p + '.js'); else add('carga', 'js/' + p + '.js', false, 'listado no screens.js mas não existe'); } }
try { inCtx(() => ev("if(typeof sysBoot==='function') sysBoot();")); flush(); add('carga', 'sysBoot()', true); } catch (e) { add('carga', 'sysBoot()', false, errStr(e)); }

/* ---------------- estado: fábrica real do jogo (newState do index.html) ---------------- */
const hasState = (() => { try { return ev("typeof S==='object'&&S!==null&&typeof newState==='function'"); } catch (e) { return false; } })();
if (!hasState) add('estado', 'S / newState do index.html', false, 'não existem depois da carga');
/* troca o conteúdo de S sem trocar o objeto (módulos guardam a referência) */
sandbox.__e2eReplace = o => { const S = ev('S'); for (const k of Object.keys(S)) delete S[k]; Object.assign(S, o); };
/* "novo" = o S exatamente como o jogo deixa depois de carregar com ?debug=1&fresh=1 (newState + correções do index + sysBoot) */
sandbox.__e2eBase = hasState ? ev('JSON.stringify(S)') : '{}';
const freshState = () => ev('__e2eReplace(JSON.parse(__e2eBase)); 1');
const advancedState = () => ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.gold=5e6; S.gems=9000; S.best=Math.max(S.best||1,120); S.stage=Math.max(S.stage||1,120); S.eraMax=Math.max(S.eraMax||0,3); S.kills=5000;
  try{ const o=Sys.level.ensure(S); o.lvl=60; }catch(e){}
  try{ const sl=SLOTS7.filter(s=>s!=='wing'); for(let i=0;i<14;i++) addItemToBag({slot:sl[i%sl.length],r:i%5,e:Math.min(S.eraMax,i%2)}); }catch(e){}
  try{ statsChanged(); }catch(e){} return 1; })()`);

/* ---------------- 2. painéis ---------------- */
const BAD = ['undefined', 'NaN', '[QTD]', 'PROPOSTA', '[object Object]'];
const textOf = h => h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
function checkHtml(h) { if (typeof h !== 'string' || !h.trim()) return 'HTML vazio'; const t = textOf(h);
  for (const b of BAD) { const i = t.indexOf(b); if (i >= 0) return 'contém "' + b + '": …' + t.slice(Math.max(0, i - 70), i + b.length + 30).replace(/\s+/g, ' ') + '…'; } return null; }
const camel = s => s.replace(/-([a-z])/g, (m, c) => c.toUpperCase());
function buttons(h) { const out = []; const re = /<([a-zA-Z0-9]+)\b([^>]*\bdata-x\s*=[^>]*)>/g; let m;
  while ((m = re.exec(h))) { const attrs = {}, ds = {}; m[2].replace(/([\w:-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g, (a, k, v, d1, d2, d3) => { const val = d1 != null ? d1 : d2 != null ? d2 : d3; attrs[k] = val; if (/^data-/.test(k)) ds[camel(k.slice(5))] = val; return a; });
    if (ds.x != null) out.push({ tag: m[1].toUpperCase(), attrs, ds }); } return out; }
function fakeEl(b) { const el = { tagName: b.tag, nodeName: b.tag, dataset: Object.assign({}, b.ds), value: b.attrs.value || '', checked: 'checked' in b.attrs, disabled: 'disabled' in b.attrs,
  id: b.attrs.id || '', className: b.attrs.class || '', classList: cls(), style: styleObj(), textContent: '', innerHTML: '', parentNode: null, parentElement: null,
  getAttribute: k => (k in b.attrs ? b.attrs[k] : null), setAttribute() {}, hasAttribute: k => k in b.attrs, matches: () => false, contains: () => false, querySelector: () => null, querySelectorAll: () => [],
  getBoundingClientRect: () => ({ left: 100, top: 300, width: 80, height: 40, right: 180, bottom: 340 }), focus() {}, blur() {}, addEventListener() {} };
  el.closest = () => el; return el; }
const sig = b => JSON.stringify(b.ds);

function testPanel(name, def, pass) { const G = 'painel ' + name + ' [' + pass + ']'; const errs = [];
  const step = (label, fn) => { try { inCtx(fn); flush(); return true; } catch (e) { errs.push(label + ': ' + errStr(e)); return false; } };
  if (!step('enable', () => { if (!sandbox.Panels.enable(name)) throw new Error('Panels.enable devolveu false'); })) return add(G, 'ligar', false, errs[0]);
  if (def.overlay) {   /* overlay (era, guidehud, intro): abre e fecha pela função própria */
    const o = Object.assign(function () {}, { from: 0, to: 1, boss: false, gems: 0, essence: 0, parent: mkStub(), onDone() {} });   /* serve de opções e de callback (intro: open(done)) */
    if (typeof def.open === 'function') step('open()', () => def.open(o));
    if (typeof def.close === 'function') step('close()', () => def.close());
    return add(G, 'overlay abrir/fechar', !errs.length, errs.join(' | ')); }
  const enter = () => { ev("if(typeof B!=='undefined'&&B) B.res=null;"); try { inCtx(() => sandbox.Panels.open(name, {})); flush(); } catch (e) { errs.push('Panels.open: ' + errStr(e)); } sandbox.__e2eRedir = ev('view'); ev('view=' + JSON.stringify(name)); };
  enter();
  /* tela que só redireciona (eggpick → pets): render vazio é de propósito */
  const redir = sandbox.__e2eRedir; V.innerHTML = ''; try { inCtx(() => def.render()); } catch (e) {}
  if (redir && redir !== name && !V.innerHTML.trim()) { ev("view='battle'"); return add(G, 'só redireciona para "' + redir + '" (render vazio de propósito)', !errs.length, errs.join(' | ')); }
  const draw = label => { V.innerHTML = ''; if (!step(label + ' render()', () => def.render())) return null; const h = V.innerHTML; const bad = checkHtml(h); if (bad) { errs.push(label + ': ' + bad); return null; } return h; };
  const h0 = draw('inicial'); if (h0 == null) return add(G, 'render', false, errs.join(' | '));
  if (typeof def.tick === 'function') step('tick()', () => def.tick());
  /* toca em todo [data-x]; depois de cada toque volta à tela e redesenha; botões novos (diálogos, abas) entram na fila */
  const seen = new Set(), queue = buttons(h0).filter(b => { const s = sig(b); if (seen.has(s)) return false; seen.add(s); return true; }); let n = 0;
  while (queue.length && n < MAX_CLICKS) { const b = queue.shift(); n++; const lbl = 'click ' + sig(b);
    if (typeof def.click === 'function') step(lbl, () => { const el = fakeEl(b); def.click(el, { target: el, currentTarget: el, type: 'click', preventDefault() {}, stopPropagation() {} }); });
    if (ev('view') !== name) enter();
    const h = draw('depois de ' + lbl); if (h != null) for (const nb of buttons(h)) { const s = sig(nb); if (!seen.has(s)) { seen.add(s); queue.push(nb); } } }
  if (typeof def.tick === 'function') step('tick() final', () => def.tick());
  try { if (typeof def.onClose === 'function') inCtx(() => def.onClose()); } catch (e) { errs.push('onClose: ' + errStr(e)); }
  ev("view='battle'");
  add(G, 'render + ' + n + ' toques' + (typeof def.tick === 'function' ? ' + tick' : ''), !errs.length, errs.slice(0, 6).join(' | ') + (errs.length > 6 ? ' | (+' + (errs.length - 6) + ' erros)' : '')); }

const panelNames = (() => { try { return Object.keys(sandbox.Panels.defs); } catch (e) { add('painéis', 'Panels.defs', false, 'Panels não carregou'); return []; } })();
for (const [pass, prep] of [['novo', freshState], ['avançado', advancedState]]) { const done = new Set();
  for (const nm of panelNames.filter(n => n !== 'cfg').concat(panelNames.includes('cfg') ? ['cfg'] : [])) { const def = sandbox.Panels.defs[nm]; if (done.has(def)) continue; done.add(def);   /* cfg por último (tem "apagar tudo"); apelidos (missions34) não repetem */
    try { prep(); } catch (e) { add('estado', pass, false, errStr(e)); break; } testPanel(nm, def, pass); } }

/* ---------------- 3. liberação por nível ---------------- */
{ const G = 'liberação por nível';
  const src = rd('js/fullbattle.js'), m = src.match(/const\s+FB_UNLOCK\s*=\s*(\{[^}]*\})/); let FB = null;
  try { FB = vm.runInNewContext('(' + m[1] + ')'); } catch (e) { add(G, 'ler FB_UNLOCK de js/fullbattle.js', false, m ? errStr(e) : 'não achei'); }
  const L = sandbox.Sys && sandbox.Sys.level;
  if (!L || typeof L.unlockLevel !== 'function') add(G, 'Sys.level.unlockLevel', false, 'não existe');
  else if (FB) { const diff = Object.keys(FB).filter(k => L.unlockLevel(k) !== FB[k]).map(k => k + ': FB_UNLOCK ' + FB[k] + ' x Sys.level ' + L.unlockLevel(k) + (L.DATA.unlock[L.unlockKey ? L.unlockKey(k) : k] == null ? ' (id desconhecida)' : ''));
    add(G, 'FB_UNLOCK (' + Object.keys(FB).length + ' ids) = Sys.level.unlockLevel', !diff.length, diff.join('; ')); }
  const PO = { map: 1, codex: 12, chat: 16, mail: 7, profile: 10, events: 24, arena: 28, guild: 32, mount: 38, tourney: 40, auction: 45 };
  if (L && L.DATA && L.DATA.unlock) { const diff = Object.keys(PO).filter(k => L.DATA.unlock[k] !== PO[k]).map(k => k + ': esperado ' + PO[k] + ', está ' + L.DATA.unlock[k]);
    add(G, 'Sys.level.DATA.unlock = níveis aprovados pelo PO', !diff.length, diff.join('; ')); } }

/* ---------------- 4. FC na tela ---------------- */
{ const G = 'FC na tela'; const T = (name, fn) => { try { const r = inCtx(fn); add(G, name + (r !== true && r !== undefined ? ' → ' + r : ''), true); } catch (e) { add(G, name, false, errStr(e)); } };
  const ok = (c, msg) => { if (!c) throw new Error(msg); };
  try { freshState(); } catch (e) {}
  const Sys = sandbox.Sys || {};
  T('Sys.fc.compute(estado novo) finito > 0', () => { const v = Sys.fc.compute(ev('S'), Sys.host); ok(Number.isFinite(v) && v > 0, 'devolveu ' + v); return Math.round(v); });
  T('Sys.fc.snapshot/delta existem', () => { ok(typeof Sys.fc.snapshot === 'function' && typeof Sys.fc.delta === 'function', 'faltam'); const s = Sys.fc.snapshot(ev('S'), Sys.host); ok(s && Number.isFinite(s.fc), 'snapshot sem fc'); return true; });
  T("Sys.fc.delta(1000,1200).text começa com '+'", () => { const d = Sys.fc.delta(1000, 1200); ok(d && typeof d.text === 'string' && d.text[0] === '+', 'text = ' + JSON.stringify(d && d.text)); return JSON.stringify(d.text); });
  T('Sys.stats.abbr(2.157e15) curto', () => { const s = Sys.stats.abbr(2.157e15); ok(typeof s === 'string' && s.length > 0 && s.length <= 8 && !/undefined|NaN/.test(s), 'devolveu ' + JSON.stringify(s)); return JSON.stringify(s); }); }

/* ---------------- resumo ---------------- */
const fails = results.filter(r => !r.ok);
console.log('\n================ RESUMO ================');
const byGroup = {}; for (const r of results) (byGroup[r.group] = byGroup[r.group] || []).push(r);
for (const g of Object.keys(byGroup)) { const rs = byGroup[g], f = rs.filter(r => !r.ok);
  if (g === 'carga') { console.log((f.length ? 'FALHA ' : 'OK    ') + 'carga: ' + (rs.length - f.length) + '/' + rs.length + ' arquivos'); for (const r of f) console.log('        ' + r.name + ' → ' + r.err); continue; }
  for (const r of rs) console.log((r.ok ? 'OK    ' : 'FALHA ') + g + ' · ' + r.name + (r.ok ? '' : '\n        → ' + r.err)); }
if (pUnlisted.length) console.log('aviso: js/' + pUnlisted.join('.js, js/') + '.js existem mas não estão na lista do js/screens.js (o jogo não carrega; não testados)');
for (const w of warns) console.log('aviso: ' + w);
if (consoleErrs.length) { const u = [...new Set(consoleErrs)]; console.log('aviso: console.error do jogo (' + consoleErrs.length + 'x, ' + u.length + ' distintos):'); for (const x of u.slice(0, 15)) console.log('        ' + x); }
console.log('\n' + (fails.length ? fails.length + ' FALHA(S) de ' + results.length + ' verificações' : 'TUDO OK (' + results.length + ' verificações)'));
process.exit(fails.length ? 1 : 0);
