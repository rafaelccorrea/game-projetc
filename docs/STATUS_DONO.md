# Eonbound — checklist do dono

Atualizado em 12/11/2026, 21h, pelo PO. Legenda: `[x]` já funciona no jogo · `[~]` sendo feito agora · `[ ]` ainda não está no jogo

**Links:** Canvas https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba · Aprovação de arte https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19 · GitHub https://github.com/rafaelccorrea/game-projetc · Esteira detalhada `docs/BACKLOG_URGENTE.md`

**Regra combinada:** o celular só recebe o jogo quando TUDO abaixo estiver `[x]`. Única coisa que fica para depois do lançamento: Bênção de equipamento.

## AGORA (atualizado a cada entrega)

- **01h35 · Banco de dados criado no Supabase (sua ordem):** projeto "eonbound" na organização next (Pro, +US$ 10/mês), região São Paulo, Postgres Micro, API pública desligada (só o nosso servidor acessa) e proteção por linha ligada. Falta você colocar o endereço do banco (DATABASE_URL) na variável de ambiente; o Servidor está preparando o passo a passo
- **01h30 · QA entregou:** aba Aparência (modo Itens/Skin, esconder peça), Mapa das Eras ligado à curva das 100 fases, Leilão conferido (regras batem), conserto do resultado da Instância. O engenheiro liga

- **01h20 · Sistemas:** inimigos mais fortes por era LIGADOS (calendário de 6 meses confirmado). Testes automáticos da batalha real: Troca de era OK; Vitória/Derrota com chefe OK; Instância funciona, mas com 2 defeitos já com o engenheiro (o resultado não aparece; ao morrer mostra a mensagem da batalha normal)

- **01h10 · QA com fila nova (sem pausa):** aba Aparência no Equipamento (saiu da fila do engenheiro para andar em paralelo) → ligar o Mapa das Eras à curva das 100 fases → conferir o Leilão → conferir no navegador cada tela que o engenheiro ligar (Instâncias, Vitória/Derrota, missão guia, Correio, Oferta)

- **01h · Seus votos:**
  - APROVADO: Kael adulto e guerreiro V2 (as 14 animações) · cenários das eras 6 e 7 · prints: só o Kael, com pet, no lobo sem asa, morte nova montado, FC no painel. O engenheiro liga as fases V2 e os cenários 6 e 7
  - REPROVADO: a asa no Kael MONTADO (as 6 montarias): "asa não encaixa de forma adequada". Correção: a Arte gera o ponto das costas em cada quadro das montarias, e o engenheiro prende a asa nas escápulas acompanhando o galope. Os prints voltam para o seu voto
- **00h55 · Cenário da era 5 (Moderna) com o acabamento:** cancela que sobe e desce, hélice girando, letreiros piscando, pedestres e trânsito nos dois sentidos. Vai para o seu voto junto com a era 8 e a Kaia V2

- **00h50 · Arte corrigiu pelo código, sem gastar créditos (8070d32):** a mancha escura atrás da cabeça do Kael no lobo sumiu; no pônei, cavalo e tigre a arma desceu de 46° para 22° e não cobre mais o rosto (conferido com a maça e a espada). Falta só o pet encostando no inimigo (engenheiro)

- **00h40 · PARA VOCÊ VOTAR (página de aprovação):** 12 prints do jogo rodando (só o Kael, com pet, nas 6 montarias, lobo + pet + asa, grifo com aura de 5 estrelas, morte nova, FC no painel); o Kael adulto e guerreiro V2 animados (7 animações cada, com a pistola na mão); os cenários vivos das eras 6 (Futurista) e 7 (Submundo)
- **00h40 · Batalha da v0.12.8 conferida no navegador (85d3c4e, no GitHub):**
  - [x] Morte nova do Kael, a pé e montado
  - [x] Inimigo sem ficar parado entre golpes (eras 0-6)
  - [x] Ultimate pela raridade: Básico cinza, Épico roxo, Lendário dourado com anéis e clarão
  - [x] As 6 montarias (pônei, cavalo, tigre, lobo, grifo, serpe) paradas, correndo e golpeando, com aura por estrela visível; pet à frente sem cobrir as patas; asa do Kael destacada
  - [x] FC que sobe/desce no "Equipar melhor" e na Forja · cenário Industrial ligado · sem emojis
  - [ ] Ajustes: o pet ainda encosta no inimigo; resíduo escuro atrás da cabeça no lobo; a maça cobre a boca do Kael no pônei/cavalo/tigre (Arte)
- **00h40 · Sua decisão:** inimigos mais fortes por era (de ×1,08 na era 2 até ×1,70 no Celestial) para o equipamento voltar a importar; calendário de 6 meses mantido
- **00h40 · Servidor:** arena, ranking e eventos online prontos (desligados até o servidor subir). Agora: chat online de frases prontas, painel de moderação, guilda e leilão online

- **00h20 · Jogo pronto para conversar com o servidor (Servidor, dff83e0):** ao abrir, faz login, puxa o save da nuvem, as entregas de compra e o correio; depois de cada save, sobe para a nuvem. Tudo desligado e pronto: falta só o servidor no ar, que depende do seu acesso à AWS, ao banco, ao ID do Google e à conta do Play Console. Agora o Servidor faz arena, ranking e eventos online

- **00h15 · Tamanho do app resolvido no papel (Sistemas):** dos 657 MB, 646 são arte. Com o carregamento sob demanda, o jogador novo instala ~121 MB (meta era <150): Kael e Kaia na fase inicial, eras 0-1. Logo depois baixa ~49 MB (eras 2-3) e o resto só quando precisa (eras 4-8, fases adultas, cada montaria e pet). Decisão do PO: entrega pelo próprio Google Play (Play Asset Delivery), sem depender do nosso servidor. O engenheiro liga antes da versão de loja
- **00h15 · Leilão** ajustado: só ouro e preço fixo. **Eras 7-8** com ouro ×1,5 no começo
- **00h15 · Sistemas agora:** simulação dos 180 dias com TUDO o que entrou hoje, para conferir se o jogo ainda fecha em ~6 meses grátis / ~4 VIP com ~10 mil diamantes

- **00h05 · v0.12.8, lote 3 LIGADO: TELAS DE ENTRADA no jogo (e86e5a8, conferidas pelo QA):**
  - [x] Título B (logo inteiro em tela estreita) → Login (convidado; Google "em breve") → Prólogo em 4 cenas com o avô → Criação (Kaia "chega em breve") → Nome (filtro barra palavrão) → jogo
  - [x] Quem volta: "Continuar como <nome>" → Bem-vindo de volta com o ganho offline entregue UMA vez
  - [~] Sai o aviso antigo de boas-vindas que ainda aparecia depois do fluxo novo
- **00h05 · Decisões do PO:** a Oferta de primeira compra fica visível só no Modo dono por enquanto, para o relógio de 24 h não correr no seu save real antes da compra existir de verdade; a Arte assume também o acabamento do cenário da era 5; o cenário da era 6 vai para a página de aprovação para o seu voto

- **23h55 · Oferta de primeira compra pronta (Servidor, 780655a):** R$ 29,90 com a arma, o Lobo de guerra, 300 gemas e ouro. Enquanto a Play não estiver configurada, o botão diz "Pagamento em breve"; testada até "COMPRADO" com uma Play de teste. Entra no próximo lote junto com as telas de entrada

- **23h45 · Telas de entrada corrigidas (Servidor, 2d7f76b):** o filtro de nome barra palavrão com números; o botão Google diz "em breve"; o avô aparece no Prólogo; o Bem-vindo de volta aparece toda vez. O QA reconfere e o engenheiro liga no próximo lote. Também pronto: a carta de boas-vindas do Correio e a compra pelo Google Play preparada (desligada até o servidor). Próximo do Servidor: Oferta de primeira compra

- **23h35 · Créditos:** para terminar TODA a arte que falta (animações do adulto e do guerreiro, cenários das eras 7 e 8, evolução adolescente→adulto e adulto→guerreiro) a Arte estima ~80-115 créditos. Cabe no saldo de ~295 e sobram ~180. O cenário da era 6 já está no GitHub; o da era 7 começou

- **23h30 · Sua decisão:** Leilão com PREÇO FIXO (só ouro, anônimo, 18+). A tela vai ser ajustada (sai "moeda do leilão" e "lances")
- **23h30 · Sistemas entregou (fe7a7e1, 23 suítes de teste OK):**
  - Correio completo (tipos, validade, resgate uma vez só)
  - Regras do Leilão: taxa de anúncio 1-3% e de venda 10%, limites por dia, preço entre 0,5× e 5× do valor do item, item comprado com dinheiro nunca entra
  - Eras 7 (Submundo) e 8 (Celestial) com inimigos, chefes e números; ouro ×1,5 no começo delas, para não travar
  - Teste automático que abre as 23 telas e aperta todos os botões: tudo OK
  - Próximo: carregar só a arte em uso, para o app sair de 657 MB e ficar abaixo de 150 MB
- **23h30 · Arte:** ícone novo do Torneio (bandeira de guerra num castelo sobre o mapa) e o cenário vivo da era 6 (Futurista) prontos; seguindo para a era 7. Saldo de créditos: ~295

- **23h20 · v0.12.8, lote 2 LIGADO NO JOGO (conferido pelo QA no navegador, no GitHub):**
  - [x] Arena (ligas, luta animada, resultado; prêmios valem com o online) · Eventos (loja com compra direta) · Torneio (28 territórios, sem dados inventados) · Montarias (equipar, subir nível, estrelas e aura; FC "+155 ▲") · Correio (carta de boas-vindas entrando)
  - [x] Menu no nível 60 com tudo: Forja, Pets, Torre, Ranking, Missões, VIP, Arena, Guilda, Torneio, Códex, Chat, Eventos, Config.
  - [ ] Telas de entrada: NÃO ligadas ainda. Defeitos voltaram ao Servidor: o filtro de nome deixa passar palavrão com números, "Google" sem "em breve", o avô não aparece no Prólogo, o Bem-vindo de volta não aparece
  - [ ] Ícone do Torneio sendo refeito (estava parecido com o do Ranking) · Serpe entra na tela de Montarias
  - [ ] Ainda desligadas: Instâncias, Vitória/Derrota, missão guia, Mapa, Oferta, Leilão

- **23h10 · Na batalha (v0.12.8, visto no navegador):**
  - [x] Cenário vivo da era 4 (Industrial) ligado
  - [x] Serpe V2 com o Kael sentado, a asa mais alta e destacada, o pet à frente sem cobrir as patas
  - [x] Morte nova do Kael (cai de joelho, a arma cai, a tela escurece), também montado e com pet
  - [~] Ainda por ver: inimigo sem parar, ultimate pela raridade, pônei/cavalo/tigre andando
- **23h10 · Correio:** vai ser ligado com uma carta local "Bem-vindo a Eonbound" (sem prêmio); prêmios de verdade só com o servidor
- **23h10 · Lote 2 de telas sendo conferido pelo QA:** Arena, Eventos, Torneio e as telas de entrada (logo corrigido para tela estreita)

- **23h · Telas de entrada ESCRITAS (Servidor, 68653bd):** Título com o logo B, Login (convidado e Google), Prólogo com o avô, Criação (Kael/Kaia), Nome do jogador, Bem-vindo de volta. Sem Apple, porque o lançamento é só Android. Próximo: entram no jogo no próximo lote
- **23h · Sistemas entregou:** frases prontas do Chat (40, sem texto livre, anti-spam, denúncia), descobertas do Códex (117, prêmios sem diamante), Guilda (cargos, contribuição, ranking), gatilhos do Kael/Kaia crescendo (níveis 22/35/70); o Torneio não mostra mais guildas de exemplo. Próximo: Correio, regras do Leilão, balanço das eras 7 e 8, testes automáticos dos lotes
- **23h · Arte:** acrescentadas à fila as animações de evolução adolescente→adulto e adulto→guerreiro

- **22h55 · v0.12.8, lote 1 LIGADO NO JOGO e conferido no navegador pelo caminho do jogador (no GitHub):**
  - [x] Torre inteira rolando (com luta e prêmio) · Troca de era · Missões (o Passe ficou com a trilha e um botão "Missões") · Perfil (pelo avatar, nível 10) · Códex · Guilda · Chat (só frases prontas)
  - [x] FC na tela: "+269 ▲" verde / "−269 ▼" vermelho, com o total contando
  - [x] Menu por nível: 1 VIP/Config. · 2 Missões · 12 Forja e Códex · 15 Torre · 16 Chat · 20 Pets · 28 Ranking · 32 Guilda; os 7 ícones novos aparecem; nenhum botão sem ação
  - [ ] Ainda desligadas: Instâncias, Correio, Montarias, Vitória/Derrota, missão guia, Arena, Eventos, Torneio, Mapa (em conferência ou esperando um módulo); Oferta e Leilão (dependem do servidor)
  - [~] Em conferência: Serpe e os 3 ajustes das montarias, morte nova, inimigo sem parar, cenário Industrial, ultimate pela raridade

- **22h45 · Arte:** os 7 ícones de menu que faltavam ficaram prontos (Arena, Guilda, Torneio, Códex, Chat, Mapa, Montarias; 14 créditos). Seguem as animações do adulto e do guerreiro e os cenários das eras 6 a 8
- **22h45 · Moedas do incidente:** o engenheiro devolve as 9,8 mil moedas quando você escrever "sim" na janela dele e ligar o celular no cabo

- **22h35 · Medidas no S24:** batalha a 120 quadros/s (105 com lobo + pet + asa); abre em 0,5 s; memória até ~800 MB com tudo; app de 657 MB (precisa diminuir antes da loja)
- **22h35 · INCIDENTE no seu celular:** um script de teste de outra sessão se conectou por engano ao seu celular e tirou o jogo da tela ("Página da Web não disponível"). O save NÃO foi alterado, mas o aviso de ganho offline (2h52, +9,8 mil moedas) sumiu antes de você resgatar. Regra nova: nenhum script toca no celular; os acessos ao aparelho foram removidos. Falta você decidir se repomos as 9,8 mil moedas

- **22h25 · v0.12.7 INSTALADA no seu S24** (por cima, seu save mantido). Para ver o novo: MENU → "Teste" abre o Modo dono (save separado, atalhos de nível 20/32/50/70, montarias, asas) e a Prévia da arte; ao sair, seu save real volta. No print do celular: Kael montado no lobo com a asa de anjo e a arma na mão, a Esfinge à frente no chão, as barras acima do Kael
- **22h25 · Decisões do PO:** Mapa das Eras liberado desde o nível 1, Códex no 12, Chat no 16; nomes das habilidades das eras 7 e 8 mantidos; a Arte faz 7 ícones de menu que faltam (Arena, Guilda, Torneio, Códex, Chat, Mapa, Montarias)
- **22h25 · v0.12.8 começou:** ligar as telas escritas, uma por uma, conferindo no navegador

- **22h20 · Eventos completos (Sistemas, 17eedb2, conferido no navegador):** Trilha com 8 marcos (prêmios sem diamante, moldura no último) e o Chefe do evento "Devorador do Tempo" (2 ataques por dia, vida compartilhada quando abrir o online). Próximo de Sistemas: frases prontas do Chat, Correio, descobertas do Códex, membros da Guilda e gatilhos do Kael crescendo
- **22h15 · Navegador:** 3 abas liberadas: Engenheiro, QA e rodízio de Sistemas/Servidor/Arte

- **22h10 · Sistemas entregou e salvou (c2334f0), pronto para o engenheiro ligar:**
  - Curva das 9 eras: 100 fases × 4 dificuldades para o Mapa (FC recomendada, nível-trava, chefes)
  - Qualidade (estrelas), fusão e item adormecido
  - Números abreviados até o quintilhão (antes parava em "2157 tri")
  - Prismático por 1.000 fragmentos
  - Prêmios da Arena por liga: diamante só da Platina para cima (5 a 40 por semana). Total de diamantes de graça em 6 meses ≈ 10,3 mil
  - Agora: Trilha e Chefe do evento

- **22h · v0.12.7 FECHADA e conferida no navegador (11a2139, no GitHub):** pet ao lado do Kael, as duas asas por item, Kael montado no lobo e no grifo (pônei, cavalo e tigre entraram, ainda não vistos a olho); jogador novo e save antigo funcionando. A Serpe V2 e os 3 ajustes finos (pet nas patas, asa x grifo, aura) entram na v0.12.8
- **22h · Celular:** você pediu ao engenheiro para instalar; a v0.12.7 está sendo instalada no S24. Atenção: o app de teste está com ~640 MB porque leva TODA a arte; antes da loja precisa do "carregar só a arte em uso"
- **22h · Próximo (v0.12.8):** ligar no jogo, tela por tela, tudo o que já está escrito: Arena, Eventos, Torneio, Mapa, Perfil, Passe com rolagem, missão guia, Guilda, Códex, Correio, Chat, Missões, Torre, Troca de era, Instâncias, Vitória/Derrota

- **21h55 · Telas ESCRITAS e salvas no GitHub (86890ff), ainda não ligadas no jogo:**
  - Sistemas: Arena (7 ligas Bronze→Lenda, luta animada, resultado), Eventos (loja e missões funcionando; Trilha e Chefe em breve, regra sendo escrita), Torneio do Poder (9 regiões + Capital)
  - QA: Perfil e Coleção; Torre e Ranking conferidos no navegador
  - Painéis do engenheiro: Vitória/Derrota do chefe, Montarias, Passe com rolagem
  - Prêmios da Arena com diamante só valem no online e vão caber na meta de ~10 mil diamantes em 6 meses

- **21h45 · Arte:** começaram as animações do adulto e do guerreiro (Kael e Kaia, 32 vídeos, ~150 créditos, 2 agentes em paralelo); a pistola do guerreiro sai certa junto com elas. A tela Mapa das Eras foi ESCRITA (salva no GitHub, ainda não vista rodando). O QA pula o Mapa e vai direto para o Perfil

- **21h35 · Ninguém parado. Fila de cada um, em ordem:**
  - Engenheiro: conferir e fechar a v0.12.7 (com a Serpe V2) → ligar tudo que está escrito (v0.12.8) → ultimate pela raridade → Aparência → Kaia jogável, morte, inimigo, cenário Industrial
  - QA (ajudante do engenheiro): Mapa das Eras → Perfil → Passe com rolagem → missão guia → ajudar o engenheiro a conferir as telas no navegador
  - Sistemas: Arena → Eventos → Torneio → curva das 9 eras → qualidade/fusão/números abreviados → Prismático
  - Servidor: telas de entrada → Oferta pronta para compra → ligação do jogo com o servidor → arena/ranking/eventos
  - Arte: animações do adulto e do guerreiro → pistola do guerreiro na mão → cenários vivos das eras 5 a 8 → aparência no adulto

- **21h30 · No GitHub (b9a9609):** a v0.12.7 refeita (pet ao lado, asa por item, montarias); as telas do QA (Torre inteira, Troca de era, Correio, Chat, Ranking, Missões, Guilda, Códex); o aviso de FC que sobe/desce; Atividade/Conquistas ligadas por trás. Tudo salvo, mas ainda NÃO conferido no navegador: o engenheiro confere e fecha a v0.12.7

- **21h25 · Seus votos (conferidos na página):** você APROVOU as 4 Fases adultas V2 (Kael e Kaia, adulto e guerreiro) e a Serpe V2. Não há nada pendente na página: 107 aprovados. Ainda falta corrigir a pistola do Kael guerreiro ("arma não está na mão"), que você reprovou
  - Arte: começa agora as animações do adulto e do guerreiro (Kael e Kaia)
  - Engenheiro: liga a Serpe V2
- **21h25 · Nova regra (sua ordem):** TODA sessão commita e sobe para o GitHub na hora em que termina cada pedaço, sem esperar a versão
- **21h20 · QA entregou 4 telas escritas:** Códex, Correio, Chat e Guilda, mais a Torre inteira refeita e a Troca de era sem ultimate. Ainda não foram ligadas nem vistas rodando. Agora o QA pega Mapa das Eras e Perfil (a Arte voltou para a animação)

- **21h10 · Sistemas entregou (refeito depois do acidente, 42 testes):** a conta do FC que sobe/desce (o engenheiro liga na v0.12.8); a tabela de raridade da ultimate (só visual, o dano continua dos atributos); a regra da Atividade de hoje (baús em 20/40/60/80/100, sem diamante); 33 Conquistas em 5 grupos (diamante só no último nível, ~200 no jogo inteiro, total ~10,2 mil em 6 meses). Agora: telas Arena, Eventos, Torneio
- **21h10 · Servidor:** asa como item próprio refeita; começou as telas de entrada
- **21h10 · Sua ordem:** o QA não testa nada no aplicativo até TODAS as telas, montarias e pets estarem prontos; só escreve telas

- **21h · Força-tarefa de telas:** as 6 sessões escrevem telas ao mesmo tempo; o engenheiro só liga no jogo, em lotes (plano em `docs/FORCA_TAREFA_TELAS.md`)
  - QA: Torre (refazendo), Códex, Correio, Chat, Guilda
  - Sistemas: FC na tela (refazendo), Arena, Eventos, Torneio, Atividade/Conquistas
  - Servidor: Título, Login, Prólogo, Criação, Nome, Bem-vindo
  - Arte: Mapa das Eras, Perfil/Coleção
  - Engenheiro: refazendo a v0.12.7 (montarias), depois liga tudo de uma vez
- **21h · Acidente:** a sessão do QA rodou um comando que apagou o trabalho não salvo de todas as sessões depois da v0.12.6. Perdemos a v0.12.7 quase pronta (montarias, pet ao lado, asa por item) e alguns módulos; cada sessão está refazendo. O que já estava no GitHub não se perdeu. Nova regra: ninguém mais roda esse tipo de comando, e o engenheiro salva a cada entrega (a perda máxima passa a ser de minutos)
- **21h · Página de aprovação:** Serpe V2 e as 4 fases adultas V2 (recortadas, sem fundo verde) já estão lá para o seu voto

---

## A. O que eu preciso de você

- [x] Votos na página de aprovação: TUDO votado até agora (fases adultas V2, Serpe V2, 45 armas, montarias, Kaia, pets novos, aparência, Kael V2 animado, cenários 6 e 7, prints da v0.12.8). Nada pendente
- [ ] Próximos votos (quando chegarem, eu aviso): asa no Kael montado (refeita), Kaia adulta e guerreira V2 animadas, cenários das eras 5 e 8
- [ ] Moedas do incidente: escrever "sim" na janela do Engenheiro e ligar o celular no cabo
- [ ] Se quiser cópia do servidor no GitHub: criar um repositório PRIVADO vazio e mandar o endereço
- [~] Banco de desenvolvimento: Supabase criado; falta você pôr o DATABASE_URL na variável de ambiente (passo a passo a caminho)
- [ ] Servidor: acesso à AWS EC2, endereço do Postgres (DATABASE_URL), ID do Google, conta de serviço do Play Console e os produtos de compra (guia `fps-server/docs/google-play-setup.md`). Tudo por variável de ambiente, nunca por mensagem
- [ ] Política de privacidade num link; classificação etária; parecer de advogado (chat com menores, leilão, trocas)
- [x] Telas votadas hoje: todas aprovadas (Título B, Bem-vindo, Nome, Guilda, Aparência, missão guia, Passe com rolagem, Códex V2, Correio, Chat, Montarias, Missões)
- [x] Montaria Mítica: tigre de cristal

## B. SITUAÇÃO DE CADA PARTE DO JOGO (revisada em 13/11, 01h15)

Legenda: `[x]` ligado no jogo e conferido no navegador · `[~]` escrito e salvo, sendo ligado ou ajustado · `[ ]` ainda não feito

**Telas**
- [x] Batalha em tela cheia · Equipamento · Invocar · Loja · Passe (só a trilha + botão Missões) · Práticas · Títulos · Forja · Configurações · VIP · Pets · Ranking
- [x] Torre inteira rolando · Troca de era (sem "nova ultimate") · Missões · Perfil e Coleção · Códex · Guilda · Chat (só frases prontas)
- [x] Arena · Eventos (loja, missões, Trilha e Chefe) · Torneio do Poder · Montarias
- [x] Telas de entrada: Título B · Login (convidado; Google "em breve") · Prólogo com o avô · Criação · Nome · Bem-vindo de volta
- [x] Menu por nível com "NOVO!" e os 7 ícones novos
- [~] Correio (carta de boas-vindas entrando) · Instâncias (2 defeitos sendo corrigidos) · missão guia na batalha
- [x] Troca de era real e Vitória/Derrota com chefe real (testadas pelo laço da batalha)
- [~] Mapa das Eras (escrito; o QA liga à curva das 100 fases × 4 dificuldades)
- [~] Aba Aparência no Equipamento (escrita pelo QA; o engenheiro liga)
- [~] Leilão (só ouro, preço fixo, 18+; QA conferindo) · Oferta de 1ª compra (pronta; por enquanto só no Modo dono)

**Poder (FC) e habilidades**
- [x] FC que sobe (verde ▲) ou desce (vermelho ▼) na tela, com o total contando
- [x] Ultimate pela arma; a raridade muda cor, força e golpe final (Básico cinza, Épico roxo, Lendário dourado)
- [x] Números abreviados até o quintilhão

**Personagem**
- [x] Subir de nível novo · pistola e revólver · 45 armas por raridade com brilho
- [x] Morte nova do Kael (a pé e montado)
- [~] Asas por item (anjo eras 0-6 e 8; demoníaca era 7 e Hell): a pé ok; MONTADO reprovada por você, sendo presa nas costas
- [~] Kael crescendo: adulto e guerreiro V2 APROVADOS, sendo ligados; tamanho por fase na tela; evolução adolescente→adulto e adulto→guerreiro sendo animada
- [~] Kaia adulta e guerreira V2 sendo animadas (vão para o seu voto) · [ ] Kaia jogável na Criação (hoje "chega em breve")
- [ ] Auras maligna e celestial (Submundo e Celestial)

**PETS**
- [x] Ovo no nível 20 chocando; pet na batalha nos 3 estágios; tela de Pets; pet ao lado do Kael, um pouco à frente
- [~] Pet ainda encosta no inimigo (engenheiro ajustando)
- [x] Prismático por 1.000 fragmentos (regra pronta) · [ ] Cérbero, Pégaso e Prismático aparecendo na batalha · [ ] conferir o sorteio 79/21

**MONTARIAS**
- [x] As 6 (pônei, cavalo, tigre, lobo, grifo, serpe V2) paradas, correndo e golpeando, com aura por estrela; tela de Montarias; arma fora do rosto; sem mancha no lobo
- [~] Serpe aparecendo na tela de Montarias

**Mundo e progressão**
- [x] Inimigo sem ficar parado entre golpes (eras 0-6)
- [x] Cenários vivos: Medieval e Industrial ligados · [~] Futurista e Submundo APROVADOS, sendo ligados · [~] Moderna (acabamento) e Celestial indo para o seu voto
- [x] Curva de 6 meses simulada (grátis termina no dia 179, ~10,1 mil diamantes); inimigos mais fortes por era (sua decisão)
- [x] Qualidade (estrelas), fusão, item adormecido (regras prontas) · [~] ligando nas telas
- [~] Eras 7 (Submundo) e 8 (Celestial) jogáveis: números prontos, inimigos animados aprovados, ligando

**Loja e online (precisa do servidor e do seu acesso)**
- [~] Tudo pronto no PC e no jogo, desligado: contas, save na nuvem, compras do Google Play, correio, arena/ranking/eventos online, chat de frases prontas online. Falta: o seu acesso (AWS, banco, Google, Play Console)
- [ ] Painel de moderação (Servidor fazendo agora) · guilda e leilão online
- [ ] Repositório do servidor no GitHub: o fps-server está só neste PC; se quiser cópia, crie um repositório PRIVADO vazio e me mande o endereço

**Para a loja**
- [~] Tamanho: base de ~121 MB pelo Google Play (Play Asset Delivery); o resto baixa quando precisar. Regras prontas; o engenheiro liga antes da versão de loja
- [ ] App assinado, teste interno, ficha da loja

## C. Regras que você decidiu (resumo)

Nada parado; ninguém flutua; arma na mão direita · Só automático · Dano sai dos atributos · Ultimate pela arma, era muda cenário e drops · Mostrar FC que sobe/desce · Pet ao lado do Kael, todos aparecendo (asa, Kael montado, pet, inimigo) · Inimigos mais fortes por era (×1,08 até ×1,70) · Nunca sorteio pago; diamante comprado não passa entre contas · 9 eras, nível máx. 120, ~6 meses grátis / ~4 VIP, ~10 mil diamantes · 100 fases × 4 dificuldades · Liberação por nível (Mapa 1, Missões 2, Forja e Códex 12, Torre 15, Chat 16, pets 20, eventos 24, arena e ranking 28, guilda 32, montaria 38, torneio 40, leilão 45, asa 50) · Pets: estrelas = qualidade, nível até 90, 3 estágios · Prismático o mais raro · Montaria: o Kael monta, dá atributo, aura por estrela · Asa = item, você escolhe; skin de asa pode vir depois · Missões numa tela só (o Passe abre ela) · Chat só com frases prontas · Guildas até 30, Torneio 15×15 · Leilão em ouro, preço fixo, anônimo, 18+

## D. Versões (no GitHub; no celular só quando você pedir)

- [x] v0.12.1 a v0.12.4: tela cheia, arma na mão, pistola, liberação por nível, Forja, Configurações
- [x] v0.12.5: 45 armas, modo dono, asa, prévia da arte, raridade pela cor, VIP
- [x] v0.12.6: pets
- [x] v0.12.7 (11a2139): montarias, pet ao lado, asa por item; INSTALADA no seu S24
- [~] v0.12.8 (em curso, lotes já no GitHub): FC na tela, ultimate pela raridade, morte nova, inimigo sem parar, 6 montarias, cenário Industrial, e as telas Torre, Troca de era, Missões, Perfil, Códex, Guilda, Chat, Arena, Eventos, Torneio, Montarias e as telas de entrada
- [ ] Próximas: asa presa nas costas montado, fases V2 do Kael, cenários 6-7, Mapa, Aparência, Instâncias, Vitória/Derrota, missão guia, Correio, Kaia jogável, eras 7-8, Play Asset Delivery, servidor e compras
