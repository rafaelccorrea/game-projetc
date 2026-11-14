'use strict';
// Tempo fora na ENTRADA NOVA (js/p_intro.js "Bem-vindo de volta") com a Fogueira das Eras (js/fogueira.js + Sys.bonfire REAIS), em Node.
// Prova: com a Fogueira ligada e tempo fora suficiente o Coletar entrega as Brasas UMA vez (o número da lista é o entregue; coletar de novo,
// a volta ao jogo e o modal antigo não entregam outra vez); sem Bem-vindo (ouro 0) a volta entrega uma vez; com a Fogueira desligada nada muda.
// Rodar: node test/paineis/p_intro_offline.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
['stats', 'level', 'loot', 'forge', 'bonfire'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, BF = Sys.bonfire; Sys.name = {};   /* Sys.name presente: a entrada não tenta carregar o script do nome */
assert.strictEqual(BF.DATA.on, false, 'o módulo nasce desligado');

/* ---------- navegador e jogo de mentira: só o que os dois arquivos leem ---------- */
const mkEl = () => ({ style: {}, children: [], classList: { add(){}, remove(){}, contains: () => false, toggle(){} }, setAttribute(){}, addEventListener(){}, appendChild(c){ this.children.push(c); return c; }, remove(){} });
let timers = [];
g.document = { readyState: 'complete', hidden: false, head: mkEl(), body: mkEl(), createElement: () => mkEl(), getElementById: () => null };
g.addEventListener = () => {}; g.removeEventListener = () => {}; g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => {}; g.fetch = undefined;
g.toast = () => {}; g.snd = () => {}; g.view = 'battle'; g.floatText = () => {};
g.PANEL_ON = { intro: true }; g.SYS_ON = true; g.B = { paused: false }; g.save = () => { saves++; }; g.hud = () => {}; let saves = 0;
g.BAL = { offlineCapHours: 8, goldBase: 10, goldGrowth: 1.1, commonGoldMult: 1, offlineKillsPerMin: 1, offlineRate: 1 };
let keyOn = false; g.fogOn = () => keyOn;
const host = makeHost({ level: 10, eraMax: 1, seed: 3 }); Sys.host = host;
const newSave = () => ({ name: 'Teste', welcome: true, tut: 99, gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, stage: 5, best: 5 });
const SRC_F = fs.readFileSync(path.join(R, 'js/fogueira.js'), 'utf8'), SRC_I = fs.readFileSync(path.join(R, 'js/p_intro.js'), 'utf8');
/* abertura nova do jogo: save novo, os dois arquivos carregados de novo (o "uma vez por abertura" da Fogueira e o cálculo do Bem-vindo zeram) */
function boot(away, fire){ g.S = newSave(); g.AWAY = away; delete g.__offDone; delete g.__noSave; keyOn = !!fire; BF.DATA.on = !!fire; timers = [];
  vm.runInThisContext(SRC_F, { filename: 'fogueira.js' }); vm.runInThisContext(SRC_I, { filename: 'p_intro.js' });
  assert.strictEqual(timers.length, 1, 'a entrada agenda o arranque'); const start = timers[0]; timers = [];
  const PI = g.PIntro; PI.open = done => { PI._done = done; };   /* sem desenhar as telas: o teste guarda o "entrou no jogo" */
  start(); assert.strictEqual(typeof PI._done, 'function', 'o arranque abriu a entrada'); return PI; }
const bra = () => (g.S.sys.bonfire ? BF.ensure(g.S).bra : 0);
const brasasOf = d => { const x = d && d.extras ? d.extras.find(e => e.key === 'brasas') : null; return x ? x.n : 0; };
const out = [];

// 1) Fogueira DESLIGADA: o Bem-vindo não mostra Brasas, o Coletar e a volta ao jogo não escrevem nada da Fogueira no save
{ const PI = boot(3600, false); const d = PI.offline(); assert(d && d.gold > 0, 'há Bem-vindo (ouro do tempo fora)'); assert.strictEqual(brasasOf(d), 0, 'sem linha de Brasas');
  PI.claimOffline(); assert.strictEqual(g.S.gold, d.gold, 'o ouro entra como sempre'); PI._done();
  assert.strictEqual(g.S.sys.bonfire, undefined, 'desligada não escreve no save'); assert.strictEqual(g.__offDone, true);
  assert.strictEqual(g.Fogueira.offline(3600), null);
  /* módulo ligado sem a chave do jogo também não entrega */
  const P2 = boot(3600, false); BF.DATA.on = true; assert.strictEqual(brasasOf(P2.offline()), 0); P2.claimOffline(); P2._done(); assert.strictEqual(bra(), 0); BF.DATA.on = false;
  out.push('desligada: Bem-vindo sem Brasas, Coletar entrega só o de sempre, nada da Fogueira no save'); }

// 2) Fogueira LIGADA, 1 h fora: a lista mostra as Brasas calculadas numa cópia; o Coletar entrega esse número UMA vez
{ const PI = boot(3600, true); const d = PI.offline(); assert(d && d.gold > 0); const n = brasasOf(d); assert.strictEqual(n, 3, '1 h fora = 3 Brasas (uma a cada 18 min)');
  const row = d.extras.find(e => e.key === 'brasas'); assert.strictEqual(row.label, 'Brasas da Fogueira'); assert(fs.existsSync(path.join(R, row.icon)), 'ícone da linha existe em disco');
  assert.strictEqual(bra(), 0, 'a prévia não mexe no save'); assert.strictEqual(PI.offline(), d, 'calculado uma vez');
  PI.claimOffline(); assert.strictEqual(bra(), n, 'o Coletar entrega o número da lista'); assert.strictEqual(g.S.gold, d.gold);
  assert.strictEqual(g.Fogueira.state().off, null, 'sem o cartão próprio da Fogueira: já está na lista do Bem-vindo');
  PI.claimOffline(); assert.strictEqual(bra(), n, 'coletar de novo não entrega outra vez'); assert.strictEqual(g.S.gold, d.gold);
  PI._done(); assert.strictEqual(bra(), n, 'entrar no jogo depois do Coletar não entrega outra vez'); assert.strictEqual(g.__offDone, true, 'o modal antigo não abre');
  assert.strictEqual(g.Fogueira.offline(3600), null, 'a chamada do modal antigo (js/meta.js) não entrega outra vez'); assert.strictEqual(bra(), n);
  PI.off = null; PI.claimed = false; PI.claimOffline(); assert.strictEqual(bra(), n, 'reabrir o Bem-vindo na mesma abertura não entrega Brasas de novo');
  out.push('ligada, 1 h fora: linha "' + row.label + '" com ' + n + ' e o Coletar entrega ' + n + ' uma vez (de novo, ao entrar e pelo modal antigo: nada)'); }

// 3) LIGADA, menos de 5 min fora: sem linha de Brasas e nada entregue (regra do módulo)
{ const PI = boot(200, true); const d = PI.offline(); assert(d && d.gold > 0); assert.strictEqual(brasasOf(d), 0); PI.claimOffline(); PI._done(); assert.strictEqual(bra(), 0);
  out.push('ligada, 200 s fora: sem Brasas (mínimo do módulo)'); }

// 4) LIGADA, sem Bem-vindo (ouro 0): a volta ao jogo entrega as Brasas uma vez
{ g.BAL.offlineRate = 0; const PI = boot(3600, true); assert.strictEqual(PI.offline(), false, 'sem ganho de ouro não há Bem-vindo'); PI.claimOffline(); assert.strictEqual(bra(), 0);
  PI._done(); assert.strictEqual(bra(), 3, 'a volta entrega'); PI._done(); assert.strictEqual(bra(), 3, 'uma vez só'); assert.strictEqual(g.Fogueira.offline(3600), null);
  /* quem ainda não passou do 1º balão do tutorial, ou sem save, não recebe */
  const P2 = boot(3600, true); g.S.tut = 0; P2._done(); assert.strictEqual(bra(), 0); const P3 = boot(3600, true); g.__noSave = true; P3._done(); assert.strictEqual(bra(), 0);
  const P4 = boot(60, true); P4._done(); assert.strictEqual(bra(), 0, 'menos de 120 s fora: nada'); g.BAL.offlineRate = 1;
  out.push('ligada, sem Bem-vindo: a volta ao jogo entrega 3 Brasas uma vez; tutorial no começo, sem save ou menos de 120 s: nada'); }

BF.DATA.on = false; keyOn = false;
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
