// node test/sys/assets-fenix.test.js — Sys.assets.mountedArt acha a folha montada da Fênix (giant_phoenix mora no pacote mount:giant; QA 14/11)
'use strict';
const assert=require('assert');
globalThis.Sys={};
require('../../js/sys/assets.js');
const A=Sys.assets;
const files=['kael','kaia'].map(h=>'assets/anim/mounts/'+h+'_giant_phoenix_idle_body.png').concat(['assets/anim/mounts/kael_wolf_idle_body.png']);
const packs={}; for(const f of files){ const k=A.classify(f); (packs[k]=packs[k]||{files:[]}).files.push(f); }
A.setManifest({packs});
assert.strictEqual(A.classify(files[0]),'mount:giant');
assert.strictEqual(A.mountedArt('kaia','giant_phoenix'),true,'Kaia na Fênix tem folha montada');
assert.strictEqual(A.mountedArt('kael','giant_phoenix'),true);
assert.strictEqual(A.mountedArt('kael','wolf'),true);
assert.strictEqual(A.mountedArt('kaia','wolf'),false,'sem folha da Kaia no lobo');
console.log('5 testes ok');
