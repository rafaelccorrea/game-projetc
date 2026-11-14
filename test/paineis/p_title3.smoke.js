'use strict';
// TELA INICIAL V3 (js/p_title3.js) sobre o js/p_intro.js REAL, em Node, com um DOM de mentira. Rodar: node test/paineis/p_title3.smoke.js [-v]
// Prova: chave desligada = nada muda (nenhuma função do PIntro trocada, nenhum listener, estilo, temporizador ou elemento); ligada: desenha jogador novo e
// jogador que volta; JOGAR chama a função de hoje UMA vez e só então nasce o convidado; o cartão do servidor abre a troca; a conta chama PIntro.google;
// sem conexão, manutenção, nuvem, escolha; nenhum texto com reticências, zero emoji, toda imagem citada existe em disco, nenhum botão sem ação.
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), VERBOSE = process.argv.includes('-v');
const g = globalThis; g.window = g;
const out = []; const ok = m => { out.push(m); if (VERBOSE) console.log('  ok  ' + m); };
const exists = p => fs.existsSync(path.join(R, p.split('?')[0]));
const tickP = () => new Promise(r => setImmediate(r));

/* ---------- DOM de mentira: só o que os dois arquivos usam ---------- */
let created = 0, failCreate = 0;
function mkEl(tag) { const el = { tagName: String(tag || 'div').toUpperCase(), children: [], parent: null, innerHTML: '', textContent: '', className: '', id: '', dataset: {}, attrs: {}, ls: [],
    clientWidth: 390, clientHeight: 844, offsetTop: 0, width: 0, height: 0,
    style: { cssText: '', setProperty(k, v) { this[k] = v; } },
    setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') this.id = String(v); }, getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    addEventListener(t, f) { this.ls.push({ t, f }); }, removeEventListener(t, f) { this.ls = this.ls.filter(x => !(x.t === t && x.f === f)); },
    appendChild(c) { if (c.parent) c.remove(); c.parent = this; this.children.push(c); return c; },
    replaceChild(n, o) { const i = this.children.indexOf(o); if (i >= 0) { this.children[i] = n; n.parent = this; o.parent = null; } return o; },
    remove() { if (this.parent) { this.parent.children = this.parent.children.filter(x => x !== this); this.parent = null; } },
    contains(x) { for (let p = x; p; p = p.parent) if (p === this) return true; return false; },
    querySelector() { return null; }, querySelectorAll() { return []; }, getContext() { return this.ctx || null; } };
  const set = new Set(); el.classList = { add(c) { set.add(c); }, remove(c) { set.delete(c); }, contains: c => set.has(c), toggle(c) { set.has(c) ? set.delete(c) : set.add(c); } };
  return el; }
const head = mkEl('head'), body = mkEl('body');
g.document = { readyState: 'complete', hidden: false, head, body,
  createElement(tag) { if (failCreate > 0) { failCreate--; throw new Error('createElement de teste'); } created++; return mkEl(tag); },
  getElementById(id) { return head.children.find(c => c.id === id) || null; } };
let WL = [], timers = [], rafs = [];
g.addEventListener = (t, f) => { WL.push({ t, f }); }; g.removeEventListener = (t, f) => { WL = WL.filter(x => !(x.t === t && x.f === f)); };
g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};
g.requestAnimationFrame = f => { rafs.push(f); return rafs.length; }; g.cancelAnimationFrame = () => {};
Object.defineProperty(g, 'navigator', { value: { userAgent: 'node', onLine: true }, writable: true, configurable: true });
const store = {}; g.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
g.location = { search: '' }; g.fetch = undefined; g.devicePixelRatio = 2;

/* ---------- jogo de mentira ---------- */
g.PANEL_ON = { intro: true }; g.DEBUG = false; g.QP = new URLSearchParams(''); g.VERSION = 'v0.13.3'; g.STAGES_PER_ERA = 10;
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Era Industrial', 'Era Moderna', 'Era Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.eraOf = st => Math.min(8, Math.floor((st - 1) / 10)); g.B = { paused: true }; g.save = () => {}; g.hud = () => {}; g.snd = () => {}; g.AWAY = 0;
let gReady = true; const OBS = { on: true, why: '', booted: true, booting: false, lastAction: 'none', pending: false, choosing: false, waitingPlay: false };
const OBraw = { last: { ok: true }, reloading: false }; let plays = 0;
g.OnlineBoot = { state: () => Object.assign({}, OBS), play() { plays++; return Promise.resolve({ ok: true }); }, _st: OBraw };
g.Sys = { name: {}, level: { level: s => s.lvl || 1 }, net: { DATA: { on: true }, hasSession: () => false, googleReady: () => gReady } };
let realmMounts = []; g.RealmUI = { mount(box, o) { realmMounts.push(o); return {}; } };
const setNet = (o, raw) => { Object.assign(OBS, { on: true, booted: true, booting: false, lastAction: 'none', pending: false, choosing: false, waitingPlay: false }, o || {}); OBraw.last = (raw && raw.last) || { ok: true }; OBraw.reloading = !!(raw && raw.reloading); };
const newS = () => ({ stage: 1, hero: 'kael' });
const oldS = () => ({ name: 'Rafa', stage: 27, hero: 'kaia', lvl: 42, tut: 99 });

const SRC_I = fs.readFileSync(path.join(R, 'js/p_intro.js'), 'utf8'), SRC_T = fs.readFileSync(path.join(R, 'js/p_title3.js'), 'utf8');
g.S = newS();
vm.runInThisContext(SRC_I, { filename: 'p_intro.js' });
const PI = g.PIntro; assert(PI && typeof PI.show === 'function', 'o PIntro carregou');
timers = [];   /* o arranque do p_intro (boot) não roda aqui: o teste abre a entrada à mão */
const REAL = { show: PI.show, finish: PI.finish, toast: PI.toast, nav: PI.nav, guest: PI.guest, google: PI.google };
let shows = [], finishes = 0, toasts = [];
const spyShow = function (id) { shows.push(id); return true; }, spyFinish = function () { finishes++; this.el = null; this.root = null; };
const spyToast = function (m) { toasts.push(String(m)); };
/* carrega o arquivo novo de novo, com o PIntro limpo (como numa abertura nova do jogo) */
function load(key, o) { o = o || {};
  if (g.PTitle3 && g.PTitle3._t.el) { try { PI.show('Prologo'); } catch (e) {} }
  PI.show = o.realShow ? REAL.show : spyShow; PI.finish = spyFinish; PI.toast = o.realToast ? REAL.toast : spyToast; PI.nav = REAL.nav; PI.guest = REAL.guest; PI.google = REAL.google;
  PI.el = null; PI.root = null; PI.cur = null; PI.id = ''; PI.off = null; PI.claimed = false;
  for (const c of head.children.slice()) if (c.id === 't3_css') c.remove();
  shows = []; finishes = 0; toasts = []; plays = 0; realmMounts = []; WL = []; timers = []; rafs = []; created = 0; delete store.eon_realm_seen;
  if (key === undefined) delete g.TITLE3_ON; else g.TITLE3_ON = key;
  delete g.PTitle3; vm.runInThisContext(SRC_T, { filename: 'p_title3.js' }); return g.PTitle3; }
/* o que o PIntro.open faz antes de pedir a primeira tela */
function openPin() { const el = mkEl('div'); el.id = 'pin'; const r = mkEl('div'); el.appendChild(r); body.appendChild(el); PI.el = el; PI.root = r; return el; }
const layer = () => PI.el ? PI.el.children.find(c => c.className === 't3') : null;
const part = cls => { const L = g.PTitle3._t.parts; return L ? Object.values(L).find(p => p.className === cls) : null; };
const ui = () => part('t3-ui').innerHTML, sheet = () => part('t3-sheet').innerHTML;
const ALL = [];   /* todo HTML e todo aviso que a tela produziu (para as varreduras do fim) */
const keep = h => { ALL.push(h); return h; };

(async () => {
  const T3src = SRC_T;

  // 0) ARTE: toda imagem da constante existe; a folha do dragão bate com o .json e o PNG do disco
  { const P = load(false), A = P.ART, D = A.dragon;
    assert(exists(A.logo), 'logo dourado em disco'); assert.strictEqual(A.logo, 'assets/brand/logo.png', 'o logo é o dourado do carregamento');
    assert.strictEqual(A.bg.length, 9); for (const b of A.bg) { assert(exists(b[0]), 'fundo em disco: ' + b[0]); assert(b[1] > 0.5 && b[1] < 0.9 && b[2] >= 0 && b[2] <= 1); }
    for (const h of ['kael_phase0', 'kaia_phase0']) assert(exists(A.avatarDir + h + '.png'), 'retrato em disco: ' + h);
    assert(exists(D.base + '.png') && exists(D.base + '.json'), 'folha do dragão em disco');
    const j = JSON.parse(fs.readFileSync(path.join(R, D.base + '.json'), 'utf8')), b = fs.readFileSync(path.join(R, D.base + '.png')), pw = b.readUInt32BE(16), ph = b.readUInt32BE(20);
    const cols = j.cols > 0 ? j.cols : j.frames, rows = Math.ceil(j.frames / cols);
    assert.strictEqual(D.frames, j.frames, 'quadros = .json'); assert.strictEqual(D.cols | 0, j.cols | 0, 'colunas = .json (tira ou grade)'); assert.strictEqual(D.w, j.w); assert.strictEqual(D.h, j.h); assert.strictEqual(D.feetY, j.feetY, 'pés = .json');
    assert.strictEqual(pw, cols * j.w, 'largura do PNG = colunas x célula'); assert.strictEqual(ph, rows * j.h, 'altura do PNG = linhas x célula');
    assert.strictEqual(D.body, j.h - j.padTop - j.padBottom, 'altura do corpo = célula sem as folgas'); assert(Math.abs(D.cx - (j.padLeft + (j.w - j.padLeft - j.padRight) / 2)) <= 2, 'centro do corpo');
    assert(/era2_dragon_evo_idle$/.test(D.base), 'dragão do jogo no estágio evoluído, folha idle');
    ok('arte: logo dourado, 9 fundos, retratos e a folha do dragão (' + pw + 'x' + ph + ', ' + j.frames + ' quadros) existem e batem com o .json'); }

  // 1) CHAVE DESLIGADA: nada muda
  { const P = load(undefined);
    assert.strictEqual(g.TITLE3_ON, false, 'a chave nasce false'); assert.strictEqual(P.isOn(), false);
    assert.strictEqual(PI.show, spyShow, 'PIntro.show intocado'); assert.strictEqual(PI.finish, spyFinish, 'PIntro.finish intocado'); assert.strictEqual(PI.toast, spyToast, 'PIntro.toast intocado');
    assert.strictEqual(PI.nav, REAL.nav); assert.strictEqual(PI.guest, REAL.guest); assert.strictEqual(PI.google, REAL.google);
    assert.strictEqual(WL.length, 0, 'nenhum listener'); assert.strictEqual(timers.length, 0, 'nenhum temporizador'); assert.strictEqual(rafs.length, 0, 'nenhum quadro pedido');
    assert.strictEqual(created, 0, 'nenhum elemento criado'); assert.strictEqual(head.children.length, 0, 'nenhum estilo na página');
    assert.strictEqual(P.install(), false, 'install não faz nada desligado'); assert.strictEqual(PI.show, spyShow);
    openPin(); PI.show('TituloV2B'); assert.deepStrictEqual(shows, ['TituloV2B'], 'a tela de hoje é pedida como sempre'); assert.strictEqual(layer(), undefined, 'sem camada nova');
    assert.strictEqual(P.act('play'), false, 'toque sem a tela montada não faz nada'); assert.strictEqual(plays, 0);
    /* ?titulo=3 sem debug não liga; debug sem o parâmetro não liga */
    g.DEBUG = false; g.QP = new URLSearchParams('titulo=3'); load(undefined); assert.strictEqual(g.TITLE3_ON, false); assert.strictEqual(PI.show, spyShow);
    g.DEBUG = true; g.QP = new URLSearchParams('debug=1'); load(undefined); assert.strictEqual(g.TITLE3_ON, false); assert.strictEqual(PI.show, spyShow);
    /* ?debug=1&titulo=3 liga só nesta carga */
    g.QP = new URLSearchParams('debug=1&titulo=3'); load(undefined); assert.strictEqual(g.TITLE3_ON, true, '?debug=1&titulo=3 liga'); assert.notStrictEqual(PI.show, spyShow, 'ligada: PIntro.show embrulhado');
    g.DEBUG = false; g.QP = new URLSearchParams('');
    ok('desligada: PIntro intocado, zero listener/temporizador/estilo/elemento; liga só com window.TITLE3_ON = true ou ?debug=1&titulo=3'); }

  // 2) LIGADA, JOGADOR NOVO
  { g.S = newS(); setNet({ booted: false, waitingPlay: true }, { last: { ok: false, reason: 'no_session' } }); const P = load(true); openPin();
    assert.strictEqual(WL.length, 0, 'ligada mas ainda sem a tela: nenhum listener');
    assert.strictEqual(PI.show('TituloV2B'), true); assert.deepStrictEqual(shows, [], 'a tela antiga NÃO é desenhada'); assert(layer(), 'a camada nova está dentro do #pin');
    assert.strictEqual(PI.id, 'TituloV2B'); assert(PI.el.classList.contains('t3on')); assert(head.children.some(c => c.id === 't3_css'), 'estilo entra ao montar');
    assert.strictEqual(part('t3-logo').attrs.src, P.ART.logo, 'logo dourado na tela'); assert.strictEqual(part('t3-logo').attrs.alt, 'Eonbound');
    const h = keep(ui());
    assert(/>JOGAR<small>Começa como convidado neste celular<\/small>/.test(h), 'JOGAR do jogador novo'); assert(!/t3-pc/.test(h), 'jogador novo não tem cartão de herói');
    assert((h.match(/data-t3="srv"/g) || []).length === 1 && /S1 · Nova Era/.test(h) && /Trocar/.test(h), 'UM cartão de servidor, com o atual e o Trocar');
    assert(/data-t3="acct" aria-label="Conta: ainda sem conta"/.test(h), 'conta num ícone'); assert(/Versão v0\.13\.3/.test(h), 'versão no rodapé'); assert(/Termos de Uso/.test(h));
    assert.strictEqual(plays, 0, 'abrir o Título não cria convidado'); assert.strictEqual(g.S.acct, undefined);
    /* servidor: abre o painel de reinos de hoje (com Voltar), sem criar conta */
    assert.strictEqual(P.act('srv'), true); assert.strictEqual(realmMounts.length, 1); assert.strictEqual(realmMounts[0].first, false, 'troca de servidor (não é o 1º acesso)'); realmMounts[0].onDone('s1'); assert.strictEqual(plays, 0);
    assert(layer(), 'depois de voltar do servidor a tela continua'); delete store.eon_realm_seen;
    /* conta: a folha, o convidado e o Google */
    P.act('acct'); let s = keep(sheet()); assert(/Você ainda não tem conta/.test(s) && /Entrar com Google/.test(s) && /Continuar como convidado/.test(s) && /Excluir conta fica em Configurações/.test(s));
    P.act('guest'); assert.strictEqual(sheet(), ''); assert.strictEqual(plays, 0, '"Continuar como convidado" não cria nada'); assert(/criado quando você tocar em JOGAR/.test(toasts[toasts.length - 1]));
    let gCalls = 0; PI.google = () => { gCalls++; g.S.acct = 'google'; return Promise.resolve({}); };
    P.act('acct'); assert.strictEqual(P.act('google'), true); assert.strictEqual(gCalls, 1, 'a conta chama PIntro.google'); keep(sheet()); assert(/Conectando com Google/.test(sheet()));
    assert.strictEqual(P.act('google'), false, 'toque repetido durante o login não chama de novo'); await tickP();
    assert.strictEqual(gCalls, 1); assert.strictEqual(sheet(), '', 'entrou: a folha fecha'); assert(/data-t3="acct" aria-label="Conta: Google"/.test(keep(ui()))); assert(/Salvo na nuvem/.test(ui()));
    P.act('acct'); assert(!/data-t3="google"/.test(keep(sheet())), 'conta Google: sem botão de entrar'); P.act('close'); g.S.acct = undefined; PI.google = REAL.google; P.act('acct'); P.act('close');
    /* Google sem conexão / sem o plugin: avisa e não chama */
    let g2 = 0; PI.google = () => { g2++; return Promise.resolve({}); }; gReady = false; P.act('acct'); assert.strictEqual(P.act('google'), false); assert.strictEqual(g2, 0); gReady = true; PI.google = REAL.google; P.act('close');
    /* JOGAR: a mesma função de hoje (PIntro.guest), UMA vez; só aqui nasce o convidado; depois servidor (1ª vez) e Prólogo */
    assert.strictEqual(P.act('play'), true); assert.strictEqual(plays, 1, 'JOGAR criou o convidado (OnlineBoot.play)'); assert.strictEqual(g.S.acct, 'guest');
    assert.strictEqual(P.act('play'), false, 'segundo toque não faz nada'); assert.strictEqual(plays, 1, 'uma vez só');
    assert.strictEqual(realmMounts.length, 2); assert.strictEqual(realmMounts[1].first, true, '1º acesso: escolha de servidor como hoje'); assert.deepStrictEqual(shows, []);
    realmMounts[1].onDone('s1'); assert.deepStrictEqual(shows, ['Prologo'], 'segue para o Prólogo'); assert.strictEqual(layer(), undefined, 'a camada sai'); assert(!PI.el.classList.contains('t3on'));
    assert.strictEqual(WL.length, 0, 'saiu do Título: listeners removidos'); assert.strictEqual(plays, 1);
    /* quem já passou pela escolha de servidor vai direto */
    store.eon_realm_seen = '1'; g.S = newS(); shows = []; plays = 0; PI.show('TituloV2B'); P.act('play'); assert.deepStrictEqual(shows, ['Prologo']); assert.strictEqual(plays, 1);
    /* entrou com o Google pelo ícone antes de JOGAR: não vira convidado */
    g.S = newS(); g.S.acct = 'google'; shows = []; plays = 0; PI.show('TituloV2B'); assert(/Começar a jornada/.test(keep(ui()))); P.act('play'); assert.strictEqual(g.S.acct, 'google'); assert.strictEqual(plays, 0); assert.deepStrictEqual(shows, ['Prologo']);
    ok('jogador novo: desenha (logo dourado, JOGAR, um cartão de servidor, conta no ícone); convidado nasce só no JOGAR, uma vez; servidor abre a troca; conta chama PIntro.google'); }

  // 3) LIGADA, JOGADOR QUE VOLTA
  { g.S = oldS(); setNet(); const P = load(true); openPin(); PI.show('TituloV2B'); const h = keep(ui());
    assert(/<b>Rafa<\/b><small>Medieval · fase 7<\/small>/.test(h), 'cartão com nome, era e fase'); assert(/>Nv 42</.test(h), 'nível'); assert(/src="assets\/hero\/avatar\/kaia_phase0\.png"/.test(h), 'retrato do herói do save');
    assert(/>JOGAR<small>Continuar a jornada<\/small>/.test(h)); assert(/<small>Online<\/small>/.test(h)); assert(/Conta: convidado/.test(h) && /Salvo neste celular/.test(h)); assert(!/Termos de Uso/.test(h));
    let navs = []; PI.nav = function (t) { navs.push(t); }; let guests = 0; PI.guest = () => { guests++; };
    assert.strictEqual(P.act('play'), true); assert.strictEqual(P.act('play'), false); assert.deepStrictEqual(navs, ['Prologo'], 'JOGAR chama o PIntro.nav de hoje UMA vez'); assert.strictEqual(guests, 0); assert.strictEqual(plays, 0);
    /* com o nav REAL: sem tempo fora entra direto no jogo (finish), e a tela para */
    load(true); openPin(); PI.show('TituloV2B'); assert(WL.length >= 4 && rafs.length === 1); assert.strictEqual(P2().act('play'), true); assert.strictEqual(finishes, 1, 'nav real: entrou no jogo'); assert.strictEqual(WL.length, 0, 'listeners removidos ao entrar');
    assert.strictEqual(P2()._t.live, false); const n0 = rafs.length; rafs[0](1000); assert.strictEqual(rafs.length, n0, 'o laço do herói morre');
    /* com tempo fora: o nav de hoje abre o Bem-vindo de volta (com o Coletar) e a camada sai */
    load(true); openPin(); PI.off = { gold: 10 }; PI.show('TituloV2B'); P2().act('play'); assert.deepStrictEqual(shows, ['BemVindo'], 'tempo fora: Bem-vindo de volta de hoje'); assert.strictEqual(layer(), undefined);
    /* nome com HTML não vira marcação */
    g.S = oldS(); g.S.name = '<img src=x onerror=1>"\''; load(true); openPin(); PI.show('TituloV2B'); const hx = ui(); assert(!/<img src=x/.test(hx) && /&lt;img src=x onerror=1&gt;&quot;&#39;/.test(hx), 'texto escapado');
    /* conta de quem volta */
    g.S = oldS(); load(true); openPin(); PI.show('TituloV2B'); P2().act('acct'); const s = keep(sheet()); assert(/Convidado/.test(s) && /Vincular com Google/.test(s) && !/Continuar como convidado/.test(s));
    ok('jogador que volta: cartão com nome, nível, era, fase e retrato; JOGAR = PIntro.nav de hoje uma vez (direto ao jogo ou Bem-vindo de volta com o Coletar)'); }
  function P2() { return g.PTitle3; }

  // 4) ESTADOS de conexão
  { g.S = oldS(); setNet(); const P = load(true); openPin(); PI.show('TituloV2B'); let navs = 0; PI.nav = () => { navs++; };
    const redraw = () => { const l = WL.find(x => x.t === 'onlineboot'); assert(l, 'a tela ouve o OnlineBoot'); l.f(); return keep(ui()); };
    setNet({ booted: false }, { last: { ok: false, reason: 'offline' } }); let h = redraw();
    assert(/Sem conexão\. Você joga offline/.test(h) && /<small>Sem conexão<\/small>/.test(h) && /JOGAR<small>Jogo offline</.test(h), 'sem conexão: avisa e joga offline'); assert(!/aria-disabled/.test(h));
    P.act('acct'); assert(/Entrar com Google precisa de conexão/.test(keep(sheet()))); let gc = 0; PI.google = () => { gc++; return Promise.resolve(); }; assert.strictEqual(P.act('google'), false); assert.strictEqual(gc, 0, 'sem conexão não tenta o Google'); PI.google = REAL.google; P.act('close');
    setNet(); navigator.onLine = false; h = redraw(); assert(/Sem conexão\. Você joga offline/.test(h), 'aparelho sem rede'); navigator.onLine = true;
    setNet({ booted: false }, { last: { ok: false, reason: 'maintenance' } }); h = redraw(); assert(/Servidor em manutenção/.test(h) && /<small>Manutenção<\/small>/.test(h) && /Jogo offline/.test(h), 'manutenção');
    assert.strictEqual(P.act('play'), true); assert.strictEqual(navs, 1, 'offline/manutenção: JOGAR entra');
    load(true); openPin(); PI.show('TituloV2B'); navs = 0; PI.nav = () => { navs++; };
    setNet({ lastAction: 'applied' }, { reloading: true }); h = redraw(); assert(/Carregando o seu jogo da nuvem/.test(h) && /class="t3-play t3-wait" data-t3="play" aria-disabled="true"/.test(h), 'carregando da nuvem: JOGAR espera');
    assert.strictEqual(g.PTitle3.act('play'), false); assert.strictEqual(navs, 0); assert(/vindo da nuvem/.test(toasts[toasts.length - 1]));
    setNet({ choosing: true }); h = redraw(); assert(/Escolha qual jogo continuar/.test(h) && /aria-disabled="true"/.test(h), 'escolha celular x nuvem'); assert.strictEqual(g.PTitle3.act('play'), false); assert.strictEqual(navs, 0);
    setNet({ pending: true }); h = redraw(); assert(/Jogo da nuvem encontrado/.test(h) && !/aria-disabled/.test(h));
    setNet({ booted: false, booting: true }); h = redraw(); assert(/<small>Conectando<\/small>/.test(h));
    setNet({ on: false, booted: false }); h = redraw(); assert(!/t3-ban/.test(h) && !/<small>Online/.test(h), 'online desligado: jogo local, sem aviso');
    setNet(); h = redraw(); assert.strictEqual(g.PTitle3.act('play'), true); assert.strictEqual(navs, 1);
    /* sem o painel de reinos: o cartão mostra o servidor mas não vira botão morto */
    const RU = g.RealmUI; g.RealmUI = null; load(true); openPin(); PI.show('TituloV2B'); h = keep(ui()); assert(/class="t3-srv" role="status"/.test(h) && !/data-t3="srv"/.test(h) && !/Trocar/.test(h)); assert.strictEqual(g.PTitle3.act('srv'), false); g.RealmUI = RU;
    ok('estados: sem conexão, manutenção, carregando da nuvem, escolha celular x nuvem, save pendente, conectando, online desligado'); }

  // 5) Google no app DEV e conta Google com outro personagem: os avisos do PIntro.google de hoje, sem reticências e escritos na folha
  { g.S = oldS(); setNet(); const P = load(true, { realToast: false }); openPin(); PI.show('TituloV2B');
    navigator.userAgent = 'Mozilla EonboundDev/1'; gReady = false; g.PTitle3._t.PI.toast('x');
    P.act('acct'); assert(/No app DEV o login Google não funciona\. Jogue como convidado\./.test(keep(sheet())), 'aviso do app DEV na folha');
    assert.strictEqual(P.act('google'), true, 'no DEV o toque vai ao PIntro.google (que avisa)'); await tickP();
    assert(toasts.some(t => /No app DEV o login Google não funciona/.test(t)), 'aviso do PIntro.google'); assert(/t3-msg[^>]*>No app DEV/.test(keep(sheet())), 'o aviso fica escrito na folha');
    navigator.userAgent = 'node'; gReady = true; P.act('close');
    g.OnlineBoot.google = () => Promise.resolve({ ok: false, reason: 'link_taken', other: { level: 57 } });
    P.act('acct'); toasts = []; assert.strictEqual(P.act('google'), true); await tickP(); await tickP();
    assert(toasts.some(t => /Esta conta Google já tem outro personagem \(Nv\. 57\)/.test(t)), 'conta com outro personagem: aviso de hoje'); assert(/t3-msg[^>]*>Esta conta Google já tem outro personagem/.test(keep(sheet())), 'e fica na folha');
    assert(!toasts.some(t => /Não foi possível/.test(t)), 'sem aviso de erro por cima');
    g.OnlineBoot.google = () => Promise.resolve({ ok: true, pending: true, player: {} }); g.OnlineBoot.applyPending = () => {};
    toasts = []; P.act('close'); P.act('acct'); P.act('google'); await tickP(); await tickP();
    assert(toasts.includes('Carregando o seu jogo da nuvem'), 'o aviso de hoje perde as reticências com a tela nova na frente'); assert(!toasts.some(t => /\.\.\.|…/.test(t)));
    g.OnlineBoot.google = () => Promise.resolve({ ok: false, reason: 'server' }); g.S.acct = undefined; toasts = []; P.act('acct'); P.act('google'); await tickP(); await tickP(); assert(toasts.some(t => /Não foi possível entrar com o Google/.test(t)));
    delete g.OnlineBoot.google; ALL.push(...toasts);
    /* fora da tela nova o aviso do PIntro passa como é */
    PI.show('Prologo'); toasts = []; PI.toast('Verificando o nome...'); assert.deepStrictEqual(toasts, ['Verificando o nome...'], 'sem a tela nova o aviso não é mexido');
    ok('Google: app DEV e "esta conta Google já tem outro personagem" pelos avisos do PIntro.google, também escritos na folha; falha comum avisa'); }

  // 5b) APARELHO NOVO, JOGADOR QUE JÁ TEM CONTA GOOGLE: "Já tenho conta: entrar com Google" à vista, logo abaixo do JOGAR (exigência do PO antes de ligar a tela)
  { const fresh = () => { g.S = newS(); setNet({ booted: false, waitingPlay: true }, { last: { ok: false, reason: 'no_session' } }); const P = load(true); openPin(); PI.show('TituloV2B'); return P; };
    const ALT = /<button type="button" class="t3-alt" data-t3="google"><i aria-hidden="true">G<\/i><span>Já tenho conta: entrar com Google<\/span><\/button>/;
    let P = fresh(), h = keep(ui());
    /* jogador novo vê os DOIS botões, nesta ordem: JOGAR, Já tenho conta, linha de apoio, termos */
    assert((h.match(/data-t3="play"/g) || []).length === 1 && ALT.test(h), 'jogador novo: JOGAR e "Já tenho conta: entrar com Google"'); assert((h.match(/data-t3="google"/g) || []).length === 1);
    { const at = s => h.indexOf(s); assert(at('data-t3="play"') < at('class="t3-alt"') && at('class="t3-alt"') < at('Convidado: o progresso fica neste celular até você ligar uma conta.') && at('até você ligar uma conta.') < at('Termos de Uso'), 'ordem: JOGAR, Já tenho conta, apoio, termos'); }
    assert(/>JOGAR<small>Começa como convidado neste celular<\/small>/.test(h), 'o JOGAR do jogador novo não mudou');
    { const css = P._css, r = /#pin \.t3-alt\{([^}]*)\}/.exec(css); assert(r && +(/min-height:(\d+)px/.exec(r[1]) || [0, 0])[1] >= 44, 'toque de 44 px'); assert(!/white-space:nowrap|text-overflow/.test(r[1]) && /#pin \.t3-alt span\{[^}]*overflow-wrap:anywhere/.test(css), 'o texto quebra em 320 px, sem reticências'); }
    /* "Já tenho conta" chama PIntro.google UMA vez e NÃO chama PIntro.guest (não nasce convidado) */
    let gC = 0, gu = 0; PI.google = () => { gC++; g.S.acct = 'google'; return Promise.resolve({}); }; PI.guest = () => { gu++; };
    assert.strictEqual(P.act('google'), true); assert.strictEqual(gC, 1, 'chama PIntro.google'); assert(/class="t3-alt" data-t3="google" aria-disabled="true"><i aria-hidden="true">G<\/i><span>Conectando com Google<\/span>/.test(keep(ui())), 'durante o login o botão espera');
    assert.strictEqual(P.act('google'), false, 'toque repetido não chama de novo'); await tickP();
    assert.strictEqual(gC, 1, 'PIntro.google UMA vez'); assert.strictEqual(gu, 0, 'não chama PIntro.guest'); assert.strictEqual(plays, 0, 'nenhum convidado criado'); assert.strictEqual(sheet(), '', 'sem folha por cima');
    h = keep(ui()); assert(!/t3-alt/.test(h) && /Conta: Google/.test(h) && /Começar a jornada/.test(h), 'entrou: o botão extra some e a conta é Google'); assert(toasts.some(t => /Conta Google conectada/.test(t)));
    assert.strictEqual(P.act('play'), true); assert.strictEqual(gu, 0, 'quem entrou com Google não vira convidado no JOGAR'); assert.strictEqual(plays, 0);
    /* JOGAR chama PIntro.guest UMA vez (o convidado só nasce no toque) e não chama o Google */
    P = fresh(); gC = 0; gu = 0; PI.google = () => { gC++; return Promise.resolve({}); }; PI.guest = () => { gu++; }; store.eon_realm_seen = '1';
    assert.strictEqual(gu, 0, 'abrir a tela não cria convidado'); assert.strictEqual(P.act('play'), true); assert.strictEqual(P.act('play'), false); assert.strictEqual(gu, 1, 'JOGAR chama PIntro.guest UMA vez'); assert.strictEqual(gC, 0); delete store.eon_realm_seen;
    /* sem conexão: bloqueia com aviso, não tenta o Google; manutenção idem */
    for (const why of ['offline', 'maintenance']) { P = fresh(); gC = 0; PI.google = () => { gC++; return Promise.resolve({}); }; setNet({ booted: false }, { last: { ok: false, reason: why } }); WL.find(x => x.t === 'onlineboot').f(); h = keep(ui());
      assert(/class="t3-alt" data-t3="google" aria-disabled="true">/.test(h), why + ': botão marcado como indisponível'); assert.strictEqual(P.act('google'), false); assert.strictEqual(gC, 0, why + ': não tenta o Google'); assert(/Entrar com Google precisa de conexão/.test(toasts[toasts.length - 1]), why + ': avisa'); }
    /* app DEV: o toque vai ao PIntro.google de hoje, que avisa */
    P = fresh(); navigator.userAgent = 'Mozilla EonboundDev/1'; gReady = false; WL.find(x => x.t === 'onlineboot').f(); assert(ALT.test(keep(ui())), 'DEV: o botão aparece'); toasts = [];
    assert.strictEqual(P.act('google'), true); await tickP(); await tickP(); assert(toasts.some(t => /No app DEV o login Google não funciona\. Jogue como convidado\./.test(t)), 'aviso do app DEV'); assert.strictEqual(plays, 0); assert(ALT.test(keep(ui())), 'depois do aviso o botão volta');
    navigator.userAgent = 'node'; gReady = true; ALL.push(...toasts);
    /* camada online desligada (jogo local): não há conta para entrar, o botão não aparece */
    P = fresh(); setNet({ on: false, booted: false }); WL.find(x => x.t === 'onlineboot').f(); assert(!/t3-alt/.test(keep(ui())), 'online desligado: sem o botão');
    /* quem VOLTA com conta Google: nada muda (sem botão extra; JOGAR = PIntro.nav de hoje, uma vez); quem volta como convidado também não vê */
    g.S = oldS(); g.S.acct = 'google'; setNet(); P = load(true); openPin(); PI.show('TituloV2B'); h = keep(ui()); assert(!/t3-alt/.test(h) && !/Já tenho conta/.test(h) && !/até você ligar uma conta/.test(h), 'acct google: sem o botão extra'); assert(/Conta: Google/.test(h) && /Continuar a jornada/.test(h));
    { let navs = []; gu = 0; gC = 0; PI.nav = function (t) { navs.push(t); }; PI.guest = () => { gu++; }; PI.google = () => { gC++; return Promise.resolve({}); };
      assert.strictEqual(P.act('play'), true); assert.strictEqual(P.act('play'), false); assert.deepStrictEqual(navs, ['Prologo'], 'acct google: JOGAR chama PIntro.nav uma vez'); assert.strictEqual(gu, 0); assert.strictEqual(gC, 0); assert.strictEqual(plays, 0); }
    g.S = oldS(); setNet(); P = load(true); openPin(); PI.show('TituloV2B'); assert(!/t3-alt/.test(keep(ui())), 'quem volta como convidado: sem o botão extra (vincular fica no ícone de conta)');
    ok('aparelho novo: JOGAR e "Já tenho conta: entrar com Google"; o segundo chama PIntro.google uma vez e não cria convidado; JOGAR chama guest uma vez; sem conexão avisa; app DEV avisa; quem volta com conta não vê o botão'); }

  // 6) SEGURANÇA: erro ao montar = tela de hoje; chave desligada depois = tela de hoje
  { g.S = oldS(); setNet(); load(true); openPin(); failCreate = 1; const ce = console.error; console.error = () => {}; assert.strictEqual(PI.show('TituloV2B'), true); console.error = ce; assert.deepStrictEqual(shows, ['TituloV2B'], 'não montou: a tela de hoje é desenhada'); assert.strictEqual(layer(), undefined); assert.strictEqual(WL.length, 0);
    load(true); openPin(); g.TITLE3_ON = false; PI.show('TituloV2B'); assert.deepStrictEqual(shows, ['TituloV2B'], 'chave desligada em tempo real: tela de hoje'); assert.strictEqual(layer(), undefined);
    /* arquivo carregado com o Título de hoje já aberto: troca na hora */
    g.TITLE3_ON = true; load(false); openPin(); PI.id = 'TituloV2B'; PI.cur = {}; g.TITLE3_ON = true; assert.strictEqual(g.PTitle3.install(), true); assert(layer(), 'Título já aberto: a tela nova entra');
    ok('segurança: falha ao montar ou chave desligada = a tela de hoje aparece como sempre'); }

  // 7) CENA: herói pelo desenho do jogo, pés no chão; dragão no chão; laço a 30 quadros
  { g.S = oldS(); setNet(); const calls = []; g.HS = 155; g.drawHeroFull = (x, cx, cy, k, st) => { calls.push({ cx, cy, k, st }); return true; };
    const P = load(true); openPin(); PI.show('TituloV2B'); const cv = part('t3-hero'); cv.ctx = { setTransform() {}, clearRect() {} };
    const geo = P._t.geo, num = (el, k) => parseFloat((new RegExp('(?:^|;)' + k + ':(-?[0-9.]+)px')).exec(el.style.cssText)[1]);
    assert.strictEqual(rafs.length, 1); rafs[0](1000); assert.strictEqual(calls.length, 1, 'o herói é o desenho do jogo (drawHeroFull)');
    assert.strictEqual(calls[0].st.pet, false, 'sem o pet do jogador: o dragão da tela faz esse papel'); assert.strictEqual(calls[0].st.mount, undefined, 'montaria e asa do save'); assert(calls[0].st.t >= 0);
    assert(Math.abs(num(cv, 'top') + calls[0].cy / 2 - geo.feet) <= 1, 'pés do herói na linha do chão'); assert(Math.abs(calls[0].k - geo.F * 2 / 155) < 1e-6, 'escala pelo HS do jogo');
    const dg = part('t3-dragon'), D = P.ART.dragon, k = num(dg, 'height') / D.h; assert(Math.abs(num(dg, 'top') + D.feetY * k - geo.feet) <= 4, 'dragão apoiado no chão (não flutua)');
    assert(dg.style.cssText.includes('url(' + D.base + '.png)') && /animation:/.test(dg.style.cssText), 'dragão animado pela folha'); assert(/1200% 100%/.test(dg.style.cssText), 'tira de 12');
    /* FUNDO PINTADO (castelo ao entardecer): é o fundo da tela; cobre a largura sem esticar (a caixa tem a proporção da peça); o chão da pintura (0,79 da altura) é a linha dos pés */
    const bg = part('t3-bg'), BA = P.ART.bgArt; assert.strictEqual(BA.url, 'assets/ui/title/title_bg_a.png'); assert(exists(BA.url), 'fundo pintado em disco'); assert.strictEqual(BA.ground, 0.79, 'linha do chão da pintura');
    { const b = fs.readFileSync(path.join(R, BA.url)); assert.strictEqual(b.readUInt32BE(16), 1080); assert.strictEqual(b.readUInt32BE(20), 1920); assert(Math.abs(BA.ratio - 1080 / 1920) < 1e-9, 'proporção = a do PNG'); }
    assert(bg.style.cssText.includes('url(' + BA.url + ')') && !/assets\/bg\/era/.test(bg.style.cssText), 'o fundo é a pintura'); assert(Math.abs(num(bg, 'width') / num(bg, 'height') - BA.ratio) < 0.01, 'pintura na proporção dela (não estica)');
    assert(Math.abs(num(bg, 'top') + num(bg, 'height') * BA.ground - geo.feet) <= 1.5, 'herói e dragão na linha do chão da pintura'); assert(num(bg, 'top') <= 0, 'a pintura nunca deixa vão no alto');
    assert.strictEqual(part('t3-scene t3-art') && part('t3-scene t3-art').className, 't3-scene t3-art', 'tinta de entardecer leve sobre a pintura'); assert(/#pin \.t3-art \.t3-tint\{/.test(P._css) && /#pin \.t3-tint\{/.test(P._css));
    assert(P._t.probe && P._t.probe.attrs.src === BA.url && P._t.probe.ls.some(x => x.t === 'error'), 'a carga da pintura é pedida ao montar, com tratamento de falha');
    assert(num(bg, 'width') >= 390 && num(bg, 'left') <= 0 && num(bg, 'left') + num(bg, 'width') >= 390, 'fundo cobre a largura');
    assert(geo.feet > 844 * 0.38 && geo.feet < 844, 'chão dentro da tela');
    rafs[1](1010); assert.strictEqual(calls.length, 1, 'no máximo 30 quadros por segundo'); rafs[2](1040); assert.strictEqual(calls.length, 2);
    document.hidden = true; rafs[3](1100); assert.strictEqual(calls.length, 2, 'parado com o app no fundo'); document.hidden = false;
    /* telas estreitas: nada passa da largura */
    for (const w of [320, 390]) { PI.el.children.find(c => c.className === 't3').clientWidth = w; WL.find(x => x.t === 'resize').f(); const G2 = P._t.geo; assert.strictEqual(num(cv, 'width'), w); assert(G2.hx < w && G2.F <= w * 0.6); assert(num(bg, 'left') <= 0 && num(bg, 'left') + num(bg, 'width') >= w); }
    /* jogador novo: a cena do castelo do mock */
    g.S = newS(); load(true); openPin(); PI.show('TituloV2B'); assert(part('t3-bg').style.cssText.includes('url(assets/ui/title/title_bg_a.png)'), 'jogador novo: a pintura');
    /* RESERVA: a pintura não carregou (evento de erro) = a cena da era volta sozinha (jogador novo: a do castelo, era 2), sem a tinta leve, com o herói e o dragão no chão dela */
    { const T0 = g.PTitle3._t, cv2 = part('t3-hero'), dg2 = part('t3-dragon'), D2 = g.PTitle3.ART.dragon; T0.probe.ls.find(x => x.t === 'error').f(); const b2 = part('t3-bg');
      assert(b2.style.cssText.includes('url(assets/bg/era2.png)') && !/title_bg_a/.test(b2.style.cssText), 'reserva: cenário da era'); assert.strictEqual(part('t3-scene').className, 't3-scene', 'reserva: tinta de entardecer de antes');
      assert(/;top:0;/.test(b2.style.cssText) && num(b2, 'left') <= 0 && num(b2, 'left') + num(b2, 'width') >= 390, 'reserva cobre a largura'); const k2 = num(dg2, 'height') / D2.h;
      assert(Math.abs(num(dg2, 'top') + D2.feetY * k2 - T0.geo.feet) <= 4 && Math.abs(num(b2, 'height') * (g.PTitle3.ART.bg[2][1] + g.PTitle3.ART.bgFeet) - T0.geo.feet) <= 1, 'reserva: chão da cena da era'); ALL.push(b2.style.cssText);
      g.S = oldS(); PI.show('Prologo'); PI.show('TituloV2B'); assert(part('t3-bg').style.cssText.includes('url(assets/bg/era2.png)'), 'a falha vale até a próxima abertura do jogo (não tenta de novo a cada tela)'); }
    g.S = newS(); load(true); openPin(); PI.show('TituloV2B');
    /* sem o desenho do jogo: a tela continua de pé */
    delete g.drawHeroFull; load(true); openPin(); PI.show('TituloV2B'); rafs[0](1000); assert(layer());
    for (const p of ['t3-bg', 't3-dragon']) for (const el of [part(p)]) ALL.push(el.style.cssText);
    ok('cena: herói pelo drawHeroFull com os pés no chão, dragão do jogo apoiado no chão e animado pela folha, fundo da era, laço a 30 quadros e parado no fundo'); }

  // 8) VARREDURAS: texto, botões, imagens, estilo
  { g.S = newS(); setNet(); const P = load(true); openPin(); PI.show('TituloV2B');
    for (const acct of [undefined, 'guest', 'google']) for (const nw of [true, false]) for (const net of [{}, { booted: false, x: 'offline' }, { booted: false, x: 'maintenance' }, { choosing: true }, { lastAction: 'applied' }, { pending: true }, { on: false }]) for (const dev of [false, true]) {
      g.S = nw ? newS() : oldS(); if (acct) g.S.acct = acct; setNet(net, net.x ? { last: { ok: false, reason: net.x } } : null); navigator.userAgent = dev ? 'EonboundDev' : 'node';
      const st = P.snap(); ALL.push(P.uiHTML(st)); ALL.push(P.sheetHTML(st)); }
    navigator.userAgent = 'node'; setNet();
    const acts = P.actions(); let nBtn = 0, nImg = 0;
    for (const h of ALL) {
      assert(!/\.\.\.|…/.test(h), 'reticências em: ' + h.slice(0, 160)); assert(!/\p{Extended_Pictographic}/u.test(h), 'emoji em: ' + h.slice(0, 160));
      assert(!/undefined|NaN|\[object|null</.test(h), 'valor cru em: ' + h.slice(0, 200)); if (h[0] === '<') assert(!/R\$|oferta|promo|desconto|compre|só hoje|últim[ao]s|imperd|grátis|\d\s*%/i.test(h.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/style="[^"]*"/g, '')), 'preço/oferta/urgência em: ' + h.slice(0, 160));
      for (const b of h.match(/<button[^>]*>/g) || []) { nBtn++; const m = /data-t3="([a-z]+)"/.exec(b); assert(m && acts.includes(m[1]), 'botão sem ação: ' + b); assert(/type="button"/.test(b)); }
      for (const m of h.matchAll(/data-t3="([a-z]+)"/g)) assert(acts.includes(m[1]), 'ação desconhecida: ' + m[1]);
      for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { nImg++; assert(exists(m[1]), 'imagem que não existe: ' + m[1]); }
      assert(!/<a\s/.test(h), 'sem link (o PIntro trata <a href> como navegação)'); }
    for (const m of T3src.matchAll(/assets\/[A-Za-z0-9_\/.-]+\.(?:png|webp|jpg|json)/g)) assert(exists(m[0]), 'arquivo citado no código não existe: ' + m[0]);
    assert(!/\b(alert|confirm|prompt)\s*\(/.test(T3src), 'sem alert/confirm/prompt'); assert(!/\p{Extended_Pictographic}/u.test(T3src.replace(/[›·]/g, '')), 'sem emoji no arquivo');
    assert(!/localStorage|fetch\(|XMLHttpRequest|ensureSession|googleSignIn/.test(T3src), 'o arquivo não fala com o servidor nem com o save');
    const css = P._css;
    for (const k of ['top', 'bottom', 'left', 'right']) assert(css.includes('env(safe-area-inset-' + k), 'área segura: ' + k);
    const rule = sel => { const m = new RegExp('#pin \\.' + sel + '\\{([^}]*)\\}').exec(css); assert(m, 'regra ' + sel); return m[1]; }, n = (r, k) => +(new RegExp('(?:^|;)' + k + ':(\\d+)px').exec(r) || [0, 0])[1];
    assert(n(rule('t3-play'), 'min-height') >= 44 && n(rule('t3-srv'), 'min-height') >= 44 && n(rule('t3-btn'), 'min-height') >= 44, 'toque mínimo de 44 px');
    assert(n(rule('t3-acct'), 'width') >= 44 && n(rule('t3-acct'), 'height') >= 44 && n(rule('t3-x'), 'width') >= 44 && n(rule('t3-x'), 'height') >= 44);
    for (const m of css.matchAll(/[;{](?:min-)?width:(\d+)px/g)) assert(+m[1] <= 320, 'largura fixa maior que 320 px: ' + m[0]);
    assert(/#pin \.t3\{[^}]*overflow:hidden/.test(css) && /\.t3-sh\{[^}]*overflow-x:hidden/.test(css), 'sem rolagem lateral'); assert(/prefers-reduced-motion/.test(css));
    /* contraste AA (4,5:1) dos pares texto/fundo sólidos da tela */
    const lum = h => { const c = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
    const cr = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    for (const [fg, bgc, what] of [['#2a1403', '#f2a826', 'JOGAR'], ['#2a1403', '#ffe58a', 'JOGAR (topo)'], ['#d8cbb8', '#0b0806', 'rodapé'], ['#c9b9a2', '#2c2116', 'nota da folha'], ['#ffb38a', '#2c2116', 'aviso da folha'], ['#f6ecdf', '#33271d', 'botão'],
      ['#1f1f1f', '#ffffff', 'Google'], ['#ffe2a8', '#3a2c1f', 'Trocar'], ['#3a2208', '#f2b52a', 'nível'], ['#f0e4d2', '#342c24', 'aviso sem conexão'], ['#ffe2cc', '#402012', 'aviso manutenção'], ['#dff4ff', '#142430', 'aviso nuvem'], ['#ffe9b0', '#16110d', 'mensagem'], ['#c9b9a2', '#16110d', 'conta'], ['#ffffff', '#1b140e', 'Já tenho conta'], ['#1f1f1f', '#ffffff', 'G do Já tenho conta']])
      assert(cr(fg, bgc) >= 4.5, 'contraste ' + what + ' = ' + cr(fg, bgc).toFixed(2));
    ok('varreduras: ' + ALL.length + ' desenhos e avisos sem reticências, emoji, valor cru, preço ou urgência; ' + nBtn + ' botões com ação; ' + nImg + ' imagens em disco; 44 px, área segura, contraste AA'); }

  console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM (' + out.length + ' blocos)');
})().catch(e => { console.error(out.join('\n')); console.error('FALHOU: ' + (e && e.stack || e)); process.exit(1); });
