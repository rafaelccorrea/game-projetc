# Correio, Login diário e Eventos (js/sys/mail.js, login.js, events.js) — fps-30
Status: **prontos e testados** (`node test/sys/social.test.js`: 6 testes). Sem tela (o PO desenha). Não ligados ao jogo.
**Chave desligada (PO):** `Sys.mail.DATA.enabled`, `Sys.login.DATA.enabled` e `Sys.events.DATA.enabled` nascem `false`. Desligados, `send/claim/claimAll`,
`claim`, `list/track/claimMission/buy` não fazem nada (devolvem `reason:'desligado'`). O jogo liga cada um quando o dono aprovar a tela. Login: fica a Essência no 7º dia (PO).
Os três entregam recompensas pelo `Sys.loot.grantBundle(S, host, pacote)`, que aplica as regras únicas:
- item acima do portão de nível/era, ou asa sem nível 50 / abaixo de Épica, fica **guardado** e sai na era da liberação (no `Sys.loot.onLevelUp`);
- ovo de presente acima do portão fica **guardado**, sem rebaixar; arma sem Mítica no lançamento;
- **nada é sorteio e nada é pago**: o pacote diz exatamente o que se ganha.
Pacote: `{gold?, goldk? (× ouro de um abate), gems?, essence?, forge?, food?, xp?, skin?, items?:[{slot, r, e?}], eggs?:[r]}`.

## Correio (Sys.mail, S.sys.mail)
- `send(S, host, {title, body, att, days=30})` → id (quem manda é o jogo: compensação, prêmio, aviso). Máx. 100; cheio, sai primeiro a mensagem sem anexo pendente.
- `inbox(S, host)` (mais nova primeiro, com `daysLeft` e `hasAtt`) · `read` · `claim(S, host, id)` · `claimAll(S, host)` · `remove` (só sem anexo pendente) · `unread` (selo).
- Expira em 30 dias, com ou sem anexo; o anexo não resgatado se perde (a tela avisa os dias restantes).

## Login diário (Sys.login, S.sys.login)
- 1 resgate por dia de calendário (meia-noite local); faltar NÃO zera, e o calendário reinicia depois do 7º dia. `status(S, host)` e `claim(S, host)`.
| Dia | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|
| Prêmio | 20× ouro de um abate | 10 💎 | 5 pedras de forja | 10 rações | 15 💎 | 30× ouro + 1 Essência | **3 Essências + 20 💎** |
O 7º dia usa Essência no lugar de ovo para não mexer no balanço de pets já fechado; trocar por `eggs:[1]` se o PO preferir o ovo.

## Eventos (Sys.events, S.sys.events[id])
- Estrutura: `{id, name, points, start, end (AAAA-MM-DD), missions[], repeat[], shop[]}`. Fases: antes → ativo → loja (fim + 2 dias de carência para gastar)
  → fim (os pontos somem; `cleanup`). `list(S, host)`, `track(S, host, evento, n)` (mesmos eventos do passe), `missions`, `claimMission`, `shop`, `buy`.
- Exemplo **Festival das Eras** (14 dias, 20/11 a 04/12/2026): missões 2.000 inimigos 40 · 30 chefes 40 · 15 instâncias 40 · 20 baús 30 · 30 ultimates 30;
  repetível: a cada 250 abates, 5 pontos (até 200). Total ≈ 380 pontos.
  Loja (compra direta, com limite): skin de arma 150 · skin de roupa 150 · Colar Épico da era atual 120 (portão vale) · 5 Essências 40 (×5) ·
  20 pedras de forja 30 (×5) · 20 rações 25 (×5) · saco de ouro (50× ouro de um abate) 20 (×10).

## Prismático (Revisão 5 aprovada pelo PO; pets da fps-e2)
Cada evento dá **100 fragmentos do Prismático**, sem sorteio: as 5 missões do Festival dão 10 cada (50) e a loja tem "10 fragmentos do Prismático" por 20 pontos,
com limite de 5 (50). Só com `Sys.pet.DATA.v3` e `v4` ligadas; desligadas, as missões dão só os pontos e o item some da loja.
Entrega: `Sys.loot.grantBundle(S, host, {petFrags:{prism:n}})` → `Sys.pet.addFragments` (pet não nascido guarda; com 1.000 nasce).
Chefe da era 8+: `Sys.loot.onKill` (Senhor da Era) e `Sys.instances.finish` (Chefe de Era) chamam `Sys.pet.prismBoss(S, host, era)`; limite diário e VIP são da fps-e2.

## O que o engenheiro chama
`Sys.mail.*`, `Sys.login.*`, `Sys.events.*` como acima; os eventos do jogo vão para `Sys.events.track` junto com `Sys.pass.track`;
`Sys.loot.onLevelUp` já solta os itens guardados dos três. `host.addSkin(id)` para as skins.

## Impacto no balanceamento (para a fps-c9)
| Fonte | 💎/dia | Ouro/dia | XP/dia | Essência/dia | Forja/dia | Ração/dia |
|---|---|---|---|---|---|---|
| Login | ~6,4 (45/semana) | ~7× ouro de um abate (desprezível) | 0 | ~0,57 (4/semana; +~23% sobre ~2,5/dia) | ~0,7 | ~1,4 |
| Festival (14 dias, ~380 pontos) | 0 | até ~140× ouro de um abate/dia, se tudo for em ouro | 0 | até ~1,8/dia, se ~200 pontos forem em Essência | até ~7/dia | até ~7/dia |
| Correio | depende do que o jogo enviar (0 por padrão) | | | | | |
No evento, o jogador escolhe onde gastar os ~380 pontos (2 skins = 300), então os valores do evento são TETOS, não somas.
