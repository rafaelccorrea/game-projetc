'use strict';
// MENU DE DEPURAÇÃO DO APP DEV (js/devmenu.js) + gancho e item "Sobre" das Configurações (js/p_cfg.js), em Node, com um DOM de mentira.
// Rodar: node test/paineis/devmenu.smoke.js [-v]     (DEVMENU_SRC / PCFG_SRC trocam os arquivos lidos, para testar uma cópia antes de gravar)
// Prova principal: FORA do build DEV (app normal em https://localhost, loja, outro endereço, STORE_BUILD ligado) o arquivo não cria window.DevMenu,
// elemento, estilo nem ouvinte, e os 5 toques na versão não fazem nada. NO DEV (http://localhost:8080): 5 toques em até 3 s abrem; cada item monta
// a URL certa; fresh=1 pede confirmação; "Voltar ao normal" recarrega sem parâmetros. O arquivo não toca em localStorage nem em rede.
// Não prova: aparência, toque de verdade, o jogo real reagindo a cada parâmetro (nada disto roda o jogo).
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), VERBOSE = process.argv.includes('-v');
const SRC_DEV = process.env.DEVMENU_SRC || path.join(R, 'js', 'devmenu.js'), SRC_CFG = process.env.PCFG_SRC || path.join(R, 'js', 'p_cfg.js');
const devCode = fs.readFileSync(SRC_DEV, 'utf8'), cfgCode = fs.readFileSync(SRC_CFG, 'utf8'), indexHtml = fs.readFileSync(path.join(R, 'index.html'), 'utf8');
const read = f => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0; const ok = m => { n++; if (VERBOSE) console.log('  ok  ' + m); };

/* ---------- mundo de mentira ---------- */
function world(loc, opts) { opts = opts || {};
  const st = { created: 0, listeners: 0, storage: 0, net: 0, hrefs: [], renders: 0 };
  function mkEl(tag) { const el = { tagName: String(tag).toUpperCase(), children: [], parent: null, id: '', dataset: {}, attrs: {}, ls: {}, style: { cssText: '' }, textContent: '', scrollTop: 0, _html: '',
      setAttribute(k, v) { this.attrs[k] = String(v); }, addEventListener(t, f) { st.listeners++; (this.ls[t] = this.ls[t] || []).push(f); },
      appendChild(c) { c.parent = this; this.children.push(c); return c; }, remove() { if (this.parent) { this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; } },
      get firstChild() { return this.children[0] || null; } };
    Object.defineProperty(el, 'innerHTML', { get() { return this._html; }, set(v) { this._html = String(v); } });
    return el; }
  const body = mkEl('body'), head = mkEl('head'), V = mkEl('div');
  const find = (el, id) => { if (el.id === id) return el; for (const c of el.children) { const r = find(c, id); if (r) return r; } return null; };
  const location = Object.assign({ protocol: 'https:', hostname: 'localhost', port: '', pathname: '/', search: '' }, loc);
  Object.defineProperty(location, 'href', { get() { return ''; }, set(v) { st.hrefs.push(String(v)); } });
  const counted = name => new Proxy({}, { get() { st[name]++; return () => null; } });
  const w = { console, Date, Math, JSON, String, Object, Array, parseInt, isFinite, decodeURIComponent, encodeURIComponent, setTimeout: () => 0, clearTimeout: () => {},
    location, navigator: { userAgent: opts.ua || 'node' }, localStorage: counted('storage'), sessionStorage: counted('storage'),
    fetch() { st.net++; return Promise.reject(new Error('rede')); }, XMLHttpRequest: function () { st.net++; },
    document: { body, head, createElement(t) { st.created++; return mkEl(t); }, getElementById: id => find(body, id) || find(V, id) } };
  w.window = w; w.globalThis = w; const ctx = vm.createContext(w);
  const run = (code, name) => vm.runInContext(code, ctx, { filename: name || 'teste.js' });
  run('const STORE_BUILD=' + (opts.store ? 'true' : 'false') + ';const SYS_LIVE={bonfire:true,guildBoss:false,battlePolish:false,mountCharge:false,skillIcons:false,"ruim-chave":false};'
    + 'const STAGES_PER_ERA=10;var S={stage:' + (opts.stage || 34) + ',set:{sound:true},name:"Kael",skinEq:{armor:"a00"}};function eraOf(s){return Math.floor((s-1)/10);}');
  return { w, st, body, V, run, loadDev: () => run(devCode, 'devmenu.js') }; }
/* as Configurações de verdade, com o mínimo do jogo de mentira em volta */
function loadCfg(W) { W.w.V = W.V; let def = null;
  W.run('const VERSION="v9.9.9",DEBUG=false,GAME_NAME="Eonbound";var view="cfg";const V=window.V;const Panels={add(k,d){window.__cfg=d;},on(){return false;}};'
    + 'const esc2=s=>String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;"}[c]));const n0=x=>String(x);'
    + 'function snd(){} function vib(){} function save(){} function render(){ window.__renders=(window.__renders||0)+1; window.__cfg.render(); }'
    + 'const xDims=()=>({}), xWrap=(d,c,h)=>h;');
  W.run(cfgCode, 'p_cfg.js'); def = W.w.__cfg; assert.ok(def && typeof def.click === 'function' && typeof def.render === 'function', 'p_cfg.js registrou o painel');
  return def; }
const tapVer = def => def.click({ dataset: { x: 'ver' } }, {});

/* ---------- 1. FORA DO DEV: nada existe ---------- */
const NOT_DEV = [
  ['app normal (https://localhost, sem porta)', { protocol: 'https:', hostname: 'localhost', port: '' }, {}],
  ['app normal com ?debug=1 no endereço', { protocol: 'https:', hostname: 'localhost', port: '', search: '?debug=1&fresh=1' }, {}],
  ['https na porta 8080', { protocol: 'https:', hostname: 'localhost', port: '8080' }, {}],
  ['http em localhost sem porta', { protocol: 'http:', hostname: 'localhost', port: '' }, {}],
  ['http em outra porta', { protocol: 'http:', hostname: 'localhost', port: '3000' }, {}],
  ['site publicado na porta 8080', { protocol: 'http:', hostname: 'jogo.exemplo.com', port: '8080' }, {}],
  ['IP da rede na porta 8080', { protocol: 'http:', hostname: '192.168.0.10', port: '8080' }, {}],
  ['arquivo local', { protocol: 'file:', hostname: '', port: '' }, {}],
  ['agente de usuário do DEV, mas endereço do app normal', { protocol: 'https:', hostname: 'localhost', port: '' }, { ua: 'Mozilla EonboundDev' }],
  ['endereço do DEV com STORE_BUILD ligado', { protocol: 'http:', hostname: 'localhost', port: '8080', search: '?debug=1' }, { store: true }]];
for (const [name, loc, opts] of NOT_DEV) { const W = world(loc, opts); W.loadDev();
  assert.strictEqual(W.w.DevMenu, undefined, name + ': window.DevMenu não existe');
  assert.strictEqual(W.st.created, 0, name + ': nenhum elemento criado'); assert.strictEqual(W.st.listeners, 0, name + ': nenhum ouvinte');
  assert.strictEqual(W.body.children.length, 0, name + ': nada na página'); assert.strictEqual(W.st.storage + W.st.net, 0, name + ': sem armazenamento nem rede');
  ok('fora do DEV: ' + name); }
{ /* os 5 toques (e 20) na versão das Configurações de verdade, no app normal */
  const W = world({ protocol: 'https:', hostname: 'localhost', port: '' }); W.loadDev(); const def = loadCfg(W), c0 = W.st.created, l0 = W.st.listeners;
  def.onOpen({ page: 2 }); def.render(); const html0 = W.V.innerHTML, r0 = W.w.__renders || 0;
  assert.ok(/data-x="ver"/.test(html0), 'o número da versão é o alvo do toque');
  for (let i = 0; i < 20; i++) tapVer(def);
  assert.strictEqual(W.w.DevMenu, undefined); assert.strictEqual(W.st.created, c0, 'toques não criam elemento'); assert.strictEqual(W.st.listeners, l0);
  assert.strictEqual(W.w.__renders || 0, r0, 'toques não redesenham'); assert.strictEqual(W.V.innerHTML, html0, 'a tela não muda'); assert.strictEqual(W.body.children.length, 0);
  assert.strictEqual(W.st.hrefs.length, 0, 'nenhuma recarga'); assert.strictEqual(W.st.storage + W.st.net, 0);
  ok('app normal: 20 toques na versão não fazem nada'); }

/* ---------- 2. NO DEV ---------- */
const DEV = { protocol: 'http:', hostname: 'localhost', port: '8080', pathname: '/' };
{ const W = world(DEV); W.loadDev(); const D = W.w.DevMenu; assert.ok(D && typeof D.tap === 'function', 'DevMenu existe no DEV');
  assert.strictEqual(W.st.created, 0, 'sem parâmetro e sem toque: nenhum elemento (nem o selo)');
  /* 4 toques não abrem; o 5º dentro de 3 s abre; toques espaçados não abrem */
  let t = 1000; for (let i = 0; i < 4; i++) assert.strictEqual(D.tap(t += 100), false); assert.strictEqual(D.isOpen(), false);
  assert.strictEqual(D.tap(t += 100), true); assert.strictEqual(D.isOpen(), true); assert.strictEqual(W.body.children.length, 1); ok('DEV: 5 toques em menos de 3 s abrem');
  D.close(); assert.strictEqual(D.isOpen(), false); assert.strictEqual(W.body.children.length, 0);
  t = 100000; for (let i = 0; i < 12; i++) assert.strictEqual(D.tap(t += 800), false, 'toques a cada 0,8 s: no máximo 4 na janela de 3 s'); assert.strictEqual(D.isOpen(), false); ok('DEV: toques lentos não abrem');
  /* 127.0.0.1 também é o servidor de desenvolvimento */
  const W2 = world({ protocol: 'http:', hostname: '127.0.0.1', port: '8080' }); W2.loadDev(); assert.ok(W2.w.DevMenu); ok('DEV: 127.0.0.1:8080 conta');
  /* pelo gancho das Configurações de verdade */
  const W3 = world(DEV); W3.loadDev(); const def = loadCfg(W3); def.onOpen({ page: 2 }); def.render();
  for (let i = 0; i < 4; i++) tapVer(def); assert.strictEqual(W3.w.DevMenu.isOpen(), false); tapVer(def); assert.strictEqual(W3.w.DevMenu.isOpen(), true); ok('DEV: 5 toques na versão das Configurações abrem o menu'); }

/* ---------- 3. URLs ---------- */
{ const W = world(DEV, { stage: 34 }); W.loadDev(); const D = W.w.DevMenu, u = s => D.url(s);
  assert.deepStrictEqual(Array.from(D.comKeys()), ['guildBoss', 'battlePolish', 'mountCharge', 'skillIcons'], 'com= só oferece as chaves false do SYS_LIVE');
  assert.strictEqual(u({}), '/?debug=1'); assert.strictEqual(u(), '/?debug=1');
  assert.strictEqual(u({ items: ['titulo'] }), '/?debug=1&titulo=3');
  assert.strictEqual(u({ items: ['fresh'] }), '/?debug=1&fresh=1');
  assert.strictEqual(u({ items: ['semlate1'] }), '/?debug=1&semlate=1'); assert.strictEqual(u({ items: ['semlate20'] }), '/?debug=1&semlate=20');
  assert.strictEqual(u({ items: ['semlate20', 'semlate1'] }), '/?debug=1&semlate=1', 'um valor só por parâmetro');
  assert.strictEqual(u({ items: ['falha'] }), '/?debug=1&falha=era'); assert.strictEqual(u({ items: ['lento'] }), '/?debug=1&lento=800');
  assert.strictEqual(u({ com: ['guildBoss'] }), '/?debug=1&com=guildBoss');
  assert.strictEqual(u({ com: ['mountCharge', 'skillIcons', 'mountCharge'] }), '/?debug=1&com=mountCharge,skillIcons');
  assert.strictEqual(u({ com: ['bonfire', 'naoExiste', 'ruim-chave', 'x&online=1'] }), '/?debug=1', 'chave ligada, desconhecida ou com caractere estranho não entra');
  assert.strictEqual(u({ items: ['naoExiste', 'online=1'] }), '/?debug=1', 'item fora da tabela não entra');
  assert.strictEqual(u({ plv: 50 }), '/?debug=1&era=3&plv=50', 'nível: atalho ?era=<era atual>&plv=');
  assert.strictEqual(u({ plv: '999' }), '/?debug=1&era=3&plv=100'); assert.strictEqual(u({ plv: 1 }), '/?debug=1'); assert.strictEqual(u({ plv: 'abc' }), '/?debug=1'); assert.strictEqual(u({ plv: '' }), '/?debug=1');
  assert.strictEqual(u({ com: ['battlePolish'], items: ['titulo', 'fresh', 'lento'], plv: 20 }), '/?debug=1&com=battlePolish&titulo=3&fresh=1&lento=800&era=3&plv=20');
  assert.strictEqual(D.normalUrl(), '/');
  const W2 = world(Object.assign({}, DEV, { pathname: '/index.html' })); W2.loadDev(); assert.strictEqual(W2.w.DevMenu.url({ items: ['titulo'] }), '/index.html?debug=1&titulo=3');
  ok('cada item monta a URL certa'); }

/* ---------- 4. o menu: ativos, aplicar, confirmação do fresh, voltar ao normal ---------- */
{ const W = world(Object.assign({}, DEV, { search: '?debug=1&com=mountCharge&semlate=20&plv=30&era=2' })); W.loadDev(); const D = W.w.DevMenu;
  assert.strictEqual(W.body.children.length, 1, 'com parâmetro ativo: selo DEV'); assert.strictEqual(W.body.children[0].id, 'dv_chip');
  assert.deepStrictEqual(Array.from(D.active()), ['debug=1', 'com=mountCharge', 'semlate=20', 'plv=30', 'era=2']);
  W.body.children[0].ls.click[0]({}); assert.strictEqual(D.isOpen(), true, 'o selo abre o menu');
  const root = W.body.children[1], html = () => root.innerHTML;
  assert.ok(html().indexOf('debug=1 · com=mountCharge · semlate=20 · plv=30 · era=2') >= 0, 'mostra os parâmetros ativos');
  assert.ok(/Voltar ao normal/.test(html()) && /Aplicar e recarregar/.test(html()));
  assert.ok(!/…|\.\.\./.test(html()), 'sem reticências');
  /* as caixas começam como o endereço */
  assert.strictEqual(D._u.com.mountCharge, true); assert.strictEqual(D._u.sel.semlate20, true); assert.strictEqual(D._u.plv, '30');
  D.toggle('item', 'semlate1'); assert.strictEqual(D._u.sel.semlate1, true); assert.strictEqual(D._u.sel.semlate20, false, 'semlate=1 e semlate=20 não ficam juntos');
  assert.strictEqual(D.toggle('com', 'bonfire'), false); assert.strictEqual(D.toggle('item', 'nada'), false);
  assert.strictEqual(D.apply(), true); assert.deepStrictEqual(W.st.hrefs, ['/?debug=1&com=mountCharge&semlate=1&era=3&plv=30']); ok('Aplicar recarrega na URL montada');
  /* nível inválido não recarrega */
  W.st.hrefs.length = 0; D.setLevel('500'); assert.strictEqual(D.apply(), false); assert.strictEqual(W.st.hrefs.length, 0); assert.ok(/Nível de 2 a 100/.test(html())); D.setLevel('');
  /* fresh=1: confirmação antes */
  D.toggle('item', 'fresh'); assert.strictEqual(D.apply(), false); assert.strictEqual(W.st.hrefs.length, 0, 'fresh=1 não recarrega sem confirmar');
  assert.ok(/Nada é gravado/.test(html()) && /NÃO é apagado/.test(html()), 'a confirmação diz o que o fresh=1 faz');
  const click = d => root.ls.click[0]({ target: { closest: () => ({ dataset: { d } }) } });
  click('askno'); assert.strictEqual(W.st.hrefs.length, 0); assert.strictEqual(D._u.ask, false);
  click('apply'); assert.strictEqual(D._u.ask, true); click('askyes'); assert.deepStrictEqual(W.st.hrefs, ['/?debug=1&com=mountCharge&fresh=1&semlate=1']); ok('fresh=1 só depois da confirmação');
  W.st.hrefs.length = 0; click('normal'); assert.deepStrictEqual(W.st.hrefs, ['/']); ok('Voltar ao normal recarrega sem parâmetros');
  click('close'); assert.strictEqual(D.isOpen(), false);
  assert.strictEqual(W.st.storage + W.st.net, 0, 'o menu não toca em armazenamento nem em rede'); ok('o menu não grava nem chama a rede'); }

/* ---------- 5. os parâmetros existem mesmo no jogo (texto do código de hoje) ---------- */
{ const farm = read('js/farm.js'), pre = read('js/preload.js'), late = read('js/latepack.js'), t3 = read('js/p_title3.js'), ob = read('js/onlineboot.js');
  assert.ok(/\[\?&\]com=\(\[\\w,\]\+\)/.test(farm), 'com= no sysLive (várias chaves por vírgula)');
  assert.ok(/QP\.get\('titulo'\)==='3'/.test(t3), 'titulo=3'); assert.ok(/q\.get\('semlate'\)/.test(late), 'semlate');
  assert.ok(/QS\.get\('falha'\)/.test(pre) && /QS\.get\('lento'\)/.test(pre), 'falha e lento');
  assert.ok(/\[\?&\]fresh=1\/\.test\(location\.search\)\)\{ window\.__noSave=true; S=newState\(\); \}/.test(indexHtml), 'fresh=1: save novo em memória, gravações bloqueadas');
  assert.ok(/if\(DEBUG&&\(QP\.has\('era'\)[^\n]*\n\s*window\.__noSave=true;/.test(indexHtml), 'bloco do ?era=: gravações bloqueadas');
  assert.ok(/if\(QP\.has\('plv'\)\) window\.__plv=\+QP\.get\('plv'\)/.test(indexHtml), 'plv');
  assert.ok(/function save\(\)\{ if\(window\.__noSave/.test(indexHtml), 'save() não grava com __noSave');
  assert.ok(/if \(W\.__noSave\) return 'nosave'/.test(ob), 'online não liga com __noSave (nada sobe)');
  assert.ok(/'loading','devmenu'\]\.forEach/.test(indexHtml), 'devmenu na lista de scripts do index.html');
  ok('cada parâmetro do menu existe no código do jogo'); }

/* ---------- 6. "Sobre" em Configurações ---------- */
{ const W = world({ protocol: 'https:', hostname: 'localhost', port: '' }); const def = loadCfg(W); def.onOpen({ page: 2 }); def.render();
  assert.ok(/data-x="about"/.test(W.V.innerHTML) && /<b[^>]*>Sobre<\/b>/.test(W.V.innerHTML), 'item Sobre na aba Conta · Ajuda');
  def.click({ dataset: { x: 'about' } }, {}); const h = W.V.innerHTML;
  assert.ok(/aria-label="Sobre"/.test(h), 'janela Sobre'); assert.ok(h.indexOf('Eonbound') >= 0 && h.indexOf('Versão v9.9.9') >= 0, 'nome e versão');
  assert.ok(h.indexOf('Ao jogar você aceita os Termos de Uso e a Política de Privacidade.') >= 0, 'a frase das telas de entrada');
  assert.ok(/href="https:\/\/[^"]+\/termos"/.test(h) && /href="https:\/\/[^"]+\/privacidade"/.test(h), 'links dos dois documentos');
  const host = /page:'(https:\/\/[^/']+)\/excluir-conta'/.exec(read('js/delacct.js')); assert.ok(host, 'endereço da página de exclusão (js/delacct.js)');
  assert.ok(h.indexOf('href="' + host[1] + '/termos"') >= 0 && h.indexOf('href="' + host[1] + '/privacidade"') >= 0, 'mesmo servidor da página de exclusão');
  assert.ok(!/CNPJ|@[a-z0-9-]+\.[a-z]{2,}|Ltda|LTDA/.test(h.replace(/href="[^"]*"/g, '')), 'sem empresa, e-mail ou endereço inventado');
  def.click({ dataset: { x: 'dlgx' } }, {}); assert.ok(!/aria-label="Sobre"/.test(W.V.innerHTML), 'Fechar fecha');
  /* o caminho citado nas telas de entrada continua igual */
  assert.ok(read('js/p_title3.js').indexOf('(em Configurações › Sobre)') >= 0 && read('js/p_intro.js').indexOf('(em Configurações › Sobre)') >= 0, 'texto das telas de entrada intacto');
  ok('Sobre: nome, versão, frase de aceite e links; nada inventado'); }

console.log('devmenu.smoke: ' + n + ' verificações OK');
