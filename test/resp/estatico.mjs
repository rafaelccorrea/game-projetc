// VARREDURA ESTÁTICA DE RESPONSIVIDADE (QA, só node, sem navegador). Uso: node test/resp/estatico.mjs
// Lê index.html e js/**/*.js (telas montadas em JS com estilo inline/CSS em string) e gera reports/resp/ESTATICO.md com arquivo:linha + correção sugerida.
// Regras: (1) largura fixa > 320 px (width/min-width) · (2) white-space:nowrap sem reticências · (3) font-size < 11 px · (4) botão/alvo de toque < 40 px
//         (5) position absolute/fixed encostada na borda sem safe-area · (6) overflow-x:auto/scroll.   Heurística: pode haver falso positivo; confira antes de corrigir.
import fs from 'node:fs'; import path from 'node:path';
const ROOT = process.cwd(); const files = [];
const walk = d => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (!/^(node_modules|arquivo|\.git)$/.test(f.name)) walk(p); } else if (/\.(js|html|css)$/.test(f.name)) files.push(p); } };
walk(path.join(ROOT, 'js')); files.push(path.join(ROOT, 'index.html'));
/* ignora: js/sys (lógica), minificados, testes; telas = js/*.js e index.html */
const SKIP = /(^|[\\/])sys[\\/]|\.min\.|[\\/]dev[\\/]/;
const MINE = /(^|[\\/])p_(look|colecao|wait|shopmecha|vip|tower|rank|profile)\.js$/;   /* telas escritas por esta sessão (QA) */
const rules = [
  { id: 'largura-fixa', re: /(?<![-\w])(?:min-)?width\s*:\s*(\d{3,4})px/g, test: (m, line) => +m[1] > 320 && !/transforms*:s*scale/.test(line), fix: m => 'usar max-width:100% / min(' + m[1] + 'px,100%) ou % (a tela mais estreita é 288 px)' },
  { id: 'nowrap-sem-reticencias', re: /white-space\s*:\s*nowrap/g, test: (m, line) => !/text-overflow\s*:\s*ellipsis/.test(line), fix: () => 'juntar overflow:hidden;text-overflow:ellipsis;min-width:0 (ou permitir quebra: white-space:normal)' },
  { id: 'letra-pequena', re: /font-size\s*:\s*(\d+(?:\.\d+)?)px/g, test: m => +m[1] < 11, fix: m => 'subir para 11–12 px (hoje ' + m[1] + ' px) ou usar clamp(11px,3vw,13px)' },
  { id: 'alvo-pequeno', re: /(?<![-\w])(?:min-)?height\s*:\s*(\d{2})px/g, test: (m, line) => +m[1] < 40 && /<button|onclick|role=.button|class=.[^'"]*\bbtn|data-act|cursor\s*:\s*pointer/.test(line), fix: m => 'alvo de toque ≥ 40×40 px (hoje altura ' + m[1] + ' px): aumentar altura ou padding invisível' },
  { id: 'absoluta-sem-safe-area', re: /position\s*:\s*fixed[^"'`]*?(?:top|bottom)\s*:\s*0(?:px)?(?![\d.])/g, test: (m, line) => !/safe-area|env\(/.test(line), fix: () => 'somar env(safe-area-inset-top|bottom) (padding-top:max(8px,env(safe-area-inset-top)))' },
  { id: 'overflow-x', re: /overflow(?:-x)?\s*:\s*(?:auto|scroll)/g, test: (m, line) => /overflow-x\s*:/.test(m[0]) || /overflow\s*:\s*(auto|scroll)/.test(m[0]), fix: () => 'confirmar que o conteúdo tem min-width:0 e que rolar para o lado é intencional (carrossel); senão trocar por overflow-x:hidden + quebra de linha' },
];
const hits = [];
for (const f of files) { const rel = path.relative(ROOT, f).replace(/\\/g, '/'); if (SKIP.test(rel)) continue;
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => { if (line.length > 4000) line = line.slice(0, 4000); for (const r of rules) { r.re.lastIndex = 0; let m; while ((m = r.re.exec(line))) { if (r.test(m, line)) hits.push({ rel, n: i + 1, id: r.id, snip: line.trim().slice(Math.max(0, m.index - 25), m.index + 70).replace(/\s+/g, ' '), fix: r.fix(m), mine: MINE.test(rel) }); if (m[0].length === 0) r.re.lastIndex++; } } }); }
const byFile = {}; for (const h of hits) (byFile[h.rel] = byFile[h.rel] || []).push(h);
const count = id => hits.filter(h => h.id === id).length;
const L = ['# Varredura estática de responsividade', '', 'Gerado por `node test/resp/estatico.mjs` em ' + new Date().toISOString() + '. Heurística por regex sobre `index.html` e `js/**` (menos `js/sys`, lógica pura). **Pode haver falso positivo**: confira o trecho antes de corrigir. Cada linha: `arquivo:linha` · regra · trecho · correção sugerida.', '',
  '## Totais', '', '| regra | achados |', '|---|---|', ...['largura-fixa', 'nowrap-sem-reticencias', 'letra-pequena', 'alvo-pequeno', 'absoluta-sem-safe-area', 'overflow-x'].map(id => '| ' + id + ' | ' + count(id) + ' |'), '| **total** | **' + hits.length + '** |', '',
  '## Por arquivo (mais achados primeiro)', '', '| arquivo | achados | dono |', '|---|---|---|', ...Object.entries(byFile).sort((a, b) => b[1].length - a[1].length).map(([f, h]) => '| ' + f + ' | ' + h.length + ' | ' + (MINE.test(f) ? 'QA (eu corrijo)' : 'distribuir') + ' |'), ''];
const sect = (title, arr) => { L.push('## ' + title, ''); const by = {}; for (const h of arr) (by[h.rel] = by[h.rel] || []).push(h);
  for (const [f, hs] of Object.entries(by).sort((a, b) => b[1].length - a[1].length)) { L.push('### ' + f + ' (' + hs.length + ')', ''); for (const h of hs.slice(0, 60)) L.push('- `' + f + ':' + h.n + '` · **' + h.id + '** · `' + h.snip.replace(/`/g, "'") + '` → ' + h.fix); if (hs.length > 60) L.push('- … mais ' + (hs.length - 60) + ' neste arquivo'); L.push(''); } };
sect('Telas do QA (eu corrijo)', hits.filter(h => h.mine)); sect('Demais arquivos (PO distribui)', hits.filter(h => !h.mine));
fs.writeFileSync(path.join(ROOT, 'reports/resp/ESTATICO.md'), L.join('\n'));
console.log('ESTATICO.md: ' + hits.length + ' achados em ' + Object.keys(byFile).length + ' arquivos; do QA: ' + hits.filter(h => h.mine).length);
console.log(['largura-fixa', 'nowrap-sem-reticencias', 'letra-pequena', 'alvo-pequeno', 'absoluta-sem-safe-area', 'overflow-x'].map(id => id + ' ' + count(id)).join(' | '));
