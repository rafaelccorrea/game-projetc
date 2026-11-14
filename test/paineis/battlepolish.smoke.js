'use strict';
// Fumaça em Node do POLIMENTO DA BATALHA (js/battlepolish.js): chave desligada = nada muda; "+N" da FC; ondas sem buraco.
// Rodar: node test/paineis/battlepolish.smoke.js   (BP_SRC: testar uma cópia antes de gravar no jogo, que recarrega a cada gravação em js/)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..'), g = globalThis; g.window = g;
const mkEl = id => ({ id: id || '', children: [], style: {}, textContent: '', parentNode: null, offsetWidth: 10, attrs: {}, cls: [],
  classList: { _o: null, add(c) { if (this._o.cls.indexOf(c) < 0) this._o.cls.push(c); }, remove(c) { this._o.cls = this._o.cls.filter(x => x !== c); }, contains(c) { return this._o.cls.indexOf(c) >= 0; } },
  setAttribute(k, v) { this.attrs[k] = v; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; } });
const el = id => { const e = mkEl(id); e.classList = Object.assign({}, e.classList, { _o: e }); return e; };
let made = 0; const head = el('head'), fbw = el('fb_w'), chip = el('fb_fc');
g.document = { head, createElement: () => { made++; return el(''); }, getElementById: id => id === 'fb_w' ? fbw : id === 'fb_fc' ? chip : null };
g.fcShow = n => 'F' + n; g.LW = 330; g.S = { wave: 2 }; g.B = { inst: null, holdT: 0.6, en: [] };
g.DEBUG = false; g.location = { search: '' }; g.SYS_LIVE = { battlePolish: false };
let T = 1000000; const realNow = Date.now; Date.now = () => T;

vm.runInThisContext(fs.readFileSync(process.env.BP_SRC || path.join(R, 'js/battlepolish.js'), 'utf8'), { filename: 'battlepolish.js' });
const BP = g.BattlePolish; assert(BP && typeof g.bpWaveGap === 'function' && typeof g.bpSpawn === 'function');

/* 1. chave desligada: tudo como hoje, nada no DOM */
assert.strictEqual(BP.on(), false);
assert.strictEqual(g.bpWaveGap(0.3), 0.3); assert.strictEqual(g.B.holdT, 0.6, 'desligada não mexe no segura do herói');
{ const e = { x: 440, boss: false }; g.B.en = [e]; assert.strictEqual(g.bpSpawn(e), false); assert.strictEqual(e.x, 440); }
assert.strictEqual(BP.fc(100), false); T += 9000; assert.strictEqual(BP.fc(900), false);
assert.strictEqual(made, 0, 'desligada: nenhum elemento criado'); assert.strictEqual(fbw.children.length, 0); assert.strictEqual(head.children.length, 0);

/* 2. "com" só vale em debug e só para chave que está na tabela com false */
BP.setOn(null); g.location.search = '?debug=1&com=battlePolish'; assert.strictEqual(BP.on(), false, 'sem DEBUG o com= não liga');
BP.setOn(null); g.DEBUG = true; assert.strictEqual(BP.on(), true, 'debug + com liga');
BP.setOn(null); g.location.search = '?debug=1&com=outra,coisa'; assert.strictEqual(BP.on(), false);
BP.setOn(null); g.SYS_LIVE.battlePolish = true; g.location.search = '?debug=1&sem=battlePolish'; assert.strictEqual(BP.on(), false, 'sem= desliga');
BP.setOn(null); g.location.search = ''; assert.strictEqual(BP.on(), true, 'tabela com true liga');

/* 3. ondas sem buraco */
assert.strictEqual(g.bpWaveGap(0.3), BP.CFG.waveGap); assert.strictEqual(g.B.holdT, 0, 'o herói volta a correr logo');
assert.strictEqual(g.bpWaveGap(0), 0, 'nunca aumenta a pausa');
{ const e = { x: 440, boss: false }; g.B.en = [e]; assert.strictEqual(g.bpSpawn(e), true); assert.strictEqual(e.x, 330 + BP.CFG.entry); }
{ const a = { x: 200 }, e = { x: 440 }; g.B.en = [a, e]; assert.strictEqual(g.bpSpawn(e), false, 'só o primeiro da onda'); assert.strictEqual(e.x, 440); }
{ const e = { x: 440, boss: true }; g.B.en = [e]; assert.strictEqual(g.bpSpawn(e), false, 'chefe entra como sempre'); }
{ const e = { x: 440 }; g.B.en = [e]; g.S.wave = 5; assert.strictEqual(g.bpSpawn(e), false, 'onda do chefe: escolta como sempre'); g.S.wave = 2; }
{ const e = { x: 440 }; g.B.en = [e]; g.B.inst = { run: {} }; g.B.holdT = 0.6; assert.strictEqual(g.bpSpawn(e), false, 'instância não muda'); g.bpWaveGap(0.3); assert.strictEqual(g.B.holdT, 0.6); g.B.inst = null; }

/* 4. "+N" na FC */
BP.state.last = null; made = 0;
assert.strictEqual(BP.fc(1000), false, 'primeira leitura só arma'); T += 1000; assert.strictEqual(BP.fc(1500), false, 'dentro do silêncio da carga não avisa');
T += 5000; assert.strictEqual(BP.fc(1500), false, 'sem mudança, sem aviso'); assert.strictEqual(made, 0);
assert.strictEqual(BP.fc(1620), true); assert.strictEqual(made, 2, 'um estilo e um elemento'); assert.strictEqual(fbw.children.length, 1);
const pop = fbw.children[0]; assert.strictEqual(pop.id, 'bp_fc'); assert.strictEqual(pop.textContent, '+F120'); assert(pop.cls.indexOf('go') >= 0); assert(chip.cls.indexOf('bp-up') >= 0);
T += 400; assert.strictEqual(BP.fc(1700), true); assert.strictEqual(pop.textContent, '+F200', 'subidas seguidas somam'); assert.strictEqual(made, 2, 'o elemento é reaproveitado');
T += 3000; assert.strictEqual(BP.fc(1750), true); assert.strictEqual(pop.textContent, '+F50', 'depois do aviso a soma recomeça');
T += 3000; assert.strictEqual(BP.fc(1200), false, 'queda não mostra +N'); assert.strictEqual(pop.textContent, '+F50');
T += 3000; g.B.inst = { run: {} }; assert.strictEqual(BP.fc(5000), false, 'entrar em instância rebaseia'); T += 3000; g.B.inst = null; assert.strictEqual(BP.fc(9000), false, 'sair também');
T += 3000; assert.strictEqual(BP.fc(9010), true);
T += 3000; g.S = { wave: 1 }; assert.strictEqual(BP.fc(99999), false, 'troca de save rebaseia'); assert.strictEqual(fbw.children.length, 1);
assert.strictEqual(BP.fc(NaN), false);

Date.now = realNow; console.log('battlepolish.smoke: ok');
