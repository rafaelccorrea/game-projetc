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
const canvas = mkEl('p5_cv'), scroll = mkEl('p5_scroll');
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => id === 'p5_cv' ? (/id="p5_cv"/.test(H()) ? canvas : null) : id === 'p5_scroll' ? (/id="p5_scroll"/.test(H()) ? scroll : null) : null };
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

// 6) larguras de 320 e 390 e tela baixa; todos os botões de todas as abas, save novo e avançado
{ let taps = 0; for (const [w, h] of [[320, 520], [390, 704]]) for (const mk of [() => { g.S = newSave(); }, () => { advSave(); }]) for (const t of ['vis', 'col', 'tit', 'num']) { mk(); dims = { H: h, Wb: w }; open({ tab: t }); const n = buttons().length; check(w + ' ' + t);
      for (let i = 0; i < n; i += (t === 'tit' ? 3 : 1)) { open({ tab: t }); const b = buttons()[i]; if (!b) continue; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } g.view = 'profile2'; check('toque ' + b.dataset.x); } }
  dims = {}; const never = def.actions.filter(a => !seenActs.has(a) && a !== 'back'); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  out.push('toques: ' + taps + ' botões tocados sem exceção em 320 e 390 px; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
