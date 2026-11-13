'use strict';
// Teste de fumaça do js/p_era.js em Node (sem navegador): DOM mínimo falso, relógio falso e fetch falso. Rodar: node test/paineis/p_era.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
// --- DOM mínimo ---
const mkEl = () => { const e = { children: [], style: {}, dataset: {}, className: '', _h: '', clientWidth: 390, clientHeight: 844, listeners: {}, parentNode: null,
  setAttribute() {}, addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; }, classList: { add() {}, remove() {} } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const body = mkEl(), head = mkEl(); const ids = {};
g.document = { body, head, createElement: () => mkEl(), getElementById: id => (id === 'app' ? null : ids[id] || null) };
head.appendChild = c => { if (c.id) ids[c.id] = c; return c; };
// --- relógio falso ---
let timers = []; g.setTimeout = (f, ms) => { timers.push({ f, ms }); return timers.length; }; g.clearTimeout = () => { timers = []; };
// --- jogo falso ---
g.ERAS = [{ n: 'Pré-História', en: [{ n: 'Lagarto' }, { n: 'Homem das Cavernas' }] }, { n: 'Antiguidade', en: [{ n: 'Legionário Rebelde' }, { n: 'Gladiador' }, { n: 'Escorpião Gigante' }] },
  { n: 'Medieval', en: [{ n: 'Goblin' }, { n: 'Esqueleto' }, { n: 'Orc' }] }];
g.SKN = [['Golpe Sísmico', 'Fúria do Mamute'], ['Estocada Tripla', 'Ira do Olimpo'], ['Corte Giratório', 'Lâmina do Dragão']];
g.B = { res: null, running: true, act: 1, banner: 1, eshots: [1] }; const sounds = []; g.snd = n => sounds.push(n);
let wEra = 1; g.heroLook = () => ({ weapon: { e: wEra } });
const J = { 'assets/anim/hyb/enemy/era1_boss_die.json': { frames: 13, fps: 12, w: 544, h: 352, feetY: 307 }, 'assets/anim/hyb/R/kael_run_body.json': { frames: 8, fps: 12, w: 256, h: 256 },
  'assets/anim/hyb/enemy/era2_e0_run.json': null, 'assets/anim/era2_e0_run.json': { frames: 8, fps: 12, w: 256, h: 256, feetY: 243 }, 'assets/anim/ult/era2_ult.json': { frames: 49, cols: 8, fps: 12, w: 384, h: 216 }, 'assets/bg/meta.json': { era1: { groundY: 0.64 }, era2: { groundY: 0.78 } } };
g.fetch = u => Promise.resolve(J[u] ? { ok: true, json: () => Promise.resolve(J[u]) } : { ok: false });
let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_era.js'), 'utf8'), { filename: 'p_era.js' });
assert(def && def.overlay && typeof def.open === 'function', 'Panels.add registrou o overlay');
const tick = () => new Promise(r => setImmediate(r));
(async () => {
  const out = []; let done = 0;
  // 1) dados inválidos não abrem
  assert.strictEqual(def.open({ to: 9 }), false); assert.strictEqual(def.open({}), false); out.push('dados inválidos: não abre');
  // 2) abre a troca 1 -> 2 (Antiguidade -> Medieval), com recompensa
  assert.strictEqual(def.open({ from: 1, to: 2, boss: 'Minotauro', gems: 30, onDone: () => done++ }), true);
  assert.deepStrictEqual(g.B.res, { mode: 'era' }); assert.strictEqual(g.B.running, false, 'o jogo para'); assert.strictEqual(def.open({ from: 1, to: 2 }), false, 'não abre duas');
  await tick(); await tick(); await tick();
  const st = window.PEra.state, el = st.el; assert(el, 'overlay criado'); assert(timers.length > 0, 'passo agendado');
  const H = () => el.innerHTML; const seq = [];
  const need = { boss: ['Senhor da Era derrotado!', 'Minotauro', 'Antiguidade'], portal: ['pe-portal', 'pe-toportal'], flash: ['pe-flash'], title: ['NOVA ERA LIBERADA', 'ERA 3 · MEDIEVAL'],
    foe: ['Goblin, Esqueleto e Orc', 'assets/anim/era2_e0_run.png'], weap: ['Novos itens caem aqui', 'assets/weapons/era2_t0.png', 'assets/hero/era2_t0.png', 'A sua arma atual é de uma era anterior'], reward: ['+30 gemas'], final: ['Começar a era', 'ERA 3 · MEDIEVAL', 'Novas armas e armaduras caem', '+30 gemas'] };
  for (let i = 0; i < st.steps.length; i++) { window.PEra.go(i); const k = st.step; seq.push(k); for (const s of need[k] || []) assert(H().includes(s), `${k}: faltou "${s}"`); assert(!/ultimate|Lâmina do Dragão/i.test(H()), k + ': a ultimate não é da era'); }
  assert.deepStrictEqual(seq, ['boss', 'portal', 'flash', 'title', 'foe', 'weap', 'reward', 'final'], 'ordem dos passos: ' + seq.join(','));
  assert(!/data-e="skip"/.test(H()), 'no resumo não há "Pular"'); out.push('passos: ' + seq.join(' > '));
  // 3) cliques: toque avança, Pular vai ao resumo, Começar fecha, chama onDone e devolve o jogo
  const click = a => el.listeners.click({ target: { closest: () => (a ? { dataset: { e: a } } : null) } });
  window.PEra.go(0); click(null); assert.strictEqual(st.step, 'portal', 'toque avança'); click('skip'); assert.strictEqual(st.step, 'final', 'Pular vai ao resumo');
  assert(/data-e="start"/.test(H())); click('start');
  assert.strictEqual(st.open, false); assert.strictEqual(done, 1, 'onDone'); assert.strictEqual(g.B.res, null, 'B.res livre'); assert.strictEqual(g.B.running, true, 'o jogo volta'); out.push('toque / Pular / Começar a era / onDone / jogo volta: ok');
  // 4) arma da era nova: sem cartão de arma; sem recompensa: sem cartão de recompensa e sem a linha no resumo
  wEra = 2; def.open({ from: 1, to: 2, boss: '', gems: 0 }); await tick(); await tick(); await tick();
  assert(!window.PEra.state.steps.includes('reward'), 'sem reward'); assert(window.PEra.state.steps.includes('weap'), 'itens da era sempre'); window.PEra.go(window.PEra.state.steps.length - 1);
  assert(!window.PEra.state.el.innerHTML.includes('Recompensa'), 'sem recompensa inventada'); assert(!window.PEra.state.el.innerHTML.includes('Essência'), 'sem Essência inventada'); def.close(); out.push('sem arma antiga/sem recompensa: cartões e linhas não aparecem');
  // 5) Essência só quando informada
  wEra = 1; def.open({ from: 1, to: 2, gems: 0, essence: 2 }); await tick(); await tick(); await tick(); window.PEra.go(window.PEra.state.steps.indexOf('reward')); assert(window.PEra.state.el.innerHTML.includes('+2 Essência da Era')); def.close(); out.push('Essência só se informada: ok');
  // 5b) HERÓI por drawHeroFull (fase, montaria, asa, pet): canvas transparente com folga, laço enquanto aberto, reserva sem a função e com erro, para ao fechar
  { const rafs = []; g.requestAnimationFrame = f => { rafs.push(f); return rafs.length; }; g.cancelAnimationFrame = () => { rafs.length = 0; };
    const calls = []; g.HS = 150; const c2 = { clearRect() {} }; let boom = false; g.drawHeroFull = (c, x, y, sc, st) => { if (boom) throw new Error('boom'); calls.push({ x, y, sc, st }); };
    const fakeCanvas = html => { const m = html.match(/<canvas data-pehf="([\d.]+)" data-fx="([\d.]+)" data-fy="([\d.]+)" width="(\d+)" height="(\d+)"[^>]*style="[^"]*width:([\d.]+)px/); return m ? { dataset: { pehf: m[1], fx: m[2], fy: m[3] }, width: +m[4], height: +m[5], style: { width: m[6] + 'px' }, getContext: () => c2 } : null; };
    def.open({ from: 1, to: 2, gems: 0 }); await tick(); await tick(); await tick(); const st = window.PEra.state; st.el.querySelectorAll = () => { const f = fakeCanvas(st.el.innerHTML); return f ? [f] : []; };
    window.PEra.go(1); assert.strictEqual(st.step, 'portal'); const html = st.el.innerHTML; assert(/<canvas data-pehf=/.test(html), 'portal: herói é um canvas'); assert(!/kael_run_body/.test(html), 'sem a folha do Kael quando drawHeroFull existe');
    assert(rafs.length >= 1, 'laço agendado'); rafs.shift()(1000); assert(calls.length === 1, 'chamou drawHeroFull'); const k = calls[0]; assert(k.x > 0 && k.y > 0 && k.sc > 0 && k.st && k.st.walking === true && Math.abs(k.st.t - 1) < 0.01, 'unidades: x,y(pés),scale,{t em s, walking}'); assert(rafs.length >= 1, 'laço continua');
    out.push('herói por drawHeroFull: canvas com folga, laço, unidades (x, pés, scale, t, walking)');
    window.PEra.close(); assert.strictEqual(rafs.length, 0, 'fechar para o laço'); out.push('laço para ao fechar');
    boom = true; def.open({ from: 1, to: 2, gems: 0 }); await tick(); await tick(); await tick(); const st2 = window.PEra.state; st2.el.querySelectorAll = () => { const f = fakeCanvas(st2.el.innerHTML); return f ? [f] : []; }; window.PEra.go(1); rafs.shift()(2000);
    assert(!/<canvas data-pehf=/.test(st2.el.innerHTML) && /kael_run_body/.test(st2.el.innerHTML), 'erro: volta para a folha do Kael'); window.PEra.close(); out.push('drawHeroFull com erro: reserva (folha do Kael)');
    delete g.drawHeroFull; def.open({ from: 1, to: 2, gems: 0 }); await tick(); await tick(); await tick(); window.PEra.go(1); assert(/kael_run_body/.test(window.PEra.state.el.innerHTML) && !/<canvas data-pehf=/.test(window.PEra.state.el.innerHTML), 'sem a função: folha do Kael'); window.PEra.close(); out.push('sem drawHeroFull: reserva');
    assert(!/\p{Extended_Pictographic}/u.test(fs.readFileSync(path.join(R, 'js/p_era.js'), 'utf8')), 'sem emoji no arquivo'); out.push('sem emoji em js/p_era.js'); }
  // 6) botões sempre com data-e
  def.open({ from: 1, to: 2, gems: 30 }); await tick(); await tick(); await tick(); for (let i = 0; i < window.PEra.state.steps.length; i++) { window.PEra.go(i); const bt = window.PEra.state.el.innerHTML.match(/<button[^>]*>/g) || []; assert(bt.every(b => /data-e="/.test(b)), 'botão sem ação em ' + window.PEra.state.step); } def.close();
  console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error('FALHOU:', e.message); process.exit(1); });
