# Especificação: fortalecimento +0 a +15 e aura (sem código)
Autor: fps-e2. Revisão 2, de 2026-11-12, com a decisão do dono repassada pelo PO (fps-98) via fps-c9 e registrada em docs/CONTRATO_V2.md.
**Fontes da Pedra de Forja:** ficam na seção 4 de reports/spec-loot-bau-instancias.md (fps-30). Aqui ficam as regras, a tabela de custo
(única, que vale para as duas specs) e o efeito na FC.

## Decidido (dono/PO)
- O "+N" fica no **espaço** de equipamento, não no item, e é separado do nível 1-50 (ouro). Entra na FC.
- Material próprio: **Pedra de Forja** 🔨 (diferente das pedras de prática). **Nada de forja é vendido por gemas.**
- Teto por era liberada: era 0-1 até +6 · era 2-3 até +9 · era 4-5 até +12 · era 6 até +15.
- Aura (só arma): +0-3 nenhuma · +4-6 azul · +7-9 roxa · +10-12 chamas vermelhas · +13-15 dourada com raios.
- **A tentativa pode falhar, mas NUNCA perde nível.** A falha só gasta as pedras daquela tentativa, e a chance sobe a cada falha (garantia acumulada).

## 1. Por que no espaço e não no item
O jogo equipa sozinho todo drop mais forte (`maybeDrop` → "⬆️ Equipou"), e o item é trocado a cada era (o poder cresce 6x por era).
Se o "+N" ficasse no item, o jogador perderia o fortalecimento e a aura a cada troca. No espaço, o investimento é permanente e a
comparação "este drop é melhor?" continua simples.

## 2. Tabela única: chance, custo e aura
Custo **por tentativa**, calibrado para que o total ESPERADO (com as falhas) fique igual ao ritmo que a fps-30 estimou para as
fontes (~510 pedras até +15). Garantia acumulada: cada falha soma **+5 pontos** à chance da próxima tentativa naquele espaço; zera ao acertar.

| +N | Chance base | Pedras por tentativa | Tentativas em média | Pior caso (garantia) | Pedras acumuladas (média) | Aura |
|---|---|---|---|---|---|---|
| +1 | 100% | 2 | 1,0 | 1 | 2 | — |
| +2 | 100% | 3 | 1,0 | 1 | 5 | — |
| +3 | 100% | 4 | 1,0 | 1 | 9 | — |
| +4 | 90% | 5 | 1,1 | 3 | 15 | azul |
| +5 | 80% | 6 | 1,2 | 5 | 22 | azul |
| +6 | 70% | 6 | 1,4 | 7 | 30 | azul |
| +7 | 60% | 8 | 1,6 | 9 | 43 | roxa |
| +8 | 50% | 9 | 1,9 | 11 | 60 | roxa |
| +9 | 40% | 10 | 2,2 | 13 | 82 | roxa |
| +10 | 30% | 11 | 2,7 | 15 | 112 | chamas vermelhas |
| +11 | 25% | 13 | 3,0 | 16 | 151 | chamas vermelhas |
| +12 | 20% | 16 | 3,4 | 17 | 206 | chamas vermelhas |
| +13 | 15% | 19 | 3,9 | 18 | 280 | dourada com raios |
| +14 | 10% | 22 | 4,5 | 19 | 380 | dourada com raios |
| +15 | 5% | 25 | 5,3 | 20 | 512 | dourada com raios |

Os marcos de aura batem com os da fps-30 (+4 ≈ 14, +7 ≈ 42, +10 ≈ 110, +13 ≈ 277 pedras), e o ritmo de fontes dela continua valendo.
O pior caso só da garantia (todas as tentativas falhando até a chance chegar a 100%) dá 2.302 pedras até +15. Isso nunca é sorte paga,
porque a pedra não se compra (resolve a preocupação da fps-30 com o ECA Digital).
Ouro: cada tentativa custa também 30 × ouro por abate da fase atual, para acompanhar a escala por era. Opcional: o PO pode tirar.

### Fontes da Pedra de Forja (definidas pela fps-30, dona de loot/baú/instâncias)
| Fonte | Quantidade |
|---|---|
| Inimigo comum | ~0,7% de chance de 1 (pickup voando ao HUD; decisão do PO, era 2%) |
| Chefe de fase | 1-2, sempre |
| Senhor da Era | 3-5, sempre |
| Baú de toque | 60% de chance de 1-3 |
| Instância Arsenal | 3 / 5 / 8 (Fácil / Normal / Difícil) |
| Missão diária "Colete 5 pedras de forja" | 5 (decisão do PO) |
| Desmontar item | Básico 0 · Raro 1 · Épico 3 · Mítico 8 · Lendário 20 |
| Torre (fps-e2) | 2 em cada andar de chefe (a cada 5) a partir do andar 20 |
| Loja de diamantes | **nunca** (decisão do dono) |
Ritmo: a simulação v2 (docs/balance.json) mostrou que 2% sobrava 2 a 3 vezes; com 0,7% o limite real continua sendo o teto por era.

**Fechado com a fps-30 em 2026-11-12:** vale o custo por tentativa da tabela acima (total esperado 512, igual ao ritmo de fontes dela).
A seção 4 da reports/spec-loot-bau-instancias.md aponta para este arquivo. O estoque de pedras de forja fica do lado do loot/inventário (fps-30).

## 3. Efeito no poder e na FC
Com a decisão do PO de pôr também o nível de melhoria no espaço (+8% por nível, `S.lvl[espaço]`, docs/balance.json v2), o item só traz
era e raridade, e o espaço traz nível e fortalecimento:
`poder final = base × raridade × 12^era × 1,08^(S.lvl[espaço]−1) × (1 + forte[espaço])`.
Esse valor entra em `heroStats()` (ATK da arma, HP da armadura) e daí na FC pelo `host.atk()/hp()` do js/sys/fc.js, **sem mudar o fc.js**.
Os dois multiplicadores do espaço valem para qualquer item ali, então não mudam qual item é mais forte: a regra "era manda mais que raridade"
vale sempre.
O teto do fortalecimento por era continua em pares (+6/+6/+9/+9/+12/+12/+15, decisão do PO). O degrau por era (+6/+7/+9/+10/+12/+13/+15)
entra só como comparação na simulação 3; o PO decide com os números.

| +N | 1-3 | 4-6 | 7-9 | 10-12 | 13-15 |
|---|---|---|---|---|---|
| Ganho por nível | +3% | +3% | +5% | +8% | +12% |
| Total no fim da faixa | 9% | 18% | 33% | 57% | 93% |

**Fechado com a fps-30:** bônus progressivo (o topo custa 12x mais por tentativa que o começo e precisa render mais).
**Regra nova do dono ("arma de era seguinte, mesmo Básica, sempre mais forte que Lendária da era anterior"; a fps-30 levou ao PO):**
o fortalecimento é NEUTRO nessa regra, porque fica no espaço e multiplica igual qualquer item ali. Ele não muda qual item é mais forte;
só o `power()` decide isso.

## 4. Estado no save
`S.forge = {weapon:0, armor:0, pity:{weapon:0, armor:0}}`. Save antigo sem `forge` começa em zero. O estoque de pedras de forja fica
onde a fps-30 guardar o material (loot/inventário), não duplicado aqui.

## 5. Dependências entre sessões
- fps-30: fontes e drop da Pedra de Forja (seção 4 da spec dela); missão "Colete 5 pedras de forja"; desmontar item.
- fps-ff (animação/som): 4 auras atrás do herói (sem cobrir a arma nem a barra de vida; ela está fazendo o herói em camadas, então a aura
  é mais uma camada atrás do corpo), sons de acerto e falha, e o indicador da garantia acumulada (barra que enche a cada falha).
- Engenheiro (fps-c9): multiplicador em `heroStats()`, tela de fortalecimento (desenho do PO/design), aura no `drawHero`.
- js/sys/fc.js: nada a mudar. A dica "Fortalecer arma +N" entra no "Como ficar mais forte" via `host.advice()`.

## 6. Em aberto para o PO
1. (fechado: bônus progressivo, custo da tabela da seção 2)
2. (fechado pelo PO: a armadura também tem "+N". A aura segue só a arma; sugestão: brilho menor nos pés para o "+N" da armadura aparecer, com a fps-ff.)
3. Custo em ouro por tentativa: manter ou só pedras.
4. A aura vem do fortalecimento, nunca da skin: a skin troca a aparência da arma, mas a cor da aura segue o +N.
