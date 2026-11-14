'use strict';
// Teste de fumaça do js/p_camp.js (ACAMPAMENTO DAS ERAS) em Node: DOM de mentira, módulos REAIS de js/sys (camp, forge, practice, vip, pet).
// O Sys.camp é ligado SÓ na memória deste teste (setOn) e desligado no fim. Rodar: node test/paineis/p_camp.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['forge', 'practice', 'vip', 'pet', 'camp'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, C = Sys.camp, P = Sys.pet;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 150, clientHeight: 110, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
let drawn = 0; const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };

/* ---------- jogo de mentira (só o que a tela lê) ---------- */
const host = makeHost({ level: 25, unit: 1 }); host.canSpendGold = n => host.gold >= n; host.spendGold = n => { if (host.gold < n) return false; host.gold -= n; return true; };
Sys.host = host; const hours = x => { host.t += x * 3600000; };
g.S = {}; g.V = { innerHTML: '' }; g.view = 'camp'; g.PANEL_ON = {};
let dims = { H: 560, Wb: 320, real: true }; g.xDims = () => dims; g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xEraBgUrl = () => 'assets/bg/era2.png'; g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(assets/bg/era2.png) center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.hud = () => log.push('hud');
const gateSeen = []; g.xGate = u => { gateSeen.push(u.slice()); return false; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_camp.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_camp.js' });
const X = g.PCamp.X, out = [], imgs = new Set();
const CSS = g.document.head.children.map(c => c.textContent).join('\n');
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const find = (x, o) => buttons().find(b => b.dataset.x === x && Object.keys(o || {}).every(k => b.dataset[k] === o[k]));
/* todo <button> com data-x tratado; sem emoji; sem texto quebrado; sem reticências; sem palavra de venda; guarda as imagens citadas */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/…|\.\.\./.test(H()), what + ': tem reticências'); assert(!/comprar|compre|sorteio|R\$|preço|oferta|acelerar|últim|só hoje|corra/i.test(H()), what + ': texto proibido');
  for (const m of H().matchAll(/src="([^"]+)"/g)) imgs.add(un(m[1])); for (const m of H().matchAll(/url\(([^)]+)\)/g)) imgs.add(m[1]); for (const u of g.PCamp.urls()) imgs.add(u);
  return bt.length; };
const open = () => { def.onOpen(); def.render(); };
const tent = id => C.view(g.S, host).tents.find(t => t.id === id);
let nCollect = 0, nUp = 0; const collect0 = C.collect, upgrade0 = C.upgrade;
C.collect = function () { nCollect++; return collect0.apply(this, arguments); }; C.upgrade = function () { nUp++; return upgrade0.apply(this, arguments); };

try {
// 0) registro: painel 'camp', chave nasce DESLIGADA, nome por extenso, sem diálogo do navegador, sem emoji, sem reticências, sem ellipsis
assert.strictEqual(addName, 'camp'); assert.strictEqual(g.PANEL_ON.camp, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert.strictEqual(def.title, 'Acampamento das Eras', 'nome sempre por extenso');
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/…|\.\.\./.test(SRC), 'arquivo sem reticências'); assert(!/text-overflow|ellipsis/.test(SRC) && !/text-overflow|ellipsis/.test(CSS), 'nenhuma regra com text-overflow:ellipsis');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert(/\.ac-b\.gold,\.xs \.ac-b\.gold\{[^}]*color:#2a1403/.test(CSS), 'botão dourado: texto escuro, declarado também com .xs');
assert(/\.ac-b,\.xs \.ac-b\{min-height:42px/.test(CSS) && /\.ac-pb,\.xs \.ac-pb\{min-height:44px/.test(CSS) && /\.ac-tent,\.xs \.ac-tent\{[^}]*min-height:64px/.test(CSS), 'toque mínimo de 40 px');
assert(/\.ac\{[^}]*overflow:hidden/.test(CSS) && /\.ac-scene\{[^}]*overflow-x:hidden/.test(CSS) && /grid-template-columns:minmax\(0,1fr\) minmax\(0,1fr\)/.test(CSS), 'sem rolagem lateral');
assert(!/Acampamento(?! das Eras)/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/Forja do Acampamento/g, '')), 'a palavra Acampamento só aparece por extenso nos textos');
out.push('registro: camp desligada, título por extenso, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji, sem reticências, sem ellipsis');

// 1) módulo DESLIGADO: aviso e Voltar; nada escreve no save; nenhuma ação chama o módulo
assert.strictEqual(C.DATA.on, false); open(); has('O Acampamento das Eras está fechado agora.'); has('role="alert"'); has('>Voltar<'); sane('desligado');
assert.strictEqual(buttons().length, 1); assert.strictEqual(buttons()[0].dataset.x, 'back');
for (const a of def.actions) if (a !== 'back') def.click(btn(a, { t: 'forge', p: 'drake' })); def.tick(); def.tick(); def.render();
assert.deepStrictEqual(g.S, {}, 'desligado: o save não muda'); assert.strictEqual(nCollect + nUp, 0, 'desligado: não chama o módulo'); assert.strictEqual(host.gold, 0);
def.click(btn('back')); assert(log.includes('close'), 'Voltar fecha'); assert.deepStrictEqual(g.S, {});
{ const k = Sys.camp; delete Sys.camp; open(); has('fechado agora'); sane('sem módulo'); Sys.camp = k; }
out.push('desligado (e sem o módulo): aviso e Voltar, save intacto, nenhuma chamada ao módulo');

C.setOn(true);
// 2) trancado por nível: explica o que falta; nada coleta
host._level = 10; open(); has('Abre no nível ' + C.DATA.unlockLevel + '.'); has('Você está no nível 10: faltam ' + (C.DATA.unlockLevel - 10) + ' níveis.'); has('>Voltar<'); sane('trancado');
assert.strictEqual(buttons().length, 1); def.click(btn('collect', { t: 'gold' })); def.click(btn('all')); def.click(btn('up', { t: 'forge' })); assert.strictEqual(nCollect + nUp, 0, 'trancado: não chama coleta nem melhoria');
host._level = C.DATA.unlockLevel - 1; open(); has('falta 1 nível.'); host._level = 25;
out.push('trancado: "Abre no nível ' + C.DATA.unlockLevel + '", diz o nível atual e quanto falta; só o Voltar');

// 3) aberto: as tendas do módulo com o que cada uma juntou, barra, estado, produção; fundo = cenário da era com véu claro; herói
els.ac_hero = mkEl('ac_hero'); els.ac_hero.getContext = () => ctx;
open(); hours(2); def.render(); { const v = C.view(g.S, host); assert.strictEqual(v.tents.length, 3); has(g.esc2(v.text));
  for (const t of v.tents) { has('>' + g.esc2(t.name) + '</span>'); has('<span>' + t.stored + ' / ' + t.cap + '</span>'); has('style="width:' + t.pct + '%"'); has('data-x="collect" data-t="' + t.id + '"'); has('data-x="tent" data-t="' + t.id + '"');
    has('+' + String(t.perHour).replace('.', ',') + ' por hora'); has('src="' + g.PCamp.ART_IMG[t.id] + '"'); }
  assert.deepStrictEqual(v.tents.map(t => t.stored), [6, 2, 4], 'números do módulo em 2 h'); has('Enchendo'); not('<b>Cheia</b>'); has('>Coletar tudo<'); not('role="dialog"');
  has('url(assets/bg/era2.png)'); has('class="ac-veil"'); assert(/rgba\(13,10,8,0\)/.test(H()), 'cenário da era sem escurecer (de dia)'); has('id="ac_hero"');
  assert(gateSeen.length && gateSeen[gateSeen.length - 1].includes('assets/bg/era2.png') && gateSeen[gateSeen.length - 1].includes('assets/ui/camp/tent_gold.png'), 'pede a carga do fundo e das tendas antes de desenhar');
  assert(H().indexOf('data-t="gold"') < H().indexOf('id="ac_hero"') && H().indexOf('id="ac_hero"') < H().indexOf('data-t="forge"'), 'Tenda do Ouro e herói à esquerda; as outras à direita'); }
sane('aberto'); out.push('aberto: 3 tendas do Sys.camp com guardado/teto, barra, estado e produção; fundo da era com véu claro; arte pintada da Arte');

// 3b) herói: drawHeroFull a pé, com o pet (não esconde); erro no desenho não derruba a tela
assert(raf.length >= 1, 'o herói anima'); heroCalls = []; drawn = 0; raf.shift()(1000); assert.strictEqual(heroCalls.length, 1); { const c = heroCalls[0];
  assert.strictEqual(c.st.mount, false); assert(c.st.pet === undefined && c.st.weapon === undefined && c.st.hero === undefined, 'pet e arma: os do jogo'); assert(c.k > 0 && isFinite(c.k) && c.y <= 110 && c.x > 0); }
g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(1100); g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };
def.onClose(); assert.strictEqual(raf.length, 0, 'fechar a tela para o laço'); delete els.ac_hero; raf = []; open();
out.push('herói: window.drawHeroFull a pé com o pet na frente; erro no desenho não derruba a tela; o laço para ao fechar');

// 4) Coletar de UMA tenda: chama o collect do módulo UMA vez, só aquela tenda entrega, as outras ficam como estavam; mostra o que entrou
{ const f0 = JSON.stringify(g.S.sys.forge || null), p0 = JSON.stringify(g.S.sys.practice || null); log.length = 0; nCollect = 0;
  def.click(find('collect', { t: 'forge' })); assert.strictEqual(nCollect, 1, 'UMA chamada ao Sys.camp.collect');
  assert.notStrictEqual(JSON.stringify(g.S.sys.forge || null), f0, 'as pedras de forja entraram pelo módulo'); assert.strictEqual(JSON.stringify(g.S.sys.practice || null), p0, 'a Pedreira não foi coletada'); assert.strictEqual(host.gold, 0, 'o ouro não foi coletado');
  assert.deepStrictEqual(C.view(g.S, host).tents.map(t => t.stored), [6, 0, 4], 'as outras tendas continuam com o que tinham');
  has('Coletou: +2 pedras de forja'); has('role="status"'); assert(log.includes('snd:claim') && log.includes('save'), 'som e gravação');
  assert(H().indexOf('Coletou:') < H().indexOf('class="ac-main"'), 'o aviso fica na linha do alto: nunca em cima do herói nem do botão tocado');
  assert(/data-x="collect" data-t="forge" aria-disabled="true"/.test(H()), 'tenda vazia: Coletar apagado (continua tocável para explicar)');
  def.click(find('collect', { t: 'forge' })); assert.strictEqual(nCollect, 2); has('ainda não juntou nada para coletar.'); has('role="alert"'); assert.deepStrictEqual(C.view(g.S, host).tents.map(t => t.stored), [6, 0, 4]); }
sane('coleta de uma tenda'); out.push('Coletar (uma tenda): 1 chamada ao módulo, só a tenda tocada entrega, aviso com o que entrou; vazia explica');

// 5) Coletar tudo: UMA chamada, entrega o resto e mostra
{ nCollect = 0; const p0 = JSON.stringify(g.S.sys.practice || null); def.click(find('all')); assert.strictEqual(nCollect, 1); assert.strictEqual(host.gold, 6, 'ouro entregue pelo módulo, uma vez');
  assert.notStrictEqual(JSON.stringify(g.S.sys.practice || null), p0); has('Coletou: +6 moedas · +4 pedras de treino'); assert.deepStrictEqual(C.view(g.S, host).tents.map(t => t.stored), [0, 0, 0]);
  def.render(); def.render(); def.tick(); def.tick(); assert.strictEqual(host.gold, 6, 'redesenhar não entrega de novo'); assert.strictEqual(nCollect, 1);
  assert(/data-x="all" aria-disabled="true"/.test(H())); def.click(find('all')); has('As tendas ainda não juntaram nada para coletar.'); assert.strictEqual(host.gold, 6); }
sane('coletar tudo'); out.push('Coletar tudo: 1 chamada ao módulo, ouro e pedras entregues uma vez, aviso com os números');

// 6) enchendo com a tela aberta (tick) e CHEIA
{ hours(1); const h0 = H(); def.tick(); def.tick(); assert.notStrictEqual(H(), h0, 'o tick redesenha quando um número muda'); has('<span>3 / ' + tent('gold').cap + '</span>');
  const h1 = H(); def.tick(); def.tick(); assert.strictEqual(H(), h1, 'sem mudança, não redesenha');
  hours(100); def.render(); const v = C.view(g.S, host); assert(v.tents.every(t => t.full)); assert.strictEqual((H().match(/<b>Cheia<\/b>/g) || []).length, 3); assert.strictEqual((H().match(/class="ac-bar full"/g) || []).length, 3);
  def.click(find('tent', { t: 'practice' })); has('Cheia: colete para voltar a encher.'); def.click(find('close')); not('role="dialog"'); }
sane('cheia'); out.push('tempo: o tick atualiza os números; tenda cheia mostra "Cheia" e a barra dourada');

// 7) melhorar em DOIS toques (gasta ouro): Melhorar não gasta; Confirmar chama o upgrade do módulo UMA vez; Cancelar desfaz
{ host.gold = 1e6; nUp = 0; const cost = C.upgradeCost(g.S, host, 'forge'), eff = Math.round(C.DATA.levelRate * 100);
  def.click(find('tent', { t: 'forge' })); has('role="dialog"'); has('Nível 1 de ' + C.DATA.maxLevel); has('Cada nível dá +' + eff + '% da produção base.'); has('Melhorar para o nível 2: ' + cost + ' de ouro'); not('data-x="upok"'); sane('tenda aberta');
  def.click(find('up', { t: 'forge' })); assert.strictEqual(nUp, 0, 'o primeiro toque não melhora'); assert.strictEqual(host.gold, 1e6); assert.strictEqual(tent('forge').lv, 1);
  has('Gastar ' + cost + ' de ouro para subir do nível 1 para o nível 2?'); has('data-x="upok" data-t="forge"'); has('data-x="upno"'); not('data-x="up"'); sane('confirmação');
  def.click(find('upno')); not('data-x="upok"'); has('data-x="up"'); assert.strictEqual(nUp, 0);
  def.click(btn('upok', { t: 'forge' })); assert.strictEqual(nUp, 0, 'Confirmar sem o primeiro toque não vale'); assert.strictEqual(tent('forge').lv, 1);
  def.click(find('up', { t: 'forge' })); log.length = 0; def.click(find('upok', { t: 'forge' })); assert.strictEqual(nUp, 1, 'UMA chamada ao Sys.camp.upgrade'); assert.strictEqual(tent('forge').lv, 2); assert.strictEqual(host.gold, 1e6 - cost);
  has('Forja do Acampamento no nível 2: gastou ' + cost + ' de ouro.'); has('Nível 2 de ' + C.DATA.maxLevel); assert(log.includes('save')); not('data-x="upok"');
  def.click(btn('upok', { t: 'forge' })); assert.strictEqual(nUp, 1, 'um segundo Confirmar não melhora de novo'); assert.strictEqual(tent('forge').lv, 2);
  // falta ouro: botão apagado, explica, não arma a confirmação
  host.gold = 0; def.render(); assert(/data-x="up" data-t="forge" aria-disabled="true"/.test(H())); has('falta ouro'); def.click(find('up', { t: 'forge' })); has('Falta ouro para melhorar.'); not('data-x="upok"'); assert.strictEqual(nUp, 1);
  // nível máximo: sem botão
  g.S.sys.camp.tents.forge.lv = C.DATA.maxLevel; def.render(); has('Nível máximo: ' + C.DATA.maxLevel + ' de ' + C.DATA.maxLevel + '.'); not('data-x="up"'); sane('nível máximo'); g.S.sys.camp.tents.forge.lv = 2; def.click(find('close')); }
out.push('melhorar: dois toques (Melhorar, Confirmar), 1 chamada ao módulo, custo e efeito do módulo; Cancelar, falta de ouro e nível máximo');

// 8) Tenda do Ouro: FIXA, sem botão de melhorar (o módulo devolve "fixed")
{ host.gold = 1e9; assert.strictEqual(C.canUpgrade(g.S, host, 'gold').reason, 'fixed'); def.click(find('tent', { t: 'gold' })); has('role="dialog"'); has('Tenda fixa'); has('Esta tenda é fixa: não tem melhoria.'); not('data-x="up"'); not('data-x="upok"'); sane('Tenda do Ouro');
  X.arm = 'gold'; def.click(btn('upok', { t: 'gold' })); assert.strictEqual(tent('gold').lv, 1, 'mesmo forçando, o módulo recusa'); has('Esta tenda é fixa'); def.click(btn('up', { t: 'gold' })); not('data-x="upok"'); def.click(find('close')); host.gold = 0; }
out.push('Tenda do Ouro: mostra que é fixa, sem botão de melhorar');

// 9) pets parados: pôr e tirar pela tela (assign/unassign do módulo); o principal não aparece na lista
{ const o = P.ensure(g.S); o.owned.wolf = { stars: 1, frags: 0, lvl: 1 }; o.owned.drake = { stars: 3, frags: 0, lvl: 1 }; o.owned.golem = { stars: 1, frags: 0, lvl: 1 }; o.eq = 'wolf'; P.ensure(g.S);
  def.click(find('tent', { t: 'practice' })); has('Pets na tenda: 0 de ' + C.DATA.petSlots); assert(find('pet', { t: 'practice', p: 'drake' }) && find('pet', { t: 'practice', p: 'golem' })); assert(!find('pet', { p: 'wolf' }), 'o principal não trabalha');
  const r0 = C.rate(g.S, host, 'practice'), bo = Math.round(C.petBoost(g.S, 'drake') * 100); has('+' + bo + '% na tenda'); sane('lista de pets');
  def.click(find('pet', { t: 'practice', p: 'drake' })); assert.deepStrictEqual(g.S.sys.camp.tents.practice.pets, ['drake']); assert(C.rate(g.S, host, 'practice') > r0); has('Pets na tenda: 1 de ' + C.DATA.petSlots); has('class="ac-pw"'); has('foi trabalhar: +' + bo + '% na tenda.');
  assert(find('unpet', { p: 'drake' })); assert(!find('pet', { p: 'drake' }), 'pet ocupado sai da lista'); sane('pet na tenda');
  def.click(find('pet', { t: 'practice', p: 'golem' })); assert.strictEqual(g.S.sys.camp.tents.practice.pets.length, 2); assert(!find('pet'), 'tenda sem vaga: não oferece pet');
  def.click(btn('pet', { t: 'forge', p: 'wolf' })); has('Esse pet não pode trabalhar'); assert.deepStrictEqual(g.S.sys.camp.tents.forge.pets, []);
  def.click(find('unpet', { p: 'drake' })); def.click(find('unpet', { p: 'golem' })); assert.deepStrictEqual(g.S.sys.camp.tents.practice.pets, []); has('saiu da tenda.'); not('class="ac-pw"'); def.click(find('close')); }
out.push('pets: pôr e tirar pelo Sys.camp.assign/unassign, ajuda de cada pet pelo petBoost, o principal fica fora');

// 10) textos escapados (nome de tenda e de pet com HTML) e tenda sem arte = desenho de reserva em SVG
{ const d = C.DATA.tents.find(t => t.id === 'forge'), n0 = d.name, pd = P.DATA.pets.find(p => p.id === 'drake'), pn0 = pd.name, a0 = g.PCamp.ART_IMG.forge;
  d.name = 'Forja <b>"x"</b> & Cia'; pd.name = '<i>Drago</i>'; g.PCamp.ART_IMG.forge = '';
  try { open(); has('Forja &lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; Cia'); not('<b>"x"</b>'); has('<svg class="ac-tart"'); not('src="assets/ui/camp/tent_forge.png"'); has('class="ac-sign lil"'); has('class="ac-sign lil under"');
    def.click(find('tent', { t: 'forge' })); has('&lt;i&gt;Drago&lt;/i&gt;'); not('<i>Drago</i>'); sane('escapado'); def.click(find('close')); }
  finally { d.name = n0; pd.name = pn0; g.PCamp.ART_IMG.forge = a0; } }
out.push('textos escapados (tenda e pet); tenda sem arte cai no desenho de reserva em SVG');

// 11) tela baixa (320 x 480): mesma tela, arte menor; todos os botões: tocar em cada um não gera exceção
{ dims = { H: 480, Wb: 320, real: true }; open(); has('class="ac sm"'); sane('tela baixa'); dims = { H: 560, Wb: 320, real: true };
  let taps = 0; const tapAll = () => { const n = buttons().length; for (let i = 0; i < n; i++) { const b = buttons()[i]; if (!b) break; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane('toque ' + b.dataset.x); if (H().includes('role="dialog"') && b.dataset.x !== 'tent') { /* segue na janela */ } } };
  host.gold = 1e7; hours(3); open(); tapAll(); for (const id of ['gold', 'forge', 'practice']) { open(); def.click(btn('tent', { t: id })); tapAll(); }
  def.click(btn('tent', { t: 'nada' })); def.click(btn('collect', { t: 'nada' })); def.click(btn('pet', { t: 'gold', p: 'nada' })); def.click(btn('unpet', { p: 'nada' })); def.click({}); sane('toques tortos');
  def.tick(); def.onClose(); out.push('toques: ' + taps + ' botões tocados sem exceção (cena e as 3 janelas de tenda); toques com id errado não quebram'); }

// 12) toda imagem citada existe em disco
for (const u of Object.values(g.PCamp.ART_IMG)) if (u) imgs.add(u);
for (const u of imgs) assert(fs.existsSync(path.join(R, u)), 'imagem citada não existe: ' + u);
out.push('imagens: ' + imgs.size + ' citadas, todas em disco');
} finally { C.setOn(false); C.collect = collect0; C.upgrade = upgrade0; }
assert.strictEqual(C.DATA.on, false, 'o teste devolve o módulo desligado');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
