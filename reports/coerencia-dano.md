# Coerência de dano — regra e auditoria (fps-e2, 2026-11-12)
Regra do dono: "a força do personagem é com base nos atributos; um personagem com 2.000 de FC nunca vai dar 1 milhão de dano".
**CONTA x TESTE:** a tabela da §3 é conta (os módulos reais, um jogador-modelo escalado à FC recomendada de cada era). Testado em Node
(test/sys/e2.test.js, "dano: em cada era..."): o maior golpe de cada era e nível cabe no teto da §2 e nunca passa de 5,5 × FC. Nada medido no jogo.

## 1. A regra escrita
1. **Todo número de dano na tela sai dos atributos:** `dano = ATK do herói × multiplicador do golpe × (1 + Dano Crítico, se critar) × (1 − redução da DEF do
   alvo) × variação de ±10%`. ATK, chance e dano crítico, velocidade e DEF vêm de `Sys.fc.stats` (o mesmo da FC). Nenhum outro fator.
2. **O multiplicador do golpe é fixo por habilidade** (tabela da §2), nunca cresce com era, nível ou fase. O que cresce é o ATK.
3. **Crítico:** × (1 + Dano Crítico); o Dano Crítico tem teto de 400% (= ×5), já aprovado. A chance tem teto de 75%.
4. **Pet:** golpe próprio a partir do ATK do herói, com a FC do pet travada em 20% da total (25% no Prismático).
5. **Consequência que vale para qualquer era:** a FC conta o ATK × 5 (e mais crítico, velocidade, vida e DEF), então **ATK ≤ FC ÷ 5**. O maior número possível
   (golpe final da ultimate, crítico no teto, variação +10%) = 27,5 × ATK ≤ **5,5 × FC**. Na prática, com os atributos de um jogador típico: **1,2 a 1,8 × FC**.
   Com 2.000 de FC, o maior número possível fica em ~3.000 (no limite teórico, 11.000), nunca 1 milhão.

## 2. Tetos por golpe (em ATK do herói, ANTES do crítico) — `Sys.stats.DATA.dmgRule`
| Golpe | Por número na tela | No total | Com crítico no teto (×5) |
|---|---|---|---|
| Básico (s1) | 1 × ATK | 1 | 5 |
| Especial (s2) | 3 ÷ golpes da era (1 a 6 golpes: 3 a 0,5) | 3 | 15 |
| Ultimate (s3) | 1,25 nos 4 primeiros, **5 no golpe final** | 10 | 25 por número, 50 no total |
| Pet (Lendário no máximo) | 0,94 | — | 3,2 (crítico do pet na v3: 5 ÷ 1,57) |
Todos com a variação de ±10%. `Sys.stats.maxHit(atributos, tipo)` e `Sys.stats.checkHit(atributos, dano, tipo)` → `{ok, ratio, max}` fazem a conta para o QA.

## 3. FC x dano x vida dos inimigos, por era (jogador típico na FC recomendada do Senhor de hoje; balance.json v8)
| Era | FC | ATK (% da FC) | Básico / crítico | Especial (1 golpe) | Ultimate final / crítico | Maior número possível | Inimigo comum da fase 10 | Senhor da Era |
|---|---|---|---|---|---|---|---|---|
| 0 Pré-História | 1.650 | 92 (5,6%) | 92 / 197 | 276 | 460 / 986 | 2.531 (1,53× FC) | 281 (3 básicos) | 4.410 (~28 s) |
| 1 Antiguidade | 19,3 mil | 1.276 (6,6%) | 1.276 / 2.800 | 1.276 | 6.381 / 14,0 mil | 35,1 mil (1,82× FC) | 1.436 (1,1 básicos) | 22,6 mil (~10 s) |
| 2 Medieval | 433 mil | 27,9 mil (6,4%) | 27,9 mil / 64,4 mil | 27,9 mil | 139 mil / 322 mil | 767 mil (1,77× FC) | 40,7 mil (1,5 básicos) | 640 mil (~12 s) |
| 3 Pólvora | 12,5 mi | 784 mil (6,3%) | 784 mil / 1,9 mi | 1,2 mi | 3,9 mi / 9,5 mi | 21,6 mi (1,72× FC) | 1,2 mi (1,5 básicos) | 18,5 mi (~11 s) |
| 4 Industrial | 362 mi | 16,9 mi (4,7%) | 16,9 mi / 48,8 mi | 10,1 mi | 84,6 mi / 244 mi | 465 mi (1,28× FC) | 34,1 mi (2 básicos) | 536 mi (~12 s) |
| 5 Moderna | 10,5 bi | 504 mi (4,8%) | 504 mi / 1,7 bi | 252 mi | 2,5 bi / 8,5 bi | 13,9 bi (1,32× FC) | 986 mi (2 básicos) | 15,5 bi (~9 s) |
| 6 Futurista | 302 bi | 13,1 bi (4,3%) | 13,1 bi / 48,6 bi | 19,6 bi | 65,5 bi / 243 bi | 360 bi (1,19× FC) | 28,5 bi (2,2 básicos) | 448 bi (~8 s) |
"~X s" = tempo para derrubar o Senhor só com básicos (média com crítico e velocidade). Os números batem: o inimigo comum cai em 1 a 3 básicos e o Senhor
em 8-28 s, em todas as eras, porque a vida dos inimigos sobe junto com a FC recomendada. Eras 7-8 seguem a mesma regra (curva das 9 eras).

## 4. Onde o código NÃO segue (ou pode não seguir) a regra
1. **Nada solto no dano de hoje.** Só há UM lugar que tira vida de inimigo (`js/battle.js:275`, `hitEnemy`), e ele usa `Sys.stats.hit` com os atributos de
   `Sys.fc.stats` (o mesmo da FC). Especial 3× e ultimate 10× são os multiplicadores da tabela; o golpe final da ultimate (5×) é o maior.
2. **Variação de ±10%** (`0.9+Math.random()*0.2`, js/battle.js:272) é o único fator fora dos atributos. É visual e pequena; fica dentro do teto (spread 1,1).
   Se o dono quiser "zero sorte", o engenheiro troca por 1.
3. **Inimigos não têm DEF** (`e.def` ausente = 0): a "defesa do inimigo" da regra ainda não existe no jogo. Coerente (o dano só não é reduzido); se o
   balanceamento der DEF aos inimigos, a fórmula já está pronta (`Sys.stats.hit(..., e.def)`).
4. **Reserva sem os módulos** (js/battle.js:273): se o Sys.stats não carregar, o crítico vira ×2 fixo e 12% de chance. Coerente, mas não usa o Dano Crítico do herói.
   Só acontece se o js/sys falhar ao carregar.
5. **Pet ainda não bate na batalha** (não há golpe de pet no battle.js). Quando entrar, pela API `Sys.pet.battleInfo` + `st.pet.atk`: 0,94 × ATK por golpe a cada 2 s
   no máximo (crítico da v3 até 3,2 ×).
6. **Debug** (`window.__stay`, `?debug=1`): deixa herói e inimigo imortais, não mexe no número do dano. Não aparece para o jogador.
7. **Chefe e Senhor:** a vida vem de `eraMult × base × 1,4^fase × ease × (6 × 1,1 no Senhor)` (balance.json, fps-c9). Não há multiplicador escondido no
   dano do herói contra eles. O Senhor da era 0 leva ~28 s, os outros ~10 s: é a única era fora do padrão, e de propósito (primeiro chefe grande).

Nenhuma correção de código foi necessária no dano. Acrescentei só a tabela e a conferência (`Sys.stats.DATA.dmgRule`, `maxHit`, `checkHit`), que não mudam o jogo.

## 5. Teste para o QA (no jogo, quando o navegador puder ser usado)
Em cada era (0-6), jogando 2-3 min com o Senhor incluso: registrar cada número de dano mostrado e o tipo do golpe (envolver `floatText` e `hitEnemy` só no
debug), e o `heroStats()` do momento. Passa se, para todo número: `Sys.stats.checkHit(heroStats(), dano, tipo).ok` (s1 ≤ 1 × ATK × (1 + dano crítico) × 1,1;
s2 ≤ 3; s3 ≤ 5) **e** `dano ≤ 5,5 × FC`. Relatar o maior `ratio` visto por tipo e por era.
