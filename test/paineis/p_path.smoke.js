'use strict';
// Teste de fumaça do js/p_path.js (CAMINHO DE LUTA com Testar grátis) em Node: DOM de mentira, módulos REAIS de js/sys (path, strikes, affinity, pathtry) ligados só na memória.
// Rodar: node test/paineis/p_path.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = {};
['path', 'strikes', 'affinity', 'pathtry'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, PA = Sys.path, PT = Sys.pathTry, AF = Sys.affinity, DAY = 86400000;
assert.strictEqual(PA.DATA.on, false, 'o Sys.path nasce desligado'); assert.strictEqual(PT.DATA.on, false, 'o Sys.pathTry nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = tag => { const e = { tag, id: '', children: [], style: {}, dataset: {}, className: '', _h: '', textContent: '', appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const head = mkEl('head'); g.document = { head, body: mkEl('body'), createElement: t => mkEl(t), getElementById: () => null };

/* ---------- jogo de mentira ---------- */
const host = makeHost({ seed: 9, level: 12 }); Sys.host = host; const T0 = host.t;
const newSave = () => ({ gold: 0, sys: {} });
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'path'; g.PANEL_ON = {};
g.xDims = () => ({ H: 704, Wb: 390 }); g.xWrap = (d, c, i) => i; g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xEraBgUrl = () => 'assets/bg/era2.png'; g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.7),rgba(13,10,8,.9)),url(assets/bg/era2.png) center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.statsChanged = () => log.push('stats');
const gateSeen = []; g.xGate = u => { gateSeen.push(u.slice()); return false; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; const opened = [];
g.Panels = { defs: {}, add(n, d) { addName = n; def = d; d.name = n; this.defs[n] = d; return d; }, on(n) { return !!g.PANEL_ON[n] && !!this.defs[n]; },
  open(n, o) { opened.push([n, o || {}]); if (!this.on(n)) return false; def.onOpen(o || {}); def.render(); return true; } };

const SRC = fs.readFileSync(path.join(R, 'js/p_path.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_path.js' });
const P = g.PPath, X = P.state, out = [], imgs = new Set();
const CSS = head.children.map(c => c.textContent).join('\n');
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s + '\n' + H()), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const acts = () => buttons().map(b => b.dataset.x + (b.dataset.id ? ':' + b.dataset.id : ''));
const tap = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const clean = what => { const h = H(); assert(!/\p{Extended_Pictographic}/u.test(h), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(h), what + ': texto quebrado: ' + (h.match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/\.\.\.|…/.test(h), what + ': reticências');
  assert(!/comprar|compra\b|sorte|R\$|preço|só hoje|última chance|oferta|gema|diamante|\bpag[ao]|por ouro/i.test(h), what + ': texto proibido (jogo com menores; nunca troca paga)');
  for (const m of h.matchAll(/src="([^"]+)"/g)) imgs.add(un(m[1])); for (const m of h.matchAll(/url\(([^)]+)\)/g)) imgs.add(m[1]); };
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto: ' + b.tag); }
  clean(what); for (const u of P.urls()) imgs.add(u); return bt.length; };
const open = o => { def.onOpen(o || {}); def.render(); };
const chip = (k, v) => g.esc2(Sys.strikes.DATA.name[k] + ' ' + String(v).replace('.', ',') + '%');
/* conta as chamadas aos módulos (os módulos de verdade continuam respondendo) */
let chooses = [], changes = [], starts = [], fins = [], cancels = 0; const o0 = { choose: PA.choose, change: PA.change, start: PT.start, finish: PT.finish, cancel: PT.cancel };
PA.choose = function (S, h, id) { chooses.push(id); return o0.choose.apply(this, arguments); }; PA.change = function (S, h, id) { changes.push(id); return o0.change.apply(this, arguments); };
PT.start = function (S, h, id) { starts.push(id); return o0.start.apply(this, arguments); }; PT.finish = function (S, h, r) { fins.push(r); return o0.finish.apply(this, arguments); };
PT.cancel = function () { cancels++; return o0.cancel.apply(this, arguments); };
let cfgs = []; const hook = c => { cfgs.push(c); return true; };

try {
// 0) registro: painel 'path', chave nasce DESLIGADA; o arquivo não liga chave, não usa diálogo do navegador, não tem emoji nem reticências, não cita imagem
assert.strictEqual(addName, 'path'); assert.strictEqual(g.PANEL_ON.path, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.busy && def.onOpen && def.onClose);
assert(SRC.includes("if(!('path' in PANEL_ON)) PANEL_ON.path=false;"));
assert(!/\.on\s*=\s*true|setOn\s*\(|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/\.\.\.|…|text-overflow\s*:\s*ellipsis|white-space\s*:\s*nowrap/.test(SRC), 'sem reticências e sem texto que não quebra'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/assets\/|\.png|\.jpg|\.webp|new Image/.test(SRC), 'a tela não cita imagem (ícones desenhados no código)');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
{ const code = SRC.replace(/\/\*[\s\S]*?\*\//g, ''); for (const p of PA.DATA.paths) { assert(!code.includes("'" + p.name + "'") && !code.includes(p.desc), 'caminho copiado no código: ' + p.name); }
  assert(!/\.sys\.path\b|\.sys\.pathTry\b|\.wk\s*=|\.changes\b/.test(code), 'a tela não lê nem grava o save do caminho por conta própria');
  assert(!code.includes(PT.DATA.dummy.name), 'nome do boneco copiado no código'); }
assert(/\.pp-gold,\.xs \.pp-gold\{[^}]*color:#2a1403/.test(CSS), 'botão dourado: texto escuro, declarado também com .xs');
assert(/\.pp-g,\.xs \.pp-g\{[^}]*color:#0d2410/.test(CSS), 'botão verde: texto escuro, declarado também com .xs');
assert.strictEqual([...CSS.matchAll(/\.pp-(o|g|gold|off|tt),\.xs \.pp-\1\{[^}]*min-height:(\d+)px/g)].filter(m => +m[2] >= 40).length, 5, 'os 5 tipos de botão têm 40 px ou mais de toque');
assert(/\.pp-cg\{[^}]*repeat\(3,minmax\(0,1fr\)\)/.test(CSS) && /\.pp\{[^}]*overflow:hidden/.test(CSS), 'sem rolagem lateral: grade com minmax(0,1fr)');
out.push('registro: path desligada, ' + def.actions.length + ' ações com tratador, sem diálogo, sem emoji, sem reticências, sem imagem, nenhum caminho copiado no código');

// 1) MÓDULO DESLIGADO: aviso e Voltar; nenhum toque chama módulo; nada é escrito no save (nem pelo ensaio)
g.PANEL_ON.path = true; P.battle = hook; host._level = 40; g.S = newSave(); const snap0 = JSON.stringify(g.S);
open(); has('Caminho de luta indisponível agora.'); has('role="alert"'); assert.deepStrictEqual(acts(), ['back']); has('>Voltar<'); sane('desligado');
tap('pick', { id: 'blade' }); tap('ok'); tap('try', { id: 'blade' }); tap('cmp'); tap('other'); assert.strictEqual(P.tryStart('blade'), false); assert.deepStrictEqual(P.finish({ damage: 10, sec: 60 }), { ok: false, reason: 'off' });
assert.strictEqual(chooses.length + changes.length + starts.length + fins.length, 0, 'desligado: nenhum toque chama os módulos'); def.tick(); assert.strictEqual(JSON.stringify(g.S), snap0, 'desligado: o save não muda');
PT.setOn(true); open(); has('Caminho de luta indisponível agora.'); tap('try', { id: 'blade' }); assert.strictEqual(starts.length, 0, 'ensaio ligado com o caminho desligado: a tela segue fechada'); assert.strictEqual(JSON.stringify(g.S), snap0); PT.setOn(false);
tap('back'); assert(log.includes('close'), 'Voltar fecha a tela');
{ const p0 = Sys.path; delete Sys.path; open(); has('Caminho de luta indisponível agora.'); sane('sem módulo'); Sys.path = p0; }
out.push('módulo desligado ou ausente: aviso + Voltar, nenhum toque chama os módulos, save intacto');

// 2) LIGADO (só na memória), ABAIXO DO NÍVEL: explica o que falta e mostra o que cada caminho dá, sem botões de escolher
PA.setOn(true); host._level = 12; g.S = newSave(); open();
{ const v = PA.view(g.S, host); assert.strictEqual(v.unlocked, false); has('Caminho de luta: libera no Nv ' + v.needLevel); has(g.esc2(v.text)); has('Você está no Nv 12. Faltam 18 níveis para escolher o caminho.');
  for (const p of v.paths) { has('>' + g.esc2(p.name) + '<'); has(g.esc2(p.desc)); } assert.deepStrictEqual(acts(), ['back']); sane('abaixo do nível');
  tap('pick', { id: 'blade' }); assert.strictEqual(chooses.length, 0); has('Libera no Nv 30. Você está no Nv 12.'); has('role="alert"'); tap('ok'); assert.strictEqual(chooses.length, 0);
  host._level = 29; open(); has('Você está no Nv 29. Falta 1 nível para escolher o caminho.'); }
out.push('abaixo do nível: "Faltam N níveis para escolher o caminho", os 3 caminhos à mostra, sem botão de escolher');

// 3) NV 30, SEM ESCOLHA: os caminhos REAIS do módulo com o que cada um dá; nada inventado; texto escapado
host._level = 30; g.S = newSave(); open(); assert(gateSeen.length >= 1 && gateSeen[gateSeen.length - 1].includes('assets/bg/era2.png'), 'pede a carga do fundo antes de desenhar');
{ const v = PA.view(g.S, host); has('Nv 30: escolha seu caminho'); has(g.esc2(v.text)); assert.strictEqual((H().match(/class="pp-pc/g) || []).length, v.paths.length, 'um cartão por caminho do módulo');
  for (const p of v.paths) { has('>' + g.esc2(p.name) + '<'); has(g.esc2(p.desc)); for (const k in p.strikes) has(chip(k, p.strikes[k])); }
  has('Velocidade de ataque +' + PA.DATA.paths[1].stat.aspd + '%'); has('Dano crítico +' + PA.DATA.paths[2].stat.critDmg + '%');
  assert.deepStrictEqual(acts(), ['pick:blade', 'pick:shot', 'pick:arcane'], 'sem o ensaio ligado: só Escolher'); not('Testar grátis'); not('Forte contra'); not('class="pp-pc ch"'); has('url(assets/bg/era2.png)'); sane('nv 30');
  const D = PA.DATA.paths[0], k = { n: D.name, d: D.desc, s: D.strikes }, n0 = Sys.strikes.DATA.name.dodge;
  D.name = 'Lâmina <b>"X"</b>'; D.desc = 'Texto & novo'; D.strikes = { dodge: 12.5 }; Sys.strikes.DATA.name.dodge = 'Desvio';
  try { open(); has('Lâmina &lt;b&gt;&quot;X&quot;&lt;/b&gt;'); not('Lâmina <b>"X"'); has('Texto &amp; novo'); has('Desvio 12,5%'); not(chip('counter', 8)); sane('módulo alterado'); }
  finally { D.name = k.n; D.desc = k.d; D.strikes = k.s; Sys.strikes.DATA.name.dodge = n0; }
  PA.DATA.paths.push({ id: 'novo', name: 'Quarto', style: 'novo', desc: 'Caminho de teste', strikes: {}, stat: { outra: 5 } }); try { open(); has('>Quarto<'); has('outra +5%'); assert.strictEqual((H().match(/class="pp-pc/g) || []).length, 4); sane('caminho novo'); } finally { PA.DATA.paths.pop(); }
  AF.setOn(true); try { open(); const up = Math.round(AF.DATA.weak * 100), dn = Math.round(Math.abs(AF.DATA.resist) * 100); has('Forte contra +' + up + '%'); has('Resistem -' + dn + '%');
    for (const e of AF.DATA.eras) if (e.weak === 'blade' || e.resist === 'blade') has('>' + g.esc2(e.n) + '<'); assert.strictEqual((H().match(/<span>[^<]+<\/span>(?=(<span>[^<]+<\/span>)*<\/span><\/div>)/g) || []).length, AF.DATA.eras.length, 'cada era é fraca contra um estilo'); sane('afinidade'); } finally { AF.setOn(false); } }
out.push('Nv 30: 3 cartões com nome, texto, golpes e atributos do Sys.path (nomes dos golpes do Sys.strikes); mudar o módulo muda a tela; "Forte contra" só com o Sys.affinity ligado');

// 4) TESTAR GRÁTIS: botão em cada caminho (com o ensaio ligado); sem a ponte da batalha explica e NÃO chama o módulo
PT.setOn(true); open();
{ const tv = PT.view(g.S, host); assert.deepStrictEqual(acts(), ['try:blade', 'pick:blade', 'try:shot', 'pick:shot', 'try:arcane', 'pick:arcane']); has('Testar grátis<small>' + PT.DATA.sec + ' s</small>'); has(g.esc2(tv.text)); sane('com ensaio');
  P.battle = null; tap('try', { id: 'blade' }); assert.strictEqual(starts.length, 0, 'sem a batalha ligada: não chama o Sys.pathTry.start'); assert.strictEqual(PT.active(), null); has('O ensaio ainda não está ligado nesta versão. Nada foi gasto.'); has('role="alert"'); sane('sem a ponte'); P.battle = hook; }
// com a ponte: UMA chamada ao start; o cfg do módulo vai para a batalha; toques repetidos não chamam de novo
open(); tap('try', { id: 'blade' }); assert.deepStrictEqual(starts, ['blade'], 'start chamado UMA vez'); assert.strictEqual(cfgs.length, 1);
{ const c = cfgs[0]; assert.strictEqual(c.mode, 'pathTry'); assert.strictEqual(c.path, 'blade'); assert.strictEqual(c.sec, PT.DATA.sec); assert(c.noGold && c.noXp && c.noLoot && c.noProgress && c.noDeath); assert.strictEqual(c.enemy.immortal, true); assert.deepStrictEqual(c.bonus.strikes, PA.DATA.paths[0].strikes); }
assert.deepStrictEqual(P.running(), { id: 'blade' }); assert.strictEqual(PT.active().id, 'blade'); tap('try', { id: 'shot' }); tap('try', { id: 'blade' }); tap('other'); assert.strictEqual(starts.length, 1, 'com o ensaio em curso o toque não vale');
// fim do ensaio: UMA chamada ao finish; nada é ganho; a comparação mostra o que o módulo guarda
{ const s0 = JSON.stringify(g.S.sys.path || null), g0 = host.gold; opened.length = 0; g.view = 'battle'; const r = P.finish({ damage: 60000, sec: 60 }); g.view = 'path';
  assert.strictEqual(fins.length, 1, 'finish chamado UMA vez'); assert.deepStrictEqual(fins[0], { damage: 60000, sec: 60 }); assert(r.ok && r.dps === 1000); assert.deepStrictEqual(opened[0], ['path', { keep: true }], 'fora da tela: abre o painel na comparação');
  assert.strictEqual(host.gold, g0, 'o ensaio não dá nada'); assert.strictEqual(JSON.stringify(g.S.sys.path || null), s0, 'o ensaio não escolhe caminho'); assert.deepStrictEqual(g.S.sys.pathTry.tried, { blade: { n: 1, best: 1000 } }); assert.strictEqual(P.running(), null);
  has('Ensaio de ' + g.esc2(PA.DATA.paths[0].name)); has('Este ensaio: 1.000 dano/s.'); has('O melhor de cada caminho em ' + PT.DATA.sec + ' s contra o ' + g.esc2(PT.DATA.dummy.name) + '.');
  has('<span class="pp-dp pp-lil">1.000</span><small>1 teste</small>'); assert.strictEqual((H().match(/ainda não testou/g) || []).length, 2); not('>melhor<'); has('O ensaio não dá prêmio nem conta progresso.'); has('Testar de novo é grátis e sem limite.');
  assert.deepStrictEqual(acts(), ['try:shot', 'try:arcane', 'other', 'pick:blade']); has('>Testar outro<'); has('>Escolher ' + g.esc2(PA.DATA.paths[0].name) + '<'); sane('comparação 1');
  tap('other'); assert.deepStrictEqual(starts, ['blade', 'shot'], 'Testar outro: o próximo que falta, UMA chamada'); P.finish({ damage: 90000, sec: 60 }); assert.strictEqual(fins.length, 2);
  has('Ensaio de ' + g.esc2(PA.DATA.paths[1].name)); has('<span class="pp-dp pp-lil">1.500</span>'); assert.strictEqual((H().match(/>melhor</g) || []).length, 1, 'o selo "melhor" é o do módulo (um só)');
  { const rows = PT.compare(g.S), top = rows.find(x => x.top); assert.strictEqual(top.id, 'shot'); assert(new RegExp('class="pp-cc cur"><span class="tb">melhor</span>').test(H())); }
  tap('try', { id: 'arcane' }); assert.strictEqual(starts.length, 3); P.finish({ damage: 30000, sec: 60 }); assert.deepStrictEqual(acts(), ['list', 'pick:arcane']); has('>Ver os caminhos<'); not('ainda não testou'); sane('comparação 3');
  tap('list'); assert.strictEqual(X.mode, 'list'); has('seu teste: 1.500 dano/s'); has('seu teste: 500 dano/s'); has('>Comparar os testes<'); sane('lista com testes'); tap('cmp'); has('Comparar os testes'); not('Este ensaio'); sane('comparação pela lista'); tap('list'); }
// sair do ensaio e batalha que não abre: nada guardado, nada pendurado
{ const tr0 = JSON.stringify(g.S.sys.pathTry); tap('try', { id: 'blade' }); assert.strictEqual(PT.active().id, 'blade'); const c0 = cancels; assert.strictEqual(P.cancel(), true); assert.strictEqual(cancels, c0 + 1); assert.strictEqual(PT.active(), null);
  has('Ensaio encerrado: nada foi gasto nem ganho.'); has('role="status"'); assert.strictEqual(JSON.stringify(g.S.sys.pathTry), tr0, 'sair não anota nada'); assert.strictEqual(P.cancel(), false);
  P.battle = () => false; tap('try', { id: 'shot' }); assert.strictEqual(PT.active(), null, 'a batalha não abriu: o ensaio é solto'); has('Não foi possível abrir o ensaio agora. Nada foi gasto.'); P.battle = () => { throw new Error('boom'); }; tap('try', { id: 'shot' }); assert.strictEqual(PT.active(), null); P.battle = hook;
  o0.start.call(PT, g.S, host, 'arcane'); assert(PT.active()); open(); assert.strictEqual(PT.active(), null, 'abrir a tela solta um ensaio pendurado'); const n = starts.length; tap('try', { id: 'arcane' }); assert.strictEqual(starts.length, n + 1); P.cancel(); }
out.push('Testar grátis: Sys.pathTry.start UMA vez e o cfg do módulo para o PPath.battle; fim: Sys.pathTry.finish UMA vez, nada ganho, comparação com o melhor dano/s e o selo "melhor" do módulo; sair não anota');

// 5) ESCOLHER: 1º toque só abre a confirmação; Voltar desfaz; Confirmar chama o Sys.path.choose UMA vez; a 1ª escolha não gasta a troca
open(); tap('pick', { id: 'nao-existe' }); assert.strictEqual(X.mode, 'list'); has('Este caminho não existe.'); assert.strictEqual(chooses.length, 0);
tap('pick', { id: 'blade' }); assert.strictEqual(X.mode, 'confirm'); has('Escolher ' + g.esc2(PA.DATA.paths[0].name) + '?'); has('não mudam'); has('grátis ' + PA.DATA.changesPerWeek + ' vez por semana'); has('Depois de escolher, o Testar grátis fecha.');
assert.deepStrictEqual(acts(), ['no', 'ok']); assert.strictEqual(chooses.length, 0, 'selecionar não grava'); assert.strictEqual(PA.chosen(g.S), null); sane('confirmação');
tap('no'); assert.strictEqual(X.mode, 'list'); tap('ok'); assert.strictEqual(chooses.length, 0, 'Confirmar sem seleção não chama o módulo');
tap('pick', { id: 'blade' }); log.length = 0; tap('ok'); assert.deepStrictEqual(chooses, ['blade'], 'choose chamado UMA vez'); tap('ok'); tap('ok'); assert.strictEqual(chooses.length, 1, 'toques repetidos não chamam de novo'); assert.strictEqual(changes.length, 0);
assert.strictEqual(PA.chosen(g.S), 'blade'); assert(log.includes('stats'), 'pede para recalcular e gravar'); assert.strictEqual(PA.freeLeft(g.S, host), 1, 'a 1ª escolha não gasta a troca');
{ const v = PA.view(g.S, host); has('Caminho escolhido: ' + g.esc2(v.chosenName) + '. O herói continua igual; os golpes mudam.'); has('role="status"'); def.onOpen({}); def.render(); has('Seu caminho: ' + g.esc2(v.chosenName)); has(g.esc2(v.text)); has('class="pp-pc ch"'); has('<em>escolhido</em>');
  assert.deepStrictEqual(acts(), ['pick:shot', 'pick:arcane', 'cmp'], 'depois da escolha: só Trocar nos outros (o ensaio fecha)'); assert.strictEqual((H().match(/>Trocar para este</g) || []).length, 2); not('Testar grátis<'); has('Ensaio fechado depois da escolha. A troca é nesta tela.'); sane('escolhido'); }
out.push('escolher: selecionar > confirmar > Sys.path.choose UMA vez; o escolhido fica em destaque; a 1ª escolha não gasta a troca');

// 6) TROCAR: grátis 1 vez por semana; depois mostra quando volta; nunca oferece outra forma
tap('pick', { id: 'shot' }); assert.strictEqual(X.mode, 'confirm'); has('Trocar para ' + g.esc2(PA.DATA.paths[1].name) + '?'); has('troca grátis desta semana'); has('Você deixa o caminho <em>' + g.esc2(PA.DATA.paths[0].name) + '</em>.'); assert.deepStrictEqual(acts(), ['no', 'ok']); sane('confirmar troca');
tap('ok'); assert.deepStrictEqual(changes, ['shot'], 'change chamado UMA vez'); assert.strictEqual(chooses.length, 1); tap('ok'); assert.strictEqual(changes.length, 1); assert.strictEqual(PA.chosen(g.S), 'shot');
{ const nx = PA.nextFreeChange(g.S, host), w = P.whenTxt(nx); assert(nx > host.t); assert.strictEqual(w, 'segunda-feira, 16/11 (em 4 dias)');
  has('Caminho trocado: agora é ' + g.esc2(PA.DATA.paths[1].name) + '. Próxima troca grátis: ' + w + '.'); def.onOpen({}); def.render(); const v = PA.view(g.S, host); assert.strictEqual(v.freeLeft, 0); has(g.esc2(v.text)); has('Volta <em>' + w + '</em>.');
  assert.strictEqual((H().match(/class="pp-off"[^>]*aria-disabled="true"[^>]*>Troca grátis usada<small>volta segunda-feira, 16\/11 \(em 4 dias\)<\/small>/g) || []).length, 2, 'os outros dois dizem quando a troca volta'); not('>Trocar para este<'); sane('troca usada');
  tap('pick', { id: 'arcane' }); assert.strictEqual(X.mode, 'list'); assert.strictEqual(changes.length, 1, 'troca usada: o toque explica e não chama o módulo'); has('Você já usou a troca grátis desta semana. A próxima volta ' + w + '. Não há outra forma de trocar.'); has('role="alert"'); sane('recusa week');
  tap('pick', { id: 'shot' }); has('Você já está neste caminho.');
  host.t = nx + 3600000; def.onOpen({}); def.render(); assert.strictEqual((H().match(/>Trocar para este</g) || []).length, 2, 'virou a semana: a troca grátis voltou'); not('Troca grátis usada');
  // recusa vinda do módulo com a confirmação aberta (a troca entrou por fora)
  tap('pick', { id: 'arcane' }); assert.strictEqual(X.mode, 'confirm'); assert.strictEqual(o0.change.call(PA, g.S, host, 'blade').ok, true); tap('ok'); assert.strictEqual(changes.length, 2); assert.strictEqual(PA.chosen(g.S), 'blade', 'a recusa não troca');
  has('Você já usou a troca grátis desta semana. A próxima volta ' + P.whenTxt(PA.nextFreeChange(g.S, host)) + '. Não há outra forma de trocar.'); sane('recusa week do módulo'); host.t = T0; }
// recusas chosen / off / erro
{ g.S = newSave(); open(); tap('pick', { id: 'shot' }); o0.choose.call(PA, g.S, host, 'arcane'); const n = chooses.length; tap('ok'); assert.strictEqual(chooses.length, n + 1); has('Você já escolheu um caminho. Para mudar, use a troca grátis da semana.'); assert.strictEqual(PA.chosen(g.S), 'arcane'); sane('recusa chosen');
  g.S = newSave(); open(); tap('pick', { id: 'shot' }); PA.setOn(false); const m = chooses.length; tap('ok'); assert.strictEqual(chooses.length, m, 'desligado no meio: nem chama'); def.render(); has('Caminho de luta indisponível agora.'); PA.setOn(true);
  open(); tap('pick', { id: 'shot' }); const c1 = PA.choose; PA.choose = () => { throw new Error('boom'); }; tap('ok'); PA.choose = c1; has('Não foi possível agora.'); assert.strictEqual(PA.chosen(g.S), null); sane('erro do módulo');
  host._level = 12; open(); tap('try', { id: 'blade' }); has('Libera no Nv 30. Você está no Nv 12.'); host._level = 30; }
out.push('trocar: Sys.path.change UMA vez; troca usada mostra o dia em que volta e nunca oferece outra forma; recusas week, same, chosen, level, id, off e erro com texto claro');

// 7) todos os botões de todos os estados: tocar não gera exceção; toda imagem citada existe em disco
{ let taps = 0; const states = [() => { g.S = newSave(); open(); }, () => { g.S = newSave(); open(); tap('pick', { id: 'blade' }); }, () => { g.S = newSave(); open(); tap('try', { id: 'blade' }); P.finish({ damage: 600, sec: 60 }); },
    () => { g.S = newSave(); o0.choose.call(PA, g.S, host, 'blade'); open(); }];
  for (const st of states) { st(); for (const b of buttons()) { st(); try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } clean('toque ' + b.dataset.x); P.cancel(); } }
  def.tick(); def.onClose(); assert.strictEqual(def.busy(), false); assert(imgs.size >= 1); for (const u of imgs) assert(fs.existsSync(path.join(R, u)), 'imagem citada não existe: ' + u);
  out.push('toques: ' + taps + ' botões tocados sem exceção; imagens: ' + imgs.size + ' citada (o fundo da era), em disco'); }
} finally { Object.assign(PA, { choose: o0.choose, change: o0.change }); Object.assign(PT, { start: o0.start, finish: o0.finish, cancel: o0.cancel }); PA.setOn(false); PT.setOn(false); AF.setOn(false); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
