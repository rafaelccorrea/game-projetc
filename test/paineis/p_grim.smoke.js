'use strict';
// Teste de fumaça do js/p_grim.js (GRIMÓRIO DAS ERAS: 18 magias, 3 casas, conjuntos Fases / Arena / Chefe, subir de nível) em Node.
// Módulo REAL js/sys/grimoire.js, ligado só na memória deste teste; DOM de mentira. Rodar: node test/paineis/p_grim.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
require(path.join(R, 'js/sys/grimoire.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, GR = Sys.grimoire, D = GR.DATA;
assert(GR && D && Array.isArray(D.spells), 'Sys.grimoire carregado');
assert.strictEqual(D.on, false, 'o Grimório nasce desligado no jogo');

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { gm_scroll: mkEl('gm_scroll'), gm_msg: mkEl('gm_msg'), gm_msg2: mkEl('gm_msg2') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira (só o que a tela chama) ---------- */
const host = makeHost({ seed: 3, stage: 12, eraMax: 2 }); Sys.host = host;
const newSave = () => ({ sys: {}, hero: 'kael', stage: 12, gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'grim';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); let saves = 0; g.save = () => { saves++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_grim.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_grim.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const count = re => (H().match(re) || []).length;
const sheet = () => { const i = H().indexOf('class="gm-sh '); return i < 0 ? '' : H().slice(i); };
const msg = () => (/<div id="gm_msg2?" class="gm-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const seenActs = new Set(), seenImgs = new Set();
// toda tela desenhada passa por aqui: botões com ação tratada, zero emoji, sem reticências, nada quebrado, nada de preço nem de compra, imagens em disco
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra: ' + (/.{30}(R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote).{30}/i.exec(h) || [''])[0]);
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const setOn = v => { D.on = v; };
const own = () => GR.ensure(g.S);

try {
// 0) registro: painel 'grim', chave nasce DESLIGADA, o arquivo não liga chave nenhuma, sem diálogo do navegador, sem emoji, sem reticências
assert.strictEqual(addName, 'grim'); assert.strictEqual(g.PANEL_ON.grim, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|addPages\s*\(|addInk\s*\(|\.grant\s*\(/.test(SRC), 'o arquivo não liga chave nem entrega página ou tinta');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço escrito na tela');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências');
assert(/^function iconOf\(id,locked\)/m.test(SRC), 'os ícones passam por UMA função iconOf'); assert.strictEqual(typeof def.iconOf, 'function');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
for (const sp of D.spells) { const ic = def.iconOf(sp.id), lk = def.iconOf(sp.id, true); assert(/^<svg /.test(ic) && ic !== lk, 'ícone de reserva de ' + sp.id); assert(!/<text/.test(ic), 'símbolo próprio para ' + sp.id); }
assert.strictEqual(new Set(D.spells.map(sp => def.iconOf(sp.id))).size, D.spells.length, 'um ícone diferente por magia');
assert(/\.gm-bt,\.xs \.gm-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
assert(/\.gm-cards\{[^}]*repeat\(2,minmax\(0,1fr\)\)/.test(CSS) && /\.gm-slots\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(CSS), 'grades com minmax(0,1fr): sem rolagem lateral');
for (const m of CSS.matchAll(/\.gm-(tab|slot|sp|bt),\.xs \.gm-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .gm-' + m[1]);
out.push('registro: grim desligada, ' + def.actions.length + ' ações com tratador, iconOf com ' + D.spells.length + ' ícones de reserva diferentes, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO (como está no jogo) e módulo ausente: aviso e Voltar; nada mais responde
{ open(); has('O Grimório das Eras ainda não abriu.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1); has('data-x="back"');
  const before = JSON.stringify(g.S); tap('sp', { id: 'rollingStone' }); tap('up'); tap('upok'); tap('eq'); tap('uneq'); tap('mode', { m: 'chefe' }); tap('slot', { i: '1' }); def.tick();
  assert.strictEqual(JSON.stringify(g.S), before, 'desligado: nenhum toque escreve no save'); has('ainda não abriu');
  closed = 0; tap('back'); assert.strictEqual(closed, 1, 'Voltar fecha pela rota do jogo');
  const m0 = Sys.grimoire; Sys.grimoire = null; try { open(); has('Grimório indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); tap('sp', { id: 'rollingStone' }); def.tick(); } finally { Sys.grimoire = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; nenhum toque escreve no save');

setOn(true);
// 2) LIGADO SEM MAGIAS: estado vazio honesto com "como conseguir"; as 18 aparecem trancadas com o texto do módulo
{ g.S = newSave(); open(); has('0 de ' + D.spells.length + ' magias aprendidas'); has('Você ainda não aprendeu nenhuma magia'); has(g.esc2(D.learn.A)); has(g.esc2(D.learn.B));
  assert.strictEqual(count(/class="gm-sp lock"/g), D.spells.length, 'as 18 trancadas'); assert.strictEqual(count(/class="gm-era"/g), D.eraName.length, '9 eras');
  for (const sp of D.spells) has('>' + g.esc2(sp.name) + '</b>'); for (const nm of D.eraName) has(g.esc2(nm) + '</h4>');
  assert.strictEqual(count(/data-x="slot"/g), D.slots); assert.strictEqual(count(/>Vazio<\/b>/g), D.slots, 'casas vazias'); assert.strictEqual(count(/data-x="mode"/g), D.modes.length);
  has('Nada à venda.'); has(g.n0(D.grants.eraLord.ink) + ' de tinta'); has(g.n0(D.grants.tower.ink) + ' de tinta a cada 10 andares'); check('vazio');
  assert.deepStrictEqual(gated, ['assets/bg/era1.png'], 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)');
  // detalhe de magia que falta: como conseguir (texto do módulo), sem botão de ação além de Fechar
  tap('sp', { id: 'cannonball' }); const s = sheet(); assert(s.includes('role="dialog"')); assert(s.includes('Não aprendida')); assert(s.includes('Como conseguir'));
  const row = GR.view(g.S, host).eras[3].spells.find(q => q.id === 'cannonball'); assert(s.includes(g.esc2(row.how)), 'como conseguir vem do view do módulo'); assert(s.includes(g.esc2(GR.spell('cannonball').desc))); assert(s.includes(g.esc2(row.effectText)));
  assert(s.includes(g.esc2(row.passiveText) + ' (ao aprender)')); assert.deepStrictEqual((s.match(/<button\b[^>]*data-x="([a-z]+)"/g) || []).map(t => /data-x="([a-z]+)"/.exec(t)[1]), ['close'], 'magia que falta: só Fechar');
  check('detalhe trancada');
  // recusa do módulo ao tentar colocar o que não tem: mostra o motivo, save intacto
  const before = JSON.stringify(g.S); tap('eq'); assert.strictEqual(msg(), 'Aprenda a magia primeiro'); tap('up'); assert.strictEqual(msg(), 'Aprenda a magia primeiro'); tap('upok'); assert.strictEqual(msg(), 'Aprenda a magia primeiro');
  assert.strictEqual(JSON.stringify(g.S), before, 'recusa: save intacto'); check('recusa trancada'); tap('close'); assert.strictEqual(sheet(), ''); }
out.push('ligado sem magias: estado vazio com "como conseguir" do módulo, 18 trancadas, detalhe sem botão de ação, recusa mostra o motivo');

// 3) COM MAGIAS (via grant): lista, detalhe com os números do módulo
{ g.S = newSave();
  assert.strictEqual(GR.grant(g.S, host, 'eraLord', { era: 0 }).learned, 'rollingStone'); assert.strictEqual(GR.grant(g.S, host, 'chief50', { era: 0 }).learned, 'ancestralFire');
  assert.strictEqual(GR.grant(g.S, host, 'eraLord', { era: 1 }).learned, 'bronzePhalanx'); assert.strictEqual(GR.grant(g.S, host, 'chief50', { era: 1 }).learned, 'minotaurSpear');
  assert(GR.grant(g.S, host, 'eraLordRepeat', { era: 0 }).ok, '1 página da Pedra Rolante');
  open(); const v = GR.view(g.S, host); has('4 de ' + D.spells.length + ' magias aprendidas'); not('Você ainda não aprendeu'); has('aria-label="Tinta: ' + g.n0(v.ink) + '"');
  assert.strictEqual(count(/class="gm-sp lock"/g), D.spells.length - 4); assert.strictEqual(count(/<i class="up">Pode subir<\/i>/g), 1, 'só a Pedra Rolante pode subir');
  for (const k of ['atkPct', 'hpPct', 'defPct']) has('<b>+' + v.bonus[k].toFixed(1).replace('.', ',') + '%</b>');
  has('Nv 1 · Dano · ' + v.eras[0].spells[0].cd.toFixed(1).replace('.', ',') + ' s'); has('Nv 1 · Cura'); has('Nv 1 · Escudo'); check('com magias');
  tap('sp', { id: 'rollingStone' }); const r = v.eras[0].spells[0], nx = GR.catalog(2).find(c => c.id === 'rollingStone'), s = sheet();
  assert(s.includes('Nv 1/' + D.maxLv)); assert(s.includes(g.esc2(r.effectText))); assert(s.includes('<em>' + g.esc2(nx.effectText) + '</em>'), 'efeito do próximo nível vem do catalog do módulo');
  assert(s.includes(nx.cd.toFixed(1).replace('.', ',') + ' s</em>')); assert(s.includes(g.esc2(r.passiveText))); assert(s.includes('PÁGINAS <b>1/' + r.cost.pages + '</b>')); assert(s.includes('TINTA <b>' + v.ink + '/' + r.cost.ink + '</b>'));
  assert(s.includes('Pré-História · 1ª magia da era')); assert(s.includes('Senhor da Era de novo')); assert(s.includes('data-x="up">Subir para o Nv 2')); assert(s.includes('data-x="eq">Colocar no espaço 1 · Fases')); check('detalhe');
  tap('close'); tap('sp', { id: 'ancestralFire' }); assert(sheet().includes('2ª magia da era')); assert(sheet().includes('Instância diária da era vencida')); assert(sheet().includes('data-x="up">Faltam 1 página<'), 'sem página: o botão diz o que falta'); check('detalhe B'); tap('close'); }
out.push('com magias (grant): contagem, tinta, bônus, selo Pode subir, detalhe com efeito, recarga, bônus e custo vindos do módulo');

// 4) EQUIPAR, MOVER, TROCAR e TIRAR; cada conjunto é separado
{ saves = 0; tap('sp', { id: 'rollingStone' }); tap('eq'); assert.deepStrictEqual(own().sets.fases, ['rollingStone']); assert.strictEqual(msg(), 'Pedra Rolante no conjunto Fases'); assert(saves >= 1, 'equipar grava');
  assert(sheet().includes('data-x="uneq">Tirar do conjunto Fases')); check('equipada'); tap('close'); has('<i>Fases</i>');
  tap('slot', { i: '1' }); assert(/data-i="1" aria-pressed="true"/.test(H())); tap('sp', { id: 'minotaurSpear' }); assert(sheet().includes('Colocar no espaço 2 · Fases')); tap('eq'); assert.deepStrictEqual(own().sets.fases, ['rollingStone', 'minotaurSpear']); tap('close');
  tap('slot', { i: '2' }); tap('sp', { id: 'bronzePhalanx' }); tap('eq'); assert.deepStrictEqual(own().sets.fases, ['rollingStone', 'minotaurSpear', 'bronzePhalanx']); tap('close'); assert.strictEqual(count(/>Vazio<\/b>/g), 0);
  // trocar duas de lugar: casa 1 escolhida, magia que está na casa 3
  tap('slot', { i: '0' }); tap('sp', { id: 'bronzePhalanx' }); assert(sheet().includes('Mover para o espaço 1 · Fases (troca com Pedra Rolante)')); tap('eq'); assert.deepStrictEqual(own().sets.fases, ['bronzePhalanx', 'minotaurSpear', 'rollingStone']); tap('close');
  // a 4ª magia entra no lugar da casa escolhida
  tap('slot', { i: '1' }); tap('sp', { id: 'ancestralFire' }); assert(sheet().includes('(troca com Lança do Minotauro)')); tap('eq'); assert.deepStrictEqual(own().sets.fases, ['bronzePhalanx', 'ancestralFire', 'rollingStone']); tap('close');
  // tocar de novo na casa escolhida abre a magia dela; tirar
  tap('slot', { i: '1' }); assert(sheet().includes('<h3>Fogueira Ancestral</h3>'), 'tocar de novo na casa abre a magia'); tap('uneq'); assert.deepStrictEqual(own().sets.fases, ['bronzePhalanx', 'rollingStone']); assert.strictEqual(msg(), 'Fogueira Ancestral saiu do conjunto Fases'); check('tirou'); tap('close');
  assert.strictEqual(count(/>Vazio<\/b>/g), 1);
  // outro conjunto: começa vazio, não mexe no de Fases
  tap('mode', { m: 'chefe' }); assert(/data-m="chefe" aria-selected="true"/.test(H())); assert.strictEqual(count(/>Vazio<\/b>/g), D.slots); has('Usado contra chefe');
  tap('sp', { id: 'minotaurSpear' }); assert(sheet().includes('Colocar no espaço 1 · Chefe')); tap('eq'); assert.deepStrictEqual(own().sets.chefe, ['minotaurSpear']); assert.deepStrictEqual(own().sets.fases, ['bronzePhalanx', 'rollingStone']); tap('close');
  has('<i>Chefe</i>'); tap('mode', { m: 'arena' }); has('Usado na Arena e no Torneio.'); assert.deepStrictEqual(own().sets.arena, []); check('arena'); tap('mode', { m: 'nada' }); assert(/data-m="arena" aria-selected="true"/.test(H()), 'conjunto que não existe é ignorado');
  assert.deepStrictEqual(GR.loadout(g.S, GR.modeFor({ boss: true })).map(x => x.id), ['minotaurSpear'], 'a luta lê o conjunto Chefe que a tela montou');
  assert.deepStrictEqual(GR.loadout(g.S, GR.modeFor({ pvp: true })).map(x => x.id), ['bronzePhalanx', 'rollingStone'], 'Arena vazia cai no conjunto Fases (regra do módulo)'); tap('mode', { m: 'fases' }); }
out.push('conjuntos: colocar, mover, trocar e tirar pelo Sys.grimoire.equip; Fases, Arena e Chefe separados; a luta lê o mesmo conjunto');

// 5) SUBIR DE NÍVEL: dois toques, custo do módulo; recusa mostra o motivo
{ const o = own(), ink0 = o.ink, c = GR.levelCost(g.S, 'rollingStone'), b0 = GR.bonus(g.S).atkPct; saves = 0;
  tap('sp', { id: 'rollingStone' }); tap('up'); assert.strictEqual(o.own.rollingStone.lv, 1, 'o 1º toque não gasta'); assert.strictEqual(o.ink, ink0); assert.strictEqual(saves, 0);
  assert(sheet().includes('data-x="upok">Confirmar: gasta ' + c.pages + ' página e ' + c.ink + ' de tinta')); assert(!sheet().includes('data-x="up"')); check('armado');
  tap('sp', { id: 'rollingStone' }); assert(sheet().includes('data-x="up">Subir para o Nv 2'), 'outro toque desarma'); tap('up'); tap('upok');
  assert.strictEqual(o.own.rollingStone.lv, 2); assert.strictEqual(o.ink, ink0 - c.ink); assert.strictEqual(o.own.rollingStone.pages, 0); assert(saves >= 1, 'subir grava'); assert(GR.bonus(g.S).atkPct > b0, 'o bônus por ter sobe sozinho');
  assert(msg().startsWith('Pedra Rolante subiu para o nível 2 · bônus ATQ +'), msg()); assert(sheet().includes('Nv 2/' + D.maxLv)); check('subiu');
  // agora falta página: o botão diz o que falta e o toque mostra o motivo; forçar o módulo também recusa
  const c2 = GR.levelCost(g.S, 'rollingStone'), before = JSON.stringify(g.S); assert(sheet().includes('data-x="up">Faltam ' + c2.pages + ' páginas<')); tap('up'); assert.strictEqual(msg(), 'Faltam ' + c2.pages + ' páginas'); assert(/class="gm-msg bad"/.test(H()));
  tap('upok'); assert.strictEqual(msg(), 'Faltam ' + c2.pages + ' páginas', 'a recusa do módulo (pages) vira o motivo'); assert.strictEqual(JSON.stringify(g.S), before, 'recusa: nada é gasto');
  // falta tinta
  o.own.rollingStone.pages = 99; const ink1 = o.ink; o.ink = 3; def.render(); assert(sheet().includes('data-x="up">Faltam ' + (c2.ink - 3) + ' de tinta<')); tap('upok'); assert.strictEqual(msg(), 'Faltam ' + (c2.ink - 3) + ' de tinta'); assert.strictEqual(o.own.rollingStone.lv, 2);
  // nível máximo
  o.own.rollingStone.lv = D.maxLv; def.render(); assert(sheet().includes('Nv ' + D.maxLv + '/' + D.maxLv)); assert(sheet().includes('data-x="up">Nível máximo<')); assert(!sheet().includes('class="gm-prg"')); assert(!/No Nv \d+</.test(sheet())); tap('upok'); assert.strictEqual(msg(), 'Nível máximo'); check('máximo');
  // o módulo desliga com a tela aberta: aviso
  setOn(false); def.render(); has('ainda não abriu'); check('desligou aberto'); setOn(true); o.own.rollingStone.lv = 2; o.own.rollingStone.pages = 0; o.ink = ink1; tap('close'); }
out.push('subir de nível: 1º toque arma, 2º gasta o custo do módulo e grava; recusas (páginas, tinta, máximo) mostram o motivo sem gastar');

// 6) TEXTO ESCAPADO: nome, descrição e "como conseguir" do módulo passam pelo esc2
{ const sp = GR.spell('ancestralFire'), n0_ = sp.name, d0 = sp.desc, l0 = D.learn.A, e0 = D.eraName[2]; sp.name = '<b>"Fogo" & cia</b>'; sp.desc = '<img src=x onerror=1>'; D.learn.A = '<i>vitória</i>'; D.eraName[2] = '<u>Medieval</u>';
  try { open(); has('&lt;b&gt;&quot;Fogo&quot; &amp; cia&lt;/b&gt;'); not('<b>"Fogo"'); has('&lt;i&gt;vitória&lt;/i&gt;'); has('&lt;u&gt;Medieval&lt;/u&gt;'); tap('sp', { id: 'ancestralFire' }); has('&lt;img src=x onerror=1&gt;'); not('<img src=x'); tap('eq'); assert(msg().startsWith('&lt;b&gt;'), 'aviso escapado'); tap('uneq'); check('escapado'); }
  finally { sp.name = n0_; sp.desc = d0; D.learn.A = l0; D.eraName[2] = e0; } tap('close'); }
out.push('textos do módulo escapados (nome, descrição, era, como conseguir, aviso)');

// 7) tick: redesenha quando páginas ou tinta chegam por fora; o aviso some sozinho; a rolagem é mantida
{ open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); assert(GR.grant(g.S, host, 'tower').ok); def.tick(); has('aria-label="Tinta: ' + g.n0(own().ink) + '"'); assert.notStrictEqual(H(), h0);
  assert(GR.grant(g.S, host, 'event', { id: 'plasmaRay' }).ok); def.tick(); has('5 de ' + D.spells.length + ' magias aprendidas');
  els.gm_scroll.scrollTop = 321; tap('sp', { id: 'plasmaRay' }); assert.strictEqual(els.gm_scroll.scrollTop, 321, 'a lista não volta ao topo'); tap('eq'); assert(msg()); const t0 = Date.now; Date.now = () => t0() + 5000; try { els.gm_msg2.innerHTML = 'x'; def.tick(); assert.strictEqual(els.gm_msg2.innerHTML, '', 'o aviso some sozinho'); } finally { Date.now = t0; } tap('uneq'); tap('close'); els.gm_scroll.scrollTop = 0; }
// 8) larguras de 320 e 390 e sem o fundo da era: desenha igual
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); tap('sp', { id: 'rollingStone' }); check('largura ' + w); has('Fechar'); tap('close'); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; } }
// 9) todos os botões em três situações (sem magias, 5 magias, as 18): tocar em cada um não gera exceção e a tela continua íntegra
{ let taps = 0; const few = JSON.stringify(g.S), all = newSave(); for (let e = 0; e < 9; e++) { GR.grant(all, host, 'eraLord', { era: e }); GR.grant(all, host, 'chief50', { era: e }); } assert.strictEqual(GR.view(all, host).owned, D.spells.length);
  for (const mk of [() => newSave(), () => JSON.parse(few), () => JSON.parse(JSON.stringify(all))]) { g.S = mk(); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = mk(); open(); const b = buttons()[i]; try { def.click(b); taps++; check('toque ' + b.dataset.x);
        for (const b2 of buttons().filter(q => /gm-bt/.test(q.tag))) { def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); if (!sheet()) break; } } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } } }
  g.S = JSON.parse(JSON.stringify(all)); open(); assert.strictEqual(count(/class="gm-sp lock/g), 0, 'com as 18, nenhuma trancada'); not('Você ainda não aprendeu'); check('as 18');
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('tick, larguras 320 e 390, sem fundo; toques: ' + taps + ' sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagem citada existe em disco'); }
def.onClose();
} finally { D.on = false; }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
