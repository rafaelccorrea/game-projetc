'use strict';
// Teste de fumaça do js/p_mail2.js (CORREIO V3, versão A: cartões com o prêmio à vista, arrastar para resgatar) em Node.
// Sys.mail e Sys.loot REAIS (mais pet, appearance e skin para os nomes); DOM de mentira. Rodar: node test/paineis/p_mail2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'level', 'chest', 'forge', 'skin', 'appearance', 'pet', 'mail'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, M = Sys.mail;
assert(M && Sys.loot && Sys.pet, 'módulos de js/sys carregados');

/* ---------- DOM de mentira ---------- */
let drawn = [];
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : k === 'drawImage' ? im => { drawn.push(im && im.src); } : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 132, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const canvas = mkEl('m3_cv'), scroll = mkEl('m3_scroll'), sayEl = mkEl('m3_say');
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
const EV = {};   // ouvintes que a tela põe no documento (pointerdown, pointermove, pointerup, pointercancel)
g.document = { head: mkEl('head'), createElement: () => mkEl(''), addEventListener(n, f) { (EV[n] = EV[n] || []).push(f); },
  getElementById: id => id === 'm3_cv' ? (/id="m3_cv"/.test(H()) ? canvas : null) : id === 'm3_scroll' ? (/id="m3_scroll"/.test(H()) ? scroll : null) : id === 'm3_say' ? (/id="m3_say"/.test(H()) ? sayEl : null) : null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
g.Image = function () { this.complete = true; this.naturalWidth = 64; this.naturalHeight = 64; this.src = ''; };
let timers = []; g.setTimeout = (f, ms) => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};
const flush = () => { const t = timers; timers = []; t.forEach(f => f()); };

/* ---------- o jogo de mentira (só o que a tela chama) ---------- */
const host = makeHost({ seed: 7, stage: 40, eraMax: 3, level: 60 }); Sys.host = host;
g.S = { sys: {}, hero: 'kael', gold: 0, gems: 0, inv: [], eq: {}, eraMax: 3, stage: 40 };
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : '';
g.n0 = v => Math.round(v).toLocaleString('pt-BR'); g.kf = v => String(Math.round(v));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'mail2'; g.HS = 155;
g.xEraBgUrl = () => 'assets/bg/era3.png'; g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.4),rgba(13,10,8,.9)),url(assets/bg/era3.png) center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push(n); let changed = 0; g.statsChanged = () => { changed++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { close() { closed++; } };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; } };
let drew = []; g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };
let gated = null; g.pwGate = u => { gated = u.slice(); return false; };   // a tela pede a carga das imagens antes de desenhar

const SRC = fs.readFileSync(path.join(R, 'js/p_mail2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_mail2.js' });
const T = g.Mail2, X = T.X;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const key = id => (typeof id === 'number' ? 'n' : 's') + id;
const card = id => { const p = H().split('<div class="m3-cw">').find(c => c.includes('data-card="' + g.esc2(key(id)) + '"')); assert(p, 'cartão na tela: ' + id); return p.split('<div class="m3-foot"')[0]; };
const tiles = id => (card(id).match(/<div class="m3-tl/g) || []).length;
const box = () => M.inbox(g.S, host), letter = id => box().find(m => m.id === id);
const seenActs = new Set(), seenImgs = new Set();
// toda tela desenhada passa por aqui: botões com ação tratada e toque de 40 px, zero emoji, nada quebrado, sem preço nem pressa, sem reticências, imagens em disco
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag);
    assert(/class="m3-(bt|ch)\b/.test(b.tag), tag + ': botão fora das classes de 40 px: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|oferta|desconto/i.test(h), tag + ': preço ou compra: ' + (/.{30}(R\$|\d\s*reais|comprar|compre|oferta|desconto).{30}/i.exec(h) || [''])[0]);
  assert(!/última chance|ultima chance|só hoje|corra|restam \d|expira|vence em|acaba em|não perca/i.test(h), tag + ': texto de pressa: ' + (/.{30}(expira|vence em|restam|corra).{30}/i.exec(h) || [''])[0]);
  assert(!/\.\.\.|…/.test(h), tag + ': texto com reticências');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
// o módulo real, com contador de chamadas (para provar "uma vez")
let nClaim = 0, nAll = 0; const claim0 = M.claim, all0 = M.claimAll; M.claim = function () { nClaim++; return claim0.apply(M, arguments); }; M.claimAll = function () { nAll++; const k = nClaim, r = all0.apply(M, arguments); nClaim = k; return r; };
/* cartão de mentira para o gesto: o que a tela toca no elemento (estilo, classe, largura, captura do ponteiro, a camada de baixo) */
function fakeCard(id, w) { const cls = new Set(), under = new Set(), mk = s => ({ add: c => s.add(c), remove: c => s.delete(c), toggle: (c, on) => { on ? s.add(c) : s.delete(c); }, contains: c => s.has(c) });
  const el = { dataset: { card: key(id) }, style: {}, cls, under, classList: mk(cls), captured: 0, getBoundingClientRect: () => ({ width: w || 300 }), setPointerCapture() { el.captured++; }, parentNode: { querySelector: () => ({ classList: mk(under) }) } }; return el; }
const fire = (n, ev) => (EV[n] || []).forEach(f => f(ev));
const on = (el, nodrag) => ({ closest: sel => sel === '[data-nodrag]' ? (nodrag ? {} : null) : sel === '[data-card]' ? el : null });
// um arrasto completo: baixa em (100,100), anda (dx,dy) em dois passos e solta (ou cancela)
function swipe(el, dx, dy, o) { o = o || {}; fire('pointerdown', { target: on(el, o.nodrag), clientX: 100, clientY: 100, pointerId: 1, button: 0 });
  fire('pointermove', { clientX: 100 + dx / 2, clientY: 100 + (dy || 0) / 2, pointerId: 1 }); fire('pointermove', { clientX: 100 + dx, clientY: 100 + (dy || 0), pointerId: 1 });
  fire(o.cancel ? 'pointercancel' : 'pointerup', { clientX: 100 + dx, clientY: 100 + (dy || 0), pointerId: 1 }); }

// 0) registro e regras do arquivo
assert.strictEqual(addName, 'mail2'); assert.strictEqual(g.PANEL_ON.mail2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.busy);
assert(!/PANEL_ON\.\w+\s*=\s*true|enabled\s*=(?!=)|DATA\.\w+\s*=(?!=)/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço'); assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'sem reticências no estilo nem no texto');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
for (let e = 0; e <= 8; e++) for (const s in T.SLOT_FILE) assert(fs.existsSync(path.join(R, T.slotImg(s, e))), 'ícone de item não existe: ' + T.slotImg(s, e));
for (const v17 of [false, true]) { if (typeof Sys.pet.setV17 === 'function') Sys.pet.setV17(v17); for (const p of Sys.pet.DATA.pets) assert(fs.existsSync(path.join(R, T.petImg(p))), 'ícone de pet não existe: ' + p.id + ' ' + T.petImg(p)); }   // fica na 17b (pets com arte própria)
assert.strictEqual(T.petImg(null), T.IC.egg, 'pet desconhecido: ovo');
for (const n of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) assert.strictEqual((EV[n] || []).length, 1, 'ouvinte de ' + n);
{ const css = g.document.head.children.map(c => c.textContent).join(''); assert(/\.m3-cd\{[^}]*touch-action:pan-y/.test(css), 'cartão com touch-action:pan-y (o vertical é a rolagem)'); assert(/\.m3-bt,\.xs \.m3-bt\{[^}]*color:#1c1206/.test(css), 'botão dourado com texto escuro, também com .xs');
  assert(/\.m3-bt,\.xs \.m3-bt\{[^}]*min-height:40px/.test(css) && /\.m3-ch,\.xs \.m3-ch\{[^}]*min-height:44px/.test(css), 'toque mínimo de 40 px'); assert(/\.m3-rwd\{[^}]*repeat\(4,minmax\(0,1fr\)\)/.test(css), 'grade das peças com minmax(0,1fr)'); }
out.push('registro: mail2 desligada, ' + def.actions.length + ' ações com tratador, 4 ouvintes de ponteiro, touch-action:pan-y, sem diálogo, sem emoji, sem reticências, ícones em disco');

// 1) módulo ausente e módulo desligado: aviso com Voltar, nada lança
{ const mm = Sys.mail; Sys.mail = null; try { open(); has('Correio indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); def.click(btn('all')); def.click(btn('claim', { id: 'n1' })); def.tick(); } finally { Sys.mail = mm; }
  M.DATA.enabled = false; open(); has('ainda não está ativo'); assert.strictEqual(check('desligado'), 1); def.click(btn('all')); assert.strictEqual(nAll, 0, 'desligado: nada é chamado'); closed = 0; def.click(btn('back')); assert.strictEqual(closed, 1); }
out.push('sem Sys.mail e com a chave desligada: aviso com Voltar');

// 2) ligado e VAZIO
M.DATA.enabled = true; open(); has('Sua caixa está vazia'); has('Nada é vendido no Correio'); has('Nada para resgatar'); has('caixa vazia'); has('id="m3_cv"'); has('url(assets/bg/era3.png)'); assert.strictEqual((H().match(/data-card=/g) || []).length, 0); check('vazio');
assert(gated && gated.includes('assets/bg/era3.png') && gated.includes('assets/ui/coin.png'), 'pede a carga do fundo e das moedas antes de desenhar');
def.click(btn('all')); assert.strictEqual(nAll, 0); assert(/Nenhum prêmio para resgatar/.test(sayEl.innerHTML), 'sem prêmio: diz em texto'); def.click(btn('delread')); assert(/Não há cartas lidas/.test(sayEl.innerHTML));
{ g.pwGate = u => { gated = u; return true; }; g.V.innerHTML = 'ESPERA'; def.render(); assert.strictEqual(H(), 'ESPERA', 'com imagem por carregar a tela não se desenha pela metade'); g.pwGate = u => { gated = u.slice(); return false; }; }
out.push('caixa vazia: aviso, rodapé sem ação morta, fundo da era, carga das imagens pedida antes do desenho');

// 3) CARTAS REAIS (Sys.mail.send e a caixa do servidor por Sys.mail.receive): cada cartão mostra o prêmio da carta
const a = M.send(g.S, host, { title: 'Prêmio da Arena', body: 'Você foi bem.', source: 'arena', att: { gems: 120, gold: 15000, stones: 8, items: [{ slot: 'weapon', r: 2 }] }, days: 3 });
const b = M.send(g.S, host, { title: 'Bem-vindo', body: 'Olá, viajante.', type: 'system' });
const d = M.send(g.S, host, { title: 'Baú da guilda', type: 'guild', from: 'Lobos de Ferro', att: { gold: 900, gems: 7, forge: 6, food: 90, essence: 3, eggs: [1] } });
const pet = Sys.pet.DATA.pets.find(p => p.id === 'griffin') || Sys.pet.DATA.pets[0], e = M.send(g.S, host, { title: 'Festival', type: 'event', att: { skin: 'kael_demon', petFrags: { [pet.id]: 12 }, mountFrags: 5, xp: 40 } });
const XSS = '<img src=x onerror=alert(1)>';
assert.strictEqual(M.receive(g.S, host, [{ id: 'srv-1', title: 'Compensação ' + XSS, body: 'Desculpe <script>x()</script> "aspas"', from: '<b>Equipe</b>', att: { gems: 50 }, createdAt: host.t - 2 * 864e5, expiresAt: host.t + 20 * 864e5, source: 'compensacao' }]), 1);
const c = 'srv-1'; assert(a && b && d && e, 'cartas criadas pelo módulo');
open(); assert.strictEqual((H().match(/data-card=/g) || []).length, 5, '5 cartões'); check('com cartas');
{ const A = card(a); assert.strictEqual(tiles(a), 4, 'Arena: 4 peças'); for (const s of ['<b>×120</b><small>Diamantes</small>', '<b>15000</b><small>Ouro</small>', '<b>×8</b><small>Pedras de treino</small>', '<b>Épico</b><small>Arma</small>', 'assets/icons/slots/era3_weapon.png', 'Prêmios · hoje · vale até 15/11', '>Vale até 15/11<', 'Arraste para a direita', '>Resgatar</button>']) assert(A.includes(s), 'Arena: faltou ' + s);
  assert(/class="m3-cd unr pend exp"/.test(A), 'Arena: com prêmio e perto do fim da validade'); assert(/data-x="claim" data-id="n\d+" data-nodrag="1"/.test(A), 'botão Resgatar equivalente ao arrasto');
  const B = card(b); assert.strictEqual(tiles(b), 0, 'sem anexo: nenhuma peça'); assert(B.includes('Olá, viajante.') && B.includes('Toque no título para ler.') && B.includes('Equipe Eonbound') && B.includes('>Nova<')); assert(!/data-x="claim"|Arraste/.test(B), 'sem anexo: nada para resgatar');
  const Dd = card(d); assert.strictEqual(tiles(d), 4, 'mais de 4 peças: 3 e o cartão "+3"'); assert(Dd.includes('m3-tl more lil">+3<') && Dd.includes('Lobos de Ferro'));
  const E = card(e), sk = Sys.appearance.fixedSkins(g.S, host).find(k => k.id === 'kael_demon'); assert(sk, 'skin do módulo'); for (const s of [g.esc2(sk.name), '>VISUAL<', '>Visual<', '<b>×12</b><small>' + g.esc2('Fragm. ' + pet.name), '<b>×5</b><small>Fragm. de montaria', '<b>×40</b><small>Experiência', T.petImg(pet)]) assert(E.includes(s), 'Festival: faltou ' + s);
  const C = card(c); assert(!H().includes('<img src=x') && !H().includes('<script>') && !H().includes('<b>Equipe</b>'), 'texto de fora nunca entra como HTML'); assert(C.includes('Compensação &lt;img src=x onerror=alert(1)&gt;') && C.includes('&lt;b&gt;Equipe&lt;/b&gt; · há 2 dias'), 'título e remetente escapados');
  assert(C.includes('<b>×50</b><small>Diamantes</small>') && tiles(c) === 1); assert(!C.includes('Desculpe'), 'com anexo, o texto só abre no toque');
  has('<b>4 com prêmio.</b>'); has('5 de ' + M.DATA.max + ' cartas.'); has('Resgatar tudo (4)'); has('4 cartas com prêmio');
  // nada inventado: as peças da tela são exatamente as chaves do pacote real
  for (const m of box()) { const n = T.pieces(m.att).length, k = m.att ? Object.keys(m.att).reduce((s, x) => s + (Array.isArray(m.att[x]) ? m.att[x].length : x === 'petFrags' ? Object.keys(m.att[x]).length : 1), 0) : 0; assert.strictEqual(n, k, 'peças = conteúdo do pacote: ' + m.title); }
  assert(H().indexOf('data-card="' + key(a)) < H().indexOf('data-card="' + key(b)), 'com prêmio vem antes da carta sem prêmio'); }
out.push('5 cartas reais: peças iguais ao pacote (ouro, diamantes, materiais, item, ovo, skin, fragmentos), validade "vale até", título e remetente do servidor escapados');

// 4) ABRIR: marca como lida e mostra o texto; carta SEM ANEXO só marca como lida (nada entregue)
{ const g0 = host.gems, o0 = host.gold, k0 = nClaim; def.click(btn('open', { id: key(c) })); assert(letter(c).read); assert(card(c).includes('Desculpe &lt;script&gt;x()&lt;/script&gt; &quot;aspas&quot;'), 'texto do servidor escapado'); assert(/aria-expanded="true"/.test(card(c))); check('aberta');
  def.click(btn('open', { id: key(d) })); assert.strictEqual(tiles(d), 6, 'aberto: todas as peças'); assert(!/aria-expanded="true"/.test(card(c)), 'uma aberta por vez'); def.click(btn('open', { id: key(d) })); assert.strictEqual(tiles(d), 4);
  assert(!letter(b).read); def.click(btn('open', { id: key(b) })); assert(letter(b).read, 'sem anexo: lida'); assert(card(b).includes('Lida.') && /data-x="del"/.test(card(b)) && !card(b).includes('>Nova<'));
  def.click(btn('claim', { id: key(b) })); assert.strictEqual(nClaim, k0, 'sem anexo: o resgate do módulo nem é chamado'); assert(card(b).includes('Esta carta não tem prêmio.')); assert.strictEqual(host.gems, g0); assert.strictEqual(host.gold, o0); check('sem anexo');
  const el = fakeCard(b); swipe(el, 250); assert.strictEqual(nClaim, k0); assert.strictEqual(el.style.transform, undefined, 'sem anexo: o cartão nem começa a arrastar'); }
out.push('abrir marca como lida e mostra o texto; carta sem anexo só é lida (nada entregue, sem arrasto)');

// 5) O GESTO: curto não resgata e o cartão volta; vertical é rolagem; além do limiar resgata pelo módulo UMA vez
{ def.render(); const k0 = nClaim, g0 = host.gems, o0 = host.gold, i0 = host.items.length;
  let el = fakeCard(a); swipe(el, 0.3 * 300); assert.strictEqual(el.captured, 1, 'arrasto horizontal captura o ponteiro'); assert.strictEqual(nClaim, k0, 'arrasto curto não resgata'); assert.strictEqual(el.style.transform, '', 'o cartão volta'); assert(!el.cls.has('drag') && !el.under.has('go')); assert(!letter(a).claimed); assert.strictEqual(def.busy(), false);
  el = fakeCard(a); swipe(el, 20, 160); assert.strictEqual(el.captured, 0, 'movimento vertical: a tela não segura o gesto'); assert.strictEqual(el.style.transform, undefined); assert.strictEqual(nClaim, k0);
  el = fakeCard(a); swipe(el, 250, 0, { nodrag: true }); assert.strictEqual(nClaim, k0, 'arrasto que começa no botão não vale'); assert.strictEqual(el.style.transform, undefined);
  el = fakeCard(a); swipe(el, 250, 0, { cancel: true }); assert.strictEqual(nClaim, k0, 'gesto cancelado pelo sistema não resgata'); assert.strictEqual(el.style.transform, '');
  el = fakeCard(a); fire('pointerdown', { target: on(el), clientX: 100, clientY: 100, pointerId: 1, button: 0 }); fire('pointermove', { clientX: 100 + T.SWIPE * 300 + 6, clientY: 104, pointerId: 1 });
  assert.strictEqual(def.busy(), true, 'durante o arrasto ninguém redesenha por fora'); assert(el.under.has('go') && el.cls.has('drag'), 'passou do limiar: a camada de baixo acende'); assert(/translateX\(4\d\.\d%\)/.test(el.style.transform));
  timers = []; X.noClick = 0; fire('pointerup', { clientX: 100 + T.SWIPE * 300 + 6, clientY: 104, pointerId: 1 });
  assert.strictEqual(nClaim, k0 + 1, 'além do limiar: Sys.mail.claim chamado uma vez'); assert.strictEqual(el.style.transform, 'translateX(105%)', 'o cartão sai pela direita'); assert(letter(a).claimed);
  assert.strictEqual(host.gems, g0 + 120); assert.strictEqual(host.gold, o0 + 15000); assert.strictEqual(host.items.length, i0 + 1, 'o item do pacote foi entregue pelo Sys.loot'); assert(changed >= 1, 'gravou');
  fire('pointerup', { clientX: 400, clientY: 100, pointerId: 1 }); fire('pointermove', { clientX: 400, clientY: 100, pointerId: 1 }); def.click(btn('claim', { id: key(a) })); assert.strictEqual(nClaim, k0 + 1, 'soltar de novo e o toque que sobra do arrasto não resgatam outra vez');
  flush(); assert(/class="m3-cd got"/.test(card(a)) && card(a).includes('>Resgatado<') && card(a).includes('<b>Resgatado.</b>') && card(a).includes('120 diamantes'), 'cartão resgatado'); assert(!/Arraste|data-x="claim"/.test(card(a))); assert(/Resgatado: .*15000 de ouro/.test(sayEl.innerHTML) || /Resgatado: /.test(H())); check('resgatado');
  el = fakeCard(a); swipe(el, 280); assert.strictEqual(nClaim, k0 + 1, 'cartão já resgatado não arrasta'); assert.strictEqual(host.gems, g0 + 120); }
out.push('gesto: curto volta, vertical é rolagem, cancelado não vale; além de ' + Math.round(T.SWIPE * 100) + '% resgata pelo Sys.mail.claim uma vez (ouro, diamantes e item entregues)');

// 6) o BOTÃO Resgatar faz o mesmo do arrasto, uma vez
{ X.noClick = 0; const k0 = nClaim, g0 = host.gems; def.click(btn('claim', { id: key(c) })); assert.strictEqual(nClaim, k0 + 1); assert.strictEqual(host.gems, g0 + 50); assert(card(c).includes('>Resgatado<')); check('botão');
  def.click(btn('claim', { id: key(c) })); assert.strictEqual(host.gems, g0 + 50, 'não paga duas vezes'); assert(card(c).includes('role="alert">O prêmio desta carta já foi resgatado.'), 'a recusa aparece em texto no cartão'); check('recusa: resgatado'); }
out.push('botão Resgatar em cada cartão com prêmio: mesmo resultado do arrasto, sem pagar duas vezes');

// 7) RECUSA do módulo: o motivo aparece em texto e o cartão volta
{ const nd = M.send(g.S, host, { title: 'Torneio', source: 'torneio', att: { newDrops: { src: 'tourney:weekend', ctx: { rank: 1 } } } }); def.render(); assert(card(nd).includes('Aparece ao resgatar'));
  let k0 = nClaim, el = fakeCard(nd); timers = []; swipe(el, 260); assert.strictEqual(nClaim, k0 + 1); assert.strictEqual(el.style.transform, '', 'recusa: o cartão volta'); assert(!el.cls.has('drag')); assert(!letter(nd).claimed, 'a carta continua com o prêmio');
  flush(); assert(card(nd).includes('role="alert">Este prêmio fica guardado na carta até os itens novos serem liberados.')); assert(/data-x="claim"/.test(card(nd)), 'continua resgatável'); check('recusa: itens novos');
  // mochila cheia e erro: o módulo de hoje não devolve esse motivo; a tela mostra o texto se ele vier (resposta simulada só aqui)
  const real = M.claim; X.noClick = 0;
  M.claim = () => ({ ok: false, reason: 'mochila_cheia' }); try { el = fakeCard(d); timers = []; swipe(el, 260); assert.strictEqual(el.style.transform, ''); flush(); assert(card(d).includes('Mochila cheia: libere espaço e resgate de novo.')); assert(!letter(d).claimed); check('recusa: mochila'); } finally { M.claim = real; }
  X.noClick = 0; M.claim = () => { throw new Error('boom'); }; try { def.click(btn('claim', { id: key(d) })); assert(card(d).includes('Não foi possível resgatar agora. Tente de novo.')); } finally { M.claim = real; }
  X.noClick = 0; M.claim = () => ({ ok: false, reason: 'qualquer' }); try { def.click(btn('claim', { id: key(d) })); assert(card(d).includes('Não foi possível resgatar agora.')); } finally { M.claim = real; }
  def.click(btn('claim', { id: 'n99999' })); def.click(btn('open', { id: 'sx' })); def.click(btn('del', { id: 'sx' })); check('ids desconhecidos');
  X.noClick = 0; def.click(btn('claim', { id: key(c) })); has('m3-why'); X.why.t = Date.now() - 7000; def.tick(); assert(!H().includes('m3-why'), 'o motivo some depois de um tempo'); }
out.push('recusa (itens novos desligados, mochila cheia simulada, erro): motivo em texto no cartão, cartão volta, carta continua com o prêmio');

// 8) APAGAR uma carta: só sem prêmio pendente
{ X.noClick = 0; const n = box().length; def.click(btn('del', { id: key(d) })); assert.strictEqual(box().length, n, 'com prêmio pendente não apaga'); assert(card(d).includes('Resgate o prêmio antes de apagar esta carta.'));
  def.click(btn('del', { id: key(a) })); assert.strictEqual(box().length, n - 1); assert(!H().includes('data-card="' + key(a) + '"')); assert(/Carta apagada/.test(sayEl.innerHTML)); check('apagada'); }
// 9) RESGATAR TUDO pelo módulo, uma vez; o que o módulo recusa continua na caixa
{ const k0 = nAll, g0 = host.gems, p0 = box().filter(m => m.hasAtt && !m.claimed).length; assert.strictEqual(p0, 3); has('Resgatar tudo (3)'); def.click(btn('all')); assert.strictEqual(nAll, k0 + 1, 'Sys.mail.claimAll chamado uma vez'); assert.strictEqual(host.gems, g0 + 7);
  assert(letter(d).claimed && letter(e).claimed); assert.strictEqual(box().filter(m => m.hasAtt && !m.claimed).length, 1, 'a carta de itens novos fica'); assert(/2 cartas resgatadas\. 1 ficou para depois\./.test(sayEl.innerHTML)); has('Resgatar tudo (1)'); check('resgatar tudo');
  def.click(btn('all')); assert(/Nenhum prêmio pôde ser resgatado agora/.test(sayEl.innerHTML)); }
out.push('resgatar tudo: Sys.mail.claimAll uma vez; a carta que o módulo recusa continua na caixa e a tela diz');
// 10) APAGAR LIDAS: confirmação no rodapé (sem janela); cancelar não apaga; carta com prêmio fica
{ const rd = box().filter(m => m.read && !(m.hasAtt && !m.claimed)).length; assert(rd >= 3); has('Apagar lidas (' + rd + ')'); def.click(btn('delread')); has('Apagar ' + rd + ' cartas lidas?'); has('data-x="delno"'); has('data-x="delyes"'); not('role="dialog"'); check('confirmação');
  const n = box().length; def.click(btn('delno')); assert.strictEqual(box().length, n); not('data-x="delyes"'); def.click(btn('delread')); def.click(btn('delyes')); assert.strictEqual(box().length, 1, 'só fica a carta com prêmio'); assert(box()[0].hasAtt && !box()[0].claimed); has('<b>1 com prêmio.</b>'); has('1 de ' + M.DATA.max + ' carta.'); check('apagadas'); }
out.push('apagar lidas: confirmação no rodapé, cancelar não apaga, carta com prêmio não é apagada');

// 11) PALCO: o herói do jogo no canvas (um por quadro); desenho com erro ou ausente = retrato parado; fechar para o laço
{ open(); assert(raf.length >= 1, 'laço do palco rodando'); drew = []; raf.shift()(1000); assert.strictEqual(drew.length, 1, 'um herói por quadro'); assert(drew[0].k > 0 && isFinite(drew[0].k));
  const f = M.send(g.S, host, { title: 'Voo', att: { gems: 1, gold: 1 } }); def.render(); X.noClick = 0; def.click(btn('claim', { id: key(f) })); assert(X.fly.length === 2, 'as peças resgatadas voam até o herói'); drawn = []; raf.shift()(1400); raf.shift()(1700); assert(drawn.some(u => /coin\.png/.test(u || '')), 'peça desenhada no palco');
  def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço');
  g.drawHeroFull = () => { throw new Error('boom'); }; open(); has('id="m3_cv"'); const fr = raf.shift(); try { fr(16); } catch (err) { assert.fail('exceção no laço: ' + err.message); } not('id="m3_cv"'); assert(/<img class="m3-still" src="assets\/hero\/avatar\/[a-z0-9_]+\.png"/.test(H()), 'reserva: retrato parado'); check('reserva');
  delete g.drawHeroFull; open(); not('id="m3_cv"'); check('sem drawHeroFull'); g.drawHeroFull = (cv, x, y, k, st) => { drew.push({ x, y, k, st }); return true; }; }
out.push('palco: herói do jogo no canvas, peças voando no resgate; desenho com erro ou ausente cai no retrato parado');

// 12) tick: carta nova que chega por fora aparece sozinha; larguras de 320 e 390
{ open(); const n = (H().match(/data-card=/g) || []).length; M.receive(g.S, host, [{ id: 'srv-2', title: 'Ranking', att: { gold: 10 }, createdAt: host.t, expiresAt: host.t + 9 * 864e5, source: 'ranking' }]); for (let i = 0; i < 4; i++) def.tick(); assert.strictEqual((H().match(/data-card=/g) || []).length, n + 1, 'o tick redesenha quando a caixa muda');
  for (const w of [320, 390]) { g.xDims = () => ({ H: 560, Wb: w }); open(); has('height:108px'); check('largura ' + w); } g.xDims = () => ({}); }
// 13) todos os botões de todos os estados: tocar não gera exceção e a tela continua íntegra
{ M.send(g.S, host, { title: 'Aviso', body: 'Texto.' }); let taps = 0; open(); const n = buttons().length; assert(n >= 6);
  for (let i = 0; i < 40; i++) { def.render(); const bs = buttons(); if (!bs.length) break; const bt = bs[i % bs.length]; X.noClick = 0; try { def.click(bt); taps++; } catch (err) { assert.fail('toque em ' + bt.tag + ': ' + err.stack); } flush(); g.view = 'mail2'; check('toque ' + bt.dataset.x); }
  const never = def.actions.filter(x => !seenActs.has(x)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('toques: ' + taps + ' botões tocados sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
M.claim = claim0; M.claimAll = all0; M.DATA.enabled = false;
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
