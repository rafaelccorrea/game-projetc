# Qualidade do item dentro da raridade — PROPOSTA para o PO (fps-e2, 2026-11-12)
Regra nova do dono (via PO). Código pronto em js/sys/stats.js ATRÁS DE CHAVE DESLIGADA (`Sys.stats.DATA.quality.on = false`): nada muda no
jogo até a aprovação. Testes: `node test/sys/e2.test.js` (19 ok, com a chave ligada dentro do teste).

## 1. Regra
- Todo item novo (7 espaços, todas as raridades) sorteia um **poder de qualidade `qp` de 0 a 10.000**, guardado no item.
- **Estrelas por faixa:** 1★ 0-1.999 · 2★ 2.000-3.999 · 3★ 4.000-5.999 · 4★ 6.000-7.999 · 5★ 8.000-10.000.
- **Efeito:** multiplicador linear **×0,80 (qp 0) a ×1,20 (qp 10.000)** em TODOS os atributos do item (principal e secundários).
  Nível do item e fortalecimento continuam separados (multiplicam por cima).
- **Transformação mantém a qualidade.** Item antigo, sem `qp`: vale 5.000 (×1,00), então ninguém perde força com a mudança.
- **Formato do item:** ganha `qp` (inteiro 0-10.000): `{slot, e, r, lvl, gold, look, qp, subs}`.

## 2. Sorteio (puxado para baixo) — simulado com 2 milhões de itens
| Faixa | Proposta do PO | Sorteio implementado |
|---|---|---|
| qp ≥ 6.000 (4★ ou mais) | ~10% | 9,95% |
| qp ≥ 8.000 (5★) | ~2% | 1,99% |
| qp ≥ 9.500 | ~0,1% | 0,100% |
| qp = 10.000 | 1 em 1 milhão | 2 em 2 milhões |
Estrelas: 1★ 53,6% · 2★ 24,9% · 3★ 11,6% · 4★ 8,0% · 5★ 2,0%. Qualidade média: **2.456**.
Método: o log da chance "pelo menos qp" é interpolado entre os pontos do PO, mais o prêmio de 1 em 1 milhão (`Sys.stats.rollQuality`).

## 3. Regra de ouro (raridade manda) — conferida
Exigência: o degrau de raridade tem de ser maior que 1,20/0,80 = **1,5**.
- **Atributos planos** (arma, colete, chapéu, luvas-ATK): degraus 1,70 / 1,76 / 1,83 / 1,82. Já cumprem.
- **Atributos em %** (botas, colar, asa, crítico das luvas): degraus HOJE 1,25 / 1,20 / 1,20 / 1,22. **NÃO cumpriam**: medido, numa bota,
  Lendária qp 0 perdia para Mítica qp 10.000 em 100% dos casos.
- **Ajuste:** com a qualidade ligada, os % usam degraus **×1,55** por raridade: [1; 1,55; 2,40; 3,72; 5,77] (`rarPctQ`).
  Teste: em TODOS os espaços, eras 0/3/6, níveis 1/50/100 e pares de raridade, a maior com qp 0 vence a menor com qp 10.000 no PRINCIPAL.
- **Limite honesto:** os SECUNDÁRIOS têm tipos sorteados (ex.: ATK% contra velocidade), que valem diferente na FC. Por isso a regra não
  dá para garantir em 100% da FC total do item. Medido com o ajuste: ainda inverte em **até 2%** dos pares, e só no colar e nas botas
  (onde o principal pesa pouco). Opções para o PO:
  - **(A, recomendada)** a regra vale no atributo PRINCIPAL (é o que a tela mostra grande); o equipar automático segue a FC real (melhor
    para o jogador); o caso raro de inversão aparece como "este Mítico rende mais pelos secundários".
  - (B) secundários com força presa à qualidade, sem rolagem própria: PIORA (até 44% de inversão; testado e descartado).
  - (C) limitar os secundários de colar e botas a tipos de peso parecido: reduz, mas tira variedade.
- **Efeito no balanço:** os % de raridade alta crescem muito (bota Lendária: ×5,77 em vez de ×2,2). Os tetos já seguram (velocidade de
  ataque 100%, crítico 75%, dano crítico 400%), mas a fps-c9 precisa recalibrar antes de ligar.

## 4. Quanto custa garimpar (itens que caem, não abates)
Chance de Mítico por item: 2,1% (era 4) a 2,3% (era 6). O Mítico só cai com o nível do jogador 70+ e a era 4+ (portões). A **arma Mítica não
existe no lançamento** (vira Épica), então o "Mítico 4★" não sai no espaço da arma.
| Era | Itens até um Mítico 4★ ou mais | Itens até um Mítico 5★ |
|---|---|---|
| 4 | ~480 | ~2.400 |
| 5 | ~450 | ~2.300 |
| 6 | ~430 | ~2.150 |
Um inimigo comum dá item em 3,5% dos abates (chefe: sempre): ~480 itens ≈ ~13.700 abates comuns, fora chefes, baús e invocação com ouro.

## 5. Efeito médio a avisar
A qualidade média (2.456) dá ×0,90: um item típico novo rende **~10% menos que hoje** (hoje tudo é ×1,00). Com a qualidade ligada, o jogo
fica ~10% mais difícil até a fps-c9 recalibrar (ex.: inimigos −10%, ou o multiplicador centrado na média). Os itens antigos (×1,00)
ficam acima da média dos novos, o que é bom para quem já joga.

## 6. Re-sorteio (pedido: proposta antes) — "Polir"
Proibido com diamante ou dinheiro (sorteio pago; regra do dono e ECA Digital). Proposta, se o PO quiser:
- custo SÓ em ouro: 5 × o custo da próxima melhoria do item (escala com era e raridade);
- **3 por dia no total**;
- o resultado é o MELHOR entre a qualidade atual e a nova sorteada: nunca piora, então não há "perda" de aposta.
- Alternativa sem sorte: "Afinar": +200 de qp por ouro, até 3x por item no total. Determinístico, sem sorteio nenhum.

## 7. Quem faz o quê (quando aprovado e ligado)
- **fps-30 (loot):** ao criar o item (drop, baú, invocação, prêmio), sortear `qp = Sys.stats.rollQuality(rng)`.
- **Engenheiro:** o `normItem` (js/farm.js:11) hoje recria o item e PERDE campos desconhecidos; ele tem de copiar o `qp`. Tela: as estrelas
  (`Sys.stats.qualityStars(qp)`) e o qp no cartão do item.
- **fps-c9:** recalibrar (efeito médio de −10% e os % de raridade alta).

## 8. Item de qualquer era e drop de era futura (regra nova do dono, junto com a qualidade)
**(1) Qualquer item serve em qualquer era:** já é assim no módulo (`Sys.stats.canEquip` não olha a era). O item mantém a era DELE nos atributos.
**(2) Drop de outra era** (é do Sys.loot da fps-30): era seguinte ~0,5% dos itens; +2 eras ~0,05%; +3 ou mais ~0,005%. Era passada: como hoje
(30% da era anterior), como fonte de garimpo de qualidade.
**(3) Bloqueio:** Mítico e Lendário das eras 4, 5 e 6 (e 7-8) nunca antes do portão. Os portões por nível já aprovados (Épico 25, Mítico 70 E era 4+,
Lendário 85 E era 5+) continuam e valem também para o item de outra era. Na prática, nenhum Mítico ou Lendário cai antes do nível 70/85.

**(4) EQUILÍBRIO: simulação pedida** (jogador no fim da era 2, fase 30, nível 26, 6 espaços Épicos da era 2 no nível 26; alcança a fase 31 pela
FC recomendada):
| Arma que cai | Sem trava (regra 1 ao pé da letra) | Com "adormecido" |
|---|---|---|
| era 3 Épica 3★, nível 1 | +1 fase | +1 |
| era 3 Épica 3★, upada até o 26 | +5 fases | (não sobe: +1) |
| era 4 Épica 3★, nível 1 | +7 fases | +1 |
| era 4 Épica 3★, upada até o 26 | **+11 fases** (inclui 1 Senhor da Era) | (não sobe: +1) |
| era 4 Básica 1★, upada até o 26 | +8 fases | +1 |
**A meta "no máximo pular 1 chefe" NÃO é cumprida sem trava:** o fator 12 por era faz uma arma de 2 eras à frente valer ~144x a atual, e o teto
"nível do item ≤ nível do jogador" não segura (no nível 1 ela já pula 7 fases). Testei limitar o nível do item de era futura (nível do jogador
− 15 por era à frente): ainda +3 a +7 fases. **Proposta: "ADORMECIDO"** (`Sys.stats.DATA.futureEra`, chave DESLIGADA):
- enquanto a era do item for maior que a era liberada do jogador, ele rende como **no máximo 1 era à frente** e fica no **nível 1** (não sobe;
  `canUpgrade` responde `reason:'dormant'`, com `wakeEra`);
- quando o jogador chega na era do item, ele **ACORDA** com os atributos da era dele, e o nível pode subir;
- o visual (`look`) é o da era do item desde o começo. Resultado: **+1 fase**, o "salto" pedido, sem "zerar" a era.
- Isso contraria ao pé da letra o item (1) ("mantém os atributos da era dele") ENQUANTO dorme; depois de acordar, vale o item (1). Decisão do PO.

## 9. Tetos de atributo × raridade alta (pergunta da fps-c9)
Com os degraus ×1,55 dos % (seção 3), qp 5.000:
- **Velocidade de ataque (teto +100%):** a bota Lendária SOZINHA no Nv 100 +15 dá +67% (era 0), +101% (era 2), +135% (era 4), +168% (era 6);
  sozinha ela bate o teto a partir do Nv 75 na era 6. Somada aos secundários de velocidade dos outros espaços, o teto já limita da era 2 em
  diante nos níveis altos: a velocidade "sobra" no fim do jogo.
- **Dano crítico (teto 400% com a base 100):** o colar Lendário no Nv 100 +15 dá +336% (era 4) e +421% (era 6): só ele já passa do teto na era 6.
- **Opções:** subir os tetos (velocidade 150%, dano crítico 600%), ou deixar os degraus ×1,55 só no principal de PODER (ATK%/HP% da asa) e
  ×1,5 exatos nos de velocidade e dano crítico. Decidir junto com a recalibração da fps-c9.

## 10. DECISÕES DO PO (2026-11-12) — substituem o que for diferente acima. Tudo atrás das chaves (quality.on, futureEra.on = false)
1. **Regra de ouro no atributo PRINCIPAL:** aprovada. O equipar automático segue a FC real.
2. **Multiplicador ×0,90 (qp 0) a ×1,30 (qp 10.000)** (era ×0,80-1,20). A média dos sorteados dá **×1,00** (simulado: 1,00 ±0,01), e o jogo
   NÃO fica mais difícil. A razão 1,30/0,90 = 1,44 fica abaixo dos degraus (1,5 e 1,55): a regra de ouro continua (testada em todos os espaços).
   **Item antigo, sem qp = a MÉDIA: qp 2.500 (×1,00).** A transformação mantém a qp.
3. **Re-sorteio: NÃO existe** (nem Polir nem Afinar; decisão do dono). No lugar: **FUSÃO** (`Sys.stats.canFuse` / `fuse`):
   - 3 itens IGUAIS (mesma era de poder, espaço, raridade e estrela) viram 1 do mesmo item com +1 estrela (1★→2★ … 4★→5★); 5★ não funde;
   - qp do resultado = a MESMA POSIÇÃO RELATIVA da média dos 3 na faixa da estrela nova (sem sorte). O 10.000 perfeito só por drop (teto 9.999);
   - nível = o MAIOR dos 3. **Fortalecimento:** fica no ESPAÇO, não no item, então fundir não mexe nele (nada a herdar);
   - **ouro investido = a SOMA dos 3** (decisão da fps-e2: o desmontar depois devolve 50% de tudo; ninguém perde ouro ao fundir);
   - secundários e visual (`look`) = do item de MAIOR qp (decisão da fps-e2: determinístico e a favor do jogador);
   - custo: só ouro, 3 × a 1ª melhoria do item (pequeno). Nada em diamante.
   - O módulo NÃO mexe no save: devolve `{result, consumed:[ids]}`. O jogo tira os 3 da mochila, põe o resultado com id novo e, se um dos 3 estava
     equipado, equipa o resultado.
4. **ADORMECIDO:** aprovado. Tela: `Sys.stats.dormantInfo(item, host).label` = "Adormecido · acorda na era X".
5. **Tetos:** degrau ×1,5 EXATO só em velocidade de ataque e dano crítico (`rarPct15`, em principal e secundários); os outros % ficam ×1,55. Os tetos
   continuam os atuais.
6. **Eras 7-8:** a era máxima virou `Sys.stats.DATA.maxEra` (6). Quando as eras entrarem, é só mudar o número; os portões de raridade (4+/5+)
   continuam valendo.

## 11. LEILÃO entre jogadores — só o PLANO (precisa de servidor; nada no código)
- **Moeda do leilão:** "Marcos de Leilão" (ou ouro, se o PO preferir). NUNCA diamante comprado nem dinheiro real direto: senão vira loja de poder
  entre jogadores, com risco de troca por fora (RMT) e de ECA Digital.
- **Taxa:** 10% do valor da venda vai para o sistema (tira moeda do jogo e freia a inflação). Taxa de anúncio pequena, não reembolsável, contra spam.
- **O item vendido SAI da coleção do vendedor** quando o anúncio é criado (fica "em leilão") e vai para o comprador na venda. Volta ao vendedor se
  ninguém comprar até o fim do prazo (ex.: 24 h).
- **O que pode ser vendido:** itens (com era, raridade, qp, nível? → sugestão: o nível volta ao 1 na venda e o ouro investido é devolvido ao
  vendedor em 50%, como no desmontar, para ninguém vender "nível comprado"). Pets, skins e VIP: NÃO.
- **Precisa do servidor para:** dono único do item (sem duplicar), lances e compra atômicos, prazo, histórico, denúncia e limites anti-abuso
  (máx. anúncios por dia, preço mínimo/máximo por raridade e era).

## 12. Fechado pelo PO (2026-11-12)
Fusão: (a) fortalecimento fica no espaço, (b) ouro investido = soma dos 3, (c) secundários e visual do de maior qualidade — APROVADOS.
Leilão: plano APROVADO (inclusive o item vendido voltar ao nível 1 e o vendedor receber 50% do ouro investido); fica para quando houver servidor.
