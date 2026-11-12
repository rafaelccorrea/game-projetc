# Auditoria de botões — v0.12.4 (batalha, cabeçalho e MENU)

Regra do dono: nada visível pode não fazer nada ao toque. Ou abre, ou explica num aviso curto, ou não aparece.
Feita pela LEITURA do código (`js/fullbattle.js`, `index.html`). Ainda NÃO conferida no navegador (aba com o agente B).

## Cabeçalho da batalha
| Elemento | O que faz ao toque |
|---|---|
| Avatar + "Nv." + "FC" (um botão só) | Abre o Equipamento |
| Pílula de moedas (com o "+") | Abre a Loja na aba de itens (ouro) |
| Pílula de gemas | Loja de gemas liberada: abre a Loja na aba de gemas. Não liberada: aviso "Loja de gemas: libera no nível 10" |
| "+" das gemas | Só APARECE com a loja de gemas liberada (nível 10, save antigo ou modo dono) |
| Botão redondo de barrinhas (som) | Liga/desliga o som e avisa "Som ligado" / "Som desligado" (antes trocava sem dizer nada: parecia botão de estatística) |
| MENU | Abre/fecha o menu; toque fora fecha |
| Faixa da fase (nome, número, tracinhos das ondas) | Não é botão (só leitura) |
| Desafiar | Desafia o chefe. FC abaixo de 90% da recomendada: aviso com a FC que falta; 2º toque em 4 s desafia assim mesmo. Já no chefe: aviso "Você já está enfrentando o chefe" |

## Coluna esquerda e direita
| Elemento | O que faz |
|---|---|
| Equip. | Abre o Equipamento (desde o início) |
| Invocar | Abre Invocar. OCULTO até o nível 3 (save antigo: sempre visível) |
| Loja | Abre a Loja (desde o início) |
| Passe | Abre o Passe. OCULTO até o nível 18 (save antigo: sempre visível) |
| Baú | Com baú guardado: abre e mostra o prêmio. Sem baú: aviso "Baú: N/M abates" ou "limite de N por dia atingido" |

## Parte de baixo
| Elemento | O que faz |
|---|---|
| x1 / x2 / x4 | Liberada: troca a velocidade. Bloqueada (cadeado): aviso com o motivo (ex.: "x2 libera no nível 15 ou com VIP") |
| Especial e Ultimate | Indicadores. O toque avisa "O especial dispara sozinho quando recarrega" / "A ultimate dispara sozinha quando a energia enche" |
| Básico | Não é botão (indicador) |
| Barras de vida/energia sobre o Kael | Não são botões |

## MENU (só aparece o que tem tela E está liberado)
| Item | O que faz | Quando aparece |
|---|---|---|
| Missões | Abre o Passe na aba Missões | nível 2 (ou save antigo) |
| Config. | Abre as Configurações (tela nova do agente B se estiver ligada; senão o modal antigo) | sempre |
| Forja | Abre a tela registrada `forge` | nível 12 E a tela registrada (`Screens.register`). Sem registro: NÃO aparece |
| Pets, Torre, Instâncias, Ranking, VIP, Correio, Eventos | Abrem a tela registrada | só se a tela existir e o nível permitir. Hoje sem tela: NÃO aparecem (nada de "Em breve") |
| Leilão | — | desligado (`on:false`) |
| Ícones da coluna que não couberem na tela | Vão para o MENU com a mesma ação | telas curtas |

Tela registrada que QUEBRA ao desenhar: o jogo volta para a batalha, avisa "Esta tela não abriu. Avise o suporte." e a entrada dela some do MENU (não fica botão morto).

## Painéis
| Elemento | O que faz |
|---|---|
| Voltar (cabeçalho do painel) | Fecha o painel e volta para a batalha |
| Moedas e gemas no cabeçalho do painel | Não são botões (só leitura) |
| O que está DENTRO de cada painel (Equipamento, Invocar, Loja, Passe, Progresso, Forja, Configurações) | É do agente B: não auditei (pedido A-13) |

## Fora da auditoria / pendente
- Botão da Forja dentro do Equipamento: é do agente B (`js/screens.js`).
- Nada disto foi tocado no navegador ainda.
