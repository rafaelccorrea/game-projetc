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
