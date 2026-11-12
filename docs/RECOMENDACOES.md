# Eonbound — Recomendações de UX, economia, balanceamento e publicação

Agente de UX/pesquisa/balanceamento · 12/11/2026 · **rodada 7.3**: a seção 4 (balanceamento) vale para as regras atuais do dono (7 espaços, nível do item, skin e VIP com poder). **As seções 0, 0b, 3, 5, 6 e 12 foram escritas com a premissa antiga "só skins cosméticas, sem pay-to-win", que o dono substituiu**: onde elas dizem que skin não dá atributo ou que diamante só compra aparência, vale a seção 4 e o `docs/CONTRATO_V2.md`.
Prioridades: **P0** = fazer agora no MVP · **P1** = logo depois · **P2** = só com o jogo validado.
Números de balanceamento vêm de simulação (ver seção 4 e `docs/balance.json`). Fontes com link na seção 13.

## 0. As 6 coisas que mais importam

1. **O jogo atual acaba rápido demais.** Simulado sobre o código de hoje (com horda), um jogador grátis zera as 7 eras em ~1,6 h (x1) ou 25 min (x4). Proposta em `docs/balance.json` v7.1 para o pacote do lançamento: era 0 no dia 1, depois horas, depois dias (~61 dias no total).
2. **Há dois vazamentos de pay-to-win.** "Invocar equipamento" custa diamantes, e a trilha Premium do passe dá moedas. Se diamante e passe forem vendidos, isso é pagar por poder. Regra proposta: **moedas compram poder e nunca são vendidas; diamantes compram só aparência.**
3. **Sorteio pago de skin é proibido no Brasil para jogos acessíveis a menores.** O ECA Digital (Lei 15.211/2025, art. 20, em vigor desde 17/03/2026) veda "caixas de recompensa" pagas. "Invocar skin" e os "Pacotes de skins" pagos com diamante comprado caem nessa definição. Vender skin de forma direta (vitrine + passe) e deixar sorteio só com recurso que não se compra. Confirmar com advogado antes de publicar.
4. **Os primeiros 5 minutos precisam de roteiro.** Hoje há 7 abas abertas e um parágrafo de texto. Liberar abas aos poucos e ensinar com a mão apontando (seção 1).
5. **Não repetir derrota como forma de progredir.** Na curva proposta o jogador seria derrotado ~11 vezes na era 0 e ~1.800 na era 6. Depois de perder para o chefe, o jogo deve ficar "farmando" a fase com um botão **Desafiar chefe**.
6. **Publicar primeiro no Android.** Custa US$ 25 (uma vez) contra US$ 99/ano + Mac na Apple; conta pessoal nova exige teste fechado com 12 pessoas por 14 dias.

## 0b. Aviso: a proposta de VIP e montaria com poder muda a premissa deste documento

Este documento foi escrito com a premissa "só skins são monetizadas, nada de pay-to-win". Enquanto eu trabalhava apareceu `reports/qa_proposta_vip_baus_instancias.md`, em que o dono decide que **VIP (1-9, por gasto) e montaria dão ATK/HP**. Não revisei essa proposta a fundo; o que os dados daqui dizem sobre ela:

- **É pay-to-win por definição** (gastar dinheiro aumenta atributo). É também a crítica nº 1 dos jogadores ao Legend of Mushroom e similares. A loja não pode mais dizer "nada aqui dá atributo".
- **Quebra a curva**: na rodada 3 o VIP ficou fora do lançamento por decisão do PO. A montaria continua dando poder: na v4 ela é compensada por uma tabela de dificuldade própria (seção 4), e o fim fica em ~61-62 dias com +10% ou +20%. Na rodada 2, um VIP com +30%, velocidade x3 e offline em dobro terminava no dia ~18 contra ~64 do grátis.
- **Montaria por invocação paga** é caixa de recompensa com vantagem aleatória: o caso mais claro do art. 20 do ECA Digital (seção 9).
- **Se a decisão for mantida, o mínimo para não afastar o jogador grátis**: teto baixo de poder comprado (soma de VIP + montaria ≤ ~15-20%); pontos VIP também ganhos jogando (devagar); benefícios VIP concentrados em conveniência (mochila, 2º conjunto, fila de melhorias) e visual; montaria obtida com moedas ou progresso, nunca por sorteio pago.

As seções abaixo continuam válidas nos dois cenários, exceto a regra "diamante só compra aparência" (seção 5), que deixa de ser verdadeira com VIP de poder.

## 1. Jogador que começa do zero (primeiros 5 minutos)

O que as referências fazem: Legend of Mushroom ensina no tutorial a equipar/vender cada item à mão e libera 11 sistemas ao longo de 14 dias (um por dia na primeira semana); AFK Arena libera funções pelo avanço da campanha, não por nível.

| Pri | Recomendação |
|---|---|
| P0 | **Roteiro por momento, sem parede de texto.** 0:00 JOGAR já cai na luta. ~0:25 primeiro chefe: energia cheia, câmera lenta, mão apontando para a ultimate ("TOQUE!"). ~0:30 primeiro item: "Equipado!". Quando o ouro der para a 1ª melhoria: aba Equip. pulsa e a mão aponta **Melhorar**. Fase 3: libera Invocar com 1 invocação grátis (Raro garantido). |
| P0 | **Liberar abas aos poucos** (hoje são 7 de cara): Batalha e Equip. no início; Invocar na fase 3; Missões na fase 4; Loja na fase 6; Skins ao ganhar a primeira skin (dar uma de presente na fase 8); Passe ao chegar na era 1. Aba bloqueada não aparece. |
| P0 | **Primeira derrota vira aula.** Ela acontece por volta do minuto 4-5 (fases 8-9). Em vez de só "Derrotado...", mostrar painel com 2 botões: "Melhorar arma" e "Invocar". |
| P0 | **Modo farm + botão "Desafiar chefe"** (com opção "desafiar sozinho quando eu ficar mais forte"). Perdeu para o chefe: continua enfrentando as ondas 1-4 em laço, ganhando ouro, sem tela de derrota repetida. |
| P0 | **Festa na troca de era** (~19 min): banner, som, +diamantes, libera x2, mostra o visual novo e avisa "você ganha moedas mesmo fora do jogo". É o gancho para voltar amanhã. |
| P0 | Trocar o card de texto da aba Batalha por: barra da fase, **próxima recompensa** ("Chefe: item Raro+ e 10 diamantes") e poder do herói × poder recomendado do chefe. |
| P1 | "Vender Básicos" automático (opção ligada por padrão depois da era 0). No Legend of Mushroom a venda automática chega tarde e é uma queixa conhecida. |
| P1 | Nível de melhoria passa para o item novo do mesmo espaço (ou devolve 80% das moedas). Hoje trocar de item zera o investimento e ensina o jogador a não melhorar. |
| P1 | Comparação clara no item novo: seta verde/vermelha e diferença de poder; botão único "Equipar melhor". |

## 2. Tela, HUD e zona do polegar (retrato)

Guias de uso com uma mão convergem em: ações principais e navegação no terço inferior, 3-5 destinos na barra de baixo, alvos de toque grandes. O mapa de calor da "zona do polegar" é uma regra prática, não medição; testar no aparelho real.

| Pri | Recomendação |
|---|---|
| P0 | **Barra de abas no rodapé**, fixa, com `env(safe-area-inset-bottom)`. Hoje as abas ficam no meio da tela, entre a luta e o painel. |
| P0 | **No máximo 5 abas**: Batalha · Equip. · Invocar · Loja · Mais (Skins, Missões, Passe). Hoje 7 abas dão ~55 px cada em 390 px de largura. |
| P0 | **Botões de s2 e s3 embaixo, à direita**, logo acima da barra de abas quando a aba Batalha está aberta: 64 px, anel de recarga, brilho + som quando a ultimate fica pronta, chave **Auto** ao lado. Nunca no canto de cima do canvas: num S24 Ultra o polegar não alcança. |
| P0 | Alvos de toque de 48 px ou mais (os botões "Vender", "Equipar" e as fichas de era estão abaixo disso) e 8 px entre botões vizinhos. |
| P1 | Um único ponto vermelho por aba, só quando há algo para **resgatar**. Excesso de avisos e pop-ups de oferta é crítica recorrente no gênero. |
| P1 | Canvas da luta com 40-42% da altura em telas altas (20:9); HUD de moedas dentro do topo do canvas para ganhar espaço. |
| P1 | Bloquear "puxar para atualizar" e zoom por toque duplo; manter a tela acesa durante a luta (Wake Lock). |

## 3. Os 3 ataques: profundidade sem pay-to-win

AFK Arena usa a mesma base: ataques automáticos e especial disparado pelo jogador, com botão AUTO.

| Pri | Recomendação |
|---|---|
| P0 | Manter as constantes de combate que já estão no código (`BAL` em js/battle.js): s1 1x a cada 0,8 s; s2 3x em até 3 alvos a cada 6 s; s3 10x em todos com 100 de energia (+4 por golpe do s1, +2 por golpe do s2, +3 ao apanhar). |
| P0 | **A decisão do jogador é o momento da ultimate.** Energia não zera entre inimigos: guardar para o chefe é a jogada certa e deve ser ensinada. Auto ligado solta assim que enche (pior que o manual, de propósito). |
| P0 | Energia, recarga e dano dos ataques **nunca** dependem de skin nem de diamante. A skin muda cor, som e efeito. |
| P1 | **Janela de fraqueza do chefe**: o chefe "carrega" um golpe forte (aviso de 1 s); ultimate nessa janela causa +50% e cancela o golpe. Dá habilidade ao jogo ativo sem custar nada. |
| P1 | **Maestria por uso**: cada ataque sobe de nível ao ser usado (ex.: +1% por nível, teto 20). Recompensa tempo de jogo, não dinheiro. |
| P2 | Variações de s2 por era, escolhidas pelo jogador (área, sangramento, escudo), liberadas por progresso. Só depois de medir se os jogadores usam o manual. |
| Evitar | Vender recarga, energia inicial ou "ultimate dupla"; dar bônus de dano a skins raras; x4 livre (a ultimate manual fica impraticável e o jogo encurta de 42 para 32 h ativas; a era 0 cai de 19 para 7 min). |

## 4. Balanceamento e progressão por eras

### Rodada 8 (12/11/2026): calibração no jogo real, docs/balance.json v8 (detalhes e tabelas por fase em reports/calibracao.md)

Medido no próprio jogo (builds v0.9 e v0.10, antes da v0.11), relógio do jogador com a regra nova de velocidade (grátis x1 até o nível 15, x2 depois).

**Causas.** Parede da fase 21: salto de ×2,37 no inimigo na troca de era contra ×1,41 na FC recomendada; o botão brilhava com 17.401 e o chefe só caía com ~25-34 mil. Tabela de FC recomendada torta (baixa no começo da era 2, alta no fim). Era 0 curta porque o herói mata com sobra: mais vida no inimigo quase não alonga; o que alonga é o Senhor da Era pedir ~1 nível a mais.

**O que mudou (só balance.json).** Crescimento por fase 1,282 → 1,4 (vida e dano); eraMult 0,245 · 0,26 · 0,17 (sem salto na troca de era); earlyEase vira multiplicador de vida por fase (era 0: 5 a 8; era 1: 1; era 2+: 1,5); FC recomendada 1.650 · 19.300 · 433 mil. Eras 3 a 6: extrapolação, não medida.

**Resultado (melhora sempre e desafia com o botão brilhando, 5 partidas).** Era 0 em 17,7 min (pior 18,9), 1 derrota, nível 12. Era 1 em 25,4 min, nível 17. Era 2 em 48,9 min (pior 61,7), nível 26. Derrotas por fase: 0 a 3, com uma exceção (fase 24: 6 em 1 partida).

**Em aberto.** (1) Eras 1 e 2 ficam na metade do tempo pedido (40-50 min e 1,5-2 h): depende da XP por abate do módulo da fps-30; proposta NÃO medida: `Sys.loot.DATA.xp.eraScale` 1 → 0,15. (2) Quem desafia sem esperar o brilho morre em laço (era 2: ~870 derrotas) e quem não melhora item trava no Senhor da Era 0 (1 partida: 91 min, 86 derrotas): pior que na v7.3. (3) Torre, instâncias (8 entradas/dia), build v0.11 e VIP: a remedir.

### Rodada 7.3 (12/11/2026): trava no Senhor da Era 0, validada no jogo real

**Causa.** Ao chegar à fase 10 (nível 11, itens no teto, ouro zerado), o herói tem ATK 54 e HP 671 e leva ~26 s para matar o Senhor da Era 0 (2.331 de HP), que o mata em ~10 s (78 por golpe a cada 1,15 s, mais a escolta). Faltava ~2,6× de força, e melhorar item quase não ajuda no começo (ATK 51 → 63 com tudo no teto). Os multiplicadores do Senhor da Era foram calibrados na v7.1 com um ritmo errado e contando com sistemas que a build ainda não tem.

**Correção mínima** (BAL do jogo, engenheiro): `eraBossHpMult` 2 → 1,1 e `eraBossDmgMult` 1,4 → 0,9.

**Teste no jogo real** (build v0.8.1 acelerada, valores sobrescritos em memória; minutos de jogo)

| Perfil | Antes | Depois (v7.3) |
|---|---|---|
| A: sem melhorar, MANUAL | não passa em 40 min, 19 derrotas | não passa em 40 min, 19 derrotas |
| B: melhora a cada 30 s, MANUAL | não passa em 40 min, 20 derrotas | não passa em 40 min, 19 derrotas |
| C: melhora sempre, AUTO | 1 partida passou aos 29,6 min com 19 derrotas; as outras não passaram | **passa em 8,6 a 11,1 min, com 1 ou 2 derrotas (13 de 13 partidas)** |

O critério do PO (perfil C, até ~20 min, no máximo 3 derrotas) está atendido. Os perfis A e B não usam especial nem ultimate e continuam presos.

**Eras 1 e 2 no jogo real, com a correção**
- Era 1: passa. Duas partidas: 35 min com 26 derrotas e 103 min com 100 derrotas (65 no Senhor). A sorte pesa muito.
- Era 2 com o `eraMult` da v7.1 (2,19): parede. 20 derrotas na fase 21, fase 28 em 96 min com 98 derrotas; aos 323 min ainda na fase 29.
- Era 2 com `eraMult` 1,44: passa em 202 min de jogo (~1,8 h reais em x2), com 194 derrotas. Uma partida.
- Por isso a v7.3 também troca o `eraMult` para 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161. As eras 3 a 6 vêm só do simulador.

**O que não foi feito e muda as conclusões abaixo**
- A v7.1 foi calibrada com ritmo errado (tratei uma medida da v0.7 como regra; a v0.8.1 mede 27,7 abates por minuto de jogo, e o simulador original já dava 27,0). **Os dias por era da v7.1, abaixo, não valem.** As metas de ~59 dias (grátis) e ~43 (VIP B) não foram revalidadas.
- A curva de ganho por nível do item proposta pela fps-e2 não foi testada (é fórmula do módulo e pede recalibrar tudo).
- Golpe básico: mantido a cada 1,2 s, por decisão do PO.

**Outros achados do teste no jogo real**
- Mochila cheia desmonta o item **novo**: com a mochila cheia de sobras o jogador parou de receber itens da era 2 e morreu 904 vezes na fase 21. Sugiro desmontar o item mais fraco fora de uso.
- O avanço nas eras 1 e 2 é por derrota repetida; o modo farm com "Desafiar chefe" (seção 1) continua sendo a correção.
- Com a XP de abate em 2,2 o nível chega a 34 no fim da era 2 (meta 26-27).

**Quem muda o quê**

| Dono | Chave | Antigo | Novo |
|---|---|---|---|
| Engenheiro (BAL) | `eraBossHpMult` | 2 | 1,1 |
| Engenheiro (BAL) | `eraBossDmgMult` | 1,4 | 0,9 |
| Engenheiro (BAL) | `eraMult` | 0,944 · 0,777 · 2,19 · 6,72 · 32 · 112 · 412 | 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161 |
| Engenheiro (jogo) | missão "Melhore 5 vezes" | sempre | a partir do nível 5 |
| Engenheiro (jogo) | mochila cheia | desmonta o item novo | desmontar o mais fraco (recomendado) |
| fps-30 (loot.js) | `summon.cost.base` | 1.000 | 500 (já aplicado) |
| fps-e2 (stats.js) | — | — | nada na v7.3 |

### Rodada 7.1 (histórico; ritmo errado, dias sem valor)

**Veredito.** Com o simulador calibrado no ritmo real e o `eraMult` refeito, o grátis termina no dia 59 (55-65) e o VIP opção B no dia 43 (39-50): as duas metas fecham. Para isso a XP de abate precisa subir 2,2× (o jogo real mata ~24 inimigos por minuto, não 54). O `docs/balance.json` está na v7.1 e continua desligado de propósito.

**Decisões do PO aplicadas**: VIP opção B (sem x3); Item da Temporada não sobe de era; invocação com base 1.000 × 4^era; custo de melhoria × 3,5^era; desmonte com pedras 0/1/2/4/10; botas, colar e asa × (1 + 0,25 × era); "equipar e upar até o meu nível" como comportamento padrão; ovo de instância repetido em 5★ vira ração; x2 livre desde a era 0.

**Calibração do ritmo** (jogador novo, x2, AUTO, sem melhorar item, dificuldade da build v0.7)

| | Fim da fase 1 | Nível aos 5 min | Fase | Derrotas | Baú |
|---|---|---|---|---|---|
| Jogo (medido) | 32 s | 5 | 6 | 1 | 124/250 |
| Simulador antes | 19 s | 10 | 11 | 2 | 305 |
| Simulador calibrado | 45 s | 6 | 6 | 0 | 139/250 |

Ajuste feito: tempo de chegada e de avanço dos inimigos × 3,5 e intervalo entre ondas de 1,2 s para 3 s. Sobra de erro: a fase 1 sai lenta (45 s contra 32 s) e o ritmo aos 5 min 12% acima. Não consegui acertar as duas coisas com três números; a tabela do engenheiro (abates por minuto, tempo entre ondas, tempo por fase) deve fechar isso. O ritmo calibrado fica em 23-24 abates por minuto em todas as eras.

**Dia de término por era** (mediana; 40 min por dia mais offline; 31 a 41 partidas)

| Era | Grátis | VIP opção B | Pagante completo | Otimizador | Grátis com o `eraMult` antigo | VIP B com o `eraMult` antigo |
|---|---|---|---|---|---|---|
| 0 | 1 | 1 | 1 | 1 | 1 | 1 |
| 1 | 2 | 2 | 1 | 2 | 3 | 2 |
| 2 | 5 | 4 | 4 | 5 | 9 | 7 |
| 3 | 11 | 8 | 7 | 11 | 20 | 14 |
| 4 | 21 | 16 | 15 | 20 | 37 | 27 |
| 5 | 37 | 26 | 23 | 36 | 53 | 38 |
| 6 | **59** | **43** | 27 | 58 | 73 | 49 |
| Faixa do fim | 55-65 | 39-50 | 26-29 | 51-62 | 68-76 | 47-53 |

- Mantendo o `eraMult` da v7 e a XP antiga, o ritmo real leva o grátis ao dia 73 (nível 90 no fim) e o VIP ao dia 49.
- `eraMult` da v7.1: 0,944 · 0,777 · 2,19 · 6,72 · 32 · 112 · 412, junto com XP de abate 2,2 / chefe 33 / Senhor da Era 264.
- **Pagante completo**: VIP B, 2 skins Lendárias, coleção cheia e itens no teto por diamante; ~185 mil diamantes em nível de item; termina no nível 90.

**Grátis no fim de cada era**

| Era | Tempo ativo | Nível | FC | Nível dos itens (arma / colete / chapéu / luvas / botas / colar / asa) | Forja |
|---|---|---|---|---|---|
| 0 | 16 min | 12 | 1,44 mil | 12 em todos | +0 |
| 1 | 55 min | 18 | 12,3 mil | 18 em todos | +4 |
| 2 | 1,8 h | 27 | 395 mil | 27 em todos | +7 |
| 3 | 3,8 h | 45 | 13,9 mi | 45 em todos | +9 |
| 4 | 6,6 h | 72 | 829 mi | 72 / 72 / 72 / 71 / 70 / 70 / 70 | +11 |
| 5 | 10,2 h | 88 | 34,3 bi | 88 / 87 / 87 / 87 / 73 / 74 / 72 | +12 |
| 6 | 14,9 h | 100 | 1,54 tri | 94 / 96 / 96 / 95 / 71 / 73 / 71 | +14 |

FC no fim do jogo: ATK 67%, HP 29%, DEF 3%; o crítico vale 32% e a velocidade de ataque 29%. Por espaço (queda sem o item): arma 50%, luvas 28%, colete 26%, botas 20%, colar 18%, asa 17%, chapéu 15%.

**Respostas às perguntas desta rodada**

| Pergunta | Resposta |
|---|---|
| O ouro ainda falta da era 5 em diante? | Menos. Com 3,5^era, arma, colete, chapéu e luvas terminam no nível 94-96 (antes 87); botas, colar e asa ficam em 71-73. |
| As pedras ainda sobram? | Não. Com 0/1/2/4/10 ficam ~18 paradas no fim. Agora faltam um pouco: a forja fecha as eras em +4, +7, +9, +11, +12 e +14, contra tetos de +6, +9, +9, +12, +12 e +15. |
| Invocação a 1.000 × 4^era | O grátis faz 332 invocações no jogo (antes 1.115): 22 até o fim da era 1, 85 até a era 2, 221 até a era 3. Preço adequado. |
| Teto de 400% no dano crítico é necessário? | Não para o grátis nem para o pagante simulado: o dano crítico termina em ~240% (base incluída). Como trava de segurança não custa nada: a curva não muda (dia 60 contra 59). |
| Velocidade de ataque | O grátis termina com +76%. O ritmo de abates não muda (23-24 por minuto em todas as eras): quem limita é a chegada dos inimigos. O efeito é na energia: cada golpe básico dá 4, então a ultimate carrega quase 2× mais rápido no fim, e no pior caso de 143% (golpe a cada 0,33 s) encheria em ~8 s. Recomendo teto de 100%; testado, não muda a curva do grátis. |
| DEF dá sobrevivência? | Pouca e caindo: reduz o golpe do inimigo comum em 42% na era 0, 31% na era 3 e 21% na era 6; contra o Senhor da Era, 9% na era 0 e 3% na era 6. Sem o colete a redução é ~0 a partir da era 2. Proposta: DEF-base do colete de 4 para 8 e `defK` de 3 para 2, o que leva a ~54% contra o comum e ~14% contra o chefe (conta, não simulação; pede recalibrar o `eraMult`). |

**Otimizador: correção.** O simulador da v7 **não** aplicava a regra "ovo de instância repetido em 5★ vira ração"; o teto de 1 ovo de instância por dia ele já aplicava. Os ~36 ovos de golem vinham da subida em cadeia dos ovos de instância, que não existe no jogo. Corrigido: 10,3 ovos de golem, golem em 3★ e fênix em 2,9★ (política "fênix depois do golem 3★"), fim no dia 58.

**Pets do jogador normal (v7.1)**: 4,6 ovos de golem, golem em 2,7★ e fênix em 1,5★; primeiro golem no dia 28 e fênix no dia 47. Com a regra do ovo de instância, a meta "fênix ~2★" fica um pouco abaixo para quem não otimiza.

**Paredes e atalhos que restam**
- Botas, colar e asa ficam ~25 níveis atrás no fim (ouro).
- A forja não chega ao teto em quatro das sete eras.
- A arma fica presa em Épico entre os níveis 70 e 85 (sem Mítica de arma).
- O `eraMult` vai de 0,78 a 412; é número de calibração e depende do ritmo medido.

**Hipóteses e limites**
- Calibração do ritmo feita com uma única medida de 5 minutos na era 0; vale refazer com a tabela do engenheiro.
- XP de abate × 2,2 para manter os níveis aprovados (12, 18, 27, 45, 72, 88, 100) no ritmo real; instância, missão e offline sem mudança.
- "Equipar e upar": o jogador troca quando o ouro (com os 50% do desmonte) leva o item novo acima do antigo.
- Inimigos sem DEF; grátis com 2 skins Básicas por era; pagante com 2 Lendárias e coleção cheia; a chave extra do VIP vira mais um Chefe de Era por dia.
- Montaria e passe premium não foram refeitos na v7.1.
- Medianas de simulação, não medição com jogadores.

| Pri | Recomendação |
|---|---|
| P0 | Engenheiro medir abates por minuto, tempo entre ondas e tempo por fase nas eras 0 e 1; refaço a calibração com isso. |
| P0 | Aplicar o `BAL` v7.1 com a XP de abate em 2,2 / 33 / 264. |
| P1 | Teto de 100% na velocidade de ataque e de 400% no dano crítico. |
| P1 | DEF do colete 8 e `defK` 2, com nova calibração. |
| P1 | Rever a renda de pedra de forja (faltam poucas) ou aceitar a forja abaixo do teto. |
| P1 | fps-e2 trocar as âncoras da torre pelas FCs novas. |

## 5. Economia de duas moedas

| | Moedas (poder) | Diamantes (aparência) |
|---|---|---|
| **Vende por dinheiro?** | Nunca | Sim (única venda, além do passe) |
| **Fontes** | abates e chefes; venda de itens; missões; trilha grátis do passe; ganhos offline | grátis: 10 por fase, 30 por era nova, ~44/dia em missões, 180 na trilha grátis do passe (cerca de 60-90 por dia); pago: pacotes |
| **Ralos** | melhorias; invocar equipamento; loja diária de itens | skin direta na vitrine; passe premium; (sorteio de skin só se a lei permitir, ver seção 9) |

| Pri | Recomendação |
|---|---|
| P0 | Mover "Invocar equipamento" para moedas e **tirar moedas da trilha Premium do passe** (hoje `passPrem` dá 5 diamantes + moedas). São os dois vazamentos de pay-to-win. Rodada 2: a curva v2 foi calibrada com a invocação por diamantes, como está no código. Simulado sem ela, o total quase não muda (dia 63 em vez de 64); só a era 0 alonga de 19 para 41 min, o que se corrige com uma invocação por moedas. |
| P0 | Frase fixa na loja: "Diamantes compram só aparência. Poder se ganha jogando." |
| P1 | Preços de skin direta `[40, 90, 200, 450, 900]` (hoje `[30, 60, 120, 250, 500]`): com ~75 diamantes grátis por dia, uma Lendária leva ~12 dias. Meta longa para quem não paga, sem obrigar a pagar. |
| P1 | Ralo de moedas de fim de jogo: trocar moedas por "tingimentos" simples de skin, para as moedas não perderem sentido. |
| Evitar | Terceira moeda, energia/estamina para jogar, VIP, multiplicador de moedas pago, extensão paga do teto offline. |

## 6. Skins e raridades

| Pri | Recomendação |
|---|---|
| P0 | Raridade = quanto a skin chama atenção (sprite T0/T1/T2, brilho, cor dos efeitos, aura). Nunca atributo, nem bônus de coleção em poder. |
| P0 | **Experimentar antes de comprar**: botão "Ver na luta" que equipa a skin por 30 s. |
| P1 | Recompensas de coleção só visuais: moldura de perfil, título, cor do nome, pose na tela inicial. |
| P1 | Conjuntos (arma + roupa da mesma era/raridade) liberam um efeito visual extra da ultimate. |
| P1 | Repetida vira 10 diamantes (hoje 5) ou "pó" para comprar uma skin à escolha. |
| P2 | Skins de evento por tempo limitado, sempre com retorno anunciado (sem "nunca mais"). |

## 7. Missões e passe

Referências: no Legend of Mushroom quase todo sistema tem passe com trilhas grátis, US$ 4,99 e US$ 9,99 (o analista estima ~US$ 100/mês para acompanhar tudo, e isso é criticado); o passe do AFK Arena custava US$ 24,99.

| Pri | Recomendação |
|---|---|
| P0 | **Um passe só**, temporada de 28 dias, trilha premium apenas com skins, efeitos e diamantes. As missões já rendem 160 XP/dia: 30 níveis em ~19 dias, folga saudável. |
| P0 | Trocar "Avance 2 fases" (impossível em dia de parede nas eras 4+) por "Derrote 1 chefe" ou "Use a ultimate 5 vezes". |
| P1 | 3 missões semanais maiores (ex.: "Vença 15 chefes") para quem falha um dia. |
| P1 | Passe comprado no fim da temporada entrega tudo já conquistado; mostrar a data de término. |
| P1 | Preço sugerido: R$ 14,90 a R$ 19,90. Testar. |
| Evitar | Vários passes; pular nível do passe por dinheiro logo no lançamento; missão que obriga a gastar diamantes. |

## 8. Leilão de skins (P2, não agora)

**Riscos**: (1) hoje o save fica no aparelho (localStorage) e qualquer um edita: leilão exige servidor com inventário oficial; (2) fraude, contas falsas e duplicação de itens; (3) venda por dinheiro real fora do jogo e uso para lavagem; (4) menores negociando com desconhecidos (o ECA Digital restringe interação e exige proteção); (5) Apple: itens presenteados "só podem ser reembolsados ao comprador original e não podem ser trocados", e toda moeda comprada precisa ficar dentro do app; (6) estorno de compra depois que a skin já foi vendida; (7) suporte e moderação diários.

**Pré-requisitos**: conta com login e save na nuvem; servidor que valida compras; separar diamante ganho de diamante comprado; taxa de 5-10% por venda (ralo); faixa de preço mínima e máxima por raridade; conta com idade mínima e limite diário; registro de todas as transações; termos de uso e canal de denúncia; parecer jurídico.

**Caminho mais barato primeiro**: "Mercado do Viajante", vitrine rotativa do próprio jogo com skins antigas. Dá a sensação de mercado sem nenhum dos riscos.

## 9. Publicação: regras das lojas e lei (conferido nas páginas oficiais em 11/2026)

| Tema | Regra | O que fazer |
|---|---|---|
| **Loot box no Brasil** | ECA Digital, art. 20: vedadas caixas de recompensa em jogos direcionados a crianças e adolescentes ou de acesso provável por eles. Definição (art. 2º): compra, mediante pagamento, de itens ou vantagens aleatórias sem saber o conteúdo. Multa de até 10% do faturamento ou até R$ 50 milhões por infração. Notícias de 2026: o Ministério da Justiça subiu para 18 anos jogos com loot box e pediu à ANPD análise de seis títulos. | **P0**: no Brasil, não vender sorteio. Skin por compra direta e passe. Sorteio de skin só com bilhete ganho jogando (não comprável). Como diamante grátis e pago se misturam, o mais seguro é tirar o sorteio pago de vez. Validar com advogado. |
| Chances de sorteio | Google: divulgar as chances antes da compra. Apple 3.1.1: divulgar as chances de cada tipo de item antes da compra. | Se houver qualquer sorteio, manter a tabela de chances visível na tela (já existe) e por item. |
| Compras no app | Google: itens digitais e moedas virtuais usam o Google Play Billing; moeda só vale dentro do jogo. Apple 3.1.1: compra no app obrigatória; moeda comprada não expira; precisa de "restaurar compras". | **P1**: servidor ou serviço de compras antes de vender. Diamante comprado nunca expira. |
| Comissão | Google: 15% até US$ 1 mi/ano, 30% acima. Apple Small Business Program: 15% até US$ 1 mi/ano (é preciso se inscrever). | Considerar 15% + impostos no preço. |
| Custos de conta | Google Play: US$ 25 uma vez. Apple Developer Program: US$ 99/ano. | Android primeiro. |
| Conta pessoal nova no Google | Teste fechado com no mínimo 12 testadores por 14 dias seguidos antes de pedir produção; revisão de ~7 dias; pode pedir documento e verificação por aparelho Android. | **P1**: começar a juntar 12-20 testadores já (amigos, família, grupos). |
| Nível de API | Apps novos e atualizações devem mirar Android 16 (API 36) desde 31/08/2026. | Usar Capacitor/Bubblewrap atualizados. |
| Classificação etária | Google: questionário IARC no Console. Apple: novas faixas 4+, 9+, 13+, 16+, 18+ (questionário novo obrigatório). Brasil: classificação indicativa passou a considerar interatividade (Portaria MJSP 1.048/2025 e Decreto 12.880/2026). | Responder com honestidade: violência de fantasia leve, compras no app, sem chat. Sem loot box e sem chat, a faixa fica baixa. |
| Privacidade / LGPD | Apple: link da política de privacidade na loja e dentro do app; se houver conta, exclusão de conta dentro do app. Google: formulário "Segurança dos dados". ECA Digital: lojas devem aferir idade e pedir consentimento dos pais para download por menores. LGPD art. 14: dados de crianças exigem consentimento de um responsável. | **P1**: política de privacidade simples em português. Hoje o jogo não coleta dado pessoal (save local): manter assim no lançamento, sem SDK de anúncios nem identificador de publicidade. Se entrar login, exclusão de conta no app. |
| App "site embrulhado" | Apple 4.2: o app precisa ir além de um site reempacotado. | No iOS: funcionar offline, vibração, compra nativa, sem barra de navegador. |

## 10. Empacotamento: PWA → loja

| Etapa | O que é | Custo | Observações |
|---|---|---|---|
| **1. PWA (agora)** | `manifest.webmanifest`, `sw.js` e ícones já entregues. Hospedar em HTTPS. | Hospedagem estática costuma ter plano grátis (Cloudflare Pages, GitHub Pages; confira os limites). Domínio ~R$ 40-80/ano, opcional. | Serve para testar com amigos por link e "Adicionar à tela inicial". Sem loja não há venda. |
| **2a. Android via TWA** (Bubblewrap ou PWABuilder) | O PWA dentro de um app Android que abre o Chrome sem barra. | US$ 25 da conta. | Exige HTTPS e Digital Asset Links. Venda só pelo Play Billing, via Digital Goods API (Chrome 101+), com validação de compra em servidor. Não gera app de iPhone. |
| **2b. Android + iOS via Capacitor** (recomendado) | O mesmo HTML/JS dentro de um app nativo, com plugins. | US$ 25 + US$ 99/ano; Mac (ou serviço de build na nuvem) para iOS. | Um código para as duas lojas; vibração e compras nativas. RevenueCat cuida de compras e restauração: grátis até US$ 2.500/mês de receita, depois 1%. |
| **3. Servidor mínimo** | Login, save na nuvem, validação de compra. | Planos grátis de Firebase/Supabase costumam bastar no início. | Necessário antes de vender qualquer coisa: sem isso, skin comprada some ao trocar de aparelho. |

Ordem sugerida: PWA por link → teste fechado no Google Play (Capacitor) → lançamento Android em um país → iOS.

**Requisitos técnicos P0 antes de mostrar a testadores**
- Peso: cenários `assets/bg/era*.png` têm 4-7 MB cada. Converter para WebP de 1280 px (≤ 300 KB) e o `title_bg` idem. Primeira carga abaixo de ~5 MB.
- Save: campo de versão + migração; cópia de segurança (exportar/importar código) enquanto não há nuvem.
- Offline: ao voltar, usar a diferença de relógio com teto de 8 h e ignorar relógio que andou para trás.
- Áudio destravado no primeiro toque; pausar tudo com a aba oculta (já no contrato de áudio).
- `sw.js`: aumentar `VERSION` a cada publicação que troque arquivos de `assets/`; não registrar com `?debug=1`.

## 11. Som e efeitos: o que mais dá sensação de qualidade

Ordem de impacto por esforço (prática comum de "game feel"; não é dado de pesquisa):

| Pri | Recomendação |
|---|---|
| P0 | **Pausa de impacto**: congelar 50-80 ms no crítico e ~120 ms na ultimate. É o efeito mais barato e o que mais muda a sensação de peso. |
| P0 | **Ultimate como evento**: escurece o fundo, câmera lenta de 0,3 s, clarão, tremor forte, som grave longo, número de dano grande. A música abaixa durante o golpe. |
| P0 | Som de moeda com tom subindo em sequência de abates; som distinto para Raro, Épico e Lendário (o Lendário para tudo por 1 s). |
| P0 | Número de dano com "pulo" e cor por tipo (branco, amarelo crítico, cor da raridade na ultimate); tremor proporcional ao golpe, nunca constante. |
| P0 | Música mais baixa que os efeitos (cerca de -12 dB) e controles separados de música e efeitos. Muita gente joga com música desligada e efeitos ligados. |
| P1 | Vibração curta no crítico e longa na ultimate (opção para desligar). |
| P1 | Abertura de invocação em 3 tempos: suspense → cor da raridade → revelação. Botão "pular". |
| P1 | Toque de botão com som e leve encolhimento (95%) em toda a interface. |
| P2 | Camadas de música: a trilha ganha percussão no chefe. |

## 12. O que eu NÃO faria agora

- **Leilão entre jogadores**: exige servidor, moderação e parecer jurídico (seção 8).
- **Sorteio pago de skin e "pacotes x10"**: risco legal direto no Brasil.
- **PvP, ranking, guilda e chat**: precisam de servidor contra trapaça e moderação; chat com menores é o ponto mais sensível do ECA Digital. No Legend of Mushroom, rankings sem mecanismo de alcance e chat tóxico estão entre as críticas.
- **Anúncios**: mesmo os opcionais pedem SDK, política de dados e classificação mais cuidadosa. Só depois de medir retenção.
- **iOS no primeiro lançamento**: custo anual, Mac e revisão mais rígida.
- **Mais eras, heróis ou modos**: primeiro provar que as 7 eras seguram o jogador.
- **Reescrever em Unity/Godot**: o HTML atual serve para validar; trocar de motor antes de ter jogadores é meses de trabalho sem aprendizado.
- **Energia/estamina, VIP, ofertas com contagem regressiva, pop-up de oferta ao abrir**: são as práticas mais criticadas do gênero e contradizem a promessa "sem pay-to-win".
- **Liberar x4**: encurta o jogo em ~25% (de 64 para 48 dias) e inviabiliza o uso manual da ultimate.

**Expectativa honesta de receita**: só cosmético rende menos por jogador que gacha de poder. No Brawl Stars, tirar as caixas coincidiu com queda estimada de 14% em 5 meses (com outros fatores juntos), e a recuperação posterior (receita 8,8x) veio de um conjunto de mudanças no passe e no jogo. O modelo funciona com volume e passe forte. Metas de retenção para acompanhar: mediana do mercado D1 ~22% e D7 ~4%; 10% melhores D1 ~40% e D7 ~12% (GameAnalytics, via resumo de terceiros); para idle, D1 ≥ 40% e D30 ~6% (AppQuantum, via PocketGamer.biz).

## 13. Fontes

Jogos e design
- Legend of Mushroom, análise: https://deconstructoroffun.com/blog/2024/4/15/the-magic-of-legend-of-mushroom
- AFK Arena, análise: https://www.deconstructoroffun.com/blog/2019/6/6/afk-arena-puts-lilith-into-the-billionaire-club
- AFK Arena → AFK Journey (simplificação de sistemas): https://www.pocketgamer.biz/game-analysis-the-evolution-of-idle-rpg-systems/
- AFK Journey, teto de 16 h de ganhos offline (guia de terceiros): https://gameleap.com/articles/afk-journey-best-afk-rewards-tips-for-fast-progression
- Críticas de jogadores ao Legend of Mushroom (agregadores): https://gamebrain.co/game/legend-of-mushroom · https://justuseapp.com/en/app/6475333787/legend-of-mushroom/reviews
- Uso com uma mão: https://smashingmagazine.com/2020/02/design-mobile-apps-one-hand-usage/ · https://gamedeveloper.com/design/how-to-design-for-thumbs-in-the-era-of-huge-screens
- Brawl Stars sem loot box: https://www.deconstructoroffun.com/blog/why-removing-loot-boxes-in-brawlstars-failed · https://mobilegamer.biz/supercell-explains-brawl-stars-big-comeback-from-an-all-time-low-to-8-8x-revenue/
- Retenção: https://blog.playio.co/d1-d7-d30-retention-benchmarks-2026 · https://www.pocketgamer.biz/marketing-a-new-mobile-game-where-should-studios-start/

Lojas (páginas oficiais)
- Google Play, teste fechado de 12 testadores/14 dias: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play, política de pagamentos e loot box: https://support.google.com/googleplay/android-developer/answer/9858738
- Google Play, taxas de serviço: https://support.google.com/googleplay/android-developer/answer/112622
- Google Play, registro (US$ 25): https://support.google.com/googleplay/android-developer/answer/6112435
- Google Play, nível de API: https://developer.android.com/google/play/requirements/target-sdk
- Apple, App Review Guidelines (3.1.1, 4.2, 5.1.1, 2.3.6): https://developer.apple.com/app-store/review/guidelines/
- Apple, Small Business Program: https://developer.apple.com/app-store/small-business-program/
- Apple Developer Program (US$ 99/ano): https://developer.apple.com/programs/whats-included/
- Apple, novas faixas etárias: https://developer.apple.com/news/?id=ks775ehf
- TWA + Play Billing (Digital Goods API): https://developer.chrome.com/docs/android/trusted-web-activity/receive-payments-play-billing
- RevenueCat, preços: https://www.revenuecat.com/pricing/

Brasil
- Lei 15.211/2025 (ECA Digital), texto oficial: https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm
- Vigência e resumo: https://www12.senado.leg.br/noticias/materias/2026/03/17/eca-digital-para-protecao-on-line-de-criancas-e-adolescentes-entra-em-vigor · https://www.machadomeyer.com.br/pt/inteligencia-juridica/publicacoes-ij/direito-digital/estatuto-digital-da-crianca-e-do-adolescente-lei-n-15-211-2025-entra-em-vigor-em-17-de-marco-de-2026
- Classificação indicativa após o ECA Digital: https://agenciagov.ebc.com.br/noticias/202604/classificacao-indicativa-principais-mudancas-no-primeiro-mes-do-eca-digital
- Pedido de análise de loot boxes à ANPD: https://focusgn.com/brasil/justica-anpd-investigacao-loot-boxes
- LGPD (Lei 13.709/2018): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm

**Não confirmado nesta pesquisa**: teto de 12 h de ganhos offline do AFK Arena (só achei 16 h para o AFK Journey); análise dedicada do Cat Hero e do Idle Heroes; números de retenção específicos de idle RPG em fonte primária; texto do Decreto 12.880/2026; página da LGPD e a de nível de API não foram reabertas (citadas por conhecimento e por resultado de busca); limites atuais dos planos grátis de hospedagem e de servidor. Itens legais são leitura de leigo: validar com advogado.
