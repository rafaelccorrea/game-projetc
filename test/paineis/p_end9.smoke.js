'use strict';
// Teste de fumaça do js/p_end9.js (FIM DAS 9 ERAS: overlay de 4 ou 5 passos que termina em "A jornada continua") em Node.
// Dados REAIS: tabela ERAS do index.html, js/eras9.js (eras 7-8 e nomes dos chefes) e os módulos de js/sys. DOM de mentira.
// Rodar: node test/paineis/p_end9.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'stats', 'eras', 'level', 'skin', 'appearance', 'mount', 'pet', 'tower', 'titles', 'achievements', 'fc'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys; assert(Sys.titles && Sys.level && Sys.mount && Sys.pet && Sys.eras && Sys.stats && Sys.achievements, 'módulos de js/sys carregados');

/* ---------- DOM de mentira ---------- */
let drawn = [];
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : k === 'drawImage' ? (im) => { drawn.push(im && im.src); } : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, attrs: {}, _h: '', textContent: '', className: '', width: 0, height: 0, clientWidth: 390, clientHeight: 844, scrollTop: 0, parentNode: null, handlers: {},
    setAttribute(k, v) { this.attrs[k] = v; }, addEventListener(n, f) { this.handlers[n] = f; }, appendChild(c) { this.children.push(c); c.parentNode = this; return c; }, removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; return c; }, getContext: () => ctx };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const app = mkEl('app'), head = mkEl('head'), canvas = mkEl('e9_cv'), ban = mkEl('e9_ban'), pc = mkEl('e9_pc'); canvas.clientHeight = 388;
const ov = () => app.children[app.children.length - 1] || null;
const H = () => (ov() ? ov().innerHTML : '');
let lastBan = '';
g.document = { head, body: mkEl('body'), createElement: () => mkEl(''), getElementById: id => { const h = H();
    if (id === 'app') return app; if (id === 'e9_css') return head.children.find(c => c.id === 'e9_css') || null;
    if (id === 'e9_cv') return /id="e9_cv"/.test(h) ? canvas : null; if (id === 'e9_pc') return /id="e9_pc"/.test(h) ? pc : null;
    if (id === 'e9_ban') { if (!/id="e9_ban"/.test(h)) return null; if (lastBan !== h) { lastBan = h; ban._h = (/<div class="e9-ban" id="e9_ban"[^>]*>([\s\S]*?)<\/div>\s*<div class="e9-pc"/.exec(h) || ['', ''])[1]; } return ban; } return null; } };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
g.Image = function () { this.complete = true; this.naturalWidth = 512; this.naturalHeight = 512; this.src = ''; };

/* ---------- o jogo de mentira (só o que a tela chama); a tabela de eras é a REAL ---------- */
const host = makeHost({ seed: 9, stage: 91, eraMax: 8, level: 100 }); Sys.host = host;
const newSave = hero => ({ sys: {}, hero: hero || 'kael', gold: 0, gems: 0, inv: [], eq: {}, stage: 1, best: 1, wave: 1, eraMax: 0, kills: 0, skins: [] });
g.S = newSave();
{ const html = fs.readFileSync(path.join(R, 'index.html'), 'utf8'), a = html.indexOf('const ERAS=['), b = html.indexOf('const ieraV'); assert(a > 0 && b > a, 'tabela ERAS achada no index.html');
  g.NEXT_ON = true;   // chave de cenário citada dentro da tabela (não muda nomes nem chefes)
  vm.runInThisContext(html.slice(a, b), { filename: 'index.html#ERAS' }); }
g.RAR = [{ n: 'Básico', c: '#aaa' }, { n: 'Raro', c: '#48f' }, { n: 'Épico', c: '#b6f' }, { n: 'Mítico', c: '#f55' }, { n: 'Lendário', c: '#fc4' }];
g.SKINS = []; g.ERA_MAT = {}; g.WSHAPE = {}; g.toast = () => {};
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/eras9.js'), 'utf8'), { filename: 'eras9.js' });
assert.strictEqual(ERAS.length, 9, 'as 9 eras estão na tabela (js/eras9.js ligado)'); assert.strictEqual(era9Boss(8), 'Juiz Celestial');
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.HS = 155; let mountedNow = null; g.heroLook = () => ({ mount: mountedNow });
const log = []; g.snd = n => log.push(n);
/* FC pedida: a regra do js/diff.js com a chave ligada (última fase × crescimento por fase) e a de hoje (recFC, que volta ao começo da era depois da 90) */
const REC = st => 1000 * Math.pow(1.2, Math.min(st, 90)), fcGrow = st => Math.round(REC(st) * Math.pow(1.03, Math.max(0, st - 90))), fcToday = st => Math.round(REC(81 + ((st - 1) % 10)));
g.fcNeed = fcGrow; let myFc = 5e9; g.heroFC = () => myFc; g.fcShow = v => (Sys.fc && Sys.fc.viewText ? Sys.fc.viewText(v) : g.n0(v));
g.B = { res: null, running: true, act: 1, banner: 1, eshots: [1] };
g.PANEL_ON = {}; let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; d.name = n; this.defs[n] = d; return d; }, on(n) { return !!g.PANEL_ON[n] && !!this.defs[n]; },
  open(n, o) { if (!this.on(n)) return false; const d = this.defs[n]; return d.overlay ? (d.open ? d.open(o || {}) : false) : false; } };   // a mesma regra do js/panels.js para overlay
let drew = []; const okDraw = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; }; g.drawHeroFull = okDraw;

const SRC = fs.readFileSync(path.join(R, 'js/p_end9.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_end9.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = x => ({ dataset: { x } });
const E = g.PEnd9.state, step = () => E.steps[E.i];
const seenActs = new Set(), seenImgs = new Set(), NO_END = /fim\s+d[eo]\s+jogo|game\s*over|fim\s+da\s+jornada/i;
const banNow = () => { const b = g.document.getElementById('e9_ban'); return b ? b.innerHTML : ''; };
function check(tag) { const h = H() + banNow(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto'); seenActs.add(b.dataset.x); }
  for (const m of h.matchAll(/data-x="([^"]+)"/g)) assert(def.actions.includes(m[1]), tag + ': data-x sem tratamento: ' + m[1]);
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!NO_END.test(h), tag + ': a tela fala em fim do jogo: ' + (NO_END.exec(h) || [''])[0]);
  assert(!/R\$|comprar|sorteio pago|última chance|só hoje|oferta/i.test(h), tag + ': preço, compra ou pressão');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { if (m[1].charAt(0) === '#') continue;   /* degradê interno do emblema (SVG), não é arquivo */ assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
function frame(ms) { assert(raf.length >= 1, 'o laço do palco está rodando'); drew = []; drawn = []; const f = raf.shift(); f(ms); return drew; }
const open = o => { if (E.open) def.close(); g.B.res = null; g.B.running = true; assert.strictEqual(g.Panels.open('end9', o || {}), true, 'abriu por Panels.open'); };
/* save avançado: venceu a fase 90 (o jogo já está na 91), com pets, montarias, torre e os títulos que o módulo dá */
function advSave(hero) { const S = newSave(hero); S.stage = 91; S.best = 91; S.eraMax = 8; S.kills = 486000; S.playSeconds = 214 * 3600 + 120; g.S = S;
  Sys.level.ensure(S).lvl = 112; Sys.titles.ensure(S).bosses = 1240; S.sys.tower = { best: 37 };
  const mo = Sys.mount.ensure(S), md = Sys.mount.DATA.mounts[0]; mo.owned[md.id] = { stars: 1, frags: 0, lvl: 1, gold: 0 }; mo.eq = md.id;
  const po = Sys.pet.ensure(S), pd = Sys.pet.DATA.pets[0]; po.owned[pd.id] = { stars: 1, frags: 0, lvl: 1 }; po.eq = pd.id; Sys.pet.ensure(S); Sys.mount.ensure(S);
  Sys.titles.check(S, host, { silent: true }); return { md, pd }; }

// 0) registro
assert.strictEqual(addName, 'end9'); assert.strictEqual(g.PANEL_ON.end9, false, 'a chave nasce desligada'); assert(def.overlay === true && typeof def.open === 'function' && typeof def.close === 'function' && typeof def.click === 'function');
assert.strictEqual(g.Panels.open('end9', {}), false, 'desligada: Panels.open não abre nada'); assert.strictEqual(app.children.length, 0);
assert(!/PANEL_ON\.\w+\s*=\s*true|\.on\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma'); assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
assert(!/fim\s+d[eo]\s+jogo/i.test(SRC), 'o arquivo nunca escreve fim do jogo'); assert(!/ellipsis/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/R\$/.test(SRC));
assert(!/\bS\.(sys\.)?[\w.]+\s*(=(?!=)|\+\+|\+=)/.test(SRC), 'a tela não escreve no save');
for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
for (const m of SRC.matchAll(/'(assets\/[^']+\.(?:png|webp))'/g)) assert(fs.existsSync(path.join(R, m[1])), 'imagem citada no arquivo não existe: ' + m[1]);
for (const f of ['sky', 'far', 'ground']) assert(fs.existsSync(path.join(R, 'assets/bg/v2/era8/' + f + '.webp')), 'camada do cenário da era 8: ' + f);
assert(fs.existsSync(path.join(R, 'assets/enemies/era8_boss.png')), 'arte do chefe da era 8');
g.PANEL_ON.end9 = true;   // só neste teste
out.push('registro: end9 é overlay, nasce desligada (Panels.open devolve false), ' + def.actions.length + ' ações com tratador, sem diálogo, sem emoji, sem "fim do jogo"');

// 1) SAVE NOVO (nada conquistado): abre, pausa a batalha, anda pelos passos e termina em "A jornada continua"
{ g.S = newSave(); open(); assert.strictEqual(g.B.res && g.B.res.mode, 'end9', 'o jogo fica parado'); assert.strictEqual(g.B.running, false);
  assert.strictEqual(app.children.length, 1); assert.strictEqual(ov().className, 'e9-ov'); assert.strictEqual(ov().attrs.role, 'dialog'); assert(!NO_END.test(ov().attrs['aria-label']));
  assert.deepStrictEqual(E.steps, ['boss', 'eras', 'sum', 'next'], 'sem prêmio entregue, o passo de prêmios não existe');
  has('<b>Juiz Celestial</b> caiu. Era o Senhor da Era Celestial'); has('<b>90</b> de 90'); has('Celestial'); has('id="e9_cv"'); has('data-x="skip"'); has('>1/4<');
  has('url(assets/bg/v2/era8/sky.webp)'); has('url(assets/bg/v2/era8/far.webp)'); has('url(assets/bg/v2/era8/ground.webp)');
  has('FC pedida na fase 90'); has(g.fcShow(fcGrow(90))); has(g.fcShow(myFc)); check('novo: chefe');
  assert(/class="e9-tap">Juiz Celestial cai</.test(banNow()), 'antes de o chefe sumir a faixa ainda não entrou');
  def.click(btn('next')); assert.strictEqual(step(), 'eras'); has('As 9 eras concluídas'); assert.strictEqual((H().match(/class="e9-em"/g) || []).length, 9, '9 emblemas');
  for (let i = 0; i < 9; i++) has('>' + g.esc2(ERAS[i].n) + '</b>'); has('>Javali<'); has('>Senhor do Submundo<'); has('>Juiz Celestial<'); has('9 de 9 eras'); check('novo: eras');
  def.click(btn('next')); assert.strictEqual(step(), 'sum'); has('Sua jornada até aqui'); has('90 de 90'); has('9 de 9'); not('Chefes vencidos'); not('Tempo de jogo'); check('novo: resumo');
  def.click(btn('next')); assert.strictEqual(step(), 'next'); has('A jornada continua'); has('Seguir para a fase 91'); has('fases sem fim'); not('data-x="skip"'); has('data-x="again"'); has('>4/4<'); check('novo: jornada');
  def.click(btn('next')); assert.strictEqual(step(), 'next', 'no último passo o toque no cenário não sai da tela');
  out.push('save novo: 4 passos (sem prêmios), eras e chefes da tabela real, termina em "A jornada continua" com "Seguir para a fase 91"'); }

// 2) SAVE AVANÇADO: resumo e prêmios vêm dos módulos; 5 passos
{ const { md, pd } = advSave(); const T = Sys.titles, before = JSON.stringify(g.S); let done = 0;
  open({ stage: 90, gems: 10, onDone: () => { done++; } }); assert.deepStrictEqual(E.steps, ['boss', 'eras', 'sum', 'prize', 'next']);
  has('Kael em ' + g.esc2(md.name)); has('pet ' + g.esc2(pd.name)); check('avançado: chefe');
  def.click(btn('next')); def.click(btn('next')); assert.strictEqual(step(), 'sum');
  has('Chefes vencidos'); has(g.n0(1240)); has(g.n0(486000)); has('>112<'); has('máximo ' + Sys.level.DATA.maxLevel); has('em uso: ' + g.esc2(md.name)); has('em uso: ' + g.esc2(pd.name)); has('214 h'); has('>37<');
  { const own = T.DATA.titles.filter(t => T.isUnlocked(g.S, t.id)).length; assert(own > 0); has(own + ' de ' + T.DATA.titles.length); } check('avançado: resumo');
  def.click(btn('next')); assert.strictEqual(step(), 'prize'); has('+10 diamantes'); has('Pela vitória na fase 90');
  { const t70 = T.DATA.titles.find(t => t.id === 'stage70'); assert(T.isUnlocked(g.S, 'stage70'), 'o módulo deu o título da fase 70'); has('Título: ' + t70.name); assert(H().includes(g.esc2(T.bonusText(t70, T.featured(g.S) && T.featured(g.S).id === 'stage70' ? T.DATA.featuredMult : 1))), 'bônus do título vem do Sys.titles');
    has('Título: ' + T.DATA.titles.find(t => t.id === 'era6').name); }
  has('Nada sorteado'); not('Conquista:'); assert.strictEqual(Sys.achievements.DATA.on, false, 'conquistas desligadas no jogo: a linha não aparece');
  not('Lenda das 9 Eras'); not('Nove Eras'); not('Luz das Eras'); check('avançado: prêmios');
  def.click(btn('next')); assert.strictEqual(step(), 'next'); has('A jornada continua'); has('Seguir para a fase 91');
  // sem marco informado pelos módulos: a próxima fase e a FC que ela pede
  has('Próxima fase: 91'); has(g.fcShow(fcGrow(91))); not('Próximo marco'); not('Marco 100'); not('Forja Astral'); has('O que continua crescendo'); has('Nível do herói: <b>112</b> de ' + Sys.level.DATA.maxLevel);
  // FC pedida das próximas fases: os valores são os do fcNeed do jogo
  for (const s of [91, 100, 120, 150]) { has('Fase ' + s + '<'); has(g.fcShow(fcGrow(s))); } check('avançado: jornada');
  assert.strictEqual(JSON.stringify(g.S), before, 'abrir e andar pelos passos não escreve no save');
  // AÇÕES: Ver de novo volta ao começo; Pular vai ao fim; Seguir fecha, devolve a batalha e avisa quem chamou
  def.click(btn('again')); assert.strictEqual(step(), 'boss'); has('>1/5<'); def.click(btn('skip')); assert.strictEqual(step(), 'next'); has('>5/5<');
  assert.strictEqual(def.click(btn('nada')), false, 'ação desconhecida é ignorada');
  def.click(btn('cont')); assert.strictEqual(E.open, false); assert.strictEqual(app.children.length, 0, 'o overlay saiu da tela'); assert.strictEqual(g.B.res, null); assert.strictEqual(g.B.running, true, 'a batalha volta'); assert.strictEqual(done, 1, 'onDone chamado uma vez');
  assert.strictEqual(raf.length, 0, 'fechar para o laço'); assert.strictEqual(def.click(btn('next')), false, 'fechada, não trata toque'); assert.strictEqual(def.close(), false);
  out.push('save avançado: 5 passos; resumo (chefes, abates, nível, pet, montaria, torre, títulos, horas) e prêmios (diamantes da vitória, títulos de fase e de era) vindos dos módulos; save intacto; Seguir fecha e devolve a batalha'); }

// 3) PRÓXIMO MARCO: o de quem chama ou o próximo título de fase do Sys.titles; prêmios extras só os entregues por quem chama
{ advSave(); open({ milestone: { stage: 100, rewards: ['Título Marco 100', '30 diamantes'] }, prizes: [{ title: 'Título: Lenda das 9 Eras', text: 'Entregue pelo correio' }] }); def.click(btn('skip'));
  has('Próximo marco: fase 100'); has('faltam 10 fases'); has('Título Marco 100'); has('30 diamantes'); has('aria-valuenow="4"'); not('Próxima fase: 91'); check('marco de quem chama');
  def.click(btn('again')); assert(E.steps.includes('prize')); def.click(btn('next')); def.click(btn('next')); def.click(btn('next')); has('Título: Lenda das 9 Eras'); has('Entregue pelo correio'); check('prêmio de quem chama');
  // título de fase novo no módulo (só na memória deste teste): vira o marco sozinho
  const T = Sys.titles, extra = { id: 'stage100x', name: 'Marco de teste', cond: { type: 'stage', n: 100 }, bonus: { atkPct: 2 }, r: 0 }; T.DATA.titles.push(extra);
  try { open(); def.click(btn('skip')); has('Próximo marco: fase 100'); has('Título Marco de teste: ' + g.esc2(T.bonusText(extra, 1))); check('marco do Sys.titles'); } finally { T.DATA.titles.pop(); }
  open({ milestone: { stage: 80 } }); def.click(btn('skip')); has('Próxima fase: 91'); not('Próximo marco');   // marco já passado não vale
  out.push('próximo marco: o informado por quem chama, ou o próximo título de fase do Sys.titles; sem nenhum, "Próxima fase: 91" com a FC pedida'); }

// 4) FC de hoje (chave da dificuldade desligada: depois da 90 a FC recomendada não cresce): o quadro "FC pedida" das próximas fases some
{ advSave(); g.fcNeed = fcToday; try { open(); def.click(btn('skip')); not('cresce a cada fase'); has('Próxima fase: 91'); has('A jornada continua'); check('FC de hoje'); } finally { g.fcNeed = fcGrow; }
  const f0 = g.fcNeed, h0 = g.heroFC; delete g.fcNeed; delete g.heroFC; try { open(); has('caiu. Era o Senhor'); not('FC pedida'); check('sem FC');   /* a sua FC ainda pode vir do Sys.fc.compute */ def.click(btn('skip')); has('Seguir para a fase 91'); check('sem FC: jornada'); } finally { g.fcNeed = f0; g.heroFC = h0; }
  out.push('FC: com a regra de hoje o quadro das próximas fases não aparece; sem a função da FC pedida a tela não mostra FC pedida nenhuma'); }

// 5) Conquistas ligadas (só neste teste): a linha da conquista de era aparece com o nível do módulo
{ advSave(); const A = Sys.achievements; A.DATA.on = true; try { open(); assert(E.steps.includes('prize')); def.click(btn('next')); def.click(btn('next')); def.click(btn('next')); assert.strictEqual(step(), 'prize');
    const a = A.DATA.list.find(x => x.id === 'era'); has('Conquista: ' + a.name + ' (nível ' + a.tiers.filter(x => 8 >= x).length + ' de ' + a.tiers.length + ')'); has('Prêmio pronto para resgatar em Missões'); check('conquistas ligadas'); } finally { A.DATA.on = false; } }
// 6) Kaia
{ advSave('kaia'); open(); has('Kaia em '); not('Kael'); def.click(btn('next')); def.click(btn('next')); has('Kaia · nível 112'); check('Kaia'); }
out.push('chaves e herói: Sys.achievements ligado mostra a conquista de era; a Kaia aparece com o nome dela');

// 7) PALCO: um herói por quadro pela rota do jogo; o chefe é desenhado e some; a faixa entra depois; montado fica menor
{ advSave(); open(); mountedNow = null; let d = frame(1000); assert.strictEqual(d.length, 1, 'um herói por quadro'); assert(d[0].k > 0 && isFinite(d[0].k)); assert(d[0].st.t >= 0);
  assert(drawn.some(u => /era8_boss\.png/.test(u || '')), 'o chefe da era 8 é desenhado no 1º passo'); const xBoss = d[0].x, kFoot = d[0].k;
  assert(/e9-tap/.test(banNow()) && !/e9-rib/.test(banNow())); d = frame(1000 + 2500); assert(/class="e9-rib e9-lil "/.test(banNow()) && /Juiz Celestial derrotado/.test(banNow()), 'a faixa entra quando o chefe some'); check('faixa do chefe');
  frame(1000 + 5000); assert(!drawn.some(u => /era8_boss/.test(u || '')), 'depois de sumir o chefe não é mais desenhado');
  def.click(btn('next')); for (let i = 0; i < 40; i++) d = frame(7000 + i * 100); assert(d[0].x > xBoss, 'depois do 1º passo o herói vai para o centro'); assert(!drawn.some(u => /era8_boss/.test(u || '')));
  assert(E.cf.length > 0, 'confete na festa'); def.click(btn('skip')); assert.strictEqual(E.cf.length, 0, 'no último passo o confete para');
  mountedNow = { id: 'x', stars: 1 }; d = frame(20000); assert(d[0].k < kFoot, 'montado: herói menor para caber'); mountedNow = null;
  assert(/margin-top:-\d+px/.test(H()) && /class="e9-ban" id="e9_ban"/.test(H()), 'a faixa fica na emenda, abaixo dos pés do herói');
  out.push('palco: herói pela rota única (um por quadro), chefe some na luz, faixa entra depois, confete só na festa'); }

// 8) o desenho do jogo falha ou não existe: retrato parado, sem exceção
{ advSave(); g.drawHeroFull = () => { throw new Error('boom'); }; open(); has('id="e9_cv"'); const f = raf.shift(); try { f(16); } catch (e) { assert.fail('exceção no laço: ' + e.message); }
  not('id="e9_cv"'); assert(/<img class="e9-still" src="assets\/hero\/avatar\/[\w]+\.png"/.test(H()), 'reserva: retrato parado'); has('Juiz Celestial derrotado'); check('reserva');
  delete g.drawHeroFull; open(); not('id="e9_cv"'); has('e9-still'); check('sem drawHeroFull'); def.click(btn('skip')); has('Seguir para a fase 91'); g.drawHeroFull = okDraw; }
// 9) CARGA DAS IMAGENS antes de desenhar (window.Preload): espera, depois desenha; fechar no meio não desenha
{ advSave(); let asked = null, res = null; g.Preload = { has: () => false, ready(l) { asked = l.slice(); return new Promise(r => { res = r; }); } };
  open(); assert(/class="e9-wait"/.test(H()) && !/e9-scene/.test(H()), 'enquanto carrega, só o fundo'); for (const f of ['sky', 'far', 'ground']) assert(asked.includes('assets/bg/v2/era8/' + f + '.webp')); assert(asked.includes('assets/enemies/era8_boss.png'));
  for (const u of asked) assert(fs.existsSync(path.join(R, u)), 'imagem pedida existe: ' + u);
  res({ ok: true, failed: [] }); }
(async () => {
  await new Promise(r => setImmediate(r)); has('e9-scene'); has('caiu. Era o Senhor'); check('depois da carga');
  { let res = null; g.Preload = { has: () => false, ready() { return new Promise(r => { res = r; }); } }; open(); def.close(); res({ ok: false, failed: ['x'] }); await new Promise(r => setImmediate(r)); assert.strictEqual(app.children.length, 0, 'fechada durante a carga: nada é desenhado'); }
  { g.Preload = { has: () => true, ready() { assert.fail('tudo pronto: não espera'); } }; open(); has('e9-scene'); delete g.Preload; assert.strictEqual(g.PEnd9.preload(), true); }
  out.push('reservas: desenho do jogo com erro ou ausente vira retrato parado; imagens pedidas ao Preload antes de desenhar (as 3 camadas da era 8 e o chefe)');

  // 10) telas de 320 e 390 px, baixa e alta: desenha igual; grades com minmax(0,1fr); nada com largura fixa maior que a tela
  { const css = head.children.map(c => c.textContent).join(''); assert(/\.e9-eras\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(css)); assert(/\.e9-stats\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/.test(css));
    assert(/\.e9-ov \.e9-bt,\.xs \.e9-bt\{[^}]*color:#1c1206/.test(css), 'botão dourado com texto escuro, também com .xs'); assert(/\.e9-ov \.e9-skip\{[^}]*min-height:40px/.test(css), 'toque de 40 px no Pular');
    assert(!/white-space:nowrap/.test(css.replace(/\.e9-pill\{[^}]*\}/, '')), 'só o contador de passos não quebra linha');
    for (const m of css.matchAll(/(?:^|[;{])(?:min-)?width:(\d+)px/g)) assert(+m[1] <= 64, 'largura fixa pequena: ' + m[0]);
    for (const [w, h] of [[320, 568], [390, 844], [360, 640]]) { advSave(); open({ gems: 10 }); ov().clientWidth = w; ov().clientHeight = h; for (let i = 0; i < E.steps.length; i++) { g.PEnd9.go(i); check(w + 'x' + h + ' ' + step()); const sh = +(/class="e9-scene" data-x="next" style="height:(\d+)px"/.exec(H()) || [0, 0])[1]; assert(sh >= 250 && sh <= h * 0.5 + 1, 'cenário cabe em ' + h + ': ' + sh); } } }
  // 11) todos os botões de todos os passos, save novo e avançado: tocar não gera exceção
  { let taps = 0; for (const mk of [() => { g.S = newSave(); }, () => { advSave(); }]) { mk(); open({ gems: 10 }); const n = E.steps.length;
      for (let s = 0; s < n; s++) { g.PEnd9.go(s); const nb = buttons().length; for (let i = 0; i < nb; i++) { if (!E.open) open({ gems: 10 }); g.PEnd9.go(s); const b = buttons()[i]; try { def.click(b); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } if (E.open) check('toque ' + b.dataset.x); } } }
    const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
    if (E.open) def.close();
    out.push('toques: ' + taps + ' botões tocados sem exceção; ' + seenActs.size + ' ações com botão e tratamento; ' + seenImgs.size + ' imagens citadas existem em disco'); }
  console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
