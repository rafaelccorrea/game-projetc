# Primeiros minutos do Eonbound: análise e proposta (14/11/2026)

Feito para o dono, depois do teste no S24. Pedidos dele:
1. "o personagem já começa a partida muito forte";
2. "falta tipo uma introdução, itens caindo no chão, coleta automática";
3. "uma forma de ir pegando itens, invocando".

O código de hoje veio do levantamento do Engenheiro. A proposta é da Sistemas.

## (a) Como está hoje
- **Introdução**: Título → Login → Prólogo com o avô → Kael ou Kaia → Nome (`js/p_intro.js`). Conta a história e faz o cadastro, mas **não ensina a jogar**. A fase 1 já é a batalha normal (4 ondas + chefe).
- **Tutorial** (`js/meta.js:105`): 5 balões de leitura (batalha automática, Especial, melhorar a arma, Ultimate, Invocar no nível 3). Não existe o momento "caiu um item → compare → equipe".
- **Itens no chão**: o abate já credita o item (`Sys.loot.onKill`). O item pula, brilha no chão 0,3 a 0,65 s e voa sozinho para a mochila (`js/farm.js:147-200`); a equipagem é automática pela FC. O jogador **nunca decide nada**: o item já está equipado quando ele percebe. O `js/pickups.js` existe, mas não é usado.
- **Fontes de item**:
  - drop comum: 3,5% por abate, mais o chefe;
  - baú de toque (`Sys.chest`): enche por abate, 3 a 5 itens, até 8 por dia;
  - Invocar: com ouro, 1 grátis por dia, a partir do nível 3.
  - Tudo vai direto para a mochila.
- **Força inicial**, de onde vem:
  - os primeiros inimigos têm menos vida, por um alívio de 0,5 / 0,65 / 0,8 nas fases 1 a 3 (`earlyEase`, `js/battle.js:43`);
  - presente de boas-vindas de +200 moedas e +50 gemas;
  - tudo automático desde o 1º segundo;
  - na dificuldade nova (ainda desligada), a fase 1 pede só 80% da FC de quem começa.
  - Número a medir: tempo e mortes até a fase 6 do jogador novo (`test/e2e/diff.js --medida=novo`, quando a memória do PC deixar).

## (b) Proposta: FOGUEIRA DAS ERAS (o "invocar jogando")
Uma fogueira no canto da batalha. O jogador **alimenta com Brasas** e cada Brasa forja **1 equipamento** da era dele. O item aparece num cartão "novo × o seu" com **Equipar** ou **Desmontar** (ouro e XP da fogueira).
- **Brasas, só jogando**: abates (1 a cada 20), fase vencida (+3), chefe (+5), baú de toque (+5 no lugar de parte dos itens) e missões diárias (+20). **Nunca à venda**: não há pacote, loja, VIP nem anúncio que dê Brasa (regra de menores). Guarda até 300.
- **Nível da fogueira (1 a 20), sobe com ouro.** Muda os pesos de raridade:
  - Raro a partir do nível 2;
  - Épico a partir do 5;
  - Mítico a partir do 10;
  - Lendário a partir do 14;
  - sempre dentro do portão de raridade por nível e era do jogador (`Sys.loot.maxAllowedR`), então não acelera a curva.
- **Automático** (abre no nível 8 da fogueira ou no Nv 15 do jogador):
  - forja em lotes de 1, 3 ou 5;
  - equipa sozinho o que tiver mais FC;
  - desmonta sozinho o que estiver abaixo do filtro de raridade;
  - guarda o resto;
  - é de todos, não é vantagem de VIP.
- **Como se junta ao resto**:
  - o drop comum de item cai de 3,5% para 1% (fica a surpresa no chão);
  - a fogueira entra no lugar da maior parte;
  - o baú dá Brasas e materiais;
  - **o Invocar vira a tela da Fogueira** (a grátis do dia vira +5 Brasas);
  - o chefe continua soltando item no chão.
- **Economia e dificuldade**:
  - a meta é o MESMO número de itens por dia de hoje, só que o jogador escolhe a hora e vê cada um;
  - o nível da fogueira é um ralo de ouro novo;
  - a curva de FC não muda (mesma tabela do `Sys.loot`, mesmos portões);
  - a Sistemas confere na simulação de 180 dias antes de ligar.

## (c) Introdução curta (pode pular, ~60 s)
1. Dois cartões: o avô e o portal das eras. O que já existe, encurtado.
2. **Fase 0 jogável**, contra 3 lagartos fracos:
   - o 1º item cai e **fica no chão brilhando** até o toque;
   - o cartão "novo × o seu" aparece, com Equipar.
3. A Fogueira acende: o tutorial dá 3 Brasas, o jogador forja 1 item e escolhe.
4. Vai para a fase 1. "Pular" em todos os passos.

## (d) Itens no chão e coleta automática: o que falta
- O item de raridade **Rara ou maior** fica até 2 s no chão. Se for melhor que o equipado, mostra a etiqueta "**+FC**" e, ao ser pego, abre o cartão "novo × o seu" curto (não em todo item).
- Coleta automática (**ímã**) para ouro, XP e item comum, como hoje. Só o primeiro item da vida do jogador pede toque (o momento do tutorial).
- O `js/pickups.js`, que não é usado, sai ou é juntado ao do `farm.js` (Engenheiro).

## (e) Começo mais duro
- Fases 1 a 3 sem alívio: `earlyEase` de 0,5 / 0,65 / 0,8 para 0,85 / 0,9 / 1.
- Na dificuldade nova, a fase 1 pede 100% da FC de quem começa, e não 80%. O 1º Senhor (fase 10) continua sendo a primeira parede.
- O presente de boas-vindas passa a ser só +50 gemas; as 200 moedas saem.
- O efeito sai na mesma medida "novo". Meta proposta: a 1ª derrota no chefe da fase 5 para quem não equipar nada.

**Para o dono decidir:**
1. Fogueira no lugar do Invocar (proposta) ou ao lado dele.
2. Ligar a introdução jogável.
3. O começo mais duro.
Com o OK, a Sistemas faz o módulo e o protótipo no padrão V2, e o Engenheiro, a tela e a fase 0.
