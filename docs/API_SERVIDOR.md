# Contrato da API do servidor — Eonbound (v1, PROPOSTA)
Dono do contrato: fps-30 (líder do backend). Lado do jogo: camada de API trocável da fps-c9 (provedor local hoje, servidor amanhã).
Servidor: NestJS + Postgres, repositório `Desktop\fps-server`. Nada aqui está no ar; mudanças no contrato são combinadas com a fps-c9 antes.

## 0. Regras gerais
- Base: `https://<host>/v1`. JSON UTF-8. Corpo do save pode ir com `Content-Encoding: gzip`.
- Toda resposta traz `x-server-time` (ms desde 1970, UTC), inclusive os erros. O cliente usa esse valor para o relógio (§6).
- Autenticação: `Authorization: Bearer <accessToken>` em tudo, menos `/auth/*` e `/time`.
- Erro sempre neste formato: `{ "error": { "code": "save_conflict", "message": "texto para log", "retryAfterMs": 0, "details": {} } }`. A tela lê `code`, nunca `message`.

| HTTP | `code` | Quando |
|---|---|---|
| 400 | `bad_request` | corpo inválido |
| 401 | `token_expired` / `token_invalid` | renovar com `/auth/refresh`; se falhar de novo, voltar ao convidado |
| 403 | `age_restricted` / `banned` | idade não permite (chat) / conta banida |
| 404 | `not_found` | — |
| 409 | `save_conflict` | versão do save mudou na nuvem (§3.3) |
| 413 | `too_large` | save acima de 512 KB (descomprimido) |
| 422 | `save_implausible` | progresso impossível para o tempo de conta (§3.4) |
| 426 | `client_outdated` | versão do jogo abaixo da mínima; `details.minVersion` |
| 429 | `rate_limited` | ver `retryAfterMs` |
| 503 | `maintenance` | ver `retryAfterMs` |

- Todo pedido manda `x-client-version` (ex.: `0.12.0`) e `x-device-id` (UUID gerado no 1º acesso, guardado no aparelho).
- Ids são UUID. Datas são ms UTC (números). Valores de dinheiro nunca passam pelo cliente: o servidor só confere recibos da loja (§7).

## 1. Assíncrono x síncrono (importante para a camada da fps-c9)
Os provedores de hoje (ex.: `Sys.arena.localProvider`) são SÍNCRONOS. O servidor é assíncrono. Regra: a camada do jogo chama a rede em segundo plano e guarda
a última resposta em cache. Os módulos `Sys.*` continuam síncronos e leem o cache. Ações que mudam estado no servidor (luta da arena, resgate de prêmio,
compra) devolvem uma Promise na camada, e a tela espera a resposta. Sem rede, o jogo segue local, e o que precisa do servidor (chat, arena, ranking, compra) mostra "sem conexão".

## 2. AUTH
### 2.1 Convidado (1º acesso)
`POST /auth/guest` — `{ "deviceId": "uuid", "birthDate": "2009-05", "platform": "android", "clientVersion": "0.12.0" }`
→ 200 `{ "accessToken": "...", "refreshToken": "...", "accessExpiresAt": 0, "player": PlayerDto }`
- Conta criada na hora, sem e-mail nem senha. Um mesmo `deviceId` sem token devolve a conta que já existe no aparelho (reinstalação no mesmo aparelho).
- `birthDate` é ano-mês (sem dia), pedido numa tela de idade NEUTRA (sem dica da idade "certa", regra de família do Google). Opcional aqui, mas sem ela
  `ageBand = "unknown"` e a conta é tratada como menor de 13 (§5.4).
- `PlayerDto = { "id", "name", "ageBand": "u13"|"13-17"|"18+"|"unknown", "linked": ["google"], "email": null, "createdAt", "flags": [] }`

### 2.2 Tokens
- Access: JWT de 15 min (`sub` = player id, `ab` = ageBand, `sv` = versão da sessão).
- Refresh: opaco, 60 dias, ROTATIVO. Cada uso troca por um novo. Reusar um refresh já trocado derruba a família inteira (roubo de token).
- `POST /auth/refresh` — `{ "refreshToken" }` → mesmo formato do 2.1.
- `POST /auth/logout` — `{ "refreshToken" }` → 204. Derruba a família inteira desse refresh (o aparelho), sem tocar nas outras sessões.

### 2.2b Sair / trocar de conta (só conta com Google; servidor 14/11)
O convidado é preso ao `deviceId`: o `POST /auth/guest` com o mesmo `deviceId` devolve SEMPRE a mesma conta, mesmo depois de vinculada
ao Google. Por isso "sair" é do CLIENTE, nesta ordem:
1. `PUT /save` com `owner = session.player.id` e esperar o 200 `{version}`. Com 429 (30 s), espere `Retry-After` e repita. Sem nada
   novo, confira `GET /save/head` → `version` igual à que o aparelho tem.
2. `POST /auth/logout {refreshToken}`.
3. Gerar um `deviceId` NOVO e esquecer o antigo. O antigo fica preso à conta Google e não volta mais; a conta volta só por
   `POST /auth/login/google`.
4. Apagar o save local e voltar ao Título.

**Não misturar saves:** todo `PUT /save` leva `owner` (o id do dono do save no aparelho). Se `owner` não for o do token, o servidor
responde 409 `wrong_account {session}` e não grava nada. Sem `owner`, os clientes antigos continuam gravando. Também continuam valendo
o 409 `save_regress` (save menor que o da nuvem) e o `save_conflict` (base velha).

**Limites:** não há limite de contas por aparelho. Valem os do IP: `/auth/guest` 5 por hora e `/auth/login/*` 10 por hora (429
`Retry-After`). Cada "sair + jogar como visitante" cria um convidado novo. Os vazios (Nv ≤ 1, sem compra) somem sozinhos em 30 dias
sem acesso.

### 2.3 Vincular e recuperar (Google Play / Apple)
- `POST /auth/link/google` (autenticado) — `{ "serverAuthCode": "..." }` (Play Games Services v2) ou `{ "idToken": "..." }` (Google Sign-In) → 200 `PlayerDto`.
- `POST /auth/link/apple` (autenticado) — `{ "identityToken": "...", "nonce": "..." }` → 200 `PlayerDto`.
- O servidor valida o token com o Google/Apple; o cliente nunca manda e-mail nem id de conta "soltos".
- `409 link_taken`: essa conta Google/Apple já pertence a outro jogador. `details: { "otherPlayer": { "level", "era", "updatedAt" } }`.
  A tela pergunta qual progresso manter, e o cliente chama `/auth/login/google` para trocar de conta. Nunca há fusão automática.
- `POST /auth/login/google` | `/auth/login/apple` (sem token; aparelho novo) — mesmo corpo + `deviceId` → 200 igual ao 2.1, na conta vinculada.
  Sem vínculo: `404 not_linked`. Entrar numa conta com exclusão pedida há menos de 30 dias CANCELA a exclusão.
- Outros códigos: `409 already_linked` (este jogador já tem OUTRA conta Google/Apple: desvincule antes); `400 bad_request` com `details.reason`
  `google_not_configured` / `apple_not_configured` (servidor sem os ids) ou `play_games_code_todo` (o `serverAuthCode` do Play Games ainda não é aceito; use o `idToken`).
- Apple: o `nonce` é o valor CRU que o cliente gerou; o token da Apple traz o sha256 dele, e o servidor confere.
- `DELETE /auth/link/{provider}` → 200 `PlayerDto`. Recusa com `400 last_identity` se a conta ficar só com convidado e já tiver compras.

### 2.4 Conta
- `GET /me` → `PlayerDto`.
- `PATCH /me` — `{ "name"?, "birthDate"? }`. O nome passa pelo mesmo filtro do chat. A data pode ser corrigida 1 vez (`409 age_locked` depois).
  Subir a faixa de menor para 18+ pede o vínculo Google/Apple (que já informa maioridade) ou revisão manual.
- `POST /me/email` — `{ "email" }` (opcional, para recuperar a conta) → 202; confirma por link. Contas `u13` não podem cadastrar e-mail.
- `DELETE /me` → 202. Exclusão da conta (exigência da Play Store e da LGPD): apaga em 30 dias; o login dentro desse prazo cancela.

## 3. SAVE NA NUVEM
### 3.1 Formato — resposta ao ponto (1) da fps-c9
O servidor guarda o **objeto S inteiro como um blob JSON versionado** (como está hoje no localStorage, com `S.sys.<módulo>`). Ele NÃO valida campo a campo.
Junto, o cliente manda um **resumo** com os números que o servidor confere, e o servidor também confere o resumo contra o próprio blob (os campos
do resumo são lidos de caminhos fixos do S, combinados com a fps-c9 em `summaryPaths`). Assim, módulos novos entram no save sem mudar o servidor.
```json
{ "baseVersion": 41, "saveFormat": 7, "clientVersion": "0.12.0", "deviceId": "uuid", "clientTime": 0,
  "summary": { "level": 63, "xp": 120345, "era": 4, "stage": 812, "fc": 1830000, "gems": 2140, "playSeconds": 512340, "maxRarity": 3 },
  "save": { "...": "objeto S completo" } }
```
- O servidor NÃO tem lista de campos permitidos: o S inteiro é guardado como está. Campos novos entram sem mudar o servidor (ex.: `S.look` da fps-e2,
  só visual, sem FC; reports/sys-e2-api.md §5j). Quando houver servidor, a lista de cosméticos possuídos (`S.look.cos.owned`) passa a vir dos direitos
  do servidor (`GET /entitlements`), como as skins: compra direta (produto `cos_<id>`), evento ou conquista. Nunca sorteio.
### 3.2 Rotas
- `GET /save` → 200 `{ "version": 41, "updatedAt", "deviceId", "summary", "save" }` ou 404 (sem save na nuvem).
- `GET /save/head` → 200 `{ "version", "updatedAt", "deviceId", "summary" }` (sem o blob; usado na abertura do jogo).
- `PUT /save` → 200 `{ "version": 42, "updatedAt" }`. Limite: 1 gravação a cada 30 s por conta (`429`). O cliente grava ao sair, a cada 2 min jogando e em marcos
  (subida de era, compra).
- `GET /save/history` → as últimas 5 versões (`version`, `updatedAt`, `deviceId`, `summary`). `POST /save/restore` — `{ "version" }` → 200 (cria uma versão nova com aquele conteúdo).
### 3.3 Conflito aparelho x nuvem
- O servidor só aceita `PUT` se `baseVersion` for a versão atual. Senão, responde `409 save_conflict` com
  `details: { "cloud": { "version", "updatedAt", "deviceId", "summary" } }`.
- Regra no cliente:
  1. Na abertura, chamar `GET /save/head`. Se a nuvem for a mesma versão que o aparelho conhece: segue.
  2. Se a nuvem é mais nova e o aparelho NÃO mudou desde a última sincronização: baixa a nuvem sem perguntar.
  3. Se só o aparelho mudou: sobe.
  4. Se os DOIS mudaram: a tela mostra os dois resumos lado a lado (nível, era, fase, tempo de jogo, data) e o jogador escolhe. Recomendado em destaque:
     o de maior `playSeconds`. O lado descartado fica no histórico (3.2), dá para voltar.
- Nunca há fusão automática de dois saves.
### 3.4 Validação contra trapaça (o que o servidor VALIDA)
- Tamanho ≤ 512 KB descomprimido. JSON válido. `saveFormat` conhecido.
- O resumo bate com o blob (mesmos números nos caminhos combinados).
- **Teto pelo tempo de conta**: o servidor tem uma tabela `limites` (dia de conta → nível, era, fase e FC máximos), gerada da curva da fps-e2
  (`docs/balance-v9.json`) para o jogador mais rápido possível (VIP 10, jogando sem parar), com folga de 20%.
  Dia de conta = `(agora do servidor − createdAt)`; nunca usa o relógio do aparelho.
- `playSeconds` não pode subir mais do que o tempo real entre duas gravações (+10%).
- Saltos entre versões: nível, era, fase e FC só sobem dentro do possível para o intervalo; 💎 acima do ganho máximo do intervalo + compras confirmadas.
- O que acontece quando falha: o save É GUARDADO, marcado (`save_flags`), e a resposta é `422 save_implausible` com `details.flags` e `details.version`
  (a nova versão gravada: o cliente passa a usá-la como `baseVersion`). A conta entra numa
  fila de revisão; ranking e arena ignoram a conta marcada até a revisão. O jogador não perde nada por falso positivo.
- O servidor não recalcula o jogo inteiro. O que é autoritativo de verdade (ranking, arena, compras, eventos) roda no servidor (§4, §7).
- **Implementado (fps-server, 13/11):**
  - Tabela `limits_curve` = `docs/limits_curve.json` da Sistemas (VIP 10 ativo, dias 0-400, `tools/sim-paredes.js --limits`); o servidor guarda uma cópia em `fps-server/data/` e regrava a tabela na subida quando muda. Vale a linha do **fim** do dia de conta em curso, com +20%. `maxGemsTotal` null = 💎 sem teto por dia.
  - Ritmo entre dois saves (sem depender da tabela): fases 1-90 até 2 por minuto real +10 (`stage_jump`); fases sem fim até 3 por dia +2 (`stage_post_jump`); fase > 90 com conta de menos de 60 dias (`stage_too_early`); FC acima de 4× a anterior +5 000 em menos de 1 h (`fc_jump`). O salto é medido contra a MAIOR fase já guardada (`summary.stageMax`, que o servidor mantém): voltar a uma fase antiga e retornar não conta.
  - `summary.stage` = `S.stage` do jogo (fase 1..N, a mesma contagem do `fcNeed`).

## 4. ARENA E RANKING — baseadas no provider da fps-e2 (ponto 2)
Mesmo formato do `Sys.arena.localProvider`, com o campo `bots:false` vindo do servidor.
| Provider (hoje local) | Rota |
|---|---|
| `listOpponents(S, host, n)` | `GET /arena/opponents?n=5` → `[{ "id", "name", "fc", "skin", "points", "bot": false }]` (a troca da lista: `POST /arena/opponents/refresh`) |
| `fight(S, host, opp)` (o `reportResult` fica só como reserva) | `POST /arena/fight` — `{ "opponentId" }` → `{ "ok", "win", "delta", "points", "seed", "attemptsLeft", "log": [...] }` |
| `getRanking(S, host, {kind, week})` | `GET /ranking?kind=arena|fc&week=2026-W46` → `{ "kind", "week", "list": [{ "rank", "name", "value", "me", "bot" }], "me": { "rank", "value" }, "bots": false }` |
| `weekInfo(S, host)` | `GET /arena/week` → `{ "week", "start", "end", "msLeft" }` (relógio do servidor) |
- **Luta decidida no SERVIDOR** (combinado com a fps-e2, já codado em js/sys/arena.js): o servidor roda o MESMO js/sys do jogo no Node (módulos UMD:
  `Sys.stats`, `Sys.fc`, `Sys.tower.playerStats`, `scaledFoe`, `duel`), então a fórmula é idêntica dos dois lados. O `log` é a sequência de golpes que o
  `duel` gera: o cliente só toca o que veio. Sem `log`, o cliente refaz a luta pelo `seed`, mas o vencedor é sempre o do servidor.
- Retrato de poder: `POST /arena/snapshot` — `{ "fc", "atk", "hp", "def", "critRate", "critDmg", "aspd", "skin", "pet" }`, enviado ao mudar o equipamento.
  O servidor calcula `Sys.fc.fcOfStats({atk, hp, def, critRate, critDmg, aspd})` e recusa (`422 snapshot_mismatch`) se a diferença para o `fc` enviado passar de 1%.
  Também confere o retrato contra o teto por dia de conta (§3.4).
- Limite: 5 lutas por dia e a semana da arena, contados no relógio do servidor (`429 arena_limit`, com `attemptsLeft` em toda resposta).
- Prêmios contra bots e o fechamento da semana só ligam com o servidor: o servidor fecha o ranking da semana e manda o prêmio pelo correio (§8).
- Lista do ranking: top 100 + a posição do jogador. A FC usada no ranking é a do retrato validado.
- **Semana:** a chave é a do jogo (`Sys.fc.weekKey`), a data da segunda-feira (`2026-11-09`). O servidor aceita também `2026-W46` e devolve as duas
  (`week` e `iso`). A virada é à meia-noite de Brasília, no servidor.
- **Regras do servidor:**
  - só os pontos de quem ataca mudam (o defensor não ganha nem perde);
  - luta contra bot gasta tentativa e não dá ponto;
  - conta marcada (`save_review`/`cheater`) ou banida não aparece para os outros;
  - o servidor não completa o ranking com bots (`bots: false`).
- **IMPLEMENTADO (2026-11-12, fps-server):** todas as rotas acima + `GET /arena/status` (`{week, day, attemptsLeft, refreshLeft, points}`), atrás de `ARENA_ON=1` no ambiente
  (desligado = 404 e o jogo segue com o provider local). Fechamento da semana a cada 10 min (idempotente) e prêmio pelo correio (§8, `source: "arena"`).
  Recusa do retrato: `422 snapshot_mismatch` com `details: {reason: "fc", serverFc, sentFc}`. Placar em memória até o PgArenaStore.
- Erros: `400 no_snapshot`, `400 bad_request` (`reason: "self"`), `429 arena_limit` (`reason: "refresh"` ou com `retryAfterMs` até a meia-noite), `400 week_open` (fechamento).

### 4.1 Luta nova da Arena (13/11; fps-server, contrato com o Engenheiro e a Sistemas 53409f3)
- **POST /arena/snapshot** aceita também `look`, `level` e `petFrac`. Nada disso entra na FC: a conferência de ±1% continua só nos atributos.
  - `look` = `{hero, skin, armor, mount:{id, stars 0-7}|null, pet:{base, stage 1-3, fly}|null, wing, aura, weapon:{e 0-25, r 0-5, type}|null, frame}` (`frame` = id da moldura equipada, ex. `ouro`, `vip7`, `nine_eras`; o servidor só guarda se for a equipada no save, `S.sys.profile.frame`; senão `null`) (formato da tela do Engenheiro: `skin` = skin fixa ou null, `armor` = roupa 'aXY' a pé, `weapon.e` = era visual, `type` = família), com ids `[a-z0-9_]`. No jogo, quem monta é `window.heroSnapshot()` do Engenheiro → `{look, level, petFrac}`; quem manda é `Sys.arenaNet.snapshot` (js/sys/arenanet.js, chave desligada). O servidor limpa: id inválido vira null, número fora do intervalo vira o limite, campo desconhecido some. O retrato nunca é recusado por causa da aparência.
  - `level` = nível do jogador.
  - `petFrac` = parte do ATQ que vem do pet (0..0,9; o mesmo `petFracOf` do jogo).
- **GET /arena/opponents**: cada adversário traz `look` e `level`. O real vem com a foto dele; o bot, com `Sys.arena.botLook` pelo nível (nível do jogador ± `botLook.levelSpread`). Retrato sem `level` = bots com `level:null, look:null`, como antes.
- **POST /arena/fight**: a luta é `Sys.arena.duelPvp` (me × `scaledFoe`(me, FC do defensor)), com o `petFrac` de cada retrato; para o bot, a regra do jogo (com pet no look = o mesmo do atacante, senão 0). Cada entrada do `log` traz `k:'hit'|'pet'|'ult'` e `en`. A resposta ganha dois campos:
  - `opp:{id, name, fc, level, look, bot}`, para desenhar o oponente;
  - `rewards:{gold:null, goldk, gems, chest}` (`Sys.arena.DATA.fightRewards`): o servidor decide `gems` (1ª vitória do dia) e `chest` (n-ésima luta do dia) pela contagem dele; o ouro é `goldk` × o `goldUnit` do jogo (só o jogo sabe). **O servidor não credita nada**: o jogo credita pelo host, uma vez.
- Robô e jogador real: os mesmos campos.

## 5. CHAT (WebSocket) — ponto 5
- Gateway Socket.IO no caminho `/chat`, com o access token no `auth` do handshake. Token vencido: o servidor manda o evento `auth_expired`, e o cliente renova o token e reconecta.
- Canais: `world` e `era:<n>` (a era liberada do jogador; o servidor confere pelo save).
### 5.1 Eventos
| Direção | Evento | Corpo |
|---|---|---|
| cliente → | `join` | `{ "channel": "world" }` → resposta `{ "ok", "history": [Msg] }` (últimas 50, no máximo 24 h) |
| cliente → | `leave` | `{ "channel" }` |
| cliente → | `send` | `{ "channel", "text" }` ou `{ "channel", "phraseId" }` → resposta `{ "ok", "id" }` ou `{ "ok": false, "code" }` |
| ← servidor | `msg` | `Msg = { "id", "channel", "from": { "id", "name", "era", "skin" }, "text", "phraseId", "at" }` |
| ← servidor | `removed` | `{ "id" }` (mensagem apagada pela moderação) |
| ← servidor | `muted` | `{ "until", "reason" }` |
- Códigos de recusa do `send`: `rate_limited`, `muted`, `filtered` (mensagem bloqueada, sem eco para os outros), `age_restricted`, `too_long` (máx. 120 caracteres).
### 5.2 Filtro (no servidor, antes de repassar)
Palavrão (lista PT-BR + EN, com variações: l33t, acentos, letras repetidas, espaços); dados pessoais (telefone BR e internacional, e-mail, CPF, CEP e
endereço com número, links e domínios, @ de redes sociais, números longos). Bloqueado = não sai do servidor e entra no log. Palavrão leve vira `***`.
### 5.3 Moderação
- `POST /chat/report` — `{ "messageId", "reason": "ofensa"|"dados_pessoais"|"golpe"|"spam"|"outro" }`. Com 3 denúncias de jogadores diferentes, a mensagem
  some (`removed`) até a revisão.
- `POST /players/{id}/block` / `DELETE /players/{id}/block`: o bloqueado some para quem bloqueou (filtra no servidor). `GET /me/blocks`.
- Silenciar: automático (5 mensagens filtradas em 10 min = 10 min sem chat; reincidência dobra) e manual, pelo moderador.
- Limite: 1 mensagem a cada 3 s e 10 por minuto, por conta. Contas com menos de 1 h de jogo só leem.
- Tudo vai para o `moderation_log` (quem, o quê, regra, ação). Painel do moderador: fase 2.
### 5.4 Menores (decisão do dono, regras de família do Google + ECA Digital)
- `ageBand` `u13` ou `unknown`: no `send` só vale `phraseId`, de uma lista fixa (`GET /chat/phrases` → `[{ "id", "text" }]`: "Boa sorte!", "GG", "Alguém para
  a arena?"...). Mandar texto livre volta `age_restricted`. Esses jogadores também não veem texto livre: recebem só as frases prontas.
- `13-17`: texto livre com o filtro mais forte (todo palavrão bloqueado, não só mascarado).
- **Decisão do dono (2026-11-12):** as faixas de idade foram aprovadas como estão acima, e o texto livre só liga depois do parecer jurídico. Até lá, o chat liga
  com **frases prontas para TODOS**, e o servidor recusa texto com `age_restricted`. Moderação feita pela equipe da empresa, num painel (`/admin`, fora deste contrato).
- A tela de idade neutra no 1º acesso é do cliente (fps-c9), e o texto da tela é do PO (ECA Digital, ver docs/RECOMENDACOES.md; a classificação etária muda com chat).

## 6. RELÓGIO — ponto 3
- `GET /time` (sem token) → `{ "now": 0 }`. Toda resposta também traz `x-server-time`.
- No jogo: `Sys.clock` passa a aceitar a hora do servidor (`host.serverNow()`, com o desvio medido na última resposta). Com servidor, os dias, as semanas,
  os eventos e o retorno contam pelo relógio do servidor; sem rede, continua a regra de hoje (não volta no tempo, salto com o app aberto não conta).
  Essa mudança é minha (js/sys/clock.js), atrás de chave.
- Eventos: `GET /events` → `[{ "id", "start", "end", "graceEnd" }]`, sempre no relógio do servidor.

## 7. COMPRAS — ponto 4
- Só recibo de loja. O jogo nunca vê cartão: a compra é feita pelo Google Play Billing / StoreKit, e o servidor confere.
- `POST /purchases/google` — `{ "productId", "purchaseToken", "orderId" }` → 200 `{ "status": "granted"|"already_granted"|"pending"|"invalid", "grants": [...], "entitlements": Entitlements }`.
  O servidor confere na Google Play Developer API, reconhece (acknowledge) a compra e consome os itens consumíveis.
- **Antes de comprar:** `GET /purchases/account-id` → `{ "obfuscatedAccountId" }`. O app passa esse valor em `BillingFlowParams.setObfuscatedAccountId`.
  O servidor recusa (`403 account_mismatch`) compra feita com outro valor, e também a compra sem esse valor. O mesmo `purchaseToken` em outra conta → `409 token_used`.
- **Quem reconhece (acknowledge) e consome é o SERVIDOR:** o app não chama `acknowledge` nem `consume`. Produto fora do catálogo → `400 unknown_product`.
  Pagamento pendente (ex.: boleto) → `status: "pending"`, e a entrega vem sozinha quando o Google avisar (a tela pode consultar `GET /entitlements`).
- **Catálogo aprovado** (ids, preços e conteúdo: `fps-server/docs/google-play-setup.md`): `gems_60/130/350/750/1600/3400` (1ª compra de cada pacote em dobro),
  `monthly_card`, `pass_premium` (temporada atual do servidor), `first_offer`, `skin_<id>`. Pontos VIP = reais pagos (o servidor soma em centavos).
- `GET /offers` → `[{ "productId", "endsAt" }]`: a 1ª chamada MARCA o início da janela de 24 h da oferta de 1ª compra, no relógio do servidor.
  A tela usa só o `endsAt` daqui, nunca o relógio do aparelho.
- `GET /purchases/can-buy?productId=` → `{ "ok", "reason"?, "endsAt"? }`, chamado ANTES de abrir a compra no Google. Motivos possíveis:
  `already_bought`, `offer_not_seen`, `offer_expired`, `already_premium`, `already_owned`, `unknown_product`.
- `POST /purchases/monthly-card/claim` → `{ "gems": 60, "daysLeft" }`, uma vez por dia de Brasília. Dia não resgatado se perde. Erros: `404 no_active_card`, `409 already_claimed`.
- **ENTREGAS (mudança de 2026-11-12, para o lançamento):** o jogo aplica SÓ o que vem de `GET /purchases/deliveries` → `[{ "id", "grants": [...], "revoke": false, "createdAt" }]`.
  O `grants` da resposta do `POST /purchases/google` passa a ser só informativo (mostrar "você recebeu"). Fluxo: ao abrir o jogo e depois de cada compra, pedir as entregas,
  aplicar cada uma (regras abaixo), gravar o save e confirmar `POST /purchases/deliveries/{id}/ack` (idempotente). Assim nada se perde se o app fechar no meio,
  e a compra pendente (boleto) confirmada depois pelo Google também chega. `revoke: true` = estorno de uma entrega já aplicada: tirar o que der (💎 até 0,
  pontos VIP, skin, passe). Entrega estornada antes de aplicada some da lista. No jogo: `Sys.net.deliveries()` e `Sys.net.ackDelivery(id)` (js/sys/net.js).
- **Como o jogo aplica cada entrega (`grants`):**
  - `gems` → `host.addGems`, EXCETO quando vier `deliveredBy: "offer"`;
  - `bundle` com `att.offer` → `Sys.offer.grant(S, host)` da fps-e2 (que já soma os 💎 da oferta);
  - outro `bundle` → `Sys.loot.grantBundle(S, host, att)`;
  - `vip_points` → `Sys.vip.addPoints`;
  - `pass_premium` → `Sys.pass.setPremium` se `season` = a atual;
  - `skin` → `host.addSkin`;
  - `monthly_card` → só mostra o cartão.
  O servidor é a fonte da verdade: em caso de dúvida, consulte `GET /entitlements`.
- `POST /purchases/apple` — `{ "transactionId" }` → igual (App Store Server API).
- `GET /entitlements` → `{ "vip": { "points", "level" }, "passPremium": { "season", "active" }, "skins": [...], "purchasedGems": 0 }`.
- Reembolso e estorno: notificações da loja (Google RTDN, Apple Server Notifications v2) em `/webhooks/*`. O servidor tira o que foi dado ou marca saldo devedor.
- **Lançamento na Play (fps-server, 13/11):** tudo atrás de `BILLING_ON=1` (sem a chave: `POST /purchases/google` e o webhook respondem 404, nada é creditado).
  Recibo de um produto mandado como outro → `409 product_mismatch`. Reembolso (RTDN ou varredura de 6 h) tira o que foi dado e marca a conta `refunded` (ficha do painel).
  Reconhecer/consumir atrasado: rotina de 10 min. O que o dono configura no Play Console: `fps-server/docs/google-play-setup.md`.
- Regras duras: 💎 nunca compra VIP nem Passe Premium; nenhum sorteio pago. O servidor recusa produto que não estiver no catálogo (`products`).

## 8. Correio do servidor
- **Ouro no correio** (dono 14/11; fps-server d8234e9): sempre `goldk` (em abates; o jogo multiplica pelo ouro de um abate), no máximo **120 por carta**. `gold` absoluto é RECUSADO (400 `bad_request`, `fields:["gold"]`), assim como `goldk` acima de 120. Vale também para a carta da equipe pelo painel. O `mail.js` do jogo também corta em 120 (`goldkCap`).
`GET /mail` → `[{ "id", "title", "body", "att", "expiresAt" }]`; `POST /mail/{id}/claim` → `{ "att" }` (o cliente entrega pelo `Sys.loot.grantBundle`).
O resgate é idempotente (2º resgate → `409 already_claimed`).

## 9. Limites (resumo)
| O quê | Limite |
|---|---|
| `PUT /save` | 1 a cada 30 s; 512 KB |
| Chat | 1 a cada 3 s; 10 por minuto; 120 caracteres |
| `/auth/guest` | 5 por hora por IP; 3 contas novas por aparelho por dia |
| Arena | conforme as entradas do jogo (conferidas no servidor) |
| Geral | 120 pedidos por minuto por conta |

## 10. GUILDAS — PROPOSTA de rotas (spec: reports/spec-guildas.md; plano: reports/backend-guildas.md). NADA implementado até o voto do dono.
Tudo que vale prêmio é decidido no servidor, com o mesmo `js/sys` do jogo (vm) e o retrato de poder validado (§4). No jogo, o `Sys.guild` da fps-e2
usa um provider trocável (como a arena); sem servidor, a guilda fica fechada.
### 10.1 Guilda e membros
- `POST /guilds` `{ nameA, nameB, styleIdx?, emblemId, lang, open, minLevel }` → `Guild` (NOME POR LISTAS FIXAS, docs/GUILDA_NOME.md, no ar desde 14/11 49c0fd4: `name` = a[nameA] + " " + b[nameB] do guild.js; texto livre → 400 `fields:["name"]`, índice fora → 400 `fields:["nameA"|"nameB"|"styleIdx"]`, `description` com texto → 400; o par é único POR SERVIDOR → 409 `name_taken`; transição: `{name}` só se for exatamente um nome das listas). `PATCH /guild {nameA, nameB}` (líder; `renameFree` ou 30 dias depois de `renamedAt`, senão 429 `rename_cooldown` + retryAfterMs) · `PATCH /guild {styleIdx}` (líder; 1 por dia de Brasília, senão 429 `restyle_cooldown`). `GET /guilds?search=` (sem acento, por trecho) e `?a=- `POST /guilds` `{ name, emblemId, lang, open, minLevel }` → `Guild`.b=`. GuildView ganha `nameA, nameB, styleIdx, renameFree, renamedAt, styledAt`; `description` vem sempre `""`.
  - Precisa do nível 30. O custo de 8 h de farm em ouro é cobrado pelo cliente e conferido no save. Nome e emblema passam pelo filtro do chat.
  - Erros: `name_taken`, `name_filtered`, `level_required`, `already_in_guild`, `cooldown` (24 h depois de sair).
- `GET /guilds?search=&lang=&open=` (lista paginada) · `GET /guilds/{id}` · `GET /guild` (a minha, com membros, cargos, nível, XP e vagas).
- `POST /guilds/{id}/join` → `{ status: "joined"|"requested" }` · `POST /guild/requests/{playerId}/(accept|decline)` · `POST /guild/invite {playerId}`.
- `POST /guild/leave` (perde a moeda não gasta) · `POST /guild/members/{id}/(kick|promote|demote)` · `POST /guild/leader {playerId}` · `PATCH /guild`.
  - Erros: `forbidden` (o cargo não permite), `guild_full`, `rejoin_cooldown` (7 dias para voltar à mesma guilda).
- Liderança automática: o líder ausente por 7 dias passa a liderança ao oficial mais ativo, por uma rotina diária do servidor.
- Para a tela: `Guild = { id, name, emblemId, level, xp, xpNext, members, maxMembers, open, minLevel, lang, power, bonus: { blessings, territory } }`.
### 10.2 Troca (mural de pedidos e doação de item) — atrás de chave; SÓ 18+ até o parecer
- `POST /guild/requests-board { slot, minRarity }` (24 h) · `GET /guild/requests-board`.
- `POST /guild/gifts { itemId, toPlayerId, boardRequestId? }` → `{ gift, item }`. O item chega no Nv 1, o doador recebe 50% do ouro investido, e os portões valem para quem recebe (acima do portão, fica guardado).
  - Erros: `age_restricted`, `member_too_new` (7 dias), `item_too_new` (24 h), `item_not_tradeable` (comprado, oferta, pet, skin, VIP, montaria...), `daily_limit` (doar 3, receber 2, mesmo par 1).
- `GET /guild/gifts/log` (30 dias; só líder e oficiais).
- Pré-requisito: inventário de itens oficial no servidor (o mesmo do leilão).
### 10.3 Torneio do Poder (semana no relógio de Brasília) — ENTREGA A IMPLEMENTADA (fps-server 1f568d8; atrás de `TOURNEY_ON=1` + `GUILD_ON=1`, por servidor)
Decisões do PO (13/11): 15 contra 15 (configurável), batalhas sexta e sábado às 20h de Brasília (configurável), prêmios pelo correio. Os números vêm do `Sys.guild.DATA` do jogo (season, territory, rankPoints, capitalMinEra, tourney.size, perms): o servidor carrega o js/sys/guild.js, não copia tabela.
- **Territórios:** 28 por servidor, ids `r<era>t<1-3>` (era 0-8) e `capital`. O mapa de cada servidor é separado.
- **Dias de batalha (`slot`):** `'d5'` = sexta, `'d6'` = sábado, às 20h; a escalação trava 1 h antes (19h).
- `GET /tourney` → `{week, phase:'declare'|'battle'|'prize', now, size, battles:[{slot, at, lockAt}], map:[{id, region, capital, owner:{id,name}|null, attacks:[{slot, attacker:{id,name}}]}], my:{guildId, role, canDeclare, canLineup, attacksLeftToday, lineups:{d5:[ids], d6:[ids]}, territories:[ids]}}`.
- `POST /tourney/declare {territory, slot}` (líder/oficial, permissão `declare` do Sys.guild; segunda a quinta). Erros:
  - `409 tourney_phase` (fora de seg-qui), `409 own_territory`, `429 daily_limit` (2 por guilda por dia);
  - `409 territory_busy` (já há ataque a esse território nesse dia), `409 defender_busy` (defendOne: o dono já defende outro território nesse dia);
  - `403 era_too_low` (mediana de era dos 15 de maior FC < região; Capital: < `capitalMinEra`). Na trava (entrega B) a regra é conferida de novo com a escalação de verdade.
- `GET /tourney/lineup?slot=d5` → `{slot, members, lockAt, locked}` · `PUT /tourney/lineup {slot, members:[playerId…]}` (líder/oficial; até 15; só membros na guilda desde 24 h antes da trava). Erros: `409 lineup_locked`, `409 member_too_new {ids}`, `400 bad_request` (não é membro, repetido, mais de 15).
- **Entrega B — IMPLEMENTADA (fps-server 6be1324, migração 012).** Uma rotina a cada 5 min (idempotente; resolve também a semana anterior, se o servidor estava fora do ar no horário):
  - **Trava (19h):** copia o retrato validado de cada escalado, em ordem de FC. Quem saiu da guilda, ou está sem retrato, fica fora (vaga vazia). Trocar de equipamento depois não muda a batalha.
  - **Batalha (20h):** rei da colina com `Sys.tower.duelCarry` e atributos reais. O vencedor segue com a vida que sobrou; empate no tempo, o lutador do defensor fica. Se o atacante vence, o território muda de dono na hora (a batalha de sábado já vê o dono novo).
  - **Motivos (`reason`):** `fight`; `neutral` (sem dono: o atacante com pelo menos 1 lutador toma); `walkover` (o dono sem lutador); `empty` (o atacante sem lutador); `era` (a mediana de era da escalação travada ficou abaixo da região); `owner`.
  - `GET /tourney/battles?week=` → `{week, list:[{id, territory, slot, attacker:{id,name}, defender:{id,name}|null, winner, winnerName, reason, duels:[{a, b, win, hpLeftA, hpLeftB, seed, timeout, log}], at}]}`. O `log` de cada duelo é o do `duelCarry` (para animar); `a`/`b` são os ids dos jogadores. Os nomes e atributos de cada lutador ficam na escalação travada.
- **Entrega C — IMPLEMENTADA (fps-server 12b7a23, migração 013):**
  - **Bônus:** com o torneio ligado, `GET /guild` traz `territories:[{region, capital}]`, que o `Sys.guild.territoryBonus` do jogo já transforma em ouro/XP/drop com teto.
  - `GET /tourney/ranking?kind=tournament|territory&week=` → `{kind, week, list:[{rank, guildId, name, wins, points, me}] (top 50), me}`. `wins` = ataques que tomaram ou defesas que seguraram numa luta; `points` = `Sys.guild.territoryPoints`. Só do servidor do jogador.
  - **Domingo (`prizeDay`), uma vez por semana:**
    - **Baú por território:** cada membro da guilda dona recebe, pelo correio, 1 item por território, na raridade-teto que ELE pode receber (o `maxAllowedR` do `Sys.loot`, pelos portões de nível e era; espaço sorteado fora a asa), mais `weeklyChest.mats` × territórios.
    - **Prêmio do ranking do torneio** (`Sys.guild.tourneyReward`), só para guilda com vitória, a quem estava na escalação travada da semana (inclusive quem saiu depois): os Brasões são creditados no servidor (na guilda; quem saiu não recebe Brasão) e os fragmentos do Prismático vão pelo correio como `petFrags:{prism:n}`. A moldura (`frame`) ainda não é entregue.
  - Batalhas: sexta e sábado às 20h, rei da colina 15 contra 15 (N configurável) com atributos reais, fila por FC. Cada duelo usa `Sys.tower.duelCarry(A, B, seed, hpA0, hpB0)` → `{win, hpLeftA, hpLeftB, hpA, hpB, log, timeout}` (fps-e2): as vidas iniciais são absolutas, e `timeout` = empate, que dá o território ao defensor.
  - O vencedor de cada duelo segue com a vida que sobrou. Empate por tempo: o defensor fica. Domingo é o dia dos prêmios.
- Bônus de território, no teto: ouro +10%, XP +5%, drop +5%. Ficam em `Guild.bonus.territory`; no jogo, `Sys.guild.perks(S)` → `{goldPct, xpPct, dropPct}` (já no teto), e o `Sys.loot` soma ao do VIP. As bênçãos de atributo entram no `bonus()` do `Sys.fc`.
### 10.4 Ranking, chefe, loja, doações, bênçãos, missões, check-in
- `GET /guild-ranking?kind=power|territory|tournament&week=` (top 100 + a minha). Prêmios do torneio aos domingos pelo correio (1º: 300 moedas + 3
  fragmentos do Prismático...), para quem lutou ou estava escalado, inclusive quem foi expulso nos últimos 3 dias.
- `GET /guild/boss` · `POST /guild/boss/hit` → `{ damage, seed, log, hitsLeft }` (2 por dia; dano simulado no servidor). Prêmio fixo por faixa de dano.
  - Campos da barra do chefe na batalha (SERVIDOR_LOM §2.3, no ar com `GUILD_ON`): `name, level, hp, hpMax, myDamageToday, myDamageWeek, hitsToday, hitsMax, hitsLeft, extraHit, killed, resetsAt`; o `boss/hit` devolve os mesmos já atualizados. Sem golpes: 429 `daily_limit` (não `limit`; é o que a tela de hoje lê).
- **"Ajudar todos"** (SERVIDOR_LOM §2.1/§2.2, formato exato lá): `GET /guild/help` · `POST /guild/help/request {kind}` · `POST /guild/help/:id` · `POST /guild/help-all` · `POST /guild/help/claim`. **Chave própria `GUILDHELP_ON` (DESLIGADA; fps-server 14/11)**: desligada = 404 `not_found` nas 5 rotas, e sem resgate não existe golpe extra (`extraHit` fica `false`). Ligar junto com o `Sys.guildBoss.DATA.on` do jogo. Prova de ligada no `switch-check.mjs`: 403 `not_member` de quem não tem guilda.
- `GET /guild/shop` · `POST /guild/shop/buy { itemId }` (Brasões, limite semanal, nada sorteado).
- `POST /guild/donate { kind: "gold_s"|"gold_l"|"gems" }` (1 de cada por dia). Os ids são os do `Sys.guild.DATA.donate` do jogo, que o servidor lê; "gold_small"/"gold_big" eram o rascunho antigo. Id fora da lista: 400 `bad_request` `fields:["kind"]`.
  - A de 💎 (50 → 40 Brasões + 80 XP) foi mantida pelo PO, com limite de 1 por dia.
  - Hoje o servidor NÃO vê o saldo de 💎: o cliente debita, e o servidor confere pelo resumo do save (§3.4). Por isso o limite diário é a trava.
- `GET /guild/blessings` · `POST /guild/blessings/{id}/upgrade` (líder e oficiais, com XP da guilda; teto ATK +5%, Vida +5%, DEF +3%, ouro +10%, ração +10%).
- `GET /guild/missions` · `POST /guild/missions/{id}/claim`. As missões contam só eventos que o servidor vê.
- `POST /guild/checkin` (+5 Brasões, +5 XP da guilda, uma vez por dia de Brasília).
- Chat da guilda: canal `guild:<id>` no gateway do chat (§5), com frases prontas para TODOS até o parecer. Depois, vale a regra de idade da spec (menor de 16, só frases).

### 10.5 Guilda V2 e Torneio V2: formato EXATO das respostas (gerado do código, fps-server, 13/11)
- **Criar** `POST /guilds {nameA, nameB, styleIdx?, emblemId, lang, open, minLevel}` (nome por listas, ver acima): `emblemId` é texto livre de até 24 caracteres. O número `0` é aceito e volta como `"0"`.
- **`GET /guild`** →
  - `{guild:GuildView, me:{role, coin, contrib, donatedToday:["donate:gold_s","checkin"], checkinToday:true}, members:[…], requests:[…]}`;
  - cada membro: `{id, name, role, contrib, joinedAt, lastSeen, me, fc?, level?, era?}`;
  - `requests` (só para quem pode aceitar): `[{id, name, at}]`, em que `id` = o jogador que pediu (use em `/guild/requests/:id/accept`).
  - `donatedToday` traz as chaves feitas no dia de Brasília: `donate:<kind>` e `checkin`. `checkinToday` é o mesmo dado como booleano.
- **Doar** `POST /guild/donate` → `{guild:GuildView, coin, gained:{xp, coin, contrib}, cost:{goldk, gems}}` (o cliente debita o `cost`). **Check-in** `POST /guild/checkin` → `{guild, coin, gained}`. Repetido no dia: 429 `daily_limit` `{key}` com `retryAfterMs` até a virada.
- **Chefe** `GET /guild/boss` → `{week, hpMax, hpLeft, down, hitsLeft, myDamage, top:[{id, name, damage}], bands:[{minRatio, coin, forge?, food?, essence?}], kill:{xp, coin, forge, food, essence}}`.
  - Golpe `POST /guild/boss/hit` → `{damage, seed, log, timeout, killed, band, hitsLeft, hpLeft, hpMax}`.
- **Loja** `GET /guild/shop` → `{coin, week, items:[{id, name, cost, weekly, minLevel, give:{…}, bought, left, locked}]}`.
- **Missões** `GET /guild/missions` → `{week, list:[{id, name, counter, target, xp, coin, progress, done, contributed, claimed}]}`.
- **Torneio, batalhas** `GET /tourney/battles` → `{week, list:[{id, slot, territory, attacker:{id, name}, defender:{id, name}|null, winner, reason, duels, at, …}]}`.
  - `winner` = id da GUILDA vencedora (compare com `attacker.id` / `defender.id`; `null` em empate sem dono).
  - `reason`: `fight` | `neutral` | `walkover` | `empty` | `era` | `owner`.
- **Torneio, trava da escalação:** `lockAt` vem na resposta do `PUT /tourney/lineup` (`{ok, slot, members, lockAt}`), no 409 `lineup_locked` (`details.lockAt`), no `GET /tourney/lineup?slot=` (`{slot, members, lockAt, locked}`) e em `GET /tourney` → `battles:[{slot, at, lockAt}]` (o `lineups` dali é só `{d5:[ids], d6:[ids]}`).
- **Arena contra robô:** gasta a tentativa, mas `delta` 0 e nenhum ponto. É regra do servidor; a tela pode mostrar "sem pontos".
- **Erro 429 do limitador por IP** (ex.: 5 convidados por hora): `retryAfterMs` agora vem do `Retry-After` real, em milissegundos (antes vinha 0).
- **Horários:** `requests[].at`, `joinedAt`, `lastSeen`, `at` e `lockAt` são em MILISSEGUNDOS desde a época (UTC), como todo horário deste contrato.
- **Batalha com `reason: "owner"`:** o atacante já era o dono do território na hora da batalha (venceu antes outra batalha pelo mesmo território). Então `defender.id === attacker.id` e `winner` é o próprio atacante.
  - A tela deve escrever "já era dono", não "X ataca X". `duels` vem vazio.
- **Doação e ouro:** o servidor NÃO confere o ouro. O resumo do save não traz ouro, e o `cost.goldk` só informa quanto o cliente debita.
  - Debitar `goldk × Sys.host.goldUnit()` da fase atual (a mesma conversão do `createCost`) é decisão do jogo, e não marca o save.
  - Diamantes, sim: o resumo traz `gems`, e o teto por dia de conta vale (§3.4).
- **Códigos de erro por rota** (`error.code`; 400 `bad_request`, 403 `forbidden`, 404 `not_found` e 404 `not_in_guild` podem vir em qualquer uma):

  | Rota | Códigos próprios |
  |---|---|
  | `POST /guilds` (criar) | `already_in_guild`, `level_required`, `name_taken`, `name_filtered`, `description_filtered`, `cooldown`, `rejoin_cooldown` |
  | `PATCH /guild` | `name_taken`, `name_filtered`, `description_filtered` |
  | `POST /guilds/:id/join` | `already_in_guild`, `guild_full`, `cooldown`, `rejoin_cooldown` |
  | `POST /guild/requests/:id/accept` | `guild_full` |
  | `POST /guild/members/:id/promote` | `officers_full` |
  | `POST /guild/donate`, `POST /guild/checkin` | `daily_limit` (429, com `retryAfterMs`) |
  | `POST /guild/blessings/:id/upgrade` | `banner_cap`, `not_enough_xp` |
  | `POST /guild/shop/buy` | `guild_level`, `weekly_limit`, `not_enough_coin`, `mail_unavailable` |
  | `POST /guild/boss/hit` | `boss_unavailable`, `snapshot_required`, `boss_down`, `daily_limit` (429) |
  | `POST /guild/missions/:id/claim` | `mission_not_done`, `already_claimed`, `not_contributed` |
  | `GET /guild-ranking` | `ranking_unavailable` |
  | `POST /tourney/declare` | `tourney_phase`, `own_territory`, `daily_limit` (429), `territory_busy`, `defender_busy`, `era_too_low` |
  | `PUT /tourney/lineup` | `lineup_locked` (`details.lockAt`), `member_too_new` (`details.ids`, `hours`) |

  - No jogo, `Sys.guildNet` e `Sys.tourneyNet` devolvem `{ok:false, reason, details, retryAfterMs}` (game 003ebd3).

## 11. SERVIDORES (realms) — IMPLEMENTADO (fps-server af8ebbb; regras: docs/SERVIDORES.md)
- **Identificador:** `'s1'`, `'s2'`... (`^s[0-9]{1,3}$`). Ausente = `'s1'`. Estados: `new` | `open` (aceitam personagem novo) | `full` | `closed` (só quem já tem personagem entra).
- **`GET /realms`** é público. Com `Authorization` válido, cada servidor traz o personagem do jogador nele; token inválido é tratado como sem token (nunca 401). Resposta:
  `[{ id:'s1', code:'S1', name:'Nova Era', state:'open', recommended:true, openedAt:<ms>, me:{ name, level, fc, hero, avatar } | null }]`
  - `me` vem do resumo do último save aceito daquele personagem. `fc` é a FC REAL; a tela converte para exibição.
- **Login por servidor:** o corpo leva `realm` (padrão `'s1'`).
  - `POST /auth/guest { deviceId, birthDate?, platform?, realm }`: mesmo aparelho no mesmo servidor = o mesmo personagem; em outro servidor = outro personagem.
    Erros: 400 (realm inválido); 409 `realm_closed` (criar personagem em servidor inexistente, `full` ou `closed`).
  - `POST /auth/login/google { idToken, deviceId?, realm }`: 404 `not_linked` quando a conta Google não tem personagem NAQUELE servidor (o jogo cria como convidado e vincula); 404 `realm_not_found`.
  - `POST /auth/link/google`: vincula a conta Google ao personagem da sessão. A mesma conta Google pode estar vinculada a um personagem em cada servidor, sem conflito.
  - O access token leva `rlm`. `POST /auth/refresh` mantém o servidor. O `player` da sessão traz `realm`.
- **Save:** `PUT /save` com `save.realm` diferente do servidor da sessão → 409 `realm_mismatch { session, save }`. Nada é gravado.
- **Isolamento:** tudo do mundo é do personagem (`player_id`): save, correio, compras, VIP, arena, guilda, leilão. Itens, ouro e 💎 (inclusive comprados) nunca passam entre servidores.
- **Fase 2 (antes de abrir o S2):** as listas do mundo (rankings, guildas, chat Mundial/Era, Chefe Mundial, torneio, correio para todos) passam a filtrar por realm.

## 12. LIGAR NAS TELAS — lista do Engenheiro, EM ORDEM (13/11; depois da v0.13.1)
Tudo do lado do jogo já existe em `js/sys/`, atrás de chave (`DATA.on=false`), com testes. Nada aparece para o jogador até: (a) o dono ligar a chave no SERVIDOR, (b) a chave do módulo ser ligada no jogo, (c) a tela ler o módulo. Os scripts entram DEPOIS de `js/sys/net.js` e do módulo que cada um liga.
1. **Guilda — `js/sys/guildnet.js` (`Sys.guildNet`). Servidor: `GUILD_ON=1`.** É a base: traz a guilda, os estandartes (FC) e os territórios (bônus) para o save.
   - No boot online (onlineboot, depois do `Sys.online.boot`): `Sys.guildNet.DATA.on=true; await Sys.guildNet.start(S, Sys.host)`. Repita `refresh(S, host)` ao abrir a tela de guilda.
   - `js/p_guild.js:105`: trocar `Sys.guild.provider.leave(...)` (síncrono, segue respondendo "em breve") por `await Sys.guildNet.leave(S, Sys.host)`.
   - Os outros botões da guilda: as funções com Promise do `Sys.guildNet` (lista na mensagem do Servidor ao Engenheiro de 13/11 e no topo do arquivo). A tela continua lendo o `Sys.guild`.
2. **Arena — `js/sys/arenanet.js` (`Sys.arenaNet`). Servidor: `ARENA_ON=1`. Contrato §4 e §4.1.**
   - Expor `window.heroSnapshot()` → `{look, level, petFrac}` (formato do §4.1; combinado com o Engenheiro).
   - No boot online: `Sys.arenaNet.DATA.on=true; await Sys.arenaNet.start(S, Sys.host)` (manda a foto e troca o provider do `Sys.arena`; sem servidor, ficam os bots locais).
   - Depois de trocar equipamento, skin, montaria ou pet: `Sys.arenaNet.snapshot(S, Sys.host)` (só reenvia se mudou).
   - `js/p_arena.js`: com `Sys.arenaNet.state().started`, a luta vira `await Sys.arenaNet.fight(S, Sys.host, oppId)` (mesmo resultado do `Sys.arena.fight` + `oppServer` com a aparência); trocar a lista: `Sys.arenaNet.refresh`; ranking: `Sys.arenaNet.loadRanking(kind)` (o `Sys.arena.ranking` lê o cache).
3. **Torneio do Poder — `js/sys/tourneynet.js` (`Sys.tourneyNet`). Servidor: `TOURNEY_ON=1` (com `GUILD_ON=1`). Contrato §10.3.** Precisa do item 1.
   - Ao abrir a tela: `await Sys.tourneyNet.refresh({territory:true})`.
   - `js/p_tourney.js`: trocar o estado vazio por `state()` (fase, semana, tamanho), `map()` (donos e ataques por território), `my()` (cargo, ataques que restam, escalações), `schedule()` (horários e travas), `ranking(kind)` e `battles()` (duelos para animar).
   - Botões: Atacar → `declare(território, 'd5'|'d6')`; Escalar → `setLineup(slot, ids)`. Os motivos de recusa estão no §10.3.
4. **Dicas de FC — `js/sys/advice.js` (`Sys.advice`). Sem servidor.** Quando a tela da dificuldade nova existir: `Sys.advice(S, Sys.host, {need})`. O `need` vem da fase/chefe (hoje o REC_FC da era). Ícone = id curto (`equip`, `forge`, `fuse`, `pet`, `mount`, `title`, `level`); a tela troca por imagem. `tab` → `host.goTab`.
- **Chaves no servidor** (com o dono, em `/etc/eonbound/server.env`): `GUILD_ON`, `ARENA_ON`, `TOURNEY_ON`, `AUCTION_ON`, `ADMIN_ON` (painel e aviso para todos). Tudo desligado hoje.
- **Deploy:** `bash deploy/release.sh` no fps-server, assim que o SSH voltar (testes, deploy, migrações, versão no ar, smoke real, CORS).

## 13. RANKING DAS FASES SEM FIM (pós-eras) — IMPLEMENTADO atrás de `POSERAS_ON` (fps-server; regras: docs/PROPOSTA_POS_ERAS.md)
Combinado com a Sistemas (13/11). Desligado até o dono aprovar o pós-eras (`balance.json posEras.on`). Sem `POSERAS_ON=1`: 404.
- **Quem entra:** personagem com fase > 90, no seu servidor (realm). Vale a fase MAIS ALTA alcançada até o fim da semana; empate = quem chegou primeiro.
- **De onde vem a fase:** do resumo de cada save LIMPO (`PUT /save` sem flag). O horário é o DO SERVIDOR do primeiro save com aquela fase. Save marcado (§3.4) não anota; conta excluída, banida ou com `save_review`/`cheater` sai da lista. O jogo não manda nada novo.
- **Semana:** segunda 00:00 (Brasília) a segunda 00:00, igual à arena.
- `GET /v1/poseras/ranking?week=AAAA-MM-DD` (padrão: a atual, parcial) → `{week, realm, closesAt, closed, minStage:91, prizes:[{upTo:1,gems:50},{upTo:10,gems:30},{upTo:100,gems:15}], me:{pos, stage, reachedAt, gems}|null, list:[{pos, id, name, stage, reachedAt, seal}]}` (top 100; `me.gems` só na semana fechada; `name` = nome do personagem no save).
- `GET /v1/poseras/me` → `{stage, minStage, seal:{week}|null}` (`stage` = maior fase anotada; 0 se nunca passou da 90).
- **Prêmio** (fechamento a cada 30 min, idempotente): 1º 50 💎, 2º-10º 30, 11º-100º 15, pelo correio (`att:{gems}`, `source:'poseras'`).
- **Selo do 1º:** só visual e só no servidor: `seal:true` na linha do campeão e `seal:{week}` no `/me` dele, durante a semana seguinte. Nenhuma chave nova no save nem no `Sys.loot.grantBundle`.

## 14. FONTES DE PRÊMIO × SERVIDOR (varredura de 13/11; fontes do js/sys/newdrops.js, offer.js e buy.js)
Regra do dono: completar o que já existe. "Jogo" = o próprio jogo decide e entrega (sem servidor). Ordem: nível em que a fonte abre.
**Contrato proposto para os prêmios do servidor** (em combinação com a Sistemas): o anexo do correio leva `newDrops: {src, ctx}` (ex.: `{src:'tourney:weekend', ctx:{rank:7}}`). No resgate, o jogo chama `Sys.newDrops.grant(S, host, src, ctx)`, e a tabela de prêmios continua só no newdrops.js. O servidor só decide QUEM ganha e em que posição.

| Fonte (nível) | Quem decide | Rota no servidor | Existe? | Testada? | Entrega pelo correio? |
|---|---|---|---|---|---|
| Missões, atividade, instância, chefe de era, trilha de evento (`missions:daily`, `activity:full`, `inst:win`, `boss:era`, `evtrail:top`) | jogo | — | não precisa | — | não (na hora) |
| Torre (`tower:floor`: falcão 30, raptor 50, grifo 150, asa 120/140/160) | jogo | — | não precisa | — | não |
| Invasão da Era, baú de topo (`invasion:top`, nv 18) | jogo (Sistemas 13/11: 1 vez por semana para quem passar da meta de abates da própria invasão; a Sistemas liga) | — | não precisa | — | não |
| Chefe Mundial (nv 24): faixa de dano e ≥5% da vida | jogo ("cada um contra o seu") | — | não precisa | — | não |
| Chefe Mundial: topo do mês (`monthTop`, asa Fênix) | servidor (dano medido no servidor; desenho em §14.1) | `GET /worldboss?month=`, `POST /worldboss/hit` (WORLDBOSS_ON) | **sim** (fps-server, números PROVISÓRIOS) | sim (worldboss.test, memória e pg) | sim: `att.newDrops {src:'worldboss', ctx:{monthTop:true, rank}}` |
| Torneio de Fim de Semana (nv 28): ranking próprio, top 100 (`tourney:weekend`) e prêmio por posição | servidor | `GET /weekend?week=` → {week, startsAt, endsAt, open, closed, arenaPct, me:{rank,points}, list:[{rank,id,name,points}]}; fechamento automático (WEEKEND_ON) | **sim** (fps-server, 13/11) | sim (weekend.test, memória e pg) | sim: `att.newDrops` (o jogo precisa resgatar essa chave); pedras/prismático por posição quando houver tabela |
| Arena: ranking semanal e prêmio por faixa | servidor | `GET /ranking`, fechamento semanal | sim | sim (arena.test) | sim |
| Arena: liga de fim de temporada (`arena:season`) | jogo, com o delta das lutas do servidor | `POST /arena/fight` | sim | sim | não (o jogo entrega a liga) |
| Temporada do Torneio de Fim de Semana, top 10 (`tourney:season`) | servidor (Sistemas 13/11: os fins de semana do MÊS somam os pontos; o mês é o do sábado) | `GET /weekend/season?month=` → {month, weekends, closesAt, closed, top, me, list}; paga sozinho depois do último fim de semana do mês (WEEKEND_ON) | **sim** (fps-server 000fc3a) | sim (weekend.test, memória e pg) | sim: `att.newDrops {src:'tourney:season', ctx:{rank}}` (o mail.js do jogo precisa da fonte na lista: com a Sistemas) |
| Guilda: baú semanal (item + materiais) | servidor | Torneio do Poder, `payWeek` | sim | sim (tourney.test) | sim |
| Guilda: baú semanal, fragmentos novos (`guild:weekly`: corvo, unicórnio) | servidor | Torneio do Poder, `payWeek` (NEWDROPS_ON) | **sim** (fps-server 1ad866e) | sim (tourney.test) | sim: `att.newDrops {src:'guild:weekly'}` no baú |
| Guerra de guildas: Capital (`guild:capital`, 40 por temporada) | servidor (a temporada do Torneio do Poder é semanal: dono da Capital na hora dos prêmios de domingo) | Torneio do Poder, `payWeek` (NEWDROPS_ON) | **sim** (fps-server 1ad866e) | sim (tourney.test) | sim: `att.newDrops {src:'guild:capital'}` a cada membro |
| Eventos: calendário | servidor | `GET /events` | sim | sim (services.test) | — |
| Eventos: pontos e loja de pontos | jogo | — | não precisa | — | — |
| VIP 7 skin, VIP 8 Fênix, VIP 9 serpe (`vip:level`) | jogo, com os pontos VIP das compras | entregas `vip_points` | sim | sim | entregas (§7) |
| Loja: Mecha, skins (`shop:product`), pacotes, cartão, passe | servidor | `POST /purchases/google` + entregas | sim | sim (services/delivery.test) | entregas (§7) |
| Oferta de boas-vindas (offer.js) | servidor | `first_offer` (`deliveredBy:'offer'`) | sim | sim | entregas (§7) |

**Situação (13/11):** todas as fontes que dependem do servidor estão feitas, atrás de chave.
- O resgate no jogo é o `Sys.mail.claim` → `Sys.newDrops.grant` (b2ce145). Com o Sys.newDrops desligado, a carta espera.
- Prêmio do Fim de Semana: só o newDrops (top 100). Não há tabela de pedras, forja ou prismático (Sistemas).

### 14.1 Chefe Mundial: topo do mês (desenho do Servidor, 13/11; **para a Sistemas revisar**)
O Chefe Mundial do jogo continua no aparelho: faixa de dano e ≥5% da vida (`worldboss` com `frac`), "cada um contra o seu". Só o que precisa ser JUSTO entre jogadores é medido no servidor: o ranking do mês e o prêmio do topo (`ctx.monthTop`).
- **Golpe (`POST /v1/worldboss/hit`):** o servidor luta com o MESMO motor da Arena.
  - Lado do herói: o retrato da arena do jogador (`POST /arena/snapshot`, conferido contra o teto por dia de conta).
  - Lado do chefe: o chefe escala pelo JOGADOR, para ser justo entre eras (Sistemas 13/11). A luta é `Sys.tower.duel` do jogo (cópia fixada em `game-sys/`).
  - Semente = hash no servidor de (servidor, mês, jogador, dia, nº do golpe). O aparelho não manda dano nenhum; recebe `{damage, seed, rounds, log, myDamage, hitsLeft, month}` para animar.
- **Chefe:** proporções FIXAS, as do retrato honesto da arena (atk 100, vida 600, def 10, crít 12%/100%), escaladas com `Sys.tower.scaledFoe` para:
  - a FC do próprio jogador × `power` (como o chefe da guilda; padrão), ou
  - a FC do chefe da ERA do jogador, se houver a tabela `WORLDBOSS_FC_BY_ERA` (9 números, era 0-8).
  - A vida é um poço que não acaba (10⁶ × ATK do herói): o golpe dura até o fim da luta (40 rodadas ou o herói cair). Dano = o que saiu do poço.
- **Golpes:** N por dia de Brasília (429 `daily_limit` com o tempo até a virada). Não depende da janela das 12h/20h do jogo.
- **Ranking (`GET /v1/worldboss`):** por servidor e por mês (Brasília), pelo **DANO RELATIVO** = soma de (dano ÷ ATQ do retrato), a mesma faixa do chefe da guilda. Assim a era 3 disputa com a 8. Empate = quem chegou primeiro. Conta marcada, banida ou excluída fica fora.
  - Resposta: `{month, closesAt, closed, boss:{scale:'player'|'era', power, byEra, score, provisional:true}, hitsPerDay, hitsLeft, top, me:{score, damage, rank}, list:[{rank, id, name, score, damage}]}`.
  - O golpe devolve também `score` (relativo do golpe) e `myScore`.
- **Fechamento:** no 1º dia do mês seguinte, o top N de cada servidor recebe pelo correio `att.newDrops = {src:'worldboss', ctx:{monthTop:true, rank}}`. É a fonte `worldboss` que o newdrops.js já tem, com `monthTop`. Uma vez só (`server_paid`).
- **Respondido pela Sistemas (13/11):** por mês, por servidor, com dano relativo e chefe que escala pela era do jogador. A Sistemas revisou e concordou com o duelo no servidor.
- **NÚMEROS PROVISÓRIOS** (por ambiente):
  - `WORLDBOSS_POWER` = 0,8 (o do chefe da guilda);
  - `WORLDBOSS_FC_BY_ERA` = (vazio: usa a FC do jogador);
  - `WORLDBOSS_HITS_PER_DAY` = 4;
  - `WORLDBOSS_TOP` = 10.

## 15. FOGUEIRA E LADRÃO DE BRASAS (lado do servidor; força-tarefa P1 e docs/LOM_VS_EONBOUND.md rec. 3 e 5)
**Fogueira no save (§3.4, só marca; fps-server 24e5906).** O servidor lê `S.sys.bonfire = {lv, xp, bra, pot, got, off?}` no próprio save:
- `bonfire_bra_over`: estoque `bra` acima de 300, ou pote `pot` ≥ 20;
- `bonfire_lv_over`: nível fora de 1-60;
- `bonfire_lv_jump`: o nível subiu mais de 2 + 40 por dia real entre dois saves;
- `bonfire_got_jump`: `got` (total de Brasas que ENTRARAM, só sobe; Sistemas 0c7e42a) subiu mais de 300 + 4.800 por dia real. A conta é: luta automática o dia todo ≈ 2.160 do pote, a bênção da Encruzilhada (+1 por pote cheio) pode dobrar isso, e fase, chefe, baú e missões dão ~150 (fps-server fac7f2b);
- **Brasas do tempo fora:** `off = {day, n}` (dia de Brasília e Brasas que o tempo fora deu nesse dia). `bonfire_off_over` se `n` > 40. Quem grava `off` é o jogo (Sistemas), quando ligar o offline da Fogueira.
- Números PROVISÓRIOS (Sistemas). Quando "só abate novo dá Brasa" ligar, o teto de `got` cai.

**Ladrão de Brasas (instância diária; atrás de `THIEF_ON`, migração 019).** As ENTRADAS do dia são contadas no servidor. Brasas só jogando: sem chave paga, sem anúncio.
- `GET /v1/thief` → `{day, perDay, entriesLeft, batch, fireLevel, lastReward, bestLevel, sweepBrasas, canSweep, run:{runId, endsAt}|null, resetsInMs, provisional:true}`.
- `POST /v1/thief/enter` → `{runId, seed, startsAt, endsAt, maxBrasas, entriesLeft}`. Gasta 1 entrada; sem entrada: 429 `daily_limit` (com o tempo até a virada de Brasília).
- `POST /v1/thief/finish {runId, score}` → `{brasas, score, maxBrasas, total}`.
  - `score` = fração do saco que o jogador soltou nos 45 s (0..1). Brasas = arredonda(`score` × lote); no máximo 1 lote por entrada.
  - Uma vez por corrida: o reenvio dá 409 `already_finished` com `details:{brasas, total}` = o que ESTA corrida pagou (a resposta se perdeu: o jogo credita uma vez com esse valor); antes de 5 s, 409 `too_fast`; depois de 3 min, 409 `expired` (a entrada foi gasta).
- `POST /v1/thief/sweep` → `{brasas, bestLevel, entriesLeft, total}`: "Varrer" (regra do jogo, 13/11). Gasta 1 entrada e paga o LOTE CHEIO do melhor nível de Fogueira já VENCIDO (corrida com score 1; o servidor guarda o nível da Fogueira de cada entrada). Sem corrida vencida antes: 409 `nothing_to_sweep`. A entrada é gasta no `enter`; sair no meio não devolve. Lote: Nv 1-3 = 1, 4-6 = 2, 7-9 = 4, 10-19 = 5, 20-34 = 6, 35-49 = 8, 50-60 = 10.
- **Lote** = pelo NÍVEL da Fogueira no último save do jogador (`S.sys.bonfire.lv`):

  | Nível da Fogueira | 1-3 | 4-6 | 7-9 | 10-19 | 20-34 | 35-49 | 50-60 |
  |---|---|---|---|---|---|---|---|
  | Lote (Brasas) | 1 | 2 | 4 | 5 | 6 | 8 | 10 |

  Provisório; a Sistemas calibra. Entradas por dia: `THIEF_PER_DAY` (padrão 2).
- **No jogo:** o prêmio do `finish` e do `sweep` entra pelo `Sys.bonfire.addBrasas` (conta no `got`, então cabe no teto do save).

## 16. DUPLA DAS ERAS e FOGUEIRA DA GUILDA (fps-server 81f2662 e b29f7a8; no ar em 9d37586, DESLIGADAS: `DUO_ON` e `GUILDFIRE_ON`)
Pedido da Sistemas (docs/SISTEMA_MATRIZ.md, 1e54f3f). Nada é vendido em nenhum dos dois. Ligar só depois do voto do dono nas telas. Desligado: toda rota 404.

### 16.1 Dupla das Eras (`Sys.duo`)
- **Código de amigo** `GET /v1/me/friend-code` → `{code}`. São 8 caracteres de `BCDFGHJKLMNPQRSTVWXZ23456789` (sem vogais, então não forma palavra), aleatórios, numa tabela própria. NÃO expõe o id interno nem dado pessoal. **Todo `id` das rotas da dupla é o CÓDIGO** (partner.id, invites[].id, `:id`).
- `GET /v1/duo` → no formato do `applyServer`:
  - `{on, code, day, week, needLevel, partner:{id, name, since, last, lv, era, frame}|null, leftAt, relinkLeftMs, partnerDay, partnerWeek, partnerPresent, partnerDays[], myDay, myWeek, myDays[], invites:[{id, name, at, lv, era, frame}], invitesOut, invitesLeft, messages:[{idx, at}], msgLeft, claimed:{daily, weekly[]}, cap}`;
  - contadores `{kills, bossKills, stages, arenaWins}`. As mensagens são entregues uma vez.
  - `lv` (nível) e `era` (0-8) do parceiro e de quem convidou, para o cartão (resumo do último save; `null` sem save). "Online" no jogo = `last` há menos de 5 min.
  - **Bloqueio não avisa (PO):** quem foi bloqueado não vê nada. O convite dele dá o MESMO 404 `code` de um código inexistente. Se eram dupla, ela acaba como numa saída, sem dizer que foi bloqueio e sem espera para ninguém.
- **Convite** `POST /v1/duo/invite {code}` → `{ok, code, expiresAt, left}`. Vale 48 h; 5 por dia (429 `limit`); 5 enviados e 10 recebidos abertos. Erros 409 `paired`, `relink`, `self`, `target_paired`, `target_level`, `dup`, `limit_out`, `target_full`; 403 `level` (nível 16). Código inexistente, de outro servidor, banido ou bloqueado: 404 `code`.
- `POST /v1/duo/accept/:id`, `/decline/:id` (convite inexistente ou vencido: 404 `invite`), `/leave` (`{ok, relinkMs, relinkAt}`; só quem sai espera 24 h), `/block/:id` (bloqueia nos DOIS sentidos, apaga convites e mensagens entre os dois e desfaz a dupla).
- **Frase** `POST /v1/duo/phrase {idx}`: SÓ o número 0-17, nunca texto. Qualquer outra chave = 400. 1 a cada 5 s (429 `wait`), 30 por dia (429 `day`), a mesma frase no máximo 2 vezes seguidas (409 `repeat`).
- **Progresso** `POST /v1/duo/progress {kills?, bossKills?, stages?, arenaWins?, day?}` → `{ok, day, mine, capped}`. Os valores são o TOTAL do dia (reenviar não soma). O servidor guarda o maior, cortado no teto do dia (PROVISÓRIO: 20.000 abates, 150 chefes, 60 fases, 40 vitórias de arena; `DUO_CAP_*`). Hoje ou ontem.
- **Resgate** `POST /v1/duo/claim/:id` (`daily`, `boss200`, `stages40`, `arena20`, `days5`) → `{ok, id, period, value, target, reward}`.
  - O servidor confere a SOMA dos dois e a presença: o daily exige o parceiro presente hoje; as missões semanais, ao menos 1 dia na semana.
  - Uma vez por período por jogador: daily por dia, missão por semana. Erros 409 `none`, `presence`, `done`, `claimed`.
  - **Quem paga:** o servidor só AUTORIZA (e registra o resgate, uma vez); o JOGO paga uma vez, como o `Sys.duo` faz. Um 409 `claimed` marca como resgatado no jogo sem pagar de novo. Se o PO quiser que o servidor credite (pelo correio ou por entrega), a mudança é no servidor.
- **Espera depois de sair:** `leftAt` só vem para QUEM SAIU e ainda está nas 24 h. Quem ficou e quem já passou das 24 h recebem 0 (fps-server 5023345). O `duo.js` trata 0 como "sem espera" (f2e0435), e a espera de quem saiu vem do `relinkLeftMs` (não do relógio do aparelho).
- **O que o jogo lê do `GET /duo`** (`Sys.duoNet`, 8ae4ce5): `partner`, `invites`, `messages`, `leftAt`, `relinkLeftMs`, `claimed`, `myDay`, `myWeek`, `myDays`, `partnerDay`, `partnerWeek`, `partnerDays`, `code`, `invitesLeft`, `msgLeft` e `cap`. Nos contadores, vale o MAIOR entre o jogo e o servidor (o servidor guarda o maior que recebeu, cortado no teto).

### 16.2 Fogueira da Guilda (`Sys.guildFire`)
- `GET /v1/guild/fire` → `{guildId, flames, level, name, into, need, extra, max, next, perks:{goldPct, xpPct}, free, bra, braLeft, freeFlames, mine, fed, brasaCap, joinedAt, reached:{"2":ms,…,"x1":ms}, chests:[{id, level, extra, reachedAt, chest:{goldk, forge, food}}], resetIn}`. Já traz o `{guildId, flames, free, bra}` do `applyServer`.
- **Alimentar** `POST /v1/guild/fire/feed {kind:'free'|'brasa', n}`. O limite é POR JOGADOR, não por guilda: 1 grátis por dia e Brasas até 20 por dia (429 `daily_limit`). Devolve as chamas somadas.
  - **Anti-trapaça:** as Brasas dadas na vida não podem passar do `got` da Fogueira do último save do jogador. Save sem `got`: 409 `brasas_unverified`; acima: 409 `brasas_over` `{left}`. As Brasas saem do estoque (o `got` não muda).
- **Baú AUTOMÁTICO (PO 14/11; fps-server 679191b):** quando a guilda sobe de nível (e a cada baú extra do nível 10), o SERVIDOR manda o baú ao correio de cada membro que já estava na guilda ANTES de o nível ser alcançado (o servidor guarda a hora de cada nível e a entrada do membro).
  - Carta `source:'guildfire'`, ref `gf:<guilda>:<nível|xN>:<membro>`, `att {goldk: chest.goldK × L, forge: L, food: 10 × L}`. Uma vez por membro e marca.
  - O `feed` devolve `chestsMailed` (quantos baús essa alimentação mandou). O jogo NÃO credita localmente: só mostra "enviado ao seu correio".
  - `POST /v1/guild/fire/claim/:id` fica de RESERVA, para um baú que tenha ficado para trás: já foi = 409 `already_claimed`; entrou depois = 403 `joined_after`; não alcançado = 409 `not_ready`.
- **Números** (chamas, níveis, extras, baú, perks) saem do próprio `guildfire.js` do jogo, na cópia fixada `game-sys/` (fps-server fdfe4c7). Uma fonte só: o `release.sh` para se a cópia divergir do jogo. O mesmo vale para os números da Dupla (`duo.js`).
