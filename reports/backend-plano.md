# Backend do Eonbound — plano (fps-30, líder do backend) — PARA O DONO DECIDIR
Pedido do dono (via PO): backend próprio em **NestJS + Postgres**, repositório `Desktop\fps-server`. O contrato da API com o jogo está em
`docs/API_SERVIDOR.md` (para a fps-c9 montar a camada trocável). Nada foi instalado nem colocado no ar.

## 1. Decisões do dono (via PO, 2026-11-12)
| # | Decisão |
|---|---|
| D1 | **Hospedagem: EC2 da AWS** (onde já ficam apps da empresa); Hostinger como alternativa. Nada sobe sem o acesso que o dono vai passar. Comparação de custo na §5. |
| D2 | **Nada pesado nesta máquina e nada de Postgres local.** O dono passa um Postgres REMOTO de desenvolvimento. Até lá: código e testes SEM banco (em memória). Credenciais só em variável de ambiente. 
pm install só com mais de 1,5 GB livre. |
| D3 | **Idade aprovada como proposto.** Chat de texto livre só depois do parecer jurídico. Até lá, só frases prontas para todos. |
| D4 | **O dono (ou alguém da empresa) modera:** painel de moderação (§4.1), além do filtro e do silêncio automático por denúncias repetidas. |
| D5 | Contas e chaves da loja são da empresa e nunca entram no repositório. |
| — | Ordem de entrega aprovada (§4). |

**Feito até agora (fase 1, sem banco):** Desktop\fps-server com o núcleo em TypeScript puro (src/core: auth, save, regras, JWT, MemoryStore) e a camada
fina do Nest por cima. **17 testes passam com o Node da máquina, sem instalar nada** (
pm run test:core). Falta o PgStore (com o Postgres remoto) e compilar a camada do Nest.
## 2. Arquitetura
Um app NestJS só (monólito modular), com REST em `/v1` e um gateway WebSocket em `/chat`. Postgres como banco único. Sem Redis no início: o limite de
mensagens e a presença do chat ficam em memória (1 instância); o Redis entra quando houver mais de uma instância.
```
app ──► AuthModule      convidado, JWT + refresh rotativo, vínculo Google/Apple, idade
    ├─► SaveModule      blob versionado, conflito, histórico (5), validação por tempo de conta
    ├─► ClockModule     /time, x-server-time em toda resposta, eventos
    ├─► ChatModule      gateway Socket.IO, canais world/era, filtro, denúncia, bloqueio, silêncio, log
    ├─► ArenaModule     retrato de poder, luta autoritativa, ranking semanal, fechamento (fase 4)
    ├─► PurchaseModule  recibos Google/Apple, webhooks, direitos (VIP, passe, skins) (fase 4)
    ├─► MailModule      correio do servidor (prêmios de ranking, compensações)
    └─► AdminModule     PAINEL DE MODERAÇÃO (§4.1): denúncias, histórico do jogador, silenciar, banir, desfazer, log, saves marcados
```
Biblioteca: TypeORM com migrações (o padrão dos outros sistemas da empresa), `class-validator` nos DTOs, `@nestjs/jwt`, `@nestjs/throttler`,
`@nestjs/websockets` + `socket.io`, `google-auth-library` (tokens Google), `jose` (tokens Apple).

## 3. Tabelas (Postgres)
| Tabela | Campos principais |
|---|---|
| `players` | id uuid, name, age_band, birth_ym, birth_fixed bool, created_at, last_seen_at, banned_until, flags jsonb, deleted_at |
| `auth_identities` | id, player_id, provider (`device`/`google`/`apple`/`email`), subject (único por provider), created_at |
| `refresh_tokens` | id, player_id, family_id, token_hash, expires_at, used_at, revoked_at, device_id |
| `saves` | player_id (PK), version int, save_format, blob jsonb (ou bytea gzip), summary jsonb, size, device_id, play_seconds, updated_at |
| `save_history` | id, player_id, version, blob, summary, device_id, created_at (guarda as 5 últimas) |
| `save_flags` | id, player_id, version, flags jsonb, status (`aberto`/`ok`/`trapaça`), reviewed_by, created_at |
| `limits_curve` | day int, max_level, max_era, max_stage, max_fc, max_gems_day (gerada da curva da fps-e2) |
| `chat_messages` | id, channel, player_id, text, phrase_id, filtered bool, removed bool, created_at (apaga após 7 dias) |
| `chat_reports` | id, message_id, reporter_id, reason, created_at (único por mensagem + denunciante) |
| `blocks` | player_id, blocked_id, created_at |
| `mutes` | id, player_id, until, reason, by (`auto`/moderador), created_at |
| `moderation_log` | id, actor, player_id, action, rule, message_id, details jsonb, created_at (guardado por 6 meses) |
| `arena_snapshots` / `arena_matches` / `ranking_weeks` | retrato de poder; lutas (seed, resultado, pontos); fechamento semanal (fase 4) |
| `products` / `purchases` / `entitlements` | catálogo; recibos (token, estado, reembolso); direitos atuais (fase 4) |
| `mail` | id, player_id (ou null = todos), title, body, att jsonb, expires_at, claimed_at |

## 4. Ordem de entrega
| Fase | O quê | Pronto quando |
|---|---|---|
| 1 | AUTH (convidado, refresh, idade) + SAVE (blob, conflito, histórico, validação) + `/time` | testes e2e com Postgres; a fps-c9 consegue trocar o "exportar código" pela nuvem |
| 2 | Vínculo Google/Apple, recuperar em aparelho novo, excluir conta | testado com contas de teste da loja |
| 3 | CHAT (gateway, filtro, denúncia, bloqueio, silêncio, limite, frases prontas, log) + **PAINEL DE MODERAÇÃO** (§4.1) | chat liga só com frases prontas; texto livre depois do parecer jurídico |
| 4 | Arena/ranking autoritativos, eventos no relógio do servidor, compras (recibos + webhooks), correio | combinado com a fps-e2 (provider da arena) |
| 5 | Leilão | só com o jogo validado (pré-requisitos em docs/RECOMENDACOES.md: diamante ganho x comprado, taxa, faixas de preço, idade, parecer) |

### 4.1 Painel de moderação (pedido do dono, D4)
Página web servida pelo próprio servidor em /admin (HTML simples + a mesma API), acesso SÓ da equipe:
- **Login:** usuário e senha da equipe, com segundo fator (TOTP, app autenticador). Contas criadas pelo dono por linha de comando no servidor; sem cadastro aberto.
- **Papéis:** dono (tudo, cria moderadores) e moderador.
- **Telas:**
  - **Fila de denúncias:** ordenada por quantidade e gravidade (dados pessoais e golpe primeiro). Cada item mostra a mensagem, 10 mensagens de contexto do canal, quem denunciou e as decisões anteriores sobre o jogador.
  - **Ficha do jogador:** nome, faixa de idade, data da conta, histórico de mensagens (até 7 dias), denúncias feitas e recebidas, silêncios e banimentos, saves marcados (§3.4).
  - **Ações:**
    - apagar mensagem;
    - silenciar por 10 min, 1 h, 24 h ou 7 dias;
    - banir por tempo ou para sempre, com motivo obrigatório;
    - desfazer qualquer ação (desfazer também vira registro);
    - marcar a denúncia como "sem ação";
    - liberar ou confirmar save marcado.
  - **Log de moderação:** tudo o que cada moderador fez, filtrável por moderador, jogador, ação e data. Só leitura; nunca apagado antes de 6 meses.
- **Automático, sem moderador:** filtro de palavrão e de dados pessoais; 5 mensagens filtradas em 10 min = silêncio de 10 min (reincidência dobra).
  Com 3 denúncias de jogadores diferentes, a mensagem some até a revisão; 3 mensagens removidas em 24 h = silêncio de 24 h e prioridade na fila.
- **Tabelas novas:** staff_users (login, hash da senha com argon2/scrypt, segredo TOTP, papel, ativo), staff_sessions, ans (com undone_by) e as de §3.

## 5. Onde hospedar — EC2 da AWS (decisão D1); Hostinger como alternativa
Preços de referência da AWS em 2026 (sob demanda, região São Paulo sa-east-1, ~40-60% mais cara que a da Virgínia us-east-1). **Conferir na calculadora
da AWS antes de contratar.** Câmbio usado: US$ 1 ≈ R$ 5,50.
| Opção | Peças | US$/mês (sa-east-1) | R$/mês | Prós | Contras |
|---|---|---|---|---|---|
| **A. Nest + Postgres na MESMA EC2** | 1 × t4g.small (2 vCPU ARM, 2 GB) + 30 GB gp3 + IP público + snapshots diários | ~22-28 | ~120-155 | o mais barato; uma máquina só | backup, atualização e failover por nossa conta; app e banco disputam a memória |
| A' | o mesmo em t4g.medium (4 GB), para o lançamento | ~40-48 | ~220-265 | folga para o chat | — |
| **B. EC2 para o Nest + RDS para o Postgres** | t4g.small + RDS db.t4g.micro Single-AZ (20 GB gp3, backup automático de 7 dias) | ~45-55 | ~250-300 | backup, atualização e restauração no tempo prontos; banco separado do app | ~2× a opção A; RDS micro com 1 GB de RAM |
| B' | o mesmo com RDS Multi-AZ (réplica em espera) | ~70-85 | ~385-470 | sobrevive à queda de uma zona | caro para o começo |
| C. Na EC2 que a empresa JÁ tem | processo Nest + banco novo na instância existente | ~0 a mais | ~0 | custo zero no começo | o jogo divide máquina com os sistemas da empresa: um pico do chat afeta os outros (não recomendo para o lançamento) |
| D. Hostinger VPS (alternativa) | VPS KVM 2 (2 vCPU, 8 GB) com Nest + Postgres | — | ~40-80 | o mais barato, com mais RAM | menos ferramentas (sem RDS ou snapshots no mesmo nível), suporte e rede mais simples |
Somar em qualquer opção:
- tráfego de saída: ~US$ 0,15/GB em São Paulo. O save, o chat e o ranking são pequenos: ~1-3 GB por mil jogadores ativos por mês;
- domínio + certificado: grátis com o Let's Encrypt ou o ACM atrás de um balanceador. O balanceador (ALB) custa ~US$ 20+/mês e só entra quando houver mais de uma instância;
- backup externo: pg_dump diário no S3, centavos por mês.

**Recomendação:**
1. **Testes fechados e começo do lançamento:** opção **A** (uma t4g.small só do jogo, em São Paulo), com pg_dump diário no S3 e snapshot do disco. ~R$ 120-155 por mês.
2. **Quando passar de ~2-5 mil jogadores por dia, ou na véspera de campanha de marketing:** migrar o banco para o **RDS (opção B)**. A troca é só a DATABASE_URL, sem mudar o código.
3. **Evitar a opção C para o jogo público:** isolar o jogo protege os sistemas da empresa. Ela serve para o Postgres de DESENVOLVIMENTO (D2), se o dono preferir: um banco e um usuário separados, só para teste.
- Região São Paulo: a latência do chat e da arena fica em ~10-30 ms para o Brasil, contra ~120-150 ms na Virgínia. Os dados ficam no Brasil, o que simplifica a LGPD.
## 6. Segurança e LGPD (resumo)
- Só guardamos o necessário: ano e mês de nascimento (para a faixa de idade), id do aparelho, ids do Google/Apple, e-mail se o jogador quiser. Nada de nome real.
- Exclusão de conta pelo jogo (exigência da Play Store). Mensagens do chat apagadas em 7 dias; o log de moderação fica 6 meses.
- Segredos (JWT, Google, Apple, banco) só em variáveis de ambiente do servidor, nunca no repositório e nunca no APK.
- Toda decisão que vale prêmio ou dinheiro (compra, ranking, arena, evento) é tomada no servidor; o save do aparelho é conferido, não confiado.

## 7. Próximo passo
1. **PgStore** (a mesma interface Store, com TypeORM), rodando os mesmos testes contra o Postgres remoto assim que o dono passar o acesso. A URL fica só em variável de ambiente.
2. Compilar e subir a camada do Nest quando houver espaço (
pm install ~150-250 MB; hoje não cabe com folga) ou já na EC2.
3. Fase 2: vínculo Google/Apple, recuperação em aparelho novo, exclusão efetiva. Fase 3: chat só com frases prontas + painel de moderação.