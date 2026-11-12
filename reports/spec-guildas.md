# GUILDAS — spec (APROVADA pelo PO como base, 2026-11-12; os pontos da §8 o PO decide com o dono junto com as telas)
Pedido do dono (via PO). **Tudo depende do servidor** (fps-30: rotas, moderação, anti-fraude); no jogo, um módulo `Sys.guild` com provider trocável,
como a arena. Nada de sorteio pago. Números = proposta; os de poder foram conferidos contra a curva de 9 eras (conta, §8).

## 1. Guilda
- **Criar:** nível 30 do jogador + ouro de 8 h de farm (`goldk 8.000`; sem 💎, para criar não ser pago). Nome (filtro do chat), emblema (lista fixa), idioma.
- **Entrar:** nível 30 (proposta do dono). Pedido (o oficial aceita) ou guilda aberta (entra direto, com nível mínimo que a guilda escolhe ≥ 30).
- **Membros:** 20 no nível 1 da guilda, +2 por nível, **até 30** (nível 6+).
- **Cargos:** Líder (1) · Oficiais (até 4) · Membros.
  | Ação | Líder | Oficial | Membro |
  |---|---|---|---|
  | aceitar/expulsar membro | ✔ | ✔ (só membro) | — |
  | promover/rebaixar oficial, passar a liderança, renomear | ✔ | — | — |
  | escalar o torneio, declarar ataque a território | ✔ | ✔ | — |
  | estandartes (gastar XP da guilda) | ✔ | ✔ | — |
  | pedir/doar item, chefe, missões, check-in, loja | ✔ | ✔ | ✔ |
- **Líder ausente 7 dias:** a liderança passa sozinha ao oficial mais ativo da semana (sem oficial: ao membro mais ativo).
- **Sair:** a qualquer hora; **24 h** sem entrar em outra guilda; voltar à MESMA guilda: 7 dias (evita "pular de guilda" atrás de prêmio). Quem sai perde a
  moeda da guilda que não gastou.
- **Nível da guilda 1-10**, por **XP da guilda** (contribuição: doações, chefe, missões, check-in). Cada nível libera +2 vagas, itens da loja e o teto dos estandartes.
  XP por nível: 1.000 × 1,6^(n−1) (nível 10 ≈ 69 mil de XP somado; uma guilda cheia e ativa sobe ~1 nível por semana no começo e leva ~3 meses ao 10).

## 2. Troca de itens na guilda (o dono quer facilitar) — com as travas do leilão
- **Pedido:** o membro pede um item (espaço + raridade mínima; ex.: "Botas Épicas"), visível 24 h no mural. **Doação:** qualquer membro doa um item da
  mochila para um pedido ou direto para alguém.
- **Travas (as mesmas do leilão):**
  1. O item **chega no nível 1** (o ouro investido: o doador recebe 50% de volta, como no leilão "+metade do ouro do nível"). Qualidade (estrelas), era de
     poder, raridade e secundários ficam (é o que o dono quer trocar).
  2. **Não troca:** itens comprados (loja de 💎, oferta de 1ª compra: `offer`/`bought`), pets, skins, VIP, montarias, fragmentos, materiais, moedas.
  3. **Portões valem para quem recebe:** item acima da raridade/era permitida fica GUARDADO e sai quando liberar; era futura = "adormecido" (regra de sempre).
  4. **Limite diário:** doar 3, receber 2 por dia; o MESMO par doador→recebedor: 1 por dia.
  8. **Só 18+** (PO) até o parecer jurídico: menor de idade não doa nem recebe.
  5. **7 dias de membro** para receber E para doar (anticonta-fantasma).
  6. **Item obtido há menos de 24 h não pode ser doado** (evita farm com contas paralelas).
  7. **Registro** de 30 dias (quem, para quem, item, hora), visível ao líder e aos oficiais; o servidor guarda tudo (moderação).
- Nenhuma moeda entra na troca: é doação, não venda (sem risco de "comércio por dinheiro real" dentro do jogo).

## 3. TORNEIO DO PODER (territórios no mapa-múndi das eras)
- **Mapa:** o mapa-múndi das eras (assets/map). Cada uma das 9 regiões (era 0-8) tem **3 territórios** + 1 **Capital** no centro = **28 territórios**.
  Território da região *e* só pode ser atacado por guildas cuja mediana de era dos 15 escalados seja ≥ *e* (sem guilda de era 2 dominando a era 8).
- **Temporada semanal** (relógio do servidor, Brasília): seg-qui **declarar ataques** (até 2 por guilda/dia; 1 território defendido por vez) · sex-sáb
  **batalhas** (automáticas, às 20h) · dom **prêmios** e mapa congelado; segunda recomeça (o dono do território o mantém se ninguém tomar).
- **Batalha automática** (no servidor, com o mesmo `Sys.tower.duel` da arena, atributos REAIS, sem escalar): cada lado escala até **15 membros** (retrato de
  poder validado, §4 do contrato do servidor). Fila por FC; o vencedor de cada duelo fica com a vida que sobrou e enfrenta o próximo ("rei da colina").
  Ganha quem tiver o último lutador. Empate (tempo): o defensor fica. Membro só luta 1 vez por batalha; o log de cada duelo é visível (animação).
- **Bônus de território** (para TODOS os membros, enquanto a guilda o tiver), por território: ouro +2%, XP +1%, drop de item +1%; Capital ×3.
  **Teto:** ouro +10%, XP +5%, drop +5% (somando todos os territórios). Não dá ATK/Vida: **não mexe na FC**. A XP passa pelo teto diário de XP de abate
  (curva v9), então o calendário quase não muda.
- **Itens:** baú semanal por território (domingo), por membro: 1 item da raridade-teto da era DO MEMBRO (dentro dos portões; sem sorteio de raridade:
  a raridade é a do teto; espaço e secundários como qualquer drop) + materiais (forja/ração/Essência ×1 de um dia).

## 4. RANKING de guildas (semanal e geral)
- **Poder:** soma da FC dos 30 maiores membros (retrato validado). **Territórios:** pontos por território (região *e* vale 1 + *e*; Capital 15).
  **Torneio:** vitórias da semana. Prêmios do ranking do TORNEIO (domingo, por membro que lutou ou estava escalado):
  | Posição | Moeda da guilda | Fragmentos do Prismático | Outros |
  |---|---|---|---|
  | 1º | 300 | **3** | moldura de guilda (visual, 1 semana) |
  | 2º-3º | 200 | **2** | — |
  | 4º-10º | 120 | **1** | — |
  | 11º-50º | 60 | — | — |
- **Por que só 1-3 fragmentos:** a meta aprovada do Prismático (pagante 3-4 meses) aguenta pouco. Conta (simulação da Revisão 5): com 20/semana para o 1º,
  o pagante pegaria em **2,1 meses** e o grátis dedicado em 4,5 (fura a meta); com **3/semana**, o pagante fica em **~2,9-3,0 meses** e o grátis em ~6,5
  (dentro da meta). Com 8-10/semana: 2,5 meses. Recomendo 3/2/1.

## 5. Extras
- **Chefe da guilda:** 1 por semana (vida = soma da FC dos membros × fator; cresce com o nível da guilda). Cada membro: **2 ataques por dia** de 30 s, dano
  REAL (os atributos dele, regra de coerência de dano), simulados no servidor. Prêmios por FAIXA DE DANO pessoal (fixos, sem sorteio): moeda da guilda,
  pedras de forja, ração, Essência; e prêmio de guilda se o chefe cair (XP da guilda + baú para todos que bateram).
- **Loja da guilda:** moeda **Brasão**, ganha só jogando (não se compra). Compra direta com limite semanal: pedras de forja, ração, Essência, pedras de treino,
  fragmentos de montaria (Básico/Raro), molduras e emblemas (visual). Itens liberam pelo nível da guilda. Nada de ovo nem item com sorteio.
- **Doações diárias** (1 de cada por dia): ouro pequeno (1 h de farm → 10 Brasões + 20 XP da guilda) · ouro grande (4 h → 30 Brasões + 60 XP) ·
  **50 💎 → 40 Brasões + 80 XP** (opcional; como 💎 se compra, o limite de 1 por dia segura a vantagem do pagante).
- **ESTANDARTES da guilda (antes "bênçãos"; renomeado pelo PO para não confundir com a futura Bênção de Equipamento):** a guilda gasta XP da guilda; valem para todos os membros: ATK +%, Vida +%, DEF +%, ouro +%, ração +%.
  **Teto: ATK +5%, Vida +5%, DEF +3%, ouro +10%, ração +10%**, liberado aos poucos pelo nível da guilda (nível 10 = teto). É o ÚNICO poder (FC) da guilda:
  +5% de FC no máximo (comparação: VIP 10 = +10%, montaria Lendária = +12%). Quem sai perde os estandartes.
- **Missões semanais da guilda** (soma de todos): ex.: 300 mil abates, 1.000 instâncias, chefe da guilda derrubado, 150 doações, 2 batalhas do torneio →
  XP da guilda + Brasões para quem contribuiu.
- **Check-in diário:** +5 Brasões e +5 XP da guilda.

## 6. Tetos de poder (para não quebrar a curva)
| Fonte | Vira FC? | Teto |
|---|---|---|
| Estandartes | sim | ATK +5%, Vida +5%, DEF +3% |
| Territórios | não (ouro/XP/drop) | ouro +10%, XP +5% (dentro do teto diário), drop +5% |
| Troca de itens | sim (itens melhores mais cedo) | travas da §2; item chega no Nv 1; portões valem |
| Prêmios do torneio | indireto | Prismático 1-3 frag./semana; baú de território na raridade-teto da era do membro |
Efeito total de uma guilda forte no calendário (conta): +5% de FC ≈ 1 fase de FC na Revisão 2 (a trava de nível segura); XP +5% dentro do teto ≈ +1-2% de
XP por dia. **Ganho estimado: 1-3 dias em 180.** Sem sorteio pago em nenhum ponto.

## 7. Servidor (fps-30) e jogo
- **Servidor:** guilda, membros, cargos, convites, mural de pedidos, troca (com as travas e o registro), torneio (declaração, batalha autoritativa com o
  `js/sys` no Node, mapa), ranking, chefe (simulado), loja, doações, missões, check-in, moderação (nome/emblema/chat de guilda pelo filtro do chat),
  proteção a menores (sem mensagem privada; chat de guilda só com frases prontas para quem tiver menos de 16, como no chat global).
- **Jogo (fps-e2):** `Sys.guild` com provider trocável: bônus dos estandartes e dos territórios no `bonus()` (atributos no Sys.fc; ouro/drop/XP lidos pelos módulos
  da fps-30 como o VIP), dados para as telas. Sem servidor, a guilda fica fechada ("Em breve: abre com o online"), como o leilão.

## 8. Para aprovar
1. Criar com ouro (Nv 30), entrar Nv 30, 20→30 membros pelo nível da guilda, cargos e regras de saída.
2. Troca com as 7 travas da §2 (inclui 50% do ouro investido de volta ao doador).
3. Torneio: 28 territórios, temporada semanal, 15 escalados, rei da colina, bônus ouro/XP/drop com teto, baú semanal.
4. Ranking e prêmios (Prismático 3/2/1 por semana).
5. Extras: chefe, loja (Brasões), doações (com a de 💎 limitada a 1/dia), estandartes com teto +5%, missões, check-in.
