'use strict';
// Teste de fumaça do js/p_tower.js em Node (sem navegador): Sys.tower REAL + host de teste (test/sys/_host.js), DOM mínimo falso, relógio falso.
// Rodar: node test/paineis/p_tower.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'instances', 'practice', 'titles', 'tower', 'forge', 'pet', 'pass', 'fc'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, className: '', textContent: '', _h: '', setAttribute() {}, appendChild(c) { this.children.push(c); c.parentNode = this; return c; }, removeChild(c) { this.children = this.children.filter(x => x !== c); } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
let timers = []; g.setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; }; g.clearTimeout = () => {}; g.requestAnimationFrame = f => f();
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host;
g.Sys.level = { isUnlocked: () => true, unlockLevel: () => 15, level: () => 60 };   /* o jogador de teste está acima do nível da Torre */
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '', clientWidth: 390, clientHeight: 704 }; g.xDims = () => ({ real: true, s: 1, H: 704, ox: 0, Wb: 390 }); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
const snds = [], toasts = []; g.snd = n => snds.push(n); g.toast = t => toasts.push(t); let renders = 0, changed = 0; g.render = () => { renders++; def.render(); }; g.statsChanged = () => { changed++; };
g.Screens = { close() { g.closed = true; } }; g.Panels = { add(n, d) { def = d; return d; }, on: () => false, open() {} }; let def = null;
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_tower.js'), 'utf8'), { filename: 'p_tower.js' });
assert(def && def.render && def.click, 'Panels.add registrou a tela');
const btn = x => ({ dataset: { x } }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const T = g.Sys.tower; const o = T.ensure(g.S, host); o.best = 0; o.lossesLeft = T.DATA.lossesPerDay;
// 1) estado inicial: andar 1, tentativas 5/5, botão "Subir ao andar 1", marcos reais, ranking com aviso, sem dado inventado
def.onOpen(); def.render(); has('Subir ao andar 1'); has('Tentativas'); has('5/5'); has('Andar 1'); has('Andar 10'); has('Andar 100'); has('Valendo quando o online abrir'); has('Melhor: 0'); has('início');
assert(!/\[VALOR\]|PROPOSTA/.test(H())); out.push('estado inicial ok (andar 1, 5/5, marcos, ranking com aviso)');
// 2) tela cheia de botões com ação
let bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 2 && bt.every(b => /data-x="/.test(b)), 'todo botão com ação');
// 3) desafiar: usa Sys.tower.fight (uma vez), reproduz o registro, termina com faixa e redesenha
const before = JSON.stringify(g.S.sys.tower); els.pt_hpk = mkEl('pt_hpk'); els.pt_hpf = mkEl('pt_hpf'); els.pt_fx = mkEl('pt_fx'); els.pt_ban = mkEl('pt_ban');
def.click(btn('climb'), {}); assert.strictEqual(def.busy(), true, 'ocupado durante a luta'); assert.strictEqual(changed, 1, 'statsChanged logo após a luta (já gravado)');
const after = g.S.sys.tower; assert(after.fights === 1, 'uma luta'); def.click(btn('climb'), {}); assert.strictEqual(after.fights, 1, 'durante a animação o toque não vale');
let guard = 0; while (timers.length && guard++ < 400) { const t = timers.shift(); t.f(); }
assert(els.pt_ban.innerHTML.includes('vencido!') || els.pt_ban.innerHTML.includes('Derrota'), 'faixa de resultado'); assert.strictEqual(def.busy(), false, 'livre ao fim'); assert(renders >= 1, 'redesenhou'); out.push('luta reproduzida: ' + (els.pt_ban.innerHTML.includes('vencido!') ? 'vitória' : 'derrota') + ', ' + after.fights + ' luta(s), faixa e redesenho ok');
// 4) sem tentativas: botão desligado visualmente, toque explica e NÃO luta
o.lossesLeft = 0; def.render(); has('Sem tentativas hoje'); has('Voltam amanhã'); const f0 = o.fights; def.click(btn('climb'), {}); assert.strictEqual(o.fights, f0, 'sem tentativas não luta'); assert(toasts.some(t => /tentativas/.test(t)), 'explica'); out.push('sem tentativas: explica e não luta');
// 5) andar de chefe: andar 9 vencido -> próximo é o 10 (chefe, imagem do chefe, 💎 e marco)
o.best = 9; o.lossesLeft = 5; def.render(); has('Subir ao andar 10'); has('chefe'); has('era0_boss.png'); has('CHEFE'); out.push('andar 10: chefe com imagem da era e plaquinha CHEFE');
// 6) marco conquistado marca ✓
o.best = 25; def.render(); has('conquistado'); out.push('marcos conquistados: ok');
// 7) ranking sem tela: avisa; Voltar do bloqueio; Sys.tower ausente
def.click(btn('rank'), {}); assert(toasts.some(t => /ranking/i.test(t)), 'aviso do ranking');
const lv = g.Sys.level; g.Sys.level = { isUnlocked: () => false, unlockLevel: () => 15 }; def.render(); has('Libera no nível 15'); def.click(btn('back'), {}); assert(g.closed); g.Sys.level = lv;
const tw = g.Sys.tower; delete g.Sys.tower; def.render(); has('indisponível'); g.Sys.tower = tw; out.push('ranking avisa, bloqueio por nível, Voltar, sem Sys.tower: ok');
bt = H().match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-x="/.test(b)));
// 8) formato final (Sistemas): andar 100 = ovo Épico à escolha; acima, fragmentos do pet escolhido ou pendente; sem 'fênix'
g.Sys.pet = g.Sys.pet || {}; const A = tReward({ egg: { r: 2, source: 'tower100', choice: ['drake', 'parrot'] } }); assert(A.includes('Ovo Épico à escolha (Dragão ou Papagaio)'));
const B = tReward({ t100Frags: 3, t100Pet: 'drake', phoenixFrags: 0 }); assert(B.includes('3 fragmentos do Dragão'), B); const C = tReward({ t100Frags: 1, t100Pet: '' }); assert(C.includes('1 fragmento do pet do andar 100'), C);
const D = tReward({ egg: { r: 4, pet: 'phoenix' }, t100Frags: 2, t100Pet: 'phoenix' }); assert(D.includes('Ovo raro') && !/fênix|fenix/i.test(D + A + B + C), D);
out.push('formato do andar 100 e acima: ok, sem fênix');
// 9) torre inteira rolável com lista virtual: altura total, poucos andares desenhados, rolar repinta
o.best = 49; o.lossesLeft = 5; def.render(); has('pt_in'); has('height:' + ((100 * 110) + 220) + 'px');
const nF = s => (s.match(/aria-label="Andar [0-9]+/g) || []).length; assert(nF(H()) >= 3 && nF(H()) <= 8, 'janela pequena: ' + nF(H()));
const sc = { scrollTop: 0, style: {} }, dy = mkEl('pt_dyn'); els.pt_sc = sc; els.pt_dyn = dy; def.render(); assert.strictEqual(typeof sc.onscroll, 'function'); assert(sc.scrollTop > 4000, 'câmera no andar atual');
sc.scrollTop = 0; sc.onscroll(); assert(dy.innerHTML.includes('Andar 100') && nF(dy.innerHTML) >= 3 && nF(dy.innerHTML) <= 8, 'topo: andar 100'); assert(/CHEFE/.test(dy.innerHTML));
out.push('torre inteira: lista virtual (' + nF(dy.innerHTML) + ' andares na janela), câmera no andar atual, rolar repinta');
delete els.pt_sc; delete els.pt_dyn;
// tentativas com o bônus do VIP (o que o módulo devolve) e chip trancado para quem não tem
{ const o2 = g.Sys.tower.ensure(g.S, host); o2.best = 0; o2.lossesLeft = 5; g.Sys.vip = g.Sys.vip || null; const keep = g.Sys.vip; try{ require('../../js/sys/vip.js'); }catch(e){}
  def.render(); has('Tentativas extras: VIP 5'); has(': +1'); assert(!/R[$]/.test(g.V.innerHTML)); Sys.vip.setLevel(g.S, 5); g.Sys.tower.ensure(g.S, host); g.Sys.tower.ensure(g.S, host).lossesLeft = 6; def.render(); has('6/6'); assert(!/Tentativas extras: VIP/.test(g.V.innerHTML), 'com VIP 5 o chip some'); Sys.vip.setLevel(g.S, 0); g.Sys.vip = keep; out.push('torre: tentativas com bônus do VIP e chip "VIP 5: +1" trancado'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
