'use strict';
/* DIFICULDADE COM PAREDES (js/diff.js) SEM NAVEGADOR. Uso: node test/e2e/diff.js [-v]. Sai com código 1 se algo falhar.
   Chave desligada = nada muda (FC pedida, inimigos das fases 1/10/35/70, HUD, Derrota, Desafiar, módulos). Ligada = tabela do docs/balance.json
   (lida do arquivo, nenhum número fixo aqui), cores, cartão na Derrota e antes do chefe, botões, chefe 32 s/40 s na batalha de verdade, comuns,
   fúria, teto de XP, estrela da montaria, eras 7-8 nas duas combinações. "MEDIDA" = número informativo (não reprova): vai para o relatório. */
const VERBOSE = process.argv.includes('-v');
const fs = require('fs'), path = require('path');
const boot = require('./sandbox'), errStr = boot.errStr;
const DT = 1 / 30;
let fails = 0, total = 0; const notes = [];
const check = (name, ok, err) => { total++; if (!ok) fails++; if (VERBOSE || !ok) console.log((ok ? '  OK    ' : '  FALHA ') + name + (ok || !err ? '' : ' → ' + err)); return !!ok; };
const note = t => { notes.push(t); console.log('  MEDIDA ' + t); };
const FILE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'balance.json'), 'utf8')).dificuldade;
const EMOJI = /[←-⯿️]|[\uD800-\uDBFF][\uDC00-\uDFFF]/;
const near = (a, b, tol) => Math.abs(a - b) <= Math.abs(b) * tol;
const tick = () => new Promise(r => setImmediate(r));

/* elementos de mentira só para o que o js/diff.js cria (HUD e cartão): guardam id, estilo, HTML e se foram removidos */
function fakeDom(G) { const reg = {}; const mk = () => { const e = { id: '', style: { cssText: '' }, innerHTML: '', textContent: '', attrs: {}, dataset: {}, kids: [], gone: false,
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } }, setAttribute(k, v) { e.attrs[k] = v; }, getAttribute(k) { return e.attrs[k]; }, addEventListener() {},
      appendChild(c) { e.kids.push(c); if (c && c.id) reg[c.id] = c; return c; }, remove() { e.gone = true; if (reg[e.id] === e) delete reg[e.id]; } }; return e; };
  const d = G.document, get0 = d.getElementById.bind(d), mk0 = d.createElement.bind(d);
  const fbw = mk(); fbw.id = 'fb_w'; const sub = { dfh_t: mk(), dfh_x: mk() };
  d.getElementById = id => { if (id === 'fb_w') return fbw; if (id === 'app' && G.fakeDiv) return appP; if (id === 'dfh' || id === 'dfc') return reg[id] || null; if (id === 'dfh_t' || id === 'dfh_x') return reg.dfh ? sub[id] : null; return get0(id); };
  d.createElement = tag => (String(tag).toLowerCase() === 'div' && G.fakeDiv) ? mk() : mk0(tag);
  const appP = new Proxy(get0('app'), { get(t, k) { if (k === 'appendChild') return c => { if (c && c.id && c.kids) reg[c.id] = c; return c; }; return t[k]; } });
  return { reg, sub, hook: on => { G.fakeDiv = on; }, appAppend: c => { if (c && c.id) reg[c.id] = c; } }; }

async function game(search) { const loadErr = []; const G = boot({ realFetch: true, search, add: (g, n, ok, e) => { if (!ok) loadErr.push(n + ': ' + e); } }); const { ev, inCtx } = G;
  check('jogo carregou' + (search ? ' (' + search + ')' : ''), !loadErr.length, loadErr.slice(0, 3).join(' | '));
  check('js/diff.js e js/sys/advice.js nas listas do index.html', G.lists.jsList.includes('diff') && G.lists.sysList.includes('advice') && G.lists.sysList.indexOf('advice') > G.lists.sysList.indexOf('fc'), G.lists.jsList.join(',') + ' / ' + G.lists.sysList.join(','));
  G.scale = null; G.frameErr = [];
  /* herói com os atributos do jogo × G.scale.k (ATQ, VIDA, DEF) a cada quadro; G.scale.atk0 = sem dano (mede só quanto aguenta) */
  G.hero = () => { const h = ev('B.hero'), s = G.scale; if (!h || !s) return; const st = s.st; const r = h.maxhp > 0 ? h.hp / h.maxhp : 1; h.atk = s.atk0 ? 1e-9 : st.atk * s.k; h.maxhp = st.hp * s.k; h.def = (st.def || 0) * s.k; if (!s.set) { h.hp = h.maxhp; s.set = true; } else h.hp = Math.min(h.maxhp, r * h.maxhp); };
  G.sandbox.__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { G.hero(); ev('step')(dt); if (typeof G.sandbox.petStep === 'function') ev('petStep')(dt); } if (typeof G.sandbox.resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); };
  G.frame = async () => { try { inCtx(() => G.sandbox.__e2eFrame(DT)); } catch (e) { const s = errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); } try { inCtx(() => G.advance(DT * 1000)); } catch (e) {} if (++G.n % 30 === 0) await tick(); };
  G.n = 0; G.until = async (cond, secs) => { const n = Math.ceil(secs / DT); for (let i = 0; i < n; i++) { if (cond()) return true; await G.frame(); if (G.frameErr.length > 10) break; } return !!cond(); };
  G.start = (stage, wave, extra) => ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.tut=99; S.welcome=true; S.name='Kael'; S.hero=S.hero||'kael'; S.stage=${stage}; S.wave=${wave}; S.best=Math.max(S.best||1,${stage}); S.eraMax=Math.max(S.eraMax||0,eraOf(${stage})); S.farm=false; ${extra || ''}
      B.paused=false; B.res=null; B.inst=null; B.energy=0; B.cd2=0; view='battle'; try{ resize(); }catch(e){} statsChanged(); startBattle(); return 1; })()`);
  ev('loadBalance()'); for (let i = 0; i < 20; i++) await tick();
  return G; }
/* inimigo de hoje, pela fórmula do mkEnemy escrita aqui de novo (BAL do jogo já com o balance.json) */
const today = (G, stage, kind) => G.ev(`(function(){ const stage=${stage}, kind='${kind}', era=eraOf(stage), boss=kind==='boss', eraBoss=boss&&stage%STAGES_PER_ERA===0, ease=BAL.earlyEase[stage-1]||1, em=BAL.eraMult[era]||1;
  return JSON.stringify([em*BAL.enemyHpBase*Math.pow(BAL.enemyHpGrowth,stage-1)*ease*(boss?BAL.bossHpMult*(eraBoss?BAL.eraBossHpMult:1):BAL.commonHpMult), em*BAL.enemyDmgBase*Math.pow(BAL.enemyDmgGrowth,stage-1)*(ease<1?0.7:1)*(boss?BAL.bossDmgMult*(eraBoss?BAL.eraBossDmgMult:1):BAL.commonDmgMult)]); })()`);
const enemy = (G, stage, kind) => G.ev(`(function(){ const e=mkEnemy(${stage},'${kind}'); return JSON.stringify([e.maxhp,e.dmg,e.hp,'diff' in e,e.fury||0]); })()`);
/* save com pet filhote equipado (1º estágio): devolve a FC */
const cubFc = G => G.ev(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); const o=Sys.pet.ensure(S), p=Sys.pet.DATA.pets[0]; o.owned[p.id]={stars:1,lvl:10,frags:0,stg:0}; o.eq=p.id; Sys.pet.ensure(S); try{ statsChanged(); }catch(e){} return heroFC(); })()`);
const STAGES = [1, 10, 35, 70], KINDS = ['e0', 'e1', 'boss'];
const snapOff = G => STAGES.map(s => KINDS.map(k => enemy(G, s, k)).join(';') + '|' + G.ev(`fcNeed(${s})`)).join('#');
/* estado com mochila, nível, pet e montaria, para o Sys.advice ter o que sugerir */
const rich = (G, lvl) => G.ev(`(function(){ S.gold=5e7; S.gems=9000; try{ Sys.level.ensure(S).lvl=${lvl}; }catch(e){} try{ const sl=SLOTS7.filter(s=>s!=='wing'); for(let i=0;i<14;i++) addItemToBag({slot:sl[i%sl.length],r:i%5,e:Math.min(S.eraMax,i%2)}); }catch(e){}
  try{ const c=Sys.mount.catalog().find(m=>m.live); if(c){ Sys.mount.add(S,Sys.host,c.id); Sys.mount.addFragments&&Sys.mount.addFragments(S,Sys.host,c.id,5); } }catch(e){} try{ statsChanged(); }catch(e){} return 1; })()`);
/* texto nowrap sem corte = só o que tem largura fixa/limite; larguras fixas de uma linha do cartão têm de caber na base de 390 */
function widthChecks(label, html, s, W) { const m = html.match(/id="dfc_w"[^>]*width:(\d+)px[^>]*scale\(([\d.]+)\)/);
  if (m) check(label + ': a base de ' + m[1] + ' px escalada cabe em ' + W + ' px', +m[1] * +m[2] <= W + 0.5 && near(+m[2], s, 0.001), m[1] + ' × ' + m[2]);
  const fixed = []; html.replace(/(?:^|[;"])(?:min-)?width:(\d+(?:\.\d+)?)px/g, (x, n) => { fixed.push(+n); return x; });
  check(label + ': nenhuma largura fixa passa da área útil (358 px da base)', fixed.every(n => n <= 358 || n === 390), fixed.join(','));
  const bad = []; html.replace(/<(span|h2|button)[^>]*style="([^"]*white-space:nowrap[^"]*)"/g, (x, tag, st) => { if (!/overflow:hidden/.test(st) && !/(^|;)width:\d/.test(st) && !/flex:1/.test(st)) bad.push(st.slice(0, 60)); return x; });
  check(label + ': todo texto de uma linha tem corte (nada empurra a tela para o lado)', !bad.length, bad.join(' | '));
  check(label + ': sem rolagem', !/overflow(-x)?:(auto|scroll)/.test(html)); }

(async () => {
  /* ======================= 1. CHAVE DESLIGADA ======================= */
  console.log('1. chave desligada');
  const G = await game(), { ev } = G, D = fakeDom(G);
  const F = code => { try { return ev(code); } finally { D.hook(false); } };   /* só as chamadas do js/diff.js criam elementos de mentira */
  check('tabela do balance.json lida pelo loadBalance (bloco dificuldade)', ev('!!DIFF.tbl') && ev('JSON.stringify(DIFF.tbl.recFc)') === JSON.stringify(FILE.recFc), 'DIFF.tbl=' + ev('!!DIFF.tbl'));
  check('arquivo traz a chave desligada (on:false)', FILE.on === false, String(FILE.on));
  check('DIFF_ON desligada e módulos intactos', ev('diffOn()') === false && ev('Sys.advice.DATA.on') === false && ev('Sys.level.killCap(S,Sys.host).on') === false && ev('Sys.mount.DATA.starFlat.on') === false);
  const cub0 = cubFc(G); check('pet: evoluir ainda não dá FC (setStageMult desligado)', ev('Sys.pet.DATA.v17.stageMult.on') === false && cub0 > 0, String(cub0));
  G.start(1, 1); const off0 = snapOff(G);
  for (const s of STAGES) { check('fase ' + s + ': FC pedida = recFC de hoje', ev(`fcNeed(${s})`) === ev(`recFC(${s})`), ev(`fcNeed(${s})`) + ' x ' + ev(`recFC(${s})`));
    for (const k of KINDS) { const t = JSON.parse(today(G, s, k)), e = JSON.parse(enemy(G, s, k)); check('fase ' + s + ' ' + k + ': vida e dano iguais aos de hoje', e[0] === t[0] && e[1] === t[1] && e[2] === t[0] && e[3] === false && e[4] === 0, JSON.stringify(e) + ' x ' + JSON.stringify(t)); } }
  F('diffHud(heroFC())'); check('HUD: nada criado', !D.reg.dfh);
  check('diffStep/diffEnemy/diffAsk/diffLoseRows não fazem nada', ev("diffStep(1)===undefined&&diffEnemy(5,'boss',null)===null&&diffAsk()===false&&diffLoseRows(100)===''&&diffDeadMsg()===''"));
  G.start(5, 1);
  F('bossAskT=0; bossTap()'); check('Desafiar com FC baixa: aviso de sempre, sem cartão, sem entrar no chefe', !D.reg.dfc && ev('S.wave') === 1 && ev('DIFF.card') == null);
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); const loseOff = String(ev('RES.el&&RES.el.innerHTML') || '');
  check('Derrota: os caminhos de sempre, sem ações do Sys.advice', /data-q="gear"/.test(loseOff) && !/res_adv|data-q="adv:/.test(loseOff), loseOff.length + ' caracteres');
  ev("resClose('farm')");

  /* ======================= 2. TABELA ======================= */
  console.log('2. tabela (docs/balance.json)');
  const n = FILE.recFc.length, g = FILE.afterLastGrowth;
  check('recFc: uma FC por fase jogável das 9 eras (' + n + ' valores)', n === ev('9*STAGES_PER_ERA'), n + ' x ' + ev('9*STAGES_PER_ERA'));
  ev('diffSet(true)');
  { let bad = ''; for (let s = 1; s <= n; s++) if (ev(`fcNeed(${s})`) !== FILE.recFc[s - 1]) { bad = 'fase ' + s; break; } check('ligada: fcNeed(fase) = recFc[fase-1] em todas as fases', !bad, bad);
    check('depois da última: a da última × afterLastGrowth por fase', [1, 2, 7].every(d => ev(`fcNeed(${n + d})`) === Math.round(FILE.recFc[n - 1] * Math.pow(g, d))), ev(`fcNeed(${n + 1})`) + ' x ' + Math.round(FILE.recFc[n - 1] * g)); }

  /* ======================= 3. LIGADA: módulos, HUD, cores ======================= */
  console.log('3. ligada: módulos, HUD e cores');
  check('Sys.advice ligado junto', ev('Sys.advice.DATA.on') === true);
  check('teto de XP de abate conforme o arquivo', ev('Sys.level.killCap(S,Sys.host).on') === (FILE.killXpCap.on === true));
  check('estágio do pet (setStageMult) conforme o arquivo', ev('Sys.pet.DATA.v17.stageMult.on') === (FILE.petStageMult.on === true) && FILE.petStageMult.on === true, String(ev('Sys.pet.DATA.v17.stageMult.on')));
  check('estrela da montaria conforme o arquivo', ev('Sys.mount.DATA.starFlat.on') === (FILE.mountStarFlat.on === true));
  { const rr = ev(`(function(){ const M=Sys.mount, m=M.DATA.mounts.find(x=>!x.tbd); const a=M.pctOf(m.id,10,3); M.setStarFlat(false); const b=M.pctOf(m.id,10,3); M.setStarFlat(true); return JSON.stringify([a,b,m.r]); })()`), [a, b, r] = JSON.parse(rr);
    check('montaria 3 estrelas: +2 × o % do arquivo sobre a de hoje', near(a - b, 2 * FILE.mountStarFlat.pct[Math.min(r, FILE.mountStarFlat.pct.length - 1)], 0.001), a + ' - ' + b); }
  if (FILE.killXpCap.on === true) { const r = JSON.parse(ev(`(function(){ const L=Sys.level, c0=L.killCap(S,Sys.host), o=L.ensure(S), lv0=o.lvl; o.lvl=1; o.xp=0; const a=L.addXp(S,10,Sys.host,'kill').gained; L.killCap(S,Sys.host); o.kx=c0.full*3; const c1=L.killCap(S,Sys.host); const b=L.addXp(S,1000,Sys.host,'kill').gained, g0=S.gold;
      const I=diffHudInfo(heroFC(),S.stage); return JSON.stringify({full:c0.full,a,b,rate:c1.rate,xp:I.xp}); })()`));
    check('teto de XP: antes cheia, depois do teto rende a taxa do módulo', r.a === 10 && r.b === Math.round(1000 * r.rate) && r.rate < 1, JSON.stringify(r));
    check('HUD avisa "XP de abate cheia até ..." quando o teto do dia enche', /^XP de abate cheia até /.test(r.xp) && !EMOJI.test(r.xp), r.xp); }
  G.start(1, 1); D.hook(true);
  /* três casos com uma tabela derivada da FC do próprio herói (nenhum número fixo): fase 1 = igual, fase 2 = 95%, fase 3 = 50% */
  ev('window.__tb=DIFF.tbl; diffBal(Object.assign({},DIFF.tbl,{recFc:[heroFC(),Math.ceil(heroFC()/0.95),heroFC()*2]}))');
  const COL = JSON.parse(ev('JSON.stringify(DIFF.col)'));
  for (const [st, tier, nm] of [[1, 0, 'verde (igual)'], [2, 1, 'amarelo (um pouco abaixo)'], [3, 2, 'vermelho (bem abaixo)']]) { F(`S.stage=${st}; S.wave=1; DIFF.hk=null; diffHud(heroFC())`);
    const I = JSON.parse(ev(`JSON.stringify(diffHudInfo(heroFC(),${st}))`)), t = D.sub.dfh_t;
    check('HUD ' + nm + ': FC pedida e cor certas', !!D.reg.dfh && I.tier === tier && t.textContent === 'FC recomendada ' + ev(`fcShow(fcNeed(${st}))`) && t.style.color === COL[tier] && !EMOJI.test(t.textContent), t.textContent + ' ' + t.style.color + ' tier ' + I.tier); }
  F('S.wave=5; DIFF.hk=null; diffHud(heroFC())'); check('HUD no chefe: "Chefe: FC ..."', D.sub.dfh_t.textContent === 'Chefe: FC ' + ev('fcShow(fcNeed(3))'), D.sub.dfh_t.textContent);
  check('limiar das cores num lugar só (DIFF.tier)', ev('diffTier(100,100)') === 0 && ev('diffTier(DIFF.tier.yellow*100,100)') === 1 && ev('diffTier(DIFF.tier.yellow*100-1,100)') === 2);
  F('S.stage=1; S.wave=1; bossAskT=0; bossTap()'); check('Desafiar com a FC igual à pedida: vai direto ao chefe, sem cartão', ev('S.wave') === 5 && !D.reg.dfc);
  F('B.inst={}; diffHud(heroFC())'); check('HUD some em instância', !D.reg.dfh); ev('B.inst=null');
  ev('diffBal(window.__tb)');

  /* ======================= 4. CARTÃO ======================= */
  console.log('4. cartão "Faltam X de FC"');
  G.start(25, 1); rich(G, 60); D.hook(true);
  const need5 = ev('fcNeed(25)'), fc5 = ev('heroFC()'); check('estado do teste: FC abaixo da pedida da fase 25', fc5 < need5, fc5 + ' x ' + need5);
  const raw = JSON.parse(ev('JSON.stringify(Sys.advice(S,Sys.host,{need:fcNeed(25),limit:12}))'));
  const s1 = ev('JSON.stringify(S)'); F('bossAskT=0; bossTap()'); const card = D.reg.dfc, s2 = ev('JSON.stringify(S)');
  check('antes do chefe: o cartão abre e o chefe NÃO começa', !!card && ev('S.wave') === 1 && ev("DIFF.card&&DIFF.card.from") === 'boss');
  check('abrir o cartão não muda o save', s1 === s2);
  const adv = JSON.parse(ev('JSON.stringify(DIFF.card.adv)')), html = card ? card.innerHTML : '';
  check('título = texto do Sys.advice ("Faltam X de FC")', adv.text === raw.text && /^Faltam .+ de FC$/.test(adv.text) && html.includes(adv.text), adv.text + ' x ' + raw.text);
  check('até 3 ações, as primeiras do Sys.advice que têm tela, na ordem dele', adv.actions.length > 0 && adv.actions.length <= 3 && adv.actions.every((a, i, arr) => raw.actions.findIndex(x => x.id === a.id) >= 0 && (i === 0 || raw.actions.findIndex(x => x.id === a.id) > raw.actions.findIndex(x => x.id === arr[i - 1].id))), adv.actions.map(a => a.id).join(',') + ' de ' + raw.actions.map(a => a.id).join(','));
  check('cada ação mostra o ganho do módulo e a tela de destino', adv.actions.every((a, i) => html.includes('data-d="adv:' + i + '"') && a.gainText === raw.actions.find(x => x.id === a.id).gainText.replace(/\s+/g, ' ') && html.includes(a.gainText) && html.includes(a.route.lock ? 'Nv ' + a.route.lock : a.route.name)), JSON.stringify(adv.actions.map(a => [a.id, a.gainText, a.route])));
  check('nenhuma opção de compra ou invocação', adv.actions.every(a => !/buy|shop|summon|compr|invoc/i.test(a.id + ' ' + a.kind + ' ' + a.label)));
  check('zero emoji e zero estrela desenhada no cartão', !EMOJI.test(html.replace(/<[^>]*>/g, '')), (html.replace(/<[^>]*>/g, '').match(EMOJI) || [''])[0]);
  check('sem undefined/NaN', !/undefined|NaN|\[object/.test(html));
  check('botões "Agora não" e "Desafiar assim mesmo"', /data-d="x"/.test(html) && /data-d="go"/.test(html));
  const VIEW = { gear: 'gear', forge: 'forge', pet: 'pets', mount: 'mounts', titles: 'profile' };
  for (let i = 0; i < adv.actions.length; i++) { const a = adv.actions[i]; if (!D.reg.dfc) F('bossAskT=0; bossTap()');
    ev(`diffAct('adv:${i}')`); const v = ev('view');
    check('antes do chefe · ' + a.id + ' → ' + (a.route.lock ? 'aviso "abre no nível ' + a.route.lock + '"' : a.route.farm ? 'volta a lutar' : 'tela ' + VIEW[a.tab]), a.route.lock ? v === 'battle' && !!D.reg.dfc : a.route.farm ? v === 'battle' && !D.reg.dfc : v === VIEW[a.tab] && !D.reg.dfc, 'view=' + v);
    ev("if(view!=='battle') Screens.close(); view='battle'"); ev('diffClose()'); }
  F('bossAskT=0; bossTap()'); ev("diffAct('x')"); check('"Agora não" fecha e não desafia', !D.reg.dfc && ev('S.wave') === 1);
  F('bossTap()'); ev("diffAct('go')"); check('"Desafiar assim mesmo" entra no chefe', !D.reg.dfc && ev('S.wave') === 5);
  /* Derrota */
  G.start(25, 1); rich(G, 60); const s3 = ev('JSON.stringify(S)');
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); const lose = String(ev('RES.el&&RES.el.innerHTML') || ''), s4 = ev('JSON.stringify(S)');
  const ladv = JSON.parse(ev('JSON.stringify(DIFF.card&&DIFF.card.adv||null)'));
  check('Derrota: ações do Sys.advice na caixa de 150 px, no lugar dos caminhos fixos', /id="res_adv"[^>]*height:150px/.test(lose) && !/data-q="summon"/.test(lose) && !!ladv && ladv.actions.every((a, i) => lose.includes('data-q="adv:' + i + '"') && lose.includes(a.gainText)), lose.length + ' caracteres');
  check('Derrota: "Faltam X de FC" com a FC pedida da tabela', lose.includes(ev('fcTxt(fcNeed(25))')) && /Faltam <span[^>]*>[^<]+ de FC<\/span>/.test(lose));
  check('Derrota: abrir não muda o save', s3 === s4); check('Derrota: zero emoji, sem undefined/NaN', !EMOJI.test(lose.replace(/<[^>]*>/g, '')) && !/undefined|NaN|\[object/.test(lose.replace(/<style[\s\S]*?<\/style>/g, '')));
  check('Derrota: altura da tela igual à de hoje (mesmos 150 px)', (loseOff.match(/height:150px/g) || []).length === (lose.match(/height:150px/g) || []).length);
  for (let i = 0; ladv && i < ladv.actions.length; i++) { const a = ladv.actions[i]; if (!ev('B.res')) ev("resOpen('lose',{stage:S.stage},true)"); ev('RES.t=RES_LOSE_BTN+1'); ev(`resAct('adv:${i}')`); const v = ev('view'), open = !!ev('B.res');
    check('Derrota · ' + a.id + ' → ' + (a.route.lock ? 'aviso do nível, tela fica' : a.route.farm ? 'modo farm' : 'tela ' + VIEW[a.tab] + ' com o farm atrás'), a.route.lock ? open && v === 'battle' : a.route.farm ? !open && v === 'battle' && ev('S.farm') === true : !open && v === VIEW[a.tab] && ev('S.farm') === true, 'view=' + v + ' res=' + open);
    ev("if(B.res) resClose('farm'); if(view!=='battle') Screens.close(); view='battle'"); }
  /* tela trancada por nível e tela que não existe */
  G.start(25, 1); rich(G, 2); { const a = JSON.parse(ev('JSON.stringify(diffAdvice(fcNeed(25)).actions)')), lk = a.find(x => x.route.lock), rows = ev("diffRowsHtml(diffAdvice(fcNeed(25)),'data-d',null)");
    if (lk) { check('tela trancada por nível: a linha diz "abre no nível N" e o toque avisa', rows.includes(lk.route.name + ': abre no nível ' + lk.route.lock) && ev(`(function(){ DIFF.card={adv:diffAdvice(fcNeed(25)),from:'boss'}; view='battle'; return diffGo(${a.indexOf(lk)}); })()`) === 'lock' && ev('view') === 'battle', rows.slice(0, 200)); }
    else note('nível 2: o Sys.advice não devolveu ação de tela trancada (' + a.map(x => x.id).join(',') + '); a linha "abre no nível N" fica conferida só pela rota');
    check('rota trancada devolve o nível da liberação do MENU', ev("(function(){ const r=diffRoute('pet'); return !!r&&r.lock===fbLvU('pets')&&r.why==='Abre no nível '+r.lock; })()"), ev("JSON.stringify(diffRoute('pet'))"));
    check('tela desligada (painel) = a ação não entra na lista', ev("(function(){ const k=PANEL_ON.forge; PANEL_ON.forge=false; const r=diffRoute('forge'); PANEL_ON.forge=k; return r===null; })()") && ev("diffRoute('xyz')===null")); }
  /* larguras */
  G.start(25, 1); rich(G, 60);
  for (const [W, H] of [[288, 512], [360, 640], [390, 844]]) { const s = W / 390; const h = ev(`diffCardHtml(diffAdvice(fcNeed(25)),{s:${s},Hb:${H / s},feet:${0.758 * H / s},hs:150,top:132})`); widthChecks('cartão em ' + W + ' px', h, s, W);
    const f = +(h.match(/id="dfc_c"[^>]*scale\(([\d.]+)\)/) || [])[1]; check('cartão em ' + W + ' px: encolhe no máximo até 0,7 e nunca cresce', f >= 0.7 && f <= 1, String(f)); if (f < 1) note('cartão antes do chefe em ' + W + 'x' + H + ': encolhe para ' + f + ' para não cobrir o herói (conferir no navegador)'); }
  widthChecks('linhas da Derrota', ev("diffRowsHtml(diffAdvice(fcNeed(25)),'data-q',1.1)"), 1, 390);
  { const long = ev(`diffRowsHtml({actions:[{id:'x',label:diffTxt('Montaria Cavalo de Guerra Celestial 2★ (faltam 12 fragmentos)'),gainText:'+999,9 qua FC',route:{name:'Montarias'}}]},'data-d',null)`);
    check('texto longo: "2 estrelas" por extenso, linha com corte', /2 estrelas/.test(long) && !EMOJI.test(long) && /-webkit-line-clamp:2/.test(long)); }

  /* ======================= 5. CHEFE, COMUNS, FÚRIA ======================= */
  console.log('5. chefe, comuns e fúria (batalha de verdade, quadro a quadro)');
  const share = FILE.commons.shareOfBoss, KILL = FILE.boss.killSecAt100, SURV = FILE.boss.surviveSecAt100, FAT = FILE.boss.furyAtSec, FM = FILE.boss.furyDmgMult;
  G.start(1, 1);
  for (const s of STAGES) { const b = JSON.parse(ev(`JSON.stringify(diffBoss(${s},false))`)), e = JSON.parse(enemy(G, s, 'boss')), p = JSON.parse(ev(`JSON.stringify(diffBoss(${Math.max(1, s - 1)},false))`)), c = JSON.parse(enemy(G, s, 'e0')), c1 = JSON.parse(enemy(G, s, 'e1'));
    check('fase ' + s + ': chefe sai da FC pedida (k = pedida ÷ FC do herói)', e[3] === true && near(e[0], b.hp, 1e-9) && near(e[1], b.dmg, 1e-9) && near(b.k, FILE.recFc[s - 1] / ev('heroFC()'), 1e-9) && isFinite(e[0]) && e[0] > 0 && e[1] > 0, JSON.stringify(e));
    check('fase ' + s + ': comuns = ' + share + ' × vida e dano do chefe da fase anterior', near(c[0], p.hp * share, 1e-9) && near(c[1], p.dmg * share, 1e-9) && c1[0] === c[0] && c1[1] === c[1], JSON.stringify(c) + ' x ' + JSON.stringify([p.hp * share, p.dmg * share])); }
  { const st = JSON.parse(ev('JSON.stringify(heroStats())')), b = JSON.parse(ev('JSON.stringify(diffBoss(10,false))')), ref = ev(`Sys.fc.fcOfStats(Object.assign({},heroStats(),{atk:heroStats().atk*${b.k},hp:heroStats().hp*${b.k},hpNoPet:(heroStats().hpNoPet||heroStats().hp)*${b.k},def:heroStats().def*${b.k}}))`);
    check('herói de referência (ATQ, VIDA e DEF × k) tem a FC pedida pelo Sys.fc', near(ref, b.need, 0.01), ref + ' x ' + b.need);
    check('dano do chefe: depois da DEF, leva a VIDA de referência em surviveSecAt100', near(ev(`Sys.stats.hit({atk:${b.dmg},critRate:0,critDmg:0},1,${st.def * b.k},false).dmg`) * (SURV / 1.15), st.hp * b.k, 0.001)); }
  /* luta real só contra o chefe (sem as escoltas): herói com k × os atributos */
  async function duel(stage, kMul, atk0) { G.start(stage, 5); const st = JSON.parse(ev('JSON.stringify(heroStats())')), k = ev(`fcNeed(${stage})/heroFC()`) * kMul; G.scale = { st, k, atk0: !!atk0, set: false };
    ev("B.en=[]; B.toSpawn=['boss']; B.waveN=1; B.spawnT=0.1; SCREENS_ON.bossResult=false"); let t0 = null, tFury = null, res = null; const t = () => ev('B.t');
    let boss = null; await G.until(() => { const e = boss || ev('B.en[0]'); if (e && e.boss) boss = e; if (boss && boss.wasParked && t0 == null) t0 = t() - (boss.dft || 0); if (boss && boss.fury && tFury == null) tFury = t() - t0;
      if (boss && boss.dead) { res = 'kill'; return true; } if (ev('B.deadT') > 0) { res = 'dead'; return true; } return false; }, 200);
    const out = { res, sec: t0 != null ? t() - t0 : null, hpLeft: ev('B.hero.hp/B.hero.maxhp'), tFury }; G.scale = null; return out; }
  if (process.env.DIFF_REPEAT) { for (const s of [10, 35, 70]) { const o = []; for (let i = 0; i < +process.env.DIFF_REPEAT; i++) o.push((await duel(s, 1, false)).sec.toFixed(1)); console.log('fase ' + s + ': ' + o.join(' ')); } process.exit(0); }
  /* a sorte da luta (crítico de 12% no especial e na ultimate) espalha cada luta em uns ±15%: a regra dos 32 s é conferida na MÉDIA de 6 lutas */
  for (const s of [10, 35]) { const runs = []; for (let i = 0; i < 6; i++) runs.push(await duel(s, 1, false)); const mean = runs.reduce((x, r) => x + (r.sec || 0), 0) / runs.length, a = runs[0];
    check('fase ' + s + ': herói com exatamente a FC pedida mata o chefe em ' + KILL + ' s ±10% (média de 6 lutas) e vence todas', runs.every(r => r.res === 'kill') && near(mean, KILL, 0.10), runs.map(r => r.res + ' ' + (r.sec || 0).toFixed(1)).join(', '));
    note('fase ' + s + ' com 100% da FC: média ' + mean.toFixed(1) + ' s (' + runs.map(r => (r.sec || 0).toFixed(1)).join(' ') + '), vida que sobra ' + runs.map(r => Math.round(r.hpLeft * 100) + '%').join(' '));
    const b = await duel(s, 1, true); check('fase ' + s + ': sem bater, esse herói cairia em ~' + SURV + ' s (±12%)', b.res === 'dead' && near(b.sec, SURV, 0.12), JSON.stringify(b)); note('fase ' + s + ' com 100% da FC, sem bater: cai em ' + (b.sec || 0).toFixed(1) + ' s');
    const c = await duel(s, 0.7, false); check('fase ' + s + ': com 70% da FC não mata', c.res === 'dead', JSON.stringify(c)); note('fase ' + s + ' com 70% da FC: ' + c.res + ' em ' + (c.sec || 0).toFixed(1) + ' s');
    const d = await duel(s, 0.9, false); note('fase ' + s + ' com 90% da FC: ' + d.res + ' em ' + (d.sec || 0).toFixed(1) + ' s'); const e = await duel(s, 1.2, false); note('fase ' + s + ' com 120% da FC: ' + e.res + ' em ' + (e.sec || 0).toFixed(1) + ' s, vida que sobra ' + Math.round(e.hpLeft * 100) + '%'); }
  check('nenhuma exceção no laço da batalha', !G.frameErr.length, G.frameErr.slice(0, 3).join(' | '));
  /* fúria */
  G.start(10, 5); { ev("B.en=[mkEnemy(10,'boss')]; B.toSpawn=[]; B.en[0].wasParked=true; B.banner=null"); ev(`diffStep(${FAT - 0.5})`); const before = ev('B.en[0].fury||0'); ev('diffStep(0.6)'); const bn = JSON.parse(ev('JSON.stringify(B.banner||{})'));
    check('fúria: nada antes de furyAtSec; depois, dano × furyDmgMult (uma vez)', before === 0 && ev('B.en[0].fury') === FM, before + ' → ' + ev('B.en[0].fury'));
    check('fúria: aviso na tela sem emoji', /FÚRIA/.test(bn.txt || '') && bn.sub === 'Dano x' + FM && !EMOJI.test((bn.txt || '') + bn.sub), JSON.stringify(bn));
    check('fúria: o HUD avisa', /fúria/.test(JSON.parse(ev('JSON.stringify(diffHudInfo(heroFC(),10))')).text));
    const a = await duel(10, 1, true); check('fúria na luta real: entra aos ' + FAT + ' s de luta', a.tFury == null ? a.sec < FAT : near(a.tFury, FAT, 0.03), JSON.stringify(a)); }
  /* o resto do jogo não muda */
  G.start(10, 1); { ev('B.inst={}'); const e = JSON.parse(enemy(G, 10, 'boss')), t = JSON.parse(today(G, 10, 'boss')), c = JSON.parse(enemy(G, 10, 'e0')), tc = JSON.parse(today(G, 10, 'e0')); ev('B.inst=null');
    check('instância: inimigos de hoje, sem fúria', e[0] === t[0] && e[1] === t[1] && e[3] === false && c[0] === tc[0] && c[1] === tc[1], JSON.stringify(e)); }
  { const k = "JSON.stringify([Sys.tower&&Sys.tower.floorFC?[10,30,60].map(f=>Sys.tower.floorFC(f)):0, Sys.phases&&Sys.phases.fcRec?Sys.phases.fcRec(2,0,10):0, recFC(35), JSON.stringify(REC_FC), JSON.stringify(BAL)])"; const on = ev(k); ev('diffSet(false)'); const of = ev(k); ev('diffSet(true)');
    check('Torre, fases do Sys.phases, REC_FC e BAL iguais com a chave ligada ou desligada', on === of); }
  /* save antigo abaixo da parede: tem aviso */
  G.start(40, 1); { const msg = ev('diffDeadMsg()'), I = JSON.parse(ev('JSON.stringify(diffHudInfo(heroFC(),40))'));
    check('save com FC abaixo da pedida: HUD vermelho e aviso ao cair numa onda comum', I.tier === 2 && /^Derrotado: faltam .+ de FC\. Toque em Desafiar/.test(msg) && !EMOJI.test(msg), msg); }
  /* MEDIDAS que o dono/Sistemas precisam ver antes de ligar */
  { G.start(1, 1); note('jogador novo: FC ' + ev('heroFC()') + ' x FC pedida da fase 1 ' + ev('fcNeed(1)') + ' (' + Math.round(100 * ev('heroFC()/fcNeed(1)')) + '%)');
    const k0 = ev('S.kills'); await G.until(() => ev('S.kills') > k0 + 2 || ev('B.deadT') > 0, 120); note('jogador novo na fase 1, ondas comuns, 120 s: ' + (ev('S.kills') - k0) + ' abates' + (ev('B.deadT') > 0 ? ', herói caiu' : ''));
    for (const s of [10, 35]) { G.start(s, 1); const st = JSON.parse(ev('JSON.stringify(heroStats())')); G.scale = { st, k: ev(`fcNeed(${s})/heroFC()`), set: false }; const w0 = ev('S.wave'), t0 = ev('B.t'); const ok = await G.until(() => ev('S.wave') !== w0 || ev('B.deadT') > 0, 400);
      note('fase ' + s + ', herói com 100% da FC pedida, onda comum 1 (' + ev('B.waveN') + ' inimigos): ' + (ev('B.deadT') > 0 ? 'herói CAIU aos ' : ok ? 'onda vencida em ' : 'não terminou em ') + (ev('B.t') - t0).toFixed(0) + ' s, vida ' + Math.round(100 * ev('B.hero.hp/B.hero.maxhp')) + '%'); G.scale = null; }
    G.start(10, 5); const st = JSON.parse(ev('JSON.stringify(heroStats())')); G.scale = { st, k: ev('fcNeed(10)/heroFC()'), set: false }; ev('SCREENS_ON.bossResult=false'); const t0 = ev('B.t'); await G.until(() => ev('S.stage') > 10 || ev('B.deadT') > 0, 300);
    note('fase 10, onda do chefe INTEIRA (2 escoltas + chefe), herói com 100% da FC: ' + (ev('S.stage') > 10 ? 'venceu em ' : 'CAIU aos ') + (ev('B.t') - t0).toFixed(0) + ' s'); G.scale = null; }

  /* ======================= 6. DESLIGAR DE NOVO ======================= */
  console.log('6. desligada de novo = idêntico');
  ev('diffSet(false)'); G.start(1, 1);
  check('inimigos das fases 1, 10, 35 e 70 e FC pedida idênticos aos do começo', snapOff(G) === off0);
  check('save com pet filhote: FC idêntica à de hoje', ev('Sys.pet.DATA.v17.stageMult.on') === false && cubFc(G) === cub0, cubFc(G) + ' x ' + cub0); G.start(1, 1);
  check('módulos de volta: advice, teto de XP e estrela desligados', ev('Sys.advice.DATA.on') === false && ev('Sys.level.killCap(S,Sys.host).on') === false && ev('Sys.mount.DATA.starFlat.on') === false);
  G.start(5, 1);
  ev("SCREENS_ON.bossResult=true; resOpen('lose',{stage:S.stage},true)"); { const h = String(ev('RES.el.innerHTML')); let i = 0; while (i < h.length && h[i] === loseOff[i]) i++; check('Derrota idêntica à do começo', h === loseOff, 'difere em ' + i + ': ' + loseOff.slice(i - 60, i + 60) + ' ||| ' + h.slice(i - 60, i + 60)); } ev("resClose('farm')");
  F('diffHud(heroFC())'); check('HUD limpo', !D.reg.dfh && !D.reg.dfc);

  /* ======================= 7. ERAS 7-8 nas duas combinações ======================= */
  console.log('7. eras 7-8 (chave própria) × dificuldade');
  check('eras 7-8 desligadas + dificuldade ligada: 70 fases, última com a FC da tabela', ev('ERAS.length') === 7 && (ev('diffSet(true)'), ev('fcNeed(70)') === FILE.recFc[69]) && JSON.parse(enemy(G, 70, 'boss'))[3] === true); ev('diffSet(false)');
  const G9 = await game('?debug=1&fresh=1&skip=1&eras9=1'), e9 = G9.ev; G9.start(1, 1);
  check('eras 7-8 ligadas + dificuldade desligada: fases 75 e 90 com o inimigo de hoje', e9('ERAS.length') === 9 && [75, 90].every(s => KINDS.every(k => { const e = JSON.parse(enemy(G9, s, k)), t = JSON.parse(today(G9, s, k)); return e[0] === t[0] && e[1] === t[1] && e[3] === false; })) && e9('fcNeed(75)') === e9('recFC(75)'));
  e9('diffSet(true)');
  check('eras 7-8 ligadas + dificuldade ligada: fases 71-90 pela tabela, depois × afterLastGrowth', [71, 75, 80, 90].every(s => e9(`fcNeed(${s})`) === FILE.recFc[s - 1] && (() => { const e = JSON.parse(enemy(G9, s, 'boss')), c = JSON.parse(enemy(G9, s, 'e0')); return e[3] === true && isFinite(e[0]) && e[0] > 0 && isFinite(e[1]) && c[0] > 0 && c[0] < e[0]; })()) && e9(`fcNeed(${n + 1})`) === Math.round(FILE.recFc[n - 1] * g));
  check('eras 7-8: REC_FC das eras 7-8 intacto com a dificuldade ligada', e9('REC_FC.length') === 9 && e9('recFC(75)') > 0);
  e9('diffSet(false)');

  console.log('\n' + (total - fails) + '/' + total + ' verificações' + (fails ? ' · ' + fails + ' FALHA(S)' : ' · tudo certo') + ' · ' + notes.length + ' medidas');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('ERRO', e && e.stack || e); process.exit(1); });
