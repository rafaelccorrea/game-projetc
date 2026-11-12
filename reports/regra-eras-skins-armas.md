# Regra de negócio do dono: troca de era, skins e armas (sem código; para PO e contrato)
Recebida pela fps-30 direto do dono em 2026-11-12. Status: **APROVADA COMO SPEC pelo PO (fps-98)**; implementação só depois da
aprovação das telas.

## Decisões do PO (2026-11-12)
1. "Era manda mais que raridade" vale **no mesmo nível** (opção A). A Lendária Nv 50 pode passar a Básica Nv 1 da era seguinte (premia quem evoluiu o item).
2. A skin de **roupa** padrão é ganha ao entrar na era (equipar é opcional, com o aviso "Nova skin disponível"). A skin de **arma** padrão só vem ao
   conquistar a 1ª arma (item) daquela era.
3. Fator 12 por era, inimigos ~1,282 por fase e revisão dos preços 4^era: aprovados como spec; implementar junto com docs/balance.json. O QA mede
   o tempo até a fase 4 e até a troca de era.
4. A tela 11 do protótipo (Troca de era) vai mostrar "Nova skin de roupa" e a arma antiga mantida (ajuste do PO).
5. **Atualização após o balanceamento v2:** o nível (1-50, depois ampliado para 1-60 após a simulação 3) saiu do item e foi para o **espaço** do equipamento. Com isso, a regra "era > raridade"
   aparece na prática: o item novo da era entra sempre mais forte, e o nível (e o +N) investido continua no espaço. O item 1 acima (Lendária Nv 50 x
   Básica Nv 1) deixa de existir, porque o nível não pertence mais ao item. Vender ou desmontar não devolve nível. Velocidade de batalha máxima: x2.
6. **Skin não mexe em poder:** golpes e alcance vêm do item; uma skin de arma só pode ser usada sobre um item do **mesmo tipo**: corpo a corpo
   com corpo a corpo, tiro com tiro. Os golpes do Especial também vêm do item. Isso responde à nota A abaixo.

## A regra (palavras do dono, resumidas)
1. Ao passar de era (ex.: Pré-História → Futurista), **a skin equipada NÃO muda sozinha**.
2. O jogador **ganha a skin padrão da era nova**. Equipa se quiser; se não quiser, continua com a que está.
3. **Armas se conquistam com o tempo.** Ao chegar na era nova, ele ainda está com a arma da era anterior e precisa conquistar
   uma arma da era nova (drop, invocação, loja, instância...).
4. **A era manda mais que a raridade:** uma arma Lendária da Pré-História é **mais fraca** que uma arma Básica de qualquer era
   seguinte. O jogo tem que respeitar isso.

## Como está hoje x a regra
| Regra | Hoje | Situação |
|---|---|---|
| 1. Skin não muda sozinha | a troca de era só altera eraMax e dá 💎 (js/battle.js:144); a skin equipada fica | ✅ já cumpre |
| 2. Ganha a skin padrão da era | skin só vem de invocação, loja ou passe; ninguém ganha a padrão ao entrar na era | ❌ falta |
| 3. Arma conquistada | o item de arma não muda na troca de era; drops novos já vêm da era liberada (70%) e são equipados se forem mais fortes | ✅ cumpre (ver nota A) |
| 4. Era > raridade | `power = base × raridade × 6^era × nível` (index.html:383). Raridade vai até x10 (Lendário), era só x6. Lendária da era N = 10 > Básica da era N+1 = 6 | ❌ **quebra** |

## Proposta para o item 4 (números conferidos)
O fator de era precisa ser **maior que o multiplicador da melhor raridade** (Lendário = 10):
| Fator por era | Lendária era N | Básica era N+1 | Regra |
|---|---|---|---|
| 6 (hoje) | 10 | 6 | quebra |
| 10 | 10 | 10 | empata (quebra) |
| **12 (proposta)** | 10 | 12 | ✅ cumpre |
- **Com nível de item (1-50, até x10,8):** a Lendária Nv 50 da era N (108) ainda passa da Básica Nv 1 da era N+1 (12). Para a regra valer até
  contra item no nível máximo, o fator de era teria que passar de 108, o que é inviável. **Decisão do PO/dono:**
  (A) a regra vale **no mesmo nível** (recomendado: o item novo nasce mais forte e o jogador sobe o nível dele); ou
  (B) vale sempre: encurtar a faixa de nível (ex.: até x3) ou fazer o nível "passar" para o item novo da mesma posição.
- O fortalecimento (+N no espaço, até +93%) não interfere: fica na posição e vale para qualquer item.
- **Efeito colateral no balanceamento:** com fator 12 o herói fica ~12x mais forte por era, mas os inimigos crescem só 7,3x por era
  (1,22 por fase ao longo de 10 fases). Para acompanhar: crescimento de vida/dano por fase ≈ 1,282 (= 12^(1/10)). Preços que usam 4^era
  (melhorar, vender, loja) também precisam ser revistos. Dono: UX/balanceamento (docs/balance.json).

## Proposta para o item 2
- Ao entrar numa era pela 1ª vez: liberar a **skin padrão de roupa** da era (`a{era}0`, Básica), com aviso "Nova skin: <nome>" e um
  atalho "Usar agora", **sem equipar sozinho**.
- Skin padrão **de arma** da era: sugestão de liberar quando ele conquistar a 1ª arma (item) daquela era, para casar com a regra 3.
  Alternativa: liberar junto com a roupa. Decisão do PO.

## Nota A: aparência x força da arma (respondida pela decisão 6: skin só sobre item do mesmo tipo)
Pelo contrato V2, o visual e o som da arma vêm da **skin de arma**, e o dano vem do **item**. Então o jogador pode estar com uma arma
futurista (item) e a aparência pré-histórica (skin), ou o contrário. Isso combina com "skin é escolha dele". O PO deve confirmar que é
o esperado e que a tela de Equip. deixa claro qual é o item e qual é a skin.

## Quem precisa agir (quando o PO liberar)
- PO (fps-98): encaixar no plano e decidir (A)/(B) e a skin padrão de arma.
- Coordenadora (fps-c9): registrar no docs/CONTRATO_V2.md; o engenheiro muda power()/eras e a concessão da skin padrão.
- UX/balanceamento: recalibrar o crescimento dos inimigos e os preços (docs/balance.json).
- fps-e2: recalibrar a curva da torre (FC 150·1,12^andar, pensada para o fator 6). Ela confirmou que o fortalecimento não muda.
- QA (fps-0b): caso de teste "Lendária era N < Básica era N+1 no mesmo nível" e "trocar de era não troca a skin".
