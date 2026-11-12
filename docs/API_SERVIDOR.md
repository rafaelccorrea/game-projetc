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
- `POST /auth/logout` — `{ "refreshToken" }` → 204.

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
- `POST /purchases/apple` — `{ "transactionId" }` → igual (App Store Server API).
- `GET /entitlements` → `{ "vip": { "points", "level" }, "passPremium": { "season", "active" }, "skins": [...], "purchasedGems": 0 }`.
- Reembolso e estorno: notificações da loja (Google RTDN, Apple Server Notifications v2) em `/webhooks/*`. O servidor tira o que foi dado ou marca saldo devedor.
- Regras duras: 💎 nunca compra VIP nem Passe Premium; nenhum sorteio pago. O servidor recusa produto que não estiver no catálogo (`products`).

## 8. Correio do servidor
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
