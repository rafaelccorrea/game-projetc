# Recompensas do VIP e do Passe: hoje × proposta (Sistemas, 14/11/2026)

Pedido do dono: "pensar melhor nas recompensas dos VIPs e Passe".

Protótipo para o voto: `docs/proto/v2/VipPasse.html`. São dois aparelhos lado a lado, "Hoje" e "Proposta", com as abas VIP e Passe. O voto fica em `decisoes/tela-vip-passe`.

**14/11: o dono APROVOU D1, D2 e D3, e elas foram APLICADAS** (ver §6). D4 a D8 e o Passe seguem como proposta.

Fontes lidas:
- `js/sys/vip.js` (tabela, conveniências, pontos) e `js/sys/pass.js` (trilhas e missões);
- `js/sys/newdrops.js` (prêmios VIP 7, 8 e 9), `js/sys/mount.js`, `js/sys/pet.js`, `js/sys/appearance.js` (skin do passe) e `js/sys/profile.js` (molduras vip1..vip10);
- `js/sys/bonfire.js` (Brasas nunca à venda);
- `docs/balance.json` → `dificuldade` (paredes e calibração);
- `docs/ECONOMIA_OURO.md` (pouco ouro, X = 5 min de abate);
- `reports/play-console-produtos.md` (preços);
- `docs/LOM_VS_EONBOUND.md` e `docs/IDLE_PARECIDOS.md` (concorrentes).

## 0. Resumo

| | Hoje | Proposta |
| --- | --- | --- |
| VIP 2 a 6 | Só números (+% e conveniência). Nenhum prêmio que se veja no herói | Cada nível ganha algo visível: moldura VIP N, cor do nome, **Rastro da arma** (VIP 2-4) e **Aura VIP** (VIP 5-7), as duas com 3 estágios |
| Poder do VIP | +5% a +10% de ATK e Vida pela tabela, **mais** a Fênix gigante Lendária no VIP 8 (+2 a +7,5% fora da tabela) | Teto de **+10% no total**. A Fênix e a Serpe continuam Lendárias no visual, com o **poder de uma Épica** |
| Ouro do VIP | +10% a +25% no abate, e o offline ×2 também no ouro (VIP 5+) | Ouro +5% a +10% (o XP fica como hoje). O offline ×2 vale para XP, pedras e ração, **não para o ouro** |
| Preço dos níveis | VIP 2 = R$ 300 … VIP 10 = R$ 25.000 (os pontos ainda são "reservado") | VIP 2 = R$ 50 … VIP 10 = R$ 5.000 (proposta: o dono decide) |
| Passe: prêmio-âncora | A skin Anjo no fim do Premium em **toda** temporada. Na 2ª temporada ela já é sua, e o topo fica vazio | Uma **âncora nova por temporada**, à vista no topo: Anjo, depois montaria, depois pet. Na trilha grátis, a **Moldura da Temporada** sobe de estágio a cada temporada completa |
| Passe: miolo | Muitos itens Básicos e Raros que a Fogueira já dá aos montes | **Marcos de evolução**: pedras, ração, essências e fragmentos de montaria. **Brasas só na trilha grátis** |
| Diamantes do Passe | Grátis 75 · Premium 355 | Igual |
| Ouro do Passe | 270 abates (11 min) na temporada, só na trilha grátis | 155 abates (6,5 min), só na trilha grátis |

## 1. Regras fixas (valem para as duas telas)

1. **Pouco ouro.** Nenhum prêmio passa de X = 5 min de abate (120 × `goldUnit`), como manda `docs/ECONOMIA_OURO.md`. O Premium não dá ouro.
2. **Nenhum sorteio pago.** Todo prêmio é fixo e mostrado antes. O Passe Premium e o VIP são compra direta (ECA Digital, art. 20; `docs/RECOMENDACOES.md`).
3. **Brasas nunca à venda** (`js/sys/bonfire.js`). O Premium é pago, então dar Brasa no Premium seria vender Brasa: **proibido**.
   - Brasa só entra na **trilha grátis**, nos níveis 4 a 20. Todo mundo que joga chega lá (o nível 20 sai no dia ~18 sem pagar).
   - O total de Brasas da temporada é o mesmo para quem paga e para quem não paga.
4. **Diamante comprado não muda de conta.** Não há troca, presente nem leilão de diamante, de item pago ou de nível de VIP. O VIP é da conta que pagou.
5. **Nada sensual**, nunca: o jogo tem menores. Skins, auras, molduras e montarias são heroicas ou fantásticas, sem roupa reveladora nem pose.
   - Toda skin nova usa o corpo padrão do garoto ou da menina. O herói não cresce. Skin não tem asa.
6. **O poder pago tem teto.** O VIP inteiro (tabela + prêmios) fica em **+10% de ATK e Vida**, no máximo. O jogador grátis vence toda parede com o tempo (§2.4).
7. **Sempre evolução.** Todo prêmio novo tem estágios: Rastro e Aura com 3, montaria de 1 a 5★, pet com 3 estágios e a moldura da temporada com 4.

## 2. VIP

### 2.1 O que falta hoje

- **VIP 2 a 6 não têm nada que se veja.** O jogador paga e o herói continua igual. O único prêmio visível antes do VIP 7 é a moldura VIP N, que entrou hoje (a782dda).
- **Os níveis do meio são caros demais.** O VIP 2 pede R$ 300 (do R$ 1 ao R$ 300 nada muda). A fusão e o desmonte automáticos do VIP 2 ficam longe de quase todos.
- **A Fênix gigante (VIP 8) é poder fora da tabela.** Ela é uma montaria Lendária (máximo de 12% de ATK e Vida). O grátis anda de montaria Épica (6,5%) até o fim do jogo; a Lendária grátis só chega na era 8 ou na Arena L85+. Diferença:

  | Momento | Fênix − Épica (ATK e Vida) |
  | --- | --- |
  | Nv 1, 1★ | +1,8% |
  | Nv 30, 3★ (com +3%/★ contra +2,5%/★) | +4,4% |
  | Nv 60, 5★ | +7,5% |

  Somado à tabela, o VIP 10 chega a **+17,5%**.
- **A Serpe infernal (VIP 9) é pet Lendário.** O grátis já tem pets Lendários iniciais (Fênix, Submundo, Celestial), então ela quase não muda a FC. Fica igual.
- **Ouro.** O VIP dá +25% de ouro no abate no VIP 10 e dobra o offline no VIP 5+ (com 14 h, o offline vira 3,5× o do grátis). As duas coisas vão contra a regra do pouco ouro.
- **A skin do VIP 10** está na tabela (`skin` = 1), mas não tem skin definida: as adultas (Guerreiro Lendário) saíram.

### 2.2 Tabela por nível: hoje × proposta

ATK/Vida e XP: **iguais** nas duas. Na proposta, cada nível tem pelo menos uma coisa nova que se vê.

| VIP | R$ total: hoje · proposta | Ouro: hoje → proposta | Abre hoje | Abre na proposta (além do que já abre hoje) |
| --- | --- | --- | --- | --- |
| 1 | 1 (1ª compra) · 4,90 (1ª compra) | +10% → +5% | x2 já, +1 entrada por área, coleta automática, mochila +20, offline 10 h, moldura VIP 1 | **Nome em bronze** |
| 2 | 300 · **50** | +12% → +5% | fusão e desmonte automáticos, moldura VIP 2 | **Rastro da arma 1/3** (bronze) |
| 3 | 800 · **150** | +14% → +6% | 10 baús/dia, pular chefe vencido, moldura VIP 3 | **Rastro 2/3** (prata) |
| 4 | 1.500 · **300** | +16% → +6% | Arena +2, Fogueira solta o lote inteiro, moldura VIP 4 | **Rastro 3/3** (ouro) e **nome em prata** |
| 5 | 3.000 · **500** | +18% → +8% | x4 (Nv 40), offline ×2 e 12 h, Torre +1, moldura VIP 5 | **Aura VIP 1/3**; offline ×2 **só em XP, pedras e ração** |
| 6 | 5.000 · **800** | +20% → +8% | mochila +40, Chefe Mundial +1, moldura VIP 6 | **Aura VIP 2/3** |
| 7 | 8.000 · **1.200** | +21% → +9% | 12 baús, XP do Passe +10%, moldura Ouro e VIP 7, skin Demônio/Demônia | **Aura VIP 3/3** e **nome em ouro** |
| 8 | 12.000 · **2.000** | +22% → +9% | Arena +3, evento +1, moldura VIP 8, Fênix gigante | Fênix gigante com **poder de Épica** (visual Lendário); as estrelas sobem jogando |
| 9 | 18.000 · **3.000** | +24% → +10% | XP do Passe +15%, moldura VIP 9, Serpe infernal | Serpe infernal (pet; 3 estágios, evolui jogando) |
| 10 | 25.000 · **5.000** | +25% → +10% | 14 baús, offline 14 h, Torre +2, XP do Passe +20%, moldura VIP 10, aura, skin (indefinida), 500 fragmentos do Prismático | **Coroa no nome**, moldura VIP 10 animada, os 500 fragmentos do Prismático; **sem skin** até a Arte fazer uma no corpo padrão |

Conveniências (`DATA.conv`, aprovadas em 13/11): iguais. O ×2 e o ×4, a coleta e a Fogueira em lote continuam onde estão.

### 2.3 Um item de evolução por faixa

| Faixa | Item | Estágios | Poder | Arte |
| --- | --- | --- | --- | --- |
| VIP 1-4 | **Rastro da arma**: brilho que segue o golpe | 2 bronze · 3 prata · 4 ouro | nenhum | só código (cor e partícula no golpe; como o `MOUNT_AURA`) |
| VIP 5-7 | **Aura VIP**: anel de luz no chão do herói | 5 brilho · 6 brilho + fumaça · 7 brilho + fumaça + partículas | nenhum | só código (mesmos degraus da aura da montaria) |
| VIP 8-9 | **Fênix gigante** (montaria) e **Serpe infernal** (pet), já prontas | Fênix 1-5★; Serpe 3 estágios | o de uma **Épica** (Fênix) e o de um pet Lendário igual aos grátis (Serpe) | pronta (Fênix); Serpe na fila |
| VIP 10 | **Coroa no nome**, moldura VIP 10 animada e 500 fragmentos do Prismático | o Prismático evolui como pet | o pet Prismático também tem fonte grátis | moldura animada em código |

Nome colorido, Rastro e Aura são **só visual**: não entram na FC e aparecem no herói, no Perfil, no ranking e na Dupla. É o "motivo visível" de cada nível, sem tocar na parede.

### 2.4 Poder do VIP contra a calibração das paredes

Base (`docs/balance.json` → `dificuldade`):
- O Senhor da Era pede `bossRatio` × a FC com que o grátis chega nele. O grátis chega com **87%** da FC pedida (eras 2-8), 90% (era 1) e 94% (era 0).
- Calibração na batalha real (12 lutas por caso): com **100%** da FC pedida vence em média ~90% das vezes (10,8 de 12). Com **90%**, ~54% (6,4 de 12). Com 87%, ~1 em 4.
- Conta: chegada = 87% × (1 + % de ATK e Vida do VIP). A chance sai interpolada entre esses pontos e é uma estimativa.
- É um **teto**: o `atkPct` do VIP soma com os outros % (título, prática, montaria) antes de multiplicar, então o efeito real é um pouco menor.
- **Atenção:** o Senhor pede a maior FC entre a do grátis e a que o VIP 5 e o VIP 10 terão 12 h depois de chegar (`vipMinWallDays` 0,5). Se o VIP ficar forte demais, **a parede sobe para todo mundo**, inclusive para o grátis.

| VIP | Hoje: ATK/Vida (com a Fênix no Nv 30, 3★) | Hoje: chega com · vence | Proposta: ATK/Vida | Proposta: chega com · vence |
| --- | --- | --- | --- | --- |
| 0 (grátis) | 0 | 87,0% · ~25% | 0 | 87,0% · ~25% |
| 1-2 | +5% | 91,4% · ~59% | +5% | igual |
| 3-4 | +6% | 92,2% · ~62% | +6% | igual |
| 5-6 | +8% | 94,0% · ~68% | +8% | igual |
| 7 | +9% | 94,8% · ~71% | +9% | igual |
| 8 | +9% + 4,4% = **+13,4%** | 98,7% · ~85% | +9% | 94,8% · ~71% |
| 9-10 | +10% + 4,4% = **+14,4%** | 99,5% · ~88% | +10% | **95,7% · ~75%** |
| 10, Fênix Nv 60 5★ | **+17,5%** | **102,2% · ~92%** (acima da linha dos 100%) | +10% | 95,7% · ~75% |

Leitura:
- **Hoje**, o VIP 8+ passa da linha dos 100% quando a Fênix está alta e praticamente não sente a parede.
- **Na proposta**, nenhum VIP chega aos 100% nas eras 2-8. O VIP 10 vence ~3 em 4 tentativas na chegada, e o grátis vence ~1 em 4.
- **O grátis sempre passa**: a FC dele cresce até os 100% em 0,3 a 12 dias de parede (`sim180.freeWallDays`), como hoje. A parede não fica mais alta por causa do VIP.
- Eras 0 e 1: o primeiro Senhor é suave de propósito (`bossRatio` 1,06 e 1,10). O VIP 5+ passa de cara na era 0 (101,5%) e o VIP 10 chega a 99% na era 1. Fica igual nas duas colunas.
- Fora do VIP, com o mesmo efeito: o **Mecha de guerra** (R$ 49,90) também é montaria Lendária e dá os mesmos +1,8 a +7,5%. Ver a decisão D3.

### 2.5 Preço por degrau (R$ 1 = 1 ponto VIP; `reports/play-console-produtos.md`)

| Degrau | Hoje: R$ a mais (total) | Proposta: R$ a mais (total) | O que o degrau traz de visível (proposta) |
| --- | --- | --- | --- |
| 0 → 1 | 1 ponto (1); na prática, a menor compra (R$ 4,90) | 4,90 (4,90) | moldura VIP 1, nome em bronze, x2 |
| 1 → 2 | 299 (300) | 45,10 (50) | Rastro 1/3, moldura VIP 2 |
| 2 → 3 | 500 (800) | 100 (150) | Rastro 2/3, moldura VIP 3 |
| 3 → 4 | 700 (1.500) | 150 (300) | Rastro 3/3, nome em prata, moldura VIP 4 |
| 4 → 5 | 1.500 (3.000) | 200 (500) | Aura 1/3, x4, moldura VIP 5 |
| 5 → 6 | 2.000 (5.000) | 300 (800) | Aura 2/3, moldura VIP 6 |
| 6 → 7 | 3.000 (8.000) | 400 (1.200) | Aura 3/3, skin Demônio, nome em ouro |
| 7 → 8 | 4.000 (12.000) | 800 (2.000) | Fênix gigante |
| 8 → 9 | 6.000 (18.000) | 1.000 (3.000) | Serpe infernal |
| 9 → 10 | 7.000 (25.000) | 2.000 (5.000) | coroa no nome, moldura VIP 10 animada, Prismático |

Referência: um Passe Premium (R$ 24,90) dá 25 pontos, e o Cartão Mensal (R$ 19,90) dá 20. Na proposta, quem compra só o Passe todo mês chega ao VIP 2 no 3º mês. Hoje, só no 13º.

## 3. Passe (30 níveis por temporada de 30 dias; Premium R$ 24,90)

### 3.1 O que falta hoje

- **O topo é sempre a mesma coisa.** A skin Anjo (`appearance.DATA.passSkin`) sai no nível 30 premium de toda temporada. Da 2ª temporada em diante não há nada novo no topo.
- **A trilha grátis não tem âncora**: termina numa Arma Épica igual às do chão.
- **Muitos itens Básicos e Raros** (9 na grátis, 10 Raros/Épicos na premium). A Fogueira já solta dezenas por dia, então eles viram desmonte.
- **Não há marcos de evolução**: o Premium dá uma vez pedras, essências e fragmentos (só no nível 25) e nenhuma ração.

### 3.2 Âncora por temporada (à vista no topo da tela do Passe)

| Temporada | Âncora do Premium (nível 30) | Âncora grátis (nível 30) | Evolução |
| --- | --- | --- | --- |
| 1 | Skin Anjo (Kael e Kaia; já aprovada) + Arma da Temporada Lendária | Arma Épica + **Moldura da Temporada** | moldura: 1 temporada = bronze · 3 = prata · 6 = ouro · 12 = lendária |
| 2 | **Montaria da temporada** (a Arte escolhe uma das 10 novas que já estiver 100%), inteira, 1★ | igual (a moldura sobe de estágio) | as estrelas sobem com os fragmentos dos níveis 10, 20 e 25 da temporada seguinte e jogando |
| 3 | **Pet da temporada**, 1º estágio | igual | 3 estágios, com ração |
| 4 em diante | o rodízio volta (skin nova no corpo padrão, depois montaria, depois pet) | igual | — |

- Montaria e pet da âncora têm **poder de Épico** (a regra do §1.6). O que conta é o visual, a evolução e "ter da temporada".
- Âncora de temporada passada **não volta à venda** e **nunca entra em sorteio**. Pode voltar só como prêmio de evento grátis, a decidir (D6).

### 3.3 As trilhas, nível a nível

Grátis (`free`):

| Nv | Hoje | Proposta |
| --- | --- | --- |
| 1 | ouro 10 | ouro 10 |
| 2 | 5 💎 | 5 💎 |
| 3 | arma Básica | arma Básica |
| 4 | ouro 15 | **10 Brasas** |
| 5 | 10 💎 | 10 💎 |
| 6 | colete Básico | **30 de ração** |
| 7 | ouro 20 | ouro 20 |
| 8 | 5 💎 | 5 💎 |
| 9 | elmo Básico | **5 pedras** |
| 10 | 10 💎 | 10 💎 + **15 Brasas** (marco) |
| 11 | ouro 25 | **15 Brasas** |
| 12 | luvas Básicas | **40 de ração** |
| 13 | ouro 25 | ouro 25 |
| 14 | 5 💎 | 5 💎 |
| 15 | botas Básicas | botas Básicas |
| 16 | ouro 30 | **20 Brasas** |
| 17 | 5 💎 | 5 💎 |
| 18 | colar Básico | **8 pedras** |
| 19 | ouro 30 | ouro 30 |
| 20 | 10 💎 | 10 💎 + **20 Brasas** (marco) |
| 21 | arma Básica | **50 de ração** |
| 22 | ouro 35 | **8 pedras** |
| 23 | 5 💎 | 5 💎 |
| 24 | colete Básico | ouro 30 |
| 25 | 10 💎 | 10 💎 |
| 26 | ouro 40 | **50 de ração** |
| 27 | elmo Básico | **10 pedras** |
| 28 | ouro 40 | ouro 40 |
| 29 | 10 💎 | 10 💎 |
| 30 | arma Épica | arma Épica + **Moldura da Temporada** (âncora) |

Premium (`premium`). Os diamantes ficam iguais, nos mesmos níveis:

| Nv | Hoje | Proposta |
| --- | --- | --- |
| 1 | arma Rara | arma Rara |
| 3 | colete Raro | **15 pedras** |
| 5 | elmo Raro | elmo Raro |
| 7 | luvas Raras | **60 de ração** |
| 9 | botas Raras | **2 essências** |
| 10 | 20 💎 | 20 💎 + **10 fragmentos de montaria** (marco) |
| 11 | colar Épico | colar Épico |
| 13 | arma Épica | arma Épica |
| 15 | colete Épico | **20 pedras + 3 essências** |
| 17 | asa Épica | asa Épica |
| 19 | elmo Épico | **80 de ração** |
| 20 | 25 💎 | 25 💎 + **10 fragmentos de montaria** (marco) |
| 21 | luvas Épicas | **25 pedras** |
| 23 | botas Épicas | **100 de ração** |
| 25 | arma Épica + 30 pedras + 5 essências + 10 fragmentos | igual |
| 27 | Colete da Temporada (Lendário, evolui) | igual |
| 30 | Arma da Temporada (Lendária, evolui) + skin Anjo | Arma da Temporada + **âncora da temporada** (§3.2) |
| pares e 29 | 15 a 40 💎 | iguais |

### 3.4 Totais por temporada

| | Grátis hoje | Grátis proposta | Premium hoje | Premium proposta |
| --- | --- | --- | --- | --- |
| Diamantes | 75 | 75 | 355 | 355 |
| Ouro (abates) | 270 (11 min) | 155 (6,5 min) | 0 | 0 |
| Brasas | 0 | **80** (níveis 4-20) | 0 | **0 (proibido)** |
| Pedras de forja | 0 | 31 | 30 | 90 |
| Ração | 0 | 170 | 0 | 240 |
| Essências | 0 | 0 | 5 | 10 |
| Fragmentos de montaria | 0 | 0 | 10 (+1★ parcial) | 30 (= +2★ numa montaria 1★) |
| Itens | 9 Básicos + 1 Épico | 2 Básicos + 1 Épico | 15 (Raro a Lendário) | 8 (Raro a Lendário) |
| Âncora | nenhuma | Moldura da Temporada (4 estágios) | skin Anjo (só na 1ª vez) | âncora nova a cada temporada |

- Ouro: o maior resgate é 40 abates (1,7 min), abaixo de X = 120. A soma por dia é 0,2 min, desprezível na meta de 65.
- Brasas: 80 por temporada. As missões diárias dão 20 por dia (600 por mês), então o passe soma ~13%. O teto do estoque (300) não muda.
- Ração e pedras dão evolução de pet e de Forja, as mesmas das fontes normais. Não pulam parede: o pet é no máximo 20% da FC (`Sys.fc` maxPetShare).

### 3.5 Valor por real (Premium R$ 24,90)

- Só os diamantes já devolvem o preço: 355 💎 ≈ o pacote de 350 💎 (R$ 24,90).
- O resto é bônus, sem sorteio: 6 itens, 90 pedras, 240 de ração, 10 essências, 30 fragmentos e a âncora. Dá **R$ 0,83 por nível**.
- Soma **+25% de XP do passe** e **25 pontos VIP**.
- O Premium **não** dá ouro nem Brasa.

## 4. Decisões para o dono

- **D1 (APROVADA e aplicada em 14/11). Teto do poder do VIP em +10% no total.** A Fênix (VIP 8) e a Serpe (VIP 9) ficam com o visual Lendário e o poder de uma Épica. Recomendo **sim**: sem isso, o VIP 10 passa da linha dos 100% e, pela regra do `vipMinWallDays`, a parede sobe para todo mundo.
- **D2 (APROVADA e aplicada em 14/11). Ouro do VIP: +5% a +10%** (hoje +10% a +25%), e o offline ×2 deixa de valer para o ouro. O XP fica como está. Recomendo **sim** (regra do pouco ouro).
- **D3 (APROVADA a opção (a) e aplicada em 14/11). Mecha de guerra (R$ 49,90)**: mesmo caso da Fênix, uma montaria Lendária comprada. Opções:
  - (a) poder de Épica, como na D1;
  - (b) fica como está.

  Recomendo (a).
- **D4. Preço dos níveis**: proposta de R$ 50 a R$ 5.000 no lugar de R$ 300 a R$ 25.000. Hoje os pontos são "reservado". Com a proposta, os níveis do meio, que agora têm algo visível, ficam ao alcance de quem compra o Passe e um pacote. É decisão de negócio: as duas tabelas estão no protótipo.
- **D5. Rastro da arma (VIP 1-4) e Aura VIP (VIP 5-7)**, só visuais e feitos em código, sem PNG novo. Também nome colorido e coroa no VIP 10. Nenhum entra na FC.
- **D6. Âncora rotativa do Passe**: Anjo, depois montaria, depois pet. Âncora de temporada passada nunca volta à venda. Pode voltar como prêmio de evento grátis?
- **D7. Brasas só na trilha grátis** (80 por temporada, níveis 4-20) e nenhuma no Premium. Isto é regra, não opção: confirmar.
- **D8. Skin do VIP 10**: tirar da tabela até a Arte fazer uma no corpo padrão (a "Guerreira/Guerreiro Lendário" era adulta e saiu).

## 5. Depois do voto (quem faz)

- **Sistemas:**
  - `js/sys/vip.js`: `gold` separado do `xp`; marcas visuais por nível (`trail`, `aura` em 3 estágios, `nameColor`); pontos se a D4 passar; teto de poder dos prêmios.
  - `js/sys/mount.js` e `js/sys/pet.js`: poder de Épica para `phoenixm` e `mecha`, por um campo `powerR`.
  - `js/sys/pass.js`: as trilhas novas; `brasas` só em `free` (com teste que falha se aparecer em `premium`); a âncora por temporada (`seasonAnchor[n]`); moldura da temporada no `Sys.profile`.
  - Testes em `test/sys`.
- **Engenheiro:** desenhar Rastro, Aura VIP e nome colorido em código (como `MOUNT_AURA` em `js/mountfx.js`) e o topo do Passe com a âncora.
- **Arte:** nenhum PNG novo para o VIP. Para o Passe, só a âncora da temporada 2 em diante, escolhida entre a arte já pronta (regra "completar antes de criar").
- **Servidor:** o catálogo de produtos não muda. Se a D4 passar, mudam só os pontos por nível do VIP (lidos do cliente). O Passe continua um produto por temporada.

## 6. Aplicado em 14/11 (D1, D2 e D3)

Teste: `node test/sys/economia-ouro.test.js`; toda a `test/sys` passa.

- **D1** (`js/sys/mount.js`): campo novo `pr` = raridade do PODER. A Fênix gigante (`phoenixm`, VIP 8) tem `r:4, pr:2`: visual Lendário (nome, cor, aura, `rarity` 4) e poder de Épica. O % de ATK e Vida, a estrela plana, o golpe reforçado e o custo do nível seguem `pr`. `info()` devolve `powerRarity`/`powerRarityName`; `catalog()` devolve `pr`/`powerRarName`; `maxPct` é o do poder; `Sys.mount.powerRarity(id)`.
  - Resultado: a montaria exclusiva soma 0% sobre a Épica do grátis. O VIP fica na tabela (+5% a +10% de ATK e Vida). Pior caso do VIP 10: **+10%** (era +17,5% com a Fênix Nv 60 5★; +18,5% com 7★ e estrela plana).
  - A **Serpe infernal** (pet, VIP 9) fica como está: pet Lendário igual aos Lendários iniciais do grátis (§2.1). A **Serpe dourada** (montaria Lendária, Arena L85+ e era 8) é fonte grátis e **não mudou**.
- **D2** (`js/sys/vip.js`): `table.goldOnly` = 0, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10 vira o `perks().goldPct`. O XP fica no `table.gold` (e no `xp9`). `levelInfo` traz `goldPct` e `xpPct` separados; `goldXpPct` passa a ser só o ouro. `perks().offlineGoldMult` = 1: o ×2 do VIP 5+ vale só para XP, itens, pedras e ração. O ouro offline é do Engenheiro (`js/meta.js`).
- **D3** (`js/sys/mount.js`): Mecha de guerra `r:4, pr:2`, como a Fênix.
- Moldura **Ouro**: saiu do VIP 7 e virou conquista do nível 60 (`js/sys/profile.js`, `need:{level:60}`). `table.frame` do VIP zerado; o VIP N segue com a moldura VIP N.
- **Achado, para o dono decidir:** a skin **Demônio/Demônia do VIP 7** é Lendária e dá **+10% de ATK e Vida** equipada (+0,5% na coleção, `Sys.skin`). Com ela, o VIP 7+ passa do teto: 9% da tabela + 10% = +19%. O grátis não tem skin fixa Lendária. Nada mudou aqui. Opções: (a) a skin do VIP só visual (poder 0); (b) poder de Básica (+2%) e a tabela do VIP 7-10 baixa 2 pontos; (c) fica como está, fora do teto.
