# Calibração no JOGO REAL — docs/balance.json v8 (2026-11-12)

Agente de calibração. Editei só `docs/balance.json` (v7.3 → v8) e este relatório. Nada em index.html, js/** ou assets/**.
`docs/RECOMENDACOES.md` (seção 4) ganhou o resumo "Rodada 8". O disco C: ficou com 0 byte livre no fim da rodada e cortou as últimas medidas (ver "Não medido").

## Como foi medido

- Página do próprio jogo em `http://localhost:8080/?debug=1&fresh=1` (jogo novo isolado, não toca o save), dentro de um iframe na aba CALIBRACAO.
  Laço acelerado chamando o `step(1/30)` do jogo, sem desenho. Roteiro: `C:\Users\rafae\AppData\Local\Temp\tools\calib\driver.js`.
- **Builds:** "antes" medido na **v0.9**; "depois" (lido do arquivo, sem nada sobrescrito em memória) medido na **v0.10**. **Tudo ANTES da v0.11**
  (folhas de ataque no quadro do golpe, intervalo 1,17-1,36 s): a v0.11 NÃO foi medida.
- **Tempo = relógio do jogador** = tempo de jogo ÷ velocidade, pela regra nova do dono: grátis em **x1 até o nível 15, x2 depois**. O "antes" também
  foi medido com essa regra (por isso difere do QA, que mediu tudo em x2).
- A página estava em edição pelo engenheiro: `track` e `addPxp` (missões/passe antigos) sumiram do index.html durante as medidas; o roteiro pôs
  substitutos vazios só na memória do iframe de teste. Missões e passe não entram nas medidas.
- Política "melhorando" (a cada 2 s de jogo): invocação grátis do dia, abre o baú de toque, equipa o melhor item de cada espaço pela "FC no seu
  nível", desmonta o resto, sobe com ouro o equipado mais barato, x10 quando tudo está no teto e o ouro dá.
- Perfis (5 partidas cada, mediana · pior caso): **A** melhora e desafia sempre (a cada 2 s, sem esperar) · **B** melhora e só desafia com o botão
  brilhando (FC ≥ 90% da recomendada) · **C** não melhora nem invoca, desafia sempre.

## Metas do PO: resultado medido com o arquivo v8 (perfil B, 5 partidas)

| Meta | Resultado | Números |
|---|---|---|
| 1. Era 0 em 15-18 min | **SIM** (mediana), pior caso 0,9 min acima | 17,7 min · pior 18,9; 1 derrota; nível 12 |
| 2. Nenhuma parede (≤ 3 derrotas por fase, desafiando com a FC recomendada) | **SIM em 29 das 30 fases; NÃO na fase 24** em 1 de 5 partidas | pior caso por fase: 0 a 3; fase 24: 6 derrotas em 1 partida |
| 3. FC recomendada honesta e alcançável | **SIM** nas eras 0-2 | o chefe cai na 1ª ou 2ª tentativa com o botão brilhando; farm até brilhar: 1 a 8 min por fase (fase 29: 9,7 · 16,3; fase 30: 17,5 · 25,2) |
| 4. Nível ~11 no fim da era 0 e 26-27 no fim da era 2 | **SIM / quase** | 12 no fim da era 0; 17 na era 1; 26 (máx. 28) na era 2 — SEM mexer na XP |
| 5. Era 1 ~40-50 min, era 2 ~1,5-2 h | **NÃO** | era 1: 25,4 min · pior 25,8; era 2: 48,9 min · pior 61,7. O tempo cresce de era para era (17,7 → 25,4 → 48,9), mas fica na metade do pedido |
| 6. Golpe básico e x2 | não mexi | ATENÇÃO: no jogo o básico do herói sai a cada 0,8 s (`Sys.stats.DATA.baseInterval`), não 1,2 s; 1,2 s é o intervalo dos inimigos comuns |

**Nível 15 (troca de x1 para x2):** chega aos 34-35 min de relógio, na fase 18 (1 partida na 19). Dali em diante o relógio anda na metade do
tempo de jogo: a fase 18 leva 8,0 min de relógio e as fases 19 e 20, já em x2, 2,8 e 4,7 min.

**Problemas que ficam (não resolvidos):**
1. **Perfil A (desafia sempre, sem esperar o brilho) piorou:** era 1 em 57 min com 186 derrotas, era 2 em 144 min com ~870 derrotas (1 de 5 não
   terminou em 240 min). Antes: 11 e 257. Quem desafia de 2 em 2 s quase não farma e só passa por sorte; a v8 exige mais FC nas fases finais.
   Com a FC abaixo da recomendada o chefe quase nunca cai (A vence a fase 20 com ~13.600 contra 19.300 recomendada, depois de ~96 tentativas).
2. **Perfil C (sem melhorar) piorou muito:** 1 partida medida na v8 (as outras 4 se perderam com o disco cheio): Senhor da Era 0 só aos 91 min, com
   86 derrotas; parou na fase 18 aos 120 min. Antes: era 0 em 9,4 min com 2 derrotas, parando na fase 19-20 com ~830 derrotas em 150 min.
   O Senhor da Era 0 da v8 pede FC ~1.500 e quem não melhora chega com ~960.
3. Fase 30: até 9 mortes para inimigos COMUNS durante o farm (pior caso), fase 29: até 3.
4. Meta 5 depende da XP por abate (módulo da fps-30, abaixo): a medida com a XP nova em memória NÃO foi concluída.

## Causa de cada problema (medida na v7.3)

- **B1, parede na fase 21.** Na troca da era 1 para a 2 o inimigo dava um salto de ×2,37 em vida E dano (eraMult 0,777 → 1,44, vezes 1,282 da
  fase), enquanto a FC recomendada, interpolada entre as âncoras de fim de era, subia só ×1,41. Herói ao morrer (nível 14, FC 8.825, ATK 535,
  HP 3.330, DEF 313) contra o chefe da fase 21 (HP 27.334, 1.305 por golpe a cada 1,15 s): o herói morre em ~3 golpes (~3,5 s, a DEF tira ~11%) e
  precisaria de ~20 s para matar; o chefe estava com 98% da vida. A FC que de fato vence é ~25.500-34.000; a tabela dizia 17.401. O botão
  brilhava cedo demais e o jogador morria em laço: 34 derrotas (pior 64) no perfil A, 7 (pior 55) no B.
- **B2, quem espera o brilho fica preso no Senhor da Era 1.** Com a minha política o perfil B PASSOU na v7.3 (era 1 em 17,8 min, 1 derrota na
  fase 20, FC 11.316 de 12.300). A trava do QA aparece para quem só sobe os itens equipados: com os itens no teto (teto = nível do jogador), a FC
  só cresce com o nível, e cada nível na era 1 pede 1.351-1.609 de XP (~250-300 abates). Além disso a tabela v7.3 estava torta: baixa demais no
  começo da era 2 e alta demais no fim (o Senhor da Era 2 caía na 1ª tentativa com FC 261 mil contra 395 mil recomendada).
- **Era 0 rápida (8,7 min em x1).** O herói mata com sobra: mais vida nos inimigos quase não muda o tempo (vida ×3,8 com dano ÷4 deu 13,5 min).
  O que alonga é o Senhor da Era pedir ~1 nível a mais (farm de ~5-6 min na fase 10).
- **Nível.** Sem morrer em laço o nível fica ABAIXO da meta, não acima: 11 / 15 / 21 na v7.3 (perfil B). O "34 no fim da era 2" vinha de horas de
  derrota repetida.

## O que mudou em docs/balance.json (chave, antigo, novo)

| Chave | Antigo (v7.3) | Novo (v8) |
|---|---|---|
| `versao` | balance-v7.3 | balance-v8 |
| `BAL.enemyHpGrowth` | 1,282 | 1,4 |
| `BAL.enemyDmgGrowth` | 1,282 | 1,4 |
| `BAL.eraMult` | 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161 | 0,245 · 0,26 · 0,17 · 0,17 · 0,17 · 0,17 · 0,17 |
| `BAL.earlyEase` (multiplicador de VIDA por fase; o dano não muda) | 0,5 · 0,65 · 0,8 (fases 1-3) | 70 valores: fases 1-10 = 5 · 6 · 7 · 8 · 8 · 7,5 · 7 · 6,5 · 6 · 6; fases 11-20 = 1; fases 21-70 = 1,5 |
| `tower.fc_mediana_do_gratis_no_fim_de_cada_era` (FC recomendada) | 1.440 · 12.300 · 395 mil · 13,9 mi · 829 mi · 34,3 bi · 1,54 tri | 1.650 · 19.300 · 433 mil · 12,5 mi · 362 mi · 10,5 bi · 302 bi |
| `calibracao_v8` | não existia | bloco novo com antigo/novo e o que não foi medido |

Ideia: o inimigo cresce ×1,4 por fase sem salto na troca de era (eraMult quase constante), e a FC recomendada cresce no mesmo passo; assim a
interpolação do jogo fica honesta em todas as fases. Na era 0 os inimigos têm mais vida e menos dano (fases mais longas, sem risco no começo).
Cópia do arquivo anterior: `C:\Users\rafae\AppData\Local\Temp\tools\calib\balance_v7.3_backup.json`. O arquivo foi regravado com outra
formatação (2 espaços); o conteúdo dos outros blocos não mudou. **Eras 3 a 6: eraMult 0,17 e FC recomendada são EXTRAPOLAÇÃO, não medidos.**

## O que precisa mudar em DATA de módulo (NÃO apliquei)

| Dona | Chave | Antigo | Novo proposto | Estado |
|---|---|---|---|---|
| fps-30 (loot.js) | `Sys.loot.DATA.xp.eraScale` | 1 | 0,15 (kill 2,2, boss 33 e eraBoss 264 ficam) | **NÃO MEDIDO**: estimativa. Reduz a XP a 57% na era 1 e 43% na era 2 sem tocar na era 0; pela conta de abates deve levar a era 1 a ~45 min e a era 2 a ~100 min com os mesmos níveis (17 e 26). A medida em memória estava na fila quando o disco encheu. Muda também as eras 3-6. |
| fps-30 (loot.js) | `Sys.loot.DATA.xp.kill` | 2,2 | sem mudança | com a v8 o nível já fica em 12 / 17 / 26 sem baixar a XP da era 0 |
| fps-e2 (stats/level/fc) | nenhuma | | | curva v8 do item e custo v8 ficam |
| engenheiro (index.html) | `recFC` | 7 âncoras de fim de era, interpolação geométrica | sugestão: tabela por fase | hoje só dá para acertar a FC recomendada por âncora de era; `REC_FC0 = 264` é fixo no código |

## Tabelas por fase — DEPOIS (v8 lido do arquivo, build v0.10)

Tempo em minutos de relógio do jogador. "FC ao vencer" = FC logo depois de passar a fase.

### Perfil B (melhora, desafia só com o brilho) — 5 partidas, todas terminaram
Era 0: 17,7 · pior 18,9 min; 1 derrota; nível 12; FC 1.567. Era 1: 25,4 · pior 25,8 min; 8 derrotas acumuladas (pior 9); nível 17; FC 17.605.
Era 2: 48,9 · pior 61,7 min; 25 derrotas acumuladas (pior 30); nível 26 (máx. 28); FC 412.876. Total 91,2 min.

| Fase | Tempo (med · pior) | Derrotas p/ chefe (med · pior) | Mortes p/ comuns (pior) | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,66 · 0,75 | 0 · 0 | 0 | 3 | 406 | 317 |
| 2 | 0,66 · 0,76 | 0 · 0 | 0 | 4 | 492 | 381 |
| 3 | 0,97 · 1,01 | 0 · 0 | 0 | 5 | 617 | 457 |
| 4 | 1,02 · 1,06 | 0 · 0 | 0 | 6 | 701 | 549 |
| 5 | 1,08 · 1,13 | 0 · 0 | 0 | 7 | 782 | 660 |
| 6 | 1,17 · 1,23 | 0 · 0 | 0 | 8 | 881 | 793 |
| 7 | 1,24 · 1,44 | 0 · 0 | 0 | 9 | 960 | 952 |
| 8 | 1,39 · 1,61 | 0 · 0 | 0 | 10 | 1.059 | 1.144 |
| 9 | 1,68 · 2,01 | 0 · 0 | 0 | 10 | 1.138 | 1.374 |
| 10 | 7,93 · 8,15 | 1 · 1 | 0 | 12 | 1.567 | 1.650 |
| 11 | 0,64 · 0,73 | 0 · 0 | 0 | 12 | 1.625 | 2.110 |
| 12 | 0,68 · 0,8 | 0 · 0 | 0 | 12 | 2.178 | 2.698 |
| 13 | 0,97 · 1 | 0 · 0 | 0 | 12 | 2.649 | 3.451 |
| 14 | 1,03 · 5,26 | 0 · 1 | 0 | 13 | 4.225 | 4.413 |
| 15 | 0,99 · 1,03 | 0 · 0 | 0 | 13 | 5.121 | 5.643 |
| 16 | 5,14 · 7,82 | 1 · 1 | 0 | 14 | 6.761 | 7.217 |
| 17 | 0,98 · 3,25 | 0 · 1 | 0 | 14 | 7.850 | 9.229 |
| 18 | 8,01 · 8,41 | 1 · 1 | 1 | 15 | 10.698 | 11.802 |
| 19 | 2,84 · 4,81 | 1 · 2 | 0 | 16 | 13.746 | 15.092 |
| 20 | 4,71 · 5,1 | 2 · 2 | 2 | 17 | 17.605 | 19.300 |
| 21 | 0,48 · 1,88 | 0 · 1 | 0 | 17 | 39.162 | 26.342 |
| 22 | 0,33 · 0,45 | 0 · 0 | 0 | 17 | 46.985 | 35.954 |
| 23 | 0,47 · 1,9 | 0 · 1 | 0 | 17 | 59.787 | 49.072 |
| 24 | 0,51 · 2,62 | 0 · 6 | 0 | 17 | 62.958 | 66.978 |
| 25 | 1,95 · 2,8 | 1 · 1 | 0 | 18 | 83.249 | 91.416 |
| 26 | 3,4 · 5,47 | 1 · 1 | 1 | 18 | 113.199 | 124.772 |
| 27 | 6,05 · 6,79 | 1 · 3 | 0 | 20 | 154.486 | 170.298 |
| 28 | 6,49 · 7,82 | 1 · 2 | 0 | 21 | 210.045 | 232.435 |
| 29 | 9,72 · 16,3 | 1 · 2 | 3 | 23 | 288.734 | 317.245 |
| 30 | 17,54 · 25,19 | 2 · 3 | 9 | 26 | 412.876 | 433.000 |

### Perfil A (melhora, desafia sempre) — 5 partidas; 1 não terminou a era 2 em 240 min (fase 30, nível 23, 1.080 mortes)
Era 0: 12,4 · pior 12,9 min; 1 derrota; nível 11. Era 1: 57,3 · pior 69,7 min; 186 derrotas acumuladas (pior 234); nível 15. Era 2 (4 de 5):
143,6 · pior 156,3 min; 1.062 acumuladas (pior 1.166); nível 23. Nível 15 só aos 54-75 min, na fase 20.

| Fase | Tempo (med · pior) | Derrotas p/ chefe (med · pior) | Mortes p/ comuns (pior) | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,64 · 0,76 | 0 · 0 | 0 | 3 | 433 | 317 |
| 2 | 0,71 · 0,75 | 0 · 0 | 0 | 4 | 527 | 381 |
| 3 | 0,88 · 1,01 | 0 · 0 | 0 | 5 | 615 | 457 |
| 4 | 1 · 1,12 | 0 · 0 | 0 | 6 | 703 | 549 |
| 5 | 1,07 · 1,11 | 0 · 0 | 0 | 7 | 809 | 660 |
| 6 | 1,15 · 1,18 | 0 · 0 | 0 | 8 | 883 | 793 |
| 7 | 1,22 · 1,25 | 0 · 0 | 0 | 9 | 984 | 952 |
| 8 | 1,37 · 1,48 | 0 · 0 | 0 | 10 | 1.086 | 1.144 |
| 9 | 1,7 · 1,88 | 0 · 0 | 0 | 10 | 1.130 | 1.374 |
| 10 | 2,61 · 2,78 | 1 · 1 | 0 | 11 | 1.318 | 1.650 |
| 11 | 0,79 · 1,08 | 0 · 1 | 0 | 11 | 3.048 | 2.110 |
| 12 | 0,75 · 0,79 | 0 · 0 | 0 | 12 | 3.404 | 2.698 |
| 13 | 0,93 · 1,23 | 0 · 1 | 0 | 12 | 3.890 | 3.451 |
| 14 | 0,96 · 1,46 | 0 · 1 | 0 | 12 | 4.105 | 4.413 |
| 15 | 0,96 · 2,45 | 0 · 3 | 0 | 12 | 4.106 | 5.643 |
| 16 | 3,11 · 8,03 | 6 · 19 | 0 | 13 | 4.899 | 7.217 |
| 17 | 5 · 16,7 | 10 · 40 | 1 | 13 | 6.115 | 9.229 |
| 18 | 4,87 · 36,32 | 14 · 92 | 1 | 13 | 7.618 | 11.802 |
| 19 | 11,67 · 23,9 | 37 · 86 | 1 | 14 | 10.238 | 15.092 |
| 20 | 15,3 · 26,63 | 96 · 127 | 1 | 15 | 13.623 | 19.300 |
| 21 | 0,61 · 2,68 | 1 · 15 | 0 | 16 | 21.844 | 26.342 |
| 22 | 0,68 · 4,62 | 2 · 22 | 1 | 16 | 36.581 | 35.954 |
| 23 | 0,72 · 3,81 | 2 · 11 | 0 | 16 | 44.901 | 49.072 |
| 24 | 0,87 · 26,27 | 2 · 80 | 1 | 16 | 56.173 | 66.978 |
| 25 | 3,39 · 17,27 | 19 · 51 | 1 | 16 | 73.545 | 91.416 |
| 26 | 3,92 · 8,09 | 19 · 45 | 1 | 17 | 89.349 | 124.772 |
| 27 | 8,19 · 12,58 | 44 · 85 | 1 | 17 | 114.006 | 170.298 |
| 28 | 14,88 · 16,86 | 99 · 108 | 1 | 18 | 161.713 | 232.435 |
| 29 | 27,57 · 31,55 | 170 · 210 | 2 | 20 | 217.328 | 317.245 |
| 30 (4/5) | 86,05 · 98,11 | 568 · 629 | 2 | 23 | 286.397 | 433.000 |

### Perfil C (não melhora, desafia sempre) — SÓ 1 partida (as outras 4 se perderam: disco cheio); teto de 120 min
Parou na fase 18 aos 120 min (nível 14, FC 4.907, 179 mortes). Era 0: 91,1 min, 88 mortes, nível 12, FC 1.193.

| Fase | Tempo | Derrotas p/ chefe | Mortes p/ comuns | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,74 | 0 | 0 | 3 | 404 | 317 |
| 2 | 0,67 | 0 | 0 | 4 | 464 | 381 |
| 3 | 1 | 0 | 0 | 5 | 531 | 457 |
| 4 | 1,04 | 0 | 0 | 6 | 618 | 549 |
| 5 | 1,21 | 0 | 0 | 7 | 680 | 660 |
| 6 | 1,28 | 0 | 0 | 8 | 743 | 793 |
| 7 | 1,47 | 0 | 0 | 9 | 806 | 952 |
| 8 | 1,64 | 0 | 0 | 10 | 961 | 1.144 |
| 9 | 3,01 | 1 | 0 | 10 | 961 | 1.374 |
| 10 | 79,04 | 86 | 1 | 12 | 1.193 | 1.650 |
| 11 | 1,05 | 1 | 0 | 12 | 2.821 | 2.110 |
| 12 | 0,68 | 0 | 0 | 12 | 3.939 | 2.698 |
| 13 | 0,78 | 0 | 0 | 13 | 4.488 | 3.451 |
| 14 | 0,83 | 0 | 0 | 13 | 4.584 | 4.413 |
| 15 | 0,91 | 0 | 0 | 13 | 4.790 | 5.643 |
| 16 | 1,27 | 1 | 0 | 13 | 4.790 | 7.217 |
| 17 | 2,72 | 4 | 1 | 13 | 4.828 | 9.229 |
| 18-30 | não chegou | | | | | |

## Tabelas por fase — ANTES (v7.3, build v0.9, mesma regra de velocidade)

### Perfil B — 5 partidas, todas terminaram
Era 0: 8,7 · pior 9,8 min; nível 11; FC 1.311. Era 1: 17,8 · pior 20,7 min; 6 derrotas acumuladas; nível 15; FC 11.316. Era 2: 31,1 · pior
62,8 min; 24 acumuladas (pior 74); nível 21 (máx. 28); FC 261.252. Nível 15 aos 23-28 min, fase 20-21.

| Fase | Tempo (med · pior) | Derrotas p/ chefe (med · pior) | Mortes p/ comuns (pior) | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,56 · 0,64 | 0 · 0 | 0 | 3 | 425 | 313 |
| 2 | 0,63 · 0,64 | 0 · 0 | 0 | 4 | 513 | 371 |
| 3 | 0,7 · 0,74 | 0 · 0 | 0 | 5 | 624 | 439 |
| 4 | 0,8 · 0,81 | 0 · 0 | 0 | 6 | 703 | 520 |
| 5 | 0,74 · 0,83 | 0 · 0 | 0 | 7 | 783 | 617 |
| 6 | 0,9 · 0,93 | 0 · 0 | 0 | 8 | 873 | 731 |
| 7 | 0,92 · 0,98 | 0 · 0 | 0 | 9 | 951 | 866 |
| 8 | 1,05 · 1,12 | 0 · 0 | 0 | 10 | 1.084 | 1.026 |
| 9 | 1,02 · 1,09 | 0 · 0 | 0 | 10 | 1.138 | 1.215 |
| 10 | 1,42 · 2,79 | 1 · 1 | 0 | 11 | 1.311 | 1.440 |
| 11 | 0,82 · 4,35 | 0 · 1 | 0 | 12 | 1.906 | 1.785 |
| 12 | 0,78 · 1,48 | 0 · 1 | 0 | 12 | 2.576 | 2.211 |
| 13 | 0,95 · 1,06 | 0 · 0 | 0 | 12 | 3.281 | 2.740 |
| 14 | 1,2 · 3,62 | 0 · 1 | 0 | 12 | 3.449 | 3.396 |
| 15 | 0,79 · 1,7 | 0 · 1 | 0 | 12 | 5.145 | 4.209 |
| 16 | 0,9 · 1,1 | 0 · 1 | 0 | 13 | 5.783 | 5.215 |
| 17 | 0,98 · 3,08 | 0 · 1 | 0 | 13 | 6.540 | 6.463 |
| 18 | 1,97 · 3,08 | 1 · 1 | 0 | 13 | 7.368 | 8.009 |
| 19 | 2,78 · 3,75 | 1 · 1 | 0 | 14 | 9.073 | 9.925 |
| 20 | 3,37 · 4,42 | 1 · 1 | 1 | 15 | 11.316 | 12.300 |
| 21 | 2,08 · 10,51 | 7 · 55 | 1 | 15 | 33.921 | 17.401 |
| 22 | 0,4 · 3,23 | 0 · 7 | 1 | 16 | 45.778 | 24.617 |
| 23 | 0,58 · 1 | 1 · 2 | 1 | 16 | 50.436 | 34.827 |
| 24 | 0,61 · 0,81 | 1 · 1 | 0 | 16 | 64.479 | 49.270 |
| 25 | 0,65 · 2,27 | 1 · 4 | 1 | 16 | 67.229 | 69.703 |
| 26 | 2,51 · 4,32 | 1 · 2 | 1 | 17 | 90.868 | 98.610 |
| 27 | 3,5 · 5,25 | 1 · 1 | 0 | 18 | 126.428 | 139.505 |
| 28 | 5,56 · 6,9 | 1 · 1 | 0 | 19 | 179.930 | 197.360 |
| 29 | 7,39 · 12,02 | 1 · 1 | 0 | 21 | 252.882 | 279.208 |
| 30 | 0,53 · 44,87 | 0 · 1 | 0 | 21 | 261.252 | 395.000 |

### Perfil A — 5 partidas, todas terminaram
Era 0: 8,7 · pior 8,8 min; nível 11. Era 1: 11,7 · pior 13 min; 11 derrotas acumuladas (pior 13); nível 14; FC 8.723. Era 2: 46,1 · pior
49,9 min; 257 acumuladas (pior 309); nível 18; FC 170.179. Nível 15 aos 26-31 min, fase 21-23.

| Fase | Tempo (med · pior) | Derrotas p/ chefe (med · pior) | Mortes p/ comuns (pior) | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,56 · 0,64 | 0 · 0 | 0 | 3 | 434 | 313 |
| 2 | 0,59 · 0,64 | 0 · 0 | 0 | 4 | 520 | 371 |
| 3 | 0,7 · 0,71 | 0 · 0 | 0 | 5 | 637 | 439 |
| 4 | 0,76 · 0,78 | 0 · 0 | 0 | 6 | 715 | 520 |
| 5 | 0,75 · 0,82 | 0 · 0 | 0 | 7 | 805 | 617 |
| 6 | 0,87 · 0,9 | 0 · 0 | 0 | 8 | 881 | 731 |
| 7 | 0,9 · 0,93 | 0 · 0 | 0 | 9 | 960 | 866 |
| 8 | 0,94 · 0,98 | 0 · 0 | 0 | 10 | 1.051 | 1.026 |
| 9 | 1,06 · 1,09 | 0 · 0 | 0 | 10 | 1.073 | 1.215 |
| 10 | 1,51 · 1,53 | 1 · 1 | 0 | 11 | 1.281 | 1.440 |
| 11 | 0,79 · 1,1 | 0 · 1 | 0 | 11 | 1.786 | 1.785 |
| 12 | 0,69 · 1,06 | 0 · 1 | 0 | 12 | 2.305 | 2.211 |
| 13 | 0,92 · 2,01 | 0 · 3 | 0 | 12 | 2.981 | 2.740 |
| 14 | 0,81 · 1,42 | 0 · 1 | 0 | 12 | 3.622 | 3.396 |
| 15 | 0,85 · 1,15 | 0 · 1 | 0 | 12 | 4.376 | 4.209 |
| 16 | 0,98 · 1,06 | 0 · 1 | 0 | 13 | 5.617 | 5.215 |
| 17 | 1,17 · 2,15 | 1 · 3 | 0 | 13 | 5.368 | 6.463 |
| 18 | 1,27 · 1,72 | 1 · 1 | 1 | 13 | 6.301 | 8.009 |
| 19 | 1,75 · 2,13 | 2 · 2 | 1 | 13 | 7.526 | 9.925 |
| 20 | 1,92 · 2,84 | 2 · 6 | 1 | 14 | 8.723 | 12.300 |
| 21 | 11,58 · 11,83 | 34 · 64 | 2 | 15 | 25.549 | 17.401 |
| 22 | 0,78 · 9,24 | 3 · 38 | 0 | 15 | 35.636 | 24.617 |
| 23 | 0,58 · 0,96 | 1 · 5 | 0 | 15 | 45.657 | 34.827 |
| 24 | 0,6 · 1,68 | 1 · 5 | 0 | 15 | 54.250 | 49.270 |
| 25 | 1,5 · 2,3 | 7 · 15 | 1 | 15 | 61.220 | 69.703 |
| 26 | 2,35 · 4,75 | 12 · 36 | 1 | 16 | 69.458 | 98.610 |
| 27 | 3,25 · 10,56 | 17 · 72 | 1 | 16 | 87.610 | 139.505 |
| 28 | 4,71 · 13,48 | 31 · 95 | 1 | 17 | 105.806 | 197.360 |
| 29 | 7,62 · 10,36 | 52 · 72 | 1 | 18 | 139.459 | 279.208 |
| 30 | 6,7 · 9,11 | 46 · 65 | 1 | 18 | 170.179 | 395.000 |

### Perfil C — 5 partidas, NENHUMA passou da era 1 em 150 min (pararam na fase 19-20, nível 19, FC ~5.700, 816 a 891 mortes)
Era 0: 9,4 · pior 9,8 min; 2 mortes; nível 11; FC 1.038. Nível 15 aos 52-60 min, fase 19.

| Fase | Tempo (med · pior) | Derrotas p/ chefe (med · pior) | Mortes p/ comuns (pior) | Nível | FC ao vencer | FC recomendada |
|---|---|---|---|---|---|---|
| 1 | 0,56 · 0,64 | 0 · 0 | 0 | 3 | 384 | 313 |
| 2 | 0,66 · 0,66 | 0 · 0 | 0 | 4 | 449 | 371 |
| 3 | 0,8 · 0,82 | 0 · 0 | 0 | 5 | 530 | 439 |
| 4 | 0,82 · 0,86 | 0 · 0 | 0 | 6 | 595 | 520 |
| 5 | 0,75 · 0,82 | 0 · 0 | 0 | 7 | 659 | 617 |
| 6 | 0,94 · 1,07 | 0 · 0 | 0 | 8 | 743 | 731 |
| 7 | 1,03 · 1,13 | 0 · 0 | 0 | 9 | 808 | 866 |
| 8 | 1,03 · 1,17 | 0 · 0 | 0 | 10 | 915 | 1.026 |
| 9 | 1,43 · 1,51 | 1 · 1 | 0 | 10 | 951 | 1.215 |
| 10 | 1,49 · 1,82 | 1 · 2 | 0 | 11 | 1.038 | 1.440 |
| 11 | 1,09 · 1,75 | 1 · 3 | 0 | 11 | 1.316 | 1.785 |
| 12 | 0,82 · 6,46 | 1 · 16 | 0 | 12 | 2.047 | 2.211 |
| 13 | 0,94 · 3,28 | 1 · 4 | 0 | 12 | 2.558 | 2.740 |
| 14 | 1,23 · 4,73 | 1 · 12 | 0 | 12 | 2.780 | 3.396 |
| 15 | 1,38 · 3,48 | 1 · 8 | 1 | 12 | 3.345 | 4.209 |
| 16 | 1,72 · 2,71 | 2 · 5 | 1 | 13 | 4.171 | 5.215 |
| 17 | 1,71 · 4,73 | 3 · 14 | 1 | 13 | 4.356 | 6.463 |
| 18 | 7,47 · 37,06 | 22 · 129 | 1 | 14 | 4.833 | 8.009 |
| 19 (4/5) | 54,19 · 81,91 | 283 · 571 | 4 | 16 | 5.386 | 9.925 |
| 20-30 | não chegou | | | | | |

## NÃO medido / NÃO feito

- **Eras 3 a 6**: nada medido; eraMult e FC recomendada dessas eras no arquivo são extrapolação.
- **VIP** (x2 desde o início, x4 a partir do nível 40 com VIP 5+): não medido. **Prazos em dias**: não medidos; nenhuma promessa de calendário.
- **Build v0.11** (folhas de ataque no quadro do golpe): não medida; todas as medidas são da v0.9 e da v0.10.
- **XP por abate nova** (`eraScale` 0,15): não medida; a meta 5 fica em aberto até a fps-30 aplicar e alguém remedir.
- **Perfil C na v8**: 1 partida em vez de 5. **Perfil A/C "desafiando com juízo"** (por exemplo, a cada 1 min): não medido.
- Jogador em MANUAL, tela desenhada, câmera lenta da ultimate, missões e passe: fora do laço acelerado.

## A REMEDIR (regras novas que chegaram durante a calibração; não entraram em nenhuma medida)

1. **Torre**: chefe a cada 10 andares, andares comuns 30% mais duros, adversário = cópia escalada (`scaledFoe`). A âncora de FC por era do
   arquivo (`tower.fc_mediana_do_gratis_no_fim_de_cada_era`) mudou na v8: a curva da torre precisa ser conferida contra ela.
2. **Instâncias**: 2 entradas por área por dia (+1 com VIP) = 8/dia (12 com VIP) contra 3 antes: ~2,7× mais XP, ração, pedras e ovos de
   instância. Mexe no nível do jogador (e portanto nos tempos e na meta 4).
3. **Build v0.11**: folhas de ataque no quadro do golpe (intervalo 1,17-1,36 s): muda o dano recebido por segundo; repetir os três perfis.
4. Regra de velocidade no jogo (x1 até o nível 15): as medidas forçaram a regra por conta; repetir quando o engenheiro ligar.

## Ambiente

- A aba CALIBRACAO foi fechada/tirada do grupo por terceiros 4 vezes; a última saiu do grupo com as partidas ainda rodando e não consegui
  fechá-la pela ferramenta (título "CALIBRACAO - NAO USAR NEM FECHAR"): **fechar à mão**.
- O disco C: chegou a 0 byte livre às ~13:49 (não por causa desta tarefa: os arquivos da calibração somam ~300 KB). O servidor auxiliar da
  calibração (porta 8791) caiu nesse momento.
