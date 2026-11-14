'use strict';
// Teste de fumaça do js/p_minigame.js (MINIJOGO DE EVENTO, timing) em Node: módulo REAL js/sys/minigame.js, ligado só na memória deste teste;
// DOM e relógio de mentira. Rodar: node test/paineis/p_minigame.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
require(path.join(R, 'js/sys/minigame.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, M = Sys.minigame, D = M.DATA;
assert(M && D && Array.isArray(D.games), 'Sys.minigame carregado'); assert.strictEqual(D.on, false, 'o minijogo nasce desligado');

/* ---------- DOM e relógio de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const ELS = {}; for (const id of ['mg_scroll', 'mg_msg']) ELS[id] = mkEl(id);
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };
const realNow = Date.now; let CLK = 1e12; Date.now = () => CLK;

/* ---------- o jogo de mentira ---------- */
const DAY = 864e5, T_BEFORE = Date.UTC(2026, 10, 12, 15), T_OPEN = Date.UTC(2026, 10, 21, 15);
const host = makeHost({ seed: 9, stage: 30, now: T_OPEN }); let LV = 30; host.level = () => LV;
Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 30, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'minigame';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open() { return true; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_minigame.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_minigame.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');
const P = g.PMinigame;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="mg_msg" class="mg-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|moeda|d de ouro|ouro de d|\[VALOR\]/i.test(h), tag + ': preço, compra ou prêmio em ouro');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra\b/i.test(h), tag + ': pressão');
  assert(!/<input|<textarea|contenteditable/i.test(h), tag + ': campo de texto');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const spy = name => { const f0 = M[name]; const s = { n: 0, args: [], restore() { M[name] = f0; } }; M[name] = function () { s.n++; s.args.push([].slice.call(arguments)); return f0.apply(this, arguments); }; return s; };
const mg = () => g.S.sys.minigame;
/* toca quando o marcador está em `pos` (0-1): acerta o relógio pela MESMA conta da tela */
const passMs = () => P.PASS_MS / P.X.run.r.speed;
const hitAt = pos => { CLK = P.X.run.t0 + pos * passMs(); tap('hit'); };
const play = () => { tap('play'); tap('playok'); };

try {
// 0) registro
assert.strictEqual(addName, 'minigame'); assert.strictEqual(g.PANEL_ON.minigame, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.busy);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|grantBundle\s*\(/.test(SRC), 'o arquivo não liga chave nem entrega prêmio');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(!/Math\.random/.test(SRC), 'nada de sorte escondida: a tela não sorteia');
assert(/^function icoOf\(kind\)/m.test(SRC), 'a arte passa por UMA função icoOf'); assert(/const MG_ART_ON=false/.test(SRC), 'reserva atrás de uma constante única');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert(/\.mg-bt,\.xs \.mg-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
for (const m of CSS.matchAll(/\.mg-(bt|tap),\.xs \.mg-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .mg-' + m[1]);
assert(/\.mg-bt\.sm,\.xs \.mg-bt\.sm\{[^}]*min-height:44px/.test(CSS)); assert(/\.mg-tap,\.xs \.mg-tap\{[^}]*min-height:132px/.test(CSS));
assert(/\.mg-root\{--mg-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
for (const m of CSS.matchAll(/grid-template-columns:([^;}]+)/g)) assert(/minmax\(0,1fr\)/.test(m[1]), 'grades com minmax(0,1fr): sem rolagem lateral');
out.push('registro: minigame desligada, ' + def.actions.length + ' ações com tratador, arte de reserva atrás de MG_ART_ON, sem diálogo, sem emoji, sem reticências, sem sorteio na tela');

// 1) MÓDULO DESLIGADO e ausente: aviso e Voltar; nem desenhar nem tocar escreve no save
{ g.PANEL_ON.minigame = true; const before = JSON.stringify(g.S); open(); has('O minijogo de evento ainda não abriu.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  for (const a of def.actions) if (a !== 'back') tap(a, { d: '3' }); def.tick(); def.onClose();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: desenhar, tocar e fechar não escrevem no save'); assert(!g.S.sys.minigame); assert.strictEqual(saves, 0); assert.strictEqual(P.alerts(), 0);
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.minigame; Sys.minigame = null; try { open(); has('Minijogo indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); tap('play'); def.tick(); } finally { Sys.minigame = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; desenhar e tocar não escrevem no save');

M.setOn(true);
// 2) TRANCADO POR NÍVEL (o nível de Eventos do jogo) e ANTES DO 1º CICLO (texto do módulo + a data)
{ LV = 10; g.S = newSave(); const before = JSON.stringify(g.S); open(); has('O minijogo abre no nível 24'); assert.strictEqual(check('nível'), 1); const sp = spy('start');
  try { play(); assert.strictEqual(sp.n, 0, 'trancado: nada é chamado'); } finally { sp.restore(); } assert.strictEqual(JSON.stringify(g.S), before, 'trancado: save intacto'); assert.strictEqual(P.alerts(), 0);
  g.FB_UNLOCK = { events: 26 }; open(); has('abre no nível 26'); delete g.FB_UNLOCK; LV = 30;
  host.t = T_BEFORE; open(); has(g.esc2(M.why('soon')) + ': dia 20/11.'); assert.strictEqual(check('em breve'), 1); host.t = T_OPEN; }
out.push('nível abaixo do de Eventos: só o Voltar; antes do 1º ciclo: "' + M.why('soon') + ': dia 20/11"');

// 3) ABERTO: tema, tentativas, faixas e marcos do módulo; Jogar em dois toques; cada toque = posição do marcador → nota do módulo; finish UMA vez
{ g.S = newSave(); saves = 0; open(); const v = M.view(g.S, host);
  has(g.esc2(v.game.name)); has(g.esc2(v.game.txt)); has('<small>Tentativas</small><b>3/3</b>'); has('<small>Melhor de hoje</small><b>0</b>'); has('Você ainda não jogou hoje.');
  assert.strictEqual(count(/class="mg-ch z"/g), v.tiers.length, 'um baú por faixa do módulo, fechados'); for (const t of v.tiers) { has('<b>' + t.name + '</b>'); has(t.min + ' pontos'); }
  has('8 pedras de forja'); has('30 rações de pet'); has('1 essência'); assert.strictEqual(count(/class="mg-tr"/g), v.milestones.length); has('faltam 3 dias'); has('Nada à venda.'); has('data-x="claim">' + g.esc2(M.why('tier')) + '<'); check('aberto');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)'); has('id="mg_hero"'); assert.strictEqual(P.alerts(), M.badge(g.S, host));
  tap('claim'); assert.strictEqual(msg(), M.why('tier')); tap('claimok'); assert.strictEqual(msg(), 'Toque primeiro no botão dourado.'); assert(!mg().day.claimed);
  const st = spy('start'), fi = spy('finish'), gr = spy('grade');
  try { tap('playok'); assert.strictEqual(st.n, 0, 'confirmar sem armar não chama o módulo'); tap('play'); assert.strictEqual(st.n, 0, 'o 1º toque não chama o módulo'); assert.strictEqual(mg().day.tries, 0);
    has('data-x="playok">Confirmar: gastar 1 tentativa<'); has('Gasta 1 das suas tentativas de hoje.'); not('data-x="play"'); check('armado');
    tap('playok'); assert.strictEqual(st.n, 1, 'Sys.minigame.start chamado UMA vez'); assert.strictEqual(mg().day.tries, 1); assert(saves >= 1, 'a tela grava a tentativa gasta'); assert.strictEqual(def.busy(), true);
    const run = P.X.run, cs = run.r.centers; assert.strictEqual(cs.length, 10); has('data-x="hit"'); has('>Toque!<'); has('<small>Toques</small><b>0/10</b>'); has('<small>Acertos</small><b>0</b>'); has('id="mg_mk"'); has('id="mg_fill"'); not('data-x="claim"'); check('partida');
    // a faixa desenhada é a do módulo (centro e largura)
    has('left:' + ((cs[0] - run.r.zone / 2) * 100).toFixed(2) + '%;width:' + (run.r.zone * 100).toFixed(2) + '%');
    // toque na pausa do começo não conta
    CLK = run.t0 - 10; tap('hit'); assert.strictEqual(run.pos.length, 0, 'na pausa nada conta'); assert.strictEqual(gr.n, 0);
    // a posição que pontua é a do marcador no instante do toque (posAt), nada além disso
    CLK = run.t0 + cs[0] * passMs(); const p0 = P.posAt(CLK); assert(Math.abs(p0 - cs[0]) < 1e-5); tap('hit'); assert.strictEqual(gr.n, 1); assert.strictEqual(gr.args[0][0], p0, 'a nota recebe a posição do marcador'); assert.strictEqual(gr.args[0][1], cs[0]); assert.strictEqual(gr.args[0][2], run.r.zone);
    has('PERFEITO +100'); has('<b>1/10</b>'); has('<small>Acertos</small><b>1</b>'); assert.strictEqual(count(/<i class="perfect"><\/i>/g), 1); check('1 toque');
    // ida e volta: depois de uma passada inteira o marcador volta (1,5 passada = meio da barra)
    assert(Math.abs(P.posAt(P.X.run.t0 + 1.5 * passMs()) - 0.5) < 1e-5, 'o marcador vai e volta');
    hitAt(0); has('ERROU +0'); has('<small>Acertos</small><b>1</b>'); assert.strictEqual(count(/<i class="miss"><\/i>/g), 1);
    for (let i = 2; i < 10; i++) { assert.strictEqual(fi.n, 0); hitAt(cs[i]); }
    assert.strictEqual(fi.n, 1, 'Sys.minigame.finish chamado UMA vez'); assert.strictEqual(fi.args[0][2].length, 10); assert.strictEqual(def.busy(), false); assert(!P.X.run);
  } finally { st.restore(); fi.restore(); gr.restore(); }
  assert.strictEqual(mg().day.best, 900); assert.strictEqual(mg().day.tier, 'ouro'); has('900 pontos · Ouro'); has('Novo melhor resultado de hoje.'); has('<small>Tentativas</small><b>2/3</b>'); has('<small>Melhor de hoje</small><b>900</b>');
  assert.strictEqual(count(/class="mg-ch on"/g), 3, 'os três baús abrem com Ouro'); has('Sua faixa'); has('data-x="play">Jogar de novo<'); has('data-x="claim">Resgatar o prêmio do dia<'); check('resultado'); }
out.push('aberto: tema, tentativas, 3 faixas e marcos do módulo; Jogar em dois toques (start uma vez); a nota de cada toque é a do módulo para a posição do marcador; finish uma vez; 900 pontos = Ouro');

// 4) SAIR DA PARTIDA em dois toques: o que faltou conta como erro; a tentativa não volta
{ const fi = spy('finish'); play(); const cs = P.X.run.r.centers; hitAt(cs[0]); hitAt(cs[1]);
  try { tap('quitok'); assert.strictEqual(fi.n, 0, 'confirmar sem armar não encerra'); tap('quit'); assert.strictEqual(fi.n, 0); has('data-x="quitok"'); check('sair armado');
    hitAt(cs[2]); has('data-x="quit"'); not('data-x="quitok"'); tap('quit'); tap('quitok'); assert.strictEqual(fi.n, 1, 'finish UMA vez ao sair'); assert.strictEqual(fi.args[0][2].length, 3); } finally { fi.restore(); }
  has('300 pontos · Bronze'); not('Novo melhor resultado'); assert.strictEqual(mg().day.best, 900, 'a melhor do dia fica'); has('<b>1/3</b>'); check('saiu'); }
// 5) PRÊMIO DO DIA em dois toques: claimDay UMA vez; depois "Já resgatado"
{ const sp = spy('claimDay'); saves = 0;
  try { tap('claim'); assert.strictEqual(sp.n, 0, 'o 1º toque não resgata'); has('Resgatar encerra o prêmio de hoje.'); has('data-x="claimok">Confirmar: resgatar Ouro<'); check('resgate armado');
    tap('play'); has('data-x="claim">Resgatar o prêmio do dia<'); tap('claimok'); assert.strictEqual(sp.n, 0, 'outro toque desarma'); tap('claim'); tap('claimok'); assert.strictEqual(sp.n, 1, 'claimDay chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(mg().day.claimed, true); assert(saves >= 1); assert.strictEqual(msg(), 'Prêmio de Ouro recebido: 8 pedras de forja, 30 rações de pet, 1 essência.'); has('Prêmio de hoje resgatado.'); has('<em>Resgatado</em>'); not('data-x="claim"'); check('resgatado');
  tap('claim'); assert.strictEqual(msg(), M.why('claimed')); assert(/class="mg-msg bad"/.test(H())); }
// 6) SEM TENTATIVAS: o botão diz o motivo do módulo; tocar não chama nada
{ play(); const fi = spy('finish'); try { def.onClose(); assert.strictEqual(fi.n, 1, 'fechar a tela no meio encerra a partida UMA vez'); } finally { fi.restore(); } open();
  has('<b>0/3</b>'); has('data-x="play">' + g.esc2(M.why('tries')) + '<'); const st = spy('start'), before = JSON.stringify(g.S);
  try { tap('play'); assert.strictEqual(msg(), M.why('tries')); tap('playok'); assert.strictEqual(st.n, 0); } finally { st.restore(); } assert.strictEqual(JSON.stringify(g.S), before, 'recusa: save intacto'); check('sem tentativas'); }
out.push('sair da partida e resgatar o prêmio do dia em dois toques (finish e claimDay uma vez); fechar a tela no meio encerra a partida; sem tentativas = motivo do módulo');

// 7) MARCOS: resgata quando o módulo diz que alcançou; UMA chamada; depois "Resgatado"; dia novo devolve as tentativas (tick redesenha)
{ mg().cyc.days = ['2026-11-21', '2026-11-22', '2026-11-23']; def.render(); has('data-x="mile" data-d="3"'); has('faltam 4 dias'); const sp = spy('claimMilestone');
  try { tap('mile', { d: '3' }); assert.strictEqual(sp.n, 1); assert.strictEqual(msg(), 'Marco de 3 dias recebido: 2 essências.'); not('data-x="mile"'); tap('mile', { d: '3' }); assert.strictEqual(msg(), M.why('claimed')); tap('mile', { d: '7' }); assert.strictEqual(msg(), M.why('days')); assert.strictEqual(sp.n, 3); } finally { sp.restore(); } check('marcos');
  const h0 = H(); CLK += 5000; def.tick(); host.t += DAY; def.tick(); assert.notStrictEqual(H(), h0, 'dia novo: a tela redesenha'); has('<b>3/3</b>'); has('Você ainda não jogou hoje.'); check('dia novo'); }
// 8) TEXTO ESCAPADO, recusa do módulo no começo, larguras, sem fundo, desliga com a tela aberta; todos os botões
{ const g0 = D.games[0], n0_ = g0.name, t0 = g0.txt; g0.name = '<b>"Forja" & cia</b>'; g0.txt = '<img src=x onerror=1>';
  try { open(); has('&lt;b&gt;&quot;Forja&quot; &amp; cia&lt;/b&gt;'); not('<b>"Forja"'); has('&lt;img src=x onerror=1&gt;'); not('<img src=x'); check('escapado'); } finally { g0.name = n0_; g0.txt = t0; }
  const s0 = M.start; M.start = () => ({ ok: false, reason: 'tries' }); try { open(); play(); assert.strictEqual(msg(), M.why('tries')); assert(!P.X.run); } finally { M.start = s0; }
  for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); check('largura ' + w); play(); check('partida em ' + w); def.onClose(); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#120c28'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  D.on = false; def.render(); has('ainda não abriu'); check('desligou aberto'); D.on = true;
  let taps = 0; const mk = [() => newSave(), () => { const s = newSave(); s.sys.minigame = { v: 1, day: { k: M.dayKey(host.now()), tries: 1, best: 600, tier: 'prata', claimed: false }, cyc: { id: 0, days: ['a', 'b', 'c'], got: [] }, run: null }; return s; }];
  for (const f of mk) { g.S = f(); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = f(); open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x);
      for (let k = 0; k < 4; k++) { const b2 = buttons().filter(q => /mg-bt b|data-x="(hit|quit)"/.test(q.tag))[0]; if (!b2) break; CLK += 2000; def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); } def.onClose(); } }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('marcos (claimMilestone uma vez), dia novo, texto escapado, larguras 320 e 390, sem fundo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { D.on = false; Date.now = realNow; }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
setTimeout(() => process.exit(0), 50);
