'use strict';
// Fumaça do CAVALEIRO MONTADO (N1 da Arte, 14/11): quem aparece em cima da montaria é o herói DO JOGADOR com a arma que o ponto único devolve
// (wFamLook do js/battle.js + js/wskin.js), nunca a folha fixa do Kael com a espada pintada (kael_<montaria>_*_era2_t1 / _Nstar).
// De verdade: js/mountfx.js (drawHeroMounted, mountIds, mountPrefix, MOUNT_TBL, MOUNT_REF), js/sys/mount.js, js/wskin.js, as linhas wKey / wPng / wFamLook do
// js/battle.js, os .json das folhas e o assets/weapons/meta.json do disco. De mentira: canvas, SPR, carregador de folha.
// Rodar: node test/paineis/mountrider.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
const out = []; const ok = (n, f) => { f(); out.push(n); };
const read = f => fs.readFileSync(path.join(R, f), 'utf8'), exists = f => fs.existsSync(path.join(R, f));

/* ---------- jogo de mentira ---------- */
require(path.join(R, 'js/sys/mount.js'));
const Sys = g.Sys, MT = Sys.mount; MT.DATA.on = true; MT.DATA.visual = true;
const kaiaNoArt = {};   /* montarias em que a Kaia "não tem" folha (para o caso a pé) */
Sys.assets = { mountedArt: (h, id) => h === 'kael' || !kaiaNoArt[id] };
const grad = { addColorStop() {} };
const mkCtx = () => new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
g.ctx = mkCtx(); g.document = { createElement: () => ({ width: 0, height: 0, getContext: () => mkCtx() }) };
g.HS = 155; g.HX = 60; g.PZ = {};
g.sheetSX = () => 0; g.sheetSY = () => 0; g.skinSpr = w0 => w0; g.dspr = () => {};
const sheets = [], missing = [];
g.sheetLoad = base => { sheets.push(base); for (const e of ['.png', '.json']) if (!exists(base + e)) missing.push(base + e);
  let meta = null; try { meta = JSON.parse(read(base + '.json')); } catch (e) { meta = null; } return { ok: !!meta, fail: !meta, base, img: {}, meta, neck: [] }; };
const sprs = []; g.IMGS = {};
g.SPR = (p, kind) => { sprs.push(p); return exists(p) ? { c: {}, w: 100, h: 300, fx: 0, fy: 0, fw: 1, fh: 1 } : null; };
const METAW = JSON.parse(read('assets/weapons/meta.json')); g.J = p => p === 'assets/weapons/meta.json' ? METAW : {};
const SKINS = {}; g.SKIN = id => SKINS[id] || (SKINS[id] = { id, slot: 'weapon', e: +id[1], r: +id[2] });
let equipped = g.SKIN('w23'); g.heroLook = () => ({ weapon: equipped });
g.wItemNow = () => null; g.wFamLook0 = w => w; g.wIsGun = ws => !ws.wk && ws.e >= 3 && ws.e <= 5;
const newSave = () => ({ hero: 'kael', sys: {}, skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' } });
g.S = newSave();

/* ---------- as linhas de verdade do js/battle.js (chave do sprite e o ponto único da arma) ---------- */
const BAT = read('js/battle.js').split(/\r?\n/);
const line = re => { const L = BAT.filter(l => re.test(l)); assert.strictEqual(L.length, 1, 'linha única no battle.js: ' + re); return L[0]; };
vm.runInThisContext([line(/^const W_RKEY=/), line(/^const wKey = /), line(/^const wPng = /), line(/^function wFamLook\(w\)\{/)].join('\n').replace(/^const /gm, 'var '), { filename: 'battle.lines.js' });
vm.runInThisContext(read('js/wskin.js'), { filename: 'wskin.js' });
vm.runInThisContext(read('js/mountfx.js'), { filename: 'mountfx.js' });
const FX = vm.runInThisContext('({ drawHeroMounted, mountIds, mountPrefix, mountFile, MOUNT_TBL, MOUNT_REF, MOUNT_AURA, MOUNT_ART_C })');
const DIR = 'assets/anim/mounts/';
/* um quadro do herói montado, como o drawHeroFull0 do jogo monta o pedido: a arma é a que o ponto único devolve */
const ride = (id, o) => { sheets.length = 0; sprs.length = 0; const H = Object.assign({ x: 60, gy: 200, t: 0.1, sk: {}, ws: g.wFamLook(g.heroLook().weapon), walking: false, hurt: 0, deadP: -1, act: null, main: false, mount: { id, stars: 1 } }, o || {});
  const r = FX.drawHeroMounted(H); return { r, sheets: sheets.slice(), sprs: sprs.slice() }; };
const setHero = h => { g.S.hero = h; for (const k in FX.MOUNT_ART_C) delete FX.MOUNT_ART_C[k]; };

ok('Fênix gigante: ligada no módulo, na tabela de desenho, com ícone, imagem parada e as 6 folhas _body (Kael e Kaia) em disco', () => {
  const ids = FX.mountIds().map(m => m.id); assert(ids.includes('phoenixm'), 'a Fênix está na lista das montarias ligadas'); assert(FX.MOUNT_TBL.phoenixm && FX.MOUNT_TBL.phoenixm.wings === true);
  assert.strictEqual(FX.mountFile('phoenixm'), 'giant_phoenix'); assert(exists('assets/icons/mounts/giant_phoenix.png')); assert(FX.MOUNT_REF.phoenixm && exists('assets/mounts/' + FX.MOUNT_REF.phoenixm.f + '.png'));
  for (const h of ['kael', 'kaia']) for (const st of ['idle', 'run', 'attack']) for (const e of ['.png', '.json']) assert(exists(DIR + h + '_giant_phoenix_' + st + '_body' + e), 'falta ' + h + ' ' + st + e);
  assert(MT.live(MT.DATA.mounts.find(m => m.id === 'phoenixm'))); for (let s = 1; s <= 5; s++) assert(/^rgba\(/.test(FX.MOUNT_AURA[s]), 'aura por estrela é código'); });

ok('toda montaria ligada: o Kael montado pede só folhas _body que existem em disco e a arma equipada (nunca a folha com a espada pintada)', () => {
  setHero('kael'); equipped = g.SKIN('w23'); const ids = FX.mountIds().map(m => m.id); assert(ids.length >= 8, 'as 8 montarias ligadas');
  for (const id of ids) { const a = ride(id); assert.strictEqual(a.r, true, id + ': desenhou montado');
    assert(a.sheets.includes(DIR + 'kael_' + FX.mountFile(id) + '_idle_body'), id + ': folha parada do corpo'); assert(a.sheets.every(s => /_body$/.test(s)), id + ': só folhas _body: ' + a.sheets.join(','));
    assert(a.sprs.includes(g.wPng(equipped)), id + ': a arma equipada na mão'); }
  assert.deepStrictEqual(missing, [], 'folhas pedidas que não existem em disco'); });

ok('estados: correndo pede a folha de corrida; o golpe (do herói) pede a folha de ataque', () => {
  const run = ride('phoenixm', { walking: true }); assert(run.sheets.includes(DIR + 'kael_giant_phoenix_run_body'));
  const atk = ride('phoenixm', { act: { type: 's1', t: 0.2, dur: 0.6, hits: [{ t: 0.27, s: 0.27 }] } }); assert(atk.sheets.includes(DIR + 'kael_giant_phoenix_attack_body')); assert(atk.sprs.includes(g.wPng(equipped)), 'no golpe a arma é a do jogador'); });

ok('trocar a ARMA do jogador muda a arma pedida no herói montado', () => {
  equipped = g.SKIN('w23'); const a = ride('wolf'); equipped = g.SKIN('w01'); const b = ride('wolf');
  assert.notStrictEqual(g.wPng(g.SKIN('w23')), g.wPng(g.SKIN('w01'))); assert(a.sprs.includes(g.wPng(g.SKIN('w23'))) && !a.sprs.includes(g.wPng(g.SKIN('w01')))); assert(b.sprs.includes(g.wPng(g.SKIN('w01'))) && !b.sprs.includes(g.wPng(g.SKIN('w23')))); });

ok('ponto único da arma (wFamLook → WSkin.look): o que ele devolver é o que o herói montado segura; skin de evento desligada na tabela (art:false) nunca aparece', () => {
  equipped = g.SKIN('w23'); const look0 = g.WSkin.look, png = 'assets/weapons/cacada_weapon.png'; assert(exists(png));
  /* o ponto único devolvendo outra arma (vk = chave do sprite e do grip): a mão do montado troca junto, sem o desenho montado saber de skin nenhuma */
  g.WSkin.look = b => Object.assign({}, b, { vk: 'cacada_weapon', base: b });
  try { const a = ride('horse'); assert(a.sprs.includes(png), 'o sprite que o ponto único devolveu foi o pedido'); assert(!a.sprs.includes(g.wPng(equipped)), 'e não o da arma equipada'); } finally { g.WSkin.look = look0; }
  const b = ride('horse'); assert(b.sprs.includes(g.wPng(equipped)) && !b.sprs.includes(png), 'sem skin: a arma equipada');
  /* a tabela de verdade do js/wskin.js: linha com art:true aparece para quem tem e escolheu; linha com art:false não aparece nem é pedida */
  for (const r of g.WSkin.TABLE) { g.S = newSave(); g.S.skins.push(r.id); g.S.skinEq.weapon = r.id; const c = ride('horse');
    if (r.art === true) assert(c.sprs.includes(r.sprite) && c.sprs[c.sprs.length - 1] === r.sprite, r.id + ': ligada, na mão do montado');
    else assert(c.sprs.includes(g.wPng(equipped)) && !c.sprs.includes(r.sprite), r.id + ': desligada, fica a arma equipada'); }
  g.S = newSave(); });

ok('trocar o HERÓI muda o corpo pedido: Kaia pede kaia_*; Kaia sem folha montada fica a pé e NUNCA recebe o Kael no lugar', () => {
  equipped = g.SKIN('w23'); setHero('kaia'); const a = ride('phoenixm'); assert.strictEqual(a.r, true); assert(a.sheets.includes(DIR + 'kaia_giant_phoenix_idle_body')); assert(a.sheets.every(s => s.indexOf('kael_') < 0), 'nenhuma folha do Kael: ' + a.sheets.join(','));
  kaiaNoArt.wolf = true; setHero('kaia'); assert.strictEqual(FX.mountPrefix('wolf'), null); const b = ride('wolf'); assert.strictEqual(b.r, false, 'sem folha montada: devolve false (o jogo desenha o herói a pé)'); assert.deepStrictEqual(b.sheets, [], 'não pede a folha do Kael');
  delete kaiaNoArt.wolf; setHero('kael'); const c = ride('phoenixm'); assert(c.sheets.includes(DIR + 'kael_giant_phoenix_idle_body')); assert.deepStrictEqual(missing, []); });

ok('varredura: nenhuma tela monta caminho da folha fixa do Kael montado com a espada pintada (_era2_t1) nem das folhas de estrela (_Nstar)', () => {
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');
  const SKIP = { 'screens.js': 1 };   /* screens.js: só uma tabela de formatos de folha (expressão regular), não desenha nada */
  const bad = []; for (const f of fs.readdirSync(path.join(R, 'js')).filter(n => /\.js$/.test(n) && !SKIP[n])) { const s = strip(read('js/' + f));
    for (const l of s.split(/\r?\n/)) if (/mounts?\b/i.test(l) && (/_era2_t1/.test(l) || /_\d?star\b|_'\s*\+\s*\w+\s*\+\s*'star/.test(l)) && /kael_|MT \+|MOUNT_DIR|anim\/mounts/.test(l)) bad.push(f + ': ' + l.trim().slice(0, 140)); }
  assert.deepStrictEqual(bad, [], 'folha fixa de montaria com cavaleiro'); });

ok('Oferta de 1ª compra (js/p_offer.js): herói do jogador montado pelo desenho do jogo; a reserva é o ícone da montaria sozinha, que existe em disco', () => {
  const s = read('js/p_offer.js'); assert(!/ofMountSheet|of-ride|Kael montado/.test(s), 'sem a folha fixa do Kael'); assert(/const ofCanRide=M=>/.test(s) && /mountPrefix\(M\.id\)/.test(s), 'só monta quando o herói atual tem folha');
  assert(/aria-label="\$\{esc2\(ofHeroN\(\)\)\} montando/.test(s), 'o texto lido diz o herói do jogador'); assert(/OFR\.sk=SKIN\(S\.skinEq&&S\.skinEq\.armor\)/.test(s), 'roupa do jogador');
  require(path.join(R, 'js/sys/offer.js')); const mid = Sys.offer.DATA.mount; assert(mid && FX.MOUNT_TBL[mid], 'a montaria da oferta está na tabela de desenho');
  const icon = 'assets/icons/mounts/' + (({ mecha: 'war_mecha' })[mid] || FX.mountFile(mid)) + '.png'; assert(exists(icon), 'falta ' + icon); });

ok('Prévia da arte (js/artprev.js): os cartões de montaria usam o desenho do jogo (drawHeroFull com state.mount), uma por montaria da tabela', () => {
  const s = read('js/artprev.js'); assert(!/MT \+ 'kael_'/.test(s), 'sem folha fixa do Kael montado'); assert(/window\.drawHeroFull\(g, cx, gy, k \* 256 \/ HS, s\)/.test(s)); assert(/mount: st\.ride, pet: false/.test(s), 'sem herói nem arma fixos no pedido');
  const ids = [...s.matchAll(/mount\('([a-z]+)', '[^']+'\)/g)].map(m => m[1]); assert.deepStrictEqual(ids.slice().sort(), Object.keys(FX.MOUNT_TBL).sort(), 'os cartões são as montarias da tabela de desenho'); });

console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM (' + out.length + ' casos)');
