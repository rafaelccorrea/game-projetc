# Sys.pass (js/sys/pass.js): passe de batalha e missões (fps-30)
Status: **pronto e testado** (`node test/sys/pass.test.js`: 10 testes). Ritmo medido com as diárias em 90/dia (ajuste do PO): grátis todo dia = nível 30
no **dia 27**; perdendo 1 dia por semana = **dia 29**; premium (+25%) = **dia 21**. Não ligado ao jogo.
Regras e tabelas: reports/spec-loot-bau-instancias.md, seção 6.

## Estado (S.sys.pass)
`{v, xp, free:[níveis resgatados], prem:[...], premium, d:{day, p:{evento:n}, c:[ids], bonus}, w:{week, p, c}, held:[{slot, r}]}`
Na 1ª carga, importa o passe antigo do jogo (`S.pass.xp/free/prem/on`).

## O que o engenheiro chama e onde
| Quando | Chamada |
|---|---|
| boot | `Sys.pass.ensure(S)` |
| eventos (substituem o `track()` atual das missões) | `Sys.pass.track(S, host, 'kill'\|'boss'\|'ult'\|'chest'\|'instance'\|'forge'\|'summon'\|'upgrade', n)`: abate, chefe, ultimate usada, baú aberto, instância vencida, pedra de forja coletada, invocação, melhoria |
| aba Missões (a missão de melhoria só aparece do nível 5 do jogador em diante) | `Sys.pass.list(S, host)` → `{daily, weekly, bonus}`; resgatar: `Sys.pass.claimMission(S, host, id)` (ou `'bonus'`) |
| aba Passe | `Sys.pass.progress(S)`, `Sys.pass.reward('free'\|'premium', nível)`, `Sys.pass.claimAll(S, host)` → itens, 💎, ouro, skin ou `held` |
| compra do premium (direta) | `Sys.pass.setPremium(S, true)` depois do pagamento |
| subir de nível do jogador | `Sys.loot.onLevelUp(S, host)` já chama `Sys.pass.releaseHeld`, que também evolui os Itens da Temporada se o jogo expuser `host.items()` (a mochila) |
| Item da Temporada (premium 27 colete, 30 arma) | sai NA HORA na melhor raridade permitida, com `item.season=true` e `item.targetR=4`; evolui sozinho **só a raridade** até a permitida (a ERA fica a de quando foi ganho: decisão do PO após a v7), mantendo `lvl` e `gold` por `Sys.pass.evolveSeason(S, host, mochila)`. Tela: "Item da Temporada · evolui até Lendário" |
| selo da aba | `Sys.pass.alerts(S, host)` |
**Tirar do jogo:** o `addPxp(5)` por chefe (js/battle.js) e as missões/`PASS_*` antigas do index.html. A XP do passe vem só de missões.
`host` usado: `now, rng, eraMax, level, goldUnit, addGems, addGold, addItem, addSkin('season')`.

## Chave das instâncias (decisão do PO)
`Sys.pass.DATA.instancesOn = false` enquanto a tela 13 não entra: a diária "Vença 1 instância" (15) vira "Derrote 2 chefes" (15) e a semanal "Vença 10 instâncias" (40)
vira "Faça 10 invocações, a grátis conta" (40). Mesmo XP do passe (70 por dia + bônus 20; 190 por semana); o bônus das 6 diárias libera. Ao ligar a tela 13: `true`.

## Temporada (decisão do PO)
- Ciclos de 30 dias (`Sys.pass.season(S, host)` → `{n, start, end}`), a partir de `DATA.seasonStart` (o jogo pode fixar o calendário) ou da 1ª carga.
  Na virada, XP, resgates e premium do passe zeram (premium é por temporada).
- O Item da Temporada **não sobe de era** (PO reverteu após a v7: subindo de era, o premium virava quase um VIP). Só a raridade sobe até Lendário quando o portão abre;
  nível e ouro investido mantidos. `seasonEnd` fica no item só como informação.

## Pendências
- Arte e animação da skin da temporada e das recompensas: fps-ff. Tela de Missões/Passe: PO.
- Medir na v7 (fps-c9) grátis contra premium, com jogadores que perdem dias.
