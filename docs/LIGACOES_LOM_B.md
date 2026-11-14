# Ligações LoM (bloco B): Minijogo de evento, Arena PvP + Brasa, Guilda "Ajudar todos" + chefe na batalha, Masmorra de 3, Ranking de evento

Sistemas, 13/11/2026. Passo a passo para o Engenheiro. Origem: `docs/LOM_VS_EONBOUND.md` §5, itens 12, 14, 15, 16 e 17.

> **Atualizado em 13/11/2026:** a ligação pronta para colar (linha do index.html, SYS_LIVE, Menu e nível, ganchos com arquivo:linha, esqueleto da tela com cada reason e a palavra da tela, online, ordem e fumaça) está em **`docs/LIGACOES_LOM_TELAS.md`**, conferida contra o código de hoje. Onde este guia e aquele discordam, vale o novo. O contrato do servidor (rotas, corpos e erros) está em `docs/SERVIDOR_LOM.md`.

Os 5 módulos novos nascem com a **chave desligada** (`DATA.on=false`). Carregados e desligados, nada muda no jogo. A tela final vem do mock da Arte. A especificação abaixo segue o estilo das telas de hoje: cartões `sys-card`, botão dourado, selo vermelho com número, faixa escura no topo da batalha.

Regras que valem nos cinco:
- Nada aleatório pago e nada à venda que dê poder. Nenhuma tentativa ou entrada paga, por anúncio ou por VIP.
- Conversa só por **frase pronta**, pelo índice (`Sys.duo.DATA.phrases`). Nenhuma função aceita texto do jogador.
- **Ouro escasso**: o minijogo, a ajuda da guilda e o ranking **não dão ouro**. A masmorra dá no máximo 120 `goldk` por corrida inteira, que é **um** resgate (X = 5 min de abate, `docs/ECONOMIA_OURO.md`).
- **Brasas**: só a Arena dá, 1 por vitória e até 5 por dia. O teto mora no `Sys.bonfire`.

## 0. Carregar

No `index.html`, linha 814 (o `forEach` dos módulos `js/sys`), ponha os nomes **antes do `'fc'`**, logo depois de `'loadouts'` (o `coopnet` é novo: o provider online das Ruínas em Trio):

```
'arenaset','guildboss','coop','coopnet','eventrank','minigame'
```

Nenhum deles tem `bonus()` (nenhum dá poder), então a ordem entre eles não importa. Os nomes no `Sys` são `Sys.arenaSet`, `Sys.guildBoss`, `Sys.coop`, `Sys.eventRank` e `Sys.minigame`.

Para ligar (quando o dono aprovar a tela): `Sys.<módulo>.setOn(true)`. O `Sys.coop` e o `Sys.minigame` também aceitam `DATA.on=true`.

Já ligado por mim, sem nada a fazer: `Sys.arena` (o prêmio da luta chama `Sys.arenaSet.onWin`, e o bot local leva as mesmas magias), `Sys.arenaNet` (o retrato manda `pvp`) e `Sys.bonfire` (fonte `'arena'`). Com o `arenaSet` desligado, os três ficam como hoje (os testes provam).

---

## 1. Minijogo de evento (`js/sys/minigame.js`, `Sys.minigame`)

**Regra:** é um minijogo de **timing**. Um marcador corre de um lado ao outro da barra, e o jogador toca quando ele passa na faixa. São 10 toques por partida, e a faixa muda de lugar a cada toque.
- Pontos por toque: **PERFEITO 100 · BOM 60 · RASPOU 25 · ERROU 0**.
- Faixas da partida: **Bronze 300 · Prata 550 · Ouro 800** (de 1000).
- O tema troca a cada **14 dias**, a partir de **20/11/2026** (início do Festival das Eras, no `Sys.events`):

| Tema | Velocidade | Faixa |
|---|---|---|
| Forja no Ponto | 1,0 | 18% |
| Pesca do Rio | 1,2 | 16% |
| Escavação Relâmpago | 1,4 | 15% |

Antes de 20/11 a tela mostra "Começa em…".

- **3 tentativas grátis por dia** (dia de Brasília). Começar gasta 1 tentativa, e desistir não devolve. Não existe tentativa extra.
- Prêmio do dia, pela **melhor** faixa, resgatado 1 vez por dia:

| Faixa | Prêmio |
|---|---|
| Bronze | 3 pedras de forja |
| Prata | 5 pedras de forja + 20 de ração |
| Ouro | 8 pedras de forja + 30 de ração + 1 Essência |

- Marcos do ciclo, pelos dias jogados com Bronze ou melhor:

| Dias | Prêmio |
|---|---|
| 3 | 2 Essências |
| 7 | 20 pedras de forja |
| 10 | 5 pedras de treino |

**Onde chamar:**
1. Botão "Minijogo" na tela de Eventos (`p_events`), só com `Sys.minigame.view(S,host).on`. Selo vermelho quando `canClaim`, ou quando `triesLeft>0` e `best===0`.
2. `Sys.minigame.view(S,host)` → `{on, open, reason:'off'|'soon', startsAt, cycle:{id, game, start, end, daysLeft}, game:{id, name, txt, speed, zone}, triesLeft, triesMax, best, tier, claimed, canClaim, dayReward, tiers:[{id, name, min, reward}], days, milestones:[{days, reward, reached, claimed}], event:{id, name, endsAt}|null, inRun}`.
3. **Jogar** → `Sys.minigame.start(S,host)` → `{ok, runId, game, speed, zone, taps:10, centers:[10 posições 0-1], triesLeft}` ou `{ok:false, reason:'tries'|'soon'|'off'}`.
   - A tela anima o marcador indo e voltando. Uma passada leva `1,6 s ÷ speed` (sugestão).
   - Para o toque `i`, a faixa fica centrada em `centers[i]` com largura `zone`.
   - A cada toque, guarde a posição do marcador (0 = esquerda, 1 = direita). Mostre o rótulo na hora com `Sys.minigame.grade(pos, centers[i], zone)` → `{id, name, pts}`.
4. Fim (10 toques, ou o jogador saiu) → `Sys.minigame.finish(S,host,posicoes)`, onde `posicoes` são as 10 posições (`null` = não tocou). Volta `{ok, score, taps:[{grade, name, pts}], tier, best, bestTier, record, triesLeft}`.
5. **Resgatar** → `Sys.minigame.claimDay(S,host)` → `{ok, tier, reward, got}`. Marcos: `Sys.minigame.claimMilestone(S,host,dias)`.
   - Avisar na tela: "resgatar encerra o prêmio do dia" (jogar de novo depois não paga a diferença).

**Tela (estilo de hoje):**
- Cartão com o nome do tema e o texto.
- Barra horizontal larga (altura ~48 px) com a faixa dourada e o marcador branco.
- Fileira de 10 bolinhas que acendem com a cor do rótulo (PERFEITO dourado, BOM verde, RASPOU azul, ERROU cinza).
- Embaixo: "Tentativas 2/3", "Melhor de hoje 640 · Prata", o botão dourado "Jogar" e o botão "Resgatar" com o prêmio da faixa.
- Abaixo, a régua do ciclo com os 3 marcos.

---

## 2. Arena: conjunto PvP + Brasa da Arena (`js/sys/arenaset.js`, `Sys.arenaSet`)

**O que já existia e foi reaproveitado:**
- O preset `arena` do Grimório: `Sys.grimoire.setPreset(S,'arena',[ids])`, tela do Grimório, aba Arena.
- O conjunto `arena` do `Sys.loadouts`: `save(S,'arena',host)` / `apply` / `forBattle`.

**O que é novo:**
1. **Magias na luta da arena.** Cada magia do conjunto vira um modificador fixo do retrato:
   - dano: ATQ +mult÷recarga;
   - cura e escudo: Vida;
   - atordoar e esquiva: tiram ATQ do adversário;
   - velocidade.
   Tetos: +50% de ATQ, +50% de Vida, +30 de velocidade, −20% no ATQ do adversário. A luta continua no `Sys.arena.duelPvp` com a mesma semente.
2. **O retrato da arena leva o conjunto.** O `Sys.arenaNet.snapshot` já manda `pvp:{spells, gear, pet, mount}` para o servidor.
3. **Brasa da Arena**: 1 Brasa por vitória, até **5 por dia**. O prêmio da luta já vem com `rewards.brasas` (só quando entrou).

**Onde chamar:**
1. **Na luta**: nada novo. Se `r.rewards.brasas > 0`, mostre a caixa "+1 Brasa" junto das outras do `paPvPrize` (`js/p_arena.js:613`; hoje ele só mostra `gold`, `gems` e `chest`: a linha da Brasa está em `LIGACOES_LOM_TELAS.md` 4(d)), com o ícone da Fogueira.
2. **Antes da luta (opcional, recomendado)**: `Sys.loadouts.forBattle(S,host,{pvp:true})` troca para o conjunto Arena, se o jogador ligou o "trocar sozinho".
3. **Aba "Conjunto PvP" na Arena**: `Sys.arenaSet.view(S,host)` → `{on, spells:[{id, name, lv, text}], ownSpells, fromFases, gear, gearSet, pet, mount, mods:{atk, hp, aspd, foe}, brasa:{on, left, cap, got}}`.
   - Mostre as 3 magias com o texto. Se `fromFases`, o selo "usando o conjunto de Fases".
   - Botão "Editar magias" abre o Grimório na aba Arena. Botão "Salvar equipamento atual" chama `Sys.loadouts.save(S,'arena',host)`.
   - Linha "Na arena: ATQ +X% · Vida +Y% · Adversário −Z%" com os `mods` (× 100).
   - Linha "Brasa da Arena hoje: got/cap" (só com `brasa.on`).
4. Depois de mudar magia ou equipamento da arena: `Sys.arenaNet.snapshot(S,host)`, como já se faz ao trocar equipamento.

---

## 3. Guilda: "Ajudar todos" + chefe da guilda na batalha (`js/sys/guildboss.js`, `Sys.guildBoss`)

**Regra (pedido de ajuda, novo):** cada membro abre **1 pedido por dia**, de um destes tipos:

| Tipo | Ajudas para encher | Quem pediu recebe |
|---|---|---|
| Golpe extra no chefe (`boss`) | 3 | +1 golpe no chefe da guilda hoje |
| Pedras de forja (`forge`) | 5 | 10 pedras de forja |
| Ração de pet (`food`) | 5 | 50 de ração |

- Quem ajuda ganha **+1 Brasão e +2 de contribuição** por ajuda, até **10 ajudas por dia**.
- **Ajudar todos** ajuda, num toque, todos os pedidos abertos dos outros que ainda não ajudei, até o limite.
- Não dá para ajudar o próprio pedido nem o mesmo pedido 2 vezes. Pedido do dia vence à meia-noite.

**Onde chamar (tudo Promise, só com o online da guilda iniciado):**
1. Ao abrir a guilda: `await Sys.guildBoss.loadHelp(S,host)`.
2. Aba "Ajuda" na tela da guilda (`p_guild2`): `Sys.guildBoss.view(S,host)` → `{on, inGuild, helpsLeft, helpsMax, mine:{kind, need, got, full, claimed}|null, requests:[{id, name, kind, need, got, full, helpedByMe}], helpAll (N), kinds:[{kind, need, name, txt}], extraHit, hitsMax, boss}`.
   - Sem pedido meu: 3 botões "Pedir: Golpe extra / Pedras / Ração" → `await Sys.guildBoss.request(S,host,kind)`. Antes, `Sys.guildBoss.canRequest(S,host,kind)` diz se pode: `reason:'not_member'|'already'|'bad_kind'`.
   - Meu pedido: barra `got/need` e, cheio, botão "Resgatar" → `await Sys.guildBoss.claim(S,host)`. As pedras e a ração entram pelo `Sys.loot`, e o golpe extra liga sozinho.
   - Lista dos pedidos: cada linha tem o nome, o ícone do tipo, a barra `got/need` e o botão "Ajudar" → `await Sys.guildBoss.help(S,host,id)`.
   - **Botão dourado "Ajudar todos (N)"** no topo, com `N = view.helpAll` (apagado com 0) → `await Sys.guildBoss.helpAll(S,host)`. Volta `{ok, helped:[ids], coin, contrib, helpsLeft}`; mostre o toast "+N Brasões".
   - Selo vermelho na aba quando `helpAll > 0` ou quando o meu pedido está cheio e não resgatado.
3. **Chefe da guilda na batalha**: ao entrar na batalha e no máximo 1 vez por minuto, chame `await Sys.guildBoss.loadBoss(S,host)`. Ele já respeita o minuto: sem `force`, devolve `cached`.
   - Para desenhar: `Sys.guildBoss.hud(S,host)` → `{show, name, level, frac, hpText, mine, mineText, hitsLeft, hitsMax, killed, stale}`.
   - Com `show`: faixa fina no topo da batalha, abaixo da barra da fase, com o ícone da guilda, o nome do chefe, a barra vermelha `frac`, o texto `hpText` e "Meu dano hoje: mineText · Golpes: hitsLeft/hitsMax".
   - Toque na faixa abre a tela do chefe da guilda. Com `killed`, "Derrotado! Prêmios no correio".
   - Sem guilda, sem chefe ou desligado, `show:false` e nada aparece.
4. Depois de bater no chefe (`Sys.guildNet.bossHit`), chame `Sys.guildBoss.applyBoss(S,host,resposta)` para a faixa atualizar na hora.

---

## 4. Masmorra cooperativa de 3, "Ruínas em Trio" (`js/sys/coop.js`, `Sys.coop`)

**Regra:** é assíncrona: o grupo se monta antes, e a corrida é uma conta do servidor com os retratos dos 3.
- Abre no Nv 30. O grupo de 3 se forma por **código de amigo** ou **membro da guilda**.
- Vaga vazia vira retrato de um jogador de FC parecida.
- **2 entradas por dia**, grátis. Humano sem entrada entra como retrato e não ganha.
- São 10 andares, com prêmio fixo por andar vencido. A corrida inteira dá 30 fragmentos de relíquia, 22 pedras de prática e 120 `goldk` (tabela em `docs/SERVIDOR_LOM.md` §3.2).
- Inimigo = `max(mediana, média) × 3 × mult` (Sistemas 13/11): um forte não carrega mais duas contas fracas. Grupo de 3 iguais chega, em média, ao andar 3,4.

**Sem servidor:** o provider local deixa jogar sozinho com 2 retratos de mentira e credita na hora. **Com servidor:** o prêmio chega **pelo correio** (carta `coop`), e a resposta só anima (`mailed:true`).

**Onde chamar:**
1. Entrada no menu de Instâncias (ao lado da Torre): cartão "Ruínas em Trio · 2/2 hoje", só com `Sys.coop.status(S,host).on`.
2. `Sys.coop.view(S,host)` → `{on, open, reason:'off'|'level', needLevel, entriesLeft, entriesMax, online, party, invites, lastRun, name, table:[{k, mult, reward}], total, phrases}`.
3. **Sem online** (`online:false`): botão "Entrar com retratos" → `Sys.coop.start(S,host)` (síncrono). Volta `{ok, runId, floors:[{k, win}], reached, reward, members, entriesLeft}` ou `reason:'limit'`.
4. **Com online**: o provider do servidor é o `Sys.coopNet` (`js/sys/coopnet.js`, chave desligada; servidor `COOP_ON=1`). Com ele:
   - Montar grupo: "Convidar por código" (campo que **só aceita** `A-Z0-9`, de 6 a 10, conferido por `Sys.coop.canInvite(S,host,{friendCode})`) ou "Convidar da guilda" (lista dos membros, com `canInvite(S,host,{guildMemberId})`).
   - Frases: grade com as frases prontas de `view.phrases`; o toque manda o índice. Antes, `Sys.coop.canSay(S,host,idx)` (5 s entre frases, 20 por dia).
   - O líder toca "Começar" → `Sys.coop.start` (Promise do provider), e o resultado passa por `Sys.coop.applyResult` (com `mailed:true` ele não credita).
5. **Animação da corrida**: 3 retratos (o humano com a aparência dele, o retrato com a moldura cinza "Retrato") sobem os andares 1, 2, 3...
   - Cada andar `win` mostra o baú do andar abrindo com o prêmio.
   - O andar perdido mostra o inimigo de pé e "Fim da corrida: andar N".
   - Embaixo, a soma do prêmio, e o aviso "chega pelo correio" quando `mailed`.

---

## 5. Ranking de evento com prêmio só visual (`js/sys/eventrank.js`, `Sys.eventRank`)

**Regra:** a métrica é a dos pontos ganhos na trilha do evento (`Sys.evtrail.earned`). Faixas pela posição final:

| Faixa | Prêmio (visual) |
|---|---|
| Top 1% | moldura + título + selo |
| Top 10% | moldura + título + selo |
| Top 50% | título + selo |
| Participação | selo "Participou de um evento" |

Nenhum atributo, nenhum ouro. A posição vem do servidor. O prêmio chega pelo correio (`source:'eventrank'`, `att.cosmetic`).

**Onde chamar:**
1. Aba "Ranking" na tela de Eventos: `Sys.eventRank.view(S,host,eventoId)` → `{on, event, name, points, rank, total, band, bandName, prize, final, bands:[{id, name, prize}], top:[{rank, name, points, frame}], online, powerFree}`.
   - Sem `online`: "Seus pontos: N · o ranking abre com o online".
   - Com `online`: a minha linha em destaque ("37º de 5.120 · Top 1%"), os 20 primeiros (com a moldura de cada um, se vier) e a tabela de prêmios das 4 faixas, com a miniatura da moldura e o nome do título.
   - Destaque: "Só visual: não dá poder".
2. Ao abrir a aba: `await Sys.eventRank.load(S,host,eventoId)` (faz o `GET /events/:id/rank` e o `applyRank`). A faixa é calculada aqui, não a mandada.
3. **Correio**: nada a chamar. `Sys.eventRank.fromMail(S,host)` (chamado pelo `view` e no boot) grava o prêmio das cartas `source:'eventrank'` já resgatadas com `Sys.eventRank.grantVisual(S,host,att.cosmetic)`. Isso registra e dá a moldura no `Sys.profile`, o título (sem bônus) no `Sys.titles` e guarda o selo. É idempotente.
4. **Boot**: depois de carregar o save, chame `Sys.eventRank.sync(S,host)`. Ele re-aplica o que foi ganho (molduras e títulos registrados em tempo de execução).
5. **Perfil**: mostre a fileira de selos com `Sys.eventRank.badges(S)` → `[{id, name}]`. As molduras aparecem sozinhas na lista do `Sys.profile.frames`, porque o registro põe `need:{grant:true}` e `event:true`.

---

## 6. Para o Servidor (resumo; detalhes em `docs/SERVIDOR_LOM.md`)

| Item | Rotas novas | Muda em rota existente | O que o servidor carrega no vm |
|---|---|---|---|
| Arena PvP | — | `POST /arena/snapshot` com `pvp`; a luta usa `Sys.arenaSet.duel` | `stats`, `grimoire`, `arena`, `arenaset` |
| Brasa da Arena | — | save: `S.sys.bonfire.ar = {day, n<=5}`; cabe no teto de 300 + 4.800/dia | — |
| Guilda | `GET /guild/help`, `POST /guild/help/request`, `POST /guild/help/:id`, `POST /guild/help-all`, `POST /guild/help/claim` | `GET /guild/boss` com `hp, hpMax, myDamageToday, hitsLeft, hitsMax, extraHit...`; `boss/hit` 429 `daily_limit` (API §10.4) | `guildboss` (motor do quadro) |
| Masmorra de 3 | `GET /coop/status`, `POST /coop/party`, `/coop/party/invite`, `/coop/party/:id/join`, `/coop/party/leave`, `/coop/party/phrase`, `/coop/start` | correio `source:'coop'` | `coop` (`run`) |
| Ranking de evento | `GET /events/:id/rank` | correio `source:'eventrank'` com `att.cosmetic` | `eventrank` (`bandOf`, `prizeFor`) |
| Minijogo | — (local) | conferir `S.sys.minigame.day.tries <= 3` | — |
