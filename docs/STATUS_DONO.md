# Eonbound — checklist do dono

Atualizado em 12/11/2026 pelo PO. Legenda: `[x]` já funciona no jogo · `[~]` sendo feito agora · `[ ]` ainda não está no jogo

**Links:** Canvas https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba · Aprovação de arte https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19 · GitHub https://github.com/rafaelccorrea/game-projetc · Esteira detalhada `docs/BACKLOG_URGENTE.md`

**Regra combinada:** o celular só recebe o jogo quando TUDO abaixo estiver `[x]`. Única coisa que fica para depois do lançamento: Bênção de equipamento.

---

## A. O que eu preciso de você

- [ ] Escolher a montaria Mítica (página de aprovação): tigre de cristal ou serpe esmeralda
- [ ] Votar: aba Aparência (Equipamento), missão guia na Batalha, Passe com rolagem, Códex refeito, as 45 armas, montarias novas, Kaia crescendo, pets novos (quando chegarem)
- [ ] Servidor: acesso à AWS + Postgres de desenvolvimento; ID do Google e conta de serviço no Play Console; criar os produtos de compra (guia `fps-server/docs/google-play-setup.md`). Sem mandar senha por mensagem
- [ ] Política de privacidade num link; classificação etária; parecer de advogado (chat com menores, leilão, trocas)
- [ ] Renomear as janelas: /rename Engenheiro · Sistemas · Servidor · Arte · QA · PO

## B. O QUE AINDA NÃO ESTÁ NO JOGO (tudo que conversamos hoje)

**Telas**
- [x] Batalha em tela cheia com menu agrupado, barras de vida/energia sobre o Kael
- [x] Equipamento (Equipar melhor, arrastar), Invocar, Loja, Passe, Missões, Práticas e Títulos
- [x] Forja e Configurações novas (v0.12.4)
- [x] VIP (v0.12.5) · [ ] Troca de era — [~] escrita, falta ligar
- [ ] Torre (inteira rolando, igual ao canvas) · Instâncias · Ranking animado · Vitória/Derrota — [~] sendo escritas
- [ ] Título novo (logo B Cristal) · Login · Prólogo com o avô · Criação (Kael/Kaia) · Nome do jogador · Bem-vindo de volta
- [ ] Perfil e Coleção (títulos, molduras, auras, asas, estatísticas)
- [ ] Códex das Eras (sendo refeito)
- [ ] Mapa das Eras com 100 fases e 4 dificuldades (Fácil/Médio/Difícil/Hell)
- [ ] Oferta de primeira compra (R$ 29,90)
- [ ] Arena · Eventos · Torneio do Poder · Leilão · Guilda (telas; prêmios só com servidor)
- [x] Menu: funções escondidas até o nível, com "NOVO!"

**Personagem**
- [ ] Kael crescendo: adolescente (nível 22), adulto (35), guerreiro (70), com animação de evolução
- [x] Subir de nível novo
- [ ] Kaia jogável (garota) e Kaia crescendo (3 fases)
- [ ] Morte nova do Kael (joelho, de bruços, espada cai, escurece)
- [x] Pistola nas eras 3, 5, 6 e revólver na era 4
- [x] Armas diferentes por raridade (45 armas) + brilho da raridade (v0.12.5)
- [ ] Aparência em camadas: chapéu por era, colete e botas mudando de cor, óculos e máscaras, modo Itens/Skin, esconder peça
- [~] Asas (demoníaca, anjo) no espaço de asa — já aparece (v0.12.5); regra: cada asa é um item, você equipa a que quiser (não muda por era nem raridade)
- [ ] Auras maligna e celestial (Submundo e Celestial)

**PETS (você ainda não viu nenhum no jogo)**
- [ ] Ovo no nível 20 com animação de chocar (79% Básico / 21% Raro)
- [ ] Pet andando atrás do Kael e atacando sozinho (3 ataques)
- [ ] 5 pets do lançamento nos 3 estágios (filhote → médio no 30 → evoluído no 60) com aura e animação de evolução
- [ ] Tela de Pets (equipar, alimentar, redefinir nível, coleção)
- [ ] Pets do Submundo (cérbero), Celestial (pégaso) e Prismático (raposa) animados; Prismático por 1.000 fragmentos

**MONTARIAS (você ainda não viu nenhuma no jogo)**
- [ ] Kael montado no Lobo e no Grifo (galopar, parado, golpe)
- [ ] Aura com fumaça ao evoluir (estrelas)
- [ ] Pônei, Cavalo de guerra, Mítica, Serpe dourada — [~] arte sendo feita
- [ ] Espaço de montaria e atributos (3% a 12%); lobo na oferta de primeira compra

**Mundo e progressão**
- [ ] Cenários vivos: Industrial (aprovado, falta ligar), Moderna, Futurista, Submundo, Celestial
- [ ] Inimigo sem ficar parado entre golpes
- [ ] Submundo e Celestial jogáveis (inimigos, chefes, ultimates, mapas)
- [ ] Curva de 6 meses (níveis 1-120, travas por era), qualidade do item (estrelas), fusão, item adormecido, números abreviados
- [ ] Raridade pela cor em tudo (item no chão com brilho/feixe, mochila, loja, invocação) com som

**Loja e online (precisa do servidor)**
- [ ] Login convidado + Google, progresso salvo na nuvem
- [ ] Compras reais (gemas, cartão mensal, Passe Premium, skins, oferta, VIP)
- [ ] Ranking/Arena/Eventos/Torneio com prêmio, Leilão, Guilda, chat de frases prontas, painel de moderação

**Para a loja**
- [ ] Carregar só a arte em uso (para não travar em celular comum)
- [ ] App assinado, teste interno, ficha da loja

## C. Regras que você decidiu (resumo)

Nada parado; ninguém flutua; arma na mão direita · Só automático · Dano sai dos atributos · Nunca sorteio pago; diamante comprado não passa entre contas · 9 eras, nível máx. 120, ~6 meses grátis / ~4 VIP · 100 fases × 4 dificuldades · Liberação por nível (pets 20, eventos 24, arena 28, guilda 32, montaria 38, torneio 40, leilão 45, asa 50) · Pets: estrelas = qualidade, nível até 90, 3 estágios · Prismático o mais raro · Montaria: o Kael monta, dá atributo, aura por estrela · Preços aprovados · Guildas até 30, Torneio 15×15 · Leilão em ouro, anônimo, 18+

## D. Versões (no computador; o celular só no fim)

- [x] v0.12.1 tela cheia · v0.12.2 arma na mão, barras · v0.12.3 pistola, liberação por nível, level up · v0.12.4 Forja, Configurações, botões, revólver
- [x] v0.12.5 modo dono, prévia da arte, 45 armas, asa, VIP, raridade pela cor
- [~] v0.12.6 pets (ovo no 20, pet na batalha, tela de Pets) → depois montarias
- [ ] seguintes: pets, montarias, Kaia, morte, cenários, aparência, 4 fases, telas iniciais, mapa + curva, eras 7-8, carregamento sob demanda, servidor e compras
