# Revisão dos textos das telas novas (Sistemas, 13/11)

Pedido do dono via PO: revisar os textos de todas as telas novas. Conferido em cada texto visível: português, verdade (o texto só promete o que o código faz), regras fixas (sem emoji, nada sensual, jogo para menores, "fim das 9 eras", ouro escasso) e clareza para jogador de 10+ anos.

Escopo: Encruzilhada, Grimório, Caminhos, Provação, Mapa das Eras V4, Guilda V2 (com a aba da Fogueira da Guilda), Torneio V2, Fogueira, Derrota, Dupla, Mentores, Acampamento, Ladrão de Brasas, VIP e Passe.

Só entram linhas com problema. A Sistemas corrigiu os textos dos módulos marcados CORRIGIDO. As telas do Engenheiro e os módulos level.js, trial.js, loot.js e practice.js (em edição por outras sessões) estão só listados.

## Resumo

| Tela | Módulos (js/sys) | Telas (Engenheiro) | Total |
|---|---|---|---|
| Encruzilhada | 1 (corrigido) | 4 | 5 |
| Grimório | 4 (3 corrigidos) | 8 | 12 |
| Caminhos | 3 (corrigidos) | 7 | 10 |
| Provação | 1 (listado) | 7 | 8 |
| Mapa das Eras V4 | 0 | 1 | 1 |
| Guilda V2 + Fogueira da Guilda | 2 (corrigidos) | 16 | 18 |
| Torneio V2 | 0 | 6 | 6 |
| Fogueira | 0 | 2 | 2 |
| Derrota | 0 | 3 | 3 |
| Dupla | 1 (corrigido) | 7 | 8 |
| Mentores | 2 (1 corrigido) | 0 (ainda sem tela) | 2 |
| Acampamento | 0 | 2 | 2 |
| Ladrão de Brasas | 0 | 1 | 1 |
| VIP | 8 (7 corrigidos) | 3 | 11 |
| Passe | 1 (corrigido) | 2 | 3 |
| Fim das 9 eras (aparece no Mapa V4) | 2 (corrigidos) | 0 | 2 |
| Nível e Prática (fontes de ouro e liberação) | 4 (listados) | 0 | 4 |
| **Total** | **29** | **69** | **98** |

### Os 10 mais graves

1. **Grimório promete fontes que não pagam** (p_grim.js:206-209, 238-240; grimoire.js:56-62). A tela diz que a Instância diária, a Torre, as Missões diárias e os Eventos dão páginas e tinta. No jogo, só o battle.js:533 chama o `Sys.grimoire.grant`, e só para o Senhor da Era e o chefe do meio da era. Até ligar as outras fontes, a tela tem de mostrar só essas duas.
2. **Provação promete "Automático da Fogueira" e "Troca automática de conjunto"** (trial.js:36; p_trial.js:210). Nenhum código confere o `Sys.trial.isOpen`. O automático da Fogueira abre no nível 3 da Fogueira (bonfire.js `auto.level`), e a própria Fogueira diz isso (fogueira.js:322). As duas telas se contradizem.
3. **"Chefe da fase 50"** (grimoire.js:53, CORRIGIDO; p_grim.js:205). Com 10 fases por era, o battle.js dá a 2ª magia no chefe da fase 5 da era. A fase 50 não existe.
4. **Nome de guilda digitado pelo jogador** (p_guild2.js:298 e 534). É texto livre que outros jogadores veem, o que vai contra a regra "sem texto livre entre jogadores", mesmo com o filtro do chat. O dono precisa decidir. Proposta: nome montado de duas listas (ex.: "Lobos" + "da Pólvora").
5. **Caminhos diz que o herói "não muda"** (path.js:100, CORRIGIDO; p_path.js:200 e 255). O Disparo dá +10% de velocidade de ataque e o Arcano dá +20% de dano crítico. O que não muda é a aparência.
6. **"Ouro (muito)" na doação da Guilda** (p_guild2.js:72). Fere a regra do ouro escasso. Proposta: "Ouro (pequena)" e "Ouro (grande)".
7. **Inglês visível**: "ATK" (p_cross.js:47, p_trial.js:208 e 225, crossroads.js e mentors.js CORRIGIDOS), "drop" (Guilda e Torneio), "check-in" (guild.js CORRIGIDO; p_guild2.js:349 e 514), "farm" (Derrota "Modo farm" e Guilda "ouro de farm"), "offline" (VIP), "GG!" (duo.js, CORRIGIDO).
8. **Jargão de servidor nas mensagens ao jogador** (Dupla, Guilda e Torneio): "O servidor respondeu de um jeito inesperado", "Pedido inválido: confira os dados", "Cada duelo é o registro de golpes que o servidor manda; a tela só toca".
9. **"retrato provisório" escrito na tela da Provação** (p_trial.js:193). É texto de desenvolvimento e aparece para o jogador enquanto a arte do mestre não chega.
10. **Prática com emoji e inglês** (practice.js:9 e 13-17, ícones 🪨💪❤️🎯🛡️🪙, unidades "% ATK" e "% HP"; o toast da linha 140 leva emoji). A Prática é fonte de ouro (+10%) e aparece nas dicas da Derrota.

---

## A. Textos dos MÓDULOS (js/sys)

### Encruzilhada: js/sys/crossroads.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| crossroads.js:28 | `+3% de ATK` | inglês; as telas novas usam ATQ | `+3% de ATQ` (CORRIGIDO) |

### Grimório: js/sys/grimoire.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| grimoire.js:53 | `1ª vitória sobre o chefe da fase 50 da era` | falso: com 10 fases por era, o battle.js:533 dá a magia no chefe da fase 5 | `1ª vitória sobre o chefe do meio da era` (CORRIGIDO) |
| grimoire.js:110 | `DEF` | sigla em inglês | `Defesa` (CORRIGIDO) |
| grimoire.js:115 | `Vel. de ataque` | abreviação | `Velocidade de ataque` (CORRIGIDO) |
| grimoire.js:56-62 | grants `instance`, `tower`, `daily`, `event` | nenhuma chamada no jogo; a tela p_grim mostra essas fontes como se pagassem | ligar as fontes ou tirar da tela até ligar (lógica: Engenheiro/PO) |

### Caminhos: js/sys/path.js e js/sys/pathtry.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| path.js:20 e pathtry.js:21 | `Atordoar e crítico de habilidade: golpes especiais fortes` | falso: o caminho dá `critDmg` (dano do crítico), não crítico de habilidade | `Atordoar e dano crítico: golpes que acertam forte` (CORRIGIDO) |
| path.js:100 | `Escolha um caminho. Ele não muda o seu herói, só os golpes.` | falso: muda atributos (velocidade de ataque e dano crítico) | `Escolha um caminho. A aparência do herói não muda, só o jeito de lutar.` (CORRIGIDO) |
| path.js:101 | `Você tem 1 troca grátis nesta semana.` | número fixo; o módulo tem `changesPerWeek` | usa a quantidade que sobra (CORRIGIDO; com 1 o texto fica igual) |

### Provação: js/sys/trial.js (em edição por outra sessão: só listado)
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| trial.js:36 | `opens: 10 → Automático da Fogueira; 30 → Troca automática de conjunto` | falso: ninguém chama `Sys.trial.isOpen`; o automático abre no nível 3 da Fogueira | tirar do `opens` até o bonfire.js e o loadouts.js conferirem o `isOpen`, ou ligar a trava |

### Guilda: js/sys/guild.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| guild.js:48 | `5 pedras de treino` | nome diferente da Prática e da Pedreira, que dizem "pedras de prática" | `5 pedras de prática` (CORRIGIDO) |
| guild.js:51 | `100 check-ins` | inglês | `100 presenças` (CORRIGIDO) |

### Dupla: js/sys/duo.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| duo.js:55 | `GG!` | gíria em inglês | `Boa partida!` (CORRIGIDO; o índice da frase, que é o que viaja, não mudou) |

### Mentores: js/sys/mentors.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| mentors.js:62 | `statText atkPct: 'ATK'` (vira `+0,5% de ATK`) | inglês | `ATQ` (CORRIGIDO) |
| mentors.js:25-58 | títulos `Guardiã do Fogo`, `Leitor de Estrelas`, `Guardião dos Astros`, `Piloto das Estrelas`… | o título vai para o jogador (Kael ou Kaia) e mistura feminino e masculino | PO decidir: títulos neutros (ex.: `Chama Guardada`, `Leitura das Estrelas`, `Guarda dos Astros`) |

### VIP: js/sys/vip.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| vip.js:44 | `Horas máximas de ouro, itens, pedras e ração offline (o XP offline fica em 8 h)` | inglês e frase longa | `Mais horas guardando ouro, itens, pedras e ração fora do jogo (o XP fica em 8 h)` (CORRIGIDO) |
| vip.js:46 | `todos (dono 13/11: é do grátis, como sempre foi)` | nota interna dentro do texto | `todos` (CORRIGIDO) |
| vip.js:47 | `"desmontar todos" manual` | pouco claro | `botão "Desmontar todos"` (CORRIGIDO) |
| vip.js:49 | `Entradas de arena a mais por dia` | maiúscula do nome da tela | `Entradas na Arena a mais por dia` (CORRIGIDO) |
| vip.js:50 | `todos (dono: agora é do grátis)` | nota interna dentro do texto | `todos` (CORRIGIDO) |
| vip.js:52 | `Tentativas (derrotas) da torre a mais por dia` | confuso | `Tentativas a mais na Torre por dia (só a derrota gasta)` (CORRIGIDO) |
| vip.js:64 | `x2: nível 15 ou VIP` | incompleto (qual VIP?) | `x2: nível 15 ou VIP 1` (CORRIGIDO) |
| vip.js:15 | `icon:'👑'` | emoji: se alguma tela usar `DATA.icon`, ele aparece | trocar por imagem (as telas novas não usam hoje) |

### Passe: js/sys/pass.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| pass.js:37 | `Use a ultimate 3 vezes` | minúscula; no resto do jogo (tutorial, dicas) é "a Ultimate" | `Use a Ultimate 3 vezes` (CORRIGIDO). "Ultimate" continua sendo inglês em todo o jogo: o dono decide se troca o nome |

### Fim das 9 eras: js/sys/erasend.js (prêmios mostrados no Mapa V4 e na tela do fim)
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| erasend.js:96 | `+3% ATQ e +3% VIDA (o dobro em destaque)` | "VIDA" em maiúsculas; "(o dobro em destaque)" não se entende | `+3% de ATQ e +3% de Vida (o dobro com o título em destaque)` (CORRIGIDO) |
| erasend.js:114 | `Título Marco 100 (+1% ATQ e VIDA)` | maiúsculas | `Título Marco 100 (+1% de ATQ e de Vida)` (CORRIGIDO) |

### Nível e Prática: js/sys/level.js e js/sys/practice.js (em edição por outras sessões: só listados)
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| level.js:30 | `Login diário` (unlockName) | inglês | `Prêmio diário` |
| level.js:9 | `icon:'⭐'` | emoji (se for desenhado como texto) | imagem |
| level.js:44 | estágios `Garoto → Adolescente → Adulto → Guerreiro lendário` (v9, desligado) | contradiz a regra "o herói não cresce" se for ligado | tirar os estágios do v9 |
| practice.js:9, 13-17, 118, 132, 140 | ícones `🪨 💪 ❤️ 🎯 🛡️ 🪙`; unidades `% ATK`, `% HP` | emoji na tela e no toast; inglês | ícones em imagem; `% ATQ`, `% Vida` |

Nota (não aparece ao jogador): o comentário de loot.js:508-510 ainda diz que títulos, prática, mentores e guilda "não entram" no ouro. Desde 14/11 entram (GOLD_LIVE todo ligado, teto de +25%). Vale atualizar o comentário quando o loot.js estiver livre.

---

## B. Textos das TELAS do Engenheiro (só a tabela)

### Encruzilhada: js/p_cross.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_cross.js:47 | `ATK +3%` (rótulo LAB) | inglês | `ATQ +3%` (ajustar também test/paineis/p_cross.smoke.js:84) |
| p_cross.js:47 | `Crítico +1,5` | sem unidade; o módulo fala em "chance de crítico" | `Crítico +1,5%` |
| p_cross.js:176 | `Estas 2 são sempre as mesmas nesta encruzilhada` | número fixo; o módulo tem `choices` | usar `of.length` |
| p_cross.js:47 / 173 | `Ouro +5%` | verdadeiro, mas o ouro das bênçãos entra no teto total de +25% (loot.js goldBreakdown) e pode não somar | no cartão da Trilha do Tesouro: `Ouro +5% (dentro do teto de +25%)` |

### Grimório: js/p_grim.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_grim.js:205 | `Chefe da fase 50, 1ª vitória` | falso (é o chefe da fase 5 da era) | `Chefe do meio da era, 1ª vitória` |
| p_grim.js:206 | `Instância diária vencida: 1 página da 2ª magia + 5 de tinta` | não paga: nada chama o `grant('instance')` | tirar até ligar |
| p_grim.js:207 | `Torre: 15 de tinta a cada 10 andares` | não paga | tirar até ligar |
| p_grim.js:208 | `Missões diárias completas: 5 de tinta` | não paga | tirar até ligar |
| p_grim.js:209 | `Eventos: 3 páginas fixas da magia que o evento diz` | não paga | tirar até ligar |
| p_grim.js:238, 240 | `Instância diária da era vencida: …` / `Tinta: Torre, missões diárias e instâncias. Nada é vendido` | mesmas fontes que não pagam; falta o ponto final | `Tinta: Senhor da Era e chefe do meio da era. Nada é vendido.` (enquanto só esses pagarem) |
| p_grim.js:237 | `Senhor da Era de novo: 1 página por dia` | o limite é por era por dia (como na linha 204) | `Senhor da Era de novo: 1 página por era, por dia` |
| p_grim.js:263 | `Crítico (pts)` | abreviação | `Crítico (pontos)` |

### Caminhos: js/p_path.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_path.js:76 | `O Testar grátis está desligado agora.` / `O Testar grátis fecha depois da escolha.` | usa o nome do botão como substantivo | `O teste grátis está desligado agora.` / `O teste grátis fecha depois da escolha.` |
| p_path.js:200 | `O herói continua igual.` (depois do texto do módulo) | falso (muda atributos) e repete o módulo | `A aparência do herói continua igual.` ou tirar |
| p_path.js:255 | `O herói continua igual; os golpes mudam.` | mesmo caso | `A aparência continua igual; o jeito de lutar muda.` |
| p_path.js:219 | `sem leitura` | jargão | `—` ou `sem dado ainda` |
| p_path.js:81 | `O ensaio ainda não está ligado nesta versão. Nada foi gasto.` | fala de desenvolvimento | `O teste ainda não está disponível. Nada foi gasto.` |
| p_path.js:227-230 | `Ensaio de…`, `Este ensaio`, `Testar outro` | mistura "ensaio" e "teste" | usar sempre "teste" |
| p_path.js:207 | `O corpo e a skin do herói não mudam` | "skin" é inglês (é o nome usado no jogo todo; o dono decide) | manter ou `a roupa` |

### Provação: js/p_trial.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_trial.js:193 | `retrato provisório` | texto de desenvolvimento visível | sem texto (só a silhueta) |
| p_trial.js:208, 225 | `+2,5% ATK` | inglês | `+2,5% ATQ` |
| p_trial.js:210 | `Automático da Fogueira · abre ao vencer esta provação` | falso: o automático abre no nível 3 da Fogueira (fogueira.js:322) e nada confere a provação | tirar até ligar a trava (ver trial.js:36) |
| p_trial.js:206 | `+20 ração` | falta "de" | `+20 de ração` |
| p_trial.js:205 | `+7 pedras` | ambíguo (forja ou prática?) | `+7 pedras de forja` |
| p_trial.js:224 | `sem gema` | o jogo diz "diamante" (Guilda, Fim das 9 eras) | `sem diamante` |
| p_trial.js:67 | `A luta da provação ainda não está ligada nesta versão.` | fala de desenvolvimento | `A luta da provação ainda não está disponível. Nada foi gasto.` |

### Mapa das Eras V4: js/p_map2.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_map2.js:492 | `Sua FC · sem leitura agora` | jargão | `Sua FC · indisponível agora` |

### Guilda V2 (com a aba da Fogueira da Guilda): js/p_guild2.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_guild2.js:298, 534 | campo `Nome da nova guilda` (3 a 24 letras) | texto livre visto por outros jogadores (regra: sem texto livre entre jogadores) | dono decidir; proposta: nome montado de duas listas |
| p_guild2.js:72 | `Ouro (pouco)` / `Ouro (muito)` | "muito ouro" vai contra a regra do ouro escasso | `Ouro (pequena)` / `Ouro (grande)` |
| p_guild2.js:276 | `ouro de farm` | inglês | `ouro de umas 8 h jogando` |
| p_guild2.js:279, 431 | `ouro +2%, XP +1%, drop +1%` | "drop" é inglês | `itens +1%` |
| p_guild2.js:288 | `bênçãos de ATQ, VIDA e DEF` | maiúsculas e sigla | `bênçãos de ATQ, Vida e Defesa` |
| p_guild2.js:307 | `VIDA`, `DEF`, `Drop` | maiúsculas, sigla e inglês | `Vida`, `Defesa`, `Itens` |
| p_guild2.js:349 | `Check-in` | inglês | `Presença` |
| p_guild2.js:514 | `Check-in feito:` | inglês | `Presença marcada:` |
| p_guild2.js:52 | `Isso ainda não está disponível no servidor` | jargão | `Isso ainda não está disponível` |
| p_guild2.js:53 | `Pedido inválido: confira os dados` | jargão | `Não deu certo. Confira e tente de novo` |
| p_guild2.js:54 | `Essas Brasas ainda não chegaram ao servidor: jogue um pouco e tente de novo` | jargão | `Suas Brasas ainda estão sendo salvas: jogue um pouco e tente de novo` |
| p_guild2.js:283 | `O jogo ainda não conectou ao servidor das guildas. Nada aparece aqui antes disso.` | jargão | `As guildas ainda não abriram. Volte mais tarde.` |
| p_guild2.js:385 | `O dano é calculado no servidor; os prêmios chegam pelo correio.` | jargão | `Os prêmios chegam pelo correio.` |
| p_guild2.js:383 | `dano ÷ seu ATQ` | símbolo de conta | `seu dano dividido pelo seu ATQ` |
| p_guild2.js:526, 542 | `Comprar` / `Comprando…` / `Comprado:` (loja de Brasões) | a loja não usa dinheiro; a pergunta já diz "Trocar" | `Trocar` / `Trocando…` / `Trocado:` |
| p_guild2.js:457 (Fogueira da Guilda) | `Pedras de Forja` no meio da frase | maiúsculas diferentes do resto (linha 385: "pedras de forja") | `pedras de forja` |

### Torneio V2: js/p_tourney2.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_tourney2.js:282, 308, 323 | `drop +1%` / `Drop +` | inglês | `itens +1%` |
| p_tourney2.js:51, 56, 283, 309, 334, 335 | `mediana de era` | palavra difícil para 10+ | `era do time` (com uma explicação curta: "a era do meio dos escalados") |
| p_tourney2.js:357 | `Cada duelo é o registro de golpes que o servidor manda; a tela só toca.` | jargão | `Veja cada duelo golpe a golpe. O vencedor segue com a vida que sobrou contra o próximo da fila.` |
| p_tourney2.js:287 | `As guildas, os donos dos territórios e as batalhas vêm do servidor. Nada aparece aqui antes disso.` | jargão | `O torneio ainda não abriu. Volte mais tarde.` |
| p_tourney2.js:183 | aba `Ranking` | inglês (é o mesmo nome do menu, level.js) | `Classificação` (dono decide; mudar no jogo todo) |
| p_tourney2.js:290 | `O torneio é disputado entre as guildas do seu servidor.` | jargão | `O torneio é disputado entre as guildas do seu mundo.` |

### Fogueira: js/fogueira.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| fogueira.js:153 | selo `AUTO` | caixa alta e abreviado | `Auto` |
| fogueira.js:225, 308 | `Mochila cheia: desmontei a pior destrancada (…)` / `Desmontei N peças` | 1ª pessoa; o resto do jogo fala com "você" | `Mochila cheia: a pior peça destrancada foi desmontada (…)` / `N peças desmontadas` |

### Derrota: js/screens2.js (parte da Derrota)
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| screens2.js:757 | `Modo farm` / `Continua farmando automático` | gíria em inglês | `Seguir lutando` / `Continua lutando sozinho` |
| screens2.js:679 | caminho `Invocar · Novos itens` (Derrota sem o quadro do Sys.bossLoss) | o módulo proíbe invocação na tela da Derrota; hoje com o bossLoss ligado não aparece, mas o caminho de reserva ainda mostra | tirar o Invocar da reserva |
| screens2.js:700, 717 | `Pedra de Forja` / `Pedras` | maiúsculas diferentes do resto do jogo | `pedra de forja` / `pedras de forja` |

### Dupla: js/p_duo.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_duo.js:50 | `O servidor respondeu de um jeito inesperado. Tente de novo` | jargão | `Algo deu errado. Tente de novo` |
| p_duo.js:58 | `A Dupla ainda não abriu no servidor` | jargão | `A Dupla ainda não abriu` |
| p_duo.js:58 | `O servidor não permitiu isso` | jargão | `Isso não é permitido agora` |
| p_duo.js:58 | `Pedido inválido: confira os dados` | jargão | `Não deu certo. Confira e tente de novo` |
| p_duo.js:59 | `O servidor não respondeu. Tente de novo` | jargão | `Sem resposta agora. Tente de novo` |
| p_duo.js:339, 341 | `A Dupla depende do servidor…` / `O jogo ainda não conectou ao servidor da Dupla.` | jargão | `A Dupla ainda não abriu. Volte mais tarde.` |
| p_duo.js:335, 366, 398, 483 | `Pedras de Forja` | maiúsculas diferentes do resto | `pedras de forja` |

### Mentores
Ainda sem tela (o menu usa `soon:mentors`, fullbattle.js:155). Os textos do módulo aparecem hoje só na Provação (nome e papel do mestre) e estão na parte A.

### Acampamento: js/p_camp.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_camp.js:60 | `pedras de treino` | a Pedreira produz "pedras de prática" (mesmo nome da Prática) | `pedras de prática` (ajustar também test/paineis/p_camp.smoke.js:113) |
| p_camp.js:201 | `A coleta pega a parte inteira; o resto continua na tenda.` | pouco claro | `A coleta pega só as unidades inteiras; o resto continua na tenda.` |

### Ladrão de Brasas: js/p_thief.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_thief.js:209, 214 | `A perseguição ainda não está ligada na batalha.` | fala de desenvolvimento | `A perseguição ainda não está disponível.` |

### VIP: js/p_vip2.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_vip2.js:195 | `ATQ e VIDA` | maiúsculas | `ATQ e Vida` |
| p_vip2.js:201 | `XP, itens, pedras e ração offline` | inglês | `XP, itens, pedras e ração fora do jogo` |
| p_vip2.js:236 | `Skin · raridade` | inglês (nome usado no jogo todo; o dono decide) | manter ou `Roupa · raridade` |

### Passe: js/p_pass2.js
| arquivo:linha | texto atual | problema | texto proposto |
|---|---|---|---|
| p_pass2.js:406 | `frag. de montaria` | abreviação | `fragmentos de montaria` |
| p_pass2.js:62, 317, 331, 357-369 | `Premium` / `Passe Premium` | inglês (nome do produto; o dono decide) | manter ou `Passe Real` |

---

## Conferido e sem problema
- Sem emoji nas telas novas (as smokes conferem). Os emojis que sobram estão em practice.js, vip.js `icon` e level.js `icon`.
- Nada sensual.
- Sem sorteio pago. Guilda, VIP, Ladrão, Grimório e Dupla dizem "sem sorteio" e "nada se compra".
- Nenhuma tela vende Brasas (Fogueira da Guilda, Ladrão e Fogueira dizem "Brasas só jogando").
- Usam "fim das 9 eras" ou "a jornada continua" e nunca "fim do jogo" (Mapa V4, erasend, Encruzilhada).
- Ouro com teto: Encruzilhada +5% uma vez por era; Fogueira da Guilda até +4,5%; Mentores (Inês e Aurora) +2% por marco. Tudo dentro do teto de +25% do loot.js. O VIP soma à parte, de +5% a +10%.
- Os níveis de liberação batem com a tabela única: Dupla e Mentores no 16 (level.js e módulo). Caminhos (30), Acampamento (20) e Grimório não estão no `Sys.level.DATA.unlock`. Cada um usa o próprio módulo, e a tela lê do módulo, então o texto bate.

## Testes
- `for t in test/sys/*.test.js`: o e2.test.js:249 foi ajustado ao texto novo (`x2: nível 15 ou VIP 1`). Três testes novos de outras sessões falham por trabalho em andamento delas, não por texto: camp-tenda, crossroads-reload e mail-atomico (arquivos ainda fora do git).
- Smokes das telas: test/paineis/p_vip.smoke.js:84 e 86 foram ajustados aos nomes novos do VIP. p_vip2, p_guild, p_guild2, p_cross, p_grim, p_path, p_pass2, p_duo, p_map2, p_camp, p_tourney2, p_thief e derrota passam. O p_trial falha por mudança em andamento no trial.js (outra sessão: "faltou Vida ×1,5"), não por texto.
