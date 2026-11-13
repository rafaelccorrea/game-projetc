# Cenários das telas V2 → assets do jogo

Levantamento da Arte (fps-75), 2026-11-13. Todas as imagens de cenário usadas pelos protótipos
`docs/proto/v2/*.html` (pasta `a/`) **já existem em `assets/`, idênticas** (mesmo md5). Nada foi copiado.

| Imagem do protótipo | Caminho no jogo | Era | Telas que usam | Tamanho |
|---|---|---|---|---|
| `a/bg_era2.png` | `assets/bg/era2.png` | 2 | Batalha, Correio, DirecoesMapaCorreio (cartão do mapa), Equipamento, Fogueira, FogueiraV3, Forja, Guilda, Invocar, Loja, MapaDasEras, Montarias, Passe, Pets, TorneioDoPoder, Torre, VIP | 612 KB |
| `a/bg8_sky.webp` | `assets/bg/v2/era8/sky.webp` | 8 | FimDasEras, DirecoesMapaCorreio | 4,8 KB |
| `a/bg8_far.webp` | `assets/bg/v2/era8/far.webp` | 8 | FimDasEras, DirecoesMapaCorreio | 94 KB |
| `a/bg8_ground.webp` | `assets/bg/v2/era8/ground.webp` | 8 | FimDasEras, DirecoesMapaCorreio | 47 KB |

## Para o engenheiro

- O `bg_era2.png` dos protótipos é só o exemplo da era 2. No jogo, a tela usa a **era atual** do
  jogador: `assets/bg/era<N>.png` (N = 0..6) e `assets/bg/era7_ref.png` / `assets/bg/era8_ref.png`
  (mapa `BG_FILE` / `bgPath(era)` em `js/battle.js`; `xEraBgUrl()` em `js/panels.js` já usa isso).
- As camadas `sky` / `far` / `ground` do FimDasEras existem para todas as eras em
  `assets/bg/v2/era<N>/{sky,far,ground}.webp` (N = 0..8), se uma tela quiser o cenário em camadas
  em vez da imagem única.
- Atenção: `assets/bg/era0..6.png`, `era7_ref.png` e `era8_ref.png` estão **fora do git**
  (`.gitignore` tem `*.png`); existem só no disco local. As camadas `assets/bg/v2/era8/*.webp` estão no git.
