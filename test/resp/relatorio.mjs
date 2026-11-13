// Gera reports/resp/RELATORIO.md a partir de reports/resp/resultado.json (feito por test/resp/audit.mjs).
// Uma linha por defeito: tela · tamanho · o que · print. Resumo por tela: OK / com defeito.
import fs from 'node:fs';
const J = JSON.parse(fs.readFileSync('reports/resp/resultado.json', 'utf8'));
const GRAVE = new Set(['rolagem-lateral', 'texto-cortado', 'texto-cortado-v', 'fora-da-tela', 'sobreposicao']);   /* afetam leitura/uso */
const AVISO = new Set(['letra-pequena', 'botao-pequeno', 'contraste-baixo', 'barra-de-status', 'barra-inferior', 'verificacao']);
const bySc = {};
for (const r of J.resultados) { const k = r.tela; (bySc[k] = bySc[k] || []).push(r); }
const L = []; L.push('# Auditoria de responsividade e leitura', '', 'Gerado em ' + J.gerado + ' · origem ' + J.origem + ' · tamanhos ' + J.tamanhos.map(s => s.join('×')).join(', '), '',
  'Critérios: rolagem lateral · texto cortado (scrollWidth > clientWidth, reticências) · letra < 11 px · botão < 40×40 px · elemento fora da tela ou sob a barra de status/inferior · sobreposição (>30% do menor) · contraste < 3:1 (só onde o fundo é cor sólida). Telas "em edição" (mapa/era/Códex, eras 7-8) não são defeito.', '');
const sum = [], det = [];
for (const [tela, rs] of Object.entries(bySc)) {
  const por = rs.map(r => { if (r.erro) return { w: r.w, g: -1, a: 0 };
    const seen = new Set(); let g = 0, a = 0; for (const d of r.defeitos) { const key = d.tipo + '|' + d.el; if (seen.has(key)) continue; seen.add(key); if (GRAVE.has(d.tipo)) g++; else a++; } return { w: r.w, g, a }; });
  const st = por.some(p => p.g > 0) ? 'COM DEFEITO' : por.some(p => p.g < 0) ? 'NÃO ABRIU' : por.some(p => p.a > 0) ? 'OK (avisos)' : 'OK';
  sum.push('| ' + tela + ' | ' + st + ' | ' + por.map(p => p.w + ': ' + (p.g < 0 ? 'não abriu' : p.g + ' graves/' + p.a + ' avisos')).join(' · ') + ' |');
  for (const r of rs) { if (r.erro) { det.push('- ' + tela + ' · ' + r.w + ' · não abriu (' + r.erro + ') · -'); continue; }
    const seen = new Set(); for (const d of r.defeitos) { const key = d.tipo + '|' + d.el; if (seen.has(key)) continue; seen.add(key);
      det.push('- ' + tela + ' · ' + r.w + ' · ' + (GRAVE.has(d.tipo) ? '**' + d.tipo + '**' : d.tipo) + ': ' + d.el + ' — ' + d.detalhe + ' · ' + (r.print || '-')); } } }
L.push('## Resumo por tela', '', '| tela | situação | por tamanho |', '|---|---|---|', ...sum, '', '## Defeitos (tela · tamanho · o que · print)', '', ...det, '');
fs.writeFileSync('reports/resp/RELATORIO.md', L.join('\n'));
console.log('RELATORIO.md: ' + sum.length + ' telas, ' + det.length + ' linhas');
