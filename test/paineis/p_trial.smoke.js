'use strict';
// Teste de fumaça do js/p_trial.js (PROVAÇÃO DO MESTRE) em Node: DOM de mentira, módulos REAIS de js/sys (level, forge, pet, mentors, trial) ligados só na memória.
// Rodar: node test/paineis/p_trial.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
['level', 'forge', 'pet', 'mentors', 'trial'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, T = Sys.trial, LV = Sys.level;
assert.strictEqual(T.DATA.on, false, 'o módulo nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = tag => { const e = { tag, id: '', children: [], style: {}, dataset: {}, className: '', _h: '', textContent: '', listeners: {}, parentNode: null, offsetHeight: 24,
  setAttribute() {}, addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const head = mkEl('head'), fbw = mkEl('div'), els = {};
g.document = { head, body: mkEl('body'), createElement: t => mkEl(t), getElementById: id => (id === 'fb_w' ? fbw : els[id] || null) };

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
const host = makeHost({ seed: 3, stage: 25, eraMax: 2 }); Sys.host = host;
const newSave = (lvl, xp) => ({ gold: 0, sys: { level: { lvl: lvl || 1, xp: xp || 0 } }, stage: 25 });
g.S = newSave(5); g.V = { innerHTML: '' }; g.view = 'trial'; g.PANEL_ON = {};
g.xDims = () => ({ H: 704, Wb: 390 }); g.xWrap = (d, c, i) => i; g.kf = v => 'k' + Math.round(v); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.ERAS = ['Pré-História', 'Antiguidade', 'Medieval', 'Pólvora', 'Industrial', 'Moderna', 'Futurista', 'Submundo', 'Celestial'].map(n => ({ n }));
g.STAGES_PER_ERA = 10; g.eraOf = st => Math.floor((st - 1) / 10);
g.xEraBgUrl = () => 'assets/bg/era2.png'; g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.7),rgba(13,10,8,.9)),url(assets/bg/era2.png) center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.statsChanged = () => log.push('stats'); g.setView = v => log.push('view:' + v);
const gateSeen = []; g.xGate = u => { gateSeen.push(u.slice()); return false; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; const opened = [];
g.Panels = { defs: {}, add(n, d) { addName = n; def = d; d.name = n; this.defs[n] = d; return d; }, on(n) { return !!g.PANEL_ON[n] && !!this.defs[n]; },
  open(n, o) { opened.push([n, o || {}]); if (n !== 'trial') return true; if (!this.on(n)) return false; def.onOpen(o || {}); def.render(); return true; } };

const SRC = fs.readFileSync(path.join(R, 'js/p_trial.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_trial.js' });
const P = g.PTrial, X = P.state, out = [], imgs = new Set();
const CSS = head.children.map(c => c.textContent).join('\n');
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s + '\n' + H()), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = h => ((h == null ? H() : h).match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const tap = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const clean = (h, what) => { assert(!/\p{Extended_Pictographic}/u.test(h), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(h), what + ': texto quebrado: ' + (h.match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/\.\.\.|…/.test(h), what + ': reticências'); assert(!/comprar|compra\b|sorte|R\$|preço|só hoje|última chance|oferta/i.test(h), what + ': texto proibido (jogo com menores)');
  for (const m of h.matchAll(/src="([^"]+)"/g)) imgs.add(un(m[1])); for (const m of h.matchAll(/url\(([^)]+)\)/g)) imgs.add(m[1]); };
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto: ' + b.tag); }
  clean(H(), what); for (const u of P.urls()) imgs.add(u); return bt.length; };
const open = o => { def.onOpen(o || {}); def.render(); };
/* conta as chamadas ao módulo (o módulo de verdade continua respondendo) */
let starts = [], fins = []; const start0 = T.start, finish0 = T.finish;
T.start = function (S, h, l) { starts.push(l); return start0.apply(this, arguments); }; T.finish = function (S, h, r) { fins.push(r); return finish0.apply(this, arguments); };
let specs = []; const hook = sp => { specs.push(sp); return true; };

try {
// 0) registro: painel 'trial', chave nasce DESLIGADA; o arquivo não liga chave, não usa diálogo do navegador, não tem emoji nem reticências
assert.strictEqual(addName, 'trial'); assert.strictEqual(g.PANEL_ON.trial, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.busy && def.onOpen && def.onClose);
assert(SRC.includes("if(!('trial' in PANEL_ON)) PANEL_ON.trial=false;"));
assert(!/\.on\s*=\s*true|setOn\s*\(|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/\.\.\.|…|text-overflow\s*:\s*ellipsis/.test(SRC), 'sem reticências (nem no CSS)'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/gateXp|addXp|addGold|addStones\s*\(|addFood\s*\(|\.passed\[|\.bank\s*=/.test(SRC.replace(/\/\*[\s\S]*?\*\//g, '')), 'a tela não entrega prêmio nem mexe no teto: só o módulo');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^'+]+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
{ const code = SRC.replace(/\/\*[\s\S]*?\*\//g, ''); for (const r of T.DATA.rules) { assert(!code.includes("'" + r.name + "'") && !code.includes(r.text), 'regra copiada no código: ' + r.name); }
  for (const m of Sys.mentors.DATA.list) assert(!code.includes(m.name) && !code.includes(m.role), 'mestre copiado no código: ' + m.name);
  for (const l in T.DATA.opens) for (const o of T.DATA.opens[l]) assert(!code.includes(o.name), 'função aberta copiada no código: ' + o.name); }
assert(/\.pt-gold,\.xs \.pt-gold\{[^}]*color:#2a1403/.test(CSS), 'botão dourado: texto escuro, declarado também com .xs');
assert(/\.pt-go,\.xs \.pt-go\{[^}]*color:#0d2410/.test(CSS), 'botão verde: texto escuro, declarado também com .xs');
for (const m of CSS.matchAll(/\.pt-(go|gold|o|sb|tip|seal),\.xs \.pt-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .pt-' + m[1]);
assert.strictEqual([...CSS.matchAll(/\.pt-(go|gold|o|sb|tip|seal),\.xs \.pt-\1\{[^}]*min-height:(\d+)px/g)].length, 6, 'os 6 tipos de botão têm altura mínima');
assert(/\.pt-tg\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(CSS) && /\.pt\{[^}]*overflow:hidden/.test(CSS) && !/white-space:nowrap/.test(CSS.replace(/\.pt-(seal|band)[^{]*\{[^}]*\}/g, '')), 'sem rolagem lateral: grades com minmax e texto que quebra');
out.push('registro: trial desligada, ' + def.actions.length + ' ações com tratador, sem diálogo, sem emoji, sem reticências, nada do módulo copiado no código');

// 1) MÓDULO DESLIGADO: aviso e Voltar; nenhum toque chama o módulo; nada é escrito no save
g.PANEL_ON.trial = true; P.battle = hook; g.S = newSave(10); const snap0 = JSON.stringify(g.S);
open(); has('Provação do Mestre indisponível agora.'); has('role="alert"'); { const bt = buttons(); assert.strictEqual(bt.length, 1); assert.strictEqual(bt[0].dataset.x, 'back'); has('>Voltar<'); } sane('desligado');
tap('go'); tap('retry'); tap('sel', { l: '10' }); tap('tip', { d: 'forge' }); assert.strictEqual(P.start(10), false); assert.deepStrictEqual(P.finish({ won: true, sec: 1 }), { ok: false, reason: 'off' });
assert.strictEqual(starts.length, 0); assert.strictEqual(fins.length, 0, 'desligado: nenhum toque chama o módulo'); assert.strictEqual(specs.length, 0);
def.tick(); assert.strictEqual(P.hudHtml(), '', 'desligado: nada no HUD'); assert.strictEqual(JSON.stringify(g.S), snap0, 'desligado: o save não muda');
tap('back'); assert(log.includes('close'), 'Voltar fecha a tela');
{ const t0 = Sys.trial; delete Sys.trial; open(); has('Provação do Mestre indisponível agora.'); sane('sem módulo'); Sys.trial = t0; }
out.push('módulo desligado ou ausente: aviso + Voltar, nenhum toque chama o módulo, nada no HUD, save intacto');

// 2) LIGADO (só na memória), ABAIXO DO NÍVEL: explica o que falta e mostra a provação que vem, sem o botão de lutar
T.setOn(true); g.S = newSave(5); open();
{ const row = T.view(g.S, host).list[0], m = row.master, ru = row.rule; assert.strictEqual(row.lvl, 10);
  has('Você está no Nv 5. Faltam 5 níveis para a provação do Nv 10.'); has('>' + g.esc2(m.name) + '<'); has(g.esc2(m.role)); has('era Pré-História'); has('>' + g.esc2(ru.name) + '<'); has(g.esc2(ru.text));
  has('PROVAÇÃO DO NV 10 · 1ª DE ' + T.marks().length); has('retrato provisório'); not('data-x="go"'); assert.deepStrictEqual(buttons().map(b => b.dataset.x), ['back']);
  tap('go'); assert.strictEqual(starts.length, 0, 'abaixo do nível: Lutar não existe e o toque não chama o módulo'); sane('abaixo do nível');
  g.S = newSave(9); open(); has('Você está no Nv 9. Falta 1 nível para a provação do Nv 10.'); }
out.push('abaixo do nível: "Faltam N níveis para a provação do Nv 10" com mestre, regra e prêmio do módulo, sem botão de lutar');

// 3) NO TETO: o cartão inteiro com os dados do módulo (mestre, regra, inimigo, prêmio, o que libera, XP guardada)
g.S = newSave(9); LV.addXp(g.S, 100000, host); assert.strictEqual(LV.level(g.S), 10, 'o Sys.level segura no teto'); const bank = T.ensure(g.S).bank; assert(bank > 0 && bank === LV.need(10));
open(); assert(gateSeen.length >= 1 && gateSeen[gateSeen.length - 1].includes('assets/bg/era2.png') && gateSeen[gateSeen.length - 1].includes('assets/enemies/era2_boss.png'), 'pede a carga das imagens antes de desenhar');
{ const v = T.view(g.S, host), row = v.list[0], rw = row.reward, sp = T.spec(10, host);
  has('>' + g.esc2(row.master.name) + '<'); has('>' + g.esc2(row.rule.name) + '<'); has(g.esc2(row.rule.text) + ' Luta de ' + sp.sec + ' s.');
  has('fase mais alta: 3-5'); has('src="assets/enemies/era2_boss.png"'); has('Vida ×' + String(sp.enemy.hpMul).replace('.', ',')); has('e o mesmo dano'); has('Vença antes de <b>1:00</b>');
  has('+' + rw.stat.atkPct + '% ATK'); has('+' + rw.stat.hpPct + '% Vida'); has('>' + g.kf(rw.gold) + '</span>'); has('+' + rw.stones + ' pedras'); has('+' + rw.food + ' ração');
  has('Teto sobe para o <em>Nv 20</em> e a XP guardada volta: <em>' + g.n0(bank) + ' XP</em>.'); assert.deepStrictEqual(rw.opens, []); not('abre ao vencer esta provação');   /* 14/11: nada a prometer */
  has('data-x="go"'); has('>Lutar<'); has('Tentar de novo é grátis'); has('sem limite, sem energia, sem gema'); not('tentativas:'); has('url(assets/bg/era2.png)'); assert.deepStrictEqual(buttons().map(b => b.dataset.x), ['go']); }
sane('no teto');
// nada inventado: mudar o módulo muda a tela (e o texto do módulo sai escapado)
{ const D = T.DATA, k = { hp: D.enemy.hpMul, dm: D.enemy.dmgMul, st: D.reward.stones, nm: D.rules[0].name, tx: D.rules[0].text, sc: D.sec, at: D.stat.atkPct, gm: D.reward.goldMin, ea: D.enemyAt }; D.enemyAt = {};   /* o ajuste por marco (1ª provação 0,85) sai para o teste ver o DATA.enemy na tela */
  D.enemy.hpMul = 1.5; D.enemy.dmgMul = 1.25; D.reward.stones = 7; D.rules[0].name = 'Regra <b>"X"</b>'; D.rules[0].text = 'Texto & novo.'; D.sec = 45; D.stat.atkPct = 2.5; D.reward.goldMin = 9;
  try { open(); has('Vida ×1,5'); has('dano ×1,25'); has('+7 pedras'); has('Regra &lt;b&gt;&quot;X&quot;&lt;/b&gt;'); not('Regra <b>"X"'); has('Texto &amp; novo. Luta de 45 s.'); has('Vença antes de <b>0:45</b>'); has('+2,5% ATK'); has('>' + g.kf(T.rewardOf(10, host).gold) + '</span>'); sane('módulo alterado'); }
  finally { D.enemy.hpMul = k.hp; D.enemy.dmgMul = k.dm; D.reward.stones = k.st; D.rules[0].name = k.nm; D.rules[0].text = k.tx; D.sec = k.sc; D.stat.atkPct = k.at; D.reward.goldMin = k.gm; D.enemyAt = k.ea; } }
{ const F = Sys.forge.addStones; Sys.forge.addStones = null; open(); not(' pedras'); Sys.forge.addStones = F; open(); has(' pedras'); }
{ P.ART.portrait = true; open(); has('<img src="' + T.master(10).portrait + '" alt="">'); not('retrato provisório'); assert(P.urls().includes(T.master(10).portrait), 'com a arte ligada o retrato entra na espera de carga'); P.ART.portrait = false; open(); has('retrato provisório'); }
out.push('no teto: mestre, regra, tempo, inimigo (Vida ×' + String(T.DATA.enemy.hpMul).replace('.', ',') + '), prêmio, o que libera e a XP guardada vêm do módulo; mudar o módulo muda a tela; texto escapado');

// 4) LUTAR sem a ponte da batalha: explica e NÃO chama o módulo (nada gravado)
{ P.battle = null; const s0 = JSON.stringify(g.S); log.length = 0; tap('go'); assert.strictEqual(starts.length, 0, 'sem a batalha ligada: não chama o Sys.trial.start'); assert.strictEqual(JSON.stringify(g.S), s0);
  has('A luta da provação ainda não está ligada nesta versão. Nada foi gasto.'); has('role="alert"'); has('data-x="go"'); sane('sem a ponte'); P.battle = hook; }
out.push('sem PTrial.battle: o Lutar avisa que a luta não está ligada e não chama o módulo');

// 5) LUTAR: UMA chamada ao Sys.trial.start; o spec do módulo vai para a batalha; toques repetidos não chamam de novo
open(); log.length = 0; tap('go');
assert.strictEqual(starts.length, 1, 'start chamado UMA vez'); assert.strictEqual(starts[0], 10); assert.strictEqual(specs.length, 1);
{ const sp = specs[0]; assert.strictEqual(sp.lvl, 10); assert.strictEqual(sp.noPet, true); assert.strictEqual(sp.sec, 60); assert.strictEqual(sp.enemy.kind, 'boss'); assert.strictEqual(sp.enemy.stage, 25); assert.strictEqual(sp.enemy.hpMul, T.DATA.enemyAt[10].hpMul, '1ª provação: fator do marco (0,85)'); assert.strictEqual(sp.enemy.hpMul, T.spec(10, host).enemy.hpMul); assert.strictEqual(sp.master.name, T.master(10).name); }
assert.deepStrictEqual(P.running().lvl, 10); assert(log.includes('stats') || log.includes('save'), 'grava a tentativa'); assert.strictEqual(T.ensure(g.S).tries['10'], 1);
tap('go'); tap('go'); tap('retry'); assert.strictEqual(P.start(10), false); assert.strictEqual(starts.length, 1, 'com a luta em curso o toque não vale');
out.push('Lutar: Sys.trial.start UMA vez, o spec do módulo (sem pet, 60 s, chefe da fase 25) entregue ao PTrial.battle');

// 6) HUD na luta: faixa da regra com o relógio que a batalha passa
assert.strictEqual(P.mount(), true); const hud = fbw.children[fbw.children.length - 1]; assert.strictEqual(hud.id, 'pt_hud'); assert.strictEqual(P.mount(), true); assert.strictEqual(fbw.children.filter(c => c.id === 'pt_hud').length, 1);
assert.strictEqual(hud.innerHTML, '', 'na luta, sem relógio ainda: nem selo nem faixa'); assert.strictEqual(P.time(42.3), true);
assert(hud.innerHTML.includes('class="pt-band"') && hud.innerHTML.includes('>Provação do Mestre<') && hud.innerHTML.includes('<b>' + g.esc2(T.rule(10).name) + '</b>') && hud.innerHTML.includes('>0:43<') && /style="top:122px"/.test(hud.innerHTML), 'faixa da regra abaixo da barra da fase');
assert(!hud.innerHTML.includes('pt-seal'), 'na luta o selo do teto sai'); { const h0 = hud.innerHTML; P.time(42.1); assert.strictEqual(hud.innerHTML, h0, 'mesmo segundo: não redesenha'); P.time(8); assert(hud.innerHTML.includes('tm pt-lil low') && hud.innerHTML.includes('>0:08<')); }
els.wsl_root = mkEl('div'); assert(/style="top:152px"/.test(P.hudHtml()), 'com o selo Fraco contra na tela a faixa desce'); delete els.wsl_root; clean(hud.innerHTML, 'faixa');
out.push('HUD na luta: faixa da regra com o relógio (PTrial.time), abaixo da barra da fase');

// 7) DERROTA: UMA chamada ao Sys.trial.finish; sem custo; resultado com "Tentar de novo grátis" e dicas só de evolução
{ const g0 = host.gold; log.length = 0; opened.length = 0; g.view = 'battle'; const r = P.finish({ won: false, sec: 20 }); g.view = 'trial';
  assert.strictEqual(fins.length, 1, 'finish chamado UMA vez'); assert.deepStrictEqual(fins[0], { won: false, sec: 20 }); assert(r.ok && r.won === false && r.retry === true);
  assert.deepStrictEqual(opened[0], ['trial', { result: true }], 'fora da tela: abre o painel no resultado'); assert.strictEqual(P.running(), null); assert.strictEqual(host.gold, g0, 'derrota sem prêmio e sem custo');
  has('O mestre venceu desta vez'); has(g.esc2(T.master(10).name) + ' ainda segura o teto do Nv 10.'); has('Perder não custa nada. Tentar de novo é grátis e sem limite.'); has('A XP guardada (' + g.n0(bank) + ' XP) continua esperando.');
  has('Fique mais forte'); has('data-d="gear"'); has('data-d="forge"'); not('data-d="pets"'); has('>Tentar de novo grátis<'); assert.deepStrictEqual(buttons().map(b => b.dataset.x), ['tip', 'tip', 'back', 'retry']); sane('derrota');
  assert(!hud.innerHTML.includes('pt-band') && hud.innerHTML.includes('pt-seal'), 'fim da luta: a faixa sai e o selo volta');
  tap('tip', { d: 'gear' }); assert(log.includes('view:gear')); tap('tip', { d: 'forge' }); assert(opened.some(o => o[0] === 'forge')); tap('tip', { d: 'shop' }); assert(!opened.some(o => o[0] === 'shop'), 'dica só leva a tela de evolução');
  g.xUnlocked = id => id !== 'forge'; def.render(); not('data-d="forge"'); delete g.xUnlocked; def.render();
  P.finish({ won: true, sec: 1 }); assert.strictEqual(fins.length, 2); has('O mestre venceu desta vez'); assert.strictEqual(T.passed(g.S, 10), false, 'sem luta em andamento o módulo recusa (none): nada muda'); }
out.push('derrota: Sys.trial.finish UMA vez, nada é cobrado, "Tentar de novo grátis" e dicas só de evolução');

// 8) TENTAR DE NOVO e VENCER FORA DO TEMPO: conta como derrota e a tela diz por quê
tap('retry'); assert.strictEqual(starts.length, 2, 'Tentar de novo: UMA chamada nova ao start'); assert.strictEqual(specs.length, 2); assert.strictEqual(T.ensure(g.S).tries['10'], 2);
{ fins = []; const r = P.finish({ won: true, sec: 75 }); assert.strictEqual(fins.length, 1); assert(r.late === true && r.won === false); has('Passou do tempo'); has('Você venceu depois dos 60 s da regra: conta como derrota.'); has('>Tentar de novo grátis<'); sane('fora do tempo'); }
out.push('vencer fora do tempo: "Passou do tempo", conta como derrota (regra do módulo)');

// 9) VITÓRIA: prêmio entregue pelo módulo UMA vez; teto novo, XP liberada, função aberta; Continuar fecha
tap('retry'); assert.strictEqual(starts.length, 3);
{ fins = []; const g0 = host.gold, st0 = Sys.forge.ensure(g.S).stones, rw = T.rewardOf(10, host); log.length = 0; assert.deepStrictEqual(rw.opens, [], '14/11: a provação não promete abrir função');
  const r = P.finish({ won: true, sec: 31 }); assert.strictEqual(fins.length, 1, 'finish chamado UMA vez'); assert(r.ok && r.won); assert.strictEqual(host.gold, g0 + rw.gold, 'ouro entregue pelo módulo'); assert.strictEqual(Sys.forge.ensure(g.S).stones, st0 + rw.stones);
  assert(log.includes('stats'), 'pede para recalcular e gravar'); assert(log.includes('snd:claim'));
  has('Provação vencida!'); has(g.esc2(T.master(10).name) + ' reconhece a sua força · regra ' + g.esc2(T.rule(10).name)); has('Teto liberado: agora até o Nv ' + r.cap); assert.strictEqual(r.cap, 20);
  has('XP guardada liberada: <em>+' + g.n0(r.released) + ' XP</em>'); assert(r.released > 0); assert.strictEqual(LV.level(g.S), 11); has('você subiu para o <em>Nv 11</em>');
  has('>+' + g.kf(r.reward.gold) + '</span>'); has('+' + r.reward.stones + ' pedras'); has('+' + r.reward.food + ' ração'); has('+' + rw.stat.atkPct + '% ATK'); not('Abriu:'); not('abre ao vencer');
  assert.deepStrictEqual(buttons().map(b => b.dataset.x), ['cont']); sane('vitória'); assert.strictEqual(T.isOpen(g.S, 'bonfireAuto'), true, 'isOpen não tranca nada');
  def.render(); def.render(); def.tick(); assert.strictEqual(host.gold, g0 + rw.gold, 'redesenhar não entrega de novo'); assert.strictEqual(fins.length, 1);
  log.length = 0; tap('cont'); assert(log.includes('close'), 'Continuar volta para o jogo'); assert.strictEqual(X.mode, 'card'); }
out.push('vitória: prêmio do módulo uma vez só, "Teto liberado: agora até o Nv 20", XP guardada liberada, sem prometer função');

// 10) RECUSAS do módulo: a tela mostra o motivo
open(); has('Você está no Nv 11. Faltam 9 níveis para a provação do Nv 20.'); not('data-x="go"');
{ const n = starts.length; assert.strictEqual(P.start(10), false); assert.strictEqual(starts.length, n + 1); has('Você já venceu esta provação.'); has('role="alert"');
  assert.strictEqual(P.start(20), false); has('Você ainda não chegou ao nível desta provação.'); assert.strictEqual(P.start(15), false); has('Este nível não tem provação.');
  const s1 = T.start; T.start = () => { throw new Error('boom'); }; assert.strictEqual(P.start(20), false); T.start = s1; has('Não foi possível começar agora.'); sane('recusas');
  g.S = newSave(10); open(); P.battle = () => false; tap('go'); has('Não foi possível abrir a luta agora. Tente de novo: é grátis.'); assert.strictEqual(P.running(), null); P.battle = () => { throw new Error('boom'); }; tap('go'); has('Não foi possível abrir a luta agora.'); P.battle = hook; }
out.push('recusas (done, level, lvl, erro do módulo, batalha que não abre): mostra o motivo e não deixa luta pendurada na tela');

// 11) SAVE ANTIGO (acima de marcos não vencidos): provações antigas abertas, com escolha; todas vencidas = aviso
g.S = newSave(25); open(); { const v = T.view(g.S, host); assert.strictEqual(v.cap, 30); assert.deepStrictEqual(T.dueList(g.S, host), [10, 20]);
  has('Provações abertas: escolha qual enfrentar'); has('data-x="sel" data-l="10"'); has('data-x="sel" data-l="20"'); has('>' + g.esc2(T.master(10).name) + '<'); not('Teto sobe'); not('XP guardada volta'); sane('save antigo');
  tap('sel', { l: '20' }); has('>' + g.esc2(T.master(20).name) + '<'); has('>' + g.esc2(T.rule(20).name) + '<'); has('Luta de 30 s.'); has('PROVAÇÃO DO NV 20 · 2ª DE'); tap('sel', { l: '40' }); has('>' + g.esc2(T.master(20).name) + '<');
  const n = starts.length; tap('go'); assert.strictEqual(starts.length, n + 1); assert.strictEqual(starts[n], 20, 'luta a provação escolhida'); P.finish({ won: true, sec: 10 }); has('Provação vencida!'); not('Teto liberado'); sane('vitória de provação antiga'); tap('cont');
  for (const l of T.marks()) T.ensure(g.S).passed[String(l)] = 1; open(); has('Todas as provações vencidas.'); has('Bônus para sempre: +' + T.bonus(g.S).atkPct + '% ATK e +' + T.bonus(g.S).hpPct + '% Vida.'); assert.deepStrictEqual(buttons().map(b => b.dataset.x), ['back']); sane('todas vencidas'); }
out.push('save antigo: provações antigas abertas com escolha; todas vencidas: aviso com o bônus do módulo');

// 12) SELO "Teto Nv X" no HUD: no teto mostra a XP guardada; cheio muda de cor; toca e abre a tela; some com a tela ou o módulo desligado
g.S = newSave(9, 0); LV.addXp(g.S, LV.need(9) + 7, host); P.update(true);
assert(hud.innerHTML.includes('data-pt="open"') && hud.innerHTML.includes('>Teto Nv 10<') && hud.innerHTML.includes('>guardada:<') && hud.innerHTML.includes('>7 XP<') && /class="pt-seal"[^>]*style="top:97px"/.test(hud.innerHTML), 'selo do teto embaixo do FC com a XP guardada');
LV.addXp(g.S, 1e6, host); P.update(true); assert(hud.innerHTML.includes('class="pt-seal full"') && hud.innerHTML.includes('cheia: o que passar disso não é guardado') && hud.innerHTML.includes('>' + g.n0(LV.need(10)) + ' XP<'), 'cofre cheio: selo avisa');
clean(hud.innerHTML, 'selo'); for (const b of buttons(hud.innerHTML)) assert.strictEqual(b.dataset.pt, 'open', 'botão do HUD sem ação');
opened.length = 0; hud.listeners.click({ target: { closest: () => ({ dataset: { pt: 'open' } }) } }); assert.deepStrictEqual(opened[0], ['trial', {}], 'o selo abre a Provação'); has('data-x="go"');
{ let reads = 0; const d0 = T.due; T.due = function () { reads++; return d0.apply(this, arguments); }; for (let i = 0; i < 50; i++) P.update(); assert(reads <= 1, 'HUD: leitura espaçada: ' + reads); T.due = d0; }
g.S = newSave(25); P.update(true); assert(hud.innerHTML.includes('>Provação<') && hud.innerHTML.includes('>do Nv 10<') && !hud.innerHTML.includes('Teto'), 'provação antiga aberta sem teto: selo "Provação"');
g.S = newSave(5); P.update(true); assert.strictEqual(hud.innerHTML, '', 'sem provação aberta: nada no HUD');
g.S = newSave(10); P.update(true); assert(hud.innerHTML !== ''); g.PANEL_ON.trial = false; P.update(true); assert.strictEqual(hud.innerHTML, '', 'tela desligada: nada no HUD'); g.PANEL_ON.trial = true;
T.setOn(false); P.update(true); assert.strictEqual(hud.innerHTML, '', 'módulo desligado: nada no HUD'); T.setOn(true);
P.unmount(); assert.strictEqual(fbw.children.filter(c => c.id === 'pt_hud').length, 0);
out.push('HUD: selo "Teto Nv 10" com a XP guardada (cheio avisa), abre a tela, some com a tela ou o módulo desligado');

// 13) todos os botões de todos os estados: tocar não gera exceção; toda imagem citada existe em disco
{ let taps = 0; const states = [() => { g.S = newSave(10); open(); }, () => { g.S = newSave(25); open(); }, () => { g.S = newSave(10); open(); tap('go'); P.finish({ won: false, sec: 5 }); }, () => { g.S = newSave(10); open(); tap('go'); P.finish({ won: true, sec: 5 }); }];
  for (const st of states) { st(); for (const b of buttons()) { st(); try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } clean(H(), 'toque ' + b.dataset.x); } }
  def.onClose(); assert.strictEqual(def.busy(), false); for (const u of Object.values(P.IC)) imgs.add(u); for (let e = 0; e < 9; e++) imgs.add('assets/enemies/era' + e + '_boss.png');
  for (const u of imgs) assert(fs.existsSync(path.join(R, u)), 'imagem citada não existe: ' + u);
  out.push('toques: ' + taps + ' botões tocados sem exceção; imagens: ' + imgs.size + ' citadas, todas em disco'); }
} finally { T.start = start0; T.finish = finish0; T.setOn(false); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
