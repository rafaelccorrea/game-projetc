'use strict';
// Teste de fumaça do js/p_pets2.js (tela PETS V2: herói no palco com o pet na frente, prévia no herói, alimentar, evoluir) em Node.
// Módulos REAIS de js/sys (pet, fc, stats, level, loot); DOM de mentira. Rodar: node test/paineis/p_pets2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'stats', 'forge', 'level', 'fc', 'pet'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) { console.error('módulo ' + m + ': ' + e.message); } });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const StageKit = require(path.join(R, 'js/stagekit.js')); g.StageKit = StageKit;

// ---------- DOM de mentira ----------
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 200, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const canvas = mkEl('p2_cv');
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => id === 'p2_cv' && /id="p2_cv"/.test(H()) ? canvas : null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let clock = 1700000000000; const realNow = Date.now; Date.now = () => clock;

// ---------- o jogo de mentira (só o que a tela chama) ----------
const host = makeHost({ seed: 7, stage: 31, eraMax: 3, level: 25 }); g.Sys.host = host;
const realLevel = g.Sys.level; let LV = 25; g.Sys.level = Object.assign({}, realLevel, { level: () => LV }); host.level = () => LV;
g.S = { sys: {}, hero: 'kael' };
g.RAR = [{ n: 'Básico' }, { n: 'Raro' }, { n: 'Épico' }, { n: 'Mítico' }, { n: 'Lendário' }]; g.RN = i => g.RAR[i] ? g.RAR[i].n : '';
g.n0 = v => Math.round(v).toLocaleString('pt-BR'); g.p1 = v => String(Math.round(v * 10) / 10).replace('.', ',') + '%'; g.gNum = v => g.n0(v);
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'pets2'; g.HS = 155; g.heroLook = () => ({ mount: null });
// FC: a conta de verdade do Sys.fc quando ela roda com este save de teste; senão uma base fixa + a parte do pet que o módulo informa
let fcReal = false; try { fcReal = g.Sys.fc.compute(g.S, host) > 0; } catch (e) { fcReal = false; }
if (!fcReal) g.Sys.fc = { compute: S => { const b = g.Sys.pet.bonus(S); return 50000 * (1 + (b.petAtk + b.petBond) / 200); }, viewText: v => g.n0(v) };
g.heroFC = () => g.Sys.fc.compute(g.S, host); g.fcTxt = v => (g.Sys.fc.viewText ? g.Sys.fc.viewText(v) : g.n0(v));
let changed = 0, saved = 0; const opened = []; g.snd = () => {}; g.statsChanged = () => { changed++; }; g.save = () => { saved++; };
let def = null; g.render = () => def.render(); g.Screens = { close() { g.closed = (g.closed || 0) + 1; } };
g.PANEL_ON = {}; let panelOk = true; g.Panels = { add(n, d) { def = d; def.__name = n; return d; }, on: () => panelOk, open(n, o) { opened.push(n + (o && o.from ? '@' + o.from : '')); return true; } };
let drew = []; g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };

vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_pets2.js'), 'utf8'), { filename: 'p_pets2.js' });
assert(def && def.__name === 'pets2' && def.render && def.click && def.tick && def.onOpen && def.onClose, 'painel pets2 registrado');
assert.strictEqual(g.PANEL_ON.pets2, false, 'a chave nasce DESLIGADA');

// ---------- ajudantes ----------
const P = g.Sys.pet, D = P.DATA, out = [];
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
const has = s => assert(H().includes(s), 'faltou: ' + s); const not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const noPv = () => not('class="p2-who pv"');   // a faixa "Prévia: X · Sair" do palco (o aviso passageiro pode citar a palavra)
const seenActs = new Set(), seenImgs = new Set();
// toda tela desenhada passa por aqui: botões com ação tratada, zero emoji, nada quebrado, imagens em disco, nada de diálogo
function check(tag) {
  const h = H(), bt = h.match(/<button\b[^>]*>/g) || [];
  for (const b of bt) { const m = /data-x="([^"]+)"/.exec(b); assert(m, tag + ': botão sem data-x: ' + b); assert(def.actions.includes(m[1]), tag + ': ação sem tratamento: ' + m[1]); seenActs.add(m[1]); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{30}(undefined|NaN|\[object|>null<|Infinity).{30}/.exec(h) || [''])[0]);
  assert(!/\b(alert|confirm|prompt)\(/.test(h), tag + ': diálogo do navegador'); assert(!/comprar|sorteio pago|R\$/i.test(h), tag + ': texto de venda');
  const imgs = [...h.matchAll(/(?:src="|url\()([^")]+)/g)].map(m => m[1]);
  for (const u of imgs) { assert(fs.existsSync(path.join(R, u)), tag + ': imagem não existe: ' + u); seenImgs.add(u); }
  // QA 320 px: nenhum texto cortado com reticências (nem por estilo na própria marca) e nenhum aviso dentro do palco (o aviso fica no rodapé, fora do herói)
  assert(!/text-overflow\s*:\s*ellipsis/.test(h), tag + ': reticências no HTML');
  const sg = stageSeg(h); if (sg) { assert(!/p2-toast|p2-mbn|p2-fly|role="status"|role="alert"/.test(sg.in), tag + ': aviso dentro do palco');
    const ni = h.indexOf('class="p2-notes"'); assert(ni > sg.b, tag + ': a faixa de avisos fica depois (fora) do palco');
    for (const c of ['p2-toast', 'p2-mbn', 'p2-fly']) { const i = h.indexOf('class="' + c); if (i >= 0) { assert(i > ni, tag + ': ' + c + ' fora da faixa de avisos'); seenNotes.add(c); } } }
  return bt.length; }
// o trecho do HTML que é o palco (do <div class="p2-stage"> até o </div> que o fecha)
function stageSeg(h) { const a = h.indexOf('<div class="p2-stage"'); if (a < 0) return null; const re = /<div\b|<\/div>/g; re.lastIndex = a; let d = 0, m;
  while ((m = re.exec(h))) { d += m[0] === '</div>' ? -1 : 1; if (d === 0) return { a, b: re.lastIndex, in: h.slice(a, re.lastIndex) }; } return null; }
const seenNotes = new Set();
const CSS = () => g.document.head.children.map(c => c.textContent).join('\n');
const rule = sel => { const css = CSS(), i = css.indexOf('\n' + sel + '{'); assert(i >= 0, 'regra de estilo ausente: ' + sel); return css.slice(i + 1, css.indexOf('}', i) + 1); };
// um quadro do palco: devolve o state entregue ao drawHeroFull
function frame() { assert(raf.length >= 1, 'o laço do palco está rodando'); drew = []; const f = raf.shift(); f(1000); assert.strictEqual(drew.length, 1, 'um desenho por quadro'); return drew[0].st; }
const sheetsOk = base => ['idle', 'run', 'atk1'].forEach(k => ['.png', '.json'].forEach(x => assert(fs.existsSync(path.join(R, 'assets/anim/pets/' + base + '_' + k + x)), 'folha não existe: ' + base + '_' + k + x)));
const o = () => P.ensure(g.S);

// 1) módulo desligado (sem a 17b): "Pets: em breve", nenhum botão
def.onOpen(); def.render(); has('Pets: em breve'); assert.strictEqual(check('desligado'), 0); out.push('módulo sem a tela 17b: "Pets: em breve"');
// liga como o jogo liga (petBoot do js/petfx.js)
D.v3 = true; D.v20.on = true; P.setV17(true);
// 2) antes do nível: portão com Voltar
LV = 5; def.onOpen(); def.render(); has('Libera no nível ' + D.v20.unlockLevel); has('Voltar'); check('portão'); def.click(btn('pet', { id: 'wolf' })); def.click(btn('back')); assert.strictEqual(g.closed, 1); LV = 25; out.push('antes do nível: portão com Voltar');

// 3) save novo, SEM pet
g.S = { sys: {}, hero: 'kael' }; o().first = true;   // 1º ovo já resolvido (aqui o teste é a tela sem pet)
def.onOpen(); def.render(); has('PODER (FC)'); has('Você ainda não tem pet'); has('id="p2_cv"'); has('Pets <b>0/11</b>');
assert.strictEqual((H().match(/data-x="pet"/g) || []).length, 11, '11 pets na grade');
['Mamute', 'Esfinge', 'Dragão', 'Papagaio-fênix', 'Cão mecânico', 'Lobo sombrio', 'Falcão de guerra', 'Pantera espectral', 'Cérbero', 'Pégaso', 'Raposa de cristal'].forEach(has);
['Escorpião', 'Corvo', 'Grifo', 'Fênix<', 'Golem'].forEach(not);   // pet sem arte aprovada (ou fora do jogo) não aparece
assert(/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/.test(g.document.head.children.map(c => c.textContent).join('')), 'grade com minmax(0,1fr)');
check('sem pet'); { const st = frame(); assert.strictEqual(st.pet, false, 'sem pet: nada inventado no herói'); assert(st.t >= 0); }
out.push('save novo sem pet: desenha, 11 pets na grade, herói sem pet');

// 4) "em breve" = o MÓDULO não libera (avail): aparece marcado, sem prévia e sem equipar
const soonIds = D.pets.filter(p => ['underworld', 'celestial', 'prism'].includes(p.id) && !P.avail(p, host)).map(p => p.id); assert.deepStrictEqual(soonIds.sort(), ['celestial', 'prism', 'underworld'], 'o módulo não libera os 3');
assert.strictEqual((H().match(/, em breve"/g) || []).length, 3, 'só os 3 que o módulo não libera aparecem como em breve');
assert.strictEqual((H().match(/>em breve</g) || []).length, 3);
for (const id of soonIds) { def.click(btn('pet', { id })); has('EM BREVE'); has('Em breve: este pet ainda não está no jogo.'); noPv(); check('em breve ' + id); assert.strictEqual(frame().pet, false, id + ': sem prévia no herói');
  assert.strictEqual(P.equip(g.S, id), false, id + ': o módulo não equipa'); assert.strictEqual(o().eq, null); assert(!o().owned[id]); def.click(btn('stg', { i: 2 })); assert.strictEqual(frame().pet, false); }
def.click(btn('sair')); not('EM BREVE'); out.push('em breve: Cérbero, Pégaso e Raposa (Sys.pet.avail = não), sem prévia e sem equipar');

// 5) PRÉVIA no herói: liga, troca de estágio, desliga; o save não muda
{ const before = JSON.stringify(g.S);
  def.click(btn('pet', { id: 'falcon' })); has('<span>Prévia: Falcão de guerra'); has('data-x="sair"'); has('PRÉVIA'); has('você ainda não tem'); has('Como conseguir'); has(g.esc2(D.pets.find(p => p.id === 'falcon').src[0])); not('role="dialog"'); check('prévia');
  let st = frame(); assert.deepStrictEqual({ base: st.pet.base, stage: st.pet.stage }, { base: 'pet_falcon', stage: 1 }); assert(st.pet.fly > 0, 'o falcão voa (tabela do módulo)'); sheetsOk(st.pet.base);
  has('data-x="go" data-to="tower"'); opened.length = 0; def.click(btn('go', { to: 'tower' })); assert.deepStrictEqual(opened, ['tower@pets2'], 'Ir: Torre abre a tela com volta para Pets');
  def.click(btn('stg', { i: 2 })); st = frame(); assert.deepStrictEqual({ base: st.pet.base, stage: st.pet.stage }, { base: 'pet_falcon_evo', stage: 3 }); sheetsOk(st.pet.base); check('prévia estágio 3');
  def.click(btn('pet', { id: 'drake' })); has('<span>Prévia: Dragão'); assert.strictEqual(frame().pet.base, 'era2_dragon'); has('data-x="go" data-to="tower"');   // também sai do andar 100 da Torre (Sys.pet.DATA.v17.tower100)
  def.click(btn('pet', { id: 'golem' })); has('<span>Prévia: Cão mecânico'); assert.strictEqual(frame().pet.base, 'era4_mechdog'); not('data-x="go"');   // só ovo do chefe da era: sem tela de destino
  def.click(btn('sair')); noPv(); assert.strictEqual(frame().pet, false);
  def.click(btn('pet', { id: 'falcon' })); def.click(btn('pet', { id: 'falcon' })); noPv();   // tocar de novo também sai
  panelOk = false; def.click(btn('pet', { id: 'falcon' })); not('data-x="go"'); def.click(btn('go', { to: 'tower' })); has('ainda não está disponível'); panelOk = true; def.click(btn('sair'));
  assert.strictEqual(JSON.stringify(g.S), before, 'a prévia não escreve no save'); }
out.push('prévia: liga no herói (faixa "Prévia: X · Sair"), troca de estágio, sai; save intacto; botão Ir só com a tela de destino ligada');

// 6) pet EQUIPADO em cada estágio
const SN = D.v3d.stages.map(s => s.name), SUF = ['', '_mid', '_evo'];
o().owned.wolf = { stars: 1, frags: 0, lvl: 1 }; o().eq = 'wolf'; o().food = 5000;
for (let i = 0; i < 3; i++) { const x = o().owned.wolf; x.stg = i; x.lvl = D.v17.stageReq[i]; def.onOpen(); def.render();
  has('ATIVO'); has('Mamute ' + SN[i]); has('Usando'); has('Nv ' + D.v17.stageReq[i] + '/'); check('equipado ' + SN[i]);
  const st = frame(); assert.deepStrictEqual({ base: st.pet.base, stage: st.pet.stage }, { base: 'era0_mammoth' + SUF[i], stage: i + 1 }, 'estágio de verdade na frente do herói'); sheetsOk(st.pet.base);
  assert(/assets\/pets\/era0_mammoth_(ref|mid|evo)\.png/.test(H())); }
has('Evoluído'); has('forma final'); out.push('pet equipado nos 3 estágios: o herói recebe a folha certa (base, _mid, _evo)');

// 7) ALIMENTAR chama o módulo e muda o estado
{ const x = o().owned.wolf; x.stg = 0; x.lvl = 1; delete x.fx; def.onOpen(); def.render(); has('até ' + D.v17.tapFood + ' de ração');
  const f0 = P.feedTap; let calls = 0; P.feedTap = function () { calls++; return f0.apply(P, arguments); };
  const food0 = o().food, c0 = changed; def.click(btn('feed')); assert.strictEqual(calls, 1, 'Alimentar chama Sys.pet.feedTap'); assert(o().food < food0, 'gastou ração'); assert(o().owned.wolf.lvl === 2 || (o().owned.wolf.fx | 0) > 0, 'a barra ou o nível mudou');
  let guard = 0; while (o().owned.wolf.lvl < 3 && guard++ < 50) def.click(btn('feed')); assert.strictEqual(o().owned.wolf.lvl, 3, 'subiu de nível tocando'); assert(changed > c0, 'subir de nível atualiza o poder (statsChanged)'); has('subiu para o Nv 3'); has('Poder antes e depois'); check('alimentar');
  o().food = 0; def.render(); has('sem ração'); calls = 0; def.click(btn('feed')); has('Sem ração'); assert.strictEqual(o().owned.wolf.lvl, 3);
  o().food = 5000; o().owned.wolf.lvl = D.v17.stageCap[0]; def.render(); has('evolua primeiro'); calls = 0; def.click(btn('feed')); assert.strictEqual(calls, 0, 'no teto do estágio não alimenta'); has('Teto do estágio'); assert.strictEqual(o().owned.wolf.lvl, D.v17.stageCap[0]);
  P.feedTap = f0; }
out.push('alimentar: Sys.pet.feedTap, ração e nível mudam; sem ração e teto do estágio explicam o motivo');

// 8) EVOLUIR chama o módulo, muda o estágio e troca o pet no herói no meio do clarão
{ const x = o().owned.wolf; x.stg = 0; x.lvl = 5; def.onOpen(); def.render(); has('no Nv ' + D.v17.stageReq[1]); def.click(btn('evo')); assert.strictEqual(pStg(), 0, 'sem o nível não evolui'); has('Precisa do Nv ' + D.v17.stageReq[1]);
  x.lvl = D.v17.stageReq[1]; def.onOpen(); def.render(); has('EVOLUIR'); has('Evoluir para ' + SN[1]); has('1 pronto para evoluir');
  const e0 = P.evolve; let calls = 0; P.evolve = function () { calls++; return e0.apply(P, arguments); };
  def.click(btn('evo')); assert.strictEqual(calls, 1, 'Evoluir chama Sys.pet.evolve'); assert.strictEqual(pStg(), 1, 'estágio mudou no save'); has(SN[1] + '</span>'); has('evoluiu para ' + SN[1]); has('p2-flash'); check('evoluir');
  assert.strictEqual(frame().pet.base, 'era0_mammoth', 'nos primeiros 0,7 s o herói ainda mostra o estágio antigo'); clock += 800; assert.strictEqual(frame().pet.base, 'era0_mammoth_mid', 'depois troca para o estágio novo');
  def.render(); has(SN[1].toUpperCase() + '!'); has('class="p2-mbn'); check('estágio novo'); clock += 3000; def.tick(); not('p2-flash'); not('p2-mbn'); not('p2-toast'); has('Mamute ' + SN[1]);
  P.evolve = e0; }
function pStg() { return P.stage(g.S, 'wolf').index; }
out.push('evoluir: Sys.pet.evolve, estágio muda no save e no herói (clarão, faixa do estágio); os efeitos somem sozinhos');

// 9) a chave "evoluir dá poder na hora" (Sys.pet.setStageMult) está DESLIGADA: a tela não promete poder; ligada, mostra os multiplicadores do módulo
{ assert.strictEqual(D.v17.stageMult.on, false); def.onOpen(); def.render(); not('×0,8'); has('cada estágio libera mais níveis');
  P.setStageMult(true); o().owned.wolf.lvl = D.v17.stageReq[2]; def.render(); has('×0,8'); has('×0,9'); has('evoluir dá poder na hora'); assert(/Evoluir<\/span><small>[^<]*de poder/.test(H()), 'com a chave ligada o botão mostra o ganho de poder'); check('stageMult');
  const j = JSON.stringify(g.S); def.render(); assert.strictEqual(JSON.stringify(g.S), j, 'a conta "se evoluir" devolve o save como estava'); P.setStageMult(false); def.render(); assert(!/Evoluir<\/span><small>[^<]*de poder/.test(H()), 'chave desligada: sem promessa de poder'); o().owned.wolf.lvl = D.v17.stageReq[1]; }
out.push('chave setStageMult desligada: sem "+poder" no Evoluir; ligada: multiplicadores e ganho vindos do módulo');

// 10) tocar num pet SEU troca o ativo na hora, com Desfazer
{ o().owned.owl = { stars: 2, frags: 3, lvl: 12 }; def.onOpen(); def.render(); has('Pets <b>2/11</b>'); const c0 = changed;
  def.click(btn('pet', { id: 'owl' })); assert.strictEqual(o().eq, 'owl'); has('Esfinge agora está na frente do herói'); has('Desfazer'); has('volta Mamute'); has('trocou o pet'); noPv(); assert(changed > c0); check('trocar');
  assert.strictEqual(frame().pet.base, 'era1_sphinx');
  def.click(btn('undo')); assert.strictEqual(o().eq, 'wolf'); has('Voltou: Mamute'); has('Usando'); assert.strictEqual(frame().pet.base, 'era0_mammoth_mid');
  def.click(btn('stg', { i: 2 })); has('<span>Prévia: Mamute ' + SN[2]); assert.strictEqual(frame().pet.base, 'era0_mammoth_evo'); assert.strictEqual(pStg(), 1, 'ver outro estágio não evolui'); def.click(btn('stg', { i: 1 })); noPv(); }
out.push('pet do jogador: toque troca o ativo, Desfazer volta; ver outro estágio é só prévia');

// 11) golpe, estrelas e Redefinir nível (confirmação na própria tela, sem janela)
{ def.onOpen(); def.render(); const od = P.attackOdds(1, D.v17.stageReq[1], 'wolf'); has(g.p1(od.crit * 100)); has(g.p1(od.basic * 100)); has(D.v3d.attacks.crit.name); has(D.starCost.join(' / ') + ' fragmentos');
  o().owned.wolf.food = 400; def.render(); has('Redefinir nível'); def.click(btn('rel')); const cr = P.canResetLevel(g.S, 'wolf'); has('volta para o <b>Nv 1</b>'); has('<b>' + g.n0(cr.refund) + '</b> de ração'); not('role="dialog"'); check('redefinir');
  def.click(btn('relno')); not('data-x="relok"'); assert.strictEqual(o().owned.wolf.lvl, D.v17.stageReq[1]);
  const food0 = o().food; def.click(btn('rel')); def.click(btn('relok')); assert.strictEqual(o().owned.wolf.lvl, 1); assert.strictEqual(o().food, food0 + cr.refund); assert.strictEqual(pStg(), 1, 'estágio fica'); has('de ração de volta'); }
out.push('chances dos 3 ataques e custo das estrelas do módulo; Redefinir nível confirma na tela e devolve a ração');

// 12) ovos: escolha pendente e 1º ovo, pelo módulo
{ o().choices.push({ options: ['drake', 'parrot'], source: 'tower100', frags: 0, food: 0 }); def.onOpen(); def.render(); has('ovo à escolha'); has('data-x="pick" data-id="drake"'); check('ovo à escolha');
  def.click(btn('pick', { id: 'parrot' })); assert(o().owned.parrot, 'o módulo chocou o escolhido'); assert.strictEqual(o().choices.length, 0); has('Papagaio-fênix: novo na coleção'); not('data-x="pick"');
  g.S = { sys: {}, hero: 'kael' }; def.onOpen(); def.render(); has('Chocar o ovo do nível ' + D.v20.unlockLevel); check('1º ovo'); def.click(btn('egg')); assert.strictEqual(Object.keys(o().owned).length, 1, 'o módulo deu o 1º pet'); assert(o().eq); has('Novo pet:'); not('data-x="egg"'); assert(frame().pet && frame, 'o pet novo vai para o herói'); }
out.push('ovos: ovo à escolha (Sys.pet.chooseEgg) e ovo do nível 20 (Sys.pet.firstEgg)');

// 13) tick e relógios não quebram; a ração do topo vem do save
{ def.render(); def.tick(); clock += 5000; def.tick(); check('tick'); }
// 14) o desenho do jogo falha: a tela mostra a imagem parada do pet (o pet nunca some) e não lança
{ g.drawHeroFull = () => { throw new Error('boom'); }; def.onOpen(); def.render(); has('id="p2_cv"'); const f = raf.shift(); try { f(16); } catch (e) { assert.fail('exceção no laço: ' + e.message); }
  not('id="p2_cv"'); assert(/<img src="assets\/pets\/[a-z0-9_]+_ref\.png" alt="[^"]+, Filhote"/.test(H()), 'reserva: imagem parada do pet'); check('reserva');
  delete g.drawHeroFull; def.onOpen(); def.render(); not('id="p2_cv"'); check('sem drawHeroFull'); g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; }; }
out.push('desenho do jogo com erro ou ausente: imagem parada do pet, sem exceção');
// 15) tela baixa (aparelho curto) e larguras de 320 e 390: desenha igual; fechar para o laço
{ for (const w of [320, 390]) { g.xDims = () => ({ H: 560, Wb: w }); def.onOpen(); def.render(); check('largura ' + w); has('PODER (FC)'); } g.xDims = () => ({});
  def.onOpen(); def.render(); assert(raf.length >= 1); def.onClose(); assert.strictEqual(raf.length, 0, 'fechar para o laço'); }
// 15b) QA 320 px, defeito 1: nenhum título cortado com reticências. A folha de estilo da tela não usa text-overflow:ellipsis em lugar nenhum, e os
// títulos e rótulos (nome do pet, raridade, estágio, botões, faixa do herói, células da grade) quebram linha em vez de cortar
{ const css = CSS(); assert(!/text-overflow\s*:\s*ellipsis/.test(css), 'a folha de estilo não corta texto com reticências');
  for (const sel of ['.p2-who>span', '.p2-dn', '.p2-cn', '.p2-cs', '.p2-bt>span,.p2-bt>small', '.p2-sc small', '.p2-odd .n', '.p2-lvb em', '.p2-fc b.v']) { const r = rule(sel);
    assert(/white-space:normal/.test(r) && /overflow-wrap:anywhere/.test(r), sel + ': quebra linha'); assert(!/white-space:nowrap|overflow:hidden/.test(r), sel + ': não corta'); }
  assert(!/white-space:nowrap/.test(rule('.p2-who')), 'a faixa do herói não prende o texto numa linha só');
  assert(/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/.test(css) && /\.p2-bt\{flex:1 1 0;min-width:0;min-height:40px/.test(css), 'sem rolagem lateral: colunas minmax(0,1fr), botões com min-width:0 e toque de 40 px');
  out.push('320 px: nenhuma regra com reticências; nome, raridade, estágio, botões e células da grade quebram linha'); }
// 15c) defeito 2: os avisos (mensagem, nome do estágio novo, "+poder") ficam numa faixa no RODAPÉ da tela, fora do palco (conferido em toda tela pelo check)
{ const n = rule('.p2-notes'); assert(/position:absolute/.test(n) && /bottom:\d+px/.test(n) && !/[;{]top:/.test(n), 'a faixa de avisos é presa ao rodapé');
  assert(/pointer-events:none/.test(n), 'a faixa de avisos não segura toque');
  for (const sel of ['.p2-toast', '.p2-mbn', '.p2-fly']) { const r = rule(sel); assert(!/position:absolute|position:fixed|[;{]top:|[;{]left:/.test(r), sel + ': sem posição própria (segue a faixa do rodapé)'); }
  assert.deepStrictEqual([...seenNotes].sort(), ['p2-fly', 'p2-mbn', 'p2-toast'], 'os três avisos apareceram em alguma tela conferida, sempre fora do palco');
  g.S = { sys: {}, hero: 'kael' }; o().first = true; def.onOpen(); def.render(); def.click(btn('pet', { id: 'falcon' })); has('class="p2-toast"'); const sg = stageSeg(H()); assert(sg && H().indexOf('class="p2-toast"') > sg.b && !sg.in.includes('Prévia: Falcão de guerra no herói'), 'o aviso da prévia fica fora do palco');
  def.click(btn('sair')); out.push('avisos: faixa no rodapé (.p2-notes), nunca dentro do palco'); }
// 15d) defeito 3: abrir NÃO mostra "Carregando as imagens". A tela pede as imagens ao Preload ao abrir (antes de desenhar) e desenha na hora
{ const asked = []; let ready = false, calls = 0; g.Preload = { ready(u) { calls++; asked.push(...u); return Promise.resolve({ ok: true, failed: [] }); }, has: () => ready };
  const poster = () => { g.V.innerHTML = '<span>Carregando as imagens</span>'; return true; }; g.xGate = poster; g.pGate = poster; g.pwGate = poster;   // a espera antiga, se a tela ainda a chamasse
  g.S = { sys: {}, hero: 'kael' }; o().first = true; o().owned.wolf = { stars: 1, frags: 0, lvl: 1 }; o().owned.owl = { stars: 2, frags: 0, lvl: 12, stg: 1 }; o().eq = 'wolf';
  g.V.innerHTML = ''; def.onOpen(); assert(calls >= 1 && H() === '', 'as imagens são pedidas ao abrir, ANTES de desenhar');
  def.render(); not('Carregando'); has('id="p2_cv"'); has('PODER (FC)'); assert.strictEqual((H().match(/data-x="pet"/g) || []).length, 11, 'imagens ainda chegando: a tela inteira já está desenhada');
  const srcs = [...H().matchAll(/src="([^"]+)"/g)].map(m => m[1]); assert(srcs.length >= 15, 'miniaturas da grade, do pet e dos estágios');
  for (const u of srcs) assert(asked.includes(u), 'imagem da primeira vista não foi pedida ao Preload: ' + u);
  assert(asked.includes('assets/pets/era1_sphinx_mid.png'), 'a miniatura da grade é a do estágio de verdade do pet'); assert.strictEqual(new Set(asked).size, asked.length, 'cada imagem é pedida uma vez só');
  const n0 = calls, nOpen = asked.length; def.render(); def.tick(); assert.strictEqual(calls, n0, 'redesenhar não pede de novo');
  ready = true; def.click(btn('pet', { id: 'falcon' })); def.click(btn('stg', { i: 2 })); not('Carregando'); has('<span>Prévia: Falcão de guerra'); assert.strictEqual(calls, n0, 'o Preload diz que estão prontas: nada é pedido e a tela desenha direto');
  ready = false; def.click(btn('pet', { id: 'drake' })); not('Carregando'); has('<span>Prévia: Dragão'); assert(calls > n0 && asked.includes('assets/pets/era2_dragon_evo.png'), 'trocar o pet escolhido pede as imagens novas dele');
  check('carga');
  g.Preload = { ready() { throw new Error('boom'); }, has() { throw new Error('boom'); } }; def.onOpen(); def.render(); has('PODER (FC)'); not('Carregando');   // pré-carregador com erro: a tela não depende dele
  delete g.Preload; delete g.xGate; delete g.pGate; delete g.pwGate; def.onOpen(); def.render(); has('PODER (FC)');
  out.push('carga: ao abrir pede ' + nOpen + ' imagens ao Preload antes de desenhar; desenha na hora, sem o cartaz "Carregando as imagens"; pronta no Preload = não pede'); }
// 15b) Pets de apoio: o botão da grade só existe com o Sys.petSupport E a tela 'petsup' ligados; o toque abre a tela com volta para Pets
{ const keep = g.Sys.petSupport; def.onOpen(); def.render();
  delete g.Sys.petSupport; def.render(); not('data-to="petsup"');
  g.Sys.petSupport = { DATA: { on: false } }; def.render(); not('data-to="petsup"');
  g.Sys.petSupport = { DATA: { on: true } }; panelOk = false; def.render(); not('data-to="petsup"'); panelOk = true;
  def.render(); has('data-x="go" data-to="petsup"'); has('Pets de apoio'); check('pets de apoio');
  opened.length = 0; def.click(btn('go', { to: 'petsup' })); assert.deepStrictEqual(opened, ['petsup@pets2'], 'o botão abre os Pets de apoio com volta para Pets');
  g.Sys.petSupport.DATA.on = false; opened.length = 0; def.click(btn('go', { to: 'petsup' })); assert.deepStrictEqual(opened, [], 'sistema desligado: o toque não abre'); has('ainda não está disponível');
  if (keep) g.Sys.petSupport = keep; else delete g.Sys.petSupport; def.onOpen(); def.render();
  out.push('pets de apoio: botão só com o sistema e a tela ligados; abre petsup com volta para pets2'); }
// 16) cobertura: todas as ações da tela apareceram em algum botão e todas as imagens paradas dos 11 pets existem
{ const never = def.actions.filter(a => !seenActs.has(a)); assert.deepStrictEqual(never, [], 'ação sem botão em nenhum estado: ' + never.join(','));
  for (const p of D.pets.filter(p => p.sprite && !p.removed)) for (const s of ['ref', 'mid', 'evo']) { const u = 'assets/pets/' + p.sprite + '_' + s + '.png'; if (['wolf', 'owl', 'shadowwolf', 'falcon', 'drake', 'parrot', 'panther', 'golem', 'underworld', 'celestial', 'prism'].includes(p.id)) assert(fs.existsSync(path.join(R, u)), 'falta ' + u); }
  for (const p of D.pets.filter(p => ['wolf', 'owl', 'shadowwolf', 'falcon', 'drake', 'parrot', 'panther', 'golem', 'underworld', 'celestial', 'prism'].includes(p.id))) SUF.forEach(s => sheetsOk(p.sprite + s));
  out.push('cobertura: ' + seenActs.size + ' ações com botão e tratamento, ' + seenImgs.size + ' imagens citadas existem, folhas dos 11 pets x 3 estágios em disco'); }
Date.now = realNow;
console.log(out.join('\n') + '\nFC do teste: ' + (fcReal ? 'Sys.fc real' : 'base fixa + parte do pet do módulo') + '\nTODOS OS TESTES PASSARAM');
