# Pós-eras: o que vem depois da fase 90 (proposta, DESLIGADA)

Regra do dono (13/11): "acabar as eras não quer dizer que o jogo acabou". A fase 90 é o **fim das 9 eras**, não o fim do jogo.
Números no `docs/balance.json`, bloco `posEras` (`on: false`). Simulação: `node tools/sim-paredes.js --late --trainmul --train=2 --traincap=200 --pos`.
Nada sorteado, nada pago, nenhuma compra de poder.

## Regra das fases sem fim

- Depois da fase 90, a FC pedida sobe **3% por fase** (`afterLastGrowth 1,03`, já combinado).
- A cada 10 fases (100, 110, 120...) há um **marco**: pede 4% a mais, como um Senhor de era pequeno. É uma parede curta, de no máximo ~5 dias.
- As fases não acabam: depois da 150 a regra continua a mesma.

## O que o jogador persegue

| Meta | Como funciona | Por que força a evoluir |
|---|---|---|
| Marcos a cada 10 fases | Título "Marco 100", "Marco 110"... com +1% ATQ e +1% VIDA cada, até o 150. Mais 30 diamantes por marco. Moldura "Além das Eras" no 100 e "Sem Fim" no 150 (só visual) | Prêmio pequeno e visível; o próximo marco aparece sempre na tela |
| Forja Astral +21 a +25 | Cada marco libera +1 nível (100 → +21, ..., 140 → +25). A pedra astral só cai nas fases sem fim | Cada nível vale ~+7% de FC; o nível nunca anda na frente do progresso |
| Pet do nível 121 ao 150 | Sobe com ração, ~1 nível por dia jogado. A parte do pet na FC vai de x1,25 a x1,40 | Continua dando motivo para alimentar todo dia |
| Treino diário sem teto | Até x3 o treino segue em +2% por dia. Depois da fase 90, acima do teto, +1,5% por dia, composto, sem limite | É o que garante que nenhuma fase vire parede impossível: a fase pede +3% e o treino dá +1,5% por dia, cerca de 2 dias por fase no longo prazo |
| Ranking das fases sem fim | Por servidor, toda semana; vale a fase mais alta (empate: quem chegou primeiro). 1º lugar: 50 diamantes e selo visual; top 10: 30; top 100: 15 | Disputa social sem poder pago. Precisa do Servidor quando ligar |
| Torneio e Arena | O fim de jogo social. A Arena já tem teto por era, e quem passou da 90 enfrenta outros jogadores da era 8 | Sem mudança de números |
| Montaria | Continua até 7 estrelas (teto aprovado) | Nada novo |

## Simulação: em que dia o jogador vence cada fase

| Jogador | Dia em que termina as 9 eras | Fase 100 | Fase 110 | Fase 120 | Fase 150 | Maior espera numa fase |
|---|---|---|---|---|---|---|
| Grátis ativo | 178 | dia 192 | dia 199 | dia 210 | dia 255 | 4,7 dias |
| VIP 5 | 136 | dia 150 | dia 156 | dia 166 | dia 211 | 4,7 dias |
| VIP 10 | 118 | dia 131 | dia 137 | dia 148 | dia 192 | 4,7 dias |

- Nenhuma parede impossível: a maior espera, no marco da 150, é de 4,7 dias, a mesma faixa das paredes das eras 5-8 (3-5 dias).
- O VIP 10 chega à fase 150 no dia 192, mais ou menos quando o grátis chega à fase 100. A diferença é de ritmo, não de teto.
- Ajustes testados:

  | Treino acima do teto | Marco | Grátis chega à fase 150 | Maior espera numa fase |
  |---|---|---|---|
  | +1% por dia | ×1,05 | dia 295 | 7,9 dias (longo demais) |
  | +2% por dia | ×1,05 | dia 236 | 4 dias (rápido demais) |
  | +1,5% por dia | ×1,04 | dia 255 | 4,7 dias (escolhido) |

## Ressalvas

- Depende do pacote das últimas eras (`setLateGame`) e da medida do Engenheiro na APK v0.13.1 (100% da FC vence o Senhor). Liga só depois disso e da aprovação do dono.
- Um treino sem teto faz a FC de quem joga há muito tempo crescer sempre. Na Arena isso fica contido pelo teto por era. Se o dono quiser, dá para limitar o treino que conta na Arena; não está nesta proposta.
- O título de marco dá bônus só até o 150. Do 160 em diante só muda o nome, para o poder não fugir.
