# Arte dos 3 temas de evento: peças e estimativa (Arte, 14/11)

Base: docs/EVENTOS_TEMAS.md (Sistemas 6e74bcf). Nada gerado ainda; **cada lote só com o OK do PO/dono**.
Preços: nano_banana_pro ~2 por imagem; seedance_2_0 fast sem áudio ~4 por vídeo (docs/arte/CUSTO_POR_ITEM.md).
Regras: corpo padrão nas skins, sem asa pintada, nada sensual, arma na mão direita, nada flutua, ouro escasso (nenhuma moeda dourada nova; Brasas = carvão).

## Arquivos de saída (confirmados pelo Engenheiro, 14/11)

base = cacada_chefes, semana_forja, festa_pets (e festival_eras). Montar fora de assets/ e copiar só o pronto.
- fundo: `assets/events/<base>/bg.jpg`, 720×1280, JPG ~82, sem texto, centro livre (o terço de cima fica atrás do título);
- ícone do tema: `assets/events/<base>/icon.png`, 128×128, transparente;
- ícone dos pontos: `assets/events/<base>/points.png`, 96×96, transparente, legível em 20-32 px;
- marco do grande prêmio: `assets/events/<base>/frame.png`, 128×128, transparente (ícone de marco, não moldura de retrato);
- molduras da loja: `assets/ui/frames/evt_cacada.png` e `evt_pets.png`, 256×256, janela de 160 no centro (padrão das molduras de retrato).
Avisar o Engenheiro por tema quando os arquivos chegarem.

## Lote 1: mocks de tela cheia (voto do dono com caixinhas)

Tela de Eventos com o tema aplicado, 9:16, 2k, A (escuro/épico) e B (claro/colorido). Referências: print real da tela de Eventos (Festival), herói real, fundo da era.

| Tema | Mock A | Mock B |
|---|---|---|
| Caçada aos Chefes (Troféus da Caçada, chefe Rei da Caçada) | ~2 | ~2 |
| Semana da Forja (Martelos da Forja, Colosso da Bigorna) | ~2 | ~2 |
| Festa dos Pets (Laços da Festa, Fera Ancestral) | ~2 | ~2 |

**Lote 1: ~12 créditos** (até ~16 com uma refação).

## Lote 2: peças, depois do voto (seguem o mock escolhido)

| Peça | Como | Créditos |
|---|---|---|
| Fundo da tela de Eventos ×3 (um por tema) | 1 imagem por tema, sem texto | ~6 |
| Ícone do tema ×3 + ícone dos pontos ×3 (troféu, martelo, laço) | 1 grade 3×3 (sobram 3 casas de reserva) | ~2 |
| Moldura do grande prêmio ×3 (cacada, forja, pets) + molduras da loja evt_cacada, evt_pets | 1 grade 3×3, no molde das molduras do retrato (4f1e5e6) | ~2 |
| Skins de arma "Lâmina do Caçador" e "Martelo das Eras" | 1 imagem com as duas, sem fundo; ícone e grip por código (molde MANUAL_arma.md) | ~2 |

**Lote 2: ~12 créditos** (até ~16 com refação).

## Lote 3: skin de roupa "Avental do Ferreiro" (separado, decisão do dono)

Skin a pé inteira na coreografia do herói padrão (mkref + seedance), 8 estados + guia: **~36 por herói** (medido 14/11: ~4 por estado + guia).
- só um herói (o do jogador, Kael ou Kaia, conforme a Sistemas mapear): ~36;
- Kael e Kaia: ~72.
Sem montada (montado usa o corpo padrão).

## Chefes do evento

A sugestão é manter os chefes que a Sistemas já escolheu, com custo 0: Rei da Caçada = era3_boss, Colosso da Bigorna = era4_boss, Fera Ancestral = era1_boss.
Chefe com arte própria seria um inimigo novo (folhas parado/golpe/dano/morte), por isso fica de fora.

## Total

- Lotes 1 + 2: **~24** (até ~32 com refação). Cobrem tudo, menos o avental.
- Com o avental (um herói): **~60**. Com o avental para os dois heróis: **~96**.

## Lote 1: prompts prontos (liberado pelo dono 14/11, teto 32 para lotes 1+2)

`nano_banana_pro`, 9:16, 2k, 1 imagem por job. Referências, nesta ordem: 1) `reports/prints/ft_events_trilha.png` (tela real de Eventos), 2) `tools/mock/kael_griffin.png` (herói), 3) chefe do tema (`assets/enemies/era3_boss.png` Caçada, `era4_boss.png` Forja, `era1_boss.png` Pets), 4) só na Festa: `tools/mock/pet_dragon.png`.

Cabeçalho: "A full-screen mobile game UI screen mockup, portrait 9:16, for the chibi fantasy RPG 'Eonbound', same layout as image 1 (top bar with back arrow 'Eventos', points counter, tabs 'Trilha / Chefe / Loja', a winding milestone trail of round reward medallions over a painted map, the hero standing on the trail, a big bottom button), in the exact painted chibi style of the reference art (bold outlines, rich shading). The hero is a child, fully clothed; nothing sensual. Text in Brazilian Portuguese, short. No prices, no money, no gems for sale, no random boxes, no ads, no watermark. Gold coins appear only as a small reward, never piles."
Variantes: A = "dark rich background, deep shadows, warm rim lights"; B = "bright warm daylight, vivid cheerful colors".

- **Caçada aos Chefes**: "Event theme 'Caçada aos Chefes': a hunters' trail through a wild boss-hunting ground with banners, crossed spears and trophy shields; the points counter uses a small bronze trophy icon labeled 'Troféus da Caçada'; the boss from image 3 waits at the end of the trail as 'Rei da Caçada'; the grand prize medallion is a hunter's frame with antlers."
- **Semana da Forja**: "Event theme 'Semana da Forja': the trail runs through a glowing dwarven forge hall with anvils, bellows, sparks and molten metal channels; the points counter uses a small hammer icon labeled 'Martelos da Forja'; the boss from image 3 waits at the end as 'Colosso da Bigorna'; the grand prize medallion is a weapon on an anvil."
- **Festa dos Pets**: "Event theme 'Festa dos Pets': the trail runs through a festive meadow with ribbons, lanterns, bunting and food bowls; the pet from image 4 walks beside the hero; the points counter uses a small ribbon bow icon labeled 'Laços da Festa'; the boss from image 3 waits at the end as 'Fera Ancestral'; the grand prize medallion is a paw-print frame with a bow."

## Lote 1 gerado (pelo PO, ~12 créditos, 14/11): aguardando o voto do dono

| Tema | A | B |
|---|---|---|
| Caçada | 526b31f0-8113-493c-a839-a602629f4a00 | 6e06fed4-f6f6-46ed-ba66-143b219be92d |
| Forja | 18a6b68c-213d-44eb-958b-4b3b0f5096b2 | 88a877ea-ca32-4d60-a927-b8179ef9059f |
| Pets | c7e2f136-79c2-4d8f-afa9-10dfc8ee117c | b934ba19-cd1c-48e9-9f21-48044853bdb0 |

Cuidados nas peças (lote 2, só depois do voto): sem os sacos de ouro com "$" da Forja B (ouro escasso); sem baús ou sorteio (Caçada A tem baús); na Festa dos Pets usar o pet real (a Pets A trocou o pet pelo grifo).
Gasto acumulado lotes 1+2: ~12 de 32.
