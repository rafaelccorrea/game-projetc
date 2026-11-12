# RIG mão+arma — relatório

## Feito
- **Armas refeitas** (nano_banana_pro com a arma antiga como referência, fundo verde + recorte local, 1024x1024):
  `assets/weapons/era1_t0.png` (gládio de bronze dourado, vertical, 329 KB) e `era3_t0.png` (pederneira ferro+madeira, sem fragmentos soltos, 454 KB). Gasto: 2 gerações (~4 créditos; teto 15).
- **Calibração medida** dos 21 heróis e 21 armas, gravada em `assets/hero/anchors.json` e `assets/weapons/meta.json`.
- **Validação**: `test/rig/contato.png` (21 composições herói+arma da mesma era/tier, conferidas com Read: nenhuma arma flutuando).

## Convenções (IMPORTANTE para o engenheiro)
- Coordenadas = fração da imagem inteira (herói 512, arma 1024). Ângulos em graus, **0 = aponta para a direita, 90 = para cima** (anti-horário na tela).
- `anchors.json`: `hand` centro do punho direito; `handR` raio do círculo que cobre o punho com contorno (fração da largura; 0,044-0,053); `angle` inclinação do antebraço (cotovelo→punho).
- `meta.json`: `grip` meio do cabo/coronha; `angle` direção grip→ponta (melee) ou do cano (gun); `len` distância do grip até a ponta ao longo do eixo (fração da largura).
  Chaves extras opcionais: `muzzle` [fx,fy] = boca do cano (para o clarão do tiro; hoje o index usa `dh*0.5`); `layer:"back"` = desenhar a arma ATRÁS do herói (era1_t2 por causa das asas, era5_t2 porque a coronha cobria o queixo).
- Rotação a aplicar no canvas (horária, graus) para o eixo da arma ficar no ângulo-alvo A: `rot = angle - A`. Na validação usei A=70 para melee (igual ao descanso atual de 0,35 rad) e A=0 para gun. O `index.html` hoje assume toda arma branca vertical: **somar `(angle-90)°` à rotação** corrige as espadas inclinadas (era0_t2, era2_t1, era2_t2, era6_t2), cujos grips antigos também estavam fora do cabo.
- Ordem de desenho: herói → arma (transladar para `hand`, girar, desenhar com `grip` na origem) → redesenhar o herói recortado por círculo (`hand`,`handR`). Com `layer:"back"`: arma → herói.

## Como foi medido
- Ferramentas em `C:\Users\rafae\AppData\Local\Temp\tools`: `rig.js` (folhas com grade/régua e marcadores, composições, exportação; dados em `rig.json`), `fist.js` (punho), `wkey.js` (recorte de arma).
- Punho: pelo contorno alfa do sprite — borda direita, altura do corpo do punho (platô), estreitamento do pulso; centro = meio entre borda e pulso; ângulo = regressão dos pontos médios do braço. A medição corrigiu a leitura a olho em até ~0,01 (y) e mostrou que o raio real é ~0,05, não 0,045.
- Armas brancas: ângulo pelo eixo principal (PCA) conferido na grade; grip lido na grade e centralizado automaticamente na seção transversal do cabo; `len` calculado pela máscara.
- Armas de fogo: grip, ângulo do cano e `muzzle` lidos na folha com grade de 0,025 e conferidos com marcadores (erro estimado ±0,01; ângulo ±2°). PCA não serve para pistolas (a coronha distorce).

## Casos difíceis
- **era4_t2 (herói)**: a engrenagem das costas funde com o punho na máscara; centro/raio medidos só nas 16 colunas livres e ângulo estimado (5°). Punho também é menor (handR 0,044).
- **era0_t1, era3_t0/t1/t2 (herói)**: punho da manga tão largo quanto a mão → pulso não detectado; largura do punho estimada em 0,86 x altura. era0_t2: ângulo estimado (10°).
- **era1_t2 (arma)**: asas largas; na frente cobriam o rosto → `layer:"back"`.
- **era5_t2 (arma)**: coronha à esquerda do grip cobria queixo/boca → `layer:"back"`. era4_t1 e era5_t1 têm coronha sobre o peito (aceitável na frente).
- **era0_t2 (arma)**: lâmina curva e larga encosta na bochecha no descanso a 70°; usar ~60° se incomodar.
- **era3_t1 (arma)**: cano desenhado 14° para cima; nivelar com `angle`.

## Recomendações
1. Regenerar o herói **era4_t2** sem a engrenagem atrás do braço (ou com ela só nas costas) — é o único punho que não dá para medir bem.
2. Se quiser pegada mais convincente em armas brancas, regenerar os heróis com a **mão direita em pose de empunhadura vertical** (punho com o furo para cima) em vez de soco para a frente; hoje o cabo some inteiro atrás do punho, o que funciona, mas é um truque.
3. Padronizar armas futuras: brancas sempre verticais (ponta para cima), de fogo com cano horizontal; evita depender de `angle`.
4. Durante o golpe (giro de até ~105°) as armas brancas passam sobre o rosto; se incomodar, limitar o arco ou usar `layer:"back"` na fase de recuo.
