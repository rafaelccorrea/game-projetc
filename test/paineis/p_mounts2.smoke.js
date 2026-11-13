'use strict';
// Teste de fumaça do js/p_mounts2.js (MONTARIAS V2) em Node: DOM de mentira, módulos REAIS de js/sys (level, loot, stats, forge, fc, mount, offer)
// e o js/mountfx.js REAL (mountIds, mountFile, mountPrefix, mountStarMax, MOUNT_TBL, MOUNT_REF, MOUNT_AURA).
// Rodar: node test/paineis/p_mounts2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['level', 'loot', 'stats', 'forge', 'fc', 'mount', 'offer'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, MT = Sys.mount, D = MT.DATA;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 236, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
const host = makeHost({ seed: 7, stage: 25, eraMax: 4 });
host.canSpendGold = n => n >= 0 && g.S.gold >= n; host.spendGold = n => { if (!(n >= 0) || g.S.gold < n) return false; g.S.gold -= n; return true; };
host.equipped = () => ({});
Sys.host = host;
const kaiaArt = { pony: true, horse: true };   /* a Kaia só tem folha montada nestas (Sys.assets.mountedArt de mentira) */
Sys.assets = { mountedArt: (h, id) => h === 'kael' || kaiaArt[id] === true };
const newSave = () => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: 'kael', set: {} });
const setLv = n => { Sys.level.ensure(g.S).lvl = n; };
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'mounts2'; g.PANEL_ON = {};
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.RC = ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'];
g.plv = () => Sys.level.level(g.S);
const log = []; g.snd = n => log.push('snd:' + n); g.statsChanged = () => log.push('stats'); g.save = () => log.push('save');
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n) { log.push('open:' + n); return true; } };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

vm.runInThisContext(fs.readFileSync(path.join(R, 'js/mountfx.js'), 'utf8'), { filename: 'mountfx.js' });
const SRC = fs.readFileSync(path.join(R, 'js/p_mounts2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_mounts2.js' });
const X = g.Mounts2.X, out = [];
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const modSrc = D.mounts.reduce((a, m) => a.concat(m.src || []), []).map(g.esc2);   /* textos de origem que são DO MÓDULO (a tela mostra como vêm) */
/* todo <button> tem data-x e a ação está na lista de ações tratadas; sem emoji; sem "undefined"/"NaN"; sem texto proibido escrito pela tela */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  let own = H(); for (const s of modSrc) own = own.split(s).join(''); assert(!/comprar|sorteio/i.test(own), what + ': texto proibido escrito pela tela'); return bt.length; };
const o = () => MT.ensure(g.S);
const idsNow = () => mountIds().map(m => m.id);
const cells = () => (H().match(/data-x="sel"/g) || []).length;

// 0) registro: painel 'mounts2', chave nasce DESLIGADA, nenhuma chave de módulo ligada pelo arquivo
assert.strictEqual(addName, 'mounts2'); assert.strictEqual(g.PANEL_ON.mounts2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/setStarFlat\s*\(|setStars7\s*\(|newOn\s*=(?!=)|newReady\[[^\]]*\]\s*=(?!=)|\.on\s*=\s*true|\.visual\s*=(?!=)|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/comprar|sorteio/i.test(SRC), 'arquivo sem texto proibido');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
out.push('registro: mounts2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji no arquivo');

// 1) módulo desligado = "em breve"; ligado (como o mountBoot do jogo faz), save novo: portão pelo nível e, liberado, a tela inteira SEM montaria
assert.strictEqual(D.on, false); def.onOpen(); def.render(); has('Montarias: em breve'); sane('módulo desligado'); def.click(btn('back')); assert(log.includes('close')); def.click(btn('sel', { id: 'pony' })); assert.strictEqual(X.pv, null);
D.on = true; D.visual = true;
const gate = Sys.level.unlockLevel('mount'); def.onOpen(); def.render(); has('Libera no nível ' + gate); has('data-x="back"'); not('data-x="sel"'); sane('portão');
setLv(60); def.onOpen(); def.render(); const all = idsNow();
assert(all.length >= 7, 'as 7 montarias com arte'); assert.strictEqual(cells(), all.length, 'uma célula por montaria ligada'); has('Nenhuma montaria em uso'); has('PODER (FC)'); has('Montarias <b>0/' + all.length + '</b>'); has('id="m2_stc"'); has('Montado'); has('A pé');
not('USANDO'); not('data-x="lvl"'); assert.strictEqual(X.look, null); assert.deepStrictEqual(o().owned, {}, 'desenhar não cria montaria'); assert.strictEqual(o().eq, null); sane('save novo');
out.push('save novo: "em breve" com o módulo desligado, portão no nível ' + gate + ' e, liberado, ' + all.length + ' montarias na grade sem nenhuma em uso');

// 2) prévia NO herói: tocar numa que o jogador não tem liga a faixa "Prévia: X · Sair" (sem janela por cima) e não mexe no save
MT.addFragments(g.S, 'wolf', 5); const fc0 = Sys.fc.compute(g.S, host);
def.click(btn('sel', { id: 'wolf' })); assert.strictEqual(X.pv, 'wolf'); has('Prévia: Lobo de guerra'); has('<u>Sair</u>'); has('data-x="pvout"'); has('PRÉVIA'); has('você ainda não tem'); has('FC AGORA → COM ELA'); has('Oferta de 1ª compra'); has('5</b> fragmentos guardados'); not('role="dialog"');
assert.deepStrictEqual(X.look, { id: 'wolf', st: 1 }); assert.deepStrictEqual(o().owned, {}, 'a conta da FC da prévia não deixa a montaria no save'); assert.strictEqual(o().stored.wolf, 5, 'fragmentos guardados intactos'); assert.strictEqual(o().eq, null); assert.strictEqual(Sys.fc.compute(g.S, host), fc0);
has('até +' + String(MT.pctOf('wolf', D.maxLvl, D.maxStars)).replace('.', ',') + '%'); sane('prévia');
def.click(btn('lvl')); assert.deepStrictEqual(o().owned, {}, 'subir nível na prévia não faz nada'); def.click(btn('star', { n: '4' })); assert.strictEqual(X.apv, 4); assert.strictEqual(X.look.st, 4); has('Prévia: Lobo de guerra');
def.click(btn('pvout')); assert.strictEqual(X.pv, null); assert.strictEqual(X.apv, null); not('Prévia:'); has('Nenhuma montaria em uso');
def.click(btn('sel', { id: 'wolf' })); assert.strictEqual(X.pv, 'wolf'); def.click(btn('sel', { id: 'wolf' })); assert.strictEqual(X.pv, null, 'tocar de novo na mesma sai da prévia'); def.click(btn('sel', { id: 'naoexiste' })); assert.strictEqual(X.pv, null);
out.push('prévia: liga e desliga (Sair e 2º toque), mostra a origem do módulo e a FC com ela, sem deixar nada no save');

// 3) com montaria: em uso no palco; tocar em outra que o jogador tem EQUIPA pelo módulo; Desfazer volta
MT.add(g.S, host, 'pony'); MT.add(g.S, host, 'horse'); MT.equip(g.S, 'pony'); g.S.gold = 0;
def.onOpen(); def.render(); has('USANDO'); has('Pônei'); has('Montarias <b>2/' + all.length + '</b>'); has('data-x="lvl"'); has('Usando'); assert.deepStrictEqual(X.look, { id: 'pony', st: 1 });
has('ATK e VIDA +' + String(Math.round(MT.pctOf('pony', 1, 1) * 100) / 100).replace('.', ',') + '%'); sane('montaria em uso');
log.length = 0; const fcP = Sys.fc.compute(g.S, host); def.click(btn('sel', { id: 'horse' }));
assert.strictEqual(o().eq, 'horse', 'equipou pelo Sys.mount.equip'); assert(log.includes('stats')); assert(Sys.fc.compute(g.S, host) > fcP, 'a FC mudou com a troca'); has('Cavalo de guerra'); has('data-x="undo"'); has('volta Pônei'); has('FC ANTES → DEPOIS'); assert.deepStrictEqual(X.look, { id: 'horse', st: 1 }); sane('trocou');
log.length = 0; def.click(btn('undo')); assert.strictEqual(o().eq, 'pony'); assert(log.includes('stats')); not('data-x="undo"'); sane('desfez');
MT.equip(g.S, null); def.onOpen(); def.render(); has('Nenhuma montaria em uso'); def.click(btn('sel', { id: 'pony' })); assert.strictEqual(o().eq, 'pony'); has('volta a pé'); def.click(btn('undo')); assert.strictEqual(o().eq, null, 'desfazer da 1ª montada volta a pé'); def.click(btn('sel', { id: 'pony' }));
out.push('equipar: o toque numa montaria do jogador chama o Sys.mount.equip, muda a FC e mostra Desfazer (volta à anterior ou a pé)');

// 4) subir nível: custo e cobrança do módulo; sem ouro e no teto explica e não sobe
def.onOpen(); def.render(); const c1 = MT.upgradeCost(g.S, host, 'pony'); assert(c1.ok && c1.gold > 0); has('aria-disabled="true"'); has('(falta ouro)');
def.click(btn('lvl')); assert.strictEqual(o().owned.pony.lvl, 1); assert(/Falta ouro/.test(X.toast));
g.S.gold = c1.gold * 3; def.render(); has(c1.gold + ' de ouro'); has('NV 1 → 2'); log.length = 0; def.click(btn('lvl'));
assert.strictEqual(o().owned.pony.lvl, 2, 'subiu pelo Sys.mount.upgrade'); assert.strictEqual(g.S.gold, c1.gold * 2, 'cobrou o custo do módulo'); assert(log.includes('stats')); has('Nv 2/' + MT.lvlCap(g.S, host)); has('NV 2'); sane('subiu nível');
o().owned.pony.lvl = MT.lvlCap(g.S, host); g.S.gold = 1e9; def.onOpen(); def.render(); has('teto: jogador Nv ' + (MT.lvlCap(g.S, host) + 1) * 2); const g0 = g.S.gold; def.click(btn('lvl')); assert.strictEqual(g.S.gold, g0); assert.strictEqual(o().owned.pony.lvl, MT.lvlCap(g.S, host)); assert(/Teto/.test(X.toast)); sane('teto');
setLv(200); o().owned.pony.lvl = D.maxLvl; def.render(); has('nível máximo'); def.click(btn('lvl')); assert.strictEqual(o().owned.pony.lvl, D.maxLvl); assert(/máximo/.test(X.toast)); setLv(60); o().owned.pony.lvl = 2;
out.push('subir nível: cobra ' + c1.gold + ' de ouro (custo do módulo) e sobe; sem ouro, no teto do jogador e no nível máximo explica e não cobra');

// 5) estrelas: quem sobe é o módulo (fragmentos); a tela mostra o progresso, a aura do módulo e a prévia da aura por estrela no herói
def.onOpen(); def.render(); has('0/' + D.starCost[0] + ' fragmentos'); has('1 de ' + D.maxStars + ' estrelas'); has(MT.auraOf(1).name); assert.strictEqual((H().match(/data-x="star"/g) || []).length, mountStarMax(), 'um cartão por estrela do módulo');
for (let s = 1; s <= D.maxStars; s++) has(g.esc2(MT.auraOf(s).name));
MT.addFragments(g.S, 'pony', D.starCost[0]); assert.strictEqual(o().owned.pony.stars, 2); def.tick(); has('2 de ' + D.maxStars + ' estrelas'); has('aura: ' + MT.auraOf(2).name); assert.deepStrictEqual(X.look, { id: 'pony', st: 2 }); sane('2 estrelas');
def.click(btn('star', { n: '5' })); assert.strictEqual(X.apv, 5); assert.strictEqual(X.look.st, 5); has('Prévia da aura: 5 estrelas'); has('data-x="pvout"'); has(MT.auraOf(5).name); assert.strictEqual(o().owned.pony.stars, 2, 'a prévia não muda o save'); sane('prévia da aura');
def.click(btn('star', { n: '5' })); assert.strictEqual(X.apv, null, '2º toque sai'); def.click(btn('star', { n: '4' })); def.click(btn('pvout')); assert.strictEqual(X.apv, null); not('Prévia da aura'); def.click(btn('star', { n: '2' })); assert.strictEqual(X.apv, null, 'a estrela atual não é prévia');
not('+2% (Básico)'); D.starFlat.on = true; try { def.render(); has('Cada estrela acima da 1ª soma +' + String(D.starFlat.pct[0]).replace('.', ',') + '%'); } finally { D.starFlat.on = false; }
assert.strictEqual(mountStarMax(), 5); MT.setStars7(true); try { def.render(); assert.strictEqual((H().match(/data-x="star"/g) || []).length, 7, '7 estrelas só com a chave do módulo'); has(MT.auraOf(7).name); sane('7 estrelas'); } finally { MT.setStars7(false); }
def.render(); assert.strictEqual((H().match(/data-x="star"/g) || []).length, 5);
out.push('estrelas: sobem pelo Sys.mount.addFragments e a tela acompanha; aura e % por estrela do módulo; prévia da aura liga e desliga; +% por estrela e 6ª/7ª só com as chaves do módulo');

// 6) palco: o herói é o do jogo (drawHeroFull) MONTADO com {id, stars}, pet não escondido; A pé e herói sem folha montada = montaria parada + herói a pé
els.m2_stc = mkEl('m2_stc'); els.m2_stc.getContext = () => ctx; def.onOpen(); def.render(); assert(raf.length >= 1, 'o palco anima');
const shot = ts => { heroCalls = []; drawn = 0; const f = raf.shift(); f(ts); assert.strictEqual(heroCalls.length, 1, 'um herói por quadro'); const c = heroCalls[0]; assert(c.k > 0 && isFinite(c.k) && isFinite(c.x) && isFinite(c.y)); assert(c.st.pet === undefined, 'o pet não é escondido (o drawHeroFull desenha por último, na frente)'); assert(c.st.weapon === undefined && c.st.wing === undefined, 'arma e asa: as do jogo'); return c.st; };
assert.deepStrictEqual(shot(1000).mount, { id: 'pony', stars: 2 }); assert(drawn > 4, 'chão e luz da aura por código');
def.click(btn('star', { n: '5' })); assert.deepStrictEqual(shot(1100).mount, { id: 'pony', stars: 5 }, 'prévia da aura vai para o herói'); assert(drawn > 30, 'partículas da aura de 5 estrelas'); def.click(btn('pvout'));
def.click(btn('sel', { id: 'griffin' })); assert.deepStrictEqual(shot(1200).mount, { id: 'griffin', stars: 1 }, 'prévia de montaria vai para o herói'); def.click(btn('pvout'));
def.click(btn('mode', { m: 'foot' })); assert.strictEqual(shot(1300).mount, false); has('A pé: a montaria fica parada atrás do herói'); def.click(btn('mode', { m: 'ride' })); assert.deepStrictEqual(shot(1400).mount, { id: 'pony', stars: 2 });
g.S.hero = 'kaia'; def.render(); assert.deepStrictEqual(shot(1500).mount, { id: 'pony', stars: 2 }, 'Kaia monta onde tem folha'); not('ainda não tem arte montada');
def.click(btn('sel', { id: 'wolf' })); assert.strictEqual(mountPrefix('wolf'), null); assert.strictEqual(shot(1600).mount, false, 'herói sem folha montada: a pé, montaria parada atrás'); has('Kaia ainda não tem arte montada em <b>Lobo de guerra</b>'); sane('kaia sem folha'); def.click(btn('pvout')); g.S.hero = 'kael';
g.drawHeroFull = () => { throw new Error('boom'); }; def.render(); raf.shift()(1700); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
def.onClose(); delete els.m2_stc; raf = [];
out.push('palco: drawHeroFull montado com {id, stars} (em uso, prévia de montaria e prévia de aura), pet na frente, A pé e Kaia sem folha a pé com a montaria parada; erro no desenho não derruba a tela');

// 7) só aparece o que o módulo liga: nova desligada nunca; a Fênix só enquanto Sys.mount.live disser que sim
def.onOpen(); def.render(); const ph = D.mounts.find(m => m.id === 'phoenixm'), rp = D.mounts.find(m => m.id === 'raptor');
assert.strictEqual(MT.live(rp), false); not('Raptor'); not('Mecha'); not('Dragão negro'); for (const m of D.mounts) if (!MT.live(m)) not(g.esc2(m.name));
assert.strictEqual(MT.live(ph), true); has('Fênix gigante'); has('assets/icons/mounts/giant_phoenix.png'); def.click(btn('sel', { id: 'phoenixm' })); assert.strictEqual(X.pv, 'phoenixm'); has('Prévia: Fênix gigante'); has(g.esc2(ph.src[0])); has('0/' + ph.hatchFrags + ' fragmentos'); sane('fênix');
const n1 = cells(); D.newReady.phoenixm = false; try { assert.strictEqual(MT.live(ph), false); X.toast = ''; /* o aviso "Prévia: Fênix..." ainda estava na tela */ def.tick(); not('Fênix gigante'); assert.strictEqual(cells(), n1 - 1); assert.strictEqual(X.pv, null, 'a prévia de uma montaria desligada cai'); def.click(btn('sel', { id: 'phoenixm' })); assert.strictEqual(X.pv, null); sane('fênix desligada'); } finally { D.newReady.phoenixm = true; }
def.tick(); has('Fênix gigante'); assert.strictEqual(cells(), n1);
out.push('lista: ' + n1 + ' montarias ligadas; as novas desligadas no módulo não aparecem e a Fênix some e volta com o Sys.mount.live');

// 8) toda imagem citada pela tela existe em disco (ícones da grade, miniatura da faixa e a imagem parada de cada montaria)
const cited = new Set(def.urls()); for (const id of idsNow()) { def.onOpen({ mount: id }); def.render(); for (const m of H().matchAll(/(?:src="|url\()([^")]+)/g)) cited.add(un(m[1])); }
assert(cited.size >= idsNow().length * 2); for (const u of cited) { assert(!/^data:|^https?:/.test(u), 'imagem de fora: ' + u); assert(fs.existsSync(path.join(R, u)), 'imagem que não existe: ' + u); }
for (const id of idsNow()) { assert(cited.has('assets/icons/mounts/' + mountFile(id) + '.png')); assert(cited.has('assets/mounts/' + MOUNT_REF[id].f + '.png')); }
out.push('imagens: ' + cited.size + ' arquivos citados, todos em disco');

// 9) todos os botões: tocar em cada um não gera exceção (sem montaria, com montaria e na prévia)
let taps = 0; const tapAll = (what, prep) => { prep(); def.render(); for (const b of buttons()) { prep(); def.render(); try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane(what + ' / toque ' + b.dataset.x); } };
tapAll('com montaria', () => { MT.equip(g.S, 'pony'); g.S.gold = 1e6; def.onOpen(); });
tapAll('prévia', () => { MT.equip(g.S, 'pony'); def.onOpen({ mount: 'mythic' }); });
g.S = newSave(); setLv(60); tapAll('sem montaria', () => { g.S = newSave(); setLv(60); def.onOpen(); });
def.tick(); def.onClose(); assert.strictEqual(def.busy(), false);
out.push('toques: ' + taps + ' botões tocados sem exceção, tela sempre íntegra');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
