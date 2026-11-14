# Equilíbrio com tudo ligado (dificuldade nova + bônus novos)

Sistemas, 14/11. SÓ MEDIDA E PROPOSTA: nenhum número do jogo foi mudado. Código medido: árvore de trabalho sobre 5b493a0 (com as mudanças
não commitadas das outras sessões em js/sys, que eram só de texto, e o trial.js novo da Provação).

Ferramentas novas (em tools/):
- `tools/sim-tudo-ligado.js`: poder dos módulos novos por era (tabela), JSON para a luta (`--tudo`) e o sim-paredes de novo com a FC e o XP
  dos módulos (`--dias [--xp=24] [--semfc] [--sopct]`).
- `tools/cal-tudo.js`: cópia do test/e2e/_cal.js com as medidas `tudo` (onda do Senhor da Era, batalha real quadro a quadro no sandbox) e
  `prov` (Provação do Nv 20+). Aceita `CAL`, `CALR` e `CALB` para testar números sem mexer no balance.json.

## Resumo para o dono

1. **Com tudo ligado o jogador passa voando pelas paredes.** O Senhor da Era, que foi feito para cair em ~33 s, cai em **15 a 23 s** nas eras
   2 a 8. Quem chega com 87% da FC pedida (a parede desenhada, ~1 em 4 venceria) vence **5 de 5** e termina com **29% a 100% da vida**.
2. **O maior culpado são os golpes especiais dos itens** (eras 6-8: combo, contra-ataque, esquiva e roubo de vida batem no teto de chefe). Depois
   vêm as magias do Grimório (+19% a +34% de dano), o "Fraco contra" (+15%) e os % de ATQ/VIDA (+4% a +29%).
3. **A FC mostrada sobe 1,07× (era 0) até 2,1× (era 8)** só pelos módulos novos. No calendário de 180 dias, o grátis terminaria as 9 eras no
   **dia 68 em vez do 178**.
4. **O XP extra (até +24%) passa por cima do teto diário de XP de abate:** sozinho, ele leva o fim das eras do dia 178 para o **151**. O ouro está
   dentro da curva (tools/sim-ouro.js: 1,2, nunca mais rápido).
5. **Proposta:** recalibrar contando com os módulos: FC pedida × o poder que os módulos dão (tabela exata no §5), tempo de matar e de aguentar
   por era, teto menor dos golpes contra chefe e o XP extra antes do teto. **A fase 10 já foi medida com a proposta: 34,5 s (meta 33).**

## 1. Poder dos módulos novos por era (pergunta 1)

"Pior caso razoável" = grátis ATIVO com tudo, no Senhor da Era de cada era, com o nível e o equipamento do herói de referência
(`Sys.stats.refFromFc`). Premissas (no cabeçalho do `tools/sim-tudo-ligado.js`): Provação = 1 por 10 níveis (+1% ATQ e VIDA cada); Mentores
das eras anteriores com 4 marcos e o da era atual com 2; 1 bênção da Encruzilhada (+3% ATQ); Grimório com a magia A das eras vencidas e a B das
eras até a atual, as 3 de dano no nível 1-10 conforme a era; Guilda V2 subindo até 5/5/3% na era 3; Caminho (Nv 30) no estilo que a era é
"Fraco contra"; golpes dos itens = valor esperado do sorteio dos 7 espaços (+ asa) na raridade da era. Já estavam na calibração e NÃO contam
como novos: títulos, prática, pet, montaria, Forja, skins e VIP.

| Era | Nv | Soma ATQ / VIDA / crítico / DEF (pontos %) | FC: só os % | FC: % + golpes | Caminho | Fraco contra | Magias de dano | Combo contra chefe |
|---|---|---|---|---|---|---|---|---|
| 0 | 15 | 4 / 1,4 / 0 / 0 | +2% | +7% | — | ×1,15 (arma) | 0 | 7% |
| 1 | 20 | 7 / 5,8 / 0,6 / 0,6 | +5% | +11% | — | ×1,00 | 2 (Nv 2) ×1,24 | 8% |
| 2 | 31 | 11,7 / 8,8 / 1,2 / 1,8 | +9% | +20% | Disparo | ×1,15 | 3 (Nv 3) ×1,31 | 20% |
| 3 | 44 | 16,2 / 12,4 / 1,4 / 3,4 | +12% | +23% | Arcano | ×1,15 | 3 (Nv 5) ×1,34 | 13% |
| 4 | 68 | 19 / 15,1 / 1,5 / 4,2 | +14% | +34% | Lâmina | ×1,15 | 3 (Nv 6) ×1,32 | 16% |
| 5 | 83 | 21 / 18 / 2,6 / 5,1 | +16% | +38% | Arcano | ×1,15 | 3 (Nv 7) ×1,31 | 22% |
| 6 | 95 | 24,1 / 19,3 / 3,2 / 5,7 | +20% | **+92%** | Disparo | ×1,15 | 3 (Nv 8) ×1,24 | **50% (teto)** |
| 7 | 104 | 27,3 / 21,8 / 3,7 / 5,8 | +23% | **+101%** | Disparo | ×1,15 | 3 (Nv 9) ×1,24 | **50% (teto)** |
| 8 | 113 | 28,8 / 25,2 / 3,8 / 6,6 | +24% | **+110%** | Lâmina | ×1,15 | 3 (Nv 10) ×1,19 | **50% (teto)** |

Fora da FC (não aparecem no número, mas batem): "Fraco contra" ×1,15, o atributo do Caminho (+10% de velocidade ou +20 de dano crítico) e o
dano ativo das magias. Nas eras 6-8 os itens Lendário/Divino trazem 2 golpes cada e a soma bate o teto de chefe: combo 50, contra-ataque 50,
esquiva 20, atordoar 10 e roubo de vida 10.

### Luta real do Senhor da Era (batalha quadro a quadro no sandbox, 5 lutas por caso)

REF = herói de referência da calibração (sem golpes, sem magias; o "Fraco contra" já vale pela arma). TUDO = o mesmo herói com os % acima e o
estado real no save (caminho, 3 magias no conjunto Chefe, golpes dos itens). 87% = chegar na parede desenhada (bossRatio 1,15).

| Era (fase) | killSecAt100 | REF 100% | REF 87% | TUDO 100% | TUDO 87% |
|---|---|---|---|---|---|
| 0 (10) | 33 | 5/5 · 29,3 s · sobra 34% | 3/5 · 33,2 s · 10% | 5/5 · 28,7 s · 52% | 5/5 · 32,9 s · 29% |
| 1 (20) | 33 | 5/5 · 31,5 s · 29% | 1/5 · 34,2 s · 0% | 5/5 · 24,1 s · 69% | 5/5 · 29,3 s · 52% |
| 2 (30) | 33 | 5/5 · 31,4 s · 30% | 2/5 · 35,7 s · 2% | 5/5 · **19,6 s** · 86% | 5/5 · 22,7 s · 76% |
| 3 (40) | 33 | 5/5 · 25,9 s · 38% | 2/5 · 29,2 s · 12% | 5/5 · **17,8 s** · 85% | 5/5 · 18,8 s · 77% |
| 4 (50) | 33 | 3/5 · 25,1 s · 42% | 1/5 · 33,4 s · 5% | 5/5 · **17,8 s** · 100% | 5/5 · 16,5 s · 100% |
| 5 (60) | 32 | 4/5 · 32,9 s · 21% | 2/5 · 35,2 s · 8% | 5/5 · **17,6 s** · 95% | 5/5 · 18,5 s · 95% |
| 6 (70) | 33 | 5/5 · 28,7 s · 39% | 4/5 · 32,8 s · 9% | 5/5 · **16,1 s** · 100% | 5/5 · 18,9 s · 100% |
| 7 (80) | 33 | 5/5 · 30,8 s · 29% | 2/5 · 29,8 s · 19% | 5/5 · **15,7 s** · 100% | 5/5 · 15,4 s · 100% |
| 8 (90) | 33 | 5/5 · 26,5 s · 38% | 4/5 · 29,2 s · 12% | 5/5 · **16,7 s** · 100% | 5/5 · 18,7 s · 100% |

- **Sem os módulos (REF) a parede funciona:** chegar com 87% vence 1 a 4 de 5. **Com eles (TUDO) não existe parede:** 87% vence sempre.
- Eras 0, 6 e 8 já caem um pouco antes do alvo mesmo no REF (26-29 s): a calibração foi feita (daded32, 13/11 22:00) antes do "Fraco contra" ligar.
- O Engenheiro viu o mesmo no test/e2e/diff.js: fase 10 em 22,7 / 26,2 / 28,0 / 35,3 s (alvo 33 ±15%).

## 2. Ouro e XP (pergunta 2)

- **Ouro:** `node tools/sim-ouro.js` → "Proposta inteira (C) ÷ curva calibrada (L): menor razão = **1,2** (nunca mais rápido que a curva)". C é o
  jogo de hoje (o offline de 8 h = 60 min já está no js/meta.js e no js/p_intro.js) com todas as fontes novas e o teto de +25%. **Sem risco.**
- **XP: precisa de simulação, e foi feita.** O `Sys.level.addXp` aplica o XP extra (Encruzilhada "Saber das Eras" +6%, Fogueira da Guilda até
  +3%, territórios da Guilda até +5%, ouro acima dos tetos até +10% = **até +24%**) **depois** do teto diário de XP de abate. Ou seja, o teto que
  segura as paredes em dias fica 24% maior. Rodando o sim-paredes de novo (`tools/sim-tudo-ligado.js --dias`):

| Cenário (grátis ativo) | Fim das 9 eras | Dias em parede | VIP 10 |
|---|---|---|---|
| Hoje (calibração) | dia 178 | 79 | dia 121 |
| Só XP +10% | 166 | 61 | 110 |
| Só XP +24% | 151 | 58 | 101 |
| Só a FC dos % (sem golpes) | 160 | 91 | 106 |
| Só a FC com golpes | 78 | 31 | 53 |
| **Tudo (FC com golpes + XP +24%)** | **68** | **29** | **44** |

## 3. Provação do Nv 20 em diante (pergunta 3)

**Não medida na batalha.** A medida `prov` está pronta no `tools/cal-tudo.js` (`TUDO=... node tools/cal-tudo.js --medida=prov:20,30,40,50,60,70,80,90,100,110,120/4:eras9`),
mas a rodada 3 da recalibração foi parada pelo sistema por falta de memória do PC e não rodei mais nada pesado. Estimativa pela conta do módulo:

- O mestre (trial.js novo, f69756f) = chefe da campanha (`diffBoss`) da fase mais alta vencida × Vida 1,2, sozinho, **sem fúria** (o `diffStep` não
  roda em instância). Sem as escoltas, o chefe da onda leva ~33 ÷ 1,2 = 27,5 s; ×1,2 = **~33 s para o herói de referência com 100% da FC**.
- **Risco: as regras "Só 30 s" caem no Nv 20, 70 e 120.** O herói de referência levaria ~33 s e perderia no tempo. O herói típico COM os módulos
  bate 30-45% mais rápido (tabela do §1) e venceria em ~19-25 s. Ou seja, a Provação do Nv 20+ hoje é fácil para quem tem os módulos e pode ser
  impossível no tempo para quem não tem.
- Proposta (a medir antes de ligar): `trial.enemyAt` com `{20:{hpMul:1.0},70:{hpMul:1.0},120:{hpMul:1.0}}` (Só 30 s) e manter 1,2 nas outras,
  conferindo na medida `prov` que o REF vence em ≤ 28 s.

## 4. Riscos

| # | O quê | Quanto | Em que fase |
|---|---|---|---|
| R1 | Paredes do Senhor da Era somem | 87% da FC vence 5/5; Senhor cai em 15-23 s (meta 33) | eras 2-8 (fases 30-90) |
| R2 | Golpes especiais no teto de chefe | combo 50 / contra 50 / esquiva 20 / roubo 10; herói termina com ~100% da vida; FC ×1,9-2,1 | eras 6-8 (fases 61-90) |
| R3 | FC mostrada inflada contra a FC pedida | ×1,07 a ×2,10; o "Desafiar" e o cartão de conselho ficam sem sentido | todas, forte da era 6 |
| R4 | XP extra fura o teto diário de abate | +24% → fim das eras dia 178 → 151 (só isso) | eras 2+ (guilda, Encruzilhada, ouro acima do teto) |
| R5 | `earlyDmg`/`earlyBossDmg` não fazem nada com a dificuldade ligada | o `mkEnemy` usa o dano do `diffEnemy` e só multiplica pelo early no ramo antigo; o js/diff.js não lê o early | fases 1-10 |
| R6 | Calibração antiga sem o "Fraco contra" | REF já cai em 26-29 s nas eras 0, 6 e 8 | fases 10, 70, 90 |
| R7 | Provação "Só 30 s" | mestre ~33 s para o herói sem módulos | Nv 20, 70, 120 |
| R8 | Calendário inteiro | grátis termina no dia 68 (meta 180), VIP 10 no 44 (meta ~121) | jogo inteiro |

## 5. Proposta de números (recalibrar CONTANDO com os módulos; decisão do PO 14/11)

**P1. FC pedida × o poder dos módulos (`dificuldade.recFc`).** A FC pedida passa a ser a FC que o grátis ativo tem COM os módulos. A vida e o
dano do chefe acompanham sozinhos (saem da FC pedida pelo herói de referência). Fator por era (FC com % + golpes): 1,073 / 1,113 / 1,202 / 1,233 /
1,342 / 1,379 / 1,917 / 2,010 / 2,103. Nas fases 1-4 fica o valor de hoje (jogador novo ainda não tem módulo nenhum). Valores exatos (90 fases):

```
[210,272,352,455,632,818,1060,1370,1770,1880,17600,17600,19100,19100,20300,20300,21500,21500,21500,23600,177000,188000,197000,208000,222000,288000,375000,488000,520000,599000,9360000,10200000,10700000,11200000,12200000,12700000,13200000,14700000,15400000,17800000,220000000,238000000,266000000,319000000,342000000,374000000,399000000,424000000,486000000,558000000,5280000000,6870000000,8920000000,11100000000,11800000000,12400000000,12700000000,13100000000,14500000000,16700000000,412000000000,433000000000,447000000000,462000000000,514000000000,529000000000,544000000000,562000000000,579000000000,665000000000,13600000000000,14000000000000,14500000000000,14900000000000,15900000000000,15800000000000,16600000000000,17000000000000,17500000000000,20100000000000,433000000000000,446000000000000,458000000000000,471000000000000,505000000000000,498000000000000,513000000000000,528000000000000,530000000000000,610000000000000]
```

Medido só com P1 (rodada 2, TUDO, 4 lutas): era 0 29,1 s · era 1 27,2 · era 2 23,0 · era 3 18,6 · era 4 20,9 · era 5 20,1 · era 6 29,3 · era 7 24,8 ·
era 8 30,6 s, e o herói ainda termina com 45-100% da vida e vence 4/4 com 90%. Falta o que não está na FC (Fraco contra, magias, caminho) e a vida.

**P2. Tempo de matar e de aguentar por era (`dificuldade.boss`)**, junto com P1. Conta: killSec novo = 33 × 33 ÷ tempo medido na rodada 2;
aguentar mais curto onde o herói sobra com 90-100% da vida:

```
"killSecAt100":   [37, 40, 47, 59, 52, 54, 37, 44, 36]
"surviveSecAt100":[36, 34, 30, 30, 22, 24, 18, 18, 18]
```

Medido (rodada 3, 4 lutas): **era 0 / fase 10: 100% vence 4/4 em 34,5 s com 19% de vida; 90% vence 3/4.** Antes: 28,7 s e 52% de vida
(meta da calibração: 100% ~10/12 em ~33 s, 90% ~metade). **Eras 1-8: NÃO medidas** (a rodada foi parada por falta de memória). Para fechar:
`TUDO="$(node tools/sim-tudo-ligado.js --tudo)" SO_TUDO=1 CALR='[1.073,1.113,1.202,1.233,1.342,1.379,1.917,2.010,2.103]' CAL='{"killSecAt100":[37,40,47,59,52,54,37,44,36],"surviveSecAt100":[36,34,30,30,22,24,18,18,18]}' node tools/cal-tudo.js --medida=tudo:1,2,3,4,5,6,7,8/6:eras9`
e ajustar cada era por killSec × 33 ÷ tempo medido. A fúria (`furyAtSec`) fica como está: a luta volta a durar ~33 s.

**P3. Teto dos golpes contra chefe (`Sys.strikes.DATA.bossCap`, fora do balance.json):** combo 50 → 30, contra-ataque 50 → 30, esquiva 20 → 10,
roubo de vida 10 → 5. Sem isso o P2 precisa de "aguentar" de 18 s nas eras 6-8, o que deixa o chefe duro demais para quem NÃO tem os golpes
(o jogador que não troca de item). Com P3 o surviveSecAt100 das eras 6-8 pode voltar para ~26 (estimativa; medir).

**P4. XP extra antes do teto de abate (`Sys.level.addXp`):** aplicar o `xpPerkPct` antes do `killCredit` (o teto do dia corta o total já com
bônus), ou somar o XP extra com teto de +10%. Efeito no calendário: +24% fora do teto → dia 151; +10% → dia 166; antes do teto → ~178.

**P5. `earlyDmg`/`earlyBossDmg`:** hoje são chaves mortas com a dificuldade ligada. Proposta: o js/diff.js multiplicar o dano do `diffBoss` por
`earlyBossDmg[fase-1]` e o dos comuns por `earlyDmg[fase-1]`, mas com os valores **todos em 1** (o começo já foi calibrado sem eles). Não proponho
outro valor sem a medida da fase 5 (§6).

## 6. Fase 5: "trivial no Nv 8, impossível no Nv 5" (pergunta do QA)

- **Nível esperado:** o herói de referência (`Sys.stats.DATA.refFc.lv`) tem **Nv 12 na fase 5** (fases 1-10: 8, 10, 11, 12, 12, 13, 13, 14, 14, 15).
  O robô da Provação (scratchpad/trial/probe.js) chegou ao **Nv 10 por volta da fase 7**, ou seja, **~Nv 8-9 na fase 5**.
- **Leitura:** o Nv 5 na fase 5 está **fora da curva** (3-4 níveis abaixo do robô e 7 abaixo da referência): só acontece pulando o farm das fases
  1-4. Como o chefe sai da FC pedida e a FC sobe com o nível, isso é a parede funcionando, não um defeito.
- **Não medido com o robô nesta sessão** (o PC estava sem memória; não rodei o probe.js). Para confirmar: `node .../scratchpad/trial/probe.js 1500`
  e ler o Nv nas linhas da fase 5. Se o robô chegar na fase 5 abaixo do Nv 7, aí é parede real e a proposta é baixar só a fase 5:
  `recFc[4]` 589 → 530 (−10%), sem mexer no `earlyBossDmg` (que hoje não vale, R5).

## 7. O que não foi medido (honestidade)

- Eras 1-8 com a proposta P1+P2 e qualquer coisa com P3/P4: falta rodar (memória do PC).
- Provação do Nv 20+: só estimativa (§3).
- Robô até a fase 5: não rodado (§6).
- Golpes dos itens usam o valor esperado (q = 0,5); um jogador com sorte passa disso, um que não troca de item fica abaixo.

## 8. Aplicado (recal2, 14/11, parcial: só a era 1)

Código medido: P3 (bossCap 30/30/10/5) e o piso do golpe do comum (`commons.minHitPctOfRefHp` 0,025, já lido pelo js/diff.js) ligados.
Medida: `tools/cal-tudo.js --medida=tudo`, 4 lutas por caso, com a env nova `CASOS=T100,T90,R100,RN100` (T = com os módulos; R = sem os módulos
com o mesmo progresso, ou seja ~90% da FC pedida nova; RN = sem os módulos com 100% da FC pedida nova).

**Aplicado no balance.json (era 1):** recFc das fases 11-20 × 1,113 (17600 ... 23600), `killSecAt100[1]` 33 → 34, `surviveSecAt100[1]` fica 40.

| Era 1 (fase 20) | com módulos 100% | com módulos 90% | sem módulos, mesmo progresso | sem módulos, 100% da FC nova |
|---|---|---|---|---|
| P2 proposto (kill 40, aguentar 34) | 2/4 · 36,6 s · 14% | 0/4 | 0/4 | 1/4 · 35,7 s |
| kill 36, aguentar 38 | 4/4 · 34,9 s · 22% | 3/4 · 34,8 s | 0/4 | 0/4 |
| **kill 34, aguentar 40 (aplicado)** | **4/4 · 28,4 s · 41%** | **4/4 · 33,1 s · 20%** | 0/4 | **3/4 · 36,3 s · 3%** |

Conflito (para o PO): com kill 36 o "com módulos" fica em ~35 s, mas o sem módulos com 100% da FC não vence nenhuma; com kill 34 o sem
módulos vence 3/4 e o com módulos fica fácil (28 s, e 90% vence 4/4). Apliquei o 34 (prioridade: sem módulos não ficar sem saída).

**Eras 3-5 com o P2 proposto (kill 59/52/54, aguentar 30/22/24) e P3:** o P2 ficou DURO demais depois do P3 (golpes menores contra o chefe):
era 3 com módulos 0/4 (cai aos 37 s), 90% 0/4, sem módulos 0/4 (30 s) · era 4 0/4 (32 s), 0/4, 0/4 (21 s) · era 5 1/4 em 34,8 s, 0/4, 0/4 (27 s).
Ou seja, o P2 não serve como está: o aguentar curto (22-30 s) mata todo mundo antes da fúria. Próxima tentativa: kill ~34 e aguentar 40 em
todas as eras (como a era 1), medindo era a era.

**Não aplicado (não medido):** eras 2 e 6-8, e os números finais das eras 3-5. A rodada "kill 34 / aguentar 40" das eras 2-8 foi parada pelo
sistema por falta de memória do PC (memória livre medida entre 3,2 e 4,7 GB antes de cada era; a queda foi de outro processo enquanto rodava).
Calendário (~178 dias) e diff.js: não refeitos.
