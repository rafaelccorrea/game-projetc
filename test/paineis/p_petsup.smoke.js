'use strict';
// Teste de fumaça do js/p_petsup.js (PETS DE APOIO + BÔNUS POR TER: faixa da Coleção, principal + 2 encaixes, folha de escolha) em Node.
// Módulos REAIS js/sys/petsupport.js e js/sys/pet.js (com loot, stats, level, fc), ligados só na memória deste teste; DOM de mentira.
// Rodar: node test/paineis/p_petsup.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'stats', 'forge', 'level', 'fc', 'pet', 'petsupport'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, PS = Sys.petSupport, D = PS.DATA, P = Sys.pet, PD = P.DATA;
assert(PS && D && typeof PS.setSupport === 'function' && P && PD, 'Sys.petSupport e Sys.pet carregados');
assert.strictEqual(D.on, false, 'os pets de apoio nascem desligados no jogo');

/* ---------- DOM de mentira ---------- */
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const els = { ps_scroll: mkEl('ps_scroll'), ps_msg: mkEl('ps_msg'), ps_msg2: mkEl('ps_msg2') };
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] && new RegExp('id="' + id + '"').test(H()) ? els[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 7, stage: 31, eraMax: 3, level: 25 }); Sys.host = host;
const realLevel = Sys.level; let LV = 25; Sys.level = Object.assign({}, realLevel, { level: () => LV }); host.level = () => LV;
const v3_0 = PD.v3, v20_0 = PD.v20.on, v17_0 = PD.v17.on; PD.v3 = true; PD.v20.on = true; P.setV17(true);   /* como a tela de Pets V2 roda no jogo */
const newSave = () => ({ sys: {}, hero: 'kael', stage: 31 });
g.S = newSave();
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'petsup';
g.xEraBgUrl = () => 'assets/bg/era1.png';
g.xEraBg = (a, b) => 'linear-gradient(180deg,rgba(13,10,8,' + a + '),rgba(13,10,8,' + b + ')),url(' + g.xEraBgUrl() + ') center top/cover no-repeat,#16110d';
g.xUnlocked = id => id !== 'pet' || LV >= PD.v20.unlockLevel; g.xUnlockLv = () => PD.v20.unlockLevel;   /* a regra do Menu (js/screens.js) */
g.snd = () => {}; let saves = 0, stats = 0; g.save = () => { saves++; }; g.statsChanged = () => { stats++; };
let def = null, addName = ''; g.render = () => def.render();
let closed = 0; g.Screens = { open() { return true; }, close() { closed++; } };
const opened = []; let petsOpens = true;
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true, open(n, o) { opened.push(n + '@' + (o && o.from)); return petsOpens; } };
let gated = []; g.xGate = u => { gated = u.slice(); return false; };

const SRC = fs.readFileSync(path.join(R, 'js/p_petsup.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_petsup.js' });
const CSS = g.document.head.children.map(c => c.textContent).join('');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const tap = (x, o) => def.click(btn(x, o));
const count = re => (H().match(re) || []).length;
const sheet = () => { const i = H().indexOf('class="ps-sh '); return i < 0 ? '' : H().slice(i); };
const msg = () => (/<div id="ps_msg2?" class="ps-msg[^"]*" role="status">([^<]*)<\/div>/.exec(H()) || ['', ''])[1];
const W = (k, fb) => (typeof PS.why === 'function' && PS.why(k)) || fb;   /* se o módulo ganhar why(), o texto vem dele */
const pct = v => (Math.round(v * 100) / 100).toString().replace('.', ',') + '%';
const seenActs = new Set(), seenImgs = new Set();
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]*)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/…|\.\.\./.test(h), tag + ': tem reticências');
  assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|compre|diamante|gema|oferta|pacote|\[VALOR\]/i.test(h), tag + ': preço ou compra');
  assert(!/última chance|ultima chance|só hoje|acaba em|restam \d|corra/i.test(h), tag + ': pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const open = () => { def.onOpen(); def.render(); };
const give = (S, ids, eq) => { const o = P.ensure(S); for (const id of ids) o.owned[id] = { stars: 1, frags: 0, lvl: 20 }; o.first = true; if (eq) o.eq = eq; return o; };
const sup = () => g.S.sys.petSupport.sup;
const spy = () => { const f0 = PS.setSupport; const s = { n: 0, args: [], restore() { PS.setSupport = f0; } }; PS.setSupport = function (S, i, id) { s.n++; s.args.push([i, id]); return f0.apply(this, arguments); }; return s; };

try {
// 0) registro
assert.strictEqual(addName, 'petsup'); assert.strictEqual(g.PANEL_ON.petsup, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|setOn\s*\(|setV17|addEgg|addFragments/.test(SRC), 'o arquivo não liga chave nem entrega pet');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço');
assert(!/text-overflow\s*:\s*ellipsis|…/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/text-overflow\s*:\s*ellipsis/.test(CSS));
assert(/^function psIcon\(id,name,r\)/m.test(SRC), 'os ícones passam por UMA função psIcon');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
{ const has_ = /const PS_HAS=\[([^\]]+)\]/.exec(SRC)[1].split(',').map(s => s.replace(/'/g, '').trim()); for (const sp of has_) for (const f of ['ref', 'mid', 'evo']) assert(fs.existsSync(path.join(R, 'assets/icons/pets/' + sp + '_' + f + '.png')), 'ícone em disco: ' + sp + '_' + f); }
assert(/\.ps-bt,\.xs \.ps-bt\{[^}]*color:#2a1403/.test(CSS), 'botão dourado com texto escuro, também com .xs');
assert(/\.ps-stage\{[^}]*minmax\(0,1\.25fr\) minmax\(0,1fr\) minmax\(0,1fr\)/.test(CSS), 'palco com minmax(0, fr): sem rolagem lateral');
for (const m of CSS.matchAll(/\.ps-(sl|rw|bt),\.xs \.ps-\1\{[^}]*min-height:(\d+)px/g)) assert(+m[2] >= 40, 'toque mínimo de 40 px em .ps-' + m[1]);
assert(/\.ps-root\{--ps-ink:/.test(CSS), 'cores em variáveis no topo do estilo');
out.push('registro: petsup desligada, ' + def.actions.length + ' ações com tratador, psIcon com os ícones de pet que existem em disco, sem diálogo, sem emoji, sem reticências');

// 1) MÓDULO DESLIGADO e ausente
{ give(g.S, ['wolf', 'owl', 'drake'], 'wolf'); const before = JSON.stringify(g.S); open(); has('Os pets de apoio ainda não abriram.'); has('role="alert"'); assert.strictEqual(check('desligado'), 1);
  tap('slot', { i: '0' }); tap('pick', { id: 'owl' }); tap('clear'); tap('pets'); tap('close'); def.tick(); assert.strictEqual(JSON.stringify(g.S), before, 'desligado: nada escreve no save'); assert(!g.S.sys.petSupport); assert.strictEqual(opened.length, 0);
  closed = 0; tap('back'); assert.strictEqual(closed, 1);
  const m0 = Sys.petSupport; Sys.petSupport = null; try { open(); has('Pets de apoio indisponíveis agora.'); assert.strictEqual(check('sem módulo'), 1); tap('slot', { i: '0' }); def.tick(); } finally { Sys.petSupport = m0; } }
out.push('desligado ou sem módulo: aviso com Voltar; nenhum toque escreve no save');

PS.setOn(true);
// 2) TRANCADO POR NÍVEL: diz o nível que falta; abre sozinho quando o nível chega
{ LV = 12; const before = JSON.stringify(g.S); open(); has('Os pets abrem no nível ' + PD.v20.unlockLevel + '.'); assert.strictEqual(check('trancado'), 1); tap('slot', { i: '0' }); tap('pick', { id: 'owl' }); assert.strictEqual(JSON.stringify(g.S), before, 'trancado: nada escreve');
  def.tick(); has('Os pets abrem no nível'); LV = 25; def.tick(); has('Coleção: 3 pets'); }
out.push('trancado por nível: mostra o nível que falta (regra do Menu) e abre sozinho ao chegar');

// 3) VAZIO HONESTO: sem pets; encaixes com cadeado e o que falta
{ g.S = newSave(); open(); has('Coleção: 0 pets'); has('ATQ +0% · Vida +0%'); has('Você ainda não tem pets'); assert.strictEqual(count(/class="ps-sl lock"/g), 2); has('Tenha ' + D.slotNeed[0] + ' pets'); has('Tenha ' + D.slotNeed[1] + ' pets'); has('Você tem 0'); has('Nada à venda.'); check('vazio');
  const before = JSON.stringify(g.S); tap('slot', { i: '0' }); assert.strictEqual(msg(), 'Tenha 2 pets para abrir este espaço'); assert(/class="ps-msg bad"/.test(H())); assert.strictEqual(sheet(), ''); tap('slot', { i: '1' }); assert.strictEqual(msg(), 'Tenha 3 pets para abrir este espaço'); tap('slot', { i: '9' });
  assert.strictEqual(JSON.stringify(g.S), before, 'recusa: save intacto'); check('recusa trancado');
  assert(gated.includes('assets/bg/era1.png'), 'pede a carga do cenário antes de desenhar'); has('url(assets/bg/era1.png)');
  // 2 pets: o 1º espaço abre, o 2º continua trancado; sem principal: aviso
  give(g.S, ['wolf', 'owl']); open(); has('Sem pet principal'); assert.strictEqual(count(/class="ps-sl lock"/g), 1); has('Toque para escolher'); check('2 pets sem principal'); }
out.push('vazio honesto: sem pets, encaixes com cadeado e "Tenha N pets"; recusa com motivo; sem principal avisa');

// 4) LISTA DO MÓDULO: faixa da Coleção, principal, encaixes e candidatos com os números do view
{ g.S = newSave(); give(g.S, ['wolf', 'owl', 'drake', 'golem'], 'wolf'); g.S.sys.camp = { tents: { gold: { pets: ['golem'] } } }; open(); const v = PS.view(g.S);
  assert(v.collection.pct > 0); has('Coleção: 4 pets'); has('ATQ +' + pct(v.collection.pct) + ' · Vida +' + pct(v.collection.pct)); has('Teto de +' + pct(v.collection.cap)); not('(no teto)');
  has('aria-label="Pet principal: Mamute"'); has('Principal: ataca na frente'); assert.strictEqual(count(/data-x="slot"/g), 2); assert.strictEqual(count(/class="ps-sl lock"/g), 0); has('passa ' + Math.round(D.share * 100) + '% do lado de vida dele');
  for (const u of gated) assert(fs.existsSync(path.join(R, u)), 'imagem pedida existe: ' + u); assert(gated.some(u => /assets\/icons\/pets\/era0_mammoth_ref\.png/.test(u)), 'pede a carga do ícone do principal'); check('com pets');
  tap('slot', { i: '0' }); const s = sheet(); assert(s.includes('role="dialog"')); assert.strictEqual((s.match(/data-x="pick"/g) || []).length, v.candidates.length, 'um por candidato do módulo'); assert(!s.includes('data-id="wolf"'), 'o principal não entra na lista');
  for (const c of v.candidates) { assert(s.includes('<b>' + g.esc2(c.name) + '</b>')); assert(s.includes('<em>+' + pct(c.bond) + ' Vida</em>')); }
  assert(/class="ps-rw dim" data-x="pick" data-id="golem"/.test(s), 'pet no acampamento aparece apagado'); assert(s.includes('<small>no acampamento</small>')); assert(!s.includes('data-x="clear"'), 'espaço vazio: sem Tirar'); check('folha'); }
out.push('lista do módulo: Coleção (N pets, ATQ e Vida), principal, 2 encaixes, candidatos com "+x% Vida", acampamento apagado');

// 5) PÔR, TROCAR e TIRAR: setSupport UMA vez por toque; recusas com motivo
{ const sp = spy(); saves = 0; stats = 0; const hp0 = PS.bonus(g.S).petBond;
  try { tap('pick', { id: 'owl' }); assert.strictEqual(sp.n, 1, 'setSupport chamado UMA vez'); assert.deepStrictEqual(sp.args[0], [0, 'owl']); assert.deepStrictEqual(sup(), ['owl', null]); assert(saves >= 1 && stats >= 1, 'grava e avisa que a FC mudou');
    assert.strictEqual(sheet(), '', 'a folha fecha'); assert(msg().startsWith('Esfinge no Apoio 1 · +'), msg()); has('class="ps-sl full"'); const v = PS.view(g.S); has('<small class="ok">+' + pct(v.slots[0].bond) + ' Vida</small>'); assert(PS.bonus(g.S).petBond > hp0, 'o vínculo do apoio entra no bônus'); check('pôs');
    // recusa do módulo: pet no acampamento
    tap('slot', { i: '1' }); const before = JSON.stringify(sup()); tap('pick', { id: 'golem' }); assert.strictEqual(sp.n, 2); assert.strictEqual(msg(), W('camp', 'Este pet está no acampamento. Tire-o da tenda primeiro')); assert(/class="ps-msg bad"/.test(H())); assert.strictEqual(JSON.stringify(sup()), before); assert(sheet(), 'a folha continua aberta na recusa'); check('recusa camp');
    tap('pick', { id: 'wolf' }); assert.strictEqual(msg(), W('main', 'Este é o pet principal: ele já luta na frente')); tap('pick', { id: 'nada' }); assert.strictEqual(msg(), W('pet', 'Você não tem este pet')); assert.strictEqual(JSON.stringify(sup()), before);
    // o pet que já está no outro espaço: troca
    assert(sheet().includes('no Apoio 1: toque para trocar')); tap('pick', { id: 'owl' }); assert.deepStrictEqual(sup(), [null, 'owl'], 'o módulo troca os espaços'); tap('slot', { i: '0' }); tap('pick', { id: 'drake' }); assert.deepStrictEqual(sup(), ['drake', 'owl']);
    // o mesmo pet no mesmo espaço: não chama o módulo
    const n0_ = sp.n; tap('slot', { i: '0' }); assert(sheet().includes('<small>neste espaço</small>')); tap('pick', { id: 'drake' }); assert.strictEqual(sp.n, n0_); assert.strictEqual(msg(), 'Dragão já está neste espaço');
    // tirar
    assert(sheet().includes('data-x="clear">Tirar do Apoio 1<')); tap('clear'); assert.strictEqual(sp.n, n0_ + 1); assert.deepStrictEqual(sp.args[sp.args.length - 1], [0, null]); assert.deepStrictEqual(sup(), [null, 'owl']); assert.strictEqual(msg(), 'Dragão saiu do Apoio 1'); check('tirou');
    tap('slot', { i: '0' }); const n1 = sp.n; tap('clear'); assert.strictEqual(sp.n, n1, 'espaço vazio: não chama o módulo'); assert.strictEqual(msg(), 'Este espaço já está vazio'); tap('close'); assert.strictEqual(sheet(), ''); }
  finally { sp.restore(); } }
out.push('pôr, trocar e tirar: setSupport uma vez por toque, grava e atualiza a FC; recusas (acampamento, principal, pet que não tem) com motivo');

// 6) apoio sem efeito: pet de apoio que entrou no acampamento; principal que não está lutando (trancado no módulo)
{ g.S.sys.camp.tents.gold.pets = ['golem', 'owl']; def.tick(); has('no acampamento: sem efeito'); check('apoio no acampamento'); g.S.sys.camp.tents.gold.pets = ['golem'];
  P.ensure(g.S).eq = null; def.tick(); has('Sem pet principal'); has('sem efeito: precisa do pet principal lutando'); check('sem principal'); P.ensure(g.S).eq = 'wolf'; def.tick(); has('<small class="ok">+'); }
// 7) teto da Coleção e botão da tela de Pets
{ const c0 = D.collection.capPct; D.collection.capPct = 0.2; try { def.render(); has('ATQ +0,2% · Vida +0,2% (no teto)'); check('teto'); } finally { D.collection.capPct = c0; }
  opened.length = 0; tap('pets'); assert.deepStrictEqual(opened, ['pets@petsup']); petsOpens = false; tap('pets'); assert.strictEqual(msg(), 'A tela de Pets abre pelo Menu.'); petsOpens = true; check('pets'); }
out.push('apoio sem efeito diz por quê; teto da Coleção aparece; botão abre a tela de Pets com a volta para cá');

// 8) TEXTO ESCAPADO; reserva de ícone para pet sem arte
{ const d = PD.pets.find(p => p.id === 'owl'), sp_ = PD.v17.species.owl, n0_ = d.name, s0 = d.sprite, n1_ = sp_.name; d.name = sp_.name = '<b>"Esfinge" & cia</b>'; d.sprite = 'sem_arte';
  try { open(); has('&lt;b&gt;&quot;Esfinge&quot; &amp; cia&lt;/b&gt;'); not('<b>"Esfinge"'); tap('slot', { i: '0' }); assert(sheet().includes('&lt;b&gt;&quot;Esfinge&quot;')); assert(/<svg viewBox="0 0 40 40"[^>]*><circle[^>]*><circle[^>]*><text[^>]*>&lt;<\/text>/.test(H()), 'pet sem ícone em disco usa a reserva'); tap('pick', { id: 'owl' }); assert(msg().includes('&lt;b&gt;')); check('escapado'); }
  finally { d.name = n0_; sp_.name = n1_; d.sprite = s0; } tap('close'); }
// 9) tick: pet novo por fora, o aviso some, rolagem; módulo desliga com a tela aberta
{ open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); give(g.S, ['parrot']); def.tick(); has('Coleção: 5 pets');
  els.ps_scroll.scrollTop = 111; tap('slot', { i: '0' }); assert.strictEqual(els.ps_scroll.scrollTop, 111, 'a lista não volta ao topo'); tap('pick', { id: 'wolf' }); assert(msg()); const t0 = Date.now; Date.now = () => t0() + 5000; try { els.ps_msg2.innerHTML = 'x'; def.tick(); assert.strictEqual(els.ps_msg2.innerHTML, '', 'o aviso some sozinho'); } finally { Date.now = t0; } tap('close'); els.ps_scroll.scrollTop = 0;
  D.on = false; def.render(); has('ainda não abriram'); check('desligou aberto'); D.on = true; }
out.push('textos escapados e reserva de ícone; tick redesenha com pet novo; aviso some; rolagem mantida');

// 10) larguras e sem fundo; todos os botões em três situações
{ for (const w of [320, 390]) { dims = { H: 560, Wb: w }; open(); tap('slot', { i: '0' }); check('largura ' + w); tap('close'); } dims = {};
  const b0 = g.xEraBg, u0 = g.xEraBgUrl; delete g.xEraBg; delete g.xEraBgUrl; try { open(); has('background:#16110d'); check('sem xEraBg'); } finally { g.xEraBg = b0; g.xEraBgUrl = u0; }
  let taps = 0; const few = JSON.stringify(g.S), two = newSave(); give(two, ['wolf', 'owl'], 'wolf'); const twoJ = JSON.stringify(two);
  for (const mk of [() => newSave(), () => JSON.parse(twoJ), () => JSON.parse(few)]) { g.S = mk(); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { g.S = mk(); open(); const b = buttons()[i]; def.click(b); taps++; check('toque ' + b.dataset.x);
      if (sheet()) for (const b2 of buttons().filter(q => /ps-rw|ps-bt/.test(q.tag))) { def.click(b2); taps++; check('toque ' + b.dataset.x + ' depois ' + b2.dataset.x); if (!sheet()) break; } } }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('larguras 320 e 390, sem fundo; ' + taps + ' toques sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
def.onClose();
} finally { D.on = false; P.setV17(v17_0); PD.v3 = v3_0; PD.v20.on = v20_0; Sys.level = realLevel; }
assert.strictEqual(D.on, false, 'o teste devolve a chave desligada');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
