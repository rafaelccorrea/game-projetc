'use strict';
// Teste de fumaça do js/p_vip2.js (CLUBE VIP V2: herói no palco, prêmios com prévia no herói, níveis 0 a 10, tabela acumulada) em Node.
// Módulos REAIS de js/sys (vip, newdrops, appearance, mount, pet, level, buy...); DOM de mentira. Rodar: node test/paineis/p_vip2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'stats', 'level', 'skin', 'appearance', 'mount', 'pet', 'newdrops', 'buy', 'vip'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
g.StageKit = require(path.join(R, 'js/stagekit.js'));
const Sys = g.Sys, VIP = Sys.vip, D = VIP.DATA;
assert(VIP && Sys.newDrops && Sys.appearance && Sys.mount && Sys.pet && Sys.buy, 'módulos de js/sys carregados');

/* ---------- DOM de mentira ---------- */
let drawn = [];
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : k === 'drawImage' ? (im) => { drawn.push(im && im.src); } : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 200, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const canvas = mkEl('v2_cv'), scroll = mkEl('v2_scroll');
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => id === 'v2_cv' ? (/id="v2_cv"/.test(H()) ? canvas : null) : id === 'v2_scroll' ? (/id="v2_scroll"/.test(H()) ? scroll : null) : null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
g.Image = function () { this.complete = true; this.naturalWidth = 4096; this.naturalHeight = 320; this.src = ''; };

/* ---------- o jogo de mentira (só o que a tela chama) ---------- */
const host = makeHost({ seed: 7, stage: 31, eraMax: 3, level: 25 }); Sys.host = host;
const newSave = hero => ({ sys: {}, hero: hero || 'kael', gold: 0, gems: 0, inv: [], eq: {} });
g.S = newSave();
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : '';
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'vip2'; g.HS = 155; let mountedNow = null; g.heroLook = () => ({ mount: mountedNow });
const log = []; g.snd = n => log.push('snd:' + n);
let def = null, addName = ''; g.render = () => def.render();
const opened = []; let closed = 0; g.Screens = { open(n, o) { opened.push(n); g.view = n; return true; }, close() { closed++; } };
g.setView = v => { opened.push('setView:' + v); };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
g.XH = { tab: '' }; g.xUnlocked = id => id === 'gemShop';
let drew = []; g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_vip2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_vip2.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const noPv = () => not('class="v2-who pv"');   // a faixa do palco (os cartões citam a palavra no rótulo de leitura)
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const seenActs = new Set(), seenImgs = new Set();
// toda tela desenhada passa por aqui: botões com ação tratada, zero emoji, nada quebrado, nada de preço nem de "comprar", imagens em disco
function check(tag) {
  const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|\[VALOR\]/i.test(h), tag + ': preço ou "comprar": ' + (/.{30}(R\$|\d\s*reais|comprar).{30}/i.exec(h) || [''])[0]);
  assert(!/sorteio pago|última chance|ultima chance|só hoje|oferta acaba|restam \d/i.test(h), tag + ': pressão de compra');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
// um quadro do palco: devolve o state entregue ao drawHeroFull
function frame() { assert(raf.length >= 1, 'o laço do palco está rodando'); drew = []; drawn = []; const f = raf.shift(); f(1000); assert.strictEqual(drew.length, 1, 'um herói por quadro'); assert(drew[0].k > 0 && isFinite(drew[0].k)); return drew[0].st; }
const open = () => { def.onOpen(); def.render(); };
const setPts = n => { g.S = newSave(g.S.hero); VIP.addPoints(g.S, n); };
// do cabeçalho do nível escolhido para baixo, SEM a grade geral de prêmios (visual do mock B: a grade passou a vir depois do cartão do nível, no cartão de baixo)
const panel = () => H().slice(H().indexOf('class="v2-lvh"')).replace(/<div class="v2-rw"[\s\S]*?<\/div>/, '');

// 0) registro: painel 'vip2', chave nasce DESLIGADA, o arquivo não liga chave nenhuma, sem diálogo do navegador, sem emoji
assert.strictEqual(addName, 'vip2'); assert.strictEqual(g.PANEL_ON.vip2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true|convOn\s*=(?!=)|skinsOn\s*=(?!=)|newReady\[|setLevel\s*\(|addPoints\s*\(/.test(SRC), 'o arquivo não liga chave nem mexe no nível');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/R\$/.test(SRC), 'nenhum preço escrito na tela');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
assert.strictEqual(Sys.buy.DATA.on, false, 'a compra real está desligada no jogo');
// visual do mock B (claro): nenhum texto cortado com reticências; as variáveis de cor ficam no topo do bloco de estilo (contraste não é verificável em node: só a existência)
assert(!/text-overflow\s*:\s*ellipsis/.test(SRC), 'nenhum texto cortado com reticências');
{ const top = (/\.v2-root\{([^}]*)\}/.exec(SRC) || ['', ''])[1]; for (const v of ['--v-bg', '--v-paper', '--v-row', '--v-tile', '--v-line', '--v-gold', '--v-ink', '--v-ink2', '--v-brand', '--v-ok', '--v-lock', '--v-soon']) assert(new RegExp(v + ':#[0-9a-f]{6}').test(top), 'variável de cor ausente: ' + v);
  assert(/color:var\(--v-ink\)/.test(top), 'tela clara: o texto base é escuro'); assert(/\.v2-bt,[^{]*\{[^}]*color:#2a1403/.test(SRC), 'botão dourado com texto escuro'); }
out.push('registro: vip2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji, imagens do arquivo em disco');

// 1) SEM VIP: abre no VIP 1, barra em pontos, 11 níveis, tabela do módulo
open(); has('Sem VIP'); has('sem VIP</span>'); has('id="v2_cv"'); has('Ir para a Loja'); has('nada é cobrado');
{ const P = VIP.progress(g.S); has(g.n0(P.points) + ' de ' + g.n0(P.needTotal) + ' pontos para o VIP 1'); has('aria-valuenow="0"'); }
assert.strictEqual((H().match(/data-x="lv"/g) || []).length, D.maxLevel + 1, 'níveis 0 a ' + D.maxLevel);
assert(/data-l="1" aria-pressed="true"/.test(H()), 'sem VIP abre no VIP 1'); has('Abre no VIP 1'); has('A partir de <em>' + g.n0(D.points[1]));
assert(/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/.test(g.document.head.children.map(c => c.textContent).join('')), 'grade dos níveis com minmax(0,1fr)');
// ordem do mock: trilho dos níveis, palco do herói (com a moldura VIP do nível escolhido), cartão do nível com a barra de pontos, prêmios, botão da Loja
{ const h = H(), at = s => h.indexOf(s), seq = ['class="v2-top"', 'class="v2-stage"', 'class="v2-lvh"', 'Abre no VIP 1', 'role="progressbar"', 'class="v2-rw"', 'Tudo no VIP 1', 'data-x="shop"'];
  for (let i = 0; i < seq.length; i++) assert(at(seq[i]) >= 0 && (!i || at(seq[i - 1]) < at(seq[i])), 'ordem dos blocos do mock: ' + seq[i]);
  assert(/<img class="v2-frame" src="assets\/ui\/frames\/vip1\.png"/.test(h), 'moldura VIP do nível escolhido atrás do herói'); assert(h.indexOf('v2-frame') < h.indexOf('id="v2_cv"'), 'a moldura fica atrás do herói'); }
check('sem VIP'); { const st = frame(); assert(st.t >= 0); assert(st.skin === undefined && st.mount === undefined && st.pet === undefined, 'sem prévia: o herói é o do jogo (skin, montaria e pet do save)'); assert(!drawn.some(u => /aura/.test(u || '')), 'sem VIP: sem aura'); }
out.push('sem VIP: desenha, barra em pontos VIP, ' + (D.maxLevel + 1) + ' níveis, abre no VIP 1');

// 2) VIP 3 e VIP 8 (pontos pelo próprio módulo): nível, barra, selos
setPts(853); assert.strictEqual(VIP.level(g.S), 3); open(); has('>VIP 3</div>'); has('· VIP 3</span>'); has('853 de ' + g.n0(D.points[4]) + ' pontos para o VIP 4'); assert(/data-l="4" aria-pressed="true"/.test(H()), 'VIP 3 abre no VIP 4');
assert(/class="v2-lv got me" data-x="lv" data-l="3"/.test(H()), 'o nível do jogador vem marcado'); has('Faltam <em>' + g.n0(D.points[4] - 853) + ' pontos VIP</em>'); check('VIP 3');
def.click(btn('lv', { l: '2' })); assert(panel().includes('<em>Você tem</em>')); assert(panel().includes('v2-pill on'));
setPts(12480); assert.strictEqual(VIP.level(g.S), 8); open(); has('>VIP 8</div>'); has(g.n0(12480) + ' de ' + g.n0(D.points[9]) + ' pontos para o VIP 9'); check('VIP 8');
{ const mo = Sys.mount.ensure(g.S).owned.phoenixm; assert(mo, 'o módulo entregou a Fênix no VIP 8 (Sys.newDrops)'); assert(/aria-label="Prévia: Fênix gigante, VIP 8, Seu"/.test(H()), 'a Fênix aparece como Seu');
  assert(/aria-label="Prévia: Kael Demônio, VIP 7, Seu"/.test(H()), 'a skin do VIP 7 aparece como Seu'); assert(/Aura VIP dourada, VIP 10, VIP 10"/.test(H()), 'a aura ainda é do VIP 10'); }
setPts(D.points[D.maxLevel]); open(); has('Nível máximo do Clube VIP'); has('aria-valuenow="100"'); assert(/Aura VIP dourada, VIP 10, Ativa"/.test(H())); has('Este é o nível máximo'); check('VIP máximo');
{ frame(); assert(drawn.some(u => /aura13\.png/.test(u || '')), 'VIP com aura: a aura é desenhada atrás do herói'); }
out.push('VIP 3, VIP 8 e VIP 10: nível, barra e selos (Seu, Ativa, VIP n) vindos dos módulos');

// 3) NAVEGAR entre os níveis muda o que é mostrado, e os valores são os do Sys.vip
setPts(853); open(); const seen = new Set(), T = VIP.convTable();
for (let L = 0; L <= D.maxLevel; L++) { def.click(btn('lv', { l: String(L) })); const p = panel(), i = VIP.levelInfo(L); seen.add(p);
  assert(new RegExp('data-l="' + L + '" aria-pressed="true"').test(H()), 'nível ' + L + ' marcado');
  assert(p.includes(L ? '>VIP ' + L + '</b>' : '>Sem VIP</b>')); assert(p.includes(L ? 'Tudo no VIP ' + L : 'Tudo no jogo grátis'));
  if (i.atkPct) assert(p.includes('>+' + i.atkPct + '%<'), 'ATQ e VIDA do nível ' + L); if (i.goldPct) assert(p.includes('>+' + i.goldPct + '%<'), 'Ouro do nível ' + L); if (i.xpPct) assert(p.includes('>+' + i.xpPct + '%<'), 'XP do nível ' + L + ' (separado do ouro)');
  assert(!p.includes('Ouro e XP'), 'ouro e XP em linhas separadas'); assert(p.includes('XP, itens, pedras e ração fora do jogo'), 'o x2 do offline não cita o ouro'); assert.strictEqual(i.frame, false, 'a moldura Ouro não é mais do VIP'); if (i.frameVip) assert(p.includes('>VIP ' + i.frameVip + '<'), 'moldura VIP ' + L + ' vem do frameVip');
  assert(p.includes('>x' + i.offlineMult + '<')); assert(p.includes('>' + i.chestPerDay + '<'));
  for (const c of T) { const nm = g.esc2(c.name.replace(/\s*\(.*$/, '')); assert(p.includes(nm), 'conveniência na tabela: ' + nm); if (!c.values && L === c.vip) assert(p.includes('<em>Abre</em>'), nm + ' abre no VIP ' + L); }
  if (L > 0) assert(p.includes('Abre no VIP ' + L)); else assert(!p.includes('Abre no VIP'));
  check('nível ' + L); }
assert.strictEqual(seen.size, D.maxLevel + 1, 'cada nível mostra um painel diferente');
{ def.click(btn('lv', { l: '5' })); const p = panel(), s2 = D.speeds.find(s => s.speed === 2), s4 = D.speeds.find(s => s.speed === 4);
  assert(p.includes('x2 no nível ' + s2.rules.find(r => r.level).level), 'velocidade grátis vem do DATA.speeds'); assert(p.includes('x2 já · x4 no nível ' + s4.rules[0].level), 'velocidade do VIP 5 vem do DATA.speeds');
  const ar = T.find(c => c.id === 'arenaAdd'); assert(p.includes('>+' + ar.values[5] + '<'), 'valor da conveniência vem do convTable'); const of = T.find(c => c.id === 'offlineH'); assert(p.includes('>' + of.values[5] + ' h<'));
  def.click(btn('lv', { l: '5' })); def.click(btn('lv', { l: '99' })); assert(/data-l="10" aria-pressed="true"/.test(H()), 'nível fora da faixa é preso ao máximo'); }
out.push('níveis 0 a ' + D.maxLevel + ': ' + seen.size + ' painéis diferentes; ATQ, ouro, baús, offline, velocidade e conveniências batem com Sys.vip');

// 4) PRÊMIOS: nível de cada um vem das regras dos módulos; prévia no herói; "em breve" = o módulo não libera
{ setPts(0); open(); const rules = Sys.newDrops.DATA.sources['vip:level'], lvOf = r => { for (let l = 1; l <= D.maxLevel; l++) if (r.when({ level: l })) return l; };
  const vSkin = lvOf(rules.find(r => r.skin)), vMount = lvOf(rules.find(r => r.mount)), vPet = lvOf(rules.find(r => r.pet)), wy = Sys.pet.DATA.pets.find(p => p.id === 'wyvernpet');
  has('Kael Demônio, VIP ' + vSkin + ', VIP ' + vSkin + '"'); has('Fênix gigante, VIP ' + vMount + ', VIP ' + vMount + '"'); assert.strictEqual(Sys.pet.avail(wy, host), false, 'o módulo ainda não libera a Serpe');
  has('aria-label="Serpe infernal, VIP ' + vPet + ', Em breve"'); assert.strictEqual((H().match(/class="v2-rc/g) || []).length, 4, '4 cartões de prêmio');
  const before = JSON.stringify(g.S);
  // skin
  def.click(btn('pv', { id: 'skin:kael_demon' })); has('<span>Prévia: Kael Demônio</span>'); has('data-x="sair"'); has('Skin · raridade Lendário'); has('uma vez, ao chegar no <b>VIP ' + vSkin + '</b>'); not('role="dialog"'); check('prévia skin');
  let st = frame(); assert.strictEqual(st.skin, 'kael_demon', 'a skin vai para o herói'); assert(st.mount === undefined && st.pet === undefined);
  assert(fs.existsSync(path.join(R, 'assets/anim/skins/kael_demon')), 'pasta da skin em disco');
  // montaria
  def.click(btn('pv', { id: 'mount:phoenixm' })); has('<span>Prévia: Fênix gigante</span>'); st = frame(); assert.deepStrictEqual(st.mount, { id: 'phoenixm', stars: 1 }, 'a montaria vai para o herói'); assert(st.skin === undefined); check('prévia montaria');
  for (const h of ['kael', 'kaia']) assert(fs.existsSync(path.join(R, 'assets/anim/mounts/' + h + '_giant_phoenix_idle_body.png')), 'folha montada da Fênix: ' + h);
  // aura (desenhada por código, atrás do herói)
  def.click(btn('pv', { id: 'aura' })); has('<span>Prévia: Aura VIP dourada</span>'); st = frame(); assert(drawn.some(u => /aura13\.png/.test(u || '')), 'a aura é desenhada na prévia'); assert(st.skin === undefined && st.mount === undefined); check('prévia aura');
  // tocar de novo sai; Sair sai
  def.click(btn('pv', { id: 'aura' })); noPv(); frame(); assert(!drawn.some(u => /aura/.test(u || '')));
  def.click(btn('pv', { id: 'skin:kael_demon' })); def.click(btn('sair')); noPv(); assert.strictEqual(frame().skin, undefined);
  // em breve: sem prévia no herói
  def.click(btn('pv', { id: 'pet:wyvernpet' })); has('<span>Em breve: Serpe infernal</span>'); has('Ainda não está no jogo.'); has('>Fechar</button>'); st = frame(); assert(st.pet === undefined && st.skin === undefined && st.mount === undefined, 'em breve: nada vai para o herói'); check('em breve');
  def.click(btn('sair')); def.click(btn('pv', { id: 'nada' })); noPv();
  // o prêmio também aparece no painel do nível dele, com o botão Prévia
  def.click(btn('lv', { l: String(vMount) })); assert(panel().includes('Prêmios do VIP ' + vMount)); assert(/class="v2-bt rose" data-x="pv" data-id="mount:phoenixm"/.test(panel()));
  def.click(btn('lv', { l: String(vPet) })); assert(panel().includes('Serpe infernal')); assert(!/data-id="pet:wyvernpet"/.test(panel()), 'em breve: sem botão de prévia no painel'); assert(panel().includes('Em breve'));
  // Prismático: nível e fragmentos do Sys.pet; só aparece no painel do nível dele; a Revisão 4 do pet está desligada
  const pm = Sys.pet.DATA.v4d.prism.vipMax, pr = Sys.pet.DATA.pets.find(p => p.id === 'prism'); def.click(btn('lv', { l: String(pm.level) }));
  assert(panel().includes(g.n0(pm.frags) + ' dos ' + g.n0(pr.hatchFrags) + ' fragmentos do pet ' + g.esc2(pr.name)), 'fragmentos do Prismático vêm do módulo'); assert.strictEqual(Sys.pet.avail(pr, host), false); assert(!/data-id="prism"/.test(H()), 'Prismático desligado: sem prévia');
  assert(panel().includes('Aura VIP dourada')); check('nível do Prismático');
  assert.strictEqual(JSON.stringify(g.S), before, 'ver prévias e navegar não escreve no save');
  out.push('prêmios: skin (VIP ' + vSkin + '), Fênix (VIP ' + vMount + ') e aura com prévia no herói; Serpe (VIP ' + vPet + ') e Prismático "em breve" pelos módulos; save intacto'); }

// 5) Kaia: a skin do prêmio é a dela
{ g.S = newSave('kaia'); open(); has('Kaia Demônia'); not('Kael Demônio'); has('Kaia · sem VIP'); def.click(btn('pv', { id: 'skin:kaia_demon' })); assert.strictEqual(frame().skin, 'kaia_demon'); check('Kaia');
  def.click(btn('lv', { l: '7' })); assert(panel().includes('corpo padrão da Kaia')); g.S = newSave('kael'); }
out.push('Kaia: o prêmio de skin é a Kaia Demônia');

// 6) LOJA: o botão abre a Loja com a volta marcada; nada de preço nem de "comprar" com a compra desligada (conferido em toda tela pelo check)
{ open(); opened.length = 0; g.XH.tab = ''; g.window.SHOP_RETURN = null; assert.strictEqual((H().match(/data-x="shop"/g) || []).length, 1);
  def.click(btn('shop')); assert.deepStrictEqual(opened, ['shop'], 'abre a Loja pela rota do jogo'); assert.strictEqual(g.window.SHOP_RETURN, 'vip2', 'volta marcada para esta tela'); assert.strictEqual(g.XH.tab, 'gem'); g.view = 'vip2';
  const o0 = g.Screens.open; g.Screens.open = () => false; opened.length = 0; def.click(btn('shop')); assert.deepStrictEqual(opened, ['setView:shop'], 'sem a rota nova, cai no setView'); g.Screens.open = o0; g.window.SHOP_RETURN = null;
  Sys.buy.DATA.on = true; try { def.render(); not('nada é cobrado'); has('Aqui nada se compra'); check('compra ligada (só neste teste)'); } finally { Sys.buy.DATA.on = false; } def.render(); has('nada é cobrado'); }
out.push('Loja: Screens.open("shop") com window.SHOP_RETURN = "vip2"; nenhum preço em reais nem "comprar" em nenhum estado');

// 7) chaves dos módulos: desligadas, a tela acompanha (ligadas e desligadas só na memória deste teste)
{ open(); def.click(btn('lv', { l: '4' })); const nm = g.esc2(T[0].name.replace(/\s*\(.*$/, '')); assert(panel().includes(nm));
  D.convOn = false; try { def.render(); assert(!panel().includes(nm), 'convOn desligada: sem conveniências'); check('sem conveniências'); } finally { D.convOn = true; }
  Sys.newDrops.DATA.on = false; try { def.render(); assert(/Fênix gigante, VIP \d+, Em breve"/.test(H()), 'Sys.newDrops desligado: prêmio em breve'); assert(!/aria-label="Prévia: Fênix/.test(H())); check('newDrops desligado'); } finally { Sys.newDrops.DATA.on = true; }
  const v9 = Sys.level && Sys.level.DATA && Sys.level.DATA.v9; if (v9) { const on0 = v9.on; v9.on = true; try { def.render(); assert(panel().includes('>XP<')); assert(panel().includes('>+' + D.table.xp9[4] + '%<'), 'com a curva v9 o XP vem do DATA.table.xp9'); check('v9'); } finally { v9.on = on0; } }
  def.render(); }
out.push('chaves: convOn, Sys.newDrops.DATA.on e Sys.level v9 mudam a tela sozinhas; a tela não liga nenhuma');

// 8) tick redesenha quando os pontos mudam por fora; montado, o enquadramento muda
{ open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); VIP.addPoints(g.S, 400); def.tick(); has('>VIP 2</div>'); check('tick');
  mountedNow = null; def.render(); const kFoot = (frame(), drew[0].k); mountedNow = { id: 'pony', stars: 1 }; const kRide = (frame(), drew[0].k); assert(kRide < kFoot, 'montado: herói menor para caber'); mountedNow = null; }
// 9) o desenho do jogo falha ou não existe: retrato parado, sem exceção; módulo ausente: aviso com Voltar
{ g.drawHeroFull = () => { throw new Error('boom'); }; open(); has('id="v2_cv"'); const f = raf.shift(); try { f(16); } catch (e) { assert.fail('exceção no laço: ' + e.message); }
  not('id="v2_cv"'); assert(/<img class="v2-still" src="assets\/hero\/avatar\/kael_phase0\.png"/.test(H()), 'reserva: retrato parado'); check('reserva');
  delete g.drawHeroFull; open(); not('id="v2_cv"'); check('sem drawHeroFull'); g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };
  const v0 = Sys.vip; Sys.vip = null; try { open(); has('Clube VIP indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); def.click(btn('lv', { l: '3' })); def.click(btn('shop')); def.tick(); closed = 0; def.click(btn('back')); assert.strictEqual(closed, 1); } finally { Sys.vip = v0; } }
out.push('desenho do jogo com erro ou ausente: retrato parado; Sys.vip ausente: aviso com Voltar; nada lança');
// 10) larguras de 320 e 390 e tela baixa: desenha igual; fechar para o laço
{ for (const w of [320, 390]) { g.xDims = () => ({ H: 560, Wb: w }); open(); def.click(btn('pv', { id: 'aura' })); check('largura ' + w); has('Ir para a Loja'); } g.xDims = () => ({});
  open(); assert(raf.length >= 1); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço'); }
// 11) todos os botões de todos os níveis de VIP: tocar em cada um não gera exceção e a tela continua íntegra
{ let taps = 0; for (const pts of [0, 853, 12480, D.points[D.maxLevel]]) { setPts(pts); open(); const n = buttons().length;
    for (let i = 0; i < n; i++) { open(); const b = buttons()[i]; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } g.view = 'vip2'; check('toque ' + b.dataset.x); } }
  const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('toques: ' + taps + ' botões tocados sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
