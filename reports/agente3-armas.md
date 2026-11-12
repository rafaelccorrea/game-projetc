# Agente 3 - Armas

## Entregue
- 21 sprites em `assets/weapons/era{0..6}_t{0..2}.png` (2048x2048, 1:1, fundo transparente via remove_background; sem halo visível).
- `assets/weapons/meta.json` com `type` (melee/gun) e `grip` [fx,fy] em fração da imagem.
  - Armas brancas apontam para cima (era0-2, era6_t1 e era6_t2); armas de fogo apontam para a direita (era3-5, era6_t0).
  - Os pontos de empunhadura foram estimados a partir da caixa delimitadora da arma (cabo ~75-78% da altura; arma de fogo ~22-30% da largura, ~55-63% da altura). Precisam de ajuste fino no jogo.

## Créditos
- Geração: 21 x 2 = 42 créditos (nano_banana_pro, mapeado para nano_banana_2).
- Remoção de fundo: 21 jobs (custo unitário não medido).
- Saldo inicial 926.96 -> final 769.96, mas o saldo é compartilhado com os outros agentes, então o gasto real meu é bem menor que a diferença.

## Pendências / observações
- A âncora `assets/hero/era2_t0.png` não existia na hora; segui só o STYLE (sem imagem de referência).
- era3_t0 (pistola de pederneira ferro): pequenos fragmentos (cão/pederneira) flutuam acima da pistola, desconectados. Menor, mas pode ser regenerada.
- era1_t0 saiu com lâmina verde-bronze oxidada (pátina), não bronze dourado. Aceitável como "bronze simples".
- Arquivos de 2048px (~4 MB cada); o engenheiro pode reduzir para 512px.
- Rate limit de 8 jobs simultâneos do Higgsfield (compartilhado) exigiu várias tentativas na remoção de fundo.
