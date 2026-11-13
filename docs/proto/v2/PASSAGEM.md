# Passagem dos protótipos V2 para o jogo (para o Engenheiro)

Autora: Sistemas (fps-69), 13/11. Protótipos em `docs/proto/v2/<Tela>.html` (imagens em `docs/proto/v2/a/`, fora do git). Link único do dono: https://claude.ai/artifact/Dje98dqTa6vConwpewnGds (votos em `decisoes/tela-*`).

**Só implementar a tela que o dono APROVAR.** As chaves de sistema citadas abaixo estão **desligadas**. Ligar uma chave muda o equilíbrio, então combine comigo antes.

## 0. Antes de tudo: o PALCO compartilhado

Todas as 10 telas usam o mesmo palco: o herói sempre à vista no topo, com a arma equipada NA MÃO, a asa nas costas, a montaria quando montado, o pet sempre NA FRENTE e a aura.
- **O que fazer:** um componente único, por exemplo `js/stage.js` → `Stage.mount(canvas, look, opts)`, reaproveitado por todas as telas, em vez de 10 cópias.
- **Arma na mão:** os protótipos copiaram a receita do próprio jogo (`js/stage.js` drawHeroAnim / drawHeroPistol, grip por quadro do `.json` do corpo e `assets/weapons/meta.json`). Dá para reaproveitar direto.
- **Pet na frente:** desenhar o pet DEPOIS do herói e da montaria. É regra do dono.
- **Prévia no herói:** tocar num item que o jogador não tem mostra a peça NO herói, com a faixa "Prévia: X · Sair". Não abre janela por cima.
- **Defeitos que achamos nos protótipos:**
  - No artefato publicado, `new Image()` não carregava no canvas; foi trocado por `<img>` reais. No jogo isso não deve acontecer, mas fica o registro.
  - O 1º quadro da animação pode chegar com tempo negativo. Use `Math.max(0, t)` e índice de quadro sempre positivo.
- **Regras de todas as telas:** sem emoji, sem rolagem lateral (testar em 320 e 390 px), sem diálogo do navegador e nada de sorteio pago.

## Ordem para implementar

1. Batalha (HUD + dificuldade)
2. Equipamento + Mochila
3. Forja
4. Pets
5. Montarias
6. Invocar
7. Loja
8. VIP
9. Passe
10. Fim das 9 eras

O motivo da ordem: a Batalha é onde o jogador passa o tempo e é ela que mostra a dificuldade nova. Equipamento, Forja, Pets e Montarias são os caminhos para vencer a parede ("Faltam X de FC → Ir"), então precisam existir antes de a dificuldade ligar. Loja, VIP e Passe não mudam regras. O Fim das 9 eras só aparece no dia ~118-178.

---

## 1. Batalha — `docs/proto/v2/Batalha.html`

**O que muda em relação a hoje (`js/fullbattle.js`, `js/battle.js`):**
- **Chip "FC × FC pedida"** no topo, verde, amarelo ou vermelho.
- **Barra do chefe** com o tipo (Chefe / Chefe do meio / Senhor da Era) e o relógio "Fúria em 0:xx". Aos 40 s fica vermelha, com "FÚRIA · dano ×4", vinheta vermelha e tremor.
- **"Desafiar o chefe"** brilha com 90% da FC pedida (hoje já brilha com 90% do REC_FC).
- **Ao perder ou com o Desafiar abaixo da FC pedida:** painel "Faltam X de FC" com 3 ações, o ganho de cada uma e o botão Ir. Usa o **`Sys.advice`** do Servidor (`js/sys/advice.js`), chamado com `{need: FC pedida da fase}`. Nunca mostra "comprar" nem "invocar".

**Regras novas que a tela pressupõe:** o bloco `dificuldade` do `docs/balance.json`, desligado.
- `recFc`: 90 valores na escala do jogo.
- `boss.fromRecOnly`: o chefe sai só da FC pedida, calculado com o **jogador grátis TÍPICO** da fase (`Sys.stats.refFromFc`, que eu entrego depois da v0.13.1).
- `waveIncludesEscorts`: a onda inteira é calibrada para 32 s / 40 s.
- Fúria ×4 aos 40 s.
- `commons`: 10% da vida e 5% do dano do chefe.
- Chaves no `js/sys`: `Sys.level.setKillCap`, `Sys.mount.setStarFlat` e `Sys.pet.setStageMult`.
- Ordem combinada com o PO:
  1. `refFromFc`;
  2. você mede (100% tem de vencer o Senhor da Era);
  3. eu ligo.

**Arte que falta:** folhas de "morte" e "ferido" dos inimigos copiadas no protótipo (no jogo elas existem). Ícones dos golpes das armas das eras 7-8 (`assets/icons/era7_s1..3`, `era8_s1..3`, que estão no ERA9_MISSING).

## 2. Equipamento + Mochila — `docs/proto/v2/Equipamento.html`

**O que muda (hoje `js/screens.js` scrGear e `js/p_bag.js`):**
- O herói fica no topo com os **7 espaços em volta** (arma, colete, chapéu, luvas, botas, colar, asa), cada um com moldura de raridade, +N da Forja e seta verde quando a mochila tem algo melhor.
- **Tocar numa peça que o jogador tem troca na hora** (sem botão Equipar), com "FC antes → depois" e ATQ/VIDA/DEF/CRÍT em verde ou vermelho, mais o botão Voltar.
- Peça com cadeado (acima do nível): só a prévia da FC, e o botão Equipar diz "Nível N".
- "Melhor equipamento" (a troca automática, que vale para todos), Forjar e Desmontar, este com confirmação dentro do jogo.
- Mochila com as 8 abas do `p_bag.js`, filtro, ordenação por FC / raridade / nível e contador N/80.

**Funções:** `Sys.stats.weaponType` / `ensureWeaponType` (a arma na mão é a da família certa), `Sys.fc.compute` com `{extra}` para a prévia, e `Sys.loot` para desmontar.

**Regras novas:** nenhuma. O protótipo usa um modelo de FC; no jogo, use o `Sys.fc` de verdade.

**Arte que falta:** nenhuma para as eras 0-6. Itens das eras 7-8 (ícones e armas na mão) só quando a Arte entregar.

## 3. Forja — `docs/proto/v2/Forja.html`

**O que muda (hoje `js/p_forge.js` e `js/p_fuse.js`):**
- **A aura da arma no herói** cresce com o +N da arma: azul no +4, roxa no +7, chamas no +10 e dourada com raios no +13.
- Faixa de detalhe com a chance mostrada como "50% + 10% de garantia" e uma barra de garantia.
- "Forjar até conseguir", que para no acerto ou quando acabam as pedras ou o ouro.
- Animação de acerto (faíscas, "Nova aura" ao cruzar a faixa) e de falha ("Falhou, +5% na próxima").
- Abas **Transformar** (`Sys.loot.transformCost`, `Sys.stats.transform`) e **Fundir** (`Sys.stats.canFuse`).

**Regras novas:**
- **Forja +16 a +20 (pacote das últimas eras)**, em `docs/balance.json` `dificuldade.pacoteFim.forge`. Eu ligo em `js/sys/forge.js` com `setLateGame(true)` depois da v0.13.1: teto 18 na era 7 e 20 na era 8.
- **A fusão está DESLIGADA no código** (`Sys.stats.DATA.quality.on=false`). Se o dono aprovar a aba Fundir, ela precisa ser ligada, e isso tem de ser combinado comigo porque mexe no poder.

**Arte que falta:** as auras são desenhadas por código no protótipo. Se preferirem folhas, existem `assets/anim/aura/aura4/7/10/13` (~2 MB cada).

## 4. Pets — `docs/proto/v2/Pets.html`

**O que muda (hoje `js/p_pets.js`, tela 17b):**
- O pet ativo aparece NA FRENTE do herói, no estágio real (Filhote / Médio / Evoluído).
- Tocar num pet seu troca o ativo na hora, com "FC antes → depois" e Desfazer. Pet que o jogador não tem vira prévia no herói, com a fonte e o botão Ir.
- "Evoluir" mostra o **+FC em verde** e troca o estágio no herói com anel, coluna de luz e clarão.

**Regras novas:**
- **Evoluir dá FC na hora**: `Sys.pet.setStageMult(true)` (parte do pet ×0,8 / ×0,9 / ×1). Sem a chave, evoluir só libera níveis e o ganho é 0. A chave liga junto com a dificuldade.
- **Pet até o Nv 120** (pacote das últimas eras), ligado com o `setLateGame`.

**Arte que falta:** os 6 pets novos ainda desligados (`Sys.pet.DATA.newReady`). Folhas montadas dos pets que ainda não as têm.

## 5. Montarias — `docs/proto/v2/Montarias.html`

**O que muda (hoje `js/p_mounts.js`):**
- O herói aparece MONTADO na montaria escolhida, com seletor Montado / A pé.
- **Aura da montaria por estrela no palco**, crescendo a cada estrela.
- "Subir nível" com o custo real em ouro e o +FC. "Subir estrela" com o +FC.
- Montaria que o jogador não tem vira prévia, com a fonte e a barra de fragmentos.

**Regras novas:**
- **Botão "Subir estrela" MANUAL.** Hoje a estrela sobe sozinha ao juntar fragmentos (`Sys.mount.addFragments` → starUp). Se o dono aprovar o botão, eu separo "juntar" de "subir" no `js/sys/mount.js`.
- **6ª e 7ª estrela** (o dono aprovou): a 6ª na era 7 e a 7ª na era 8, com fragmentos 50 e 60 ganhos jogando. Eu ligo no `js/sys/mount.js` com o `setLateGame`.
- **+2 a +3% por estrela**: `Sys.mount.setStarFlat(true)`, que liga junto com a dificuldade.
- **Cores da aura de 6★ e 7★: com você.** No `MOUNT_AURA` do `js/mountfx.js`, por exemplo `'rgba(255,120,70,'` (brasas) e `'rgba(255,246,200,'` (celestial).

**Arte que falta:**
- **Kaia montada** só no pônei e no cavalo; nas outras montarias ela aparece a pé.
- As 10 montarias novas estão desligadas, sem folha montada.
- A Fênix gigante tem folha, mas não está no `MOUNT_TBL`.

## 6. Invocar — `docs/proto/v2/Invocar.html`

**O que muda (hoje `js/screens.js` scrSummon):**
- O herói fica no topo. As cartas saem do anel do chão e viram, com brilho que cresce com a raridade; Mítico e Lendário ganham raios, clarão e faixa.
- O x10 aparece numa grade 5×2 que cabe em 390 px.
- **Tocar numa carta põe a peça no herói** (arma na mão), com "FC antes → depois", Sair e Equipar.
- Depois do x10: "Equipar os melhores" e "Desmontar o resto".
- O painel de chances com os cadeados de nível e o contador de garantia continuam como hoje (`Sys.loot.summonOdds` e `DATA.summon.pity`).

**Regras:** nenhuma nova. A invocação **só gasta OURO ganho jogando** (mais 1 grátis por dia); as gemas aparecem só como saldo no topo e não podem ser usadas aqui. Não pode haver caminho gema → invocação nem dinheiro → invocação, porque isso seria sorteio pago.

**Arte que falta:** a pose de pistola da era 4 continua atrás de `ART_ON.pistol_era4`, e o protótipo mostra a pistola.

## 7. Loja — `docs/proto/v2/Loja.html`

**O que muda (hoje `js/screens.js` scrShop, `js/p_offer.js`, `js/p_shopmecha.js`):**
- 7 abas em grade de 2 linhas: Ofertas, Diamantes, Visual, Montarias, VIP, Passe e Ouro.
- **Prévia no herói** de skin, Mecha e asa.
- Folha de compra dentro do jogo, que chama o Google Play de verdade (`js/sys/buy.js`).
- Barra de VIP no topo.

**Regras:** nenhuma nova. Os preços são os de `js/sys/buy.js` (iguais aos da Play Console).
- **Pets e asas não são vendidos em lugar nenhum.** A aba Montarias mostra os dois como "não se vendem", com a fonte de cada um. O dono decide se é assim.
- **Não há oferta paga diária nem semanal.**

**Arte que falta:** o **Mecha não tem arte montada**; a prévia o mostra atrás do herói.

## 8. VIP — `docs/proto/v2/VIP.html`

**O que muda (hoje `js/p_vip.js`):**
- Cartão "R$ X de R$ Y para o VIP N+1".
- Seletor de nível 0-10 em chips que quebram de linha, sem rolagem lateral, com o que cada nível abre (tabela de conveniência aprovada, `Sys.vip.conv`) e a tabela acumulada.
- **Prêmios com prévia no herói:** VIP 7 skin Demônio, VIP 8 Fênix gigante (montado), VIP 9 Serpe infernal (pet) e VIP 10 aura.
- Uma ação só: "Ir para a Loja".

**Regras:** nenhuma nova (`js/sys/vip.js` e `Sys.newDrops` `vip:level`).
- O VIP 10 lista uma skin, mas a única que serviria (Guerreiro Lendário) saiu junto com as skins adultas. A tela mostra só a aura e os fragmentos do Prismático, e o Prismático depende da Revisão 4 do pet, que está desligada.

**Arte que falta:** **Kaia montada na Fênix**; folha animada da Serpe infernal (hoje é imagem parada).

## 9. Passe — `docs/proto/v2/Passe.html`

**O que muda (hoje `js/screens2.js` scrPass e `js/p_pass.js`):**
- **Trilha VERTICAL** (uma linha por nível, grátis à esquerda e premium à direita), sem carrossel lateral.
- Botões Resgatar / Resgatado / Guardada / Nível N, e cadeado no premium.
- **Prévia no herói** dos prêmios: skin Anjo, asa de anjo, Lobo de guerra montado, falcão e armas.
- Aba Missões com progresso e Ir.
- Compra do Premium pela folha da Loja.

**Regras:** nenhuma nova. São os 30 níveis do `js/sys/pass.js`.

**Arte que falta:** nenhuma para o conteúdo atual.

## 10. Fim das 9 eras — `docs/proto/v2/FimDasEras.html`

**O que muda:** é tela NOVA. Ela entra no fluxo de vitória do Senhor da Era (`js/battle.js` B.eraPend → Vitória → Troca de era) **só na fase 90** (Juiz Celestial, era 8), no lugar da Troca de era. Tem 5 passos e o botão Pular:
1. o chefe se desfaz em luz;
2. "AS 9 ERAS CONCLUÍDAS", com as 9 eras acendendo;
3. o resumo da jornada;
4. os prêmios;
5. "A jornada continua", e o botão Continuar leva à fase 91.

**Regras novas:**
- **Prêmios PROPOSTOS** em `docs/balance.json` `fimDasEras`, **desligado até o dono aprovar**: título "Lenda das 9 Eras" (+3% ATQ e VIDA), moldura e aura só visuais, e 300 gemas uma vez.
- Se aprovado, eu ligo o título e a entrega pelo correio. A moldura e a aura na tela são com você.
- Fases sem fim depois da 90: FC pedida da fase 90 × 1,03 por fase.

**Arte que falta:** armas das eras 7-8 na arte montada (hoje vem desenhada a espada medieval). Emblemas das 9 eras, se a Arte quiser trocar os desenhados por código.

---

## Resumo das chaves de sistema (todas DESLIGADAS; quem liga é a Sistemas, combinando com o PO)

| Chave | Onde | Para quê | Liga quando |
|---|---|---|---|
| `dificuldade` (recFc, chefe, comuns, fúria) | `docs/balance.json` + jogo | paredes | depois da v0.13.1 + `refFromFc` + a sua medida |
| `Sys.level.setKillCap(true)` | `js/sys/level.js` | teto diário de XP de abate | junto com a dificuldade |
| `Sys.mount.setStarFlat(true)` | `js/sys/mount.js` | +2 a +3% por estrela | junto com a dificuldade |
| `Sys.pet.setStageMult(true)` | `js/sys/pet.js` | evoluir dá FC | junto com a dificuldade |
| `Sys.level.setCap120(true)` | `js/sys/level.js` | nível 120 | já ligado por você no era9Boot |
| `setLateGame(true)` (Forja +20, Divino Nv 95, 8 títulos, montaria 7★, pet Nv 120, treino de era) | `js/sys/*` | fim das 9 eras | depois da v0.13.1 e da medida |
| `fimDasEras.on` | `docs/balance.json` | prêmios das 9 eras | se o dono aprovar |
| Subir estrela manual | `js/sys/mount.js` | botão da tela Montarias | se o dono aprovar a tela |
| Fusão (`quality.on`) | `js/sys/stats.js` | aba Fundir da Forja | se o dono aprovar |
