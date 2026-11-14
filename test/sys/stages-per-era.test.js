// node test/sys/stages-per-era.test.js — STAGES_PER_ERA e ERAS são const do index.html: no navegador ficam no escopo global de SCRIPT, não em window.
// Aqui o jogo é imitado num contexto vm com `const` de verdade (root.STAGES_PER_ERA fica undefined, como no navegador). Prova que Sys.crossroads.perEra
// e Sys.eras.bossName leem o valor do jogo (antes caíam no 10 e no 'Chefe' sem nome).
'use strict';
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm');
const R = path.join(__dirname, '..', '..');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
function game(per, withEras) {
  const ctx = vm.createContext({ console });
  vm.runInContext('const STAGES_PER_ERA=' + per + ';' + (withEras ? "const ERAS=[{n:'Pedra',en:[{n:'Lobo'},{n:'Urso'},{n:'Mamute'}]},{n:'Bronze',en:[{n:'Hoplita'},{n:'Ciclope'}]}];" : ''), ctx, { filename: 'index.html' });
  for (const m of ['crossroads', 'eras']) vm.runInContext(fs.readFileSync(path.join(R, 'js/sys/' + m + '.js'), 'utf8'), ctx, { filename: 'js/sys/' + m + '.js' });
  return ctx;
}
t('const do jogo NÃO fica em window (o defeito): root.STAGES_PER_ERA é undefined no contexto', () => {
  const g = game(12, true); assert.strictEqual(g.STAGES_PER_ERA, undefined); assert.strictEqual(vm.runInContext('STAGES_PER_ERA', g), 12); });
t('Sys.crossroads.perEra lê o STAGES_PER_ERA do jogo (12 aqui; antes caía no 10); com o Sys.phases ligado vale o perEra dele', () => {
  const g = game(12, false), C = g.Sys.crossroads; assert.strictEqual(C.perEra(), 12);
  g.Sys.phases = { DATA: { on: true, perEra: 100 } }; assert.strictEqual(C.perEra(), 100); g.Sys.phases.DATA.on = false; assert.strictEqual(C.perEra(), 12); });
t('Sys.eras.bossName lê ERAS e STAGES_PER_ERA do jogo: fase 12 de 12 = Senhor da Era; fase 6 = Chefe com nome', () => {
  const g = game(12, true), E = g.Sys.eras;
  assert.strictEqual(E.bossName(6), 'Chefe Mamute'); assert.ok(/^Senhor da Era/.test(E.bossName(12)), E.bossName(12));
  assert.ok(!/^Senhor/.test(E.bossName(10)), 'com 12 por era, a fase 10 não é de Senhor'); assert.strictEqual(E.bossName(13), 'Chefe Ciclope'); });
t('sem o jogo (node puro): continua 10 por era', () => {
  const ctx = vm.createContext({ console }); vm.runInContext(fs.readFileSync(path.join(R, 'js/sys/crossroads.js'), 'utf8'), ctx); assert.strictEqual(ctx.Sys.crossroads.perEra(), 10); });
console.log(n + ' testes ok');
