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

## Voto do dono (14/11): Caçada = A (526b31f0), Forja = B (88a877ea), Pets = A (c7e2f136)

## Lote 2: prompts prontos (teto ~16; 6 imagens ≈ 12)

Regras em todas: sem texto, sem saco de ouro, sem "$" e sem pilha de moedas, sem baú nem sorteio, nada sensual. Na Festa, o pet é o dragãozinho (ref 079d8337-2f6c-4868-97c5-26be63a0f7a6), nunca o grifo.

**2.1-2.3 Fundos** (`nano_banana_pro`, 9:16, 2k; ref 1 = o mock votado do tema):
"Background painting only for a mobile game event screen, portrait 9:16, same painted chibi-fantasy style, palette and lighting as image 1. <CENA>. No UI, no text, no characters, no creatures, no medallions, no coins, no money bags, no chests. The top third is calm sky or ceiling (a title bar sits over it); the middle and lower part is an open, readable painted landscape with a winding path, the center kept free of big objects (the game draws the trail and the boss on top). Detail at the edges only."
- Caçada (A, escuro): "a dark wild boss-hunting ground at dusk: torn hunters' banners, crossed spears, trophy shields and antler racks at the edges, deep shadows, warm torch rim light"
- Forja (B, claro): "a bright warm dwarven forge hall in daylight: anvils, bellows, cooling racks of plain steel tools and molten metal channels at the edges, sparks, vivid cheerful colors; no gold, no coins"
- Pets (A, escuro): "a festive meadow at evening: ribbons, paper lanterns, bunting, pet food bowls and little tents at the edges, deep blue shadows, warm lantern glow"

**2.4 Ícones 3×3** (`nano_banana_pro`, 1:1, 2k; refs = os 3 mocks votados):
"A 3x3 grid of nine separate mobile game icons, each centered in its own equal cell with wide empty margins, on a flat pure green background (#00FF00), painted chibi-fantasy style of the references, bold dark outline, no text, no green on the icons, nothing touching the cell edges. Row 1 (event theme icons): a hunting horn over crossed spears on a shield; a hammer striking an anvil with sparks; a paw print with a red ribbon bow. Row 2 (small currency icons, very simple big silhouettes readable at 20 pixels): a bronze trophy cup; a small forge hammer; a red ribbon bow. Row 3 (grand prize milestone medallions, round): a hunter's emblem with antlers; a sword lying on an anvil; a paw-print medallion tied with a bow."
Saída: linha 1 → `icon.png` 128, linha 2 → `points.png` 96, linha 3 → `frame.png` 128 (cacada_chefes, semana_forja, festa_pets).

**2.5 Molduras da loja 2×2** (`nano_banana_pro`, 1:1, 2k; ref 1 = `assets/ui/frames/ouro.png`, ref 2 = Caçada A, ref 3 = Pets A):
"A 2x2 grid of four round portrait frames for a mobile game profile, each centered in its own cell, same construction and thickness as image 1 (an ornate ring with an EMPTY transparent-looking round window in the middle, the window about 62% of the frame width), on flat pure green (#00FF00), no text, no portrait inside. Top row: two variants of a 'Hunter' frame (dark bronze and leather ring with small antlers and crossed spears, a tiny trophy at the bottom), matching image 2. Bottom row: two variants of a 'Pet Festival' frame (ring of ribbons, bunting and small paw prints, a bow at the bottom), matching image 3."
Saída: o melhor de cada linha → `assets/ui/frames/evt_cacada.png` e `evt_pets.png`, 256×256, janela de 160.

**2.6 Armas de evento** (`nano_banana_pro`, 1:1, 1k; ref 1 = `assets/weapons/era2_t1.png`):
"Two separate game weapon sprites side by side for a chibi mobile RPG, same painted style and outline as image 1, each one whole, diagonal, handle at the bottom, flat pure green background (#00FF00), no shadow, no text, no hand, no character, nothing floating, no glow, no sparks, no green or magenta on the weapons. Left: 'Lâmina do Caçador', a long curved hunting sword with an antler hilt, leather grip wrap and a small bronze trophy pommel. Right: 'Martelo das Eras', a heavy two-handed war hammer whose head is made of layered bands of stone, bronze and steel, a dark wooden handle with iron rings."
Saída: sprite (lado ≤ 1024) + ícone 256 por código; chaves `cacada_weapon` e `forja_weapon` (grip no meta.json pela Arte).

Pós-produção (Arte, custo 0, fora de assets/): recorte do verde (`key.js`), divisão da grade (`icn/split4.js` / cut), redução para os tamanhos, JPG 82 dos fundos, conferência e cópia para assets/ por tema.

## Entregue (14/11, ad71c52)
Fundos, ícones do tema, pontos, marcos e molduras evt_cacada/evt_pets em assets/. Gasto dos lotes 1+2: ~24 de 32.

**Armas de evento SEGURADAS fora de assets/** (Engenheiro, 14/11): a aba "Skins arma" saiu do jogo (js/screens.js, scrShop); a mão usa sempre a arma equipada. O dono decide se a skin de arma de evento volta ou se o prêmio troca.
Prontas em `C:\Users\rafae\AppData\Local\Temp\tools\evt\out\weapons\` (sprite 1024) e `out\icons\` (256). Grips medidos (`out\weapons\meta_novos.json`):
- cacada_weapon: grip [0.363,0.863], angle 69, len 0.899;
- forja_weapon: grip [0.273,0.815], angle 82, len 0.801.
Com o OK: copiar para assets/weapons/<chave>.png e assets/icons/weapons/<chave>.png e pôr a entrada no meta.json.
