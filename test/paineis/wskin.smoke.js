'use strict';
// Teste de fumaça do js/wskin.js (SKIN DE ARMA DE EVENTO: só o visual por cima da arma equipada) em Node, sem navegador.
// O wKey, o wPng e o wFamLook são os DE VERDADE (linhas lidas do js/battle.js); SPR / IMGS / J / heroLook / wIsGun são de mentira.
// Rodar: node test/paineis/wskin.smoke.js [caminho de outro wskin.js]
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const out = []; const ok = (n, f) => { f(); out.push(n); };

/* ---------- jogo de mentira ---------- */
const SKINS = {}; g.SKIN = id => SKINS[id] || (/^w\d\d$/.test(id) ? (SKINS[id] = { id, slot: 'weapon', e: +id[1], r: +id[2] }) : null);
const BOW = { id: 'wf_bow_epico', slot: 'weapon', e: 1, r: 2, wk: 'bow_epico', wt: 'bow', style: 'ranged' }, BOOM = { id: 'wf_boomerang_raro', slot: 'weapon', e: 0, r: 1, wk: 'boomerang_raro', wt: 'boomerang', style: 'return' };
let equipped = g.SKIN('w23');   /* a arma equipada, já resolvida pela família */
g.heroLook = () => ({ weapon: equipped });
g.wItemNow = () => null;
g.wIsGun = ws => !ws.wk && ws.e >= 3 && ws.e <= 5;
const META = { era2_mitico: { type: 'melee', grip: [0.5, 0.78], angle: 90, len: 0.7 }, cacada_weapon: { type: 'melee', grip: [0.363, 0.863], angle: 69, len: 0.899 }, forja_weapon: { type: 'melee', grip: [0.273, 0.815], angle: 82, len: 0.801 } };
g.J = p => p === 'assets/weapons/meta.json' ? META : {};
/* arte: disk = arquivos que "existem e já carregaram"; pend = a caminho; o resto falha */
const disk = new Set(), pend = new Set(), asked = []; g.IMGS = {}; const SPRC = {};
g.SPR = (p, kind) => { asked.push(p); if (SPRC[p]) return SPRC[p]; if (disk.has(p)) return SPRC[p] = { c: {}, w: 100, h: 300, pad: 0, fx: 0, fy: 0, fw: 1, fh: 1 };
  if (!g.IMGS[p]) g.IMGS[p] = { ok: false, fail: !pend.has(p), p: Promise.resolve() }; return null; };
g.Preload = { dropped: [], drop(u) { this.dropped.push(u); return true; } };
const newSave = () => ({ skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' } });
g.S = newSave();

/* ---------- as linhas de verdade do js/battle.js: chave do sprite e o ponto único ---------- */
const BAT = fs.readFileSync(path.join(R, 'js/battle.js'), 'utf8').split(/\r?\n/);
const line = re => { const L = BAT.filter(l => re.test(l)); assert.strictEqual(L.length, 1, 'linha única no battle.js: ' + re); return L[0]; };
vm.runInThisContext([line(/^const W_RKEY=/), line(/^const wKey = /), line(/^const wPng = /), line(/^function wFamLook\(w\)\{/)].join('\n').replace(/^const /gm, 'var '), { filename: 'battle.lines.js' });
g.wFamLook0 = w => w;   /* a família já está resolvida em "equipped" */
assert(/ws\.vk\|\|ws\.wk/.test(line(/^const wKey = /)), 'wKey lê vk antes de wk');
assert(/^function wFamLook0\(w\)\{ const it=wItemNow\(\)/m.test(BAT.join('\n')), 'wFamLook0 = a resolução de sempre');

const SRC = fs.readFileSync(process.argv[2] ? path.resolve(process.argv[2]) : path.join(R, 'js/wskin.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'wskin.js' });
const W = g.WSkin, hand = () => g.wFamLook(g.heroLook().weapon);
const have = id => { if (!g.S.skins.includes(id)) g.S.skins.push(id); };
const art = id => disk.add('assets/weapons/' + id + '.png');

ok('tabela: os três ids, com nome, sprite e ícone no caminho combinado; linha com art:true tem sprite, ícone e grip NO DISCO', () => {
  assert.deepStrictEqual(W.IDS.slice().sort(), ['cacada_weapon', 'festival_weapon', 'forja_weapon']);
  for (const r of W.TABLE) { assert.strictEqual(r.sprite, 'assets/weapons/' + r.id + '.png'); assert.strictEqual(r.icon, 'assets/icons/weapons/' + r.id + '.png'); assert(r.name.length > 3); assert.strictEqual(typeof r.art, 'boolean');
    if (r.art) { const M = JSON.parse(fs.readFileSync(path.join(R, 'assets/weapons/meta.json'), 'utf8'))[r.id]; assert(fs.existsSync(path.join(R, r.sprite)), 'falta ' + r.sprite); assert(fs.existsSync(path.join(R, r.icon)), 'falta ' + r.icon); assert(M && M.type === 'melee' && Array.isArray(M.grip) && M.grip.length === 2, 'falta o grip de ' + r.id + ' no meta.json'); } }
  assert.strictEqual(W.rowOf('cacada_weapon').name, 'Lâmina do Caçador'); assert.strictEqual(W.rowOf('forja_weapon').name, 'Martelo das Eras'); assert.strictEqual(W.rowOf('festival_weapon').name, 'Lâmina do Festival'); });

ok('sem skin de evento: nada muda (mesma arma, mesma chave, bloco vazio, nada pedido à rede)', () => {
  art('cacada_weapon'); art('forja_weapon'); asked.length = 0;
  assert.strictEqual(hand(), equipped); assert.strictEqual(g.wKey(hand()), 'era2_mitico'); assert.strictEqual(g.wPng(hand()), 'assets/weapons/era2_mitico.png');
  assert.deepStrictEqual(W.rows(), []); assert.strictEqual(W.html({ attr: 'data-x="wsk"' }), ''); assert.strictEqual(W.chosen(), null); assert.strictEqual(W.active(), null); assert.strictEqual(asked.length, 0);
  /* skin de arma ANTIGA no save continua ignorada */
  g.S.skins.push('w41'); g.S.skinEq.weapon = 'w41'; assert.strictEqual(hand(), equipped); assert.strictEqual(W.chosen(), null); assert.deepStrictEqual(W.rows(), []); g.S = newSave(); });

ok('id de evento no save SEM ter a skin: arma equipada', () => { g.S.skinEq.weapon = 'cacada_weapon'; assert.strictEqual(hand(), equipped); assert.strictEqual(W.use('cacada_weapon').reason, 'falta'); g.S = newSave(); });

ok('com a skin e a arte: sprite e grip trocados; era, raridade e identidade da arma equipada mantidos', () => {
  have('cacada_weapon'); const r0 = W.rows(); assert.strictEqual(r0.length, 1); assert.strictEqual(r0[0].state, 'idle'); assert.strictEqual(r0[0].can, true); assert.strictEqual(hand(), equipped, 'ter a skin não troca nada sozinho');
  const u = W.use('cacada_weapon'); assert.strictEqual(u.ok, true); assert(/poder continua/.test(u.msg)); assert.strictEqual(g.S.skinEq.weapon, 'cacada_weapon');
  const h = hand(); assert.notStrictEqual(h, equipped); assert.strictEqual(g.wKey(h), 'cacada_weapon'); assert.strictEqual(g.wPng(h), 'assets/weapons/cacada_weapon.png');
  assert.deepStrictEqual(g.J('assets/weapons/meta.json')[g.wKey(h)].grip, [0.363, 0.863]);
  assert.strictEqual(h.e, 2); assert.strictEqual(h.r, 3); assert.strictEqual(h.id, 'w23'); assert.strictEqual(h.wk, undefined, 'não vira arma de arremesso'); assert.strictEqual(h.base, equipped);
  assert.strictEqual(hand(), h, 'o mesmo objeto a cada chamada'); assert.strictEqual(W.active(), 'cacada_weapon'); assert.strictEqual(W.rows()[0].state, 'on');
  assert.deepStrictEqual(equipped, { id: 'w23', slot: 'weapon', e: 2, r: 3 }, 'a arma equipada não foi alterada');
  const s = g.SPR('assets/weapons/cacada_weapon.png', 'weapon'); assert.strictEqual(s.v[3], s, 'sem tinta de raridade por cima da skin'); });

ok('trocar a arma equipada (outra corpo a corpo): a skin continua, com os dados da arma nova', () => {
  const old = hand(); equipped = g.SKIN('w04'); const h = hand(); assert.notStrictEqual(h, old); assert.strictEqual(g.wKey(h), 'cacada_weapon'); assert.strictEqual(h.e, 0); assert.strictEqual(h.r, 4); equipped = g.SKIN('w23'); assert.strictEqual(hand(), old); });

ok('arco, bumerangue e arma de fogo: a skin NÃO aplica; opção desativada com o motivo', () => {
  for (const [w, word] of [[BOW, 'arco'], [BOOM, 'bumerangue'], [g.SKIN('w32'), 'arma de fogo']]) { equipped = w; assert.strictEqual(hand(), w); assert.strictEqual(g.wKey(hand()), w.wk || 'era3_t1'); assert.strictEqual(W.active(), null);
    const r = W.rows()[0]; assert.strictEqual(r.state, 'paused'); assert(r.text.includes(word), r.text); assert.strictEqual(r.can, true, 'quem já escolheu ainda pode Tirar'); }
  have('forja_weapon'); equipped = BOW; const f = W.rows().find(r => r.id === 'forja_weapon'); assert.strictEqual(f.state, 'blocked'); assert.strictEqual(f.can, false); assert(/arco/.test(f.text));
  const u = W.use('forja_weapon'); assert.strictEqual(u.ok, false); assert.strictEqual(u.reason, 'tipo'); assert.strictEqual(g.S.skinEq.weapon, 'cacada_weapon', 'recusa não mexe no save');
  const H = W.html({ attr: 'data-x="wsk"', btn: 'p5-bt' }); assert(/data-id="forja_weapon" data-op="use" aria-disabled="true"/.test(H)); assert(!/sdisabled[s>=]/.test(H), 'sem botão morto: o toque repete o motivo'); assert(/data-id="cacada_weapon" data-op="clear"(?! aria-disabled)/.test(H));
  equipped = g.SKIN('w23'); assert.strictEqual(g.wKey(hand()), 'cacada_weapon', 'voltou a arma corpo a corpo: a skin volta'); });

ok('"Tirar" restaura a arma equipada', () => { const c = W.clear(); assert.strictEqual(c.ok, true); assert.strictEqual(g.S.skinEq.weapon, 'w00'); assert.strictEqual(typeof g.S.skinEq.weapon, 'string');
  assert.strictEqual(hand(), equipped); assert.strictEqual(g.wKey(hand()), 'era2_mitico'); assert.strictEqual(W.active(), null); assert.strictEqual(W.rows().every(r => !r.use), true);
  assert.strictEqual(W.act('cacada_weapon', 'use').ok, true); assert.strictEqual(g.wKey(hand()), 'cacada_weapon'); assert.strictEqual(W.act('cacada_weapon', 'clear').ok, true); assert.strictEqual(hand(), equipped); assert.strictEqual(W.act('x', 'y').ok, false); });

ok('arte faltando ou a caminho: arma equipada (nunca mão vazia); chegou a arte: troca', () => {
  disk.delete('assets/weapons/forja_weapon.png'); assert.strictEqual(W.use('forja_weapon').ok, true);
  assert.strictEqual(hand(), equipped); assert.strictEqual(g.wPng(hand()), 'assets/weapons/era2_mitico.png'); assert.strictEqual(W.rows().find(r => r.id === 'forja_weapon').state, 'fail'); assert.strictEqual(W.active(), null);
  delete g.IMGS['assets/weapons/forja_weapon.png']; pend.add('assets/weapons/forja_weapon.png'); assert.strictEqual(hand(), equipped); assert.strictEqual(W.rows().find(r => r.id === 'forja_weapon').state, 'wait');
  art('forja_weapon'); assert.strictEqual(g.wKey(hand()), 'forja_weapon'); assert.deepStrictEqual(META[g.wKey(hand())].grip, [0.273, 0.815]);
  /* sem a entrada do grip no meta.json: não aplica */
  const m = META.forja_weapon; delete META.forja_weapon; assert.strictEqual(hand(), equipped); META.forja_weapon = { type: 'gun', grip: [0, 0] }; assert.strictEqual(hand(), equipped); META.forja_weapon = m; assert.strictEqual(g.wKey(hand()), 'forja_weapon'); });

ok('linha com art:false (skin sem arte no disco): não aparece, não aplica e nada é pedido à rede, mesmo com a skin no save', () => {
  const F = W.rowOf('festival_weapon'), a0 = F.art; F.art = false; have('festival_weapon'); asked.length = 0; assert.strictEqual(W.rows().some(r => r.id === 'festival_weapon'), false); const u = W.use('festival_weapon'); assert.strictEqual(u.ok, false); assert.strictEqual(u.reason, 'arte');
  g.S.skinEq.weapon = 'festival_weapon'; assert.strictEqual(hand(), equipped); assert.strictEqual(W.rows().every(r => !r.use), true); assert.strictEqual(asked.filter(p => /festival/.test(p)).length, 0);
  F.art = a0; g.S.skins = g.S.skins.filter(x => x !== 'festival_weapon'); });

ok('bloco da tela: frase do dono, só as skins que o jogador tem, botões com 44 px, sem imagem quebrada', () => {
  g.S.skinEq.weapon = 'forja_weapon'; const H = W.html({ attr: 'data-x="wsk"', btn: 'p5-bt', btnOff: 'p5-bt blue', sec: 'p5-sec', hint: 'p5-hint' });
  assert(H.includes('Só muda o visual. O poder é o da arma equipada.')); assert(!/festival/.test(H));
  const bts = H.match(/<button[^>]*>[^<]*<\/button>/g); assert.strictEqual(bts.length, 2); for (const b of bts) { assert(/min-height:44px/.test(b)); assert(/min-width:76px/.test(b)); assert(/data-x="wsk"/.test(b)); assert(/aria-label="/.test(b)); }
  assert(/data-op="clear"[^>]*>Tirar</.test(H)); assert(/data-op="use"[^>]*>Usar</.test(H)); assert.strictEqual((H.match(/<img /g) || []).length, 2); assert.strictEqual((H.match(/onerror=/g) || []).length, 2);
  assert(!/\b(width|min-width):(3[3-9]\d|[4-9]\d\d)px/.test(H), 'nada mais largo que 320'); assert((H.match(/overflow-wrap:anywhere/g) || []).length >= 4); });

ok('os outros desenhos: folhas compostas (corpo + arma pintada) não entram com a skin; o Perfil chama o bloco e a ação', () => {
  const ST = fs.readFileSync(path.join(R, 'js/stage.js'), 'utf8'); for (const f of ['spinBase(ws){ if (!ws || ws.wk || ws.vk ||', 'trailBase(ws){ if (!ws || ws.wk || ws.vk ||', 'heroCompTier(sk, ws){ if (!sk || !ws || ws.wk || ws.vk ||']) assert(ST.includes(f), f);
  const PF = fs.readFileSync(path.join(R, 'js/p_profile2.js'), 'utf8'); assert(PF.includes('WSkin.html({attr:\'data-x="wsk"\'')); assert(/\n  wsk\(b\)\{/.test(PF));
  assert(/'stage','wskin','mountfx'/.test(fs.readFileSync(path.join(R, 'index.html'), 'utf8')), 'js/wskin.js na lista de scripts'); });

console.log('wskin.smoke: ' + out.length + ' casos passaram'); out.forEach(n => console.log('  ok  ' + n));
