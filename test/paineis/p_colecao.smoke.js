'use strict';
// Fumaça do js/p_colecao.js (Pets/Montarias/Asas novos + como obter) em Node, com os módulos REAIS de Sistemas. Rodar: node test/paineis/p_colecao.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
g.document = { head: { appendChild() {} }, getElementById: () => null, createElement: () => ({ style: {} }), querySelectorAll: () => [] };
g.S = { sys: {} }; g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.snd = () => {}; g.render = () => def.render();
g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }, { n: 'Divino', c: '#7ff' }];
g.Screens = { close() { g.closed = true; } };
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
g.Sys = g.Sys || {}; g.Sys.host = { eraMax: () => 1, now: () => Date.now() };
for (const m of ['pet', 'mount', 'stats']) { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.log('(aviso) js/sys/' + m + '.js não carregou em Node: ' + e.message.split('\n')[0]); } }
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_colecao.js'), 'utf8'), { filename: 'p_colecao.js' });
assert(def && def.render && def.click);
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), out = [];
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
// Pets: 9 novos com "Como obter" (da tabela aprovada), iniciais grátis, sem emoji
def.onOpen(); def.render(); has('Pets novos (9)'); has('Lobo sombrio'); has('Serpe infernal'); has('VIP 9: inteira, uma vez'); has('Torre: andar 150'); has('Pets grátis do começo'); has('Como obter');
assert((H().match(/Como obter/g) || []).length >= 9, 'cada pet novo tem Como obter');
assert(!/undefined|NaN|\bnull\b/.test(H()), 'sem undefined/NaN/null'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
has('Em breve'); has('assets/icons/pets/shadow_wolf.png'); has('data-old="assets/pets/new/shadow_wolf_ref_prev.png"'); out.push('Pets: 9 novos + iniciais grátis, como obter, arte');
// Montarias: 10 novas, mecha em breve com o preço da proposta fora da tela (só "compra direta")
def.click(btn('tab', { i: 1 })); has('Montarias novas (10)'); has('Fênix gigante'); has('VIP 8: inteira, uma vez'); has('Mecha de guerra'); has('Em breve (até as compras abrirem)'); has('assets/icons/mounts/war_mecha.png');
assert((H().match(/Como obter/g) || []).length >= 10); assert(!/undefined|NaN|\bnull\b/.test(H())); out.push('Montarias: 10 novas, mecha em breve');
// Asas: 8 novas
def.click(btn('tab', { i: 2 })); has('Asas novas (8)'); has('Mariposa sombria'); has('Asa de serafim'); has('A asa mais rara do jogo.'); has('assets/icons/wings/wing_seraph.png');
assert((H().match(/Como obter/g) || []).length >= 8); assert(!/undefined|NaN|\bnull\b/.test(H())); out.push('Asas: 8 novas, serafim a mais rara');
// botões todos com ação; Voltar fecha
const bt = H().match(/<button[^>]*>/g) || []; assert(bt.length && bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push(bt.length + ' botões, todos com ação');
// módulo ausente: mensagem em vez de quebrar
const keep = g.Sys.pet; delete g.Sys.pet; def.click(btn('tab', { i: 0 })); has('ainda não está disponível'); g.Sys.pet = keep; out.push('sem Sys.pet: aviso, sem quebrar');
def.click(btn('back')); assert(g.closed); out.push('Voltar fecha');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
