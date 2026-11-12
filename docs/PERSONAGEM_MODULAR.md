# Personagem modular (Kael) — proposta da fps-ff para o PO

Pedido do dono (2026-11-12): o jogador troca cada parte separada — só a arma, só o cabelo, só o olho — mantendo o resto da skin.
"Vamos ter que fazer muitas combinações." Retorno sobre a prova: corrida SEM espada aprovada; corrida COM espada e parado COM
espada reprovados ("péssima").

## Por que a espada ficou ruim
1. Braço inteiriço, sem cotovelo: segurar a espada vira um "braço de pau" esticado.
2. A mão é um punho fechado desenhado para o vazio: o cabo passa por baixo do punho, não por dentro dele.
3. A espada fica sempre no mesmo ângulo, sem peso nem balanço.

## Correção da espada (sem mudar a técnica)
- Braço da arma em 3 peças: braço, antebraço (cotovelo dobra) e MÃO EM DUAS CAMADAS: palma atrás do cabo e dedos na frente do
  cabo. Assim o cabo passa por dentro da mão em qualquer arma (a regra do dono "arma na mão" fica garantida pela ordem de desenho).
- Pose de corrida com arma: espada baixa e para trás (ponta para trás, perto do chão) ou apoiada no ombro; escolher na prova.
- Parado com arma: guarda baixa, lâmina inclinada à frente, respiração mexendo o braço junto.
- Armas de fogo: segunda mão no guarda-mão (as duas mãos em duas camadas).

## Camadas (slots) trocáveis, todas no mesmo esqueleto
Ordem de desenho, de trás para frente:
| Slot | Peça | Observação |
|---|---|---|
| hair_back | cabelo de trás | some atrás da cabeça e do cachecol |
| cape | cachecol/capa (3 segmentos) | ondula por código |
| leg_back, leg_front | coxa + canela/bota (com joelho) | roupa da skin |
| arm_back | braço de trás (3 peças) | roupa da skin |
| torso | tronco | roupa da skin |
| head | cabeça BASE: rosto, orelha, pele, SEM olhos/boca/cabelo | uma só para todas as skins (tom de pele é tinta) |
| eyes | olhos (com piscada: aberto/meio/fechado) | trocável; cor por tinta |
| brows, mouth | sobrancelha e boca (expressões: normal, raiva, dor, vitória) | usados no ataque, dano e morte |
| hair_front | franja/cabelo da frente | trocável |
| hat | chapéu/elmo (opcional) | esconde hair_front quando marcado |
| weapon_back_hand | palma | |
| weapon | arma | pelo grip do meta.json |
| weapon_front_hand | dedos | fecha a mão sobre o cabo |
| arm_front | braço da frente | roupa da skin |

Uma skin completa = escolha por slot. As skins atuais (7 eras x 3 tiers) viram conjuntos de roupa (torso, braços, pernas, cape,
hat) e cada uma traz um cabelo e um olho padrão que o jogador pode trocar.

## Combinações e custo
- Gera-se a PEÇA, não a combinação: 10 cabelos x 6 olhos x 21 roupas x 21 armas = 26.460 visuais com só 58 conjuntos de peças.
- Todas as peças seguem um molde fixo (mesma cabeça base, mesmos pontos de encaixe), gerado com a cabeça base como referência.
- Estimativa: cabeça base + olhos/boca/sobrancelha em 4 expressões ≈ 6-10 créditos; cada cabelo ≈ 2 créditos; cada roupa ≈ 2-4
  (com braço em 3 peças e perna com joelho); as armas atuais servem sem gerar nada.

## Prova proposta (precisa de liberação de crédito pelo PO)
Kael era 2 t0 refeito em camadas: cabeça base, 3 cabelos, 3 olhos (com piscar), braço da arma em 3 peças + mão em 2 camadas,
pernas com joelho. Mostrar: correr e parado, com espada era2_t0, era2_t1 e uma arma de fogo (era3), trocando cabelo e olho ao vivo
numa página de teste. Custo estimado: 15-20 créditos.
