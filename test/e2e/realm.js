'use strict';
/* TESTE DOS SERVIDORES (REALMS) — QA, sem navegador. Rodar: node test/e2e/realm.js [-v]
   Sobe o jogo no sandbox do e2e (partida real, ?debug=1) com um localStorage já preparado e confere a separação de saves por servidor (index.html a7f3431):
   (a) sem 'eon_realm': chave de hoje 'eras_proto_v2', o save antigo (sem campo realm) carrega igual e ganha só o carimbo realm = 's1'
   (b) 'eon_realm' = 's2': lê e grava só em 'eras_proto_v2@s2'; o save de 'eras_proto_v2' (isca) NUNCA é alterado nem apagado
   (c) save com S.realm = 's1' posto à mão na chave do s2: não é carregado, as gravações ficam bloqueadas e a chave continua como estava
   (d) valores inválidos de 'eon_realm' ('S2', 's', 's1000', 's2;', '../x', '') caem em s1
   (e) Modo dono em s2: 'eras_owner_v1@s2'; em s1: 'eras_owner_v1'
   (f) window.Realm.key/id/set; trocar de servidor grava o atual, muda 'eon_realm' e bloqueia gravações
   (g) PONTOS QUE USAM SAVE_KEY (revisão por leitura virou verificação): importar um código de OUTRO servidor, o ownerOk do Modo dono e o "Apagar tudo"
   Sai com código 1 se algum reprovar. As verificações marcadas "ACHADO" mostram defeitos reais do código atual. */
const VERBOSE = process.argv.includes('-v');
const boot = require('./sandbox'), errStr = boot.errStr;
let fail = 0, achados = 0; const check = (name, ok, err, achado) => { if (ok) { if (VERBOSE) console.log('  OK    ' + name); return; } if (achado) achados++; else fail++; console.log((achado ? '  ACHADO ' : '  FALHA  ') + name + (err ? ' — ' + err : '')); };
const OLD = { gold: 1234, gems: 77, stage: 9, wave: 2, best: 9, eraMax: 0, nextId: 3, name: 'Velho', hero: 'kael', tut: 99, welcome: true, kills: 5,
  inv: [{ id: 1, slot: 'weapon', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }, { id: 2, slot: 'armor', r: 0, e: 0, lvl: 1, gold: 0, subs: [] }], eq: { weapon: 1, armor: 2 }, skins: ['w00', 'a00'], skinEq: { weapon: 'w00', armor: 'a00' } };
const CANARY = JSON.stringify(Object.assign({}, OLD, { gold: 424242, name: 'ISCA-S1', realm: 's1' }));
const up = (o, k, v) => Object.assign({}, o, { [k]: v });
function game(storage, search) {
  const G = boot({ runBoot: true, search: search || '?debug=1', storage, add() {} }); const ev = G.ev, ls = G.sandbox.localStorage;
  const keys = () => ['eras_proto_v2', 'eras_proto_v2@s2', 'eras_owner_v1', 'eras_owner_v1@s2'].filter(k => ls.getItem(k) != null);
  return { G, ev, ls, keys, key: () => ev('SAVE_KEY'), realm: () => ev('REALM'), save: () => { try { ev('save()'); } catch (e) {} } };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
(async () => {
  /* (a) sem eon_realm */
  { const g = game({ eras_proto_v2: JSON.stringify(OLD) });
    check('(a) sem eon_realm: REALM = s1 e SAVE_KEY = eras_proto_v2', g.realm() === 's1' && g.key() === 'eras_proto_v2', g.realm() + ' / ' + g.key());
    check('(a) o save antigo carregou igual (ouro, gemas, fase, nome, itens)', g.ev('S.gold') === 1234 && g.ev('S.gems') === 77 && g.ev('S.stage') === 9 && g.ev('S.name') === 'Velho' && g.ev('S.inv.length') >= 2, 'ouro ' + g.ev('S.gold') + ' nome ' + g.ev('S.name'));
    check('(a) o save antigo recebe só o carimbo realm = s1 na memória', g.ev('S.realm') === 's1', String(g.ev('S.realm')));
    g.save(); const o = JSON.parse(g.ls.getItem('eras_proto_v2'));
    check('(a) depois de save(): mesma chave, mesmos dados (+ realm s1), nenhuma chave nova', o.gold === 1234 && o.name === 'Velho' && o.realm === 's1' && same(g.keys(), ['eras_proto_v2']), 'chaves ' + g.keys().join(',') + ' ouro ' + o.gold);
    check('(a) sem migração: o jogo não criou chave @s1 nem @algo', !g.ls.getItem('eras_proto_v2@s1'), ''); }
  /* (b) s2 */
  { const g = game({ eon_realm: 's2', eras_proto_v2: CANARY }); g.ev('S.gold=777'); g.save();
    check('(b) eon_realm = s2: SAVE_KEY = eras_proto_v2@s2', g.key() === 'eras_proto_v2@s2' && g.realm() === 's2', g.key());
    check('(b) save novo do s2 gravado só em eras_proto_v2@s2, com realm s2', g.ls.getItem('eras_proto_v2@s2') && JSON.parse(g.ls.getItem('eras_proto_v2@s2')).realm === 's2' && JSON.parse(g.ls.getItem('eras_proto_v2@s2')).gold === 777, g.keys().join(','));
    check('(b) a isca em eras_proto_v2 NÃO foi alterada nem apagada (byte a byte)', g.ls.getItem('eras_proto_v2') === CANARY, 'mudou: ' + String(g.ls.getItem('eras_proto_v2')).slice(0, 80));
    check('(b) o s2 não herdou os dados do s1 (ouro da isca não aparece)', g.ev('S.gold') !== 424242 && g.ev('S.name') !== 'ISCA-S1', 'S.gold ' + g.ev('S.gold')); }
  /* (c) save de outro servidor na chave do s2 */
  { const bad = JSON.stringify(Object.assign({}, OLD, { name: 'DO-S1', gold: 999999, realm: 's1' })); const g = game({ eon_realm: 's2', 'eras_proto_v2@s2': bad }); g.ev('S.gold=5'); g.save();
    check('(c) save com realm = s1 na chave do s2 NÃO é carregado (REALM_MISMATCH)', !!g.ev('window.REALM_MISMATCH') && g.ev('S.name') !== 'DO-S1' && g.ev('S.gold') !== 999999, 'mismatch ' + JSON.stringify(g.ev('window.REALM_MISMATCH')) + ' nome ' + g.ev('S.name'));
    check('(c) as gravações ficam bloqueadas e a chave continua EXATAMENTE como estava', g.ev('window.__noSave') === true && g.ls.getItem('eras_proto_v2@s2') === bad, 'noSave ' + g.ev('window.__noSave'));
    { const fsx = require('fs'), pth = require('path'); const R = pth.join(__dirname, '..', '..'); const src = ['index.html'].concat(fsx.readdirSync(pth.join(R, 'js')).filter(x => /[.]js$/.test(x)).map(x => 'js/' + x)); const users = src.filter(f => /REALM_MISMATCH/.test(fsx.readFileSync(pth.join(R, f), 'utf8')) && f !== 'index.html');
      check('(c) o jogador é avisado do save de outro servidor (algum arquivo além do index.html usa REALM_MISMATCH para mostrar aviso)', users.length > 0, 'ninguém lê REALM_MISMATCH: o jogador joga um save novo que NUNCA é gravado (__noSave) e não sabe por quê', true); } }
  /* (d) valores inválidos */
  for (const v of ['S2', 's', 's1000', 's2;', '../x', '', 's-1', ' s2', 's2 ']) { const g = game({ eon_realm: v, eras_proto_v2: JSON.stringify(OLD) });
    check('(d) eon_realm = ' + JSON.stringify(v) + ' → s1 e a chave de hoje', g.realm() === 's1' && g.key() === 'eras_proto_v2', g.realm() + ' / ' + g.key()); }
  for (const v of ['s1', 's2', 's10', 's999']) { const g = game({ eon_realm: v }); check('(d) eon_realm = ' + v + ' válido', g.realm() === v, g.realm()); }
  /* (e) Modo dono */
  { const g = game({ eon_realm: 's2', eon_owner_mode: '1' }); check('(e) Modo dono em s2: eras_owner_v1@s2', g.key() === 'eras_owner_v1@s2', g.key()); g.save();
    check('(e) o Modo dono do s2 grava só em eras_owner_v1@s2 (nenhum save real é tocado)', same(g.keys(), ['eras_owner_v1@s2']), g.keys().join(','));
    check('(e) o carimbo do save do dono é realm s2', JSON.parse(g.ls.getItem('eras_owner_v1@s2')).realm === 's2', ''); }
  { const g = game({ eon_owner_mode: '1' }); check('(e) Modo dono em s1: eras_owner_v1 (chave de hoje)', g.key() === 'eras_owner_v1', g.key()); }
  /* (f) Realm */
  { const g = game({ eras_proto_v2: JSON.stringify(OLD) });
    check('(f) Realm.id() = s1; Realm.key(\'s2\') = eras_proto_v2@s2; Realm.key(\'s2\', true) = eras_owner_v1@s2; id inválido → s1', g.ev('Realm.id()') === 's1' && g.ev("Realm.key('s2')") === 'eras_proto_v2@s2' && g.ev("Realm.key('s2',true)") === 'eras_owner_v1@s2' && g.ev("Realm.key('zz')") === 'eras_proto_v2', '');
    check('(f) Realm.set com id inválido ou o mesmo servidor não faz nada', g.ev("Realm.set('x')") === false && g.ev("Realm.set('s1')") === false && g.ls.getItem('eon_realm') == null, '');
    const r = g.ev("Realm.set('s2')");
    check('(f) Realm.set(\'s2\'): grava o save atual na chave de hoje, muda eon_realm, bloqueia gravações', r === true && g.ls.getItem('eon_realm') === 's2' && g.ev('window.__noSave') === true && JSON.parse(g.ls.getItem('eras_proto_v2')).gold === 1234, 'r ' + r + ' eon_realm ' + g.ls.getItem('eon_realm')); }
  /* (g) pontos que usam SAVE_KEY */
  { const fsx = require('fs'), pth = require('path'); const txt = fsx.readFileSync(pth.join(__dirname, '..', '..', 'js', 'artprev.js'), 'utf8'); const exact = /SAVE_KEY *=== *'eras_owner_v1'/.test(txt) || /SAVE_KEY *=== *"eras_owner_v1"/.test(txt);
    check('(g) artprev.js não compara SAVE_KEY com \'eras_owner_v1\' EXATO (no Modo dono do s2 a chave é eras_owner_v1@s2: as ferramentas do dono ficariam desligadas)', !exact, 'js/artprev.js:83 ownerOk() usa SAVE_KEY === \'eras_owner_v1\': trocar por startsWith(\'eras_owner_v1\') / Realm.key(Realm.id(), true)', true); }
  { /* importar um código exportado de OUTRO servidor */
    const g = game({ eon_realm: 's2' }); const exported = JSON.stringify(Object.assign({}, OLD, { name: 'VIM-DO-S1', realm: 's1' }));
    g.ev('window.__noSave=false'); try { g.ev(`(function(){ XC.src=${exported}; return cImportDo(); })()`); } catch (e) {}
    const g2 = game({ eon_realm: 's2', 'eras_proto_v2@s2': g.ls.getItem('eras_proto_v2@s2') || exported });
    check('(g) importar um código de OUTRO servidor (realm s1) no s2: o save importado carrega depois do reload', g2.ev('S.name') === 'VIM-DO-S1' && !g2.ev('window.REALM_MISMATCH'), 'nome ' + g2.ev('S.name') + ' REALM_MISMATCH ' + JSON.stringify(g2.ev('window.REALM_MISMATCH')) + ' (cImportDo grava o JSON como veio, com realm do outro servidor: o load() recusa e o jogador perde o import sem aviso)', true); }
  { const g = game({ eon_realm: 's2', 'eras_proto_v2@s2': JSON.stringify(Object.assign({}, OLD, { realm: 's2', name: 'S2' })), eras_proto_v2: CANARY });
    try { g.ev('cResetDo()'); } catch (e) {}
    check('(g) "Apagar tudo" no s2 apaga só a chave do s2 (a do s1 fica)', g.ls.getItem('eras_proto_v2@s2') == null && g.ls.getItem('eras_proto_v2') === CANARY, 's2: ' + g.ls.getItem('eras_proto_v2@s2') + ' s1 intacta: ' + (g.ls.getItem('eras_proto_v2') === CANARY)); }
  console.log(fail ? '\n' + fail + ' VERIFICAÇÃO(ÕES) REPROVADA(S)' + (achados ? ' + ' + achados + ' ACHADO(S)' : '') : '\nREALMS: ' + (achados ? 'sem falha dura; ' + achados + ' ACHADO(S) abaixo para o engenheiro' : 'TODAS AS VERIFICAÇÕES PASSARAM'));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE:', e && e.stack || e); process.exit(1); });
