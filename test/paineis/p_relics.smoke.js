'use strict';
// Teste de fumaça do js/p_relics.js (RELÍQUIAS DAS ERAS: grade 3 x 3, bônus total, folha com Subir / Despertar e "Como conseguir") em Node.
// Módulo REAL js/sys/relics.js, ligado só na memória deste teste; DOM de mentira. Rodar: node test/paineis/p_relics.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
require(path.join(R, 'js/sys/relics.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, RL = Sys.relics, D = RL.DATA;
assert(RL && D && Array.isArray(D.relics), 'Sys.relics carregado');
assert.strictEqual(D.on, false, 'as Relíquias nascem desligadas no jogo');

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { rl_scroll: mkEl('rl_scroll'), rl_msg: mkEl('rl_msg'), rl_msg2: mkEl('rl_msg2') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 3, stage: 12, eraMax: 2 }); Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 12, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'relics';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_relics.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_relics.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const count = re => (H().match(re) || []).length;
const sheet = () => { const i = H().indexOf('class="rl-sh '); return i < 0 ? '' : H().slice(i); };
const msg = () => (/<div id="rl_msg2?" class="rl-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const own = () => g.S.sys.relics;
const spy = name => { const f0 = RL[name]; const s = { n: 0, restore() { RL[name] = f0; } }; RL[name] = function () { s.n++; return f0.apply(this, arguments); }; return s; };

try {
// 0) registro
assert.strictEqual(addName, 'relics'); assert.strictEqual(g.PANEL_ON.relics, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|addFragments\s*\(|addRelicFrags\s*\(|\.grant\s*\(/.test(SRC), 'o arquivo não liga chave nem entrega fragmento');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(/^function iconOf\(id,state\)/m.test(SRC), 'os ícones passam por UMA função iconOf'); assert.strictEqual(typeof def.iconOf, 'function');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
for (const r of D.relics) { const ic = def.iconOf(r.id, ''), sil = def.iconOf(r.id, 'sil'), lk = def.iconOf(r.id, 'lock');
  if (/^<img /.test(ic)) { const m = /src="([^"]+)"/.exec(ic); assert(m && fs.existsSync(path.join(R, m[1])), 'arquivo do ícone de ' + r.id); }
  else assert(/^<svg /.test(ic), 'ícone de reserva de ' + r.id); assert(ic !== sil && sil !== lk, 'três estados diferentes para ' + r.id); }
assert.strictEqual(new Set(D.relics.map(r => def.iconOf(r.id, ''))).size, D.relics.length, 'um ícone diferente por relíquia');
assert(/\.rl-bt,\.xs \.rl-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
assert(/\.rl-grid\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(CSS), 'grade 3 colunas com minmax(0,1fr): sem rolagem lateral');
for (const m of CSS.matchAll(/\.rl-(cd|bt),\.xs \.rl-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .rl-' + m[1]);
assert(/\.rl-root\{--rl-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
out.push('registro: relics desligada, ' + def.actions.length + ' ações com tratador, iconOf com ' + D.relics.length + ' ícones de reserva em 3 estados, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e ausente: aviso e Voltar; nem desenhar nem tocar escreve no save
{ const before = JSON.stringify(g.S); open(); has('As Relíquias das Eras ainda não abriram.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  tap('sel', { id: 'flintAxe' }); tap('up'); tap('upok'); tap('wake'); tap('wakeok'); tap('close'); def.tick();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: desenhar e tocar não escrevem no save (S.sys.relics não nasce)'); assert(!g.S.sys.relics);
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.relics; Sys.relics = null; try { open(); has('Relíquias indisponíveis agora.'); assert.strictEqual(check('sem módulo'), 1); tap('sel', { id: 'flintAxe' }); def.tick(); } finally { Sys.relics = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; desenhar e tocar não escrevem no save');

RL.setOn(true);
// 2) LIGADO SEM RELÍQUIAS: vazio honesto; 9 cartões; eras acima da do herói com cadeado e o que falta
{ g.S = newSave(); open(); const v = RL.view(g.S, host); has('0 de 9 relíquias'); has('Nenhum bônus ainda'); has('Você ainda não tem relíquias');
  assert.strictEqual(count(/data-x="sel"/g), 9, '9 cartões'); assert.strictEqual(count(/class="rl-cd no"/g), 9);
  const lockN = v.slots.filter(s => s.locked).length; assert.strictEqual(lockN, 6, 'eras 3 a 8 trancadas para o herói na era 2'); assert.strictEqual(count(/Chegue a esta era para liberar/g), lockN);
  for (const s of v.slots) has('>' + g.esc2(s.locked ? s.eraName : s.name) + '</b>'); assert.strictEqual(count(/Senhor da Era ou 20 fragmentos/g), 3, 'trancada por relíquia: Senhor da Era ou 20 fragmentos');
  for (const t of v.sources) has('<li>' + g.esc2(t) + '</li>'); has('Nada à venda.'); check('vazio');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)');
  // folha de relíquia que não nasceu: descrição, bônus ao nascer, barra 0/20, como conseguir, botão diz o que falta
  tap('sel', { id: 'scarab' }); const s = sheet(), row = v.slots[1]; assert(s.includes('role="dialog"')); assert(s.includes('Não nasceu')); assert(s.includes(g.esc2(row.desc))); assert(s.includes('Bônus ao nascer')); assert(s.includes(g.esc2(row.passiveText)));
  assert(s.includes('FRAGMENTOS DE ANTIGUIDADE <b>0/20</b>')); assert(s.includes('Como conseguir')); assert(s.includes('data-x="wake">Faltam 20 fragmentos de Antiguidade ou vencer o Senhor da Era<')); check('folha não nasceu');
  // recusa: mostra o motivo e não escreve
  const before = JSON.stringify(g.S); tap('wake'); assert.strictEqual(msg(), 'Faltam 20 fragmentos de Antiguidade ou vencer o Senhor da Era'); assert(/class="rl-msg bad"/.test(H()));
  tap('wakeok'); assert.strictEqual(msg(), 'Toque primeiro no botão dourado.'); tap('up'); assert.strictEqual(msg(), RL.why('locked')); assert.strictEqual(JSON.stringify(g.S), before, 'recusa: save intacto'); check('recusa'); tap('close'); assert.strictEqual(sheet(), '');
  // folha de era trancada: diz o que falta
  tap('sel', { id: 'judgeFeather' }); assert(sheet().includes('Era trancada')); assert(sheet().includes('Chegue à era Celestial')); check('folha era trancada'); tap('close'); }
out.push('ligado sem relíquias: vazio honesto, 9 cartões, 6 eras com cadeado e o que falta, folha com "Como conseguir" do módulo, recusa com motivo');

// 3) COM RELÍQUIAS (via grant do módulo): cartões e folha com os números do view
{ g.S = newSave(); assert.strictEqual(RL.grant(g.S, host, 'eraLord', { era: 0 }).unlocked, 'flintAxe'); assert.strictEqual(RL.grant(g.S, host, 'eraLord', { era: 2 }).unlocked, 'knightHelm');
  RL.addFragments(g.S, 0, 6, 'dig'); RL.addFragments(g.S, 1, 20, 'dig'); RL.addFragments(g.S, 2, 2, 'dig');
  open(); const v = RL.view(g.S, host); has('2 de 9 relíquias'); has('<b>' + g.esc2(v.bonusText) + '</b>'); not('Você ainda não tem'); assert(v.bonusText.includes('ATQ +0,6%'));
  has('Pode subir · 6 / 5'); has('>2 / 5<'); has('Pode despertar'); has('20 / 20'); has('Nv 1/10'); assert.strictEqual(count(/class="rl-cd"/g), 2); check('com relíquias');
  tap('sel', { id: 'flintAxe' }); const s = sheet(), row = v.slots[0]; assert(s.includes('Nv 1/10')); assert(s.includes('Bônus Nv 1')); assert(s.includes(g.esc2(row.passiveText))); assert(s.includes('<em>' + g.esc2(row.nextText) + '</em>'), 'bônus atual → próximo do módulo');
  assert(s.includes('FRAGMENTOS DE PRÉ-HISTÓRIA <b>6/5</b>')); assert(s.includes('data-x="up">Subir para o Nv 2')); check('folha'); }
out.push('com relíquias: total, bônus, selo Pode subir / Pode despertar, folha com bônus atual e próximo e a barra de fragmentos');

// 4) SUBIR: dois toques; levelUp UMA vez; gasta o custo do módulo; depois falta fragmento (motivo)
{ const sp = spy('levelUp'), c = RL.levelCost(g.S, 'flintAxe'), f0 = own().frags[0], b0 = RL.bonus(g.S).atkPct; saves = 0;
  try { tap('up'); assert.strictEqual(sp.n, 0, 'o 1º toque não chama o módulo'); assert.strictEqual(own().frags[0], f0); assert.strictEqual(own().own.flintAxe.lv, 1); assert.strictEqual(saves, 0);
    assert(sheet().includes('data-x="upok">Confirmar: gasta ' + c + ' fragmentos')); assert(!sheet().includes('data-x="up"')); check('armado');
    tap('sel', { id: 'flintAxe' }); assert(sheet().includes('data-x="up">Subir para o Nv 2'), 'outro toque desarma'); tap('upok'); assert.strictEqual(sp.n, 0, 'confirmar sem armar não chama o módulo');
    tap('up'); tap('upok'); assert.strictEqual(sp.n, 1, 'levelUp chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(own().own.flintAxe.lv, 2); assert.strictEqual(own().frags[0], f0 - c); assert(host.changes >= 1 && saves === 0, 'subir: o módulo avisa o jogo (host.onChange grava); a tela não grava em dobro'); assert(RL.bonus(g.S).atkPct > b0);
  assert(msg().startsWith('Machado de Sílex subiu para o nível 2 · ATQ +'), msg()); assert(sheet().includes('Nv 2/10')); check('subiu');
  const c2 = RL.levelCost(g.S, 'flintAxe'), need = c2 - own().frags[0], before = JSON.stringify(g.S);
  assert(sheet().includes('data-x="up">Faltam ' + need + ' fragmentos de Pré-História<')); tap('up'); assert.strictEqual(msg(), 'Faltam ' + need + ' fragmentos de Pré-História'); assert(/class="rl-msg bad"/.test(H()));
  assert.strictEqual(JSON.stringify(g.S), before, 'recusa: nada é gasto');
  // recusa vinda do próprio módulo (o view disse que dava, o módulo recusou): o motivo aparece
  const l0 = RL.levelUp; own().frags[0] = 99; def.render(); tap('up'); RL.levelUp = () => ({ ok: false, reason: 'max' }); try { tap('upok'); assert.strictEqual(msg(), RL.why('max')); } finally { RL.levelUp = l0; }
  // nível máximo
  own().own.flintAxe.lv = D.maxLv; def.render(); assert(sheet().includes('Nv 10/10')); assert(sheet().includes('data-x="up">' + RL.why('max') + '<')); assert(!sheet().includes('class="rl-prg"')); assert(!/No Nv \d+</.test(sheet())); tap('up'); assert.strictEqual(msg(), RL.why('max')); check('máximo');
  tap('close'); has('<small class="up">Nível máximo</small>'); own().own.flintAxe.lv = 2; own().frags[0] = 1; }
out.push('Subir: 1º toque arma, 2º chama levelUp uma vez e grava; falta de fragmento, recusa do módulo e nível máximo mostram o motivo');

// 5) DESPERTAR com 20 fragmentos: dois toques; unlock UMA vez
{ def.render(); const sp = spy('unlock'); saves = 0;
  try { tap('sel', { id: 'scarab' }); assert(sheet().includes('data-x="wake">Despertar<')); tap('wake'); assert.strictEqual(sp.n, 0); assert(!own().own.scarab); assert(sheet().includes('data-x="wakeok">Confirmar: gasta 20 fragmentos')); check('despertar armado');
    tap('wakeok'); assert.strictEqual(sp.n, 1, 'unlock chamado UMA vez'); } finally { sp.restore(); }
  assert.strictEqual(own().own.scarab.lv, 1); assert.strictEqual(own().frags[1], 0); assert(host.changes >= 2 && saves === 0, 'o módulo avisa o jogo; a tela não grava em dobro'); assert(msg().startsWith('Escaravelho Sagrado despertou · Vida +'), msg()); assert(sheet().includes('Nv 1/10'));
  { const oc = host.onChange; delete host.onChange; saves = 0; try { RL.addFragments(g.S, 1, 5, 'dig'); def.render(); tap('up'); tap('upok'); assert.strictEqual(own().own.scarab.lv, 2); assert(saves >= 1, 'sem host.onChange a tela grava'); } finally { host.onChange = oc; } own().own.scarab.lv = 1; def.render(); }
  tap('wake'); assert.strictEqual(msg(), RL.why('owned')); check('despertou'); tap('close'); has('3 de 9 relíquias'); }
out.push('Despertar: 1º toque arma, 2º chama unlock uma vez, gasta 20 fragmentos e a relíquia nasce no Nv 1');

// 6) fragmentos soltos e TEXTO ESCAPADO
{ const s2 = newSave(); const keep = g.S; g.S = s2; RL.addRelicFrags(g.S, 7, 'mail'); open(); has('7 fragmentos soltos guardados'); check('soltos'); g.S = keep;
  const r = RL.relic('knightHelm'), n0_ = r.name, d0 = r.desc, e0 = D.eraName[2]; r.name = '<b>"Elmo" & cia</b>'; r.desc = '<img src=x onerror=1>'; D.eraName[2] = '<u>Medieval</u>';
  try { open(); has('&lt;b&gt;&quot;Elmo&quot; &amp; cia&lt;/b&gt;'); not('<b>"Elmo"'); tap('sel', { id: 'knightHelm' }); has('&lt;img src=x onerror=1&gt;'); not('<img src=x'); has('&lt;u&gt;Medieval&lt;/u&gt;'); not('<u>Medieval'); tap('up'); assert(msg().includes('&lt;u&gt;'), 'aviso escapado'); check('escapado'); }
  finally { r.name = n0_; r.desc = d0; D.eraName[2] = e0; } tap('close'); }
out.push('fragmentos soltos aparecem; textos do módulo escapados (nome, descrição, era, aviso)');

// 7) tick: redesenha quando chega fragmento por fora ou a era libera; o aviso some; a rolagem é mantida; módulo desliga com a tela aberta
{ open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); RL.addFragments(g.S, 2, 3, 'dig'); def.tick(); assert.notStrictEqual(H(), h0); has('Pode subir · 5 / 5');
  host._eraMax = 3; def.tick(); assert.strictEqual(count(/Chegue a esta era para liberar/g), 5, 'era nova liberada: um cadeado a menos'); host._eraMax = 2; def.tick();
  els.rl_scroll.scrollTop = 222; tap('sel', { id: 'knightHelm' }); assert.strictEqual(els.rl_scroll.scrollTop, 222, 'a lista não volta ao topo'); tap('wake'); assert(msg()); const t0 = Date.now; Date.now = () => t0() + 5000; try { els.rl_msg2.innerHTML = 'x'; def.tick(); assert.strictEqual(els.rl_msg2.innerHTML, '', 'o aviso some sozinho'); } finally { Date.now = t0; } tap('close'); els.rl_scroll.scrollTop = 0;
  D.on = false; def.render(); has('ainda não abriram'); check('desligou aberto'); D.on = true; }
// 8) larguras e sem fundo; todos os botões em três situações
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); tap('sel', { id: 'flintAxe' }); check('largura ' + w); tap('close'); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  let taps = 0; const few = JSON.stringify(g.S), all = newSave(); host._eraMax = 8; for (let e = 0; e < 9; e++) { RL.grant(all, host, 'eraLord', { era: e }); RL.addFragments(all, e, 60, 'dig'); } assert.strictEqual(RL.view(all, host).owned, 9);
  for (const mk of [() => newSave(), () => JSON.parse(few), () => JSON.parse(JSON.stringify(all))]) { g.S = mk(); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = mk(); open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x);
      for (let k = 0; k < 3 && sheet(); k++) { const b2 = buttons().filter(q => /rl-bt/.test(q.tag))[0]; if (!b2) break; def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); } } }
  g.S = JSON.parse(JSON.stringify(all)); open(); assert.strictEqual(count(/class="rl-cd no/g), 0, 'com as 9, nenhuma trancada'); has('9 de 9 relíquias'); check('as 9'); host._eraMax = 2;
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('tick, larguras 320 e 390, sem fundo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { D.on = false; }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
