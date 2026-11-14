'use strict';
// Teste de fumaça do js/fogueira.js (FOGUEIRA DAS ERAS V5 na tela de batalha) em Node: DOM de mentira, módulo REAL Sys.bonfire ligado só na memória.
// Rodar: node test/paineis/fogueira.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
['stats', 'level', 'loot', 'forge', 'bonfire'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, BF = Sys.bonfire;
assert.strictEqual(BF.DATA.on, false, 'o módulo nasce desligado');

/* ---------- DOM de mentira ---------- */
const els = {};
function mkEl(tag){ const cls = new Set(); const e = { tag, id: '', children: [], parentNode: null, dataset: {}, _h: '', _ev: {}, textContent: '', hidden: false, scrollTop: 0,
    style: { cssText: '', setProperty(k, v){ this[k] = v; } },
    classList: { add: (...a) => a.forEach(x => cls.add(x)), remove: (...a) => a.forEach(x => cls.delete(x)), contains: x => cls.has(x), toggle: (x, on) => { if (on) cls.add(x); else cls.delete(x); } },
    setAttribute(k, v){ this['@' + k] = v; }, addEventListener(t, f){ this._ev[t] = f; },
    appendChild(c){ c.parentNode = this; this.children.push(c); return c; }, remove(){ if (this.parentNode){ this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; } } };
  Object.defineProperty(e, 'innerHTML', { get(){ return this._h; }, set(v){ this._h = v; } });
  if (tag === 'img'){ e.onload = null; e.onerror = null; e.naturalWidth = 0; imgs.push(e); } return e; }
const imgs = [];
const body = mkEl('body'), head = mkEl('head'), fbw = mkEl('div'); fbw.style.top = '0px'; els.fb_w = fbw;
g.document = { head, body, createElement: t => mkEl(t), getElementById: id => els[id] || null };
const wl = {}; g.addEventListener = (t, f) => { wl[t] = f; }; g.removeEventListener = t => { delete wl[t]; };
let timers = []; g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => { timers = []; };
g.fetch = undefined;   // sem rede no teste: a chama animada é conferida à mão (loopApply) e pela ausência (não quebra nada)

/* ---------- jogo de mentira: só o que a Fogueira lê ---------- */
const said = [], calls = []; let BAG = 30, itemName = it => it.name || ('Peça ' + it.slot);
g.toast = m => said.push(String(m)); g.snd = () => {}; g.view = 'battle'; g.floatText = (x, y, t) => calls.push('float:' + t);
const lastSaid = () => said[said.length - 1] || '';
const newSave = () => ({ gold: 0, inv: [], eq: {}, nextId: 1, sys: {}, stage: 5, best: 5 });
g.S = newSave();
const host = makeHost({ level: 60, eraMax: 2, seed: 7 });
Object.assign(host, {
  items: () => g.S.inv, bagMax: () => BAG,
  addItem: o => { o.id = g.S.nextId++; g.S.inv.push(o); calls.push('add'); return o; },
  removeItem: it => { if (!it || it.id == null) return false; for (const s in g.S.eq) if (g.S.eq[s] === it.id) return false; const i = g.S.inv.findIndex(x => x.id === it.id); if (i < 0) return false; g.S.inv.splice(i, 1); return true; },
  equip: it => { const x = g.S.inv.find(q => q.id === it.id); if (!x) return false; g.S.eq[x.slot] = x.id; calls.push('equip'); return true; },
  equipped: () => { const o = {}; for (const s in g.S.eq){ const it = g.S.inv.find(i => i.id === g.S.eq[s]); if (it) o[s] = it; } return o; },
  fcOf: it => (it.r + 1) * 100 + (it.qp || 0) / 100, delta: it => { const c = host.equipped()[it.slot]; return host.fcOf(it) - (c ? host.fcOf(c) : 0); },
  addGold: n => { g.S.gold += n; }, spendGold: n => { if (!(n >= 0) || g.S.gold < n) return false; g.S.gold -= n; return true; },
  itemName: it => itemName(it), rarName: r => ['Básico', 'Raro', 'Épico', 'Mítico', 'Lendário'][r] || '', rarColor: r => ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'][r] || '#fff',
  thumb: it => 'assets/icons/slots/era' + (it.e | 0) + '_' + ({ armor: 'vest', hat: 'helmet', wing: 'wings' }[it.slot] || it.slot) + '.png', onChange: () => calls.push('change') });
Sys.host = host;
/* espiões nas funções do módulo que a tela tem de chamar */
const spy = {}; for (const k of ['tap', 'dismantle', 'makeRoom', 'autoRun', 'setAuto', 'quick', 'recover', 'levelUp', 'lock', 'offline', 'killCounts']){ const f = BF[k]; spy[k] = 0; BF[k] = function(){ spy[k]++; return f.apply(this, arguments); }; }
let keyOn = false; g.fogOn = () => keyOn;

const SRC = fs.readFileSync(path.join(R, 'js/fogueira.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'fogueira.js' });
const F = g.Fogueira, out = [];
const st = () => F.state(), o = () => BF.ensure(g.S);
const html = () => { const m = F.els(); return m ? m.btn.innerHTML + m.card.innerHTML + m.off.innerHTML + m.sheet.innerHTML : ''; };
const cardH = () => F.els().card.innerHTML, sheetH = () => F.els().sheet.innerHTML;
const un = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = h => (h.match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tapB = (a, v) => F.act(a, { dataset: { fg: a, v } });
const ticks = (n, dt) => { for (let i = 0; i < n; i++) F.tick(dt || 0.25); };
const exists = p => fs.existsSync(path.join(R, p));
const seenImg = new Set();
/* toda tela conferida: todo <button> com ação tratada, sem emoji, sem texto quebrado, sem reticências, sem texto de venda ou pressa, imagens em disco */
function sane(what){ const h = html(), bt = buttons(h); assert(bt.length >= 2, what + ': sem botões');
  for (const b of bt){ assert(b.dataset.fg, what + ': botão sem data-fg: ' + b.tag); assert(F.ACTIONS.includes(b.dataset.fg), what + ': ação não tratada: ' + b.dataset.fg); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto: ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(h), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(h), what + ': texto quebrado: ' + (h.match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/text-overflow|…|\.\.\./.test(h), what + ': reticências'); assert(!/compr|preço|R\$|sorte|promo|oferta|corra|só hoje|últimas horas|imperd|vip/i.test(h.replace(/<[^>]*>/g, ' ')), what + ': texto de venda ou pressa');
  for (const m of h.matchAll(/<img[^>]*src="([^"]+)"/g)){ const p = un(m[1]); assert(exists(p), what + ': imagem não existe em disco: ' + p); seenImg.add(p); }
  return bt.length; }

// 0) o arquivo: escopo próprio, não liga chave, sem diálogo do navegador, sem emoji, sem reticências, toda ação da lista com tratador
{ const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  assert(/^\(function\(\)\{/m.test(code) && /\}\)\(\);\s*$/.test(code), 'escopo próprio (IIFE)');
  assert(!/DATA\.on\s*=(?!=)|FOGUEIRA_ON\s*=(?!=)|PANEL_ON/.test(code), 'o arquivo não liga chave nenhuma');
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(code), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
  assert(!/text-overflow|ellipsis|…/.test(code), 'nenhuma regra corta texto com reticências'); assert(!/'[^'\n]*\.\.\.[^'\n]*'/.test(code), 'nenhum texto com três pontos');
  assert(!/compr|preço|R\$|sorteio|promo|corra|só hoje|imperd/i.test(code), 'sem texto de venda, sorteio ou pressa');
  assert(!/getBoundingClientRect/.test((code.match(/function tick[\s\S]*?\n/) || [''])[0] + (code.match(/function stepFly[\s\S]*?\n\s*if \(f\.txt\)/) || [''])[0]), 'sem leitura de layout no laço');
  for (const a of F.ACTIONS) assert(code.includes("a === '" + a + "'"), 'ação da lista sem tratador: ' + a);
  assert(/\.fgx-gd\{[^}]*#ffe07a[^}]*color:#2a1403/.test(SRC), 'botão dourado com texto escuro');
  for (const sel of ['.fgx-bt button', '.fgx-sg button', '.fgx-qd button']) assert(new RegExp(sel.replace('.', '\\.') + '\\{[^}]*min-height:4[04]px').test(SRC), sel + ': toque de 40 px ou mais');
  assert(/\.fgx-x\{[^}]*width:40px;height:40px/.test(SRC) && /\.fgx-g::after\{[^}]*inset:-8px/.test(SRC) && /\.fgx-bi\{[^}]*min-height:48px/.test(SRC), 'fechar, engrenagem e peça da mochila com 40 px ou mais de toque');
  assert(/minmax\(0,1fr\)/.test(SRC) && /overflow-x:hidden/.test(SRC), 'sem rolagem lateral: colunas minmax(0,1fr)');
  out.push('arquivo: IIFE, não liga chave, sem diálogo do navegador, sem emoji, sem reticências, sem texto de venda, ' + F.ACTIONS.length + ' ações com tratador'); }

// 1) DESLIGADA: nada é montado (nem com a chave do jogo sem o módulo, nem com o módulo sem a chave do jogo)
{ keyOn = false; BF.DATA.on = true; ticks(8); assert.strictEqual(F.mounted(), false); assert.strictEqual(F.mount(), false);
  keyOn = true; BF.DATA.on = false; ticks(8); assert.strictEqual(F.mounted(), false);
  assert.strictEqual(fbw.children.length, 0, 'nenhum elemento na batalha'); assert.strictEqual(head.children.length, 0, 'nenhum estilo'); assert(!body.classList.contains('fogv5')); assert.deepStrictEqual(Object.keys(wl), [], 'nenhum ouvinte');
  assert.strictEqual(F.onKill(100, 100), false); assert.strictEqual(F.onBrasa(100, 100, 3), false); F.draw({}); assert.strictEqual(F.offline(7200), null); assert.strictEqual(spy.offline, 0); assert.strictEqual(spy.tap, 0);
  assert.strictEqual(g.S.sys.bonfire, undefined, 'desligada não escreve no save');
  out.push('desligada: não monta elemento, estilo nem ouvinte; não escreve no save; ganchos viram nada'); }

// 2) LIGADA: monta dentro do HUD da batalha; x1/x2/x4 só mudam de lugar (coluna à direita) e voltam ao desmontar
BF.DATA.on = true; keyOn = true;
const spdPar = mkEl('div'), spd = mkEl('div'); spdPar.style.cssText = 'position:absolute;left:10px;top:calc(100% - 72px)'; spd.style.cssText = 'height:50px;display:flex;gap:2px'; spdPar.appendChild(spd); els.fb_spd = spd;
els.app = { clientWidth: 390, clientHeight: 844 };
{ ticks(1); assert.strictEqual(F.mounted(), true, 'ligada monta sozinha no relógio'); assert.strictEqual(fbw.children.length, 1); assert.strictEqual(fbw.children[0].id, 'fgx'); assert.strictEqual(head.children.length, 1); assert(body.classList.contains('fogv5'));
  const h = html(); assert(h.includes('data-fg="forge"') && h.includes('data-fg="sheet"') && h.includes('id="fgx_bra"') && h.includes('id="fgx_pot"') && h.includes('id="fgx_au"') && h.includes(F.FOG_ART(1)));
  assert.strictEqual(st().hud.lv, 1); assert.strictEqual(st().hud.bra, 0); assert.strictEqual(st().card, null); sane('montada');
  assert.strictEqual(st().speed, 'col'); assert(/right:6px;top:232px/.test(spdPar.style.cssText) && /flex-direction:column/.test(spd.style.cssText), 'x1/x2/x4 em coluna à direita, abaixo do Baú'); assert.strictEqual(spd.children.length, 0, 'nenhum botão de velocidade criado');
  els.app = { clientWidth: 360, clientHeight: 640 }; wl.resize(); ticks(1); assert.strictEqual(st().speed, 'row', 'tela baixa: fora da faixa dos inimigos'); assert(/left:10px/.test(spdPar.style.cssText));
  els.app = { clientWidth: 390, clientHeight: 844 }; wl.resize(); ticks(1); assert.strictEqual(st().speed, 'col');
  out.push('ligada: monta no HUD (botão, engrenagem, selo de Brasas, arco do pote, estágio 1); x1/x2/x4 reposicionados sem criar botão'); }

// 3) sem Brasas: o toque explica quanto falta e não chama a forja
{ BF.addBrasas(g.S, 'kill', 7, { stage: 5, maxStage: 5 }); tapB('forge'); assert.strictEqual(spy.tap, 0); assert(/Sem Brasas\. Faltam 13 abates em fase nova/.test(lastSaid()), lastSaid()); assert.strictEqual(st().card, null);
  out.push('sem Brasas: "' + lastSaid() + '"'); }

// 4) o toque forja pela regra do módulo e mostra o cartão; Equipar / Guardar / Desmontar chamam o que devem e o cartão fecha
{ BF.addBrasas(g.S, 'missions'); assert.strictEqual(o().bra, 20); itemName = () => 'Clava <b>x</b> "q"';
  tapB('forge'); assert.strictEqual(spy.tap, 1); assert.strictEqual(o().bra, 19, 'nível 1: 1 peça = 1 Brasa'); const c1 = st().card; assert(c1 && c1.why === 'forge' && c1.it && c1.it.src === 'bonfire'); assert.strictEqual(g.S.inv.length, 0, 'a peça não entra sozinha na mochila');
  const h = cardH(); assert(h.includes('data-fg="equip"') && h.includes('data-fg="keep"') && h.includes('data-fg="sell"') && h.includes('Equipar') && h.includes('Guardar') && h.includes('Desmontar') && h.includes('Sua: nenhuma') && h.includes('de FC'));
  assert(h.includes('Clava &lt;b&gt;x&lt;/b&gt; &quot;q&quot;') && !h.includes('<b>x</b>'), 'texto escapado'); assert(/class="fgx-gd" data-fg="equip"/.test(h), 'Equipar é o dourado'); sane('cartão');
  tapB('forge'); assert.strictEqual(spy.tap, 1, 'com cartão aberto não forja outra'); assert(/Decida a peça do cartão primeiro/.test(lastSaid()));
  calls.length = 0; tapB('equip'); assert(calls.includes('add') && calls.includes('equip') && calls.includes('change')); assert.strictEqual(g.S.eq[c1.it.slot], c1.it.id); assert.strictEqual(st().card, null); assert.strictEqual(cardH(), '', 'o cartão fecha');
  itemName = it => it.name || ('Peça ' + it.slot);
  tapB('forge'); const c2 = st().card; calls.length = 0; tapB('keep'); assert(calls.includes('add') && !calls.includes('equip')); assert(g.S.inv.includes(c2.it)); assert.strictEqual(st().card, null); assert(/Guardou na mochila/.test(lastSaid()));
  tapB('forge'); const c3 = st().card, n0 = g.S.inv.length, d0 = spy.dismantle, xp0 = o().xp; assert(/\+\d+ ouro · \+\d+ XP/.test(cardH()), 'o cartão diz o que o desmanche devolve'); tapB('sell');
  assert.strictEqual(spy.dismantle, d0 + 1); assert.strictEqual(g.S.inv.length, n0, 'a peça desmontada não fica na mochila'); assert(o().recent.some(x => x.item === c3.it), 'fica nos últimos desmanches (recuperar)'); assert(o().xp > xp0, 'XP da Fogueira'); assert.strictEqual(st().card, null); assert(/Desmontou: \+/.test(lastSaid()));
  assert.strictEqual(spy.tap, 3); out.push('toque: Sys.bonfire.tap forja, cartão "nova x a sua" com Equipar (host.equip), Guardar (mochila) e Desmontar (Sys.bonfire.dismantle); fecha em cada ação'); }

// 5) lote do nível: 2 peças por toque no nível 4, um cartão por vez com "+1 na fila"
{ o().lv = 4; tapB('forge'); assert.strictEqual(st().queue.length, 1); assert(cardH().includes('+1 na fila')); assert(/Forjou 2 peças: 2 por toque no nível 4/.test(lastSaid())); sane('fila');
  tapB('keep'); assert(st().card && st().queue.length === 0 && !cardH().includes('na fila')); tapB('keep'); assert.strictEqual(st().card, null);
  out.push('lote: no nível 4 o toque forja 2 (2 Brasas) e os cartões vêm um por vez'); }

// 6) mochila cheia: com tudo trancado explica e a peça não se perde; com peça destrancada o módulo abre espaço (makeRoom)
{ BAG = g.S.inv.length; for (const it of g.S.inv) BF.lock(g.S, it, true); tapB('forge'); if (st().queue.length) { /* lote de 2 */ } const c = st().card, m0 = spy.makeRoom;
  tapB('keep'); assert(/Mochila cheia e sem peça destrancada/.test(lastSaid()), lastSaid()); assert.strictEqual(st().card, c, 'o cartão continua aberto'); assert.strictEqual(g.S.inv.length, BAG);
  tapB('equip'); assert(/Mochila cheia/.test(lastSaid())); assert.strictEqual(st().card, c);
  const free = g.S.inv.find(x => g.S.eq[x.slot] !== x.id); BF.lock(g.S, free, false); tapB('keep'); assert(spy.makeRoom > m0); assert(/Mochila cheia: desmontei a pior destrancada/.test(lastSaid()), lastSaid()); assert.strictEqual(g.S.inv.length, BAG); assert(g.S.inv.includes(c.it) && !g.S.inv.includes(free));
  while (st().card) tapB('sell'); BAG = 30; for (const it of g.S.inv) BF.lock(g.S, it, false);
  out.push('mochila cheia: tudo trancado = explica e mantém o cartão; com peça destrancada, makeRoom desmonta a pior e a nova entra'); }

// 7) automático: abre no nível 3; liga/desliga pelo setAuto; roda pelo autoRun; PAUSA em Épico ou melhor e abre o cartão
{ o().lv = 2; tapB('on'); assert.strictEqual(o().auto.on, false); assert(/automático abre no nível 3/.test(lastSaid()));
  o().lv = 3; BF.addBrasas(g.S, 'missions'); const s0 = spy.setAuto; tapB('on'); assert(spy.setAuto > s0); assert.strictEqual(o().auto.on, true); ticks(1); assert.strictEqual(st().hud.auto, 'AUTO');
  const a0 = spy.autoRun, b0 = o().bra; ticks(8); assert(spy.autoRun > a0, 'o relógio chama o autoRun'); assert(o().bra < b0, 'gasta Brasas pela regra do módulo'); assert(st().status && /^Automático: /.test(st().status.txt)); assert(cardH().includes('role="status"')); sane('automático');
  g.view = 'gear'; const a1 = spy.autoRun; ticks(12); assert.strictEqual(spy.autoRun, a1, 'com outra tela aberta o automático espera'); g.view = 'battle';
  const real = BF.autoRun, ep = { slot: 'boots', r: 2, e: 2, qp: 4100, name: 'Botas Épicas', subs: [] }; BF.autoRun = () => ({ ok: true, done: 1, equipped: 0, sold: 0, kept: 0, pause: ep }); ticks(8); BF.autoRun = real;
  assert(st().card && st().card.why === 'pause' && st().card.it === ep); assert.strictEqual(st().auto.paused, true); assert.strictEqual(st().hud.auto, 'PAUSA'); assert(cardH().includes('Automático pausou: saiu Épico. Você decide.') && cardH().includes('3 estrelas')); sane('pausa');
  const a2 = spy.autoRun; ticks(12); assert.strictEqual(spy.autoRun, a2, 'pausado não forja'); tapB('keep'); assert.strictEqual(st().auto.paused, false); assert(g.S.inv.includes(ep));
  tapB('off'); assert.strictEqual(o().auto.on, false); ticks(1); assert.strictEqual(st().hud.auto, ''); const a3 = spy.autoRun; ticks(12); assert.strictEqual(spy.autoRun, a3, 'desligado não roda');
  /* uma peça por vez sem a conveniência: com lote 3 o módulo é chamado com lote 1, e a preferência do jogador volta para 3 */
  BF.setAuto(g.S, { on: true, batch: 3 }); const seen = []; BF.autoRun = function(S2, h2){ seen.push(BF.ensure(S2).auto.batch); return real.call(this, S2, h2); }; ticks(8); BF.autoRun = real; while (st().card) tapB('keep');
  assert(seen.length >= 1 && seen.every(x => x === 1), 'uma peça por chamada'); assert.strictEqual(o().auto.batch, 3, 'a escolha do jogador não muda'); BF.setAuto(g.S, { on: false, batch: 1 });
  out.push('automático: abre no nível 3, liga/desliga (setAuto), roda (autoRun), espera fora da batalha, PAUSA em Épico com cartão, uma peça por vez'); }

// 8) painel: nível, Subir (levelUp), 9 estágios, chances, automático, mochila com cadeado, desmontar rápido em dois toques, recuperar
{ ticks(8); tapB('sheet'); assert.strictEqual(st().sheet, true); const h = sheetH(); assert(h.includes('role="dialog"') && h.includes('Fogueira · nível 3 · Fogueira de pedras') && h.includes('XP da Fogueira') && h.includes('Chances no nível 3') && h.includes('Brasas só se ganham jogando'));
  for (let n = 1; n <= 9; n++) assert(h.includes(F.FOG_ART(n)), 'estágio ' + n + ' na galeria'); assert.strictEqual((h.match(/class="fgx-gi"/g) || []).length, 9); sane('painel');
  o().xp = 0; const l0 = spy.levelUp; tapB('up'); assert.strictEqual(spy.levelUp, l0 + 1); assert.strictEqual(o().lv, 3); assert(/de XP da Fogueira\. Forje e desmonte/.test(lastSaid()), lastSaid());
  o().xp = BF.xpNeed(3); g.S.gold = 0; tapB('up'); assert.strictEqual(o().lv, 3); assert(/Falta ouro: subir custa/.test(lastSaid()));
  g.S.gold = 1e9; tapB('up'); assert.strictEqual(o().lv, 4); assert(/Fogueira nível 4 · 2 peças por toque/.test(lastSaid()), lastSaid()); assert(g.S.gold < 1e9); assert(sheetH().includes('nível 4'));
  o().xp = BF.xpNeed(4); tapB('up'); assert.strictEqual(o().lv, 5); assert(/A Fogueira evoluiu: Braseiro de bronze \(nível 5\)/.test(lastSaid())); ticks(1); assert.strictEqual(st().hud.stage, 2);
  tapB('sellb', '2'); assert.strictEqual(o().auto.sellBelow, 2); tapB('eq', '0'); assert.strictEqual(o().auto.equip, false); tapB('batch', '5'); assert.strictEqual(o().auto.batch, 5); tapB('eq', '1'); tapB('batch', '1'); tapB('sellb', '1');
  /* mochila: abrir uma peça, trancar, tentar desmontar trancada, fechar */
  const it = g.S.inv.find(x => g.S.eq[x.slot] !== x.id); assert(it, 'há peça guardada'); assert(sheetH().includes('data-fg="open" data-v="' + it.id + '"')); tapB('open', String(it.id));
  assert(st().card && st().card.why === 'bag' && st().sheet === false); assert(cardH().includes('data-fg="lock"') && cardH().includes('Trancar') && cardH().includes('data-fg="cclose"')); sane('cartão da mochila');
  tapB('lock'); assert.strictEqual(BF.isLocked(g.S, it), true); assert(cardH().includes('Destrancar')); const d0 = spy.dismantle; tapB('sell'); assert.strictEqual(spy.dismantle, d0); assert(/Peça trancada/.test(lastSaid())); assert(g.S.inv.includes(it));
  tapB('cclose'); assert.strictEqual(st().card, null); tapB('sheet'); assert(sheetH().includes('trancada'));
  /* desmontar rápido: 1º toque arma e diz quantas; 2º toque chama o módulo; a trancada fica */
  for (let i = 0; i < 3; i++) host.addItem({ slot: 'gloves', r: 0, e: 2, qp: 0, name: 'Luva fraca ' + i, subs: [] }); const q0 = spy.quick, n0 = g.S.inv.length; tapB('below', '1');
  assert.strictEqual(spy.quick, q0, 'o 1º toque não desmonta'); assert(st().arm && st().arm.n >= 3); assert(/Toque de novo: desmontar \d+ peças/.test(sheetH())); sane('desmontar rápido armado');
  tapB('below', '1'); assert.strictEqual(spy.quick, q0 + 1); assert(g.S.inv.length <= n0 - 3); assert(g.S.inv.includes(it), 'a trancada nunca sai'); assert(/Desmontei \d+ peças/.test(lastSaid())); assert.strictEqual(st().arm, null);
  tapB('worse'); tapB('close'); tapB('sheet'); assert.strictEqual(st().arm, null, 'trocar de ação desarma');
  /* recuperar */
  const rc = o().recent[0]; assert(rc && sheetH().includes('data-fg="rec" data-v="' + rc.item.id + '"')); const r0 = spy.recover; g.S.gold = 1e9; tapB('rec', String(rc.item.id)); assert.strictEqual(spy.recover, r0 + 1); assert(/Recuperada: /.test(lastSaid())); assert(g.S.inv.some(x => x === rc.item));
  tapB('rec', 'nao-existe'); assert(/O tempo de recuperar esta peça acabou/.test(lastSaid())); sane('painel depois das ações'); tapB('close'); assert.strictEqual(st().sheet, false); assert.strictEqual(sheetH(), '');
  out.push('painel: Subir (xp, ouro, nível, evolução de estágio), 9 estágios, automático, cadeado, desmontar rápido em dois toques, recuperar'); }

// 9) segurar 0,5 s abre o painel e o toque que solta não forja; todos os botões do painel tocados sem exceção
{ const root = F.els().root, t0 = spy.tap; timers = []; root._ev.pointerdown({ target: { closest: s => s === '#fgx_b' ? {} : null } }); assert.strictEqual(timers.length, 1); timers.shift()(); assert.strictEqual(st().sheet, true);
  root._ev.click({ target: { closest: () => ({ dataset: { fg: 'forge' } }) } }); assert.strictEqual(spy.tap, t0, 'soltar depois de segurar não forja');
  root._ev.pointerdown({ target: { closest: s => s === '#fgx_b' ? {} : null } }); root._ev.pointerup(); assert.strictEqual(timers.length, 0, 'soltar antes de 0,5 s cancela');
  root._ev.click({ target: { closest: () => ({ dataset: { fg: 'close' } }) } }); assert.strictEqual(st().sheet, false);
  BF.addBrasas(g.S, 'missions'); g.S.gold = 1e9; let taps = 0; tapB('sheet'); const list = buttons(sheetH());
  for (const b of list){ if (!st().sheet) tapB('sheet'); try { F.act(b.dataset.fg, b); F.act(b.dataset.fg, b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } while (st().card) tapB(st().card.why === 'bag' ? 'cclose' : 'keep'); sane('toque ' + b.dataset.fg); }
  if (st().sheet) tapB('close'); BF.setAuto(g.S, { on: false, batch: 1 }); assert(taps >= 15);
  out.push('toques: segurar abre o painel; ' + taps + ' botões do painel tocados duas vezes sem exceção, tela sempre íntegra'); }

// 10) Brasa voando: só quando o abate conta (fase nova); teto de faíscas; desenho e pouso sem erro
{ const k0 = spy.killCounts; g.S.stage = 5; g.S.best = 5; assert.strictEqual(F.onKill(250, 400), true); assert(spy.killCounts > k0); assert.strictEqual(st().fly, 1);
  g.S.stage = 2; assert.strictEqual(F.onKill(250, 400), false, 'fase já vencida: sem faísca'); g.S.stage = 5; for (let i = 0; i < 60; i++) F.onKill(250, 400); assert(st().fly <= 24, 'teto de faíscas'); assert.strictEqual(st().fly, 24);
  let drawn = 0; const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } }); F.draw(ctx); assert(drawn >= 24 * 4);
  ticks(80, 0.05); assert.strictEqual(st().fly, 0, 'as faíscas pousam e somem'); calls.length = 0; assert.strictEqual(F.onBrasa(250, 400, 3), true); ticks(60, 0.05); assert(calls.includes('float:+3 Brasas')); const T = F.target(); assert(isFinite(T.x) && isFinite(T.y));
  out.push('faíscas: voam só no abate que conta (killCounts), teto de 24, "+3 Brasas" ao pousar'); }

// 11) tempo fora: uma vez só, pelo Sys.bonfire.offline; resumo com botão; menos de 5 min não mostra nada
{ const b0 = o().bra; o().bra = 10; const r = F.offline(3600); assert.strictEqual(spy.offline, 1); assert.strictEqual(r.brasas, 3); assert.strictEqual(o().bra, 13); assert(/A Fogueira juntou 3 Brasas em 1 h 0 min\./.test(r.text), r.text);
  const h = F.els().off.innerHTML; assert(h.includes('Enquanto você esteve fora') && h.includes('3 Brasas') && h.includes('data-fg="offok"') && /class="fgx-gd" data-fg="offok"/.test(h)); sane('tempo fora');
  tapB('forge'); assert(/Feche o resumo primeiro/.test(lastSaid())); tapB('offok'); assert.strictEqual(F.els().off.innerHTML, ''); assert.strictEqual(F.offline(3600), null, 'uma vez por abertura'); assert.strictEqual(spy.offline, 1);
  assert.strictEqual(F.offlineText({ on: true, brasas: 0, counted: 100 }), ''); assert(/limite de Brasas do tempo fora por dia/.test(F.offlineText({ on: true, brasas: 40, counted: 43200, dayLeft: 0 }))); o().bra = b0;
  out.push('tempo fora: Sys.bonfire.offline uma vez, "' + r.text + '"'); }

// 11b) Ladrão de Brasas: a ENTRADA no painel só aparece com o módulo ligado E a tela 'thief' ligada; o toque fecha o painel e abre a tela; a Fogueira não gasta entrada
{ require(path.join(R, 'js/sys/thief.js')); const T = Sys.thief, opened = []; let scr = false; assert.strictEqual(T.DATA.on, false, 'Sys.thief nasce desligado');
  tapB('sheet'); assert(!sheetH().includes('data-fg="thief"'), 'sem a tela e sem a chave: nada'); assert.strictEqual(g.S.sys.thief, undefined, 'desligado não escreve no save');
  g.Panels = { on: n => n === 'thief' && scr, open: n => opened.push(n) }; tapB('close'); tapB('sheet'); assert(!sheetH().includes('data-fg="thief"'), 'módulo desligado: nada');
  T.DATA.on = true; tapB('close'); tapB('sheet'); assert(!sheetH().includes('data-fg="thief"'), 'tela desligada: nada'); tapB('thief'); assert.deepStrictEqual(opened, [], 'tela desligada: o toque não abre nada');
  scr = true; tapB('sheet'); let h = sheetH(); assert(h.includes('Ladrão de Brasas') && h.includes('2 de 2 hoje') && /data-fg="thief" aria-disabled="false">Perseguir o ladrão · até \d+ Brasas?</.test(h), h.match(/Ladrão[^]{0,260}/)[0]); sane('painel com o Ladrão');
  tapB('thief'); assert.deepStrictEqual(opened, ['thief']); assert.strictEqual(st().sheet, false, 'o painel fecha'); assert.strictEqual(T.view(g.S, host).left, 2, 'a Fogueira não gasta entrada');
  T.enter(g.S, host); tapB('sheet'); assert(/aria-disabled="false">Perseguição aberta: continuar</.test(sheetH()) && sheetH().includes('1 de 2 hoje')); T.finish(g.S, host, { score: 0 });
  T.enter(g.S, host); T.finish(g.S, host, { score: 0 }); tapB('close'); tapB('sheet'); assert(/data-fg="thief" aria-disabled="true">Volta amanhã</.test(sheetH()) && sheetH().includes('0 de 2 hoje')); sane('painel sem entradas');
  tapB('close'); T.DATA.on = false; delete g.S.sys.thief; delete g.Panels;
  out.push('Ladrão de Brasas: linha no painel só com módulo e tela ligados; o toque abre a tela thief; sem entradas diz "Volta amanhã"'); }

// 12) arte: as 9 paradas existem em disco; a chama animada usa os números do .json na regra de grade do jogo; sem ela nada quebra
{ for (let n = 1; n <= 9; n++){ assert(exists(F.FOG_ART(n)), 'falta a arte do estágio ' + n + ': ' + F.FOG_ART(n)); assert(seenImg.has(F.FOG_ART(n))); }
  const lp = mkEl('span'), art = mkEl('img'), box = mkEl('span'); box.querySelector = s => s === '.fgx-lp' ? lp : s === '.fgx-art' ? art : null; els.fgx_i = box; imgs.length = 0;
  o().lv = 10; ticks(1); assert.strictEqual(st().hud.stage, 3); assert.strictEqual(art.src, F.FOG_ART(3), 'troca a imagem parada pelo estágio'); assert(!box.classList.contains('loop') && imgs.length === 0, 'sem .json da chama: fica a parada, nenhuma folha pedida');
  art.parentNode = box; F.els().root._ev.error({ target: Object.assign(art, { classList: { contains: c => c === 'fgx-art' } }) }); assert(box.classList.contains('noart'), 'imagem que falha: entra a fogueira desenhada em CSS'); box.classList.remove('noart');
  assert.strictEqual(F.loopApply(3, box, null), false); assert.strictEqual(F.loopApply(3, box, { frames: 1 }), false); assert(!box.classList.contains('loop'));
  let n = 0; for (let s = 1; s <= 9; s++){ const pj = F.FOG_LOOP_JSON(s); if (!exists(pj) || !exists(F.FOG_LOOP(s))) continue; n++; const j = JSON.parse(fs.readFileSync(path.join(R, pj), 'utf8')), b = Buffer.alloc(24), fd = fs.openSync(path.join(R, F.FOG_LOOP(s)), 'r'); fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd);
    const cols = j.cols > 0 ? j.cols : j.frames, rows = Math.ceil(j.frames / cols); assert.strictEqual(b.readUInt32BE(16), cols * j.w, pj + ': largura da folha'); assert.strictEqual(b.readUInt32BE(20), rows * j.h, pj + ': altura da folha');
    if (s !== 3) continue; assert.strictEqual(F.loopApply(3, box, j), true); assert(box.classList.contains('loop')); assert.strictEqual(lp.style.backgroundSize, (cols * 100) + '% ' + (rows * 100) + '%'); assert(lp.style.backgroundImage.includes(F.FOG_LOOP(3)));
    assert(new RegExp('^fgxl' + cols + '_' + j.frames + ' ' + (j.frames / j.fps) + 's step-end infinite$').test(lp.style.animation), lp.style.animation);
    const kf = head.children.map(c => c.textContent).join('\n'), i0 = kf.indexOf('@keyframes fgxl' + cols + '_' + j.frames + '{'); assert(i0 >= 0); const cells = [...kf.slice(i0, kf.indexOf('}}', i0)).matchAll(/background-position:([0-9.]+)% ([0-9.]+)%/g)].map(q => Math.round(+q[2] / 100 * (rows - 1)) * cols + Math.round(+q[1] / 100 * (cols - 1)));
    assert.deepStrictEqual(cells.slice(0, j.frames), Array.from({ length: j.frames }, (_, i) => i), 'a animação passa por todos os quadros, na ordem, sem célula vazia'); }
  o().lv = 16; ticks(1); assert(!box.classList.contains('loop'), 'ao mudar de estágio volta a parada até a folha nova carregar'); assert.strictEqual(art.src, F.FOG_ART(4)); delete els.fgx_i; o().lv = 5;
  out.push('arte: 9 estágios em disco; ' + n + ' chamas animadas em disco batem com o .json; animação em grade pelos números do .json; sem a folha fica a parada'); }

// 13) chave desligada de novo: desmonta tudo, devolve o x1/x2/x4 ao lugar e a peça que esperava decisão vai para a mochila
{ BF.addBrasas(g.S, 'missions'); o().lv = 1; tapB('forge'); const c = st().card; assert(c && !g.S.inv.includes(c.it)); keyOn = false; ticks(1);
  assert.strictEqual(F.mounted(), false); assert.strictEqual(fbw.children.length, 0); assert.strictEqual(head.children.length, 0); assert(!body.classList.contains('fogv5')); assert.deepStrictEqual(Object.keys(wl), []);
  assert.strictEqual(spdPar.style.cssText, 'position:absolute;left:10px;top:calc(100% - 72px)'); assert.strictEqual(spd.style.cssText, 'height:50px;display:flex;gap:2px'); assert(g.S.inv.includes(c.it), 'a peça forjada não se perde'); assert.strictEqual(st().card, null);
  const t0 = spy.tap; tapB('forge'); assert.strictEqual(spy.tap, t0); keyOn = true; ticks(1); assert.strictEqual(F.mounted(), true); sane('remontada'); keyOn = false; ticks(1);
  out.push('desligar: desmonta elemento, estilo e ouvinte, restaura o x1/x2/x4 e guarda a peça que esperava decisão'); }
BF.DATA.on = false;
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
