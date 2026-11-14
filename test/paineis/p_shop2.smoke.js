'use strict';
// Teste de fumaça do js/p_shop2.js (LOJA V2) em Node: DOM de mentira, módulos REAIS de js/sys (buy, vip, offer, appearance, skin, mount, newdrops, pass, pet, stats...).
// Rodar: node test/paineis/p_shop2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['level', 'loot', 'stats', 'fc', 'skin', 'appearance', 'mount', 'pet', 'pass', 'vip', 'offer', 'newdrops', 'buy'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, BUY = Sys.buy;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 216, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };   // sem document.body: o Sys.buy simulado segue sem a janela dele
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
const wait = () => new Promise(r => setImmediate(r));

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
const host = makeHost({ seed: 7, stage: 5, eraMax: 0 }); host.addGems = n => { g.S.gems += n; }; host.addGold = n => { g.S.gold += n; }; host.simConfirm = false;
const log = []; host.save = () => log.push('hsave'); Sys.host = host;
const newSave = () => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: 'kael', set: {}, skins: [], skinEq: {}, stage: 1, eraMax: 0, shop: null });
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'shop2'; g.PANEL_ON = {};
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : ''; g.RC = ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'];
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.SLOT = { weapon: { n: 'Arma' }, armor: { n: 'Colete' }, hat: { n: 'Chapéu/Elmo' }, gloves: { n: 'Luvas' }, boots: { n: 'Botas' }, necklace: { n: 'Colar' }, wing: { n: 'Asa' } };
const SLOT_FILE = { weapon: 'weapon', armor: 'vest', hat: 'helmet', gloves: 'gloves', boots: 'boots', necklace: 'necklace', wing: 'wings' };   // os mesmos nomes do index.html
g.slotIcon = (s, e) => 'assets/icons/slots/era' + Math.max(0, Math.min(8, e | 0)) + '_' + SLOT_FILE[s] + '.png'; g.ieraV = it => Number.isInteger(it.look) ? it.look : it.e | 0;
g.mountFile = id => ({ phoenixm: 'giant_phoenix' })[id] || id;   // a mesma tradução do js/mountfx.js (MOUNT_FILE)
g.iname = it => 'Peça <b>' + g.SLOT[it.slot].n + '</b> ' + g.RN(it.r);
g.needMsg = (c, v) => 'Ouro insuficiente: faltam ' + Math.ceil(v - g.S.gold); g.todayKey = () => 'hoje';
let bagMax = 60; g.xBagMax = () => bagMax; let unlocked = true; g.xUnlocked = () => unlocked; g.xUnlockLv = id => id === 'pass' ? 8 : 10;
g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.5),rgba(13,10,8,.9)),url(assets/bg/era0.png) center top/cover no-repeat,#16110d';
/* estoque do dia: 6 itens diferentes (raridades 0,0,1,1,2,2), preço COIN_BASE[r] x 4^era, como o ensureShop() do index.html */
const COIN_BASE = [150, 420, 1300, 4000, 12000]; let shopBuilt = 0;
g.ensureShop = () => { if (g.S.shop && g.S.shop.date === g.todayKey()) return; shopBuilt++; const sl = ['weapon', 'boots', 'armor', 'necklace', 'hat', 'gloves'];
  g.S.shop = { date: g.todayKey(), skins: [], offers: [0, 0, 1, 1, 2, 2].map((r, i) => ({ slot: sl[i], r, e: 0, subs: [], price: Math.floor(COIN_BASE[r] * Math.pow(4, 0)), sold: false })) }; };
g.PULLING = null; g.addItemToBag = o => { const it = { id: g.S.nextId++, slot: o.slot, r: o.r, e: o.e, subs: o.subs, lvl: 1, origin: o.origin }; g.S.inv.push(it); if (g.PULLING) g.PULLING.push({ r: it.r, slot: it.slot, e: it.e, name: 'Peça nova' }); };
g.snd = n => log.push('snd:' + n); g.statsChanged = () => log.push('stats'); g.save = () => log.push('save');
let viewSet = ''; g.setView = v => { viewSet = v; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = '', opened = []; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n, o) { opened.push([n, o]); return true; } };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_shop2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_shop2.js' });
const X = g.Shop2.X, out = [];
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const TABS = ['ofertas', 'gemas', 'visual', 'montarias', 'vip', 'passe', 'ouro'], MONEY = TABS.filter(t => t !== 'ouro');
const open = t => { def.onOpen({ tab: t }); def.render(); };
/* toda imagem citada (src e url) existe em disco */
const seen = new Set(); const images = what => { for (const m of H().matchAll(/(?:src="|url\()([^")]+)/g)) { const u = un(m[1]); if (/^data:/.test(u)) continue; if (!seen.has(u)) { assert(fs.existsSync(path.join(R, u)), what + ': imagem não existe em disco: ' + u); seen.add(u); } } };
/* todo <button> tem data-x e a ação está na lista de ações tratadas; sem emoji; sem "undefined"/"NaN"; sem botão morto; imagens no disco */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  images(what); return bt.length; };
/* compra real desligada: nada de preço em reais nem de "Comprar" nas abas de dinheiro */
const noMoney = what => { const t = H().replace(/<style[\s\S]*?<\/style>/g, ''); assert(!/R\$/.test(t), what + ': mostrou preço em reais com a compra desligada'); assert(!/Comprar/.test(t), what + ': mostrou "Comprar" com a compra desligada'); assert(!/data-x="buy(ok)?"/.test(t), what + ': botão de compra com a compra desligada'); };

(async () => {
// 0) registro: painel 'shop2', chave nasce DESLIGADA, o arquivo não liga chave nenhuma, sem diálogo do navegador, sem emoji
assert.strictEqual(addName, 'shop2'); assert.strictEqual(g.PANEL_ON.shop2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|simForce\s*=|\.skinsOn\s*=(?!=)|PANEL_ON\.\w+\s*=\s*true|\.visual\s*=(?!=)/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/R\$|gems_\d|skin_k|mount_mecha|first_offer/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '')), 'nenhum preço escrito no arquivo');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert.strictEqual(BUY.DATA.on, false, 'a compra real está desligada no módulo'); assert.strictEqual(BUY.ready(), false);
out.push('registro: shop2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji, sem preço escrito no arquivo');

// 1) save novo: as 7 abas desenham sem erro; com a compra desligada nenhuma mostra "R$" nem "Comprar"; imagens no disco
let nb = 0; for (const t of TABS) { open(t); assert.strictEqual(X.tab, t); has('id="s2_stc"'); has('role="tablist"'); assert.strictEqual((H().match(/role="tab"/g) || []).length, 7, 'as 7 abas'); nb += sane('save novo, aba ' + t); if (t !== 'ouro') noMoney('aba ' + t); }
assert.strictEqual(shopBuilt, 1, 'o estoque do dia é montado pelo ensureShop, uma vez'); assert.strictEqual(g.S.shop.offers.length, 6);
open('ofertas'); has('Oferta do Guardião'); has('Cartão Mensal'); has('Passe Premium'); has('Em breve'); has('Ofertas do dia (ouro)'); has('Ver as 6 ofertas do dia'); assert.strictEqual((H().match(/data-x="gold"/g) || []).length, 3); has('renova à meia-noite');
open('gemas'); assert.strictEqual((H().match(/class="s2-gk"/g) || []).length, BUY.DATA.products.filter(p => p.kind === 'gems').length, 'um cartão por pacote do catálogo'); has('dobro na 1ª compra'); has('Pagamento em breve');
open('visual'); has('Kael (padrão)'); has('Kael Paladino'); has('Kael Ciborgue'); has('Kael Ninja'); not('Kaia Arlequina'); not('Cavaleiro'); has('Na coleção'); has('1 de ');
open('montarias'); has('Mecha de Guerra'); has('Lobo de guerra'); has('Asa de anjo'); has('Asa demoníaca'); has('Asas · não se vendem'); has('Pets · não se vendem'); has('+' + String(Sys.mount.DATA.maxPct[Sys.mount.powerRarity('mecha')]).replace('.', ',') + '% ATQ e VIDA');   // o % é o do PODER (pr), não o do visual
{ const mc = Sys.mount.catalog().find(m => m.id === 'mecha'); assert.strictEqual(mc.maxPct, Sys.mount.DATA.maxPct[mc.pr]); if (mc.pr !== mc.r) not('+' + String(Sys.mount.DATA.maxPct[mc.r]).replace('.', ',') + '% ATQ e VIDA (Nv'); }
open('vip'); has('VIP 0'); has('de <b>' + Sys.vip.DATA.points[1] + '</b> pontos para o VIP 1'); assert.strictEqual((H().match(/data-x="vl"/g) || []).length, Sys.vip.DATA.maxLevel); has('Skin Kael Demônio'); has('Fênix gigante'); has('Serpe infernal'); has('>VIP 7<'); has('>VIP 8<'); has('>VIP 9<'); has('+' + Sys.vip.DATA.table.atk[1] + '%');
open('passe'); has('+' + Sys.pass.DATA.premiumXpPct + '% XP'); has('skin <b>Kael Anjo</b>'); has('Abrir o Passe'); has('Em breve');
open('ouro'); assert.strictEqual((H().match(/data-x="gold"/g) || []).length, 6, 'os 6 itens do dia'); has('Peça &lt;b&gt;Arma&lt;/b&gt; Básico'); not('<b>Arma</b>'); has('>150<'); has('>1300<');
out.push('save novo: 7 abas sem erro (' + nb + ' botões, todos com ação tratada), nada de "R$" nem "Comprar" com a compra desligada, ' + seen.size + ' imagens citadas existem em disco');

// 2) item do dia com OURO: sem ouro avisa; com ouro abre a folha, tira o ouro, põe o item na mochila e marca vendido
open('ouro'); const o0 = g.S.shop.offers[0], o4 = g.S.shop.offers[4];
g.S.gold = 0; def.click(btn('gold', { i: '0' })); assert(/Ouro insuficiente/.test(X.toast), 'sem ouro: avisa'); assert.strictEqual(X.sheet, null); assert.strictEqual(g.S.inv.length, 0); assert.strictEqual(o0.sold, false); not('role="dialog"');
def.click(btn('goldok', { i: '0' })); assert.strictEqual(g.S.inv.length, 0, 'confirmação forjada sem ouro não compra'); assert.strictEqual(o0.sold, false); assert.strictEqual(g.S.gold, 0);
g.S.gold = o4.price + 5; def.render(); def.click(btn('gold', { i: '4' })); has('role="dialog"'); has('Comprar com ouro'); has('>' + g.n0(o4.price) + '</b>'); has('Nada é sorteado'); has('data-x="goldok"'); has('data-x="sclose"'); sane('folha do ouro');
def.click(btn('sclose')); not('role="dialog"'); assert.strictEqual(g.S.gold, o4.price + 5, 'cancelar não cobra');
def.click(btn('gold', { i: '4' })); log.length = 0; def.click(btn('goldok', { i: '4' }));
assert.strictEqual(g.S.gold, 5, 'tirou o ouro'); assert.strictEqual(g.S.inv.length, 1, 'item na mochila'); assert.deepStrictEqual([g.S.inv[0].slot, g.S.inv[0].r, g.S.inv[0].e, g.S.inv[0].origin], [o4.slot, o4.r, o4.e, 'shop']); assert.strictEqual(o4.sold, true, 'marcou vendido');
assert.strictEqual(g.PULLING, null, 'a lista de entrega volta ao que era'); assert(log.includes('stats') && log.includes('snd:coin')); assert(/Comprado: Peça nova/.test(X.toast)); not('role="dialog"'); has('>Comprado<'); assert.strictEqual((H().match(/data-x="gold"/g) || []).length, 5); sane('depois da compra com ouro');
def.click(btn('gold', { i: '4' })); assert(/Já comprado hoje/.test(X.toast)); def.click(btn('goldok', { i: '4' })); assert.strictEqual(g.S.inv.length, 1, 'não compra duas vezes');
g.S.gold = 1e6; bagMax = 1; def.render(); def.click(btn('gold', { i: '1' })); def.click(btn('goldok', { i: '1' })); assert(/Mochila cheia/.test(X.toast)); assert.strictEqual(g.S.gold, 1e6, 'mochila cheia não cobra'); assert.strictEqual(g.S.shop.offers[1].sold, false); bagMax = 60;
out.push('ouro: sem ouro avisa e não compra; com ouro a folha confirma, tira ' + o4.price + ' de ouro, põe o item na mochila e marca vendido; não compra duas vezes; mochila cheia não cobra');

// 3) compra de dinheiro com a chave desligada: toque forjado só avisa "em breve"; nada muda no save
const snap = JSON.stringify(g.S); for (const p of BUY.DATA.products) { open('gemas'); def.click(btn('buy', { id: p.id })); assert(/Pagamento em breve/.test(X.toast), p.id + ': avisa em breve'); assert.strictEqual(X.sheet, null); def.click(btn('buyok', { id: p.id })); await wait(); assert.strictEqual(X.busy, false); }
def.click(btn('claim')); assert(/Pagamento em breve/.test(X.toast));
assert.strictEqual(JSON.stringify(g.S), snap, 'com a compra desligada nenhum toque muda o save'); noMoney('depois dos toques forjados');
out.push('compra desligada: ' + BUY.DATA.products.length + ' produtos com toque forjado só avisam "Pagamento em breve"; o save não muda');

// 4) prévia no herói: skin, asa e montaria entram pelo state do drawHeroFull; o pet não é escondido; "Prévia: X · Sair"
open('visual'); def.click(btn('pv', { k: 'skin', id: 'kael_paladin' })); assert.deepStrictEqual(X.pv, { kind: 'skin', id: 'kael_paladin' }); has('Prévia: Kael Paladino'); has('data-x="pvout"'); has('class="s2-det"'); has('Compra direta: pagamento em breve'); noMoney('prévia de skin à venda'); sane('prévia de skin');
els.s2_stc = mkEl('s2_stc'); els.s2_stc.getContext = () => ctx; def.render(); assert(raf.length >= 1, 'o palco anima');
const shot = () => { heroCalls = []; drawn = 0; const f = raf.shift(); f(1000 + Math.random() * 1000); assert.strictEqual(heroCalls.length, 1, 'um herói por quadro'); const c = heroCalls[0]; assert(c.k > 0 && isFinite(c.k)); assert(c.st.t >= 0); assert(c.st.pet === undefined, 'o pet não é escondido (o drawHeroFull desenha por último, na frente)'); assert(c.st.weapon === undefined, 'a arma é a equipada'); assert(drawn > 3, 'chão desenhado'); return c.st; };
let st = shot(); assert.strictEqual(st.skin, 'kael_paladin'); assert.strictEqual(st.mount, false, 'a pé');
def.click(btn('pv', { k: 'skin', id: 'kael_demon' })); st = shot(); assert.strictEqual(st.skin, 'kael_demon'); has('Como ganhar: <b>Prêmio: VIP 7</b>'); has('data-t="vip"');
def.click(btn('pvout')); assert.strictEqual(X.pv, null); not('Prévia:'); st = shot(); assert.strictEqual(st.skin, undefined); assert.strictEqual(st.wing, undefined);
open('montarias'); def.click(btn('pv', { k: 'wing', id: 'demon' })); has('Prévia: Asa demoníaca'); has('Não se vende'); def.render(); st = shot(); assert.strictEqual(st.wing, 'demon'); def.click(btn('pv', { k: 'wing', id: 'demon' })); assert.strictEqual(X.pv, null, 'tocar de novo sai da prévia');
def.click(btn('pv', { k: 'mount', id: 'wolf' })); assert.strictEqual(X.pv, null); assert(/arte montada ainda não chegou/.test(X.toast), 'sem a folha montada não há prévia'); has('Como ganhar: <b>Oferta do Guardião</b>');
def.click(btn('pv', { k: 'mount', id: 'mecha' })); assert.strictEqual(X.pv, null, 'Mecha: montaria ainda não liberada no módulo, sem prévia'); not('data-k="offer"');
g.MOUNT_TBL = { wolf: {} }; g.mountPrefix = () => 'kael_wolf'; const vis0 = Sys.mount.DATA.visual; Sys.mount.DATA.visual = true;   // só neste teste: como o jogo fica depois do mountBoot
try { def.render(); def.click(btn('pv', { k: 'mount', id: 'wolf' })); has('Prévia: Lobo de guerra'); st = shot(); assert.deepStrictEqual(st.mount, { id: 'wolf', stars: 1 }); def.click(btn('pvout'));
  open('ofertas'); has('data-k="offer"'); def.click(btn('pv', { k: 'offer', id: 'offer' })); has('Prévia: Oferta do Guardião'); def.render(); st = shot(); assert.strictEqual(st.skin, 'kael_ninja'); assert.strictEqual(st.mount.id, 'wolf'); noMoney('prévia da oferta'); sane('prévia da oferta'); def.click(btn('pvout'));
} finally { Sys.mount.DATA.visual = vis0; delete g.MOUNT_TBL; delete g.mountPrefix; }
g.drawHeroFull = () => { throw new Error('boom'); }; def.render(); raf.shift()(9000); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
def.onClose(); delete els.s2_stc; raf = [];
out.push('prévia: skin, asa, montaria e oferta entram no herói do jogo (drawHeroFull) com "Prévia: X · Sair"; o pet continua; erro no desenho não derruba a tela');

// 5) skin que o jogador já tem: tocar troca na hora (Sys.appearance.equipFixed); a padrão volta
assert.strictEqual(Sys.appearance.grantFixed(g.S, 'kael_ninja', { source: 'offer' }).ok, true); open('visual'); has('2 de '); log.length = 0;
def.click(btn('pv', { k: 'skin', id: 'kael_ninja' })); assert.strictEqual(Sys.appearance.fixedEquipped(g.S).id, 'kael_ninja'); assert(/Kael Ninja equipada/.test(X.toast)); assert(log.includes('stats')); has('>Usando<'); assert.strictEqual(X.pv, null); sane('skin equipada');
def.click(btn('equip', { id: 'kael_paladin' })); assert.strictEqual(Sys.appearance.fixedEquipped(g.S).id, 'kael_ninja', 'skin que não tem não equipa'); assert(/ainda não tem/.test(X.toast));
def.click(btn('pv', { k: 'skin', id: 'default' })); assert.strictEqual(Sys.appearance.fixedEquipped(g.S), null, 'voltou à padrão');
g.S.hero = 'kaia'; open('visual'); has('Kaia (padrão)'); has('Kaia Arlequina'); not('Kael Paladino'); sane('Kaia'); open('vip'); has('Skin Kaia Demônia'); g.S.hero = 'kael';
out.push('skins: a que o jogador tem troca no toque e a padrão volta; a que não tem não equipa; cada herói vê só as dele');

// 6) abas travadas pelo nível (xUnlocked gemShop): só a aba Ouro abre e as outras explicam
unlocked = false; open('gemas'); assert.strictEqual(X.tab, 'ouro'); assert.strictEqual((H().match(/aria-disabled="true"/g) || []).length, 6); def.click(btn('tab', { t: 'visual' })); assert.strictEqual(X.tab, 'ouro'); assert(/Libera no nível 10/.test(X.toast)); sane('travada'); unlocked = true;
def.click(btn('tab', { t: 'vip' })); assert.strictEqual(X.tab, 'vip'); def.click(btn('vl', { v: '5' })); has('Vantagens no VIP 5'); has('faltam ' + g.n0(Sys.vip.DATA.points[5]) + ' pontos'); has('+' + Sys.vip.DATA.table.atk[5] + '%'); sane('VIP 5');
def.click(btn('go', { to: 'vip' })); assert.deepStrictEqual(opened.pop(), ['vip', { from: 'shop2' }]); def.click(btn('go', { to: 'pass' })); assert.strictEqual(viewSet, 'pass'); def.click(btn('go', { to: 'xyz' })); assert(/não abre daqui/.test(X.toast));
out.push('abas: travadas pelo nível só abrem Ouro; seletor de nível do VIP lê a tabela do módulo; atalhos abrem VIP e Passe');

// 7) compra LIGADA (simulada, só na memória deste teste): preço do catálogo, folha de confirmação, entrega pelo Sys.buy
BUY.DATA.simForce = true; try { assert.strictEqual(BUY.ready(), true);
  const p60 = BUY.product('gems_60'), g0 = g.S.gems; open('gemas'); has(BUY.priceText('gems_60')); has('data-x="buy"'); has('compra simulada'); sane('diamantes com a compra ligada');
  def.click(btn('buy', { id: 'gems_60' })); has('role="dialog"'); has('Confirmar compra'); has(BUY.priceText('gems_60')); has('nenhum dado de pagamento é pedido'); has('>Comprar<'); sane('folha de compra'); assert.strictEqual(g.S.gems, g0, 'abrir a folha não entrega');
  def.click(btn('sclose')); not('role="dialog"'); def.click(btn('buy', { id: 'gems_60' })); def.click(btn('buyok', { id: 'gems_60' })); assert.strictEqual(X.busy, true); def.click(btn('buyok', { id: 'gems_60' })); await wait();
  assert.strictEqual(X.busy, false); assert.strictEqual(g.S.gems, g0 + p60.gems * 2, 'uma entrega só, em dobro na 1ª compra do pacote'); assert.strictEqual(Sys.vip.progress(g.S).points, Math.floor(p60.brl)); assert.strictEqual(Sys.vip.level(g.S), 1);
  has('Compra concluída'); has(g.n0(p60.gems * 2) + ' diamantes'); has('nada foi cobrado'); sane('compra concluída'); def.click(btn('sclose')); has('VIP 1');
  open('visual'); has(BUY.priceText('skin_kael_paladin')); def.click(btn('pv', { k: 'skin', id: 'kael_paladin' })); has('data-x="buy"'); def.click(btn('buy', { id: 'skin_kael_paladin' })); has('Skin Kael Paladino'); def.click(btn('buyok', { id: 'skin_kael_paladin' })); await wait();
  assert(Sys.appearance.fixedSkins(g.S, host).find(k => k.id === 'kael_paladin').owned, 'a skin entrou na coleção'); has('Usar agora'); def.click(btn('equip', { id: 'kael_paladin' })); assert.strictEqual(Sys.appearance.fixedEquipped(g.S).id, 'kael_paladin'); not('role="dialog"');
  def.click(btn('buy', { id: 'skin_kael_paladin' })); assert(/Você já tem/.test(X.toast)); assert.strictEqual(X.sheet, null);
  open('ofertas'); await wait(); def.render(); has(BUY.priceText('monthly_card')); const g1 = g.S.gems, pc = BUY.product('monthly_card'); def.click(btn('buy', { id: 'monthly_card' })); def.click(btn('buyok', { id: 'monthly_card' })); await wait(); assert.strictEqual(g.S.gems, g1 + pc.gems); def.click(btn('sclose'));
  await wait(); def.render(); has('Ativo: ' + pc.days + ' dias restantes'); has('data-x="claim"'); def.click(btn('claim')); await wait(); assert.strictEqual(g.S.gems, g1 + pc.gems + pc.daily); has('Resgatado hoje'); sane('cartão mensal');
  open('passe'); has(BUY.priceText('pass_premium')); def.click(btn('buy', { id: 'pass_premium' })); def.click(btn('buyok', { id: 'pass_premium' })); await wait(); assert.strictEqual(Sys.pass.progress(g.S).premium, true); def.click(btn('sclose')); has('Ativo nesta temporada');
  open('montarias'); not(BUY.priceText('mount_mecha')); has('Em breve');   // Mecha: Sys.newDrops.shop() diz que ainda não está liberado → sem preço mesmo com a compra ligada
  open('ofertas'); not(BUY.priceText('first_offer'));                        // Oferta: Sys.offer.DATA.on desligada → sem preço mesmo com a compra ligada
  let taps = 0; for (const t of TABS) { open(t); await wait(); def.render(); for (const b of buttons()) { open(t); try { def.click(b); await wait(); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } def.render(); sane('ligada, toque ' + b.dataset.x); X.sheet = null; X.busy = false; } }
  out.push('compra ligada (simulada, só neste teste): preço do catálogo, folha de confirmação, uma entrega por compra pelo Sys.buy (diamantes em dobro, ponto VIP, skin, cartão, passe); Mecha e Oferta seguem "Em breve" pelas chaves deles; ' + taps + ' toques sem exceção');
} finally { BUY.DATA.simForce = false; }
assert.strictEqual(BUY.ready(), false); for (const t of MONEY) { open(t); noMoney('chave desligada de novo, aba ' + t); }

// 8) todos os botões de todas as abas (compra desligada): tocar em cada um não gera exceção e a tela segue íntegra
g.S = newSave(); g.S.gold = 5000; let taps2 = 0;
for (const t of TABS) { open(t); for (const b of buttons()) { open(t); try { def.click(b); await wait(); taps2++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } def.render(); sane('toque ' + b.dataset.x); if (!(X.sheet && X.sheet.k === 'gold')) noMoney('toque ' + b.dataset.x + ' na aba ' + t); } }
def.tick(); g.S.gold = 1; def.tick(); def.click(btn('back')); assert(log.includes('close')); def.onClose(); assert.strictEqual(def.busy(), false);
out.push('toques: ' + taps2 + ' botões das 7 abas tocados sem exceção, tela sempre íntegra');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
