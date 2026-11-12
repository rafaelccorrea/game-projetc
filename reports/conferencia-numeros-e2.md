# Conferência de números: telas × módulos da fps-e2 (sem navegador)
fps-e2, 2026-11-12. Pedido da fps-c9 (opção a). Só leitura do código do engenheiro (index.html, js/screens.js, js/screens2.js, js/ui.js,
js/meta.js, js/farm.js, js/battle.js); nada do engenheiro foi editado. A correção feita foi no MEU módulo (js/sys/vip.js, item 1).
Saves: o QA não tinha saves gravados, então montei 2 perfis em Node com o MESMO `Sys.host` do js/farm.js (equipped por S.eq, level do
Sys.level, goldUnit, spend de ouro/diamante):
- **inicial**: fase 8, era 0, jogador Nv 9, sem VIP; arma Rara Nv 6, colete Nv 5, chapéu Nv 1, luvas Raras Nv 2; skins Básicas.
- **avançado**: fase 42, era 4, jogador Nv 72, VIP 6; 7 espaços Nv 45-55 (Raro a Mítico); forja arma +9, colete +9, chapéu +6; práticas
  (Força e Vitalidade 40, demais 20); 7 skins, arma Lendária e roupa Épica equipadas.

## Como a ligação foi feita (conferido no código)
| Ponto | Onde | Resultado |
|---|---|---|
| Atributos do herói = `Sys.fc.stats` (sem fórmula própria) | index.html:615 `heroStats()` | OK |
| Forja NÃO aplicada duas vezes (o stats já inclui) | index.html:615; screens.js:176 usa `forge.mult` só para LISTAR o item | OK |
| Nível real do item na força (teto só para subir) | screens.js:194 `itemLevel(it, plv())` | OK |
| Teto da tela = teto do módulo | screens.js:299 `cap = min(100, nível)` = `Sys.stats.upgradeCap` | OK |
| "Upar até onde o ouro dá" | screens.js:213 `gMaxPlan` soma `Sys.stats.upgradeCost` | OK (mesmos custos) |
| Golpe do herói e DEF do herói | battle.js:241 `Sys.stats.hit`; battle.js:146 DEF pela mesma fórmula | OK |
| Intervalo do básico | battle.js:78 `Sys.stats.interval` | OK |
| `record()` da maior FC da semana | index.html:623 `statsChanged()`; farm.js:29 equipar automático | OK |
| Migração do save | farm.js:65 `Sys.stats.migrateSave(S)` na carga | OK |
| Eventos de abate (pedras de prática, títulos) | farm.js:104-105 | OK |
| Velocidade (x2 VIP ou Nv 15; x4 VIP 5+ e Nv 40) | index.html:705 `Sys.vip.maxSpeed` | OK |
| Desbloqueios e teto das práticas | screens2.js:331-333 `P.DATA.cap`, `Sys.level.unlockLevel` | OK |
| FC recomendada da fase | index.html:620 `REC_FC` = âncoras v7.1 da torre | OK (iguais) |
| Toda referência `Sys.<módulo da fps-e2>.<campo>` do código do engenheiro existe | varredura automática | OK depois da correção do item 1 |

## Valores (as telas leem estas funções; "mostrado" = o que a função devolve no mesmo save)
| Tela → campo | Função | inicial | avançado | Diverge |
|---|---|---|---|---|
| HUD / Equip → FC | `Sys.fc.compute` | 992 | 540,9 mi | não |
| Equip → ATK / HP / DEF | `Sys.fc.stats` | 58 / 550 / 22 | 37,8 mi / 148,6 mi / 11,9 mi | não |
| Equip → crítico / dano crít. / vel. | `Sys.fc.stats` | 14,5% / 100% / 0% | 19,4% / 188% / 29% | não |
| Batalha → intervalo do básico | `Sys.stats.interval` | 0,80 s | 0,62 s | não |
| Equip → arma: próxima melhoria (ouro / diamante) | `canUpgrade` | 43 / 4 | 26.993 / 47 | não |
| Equip → "upar até o meu nível" (até / ouro total) | `planUpgrade` | Nv 9 / 132 | Nv 72 / 522.852 | não |
| Equip → FC do item / "FC no seu nível" | `Sys.fc.itemFC` | 164 / 211 | 329,4 mi / 497,8 mi | não |
| Forja → nível / bônus / chance / teto (arma) | `Sys.forge.*` | +0 / 0% / 100% / +6 (bloqueada) | +9 / 33% / 30% / +12 | não |
| Práticas → teto de nível | `Sys.practice.capOf` | 10 | 50 | não |
| Desbloqueios (pet·prát.·forja·inst.·torre·arena) | `Sys.level.isUnlocked` | sim·sim·não·não·não·não | todos | não |
| VIP → nível / ATK-HP / velocidade / próximo | `Sys.vip.*` | 0 / 0% / x1 / "x2: nível 15 ou VIP" | 6 / +8% / x4 / — | não |
| Skin → total | `Sys.skin.detail` | +5% | +18,5% | não |

## Divergências e problemas encontrados
| # | Gravidade | Onde | O que | Estado |
|---|---|---|---|---|
| 1 | **ALTA (quebrava a tela)** | js/screens.js:563 e :571, Loja → aba Gemas → cartão "Comprar VIP" | A tela lê `Sys.vip.DATA.bonus` e `DATA.perks`, que SUMIRAM quando o VIP passou a ter níveis 1-10 (erro meu: eu tinha dito que era "só acréscimos"). `VD.bonus.atkPct` de undefined = a aba não abria. | **CORRIGIDO no js/sys/vip.js**: `DATA.bonus`/`DATA.perks` voltaram como aliases do VIP 1, com teste de compatibilidade. |
| 1b | média (texto) | mesmo cartão | Com o VIP 1, o texto fica "+5% ATK e HP · +10% XP e ouro · offline x1 · +0 baús por dia · +0 chave". | Sugestão ao engenheiro: montar o texto com `Sys.vip.levelInfo(1)` (ou do nível que a compra dá) e esconder o que é 0. |
| 2 | média | js/meta.js:91 (ganho offline) | Chama `Sys.level.onOffline` (XP), mas NÃO `Sys.practice.onOffline`: o jogador perde as pedras de prática do tempo fora (6/h até 8 h; o dobro com VIP 5+). As práticas já estão ligadas (SYS_E2). | Para o engenheiro: acrescentar `Sys.practice.onOffline(S, Sys.host, t)` ao lado do `Sys.level.onOffline`. (`Sys.pet.onOffline` só quando os pets forem ligados.) |
| 3 | baixa | js/screens.js:394 (`equp`) | Com o item no teto, `planUpgrade` devolve 0 níveis (`reason:'level'`) e o `if(!p.ok&&S.gems<p.gems)` deixa abrir a confirmação "Equipar e upar até o nível N" com 0 níveis e custo 0. | Conferir se o botão some no teto; se não, tratar `p.reason==='level'` antes de abrir. |
| 4 | baixa | js/battle.js:25 `BAL.speedMax:2` | Resto da regra antiga (sem uso; a velocidade vem do `Sys.vip.maxSpeed`). | Pode sair, para ninguém ler o número errado. |
| 5 | info | Sys.vip.DATA.points | Pontos VIP por nível ainda são espaço reservado (o PO traz com o preço real). | Esperado. |

Nada mais diverge: as telas não têm fórmula própria de balanceamento (busquei 1,04 / 1,08 / 0,15 / 3,5 / níveis fixos no código das telas).
Observação sobre a migração: o ouro estimado de item antigo usa a tabela antiga (1,38 por nível), que cresce muito rápido; num item de
nível 50 de era alta o número fica enorme, mas é o que o jogador de fato pagou, e só existe para itens SEM o campo `gold` (o jogo novo grava
`gold:0` em todo item novo, farm.js:12).
