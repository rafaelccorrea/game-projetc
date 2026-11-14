# Temas novos de evento (para o dono escolher)

Feito pela Sistemas em 14/11/2026, a pedido do PO. Hoje só existe o tema **Festival das Eras** (`festival_eras`), então o calendário
(docs/CALENDARIO_EVENTOS.md) repete o Festival 7 vezes. Abaixo, três temas prontos para sair para o Engenheiro assim que o dono escolher.
Pode escolher um, dois ou os três.

## Regras que valem para os três (iguais ao Festival)

- **Formato:** 14 dias + 2 dias de carência só para a loja e para resgatar missão completa. Mesmo motor do Festival: `Sys.events`
  (missões e loja), `Sys.evtrail` (trilha por pontos e chefe do evento) e `Sys.eventRank` (ranking). Abre no Nv 24 (`unlock.events`).
- **Pontos:** 5 missões de uma vez (180 pontos no total) + pontos repetíveis com teto de 200. Total igual ao do Festival, para a trilha e a loja
  terem o mesmo ritmo.
- **Ouro escasso:** o ouro de cada tema é **o mesmo do Festival**, sem nada a mais. Na loja, "Saco de ouro" `goldk 50`, até 10 compras;
  na trilha, os marcos de ouro já aprovados (48/72/96/120 × ouro de um abate; docs/ECONOMIA_OURO.md §6). Trocar o tema não muda a
  conta do ouro.
- **Sem sorteio, sem pagamento:** nenhuma missão pede invocação (`summon`, que pode usar diamante). Nenhum prêmio é ovo, baú ou
  qualquer coisa sorteada. A loja só aceita pontos do evento. Nenhum tema dá ou cobra diamante, e por isso nada que veio de diamante
  comprado passa para outro jogador.
- **Prismático:** os 100 fragmentos por evento (Revisão 5) continuam em todos os temas: 5 missões × 10 + loja 5 × 10, só com
  `pet.v3/v4` ligados.
- **Skins de evento:** são só visuais, usam o corpo padrão e os mesmos movimentos e armas do herói (regra das skins). Precisam da Arte e
  do voto do dono. Enquanto a skin não existir no jogo, o item fica **escondido** na loja. Para isso, a loja ganha o campo `needs:'skin'`
  (aparece só se `Sys.skin` tiver a skin), igual ao `needs:'prism'` de hoje. Quem já tem a skin não compra de novo.
- **Sem texto livre e nada sensual:** os temas só usam frases prontas e arte no padrão do jogo.

## 1. Caçada aos Chefes (`cacada_chefes`)

**O que o jogador faz:** vence chefes em todo lugar (campanha, Torre, instâncias e o chefe do evento).
Moeda: **Troféus da Caçada**.

| Missão (uma vez) | Conta | Meta | Pontos | Prismático |
|---|---|---|---|---|
| Derrote 40 chefes | `boss` | 40 | 40 | 10 |
| Vença 20 andares da Torre | `tower` (novo) | 20 | 40 | 10 |
| Ataque o chefe do evento 10 vezes | `evboss` (novo) | 10 | 40 | 10 |
| Vença 15 instâncias | `instance` (ver "Defeito achado") | 15 | 30 | 10 |
| Use a ultimate 40 vezes | `ult` | 40 | 30 | 10 |

- **Repetível:** a cada 5 chefes, 5 pontos (teto de 200).
- **Loja:**

  | Item | Custo | Limite |
  |---|---|---|
  | Skin de arma "Lâmina do Caçador" | 150 | 1 |
  | Moldura "Caçador" | 100 | 1 |
  | Anel Épico da era atual | 120 | 1 |
  | 5 Essências | 40 | 5 |
  | 20 Pedras de Forja | 30 | 5 |
  | 20 Rações | 25 | 5 |
  | Saco de ouro | 20 | 10 |
  | 10 fragmentos do Prismático | 20 | 5 |

- **Chefe do evento:** "Rei da Caçada", com a arte de um chefe já pronto (a Arte escolhe). Mesmas faixas de pontos, 2 ataques por dia
  e bônus ao derrubar de 60 → 80.

## 2. Semana da Forja (`semana_forja`)

**O que o jogador faz:** forja e melhora equipamento. O ouro que ele gasta é o que já tem; o evento não cria ouro a mais.
Moeda: **Martelos da Forja**.

| Missão (uma vez) | Conta | Meta | Pontos | Prismático |
|---|---|---|---|---|
| Forje 30 vezes | `forge` | 30 | 40 | 10 |
| Melhore equipamentos 60 vezes | `upgrade` | 60 | 40 | 10 |
| Abra 20 baús | `chest` | 20 | 30 | 10 |
| Derrote 20 chefes | `boss` | 20 | 40 | 10 |
| Derrote 2.000 inimigos | `kill` | 2000 | 30 | 10 |

- **Repetível:** a cada 10 melhorias, 5 pontos (teto de 200).
- **Loja:** a Forja pesa mais aqui, e o ouro fica igual ao do Festival.

  | Item | Custo | Limite |
  |---|---|---|
  | Skin de arma "Martelo das Eras" | 150 | 1 |
  | Skin de roupa "Avental do Ferreiro" | 150 | 1 |
  | Luvas Épicas da era atual | 120 | 1 |
  | 20 Pedras de Forja | 25 | **8** |
  | 5 Essências | 40 | 5 |
  | Saco de ouro | 20 | 10 |
  | 10 fragmentos do Prismático | 20 | 5 |

- **Chefe do evento:** "Colosso da Bigorna". Faixas e prêmios iguais aos do Festival.

## 3. Festa dos Pets (`festa_pets`)

**O que o jogador faz:** cuida do pet (alimentar, subir de nível) e luta com ele. Os pets abrem no Nv 20 e os eventos no 24, então todo
mundo que vê o evento já tem pet. Moeda: **Laços da Festa**.

| Missão (uma vez) | Conta | Meta | Pontos | Prismático |
|---|---|---|---|---|
| Alimente o pet 100 vezes | `petfeed` (novo) | 100 | 40 | 10 |
| Suba o pet 10 níveis | `petlevel` (novo) | 10 | 40 | 10 |
| Derrote 2.000 inimigos | `kill` | 2000 | 30 | 10 |
| Derrote 30 chefes | `boss` | 30 | 40 | 10 |
| Abra 20 baús | `chest` | 20 | 30 | 10 |

- **Repetível:** a cada 20 alimentações, 5 pontos (teto de 200).
- **Loja:** sem ovo (ovo é sorteio de qual pet nasce). Os fragmentos são sempre do Prismático, que é fixo.

  | Item | Custo | Limite |
  |---|---|---|
  | Moldura "Festa dos Pets" | 100 | 1 |
  | 20 Rações | 20 | **8** |
  | 5 Essências | 40 | 5 |
  | 20 Pedras de Forja | 30 | 5 |
  | Saco de ouro | 20 | 10 |
  | 10 fragmentos do Prismático | 20 | 5 |

  Os fragmentos ficam no total de 100 por evento, como nos outros temas: 5 missões × 10 + loja 5 × 10.
- **Chefe do evento:** "Fera Ancestral". Faixas iguais às do Festival.

## Como entra no calendário do Festival das Eras

O rodízio alterna o Festival com um tema novo. As ocorrências **#2, #4 e #6** do calendário passam ao tema escolhido; as #1, #3, #5 e #7
continuam Festival. Só o prefixo do id muda, e as datas ficam iguais:

| # | Hoje | Um tema escolhido (ex.: Caçada) | Três temas escolhidos |
|---|---|---|---|
| 2 | `festival_eras_261204` | `cacada_chefes_261204` | `cacada_chefes_261204` |
| 4 | `festival_eras_270101` | `cacada_chefes_270101` | `semana_forja_270101` |
| 6 | `festival_eras_270129` | `cacada_chefes_270129` | `festa_pets_270129` |

- `minClientVersion` dessas linhas = a versão do jogo que trouxer os temas. Versão antiga não conhece o prefixo, então ignora a
  ocorrência e não mostra nada (já é a regra de hoje). Por isso a primeira ocorrência de tema novo deve cair **depois** da
  atualização na loja.
- Ranking: `GET /events/:id/rank` e a moldura `evt_<id>_top1` já são por id, então nada muda.

## O que muda no código e no servidor

| Quem | O quê | Tamanho |
|---|---|---|
| Sistemas | `js/sys/events.js`: os 3 temas em `THEMES`; contadores novos `tower`, `evboss`, `petfeed`, `petlevel` em `EVENTS`; `needs:'skin'` na loja | pequeno |
| Sistemas | `js/sys/evtrail.js`: `DATA.events.<tema>` (nome e arte do chefe, moldura do grande prêmio) | pequeno |
| Sistemas | Os módulos contam sozinhos, sem o Engenheiro ligar nada: `pet.js` conta `petfeed` (feed/feedTap) e `petlevel`; `tower.js` conta `tower` no andar vencido; `evtrail.js` conta `evboss` no ataque | pequeno |
| Sistemas | Testes: `events-ocorrencia.test` com os 3 prefixos; teste dos contadores novos | pequeno |
| Engenheiro | `ptrack('instance')` na vitória de instância (`instfx.js`) e na varredura (`p_inst.js`). **Hoje não existe, e o Festival depende disso** (ver abaixo) | pequeno |
| Engenheiro | Tela de Eventos: visual por `ev.base` (fundo, ícone e cor do tema) e nome dos pontos por `ev.points` (já vem do módulo) | médio |
| Arte | Por tema: fundo da tela, ícone do tema, ícone dos pontos e moldura. Skins (Lâmina do Caçador, Martelo das Eras, Avental do Ferreiro) passam pelo fluxo de arte e pelo voto do dono | por tema |
| Servidor | Seed do calendário: trocar o id das linhas #2, #4 e #6 e preencher `minClientVersion`. Atualizar a cópia fixa do game-sys (`events.js` + `evtrail.js`), senão o `loadEvtrailEarned` dá 0 pontos nos temas novos. Conferir se alguma validação do servidor aceita só o prefixo `festival_eras` | pequeno |

## Defeito achado agora (vale também para o Festival de hoje): CORRIGIDO pelo Engenheiro em 9c8de08 (falta o QA ver a missão andar no jogo)

O contador `instance` não é chamado em lugar nenhum: `ptrack` hoje conta kill, boss, ult, chest, forge, upgrade, summon e login.
Por isso a missão do Festival **"Vença 15 instâncias" nunca completa**. Correção do Engenheiro: `ptrack('instance')` quando a
instância é vencida e uma vez por varredura. Enquanto não entrar, a Caçada aos Chefes também fica com uma missão sem saída.
