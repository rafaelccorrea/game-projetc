'use strict';
// Teste de fumaça do js/p_today.js (lista HOJE + PEGAR TUDO) em Node.
// Módulos REAIS js/sys/today.js, js/sys/dig.js e js/sys/relics.js, ligados só na memória deste teste; as fontes de resgate (correio, conquistas,
// baús de abate) são de mentira, no formato que o Sys.today lê. DOM de mentira. Rodar: node test/paineis/p_today.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['relics', 'dig', 'today'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, TD = Sys.today, D = TD.DATA;
assert(TD && D && typeof TD.claimAll === 'function', 'Sys.today carregado');
assert.strictEqual(D.on, false, 'a lista Hoje nasce desligada no jogo');

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { td_scroll: mkEl('td_scroll'), td_msg: mkEl('td_msg') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira (só o que a tela chama) ---------- */
const host = makeHost({ seed: 3, stage: 12, eraMax: 2 }); Sys.host = host;
let bag = false; host.bagFull = () => bag; const went = []; host.goTab = t => { went.push(t); if (t === 'dig' || t === 'battle') g.view = t; };
const newSave = () => ({ sys: {}, hero: 'kael', stage: 12, gold: 100, gems: 5, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'today';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
const opened = []; let panelOpens = { mail: true, relics: true };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n, o) { opened.push(n + '@' + (o && o.from)); return !!panelOpens[n]; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

/* fontes de resgate de mentira (o Sys.today lê assim: js/sys/today.js, SOURCES) */
const F = { mail: 0, ach: 0, chest: 0, calls: { mail: 0, ach: 0, chest: 0 } };
Sys.mail = { DATA: { enabled: true }, inbox: () => Array.from({ length: F.mail }, () => ({ hasAtt: true, claimed: false })), claimAll: (S) => { F.calls.mail++; const n = F.mail; F.mail = 0; S.gold += 40 * n; return { n }; } };
Sys.achievements = { status: () => ({ on: true, ready: F.ach }), claimAll: (S) => { F.calls.ach++; const n = F.ach; F.ach = 0; S.gems += n; return Array.from({ length: n }, () => ({ ok: true })); } };
Sys.chest = { progress: () => ({ stored: F.chest }), open: () => { if (F.chest <= 0) return null; F.calls.chest++; F.chest--; return { ok: true }; } };

const SRC = fs.readFileSync(path.join(R, 'js/p_today.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_today.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const count = re => (H().match(re) || []).length;
const msg = () => (/<div id="td_msg" class="td-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };

try {
// 0) registro
assert.strictEqual(addName, 'today'); assert.strictEqual(g.PANEL_ON.today, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|\.grant\s*\(/.test(SRC), 'o arquivo não liga chave nem entrega prêmio por conta própria');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert.strictEqual((SRC.match(/tM\(\)\.claimAll\(/g) || []).length, 1, 'o arquivo chama claimAll num lugar só');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert(/\.td-bt,\.xs \.td-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
for (const m of CSS.matchAll(/\.td-(row|bt),\.xs \.td-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .td-' + m[1]);
assert(/\.td-root\{--td-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
for (const s of TD.SOURCES) assert(/^<span class="td-i"><(svg|img) /.test(def.iconOf(s.icon)), 'ícone para ' + s.icon);
// arte por tipo de linha: toda linha do módulo tem imagem em disco, com o desenho por código junto (reserva se a imagem falhar); tipo desconhecido = só o desenho
for (const s of TD.SOURCES) { const m = /^<span class="td-i"><img src="(assets\/[^"]+\.png)" alt=""[^>]* onerror="[^"]*td-e[^"]*"><svg class="fb" .+<\/svg><\/span>$/.exec(def.iconOf(s.icon)); assert(m, 'imagem com reserva para ' + s.icon); assert(fs.existsSync(path.join(R, m[1])), 'imagem existe: ' + m[1]); }
assert(/^<span class="td-i"><svg viewBox/.test(def.iconOf('tipo-novo')), 'tipo desconhecido: desenho por código');
assert(/\.td-i svg\.fb\{display:none\}/.test(CSS) && /\.td-i\.td-e img\{display:none\}/.test(CSS) && /\.td-i\.td-e svg\.fb\{display:block\}/.test(CSS), 'a reserva troca de lugar com a imagem que falha');
assert(def.iconOf('activity').includes('assets/icons/today/activity.png') && def.iconOf('dig').includes('assets/icons/dig/pickaxe.png') && def.iconOf('relic').includes('assets/icons/dig/fragment.png'));
out.push('registro: today desligada, ' + def.actions.length + ' ações com tratador, ícone para as ' + TD.SOURCES.length + ' linhas do módulo, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e módulo ausente: aviso e Voltar; nenhum toque escreve no save nem chama resgate
{ F.mail = 2; open(); has('A lista Hoje ainda não abriu.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  const before = JSON.stringify(g.S); tap('all'); tap('go', { id: 'mail' }); def.tick();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: nenhum toque escreve no save'); assert.strictEqual(F.calls.mail, 0, 'desligado: nenhum resgate'); assert.strictEqual(opened.length, 0);
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.today; Sys.today = null; try { open(); has('Lista Hoje indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); tap('all'); def.tick(); } finally { Sys.today = m0; } F.mail = 0; }
out.push('desligado ou sem módulo: aviso com Voltar; nenhum toque escreve no save');

TD.setOn(true);
// 2) VAZIO HONESTO: nada para fazer; Pegar tudo apagado e o toque explica
{ g.S = newSave(); open(); has('Nada para fazer agora'); has('Tudo em dia'); has('aria-disabled="true">Pegar tudo (0)'); assert.strictEqual(count(/data-x="go"/g), 0); check('vazio');
  const before = JSON.stringify(g.S); tap('all'); assert.strictEqual(msg(), TD.why('empty')); assert(msg()); assert.strictEqual(JSON.stringify(g.S), before); check('vazio recusa');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)'); }
out.push('vazio honesto: texto de estado vazio, Pegar tudo (0) apagado e com motivo ao tocar');

// 3) LISTA DO MÓDULO: linhas claim (selo dourado) e go (seta), na ordem do módulo, com os números do módulo
{ g.S = newSave(); F.mail = 2; F.ach = 3; F.chest = 4; Sys.dig.setOn(true); Sys.relics.setOn(true);
  Sys.relics.grant(g.S, host, 'eraLord', { era: 0 }); Sys.relics.addFragments(g.S, 0, 5, 'dig');
  const v = TD.view(g.S, host); assert.deepStrictEqual(v.items.map(i => i.id), ['mail', 'achievements', 'chest', 'dig', 'relics']); open();
  assert.strictEqual(count(/data-x="go"/g), v.items.length, 'uma linha por item do módulo'); for (const it of v.items) { has('<b>' + g.esc2(it.label) + '</b>'); has('data-id="' + it.id + '"'); }
  assert.strictEqual(count(/class="td-seal"/g), 3, 'selo dourado só nas linhas de resgate'); assert.strictEqual(count(/class="td-ch"/g), 2, 'seta nas linhas de aviso');
  has('<span class="td-seal">2</span>'); has('<span class="td-seal">3</span>'); has('<span class="td-seal">4</span>'); has('<span class="td-num">' + Sys.dig.picks(g.S, host) + '</span>');
  has('5 coisas para fazer agora'); has('>Pegar tudo (' + v.claimable + ')'); has('aria-disabled="false"'); assert.strictEqual(count(/class="td-ok"/g), 3, 'visto verde nas linhas que entram no Pegar tudo'); assert.strictEqual(count(/class="td-go">Ir</g), 2, '"Ir" nas linhas que abrem outra tela');
  { const h = H(); assert(h.indexOf('class="td-st"') < h.indexOf('class="td-rib"') && h.indexOf('class="td-rib"') < h.indexOf('id="td_scroll"') && h.indexOf('id="td_scroll"') < h.indexOf('data-x="all"'), 'ordem do mock: palco, faixa Hoje, linhas, Pegar tudo'); assert(h.lastIndexOf('class="td-ok"') < h.indexOf('class="td-go"'), 'primeiro as de pegar, depois as de ir'); }
  assert(H().indexOf('data-id="mail"') < H().indexOf('data-id="chest"') && H().indexOf('data-id="chest"') < H().indexOf('data-id="dig"'), 'ordem do módulo');
  assert(gated.includes('assets/icons/menu/mail.png') && gated.includes('assets/ui/chest.png'), 'pede a carga dos ícones'); for (const u of gated) assert(fs.existsSync(path.join(R, u)), 'imagem pedida existe: ' + u); check('lista'); }
out.push('lista: uma linha por item do view, na ordem do módulo, selo nas de resgate e seta nas de aviso');

// 4) TOCAR NUMA LINHA abre a tela dela: painel (com a volta para cá), senão host.goTab; se nada abre, o motivo
{ opened.length = 0; went.length = 0; tap('go', { id: 'mail' }); assert.deepStrictEqual(opened, ['mail@today']); assert.strictEqual(went.length, 0, 'painel abriu: não chama goTab');
  tap('go', { id: 'dig' }); assert.deepStrictEqual(went, ['dig'], 'sem painel: host.goTab(tab)'); g.view = 'today';
  // tab 'battle' (baús de abate moram na batalha): a rota do jogo volta para a batalha; sem ela, o Voltar do jogo
  const chestTab = TD.SOURCES.find(s => s.id === 'chest').tab, achTab = TD.SOURCES.find(s => s.id === 'achievements').tab; 
  went.length = 0; tap('go', { id: 'chest' }); assert.deepStrictEqual(went, [chestTab]); if (chestTab === 'battle') { assert.strictEqual(g.view, 'battle'); g.view = 'today'; const gt = host.goTab; delete host.goTab; closed = 0; try { tap('go', { id: 'chest' }); assert.strictEqual(closed, 1, 'sem goTab: fecha pela rota do jogo'); } finally { host.goTab = gt; } }
  // destino que não abre (nem painel nem rota): o motivo em texto
  went.length = 0; def.render(); tap('go', { id: 'achievements' }); assert.deepStrictEqual(went, [achTab]); assert.strictEqual(msg(), 'Esta tela ainda não abre por aqui. Procure por ela no Menu.'); assert(/class="td-msg bad"/.test(H())); check('não abriu');
  const n0_ = opened.length; tap('go', { id: 'nada' }); assert.strictEqual(opened.length, n0_, 'linha que não existe é ignorada');
  assert.deepStrictEqual(F.calls, { mail: 0, ach: 0, chest: 0 }, 'abrir linha não resgata nada'); }
out.push('toque na linha: Panels.open(tab, {from:today}) ou host.goTab(tab); sem destino, mostra o motivo');

// 5) MOCHILA CHEIA: baús de abate ficam bloqueados, fora do lote, com o botão próprio
{ bag = true; def.render(); has(TD.why('bag') + ': abra espaço para pegar<'); has('>Pegar tudo (2)'); assert.strictEqual(count(/class="td-seal"/g), 2); check('mochila');
  let calls = 0; const c0 = TD.claimAll; TD.claimAll = function () { calls++; return c0.apply(this, arguments); }; saves = 0;
  try { tap('all'); } finally { TD.claimAll = c0; }
  assert.strictEqual(calls, 1, 'Pegar tudo chama claimAll UMA vez'); assert.deepStrictEqual(F.calls, { mail: 1, ach: 1, chest: 0 }, 'baú bloqueado não entra no lote'); assert(host.changes >= 1 && saves === 0, 'o módulo avisa o jogo (host.onChange grava); a tela não grava em dobro');
  has('Pegou 5 prêmios'); has('<li>Correio com prêmio: 2</li>'); has('<li>Conquistas: 3</li>'); has('<li>Ouro: +80</li>'); has('<li>Diamantes: +3</li>'); not('<li>Baús de abate');
  has('data-id="chest"'); has('Mochila cheia'); not('data-id="mail"'); not('data-id="achievements"'); has('>Pegar tudo (0)'); has('data-id="dig"'); check('depois de pegar');
  tap('all'); assert.strictEqual(msg(), TD.why('bag') + ': abra espaço para pegar Baús de abate'); assert.strictEqual(F.calls.chest, 0); not('Pegou 5'); check('recusa mochila');
  bag = false; def.render(); has('>Pegar tudo (1)'); tap('all'); assert.strictEqual(F.calls.chest, 4); has('Pegou 4 prêmios'); has('<li>Baús de abate: 4</li>'); not('<li>Ouro'); assert.strictEqual(count(/class="td-ok"/g), 0, 'nada mais para pegar'); has('class="td-go">Ir<'); check('baús'); }
out.push('Pegar tudo: claimAll uma vez, resumo por linha com ouro e diamantes que entraram; mochila cheia fica fora do lote e explica');

// 6) "Pegar tudo" nunca gasta: picaretas, fragmentos e Brasas iguais antes e depois
{ F.mail = 1; const p0 = Sys.dig.picks(g.S, host), r0 = JSON.stringify(g.S.sys.relics), d0 = JSON.stringify(g.S.sys.dig); def.render(); tap('all'); has('Pegou 1 prêmio<');
  assert.strictEqual(Sys.dig.picks(g.S, host), p0); assert.strictEqual(JSON.stringify(g.S.sys.relics), r0); assert.strictEqual(JSON.stringify(g.S.sys.dig), d0, 'nada da Escavação nem das Relíquias é gasto'); }
// 7) falha do módulo: motivo em texto
{ F.mail = 1; def.render(); const c0 = TD.claimAll; TD.claimAll = () => ({ ok: false, reason: 'empty', n: 0, by: {}, left: [] }); try { tap('all'); assert.strictEqual(msg(), TD.why('empty')); } finally { TD.claimAll = c0; }
  TD.claimAll = () => { throw new Error('x'); }; try { tap('all'); assert.strictEqual(msg(), 'Não deu para pegar agora'); check('erro'); } finally { TD.claimAll = c0; } F.mail = 0; }
out.push('nunca gasta picareta nem fragmento; recusa e erro do módulo viram motivo em texto');

// 8) TEXTO ESCAPADO
{ const s = TD.SOURCES.find(x => x.id === 'mail'), l0 = s.label; s.label = '<b>"Correio" & cia</b>'; F.mail = 1;
  try { open(); has('&lt;b&gt;&quot;Correio&quot; &amp; cia&lt;/b&gt;'); not('<b>"Correio"'); tap('all'); has('<li>&lt;b&gt;&quot;Correio&quot;'); check('escapado'); } finally { s.label = l0; } }
out.push('rótulo do módulo escapado na linha e no resumo');

// 8b) HERÓI NO PALCO: drawHeroFull num canvas acima da folha; o laço para ao fechar
{ let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
  const calls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { calls.push({ x, y, k, st }); return true; };
  const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
  els.td_hero = mkEl('td_hero'); els.td_hero.getContext = () => ctx; els.td_hero.clientWidth = 320; els.td_hero.clientHeight = 160;
  try { open(); has('id="td_hero"'); assert(H().indexOf('id="td_hero"') < H().indexOf('class="td-sh'), 'o herói fica no palco, fora da folha');
    assert.strictEqual(raf.length, 1, 'o laço do herói começa'); raf.shift()(1000); assert.strictEqual(calls.length, 1, 'drawHeroFull chamado'); assert(!('mount' in calls[0].st), 'o herói como está no jogo (montaria do save)');
    assert(calls[0].y <= 160 - 24, 'os pés ficam acima da faixa Hoje (ela sobe 24 px no palco)');
    check('herói'); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar a tela para o laço'); }
  finally { delete g.requestAnimationFrame; delete g.cancelAnimationFrame; delete g.drawHeroFull; delete g.HS; delete els.td_hero; } }
out.push('herói: desenhado pelo drawHeroFull no palco acima da folha; o laço para ao fechar');

// 9) tick: redesenha quando a lista muda por fora (no máximo a cada 2 s); o aviso some sozinho; módulo desliga com a tela aberta
{ open(); const h0 = H(); const t0 = Date.now; let add = 0; Date.now = () => t0() + add;
  try { def.tick(); assert.strictEqual(H(), h0); F.ach = 2; add = 500; def.tick(); assert.strictEqual(H(), h0, 'antes de 2 s não confere'); add = 2500; def.tick(); has('data-id="achievements"');
    tap('go', { id: 'achievements' }); F.chest = 0; tap('all'); F.ach = 0; tap('all'); assert(msg()); els.td_msg.innerHTML = 'x'; add = 9000; def.tick(); assert.strictEqual(els.td_msg.innerHTML, '', 'o aviso some sozinho'); }
  finally { Date.now = t0; }
  D.on = false; def.render(); has('ainda não abriu'); check('desligou aberto'); D.on = true; }
// 10) larguras e sem o fundo; todos os botões de todos os estados
{ F.mail = 1; F.chest = 2; for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); check('largura ' + w); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  let taps = 0; open(); const n = buttons().length; for (let i = 0; i < n; i++) { F.mail = 1; F.chest = 2; g.view = 'today'; open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x); }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('tick, larguras 320 e 390, sem fundo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão; ' + seenImgs.size + ' imagens citadas existem em disco'); }
def.onClose();
} finally { D.on = false; Sys.dig.setOn(false); Sys.relics.setOn(false); }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
