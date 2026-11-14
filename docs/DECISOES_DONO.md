# Tudo o que o dono pediu (registro vivo)

Cada pedido vira uma linha: o que é, quem faz e em que pé está. O PO atualiza na hora. `[x]` feito · `[~]` em andamento · `[ ]` na fila · `[?]` espera decisão do dono

## 14/11/2026 (manhã)
- [x] **Dificuldade das eras 0-8 na opção A** (meio-termo): com módulos o Senhor cai em ~22-34 s; sem módulos vence com ~115% da FC pedida (0bbd70a, b87e350) · Sistemas
- [~] **Calendário do jogador grátis: DONO ESCOLHEU ~178 dias** (14/11): eras 6-8 mais duras, o chefe com módulos pode passar dos 30 s · Sistemas (medida na fila do PC)
- [~] **Temas de evento: DONO ESCOLHEU OS 3** (14/11): #2 Caçada aos Chefes, #4 Semana da Forja, #6 Festa dos Pets, alternando com o Festival (docs/EVENTOS_TEMAS.md) · Sistemas + Engenheiro + Arte + Servidor
- [~] **Batalha (dono jogando no S24, 14/11 tarde):** Fogueira no centro-baixo maior ✓; golpes num menu na lateral esquerda ✓; x1/x2/x4 na lateral; "FC recomendada" com ênfase quando fraco; botão "Como ganhar FC" com "Ir" mostrando só o que já liberou; "melhor" nunca com +0 de FC ✓; anel do Equip. não pula ✓ · Engenheiro + Sistemas. Mocks A/B da batalha no voto
- [x] **Regra: nada aparece antes de todo o conteúdo carregar** (nunca personagem parado) · agente de performance 1fa87af, falta QA completo
- [?] **Liberação progressiva** (docs/LIBERACOES.md): cronograma proposto para mostrar menos coisa no começo · dono decide
- [~] **Skin de arma de EVENTO na mão** (exceção à regra "arma na mão = equipada"; poder segue o da arma equipada): Lâmina do Caçador, Martelo das Eras, Lâmina do Festival · Engenheiro + Arte
- [x] **Biblioteca Play Billing no app sem ligar compras** (PO) para destravar o cadastro de produtos no Play Console
- [~] **Voto dos temas de evento (14/11 16h16):** Caçada aos Chefes A (escuro), Semana da Forja B (claro, sem sacos de ouro), Festa dos Pets A (escuro, com o dragãozinho) · Arte gera as peças (lote 2)
- [~] **Arte dos temas de evento: dono liberou lotes 1 e 2** (até ~32 créditos; 6 mocks A/B para voto, depois peças). Skin "Avental do Ferreiro": decidir depois (fica escondida) · Arte
- [x] Missão "Vença 15 instâncias" do Festival não contava: corrigida (9c8de08), falta o QA ver
- [x] **Pacote da Play Store ≤150 MB** (base estava 161 MB): arte de telas tardias baixa logo após instalar + compressão sem perda (decisão do PO, sem mudança visual) · Engenheiro + Arte + Sistemas
- [~] **Aquecimento do S24**: batalha para de desenhar atrás de telas cheias (no main); medir antes/depois · Engenheiro

## 14/11/2026 (madrugada)
- [x] **Teto de +25% no bônus de ouro** aprovado e aplicado
- [~] **~40 créditos para as peças pintadas das telas votadas** liberados ("tô ficando meio com medo… dessa vez vou liberar"): teto 38, peças em grade, 1 teste antes de cada grupo, no máximo 1 refação por peça · Arte + PO
- [~] **Nome da guilda montado pelo jogador** com listas fixas (sem digitar) · Sistemas + Servidor + Engenheiro
- [x] **"Ultimate" fica como está** por enquanto
- [?] **Votos A/B** na Tela Inicial, Mentores e nas 6 telas novas · dono vai analisar
- [~] **Votos do dono (14/11, 01h25-02h25):** Ícones do Grimório, Molduras VIP e Fogueira da Guilda APROVADOS; mocks do Higgsfield escolhidos: Ladrão A, Dupla A, Acampamento B, VIP e Passe B (as versões em código de Acampamento, Mentores e VIP/Passe foram reprovadas). Nota: "tá com risco no meio do perfil" → Engenheiro confere o Perfil. Falta voto: Tela Inicial e Mentores
- [?] **Teto de +25% no bônus de ouro** (títulos e prática até +10% cada) · dono decide
- [?] **~30 créditos para as telas novas do LoM** (Relíquias, Escavação, Hoje, Arena PvP, Masmorra, Minijogo) · dono decide
- [~] **Telas com vida, feitas no Higgsfield** ("você não está usando o Higgsfield da forma correta para montar as telas"): mock de tela cheia A/B antes de montar. Tela Inicial A/B no link; o dono liberou ~38 créditos para Mentores, VIP × Passe, Acampamento e Dupla, e ~4 para fechar o papagaio · Arte + PO
- [x] **App DEV no S24** com atualização ao vivo; recarga volta direto para a batalha; dicas 4 s; aviso de login no DEV
- [~] **Aprovado pelo dono (14/11):** corrigir o ouro das fontes antigas (offline 8 h = 60 min, Hora de Ouro +30%, tetos, oferta sem ouro); moldura Ouro no Nv 60; ~76 créditos para os golpes dos pets; VIP com teto de +10% (Fênix, Serpe e Mecha com poder de Épica); ouro do VIP +5/+10% e offline ×2 sem ouro · Sistemas + Engenheiro + Arte
- [?] **VIP e Passe (proposta no link)**: 1) poder do VIP com teto de +10% (Fênix e Serpe com visual Lendário e poder de Épica); 2) ouro do VIP +5/+10% e offline ×2 sem ouro; 3) Mecha (R$ 49,90) com poder de Épica; 4) preço dos níveis VIP (R$ 50 a R$ 5.000 proposto); 5) rastro de arma e aura VIP só visuais; 6) prêmio de temporada antiga volta como evento grátis?; 7) tirar a skin do VIP 10 até ter uma no corpo padrão · dono decide
- [~] **Acampamento**: protótipo no link; PO decidiu Nv 20, só pelo Menu, volta dentro da janela do offline, sem Melhorar na Tenda do Ouro
- [?] **Ouro nas fontes que já estão no jogo** (auditoria em docs/ECONOMIA_OURO.md): o offline dá 187 min de abate a cada 8 h (mais que o dia inteiro jogando). Proposta da Sistemas: offline 8 h = 60 min; Hora de Ouro +100% → +30%; teto na Mina de Ouro e na Torre; oferta paga sem ouro. Com tudo, upar fica 1,3-1,5× mais lento que hoje · dono decide
- [?] **Moldura Ouro**: com as 10 molduras VIP, a Ouro passaria a ser conquista de quem joga (ex.: nível 60) · dono decide
- [~] **Ícones do Grimório (18 feitiços + tinta, página, menu)** e **molduras VIP 1-10** gerados (~10 créditos) · Arte confere
- [~] **Aprovadas: 9 molduras do Perfil e Dupla das Eras** (00h35) → Arte põe as molduras no jogo; Engenheiro escreve a Dupla atrás de chave
- [~] **"ter molduras dos VIPs"**: 10 molduras, uma por VIP 1-10, cada vez mais ricas (só visual) · Arte (~4 créditos da reserva) + Sistemas
- [~] **Repensar recompensas do VIP e do Passe** ("pensar melhor nas recompensas dos VIPs e passe") · Sistemas faz proposta + protótipo hoje × proposta → voto
- [?] **Golpes novos dos pets médios/evoluídos** (19 golpes, ~76 créditos; teste do mamute passou) · dono libera o orçamento
- [~] **Ouro tem que ser escasso** ("sempre em quantidades pequenas… tudo upa com ouro; nem tão difícil, nem tão fácil"). Ouro da Provação cortado; auditoria de todas as fontes em docs/ECONOMIA_OURO.md · Sistemas
- [x] **Nome do jogador sem espaço** ("não")
- [~] **Baús do Mapa: fazer o recomendado** (fase 3 moedas + 1 pedra; fase 7 20 diamantes + 2 pedras), com o ouro pequeno · Sistemas
- [~] **Molduras novas bem modernas no Higgsfield** · Arte (1 teste antes; moldura Ouro segue a tabela do VIP 7)
- [~] **App DEV no celular com atualização ao vivo** (como hot reload do Flutter), separado do app normal · Engenheiro; CORS já liberado · Servidor
- [~] **Força-tarefa** ("aprovei diversas coisas faça força tarefa!") · todas as sessões
- [~] **Votos do dono no link (13/11, 22h58-23h17):**
    - Fogueira V5 **aprovada** (V4 reprovada) → Engenheiro escreve a tela com o Sys.bonfire
    - Arte da Fogueira, 9 estágios: **aprovada** → Arte prepara no formato do botão; loops de chama só com o pedido e o custo
    - Correio V3: **aprovado, versão A** → Engenheiro
    - Mapa das Eras V3: **reprovado** ("esta muito simples") → Sistemas faz a V4, mais rica, na direção A
- [x] **"continua tudo"** · todas as sessões seguem as filas
- [~] **Aprovadas pelo dono (14/11, 00h15):** Mapa das Eras V4, Provação do Mestre, Encruzilhada (vale até o fim da era, como mostrado), selo Fraco contra, Derrota com prêmio, Caminhos com Testar grátis, Grimório V3 → Engenheiro escreve atrás de chave, QA confere
- [?] **Ainda sem voto:** cartão "Vai sair" da fusão e abas de conjuntos (na página das 3 pequenas)
- [x] **"continua tudo"** (de novo, 14/11)
- [?] **Provação: ouro do prêmio no Nv 90 chega a ~86,7 mi** (60 × k × ouro de um abate). Alto? · dono decide
- [?] **Mapa V4: baús das fases 3 e 7** (provisório: moedas + 1 pedra; 20 diamantes + 2 pedras) · dono decide
- [x] **Fogueira: 9 laços de chama** no jogo (36 créditos) · Arte
- [x] **Tiro montado: 11 de 12**. A Kaia no tigre mítico reprovou 2 vezes (o bastão cobre o rosto); fica o golpe de espada ali, sem gastar mais · Arte
- [?] **Votar no link das telas: Grimório V3 e Derrota com prêmio pelo dano** · protótipos da Sistemas; o Engenheiro só liga depois do voto
- [x] **Encruzilhada: vale até o fim da era** (dono aprovou a tela como mostrada)
- [~] **As 14 recomendações do doc de idle: todas prontas no módulo**, desligadas e com testes (74d0956). Cada uma liga depois do voto no protótipo da tela · Sistemas → Engenheiro
- [?] **Perfil: nome com espaço?** O protótipo recusa "Maria Clara" (só "MariaClara"). Recomendação do PO: aceitar um espaço entre palavras · dono decide
- [?] **Perfil: moldura Ouro a partir do VIP 3 ou do VIP 7?** O protótipo diz VIP 3; a tabela do VIP diz VIP 7. Recomendação do PO: seguir a tabela do VIP (7) · dono decide
- [~] **As 14 recomendações dos idles parecidos aprovadas** ("vai checando tudo"), de docs/IDLE_PARECIDOS.md. O PO marca no doc do dono cada item pronto · Sistemas + Engenheiro + Servidor
- [~] **Fogueira V5, como o dono descreveu.** Mantém exatamente o layout da batalha que está no jogo hoje. Mudam só duas coisas: a Fogueira entra no centro da fileira dos 3 botões de ataque, e o ×1/×2/×4 vai para a lateral direita · Sistemas faz o protótipo sobre um print real → Engenheiro
- [~] **Fogueira V3 reprovada.** Palavras do dono: "a tela tem que lembrar sempre a tela inteira… metade da tela… poluída pela fogueira… encaixar a fogueira basicamente na tela que tem hoje"
    - A batalha de hoje continua em tela cheia; a Fogueira vira um botão compacto no HUD
    - O cartão de comparação só aparece ao tocar
    - Sistemas faz a V4
- [~] **Gerar no Higgsfield os 9 estágios da Fogueira, até o final** · Arte + PO
- [~] **Todas as recomendações do doc "Legend of Mushroom × Eonbound" aprovadas** ("vai checando tudo"), P1, P2 e P3. O PO marca no doc do dono cada item pronto (https://claude.ai/artifact/N5zUQUBWF34oiQstVfKTP8) · Sistemas + Engenheiro + Servidor, em multiagentes
- [~] **"faça TUDO em multiagentes! URGENTE!"** · todas as sessões abrindo subagentes em paralelo
- [~] **Fogueira V2 reprovada** ("muito simples! tem que se encaixar na tela inicial de batalha!"). A Fogueira não é uma tela separada: fica fixa embaixo, no centro da tela de batalha, como a lâmpada do Legend of Mushroom. O cartão "novo × atual" abre por cima sem pausar a luta, e o automático forja ali mesmo · Sistemas refaz (v3) sobre a Batalha V2 → Engenheiro
- [~] **Fogueira das Eras (tipo as lâmpadas do Legend of Mushroom): fazer o protótipo.**
    - O nível dela é independente da era do jogador ("pode ir para a medieval com a fogueira inicial").
    - Ela sobe de nível e muda de visual pelo tema das eras, em 9 estágios.
    - Forja itens conforme o próprio nível.
    - Brasas só jogando, nunca à venda.
  · Sistemas faz o protótipo; Arte faz os 9 visuais depois
- [~] **Pesquisar outros jogos do gênero para adequar** · PO (docs/PESQUISA_CONCORRENTES.md)
- [x] **Instalar quando o dono pedir, na hora, com memória ou sem** · PO instala via adb
- [~] **"instala, e sim liga tudo!"**
    - Instalar a v0.13.2 no S24 · Engenheiro + QA
    - Ligar na próxima versão: eras 7 e 8, Asa Seráfica, skins e itens novos de prêmio · Engenheiro + Sistemas
    - Dificuldade e eras finais: ligam assim que a calibração fechar · Sistemas
    - Online (Arena, Guilda, Torneio): depende do SSH
- [x] **Kael Anjo refeita sem asa** ("a skin que já tem asas tem que ser refeita"): teste com vídeo de referência de movimento (4 créditos) · Arte
- [x] **Votos nas telas V2.**
    - Aprovadas: Perfil V5, Batalha, Equipamento, Forja, Pets, Montarias, Invocar, Loja, VIP, Passe, Fim das 9 eras, Guilda, Torneio do Poder e Torre (a Arena já estava aprovada).
    - Reprovadas: Mapa das Eras ("nada moderno") e Correio ("creio que essa não é a melhor proposta"). A Sistemas traz 2 direções de cada.
    - Asa Seráfica: **versão A**.
    - O Engenheiro passa as telas aprovadas para o jogo, na ordem do PASSAGEM.md.
- [~] **Plano dos 119 créditos do Higgsfield, APROVADO:**
    1. Obrigatório (~10): Kaia na Fênix, ícones das eras 7 e 8, aura da Forja do +16 ao +20, Asa Seráfica depois do voto.
    2. Tiro montado (~48): Kael e Kaia atirando nas 6 montarias.
    3. Montaria parada na tela de derrota (~36).
    4. Reserva de ~25 para refazer.
    5. Golpe, giro e pistola das skins iguais ao padrão vão pelo Kling grátis (~14 dias).
  · Arte + rafae-47 + Engenheiro
- [~] **Nomes das armas pela família** nas 9 eras (ex.: era 0 é tudo clava). A Sistemas monta a tabela "nome atual → novo" e o dono vê antes de aplicar
- [~] **Arma Mítica liberada** (sai a regra do lançamento que a trocava por Épica) · Sistemas
- [~] **Ligar itens novos de prêmio (newDrops) e skins (skinsOn)** na próxima versão · Sistemas + Engenheiro
- [x] **Tiro montado**: por enquanto, quem está montado com arma de fogo ataca com o golpe de espada; fica anotado na matriz
- [~] **Arte item por item até 100%** ("faça uma arma: a arma e todos os processos dela, na mão de todos os personagens, de todas as skins, com todos os efeitos; aí vai pro próximo"). O que conta como pronto, por tipo: docs/ARTE_PRONTO.md. A situação de cada item fica em docs/ARTE_MATRIZ.md (a Arte monta). O próximo item só abre quando o atual está 100%, visto na tela · Arte + rafae-47 + Engenheiro + QA
- [~] **Arte: animar por completo o que JÁ existe antes de criar coisa nova** ("prioridade não é criar as coisas novas e sim animar o que já temos por completo"). Montarias e pets novos ficam para depois. Primeiro vêm: os golpes dos pets nos estágios médio e evoluído (hoje só 1 golpe), a Kaia na Fênix, o Mecha montado (está à venda), os ícones de golpe das eras 7 e 8, os inimigos das eras 7 e 8 ligados e as limpezas do Ciborgue · Arte confirma a lista, rafae-47 faz pelo caminho grátis, Engenheiro faz a ligação
- [~] **Acabar as eras NÃO é o fim do jogo** ("acabar as eras não quer dizer que o jogo acabou"): fase 90 = "fim das 9 eras"; depois disso vêm as fases sem fim (+3% por fase) e metas que seguem forçando evolução (marcos a cada 10 fases, ranking, Forja/pet/montaria, Torneio e Arena) · Sistemas propõe o pós-eras e ajusta textos/tela
- [x] **Link das telas recriado** e **fim das 9 eras ligado** (pedido do dono): liga depois da APK, quando o Engenheiro medir que 100% da FC vence o chefe · Sistemas + Engenheiro
- [?] **Skin montada do Samurai e do Ciborgue**: A ~196 créditos (7 montarias), B ~56 (lobo e cavalo), C grátis (só a cabeça) · dono decide
- [~] **Paredes das eras 5-8**: em vez de 5-12 dias, mais fontes de FC no fim (Forja além do +15, Divino mais cedo, títulos das eras 7-8), paredes de 3-5 dias · Sistemas propõe e simula
- [x] **Um link só para todas as telas** (https://claude.ai/artifact/Dje98dqTa6vConwpewnGds) · PO
- [x] **Bug da Arena** (a luta seguia depois do fim) corrigido; durante a Arena a batalha das fases segue rendendo escondida · Engenheiro
- [~] **Dificuldade força evolução** (não pode passar as eras fácil; abaixo da FC recomendada fica muito difícil; paredes de 1-3 dias no chefe de cada era; aviso do que fazer quando travar) · APROVADA pelo dono (00h50): FC pedida por fase, paredes de 1-3 dias, montaria +2-3% por estrela, teto diário de XP de abate ligado. Sistemas fecha os números → Engenheiro liga atrás de chave → QA mede → APK
- [~] **Telas são prioridade**: protótipos no padrão aprovado (Equipamento, Loja, Invocar, Passe, Pets, Montarias, Forja, VIP, Batalha, fim das 9 eras) · Sistemas → voto do dono
- [~] **Luta PvP da Arena** (aprovada) · Engenheiro: LIGADA no código (f75739b), QA confere na tela. Decidido pelo PO: prêmio por luta (Sistemas credita), cada um aparece como é (robôs pelo nível), ultimate e golpe de pet marcados no registro da luta
- [~] **APK v0.13.1 para testar no celular** quando a Arena acabar · Engenheiro
- [~] **Auditoria de responsividade** (todas as telas, 5 tamanhos) · QA, travada por falta de memória do PC
- [x] Commit e push de tudo · todas as sessões
- [x] Código do servidor no GitHub privado · Servidor

## 13/11/2026 (noite)
- [x] Skins fixas no corpo padrão; Samurai e Ciborgue prontos; Kael Anjo sem asa quando há asa equipada · Arte
- [~] Fazer toda a arte possível com o saldo: Fênix Gigante (Kael pronto, Kaia paga) → ícones das eras 7-8 → Dragão Negro · Arte, parada até o dono logar de novo no Higgsfield
- [?] Comprar ~700-1.000 créditos para fechar a arte (9 montarias montadas, 6 pets, montaria sem cavaleiro) · dono
- [x] Levantamento de toda a arte que falta (docs/LEVANTAMENTO_ARTE.md) · PO
- [x] Peças em 3 desenhos por raridade (9 eras) e ícones dos 34 títulos · Arte
- [x] Pet sempre na frente; tudo que muda no personagem aparece na hora; nunca rolagem lateral · Engenheiro
- [x] Arma na mão = sempre a equipada (aba "Skins arma" saiu) · Engenheiro/Sistemas
- [x] Vários servidores (S1 Nova Era), escolha de servidor na entrada · Servidor/Sistemas
- [x] Servidor no ar com banco, online na v0.13.0 · Servidor
- [x] Modo dono: Liberar tudo, recursos infinitos, compra simulada · Engenheiro/Servidor
- [x] Mochila nova · Sistemas
- [x] Excluir conta (apaga tudo) · Sistemas/Servidor
- [x] Chefes das eras 7-8: Senhor do Submundo e Juiz Celestial; eras 7-8 jogáveis (desligadas até os ícones) · Engenheiro
- [x] Drop do chefe com anti-repetição · Servidor
- [x] Desempenho (pior quadro 85 → 15 ms no PC) · Engenheiro; [ ] medir no S24
- [~] Perfil refeito (versão 5) · espera voto do dono
- [x] Textos da loja e páginas públicas (rascunho para o advogado) · Sistemas/Servidor
