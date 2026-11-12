# Estado do pacote js/sys da fps-e2 (FC, práticas, títulos, torre, arena)
> **ATUALIZAÇÃO 2026-11-12: desenvolvimento liberado pelo PO (fps-98).** Implementados com a v5.1: fc, practice, titles, tower e os novos
> forge e pet. API, ligação na batalha e decisões de implementação: **reports/sys-e2-api.md**. O texto abaixo é o histórico da spec.
Congelado em 2026-11-12, por ordem do dono (aprovação com PO e design antes de desenvolver). Nada está ligado ao jogo:
index.html não carrega nenhum desses arquivos e nenhum evento da batalha os chama.

## O que ficou pronto (carrega no navegador e no Node; `node test/sys/e2.test.js` passa: 6 testes)
| Arquivo | Estado | O que faz |
|---|---|---|
| js/sys/fc.js | pronto | Soma `bonus(S)` de todos os `Sys.*` (inclui módulos futuros: VIP, montaria). FC = ATK·5·(1+crit·(2−1)) + HP·1/(1−def) + fc plana. `stats()` dá ATK/HP/crit/def finais; `breakdown()` diz quanto cada módulo soma; `advice()` monta o "Como ficar mais forte". Tem render. |
| js/sys/practice.js | pronto | Pedras e 5 trilhas: Força (+2% ATK/nível), Vitalidade (+2% HP), Crítico (+0,25 pt), Defesa (+0,3%), Coleta (+1,5% ouro). Custo ⌈4·1,06^nível⌉; teto 10 + 10·era liberada (era 6: 70). Pedras: 8% por abate comum, chefe 2+era, chefe de era 5+2·era, offline 6/h (até 8 h). `addStones()` para baú, instância e torre. Tem render (com "Máx"). |
| js/sys/titles.js | pronto | 23 títulos (fases, eras, chefes, abates, torre, arena, práticas, skins). Destaque vale x2. Tem render em grade 2 colunas, paginada. |
| js/sys/tower.js | pronto | Andar f com FC 150·1,12^(f−1); chefe a cada 5 andares (+30% de FC). Luta simulada com semente (`duel`). +0,2% ATK/HP por andar vencido. Prêmios: ouro, pedras, 💎 nos chefes, +20💎 nos marcos 10/25/50/100 e depois a cada 50. Tem render. |
| test/sys/e2.test.js | pronto | Cobre save antigo/lixo, soma da FC, módulo com erro, teto e custo da prática, desbloqueio e destaque dos títulos, determinismo, tentativas e virada de dia da torre. |
| js/sys/arena.js | **não começado** | Só a especificação abaixo. |

Pendências dos prontos: ainda não existe CSS (o bloco `/* == sys:fc … == */` no js/sys/sys.css da fps-30 não foi escrito) nem relatórios por
módulo (`reports/sys-<nome>.md`). Os renders nunca foram vistos no navegador.

## Decisões de design (aprovadas pela fps-c9; o dono precisa confirmar)
1. **Títulos de coleção de skins são cosméticos (bônus 0)** e aparecem como "Cosmético" na tela. Motivo: skins são compradas com 💎 e não
   podem virar atributo, nem por tabela. O bônus fica na tabela de dados (`DATA.titles[].bonus`, `cosmetic:true`): dá para mudar sem mexer na lógica.
2. **Torre com FC fixa por andar**, não escalada pela FC do jogador (senão ela nunca fica mais difícil e os marcos perdem o sentido).
   Fantasma com nome e skin sorteados por andar (com semente: o mesmo andar mostra sempre o mesmo adversário).
3. **Torre: só a derrota gasta tentativa** (5 por dia). Vencer não gasta, mas o avanço é limitado pela própria força.
4. **Bônus em pontos percentuais** em todos os módulos (combinado com a fps-30): `{atkPct:5}` = +5%. Necessário porque o poder do jogo
   cresce 6x por era (`power()`); bônus planos ficariam irrelevantes já na era 2.
5. **onKill vale para todo inimigo, chefe incluso** (igual ao loot.js). Não chamar outro evento para o chefe, senão ele conta duas vezes.
6. Interface opcional fora do contrato: `host.onChange()` depois de uma ação na tela (o jogo salva e redesenha) e `host.goTab(tab)` para
   os atalhos do "Como ficar mais forte". Precisa entrar no CONTRATO_SYS.md se for aprovado.

## Ajustes no papel após o plano do MVP e o fator 12 por era (2026-11-12; o código NÃO foi mudado, está congelado)
Base: docs/CONTRATO_V2.md e reports/regra-eras-skins-armas.md (fator 12 por era, aprovado como spec; regra no mesmo nível).
1. **Torre: crescimento por andar de 1,12 para 1,18** (= 12^(1/15), ~15 andares por era, como era com o fator 6). FC do andar:
   1 = 150 · 10 = 666 · 25 ≈ 8 mil · 50 ≈ 503 mil · 100 ≈ 2 bilhões. Com o fator 12, o jogador chega ao andar ~13 ao entrar na era 1
   e ao ~120 no fim do jogo (Lendária Nv 50 +15 na era 6, sem os bônus dos Sys). Marcos 10/25/50/100 e a skin do fantasma trocando
   de era a cada 15 andares continuam iguais. Mudança no código quando liberar: `DATA.fc.growth: 1.18` em js/sys/tower.js.
2. **FC:** nada muda (bônus em %). A montaria (dá poder, confirmado) entra como mais um módulo `Sys.mount` com `bonus(S)`, e o fc.js
   já soma sozinho. Correr mais rápido montado não entra na FC (é velocidade, não combate).
3. **Títulos de coleção, novas entradas propostas** (cond.type novos: `weapons` e `mounts`):
   | Título | Condição | Bônus | Motivo |
   |---|---|---|---|
   | Armeiro | ter armas (itens) de 7 eras | +2% ATK | item se conquista jogando (drop/invocação/instância) |
   | Arsenal Completo | ter as 28 armas do lançamento como item (contar por id; "todas" quando chegarem mais) | +5% ATK | idem |
   | Cavaleiro | ter 1 montaria | +2% HP | montaria dá poder (confirmado pelo dono) |
   | Senhor das Montarias | ter as 2 montarias do lançamento ("todas" quando chegarem mais) | +4% HP, +1 pt de crítico | idem |
   **Decidido pelo PO (fps-98):** os títulos de montaria TÊM bônus, com a condição de que a montaria nunca seja vendida por dinheiro sem
   decisão do dono. Se isso mudar, os dois viram `cosmetic:true` (só a tabela muda). Os títulos de montaria ficam parados até o VIP ser decidido.
   Os títulos de skin continuam cosméticos. **Totais do lançamento** (revisão do PO em docs/CONTRATO_V2.md: 28 armas, 10 roupas,
   5 cabelos, 5 olhos, 2 montarias; chapéus a confirmar). "Guarda-Roupa Lendário" pedia 70 skins, que o lançamento não tem.
   Títulos de visual, todos cosméticos e contados por id de peça (seguem o catálogo da fps-ff sem mexer na lógica; "todos" = todos os que existirem):
   | Título | Condição |
   |---|---|
   | Colecionador | 10 skins de arma ou roupa |
   | Estilista das Eras | 25 skins de arma ou roupa |
   | Guarda-Roupa Lendário | todas as skins de arma e roupa (hoje 28 + 10 = 38) |
   | Estilo Próprio | todos os cabelos (hoje 5) |
   | Olhar Marcante | todos os olhos (hoje 5) |
   | Chapeleiro | todos os chapéus (hoje 4; confirmado pelo PO) |
   Conferido com o PO: as 28 armas/skins de arma = 7 eras × 4 raridades, já SEM a Mítica (r3), que sai do lançamento e volta na atualização
   (sorteio de arma Mítica vira Épico). As 10 roupas não mudam: a armadura mantém as 5 raridades, mostradas pela cor da borda e da aura.
   Quando a Mítica voltar, os títulos "todas" passam a pedir 35 armas e 45 skins sozinhos, porque contam por id.
   **Pedido ao engenheiro (quando liberar):** a tabela de drop/invocação com peso 0 para r3 precisa continuar aceitando r3 em save antigo
   (item Mítico que o jogador já tenha), sem quebrar o `iname()` nem a contagem dos títulos.
   Pets voltaram ao lançamento (5 pets): os 4 títulos de coleção de pets dão atributo e estão em reports/spec-pet-fc.md, seção 5.
   **Decidido pelo PO (fps-98):** a coleção de armas conta só a arma conquistada como ITEM; a skin de arma não conta (é comprável).
   A skin de arma conta nos títulos de skin (cosméticos).

## Proposta da fps-e2 para a simulação 3 (práticas, títulos, torre). Hipóteses para o agente de balanceamento usar.
Contexto: o PO achou +140% de práticas demais e pediu teto; o nível de melhoria foi para o ESPAÇO (decisão do PO).

**Práticas: o teto de nível por era continua (10 + 10·era, um degrau por era); o que cai é o ganho por nível.**
| Trilha | Hoje no código | Proposta | Total na era 6 (Nv 70) |
|---|---|---|---|
| Força | +2% ATK | **+0,5% ATK** | +35% |
| Vitalidade | +2% HP | **+0,5% HP** | +35% |
| Crítico | +0,25 pt | **+0,1 pt** | +7 pts |
| Defesa | +0,3% | **+0,15%** | +10,5% |
| Coleta | +1,5% ouro | **+0,5% ouro** | +35% (ouro sobe o nível de melhoria, que é poder) |
Referência: +35% de ATK e HP fica perto da "montaria +20%" da tabela de sensibilidade do v2. Se ainda encurtar demais, o ajuste é só o
`per` de cada trilha (`DATA.tracks` em js/sys/practice.js); a teto por era deve ficar como está.

**Ritmo de pedras de prática.** Custo de um nível = ⌈4·1,06^nível⌉ (não muda). Pedras para levar as 5 trilhas ao teto de cada era:
| Era | Teto | Pedras deste degrau (5 trilhas) | Acumulado |
|---|---|---|---|
| 0 | 10 | 290 | 290 |
| 1 | 20 | 505 | 795 |
| 2 | 30 | 875 | 1.670 |
| 3 | 40 | 1.535 | 3.205 |
| 4 | 50 | 2.740 | 5.945 |
| 5 | 60 | 4.880 | 10.825 |
| 6 | 70 | 8.720 | 19.545 |
Alvo de desenho: o jogador grátis chega ao teto da era perto do FIM da era (~80% do tempo dela), não no começo, para a prática ser um
objetivo durante toda a era. Calibrar a chance por inimigo comum para isso, porque o 8% de hoje sobra (mesmo problema da forja).
Chefes (2+era; Senhor da Era 5+2·era) e offline (6/h) podem ficar como estão, ou também ser escalados pelo agente. Fontes externas
(baú, instância, torre) somam por `addStones`: se o agente as incluir, contar aqui.

**Títulos:** cortar cada bônus da tabela pela metade (o total, hoje ~+20% somando marcos, cai para ~+10%); o destaque x2 continua.
Montaria, a confirmar no simulador: +2%/+4% HP dos títulos de montaria já estão nessa conta.

**Torre: FC por âncoras (v5, docs/balance.json v5; substitui a v4, a simulação 3, o 150·1,12^andar e o 1,18).** O andar 15·(k+1)
tem a FC mediana do jogador grátis no fim da era k (medida quando o Senhor da Era cai, cenário de lançamento, com pet), com interpolação
geométrica entre âncoras:
| Andar | 1 | 15 | 30 | 45 | 60 | 75 | 90 | 105 |
|---|---|---|---|---|---|---|---|---|
| FC | 150 | 1,56 mil | 62,3 mil | 2,31 mi | 50,7 mi | 1,14 bi | 20,3 bi | 428 bi |
| Fim da era | (início) | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
| Crescimento por andar no trecho | | 1,182 | 1,279 | 1,272 | 1,229 | 1,231 | 1,212 | 1,225 |
(Anteriores, substituídas. v4: 1,71 mil / 66,0 mil / 2,18 mi / 50,8 mi / 1,14 bi / 20,1 bi / 427 bi. Simulação 3: 1,88 mil / 96,4 mil /
2,62 mi / 53,8 mi / 1,20 bi / 21,6 bi / 435 bi. Nenhuma das mudanças v4→v5 passou de 10%; atualizado só para a spec bater com o balance.json vigente.)
- Depois do andar 105: continua com o crescimento do último trecho (1,225 por andar). Os chefes a cada 5 andares mantêm +30% sobre a âncora.
- Leitura: o jogador mediano, no fim da era k, enfrenta o andar 15·(k+1) como "Equilibrado" (FC igual, metade no ataque e metade na vida
  dos dois lados, e o jogador bate primeiro). Quem está acima da mediana sobe mais; ninguém pula a progressão.
- O bônus da torre (+0,2% de ATK/HP por andar, +21% no andar 105) e a hipótese de 1,5 andar por fase vencida já estão na simulação 3.
- Mudança no código quando liberar: em js/sys/tower.js, trocar `DATA.fc = {base, growth}` por `DATA.anchors = [[1,150],[15,1880],...,[105,435e9]]`
  e `floorFC(f)` por interpolação geométrica entre âncoras. Se a recalibração final do agente mudar as FCs, só a lista muda.
- Os marcos 10/25/50/100 e os ovos de pet continuam; a skin do fantasma muda de era a cada 15 andares e agora bate com as âncoras.

**Práticas: APROVADAS pelo PO** com os valores da tabela acima (0,5% / 0,5% / 0,1 pt / 0,15% / 0,5%, teto de 10 níveis por era).
**Drop de pedra de prática: fica em 8% por inimigo comum** (decisão do PO, pela simulação 3). Com 8%, o grátis chega ao teto em 75-81% do tempo
das eras 3 a 5 e fecha a era 6 no nível 69 de 70; a minha sugestão de 2% terminava no nível 61 e levava o jogo a 69 dias. Retiro os 2%.
Mudança no código quando liberar: em js/sys/practice.js, só `DATA.tracks[].per` (2→0,5; 2→0,5; 0,25→0,1; 0,3→0,15; 1,5→0,5); o drop já é 8%.
Nível máximo de melhoria passa a 60 (PO): não afeta estes módulos (a FC lê `host.atk()/hp()`).

**Torre: ovos de pet (no lançamento: o PO reverteu o adiamento dos pets; combinado com a fps-30, spec dela seção 5):** 1 ovo a cada 10 andares vencidos: andares 10-40 Raro ou melhor,
50-90 Épico ou melhor, **Lendário garantido no andar 100** (fênix), junto com o marco de 💎 e o título "Imortal". Como cada andar só se
vence uma vez, cada ovo sai uma única vez, sem farm. Pela âncora (andar 15·(k+1) = fim da era k), o andar 100 cai no meio da era 6, a mais
longa (~16,5 h de jogo ativo): o Lendário ainda serve por ~12 dias de jogo. Se o PO quiser o Lendário mais cedo, a alternativa é o andar 90
(fim da era 5). Ovos repetidos viram fragmentos (estrelas), pela regra de pets da fps-30.
Medido na v4: a fênix chega pelo andar 100 no dia ~41 (mínimo 34) de ~62, em 1★, e é equipada na hora. Isso está certo pela FC:
fênix 1★ tem p = 0,25 × 0,80 = 0,200, acima do golem com as 2,4★ médias (0,185). Só o golem 5★ (0,2125) passa a fênix 1★; com 2★ a fênix
empata com ele (0,25 × 0,85 = 0,2125) e com 3★ passa (0,225). **Decidido pelo PO (após a v4):** fênix GARANTIDA no andar 100 (não 90). Depois dele, **1 fragmento de fênix a cada 10 andares**
(110, 120, 130...). Como cada andar só se vence uma vez, cada fragmento também sai uma vez só. Versão final do PO (substituiu a "Essência de Pet"):
repetido em 5★ vira ovo da raridade acima (até o Mítico); a fênix é exclusiva (andar 100, evento, 1% do Chefe de Era Difícil) e os
fragmentos dela saem da torre depois do 100. Meta do PO: o grátis termina com a fênix entre 3 e 4★ e o golem perto de 4★.
**A torre não tem teto (andares infinitos), mas na prática a meta não fecha.** Pelas âncoras v4, a FC mediana do FIM do jogo (427 bi) é
exatamente a do andar 105. Força pedida por andar:
| Andar | 100 | 105 | 110 | 120 | 130 |
|---|---|---|---|---|---|
| FC do andar | 154 bi | 427 bi | 1,18 tri | 9,07 tri | 69,6 tri |
| × FC mediana do fim do jogo | 0,36 | 1,00 | 2,77 | 21 | 163 |
Com 1 fragmento a cada 10 andares, o grátis mediano termina com **0 fragmentos** da torre (o 110 pede 2,8x a força dele), e mesmo um
jogador bem acima da mediana tira 1. A fênix fica em 1★. Opções levadas ao PO: (a) 1 fragmento por andar de 101 a 110 (o mediano tira
~5 até o fim, o melhor jogador 10), depois a cada 10; (b) fragmento a cada 5 andares a partir do 100 E nos andares 95-99 já liberados
depois da fênix; (c) achatar a curva acima do 100 (crescimento 1,10 por andar) para a torre continuar subindo no pós-jogo. Recomendação:
(a), porque não mexe na curva e já fica limitado pela força.
**Conta das estrelas (dados da fps-30):** cada estrela de pet custa 10/20/30/40 fragmentos (3★ = 30 acumulados, 4★ = 60). Chefe de Era Difícil
dá ~1 fragmento de fênix esperado, em bloco (8-15% de chance de 10), e não conta. Evento: nenhum definido (0). Novo (PO): o golem repetido
deixa escolher entre +10 fragmentos de golem e +N de fênix.
**As duas metas juntas não cabem no golem da v4.** Na v4, o golem terminou em 2,4★ = 18 fragmentos = **~1,8 ovos repetidos**. As metas pedem:
| Meta | Fragmentos | Ovos de golem repetidos |
|---|---|---|
| golem perto de 4★ | 60 de golem | 6 |
| fênix 3★ (torre (a) dá ~5) | 25 de fênix | 25/N |
| fênix 4★ | 55 de fênix | 55/N |
**FECHADO pelo PO (docs/CONTRATO_V2.md), substitui o que vem abaixo:** metas revisadas para golem ~3★ e fênix 2-2,5★ (4★ do golem
virou longo prazo); N = 5 fragmentos de fênix por golem repetido (a subida Épico→Mítico continua). **Torre: 1 fragmento de fênix por andar
do 101 ao 110**, depois 1 a cada 10 (a opção (a) da fps-e2). Fragmentos de fênix ganhos ANTES do andar 100 ficam guardados e entram quando
ela nasce (tela do pet: "Fênix: X fragmentos guardados, nasce no andar 100 da torre"). O Chefe de Era Difícil levando a fênix a ~4,9★ é
prêmio aceito. O agente confere as estrelas finais com N = 5.
Casos de borda para o engenheiro e o QA (quando liberar):
1. **Fênix nascida antes do andar 100** (1% do Chefe Difícil): o ovo do andar 100 vira repetido = 10 fragmentos (regra da fps-30),
   e os guardados entram na hora em que ela nasce, seja qual for a fonte. A frase da tela muda para "nasce no andar 100" só enquanto ela não existe.
2. **Nascer com fragmentos guardados ≥ 10:** ela já nasce com as estrelas que eles pagam (ex.: 12 guardados = 2★ com 2 sobrando),
   em vez de nascer em 1★ e o jogador ter de "aplicar" depois.
3. Os fragmentos dos andares 101-110 só existem para quem já passou do 100, então não caem na regra de "guardados".

**v5.1 aceita pelo PO (tema fechado):** golem 3,0★ e fênix 2,6★, fim no dia ~61 (política "fênix depois do golem 3★").
Para o fc.js (`advice`, quando liberar): na escolha do golem repetido, sugerir "fragmentos de fênix" assim que a fênix existir e estiver
equipada, porque só 1 pet fica equipado e, a partir daí, a estrela do golem não soma FC (fênix 1★ p = 0,200 > golem 3★ p = 0,191).
Antes de a fênix nascer, sugerir o golem (os fragmentos de fênix ficariam guardados sem render FC). É o que a política aceita já faz.

**Resultado da v5:** o grátis recebe ~10 ovos de golem, e termina com o golem em 3★ e a fênix em 3,4★. A meta da fênix (3-4★) fechou.
**A do golem ficou 1 estrela abaixo** ("perto de 4★" pedia ~60 fragmentos; 3★ = 30). Cabe ao PO aceitar 3★ ou ajustar o N. Na v5, as duas
opções da torre (0 ou ~5 fragmentos) não mudam as estrelas da fênix, porque o golem dá de 10 em 10; o PO escolhe pela sensação de progresso.
(Conta original, antes da v5:) Com N = 10, seriam 8,5 a 11,5 ovos de golem, ou seja, **5 a 6x o que a v4 entrega**. Ou o ovo de golem fica bem mais frequente (o Mítico tem 5%
no ovo do chefe de fase), ou a meta do golem sai, ou o N passa de 10. Isso fica para o agente calibrar na v5, ciente de que as duas metas disputam os mesmos ovos.

**FC e nível no espaço:** js/sys/fc.js não muda; ele lê `host.atk()/hp()`, que vêm do `heroStats()` com `S.lvl[slot]`.

## Regra do dono para prévias
"Tudo que for estático, eu não vou aprovar": qualquer tela destes sistemas que for ao dono tem de estar em movimento (FC subindo,
barra de prática enchendo, título desbloqueando, luta da torre). As animações são da fps-ff (tabela de sons/animações acima).

## O que o engenheiro teria de ligar (quando for liberado)
- Carregar js/sys/*.js depois do estado `S`; criar `Sys.host` real (atk/hp do `heroStats()`, `goldUnit` = ouro do abate na fase).
- Batalha: usar `Sys.fc.stats(S,host)` no lugar de `heroStats()` (ATK, HP, crit, def), aplicar `goldMult` ao ouro e mostrar `Sys.fc.hud()` no topo.
- Eventos: `Sys.practice.onKill` e `Sys.titles.onKill` a cada abate; `Sys.titles.onWaveClear` ao limpar onda; `Sys.practice.onOffline` no ganho offline.
- Abas/painéis para practice, titles, tower e "Como ficar mais forte" (cada um com `render(el,S,host)`).

## Sons e animações dos módulos (nomes da fps-ff, dona de animação e som)
Os módulos não tocam nada; o jogo dispara `window.GameAudio?.sfx(nome, opts)` com o resultado de cada chamada. As animações são da fps-ff
e só saem depois que o PO liberar. Tabela fechada com a fps-ff em 2026-11-12.
| Nome | Quando disparar | De onde vem |
|---|---|---|
| title_unlock | 1 vez por chamada de `Sys.titles.check()` que devolva títulos novos (mesmo se forem vários) | `check(S,host).length>0` |
| title_equip | troca do título em destaque pela tela | `setFeatured()` devolveu true |
| practice_up | prática subiu; `{levels:r.n}` quando o "Máx" sobe vários níveis | `train()` → `r.ok`, `r.n` |
| tower_boss | ao desafiar um andar de chefe, ANTES do resultado | `Sys.tower.isBoss(nextFloor(S))` |
| tower_win / tower_lose | resultado da luta | `fight()` → `r.win` |
| tower_milestone | depois do tower_win, em andar de marco (10/25/50/100 e depois a cada 50) | `isMilestone(r.floor)` |
| fc_up | a FC do topo subiu por ação do jogador (treino, título, equipamento, andar). Não tocar a cada abate: comparar a FC antes e depois da ação. | `Sys.fc.compute()` antes/depois |

## Especificação da arena (sem código; para o PO avaliar)
- **Formato:** luta automática e assíncrona contra o "fantasma" de outro jogador (snapshot de ATK/HP/crit/def + skin), com o mesmo `duel` da torre.
- **Tentativas:** 5 por dia (vitória ou derrota gastam). 3 adversários por vez; "trocar adversários" grátis 1x por dia.
- **Pontos:** todos começam a semana com 1000. Vitória +20·k e derrota −10·k, com k = clamp(FC do adversário / FC do jogador, 0,5, 2)
  (vencer quem é mais forte vale mais). Nunca abaixo de 0.
- **Semana:** começa na segunda 00:00 (hora local no protótipo; no backend, um fuso fixo para todos). Na virada, guarda a posição final,
  entrega o prêmio e zera os pontos.
- **Prêmios por posição:** 1º item Lendário (r4) da era liberada; 2º-3º item Mítico (r3); 4º-10º 💎 e pedras de prática; 11º-50º 💎;
  o resto, pedras. Os títulos usam a melhor posição final (top 10, top 3, 1º).
- **Ranking no protótipo:** ~50 bots locais gerados no início da semana em volta da FC do jogador (±40%), com nomes/skins sorteados por
  semente da semana. Os pontos deles sobem com o tempo decorrido da semana, de forma determinística.
- **Interface trocável (provider):** `listOpponents(n)`, `reportResult(oppId, win)`, `getRanking()`, `weekInfo()`. Hoje local; depois, backend.
- **Dependência de backend (para valer de verdade):** snapshot e ranking de jogadores reais, virada semanal no servidor, validação do
  resultado (a luta precisa ser simulada no servidor com a mesma semente, senão dá para trapacear editando o save) e entrega de prêmios.
- **Riscos:** (a) bots locais deixam o 1º lugar fácil demais (o prêmio Lendário vira farm). No protótipo, sugiro prêmio menor ou bots mais
  fortes no topo. (b) Arena com dinheiro real/VIP dando poder (decisão pendente) tende a concentrar o topo em quem paga; avaliar faixas por FC.
  (c) O relógio local permite adiantar a semana mudando a hora do aparelho; só o backend resolve isso.
