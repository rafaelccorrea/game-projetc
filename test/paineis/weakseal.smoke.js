'use strict';
// Teste de fumaça do js/weakseal.js (SELO "FRACO CONTRA") em Node: DOM de mentira, módulo REAL Sys.affinity ligado só na memória.
// Rodar: node test/paineis/weakseal.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
require(path.join(R, 'js/sys/affinity.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, A = Sys.affinity;
assert.strictEqual(A.DATA.on, false, 'o módulo nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = tag => { const e = { tag, id: '', children: [], style: {}, dataset: {}, _h: '', textContent: '', listeners: {}, parentNode: null,
  addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; } } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const head = mkEl('head'), fbw = mkEl('div');
g.document = { head, createElement: t => mkEl(t), getElementById: id => (id === 'fb_w' ? fbw : null) };
/* ---------- jogo de mentira ---------- */
const host = makeHost({ seed: 3 }); Sys.host = host;
g.S = { stage: 1, sys: { path: { id: 'blade' } } };
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.eraOf = st => Math.min(8, Math.floor((st - 1) / 10));
const sounds = []; g.snd = n => sounds.push(n);

const SRC = fs.readFileSync(path.join(R, 'js/weakseal.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'weakseal.js' });
const W = g.WeakSeal, out = [];
assert(W && typeof W.html === 'function' && typeof W.draw === 'function' && typeof W.mount === 'function' && typeof W.update === 'function' && typeof W.info === 'function');

/* canvas de mentira: conta o que foi desenhado e guarda os textos */
const mkCtx = () => { const rec = { calls: 0, texts: [] }; const c = new Proxy({}, { get: (t, k) => k in t ? t[k] : k === 'measureText' ? s => ({ width: String(s).length * 6 }) : k === 'fillText' ? (s) => { rec.calls++; rec.texts.push(s); } : () => { rec.calls++; }, set: (t, k, v) => { t[k] = v; return true; } }); return { c, rec }; };

// 0) arquivo: não liga chave, sem diálogo do navegador, sem emoji, sem reticências, sem imagem, não mexe em regra
assert(!/\.on\s*=\s*true|setOn\s*\(|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/\.\.\.|…|text-overflow\s*:\s*ellipsis/.test(SRC), 'sem reticências (nem no CSS)');
assert(!/assets\/|\.png|\.jpg|\.webp/.test(SRC), 'o selo não cita imagem');
assert(!/15\s*%|10\s*%|Lâmina|Disparo|Arcano/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '')), 'nenhum percentual nem nome de estilo copiado no código (vêm do módulo)');
out.push('arquivo: sem chave ligada, sem diálogo, sem emoji, sem reticências, sem imagem, sem número da regra');

// 1) chave DESLIGADA: nada aparece
assert.strictEqual(W.on(), false); assert.strictEqual(W.html(1), '', 'desligado: html vazio'); assert.strictEqual(W.info(1), null);
{ const { c, rec } = mkCtx(); assert.strictEqual(W.draw(c, 200, 122, { stage: 1 }), null, 'desligado: draw devolve null'); assert.strictEqual(rec.calls, 0, 'desligado: não desenha nada'); }
assert.strictEqual(W.mount(), true, 'monta no #fb_w'); const root = fbw.children[0]; assert(root && root.id === 'wsl_root');
assert.strictEqual(root.style.left, '82px'); assert.strictEqual(root.style.top, '122px'); assert.strictEqual(root.style.width, '236px', 'faixa do protótipo: x 82 a 318, y 122');
assert.strictEqual(W.update(true), false); assert.strictEqual(root.innerHTML, ''); assert.strictEqual(root.style.display, 'none', 'desligado: selo escondido');
assert.strictEqual(W.mount(), true); assert.strictEqual(fbw.children.length, 1, 'não monta duas vezes');
out.push('chave desligada: html vazio, draw não desenha, selo escondido');

// 2) chave LIGADA (só na memória): os 3 tons, com o texto e o percentual vindos do módulo
A.setOn(true); assert.strictEqual(W.on(), true);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const sane = (h, what) => { assert(!/\p{Extended_Pictographic}/u.test(h), what + ': emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(h), what + ': texto quebrado'); assert(!/\.\.\.|…/.test(h), what + ': reticências');
  assert(!/comprar|sorteio|R\$|gema/i.test(h), what + ': texto proibido'); assert(!/src=|url\(/.test(h), what + ': sem imagem'); for (const b of h.match(/<button[^>]*>/g) || []) assert(/data-ws="tip"/.test(b) && !/\sdisabled[\s>=]/.test(b), what + ': botão sem ação'); };
const cases = [   // [estilo do herói, fase, tom esperado]
  ['blade', 1, 'good'], ['blade', 11, 'neutral'], ['shot', 11, 'bad'], ['arcane', 11, 'good'], ['shot', 21, 'good'], ['arcane', 21, 'bad'], ['blade', 31, 'bad'], ['blade', 61, 'neutral'], ['blade', 81, 'good'], ['shot', 81, 'bad']];
for (const [sty, stage, tone] of cases) { g.S.sys.path.id = sty; const w = A.warn(g.S, host, { era: g.eraOf(stage) }), I = W.info(stage), h = W.html(stage);
  assert.strictEqual(w.tone, tone, 'módulo: ' + sty + ' fase ' + stage); assert.strictEqual(I.tone, tone, 'selo: mesmo tom do módulo'); assert(h.includes('class="wsl ' + tone + '"'), 'classe do tom');
  const txt = tone === 'good' ? 'Forte contra: ' + w.eraName + ' · +' + Math.round(A.DATA.weak * 100) + '%' : tone === 'bad' ? 'Resistem a: ' + w.mine + ' · −' + Math.round(-A.DATA.resist * 100) + '%' : w.text;
  assert.strictEqual(I.txt, txt, 'texto do selo: ' + I.txt); assert(un(h).includes(txt), 'html tem o texto'); sane(h, sty + '/' + stage); }
out.push('3 tons em 10 combinações (estilo x era): tom, era, estilo e texto iguais aos do Sys.affinity.warn');
// neutro usa a frase do módulo ("Fraco contra: X")
g.S.sys.path.id = 'blade'; assert.strictEqual(W.info(11).txt, A.warn(g.S, host, 11).text); assert(/^Fraco contra: /.test(W.info(11).txt)); out.push('neutro: frase "Fraco contra" do módulo: ' + W.info(11).txt);
// fase omitida = S.stage; {era} direto; número pela conta do jogo (eraOf)
g.S.stage = 81; assert.strictEqual(W.info().txt, W.info(81).txt); assert.strictEqual(W.info({ era: 8 }).txt, W.info(81).txt); g.S.stage = 1; out.push('fase: nada = S.stage, número (eraOf do jogo) ou {era}');
// o percentual é o do módulo (mudou no módulo, mudou no selo)
{ const w0 = A.DATA.weak, r0 = A.DATA.resist; A.DATA.weak = 0.2; A.DATA.resist = -0.05; assert(W.info(1).txt.endsWith('+20%')); g.S.sys.path.id = 'shot'; assert(W.info(11).txt.endsWith('−5%')); A.DATA.weak = w0; A.DATA.resist = r0; g.S.sys.path.id = 'blade'; out.push('percentual lido do módulo (DATA.weak / DATA.resist)'); }
// sem estilo (sem caminho e sem arma): selo cinza, sem frase do estilo
{ const p = g.S.sys.path; g.S.sys.path = {}; const I = W.info(1); assert.strictEqual(I.tone, 'neutral'); assert(!/Seu estilo/.test(I.head)); sane(W.html(1), 'sem estilo'); g.S.sys.path = p; out.push('sem estilo definido: cinza, sem inventar estilo'); }
// texto escapado
{ const n0 = A.DATA.styles.arcane; A.DATA.styles.arcane = '<i>A&B</i>'; const h = W.html(11); assert(!h.includes('<i>A&B</i>') && h.includes('&lt;i&gt;A&amp;B&lt;/i&gt;'), 'texto do módulo escapado'); A.DATA.styles.arcane = n0; out.push('texto escapado (esc2)'); }

// 3) batalha: selo montado, toque abre e fecha a explicação
assert.strictEqual(W.update(true), true); assert.notStrictEqual(root.style.display, 'none'); assert(un(root.innerHTML).includes('Forte contra: Pré-História'), 'selo na batalha');
assert(!root.innerHTML.includes('wsl-tip"'), 'explicação fechada no começo'); assert(root.innerHTML.includes('aria-expanded="false"'));
const tap = () => root.listeners.click({ target: { closest: () => ({ dataset: { ws: 'tip' } }) } });
tap(); assert(root.innerHTML.includes('class="wsl-tip"') && root.innerHTML.includes('aria-expanded="true"'), 'toque abre a explicação');
assert(un(root.innerHTML).includes('Cada era é fraca contra um estilo (+15%) e pode resistir a outro (−10%). Nenhuma era resiste à arma que cai nela.'), 'regra geral na explicação');
assert(root.innerHTML.includes(g.esc2(A.warn(g.S, host, 1).tip)), 'dica do módulo na explicação'); sane(root.innerHTML, 'explicação');
tap(); assert(!root.innerHTML.includes('class="wsl-tip"'), 'toque fecha'); assert.strictEqual(sounds.length, 2);
root.listeners.click({ target: { closest: () => null } }); assert(!root.innerHTML.includes('class="wsl-tip"'), 'toque fora do selo não faz nada');
assert.strictEqual(W.click({ dataset: { ws: 'outro' } }), false);
// mudou de era com a explicação aberta: fecha e troca o texto
tap(); g.S.stage = 11; W.update(true); assert(un(root.innerHTML).includes('Fraco contra: Arcano') && !root.innerHTML.includes('class="wsl-tip"'), 'era nova: texto novo, explicação fechada'); g.S.stage = 1;
// update sem força respeita o intervalo (não relê o módulo a cada quadro) e não mexe no HTML igual
W.update(true); const h0 = root.innerHTML; let reads = 0; const w0 = A.warn; A.warn = function () { reads++; return w0.apply(this, arguments); }; for (let i = 0; i < 50; i++) W.update(); assert(reads <= 1, 'no máximo uma leitura no intervalo: ' + reads); assert.strictEqual(root.innerHTML, h0); A.warn = w0;
out.push('batalha: monta em x 82 / y 122, toque abre e fecha a explicação, fecha ao mudar de era, leitura espaçada');
// desligou no meio do jogo: some
A.setOn(false); assert.strictEqual(W.update(true), false); assert.strictEqual(root.style.display, 'none'); assert.strictEqual(root.innerHTML, ''); assert.strictEqual(W.html(), ''); A.setOn(true); assert.strictEqual(W.update(true), true);
out.push('chave desligada no meio: o selo some; religada: volta');

// 4) canvas
{ const { c, rec } = mkCtx(); const r = W.draw(c, 200, 122, { stage: 1 }); assert(r && r.w > 0 && r.h === 24 && r.tone === 'good' && Math.abs(r.x + r.w / 2 - 200) < 0.01 && r.y === 122, 'draw devolve a caixa centrada em x');
  assert.deepStrictEqual(rec.texts, ['Forte contra: Pré-História · +15%'], 'texto no canvas'); assert(rec.calls > 5);
  const r2 = W.draw(c, 200, 122, null, { stage: 11, scale: 2 }); assert(r2.h === 48 && r2.tone === 'neutral', 'escala e fase por opção'); assert.strictEqual(W.draw(null, 0, 0), null);
  g.S.sys.path.id = 'shot'; assert.strictEqual(W.draw(c, 0, 0, { stage: 11 }).tone, 'bad'); g.S.sys.path.id = 'blade';
  out.push('canvas: draw(ctx, x, y, inimigo) desenha o mesmo texto e devolve a caixa'); }

// 5) módulo com erro ou incompleto: some sem quebrar
{ const w0 = A.warn; A.warn = () => { throw new Error('boom'); }; assert.strictEqual(W.html(1), ''); assert.strictEqual(W.update(true), false); A.warn = w0;
  const a0 = Sys.affinity; Sys.affinity = null; assert.strictEqual(W.on(), false); assert.strictEqual(W.html(1), ''); Sys.affinity = a0; out.push('módulo ausente ou com erro: selo some, nada quebra'); }
W.unmount(); assert.strictEqual(fbw.children.length, 0, 'unmount tira o selo');
A.setOn(false);
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
