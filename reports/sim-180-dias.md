# Simulação de 180 dias com TUDO de 12/11 — grátis × VIP (fps-e2; pedido do PO)
Rodar: `node tools/sim-180-dias.js` (sem ajuste) e `node tools/sim-180-dias.js --scale` (com a proposta). É CONTA: o calendário vem do XP (Sys.level v9 com teto
diário) e a FC do jogador do modelo "mediano" da curva (7 espaços na raridade-teto, item no nível do jogador, forja da era) MAIS os sistemas novos:
títulos (até 70% conquistados no dia 180), pet 17b (8-20% da FC total), montaria (grátis: Rara no Nv 38, Épica na era 5; pagante: o lobo da oferta; estrelas
pela atividade, 1 fragmento/dia), estandartes da guilda (+5% em ~3 meses), VIP (+5 a +10%), qualidade (grátis 3★ médio, VIP 4★ com fusão). Eras 7-8 com o ouro ×1,5.

## Resposta curta
- **Calendário: FECHA igual.** Grátis termina a era 8 no **dia 179**, VIP 5 no **140**, VIP 10 no **121** (meta ~6 / ~4 meses). Nada de hoje dá XP além dos
  territórios da guilda (+5%, dentro do teto diário), então o tempo continua decidido pela trava de nível.
- **Diamantes: ~10,1 mil** em 180 dias para o grátis: 9.980 (aprovado) + ~160 das conquistas que dá para completar (20 das 33) + 0 da atividade, trilha,
  chefe do evento e Códex (sem diamante). Com o ranking online da arena, +~130 (Ouro/Platina) ≈ **10,3 mil**.
- **O ponto que chama atenção: as PAREDES DE FC SOMEM.** Somando os sistemas novos, a FC do jogador típico fica **×1,02 (era 1) a ×1,70 (era 8)** acima do
  modelo da curva (VIP 10: ×1,15 a ×1,78). Resultado: no ponto mais justo de cada era ele fica **1,5 a 2,3× acima da FC recomendada** — nunca trava por
  poder; só a trava de nível segura. Equipamento, forja e qualidade deixam de importar para avançar.
- **Peso de cada fonte no dia 120 (grátis):** títulos +18,7% · pet 17% da FC total · montaria +6% · guilda +5%. Os TÍTULOS são a maior (somam até +40% ATK
  e +37% Vida com todos).

## Proposta de ajuste (pronta no código, atrás de chave)
`Sys.phases.DATA.fcScale` (desligado): multiplica a FC recomendada E os inimigos de cada era pelo multiplicador do grátis típico:
| Era | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| × FC recomendada | 1 | 1 | 1,08 | 1,20 | 1,30 | 1,35 | 1,45 | 1,55 | 1,70 |
**Com o ajuste:** o calendário não muda; nas eras 4-8 o ponto mais justo de cada era fica em **1,07-1,33×** a FC recomendada (parede de verdade, que se
passa com o equipamento em dia); o VIP 10 fica só ~0,05 acima (vantagem pequena, dentro do ≤ 1,5× do dono). Nas eras 0-3 a folga segue grande
(1,7-2,3×): é o começo calibrado no jogo real, sem mudança.
Alternativa (se o PO preferir não mexer nos inimigos): cortar os títulos pela metade (+20% ATK/+18% Vida com todos) e o pet para 6-15% — chega perto, mas
mexe em telas e textos já aprovados.

## Onde passa rápido / onde trava (sem ajuste)
- **Entrada de cada era**: margem 10-30× nos primeiros dias da era nova. Em parte é do modelo (ele supõe os itens da era nova na hora); no jogo o jogador
  troca aos poucos, mas mesmo assim a era nova começa folgada.
- **Mais justo**: fim da Revisão 2 (fase 100 da última dificuldade exigida, o Senhor) e a troca de dificuldade nas eras 4-8. Sem ajuste, mesmo ali sobra.
- **Fim do jogo**: o Juiz Celestial (era 8, Difícil 100) pede 719T; o grátis no Nv 120 chega a ~1,3Qa (×1,8). Com o ajuste: pede 1,2Qa (×1,07).

## Saída da simulação (sem ajuste)
```

GRÁTIS: fim das eras (dia): [1,3,10,22,40,65,97,135,179] | Nv 120 no dia 179 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 166
  dia   1 Nv  15 era 1 Fácil   fase  24 | FC base 16K    com tudo 16K    | rec. 3,4K   | margem ×4.63
  dia   3 Nv  25 era 2 Fácil   fase   1 | FC base 661K   com tudo 697K   | rec. 28,4K  | margem ×24.52
  dia   7 Nv  34 era 2 Médio   fase  21 | FC base 985K   com tudo 1M     | rec. 145K   | margem ×7.4
  dia  14 Nv  45 era 3 Fácil   fase  67 | FC base 17,7M  com tudo 21,2M  | rec. 4,6M   | margem ×4.56
  dia  30 Nv  62 era 4 Médio   fase  41 | FC base 412M   com tudo 538M   | rec. 113M   | margem ×4.75
  dia  45 Nv  73 era 5 Fácil   fase  61 | FC base 11,9B  com tudo 16,1B  | rec. 1,1B   | margem ×13.65
  dia  60 Nv  82 era 5 Difícil fase  41 | FC base 16,8B  com tudo 23,4B  | rec. 8,1B   | margem ×2.86
  dia  90 Nv  96 era 6 Difícil fase  94 | FC base 867B   com tudo 1,2T   | rec. 320B   | margem ×4.03
  dia 120 Nv 106 era 7 Difícil fase  41 | FC base 36,8T  com tudo 57,5T  | rec. 10,6T  | margem ×5.43
  dia 150 Nv 113 era 8 Fácil   fase  90 | FC base 586T   com tudo 987T   | rec. 74,4T  | margem ×13.25
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 719T   | margem ×1.82

VIP 5: fim das eras (dia): [1,3,9,19,33,52,77,106,140] | Nv 120 no dia 140 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 127
  dia   1 Nv  15 era 1 Fácil   fase  24 | FC base 16K    com tudo 17,7K  | rec. 3,4K   | margem ×5.11
  dia   3 Nv  25 era 2 Fácil   fase   1 | FC base 661K   com tudo 771K   | rec. 28,4K  | margem ×27.12
  dia   7 Nv  35 era 2 Médio   fase  34 | FC base 1M     com tudo 1,2M   | rec. 205K   | margem ×6.04
  dia  14 Nv  49 era 3 Médio   fase  21 | FC base 20,1M  com tudo 26,5M  | rec. 5,5M   | margem ×4.82
  dia  30 Nv  68 era 4 Difícil fase  61 | FC base 510M   com tudo 723M   | rec. 393M   | margem ×1.84
  dia  45 Nv  80 era 5 Difícil fase   1 | FC base 14,9B  com tudo 21,8B  | rec. 4,8B   | margem ×4.52
  dia  60 Nv  90 era 6 Médio   fase  34 | FC base 747B   com tudo 1,1T   | rec. 69,1B  | margem ×16.26
  dia  90 Nv 105 era 7 Difícil fase   1 | FC base 36T    com tudo 57,2T  | rec. 9,2T   | margem ×6.2
  dia 120 Nv 114 era 8 Médio   fase  21 | FC base 600T   com tudo 1Qa    | rec. 137T   | margem ×7.54
  dia 150 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 719T   | margem ×1.87
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 719T   | margem ×1.93

VIP 10: fim das eras (dia): [1,3,8,16,28,45,66,92,121] | Nv 120 no dia 121 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 112
  dia   1 Nv  16 era 1 Fácil   fase  31 | FC base 17,4K  com tudo 19,6K  | rec. 4,1K   | margem ×4.7
  dia   3 Nv  26 era 2 Fácil   fase  14 | FC base 692K   com tudo 824K   | rec. 40,1K  | margem ×20.51
  dia   7 Nv  38 era 2 Médio   fase  74 | FC base 1,1M   com tudo 1,4M   | rec. 593K   | margem ×2.39
  dia  14 Nv  52 era 3 Médio   fase  61 | FC base 25,7M  com tudo 34,6M  | rec. 12,3M  | margem ×2.79
  dia  30 Nv  72 era 5 Fácil   fase  41 | FC base 11,6B  com tudo 16,8B  | rec. 909M   | margem ×18.54
  dia  45 Nv  85 era 6 Fácil   fase   1 | FC base 611B   com tudo 908B   | rec. 18,1B  | margem ×49.97
  dia  60 Nv  96 era 6 Difícil fase  94 | FC base 867B   com tudo 1,3T   | rec. 320B   | margem ×4.15
  dia  90 Nv 109 era 7 Hell    fase  61 | FC base 39,4T  com tudo 63,6T  | rec. 34T    | margem ×1.87
  dia 120 Nv 119 era 8 Difícil fase  71 | FC base 736T   com tudo 1,2Qa  | rec. 586T   | margem ×2.2
  dia 150 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 719T   | margem ×1.89
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,4Qa  | rec. 719T   | margem ×1.96
GRÁTIS margem por era (mín-máx): 1:2.33-4.63 2:2.17-24.52 3:2.03-13.92 4:1.53-15.33 5:1.79-27.45 6:1.82-47.71 7:1.83-19.02 8:1.82-20.64
VIP 10 margem por era (mín-máx): 1:1.99-4.70 2:2.39-20.51 3:2.22-15.35 4:1.65-16.74 5:1.90-29.61 6:1.86-49.97 7:1.87-19.43 8:1.84-20.99

Fontes no dia 120 (grátis, Nv 106): títulos +18.7% · montaria +6.0% · guilda +5.0% · pet 17% da FC total
EXTRA GRÁTIS: 1:×1.02 2:×1.08 3:×1.21 4:×1.30 5:×1.36 6:×1.46 7:×1.55 8:×1.70
EXTRA VIP 10: 1:×1.15 2:×1.22 3:×1.33 4:×1.42 5:×1.46 6:×1.52 7:×1.58 8:×1.78
DIAMANTES conquistas (grátis, 180 dias): 160 (20 completas: boss,tower,instance,level,era,fc,stage,activity,login,pets,petStars,petEvo,mountLvl,weaponR,wings,upgrade,forgeLvl,guild,donate,guildBoss)
```

## Saída da simulação (com o ajuste fcScale)
```
GRÁTIS: fim das eras (dia): [1,3,10,22,40,65,97,135,179] | Nv 120 no dia 179 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 139
  dia 120 Nv 106 era 7 Difícil fase  41 | FC base 36,8T  com tudo 57,5T  | rec. 16,4T  | margem ×3.5
  dia 150 Nv 113 era 8 Fácil   fase  90 | FC base 586T   com tudo 987T   | rec. 127T   | margem ×7.8
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 1,2Qa  | margem ×1.07
VIP 5: fim das eras (dia): [1,3,9,19,33,52,77,106,140] | Nv 120 no dia 140 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 105
  dia 120 Nv 114 era 8 Médio   fase  21 | FC base 600T   com tudo 1Qa    | rec. 233T   | margem ×4.43
  dia 150 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 1,2Qa  | margem ×1.1
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 1,2Qa  | margem ×1.13
VIP 10: fim das eras (dia): [1,3,8,16,28,45,66,92,121] | Nv 120 no dia 121 | dias abaixo de 90% da FC rec.: 0 | dias acima de 2×: 93
  dia 120 Nv 119 era 8 Difícil fase  71 | FC base 736T   com tudo 1,2Qa  | rec. 996T   | margem ×1.29
  dia 150 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,3Qa  | rec. 1,2Qa  | margem ×1.11
  dia 180 Nv 120 era 8 Difícil fase 100 | FC base 752T   com tudo 1,4Qa  | rec. 1,2Qa  | margem ×1.15
GRÁTIS margem por era (mín-máx): 1:2.33-4.63 2:2.01-22.70 3:1.69-11.60 4:1.17-11.79 5:1.33-20.33 6:1.25-32.91 7:1.18-12.27 8:1.07-12.14
VIP 10 margem por era (mín-máx): 1:1.99-4.70 2:2.22-18.99 3:1.85-12.79 4:1.27-12.88 5:1.41-21.93 6:1.29-34.46 7:1.20-12.54 8:1.08-12.35
Fontes no dia 120 (grátis, Nv 106): títulos +18.7% · montaria +6.0% · guilda +5.0% · pet 17% da FC total
EXTRA GRÁTIS: 1:×1.02 2:×1.08 3:×1.21 4:×1.30 5:×1.36 6:×1.46 7:×1.55 8:×1.70
EXTRA VIP 10: 1:×1.15 2:×1.22 3:×1.33 4:×1.42 5:×1.46 6:×1.52 7:×1.58 8:×1.78
```

## Itens novos aprovados (13/11): 9 pets, 10 montarias, 8 asas, arco/bumerangue, 10 skins — `node tools/sim-180-dias.js --scale --new`
| | sem os novos | com os novos |
|---|---|---|
| Grátis: fim das eras (dia) | 1,3,10,22,40,65,97,135,179 | **igual** (Nv 120 no dia 179) |
| VIP 5 / VIP 10: Nv 120 | dia 140 / 121 | **igual** |
| Grátis: margem mínima da era 8 | ×1,07 | ×1,08 |
| Dias abaixo de 90% da FC recomendada | 0 | 0 |
| Diamantes novos | — | **0** (nenhum item novo dá diamante; meta ~10 mil intacta) |
Por quê não mexe: o calendário é pelo XP, e nada novo dá XP; pets novos seguem o portão de raridade do ovo (os fragmentos esperam o portão abrir), então
o grátis típico tem a mesma raridade de pet de antes; asas e arco/bumerangue usam o atributo do item (mesmo padrão); montaria é a única que adianta
(Pantera sombria Épica pela arena ~dia 75, Lobo de gelo Mítico pelo torneio de fim de semana ~dia 150): +2 a +2,5 pontos de % de ATK/Vida nesse período.
VIP de conveniência (proposta, Sys.vip.DATA.conv): nenhum benefício dá XP, atributo ou diamante → não entra na simulação.
