# Eonbound — curva das 9 eras (PROPOSTA, nada ligado)

Decisão do dono (via PO, 2026-11-12): terminar a última era (Celestial, era 8) leva ~6 MESES para quem não paga e
~4 MESES para VIP, jogando todo dia, com trava de nível e poder recomendado por era. "Até chegar na última era tem que
ser muito difícil." O plano antigo (60 dias grátis / 41 VIP até a era 6) NÃO vale mais.

Estado: PROPOSTA da coordenação (fps-c9) para fps-e2 e fps-30 fecharem os números dos módulos. Nada disto foi medido no
jogo. Só as eras 0 a 2 têm medida real (calibração v8: 17,7 / 25 / 49 min em x1/x2, antes da redução de XP).

## 1. Calendário-alvo (dias de jogo diário; "jogar todo dia" = ~40 min ativos + offline)

| Era | Nome | Grátis: dias na era | Grátis: dia em que termina | VIP: dias na era | VIP: dia em que termina | Nível para ENTRAR | Nível ao sair |
|---|---|---|---|---|---|---|---|
| 0 | Pré-História | 1 | 1 | 1 | 1 | 1 | 12 |
| 1 | Antiguidade | 3 | 4 | 2 | 3 | 12 | 25 |
| 2 | Medieval | 7 | 11 | 5 | 8 | 25 | 40 |
| 3 | Pólvora | 12 | 23 | 8 | 16 | 40 | 55 |
| 4 | Industrial | 18 | 41 | 12 | 28 | 55 | 70 |
| 5 | Moderna | 25 | 66 | 17 | 45 | 70 | 85 |
| 6 | Futurista | 32 | 98 | 21 | 66 | 85 | 100 |
| 7 | Submundo | 38 | 136 | 25 | 91 | 100 | 110 |
| 8 | Celestial | 44 | 180 | 29 | 120 | 110 | 120 |

- Total: 180 dias grátis, 120 dias VIP (VIP = 2/3 do tempo). A era 0 continua curta (primeira sessão, 15-18 min) para
  o jogador novo ver a troca de era no primeiro dia.
- Cada era custa ~1,2 a 1,7x a anterior; as duas últimas somam 82 dias (46% do total): é onde fica "muito difícil".

## 2. As três travas por era (todas precisam fechar)
1. NÍVEL DO JOGADOR para entrar na era (coluna acima). Bate com os portões de raridade já decididos: Raro 10,
   Épico 25, Mítico 70 (era 4+), Lendário 85 (era 5+), Divino 105 (só eras 7-8). Nível máximo 100 → 120.
2. PODER (FC) RECOMENDADO por fase: o botão "Desafiar" brilha com 90% da FC recomendada; o Senhor da Era pede a FC de
   quem tem os 7 espaços na raridade-teto da era, no nível do jogador, com forja coerente.
3. ITENS: nível do item limitado pelo nível do jogador (já é regra); raridade-teto por era.

## 3. De onde vem o tempo (para não virar "parede")
O tempo da era deve vir de XP diária limitada + materiais diários, não de chefe impossível. Fontes diárias: abates
(farm), missões e bônus das 6 diárias, instâncias (2 por área, +1 VIP), torre, offline (teto de horas), passe.
Regra de bolso: o jogador que joga todo dia sobe o nível da era no prazo da tabela; quem joga o dobro por dia adianta
no máximo ~25% (XP ativa com retorno decrescente ou teto diário de XP de abate).

## 4. De onde vem a vantagem do VIP (1/3 mais rápido), sem sorteio pago
+1 entrada por área nas instâncias, velocidade x2/x4, teto offline maior, XP +% e ouro +% do nível VIP, pedras de
prática em dobro offline (VIP 5+). A soma deve dar ~1,5x de progresso por dia e não mais; conferir que nenhum nível VIP
passa disso sozinho.

## 5. O que cada sessão fecha
- fps-e2 (stats, level, vip, forge, practice, tower, pet, fc): curva de XP por nível 1-120 que bate com a coluna
  "nível ao sair" nos dias da tabela; FC recomendada por era para as 9 eras; teto diário de XP ativa; soma dos bônus VIP
  = ~1,5x; raridade Divino; torre e pets nas eras 7-8.
- fps-30 (loot, chest, instances, pass, mail, login, events): XP e materiais por dia de cada fonte, eras 0-8; drop por
  era até a raridade-teto; passe/temporada ao longo de 6 meses (quantas temporadas); ração dos pets no calendário novo.
- fps-c9: eraMult, crescimento de vida/dano dos inimigos e FC recomendada no docs/balance.json para 9 eras; medição no
  jogo real (hoje só eras 0-2 medidas); tudo atrás de chave até o PO aprovar.

## 6. Riscos a dizer ao PO
- 6 meses não dá para medir jogando: eras 3-8 serão conta + simulação, com medidas reais só nos primeiros dias.
- Sem servidor, o relógio do aparelho pode ser adiantado para pular dias (offline, diárias, instâncias).
- Eras 7 e 8 ainda não têm arte de inimigos, cenário nem ultimate aprovados: a curva pode ficar pronta antes da arte.
- Jogador que para alguns dias fica atrás do calendário: definir se há "recuperação" (offline maior, bônus de retorno).

## 7. Decisões do PO (2026-11-12) sobre a proposta
- Calendário-base aceito para levar ao dono.
- "Jogar todo dia" = ~40 min ativos + offline.
- Era 0 curta (15-18 min): o jogador vê uma troca de era na primeira sessão.
- BÔNUS DE RETORNO: quem falta recebe XP/ouro extra pelos dias perdidos, até 3 dias acumulados (não compensa abandono).
- RELÓGIO: detectar volta/salto do relógio local e não dar recompensa diária duplicada (até existir servidor).
- Eras 7-8: plano desligado até a arte ser aprovada.
- O PO monta a tela Mapa das Eras e o Prólogo com estes números.

## 8. Estrutura decidida pelo dono (2026-11-12)
~100 fases por era em 4 dificuldades (Fácil, Médio, Difícil, Hell); a próxima era libera exigindo dificuldades
crescentes. Números-base: Revisão 2 da fps-e2 em docs/balance-v9.json (bloco rev2) e reports/progressao-9-eras.md.
A tabela da seção 1 (dias por era) continua sendo o alvo de calendário; "10 fases por era" deixa de valer quando ligar.
Liga só depois da v0.12.0 e do protótipo do mapa novo votado, junto com qualidade/fusão e números abreviados.
