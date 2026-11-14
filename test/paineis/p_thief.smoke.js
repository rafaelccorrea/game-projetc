'use strict';
// Teste de fumaça do js/p_thief.js (LADRÃO DE BRASAS) em Node: Sys.thief e Sys.bonfire REAIS. Rodar: node test/paineis/p_thief.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['stats', 'level', 'loot', 'forge', 'bonfire', 'thief'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const T = g.Sys.thief, BF = g.Sys.bonfire; assert(T && BF, 'módulos carregados');
assert.strictEqual(T.DATA.on, false, 'Sys.thief nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } });
const ELS = { th_strip: mkEl('th_strip'), th_scroll: mkEl('th_scroll'), th_left: mkEl('th_left') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ now: Date.UTC(2026, 10, 13, 15, 0, 0) });   // 12:00 em Brasília
g.Sys.host = host; g.S = { hero: 'kael', gold: 0, gems: 0, stage: 15 };
g.n0 = v => String(Math.round(v));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'thief'; g.snd = () => {};
let def = null, addName = '', saves = 0, closed = 0; const opened = []; g.render = () => def.render(); g.statsChanged = () => { saves++; };
g.Screens = { close() { closed++; }, current: () => g.view };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open(n, o) { opened.push(n + ':' + JSON.stringify(o || {})); g.view = n; def.onOpen(); return true; } };

/* espiões: cada função do módulo que GRAVA é contada, com os parâmetros */
const spy = {}; for (const k of ['enter', 'finish', 'sweep', 'cancel']) { const f = T[k]; spy[k] = []; T[k] = function (...a) { spy[k].push(a); return f.apply(T, a); }; }
const n = k => spy[k].length;

const SRC = fs.readFileSync(path.join(R, 'js/p_thief.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_thief.js' });
const P = g.PThief;

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = m[2]; return { tag, dataset: ds }; });
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|sorteio|última chance|só hoje|oferta|comprar|diamante|<input|<textarea/i.test(h), tag + ': preço, compra, pressão ou campo de texto');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const click = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const open = () => { def.onOpen(); def.render(); };
const calls = () => n('enter') + n('finish') + n('sweep') + n('cancel');

// 0) registro
assert.strictEqual(addName, 'thief'); assert.strictEqual(g.PANEL_ON.thief, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.title === 'Ladrão de Brasas');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=(?!=)/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/text-overflow\s*:\s*ellipsis/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/new Image\(|Math\.random/.test(SRC), 'sem new Image() e sem sorteio');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const u of P.urls()) assert(fs.existsSync(path.join(R, u)), 'imagem da lista de carga não existe: ' + u);
out.push('registro: painel thief, chave desligada, sem alert/confirm/prompt, sem emoji, sem sorteio');

// 1) MÓDULO DESLIGADO: aviso e Voltar; nenhuma função do módulo é chamada; nada escrito no save (nem pelo selo do Menu nem pelos ganchos da batalha)
const S0 = JSON.stringify(g.S); BF.DATA.on = true; g.startThiefRun = () => true; open(); assert.strictEqual(check('desligado'), 1, 'só o Voltar'); has('Ladrão de Brasas: em breve.');
for (const a of def.actions) if (a !== 'back') click(a); def.tick(); g.PANEL_ON.thief = true; assert.strictEqual(P.alerts(), 0); g.PANEL_ON.thief = false;
assert.deepStrictEqual(P.finish(1), { ok: false, reason: 'off' }); assert.strictEqual(P.cancel(), false); assert.strictEqual(calls(), 0, 'desligado: módulo não é chamado'); assert.strictEqual(JSON.stringify(g.S), S0, 'desligado: o save não muda'); assert.strictEqual(saves, 0);
click('back'); assert.strictEqual(closed, 1, 'Voltar fecha a tela');
{ const keep = g.Sys.thief; g.Sys.thief = null; open(); has('Ladrão de Brasas indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); click('enter'); g.Sys.thief = keep; }
// Fogueira desligada: aviso e Voltar (as Brasas não entrariam), nada chamado, save intacto
T.DATA.on = true; BF.DATA.on = false; open(); assert.strictEqual(check('sem fogueira'), 1); has('abre junto com a Fogueira das Eras'); for (const a of def.actions) if (a !== 'back') click(a);
assert.deepStrictEqual(P.finish(1), { ok: false, reason: 'off' }); assert.strictEqual(calls(), 0); assert.strictEqual(JSON.stringify(g.S), S0, 'Fogueira desligada: o save não muda');
out.push('módulo desligado, ausente ou Fogueira desligada: aviso e Voltar, módulo não chamado, save intacto');

// 2) LIGADO: tudo vem do módulo (entradas, segundos, lote pelo nível da Fogueira, estoque)
BF.DATA.on = true; delete g.startThiefRun; BF.ensure(g.S).lv = 12; open(); check('entrada');
has('id="th_left">2/2'); has('45 s'); has('lote do nível 12 da Fogueira'); has('>5 Brasas<'); has('voltam em 12 h 0 min'); has('Brasas guardadas'); has('>0/300<'); has('data-x="enter"'); has('data-x="sweep"'); not('th-card res');
// Repetir sem nível vencido: explica, sem confirmação, sem gastar
click('sweep'); has('Vença uma perseguição inteira para liberar o Repetir'); not('th-conf'); click('yes'); assert.strictEqual(n('sweep'), 0);
// Entrar sem a batalha ligada: explica e NÃO abre corrida
click('enter'); has('A perseguição ainda não está ligada na batalha'); assert.strictEqual(n('enter'), 0, 'sem a batalha, o módulo não é chamado'); assert.strictEqual(T.view(g.S, host).run, null);
// REGRA ÚNICA COM O SERVIDOR (js/sys/thief.js): a entrada é gasta AO ENTRAR; sair no meio não devolve; o fim não gasta outra
has('Entrar gasta 1 entrada na hora. Sair no meio não devolve.');
// a batalha recusa (false) depois do enter: a entrada já foi gasta, então a corrida fica ABERTA (Continuar) em vez de se perder
const runs = []; let accept = false; g.startThiefRun = r => { runs.push(r); return accept; };
click('enter'); assert.strictEqual(n('enter'), 1); assert.deepStrictEqual(spy.enter[0], [g.S, host]); assert.strictEqual(n('cancel'), 0, 'recusa da batalha não joga a entrada fora'); has('A perseguição fica aberta: toque em Continuar'); has('id="th_left">1/2');
assert.deepStrictEqual(runs[0], { lv: 12, lote: 5, secs: 45 }); assert(T.view(g.S, host).run, 'a corrida continua aberta'); assert(saves > 0, 'grava ao entrar'); check('corrida aberta');
has('Há uma perseguição aberta (nível 12)'); has('A entrada dela já foi gasta'); has('>Sair (a entrada não volta)<'); not('sem gastar'); not('data-x="enter"'); has('data-x="resume"'); has('data-x="cancel"');
click('enter'); click('sweep'); assert.strictEqual(n('enter'), 1, 'corrida aberta: não entra de novo'); not('th-conf');
// Continuar entrega a MESMA corrida, sem gastar outra entrada
accept = true; click('resume'); assert.strictEqual(n('enter'), 1); assert.deepStrictEqual(runs[1], { lv: 12, lote: 5, secs: 45 }, 'Continuar entrega a mesma corrida'); has('id="th_left">1/2');
// Sair no meio: fecha a corrida e a entrada NÃO volta (o botão já dizia)
click('cancel'); assert.strictEqual(n('cancel'), 1); has('Você saiu da perseguição. A entrada foi gasta'); has('id="th_left">1/2'); has('data-x="enter"'); assert.strictEqual(T.view(g.S, host).run, null); assert.strictEqual(BF.ensure(g.S).bra, 0, 'sair não rende Brasas'); check('saiu');
out.push('entrada: dados do módulo; sem a batalha não chama o enter; Entrar = 1 chamada, gasta a entrada na hora e entrega {lv, lote, secs}; recusa da batalha deixa a corrida aberta; Continuar não gasta; Sair não devolve');

// 3) FIM pela batalha: PThief.finish(score) roda o módulo UMA vez, não gasta outra entrada, e abre o resultado
click('enter'); assert.strictEqual(n('enter'), 2); has('id="th_left">0/2'); g.view = 'battle'; g.PANEL_ON.thief = true; const s1 = saves;
const r1 = P.finish(0.6); assert.strictEqual(n('finish'), 1); assert.deepStrictEqual(spy.finish[0], [g.S, host, { score: 0.6 }]); assert(r1.ok && r1.drop === 3 && r1.brasas === 3 && !r1.won && r1.left === 0);
assert.deepStrictEqual(opened, ['thief:{"result":true}'], 'abre a tela com o resultado'); assert(saves > s1, 'grava depois do fim'); def.render(); check('resultado parcial');
has('Fim da perseguição'); has('+3 Brasas'); has('O ladrão soltou 3 de 5 Brasas do saco.'); has('Entradas que sobram hoje: 0 de 2'); has('Solte o saco inteiro'); has('id="th_left">0/2'); has('>3/300<'); assert.strictEqual(BF.ensure(g.S).bra, 3);
assert.strictEqual(P.finish(1).reason, 'run', 'fim sem corrida não vale'); assert.strictEqual(BF.ensure(g.S).bra, 3, 'nada credita duas vezes');
click('ok'); not('th-card res'); check('depois do resultado'); assert.strictEqual(P.alerts(), 0);
has('Sem entradas hoje. Elas voltam à meia-noite de Brasília'); { const e = n('enter'); click('enter'); assert.strictEqual(n('enter'), e, 'sem entradas não chama o módulo'); click('sweep'); not('th-conf'); assert.strictEqual(n('sweep'), 0); }
// dia novo em Brasília: entradas de volta. Saco inteiro: nível vencido, Repetir liberado
host.t = Date.UTC(2026, 10, 14, 3, 0, 0); open(); check('dia novo'); has('id="th_left">2/2'); assert.strictEqual(P.alerts(), 2);
click('enter'); has('id="th_left">1/2'); const r2 = P.finish(1); assert(r2.won && r2.best === 12 && r2.left === 1); def.render(); check('resultado cheio'); has('Saco inteiro'); has('+5 Brasas'); has('Nível 12 vencido'); has('id="th_left">1/2'); assert.strictEqual(P.alerts(), 1);
click('ok');
out.push('fim: PThief.finish(score) = 1 chamada com {score}, sem gastar outra entrada, resultado do módulo na tela, sem crédito em dobro; sem entradas não chama; dia novo devolve as entradas; saco inteiro vence o nível');

// 4) REPETIR em dois toques, UMA chamada: gasta 1 entrada e paga o lote cheio do melhor nível VENCIDO (best e sweepLote do módulo)
has('nível 12): <em>5 Brasas</em>');
BF.ensure(g.S).lv = 40; def.render(); has('lote do nível 40 da Fogueira'); has('>8 Brasas<'); has('nível 12): <em>5 Brasas</em>');
click('sweep'); check('confirma repetir'); has('Repetir agora?'); has('Gasta <em>1 entrada</em>'); assert.strictEqual(n('sweep'), 0, '1º toque não gasta'); click('no'); not('th-conf'); assert.strictEqual(n('sweep'), 0, 'Cancelar não gasta');
click('sweep'); click('yes'); assert.strictEqual(n('sweep'), 1); assert.deepStrictEqual(spy.sweep[0], [g.S, host]); check('repetido'); has('Repetido'); has('+5 Brasas'); has('Lote cheio do nível 12 da Fogueira.'); has('id="th_left">0/2'); assert.strictEqual(BF.ensure(g.S).bra, 13);
click('yes'); assert.strictEqual(n('sweep'), 1, 'sem confirmação aberta, "yes" não gasta');
// estoque cheio (outro dia): a tela avisa antes e o resultado diz o que não coube (número do módulo)
host.t = Date.UTC(2026, 10, 15, 3, 0, 0); BF.ensure(g.S).bra = 298; open(); has('id="th_left">2/2'); has('O estoque está quase cheio: o que passar de 300 não entra'); click('sweep'); click('yes'); assert.strictEqual(n('sweep'), 2); check('estoque cheio'); has('+2 Brasas'); has('3 Brasas não couberam'); has('id="th_left">1/2');
out.push('Repetir em 2 toques (1 chamada, 1 entrada, lote do melhor nível vencido); estoque cheio avisado com os números do módulo');

// 5) tick não quebra; toda ação apareceu num botão
def.tick(); def.tick(); def.tick(); def.tick(); def.onClose();
for (const a of def.actions) assert(seenActs.has(a), 'ação nunca apareceu num botão: ' + a);
out.push('imagens em disco: ' + seenImgs.size + ' na tela + ' + P.urls().length + ' na lista de carga; ' + seenActs.size + ' ações vistas em botões');
for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
