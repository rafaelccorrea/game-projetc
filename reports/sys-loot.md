# Sys.loot (js/sys/loot.js): saque da horda (fps-30)
Status: **pronto e testado** (`node test/sys/loot.test.js`: 18 testes). Não está ligado ao jogo: quem liga é o engenheiro (fps-c9).
Números: reports/spec-loot-bau-instancias.md, fechados na v5.1 (docs/balance.json).

## O que faz
Por abate sorteia moedas, gemas, item, pedra de forja, ração e ovo de pet. Entrega ouro/gemas/itens pelo `host` e os materiais aos
módulos que os gastam (acordo com a fps-e2). Também devolve a lista de **pickups** para a batalha animar até o HUD e um agrupador "+N".
Regra do lançamento: **arma Mítica não existe** (vira Épica; numa fonte Mítico+ com a sorte de +1, vira Lendária). Armadura mantém as 5 raridades.

## Tabela (v5.1)
| | Comum | Chefe de fase | Senhor da Era |
|---|---|---|---|
| Ouro | `e.gold` ±10% | `e.gold` | `e.gold` (se não vier, `host.goldUnit()` × 1 / 15,6 / 31) |
| Gema | 1,5% de 1 | — | 3-5 |
| Item | 3,5% | 100%, Raro+ (+1 com 25%) | 100%, Épico+ (+1 com 25%) |
| Pedra de forja | **1%** de 1 (v7.1; era 0,7%) | 1-2 | 3-5 |
| Ração de pet | 0,4% de 1 | 3-5 | 15-20 |
| Ovo de pet | — | 10% (garantia no 10º sem ovo; Básico garantido no 1º chefe do jogo); 50/32/13/5/0 | 1ª vitória de cada era: garantido, mínimo [B,R,R,E,E,M,M]; depois 25%, 40/35/18/6/1 |
Pedra de PRÁTICA de abate: é do `Sys.practice.onKill` (fps-e2), não daqui.

## 7 espaços, formato do item e secundários (regras novas do dono; formato fechado com a fps-e2)
**Item** (o que `host.addItem` recebe): `{slot, r, e, subs:[{k, q}]}`
- `slot` ∈ `weapon` · `armor` (colete) · `hat` · `gloves` · `boots` · `necklace` · `wing`; `r` 0-4; `e` 0-6.
- `subs`: Básico 0 · Raro 1 · Épico+ 2, distintos e nunca iguais ao principal do espaço; `k` ∈ `atkPct, hpPct, defPct, critRate, critDmg, aspd`; `q` 0..1.
  Valor, principal por espaço, FC: `Sys.stats` (fps-e2). Se `Sys.stats.rollSubs` existir, é ele que sorteia.
- Nível e fortalecimento: no espaço. **Asa**: só com nível 50+ e Épica+ (se o sorteio cair em asa sem cumprir, sorteia outro espaço).

**Distribuição de espaços por fonte** (`rollItem(host, {source})`, em `DATA.slotWeightsBySource`)
| Fonte | Arma | Colete | Chapéu | Luvas | Botas | Colar | Asa |
|---|---|---|---|---|---|---|---|
| horda (`drop`) | 22 | 22 | 16 | 14 | 14 | 8 | 4 |
| chefe (`boss`) | 20 | 20 | 15 | 15 | 15 | 10 | 5 |
| baú (`chest`) | 18 | 18 | 16 | 16 | 16 | 10 | 6 |
| Arsenal (`arsenal`) | 18 | 18 | 16 | 16 | 16 | 10 | 6 |
| Chefe de Era, instância (`eraBossInst`) | 15 | 15 | 13 | 13 | 13 | 16 | **15** |
| invocação (`summon`) | 20 | 20 | 15 | 15 | 15 | 10 | 5 |
| loja (`shop`) | 25 | 25 | 15 | 12 | 12 | 11 | **0** |
A asa vem principalmente do Chefe de Era (instância); nunca da loja. **Engenheiro:** invocação = `rollItem(host, {source:'summon'})`, loja = `{source:'shop'}`.
**Regra do dono: nada de sorteio pago.** A loja usa o `rollItem` só para MONTAR o estoque do dia (na reposição); a vitrine mostra o item inteiro
(espaço, era, raridade e secundários) e o jogador compra exatamente aquele item, sem sorteio na compra. A invocação paga com 💎 depende de decisão do PO
(se 💎 puder ser comprado, vira sorteio pago).

## Era futura e qualidade (atrás de chaves DESLIGADAS; spec reports/spec-qualidade-item.md da fps-e2)
- **Era futura:** `Sys.loot.DATA.futureEra.on` (false). Ligada, todo sorteio de era (drop, baú, invocação, loja, instâncias) pode sair era+1 ~0,5%,
  +2 ~0,05%, +3+ ~0,005%, até a última era (`Sys.stats.DATA.maxEra` ou 6). O portão de raridade continua o do JOGADOR. O "adormecido" é do stats.js.
- **Qualidade:** se `Sys.stats.DATA.quality.on`, todo item que os meus módulos criam (rollItem, pacotes, passe) ganha `qp = Sys.stats.rollQuality(rng)`;
  `itemOut` leva o `qp` para o jogo. Desligada: o item sai sem `qp` (o stats trata como a média, 2.500). Fusão: quem tira os 3 itens da mochila é o jogo.

## Nomes dos 5 espaços novos
`Sys.loot.itemName(item)` → nome do chapéu/luvas/botas/colar/asa por era de APARÊNCIA (`item.look ?? item.e`) e raridade; tabela em `Sys.loot.DATA.names`.
Arma e colete: `null` (o jogo usa os nomes que já existem em `ERAS[e].w / .a`).

## Nível do item e desmontar (regra do dono "MELHORIA DE ITEM", substitui o nível no espaço)
- Item: `{slot, r, e, lvl, gold, subs}`. `lvl` 1-100 do ITEM (nasce 1; teto = nível do jogador, no stats.js); `gold` = ouro investido em melhorias
  (nasce 0; o stats.js da fps-e2 soma a cada melhoria por ouro; diamante não entra). O fortalecimento +0..+15 continua no espaço.
- `Sys.loot.dismantle(S, host, item)` → `{gold, forge}`: devolve 50% do `item.gold` (cálculo `Sys.stats.dismantleGold`) por `host.addGold`, mais
  pedras de forja por raridade **0/1/2/4/10** (`DATA.dismantle.forge`; o PO cortou pela metade após a v7, porque as pedras sobravam). Quem remove o item da mochila é o jogo, que chama só essa função.

## Invocação SÓ COM OURO (decisão do dono via PO; nunca gemas)
`Sys.loot.summon(S, host, 1|10, {free})` → `{ok, cost, free, items}` ou `{ok:false, reason:'ouro'|'gratis'|'n'|'host'}`.
- Preço: x1 = **500 × 4^era** · x10 = 9 × x1 · `Sys.loot.summonCost(host, n)` (300 → 1.000 após a v7 → 500 após a build v0.8.1: com 1.000, em 10 min o jogador só conseguia a grátis).
- **Chances para a tela:** `Sys.loot.summonOdds(host)` → `{byR:[%], best, cap, weaponShare, pity}`, já com o portão e a arma sem Mítica (o engenheiro não precisa recalcular).
- 1 grátis por dia (meia-noite local): `Sys.loot.summonFreeLeft(S, host)`; `{free:true}` só com n = 1.
- Cobra por **`host.spendGold(valor)` → true/false** (o engenheiro expõe; sem ouro, não cobra nem invoca). Itens por `host.addItem`.
- Raridade: tabela de invocação 50/28/14/6/2, com portões e arma Mítica→Épica; espaços pela fonte `summon`.
- **Garantia:** a cada 10 invocações seguidas sem a MELHOR raridade liberada para o jogador, a 10ª vem nela (`item.pity=true`); o contador
  (`S.sys.loot.summon.pity`) não zera na virada do dia. Estava implementada no jogo: agora é do módulo, e o jogo deve tirar a dele.
- O "Invocar Skin" e os pacotes de skin por 💎 do index.html atual são sorteio pago: o engenheiro tira (regra do dono).

## VIP (Sys.vip.perks(S) da fps-e2; sem VIP ou com erro = zeros)
Aplicado aqui (os valores vêm do Sys.vip; opção B do PO = **+25%**): `goldPct` no ouro do abate, do baú e das instâncias · `xpPct` nos orbes · `chestCapAdd` (baú 8→12/dia) ·
`instanceKeysAdd` (+1 chave) · `offlineMult` nos itens offline. Com a fps-e2: XP de instância/missão/offline e pedras/ração offline.

## XP por abate: orbes de experiência (ordem do dono via PO)
- Cada abate solta orbes de XP (`res.xp`, pickups `type:'xp'`, `to:'level'`, 1-2 orbes no comum, 4-6 no chefe, 8-10 no Senhor; rótulo "+N XP" pelo agrupador).
- `xp = base × (1 + era) × (1 + 0,05·(fase na era − 1))`, base comum **2,2** · chefe **33** · Senhor da Era **264** (`Sys.loot.DATA.xp`; v7.1, calibrada no ritmo real da build).
  **v8:** `eraScale` virou VETOR por era, `[1, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15]` → multiplicador da era e = 1 + eraScale[e]·e = 1 · 1,15 · 1,3 · 1,45 · 1,6 · 1,75 · 1,9
  (antes 1·2·3·…·7). Para calibrar uma era só, troque o valor daquela posição.
  Era e fase vêm do inimigo (`e.era`, `e.stage`) ou do host (`host.stage()`).
- Entrega: `Sys.level.addXp(S, n, host)` (fps-e2). Sem o módulo: XP pendente, sai no `flushPending`. Se subir de nível, `res.levelUp = {from, to, unlocked}`
  e os ovos de marco guardados chocam no mesmo abate (`res.released`).
- **NÃO chamar `Sys.level.onKill` nos abates** (seria XP em dobro). Offline: `Sys.level.onOffline`. Missões: `Sys.level.onMission`. Instâncias: o
  `Sys.instances.finish/sweep` já chama `Sys.level.onInstance` na vitória (`reward.xp`, `reward.levelUp`).
- `host.level` deve ler o nível real: `host.level = () => Sys.level.level(S)`.

## Portões de raridade (regra do dono via PO): ponto único `Sys.loot.maxAllowedR(host)`
| Raridade | Básico | Raro | Épico | Mítico | Lendário |
|---|---|---|---|---|---|
| Portão | sempre | nível 10+ | nível 25+ | nível 70+ **e** era 4+ | nível 85+ **e** era 5+ |
- Nível: `host.level()` (curva de XP da fps-c9, simulação v6). **Engenheiro: exponha `host.level`.** Sem ele, só o portão de era vale.
- Era: `host.eraMax()` (era liberada do jogador, não a do item). Portões cumulativos (não pula degrau).
- Abaixo do portão, o sorteio vira a maior raridade permitida; arma continua sem Mítica no lançamento (portão em Mítico → arma Épica).
- Vale para todo `rollItem` (drop, baú, invocação, loja, instâncias, inclusive os 10% de Lendária do Chefe de Era Difícil) e, via `capEggR`,
  para ovos de pet só de Mítico/Lendário (Básico/Raro/Épico não são barrados). A fênix do andar 100 da torre é exceção (marco, no tower.js).
- Números em `Sys.loot.DATA.gates` e `DATA.eggGateFrom`.
- **Prêmio de marco não piora (PO):** o ovo garantido da 1ª vitória sobre o Senhor da era (e o Básico do 1º chefe) NÃO é rebaixado. Se o
  portão ainda não abriu, ele fica **GUARDADO** (`res.held = [{r, needLevel}]`, pickup com `held:true`): mostrar
  "Ovo Mítico guardado: choca no nível 70" (Lendário: nível 85). Choca sozinho, na raridade original, quando o portão abrir:
  a cada `onKill` (automático, em `res.released`) e em `Sys.loot.onLevelUp(S, host)`, que o jogo deve chamar ao subir de nível.
  Lista para a UI: `Sys.loot.held(S)`. Ovos comuns (não marco) continuam rebaixados.

## Estado (S.sys.loot, v2; save antigo v1 é convertido sozinho)
`{v, kills, gold, gems, items, bosses, byR[], mat:{forge, food, eggs:{r|'ri':n}} /*só PENDENTES*/, egg:{pity, first, eraFirst[]}, held:[{r, source}] /*ovos de marco esperando o portão*/, today:{day, forge, food}}`

## O que o engenheiro chama e onde
| Quando | Chamada | Observação |
|---|---|---|
| boot, depois de carregar js/sys/*.js | `Sys.loot.ensure(S); Sys.loot.flushPending(S, Sys.host)` | repassa o que ficou pendente |
| `killEnemy(e)` (campanha, NÃO instância) | `const r = Sys.loot.onKill(S, Sys.host, {gold:e.gold, boss:e.boss, eraBoss:e.eraBoss, era:eraOf(S.stage), x:e.x, y:eY(e)})` | substitui `S.gold+=` e `maybeDrop(e)`: o ouro já vem por `host.addGold` |
| logo depois | animar `r.pickups` (type gold/gem/forge/food/egg/item, value, r, icon, to:'gold'/'gems'/'bag', delay, big, glow) | o crédito já foi feito; o toque só acelera o voo |
| rótulo "+N" | `const G = Sys.loot.createGrouper()`; `G.add(p.type, p.value, B.t)` a cada pickup que chega; desenhar `G.live()`; `G.due(B.t)` some | 1 rótulo por tipo |
| ovo chocado | `r.hatched` = retorno do `Sys.pet.addEgg` (pet novo / fragmentos) | mostrar aviso |
| missão diária | `Sys.loot.todayCount(S, Sys.host, 'forge') >= 15` | "Colete 15 pedras de forja" |
| volta do offline | `const o = Sys.loot.offline(S, Sys.host, segundos); Sys.loot.grant(S, Sys.host, o); Sys.chest.onKills(S, o.kills, Sys.host)` | só ITENS e carga do baú. Ouro: js/meta.js · ração: `Sys.pet.onOffline` · prática: `Sys.practice` (fps-e2) |
| invocação/loja | `Sys.loot.rollItem(Sys.host, {...})` | já aplica Mítica→Épica nas armas |

`host` usado: `rng, now, stage, eraMax, level, goldUnit(stage?), addGold, addGems, addItem({slot,r,e})` (+ `best` nas instâncias).
Entrega de materiais: `Sys.forge.addStones(S,n,host)`, `Sys.pet.addFood(S,n,host)`, `Sys.pet.addEgg(S,host,{r})` (fps-e2). Sem eles: pendente.
Parâmetros externos (VIP/Coleta/eventos, fora do save): `Sys.loot.params.mult.{gold,gems,item,forge,food}`, `params.offlineMult`, `params.offlineCapHours`.

## Pendências / dúvidas
- Ícones dos pickups `forge`, `food` e `egg` (e do ovo por raridade): arte da fps-ff.
- `maybeDrop` atual troca a arma equipada se o item for mais forte: com o nível no espaço, a comparação continua valendo (é do engenheiro).

## v0.12.0 — corte de 💎 (APLICADO, aprovado pelo PO) e Divino/XP v9 (atrás de chave)
- Corte de 💎 (meta ~10 mil em 180 dias): inimigo comum 1,5% → **0,5%** (Sys.loot); baú 25% → **15%** de 2-5 (Sys.chest); Caverna de Cristal (6 + 2·era) → **3 fixos** × dificuldade;
  Chefe de Era instância 5 → **0** × dificuldade (Sys.instances); diárias **2 cada + bônus 5** (era 3-5 + 15); semanais **8·8·8·6·6 = 36** (era 90) (Sys.pass);
  login dias 2/5/7 → **10·10·10 = 30/semana** (era 10·15·20) (Sys.login); guia ~205 → **~140** na fila de hoje (+10 da instância) (Sys.guide). Fase vencida (battle.js) igual.
- DIVINO (r5): liga só com Sys.stats.maxR() ≥ 5 (setEra9 da fps-e2). Peso 0,05 × (1 + 0,12·era); portão nível 105 + era 7 (gates[5]). Fora da invocação.
- XP do abate com Sys.level.DATA.v9.on: orbes em Lv.addXp(S, n, host, 'kill') (teto diário); a parte EXTRA do retorno (×2) em outra chamada sem src.
  Subidas das duas chamadas viram um aviso só (res.levelUp). Desligado: igual a antes. Testes: test/sys/loot-v9.test.js (6).
## Dificuldades (Fácil/Médio/Difícil/Hell, 100 fases por era) — atrás de `Sys.loot.DATA.diff.on = false` (proposta da fps-e2, progressao-9-eras.md §R2.5)
- Dificuldade d = 0..3 vem de `enemy.diff` ou `host.diff()`. Ouro, forja, ração e Essência ×1 / 1,6 / 2,5 / 4. **XP não multiplica.**
- Raridade-teto do portão: a chance de o item sair no teto vira ×1 / 1,3 / 1,7 / 2,2 (no máximo 95%; nunca acima do portão).
- Qualidade (com `Sys.stats.DATA.quality.on`): melhor de 1 / 1 / 2 / 3 sorteios (drop grátis).
- `Sys.loot.stageWin(S, host, {era, diff, stage})`, chamada pelo jogo ao vencer uma fase (decisão do PO: sem frações; 💎 só em marcos, valores inteiros).
  Devolve `{first, kind, gems, gold, xp, golem}` para a tela. Só a 1ª vitória de cada fase paga; repetir a fase não dá nada daqui.

  | Marco | Fácil | Médio | Difícil | Hell |
  |---|---|---|---|---|
  | Fase comum | 0 💎 · ouro 5× · XP 3× | 0 💎 | 0 💎 | 0 💎 |
  | A cada 10 fases (10-40, 60-90) | 2 💎 | 3 💎 | 4 💎 | 6 💎 + 1 golem |
  | Chefe da fase 50 | 4 💎 | 6 💎 | 8 💎 | 12 💎 + 1 golem |
  | Senhor da fase 100 | 5 💎 | 8 💎 | 10 💎 | 15 💎 + 1 golem |
  | **Total por era** | **25** | **38** | **50** | **75** (+10 golem) |

  Ouro e XP de um abate como unidade: ouro 5 / 10 / 20 / 30 × o ouro de um abate × a dificuldade (×1 / 1,6 / 2,5 / 4); XP 3 / 5 / 10 / 15 × a XP de um abate
  (comum / a cada 10 / chefe / Senhor), sem multiplicar pela dificuldade e indo como 'kill' (teto diário).
  Dificuldades exigidas em 180 dias: 9·25 + 7·38 + 5·50 + 2·75 = **891 💎**, o mesmo orçamento da fase vencida antiga, que tem de sair com a estrutura nova.
- Chefe de fase (onda 5), com a chave ligada: só paga como chefe nas fases 50 e 100 de cada era e dificuldade; nas outras paga como inimigo comum.
  Sem isso, 100 chefes por era dariam ~10× o ouro, item garantido e a garantia de ovo de chefe. O Senhor da Era não muda.- XP com 100 fases: a fase 100 dá a XP da antiga fase 10 (normalizado), para a XP/dia não mudar. A era vem de `host.stage()` ÷ 100.
- Testes: test/sys/loot-diff.test.js (9).