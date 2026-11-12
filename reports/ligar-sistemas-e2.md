# COMO LIGAR cada sistema da fps-e2 (guia para o engenheiro, fps-c8 — BACKLOG_URGENTE, 12/11/2026)
Um bloco por sistema: **chave** → **o que o jogo fornece (host)** → **chamadas** → **como conferir**. Detalhe de cada função: reports/sys-e2-api.md.
Tudo roda sem DOM (o servidor usa o mesmo código). **Prova de que convivem:** `node test/sys/e2-all-on.test.js` liga TODAS as chaves juntas e leva um
jogador do Nv 1 ao fim da era 8 (oferta, montaria, ovo do Nv 20, pet, Kael até lendário, aparência, 100 fases × 4) sem erro, sem NaN, com FC crescente e
save igual ao recarregar. Rode `for f in test/sys/*.test.js; do node $f; done` depois de cada ligação.

**Ordem sugerida** (cada uma = uma versão + APK): 1 Curva de 9 eras → 2 Qualidade/fusão/adormecido → 3 Pets V2 → 4 Montaria + oferta → 5 Aparência + Kael por fase → 6 Prismático.
**Carga:** a lista de `index.html:692` precisa ganhar `'pet','mount','offer','appearance','phases','clock'` (e `events`, `login`, `mail`, `guide` se as telas
usarem) ANTES do `'fc'` (o fc soma o `bonus()` de quem estiver carregado). Ordem segura: `clock, loot, chest, level, stats, skin, vip, forge, pass, practice,
titles, instances, tower, arena, pet, mount, offer, appearance, phases, fc`.

## 1. CURVA DE 9 ERAS (Revisão 2: 100 fases × 4 dificuldades + DEF dos inimigos)
- **Chave (as três juntas, é uma coisa só):** `Sys.level.setV9(true)` · `Sys.stats.setEra9(true)` · `Sys.phases.DATA.on = true`.
- **Na carga (uma vez):** `Sys.phases.migrate(S, host, S.stage)` — eras anteriores vencidas; na era atual o Fácil fica em (fase antiga − 1) × 10.
- **host.eraMax()** passa a devolver `Sys.phases.eraMax(S)` (a era liberada sai das fases vencidas).
- **mkEnemy (js/battle.js):** `const e = Sys.phases.enemy(era, dif, fase, kind==='boss' ? 'boss' : 'common')` → `{hp, dmg, def, kind, name, goldStage, goldMult}`.
  `maxhp = e.hp`, `dmg = e.dmg`, **`def = e.def`** (o `Sys.stats.hit(hero, mult, e.def)` que já existe aplica a DEF), ouro = a fórmula de hoje na fase
  `e.goldStage` × `e.goldMult`. Na fase 50/100 o `'boss'` vira chefe/Senhor (`e.kind`, `e.name`).
- **Ondas:** `Sys.phases.info(e,d,n).shortWave` (eras 0-1) = 1 onda curta (~15-25 s); senão a fase normal de hoje.
- **XP de abate:** `Sys.level.addXp(S, n, host, 'kill')` (teto diário). Prêmio por dificuldade: `Sys.phases.rewardOf(d)` (ouro/materiais, chance da raridade-teto,
  melhor de N na qualidade, 💎 da 1ª vitória; a fps-30 calibra o drop). A XP NÃO multiplica pela dificuldade.
- **Mapa (tela 20):** `Sys.phases.eraView(S, era)` (dificuldades, melhor fase, aberta/feita) · `canChallenge(S, host, e, d, n, fcDoJogador)` →
  `{ok, reason: off|id|era|order|level, needLevel, fcRec, glow}` (glow = botão brilha com 90% da FC recomendada) · ao vencer: `win(S, host, e, d, n)` →
  `{first, next, eraUnlocked, reward}` · `current(S)` = fase onde o jogador parou.
- **Conferir:** era 0 Fácil fase 1 = FC rec. 311, Nv 1; fase 100 = 1.723; a era 1 abre ao vencer a fase 100 do Fácil da era 0.

## 2. QUALIDADE (estrelas do item), FUSÃO e ITEM ADORMECIDO
- **Chaves:** `Sys.stats.DATA.quality.on = true` · `Sys.stats.DATA.futureEra.on = true` (+ `Sys.loot.DATA.futureEra.on` da fps-30, que só sorteia era futura com a trava ligada).
- O drop já sai com `qp` (0-10.000) quando a qualidade está ligada (`Sys.loot`, fps-30). Estrelas: `Sys.stats.qualityStars(item.qp)` (1-5). O atributo já
  usa o qp sozinho (×0,90 a ×1,30).
- **Fusão (no lugar de re-sorteio):** escolher 3 itens iguais (era de poder, espaço, raridade e estrela) → `Sys.stats.canFuse(S, host, [a,b,c])` →
  `{ok, reason: off|count|different|max|money, gold, result, fromStars, toStars, consumed:[ids]}`; confirmar com `Sys.stats.fuse(...)` (cobra o ouro);
  o JOGO tira os 3 da mochila e põe o `result` (id novo; mantém equipado se um deles estava). 5★ não funde.
- **Adormecido:** `Sys.stats.isDormant(item, host)` / `dormantInfo(item, host)` → `{dormant, wakeEra, label:'Adormecido · acorda na era N'}` (selo no cartão);
  o atributo já é o da era liberada +1 e nível 1; subir de nível recusa com `reason:'dormant'`.

## 3. PETS V2 (tela 17b) + ovo do Nv 20
- **Chaves (nesta ordem):** `Sys.pet.DATA.v3 = true` · `Sys.pet.DATA.v20.on = true` · `Sys.pet.setV17(true)`.
- Tela: js/p_pets.js já chama o módulo. **Defeito do feedTap corrigido no módulo** (12/11): o desvio em p_pets.js:31 pode sair.
- **Nv 20:** `Sys.pet.firstEgg(S, host)` (ao chegar no 20 e na carga se já passou) → `{ok, pet, name, odds, hatch, pre}`; `firstEggOdds()` para a tela.
- **Batalha:** `Sys.pet.battleInfo(S, host)` → `{id, name, rarity, stars, level, stage, interval:2, hitMult:2.5, healEvery:11, draw}`;
  `draw = {base, sheets, extra, cell:{512×352, feetY 307, 12 fps}, fly}` → folhas em assets/anim/pets (docs/ARTE_LIGAR.md §2).
- **Conferir:** subir para o Nv 20 → ovo 79% Básico / 21% Raro; o pet aparece atrás do Kael e bate a cada 2 s.

## 4. MONTARIA + OFERTA DE 1ª COMPRA
- **Chaves:** `Sys.mount.DATA.on = true` (atributo) · `Sys.mount.DATA.visual = true` só com a arte aprovada (lobo e grifo prontos) · `Sys.offer.DATA.on = true`.
- **Montaria:** `info(S, host, id)`, `equip(S, id)`, `upgrade(S, host, id, vezes)` (ouro; teto = nível do jogador ÷ 2), `battleInfo(S)` →
  `{id, sprite:'mount_'+id, stars, aura, visual}`. Folhas: assets/anim/mounts (ARTE_LIGAR §8). host precisa de `spendGold/canSpendGold/goldUnit`.
- **Oferta:** `status(S, host)` → `{available, msLeft, reason: done|not_first_purchase|expired, contents}` (tela 22); pagamento confirmado →
  `grant(S, host)` (arma Épica 3★ que acompanha até o Nv 25 + Lobo de guerra + 300 💎 + ouro). **Em QUALQUER compra** chame `Sys.offer.markPurchase(S, host)`.
  Com servidor: `setWindow(S, endsAt)`.
- **Conferir:** save novo → oferta com 24 h; depois de qualquer compra → some (`not_first_purchase`).

## 5. APARÊNCIA EM CAMADAS + KAEL POR FASE
- **Aparência (sem chave, só visual):** `Sys.appearance.layers(S, host)` → lista de baixo para cima `[{layer, key, source, era, r, id}]`
  (asa, corpo, botas, colete, chapéu, óculos, máscara, arma); `setMode(S,'items'|'skin')`, `setLookHidden(S, camada, bool)`, `addCosmetic/equipCosmetic`
  (ids da arte: goggles, visor, ninja, carnival). Desenho: ARTE_LIGAR §3-7.
- **Kael por fase (precisa do v9 ligado):** `Sys.level.stage(S, host)` → `{stage 0-3, id: boy|teen|adult|legend, ready, next}`; com `ready`, tocar a animação
  de evolução e chamar `Sys.level.evolve(S, host)`. A pasta de folhas sai de `Sys.appearance.sheets(S, host)` → `{hero, stage, dir, prefix, masks}`: Kael `R/phase1/phase2/phase3`, Kaia `kaia/kaia_phase1/2/3` (pelo `S.hero` que a intro grava); prefixo `kael_`/`kaia_`.
- **Conferir:** Nv 22 + FC 15 mil → adolescente pronto para evoluir.

## 6. PRISMÁTICO (Raposa de cristal; Revisões 4 e 5)
- **Chave:** `Sys.pet.DATA.v4 = true` (exige v3).
- Fontes: chefe da era 8+ → `Sys.pet.prismBoss(S, host, era)` na VITÓRIA (1 por dia); VIP máximo → automático (`vip.js`); torre (andar 105+, já na torre);
  arena (prêmio semanal, já na arena); evento → `Sys.pet.addFragments(S, 'prism', 100, host)`. Nasce com 1.000 fragmentos; nunca sai de ovo nem da loja.

## 7. GUILDAS (só com servidor)
- **Chave:** `Sys.guild.DATA.on = true`; carregar `'guild'` antes do `'fc'`. Sem servidor a tela mostra "Em breve: abre com o online" (`status(S,host).reason==='server'`).
- **Servidor (fps-6f):** `setProvider(...)` + `applyServer(S, GET /guild/me, host)`; as regras puras de §5l da API valem dos dois lados.
- **XP/ouro/drop dos territórios e estandartes:** a fps-30 lê `Sys.guild.perks(S)` como lê o VIP. ATK/Vida/DEF já entram sozinhos no Sys.fc.

## 8. Liberação por nível
- Fonte única: `Sys.level.DATA.unlock` (o FB_UNLOCK já lê de lá desde a v0.12.4). Trocar o nível de uma função = trocar 1 número lá.
