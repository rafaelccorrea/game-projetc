# Legend of Mushroom × Eonbound: sistema por sistema (o que ADICIONAR ou MELHORAR)

Feito em 13/11/2026 a pedido do dono. Complementa o `docs/PESQUISA_CONCORRENTES.md`, que comparou só o **começo de jogo** e a lâmpada com 8 jogos. Este aqui olha **todos os sistemas** do Legend of Mushroom (LoM) e **a sensação da batalha**.

> **Como ler**
> - O LoM aparece como **Joy Net Games** na App Store (vendedor JOY MOBILE NETWORK PTE. LTD.) e como "Joy Nice Games" nos guias. Não achei fonte que confirme a ligação com a 4399.
> - Quase tudo vem de **guias de fãs** (2024-2025). Números marcados com **(~)** são da comunidade e **aproximados**: o jogo muda a cada versão (está na 2.0.87).
> - O Reddit e o Twinfinite bloquearam o acesso. O que veio só do trecho da busca está marcado **(trecho)**.
> - Regras do Eonbound valem em todas as recomendações: **nada aleatório pago com dinheiro**, jogadores menores (nada sensual, chat de frases prontas, leilão e troca só 18+), moeda comprada não passa entre contas, herói não cresce (skins fixas), montaria não ataca sozinha, pet sempre na frente.

## 1. O ciclo do LoM em uma frase

Matar inimigo **novo** dá lâmpada → tocar na lâmpada dá 1 peça (de 1 a 10 por toque, conforme o nível da lâmpada) → equipar ou vender → **vender é a única fonte de XP** e dá ouro → o ouro sobe o nível da lâmpada (com tempo de espera) → peças melhores → fase seguinte. Em volta disso há **11 trilhas de poder** que abrem nos primeiros 14 dias reais, uma ou duas por dia, cada uma com evento e pacote (Deconstructor of Fun).

## 2. Tabela comparativa

Legenda: **Tem** = o Eonbound já tem algo equivalente · **Parcial** = tem, mas falta a parte que funciona no LoM · **Falta** = não tem.

| Sistema do LoM | Como é no LoM | Eonbound hoje | Situação | Recomendação curta | Prior. |
|---|---|---|---|---|---|
| Tela de batalha | Herói à esquerda, ondas pela direita, lâmpada no centro de baixo com contador, números com rótulo (combo, contra-ataque, crítico) | Batalha V2 aprovada, `floatText`, banner de ultimate, x1/x2/x4 | Parcial | Rótulos de golpe especial e ritmo de ondas (seção 4) | **P1** |
| Lâmpada | Toque = 1 a 10 peças, cartão novo × atual, nível sobe com ouro + tempo, chances na tela | Fogueira das Eras (Sys.bonfire, desligada) embutida na batalha | Parcial (em obra) | Lote por nível, contador grande, "1º abate dá Brasa" | **P1** |
| Automático da lâmpada | Nv 16; filtro de qualidade + 2 filtros de atributo (E/OU); pausa ao bater no filtro | Fogueira: automático no Nv 3, pausa em Épico+, cadeado, desfazer | Tem (melhor que o LoM) | Filtro de atributo só depois dos sub-atributos novos | P2 |
| Atributos secundários | Combo, contra-ataque, atordoar, esquiva, regeneração, crítico de habilidade, resistências | Itens: ATQ, Vida, DEF, chance e dano de crítico, velocidade | Falta | **Sub-atributos de "golpe especial"** com rótulo na tela | **P1** |
| Habilidades | Coleção de ~36 (~), 5 equipadas (~), auto com recarga; ter a habilidade já dá ATQ/Vida/DEF; conjuntos PvE/PvP/Chefe; vêm de **gacha** | Golpes da família da arma (Especial + Ultimate por energia) | Parcial | **Grimório das Eras** sem gacha: aprender por chefe/códex, equipar 3, conjuntos salvos | **P1** |
| Companheiros (Pals) | Até 5 em campo; efeito "em campo" + bônus permanente por ter; gacha com cupons | 1 pet (5 no lançamento, 3 estágios), golpe próprio | Parcial | **Bônus por posse** + 2 pets de apoio passivos | P2 |
| Montaria | Abre no dia 4; sobe com "Clockwinders"; cada montaria tem **habilidade de batalha** (ex.: carro a cada 10 s, 800% de dano em área (~)); as melhores vão para o top 20 de rankings | Nv 1-60 com ouro, 1-7★ com fragmentos, aura por estrela, não ataca | Parcial | **Investida montada** do Kael a cada X s (o herói faz, a montaria não ataca sozinha) | P2 |
| Relíquias | Abrem no meio do jogo; 5 espaços (fóssil, tesouro, livro, estátua, colar) (~); passivas; sobem com cópias e material | Códex e títulos dão bônus fixos | Falta | **Relíquias das Eras**: 9 espaços, 1 artefato histórico por era, sem sorteio | P2 |
| Almas / Runas / Estátua de oração | Camadas tardias de sub-atributos (alma rosa = fundir 2 vermelhas) | Não há | Falta | **Não copiar** (camada demais); usar as Relíquias | P3 |
| Classes / evolução | Transformação no Nv 15, classe no Nv 30 (4), ramos no 50/70/100 e Despertar | Herói não cresce; skins fixas; armas por família de era | Parcial | **Caminho de luta** no Nv 30 (Lâmina, Disparo, Arcano), sem mudar o corpo | P2 |
| Talentos / Parque Tecnológico + Mina | Mina com picaretas que voltam com o tempo, broca, bomba; minério vira árvore de talentos com tempo de pesquisa | Prática: 5 trilhas com pedras | Parcial | **Escavação arqueológica** (minijogo) que alimenta a Prática | P2 |
| Masmorras diárias | 6 tipos; 2 chaves por dia (+2 por anúncio); "varrer o último"; uma é 3 jogadores em pistas; outra é chefe de servidor com hora marcada | 4 instâncias (2 por área), Torre, Chefe Mundial | Tem | **Ladrão de Brasas** (masmorra de Brasas) e botão **Varrer** | **P1** |
| Arena | PvP assíncrono; vitória dá lâmpadas; arena entre servidores no fim | Arena ligada, com teto por era | Tem | Conjunto de habilidades **PvP** salvo; prêmio por luta em Brasas | P3 |
| Guilda ("Family") | Chefe da guilda por dano, "Ajudar todos", Family Brawl 3× por semana, loja de contribuição, guerra entre alianças | Guilda + Torneio do Poder (dependem do servidor) | Tem | Botão **Ajudar todos** e chefe da guilda visível na batalha | P3 |
| Eventos | Um ou mais por quinzena; minijogos com moeda própria (ex.: Reversal Showdown, 5 dias, tática em 3 pistas); colaborações (Palworld, One-Punch Man) | Sys.events (pontos + loja), trilha, chefe do evento, eventos com hora | Tem | **Minijogo rotativo** de evento a cada 2 semanas, prêmio fixo | P2 |
| Ganhos offline | Lâmpadas e recursos acumulam; "Dormitório" dá habilidades e pets offline | Ouro, itens, XP e pedras até 8 h (VIP até 14 h) | Parcial | Offline também dá **Brasas** (com teto) e painel "enquanto você esteve fora" | **P1** |
| Rotina diária / semanal | Chaves que zeram todo dia, missões em fila, roleta grátis (5 min entre giros), pontos vermelhos, "Pegar tudo" | Login, Atividade 0/100, Guia, Passe | Tem | Lista **Hoje** (15-20 min), "Pegar tudo" em todo lugar | P2 |
| Ritmo e paredes | Lâmpada com espera de 5 min a 6 h (~) e ouro exponencial; inimigo já vencido não dá lâmpada; voltar uma fase para "farmar" ouro | Paredes de 1-3 dias por era, Fúria aos 40 s, "Faltam X de FC → Ir" | Tem | Espera curta e **grátis** no nível da Fogueira, nunca vendida | P2 |
| Jardim / roubo / "Parking Wars" | Plantar, colher, outros jogadores roubam; vaga de estacionamento disputada | Não há | Falta | **Não fazer** (roubo entre jogadores com menores gera atrito) | — |
| Dinheiro | Ver seção 6 | VIP, Passe, ofertas fixas, sem sorteio pago | — | Só para saber o que evitar | — |

## 3. Notas por sistema

**Lâmpada e equipamento.** As chances por nível são públicas: Nv 1 = 80% Normal, 15% Unique, 5% Well; Raro só no Nv 2 (1,5%); Mítico no Nv 4; Épico no Nv 7; Lendário no Nv 9 (~). O número de peças por toque cresce: 1 (Nv 1-7), 2 (8-11), 4 (12-15), 6 (16-19), 8 (20-23), 10 (24+) (~). O custo do nível sai de 3 mil de ouro para ~9 milhões no Nv 11-20, com espera de 5 min a 6 h (~). Dois detalhes importam para a Fogueira:
- **Só o 1º abate de cada inimigo dá lâmpada.** Quem volta para fases já vencidas ganha só ouro. Isso empurra o jogador para frente e impede que o farm infinito estoure a economia.
- **O jogador guarda lâmpadas** para abrir num estouro quando trava. O estoque é parte da diversão: um contador alto vira "poder guardado".

**Automático.** O filtro de atributo do LoM (2 filtros, E dentro, OU entre eles) **vende peça boa** quando é ligado cedo: o próprio guia recomenda "nenhum filtro até ter tudo Imortal". A Fogueira já resolve isso melhor (pausa em Épico+, cadeado, desfazer). O que falta copiar é o **lote crescente por nível**.

**Habilidades e companheiros.** Os dois seguem o mesmo molde: cada um tem um efeito **em campo** (só equipado) e um efeito **permanente** (ATQ/Vida/DEF só por ter). Isso faz **toda cópia valer alguma coisa**, mesmo a que não é usada. No LoM o acesso é por **gacha** (Draw ×35 por 30 cupons ou 600 diamantes; a máquina sobe de nível com o uso), e o Deconstructor diz que são precisas "dezenas de milhares de puxadas". **Copiamos o molde, não o gacha.** Os guias também mostram **conjuntos salvos** (PvE em área, PvP com atordoar, Chefe em alvo único): trocar o conjunto é uma decisão de jogador, não de carteira.

**Montaria.** No LoM ela tem habilidade própria e visível (carro que atravessa a tela, sapo que "mata 1 inimigo a cada 10 s" (~)). Na nossa regra a montaria não ataca sozinha, então a saída é o **Kael fazer a investida montado**: o golpe é dele e a montaria só dá o movimento.

**Relíquias, almas, runas e estátua.** São 4 camadas de sub-atributos que aparecem tarde. Elas engordam o fim de jogo, mas cada uma é mais uma tela e mais um gacha. Para nós basta **uma** camada, e o tema das eras pede **relíquias históricas**.

**Classes.** Quatro classes no Nv 30, cada uma muda **quais atributos importam**: o Guerreiro quer apanhar para contra-atacar, o Arqueiro quer combo e velocidade, o Mago quer atordoar e crítico de habilidade. É isso que dá identidade. Não precisamos trocar o corpo do herói (regra do dono): basta trocar a **regra de luta**.

**Mina e Parque Tecnológico.** O minijogo é simples (picaretas que voltam com o tempo, bloco de terra = 1, de pedra = 2, broca limpa coluna, bomba limpa 13 blocos (~), automático só depois de 10.000 m (~)). Funciona porque é **uma pausa ativa** dentro de um jogo passivo. O tema "escavação arqueológica" encaixa perfeito nas 9 eras.

**Masmorras.** Cada uma dá **um recurso**: lâmpadas (Ladrão da Lâmpada, 50 a 145 por entrada (~)), diamantes + cupons, fragmentos de relíquia (3 jogadores em pistas, 90 s), "Clockwinders" de montaria (Torre do Tempo), chefe de servidor com hora marcada. Sempre com **"Varrer o último"**. Nas nossas, o Ladrão de Brasas é o que falta.

**Eventos.** O ritmo de versões é de **1 ou 2 eventos novos a cada 2-3 semanas** (App Store 2.0.79 a 2.0.87). O Reversal Showdown, por exemplo, é um **minijogo de tática** de 5 dias com dificuldade crescente e moeda própria. O conteúdo vivo é o que segura o jogador depois do dia 30.

**Offline.** Lâmpadas acumulam fora do jogo, e o "Dormitório" dá habilidades e pets offline conforme o nível da lâmpada. Ou seja, o offline **alimenta a lâmpada**, e a volta ao jogo é um estouro de toques.

## 4. Jogabilidade da batalha (o que faz a luta do LoM ser boa)

> Fontes: guias de builds e de atributos (algumas definições só pelo trecho da busca) + descrição geral da tela. A disposição exata dos botões deve ser conferida num vídeo antes de copiar.

**O que acontece na tela, segundo por segundo:**
1. **Fluxo sem buraco.** O herói não para: o inimigo seguinte entra enquanto o anterior cai. Cada abate de inimigo novo manda uma lâmpada para o contador, que **sobe na frente do jogador**.
2. **Números com nome.** O ataque básico pode virar **COMBO** (vários golpes num ataque), **CONTRA-ATAQUE**, **CRÍTICO**, **ATORDOADO** ou **ESQUIVA**. Cada rótulo tem cor e tamanho próprios, e combo e contra-ataque também podem ser críticos. O jogador **vê a build funcionando** e entende por que um sub-atributo vale a pena.
3. **Muita coisa agindo ao mesmo tempo.** 5 habilidades em recarga, até 5 companheiros e a habilidade da montaria a cada ~10 s. A tela fica cheia de pequenos estouros, sem o jogador precisar fazer nada.
4. **A única ação é a lâmpada**, e ela nunca pausa a luta. O cartão "novo × atual" mostra setas verdes e vermelhas, e o número de poder pula na hora.
5. **Chefe sem castigo.** Perder o chefe devolve o jogador para farmar a onda anterior. Ele ganha ouro e volta a tentar com mais lâmpadas abertas.
6. **Números enormes.** Danos de crítico na casa de 3.000% (~) e notação K/M/B dão a sensação de crescimento.

**Onde o Eonbound está:** já tem `floatText`, crítico, banner da ultimate, tremor, vibração, Fúria aos 40 s e x1/x2/x4. O que falta:

| # | Melhoria na batalha | Esforço | Prior. |
|---|---|---|---|
| B1 | **Rótulos de golpe especial**: COMBO, CONTRA-ATAQUE, ATORDOADO, ESQUIVA, ROUBO DE VIDA, cada um com cor fixa. Depende dos sub-atributos novos (item 1 da seção 5) | Médio | **P1** |
| B2 | **Contador de Brasas na Fogueira** com Brasa voando do inimigo até a Fogueira a cada abate novo (o pote de 20 abates enchendo à vista) | Baixo | **P1** |
| B3 | **Número de FC pulando** com seta verde e "+N" quando o automático equipa algo, sem abrir janela | Baixo | **P1** |
| B4 | **Ritmo de ondas**: o próximo inimigo entra antes do anterior terminar de morrer (sem 0,5 s de vazio) | Baixo | **P1** |
| B5 | **Escalas de número**: K / M / B / T em todo número de dano e FC, com o crítico 1,5× maior e com contorno | Baixo | P2 |
| B6 | **Investida montada** a cada ~12 s: o Kael avança montado e acerta em área (golpe dele, regra do dono mantida) | Médio (arte) | P2 |
| B7 | **Ícones de habilidade com anel de recarga** na batalha (3 do Grimório), lançando sozinhos | Médio | P2 |
| B8 | **Velocidade**: o x2 grátis no Nv 15 (`Sys.vip`) já segue o padrão do gênero; só conferir que o x2 aparece cedo, junto do automático da Fogueira. O x4 continua no VIP | Nenhum | — |
| B9 | **Perdeu o chefe → volta à onda com rótulo "Juntando força"** e o botão Desafiar acende quando a FC chegar a 90% da pedida (a V2 já tem a parte do Desafiar) | Baixo | P3 |

## 5. Recomendações por prioridade (impacto em diversão e retenção × esforço)

### P1: alto impacto, esforço baixo ou médio

1. **Sub-atributos de golpe especial** nos itens: Combo, Contra-ataque, Atordoar, Esquiva, Roubo de vida (mais as resistências no fim de jogo). Entram no sorteio de sub-atributos do `Sys.loot`/`Sys.stats` (hoje: ATQ, Vida, DEF, crítico, dano crítico, velocidade) e aparecem na batalha com rótulo (B1). **Por quê:** é o que dá sentido a "abrir mais uma Brasa" depois que a raridade já está boa, e é o que deixa a luta legível. A FC continua sendo a mesma conta; a Sistemas calibra para não fugir da curva.
2. **Fogueira com lote por nível e estoque à vista.** Toque = 1 Brasa no Nv 1-3, 2 no Nv 4-6, 4 no Nv 7-9, até 10 nos últimos níveis (seguindo o LoM, ~). Contador grande, Brasas guardadas como "poder guardado", e o desmanche dando XP (já previsto). **Só abate de inimigo NOVO enche o pote**; repetir fase dá ouro (como no LoM). Isso evita farm infinito e empurra para frente.
3. **Ladrão de Brasas** (5ª instância diária, 2 entradas, Varrer o último): um ladrão foge com um saco de Brasas por 45 s e o jogador bate para soltar Brasas (cerca de 1 lote por entrada). Brasas continuam **só jogando**, sem chave paga, sem anúncio.
4. **Grimório das Eras (habilidades sem gacha).** Cada Senhor de Era ensina 2 habilidades; o Códex e eventos ensinam o resto (~18 no total, 2 por era). O jogador equipa **3** na batalha (lançamento automático com recarga), e **cada habilidade aprendida dá um bônus permanente pequeno** (molde do LoM). Sobem de nível com "páginas" que vêm de instâncias e da Torre, em quantidade fixa. Conjuntos salvos **Fases / Arena / Chefe**.
5. **Offline alimenta a Fogueira.** O tempo fora também junta Brasas (com teto diário, por exemplo 40) e mostra o painel "Enquanto você esteve fora" com ouro, XP, Brasas e itens. A volta ao jogo vira um estouro de toques, que é o momento mais gostoso do LoM.
6. **Pacote de polimento da batalha** B2, B3 e B4 (baixo esforço, muita sensação).

### P2: alto impacto, esforço maior

7. **Caminho de luta no Nv 30** (sem mudar o corpo): **Lâmina** (contra-ataque e roubo de vida, quer apanhar), **Disparo** (combo e velocidade), **Arcano** (atordoar e crítico de habilidade). Ramos no Nv 50 e 70 com 2 opções cada; troca grátis 1 vez por semana. Visual = aura e título, nunca o corpo (regra das skins fixas).
8. **Relíquias das Eras**: 9 espaços, um por era (ex.: Machado de Sílex, Escaravelho, Elmo Hoplita, Katana Ancestral...). Passivas, sobem com fragmentos de fontes fixas (Torre, Chefe Mundial, Arena, eventos) e cópias. Encaixa no Códex. Uma camada só, nada de almas e runas.
9. **Escavação arqueológica** (Mina do LoM com tema das eras): picaretas que voltam com o tempo, broca e bomba ganhas jogando, profundidade que muda de era. Dá **pedras de prática** (as 5 trilhas que já existem) e fragmentos de relíquia. Automático da escavação bem tarde. Nenhuma picareta à venda por dinheiro.
10. **Pets: bônus por posse + 2 de apoio.** Ter um pet dá um bônus permanente pequeno; 2 pets de apoio ficam atrás do principal (passivos, sem golpe), sem mexer na regra "pet sempre na frente". Também dá uso aos pets repetidos.
11. **Investida montada** (B6) e **ícones de habilidade com recarga** na batalha (B7).
12. **Minijogo rotativo de evento** a cada 2 semanas (pistas táticas, pesca, escavação relâmpago), com moeda do evento ganha só jogando e prêmio **fixo e conhecido** (cosmético ou fragmento). O motor de eventos já existe (`Sys.events`, `Sys.evtrail`).
13. **Lista "Hoje"** com tudo o que zera no dia (instâncias, Ladrão de Brasas, Chefe Mundial, Arena, guilda) e **"Pegar tudo"** em correio, missões e atividade. Mantém a sessão em 15-20 min.

### P3: bom de ter

14. Arena: conjunto de habilidades PvP salvo e prêmio por luta em Brasas (pequeno).
15. Guilda: botão **Ajudar todos** e o chefe da guilda com a barra visível na tela de batalha (o servidor já tem `boss`).
16. Masmorra cooperativa de 3 jogadores em pistas (como a Ancient City do LoM) quando o online estabilizar.
17. Ranking de evento com **prêmio só cosmético** e com faixas (top 1%, 10%, 50%), para não abrir vantagem de poder que nunca fecha.

### Não fazer

- **Jardim com roubo** e **"Parking Wars"**: interação negativa entre jogadores, ruim com menores.
- **Almas, runas e estátua de oração**: camadas demais para uma equipe pequena; as Relíquias cobrem o papel.
- Qualquer **gacha de habilidade ou de companheiro**, mesmo com cupom ganho jogando, se a mesma máquina também aceitar diamante comprado.

## 6. Dinheiro no LoM (só para saber o que EVITAR)

| Prática do LoM | Por que evitar | Como já estamos |
|---|---|---|
| Gacha de habilidades e companheiros (×35 por 600 diamantes), "dezenas de milhares de puxadas" | Sorteio pago, proibido | Sem sorteio pago |
| Ouro e aceleradores do nível da lâmpada à venda (mais de US$ 1.000 por nível no topo) | Compra direta do núcleo do jogo | Brasas e nível da Fogueira nunca à venda |
| Um passe por sistema (grátis / US$ 4,99 / US$ 9,99), ~US$ 100 por mês para ficar competitivo | Pressão de gasto e cansaço | Um passe só, itens fixos |
| Pacote de chaves de masmorra a US$ 0,99 por dia; chaves extras por anúncio | Transforma rotina em cobrança diária | Chave só jogando (VIP dá entrada extra; manter pequeno) |
| Montarias fortes só para o top 20 de rankings, sem recuperação | Vantagem de poder que nunca fecha | Ranking com prêmio cosmético |
| "Remover anúncios" a US$ 9,99 que também dá chaves e puxadas | Mistura conforto com poder | Conforto sem poder |
| Classificação 13+ na App Store com "Contém loot boxes" e "Contém anúncios" | Nossa meta é ficar limpo para menores | Sem caixa de sorte |

O que dá para aprender sem copiar: **pacotes baratos no dia 1** (US$ 0,99 a 9,99) com **conteúdo fixo**, e **um sistema novo por dia na 1ª semana**, cada um com missões próprias (a Jornada dos 7 dias já proposta no `ANALISE_LOOP_INICIAL.md`).

## 7. Resumo para o dono (as 8 primeiras)

1. **Sub-atributos de golpe especial** (Combo, Contra-ataque, Atordoar, Esquiva, Roubo de vida) com rótulo na batalha.
2. **Fogueira com lote por nível** (1 → 10 peças por toque), estoque à vista, e **só inimigo novo enche o pote**.
3. **Ladrão de Brasas**: instância diária que dá Brasas, com Varrer.
4. **Grimório das Eras**: habilidades aprendidas com os Senhores das Eras, 3 equipadas, bônus por ter, conjuntos salvos, **sem gacha**.
5. **Offline dá Brasas** e painel "Enquanto você esteve fora".
6. **Polimento da batalha**: Brasa voando até a Fogueira, FC pulando com "+N", ondas sem buraco.
7. **Caminho de luta no Nv 30** (Lâmina, Disparo, Arcano), sem mudar o corpo.
8. **Relíquias das Eras** (9 espaços, um artefato por era) e **Escavação arqueológica** alimentando a Prática.

## 8. Fontes (páginas abertas)

- https://deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom
- https://www.pocketgamer.com/legend-of-mushroom/guide/
- https://www.pocketgamer.com/legend-of-mushroom/best-builds
- https://themicrogamer.vercel.app/posts/legend_mushroom/20240315_what_is_LoM/index.html
- https://themicrogamer.vercel.app/posts/legend_mushroom/20240316_secret_of_lamp
- https://themicrogamer.vercel.app/posts/legend_mushroom/20240320_optimize_autouse/autouse.html
- https://theriagames.com/?p=6193 (masmorras)
- https://theriagames.com/?p=6546 (habilidades)
- https://theriagames.com/?p=6515 (companheiros)
- https://theriagames.com/?p=6641 (classe Guerreiro, atributos, relíquias, talentos)
- https://theriagames.com/?p=8037 (almas e fusão)
- https://theriagames.com/?p=8996 (evento Reversal Showdown)
- https://laughica.pages.dev/posts/how-the-mine-and-tech-park-work-in-legend-of-mushroom
- https://www.bluestacks.com/blog/game-guides/legend-of-the-mushroom-brave-3000-free-draws/lotmb-relics-guide-en.html
- https://www.bluestacks.com/blog/game-guides/legend-of-the-mushroom-brave-3000-free-draws/lotmb-classes-guide-en.html
- https://www.bluestacks.com/blog/game-guides/legend-of-the-mushroom-brave-3000-free-draws/lotmb-tips-tricks-en.html
- https://www.talkandroid.com/460593-legend-of-mushroom-guide/
- https://www.talkandroid.com/460550-best-mounts-legend-of-mushroom-2/
- https://itemlevel.net/legend-of-mushroom-complete-beginners-guide-codes/
- https://mobi.gg/en/tips/legend-of-mushroom-beginners-guide
- https://apps.apple.com/us/app/id6475333787?l=en-us (descrição, compras, histórico de versões)
- https://www.pockettactics.com/legend-of-mushroom/release-date

**Só pelo trecho da busca (página não aberta):** definição de Combo e de Crítico, e prioridades de atributo por classe (talkandroid e allclash, guias de build). **Bloqueadas:** reddit.com/r/LegendOfMushroom (sem acesso) e twinfinite.net (erro 403). A disposição exata da tela de batalha do LoM não veio de fonte escrita: conferir num vídeo antes de copiar layout.
