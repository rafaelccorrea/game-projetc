'use strict';
// Teste de fumaça do js/p_duo.js (DUPLA DAS ERAS) em Node: Sys.duo e Sys.duoNet REAIS; a rede (Sys.net._call) é de mentira. Rodar: node test/paineis/p_duo.smoke.js
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert');
const R = path.join(__dirname, '..', '..');
const g = globalThis; g.window = g; g.Sys = g.Sys || {};
['duo', 'duonet'].forEach(m => require(path.join(R, 'js/sys/' + m + '.js')));
const { makeHost } = require(path.join(R, 'test/sys/_host.js'));
const D = g.Sys.duo, DN = g.Sys.duoNet; assert(D && DN, 'módulos carregados');
assert.strictEqual(D.DATA.on, false, 'Sys.duo nasce desligado'); assert.strictEqual(DN.DATA.on, false, 'Sys.duoNet nasce desligado');

/* ---------- DOM de mentira ---------- */
const mkEl = id => ({ id, children: [], style: {}, dataset: {}, innerHTML: '', textContent: '', value: '', scrollTop: 0, setAttribute() {}, appendChild(c) { this.children.push(c); return c; }, focus() {} });
const ELS = {}; for (const id of ['du_code', 'du_scroll', 'du_chat', 'du_strip', 'du_wtm', 'du_cd']) ELS[id] = mkEl(id);
g.V = { innerHTML: '' }; const H = () => g.V.innerHTML;
const listeners = {};
g.document = { head: mkEl('head'), createElement: () => mkEl(''), activeElement: null, addEventListener: (k, f) => { listeners[k] = f; }, getElementById: id => (ELS[id] && H().includes('id="' + id + '"')) ? ELS[id] : null };

/* ---------- o jogo de mentira ---------- */
const host = makeHost({ seed: 7, stage: 15, unit: 9 }); let LV = 20; host.level = () => LV;
g.Sys.host = host; g.S = { hero: 'kael', gold: 0, gems: 0, stage: 15 };
g.n0 = v => String(Math.round(v)); g.kf = v => String(Math.round(v));
g.esc2 = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
g.xDims = () => ({}); g.xWrap = (d, c, i) => i; g.view = 'duo'; g.snd = () => {};
let def = null, addName = '', saves = 0, closed = 0; g.render = () => def.render(); g.statsChanged = () => { saves++; };
g.Screens = { close() { closed++; }, current: () => 'duo' };
g.PANEL_ON = {}; g.Panels = { defs: {}, add(n, d) { addName = n; def = d; this.defs[n] = d; return d; }, on: n => !!g.PANEL_ON[n], open() { return true; } };

/* ---------- servidor de mentira (contrato docs/API_SERVIDOR.md 16.1) ---------- */
const pad = n => String(n).padStart(2, '0'), dayKey = ms => { const d = new Date(ms); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const ME = 'R4K9T2QX', BIA = 'BJK9K3X2', THEO = 'THX55XQ2', LUNA = 'LNM8R2ZZ';
const calls = [], fail = {}; let mailed = true;
const SRV = { partner: null, leftAt: 0, relinkLeftMs: 0, partnerDay: { kills: 96 }, partnerWeek: { bossKills: 10, stages: 16, arenaWins: 2 }, partnerPresent: true, messages: [],
  invites: [{ id: BIA, name: 'Bia <b>', lv: 17, era: 1 }, { id: THEO, name: 'Theo', lv: 19, era: 2 }, { id: LUNA, name: 'Luna', lv: null, era: null }], invitesLeft: 5, msgLeft: 30, claimed: { daily: false, weekly: [] } };
const getDuo = () => { const msgs = SRV.messages; SRV.messages = []; return { on: true, code: ME, day: dayKey(host.now()), week: '', needLevel: 16, partner: SRV.partner, leftAt: SRV.leftAt, relinkLeftMs: SRV.relinkLeftMs,
  partnerDay: SRV.partnerDay, partnerWeek: SRV.partnerWeek, partnerPresent: SRV.partnerPresent, invites: SRV.partner ? [] : SRV.invites.map(x => ({ ...x, at: host.now() - 36e5 })), invitesLeft: SRV.invitesLeft,
  messages: msgs, msgLeft: SRV.msgLeft, claimed: SRV.claimed, cap: null }; };
const drop = id => { SRV.invites = SRV.invites.filter(x => x.id !== id); return { ok: true }; };
const ROUTES = {
  'GET /duo': getDuo, 'GET /me/friend-code': () => ({ code: ME }), 'POST /duo/progress': b => ({ ok: true, day: b.day, mine: b, capped: false }),
  'POST /duo/invite': b => { SRV.invitesLeft--; return { ok: true, code: b.code, expiresAt: host.now() + 48 * 36e5, left: SRV.invitesLeft }; },
  ['POST /duo/accept/' + BIA]: () => { SRV.partner = { id: BIA, name: 'Bia <b>', since: host.now() - 3 * 864e5, last: host.now() - 60000, lv: 17, era: 1 }; return { ok: true }; },
  ['POST /duo/decline/' + THEO]: () => drop(THEO), ['POST /duo/block/' + LUNA]: () => drop(LUNA),
  ['POST /duo/block/' + BIA]: () => { SRV.partner = null; return { ok: true }; },
  'POST /duo/leave': () => { SRV.partner = null; SRV.leftAt = host.now(); SRV.relinkLeftMs = 24 * 36e5; return { ok: true, relinkMs: 24 * 36e5 }; },
  'POST /duo/phrase': () => { SRV.msgLeft--; return { ok: true }; },
  'POST /duo/claim/daily': () => { SRV.claimed.daily = true; return { ok: true, id: 'daily', period: 'd', value: 342, target: 300, reward: { goldK: 30, stones: 1 }, mailed: mailed ? true : undefined }; },
  'POST /duo/claim/stages40': () => { SRV.claimed.weekly.push('stages40'); return { ok: true, id: 'stages40', period: 'w', value: 40, target: 40, reward: { goldK: 120, stones: 4 } }; },
  'POST /duo/claim/boss200': () => ({ ok: true, id: 'boss200' }) };
g.Sys.net = { _call(m, p, b) { const k = m + ' ' + p.split('?')[0]; calls.push(m + ' ' + p + (b ? ' ' + JSON.stringify(b) : ''));
  if (fail[k]) return Promise.reject(typeof fail[k] === 'string' ? { code: fail[k] } : fail[k]); const h = ROUTES[k]; if (!h) return Promise.reject({ code: 'not_found' });
  try { return Promise.resolve(h(b)); } catch (e) { return Promise.reject(e); } } };

const SRC = fs.readFileSync(path.join(R, 'js/p_duo.js'), 'utf8');
vm.runInThisContext(SRC, { filename: 'p_duo.js' });

/* ---------- ajudantes ---------- */
const out = [];
const has = s => assert(H().includes(s), 'faltou: ' + s), not = s => assert(!H().includes(s), 'não devia ter: ' + s);
const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const buttons = () => (H().match(/<button\b[^>]*>/g) || []).map(tag => { const ds = {}; for (const m of tag.matchAll(/data-([a-z]+)="([^"]*)"/g)) ds[m[1]] = un(m[2]); return { tag, dataset: ds }; });
const seenActs = new Set(), seenImgs = new Set();
function check(tag) { const h = H(), bt = buttons();
  for (const b of bt) { assert(b.dataset.x, tag + ': botão sem data-x: ' + b.tag); assert(def.actions.includes(b.dataset.x), tag + ': ação sem tratamento: ' + b.dataset.x); assert(!/\sdisabled[\s>=]/.test(b.tag), tag + ': botão morto: ' + b.tag); seenActs.add(b.dataset.x); }
  assert(!/\p{Extended_Pictographic}/u.test(h), tag + ': tem emoji'); assert(!/undefined|NaN|\[object|>null<|Infinity/.test(h), tag + ': texto quebrado: ' + (/.{40}(undefined|NaN|\[object|>null<|Infinity).{40}/.exec(h) || [''])[0]);
  assert(!/R\$|\d\s*reais|sorteio pago|última chance|só hoje|oferta acaba|comprar|diamante/i.test(h), tag + ': preço, compra ou pressão');
  assert(!/<textarea|contenteditable/i.test(h), tag + ': campo de texto livre'); assert((h.match(/<input\b/g) || []).length <= 1, tag + ': mais de um campo');
  for (const m of h.matchAll(/(?:src="|url\()([^")]+)/g)) { assert(fs.existsSync(path.join(R, m[1])), tag + ': imagem não existe: ' + m[1]); seenImgs.add(m[1]); }
  return bt.length; }
const click = (x, o) => def.click({ dataset: Object.assign({ x }, o || {}) });
const tick = () => new Promise(r => setTimeout(r, 5)); const settle = async () => { await tick(); await tick(); await tick(); };
const open = async () => { def.onOpen(); def.render(); await settle(); def.render(); };
const sent = re => calls.filter(c => re.test(c)).length;
const posts = () => calls.filter(c => /^POST/.test(c) && !/\/duo\/progress/.test(c)).length;

(async () => {
  // 0) registro
  assert.strictEqual(addName, 'duo'); assert.strictEqual(g.PANEL_ON.duo, false, 'a chave nasce desligada'); assert(def && def.render && def.click && def.tick && def.onOpen && def.onClose && def.title === 'Dupla das Eras');
  assert(!/\b(alert|confirm|prompt)\s*\(/.test(SRC), 'sem diálogo do navegador'); assert(!/\p{Extended_Pictographic}/u.test(SRC), 'arquivo sem emoji'); assert(!/PANEL_ON\.\w+\s*=\s*true|DATA\.on\s*=(?!=)/.test(SRC), 'o arquivo não liga chave nenhuma');
  assert(!/text-overflow\s*:\s*ellipsis/.test(SRC), 'nenhum texto cortado com reticências'); assert(!/new Image\(/.test(SRC), 'sem new Image()');
  // visual do mock A (escuro): as variáveis de cor ficam no topo do bloco de estilo (contraste não é verificável em node: só a existência)
  { const top = (/\.du\{([^}]*)\}/.exec(SRC) || ['', ''])[1]; for (const v of ['--bg', '--pan', '--line', '--gold', '--g2', '--cream', '--mut', '--ink', '--paper', '--wood', '--blue']) assert(new RegExp(v + ':#|' + v + ':rgba\\(').test(top), 'variável de cor ausente: ' + v); }
  assert(/drawHeroFull/.test(SRC), 'o meu retrato usa o desenho do jogo');
  for (const a of def.actions) assert(new RegExp('\\b' + a + '\\(').test(SRC), 'ação da lista sem tratador: ' + a);
  for (const u of g.PDuo.urls()) assert(fs.existsSync(path.join(R, u)), 'imagem da lista de carga não existe: ' + u);
  out.push('registro: painel duo, chave desligada, sem alert/confirm/prompt, sem emoji, sem texto cortado');

  // 1) MÓDULO DESLIGADO: aviso e Voltar, zero rede, nada escrito no save (nem pela leitura do selo do Menu)
  const S0 = JSON.stringify(g.S); DN.DATA.on = true; await open(); assert.strictEqual(check('desligado'), 1, 'só o Voltar'); has('Dupla das Eras: em breve.'); has('data-x="back"');
  for (const a of def.actions) if (a !== 'back') click(a, { id: BIA, idx: '3', k: 'boot' }); await settle(); def.tick(); assert.strictEqual(g.PDuo.alerts(), 0);
  assert.strictEqual(calls.length, 0, 'desligado: sem rede'); assert.strictEqual(JSON.stringify(g.S), S0, 'desligado: o save não muda'); assert.strictEqual(saves, 0); assert.strictEqual(g.S.sys, undefined);
  click('back'); assert.strictEqual(closed, 1, 'Voltar fecha a tela'); DN.DATA.on = false;
  { const keep = g.Sys.duo; g.Sys.duo = null; def.onOpen(); def.render(); has('Dupla indisponível agora.'); assert.strictEqual(check('sem módulo'), 1); click('invite'); assert.strictEqual(JSON.stringify(g.S), S0); g.Sys.duo = keep; }
  out.push('módulo desligado ou ausente: aviso e Voltar, zero rede, save intacto');

  // 2) módulo ligado, NÍVEL baixo: aviso com o nível do módulo, zero rede
  D.DATA.on = true; DN.DATA.on = true; LV = 10; await open(); check('nível'); has('A Dupla abre no nível 16'); assert.strictEqual(calls.length, 0, 'nível baixo: sem rede'); LV = 20;
  // 3) rede DESLIGADA (Sys.duoNet.DATA.on = false): "abre com o online" e as regras do módulo; nenhum nome ou número de servidor
  DN.DATA.on = false; await open(); check('sem online'); has('Em breve: abre com o online'); has('Como a Dupla funciona'); has('5 por dia. Vence em 48 h'); has('Só 18 frases prontas'); has('somam 300 abates'); not('Bia'); not(ME); not('du_code');
  click('invite'); click('leave'); click('yes'); click('send', { idx: '0' }); await settle(); assert.strictEqual(calls.length, 0, 'sem online: sem rede'); not('du-conf');
  // 4) rede ligada, SEM CONEXÃO: "Carregando…" durante a chamada, depois o motivo em texto e "Tentar de novo"
  DN.DATA.on = true; fail['GET /duo'] = 'timeout'; def.onOpen(); def.render(); has('Carregando…'); check('conectando'); await settle(); def.render(); check('sem conexão'); has('Sem conexão: tente de novo'); has('abre com o online'); has('data-x="retry"'); not('Bia');
  assert.strictEqual(sent(/^GET \/duo$/), 1, 'uma tentativa só por abertura');
  fail['GET /duo'] = 'not_found'; click('retry', { k: 'boot' }); has('Carregando…'); await settle(); has('A Dupla ainda não abriu'); assert.strictEqual(posts(), 0);
  out.push('nível baixo, rede desligada ("abre com o online" + regras do módulo), sem conexão e 404 do servidor em texto, com Tentar de novo');

  // 5) ONLINE, SEM DUPLA: o meu código e os convites vêm do servidor; nomes escapados
  delete fail['GET /duo']; click('retry', { k: 'boot' }); await settle(); def.render(); check('sem dupla');
  has(ME); has('du-card lt'); has('du-myc'); has('Convites hoje: 0/5'); has('Bia &lt;b&gt;'); not('Bia <b>'); has('Nv 17'); has('Theo'); has('Luna'); has('Convite pelo seu código'); has('Convite sem resposta vence em 48 h'); has('data-x="accept" data-id="' + BIA + '"'); has('Nenhum'.slice(0, 0) + 'Convites recebidos<span>3</span>');
  assert.strictEqual(g.PDuo.alerts(), 0, 'selo do Menu: chave da tela desligada = 0'); g.PANEL_ON.duo = true; assert.strictEqual(g.PDuo.alerts(), 3, 'selo do Menu: 3 convites'); g.PANEL_ON.duo = false;
  click('copy'); assert(/Código R4K9T2QX copiado|Anote o seu código: R4K9T2QX/.test(H()), 'copiar mostra o código');
  // o campo só aceita A-Z e 0-9
  { const t = { id: 'du_code', value: 'ab c-1!<é>' }; listeners.input({ target: t }); assert.strictEqual(t.value, 'ABC1'); assert.strictEqual(g.PDuo.sanitize('k7q2-m9 <b>zzzzzzzz'), 'K7Q2M9BZZZ'); }
  // convidar: código ruim e o próprio código não gastam rede; código bom = UMA chamada com o código limpo
  ELS.du_code.value = 'ab'; click('invite'); has('Código inválido: use de 6 a 10 letras ou números'); ELS.du_code.value = ME.toLowerCase(); click('invite'); has('Esse é o seu código'); assert.strictEqual(posts(), 0, 'código inválido não envia');
  ELS.du_code.value = 'k7q2-m9zz'; click('invite'); has('Carregando…'); check('convidando'); click('invite'); click('accept', { id: BIA }); await settle();
  assert.strictEqual(sent(/^POST \/duo\/invite/), 1, 'um convite só'); assert(calls.includes('POST /duo/invite {"code":"K7Q2M9ZZ"}'), 'convida o código limpo'); assert.strictEqual(sent(/accept/), 0, 'ocupado: o resto espera');
  has('Convite enviado para K7Q2M9ZZ. Vence em 48 h'); has('Enviados: <b>K7Q2M9ZZ</b> (vence em 48 h)'); has('Convites hoje: 1/5'); has('value=""'); check('convidou'); assert(saves > 0, 'salva depois do ok');
  // recusa do servidor: o motivo em texto, embaixo do campo
  fail['POST /duo/invite'] = 'target_paired'; ELS.du_code.value = 'ZZZZ2222'; click('invite'); await settle(); has('Esse amigo já tem uma dupla'); not('Enviados: <b>ZZZZ2222'); check('recusa do convite');
  fail['POST /duo/invite'] = { code: 'limit' }; click('invite'); await settle(); has('Os convites de hoje acabaram (5 por dia). Amanhã tem mais'); delete fail['POST /duo/invite']; ELS.du_code.value = '';
  // recusar: direto; bloquear convite: DOIS toques
  click('decline', { id: THEO }); await settle(); assert.strictEqual(sent(/^POST \/duo\/decline\/THX55XQ2$/), 1); has('Convite recusado'); not('Theo');
  click('blockinv', { id: LUNA }); check('confirma bloquear convite'); has('Bloquear Luna?'); has('Ninguém é avisado'); assert.strictEqual(sent(/block/), 0, '1º toque não envia'); click('no'); not('du-conf'); assert.strictEqual(sent(/block/), 0, 'Cancelar não envia');
  click('blockinv', { id: LUNA }); click('yes'); has('Bloqueando…'); await settle(); assert.strictEqual(sent(/^POST \/duo\/block\/LNM8R2ZZ$/), 1, 'bloqueia o convite certo, uma vez'); has('Bloqueado: não pode mais te convidar'); not('Luna'); has('Bloqueados: <b>1</b>');
  click('accept', { id: 'NAOEXISTE' }); await settle(); assert.strictEqual(sent(/accept/), 0, 'aceitar convite que não está na tela não envia');
  out.push('sem dupla: código e convites do servidor escapados; convidar (1 chamada, código limpo), recusa em texto, recusar, bloquear convite em 2 toques');

  // 6) ACEITAR: forma a dupla; parceiro e progresso vêm do servidor
  click('accept', { id: BIA }); has('Carregando…'); await settle(); assert.strictEqual(sent(/^POST \/duo\/accept\/BJK9K3X2$/), 1, 'aceita o convite certo, uma vez'); def.render(); check('com dupla');
  has('Dupla formada com Bia &lt;b&gt;'); has('SUA DUPLA · HÁ 1 DIA<'); has('<b>Bia &lt;b&gt;</b>'); not('Bia <b>'); has('Nv 17'); has('online'); has('Juntos hoje'); has('Bia &lt;b&gt;: 96 · entrou hoje'); has('Você: 0'); has('96 / 300');
  has('Juntos, 40 fases vencidas'); has('16/40'); has('data-x="leave"'); has('data-x="block"'); not('du_code');
  // ordem do mock: retratos com o elo no meio, painel das missões, balões de frase (as 5 primeiras do módulo) e o botão azul que abre todas
  { const h = H(), at = s => h.indexOf(s); assert(at('du-pair') > 0 && at('du-pair') < at('Missões da semana') && at('Missões da semana') < at('du-quick') && at('du-quick') < at('data-x="leave"'), 'ordem dos blocos do mock');
    const q = buttons().filter(b => b.dataset.x === 'send'); assert.strictEqual(q.length, 5, '5 balões de frase'); q.forEach((b, i) => assert.strictEqual(b.dataset.idx, String(i), 'balão com o índice do módulo'));
    assert(/class="du-bt b" data-x="phr"/.test(h), 'botão azul abre todas as frases'); }
  { const unit = host.goldUnit(), gk = Math.round(30 * unit); has('>' + gk + '</span>'); has('+1 pedra<'); has('+4 pedras<'); }
  // meta não fechada: o toque explica e NÃO envia
  click('claim', { id: 'daily' }); has('A meta ainda não fechou'); assert.strictEqual(sent(/claim/), 0, 'meta aberta não envia');
  // fecha a meta (meus abates pelo módulo, os do parceiro pelo servidor) e resgata: UMA chamada; com mailed o jogo NÃO paga
  D.track(g.S, host, 'kills', 142); SRV.partnerDay = { kills: 200 }; await DN.refresh(g.S, host); def.render(); check('meta fechada'); has('300 / 300'); has('Você: 142');
  const gold0 = host.gold; click('claim', { id: 'daily' }); has('Carregando…'); await settle(); assert.strictEqual(sent(/^POST \/duo\/claim\/daily$/), 1, 'um resgate só'); has('Prêmio enviado: chega pelo correio'); has('No correio'); assert.strictEqual(host.gold, gold0, 'com mailed o jogo não paga'); check('resgatou pelo correio');
  click('claim', { id: 'daily' }); await settle(); has('Você já resgatou este prêmio'); assert.strictEqual(sent(/^POST \/duo\/claim\/daily$/), 1, 'resgatado não reenvia');
  // semanal sem mailed: o módulo paga UMA vez; recusa do servidor (presence) em texto, sem pagar
  SRV.partnerWeek = { bossKills: 200, stages: 40, arenaWins: 2 }; await DN.refresh(g.S, host); def.render(); click('claim', { id: 'stages40' }); await settle(); assert.strictEqual(sent(/claim\/stages40$/), 1);
  { const pay = Math.round(120 * host.goldUnit()); assert.strictEqual(host.gold, gold0 + pay, 'sem mailed o Sys.duo paga uma vez'); has('Prêmio recebido: +' + pay + ' de ouro'); has('Resgatado'); }
  fail['POST /duo/claim/boss200'] = 'presence'; const gold1 = host.gold; click('claim', { id: 'boss200' }); await settle(); has('A meta precisa dos dois'); assert.strictEqual(host.gold, gold1, 'recusa não paga'); delete fail['POST /duo/claim/boss200']; check('recusa do resgate');
  click('claim', { id: 'naoexiste' }); await settle(); assert.strictEqual(sent(/claim\/naoexiste/), 0);
  out.push('com dupla: parceiro e progresso do servidor escapados; resgate em 1 chamada (correio não paga, sem correio o módulo paga 1 vez), meta aberta não envia, recusa presence em texto');

  // 7) FRASES PRONTAS: só o índice viaja; limites do módulo; frase do parceiro chega pelo servidor
  g.PANEL_ON.duo = true; SRV.messages = [{ idx: 0, at: host.now() - 5000 }]; await DN.refresh(g.S, host); assert.strictEqual(g.PDuo.alerts(), 1, 'selo do Menu: 1 frase nova'); def.render(); has('Abrir (1)'); has('<b>Bia &lt;b&gt;</b>: Oi, dupla!');
  click('phr'); await settle(); def.render(); check('frases'); has('Só frases prontas, sem texto livre'); has('Frases · Bia &lt;b&gt;'); has('Oi, dupla!'); has('pode mandar'); assert.strictEqual(g.PDuo.alerts(), 0, 'abrir as frases zera o selo'); g.PANEL_ON.duo = false;
  assert.strictEqual(buttons().filter(b => b.dataset.x === 'send').length, D.DATA.phrases.length, 'um botão por frase do módulo'); assert(!/<input|<textarea/.test(H()), 'sem campo de texto nas frases');
  click('send', { idx: '3' }); await settle(); assert.strictEqual(sent(/^POST \/duo\/phrase/), 1); assert(calls.includes('POST /duo/phrase {"idx":3}'), 'o corpo é só o índice'); has('Bora jogar?<small>você'); has('aguarde 5 s'); check('frase enviada');
  click('send', { idx: '4' }); await settle(); has('Aguarde 5 s para a próxima frase'); assert.strictEqual(sent(/^POST \/duo\/phrase/), 1, 'no intervalo de 5 s não envia');
  click('send', { idx: '99' }); click('send', { idx: '<b>oi</b>' }); click('send', {}); await settle(); assert.strictEqual(sent(/^POST \/duo\/phrase/), 1, 'índice fora da lista não envia');
  host.t += 6000; def.tick(); has('pode mandar'); click('send', { idx: '3' }); await settle(); host.t += 6000; def.render(); has('du-phb rp'); click('send', { idx: '3' }); await settle(); has('Essa já foi 2 vezes seguidas: escolha outra'); assert.strictEqual(sent(/^POST \/duo\/phrase/), 2, 'a 3ª seguida não envia');
  fail['POST /duo/phrase'] = { code: 'wait', retryAfterMs: 3000 }; click('send', { idx: '5' }); await settle(); has('Aguarde 3 s para a próxima frase'); delete fail['POST /duo/phrase'];
  for (const c of calls.filter(c => /^POST \/duo\/phrase/.test(c))) assert(/^POST \/duo\/phrase \{"idx":\d+\}$/.test(c), 'frase com corpo estranho: ' + c);
  // o que chega do servidor: só índice válido vira balão; texto de fora nunca aparece
  SRV.messages = [{ idx: 7, at: host.now() }, { idx: 99, at: host.now() }, { idx: 1, txt: '<script>x</script>', text: 'me chama no zap' }]; await DN.refresh(g.S, host); def.render(); check('frase recebida');
  has('Derrubei um chefe!<small>Bia &lt;b&gt;'); has('Bom dia!'); not('zap'); not('<script'); not('&lt;script');
  click('tduo'); check('volta para a dupla'); has('data-x="leave"'); not('du_chat');
  out.push('frases: 18 botões do módulo, corpo {idx}, 5 s e 2 seguidas sem rede, recusa wait com o tempo, frase do parceiro pelo servidor, texto de fora nunca aparece');

  // 8) SAIR: dois toques; depois a espera de quem saiu (contagem do servidor)
  click('leave'); check('confirma sair'); has('Sair da dupla com Bia &lt;b&gt;?'); has('Quem sai espera 24 h'); assert.strictEqual(sent(/leave/), 0, '1º toque não envia'); click('no'); not('du-conf'); assert.strictEqual(sent(/leave/), 0, 'Ficar não envia');
  fail['POST /duo/leave'] = 'timeout'; click('leave'); click('yes'); has('Saindo da dupla…'); await settle(); has('Sem conexão: tente de novo'); has('data-x="leave"'); delete fail['POST /duo/leave'];
  click('leave'); click('yes'); await settle(); assert.strictEqual(sent(/^POST \/duo\/leave$/), 2, 'sai uma vez por confirmação'); def.render(); check('esperando');
  has('Você saiu da dupla'); has('id="du_wtm">24:00:00'); has('Só quem sai espera 24 h'); has('Convites recebidos'); not('data-x="leave"'); assert.strictEqual(D.ensure(g.S).partner, null);
  host.t += 61000; def.tick(); assert.strictEqual(ELS.du_wtm.textContent, '23:58:59', 'a contagem anda no tick');
  // esperando: convidar e aceitar explicam e não enviam
  { const n = posts(); ELS.du_code.value = 'ZZZZ2222'; click('invite'); has('Você saiu de uma dupla: espere'); SRV.invites = [{ id: BIA, name: 'Bia <b>', lv: 17, era: 1 }]; await DN.refresh(g.S, host); def.render(); click('accept', { id: BIA }); await settle(); has('Você saiu de uma dupla: espere'); assert.strictEqual(posts(), n, 'esperando: não envia'); ELS.du_code.value = ''; }
  // 9) BLOQUEAR o parceiro: dois toques, com o código dele
  SRV.leftAt = 0; SRV.relinkLeftMs = 0; SRV.partner = { id: BIA, name: 'Bia <b>', since: host.now(), last: 0, lv: null, era: null }; await DN.refresh(g.S, host); await open(); check('dupla de novo'); has('<b>Bia &lt;b&gt;</b>'); not('visto'); not('Nv ');
  click('block'); check('confirma bloquear'); has('Bloquear Bia &lt;b&gt;?'); assert.strictEqual(sent(/block\/BJK9K3X2/), 0, '1º toque não envia'); click('yes'); await settle(); assert.strictEqual(sent(/^POST \/duo\/block\/BJK9K3X2$/), 1, 'bloqueia o parceiro, uma vez'); def.render(); has('Jogador bloqueado'); check('bloqueou');
  out.push('sair e bloquear em 2 toques (1 chamada cada, recusa em texto), espera de quem saiu com a contagem do servidor, esperando não envia');

  // 10) toda ação da lista apareceu num botão
  for (const a of def.actions) assert(seenActs.has(a), 'ação nunca apareceu num botão: ' + a);
  out.push('imagens em disco: ' + seenImgs.size + ' na tela + ' + g.PDuo.urls().length + ' na lista de carga; ' + seenActs.size + ' ações vistas em botões');
  for (const o of out) console.log('- ' + o); console.log('TODOS OS TESTES PASSARAM');
})().catch(e => { console.error(e); process.exit(1); });
