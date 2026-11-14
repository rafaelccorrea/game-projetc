'use strict';
// Teste de fumaça do js/p_forge2.js (FORJA V2) em Node: DOM de mentira, módulos REAIS de js/sys (level, loot, stats, forge, fc).
// Rodar: node test/paineis/p_forge2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['level', 'loot', 'stats', 'forge', 'fc'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, F = Sys.forge;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 236, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let timers = []; g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};
const flush = () => { let i = 0; while (timers.length && i++ < 300) timers.shift()(); assert(i < 300, 'laço de tentativas sem fim'); return i; };

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
let rngV = 0; const host = makeHost({ seed: 7, stage: 25, eraMax: 4 }); host.rng = () => rngV;
host.canSpendGold = n => n >= 0 && g.S.gold >= n; host.spendGold = n => { if (!(n >= 0) || g.S.gold < n) return false; g.S.gold -= n; return true; };
host.equipped = () => { const o = {}; for (const s in g.S.eq) { const it = g.S.inv.find(i => i.id === g.S.eq[s]); if (it) o[s] = it; } return o; };
Sys.host = host;
const newSave = () => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: 'kael', set: {} });
const setLv = n => { Sys.level.ensure(g.S).lvl = n; };
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'forge2'; g.PANEL_ON = {};
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : ''; g.RC = ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'];
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.ICON = {}; F.DATA.slots.forEach(s => { g.ICON[s] = 'data:image/svg+xml,' + s; });g.slotIcon = (s, e) => 'assets/icons/slots/era' + e + '_' + s + '.png'; g.ieraV = it => Number.isInteger(it.look) ? it.look : it.e | 0; g.iname = it => it.name || 'Peça';
g.plv = () => Sys.level.level(g.S); g.needMsg = (c, v) => 'Ouro insuficiente: faltam ' + Math.ceil(v - g.S.gold);
const log = []; g.snd = n => log.push('snd:' + n); g.vib = () => {}; g.save = () => log.push('save'); g.hud = () => {}; g.statsChanged = () => log.push('stats'); g.ptrack = (e, n) => log.push('ptrack:' + e);
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_forge2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_forge2.js' });
const X = g.Forge2.X, out = [];
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
/* todo <button> tem data-x e a ação está na lista de ações tratadas; sem emoji; sem "undefined"/"NaN"; sem diálogo do navegador */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/comprar|sorteio/i.test(H().replace(/<style[\s\S]*?<\/style>/g, '')), what + ': texto proibido');
  // QA 320 px: nada cortado com reticências por estilo na própria marca; nenhum aviso dentro do palco nem com posição própria (os avisos ficam na faixa do rodapé)
  const h = H(); assert(!/text-overflow\s*:\s*ellipsis/.test(h), what + ': reticências no HTML');
  const sg = stageSeg(h); if (sg) { assert(!/f2-toast|f2_toast|f2-ban|f2-fly|role="status"|role="alert"/.test(sg.in), what + ': aviso dentro do palco');
    // QA lote V2 (A1): a linha de avisos é do FLUXO, sempre presente, depois do palco e ANTES da rolagem (cartão "+N → +N+1" e botões): nada de aviso por cima deles
    const ni = h.indexOf('class="f2-notes"'); assert(ni > sg.b, what + ': a linha de avisos fica depois (fora) do palco'); const ti = h.indexOf('id="f2_toast"'); assert(ti > ni, what + ': o aviso mora na linha de avisos');
    const si = h.indexOf('id="f2_scroll"'); assert(si > ti, what + ': a linha de avisos vem antes da rolagem (não fica por cima do cartão nem dos botões)');
    assert(h.indexOf('class="f2-notes"', ni + 1) < 0, what + ': uma linha de avisos só');
    for (const c of ['f2-toast', 'f2-ban', 'f2-fly']) for (const m of h.matchAll(new RegExp('<div class="' + c + '[ "][^>]*>', 'g'))) { assert(m.index > ni && m.index < si, what + ': ' + c + ' fora da linha de avisos'); assert(!/[";]top:|[";]left:|[";]bottom:|position:/.test(m[0]), what + ': ' + c + ' com posição própria: ' + m[0]); seenNotes.add(c); }
    assert((h.match(/<div class="f2-ban[ "]/g) || []).length <= 1, what + ': uma faixa de resultado por vez'); }
  return bt.length; };
// o trecho do HTML que é o palco (do <div class="f2-stage"> até o </div> que o fecha)
function stageSeg(h) { const a = h.indexOf('<div class="f2-stage"'); if (a < 0) return null; const re = /<div\b|<\/div>/g; re.lastIndex = a; let d = 0, m;
  while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return { a, b: re.lastIndex, in: h.slice(a, re.lastIndex) }; } return null; }
const seenNotes = new Set();
const CSS = () => g.document.head.children.map(c => c.textContent).join('\n');
const rule = sel => { const css = CSS(), i = css.indexOf('\n' + sel + '{'); assert(i >= 0, 'regra de estilo ausente: ' + sel); return css.slice(i + 1, css.indexOf('}', i) + 1); };
const st = () => F.ensure(g.S);
const give = (stones, gold) => { st().stones = stones; g.S.gold = gold; };
const setF = (slot, lv, pity) => { st().lv[slot] = lv; st().pity[slot] = pity || 0; };

// 0) registro: painel 'forge2', chave nasce DESLIGADA, nenhuma chave de módulo ligada pelo arquivo
assert.strictEqual(addName, 'forge2'); assert.strictEqual(g.PANEL_ON.forge2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/setForge20\s*\(|setLateGame\s*\(|quality\.on\s*=(?!=)|\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
out.push('registro: forge2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji no arquivo');

// 1) save novo: nível 1 = portão (o Sys.level decide); depois, liberado e vazio, desenha sem erro
def.onOpen(); def.render(); has('Libera no nível ' + Sys.level.unlockLevel('forge')); has('data-x="back"'); sane('portão'); def.click(btn('back')); assert(log.includes('close'));
setLv(60); def.onOpen(); def.render(); has('espaço vazio'); has('Forjar até conseguir'); has('PODER (FC)'); has('Tabela da Forja'); has('Auras da arma'); has('id="f2_stc"');
assert.strictEqual((H().match(/data-x="slot"/g) || []).length, F.DATA.slots.length, 'os 7 espaços em volta do herói'); sane('save novo');
out.push('save novo: portão pelo nível e, liberado, tela inteira sem erro (7 espaços, tabela, auras)');

// 2) item forjável: chance "base + garantia", barra, custo e FC do módulo; sem a chave, sem aba Fundir nem +16
g.S.inv = [{ id: 1, slot: 'weapon', e: 4, r: 2, lvl: 20, gold: 500, name: 'Lâmina <b>Rúnica</b>', subs: [] }, { id: 2, slot: 'armor', e: 4, r: 1, lvl: 20, gold: 300, name: 'Armadura', subs: [] },
  { id: 3, slot: 'weapon', e: 1, r: 3, lvl: 11, gold: 2400, name: 'Xifos', subs: [] }, { id: 4, slot: 'boots', e: 2, r: 2, lvl: 9, gold: 100, name: 'Grevas', subs: [] }];
g.S.eq = { weapon: 1, armor: 2 }; g.S.nextId = 5; setF('weapon', 7, 10); give(86, 1e6);
def.onOpen(); def.render(); const c7 = F.canTry(g.S, host, 'weapon');
assert.strictEqual(c7.chance, F.DATA.chance[7] + 10); has('>' + c7.chance + '%</b>'); has(F.DATA.chance[7] + '% <b>+ 10% de garantia</b>'); has('class="f2-pity"'); has('Garantido em até ' + F.worstTries(g.S, 'weapon') + ' tentativas');
has('<b>' + c7.stones + '</b>'); has('<b>' + c7.gold + '</b>'); has('Forja <b>+7 → +8</b>'); has('Aura roxa'); has('FC ANTES → DEPOIS'); has('Lâmina &lt;b&gt;Rúnica&lt;/b&gt;'); not('<b>Rúnica</b>');
assert.strictEqual(st().lv.weapon, 7, 'a prévia da FC não deixa o +1 no save'); assert(Sys.fc.compute(g.S, host) > 0);
not('data-t="fuse"'); not('Fundir'); assert.strictEqual((H().match(/role="tab"/g) || []).length, 2, 'duas abas sem a chave da fusão'); not('+15 → +16'); has('+14 → +15'); sane('item forjável');
out.push('item forjável: ' + F.DATA.chance[7] + '% + 10% de garantia = ' + c7.chance + '%, barra, custo ' + c7.stones + ' pedras e ' + c7.gold + ' de ouro, texto escapado, 2 abas, tabela até +' + F.DATA.max);

// 3) Forjar chama o módulo e muda o estado: acerto, falha (não tira nível, soma garantia), nova aura ao cruzar a faixa
log.length = 0; rngV = 0; let t0 = st().tries; def.click(btn('forge'));
assert.strictEqual(st().lv.weapon, 8); assert.strictEqual(st().stones, 86 - c7.stones); assert.strictEqual(g.S.gold, 1e6 - c7.gold); assert.strictEqual(st().tries, t0 + 1); assert.strictEqual(st().pity.weapon, 0); assert(log.includes('stats'));
has('Arma +8!'); has('Bônus do espaço +' + Math.round(F.DATA.bonus[8] * 100) + '%'); has('Forja <b>+8 → +9</b>'); assert(X.fx && X.fx.ok === true);
log.length = 0; rngV = 0.999; const c8 = F.canTry(g.S, host, 'weapon'); def.click(btn('forge'));
assert.strictEqual(st().lv.weapon, 8, 'a falha não tira nível'); assert.strictEqual(st().pity.weapon, F.DATA.pityPerFail); assert.strictEqual(st().stones, 86 - c7.stones - c8.stones); assert(log.includes('save') && !log.includes('stats'));
has('Falhou, +' + F.DATA.pityPerFail + '% na próxima'); has('o nível não cai'); assert(X.fx && X.fx.ok === false); sane('depois da falha');
setF('weapon', 9, 0); rngV = 0; def.click(btn('forge')); assert.strictEqual(st().lv.weapon, 10); has('Nova aura: Chamas vermelhas'); assert(X.fx.cross === true); sane('nova aura');
out.push('forjar: acerto sobe o +N e cobra pedras e ouro; falha mantém o nível e soma ' + F.DATA.pityPerFail + '% de garantia; +10 mostra "Nova aura"');

// 4) sem pedras / sem ouro / no teto: o botão explica e NÃO tenta
t0 = st().tries; give(0, 1e6); def.render(); has('aria-disabled="true"'); def.click(btn('forge')); assert.strictEqual(st().tries, t0); assert(/Faltam pedras/.test(X.toast));
def.render(); has('class="f2-toast"'); has('Faltam pedras de forja'); sane('aviso de falta de pedras');   // o aviso aparece, e fora do palco (o sane confere)
give(500, 0); def.render(); def.click(btn('auto')); assert.strictEqual(st().tries, t0); assert(/Falta ouro/.test(X.toast)); assert.strictEqual(X.busy, false);
give(500, 1e6); setF('weapon', F.capOf(host), 0); def.render(); has('no teto da era'); has('Teto da era: <b>+' + F.capOf(host) + '</b>'); not('data-x="forge"'); def.click(btn('forge')); assert.strictEqual(st().tries, t0); assert(/Teto da/.test(X.toast)); sane('teto');
out.push('sem pedras, sem ouro e no teto da era: explica e não chama a tentativa');

// 5) "Forjar até conseguir" para nas TRÊS condições
// 5a) no acerto (3ª tentativa)
setF('weapon', 5, 0); give(500, 1e6); def.onOpen(); def.render(); t0 = st().tries; let seq = [0.999, 0.999, 0]; host.rng = () => seq.length ? seq.shift() : 0.999;
def.click(btn('auto')); assert.strictEqual(X.busy, true); has('Tentativa 1...'); def.click(btn('forge')); assert.strictEqual(st().tries, t0 + 1, 'durante o automático os outros toques esperam'); flush();
assert.strictEqual(st().lv.weapon, 6); assert.strictEqual(st().tries, t0 + 3, 'parou no acerto, nenhuma tentativa a mais'); assert.strictEqual(X.busy, false); assert.strictEqual(X.auto, null); has('Conseguiu na 3ª tentativa'); has('Arma +6!'); assert.strictEqual(timers.length, 0);
// 5b) quando acabam as pedras
host.rng = () => 0.999; setF('weapon', 10, 0); const c12 = F.canTry(g.S, host, 'weapon'); give(c12.stones * 2 + 1, 1e6); def.render(); t0 = st().tries; def.click(btn('auto')); flush();
assert.strictEqual(st().tries, t0 + 2); assert.strictEqual(st().lv.weapon, 10); assert.strictEqual(st().stones, 1); assert.strictEqual(st().pity.weapon, 2 * F.DATA.pityPerFail); assert.strictEqual(X.busy, false); has('Parou: acabaram as pedras'); has('2 tentativas'); sane('parou sem pedras');
// 5c) quando acaba o ouro
setF('weapon', 10, 0); give(5000, Math.floor(c12.gold * 1.5)); def.render(); t0 = st().tries; def.click(btn('auto')); flush();
assert.strictEqual(st().tries, t0 + 1); assert.strictEqual(st().lv.weapon, 10); assert(g.S.gold < c12.gold); assert.strictEqual(X.busy, false); has('Parou: acabou o ouro'); has('1 tentativa ·'); sane('parou sem ouro');
// 5d) fechar a tela no meio para o laço
give(5000, 1e6); setF('weapon', 10, 0); def.render(); t0 = st().tries; def.click(btn('auto')); def.onClose(); flush(); assert.strictEqual(st().tries, t0 + 1, 'fechar a tela para as tentativas'); assert.strictEqual(X.busy, false);
out.push('forjar até conseguir: para no acerto (3ª tentativa), quando acabam as pedras e quando acaba o ouro; fechar a tela também para');

// 6) prévia da aura na legenda e palco: o herói é o do jogo (drawHeroFull), a pé, com o pet (por último) e a aura por código
rngV = 0; host.rng = () => rngV; setF('weapon', 5, 0); def.onOpen(); def.render(); def.click(btn('aura', { v: '13' })); has('Prévia: Dourada com raios (+13)'); has('data-x="pvout"'); sane('prévia');
els.f2_stc = mkEl('f2_stc'); els.f2_stc.getContext = () => ctx; def.render(); assert(raf.length >= 1, 'o palco anima');
for (const v of [0, 4, 7, 10, 13]) { X.apv = v; drawn = 0; heroCalls = []; const f = raf.shift(); f(1000 + v * 100); assert.strictEqual(heroCalls.length, 1, 'um herói por quadro'); const s = heroCalls[0].st; assert.strictEqual(s.mount, false); assert(s.pet === undefined, 'o pet não é escondido (o drawHeroFull desenha por último, na frente)'); assert(s.weapon === undefined && s.wing === undefined, 'arma e asa: as do jogo'); assert(heroCalls[0].k > 0 && isFinite(heroCalls[0].k)); assert(drawn > (v ? 20 : 4), 'aura +' + v + ' desenhada por código'); }
X.fx = { t: Date.now(), ok: true, cross: true, from: 9, to: 10 }; raf.shift()(5000); X.fx = { t: Date.now(), ok: false, cross: false, from: 5, to: 5 }; raf.shift()(5100);
g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(5200); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
def.click(btn('pvout')); not('Prévia:'); assert.strictEqual(X.apv, null); def.onClose(); delete els.f2_stc; raf = [];
out.push('palco: drawHeroFull a pé com o pet, aura por código nas 5 faixas, efeitos de acerto e falha, erro no desenho não derruba a tela');

// 7) asa trancada pelo nível (Sys.stats.slotOpen): mostra o motivo e não tenta
setLv(20); give(5000, 1e6); def.onOpen(); def.render(); has('abre no nível ' + Sys.stats.DATA.wing.minLevel); def.click(btn('slot', { slot: 'wing' })); has('O espaço da asa abre no'); not('data-x="forge"'); t0 = st().tries; def.click(btn('forge')); def.click(btn('auto')); assert.strictEqual(st().tries, t0); sane('asa trancada'); setLv(60);
def.click(btn('slot', { slot: 'armor' })); has('Colete · Armadura'); has('só na arma'); rngV = 0; def.click(btn('forge')); assert.strictEqual(st().lv.armor, 1); has('Colete +1!');
out.push('asa trancada pelo nível: explica e não tenta; outro espaço (colete) forja pelo mesmo caminho');

// 8) Transformar: custo e cobrança do módulo, confirmação DENTRO do jogo
def.click(btn('tab', { t: 'trans' })); has('Essência da Era'); has('Xifos'); has('Grevas'); not('Lâmina &lt;b&gt;'); const it3 = g.S.inv.find(i => i.id === 3), p3 = Sys.stats.canTransform(g.S, host, it3);
assert(p3.essence > 0 && p3.gold > 0); def.click(btn('tsel', { id: '3' })); has('<b>' + p3.essence + '</b>'); has('<b>' + p3.gold + '</b>'); has('11 → 1'); has('Antiguidade <b>→ Industrial</b>'); sane('transformar sem essência');
def.click(btn('trans', { id: '3' })); not('role="dialog"'); assert(/Falta Essência/.test(X.toast), 'sem essência: explica, sem abrir a confirmação');
Sys.loot.ensure(g.S).mat.essence = p3.essence + 3; g.S.gold = p3.gold + 10; def.render(); def.click(btn('trans', { id: '3' })); has('role="dialog"'); has('Transformar?'); has('data-x="askno"'); sane('confirmação');
def.click(btn('askno')); not('role="dialog"'); assert.strictEqual(it3.e, 1); def.click(btn('trans', { id: '3' })); log.length = 0; def.click(btn('transok', { id: '3' }));
assert.strictEqual(it3.e, 4); assert.strictEqual(it3.lvl, 1); assert.strictEqual(it3.look, 1, 'o visual fica'); assert.strictEqual(Sys.loot.essence(g.S), 3); assert.strictEqual(g.S.gold, 10); assert(log.includes('stats') && log.includes('ptrack:transform'));
has('Transformada!'); not('role="dialog"'); not('>Xifos<'); has('Grevas'); sane('depois de transformar');
out.push('transformar: custo do módulo (' + p3.essence + ' essências, ' + p3.gold + ' de ouro), confirmação no jogo, item na era atual com nível 1 e o mesmo visual');

// 9) Fundir: sem a chave do módulo a aba NÃO aparece (nem abre por ação forjada); com a chave (ligada só na memória deste teste) funciona
const QD = Sys.stats.DATA.quality; assert.strictEqual(QD.on, false, 'a fusão está desligada no módulo'); def.click(btn('tab', { t: 'fuse' })); assert.strictEqual(X.tab, 'forge'); not('data-t="fuse"'); not('Fundir');
def.click(btn('fuse')); def.click(btn('gsel', { k: 'x' })); not('Fundir');
QD.on = true; try { for (let i = 0; i < 3; i++) g.S.inv.push({ id: 10 + i, slot: 'hat', e: 4, r: 1, lvl: 5 + i, gold: 10, qp: 2400 + i * 100, name: 'Elmo', subs: [] }); g.S.nextId = 20; g.S.gold = 1e9;
  def.render(); has('data-t="fuse"'); assert.strictEqual((H().match(/role="tab"/g) || []).length, 3); def.click(btn('tab', { t: 'fuse' })); has('Grupos de iguais'); has('pode fundir'); has('Fundir 3 em 1'); has('Estrelas da qualidade'); sane('fundir');
  const n1 = g.S.inv.length; log.length = 0; def.click(btn('fuse')); assert.strictEqual(g.S.inv.length, n1 - 2, '3 viram 1'); const made = g.S.inv[g.S.inv.length - 1]; assert.strictEqual(Sys.stats.qualityStars(Sys.stats.qpOf(made)), 3); assert.strictEqual(made.lvl, 7); assert(g.S.gold < 1e9); assert(log.includes('stats')); has('3 estrelas'); sane('depois de fundir');
} finally { QD.on = false; }
def.render(); assert.strictEqual(X.tab, 'forge', 'chave desligada de novo: a tela volta para Forjar'); not('data-t="fuse"'); not('Fundir');
out.push('fundir: sem Sys.stats.DATA.quality.on a aba não existe; com a chave (só neste teste) 3 iguais viram 1 com +1 estrela');

// 10) Forja +16 a +20: só o que o módulo permitir (a tela lê os vetores do módulo)
g.S.inv = g.S.inv.filter(i => i.id < 10); host._eraMax = 8; setF('weapon', 15, 0); give(5000, 1e9); def.onOpen({ slot: 'weapon' }); def.render(); has('Este espaço chegou ao máximo: <b>+15</b>'); not('+15 → +16'); not('data-x="forge"'); not('ERAS FINAIS');
F.setForge20(true); try { def.render(); has('Forja <b>+15 → +16</b>'); has('+19 → +20'); has('ERAS FINAIS'); has(F.DATA.chance[15] + '%'); rngV = 0; def.click(btn('forge')); assert.strictEqual(st().lv.weapon, 16); sane('forja 20'); } finally { F.setForge20(false); }
def.render(); not('+15 → +16'); host._eraMax = 4;
out.push('+16 a +20: fora com a chave do módulo desligada; com ela (só neste teste) a tabela e a tentativa aparecem sozinhas');

// 11) todos os botões de todas as abas: tocar em cada um não gera exceção
g.S = newSave(); setLv(60); g.S.inv = [{ id: 1, slot: 'weapon', e: 4, r: 2, lvl: 20, gold: 500, name: 'Lâmina', subs: [] }, { id: 3, slot: 'weapon', e: 1, r: 3, lvl: 11, gold: 2400, name: 'Xifos', subs: [] }]; g.S.eq = { weapon: 1 }; g.S.nextId = 4; give(60, 1e5); Sys.loot.ensure(g.S).mat.essence = 100; rngV = 0.5;
let taps = 0; for (const tab of ['forge', 'trans']) { def.onOpen({ tab }); def.render(); for (const b of buttons()) { def.onOpen({ tab }); def.render(); try { def.click(b); flush(); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane('toque ' + b.dataset.x); } }
def.tick(); def.onClose(); assert.strictEqual(def.busy(), false);
out.push('toques: ' + taps + ' botões das abas tocados sem exceção, tela sempre íntegra');

// 12) QA 320 px, defeito 1: nenhum título cortado com reticências. A folha de estilo não usa text-overflow:ellipsis em lugar nenhum e os títulos e
// rótulos (espaço e nome do item, raridade, linha da Forja, abas, botões, células de custo, lista, tabela) quebram linha em vez de cortar
{ const css = CSS(); assert(!/text-overflow\s*:\s*ellipsis/.test(css) && !/text-overflow\s*:\s*ellipsis/.test(SRC), 'a folha de estilo não corta texto com reticências');
  for (const sel of ['.f2-who span', '.f2-dn', '.f2-dh', '.f2-tab', '.f2-bt span', '.f2-bt small', '.f2-chn small', '.f2-sts small', '.f2-sts b', '.f2-sts em', '.f2-row .tx b', '.f2-row .tx small', '.f2-ac small', '.f2-tbl>span', '.f2-fcb b', '.f2-fcb em', '.f2-slot .sl', '.f2-trio .q small', '.f2-bands small']) { const r = rule(sel);
    assert(/white-space:normal/.test(r) && /overflow-wrap:anywhere/.test(r), sel + ': quebra linha'); assert(!/white-space:nowrap|overflow:hidden/.test(r), sel + ': não corta'); }
  assert(!/white-space:nowrap|[;{]height:/.test(rule('.f2-who')) && !/[;{]height:/.test(rule('.f2-tab')), 'a faixa do herói e as abas crescem com o texto (sem altura fixa)');
  assert(/min-height:40px/.test(rule('.f2-tab')) && /min-height:44px/.test(rule('.f2-bt')) && /min-width:0/.test(rule('.f2-bt')), 'toque de pelo menos 40 px e botões que encolhem (min-width:0)');
  assert(/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/.test(css) && /repeat\(2,minmax\(0,1fr\)\)/.test(SRC), 'sem rolagem lateral: colunas minmax(0,1fr)');
  // o caso do QA: espaço "Chapéu/Elmo" vazio, em 320 px
  g.xDims = () => ({ H: 560, Wb: 320 }); def.onOpen({ slot: 'hat' }); def.render(); has('Chapéu/Elmo · espaço vazio'); has('grid-template-columns:repeat(2,minmax(0,1fr))'); sane('320 px'); g.xDims = () => ({});
  out.push('320 px: nenhuma regra com reticências; espaço, item, raridade, abas, botões, custos, lista e tabela quebram linha'); }
// 13) QA lote V2 (A1): os avisos (mensagem, faixa do resultado, "+FC") moram numa LINHA PRÓPRIA do fluxo, entre as abas e o cartão "+N → +N+1": não é presa
// por cima de nada (sem absolute/fixed), tem altura reservada (a tela não pula) e existe vazia quando não há aviso (a ordem no HTML é conferida em toda tela pelo sane)
{ const n = rule('.f2-notes'); assert(!/position:(absolute|fixed|sticky)/.test(n) && !/[;{](top|bottom|left|right):/.test(n), 'a linha de avisos é do fluxo, não fica por cima de nada');
  assert(/flex:none/.test(n) && /min-height:40px/.test(n), 'altura reservada: a tela não pula quando o aviso entra'); assert(/pointer-events:none/.test(n), 'a linha de avisos não segura toque');
  for (const sel of ['.f2-toast', '.f2-ban', '.f2-fly']) { const r = rule(sel); assert(!/position:|[;{](top|bottom|left|right):/.test(r), sel + ': sem posição própria (segue a linha de avisos)'); }
  for (const k of ['f2-tin', 'f2-fly', 'f2-bin']) { const css = CSS(), i = css.indexOf('@keyframes ' + k + '{'); assert(i >= 0 && !/translate/.test(css.slice(i, css.indexOf('\n', i))), k + ': a animação não desloca o aviso para cima dos vizinhos'); }
  assert.deepStrictEqual([...seenNotes].sort(), ['f2-ban', 'f2-fly', 'f2-toast'], 'os três avisos apareceram em alguma tela conferida, sempre na linha de avisos');
  g.S = newSave(); setLv(60); def.onOpen({ slot: 'weapon' }); def.render(); const h = H(), a = h.indexOf('<div class="f2-notes" id="f2_notes">'), b = h.indexOf('<div id="f2_scroll"');
  assert(a > 0 && b > a && h.slice(a, b) === '<div class="f2-notes" id="f2_notes"><div id="f2_toast"></div></div>', 'sem aviso, a linha existe vazia');
  assert(h.indexOf('role="tablist"') < a, 'a linha de avisos fica abaixo das abas, logo acima do cartão');
  // acerto com troca de aura: UMA faixa (título com o +N, 2ª linha com a aura nova) e o "+FC" ao lado, tudo antes da rolagem; os botões seguem tocáveis no HTML
  g.S.inv = [{ id: 1, slot: 'weapon', e: 4, r: 2, lvl: 20, gold: 500, name: 'Lâmina', subs: [] }]; g.S.eq = { weapon: 1 }; g.S.nextId = 2; setF('weapon', 9, 0); give(500, 1e6); rngV = 0; def.render(); def.click(btn('forge'));
  const h2 = H(), s2 = h2.indexOf('<div id="f2_scroll"'), nt = h2.slice(h2.indexOf('id="f2_notes"'), s2);
  assert(/class="f2-ban ok au"/.test(nt) && nt.includes('Arma +10!') && nt.includes('Nova aura: Chamas vermelhas') && /class="f2-fly"/.test(nt), 'faixa única e +FC na linha de avisos');
  assert(h2.indexOf('data-x="forge"') > s2 && h2.indexOf('data-x="auto"') > s2 && h2.indexOf('class="f2-lvb"') > s2, 'botões e o "+N → +N+1" ficam fora da linha de avisos'); sane('faixa única');
  def.onClose(); out.push('avisos: linha própria no fluxo (.f2-notes, 40 px reservados, sem absolute/fixed), entre as abas e o cartão; uma faixa por vez; vazia sem aviso'); }
// 13b) QA lote V2 (A2): em tela baixa (320x640 e 360x640; a altura vem do xDims) o palco encolhe sem baixar de 40 px de toque nos espaços, as margens apertam
// (.f2-sm) e os botões Forjar / Forjar até conseguir sobem para logo abaixo da chance (antes das células de custo). Em tela alta nada muda.
{ g.S = newSave(); setLv(60); g.S.inv = [{ id: 1, slot: 'weapon', e: 4, r: 2, lvl: 20, gold: 500, name: 'Clava de Pedra', subs: [] }]; g.S.eq = { weapon: 1 }; g.S.nextId = 2; give(500, 1e6);
  const stageH = () => +(/class="f2-stage" style="height:(\d+)px"/.exec(H()) || [])[1], pitches = () => [...H().matchAll(/class="f2-slot[^"]*"[^>]*;height:(\d+)px/g)].map(m => +m[1]);
  for (const [W, Hh] of [[320, 584], [360, 584], [320, 560], [320, 480]]) { g.xDims = () => ({ H: Hh, Wb: W }); def.onOpen({ slot: 'weapon' }); def.render(); const h = H(), sh = stageH(), p = pitches();
    assert(/<div class="f2 f2-sm/.test(h), W + 'x' + Hh + ': arranjo compacto'); assert(sh >= 166 && sh <= 196 && sh <= Hh - 400 + 166, W + 'x' + Hh + ': palco menor (' + sh + ')');
    assert.strictEqual(p.length, F.DATA.slots.length); assert(p.every(v => v >= 40), W + 'x' + Hh + ': espaços com 40 px de toque');
    const iGo = h.indexOf('data-x="forge"'), iAuto = h.indexOf('data-x="auto"'), iSts = h.indexOf('class="f2-sts"'), iChn = h.indexOf('class="f2-chn"'), iCmp = h.indexOf('class="f2-cmp"');
    assert(iChn > 0 && iGo > iChn && iAuto > iGo && iSts > iAuto && iCmp > iSts, W + 'x' + Hh + ': botões logo abaixo da chance, antes dos custos');
    has('pedras · '); has('FC ANTES → DEPOIS'); has('A falha nunca tira nível'); sane('tela baixa ' + W + 'x' + Hh); }
  g.xDims = () => ({ H: 584, Wb: 320 }); def.render(); assert.strictEqual(stageH(), 184, '320x640: palco pela altura disponível');
  for (const d of [{ H: 788, Wb: 390 }, {}]) { g.xDims = () => d; def.onOpen({ slot: 'weapon' }); def.render(); const h = H(); assert(!/f2-sm/.test(h) && stageH() === 236, 'tela alta: arranjo do protótipo'); assert(h.indexOf('class="f2-sts"') < h.indexOf('data-x="forge"'), 'tela alta: custos antes dos botões'); sane('tela alta'); }
  for (const sel of ['.f2-sm .f2-fcb b', '.f2-sm .f2-chip', '.f2-sm .f2-det', '.f2-sm .f2-chn']) rule(sel);
  assert(!/\.f2-sm[^{]*\{[^}]*(nowrap|ellipsis|overflow:hidden)/.test(CSS()), 'o arranjo compacto não corta texto'); assert(/min-height:44px/.test(rule('.f2-bt')) && !/\.f2-sm \.f2-(bt|tab)\b/.test(CSS()), 'compacto não mexe no toque de botões e abas');
  g.xDims = () => ({}); def.onClose(); out.push('tela baixa (320x640, 360x640): palco de 184 px pela altura do xDims (mínimo 166, toque de 40 px nos espaços), margens menores e Forjar logo abaixo da chance'); }
// 14) defeito 3: a Forja V2 não tem espera de imagens (nenhum cartaz de carregamento): desenha na hora mesmo com a espera do jogo dizendo "ainda não"
{ assert(!/\b(xGate|pGate|pwGate|pWait)\s*\(/.test(SRC), 'a tela não chama a espera de imagens');
  const poster = () => { g.V.innerHTML = '<span>Carregando as imagens</span>'; return true; }; g.xGate = poster; g.pGate = poster; g.pwGate = poster; g.Preload = { ready: () => Promise.resolve({ ok: false, failed: [] }), has: () => false };
  def.onOpen(); def.render(); not('Carregando'); has('PODER (FC)'); has('id="f2_stc"'); sane('sem cartaz'); delete g.xGate; delete g.pGate; delete g.pwGate; delete g.Preload; def.onClose();
  out.push('carga: a Forja V2 desenha na hora, sem cartaz de carregamento'); }
// 15) FORJA ASTRAL +21..+25 (Sys.erasEnd REAL): só com o módulo ligado e o espaço no +20; regra, chance, custo e garantia do módulo; desligado = a tela de sempre
{ require(path.join(R, 'js/sys/erasend.js')); const E = Sys.erasEnd; assert.strictEqual(E.DATA.on, false, 'Sys.erasEnd nasce desligado'); const A = E.DATA.astral;
  g.S = newSave(); setLv(60); F.setForge20(true); F.ensure(g.S).lv.weapon = 20; def.onOpen(); X.slot = 'weapon'; def.render();
  has('Este espaço chegou ao máximo'); not('data-x="astral"'); not('Forja Astral'); const s0 = JSON.stringify(g.S); def.click(btn('astral')); assert.strictEqual(JSON.stringify(g.S), s0, 'desligado: o toque não faz nada'); assert.strictEqual(g.S.sys.erasEnd, undefined, 'desligado: nada no save');
  E.DATA.on = true; def.render(); has('Forja Astral · +20 → +21'); has('O +21 abre ao vencer a fase ' + A.unlockStage[0] + '.'); has('data-x="astral" aria-disabled="true"'); not('Este espaço chegou ao máximo'); sane('astral: marco');
  def.click(btn('astral')); assert.strictEqual(E.astralLevel(g.S, 'weapon'), 0); assert(/Vença o próximo marco/.test(X.toast), X.toast);
  E.ensure(g.S).marks.push(A.unlockStage[0]); def.render(); has('Faltam pedras astrais: tem 0, a tentativa pede ' + A.stones[0] + '.'); has('aria-disabled="true"'); def.click(btn('astral')); assert(/Faltam pedras astrais/.test(X.toast)); sane('astral: sem pedras');
  E.ensure(g.S).stones = 10; def.render(); has('data-x="astral" aria-disabled="false"'); has('Pedras astrais: 10'); has('>' + A.stones[0] + ' pedras astrais<'); has(String(A.chance[0]) + '%'); sane('astral: pronta');
  rngV = 0.999; log.length = 0; def.click(btn('astral')); assert.strictEqual(E.astralLevel(g.S, 'weapon'), 0, 'a falha não tira nem dá nível'); assert.strictEqual(E.ensure(g.S).stones, 10 - A.stones[0]); assert.strictEqual(F.ensure(g.S).lv.weapon, 20, 'o +20 da Forja fica');
  has('Falhou, +' + A.pityPerFail + '% na próxima'); has('o nível não cai'); has(String(A.chance[0] + A.pityPerFail) + '%'); assert(log.includes('save')); sane('astral: falha');
  rngV = 0; log.length = 0; def.click(btn('astral')); assert.strictEqual(E.astralLevel(g.S, 'weapon'), 1); assert.strictEqual(E.totalLevel(g.S, 'weapon'), 21); assert.strictEqual(E.ensure(g.S).stones, 10 - 2 * A.stones[0]); assert(log.includes('stats'), 'recalcula a FC');
  has('+21!'); has('Forja Astral · +21 → +22'); has('O +22 abre ao vencer a fase ' + A.unlockStage[1] + '.'); sane('astral: subiu');
  E.ensure(g.S).lv.weapon = A.levels.length; def.render(); has('Forja Astral · +25 · máximo'); not('data-x="astral"'); sane('astral: máximo');
  /* teto da Forja no +15 (a f20 desligada): a Astral responde "base" e a tela fica como sempre, sem prometer o +21 */
  g.S = newSave(); setLv(60); F.setForge20(false); F.ensure(g.S).lv.weapon = F.DATA.max; def.render(); has('Este espaço chegou ao máximo'); not('data-x="astral"'); not('Forja Astral ·'); not('Pedras astrais'); sane('astral: base');
  E.DATA.on = false; def.onClose();
  out.push('Forja Astral: desligada = tela de sempre; ligada no +20 mostra chance, pedras e motivo (marco, pedras); falha não tira nível e soma garantia; sucesso +21 recalcula a FC; +25 = máximo; teto +15 = tela de sempre'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
