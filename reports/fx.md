# FX / Ícones

## Entregue
- `assets/icons/era{0..6}_s{1,2,3}.png`: 21 ícones 256x256, transparentes, moldura redonda (s1 prata, s2 azul, s3 dourada com brilho). ~30 KB cada (631 KB no total).
- `assets/fx/slash.png`, `muzzle.png`, `hit.png`, `crit.png`, `aura.png`: brancos com alfa, ~512 px, 19-148 KB.
- `assets/fx/era{0..6}_ult.png`: 7 ultimates, lado maior 1024 px, 197-306 KB, sem personagem.
- `assets/fx/meta.json`: tamanho, âncora, escala, modo de mistura, duração e dica de animação de cada efeito.
- Todos foram conferidos sobre fundo claro e escuro.

## Como foi feito
- Ícones: 7 folhas (uma por era, 3 ícones em linha sobre magenta) com `assets/hero/era2_t0.png` como referência de estilo; recorte e remoção de fundo locais com sharp.
- Efeitos brancos e ultimates luminosas (0, 1, 2, 4, 6): gerados sobre preto, luminância virou alfa. Regiões escuras cercadas pelo efeito ficam opacas (núcleo do buraco negro, contornos).
- Ultimates opacas (3 canhões, 5 mísseis): geradas sobre verde e recortadas por chroma.
- Os efeitos (itens 2 e 3) foram gerados SEM a imagem de referência, para não arriscar o herói aparecer no sprite; o estilo foi mantido só pelo prompt.

## Créditos
- 20 gerações x 2 = 40 créditos (teto 130). Remoção de fundo foi toda local (0 crédito).
- Saldo da conta: 743,96 no início, 627,65 no fim; a diferença inclui os outros agentes.
- Um job do buraco negro (676bc158) ficou preso em "in_progress" por mais de 8 minutos; gerei um substituto. Se o preso terminar, são 2 créditos já contados acima.

## Pendências / ressalvas
- `era5_ult`: a explosão encosta no canto inferior direito do arquivo (corte reto). Disfarça se ancorada no chão/borda; senão, regenerar.
- `era3_ult`: saíram 3 balas de canhão, não 5.
- `era1_ult`: o raio é cortado no topo de propósito (vem de fora da tela); usar mistura `lighter`.
- `era4_ult`: há manchas azul-escuras em volta do orbe, visíveis em cenário claro.
- `era0_ult`: contorno escuro fino em volta do mamute em cenário claro.
- `hit.png` é uma estrela vazada (só contorno); se quiser preenchida, usar `crit.png` em escala menor.
- era4: a folha veio com meia linha duplicada; os 3 ícones foram recortados com máscara circular (sem brilhos fora da moldura).
- era5_s2: as balas saem um pouco da moldura à direita.

## Recomendações (o que vale animar em vários quadros)
1. `slash` (4-5 quadros): maior ganho, aparece em todo ataque básico das eras 0-2 e 6.
2. `hit` / `crit` (4 quadros de expansão e dissipação): também aparecem o tempo todo.
3. `era2_ult` dragão (6-8 quadros serpenteando) e `era0_ult` mamute (ciclo de corrida de 4-6 quadros): hoje são poses únicas que só deslizam.
4. `era4_ult` tesla (3 quadros de raios diferentes alternados) e `era6_ult` (rotação por código já basta).
5. `muzzle` (2-3 variações sorteadas) e fumaça separada para `era3_ult` / `era5_ult`.
6. Até lá, por código: escala + rotação + esmaecimento, tremor de tela, flash branco de 1 quadro e `aura.png` girando sob o herói quando a ultimate está pronta.
