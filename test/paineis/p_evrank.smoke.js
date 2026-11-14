'use strict';
// Teste de fumaça do js/p_evrank.js (RANKING DE EVENTO) em Node: Sys.events e Sys.eventRank REAIS, ligados só na memória deste teste;
// a rede (Sys.net._call e Sys.net.events) é de mentira. Rodar: node test/paineis/p_evrank.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['events', 'eventrank'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, ER = Sys.eventRank, EV = Sys.events, D = ER.DATA;
assert(ER && EV && D, 'módulos carregados'); assert.strictEqual(D.on, false, 'o ranking de evento nasce desligado');
const LOCAL_EVENTS = EV.DATA.events.slice();
const resetCal = () => { EV.DATA.events = LOCAL_EVENTS.slice(); EV.DATA.calendar = false; };

/* ---------- DOM de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const ELS = {}; for (const id of ['er_scroll', 'er_msg']) ELS[id] = mkEl(id);
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };

/* ---------- o jogo de mentira ---------- */
const DAY = 864e5, T_ON = new Date(2026, 10, 22, 12).getTime(), T_GAP = new Date(2026, 11, 8, 12).getTime();
const host = makeHost({ seed: 4, stage: 30, now: T_ON }); let LV = 30; host.level = () => LV;
Sys.host = host; Sys.evtrail = { earned: () => 42 };
const newSave = () => ({ sys: {}, hero: 'kael', stage: 30, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'evrank';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0, opened = []; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open(n) { opened.push(n); return true; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

/* ---------- servidor de mentira ---------- */
const iso = (y, m, d) => new Date(Date.UTC(y, m - 1, d, 3)).toISOString();   // meia-noite de Brasília
const ED1 = 'festival_eras_261120', ED2 = 'festival_eras_261218';
const CAL = [{ id: ED1, start: iso(2026, 11, 20), end: iso(2026, 12, 4), graceEnd: iso(2026, 12, 6) }, { id: ED2, start: iso(2026, 12, 18), end: iso(2026, 12, 31), graceEnd: iso(2027, 1, 2) }];
const calls = []; let rankFail = null, calFail = null, netOn = true;
const RANK = id => ({ event: id, points: 880, rank: 37, total: 5120, final: false, closesAt: 0, top: [{ rank: 1, name: 'Bia <b>', points: 4000, frame: null }, { rank: 2, name: 'Theo & cia', points: 3900 }, { rank: 3, name: 'Luna', points: 3800 }, { rank: 4, name: 'Nico', points: 3000 }] });
let rankOf = RANK;
const NET = { events() { calls.push('GET /events'); return calFail ? Promise.reject(calFail) : Promise.resolve(CAL); },
  _call(m, p) { calls.push(m + ' ' + p); const x = /^\/events\/([a-z0-9_]+)\/rank$/.exec(p); if (!x) return Promise.reject({ status: 404 }); return rankFail ? Promise.reject(rankFail) : Promise.resolve(rankOf(x[1])); } };
Object.defineProperty(Sys, 'net', { get: () => (netOn ? NET : undefined), configurable: true });

const SRC = fs.readFileSync(path.join(R, 'js/p_evrank.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_evrank.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');
const P = g.PEvRank;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="er_msg" class="er-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra\b/i.test(h), tag + ': pressão');
  assert(!/<input|<textarea|contenteditable/i.test(h), tag + ': campo de texto');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async o => { def.onOpen(o || {}); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;

(async () => {
try {
// 0) registro
assert.strictEqual(addName, 'evrank'); assert.strictEqual(g.PANEL_ON.evrank, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|grantVisual\s*\(|applyRank\s*\(/.test(SRC), 'o arquivo não liga chave, não entrega prêmio e não escreve ranking');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(/^function icoOf\(kind\)/m.test(SRC), 'a arte passa por UMA função icoOf'); assert(/const ER_ART_ON=false/.test(SRC), 'reserva atrás de uma constante única');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert(/\.er-bt,\.xs \.er-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
for (const m of CSS.matchAll(/\.er-(bt),\.xs \.er-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px');
assert(/\.er-root\{--er-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
out.push('registro: evrank desligada, ' + def.actions.length + ' ações com tratador, arte de reserva atrás de ER_ART_ON, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e ausente: aviso e Voltar; nada no save, nada na rede
{ g.PANEL_ON.evrank = true; const before = JSON.stringify(g.S); await open(); has('O ranking de evento ainda não abriu.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1);
  for (const a of def.actions) if (a !== 'back') tap(a); def.tick(); await settle();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: desenhar e tocar não escrevem no save'); assert(!g.S.sys.eventrank); assert.strictEqual(calls.length, 0, 'desligado: nenhuma chamada'); assert.strictEqual(EV.DATA.calendar, false);
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.eventRank; Sys.eventRank = null; try { await open(); has('Ranking de evento indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); tap('reload'); } finally { Sys.eventRank = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; nada no save e nada na rede');

ER.setOn(true);
// 2) TRANCADO POR NÍVEL (o nível de Eventos do jogo)
{ LV = 10; const before = JSON.stringify(g.S); await open(); has('abre no nível 24'); assert.strictEqual(check('nível'), 1); tap('reload'); await settle(); assert.strictEqual(calls.length, 0, 'trancado: nenhuma chamada'); assert.strictEqual(JSON.stringify(g.S), before); LV = 30; }
out.push('nível abaixo do de Eventos: só o Voltar, nenhuma chamada');

// 3) SEM REDE e RANKING DESLIGADO NO SERVIDOR: "Seus pontos" honesto, com o motivo; Tentar de novo = UMA chamada
{ netOn = false; g.S = newSave(); await open(); has('Festival das Eras'); has('<b>42</b><span>Seus pontos</span>'); has('Sem conexão. Por enquanto a tela mostra só os seus pontos nesta edição.'); has('data-x="reload">Tentar de novo<'); not('Os primeiros');
  assert.strictEqual(count(/class="er-bd/g), 4, 'as 4 faixas do módulo'); has('Top 1%'); has('Participação'); has('Só visual: não dá poder.'); has('Nenhum selo ainda.'); check('sem rede');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)');
  netOn = true; calFail = { code: 'offline' }; rankFail = { status: 404, code: 'not_found' }; calls.length = 0; await open();
  assert.strictEqual(sent(/^GET \/events$/), 1, 'pede o calendário uma vez'); assert.strictEqual(sent(/\/rank$/), 1, 'pede o ranking uma vez'); has('O ranking abre em breve. Por enquanto'); check('404 not_found');
  tap('reload'); has('Carregando o ranking'); not('data-x="reload"'); check('carregando'); tap('reload'); await settle(); assert.strictEqual(sent(/\/rank$/), 2, 'Tentar de novo: UMA chamada'); assert.strictEqual(msg(), 'O ranking abre em breve'); assert(/class="er-msg bad"/.test(H()));
  rankFail = { code: 'boom' }; tap('reload'); await settle(); assert.strictEqual(msg(), 'Não deu agora'); calFail = null; rankFail = null; }
out.push('sem rede: "Seus pontos" e "Sem conexão"; 404 not_found: "O ranking abre em breve"; carregando; Tentar de novo chama uma vez');

// 4) ONLINE: a EDIÇÃO do calendário (id próprio), nome com a data do módulo, minha posição, os primeiros, faixas; nomes escapados
{ g.S = newSave(); calls.length = 0; saves = 0; await open(); assert.strictEqual(EV.DATA.calendar, true, 'o calendário do servidor foi aplicado'); assert(calls.includes('GET /events/' + ED1 + '/rank'), 'o ranking pedido é o da EDIÇÃO'); assert.strictEqual(sent(/\/rank$/), 1);
  const v = ER.view(g.S, host, ED1); assert.strictEqual(v.name, EV.nameOf(ED1)); has(g.esc2(EV.nameOf(ED1))); has('20/11/2026'); has('<b>37º</b>'); has('de 5.120 · Top 1%'); has('880 pontos'); assert(saves >= 1, 'a tela grava o espelho');
  assert.strictEqual(count(/class="er-rk"/g), 4); has('Bia &lt;b&gt;'); not('Bia <b>'); has('Theo &amp; cia'); has('4º'); has('>4.000<'); assert.strictEqual(count(/class="er-bd cur"/g), 1); has('Sua faixa'); has('--er-tint:#ffc94a'); not('data-x="mail"'); check('online');
  tap('reload'); await settle(); assert.strictEqual(sent(/\/rank$/), 2, 'Atualizar: UMA chamada'); assert.strictEqual(msg(), 'Ranking atualizado.');
  // edição encerrada com faixa: o prêmio chega pelo correio (a tela não entrega nada)
  rankOf = id => Object.assign(RANK(id), { final: true }); const own0 = JSON.stringify(g.S.sys.eventrank.owned); tap('reload'); await settle(); has('resultado final'); has('O seu prêmio chega pelo correio.'); has('data-x="mail"'); opened = []; tap('mail'); assert.deepStrictEqual(opened, ['mail']);
  assert.strictEqual(JSON.stringify(g.S.sys.eventrank.owned), own0, 'a tela não entrega prêmio'); check('final'); rankOf = RANK;
  // selos do módulo
  ER.grantVisual(g.S, host, { badge: 'evt_part' }); def.tick(); has(g.esc2(D.partBadge.name)); not('Nenhum selo ainda.'); check('selos');
  // abrir numa edição pedida por quem chama (aba de Eventos)
  calls.length = 0; await open({ ev: ED1 }); assert(calls.includes('GET /events/' + ED1 + '/rank')); }
out.push('online: ranking da edição ' + ED1 + ' ("' + EV.nameOf(ED1) + '"), posição, os primeiros com nomes escapados, 4 faixas, Atualizar uma vez, final = correio, selos do módulo');

// 5) SEM EDIÇÃO ATIVA: "Próximo evento em <data>" pelo calendário; 404 {code:'event'} = sem evento (nunca erro)
{ host.t = T_GAP; g.S = newSave(); calls.length = 0; await open(); has('Nenhum evento aberto agora.'); has('Próximo evento em 18/12/2026'); has('Festival das Eras'); assert.strictEqual(sent(/\/rank$/), 0, 'sem edição ativa: nenhum pedido de ranking'); assert.strictEqual(check('sem evento'), 0); not('role="alert"');
  assert.strictEqual(P.dateOf(P.calendar().next), '18/12/2026');
  host.t = T_ON; rankFail = { status: 404, code: 'event' }; await open(); has('Nenhum evento aberto agora.'); has('Próximo evento em 18/12/2026'); not('Não deu agora'); check('404 event'); rankFail = null;
  host.t = new Date(2027, 2, 1).getTime(); await open(); has('O próximo evento ainda não tem data.'); check('sem data'); host.t = T_ON;
  // sem rede e sem calendário desta sessão: vale o calendário guardado no save
  resetCal(); g.S = newSave(); await open(); const kept = g.S.sys.evcal; assert(Array.isArray(kept) && kept.length === 2, 'o Sys.events.load guardou o calendário no save'); resetCal(); netOn = false; host.t = T_GAP; g.S = newSave(); g.S.sys.evcal = kept; await open(); has('Próximo evento em 18/12/2026'); netOn = true; host.t = T_ON; }
out.push('sem edição ativa ou 404 event: "Próximo evento em 18/12/2026" pelo calendário (também o guardado no save); sem data = aviso honesto');

// 6) larguras, sem fundo, desliga com a tela aberta, resposta atrasada depois de fechar; todos os botões
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; g.S = newSave(); await open(); check('largura ' + w); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { await open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  D.on = false; def.render(); has('ainda não abriu'); check('desligou aberto'); D.on = true;
  def.onOpen({}); def.onClose(); const h0 = H(); await settle(); assert.strictEqual(H(), h0, 'fechou: a resposta atrasada não redesenha');
  let taps = 0; rankOf = id => Object.assign(RANK(id), { final: true });
  for (const prep of [() => { rankFail = { code: 'offline' }; }, () => { rankFail = null; }]) { prep(); g.S = newSave(); await open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = newSave(); await open(); const b = buttons()[i]; def.click(b); taps++; await settle(); def.render(); check('toque ' + b.dataset.x); } }
  rankFail = null; rankOf = RANK; seenActs.add('back');
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('larguras 320 e 390, sem fundo, desliga aberta, resposta atrasada ignorada; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { D.on = false; resetCal(); }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
