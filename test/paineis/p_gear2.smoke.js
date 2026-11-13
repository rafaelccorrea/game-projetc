'use strict';
// Teste de fumaça do js/p_gear2.js (EQUIPAMENTO + MOCHILA V2) em Node: DOM de mentira, módulos REAIS de js/sys (level, loot, stats, forge, fc, assets, pet, mount).
// Rodar: node test/paineis/p_gear2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['level', 'loot', 'stats', 'forge', 'fc', 'assets', 'pet', 'mount'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, T = Sys.stats, F = Sys.forge;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 236, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
const SLOT_FILE = { weapon: 'weapon', armor: 'vest', hat: 'helmet', gloves: 'gloves', boots: 'boots', necklace: 'necklace', wing: 'wings' };
g.SLOT = { weapon: { n: 'Arma' }, armor: { n: 'Colete' }, hat: { n: 'Chapéu/Elmo' }, gloves: { n: 'Luvas' }, boots: { n: 'Botas' }, necklace: { n: 'Colar' }, wing: { n: 'Asa' } };
g.ICON = {}; Object.keys(g.SLOT).forEach(s => { g.ICON[s] = 'data:image/svg+xml;utf8,' + s; });
g.slotIcon = (s, e) => 'assets/icons/slots/era' + Math.max(0, Math.min(8, e | 0)) + '_' + SLOT_FILE[s] + '.png';
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.ieraV = it => Math.max(0, Math.min(g.ERAS.length - 1, Number.isInteger(it.look) ? it.look : it.e | 0)); g.iname = it => it.name || 'Peça';
g.RAR = [{ n: 'Básico', c: '#e8e2d8' }, { n: 'Raro', c: '#4aa3ff' }, { n: 'Épico', c: '#b07cff' }, { n: 'Mítico', c: '#ff5a5a' }, { n: 'Lendário', c: '#ffc94a' }];
g.SKIN = id => ({ id, slot: id[0] === 'w' ? 'weapon' : 'armor', e: +id[1], r: +id[2] });
const host = makeHost({ seed: 7, stage: 25, eraMax: 4 });
host.canSpendGold = n => n >= 0 && g.S.gold >= n; host.spendGold = n => { if (!(n >= 0) || g.S.gold < n) return false; g.S.gold -= n; return true; }; host.addGold = n => { g.S.gold += Math.max(0, n || 0); };
host.equipped = () => { const o = {}; for (const s in g.S.eq) { const it = g.S.inv.find(i => i.id === g.S.eq[s]); if (it) o[s] = it; } return o; };
host.thumb = it => { if (!(it && g.SLOT[it.slot])) return g.ICON.armor; const u = g.slotIcon(it.slot, Number.isInteger(it.look) ? it.look : it.e); try { return Sys.assets.tierIcon(u, it.r); } catch (e) { return u; } };   // igual ao Sys.host.thumb do js/farm.js
Sys.host = host;
const newSave = () => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: 'kael', set: {} });
const setLv = n => { Sys.level.ensure(g.S).lvl = n; };
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'gear2'; g.PANEL_ON = {};
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xBagMax = () => 80; g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.5),rgba(13,10,8,.9)),url(assets/bg/era2.png) center top/cover no-repeat,#16110d';
g.needMsg = (c, v) => 'Ouro insuficiente: faltam ' + Math.ceil(v - g.S.gold);
const log = []; g.snd = n => log.push('snd:' + n); g.statsChanged = () => log.push('stats'); g.ptrack = (e, n) => log.push('ptrack:' + e + ':' + n); g.tutEvent = e => log.push('tut:' + e);
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = '', opened = [], openOk = true;
g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n, o) { opened.push({ n, o }); return openOk; } };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_gear2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_gear2.js' });
const X = g.Gear2.X, CFG = g.Gear2.cfg, out = [];
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const seen = new Set();
/* todo <button> tem data-x e a ação está na lista de ações tratadas; sem emoji; sem "undefined"/"NaN"; sem diálogo do navegador; toda imagem citada existe em disco */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/comprar|sorteio/i.test(H()), what + ': texto proibido');
  const imgs = [...H().matchAll(/<img[^>]*\ssrc="([^"]*)"/g)].map(m => un(m[1])).concat([...H().matchAll(/url\(([^)]+)\)/g)].map(m => m[1]));
  for (const u of imgs) { assert(u, what + ': imagem sem endereço'); if (u.startsWith('data:')) continue; assert(fs.existsSync(path.join(R, u)), what + ': imagem não existe: ' + u); seen.add(u); }
  return bt.length; };
const fc = o => Sys.fc.compute(g.S, host, o), eqId = s => g.S.eq[s], item = id => g.S.inv.find(i => i.id === id);
const TABS = ['weapon', 'gear', 'wing', 'pets', 'mounts', 'skins', 'mats', 'cons'];
const allTabs = what => { for (const t of TABS) { def.click(btn('tab', { t })); assert.strictEqual(X.tab, t); sane(what + ' aba ' + t); } def.click(btn('tab', { t: 'weapon' })); };

// 0) registro: painel 'gear2', chave nasce DESLIGADA, o arquivo não liga chave nenhuma, sem diálogo do navegador, sem emoji
assert.strictEqual(addName, 'gear2'); assert.strictEqual(g.PANEL_ON.gear2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.busy);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setEra9\s*\(|setForge20\s*\(/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
out.push('registro: gear2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji no arquivo');

// 1) save novo (nível 1, mochila vazia, nada equipado): a tela inteira desenha sem erro, nas 8 abas, em 390 e em 320 px
def.onOpen(); def.render(); has('PODER (FC)'); has('id="g2_stc"'); has('Kael · Nível 1'); has('Você já usa o melhor que tem'); has('Mochila <b>0/80</b>'); has('Nada aqui ainda');
has('url(assets/bg/era2.png)'); assert(!/class="g2-bg" style="background:linear-gradient\([^u]*\)"/.test(H()), 'fundo = cenário da era, não degradê puro');
assert.strictEqual((H().match(/data-x="slot"/g) || []).length, T.DATA.slots.length, 'os 7 espaços em volta do herói'); assert.strictEqual((H().match(/role="tab"/g) || []).length, 8, 'as 8 abas');
has('abre no nível ' + T.DATA.wing.minLevel); sane('save novo'); allTabs('save novo');
dims = { H: 512, Wb: 320 }; def.onOpen(); def.render(); has('font-size:21px'); sane('save novo 320'); allTabs('save novo 320'); dims = {};
def.click(btn('best')); assert.deepStrictEqual(g.S.eq, {}); assert(/já está com o melhor/.test(X.toast));
out.push('save novo: tela inteira sem erro (7 espaços, FC, 8 abas), em 390 e 320 px; "Equipar o melhor" sem nada não quebra');

// 2) mochila cheia de itens variados (todos os espaços, eras 0-6, 5 raridades, níveis 1-60) + pet e montaria
g.S = newSave(); setLv(60); g.S.gold = 5e6; let id = 1; const slots = T.DATA.slots;
for (let k = 0; k < 77; k++) { const slot = slots[k % slots.length], r = slot === 'wing' ? 2 + (k % 3) : k % 5; g.S.inv.push({ id: id++, slot, e: Math.floor(k / 7) % 7, r, lvl: 1 + (k * 7) % 60, gold: 100 * k, name: slot + ' ' + k, subs: [] }); }
g.S.inv.push({ id: id++, slot: 'weapon', e: 2, r: 2, lvl: 12, gold: 500, name: 'Lâmina <b>Rúnica</b> "do" & Rei', subs: [] }); g.S.nextId = id;
for (const s of slots) g.S.eq[s] = g.S.inv.find(i => i.slot === s && (s !== 'wing' || T.canEquip(i, 60))).id;
F.ensure(g.S).lv.weapon = 7; F.ensure(g.S).lv.armor = 3;
{ const po = Sys.pet.ensure(g.S), pid = Sys.pet.DATA.pets[0].id; po.owned[pid] = { stars: 1, lvl: 1 }; po.eq = pid; const mo = Sys.mount.ensure(g.S); mo.owned.horse = { lvl: 1, stars: 1 }; mo.owned.wolf = { lvl: 2, stars: 1 }; mo.eq = 'horse'; }
def.onOpen(); def.render(); has('Mochila <b>78/80</b>'); has('Kael · Nível 60'); has('<span class="fg">+7</span>'); has('class="eqb">Usando'); sane('mochila cheia');
assert.strictEqual((H().match(/data-x="item"/g) || []).length, g.S.inv.filter(i => i.slot === 'weapon').length, 'aba Armas mostra todas as armas'); not('<b>Rúnica</b>');
for (const t of ['weapon', 'gear', 'wing']) { def.click(btn('tab', { t })); const n = g.S.inv.filter(i => t === 'weapon' ? i.slot === 'weapon' : t === 'wing' ? i.slot === 'wing' : i.slot !== 'weapon' && i.slot !== 'wing').length;
  assert.strictEqual((H().match(/data-x="item"/g) || []).length, n, 'aba ' + t + ' mostra as peças dela');
  for (let i = 0; i < 4; i++) { def.click(btn('sort')); sane(t + ' ordem ' + X.sort); const ids = [...H().matchAll(/data-x="item" data-id="(\d+)"/g)].map(m => +m[1]); assert.strictEqual(ids.length, n); assert.strictEqual(item(ids[0]).id, eqId(item(ids[0]).slot), 'a peça em uso vem primeiro'); }
  for (let i = 0; i < 7; i++) { def.click(btn('rf')); sane(t + ' raridade ' + X.rf); if (X.rf >= 0) for (const m of H().matchAll(/data-x="item" data-id="(\d+)"/g)) assert.strictEqual(item(+m[1]).r, X.rf); }
  X.rf = -1; }
def.click(btn('tab', { t: 'gear' })); for (let i = 0; i < 6; i++) { def.click(btn('sf')); sane('peça ' + X.sf); if (X.sf !== 'all') for (const m of H().matchAll(/data-x="item" data-id="(\d+)"/g)) assert.strictEqual(item(+m[1]).slot, X.sf); } assert.strictEqual(X.sf, 'all');
// ordem por FC: depois da peça em uso, o ganho (FC com a peça - FC de agora) só desce
def.click(btn('tab', { t: 'weapon' })); X.sort = 'fc'; def.render(); { const ids = [...H().matchAll(/data-x="item" data-id="(\d+)"/g)].map(m => +m[1]).slice(1), gs = ids.map(i => fc({ item: item(i) })); for (let i = 1; i < gs.length; i++) assert(gs[i] <= gs[i - 1], 'ordem por FC'); }
allTabs('mochila cheia'); def.click(btn('tab', { t: 'pets' })); has(Sys.pet.DATA.pets[0].name); has('data-to="pets"'); def.click(btn('tab', { t: 'mounts' })); has('assets/icons/mounts/horse.png'); has('assets/icons/mounts/wolf.png'); def.click(btn('tab', { t: 'mats' })); has('Pedras de forja'); has('Essência da Era');
dims = { H: 512, Wb: 320 }; def.onOpen({ tab: 'gear' }); def.render(); sane('mochila cheia 320'); allTabs('mochila cheia 320'); dims = {};
out.push('mochila cheia: 78 peças variadas, abas, filtro por peça e raridade, 3 ordens (em uso primeiro; por FC o ganho só desce), pets, montarias e materiais; texto escapado');

// 3) equipar: tocou, trocou (regra do protótipo). Troca S.eq, a FC é a do Sys.fc, a faixa mostra "novo × o seu" e o Voltar desfaz
def.onOpen({ tab: 'weapon' }); def.render();
{ const cur = eqId('weapon'), cand = g.S.inv.filter(i => i.slot === 'weapon' && i.id !== cur).sort((a, b) => fc({ item: b }) - fc({ item: a }))[0], f0 = fc(), f1 = fc({ item: cand });
  assert(f1 > f0 + 1, 'o candidato é melhor'); assert(new RegExp('data-id="' + cand.id + '"[^>]*>(?:(?!</button>).)*class="ar"').test(H()), 'seta verde na peça melhor'); assert(/espaços? t[eê]m peça melhor/.test(H()));
  log.length = 0; def.click(btn('item', { id: String(cand.id) }));
  assert.strictEqual(eqId('weapon'), cand.id, 'equipar troca o S.eq'); assert.strictEqual(fc(), f1, 'a FC depois é a do módulo'); assert(fc() !== f0, 'a FC mudou'); assert(log.includes('stats') && log.includes('tut:view'));
  has('FC ANTES → AGORA'); has('>' + Sys.fc.viewText(f0) + '</span>'); has('>' + Sys.fc.viewText(f1) + '</span>'); has('+' + Sys.fc.viewText(f1 - f0)); has('>AGORA<'); has('>ANTES<'); has('data-x="undo"'); has('Usando'); has('g2-fly'); has('ATQ'); has('CRÍT');
  assert(/Equipou: /.test(X.toast)); not('data-x="equip"'); sane('depois de equipar');
  def.click(btn('undo')); assert.strictEqual(eqId('weapon'), cur, 'Voltar desfaz'); assert.strictEqual(fc(), f0); has('FC ATUAL → NOVA'); has('>NOVO<'); has('>O SEU<'); has('data-x="equip"'); has('+' + Sys.fc.viewText(f1 - f0)); sane('depois de voltar');
  def.click(btn('equip', { id: String(cand.id) })); assert.strictEqual(eqId('weapon'), cand.id, 'o botão Equipar também troca'); def.click(btn('close')); not('id="g2_det"'); assert.strictEqual(eqId('weapon'), cand.id);
  // espaço vazio: equipar e voltar deixa vazio de novo
  delete g.S.eq.boots; const b = g.S.inv.find(i => i.slot === 'boots'); def.onOpen({ slot: 'boots' }); def.render(); has('>Botas<'); def.click(btn('item', { id: String(b.id) })); assert.strictEqual(eqId('boots'), b.id); has('FC SEM → COM ELA'); def.click(btn('undo')); assert(!('boots' in g.S.eq), 'voltar para o espaço vazio');
  def.click(btn('item', { id: String(b.id) })); assert.strictEqual(eqId('boots'), b.id);
  // peça em uso tocada: só mostra (FC sem → com ela), não mexe; texto do nome escapado
  const rk = g.S.inv.find(i => /Rúnica/.test(i.name)); g.S.eq.weapon = rk.id; def.onOpen({ tab: 'weapon' }); def.render(); def.click(btn('item', { id: String(rk.id) })); has('FC SEM → COM ELA'); has('Lâmina &lt;b&gt;Rúnica&lt;/b&gt; &quot;do&quot; &amp; Rei'); not('<b>Rúnica</b>'); has('Forja +7'); sane('peça em uso');
  g.S.eq.weapon = cand.id; }
// toque = só prévia (Gear2.cfg.tapSwap=false): nada muda no save; a arma vai para o herói pelo state.weapon; o botão Equipar troca
CFG.tapSwap = false; try { const cur = eqId('weapon'), w = g.S.inv.find(i => i.slot === 'weapon' && i.id !== cur); def.onOpen({ tab: 'weapon' }); def.render(); def.click(btn('item', { id: String(w.id) }));
  assert.strictEqual(eqId('weapon'), cur, 'só prévia: não equipa'); assert.strictEqual(X.pv, w.id); has('Prévia: ' + g.esc2(w.name)); has('data-x="pvout"'); has('FC ATUAL → NOVA'); has('data-x="equip"'); sane('prévia');
  els.g2_stc = mkEl('g2_stc'); els.g2_stc.getContext = () => ctx; def.render(); heroCalls = []; raf.shift()(1000); assert.strictEqual(heroCalls.length, 1); assert.strictEqual(heroCalls[0].st.weapon.id, 'w' + T.DATA.weaponTypes[T.weaponType(w)].artEra + Math.min(4, w.r), 'a arma da prévia vai NO herói');
  def.click(btn('pvout')); not('Prévia:'); assert.strictEqual(X.pv, null); raf.shift()(1100); assert(heroCalls[1].st.weapon === undefined, 'fora da prévia: a arma do jogo');
  def.click(btn('item', { id: String(w.id) })); def.click(btn('equip', { id: String(w.id) })); assert.strictEqual(eqId('weapon'), w.id); assert.strictEqual(X.pv, null); delete els.g2_stc; raf = []; def.onClose(); } finally { CFG.tapSwap = true; }
out.push('equipar: o toque troca S.eq e a FC (Sys.fc), faixa "novo × o seu" com FC antes → agora e atributos, Voltar desfaz (até para espaço vazio); com tapSwap desligado o toque só mostra a prévia no herói');

// 4) equipar o melhor: por espaço, a peça de MAIOR ganho de FC (conferido por força bruta, fora da tela)
{ for (const s of slots) g.S.eq[s] = g.S.inv.filter(i => i.slot === s && T.canEquip(i, 60)).sort((a, b) => a.lvl - b.lvl || a.r - b.r)[0].id;   // começa com as piores
  const f0 = fc(), want = {}, sim = Object.assign({}, g.S.eq), real = g.S.eq; g.S.eq = sim;
  for (let pass = 0, ch = 1; pass < 4 && ch; pass++) { ch = 0; for (const s of slots) { let best = sim[s], bf = fc(); for (const x of g.S.inv) { if (x.slot !== s || !T.canEquip(x, 60)) continue; const v = fc({ item: x }); if (v > bf + 0.5) { bf = v; best = x.id; } } if (best !== sim[s]) ch++; sim[s] = best; want[s] = best; } } const fBest = fc(); g.S.eq = real;
  def.onOpen(); def.render(); has('espaços têm peça melhor'); log.length = 0; def.click(btn('best'));
  assert.deepStrictEqual(Object.assign({}, g.S.eq), want, 'equipar o melhor escolhe o de maior ganho em cada espaço'); assert.strictEqual(fc(), fBest); assert(fc() > f0); assert(log.includes('stats')); assert(/peças trocadas · FC \+/.test(X.toast)); has('g2-fly'); has('Você já usa o melhor que tem'); sane('depois do melhor');
  for (const s of slots) for (const x of g.S.inv) if (x.slot === s && x.id !== eqId(s) && T.canEquip(x, 60)) assert(fc({ item: x }) <= fc() + 0.5, 'nenhuma troca sozinha melhora mais');
  log.length = 0; const snapEq = JSON.stringify(g.S.eq); def.click(btn('best')); assert.strictEqual(JSON.stringify(g.S.eq), snapEq); assert(/já está com o melhor/.test(X.toast)); assert(!log.includes('stats'));
  // quando o gBest do jogo existe, é ele que decide (mesma conta; aqui um espião)
  let spy = 0; g.gBest = () => { spy++; return g.Gear2.best(); }; g.S.eq.hat = g.S.inv.filter(i => i.slot === 'hat').sort((a, b) => fc({ item: a }) - fc({ item: b }))[0].id; def.render(); def.click(btn('best')); assert(spy >= 1, 'usa o gBest do jogo'); assert.strictEqual(eqId('hat'), want.hat); delete g.gBest; }
out.push('equipar o melhor: em cada espaço fica a peça de maior FC (igual à força bruta), a FC sobe, o segundo toque não muda nada; com o gBest do jogo presente, usa ele');

// 5) desmontar: confirmação no jogo; tira da mochila e devolve ouro e pedras do módulo; item em uso NUNCA
{ const it = g.S.inv.find(i => i.slot === 'armor' && i.id !== eqId('armor') && i.gold > 0 && i.r >= 1), n0 = g.S.inv.length, g0 = g.S.gold, s0 = F.ensure(g.S).stones, wantG = T.dismantleGold(it), wantS = Sys.loot.DATA.dismantle.forge[it.r];
  assert(wantG > 0 && wantS > 0); CFG.tapSwap = false; def.onOpen({ slot: 'armor' }); def.render(); def.click(btn('item', { id: String(it.id) })); CFG.tapSwap = true; has('data-x="dism" data-id="' + it.id + '"');
  def.click(btn('dism', { id: String(it.id) })); has('role="dialog"'); has('Desmontar?'); has('+' + g.kf(wantG) + ' de ouro'); has('+' + wantS + ' pedra'); has('data-x="askno"'); assert.strictEqual(g.S.inv.length, n0, 'pedir não desmonta'); sane('confirmação');
  def.click(btn('best')); def.click(btn('item', { id: String(g.S.inv[0].id) })); has('role="dialog"');   // com a confirmação aberta o resto espera
  def.click(btn('askno')); not('role="dialog"'); assert.strictEqual(g.S.inv.length, n0); assert.strictEqual(g.S.gold, g0);
  def.click(btn('dism', { id: String(it.id) })); log.length = 0; def.click(btn('dismok', { id: String(it.id) }));
  assert.strictEqual(g.S.inv.length, n0 - 1); assert(!item(it.id), 'saiu da mochila'); assert.strictEqual(g.S.gold, g0 + wantG, 'devolve o ouro do módulo'); assert.strictEqual(F.ensure(g.S).stones, s0 + wantS, 'e as pedras de forja'); assert(log.includes('stats')); assert(/Desmontou /.test(X.toast)); not('role="dialog"'); has('Mochila <b>' + (n0 - 1) + '/80</b>'); sane('depois de desmontar');
  // em uso: o botão explica, a confirmação não abre, e nem a ação forjada desmonta
  const eqIt = item(eqId('armor')), n1 = g.S.inv.length, g1 = g.S.gold; def.onOpen({ slot: 'armor' }); def.render(); has('Em uso'); has('data-x="dism" data-id="' + eqIt.id + '" aria-disabled="true"');
  def.click(btn('dism', { id: String(eqIt.id) })); not('role="dialog"'); assert(/Em uso/.test(X.toast)); def.click(btn('dismok', { id: String(eqIt.id) })); X.ask = eqIt.id; def.render(); not('role="dialog"'); def.click(btn('dismok', { id: String(eqIt.id) }));
  assert.strictEqual(g.S.inv.length, n1, 'item equipado nunca é desmontado'); assert(item(eqIt.id)); assert.strictEqual(eqId('armor'), eqIt.id); assert.strictEqual(g.S.gold, g1);
  def.click(btn('dismok', { id: '99999' })); assert.strictEqual(g.S.inv.length, n1); }
out.push('desmontar: confirmação dentro do jogo, tira da mochila, devolve o ouro (Sys.stats.dismantleGold) e as pedras (Sys.loot); item em uso nunca, nem por ação forjada');

// 6) nível: quem decide é o Sys.stats.canEquip. Hoje o portão de nível do módulo é o da ASA (nível mínimo): abaixo dele não equipa, nem pelo toque, nem pelo botão, nem pelo "melhor"
{ const minL = T.DATA.wing.minLevel; setLv(minL - 1); delete g.S.eq.wing; const w = g.S.inv.filter(i => i.slot === 'wing').sort((a, b) => b.r - a.r)[0]; assert(!T.canEquip(w, minL - 1));
  def.onOpen({ tab: 'wing' }); def.render(); has('g2-cell lock'); has('Nível ' + minL); log.length = 0; def.click(btn('item', { id: String(w.id) }));
  assert(!('wing' in g.S.eq), 'acima do nível do jogador: o toque não equipa'); has('A asa abre no nível ' + minL); has('aria-disabled="true"'); assert.strictEqual(X.pv, w.id, 'mas mostra a prévia no herói'); has('Prévia: '); sane('asa trancada');
  els.g2_stc = mkEl('g2_stc'); els.g2_stc.getContext = () => ctx; def.render(); heroCalls = []; raf.shift()(2000); assert.strictEqual(heroCalls[0].st.wing, T.wingOf(w), 'a asa da prévia vai NO herói'); delete els.g2_stc; raf.shift()(2100); assert.strictEqual(raf.length, 0, 'sem o canvas o laço para');
  def.click(btn('equip', { id: String(w.id) })); assert(!('wing' in g.S.eq), 'nem o botão equipa'); assert(/asa abre no nível/.test(X.toast)); def.click(btn('best')); assert(!('wing' in g.S.eq), 'nem o "Equipar o melhor"'); assert(!log.includes('stats') || !('wing' in g.S.eq));
  def.click(btn('slot', { slot: 'wing' })); assert(/asa abre no nível/.test(X.toast)); setLv(minL); def.onOpen({ tab: 'wing' }); def.render(); def.click(btn('item', { id: String(w.id) })); assert.strictEqual(eqId('wing'), w.id, 'no nível certo equipa'); setLv(60);
  // regra por nível da peça: a tela só obedece ao módulo. Com um canEquip que barra peça de nível acima do jogador (posto SÓ neste teste), ela tranca, não equipa e o "melhor" pula
  const real = T.canEquip; T.canEquip = (it, pl) => real(it, pl) && (it.lvl | 0) <= (pl | 0);
  try { setLv(10); const hi = g.S.inv.filter(i => i.slot === 'gloves' && i.lvl > 10).sort((a, b) => b.lvl - a.lvl)[0], lo = g.S.inv.filter(i => i.slot === 'gloves' && i.lvl <= 10)[0]; assert(hi && lo); g.S.eq.gloves = lo.id;
    def.onOpen({ slot: 'gloves' }); def.render(); assert(new RegExp('g2-cell lock[^>]*data-id="' + hi.id + '"').test(H()), 'cadeado na peça de nível acima'); def.click(btn('item', { id: String(hi.id) })); assert.strictEqual(eqId('gloves'), lo.id, 'item de nível acima do jogador não equipa');
    has('aria-disabled="true"'); def.click(btn('equip', { id: String(hi.id) })); assert.strictEqual(eqId('gloves'), lo.id); def.click(btn('best')); for (const s of slots) { const e = item(eqId(s)); if (e && s !== 'gloves') assert(T.canEquip(e, 10) || e.lvl > 10); } assert(item(eqId('gloves')).lvl <= 10, 'o melhor não pega peça acima do nível'); sane('nível da peça');
  } finally { T.canEquip = real; setLv(60); } }
out.push('nível: asa abaixo do nível mínimo do módulo não equipa (toque, botão ou "melhor") e mostra a prévia no herói; com um canEquip por nível da peça (só neste teste) a tela tranca e não equipa');

// 7) subir o nível da peça: custo e teto do Sys.stats, só ouro
{ g.S.gold = 1e9; setLv(60); const it = g.S.inv.find(i => i.slot === 'hat' && i.lvl < 30), c = T.canUpgrade(g.S, host, it, 'gold'), l0 = it.lvl; assert(c.ok); CFG.tapSwap = false; def.onOpen({ slot: 'hat' }); def.render(); def.click(btn('item', { id: String(it.id) })); CFG.tapSwap = true;
  has('Nível ' + l0 + ' → ' + (l0 + 1)); has(g.kf(c.gold) + ' de ouro'); log.length = 0; def.click(btn('up', { id: String(it.id) })); assert.strictEqual(it.lvl, l0 + 1); assert.strictEqual(g.S.gold, 1e9 - c.gold); assert(log.includes('ptrack:upgrade:1') && log.includes('stats') && log.includes('tut:up'));
  def.click(btn('upmax', { id: String(it.id) })); assert.strictEqual(it.lvl, 60, 'sobe até o nível do jogador'); has('aria-disabled="true"'); const gg = g.S.gold; def.click(btn('up', { id: String(it.id) })); assert.strictEqual(it.lvl, 60); assert.strictEqual(g.S.gold, gg); assert(/Suba ao nível 61/.test(X.toast)); sane('nível da peça no teto');
  g.S.gold = 0; const it2 = g.S.inv.find(i => i.slot === 'hat' && i.lvl < 30 && i.id !== it.id); def.click(btn('item', { id: String(it2.id) })); def.click(btn('up', { id: String(it2.id) })); assert(/Ouro insuficiente/.test(X.toast)); def.click(btn('upmax', { id: String(it2.id) })); assert(it2.lvl < 30); g.S.gold = 5e6; }
out.push('nível da peça: +1 e "subir o máximo" pelo Sys.stats (só ouro), para no nível do jogador e explica quando falta ouro');

// 8) palco: o herói é o do jogo (drawHeroFull), a pé, com o pet (por último, na frente) e a arma do item equipado; erro no desenho não derruba a tela
def.onOpen(); els.g2_stc = mkEl('g2_stc'); els.g2_stc.getContext = () => ctx; def.render(); assert(raf.length >= 1, 'o palco anima');
{ drawn = 0; heroCalls = []; raf.shift()(-50); raf.shift()(1000); assert.strictEqual(heroCalls.length, 2, 'um herói por quadro'); for (const h of heroCalls) { assert(h.st.t >= 0, 'tempo nunca negativo'); assert.strictEqual(h.st.mount, false); assert(h.st.pet === undefined, 'o pet não é escondido'); assert(h.st.weapon === undefined && h.st.wing === undefined && h.st.armor === undefined, 'arma e asa: as do jogo'); assert(h.k > 0 && isFinite(h.k)); } assert(drawn > 4, 'chão desenhado');
  g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(1100); g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; }; raf.shift()(1200);
  g.view = 'battle'; raf.shift()(1300); assert.strictEqual(raf.length, 0, 'fora da tela o laço para'); g.view = 'gear2'; def.onClose(); delete els.g2_stc; raf = []; }
out.push('palco: drawHeroFull a pé com o pet na frente e a arma do jogo, tempo nunca negativo, erro no desenho não derruba a tela, o laço para ao sair');

// 9) Forja e Aparência: abrem pela rota única e voltam para cá; chave desligada = "em breve"
{ def.onOpen(); def.render(); opened = []; openOk = true; def.click(btn('forge')); assert.strictEqual(opened[0].n, 'forge'); assert.strictEqual(opened[0].o.from, 'gear2'); def.click(btn('look')); assert.strictEqual(opened[1].n, 'look'); assert.strictEqual(opened[1].o.from, 'gear2');
  def.click(btn('forge', { slot: 'armor' })); assert.strictEqual(opened[2].o.slot, 'armor'); def.click(btn('go', { to: 'pets' })); def.click(btn('go', { to: 'mounts' })); assert.deepStrictEqual(opened.slice(3).map(o => o.n), ['pets', 'mounts']); def.click(btn('go', { to: 'shop' })); assert.strictEqual(opened.length, 5, 'só as telas previstas');
  openOk = false; def.click(btn('look')); assert(/Aparência: em breve/.test(X.toast)); openOk = true;
  setLv(1); opened = []; def.click(btn('forge')); assert.strictEqual(opened.length, 0); assert(/A Forja libera no nível /.test(X.toast)); setLv(60);
  X.tab = 'gear'; X.sf = 'hat'; def.onOpen({ from: 'forge' }); assert.strictEqual(X.tab, 'gear', 'voltar cai na mesma aba'); assert.strictEqual(X.sf, 'hat'); }
out.push('Forja e Aparência: Panels.open com volta para o Equipamento; chave desligada mostra "em breve"; Forja respeita o nível de liberação');

// 10) o que muda por fora redesenha (tick); todos os botões de todas as abas: tocar em cada um não gera exceção
{ def.onOpen({ tab: 'weapon' }); def.render(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança, sem redesenho'); g.S.inv.push({ id: g.S.nextId++, slot: 'weapon', e: 1, r: 1, lvl: 3, gold: 0, name: 'Drop novo', subs: [] }); def.tick(); assert(H() !== h0, 'drop novo aparece sozinho'); sane('tick');
  let taps = 0; for (const tab of TABS) for (const w of [390, 320]) { dims = w === 320 ? { H: 512, Wb: 320 } : {}; def.onOpen({ tab }); def.render(); const first = buttons(); for (let i = 0; i < first.length; i++) { def.onOpen({ tab }); def.render(); const b = buttons()[i]; if (!b) continue;
      try { def.click(b); taps++; sane('toque ' + b.dataset.x); for (const b2 of buttons().filter(q => ['undo', 'askno', 'close', 'pvout', 'up'].includes(q.dataset.x)).slice(0, 3)) { def.click(b2); taps++; sane('toque ' + b.dataset.x + ' > ' + b2.dataset.x); } } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } } }
  dims = {}; def.tick(); def.onClose(); assert.strictEqual(def.busy(), false); for (const s in g.S.eq) assert(item(g.S.eq[s]), 'nenhum espaço aponta para peça que saiu');
  out.push('toques: ' + taps + ' toques nas 8 abas (390 e 320 px) sem exceção, tela sempre íntegra; ' + seen.size + ' imagens citadas, todas em disco'); }

// 11) QA lote V2 (B1, B2), 320 px: nenhum rótulo cortado com reticências. A folha de estilo não tem text-overflow:ellipsis em lugar nenhum; todo texto variável
// quebra linha; as 8 abas ficam em duas fileiras de 4, crescem com o texto (min-height 40 px) e em tela estreita usam fonte de 10 px com ponto de quebra
{ const CSS = g.document.head.children.map(c => c.textContent).join('\n');
  const rule = sel => { const i = CSS.indexOf('\n' + sel + '{'); assert(i >= 0, 'regra de estilo ausente: ' + sel); return CSS.slice(i + 1, CSS.indexOf('}', i) + 1); };
  assert(!/text-overflow/.test(CSS) && !/text-overflow/.test(SRC), 'nenhuma regra corta texto com reticências');
  for (const sel of ['.g2-who span', '.g2-slot .sl', '.g2-fcb b', '.g2-bt span', '.g2-bt small', '.g2-dn', '.g2-dh', '.g2-vs b', '.g2-vs em', '.g2-sts small', '.g2-sts b', '.g2-sts em', '.g2-tab', '.g2-fb b', '.g2-cn', '.g2-row b']) { const r = rule(sel);
    assert(/white-space:normal/.test(r) && /overflow-wrap:anywhere/.test(r), sel + ': quebra linha'); assert(!/nowrap|overflow:hidden/.test(r), sel + ': não corta'); }
  // o que sobrou com nowrap: só números curtos da FC (linha que quebra entre eles) e o "+FC" que sobe; nenhum com overflow escondido
  const nw = [...CSS.matchAll(/\n([^{\n]+)\{[^}]*white-space:nowrap[^}]*\}/g)].map(m => m[1]); assert.deepStrictEqual(nw.sort(), ['.g2-cmp .a', '.g2-cmp .b', '.g2-cmp .d', '.g2-fly'], 'nowrap só em número curto: ' + nw);
  for (const m of CSS.matchAll(/\n[^{\n]+\{[^}]*white-space:nowrap[^}]*\}/g)) assert(!/overflow:hidden/.test(m[0]), 'nowrap sem corte: ' + m[0]);
  const tab = rule('.g2-tab'), nar = rule('.g2-tabs.nar .g2-tab'); assert(/min-height:40px/.test(tab) && !/[;{]height:/.test(tab), 'aba: toque de 40 px e cresce com o texto');
  assert(/font-size:11px/.test(tab) && /font-size:10px/.test(nar), 'aba em tela estreita: fonte de 10 px (o mínimo)'); assert(/repeat\(4,minmax\(0,1fr\)\)/.test(rule('.g2-tabs')), '8 abas em duas fileiras de 4, sem rolagem lateral');
  assert(!/[;{]height:/.test(rule('.g2-who')) && /min-height:40px/.test(rule('button.g2-who')), 'a faixa do herói cresce com o texto; o botão Sair mantém 40 px');
  assert(/min-height:44px/.test(rule('.g2-bt')) && /min-height:40px/.test(rule('.g2-fb')) && /width:40px;height:40px/.test(rule('.g2-dx')), 'toque mínimo mantido');
  dims = { H: 584, Wb: 320 }; def.onOpen({ slot: 'weapon' }); def.render(); assert(X.sel != null, 'arma em uso selecionada');
  has('class="g2-tabs nar"'); assert.strictEqual((H().match(/role="tab"/g) || []).length, 8); for (const t of ['Equipa&shy;mento', 'Consu&shy;míveis', 'Monta&shy;rias', 'Mate&shy;riais', '>Armas<', '>Asas<', '>Pets<', '>Skins<']) has(t);
  for (const lab of ['Armas', 'Equipamento', 'Asas', 'Pets', 'Montarias', 'Skins', 'Materiais', 'Consumíveis']) has('aria-label="' + lab + '"');
  const dh = (/<div class="g2-dh">(.*?)<\/div>/.exec(H()) || [])[1] || ''; assert(/ · Nv\. \d+ · .+ · Forja \+\d+ · <b>usando<\/b>/.test(dh), 'linha do detalhe inteira no HTML (quebra em duas linhas pelo estilo): ' + dh);
  assert(!/…|\.\.\.<|style="[^"]*(ellipsis|nowrap)/.test(H()), 'nenhuma reticência escrita nem estilo de corte na própria marca'); sane('320 px sem reticências');
  dims = {}; def.render(); not('g2-tabs nar'); has('class="g2-tabs"'); def.onClose();
  out.push('320 px: zero text-overflow no arquivo; abas (10 px, ponto de quebra, min-height 40), linha do detalhe, nomes, botões, células e filtros quebram linha'); }

// 12) QA lote V2 (B3): o botão da Forja com o js/panels.js DE VERDADE (num contexto à parte). Com PANEL_ON.forge2 ligada abre a forge2 e o Voltar dela
// (Screens.close) devolve à gear2; com a forge2 desligada abre a Forja de hoje ('forge') e a volta também cai na gear2. Nenhuma chave é mudada em arquivo.
{ const PSRC = fs.readFileSync(path.join(R, 'js/panels.js'), 'utf8'); assert(/v2:\{[^}]*forge:'forge2'/.test(PSRC), 'o mapa Panels.v2 leva forge para forge2');
  assert(/a==='back'\)\{[^}]*Screens\.close\(\)/.test(fs.readFileSync(path.join(R, 'js/p_forge2.js'), 'utf8')), 'o Voltar da forge2 passa pelo Screens.close');
  const mk = on => { const sb = { PANEL_ON: { gear2: true, forge: true, forge2: on } }; sb.window = sb; vm.createContext(sb);
    vm.runInContext("var view='gear2', trail=[], got=[]; function setView(v){ view=v; trail.push(v); } var Screens={ open:function(n,o){ setView(n); return true; }, close:function(){ setView('battle'); } };", sb);
    vm.runInContext(PSRC, sb, { filename: 'panels.js' });
    vm.runInContext("Panels.add('gear2',{title:'Equipamento'}); ['forge','forge2'].forEach(function(n){ Panels.add(n,{title:'Forja',parent:'gear',onOpen:function(o){ got.push([n,o]); }}); }); var P=Panels;", sb); return sb; };
  const open0 = g.Panels.open; setLv(60); dims = {};
  try { for (const on of [true, false]) { const sb = mk(on), want = on ? 'forge2' : 'forge'; g.Panels.open = (n, o) => sb.P.open(n, o);
      def.onOpen({ tab: 'gear' }); def.render(); X.toast = ''; def.click(btn('forge', { slot: 'armor' }));
      assert.strictEqual(sb.view, want, 'forge2 ' + (on ? 'ligada' : 'desligada') + ': abre ' + want); assert.strictEqual(sb.got.length, 1); assert.strictEqual(sb.got[0][0], want); assert.strictEqual(sb.got[0][1].slot, 'armor'); assert.strictEqual(sb.got[0][1].from, 'gear2'); assert.strictEqual(X.toast, '', 'sem "em breve"');
      sb.Screens.close(); assert.strictEqual(sb.view, 'gear2', 'forge2 ' + (on ? 'ligada' : 'desligada') + ': o Voltar devolve à gear2 (não à batalha nem ao Equipamento antigo)'); assert.deepStrictEqual([...sb.trail], [want, 'gear2']);
      // o botão pequeno "Forja" da faixa da FC (sem espaço escolhido) segue a mesma rota
      def.click(btn('forge')); assert.strictEqual(sb.view, want); sb.Screens.close(); assert.strictEqual(sb.view, 'gear2'); }
    // forge2 E forge desligadas: nada abre e a tela diz "em breve"
    const sb = mk(false); sb.PANEL_ON.forge = false; g.Panels.open = (n, o) => sb.P.open(n, o); def.click(btn('forge')); assert.strictEqual(sb.view, 'gear2'); assert(/Forja: em breve/.test(X.toast));
  } finally { g.Panels.open = open0; }
  def.onClose(); out.push('Forja pela rota real (js/panels.js): forge2 ligada abre a forge2, desligada abre a Forja de hoje; nos dois casos o Voltar devolve à gear2'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
