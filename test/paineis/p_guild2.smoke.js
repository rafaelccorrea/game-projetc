'use strict';
// Teste de fumaça do js/p_guild2.js (GUILDA V2) em Node: Sys.guild e Sys.guildNet REAIS; a rede (Sys.net._call) é de mentira. Rodar: node test/paineis/p_guild2.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'level', 'chest', 'clock', 'guild', 'guildnet', 'tourneynet'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const G = g.Sys.guild, GN = g.Sys.guildNet; assert(G && GN, 'módulos carregados');

/* ---------- DOM de mentira ---------- */
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', width: 0, height: 0, clientWidth: 390, clientHeight: 176, scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, getContext: () => ctx });
const canvas = mkEl('gd2_stc'), scroll = mkEl('gd2_scroll'), toastEl = mkEl('gd2_toast');
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), activeElement: null, getElementById: id => { const el = { gd2_stc: canvas, gd2_scroll: scroll, gd2_toast: toastEl }[id]; return el && H().includes('id="' + id + '"') ? el : null; } };
let raf = []; g.requestAnimationFrame = f => { raf.push(f); return raf.length; }; g.cancelAnimationFrame = () => { raf = []; };
g.Image = function () { this.complete = true; this.naturalWidth = 512; this.naturalHeight = 512; this.src = ''; };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; const NOW = host.now();
const spent = []; host.canSpendGold = n => g.S.gold >= n; host.spendGold = n => { if (g.S.gold < n) return false; g.S.gold -= n; spent.push('gold:' + n); return true; };
host.canSpendGems = n => g.S.gems >= n; host.spendGems = n => { if (g.S.gems < n) return false; g.S.gems -= n; spent.push('gems:' + n); return true; };
g.Sys.host = host; g.S = { sys: { level: { lvl: 60, xp: 0 } }, hero: 'kael', gold: 1e6, gems: 0, stage: 40 };
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'guild2'; g.HS = 155; g.snd = () => {};
let drew = []; g.drawHeroFull = (c, x, y, k, st) => { drew.push({ x, y, k, st }); return true; };
let def = null, addName = ''; g.render = () => def.render(); const opened = [];
g.Screens = { close() {}, current: () => 'guild2' };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, open(n, o) { opened.push(n + ':' + (o && o.from)); return true; } };

/* ---------- servidor de mentira (contrato 10.1 e 10.4) ---------- */
const calls = []; let role = 'leader', inGuild = true; const fail = {};
const MEMBERS = () => role === 'leader'
  ? [{ id: 'p1', name: 'Ana <i>', role: 'leader', me: true, contrib: 10, joinedAt: NOW - 9e8, fc: 5000, level: 60 }, { id: 'p2', name: 'Bento', role: 'officer', contrib: 30, fc: 9000, level: 70 }, { id: 'p3', name: 'Caio', role: 'member', contrib: 5, lastSeen: NOW - 5 * 36e5 }, { id: 'p4', name: 'Dora', role: 'member', contrib: 1 }]
  : [{ id: 'p1', name: 'Ana <i>', role: 'member', me: true, contrib: 10, joinedAt: NOW - 9e8 }, { id: 'p2', name: 'Bento', role: 'leader', contrib: 30 }, { id: 'p3', name: 'Caio', role: 'officer', contrib: 5 }, { id: 'p4', name: 'Dora', role: 'member', contrib: 1 }];
const ROUTES = {
  'GET /guild': () => { if (!inGuild) throw { code: 'not_in_guild' }; return { guild: { id: 'g1', name: 'Lobos <b>', level: 2, xp: 1700, members: 4, maxMembers: 22 }, me: { role, coin: 77, donatedToday: [] }, members: MEMBERS(), requests: [{ playerId: 'p9', name: 'Eva <u>' }], territories: [{ region: 0, capital: false }] }; },
  'GET /guild/blessings': () => ({ level: 2, xpFree: 1234, list: [{ id: 'atk', value: 0.5, cap: 1 }] }),
  'GET /guild/boss': () => ({ level: 2, hpMax: 100000, hpLeft: 63000, hitsLeft: 2 }),
  'POST /guild/boss/hit': () => ({ damage: 4321, hitsLeft: 1, coin: 10 }),
  'GET /guild/shop': () => ({ list: [{ id: 'forge10', bought: 2 }] }),
  'POST /guild/shop/buy': () => ({}), 'GET /guild/missions': () => ({ list: [{ id: 'bossDown', progress: 1, claimed: false }, { id: 'checkins100', progress: 74 }] }),
  'POST /guild/missions/bossDown/claim': () => ({}), 'POST /guild/checkin': () => ({}), 'POST /guild/donate': () => ({ coin: 10 }),
  'POST /guild/members/p3/kick': () => ({}), 'POST /guild/members/p4/kick': () => ({}), 'POST /guild/members/p4/promote': () => ({}), 'POST /guild/members/p2/demote': () => ({}),
  'POST /guild/leader': () => ({}), 'POST /guild/blessings/atk/upgrade': () => ({}), 'POST /guild/requests/p9/accept': () => ({}), 'POST /guild/requests/p9/decline': () => ({}),
  'POST /guild/leave': () => { inGuild = false; return {}; },
  'GET /guilds': () => [{ id: 'g7', name: 'Rubra <b>', level: 3, members: 10, maxMembers: 24, open: true, minLevel: 30 }, { id: 'g8', name: 'Véu', open: false }],
  'POST /guilds/g7/join': () => { inGuild = true; return { status: 'joined' }; }, 'POST /guilds': () => { inGuild = true; return { id: 'g1' }; } };
g.Sys.net = { _call(m, p, b) { const k = m + ' ' + p.split('?')[0]; calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (fail[k]) return Promise.reject({ code: fail[k] }); const h = ROUTES[k]; if (!h) return Promise.reject({ code: 'not_found' });
  try { return Promise.resolve(h(b)); } catch (e) { return Promise.reject(e); } } };

const SRC = fs.readFileSync(path.join(R, 'js/p_guild2.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_guild2.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|sorteio pago|última chance|só hoje|oferta acaba/i.test(h), tag + ': preço em dinheiro ou pressão de compra');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const click = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async () => { def.onOpen(); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;
const tab = t => click('tab', { t });

(async () => {
  // 0) registro
  assert.strictEqual(addName, 'guild2'); assert.strictEqual(g.PANEL_ON.guild2, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose);
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=/.test(SRC), 'o arquivo não liga chave nenhuma');
  for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
  out.push('registro: painel guild2, chave desligada, sem alert/confirm/prompt, sem emoji');

  // 1) online desligado (e ligado mas não iniciado): estado honesto, zero rede, nenhuma guilda ou membro na tela
  G.DATA.on = true; GN.DATA.on = false; GN._reset(); G.setProvider(null); await open(); check('desligado'); has('Em breve: abre com o online'); has('Como a guilda funciona'); not('Lobos'); not('Ana');
  click('checkin'); click('leave'); click('create'); has('Em breve: abre com o online'); not('gd2-conf'); assert.strictEqual(calls.length, 0, 'sem rede com o online desligado');
  GN.DATA.on = true; def.onOpen(); def.render(); check('não iniciado'); has('Em breve: abre com o online'); has('ainda não conectou'); assert.strictEqual(calls.length, 0, 'sem rede antes de o online iniciar');
  G.DATA.on = false; def.render(); has('Guildas: em breve'); G.DATA.on = true;
  { const r = raf.shift(); assert(r, 'o laço do palco roda'); drew = []; r(1000); assert.strictEqual(drew.length, 1, 'um herói por quadro'); assert.strictEqual(drew[0].st.mount, false); assert(drew[0].k > 0 && isFinite(drew[0].k)); }
  out.push('online desligado ou não iniciado: "abre com o online", regras do módulo, zero rede; herói desenhado pela rota do jogo');

  // 2) online pronto, LÍDER: cartão, membros e pedidos do servidor, nomes escapados
  assert.strictEqual((await GN.start(g.S, host)).ok, true); await open(); check('membros líder');
  assert(sent(/^GET \/guild$/) >= 2, 'onOpen refaz a leitura da guilda');
  has('Lobos &lt;b&gt;'); not('Lobos <b>'); has('Ana &lt;i&gt; (você)'); not('Ana <i>'); has('Eva &lt;u&gt;'); not('Eva <u>'); has('seu cargo: <b>Líder</b>'); has('4/22'); has('FC '); has('visto há 5 h');
  // expulsar: 1º toque só confirma, 2º envia; "Carregando" durante a Promise
  click('sel', { id: 'p3' }); check('membro aberto'); has('data-k="kick"'); has('data-k="promote"'); has('data-k="transfer"');
  click('mact', { k: 'kick', id: 'p3' }); check('confirma expulsar'); has('Expulsar <b>Caio</b>?'); assert.strictEqual(sent(/kick/), 0, '1º toque não envia');
  click('no'); not('gd2-conf'); assert.strictEqual(sent(/kick/), 0, 'Cancelar não envia');
  click('mact', { k: 'kick', id: 'p3' }); click('yes'); has('Expulsando…'); check('ocupado'); click('leave'); not('gd2-conf'); await settle();
  assert(calls.includes('POST /guild/members/p3/kick'), 'expulsa o membro certo'); has('Caio saiu da guilda'); not('Expulsando…');
  // recusa do servidor vira texto
  fail['POST /guild/members/p4/kick'] = 'forbidden'; click('sel', { id: 'p4' }); click('mact', { k: 'kick', id: 'p4' }); click('yes'); await settle(); has('O seu cargo não permite isso'); delete fail['POST /guild/members/p4/kick'];
  // passar a liderança: dois toques
  click('sel', { id: 'p2' }); click('mact', { k: 'transfer', id: 'p2' }); has('Passar a liderança para <b>Bento</b>?'); assert.strictEqual(sent(/\/guild\/leader/), 0); click('yes'); has('Passando a liderança…'); await settle();
  assert(calls.includes('POST /guild/leader {"playerId":"p2"}'), 'transfere para o membro certo');
  click('mact', { k: 'promote', id: 'p4' }); await settle(); assert(calls.includes('POST /guild/members/p4/promote')); has('Dora agora é Oficial');
  click('mact', { k: 'demote', id: 'p2' }); await settle(); assert(calls.includes('POST /guild/members/p2/demote'));
  click('req', { k: 'accept', id: 'p9' }); await settle(); assert(calls.includes('POST /guild/requests/p9/accept')); has('Pedido aceito');
  out.push('líder: membros e pedidos do servidor escapados; expulsar e passar a liderança em 2 toques; promover, rebaixar e aceitar; recusa (forbidden) em texto');

  // 3) Doar: check-in direto; doação em 2 toques, ouro debitado só depois do ok; sem diamante = motivo, sem rede
  tab('donate'); check('doar'); has('Check-in'); click('checkin'); has('Carregando…'); await settle(); assert(calls.includes('POST /guild/checkin')); has('Check-in feito');
  fail['POST /guild/checkin'] = 'daily_limit'; click('checkin'); await settle(); has('Você já fez isso hoje'); delete fail['POST /guild/checkin'];
  const gold0 = g.S.gold, cost = Math.round(G.DATA.donate[0].goldk * host.goldUnit());
  click('don', { id: 'gold_s' }); check('confirma doar'); has('Doar <b>'); assert.strictEqual(sent(/donate/), 0, '1º toque não envia'); assert.strictEqual(g.S.gold, gold0);
  click('yes'); has('Doando…'); await settle(); assert(calls.includes('POST /guild/donate {"kind":"gold_s"}')); assert.strictEqual(g.S.gold, gold0 - cost, 'ouro debitado depois do ok do servidor'); has('Doado: +');
  fail['POST /guild/donate'] = 'daily_limit'; click('don', { id: 'gold_l' }); click('yes'); await settle(); has('Você já fez isso hoje'); assert.strictEqual(spent.length, 1, 'recusa do servidor não debita'); delete fail['POST /guild/donate'];
  click('don', { id: 'gems' }); has('Faltam diamantes'); not('gd2-conf'); assert.strictEqual(sent(/"kind":"gems"/), 0);
  out.push('doar: check-in, doação em 2 toques com débito só depois do ok, recusa (daily_limit) em texto, sem diamante não envia');

  // 4) Bênçãos
  tab('bless'); check('bênçãos'); has('XP guardado: <b>1.234</b>'); has('data-x="bls"'); click('bls', { id: 'atk' }); await settle(); assert(calls.includes('POST /guild/blessings/atk/upgrade')); has('Ataque subiu para toda a guilda');
  // 5) Chefe: carrega, mostra a vida do servidor, golpe
  delete g.Guild2.X.d.boss; tab('boss'); has('Carregando…'); check('chefe carregando'); await settle(); check('chefe'); has('Chefe da semana · nível 2'); has('2 golpes hoje'); has('63%');
  click('hit'); has('Atacando o chefe…'); await settle(); assert(calls.includes('POST /guild/boss/hit')); await settle(); def.render(); has('Último golpe: <b>'); check('chefe depois do golpe');
  fail['GET /guild/boss'] = 'not_found'; click('retry', { k: 'boss' }); await settle(); has('Isso ainda não está disponível no servidor'); has('data-x="retry"'); check('chefe com erro'); delete fail['GET /guild/boss'];
  out.push('bênçãos (subir) e chefe (vida do servidor, golpe, erro com Tentar de novo)');

  // 6) Loja: compra em 2 toques; item acima do nível da guilda não tem botão
  tab('shop'); await settle(); check('loja'); has('3 de 5 nesta semana'); has('Abre no nível 3 da guilda'); not('data-id="stones5"');
  click('buy', { id: 'forge10' }); check('confirma comprar'); has('Trocar <b>20 Brasões</b> por <b>10 pedras de forja</b>?'); assert.strictEqual(sent(/shop\/buy/), 0, '1º toque não envia');
  click('yes'); has('Comprando…'); await settle(); assert(calls.includes('POST /guild/shop/buy {"itemId":"forge10"}')); await settle();
  fail['POST /guild/shop/buy'] = 'weekly_limit'; click('buy', { id: 'food100' }); click('yes'); await settle(); has('Limite desta semana atingido'); delete fail['POST /guild/shop/buy'];
  click('buy', { id: 'stones5' }); has('Abre no nível 3 da guilda'); not('gd2-conf');
  // 7) Missões
  tab('miss'); await settle(); check('missões'); has('74/100'); has('data-id="bossDown"'); not('data-id="checkins100"'); click('claim', { id: 'bossDown' }); await settle(); assert(calls.includes('POST /guild/missions/bossDown/claim')); await settle();
  // 8) Territórios e atalho do torneio
  tab('terr'); check('territórios'); has('pontos de território'); has('Abrir o Torneio do Poder'); click('tour'); assert.deepStrictEqual(opened, ['tourney:guild2']);
  out.push('loja (comprar em 2 toques, recusa weekly_limit, item travado sem botão), missões (resgatar) e territórios (abre o torneio)');

  // 9) MEMBRO COMUM: não vê botões de líder; toque forjado não envia
  role = 'member'; await GN.refresh(g.S, host); await open(); check('membros comum'); has('seu cargo: <b>Membro</b>'); not('data-x="sel"'); not('data-x="mact"'); not('data-x="req"'); not('Pedidos para entrar');
  const nK = sent(/kick|promote|demote|\/guild\/leader/); click('mact', { k: 'kick', id: 'p4' }); click('yes'); await settle(); assert.strictEqual(sent(/kick|promote|demote|\/guild\/leader/), nK, 'membro comum não envia ação de líder');
  tab('bless'); check('bênçãos comum'); not('data-x="bls"'); has('Só <b>líder e oficiais</b> sobem as bênçãos'); const nB = sent(/upgrade/); click('bls', { id: 'atk' }); await settle(); assert.strictEqual(sent(/upgrade/), nB);
  out.push('membro comum: sem abrir membro, sem promover/expulsar/transferir, sem pedidos, sem subir bênção');

  // 10) Sair: 2 toques; recusa leader_must_transfer; depois sai e cai na busca
  tab('members'); click('leave'); check('confirma sair'); has('Sair da guilda?'); assert.strictEqual(sent(/leave/), 0, '1º toque não envia');
  fail['POST /guild/leave'] = 'leader_must_transfer'; click('yes'); has('Saindo da guilda…'); await settle(); has('Passe a liderança antes de sair'); delete fail['POST /guild/leave'];
  click('leave'); click('yes'); await settle(); assert(calls.includes('POST /guild/leave')); await settle(); def.render(); await settle(); def.render(); check('sem guilda');
  has('Entrar numa guilda'); has('Rubra &lt;b&gt;'); not('Rubra <b>'); has('Pedir'); not('gd2-tabs'); assert.strictEqual(G.ensure(g.S).id, null);
  // 11) Criar: nome escapado, 2 toques, ouro debitado só depois do ok; recusa name_taken
  click('create'); has('depois de sair de uma guilda'); host.t += 8 * 864e5; click('create'); has('O nome precisa ter de 3 a 24 letras'); g.Guild2.X.name = 'Nova <x>'; def.render(); has('value="Nova &lt;x&gt;"');
  click('create'); check('confirma criar'); has('Criar a guilda <b>Nova &lt;x&gt;</b>'); not('Nova <x>'); assert.strictEqual(sent(/^POST \/guilds /), 0, '1º toque não envia');
  fail['POST /guilds'] = 'name_taken'; const gold1 = g.S.gold; click('yes'); has('Criando a guilda…'); await settle(); has('Já existe uma guilda com esse nome'); assert.strictEqual(g.S.gold, gold1, 'recusa não debita'); delete fail['POST /guilds'];
  // entrar numa guilda da lista
  click('join', { id: 'g7' }); has('Carregando…'); await settle(); assert(calls.includes('POST /guilds/g7/join')); await settle(); def.render(); has('Você entrou na guilda'); has('gd2-tabs'); check('entrou');
  // criar de verdade (sai antes)
  role = 'leader'; click('leave'); click('yes'); await settle(); await settle(); host.t += 8 * 864e5; g.Guild2.X.name = 'Nova <x>'; def.render(); click('create'); click('yes'); await settle();
  assert(calls.some(c => c.indexOf('POST /guilds {"name":"Nova <x>"') === 0), 'cria com o nome digitado'); assert.strictEqual(g.S.gold, gold1 - G.createCost(host), 'ouro da criação debitado depois do ok'); await settle(); def.render(); has('Guilda criada'); check('criou');
  out.push('sair em 2 toques (recusa leader_must_transfer), busca com nomes escapados, entrar, criar em 2 toques (recusa name_taken, débito só no ok)');

  // 12) toda ação desenhada foi vista; toda imagem citada existe (também as da lista de carga)
  for (const u of g.Guild2.urls()) assert(fs.existsSync(path.join(R, u)), 'imagem da lista de carga não existe: ' + u);
  for (const a of ['tab', 'sel', 'mact', 'req', 'leave', 'yes', 'no', 'checkin', 'don', 'bls', 'hit', 'buy', 'claim', 'find', 'join', 'create', 'tour', 'retry']) assert(seenActs.has(a), 'ação nunca apareceu num botão: ' + a);
  // sem o módulo: tela de indisponível com Voltar
  const keep = g.Sys.guild; g.Sys.guild = null; def.render(); has('Guilda indisponível agora.'); check('sem módulo'); assert(seenActs.has('back')); g.Sys.guild = keep;
  out.push('imagens em disco: ' + seenImgs.size + ' na tela + ' + g.Guild2.urls().length + ' na lista de carga; ' + seenActs.size + ' ações vistas em botões');
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
