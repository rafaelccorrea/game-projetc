'use strict';
// Teste de fumaça do js/p_map.js (Mapa das Eras, da Arte) em Node: Sys.phases REAL (desligado hoje: a tela converte o save) + host de teste. Rodar: node test/paineis/p_map.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'forge', 'pet', 'stats', 'fc', 'phases'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, clientHeight: 600, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 34, eraMax: 3 }); host.level = () => 60; let goTab = []; host.goTab = t => goTab.push(t); g.Sys.host = host;
g.Sys.level = { level: () => 60, isUnlocked: () => true };
g.S = host.S || {}; if (!g.S.sys) g.S.sys = {}; g.S.eraMax = 3; g.S.stage = 34;
g.V = { innerHTML: '', clientWidth: 390, clientHeight: 704 }; g.xDims = () => ({ real: true, s: 1, H: 704, ox: 0, Wb: 390 }); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
const snds = []; g.snd = n => snds.push(n); g.toast = () => {}; let renders = 0; g.render = () => { renders++; def.render(); };
g.Screens = { close() { g.closed = (g.closed || 0) + 1; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_map.js'), 'utf8'), { filename: 'p_map.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const P = g.Sys.phases;
// 1) mundo, chave do Sys.phases desligada: 9 marcadores, relógio, nível/FC, "Continuar" até a era atual, sem emoji
assert.strictEqual(P.DATA.on, false); def.onOpen(); def.render(); has('Relógio das Eras'); has('pickcur'); P.DATA.eraName.forEach(n => has(n)); has('data-x="clock"'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
assert.strictEqual((H().match(/data-x="era"/g) || []).length, 9, '9 regiões'); let bt = H().match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-x="/.test(b)), 'todo botão com ação'); out.push('mundo: 9 regiões, relógio, ' + bt.length + ' botões com ação, zero emoji (Sys.phases desligado: save convertido)');
// 2) cartão da era: história, chefe, entrar; era bloqueada explica
def.click(btn('era', { e: 2 })); has('Dragão Real'); has('Entrar na era'); def.click(btn('close')); assert(!H().includes('Fechar cartão da era'));
def.click(btn('era', { e: 8 })); has('Fechar'); assert(!H().includes('data-x="enter" data-e="8"'), 'era 8 bloqueada não entra'); def.click(btn('close')); out.push('cartão da era: aberta entra; bloqueada não oferece Entrar');
// 3) relógio abre e fecha
def.click(btn('clock')); has('closeclock'); def.click(btn('closeclock')); out.push('relógio: abre e fecha');
// 4) entrar na era: camada da era, abas de dificuldade, 100 fases, painel da fase
def.click(btn('era', { e: 2 })); def.click(btn('enter', { e: 2 })); has('data-x="diff"'); has('data-x="world"'); has('Fase '); const nodes = (H().match(/data-x="node"/g) || []).length; assert.strictEqual(nodes, 100, '100 fases'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji na era'); out.push('era: 4 abas, ' + nodes + ' fases');
// 5) dificuldades: Médio bloqueada explica; fase escolhida e prev/next
def.click(btn('diff', { d: 1 })); assert.strictEqual(def.busy(), false); def.click(btn('diff', { d: 0 })); def.click(btn('node', { n: 5 })); has('Fase 5'); def.click(btn('next')); has('Fase 6'); def.click(btn('prev')); has('Fase 5'); out.push('abas de dificuldade, escolher fase, anterior/próxima');
// 6) Desafiar com a chave desligada: botão "play" só na era/fase atual; leva à Batalha e fecha a tela
const cur = (() => { const m = H().match(/data-x="play"/); return !!m; })(); def.click(btn('world')); has('Relógio das Eras'); out.push('Voltar ao mapa ok');
def.click(btn('pickcur')); has('Entrar na era'); const e0 = g.PInstSel; def.click(btn('enter', { e: 3 })); const hasPlay = /data-x="play"/.test(H()); if (hasPlay) { const before = goTab.length; def.click(btn('play')); assert.strictEqual(goTab.length, before + 1, 'play abre a Batalha'); assert(goTab.includes('battle')); assert(g.closed >= 1, 'fecha a tela'); out.push('Desafiar (desligado): na fase atual abre a Batalha e fecha a tela'); }
// 7) chave ligada: Desafiar grava Sys.phases.cur e abre a Batalha; fase fora de ordem não luta
P.DATA.on = true; const o = P.ensure(g.S); o.best = { 0: [100, 0, 0, 0], 1: [100, 0, 0, 0], 2: [20, 0, 0, 0] }; o.migrated = true; P.DATA.lvlEntry = P.DATA.lvlEntry.map(() => 1); P.DATA.lvlExit = P.DATA.lvlExit.map(() => 1);
def.onOpen({ era: 2 }); assert(/data-x="diff"/.test(H()), 'onOpen com era abre a camada da era'); def.click(btn('node', { n: 21 })); has('data-x="fight"'); const gt = goTab.length; def.click(btn('fight')); assert.deepStrictEqual(P.ensure(g.S).cur, { e: 2, d: 0, n: 21 }); assert.strictEqual(goTab.length, gt + 1); out.push('chave ligada: Desafiar grava a fase escolhida e abre a Batalha');
def.onOpen({ era: 2 }); def.click(btn('node', { n: 60 })); assert(!/data-x="fight"/.test(H()), 'fase fora de ordem não oferece Desafiar'); const cur2 = JSON.stringify(P.ensure(g.S).cur); def.click(btn('fight')); assert.strictEqual(JSON.stringify(P.ensure(g.S).cur), cur2, 'fight fora de ordem não grava'); out.push('fase fora de ordem: sem Desafiar e sem gravar');
// 7b) LIGADO lê a curva: era liberada = Sys.phases.eraOpen/eraMax; progresso = eraView; vitória = Sys.phases.win (pelo window.PMap.win)
{ const o2 = P.ensure(g.S); o2.best = { 0: [100, 0, 0, 0], 1: [100, 0, 0, 0], 2: [20, 0, 0, 0] }; o2.cur = { e: 2, d: 0, n: 21 };
  assert.strictEqual(P.eraMax(g.S), 2); def.onOpen(); def.render(); has('Era atual: ' + P.DATA.eraName[2]); assert.strictEqual(window.PMap.current().n, 21, 'current() lê o Sys.phases');
  def.click(btn('era', { e: 2 })); def.click(btn('enter', { e: 2 })); assert.strictEqual(window.PMap.state.node, 21, 'entra na fase onde parou'); has('Fase 21'); has('data-x="fight"');
  const v = P.eraView(g.S, 2); assert.strictEqual(v.diffs[0].best, 20); assert(v.diffs[0].open && !v.diffs[1].open, 'Médio fechado até a fase 100 do Fácil'); def.click(btn('diff', { d: 1 })); assert.strictEqual(window.PMap.state.diff, 0, 'dificuldade fechada não troca');
  // vitória da fase 21: grava, devolve a próxima e o mapa avisa ao abrir
  const w = window.PMap.win(2, 0, 21); assert(w.ok && w.first && w.next.n === 22, 'win grava a fase 21'); assert.strictEqual(P.bestOf(g.S, 2, 0), 21); def.onOpen(); def.render(); has('Fase 21 vencida'); has('Próxima: fase 22');
  // fase fora de ordem: win recusa e não grava
  const bad = window.PMap.win(2, 0, 60); assert.strictEqual(bad.ok, false); assert.strictEqual(bad.reason, 'order'); assert.strictEqual(P.bestOf(g.S, 2, 0), 21);
  // fechar a era 2 libera a 3 e o aviso diz qual
  o2.best[2] = [100, 99, 0, 0]; const w2 = window.PMap.win(2, 1, 100); assert(w2.ok && w2.eraUnlocked === 3, 'vencer a fase 100 libera a era 3'); assert.strictEqual(P.eraMax(g.S), 3); def.onOpen(); def.render(); has('Era 3 liberada: ' + P.DATA.eraName[3]); assert.strictEqual((H().match(/data-x="era"/g) || []).length, 9);
  P.DATA.on = false; assert.deepStrictEqual(window.PMap.win(0, 0, 1), { ok: false, reason: 'off' }); P.DATA.on = true; out.push('chave ligada lê a curva: eraMax/eraView/current/win, aviso de fase vencida e de era liberada, fora de ordem recusado'); }
// 8) módulo ausente
const pp = g.Sys.phases; delete g.Sys.phases; def.render(); has('indisponível'); g.Sys.phases = pp; out.push('sem Sys.phases: aviso');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
