# Levantamento: arte que falta para 100% (13/11/2026, ~19h30)

## PRIORIDADE (dono, 14/11: "prioridade não é criar as coisas novas e sim animar o que já temos por completo")

Feita pela Arte (fps-75) em 14/11, cruzando o que o código PEDE (js/) com o que EXISTE em assets/. Ordem: o que o jogador vê mais cedo. Montarias e pets NOVOS ficam para depois (fim da seção).

| # | O que falta (já existe no jogo) | Jogador vê em | Evidência | Como | Custo |
|---|---|---|---|---|---|
| 1 | Ciborgue: faixa no peito no **giro** (spin q2-q15) | sempre que a skin está equipada | resto limpo em 7f938d7 / 454ceb8 | Higgsfield: refazer o vídeo do spin (o remendo por código corta braço/rosto) | ~4 |
| 2 | **Aura dos pets** por estágio não é desenhada (a arte existe: aura4/7/10/13/evil/holy) | nível 20 (1º ovo) | js/sys/pet.js:97-98, 399-421 monta `draw.aura`; js/petfx.js não desenha | Engenheiro, só código | 0 |
| 3 | **Tela de Pets** mostra "Em breve" para Cérbero, Pégaso e Raposa, e não lista Falcão, Pantera e Lobo das Sombras, mas TODAS as folhas existem | nível 20+ | js/p_pets.js:49-51, 228, 273-284 (PT_SH / PT_ART.sheet:false) | Engenheiro, só código | 0 |
| 4 | Ícones de golpe das **eras 7-8** (6) | fases 71-90 (hoje travadas: ERA9_KEY=false por js/eras9.js:22) | assets/icons só tem era0..6 | Higgsfield (kit docs/guidekit/icons78) | ~4 |
| 5 | **Kaia na Fênix gigante** (idle/run/attack) | VIP 8 (montaria ainda desligada) | não há kaia_giant_phoenix_* | Arte; os vídeos já estão pagos | 0 |
| 5b | A Fênix não carrega nem para o Kael: id `phoenixm` ≠ arquivo `giant_phoenix`; fica fora do MOUNT_TBL e do manifest | VIP 8 | js/sys/mount.js:42, js/mountfx.js:11-20, 49 | Engenheiro: alias ou renomear + tabela | 0 |
| 6 | Pets médio/evoluído com atk2/atk3 (hoje repetem o atk1) | **só na tela de Pets**; na batalha nenhum estágio usa atk2/3 | js/loading.js:59, js/p_pets.js:276-282 | grátis (rafae-47): 20 folhas (5 pets × 2 estágios × 2) + o Engenheiro acrescenta na PT_SH | 0 |
| 7 | Asa Seráfica (arte reprovada, a refazer) | nível 50 | fora de wingsApproved (js/sys/stats.js) | grátis primeiro; Higgsfield se não passar | 0 ou ~4 |

**Conferido e SEM falta** (não gastar):
- Kaia nas 6 montarias antigas: completa, com era2_t1 e manifest.
- Estados de todas as skins Kael/Kaia: run/idle/attack/spin/die/pistola.
- `attack_wide` da Kaia: o código não lê attack_wide de skin (js/stage.js:259, 397).
- Inimigos e chefes das eras 0-8: run/attack/hurt/die.
- Asas: imagem L/R batida por código; morte via drawWingsAt.
- Pets sem dano/morte: é por desenho, o pet não é alvo (js/sys/pet.js:86).
- Ultimates: era0..8_ult e os 9 *_legend existem.

**Desligado / novo: depois, pela regra do dono**
- Mecha de Guerra: sem folha montada. **Não está à venda**: o card shopmecha está false (js/panels.js:20). São 6 folhas, grátis (rafae-47) ou ~28-34 por cavaleiro.
- 8 montarias novas (raptor, escorpião, pantera, cavalo infernal, unicórnio, lobo de gelo, dragão negro, tigre celestial): 6 folhas cada, grátis primeiro.
- 6 pets novos (escorpião, corvo, grifo, obsidiana, dragão de gelo, wyvern): 9 folhas cada.
- bow_legend e boomerang_legend: só quando o arco e o bumerangue forem ligados.

**Plano dos 119 créditos do Higgsfield** (reserva de ~15% = 18 para refazer)

| Ordem | Item | Custo |
|---|---|---|
| 1 | Kaia na Fênix (baixar os 3 vídeos já pagos) | 0 |
| 2 | 6 ícones das eras 7-8 | ~4 |
| 3 | Giro do Ciborgue (spin) | ~4 |
| 4 | Asa Seráfica, se o grátis não passar | ~4 |
| — | Reserva para refazer | 18 |
| — | **Sobra ~89, sem destino entre os itens existentes.** Sugestão, a decidir pelo PO e pelo dono: cobrir os vídeos grátis que não fecharem o laço ou não passarem nos 3 testes (o Mecha primeiro, porque vai ser vendido) | a decidir |

Quase tudo o que falta no que JÁ existe é código (itens 2, 3 e 5b, do Engenheiro), não arte.

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
