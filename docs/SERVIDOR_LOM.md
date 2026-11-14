# Contrato do servidor: itens LoM do lote B (arena, guilda, masmorra cooperativa, ranking de evento, minijogo)

Feito pela Sistemas em 13/11/2026 a pedido do Servidor (fps-6f), **antes** dos módulos, para ele abrir os subagentes. Origem: `docs/LOM_VS_EONBOUND.md` §5 itens 12, 14, 15, 16 e 17.
Os números daqui são os mesmos de `DATA` nos módulos `js/sys/` citados (fonte única: se mudar um, muda o outro). O engenheiro liga pelo `docs/LIGACOES_LOM_B.md`.

**Regras gerais (valem para todas as rotas abaixo)**
- Formato de erro e cabeçalhos = `docs/API_SERVIDOR.md` §0: `{ "error": { "code": "...", "message": "...", "details": {} } }`. A tela lê só `code`.
- **Dia** = dia de Brasília (UTC−3), chave `'AAAA-MM-DD'`. Tudo que é "por dia" zera à meia-noite de Brasília.
- Jogadores menores: **nenhum texto livre** em nenhuma rota. Conversa só por **índice** de frase pronta (`Sys.duo.DATA.phrases`, 18 frases, índice 0-17).
- Nada pago, nada sorteado com dinheiro. Nenhuma rota daqui dá diamante. Ouro sempre em `goldk` (× ouro de um abate da fase do jogador) e **no máximo 120 por resgate** (`docs/ECONOMIA_OURO.md`).
- O servidor **mede** o resultado (semente + conta determinística em `js/sys` rodando no Node), nunca aceita pontos/vitória mandados pelo jogo. Exceção declarada: o minijogo (§5), cujo prêmio é pequeno e limitado por dia.

---

## 1. Arena: conjunto PvP e Brasa da Arena (`js/sys/arenaset.js`, `Sys.arenaSet`; fonte nova em `js/sys/bonfire.js`)

### 1.1 Conjunto PvP no retrato da arena
O retrato da arena passa a levar o **conjunto PvP** do jogador: as até 3 magias do preset `arena` do Grimório (`S.sys.grimoire.sets.arena`) e o conjunto de equipamento `arena` do `Sys.loadouts` (`S.sys.loadouts.sets.arena`). Sem preset de arena, vale o de Fases (regra do `Sys.grimoire.loadout`); sem conjunto de equipamento, vale o equipado.

**`POST /arena/snapshot`** (rota que já existe): o corpo ganha o campo opcional `pvp`:
```json
{ "fc": 12345, "atk": 900, "hp": 9000, "def": 300, "critRate": 15, "critDmg": 150, "aspd": 10, "look": {}, "level": 40, "petFrac": 0.2,
  "pvp": { "spells": [ {"id":"cannonball","lv":3}, {"id":"medKit","lv":1}, {"id":"knightCharge","lv":2} ],
           "gear":   { "weapon": "it_123", "armor": "it_456" },
           "pet": "era3_parrot", "mount": "m_horse" } }
```
- `spells`: 0 a 3, sem repetir; `id` ∈ ids de `Sys.grimoire.DATA.spells`; `lv` 1-10.
- **Validação (dono do save)**: cada `spells[i].id` existe em `save.sys.grimoire.own` com `own[id].lv >= lv` (o servidor grava o `lv` do save, não o mandado); cada `gear[slot]` é um id de item que existe no save (mochila ou equipado) e com `item.slot === slot`; `pet`/`mount` existem no save. O que não passar é **descartado em silêncio** (o resto do retrato vale). Nada de 400 por isso.
- Os atributos (`atk`, `hp`...) continuam vindo do `Sys.tower.playerStats` como hoje.

**Luta (`POST /arena/fight`)**: no lugar de `Sys.arena.duelPvp(A, B, seed)` o servidor chama **`Sys.arenaSet.duel(A, B, seed)`**, onde `A` e `B` são os retratos com `pvp.spells`. A função aplica as magias como modificadores fixos (tabela abaixo) e chama o mesmo `Sys.arena.duelPvp`. Sem `pvp.spells` nos dois lados, o resultado é idêntico ao de hoje (mesma semente → mesma luta).

| Tipo da magia (`Sys.grimoire.stat(sp, lv)`) | Efeito no retrato da luta | Teto (somado, por lado) |
|---|---|---|
| `dmg` | `atk × (1 + Σ mult ÷ cd)` | +50% |
| `dmg` com `stun` | além disso, ATQ do **adversário** × (1 − Σ stun ÷ cd) | −20% (junto com esquiva) |
| `heal` | `hp × (1 + Σ (pct ÷ 100) × 30 ÷ cd)` | +50% (junto com escudo) |
| `shield` | `hp × (1 + Σ (pct ÷ 100) × sec ÷ cd)` | (mesmo teto da cura) |
| `buff` `aspd` | `aspd + Σ val × sec ÷ cd` | +30 pontos |
| `buff` `dodge` | ATQ do adversário × (1 − Σ (val ÷ 100) × sec ÷ cd) | (mesmo teto do atordoar) |

### 1.2 Brasa da Arena
- Fonte nova **`'arena'`** em `Sys.bonfire.addBrasas(S, 'arena', 1)`: **1 Brasa por VITÓRIA na arena, até 5 por dia** de Brasília. Derrota não dá. Só com a Fogueira ligada.
- Estado novo no save: **`S.sys.bonfire.ar = { day: 'AAAA-MM-DD', n: <0-5> }`** (Brasas da arena no dia). O `got` sobe junto, como as outras fontes.
- **Teto para o `got`**: a arena soma no máximo **+5 por dia**. Isso **cabe** no teto atual de 300 + 4.800/dia; se o servidor tiver teto por fonte, use `ar.n <= 5`. Marcar save com `ar.n > 5` como implausível.
- Quem credita é o **jogo** (o `fightRewards` da arena já credita pelo host); o servidor não credita Brasa e só confere o teto no save.

---

## 2. Guilda: "Ajudar todos" e o chefe da guilda na batalha (`js/sys/guildboss.js`, `Sys.guildBoss`)

### 2.1 O que é o pedido de ajuda (não existia: hoje o `guild.js` só tem pedido de ENTRADA na guilda)
Cada membro pode abrir **1 pedido de ajuda por dia**, escolhendo o tipo. Os outros membros tocam em **Ajudar** (ou em **Ajudar todos**, que ajuda todos de uma vez). Quando o pedido junta as ajudas pedidas, quem pediu **resgata** o prêmio fixo do tipo.

| Tipo (`kind`) | Ajudas para encher | Quem pediu recebe (ao resgatar) |
|---|---|---|
| `boss` | 3 | **+1 golpe no chefe da guilda** hoje (de 2 para 3 golpes no dia; só vale no dia do pedido) |
| `forge` | 5 | 10 pedras de forja |
| `food` | 5 | 50 de ração de pet |

- **Quem ajuda** recebe, por ajuda dada: **+1 Brasão** (moeda da loja da guilda) e **+2 de contribuição** (XP da guilda). Limite: **10 ajudas por dia** por jogador (= até 10 Brasões/dia, ~70/semana, dentro da conta semanal da loja).
- Não pode ajudar o próprio pedido; ajuda o mesmo pedido **no máximo 1 vez**; pedido cheio não recebe mais ajuda; pedido vence na virada do dia (não resgatado = perdido, o golpe extra também).
- Nada de ouro, diamante ou sorteio. Ninguém troca item com ninguém.

### 2.2 Rotas
**`GET /guild/help`** → lista do dia
```json
{ "day": "2026-11-13", "helpsLeft": 7, "helpsMax": 10, "mine": { "id": "hr_1", "kind": "boss", "need": 3, "got": 1, "full": false, "claimed": false } | null,
  "requests": [ { "id": "hr_2", "playerId": "uuid", "name": "Nome", "kind": "forge", "need": 5, "got": 2, "full": false, "helpedByMe": false } ] }
```
**`POST /guild/help/request`** `{ "kind": "boss" | "forge" | "food" }` → `{ "ok": true, "request": { ...como "mine" } }`
- 400 `bad_kind` · 403 `not_member` · 409 `already` (já pediu hoje)

**`POST /guild/help/:id`** (ajudar um) → `{ "ok": true, "coin": 1, "contrib": 2, "helpsLeft": 6, "request": {...} }`
- 403 `not_member` · 404 `request` · 409 `self` · 409 `helped` (já ajudou este) · 409 `full` · 429 `limit` (10 no dia)

**`POST /guild/help-all`** (ajudar todos) → ajuda, em ordem de criação, todos os pedidos de OUTROS membros, do dia, não cheios e que eu ainda não ajudei, até acabar o limite do dia. **Idempotente por pedido** (chamar de novo não ajuda duas vezes o mesmo).
```json
{ "ok": true, "helped": ["hr_2", "hr_5"], "coin": 2, "contrib": 4, "helpsLeft": 5 }
```
- 403 `not_member` · 429 `limit` (já usou as 10 antes de chamar). Lista vazia não é erro (`helped: []`).

**`POST /guild/help/claim`** (resgatar o meu pedido cheio) → `{ "ok": true, "kind": "forge", "reward": { "forge": 10 } }` (tipo `boss`: `"reward": { "bossHits": 1 }`)
- 404 `request` (não pediu hoje) · 409 `not_full` · 409 `claimed`

### 2.3 Chefe da guilda na batalha
**`GET /guild/boss`** (já existe) passa a trazer também, para a barra na tela de batalha:
```json
{ "name": "...", "level": 3, "hp": 812345, "hpMax": 1500000, "myDamageToday": 45210, "myDamageWeek": 120000,
  "hitsToday": 1, "hitsMax": 2, "hitsLeft": 1, "extraHit": false, "killed": false, "resetsAt": 1763089200000 }
```
- `hitsMax` = `Sys.guild.DATA.boss.hitsPerDay` (2) **+ 1** se o pedido `boss` do dia foi resgatado (`extraHit: true`).
- `POST /guild/boss/hit` (já existe) recusa com **429 `limit`** quando `hitsLeft` = 0 e devolve os mesmos campos atualizados.
- O jogo atualiza a barra com esse GET ao entrar na batalha e a cada 60 s no máximo (`Sys.guildBoss.DATA.pollMs`). Sem servidor, a barra não aparece.

---

## 3. Masmorra cooperativa de 3 (`js/sys/coop.js`, `Sys.coop`): "Ruínas em Trio"

**Assíncrona**, sem WebSocket, igual ao Chefe Mundial: o grupo é montado antes, e a corrida é uma conta do servidor com os **retratos** (fantasmas) dos 3.

### 3.1 Regras
- **Nível**: 30 (`Sys.coop.DATA.needLevel`).
- **Grupo de 3**: o líder cria; convida por **código de amigo** (formato `^[A-Z0-9]{6,10}$`, o mesmo da Dupla) ou **membros da sua guilda** (por id do membro, da lista da guilda). Sem busca de estranhos.
- **Vaga vazia** na hora de começar = **retrato automático** de um jogador de FC parecida (±15% da FC média dos humanos do grupo), escolhido pelo servidor. Retrato não ganha prêmio e não gasta entrada de ninguém.
- **Quem sai** antes da corrida: a vaga passa a ser o **retrato dele** (FC e atributos do último retrato da arena). Durante a corrida não há "sair": a corrida é instantânea.
- **Entradas**: **2 por dia**, grátis, sem compra, sem anúncio, sem VIP. Cada humano que **tem entrada** gasta 1 e ganha o prêmio; humano **sem entrada** pode participar, mas entra como retrato (não gasta, não ganha).
- **Conversa**: só frase pronta da Dupla, por **índice** (0-17). 1 frase a cada 5 s por jogador, até 20 por grupo por dia.

### 3.2 A corrida (conta determinística; o servidor roda `Sys.coop.run(team, seed)`)
- `team` = 3 retratos `{ fc }` (FC do retrato da arena). `fcRef` = **max(mediana, média) das 3 FCs × 3** (Sistemas 13/11, depois do teste de ponta a ponta: com só a mediana, um forte com duas contas fracas, 5000/300/320, vencia os 10 andares). `teamPower` = soma das 3 FCs.
- Andares de 1 a 10, em ordem. No andar `k`: `enemy = fcRef × mult[k]`; `x = (teamPower ÷ enemy)^10` (`DATA.steep` = 10); chance `p = x ÷ (x + 1)`; vence se `rng() < p`, com `rng = mulberry32(seed)` (o mesmo `mulberry` do `Sys.arena`), um sorteio por andar. Perdeu um andar, a corrida acaba.
- Simulado (20.000 corridas, tabela 0,55-1,04 de 14/11): grupo de iguais (ou forte + fracos, que agora conta igual) chega em média ao andar 6,7 e 8,5% chegam ao 10; um fraco no grupo (soma ÷ referência = 0,77) ~3,2. A tabela antiga (0,70-1,60) com a referência nova dava ~3,4 e nunca o 10.
- Prêmio = soma dos andares **vencidos**, para cada humano com entrada. Fixo, sem sorteio no prêmio (só o resultado da luta usa a semente, como na arena).

| Andar | `mult` (inimigo × fcRef) | Fragmentos de relíquia (`relicFrags`) | Pedras de prática (`stones`) | Ouro (`goldk`) |
|---|---|---|---|---|
| 1 | 0,55 | 1 | 1 | 12 |
| 2 | 0,62 | 1 | 1 | 12 |
| 3 | 0,68 | 2 | 1 | 12 |
| 4 | 0,73 | 2 | 2 | 12 |
| 5 | 0,78 | 3 | 2 | 12 |
| 6 | 0,83 | 3 | 2 | 12 |
| 7 | 0,88 | 4 | 3 | 12 |
| 8 | 0,93 | 4 | 3 | 12 |
| 9 | 0,98 | 5 | 3 | 12 |
| 10 | 1,04 | 5 | 4 | 12 |
| **Total (10 andares)** | | **30** | **22** | **120** |

- O ouro de uma corrida inteira é no máximo 120 `goldk` = **um resgate** (teto do `ECONOMIA_OURO`). `relicFrags` = fragmentos genéricos de relíquia (o `Sys.relics` da outra sessão decide para qual relíquia vão; desligado ou ausente, ficam guardados em `S.sys.loot.relicFrags` pelo `Sys.loot.grantBundle`).
- Entrega: **o SERVIDOR credita pelo correio** para todos os humanos com entrada: carta `source: 'coop'`, `ref: '<runId>:<playerId>'` (o `runId` já começa com `r_`, então fica `r_<uuid>:<playerId>`), `att: { relicFrags, stones, goldk }` (a chave `relicFrags` no correio é do agente das relíquias). O `POST /coop/start` e o `lastRun` do status devolvem `reward` com **`mailed: true`** só para a animação: o `Sys.coop.applyResult` **não credita** quando `mailed: true` (só o provider local, sem servidor, credita na hora).

### 3.3 Rotas
**`GET /coop/status`** → `{ "day": "2026-11-13", "entriesLeft": 2, "entriesMax": 2, "party": <party> | null, "invites": [ { "partyId": "p_1", "fromName": "Nome", "at": 1763000000000 } ], "lastRun": <corrida> | null }`

`lastRun` = a última corrida do jogador, no mesmo formato da resposta do `POST /coop/start` (com `ok: true`); o `Sys.coop.applyStatus` passa ela pelo `applyResult` (1 vez por `runId`; com `mailed: true` não credita).

`<party>` = `{ "id": "p_1", "leaderId": "uuid", "members": [ { "playerId": "uuid", "name": "Nome", "fc": 12000, "ghost": false, "entryOk": true } ], "seatsOpen": 1, "sayLeft": 20, "chat": [ { "playerId": "uuid", "idx": 3, "at": 1763000000000 } ] }`

`sayLeft` = frases que ainda **restam ao GRUPO** hoje (volta a 20 no dia novo de Brasília). Vem no `GET /coop/status` e nas respostas de criar e entrar. O `Sys.coop.canSay` usa ele quando vier; sem ele, conta as frases do grupo com data de hoje.

**`POST /coop/party`** `{}` → `{ "ok": true, "party": <party> }` · 409 `in_party` · 403 `level`
**`POST /coop/party/invite`** `{ "friendCode": "AB12CD" }` ou `{ "guildMemberId": "uuid" }` → `{ "ok": true }` · 404 `code` (código não existe) · 403 `not_guild` (não é da minha guilda) · 409 `full` · 403 `not_leader` · 429 `limit` (10 convites/dia)
**`POST /coop/party/:id/join`** → `{ "ok": true, "party": <party> }` · 404 `party` · 409 `full` · 409 `in_party` · 403 `not_invited`
**`POST /coop/party/leave`** → `{ "ok": true }` (vaga vira o retrato de quem saiu; o líder que sai passa a liderança ao próximo humano)
**`POST /coop/party/phrase`** `{ "idx": 3 }` → `{ "ok": true }` · 400 `bad_idx` · 429 `{ code: 'limit', details: { key: 'day' }, retryAfterMs }` (o grupo esgotou as 20 de hoje) ou o mesmo `limit` com a key do intervalo de 5 s. O `Sys.coopNet.say` trava até amanhã com `day` e só o intervalo com a outra key
**`POST /coop/start`** (só o líder) →
```json
{ "ok": true, "runId": "r_1", "seed": 123456789, "fcRef": 36000, "teamPower": 37500,
  "floors": [ { "k": 1, "win": true, "p": 0.9725 }, { "k": 2, "win": true, "p": 0.932 }, { "k": 3, "win": false, "p": 0.8146 } ], "reached": 2,
  "reward": { "relicFrags": 2, "stones": 2, "goldk": 24 }, "mailed": true, "entriesLeft": 1,
  "members": [ { "playerId": "uuid", "name": "Nome", "fc": 12000, "ghost": false, "paid": true } ] }
```
- `floors[].p` = a chance daquele andar (só para mostrar). `members[].paid` = aquele humano tinha entrada e ganhou (o `Sys.coop.applyResult` lê a linha do próprio jogador; o `paid` do topo fica de reserva).
- 403 `not_leader` · 429 `limit` (líder sem entrada) · 409 `no_party` · 409 `snapshot_required` (sem retrato da arena, em criar/entrar)
- Os outros humanos recebem o mesmo `runId` no próximo `GET /coop/status` (campo `lastRun`, mesmo formato, com `mailed: true`) e o prêmio pelo correio.

---

## 4. Ranking de evento (`js/sys/eventrank.js`, `Sys.eventRank`): prêmio só visual

- **Métrica**: pontos GANHOS na trilha do evento = `Sys.evtrail.earned(S, eventId)` (saldo + gasto na loja), contados só dentro da janela do evento do `GET /events` (início até o fim; a fase "loja" não conta).
- **Faixas** (pela posição final `rank` entre `total` jogadores com ≥ 1 ponto): **top 1%** se `rank <= max(1, ceil(total × 0,01))`; **top 10%** se `rank <= ceil(total × 0,10)`; **top 50%** se `rank <= ceil(total × 0,50)`; **participação** se tem ≥ 1 ponto. Uma faixa só por jogador (a melhor).
- **Prêmio só visual**, nenhum atributo, nenhum ouro:

| Faixa (`band`) | Moldura (`frame`) | Título (`title`) | Selo (`badge`) |
|---|---|---|---|
| `top1` | `evt_<evento>_top1` | `evt_<evento>_top1` | `evt_<evento>_top1` |
| `top10` | `evt_<evento>_top10` | `evt_<evento>_top10` | `evt_<evento>_top10` |
| `top50` | — | `evt_<evento>_top50` | `evt_<evento>_top50` |
| `part` | — | — | `evt_part` |

`<evento>` = id do evento no `Sys.events` (ex.: `festival_eras` → moldura `evt_festival_eras_top1`). O nome mostrado sai do jogo (`Sys.eventRank.names`).

**`GET /events/:id/rank`** →
```json
{ "event": "festival_eras", "points": 420, "rank": 37, "total": 5120, "band": "top1" | "top10" | "top50" | "part" | null,
  "cut": { "top1": 52, "top10": 512, "top50": 2560 }, "closesAt": 1764817200000, "final": false,
  "top": [ { "rank": 1, "name": "Nome", "points": 980, "frame": "ouro" } ] }
```
- `top`: até 20 primeiros (nome já filtrado pelo servidor). 404 `event` (id não existe).
- **`POST /events/:id/points`** não existe: o servidor lê os pontos do save sincronizado (`save.sys.events[id]` + `save.sys.evtrail`), com a mesma checagem de plausibilidade do save.
- **Entrega** no fim do evento (`final: true`), **pelo correio**: `source: 'eventrank'`, `ref: '<evento>'`, `att: { "cosmetic": { "frame": "...", "title": "...", "badge": "..." } }` (só as chaves da faixa; **sem** ouro, sem gemas). Uma carta por jogador por evento. O jogo grava pelo `Sys.eventRank.grantVisual(S, host, att.cosmetic)`.

---

## 5. Minijogo de evento (`js/sys/minigame.js`, `Sys.minigame`): sem rota nova por ora

- Minijogo de **timing** (marcador corre, o jogador toca na faixa), **3 tentativas grátis por dia**, nenhuma tentativa paga. Troca de tema a cada **14 dias** (Forja no Ponto, Pesca do Rio, Escavação Relâmpago).
- Prêmio **fixo** pela melhor faixa do dia (Bronze/Prata/Ouro), resgatado 1 vez por dia, e marcos do ciclo de 14 dias (dias jogados com Bronze ou melhor). Sem ouro, sem diamante.
- Fica **local** (o prêmio é pequeno e limitado por dia). O servidor só confere no save: `S.sys.minigame.day.tries <= 3` e `S.sys.minigame.day.claimed` uma vez por dia. Se um dia quiser medir, a rota seria `POST /minigame/claim {cycle, day, taps:[offset...]}` com a mesma conta `Sys.minigame.score(taps)`.

---

## 6. O que carregar no vm do servidor (sem DOM)

Nenhum destes arquivos lê `window` ou `document` (todos usam `typeof window!=='undefined'?window:globalThis`). Ordem de carga num `vm.createContext({})`:

| Chamada | Arquivos `js/sys/`, nesta ordem | Teste que prova |
|---|---|---|
| `Sys.arenaSet.duel(A, B, seed)` | `stats.js` (redução da DEF, a mesma da arena de hoje), `grimoire.js` (`spell`/`stat` das magias), `arena.js` (`duelPvp`), `arenaset.js` | `test/sys/arenaset.test.js`, caso "vm" |
| `Sys.coop.run(team, seed)` | só `coop.js` | `test/sys/coop.test.js`, caso "vm" |
| motor do quadro de ajuda (`Sys.guildBoss.boardRequest/boardHelp/boardHelpAll/boardClaim/boardView`) | só `guildboss.js` (`DATA.kinds`, `helpsPerDay`, `perHelp`) | `test/sys/guildboss.test.js` |
| faixas do ranking (`Sys.eventRank.bandOf(rank, total)`, `Sys.eventRank.prizeFor(evento, faixa)`) | só `eventrank.js` | `test/sys/eventrank.test.js` |

`Sys.arenaSet.duel` sem `pvp.spells` nos dois lados chama `Sys.arena.duelPvp` direto (mesma luta de hoje, byte a byte).

## 7. Resumo para o servidor (o que é novo)

| Item | Rotas novas | Campos novos em rota existente | Save |
|---|---|---|---|
| Arena PvP | — | `POST /arena/snapshot` `pvp`; luta usa `Sys.arenaSet.duel` | `S.sys.bonfire.ar = {day, n<=5}` |
| Guilda | `GET /guild/help`, `POST /guild/help/request`, `POST /guild/help/:id`, `POST /guild/help-all`, `POST /guild/help/claim` | `GET /guild/boss`: `hp, hpMax, myDamageToday, myDamageWeek, hitsToday, hitsMax, hitsLeft, extraHit, killed, resetsAt`; `POST /guild/boss/hit` 429 `limit` | — |
| Masmorra de 3 | `GET /coop/status`, `POST /coop/party`, `/coop/party/invite`, `/coop/party/:id/join`, `/coop/party/leave`, `/coop/party/phrase`, `/coop/start` | correio `source:'coop'` | `S.sys.coop` (espelho) |
| Ranking de evento | `GET /events/:id/rank` | correio `source:'eventrank'` com `att.cosmetic` | `S.sys.eventrank` |
| Minijogo | — | — | conferir `S.sys.minigame.day` |
