'use strict';
// Teste de fumaça do js/p_profile2.js (PERFIL V5: herói no palco, Visual, Coleção, Títulos e Números) em Node.
// Módulos REAIS de js/sys (titles, level, fc, appearance, mount, pet, vip...) e a tabela ERAS real do index.html; DOM de mentira.
// Rodar: node test/paineis/p_profile2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'stats', 'eras', 'level', 'skin', 'appearance', 'mount', 'pet', 'tower', 'titles', 'vip', 'fc'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, T = Sys.titles, A = Sys.appearance, M = Sys.mount, P = Sys.pet; assert(T && A && M && P && Sys.level && Sys.vip && Sys.fc, 'módulos de js/sys carregados');

/* ---------- DOM de mentira ---------- */
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 200, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const canvas = mkEl('p5_cv'), scroll = mkEl('p5_scroll'), input = mkEl('p5_name'); input.value = '';
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => id === 'p5_cv' ? (/id="p5_cv"/.test(H()) ? canvas : null) : id === 'p5_scroll' ? (/id="p5_scroll"/.test(H()) ? scroll : null) : id === 'p5_name' ? (/id="p5_name"/.test(H()) ? input : null) : null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };

/* ---------- o jogo de mentira (só o que a tela chama); a tabela de eras é a REAL ---------- */
const host = makeHost({ seed: 5, stage: 26, eraMax: 2, level: 13 }); Sys.host = host;
const newSave = hero => ({ sys: {}, hero: hero || 'kael', name: '', gold: 0, gems: 0, inv: [], eq: {}, stage: 1, best: 1, wave: 1, eraMax: 0, kills: 0, skins: [] });
g.S = newSave();
{ const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8'), a = html.indexOf('const ERAS=['), b = html.indexOf('const ieraV'); assert(a > 0 && b > a, 'tabela ERAS achada no index.html');
  g.NEXT_ON = true; vm.runInThisContext(html.slice(a, b), { filename: 'index.html#ERAS' }); }
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : '';
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let dims = {}; g.xDims = () => dims; g.xWrap = (d, c, i) => '<div class="xs ' + c + '">' + i + '</div>'; g.view = 'profile2'; g.HS = 155; let bgCalls = 0; g.xEraBg = () => { bgCalls++; return '#16110d'; };
g.heroLook = () => ({ mount: (g.S.sys.mount && g.S.sys.mount.eq) ? { id: g.S.sys.mount.eq } : null });
g.MOUNT_TBL = {}; M.DATA.mounts.forEach(d => { g.MOUNT_TBL[d.id] = 1; }); g.mountPrefix = id => id;
const log = []; g.snd = n => log.push('snd:' + n); let changedN = 0; g.statsChanged = () => { changedN++; };
let def = null, addName = ''; g.render = () => def.render();
const opened = []; let closed = 0; g.Screens = { close() { closed++; } };
g.PANEL_ON = { vip: true, tower: true, pets: true, mounts: true, arena: false };
g.Panels = { defs: {}, v2: { vip: 'vip2' }, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on(n) { return !!g.PANEL_ON[n] && (n === 'profile2' ? !!this.defs[n] : true); }, open(n, o) { if (!this.on(n)) return false; opened.push([n, o && o.from]); return true; } };
let drew = []; const okDraw = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; }; g.drawHeroFull = okDraw;

const SRC = fs.readFileSync(path.join(R, 'js/p_profile2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_profile2.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji: ' + (/.{20}\p{Extended_Pictographic}.{10}/u.exec(h) || [''])[0]); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|sorteio|última chance|só hoje|oferta acaba/i.test(h), tag + ': preço, compra, sorteio ou pressão: ' + (/.{30}(R\$|comprar|sorteio).{30}/i.exec(h) || [''])[0]);
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
function frame() { assert(raf.length >= 1, 'o laço do palco está rodando'); drew = []; const f = raf.shift(); f(1000); assert.strictEqual(drew.length, 1, 'um herói por quadro'); assert(drew[0].k > 0 && isFinite(drew[0].k)); return drew[0].st; }
const open = o => { def.onOpen(o || {}); def.render(); };
const tab = t => def.click(btn('tab', { t }));
const body = () => H().slice(H().indexOf('id="p5_scroll"'));
const idOfMount = n => M.DATA.mounts[n].id, livePets = () => P.DATA.pets.filter(d => P.avail(d, host));
/* save avançado: fase 26, nível 13, 2 montarias, 2 pets, uma skin, títulos que o módulo dá */
function advSave(hero) { const S = newSave(hero); S.name = 'Rafa_13'; S.stage = 26; S.best = 26; S.eraMax = 2; S.kills = 2480; S.playSeconds = 6 * 3600 + 42 * 60; g.S = S;
  Sys.level.ensure(S).lvl = 13; T.ensure(S).bosses = 14; S.sys.tower = { best: 12 };
  const mo = M.ensure(S); for (const i of [0, 1]) mo.owned[idOfMount(i)] = { stars: i + 1, frags: 0, lvl: 1, gold: 0 }; mo.eq = idOfMount(0);
  const po = P.ensure(S), lp = livePets(); for (const d of lp.slice(0, 2)) po.owned[d.id] = { stars: 1, frags: 0, lvl: 1 }; po.eq = lp[0].id; P.ensure(S); M.ensure(S);
  assert.strictEqual(A.grantFixed(S, hero === 'kaia' ? 'kaia_ninja' : 'kael_ninja', { owner: true }).ok, true); T.check(S, host, { silent: true }); return S; }

// 0) registro
assert.strictEqual(addName, 'profile2'); assert.strictEqual(g.PANEL_ON.profile2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
assert(!/PANEL_ON\.\w+\s*=\s*true|\.on\s*=\s*true|grantFixed|addPoints|setLevel/.test(SRC), 'o arquivo não liga chave nem dá item'); assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/ellipsis/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/white-space:nowrap/.test(SRC), 'nenhum texto preso em uma linha'); assert(!/R\$/.test(SRC)); assert(!/\btoast\s*\(/.test(SRC), 'sem aviso flutuante (o aviso fica na faixa abaixo do palco)');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^'+]+\.png)'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
{ const css = g.document.head.children.map(c => c.textContent).join('');
  for (const c of ['p5-stats', 'p5-tabs', 'p5-grid', 'p5-kv']) assert(new RegExp('\\.' + c + '\\{[^}]*minmax\\(0,1fr\\)').test(css), 'grade com minmax(0,1fr): ' + c);
  for (const c of ['p5-bt', 'p5-tab', 'p5-fb', 'p5-vip', 'p5-tit', 'p5-mode button']) { const m = new RegExp('\\.' + c.replace(' ', ' ') + ',\\.xs \\.' + c + '\\{[^}]*min-height:(\\d+)px').exec(css); assert(m && +m[1] >= 40, 'toque de 40 px: ' + c); }
  assert(/\.p5-bt,\.xs \.p5-bt\{[^}]*color:#1c1206/.test(css), 'botão dourado com texto escuro, também com .xs');
  for (const m of css.matchAll(/(?:^|[;{])(?:min-)?width:(\d+)px/g)) assert(+m[1] <= 76, 'largura fixa pequena: ' + m[0]); }
out.push('registro: profile2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo, sem emoji, sem reticências, grades com minmax(0,1fr), toques de 40 px');

// 1) SAVE NOVO: desenha as 4 abas; nome cai no do herói; nada do que o jogo não tem
{ g.S = newSave(); open(); has('id="p5_cv"'); has('>Kael</div>'); has('Sem título'); has('Nível 1'); has('Era 1 · ' + g.esc2(ERAS[0].n)); has('Fase 1'); assert(bgCalls > 0, 'o fundo é o cenário da era (xEraBg)');
  assert.strictEqual((H().match(/role="tab"/g) || []).length, 4); assert(/data-t="vis" aria-selected="true"/.test(H())); not('class="p5-det'); not('class="p5-mode"'); has('Kael (padrão)'); has('Usando');
  not('Trocar nome'); not('Moldura'); not('Copiar'); not('p5-srv'); check('novo: visual'); { const st = frame(); assert(st.skin === undefined && st.mount === undefined && st.pet === undefined, 'sem prévia: o herói é o do save'); }
  for (const t of ['col', 'tit', 'num']) { tab(t); assert(new RegExp('data-t="' + t + '" aria-selected="true"').test(H())); check('novo: ' + t); }
  tab('tit'); assert.strictEqual((H().match(/class="p5-trow/g) || []).length, T.DATA.titles.length, 'todos os títulos do módulo'); not('data-x="feat"'); has('0 de ' + T.DATA.titles.length + ' conquistados');
  out.push('save novo: 4 abas desenham; ' + T.DATA.titles.length + ' títulos do Sys.titles; nada de nome, moldura ou ID que o jogo não informa'); }

// 2) SAVE AVANÇADO, VISUAL: tocou no que tem, trocou pelo módulo; o que falta vira prévia no herói
{ const S = advSave(); changedN = 0; open(); has('>Rafa_13</div>'); has('Nível 13'); has('Era 3 · ' + g.esc2(ERAS[2].n)); has('Fase 26'); has('class="p5-mode"'); check('avançado: visual');
  const m0 = idOfMount(0), m1 = idOfMount(1), lp = livePets(), nSk = A.fixedSkins(S, host).filter(k => k.available).length + 1;
  assert.strictEqual((body().match(/data-k="skin"/g) || []).length, nSk, 'padrão + skins fixas do herói'); assert.strictEqual((body().match(/data-k="mount"/g) || []).length, M.DATA.mounts.filter(d => M.live(d)).length, 'montarias que o módulo diz que existem');
  assert.strictEqual((body().match(/data-k="pet"/g) || []).length, lp.length, 'pets que o módulo libera'); not('Kaia');
  // montaria que tem: equipa pelo Sys.mount
  def.click(btn('it', { k: 'mount', id: m1 })); assert.strictEqual(M.ensure(S).eq, m1, 'Sys.mount.equip trocou a montaria'); assert.strictEqual(changedN, 1, 'statsChanged chamado'); has(g.esc2(M.DATA.mounts[1].name) + ' em uso'); has('class="p5-det"'); has('2 estrelas'); check('equipou montaria');
  def.click(btn('it', { k: 'mount', id: m1 })); assert.strictEqual(changedN, 1, 'tocar no que já está em uso não troca nada');
  // pet que tem
  def.click(btn('it', { k: 'pet', id: lp[1].id })); assert.strictEqual(P.ensure(S).eq, lp[1].id, 'Sys.pet.equip trocou o pet'); assert.strictEqual(changedN, 2); check('equipou pet');
  // skin que tem e volta ao padrão
  def.click(btn('it', { k: 'skin', id: 'kael_ninja' })); assert.strictEqual(A.fixedEquipped(S).id, 'kael_ninja', 'Sys.appearance.equipFixed equipou a skin'); assert.strictEqual(changedN, 3); assert(/<img src="assets\/hero\/avatar\/kael_ninja\.png" alt="">/.test(H()), 'o retrato acompanha a skin'); check('equipou skin');
  def.click(btn('it', { k: 'skin', id: 'default' })); assert.strictEqual(A.fixedEquipped(S), null, 'voltou ao padrão'); assert.strictEqual(changedN, 4);
  // prévia do que falta: vai para o herói, sem mexer no save
  const before = JSON.stringify(S);
  def.click(btn('it', { k: 'skin', id: 'kael_demon' })); has('class="p5-det pv"'); has('Prévia: Kael Demônio'); has('Como ganhar: <b>'); has('data-x="sair"'); not('role="dialog"'); assert.strictEqual(frame().skin, 'kael_demon', 'a skin da prévia vai para o herói'); check('prévia skin');
  const m2 = M.DATA.mounts.filter(d => M.live(d) && !M.ensure(S).owned[d.id])[0]; def.click(btn('it', { k: 'mount', id: m2.id })); { const st = frame(); assert.deepStrictEqual(st.mount, { id: m2.id, stars: 1 }, 'a montaria da prévia vai para o herói'); assert(st.skin === undefined); } has('Prévia: ' + g.esc2(m2.name)); check('prévia montaria');
  def.click(btn('it', { k: 'mount', id: m2.id })); not('class="p5-det pv"'); def.click(btn('it', { k: 'skin', id: 'kael_demon' })); def.click(btn('sair')); not('class="p5-det'); assert.strictEqual(frame().skin, undefined, 'Sair tira a prévia');
  // A pé / Montado
  def.click(btn('mode', { m: 'foot' })); assert.strictEqual(frame().mount, false, 'a pé: o herói desce da montaria'); assert(/data-m="foot" aria-pressed="true"/.test(H())); def.click(btn('mode', { m: 'ride' })); assert.strictEqual(frame().mount, undefined);
  def.click(btn('it', { k: 'skin', id: 'nada' })); def.click(btn('it', { k: 'x', id: 'y' }));
  assert.strictEqual(JSON.stringify(S), before, 'prévias e modo não escrevem no save'); assert.strictEqual(changedN, 4);
  out.push('visual: montaria, pet e skin trocados pelos módulos (Sys.mount.equip, Sys.pet.equip, Sys.appearance.equipFixed) com statsChanged; prévia de skin e de montaria no herói; A pé e Montado; save intacto nas prévias'); }

// 3) TÍTULOS: destacar chama o Sys.titles; Ir leva à tela; filtros
{ const S = advSave(); changedN = 0; open({ tab: 'tit' }); assert(/data-t="tit" aria-selected="true"/.test(H()), 'abre na aba pedida'); const own = T.DATA.titles.filter(t => T.isUnlocked(S, t.id)); assert(own.length >= 2, 'o módulo deu títulos');
  const f0 = T.featured(S), other = own.find(t => t.id !== f0.id); has('class="p5-trow eq"'); has(own.length + ' de ' + T.DATA.titles.length + ' conquistados'); has('em dobro'); has(g.esc2(T.bonusText(f0, T.DATA.featuredMult).split(' · ')[0])); check('títulos');
  def.click(btn('feat', { id: other.id })); assert.strictEqual(T.featured(S).id, other.id, 'Sys.titles.setFeatured trocou o destaque'); assert.strictEqual(changedN, 1); has('Título em destaque: ' + g.esc2(other.name)); assert(new RegExp('<span>' + other.name + '</span></button>').test(H()), 'o destaque aparece na identidade'); check('destacou');
  const locked = T.DATA.titles.find(t => !T.isUnlocked(S, t.id)); def.click(btn('feat', { id: locked.id })); assert.strictEqual(T.featured(S).id, other.id); has('Você ainda não conquistou este título'); assert.strictEqual(changedN, 1);
  has('data-x="go" data-to="tower"'); has('data-x="go" data-to="battle"'); not('data-to="arena"');   // arena desligada neste teste: sem botão
  opened.length = 0; def.click(btn('go', { to: 'tower' })); assert.deepStrictEqual(opened, [['tower', 'profile2']], 'Ir abre a tela com a volta para o Perfil'); closed = 0; def.click(btn('go', { to: 'battle' })); assert.strictEqual(closed, 1); def.click(btn('go', { to: 'nada' }));
  def.click(btn('tf', { f: 'own' })); assert.strictEqual((H().match(/class="p5-trow/g) || []).length, own.length); def.click(btn('tf', { f: 'lock' })); assert.strictEqual((H().match(/class="p5-trow/g) || []).length, T.DATA.titles.length - own.length); check('filtro'); def.click(btn('tf', { f: 'zzz' }));
  { const t = T.DATA.titles.find(q => q.id === 'tow25'), p = T.progress(S, host, t); has(g.n0(p.cur) + '/' + g.n0(p.need)); has('aria-valuenow="' + Math.round(p.frac * 100) + '"'); }
  open({ tab: 'sta' }); assert(/data-t="num" aria-selected="true"/.test(H()), 'o nome de aba da tela de hoje (sta) abre Números');
  out.push('títulos: Destacar chama Sys.titles.setFeatured e statsChanged; bônus, condição e progresso do módulo; Ir abre a tela certa (ou fecha para a batalha); filtros'); }

// 4) COLEÇÃO e NÚMEROS; servidor, ID e VIP só quando o jogo informa
{ const S = advSave(); open({ tab: 'col' }); has('Coleção total'); const lp = livePets(); has('Pets 2/' + lp.length); has('Montarias 2/' + M.DATA.mounts.filter(d => M.live(d)).length); check('coleção');
  def.click(btn('ct', { k: 'mount' })); assert(/data-k="mount" aria-pressed="true"/.test(H())); assert(!/data-x="it" data-k="skin"/.test(body())); def.click(btn('cf', { f: 'own' })); assert.strictEqual((body().match(/data-x="it"/g) || []).length, 2); def.click(btn('cf', { f: 'lock' })); assert(!/p5-eqb/.test(body())); check('coleção filtrada'); def.click(btn('ct', { k: 'zzz' }));
  tab('num'); has(g.n0(2480)); has('>14<'); has('Andar 12'); has('6 h 42 min'); has('>26<'); has('3 de ' + ERAS.length); has(Sys.fc.viewText ? g.esc2(Sys.fc.viewText(Sys.fc.compute(S, host))) : ''); not('Servidor'); not('ID do jogador'); not('Login'); check('números');
  g.realmBadge = () => 'S1 · Nova Era'; Sys.net = { player: () => ({ id: 'S1-48213', linked: ['google'] }) }; let copied = '';
  try { def.render(); has('S1 · Nova Era'); has('p5-srv'); has('ID S1-48213'); has('>Google<'); has('data-x="copy"'); check('conta'); def.click(btn('copy')); has('Seu ID: S1-48213');
    Object.defineProperty(g, 'navigator', { configurable: true, writable: true, value: { clipboard: { writeText: t => { copied = t; return { then(ok) { ok(); } }; } } } }); def.click(btn('copy')); assert.strictEqual(copied, 'S1-48213'); has('ID copiado: S1-48213'); check('copiou'); } finally { delete g.realmBadge; delete Sys.net; try { Object.defineProperty(g, 'navigator', { configurable: true, writable: true, value: {} }); } catch (e) {} }
  // VIP: nível e barra do Sys.vip, sem preço; o chip abre o Clube VIP com a volta para o Perfil
  Sys.vip.addPoints(S, 853); open(); has('Nível ' + Sys.vip.level(S)); has('data-x="vip"'); opened.length = 0; def.click(btn('vip')); assert.deepStrictEqual(opened, [['vip', 'profile2']]); check('vip');
  g.PANEL_ON.vip = false; try { def.render(); not('data-x="vip"'); has('p5-vip'); } finally { g.PANEL_ON.vip = true; }
  out.push('coleção e números: contagens e valores dos módulos; servidor, login e ID só com window.realmBadge e Sys.net.player; Copiar; chip do VIP abre o Clube VIP'); }

// 5) Kaia; tick; reservas
{ const S = advSave('kaia'); open(); has('Kaia (padrão)'); has('assets/hero/avatar/kaia_phase0.png'); not('Kael Demônio'); def.click(btn('it', { k: 'skin', id: 'kaia_ninja' })); assert.strictEqual(A.fixedEquipped(S).id, 'kaia_ninja'); check('Kaia');
  advSave(); open(); const h0 = H(); def.tick(); assert.strictEqual(H(), h0, 'sem mudança: sem redesenho'); g.S.stage = 27; def.tick(); has('Fase 27'); check('tick');
  g.drawHeroFull = () => { throw new Error('boom'); }; open(); has('id="p5_cv"'); const f = raf.shift(); try { f(16); } catch (e) { assert.fail('exceção no laço: ' + e.message); } not('id="p5_cv"'); assert(/<img class="p5-still" src="assets\/hero\/avatar\/kael_phase0\.png"/.test(H()), 'reserva: retrato parado'); check('reserva');
  delete g.drawHeroFull; open(); not('id="p5_cv"'); check('sem drawHeroFull'); g.drawHeroFull = okDraw;
  const t0 = Sys.titles; Sys.titles = null; try { open(); has('Perfil indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); def.click(btn('tab', { t: 'tit' })); def.tick(); closed = 0; def.click(btn('back')); assert.strictEqual(closed, 1); } finally { Sys.titles = t0; }
  open(); assert(raf.length >= 1); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço');
  out.push('Kaia com as skins dela; tick redesenha só quando muda; desenho do jogo com erro ou ausente vira retrato parado; Sys.titles ausente: aviso com Voltar'); }

// 5b) QA lote 3: a faixa do item tocado só existe em Visual e Coleção; em tela baixa a identidade e os quadros rolam com o conteúdo
{ advSave(); open(); def.click(btn('it', { k: 'skin', id: 'default' })); has('class="p5-det"'); tab('col'); has('class="p5-det"'); tab('tit'); not('class="p5-det'); tab('num'); not('class="p5-det'); tab('vis'); not('class="p5-det');
  def.click(btn('it', { k: 'skin', id: 'kael_demon' })); has('class="p5-det pv"'); tab('num'); not('class="p5-det'); assert.strictEqual(frame().skin, undefined, 'sair para Números tira a prévia do herói'); check('faixa só no Visual');
  const pos = s => H().indexOf(s), stH = () => +/class="p5-stage" style="height:(\d+)px"/.exec(H())[1];
  dims = { H: 704, Wb: 390 }; open(); assert(pos('class="p5-idb"') < pos('class="p5-tabs"') && pos('class="p5-tabs"') < pos('id="p5_scroll"'), 'tela alta: identidade fixa acima das abas'); not('p5-top'); const hi = stH();
  for (const [w, h] of [[320, 640], [320, 520]]) for (const t of ['vis', 'col', 'tit', 'num']) { dims = { H: h, Wb: w }; open({ tab: t }); assert(pos('class="p5-tabs"') < pos('id="p5_scroll"') && pos('id="p5_scroll"') < pos('class="p5-idb"') && pos('class="p5-idb"') < pos('class="p5-stats"'), 'tela baixa: identidade e quadros dentro da rolagem');
    has('class="p5-top lo"'); assert(stH() < hi && stH() >= 120, 'palco menor'); assert(h - stH() - 64 >= (h >= 640 ? 220 : 180), 'sobra área para o conteúdo em ' + w + 'x' + h + ': ' + (h - stH() - 64)); check('baixa ' + h + ' ' + t); }
  dims = {};
  out.push('QA lote 3: faixa do item só em Visual e Coleção (sair para Títulos ou Números tira a prévia); em 320x640 e 320x520 o palco encolhe e identidade e quadros rolam com o conteúdo'); }

// 5c) SISTEMAS DO PERFIL (Sys.profile + Sys.name reais): chave desligada = tela igual; ligada (só neste teste): nome, moldura, aura, retrato, gráfico e recordes
{ const NEW = ['data-x="ren"', 'p5-pen', 'data-x="pf"', 'id="p5_name"', 'class="p5-fr"', 'Moldura do retrato', '>Aura<', '>Retrato<', 'FC em 7 dias', 'class="p5-ch"', '>Recordes<', 'class="p5-rec'];
  const shots = () => ['vis', 'col', 'tit', 'num'].map(t => { advSave(); open({ tab: t }); return H(); });
  const absent = shots(); assert(!Sys.profile, 'até aqui o módulo não estava carregado');
  Sys.name = require(path.join(R, 'js/sys/name.js'));   /* em node o name.js entrega pelo module.exports (no navegador ele mesmo se põe em Sys.name) */
  ['erasend', 'profile'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js'))); const PR = Sys.profile; assert(PR && Sys.name && PR.DATA.on === false, 'Sys.profile carregado e DESLIGADO');
  const off = shots(); assert.deepStrictEqual(off, absent, 'chave desligada: HTML idêntico ao de sem o módulo'); assert(!g.S.sys.profile, 'desligado: nada escrito no save');
  for (const h of off) for (const s of NEW) assert(!h.includes(s), 'desligado não devia ter: ' + s);
  for (const a of ['ren', 'renok', 'renx']) def.click(btn(a)); def.click(btn('pf', { k: 'frame', id: 'bronze' })); assert(!g.S.sys.profile); not('id="p5_name"');
  const day = k => PR.dayKey(host.t - k * 86400000), prof = () => g.S.sys.profile, idb = () => H().slice(H().indexOf('class="p5-idb"'), H().indexOf('class="p5-stats"'));
  PR.setOn(true);
  try {
    // --- trocar nome ---
    const S = advSave(); S.gems = 250; open(); has('data-x="ren"'); has('aria-label="Trocar nome"'); not('id="p5_name"'); assert.strictEqual(prof().fc.length, 1, 'abrir o Perfil chama o sync (ponto de hoje do FC)'); check('ligado: visual');
    def.click(btn('ren')); has('id="p5_name"'); has('value="Rafa_13"'); has('maxlength="' + Sys.name.DATA.max + '"'); has('Trocar grátis'); has('>Grátis<'); has('depois custa 200 diamantes'); not('role="dialog"'); check('campo do nome');
    assert(H().indexOf('id="p5_name"') > H().indexOf('id="p5_scroll"'), 'o campo fica na área de conteúdo, não por cima do herói');
    input.value = '  Lobo_Azul '; def.click(btn('renok')); assert.strictEqual(S.name, 'Lobo_Azul', 'a 1ª troca é grátis e vale na hora'); assert.strictEqual(S.gems, 250); assert.strictEqual(prof().renames, 1); has('>Lobo_Azul</div>'); has('Nome trocado para Lobo_Azul'); not('id="p5_name"'); check('nome grátis');
    def.click(btn('ren')); has('Trocar · 200'); has('Custa <b>200 diamantes</b>'); check('campo pago');
    for (const [bad, why] of [['Admin_Kael', 'Esse nome é reservado.'], ['MataPuta', 'Esse nome não é permitido.'], ['ab', 'Mínimo de 3'], ['', 'Digite um nome.'], ['zap998877665', 'Não use telefone, rede social ou e-mail no nome.'], ['Lobo_Azul', 'Esse já é o seu nome atual.'], ['<b>"x', 'Use só letras, números e _ (sem espaço).']]) {
      input.value = bad; def.click(btn('renok')); assert.strictEqual(S.name, 'Lobo_Azul', 'nome recusado não troca: ' + bad); assert.strictEqual(S.gems, 250); has(g.esc2(why)); has('role="alert"'); has('class="p5-inp bad"'); not('Confirmar'); if (bad) has('value="' + g.esc2(bad) + '"'); check('recusa ' + bad); }
    not('<b>"x'); assert.strictEqual(prof().renames, 1);
    input.value = 'Kael_Novo'; def.click(btn('renok')); assert.strictEqual(S.name, 'Lobo_Azul', '1º toque quando custa: só pede a confirmação'); assert.strictEqual(S.gems, 250); has('Confirmar · 200'); has('Confirma? Saem 200 diamantes'); check('confirmação');
    input.value = 'Kael_Dois'; def.click(btn('renok')); assert.strictEqual(S.name, 'Lobo_Azul', 'mudou o texto: confirma de novo'); has('o seu nome passa a ser Kael_Dois'); assert.strictEqual(S.gems, 250);
    def.click(btn('renok')); assert.strictEqual(S.name, 'Kael_Dois'); assert.strictEqual(S.gems, 50, 'o módulo debitou 200'); assert.strictEqual(prof().renames, 2); has('>Kael_Dois</div>'); not('id="p5_name"'); check('nome pago');
    def.click(btn('ren')); input.value = 'Sem_Gemas'; def.click(btn('renok')); has('Faltam diamantes.'); not('Confirmar'); assert.strictEqual(S.name, 'Kael_Dois'); assert.strictEqual(S.gems, 50); check('sem diamantes'); def.click(btn('renx')); not('id="p5_name"');
    // --- moldura ---
    open(); has('Moldura do retrato'); assert.strictEqual((body().match(/data-k="frame"/g) || []).length, PR.DATA.frames.length); assert(/class="p5-fr" style="border:2px solid rgba\(255,255,255,\.25\)"/.test(idb()), 'moldura Simples na identidade');
    def.click(btn('pf', { k: 'frame', id: 'bronze' })); assert.strictEqual(prof().frame, 'bronze', 'Sys.profile.equip trocou a moldura (nível 13)'); assert(idb().includes('border:3px solid #d08a4c'), 'a moldura aparece na identidade'); has('Moldura Bronze em uso'); check('moldura');
    def.click(btn('pf', { k: 'frame', id: 'ouro' })); assert.strictEqual(prof().frame, 'bronze', 'moldura que não tem não equipa'); has('Moldura Ouro. Como ganhar: VIP 3'); has('>VIP 3</div>'); check('moldura falta');
    def.click(btn('pf', { k: 'frame', id: 'zzz' })); def.click(btn('pf', { k: 'x', id: 'bronze' })); assert.strictEqual(prof().frame, 'bronze');
    // --- aura (o herói do palco não recebe aura: só o selo) ---
    assert.strictEqual((body().match(/data-k="aura"/g) || []).length, PR.DATA.auras.length); not('class="p5-au"'); assert.strictEqual(PR.grant(S, 'light_of_eras'), true); def.render();
    def.click(btn('pf', { k: 'aura', id: 'light_of_eras' })); assert.strictEqual(prof().aura, 'light_of_eras'); assert(idb().includes('Aura: <b>Luz das Eras</b>'), 'selo da aura na identidade'); has('selo no perfil'); assert.strictEqual(frame().aura, undefined); check('aura');
    def.click(btn('pf', { k: 'aura', id: 'aura10' })); assert.strictEqual(prof().aura, 'light_of_eras', 'aura que não tem não equipa'); has('Aura Forja +10. Como ganhar: Arma na Forja +10'); check('aura falta');
    def.click(btn('pf', { k: 'aura', id: 'light_of_eras' })); assert.strictEqual(prof().aura, null, 'tocar na aura em uso volta à da Forja'); has('Aura de volta à da Forja da arma'); not('class="p5-au"'); has('pela Forja da arma');
    // --- retrato ---
    const ports = PR.portraits(S, host), mine = ports.find(p => p.owned && p.skin), lock = ports.find(p => !p.owned && H().includes('data-k="avatar" data-id="' + p.avatar + '"')); assert(mine, 'o save tem o retrato de uma skin');
    def.click(btn('pf', { k: 'avatar', id: mine.avatar })); assert.strictEqual(prof().avatar, mine.avatar); assert(idb().includes('assets/hero/avatar/' + mine.avatar + '.png'), 'o retrato escolhido aparece na identidade'); has('Retrato trocado'); check('retrato');
    if (lock) { def.click(btn('pf', { k: 'avatar', id: lock.avatar })); assert.strictEqual(prof().avatar, mine.avatar, 'retrato que não tem não equipa'); assert(/Como ganhar: |ainda não é seu/.test(H())); check('retrato falta'); }
    def.click(btn('it', { k: 'skin', id: 'kael_ninja' })); assert.strictEqual(prof().avatar, null, 'trocar de skin devolve o retrato ao da skin (protótipo)');
    // --- gráfico do FC e recordes ---
    open({ tab: 'num' }); has('FC em 7 dias'); has('O gráfico aparece depois de alguns dias de jogo.'); not('<svg class="p5-ch"'); has('>Recordes<'); has('class="p5-rec first"'); check('números com 1 ponto');
    prof().fc = [{ d: day(3), fc: 61200 }, { d: day(1), fc: 70900 }].concat(prof().fc.filter(p => p.d === day(0))); open({ tab: 'num' }); const ch = PR.fcChart(S, host); assert.strictEqual(ch.days, 3);
    has('<svg class="p5-ch"'); has('<polyline'); assert.strictEqual((H().match(/<circle /g) || []).length, 3, 'um ponto por dia com jogo'); has(g.esc2(Sys.fc.viewText(61200))); has(g.esc2(Sys.fc.viewText(ch.last))); has('>hoje<'); has(' em 3 dias com jogo'); not('O gráfico aparece depois'); check('gráfico');
    assert(!/<text|<svg[^>]*\swidth="\d/.test(H().slice(H().indexOf('<svg class="p5-ch"'), H().indexOf('</svg>', H().indexOf('<svg class="p5-ch"')))), 'gráfico leve, sem largura fixa');
    PR.record(S, 'hit', 48300, host, 'Ultimate'); PR.record(S, 'bossTime', 11, host, 'Guardião <b>'); def.render(); const recs = PR.records(S).filter(r => r.has); assert(recs.length >= 4);
    assert.strictEqual((H().match(/class="p5-rec/g) || []).length, recs.length, 'só os recordes que o módulo guardou'); has('Maior dano num golpe'); has(g.n0(48300)); has('Ultimate'); has('>11 s<'); has('Guardião &lt;b&gt;'); not('Mais ouro num dia'); not('Melhor sequência sem morrer'); check('recordes');
    // --- todos os botões, com o módulo ligado, em 320 e 390 ---
    let taps = 0; for (const [w, h] of [[320, 520], [390, 704]]) for (const t of ['vis', 'num']) { dims = { H: h, Wb: w }; const mk = () => { advSave().gems = 500; PR.grant(g.S, 'light_of_eras'); open({ tab: t }); def.click(btn('ren')); input.value = 'Novo_' + w; }; mk(); const n = buttons().length; check('ligado ' + w + ' ' + t);
        for (let i = 0; i < n; i++) { mk(); const b = buttons()[i]; if (!b) continue; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } g.view = 'profile2'; check('ligado toque ' + b.dataset.x); } }
    dims = {};
    out.push('Sys.profile ligado em memória: nome grátis, nome pago em dois toques (200 debitados pelo módulo), 7 recusas com o motivo em texto e escapadas, sem diamantes; moldura, aura (selo) e retrato equipam só o que o jogador tem e mostram como ganhar; gráfico com 1 e com 3 pontos; recordes do módulo; ' + taps + ' toques em 320 e 390');
  } finally { PR.setOn(false); dims = {}; }
  advSave(); for (const t of ['vis', 'num']) { open({ tab: t }); for (const s of NEW) not(s); } def.click(btn('ren')); not('id="p5_name"');
  out.push('Sys.profile desligado: HTML idêntico ao de sem o módulo nas 4 abas, nada escrito no save, nenhum elemento novo'); }

// 6) larguras de 320 e 390 e tela baixa; todos os botões de todas as abas, save novo e avançado
{ let taps = 0; for (const [w, h] of [[320, 520], [390, 704]]) for (const mk of [() => { g.S = newSave(); }, () => { advSave(); }]) for (const t of ['vis', 'col', 'tit', 'num']) { mk(); dims = { H: h, Wb: w }; open({ tab: t }); const n = buttons().length; check(w + ' ' + t);
      for (let i = 0; i < n; i += (t === 'tit' ? 3 : 1)) { open({ tab: t }); const b = buttons()[i]; if (!b) continue; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } g.view = 'profile2'; check('toque ' + b.dataset.x); } }
  dims = {}; const never = def.actions.filter(a => !seenActs.has(a) && a !== 'back'); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('toques: ' + taps + ' botões tocados sem exceção em 320 e 390 px; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
