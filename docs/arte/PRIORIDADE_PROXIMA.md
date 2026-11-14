# Próxima prioridade da Arte (revisão da ARTE_MATRIZ, 14/11): o que falta para 100% do que já está no jogo

## O que já está 100% na arte (falta só o QA na tela, N3)
Herói padrão (Kael e Kaia), as 45 armas + ícones + ultimates, as 7 montarias com Kael e Kaia (parado, correr, golpe, tiro montado; Kaia no mítico usa o golpe como fallback), asas, os 5 pets antigos em 3 estágios com ataque, as 10 skins a pé (coreografia do padrão), folhas de dano limpas, Fogueira, ícones, molduras, eventos e as 3 armas de evento.

## O único buraco grande de arte: N4, skin montada
- As skins estão **ligadas** (`DATA.skinsOn=true`, js/sys/appearance.js:138), mas não existe nenhuma folha montada de skin (`mountArt:false`).
- Quem usa uma skin e monta vê o **corpo padrão** em cima da montaria (js/mountfx.js:63).
- Tamanho: 10 skins (Kael: anjo sem asa, ciborgue, demônio, ninja, samurai, paladino solar; Kaia: anjo, demônio, arlequina, ninja) × 7 montarias (pônei, cavalo, lobo, grifo, mítico, serpe, mecha) = **70 combinações**.
- Cada combinação leva um guia montado e 4 vídeos (parado, correr, golpe, tiro) pelo método atual: vídeo de referência do padrão montado + seedance fast. Custo: **~18 créditos** por combinação (16 dos vídeos + 2 do guia).

| Opção | O que é | Créditos |
|---|---|---|
| **0. Paliativo** | O dono aprova por escrito: montado mostra o corpo padrão (como hoje), e a skin aparece a pé, no avatar e no Perfil | **0** |
| **1. Piloto (recomendado)** | 1 combinação para medir o preço real e a qualidade: a skin mais vista na montaria de entrada (ex.: Kael Ninja no Pônei; o pônei abre no Nv 38) | **~18** |
| 2. Montaria de entrada | as 10 skins no Pônei | ~180 |
| 3. Todas | 70 combinações | ~1.260 |

Recomendação: aprovar o **paliativo 0 já** (fica registrado que é decisão do dono, e não falha) e fazer o **piloto de ~18**. Com o piloto medido, o dono escolhe se vai montaria por montaria (~180 cada) ou se fica no paliativo.
Grátis no Kling: ~1 combinação por dia (66 grátis/dia, 18 por clipe), o que é lento demais para 70.

## Itens sem crédito, só com voto ou código
- **Arco ×5:** as folhas do Kael e da Kaia, `bow_base` e `bow_legend` já estão no disco. Falta só o **voto do dono** (baseDelivered, js/sys/stats.js:65). **0 crédito.**
- **Fênix gigante:** a arte está toda pronta. Falta o **código** (MOUNT_REF js/mountfx.js:156, medir wx2/wy2).
- **Lobo sombrio:** a arte está pronta. Falta o **código** (PT_ART js/p_pets.js:43).
- **N1, telas da montaria com a espada pintada e sempre o Kael:** é **código** (p_mounts, p_offer, artprev).
- **Investida montada e ícones com recarga:** ver docs/arte/PEDIDOS_RECARGA_INVESTIDA.md (0 recomendado; falta a regra da Sistemas).
