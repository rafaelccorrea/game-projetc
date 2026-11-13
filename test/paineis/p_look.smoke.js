'use strict';
// Teste de fumaça do js/p_look.js (VITRINE DE SKINS: grade em quadro parado + destaque animado + como ganhar com botão + trocar de herói no Modo dono) em Node.
// Rodar: node test/paineis/p_look.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', width: 440, height: 440, nextElementSibling: { style: {} }, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext() { return ctx; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const ctx = { clearRect() {} }; let cvs = [];
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: () => null, querySelectorAll: sel => /data-live/.test(sel) && !/not/.test(sel) ? cvs.filter(c => c.dataset.live) : /not/.test(sel) ? cvs.filter(c => !c.dataset.live) : cvs }; g.document.head.appendChild = c => c;
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; }; g.setTimeout = () => 0; g.clearTimeout = () => {};
const calls = [], opened = [], toasts = []; let eqId = null, hero = 'kael';
const SK = [{ id: 'kdem', name: 'Kael Demônio', hero: 'kael', r: 4, owned: false, equipped: false, how: 'Prêmio: VIP 7', bonus: '+10% ATK e Vida', soon: true, art: true },
  { id: 'kpal', name: 'Kael Paladino', hero: 'kael', r: 3, owned: false, equipped: false, how: 'Loja: compra direta R$ 24,90', bonus: '+7% ATK e Vida', soon: true, art: true },
  { id: 'kown', name: 'Kael Ninja', hero: 'kael', r: 2, owned: true, equipped: false, how: 'Oferta de 1ª compra', bonus: '+5% ATK e Vida', soon: false, art: true },
  { id: 'ksam', name: 'Kael Samurai', hero: 'kael', r: 3, owned: false, equipped: false, how: 'Torneio: top 10 da temporada', soon: true, art: false },
  { id: 'kaia1', name: 'Kaia Arlequina', hero: 'kaia', r: 3, owned: false, equipped: false, how: 'Fim do Passe premium', soon: true, art: true }];
g.Sys = { host: {}, mount: { ensure: () => ({ eq: 'wolf' }) }, appearance: { heroOf: () => hero, fixedSkins: () => SK.map(s => Object.assign({}, s, { equipped: eqId === s.id })), equipFixed: (S, id) => { calls.push('equip:' + id); eqId = id; return true; }, setHero: (S, h) => { calls.push('hero:' + h); hero = h; return true; } } };
g.S = { sys: {} }; g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i;
let changed = 0; g.snd = () => {}; g.toast = t => toasts.push(t); g.statsChanged = () => { changed++; }; g.render = () => def.render(); g.Screens = { close() { g.closed = true; }, open(n) { opened.push('screen:' + n); return g.__screenOk !== false; } };
g.Panels = { defs: {}, on: () => true, open(n, o) { opened.push('panel:' + n + (o && o.from ? '@' + o.from : '')); return g.__panelOk !== false; } }; g.formRefresh = () => calls.push('formRefresh'); g.preloadAssets = () => calls.push('preloadAssets'); g.avatarRefresh = () => calls.push('avatarRefresh');
let def = null; g.Panels.add = (n, d) => { def = d; return d; };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_look.js'), 'utf8'), { filename: 'p_look.js' });
assert(def && def.render && def.click && def.onClose);
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const not = s => assert(!H().includes(s), 'não devia ter: ' + s); const out = [];
const mkCanvases = () => { cvs = [...H().matchAll(/<canvas data-plsk="([^"]*)"( data-live="1")?( data-mounted="(\d)")?/g)].map(m => { const e = mkEl('c'); e.dataset.plsk = m[1]; if (m[2]) e.dataset.live = '1'; if (m[4]) e.dataset.mounted = m[4]; return e; }); return cvs; };
let drew = []; g.drawHeroFull = (c, x, y, sc, st) => { drew.push(st); };
// 1) grade: quadro PARADO; sem Equipar nem como-ganhar na grade; sem emoji
def.onOpen(); def.render(); ['Kael · skin padrão', 'EQUIPADA', 'Kael Demônio', 'Kael Paladino', 'Kael Ninja', 'Kael Samurai', 'Novas skins em breve', 'Voltar'].forEach(has);
not('Kaia Arlequina'); assert(!/class="pl-btn"/.test(H()), 'sem botão Equipar na grade'); assert(!/COMO GANHAR/.test(H()), 'o como ganhar fica no destaque'); assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji');
assert((H().match(/data-x="open"/g) || []).length === 5, 'cinco cartões abrem o destaque (padrão + 4)'); assert(!/data-live/.test(H()), 'a grade não tem canvas animado');
assert((H().match(/<canvas data-plsk=/g) || []).length === 4, 'um canvas por cartão COM arte; o Samurai (sem arte) não desenha herói');
assert.strictEqual(raf.length, 0, 'nenhum laço de animação na grade'); out.push('grade: 5 cartões, quadro parado, sem laço, sem Equipar/como ganhar na grade');
// 2) destaque de skin bloqueada com arte
def.click(btn('open', { id: 'kpal' })); has('role="dialog"'); has('COMO GANHAR'); has('Loja: compra direta'); assert(!/R[$]|24,90/.test(H()), 'sem preço'); has('Ir à Loja'); has('data-live="1"'); has('data-x="close"'); assert((H().match(/data-live="1"/g) || []).length === 1, 'só o destaque anima');
assert(raf.length === 1, 'um laço só, para o destaque'); out.push('destaque: um canvas animado, como ganhar sem preço, botão Ir à Loja');
mkCanvases(); drew = []; raf.shift()(16); assert(drew[0].wing === undefined, 'skin sem asa própria: wing segue o jogo'); assert(drew.length >= 1 && drew[0].skin === 'kpal' && drew[0].mount === false, 'desenha a skin a pé no destaque'); assert(drew[0].pet === undefined, 'regra do dono (pet sempre na frente e nunca some): o destaque NÃO esconde o pet (sem state.pet o drawHeroFull desenha o pet por último)');
// 2b) skin com asa PRÓPRIA (Kael Anjo, Kaia Angelical): wing:false no desenho (sem asa dupla); as outras seguem a regra do jogo (wing indefinido)
assert(plWingOff('kael_angel') === false && plWingOff('kaia_angel') === false && plWingOff('kdem') === false && plWingOff('default') === false, 'só as skins com asa própria'); 
out.push('asa própria: wing:false só para kael_angel/kaia_angel');
// 3) botão leva à tela certa; destino desligado explica
opened.length = 0; def.click(btn('route', { id: 'kpal' })); assert.deepStrictEqual(opened, ['screen:shop']); assert.strictEqual(window.SHOP_RETURN, 'look'); out.push('Loja: Screens.open(shop) e SHOP_RETURN = look');
g.__screenOk = false; toasts.length = 0; def.render(); def.click(btn('open', { id: 'kpal' })); def.click(btn('route', { id: 'kpal' })); assert(toasts.some(t => /Loja não está disponível/.test(t)), 'explica quando a Loja não abre'); g.__screenOk = true;
def.click(btn('close')); opened.length = 0; def.click(btn('open', { id: 'kdem' })); has('Ir ao Clube VIP'); def.click(btn('route', { id: 'kdem' })); assert.deepStrictEqual(opened, ['panel:vip@look']);
g.__panelOk = false; toasts.length = 0; def.click(btn('close')); def.click(btn('open', { id: 'kdem' })); def.click(btn('route', { id: 'kdem' })); assert(toasts.some(t => /Clube VIP não está disponível/.test(t)), 'VIP desligado: explica'); g.__panelOk = true;
def.click(btn('close')); opened.length = 0; def.click(btn('open', { id: 'ksam' })); has('Ir ao Torneio'); def.click(btn('route', { id: 'ksam' })); assert.deepStrictEqual(opened, ['panel:tourney@look']);
out.push('VIP e Torneio: Panels.open com from look; destino indisponível: o botão explica');
// 4) sem arte: sem canvas, "Arte em breve", sem Equipar
def.click(btn('close')); def.click(btn('open', { id: 'ksam' })); has('Arte em breve'); assert(!/data-live/.test(H()), 'sem arte não desenha o herói'); assert(!/data-x="equip"/.test(H())); has('Torneio: top 10 da temporada'); out.push('sem arte: cadeado e texto, sem herói falso e sem Equipar');
// 5) skin possuída: Equipar no destaque
def.click(btn('close')); def.click(btn('open', { id: 'kown' })); has('data-x="equip"'); assert(!/data-x="route"/.test(H()), 'possuída não tem como ganhar'); calls.length = 0; def.click(btn('equip', { id: 'kown' })); assert.deepStrictEqual(calls, ['equip:kown']); assert(changed >= 1); out.push('possuída: Equipar chama equipFixed');
// 6) A pé / Montado (montado = corpo padrão)
def.click(btn('close')); def.click(btn('open', { id: 'kdem' })); has('data-x="pose-mount"'); def.click(btn('pose-mount')); has('data-mounted="1"'); has('corpo padrão'); assert(/data-plsk="default" data-live="1" data-mounted="1"/.test(H()), 'montado usa o corpo padrão'); mkCanvases(); drew = []; raf.shift()(16); assert(drew[0].skin === 'default' && drew[0].mount === undefined, 'montado: skin default e a montaria do save'); def.click(btn('pose-foot')); has('data-mounted="0"'); out.push('A pé / Montado (corpo padrão montado)');
// 7) fechar para o laço
def.click(btn('close')); assert.strictEqual(raf.length, 0, 'fechar o destaque para o laço'); not('role="dialog"'); out.push('fechar o destaque para o laço');
// 8) trocar de herói: só no Modo dono
def.render(); not('trocar de herói'); g.OWNER_MODE = true; def.render(); has('trocar de herói'); calls.length = 0; def.click(btn('hero')); assert.deepStrictEqual(calls, ['hero:kaia', 'formRefresh', 'preloadAssets', 'avatarRefresh']); has('Kaia · skin padrão'); has('Kaia Arlequina'); not('Kael Demônio');
def.click(btn('hero')); assert.strictEqual(hero, 'kael'); g.OWNER_MODE = false; def.render(); not('trocar de herói'); def.click(btn('hero')); assert.strictEqual(hero, 'kael', 'fora do Modo dono o botão não faz nada'); out.push('Modo dono: trocar de herói Kael ↔ Kaia (só nele), com formRefresh/preloadAssets/avatarRefresh');
// 9) lista vazia / sem API
{ const keep = g.Sys.appearance.fixedSkins; g.Sys.appearance.fixedSkins = () => []; def.render(); has('Kael · skin padrão'); has('Novas skins em breve'); assert((H().match(/data-x="open"/g) || []).length === 1); delete g.Sys.appearance.fixedSkins; def.render(); has('Kael · skin padrão'); g.Sys.appearance.fixedSkins = keep; out.push('lista vazia / sem fixedSkins: só a padrão + em breve'); }
// 10) drawHeroFull com erro: reserva, sem exceção
g.drawHeroFull = () => { throw new Error('boom'); }; def.onOpen(); try { def.render(); } catch (e) { assert.fail('exceção na reserva: ' + e.message); } out.push('drawHeroFull com erro: reserva');
// 11) MÓDULO REAL: Kael 6, Kaia 4
{ g.drawHeroFull = () => {}; try { require(path.join(R, 'js/sys/skin.js')); } catch (e) {} const real = require(path.join(R, 'js/sys/appearance.js')); const keepA = g.Sys.appearance; g.Sys.appearance = real; g.S = { sys: {}, look: {} }; g.RAR = [{ n: 'Básico', c: '#999' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b5f' }, { n: 'Mítico', c: '#f46' }, { n: 'Lendário', c: '#fb2' }];
  const list = real.fixedSkins(g.S, {}); const nK = list.filter(x => x.hero === 'kael').length, nA = list.filter(x => x.hero === 'kaia').length; g.S.hero = 'kael'; def.onOpen(); def.render();
  assert.strictEqual((H().match(/data-x="open"/g) || []).length, 1 + nK, 'Kael: padrão + ' + nK); assert(!/undefined|NaN|\bnull\b|R[$]/.test(H())); const kaiaFirst = list.find(x => x.hero === 'kaia'); g.S.hero = 'kaia'; if (real.setHero) real.setHero(g.S, 'kaia'); def.render(); assert.strictEqual((H().match(/data-x="open"/g) || []).length, 1 + nA, 'Kaia: padrão + ' + nA); has(kaiaFirst.name);
  g.Sys.appearance = keepA; g.S = { sys: {} }; out.push('módulo real: Kael ' + nK + ' skins, Kaia ' + nA + ' (padrão + do herói atual)'); }
def.click(btn('back')); assert(g.closed); out.push('Voltar fecha');
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
