# Eras 7 (Submundo) e 8 (Celestial) — equilíbrio e conteúdo (fps-e2, 12/11/2026; pedido do PO)

**Conteúdo:** `js/sys/eras.js` (Sys.eras) com as 2 eras no formato do `ERAS` do jogo (nomes, armas e coletes por raridade, cores do cenário, inimigos com a arte
aprovada: Diabrete, Cão Infernal, Demônio Ceifador; Guardião Alado, Golem Rúnico, Arcanjo; Senhores: Senhor do Submundo e Juiz Celestial). O engenheiro anexa
com `ERAS.push(...Sys.eras.extra())` quando ligar a curva (vazio antes). Números: Sys.phases (Revisão 2), formato abreviado do Sys.stats.abbr.

## Números (FC recomendada, inimigo comum vida/dano/DEF, chefe da última onda; Senhor na fase 100) e economia (ouro por abate × custo de subir 1 nível de item)
```
era | dif | fase | fcRec | comum hp/dano/DEF | chefe-fase hp | Senhor hp/dano | ouro comum | ouro Senhor | subir item r4 Nv(lock) | abates p/ 1 nível
2 | Fácil | 1 | 28,4K | 1K/97/341 | 15,3K |  | 21 | 328 | 1K | 50
2 | Fácil | 50 | 104K | 3,7K/355/1,2K | 50,1K (chefe) |  | 37 | 573 | 1,1K | 30
2 | Fácil | 100 | 394K | 14,1K/1,3K/4,7K | 195K (senhor) |  | 74 | 1,1K | 1,1K | 16
2 | Médio | 1 | 85,3K | 3K/290/1K | 46K |  | 34 | 525 | 1,2K | 35
2 | Médio | 50 | 313K | 11,2K/1K/3,7K | 150K (chefe) |  | 59 | 917 | 1,2K | 21
2 | Médio | 100 | 1,1M | 42,5K/4K/14,1K | 585K (senhor) |  | 118 | 1,8K | 1,3K | 11
6 | Fácil | 1 | 18,1B | 654M/61,7M/218M | 9,8B |  | 5,6K | 87,6K | 642K | 114
6 | Fácil | 50 | 25,8B | 932M/88M/311M | 12,4B (chefe) |  | 9,8K | 153K | 661K | 67
6 | Fácil | 100 | 37,1B | 1,3B/126M/446M | 18,3B (senhor) |  | 19,7K | 308K | 682K | 35
6 | Hell | 1 | 491B | 17,6B/1,6B/5,8B | 265B |  | 22,4K | 351K | 757K | 34
6 | Hell | 50 | 699B | 25,1B/2,3B/8,3B | 335B (chefe) |  | 39,2K | 613K | 780K | 20
6 | Hell | 100 | 1T | 36B/3,4B/12B | 496B (senhor) |  | 78,9K | 1,2M | 803K | 10
7 | Fácil | 1 | 1T | 36,9B/3,4B/12,3B | 555B |  | 22,7K | 355K | 2,8M | 124
7 | Fácil | 50 | 1,2T | 43,7B/4,1B/14,5B | 583B (chefe) |  | 39,7K | 620K | 2,8M | 72
7 | Fácil | 100 | 1,4T | 51,9B/4,9B/17,3B | 714B (senhor) |  | 79,8K | 1,2M | 2,8M | 36
7 | Hell | 1 | 27,7T | 998B/94,2B/333B | 14,9T |  | 90,8K | 1,4M | 3,1M | 35
7 | Hell | 50 | 32,8T | 1,1T/112B/394B | 15,7T (chefe) |  | 159K | 2,4M | 3,2M | 20
7 | Hell | 100 | 38,9T | 1,4T/132B/467B | 19,2T (senhor) |  | 319K | 4,9M | 3,2M | 10
8 | Fácil | 1 | 39,7T | 1,4T/135B/477B | 21,4T |  | 91,8K | 1,4M | 13,4M | 146
8 | Fácil | 50 | 56,1T | 2T/191B/674B | 26,9T (chefe) |  | 161K | 2,5M | 13,8M | 86
8 | Fácil | 100 | 79,8T | 2,8T/272B/959B | 39,5T (senhor) |  | 323K | 5M | 14M | 43
8 | Difícil | 1 | 358T | 12,8T/1,2T/4,2T | 193T |  | 230K | 3,5M | 14,8M | 65
8 | Difícil | 50 | 505T | 18,1T/1,7T/6T | 243T (chefe) |  | 402K | 6,2M | 15M | 37
8 | Difícil | 100 | 719T | 25,8T/2,4T/8,6T | 356T (senhor) |  | 808K | 12,6M | 0 | 0
```

## Leitura
- **Dano coerente:** o comum cai em ~1 golpe de quem está na FC recomendada (ATK ≈ 5,5% da FC), igual às eras jogadas; o chefe da fase 50 tira 20% e o Senhor 25% do dano pela DEF; nenhum número passa do teto da regra de coerência (5,5 × FC).
- **Números grandes:** até 2,1Qa (Hell do Celestial) e o dano até ~12Qa: o formatador único cobre até o quintilhão.
- **Drops:** raridade-teto Lendário na era 7 e Divino a partir do Nv 105 (portões do Sys.loot já ligados ao setEra9); asa demoníaca na era 7 e no Hell (Sys.stats.wingForDrop).
- **Economia (para o PO decidir):** abates de ouro para 1 nível de item ficam na faixa da era 2 calibrada (10-50) nas dificuldades altas, mas o COMEÇO de cada era nova é mais duro: era 7 Fácil 1 = ~124 abates, era 8 Fácil 1 = ~146 (era 2 = ~50). É a parede de entrada (itens da era nova). Se o PO quiser suavizar: ouro ×1,5 nas fases 1-30 do Fácil das eras 7-8 (Sys.phases rewardOf; 1 número).
- **Pendência de outra sessão:** os nomes de item por era do Sys.loot (fps-6f) têm 7 eras; para 7-8, usar os nomes de `Sys.eras.ERAS78[i].w/a`.
