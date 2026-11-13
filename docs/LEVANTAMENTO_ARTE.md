# Levantamento: arte que falta para 100% (13/11/2026, ~19h30)

## PRIORIDADE (pedido do dono, 14/11: "prioriza o que é pendente no game: Kael montado, ataques etc.")

Critério: primeiro o que o jogador VÊ faltando no jogo; depois o resto. Fluxo grátis (rafae-47: Google AI Studio + Kling grátis, ~1 montaria/dia) faz o máximo; Higgsfield (saldo a confirmar, ~69?) só no que o grátis não alcança.

| # | O que | Por que primeiro | Quem / como | Custo |
|---|---|---|---|---|
| 1 | Inimigos das eras 7-8 ligados + fundo de reserva | arte pronta, eras 7-8 mostram inimigo sem animação | Engenheiro (só ligação) | 0 |
| 2 | 6 ícones de golpe das eras 7-8 | eras 7-8 sem ícone de golpe | Arte, Higgsfield | ~4 |
| 3 | Kaia na Fênix gigante (parado/correr/golpe) | prêmio do VIP 8 já existe; Kael pronto, Kaia não | Arte, vídeos já pagos | 0 |
| 4 | Kael montado no **Mecha de Guerra** | é vendido (R$ 49,90) e aparece parado atrás do herói; **não vender antes da arte** | grátis (rafae-47); se não passar no teste, Higgsfield | 0 ou ~28 |
| 5 | Kael montado no **Raptor** (em andamento), depois **Escorpião**, **Pantera**, **Unicórnio**, **Lobo de gelo** (os que o jogador ganha antes, por Torre/eventos/Arena/Guilda/Torneio) | aparecem cedo no jogo | grátis (rafae-47), 1 por dia | 0 |
| 6 | Kael montado no **Cavalo infernal**, **Dragão negro**, **Tigre celestial** (eras 7-8 e topo do Torneio) | só no fim | grátis | 0 |
| 7 | Kaia montada nas 10 novas (mesma ordem) | Kaia hoje cai no padrão | grátis depois do Kael de cada uma | 0 |
| 8 | Limpezas do Ciborgue (manchas do ataque, faixa do peito) | visível no ataque | Arte, por código | 0 |
| 9 | 6 pets novos (3 estágios) | ainda desligados no jogo | depois das montarias | ~255-270 ou grátis |
| 10 | Montaria sem cavaleiro (Derrota) e skins montadas | hoje há paliativo por código | por último | ~80-110 / A-B-C |

Comparação do catálogo do código com os arquivos em `assets/` (pastas de reprovado/backup ignoradas).

## Obrigatório

| O que | Situação | Falta | Custo (Arte) |
|---|---|---|---|
| Skins: Kael Samurai e Kael Ciborgue | sem arte | 8 animações cada (parado, correr, golpe, giro, morte, pistola parado/correr/tiro) + retrato | ~60 · EM PRODUÇÃO |
| 10 montarias novas (Raptor de Guerra, Escorpião Gigante, Pantera Sombria, Cavalo Infernal, Unicórnio de Guerra, Lobo do Gelo, Fênix Gigante, Dragão Negro, Tigre Celestial, Mecha de Guerra) | só ícone e referência | Kael e Kaia montados: parado, correndo, golpe (60 animações) | ~28-35 por montaria · ~280-350 |
| 6 pets novos (Escorpião Rúnico, Corvo da Tempestade, Grifo Negro, Golem de Obsidiana, Dragão de Gelo, Serpe Infernal) | só ícone e referência | 3 estágios × parado, correndo, golpe (54 folhas) | ~42-45 por pet · ~255-270 |
| Asa Serafim | refeita, esperando o voto do dono (2 versões) | voto; depois ícone | 0 |

## Completo
- 8 skins novas + Kael e Kaia padrão (com arco e bumerangue)
- 6 montarias antigas com Kael e Kaia montados
- 8 pets antigos + Lobo das Sombras, Falcão de Guerra, Pantera Espectral nos 3 estágios
- 9 asas
- 55 armas e todas as ultimates (base + Lendária própria de cada família; Mítica por código)
- Inimigos e chefes das 9 eras (paradas + correr, golpe, dano, morte)
- 9 cenários vivos
- Ícones: montarias, pets, 34 títulos, menu, eventos, peças por era

## Sem arte, só ligação (Engenheiro)
- Inimigos das eras 7 e 8: animação pronta, falta ligar (EN_ANIM_ERAS) e dar nome no meta
- Fundo estático de reserva das eras 7 e 8: renomear era7_ref/era8_ref e cadastrar

## Novo (achado na Derrota)
- Montaria sem cavaleiro, parada (1 por montaria, 16): ~5-7 créditos cada, ~80-110 + 20% de refação. Até lá: imagem limpa da montaria (a do Códex) com respiração por código. Tirar o cavaleiro das folhas por código foi testado e deixa remendo (descartado)
- Asa na morte: conferir a âncora das costas nas folhas de morte (por código, 0 crédito).

## Opcional
- Ícones médio/evoluído dos 9 pets novos (18)
- Ícones próprios das asas Anjo e Demoníaca (2)
- Peças com 3 desenhos: eras 0-3 prontas, 4-8 em produção (aprovado pelo dono)
- Skins montadas (hoje montado usa a roupa padrão, regra aprovada)

## Skin × asa (conferido pela Arte)
- Só o Kael Anjo tem asa desenhada no corpo: versão sem asa por código (0 crédito; reserva de ~36 se não ficar limpo). Kaia Angelical não tem asa. As capas (Demônio, Paladino, Demoníaca) convivem com a asa como o cachecol do herói padrão.
- Ícones médio/evoluído do lobo, falcão e pantera e ícones das asas Anjo/Demoníaca: 0 crédito, por código.

## Créditos
Saldo ~173. Samurai/Ciborgue (~60) + resto das peças → sobram ~90-100 = Fênix Gigante e Dragão Negro montados.
Para o resto (9 montarias + 6 pets) com folga de ~20%: ~700 créditos. Comprar 1.000 cobre tudo com margem.
