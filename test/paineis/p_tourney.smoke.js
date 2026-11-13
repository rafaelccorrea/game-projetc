'use strict';
// Teste de fumaça do js/p_tourney.js em Node: Sys.guild e Sys.tourneyNet REAIS; a rede (Sys.net._call) é de mentira. Rodar: node test/paineis/p_tourney.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
['loot', 'level', 'chest', 'clock', 'guild', 'tourneynet'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const g = globalThis; g.window = g;
const els = {}; const mkEl = id => { const e = { id, children: [], style: {}, dataset: {}, _h: '', textContent: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; } }; return e; };
g.document = { head: mkEl('head'), createElement: () => mkEl(''), getElementById: id => els[id] || null }; g.document.head.appendChild = c => { if (c.id) els[c.id] = c; return c; };
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; g.Sys.host = host; g.S = host.S || {}; if (!g.S.sys) g.S.sys = {};
g.V = { innerHTML: '' }; g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.snd = () => {}; g.toast = () => {}; g.render = () => def.render();
g.Screens = { close() {}, current: () => 'tourney' }; let def = null; g.Panels = { add(n, d) { def = d; return d; } };
vm.runInThisContext(fs.readFileSync(path.join(R, 'js/p_tourney.js'), 'utf8'), { filename: 'p_tourney.js' });
assert(def && def.render && def.click && def.onOpen);
const btn = (x, i, o) => ({ dataset: Object.assign({ x, i: String(i == null ? '' : i) }, o || {}) }); const H = () => g.V.innerHTML; const has = s => assert(H().includes(s), 'faltou: ' + s); const hasNot = s => assert(!H().includes(s), 'sobrou: ' + s);
const noEmoji = () => assert(!/\p{Extended_Pictographic}/u.test(H()), 'sem emoji'); const out = [];
const N = g.Sys.tourneyNet, G = g.Sys.guild; const tick = () => new Promise(r => setTimeout(r, 5));
const NOW = (g.Sys.host && g.Sys.host.now) ? g.Sys.host.now() : Date.now(), LOCK = { d5: NOW + 10 * 36e5, d6: NOW + 34 * 36e5 }; let lineupAns = null;
/* membros da guilda (Sys.guildNet.mine): p4 entrou há 10 h → fora da sexta (trava em 30 h, precisa de 24 h antes), dentro do sábado */
const MEMBERS = [{ id: 'p1', name: 'Ana <i>', role: 'leader', joinedAt: NOW - 9e8, me: true, fc: 5000, level: 60, era: 4 }, { id: 'p2', name: 'Bento', role: 'member', joinedAt: NOW - 9e8, fc: 9000, level: 70, era: 5 },
  { id: 'p3', name: 'Caio', role: 'member', joinedAt: NOW - 9e8, fc: 7000, level: 65, era: 3 }, { id: 'p4', name: 'Dora', role: 'member', joinedAt: NOW - 10 * 36e5, fc: 99000, level: 80, era: 6 }];
g.Sys.guildNet = { DATA: { on: true }, mine: () => ({ members: MEMBERS }), refresh: () => Promise.resolve({ ok: true }) };
const calls = []; let declareAns = { declaration: { id: 1 }, attacksLeftToday: 1 };
const VIEW = () => ({ week: '2026-W46', phase: 'declare', now: Date.now(), size: 15, battles: [{ slot: 'd5', at: 1, lockAt: 0 }],
  map: [{ id: 'r0t1', region: 0, capital: false, owner: { id: 'g1', name: 'Guardiões do Teste' }, attacks: [] }, { id: 'r2t2', region: 2, capital: false, owner: { id: 'g9', name: 'Lobos <b>' }, attacks: [{ slot: 'd5', attacker: { id: 'g1', name: 'Guardiões do Teste' } }] },
    { id: 'capital', region: 4, capital: true, owner: { id: 'g9', name: 'Lobos <b>' }, attacks: [] }, { id: 'lixo' }, null],
  my: { guildId: 'g1', role: 'leader', canDeclare: true, canLineup: true, attacksLeftToday: 2, lineups: { d5: [], d6: [] }, territories: ['r0t1'] } });
g.Sys.net = { _call(m, p, b) { calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (p === '/tourney') return Promise.resolve(VIEW());
  if (p.indexOf('/tourney/ranking') === 0) return Promise.resolve({ kind: /territory/.test(p) ? 'territory' : 'tournament', week: 'w', list: [{ rank: 1, guildId: 'g9', name: 'Lobos <b>', wins: 3, points: 21, me: false }, { rank: 2, guildId: 'g1', name: 'Guardiões do Teste', wins: 1, points: 4, me: true }], me: null });
  if (p.indexOf('/tourney/battles') === 0) return Promise.resolve({ week: 'w', list: [{ id: 1, territory: 'r2t2', slot: 'd5', attacker: { id: 'g1', name: 'Guardiões do Teste' }, defender: { id: 'g9', name: 'Lobos <b>' }, winner: 'g1', winnerName: 'Guardiões do Teste', reason: 'fight', duels: [] }] });
  if (p.indexOf('/tourney/lineup') === 0 && m === 'GET') return Promise.resolve({ slot: /d6/.test(p) ? 'd6' : 'd5', members: /d6/.test(p) ? [] : ['p2'], lockAt: LOCK[/d6/.test(p) ? 'd6' : 'd5'], locked: false });
  if (p === '/tourney/lineup' && m === 'PUT') return lineupAns && lineupAns.code ? Promise.reject(lineupAns) : Promise.resolve({ slot: b.slot, members: b.members.slice(), lockAt: LOCK[b.slot] });
  if (p === '/tourney/declare') return declareAns && declareAns.code ? Promise.reject(declareAns) : Promise.resolve(declareAns);
  return Promise.reject({ code: 'not_found' }); } };
(async () => {
  // 1) chave desligada: a tela é a de antes (estado vazio honesto), nada sai para a rede
  N.DATA.on = false; G.DATA.on = true; def.onOpen(); def.render(); const off = H(); has('EM BREVE'); has('Abre com o online'); assert.strictEqual(calls.length, 0, 'sem rede com a chave desligada');
  def.click(btn('tab', 1)); has('Aparecem aqui quando as guildas abrirem com o online'); def.click(btn('tab', 2)); has('Abre com as guildas online'); def.click(btn('tab', 0)); def.click(btn('reg', 0)); def.click(btn('act', 0)); has('Em breve'); assert.strictEqual(calls.length, 0); noEmoji();
  out.push('chave desligada: estado vazio de antes, zero chamadas de rede');
  // 2) chave ligada, cache ainda vazio: continua a tela de antes até a resposta chegar
  N.DATA.on = true; N._reset(); def.onOpen(); def.render(); has('EM BREVE'); await tick(); await tick();
  assert(calls.some(c => c === 'GET /tourney') && calls.some(c => /kind=territory/.test(c)), 'onOpen busca mapa e os dois rankings');
  // 3) cache pronto: mapa, dono, guerra e bônus do servidor
  def.render(); hasNot('EM BREVE'); has('Declarar ataques'); has('ainda pode declarar hoje: 2'); has('Sua · 1 de 3'); has('Lobos &lt;b&gt;'); hasNot('Lobos <b>'); has('Você ataca'); noEmoji();
  out.push('ligada: fase, ataques do dia, dono de cada região, guerra; nome de guilda escapado');
  // 4) território meu: Defender avisa (escalação sem tela aprovada); território de outro: confirmação em dois toques e POST com o slot livre
  def.click(btn('reg', 0)); has('Defender'); has('Atacar'); def.click(btn('act', 0)); has('Escalados 1/15'); has('Sexta 20h'); assert(!calls.some(c => /declare/.test(c))); def.click(btn('tab', 0));
  def.click(btn('close')); def.click(btn('reg', 2)); def.click(btn('act', 1)); has('Toque em Atacar de novo para confirmar'); has('sábado'); assert(!calls.some(c => /declare/.test(c)), '1º toque não envia');
  def.click(btn('act', 1)); has('Declarando ataque'); await tick(); await tick(); assert(calls.some(c => c === 'POST /tourney/declare {"territory":"r2t2","slot":"d6"}'), 'declara no dia livre (d5 já ocupado)'); has('Ataque declarado para sábado às 20h');
  out.push('Defender abre a escalação; Atacar confirma em 2 toques e envia território + dia livre');
  // 5) recusa do servidor vira texto; Capital usa o id 'capital'
  declareAns = { code: 'daily_limit' }; def.click(btn('close')); def.click(btn('reg', 99)); def.click(btn('act', 0)); def.click(btn('act', 0)); await tick(); await tick(); has('já usou os ataques de hoje'); assert(calls.some(c => /"territory":"capital","slot":"d5"/.test(c)));
  out.push('recusa do servidor (daily_limit) explicada; Capital = id capital');

  def.click(btn('close'));
  // 6) ESCALAÇÃO: lista em ordem de FC, posição na fila, bloqueio de quem entrou há pouco, limite, Os 15 de maior FC, Salvar e recusa do servidor
  def.click(btn('tab', 3)); has('Escalação'); has('Escalados 1/15'); has('Salva'); has('Trava em 10 h, às 19h'); has('Ana &lt;i&gt; (você)'); hasNot('Ana <i>'); has('Menos de 24 h de guilda antes da trava'); has('FC somada 9 mil'); noEmoji();
  { const order = ['Dora', 'Bento', 'Caio', 'Ana'].map(n => H().indexOf('>' + n)); assert(order.every((v, i) => v > 0 && (!i || v > order[i - 1])), 'linhas em ordem de FC: ' + order); }
  def.click(btn('pick', '', { id: 'p4' })); has('entrou há menos de 24 h antes da trava (pode no sábado)'); has('Escalados 1/15');
  def.click(btn('pick', '', { id: 'p1' })); has('Escalados 2/15'); has('Não salva'); has('>2º<'); has('Mediana de era: 4,5');
  def.click(btn('lu', '', { k: 'clear' })); has('Escalados 0/15'); def.click(btn('lu', '', { k: 'save' })); has('Escale pelo menos 1'); assert(!calls.some(c => /PUT/.test(c)));
  def.click(btn('lu', '', { k: 'best' })); has('Escalados 3/15'); def.click(btn('lu', '', { k: 'save' })); await tick(); await tick();
  assert(calls.some(c => c === 'PUT /tourney/lineup {"slot":"d5","members":["p2","p3","p1"]}'), 'salva os de maior FC elegíveis, sem a Dora: ' + calls.filter(c => /PUT/.test(c))); has('Escalação de sexta salva (3/15)'); has('>Salva<');
  def.click(btn('slot', '', { k: 'd6' })); await tick(); has('Escalados 0/15'); def.click(btn('pick', '', { id: 'p4' })); has('Escalados 1/15'); lineupAns = { code: 'lineup_locked' }; def.click(btn('lu', '', { k: 'save' })); await tick(); await tick(); has('Escalação travada às 19h'); has('Não salva'); lineupAns = null;
  out.push('escalação: ordem de FC, posição, 24 h antes da trava, mediana, Limpar, maior FC, Salvar e recusa do servidor');
  // 6b) membro comum só vê; escalação travada não aceita toque
  { const V0 = VIEW(); V0.my.canLineup = false; N._reset(); const keep = g.Sys.net._call; g.Sys.net._call = (m, p, b) => p === '/tourney' ? Promise.resolve(V0) : keep(m, p, b); def.onOpen(); await tick(); await tick(); def.render(); def.click(btn('tab', 3)); has('Só o líder e os oficiais escalam'); hasNot('data-k="save"'); const nPut = calls.filter(c => /PUT/.test(c)).length;
    def.click(btn('pick', '', { id: 'p3' })); has('Só o líder e os oficiais escalam'); assert.strictEqual(calls.filter(c => /PUT/.test(c)).length, nPut); g.Sys.net._call = keep; N._reset(); def.onOpen(); await tick(); await tick(); def.render(); }
  out.push('membro comum: só vê, sem botões de salvar');
  // 7) batalhas e ranking do servidor
  def.click(btn('tab', 1)); has('Guardiões do Teste ataca Lobos &lt;b&gt;'); has('Venceu: Guardiões do Teste'); hasNot('Aparecem aqui quando'); noEmoji();
  def.click(btn('tab', 2)); has('1º'); has('3 vitórias'); has('1 vitória<'); has('(sua)'); def.click(btn('rk', 1)); has('21 pts'); noEmoji();
  out.push('batalhas e ranking (torneio e territórios) do servidor');
  // 8) desligar de novo: volta exatamente à tela vazia
  N.DATA.on = false; def.onOpen(); def.render(); assert.strictEqual(H(), off, 'chave desligada de novo = tela de antes, byte a byte');
  out.push('desligar a chave devolve a tela de antes, igual byte a byte');
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
