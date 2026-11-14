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
/* respostas NO FORMATO EXATO do contrato docs/API_SERVIDOR.md 10.5 (GET /guild, doar, check-in, chefe, golpe, loja, missões) */
const DAILY = [], WEEK = '2026-W46', SRV_GOLDK = 61;   // SRV_GOLDK de propósito diferente da tabela do jogo (60): a tela tem de debitar o cost que o SERVIDOR devolve
let GNAME = 'Lobos <b>', GSTYLE = null;   // guilda ANTIGA (nome digitado, fora das listas): o líder vê o aviso para escolher o novo nome; o PATCH e o POST trocam pelo par
const GV = () => ({ id: 'g1', name: GNAME, ...(GSTYLE != null ? { styleIdx: GSTYLE } : {}), emblemId: '0', level: 2, xp: 1700, xpNext: 3000, members: 4, maxMembers: 22, open: true, minLevel: 1, lang: 'pt', power: 22000, bonus: { blessings: {}, territory: {} } });
const BOSS = { week: WEEK, hpMax: 100000, hpLeft: 63000, down: false, hitsLeft: 2, myDamage: 1500, top: [{ id: 'p2', name: 'Bento <s>', damage: 30000 }, { id: 'p1', name: 'Ana <i>', damage: 1500 }],
  bands: [{ minRatio: 0, coin: 7 }, { minRatio: 12, coin: 11, forge: 1 }], kill: { xp: 333, coin: 31, forge: 5, food: 50, essence: 2 } };
const BOUGHT = { forge10: 2, essence2: 3 };
const SHOP = () => ({ coin: 77, week: WEEK, items: G.DATA.shop.map(i => ({ ...i, name: i.id === 'food100' ? '100 de ração <b>' : i.name, bought: BOUGHT[i.id] || 0, left: Math.max(0, i.weekly - (BOUGHT[i.id] || 0)), locked: 2 < i.minLevel })) });
const MISS = { bossDown: { progress: 1, done: true, contributed: true, claimed: false }, checkins100: { progress: 74, done: false, contributed: true, claimed: false },
  donations150: { progress: 150, done: true, contributed: false, claimed: false }, bossHits150: { progress: 150, done: true, contributed: true, claimed: true } };
const daily = (key, gained) => { if (DAILY.includes(key)) throw { code: 'daily_limit', details: { key }, retryAfterMs: 5.5 * 36e5 }; DAILY.push(key); return { guild: GV(), coin: 77 + gained.coin, gained }; };
const ROUTES = {
  'GET /guild': () => { if (!inGuild) throw { code: 'not_in_guild' }; return { guild: GV(), me: { role, coin: 77, contrib: 10, donatedToday: DAILY.slice(), checkinToday: DAILY.includes('checkin') }, members: MEMBERS(),
    requests: role === 'member' ? [] : [{ id: 'p9', name: 'Eva <u>', at: NOW - 2 * 36e5 }], territories: [{ region: 0, capital: false }] }; },
  'GET /guild/blessings': () => ({ level: 2, xpFree: 1234, list: [{ id: 'atk', value: 0.5, cap: 1 }] }),
  'GET /guild/boss': () => JSON.parse(JSON.stringify(BOSS)),
  'POST /guild/boss/hit': () => { BOSS.hitsLeft = 1; BOSS.hpLeft = 58679; BOSS.myDamage = 5821; return { damage: 4321, seed: 9, log: [], timeout: false, killed: false, band: { minRatio: 12, coin: 11, forge: 1 }, hitsLeft: 1, hpLeft: 58679, hpMax: 100000 }; },
  'GET /guild/shop': () => SHOP(),
  'POST /guild/shop/buy': b => ({ ok: true, item: b.itemId, ...SHOP() }),
  'GET /guild/missions': () => ({ week: WEEK, list: G.DATA.missions.map(ms => ({ ...ms, ...MISS[ms.id] })) }),
  'POST /guild/missions/bossDown/claim': () => ({}), 'POST /guild/checkin': () => daily('checkin', { xp: 5, coin: 5, contrib: 5 }),
  'POST /guild/donate': b => { const d = G.DATA.donate.find(x => x.id === b.kind); if (!d) throw { code: 'bad_request', details: { fields: ['kind'] } };
    return { ...daily('donate:' + b.kind, { xp: d.xp, coin: d.coin, contrib: d.xp }), cost: { goldk: d.goldk ? SRV_GOLDK : 0, gems: d.gems || 0 } }; },
  'POST /guild/members/p3/kick': () => ({}), 'POST /guild/members/p4/kick': () => ({}), 'POST /guild/members/p4/promote': () => ({}), 'POST /guild/members/p2/demote': () => ({}),
  'POST /guild/leader': () => ({}), 'POST /guild/blessings/atk/upgrade': () => ({}), 'POST /guild/requests/p9/accept': () => ({}), 'POST /guild/requests/p9/decline': () => ({}),
  'POST /guild/leave': () => { inGuild = false; return {}; },
  'GET /guilds': () => [{ id: 'g7', name: 'Rubra <b>', level: 3, members: 10, maxMembers: 24, open: true, minLevel: 30 }, { id: 'g8', name: 'Véu', open: false }],
  'POST /guilds/g7/join': () => { inGuild = true; return { status: 'joined' }; },
  'POST /guilds': b => { inGuild = true; GNAME = G.nameOf(b.nameA, b.nameB); GSTYLE = b.styleIdx != null ? b.styleIdx : null; return { id: 'g1' }; },
  'PATCH /guild': b => { if (b.nameA != null) GNAME = G.nameOf(b.nameA, b.nameB); if (b.styleIdx != null) GSTYLE = b.styleIdx; return { guild: GV() }; } };
g.Sys.net = { _call(m, p, b) { const k = m + ' ' + p.split('?')[0]; calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (fail[k]) return Promise.reject(typeof fail[k] === 'string' ? { code: fail[k] } : fail[k]); const h = ROUTES[k]; if (!h) return Promise.reject({ code: 'not_found' });
  try { return Promise.resolve(h(b)); } catch (e) { return Promise.reject(e); } } };

const SRC = fs.readFileSync(process.env.GD2_SRC || path.join(R, 'js/p_guild2.js'), 'utf8');   // GD2_SRC: testar uma cópia antes de gravar no jogo (o jogo recarrega a cada gravação em js/)
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
  assert(!/<input|<textarea|contenteditable|type="text"/i.test(h), tag + ': campo de texto livre (jogo com menores: o nome é montado com listas)'); assert(!/filtro do chat/i.test(h), tag + ': frase do filtro do chat');
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
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=(?!=)/.test(SRC), 'o arquivo não liga chave nenhuma');   /* (?!=): ler a chave (DATA.on===true, no fireOn da Fogueira da Guilda) não é ligar; atribuição continua proibida */
  for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
  assert(!/<input|<textarea|contenteditable|type="text"/i.test(SRC), 'o arquivo não tem campo de texto'); assert(!/filtro do chat/i.test(SRC), 'a frase do filtro do chat saiu'); assert(!/search\s*:/.test(SRC), 'a busca não manda texto');
  out.push('registro: painel guild2, chave desligada, sem alert/confirm/prompt, sem emoji');

  // 1) online desligado (e ligado mas não iniciado): estado honesto, zero rede, nenhuma guilda ou membro na tela
  G.DATA.on = true; GN.DATA.on = false; GN._reset(); G.setProvider(null); await open(); check('desligado'); has('Em breve: abre com o online'); has('Como a guilda funciona'); not('Lobos'); not('Ana');
  click('checkin'); click('leave'); click('create'); has('Em breve: abre com o online'); not('gd2-conf'); assert.strictEqual(calls.length, 0, 'sem rede com o online desligado');
  GN.DATA.on = true; def.onOpen(); def.render(); check('não iniciado'); has('Em breve: abre com o online'); has('As guildas ainda não abriram. Volte mais tarde.'); assert.strictEqual(calls.length, 0, 'sem rede antes de o online iniciar');
  G.DATA.on = false; def.render(); has('Guildas: em breve'); G.DATA.on = true;
  { const r = raf.shift(); assert(r, 'o laço do palco roda'); drew = []; r(1000); assert.strictEqual(drew.length, 1, 'um herói por quadro'); assert.strictEqual(drew[0].st.mount, false); assert(drew[0].k > 0 && isFinite(drew[0].k)); }
  out.push('online desligado ou não iniciado: "abre com o online", regras do módulo, zero rede; herói desenhado pela rota do jogo');

  // 2) online pronto, LÍDER: cartão, membros e pedidos do servidor, nomes escapados
  assert.strictEqual((await GN.start(g.S, host)).ok, true); await open(); check('membros líder');
  assert(sent(/^GET \/guild$/) >= 2, 'onOpen refaz a leitura da guilda');
  has('Lobos &lt;b&gt;'); not('Lobos <b>'); has('Ana &lt;i&gt; (você)'); not('Ana <i>'); has('Eva &lt;u&gt;'); not('Eva <u>'); has('pediu há 2 h'); has('data-k="accept" data-id="p9"'); has('seu cargo: <b>Líder</b>'); has('4/22'); has('FC '); has('visto há 5 h');
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

  // 2b) LÍDER de guilda com NOME ANTIGO (status().nameLegacy): aviso + seletores; a troca vai por canRename e PATCH /guild {nameA, nameB}, em dois toques, uma vez
  { const P = g.Guild2.X.pk, patches = () => sent(/^PATCH \/guild /), nm = G.nameOf(3, 5);
    assert.strictEqual(G.status(g.S, host).nameLegacy, true, 'o teste parte de uma guilda com nome antigo'); def.render(); check('nome antigo');
    has('Escolha o novo nome da guilda'); has('Lobos &lt;b&gt;'); has('data-x="rename"'); has('data-k="ra"'); has('data-k="rb"'); has('data-x="roll" data-k="r"'); not('data-x="ren"'); assert(G.nameValid(P.ra, P.rb), 'os seletores já começam com um par sorteado');
    click('pk', { k: 'ra' }); check('lista da 1ª parte'); has('role="listbox"'); assert.strictEqual((H().match(/data-x="opt" data-k="ra"/g) || []).length, G.nameParts.a.length, 'a lista mostra todas as partes'); not('data-i="any"');
    click('opt', { k: 'ra', i: '3' }); not('role="listbox"'); click('pk', { k: 'rb' }); assert.strictEqual((H().match(/data-x="opt" data-k="rb"/g) || []).length, G.nameParts.b.length); click('opt', { k: 'rb', i: '5' });
    assert.deepStrictEqual([P.ra, P.rb], [3, 5]); has(g.esc2(nm)); click('opt', { k: 'ra', i: '999' }); click('opt', { k: 'ra', i: 'x' }); click('opt', { k: 'ra', i: 'any' }); assert.deepStrictEqual([P.ra, P.rb], [3, 5], 'índice fora da lista é ignorado');
    { const n0 = calls.length; click('roll', { k: 'r' }); assert(P.ra !== 3 || P.rb !== 5, 'Sortear muda o par'); assert(G.nameValid(P.ra, P.rb)); has(g.esc2(G.nameOf(P.ra, P.rb))); assert.strictEqual(calls.length, n0, 'Sortear não chama a rede'); }
    click('opt', { k: 'ra', i: '3' }); click('opt', { k: 'rb', i: '5' });
    click('rename'); check('confirma o nome'); has('Trocar o nome da guilda para <b>' + g.esc2(nm) + '</b>?'); assert.strictEqual(patches(), 0, '1º toque não envia'); click('no'); assert.strictEqual(patches(), 0);
    click('rename'); click('yes'); await settle(); assert.strictEqual(patches(), 1, 'um PATCH só'); assert(calls.includes('PATCH /guild {"nameA":3,"nameB":5}'), 'manda só os índices'); has('Nome da guilda trocado');
    def.render(); check('nome novo'); assert.strictEqual(G.name(g.S), nm); assert.strictEqual(G.status(g.S, host).nameLegacy, false); has(g.esc2(nm)); not('Escolha o novo nome da guilda'); not('Lobos &lt;b&gt;'); not('data-x="rename"'); has('Ficha da guilda'); has('data-x="ren"');
    // guilda que já tem o par: "Trocar" abre os seletores no nome atual; mesmo nome não envia; recusa do servidor (429 rename_cooldown) vira o texto do módulo
    click('ren'); check('trocar o nome'); has('Trocar o nome da guilda'); assert.deepStrictEqual([P.ra, P.rb], [3, 5]); click('rename'); has('Esse já é o nome da guilda'); not('gd2-conf');
    click('opt', { k: 'ra', i: '4' }); fail['PATCH /guild'] = { code: 'rename_cooldown', retryAfterMs: 3 * 864e5 }; click('rename'); click('yes'); await settle(); has('Você poderá trocar o nome em 3 dias'); assert.strictEqual(G.name(g.S), nm, 'recusa não muda o nome');
    fail['PATCH /guild'] = 'name_taken'; click('rename'); click('yes'); await settle(); has('Esse nome já existe neste servidor; troque uma das partes'); assert.strictEqual(P.ra, 4, 'os seletores ficam como estavam'); delete fail['PATCH /guild'];
    click('ren'); not('data-x="rename"');
    // estilo na ficha: lista do módulo, canRestyle, dois toques, PATCH /guild {styleIdx}
    has('Ainda sem estilo'); const p0 = patches(); click('pk', { k: 'st' }); check('lista de estilo'); assert.strictEqual((H().match(/data-x="opt" data-k="st"/g) || []).length, G.styles.length);
    click('opt', { k: 'st', i: '2' }); check('confirma o estilo'); has('Trocar o estilo da guilda para <b>' + g.esc2(G.styles[2]) + '</b>?'); assert.strictEqual(patches(), p0, '1º toque não envia');
    click('yes'); await settle(); assert(calls.includes('PATCH /guild {"styleIdx":2}')); assert.strictEqual(patches(), p0 + 1); has('Estilo da guilda trocado'); def.render(); check('estilo trocado'); has('Estilo <b>' + g.esc2(G.styles[2]) + '</b>'); not('Ainda sem estilo');
    fail['PATCH /guild'] = { code: 'restyle_cooldown', retryAfterMs: 5 * 36e5 }; click('pk', { k: 'st' }); click('opt', { k: 'st', i: '1' }); click('yes'); await settle(); has('Você poderá trocar o estilo amanhã'); delete fail['PATCH /guild'];
    out.push('líder com nome antigo: aviso "Escolha o novo nome da guilda", seletores e Sortear sem rede, PATCH {nameA,nameB} uma vez em 2 toques; recusas rename_cooldown e name_taken pelo reasonText; estilo pela lista com PATCH {styleIdx}'); }

  // 3) Doar: check-in direto; doação em 2 toques, ouro debitado só depois do ok; sem diamante = motivo, sem rede
  tab('donate'); check('doar'); has('<b>Presença</b>'); not('Feito hoje');
  // 429 daily_limit do servidor: o Sys.guildNet repassa {reason, details, retryAfterMs}. Com retryAfterMs > 0 a tela mostra o tempo que falta; com 0 ou sem o campo, a virada de Brasília
  const LIM = { code: 'daily_limit', details: { key: 'checkin' }, retryAfterMs: 5.5 * 36e5 }, MID = 'Já feito hoje. Volta à meia-noite de Brasília';
  fail['POST /guild/checkin'] = LIM; click('checkin'); await settle(); has('Já feito hoje. Volta em 5 h 30 min'); not(MID);
  fail['POST /guild/checkin'] = { code: 'daily_limit', details: { key: 'checkin' }, retryAfterMs: 36e5 }; click('checkin'); await settle(); has('Já feito hoje. Volta em 1 h 0 min'); not(MID);
  fail['POST /guild/checkin'] = { code: 'daily_limit', details: { key: 'checkin' }, retryAfterMs: 0 }; click('checkin'); await settle(); has(MID); not('Volta em');
  fail['POST /guild/checkin'] = { code: 'daily_limit', details: { key: 'checkin' } }; click('checkin'); await settle(); has(MID); not('Volta em'); delete fail['POST /guild/checkin'];
  assert.strictEqual(g.Guild2.whyR({ ok: false, reason: 'daily_limit', details: null, retryAfterMs: 0 }), MID);
  assert.strictEqual(g.Guild2.whyR({ ok: false, reason: 'daily_limit', details: { key: 'checkin' }, retryAfterMs: 5.5 * 36e5 }), 'Já feito hoje. Volta em 5 h 30 min');
  assert.strictEqual(g.Guild2.whyR({ ok: false, reason: 'daily_limit', details: { retryAfterMs: 40e3 } }), 'Já feito hoje. Volta em 1 min'); assert.strictEqual(g.Guild2.whyR({ ok: false, reason: 'daily_limit', details: { key: 'boss' } }), 'Já feito hoje. Volta à meia-noite de Brasília');
  click('checkin'); has('Carregando…'); await settle(); assert(calls.includes('POST /guild/checkin')); has('Presença marcada: +5 Brasões'); check('check-in feito');
  has('Feito hoje'); has('volta à meia-noite de Brasília'); not('data-x="checkin"'); { const nC = sent(/checkin/); click('checkin'); await settle(); assert.strictEqual(sent(/checkin/), nC, 'check-in feito hoje (checkinToday) não reenvia'); has('Já feito hoje'); }
  // doação: o débito é o cost:{goldk, gems} que o SERVIDOR devolveu (goldk × ouro de um abate), uma vez só e só com ok
  const gold0 = g.S.gold, unit = host.goldUnit(), local = Math.round(G.DATA.donate[0].goldk * unit), cost = Math.round(SRV_GOLDK * unit); assert.notStrictEqual(local, cost, 'o teste distingue o cost do servidor da tabela do jogo');
  click('don', { id: 'gold_s' }); check('confirma doar'); has('Doar <b>'); assert.strictEqual(sent(/donate/), 0, '1º toque não envia'); assert.strictEqual(g.S.gold, gold0);
  click('yes'); has('Doando…'); await settle(); assert(calls.includes('POST /guild/donate {"kind":"gold_s"}')); assert.strictEqual(g.S.gold, gold0 - cost, 'debita o cost do servidor, depois do ok'); assert.deepStrictEqual(spent, ['gold:' + cost], 'um débito só'); has('Doado: +10 Brasões, +20 XP da guilda');
  check('doou'); not('data-id="gold_s"'); assert.strictEqual((H().match(/Feito hoje/g) || []).length, 2, 'check-in e gold_s feitos (donatedToday: "checkin" e "donate:gold_s")'); has('data-id="gold_l"');
  click('don', { id: 'gold_s' }); not('gd2-conf'); has('Já feito hoje'); assert.strictEqual(sent(/"kind":"gold_s"/), 1, 'doação feita hoje não reenvia');
  fail['POST /guild/donate'] = Object.assign({}, LIM, { details: { key: 'donate:gold_l' } }); click('don', { id: 'gold_l' }); click('yes'); await settle(); has('Já feito hoje'); assert.strictEqual(spent.length, 1, 'recusa do servidor não debita'); delete fail['POST /guild/donate'];
  click('don', { id: 'gems' }); has('Faltam diamantes'); not('gd2-conf'); assert.strictEqual(sent(/"kind":"gems"/), 0);
  g.S.gems = 60; def.render(); click('don', { id: 'gems' }); click('yes'); await settle(); assert.strictEqual(g.S.gems, 10, 'diamantes: debita o cost.gems do servidor'); assert.deepStrictEqual(spent, ['gold:' + cost, 'gems:50']); assert.strictEqual(g.S.gold, gold0 - cost, 'doação de diamante não mexe no ouro');
  out.push('doar: "Feito hoje" por donatedToday/checkinToday, doação em 2 toques debitando o cost do servidor uma vez e só no ok, 429 daily_limit em texto, sem diamante não envia');

  // 4) Bênçãos
  tab('bless'); check('bênçãos'); has('XP guardado: <b>1.234</b>'); has('data-x="bls"'); click('bls', { id: 'atk' }); await settle(); assert(calls.includes('POST /guild/blessings/atk/upgrade')); has('Ataque subiu para toda a guilda');
  // 5) Chefe: carrega, mostra a vida do servidor, golpe
  delete g.Guild2.X.d.boss; tab('boss'); has('Carregando…'); check('chefe carregando'); await settle(); check('chefe'); has('Chefe da semana'); has('2 golpes hoje'); has('63%'); has('Vida 63000 de 100000');
  has('Seu dano na semana'); has('1º Bento &lt;s&gt;'); not('Bento <s>'); has('2º Ana &lt;i&gt; (você)'); has('De 0x a 12x'); has('12x ou mais'); has('333 XP da guilda'); not('De 10x a 25x');   // faixas e prêmio de derrubar: os do servidor, não os da tabela
  click('hit'); has('Atacando o chefe…'); await settle(); assert(calls.includes('POST /guild/boss/hit')); has('Golpe no chefe: 4321 de dano'); await settle(); def.render(); has('Último golpe: <b>4321</b> de dano · prêmio: '); has('1 forja</p>'); has('1 golpe hoje'); check('chefe depois do golpe');
  fail['GET /guild/boss'] = 'not_found'; click('retry', { k: 'boss' }); await settle(); has('Isso ainda não está disponível'); has('data-x="retry"'); check('chefe com erro'); delete fail['GET /guild/boss'];
  // golpes do dia usados: o botão explica e não envia; 429 do servidor em texto
  BOSS.hitsLeft = 0; click('retry', { k: 'boss' }); await settle(); check('chefe sem golpes'); has('Golpes de hoje usados'); has('voltam à meia-noite de Brasília'); { const nH = sent(/boss\/hit/); click('hit'); await settle(); assert.strictEqual(sent(/boss\/hit/), nH, 'sem golpes não envia'); }
  // chefe caído (down): estado próprio, sem botão de atacar
  BOSS.down = true; BOSS.hpLeft = 0; delete g.Guild2.X.d.boss; def.render(); await settle(); check('chefe caído'); has('Chefe da semana · derrubado'); has('Chefe derrubado nesta semana'); not('data-x="hit"'); has('1º Bento');
  { const nH = sent(/boss\/hit/); click('hit'); await settle(); assert.strictEqual(sent(/boss\/hit/), nH, 'chefe caído não envia golpe'); has('O chefe desta semana já foi derrubado'); }
  out.push('bênçãos (subir) e chefe (vida, golpes, meu dano, top e faixas do servidor; golpe com a faixa; sem golpes; caído; erro com Tentar de novo)');

  // 6) Loja: compra em 2 toques; item acima do nível da guilda não tem botão
  tab('shop'); await settle(); check('loja'); has('3 de 5 nesta semana'); has('Abre no nível 3 da guilda'); not('data-id="stones5"');
  click('buy', { id: 'forge10' }); check('confirma comprar'); has('Trocar <b>20 Brasões</b> por <b>10 pedras de forja</b>?'); assert.strictEqual(sent(/shop\/buy/), 0, '1º toque não envia');
  click('yes'); has('Trocando…'); await settle(); assert(calls.includes('POST /guild/shop/buy {"itemId":"forge10"}')); await settle();
  fail['POST /guild/shop/buy'] = 'weekly_limit'; click('buy', { id: 'food100' }); click('yes'); await settle(); has('Limite desta semana atingido'); delete fail['POST /guild/shop/buy'];
  click('buy', { id: 'stones5' }); has('Abre no nível 3 da guilda'); not('gd2-conf');
  // item com left 0 (essence2: 3 de 3) e item locked não têm botão e explicam; nome do item vindo do servidor escapado
  has('Esgotado'); has('Limite desta semana atingido (3 de 3)'); not('data-id="essence2"'); not('data-id="mfrag5"'); has('100 de ração &lt;b&gt;'); not('ração <b>');
  { const nB = sent(/shop\/buy/); click('buy', { id: 'essence2' }); not('gd2-conf'); has('Limite desta semana atingido'); click('buy', { id: 'mfrag5' }); not('gd2-conf'); has('Abre no nível 4 da guilda'); click('yes'); await settle(); assert.strictEqual(sent(/shop\/buy/), nB, 'esgotado ou travado não compra'); }
  // 7) Missões: progresso, done, contributed e claimed do servidor
  tab('miss'); await settle(); check('missões'); has('74/100'); has('data-id="bossDown"'); not('data-id="checkins100"'); has('Resgatado'); not('data-id="bossHits150"');
  not('data-id="donations150"'); has('Os Brasões desta missão são só para quem ajudou nela'); { const nM = sent(/claim/); click('claim', { id: 'donations150' }); click('claim', { id: 'checkins100' }); click('claim', { id: 'bossHits150' }); await settle(); assert.strictEqual(sent(/claim/), nM, 'missão sem ajuda, incompleta ou já resgatada não envia'); }
  click('claim', { id: 'bossDown' }); await settle(); assert(calls.includes('POST /guild/missions/bossDown/claim')); await settle();
  // 8) Territórios e atalho do torneio
  tab('terr'); check('territórios'); has('pontos de território'); has('Abrir o Torneio do Poder'); click('tour'); assert.deepStrictEqual(opened, ['tourney:guild2']);
  out.push('loja (comprar em 2 toques, recusa weekly_limit, item travado sem botão), missões (resgatar) e territórios (abre o torneio)');

  // 9) MEMBRO COMUM: não vê botões de líder; toque forjado não envia
  role = 'member'; await GN.refresh(g.S, host); await open(); check('membros comum'); has('seu cargo: <b>Membro</b>'); not('data-x="sel"'); not('data-x="mact"'); not('data-x="req"'); not('Pedidos para entrar');
  const nK = sent(/kick|promote|demote|\/guild\/leader/); click('mact', { k: 'kick', id: 'p4' }); click('yes'); await settle(); assert.strictEqual(sent(/kick|promote|demote|\/guild\/leader/), nK, 'membro comum não envia ação de líder');
  tab('bless'); check('bênçãos comum'); not('data-x="bls"'); has('Só <b>líder e oficiais</b> sobem as bênçãos'); const nB = sent(/upgrade/); click('bls', { id: 'atk' }); await settle(); assert.strictEqual(sent(/upgrade/), nB);
  // membro comum não vê renomear nem trocar o estilo (só o estilo escolhido, no cartão); toque forjado não envia
  tab('members'); check('ficha comum'); not('Ficha da guilda'); not('Escolha o novo nome'); not('data-x="ren"'); not('data-x="rename"'); not('data-x="pk"'); not('data-x="roll"'); has('Estilo <b>' + g.esc2(G.styles[2]) + '</b>');
  { const nP = sent(/^PATCH /); click('ren'); click('pk', { k: 'st' }); click('opt', { k: 'st', i: '1' }); click('yes'); click('pk', { k: 'ra' }); click('rename'); click('yes'); await settle(); not('gd2-conf'); not('role="listbox"'); assert.strictEqual(sent(/^PATCH /), nP, 'membro comum não troca nome nem estilo'); }
  // líder de guilda antiga visto por um membro comum: sem aviso
  { const keepN = GNAME; GNAME = 'Antiga <b>'; await GN.refresh(g.S, host); def.render(); has('Antiga &lt;b&gt;'); not('Antiga <b>'); not('Escolha o novo nome'); not('data-x="rename"'); GNAME = keepN; await GN.refresh(g.S, host); def.render(); }
  out.push('membro comum: sem abrir membro, sem promover/expulsar/transferir, sem pedidos, sem subir bênção, sem renomear nem trocar o estilo');

  // 10) Sair: 2 toques; recusa leader_must_transfer; depois sai e cai na busca
  tab('members'); click('leave'); check('confirma sair'); has('Sair da guilda?'); assert.strictEqual(sent(/leave/), 0, '1º toque não envia');
  fail['POST /guild/leave'] = 'leader_must_transfer'; click('yes'); has('Saindo da guilda…'); await settle(); has('Passe a liderança antes de sair'); delete fail['POST /guild/leave'];
  click('leave'); click('yes'); await settle(); assert(calls.includes('POST /guild/leave')); await settle(); def.render(); await settle(); def.render(); check('sem guilda');
  has('Entrar numa guilda'); has('Rubra &lt;b&gt;'); not('Rubra <b>'); has('Pedir'); not('gd2-tabs'); assert.strictEqual(G.ensure(g.S).id, null);
  // 10b) Busca SEM texto: os dois seletores com "Qualquer"; GET /guilds?a=&b= (uma parte, as duas ou nenhuma)
  const P = g.Guild2.X.pk; has('data-k="qa"'); has('data-k="qb"'); not('data-x="find"'); assert.strictEqual(P.qa, null); assert.strictEqual(P.qb, null);
  click('pk', { k: 'qa' }); check('lista da busca'); has('data-i="any"'); assert.strictEqual((H().match(/data-x="opt" data-k="qa"/g) || []).length, G.nameParts.a.length + 1, 'todas as partes mais "Qualquer"');
  click('opt', { k: 'qa', i: '3' }); await settle(); assert.strictEqual(calls[calls.length - 1], 'GET /guilds?a=3'); click('opt', { k: 'qb', i: '0' }); await settle(); assert.strictEqual(calls[calls.length - 1], 'GET /guilds?a=3&b=0');
  click('opt', { k: 'qa', i: 'any' }); await settle(); assert.strictEqual(calls[calls.length - 1], 'GET /guilds?b=0'); click('opt', { k: 'qb', i: 'any' }); await settle(); assert.strictEqual(calls[calls.length - 1], 'GET /guilds'); assert.strictEqual(sent(/search=/), 0, 'a busca nunca manda texto');
  def.render(); check('busca'); has('Rubra &lt;b&gt;');
  // 11) Criar: par dos seletores, prévia, estilo, Sortear sem rede; recusa pelo reasonText; 2 toques; ouro debitado só depois do ok; recusa name_taken
  const BASE = { emblemId: 0, lang: 'pt', open: true, minLevel: 1 }, posts = () => calls.filter(c => c.indexOf('POST /guilds {') === 0);
  click('create'); has('depois de sair de uma guilda'); not('gd2-conf'); host.t += 8 * 864e5; def.render(); check('criar');
  assert(G.nameValid(P.ca, P.cb), 'criar começa com um par sorteado'); has(g.esc2(G.nameOf(P.ca, P.cb))); has('data-k="ca"'); has('data-k="cb"'); has('data-k="cs"'); has('data-x="roll" data-k="c"'); has('Sortear');
  { const n0 = calls.length, gold0 = g.S.gold, a0 = P.ca, b0 = P.cb; click('roll', { k: 'c' }); assert(P.ca !== a0 || P.cb !== b0, 'Sortear muda o par'); has(g.esc2(G.nameOf(P.ca, P.cb))); click('roll', { k: 'c' }); click('roll', { k: 'c' });
    assert.strictEqual(calls.length, n0, 'Sortear não chama a rede'); assert.strictEqual(g.S.gold, gold0, 'Sortear não gasta'); not('gd2-conf'); }
  click('pk', { k: 'ca' }); check('lista de criar'); assert.strictEqual((H().match(/data-x="opt" data-k="ca"/g) || []).length, G.nameParts.a.length); click('opt', { k: 'ca', i: '0' }); click('pk', { k: 'cb' }); click('opt', { k: 'cb', i: '0' });
  click('pk', { k: 'cs' }); check('lista de estilo de criar'); assert.strictEqual((H().match(/data-x="opt" data-k="cs"/g) || []).length, G.styles.length); click('opt', { k: 'cs', i: '4' });
  check('par escolhido'); has('Lobos da Aurora'); has(g.esc2(G.styles[4])); assert.deepStrictEqual([P.ca, P.cb, P.cs], [0, 0, 4]);
  // recusas locais: o texto do Sys.guild.reasonText (par inválido) e a falta de ouro; nenhuma abre a confirmação nem chama a rede
  P.ca = 99; click('create'); has(G.reasonText({ reason: 'name' })); has('Escolha as duas partes do nome'); not('gd2-conf'); assert(G.nameValid(P.ca, P.cb), 'par inválido volta a um par sorteado'); click('opt', { k: 'ca', i: '0' }); click('opt', { k: 'cb', i: '0' });
  { const keepG = g.S.gold; g.S.gold = 0; click('create'); has('Falta ouro: criar custa'); not('gd2-conf'); g.S.gold = keepG; } assert.strictEqual(posts().length, 0);
  const CB = G.canCreate(g.S, host, 0, 0, 4); assert.strictEqual(CB.ok, true); assert.deepStrictEqual(CB.body, { nameA: 0, nameB: 0, styleIdx: 4 }); const WANT = 'POST /guilds ' + JSON.stringify(Object.assign({}, BASE, CB.body));
  click('create'); check('confirma criar'); has('Criar a guilda <b>Lobos da Aurora</b>'); assert.strictEqual(posts().length, 0, '1º toque não envia');
  fail['POST /guilds'] = 'name_taken'; const gold1 = g.S.gold; click('yes'); has('Criando a guilda…'); await settle(); has('Esse nome já existe neste servidor; troque uma das partes'); assert.strictEqual(g.S.gold, gold1, 'recusa não debita'); delete fail['POST /guilds'];
  assert.deepStrictEqual(posts(), [WANT], 'o corpo é o c.body, sem name nem description'); assert.deepStrictEqual([P.ca, P.cb, P.cs], [0, 0, 4], 'name_taken deixa os seletores como estão');
  // entrar numa guilda da lista
  click('join', { id: 'g7' }); has('Carregando…'); await settle(); assert(calls.includes('POST /guilds/g7/join')); await settle(); def.render(); has('Você entrou na guilda'); has('gd2-tabs'); check('entrou');
  // criar de verdade (sai antes)
  role = 'leader'; click('leave'); click('yes'); await settle(); await settle(); host.t += 8 * 864e5; def.render(); assert.deepStrictEqual([P.ca, P.cb, P.cs], [0, 0, 4]); click('create'); assert.strictEqual(posts().length, 1, '1º toque não envia'); click('yes'); click('yes'); await settle();
  assert.deepStrictEqual(posts(), [WANT, WANT], 'criar manda exatamente o c.body UMA vez (a outra é a recusada acima)'); { const sentBody = JSON.parse(posts()[1].slice('POST /guilds '.length)); assert(!('name' in sentBody) && !('description' in sentBody), 'sem name nem description'); assert.deepStrictEqual(sentBody, Object.assign({}, BASE, CB.body)); }
  assert.strictEqual(g.S.gold, gold1 - G.createCost(host), 'ouro da criação debitado depois do ok, uma vez'); await settle(); def.render(); has('Guilda criada'); check('criou'); has('Lobos da Aurora'); has('Estilo <b>' + g.esc2(G.styles[4]) + '</b>'); not('Escolha o novo nome'); has('Ficha da guilda');
  out.push('sair em 2 toques (recusa leader_must_transfer), busca pelos seletores (?a=&b=, sem texto) com nomes escapados, entrar, criar pelo par (Sortear sem rede, recusa pelo reasonText, corpo = c.body uma vez em 2 toques, recusa name_taken, débito só no ok)');

  // 12) toda ação desenhada foi vista; toda imagem citada existe (também as da lista de carga)
  for (const u of g.Guild2.urls()) assert(fs.existsSync(path.join(R, u)), 'imagem da lista de carga não existe: ' + u);
  for (const a of ['tab', 'sel', 'mact', 'req', 'leave', 'yes', 'no', 'checkin', 'don', 'bls', 'hit', 'buy', 'claim', 'pk', 'opt', 'roll', 'ren', 'rename', 'join', 'create', 'tour', 'retry']) assert(seenActs.has(a), 'ação nunca apareceu num botão: ' + a);
  // sem o módulo: tela de indisponível com Voltar
  const keep = g.Sys.guild; g.Sys.guild = null; def.render(); has('Guilda indisponível agora.'); check('sem módulo'); assert(seenActs.has('back')); g.Sys.guild = keep;
  out.push('imagens em disco: ' + seenImgs.size + ' na tela + ' + g.Guild2.urls().length + ' na lista de carga; ' + seenActs.size + ' ações vistas em botões');
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
