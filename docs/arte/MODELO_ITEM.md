# Modelo de item (copiar para a matriz)

Copiar o bloco abaixo para `docs/ARTE_MATRIZ.md`, na seção do item aberto, trocar `<...>` e marcar cada caixa só com prova (comando + saída, arquivo, commit ou print). Manual do tipo: `docs/arte/MANUAL_<tipo>.md`. Base comum: `docs/arte/VALIDACAO_COMUM.md`. Custo: `docs/arte/CUSTO_POR_ITEM.md`.

```markdown
### <Tipo>: <nome do item> (`<chave/pasta>`)
Aberto pelo PO em <data> · responsável: <sessão> · manual: docs/arte/MANUAL_<tipo>.md

**G0 — antes de gerar (custo 0)**
- [ ] Item aberto na matriz; nenhum outro item aberto pela mesma sessão
- [ ] Procurado no disco (assets/, docs/proto/v2/a/, _fontes_arte, jobs.txt): <achado ou "nada">
- [ ] O que é código (não gerar): <lista>
- [ ] Onde o jogo lê (arquivo:linha): <...>
- [ ] Respeita o que NÃO pode (FLUXO_ARTE §2): sem asa em skin, sem arma pintada, criança, nada sensual, nada flutua
- [ ] Backup da pasta de ferramentas feito (robocopy → C:\Users\rafae\Desktop\fps_backup\tools) em <data>
- [ ] Backup dos assets que serão sobrescritos: C:\Users\rafae\Desktop\fps_backup\<tarefa>\

**Plano de custo (aprovado pelo PO em <data>)**
| peça | caminho (grátis/Higgsfield) | qtd | custo estimado | custo real | job id / url |
|---|---|---|---|---|---|
| guia | | | | | |
| vídeo <estado> | | | | | |
Total estimado: <n> (+20% = <n>) · real: <n> · parar em ~10 sem nova liberação

**G1 — guia**
- [ ] `checkguide.js` sem avisos (saída colada ou "warnings: []")
- [ ] Olho: nada flutua, sem asa no corpo, criança, sério, nada sensual, bastão inteiro sem cruzar o rosto, 1 sela (montaria)
- [ ] Guia salvo em <caminho> (commit <hash>)

**G2 — vídeos** (um por estado; anotar na hora)
- [ ] <estado 1>: job <id> · url anotada · bastão nítido, sem borrão
- [ ] <estado 2>: ...

**G3 — folhas** (comandos do manual; tira, sem grade)
- [ ] <folha 1>: quadros/célula iguais ao padrão
- [ ] Consertos feitos (fixgrip/setgrip/polewipe/inpaint...): <lista>

**VALIDAÇÃO E QUALIDADE** (VALIDACAO_COMUM §4-5; valores medidos)
- [ ] Laço sem salto: razão <x> (≤ 1,5)
- [ ] Mão no grip em 100% dos quadros (stagekit)
- [ ] Pés no chão ± <N> px (stagekit)
- [ ] Cabeça/grip/costas iguais ao padrão (skin: grip ≤ 4 px e ≤ 8°, pés ≤ 3 px, back ≤ 4 px): `artcheck cmp` → <OK n/n>
- [ ] Sem borrão e sem fantasma: `artcheck px` → interno <n>
- [ ] Sem cor fora da paleta: `artcheck pal` → <x>% (≤ 0,5%)
- [ ] Contorno limpo, sem franja verde; magenta 0 (`pinkcount`)
- [ ] Tamanho e escala iguais aos irmãos
- [ ] Nada flutua
- [ ] Sem asa desenhada em skin
- [ ] Criança, nada sensual
- [ ] `node test/sys/stagekit.test.js` → 0 falha, 0 aviso novo
- [ ] `node test/paineis/sheetcss.test.js` → 0 falha
- [ ] `node test/e2e/sheetgrid.js` → código 0
- [ ] Folha de conferência: <caminho do _conferencia_*.png> enviada ao PO em <data>
- [ ] Voto do dono (visual novo): <aprovado/reprovado, data>

**G4 — commit**
- [ ] Commit <hash> só com caminhos explícitos; push origin master:main; STATUS_DONO atualizado
- [ ] Engenheiro avisado do que ligar (arquivo:linha): <...>

**G5 — visto na tela (QA)**
- [ ] Linha enviada ao QA: `<item> · <hash> · <folhas> · <o que olhar>`
- [ ] QA ✓/✗ · commit testado <hash> · data · print reports/qa/<tipo>_<id>/

**Pronto (ARTE_PRONTO)**: todas as linhas da lista do tipo ✓ → PO libera o próximo item.
```
