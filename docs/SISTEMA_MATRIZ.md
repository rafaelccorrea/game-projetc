# Matriz: coluna de SISTEMA (Sistemas, 14/11/2026)

Esta é a parte de sistema da matriz da Arte (`docs/ARTE_MATRIZ.md`, regra em `docs/ARTE_PRONTO.md`). Para cada item existente: dados do módulo, textos, nomes de golpe, fontes de drop, chaves e preços, com o que falta e o arquivo:linha.

**Legenda:** ✓ pronto · ✗ falta · ⏸ pronto, mas desligado de propósito (espera voto ou medida).

Ordem: os 3 pets que estão fechando agora. Depois, item por item, na ordem que o PO liberar.

---

## Pets: Lobo sombrio · Falcão de guerra · Pantera espectral

| Linha | Lobo sombrio (`shadowwolf`) | Falcão de guerra (`falcon`) | Pantera espectral (`panther`) |
|---|---|---|---|
| Dados no módulo (raridade, tipo, golpe, fragmentos para nascer) | ✓ Raro, ataque, `dash`, 60 · `js/sys/pet.js:31` | ✓ Raro, ataque, `ranged`, 60 · `js/sys/pet.js:33` | ✓ Épico, ataque, `blink` com crítico, 100 · `js/sys/pet.js:35` |
| Ligado no módulo | ✓ `newReady.shadowwolf` · `js/sys/pet.js:62` | ✓ `newReady.falcon` · `js/sys/pet.js:62` | ✓ `newReady.panther` · `js/sys/pet.js:62` |
| Batalha (posição, altura, voo, cor, aura por estágio) | ✓ `js/sys/pet.js:408` | ✓ voa 0,15 · `js/sys/pet.js:409` | ✓ `js/sys/pet.js:410` |
| Aura: nada / leve / forte (regra do dono) | ✓ —/aura4/aura7 (f636e23) | ✓ —/aura4/aura7 | ✓ —/aura4/aura7 |
| Nomes dos 3 golpes (básico, crítico, mediano) | ✓ Mordida, Investida sombria, Garra dupla · `js/p_pets.js:51` | ✓ Bicada, Mergulho, Rajada de penas · `js/p_pets.js:52` | ✓ Patada, Bote pelas costas, Sombra veloz · `js/p_pets.js:53` |
| "Como conseguir" (pela fonte real) | ✓ Instância Arsenal ou baús da atividade | ✓ Torre, andar 30, ou missões diárias | ✓ Arena: fim de temporada no Ouro ou acima |
| Fonte de drop programada | ✓ `inst:win` ovo inteiro, 1 por dificuldade · `js/sys/newdrops.js:41`; `activity:full` 2 fragmentos por dia · `:44` | ✓ `tower:floor` andar 30 inteiro · `js/sys/newdrops.js:15`; `missions:daily` 1 por dia · `:45` | ✓ `arena:season` Ouro 15, Platina+ 30 · `js/sys/newdrops.js:20` |
| Fonte chamada pelo jogo | ✓ `js/sys/instances.js:193`, `js/sys/activity.js:54` | ✓ `js/sys/tower.js:180`, `js/sys/pass.js:138` | ✓ `js/sys/arena.js:110` |
| **Entregas ligadas** | ✗ **`Sys.newDrops.DATA.on=false` (`js/sys/newdrops.js:12`): nenhuma fonte entrega. Fora do Modo dono, ninguém consegue os 3 pets.** Liga com voto do dono (vale para todos os itens novos do newdrops) | ✗ idem | ✗ idem |
| Tela de Pets (texto, ordem, folhas) | ✓ Engenheiro f36b825 (`js/p_pets.js:51,58,291`) | ✓ idem | ✓ idem |
| Códex | ✓ id `lobo`, no fim (aeb043a, `js/sys/codex.js:26,30`); tela K_PETS com o Engenheiro | ✓ `falcao` | ✓ `pantera` |
| Arena (bots usam o pet) | ✓ `js/sys/arena.js:149` | ✓ | ✓ |
| Efeito do golpe próprio na batalha | ✗ `fx.hit:'dash'` vem no `battleInfo`, mas ninguém desenha (`js/petfx.js` e `js/battle.js` não leem `fx.hit`); o golpe toca como o genérico | ✗ `'feather'` idem | ✗ `'blink'` (some e reaparece atrás) idem |
| Mecânica do golpe (`skill.id`) | ✗ `dash`: o dano é igual ao golpe comum de propósito (`hits:[1]`); só falta o visual acima | ✗ `ranged` idem | ✗ `blink`: o crítico já é o do pet; falta o visual |
| Folhas de golpe extras (atk2, atk3) | ⏸ só `atk1` nos 3 estágios (`js/p_pets.js:291`): os 3 golpes tocam o atk1, como no Cérbero, Pégaso e Raposa | ⏸ idem | ⏸ idem |
| Preço / venda | ✓ não se vende (sem sorteio pago, sem loja) | ✓ | ✓ |
| Teste | ✓ `test/sys/newpets3.test.js` (6): cada fonte entrega e o pet nasce em 60/60/100; desligado, nada chega | ✓ | ✓ |
| Nome | ⚠ o PO escreveu "Lobo das Sombras"; o módulo diz "Lobo sombrio". Ficou o do módulo até o dono decidir | — | — |

**O que falta, por dono:**
- **Dono:** votar ligar as entregas dos itens novos (`Sys.newDrops.DATA.on`). Sem isso, os 3 pets existem, mas ninguém consegue.
- **Engenheiro:** desenhar o efeito do golpe próprio por `battleInfo().draw.fx.hit` (`dash`, `feather`, `blink`). O padrão serve para os 9 pets novos.
- **Sistemas:** nada (teste das entregas feito: `test/sys/newpets3.test.js`).

---

## Montaria: 6ª e 7ª estrelas (todas as montarias)

| Linha | Estado |
|---|---|
| Módulo | ⏸ `Sys.mount.setStars7(true)`: teto 7, custo 50 e 60 fragmentos, aura 6 (Submundo) e 7 (Celestial); desligado (f636e23, `js/sys/mount.js`). O save guarda até 7 |
| Atributo | ✓ com o `starFlat`: +2 a +3% por estrela (Lendário +3%) |
| Teste | ✓ `test/sys/mount7.test.js` (5) |
| Aura no desenho | ✗ `js/mountfx.js:73` `MOUNT_AURA` tem 6 posições; `:212` e `:225` travam em 5 (Engenheiro; cores propostas: brasa e branco-dourado) |
| Liga quando | depois da medida do Engenheiro, junto com o pacote das últimas eras |

## Aura dos pets (todos os 17)

| Linha | Estado |
|---|---|
| Regra (nada / leve / forte) | ✓ `js/sys/pet.js` `PET_BATTLE` (f636e23); `test/e2e/petaura.js` (79) e `e2.test` ok |
| Arte | ✓ todas existem em `assets/anim/aura` (aura4, aura7, aura10, aura13, aura_evil, aura_holy): nada falta para a Arte |
| Visto na tela | ✗ falta o QA ver |

---

## Arma 1: Clava Básica (`era0_t0`), primeiro item da ARTE_MATRIZ

| Linha | Estado | Onde |
|---|---|---|
| Arte que o sistema lê | ✓ ícone e mão `assets/weapons/era0_t0.png`, grip no `assets/weapons/meta.json`; ultimate `assets/anim/ult/era0_ult` (png + json) | teste |
| Família e golpe | ✓ Clava, corpo a corpo, arte da era 0 | `js/sys/stats.js:36` |
| Ultimate | ✓ folha-base `era0_ult` pronta (Básico a Épico usam a base; Mítico reforça por código; Lendário `club_legend`) | `Sys.stats.ultOf` |
| Efeito por raridade (3 golpes) | ✓ Básico: sem brilho, dano x1 | `Sys.stats.skillFx` |
| Atributo | ✓ ATK principal, cresce com o nível e a Forja; o Básico é o menor das 5 | `Sys.stats.mainOf` |
| Forja +0..+15 | ✓ chance, pedras, teto por era (era 0: +6) | `js/sys/forge.js:14` |
| Aura da Forja | ✓ +4 azul, +7 roxa, +10 chamas, +13 dourada | `js/sys/forge.js:22` |
| Forja +16..+20 | ⏸ `Sys.forge.setForge20(true)`: teto 20 (era 7 +18, era 8 +20), bônus 1,05 a 1,53, chance 5/5/4/4/3, pedras 28 a 45 (números do `balance.json` pacoteFim). Desligado até a medida do Engenheiro. A aura de +16 a +20 fica a dourada por enquanto. **Pendência da ARTE (PO, 14/11): aura própria para +16..+20, entra quando o pacote das últimas eras for ligado** | `js/sys/forge.js:28` |
| Fontes | ✓ arma inicial do jogador · drop da era 0 (Básico é a raridade mais comum) · Invocação (peso 50 de 100) | `index.html:438`, `index.html:314`, `js/sys/loot.js:141` |
| Preço | ✓ não se vende; melhoria só com ouro (`Sys.stats.upgradeCost`) | — |
| Códex | ✓ marca `w-0-0` (Básico e Raro) | `js/sys/codex.js` |
| **Texto (nome)** | ✗ **na tela o item se chama "Graveto Afiado"** (`index.html:352`, `ERAS[0].w[0]`), mas a arte e a família são de clava. Decisão do PO/dono: trocar para "Clava Básica"/outro nome, ou manter | `index.html:352` |
| Teste | ✓ `test/sys/item-era0_t0.test.js` (9): arte no disco, família, ultimate, efeito, atributo, Forja hoje e +16..+20, aura, fontes, Códex, nome | — |

**Do lado de sistema, a Clava Básica fecha com 1 decisão pendente: o nome.** O resto da linha (N1 telas montadas e N3 conferência na tela) é do Engenheiro e do QA, como a Arte anotou.

## Arma 2: Clava Rara (`era0_raro`)

Igual à Básica em Forja, aura e ultimate (folha-base `era0_ult`). Teste: `test/sys/item-armas.test.js` (o mesmo arquivo segue para as próximas armas).

| Linha | Estado |
|---|---|
| Arte que o sistema lê | ✓ `assets/weapons/era0_raro.png` + grip |
| Família / ultimate | ✓ Clava / base `era0_ult` |
| Efeito Raro | ✓ brilho 1, partículas ×1,1, dano igual |
| Atributo | ✓ acima do Básico; 1 secundário |
| Fontes | ✓ drop da era 0 (22% das quedas) · Invocação (peso 28) |
| Códex | ✓ `w-0-0` (o Códex junta Básico e Raro numa casa) |
| Nome na tela | ✓ "Clava de Pedra" (`index.html:352`), bate com a arte |

**Fechada do lado de sistema, sem pendência.**

## Arma 3: Clava Épica (`era0_t1`)

| Linha | Estado |
|---|---|
| Arte que o sistema lê | ✓ `assets/weapons/era0_t1.png` + grip |
| Família / ultimate | ✓ Clava / base `era0_ult` |
| Efeito Épico | ✓ brilho 1, partículas ×1,25, dano igual |
| Atributo | ✓ acima do Raro; 2 secundários |
| Fontes | ✓ drop da era 0 (6% das quedas, mais o que seria Mítico: a arma Mítica vira Épica no lançamento, `js/sys/loot.js:36`) · Invocação (peso 14) |
| Códex | ✓ `w-0-1` (junta Épico e Mítico) |
| **Nome na tela** | ✗ **"Lança de Sílex"** (`index.html:352`), mas a arte é de clava. Mesma decisão do nome da Básica |

**Fechada do lado de sistema, com 1 pendência: o nome.**

## Arma 4: Clava Mítica (`era0_mitico`)

| Linha | Estado |
|---|---|
| Arte que o sistema lê | ✓ `assets/weapons/era0_mitico.png` + grip |
| Família / ultimate | ✓ Clava / base `era0_ult` reforçada por código (tamanho ×1,25, brilho, partículas ×1,5, anel) |
| Efeito Mítico | ✓ brilho 2, partículas ×1,45, dano igual |
| Atributo | ✓ acima do Épico; 2 secundários |
| **Fontes** | ⏸ **bloqueada pela regra do lançamento** (`js/sys/loot.js:36-38`, `launch.noMythicWeapon:true`): todo sorteio de arma Mítica vira Épica (drop, baú, instância, Invocação). Hoje ninguém consegue a Clava Mítica. Decisão do dono: liberar a arma Mítica (muda para todas as 9 eras), ou a linha fica ⏸ |
| Códex | ✓ `w-0-1` (a casa é alcançável pela Épica, então o Códex não trava) |
| **Nome na tela** | ✗ **"Machado de Osso"** (`index.html:352`), com arte de clava. Mesma decisão de nome |

**Do lado de sistema: pronta, mas ⏸ (o dono decide liberar a arma Mítica) e com o nome pendente.** Teste: `test/sys/item-armas.test.js` (29), com a regra do lançamento conferida nos dois estados.

## Arma 5: Clava Lendária (`era0_t2`)

| Linha | Estado |
|---|---|
| Arte que o sistema lê | ✓ `assets/weapons/era0_t2.png` + grip |
| Família / ultimate | ✓ Clava / **própria** `assets/anim/ult/club_legend` (png + json). Ligada no boot do jogo: `js/battle.js:510` chama `Sys.stats.goLive('ults')` (a clava está em `ownApproved` e `ownDelivered`, `js/sys/stats.js:56,60`). O Modo dono desliga pelo botão "Ultimates lendárias" |
| Efeito Lendário | ✓ brilho 3, partículas ×1,7, dano igual |
| Atributo | ✓ acima do Mítico; 2 secundários |
| Fontes | ✓ drop da era 0 (0,4% das quedas) · Invocação (peso 2) · respeita o portão de raridade por nível e era (`Sys.loot.maxAllowedR`) |
| Códex | ✓ `w-0-2` |
| Nome na tela | ⚠ "Presa de Mamute" (`index.html:352`): uma presa usada como clava; entra na mesma conversa dos nomes |

**Fechada do lado de sistema.** O nome só precisa de confirmação, junto com os outros. Teste: `test/sys/item-armas.test.js` (36).

### Resumo da família Clava (itens 1 a 5)
- Sistema pronto nas 5. Uma decisão de texto: os nomes da era 0 são de armas diferentes (Graveto, Clava, Lança, Machado, Presa), mas a arte das 5 é de clava.
- Uma decisão de jogo: a arma Mítica (item 4) não existe no lançamento.

## Itens 6 a 10: Gládio da era 1 (Básico, Raro, Épico, Mítico, Lendário), adiantado

Abre oficialmente só depois que a Clava Básica fechar com o QA (PO, 14/11). Teste: `test/sys/item-armas.test.js` (71, com as 10 armas).

| Linha | Estado |
|---|---|
| Arte que o sistema lê | ✓ `assets/weapons/era1_{t0,raro,t1,mitico,t2}.png` + grip nas 5 |
| Família / ultimate | ✓ Gládio (corpo a corpo) / base `era1_ult` (Básico a Épico), base reforçada (Mítico), **própria `gladius_legend`** (Lendário, ligada no boot) |
| Efeito por raridade | ✓ nas 5, dano igual |
| Atributo | ✓ cresce com a raridade (0/1/2/2/2 secundários) |
| Fontes | ✓ drop da era 1 e Invocação; ⏸ Mítico bloqueado pela regra do lançamento (mesma decisão da Clava Mítica) |
| Códex | ✓ `w-1-0`, `w-1-1`, `w-1-2` |
| Nomes na tela (`index.html:359`) | ⚠ Básico **"Lança de Bronze"** com arte de gládio (mesma conversa dos nomes); Raro "Gládio" ✓; Épico "Falcata de Ferro" ✓ (espada curta); Mítico "Xifos Espartano" ✓; Lendário "Lâmina de Aquiles" ✓ |

**Do lado de sistema: pronto.** Pendências: o nome do Básico e a arma Mítica (decisões do dono).

## Itens 16 a 68: armas das eras 2 a 8 (adiantado)

Teste: `test/sys/item-armas.test.js` (306 verificações, as 45 armas). Em todas: arte no disco com grip, família certa, ultimate da era pronta (Básico a Épico base, Mítico base reforçada, Lendário com a folha própria da família ligada no boot), efeito por raridade, atributo crescente, drop e Invocação.

| Família (era) | Ultimate própria do Lendário | Pendências de sistema |
|---|---|---|
| Espada (2) | ✓ `sword_legend` | Mítico ⏸ (regra do lançamento) |
| Pederneira (3), pistola | ✓ `flintlock_legend` | Mítico ⏸; nomes de arma longa com arte de pistola: "Mosquete", "Arcabuz Raro" (conferir com a Arte) |
| Revólver (4) | ✓ `revolver_legend` | Mítico ⏸; nomes de outras armas: "Rifle de Repetição", "Carabina", "Metralhadora Gatling", "Canhão de Tesla" (conferir com a Arte) |
| Fuzil (5) | ✓ `rifle_legend` | Mítico ⏸; Básico "Pistola 9mm" com arte de fuzil; "Minigun", "Railgun" (conferir) |
| Plasma (6) | ✓ `plasma_legend` | Mítico ⏸; **nome contra o estilo**: Raro "Espada de Plasma" ATIRA (`gunAtR0`), Épico "Rifle de Íons" e Mítico "Canhão de Antimatéria" são LÂMINA |
| Infernal (7) | ✓ `infernal_legend` | Mítico ⏸; **Códex não tem a era 7** |
| Celeste (8) | ✓ `celestial_legend` | Mítico ⏸; Básico "Lança de Luz" (conferir com a arte); **Códex não tem a era 8** |

**Lacuna de sistema encontrada: o Códex só cobre 7 eras.** `js/sys/codex.js:23` tem `eras:7`, e a tela usa `Math.min(7, ERAS.length)` (`js/p_codex.js:56`). As armas e armaduras das eras 7 e 8 nunca entram na coleção. Proposta (Sistemas + Engenheiro): com as eras 7-8 ligadas, `eras:9`, com +6 casas de arma e +12 de armadura (os "melhores inimigos" das eras 7-8 também, +6). Muda o total do Códex; os marcos já resgatados ficam.

## Fogueira P1 e Ladrão de Brasas (LoM, aprovado pelo dono)

Origem: `docs/LOM_VS_EONBOUND.md` seç. 5 (itens 2, 3 e 5). Números do Ladrão e do offline = contrato do servidor (fps-6f). Nada à venda, sem sorteio pago.

| Sistema | O que faz | Chave | Teste |
|---|---|---|---|
| `Sys.bonfire` (Fogueira das Eras) | **Lote por nível**: `tap(S,host)` forja até `perTap(nível)` peças, 1 Brasa cada (1-3 = 1, 4-6 = 2, 7-9 = 4, 10-19 = 5, 20-34 = 6, 35-49 = 8, 50-60 = 10). **Estoque à vista** no `view` (`stock`, `max`, `pot`, `perTap`, `nextTap`, `unlock` = o que o próximo nível abre). **Só abate novo** enche o pote: `addBrasas(S,'kill',n,{stage,maxStage})` (fase abaixo da maior já alcançada não conta; `best` guardado). **Offline**: `offline(S,host,segundos)` = 1 Brasa a cada 18 min, até 12 h por volta e 40 por dia de Brasília (`S.sys.bonfire.off = {day, n}`), resumo para o painel "Enquanto você esteve fora". Fonte nova `'thief'`. Toda fonte soma em `got` | `DATA.on:false` | `test/sys/bonfire.test.js` (20) |
| `Sys.thief` (Ladrão de Brasas) | Instância diária: 2 entradas grátis por dia (Brasília), 45 s; prêmio = até 1 lote pelo nível da Fogueira, `finish {score 0..1}` (arredonda; score 1 vence o nível); **Repetir** (`sweep`) dá o lote cheio do melhor nível vencido e gasta 1 entrada. Brasas por `Sys.bonfire.addBrasas(S,'thief',n)` | `DATA.on:false` (precisa também do `Sys.bonfire` ligado) | `test/sys/thief.test.js` (8) |

Falta do Engenheiro: carregar `js/sys/thief.js` na lista de módulos; passar `{stage,maxStage}` no `fogBrasa('kill')` do `js/farm.js`; chamar `Sys.bonfire.offline` uma vez na volta ao jogo e preencher `gold/xp/items/stones` do resumo com o offline que já existe; tela do Ladrão.

---

## Propostas do LoM aprovadas pelo dono: Golpes especiais nos itens · Grimório das Eras (Sistemas, 13/11)

Origem: `docs/LOM_VS_EONBOUND.md` §5 itens 1 e 4, §4 B1 e B7. Explicação para o dono: `docs/PROPOSTA_GOLPES_GRIMORIO.md`. **As duas chaves estão DESLIGADAS**; desligadas, o jogo fica byte a byte igual (drop, FC e batalha, com teste).

### Golpes especiais (`js/sys/strikes.js`, `Sys.strikes`)

| Linha | Estado |
|---|---|
| O que é | 5 golpes que vêm no item e aparecem com nome na luta: **COMBO**, **CONTRA-ATAQUE**, **ATORDOADO**, **ESQUIVA**, **ROUBO DE VIDA** (cor fixa em `DATA.color`) |
| Chave | ⏸ `Sys.strikes.DATA.on=false` · liga com `Sys.strikes.setOn(true)` |
| Formato no item | `it.stk=[{k,q}]` (igual aos secundários). Básico 0, Raro/Épico/Mítico 1, Lendário/Divino 2. Lista por espaço em `DATA.pool` |
| Quem sorteia | ✓ `Sys.loot.rollItem` e `makeFixedItem` chamam `stkTag` (só ligado; desligado não gasta sorte) · `itemOut` leva o `stk` para o inventário · item antigo: `ensureItem` gera com semente pelo id |
| Valor | `(mín + q·(máx−mín)) × raridade × (1 + 0,12·era)`; faixa da Rara: Combo 3-6%, Contra 3-6%, Atordoar 1-2%, Esquiva 1,5-3%, Roubo 1-2,5% |
| Tetos | Normal: Combo 50, Contra 50, Atordoar 20, Esquiva 30, Roubo 20 · **Chefe/Senhor/Arena**: Atordoar 10 (0,5 s, imune 4 s), Esquiva 20, Roubo 10 |
| FC | ✓ só ligado: `Sys.fc.stats` põe `strikes` e `Sys.fc.parts` multiplica a parte de ATQ por `1 + 0,4·combo + 0,25·contra + 0,5·atordoar` e a de Vida por `1/(1−esquiva) × (1 + 1,5·roubo)` |
| Testes | `test/sys/strikes.test.js` (10): desligado = drop e FC idênticos com e sem o módulo; sorteio por espaço/raridade; tetos; resolvedores; FC sobe ligado |

**O que o Engenheiro chama (na batalha, quando ligar):**
1. `const P=Sys.strikes.profile(S,host)` ao entrar na luta e a cada troca de item.
2. A cada golpe do herói que acerta: `const r=Sys.strikes.onHeroHit(S,{profile:P,kind:'s1'|'s2'|'s3',dmg,boss,pvp,isCombo,now,immuneUntil:inimigo.imune},rng)`.
   `r.combo` → mais um golpe de `r.comboMult` (50%) do básico com `isCombo:true` · `r.stun` → inimigo parado `r.stunSec` s e `inimigo.imune=r.immuneUntil` · `r.lifesteal` → cura essa vida.
3. Quando o herói vai apanhar: `const h=Sys.strikes.onHeroHurt(S,{profile:P,dmg,boss,pvp},rng)` → usar `h.dmg` (0 na esquiva); `h.counter` → golpe de `h.counterMult` (60%) do básico.
4. Mostrar cada `r.labels`/`h.labels` (`{text, color}`) com o `floatText` (B1). Na tela do item: `Sys.strikes.describe(item)` → `[{text:'Combo +3,2%', color}]`.
5. Carregar `js/sys/strikes.js` depois de `stats.js` e antes de `loot.js`/`fc.js` serem usados. Desligado, todos os resolvedores devolvem "nada" sem gastar sorte.

### Grimório das Eras (`js/sys/grimoire.js`, `Sys.grimoire`)

| Linha | Estado |
|---|---|
| O que é | 18 magias (2 por era), 3 equipadas lançando sozinhas com recarga; cada magia aprendida dá bônus permanente pequeno; conjuntos Fases / Arena / Chefe |
| Chave | ⏸ `Sys.grimoire.DATA.on=false` · `setOn(true)` |
| Aprender | 1ª magia da era = 1ª vitória sobre o Senhor da Era · 2ª = 1ª vitória sobre o chefe da fase 50 da era |
| Subir (1 → 10) | páginas repetidas da mesma magia (1,2,3,4,5,6,8,10,12) + tinta (10 … 320). Fontes FIXAS em `DATA.grants`; loja/diamante/oferta/pacote **recusados** (`DATA.forbidden`) |
| Efeito | dano ≤ 3× o ATQ no total (regra de coerência, como o s2), +4%/nível até o teto; cura/escudo/bônus +4%/nível; recarga −2%/nível |
| Bônus por ter | ATQ/Vida +0,4% (+0,08/nível), DEF +0,3%, Crítico +0,2 pt. As 18 no nível 10: ATQ +6,7%, Vida +6,7%, DEF +2,5%, Crítico +1,7 pt (FC ~+7%, só depois de muito jogo). Entra sozinho na FC (`bonus(S)`), zero desligado |
| Testes | `test/sys/grimoire.test.js` (11): catálogo, coerência de dano, desligado = FC igual, aprender, teto diário, sem compra, níveis, bônus, conjuntos, save torto, view |

**O que o Engenheiro chama:**
1. Carregar `js/sys/grimoire.js` (o `Sys.fc` soma o `bonus` sozinho).
2. Vitórias: `Sys.grimoire.grant(S,host,'eraLord',{era})` (1ª do Senhor), `'eraLordRepeat'` (de novo), `'chief50'` (1ª do chefe da fase 50), `'instance'` (cada instância diária), `'tower'` (a cada 10 andares), `'daily'` (missões), `'event',{id}` (prêmio fixo de evento).
3. Batalha: `Sys.grimoire.loadout(S, Sys.grimoire.modeFor({boss,pvp}))` → até 3 `{id,name,cd,effect,text}`; lançar cada uma quando a recarga zerar (ícone com anel de recarga, B7). Atordoar de magia usa a mesma imunidade do `Sys.strikes`.
4. Tela: `Sys.grimoire.view(S,host)` (9 eras × 2, nível, páginas, custo, `canLevel`, bônus, conjuntos) · `levelUp(S,id,host)` · `equip(S,modo,posição,id)` · `setPreset(S,modo,[ids])`.
5. **Falta**: tela do Grimório (protótipo pela Arte/PO antes) e os ícones das 18 magias (Arte).

### Derrota que rende (`js/sys/bossloss.js`, `Sys.bossLoss`)

Item 4 (P1) do `docs/IDLE_PARECIDOS.md`, aprovado pelo dono em 13/11.

| Linha | Estado |
|---|---|
| O que é | Perder para o chefe dá um prêmio pequeno pelo dano feito (ouro, XP e Pedra de Forja) e até 3 dicas grátis com botão Ir. **Nunca** oferta paga nessa tela |
| Chave | ⏸ `Sys.bossLoss.DATA.on=false` · liga com `Sys.bossLoss.setOn(true)`. Desligado: devolve `{on:false,...}`, não credita e não mexe no save |
| Conta | prêmio = vitória × 30% × fração da vida tirada × redutor do dia. Vitória (ouro) = 4 × 1,15^(fase−1) × 5 (a mesma do `mkEnemy` do js/battle.js e do docs/balance.json); vitória (XP) = `Sys.loot.xpFor` de chefe |
| Pedra de Forja | 1 (o chefe vencido dá 1-2), só com 50%+ de dano e só na 1ª derrota premiada da fase no dia |
| Contra farm | abaixo de 10% de dano não rende (e não gasta a vez) · por fase e por dia: 1ª 100%, 2ª 50%, 3ª 25%, da 4ª em diante nada (`capped:true`) · no máximo 15 derrotas premiadas por dia. Perder 3 vezes a 99% rende < 0,52 de UMA vitória |
| Nunca | gemas (`reward.gems` sempre 0), loja, oferta, VIP, pacote, invocação, sorteio, baú |
| Dicas | `Sys.advice.all` numa CÓPIA do save (ranking por ganho de FC, a conta do HUD), filtro igual ao `diffAdvice` do js/diff.js (`^(buy|shop|summon)`) + lista proibida (`DATA.forbidden`) + só destinos `gear, forge, pet, mount, titles, hero`. Até 3 |
| Exemplos (60% de dano, 1ª derrota) | fase 5: 6 ouro e 7 XP · fase 10: 12 ouro, 8 XP, 1 pedra · fase 30: 207 ouro, 11 XP · fase 50: 3.392 ouro, 13 XP |
| Save | `S.sys.bossLoss = {v, day, n:{fase:derrotas}, total, gold, xp, stones}` (dia pelo `Sys.clock.dayKey`, como o Sys.loot) |
| Testes | `test/sys/bossloss.test.js` (10): desligado, conta do ouro, proporção e teto de 30%, menos de 10%, 100/50/25/0 e dia seguinte, teto de 15, peek, dicas reais, dicas proibidas filtradas, save torto |

**O que o Engenheiro chama (na Derrota contra o chefe, uma vez):**
1. Carregar `js/sys/bossloss.js` depois de `loot.js`, `level.js`, `forge.js` e `advice.js`.
2. `const r=Sys.bossLoss.onDefeat(S,Sys.host,{stage,dmgDone,bossMaxHp,era,eraBoss})` (`dmgDone` = vida máxima − vida que sobrou no chefe). Já credita: ouro por `host.addGold`, XP por `Sys.level.addXp(S,n,host,'bossLoss')`, pedra por `Sys.forge.addStones`; chama `host.onChange`.
3. Mostrar `r.text` ("Você tirou 62% da vida do chefe."), `r.reward` (`gold`, `xp`, `stones`; zero = não mostrar) e as `r.tips` `[{id,kind,label,gain,gainText,dest,ready}]`: o Ir abre `dest` pela mesma rota do `DIFF_ROUTE` (o filtro de tela existente/trancada continua do lado do Engenheiro).
4. Opcional: `Sys.bossLoss.peek(S,host,opts)` mostra quanto renderia sem creditar (`left` = derrotas premiadas que ainda restam na fase hoje).
5. **Falta**: ligar na tela da Derrota (Engenheiro) e aprovação do dono na tela.

### Fim das 9 eras e pós-eras (`js/sys/erasend.js`, `Sys.erasEnd`)

Tela aprovada: `docs/proto/v2/FimDasEras.html`. Números: `docs/balance.json` blocos `fimDasEras` e `posEras` (o teste confere). A fase 90 é o **fim das 9 eras**, nunca o fim do jogo.

| Linha | Estado |
|---|---|
| O que é | 1) Prêmio do fim das 9 eras (vencer o Juiz Celestial, fase 90), **uma vez por save**: título **Lenda das 9 Eras** (Divino, +3% ATQ e +3% VIDA efetivos, o dobro em destaque), moldura **Nove Eras** e aura **Luz das Eras** (só visuais), **300 diamantes uma vez** e a carta "As 9 eras concluídas: a jornada continua". 2) **Marcos** nas fases 100, 110, 120...: título **Marco N** (+1% ATQ e VIDA efetivos até o 150; do 160 em diante só o nome), 30 diamantes, moldura **Além das Eras** (100) e **Sem Fim** (150), 30 pedras astrais, carta. 3) **Forja Astral** +21..+25 por espaço (bônus 1,65 / 1,77 / 1,89 / 2,01 / 2,13), cada nível só abre ao vencer o marco 100/110/120/130/140 |
| Chave | ⏸ `Sys.erasEnd.DATA.on=false` · liga com `Sys.erasEnd.setOn(true)` (registra os títulos no `Sys.titles`; desligar tira de novo). Desligado: nenhuma função escreve no save, a tabela de títulos e a FC ficam iguais, `forgeMult` = `Sys.forge.mult` |
| Mudança em módulo existente | `js/sys/titles.js`: `addTitle(def)`, `removeTitle(id)`, `grant(S,id,host)` e o tipo de condição `grant` (título que só abre por outro módulo). Ninguém chama com a chave desligada: tabela e save iguais |
| Estado | `S.sys.erasEnd = {final (momento da entrega, 0 = não), marks:[100,...], top (maior fase sem fim já paga em pedras), stones, earned, spent, cos:{owned, eq:{frame, aura}}, lv:{slot:0..5}, pity:{slot}}`. O título fica também no `Sys.titles`; se sumir de lá, `resync` devolve sem pagar de novo |
| Diamantes | Com o `Sys.mail` ligado vão como anexo da carta (vale 3650 dias: prêmio único não se perde; resgate idempotente pela carta). Correio desligado: direto (`Sys.loot.grantBundle` ou `host.addGems`). Carta já enviada nunca paga de novo |
| PROPOSTA (Sistemas, não estava no balance.json) | Forja Astral: chance 3/3/3/2/2% (segue a descida da +16..+20: 5/5/4/4/3), garantia +5 por falha, custo 4/4/5/5/6 pedras astrais por tentativa (~23/23/28/29/35 pedras por nível em média; ~140 por espaço do +21 ao +25). Pedra astral: 3 por fase sem fim vencida pela 1ª vez + 30 por marco = ~60 a cada 10 fases (~2,7 níveis de espaço). Sem ouro, sem loja. Raridade do título de marco: Mítico (100-140), Lendário (150+); ícone único `assets/icons/titles/mark.png` (pedido de Arte) |
| Testes | `test/sys/erasend.test.js` (9): desligado = nada muda; números = balance.json; sem "fim do jogo"; entrega única (direto e pelo correio); marcos; save antigo (`sync`); Forja Astral (base +20, trava por marco, garantia, multiplicador); save torto |

**O que o Engenheiro chama (quando o dono ligar):**
1. Carregar `js/sys/erasend.js` depois de `titles.js`, `forge.js` e `mail.js`; ligar com `Sys.erasEnd.setOn(true)`.
2. Ao carregar o save: `Sys.erasEnd.sync(S,host)` (quem já passou da 90 recebe uma vez o fim das 9 eras e os marcos vencidos; devolve títulos ao `Sys.titles`).
3. **Toda vitória de fase**: `const r=Sys.erasEnd.onStageClear(S,host,fase)` (ignora < 90). Na **fase 90**: `r.final` → abrir `Panels.open('end9',{stage:90, prizes:r.final.prizes, milestone:r.final.milestone, ...})` (o formato `[{title,text}]` e `{stage,rewards}` é o que o `js/p_end9.js` já aceita). Acima da 90: `r.stones` (pedras astrais ganhas), `r.mark` (prêmio do marco: `{stage,title,gems,stones,frame,astralUnlock}`) para o aviso de vitória, e `r.milestone` = próximo marco.
4. Forja: usar `Sys.erasEnd.forgeMult(S,slot)` **no lugar** de `Sys.forge.mult(S,slot)` em `heroStats()` (igual ao de hoje sem nível astral). Tela da Forja: `Sys.erasEnd.view(S,host).astral` (`level`, `astral`, `can:{ok,reason:'base'|'marco'|'pedras'|'max',stones,chance,next,needStage}`), botão → `Sys.erasEnd.astralTry(S,host,slot)`.
5. Perfil/herói: `Sys.erasEnd.cosmetics(S)`, `equip(S,'frame'|'aura',id|null)`, `equipped(S,'frame')` / `equipped(S,'aura')` (só visual: a aura Luz das Eras = contorno dourado e faíscas, como no protótipo).
6. **Falta**: arte da moldura Nove Eras, Além das Eras, Sem Fim, ícones `legend9.png` e `mark.png`; tela da Forja Astral (protótipo pelo PO/Arte); servidor guardar `S.sys.erasEnd` junto com o save.

### Forja presa ao espaço, trocar sem perder e golpe da montaria (`forge.js`, `pet.js`, `mount.js`, `strikes.js`)

Itens 1, 2 e 3 (P1) do `docs/IDLE_PARECIDOS.md`, aprovados pelo dono em 13/11. Testes: `test/sys/idle-parecidos.test.js` (10).

| Item | Estado |
|---|---|
| 1. Forja presa ao espaço | ✅ **já era assim**: o +N mora em `S.sys.forge.lv[espaço]` e o `Sys.stats.itemsTotal` aplica `Sys.forge.mult(S,espaço)` na peça que estiver no espaço; nenhuma peça guarda +N. Sem chave e sem migração (não há o que migrar). Novo: `Sys.forge.slotNote(S,slot)` → `{slot,lv,mult,keeps:true,text}` com a frase do cartão "novo × atual" ("A Forja +5 é do espaço: a peça nova também fica com +5.") |
| 2. Trocar sem perder | ⏸ `Sys.pet.DATA.swapKeep.on=false` e `Sys.mount.DATA.swapKeep.on=false`. Ligado, ao trocar o principal (`equip` ou `swapMain`) o novo fica com o MAIOR investimento: se o antigo tinha mais nível, os dois TROCAM (pet: nível, ração gasta, estágio 17b e barra parcial; montaria: nível e ouro anotado). Soma de tudo igual (nada some, nada duplica); trocar de volta desfaz. Estrelas e fragmentos não passam (são cópias daquele pet/montaria). Pet na v2 (nível do espaço) já não perdia nada: não mexe. Desmontar (`equip(S,null)`) e depois montar outra não transfere (o investimento fica na antiga, nada perdido) |
| 3. Montaria reforça 1 golpe | ⏸ `Sys.mount.DATA.strike.on=false` E `Sys.strikes.DATA.on=false` (precisa das duas). Valor (pontos %) = `perStar[golpe] × estrelas × rarMult[raridade]`: por estrela combo 1,2 · contra 1,2 · atordoar 0,4 · esquiva 0,6 · roubo de vida 0,5; raridade ×0,6/0,8/1/1,2/1,5. Lendário 5★: combo/contra 9 · atordoar 3 · esquiva 4,5 · roubo 3,75. PROPOSTA, o QA calibra. Soma com os itens dentro dos mesmos tetos (normal e chefe/Arena). A montaria NÃO ataca: `bonus()` e `battleInfo()` iguais |
| Tabela golpe | combo: lobo, tigre de cristal, raptor, tigre celestial · contra-ataque: cavalo, unicórnio, mecha · atordoar: escorpião, lobo de gelo, dragão negro · esquiva: pônei, grifo, pantera · roubo de vida: serpe dourada, cavalo infernal, fênix gigante |

**O que o Engenheiro chama/mostra:**
1. Forja: no cartão "novo × atual" mostrar `Sys.forge.slotNote(S,slot).text` (a FC do cartão já conta o +N do espaço na peça nova).
2. Trocar sem perder (quando ligar): o botão Equipar pode continuar chamando `Sys.pet.equip` / `Sys.mount.equip` (já transfere com a chave ligada). Para a confirmação: `Sys.pet.swapPreview(S,id)` / `Sys.mount.swapPreview(S,id)` → `{moved,lvlNew,lvlOld}` ("O nível 40 passa para o Dragão"); ou `swapMain(S,host,id)` → `{ok,from,to,moved,lvl}`. Desligado: `swapMain` = `{ok:false,reason:'off'}`, `swapPreview` = null.
3. Golpe da montaria (quando ligar): na tela da montaria `Sys.mount.strikeInfo(id,estrelas)` → `{k,value,next}` (nome/cor em `Sys.strikes.DATA.name/color[k]`); na batalha nada novo: `Sys.strikes.profile()` já soma, e traz `mount:{id,k,value,name,color}` só quando a montaria soma algo. Recalcular o perfil também ao trocar montaria ou subir estrela.
4. **Falta**: textos na tela (Engenheiro) e decisão do PO para ligar as chaves.

## Perfil V5: sistemas por trás da tela (`js/sys/profile.js`, `Sys.profile`; filtro em `js/sys/name.js`) (Sistemas, 13/11)

Tela aprovada pelo dono: `docs/proto/PerfilV5.html`. Só lógica, sem DOM. **Chave DESLIGADA** (`Sys.profile.DATA.on=false`): nada escreve no save, `view()` devolve `{on:false}`, `equipped()`/`auraFor()` devolvem `null` e o jogo segue como hoje. Estado em `S.sys.profile`. Testes: `test/sys/profile.test.js` (12) e `test/sys/name.test.js` (7, sem mudança).

**O que faz**
1. **Trocar nome** (lápis): 3 a 14 letras ou números, **sem espaço** (regra do protótipo e do `Sys.name`; "Maria Clara" passa no filtro de palavrão, mas o nome é "MariaClara" ou "Maria_Clara"). 1ª troca **grátis**, depois **200 gemas** (moeda do jogo; nunca dinheiro). Espera entre trocas: `DATA.rename.cooldownH` (0, o protótipo não tem). Nome único só o servidor confirma.
2. **Filtro de nome para menores** (`Sys.name`, MODO ESTRITO `check(nome,{strict:true})`): soma ao filtro de sempre a lista `DATA.strict` (mais palavrões/ofensas), `profane(texto)` (ignora acento, l33t 0→o 1→i/l 3→e 4/@→a 5/$→s 7→t, letras repetidas e pontos/espaços/traços entre letras: "p.u.t.a", "p u t a") e `impersonates(texto)` (admin, moderador, suporte, staff, oficial, eonbound, GM, dev, dono...). **Sem `strict` o `check` é o mesmo de antes** (a tela de entrada `js/p_intro.js` não muda; se quiser o filtro novo lá também, passar `strict:true`).
3. **Moldura, aura e retrato**: lista com tem/falta e "como ganhar". Molduras: Simples (inicial), Bronze (nível 10), Prata (nível 30), Ouro (VIP 3, como no protótipo; a tabela do `Sys.vip` marca moldura no VIP 7: decidir qual vale), Cristal (top 10 da Arena), Eterna (Torneio do Poder, por `grant`), Nove Eras / Além das Eras / Sem Fim (lidas de `S.sys.erasEnd.cos.owned`). Auras: Forja +4/+7/+10/+13 da arma, Sagrada/Sombria (asa de anjo/demônio na Forja +10), Luz das Eras (fim das 9 eras). Retratos: o padrão do herói + os das skins que tem (`Sys.appearance.fixedSkins`). Só visual.
4. **FC dos últimos 7 dias**: 1 ponto por dia (a MAIOR amostra do dia; dia de Brasília pelo `Sys.clock.dayKey`, sem ele UTC−3), guarda 7 dias; dia sem amostra vem `fc:null, gap:true`.
5. **Recordes** (só o melhor e a data): fase mais alta, maior FC, andar da Torre, melhor posição/liga/pontos de liga da Arena, maior dano num golpe, melhor sequência sem morrer, mais abates numa sessão, chefe mais rápido (menor tempo vence), mais ouro num dia.

**O que o Engenheiro chama** (carregar `js/sys/name.js` antes de `js/sys/profile.js`)
- Abrir o Perfil: `Sys.profile.sync(S,host)` (puxa fase `S.best`, torre, arena e amostra o FC) e depois `const v=Sys.profile.view(S,host)` → `{name, rename, equipped:{frame,aura,avatar}, frames[], auras[], portraits[], fc:{points[{day,label,fc,gap}],max,min,last,delta}, records[{id,name,text,v,day,info,has}]}`. Cada item de `frames/auras`: `{id,name,r,how,go,owned,cur,need,equipped}`; `go` = tela do botão Ir.
- **Amostrar o FC**: `Sys.profile.sampleFC(S,host)` (ou `sampleFC(S,host,fc)` com o número já calculado) no mesmo lugar onde já chama `Sys.fc.record` (depois de equipar, forjar, treinar, subir pet) e ao abrir o jogo. Barato: guarda só a maior do dia.
- **Recordes** `Sys.profile.record(S,key,valor,host,info)` → `{newRecord, prev, v}`:
  - `hit`: a cada golpe do herói com o dano (info `'Ultimate'`/`'Crítico'`); pode chamar só quando passar do `records` atual, se quiser poupar.
  - `streak`: a cada abate com o contador de abates sem morrer (zera na morte, do lado do jogo).
  - `runKills`: ao fechar a sessão/voltar do segundo plano, com os abates da sessão.
  - `bossTime`: ao vencer um chefe, segundos da luta (info = nome do chefe).
  - `goldDay`: `Sys.profile.addDaily(S,host,'goldDay',n)` em cada ganho de ouro (soma do dia; vira no dia de Brasília).
  - `stage`/`tower`/`arena*`/`fc`: o `sync` e o `sampleFC` já cuidam.
- **Trocar nome**: `Sys.profile.renameQuote(S,host)` para o texto/botão (`free`, `gems`, `canPay`, `text`); no OK `Sys.profile.rename(S,host,nome,{minor})` → `{ok, msg, reason:'nome'|'gemas'|'espera'}`. Grava `S.name`, cobra por `host.spendGems(n)` (sem ele, `S.gems`) e chama `host.onChange`. Com servidor, mandar o nome ao servidor antes (unicidade) e só então chamar `rename`.
- **Equipar** (tocou, trocou): `Sys.profile.equip(S,host,'frame'|'aura'|'avatar',id)` → `{ok}` ou `{ok:false,reason:'falta',how,go}` (mostrar "Como ganhar: " + how). `id=null` volta ao padrão.
- **Desenhar**: `Sys.profile.equipped(S,host)` → `{frame, aura, avatar}`. `aura=null` = o jogador não escolheu: usar a aura de hoje (pelo +N da arma). Moldura em CSS pela raridade `r`.
- **Prêmio de moldura por outro sistema** (Torneio do Poder): `Sys.profile.grant(S,'eterna',host)`.
- **Falta**: a tela (Engenheiro), decidir Ouro = VIP 3 (protótipo) ou VIP 7 (`Sys.vip.DATA.table.frame`), e ligar `DATA.on` com o OK do dono.

## IDLE_PARECIDOS P2: Conjuntos salvos · Dupla das Eras · Fogueira da Guilda (Sistemas, 13/11)

Itens 5, 9 e 10 do `docs/IDLE_PARECIDOS.md` §3, aprovados pelo dono. Os três com chave DESLIGADA. Nada pago, nada sorteado, nenhuma gema.

### 3 conjuntos salvos (`js/sys/loadouts.js`, `Sys.loadouts`)

| Linha | Estado |
|---|---|
| O que é | 3 conjuntos (Fases / Arena / Chefe) com as peças dos 7 espaços (a ASA é a peça do espaço `wing`), o pet e a montaria; troca num toque, grátis e sem limite |
| Magias | NÃO copiadas: o `Sys.grimoire` já guarda um conjunto por modo com os mesmos nomes; a batalha continua lendo `Sys.grimoire.loadout(S,modo)`; o view mostra as magias do modo |
| Chave | ⏸ `Sys.loadouts.DATA.on=false` · `setOn(true)` |
| Regras | `apply` equipa por `host.equip(item)` (o mesmo do jogo e da Fogueira); pula peça que não existe mais (`gone`), espaço que ainda não aceita (`Sys.stats.canEquip`: asa antes do nível = `locked`), pet/montaria que não tem ou trancados; espaço vazio no conjunto NÃO desequipa. Pet/montaria por `Sys.pet.equip`/`Sys.mount.equip` (com o "trocar sem perder" de cada um, se ligado). Opção do jogador `auto` (desligada): `forBattle` troca sozinho antes da luta |
| API | `save(S,modo,host)` · `apply(S,modo,host)` → `{ok,equipped,changes,skipped}` · `plan` (prévia) · `clear` · `modeFor({boss,pvp})` (= Grimório) · `setAuto(S,v)` · `forBattle(S,host,ctx)` · `view(S,host)` (por modo: `saved`, `inUse`, `gear[]`, `pet`, `mount`, `spells`, `missing`) |
| Save | `S.sys.loadouts {v, sets:{modo:{gear:{espaço:id},pet,mount,at}}, cur, auto}` |
| Testes | `test/sys/loadouts.test.js` (8) |
| Servidor | nada (é local; vai no save) |

### Dupla das Eras (`js/sys/duo.js`, `Sys.duo`)

| Linha | Estado |
|---|---|
| O que é | Vincula UM amigo por código de amigo + aceite; meta diária e missões semanais em conjunto; conversa só por FRASES PRONTAS (18, por índice); NENHUMA troca de item ou moeda |
| Chave | ⏸ `Sys.duo.DATA.on=false` · nível 16 (PROPOSTA, igual ao Chat; `Sys.level.DATA.unlock.duo` manda se existir) |
| Convites | código `^[A-Z0-9]{6,10}$` (gerado pelo servidor); vence em 48 h; 5 por dia; até 5 enviados e 10 recebidos; 1 dupla por vez |
| Frases | só índice (não há parâmetro de texto); 1 a cada 5 s, 30 por dia, a mesma no máx. 2 seguidas; o que chega também é só índice |
| Meta diária | "Juntos hoje": os dois entram no dia e somam 300 abates → cada um resgata 30 × ouro de um abate + 1 Pedra de Forja |
| Semanais (soma dos dois) | 200 abates de chefe (120× ouro, 4 pedras) · 40 fases (120×, 4) · 20 vitórias na Arena (80×, 3) · os dois entram em 5 dias (150×, 5) |
| Anti-abuso | sair = 24 h para vincular outro; missão resgatada na semana não volta com parceiro novo; bloquear sai da dupla e impede convites daquele jogador; progresso só conta com dupla |
| API | `status` · `invite(S,host,código,meuCódigo)` · `receiveInvite` · `accept/decline(S,host,id)` · `leave` · `block/unblock` · `phrases()` · `canSend/send(S,host,idx)` · `receive(S,host,idx,at)` · `track(S,host,'kills'/'bossKills'/'stages'/'arenaWins',n)` · `claim(S,host,'daily'/idSemanal)` · `applyServer(S,host,data)` · `setProvider(p)` / `localProvider` · `view` |
| Save | `S.sys.duo` (parceiro, convites, bloqueados, dia, semana, frases, fila `outbox`) |
| Testes | `test/sys/duo.test.js` (11) |

**Servidor (fps-6f) precisa:** código de amigo por jogador (`GET /me/friend-code`) · `POST /duo/invite {code}` (valida nível 16, limites, bloqueio, já em dupla, não a si mesmo) · `GET /duo` → `{partner:{id,name,since,last}|null, partnerDay, partnerWeek, partnerPresent, partnerDays, invites:[{id,name,at}], messages:[{idx,at}]}` (formato do `applyServer`) · `POST /duo/accept/:id`, `/duo/decline/:id`, `/duo/leave` (acaba para os dois; 24 h), `/duo/block/:id` · `POST /duo/phrase {idx}` (só inteiro 0..17, mesmos limites; NUNCA texto) · `POST /duo/progress {kills,bossKills,stages,arenaWins}` (teto por dia contra fraude) · `POST /duo/claim/:id` (confere soma, presença dos dois, 1 resgate por semana por jogador, não por dupla). Nome do parceiro = nome moderado da conta. Depois, um `Sys.duoNet` como o `Sys.guildNet` (provider + refresh).

### Fogueira da Guilda (`js/sys/guildfire.js`, `Sys.guildFire`)

| Linha | Estado |
|---|---|
| O que é | Cada membro faz 1 alimentar GRÁTIS por dia (+10 chamas) e pode dar Brasas suas (1 chama por Brasa, até 20 por dia); a fogueira coletiva sobe de nível (1-10, Faísca … Chama Eterna) |
| Chave | ⏸ `Sys.guildFire.DATA.on=false` · precisa estar numa guilda (`Sys.guild`, só leitura) |
| Níveis | chamas do n ao n+1 = 300 × 1,35^(n−1) (total ≈ 11,9 mil: ~60 dias com 20 membros só no grátis). Sem reset semanal (o doc não pede). No 10: 1 baú a cada 3.000 chamas a mais |
| Baú fixo do nível L | para CADA membro: 40 × L × ouro de um abate, L Pedras de Forja, 10 × L de ração; nunca gema. Só de nível alcançado DEPOIS de entrar na guilda (contra pular de guilda); resgate guardado por guilda |
| Bônus | fora da FC (o único poder de FC da guilda segue o estandarte): ouro +0,5% e XP +0,3% por nível acima do 1 (nível 10 = +4,5% / +2,7%) → `perks(S)`, somado por quem já soma `Sys.guild.perks` |
| Brasas | **gancho que FALTA**: `Sys.bonfire.spendBrasas(S, n, src)` → `true` se gastou (tira de `S.sys.bonfire.bra`; não mexe em `got`). Sem ele, dar Brasas devolve `reason:'hook'` e só o grátis funciona. Pedido à dona do `bonfire.js` |
| API | `status` · `contribute(S,host,n)` (n vazio = grátis; n>0 = Brasas) · `feed` · `chests` · `claim(S,host,id)` · `perks(S)` · `applyServer(S,host,{guildId,flames,free,bra})` · `setProvider` / `localProvider` · `levelOf`, `needOf`, `perksAt`, `chestOf` (regras puras) · `view` |
| Save | `S.sys.guildFire {v, gid, flames, mine, day:{k,free,bra}, claimed:{gid:[...]}, reached:{gid:{nível:ms}}}` |
| Testes | `test/sys/guildfire.test.js` (11) |

**Servidor (fps-6f) precisa:** `POST /guild/fire/feed {kind:'free'/'brasa', n}` → `{flames}` (soma da guilda; 1 grátis por membro por dia de Brasília; Brasas ≤ 20/dia, conferidas com o teto `got` da Fogueira) · `GET /guild/fire` → `{guildId, flames, free, bra}` · registro da hora em que cada nível foi alcançado e do `joinedAt` do membro; baú pelo correio ou `POST /guild/fire/claim/:id` (1 vez por membro por guilda). Sem rota de compra.

### Telas novas necessárias (primeiro em protótipo sobre o HUD real de hoje)

1. **Conjuntos**: 3 abas Fases / Arena / Chefe na tela do herói, com "Salvar o que estou usando", "Usar" e aviso das peças que sumiram; mostra as 3 magias do Grimório do modo; opção "trocar sozinho antes da luta".
2. **Dupla das Eras**: tela da dupla (parceiro, meta de hoje com as duas partes, 4 missões da semana, Resgatar); tela de convite (meu código, digitar código, convites recebidos com Aceitar / Recusar / Bloquear); painel de frases prontas (grade das 18) com o histórico; Sair / Bloquear com confirmação.
3. **Fogueira da Guilda**: aba na tela da guilda com a fogueira (nível, nome, barra), Alimentar (grátis do dia), "Dar Brasas" (1-20), bônus atual e do próximo nível, baús prontos para resgatar.

### Fusão conhecida, ensaio de caminho, Acampamento e afinidade das eras (`fusion.js`, `pathtry.js`, `camp.js`, `affinity.js`)

Itens 11 (P2), 12, 13 e 14 (P3) do `docs/IDLE_PARECIDOS.md`, aprovados pelo dono em 13/11. Tudo DESLIGADO. Números marcados PROPOSTA: o QA calibra. Nenhum sorteio, nada pago com dinheiro (só ouro e materiais do jogo).

| Item | Estado |
|---|---|
| 11. Fusão com resultado conhecido (`Sys.fusion`) | ⏸ `Sys.fusion.DATA.on=false` (`setOn`). A fusão de hoje fica no `Sys.stats.canFuse/fuse` (3 iguais → +1 estrela; já é sem sorte) e **não foi alterada**: o módulo novo embrulha. `preview(S,host,ids,opt)` → `{ok,reason,mode,result,gold,canPay,from,to,keepsEquipped,key,lines}` = o item EXATO (sem ouro mostra o resultado com `reason:'money'`); `apply(S,host,ids,opt,key)` cobra, tira os 3 da mochila, põe o resultado com id novo e mantém equipado; se algo mudou desde a prévia (key diferente) recusa com `'changed'`. `autoPlan(S,host)` = trincas para o VIP autoFuse (nunca o equipado, nunca 5★, ordem fixa, não mexe no save). **PROPOSTA modo `'rarity'`** (chave própria `DATA.rarity.on=false`): 3 do mesmo espaço/era/raridade (arma: mesma família) → 1 da raridade seguinte, **o jogador escolhe** (`opt.pick`) qual dos 3 dá aparência, família, qualidade e secundários; secundário que falta vem de semente fixa pelos ids (prévia = entrega). Teto Mítico (Lendário/Divino só por drop). Custo 5 × custo do Nv 1→2 da raridade nova, só ouro |
| 12. Ensaio de caminho (`Sys.pathTry`) | ⏸ `DATA.on=false`. Nv 30, antes de escolher (`afterChoose:false`). Luta de treino de **60 s** contra o Boneco de Treino (imortal, bate 4% da vida do herói a cada 2 s; herói fica com no mínimo 1 de vida). **Grátis e sem limite**; sem prêmio, XP, ouro, progresso, missão ou energia; bônus só durante o ensaio; o save guarda só vezes e melhor dano/s (`S.sys.pathTry.tried`). PROPOSTA do ensaio (o futuro `Sys.path` manda se existir): Lâmina contra-ataque 8 + roubo de vida 5 · Disparo combo 8 + velocidade 10% · Arcano atordoar 3 + dano crítico 20% |
| 13. Acampamento das Eras (`Sys.camp`) | ⏸ `DATA.on=false`. Abre no Nv 20 (PROPOSTA). 3 tendas: Ouro 40 × `goldUnit`/h · Forja do Acampamento 1 Pedra de Forja/h · Pedreira 2 pedras de prática/h. Teto = horas do offline (8 h grátis; VIP `offlineH` 10/12/14 h, igual ao resto). 1 Ajudante fixo + 2 vagas de **pet parado** por tenda (nunca o principal; +10% × (raridade+1) + 5%/estrela; o pet não muda). Melhoria Nv 1→10 só com ouro (+15%/nível, custo 300 × 1,6^(n−1) × `goldUnit`). Relógio para trás não rende; antes do Nv 20 não acumula. Estado `S.sys.camp = {t, tents:{gold|forge|practice:{lv,pets,acc}}}` |
| 14. Afinidade das eras (`Sys.affinity`) | ⏸ `DATA.on=false` (mult 1, aviso vazio). Estilos Lâmina / Disparo / Arcano. Inimigo fraco: herói ×1,15; resiste: ×0,90; neutro ×1. Tabela (fraco / resiste): Pré-História Lâmina/— · Antiguidade Arcano/Disparo · Medieval Disparo/Arcano · Pólvora Arcano/Lâmina · Industrial Lâmina/Arcano · Moderna Arcano/Lâmina · Futurista Disparo/— · Submundo Disparo/Arcano · Celestial Lâmina/Disparo. Cada estilo é forte em 3 eras; **nenhuma era resiste à arma da própria era**. Estilo do herói: predefinição (`opt.style`) > caminho escolhido > arma equipada (`weaponStyle`: melee = Lâmina, resto = Disparo) |
| Testes | `test/sys/fusion.test.js` (5), `pathtry.test.js` (5), `camp.test.js` (6), `affinity.test.js` (4); todos os test/sys passam |

**O que o Engenheiro chama (quando o dono ligar):**
1. Fusão: carregar `js/sys/fusion.js` depois de `stats.js`. Na tela da Fusão (`js/p_fuse.js` / aba Fundir do `js/p_forge2.js`) trocar a prévia própria por `Sys.fusion.preview(S,Sys.host,ids)` (mostrar `lines` e o item `result` com a FC) e o botão Confirmar por `Sys.fusion.apply(S,Sys.host,ids,null,prévia.key)`; VIP autoFuse (`js/vipauto.js`): usar `Sys.fusion.autoPlan` e `apply` em cada trinca. Modo raridade: `{mode:'rarity',pick:id}` com o jogador tocando no item que quer manter.
2. Ensaio: na escolha do caminho, `Sys.pathTry.view(S,host)` (3 cartões + Testar); Testar → `start(S,host,id)` → abrir a batalha com `r.battle` (respeitar as flags `no*`, boneco imortal, `heroMinHp`, somar `bonus.strikes` no `Sys.strikes` só nessa luta) → no fim `finish(S,host,{damage,sec})` → tela de comparação (`rows`). Sair no meio: `cancel()`.
3. Acampamento: `Sys.camp.collect(S,host)` na volta ao jogo (junto do offline) e no botão Coletar; tela com `view(S,host)`; `assign/unassign` para os pets; `upgrade(S,host,id)`.
4. Afinidade: no `mkEnemy`/dano do herói multiplicar por `Sys.affinity.mult(S,host,fase)`; na tela da fase (antes de lutar) `Sys.affinity.warn(S,host,fase)` → `text` ("Fraco contra: Lâmina"), `tip` e `tone`.

**TELAS NOVAS (primeiro protótipo sobre o HUD real de hoje, aprovação do dono antes do código):**
- Fusão: cartão "Vai sair" com o item exato antes do Confirmar (as 2 telas atuais ganham o cartão); modo raridade: escolher qual dos 3 manter.
- Escolha do caminho no Nv 30: 3 cartões com botão Testar grátis + tela de resultado do ensaio (dano/s dos 3 lado a lado) + faixa "Ensaio · 60 s" na batalha de treino.
- Acampamento das Eras: 3 tendas com barra de enchimento, Coletar, vagas de pet e Melhorar (arte das tendas e do Ajudante: pedido à Arte).
- Aviso "Fraco contra" na tela da fase / antes do chefe (selo com o estilo, verde quando o herói acerta mais, vermelho quando resistem) e tabela na ajuda/Códex.

### Encruzilhada das Eras, Provação do Mestre e Mentores das Eras (`crossroads.js`, `trial.js`, `mentors.js`)

Itens 6, 7 e 8 (P2) do `docs/IDLE_PARECIDOS.md`, aprovados pelo dono. Tudo DESLIGADO (`DATA.on=false`, `setOn`). Números marcados PROPOSTA: o QA calibra. Nada pago, nada sorteado, sem gema, sem energia. Os três expõem `bonus(S)` e o `Sys.fc` soma sozinho (o `fc.js` não foi mexido).

| Item | Estado |
|---|---|
| 6. Encruzilhada das Eras (`Sys.crossroads`) | ⏸ `DATA.on=false`. A cada **10 fases da era** (10, 20 ... 90 na curva de 100 fases do `Sys.phases`; na curva de hoje, 10 fases por era, a **fase 5**; nunca a última fase da era) o jogador escolhe **1 de 2 bênçãos**. Como diz o documento, a bênção vale **até o fim da era atual**: ao chegar à era seguinte as bênçãos apagam. Oferta **determinística por save + fase** (semente no save): sair e voltar mostra as mesmas duas; **não existe rolar de novo**. Escolha definitiva. Pool de 12 (PROPOSTA): ATK +3%, Vida +4%, crítico +1,5, redução de dano +2%, ouro +8%, XP +6%, +1 Brasa por pote (uma vez por era), Combo +4, Contra-ataque +4, Esquiva +2, Atordoar +1,5, Roubo de vida +1,5. Teto: 9 escolhas por era = no máximo +36% numa chave de combate. Encruzilhada aberta e não escolhida espera sem prazo enquanto a era for a atual. Estado `S.sys.crossroads`. |
| 7. Provação do Mestre (`Sys.trial`) | ⏸ `DATA.on=false`. Marcos **Nv 10, 20 ... 90** (110 com o nível máximo 120). **Teto**: o nível não passa do marco até vencer a provação; a XP que sobra fica guardada (até 1 nível) e volta na vitória (`DATA.cap=false` tira o teto e deixa só a luta e o prêmio). Save antigo: o nível nunca desce; o teto é o 1º marco não vencido ≥ nível atual e as provações antigas ficam abertas. Regra fixa em ciclo: Sem pet · Só 30 s · Sem montaria · Sem magias · Metade da vida; luta de 60 s (a de 30 s na regra). Mestre = o **mentor da era** (Nv 10 Nara ... Nv 90 Aurora). Inimigo = chefe da fase mais alta do jogador × Vida 1,2 / dano 1,0. **Tentar de novo grátis e sem limite**; vencer fora do tempo conta como derrota. Prêmio da 1ª vitória (k = 1, 2, 3 ...): **+1% ATK e +1% Vida permanentes**, ouro 60 × k × `goldUnit`, 4 × k pedras de forja, 20 × k ração; **abre funções**: Nv 10 automático da Fogueira (`bonfireAuto`), Nv 30 troca automática de conjunto (`loadoutsAuto`) (PROPOSTA, o PO completa `DATA.opens`). Estado `S.sys.trial`. |
| 8. Mentores das Eras (`Sys.mentors`) | ⏸ `DATA.on=false`. Abre no **Nv 16** (PROPOSTA); cada mentor aparece quando o jogador chega à era dele. 9 mentores: Nara, Pintora das Cavernas (Vida) · Tales, Escriba (crítico) · Bertoldo, Ferreiro (ATK) · Inês, Navegadora (ouro) · Otto, Inventor (redução de dano) · Lia, Aviadora (crítico) · Kira, Engenheira Estelar (ATK) · Caronte, Barqueiro do Submundo (Vida) · Aurora, Astrônoma Celeste (ouro). Presentes: peças da mochila (nunca a equipada nem a trancada no cadeado da Fogueira; sai pelo `host.removeItem`) = 1/2/4/8/16/32 pontos pela raridade, **+50% se a peça for da era do mentor**; pedras de forja 1 ponto a cada 2; ração 1 ponto a cada 10. Marcos 30 / 100 / 250 / 600 / 1200: cada um dá o atributo do mentor (ATK/Vida +0,5/+0,6%, crítico +0,3, defesa +0,4%, ouro +2% por marco), uma **fala da história** (45 falas) e, no marco 5, um **título cosmético** no `Sys.titles` (o atributo vem só daqui, não conta duas vezes). Amizade máxima recusa presente (não gasta peça à toa). Teto dos 9 no máximo: ATK +5%, Vida +6%, crítico +3, defesa +2%, ouro +20%. Estado `S.sys.mentors`. Retratos: `assets/mentors/m<era>.png` (pedido à Arte). |
| Testes | `test/sys/crossroads.test.js` (8), `trial.test.js` (8), `mentors.test.js` (7); todos os test/sys passam |

**O que o Engenheiro chama (quando o dono ligar):**
1. Encruzilhada: carregar `js/sys/crossroads.js` (depois de `phases.js`). Ao **vencer** uma fase: `r=Sys.crossroads.onStage(S,Sys.host,fase)` (fase = número da fase ou `{era,n}` do `Sys.phases`); se `r.due`, abrir a tela com `r.offers` (2 cartões) e no toque `Sys.crossroads.choose(S,fase,id,Sys.host)`. Encruzilhadas que ficaram abertas: `view(S,host).open`. Efeitos fora da FC: `Sys.crossroads.perks(S)` → `xpPct` (somar às fontes de XP), `brasaPot` (+Brasas por pote no `Sys.bonfire`), `strikes` (somar ao perfil do `Sys.strikes`, dentro dos tetos dele).
2. Provação: carregar `js/sys/trial.js` depois de `level.js` e `mentors.js`. **Toda XP** passa antes por `g=Sys.trial.gateXp(S,Sys.host,n)` e só `g.give` vai ao `Sys.level.addXp` (é o teto; desligado devolve `n`). Mostrar o selo com `due(S,host)` (`atCap` = herói parado no teto). Lutar: `s=start(S,host,nivel?)` → abrir a luta com `s.spec` (`sec`, `hpStart`, `noPet`, `noMount`, `noSpells`, mestre, `enemy` = chefe da fase `enemy.stage` × `hpMul`/`dmgMul`) → no fim `finish(S,host,{won,sec})` (devolve prêmio, funções abertas e a XP liberada). Funções presas a provação: `Sys.trial.isOpen(S,'bonfireAuto')` (desligado = sempre aberta).
3. Mentores: carregar `js/sys/mentors.js` depois de `titles.js`, e **ligar a chave antes do primeiro `Sys.titles.ensure` do save** (o `Sys.titles` apaga título que não está na tabela; `setOn(true)` registra os 9 títulos; `sync()` regrava o perdido). Tela: `view(S,host)`; presente: `gift(S,host,era,{items:[ids],stones,food})` → `newMarks` (fala + atributo + título) para a janela de marco; depois `seen(S,era)`.

**TELAS NOVAS (primeiro protótipo sobre o HUD real de hoje, aprovação do dono antes do código):**
- Encruzilhada: janela de escolha depois da vitória (2 cartões de bênção com nome, efeito e "vale até o fim da era"; sem botão de rolar de novo), selo no mapa/HUD para encruzilhada aberta, e lista das bênçãos ativas da era (ex.: no painel da era ou no "Como ficar mais forte").
- Provação do Mestre: selo "Teto Nv 10" na barra de nível quando parado; tela da provação (retrato do mestre, regra, tempo, prêmio e função que abre, botão Lutar grátis); faixa da regra na batalha ("Sem pet · 60 s"); resultado (vitória com prêmio e função aberta / derrota com "Tentar de novo grátis"); lista das provações (vencidas e abertas).
- Mentores das Eras: galeria dos 9 (trancado = silhueta + era), tela do mentor (retrato, barra de amizade, marcos, álbum de falas), escolha de presentes (peças da mochila com o selo "favorito" da era, pedras e ração com quantidade), janela de marco (fala nova + atributo + título). Retratos: pedido à Arte (sem sensualizar, visual maduro).

### Dupla das Eras no servidor (`duonet.js`, `Sys.duoNet`)

Provider de rede do `Sys.duo` pelo contrato `docs/API_SERVIDOR.md` §16.1 (fps-server 81f2662 e 5023345, chave `DUO_ON`). **DESLIGADO** (`Sys.duoNet.DATA.on=false`): nada sai e o `Sys.duo` segue com o provider local. Teste: `test/sys/duonet.test.js` (9, fetch falso atrás do `Sys.net` de verdade).

| Ponto | Como ficou |
|---|---|
| Ligar | `Sys.duo.DATA.on=true`, `Sys.duoNet.DATA.on=true` e, depois do boot online (`Sys.net` com sessão), `Sys.duoNet.start(S,host)`: `GET /v1/duo` → `applyServer` e troca o provider. Falhou (sem rede, `DUO_ON` desligado = 404): fica o local. `refresh(S,host)` ao abrir a tela e de tempos em tempos (manda antes `POST /duo/progress` com os TOTAIS do dia, só se mudou); 404 com o online ligado volta ao local. `stop()` volta ao local. |
| Ações (Promise) | `invite(code)`, `accept(código)`, `decline(código)`, `leave()`, `block(código?)`, `send(idx)`, `claim(id)`, `friendCode()`. O servidor decide primeiro; com o ok dele roda a mesma função síncrona do `Sys.duo` (o provider online só responde ok com essa autorização) e depois o refresh. Erro: `{ok:false, reason, details, retryAfterMs}`. Com o online ligado, `Sys.duo.*` síncrono direto devolve `reason:'online'`: a tela chama o `Sys.duoNet`. |
| Ids | Todo id de rota é o CÓDIGO DE AMIGO (8 caracteres), nunca id interno. |
| Frases | Corpo exatamente `{idx}` (0-17); as regras do `Sys.duo` (5 s, 30/dia, 2 seguidas) são conferidas antes de chamar a rede; não existe parâmetro de texto. |
| Espera de 24 h | Só quem SAIU: `leftAt` 0 do servidor = sem espera (nunca vira "agora"); com `leftAt` o tempo vem do `relinkLeftMs` (imune à diferença de relógio). |
| Resgate | O servidor AUTORIZA (§16.1: soma dos dois, presença, 1 por período) e o `Sys.duo` PAGA uma vez. Sem autorização não paga; 409 `claimed` marca sem pagar; resgates do `GET /duo` (`claimed`) viram resgatados e nunca "desresgatam". `duo.js`: com provider online o `claim` aceita a autorização do servidor mesmo com o espelho local atrasado (`r.server===true`); local continua igual (12 testes). |
| Contadores | `myDay`/`myWeek`/`myDays` do servidor: fica o maior (o teto do dia é o mesmo, `DATA.dayCap`). |

**O que o Engenheiro chama (quando o dono ligar):** carregar `js/sys/duonet.js` depois de `net.js` e `duo.js`; `start` no boot online; a tela da Dupla usa as Promises acima e `Sys.duo.view(S,host)` para desenhar; `Sys.duoNet.state()` traz `code` (o meu código), `invitesLeft`, `msgLeft` e `cap` do servidor.

### Caminho de luta do Nv 30 (`path.js`, `Sys.path`) e Baús de marco do mapa (`mapchest.js`, `Sys.mapChest`)

Regras por trás dos protótipos aprovados pelo dono: `docs/proto/v2/Caminhos.html` e `docs/proto/v2/MapaDasErasV4.html`. As duas chaves **DESLIGADAS** (`DATA.on=false`).

| Ponto | Como ficou |
|---|---|
| Caminho: o que é | 3 caminhos no **Nv 30**: Lâmina, Disparo, Arcano. Não muda corpo nem skin: só golpes especiais e atributos. Números (PROPOSTA, os mesmos do ensaio): **Lâmina** contra-ataque 8 + roubo de vida 5 · **Disparo** combo 8 + velocidade de ataque +10% · **Arcano** atordoar 3 + dano crítico +20%. Os números moram em `Sys.path.DATA.paths`; o `Sys.pathTry` lê de lá (o `DATA.paths` dele ficou só como cópia de reserva). |
| Caminho: escolha e troca | `choose` = primeira escolha, definitiva até uma troca (não gasta a troca). `change` = **1 troca grátis por semana** (semana na segunda-feira pelo `Sys.clock.weekKey`, fuso único do jogo). **Sem troca paga, sem gemas, sem ouro.** Estado `S.sys.path {id, at, wk, changes}` (o mesmo `id` que a afinidade e o ensaio já liam). |
| Caminho: integração | `Sys.strikes.raw/profile` somam `Sys.path.profile(S).strikes` antes dos tetos (igual à montaria; `profile().path` mostra a origem). `Sys.affinity.heroStyle` usa `Sys.path.styleOf(S)` com o caminho ligado. Desligado: perfil, estilo e atributos nulos; strikes, afinidade e ensaio idênticos (teste prova). |
| Baús: o que é | 2 baús por era nas **fases 3 e 7** (curva de 10 fases por era); com o `Sys.phases` ligado (100 fases) viram as **fases 30 e 70 do Fácil** da era. Estados `closed` / `ready` (fase vencida, esperando coleta) / `collected`. **1 vez por save**; a chave no save é era+baú (`S.sys.mapChest.got['era-baú']`), então trocar de curva não reabre nem perde baú. Nunca vendido. |
| Baús: prêmio (PROPOSTA) | Regra do dono: ouro difícil, sempre pouco → ouro em **minutos de abate da fase atual**: `ouro = goldMin × killsPerMin × host.goldUnit()`, com `killsPerMin = 24` (ritmo da build, o mesmo do `Sys.loot`/`Sys.clock`) e `goldMin = 3` nos dois baús (= 72 abates de ouro). Fase 3 (Baú de bronze): ouro de 3 min + **1 pedra de forja**. Fase 7 (Baú de prata): **20 diamantes + 2 pedras de forja** + ouro de 3 min. Os dois números ficam em `Sys.mapChest.DATA` para auditoria. |
| Testes | `test/sys/path.test.js` (6), `test/sys/mapchest.test.js` (5); `pathtry`, `strikes`, `affinity` continuam passando; todos os test/sys passam |

**O que o Engenheiro chama (quando o dono ligar):**
1. Caminho: carregar `js/sys/path.js` antes de `strikes.js`, `affinity.js` e `pathtry.js`. Tela Caminhos: `Sys.path.view(S,host)` → `{unlocked, needLevel, chosen, chosenName, freeLeft, nextFreeChange (ms; 0 = já pode), paid:false, text, paths:[{id,name,desc,strikes,stat,chosen,canChoose,canChange}]}`. Botões: `Sys.path.choose(S,host,id)` / `Sys.path.change(S,host,id)` → `{ok, reason:'off'|'id'|'level'|'chosen'|'none'|'same'|'week', next}`. Depois de escolher/trocar, recalcular o perfil do `Sys.strikes` (como na troca de equipamento). Atributos do caminho em pontos %: `Sys.path.statOf(S)` (`{aspd:10}` ou `{critDmg:20}`) → somar na velocidade de ataque e no dano crítico da batalha (o `Sys.stats` ainda não soma sozinho). Também: `current(S)`, `profile(S)`, `styleOf(S)`.
2. Baús: carregar `js/sys/mapchest.js` depois de `forge.js` e `phases.js`. Mapa: `Sys.mapChest.view(S,host,era)` → `{chests:[{stage, n, name, state, reward:{gold,gems,stones}, text}], ready, readyAll}` (o "!" no botão do mapa = `readyAll`). Toque em baú pronto: `Sys.mapChest.claim(S,host,fase)` (fase = número corrido da curva que vale, ou `{era,slot}`) → `{ok, reason:'off'|'id'|'closed'|'collected', gold, gems, stones}`; credita por `host.addGold`, `host.addGems` e `Sys.forge.addStones`. O host precisa de `goldUnit()` (ouro de um abate da fase atual) e, na curva de hoje, `bestStage()` (maior fase vencida; sem ele vale `stage() − 1`).
