'use strict';
// Teste de fumaça do js/p_cross.js (ENCRUZILHADA DAS ERAS) em Node: DOM de mentira, módulo REAL Sys.crossroads ligado só na memória.
// Rodar: node test/paineis/p_cross.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
require(path.join(R, 'js/sys/crossroads.js'));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, C = Sys.crossroads;
assert.strictEqual(C.DATA.on, false, 'o módulo nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = tag => { const e = { tag, id: '', children: [], style: {}, dataset: {}, className: '', _h: '', clientWidth: 390, clientHeight: 844, listeners: {}, parentNode: null,
  setAttribute() {}, addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const body = mkEl('body'), head = mkEl('head'), fbw = mkEl('div');
g.document = { body, head, createElement: t => mkEl(t), getElementById: id => (id === 'fb_w' ? fbw : null) };

/* ---------- jogo de mentira ---------- */
const host = makeHost({ seed: 5 }); Sys.host = host;
const newSave = id => ({ id, gold: 0, sys: {}, stage: 1 });
g.S = newSave('a'); g.STAGES_PER_ERA = 10;
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const log = []; g.snd = n => log.push('snd:' + n); g.statsChanged = () => log.push('stats'); g.save = () => log.push('save');
g.B = { res: null, running: true, act: 1, banner: 1, eshots: [1] };
g.PANEL_ON = {}; let def = null, addName = '';
g.Panels = { defs: {}, add(n, d) { addName = n; def = d; d.name = n; this.defs[n] = d; return d; }, on(n) { return !!g.PANEL_ON[n] && !!this.defs[n]; },
  open(n, o) { if (!this.on(n)) return false; return this.defs[n].open(o || {}); } };

const SRC = fs.readFileSync(path.join(R, 'js/p_cross.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_cross.js' });
const P = g.PCross, X = P.state, out = [];
const H = () => (X.el ? X.el.innerHTML : ''), has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = h => (h.match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = (x, o) => X.el.listeners.click({ target: { closest: () => ({ dataset: Object.assign({ x }, o || {}) }) } });
const clean = (h, what) => { assert(!/\p{Extended_Pictographic}/u.test(h), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(h), what + ': texto quebrado: ' + (h.match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/\.\.\.|…/.test(h), what + ': reticências'); assert(!/comprar|compra\b|sorte|R\$|gema|diamante|preço|só hoje|última chance|rolar de novo/i.test(h), what + ': texto proibido (jogo com menores)');
  for (const m of h.matchAll(/src="([^"]+)"/g)) assert(fs.existsSync(path.join(R, un(m[1]))), what + ': imagem não existe: ' + m[1]);
  for (const m of h.matchAll(/url\(([^)]+)\)/g)) assert(fs.existsSync(path.join(R, m[1])), what + ': imagem não existe: ' + m[1]); };
const sane = what => { const bt = buttons(H()); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto: ' + b.tag); }
  clean(H(), what); return bt.length; };
/* conta as chamadas ao choose do módulo (o módulo de verdade continua respondendo) */
let chooseCalls = []; const choose0 = C.choose; C.choose = function (S, st, id, h) { chooseCalls.push({ st, id }); return choose0.apply(this, arguments); };

// 0) registro: painel 'cross', overlay, chave nasce DESLIGADA; o arquivo não liga chave, não usa diálogo do navegador, não tem emoji nem reticências
assert.strictEqual(addName, 'cross'); assert.strictEqual(g.PANEL_ON.cross, false, 'a chave nasce desligada'); assert(def && def.overlay === true && typeof def.open === 'function' && typeof def.close === 'function');
assert(SRC.includes("if(!('cross' in PANEL_ON)) PANEL_ON.cross=false;"));
assert(!/\.on\s*=\s*true|setOn\s*\(|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/\.\.\.|…|text-overflow\s*:\s*ellipsis/.test(SRC), 'sem reticências (nem no CSS)');
assert(!/assets\/|\.png|\.jpg|\.webp|new Image/.test(SRC), 'a tela não cita imagem (ícones desenhados no código)');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert(/\.pc-gold,\.xs \.pc-gold\{[^}]*color:#2a1403/.test(SRC), 'botão dourado: cor escura declarada também com .xs');
{ const code = SRC.replace(/\/\*[\s\S]*?\*\//g, ''); for (const b of C.DATA.pool) { assert(!code.includes(b.name), 'nome de bênção copiado no código: ' + b.name); assert(!code.includes(b.text), 'texto de bênção copiado no código: ' + b.text); } }
assert.strictEqual(g.Panels.open('cross', { stage: 5 }), false, 'tela desligada: Panels.open não abre');
out.push('registro: overlay "cross", chave desligada, sem diálogo, sem emoji, sem reticências, sem imagem, nenhuma bênção copiada no código');

// 1) MÓDULO DESLIGADO: aviso e Voltar; nada é escolhido; a luta para e volta
g.PANEL_ON.cross = true;
assert.strictEqual(def.open({ stage: 5 }), true); assert.strictEqual(X.mode, 'off'); has('Encruzilhada indisponível agora.'); has('role="alert"');
{ const bt = buttons(H()); assert.strictEqual(bt.length, 1); assert.strictEqual(bt[0].dataset.x, 'close'); has('>Voltar<'); } sane('desligado');
assert.deepStrictEqual(g.B.res, { mode: 'cross' }); assert.strictEqual(g.B.running, false, 'a luta para atrás da janela'); assert.strictEqual(def.open({ stage: 5 }), false, 'não abre duas');
tap('ok'); tap('pick', { id: 'furia' }); assert.strictEqual(chooseCalls.length, 0, 'desligado: nenhum toque chama o módulo');
tap('close'); assert.strictEqual(X.open, false); assert.strictEqual(body.children.length, 0, 'janela removida'); assert.strictEqual(g.B.res, null); assert.strictEqual(g.B.running, true, 'a luta volta');
assert.strictEqual(P.hudHtml(), '', 'desligado: nada no HUD'); assert(!g.S.sys.crossroads, 'desligado: a tela não cria estado no save');
out.push('módulo desligado: aviso + Voltar, nenhum toque chama o módulo, nada no HUD, save intacto');

// 2) MÓDULO LIGADO (só na memória): a janela desenha as 2 bênçãos REAIS do módulo
C.setOn(true);
const r5 = C.onStage(g.S, host, 5); assert(r5.due && r5.offers.length === 2, 'fase 5 abre a encruzilhada (curva de hoje)');
let done = 0; assert.strictEqual(g.Panels.open('cross', { stage: 5, onDone: () => done++ }), true); assert.strictEqual(X.mode, 'pick');
const of5 = C.offers(g.S, 5); assert.deepStrictEqual(of5.map(b => b.id), r5.offers.map(b => b.id));
for (const b of of5) { has(g.esc2(b.name)); has(g.esc2(b.text)); has('data-id="' + b.id + '"'); }
for (const b of C.DATA.pool) if (!of5.some(q => q.id === b.id)) not(g.esc2(b.name));   // nada inventado: só as 2 do módulo
assert.strictEqual((H().match(/class="pc-xc[" ]/g) || []).length, 2, 'dois cartões'); assert.strictEqual((H().match(/class="until">até o fim da era</g) || []).length, 2, '"até o fim da era" em cada cartão');
has('Vale até o fim da era'); has('Fase 1-5 vencida'); has('escolha 1 de 2'); has('Senhor da Era</em> (fase 1-10)'); has('Na era seguinte (Antiguidade) começa uma coleção nova.'); has('Escolha definitiva.'); has('Escolher depois');
assert.strictEqual((H().match(/class="pt /g) || []).length, C.view(g.S, host).points.length, 'trilha: os pontos do módulo'); has('class="pt now"');
assert.deepStrictEqual(buttons(H()).map(b => b.dataset.x), ['pick', 'pick', 'later']); sane('escolha');
// rótulo curto: valores do módulo
assert.strictEqual(P.fx({ stat: { atkPct: 3 } }), 'ATK +3%'); assert.strictEqual(P.fx({ stat: { defPct: 2 } }), 'Dano recebido -2%'); assert.strictEqual(P.fx({ stat: { critPct: 1.5 } }), 'Crítico +1,5');
assert.strictEqual(P.fx({ perk: { brasaPot: 1 } }), 'Brasa +1 por pote'); assert.strictEqual(P.fx({ strike: { combo: 4 } }, 2), 'Combo +8'); assert.strictEqual(P.fx({ stat: { novo: 9 }, text: '+9 de coisa nova' }), '+9 de coisa nova', 'chave desconhecida: texto do módulo');
for (const b of C.DATA.pool) { const c = C.offers; const card = { id: b.id, name: b.name, text: b.text, stat: b.stat || {}, perk: b.perk || {}, strike: b.strike || {} }; const t = P.fx(card); assert(t && t !== b.text && /[+-]\d/.test(t), 'rótulo curto de ' + b.id + ': ' + t); void c; }
out.push('ligado: 2 cartões com nome, efeito e texto do módulo (' + of5.map(b => b.name + ' = ' + P.fx(b)).join(' | ') + '), trilha e regra "Vale até o fim da era"');

// 3) escolher: 1º toque só seleciona e pede confirmação; Voltar desfaz; Confirmar chama o módulo UMA vez
const pickA = of5[0], pickB = of5[1];
tap('pick', { id: 'nao-existe' }); assert.strictEqual(X.sel, '', 'id fora da oferta não seleciona');
tap('pick', { id: pickA.id }); assert.strictEqual(X.sel, pickA.id); has('Ficar com <em>' + g.esc2(pickA.name) + '</em>'); has('Não dá para trocar depois.'); has('class="pc-xc sel"'); has('class="pc-xc off"');
assert.deepStrictEqual(buttons(H()).map(b => b.dataset.x), ['back', 'ok']); assert.strictEqual(chooseCalls.length, 0, 'selecionar não grava'); sane('confirmação');
tap('back'); assert.strictEqual(X.sel, ''); assert.deepStrictEqual(buttons(H()).map(b => b.dataset.x), ['pick', 'pick', 'later']); assert.strictEqual(chooseCalls.length, 0);
tap('ok'); assert.strictEqual(chooseCalls.length, 0, 'Confirmar sem seleção não chama o módulo');
tap('pick', { id: pickA.id }); const ch0 = host.changes; tap('ok');
assert.strictEqual(chooseCalls.length, 1, 'choose chamado UMA vez'); assert.deepStrictEqual(chooseCalls[0], { st: { era: 0, n: 5 }, id: pickA.id });
tap('ok'); tap('pick', { id: pickB.id }); tap('ok'); assert.strictEqual(chooseCalls.length, 1, 'toques repetidos não chamam de novo');
assert(host.changes > ch0, 'o módulo avisou a mudança'); assert(log.includes('stats'), 'a tela pede para gravar/recalcular');
// a escolha aparece como ATIVA até o fim da era
const act = C.active(g.S); assert.strictEqual(act.length, 1); assert.strictEqual(act[0].id, pickA.id);
assert.strictEqual(X.mode, 'list'); has('Bênçãos da era'); has('Pré-História · 1 escolhida'); has(g.esc2(pickA.name)); has(g.esc2(P.fx(pickA))); has('ativa até o fim da era'); not(g.esc2(pickB.name));
has(g.esc2(pickA.name + ' ativa: ' + P.fx(pickA) + ' até o fim da era (Pré-História)')); has('role="status"'); has('acabam ao vencer o <em>Senhor da Era</em> (fase 1-10)'); not('data-x="pick"'); not('esperando');
sane('lista depois da escolha'); assert(C.bonus(g.S) && C.perks(g.S), 'o módulo segue respondendo');
tap('close'); assert.strictEqual(X.open, false); assert.strictEqual(done, 1, 'onDone ao fechar'); assert.strictEqual(g.B.res, null); assert.strictEqual(g.B.running, true);
out.push('escolher: selecionar > confirmar > Sys.crossroads.choose UMA vez; a bênção aparece "ativa até o fim da era"');

// 4) não dá para escolher de novo: o módulo recusa e a janela mostra o motivo
assert.strictEqual(def.open({ stage: 5 }), true); assert.strictEqual(X.mode, 'list', 'encruzilhada já escolhida: abre a lista'); has('Você já escolheu nesta encruzilhada. Não dá para trocar.'); has('role="alert"'); not('data-x="pick"'); sane('já escolhida'); tap('close');
assert.strictEqual(def.open({ stage: 3 }), true); has('Esta fase não tem encruzilhada.'); tap('close');
// recusa "done" vinda do módulo com a janela aberta (a escolha entrou por fora, ex.: outra aba)
g.S = newSave('b'); C.onStage(g.S, host, 5); chooseCalls = []; def.open({ stage: 5 }); const ofB = C.offers(g.S, 5); tap('pick', { id: ofB[0].id });
assert.strictEqual(choose0.call(C, g.S, 5, ofB[1].id, host).ok, true); tap('ok');
assert.strictEqual(chooseCalls.length, 1); assert.strictEqual(X.mode, 'list'); has('Você já escolheu nesta encruzilhada. Não dá para trocar.'); has(g.esc2(ofB[1].name)); assert.strictEqual(C.active(g.S).length, 1); assert.strictEqual(C.active(g.S)[0].id, ofB[1].id, 'a recusa não troca a bênção'); sane('recusa done'); tap('close');
// recusa "old": a era passou com a janela aberta
g.S = newSave('c'); C.onStage(g.S, host, 5); chooseCalls = []; def.open({ stage: 5 }); const ofC = C.offers(g.S, 5); tap('pick', { id: ofC[0].id }); C.onStage(g.S, host, 11); tap('ok');
assert.strictEqual(chooseCalls.length, 1); has('Esta encruzilhada é de uma era que já passou.'); assert.strictEqual(C.active(g.S).length, 0); has('Nenhuma bênção escolhida nesta era ainda.'); has('Antiguidade · nenhuma escolhida'); sane('recusa old'); tap('close');
// recusa "off": o módulo foi desligado com a janela aberta
g.S = newSave('d'); C.onStage(g.S, host, 5); chooseCalls = []; def.open({ stage: 5 }); const ofD = C.offers(g.S, 5); tap('pick', { id: ofD[0].id }); C.setOn(false); tap('ok');
assert.strictEqual(chooseCalls.length, 0, 'desligado no meio: nem chama'); tap('back'); has('Encruzilhada indisponível agora.'); tap('close'); C.setOn(true);
// erro do módulo: aviso, nada quebra
{ def.open({ stage: 5 }); tap('pick', { id: ofD[0].id }); const c1 = C.choose; C.choose = () => { throw new Error('boom'); }; tap('ok'); C.choose = c1; has('Não foi possível escolher agora.'); assert.strictEqual(X.mode, 'pick'); sane('erro do módulo'); tap('close'); }
out.push('recusa do módulo (done, old, stage, off, erro): mostra o motivo, não escolhe de novo, não troca a bênção');

// 5) "Escolher depois": fecha, a encruzilhada fica esperando e reabre com AS MESMAS 2
g.S = newSave('e'); C.onStage(g.S, host, 5); chooseCalls = []; def.open({ stage: 5 }); const ids1 = buttons(H()).filter(b => b.dataset.x === 'pick').map(b => b.dataset.id);
tap('later'); assert.strictEqual(X.open, false); assert.strictEqual(chooseCalls.length, 0); assert.deepStrictEqual(C.view(g.S, host).open.map(o => o.key), ['0:5'], 'fica esperando');
assert.strictEqual(def.open({}), true, 'sem fase: abre a que está esperando'); assert.strictEqual(X.mode, 'pick'); assert.deepStrictEqual(buttons(H()).filter(b => b.dataset.x === 'pick').map(b => b.dataset.id), ids1, 'as mesmas 2'); tap('close');
// lista com encruzilhada esperando: botão Escolher leva à janela de escolha
assert.strictEqual(def.open({ mode: 'list' }), true); assert.strictEqual(X.mode, 'list'); has('Encruzilhada da fase 1-5 esperando'); has('data-x="open" data-k="0:5"'); sane('lista com espera');
tap('open', { k: '0:5' }); assert.strictEqual(X.mode, 'pick'); assert.deepStrictEqual(buttons(H()).filter(b => b.dataset.x === 'pick').map(b => b.dataset.id), ids1); tap('close');
out.push('Escolher depois: fica esperando sem prazo; reabrir (direto ou pela lista) mostra as mesmas 2');

// 6) várias bênçãos na era (curva de 100 fases, só na memória): a lista soma as repetidas e segue "ativa até o fim da era"
{ g.S = newSave('f'); Sys.phases = { DATA: { on: true, perEra: 100 } }; assert.strictEqual(C.perEra(), 100);
  for (const n of [10, 20, 30]) { assert(C.onStage(g.S, host, { era: 0, n }).due); def.open({ stage: { era: 0, n } }); has('Fase 1-' + n + ' vencida'); has('fase 1-100'); const id = buttons(H()).find(b => b.dataset.x === 'pick').dataset.id; tap('pick', { id }); tap('ok'); assert.strictEqual(X.mode, 'list'); sane('lista ' + n); tap('close'); }
  def.open({ mode: 'list' }); const a = C.active(g.S); assert.strictEqual(a.length, 3); has('Pré-História · 3 escolhidas'); for (const b of a) has(g.esc2(b.name));
  assert.strictEqual((H().match(/class="pc-brow"/g) || []).length, new Set(a.map(b => b.id)).size, 'uma linha por bênção diferente'); sane('lista de 3'); tap('close');
  // era seguinte: as bênçãos da anterior acabam (o módulo apaga; a lista fica vazia)
  C.onStage(g.S, host, { era: 1, n: 1 }); def.open({ mode: 'list' }); has('Antiguidade · nenhuma escolhida'); has('Nenhuma bênção escolhida nesta era ainda.'); tap('close'); delete Sys.phases; assert.strictEqual(C.perEra(), 10); }
out.push('várias bênçãos na era: lista com todas; na era seguinte a lista esvazia (regra do módulo)');

// 7) HUD da batalha: selo "Encruzilhada" enquanto espera e botão "Bênçãos"
g.S = newSave('g'); assert.strictEqual(P.mount(), true); const hud = fbw.children[fbw.children.length - 1]; assert.strictEqual(hud.id, 'pc_hud'); assert.strictEqual(P.mount(), true); assert.strictEqual(fbw.children.filter(c => c.id === 'pc_hud').length, 1);
P.update(true); assert.strictEqual(hud.innerHTML, '', 'sem bênção e sem espera: nada no HUD');
C.onStage(g.S, host, 5); assert.strictEqual(P.update(true), true); assert(hud.innerHTML.includes('data-pc="badge"') && hud.innerHTML.includes('>Encruzilhada<') && hud.innerHTML.includes('fase 1-5') && hud.innerHTML.includes('escolha 1 de 2'), 'selo da encruzilhada esperando');
assert(hud.innerHTML.includes('data-pc="list"') && hud.innerHTML.includes('>Bênçãos<') && hud.innerHTML.includes('class="ct ex"'), 'botão Bênçãos com o aviso de espera');
assert(/class="pc-badge"[^>]*style="top:122px"/.test(hud.innerHTML), 'selo logo abaixo da barra da fase'); assert(/class="pc-bb[^"]*"[^>]*style="top:290px"/.test(hud.innerHTML), 'Bênçãos: posição do protótipo sem a tabela do HUD');
/* QA (360 px): o selo não encosta no chip "FC recomendada" do js/diff.js (#dfh: top 110, 15 px; 27 com a linha do teto de XP) nem no selo "Fraco contra";
   folga de 6 px ou mais; x de 82 a 318 na base de 390; os avisos do jogo (#toast) descem para baixo do selo enquanto ele está na tela */
{ const DIFF_SRC = fs.readFileSync(path.join(R, 'js/diff.js'), 'utf8'), dm = /e\.id = 'dfh';[^\n]*?left:78px;right:74px;top:(\d+)px[\s\S]*?id="dfh_t" style="[^"]*?height:(\d+)px[\s\S]*?id="dfh_x" style="[^"]*?line-height:(\d+)px/.exec(DIFF_SRC);
  assert(dm, 'o chip de FC recomendada do js/diff.js mudou de forma: conferir a posição do selo'); const dTop = +dm[1], dH1 = +dm[2], dH2 = dH1 + 1 + +dm[3]; assert.strictEqual(dTop, 110); assert.strictEqual(dH1, 15); assert.strictEqual(dH2, 27);
  const topOf = () => +/class="pc-badge"[^>]*style="top:(\d+)px"/.exec(P.hudHtml())[1], gid0 = g.document.getElementById, fake = {};
  g.document.getElementById = id => fake[id] || gid0(id);
  try {
    fake.dfh = { style: {} }; fake.dfh_x = { style: { display: 'none' }, textContent: '' };
    assert(topOf() - (dTop + dH1) >= 6, 'selo com 6 px ou mais de folga abaixo do chip de FC recomendada: ' + topOf()); assert.strictEqual(topOf(), dTop + dH1 + 6, 'e logo abaixo dele');
    fake.dfh_x = { style: {}, textContent: 'XP de abate cheia' }; assert(topOf() - (dTop + dH2) >= 6, 'com a linha do teto de XP o selo desce junto: ' + topOf());
    fake.dfh = { style: {}, offsetTop: 110, offsetHeight: 31 }; assert.strictEqual(topOf(), 147, 'usa a altura real do chip quando o navegador a dá');
    fake.dfh = { style: {} }; fake.dfh_x = { style: { display: 'none' }, textContent: '' }; fake.wsl_root = { style: {}, offsetHeight: 30 }; assert(topOf() >= 122 + 30 + 6 && topOf() - (dTop + dH1) >= 6, 'com o selo Fraco contra, fica abaixo dos dois: ' + topOf());
    fake.wsl_root = { style: { display: 'none' }, offsetHeight: 30 }; assert.strictEqual(topOf(), dTop + dH1 + 6, 'selo Fraco contra escondido não conta');
    delete fake.dfh; delete fake.dfh_x; delete fake.wsl_root; assert.strictEqual(topOf(), 122, 'sem o chip (dificuldade desligada): posição do protótipo');
    /* largura: x 82 a 318 na base de 390 */
    const css = head.children.map(c => c.textContent || '').join('\n'), bm = /\.pc-badge,\.xs \.pc-badge\{[^}]*left:(\d+)px;min-height:(\d+)px;max-width:(\d+)px/.exec(css);
    assert(bm && +bm[1] === 82 && +bm[1] + +bm[3] <= 318 && +bm[2] >= 40, 'selo entre x 82 e 318, toque de 40 px');
    /* avisos (#toast) abaixo do selo enquanto ele está na tela; voltam quando ele some */
    assert(/body\.fb\.pcx\.pcx #toast\{top:calc\(var\(--fbsafe,0px\) \+ var\(--pcxt,180px\) \* var\(--fbs,1\)\)\}/.test(css), 'regra que desce os avisos');
    const cls = new Set(), props = {}; body.classList = { add: c => cls.add(c), remove: c => cls.delete(c), contains: c => cls.has(c) }; body.style.setProperty = (k, v) => { props[k] = v; };
    fake.dfh = { style: {} }; fake.dfh_x = { style: { display: 'none' }, textContent: '' }; P.update(true); assert(cls.has('pcx'), 'selo na tela: avisos descem'); assert(parseInt(props['--pcxt'], 10) >= topOf() + 40 + 6, 'avisos com folga abaixo do selo: ' + props['--pcxt']);
    assert(/class="pc-badge"[^>]*style="top:131px"/.test(hud.innerHTML), 'o HUD redesenha o selo na posição nova');
    g.PANEL_ON.cross = false; P.update(true); assert(!cls.has('pcx'), 'sem selo: avisos no lugar de sempre'); g.PANEL_ON.cross = true; delete fake.dfh; delete fake.dfh_x; P.update(true); assert(cls.has('pcx'));
  } finally { g.document.getElementById = gid0; }
  out.push('selo: 6 px ou mais abaixo do chip de FC recomendada (com e sem a linha do teto de XP) e do selo Fraco contra, x 82 a 318, avisos do jogo abaixo dele'); }
g.FB_MENU = [{ id: 'gear', side: 'left' }, { id: 'summon', side: 'left' }, { id: 'shop', side: 'left' }, { id: 'pass', side: 'left' }, { id: 'chest', side: 'right' }]; g.fbUnl = id => id !== 'pass' && id !== 'summon';
assert(/class="pc-bb[^"]*"[^>]*style="top:292px"/.test(P.hudHtml()), 'Bênçãos na vaga livre seguinte da coluna da esquerda (abaixo da Loja)'); delete g.FB_MENU; delete g.fbUnl;
clean(hud.innerHTML, 'HUD'); for (const b of buttons(hud.innerHTML)) assert(b.dataset.pc === 'badge' || b.dataset.pc === 'list', 'botão do HUD sem ação');
hud.listeners.click({ target: { closest: () => ({ dataset: { pc: 'badge' } }) } }); assert.strictEqual(X.open, true); assert.strictEqual(X.mode, 'pick', 'selo abre a escolha');
{ const id = buttons(H()).find(b => b.dataset.x === 'pick').dataset.id; tap('pick', { id }); tap('ok'); tap('close'); }
assert(!hud.innerHTML.includes('data-pc="badge"'), 'escolheu: o selo some'); assert(hud.innerHTML.includes('<em class="ct">1</em>'), 'Bênçãos mostra 1 ativa');
hud.listeners.click({ target: { closest: () => ({ dataset: { pc: 'list' } }) } }); assert.strictEqual(X.mode, 'list', 'Bênçãos abre a lista'); has('ativa até o fim da era'); tap('close');
{ let reads = 0; const v0 = C.view; C.view = function () { reads++; return v0.apply(this, arguments); }; for (let i = 0; i < 50; i++) P.update(); assert(reads <= 1, 'HUD: leitura espaçada: ' + reads); C.view = v0; }
g.PANEL_ON.cross = false; P.update(true); assert.strictEqual(hud.innerHTML, '', 'tela desligada: nada no HUD'); g.PANEL_ON.cross = true;
C.setOn(false); P.update(true); assert.strictEqual(hud.innerHTML, '', 'módulo desligado: nada no HUD'); C.setOn(true);
P.unmount(); assert.strictEqual(fbw.children.filter(c => c.id === 'pc_hud').length, 0);
out.push('HUD: selo "Encruzilhada" enquanto espera, botão "Bênçãos" com contagem, some com a tela ou o módulo desligado');

// 8) larguras 320 e 390 e tela curta: a janela cabe (largura pelas bordas, altura com rolagem só vertical); pausa opcional
{ g.S = newSave('h'); C.onStage(g.S, host, 5); const mk0 = g.document.createElement; g.document.createElement = t => { const e = mk0(t); e.clientWidth = 320; e.clientHeight = 568; return e; };
  def.open({ stage: 5, pause: false }); assert.strictEqual(g.B.res, null, 'pause:false não para a luta'); const m = /style="top:(\d+)px;max-height:(\d+)px"/.exec(H()); assert(m && +m[1] >= 8 && +m[1] + +m[2] <= 568 - 8 + 0.01, 'cabe em 320x568: ' + (m && m[0])); tap('close'); g.document.createElement = mk0;
  assert(/\.pc-xm\{[^}]*left:10px;right:10px[^}]*overflow-x:hidden;overflow-y:auto/.test(SRC), 'janela presa às bordas, sem rolagem lateral'); assert(/\.pc-xcs\{[^}]*minmax\(0,1fr\)/.test(SRC), 'cartões encolhem');
  for (const m2 of SRC.matchAll(/(?:min-)?height:(\d+)px;[^}]*\}/g)) void m2;
  assert(/\.pc-xc \.pc-gold\{[^}]*min-height:44px/.test(SRC) && /\.pc-xbt button\{[^}]*min-height:44px/.test(SRC) && /\.pc-x,\.xs \.pc-x\{[^}]*width:40px;height:40px/.test(SRC) && /\.pc-pend \.pc-gold\{[^}]*min-height:44px/.test(SRC) && /\.pc-badge,\.xs \.pc-badge\{[^}]*min-height:40px/.test(SRC), 'toques com 40 px ou mais');
  out.push('320x568: a janela cabe; toques de 40 px ou mais; pausa opcional'); }

// 9) bênçãos que acabaram: aviso UMA vez (view().lastEnded → ackEnded), só com nada aberto por cima da luta; desligado não avisa nem mexe no save
{ g.S = newSave('i'); const toasts = []; g.toast = m => toasts.push(String(m)); let acks = 0; const ack0 = C.ackEnded; C.ackEnded = function () { acks++; return ack0.apply(this, arguments); };
  C.onStage(g.S, host, 5); const of = C.offers(g.S, 5); C.choose(g.S, 5, of[0].id, host); assert.strictEqual(P.mount(), true); P.update(true); assert.strictEqual(toasts.length, 0, 'era em curso: sem aviso');
  C.onStage(g.S, host, 10); const le = C.view(g.S, host).lastEnded; assert(le && le.list.length === 1, 'o módulo guardou as bênçãos da era vencida (Senhor da Era)');
  g.B.res = { mode: 'win' }; P.update(true); assert.strictEqual(toasts.length, 0, 'com a Vitória aberta espera'); g.B.res = null;
  g.B.eraPend = 1; P.update(true); assert.strictEqual(toasts.length, 0, 'com a Troca de era na fila espera'); g.B.eraPend = null;
  g.PANEL_ON.cross = false; P.update(true); assert.strictEqual(toasts.length, 0, 'tela desligada: sem aviso'); assert(C.view(g.S, host).lastEnded, 'e continua pendente'); g.PANEL_ON.cross = true;
  C.setOn(false); const s0 = JSON.stringify(g.S); P.update(true); assert.strictEqual(toasts.length, 0, 'módulo desligado: sem aviso'); assert.strictEqual(JSON.stringify(g.S), s0, 'módulo desligado: save intacto'); C.setOn(true); assert.strictEqual(acks, 0);
  P.update(true); assert.strictEqual(toasts.length, 1); assert.strictEqual(acks, 1); assert.strictEqual(toasts[0], 'As bênçãos da era Pré-História acabaram: ' + of[0].name + '. Na era seguinte (Antiguidade) começa uma coleção nova.');
  assert(!/\.\.\.|…|undefined|NaN/.test(toasts[0])); assert.strictEqual(C.view(g.S, host).lastEnded, null, 'o módulo limpou');
  P.update(true); P.update(true); assert.strictEqual(toasts.length, 1, 'uma vez só'); assert.strictEqual(acks, 1);
  /* pendente de outra abertura do jogo (save com lastEnded): avisa ao montar o HUD */
  g.S = newSave('j'); C.onStage(g.S, host, 5); const o2 = C.offers(g.S, 5); C.choose(g.S, 5, o2[1].id, host); C.onStage(g.S, host, 10); g.S = JSON.parse(JSON.stringify(g.S)); P.update(true); assert.strictEqual(toasts.length, 2); assert(toasts[1].includes(o2[1].name));
  P.unmount(); C.ackEnded = ack0; delete g.toast;
  out.push('bênçãos que acabaram: "' + toasts[0] + '" uma vez, depois da Vitória e da Troca de era; desligado não avisa'); }

C.choose = choose0; C.setOn(false);
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
