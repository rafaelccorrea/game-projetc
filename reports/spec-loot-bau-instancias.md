# Especificação para avaliação do PO: Loot em campo, Baú de toque e Instâncias diárias
Autor: fps-30 · 2026-11-12 · Status: **EM AVALIAÇÃO (desenvolvimento congelado pelo dono)**. Nada disto está ligado ao jogo.
Origem: reports/qa_proposta_vip_baus_instancias.md (seções 2, 3 e 4) e docs/CONTRATO_V2.md (fila, itens 2 e 3).

> Já existe um rascunho técnico, escrito antes do congelamento e não carregado pelo jogo: js/sys/loot.js, chest.js, instances.js e
> sys.css, com testes em test/sys/ (34 testes passando). Ele serve como prova de que as regras abaixo fecham. Se o PO reprovar,
> pode ser apagado sem efeito no jogo. Se aprovar com mudanças, os números ficam em tabelas no topo de cada arquivo.

---

## 1. Loot em campo (moedas, gemas e itens caindo dos inimigos)

**Objetivo do jogador:** ver a recompensa saindo de cada abate da horda (sensação de "chuva de loot"), sem poluir a tela.

**Regras**
- Todo inimigo morto solta moedas; às vezes gema; às vezes um item. Os pickups pulam do corpo e **voam sozinhos para o HUD**;
  tocar coleta na hora. O ganho é creditado **no abate** (fechar o app no meio não perde nada); o voo é só visual.
- Ganhos seguidos do mesmo tipo se juntam num rótulo único "+N 🪙" (janela de 0,6 s) para não poluir a horda.
- Item dropado aparece brilhando na cor da raridade; Épico ou acima maior e com brilho forte.

**Tabela por tipo de inimigo** (o ouro-base é o da batalha V2: comum = 0,32 × base da fase, chefe = 5 × base)
| Inimigo | Moedas (visual) | Gema | Item | Raridade mínima |
|---|---|---|---|---|
| Comum (horda) | ouro da batalha ±10%, 1-3 moedas | 1,5% de chance de 1 💎 | 3,5% | — |
| Chefe de fase | ouro da batalha, 5-7 moedas | — (a fase já dá 10 💎) | 100% | Raro, com 25% de chance de +1 nível |
| Senhor da Era | ouro x2, 8-10 moedas | 3-5 💎 | 100% | Épico, com 25% de chance de +1 nível |

**Raridade do item** (mesma tabela de drop do jogo, levemente melhor em eras altas)
| | Básico | Raro | Épico | Mítico | Lendário |
|---|---|---|---|---|---|
| Peso base | 70 | 22 | 6 | 1,6 | 0,4 |
| Reforço por era liberada | — | +5% | +8% | +10% | +12% |
Era do item: a era liberada mais alta (70%) ou a anterior (30%), igual ao jogo atual. "Mítica" (r5, VIP) **nunca** cai.

**PORTÕES DE RARIDADE pelo nível do jogador (1-100) e pela era** (regra do dono via PO, 2026-11-12; implementado em js/sys/loot.js):
Básico sempre · Raro nível 10+ · Épico nível 25+ · Mítico nível 70+ e era 4+ · Lendário nível 85+ e era 5+. Abaixo do portão o sorteio vira
a maior raridade permitida. Vale para drop, baú, invocação, loja e instâncias (inclusive os 10% de Lendária do Chefe de Era Difícil) e para
ovos de pet de Mítico/Lendário. Exceção: a fênix do andar 100 da torre (marco). A curva de XP sai da simulação v6 (fps-c9); os portões são parâmetros.

**Lançamento: 28 armas, sem a Mítica (r3) de cada era** (decisão do PO, 2026-11-12; a Mítica entra numa atualização). Regra para as ARMAS
(as armaduras continuam com as 5 raridades):
- Todo sorteio de arma que daria **Mítico vira Épico** (rebaixa, não sobe). Assim a Lendária continua rara: subir o Mítico para Lendário
  multiplicaria as Lendárias por ~5.
- Vale para todas as fontes: drop da horda, chefe (inclusive o "+1 nível" de sorte: de Épico não sobe para Mítico, fica Épico), baú, instâncias
  ("Mítico+" no Chefe de Era Difícil vira "Épico+, com a chance de +1 indo direto para Lendário") e invocação.
- Pesos efetivos de arma no lançamento: Básico 70 · Raro 22 · Épico 7,6 · Lendário 0,4.
- Skin de arma Mítica: fora do lançamento (sai de invocação, loja e drop). **Confirmado pelo PO**; volta com as 7 armas Míticas na atualização.
- Armadura: mantém as 5 raridades, mas só há 10 roupas; a raridade da armadura aparece pela cor da borda e da aura, não por roupa nova (PO).
- Quando a Mítica entrar, basta voltar a tabela original; nenhum save muda (o item guarda só a raridade).

**Impacto do plano de conteúdo (35 armas, decisão do dono via PO, 2026-11-12), só no papel:**
- **DECIDIDO pelo PO: leitura A.** O tipo de arma pode mudar dentro da era (ex.: Medieval Básica = espada curta, Rara = machado,
  Épica = lança, Mítica = espada larga, Lendária = lâmina do dragão), cada um com rastro e som próprios. Ultimates: **7 no MVP, 1 por era** (decisão do dono para caber no saldo). As 2 por era por faixa de raridade (versão superior para
  Mítica/Lendária) ficam para DEPOIS do lançamento; até lá, a raridade só muda a cor do efeito da ult. A leitura B fica descartada.
- **Leitura A: 35 = 7 eras × 5 raridades**, um modelo de arma por (era, raridade). É o mesmo formato que o jogo já tem nos nomes
  de arma (`ERAS[e].w[r]`, ex.: Graveto Afiado → Presa de Mamute) e nas 35 skins de arma. Os **pesos de drop não mudam**: o sorteio já devolve
  `{slot, r, e}`, e isso passa a identificar o modelo. Muda só a imagem: chave `era{E}_r{R}` no lugar de `era{E}_t{tier}` (hoje 21 imagens, 3 tiers por era).
- **Leitura B: 5 modelos por era, independentes da raridade.** O drop ganha um campo `modelo` (sorteio uniforme 0-4 entre os modelos da era),
  a raridade continua dando a força e a cor do brilho, e o save do item precisa guardar o modelo.
- Nas duas leituras: a regra "era > raridade no mesmo nível" continua valendo, e a skin de arma padrão da era é liberada ao conquistar a 1ª arma daquela era.
  As instâncias e o baú não mudam (sorteiam pela mesma função).
- Ultimates (7 no MVP): não mudam nada no loot.

**Offline:** o ouro offline já existe (js/meta.js). Proposta: os itens offline à taxa de 10% do drop normal (8 h fora ≈ 10 itens,
teto de 20). Na taxa cheia seriam ~50 itens, o que lotaria a mochila de 60. Os abates offline também enchem o baú.

**Estados salvos:** só estatísticas (abates, ouro, gemas, itens por raridade). Nada que trave o jogo se faltar.

**Dependências:** batalha V2 (horda) do engenheiro: um aviso por inimigo morto e a animação dos pickups até o HUD.
**Riscos:** (a) tela poluída na horda (o PO limitou a 3 inimigos visíveis em posições fixas, o que ajuda; o agrupamento "+N" e o teto de 10 moedas por abate também);
(b) performance em celular fraco com muitos pickups ao mesmo tempo (limitar partículas); (c) mochila cheia: hoje o jogo vende
automaticamente o excedente, e o PO deve decidir se isso continua ou se o loot fica esperando espaço.

---

## 2. Baú de toque

**Objetivo do jogador:** uma recompensa "de bônus" a cada tanto de abates, aberta com um toque, com animação.

**Regras**
- Barra do baú no canto da batalha (anel em volta do ícone). Enche por abate: comum = 1, chefe = 5, Senhor da Era = 10.
- ~~40 pontos = 1 baú~~ → **250 pontos = 1 baú** (decisão final, abaixo). Cheio: o baú pulsa e mostra o contador.
- Acumula **até 3** baús. Com 3 guardados, a barra para em 100% e vira baú assim que o jogador abrir um (não perde abate).
- **DECISÃO FINAL do PO (após a simulação 3, que mostrou ~50 baús/dia no jogo longo): 1 baú a cada 250 pontos de abate e TETO DIÁRIO de 8 baús.**
  Depois do 8º, a barra para de encher e mostra "volte amanhã"; renova à meia-noite local. O teto é parâmetro para o VIP, quando for decidido.
  (Substitui o "40 abates" acima e um recado intermediário de "teto 12, mantendo 40" que cruzou com este.)
- Toque abre: animação curta, 3-5 itens revelados em sequência, mais moedas; botão "Coletar" e "Abrir outro (N)" se houver mais.

**Conteúdo de um baú**
| Recompensa | Valor |
|---|---|
| Itens | 3 a 5 (tabela da era acima, com reforço de +50% nos pesos de Raro para cima: ~40% dos itens Raro+, contra 30% no drop comum) |
| Moedas | 15 a 30 × ouro de um abate comum da fase atual |
| Gemas | 25% de chance de 2-5 💎 |
| Pedras de prática | 50% de chance de 1-2 (só se "Práticas" for aprovado) |

**Ajustes prontos para o VIP (se aprovado):** velocidade de enchimento, itens por baú, reforço de raridade, moedas e baús guardados
a mais. Por padrão, todos neutros.
**Estados salvos:** carga atual, baús guardados (0-3), total aberto, dia (AAAA-MM-DD) e baús ganhos hoje (teto 8).
**Tela:** botão redondo de 64 px (área de toque ≥ 44 px) no canto da batalha; a janela de abertura cabe em 390×690 sem scroll
(até 5 itens numa linha).
**Dependências:** loot (tabela de raridade), batalha (aviso de abate), ícone assets/ui/chest.png (já existe), som "claim" (contrato de áudio).
**Legal (ECA Digital, ver docs/PARA_O_PO.md item 3):** este baú é ganho só jogando (abates), nunca comprado. Não pode virar
"baú pago" nem ser vendido por diamante comprado com dinheiro sem passar pelo jurídico.
**Riscos:** (a) inflação de itens (resolvida em parte pelo teto de 8 baús/dia: até ~32 itens/dia), então o PO deve ver junto com a mochila de 60
e o "Vender Básicos"; (b) o botão compete por espaço com os botões de s2/s3 (polegar direito): sugiro o baú à esquerda ou no topo.

---

## 3. Instâncias diárias (dungeons por chave)

**Objetivo do jogador:** um objetivo diário curto (até 1 min cada) com recompensa focada (ouro, equipamento, chefe, diamantes).

**Regras**
- ~~3 chaves por dia~~ → **2 entradas POR ÁREA por dia (8 no total), +1 por área com VIP** (dono via PO). Renovam à meia-noite (horário do celular) e **não acumulam**.
- A chave só é gasta na **vitória**: derrota ou tempo esgotado devolve a entrada (configurável).
- Dificuldade: **3 por era liberada** (Fácil, Normal, Difícil, usando os inimigos da fase 3, 6 e 9 daquela era).
  O jogo sugere a mais alta que o jogador já alcançou.
- **Varrer:** num nível já vencido, gastar 1 chave e receber na hora, sem lutar. Na Mina de Ouro, vale o recorde de abates.
- Entrada aberta e abandonada (app fechado) expira em 15 min sem gastar chave.

**Tipos**
| Instância | Desafio | Tempo | Recompensa (Fácil; Normal ×1,6; Difícil ×2,5) |
|---|---|---|---|
| 🪙 Mina de Ouro | horda sem fim (inimigos mais fracos: 60% de vida), vale quantos abates fizer | 45 s | 4 × ouro de um abate por inimigo morto |
| ⚔️ Arsenal | 3 ondas + chefe | 60 s | 3 itens Raro+ (Difícil: Épico+) + 20 × ouro de um abate |
| 👑 Chefe de Era | Senhor da Era sozinho | 45 s | 1 item Épico+ (Difícil: Mítico+) + 5 💎 + 40 × ouro de um abate |
| 💎 Caverna de Cristal | 4 ondas | 50 s | (6 + 2 por era) 💎 |
Na instância não há loot normal nem baú: a recompensa é só a da tabela, para não somar duas vezes.

**Estados salvos:** dia atual, chaves restantes, melhor nível vencido por tipo, recorde de abates (Mina), entrada em andamento.
**Tela:** grade 2×2 sem scroll; cada card tem o nome, o desafio, o seletor "‹ Era · Dificuldade ›", a prévia da recompensa e os botões
Entrar/Varrer. No topo: "🔑 2/3 · renova em 5h 12m". Depois, uma janela de resultado (vitória, ou derrota com "a chave não foi gasta").
**Dependências:** batalha V2 precisa de um **modo instância** (horda definida pela instância, cronômetro na tela, fim por tempo,
vitória ou morte, saída de volta à fase normal); uma aba/botão novo para abrir a seleção (hoje são 7 abas; a barra está cheia).
**Riscos:** (a) é a maior mudança na batalha (cronômetro, condição de vitória, sair e voltar à campanha), portanto o maior custo dos três;
(b) diamantes grátis por dia (até ~75 💎/dia em era alta, no Difícil) mexem na economia das skins, a única fonte de receita:
o PO deve validar contra o preço das skins (30-500 💎); (c) varrer pode esvaziar o desafio (sugestão: varrer só a partir de 3 vitórias).

---

## 4. Materiais de fortalecimento (para a aura estilo DDTank, pedido do PO fps-98)
Registro da decisão do dono (docs/CONTRATO_V2.md): aura atrás do herói pelo nível de fortalecimento da arma
(+0-3 sem aura, +4-6 azul, +7-9 roxa, +10-12 chamas vermelhas, +13-15 dourada com raios). Abaixo, a proposta de **onde vem o material**
e de como o fortalecimento se relaciona com o nível 1-50 que já existe. Nada disto foi implementado.

**Proposta de regra (para o PO decidir)**
- Material único: **Pedra de Forja** 🔨. O nome é diferente de propósito das "pedras de prática" da fps-e2, para o jogador não confundir.
  Alternativa: usar a mesma pedra nos dois sistemas (decisão do PO).
- **Nível 1-50 (ouro) continua como está.** O fortalecimento +0..+15 é outra trilha, paga com Pedra de Forja.
- O fortalecimento fica no **espaço da arma** (e, se quiser, no da armadura), **não no item**. Motivo: o item é trocado a cada era
  (o poder cresce 6x por era); se o "+" ficasse no item, o jogador perderia a aura a cada troca. No espaço, o "+12" e a aura vermelha continuam.
- Bônus: progressivo, conforme a tabela única (ver abaixo). Entra na FC (fc.js da fps-e2).
- ~~Sucesso garantido~~ **substituído pela decisão do dono (2026-11-12):** a falha é permitida, SEM perder nível, com garantia
  acumulada (cada falha aumenta a próxima chance). Como a pedra nunca é vendida, não há sorte paga.

**Chances, custos, garantia e bônus: tabela ÚNICA em reports/spec-fortalecimento.md (fps-e2).** Acordo fps-30 + fps-e2 (2026-11-12):
chances 100% até +3, caindo até 5% no +15; +5 pontos por falha; custo por tentativa da fps-e2 (total esperado ~512 até +15, ritmo igual
ao destas fontes; dourada ≈ 280); bônus progressivo (+3/+5/+8/+12% por faixa, +15 = +93%). O estoque de pedras fica no lado do
loot/inventário; o fortalecimento guarda só S.forge = {weapon, armor, pity}.

**De onde vem a Pedra de Forja**
| Fonte | Quantidade | Observação |
|---|---|---|
| Inimigo comum (loot) | **1%** de chance de 1 (2% → 0,7% na v2 por sobra; → 1% na v7.1, porque passou a faltar com o desmonte reduzido) | sai como pickup voando ao HUD, como a gema |
| Chefe de fase | 1-2 | sempre |
| Senhor da Era | 3-5 | sempre |
| Baú de toque | 60% de chance de 1-3 (com o teto de 8 baús/dia ≈ 10 pedras/dia no máximo) | entra na janela de abertura |
| Instância **Arsenal** | 3 / 5 / 8 (Fácil/Normal/Difícil) | sem criar um 5º card (a grade 2×2 continua) |
| Missão diária | missão nova **"Colete 15 pedras de forja"** (PO, após a simulação 3: o "5" era trivial), recompensa 5 pedras | "Fortaleça 1 vez" foi descartada: com o jogador no teto da era, ficaria impossível |
| Desmontar item (no lugar de "Vender") | Básico 0 · Raro 1 · Épico 3 · Mítico 8 · Lendário 20 | escoa os itens repetidos que o baú vai gerar |
| Loja de diamantes | **não recomendado** | vender pedra por 💎 transforma a aura em poder pago; decisão do dono |

**Decisões do PO após o balanceamento v2 (2026-11-12):** a curva do docs/balance.json v2 é a meta; o **nível 1-50 vai para o ESPAÇO**
(como o +N; **nível máximo de melhoria passou a 60**, decisão do PO após a simulação 3): "Melhorar" sai do card do item e vai para o espaço na tela de Equip., e vender ou desmontar não devolve nível; a **armadura também
pode ser fortalecida**; o teto por era (+6/+9/+12/+15) é o limitador principal; preços 4^era sem mudança.
**Ritmo (substituído):** o balanceamento v2 (reports/ux.md) calcula as pedras acumuladas por era; vale a conta dele, não a estimativa abaixo.
~~Ritmo estimado:~~ ~2-3 pedras por fase jogada (3 inimigos visíveis por vez, chefe e baú a cada ~2 fases), mais ~10/dia de instância e missão.
Aura azul na 1ª-2ª era, roxa na 3ª, vermelha por volta da 5ª e dourada no fim do jogo (era 6) ou repetindo instâncias. Calibrar com
docs/balance.json (fps UX) quando o tamanho real das ondas estiver definido.
**Dependências:** loot (pickup novo), baú, instâncias (Arsenal), missões e Equip. (tela de fortalecimento: o desenho é do PO/design);
aura e animação com a fps-ff; FC com a fps-e2.

## 5. Pets: ovos, ração e fragmentos (requisito do dono via PO, 2026-11-12; só no papel)
> ~~Pós-lançamento~~ → **DECISÃO MAIS RECENTE do dono via PO (fps-98): 5 pets NO LANÇAMENTO** (1 por raridade, tipos misturados) e os outros
> 10 numa atualização. No lançamento: Básico **lobo** (Ataque) · Raro **coruja** (Suporte/coleta) · Épico **dragãozinho** (Ataque) ·
> Mítico **golem de cristal** (Defesa) · Lendário **fênix** (Suporte/cura). Nomes e tipos dos 15 aprovados.
> **Nível do pet no ESPAÇO do pet** (compartilhado, como no equipamento: trocar de pet não perde nível); as estrelas são de cada pet.
> No lançamento cada raridade tem 1 pet só, então todo ovo repetido daquela raridade vira fragmento; o sorteio entre 3 vale a partir da atualização.
Base (docs/CONTRATO_V2.md): companheiro que luta ao lado do herói (não é montaria), 1 equipado por vez. ~~5 pets, um por raridade~~ →
**15 pets** (ver a atualização do dono logo abaixo). Evolução: nível 1-50 com ração e estrelas com
fragmentos. Sem ovo pago e sem venda por gemas até a decisão do VIP. Os atributos do pet e o bônus por estrela são do balanceamento; aqui só a obtenção.

**ATUALIZAÇÃO do dono (2026-11-12, direto à fps-30): "tem que ter pelo menos 15 pets, misturados por tipo e raridade".**
A lista de 5 vira **15 = 3 tipos × 5 raridades** (proposta de nomes para o PO/arte; os 5 já pedidos foram mantidos):
| Raridade | ⚔️ Ataque (dano extra) | 🛡️ Defesa (escudo/HP) | ✨ Suporte (cura ou coleta de loot) |
|---|---|---|---|
| Básico | Filhote de lobo | Tatu | Esquilo |
| Raro | Raposa | Tartaruga | **Coruja** (coleta) |
| Épico | **Dragãozinho** | Urso de armadura | Macaco engenhoqueiro |
| Mítico | Grifo | **Golem de cristal** | Polvo arcano |
| Lendário | Drone dourado | Mamute ancestral | **Fênix** (cura) |
(Em **negrito**, os 5 do lançamento; o lobo é o Básico de Ataque. Coruja e fênix passaram para Suporte, por decisão do PO.)
- O ovo continua definido **por raridade** (cor da casca). Ao chocar, sorteia um dos 3 pets daquela raridade, com **preferência pelo que o jogador
  ainda não tem** (70% de chance de vir um inédito enquanto faltar algum daquela raridade). Isso acelera a coleção e reduz a frustração de repetir.
- Equipado: 1 por vez (regra mantida). O tipo dá escolha de estilo (mais dano, mais sobrevivência ou mais loot).
  Força por tipo: reports/spec-pet-fc.md, seção 4b (fps-e2): Ataque 1,5p de dano / 0,5p de HP · Defesa 0,5p / 1,5p · Suporte 0,5p / 0,5p
  + bônus de ouro e pedras; teto da FC do pet ≤ 0,25 × FC do herói.
- Impacto: completar a coleção exige ~3x mais ovos que antes, e cada pet repete menos, então as estrelas ficam mais lentas. Os números de chance abaixo
  continuam valendo; o balanceamento deve validar o ritmo com 15 pets. Arte: 15 pets animados (antes 5), o que entra no plano de conteúdo do PO (fps-ff).

**Regras de obtenção**
- O ovo cai como pickup (voa ao HUD como o item) e já vem com a raridade definida (a cor da casca = a raridade). Fica guardado na aba Pets
  e choca com um toque (animação: fps-ff). Sem tempo de espera para chocar, para não virar "acelerar por gema".
- **1º chefe do jogo (fase 1): ovo Básico garantido.** É o tutorial do pet: o jogador ganha o filhote de lobo no 1º dia.
- **Garantia (pity) de ovo nos chefes de fase:** 10 chefes seguidos sem ovo → o 10º dá ovo com certeza. Na média, 1 ovo a cada ~6,5 chefes
  (~10 ovos nos 63 chefes de fase da campanha).

**Chance de ovo por fonte e raridade**
| Fonte | Chance de ovo | Básico | Raro | Épico | Mítico | Lendário |
|---|---|---|---|---|---|---|
| Chefe de fase | 10% (+ garantia de 10) | **50%** | **32%** | **13%** | **5%** | — | (era 65/28/6/1; decisão do PO após a v4) |
| Senhor da Era, 1ª vitória de cada era | 100% | raridade mínima garantida: era 0 Básico · 1-2 Raro · 3-4 Épico · 5-6 Mítico (e a tabela do chefe pode subir dali) |||||
| Senhor da Era, vitórias seguintes | 25% | 40% | 35% | 18% | 6% | 1% |
| Instância Chefe de Era (Fácil/Normal/Difícil) | 15% / 25% / 40%, **no máximo 1 ovo de instância por dia** (PO, após o teste do QA) | **34%** | 35% | 18% | **12%** | 1% (só no Difícil; nos outros, soma no Mítico) | (Mítico 6→12%, tirado do Básico; decisão do PO) |
| Torre (fps-e2, **confirmado**): marco a cada 10 andares | 1 ovo, uma vez só (cada andar se vence 1x, sem farm) | andar 10-40: Raro+ · 50-90: Épico+ · **100: Lendário garantido** (meio da era 6) · **depois do 100: 1 fragmento de fênix POR ANDAR do 101 ao 110** (no máximo 10; o mediano tira ~5), depois 1 a cada 10 andares (decisão final do PO, proposta da fps-e2: a FC mediana do fim do jogo chega ao andar ~105) |||||
| Evento | conforme o evento | via principal do Lendário fora da torre |||||
| Baú, inimigo comum, Mina, Arsenal, Cristal | — | ovo não cai aqui (fica especial) |||||
Ritmo esperado para o grátis (curva de ~64 dias): Básico no dia 1; Raro nos primeiros dias (garantido na era 1); Épico na era 3; Mítico na era 5;
Lendário pela torre (andar 100), por evento ou pela sorte (1%) no Chefe de Era Difícil.

**Ovo repetido → fragmentos**
- Ovo de um pet que o jogador já tem vira **10 fragmentos daquele pet** na hora de chocar (aviso "Você já tem a Coruja: +10 fragmentos").
- Estrelas: 1★→2★ 10 · 2★→3★ 20 · 3★→4★ 30 · 4★→5★ 40 · máximo 5★ (150 fragmentos ao todo = 15 ovos repetidos do mesmo pet). O pet nasce com 1★.
- **Pet já em 5★: o repetido vira um OVO DA RARIDADE ACIMA** (Básico → Raro → Épico → Mítico; não sobe para Lendário). Decisão do PO após a v4:
  escoa o excesso de ovos baixos para os pets de cima e corta uma fonte de ração que sobrava. Substitui a antiga troca por ração e a "Essência de Pet".
  **Golem (Mítico) repetido: ESCOLHA DO JOGADOR** (decisão do PO, resolve o conflito entre "golem ~4★" e "golem só gera fênix em 5★"):
  num modal ao chocar, com a recomendação marcada: "+10 fragmentos de golem" OU "**+5 fragmentos de fênix**" (N = 5: decisão final do PO após a v5; com N = 10 a fênix passava da meta, 3,4★).
  Com o golem em 5★, a troca por fênix é automática.
  Fragmentos de um pet que o jogador ainda não tem (ex.: fênix antes do andar 100) **ficam guardados**, e o pet **já nasce com as estrelas que eles pagam**.
  Casos de borda (fps-e2): se a fênix nascer antes do andar 100 (ex.: pelo 1% do Chefe de Era Difícil), o ovo do andar 100 vale como repetido
  (+10 fragmentos). Um jogador com sorte no Difícil levar a fênix a ~4,9★ é prêmio aceito pelo PO.
  **TEMA FECHADO pelo PO.** Checagem (docs/balance.json v5.1): golem 3,0★ e fênix 2,6★ no fim, com a política "fênix depois do golem 3★", e o jogo grátis
  terminando no dia 61. O pet no teto de nível cedo nas eras 0-1 é aceito.
  **META do grátis (revisada pelo PO): golem ~3★ OU fênix ~2★, pela escolha do jogador.** O 4★ das duas fica como meta de longo prazo (eventos e a
  atualização com os outros 10 pets). Oferta medida pela v5: ~10 ovos de golem até o fim (a estimativa da fps-30, ~4,5, não contava a subida em cadeia dos repetidos em 5★)
  + ~5 fragmentos de fênix da torre. A subida Épico→Mítico continua. O teto de nível do pet nas eras iniciais fica como está. A v6 confirma as estrelas. A fênix repetida em
  5★ vira 160 de ração (caso raríssimo). A "Essência de Pet" está **CANCELADA**.
  ~~Meta: fênix 3-4★ e golem ~4★~~ (inviável: pedia 3 a 4 vezes a oferta de ovos de golem; substituída pela meta revisada acima).
- Não existe fragmento "universal" na 1ª versão: o Lendário em 5★ é a meta de muito longo prazo, de propósito.

**Ração (material novo)**
| Fonte | Quantidade |
|---|---|
| Inimigo comum | **0,4%** de chance de 1 (pickup) (era 3%; a simulação 3 mostrou sobra de 3-7x) |
| Chefe de fase | 3-5 |
| Senhor da Era | 15-20 |
| Baú de toque | **10% de chance de 1** (era 50% de 2-4) |
| Instância Chefe de Era | **5 / 7 / 10** (Fácil/Normal/Difícil; era 10/15/25: a v4 mostrou que virou a maior fonte) |
| Offline | **5 em 8 h** (era 40, depois 10) |
| Repetido em 5★ | ver acima |
Custo por nível: ⌈3·1,08^(N−1)⌉ (Nv 1→2 = 3; 25→26 = 20; 49→50 = 121). **Teto de nível do pet por era liberada** (mesma lógica do fortalecimento):
era 0 Nv 8 · 1 Nv 15 · 2 Nv 22 · 3 Nv 29 · 4 Nv 36 · 5 Nv 43 · 6 Nv 50. Ração acumulada para chegar ao teto: 30 / 79 / 160 / 299 / 534 / 933 / 1.615.
**DECIDIDO pelo PO:** o nível fica **no espaço do pet** (compartilhado), para não punir quem troca de pet; o teto por era vale para esse nível.
**A validar pelo balanceamento (fps-c9/UX):** se a renda de ração acompanha os tetos na curva de ~64 dias (a minha estimativa é de ~5 rações por fase
jogada, mais o offline; pode sobrar, como aconteceu com as pedras).

**Estado salvo (proposta):** `S.pets = {lvl, own:{<id>:{stars, frags}}, eggs:{<r>:qtd}, food, eq:<id>|null, pity}` (o nível é do espaço).
**Legal (ECA Digital):** o ovo é só ganho jogando. Ovo pago com chance de raridade seria "caixa de recompensa paga" e exige o jurídico antes.
**Dependências:** fps-ff (5 pets animados lutando ao lado, ovo chocando, pickups de ovo e ração), fps-e2 (marcos da torre), PO (tela de Pets em grade
sem scroll), balanceamento (atributos, bônus por estrela, renda de ração).

## 6. Passe de batalha e missões (regras do dono via PO, 2026-11-12; implementado em js/sys/pass.js)
- 30 níveis, 100 XP DO PASSE cada (3.000 no total), temporada de ~30 dias. O nível do passe é SEPARADO do nível do jogador e sobe só com
  missões (abate dá XP só ao jogador). Premium = compra direta, não é sorteio, e ganha +25% de XP do passe.
- **Ajustes do PO:** diárias 90/dia (bônus das 6 = 20), para quem perde 1 dia por semana fechar os 30 níveis (grátis todo dia: dia 27; perdendo 1/semana: dia 29;
  premium: dia 21). Os Lendários do premium (27 colete, 30 arma) são **ITEM DA TEMPORADA**: entregues na hora na melhor raridade permitida e evoluem sozinhos até
  Lendário quando o portão abrir, **sem mudar de era** (o PO aprovou subir de era e depois reverteu pela v7), mantendo o nível; nada guardado para quem pagou.
- **Missões diárias** (versão original 70 + bônus 10 = 80/dia; ver o ajuste acima): Derrote 150 inimigos (15) · Use a ultimate 3× (10) · Abra 1 baú (10) · Vença 1 instância (15) ·
  Colete 15 pedras de forja (10) · Faça 1 invocação, a grátis conta (10) · bônus por completar as 6 (10).
- **Semanais** (190/semana, de segunda a domingo): 1.500 inimigos (40) · 15 chefes (40) · 10 instâncias (40) · 15 baús (35) · 20 melhorias (35).
- Ritmo: grátis jogando todo dia fecha o nível 30 no **dia 28**; premium no **dia ~23**; quem perde 1 dia por semana chega no dia 33 (não fecha a temporada).
- **Grátis**: moedas, poucos 💎 (75 no total), 9 equipamentos Básicos revezando 6 espaços (asa Básica não existe) e **Épico no nível 30**.
- **Premium**: Raro nos níveis 1-9 (5 itens), Épico nos 11-23 (7 itens, inclusive a ASA no 17), skin da temporada no 25, **Lendário no 27 (colete) e no 30
  (arma)**, 355 💎 no total.
- **Portões**: o item entregue respeita o nível do jogador (Lendária 85+era 5; asa 50+). Sem o nível, fica GUARDADO e sai sozinho quando o portão
  abrir, com a **era decidida na liberação**. Se fosse a do resgate, a Lendária guardada desde a era 1 chegaria mais fraca que um Básico da era 5,
  pela regra "era > raridade". Arma Mítica não é entregue no lançamento.

## 7. Essência da Era e custo da transformação de item (regra do dono via PO; material e custo implementados em js/sys/loot.js)
Transformar: ouro + Essência levam um item antigo (qualquer dos 7 espaços) para a ERA ATUAL do jogador, com a mesma raridade e o mesmo visual;
o nível volta a 1; o ouro investido não volta; o +N fica no espaço. A mudança do item é do stats.js (fps-e2); daqui saem o material e o custo.
- **Essência da Era: única** (não uma por era), estoque em `S.sys.loot.mat.essence`.
  | Fonte | Essência |
  |---|---|
  | Senhor da Era (campanha), 1ª vitória de cada era | 5 (35 no jogo) |
  | Senhor da Era, vitórias seguintes | 2-3 |
  | Instância Chefe de Era (Fácil / Normal / Difícil) | 1 / 2 / 3 |
  | Comum, chefe de fase, baú, outras instâncias | — |
  Total ~150 no jogo com 1 Chefe de Era por dia.
- **Custo por era saltada** (destino = era atual b; salto = b − era do item):
  | | Básico | Raro | Épico | Mítico | Lendário |
  |---|---|---|---|---|---|
  | Essência × salto | 1 | 2 | 4 | 7 | 12 |
  | Ouro × 4^b × salto | 100 | 300 | 900 | 2.500 | 6.000 |
- **Atalho controlado:** uma Lendária de 1 salto custa 12 essências (~6 vitórias no Chefe de Era Normal) + 6.000·4^b de ouro (~75 fases de ouro). Um conjunto Épico
  de 7 espaços custa 28 essências por era. A Lendária nova da era continua vindo do Chefe de Era Difícil (10%, com portão 85/era 5), então o loot não morre.
- API: `Sys.loot.transformCost(S, host, item)` → `{ok, jump, toEra, essence, gold}`; `Sys.loot.payTransform(S, host, item)` cobra tudo ou nada, sem mexer no item.
  Fechado com a fps-e2: `Sys.stats.planTransform` (mostra o que se perde) e `Sys.stats.transform` (chama `payTransform` e, se ok, grava `item.look` = era
  original na 1ª vez, `e` = era atual, `lvl` = 1, `gold` = 0; secundários mantidos). `item.e` é sempre a era de PODER; `item.look` (ausente = `e`) é a de aparência.

## Donos de partes (decidido entre as sessões)
- Animação e som de loot, baú e instâncias (pickups voando, abertura do baú, cronômetro, janelas de resultado, sons coin/gem/claim/
  legendary/vitória): **fps-ff** (reports/anima.md). coin, gem, claim e legendary já existem; sons novos: `instance_win` e
  `instance_lose` (nomes definidos pela fps-ff). Produção só depois de o PO liberar.

## Decisões que o PO precisa tomar
1. Aprovar ou não cada sistema, e a ordem (proposta: Loot → Baú → Instâncias, do mais barato ao mais caro).
2. Ritmo do baú (40 abates) e mochila: manter a venda automática do excedente ou ampliar a mochila.
3. Diamantes da Caverna e do Senhor da Era em relação ao preço das skins.
4. Onde ficam o botão do baú e a entrada das Instâncias na tela (os botões s2/s3 já ocupam o canto direito).
5. Se a chave da instância deve ser gasta mesmo na derrota (hoje: não).
6. Se o VIP for aprovado: quanto ele acelera o baú e quantas chaves extras dá (proposta original: +2).
7. Fortalecimento. **Decidido pelo PO (fps-98) em 2026-11-12:** "+N" no espaço da arma ✓ · Pedra de Forja separada ✓ ·
   sem venda por gemas ✓. **FECHADA pelo dono:** falha permitida, sem perder nível, com garantia acumulada; teto por era
   +6/+9/+12/+15. Ainda em aberto: desmontar no lugar de vender?
Decisões 1-6: o PO responde depois que o dono passar pela página de aprovação da arte.
