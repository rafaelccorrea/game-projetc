'use strict';
// Teste de fumaça do js/p_tower2.js (TORRE V2) em Node: DOM de mentira, módulos REAIS de js/sys (tower, fc, level, vip, pet...).
// Rodar: node test/paineis/p_tower2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g;
['loot', 'level', 'stats', 'practice', 'titles', 'tower', 'forge', 'pet', 'vip', 'fc'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const Sys = g.Sys, T = Sys.tower;

/* ---------- DOM de mentira ---------- */
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 190, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } };
  Object.defineProperty(e, 'innerHTML', { get() { return this._h; }, set(v) { this._h = v; } }); return e; };
const grad = { addColorStop() {} }; let drawn = 0;
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => grad : () => { drawn++; }, set: (t, k, v) => { t[k] = v; return true; } });
g.document = { head: mkEl('head'), createElement: tag => { const e = mkEl(''); if (tag === 'canvas') e.getContext = () => ctx; return e; }, getElementById: id => els[id] || null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
let timers = []; g.setTimeout = f => { timers.push(f); return timers.length; }; g.clearTimeout = () => {};
const flush = () => { let i = 0; while (timers.length && i++ < 400) timers.shift()(); assert(i < 400, 'laço de luta sem fim'); return i; };

/* ---------- jogo de mentira (só o que a tela lê do index/screens) ---------- */
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); Sys.host = host;
const baseAtk = host.atk, baseHp = host.hp;
const strong = () => { host.atk = () => 1e15; host.hp = () => 1e16; }, weak = () => { host.atk = baseAtk; host.hp = baseHp; };
const newSave = () => ({ gold: 0, gems: 0, inv: [], eq: {}, nextId: 1, sys: {}, hero: 'kael', set: {} });
const setLv = n => { Sys.level.ensure(g.S).lvl = n; };
g.S = newSave(); g.V = { innerHTML: '' }; g.view = 'tower2'; g.PANEL_ON = {};
g.xDims = () => ({ H: 704, Wb: 390 }); g.xWrap = (d, c, i) => i; g.kf = v => String(Math.round(v)); g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.RN = i => ['Básico', 'Raro', 'Épico', 'Mítico', 'Lendário'][i] || '';
g.xEraBgUrl = () => 'assets/bg/era2.png'; g.xEraBg = () => 'linear-gradient(180deg,rgba(13,10,8,.45),rgba(13,10,8,.9)),url(assets/bg/era2.png) center top/cover no-repeat,#16110d';
const log = []; g.snd = n => log.push('snd:' + n); g.save = () => log.push('save'); g.statsChanged = () => log.push('stats');
const gateSeen = []; g.xGate = u => { gateSeen.push(u.slice()); return false; };
g.render = () => def.render(); g.Screens = { close() { log.push('close'); } };
let def = null, addName = ''; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: () => true };
let heroCalls = []; g.HS = 155; g.drawHeroFull = (c, x, y, k, st) => { heroCalls.push({ x, y, k, st }); return true; };

const SRC = fs.readFileSync(path.join(R, 'js/p_tower2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_tower2.js' });
const X = g.Tower2.X, out = [], imgs = new Set();
const H = () => g.V.innerHTML, has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const btn = (x, o) => ({ dataset: Object.assign({ x }, o || {}) });
/* todo <button> tem data-x com ação tratada; sem emoji; sem "undefined"/"NaN"; sem texto proibido; guarda as imagens citadas */
const sane = what => { const bt = buttons(); assert(bt.length >= 1, what + ': sem botões');
  for (const b of bt) { assert(b.dataset.x, what + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), what + ': ação não tratada: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), what + ': botão morto (disabled): ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(H()), what + ': tem emoji'); assert(!/undefined|NaN|\bnull\b|\[object/.test(H()), what + ': texto quebrado: ' + (H().match(/.{30}(undefined|NaN|\bnull\b|\[object).{30}/) || [''])[0]);
  assert(!/comprar|sorteio|R\$/i.test(H()), what + ': texto proibido');
  for (const m of H().matchAll(/src="([^"]+)"/g)) imgs.add(un(m[1])); for (const m of H().matchAll(/url\(([^)]+)\)/g)) imgs.add(m[1]); for (const u of g.Tower2.urls()) imgs.add(u);
  return bt.length; };
const st = () => T.ensure(g.S, host);
const open = () => { def.onOpen(); def.render(); };

// 0) registro: painel 'tower2', chave nasce DESLIGADA, o arquivo não liga chave, não usa diálogo do navegador e não tem emoji
assert.strictEqual(addName, 'tower2'); assert.strictEqual(g.PANEL_ON.tower2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.busy && def.onOpen && def.onClose);
assert(!/\.on\s*=\s*true|PANEL_ON\.\w+\s*=\s*true/.test(SRC), 'o arquivo não liga chave nenhuma');
assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji');
for (const a of def.actions) assert(SRC.includes("a==='" + a + "'"), 'ação da lista sem tratador: ' + a);
assert(/\.t2-bt,\.xs \.t2-bt\{[^}]*color:#1c1206/.test(SRC), 'botão dourado: cor escura declarada também com .xs');
out.push('registro: tower2 desligada, ' + def.actions.length + ' ações com tratador, sem diálogo do navegador, sem emoji no arquivo');

// 1) save novo: nível 1 = portão (o Sys.level decide); liberado, andar 1 inteiro com os números do módulo
open(); has('Libera no nível ' + Sys.level.unlockLevel('tower')); sane('portão'); def.click(btn('back')); assert(log.includes('close'));
{ const f0 = st().fights; def.click(btn('go')); assert.strictEqual(st().fights, f0, 'trancada: não luta'); }
setLv(60); open(); assert(gateSeen.length >= 1 && gateSeen[gateSeen.length - 1].includes('assets/bg/era2.png'), 'pede a carga das imagens antes de desenhar');
{ const o1 = T.opponent(1), me = T.playerStats(g.S, host), dif = T.difficulty(me.fc, o1.fc), rw = T.rewardsFor(1, host, g.S), D = T.DATA;
  has(g.esc2(o1.name)); has('Fantasma · próximo marco: andar ' + T.nextMilestone(1)); has('>' + dif.txt + '<'); has('Você<b>' + Sys.fc.viewText(me.fc) + '</b>'); has('Andar 1<b>' + Sys.fc.viewText(o1.fc) + '</b>');
  has('>' + g.kf(rw.gold) + '</span>'); has(rw.stones + ' pedra'); has('>Desafiar<'); has('derrotas<b>' + D.lossesPerDay + '/' + D.lossesPerDay + '</b>'); has('id="t2_stc"');
  has('+0%'); has('chefe a cada ' + D.bossEvery); has('Só a derrota gasta tentativa: ' + D.lossesPerDay + ' por dia'); has('VIP 5: ' + (D.lossesPerDay + 1)); has('VIP 10: ' + (D.lossesPerDay + 2));
  assert.strictEqual((H().match(/class="t2-fr/g) || []).length, 10, 'dez próximos andares'); has('>CHEFE<'); has('>OVO<'); has('>MARCO<'); has(g.esc2(T.opponent(10).name));
  has('url(assets/bg/era2.png)'); assert(!/t2-bg"[^>]*style="background:#/.test(H()), 'fundo = cenário da era'); }
sane('save novo'); out.push('save novo: portão pelo nível e, liberado, andar 1 com nome, FC, chance, prêmios e tentativas do Sys.tower');

// 2) FC alta e andar de chefe: desenha sem erro; chefe com o extra de FC do módulo, diamantes e imagem da era
strong(); st().best = 9; open(); { const o10 = T.opponent(10), rw = T.rewardsFor(10, host, g.S);
  assert.strictEqual(o10.kind, 'boss'); has(g.esc2(o10.name)); has('Chefe (FC +' + Math.round((T.DATA.bossFcMult - 1) * 100) + '%)'); has('t2-fl boss'); has('>' + rw.gems + '</span>'); has('ovo (mín. Raro)'); has('>Fácil<');
  assert(g.Tower2.urls().includes('assets/enemies/era0_boss.png'), 'a imagem do chefe entra na espera de carga'); has('+' + String(T.bonus(g.S).atkPct).replace('.', ',') + '%'); has('pelos 9 andares vencidos'); }
sane('FC alta, chefe'); st().best = 250; open(); has('ANDAR<b class="lil">251</b>'); sane('andar 251'); st().best = 0;
out.push('FC alta: andar de chefe (FC +' + Math.round((T.DATA.bossFcMult - 1) * 100) + '%, diamantes, ovo com raridade mínima) e andar 251 sem erro');

// 3) desafiar com VITÓRIA: chama o Sys.tower.fight UMA vez, o prêmio entra UMA vez, a tela reproduz e mostra o resultado
els.t2_hpa = mkEl('t2_hpa'); els.t2_hpb = mkEl('t2_hpb'); els.t2_toast = mkEl('t2_toast');
open(); log.length = 0; let fights = 0; const fight0 = T.fight; T.fight = function () { fights++; return fight0.apply(this, arguments); };
{ const rw1 = T.rewardsFor(1, host, g.S), g0 = host.gold, k0 = Sys.practice.ensure ? JSON.stringify(Sys.practice.ensure(g.S)) : '';
  def.click(btn('go')); assert.strictEqual(fights, 1, 'chamou o módulo'); assert.strictEqual(def.busy(), true, 'ocupado durante a luta'); assert(log.includes('stats') || log.includes('save'), 'gravou logo após a luta');
  assert.strictEqual(st().best, 1); assert.strictEqual(host.gold, g0 + rw1.gold, 'ouro do andar entregue pelo módulo');
  has('Lutando...'); has('ANDAR<b class="lil">1</b>'); has('id="t2_hpa"'); has('id="t2_hpb"'); has('aria-disabled="true"'); has('derrotas<b>' + T.DATA.lossesPerDay + '/'); sane('durante a luta');
  def.click(btn('go')); def.click(btn('go')); assert.strictEqual(fights, 1, 'durante a luta o toque não vale');
  const steps = flush(); assert(steps >= 2, 'reproduziu o registro'); assert.strictEqual(def.busy(), false, 'livre ao fim');
  assert.strictEqual(els.t2_hpb.style.width, '0.0%', 'a barra do adversário zerou'); assert(log.includes('snd:claim'));
  assert.strictEqual(host.gold, g0 + rw1.gold, 'o prêmio entrou UMA vez só (reproduzir e redesenhar não entrega de novo)'); assert.strictEqual(st().best, 1); assert.strictEqual(st().fights, 1);
  def.render(); def.render(); def.tick(); assert.strictEqual(host.gold, g0 + rw1.gold); assert.strictEqual(fights, 1); void k0;
  has('Andar 1 vencido: +' + g.kf(rw1.gold) + ' de ouro'); has('Bônus para sempre: +' + String(T.DATA.perFloor.atkPct).replace('.', ',') + '% ATQ e VIDA'); has('ANDAR<b class="lil">2</b>'); has('>Desafiar<'); has('pelo andar vencido');
  assert(timers.length === 0 && X.fight === null, 'a faixa do palco sai sozinha'); }
sane('depois da vitória'); out.push('vitória: 1 chamada ao Sys.tower.fight, prêmio uma vez só, barras reproduzidas, resultado e andar seguinte na tela');

// 4) desafiar com DERROTA: gasta 1 tentativa (só o módulo mexe), mostra a derrota e o andar continua
weak(); st().best = 60; open(); log.length = 0; { const left0 = st().lossesLeft, g0 = host.gold;
  def.click(btn('go')); assert.strictEqual(fights, 2); flush(); assert.strictEqual(st().best, 60, 'a derrota não sobe andar'); assert.strictEqual(st().lossesLeft, left0 - 1); assert.strictEqual(host.gold, g0, 'derrota sem prêmio');
  has('Derrota no andar 61'); has('Gastou 1 tentativa'); has('% de vida'); has('ANDAR<b class="lil">61</b>'); has('derrotas<b>' + (left0 - 1) + '/' + T.DATA.lossesPerDay + '</b>'); has('>Muito difícil<'); }
sane('depois da derrota'); out.push('derrota: gasta 1 tentativa, sem prêmio, frase da derrota com a vida que sobrou no adversário');

// 5) sem tentativa: o botão explica e NÃO chama o módulo
st().lossesLeft = 0; open(); has('Sem tentativas hoje'); has('aria-disabled="true"'); has('derrotas<b>0/'); { const f0 = fights, n0 = st().fights; def.click(btn('go'));
  assert.strictEqual(fights, f0, 'sem tentativa não chama o módulo'); assert.strictEqual(st().fights, n0); assert(/Sem tentativas hoje/.test(X.toast)); assert(els.t2_toast.innerHTML.includes('Sem tentativas hoje'), 'aviso na tela');
  assert(/top:\d+px/.test(els.t2_toast.innerHTML) && +/top:(\d+)px/.exec(els.t2_toast.innerHTML)[1] >= 164, 'o aviso fica abaixo do palco (não cobre o herói)'); assert.strictEqual(def.busy(), false);
  // QA lote V2 (C1): diz QUANDO volta. O Sys.tower devolve as tentativas na virada do dia (ensure com o host) e não oferece relógio de contagem:
  // o texto é o da Arena, "recarrega à meia-noite", no botão, no aviso, no rótulo falado e na dica
  has('Sem tentativas hoje<small>recarrega à meia-noite</small>'); has(', recarrega à meia-noite"'); has('por dia'); assert(/por dia[^<]*; recarrega à meia-noite\./.test(H()), 'a dica diz quando recarrega');
  assert.strictEqual(X.toast, 'Sem tentativas hoje: recarrega à meia-noite'); assert(els.t2_toast.innerHTML.includes('recarrega à meia-noite')); assert(!/voltam amanhã/.test(SRC), 'o texto vago saiu');
  assert(/Sem lutas hoje: recarrega à meia-noite/.test(fs.readFileSync(path.join(R, 'js/p_arena.js'), 'utf8')), 'mesmo texto da Arena');
  assert(!Object.keys(T).some(k => /reset|until|countdown|dayleft|nextday|recharge/i.test(k)), 'o Sys.tower ganhou relógio de recarga: troque o texto fixo por ele');
  const o = st(); o.lossesLeft = 0; o.day = '1999-01-01'; assert.strictEqual(st().lossesLeft, T.DATA.lossesPerDay, 'a regra do módulo: virou o dia, as tentativas voltam todas');
  open(); has('>Desafiar<'); not('recarrega à meia-noite</small>'); st().lossesLeft = 0; open(); }
sane('sem tentativa'); T.fight = fight0; out.push('sem tentativa: avisa abaixo do palco, não luta e diz quando volta ("recarrega à meia-noite", a virada de dia do Sys.tower)');

// 6) VIP de conveniência: as tentativas a mais vêm do Sys.vip
st().best = 0; Sys.vip.setLevel(g.S, 5); { const mx = T.DATA.lossesPerDay + Sys.vip.conv(g.S, 'towerAdd').value; st().lossesLeft = mx; open(); has('derrotas<b>' + mx + '/' + mx + '</b>'); assert.strictEqual(mx, T.DATA.lossesPerDay + 1); } Sys.vip.setLevel(g.S, 0); sane('vip');
out.push('VIP 5: tentativas do dia com o valor do Sys.vip');

// 7) palco: herói do jogo a pé com o pet (por último, na frente); fantasma = o outro herói, sem pet; chefe = imagem; erro no desenho não derruba a tela
els.t2_stc = mkEl('t2_stc'); els.t2_stc.getContext = () => ctx; strong(); st().best = 0; st().lossesLeft = T.DATA.lossesPerDay; open(); assert(raf.length >= 1, 'o palco anima');
heroCalls = []; drawn = 0; raf.shift()(1000); assert.strictEqual(heroCalls.length, 2, 'fantasma e herói'); { const gh = heroCalls[0].st, me = heroCalls[1].st;
  assert.strictEqual(gh.hero, 'kaia'); assert.strictEqual(gh.pet, false); assert.strictEqual(gh.mount, false); assert.strictEqual(me.mount, false); assert(me.pet === undefined, 'o pet do jogador não é escondido');
  assert(me.weapon === undefined && me.wing === undefined && me.hero === undefined, 'arma e asa: as do jogo'); assert(heroCalls[1].x < heroCalls[0].x, 'herói à esquerda, adversário à direita'); assert(heroCalls[1].k > 0 && isFinite(heroCalls[1].k)); assert(drawn > 4); }
def.click(btn('go')); for (let i = 0; i < 3 && timers.length; i++) timers.shift()(); heroCalls = []; raf.shift()(1100); assert.strictEqual(heroCalls.length, 2, 'durante a luta o palco continua'); flush();
st().best = 9; open(); heroCalls = []; raf.shift()(1200); assert.strictEqual(heroCalls.length, 1, 'andar de chefe: só o herói pela rota do jogo (o chefe é imagem)');
g.drawHeroFull = () => { throw new Error('boom'); }; raf.shift()(1300); g.drawHeroFull = (c, x, y, k, s2) => { heroCalls.push({ x, y, k, st: s2 }); return true; };
def.onClose(); assert.strictEqual(raf.length, 0, 'fechar a tela para o laço'); delete els.t2_stc; raf = [];
out.push('palco: drawHeroFull a pé com o pet, fantasma = outro herói sem pet, chefe por imagem, erro no desenho não derruba a tela');

// 8) fechar no meio da luta: para a reprodução; o resultado já estava gravado pelo módulo
st().best = 0; open(); { const b0 = st().best; def.click(btn('go')); assert.strictEqual(st().best, b0 + 1); def.onClose(); assert.strictEqual(def.busy(), false); flush(); assert.strictEqual(st().best, b0 + 1); assert.strictEqual(X.fight, null); }
out.push('fechar no meio da luta: a tela solta, o andar vencido fica no save');

// 9) andar 100 com o ovo à escolha (chave do Sys.pet ligada SÓ na memória deste teste): escolha dentro do jogo, pelo Sys.pet.chooseEgg
{ const PD = Sys.pet.DATA, k17 = PD.v17.on, k3 = PD.v3; PD.v17.on = true; PD.v3 = true;
  try { g.S = newSave(); setLv(60); strong(); st().best = 99; st().lossesLeft = T.DATA.lossesPerDay; open(); has('à escolha'); sane('andar 100');
    def.click(btn('go')); flush(); const ch = Sys.pet.ensure(g.S).choices || [];
    if (ch.some(c => c && c.source === 'tower100')) { has('role="dialog"'); has('data-x="pick"'); has('data-x="later"'); sane('escolha de ovo'); const f0 = st().fights; def.click(btn('go')); assert.strictEqual(st().fights, f0, 'com a escolha aberta não luta');
      const id = buttons().find(b => b.dataset.x === 'pick').dataset.id; def.click(btn('pick', { id })); assert.strictEqual(Sys.pet.ensure(g.S).t100, id, 'o Sys.pet guardou a escolha'); not('role="dialog"'); assert(/Ovo escolhido/.test(X.toast)); sane('depois da escolha');
      out.push('andar 100: ovo à escolha resolvido pelo Sys.pet.chooseEgg, dentro da tela');
    } else out.push('andar 100: o Sys.pet não deixou escolha pendente neste cenário (a janela não abre)');
  } finally { PD.v17.on = k17; PD.v3 = k3; } }

// 10) Sys.tower ausente: explica e só o Voltar funciona
{ const tw = Sys.tower; delete Sys.tower; open(); has('Torre indisponível agora.'); sane('sem módulo'); def.click(btn('go')); Sys.tower = tw; }
out.push('sem o Sys.tower: aviso e Voltar');

// 11) todos os botões: tocar em cada um não gera exceção
g.S = newSave(); setLv(60); weak(); let taps = 0; open(); for (const b of buttons()) { open(); try { def.click(b); flush(); taps++; } catch (e) { assert.fail('toque em ' + b.tag + ': ' + e.stack); } sane('toque ' + b.dataset.x); }
def.tick(); def.onClose(); assert.strictEqual(def.busy(), false);
out.push('toques: ' + taps + ' botões tocados sem exceção');

// 11b) QA lote V2 (C2): o selo global de ganho de FC ("+124 mil", #fcnote do index.html, fixo perto do topo) não fica em cima dos lutadores: com a Torre V2
// aberta (body[data-v="tower2"]) a folha de estilo desta tela o manda para a base da tela. O palco só tem o canvas e as barras de vida; nada de FC ganha nele.
{ const CSS = g.document.head.children.map(c => c.textContent).join('\n'), m = /\nbody\[data-v="tower2"\] #fcnote\{([^}]*)\}/.exec(CSS); assert(m, 'regra que tira o selo de FC de cima do palco');
  assert(/top:auto!important/.test(m[1]) && /bottom:[^;]+!important/.test(m[1]), 'o selo vai para a base (o estilo do index é inline: precisa de !important)');
  const IDX = fs.readFileSync(path.join(R, 'index.html'), 'utf8'); assert(/el\.id='fcnote'/.test(IDX) && /position:fixed;left:50%;top:calc\(var\(--fbsafe,0px\) \+ 132px\)[^"]*pointer-events:none/.test(IDX), 'o selo do index ainda é o #fcnote fixo no topo e não segura toque');
  assert(/document\.body\.dataset\.v=v/.test(IDX), 'o setView marca a tela aberta no body (data-v)');
  g.S = newSave(); setLv(60); strong(); open(); const h = H(), a = h.indexOf('<div class="t2-stage"'), b = h.indexOf('<div class="t2-fl'); assert(a > 0 && b > a);
  assert(/^<div class="t2-stage" style="height:\d+px"><canvas id="t2_stc"[^>]*><\/canvas><div id="t2_ov"><\/div><\/div>$/.test(h.slice(a, b)), 'antes da luta o palco só tem o canvas: nenhum selo por cima do herói e do fantasma');
  out.push('selo de FC: fora de cima dos lutadores (regra body[data-v="tower2"] #fcnote manda para a base); palco sem selo'); weak(); }
// 11c) QA lote V2 (C3): "Próximos andares" igual ao protótipo docs/proto/v2/Torre.html. O protótipo é DECRESCENTE na tela (lista montada do próximo para cima
// e empilhada de baixo para cima, column-reverse: o próximo andar fica embaixo, como numa torre). A tela mantém a mesma ordem.
{ const PROTO = fs.readFileSync(path.join(R, 'docs/proto/v2/Torre.html'), 'utf8'), CSS = g.document.head.children.map(c => c.textContent).join('\n');
  assert(/\.tw\{display:flex;flex-direction:column-reverse/.test(PROTO) && /for\(let i=f;i<f\+10;i\+\+\)/.test(PROTO), 'protótipo: lista do próximo para cima, empilhada ao contrário (decrescente na tela)');
  assert(/\n\.t2-tw\{display:flex;flex-direction:column-reverse/.test(CSS), 'a tela empilha igual ao protótipo');
  g.S = newSave(); setLv(60); st().best = 16; open(); const ns = [...H().matchAll(/<span class="n lil">(\d+)<\/span>/g)].map(x => +x[1]);
  assert.deepStrictEqual(ns, [17, 18, 19, 20, 21, 22, 23, 24, 25, 26], 'no HTML: do próximo andar para cima (na tela, de baixo para cima)'); assert(/class="t2-fr now[^"]*"><span class="n lil">17</.test(H()), 'o próximo andar é o destacado');
  out.push('próximos andares: mesma ordem do protótipo (decrescente na tela, o próximo embaixo e destacado)'); }

// 12) toda imagem citada existe em disco
for (const u of Object.values(g.Tower2.IC)) imgs.add(u); for (let e = 0; e < T.DATA.skin.eras; e++) imgs.add('assets/enemies/era' + e + '_boss.png');
for (const u of imgs) assert(fs.existsSync(path.join(R, u)), 'imagem citada não existe: ' + u);
out.push('imagens: ' + imgs.size + ' citadas, todas em disco');
// QA lote perfil 2: a faixa de resultado ("ANDAR 10 VENCIDO") não cobre nomes, barras nem os lutadores: fica na faixa de chão do palco (os pés ficam em GY = altura - 20), estreita
{ const CSS = g.document.head.children.map(c => c.textContent).join('\n'), m = /\n\.t2-ban\{([^}]*)\}/.exec(CSS); assert(m, 'regra da faixa de resultado'); const r = m[1], n = k => { const q = new RegExp('(?:^|;)' + k + ':(-?[\\d.]+)(?:px)?(?:;|$)').exec(r); assert(q, 'faixa: ' + k); return +q[1]; };
  assert(!/(?:^|;)top:/.test(r), 'a faixa não fica mais presa ao topo (onde estão nomes, barras e cabeças)'); const gy = +(/GY:h-(\d+)/.exec(SRC) || [])[1]; assert(gy > 0, 'linha do chão do palco');
  const hBan = Math.ceil(n('font-size') * n('line-height')) + 2 * +/(?:^|;)padding:(\d+)px/.exec(r)[1] + 2; assert(hBan + n('bottom') <= gy, 'a faixa (' + hBan + ' px) cabe abaixo dos pés (' + gy + ' px de chão)'); assert(n('bottom') >= -4, 'não invade o cartão do andar (margem de 4 px)');
  assert(/max-width:calc\(100% - \d+px\)/.test(r) && /width:fit-content/.test(r) && /margin:0 auto/.test(r), 'largura limitada e centrada'); assert(/overflow-wrap:anywhere/.test(r) && !/nowrap|ellipsis/.test(r));
  const hp = /\n\.t2-hp\{([^}]*)\}/.exec(CSS)[1]; assert(/top:6px/.test(hp), 'nomes e barras no topo do palco, longe da faixa');
  assert(/F\.done\) h\+='<div class="t2-ban lil '/.test(SRC), 'a faixa continua saindo no fim da luta');
  out.push('faixa de resultado: ' + hBan + ' px de altura no chão do palco (abaixo dos pés), largura pelo texto com teto, longe de nomes e barras'); }
console.log(out.join('\n') + '\nTODOS OS TESTES PASSARAM');
