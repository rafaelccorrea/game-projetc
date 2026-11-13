'use strict';
/* CARREGADOR COMPARTILHADO do test/e2e (run.js e flows.js): DOM falso + o jogo inteiro num vm, na MESMA ordem do index.html
   (scripts embutidos, js/sys da lista do index + os demais js/sys, test/bg/scene.js, js/<lista do index> e, logo depois de screens.js,
   a lista de painéis do js/screens.js). As listas são lidas dos arquivos a cada execução. Só lê arquivos do jogo, nunca grava.
   const G = require('./sandbox')({ add }); add(grupo, nome, ok, erro) recebe cada arquivo carregado. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..');
const W = 390, H = 704, TIMEOUT = 8000;
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
/* erro curto + primeiro arquivo:linha do jogo na pilha */
const errStr = e => { const msg = String(e && e.message || e); const st = String(e && e.stack || ''); const m = st.split('\n').map(l => l.match(/\(?((?:js|index|sys|test)[^\s():]*\.(?:js|html)[^\s():]*):(\d+):\d+\)?/)).find(Boolean);
  return msg.slice(0, 220) + (m ? ' [' + m[1] + ':' + m[2] + ']' : ''); };

module.exports = function boot(opt) {
  opt = opt || {}; const add = opt.add || (() => {});
  /* ---------------- DOM falso (mesma ideia do test/paineis/smoke_all.js) ---------------- */
  function styleObj() { return { setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; }, getPropertyValue(k) { return this[k] || ''; }, cssText: '' }; }
  const cls = () => ({ add() {}, remove() {}, toggle() {}, contains() { return false; } });
  function mkStub() { const f = function () {}; const p = new Proxy(f, {
    get(t, k) { if (k === Symbol.toPrimitive) return () => 0; if (k === Symbol.iterator) return function* () {}; if (k === 'then') return undefined;
      if (k === 'length') return 0; if (['innerHTML', 'textContent', 'className', 'src', 'id', 'value', 'innerText'].includes(k)) return t['_' + String(k)] || '';
      if (k === 'style') return t._style || (t._style = styleObj()); if (k === 'dataset') return t._dataset || (t._dataset = {}); if (k === 'classList') return cls();
      if (k === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 58, height: 58, right: 58, bottom: 58 });
      if (k === 'clientWidth' || k === 'offsetWidth' || k === 'width') return W; if (k === 'clientHeight' || k === 'offsetHeight' || k === 'height') return 844;
      if (k === 'getElementById' || k === 'closest') return () => null; if (k === 'querySelector') return () => mkStub(); if (k === 'querySelectorAll' || k === 'getElementsByTagName' || k === 'getElementsByClassName') return () => [];
      if (k === 'children' || k === 'childNodes') return []; if (k === 'parentNode' || k === 'parentElement') return null; if (k === 'matches') return () => false;
      if (k === 'getAttribute') return () => null; if (k === 'contains') return () => false;
      return p; },
    set(t, k, v) { t['_' + String(k)] = v; return true; }, apply() { return p; }, construct() { return p; }, has() { return true; } }); return p; }
  const V = { clientWidth: W, clientHeight: H, offsetWidth: W, offsetHeight: H, innerHTML: '', scrollTop: 0, scrollLeft: 0, style: styleObj(), dataset: {}, classList: cls(),
    addEventListener() {}, removeEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, contains() { return true; }, appendChild(c) { return c; },
    removeChild() {}, setAttribute() {}, getAttribute() { return null; }, getBoundingClientRect() { return { left: 0, top: 0, width: W, height: H, right: W, bottom: H }; }, scrollTo() {} };
  const els = {}, store = {};
  const document = { readyState: 'complete', hidden: false, title: '', body: mkStub(), head: mkStub(), documentElement: mkStub(), fonts: mkStub(),
    getElementById(id) { if (id === 'view') return V; if (/^(xg_|xs_|xh_|xp_|xr_|g_|res_|fb)/.test(id)) return null; return els[id] || (els[id] = mkStub()); },
    createElement() { return mkStub(); }, createTextNode() { return mkStub(); }, querySelector() { return null; }, querySelectorAll() { return []; },
    addEventListener() {}, removeEventListener() {}, write() {} };
  /* TIMERS: setTimeout entra numa fila com hora VIRTUAL. flush() roda tudo na hora (run.js); advance(ms) anda o relógio virtual e roda só o que venceu (flows.js) */
  let vnow = 0, tid = 0; const Q = [];
  const flush = () => { let n = 0; while (Q.length && n < 300) { const t = Q.shift(); n++; if (typeof t.fn === 'function') t.fn(); } };
  const advance = ms => { vnow += ms; let n = 0; for (;;) { Q.sort((a, b) => a.at - b.at || a.id - b.id); if (!Q.length || Q[0].at > vnow || n++ > 300) break; const t = Q.shift(); if (typeof t.fn === 'function') t.fn(); } };
  const consoleErrs = [];   /* erros que o próprio jogo pega e manda para console.error (não derrubam, mas aparecem como aviso) */
  const sandbox = { console: { log() {}, info() {}, warn() {}, debug() {}, error(...a) { consoleErrs.push(a.map(x => (x && x.message) ? errStr(x) : String(x)).join(' ').slice(0, 240)); } }, document, V_TEST: V,
    setTimeout(fn, ms) { const id = ++tid; Q.push({ fn, at: vnow + (+ms || 0), id }); return id; }, clearTimeout(id) { const i = Q.findIndex(t => t.id === id); if (i >= 0) Q.splice(i, 1); },
    setInterval() { return 0; }, clearInterval() {}, requestAnimationFrame() { return 0; }, cancelAnimationFrame() {},
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }, clear() {} },
    navigator: { userAgent: 'node', vibrate() {}, language: 'pt-BR' }, location: { search: '?debug=1&fresh=1&skip=1', href: 'http://x/?debug=1&fresh=1&skip=1', pathname: '/', hash: '', replace() {}, reload() {} },
    performance: { now: () => Date.now() },
    /* fetch: por padrão nunca responde (run.js é síncrono). Com opt.realFetch lê o arquivo do disco (só leitura) e responde por Promise (flows.js) */
    fetch: opt.realFetch ? (u => { const f = path.join(ROOT, String(u).split('?')[0].replace(/^\.?\//, '')); let txt = null; try { if (fs.existsSync(f) && fs.statSync(f).isFile()) txt = fs.readFileSync(f, 'utf8'); } catch (e) {}
      return Promise.resolve({ ok: txt != null, status: txt != null ? 200 : 404, json: () => (txt != null ? Promise.resolve().then(() => JSON.parse(txt)) : Promise.reject(new Error('404 ' + u))), text: () => Promise.resolve(txt || '') }); })
      : () => ({ then() { return this; }, catch() { return this; } }), Image: function () { return mkStub(); }, Audio: function () { return mkStub(); },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }), addEventListener() {}, removeEventListener() {}, dispatchEvent() {},
    URL, URLSearchParams, Event: function () {}, CustomEvent: function () {}, devicePixelRatio: 1, innerWidth: W, innerHeight: 844, screen: { width: W, height: 844 },
    getComputedStyle: () => mkStub(), alert() {}, confirm() { return true; }, prompt() { return null; }, Intl, Proxy, Reflect, Float32Array, Uint8Array, TextEncoder, TextDecoder };
  sandbox.window = sandbox; sandbox.self = sandbox; sandbox.globalThis = sandbox; sandbox.top = sandbox; sandbox.parent = sandbox;
  vm.createContext(sandbox);
  /* roda fn dentro do contexto com limite de tempo (pega laço infinito) */
  const inCtx = fn => { sandbox.__e2eFn = fn; try { return vm.runInContext('__e2eFn()', sandbox, { timeout: TIMEOUT }); } finally { sandbox.__e2eFn = null; } };
  const ev = code => vm.runInContext(code, sandbox, { timeout: TIMEOUT });
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

  return { ROOT, W, H, rd, errStr, sandbox, V, document, mkStub, styleObj, cls, inCtx, ev, flush, advance, vnow: () => vnow, timers: Q, consoleErrs, hasState, freshState,
    lists: { sysList, sysExtra, sysOrder, jsList, panList, pUnlisted } };
};
module.exports.errStr = errStr;
