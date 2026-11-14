# Tudo o que o dono pediu (registro vivo)

Cada pedido vira uma linha: o que é, quem faz e em que pé está. O PO atualiza na hora. `[x]` feito · `[~]` em andamento · `[ ]` na fila · `[?]` espera decisão do dono

## 14/11/2026 (madrugada)
- [~] **Votos do dono no link (13/11, 22h58-23h17):**
    - Fogueira V5 **aprovada** (V4 reprovada) → Engenheiro escreve a tela com o Sys.bonfire
    - Arte da Fogueira, 9 estágios: **aprovada** → Arte prepara no formato do botão; loops de chama só com o pedido e o custo
    - Correio V3: **aprovado, versão A** → Engenheiro
    - Mapa das Eras V3: **reprovado** ("esta muito simples") → Sistemas faz a V4, mais rica, na direção A
- [x] **"continua tudo"** · todas as sessões seguem as filas
- [?] **No link para votar:** Mapa das Eras V4, Provação do Mestre, Encruzilhada, 3 pequenas (Fraco contra · Vai sair · Conjuntos), Derrota com prêmio, Grimório
- [?] **Provação: ouro do prêmio no Nv 90 chega a ~86,7 mi** (60 × k × ouro de um abate). Alto? · dono decide
- [?] **Mapa V4: baús das fases 3 e 7** (provisório: moedas + 1 pedra; 20 diamantes + 2 pedras) · dono decide
- [x] **Fogueira: 9 laços de chama** no jogo (36 créditos) · Arte
- [x] **Tiro montado: 11 de 12**. A Kaia no tigre mítico reprovou 2 vezes (o bastão cobre o rosto); fica o golpe de espada ali, sem gastar mais · Arte
- [?] **Votar no link das telas: Grimório V3 e Derrota com prêmio pelo dano** · protótipos da Sistemas; o Engenheiro só liga depois do voto
- [?] **Encruzilhada das Eras: bênção vale até o fim da era (como no doc) ou é permanente?** Hoje segue o doc. Mudança pequena se for permanente · dono decide
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
