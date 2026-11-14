'use strict';
// Teste de fumaça do js/p_mentors.js (MENTORES DAS ERAS: galeria 3 x 3 e a tela de um mentor com presente, marcos, título e Provação) em Node.
// Módulo REAL js/sys/mentors.js (e o js/sys/trial.js real), ligados só na memória deste teste; DOM de mentira. Rodar: node test/paineis/p_mentors.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
require(path.join(R, 'js/sys/phases.js'));
require(path.join(R, 'js/sys/mentors.js'));
require(path.join(R, 'js/sys/trial.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, ME = Sys.mentors, D = ME.DATA, TR = Sys.trial;
assert(ME && D && Array.isArray(D.list) && D.list.length === 9, 'Sys.mentors carregado com 9 mentores');
assert.strictEqual(D.on, false, 'os Mentores nascem desligados no arquivo do módulo');
// pedras e ração: guardas mínimas com a mesma forma que o módulo lê (Sys.forge.ensure(S).stones, Sys.pet.ensure(S).food)
Sys.forge = { ensure(S) { S.sys.forge = S.sys.forge || { stones: 0, spent: 0 }; return S.sys.forge; } };
Sys.pet = { ensure(S) { S.sys.pet = S.sys.pet || { food: 0 }; return S.sys.pet; } };

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', className: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { me_scroll: mkEl('me_scroll'), me_msg: mkEl('me_msg'), me_msg2: mkEl('me_msg2'), me_gs: mkEl('me_gs') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 3, stage: 25, eraMax: 2, level: 20 }); Sys.host = host;
const mkBag = () => [{ id: 1, slot: 'weapon', r: 3, e: 2 }, { id: 2, slot: 'armor', r: 2, e: 2 }, { id: 3, slot: 'hat', r: 1, e: 0 }, { id: 4, slot: 'boots', r: 0, e: 1, look: 2 }];
host.equipped = () => ({ weapon: host.items.find(x => x.id === 1) });
host.removeItem = it => { const i = host.items.findIndex(x => x.id === it.id); if (i < 0) return false; host.items.splice(i, 1); return true; };
const newSave = () => { host.items = mkBag(); const s = { sys: {}, hero: 'kael', stage: 25, gold: 0, gems: 0, eq: {} }; s.inv = host.items; return s; };
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'mentors';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.snd = () => {}; let saves = 0; g.save = () => { saves++; }; let statsN = 0; g.statsChanged = () => { statsN++; };
g.iname = it => 'Peça <' + it.id + '>'; g.ieraV = it => (Number.isInteger(it.look) ? it.look : it.e | 0); g.slotIcon = () => 'assets/bg/era0.png';
g.RN = i => ['Básico', 'Raro', 'Épico', 'Mítico', 'Lendário'][i] || '';
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
let opened = [], openRet = true;
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n, o) { opened.push([n, o]); return openRet; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_mentors.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_mentors.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const count = re => (H().match(re) || []).length;
const sheet = () => { const i = H().indexOf('class="me-sh '); return i < 0 ? '' : H().slice(i); };
const msg = () => un((/<div id="me_msg2?" class="me-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1]);
const seenActs = new Set(), seenImgs = new Set();
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  assert(!/provis[óo]ri|ATK|placeholder/i.test(h), tag + ': texto de bastidor ou ATK na tela');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const own = () => g.S.sys.mentors;
const spy = name => { const f0 = ME[name]; const s = { n: 0, args: null, restore() { ME[name] = f0; } }; ME[name] = function () { s.n++; s.args = arguments; return f0.apply(this, arguments); }; return s; };
const mats = (st, fd) => { g.S.sys.forge = { stones: st, spent: 0 }; g.S.sys.pet = { food: fd }; };

try {
// 0) registro
assert.strictEqual(addName, 'mentors'); assert.strictEqual(g.PANEL_ON.mentors, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|\.grant\s*\(/.test(SRC), 'o arquivo não liga chave nem entrega título');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(!/\.stat\b|\.per\b/.test(SRC), 'o bônus vem do statText do módulo, nunca de m.stat / m.per');
assert(/^function artOf\(era,state\)/m.test(SRC), 'os retratos passam por UMA função artOf'); assert.strictEqual(typeof def.artOf, 'function');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
{ const arts = D.list.map(m => def.artOf(m.era, '')); for (const a of arts) assert(/^<svg /.test(a) || (/^<img /.test(a) && fs.existsSync(path.join(R, /src="([^"]+)"/.exec(a)[1]))), 'retrato de reserva ou arquivo que existe');
  assert.strictEqual(new Set(arts).size, 9, 'um retrato diferente por mentor'); assert.notStrictEqual(def.artOf(0, 'lock'), arts[0], 'o trancado é outro desenho');
  for (const m of D.list) assert(!def.artOf(m.era, 'lock').includes('>' + m.name.charAt(0) + '<'), 'o trancado não entrega a inicial'); }
assert(/\.me-bt,\.xs \.me-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
assert(/\.me-grid\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(CSS), 'galeria 3 colunas com minmax(0,1fr): sem rolagem lateral');
{ let n = 0; for (const m of CSS.matchAll(/\.me-(cd|bt|md|it|sp),\.xs \.me-\1\{[^}]*min-height:(\d+)px/g)) { assert(+m[2] >= 40, 'toque mínimo de 40 px em .me-' + m[1]); n++; } assert.strictEqual(n, 5, 'os 5 tipos de botão têm altura mínima'); }
assert(/\.me-root\{--me-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
out.push('registro: mentors desligada, ' + def.actions.length + ' ações com tratador, artOf com 9 retratos de reserva e o trancado, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e ausente: aviso e Voltar; nem desenhar nem tocar escreve no save
{ const before = JSON.stringify(g.S); open(); has('Os Mentores das Eras ainda não abriram.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  for (const a of def.actions) if (a !== 'back') tap(a, { era: '0', i: '1', id: '2', k: 'st', d: '1' }); def.tick();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: desenhar e tocar não escrevem no save (S.sys.mentors não nasce)'); assert(!g.S.sys.mentors); assert.strictEqual(saves, 0);
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.mentors; Sys.mentors = null; try { open(); has('Mentores indisponíveis agora.'); assert.strictEqual(check('sem módulo'), 1); tap('open', { era: '0' }); def.tick(); } finally { Sys.mentors = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; desenhar e tocar não escrevem no save');

ME.setOn(true);
// 2) TRANCADO POR NÍVEL: diz o nível e o que falta; só o Voltar
{ g.S = newSave(); host._level = 10; open(); has('Os Mentores das Eras abrem no nível ' + D.needLevel + '.'); has('Você está no nível 10: faltam ' + (D.needLevel - 10) + ' níveis.'); assert.strictEqual(check('nível'), 1);
  tap('open', { era: '0' }); tap('gift'); not('me-grid'); host._level = D.needLevel - 1; def.tick(); has('falta 1 nível.'); host._level = 20; def.tick(); has('me-grid'); }
out.push('trancado por nível: mostra o nível que abre e quantos faltam; abre sozinho ao chegar');

// 3) GALERIA: os 9 do módulo; 3 conhecidos (era 0 a 2) com nome, papel, barra e o que ensinam; 6 com cadeado e a era que falta
{ g.S = newSave(); open(); const v = ME.view(g.S, host); assert.strictEqual(count(/data-x="open"/g), 9, '9 cartões'); assert.strictEqual(count(/class="me-cd no"/g), 6);
  for (const m of v.mentors) { if (m.unlocked) { has('<b>' + g.esc2(m.name) + '</b><small>' + g.esc2(m.role) + '</small>'); has('<small class="me-st">' + g.esc2(m.statText) + '</small>'); }
    else { has('Chegue à era ' + m.eraName); not('>' + D.list[m.era].name + '<'); } }
  assert.strictEqual(count(/<b>\?\?\?<\/b>/g), 6); assert.strictEqual(count(/class="me-segs"/g), 3); check('galeria');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)');
  // recusa: mentor que ainda não chegou diz o que falta e não abre
  const before = JSON.stringify(g.S); tap('open', { era: '5' }); assert.strictEqual(msg(), 'Chegue à era Moderna para conhecer este mentor.'); assert(/class="me-msg has bad"/.test(H())); has('me-grid'); assert.strictEqual(JSON.stringify(g.S), before); check('recusa trancado');
  tap('open', { era: '99' }); has('me-grid'); }
out.push('galeria: 9 mentores do módulo, 3 conhecidos com nome, papel, barra de 5 marcos e o statText; 6 com cadeado e a era que falta; tocar no trancado diz o motivo');

// 4) TELA DO MENTOR: balão, retrato, quem é, Amizade k/5, 5 medalhas, bônus (statText), título e a Provação da era dele
{ tap('open', { era: '2' }); const m = ME.view(g.S, host).mentors[2]; has('<h3>Bertoldo</h3>'); has('Ferreiro · era Medieval'); has('Amizade 0/5'); assert.strictEqual(count(/data-x="mark"/g), 5); has('<b>0 / 30</b> de amizade para o marco 1');
  has('Bônus: <em>' + g.esc2(m.statText) + '</em>'); has('Dê um presente para ouvir a primeira história de Bertoldo.'); has('No marco 5 você ganha o título <b>Aprendiz da Forja</b>.'); has('data-x="gift">Dar presente<'); has('Presente favorito'); not('Provação do Mestre'); check('mentor');
  tap('mark', { i: '3' }); has('Esta história chega no marco 3, com 250 de amizade.'); tap('mark', { i: '9' }); check('marco trancado');
  // Provação: só aparece com o Sys.trial ligado; o botão só existe com a provação da era aberta e não vencida
  TR.setOn(true); try { def.render(); has('Bertoldo é o mestre da Provação do nível 30. Ela abre quando você chegar a esse nível.'); not('data-x="trial"'); tap('trial'); assert.strictEqual(opened.length, 0); assert.strictEqual(msg(), 'A Provação deste mentor não está aberta agora.');
    host._level = 30; def.render(); has('Bertoldo espera você na Provação do nível 30.'); has('data-x="trial">Ir à Provação<'); check('provação aberta');
    tap('trial'); assert.deepStrictEqual(opened, [['trial', { from: 'mentors' }]], 'abre a Provação UMA vez, com a volta para os Mentores');
    openRet = false; tap('trial'); assert.strictEqual(msg(), 'A Provação não abriu agora.'); openRet = true; opened = [];
    TR.ensure(g.S).passed['30'] = 1; def.render(); has('Você já venceu Bertoldo na Provação do nível 30.'); not('data-x="trial"'); check('provação vencida'); delete g.S.sys.trial; }
  finally { TR.setOn(false); host._level = 20; }
  tap('home'); has('me-grid'); }
out.push('tela do mentor: balão, quem é, Amizade 0/5 com 5 medalhas, bônus pelo statText, título do marco 5; Provação da era (fechada, aberta com botão que abre uma vez, vencida)');

// 5) PRESENTE: folha com as peças que podem ser dadas (nunca a equipada), pedras e ração; dois toques; gift UMA vez; recusas com motivo
{ g.S = newSave(); mats(200, 35); open(); tap('open', { era: '2' }); tap('gift'); const s = sheet(); assert(s.includes('role="dialog"')); assert(s.includes('Presente para Bertoldo')); assert(s.includes('vale 50% a mais'));
  assert.strictEqual(count(/data-x="pick"/g), 3, 'a peça equipada não aparece'); assert(!s.includes('data-id="1"')); assert(s.includes('Peça &lt;2&gt;')); assert.strictEqual(count(/class="me-fav">Favorita</g), 2, 'peças da era do mentor (pela aparência também)');
  assert(s.includes('Você tem 200 · 2 = 1 de amizade')); assert(s.includes('Você tem 35 · 10 = 1 de amizade')); assert(s.includes('data-x="give">Escolha o presente<')); check('folha');
  const sp = spy('gift'), before = JSON.stringify(g.S); saves = 0; statsN = 0;
  try { tap('give'); assert.strictEqual(msg(), 'Escolha uma peça, pedras ou ração'); tap('giveok'); assert.strictEqual(msg(), 'Toque primeiro em Dar presente.'); tap('pick', { id: '1' }); assert.strictEqual(msg(), 'Essa peça não pode virar presente');
    tap('step', { k: 'st', d: '-1' }); for (let i = 0; i < 5; i++) tap('step', { k: 'fd', d: '1' }); assert.strictEqual(msg(), 'Ração insuficiente'); assert(sheet().includes('<output>30</output>'), 'a ração para no que fecha ponto');
    for (let i = 0; i < 3; i++) tap('step', { k: 'fd', d: '-1' }); assert.strictEqual(sp.n, 0); assert.strictEqual(JSON.stringify(g.S), before, 'montar o presente e as recusas não escrevem no save'); check('recusas');
    tap('pick', { id: '2' }); assert(/class="me-it sel"[^>]*data-id="2"[^>]*aria-pressed="true"/.test(H())); tap('step', { k: 'st', d: '1' }); const val = ME.itemValue(host.items.find(x => x.id === 2), 2); assert.strictEqual(val, 6);
    assert(sheet().includes('<em>+' + (val + 1) + ' de amizade</em>')); assert(sheet().includes('data-x="give">Dar presente<'));
    tap('give'); assert.strictEqual(sp.n, 0, 'o 1º toque não chama o módulo'); assert(sheet().includes('data-x="giveok">Confirmar: 1 peça e 2 pedras<')); assert(!sheet().includes('data-x="give"')); assert(msg().includes('definitivo')); check('armado');
    tap('pick', { id: '3' }); assert(sheet().includes('data-x="give">Dar presente<'), 'mexer no presente desarma'); tap('giveok'); assert.strictEqual(sp.n, 0, 'confirmar sem armar não chama o módulo'); tap('pick', { id: '3' });
    tap('give'); tap('giveok'); assert.strictEqual(sp.n, 1, 'gift chamado UMA vez'); assert.deepStrictEqual(Array.from(sp.args).slice(2), [2, { items: ['2'], stones: 2, food: 0 }]); } finally { sp.restore(); }
  assert.strictEqual(own().pts['2'], 7); assert(!host.items.some(x => x.id === 2), 'a peça saiu da mochila'); assert.strictEqual(g.S.sys.forge.stones, 198); assert.strictEqual(statsN, 1, 'a força é recalculada uma vez'); assert.strictEqual(saves, 0, 'a tela não grava em dobro');
  assert.strictEqual(sheet(), '', 'a folha fecha'); assert.strictEqual(msg(), '+7 de amizade com Bertoldo'); has('<b>7 / 30</b> de amizade'); check('deu');
  // recusa vinda do próprio módulo: o motivo aparece e nada é gasto
  { const g0 = ME.gift, b2 = JSON.stringify(g.S); tap('gift'); tap('pick', { id: '3' }); tap('give'); ME.gift = () => ({ ok: false, reason: 'items' }); try { tap('giveok'); assert.strictEqual(msg(), 'Essa peça não pode virar presente'); assert(/class="me-msg has bad"/.test(H())); } finally { ME.gift = g0; }
    assert.strictEqual(JSON.stringify(g.S), b2); assert(sheet(), 'a folha continua aberta na recusa'); check('recusa do módulo'); tap('gclose'); assert.strictEqual(sheet(), ''); }
  // marco alcançado: a fala nova vai para o balão, o bônus muda, a fala fica marcada como vista
  { const ss = spy('seen'); try { tap('gift'); for (let i = 0; i < 23; i++) tap('step', { k: 'st', d: '1' }); assert(sheet().includes('chega ao marco 1')); tap('give'); tap('giveok'); assert.strictEqual(ss.n, 1, 'seen chamado uma vez'); } finally { ss.restore(); }
    assert.strictEqual(own().pts['2'], 30); assert.strictEqual(own().seen['2'], 1); assert.strictEqual(msg(), '+23 de amizade com Bertoldo. Chegou ao marco 1'); has('Amizade 1/5'); has('<small>Fala nova · Marco 1</small><p>' + g.esc2(D.list[2].lines[0]) + '</p>');
    has('Bônus: <em>' + g.esc2(ME.view(g.S, host).mentors[2].statText) + '</em>'); assert.strictEqual(count(/class="me-md ok/g), 1); check('marco'); }
  // sem statsChanged e sem host.onChange a tela grava
  { const sc = g.statsChanged, oc = host.onChange; delete g.statsChanged; delete host.onChange; saves = 0; try { tap('gift'); tap('step', { k: 'st', d: '1' }); tap('give'); tap('giveok'); assert(saves >= 1, 'sem os ganchos do jogo a tela grava'); } finally { g.statsChanged = sc; host.onChange = oc; } }
  // fala nova que chegou por fora: selo na galeria; abrir mostra no balão e chama seen uma vez (e grava)
  { tap('home'); own().pts['0'] = 100; def.tick(); has('<span class="me-new">Fala nova</span>'); check('selo'); const ss = spy('seen'); saves = 0; try { tap('open', { era: '0' }); assert.strictEqual(ss.n, 1); } finally { ss.restore(); }
    assert.strictEqual(own().seen['0'], 2); assert(saves >= 1); has('<small>Fala nova · Marco 2</small><p>' + g.esc2(D.list[0].lines[1]) + '</p>'); tap('mark', { i: '1' }); has('<small>Marco 1</small><p>' + g.esc2(D.list[0].lines[0]) + '</p>'); check('álbum'); tap('home'); not('me-new'); }
  // amizade máxima: sem presente (motivo), título conquistado
  { own().pts['2'] = 1200; tap('open', { era: '2' }); has('Amizade 5/5'); has('Amizade máxima · <b>1.200</b> no total'); has('data-x="gift">Amizade máxima<'); has('Você conquistou o título <b>Aprendiz da Forja</b>.'); const sp2 = spy('gift');
    try { tap('gift'); assert.strictEqual(msg(), 'Amizade máxima: não precisa de presente'); assert.strictEqual(sheet(), ''); assert.strictEqual(sp2.n, 0); } finally { sp2.restore(); } check('máximo'); tap('home'); has('class="me-cd max"'); }
  // mochila sem peça sobrando
  { host.items.length = 1; tap('open', { era: '1' }); tap('gift'); assert(sheet().includes('Nenhuma peça sobrando na mochila agora.')); assert.strictEqual(count(/data-x="pick"/g), 0); check('sem peça'); tap('gclose'); tap('home'); } }
out.push('presente: só peças livres, pedras e ração no que fecha ponto; 1º toque arma, 2º chama gift uma vez; recusas da tela e do módulo com motivo; marco novo vai ao balão e chama seen; amizade máxima recusa');

// 6) TEXTO ESCAPADO (nome, papel, título, fala, era, aviso)
{ g.S = newSave(); mats(10, 0); const m = D.list[1], n0_ = m.name, r0 = m.role, t0 = m.title, l0 = m.lines[0], P = Sys.phases.DATA.eraName, e0 = P[1];
  m.name = '<b>"Tales" & cia</b>'; m.role = '<i>Escriba</i>'; m.title = '<u>Título</u>'; m.lines[0] = '<img src=x onerror=1>'; P[1] = '<u>Antiga</u>';
  try { ME.ensure(g.S).pts['1'] = 30; open(); has('&lt;b&gt;&quot;Tales&quot; &amp; cia&lt;/b&gt;'); not('<b>"Tales"'); has('&lt;i&gt;Escriba&lt;/i&gt;'); not('<i>Escriba'); check('escapado galeria');
    tap('open', { era: '1' }); has('&lt;img src=x onerror=1&gt;'); not('<img src=x'); has('&lt;u&gt;Título&lt;/u&gt;'); not('<u>Título'); has('&lt;u&gt;Antiga&lt;/u&gt;'); not('<u>Antiga');
    tap('gift'); assert(sheet().includes('Presente para &lt;b&gt;')); tap('step', { k: 'st', d: '1' }); tap('give'); tap('giveok'); assert(H().includes('de amizade com &lt;b&gt;'), 'aviso escapado'); check('escapado mentor'); }
  finally { m.name = n0_; m.role = r0; m.title = t0; m.lines[0] = l0; P[1] = e0; } tap('home'); }
out.push('textos do módulo escapados (nome, papel, título, fala, era, aviso)');

// 7) tick: redesenha quando muda por fora; o aviso some; a rolagem é mantida; módulo desliga com a tela aberta
{ g.S = newSave(); open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); host._eraMax = 3; def.tick(); assert.strictEqual(count(/class="me-cd no"/g), 5, 'era nova: um cadeado a menos'); host._eraMax = 2; def.tick();
  els.me_scroll.scrollTop = 222; tap('open', { era: '7' }); assert.strictEqual(els.me_scroll.scrollTop, 222, 'a galeria não volta ao topo num aviso'); assert(msg()); const t0 = Date.now; Date.now = () => t0() + 5000; try { els.me_msg.innerHTML = 'x'; def.tick(); assert.strictEqual(els.me_msg.innerHTML, '', 'o aviso some sozinho'); } finally { Date.now = t0; } els.me_scroll.scrollTop = 0;
  tap('open', { era: '0' }); host._eraMax = 0; def.tick(); has('<h3>Nara</h3>'); D.on = false; def.tick(); has('ainda não abriram'); check('desligou aberto'); D.on = true; host._eraMax = 2; }
// 8) larguras e sem fundo; todos os botões em três situações
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; g.S = newSave(); mats(20, 20); open(); check('galeria ' + w); tap('open', { era: '0' }); check('mentor ' + w); tap('gift'); check('folha ' + w); tap('gclose'); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  const i0 = g.iname, s0 = g.slotIcon, r0 = g.RN, v0 = g.ieraV; delete g.iname; delete g.slotIcon; delete g.RN; delete g.ieraV; g.SLOT = { armor: { n: 'Colete' } };
  try { g.S = newSave(); open(); tap('open', { era: '2' }); tap('gift'); assert(sheet().includes('<b>Colete</b><small>Épico · Medieval</small>')); assert(sheet().includes('<b>Peça</b>')); check('sem ajudantes do jogo'); } finally { g.iname = i0; g.slotIcon = s0; g.RN = r0; g.ieraV = v0; delete g.SLOT; }
  let taps = 0; TR.setOn(true); host._eraMax = 8; host._level = 40;
  const mk = [() => { const s = newSave(); return s; }, () => { const s = newSave(); s.sys.forge = { stones: 50, spent: 0 }; s.sys.pet = { food: 50 }; s.sys.mentors = { v: 1, pts: { 0: 100, 1: 40, 2: 5 }, seen: { 0: 1 } }; return s; },
    () => { const s = newSave(); s.sys.mentors = { v: 1, pts: {}, seen: {} }; for (let e = 0; e < 9; e++) { s.sys.mentors.pts[e] = 1200; s.sys.mentors.seen[e] = 5; } return s; }];
  try { for (const make of mk) for (const era of [null, 0, 2]) { const start = () => { g.S = make(); open(); if (era != null) tap('open', { era: String(era) }); }; start(); const n = buttons().length;
      for (let i = 0; i < n; i++) { start(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x);
        for (let k = 0; k < 4; k++) { const b2 = buttons().filter(q => /me-(bt|it|sp)/.test(q.tag))[k]; if (!b2) break; def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); } } }
    g.S = mk[2](); open(); assert.strictEqual(count(/class="me-cd no"/g), 0, 'na última era, nenhum trancado'); assert.strictEqual(count(/class="me-cd max"/g), 9); for (const m of D.list) has('<b>' + m.name + '</b>'); check('os 9');
    g.S = mk[1](); open(); tap('open', { era: '0' }); tap('gift'); tap('step', { k: 'st', d: '1' }); tap('give'); check('armado final'); }
  finally { TR.setOn(false); host._eraMax = 2; host._level = 20; }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('tick, larguras 320 e 390, sem fundo, sem ajudantes do jogo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
def.onClose();
} finally { D.on = false; TR.setOn(false); }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
