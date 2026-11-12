# Sys.chest (js/sys/chest.js): baú de toque (fps-30)
Status: **pronto e testado** (`node test/sys/chest.test.js`: 11 testes). Não está ligado ao jogo (quem liga: engenheiro, fps-c9).
Números da v5.1: reports/spec-loot-bau-instancias.md, seção 2.

## Regras
- A barra enche por abate na CAMPANHA (comum 1, chefe 5, Senhor da Era 10). **250 pontos = 1 baú.** Na instância não enche.
- Guarda **até 3**. **Teto de 8 baús ganhos por dia** (meia-noite local). Estoque cheio ou teto do dia: a barra para em 100% (sem acumular
  além de 1 baú); no teto, o botão fica cinza com o aviso "volte amanhã". A carga parada vira baú ao abrir um (se couber no dia) ou no dia seguinte.
- Abrir: 3-5 itens (tabela da era do Sys.loot com +50% nos pesos Raro+; arma nunca Mítica), 15-30 × ouro de um abate, 25% de 2-5 💎,
  60% de 1-3 pedras de forja (contam na missão do dia), 10% de 1 ração, 50% de 1-2 pedras de prática.
- Ganho só jogando: nunca vendido (ECA Digital).

## Estado (S.sys.chest, v2; v1 convertido)
`{v, charge, stored, opened, day, today}` (today = baús ganhos hoje).

## O que o engenheiro chama e onde
| Quando | Chamada |
|---|---|
| boot | `Sys.chest.ensure(S)` |
| `killEnemy(e)` na campanha | `Sys.chest.onKill(S, {boss:e.boss, eraBoss:e.eraBoss}, Sys.host)` |
| volta do offline | `Sys.chest.onKills(S, Sys.loot.offline(...).kills, Sys.host)` |
| canto da batalha (lado ESQUERDO, porque o direito é dos botões s2/s3) | `Sys.chest.render(el, S, Sys.host, {overlay: document.getElementById('app')})` uma vez; `Sys.chest.update(el, S, Sys.host)` no `hud()` |
| abrir com UI própria | `opts.onOpen(res)` no render, ou `Sys.chest.open(S, Sys.host)` → `{items, gold, gems, forge, food, stones, left}` |
CSS: `js/sys/sys.css` (bloco sys:chest). Ícone: `assets/ui/chest.png`. Animação definitiva (pulsar, abrir): fps-ff.
`host` opcional na UI: `itemName(it), rarName(r), rarColor(r), thumb(it), sfx('claim'), toast, onChange, fmt`.
Parâmetros (VIP/eventos): `Sys.chest.params.mult.{speed,items,rarity,gold}`, `params.maxStoredAdd`, `params.dailyCapAdd`.

## Pendências
- Prévia animada do baú pulsando e abrindo, para o dono aprovar (regra "nada estático"): fps-ff.
