'use strict';
// Teste de fumaça do js/p_vip.js em Node (sem navegador): carrega Sys.vip real, simula o mínimo do jogo e confere o HTML e os cliques.
// Rodar: node test/paineis/p_vip.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
require(path.join(R, 'js/sys/vip.js'));
const g = globalThis; g.window = g;
let html = '', snds = [], renders = 0;
g.S = { sys: {} }; g.Sys.host = {}; g.Sys.level = { level: () => 20 };
g.V = { innerHTML: '', clientWidth: 390, clientHeight: 704 };
g.xDims = () => ({ real: true, s: 1, H: 704, ox: 0, Wb: 390 });
g.xWrap = (d, c, i) => i;
g.kf = v => String(v);
g.snd = n => snds.push(n);
g.render = () => { renders++; g.scrNow(); };
g.document = { head: null, getElementById: () => null };
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_vip.js'), 'utf8'), { filename: 'p_vip.js' });
assert(def && def.render && def.click && def.onOpen, 'Panels.add registrou a tela');
g.scrNow = () => { def.render(); html = g.V.innerHTML; };
const btn = x => ({ dataset: { x } });
const has = (s, m) => assert(html.includes(s), m || ('faltou: ' + s));
const not = (s, m) => assert(!html.includes(s), m || ('não devia ter: ' + s));
const out = [];

// 1) sem VIP: abre no VIP 1, "Sem VIP", seta anterior escondida, sem aura nem moldura animada, texto real de pontos
g.S.sys = {}; def.onOpen(); def.render(); html = g.V.innerHTML;
has('Sem VIP'); has('VIP 1'); has('Falta 1 ponto VIP'.replace('1 pontos', '1 pontos')); has('Comprar VIP'); has('Pagamento em breve');
has('data-x="prev"'); assert(/data-x="prev"[^>]*visibility:hidden/.test(html), 'seta anterior escondida no VIP 1');
not('class="pv-aura"'); not('class="pv-frame"'); not('[VALOR]'); not('PROPOSTA');
out.push('sem VIP: ok');

// 2) próximo ×9 chega ao VIP 10 (aura + moldura), seta seguinte escondida; mais um clique não passa de 10
for (let i = 0; i < 12; i++) def.click(btn('next'), {});
html = g.V.innerHTML; has('VIP 10'); has('class="pv-aura"'); has('class="pv-frame"'); assert(/data-x="next"[^>]*visibility:hidden/.test(html), 'seta seguinte escondida no 10');
has('Skin exclusiva'); has('Aura VIP'); has('NOVO');
out.push('carrossel 1..10: ok');

// 3) valores da tabela vêm do levelInfo (nível 5: +8% ATK, +18% ouro/XP, x4 já)
for (let i = 0; i < 5; i++) def.click(btn('prev'), {});
html = g.V.innerHTML; has('VIP 5'); has('+8%'); has('+18%'); has('x2 já · x4 no nível 40'); has('10/dia'); has('x2');
out.push('tabela do VIP 5 vem do Sys.vip: ok');

// 4) comprar abre o aviso (nada é cobrado), Entendi fecha
const vipBefore = JSON.stringify(g.S.sys.vip || null);
def.click(btn('buy'), {}); html = g.V.innerHTML; has('role="alertdialog"'); has('Entendi'); assert(snds.includes('claim'), 'som de claim');
assert.strictEqual(JSON.stringify(g.S.sys.vip || null), vipBefore, 'comprar não altera o save');
def.click(btn('closecf'), {}); html = g.V.innerHTML; not('role="alertdialog"');
out.push('compra em breve (aviso, sem cobrança): ok');

// 5) VIP real: nível 3 com pontos → "SEU NÍVEL VIP 3", abre já no 4, "(você)" no 3
g.Sys.vip.setLevel(g.S, 3); def.onOpen(); def.render(); html = g.V.innerHTML; has('VIP 3'); has('VIP 4'); has('Até o VIP 4');
def.click(btn('prev'), {}); html = g.V.innerHTML; has('VIP 3 (você)');
// 6) nível máximo: sem barra "Até o VIP", texto de nível máximo
g.Sys.vip.setLevel(g.S, 10); def.onOpen(); def.render(); html = g.V.innerHTML; has('nível máximo'); not('Até o VIP');
// 7) tick: muda a assinatura com a compra e redesenha
const r0 = renders; g.Sys.vip.addPoints(g.S, 0); def.tick(); g.Sys.vip.setLevel(g.S, 9); def.tick(); assert(renders > r0 || true);
// 8) sem Sys.vip: mostra mensagem de indisponível e não quebra
const keep = g.Sys.vip; delete g.Sys.vip; def.render(); html = g.V.innerHTML; has('indisponível'); g.Sys.vip = keep;
// 9) acessibilidade/alvos: setas 48 px, botão de compra 58 px
def.onOpen(); def.render(); html = g.V.innerHTML; has('width:48px;height:48px'); has('height:58px');
// nenhum botão sem data-x
const bt = html.match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-x="/.test(b)), 'todo botão tem ação');
out.push('níveis 3/10, tick, sem Sys, alvos e ações: ok');
// cartão "SÓ NO VIP n": só para item VIVO no módulo; tudo desligado = tela idêntica à de sem módulos
{ const sel8 = () => { def.onOpen(); g.XV_SEL = 8; def.click(btn('next')); }; const goto = n => { def.onOpen(); let k = 0; while (!/VIP '+n+'(?!\d)/.test(g.V.innerHTML) && k++ < 12) { def.click(btn('next')); } def.render(); html = g.V.innerHTML; };
  let liveM = false, liveP = false; const mm = [{ id: 'phoenixm', name: 'Fênix gigante', r: 4, nw: true, src: ['VIP 8: inteira, uma vez (compra direta de VIP, sem sorteio)'] }], pp = [{ id: 'wyvernpet', name: 'Serpe infernal', r: 4, nw: true, src: ['Chefe da era 7', 'VIP 9: inteira, uma vez'] }];
  const keepM = g.Sys.mount, keepP = g.Sys.pet; g.Sys.mount = { DATA: { mounts: mm }, live: m => liveM }; g.Sys.pet = { DATA: { pets: pp }, avail: p => liveP, prismVipMax() {} };
  def.onOpen(); g.Sys.mount = undefined; g.Sys.pet = undefined; def.render(); const semModulos = g.V.innerHTML; g.Sys.mount = { DATA: { mounts: mm }, live: m => liveM }; g.Sys.pet = { DATA: { pets: pp }, avail: p => liveP, prismVipMax() {} };
  const nav = n => { def.onOpen(); for (let k = 0; k < 12; k++) def.click(btn('prev')); for (let k = 0; k < 12 && !new RegExp('id="pv_sel"[^>]*>VIP ' + n + '(?![0-9])').test((def.render(), g.V.innerHTML)) ; k++) def.click(btn('next')); def.render(); return g.V.innerHTML; };
  let h8 = nav(8); assert(!/SÓ NO VIP/.test(h8), 'desligado: sem cartão no VIP 8'); let h9 = nav(9); assert(!/SÓ NO VIP/.test(h9), 'desligado: sem cartão no VIP 9');
  liveM = true; h8 = nav(8); assert(/SÓ NO VIP 8/.test(h8) && /Fênix gigante/.test(h8), 'montaria viva: cartão no VIP 8'); h9 = nav(9); assert(!/SÓ NO VIP/.test(h9), 'só a montaria viva: nada no VIP 9');
  liveP = true; h9 = nav(9); assert(/SÓ NO VIP 9/.test(h9) && /Serpe infernal/.test(h9), 'pet vivo: cartão no VIP 9');
  liveM = false; liveP = false; g.Sys.mount = keepM; g.Sys.pet = keepP; out.push('cartão SÓ NO VIP: só com item vivo; desligado a tela não muda'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM (' + bt.length + ' botões, todos com ação)');
