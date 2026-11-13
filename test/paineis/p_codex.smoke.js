'use strict';
// Teste de fumaça do js/p_codex.js em Node: Sys.stats/mount REAIS, ERAS/RAR de teste, meta.json real. Rodar: node test/paineis/p_codex.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'stats', 'mount'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
g.fetch = u => Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(fs.readFileSync(path.join(R, u), 'utf8'))) });
g.ERAS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ n: 'Era' + i, w: ['a', 'b', 'c', 'd', 'e'].map(x => 'Arma' + i + x), a: ['Colete' + i, 'x', 'x', 'x', 'x'] }));
g.RAR = [{ n: 'Básico', c: '#999', m: 1 }, { n: 'Raro', c: '#48f', m: 1.7 }, { n: 'Épico', c: '#b5f', m: 3 }, { n: 'Mítico', c: '#f46', m: 5.5 }, { n: 'Lendário', c: '#fb2', m: 10 }];
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
const toasts = [], views = []; g.snd = () => {}; g.toast = t => toasts.push(t); g.render = () => def.render(); g.setView = v => views.push(v); g.statsChanged = () => {};
g.Screens = { reg: {}, close() { g.closed = (g.closed || 0) + 1; }, open(k) { g.opened = k; } }; let def = null; g.Panels = { add(n, d) { def = d; return d; }, cur: () => 'codex' };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_codex.js'), 'utf8'), { filename: 'p_codex.js' });
assert(def && def.render && def.click);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const out = [];
const tick = () => new Promise(r => setTimeout(r, 20));
(async () => {
  // 1) álbum: 6 cartões, sem posse/%/marcos (chaves desligadas), sem emoji
  def.onOpen(); def.render(); await tick(); def.render(); ['Armas', 'Armaduras', 'Pets', 'Montarias', 'Bestiário', 'Auras'].forEach(has);
  assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); assert(!/Tenho|Falta|%|\[QTD\]|em breve/i.test(H().replace(/<[^>]*>/g, ' ')), 'sem posse/porcentagem inventada'); assert(!/aria-label="[^"]*(tenho|falta|[0-9]%)/.test(H()), 'aria sem posse'); out.push('álbum: 6 cartões do catálogo real, sem posse nem % (chave desligada), zero emoji');
  const bt = H().match(/<button[^>]*>/g) || []; assert(bt.length >= 6 && bt.every(b => /data-x="/.test(b))); out.push(bt.length + ' botões, todos com ação');
  // 2) todo caminho de arte do catálogo existe em assets/
  const srcs = new Set(); for (const k of ['arm', 'eq', 'pet', 'mnt', 'bes', 'aur']) { def.click(btn('cat', { k })); for (const m of H().matchAll(/src="(assets\/[^"]+)"/g)) srcs.add(m[1]); for (const m of H().matchAll(/url\((assets\/[^)]+)\)/g)) srcs.add(m[1]); }
  assert(srcs.size > 60, 'muita arte: ' + srcs.size); const miss = [...srcs].filter(s => !fs.existsSync(path.join(R, s))); assert(!miss.length, 'arte inexistente: ' + miss.join(', ')); out.push(srcs.size + ' arquivos de arte conferidos: todos existem');
  // 3) categoria: faixas por era, ficha, "Ir"
  def.click(btn('cat', { k: 'arm' })); has('Era0'); has('Arma0a'); assert(!H().includes('Tenho')); def.click(btn('pick', { id: 'w-2-2' })); has('Arma2e'); has('Ataque ×10'); has('Onde conseguir'); has('Invocar');
  def.click(btn('go', { g: 'summon', n: 'Invocar' })); assert(views.includes('summon') && g.closed >= 1); def.click(btn('cat', { k: 'arm' })); def.click(btn('pick', { id: 'w-0-0' })); def.click(btn('go', { g: 'battle' }));
  def.click(btn('cat', { k: 'pet' })); def.click(btn('pick', { id: 'p-mamute-1' })); def.click(btn('go', { g: 'pets', n: 'Pets' })); assert(toasts.some(t => /abre mais adiante/.test(t)));
  g.Screens.reg.pets = true; def.click(btn('pick', { id: 'p-mamute-1' })); def.click(btn('go', { g: 'pets', n: 'Pets' })); assert.strictEqual(g.opened, 'pets'); out.push('ficha e "Ir": Invocar, Batalha, tela inexistente avisa, tela registrada abre');
  // 4) dados reais: atributos do Sys.stats, montarias do Sys.mount, nomes do meta.json, sem fênix
  def.click(btn('cat', { k: 'eq' })); def.click(btn('pick', { id: 'a-3-gloves' })); has('Ataque e Crítico'); def.click(btn('cat', { k: 'mnt' })); has('Pônei'); has('Tigre de cristal'); def.click(btn('pick', { id: 'm-wyvern' })); has('+12%');
  def.click(btn('cat', { k: 'bes' })); has('Minotauro'); has('Dragão Real'); has('Devorador Cósmico'); def.click(btn('cat', { k: 'pet' })); assert(!/fênix|fenix/i.test(H())); has('Papagaio'); out.push('atributos, montarias, bestiário e pets vêm dos dados reais; sem fênix');
  // 5) voltar: ficha, categoria, álbum, fecha
  def.click(btn('pick', { id: 'p-dragao-0' })); def.click(btn('back')); assert(!H().includes('Onde conseguir')); def.click(btn('back')); has('Auras'); const c0 = g.closed || 0; def.click(btn('back')); assert.strictEqual(g.closed, c0 + 1); out.push('voltar: ficha, categoria, álbum, fecha');
  // 6) posse ligada pelo provedor: tenho/falta, filtro, % e marco com resgate
  g.P_CODEX.owned = true; g.P_CODEX.rewards = true; const own = new Set(['w-0-0', 'w-0-1', 'p-mamute-0']); let cl = null; g.P_CODEX.readOwned = () => own;
  g.P_CODEX.readRewards = () => ({ claimed: [], marks: [{ p: 1, txt: '50 gemas' }, { p: 50, txt: 'título' }], claim: p => { cl = p; return { ok: true, txt: 'Prêmio de ' + p + '%' }; } });
  def.onOpen(); def.render(); has('de '); has('Pegar 1%'); def.click(btn('claim', { p: '1' })); assert.strictEqual(cl, 1);
  def.click(btn('cat', { k: 'arm' })); has('Todos'); has('Tenho'); has('Falta'); def.click(btn('filt', { i: '1' })); assert(!H().includes('Arma1a')); has('Arma0a'); def.click(btn('filt', { i: '2' })); assert(!H().includes('Arma0a')); has('Arma1a');
  out.push('posse ligada: tenho/falta, filtro, % e prêmio do marco (resgate pelo provedor)');
  g.P_CODEX.owned = false; g.P_CODEX.rewards = false; def.render(); assert(!H().includes('Tenho'));
  console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
