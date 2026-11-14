'use strict';
// Teste de fumaça da aba AJUDA da Guilda V2 (js/p_guild2.js) e da FAIXA DO CHEFE DA GUILDA na batalha (js/guildbosshud.js) em Node.
// Parte 1 e 2: Sys.guild, Sys.guildNet e Sys.guildBoss REAIS, com a rede (Sys.net._call) de mentira. Parte 3 em diante: DUBLÊ do Sys.guildBoss (conta as chamadas).
// Rodar: node test/paineis/p_guildhelp.smoke.js   (GD2_SRC / GBH_SRC: testar uma cópia antes de gravar no jogo, que recarrega a cada gravação em js/)
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['loot', 'level', 'chest', 'clock', 'guild', 'guildnet', 'tourneynet', 'guildboss'].forEach(m => { try { require(path.join(R, 'js/sys/' + m + '.js')); } catch (e) {} });
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const G = g.Sys.guild, GN = g.Sys.guildNet, GBR = g.Sys.guildBoss; assert(G && GN && GBR, 'módulos carregados');
assert.strictEqual(GBR.DATA.on, false, 'o Sys.guildBoss nasce desligado');

/* ---------- DOM de mentira ---------- */
const ctx = new Proxy({}, { get: (t, k) => k in t ? t[k] : (k === 'createRadialGradient' || k === 'createLinearGradient') ? () => ({ addColorStop() {} }) : () => {}, set: (t, k, v) => { t[k] = v; return true; } });
const mkEl = id => ({ id: id || '', children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', listeners: {}, parentNode: null, width: 0, height: 0, clientWidth: 390, clientHeight: 176, scrollTop: 0, offsetTop: 0, offsetHeight: 0,
  setAttribute() {}, addEventListener(t, f) { this.listeners[t] = f; }, appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
  remove() { if (this.parentNode) { this.parentNode.children = this.parentNode.children.filter(x => x !== this); this.parentNode = null; } }, getContext: () => ctx });
const gd2 = { gd2_stc: mkEl('gd2_stc'), gd2_scroll: mkEl('gd2_scroll'), gd2_toast: mkEl('gd2_toast') }, fbw = mkEl('fb_w'), els = {}, qs = {};
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
g.document = { head: mkEl('head'), createElement: () => mkEl(''), activeElement: null, querySelector: s => qs[s] || null,
  getElementById: id => id === 'fb_w' ? fbw : els[id] || (gd2[id] && H().includes('id="' + id + '"') ? gd2[id] : null) };
g.requestAnimationFrame = () => 1; g.cancelAnimationFrame = () => {};
g.Image = function () { this.complete = true; this.naturalWidth = 512; this.naturalHeight = 512; this.src = ''; };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 7, stage: 40, eraMax: 3 }); host.level = () => 60; const NOW = host.now();
g.Sys.host = host; g.S = { sys: { level: { lvl: 60, xp: 0 } }, hero: 'kael', gold: 1e6, gems: 0, stage: 40 };
g.n0 = v => Math.round(v).toLocaleString('pt-BR');
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'guild2'; g.HS = 155; const sounds = []; g.snd = n => sounds.push(n);
g.drawHeroFull = () => true; g.B = { inst: null };
let def = null; g.render = () => def.render(); const opened = [];
g.Screens = { close() {}, current: () => 'guild2' };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { def = d; this.defs[n] = d; return d; }, open(n, o) { opened.push(n + ':' + JSON.stringify(o || {})); return true; } };

/* ---------- servidor de mentira (contrato docs/SERVIDOR_LOM.md §2 e docs/API_SERVIDOR.md 10.4) ---------- */
const calls = [], fail = {};
const HELP = { day: '2026-11-12', helpsLeft: 10, helpsMax: 10, mine: null, requests: [
  { id: 'r1', playerId: 'p2', name: 'Bento <b>', kind: 'boss', need: 3, got: 1, full: false, helpedByMe: false },
  { id: 'r2', playerId: 'p3', name: 'Caio', kind: 'forge', need: 5, got: 4, full: false, helpedByMe: false },
  { id: 'r3', playerId: 'p4', name: 'Dora', kind: 'food', need: 5, got: 2, full: false, helpedByMe: true }] };
const BOSS = { name: 'Colosso <i>', level: 3, hp: 812345, hpMax: 1500000, hpLeft: 812345, myDamageToday: 45210, myDamageWeek: 120000, hitsToday: 1, hitsMax: 2, hitsLeft: 1, extraHit: false, killed: false, down: false, resetsAt: NOW + 5 * 864e5 };
const ROUTES = {
  'GET /guild': () => ({ guild: { id: 'g1', name: 'Lobos', emblemId: '0', level: 2, xp: 1700, xpNext: 3000, members: 4, maxMembers: 22, open: true, minLevel: 1, lang: 'pt', power: 22000, bonus: { blessings: {}, territory: {} } },
    me: { role: 'member', coin: 77, contrib: 10, donatedToday: [], checkinToday: false }, members: [{ id: 'p1', name: 'Ana', role: 'member', me: true, contrib: 10 }, { id: 'p2', name: 'Bento <b>', role: 'leader', contrib: 30 }], requests: [], territories: [] }),
  'GET /guild/blessings': () => ({ level: 2, xpFree: 0, list: [] }),
  'GET /guild/help': () => JSON.parse(JSON.stringify(HELP)),
  'POST /guild/help-all': () => { const ids = []; for (const r of HELP.requests) if (!r.full && !r.helpedByMe && HELP.helpsLeft > 0) { r.helpedByMe = true; r.got++; r.full = r.got >= r.need; HELP.helpsLeft--; ids.push(r.id); }
    return { ok: true, helped: ids, coin: ids.length, contrib: ids.length * 2, helpsLeft: HELP.helpsLeft }; },
  'GET /guild/boss': () => JSON.parse(JSON.stringify(BOSS)),
  'POST /guild/boss/hit': () => { BOSS.hp = BOSS.hpLeft = 801345; BOSS.myDamageToday = 56210; BOSS.hitsLeft = 0; BOSS.hitsToday = 2; return Object.assign({ damage: 11000, seed: 9, log: [], timeout: false, band: null }, JSON.parse(JSON.stringify(BOSS))); } };
g.Sys.net = { _call(m, p, b) { const k = m + ' ' + p.split('?')[0]; calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (fail[k]) return Promise.reject(typeof fail[k] === 'string' ? { code: fail[k] } : fail[k]); const h = ROUTES[k]; if (!h) return Promise.reject({ code: 'not_found' });
  try { return Promise.resolve(h(b)); } catch (e) { return Promise.reject(e); } } };

const SRC = fs.readFileSync(process.env.GD2_SRC || path.join(R, 'js/p_guild2.js'), 'utf8'), HSRC = fs.readFileSync(process.env.GBH_SRC || path.join(R, 'js/guildbosshud.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_guild2.js' }); vm.runInThisContext(HSRC, { filename: 'guildbosshud.js' });
const HUD = g.GuildBossHud; assert(HUD && typeof HUD.mount === 'function' && typeof HUD.update === 'function' && typeof HUD.unmount === 'function' && typeof HUD.place === 'function');

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = h => ((h == null ? H() : h).match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
function check(tag) { const h = H();
  for (const b of buttons()) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|comprar|diamante|sorteio pago|última chance|só hoje|oferta acaba/i.test(/<div class="gd2-help">[\s\S]*$/.exec(h) ? /<div class="gd2-help">[\s\S]*$/.exec(h)[0] : ''), tag + ': a aba Ajuda não fala de compra');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); }
const click = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async o => { def.onOpen(o); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;
const tab = t => click('tab', { t });
const helpBtn = () => buttons().find(b => b.dataset.x === 'hall');
const rootOf = () => fbw.children.find(c => c.id === 'gbh_root') || null;
const tap = r => r.listeners.click({ target: { closest: () => ({ dataset: { gbh: 'open' } }) } });

(async () => {
  // 0) arquivos: nenhuma chave ligada, sem diálogo, sem emoji, sem imagem na faixa, ações com tratador, ligações no jogo
  assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=(?!=)|setOn\s*\(/.test(SRC), 'p_guild2 não liga chave nenhuma'); assert(!/\.on\s*=\s*true|setOn\s*\(|PANEL_ON\.\w+\s*=\s*true/.test(HSRC), 'a faixa não liga chave nenhuma');
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(HSRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(HSRC), 'faixa sem emoji'); assert(!/assets\/|\.png|\.jpg|\.webp/.test(HSRC), 'a faixa não cita imagem');
  assert(!/\.\.\.|…|text-overflow\s*:\s*ellipsis/.test(HSRC), 'faixa sem reticências (nem no CSS): texto não é cortado');
  for (const a of ['hall', 'hone', 'hreq', 'hclaim']) { assert(def.actions.includes(a), 'ação registrada: ' + a); assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação com tratador: ' + a); }
  assert(/\.gd2-help \.gd2-bt\{min-height:44px\}/.test(SRC), 'botões da aba Ajuda com 44 px de altura mínima'); assert(/min-height:var\(--fbt,44px\)/.test(HSRC), 'faixa: área de toque de 44 px na tela');
  { const IDX = fs.readFileSync(path.join(R, 'index.html'), 'utf8'), FB = fs.readFileSync(path.join(R, 'js/fullbattle.js'), 'utf8'), FARM = fs.readFileSync(path.join(R, 'js/farm.js'), 'utf8');
    assert(/'guildfirenet','guildboss'/.test(IDX), 'index.html carrega js/sys/guildboss.js'); assert(/'grimhud','guildbosshud'/.test(IDX), 'index.html carrega js/guildbosshud.js');
    assert(/GuildBossHud\.mount\(h\)/.test(FB) && /GuildBossHud\.update\(\)/.test(FB), 'o fbTick monta e atualiza a faixa');
    assert(/guildBoss:\s*false/.test(FARM) && !/guildBoss:\s*true/.test(FARM), 'SYS_LIVE.guildBoss DESLIGADA no jogo'); }
  out.push('arquivos: nenhuma chave ligada, sem diálogo, sem emoji, sem imagem e sem reticências na faixa; index, fbTick e SYS_LIVE.guildBoss (false) ligados');

  // 1) CHAVE DESLIGADA (módulo real): a aba não existe, nenhuma rota de ajuda é chamada, a faixa não monta e nada entra no DOM
  G.DATA.on = true; GN.DATA.on = true; assert.strictEqual((await GN.start(g.S, host)).ok, true); assert(G.ensure(g.S).id, 'na guilda');
  await open(); check('desligada'); has('gd2-tabs'); not('data-t="help"'); not('Ajudar todos'); not('gd2-dot');
  await open({ tab: 'help' }); not('gd2-help'); assert.strictEqual(g.Guild2.X.tab, 'members', 'aba Ajuda pedida com a chave desligada cai em Membros');
  click('hall'); click('hone', { id: 'r1' }); click('hreq', { k: 'boss' }); click('hclaim'); await settle(); assert.strictEqual(sent(/\/guild\/help/), 0, 'desligada: nenhuma rota de ajuda');
  assert.strictEqual(HUD.on(), false); assert.strictEqual(HUD.mount(fbw), false, 'desligada: a faixa não monta'); assert.strictEqual(HUD.update(true), false); assert.strictEqual(fbw.children.length, 0, 'desligada: nada no DOM'); assert.strictEqual(HUD.info(), null);
  tab('boss'); await settle(); click('hit'); await settle(); assert.strictEqual(GBR.ensure(g.S).boss, null, 'desligada: o golpe não mexe no espelho do chefe'); assert.strictEqual(sent(/^GET \/guild\/boss$/) >= 1, true);
  out.push('chave desligada: sem aba Ajuda, sem rota /guild/help, faixa não monta (nada no DOM), golpe não toca o Sys.guildBoss');

  // 2) CHAVE LIGADA só na memória (módulo REAL + servidor de mentira): aba com selo, Ajudar todos (2) uma vez, depois (0) apagado; chefe espelhado na faixa
  GBR.DATA.on = true; BOSS.hitsLeft = 1; BOSS.hp = BOSS.hpLeft = 812345; BOSS.myDamageToday = 45210; calls.length = 0;
  await open(); check('ligada'); assert.strictEqual(sent(/^GET \/guild\/help$/), 1, 'loadHelp ao abrir a guilda'); has('data-t="help"'); has('gd2-dot'); has('aria-label="Ajuda: há ajuda para dar ou prêmio para resgatar"');
  tab('help'); has('Carregando…'); await settle(); def.render(); check('aba Ajuda'); has('Ajudar todos (2)'); assert(!/\boff\b/.test(helpBtn().tag), 'com pedidos o botão está aceso');
  has('Bento &lt;b&gt;'); not('Bento <b>'); has('Golpe extra no chefe'); has('Pedras de forja'); has('Ajudado'); has('Ajudas de hoje: <b>10/10</b>'); has('+1 Brasão'); has('data-x="hreq" data-k="boss"'); has('data-x="hreq" data-k="forge"'); has('data-x="hreq" data-k="food"');
  assert.strictEqual(buttons().filter(b => b.dataset.x === 'hone').length, 2, 'um botão Ajudar por pedido que ainda não ajudei');
  click('hall'); has('Ajudando todos'); click('hall'); await settle(); assert.strictEqual(sent(/^POST \/guild\/help-all$/), 1, 'Ajudar todos envia UMA vez'); has('+2 Brasões'); def.render(); check('depois de ajudar todos');
  has('Ajudar todos (0)'); assert(/\boff\b/.test(helpBtn().tag), 'com N = 0 o botão fica apagado'); not('gd2-dot'); has('Ajudas de hoje: <b>8/10</b>'); assert.strictEqual(buttons().filter(b => b.dataset.x === 'hone').length, 0);
  click('hall'); await settle(); assert.strictEqual(sent(/^POST \/guild\/help-all$/), 1, 'N = 0 não envia'); has('Nenhum pedido para ajudar agora');
  // chefe: a leitura da aba Chefe e a resposta do golpe passam pelo applyBoss; a faixa mostra o que o hud() do módulo devolve
  tab('boss'); await settle(); def.render(); { const h = GBR.hud(g.S, host); assert.strictEqual(h.show, true, 'a leitura do chefe espelha no Sys.guildBoss'); assert.strictEqual(h.hitsLeft, 1); }
  assert.strictEqual(HUD.mount(fbw), true, 'ligada: a faixa monta'); { const r = rootOf(); assert(r, 'faixa no DOM'); const h = GBR.hud(g.S, host);
    assert(r.innerHTML.includes('Colosso &lt;i&gt; · Nv 3') && !r.innerHTML.includes('Colosso <i>'), 'nome do chefe escapado'); assert(r.innerHTML.includes(g.esc2(h.hpText)), 'vida do módulo'); assert(r.innerHTML.includes('Meu dano hoje: ' + h.mineText + ' · Golpes: 1/2'), 'meu dano e golpes'); }
  click('hit'); await settle(); { const h = GBR.hud(g.S, host); assert.strictEqual(h.hitsLeft, 0, 'applyBoss depois do golpe'); assert.strictEqual(h.mine, 56210); HUD.update(true); assert(rootOf().innerHTML.includes('Golpes: 0/2'), 'a faixa atualiza depois do golpe'); }
  HUD.unmount(); assert.strictEqual(fbw.children.length, 0, 'unmount tira a faixa'); GBR.DATA.on = false;
  out.push('módulo real ligado na memória: loadHelp ao abrir, selo na aba, "Ajudar todos (2)" envia 1 vez e mostra "+2 Brasões", N = 0 apagado e sem envio; chefe e golpe espelhados pelo applyBoss; faixa com nome escapado');

  // 3) DUBLÊ do módulo: contagem de chamadas, pedir, ajudar um, resgatar, erro e carregando
  const K = [{ kind: 'boss', need: 3, name: 'Golpe extra no chefe', txt: '+1 golpe no chefe da guilda hoje' }, { kind: 'forge', need: 5, name: 'Pedras de forja', txt: '10 pedras de forja' }, { kind: 'food', need: 5, name: 'Ração de pet', txt: '50 de ração' }];
  const D = { n: { loadHelp: 0, helpAll: 0, help: [], request: [], claim: 0, loadBoss: 0, applyBoss: [] }, loadRes: { ok: true }, hud: { show: false }, boss: null, left: 10, mine: null,
    reqs: [{ id: 'a1', name: 'Eva <u>', kind: 'boss', need: 3, got: 0, full: false, helpedByMe: false }, { id: 'a2', name: 'Fábio', kind: 'food', need: 5, got: 4, full: false, helpedByMe: false }, { id: 'a3', name: 'Gil', kind: 'forge', need: 5, got: 5, full: true, helpedByMe: false }] };
  const openReqs = () => D.reqs.filter(r => !r.full && !r.helpedByMe), helpOne = r => { r.helpedByMe = true; r.got++; r.full = r.got >= r.need; D.left--; };
  const DBL = { DATA: { on: true, perHelp: { coin: 1, contrib: 2 }, requestsPerDay: 1, helpsPerDay: 10, pollMs: 60000 }, on: () => DBL.DATA.on === true, ensure: () => ({ boss: D.boss }),
    view: () => ({ on: true, inGuild: true, helpsLeft: D.left, helpsMax: 10, mine: D.mine, requests: D.reqs, helpAll: Math.min(D.left, openReqs().length), kinds: K, extraHit: false, hitsMax: 2, boss: D.hud }),
    hud: () => D.hud, loadHelp: async () => { D.n.loadHelp++; return D.loadRes; },
    helpAll: async () => { D.n.helpAll++; const ids = openReqs().slice(0, D.left).map(r => { helpOne(r); return r.id; }); return { ok: true, helped: ids, coin: ids.length, contrib: ids.length * 2, helpsLeft: D.left }; },
    help: async (S, h, id) => { D.n.help.push(id); const r = D.reqs.find(x => x.id === id); helpOne(r); return { ok: true, coin: 1, contrib: 2, helpsLeft: D.left }; },
    canRequest: (S, h, k) => D.mine ? { ok: false, reason: 'already' } : K.some(x => x.kind === k) ? { ok: true } : { ok: false, reason: 'bad_kind' },
    request: async (S, h, k) => { D.n.request.push(k); D.mine = { id: 'm1', kind: k, need: K.find(x => x.kind === k).need, got: 0, full: false, claimed: false }; return { ok: true }; },
    claim: async () => { D.n.claim++; D.mine.claimed = true; return { ok: true, kind: D.mine.kind, reward: { forge: 10 } }; },
    loadBoss: async () => { D.n.loadBoss++; return { ok: true }; }, applyBoss: (S, h, d) => { D.n.applyBoss.push(d); D.boss = d; return { ok: true, boss: true }; } };
  g.Sys.guildBoss = DBL;
  await open(); assert.strictEqual(D.n.loadHelp, 1, 'dublê: loadHelp ao abrir'); has('data-t="help"'); has('gd2-dot'); tab('help'); has('Carregando…'); check('carregando'); await settle(); def.render(); assert.strictEqual(D.n.loadHelp, 2, 'relê ao entrar na aba'); check('dublê: aba');
  has('Ajudar todos (2)'); has('Eva &lt;u&gt;'); not('Eva <u>'); has('Cheio'); assert.strictEqual(buttons().filter(b => b.dataset.x === 'hreq').length, 3, '3 botões de pedir'); not('data-x="hclaim"');
  // ajudar um
  click('hone', { id: 'a2' }); click('hone', { id: 'a1' }); await settle(); assert.deepStrictEqual(D.n.help, ['a2'], 'Ajudar envia uma vez (uma ação por vez)'); has('+1 Brasão'); def.render(); has('Ajudar todos (1)'); has('Ajudas de hoje: <b>9/10</b>');
  click('hone', { id: 'a2' }); await settle(); has('Você já ajudou este pedido'); click('hone', { id: 'a3' }); has('Este pedido já está cheio'); click('hone', { id: 'zz' }); has('Este pedido não existe mais'); assert.deepStrictEqual(D.n.help, ['a2']);
  // Ajudar todos (1) → uma chamada; depois N = 0 apagado
  click('hall'); click('hall'); await settle(); assert.strictEqual(D.n.helpAll, 1, 'helpAll chamado UMA vez'); has('+1 Brasão'); def.render(); has('Ajudar todos (0)'); assert(/\boff\b/.test(helpBtn().tag)); click('hall'); await settle(); assert.strictEqual(D.n.helpAll, 1, 'apagado não chama'); not('gd2-dot');
  // limite do dia: Ajudar apagado e com explicação
  D.reqs.push({ id: 'a4', name: 'Hugo', kind: 'food', need: 5, got: 1, full: false, helpedByMe: false }); D.left = 0; def.render(); check('sem ajudas'); has('Ajudar todos (0)'); assert(/\boff\b/.test(buttons().find(b => b.dataset.x === 'hone').tag), 'sem ajudas no dia: Ajudar apagado');
  click('hone', { id: 'a4' }); has('Você já deu todas as ajudas de hoje'); click('hall'); has('Você já deu todas as ajudas de hoje'); assert.strictEqual(D.n.helpAll, 1); assert.deepStrictEqual(D.n.help, ['a2']); D.left = 5;
  // pedir: canRequest antes; 1 pedido; barra got/need; cheio = Resgatar; resgatado = selo
  click('hreq', { k: 'xx' }); has('Esse tipo de pedido não existe'); assert.deepStrictEqual(D.n.request, []);
  click('hreq', { k: 'forge' }); has('Abrindo o pedido'); await settle(); assert.deepStrictEqual(D.n.request, ['forge']); has('Pedido aberto: Pedras de forja'); def.render(); check('meu pedido'); not('data-x="hreq"'); has('Pedras de forja <span>0/5</span>'); has('Esperando ajuda'); not('data-x="hclaim"');
  click('hreq', { k: 'food' }); has('Você já fez o pedido de hoje'); assert.deepStrictEqual(D.n.request, ['forge']); click('hclaim'); has('O pedido ainda não encheu'); assert.strictEqual(D.n.claim, 0);
  D.mine.got = 5; D.mine.full = true; def.render(); check('pedido cheio'); has('data-x="hclaim"'); has('Resgatar'); has('gd2-dot'); has('aria-valuenow="100"');
  click('hclaim'); click('hclaim'); await settle(); assert.strictEqual(D.n.claim, 1, 'Resgatar envia uma vez'); has('Resgatado: 10 pedras de forja'); def.render(); check('resgatado'); not('data-x="hclaim"'); has('Resgatado'); click('hclaim'); has('Você já resgatou este pedido'); assert.strictEqual(D.n.claim, 1);
  // sem conexão: mensagem curta e Tentar de novo; a tela continua inteira
  D.loadRes = { ok: false, reason: 'net_off', retryAfterMs: 0 }; tab('members'); tab('help'); await settle(); def.render(); check('sem conexão'); has('Sem conexão: tente de novo'); has('data-x="retry" data-k="help"'); has('gd2-tabs'); not('Ajudar todos');
  D.loadRes = { ok: true }; click('retry', { k: 'help' }); await settle(); def.render(); has('Ajudar todos ('); check('voltou');
  { const keep = DBL.view; DBL.view = () => { throw new Error('boom'); }; def.render(); check('módulo com erro'); has('gd2-tabs'); has('A ajuda da guilda abre com o online.'); not('Ajudar todos'); not('gd2-dot'); DBL.view = keep; def.render(); has('Ajudar todos ('); }   // módulo com erro: a tela continua inteira, com uma frase curta no lugar do quadro
  // golpe: applyBoss recebe a resposta do golpe (com hp), uma vez
  D.n.applyBoss.length = 0; BOSS.hitsLeft = 1; tab('boss'); await settle(); def.render(); const nGet = D.n.applyBoss.length; assert(nGet >= 1, 'a leitura do chefe passa pelo applyBoss'); click('hit'); await settle();
  { const hitCalls = D.n.applyBoss.filter(d => d.damage === 11000); assert.strictEqual(hitCalls.length, 1, 'applyBoss depois do golpe, uma vez'); assert.strictEqual(hitCalls[0].hp, 801345); assert.strictEqual(hitCalls[0].hitsLeft, 0); assert(!('ok' in hitCalls[0])); }
  out.push('dublê: loadHelp ao abrir e ao entrar na aba; Ajudar (1 envio), Ajudar todos (1 envio, depois apagado), limite do dia, pedir pelo canRequest, Resgatar só cheio e 1 vez, sem conexão com Tentar de novo, applyBoss depois do golpe');

  // 4) FAIXA na batalha com o dublê: mostra / oculta conforme hud().show; lugar; toque; derrotado; leitura no máximo 1 vez por minuto
  const FB = fs.readFileSync(path.join(R, 'js/fullbattle.js'), 'utf8'), WS = fs.readFileSync(path.join(R, 'js/weakseal.js'), 'utf8');
  const bar = /left:(\d+)px;right:(\d+)px;top:(\d+)px;height:(\d+)px;max-width:300px/.exec(FB), mb = /\.fb-mbtn\{position:absolute;right:(\d+)px;top:(\d+)px;width:(\d+)px/.exec(FB), wp = /POS=\{left:(\d+),top:(\d+),width:(\d+)\}/.exec(WS); assert(bar && mb && wp, 'posições lidas do código dos vizinhos');
  const barBottom = +bar[3] + +bar[4], menuX = 390 - +mb[1] - +mb[3], P = HUD.POS;
  assert(P.top >= barBottom, 'a faixa começa abaixo da barra da fase (y ' + barBottom + ')'); assert(P.left >= +bar[1] && P.left + P.width <= 390 - +bar[2], 'dentro da largura da barra da fase'); assert(P.left + P.width <= menuX, 'não entra no botão Menu'); assert(P.left > 70, 'fora da coluna esquerda de ícones');
  const realNow = Date.now; let T = realNow(); Date.now = () => T;
  try {
    D.hud = { show: false }; D.n.loadBoss = 0; HUD.state.poll = 0; assert.strictEqual(HUD.mount(fbw), true, 'chave ligada: liga ao painel'); assert.strictEqual(rootOf(), null, 'show:false = nada no DOM'); assert.strictEqual(D.n.loadBoss, 0, 'sem guilda (sem stale) não pede o chefe');
    D.hud = { show: false, stale: true }; T += 600; assert.strictEqual(HUD.update(), false); await settle(); assert.strictEqual(D.n.loadBoss, 1, 'na guilda e sem chefe no espelho: pede uma vez'); assert.strictEqual(rootOf(), null);
    for (let i = 0; i < 40; i++) { T += 1000; HUD.update(true); } await settle(); assert.strictEqual(D.n.loadBoss, 1, 'no máximo 1 leitura por minuto (40 s depois, nenhuma nova)');
    T += 25000; HUD.update(true); await settle(); assert.strictEqual(D.n.loadBoss, 2, 'passado 1 minuto, lê de novo');
    D.hud = { show: true, name: 'Hidra <b>', level: 4, frac: 0.42, hpText: '630.0K / 1.5M', mine: 1200, mineText: '1.2K', hitsLeft: 2, hitsMax: 3, killed: false, stale: false }; T += 600; assert.strictEqual(HUD.update(), true);
    let r = rootOf(); assert(r && r.id === 'gbh_root', 'show:true = faixa no DOM'); assert.strictEqual(fbw.children.length, 1); assert.strictEqual(r.style.left, P.left + 'px'); assert.strictEqual(r.style.width, P.width + 'px'); assert.strictEqual(r.style.top, P.top + 'px', 'sem vizinhos: logo abaixo da barra da fase');
    { const h = r.innerHTML; assert(h.includes('Hidra &lt;b&gt; · Nv 4') && !h.includes('Hidra <b>')); assert(h.includes('630.0K / 1.5M')); assert(h.includes('width:42%')); assert(h.includes('Meu dano hoje: 1.2K · Golpes: 2/3')); assert(!h.includes('Derrotado'));
      assert(!/undefined|NaN|\bnull\b|\[object/.test(h), 'faixa: texto quebrado'); assert(!/src=|url\(/.test(h), 'faixa sem imagem'); const bt = buttons(h); assert.strictEqual(bt.length, 1); assert(/data-gbh="open"/.test(bt[0].tag) && /aria-label="/.test(bt[0].tag) && !/\sdisabled[\s>=]/.test(bt[0].tag)); }
    assert.strictEqual(D.n.loadBoss, 2, 'espelho fresco: não pede');
    // toque: abre a guilda na aba Chefe; toque fora do botão não faz nada
    opened.length = 0; r.listeners.click({ target: { closest: () => null } }); assert.strictEqual(opened.length, 0); tap(r); assert.deepStrictEqual(opened, ['guild:{"tab":"boss"}'], 'toque abre a Guilda na aba Chefe');
    await open({ tab: 'boss' }); assert.strictEqual(g.Guild2.X.tab, 'boss', 'a guilda abre na aba pedida'); await open({ tab: 'nada' }); assert.strictEqual(g.Guild2.X.tab, 'members'); await open(); assert.strictEqual(g.Guild2.X.tab, 'members');
    // não cobre o selo "Forte contra": com ele na tela a faixa desce para baixo dele (e da área de toque dele)
    els.wsl_root = { style: {}, offsetTop: +wp[2], offsetHeight: 24 }; T += 600; HUD.update(); assert(parseFloat(r.style.top) >= +wp[2] + 24 + 14, 'abaixo do selo e da área de toque dele: ' + r.style.top);
    els.dfh = { style: {}, offsetTop: 110, offsetHeight: 27 }; qs['#pc_hud .pc-badge'] = { style: {}, offsetTop: 152, offsetHeight: 40 }; T += 600; HUD.update(); assert.strictEqual(r.style.top, (152 + 40 + P.gap) + 'px', 'abaixo do selo da Encruzilhada');
    qs['#pt_hud .pt-band'] = { style: {}, offsetTop: 200, offsetHeight: 44 }; T += 600; HUD.update(); assert.strictEqual(r.style.top, (200 + 44 + P.gap) + 'px', 'abaixo da faixa da Provação');
    delete qs['#pc_hud .pc-badge']; delete qs['#pt_hud .pt-band']; delete els.dfh; els.wsl_root.style.display = 'none'; T += 600; HUD.update(); assert.strictEqual(r.style.top, P.top + 'px', 'selo escondido: volta ao lugar'); delete els.wsl_root;
    // derrotado
    D.hud = Object.assign({}, D.hud, { killed: true, frac: 0, hpText: '0 / 1.5M' }); T += 600; HUD.update(); assert(r.innerHTML.includes('Derrotado! Prêmios no correio') && !r.innerHTML.includes('Meu dano hoje'), 'chefe caído'); assert(r.innerHTML.includes('class="gbh dead"'));
    // atualização espaçada: sem força, não relê o módulo a cada quadro
    { let reads = 0; const h0 = DBL.hud; DBL.hud = () => { reads++; return D.hud; }; for (let i = 0; i < 50; i++) HUD.update(); assert(reads <= 1, 'leitura espaçada: ' + reads); DBL.hud = h0; }
    // show:false de novo = sai do DOM; volta com show:true
    D.hud = { show: false }; T += 600; assert.strictEqual(HUD.update(), false); assert.strictEqual(fbw.children.length, 0, 'show:false tira a faixa do DOM'); assert.strictEqual(rootOf(), null);
    D.hud = { show: true, name: '', level: 0, frac: 2, hpText: '1 / 1', mineText: '0', hitsLeft: 0, hitsMax: 2, killed: false, stale: false }; T += 600; assert.strictEqual(HUD.update(), true); r = rootOf(); assert(r && fbw.children.length === 1, 'volta'); assert(r.innerHTML.includes('<b>Chefe da guilda</b>') && r.innerHTML.includes('width:100%'), 'sem nome: rótulo padrão; barra limitada a 100%');
    // luta de instância: o topo é da instância, a faixa sai
    g.B.inst = { run: {} }; T += 600; assert.strictEqual(HUD.update(), false); assert.strictEqual(fbw.children.length, 0, 'instância: sem faixa'); g.B.inst = null; T += 600; assert.strictEqual(HUD.update(), true);
    // módulo com erro e chave desligada no meio: some sem quebrar
    { const h0 = DBL.hud; DBL.hud = () => { throw new Error('boom'); }; T += 600; assert.strictEqual(HUD.update(), false); assert.strictEqual(fbw.children.length, 0); DBL.hud = h0; }
    T += 600; assert.strictEqual(HUD.update(), true); DBL.DATA.on = false; T += 600; assert.strictEqual(HUD.update(), false); assert.strictEqual(fbw.children.length, 0, 'chave desligada no meio: a faixa some'); DBL.DATA.on = true; T += 600; assert.strictEqual(HUD.update(), true);
    assert.strictEqual(HUD.mount(fbw), true); assert.strictEqual(fbw.children.length, 1, 'não monta duas vezes'); HUD.unmount(); assert.strictEqual(fbw.children.length, 0); assert.strictEqual(HUD.update(true), false, 'depois do unmount não desenha');
  } finally { Date.now = realNow; }
  out.push('faixa: show:false = nada no DOM, show:true = x ' + P.left + ' a ' + (P.left + P.width) + ', y ' + P.top + ' (barra da fase acaba em ' + barBottom + '; Menu começa em x ' + menuX + '); desce abaixo do selo Forte contra, da Encruzilhada e da Provação; toque abre a Guilda na aba Chefe; Derrotado; leitura do chefe no máximo 1 por minuto; instância, erro e chave desligada tiram a faixa');

  g.Sys.guildBoss = GBR; assert.strictEqual(GBR.DATA.on, false, 'o teste devolve o módulo desligado');
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
