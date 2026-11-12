# API dos módulos da fps-e2 — REFERÊNCIA ÚNICA para o engenheiro (fps-c9)
Atualizado em 2026-11-12, build v0.7. Se algo aqui contradiz outro relatório, vale ESTE arquivo.
Módulos: `fc, stats, skin, vip, level, practice, titles, tower, forge, pet, arena, appearance` em `js/sys/` (+ os da fps-30: `loot, chest, instances`). CSS: `js/sys/sys.css`.
Números: **v7.1 APROVADA pelo PO para o jogo** (atributos, FC, skin, VIP, torre, golem → 7 fragmentos de fênix) e v6 (nível, práticas, forja). Antes de ir para o jogo, a fps-c9 ainda recalibra com o ritmo real de abates.
Testes: `node test/sys/e2.test.js` (14 ok) + os da fps-30 (`integration.test.js` usa os módulos reais). O engenheiro não edita `js/sys/`.

## 1. Carga
1. Carregar todos os `js/sys/*.js` depois do estado `S` (qualquer ordem; tudo registra em `window.Sys.<nome>` e guarda estado só em `S.sys.<nome>`).
2. **Uma vez, na carga do save, antes de qualquer cálculo:** `Sys.stats.migrateSave(S)`. Item antigo ganha `lvl` (mín. 1), os secundários
   (Raro+, semente pelo id) e o `gold` investido ESTIMADO pela tabela que o jogador de fato pagou (o `upCost` antigo do index.html). Ninguém perde ouro.

## 2. Sys.host (o engenheiro cria)
| Função | Obrigatória? | Usada por |
|---|---|---|
| `equipped()` → `{weapon, armor, hat, gloves, boots, necklace, wing}` (itens equipados; espaço vazio = ausente) | sim | stats/fc |
| `stage()`, `eraMax()`, `goldUnit()` (ouro por abate na fase atual) | sim | todos |
| `addGold(n)`, `addGems(n)`, `now()` (ms), `rng()` (0..1), `toast(msg)` | sim | todos |
| `canSpendGold(n)`/`spendGold(n)` → bool · `canSpendGems(n)`/`spendGems(n)` → bool | sim (melhoria e forja) | stats, forge |
| `level()` → nível do jogador. **Faça `() => Sys.level.level(S)`** (um nível só para todos) | sim | loot (fps-30), stats |
| `onChange()` (salvar + redesenhar o HUD depois de uma ação de tela) · `goTab(tab)` | recomendadas | renders, fc |
| `owned(tipo)` → ids (`mounts`, `hair`, `eyes`, `hats`) · `catalog(tipo)` → número · `skinR(id)` → raridade | opcionais | títulos, skin |
Sem `equipped()`, os módulos caem no modo antigo (`host.atk()/hp()`), que existe só para os testes antigos. **No jogo, use `equipped()`.**

## 3. Atributos, golpe e FC (substitui o heroStats())
- `st = Sys.fc.stats(S, host)` → `atk, hp, def` (planos) · `critRate, critDmg, aspd` (%) · `goldMult` · `pet:{atk, heal}` · `crit` (= critRate).
  Já inclui TUDO: os 7 itens (com o nível do item e o **fortalecimento do espaço**), o nível do jogador e os % de práticas, títulos, skin,
  coleção, VIP, pet e torre. **Não aplique o fortalecimento nem o nível em outro lugar**, senão conta duas vezes.
- Golpe do herói: `Sys.stats.hit(st, multDaHabilidade, defDoAlvo)` → `{dmg, crit}` = ATK × mult × (1 + critDmg se critar) × (1 − DEF/(DEF + 2·ATK)), teto 75% (v7.1: defK 2; DEF-base do colete 8).
  Tetos v7.1: velocidade de ataque +100%, dano crítico 400%, chance de crítico 75%.
  O inimigo usa a mesma fórmula com o `st.def` do herói. Intervalo do s1: `Sys.stats.interval(st)` = 0,8 s / (1 + aspd).
- **FC única** (`Sys.fc.compute(S, host)`; a mesma na torre e no ranking): ATK×5×(1 + critRate·critDmg)×(1 + aspd) + HP + DEF×5 + pet (teto 20% da total).
- HUD: `Sys.fc.hud(S, host)` → "FC 1,6k". Nível: `Sys.level.hud(S)` → `{text:'Nv. X', frac, max}` (barra de XP no avatar).
- Pet na batalha: a cada 2,0 s, golpe no inimigo da frente = `st.atk × st.pet.atk × 2,0/0,8` (crítico do herói; **não dá energia de Ultimate**;
  o pet não é alvo). Cura por golpe = `st.hp × st.pet.heal × 2/11`. O vínculo já está em `st.hp`. Pet equipado: `Sys.pet.ensure(S).eq`.
- Aura da arma: `Sys.forge.aura(S)` → `{id: none|blue|purple|flame|gold, name, col, lv}` (desenho da fps-ff, atrás do herói).

## 4. Itens (telas 05 Equipamento, 06 Invocar, 07 Loja)
**Formato** (fechado com a fps-30): `{slot, e, r, lvl, gold, look, subs:[{k,q}]}` (o jogo põe o `id`). `e` = era de PODER (todos os
módulos leem); `look` = era da APARÊNCIA (ausente = e; o sprite do item usa `look`; não muda na transformação).
- `slot`: `weapon | armor` (= Colete) `| hat | gloves | boots | necklace | wing`. Asa: só Épico+ e nível do jogador ≥ 50 (`Sys.stats.canEquip(item, nivel)`).
- `lvl` 1-100; item novo = 1; `gold` = ouro investido (diamante não entra). **O teto "≤ nível do jogador" vale só para SUBIR** (decisão do PO):
  o nível que o item já tem conta inteiro na força, mesmo acima do nível do jogador (save antigo), para ninguém perder força com a mudança de regra.
- `subs`: Raro 1, Épico+ 2; `k ∈ atkPct, hpPct, defPct, critRate, critDmg, aspd` (todos em %); `q` 0..1. O principal não vai no item.
- **Equipar automático:** compara `Sys.fc.itemFC(S, host, novo).swap` (> 0 = melhora a FC com o nível REAL).
- **Tela do item:** `Sys.fc.itemFC(S, host, item)` → `{fc, atPlayerLevel, swap}`: FC do item como está, "FC no seu nível" (projetado em
  min(100, nível do jogador)) e ganho da troca. `Sys.stats.itemStats(item, lvl, forja)` dá os atributos para listar.
- **Equipar e upar até o meu nível (um toque):** `Sys.stats.planUpgrade(S, host, item, 'gold'|'gems')` → `{from, to, levels, gold, gems, cost, ok, reason}`
  mostra o custo TOTAL antes de confirmar; `Sys.stats.upgradeTo(S, host, item, moeda)` cobra tudo de uma vez e sobe o item até o teto. O jogo equipa.
- **Item acima do nível do jogador:** `canUpgrade` e `planUpgrade` devolvem `reason:'level'`, `aboveCap:true`, `itemLevel`, `playerLevel` e `needLevel`
  (nível do jogador para a próxima melhoria). O engenheiro monta o texto: "Nv 25 (acima do seu nível: não pode subir até você chegar ao 25)".
- **Melhoria:** `Sys.stats.canUpgrade(S, host, item, 'gold'|'gems')` → `{ok, reason: max|level|money, gold, gems}`;
  `Sys.stats.upgrade(S, host, item, 'gold'|'gems')` cobra pelo host e soma o ouro em `item.gold`. Custos: `Sys.stats.upgradeCost(item)`.
- **Transformar** (aba Transformar da Forja): `Sys.stats.planTransform(S, host, item)` → `{ok, reason: same|ahead|money, from, to, gold, essence,
  lostGold, lostDismantle, lostLevels}` (custo da fps-30; os "lost" são o aviso da tela). `Sys.stats.transform(S, host, item)` cobra pelo
  `Sys.loot.payTransform` (essência + ouro, tudo ou nada) e só então leva o item para a era atual: mesma raridade, mesmos secundários e mesmo
  visual (`look`), nível 1 e ouro investido zerado (não volta); o +N continua no espaço. Depois, `Sys.fc.record`.
- **Desmontar:** chame SÓ `Sys.loot.dismantle(S, host, item)` (fps-30); ele usa o `Sys.stats.dismantleGold` (50% do ouro investido). O jogo remove o item.
- **Ranking:** depois de QUALQUER troca de item ou skin (e de melhoria, forja, treino, pet), `Sys.fc.record(S, host)` grava a FC atual;
  o ranking semanal usa a maior da semana (`Sys.fc.weekMax(S, host)`; semana anterior em `S.sys.fc.last`).

## 5. Skin e VIP (poder só por compra direta ou passe, nunca sorteio pago)
- Skin: `Sys.skin.bonus(S)` (o fc.js soma sozinho): arma e roupa equipadas +2/+3/+5/+7/+10% de ATK e HP pela raridade, cada uma;
  chapéu, luvas, botas, colar e asa (lidas do `Sys.appearance`) +1/+1,5/+2/+3/+4% (decisão do PO); `Sys.skin.detail(S)` lista as 7;
  coleção +0,5% por skin possuída (teto +10%). Lê `S.skinEq` e `S.skins`. Títulos de coleção continuam cosméticos.
- VIP: NÍVEL de 0 (sem VIP) a 10: `Sys.vip.level(S)`; sobe por PONTOS VIP de compras: `Sys.vip.addPoints(S, n)` → `{points, from, to, levels}`
  (o nível só sobe; quem chama é a loja; nada é cobrado aqui). Barra: `Sys.vip.progress(S)` → `{level, points, next, needTotal, missing, frac, max}`.
  Tabela da tela: `Sys.vip.levelInfo(n)` → `{atkPct, goldXpPct, keys, chestPerDay, offlineMult, speedTier, frame, vipSkin, aura}`.
  `instanceKeysAdd` = entradas EXTRAS POR ÁREA de instância por dia: +1 com QUALQUER VIP (dono; a fps-30 lê por área: 2 por área, 3 com VIP).
  Os benefícios vêm da PROPOSTA da tela 18 (`Sys.vip.DATA.table`, o dono ainda pode trocar os números); os pontos por nível (`DATA.points`)
  são espaço reservado ("[VALOR]" na tela). `setLevel(S, n)` só para debug/migração. Save antigo com `S.vip = true` = VIP 1.
  `Sys.vip.bonus` → +% de ATK/HP do nível (na FC); `Sys.vip.perks(S)` → `{xpPct, goldPct, offlineMult, chestCapAdd, instanceKeysAdd, speedMax, frame, vipSkin, aura}`.
- **Velocidade da batalha (regra do dono):** x1 no começo; x2 com QUALQUER VIP ou, sem VIP, no nível 15; x4 só com VIP 5+ E nível 40+ (não existe x3).
  `Sys.vip.speedMax(S, host)` → 1 | 2 | 4 (o botão vai até esse valor). `Sys.vip.maxSpeed(S, host)` → `{max, next:{speed, text, need:{vip?, level?}}, speeds}`
  para a tela: "x2: nível 15 ou VIP" / "x4: VIP 5 e nível 40". **O engenheiro aplica:** o botão de velocidade e o `offlineMult` no ouro offline
  (js/meta.js). O resto os módulos já aplicam (sem dobro).

## 5b. Arena, ranking e visual
- **Arena** (`Sys.arena`; sem tela aprovada): `opponents(S, host)` → 3 adversários `{id, name, fc, skin, points, bot}` (FC do jogador ±10%,
  fixos no dia) · `refresh(S, host)` (1 troca grátis/dia) · `fight(S, host, oppId)` → `{ok, reason: tries|opp, win, delta, points, duel}` (5 lutas/dia;
  +20·k / −10·k pontos, k = FC dele / FC sua entre 0,5 e 2) · virada semanal na segunda (`S.sys.arena.lastWeek`, `bestRank` para os títulos).
  **Prêmio por faixa DESLIGADO contra bots** (`DATA.rewardsVsBots = false`, mesma regra do ranking: vale quando o ranking online abrir).
- **Ranking (tela 12) e arena usam a MESMA fonte trocável:** `Sys.arena.ranking(S, host, 'fc'|'arena')` → `{kind, week, list:[{rank, name, value, me, bot}],
  me:{rank, value}, bots}`; `Sys.arena.weekInfo(S, host)` → `{week, start, end, msLeft}`. No 'fc', a FC do jogador é a MAIOR da semana
  (`Sys.fc.weekMax`, gravada pelo `record()`); 49 bots FIXOS na semana em volta dela. Servidor no futuro: `Sys.arena.setProvider({listOpponents,
  reportResult, getRanking, weekInfo})`, com a mesma assinatura do `Sys.arena.localProvider`.
- **Luta justa** (torre e arena): o adversário é uma CÓPIA do jogador escalada até a FC alvo (`Sys.tower.scaledFoe`). Antes, o fantasma meio a
  meio vencia quase sempre um jogador com a mesma FC (2% de vitória medida). Agora: FC igual ≈ 60% (quem bate primeiro), 10% a mais decide.
  Rótulos da torre: Fácil (razão ≥ 1,05, ~95%) · Equilibrado (0,97-1,05) · Difícil (0,9-0,97) · Muito difícil (< 0,9).
- **Visual** (`Sys.appearance`): `of(S, host)` → para os 7 espaços `{source: skin|item|none, key, skin, era, r, hidden}`. O item usa `look` (visual de
  origem). Chave do sprite (proposta para a fps-ff): `item/<slot>/e<era>_r<r>` ou `skin/<id>`. `setSkin(S, slot, id|null)`: arma e roupa gravam em
  `S.skinEq` (contam no poder do `Sys.skin`); os outros 5 espaços dão poder menor (+1% a +4%, decisão do PO). `setHidden(S, slot, bool)` esconde chapéu, luvas,
  botas, colar ou asa sem mudar atributos.

## 5c. Pets Revisão 3 (aprovada pelo PO) — ATRÁS DE CHAVE DESLIGADA: `Sys.pet.DATA.v3 = false`
Nada muda no jogo até a tela de Pets e a arte dos estágios serem aprovadas pelo dono. Ligada (`DATA.v3 = true`):
- **Nível POR PET** 1-90 (teto por era 10/20/30/45/60/75/90; eras 7-8 = 90, só estrelas); ração ⌈3 × 1,05^(N−1)⌉. `feed(S, host, n, id)` e
  `canFeed(S, host, id)` (padrão = o pet equipado); `levelOf(S, id)`. Ao ligar, cada pet herda o nível compartilhado ATUAL (ninguém perde ração).
- **Estágios**: `stage(S, id)` → `{id: cub|mid|evolved, name, mult, aura, next:{name, at}}` (médio no 30 ×1,25; evoluído no 60 ×1,5; aura própria).
- **3 ataques**: `attackOdds(estrelas, nível)` → `{crit, mid, basic, avg}` (crítico 7→12%, mediano 3→6%; dano 5x / 2,5x / 1x). Em CADA golpe do
  pet, `rollAttack(S, id, rng)` → `{type: basic|mid|crit, name, mult}`: golpe = `st.atk × st.pet.atk × 2,0/0,8 × mult` (mult é RELATIVO À MÉDIA,
  então a média dos golpes bate com a FC). O teto de 20% da FC continua (o golpe é dividido pela média máxima, 1,57).
- Efeito visual (regra do dono, fps-ff): sempre menor que as habilidades do Kael; no evoluído, crítico e mediano com efeito mais bonito.
- **"Redefinir nível"** (nome na tela, PO; com confirmação mostrando a ração que volta = `refund`): `canResetLevel(S, id)` / `resetLevel(S, host, id)`
  (sinônimos de `canRelease` / `release`) → `{ok, reason: off|pet|level, refund, from}`: o pet volta ao Nv 1 e devolve 80%
  da ração gasta NELE (`owned[id].food`); o pet e as estrelas ficam. Garantia do PO para quando ligar: o grátis leva o pet principal ao
  EVOLUÍDO (Nv 60) e um 2º pet ao MÉDIO (Nv 30) até o fim da era 4 = **1.238 de ração** (1.037 + 201); a fps-30 calibra as fontes.

## 5d. Pets Revisões 4 e 5 — ATRÁS DE CHAVE DESLIGADA: `Sys.pet.DATA.v4 = false` (só vale com a v3 também ligada)
Desligada, nada muda (os pets novos não saem de ovo, não aparecem no painel e nenhuma fonte entrega). Ligada:
- **Submundo** (🦇, Lendário, ataque, a partir da era 7) e **Celestial** (🕊️, Lendário, defesa, a partir da era 8): saem do ovo Lendário só a partir
  da era deles. `Sys.pet.avail(def, host)` diz se um pet existe agora. O ovo do andar 100 da torre agora vem com `pet:'phoenix'` (sempre fênix).
- **Prismático** (💠, raridade 5 "Prismático", tipo próprio: golpe 1,0 / vínculo 0,6 / cura 0,4): **nunca sai de ovo e não é vendido**. Nasce
  sozinho com **1.000 fragmentos**; estrelas 50/100/150/200 (`Sys.pet.starCostOf(def)`). Teto POR PET: 1/3 da FC do herói (= 25% da FC total), pela
  chave nova `petCap` do `bonus` (o `fc.js` usa; 0 = o teto padrão de 0,25). Ataques: crítico até 14%, mediano até 7%.
- **Fontes** (sem sorteio; números na tabela única `Sys.pet.DATA.v4d.prism`):
  - chefe da era 8+: `Sys.pet.prismBoss(S, host[, era])` na VITÓRIA → 1 por dia (+1 a cada 4 dias com VIP). A 2ª vitória do dia: `reason:'today'`.
  - VIP 10: 500 uma vez. O `Sys.vip.setLevel/addPoints` já chama `Sys.pet.prismVipMax(S, host)` (idempotente; o jogo pode chamar ao abrir a tela).
  - arena: `Sys.arena.DATA.rewards[].prism` 1º 10, 2º 7, 3º 5, 4º-10º 3, 11º-50º 1 (como os outros prêmios, nada contra bots).
  - torre: 5 a cada 25 andares acima do 105 (`rewardsFor(f).prismFrags`, entregue pelo `grantRewards`).
  - eventos (principal): 100 por evento mensal (aprovado pelo PO), pela loja/missões do `Sys.events` (fps-30; `grantBundle` com fragmentos de pet).
- Painel: o card do Prismático não nascido mostra "X/1.000 fragmentos · eventos, arena, VIP 10, chefe da era 8 e torre".

## 5e. Curva das 9 eras — ATRÁS DE CHAVE DESLIGADA (spec: reports/curva-9-eras-e2.md)
- `Sys.level.setV9(true)`: nível máximo 120 e a curva nova (`DATA.v9.xpToNext`). **XP de abate passa a ir com `addXp(S, n, host, 'kill')`** (fps-30):
  teto diário cheio até T da era, 30% até 2T, 10% acima. `killCap(S, host)` → `{on, full, used, left, rate}`. Sem 'kill' = sem teto.
  VIP no v9: `Sys.vip.perks().xpPct` = coluna `xp9`; a tela mostra `Sys.vip.DATA.table.prog9[nível]` (progresso ×1,13 … ×1,50). Offline do VIP não dobra a XP.
- **Kael cresce:** `Sys.level.stage(S, host)` → `{on, stage 0-3, id: boy|teen|adult|legend, name, next:{lvl, fc, needLvl, needFc}, ready}`;
  com `ready`, a tela toca a evolução e chama `Sys.level.evolve(S, host)`. Só visual. Desligado = sempre o garoto.
- `Sys.stats.setEra9(true)`: eras 7-8 (`maxEra` 8), item até o Nv 120 e a raridade **Divino** (r 5; `Sys.stats.maxR()`).

## 5f. Pet no nível 20 — ATRÁS DE CHAVE DESLIGADA: `Sys.pet.DATA.v20.on = false`
- Ligada: o pet abre no **Nv 20**. Ao chegar (e na carga, se já passou do 20 sem ele), o jogo chama `Sys.pet.firstEgg(S, host)` →
  `{ok, pet, name, rarity, rarityName, odds:[{r, name, pct}], hatch, pre}` (ou `reason: off|level|done`). Sorteio só **79% Básico / 21% Raro**
  (`DATA.v20.firstEgg.weights`; `firstEggOdds()` para a tela). O pet do ovo grátis entra equipado.
- Ovos ganhos ANTES disso: `addEgg` devolve `{held:true, pre:true, needLevel:20}` e o ovo fica em `S.sys.pet.pre`; choca logo depois do ovo grátis
  (vem em `firstEgg().pre`). Fragmentos e ração de antes continuam guardados. Save que já tem pet: conta como feito.
- **Batalha:** `Sys.pet.battleInfo(S, host)` → `{id, name, rarity, type, stars, level, stage 1-3, stageId, aura, interval 2,0, hitMult 2,5, healEvery 11,
  draw:{sprite:'pet_<id>_s<estágio>', behind:'hero'}}` ou null. Golpe = `st.atk × st.pet.atk × 2,5` (× `rollAttack(...).mult` na v3) a cada 2 s;
  cura por onda = `st.hp × st.pet.heal`. O pet ataca sozinho, não é alvo e não dá energia de Ultimate.

## 5g. Arena com servidor (luta autoritativa)
- O provider da arena DECIDE a luta: `provider.fight(S, host, opp)` → `{ok, win, delta, points?, seed, log?}`. `Sys.arena.fight(S, host, oppId)` só aplica o
  resultado (tentativas, vitórias, pontos) e devolve `{ok, win, delta, points, opp, duel, seed, log}`. Local = o mesmo duelo de sempre (mesma seed).
  Servidor (docs/API_SERVIDOR.md §4, fps-30) = `POST /arena/fight`, rodando o mesmo js/sys no Node. A tela anima pelo `log` (ou pelo `seed`), mas o vencedor é o do resultado.

## 5h. Tela 17b PETS V2 (aprovada pelo dono) — ATRÁS DE CHAVE: `Sys.pet.setV17(true)` (exige `DATA.v3 = true`)
Protótipo: docs/proto/PetsV2.dc.html (manda nas regras visíveis). Os **ids do save não mudam**; ligar só troca nome, raridade e sprite.
| id (save) | Nome na tela | Raridade | Era | Sprite (assets/anim/pets/) |
|---|---|---|---|---|
| wolf | Mamute | Básico | 0 | era0_mammoth ✅ |
| owl | Esfinge | Raro | 1 | era1_sphinx ✅ |
| drake | Dragão | Épico | 2 | era2_dragon ✅ |
| parrot (novo) | Papagaio-fênix | Épico | 3 | era3_parrot ✅ |
| golem | Cão mecânico | Mítico | 4 | era4_mechdog ✅ |
| underworld | Cérbero | **Mítico** (era Lendário na Revisão 4) | 7 | era7_cerberus ❌ falta a folha |
| celestial | Pégaso | Lendário | 8 | era8_pegasus ❌ falta |
| prism | Raposa de cristal | Prismático | — | prism_fox ❌ falta |
| phoenix | Fênix | Lendário | (torre 100) | **não está no protótipo** (PO decide) |
O 1º ovo do Nv 20 (79/21) passa a dar **Mamute** (79%) ou **Esfinge** (21%), os mesmos ids wolf/owl.

**Item a item (o que a tela chama):**
| Regra do protótipo | API | Situação |
|---|---|---|
| Libera no Nv 20, ovo grátis 79% Básico / 21% Raro | `firstEgg(S, host)`, `firstEggOdds()` | ✅ (§5f) |
| Lista e coleção (obtidos, "como conseguir", contagem) | `DATA.pets` + `avail(def, host)` + `ensure(S).owned` | ✅ ("como conseguir" é texto da tela) |
| Nível 1-90 e ração | `levelOf(S, id)`, `foodCost(nível)`, `canFeed(S, host, id)`, `feed(S, host, n, id)` | ✅ |
| Barra parcial de ração (25 por toque) | `feedTap(S, host, id, 25)` → `{ok, given, up, lvl, fx, need}` | ✅ novo (`owned[id].fx` = ração na barra) |
| 3 estágios no Nv 30 e 60, botão Evoluir, teto 30/60/90 | `stage(S, id)` → `{index 0-2, name, aura, cap, next:{at}, ready}`, `canEvolve`, `evolve(S, id)` | ✅ novo (estágio guardado; `canFeed` devolve `reason:'evolve'` no teto) |
| Bônus na FC (atual e máximo 8/11/14/17/20/25%) | `fcShare(S, host, id)` → `{now, max}` em % da FC TOTAL | ✅ novo (bônus linear no nível, sem salto) |
| 3 ataques com chance atual e máxima, dano 1x / ~2,5x / ~5x | `attackOdds(estrelas, nível, id)` → `{basic, mid, crit}`; `attackOdds(5, 90, id)` = máximo | ✅ (Raposa: 14% e 7%) |
| Estrelas 1-5 | `owned[id].stars`, `starCostOf(def)` | ✅ (repetido = fragmentos; ver divergência 3) |
| Redefinir nível (80%, estrelas e estágio ficam) | `canResetLevel(S, id)` → `{refund}`, `resetLevel(S, host, id)` | ✅ (o estágio fica no 17b) |
| Equipar | `equip(S, id)` | ✅ |
| Fragmentos da Raposa (0/1.000) e fontes | `ensure(S).stored.prism`, `DATA.v4d.prism` | ✅ (Revisão 5) |
| Pet na batalha (sprite, estágio, golpe a cada 2 s) | `battleInfo(S, host)` → `draw:{sprite, sheets:[idle, run, atk1, atk2, atk3]}` | ✅ |
- **Decisões do PO (17b), também em `setV17(true)`:**
  - **Fênix SAI.** Quem já a tem recebe um ovo Épico À ESCOLHA (Dragão ou Papagaio) com tudo o que investiu: as estrelas viram fragmentos e a ração volta.
  - **Ovo = espécie da era** (sem sorteio; o único sorteio é o ovo grátis do Nv 20). Vale para qualquer fonte (chefe, torre, instância, baú).
    `eraEgg(S, host, era)` diz o que o ovo dá, para a tela de recompensa.
  - **Andar 100 da torre:** ovo Épico À ESCOLHA. Os fragmentos dos andares 101-110 vão para o pet escolhido.
  - **Eras 5 e 6:** à escolha entre as espécies já liberadas da maior raridade permitida.
    Hoje isso é só o Cão mecânico, o único Mítico liberado; com ele, o ovo sai direto, sem tela de escolha.
  - Com escolha, `addEgg` devolve `{choice:true, options:[ids], index}`. A tela mostra as opções e chama `chooseEgg(S, host, index, id)`.
    As escolhas pendentes ficam em `ensure(S).choices`.
  - **Acima do portão de raridade** (ex.: Cão mecânico antes do Nv 70): `addEgg` devolve `{held:true, gated:true, pet, name}` e o ovo fica guardado.
    A fps-30 chama `releaseGated(S, host)` junto do `Sys.loot.releaseHeld`.
  - **Repetido** = 10 fragmentos (estrelas 10/20/30/40). Em 5★ vira ração. Todos os pets são do tipo "combate" (golpe 1,0 + vínculo 1,0).

## 5i. Montaria e oferta de 1ª compra — ATRÁS DE CHAVE (spec: reports/spec-oferta-montaria.md, aprovada pelo PO)
- **`Sys.mount`** (js/sys/mount.js, `DATA.on=false`; carregar no index.html junto dos outros). O Kael MONTA; a montaria não ataca, só dá % de ATK e % de Vida
  (entram sozinhos na FC pelo `bonus`). `add(S, host, id)` (repetida = 10 fragmentos), `equip(S, id)`, `info(S, host, id)` → `{name, rarityName, lvl, cap,
  stars, frags, need, pct, maxPct, equipped}`, `canUpgrade/upgrade(S, host, id, n)` (ouro; teto = nível do jogador ÷ 2), `battleInfo(S)` → `{id, sprite,
  visual}`: **`visual:false` = não desenhar o Kael montado** (atributo vale antes da arte, PO). Catálogo (PO): Pônei, Cavalo de guerra, Lobo de guerra (o da oferta), Grifo dourado, Serpe dourada; sprite = `mount_<id>` (assets/mounts).
- **`Sys.offer`** (js/sys/offer.js, `DATA.on=false`). `status(S, host)` → `{available, msLeft, claimed, expired, price, contents}` (24 h a partir do 1º acesso com
  a oferta ligada). Depois do pagamento confirmado (jogo/servidor): `grant(S, host)` → arma Épica 3★ (`host.addItem`), montaria Lobo de guerra, 300 💎 (`host.addGems`),
  ouro de 2.000 abates (`host.addGold`); uma vez só.
- **Arma da oferta** (`item.offer = true`): `Sys.stats` faz ela ACOMPANHAR o nível e a era do jogador até o Nv 25 (`offerSync`, sozinho ao calcular). Do Nv 1 ao 24
  ela fica entre ×1,76 e ×3 da arma normal da mesma era e nível; no 25 o Épico vira normal (empata; ×1,10 com a qualidade ligada). Depois do 25 é um item comum.

## 6. Eventos
| Quando | Chamar |
|---|---|
| cada inimigo morto (horda E chefe; um evento só por inimigo) | `Sys.practice.onKill`, `Sys.titles.onKill` (S, host, enemy) + `Sys.loot.onKill` da fps-30 (que já dá o XP dos orbes) |
| onda limpa | `Sys.titles.onWaveClear(S, host)` |
| ganho offline | `Sys.practice.onOffline`, `Sys.pet.onOffline`, `Sys.level.onOffline` (S, host, segundos) |
| missão diária concluída / todas do dia | `Sys.level.onMission(S, host)` / `Sys.level.onDailyBonus(S, host)` |
| vitória em instância | já chamado pelo `Sys.instances` (`Sys.level.onInstance(S, host, mult)`) |
**Não chame `Sys.level.onKill`**: obsoleto, não dá XP (o XP de abate é do Sys.loot). `enemy` precisa de `boss` e `eraBoss` (booleanos).

## 7. Nível do jogador e desbloqueios (v6)
- `Sys.level.addXp(S, n, host)` → `{gained, levels, from, to, unlocked}`. Curva `DATA.xpToNext` = os 99 valores da v6 (Nv 10 = 650 XP acumulado;
  25 = 32,5 mil; 70 = 264 mil; 100 = 960 mil). XP: instância 25 × dificuldade, missão 30, bônus diário 50, offline 20/h; tudo × (1 + era); VIP +50%.
- Bônus: +0,3% de ATK e HP por nível (nível 100 = +30%).
- Desbloqueios: pet 1 · práticas 5 · forja 12 · instâncias 14 · torre 15 · arena 30. Bloqueado: o painel mostra o cadeado desenhado (SVG) com
  "Libera no nível X", a ação recusa com `reason:'locked'` e os materiais continuam caindo e ficam guardados.
- Portões de ovo (fonte única: `Sys.loot.capEggR`): Mítico nível 70+ e era 4+; Lendário 85+ e era 5+. Exceção: a fênix do andar 100.

## 8. Painéis (`Sys.<m>.render(el, S, host)`; contêiner de ALTURA FIXA, sem scroll, retrato 390 px, alvos ≥ 44 px)
`fc` (Como ficar mais forte), `practice`, `titles`, `tower`, `forge` (7 espaços, paginado pela altura), `pet`. Classes `sys-<m>-*` (blocos da fps-e2 no sys.css).

## 9. Funções úteis
- Práticas: `addStones`, `train(S, host, id, n|Infinity)`, `canTrain`, `level`, `cost`, `capOf`.
- Forja: `addStones`, `attempt(S, host, slot)` com qualquer um dos 7 espaços → `{ok, success, lv, chance, pity}` (a falha nunca tira nível),
  `canTry`, `chance`, `worstTries`, `mult`, `capOf`, `aura`.
- Pet: `addEgg(S, host, {r} | {weights, minR})` (+ `source:'instance'|'tower100'` dentro do mesmo objeto), `addFood`, `addFragments`, `feed`, `equip`, `best`, `setGolemChoice('auto'|'golem'|'phoenix')`.
- Torre: `fight(S, host)` → `{ok, win, floor, opp, duel, rewards}` (prêmios já entregues), `floorFC(f)`, `opponent(f)`, `rewardsFor(f, host)`.
- Títulos: `check(S, host)`, `setFeatured`, `featured`, `bonus`.

## 10. Decisões registradas (aprovadas pelo PO)
1. Torre: **chefe a cada 10 andares** (dono; era 5). A curva das âncoras (15, 30, ..., 105) é a FC do andar COMUM; o chefe fica 30% acima.
   O mediano no fim da era k chega ao andar 15·(k+1) (ou ao anterior, quando ele é chefe: 30, 60, 90). Prêmio POR CHEFE dobrado (💎 10 + andar/5;
   4 pedras de forja a partir do 20) para o total da torre não cair: até o 105, 290 💎 e 36 pedras (antes 295 e 36). O adversário é a cópia
   do jogador na FC do andar (`scaledFoe`).
2. Pet: o vínculo conta na FC como parte do pet (teto 20%). Golem repetido = preferência salva (auto/golem/fênix): +10 de golem ou +7 de fênix (v7.1). Fênix 5★ repetida = 10
   fragmentos de golem. Ovo de instância repetido em 5★ = ração (5/8/12/15/20). Subida do 5★ bloqueada pelo portão = ração. O ovo de marco
   é guardado pela fps-30 até o portão abrir.
3. Títulos: a coleção de armas guarda as armas já conquistadas; "todos" segue o catálogo; os títulos de visual são cosméticos.
4. Itens: curva do nível do item **v8 (aprovada PARA TESTE)**: `Sys.stats.lvlFactor(N)` = (1 + 0,15·(N−1)) × 1,01^(N−1) (Nv 12 = ×2,96;
   Nv 100 = ×42,5); a v7 (1,04^(N−1)) fica em `DATA.lvlCurve = 'v7'` para comparar. Ouro da melhoria v8 PROPORCIONAL ao ganho de cada
   nível (`costCurve`, `goldBaseV8` 25, `costGrowthV8` 1 = ajuste da calibração); até o Nv 12 custa o mesmo que a v7. Antes: ouro da melhoria × 3,5^era (v7); botas, colar e asa escalam com a era por passo aditivo
   (% × (1 + 0,25·era), era 6 = ×2,5), porque o 12^era dos planos estouraria os % (velocidade, dano crítico).
5. Migração: o ouro investido dos itens antigos é estimado pela tabela antiga (a que foi paga).

## 11. Histórico
As versões anteriores deste arquivo (v5.1: nível no espaço 1-60, DEF como "% de redução", forja só em arma/armadura, curva de XP provisória
40·1,115) estão SUBSTITUÍDAS. Specs de origem: reports/sys-estado.md, spec-fortalecimento.md, spec-pet-fc.md.
QA da lógica (forja, pet, torre, FC) aprovado pelo "QA do jogo jogável" (antes fps-0b), com Monte Carlo próprio: reports/qa.md.
Pendente: a arena (só spec) e o teste das telas reais 390x844, que depende de os painéis entrarem no jogo.
