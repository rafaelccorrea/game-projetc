# Força-tarefa: finalizar tudo (ordem do dono, 13/11/2026 à noite)

> "faça força tarefa pra finalizar tudo que falta" · "lança multi agentes onde for necessário"

Cada sessão pode e deve abrir subagentes para dividir o próprio trabalho, um processo pesado por vez no PC, com commit e push por item. Ordem de prioridade abaixo; quem termina o seu bloco pega o próximo livre.

## P0: o que o dono sente jogando (antes de tudo)
| # | Item | Quem |
|---|---|---|
| 1 | Inimigos dando só 1 de dano | Engenheiro + Sistemas |
| 2 | Vida volta cheia ao vencer o chefe | Engenheiro + Sistemas |
| 3 | Começo mais duro (sem alívio nas fases 1-3, presente menor) | Sistemas → Engenheiro |
| 4 | Itens caindo no chão com ímã; Épico+ espera o toque | Engenheiro |
| 5 | Calibração da dificuldade (100% vence ~5/6, 90% ~metade) e ligar | Sistemas |

## P1: Fogueira das Eras (tipo lâmpada)
| 6 | Protótipo V2 para o voto (link único) | Sistemas |
| 7 | Módulo js/sys (níveis, chances, Brasas, auto, desmontar, desfazer) | Sistemas |
| 8 | Tela, toque para forjar, cartão novo × seu, automático, desmontar rápido | Engenheiro |
| 9 | Intro jogável de até 60 s | Engenheiro |
| 10 | 9 visuais da Fogueira (depois do voto) | Arte |

## P2: telas aprovadas para o jogo (ordem do PASSAGEM.md)
| 11 | Batalha → Equipamento + Mochila → Forja → Pets → Montarias → Invocar → Loja → VIP → Passe → Fim das 9 eras → Perfil → Guilda → Torneio → Torre | Engenheiro (com subagentes) + Sistemas |
| 12 | Refazer Mapa das Eras e Correio na direção que o dono escolher | Sistemas |

## P3: online no app
| 13 | Ligar Arena → Guilda → Torneio no jogo, com luta real de teste | Engenheiro + QA + Servidor |
| 14 | Compras da Play (plugin de cobrança), quando o dono aprovar e configurar | Engenheiro + Servidor |

## P4: arte (um item por vez até 100%)
| 15 | Golpe, giro e pistola das 9 skins na coreografia do padrão | Arte + PO (Higgsfield) |
| 16 | Tiro montado (6 montarias, Kael e Kaia) | Arte + PO |
| 17 | Montaria parada para a Derrota (6) | Arte + PO |

## P5: conferência e entrega
| 18 | QA na tela: eras 7-8, Fênix, Seráfica, Kael Anjo, Ciborgue, Clava, pets, correções do S24 | QA |
| 19 | Próxima APK com tudo e instalar no S24 assim que o dono pedir | Engenheiro / PO |
| 20 | Checklist de arte e STATUS_DONO atualizados | PO |

## Situação (13/11, 20h)
| # | Item | Situação |
|---|---|---|
| 1-2 | Dano 1 dos inimigos; cura cheia no chefe | Corrigidos no código (a54c87b); a Sistemas sobe o dano do comum e fecha a calibração |
| 3, 5 | Começo mais duro e calibração | Números da Sistemas prontos (balance.json no main, 0a7dc35): golpe do comum 2-3% da vida nas fases 1-8, sem "-1"; chefe 3,6-4,3%; herói chega ao chefe com 60-100%. **Ligado no main (e750701)**: dano do comum, presente +50 gemas, referência de FC. Sistemas remede fases 9-10 e as 9 eras; QA confere com save novo |
| — | Derrota no chefe com prêmio pelo dano e 3 dicas | Regras prontas e desligadas (513736d). Protótipo pedido à Sistemas → voto do dono → Engenheiro liga |
| 4 | Itens no chão com ímã | Feito, desligado (e5dd11b); o QA achou 2 defeitos, que estão sendo corrigidos |
| 6-9 | Fogueira | V3 e V4 reprovadas; V5 no layout de hoje (botão no centro da barra de baixo) sendo feita. Regras e servidor prontos, desligados |
| 10 | Arte da Fogueira | 9 estágios em rascunho, esperando o voto do dono |
| 11 | Telas aprovadas | No jogo, desligadas: Forja, Pets, Torre, Equipamento + Mochila. Em subagentes: Montarias, Loja, VIP, Passe, Fim das 9 eras, Perfil, Guilda, Torneio |
| 12 | Mapa V3 e Correio V3 | Publicados para o voto do dono |
| 13 | Online no app | Arena ligada e testada de verdade; Guilda e Torneio passaram no teste do servidor e ligam em seguida |
| 14 | Compras da Play | Esperando a configuração do dono |
| 15-17 | Arte | Kael Anjo pronta; 9 vídeos das skins do Kael e 33 do lote 2 em processamento; montaria parada feita de graça |
| 18 | QA na tela | Lotes em andamento com 2 subagentes |
| 19 | APK | v0.13.2 instalada no S24; a próxima sai depois da conferência do QA |
| — | Recomendações do Legend of Mushroom | Aprovadas pelo dono; P1 com regras prontas, telas em andamento |
