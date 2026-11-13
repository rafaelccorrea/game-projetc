# Tudo o que o dono pediu (registro vivo)

Cada pedido vira uma linha: o que é, quem faz e em que pé está. O PO atualiza na hora. `[x]` feito · `[~]` em andamento · `[ ]` na fila · `[?]` espera decisão do dono

## 14/11/2026 (madrugada)
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
