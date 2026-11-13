'use strict';
/* ERAS 7 E 8 JOGÁVEIS (js/eras9.js), SEM NAVEGADOR: carrega o jogo inteiro (sandbox.js) e roda a batalha quadro a quadro, com o código do próprio jogo.
     A. CHAVE DESLIGADA  — o jogo de 7 eras não muda (tabelas, skins, Sys.stats) e guarda os números das fases 1-90 para comparar.
     B. CHAVE LIGADA     — 9 eras, nomes dos chefes do dono num lugar só, arte de cada era em disco, números das eras 0-6 IGUAIS aos da chave desligada
                           e fases 71-90 com os mesmos inimigos de antes; depois JOGA: Senhor da era 6 → Troca de era → era 7 inteira → Senhor do Submundo →
                           Troca de era → era 8 inteira → Juiz Celestial → o jogo segue. Mapa das Eras e Códex desenham com as 9 eras.
     C. SAVE ANTIGO      — save de 7 eras parado na era 6 carrega igual e abre a era 7 jogando; save que já tinha passado da fase 70 fica na mesma fase,
                           com as eras liberadas e as gemas de cada uma, uma vez só; com a chave desligada nada muda.
   A chave do jogo (ERA9_KEY) pode estar desligada: o teste liga pelo atalho de conferência (?debug=1&eras9=1).
   Uso: node test/e2e/eras9.js [-v]. Sai com código 1 se algo falhar. */
const fs = require('fs'), path = require('path');
const VERBOSE = process.argv.includes('-v'), DT = 1 / 30;
const boot = require('./sandbox'), errStr = boot.errStr, ROOT = path.join(__dirname, '..', '..');
const ON = '?debug=1&fresh=1&skip=1&eras9=1', OFF = '?debug=1&fresh=1&skip=1';
let n = 0, fails = 0, group = '';
const check = (name, ok, err) => { n++; if (!ok) { fails++; console.log('  FALHA ' + group + ' · ' + name + (err ? ' → ' + err : '')); } else if (VERBOSE) console.log('  OK    ' + group + ' · ' + name); return !!ok; };
const has = p => fs.existsSync(path.join(ROOT, p));
const BAD = ['undefined', 'NaN', '[object Object]'];
const badIn = h => { if (typeof h !== 'string' || !h.trim()) return 'HTML vazio'; const t = h.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const b of BAD) { const i = t.indexOf(b); if (i >= 0) return 'contém "' + b + '": …' + t.slice(Math.max(0, i - 60), i + b.length + 30).replace(/\s+/g, ' ') + '…'; } return null; };
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;
const OLD = /Senhor Dem[oô]nio|Arcanjo Serafim|Dem[oô]nio Ceifador|\bArcanjo\b|Senhor do Fogo/;

/* jogo novo + laço manual (o mesmo corpo do loop() de js/battle.js, sem o desenho), como no flows.js */
async function newGame(opts) {
  const loadErr = [];
  const G = boot({ realFetch: true, ...(opts || {}), add: (g, nm, ok, e) => { if (!ok) loadErr.push(nm + ': ' + e); } });
  const { ev, inCtx } = G, X = G.sandbox;
  check('jogo carregou (' + (opts && opts.search || 'padrão') + ')', !loadErr.length, loadErr.slice(0, 4).join(' | '));
  for (let i = 0; i < 6; i++) await new Promise(r => setImmediate(r));   /* docs/balance.json (fetch por Promise) */
  G.strong = false; G.frameErr = []; G.frames = 0;
  /* herói forte de verdade: o jogo refaz o herói no meio do quadro (refreshHero ao subir de nível, equipar saque…) e na fase 70 um golpe só derruba o herói novo;
     por isso a força entra DEPOIS de cada refreshHero e ANTES de cada golpe recebido, além de a cada passo */
  X.__e2eStrong = () => { const h = ev('B.hero'); if (h && G.strong) { h.atk = 1e30; h.maxhp = 1e30; h.hp = 1e30; } };
  ev("(function(){ const r0=refreshHero, h0=heroHit; refreshHero=function(){ const r=r0.apply(this,arguments); __e2eStrong(); return r; }; heroHit=function(){ __e2eStrong(); return h0.apply(this,arguments); }; })()");
  X.__e2eFrame = dt => { const B = ev('B'); if (!B.paused) { const k = B.speed || 1; for (let i = 0; i < k; i++) { X.__e2eStrong();
      ev('step')(dt); if (typeof X.petStep === 'function') ev('petStep')(dt); } } if (typeof X.resTick === 'function') ev('resTick')(dt); ev('tickFx')(dt); };
  G.frame = async () => { try { inCtx(() => X.__e2eFrame(DT)); } catch (e) { const s = errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); }
    try { inCtx(() => G.advance(DT * 1000)); } catch (e) { const s = 'timer: ' + errStr(e); if (!G.frameErr.includes(s)) G.frameErr.push(s); }
    G.frames++; if (G.frames % 15 === 0) await new Promise(r => setImmediate(r)); };
  G.until = async (cond, secs) => { const k = Math.ceil(secs / DT); for (let i = 0; i < k; i++) { if (cond()) return true; await G.frame(); if (G.frameErr.length > 20) break; } return !!cond(); };
  G.opens = []; { const P = X.Panels, o0 = P.open.bind(P); P.open = (nm, o) => { const r = o0(nm, o); G.opens.push({ n: nm, o, r }); return r; }; }
  G.go = () => ev("(function(){ S.tut=99; S.welcome=true; S.name=S.name||'Kael'; S.hero=S.hero||'kael'; S.farm=false; B.paused=false; B.res=null; B.inst=null; view='battle'; startBattle(); return 1; })()");
  /* joga até a fase pedida fechando as telas como o jogador: "Continuar" na Vitória e "Começar a era" na Troca de era (que é vista até a folha final) */
  G.seen = { bosses: {}, lords: {}, labels: {}, eraHtml: {}, wins: 0 };
  G.playTo = async (stage, secs) => G.until(() => {
    for (const e of ev('B.en.filter(e=>e.boss).map(e=>({era:eraOf(S.stage),name:e.name,label:enemyLabel(e),lord:!!e.eraBoss,key:e.key}))')) { G.seen.bosses[e.era] = e.name; G.seen.labels[e.era] = e.label; if (e.lord) G.seen.lords[e.era] = e.key; }
    if (ev('!!(typeof PE!=="undefined"&&PE.open)')) { if (ev('PE.step') === 'final') { const o = ev('PE.o'); G.seen.eraHtml[o.to] = { html: ev('PE.el.innerHTML'), boss: o.boss, from: o.from }; try { inCtx(() => X.Panels.defs.era.close()); } catch (e) { G.frameErr.push('era.close: ' + errStr(e)); } }
      else if (ev('PE.step') === 'foe') G.seen['foe' + ev('PE.o.to')] = ev('PE.el.innerHTML'); return false; }
    if (ev('!!(B.res&&B.res.mode==="win")')) { G.seen.wins++; G.seen.lastWin = ev('typeof RES!=="undefined"&&RES.el?RES.el.innerHTML:""'); try { inCtx(() => X.resClose('next')); } catch (e) { G.frameErr.push('resClose: ' + errStr(e)); } return false; }
    return ev('S.stage') >= stage && !ev('B.res'); }, secs);
  return G;
}
/* vida, dano e ouro de comum e chefe + FC recomendada, por fase (mkEnemy tem sorteio só em campos que não entram aqui) */
const curve = (G, a, b) => G.ev(`(function(){ const o=[]; for(let s=${a};s<=${b};s++){ const c=mkEnemy(s,'e0'), k=mkEnemy(s,'boss'); o.push([s,c.maxhp,c.dmg,c.gold,k.maxhp,k.dmg,k.gold,eraOf(s)<REC_FC.length?recFC(s):0]); } return JSON.stringify(o); })()`);

(async () => {
  /* ---------------- A. chave desligada ---------------- */
  group = 'A desligada';
  const A = await newGame({ search: OFF }), a = A.ev;
  const keyOn = a('ERA9_KEY'), missing = a('JSON.stringify(ERA9_MISSING)'), miss = JSON.parse(missing).filter(f => !has(f));
  check('chave ERA9_KEY ligada só com a arte obrigatória em disco', !keyOn || !miss.length, 'ERA9_KEY=true mas faltam: ' + miss.join(', '));
  if (!keyOn && !miss.length) console.log('  AVISO: toda a arte de ERA9_MISSING já está em disco: a chave ERA9_KEY (js/eras9.js) pode ser ligada.');
  if (!keyOn) {
    check('7 eras, ERA9 desligado', a('ERAS.length') === 7 && a('ERA9.on') === false, 'ERAS ' + a('ERAS.length') + ' on ' + a('ERA9.on'));
    check('Sys.stats sem a curva de 9 eras (maxEra 6, raridade máxima 4)', a('Sys.stats.DATA.maxEra') === 6 && a('Sys.stats.maxR()') === 4);
    check('skins: 70 de era + 6 do passe', a('SKINS.length') === 76, String(a('SKINS.length')));
    check('eraMult e FC recomendada com 7 valores', a('BAL.eraMult.length') === 7 && a('REC_FC.length') === 7, a('BAL.eraMult.length') + '/' + a('REC_FC.length'));
    check('fase 75 continua na era 6 (como antes)', a('eraOf(75)') === 6);
  }
  check('nomes dos chefes num lugar só: ERA9_BOSS', a('ERA9_BOSS[7]') === 'Senhor do Submundo' && a('ERA9_BOSS[8]') === 'Juiz Celestial', a('JSON.stringify(ERA9_BOSS)'));
  const cut = s => JSON.stringify(JSON.parse(s).map(r => r.slice(0, 7)));   /* sem a FC recomendada (com 7 eras ela não existe depois da fase 70) */
  const base70 = keyOn ? null : curve(A, 1, 70), base90 = keyOn ? null : cut(curve(A, 71, 90));

  /* ---------------- B. chave ligada ---------------- */
  group = 'B ligada';
  const B = await newGame({ search: ON }), b = B.ev;
  check('9 eras: Submundo e Celestial', b('ERAS.length') === 9 && b('ERA9.on') === true && b('ERAS[7].n') === 'Submundo' && b('ERAS[8].n') === 'Celestial', 'ERAS ' + b('ERAS.length') + ' ' + b('ERA9.why'));
  if (b('ERAS.length') !== 9) { console.log('eras 7-8 não ligaram: ' + b('ERA9.why')); process.exit(1); }
  check('Sys.stats com as eras 7-8 (maxEra 8)', b('Sys.stats.DATA.maxEra') === 8);
  check('nível máximo 120 pelo setCap120 (níveis 1-100 idênticos; nunca o setV9) e Sys.phases NÃO ligado (curva das eras 0-6 intacta)', b('Sys.level.DATA.maxLevel') === 120 &&!(b('!!(Sys.phases&&Sys.phases.DATA.on)')));
  check('skins: 90 de era + 6 do passe, as do passe no fim', b('SKINS.length') === 96 && b('SKINS.slice(-6).every(s=>s.pass)') && b("!!SKIN('w74')&&!!SKIN('a80')"), String(b('SKINS.length')));
  check('eraOf: fase 70 = era 6, 71 = era 7, 81 = era 8, 91 em diante = era 8', b('eraOf(70)') === 6 && b('eraOf(71)') === 7 && b('eraOf(81)') === 8 && b('eraOf(91)') === 8 && b('eraOf(500)') === 8);
  if (base70) {
    check('eras 0-6: vida, dano, ouro e FC recomendada das fases 1-70 IGUAIS aos da chave desligada', curve(B, 1, 70) === base70, 'a curva das eras 0-6 mudou');
    check('fases 71-90: mesmos inimigos de antes (eram a era 6 sem fim)', cut(curve(B, 71, 90)) === base90, 'vida/dano/ouro das fases 71-90 mudaram');
  }
  check('eraMult das eras 7-8 = o da era 6 (sem degrau novo)', b('BAL.eraMult.length') === 9 && b('BAL.eraMult[7]===BAL.eraMult[6]&&BAL.eraMult[8]===BAL.eraMult[6]'), b('JSON.stringify(BAL.eraMult)'));
  check('FC recomendada: 9 valores, crescente, eras 0-6 intactas', b('REC_FC.length') === 9 && b('REC_FC.every((v,i)=>v>0&&(i===0||v>REC_FC[i-1]))') && (!base70 || b('JSON.stringify(REC_FC.slice(0,7))') === a('JSON.stringify(REC_FC)')), b('JSON.stringify(REC_FC)'));
  check('FC recomendada sem salto na virada 70→71 e 80→81', b('recFC(71)>recFC(70)&&recFC(81)>recFC(80)&&recFC(90)>recFC(89)&&isFinite(recFC(120))'), [70, 71, 80, 81, 90].map(s => b('recFC(' + s + ')')).join(' '));
  /* nomes */
  for (const e of [7, 8]) { const nm = e === 7 ? 'Senhor do Submundo' : 'Juiz Celestial';
    check('era ' + e + ': o chefe da tabela é "' + nm + '"', b('ERAS[' + e + '].en[ERAS[' + e + '].en.length-1].n') === nm);
    check('era ' + e + ': chefe de fase e Senhor da Era com o nome do dono, sem prefixo', b("mkEnemy(" + (e * 10 + 3) + ",'boss').name") === nm && b("mkEnemy(" + (e * 10 + 10) + ",'boss').name") === nm && b("mkEnemy(" + (e * 10 + 10) + ",'boss').eraBoss") === true, b("mkEnemy(" + (e * 10 + 3) + ",'boss').name"));
    check('era ' + e + ': nome pela chave do inimigo (batalha, Vitória, Códex)', b("era9Name('era" + e + "_boss')") === nm && b("era9Name('era" + e + "_e0')") === null && b("resBossName({key:'era" + e + "_boss',kindName:'x'})") === nm);
    const txt = b('JSON.stringify(ERAS[' + e + '])'); check('era ' + e + ': tabela sem emoji e sem nome antigo de chefe', !EMOJI.test(txt) && !/"n":"(Dem[oô]nio Ceifador|Arcanjo)"/.test(txt));
    check('era ' + e + ': 5 armas e 5 coletes com nome; item novo tem nome nos 7 espaços', b('ERAS[' + e + '].w.length') === 5 && b('ERAS[' + e + '].a.length') === 5 && b("SLOTS7.every(s=>[0,2,4].every(r=>{ const n=iname({slot:s,e:" + e + ",r}); return typeof n==='string'&&n.length>2&&!/undefined/.test(n); }))"));
    /* arte em disco */
    const files = ['assets/bg/' + b('bgPath(' + e + ')').replace('assets/bg/', ''), 'assets/bg/v2/era' + e + '/meta.json', 'assets/anim/ult/era' + e + '_ult.png', 'assets/anim/ult/era' + e + '_ult.json', 'assets/map/era' + e + '.jpg', 'assets/map/clock_shards/shard_' + e + '.png']
      .concat(['t0', 'raro', 't1', 'mitico', 't2'].map(k => 'assets/weapons/era' + e + '_' + k + '.png'), [0, 1, 2].map(t => 'assets/hero/era' + e + '_t' + t + '.png'), ['weapon', 'vest', 'helmet', 'gloves', 'boots', 'necklace', 'wings'].map(s => 'assets/icons/slots/era' + e + '_' + s + '.png'),
        ['e0', 'e1', 'boss'].map(k => 'assets/enemies/era' + e + '_' + k + '.png'), ['e0_run', 'boss_die'].map(k => 'assets/anim/hyb/enemy/era' + e + '_' + k + '.json'));
    const gone = files.filter(f => !has(f)); check('era ' + e + ': ' + files.length + ' arquivos de arte que a era usa estão em disco', !gone.length, gone.join(', '));
    const wm = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/weapons/meta.json'), 'utf8')); check('era ' + e + ': as 5 armas têm ponto de pega no meta', ['t0', 'raro', 't1', 'mitico', 't2'].every(k => !!wm['era' + e + '_' + k]));
    check('era ' + e + ': arma na mão = a do item equipado (skin w' + e + 'r, imagem era' + e + ')', b("(function(){ const it={id:9001,slot:'weapon',e:" + e + ",r:3,lvl:1,gold:0,subs:[]}; S.inv.push(it); const o=S.eq.weapon; S.eq.weapon=9001; const w=heroLook().weapon, k=wKey(w); S.eq.weapon=o; S.inv.pop(); return w.e+'|'+k; })()") === e + '|era' + e + '_mitico');
    check('era ' + e + ': ultimate da arma é a folha da era, com nome', b("(function(){ const P=ultPlan({slot:'weapon',e:" + e + ",r:2,lvl:1}," + e + ",true); return (P&&P.sheet)+'|'+SKN[" + e + "].join('/'); })()").indexOf('assets/anim/ult/era' + e + '_ult|') === 0 && b('!!FX_ART.ult[' + e + ']&&S2HITS[' + e + '].length>0&&S2DUR[' + e + ']>0&&!!ULTCOL[' + e + ']'));
    check('era ' + e + ': item da era tem atributos próprios (acima da era ' + (e - 1) + ')', b("Sys.stats.mainOf({slot:'weapon',e:" + e + ",r:2,lvl:1},1,0).atk>Sys.stats.mainOf({slot:'weapon',e:" + (e - 1) + ",r:2,lvl:1},1,0).atk"));
  }
  const miss2 = JSON.parse(b('JSON.stringify(ERA9_MISSING)')).filter(f => !has(f));
  console.log('  arte obrigatória que falta (ERA9_MISSING): ' + (miss2.length ? miss2.join(', ') : 'nenhuma'));

  /* ---- joga: era 6 (Senhor) → era 7 inteira → era 8 inteira → depois do fim ---- */
  group = 'B jogo';
  b("(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.stage=70; S.wave=5; S.best=70; S.eraMax=6; S.gems=1000; return 1; })()"); B.go(); b('B.speed=4');
  B.strong = true; const inv0 = b('S.inv.length'), kills0 = b('S.kills');
  let ok = await B.playTo(71, 400);
  check('Senhor da era 6 vencido: fase 71, era 7 liberada (+30 gemas da era e +10 da fase, fora as do saque)', ok && b('S.stage') === 71 && b('S.eraMax') === 7 && b('eraOf(S.stage)') === 7 && b('S.gems') >= 1040 && b('S.gems') <= 1060, 'stage ' + b('S.stage') + ' eraMax ' + b('S.eraMax') + ' gemas ' + b('S.gems') + ' res ' + JSON.stringify(b('B.res')));
  const t7 = B.seen.eraHtml[7];
  check('Troca de era 6→7 abriu depois da Vitória e chegou a "Começar a era"', !!t7 && t7.from === 6 && /data-e="start"/.test(t7.html), 'abertos: ' + B.opens.map(x => x.n).join(','));
  if (t7) { const bad = badIn(t7.html); check('Troca de era 6→7: "ERA 8 · SUBMUNDO", sem undefined/NaN/emoji', !bad && /SUBMUNDO/.test(t7.html) && !EMOJI.test(t7.html), bad || t7.html.replace(/<[^>]+>/g, ' ').slice(0, 200)); }
  if (B.seen.foe7) check('Troca de era 6→7: "Novos inimigos" cita os comuns e o Senhor do Submundo uma vez só', /Diabrete e Cão Infernal e o Senhor do Submundo/.test(B.seen.foe7.replace(/<[^>]+>/g, ' ')) , B.seen.foe7.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 220));
  ok = await B.playTo(81, 2400);
  check('era 7 jogada inteira (fases 71-80): fase 81, era 8 liberada', ok && b('S.stage') === 81 && b('S.eraMax') === 8, 'stage ' + b('S.stage') + ' onda ' + b('S.wave') + ' eraMax ' + b('S.eraMax') + ' res ' + JSON.stringify(b('B.res')) + ' erros ' + B.frameErr.slice(0, 2).join(' | '));
  check('era 7: chefe "Senhor do Submundo" na batalha (nome e rótulo) e Senhor da Era na fase 80', B.seen.bosses[7] === 'Senhor do Submundo' && B.seen.labels[7] === 'Senhor do Submundo' && B.seen.lords[7] === 'era7_boss', JSON.stringify(B.seen.bosses) + JSON.stringify(B.seen.labels) + JSON.stringify(B.seen.lords));
  const t8 = B.seen.eraHtml[8];
  check('Troca de era 7→8: chefe vencido "Senhor do Submundo", "ERA 9 · CELESTIAL", sem undefined', !!t8 && t8.from === 7 && t8.boss === 'Senhor do Submundo' && /CELESTIAL/.test(t8.html) && !badIn(t8.html), t8 ? (badIn(t8.html) || t8.boss) : 'não abriu');
  ok = await B.playTo(91, 2400);
  check('era 8 jogada inteira (fases 81-90): Juiz Celestial vencido, fase 91', ok && b('S.stage') === 91 && b('S.eraMax') === 8 && b('eraOf(S.stage)') === 8, 'stage ' + b('S.stage') + ' onda ' + b('S.wave') + ' res ' + JSON.stringify(b('B.res')) + ' erros ' + B.frameErr.slice(0, 2).join(' | '));
  check('era 8: chefe "Juiz Celestial" na batalha e Senhor da Era na fase 90', B.seen.bosses[8] === 'Juiz Celestial' && B.seen.labels[8] === 'Juiz Celestial' && B.seen.lords[8] === 'era8_boss', JSON.stringify(B.seen.bosses) + JSON.stringify(B.seen.lords));
  check('depois do Juiz Celestial NÃO abre Troca de era (não existe era 9)', B.opens.filter(x => x.n === 'era').length === 2 && !B.seen.eraHtml[9], B.opens.filter(x => x.n === 'era').map(x => x.o && x.o.to).join(','));
  if (B.seen.lastWin) { const bad = badIn(B.seen.lastWin); check('Vitória do Juiz Celestial: tela sem undefined/NaN e com o nome do chefe', !bad && /Juiz Celestial/.test(B.seen.lastWin), bad || B.seen.lastWin.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 200)); }
  check('21 vitórias de chefe de fase (70 a 90), todas com a tela de Vitória', B.seen.wins === 21, String(B.seen.wins));
  ok = await B.playTo(92, 400);
  check('o jogo segue depois do fim (fase 92, ainda na era 8, sem tela presa)', ok && b('eraOf(S.stage)') === 8 && !b('B.res'), 'stage ' + b('S.stage'));
  check('nenhuma exceção no laço da batalha (' + B.frames + ' quadros)', !B.frameErr.length, B.frameErr.slice(0, 5).join(' | '));
  const errs = B.consoleErrs.filter(x => !/fetch|404|Failed to|preload|imagem/i.test(x)); check('nenhum erro do jogo no console durante as eras 7-8', !errs.length, errs.slice(0, 4).join(' | '));
  check('abates contados e saque entregue nas eras 7-8', b('S.kills') > kills0 + 300 && b('S.inv.length') >= inv0, 'abates ' + (b('S.kills') - kills0) + ' mochila ' + inv0 + '→' + b('S.inv.length'));
  const drop = JSON.parse(b("JSON.stringify(S.inv.filter(i=>i.e>=7).map(i=>({slot:i.slot,e:i.e,r:i.r,n:iname(i),ic:slotIcon(i.slot,Number.isInteger(i.look)?i.look:i.e)})))"));
  check('caíram itens das eras 7-8 (' + drop.length + '), todos com nome, raridade até Lendário e ícone em disco', drop.length > 0 && drop.every(i => i.r >= 0 && i.r <= 4 && i.e <= 8 && typeof i.n === 'string' && i.n.length > 2 && !/undefined/.test(i.n) && has(i.ic.split('?')[0])), JSON.stringify(drop.filter(i => !(i.r <= 4 && has(i.ic.split('?')[0]))).slice(0, 3)));
  check('nenhum item acima da era 8 nem com raridade fora da tabela', b('S.inv.every(i=>i.e>=0&&i.e<=8&&i.r>=0&&i.r<RAR.length)'));
  /* telas com as 9 eras */
  group = 'B telas';
  for (const p of ['map', 'codex']) { let html = '', er = ''; try { B.inCtx(() => { B.sandbox.Panels.enable(p); B.V.innerHTML = ''; const d = B.sandbox.Panels.defs[p]; if (d.onOpen) d.onOpen({}); d.render(); }); B.flush(); html = B.V.innerHTML; } catch (e) { er = errStr(e); }
    const bad = er || badIn(html); check('painel ' + p + ' desenha com o save na era 8', !bad, bad);
    check('painel ' + p + ': sem nome antigo de chefe', !OLD.test(html.replace(/Manto do Arcanjo|Juízo do Arcanjo|do Arcanjo/g, '')), (OLD.exec(html) || [''])[0]); }
  { let html = ''; try { b("XM.layer='world'; XM.sel=7; Panels.defs.map.render(); 1"); html = B.V.innerHTML; b('XM.sel=8; Panels.defs.map.render(); 1'); html += B.V.innerHTML; b('XM.sel=-1'); } catch (e) { html = 'ERRO ' + errStr(e); }
    check('Mapa das Eras: cartões das eras 7 e 8 com "Senhor do Submundo" e "Juiz Celestial"', /Senhor do Submundo/.test(html) && /Juiz Celestial/.test(html) && !badIn(html) && !OLD.test(html), badIn(html) || (OLD.exec(html) || ['nome não aparece'])[0]); }

  /* ---------------- C. save antigo ---------------- */
  group = 'C save antigo';
  /* save de 7 eras feito pelo próprio jogo com a chave desligada: itens, skins e progresso de quem está na era 6 */
  const mk = (stage, wave) => a(`(function(){ __e2eReplace(JSON.parse(__e2eBase)); S.tut=99; S.welcome=true; S.name='Kael'; S.hero='kael'; S.gold=123456; S.gems=777; S.kills=4321; S.stage=${stage}; S.wave=${wave}; S.best=${stage}; S.eraMax=6;
    const sl=SLOTS7.filter(s=>s!=='wing'); for(let i=0;i<12;i++) addItemToBag({slot:sl[i%sl.length],r:i%5,e:4+(i%3)}); S.skins.push('w63','a62'); try{ statsChanged(); }catch(e){} delete S.era9; return JSON.stringify(S); })()`);
  const KEY = a('SAVE_KEY'), old68 = mk(68, 3), old85 = mk(85, 2), LOADON = '?debug=1&skip=1&eras9=1', LOADOFF = '?debug=1&skip=1';
  const diff = (x, y, p, out) => { out = out || []; if (JSON.stringify(x) === JSON.stringify(y)) return out; if (x && y && typeof x === 'object' && typeof y === 'object') { for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) diff(x[k], y[k], p + '.' + k, out); } else out.push(p + ': ' + JSON.stringify(x) + ' → ' + JSON.stringify(y)); return out; };
  const strip = s => { const o = JSON.parse(s); delete o.era9; delete o.lastSeen; return JSON.stringify(o).replace(/:1[0-9]{12}(?![0-9])/g, ':0'); };   /* fora a marca era9 e as horas (ex.: hora em que o título foi liberado na carga) */
  { const C0 = await newGame({ search: LOADOFF, storage: { [KEY]: old68 } }), C = await newGame({ search: LOADON, storage: { [KEY]: old68 } }), c = C.ev;
    check('save na fase 68 (era 6) carrega com as 9 eras', c('ERAS.length') === 9 && c('S.stage') === 68 && c('S.eraMax') === 6 && c('S.gems') === 777 && c('S.gold') === 123456 && c('S.kills') === 4321, 'stage ' + c('S.stage') + ' eraMax ' + c('S.eraMax'));
    check('save na fase 68: nada perdido nem mudado (igual ao carregado com a chave desligada, fora a marca era9)', strip(c('JSON.stringify(S)')) === strip(C0.ev('JSON.stringify(S)')) && c('S.era9') === 1 && c('ERA9.migrated') === null, diff(JSON.parse(strip(C0.ev('JSON.stringify(S)'))), JSON.parse(strip(c('JSON.stringify(S)'))), 'S').slice(0, 6).join(' | '));
    check('save na fase 68: itens, skins e equipamento do save estão lá', c('S.inv.length') === JSON.parse(old68).inv.length && c("S.skins.includes('w63')&&S.skins.includes('a62')") && c('JSON.stringify(S.eq)') === JSON.stringify(JSON.parse(old68).eq));
    C.go(); c('S.stage=70; S.wave=5; S.best=70; B.speed=4; startBattle(); 1'); C.strong = true; const g0 = c('S.gems');
    const ok2 = await C.playTo(72, 900);
    check('save antigo avança: vence o Senhor da era 6, vê a Troca de era e joga a era 7 (fase 72)', ok2 && c('S.eraMax') === 7 && !!C.seen.eraHtml[7] && c('S.gems') >= g0 + 50, 'stage ' + c('S.stage') + ' eraMax ' + c('S.eraMax') + ' gemas ' + g0 + '→' + c('S.gems') + ' ' + C.frameErr.slice(0, 2).join(' | '));
    check('save antigo: nenhuma exceção jogando', !C.frameErr.length, C.frameErr.slice(0, 4).join(' | ')); }
  { const C0 = await newGame({ search: LOADOFF, storage: { [KEY]: old85 } }), c0 = C0.ev;
    check('chave desligada: save na fase 85 fica como sempre (era 6, eraMax 6, sem gemas a mais)', c0('ERAS.length') === 7 && c0('S.stage') === 85 && c0('S.eraMax') === 6 && c0('eraOf(S.stage)') === 6 && c0('S.gems') === 777 && c0('S.era9') === undefined);
    const st = { [KEY]: old85 }, C = await newGame({ search: LOADON, storage: st }), c = C.ev;
    check('save na fase 85: fica na fase 85 (agora era 8), recorde mantido, eras 7 e 8 liberadas, +60 gemas', c('S.stage') === 85 && c('S.best') === 85 && c('S.wave') === 2 && c('S.eraMax') === 8 && c('eraOf(S.stage)') === 8 && c('S.gems') === 837 && c('JSON.stringify(ERA9.migrated)') === '{"from":6,"to":8,"gems":60}', 'stage ' + c('S.stage') + ' eraMax ' + c('S.eraMax') + ' gemas ' + c('S.gems'));
    { const x = JSON.parse(strip(c('JSON.stringify(S)'))), y = JSON.parse(strip(c0('JSON.stringify(S)'))); x.eraMax = y.eraMax; x.gems = y.gems; check('save na fase 85: o resto do save é idêntico (itens, ouro, abates, skins)', JSON.stringify(x) === JSON.stringify(y), diff(y, x, 'S').slice(0, 6).join(' | ')); }
    c('save()'); const saved = C.sandbox.localStorage.getItem(KEY); check('o jogo grava o save convertido (marca era9)', !!saved && JSON.parse(saved).era9 === 1 && JSON.parse(saved).eraMax === 8);
    const again = await newGame({ search: LOADON, storage: { [KEY]: saved || c('JSON.stringify(S)') } }), g = again.ev;
    check('carregar de novo NÃO dá as gemas outra vez', g('S.gems') === 837 && g('S.eraMax') === 8 && g('ERA9.migrated') === null, 'gemas ' + g('S.gems'));
    const back = await newGame({ search: LOADOFF, storage: { [KEY]: g('JSON.stringify(S)') } });
    check('save que já entrou nas eras 7-8 continua nelas com a chave desligada (nada quebra, nada se perde)', back.ev('ERAS.length') === 9 && back.ev('S.eraMax') === 8 && back.ev('S.stage') === 85 && back.ev('eraOf(S.stage)') === 8);
    C.go(); c('B.speed=4'); C.strong = true; const ok3 = await C.playTo(86, 600);
    check('save na fase 85 segue jogando na era 8 (fase 86, chefe Juiz Celestial)', ok3 && C.seen.bosses[8] === 'Juiz Celestial' && !C.frameErr.length, 'stage ' + c('S.stage') + ' ' + C.frameErr.slice(0, 3).join(' | ')); }

  console.log(fails ? '\n' + fails + ' de ' + n + ' verificações falharam (eras 7-8 jogáveis)' : '\nERAS 7 E 8 JOGÁVEIS OK (' + n + ' verificações)');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.log('ERRO no teste: ' + (e && e.stack || e)); process.exit(1); });
