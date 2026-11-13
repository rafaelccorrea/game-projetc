'use strict';
// Teste de fumaça do js/p_tourney2.js (TORNEIO DO PODER V2) em Node: Sys.guild, Sys.tourneyNet e Sys.tower REAIS; a rede (Sys.net._call) é de mentira.
// Rodar: node test/paineis/p_tourney2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'level', 'chest', 'clock', 'guild', 'tourneynet', 'tower'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const N = g.Sys.tourneyNet, G = g.Sys.guild, TW = g.Sys.tower; assert(N && G && TW && TW.duelCarry, 'módulos carregados');

/* ---------- DOM de mentira ---------- */
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 196, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx });
const ELS = {}; ['tr2_stc', 'tr2_scroll', 'tr2_toast', 'tr2_ov', 'tr2_hpa', 'tr2_hpb'].forEach(id => { ELS[id] = mkEl(id); });
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => ELS[id] && H().includes('id="' + id + '"') ? ELS[id] : null };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host; g.S = { sys: { level: { lvl: 60, xp: 0 } }, hero: 'kael', stage: 40 };
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'tourney2'; g.HS = 155; g.snd = () => {};
let drew = []; g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };
let def = null, addName = ''; g.render = () => def.render();
g.Screens = { close() {}, current: () => 'tourney2' };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; } };

/* ---------- servidor de mentira (contrato 10.3) ---------- */
const NOW = host.now(), LOCK = { d5: NOW + 10 * 36e5, d6: NOW + 34 * 36e5 }; let lineupAns = null, declareAns = { declaration: { id: 1 }, attacksLeftToday: 1 }, role = 'leader', phase = 'declare';
/* membros da guilda (Sys.guildNet.mine): p4 entrou há 10 h → fora da sexta (trava em 10 h, precisa de 24 h antes), dentro do sábado */
const MEMBERS = [{ id: 'p1', name: 'Ana <i>', role: 'leader', joinedAt: NOW - 9e8, me: true, fc: 5000, level: 60, era: 4 }, { id: 'p2', name: 'Bento', role: 'member', joinedAt: NOW - 9e8, fc: 9000, level: 70, era: 5 },
  { id: 'p3', name: 'Caio', role: 'member', joinedAt: NOW - 9e8, fc: 7000, level: 65, era: 3 }, { id: 'p4', name: 'Dora', role: 'member', joinedAt: NOW - 10 * 36e5, fc: 99000, level: 80, era: 6 }];
g.Sys.guildNet = { DATA: { on: true }, state: () => ({ on: true, started: true, at: 1 }), mine: () => ({ members: MEMBERS }), refresh: () => Promise.resolve({ ok: true }) };
/* duas lutas de verdade pelo Sys.tower.duelCarry: o Bento (p2) vence o 1º adversário e segue com a vida que sobrou contra o 2º */
const FA = { atk: 300, hp: 5000, def: 0, critRate: 20, critDmg: 50, aspd: 0 }, FB = { atk: 120, hp: 1500, def: 0, critRate: 10, critDmg: 50, aspd: 0 };
const d1 = TW.duelCarry(FA, FB, 11), d2 = TW.duelCarry(FA, FB, 12, d1.hpLeftA, null); assert(d1.win && d2.win && d1.log.length > 1 && d2.log.length > 1, 'duelos de teste: o atacante vence os dois');
const DUELS = [{ a: 'p2', b: 'x1', win: true, hpLeftA: d1.hpLeftA, hpLeftB: d1.hpLeftB, seed: 11, timeout: false, log: d1.log }, { a: 'p2', b: 'x2', win: true, hpLeftA: d2.hpLeftA, hpLeftB: d2.hpLeftB, seed: 12, timeout: false, log: d2.log }];
const calls = [];
/* respostas NO FORMATO EXATO do contrato docs/API_SERVIDOR.md 10.3 e 10.5. lockMode: 'ok' (lockAt real) | 'locked' (sexta já travada) | 'none' (resposta sem lockAt: a tela não pode citar hora) */
let lockMode = 'ok';
const HR = at => { const d = new Date(at - 3 * 36e5), m = d.getUTCMinutes(); return d.getUTCHours() + 'h' + (m ? String(m).padStart(2, '0') : ''); };   // a hora de Brasília do lockAt, como a tela mostra
const G1 = { id: 'g1', name: 'Guardiões do Teste' }, G9 = { id: 'g9', name: 'Lobos <b>' };
const BT = (id, territory, slot, attacker, defender, winner, reason, duels) => ({ id, slot, territory, attacker, defender, winner, winnerName: winner ? (winner === 'g1' ? G1.name : G9.name) : null, reason, duels: duels || [], at: NOW - 36e5 });
const VIEW = () => ({ week: '2026-W46', phase, now: NOW, size: 15, battles: lockMode === 'none' ? [] : [{ slot: 'd5', at: LOCK.d5 + 36e5, lockAt: LOCK.d5 }, { slot: 'd6', at: LOCK.d6 + 36e5, lockAt: LOCK.d6 }],
  map: [{ id: 'r0t1', region: 0, capital: false, owner: { id: 'g1', name: 'Guardiões do Teste' }, attacks: [] }, { id: 'r2t2', region: 2, capital: false, owner: { id: 'g9', name: 'Lobos <b>' }, attacks: [{ slot: 'd5', attacker: { id: 'g1', name: 'Guardiões do Teste' } }] },
    { id: 'capital', region: 4, capital: true, owner: { id: 'g9', name: 'Lobos <b>' }, attacks: [] }, { id: 'lixo' }, null],
  my: { guildId: 'g1', role, canDeclare: role === 'leader', canLineup: role === 'leader', attacksLeftToday: 2, lineups: { d5: [], d6: [] }, territories: ['r0t1'] } });
g.Sys.net = { _call(m, p, b) { calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (p === '/tourney') return Promise.resolve(VIEW());
  if (p.indexOf('/tourney/ranking') === 0) return Promise.resolve({ kind: /territory/.test(p) ? 'territory' : 'tournament', week: 'w', list: [{ rank: 1, guildId: 'g9', name: 'Lobos <b>', wins: 3, points: 21, me: false }, { rank: 2, guildId: 'g1', name: 'Guardiões do Teste', wins: 1, points: 4, me: true }], me: null });
  /* um de cada motivo (reason); winner = id da GUILDA vencedora, null = ninguém ficou com o território; defender null = território sem dono */
  if (p.indexOf('/tourney/battles') === 0) return Promise.resolve({ week: '2026-W46', list: [
    BT(1, 'r2t2', 'd5', G1, G9, 'g1', 'fight', DUELS), BT(2, 'r5t1', 'd5', G9, null, 'g9', 'neutral'), BT(3, 'r3t1', 'd5', G1, G9, 'g1', 'walkover'),
    BT(4, 'r6t2', 'd6', G9, null, null, 'empty'), BT(5, 'capital', 'd6', G1, G9, 'g9', 'era'), BT(6, 'r0t1', 'd6', G1, G1, 'g1', 'owner')] });
  if (p.indexOf('/tourney/lineup') === 0 && m === 'GET') { const k = /d6/.test(p) ? 'd6' : 'd5', r = { slot: k, members: k === 'd6' ? [] : ['p2'], lockAt: LOCK[k], locked: lockMode === 'locked' && k === 'd5' }; if (lockMode === 'none') { delete r.lockAt; delete r.locked; } return Promise.resolve(r); }
  if (p === '/tourney/lineup' && m === 'PUT') return lineupAns && lineupAns.code ? Promise.reject(lineupAns) : Promise.resolve({ ok: true, slot: b.slot, members: b.members.slice(), lockAt: LOCK[b.slot] });
  if (p === '/tourney/declare') return declareAns && declareAns.code ? Promise.reject(declareAns) : Promise.resolve(declareAns);
  return Promise.reject({ code: 'not_found' }); } };

const SRC = fs.readFileSync(path.join(R, 'js/p_tourney2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_tourney2.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const seenActs = new Set(); let nImgs = 0;
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|sorteio pago|última chance|só hoje|oferta acaba/i.test(h), tag + ': preço em dinheiro ou pressão de compra');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); nImgs++; }
  return bt.length; }
const click = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async () => { def.onOpen(); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;
const tab = t => click('tab', { t });
let ts = 1000; const frames = (n, dt) => { for (let i = 0; i < n; i++) { const f = raf.shift(); if (!f) break; ts += dt; drew = []; f(ts); } };

(async () => {
  // 0) registro
  assert.strictEqual(addName, 'tourney2'); assert.strictEqual(g.PANEL_ON.tourney2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=[^=]/.test(SRC), 'o arquivo não liga chave nenhuma');
  for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
  out.push('registro: painel tourney2, chave desligada, sem alert/confirm/prompt, sem emoji');

  // 1) online desligado: estado honesto, zero rede, nenhuma guilda nem batalha na tela
  N.DATA.on = false; G.DATA.on = true; N._reset(); await open(); check('desligado'); has('Em breve: abre com o online'); has('Prêmios do torneio'); not('Lobos'); not('tr2-tabs'); not('data-x="tile"');
  click('decl', { k: 'd5' }); click('lu', { k: 'save' }); click('watch', { i: '0' }); click('yes'); has('Em breve: abre com o online'); assert.strictEqual(calls.length, 0, 'sem rede com a chave desligada');
  { frames(1, 16); assert.strictEqual(drew.length, 1, 'parado: um herói por quadro, pela rota do jogo'); assert.strictEqual(drew[0].st.mount, false); }
  out.push('chave desligada: "abre com o online", regras e prêmios do módulo, zero chamadas de rede');

  // 2) chave ligada: "Carregando" até a resposta; depois o mapa do servidor, com nome de guilda escapado
  N.DATA.on = true; N._reset(); def.onOpen(); def.render(); has('Carregando o torneio…'); check('carregando'); await settle(); def.render(); check('mapa');
  assert(calls.includes('GET /tourney') && sent(/kind=territory/) === 1 && sent(/lineup\?slot=d5/) === 1, 'onOpen busca mapa, os dois rankings e a escalação de sexta');
  has('tr2-tabs'); has('Declarar ataques · ataques hoje: 2'); has('Lobos &lt;b&gt;'); not('Lobos <b>'); has('Seu território · 1 ponto'); has('com ataque marcado'); assert.strictEqual(buttons().filter(b => b.dataset.x === 'tile').length, 28, '28 territórios');
  out.push('ligada: carregando, depois fase, ataques do dia, 28 territórios com dono e ataque marcado; nome de guilda escapado');

  // 3) território meu: Escalar a defesa; de outro: declarar em DOIS toques, com o dia escolhido; recusa do servidor em texto
  click('tile', { id: 'r0t1' }); check('território meu'); has('Escalar a defesa'); not('data-x="decl"'); click('defend'); has('Escalados 1/15'); tab('map');
  click('tile', { id: 'r2t2' }); check('território de outro'); has('Atacar sexta 20h'); has('Atacar sábado 20h'); has('Guardiões do Teste · sexta 20h');
  click('decl', { k: 'd5' }); has('Já há um ataque a este território nesse dia'); not('tr2-conf'); assert.strictEqual(sent(/declare/), 0);
  click('decl', { k: 'd6' }); check('confirma ataque'); has('Atacar <b>Medieval · território 2</b> no <b>sábado às 20h</b>?'); assert.strictEqual(sent(/declare/), 0, '1º toque não envia');
  click('no'); not('tr2-conf'); assert.strictEqual(sent(/declare/), 0, 'Cancelar não envia');
  click('decl', { k: 'd6' }); click('yes'); has('Declarando ataque…'); check('ocupado'); await settle(); assert(calls.includes('POST /tourney/declare {"territory":"r2t2","slot":"d6"}'), 'declara o território e o dia escolhidos'); has('Ataque declarado para sábado às 20h');
  declareAns = { code: 'daily_limit' }; click('tile', { id: 'capital' }); has('Capital'); click('decl', { k: 'd5' }); click('yes'); await settle(); has('Sua guilda já usou os ataques de hoje'); assert(sent(/"territory":"capital","slot":"d5"/) === 1); declareAns = { declaration: { id: 2 } };
  out.push('mapa: defender leva à escalação; atacar confirma em 2 toques e envia território + dia; recusa (daily_limit) em texto; Capital = id capital');

  // 4) ESCALAÇÃO: as mesmas contas da tela de hoje
  tab('lineup'); check('escalação'); has('Escalados 1/15'); has('>Salva<'); has('Trava em 10 h, às ' + HR(LOCK.d5) + '.'); has('Ana &lt;i&gt; (você)'); not('Ana <i>'); has('Menos de 24 h de guilda antes da trava'); has('FC somada 9 mil');
  { const order = ['Dora', 'Bento', 'Caio', 'Ana'].map(n => H().indexOf('<b>' + n)); assert(order.every((v, i) => v > 0 && (!i || v > order[i - 1])), 'linhas em ordem de FC: ' + order); }
  click('pick', { id: 'p4' }); has('entrou há menos de 24 h antes da trava (pode no sábado)'); has('Escalados 1/15');
  click('pick', { id: 'p1' }); has('Escalados 2/15'); has('Não salva'); has('>2º<'); has('Mediana de era: 4,5');
  click('lu', { k: 'clear' }); has('Escalados 0/15'); click('lu', { k: 'save' }); has('Escale pelo menos 1'); assert.strictEqual(sent(/PUT/), 0);
  click('lu', { k: 'best' }); has('Escalados 3/15'); click('lu', { k: 'save' }); has('Salvando a escalação…'); await settle();
  assert(calls.includes('PUT /tourney/lineup {"slot":"d5","members":["p2","p3","p1"]}'), 'salva os de maior FC elegíveis, sem a Dora: ' + calls.filter(c => /PUT/.test(c))); has('Escalação de sexta salva (3/15)'); has('>Salva<');
  click('slot', { k: 'd6' }); await settle(); has('Escalados 0/15'); click('pick', { id: 'p4' }); has('Escalados 1/15'); has('Trava em 34 h, às ' + HR(LOCK.d6) + '.');
  lineupAns = { code: 'lineup_locked', details: { lockAt: Date.UTC(2026, 10, 13, 22, 30) } }; click('lu', { k: 'save' }); await settle(); has('Escalação travada às 19h30'); has('Não salva'); lineupAns = null; check('escalação sábado');   // 409: a hora é a do details.lockAt (22:30 UTC = 19h30 de Brasília)
  out.push('escalação: ordem de FC, posição, 24 h antes da trava, mediana, Limpar, maior FC, Salvar e recusa do servidor');

  // 5) BATALHAS: lista do servidor e a luta animada pelo registro (x1/x4, Pular, Ver de novo, Fechar)
  tab('battles'); check('batalhas'); has('Guardiões do Teste ataca Lobos &lt;b&gt;'); has('Guardiões do Teste tomou · 2 duelos · decidida na luta · vitória da sua guilda');
  has('Lobos &lt;b&gt; ataca Sem dono'); has('Lobos &lt;b&gt; tomou · território sem dono<'); has('Guardiões do Teste tomou · o dono não tinha lutador · vitória da sua guilda'); has('O território segue sem dono · o atacante não tinha lutador<');
  has('Lobos &lt;b&gt; segurou · era mediana do atacante abaixo da região · derrota da sua guilda'); has('Guardiões do Teste já era a dona<'); not('Aguardando a batalha');
  assert.strictEqual((H().match(/class="won"/g) || []).length, 2, 'duas vitórias da minha guilda (fight e walkover)'); assert.strictEqual((H().match(/class="lost"/g) || []).length, 1, 'uma derrota (era)');
  assert.strictEqual(buttons().filter(b => b.dataset.x === 'watch').length, 1, 'só a batalha com registro tem Ver luta'); click('watch', { i: '1' }); has('Esta batalha não teve luta'); not('tr2-ctl');
  click('watch', { i: '0' }); check('luta'); has('tr2-ctl'); has('Duelo 1 de 2'); has('<b>Bento</b>'); has('Lutador 1'); has('FC 9 mil'); has('>x1<'); has('>x4<'); has('Pular'); has('Fechar'); assert(def.busy(), 'durante a luta a tela não é redesenhada por fora');
  frames(1, 16); assert.strictEqual(drew.length, 2, 'dois lutadores por quadro'); assert.strictEqual(drew[0].st.hero, 'kael'); assert.strictEqual(drew[1].st.hero, 'kaia'); assert(drew[0].x < drew[1].x, 'atacante à esquerda, defensor à direita'); assert.strictEqual(drew[0].st.pet, false);
  const X = g.Tourney2.X; frames(3, 700); assert(X.rp.k >= 1, 'o registro anda um golpe por passo'); const hpB = X.rp.hp[1]; assert(hpB < FB.hp && hpB >= 0, 'a vida do alvo é a do registro');
  assert.strictEqual(Math.round(X.rp.duels[0].maxA), FA.hp, 'vida cheia do atacante tirada do registro'); assert.strictEqual(Math.round(X.rp.duels[0].maxB), FB.hp); assert.strictEqual(Math.round(X.rp.duels[1].hpA0), Math.round(d1.hpLeftA), 'rei da colina: o vencedor entra no 2º duelo com a vida que sobrou');
  click('spd', { k: '4' }); has('data-k="4" aria-pressed="true"'); assert.strictEqual(X.rp.speed, 4);
  frames(400, 200); assert(X.rp.done, 'a reprise chega ao fim'); def.render(); check('fim da luta'); has('Guardiões do Teste toma o território'); has('Ver de novo'); not('Pular'); assert(!def.busy());
  click('again'); has('Duelo 1 de 2'); has('Pular'); assert.strictEqual(X.rp.speed, 4, 'a velocidade escolhida fica'); click('skip'); check('pulou'); has('toma o território'); has('Ver de novo'); assert.strictEqual(Math.round(X.rp.hp[0]), Math.round(d2.hpLeftA), 'Pular mostra a vida final do registro'); assert.strictEqual(X.rp.hp[1], 0);
  click('rclose'); not('tr2-ctl'); frames(1, 16); assert.strictEqual(drew.length, 1, 'fechou a luta: volta o herói do jogador');
  out.push('batalhas: lista, motivo sem luta, reprise pelo registro (2 lutadores, vida do registro, rei da colina), x1/x4, Pular, Ver de novo, Fechar');

  // 6) RANKING
  tab('rank'); check('ranking'); has('>1º<'); has('3 vitórias'); has('1 vitória<'); has('(sua)'); has('Lobos &lt;b&gt;'); click('rk', { k: 'territory' }); has('21 pontos'); has('300 Brasões'); check('ranking territórios');
  out.push('ranking (vitórias e territórios) do servidor, prêmios do Sys.guild');

  // 7) MEMBRO COMUM: só vê; toque forjado não envia
  role = 'member'; N._reset(); await open(); const nD = sent(/declare/), nP = sent(/PUT/);
  click('tile', { id: 'r2t2' }); check('membro comum mapa'); not('data-x="decl"'); has('Só o líder e os oficiais declaram ataque.'); click('decl', { k: 'd6' }); has('Só o líder e os oficiais declaram ataques'); not('tr2-conf'); click('yes'); await settle(); assert.strictEqual(sent(/declare/), nD, 'membro comum não declara');
  tab('lineup'); check('membro comum escalação'); has('Só <b>o líder e os oficiais</b> escalam'); not('data-x="lu"'); click('pick', { id: 'p3' }); has('Só o líder e os oficiais escalam'); click('lu', { k: 'save' }); await settle(); assert.strictEqual(sent(/PUT/), nP, 'membro comum não salva');
  out.push('membro comum: sem Atacar, sem Limpar/Salvar; toque forjado não chega ao servidor');

  // 7b) trava: sexta já travada (locked do servidor) mostra a hora do lockAt; resposta sem lockAt = texto genérico, sem hora inventada
  role = 'leader'; lockMode = 'locked'; N._reset(); await open(); tab('lineup'); check('escalação travada'); has('Travada às ' + HR(LOCK.d5) + '. Trocar de equipamento agora não muda a batalha'); not('data-x="lu"');
  click('pick', { id: 'p3' }); has('Escalação travada às ' + HR(LOCK.d5)); click('lu', { k: 'save' }); await settle(); assert.strictEqual(sent(/PUT/), nP, 'escalação travada não salva');
  lockMode = 'none'; N._reset(); await open(); tab('lineup'); check('escalação sem lockAt'); has('A escalação trava antes da batalha.'); assert(!/[Tt]rava[^<]*às \d/.test(H()), 'sem lockAt a tela não cita hora de trava'); lockMode = 'ok';
  out.push('trava: hora do lockAt real (lineup, battles[] e details do 409), estado travado, e texto sem hora quando o lockAt não vem');

  // 8) fora dos dias de declarar: o botão explica; sem o módulo: indisponível com Voltar
  role = 'leader'; phase = 'battle'; N._reset(); await open(); click('tile', { id: 'r2t2' }); check('fase de batalha'); has('Ataques só de segunda a quinta'); click('decl', { k: 'd6' }); not('tr2-conf'); assert.strictEqual(sent(/declare/), nD);
  for (const a of ['tab', 'tile', 'defend', 'decl', 'yes', 'no', 'slot', 'pick', 'lu', 'rk', 'watch', 'spd', 'skip', 'again', 'rclose']) assert(seenActs.has(a), 'ação nunca apareceu num botão: ' + a);
  const keep = g.Sys.guild; g.Sys.guild = null; def.render(); has('Torneio do Poder indisponível agora.'); check('sem módulo'); assert(seenActs.has('back')); g.Sys.guild = keep;
  for (const u of g.Tourney2.urls()) assert(fs.existsSync(path.join(R, u)), 'imagem da lista de carga não existe: ' + u);
  out.push('fase de batalha: Atacar explica e não envia; sem o módulo: indisponível com Voltar; ' + seenActs.size + ' ações vistas em botões; imagens citadas conferidas em disco: ' + nImgs);
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
