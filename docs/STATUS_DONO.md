# Eonbound — checklist do dono

Atualizado em 12/11/2026 pelo PO (sessão fps-98). Legenda: `[x]` feito · `[~]` em andamento · `[ ]` falta

**Links**
- Canvas das telas: https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba
- Página de aprovação de arte: https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19
- Código no GitHub: https://github.com/rafaelccorrea/game-projetc (branch main; só código, sem imagens e áudio)
- Lista do que falta para a loja: `docs/LANCAVEL.md`

---

## 1. O que eu preciso de você agora

- [ ] **Religar o celular no cabo e deixar desbloqueado** (a versão 0.12.3 está pronta para instalar)
- [ ] Liberar mais espaço no disco C: (hoje ~7 GB; ideal 20 GB): Lixeira, pasta Vídeos (3,2 GB)
- [ ] Votar no canvas: 01b Título novo (escolher o logo A/B/C), 26 Guilda V2, 28 Bem-vindo de volta, 29 Nome do jogador, 30 Códex das Eras, aba Aparência no Equipamento, missão guia na Batalha, Passe com rolagem
- [ ] Servidor: passar o acesso à AWS e um Postgres de desenvolvimento (sem mandar senha por mensagem)
- [ ] Play Console: criar os produtos de compra (lista em `fps-server/docs/google-play-setup.md`)
- [ ] Política de privacidade publicada num link; classificação etária
- [ ] Parecer de advogado (chat com menores, leilão e trocas; ECA Digital e LGPD)

## 2. Regras do jogo que você decidiu

**Visual e combate**
- [x] Nada parado; ninguém flutua; pés sempre no chão; arma na mão direita
- [x] Só AUTOMÁTICO (sem modo manual)
- [x] Batalha em tela cheia, sem barra de baixo; ícones Equipamento/Invocar/Loja/Passe à esquerda; MENU agrupado
- [x] Barras de vida e energia acima da cabeça do Kael
- [x] Dano sai dos atributos (2 mil de força nunca dá 1 milhão de dano); números grandes abreviados (mil, mi, bi, tri)
- [x] Kael cresce: garoto → adolescente (nível 22) → adulto (35) → guerreiro lendário (70), com animação de evolução
- [x] Aparência em camadas: arma, chapéu, colete, botas e cosméticos (óculos, máscara) por cima da roupa; modo Itens ou Skin; ocultar peça por peça; colar e luvas não aparecem

**Progressão**
- [x] 9 eras (Pré-História → Celestial); nível máximo 120
- [x] Cada era com 100 fases e 4 dificuldades (Fácil, Médio, Difícil, Hell); liberar a próxima era exige dificuldades crescentes
- [x] Duração: ~6 meses grátis / ~4 meses VIP até o fim; quem falta ganha bônus de retorno (até 3 dias)
- [x] Funções escondidas até o nível de liberação, com "NOVO!": missões 2, invocar 3, práticas 5, correio 7, perfil/loja de gemas 10, forja 12, instâncias 14, torre 15, passe 18, pets 20, eventos 24, arena 28, guilda 32, montaria 38, torneio 40, leilão 45, asa 50
- [x] Torre com chefe a cada 10 andares; instâncias com 2 entradas por área (+1 VIP)

**Itens**
- [x] Qualidade do item: poder 0-10.000 e estrelas 1-5 (10.000 = 1 em 1 milhão); a raridade sempre manda
- [x] Fusão: 3 iguais com a mesma estrela → +1 estrela (até 5★); sem diamante
- [x] Item de qualquer era serve em qualquer era; item de era futura fica "adormecido" até você chegar lá
- [x] Transformação de item (sobe de era mantendo raridade e visual)
- [x] Equipar melhor (automático) e arrastar o item para o espaço

**Pets, montarias e economia**
- [x] Pets: libera no nível 20 com ovo (79% Básico / 21% Raro); estrelas = qualidade, nível até 90; filhote → médio (30) → evoluído (60) com aura; 3 ataques automáticos (básico ~90%, crítico ~7%, mediano ~3%)
- [x] Prismático: o mais raro (até 25% da força), 1.000 fragmentos sem sorteio (eventos, VIP 10, arena, chefe da era 8, torre)
- [x] Montaria: o Kael monta; dá 3% a 12% de ataque e vida; aura com fumaça ao evoluir (estrelas); Lobo e Grifo são Épicos
- [x] Preços: gemas R$ 4,90 a 199,90 (1ª compra em dobro), cartão mensal R$ 19,90, Passe Premium R$ 24,90, skins R$ 9,90-29,90, oferta de 1ª compra R$ 29,90 (24 h, só para quem nunca comprou), VIP pelo valor gasto
- [x] Nunca sorteio pago; diamante comprado nunca passa para outra conta
- [x] Leilão de itens (ouro ou Marcos, vendedor anônimo, item chega no nível 1, 18+)
- [x] Guildas: até 30 membros, trocas com as travas do leilão, Torneio do Poder (28 territórios, 15 contra 15), Estandartes até +5%

## 3. Telas (canvas)

**Aprovadas:** 00 Carregamento · 01 Título · 02 Login · 03 Criar personagem · 04c Batalha V2 · 05 Equipamento · 06 Invocar · 07 Loja · 08 Passe · 09 Configurações · 10 Vitória/Derrota · 11 Troca de era · 12 Ranking · 13 Instâncias · 14 Torre · 15 Forja · 16 Práticas e Títulos · 17b Pets · 18 VIP · 19 Prólogo · 20 Mapa das Eras · 21 Perfil · 22 Oferta · 23 Arena · 24 Eventos · 25 Leilão · 27 Torneio do Poder

**Esperando seu voto:** 01b Título novo · 26 Guilda V2 · 28 Bem-vindo de volta · 29 Nome do jogador · 30 Códex das Eras · aba Aparência (05) · missão guia (04c) · Passe com rolagem (08)

## 4. Arte

**Aprovada (destaques):** Kael nas 4 fases com todas as animações · Kaia garota · inimigos e ultimates das 9 eras · cenários vivos das eras 0-4 · 5 pets do lançamento nos 3 estágios · pets do Submundo, Celestial e Prismático (imagens) · lobo e grifo montados + aura · asas · auras · pistola · mapas das 9 eras · relógio · avô · ícones

**Sendo corrigida (você reprovou):** pistola do Kael guerreiro (arma fora da mão) · Kael no lobo parado (arma some dentro da montaria)

**Em produção:** chapéus por era nas 4 fases · 2 óculos e 2 máscaras · prévia da aparência em camadas · cenários vivos das eras 5 a 8

**Em produção, antes do lançamento (sua correção):** montarias Pônei, Cavalo de guerra, Mítica e Serpe dourada · Kaia crescendo (3 fases) · pets do Submundo, Celestial e Prismático animados

**Só depois do lançamento:** Bênção de equipamento (gemas cravejadas nos Míticos)

**Créditos:** saldo ~920. Fila enxuta para o lançamento quase toda gasta; o resto é reserva para refazer o que você reprovar.

## 5. Jogo no seu celular

**Hoje no seu celular abre:** Equipamento, Invocar, Loja, Passe, Missões, Práticas e Títulos, Configurações (antiga), Baú, Desafiar. **Ainda não existe como tela no jogo:** Forja (0.12.4), Pets (0.12.5), Montarias (0.12.6), VIP/Instâncias/Torre/Ranking/Troca de era/Vitória-Derrota (em paralelo, saindo junto), Título/Login/Prólogo/Criação/Perfil/Oferta (0.12.10), Mapa e 100 fases (0.13.0), fases do Kael e Kaia, aparência, eras 7-8 (0.13.x), Correio/Eventos/Arena/Leilão/Guilda/Torneio/chat (com o servidor, 0.14.x).

- [x] 0.12.1: batalha em tela cheia, painéis em tela cheia, sem modo manual
- [x] 0.12.2 (instalada): barras sobre o Kael, jogo mais leve (98 quadros/s), arma do item na mão, Equipar melhor e arrastar
- [~] 0.12.3 (pronta, falta o celular no cabo): pistola, 2 inimigos por vez em 3 eras, level up novo, funções escondidas até o nível
- [ ] 0.12.4 Forja e Configurações novas, cenário Industrial, inimigo parado, morte nova do Kael
- [ ] 0.12.5 Kaia jogável · 0.12.6+ pets, montarias, raridade pela cor, telas que faltam, prólogo, perfil, oferta
- [ ] 0.13.x curva de 9 eras + 100 fases × 4 dificuldades + mapa + qualidade/fusão + Kael crescendo + Submundo e Celestial
- [ ] 0.14.x loja: arte carregada por era, app assinado, teste interno, compras reais

## 6. Servidor (NestJS + Postgres, AWS opção A)

- [x] Login (convidado + Google/Apple), save na nuvem, relógio do servidor — escritos e testados sem banco
- [x] Compras Google Play conferidas no servidor, catálogo aprovado
- [x] Arena, ranking, eventos, correio, leilão e Cofre do Mercado — núcleo escrito, desligado
- [x] Chat com frases prontas para todos + painel de moderação (texto livre só após parecer jurídico)
- [ ] Banco remoto e acesso à AWS (seus) → colocar no ar
- [ ] Guildas no servidor (depois do voto na tela 26)

## 7. Organização do time

- [x] Uma aba de navegador por vez; testou, fecha
- [x] Até 2 ajudantes por sessão
- [x] Código no GitHub (game-projetc), um commit por versão
- [x] Toda tela nova é responsiva e no layout novo
