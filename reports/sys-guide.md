# Sys.guide (js/sys/guide.js): rastreador de missão guia — fps-30
Status: **pronto e testado** (`node test/sys/guide.test.js`: 6 testes), atrás de chave DESLIGADA (`Sys.guide.DATA.on = false`). Sem tela (protótipo em voto).
Fila de missões de tutorial, uma por vez e em ordem, separada das diárias/semanais do passe. Conduz o jogador novo pelos primeiros dias da curva de 9 eras
(era 0 no dia 1, Antiguidade até o dia 4, Medieval até o dia 11, entrada na Pólvora). Prêmios pelo `Sys.loot.grantBundle` (portões valem; nada sorteado, nada pago).

## Fila proposta (para o PO aprovar os textos)
| # | Texto | Conta | Prêmio | Tela | Hoje |
|---|---|---|---|---|---|
| 1 | Derrote 10 inimigos | 10 abates | 20× ouro de um abate | batalha | ✔ |
| 2 | Derrote o primeiro chefe | 1 chefe | 10 💎 | batalha | ✔ |
| 3 | Equipe um item novo | 1 equipar | 30× ouro | equipamento | ✔ |
| 4 | Melhore um item 3 vezes | 3 melhorias | 50× ouro | equipamento | ✔ |
| 5 | Faça a invocação grátis | 1 invocação | 10 💎 | invocar | ✔ |
| 6 | Abra um baú de batalha | 1 baú | 5 pedras de forja | batalha | ✔ |
| 7 | Chegue ao nível 5 | nível 5 | 15 💎 | batalha | ✔ |
| 8 | Vença o Senhor da Era e entre na Antiguidade | era 1 | 20 💎 + 1 Essência | batalha | ✔ |
| 9 | Resgate uma missão diária | 1 missão | 10 💎 | passe | ✔ |
| 10 | Compre um item na loja | 1 compra | 40× ouro | loja | ✔ |
| 11 | Treine uma prática | 1 treino | 40× ouro | práticas | ✔ |
| 12 | Chegue ao nível 12 | nível 12 | 20 💎 | batalha | ✔ |
| 13 | Fortaleça a arma até +1 | forja +1 | 10 pedras | forja | **fora** (sem tela) |
| 14 | Faça 10 invocações | 10 invocações | 20 💎 | invocar | ✔ |
| 15 | Vença uma instância | 1 instância | 20 💎 | instâncias | **fora** (sem tela) |
| 16 | Choque um ovo de pet | 1 ovo | 20 rações | pets | **fora** (sem tela) |
| 17 | Entre na Era Medieval | era 2 | 30 💎 + 2 Essências | batalha | ✔ |
| 18 | Suba o 1º andar da torre | 1 andar | 10 pedras | torre | **fora** (sem tela) |
| 19 | Chegue ao nível 25 | nível 25 | 30 💎 | batalha | ✔ |
| 20 | Melhore itens 20 vezes | 20 melhorias | 80× ouro | equipamento | ✔ |
| 21 | Entre na Era da Pólvora | era 3 | 40 💎 + 3 Essências | batalha | ✔ |
Total da fila (hoje, sem as 4 de fora): ~255 💎, 6 Essências, 5 pedras e ouro. As missões "fora" entram na ordem certa quando a tela ligar (`DATA.screens.<tela> = true`).

## Regras
- Missões de nível, era, fase e forja usam o MAIOR valor já visto (se o jogador já passou, a missão nasce cumprida). As outras somam desde que viram a missão da vez.
- Missão sem tela não trava a fila: fica de fora e entra quando a tela existir. Estado guarda os ids resgatados (missões novas podem ser inseridas sem estragar o save).

## API (para o engenheiro)
- `Sys.guide.current(S)` → `{id, text, cur, max, reward, goto, done}` ou `null` (fila terminada ou chave desligada) — rastreador sob a barra de fase; o toque vai para `goto`.
- `Sys.guide.claim(S, host)` → `{ok, got, next}`. `Sys.guide.onEvent(S, tipo, n)`:
  - somáveis: `kill, boss, upgrade, summon, chest, equip, mission, buy, practice, instance, egg, tower` (n = quantos);
  - absolutos: `level, era, stage, forgeLvl` (n = valor atual).
- `Sys.guide.list(S)` para uma tela de revisão. `DATA.screens` diz quais telas existem: forja, instâncias, torre e pets começam `false`.
