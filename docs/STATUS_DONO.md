# Eonbound — checklist do dono

Atualizado em 12/11/2026, 21h, pelo PO. Legenda: `[x]` já funciona no jogo · `[~]` sendo feito agora · `[ ]` ainda não está no jogo

**Links:** Canvas https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba · Aprovação de arte https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19 · GitHub https://github.com/rafaelccorrea/game-projetc · Esteira detalhada `docs/BACKLOG_URGENTE.md`

**Regra combinada:** o celular só recebe o jogo quando TUDO abaixo estiver `[x]`. Única coisa que fica para depois do lançamento: Bênção de equipamento.

## AGORA (atualizado a cada entrega)

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

- [ ] Votar "Fases adultas V2": Kael e Kaia, adulto e guerreiro, com corpo de adulto (página de aprovação)
- [ ] Votar "Serpe dourada V2": o Kael sentado direito na sela (página de aprovação)
- [ ] Votar a arte nova ainda aberta na página: 45 armas, montarias novas, Kaia nas 3 fases, pets Cérbero/Pégaso/Prismático, aparência em camadas
- [ ] Servidor: acesso à AWS EC2, endereço do Postgres (DATABASE_URL), ID do Google, conta de serviço do Play Console e os produtos de compra (guia `fps-server/docs/google-play-setup.md`). Tudo por variável de ambiente, nunca por mensagem
- [ ] Política de privacidade num link; classificação etária; parecer de advogado (chat com menores, leilão, trocas)
- [x] Telas votadas hoje: todas aprovadas (Título B, Bem-vindo, Nome, Guilda, Aparência, missão guia, Passe com rolagem, Códex V2, Correio, Chat, Montarias, Missões)
- [x] Montaria Mítica: tigre de cristal

## B. O QUE AINDA NÃO ESTÁ NO JOGO

**Telas**
- [x] Batalha em tela cheia, menu agrupado, barras sobre o Kael · Equipamento · Invocar · Loja · Passe · Práticas · Títulos · Forja · Configurações · VIP
- [~] Torre (inteira rolando) · Troca de era (sem "nova ultimate") · Instâncias · Ranking animado · Vitória/Derrota (v0.12.8)
- [ ] Passe com rolagem · missão guia na Batalha · Missões (v0.12.10); "Atividade de hoje" e "Conquistas" dependem da regra que Sistemas está escrevendo
- [ ] Aba Aparência no Equipamento (v0.12.11)
- [ ] Título (logo B) · Login · Prólogo com o avô · Criação (Kael/Kaia) · Nome do jogador · Bem-vindo de volta · Perfil e Coleção · Oferta de 1ª compra (R$ 29,90)
- [ ] Códex V2 · Correio · Chat de frases prontas · Guilda
- [ ] Mapa das Eras com 100 fases × 4 dificuldades (Fácil/Médio/Difícil/Hell)
- [ ] Arena · Eventos · Torneio do Poder · Leilão (telas; prêmios só com servidor)
- [x] Menu: funções escondidas até o nível, com "NOVO!"

**Poder (FC) e habilidades**
- [ ] Mostrar o FC que subiu (verde ▲) ou desceu (vermelho ▼) em tudo que mexe no poder: item, título, pet, montaria, asa, Forja, fusão, nível (v0.12.8)
- [ ] Ultimate e habilidades pela ARMA na mão (a era da arma); a raridade muda cor, força e golpe final. A era do mapa muda só cenário e drops (v0.12.9)

**Personagem**
- [x] Subir de nível novo · pistola (eras 3, 5, 6) e revólver (era 4) · 45 armas por raridade com brilho
- [~] Asas: já aparecem atrás do Kael. Cada asa é um item; você equipa a que quiser. Anjo cai nas eras 0-6 e 8 (primeira asa no nível 50); demoníaca na era 7 e no Hell. Skin de asa pode vir depois
- [ ] Kael crescendo: adolescente (22), adulto (35), guerreiro (70), com animação de evolução. Adulto e guerreiro com CORPO DE ADULTO (arte refeita, esperando seu voto) e maiores na tela
- [ ] Kaia jogável e crescendo nas 3 fases (adulta e guerreira com corpo de mulher, idem)
- [ ] Morte nova do Kael (v0.12.12)
- [ ] Aparência em camadas: chapéu por era, colete e botas, óculos e máscaras, modo Itens/Skin, esconder peça
- [ ] Auras maligna e celestial (Submundo e Celestial)

**PETS**
- [x] Ovo no nível 20 chocando; pet na batalha nos 3 estágios, atacando sozinho; tela de Pets (v0.12.6)
- [~] Pet AO LADO do Kael, um pouco à frente, sem cobrir a montaria (v0.12.7, em ajuste)
- [ ] Conferir o sorteio 79% / 21% e os outros pets (Esfinge, Dragão, Cão) na batalha
- [ ] Pets do Submundo (Cérbero), Celestial (Pégaso) e Prismático (raposa, por 1.000 fragmentos)

**MONTARIAS**
- [~] Kael montado no Lobo e no Grifo, com a arma do jogador (v0.12.7, em ajuste: pet cobrindo as patas, asa se confundindo com a do grifo, aura fraca)
- [ ] Pônei, Cavalo de guerra e Tigre de cristal (arte pronta, ligando na v0.12.7)
- [ ] Serpe dourada V2 (refeita, esperando seu voto)
- [ ] Tela de Montarias · aura por estrela · atributos (3% a 12%) · lobo na oferta de 1ª compra

**Mundo e progressão**
- [ ] Inimigo sem ficar parado entre golpes · cenário vivo Industrial (v0.12.12), depois Moderna, Futurista, Submundo, Celestial
- [ ] Submundo e Celestial jogáveis (inimigos, chefes, mapas)
- [ ] Curva de 6 meses (níveis 1-120), qualidade do item (estrelas), fusão, item adormecido, números abreviados
- [ ] Raridade pela cor também no item caído no chão (brilho/feixe) e na mochila, com som

**Loja e online (precisa do servidor e do seu acesso)**
- [~] Servidor pronto no PC: contas, save na nuvem, compras do Google Play, cartão mensal, correio (134 testes). Falta o seu acesso para pôr no ar
- [ ] Login convidado + Google · compras reais (gemas, cartão mensal, Passe Premium, skins, oferta, VIP)
- [ ] Ranking/Arena/Eventos/Torneio com prêmio, Leilão, Guilda, chat de frases prontas, painel de moderação

**Para a loja**
- [ ] Carregar só a arte em uso (para não travar em celular comum)
- [ ] App assinado, teste interno, ficha da loja

## C. Regras que você decidiu (resumo)

Nada parado; ninguém flutua; arma na mão direita · Só automático · Dano sai dos atributos · Ultimate pela arma, era muda cenário e drops · Mostrar FC que sobe/desce · Pet ao lado do Kael, todos aparecendo (asa, Kael montado, pet, inimigo) · Nunca sorteio pago; diamante comprado não passa entre contas · 9 eras, nível máx. 120, ~6 meses grátis / ~4 VIP · 100 fases × 4 dificuldades · Liberação por nível (pets 20, eventos 24, arena 28, guilda 32, montaria 38, torneio 40, leilão 45, asa 50) · Pets: estrelas = qualidade, nível até 90, 3 estágios · Prismático o mais raro · Montaria: o Kael monta, dá atributo, aura por estrela · Asa = item, você escolhe · Missões numa tela só (o Passe abre ela) · Guildas até 30, Torneio 15×15 · Leilão em ouro, anônimo, 18+

## D. Versões (no computador; o celular só no fim)

- [x] v0.12.1 a v0.12.4: tela cheia, arma na mão, pistola, liberação por nível, Forja, Configurações
- [x] v0.12.5 (f30627f): 45 armas, modo dono, asa, prévia da arte, raridade pela cor, VIP
- [x] v0.12.6 (0bdde98): pets
- [~] v0.12.7: montarias, pet ao lado, asa por item, tela de Montarias
- [ ] v0.12.8 FC na tela + Torre/Troca de era/Instâncias/Ranking/Vitória · v0.12.9 ultimate pela arma · v0.12.10 Passe/missão guia/Missões · v0.12.11 Aparência · v0.12.12 Kaia, morte, inimigo, cenário Industrial · v0.12.13 telas iniciais · v0.12.14 Correio/Códex/Chat/Guilda
- [ ] v0.13.x: Mapa + 100 fases + curva, eras 7-8, Kael e Kaia crescendo (após seu voto), carregamento sob demanda, servidor e compras
