# Especificação: PET na FC (sem código)
Autor: fps-e2. Revisão 2, de 2026-11-12, com a decisão do dono registrada em docs/CONTRATO_V2.md: **pets NO LANÇAMENTO**, 5 pets (fase 4),
15 na spec e 10 em atualização; **nível do pet no ESPAÇO** (compartilhado entre pets), estrelas por pet. A revisão 1 chegou a marcar esta
spec como pós-lançamento; isso foi revertido pelo PO.
Requisito: companheiro que luta ao lado do herói (não é montaria), ataca sozinho a cada ~2 s, 1 equipado por vez, **fora do fator 12 por era**,
contribuição limitada a **~20% da FC total**.

## 1. Força do pet RELATIVA ao herói
O herói fica 12x mais forte por era; o pet não sobe de era. Com atributos próprios fixos, viraria enfeite a partir da era 2. Por isso o pet
tem uma **participação** `p` (fração da força do herói):

`p = 0,25 × R[raridade do pet] × L(nível do ESPAÇO do pet) × E(estrelas DESTE pet)`
- `R = [0,40; 0,55; 0,70; 0,85; 1,00]` (Básico, Raro, Épico, Mítico, Lendário)
- `L(n) = 0,40 + 0,60 × (n − 1) / 49` (Nv 1 = 40%, Nv 50 = 100%). **O nível é do espaço**: trocar de pet mantém o nível, e a ração
  investida nunca se perde (mesma lógica do nível de melhoria e do fortalecimento).
- `E(s) = 0,75 + 0,05 × s` (0★ = 75%, 5★ = 100%); as estrelas são de cada pet (fragmentos de repetidos).

## 2. Os 5 pets do lançamento e como cada tipo reparte o p
| Pet | Raridade | Tipo | Golpe do pet (dano) | Vínculo (+HP do herói) | Extra |
|---|---|---|---|---|---|
| Filhote de lobo | Básico | ⚔️ Ataque | 1,5·p | 0,5·p | — |
| Coruja | Raro | ✨ Suporte (coleta) | 0,5·p | 0,5·p | +p×100% de ouro e pedras (fora da FC) |
| Dragãozinho | Épico | ⚔️ Ataque | 1,5·p | 0,5·p | — |
| Golem de cristal | Mítico | 🛡️ Defesa | 0,5·p | 1,5·p | — |
| Fênix | Lendário | ✨ Suporte (cura) | 0,5·p | 0,9·p | cura = 0,6·p (conta na FC, lado da vida) |
- **Golpe do pet:** a cada 2,0 s, no inimigo da frente: `ATK final do herói × fator de dano × 2,0 / 0,8`, com o crítico do herói. Com fator 1
  ele dá `p` do dano do ataque básico. **Não dá energia de Ultimate** e não é alvo dos inimigos.
- **Vínculo:** passivo de +`fator × 100`% de HP do herói.
- **Cura da fênix:** a cada golpe, cura `0,11·p` do HP máximo do herói. A simulação 3 mediu ~11 s por onda (~12 s na do chefe), ou seja,
  ~5,5 golpes: +`0,6·p` de vida por onda, e é assim que entra na FC (decisão do PO: cura de 0,6·p). Para a fênix ficar ACIMA do golem
  (pedido do PO), o vínculo dela é 0,9·p: dano 0,5 + vínculo 0,9 + cura 0,6 = 2,0·p, igual aos pets de combate.
  Conta: com parteATK ≈ parteHP, o pet vale `p × (dano + vínculo + cura) / 2` da FC do herói. Golem: 0,2125 × 2 / 2 = 0,2125 (17,5% da
  total). Fênix: 0,25 × 2,0 / 2 = 0,25 (20,0%). Com o vínculo em 0,5, a fênix ficaria em 0,20, abaixo do golem.
- Ataque, Defesa e a fênix somam a mesma força (2·p no total; a fênix com mais vínculo, porque a cura vale só 0,6·p). A coruja soma 1·p e rende coleta: FC menor de propósito, porque coleta
  não é força de combate. A tela precisa mostrar "FC menor, rende mais ouro", senão parece o pior pet.
- Com isso, o Lendário nunca fica abaixo do Mítico (a fênix, sem a cura na FC, ficaria; por isso a cura conta).

## 3. Teto de 20% (garantido para qualquer tipo)
FC do pet = `parteATK × dano + parteHP × (vínculo + cura)`, travada em **0,25 × FC do herói**, então a parte do pet fica ≤ 25/125 = **20%**.
Valor máximo de `p` por pet (Nv 50 do espaço, 5★) e a parte aproximada da FC total (quando parteATK ≈ parteHP; a trava garante o teto em qualquer caso):
| Pet | p máximo | Parte da FC total no máximo |
|---|---|---|
| Lobo (Básico) | 0,100 | 9,1% |
| Coruja (Raro) | 0,138 | 6,4% (FC menor; + coleta) |
| Dragãozinho (Épico) | 0,175 | 14,9% |
| Golem (Mítico) | 0,213 | 17,5% |
| Fênix (Lendário) | 0,250 | 20,0% |

## 4. Como entra no fc.js (no papel; código congelado)
- `Sys.pet.bonus(S) → {hpPct: 100·(vínculo), petAtk: 100·(fator de dano), petHp: 100·(cura), goldPct: 100·(coleta)}`, com estado
  `S.sys.pet = {lvl: <nível do espaço>, eq: <id>|null, owned: {<id>: {stars, frags}}}`.
- Chaves novas na convenção: `petAtk` e `petHp` (pontos %). O fc.js:
  1. NÃO aplica `petAtk` ao ATK do herói (o dano do pet é separado, para não contar duas vezes);
  2. calcula a FC do pet = parteATK × petAtk/100 + parteHP × petHp/100 e trava em 0,25 × FC do herói;
  3. expõe `stats().pet = {atkShare, heal}` para a batalha calcular o golpe e a cura.
- `breakdown()` mostra "🐾 Pet +N FC"; `advice()` sugere "alimentar o pet" (nível do espaço) e "subir estrela".

## 5. Títulos de coleção de pets (regra: se não houver pet pago, podem dar atributo)
| Título | Condição | Bônus (já no corte × 0,5) |
|---|---|---|
| Amigo dos Bichos | ter 1 pet | +0,5% HP |
| Domador | ter 3 pets | +1% HP |
| Arca das Eras | ter os 5 pets do lançamento | +1% ATK, +1% HP |
| Laço Lendário | fênix com 5★ | +1 pt de crítico |
Contar por id de pet; quando os outros 10 chegarem, "Arca das Eras" passa a "ter todos". Se algum pet passar a ser pago, os quatro viram `cosmetic:true`.

## 6. Em aberto (outras sessões)
- Fontes de ovo, ração e fragmentos: seção 5 de reports/spec-loot-bau-instancias.md (fps-30). Torre: 1 ovo a cada 10 andares, Lendário
  (fênix) garantido no andar 100 (reports/sys-estado.md).
- Animação dos 5 pets (ataque a cada 2 s, voo da coruja/dragão/fênix, cura da fênix): fps-ff.
- Simulador: a simulação 3 já inclui o pet na FC (`× (1 + p)`) e mediu a onda em ~11 s (cura = 0,6·p, revisão desta spec).
- Torre/arena: no `duel`, o lado do jogador soma o golpe do pet ao ATK (ATK × (1 + fator de dano·p)) e o vínculo/cura ao HP; o fantasma
  não tem pet (a FC do andar já é a FC total).
  No máximo, a fênix pesa como uma "montaria +25%".

## Revisão 3 — PROPOSTA para o PO (2026-11-12; sistema DESLIGADO até a tela de pets ser aprovada; nada no código ainda)
Regras do dono: estrelas (1-5) = qualidade; nível = atributos; 3 estágios FILHOTE → MÉDIO → EVOLUÍDO por nível do pet, com salto de
atributos e aura própria; o pet ataca sozinho e sorteia, a cada ataque, BÁSICO / CRÍTICO ("tiro do pet") / MEDIANO.
**Consequências que esta proposta fecha:**
1. **O nível passa a ser de CADA pet** (não mais do espaço): evoluir por nível só faz sentido por pet (com nível compartilhado, os 5 evoluiriam juntos).
   Impacto na fps-30: a ração passa a ser gasta por pet.
2. **Nível máximo do pet: 90** (era 50), para caber o evoluído no 60. Teto por era proposto: 10 / 20 / 30 / 45 / 60 / 75 / 90 (médio na era 2,
   evoluído na era 4).
3. **Ração por nível: ⌈3 × 1,05^(N−1)⌉** (era 1,08). Com 1,08 e nível por pet até 90, cada pet custaria ~35 mil de ração; com 1,05, ~4,6 mil.

**Fórmulas (todas em DATA):**
- Estágio: médio no Nv 30 (×1,25 sobre a curva), evoluído no Nv 60 (×1,5 sobre a curva).
- Curva base: L(N) = 0,40 + 0,267·(N−1)/89 (vai a 0,667 no Nv 90, e ×1,5 do evoluído dá 1,0: o teto continua exato).
- p = 0,25 × raridade (0,40 … 1,00) × estrelas (0,75 + 0,05·★) × L(N) × estágio. O teto de 25% da FC do herói (= 20% da total) continua no fc.js.
- Qualidade q = metade pelas estrelas + metade pelo nível: q = 0,5·(★−1)/4 + 0,5·(N−1)/89 (0 a 1).
- Chances: CRÍTICO = 7% + 5%·q (7 → 12%); MEDIANO = 3% + 3%·q (3 → 6%); BÁSICO = o resto. Dano: básico 1x, mediano 2,5x, crítico 5x.
- Dano médio por ataque: ×1,325 (1★ Nv 1) até ×1,57 (5★ Nv 90). **Para o teto continuar em 20%**, o golpe do pet é dividido por 1,57
  (a média máxima): no máximo, o pet vale o mesmo de antes; abaixo do máximo, ele vale um pouco menos (no 1★ Nv 1, 84% do antigo).

**Tabela (fênix, Lendário):**
| Estrelas · nível | Estágio | Crítico | Mediano | Dano médio | p | Parte da FC total (máx.) |
|---|---|---|---|---|---|---|
| 1★ Nv 1 | filhote | 7,0% | 3,0% | ×1,32 | 0,080 | 7,4% |
| 1★ Nv 30 | médio | 7,8% | 3,5% | ×1,36 | 0,122 | 10,9% |
| 1★ Nv 60 | evoluído | 8,7% | 4,0% | ×1,41 | 0,173 | 14,8% |
| 3★ Nv 30 | médio | 9,1% | 4,2% | ×1,43 | 0,137 | 12,0% |
| 3★ Nv 60 | evoluído | 9,9% | 4,7% | ×1,47 | 0,195 | 16,3% |
| 5★ Nv 60 | evoluído | 11,2% | 5,5% | ×1,53 | 0,216 | 17,8% |
| 5★ Nv 90 | evoluído | 12,0% | 6,0% | ×1,57 | 0,250 | **20,0%** |
Os outros pets seguem a mesma conta com a raridade deles (ex.: lobo Básico 5★ Nv 90 = 9,1%).

**Continuam como estão:** a repartição por tipo (Ataque, Defesa, Suporte-coleta, Suporte-cura), o vínculo (+HP, contado dentro do teto) e a
cura da fênix (0,6·p por onda). O golpe crítico/mediano entra na parte de DANO; vínculo e cura não mudam com o sorteio.
**Efeito visual (regra do dono, para a fps-ff):** os efeitos do pet nunca ocupam mais tela que as habilidades do Kael (sem tremer a tela, sem
escurecer o fundo); no evoluído, o crítico e o mediano podem ter efeito mais bonito, ainda menor que o do Kael; cada estágio tem a aura dele.

## Revisão 5 — PRISMÁTICO com 1.000 fragmentos (dono via PO, 2026-11-12) — APROVADA pelo PO: evento 100, estrelas +500, tipos confirmados; código atrás de `DATA.v4`
Substitui, no Prismático, os 100 fragmentos e as fontes da Revisão 4. Submundo e Celestial ficam como na Revisão 4.
**Fontes (todas determinísticas, sem sorteio):** eventos (principal), VIP 10 = 500 uma vez, arena semanal (1º 10, 2º 7, 3º 5, 4º-10º 3, 11º-50º 1),
chefe da era 8 = 1/dia (+1 a cada 4 dias com VIP), torre = 5 a cada 25 andares acima do 105. O limite de VIP ≤ 25% não vale aqui (decisão do dono).
**Simulação** (dia a dia, relógio a partir da chegada na era 8; evento mensal paga no 14º dia; torre: 10/mês o pagante, 5/mês os outros):

| evento mensal | pagante ativo (VIP 10, arena 4º-10º) | VIP médio (VIP 5, arena 11º-50º) | grátis dedicado (arena 11º-50º) |
|---|---|---|---|
| 80 | 3,5 meses (sem arena: 4,0) | 7,8 (8,5) | 8,5 (8,5) |
| **100 (proposta)** | **3,4 meses (sem arena: 3,5)** | **6,5 (7,1)** | **7,5 (7,5)** |
| 120 | 2,5 (3,0) | 6,0 (6,5) | 6,5 (6,5) |

Para a meta do dono (quem gasta e joga, em 3-4 meses), o evento precisa dar: **75** (com arena) / **85** (sem arena) para 3,5 meses;
**110 / 120** para 3 meses; **65 / 80** para 4 meses. **Proposta: 100 por evento mensal**, que fecha a meta com ou sem a arena (que fica sem prêmio
contra bots até ter servidor). O pagante no top 3 da arena com evento 100: 2,8 meses.
**Estrelas:** 50/100/150/200 = **+500 até o 5★** (a mesma proporção 1:2:3:4 dos outros pets, 10/20/30/40). O pagante leva ~3 meses a mais para o 5★.

## Revisão 4 — PROPOSTA para o PO: pets das eras 7-8 e o PRISMÁTICO (2026-11-12; plano, sem código até a aprovação)
**Submundo (era 7) e Celestial (era 8):** a raridade "Divina" ainda NÃO existe no jogo (vai até Lendário). Proposta: os dois entram como
**Lendários** (peso 1,00; teto de 20% da FC, como a fênix), com 3 estágios e os 3 ataques da Revisão 3. Se a Divina for criada, muda só a tabela.
**PRISMÁTICO** (raridade própria, acima de todas; o pet mais raro e o que mais rende):
- **Teto 25% da FC total** (os outros seguem 20%). O teto passa a ser POR PET no fc.js (hoje é um só): o Prismático pode chegar a 1/3 da FC do
  herói (= 25% da total). Peso de raridade **1,333** (Lendário 1,00). Mesma curva de nível (até 90) e os 3 estágios (médio 30, evoluído 60).
- **Ataques um pouco melhores:** crítico 7% → **14%**, mediano 3% → **7%** (dano 5x / 2,5x / 1x). Dano médio ×1,325 → ×1,665; o golpe é dividido
  pela média máxima DELE (1,665), e o teto de 25% fica exato.
| Estrelas · nível | Prismático | Lendário (comparação) |
|---|---|---|
| 1★ Nv 1 | 9,6% da FC | 7,4% |
| 1★ Nv 60 (evoluído) | 18,7% | 14,8% |
| 3★ Nv 60 | 20,6% | 16,3% |
| 5★ Nv 90 | **25,0%** | 20,0% |
- **Como conseguir (sem sorteio pago; NÃO vende na loja):** 100 fragmentos de fim de jogo, por fontes DETERMINÍSTICAS. Não pode ser sorteio por
  corrida de instância, porque o VIP tem +1 entrada por área (+50% de corridas) e passaria do limite de 25% mais rápido:
  - 1 fragmento pela **1ª vitória do dia** sobre o chefe da era 8 (instância ou Senhor da Era 8);
  - **evento mensal:** 10 fragmentos; **torre:** 5 a cada 25 andares acima do 105 (~1 marco por mês);
  - **VIP:** +1 fragmento a cada 4 dias (+25%, o limite do PO).
- **Simulação (dias depois de chegar na era 8):**
| Joga | Grátis | VIP |
|---|---|---|
| todo dia | 70 dias | 60 dias |
| 80% dos dias | 86 dias | 70 dias |
| 60% dos dias | 90 dias | 77 dias |
  Meta do PO (2-3 meses; VIP no máximo 25% mais rápido): cumprida (VIP 14-19% mais rápido).
- **Atenção:** as ESTRELAS do Prismático pedem mais 100 fragmentos (10+20+30+40) para o 5★: outros ~2,5 meses. É o objetivo de longo prazo.
- Depende das eras 7-8 existirem no jogo (hoje `Sys.stats.DATA.maxEra` = 6).
