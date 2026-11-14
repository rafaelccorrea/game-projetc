'use strict';
// Teste de fumaça do js/p_pass2.js (PASSE V2) em Node: DOM de mentira, módulos REAIS de js/sys (level, loot, stats, pass, appearance, mount, pet, newdrops, buy).
// Rodar: node test/paineis/p_pass2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['level', 'loot', 'stats', 'pass'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
['appearance', 'mount', 'pet', 'newdrops', 'buy'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, P = Sys.pass, D = P.DATA;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 226, scrollTop: 0, offsetTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let timers = []; g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
let LV = 13; const host = makeHost({ seed: 7, stage: 26, eraMax: 2, level: 13 }); host.level = () => LV; Sys.host = host;
const newSave = hero => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: hero || 'kael', set: {} });
const setLv = n => { LV = n; try { Sys.level.ensure(g.S).lvl = n; } catch (e) {} };
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'pass2'; g.PANEL_ON = {};
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : ''; g.RC = ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'];
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Era da Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
/* o MESMO caminho de ícone do index.html (slotIcon / SLOT_FILE), para o teste conferir os arquivos no disco */
const SLOT_FILE = { weapon: 'weapon', armor: 'vest', hat: 'helmet', gloves: 'gloves', boots: 'boots', necklace: 'necklace', wing: 'wings' };
g.slotIcon = (s, e) => 'assets/icons/slots/era' + Math.max(0, Math.min(8, e | 0)) + '_' + SLOT_FILE[s] + '.png';
g.iname = it => it.name || ('Peça <' + it.slot + '> ' + g.RN(it.r)); g.plv = () => LV;
let unlocked = true; g.xUnlocked = id => unlocked; g.xUnlockLv = id => 18;
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.hud = () => {}; g.statsChanged = () => log.push('stats'); g.onLevelUp = () => log.push('lvup'); g.setView = v => log.push('view:' + v);
g.SKIN = id => /^w\d\d$/.test(id) ? { id, slot: 'weapon' } : null;
/* compra: os ajudantes do js/screens.js leem o Sys.buy; aqui valem os mesmos nomes, com uma chave só do teste */
let buyOn = false; const bought = [];
g.xBuyReady = () => buyOn; g.xBuyProds = k => (Sys.buy.DATA.products || []).filter(p => p && p.kind === k); g.xBuyPrice = id => 'PRECO-DO-MODULO'; g.xBuySim = () => false; g.xBuyMsg = () => 'Compra não concluída';
g.xBuy = (id, done) => { bought.push(id); P.setPremium(g.S, true); done({ ok: true }, { id, name: 'Passe Premium' }); };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_pass2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_pass2.js' });
const X = g.Pass2.X, out = [];
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const count = re => (H().match(re) || []).length;
const imgs = new Set(); const collect = () => { for (const m of H().matchAll(/<img[^>]*\ssrc="([^"]*)"/g)) imgs.add(un(m[1])); };
/* todo <button> tem data-x e a ação está na lista de ações tratadas; sem emoji; sem "undefined"/"NaN"; sem botão morto */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões'); collect();
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/<img[^>]*src=""/.test(H()), what + ': imagem sem caminho'); return bt.length; };
/* com a compra real desligada: nem preço em reais, nem a palavra Comprar, nem a ação de compra */
const noSale = what => { const t = H().replace(/<style[\s\S]*?<\/style>/g, ''); assert(!/R\$/.test(t), what + ': mostrou preço em reais'); assert(!/comprar/i.test(t), what + ': mostrou Comprar'); assert(!/data-x="(buy|prem)"/.test(t), what + ': botão de compra'); assert(!/sorteio/i.test(t), what + ': texto proibido'); };
const st = () => P.ensure(g.S);
const setXp = n => { st().xp = n; };

// 0) registro: painel 'pass2', chave nasce DESLIGADA, o arquivo não liga chave nem premium
assert.strictEqual(addName, 'pass2'); assert.strictEqual(g.PANEL_ON.pass2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/setPremium\s*\(|\.premium\s*=(?!=)|\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nem o premium');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço escrito no arquivo');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert(Sys.buy && Sys.buy.DATA.on === false, 'a compra real está desligada no módulo');
// visual do mock B (claro): nenhum texto cortado com reticências nem preso em uma linha; variáveis de cor no topo do bloco de estilo (contraste não é verificável em node: só a existência)
assert(!/text-overflow\s*:\s*ellipsis/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/white-space\s*:\s*nowrap/.test(SRC), 'nenhum texto preso em uma linha só');
{ const top = (/\.ps2\{([^}]*)\}/.exec(SRC) || ['', ''])[1]; for (const v of ['--bg', '--paper', '--paper2', '--chip', '--line', '--gold', '--gold2', '--ink', '--ink2', '--brand', '--blue', '--free1', '--prem1', '--green', '--rose']) assert(new RegExp(v + ':#[0-9a-f]{6}').test(top), 'variável de cor ausente: ' + v);
  assert(/color:var\(--ink\)/.test(top), 'tela clara: o texto base é escuro'); assert(/\.ps2-fb\.buy,[^{]*\{color:#2a1403\}/.test(SRC), 'botão dourado com texto escuro');
  const th = (/\.ps2-thead span\{([^}]*)\}/.exec(SRC) || ['', ''])[1]; assert(/overflow-wrap:anywhere/.test(th) && !/overflow:hidden/.test(th), 'cabeçalho da trilha quebra em duas linhas em vez de cortar'); }
out.push('registro: pass2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji e sem preço no arquivo');

// 1) save novo: portão pelo nível; liberado, a trilha inteira do módulo, nada pronto, premium trancado e "Em breve"
unlocked = false; def.onOpen(); def.render(); has('Libera no nível 18'); has('data-x="back"'); sane('portão'); def.click(btn('claim', { t: 'free', lv: '1' })); assert.strictEqual(st().free.length, 0); def.click(btn('back')); assert(log.includes('close')); unlocked = true;
def.onOpen(); def.render(); has('id="ps2_stc"'); has('TEMPORADA 1'); has('Faltam ' + D.seasonDays + ' dias'); has('0/' + D.xpPerTier + ' XP'); has('GRÁTIS'); has('nada pronto agora'); has('Em breve'); has('Premium · em breve');
// ordem do mock: palco (pedestal e a faixa do prêmio da temporada), abas, trilha, barra de XP do passe, botões
{ const h = H(), at = s => h.indexOf(s), seq = ['class="ps2-stage"', 'Prêmio da temporada (nível ' + D.tiers + ')', 'class="ps2-tabs"', 'class="ps2-thead"', 'class="ps2-sea"', 'class="ps2-foot"'];
  for (let i = 0; i < seq.length; i++) assert(at(seq[i]) >= 0 && (!i || at(seq[i - 1]) < at(seq[i])), 'ordem dos blocos do mock: ' + seq[i]); }
// QA: em 320 px o cabeçalho "Premium · em breve" aparece inteiro (sem corte) e a tela desenha igual
{ g.xDims = () => ({ H: 560, Wb: 320 }); def.render(); has('<span class="p">Premium · em breve</span>'); has('<span class="f">Grátis</span>'); has('--ci:40px'); sane('largura 320'); g.xDims = () => ({ H: 640, Wb: 390 }); def.render(); has('<span class="p">Premium · em breve</span>'); sane('largura 390'); g.xDims = () => ({}); def.render(); }
assert.strictEqual(count(/class="ps2-row/g), D.tiers, 'uma linha por nível'); assert.strictEqual(count(/class="ps2-cell pr lockp"/g), D.tiers, 'trilha premium inteira trancada');
assert.strictEqual(count(/data-x="claim"/g), 0, 'nada para resgatar no nível 0'); not('Premium ativo'); has('era liberada'); sane('save novo'); noSale('save novo');
def.click(btn('all')); assert.strictEqual(st().free.length, 0); assert(/Nada pronto/.test(X.toast));
out.push('save novo: portão pelo nível e, liberado, ' + D.tiers + ' linhas (grátis e premium), nada pronto, premium trancado, "Em breve" sem preço');

// 2) com XP de passe: prêmios prontos; resgatar chama o módulo e muda o estado
setXp(8 * D.xpPerTier + 45); def.onOpen(); def.render(); has('>8</b><small>DE ' + D.tiers); has('45/' + D.xpPerTier + ' XP'); has('8 prêmios prontos');
assert.strictEqual(count(/data-x="claim" data-t="free"/g), 8); assert.strictEqual(count(/data-x="claim" data-t="premium"/g), 0, 'premium trancado sem o premium'); has('class="ps2-row got now" id="ps2_r8"'); sane('prêmios prontos'); noSale('prêmios prontos');
const gold1 = Math.round(D.free[0].goldk * host.goldUnit()); log.length = 0; def.click(btn('claim', { t: 'free', lv: '1' }));
assert.deepStrictEqual(st().free, [1]); assert.strictEqual(host.gold, gold1, 'o ouro do nível 1 veio do módulo'); assert(log.includes('stats')); assert(X.toast.includes('Nível 1')); has('Resgatado'); assert.strictEqual(count(/data-x="claim" data-t="free"/g), 7); has('7 prêmios prontos');
def.click(btn('claim', { t: 'free', lv: '1' })); assert.deepStrictEqual(st().free, [1], 'não resgata duas vezes'); assert(/já resgatada/.test(X.toast));
def.click(btn('claim', { t: 'free', lv: '20' })); assert.deepStrictEqual(st().free, [1], 'nível não alcançado não paga'); assert(/Ainda não liberou/.test(X.toast));
const items0 = host.items.length; def.click(btn('claim', { t: 'free', lv: '3' })); assert.deepStrictEqual(st().free, [1, 3]); assert.strictEqual(host.items.length, items0 + 1, 'o item do nível 3 entrou'); assert.strictEqual(host.items[items0].slot, D.free[2].item.slot);
// premium trancado: ação forjada não paga
def.click(btn('claim', { t: 'premium', lv: '1' })); assert.deepStrictEqual(st().prem, [], 'premium trancado não paga'); assert(/Exige o Passe Premium/.test(X.toast)); assert.strictEqual(st().premium, false);
log.length = 0; def.click(btn('all')); assert.deepStrictEqual(st().free, [1, 2, 3, 4, 5, 6, 7, 8]); assert.deepStrictEqual(st().prem, []); assert(log.includes('stats')); assert(/6 prêmios/.test(X.toast)); has('nada pronto agora'); has('aria-disabled="true"'); sane('depois de resgatar tudo'); noSale('depois de resgatar tudo');
out.push('resgatar: um nível pelo Sys.pass.claimTier (ouro e item do módulo), sem repetir, sem pagar nível futuro nem premium trancado; Resgatar tudo pelo claimAll');

// 3) compra real desligada: nenhum caminho abre compra; ligada (só neste teste), o preço e o produto vêm do Sys.buy
def.click(btn('prem')); not('role="dialog"'); assert.strictEqual(X.sheet, false); assert(/em breve/.test(X.toast)); def.click(btn('buy')); assert.strictEqual(bought.length, 0); assert.strictEqual(st().premium, false); noSale('compra desligada');
buyOn = true; try { def.render(); has('PRECO-DO-MODULO'); has('data-x="prem"'); not('Premium · em breve'); sane('compra ligada'); def.click(btn('prem')); has('role="dialog"'); has('data-x="buy"'); has(D.premium.length + ' prêmios'); has(D.premiumXpPct + '% de XP do passe'); sane('folha do premium');
  def.click(btn('claim', { t: 'free', lv: '9' })); assert.strictEqual(X.sheet, true, 'com a folha aberta o resto espera'); def.click(btn('sclose')); not('role="dialog"'); assert.strictEqual(bought.length, 0);
  def.click(btn('prem')); def.click(btn('buy')); assert.deepStrictEqual(bought, ['pass_premium'], 'a compra vai pelo xBuy com o produto do catálogo'); not('role="dialog"'); has('Premium ativo'); not('PRECO-DO-MODULO');
} finally { buyOn = false; }
out.push('compra: desligada = só "Em breve" (sem R$, sem Comprar, sem folha); ligada só neste teste = preço do módulo, folha e xBuy com o produto pass_premium');

// 4) com o premium: trilha premium resgata; item acima do portão fica GUARDADO; a asa mostra o nível
assert.strictEqual(st().premium, true); def.render(); has('PREMIUM +' + D.premiumXpPct + '% XP'); assert.strictEqual(count(/data-x="claim" data-t="premium"/g), 8); has('guardada até o <b>nível ' + Sys.loot.DATA.gates[2].lvl + '</b>'); has('guardada até o <b>nível ' + Sys.loot.DATA.wing.minLevel + '</b>'); sane('premium');
const it0 = host.items.length; def.click(btn('claim', { t: 'premium', lv: '1' })); assert.deepStrictEqual(st().prem, [1]); assert.strictEqual(host.items.length, it0 + 1); assert.strictEqual(host.items[it0].r, D.premium[0].item.r);
setXp(17 * D.xpPerTier); def.render(); def.click(btn('claim', { t: 'premium', lv: '17' })); assert(st().prem.includes(17)); assert(st().held.some(h => h.slot === 'wing'), 'a asa ficou guardada'); assert(/guardada até o nível/.test(X.toast)); has('Guardada · Nv. ' + Sys.loot.DATA.wing.minLevel); sane('asa guardada');
out.push('premium: resgata a trilha premium; Épico e asa acima do portão ficam guardados com o nível certo (Sys.loot)');

// 5) prévia no herói: skin do fim do passe, asa e arma vão para o state do drawHeroFull; Sair volta
els.ps2_stc = mkEl('ps2_stc'); els.ps2_stc.getContext = () => ctx; els.ps2_scroll = mkEl('ps2_scroll'); def.onOpen(); def.render(); assert(raf.length >= 1, 'o palco anima');
heroCalls = []; raf.shift()(1000); assert.strictEqual(heroCalls.length, 1); assert.strictEqual(heroCalls[0].st.mount, false, 'a pé por padrão'); assert(heroCalls[0].st.pet === undefined && heroCalls[0].st.skin === undefined, 'pet e skin: os do jogo'); assert(heroCalls[0].k > 0 && isFinite(heroCalls[0].k));
const skinId = Sys.appearance.DATA.passSkin.kael, skinDef = Sys.appearance.FIXED.find(k => k.id === skinId);
has('Skin <em>' + skinDef.name + '</em>'); has('assets/hero/avatar/' + skinDef.avatar + '.png');
def.click(btn('pv', { t: 'premium', lv: String(D.tiers), m: 'main' })); assert.strictEqual(X.pv.kind, 'skin'); assert.strictEqual(X.pv.st.skin, skinId); has('Prévia: ' + skinDef.name); has('data-x="pvout"'); sane('prévia da skin');
heroCalls = []; raf.shift()(1100); assert.strictEqual(heroCalls[0].st.skin, skinId); assert.strictEqual(heroCalls[0].st.wing, undefined, 'a skin não força asa (asa é só item)');
def.click(btn('pv', { t: 'premium', lv: String(D.tiers), m: 'mini' })); assert.strictEqual(X.pv.kind, 'weapon'); assert(X.pv.st.weapon && /^w2\d$/.test(X.pv.st.weapon.id));
def.click(btn('pv', { t: 'premium', lv: '17', m: 'main' })); assert.strictEqual(X.pv.kind, 'wing'); assert.strictEqual(X.pv.st.wing, Sys.stats.DATA.wingDrop.default); has('equipa a partir do nível ' + Sys.loot.DATA.wing.minLevel);
def.click(btn('pv', { t: 'free', lv: '3', m: 'main' })); assert.strictEqual(X.pv.kind, 'weapon'); def.click(btn('pv', { t: 'free', lv: '3', m: 'main' })); assert.strictEqual(X.pv, null, 'tocar de novo sai da prévia');
def.click(btn('pv', { t: 'free', lv: '1', m: 'main' })); assert.strictEqual(X.pv, null, 'ouro não tem prévia'); def.click(btn('pv', { t: 'premium', lv: '17', m: 'main' })); def.click(btn('pvout')); assert.strictEqual(X.pv, null); not('Prévia:');
g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(1200); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
g.S.hero = 'kaia'; def.render(); has('Skin <em>' + Sys.appearance.FIXED.find(k => k.id === Sys.appearance.DATA.passSkin.kaia).name + '</em>'); sane('kaia'); g.S.hero = 'kael';
def.onClose(); delete els.ps2_stc; delete els.ps2_scroll; raf = [];
out.push('prévia: skin do Sys.appearance (' + skinDef.name + '), asa e arma no state do drawHeroFull, a pé, sem asa forçada pela skin; erro no desenho não derruba a tela');

// 6) missões: lista do módulo, resgatar chama o Sys.pass.claimMission e muda o estado; Ir leva para o jogo
g.S = newSave(); setLv(13); def.onOpen({ tab: 'mis' }); def.render(); const L0 = P.list(g.S, host); assert(L0.daily.length >= 1);
for (const m of L0.daily.concat(L0.weekly)) has(g.esc2(m.txt)); has('Diárias'); has('Semanais'); has('0/' + L0.daily.length); assert.strictEqual(count(/data-x="mgo"/g), L0.daily.length + L0.weekly.length); sane('missões'); noSale('missões');
log.length = 0; def.click(btn('mgo', { id: 'd_summon' })); assert(log.includes('view:summon')); def.click(btn('mgo', { id: 'd_kill' })); assert(log.includes('view:battle'));
def.click(btn('mclaim', { id: 'd_ult' })); assert.strictEqual(st().d.c.length, 0, 'missão incompleta não paga'); assert.strictEqual(st().xp, 0);
P.track(g.S, host, 'ult', 3); def.tick(); has('data-x="mclaim" data-id="d_ult"'); const gems0 = host.gems, mU = D.daily.find(m => m.id === 'd_ult'); log.length = 0; def.click(btn('mclaim', { id: 'd_ult' }));
assert.deepStrictEqual(st().d.c, ['d_ult']); assert.strictEqual(st().xp, mU.pxp); assert.strictEqual(host.gems, gems0 + mU.gems); assert(log.includes('save')); assert(X.toast.includes('+' + mU.pxp + ' XP do passe')); has('Feito'); has('1/' + L0.daily.length); sane('missão resgatada');
setXp(D.xpPerTier - 5); P.track(g.S, host, 'chest', 1); def.render(); def.click(btn('mclaim', { id: 'd_chest' })); assert.strictEqual(P.tier(g.S), 1); assert(X.lvup && X.lvup.tier === 1); has('PASSE NÍVEL 1!'); has('ps2-nb'); sane('subiu de nível');
def.click(btn('tab', { t: 'track' })); assert.strictEqual(X.tab, 'track'); has('data-x="claim" data-t="free" data-lv="1"'); sane('volta à trilha');
out.push('missões: ' + L0.daily.length + ' diárias e ' + L0.weekly.length + ' semanais do módulo, resgate pelo claimMission (XP e diamantes), incompleta não paga, "PASSE NÍVEL 1!" ao subir, Ir abre a tela certa');

// 7) todos os botões das duas abas, nos dois heróis e em todas as eras: tocar em cada um não gera exceção; toda imagem citada existe em disco
let taps = 0;
for (const hero of ['kael', 'kaia']) for (const prem of [false, true]) { g.S = newSave(hero); setLv(prem ? 60 : 13); setXp(D.tiers * D.xpPerTier); if (prem) P.setPremium(g.S, true);
  for (const tab of ['track', 'mis']) { def.onOpen({ tab }); def.render(); for (const b of buttons()) { def.onOpen({ tab }); def.render(); try { def.click(b); while (timers.length) timers.shift()(); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane('toque ' + b.dataset.x); if (!prem) noSale('toque ' + b.dataset.x); } } }
for (let e = 0; e <= 8; e++) { host._eraMax = e; g.S = newSave(); setLv(120); def.onOpen(); def.render(); sane('era ' + e); } host._eraMax = 2;
assert(imgs.size >= 10, 'imagens coletadas: ' + imgs.size);
for (const u of imgs) { assert(!/^(https?:|\/\/)/.test(u), 'imagem de fora: ' + u); if (/^data:/.test(u)) continue; assert(fs.existsSync(path.join(R, u.split('?')[0])), 'imagem não existe em disco: ' + u); }
// 8) ARTE PINTADA: toda peça citada existe em disco; a tela usa as peças; cada uma tem reserva (onerror → Pass2.bad, canvas por código, ou a borda/degradê em CSS que continuam no cartão)
{ const A = g.Pass2, U = A.artUrls(), css = g.document.head.children.map(c => c.textContent).join('');
  assert.strictEqual(U.length, 4 + 6, 'arte: 4 peças + 6 ícones de prêmio'); for (const u of U) assert(fs.existsSync(path.join(R, u)), 'arte não existe em disco: ' + u);
  for (const k of ['faixa', 'pedestal', 'gratis', 'premium']) assert(A.SKIN[k] && fs.existsSync(path.join(R, A.SKIN[k])), 'peça sem arquivo: ' + k);
  for (const m of SRC.matchAll(/'(assets\/(?:ui|icons)\/pass\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
  assert(!/pegaso/.test(SRC), 'o pégaso não entra (o palco é o herói)'); assert(!/100% 100% no-repeat/.test(SRC), 'nenhuma peça esticada nos dois eixos');
  // cartões da trilha: 9 fatias da peça por cima da borda e do degradê em CSS (que ficam como reserva nativa quando a imagem não carrega)
  assert(css.includes('.ps2-cell{border-image:url(' + A.SKIN.gratis + ') 24 fill/12px}') && css.includes('.ps2-cell.pr{border-image:url(' + A.SKIN.premium + ') 75 24 75 50 fill/'), 'cartões em 9 fatias');
  assert(/\.ps2-cell\{[^}]*background:linear-gradient\(180deg,var\(--free1\),var\(--free2\)\);border:2px solid var\(--blue\)/.test(css) && /\.ps2-cell\.pr\{background:linear-gradient/.test(css), 'reserva dos cartões: borda e degradê em CSS continuam');
  // pedestal: desenhado no canvas quando a imagem está pronta; sem imagem (como aqui, em node) ou em falha, o pedestal por código
  assert(/drawImage\(ped,/.test(SRC) && /x\.fillRect\(PX-RX,GY,RX\*2,PH\)/.test(SRC) && /pedOwn\.onerror=/.test(SRC), 'pedestal: arte no canvas com a reserva por código');
  { const I0 = g.Image, seen = []; g.Image = function () { this.complete = true; this.naturalWidth = 520; this.naturalHeight = 160; }; const d0 = ctx.drawImage; ctx.drawImage = (im, ...a) => { seen.push(a); };
    try { g.S = newSave(); setLv(60); def.onClose(); raf.length = 0; els.ps2_stc = mkEl('ps2_stc'); els.ps2_stc.getContext = () => ctx; def.onOpen(); def.render(); heroCalls = []; raf.shift()(1000); assert.strictEqual(seen.length, 1, 'a peça do pedestal é desenhada uma vez por quadro'); const a = seen[0]; assert(Math.abs(a[2] / a[3] - 520 / 160) < 0.01, 'pedestal na proporção da peça');
      assert.strictEqual(heroCalls.length, 1); assert(Math.abs(heroCalls[0].y - (a[1] + 46 * a[3] / 160)) < 0.6 && Math.abs(heroCalls[0].x - (a[0] + 262 * a[2] / 520)) < 0.6, 'os pés do herói ficam no centro do tampo pintado');
      A.bad('pedestal'); seen.length = 0; heroCalls = []; raf.shift()(1100); assert.strictEqual(seen.length, 0, 'pedestal em falha: reserva por código'); assert.strictEqual(heroCalls.length, 1); }
    finally { g.Image = I0; ctx.drawImage = d0; delete A.BAD.pedestal; } }
  // faixa e ícones: na tela com a arte; em falha, o desenho de antes
  g.S = newSave(); setLv(60); setXp(D.tiers * D.xpPerTier); P.setPremium(g.S, true); def.onOpen({ tab: 'track' }); def.render(); sane('arte: trilha');
  has('<span class="sk"><img src="assets/ui/pass/passe_faixa.png"'); has('class="ps2-rib sk'); has('src="assets/icons/pass/diamonds.png"'); has('src="assets/icons/pass/mountfrag.png"'); has('src="assets/icons/pass/stones.png"'); has('src="assets/icons/pass/essence.png"');
  def.onOpen({ tab: 'mis' }); def.render(); sane('arte: missões'); has('src="assets/icons/pass/xp.png"'); has('src="assets/icons/pass/diamonds.png"');
  for (const k of ['faixa', 'diamonds', 'xp', 'mountfrag', 'stones', 'essence', 'petfood']) A.bad(k);
  not('assets/icons/pass/'); has('<img src="assets/ui/gem.png" alt="">+'); sane('reserva: missões');
  def.onOpen({ tab: 'track' }); def.render(); not('assets/icons/pass/'); not('passe_faixa.png'); not('class="ps2-rib sk'); has('src="assets/ui/gem.png"'); has('<svg viewBox="0 0 24 24" width="16" height="16"'); has('Prêmio da temporada (nível ' + D.tiers + '): <b>'); sane('reserva: trilha');
  for (const k of Object.keys(A.BAD)) delete A.BAD[k]; def.render(); has('class="ps2-rib sk'); }
out.push('arte pintada: 10 arquivos em disco; faixa, pedestal no canvas (pés no centro do tampo), cartões em 9 fatias e ícones de diamante, XP, fragmento, pedra e essência; cada peça com reserva');
def.tick(); def.onClose(); assert.strictEqual(def.busy(), false);
out.push('toques: ' + taps + ' botões tocados sem exceção (2 heróis, com e sem premium, 2 abas); ' + imgs.size + ' imagens citadas, todas em disco (eras 0 a 8)');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
