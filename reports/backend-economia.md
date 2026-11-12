# Economia no servidor (carteira de 💎 e de ouro, itens validados) — PLANO (fps-30, com a fps-c9) — DESENHO APROVADO pelo PO; nada implementado
Decisão do PO (2026-11-12): esta é a **pré-condição ÚNICA** para ligar o leilão, as trocas de guilda e a doação de 💎 na guilda. É a próxima grande etapa
do backend, depois de arena, ranking, eventos e compras (núcleos prontos). Também é o que falta para o parecer jurídico ver um mercado "fechado".

## 1. O problema
Hoje ouro, 💎, itens e níveis nascem no APARELHO (o save é um objeto no localStorage). Para o jogo solo, isso basta: o servidor confere o save por
tetos (§3.4 do contrato). Para um MERCADO, não basta: se o vendedor editar o save, cria ouro, item ou nível que vira valor real para OUTRO jogador.
Os 50% do ouro investido devolvidos no leilão e na troca criam ouro, então um nível falso vira ouro de verdade.

## 2. A ideia: "banco do mercado" (custódia), sem precisar do jogo inteiro online
Fazer o jogo todo pelo servidor (cada abate, cada melhoria) é caro e quebra o jogo sem rede, que é idle e offline. Proposta: **só o que entra no mercado
passa a viver no servidor.** O farm continua no aparelho.
1. **Depositar:** o jogador move ouro, 💎 ou um item do save para a carteira ou o inventário do SERVIDOR (tela "Cofre do Mercado").
   - O servidor CONFERE antes de aceitar (§3). Uma vez dentro, o valor é do servidor: sai do save e não volta a ser editável.
2. **Usar:** leilão, doação de item e de 💎 na guilda, e loja de Marcos só mexem no que está no servidor.
3. **Sacar:** item comprado e ouro recebido descem para o save quando o jogador quiser. Sacar é sempre permitido; o valor já passou pela conferência.
4. **O que nasce no servidor já está dentro:** compras (💎 pagos, a parte já feita), prêmios da arena, do ranking, do Torneio e do chefe da guilda,
   e Marcos de Leilão.
   Recompensas que hoje o aparelho entrega podem migrar aos poucos para o servidor (§4, etapa E2), o que aumenta o que é "confiável" sem mudar o jogo solo.

## 3. Conferência no depósito (anti-trapaça)
### Item
- Forma válida: espaço; raridade ≤ o portão do nível e da era do jogador; era ≤ a maior era liberada (ou "adormecido", pela regra do jogo);
  secundários coerentes com a raridade; qualidade (`qp`) na faixa do jogo.
- **Ouro investido RECALCULADO pelo servidor** com o `Sys.stats.upgradeCost` do jogo: a soma do custo de cada nível de 1 até o nível do item.
  O `item.gold` do aparelho é ignorado. Assim, os 50% devolvidos nunca passam do que o nível custa de verdade.
- **Nível plausível:** a soma do ouro investido em TODOS os itens depositados, mais o ouro depositado, não pode passar do ouro máximo que a conta
  conseguiria ganhar até hoje (curva da fps-e2, jogador mais rápido + 20%, como os tetos do save).
- **Raridade plausível:** a quantidade de itens Míticos e Lendários depositados é comparada com o drop esperado pelo tempo de conta. Fora da curva, a conta
  é MARCADA para revisão (não é bloqueada na hora).
- Item com origem 'purchased' ou 'offer' (oferta, loja) não entra no mercado. A origem vem do próprio item, marcada pelo jogo na criação (pedido à fps-c9).
### Ouro e 💎
- **Ouro depositado:** limitado pelo ouro máximo que a conta conseguiria ter (mesma conta do nível plausível). Um limite diário de depósito freia o ganho, mesmo
  se a curva estiver folgada.
- **💎:** duas carteiras no servidor:
  - **pagos:** só os vindos de compra conferida (já existe no PurchaseCore);
  - **ganhos:** só os que o SERVIDOR deu (missões, login, eventos, arena, correio, cartão mensal: etapa E2).

  O 💎 que só existe no save NÃO entra. A doação de 50 💎 da guilda sai dessas carteiras: pagos primeiro? Fica para o PO decidir.
### Revisão
Tudo que falha vai para a fila do `/admin` ("saves marcados"), com o motivo. Tudo é registrado no livro-razão (ledger), que só cresce.

## 3b. Proteções contra DUPLICAÇÃO (pontos da fps-c9 — obrigatórias para ligar o leilão)
1. **Save antigo restaurado** (o furo principal: deposita, restaura um save velho por "Importar progresso" e o ouro volta ao aparelho, com o depósito no cofre):
   - **(a) Teto CUMULATIVO por conta:** a soma de tudo que já foi depositado (ouro + 💎 + o valor dos itens, pelo ouro investido recalculado) MENOS o que foi
     sacado nunca passa do máximo ganhável pela idade da conta (curva da fps-e2). Mesmo quem duplica não ganha mais do que ganharia jogando. **Sem isto, o leilão não liga.**
   - **(b) Carimbo de versão:** o mercado exige o save na nuvem sincronizado. Cada depósito grava no servidor a versão do save. O aparelho só volta ao mercado
     com um save de versão ≥ a carimbada. Restaurou save antigo = fora do mercado até reconciliar, e o servidor reaplica os débitos.
   - **(c) Exportar/Importar local:** para a conta que já usou o mercado, o import zera o acesso ao mercado até sincronizar com a nuvem.
2. **Mesmo item em dois aparelhos com o mesmo save:** no depósito, o servidor gera um **id único** e guarda o hash do item.
   O mesmo item (mesmo hash) não entra duas vezes.
3. **Saque idempotente:** o saque fica PENDENTE até o aparelho confirmar o recebimento (com o id do saque). O servidor reenvia o que não foi confirmado
   (o WebView do APK pode demorar segundos para gravar, e o app pode fechar antes).
4. **💎 comprados:** só circulam 💎 GANHOS. O 💎 comprado nunca passa de uma conta para outra (o leilão não usa 💎).
   - A doação de 💎 na guilda não transfere valor a outro jogador (vira XP e Brasões da guilda) e sai primeiro do 💎 ganho (decisão do PO).
   - **Decidido (PO): o 💎 comprado NUNCA circula entre contas.**

## 3c. Origem do item (campo origin, já no jogo)
- O Sys.loot e o Sys.pass (fps-30) já gravam origin em todo item que criam:
  - drop, oss, chest, instance (arsenal ou chefe da instância), summon, shop;
  - eward (pacotes: correio, login, eventos, guia) e pass. Quem chama o grantBundle pode dizer a origem com .origin.
- Faltam os criadores fora desses módulos (loja do engenheiro, oferta da fps-e2, presentes), que devem gravar shop, offer ou gift.
- Também falta o 
ormItem do js/farm.js manter o campo (pedido à fps-c9). O campo não muda poder nem regra no jogo solo.
## 4. Etapas
| Etapa | O quê | Libera |
|---|---|---|
| **E1 — Cofre do Mercado** | depósito e saque com conferência; carteira de ouro, Marcos e 💎 (pagos + ganhos no servidor); inventário de itens no servidor (o do leilão) | leilão, troca de guilda |
| **E2 — Recompensas no servidor** | o resgate de missões diárias e semanais, login, eventos, correio, cartão mensal e passe passa a ser uma rota do servidor, que grava o 💎 "ganho" na carteira e manda o pacote para o jogo | doação de 💎 na guilda (com 💎 ganho de verdade); menos confiança no save |
| **E3 — Melhoria no servidor (opcional)** | melhorar ou fundir item que está no cofre acontece no servidor (custo pelo `upgradeCost`) | itens do mercado sempre coerentes; menos itens marcados |
Fora do escopo: farm, abates e drops continuam no aparelho (jogo idle e offline). O save continua conferido pelos tetos.

## 5. O que preciso da fps-c9 (camada do jogo)
1. **Caminhos no save** (os `summaryPaths` que faltam, mais estes): ouro, 💎, lista de itens com `{slot, r, e, lvl, gold, qp, subs, look}`, item equipado, nível e era.
2. **Origem do item:** marcar em todo item criado `origin: 'drop'|'chest'|'boss'|'instance'|'tower'|'pass'|'shop'|'offer'|'gift'`. Hoje o item não diz de onde veio.
   O `Sys.loot` (meu) marca nos itens que ele cria; os outros criadores de item (loja, oferta, torre) precisam marcar também.
3. **Tela "Cofre do Mercado"** (depositar, sacar), e o fluxo de saque que põe o item no Nv 1 de volta no save.
4. **Resgates pelo servidor** (E2): quais telas hoje dão 💎 e itens localmente (missões do passe, login, eventos, correio) e como trocar para "pede ao
   servidor → recebe o pacote → `Sys.loot.grantBundle`". Os meus módulos (pass, login, events, mail) já entregam por `grantBundle`, então a troca é na camada.
5. **Sem rede:** o cofre e o mercado ficam fechados; o resto do jogo segue igual.

## 6. Decisões do PO (2026-11-12): (1) depósito de ouro até 24 h de farm por dia; (2) doação de 💎 sai primeiro do GANHO; (3) saque sem taxa; (4) E3 depois — por agora só E1 e E2. Ambos dependem do servidor no ar e do parecer jurídico.
- 💎 COMPRADO **nunca** circula entre contas (PO, 2026-11-12). Fica só na conta de quem comprou; doação na guilda sai do 💎 ganho.
### Texto original das perguntas
1. Limite diário de depósito de ouro no cofre (proposta: ouro de 24 h de farm por dia).
2. Doação de 50 💎 na guilda: sai do 💎 GANHO ou do PAGO primeiro? Proposta: ganho primeiro, para o pagante não "comprar" XP de guilda.
3. Sacar do cofre: sem taxa? (Proposta: sem taxa no saque; as taxas ficam no leilão.)
4. E3 (melhorar item dentro do cofre): agora ou depois?
