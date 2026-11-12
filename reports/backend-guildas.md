# Guildas no servidor — PLANO (fps-30) — nada implementado até o PO aprovar com o dono
Pedido do dono (via PO): guildas com troca de itens entre membros, Torneio do Poder por territórios, ranking de guildas, chefe, loja, doações, bênçãos e
missões. **As regras e os números são da spec da fps-e2** (ainda não escrita quando este plano foi feito). Aqui fica COMO o servidor guarda, decide e protege.
Os valores marcados **[e2]** vêm da spec dela. Prioridade atual continua arena, ranking, eventos e compras (núcleos prontos, em memória).

## 1. Princípios
1. **Tudo que vale prêmio é decidido no servidor.** Batalha de território, dano no chefe e missões são calculados com o MESMO `js/sys` do jogo (carregado
   num `vm`, como a arena já faz), a partir do **retrato de poder validado** (`POST /arena/snapshot`: FC conferida e teto por dia de conta).
   O cliente nunca informa resultado, só pede a ação.
2. **Sem dinheiro e sem sorteio pago.** Doação, loja e bênçãos usam ouro ganho, itens ganhos e a moeda da guilda (ganha jogando). Diamante comprado
   não entra (como no leilão). Nada sorteado com moeda paga.
3. **A troca de itens é a parte mais arriscada:** é por onde passam contas-mula, venda por fora (RMT) e "poder comprado". Ela segue as mesmas travas do
   leilão (§4) e fica atrás de chave própria.
4. **Conta marcada** (`save_review` / `cheater`) ou banida não luta, não troca e não pontua. **Menores:** o chat da guilda segue a regra do chat (frases
   prontas para todos até o parecer); a troca só para 18+ [decisão do dono].

## 2. Tabelas (Postgres; núcleo em memória primeiro, como os outros módulos)
| Tabela | Campos principais |
|---|---|
| `guilds` | id, name (filtro de nome do chat), tag (3-4 letras, única), emblem, level, xp, fund (moeda da guilda), created_at, disbanded_at |
| `guild_members` | guild_id, player_id (único: 1 guilda por jogador), role (`lider`/`oficial`/`membro`), joined_at, left_at, contrib_week, contrib_total |
| `guild_requests` | guild_id, player_id, kind (`pedido`/`convite`), status, created_at |
| `guild_log` | guild_id, actor, action (entrou, saiu, expulsou, promoveu, doou, comprou bênção, troca...), details, at. Só leitura, 6 meses |
| `guild_donations` | guild_id, player_id, kind (ouro / material / item), amount, at, day_key (limite diário [e2]) |
| `guild_shop_buys` | guild_id, player_id, item_id, price, at (limites por semana [e2]) |
| `guild_blessings` | guild_id, blessing_id, level, active_from, active_to, bought_by |
| `guild_missions` | guild_id, season, week, mission_id, progress, done_at, claimed_by (jsonb) |
| `guild_boss` | guild_id, season, boss_level, hp_max, hp_left, reset_at |
| `guild_boss_hits` | guild_id, player_id, day_key, seed, damage, log_ref (tentativas por dia [e2]) |
| `guild_trades` | id, guild_id, from_id, to_id, item (jsonb), state (`ofertada`/`aceita`/`recusada`/`expirada`/`revertida`), created_at, settled_at, flags |
| `territory_seasons` | id, start, end, map (jsonb: nós, vizinhos, bônus), state |
| `territories` | season_id, node_id, owner_guild_id, held_since, defense_lineup (jsonb, travada) |
| `territory_battles` | id, season_id, node_id, attacker_id, defender_id, scheduled_at, locked_at, lineups (jsonb), seed, result, log (jsonb), points |
| `guild_rank_weeks` | season_id, week, guild_id, points, rank, closed_at (fechamento idempotente, prêmios pelo correio) |
| `guild_snapshots` | o retrato de cada membro TRAVADO na hora da escalação (cópia do arena_snapshot validado) |

## 3. Torneio do Poder (territórios) — resolvido no servidor
- **Temporada** [e2: duração, ex.: 4 semanas]: um mapa de territórios (nós com vizinhos; cada nó dá pontos/hora e um bônus). Começa vazio ou com
  territórios neutros (NPC) por faixa de poder.
- **Ciclo de batalha** [e2: dias e horários; ex.: ataques declarados até sexta 20h, batalhas no sábado às 20h de Brasília]:
  1. **Declaração:** líder ou oficial declara ataque a um nó vizinho de um que a guilda tem (ou de borda). Há um limite de declarações por guilda [e2].
  2. **Escalação:** cada lado escolhe N membros [e2]. Só conta quem está na guilda há pelo menos 24 h antes da trava (impede "pegar emprestado" jogador forte de outra guilda).
  3. **Trava** (ex.: 1 h antes): o servidor copia o retrato validado de cada escalado (`guild_snapshots`). Trocar o equipamento depois disso não muda a batalha.
     Sem retrato válido = vaga vazia (W.O.).
  4. **Resolução, no horário, por uma rotina do servidor:**
     - duelos em pares pela ordem da escalação, ou todos contra todos em rodadas [e2], com o `duel` do jogo e uma seed aleatória gravada;
     - quem vence mais duelos (desempate: soma de HP restante) fica com o nó;
     - tudo vai para o log, para a tela animar depois. Não precisa de tempo real: o cliente só assiste o replay pelo `log` (como a arena).
  5. **Pontos:** cada nó dá pontos por hora possuída + vitória/defesa [e2]. O ranking de guildas soma pontos de território + dano no chefe + missões [e2].
- **Justiça:** o pareamento sugere alvos da mesma faixa de poder (soma da FC dos 10 melhores); atacar guilda muito mais fraca vale menos pontos
  (k como na arena) [e2]. Guilda nova tem proteção nos primeiros dias [e2].
- **Idempotência:** a batalha é resolvida uma vez (`result` gravado na transação); reprocessar não muda nada. Queda do servidor no horário → a rotina
  resolve ao voltar, com as escalações já travadas.

## 4. Troca de itens entre membros — anti-trapaça
Mesmas regras do leilão (aprovadas pelo PO), adaptadas para troca dentro da guilda. Atrás de chave própria (`guildTrade.enabled = false`).
- **Inventário oficial no servidor** (o mesmo do leilão). Só itens de origem `earned` (drop, baú, chefe, instância, torre, passe grátis). Item
  comprado ou presenteado não troca.
- **Item trocado chega no Nv 1**, e quem dá recebe 50% do ouro investido (regra do leilão; impede passar "nível comprado"). O portão de raridade
  vale para quem recebe: acima do portão, o item fica GUARDADO (`canHold`).
- **Quem pode:**
  - 18+, conta com 7+ dias e vínculo Google/Apple;
  - membro da guilda há 7+ dias [e2];
  - limite de trocas por dia e por semana [e2];
  - o mesmo item só pode ser trocado de novo 7 dias depois.
- **Formato:** oferta → aceite do outro lado. O item fica "reservado" até aceitar, recusar ou expirar em 24 h. Doação de um lado só é permitida [e2].
  A troca é atômica (as duas pontas ou nada).
- **Detecção de mula, que marca para revisão sem bloquear na hora:**
  - mesmo aparelho;
  - conta nova que só recebe;
  - o mesmo par repetido;
  - quem recebe muito valor e sai da guilda logo em seguida;
  - valor muito acima da mediana da raridade e era.

  A conta marcada fica fora de ranking e prêmios até a revisão no `/admin`, que pode REVERTER a troca (com log).
- **Saiu da guilda:** troca pendente é cancelada (o item volta). Item recebido nos últimos 7 dias pode ser revertido pela moderação se houver fraude.

## 5. Chefe, loja, doações, bênçãos, missões
- **Chefe da guilda:** HP compartilhado por temporada ou semana [e2]. Cada membro tem N tentativas por dia [e2].
  O dano é CALCULADO no servidor (simulação do jogo com o retrato validado e uma seed), nunca informado pelo cliente.
  Recompensa por faixa de dano e por derrota do chefe, pelo correio.
- **Doações:** ouro e materiais ganhos (nunca diamante comprado). Limite diário [e2]. Viram fundo da guilda e contribuição pessoal (que libera a loja).
- **Loja da guilda:** paga com a contribuição pessoal ou a moeda da guilda. Itens fixos com limite semanal [e2]. Nada sorteado.
- **Bênçãos:** o líder ou oficial compra com o fundo; dão bônus pequeno, com teto [e2], por tempo limitado. O servidor devolve a lista ativa
  (`GET /guild/blessings`) e o jogo aplica via `bonus()` do módulo. Proposta: teto baixo (ex.: +5% de ouro e XP) para não virar pagar para vencer.
- **Missões da guilda:** contam só eventos que o SERVIDOR vê (lutas da arena, tentativas no chefe, doações, territórios, logins). Não contam abates
  informados pelo cliente, que seriam fáceis de inflar.

## 6. Temporadas, ranking e prêmios
- Temporada de N semanas [e2]. Fechamento semanal e final idempotentes (como a arena), com prêmios para os membros pelo correio.
- **Quem recebe:** membro que participou (lutou, bateu no chefe ou doou) e estava na guilda no fechamento OU foi expulso nos últimos 3 dias.
  Isso impede o líder de expulsar membros de véspera para "economizar" prêmio.
- O ranking de guildas é o mesmo formato do ranking de jogadores (top 100 + a posição da sua guilda), sem bots.

## 7. Rotas e eventos (resumo para o contrato)
- Guilda:
  - `POST /guilds` (criar; custo em ouro ganho [e2]), `GET /guilds?search=`, `GET /guilds/{id}`;
  - `POST /guilds/{id}/join` (pedido), `POST /guilds/{id}/invite`, `POST /guild/leave`, `POST /guild/members/{id}/(kick|promote|demote)`.
- Doação e loja: `POST /guild/donate`, `GET /guild/shop`, `POST /guild/shop/buy`, `POST /guild/blessings/buy`, `GET /guild/blessings`.
- Chefe e missões: `POST /guild/boss/hit` → `{damage, seed, log}`, `GET /guild/missions`, `POST /guild/missions/{id}/claim`.
- Troca: `POST /guild/trades` (oferta), `POST /guild/trades/{id}/(accept|decline|cancel)`.
- Territórios:
  - `GET /territory/map`, `POST /territory/declare`, `POST /territory/lineup`;
  - `GET /territory/battles?season=` → `[{node, attacker, defender, scheduledAt, result?, log?}]`.
- Ranking: `GET /guild-ranking?season&week`.
- Chat: canal `guild:<id>` no gateway que já existe (mesmos filtros, frases prontas).

## 8. Ordem de implementação (quando aprovado)
1. Núcleo da guilda: criar, entrar, sair, papéis, log, filtro de nome. Chat `guild:<id>`.
2. Doações, loja, missões (do servidor), ranking semanal + correio.
3. Chefe da guilda (simulação no servidor).
4. Territórios: mapa, declaração, escalação, trava, rotina de resolução e replay.
5. Troca entre membros (por último, atrás de chave e parecer, com as mesmas peças do leilão).
Cada etapa sai em memória com testes, como os módulos atuais. O Postgres e o deploy seguem o roteiro de implantação.

## 9. Decisões (PO, 2026-11-12; PROVISÓRIAS até o dono votar as telas e a spec da fps-e2)
| # | Decisão |
|---|---|
| 1 | Troca entre membros só para **18+** até o parecer jurídico. Jogadores de 13 a 17 participam de todo o resto da guilda, sem troca. |
| 2 | Teto das bênçãos: **+5% no total** (somando todas as bênçãos ativas). |
| 3 | Batalhas do Torneio: **sábados às 20h de Brasília**, com as escalações travando 1 h antes. |
| 4 | Guilda de até **30 membros**; escalação de **15 contra 15** no rei da colina, com atributos reais (spec da fps-e2 aprovada como base pelo PO; substitui os 10). |
| 5 | Prêmio também para quem foi expulso nos últimos 3 dias: aprovado. |
**Nada é implementado antes do voto do dono nas telas e na spec.**
## 10. Diferenças entre a spec (ATUALIZADO: o PO aprovou a spec como base, com 15×15 e troca só 18+. Os itens de 'Brasões só jogando' e o restante da §8 da spec ficam para o voto do dono nas telas)
### Tabela original da fps-e2 (reports/spec-guildas.md) e este plano / as decisões do PO — para o voto do dono
| Ponto | Spec da fps-e2 | Plano / PO | Proposta |
|---|---|---|---|
| Escalação do Torneio | 15 contra 15, "rei da colina" (o vencedor segue com a vida que sobrou) | PO: 10 por batalha (protótipo: 5) | O dono escolhe o número; o servidor aceita qualquer N (config). O formato rei da colina é o da spec. |
| Atributos na batalha | atributos REAIS dos dois lados (sem scaledFoe) | — | Ok: o retrato validado já tem ATK, Vida, DEF, crítico e velocidade. Cada retrato é conferido contra a FC (±1%). |
| Temporada | semanal | N semanas | Semanal, como a spec. |
| Doação com 💎 | 50 💎 → 40 Brasões + 80 XP, 1 por dia | plano: nunca diamante comprado | **Decisão do dono.** O servidor não distingue no aparelho o 💎 ganho do comprado. Com a doação, o pagante sobe a guilda mais rápido (pouco, por causa do limite de 1 por dia). Alternativas: só 💎 ganhos (precisa da carteira no servidor) ou tirar essa doação. |
| Chat da guilda | menores de 16 só frases prontas | hoje: frases prontas para TODOS até o parecer | Hoje vale a regra mais restrita (todos). Depois do parecer, aplica-se o corte que o jurídico indicar. |
| Bônus de território e bênçãos | o Sys.guild entrega {goldPct, xpPct, dropPct} (bônus de território) e ATK/Vida/DEF no Sys.fc (bênçãos) | — | Ok. O Sys.loot passa a somar o goldPct, xpPct e dropPct da guilda junto com o do VIP, respeitando o teto da spec. |
