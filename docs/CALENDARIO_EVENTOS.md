# Calendário de eventos (seed da tabela game_events)

Feito pela Sistemas em 14/11/2026, a pedido do PO, para a sessão do Servidor (fps-6f) cadastrar por migração.

## Decisão: um id por ocorrência (opção a)

- Cada ocorrência tem id próprio: `<tema>_<AAMMDD do início em Brasília>`. Exemplo: `festival_eras_261120`.
- O jogo acha o tema pelo prefixo (`Sys.events.base(id)` → `festival_eras`). As regras (missões, loja, trilha, chefe) vêm do tema que está no jogo.
- O jogo guarda tudo pelo id completo: pontos e missões (`S.sys.events[id]`), compras com limite (por ocorrência), trilha e chefe (`S.sys.evtrail[id]`) e ranking (`GET /events/:id/rank`, moldura `evt_festival_eras_261120_top1`).
  Uma ocorrência nova começa do zero e não herda compras. Recarregar o jogo não zera a ocorrência em andamento.
- Prefixo desconhecido (tema que esta versão do jogo não tem) é ignorado: não aparece e o estado com esse id é apagado do save.
- Por que (a): o servidor já guarda um registro por id e o ranking soma por (servidor, id). Com (a), o servidor não muda nada. Com (b), o servidor teria que guardar ocorrências e o save teria que zerar a trilha por ocorrência.
- Regras para ids novos: `/^[a-z0-9_]{3,40}$/`; o sufixo é a data de início (dia de Brasília) com 6 dígitos e tem que ser uma data válida; ocorrência com no máximo 60 dias; `start < end ≤ graceEnd`.
- Tema único por enquanto: só existe `festival_eras` (14 dias, carência da loja 2 dias). Por isso o rodízio repete o Festival a cada 2 semanas.
  Quando houver tema novo no jogo, basta trocar o prefixo da ocorrência (com `minClientVersion` da versão que trouxe o tema).

## No jogo (Sys.events)

- `Sys.events.load(S, host)` busca `GET /events` e aplica; `Sys.events.setCalendar(lista, S)` aplica uma lista já recebida. O calendário fica guardado no save (`S.sys.evcal`) para o boot sem rede.
- Sem calendário do servidor, vale o evento local de antes (id `festival_eras`, 20/11 a 04/12, hora do aparelho). Quando o calendário chega, o progresso desse evento local passa para `festival_eras_261120`.
- Para o Engenheiro: chamar `Sys.events.load(S, Sys.host)` no boot depois do login (e ao abrir a tela de Eventos); o tema visual da tela pode usar `ev.base` em vez de `ev.id`.
- **Servidor, ranking:** o `loadEvtrailEarned` roda o `events.js` + `evtrail.js` do jogo sem calendário. Com este commit, `Sys.evtrail.earned(save, "festival_eras_261120")` acha a loja pelo tema (`Sys.events.def`). Com a cópia antiga do game-sys, id com sufixo dá 0 pontos: atualizar a cópia fixada do game-sys para este commit.
- Quem já tem a skin do Festival não consegue comprá-la de novo na ocorrência seguinte (`shop` marca `owned`, `buy` recusa com `possui`).

## Calendário (horário de Brasília, UTC−3)

Início e fim à meia-noite de Brasília. Fim exclusivo. Carência (graceEnd) = fim + 2 dias (`Sys.events.DATA.graceDays`): só resgatar missões completas e gastar na loja.
Na carência de uma ocorrência a seguinte já está ativa (as duas aparecem juntas na tela, como abas).

| # | id | Tema | Início | Fim | Carência até | start (ms UTC) | end (ms UTC) | graceEnd (ms UTC) |
|---|---|---|---|---|---|---|---|---|
| 1 | `festival_eras_261120` | Festival das Eras | 20/11/2026 00:00 | 04/12/2026 00:00 | 06/12/2026 00:00 | 1795143600000 | 1796353200000 | 1796526000000 |
| 2 | `festival_eras_261204` | Festival das Eras | 04/12/2026 00:00 | 18/12/2026 00:00 | 20/12/2026 00:00 | 1796353200000 | 1797562800000 | 1797735600000 |
| 3 | `festival_eras_261218` | Festival das Eras | 18/12/2026 00:00 | 01/01/2027 00:00 | 03/01/2027 00:00 | 1797562800000 | 1798772400000 | 1798945200000 |
| 4 | `festival_eras_270101` | Festival das Eras | 01/01/2027 00:00 | 15/01/2027 00:00 | 17/01/2027 00:00 | 1798772400000 | 1799982000000 | 1800154800000 |
| 5 | `festival_eras_270115` | Festival das Eras | 15/01/2027 00:00 | 29/01/2027 00:00 | 31/01/2027 00:00 | 1799982000000 | 1801191600000 | 1801364400000 |
| 6 | `festival_eras_270129` | Festival das Eras | 29/01/2027 00:00 | 12/02/2027 00:00 | 14/02/2027 00:00 | 1801191600000 | 1802401200000 | 1802574000000 |
| 7 | `festival_eras_270212` | Festival das Eras | 12/02/2027 00:00 | 26/02/2027 00:00 | 28/02/2027 00:00 | 1802401200000 | 1803610800000 | 1803783600000 |

7 ocorrências de 14 dias, sem buraco, de 20/11/2026 a 26/02/2027 (a última passa um pouco de 20/02 para não cortar o rodízio).

`requires`: `events.enabled` (Sys.events.DATA.enabled), `evtrail.on` (Sys.evtrail.DATA.on) e `eventRank.on` (Sys.eventRank.DATA.on), no formato `<módulo>.<campo>` do exemplo do servidor (`pet.v3`).
Hoje o servidor só guarda esse campo. Se um dia ele passar a esconder evento pelo `requires`, tirar `eventRank.on` e `evtrail.on`: o evento funciona sem trilha e sem ranking.
`minClientVersion`: não usado (o tema já está no jogo).

## JSON para o seed

`start`, `end` e `graceEnd` em ms UTC (o que a tabela guarda); `startBrt`, `endBrt` e `graceEndBrt` são as mesmas datas em Brasília, só para conferir.

```json
[
  {"id":"festival_eras_261120","start":1795143600000,"end":1796353200000,"graceEnd":1796526000000,"startBrt":"2026-11-20T00:00:00-03:00","endBrt":"2026-12-04T00:00:00-03:00","graceEndBrt":"2026-12-06T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_261204","start":1796353200000,"end":1797562800000,"graceEnd":1797735600000,"startBrt":"2026-12-04T00:00:00-03:00","endBrt":"2026-12-18T00:00:00-03:00","graceEndBrt":"2026-12-20T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_261218","start":1797562800000,"end":1798772400000,"graceEnd":1798945200000,"startBrt":"2026-12-18T00:00:00-03:00","endBrt":"2027-01-01T00:00:00-03:00","graceEndBrt":"2027-01-03T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_270101","start":1798772400000,"end":1799982000000,"graceEnd":1800154800000,"startBrt":"2027-01-01T00:00:00-03:00","endBrt":"2027-01-15T00:00:00-03:00","graceEndBrt":"2027-01-17T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_270115","start":1799982000000,"end":1801191600000,"graceEnd":1801364400000,"startBrt":"2027-01-15T00:00:00-03:00","endBrt":"2027-01-29T00:00:00-03:00","graceEndBrt":"2027-01-31T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_270129","start":1801191600000,"end":1802401200000,"graceEnd":1802574000000,"startBrt":"2027-01-29T00:00:00-03:00","endBrt":"2027-02-12T00:00:00-03:00","graceEndBrt":"2027-02-14T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]},
  {"id":"festival_eras_270212","start":1802401200000,"end":1803610800000,"graceEnd":1803783600000,"startBrt":"2027-02-12T00:00:00-03:00","endBrt":"2027-02-26T00:00:00-03:00","graceEndBrt":"2027-02-28T00:00:00-03:00","requires":["events.enabled","evtrail.on","eventRank.on"]}
]
```
