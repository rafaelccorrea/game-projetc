'use strict';
/* TESTE DA REGRA DO DONO: "Bem-vindo de volta" (QA, sem navegador). Rodar: node test/e2e/welcome.js [-v]
   REGRA: conta/save NOVO nunca abre o Bem-vindo de volta; ele só abre com TEMPO OFFLINE REAL (>= 120 s fora) e RECOMPENSA > 0.
   Sobe o jogo no sandbox (partida real, ?debug=1) com um save gravado e usa a mesma decisão de js/p_intro.js: PI.nav() a partir do Título
   (TituloV2B) escolhe 'Login' (sem nome = conta nova) ou 'BemVindo' (tem nome); PI.offline() devolve null/false sem ganho ou o resumo do ganho.
   Casos: 1) sem save · 2) conta recém-criada (tem nome, tut 99, sem tempo fora) · 3) 60 s fora · 4) 3 h fora (deve abrir, com ganho) ·
   5) 3 h fora MAS ainda no tutorial/criação (tut < 99) · 6) lastSeen no futuro · 7) onde nasce o tempo fora num save novo (AWAY/lastSeen).
   Sai com código 1 se algum caso REPROVAR (hoje o 2 e o 3 devem reprovar: o código mostra o Bem-vindo em TODA volta, com ou sem ganho). */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox');
let fail = 0; const out = []; const check = (name, ok, err) => { if (!ok) fail++; out.push((ok ? '  OK    ' : '  FALHA ') + name + (ok ? '' : ' — ' + err)); if (VERBOSE || !ok) console.log(out[out.length - 1]); };
const BASE = { gold: 100, gems: 30, stage: 5, wave: 1, best: 5, eraMax: 0, nextId: 3, tut: 99, welcome: true, kills: 40, hero: 'kael',
  inv: [{ id: 1, slot: 'weapon', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }, { id: 2, slot: 'armor', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }], eq: { weapon: 1, armor: 2 }, skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' } };
function game(save) {
  const storage = save ? { eras_proto_v2: JSON.stringify(save) } : {}; const G = boot({ runBoot: true, search: '?debug=1', storage, add() {} }); const ev = G.ev;
  /* decisão do Título: captura qual tela o PI.nav abriria, sem desenhar nada */
  const decide = () => { let shown = null; try { ev(`(function(){ window.__piShown=null; const sh=PIntro.show; PIntro.show=function(id){ window.__piShown=id; return true; }; PIntro.id="TituloV2B"; PIntro.nav(); PIntro.show=sh; })()`); shown = ev('window.__piShown'); } catch (e) { shown = 'ERRO ' + String(e.message).slice(0, 80); } return shown; };
  const offline = () => { try { ev("PIntro.off=null"); return ev("PIntro.offline()"); } catch (e) { return 'ERRO ' + String(e.message).slice(0, 80); } };
  return { G, ev, decide, offline };
}
const gain = o => !!o && typeof o === 'object' && ((+o.gold || 0) > 0);
const NOW = Date.now();
(async () => {
  { const g = game(null);
    check('1) sem save: conta NOVA vai para o Login (nunca Bem-vindo)', g.decide() === 'Login', 'abriu ' + g.decide());
    check('1) sem save: não há tempo fora (AWAY = 0) nem ganho offline', g.ev('typeof AWAY!=="undefined"?AWAY:-1') === 0 && !gain(g.offline()), 'AWAY ' + g.ev('AWAY') + ' ganho ' + JSON.stringify(g.offline())); }
  { const g = game(Object.assign({}, BASE, { name: 'Novo', lastSeen: NOW - 2000, realm: 's1' }));   /* conta recém-criada: acabou de gravar (2 s atrás) */
    const d = g.decide(), o = g.offline();
    check('2) conta recém-criada (tem nome, 2 s fora, sem ganho): NÃO abre o Bem-vindo', d !== 'BemVindo', 'abriu ' + d + ' com ganho ' + JSON.stringify(o) + ' — p_intro.js:151 manda para BemVindo em TODA volta com nome, mesmo sem ganho'); }
  { const g = game(Object.assign({}, BASE, { name: 'Volta60', lastSeen: NOW - 60 * 1000 }));
    const d = g.decide(), o = g.offline();
    check('3) 60 s fora (< 120 s, sem ganho): NÃO abre o Bem-vindo', d !== 'BemVindo' || gain(o), 'abriu ' + d + ' sem ganho (' + JSON.stringify(o) + ')'); }
  { const g = game(Object.assign({}, BASE, { name: 'Volta3h', lastSeen: NOW - 3 * 3600 * 1000 }));
    const d = g.decide(), o = g.offline();
    check('4) 3 h fora: abre o Bem-vindo', d === 'BemVindo', 'abriu ' + d);
    check('4) 3 h fora: o ganho offline é maior que zero (ouro > 0)', gain(o), 'ganho ' + JSON.stringify(o)); }
  { const g = game(Object.assign({}, BASE, { name: 'Tut', tut: 0, lastSeen: NOW - 3 * 3600 * 1000 }));
    const o = g.offline(); check('5) 3 h fora mas AINDA no tutorial (tut 0): sem ganho offline entregue', !gain(o), 'ganho ' + JSON.stringify(o)); }
  { const g = game(Object.assign({}, BASE, { name: 'Futuro', lastSeen: NOW + 3600 * 1000 }));
    const d = g.decide(), o = g.offline(); check('6) lastSeen no futuro (relógio mexido): NÃO abre o Bem-vindo e não dá ganho', d !== 'BemVindo' && !gain(o), 'abriu ' + d + ' ganho ' + JSON.stringify(o)); }
  /* 7) onde nasce o tempo fora: save novo não tem lastSeen; quem grava é save() (index.html), sem carimbo a cada abertura */
  { const g = game(null); const l0 = g.ev('S.lastSeen'); g.ev('save()'); const l1 = g.ev('S.lastSeen');
    check('7) save NOVO nasce sem lastSeen (AWAY 0); o primeiro save() carimba lastSeen = agora (a partir daí o tempo fora conta)', l0 == null && typeof l1 === 'number', 'lastSeen antes ' + l0 + ' depois ' + l1); }
  console.log('\n' + (fail ? fail + ' CASO(S) REPROVADO(S) (regra do dono não cumprida pelo código de hoje)' : 'REGRA DO BEM-VINDO: TODOS OS CASOS PASSARAM'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
