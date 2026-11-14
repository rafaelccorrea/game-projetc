# Armas de evento como armas de verdade: 3 armas × 3 raridades (Arte, 14/11). Só preparado, nada gerado

Armas: **Lâmina do Caçador** (`cacada_weapon`), **Martelo das Eras** (`forja_weapon`), **Lâmina do Festival** (`festival_weapon`).
Raridades: **Épico, Mítico e Lendário**. No jogo a ordem é Básico < Raro < Épico < Mítico < Lendário (js/battle.js:704). O pedido dizia "Épico → Lendário → Mítico": **confirmar com o dono** se a ordem é a do jogo.
Regra que vale para todas: mesma silhueta nas 3 raridades. O Mítico é mais rico que o Épico, e o Lendário é o mais rico (material, ornamentos, gemas e cor da raridade). Nada flutua, sem brilho solto no sprite (o brilho é a aura da Forja, por código), ouro só como acabamento.

## Peças por arma

| Peça | Épico | Mítico | Lendário | Como |
|---|---|---|---|---|
| Sprite 1024 transparente | ✓ já existe (o atual vira o Épico) | novo | novo | 1 imagem por arma com o Mítico e o Lendário lado a lado, ref = sprite atual (~2) |
| Ícone 256 | recorte | recorte | recorte | código (icongen), 0 |
| Grip no meta.json | ✓ medido | medir | medir | código, 0 |
| Na mão do Kael e da Kaia (parado, correr, golpe, giro, montado) | compose2 | compose2 | compose2 | código, 0 |
| Ultimate | folha própria do Épico (vídeo) | o Épico reforçado por código (ultboost: realce, halo, anel na cor da raridade) | folha própria do Lendário (vídeo) | 2 vídeos por arma (~4 cada), como hoje nas armas das eras |

Ultimate pelo método de hoje (MANUAL_arma.md passo 4):
- vídeo de `seedance_2_0` 16:9 com fundo preto, que vira folha de 384×216 a 12 fps (`ultsheet.js`);
- a imagem inicial é a arte da arma, para o golpe ter a cara dela;
- Caçada: estocada de caçador com a sombra de uma galhada de cervo e lanças;
- Forja: martelada na bigorna com onda de faíscas e anel de metal derretido;
- Festival: corte festivo com lanternas e fitas que explodem em fogos de luz.

## Custo

| Item | Por arma | 3 armas |
|---|---|---|
| Sprites Mítico + Lendário (1 imagem) | ~2 (+2 se refizer) | ~6 (até ~12) |
| Ultimate Épico + Lendário (2 vídeos) | ~8 (+4 se refizer um) | ~24 (até ~36) |
| Imagem inicial das ultimates (opcional, se o golpe não tiver a cara da arma) | ~2 | ~6 |
| Mítico da ultimate, ícones, grips, mão, montado | 0 | 0 |
| **Total** | **~10-16** | **~30 (até ~54 com refação e imagens iniciais)** |

## Como mostrar no voto (cada arma × raridade com sua caixinha "Quero esta")
- **Arma:** o sprite das 3 raridades lado a lado e um GIF curto de 2-3 s na mão do Kael e outro na mão da Kaia (parado → golpe → giro), feitos da folha real do jogo com a arma no grip (compose2 → gif). Custo 0.
- **Ultimate:** um MP4 curto, de 2-3 s, de cada raridade (Épico, Mítico e Lendário) tocando sobre um print real da batalha, do jeito que aparece no jogo. Feito por código a partir das folhas (ffmpeg), custo 0. É melhor que o vídeo bruto do Higgsfield, porque mostra o resultado final.
- O dono reprova o que não estiver completo. Por isso o voto só sai quando as 3 raridades de uma arma estiverem prontas, com sprite, ícone, mão do Kael e da Kaia, montado e as 3 ultimates. Uma arma de cada vez, até 100%.

Os prompts saem depois do OK, a partir do sprite atual de cada arma (docs/arte/refs/evt_armas). Só rodam com o conector Higgsfield desta janela reconectado, porque as ultimates usam imagens locais.
