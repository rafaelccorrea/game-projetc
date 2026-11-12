# Relatório — UX / Pesquisa / Balanceamento (12/11/2026)

## Rodada 7.3: trava no Senhor da Era 0, validada no jogo real
Só análise e documentos. Alterados: `docs/balance.json` (v7.3), `docs/RECOMENDACOES.md` (seção 4) e este relatório. Nenhum arquivo do jogo foi editado: os testes sobrescreveram o `BAL` em memória, na página.

- **Como testei**: build v0.8.1 em `localhost:8080/?debug=1&fresh=1`, batalha acelerada com `step(0.05)` pelo navegador; perfis A (sem melhorar, MANUAL), B (melhora a cada 30 s, MANUAL) e C (melhora sempre, AUTO). Os scripts em `C:\Users\rafae\AppData\Local\Temp\qa_tests` testam só os módulos; o jogo inteiro eu rodei pela página.
- **Causa**: herói com ATK 54 e HP 671 (nível 11, itens no teto) precisa de ~26 s para matar o Senhor (2.331 de HP) e morre em ~10 s. Melhorar item quase não ajuda no começo.
- **Correção**: `eraBossHpMult` 2 → 1,1 e `eraBossDmgMult` 1,4 → 0,9. Perfil C: antes não passava (ou 29,6 min com 19 derrotas); depois passa em 8,6-11,1 min com 1-2 derrotas, 13 de 13 partidas. A e B (sem usar habilidade) continuam presos.
- **Eras 1 e 2**: era 1 passa (35 a 103 min de jogo, 26 a 100 derrotas); era 2 era parede com `eraMult` 2,19 e passa com 1,44 (202 min de jogo, 194 derrotas, 1 partida). `eraMult` novo: 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161 (eras 3 a 6 só do simulador).
- **Erro meu na v7.1**: calibrei o ritmo com uma medida da v0.7 que não se repetiu; a v0.8.1 mede 27,7 abates por minuto de jogo e o simulador original dava 27,0. Os dias por era da v7.1 não valem; ~59 e ~43 dias não foram revalidados.
- **Achados**: mochila cheia desmonta o item novo (jogador trava na troca de era); avanço por derrota repetida nas eras 1 e 2; nível 34 no fim da era 2 com a XP em 2,2.
- **Não feito**: curva de nível do item da fps-e2; recalibração das eras 3 a 6 no jogo real; cenários de VIP, pagante e otimizador; perfis A e B com outras correções.

---
## Rodada 7.1 (histórico; ritmo errado): ritmo calibrado contra a build e decisões do PO
**v7.2 (só o arquivo, sem simulação nova):** `docs/balance.json` alinhado aos módulos de js/sys: DEF do colete 8 e defK 2, tetos de velocidade de ataque 100 e de dano crítico 400, golem repetido → 7 fragmentos de fênix, pedra de forja do comum a 1%, energia da ultimate normalizada (nota). DEF, forja a 1%, N = 7 e energia normalizada não foram simulados; os tempos e as FCs continuam os da v7.1.
Só análise e documentos. Alterados: `docs/balance.json` (v7.1), `docs/RECOMENDACOES.md` (seção 4) e este relatório. Simulador: `C:\Users\rafae\AppData\Local\Temp\tools\eonbound-sim\sim7.js`, com `calib.js` (teste do jogador novo).

**Veredito**: com o ritmo calibrado e o `eraMult` refeito (0,944 · 0,777 · 2,19 · 6,72 · 32 · 112 · 412), grátis no dia 59 (55-65) e VIP opção B no dia 43 (39-50). A XP de abate precisa ir a 2,2 / 33 / 264 para manter os níveis aprovados.

| Cenário | Dia de término por era | Fim (faixa) |
|---|---|---|
| Grátis | 1 · 2 · 5 · 11 · 21 · 37 · 59 | 55-65 |
| VIP opção B | 1 · 2 · 4 · 8 · 16 · 26 · 43 | 39-50 |
| Pagante completo | 1 · 1 · 4 · 7 · 15 · 23 · 27 | 26-29 |
| Otimizador | 1 · 2 · 5 · 11 · 20 · 36 · 58 | 51-62 |
| Grátis com o `eraMult` da v7 e a XP antiga | 1 · 3 · 9 · 20 · 37 · 53 · 73 | 68-76 |
| VIP B com o `eraMult` da v7 e a XP antiga | 1 · 2 · 7 · 14 · 27 · 38 · 49 | 47-53 |

- **Calibração**: chegada e avanço dos inimigos × 3,5 e 3 s entre ondas. Jogador novo aos 5 min: simulador nível 6, fase 6, baú 139/250, 0 derrotas; jogo nível 5, fase 6, baú 124/250, 1 derrota. A fase 1 ainda sai lenta (45 s contra 32 s).
- **Erro meu na v7**: o teste do jogador novo reiniciava a onda a cada 5 s; refeito, o simulador sem calibrar previa nível 10 e fase 11 aos 5 min (não nível 9 e fase 9).
- **Erro meu na v7 (otimizador)**: o simulador não aplicava "ovo de instância repetido em 5★ vira ração". Corrigido: 10,3 ovos de golem, golem 3★, fênix 2,9★, fim no dia 58.
- **Ouro**: com 3,5^era os espaços de atributo plano terminam no nível 94-96; botas, colar e asa em 71-73.
- **Pedras**: não sobram mais (~18 paradas); a forja fica 1 a 2 pontos abaixo do teto em quatro eras.
- **Invocação a 1.000**: 332 no jogo (antes 1.115).
- **Tetos**: 400% no dano crítico e 100% na velocidade de ataque não mudam a curva do grátis (240% e +76% no fim).
- **DEF**: reduz o golpe do comum em 42% → 21% da era 0 à 6, e o do Senhor da Era em 9% → 3%.
- **FC do grátis no fim de cada era**: 1,44 mil · 12,3 mil · 395 mil · 13,9 mi · 829 mi · 34,3 bi · 1,54 tri.
- **Não feito**: montaria e passe premium na v7.1; tabelas de farm; simulação da proposta de DEF; calibração com a tabela do engenheiro (ainda não existe).

---
## Rodada 7 (histórico; números substituídos pela 7.1): 7 espaços, nível do item, skin e VIP com poder
Só análise e documentos. Alterados: `docs/balance.json` (v7), `docs/RECOMENDACOES.md` (seção 4 e aviso no cabeçalho) e este relatório. Simulador: `C:\Users\rafae\AppData\Local\Temp\tools\eonbound-sim\sim7.js` (o `sim6.js` da v6 fica ao lado).

**Veredito**: a meta do grátis fecha (dia 59, faixa 55-65; níveis 11, 17, 26, 45, 73, 88, 100). A do VIP não fecha com os benefícios provisórios (dia 30). Fecham: opção A (+10% de ATK e HP, baú 12, +1 chave, x3; sem bônus de XP e ouro e sem offline em dobro: dia 44) e opção B (+10%, +25% de XP e ouro, offline em dobro, baú 12, +1 chave, x2: dia 41).

| Cenário | Dia de término por era | Fim (faixa) |
|---|---|---|
| Grátis | 1 · 2 · 5 · 12 · 22 · 37 · 59 | 55-65 |
| VIP provisório | 1 · 1 · 3 · 5 · 10 · 18 · 30 | 28-34 |
| VIP opção A | 1 · 1 · 4 · 7 · 15 · 26 · 44 | 41-47 |
| VIP opção B | 1 · 2 · 4 · 8 · 16 · 26 · 41 | 39-46 |
| Grátis + montaria 10% | 1 · 2 · 5 · 11 · 21 · 36 · 57 | 54-61 |
| Grátis + montaria 20% | 1 · 2 · 5 · 10 · 20 · 35 · 55 | 51-60 |
| Pagante completo | 1 · 1 · 3 · 5 · 9 · 13 · 15 | 14-15 |
| Otimizador | 1 · 2 · 5 · 11 · 21 · 37 · 57 | 55-62 |

- **FC do grátis no fim de cada era**: 1,24 mil · 12,3 mil · 462 mil · 14,1 mi · 810 mi · 26,0 bi · 972 bi.
- **FC no fim do jogo**: ATK 61%, HP 35%, DEF 4%; crítico vale 24% e velocidade de ataque 19%; por espaço (queda sem o item): arma 47%, colete 31%, luvas 24%, chapéu 17%, botas, colar e asa 10% cada.
- **Custos mantidos**: ouro 20 × 1,06^(N−1) × (1 + 0,6r) × 4^era; diamante teto(2 × 1,04^(N−1) × (1 + 0,6r)); ×1,04 por nível.
- **Pagante completo**: ~177 mil diamantes em nível de item; termina no nível 87 do jogador.
- **Achados**: ouro sobra até a era 3 e vira invocação (971 até a era 3); equipar automático pela FC real rejeita o item da era nova; botas, colar e asa não dependem da era mas custam 4× por era; pedras de desmonte sobram; otimizador leva a fênix a 5★.
- **Passe**: grátis fecha os 30 níveis entre o dia 25 e o 27 (29 perdendo 1 dia por semana); premium no dia 21 (24). Cabem 2 temporadas. Trilha grátis e skin da temporada não mexem na curva; Item da Temporada sem subir de era leva o fim ao dia 56, e subindo de era ao dia 46.
- **Item da Temporada, regra final do PO** (acompanha a era só até o fim da temporada): 2 passes premium levam o fim ao dia 55 (51-58), contra 59 do grátis; o ganho vem da era 5.
- **Garantia da invocação**: limitar ao Épico não muda a curva (dia 60); o preço é que está barato.
- **Simulador contra a build v0.7** (jogador novo, x2, sem melhorar item): previsto fim da fase 1 em 25 s e, aos 5 min, nível 9, fase 9, 0 derrotas, 271 abates; medido 32 s, nível 5, fase 6, 1 derrota, baú 124/250. O simulador está ~2,2 a 2,5× otimista no ritmo de abates; os dias valem como proporção entre cenários.
- **Não feito**: recalibrar a montaria; medir o pacote de skins do pagante em separado; preço novo da invocação (só sugerido); comparação com o jogo rodando.

---
## Rodada 6: nível do jogador, portões de raridade e farm
Só análise e documentos. Alterados: `docs/balance.json` (v6), `docs/RECOMENDACOES.md` (seção 4) e este relatório.

**Simulador**: o scratchpad da sessão foi apagado durante a rodada (não por mim) e os simuladores anteriores se perderam. Reescrevi tudo num arquivo só, agora em `C:\Users\rafae\AppData\Local\Temp\tools\eonbound-sim\sim6.js` (`node sim6.js eval <params.json>` ou `tune`). Conferi a reescrita contra a v5.2: sem nível nem portões ela dá fim no dia 63 (a v5.2 dava 61-62).

| Era | Tempo ativo | Termina no dia | Nível do jogador (p10 · med · p90) | FC no fim |
|---|---|---|---|---|
| 0 | 20 min | 1 | 11 · 11 · 11 | 687 |
| 1 | 47 min | 2 | 16 · 17 · 18 | 21,8 mil |
| 2 | 2,1 h | 5 | 26 · 26 · 27 | 1,03 mi |
| 3 | 3,8 h | 11 | 42 · 43 · 47 | 20,9 mi |
| 4 | 6,7 h | 21 | 72 · 73 · 75 | 652 mi |
| 5 | 9,7 h | 36 | 85 · 87 · 91 | 25,3 bi |
| 6 | 15,7 h | 61 | 99 · 100 · 100 | 538 bi |

- **Impacto dos portões**: com o `eraMult` antigo o fim iria do dia 63 para o 89, com parede nas eras 3 e 4. Recalibrado: 0,547 · 1,7 · 6,68 · 12 · 26 · 58,2 · 178, fim no dia 61 (53-65).
- **3 atacantes**: `commonAtkInterval` 1,2 e `commonDmgMult` 0,33 mantêm os 61 dias.
- **XP**: curva de 99 valores no arquivo (acumulado 650 no nível 10, 32,5 mil no 25, 264 mil no 70, 960 mil no 100); abate 1, chefe 15, Senhor da Era 120, `eraScale` 1, `stageScale` 0,05; instância 25 (× dificuldade), missão 30, bônus 50, offline 20 por hora. Abates dão 88,8% da XP.
- **Só farmando**: parado na era 0 chega ao nível 40 no dia 40; parado na era 2, ao 96 no dia 60. A condição de era segura Mítico e Lendário.
- **Golem**: 1º no dia 23 (antes dia 3). Metas de estrelas fecham: golem 3,0★ e fênix 2,5★ na política "fênix depois do golem 3★".
- **Garantia de Épico** antes do nível 25 entrega Raro.
- **Não feito**: montaria e jogador otimizador com as regras da v6; comparação com o jogo rodando.

---
## Rodada 5.2: jogador "otimizador" (3 chaves no Chefe de Era Difícil)
Regras novas lidas em `js/sys/instances.js`: no máximo 1 ovo de instância por dia e sorte de +1 do Difícil em 10%; fênix repetida em 5★ vira 10 fragmentos de golem. O resto é a v5.1. Pelo módulo, o Difícil abre junto com a era; simulei a partir da fase 9 da era 0.

| Política | Normal: golem / fênix | Otimizador: golem / fênix |
|---|---|---|
| Tudo no golem | 4,2★ / 1,5★ | 5,0★ / 4,9★ |
| Fênix depois do golem 2★ | 2,0★ / 2,9★ | 2,0★ / 5,0★ |
| Fênix depois do golem 3★ | 3,0★ / 2,6★ | 3,0★ / 5,0★ |

- Otimizador: ~45 ovos de instância no jogo (0,78 por dia), 0,4 a 0,5 Lendária no jogo inteiro (~0,05 por semana), ~38 ovos de golem (normal: ~10), fim no dia 58-59 (normal: 61-62), ~1.300 rações paradas no fim.
- O teto de 1 ovo por dia não segura a fênix: com os três pets de baixo em 5★, quase todo ovo de instância sobe em cadeia até virar golem.
- Correção mais simples testada: ovo de instância repetido em 5★ não sobe de raridade. Otimizador: golem 3,0★ / fênix 3,3★, fim no dia 62; normal: golem 3,0★ / fênix 1,9★, fim no dia 61.
- Alternativa testada: golem repetido vale +1 de fênix. Otimizador 3,0★ / 3,1★; normal 3,0★ / 1,6★.
- As duas correções foram medidas só na política "fênix depois do golem 3★".

---
## Rodada 5: regras finais do pet (ovos, fragmentos, ração)
**v5.1 (checagem final):** com +5 de fênix por golem repetido, torre dando 1 fragmento por andar do 101 ao 110 e fragmentos guardados, as estrelas finais [lobo, coruja, dragãozinho, golem, fênix] são: tudo no golem 4,7 / 4,9 / 4,9 / 4,2 / 1,5; fênix depois do golem 2★: 4,5 / 4,9 / 4,9 / 2,0 / 2,9; fênix depois do golem 3★: 4,6 / 4,9 / 4,9 / 3,0 / 2,6. Fim no dia 61-62. Os números de estrelas abaixo são os da v5 (N = 10) e ficam como histórico.
Só análise e documentos. Alterados: `docs/balance.json` (v5), `docs/RECOMENDACOES.md` (seção 4) e este relatório. A curva e o `eraMult` são os da rodada 4; fim no dia 61-62 (58-66).

- **Ração** (instância 5/7/10, offline 5): fecha no total, 1.649 contra 1.615 de custo. O pet chega ao teto em 27%, 56% e 97% do tempo das eras 4 a 6, mas ainda cedo nas eras 0 a 3.
- **Estrelas no fim** [lobo, coruja, dragãozinho, golem, fênix], Chefe de Era no Normal, 41 partidas por política: tudo no golem 4,7 / 4,9 / 4,9 / 4,2 / 1,6; fênix depois do golem 2★: 4,5 / 4,9 / 4,9 / 2,0 / 3,7; fênix depois do golem 3★: 4,6 / 4,9 / 4,9 / 3,0 / 3,4.
- **Ovos de golem**: ~10 por partida (a estimativa da fps-30 era ~4,5), pela subida em cadeia dos repetidos em 5★.
- **Torre**: andar final 105; "1 a cada 10" dá 0 fragmento e "1 por andar de 101 a 110" dá 5; nenhum muda as estrelas.
- **Chefe de Era Difícil todo dia**: 17 ovos de golem, fênix em 4,9★.
- **FCs de fim de era**: 1,56 mil · 62,3 mil · 2,31 mi · 50,7 mi · 1,14 bi · 20,3 bi · 428 bi; nenhuma mudou mais de 10% sobre a v4.
- **Hipótese nova**: fragmentos de fênix ganhos antes do andar 100 ficam guardados.
- **Não feito**: evento; cenários de montaria não foram refeitos com as regras novas do pet (as tabelas de `eraMult_montaria` são as da v4).

---
## Rodada 4 (curva em vigor; regras do pet substituídas pela rodada 5): recalibração final do lançamento
Só análise e documentos; não editei `index.html` nem `js/`. Arquivos alterados: `docs/balance.json` (v4), `docs/RECOMENDACOES.md` (seção 4) e este relatório. Simulador: o mesmo `sim3.js` da rodada 3, com teto de baús, ração nova, nível máximo 60 e sorteio de ovos.

**Regras aplicadas**: baú a cada 250 abates com teto de 8 por dia; ração com comum 0,4%, baú "10% de 1" e offline 10; missão de 15 pedras de forja; nível máximo 60; fênix com vínculo 0,9·p e cura 0,11·p; práticas da fps-e2 com pedra em 8%; ovos e fragmentos sorteados pela seção 5 da spec da fps-30.

| Era | Tempo ativo | Termina no dia | FC mediana no fim | Mudança da FC sobre a v3 |
|---|---|---|---|---|
| 0 | 17 min | 1 | 1,71 mil | −9% |
| 1 | 50 min | 3 | 66,0 mil | −32% |
| 2 | 1,8 h | 4 | 2,18 mi | −17% |
| 3 | 4,5 h | 12 | 50,8 mi | −6% |
| 4 | 6,4 h | 22 | 1,14 bi | −5% |
| 5 | 11,8 h | 40 | 20,1 bi | −7% |
| 6 | 15,0 h | 62 | 427 bi | −2% |

**`eraMult`**: sem montaria 1,0 · 3,63 · 11,2 · 27 · 53,1 · 79,7 · 139 (dia 62); montaria +10%: 1,0 · 3,9 · 12,2 · 27,8 · 55,8 · 83,7 · 148 (dia 62); montaria +20%: 1,0 · 4,46 · 13,3 · 30,2 · 60,2 · 90,3 · 153 (dia 61; o último valor foi ajustado de 161 para 153 e só a era 6 foi medida de novo).

**Conferências**
- Ração: ainda sobra 60-90% (ganha 2.534 contra 1.615 de custo); o pet chega ao teto de nível no começo de cada era. A instância (15 por dia) é a maior fonte; sugiro 5, e offline 5.
- Missão de 15 pedras: alcançável em 99-100% dos dias com o Arsenal e 95-100% sem ele.
- Pets: 4 / 8 / 13 / 18 / 25 / 33 / 42 ovos até o fim de cada era; fênix em 61 de 61 partidas, sempre pelo andar 100, no dia 41 (mínimo 34); estrelas médias no fim: lobo 4,9, coruja 4,9, dragãozinho 4,4, golem 2,4, fênix 1,0.
- Nível de melhoria termina em 49 de 60.

**Não feito**: os efeitos isolados e o cenário sem pet não foram refeitos com o baú novo (os da rodada 3 valem como ordem de grandeza); nada foi comparado com o jogo rodando.

---
## Rodada 3 (histórico; a curva foi recalibrada na rodada 4): curva do lançamento com práticas, títulos, torre, pet e montaria
Só análise e documentos; não editei `index.html` nem `js/`. Arquivos alterados: `docs/balance.json` (v3), `docs/RECOMENDACOES.md` (seção 4 refeita) e este relatório. A rodada 2, logo abaixo, fica como histórico: a tabela dela não vale mais.

**Simulador**: `C:\Users\rafae\AppData\Local\Temp\claude\1702e4710d254e5b\94b8bc35-b3e4-4779-929e-a93060f160a7\scratchpad\sim\sim3.js` (motor), com `tune4.js` (calibração) e `final3.js` / `final4.js` (cenários) na mesma pasta. Fontes lidas: `js/sys/practice.js`, `titles.js`, `tower.js`, `chest.js`, `fc.js`, `reports/sys-estado.md`, `reports/spec-fortalecimento.md`, `reports/spec-loot-bau-instancias.md` (seções 4 e 5) e `reports/spec-pet-fc.md` (rev. 2).

**Dia em que o grátis termina cada era** (mediana; 40 min por dia + offline; 41 a 61 partidas)

| Era | A. Sem extras | B. Lançamento (práticas, títulos, torre, pet) | B sem pet | C. B + montaria 10% | D. B + montaria 20% |
|---|---|---|---|---|---|
| 0 | 1 | 1 | 1 | 1 | 1 |
| 1 | 2 | 2 | 2 | 2 | 3 |
| 2 | 5 | 6 | 6 | 5 | 5 |
| 3 | 11 | 11 | 12 | 10 | 9 |
| 4 | 22 | 21 | 26 | 20 | 17 |
| 5 | 37 | 40 | 49 | 35 | 31 |
| 6 | 61 | 61 | 85 | 56 | 50 |

A usa a tabela `eraMult` de "sem extras"; B, C e D usam a do `BAL`. Tempo ativo por era em B: 25 min, 53 min, 2,0 h, 3,6 h, 7,1 h, 11,8 h, 14,8 h.

**Efeito isolado** (sobre A, fim no dia 61): práticas 0,5% → dia 29; títulos × 0,5 → dia 49; torre → dia 39; montaria 10% → dia 48; montaria 20% → dia 40; os três primeiros juntos → dia 17; práticas com os valores do código → dia 13. Pet mediano sobre o pacote sem pet (dia 62) → dia 49; fênix no teto → dia 44.

**Teto de práticas**: aceitei os valores da fps-e2 (0,5% / 0,5% / 0,1 pt / 0,15% / 0,5% por nível; teto 10 + 10 por era, ou seja +5% a +35% de ATK e HP). Drop comum mantido em 8%: leva ao teto em 75-81% do tempo das eras 3 a 5; com 2% o jogador termina no nível 61 de 70.

**FC mediana do grátis no fim de cada era** (cenário B): 1,88 mil · 96,4 mil · 2,62 mi · 53,8 mi · 1,20 bi · 21,6 bi · 435 bi. Fórmula: ATK × 5 × (1 + crítico) × (1 + p do pet) + HP ÷ (1 − defesa), no instante em que o Senhor da Era cai.

**Validações pedidas**
- Missão "Colete 5 pedras de forja": alcançável em 100% dos dias em todas as eras (20 a 33 pedras por dia sem baú, 54 a 100 com baú). Trivial; sugiro 15 ou 30.
- Teto de forja em pares × degrau por era: mesmo fim (dia 61).
- Ração: sobra 3 a 7 vezes; o pet fica no teto de nível desde o começo de cada era.
- Cura da fênix: lutas duram ~11-12 s, não 20 s; a cura vale 0,6·p.
- 28 armas: sem efeito mensurável.

**Alertas**
- Nível de melhoria termina em 49 de 50; sem pet vira teto (dia 85). Folga: `maxLvl` 60 ou `upCostGrowth` 1,20.
- Baú a cada 40 abates dá ~50 baús por dia na curva longa (+50% de ouro, ~200 itens, ~60 pedras de forja, ~75 rações).
- A era 0 do cenário B saiu em 25 min na validação (alvo 17-20).

**Hipóteses**: montaria como % de ATK e HP a partir da era 1; pet do grátis fixado por era (lobo → dragãozinho → golem, nível no teto), sem sortear ovos; torre a 1,5 andar por fase; títulos sem arena e com bônus 0 para skin, montaria e pet; baú aberto assim que enche; três chaves diárias em Arsenal, Chefe de Era e Mina. Lista completa em `hipoteses` do `balance.json`.

**Não feito**: sorteio de ovos e fragmentos, arena, Caverna de Cristal, desmontar item; comparação com o jogo rodando.

---
## Rodada 2 (histórico; substituída pela rodada 3): balanceamento refeito sobre a regra "a era manda mais que a raridade"
Só análise e documentos. Não editei `index.html` nem `js/` (lidos para conferir as fórmulas). Arquivos alterados: `docs/balance.json` (v2), `docs/RECOMENDACOES.md` (seção 4 refeita; números antigos corrigidos nas seções 0, 0b, 3, 5 e 12) e este relatório.

**Simulador novo**: `C:\Users\rafae\AppData\Local\Temp\claude\1702e4710d254e5b\94b8bc35-b3e4-4779-929e-a93060f160a7\scratchpad\sim\sim2.js` (motor), com `tune3.js` (calibração por era) e `final2.js` (cenários) na mesma pasta. O `sim.js` da rodada 1 continua lá, mas não vale mais.
Conferido contra o código atual: `BAL`, `mkEnemy`, `waveSpec`, `lootFor`, `waveClear` e `step` em `js/battle.js`; `power`, `upCost`, `sellVal`, `heroStats`, `doPull`, missões e passe em `index.html`; presente inicial, tutorial e offline em `js/meta.js`. Fortalecimento conforme `reports/spec-fortalecimento.md`; limite de 3 visíveis por decisão do PO (ainda não está no código).

**Tempo por era, jogador grátis (mediana; "depois" = 40 min por dia + offline, 101 partidas)**

| Era | Antes: código de hoje (x1) | Regra nova sem recalibrar | Depois: tempo ativo | Termina no dia | Faixa p10-p90 | Sem fortalecimento |
|---|---|---|---|---|---|---|
| 0 | 8 min | 21 min | 19 min | 1 | 9-41 min | 21 min |
| 1 | 11 min | 21 min | 41 min | 2 | 15-72 min | 40 min |
| 2 | 15 min | 15 min | 1,8 h | 5 | 34 min-3 h | 2,8 h |
| 3 | 21 min | 11 min | 4,2 h | 12 | 1,5-7,3 h | 5,6 h |
| 4 | 14 min | 13 min | 6,8 h | 21 | 3,5-16,5 h | 21,6 h |
| 5 | 17 min | 9 min | 12 h | 39 | 6,6-16,8 h | 33 h |
| 6 | 13 min | 8 min | 16,5 h | 64 | 10,9-21,8 h | não termina em 300 h |
| Total | 1,6 h | 1,6 h (dia 4) | 42 h | ~64 dias | | trava |

Jogando sem parar (sem offline): 28 min, 1,7 h, 2,6 h, 8,3 h, 20,8 h, 38,5 h e 2,3 dias. Com 2 h por dia: zera no dia ~39.

**Como cheguei à proposta** (três tentativas; a última é a recomendada)
1. Spec ao pé da letra (nível no item, +20% do valor base por nível, custo +38%): calibrável na mediana, mas 24 de 101 partidas não terminam em 400 h e o p90 de uma era chega a dias. Fica no arquivo como `BAL_spec_como_aprovada`, só para comparação.
2. Nível no item com bônus multiplicativo: o item antigo de nível alto passa a valer mais que o item da era nova, o jogador fica melhorando a arma velha (mais barata) e a tabela por era fica instável. Descartado.
3. **Nível no espaço** (igual ao fortalecimento), +8% por nível, custo +19%, Épico garantido a cada 10 invocações: 101 de 101 terminam, faixa de sorte de 2 a 5 vezes, nível 47 de 50 no fim da era 6.

**Conflitos entre a regra nova e as specs** (detalhe e proposta de cada um na seção 4 do RECOMENDACOES e em `conflitos` do balance.json)
1. Com nível no item, a Básica da era nova costuma perder para o item antigo já melhorado e é descartada: a regra não aparece na prática.
2. Nível no item + fórmula linear gera parede de sorte.
3. Pedras de forja sobram 2 a 3 vezes; quem limita é o teto por era.
4. Missão "Fortaleça 1 vez" fica impossível com o jogador no teto.
5. Tetos em pares de eras concentram o ganho nas eras 2, 4 e 6. Custos de pedra e de ouro por tentativa não precisam mudar com o fator 12.
6. Preços em 4^era não precisam ser revistos (acompanham o ouro, que segue em 1,15 por fase).
7. Fortalecimento na armadura está em aberto; só na arma o jogo vai de 64 para ~80 dias.
8. Skin mexe em poder: golpes do Especial (energia) e alcance de arma de fogo vêm da skin.
9. Curva da torre foi pensada para o fator 6.
10. Práticas (até +140% na era 6), títulos, montaria e VIP estão fora da conta.
11. Limite de 3 visíveis ainda não está no código.

**Pendências desta rodada**
- **Decisão do PO**: nível de melhoria no espaço (conflito 1). A curva recomendada depende disso.
- O `balance.json` v2 **não está ativo de propósito**: os valores ficam em `"BAL"`, que o loader de hoje não lê, para não quebrar o jogo congelado. Ativar junto com as 8 mudanças de código listadas no arquivo.
- Montaria e VIP seguem como parâmetro (`mountPct`, `vipPct`): +10% de montaria leva o fim de 64 para 54 dias; VIP +30% com x3 e offline em dobro termina no dia ~18.
- O simulador não foi comparado com o jogo rodando. Simplificações: herói sempre corpo a corpo, Ultimate usada assim que enche, posições viram tempos de chegada. Fora da conta: loja de moedas, baú, desmontar, torre, instâncias.

---
# Rodada 1 (mantida como histórico; a parte de balanceamento abaixo foi substituída pela rodada 2)

## Entregas
| Arquivo | O que é |
|---|---|
| `docs/RECOMENDACOES.md` | Recomendações P0/P1/P2 (novato, HUD, 3 ataques, eras, economia, skins, passe, leilão, som, lojas/lei, empacotamento, "o que eu NÃO faria"), tabela de tempo por era antes/depois e fontes com link. |
| `docs/balance.json` | Constantes propostas, com fórmula de uso em cada bloco e `_notas`. Nada lê esse arquivo ainda. |
| `manifest.webmanifest` | Eonbound, retrato, tela cheia (reserva: standalone), cores `#14110f`. |
| `sw.js` | Service worker: rede primeiro para página/js/json; cache primeiro com versão para `assets/`. |
| `assets/pwa/` | `icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`, `apple-touch-icon.png` (180), `favicon-32.png`. Feitos de `assets/hero/era2_t0.png` com sharp; conferidos visualmente; ~160 KB no total. |

Não usei Higgsfield (0 créditos). Não editei `index.html` nem `js/`.

## As 5 recomendações mais importantes
1. **Aplicar a curva de `balance.json`.** Hoje um jogador grátis zera o jogo em ~4,4 h (x1); com o combate V2 em ~70 min; com x4 em ~17 min. Proposta: era 0 em ~19 min, era 1 em ~41 min, depois 1,8 h → 3,2 h → 7,5 h → 13 h → 17 h de jogo ativo (dias 1, 3, 5, 12, 24, 50, 78 para quem joga 40 min por dia).
2. **Fechar os vazamentos de pay-to-win**: invocar equipamento com moedas (não diamantes) e tirar moedas da trilha Premium do passe. Atenção: a proposta nova de VIP/montaria com atributo contradiz essa premissa (ver seção 0b das recomendações; simulado, o VIP termina no dia ~18 contra ~78 do grátis).
3. **Tirar o sorteio pago de skins no Brasil.** O ECA Digital (Lei 15.211/2025, art. 20, em vigor desde 17/03/2026) veda caixas de recompensa pagas em jogos acessíveis a menores. Vender skin direta + passe. Validar com advogado.
4. **Roteiro dos primeiros 5 minutos**: abas liberadas aos poucos (hoje 7 de cara), mão apontando a ultimate no primeiro chefe (~30 s), primeira derrota (~min 4-5) virando aula de Melhorar/Invocar, e modo farm com botão "Desafiar chefe" no lugar de morrer em laço.
5. **HUD para o polegar**: abas no rodapé (máx. 5), botões de s2/s3 embaixo à direita com 64 px, alvos de toque ≥ 48 px.

## Balanceamento: como foi feito
- Simulador Node fora do projeto: `C:\Users\rafae\AppData\Local\Temp\claude\1702e4710d254e5b\94b8bc35-b3e4-4779-929e-a93060f160a7\scratchpad\sim\sim.js` (motor), `before.js` e `eval.js` (cenários), `tune.js` e `calib2.js` (calibração). Exemplo: `node eval.js "{}" 101`.
- Reproduz as fórmulas do `index.html` v0.2 lidas antes da refatoração (inimigo, item, melhoria, ouro, drops, diamantes, missões, passe grátis) e o combate V2 (s1 1x/0,8 s; s2 3x/6 s; s3 10x por energia).
- Achado principal: com a melhoria linear (+20% do valor base por nível, custo +38%), endurecer os inimigos criava parede: 1% a mais de dificuldade chegou a multiplicar o tempo por 10. Por isso a proposta troca a melhoria para +10% por nível (multiplicativa) e usa um multiplicador de inimigo por era como botão de dificuldade.
- Tabela completa antes/depois: `docs/RECOMENDACOES.md`, seção 4.

**Limites que o dono deve conhecer**
- Os tempos são medianas de simulação, não medição com gente. A sorte pesa: na era 3, de 1,3 h (10% mais sortudos) a 14 h (10% mais azarados).
- A proposta inclui 4 mudanças de código além de números (marcadas `mudanca_de_codigo` no JSON): multiplicador por era, melhoria multiplicativa, invocação com moedas, ganhos offline. Sem elas os tempos não valem.
- O simulador não foi conferido contra o jogo rodando (o `index.html` estava em refatoração); a caminhada do inimigo foi estimada em 3 s. Não inclui a loja de moedas, o VIP, a montaria, baús nem instâncias da proposta nova.
- Com a curva nova o jogador morre muito (mediana de 27 mortes na era 0, ~2.000 na era 6): o modo farm é parte da proposta, não opcional.

## PWA: o que o engenheiro precisa ligar
No `<head>` do `index.html`:
```html
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="assets/pwa/favicon-32.png">
<link rel="apple-touch-icon" href="assets/pwa/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Eonbound">
```
No fim do script principal:
```js
if ('serviceWorker' in navigator && !/[?&](debug|nosw)=1/.test(location.search)) {
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
```
- **Enquanto os agentes ainda trocam assets, não registrar em `localhost:8080`** (ou usar sempre `?debug=1`): imagens e áudio ficam em cache até `VERSION` mudar no `sw.js`. Para limpar: DevTools → Application → Service Workers → Unregister + Clear storage.
- A cada publicação que troque arquivos em `assets/`, aumentar `VERSION` (`v1` → `v2`).
- O `sw.js` não intercepta: outros domínios, POST, pedidos com `Range` (áudio em streaming) e a página com `?debug=1`.
- `start_url` é `./?source=pwa` porque o servidor local redireciona `/index.html` e perde a query.

**Verificação feita**: `node --check sw.js`; manifest e balance.json são JSON válidos; os três tipos de arquivo respondem 200 em `localhost:8080`; a lógica do `sw.js` foi exercitada em Node com `caches`/`fetch` simulados (13 casos: online, offline com e sem cache, 404 não fica em cache, POST/outro domínio/Range/debug não interceptados).
**Não feito**: instalar o PWA num celular ou registrar o SW num navegador real (evitei para não deixar cache preso no servidor que os outros agentes usam). Testar no S24 Ultra depois do deploy em HTTPS: instalar, abrir em tela cheia, modo avião.

## Pesquisa: lacunas
- Boas fontes: análise do Legend of Mushroom e do AFK Arena (Deconstructor of Fun), páginas oficiais de Google, Apple e Planalto.
- Não achei: análise dedicada do Cat Hero e do Idle Heroes; teto de 12 h do AFK Arena (só 16 h do AFK Journey, em guia de terceiros); retenção de idle RPG em fonte primária. A parte de "game feel" (som/efeitos) é prática comum, não dado de pesquisa.
- Itens legais são leitura de leigo das páginas oficiais; não substituem advogado.

## Pendências
- Decisão do dono: manter "sem pay-to-win" ou adotar VIP/montaria com poder. As duas não cabem no mesmo jogo, e o balanceamento depende da resposta.
- Recalibrar `balance.json` depois que o engenheiro ligar as constantes e houver 10-20 testadores.
- Cenários `assets/bg/era*.png` (4-7 MB cada, segundo o relatório do engenheiro) precisam virar WebP ≤ 300 KB antes de qualquer teste em rede móvel.

## Disco
Temporários meus apagados. Ficaram só os scripts do simulador e do gerador de ícones no scratchpad (~25 KB). Disco C: com ~9,8 GB livres (98% cheio) ao terminar.
