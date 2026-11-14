'use strict';
// Teste de fumaça do js/p_coop.js (RUÍNAS EM TRIO) em Node: Sys.coop e Sys.coopNet REAIS (mais Sys.duo para as frases e Sys.guild para o convite da guilda),
// ligados só na memória deste teste; a rede (Sys.net._call) é de mentira. Rodar: node test/paineis/p_coop.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['duo', 'guild', 'coop', 'coopnet'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, C = Sys.coop, CN = Sys.coopNet;
assert(C && CN && C.DATA && CN.DATA, 'módulos carregados');
assert.strictEqual(C.DATA.on, false, 'Sys.coop nasce desligado'); assert.strictEqual(CN.DATA.on, false, 'Sys.coopNet nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', value: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const ELS = {}; for (const id of ['co_code', 'co_scroll', 'co_msg']) ELS[id] = mkEl(id);
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
const listeners = {};
g.document = { head: mkEl('head'), createElement: () => mkEl(''), addEventListener: (k, f) => { listeners[k] = f; }, getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 5, stage: 40 }); let LV = 35; host.level = () => LV; host.fc = () => 1000;
Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 40, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'coop';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0, opened = []; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open(n, o) { opened.push(n); return true; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

/* ---------- servidor de mentira (contrato docs/SERVIDOR_LOM.md 3.3) ---------- */
const ME = 'u1', calls = [], fail = {};
const SRV = { entriesLeft: 2, party: null, invites: [{ partyId: 'p9', fromName: 'Bia <b>', at: 1 }], lastRun: null, runs: 0, mailed: true };
const mkParty = (id, leader, members) => ({ id, leaderId: leader, seatsOpen: 3 - members.length, sayLeft: 20, members, chat: [] });
const meRow = () => ({ playerId: ME, name: 'Eu <i>', fc: 1000, ghost: false, entryOk: SRV.entriesLeft > 0 });
const ROUTES = {
  'GET /coop/status': () => ({ entriesLeft: SRV.entriesLeft, party: SRV.party, invites: SRV.party ? [] : SRV.invites, lastRun: SRV.lastRun }),
  'POST /coop/party': () => { SRV.party = mkParty('p1', ME, [meRow()]); return { ok: true }; },
  'POST /coop/party/invite': b => { SRV.party.members.push({ playerId: 'u7', name: b.friendCode ? 'Theo' : 'Luna', fc: 900, ghost: false, entryOk: true }); return { ok: true }; },
  'POST /coop/party/p9/join': () => { SRV.party = mkParty('p9', 'u2', [{ playerId: 'u2', name: 'Bia <b>', fc: 1100, ghost: false, entryOk: true }, meRow()]); return { ok: true }; },
  'POST /coop/party/leave': () => { SRV.party = null; return { ok: true }; },
  'POST /coop/party/phrase': b => { SRV.party.chat.push({ playerId: ME, idx: b.idx, at: host.now() }); SRV.party.sayLeft--; return { ok: true }; },
  'POST /coop/start': () => { SRV.runs++; SRV.entriesLeft--; const team = SRV.party.members.map(m => Object.assign({}, m, { paid: true })); while (team.length < 3) team.push({ playerId: 'gh' + team.length, name: 'Zed', fc: 950, ghost: true });
    const r = C.run(team, 77 + SRV.runs); return Object.assign({ runId: 'srv-' + SRV.runs, members: team, mailed: SRV.mailed }, r); } };
Sys.net = { player: () => ({ id: ME }), _call(m, p, b) { const k = m + ' ' + p; calls.push(k + (b && Object.keys(b).length ? ' ' + JSON.stringify(b) : ''));
  if (fail[k]) return Promise.reject(fail[k]); const h = ROUTES[k]; if (!h) return Promise.reject({ status: 404 });
  try { return Promise.resolve(h(b || {})); } catch (e) { return Promise.reject(e); } } };

const SRC = fs.readFileSync(path.join(R, 'js/p_coop.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_coop.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');
const P = g.PCoop;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="co_msg" class="co-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra\b/i.test(h), tag + ': pressão');
  assert(!/<textarea|contenteditable/i.test(h), tag + ': campo de texto livre'); assert((h.match(/<input\b/g) || []).length <= 1, tag + ': mais de um campo');
  for (const m of h.matchAll(/<input\b[^>]*>/g)) assert(/maxlength="10"/.test(m[0]) && /id="co_code"/.test(m[0]), tag + ': o único campo é o do código (10 letras)');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async () => { def.onOpen(); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;
const posts = () => calls.filter(c => /^POST/.test(c)).length;
const spy = (obj, name) => { const f0 = obj[name]; const s = { n: 0, restore() { obj[name] = f0; } }; obj[name] = function () { s.n++; return f0.apply(this, arguments); }; return s; };

(async () => {
try {
// 0) registro
assert.strictEqual(addName, 'coop'); assert.strictEqual(g.PANEL_ON.coop, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.busy);
assert(P && typeof P.card === 'function' && typeof P.alerts === 'function', 'ponte window.PCoop');
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|setProvider\s*\(|applyResult\s*\(|grantBundle\s*\(/.test(SRC), 'o arquivo não liga chave, não troca provider e não credita prêmio');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(!/Math\.random/.test(SRC), 'a tela não sorteia nada');
assert(/^function icoOf\(kind\)/m.test(SRC), 'a arte passa por UMA função icoOf'); assert(/const CO_ART_ON=false/.test(SRC), 'reserva atrás de uma constante única');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert(/\.co-bt,\.xs \.co-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
for (const m of CSS.matchAll(/\.co-(bt|bub),\.xs \.co-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .co-' + m[1]);
assert(/\.co-bt\.sm,\.xs \.co-bt\.sm\{[^}]*min-height:44px/.test(CSS)); assert(/\.co-inp\{[^}]*min-height:48px/.test(CSS));
assert(/\.co-root\{--co-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
for (const m of CSS.matchAll(/grid-template-columns:([^;}]+)/g)) assert(/minmax\(0,1fr\)/.test(m[1]), 'grades com minmax(0,1fr): sem rolagem lateral');
out.push('registro: coop desligada, ' + def.actions.length + ' ações com tratador, arte de reserva atrás de CO_ART_ON, sem diálogo, sem emoji, sem reticências, sem sorteio');

// 1) MÓDULO DESLIGADO e ausente: aviso e Voltar; nem desenhar nem tocar escreve no save; nada sai para a rede
{ g.PANEL_ON.coop = true; const before = JSON.stringify(g.S); await open(); has('As Ruínas em Trio ainda não abriram.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  for (const a of def.actions) if (a !== 'back') tap(a, { id: 'p9', i: '0' }); def.tick(); await settle();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: desenhar e tocar não escrevem no save'); assert(!g.S.sys.coop); assert.strictEqual(calls.length, 0, 'desligado: nenhuma chamada'); assert.strictEqual(saves, 0);
  assert.deepStrictEqual(P.card(), { on: false }); assert.strictEqual(P.alerts(), 0); assert.strictEqual(JSON.stringify(g.S), before, 'a ponte não escreve desligada');
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.coop; Sys.coop = null; try { await open(); has('Ruínas em Trio indisponíveis agora.'); assert.strictEqual(check('sem módulo'), 1); tap('start'); def.tick(); } finally { Sys.coop = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; desenhar e tocar não escrevem no save nem chamam a rede');

C.setOn(true);
// 2) TRANCADO POR NÍVEL: o texto é o do módulo; só o Voltar
{ LV = 29; g.S = newSave(); await open(); has(g.esc2(C.why('level'))); has('Continue lutando para liberar.'); assert.strictEqual(check('nível'), 1); const sp = spy(C, 'start');
  try { tap('start'); tap('startok'); assert.strictEqual(sp.n, 0, 'trancado: nada é chamado'); } finally { sp.restore(); }
  assert.strictEqual(P.card().open, false); assert.strictEqual(P.card().line, C.why('level')); assert.strictEqual(P.alerts(), 0); LV = 35; }
out.push('nível 29: "' + C.why('level') + '" e só o Voltar; nada é chamado');

// 3) LOCAL (sem online): entradas do dia, tabela do módulo, "abre com o online", corrida com retratos em dois toques
{ g.S = newSave(); saves = 0; await open(); const v = C.view(g.S, host);
  has('Entradas hoje: 2 de 2'); assert.strictEqual(count(/<i class="on"><\/i>/g), 2); has(g.esc2(C.why('not_found'))); has('dois retratos de força parecida'); not('data-x="create"'); not('id="co_code"');
  assert.strictEqual(count(/class="co-tb"/g), v.table.length, 'uma linha por andar da tabela do módulo'); assert.strictEqual(v.table.length, 10);
  has('aria-label="' + v.total.relicFrags + ' fragmentos de relíquia"'); has('ouro de ' + v.total.goldk + ' abates'); has('Nada à venda.'); has('data-x="start">Entrar com retratos<'); check('local');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)'); has('id="co_stc"');
  // ação só do online, tocada sem online: avisa e não chama nada
  for (const a of ['create', 'join', 'leave', 'leaveok', 'inv', 'gopen', 'ginv', 'phr', 'say']) { tap(a, { id: 'p9', i: '0' }); assert.strictEqual(msg(), 'Abre com o online', a); } assert.strictEqual(calls.length, 0);
  // dois toques
  const sp = spy(C, 'start'); let r1;
  try { tap('startok'); assert.strictEqual(sp.n, 0, 'confirmar sem armar não chama o módulo'); assert.strictEqual(msg(), 'Toque primeiro no botão dourado.');
    tap('start'); assert.strictEqual(sp.n, 0, 'o 1º toque não chama o módulo'); assert.strictEqual(C.entriesLeft(g.S, host), 2); has('data-x="startok">Confirmar: gastar 1 entrada<'); has('Gasta 1 das suas entradas de hoje.'); not('data-x="start"'); check('armado');
    tap('startok'); assert.strictEqual(sp.n, 1, 'Sys.coop.start chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(C.entriesLeft(g.S, host), 1, 'gastou 1 entrada'); assert(saves >= 1, 'a tela grava depois da corrida'); r1 = P.X.run; assert(r1 && !r1.done, 'a corrida entra em reprodução'); assert.strictEqual(def.busy(), true, 'em reprodução: não redesenhar por fora');
  has('A corrida'); has('andar 1 de 10'); has('class="co-tower"'); assert.strictEqual(count(/class="co-flr /g), 4, 'a torre mostra 4 andares'); has('data-x="skip"'); has('>Você<'); assert.strictEqual(count(/class="co-pt gh"/g), 2, 'dois retratos'); check('reprodução');
  tap('skip'); assert.strictEqual(def.busy(), false); const last = g.S.sys.coop.lastRun, reached = last.reached, rw = C.rewardFor(reached);
  assert.strictEqual(count(/class="co-fc w"/g), reached, 'andares vencidos acesos = registro do módulo'); assert.strictEqual(count(/class="co-fc l"/g), reached < 10 ? 1 : 0);
  if (reached >= 10) has('As ruínas foram vencidas'); else if (reached > 0) has('Fim da corrida: andar ' + reached); else has('o 1º guardião resistiu');
  if (reached > 0) { has('Prêmio já entregue.'); has('aria-label="' + (rw.relicFrags === 1 ? '1 fragmento' : rw.relicFrags + ' fragmentos') + ' de relíquia"'); } not('data-x="mail"'); not('chega pelo correio'); has('data-x="again"'); check('resultado local');
  tap('again'); has('Entradas hoje: 1 de 2'); has('Última corrida'); check('depois');
  // a reprodução anda sozinha pelo relógio (sem pular)
  tap('start'); tap('startok'); const n2 = P.X.run.n; await new Promise(r => setTimeout(r, 720 * n2 + 400)); assert.strictEqual(P.X.run.done, true, 'a reprodução termina sozinha'); assert.strictEqual(def.busy(), false); check('fim sozinho'); tap('again');
  // sem entradas: o botão diz o motivo do módulo; tocar não chama nada
  has('Entradas hoje: 0 de 2'); has('data-x="start">' + g.esc2(C.why('limit')) + '<'); const sp2 = spy(C, 'start'), before = JSON.stringify(g.S);
  try { tap('start'); assert.strictEqual(msg(), C.why('limit')); tap('startok'); assert.strictEqual(sp2.n, 0); } finally { sp2.restore(); } assert.strictEqual(JSON.stringify(g.S), before, 'recusa: save intacto'); assert(/class="co-msg f bad"/.test(H())); check('sem entradas');
  assert.strictEqual(P.card().line, '0 de 2 entradas hoje'); }
out.push('local: 2 entradas, tabela dos 10 andares, "abre com o online", corrida em dois toques (start uma vez), registro reproduzido, prêmio do módulo, sem entradas = motivo');

// 4) ONLINE: arranque, sem conexão honesto, criar, convidar (código e guilda), frases por índice, sair em dois toques
CN.DATA.on = true; CN._reset();
{ g.S = newSave(); calls.length = 0; fail['GET /coop/status'] = { code: 'net_off' }; await open();
  assert.strictEqual(sent(/^GET \/coop\/status/), 1, 'o arranque lê o estado uma vez'); has(g.esc2(C.why('net_off'))); has('data-x="retry"'); has('data-x="start">Entrar com retratos<'); check('sem conexão');
  delete fail['GET /coop/status']; tap('retry'); has('Carregando o grupo online'); check('carregando'); await settle(); def.render();
  assert.strictEqual(CN.state().started, true); has('data-x="create"'); has('Convites recebidos'); has('Bia &lt;b&gt; chamou você'); not('Bia <b>'); has('data-x="join" data-id="p9"'); has(g.esc2(C.why('no_party'))); not('data-x="start"'); check('online sem grupo');
  // criar: recusa do servidor mostra o motivo do módulo
  fail['POST /coop/party'] = { code: 'snapshot_required' }; let n0 = posts(); tap('create'); has('Criando o grupo'); await settle(); assert.strictEqual(posts() - n0, 1); assert.strictEqual(msg(), C.why('snapshot_required')); assert(/class="co-msg f bad"/.test(H())); check('recusa do servidor');
  delete fail['POST /coop/party']; n0 = posts(); tap('create'); tap('create'); await settle(); assert.strictEqual(posts() - n0, 1, 'criar: UMA chamada (o 2º toque espera)'); has('você é o líder'); has('Eu &lt;i&gt;'); not('Eu <i>'); assert.strictEqual(count(/vaga aberta/g), 2); has('id="co_code"'); check('grupo criado');
  // convite por código: formato ruim não sai para a rede; minúsculas viram maiúsculas
  n0 = posts(); ELS.co_code.value = 'ab'; tap('inv'); await settle(); assert.strictEqual(posts(), n0, 'código ruim: nada sai'); assert.strictEqual(msg(), C.why('code'));
  listeners.input({ target: Object.assign(ELS.co_code, { value: 'ab-12 cd!' }) }); assert.strictEqual(ELS.co_code.value, 'AB12CD', 'o campo só aceita A-Z e 0-9');
  tap('inv'); await settle(); assert.strictEqual(posts() - n0, 1); assert(calls.includes('POST /coop/party/invite {"friendCode":"AB12CD"}')); assert.strictEqual(msg(), 'Convite enviado.'); has('>Theo<'); check('convidou por código');
  fail['POST /coop/party/invite'] = { status: 429 }; ELS.co_code.value = 'ZZ99ZZ'; tap('inv'); await settle(); assert.strictEqual(msg(), 'Convites de hoje completos'); delete fail['POST /coop/party/invite'];
  // convite da guilda: lista do espelho da guilda; só o id sai
  g.S.sys.guild = { id: 'g1', name: 'Clã', members: [{ id: 'm1', name: 'Eu', me: true }, { id: 'm2', name: 'Luna <u>' }] }; tap('gopen'); has('Convidar da guilda'); has('Luna &lt;u&gt;'); not('Luna <u>'); assert.strictEqual(count(/data-x="ginv"/g), 1, 'eu não apareço na lista'); check('lista da guilda');
  n0 = posts(); tap('ginv', { id: 'zz' }); await settle(); assert.strictEqual(posts(), n0); assert.strictEqual(msg(), C.why('not_guild'));
  tap('ginv', { id: 'm2' }); await settle(); assert.strictEqual(posts() - n0, 1); assert(calls.includes('POST /coop/party/invite {"guildMemberId":"m2"}')); not('id="co_code"'); check('trio cheio');
  // frases: só o índice; intervalo de 5 s conferido pelo módulo antes da rede
  tap('phr'); const ph = C.view(g.S, host).phrases; assert(ph.length > 3); assert.strictEqual(count(/data-x="say"/g), ph.length); has('Ninguém falou ainda.'); check('frases');
  n0 = posts(); tap('say', { i: '1' }); await settle(); assert.strictEqual(posts() - n0, 1); assert(calls.includes('POST /coop/party/phrase {"idx":1}')); has(g.esc2(ph[1].txt)); has('<b>Você:</b>');
  tap('say', { i: '2' }); await settle(); assert.strictEqual(posts() - n0, 1, 'dentro do intervalo: nada sai'); assert.strictEqual(msg(), 'Aguarde um instante para mandar outra frase');
  tap('say', { i: '999' }); assert.strictEqual(msg(), C.why('bad_idx')); assert(!/"txt"|"text"|"msg"/.test(calls.join('')), 'nenhum texto do jogador sai para a rede'); check('frase enviada'); tap('close'); assert.strictEqual(count(/data-x="say"/g), 3, 'fechada a lista, ficam os 3 balões');
  // sair: dois toques
  n0 = posts(); tap('leaveok'); await settle(); assert.strictEqual(posts(), n0, 'confirmar sem armar não sai'); tap('leave'); assert.strictEqual(posts(), n0); has('data-x="leaveok"'); check('sair armado');
  tap('leaveok'); await settle(); assert.strictEqual(posts() - n0, 1); has('data-x="create"'); check('saiu'); }
out.push('online: sem conexão honesto e Tentar conectar, carregando, criar (recusa com o motivo), convite por código e pela guilda (formato conferido antes), frases só por índice, sair em dois toques');

// 5) ONLINE: aceitar convite (não sou líder), corrida do servidor, prêmio pelo correio
{ host.t += 60000; let n0 = posts(); tap('join', { id: 'p9' }); await settle(); assert.strictEqual(posts() - n0, 1); has('Bia &lt;b&gt;'); not('você é o líder'); has(g.esc2(C.why('not_leader'))); not('id="co_code"');
  has('data-x="start">' + g.esc2(C.why('not_leader')) + '<'); n0 = posts(); tap('start'); tap('startok'); await settle(); assert.strictEqual(posts(), n0, 'quem não é líder não começa'); check('não líder');
  tap('leave'); tap('leaveok'); await settle(); tap('create'); await settle(); has('você é o líder');
  n0 = posts(); const gold0 = host.gold, loot0 = JSON.stringify(g.S.sys.loot || null); tap('start'); assert.strictEqual(posts(), n0, 'o 1º toque não sai para a rede'); has('data-x="startok"');
  tap('startok'); has('Entrando nas ruínas'); tap('startok'); await settle(); assert.strictEqual(sent(/^POST \/coop\/start/), 1, 'POST /coop/start UMA vez');
  assert(P.X.run, 'a corrida do servidor entra em reprodução'); has('Zed'); assert.strictEqual(count(/class="co-pt gh"/g), 2); check('reprodução online'); tap('skip');
  const reached = g.S.sys.coop.lastRun.reached; if (reached > 0) { has('O prêmio chega pelo correio.'); has('data-x="mail"'); not('Prêmio já entregue.'); opened = []; tap('mail'); assert.deepStrictEqual(opened, ['mail']); }
  assert.strictEqual(host.gold, gold0, 'prêmio pelo correio: nada é creditado aqui'); assert.strictEqual(JSON.stringify(g.S.sys.loot || null), loot0); check('resultado online');
  tap('again'); await settle(); def.render(); has('Entradas hoje: 1 de 2');
  // humano sem entrada: o servidor marca paid:false na minha linha
  const s0 = ROUTES['POST /coop/start']; ROUTES['POST /coop/start'] = () => { const r = s0(); r.members[0].paid = false; r.reached = Math.max(1, r.reached); r.floors[0].win = true; return r; };
  try { tap('start'); tap('startok'); await settle(); tap('skip'); has('sem entrada: não ganhou'); has('Você entrou sem entrada'); not('data-x="mail"'); check('sem entrada'); tap('again'); await settle(); } finally { ROUTES['POST /coop/start'] = s0; }
  // recusa do servidor na corrida
  def.render(); SRV.entriesLeft = 1; await CN.refresh(g.S, host); def.render(); fail['POST /coop/start'] = { code: 'not_leader' }; tap('start'); tap('startok'); await settle(); assert.strictEqual(msg(), C.why('not_leader')); assert(!P.X.run); delete fail['POST /coop/start']; check('recusa na corrida');
  // tick: lê o servidor a cada 10 s e redesenha quando muda; fechar a tela ignora a resposta atrasada
  n0 = sent(/^GET \/coop\/status/); def.tick(); assert.strictEqual(sent(/^GET \/coop\/status/), n0, 'antes dos 10 s não lê'); const t0 = Date.now; Date.now = () => t0() + 11000;
  try { SRV.party.members.push({ playerId: 'u8', name: 'Nico', fc: 800, ghost: false, entryOk: true }); def.tick(); await settle(); assert.strictEqual(sent(/^GET \/coop\/status/), n0 + 1); has('>Nico<'); } finally { Date.now = t0; }
  // o servidor desligou (404): o módulo volta ao local e a tela acompanha
  fail['GET /coop/status'] = { status: 404 }; await CN.refresh(g.S, host); def.tick(); has('Entrar com retratos'); has('data-x="retry"'); check('voltou ao local'); delete fail['GET /coop/status']; }
out.push('online: aceitar convite, só o líder começa, POST /coop/start uma vez, prêmio pelo correio sem crédito aqui, humano sem entrada, recusa com o motivo, leitura a cada 10 s, volta ao local com 404');

// 6) larguras, sem fundo, módulo desliga com a tela aberta; todos os botões tocados sem exceção
{ CN._reset(); C.setProvider(null); CN.DATA.on = false; SRV.party = null; SRV.entriesLeft = 2;
  for (const w of [320, 390]) { dims = { H: 560, Wb: w }; g.S = newSave(); await open(); tap('start'); check('largura ' + w); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { await open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  C.DATA.on = false; def.render(); has('ainda não abriram'); check('desligou aberto'); C.DATA.on = true;
  let taps = 0; CN.DATA.on = true;
  for (const prep of [async () => { CN._reset(); C.setProvider(null); CN.DATA.on = false; }, async () => { CN.DATA.on = true; SRV.party = null; }, async () => { CN.DATA.on = true; SRV.party = mkParty('p1', ME, [meRow()]); }]) {
    await prep(); g.S = newSave(); await open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { await prep(); SRV.entriesLeft = 2; g.S = newSave(); await open(); const b = buttons()[i]; if (!b) continue; def.click(b); taps++; await settle(); def.render(); check('toque ' + b.dataset.x);
      for (let k = 0; k < 3; k++) { const b2 = buttons().filter(q => /co-bt b|data-x="(skip|again|close)"/.test(q.tag))[0]; if (!b2) break; def.click(b2); taps++; await settle(); def.render(); check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); } } }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('larguras 320 e 390, sem fundo, desliga com a tela aberta; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { C.DATA.on = false; CN.DATA.on = false; try { CN._reset(); C.setProvider(null); } catch (e) {} }
assert.strictEqual(C.DATA.on, false, 'o teste devolve as chaves desligadas'); assert.strictEqual(CN.DATA.on, false);
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
