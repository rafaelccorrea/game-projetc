// node test/sys/name.test.js — Sys.name (nome do jogador)
'use strict';
const assert = require('assert');
const N = require('../../js/sys/name.js');
let n = 0; const t = (name, fn) => { fn(); n++; console.log('ok -', name); };
const ok = (s, o) => N.check(s, o).ok;

t('tamanho e caracteres', () => {
  assert.ok(ok('Kael_BR')); assert.ok(ok('Guardião')); assert.ok(!ok('ab')); assert.ok(!ok('a'.repeat(15))); assert.ok(!ok('Kael BR')); assert.ok(!ok('Kael-BR'));
  assert.strictEqual(N.check('ab').msg, 'Faltam 1 caractere(s). Mínimo de 3.');
});
t('palavrão, inclusive colado, com l33t e letras repetidas', () => {
  for (const s of ['Porra', 'MataPuta', 'P0rr4', 'Caraaalho', 'fdp_10', 'Fdp', 'xBuc3tax', 'Hitler88']) assert.ok(!ok(s), s);
  for (const s of ['Computador', 'Escudo', 'Cuidado', 'Picudo', 'Disputa', 'Fortaleza']) assert.ok(ok(s, { minor: false }), s);
});
t('reservado', () => { assert.ok(!ok('Admin')); assert.ok(!ok('Eonbound')); assert.strictEqual(N.check('Suporte').msg, 'Esse nome é reservado.'); assert.ok(ok('Administrador_')); });
t('menor (ou idade desconhecida): sem contato no nome; adulto pode números longos', () => {
  for (const s of ['Kael11987654', 'ZapDoKael', 'insta_kael', 'Kael@BR']) assert.ok(!ok(s), s);
  assert.ok(ok('Kael2012')); assert.ok(ok('Kael11987654', { minor: false }));
  assert.strictEqual(N.check('ZapDoKael').msg, 'Não use telefone, rede social ou e-mail no nome.');
});
t('troca: o nome atual não conta como novo', () => { assert.ok(!N.check('Kael', { current: 'Kael' }).ok); assert.ok(N.check('Kaelzinho', { current: 'Kael' }).ok); });
console.log(n + ' testes ok');
