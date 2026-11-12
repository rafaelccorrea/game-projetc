'use strict';
// Confere se os nomes globais (const/let/function no topo) de um js/p_*.js colidem com os de OUTROS scripts do jogo (classic scripts compartilham o escopo global).
// Uso: node test/paineis/conflitos.js js/p_vip.js [js/p_era.js ...]
const fs = require('fs'), path = require('path'); const R = path.join(__dirname, '..', '..');
const files = fs.readdirSync(path.join(R, 'js')).filter(x => x.endsWith('.js')).map(x => 'js/' + x).concat(['index.html']);
let fail = 0;
for (const arg of process.argv.slice(2)) {
  const me = arg.replace(/\\/g, '/'), src = fs.readFileSync(path.join(R, me), 'utf8'), names = new Set();
  for (const m of src.matchAll(/^(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  const bad = [];
  for (const f of files) { if (f === me) continue; const t = fs.readFileSync(path.join(R, f), 'utf8');
    for (const n of names) if (new RegExp('^(?:const|let|var|function)\\s+' + n.replace(/\$/g, '\\$') + '\\b', 'm').test(t)) bad.push(n + ' (também em ' + f + ')'); }
  console.log(me + ': ' + names.size + ' nomes globais; conflitos: ' + (bad.join(', ') || 'nenhum')); if (bad.length) fail = 1;
}
process.exit(fail);
