# Liberação progressiva — o que aparece antes da hora e cronograma proposto

Auditoria de 14/11/2026, feita só lendo o código (sem navegador). Pedido do dono: "o item X só aparece em determinado momento, o evento tal
só libera em determinado momento (era, horário), para não mostrar muita coisa em tela que não faz sentido".
Regra usada aqui: **antes de liberar, NÃO aparece** (nem cadeado). A exceção é um aviso discreto e deliberado ("libera no Nv X") dentro de
uma tela que o jogador já usa.

## Como a liberação funciona hoje (resumo)

- **Fonte única dos níveis:** `Sys.level.DATA.unlock` (js/sys/level.js:23). O Menu lê de lá por `fbLvU`/`fbUnl` (js/fullbattle.js:195-196);
  `FB_UNLOCK` (js/fullbattle.js:186) é só a reserva.
- **Item do Menu aparece quando** `fbShown` = `m.on !== false` + `fbUnl(id)` + tela registrada e ligada no `PANEL_ON` (js/fullbattle.js:198-200).
  **Item sem entrada na tabela de níveis aparece desde o nível 1** (comentário em js/fullbattle.js:185: "Sem entrada na tabela = desde o início").
- **Aviso "NOVO!"** já existe: `fbNovoTick` (js/fullbattle.js:205-216) põe o selo e o balão uma vez por função, em fila. Só vale para quem
  TEM entrada na tabela.
- **Aviso de nível** do `Sys.level.addXp` (js/sys/level.js:116-117): "Nível N! Liberou: ...", com as funções da tabela (as do `DATA.gated` só com a chave ligada).
- **Chaves:** quase tudo está ligado. `PANEL_ON` (js/panels.js:13-28) e `SYS_LIVE` (js/farm.js:105) ligam as telas e módulos.
  Desligados que importam aqui: `Sys.events.DATA.enabled=false` (js/sys/events.js:105, nada no jogo liga), `Sys.evtrail.DATA.on=false`,
  `Sys.login.DATA.enabled=false`, `guildBoss`, `offer` (só Modo dono), `colecao`, `bag`, `fuse`, `shopmecha`, `DIFF_ON`.
- **Modo dono** (`OWNER_MODE`, index.html:437) mostra tudo sem regra de nível: só no app de teste com a chave do aparelho. O jogador normal não vê.
- **Save antigo** (`S.bornV='old'`) mantém Missões, Invocar, Práticas, Loja de gemas e Passe (js/fullbattle.js:191-194). Não é problema.

## (a) Tabela: item por item

Legenda da coluna "cedo demais?": **SIM** = o jogador vê antes de poder usar; **leve** = aparece cedo mas tem uso ou é discreto; **não** = ok;
**desl.** = chave desligada (não conta como problema visível). "Doc pede" = reports/liberacao-por-nivel.md (aprovado pelo PO 12/11) salvo indicação.

| Item | Onde aparece | Libera hoje (código) | Doc pede | Cedo demais? | Proposta |
|---|---|---|---|---|---|
| Batalha, Desafiar, retrato/FC | HUD | Nv 1 | Nv 1 | não | manter |
| Fogueira (botão e painel) | HUD, meio de baixo | Nv 1 (fogueira.js, `FOGUEIRA_ON` + `Sys.bonfire`) | essencial | não | manter |
| Ladrão de Brasas | linha dentro do painel da Fogueira | Nv 1, sem portão (js/fogueira.js:298) | não diz | **SIM** (conteúdo extra no 1º minuto) | Nv 8 ou Fogueira nível 4 (onde o lote sobe para 2) |
| Grade dos 9 estágios da Fogueira | painel da Fogueira | Nv 1, 8 estágios com "nível X" (js/fogueira.js:281) | — | leve | mostrar só o atual e o próximo |
| Equipamento (botão) | coluna esquerda | Nv 1 | Nv 1 | não | manter |
| Abas do Equip.: Asas, Pets, Montarias, Skins | Equipamento V2 | Nv 1, as 8 abas sempre (js/p_gear2.js:24 e :336) | Asa 50, Pets 20, Montaria 38 | **SIM** | aba só aparece no nível da função (Asas 50, Pets 20, Montarias 38, Skins 10) |
| Espaço da Asa com cadeado "Nível 50" | Equipamento V2, grade de espaços | Nv 1, desenhado trancado (js/p_gear2.js:73 e :285) | Asa 50 | **SIM** (cadeado no 1º minuto) | não desenhar o espaço antes do Nv 50 |
| Invocar | coluna esquerda | Nv 3 | Nv 3 | não | manter |
| Loja (botão) | coluna esquerda + pílula de ouro | Nv 1 | Nv 1 (só ouro) | não | manter |
| Abas da Loja (Ofertas, Diamantes, Visual, Montarias, VIP, Passe) | Loja V2 | Nv 1, as 7 abas visíveis e 6 "desativadas" até o Nv 10 (js/p_shop2.js:22, :331-332, :576) | Loja de 💎 no 10 | **SIM** | até o Nv 10 só a aba Ouro (sem barra de abas); no 10 entram Ofertas/Diamantes/Visual/VIP; Passe no 18; Montarias no 38 |
| Barra do VIP no topo da Loja | Loja V2 | Nv 1 (`vipBarHtml`, js/p_shop2.js:328 e :497) | VIP "a qualquer hora" | **SIM** (pagamento ainda "Em breve") | mostrar a barra junto com a aba VIP (Nv 10) e só quando a compra real existir |
| Pílula de gemas com "+" | topo da batalha | Nv 1; o "+" dá aviso "libera no nível 10" (js/fullbattle.js:297) | Loja de 💎 no 10 | leve | manter o saldo, tirar o "+" antes do Nv 10 |
| Velocidade x1 / x2 / x4 | canto esquerdo de baixo | Nv 1, x2 e x4 com **cadeado** (js/fullbattle.js:380; regra js/sys/vip.js:64-65, x2 no Nv 15 ou VIP 1) | x2 grátis no 15 | **SIM** | até o Nv 15 não mostrar o grupo (ou só x1); x2 entra com "Novo!" no 15; x4 só quando liberar |
| Selo "Fraco contra: X" | abaixo da barra da fase | Nv 1 (`Sys.affinity` ligado; js/weakseal.js:31-35) | não diz | **SIM** (o novato não tem arma de outro estilo: armas novas no Nv 30/45, js/sys/stats.js:49-51) | mostrar a partir do Nv 30 ou quando a mochila tiver arma de outro estilo |
| Baú | coluna direita | Nv 1 | — | não | manter |
| Oferta 24 h | coluna direita | só Modo dono (js/fullbattle.js:145) | 1ª compra | desl. | manter assim até a compra real |
| Hoje | coluna direita | Nv 7 e só com algo para pegar (js/fullbattle.js:135) | Nv 7 | não | manter |
| Ícone de evento com horário | coluna direita | por evento, com `level` (js/evhud.js `evhLvOk`; js/sys/schedule.js:15-26) | agenda aprovada 12/11 | não | manter: Hora de Ouro 10, Bênção da Forja 12, Invasão 18, Caça aos Pets 20, Chefe Mundial 24, Torneio de fim de semana 28 |
| Encruzilhada (selo e botão "Bênçãos") | HUD, coluna esquerda | 1ª na fase 5 (js/sys/crossroads.js `needLevel:0`); botão só com bênção ativa (js/p_cross.js:264) | não diz | leve (escolha nos primeiros minutos) | sugestão: 1ª encruzilhada só a partir da era 1 (`needLevel` 12) |
| Selo "Teto Nv X" da Provação | HUD | só quando a provação está devida (js/p_trial.js:303) | — | não | manter |
| Coluna do Grimório na batalha | HUD | só com magia no conjunto (js/grimhud.js) | — | não | manter |
| Chefe da guilda na batalha | HUD | `guildBoss:false` | — | desl. | — |
| Botão Menu e selo vermelho | canto superior direito | Nv 1; selo = Missões + Mapa + Passe, cada um com o próprio nível (js/fullbattle.js:382) | — | não | manter |
| Mapa das Eras | Menu | Nv 1 (level.js:27, `map:1`); selo dos baús do mapa conta já no Nv 1 | Nv 1 (PO 12/11) | leve | Nv 4 (depois do 1º chefe), com "Novo!" |
| VIP | Menu | **Nv 1**: sem entrada na tabela (js/fullbattle.js:155) | "VIP a qualquer hora" | **SIM** (sem compra real, só "Em breve") | Nv 10 junto com a Loja de 💎, e só com `Sys.buy.ready()` |
| Grimório | Menu | **Nv 1**: sem entrada na tabela (js/fullbattle.js:167); a tela mostra as 18 magias trancadas | não diz | **SIM** | aparece quando aprender a 1ª magia (1º Senhor da Era) ou Nv 13 |
| Caminhos | Menu | **Nv 1**: sem entrada na tabela (js/fullbattle.js:171); a tela diz "libera no Nv 30" (js/p_path.js:199-201; js/sys/path.js:13) | Nv 30 | **SIM** | pôr `path:30` na tabela |
| Provação | Menu | **Nv 1**: sem entrada na tabela (js/fullbattle.js:172); a tela diz "faltam X níveis" (js/p_trial.js:223; 1ª no Nv 10, js/sys/trial.js:24) | 1ª no Nv 10 | **SIM** | pôr `trial:10` na tabela |
| Config. | Menu | Nv 1 | — | não | manter |
| Missões | Menu | Nv 2 | Nv 2 | não | manter |
| Práticas | dentro do Equip./Perfil | Nv 5 (js/screens2.js:470) | Nv 5 | não | manter |
| Correio | Menu | Nv 7 | Nv 7 | não | manter |
| Login diário | (sem tela própria) | Nv 7 na tabela, mas `Sys.login.DATA.enabled=false` | Nv 7 | **SIM no aviso**: o "Nível 7! Liberou: ... Login diário" anuncia algo que não existe (js/sys/level.js:116-117, `login` fora do `DATA.gated`) | pôr `login:'login'` no `DATA.gated` (ou tirar da tabela) |
| Perfil | avatar e Menu | Nv 10 (antes o avatar abre o Equip.) | Nv 10 | não | manter |
| Loja de 💎 | Loja | Nv 10 | Nv 10 | ver "Abas da Loja" | — |
| Forja | Menu | Nv 12 | Nv 12 | não | manter |
| Códex | Menu | Nv 12 | Nv 12 (PO) | leve (3 coisas no 12) | Nv 13 |
| Relíquias | Menu | Nv 12 | não diz | leve (no 12 pode ainda não ter relíquia: ela nasce no 1º Senhor da Era, js/sys/relics.js:40) | aparecer quando a 1ª relíquia nascer (ou Nv 12 se já nasceu) |
| Instâncias | Menu | Nv 14 | Nv 14 | não | manter |
| Escavação | Menu | Nv 14 | não diz | leve (2 no 14) | Nv 16 |
| Torre | Menu | Nv 15 | Nv 15 | não | manter |
| Chat | Menu | Nv 16 | Nv 16 | **SIM sem servidor**: abre sem mensagens, "precisa do online · em breve" (js/p_chat.js:39) | só com o online respondendo; Nv 19 |
| Dupla | Menu | Nv 16 (`gated`) | Nv 16 | **SIM sem servidor**: "Em breve: abre com o online" (js/p_duo.js:374-376) | só com o online respondendo; Nv 21 |
| Mentores | Menu | Nv 16 (`gated`) | Nv 16 | leve (3 no 16) | Nv 17 |
| Passe | coluna esquerda | Nv 18 | Nv 18 | não | manter |
| Pets | Menu | Nv 20 (com `Sys.pet` v20 desligado o portão do módulo é Nv 1: drop de pet/ração antes do 20 **não confirmado**) | Nv 20 | não (Menu) | conferir se ovo/ração caem antes do 20 e vão para a mochila |
| Acampamento | Menu | Nv 20 (`gated`; js/sys/camp.js:15) | proposta Nv 20 | leve (2 no 20) | Nv 22 |
| Eventos | Menu | Nv 24 | Nv 24 | **SIM**: `Sys.events.DATA.enabled=false` e `Sys.evtrail` desligado, então a tela mostra o Festival "Em breve", em prévia, sem compra (js/p_events.js:25) | só aparecer com o módulo ligado E um evento em fase ativo/loja |
| Festival das Eras (20/11-04/12), Caçada aos Chefes (04/12), Semana da Forja (01/01), Festa dos Pets (29/01) | dentro de Eventos | local: só o Festival (js/sys/events.js:114); calendário do servidor troca as ocorrências | docs/CALENDARIO_EVENTOS.md, docs/EVENTOS_TEMAS.md | não confirmado (depende do `Sys.events` ligar e do `load()` ser chamado; hoje ninguém chama) | nunca listar ocorrência futura; tema sem arte (`DATA.ready`) fica escondido, como já está |
| Minijogo, Ranking do evento | dentro de Eventos | Nv 24 (js/p_minigame.js:62, js/p_evrank.js:51) | Nv 24 | não (seguem Eventos) | manter |
| Ranking | Menu | Nv 28 | Nv 28 | leve (2 no 28) | Nv 26 |
| Arena (+ Conjunto PvP) | Menu | Nv 28 | Nv 28 | não confirmado sem servidor | manter |
| Ruínas em Trio | Menu | Nv 30 (`gated`) | não diz | **SIM sem servidor** (precisa do `COOP_ON`) — não confirmado | só com o online; Nv 31 |
| Guilda | Menu | Nv 32 | Nv 32 | **SIM sem servidor**: "Em breve: abre com o online" (js/p_guild2.js:303) | só com o online |
| Montarias | Menu | Nv 38 | Nv 38 | não | manter |
| Torneio do Poder | Menu | Nv 40 | Nv 40 (precisa de guilda + 7 dias) | **SIM**: sem guilda ou sem servidor mostra "Em breve" (js/p_tourney2.js:287) | só aparecer para quem está numa guilda há 7 dias |
| Leilão | Menu | Nv 45; tela de **demonstração** "Leilão em breve: abre com o online" (js/panels.js:21; js/fullbattle.js:116) | Nv 45, só com servidor e parecer | **SIM** | desligar `PANEL_ON.auction` até o online do leilão existir |
| Asa | Equip. | Nv 50 | Nv 50 | ver "Espaço da Asa" | — |
| Coleção, Mochila nova, Fusão, Mecha na Loja | — | desligados | — | desl. | — |

## (b) Problemas reais, em ordem (o que o jogador novo vê e não deveria)

1. **VIP no Menu desde o Nv 1, sem compra real** — js/fullbattle.js:155 (sem entrada em `FB_UNLOCK`/`DATA.unlock`).
   Correção: `vip:10` em `Sys.level.DATA.unlock` + esconder enquanto `Sys.buy.ready()` for falso.
2. **Caminhos no Menu desde o Nv 1, tela "libera no Nv 30"** — js/fullbattle.js:171. Correção: `path:30` na tabela (js/sys/level.js:23).
3. **Provação no Menu desde o Nv 1, tela "faltam X níveis"** — js/fullbattle.js:172. Correção: `trial:10` na tabela.
4. **Grimório no Menu desde o Nv 1, 18 magias trancadas** — js/fullbattle.js:167. Correção: mostrar só com a 1ª magia aprendida (ou `grim:13`).
5. **Loja com 7 abas e 6 desativadas + barra VIP no Nv 1** — js/p_shop2.js:331-332 e :497. Correção: antes do Nv 10 só a aba Ouro, sem barra de abas nem barra VIP; Passe no 18, Montarias no 38.
6. **Equipamento com abas Asas/Pets/Montarias/Skins e o espaço da Asa trancado no Nv 1** — js/p_gear2.js:24, :336 e :285. Correção: filtrar `TABS` e o espaço da asa por nível (`fbUnl`/`Sys.stats.slotOpen`).
7. **Velocidade x2 e x4 com cadeado no 1º minuto** — js/fullbattle.js:380. Correção: desenhar só as velocidades liberadas; x2 entra com "Novo!" no Nv 15.
8. **Eventos (Nv 24) abre um Festival "Em breve" que não dá para jogar** — `Sys.events.DATA.enabled=false` (js/sys/events.js:105), tela em js/p_events.js:25. Correção: o item Eventos só aparece com o módulo ligado e um evento ativo; ou ligar o módulo e chamar `Sys.events.load` no boot (pedido do docs/CALENDARIO_EVENTOS.md).
9. **Leilão (Nv 45) é tela de demonstração "Em breve"** — js/panels.js:21 (`auction:true`). Correção: `auction:false` até o servidor do leilão.
10. **Selo "Fraco contra: X" desde a fase 1** — js/weakseal.js:31. Correção: só mostrar com arma de outro estilo na mochila ou a partir do Nv 30.
11. **Ladrão de Brasas no painel da Fogueira desde o Nv 1** — js/fogueira.js:298. Correção: só a partir do Nv 8 (ou Fogueira nível 4).
12. **Social sem servidor mostra "Em breve: abre com o online"** — Chat (js/p_chat.js:39), Dupla (js/p_duo.js:374), Guilda (js/p_guild2.js:303), Torneio (js/p_tourney2.js:287), Ruínas em Trio (não confirmado). Correção: o `fbShown` também pede o online respondendo para essas ids (lista `FB_NEEDS_ONLINE`).
13. **Torneio do Poder (Nv 40) aparece para quem não tem guilda** — Correção: condição extra "em guilda há 7 dias".
14. **Aviso "Liberou: Login diário" no Nv 7 sem o login existir** — js/sys/level.js:116 (`login` fora do `DATA.gated`, `Sys.login.DATA.enabled=false`). Correção: `gated.login='login'` (o `gateOn` lê `DATA.on`; o login usa `DATA.enabled`: ajustar o `gateOn` para aceitar os dois) ou tirar `login` da tabela.
15. **Várias novidades no mesmo nível** (contra a regra "uma novidade por nível" do relatório aprovado): Nv 7 (Correio, Login, Hoje), 12 (Forja, Códex, Relíquias), 14 (Instâncias, Escavação), 16 (Chat, Dupla, Mentores), 20 (Pets, Acampamento), 28 (Ranking, Arena), 30 (Ruínas, Caminhos). Correção: espalhar (ver cronograma).
16. **Mapa das Eras no Nv 1 com selo de baú** — js/sys/level.js:27 (`map:1`). Leve. Correção: `map:4`.
17. **Relíquias no Nv 12 pode abrir vazia** (a relíquia nasce no 1º Senhor da Era) — não confirmado em que nível o grátis vence o Senhor da Era 0. Correção: aparecer quando houver a 1ª relíquia.
18. **Pets antes do Nv 20**: com o v20 desligado o portão do `Sys.pet` é o Nv 1 (js/sys/level.js:23 `pet:1`) — não confirmado se cai ovo/ração na mochila antes; se cair, a aba Pets do Equip. mostra itens de função trancada.

Observação: o `FB_UNLOCK` (js/fullbattle.js:186) repete os números da tabela do `Sys.level`. Ao mudar um nível, mudar os dois (ou apagar a reserva).

## (c) Cronograma proposto (jogador grátis)

Tempos de chegada: os do reports/liberacao-por-nivel.md (curva das 9 eras, 40 min/dia + offline). A curva ligada hoje é a v7.3; os tempos
dela **não foram medidos aqui**. "(muda)" = nível diferente do código de hoje. Toda entrada nova sai com o selo "NOVO!" e o balão (já existe).

| Quando | Nível | Entra | Observação |
|---|---|---|---|
| 1º minuto | 1 | Batalha, Desafiar, Fogueira (sem Ladrão), Equip. (Armas, Equipamento, Materiais, Consumíveis), Loja só de ouro, Baú, Config. | tela enxuta: sem velocidade, sem selo de afinidade, sem VIP/Grimório/Caminhos/Provação |
| ~1 min | 2 | Missões | |
| ~1 min | 3 | Invocar | |
| ~2 min | 4 | Mapa das Eras (muda: era 1) | depois do 1º chefe |
| ~2 min | 5 | Práticas | |
| ~4 min | 7 | Correio + Hoje | Login diário só quando o módulo ligar |
| ~5 min | 8 | Ladrão de Brasas na Fogueira (muda: era 1) | |
| ~7 min | 10 | Perfil, Loja de 💎 (abas Ofertas, Diamantes, Visual, Skins no Equip.), 1ª Provação (muda: Menu era 1), Hora de Ouro | VIP só quando a compra real existir (muda: era 1) |
| ~16 min | 12 | Forja + Bênção da Forja | |
| fim da era 0 | 13 | Códex (muda: era 12); Grimório com a 1ª magia (muda: era 1); Relíquias com a 1ª relíquia (muda: era 12) | os dois últimos por fato, não por nível |
| ~31 min | 14 | Instâncias | |
| ~39 min | 15 | Torre + velocidade x2 grátis | 1º dia fecha aqui |
| dia 2 | 16 | Escavação (muda: era 14) | |
| dia 2 | 17 | Mentores (muda: era 16) | |
| dia 2 | 18 | Passe (+ aba Passe na Loja), Invasão da Era | |
| dia 2 | 19 | Chat (muda: era 16), só com o online | |
| dia 2 | 20 | Pets (+ aba Pets no Equip.), Caça aos Pets | |
| dia 3 | 21 | Dupla (muda: era 16), só com o online | |
| dia 3 | 22 | Acampamento (muda: era 20) | |
| dia 3 | 24 | Eventos (+ Minijogo, Ranking do evento), Chefe Mundial | só com `Sys.events` ligado e evento ativo; temas pelo calendário (Festival 20/11, Caçada 04/12, Forja 01/01, Pets 29/01), nunca o futuro |
| dia 4 | 26 | Ranking (muda: era 28) | |
| dia 4-5 | 28 | Arena (+ Conjunto PvP), Torneio de fim de semana | |
| dia 5 | 30 | Caminhos (muda: Menu era 1), selo "Fraco contra" (muda: era 1), armas de outro estilo | |
| dia 5 | 31 | Ruínas em Trio (muda: era 30), só com o online | |
| dia 6 | 32 | Guilda, só com o online | |
| dia 9 | 38 | Montarias (+ abas no Equip. e na Loja) | |
| dia 10 | 40 | Torneio do Poder, só com guilda há 7 dias | |
| dia 14 | 45 | Leilão, só quando o online do leilão existir | hoje: desligar |
| dia 18 | 50 | Asa (+ aba e espaço no Equip.) | |
| era 4+ | 70 / 85 | ovos Míticos / Prismáticos (portão do `Sys.loot`) | já funciona assim |

Por era (não por nível, já no código): mentor e relíquia de cada era, pets e montarias com `minEra` (js/sys/pet.js, js/sys/mount.js), armas de estilo novo (`fromEra`).
Por horário: a agenda do `Sys.schedule` já respeita o nível de cada evento; nada a mudar.

**Não confirmado nesta auditoria (precisa do QA no navegador quando for a vez):** em que nível o grátis vence o 1º Senhor da Era na curva de hoje;
se cai ovo ou ração de pet antes do Nv 20; o que Arena, Ranking e Ruínas mostram com o servidor fora; se o aviso do `Sys.level` e o "NOVO!" do Menu saem duplicados no mesmo nível.
