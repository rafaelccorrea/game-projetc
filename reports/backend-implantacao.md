# Implantação do servidor do Eonbound na AWS — roteiro (fps-30) — opção A aprovada pelo dono
Uma EC2 **t4g.small** em **São Paulo (sa-east-1)** com o Nest e o Postgres 16 na mesma máquina, backup diário no S3, e migração para o RDS ao passar de
~2-5 mil jogadores por dia. **Nada disto foi executado.** Nada sobe e nenhuma conta ou chave é criada antes de o dono passar o acesso.
Os segredos ficam no console dele (SSM Parameter Store) ou são gerados na própria máquina. Nunca vão para arquivo de repositório nem para mensagem.

## 0. O que o dono precisa passar (e como)
| Item | Como passar | Quem cria |
|---|---|---|
| Acesso à conta AWS | Usuário IAM só para o projeto, com MFA e as permissões da §9 (nunca a conta root). O dono pode também executar os passos no console dele, comigo guiando | dono |
| Domínio | Um subdomínio (ex.: `api.<domínio-do-jogo>`) apontando para o IP fixo da §1, no DNS onde o domínio já está | dono |
| Segredos do servidor | `JWT_SECRET` e a senha do Postgres são GERADOS na própria máquina (§3), sem passar por ninguém. Os ids do Google e da Apple (públicos) entram no SSM pelo console | — |
| Alerta de custo | AWS Budgets com alerta em US$ 40 e US$ 60 por mês, para o e-mail dele | dono |

## 1. Provisionamento (uma vez)
1. **Rede:** VPC padrão de sa-east-1 (ou uma VPC só do jogo, se a TI da empresa preferir), sub-rede pública.
2. **Security group `eonbound-web`:**

   | Porta | Origem | Para quê |
   |---|---|---|
   | 443 | 0.0.0.0/0 e ::/0 | HTTPS e WebSocket do chat |
   | 80 | 0.0.0.0/0 e ::/0 | só emissão do certificado + redirecionar para o 443 |
   | 22 (SSH) | **fechada** | o acesso administrativo é pelo **SSM Session Manager**, sem porta aberta e sem chave SSH |
   | 5432 | **nunca** | o Postgres escuta só em `localhost` |
3. **EC2:** t4g.small (ARM, 2 vCPU, 2 GB) com Ubuntu Server 24.04 LTS arm64.
   - Disco gp3 de 30 GB **criptografado**.
   - **IMDSv2 obrigatório**; proteção contra término ligada.
   - **Papel IAM da instância** `eonbound-ec2`: SSM, CloudWatch Agent, gravação só no bucket de backup e leitura só em `/eonbound/*` do Parameter Store. Assim não há chave de acesso dentro da máquina.
4. **IP fixo:** Elastic IP associado à instância; o dono aponta o DNS (§0).
5. **Bucket S3 `eonbound-backup-<id>`** (sa-east-1):
   - Block Public Access ligado, criptografia SSE-S3 e versionamento.
   - Ciclo de vida: diários por 35 dias, mensais (1º de cada mês) por 12 meses.
6. **Snapshots do disco:** Data Lifecycle Manager com snapshot diário do volume, mantendo 7.

## 2. Sistema operacional (primeira sessão pelo SSM)
- `apt update && apt full-upgrade`. `unattended-upgrades` liga só as atualizações de segurança, sem reiniciar sozinho; a janela de reinício é semanal (§6).
- Fuso UTC. Swap de 2 GB em arquivo (a máquina tem 2 GB de RAM; o swap evita o OOM num pico).
- Usuário **`eonbound`** sem shell de login, sem sudo, dono de `/opt/eonbound`: o app roda com ele, **nunca como root**.
- Firewall local `ufw`, que repete o security group: 80 e 443 abertos, o resto fechado.
- Programas: Node 22 LTS (NodeSource, arm64), PostgreSQL 16 (repositório PGDG), Caddy 2 (proxy HTTPS), AWS CLI v2, CloudWatch Agent.

## 3. Postgres na própria máquina
- `listen_addresses = 'localhost'`; `password_encryption = scram-sha-256`; `pg_hba.conf` só `local` e `127.0.0.1/32` com scram.
- Ajuste para 2 GB: `shared_buffers=256MB`, `effective_cache_size=768MB`, `work_mem=4MB`, `maintenance_work_mem=64MB`, `max_connections=40`.
- Papéis:
  - `eonbound_owner` é dono do banco e roda as migrações;
  - `eonbound_app` só tem SELECT, INSERT, UPDATE e DELETE nas tabelas, sem criar nem apagar tabela, e é o papel que o app usa;
  - `eonbound_backup` só tem leitura.
- As senhas são geradas na máquina (`openssl rand -base64 36`) e gravadas direto no Parameter Store como SecureString (`/eonbound/prod/DATABASE_URL`, `/eonbound/prod/MIGRATION_DATABASE_URL`).
  Ninguém precisa ver as senhas.

## 4. O app
- Pastas:
  - `/opt/eonbound/releases/<data-hora>/` guarda cada versão compilada (`dist/` + `node_modules` de produção);
  - `/opt/eonbound/current` é um link para a versão no ar.
- **Variáveis de ambiente:**
  - O script `/opt/eonbound/bin/load-env` lê o Parameter Store `/eonbound/prod/*` com o papel da instância e escreve `/run/eonbound/env` (memória, permissão 0640, root:eonbound).
  - O `systemd` carrega esse arquivo com `EnvironmentFile`.
  - `JWT_SECRET` é gerado uma vez na máquina e gravado no SSM.
  - Nada fica em disco persistente nem no repositório.
- **systemd:** duas instâncias do mesmo app, `eonbound@3101` e `eonbound@3102`, para atualizar sem derrubar (§6). Cada uma com:
  - `User=eonbound`, `Restart=always`, `NoNewPrivileges=yes`, `ProtectSystem=strict`, `ProtectHome=yes`, `PrivateTmp=yes`;
  - `ReadWritePaths=/var/log/eonbound`, `MemoryMax=700M`.
- **Chat com 2 instâncias:** enquanto o chat guardar presença e limites em memória, o Caddy prende cada jogador numa instância (`lb_policy cookie` / `ip_hash`).
  Quando houver mais de uma máquina, isso passa para o Redis ou para o próprio Postgres (`LISTEN/NOTIFY`).

## 5. HTTPS
- **Caddy** na frente, nas portas 80/443: certificado Let's Encrypt automático e renovado sozinho, só TLS 1.2+, HSTS, gzip, WebSocket transparente.
- Proxy para `127.0.0.1:3101` e `:3102`, com `health_uri /health` a cada 5 s.
- O app só escuta em `127.0.0.1`, nunca direto na internet.
- Cabeçalhos: `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`. O `/admin` aceita só HTTPS, e o cookie da equipe é `Secure` + `HttpOnly` + `SameSite=Strict`.

## 6. Atualização sem derrubar
1. A nova versão é compilada FORA da máquina (no CI ou no PC com espaço), num pacote `.tar.gz` com `dist/` e `package-lock.json`.
2. A máquina baixa o pacote do bucket, roda `npm ci --omit=dev` em `releases/<nova>` e confere a soma sha256.
3. **Migração do banco antes, sempre aditiva** (expandir → migrar → contrair): coluna e tabela novas entram numa versão; a remoção do que é velho fica para a versão seguinte.
   Assim a versão anterior continua funcionando durante a troca.
4. O link `current` passa para a nova versão. Reinicia `eonbound@3101` e espera o `/health` ficar verde (até 30 s). Só depois reinicia `eonbound@3102`.
   O Caddy tira do ar a instância que está reiniciando, e os jogadores do chat reconectam sozinhos (o cliente já reconecta).
5. **Volta (rollback):** o link `current` volta para a versão anterior e as duas instâncias reiniciam. Como a migração foi aditiva, a versão velha roda no banco novo.
6. Janela de manutenção do sistema operacional (kernel): semanal, de madrugada (horário de Brasília), com aviso no jogo via `503 maintenance` + `retryAfterMs`.

## 7. Backups e restauração TESTADA
| O quê | Quando | Onde | Guarda |
|---|---|---|---|
| `pg_dump -Fc` do banco (com `eonbound_backup`) | todo dia, 04:00 de Brasília (timer do systemd) | S3, criptografado | 35 diários + 12 mensais |
| Snapshot do disco inteiro | todo dia | EBS (DLM) | 7 |
- Perda máxima aceita no começo: até 24 h (RPO). O save do aparelho cobre o jogador nesse intervalo, porque o cliente sobe de novo o que tem.
  No RDS (depois), a restauração vai a qualquer minuto dos últimos 7 dias.
- **Teste de restauração automático, toda semana:** um timer baixa o último dump, restaura num banco temporário `eonbound_restore_test`, roda consultas de conferência
  (contagem de jogadores e saves, último `updated_at` com menos de 26 h) e apaga o banco temporário.
  Se falhar, vai alarme para o dono (§8).
- **Antes de abrir para jogadores:** um teste de restauração MANUAL completo, numa EC2 temporária, cronometrado (meta: menos de 30 min), com o passo a passo
  gravado em `fps-server/docs/restaurar.md`.

## 8. Logs e alarmes
- **Logs do app:** JSON no `journald`, que o CloudWatch Agent envia ao grupo `/eonbound/app` (30 dias). Os do Caddy vão para `/eonbound/proxy` (14 dias).
  **Nunca entram no log:** token, senha, conteúdo do save, texto de chat. O log de moderação é uma tabela do banco, não log de arquivo.
- **Alarmes no CloudWatch, por e-mail ao dono:** CPU acima de 80% por 10 min; disco acima de 80%; memória acima de 90% (pelo agente); `/health` fora do ar por 2 min (via
  Route 53 health check, ~US$ 0,50 por mês); backup diário ou teste de restauração sem sucesso em 26 h (métrica gravada pelo próprio timer); muitos `5xx` em 5 min.
- Painel simples no CloudWatch: pedidos por minuto, erros, latência, conexões do chat.

## 9. Permissões (o mínimo)
- **Usuário IAM do projeto** (para mim ou para quem implantar): EC2 e SSM só nas instâncias com a tag `Project=eonbound`; S3 só no bucket de backup e de pacotes;
  Parameter Store só em `/eonbound/*`; CloudWatch de leitura. Sem IAM administrativo e sem faturamento.
- **Papel da instância:** §1.3. A conta root da AWS com MFA, guardada pelo dono.

## 10. Custo (referência, conferir na calculadora da AWS)
t4g.small + 30 GB gp3 + Elastic IP + snapshots + S3 + CloudWatch básico + health check: **~US$ 22-28 por mês (~R$ 120-155)**.
O tráfego de saída a ~US$ 0,15/GB é pequeno no começo.

## 11. Quando passar para o RDS (~2-5 mil jogadores por dia ou antes de campanha)
1. Criar um RDS PostgreSQL 16 db.t4g.micro (ou small) Single-AZ, em sub-rede privada, com security group que aceita só a EC2.
2. Restaurar o último dump. Na janela de manutenção, um dump final, troca da `DATABASE_URL` no Parameter Store e reinício das instâncias (§6).
3. Desligar o Postgres local depois de 7 dias de RDS estável. O código não muda.

## 12. Ordem de execução quando o acesso chegar
1. §0 (o dono): usuário IAM com MFA, DNS, alerta de custo.
2. §1 provisionamento e §2 sistema, pelo SSM.
3. §3 Postgres e §4-5 app + HTTPS, com `STORE=postgres` (o PgStore precisa estar pronto e testado contra o Postgres de desenvolvimento antes).
4. §7 primeiro backup e restauração manual cronometrada. §8 alarmes.
5. Teste de fumaça: convidado → save → conflito → vínculo (quando houver os ids). Só então a fps-c9 aponta a camada do jogo para `https://api.<domínio>/v1`.
