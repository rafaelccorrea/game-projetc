# Curva de 9 eras: a parte da fps-e2 (nível, XP, VIP, FC recomendada, Divino, estágios do Kael)
Base: docs/CURVA_9_ERAS.md (fps-c9) e reports/curva-9-eras-30.md (fps-30, XP de abate por dia). 2026-11-12.
**Tudo atrás de chave DESLIGADA:** `Sys.level.setV9(true)` (nível 120, curva nova, teto diário, estágios do Kael, coluna de XP do VIP) e
`Sys.stats.setEra9(true)` (eras 7-8, item até o Nv 120, raridade Divino). Desligadas, nada muda (testado).

**CONTA x TESTE.** Conta = simulação dia a dia (`node` sobre as tabelas reais dos módulos; roteiro na pasta temporária da fps-e2, posso
copiar para tools/ se alguém quiser rodar). Nada foi medido no jogo. **Testado** (node test/sys/e2.test.js, 22 testes; as outras suítes verdes):
liga/desliga, a curva não cai em nenhum nível, Nv 1-12 iguais à curva medida, o teto diário (cheio/30%/10%, zera no dia novo, só na XP de
abate), a XP do VIP no v9, os estágios do Kael (nível E FC) e o Divino ×1,8 sobre o Lendário.

## 0. Premissas (mudar estas muda tudo)
- "Todo dia" = 40 min ativos + 8 h offline + as 6 diárias + 8 instâncias (VIP 12) no Normal. XP de ABATE por dia (inclui chefes, Senhor e baú)
  = a conta da fps-30: 3.663 / 3.180 / 3.024 / 3.934 / 3.909 / 4.854 / 4.846 / 4.842 / 5.799 (eras 0-8, grátis).
- XP do Sys.level (minha): missão 30 e bônus 50 por dia, instância 25 × 1,6, offline 20/h, tudo × (1 + era), como hoje.
- O jogador vence cada fase quando chega ao nível-trava dela (a FC recomendada foi feita para fechar nesse nível; ver §3).

## 1. Calendário resultante (dia em que termina cada era)
| Era | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Alvo grátis (fps-c9) | 1 | 4 | 11 | 23 | 41 | 66 | 98 | 136 | 180 |
| **Grátis (conta)** | 1 | 3 | 10 | 22 | 40 | 65 | 97 | 135 | **179** |
| Alvo VIP | 1 | 3 | 8 | 16 | 28 | 45 | 66 | 91 | 120 |
| **VIP 10 (conta)** | 1 | 3 | 8 | 16 | 28 | 45 | 66 | 92 | **121** |
| VIP 5 (conta) | 1 | 3 | 9 | 19 | 33 | 52 | 77 | 106 | 140 |
| VIP 1 (conta) | 1 | 3 | 10 | 21 | 37 | 59 | 88 | 121 | 160 |
| Grátis jogando o DOBRO (80 min) | 1 | 3 | 9 | 19 | 35 | 57 | 84 | 118 | 156 |

- Quem joga o dobro adianta **15%** (alvo: no máximo ~25%). VIP 10 jogando o dobro: 112 dias (8% mais rápido que o VIP 10 normal).
- O grátis fica 1 dia adiantado em cada era (arredondamento do dia 1); mexo só se o PO quiser o dia exato.

## 2. Curva de XP 1-120 e teto diário
- Nv 1-12: a curva medida de hoje (era 0 em 15-18 min). Nv 12-120: em cada era, **XP do nível = XP/dia do grátis × dias da era**, repartida
  em progressão geométrica que começa 2% acima do último nível da era anterior (ou em 80% da média da era, o que for maior).
  Sem queda; os degraus ficam na ENTRADA das eras (Nv 25 ×1,76, Nv 40 ×1,47, Nv 100 ×1,39): é a "parede de nível" de cada era.
- Total até o 120: **1,74 milhão de XP** (hoje, até o 100: 0,96 milhão). Amostra: Nv 12 = 710 · 25 = 1.920 · 40 = 4.340 · 55 = 7.160 · 70 = 12.150 ·
  85 = 19.030 · 100 = 31.990 · 110 = 50.040 · 119→120 = 57.370. A tabela inteira está em `Sys.level.DATA.v9.xpToNext`.
- **Teto diário da XP de abate** (`addXp(S, n, host, 'kill')`): cheia até T da era (os 40 min do grátis, × o XP do VIP), **30%** de T a 2T, **10%**
  acima. `Sys.level.killCap(S, host)` → `{full, used, left, rate}` para a tela ("XP cheia até ..."). Missão, instância, offline, pacotes e a
  **XP descansada do bônus de retorno não têm teto** (a fps-30 manda a parte descansada sem o 'kill').

## 3. FC recomendada por era (conta com Sys.fc/Sys.stats: 7 espaços na raridade-teto, item no nível do jogador, forja coerente; sem pet,
práticas, skins e títulos, que viram a FOLGA de quem farma)
| Era | Níveis | Raridade-teto | Forja | FC de entrada (fase 1) | Chefe do meio (fase 5) | Senhor da Era (fase 10) |
|---|---|---|---|---|---|---|
| 0 | 1-12 | Básico → Raro (10) | +2 | 370 | 730 | 1.720 |
| 1 | 12-25 | Raro | +4 | 2.430 | 7.110 | 27.200 |
| 2 | 25-40 | Épico (25) | +5 | 41.300 | 183.000 | 1,18 mi |
| 3 | 40-55 | Épico | +7 | 1,67 mi | 5,78 mi | 27,3 mi |
| 4 | 55-70 | Épico | +8 | 37,7 mi | 121 mi | 523 mi |
| 5 | 70-85 | Mítico (70) | +10 | 763 mi | 3,09 bi | 17,7 bi |
| 6 | 85-100 | Lendário (85) | +12 | 27,1 bi | 135 bi | 1,00 tri |
| 7 | 100-110 | Lendário → Divino (105) | +13 | 1,48 tri | 6,32 tri | 38,9 tri |
| 8 | 110-120 | Divino | +15 | 53,1 tri | 169 tri | 719 tri |

- Cada fase pede ×1,15 a ×1,55 a mais que a anterior (progressão geométrica da entrada ao Senhor). Nível-trava por fase: entrada + (fase−1)/10 da
  faixa de níveis da era (ex.: era 3 = 40, 42, 43, 45, 46, 48, 49, 51, 52, 54). A tabela por fase vai para a fps-c9 pôr no balance.json.
- O Senhor de cada era = a entrada da era seguinte (contínuo). O salto ×30 na troca de era é o 12^era dos itens: só fecha com itens da era nova.
- **Paredes (2 por era, a partir da era 2):** (1) **fase 5**: pede os itens da era nova no nível do jogador (garimpar drop da era + transformar
  com Essência); (2) **fase 10 (Senhor)**: pede o nível-trava + a raridade-teto em todos os espaços + a forja da era. Eras 3-4 (Épico, ~30 dias):
  a busca é **qualidade/fusão e item adormecido** (ver §6). Uma 3ª parede quando chega raridade nova: Mítico (Nv 70, entrada da era 5),
  Lendário (Nv 85, entrada da era 6), Divino (Nv 105, meio da era 7).

## 4. VIP: progresso por dia ≤ 1,5x
| VIP | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Progresso/dia vs grátis (`prog9`) | 1,13 | 1,16 | 1,20 | 1,25 | 1,30 | 1,34 | 1,38 | 1,42 | 1,46 | **1,50** |
| % de XP no v9 (`xp9`) | 1 | 5 | 8 | 12 | 3 | 6 | 9 | 12 | 15 | 19 |
- Soma do que rende XP: +1 entrada por área (+50% de instâncias), x4 no VIP 5+ e Nv 40 (passa pelo teto diário: +30% dos abates), e o % de XP.
  No v9 o offline em dobro do VIP 5+ vale para pedras, ração e ouro, **não para a XP** (com ele o VIP 5 ia a 1,41x e o 10 a 1,77x).
- O % de XP CAI do VIP 4 para o 5 porque o x4 já rende. **A tela deve mostrar o "progresso" (coluna prog9), que só sobe.** O ouro continua na coluna antiga.
- Nenhum nível passa de 1,51x em nenhuma era (conta). Diamante nunca compra VIP (regra registrada; o vip.js não tem compra por diamante).

## 5. Estágios do Kael (`Sys.level.stage(S, host)` → {on, stage 0-3, id, name, next:{lvl, fc, needLvl, needFc}, ready}; `evolve(S, host)`)
| Estágio | Gatilho (nível E FC) | Fase em que cai | Dia grátis | VIP 5 | VIP 10 |
|---|---|---|---|---|---|
| 0 Garoto | início | — | 1 | 1 | 1 |
| 1 Adolescente | **Nv 22 + FC 15 mil** | era 1, fase 8 (FC 15,9 mil) | **2** | 2 | 2 |
| 2 Adulto | **Nv 35 + FC 400 mil** | era 2, fase 7-8 | **8** | 7 | 6 |
| 3 Guerreiro lendário | **Nv 70 + FC 600 mi** | entrada da era 5 | **40** | 33 | 28 |
- O pet abre no Nv 20 (decisão do dono): pus o adolescente no **22** para os dois eventos não caírem juntos (cada um com a sua animação; ~2-3 h de jogo
  entre eles no dia 2). Nunca desce; `ready` = a tela toca a evolução e chama `evolve`. **Só visual** (sem bônus; o PO não pediu).
- Asas no Nv 50 (`Sys.stats.DATA.wing.minLevel`): confere com a tabela; o 50 cai na era 3 (dia ~15 grátis).

## 6. Críticas e o que confirmar
1. **Portões x nível de entrada:** Mítico (Nv 70, era 4+) e Lendário (Nv 85, era 5+) só chegam na SAÍDA das eras 4 e 5 (o nível da entrada da era
   seguinte). Na prática o Mítico é da era 5 e o Lendário da era 6. O PO aceitou o teto Épico nas eras 3-4; a FC acima já considera isso.
2. **Qualidade/fusão e item adormecido estão CODADOS mas DESLIGADOS** (`Sys.stats.DATA.quality.on`, `futureEra.on`; o drop futuro da fps-30 exige
   os dois). Para as eras 3-4 terem o que buscar, precisam ser ligados junto com a curva. Peso: 5★ = até +30% em todos os atributos do item
   (≈ 1 fase); um item adormecido de +1 era no Nv 1 rende como um item da era atual no Nv ~45: é o "achado raro" do trecho.
3. **Divino** (r 5): planos ×1,8 e % ×1,23 sobre o Lendário, 2 secundários. Portão Nv 105 + era 7 e peso 0,05 no drop = fps-30 (já avisada).
4. **Raridade do pet "Divina"** continua em aberto (Submundo/Celestial são Lendários até o dono decidir).
5. 6 meses não se medem jogando: eras 3-8 são só conta. O teto diário depende do relógio; a trava contra relógio adiantado é da fps-30 (`Sys.clock`).
