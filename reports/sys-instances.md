# Sys.instances (js/sys/instances.js): instâncias diárias por chave (fps-30)
Status: **pronto e testado** (`node test/sys/instances.test.js`: 15 testes). Não está ligado ao jogo (quem liga: engenheiro, fps-c9).
Regras e números: reports/spec-loot-bau-instancias.md, seção 3 (v5.1).

## Regras
- **2 entradas POR ÁREA por dia** (Mina, Arsenal, Chefe de Era, Cristal = 8/dia), **+1 por área com VIP** (`Sys.vip.perks().instanceKeysAdd`; dono via PO,
  substitui as 3 chaves no total). Meia-noite local; não acumulam. A entrada só é gasta na VITÓRIA. Entrada abandonada expira em 15 min sem gastar.
- 3 dificuldades por era liberada (inimigos da fase 3/6/9 daquela era). O jogo sugere a mais alta que o jogador já alcançou.
- **Cadeado por fase (PO):** cada dificuldade só ABRE quando o jogador já alcançou a fase que ela usa: Fácil = fase 3 da era, Normal = 6,
  Difícil = 9. Bloqueada: cadeado e "🔒 Libera na fase X" (start devolve `{ok:false, reason:'bloqueado', unlockAt}`). Usa `host.best()`
  (maior fase alcançada) se o jogo expuser; senão `host.stage()`. **Engenheiro: exponha `host.best = () => S.best`.**
- Ovo da instância vai ao pet com `source:'instance'` (v5.2): se o pet já está em 5★, vira ração (Básico 5 · Raro 8 · Épico 12 ·
  Mítico 15 · Lendário 20, tabela `instanceRepeatFood` do pet.js da fps-e2) e não sobe de raridade. O golem repetido continua dando +5 de fênix.
- Varrer: num nível já vencido, gasta 1 chave e paga na hora (a Mina usa o recorde de abates daquele nível).
- Na instância não há loot normal nem baú (`run.noNormalLoot`, `run.noChest`).

| Instância | Desafio | Tempo | Recompensa (Fácil; Normal ×1,6; Difícil ×2,5) |
|---|---|---|---|
| 🪙 Mina de Ouro | horda sem fim (60% de vida), vale por abate | 45 s | 4 × ouro de um abate por inimigo (vence com ≥ 1 abate) |
| ⚔️ Arsenal | 3 ondas + chefe | 60 s | 3 itens Raro+ (Difícil Épico+) + 20 × ouro + **pedras de forja 3/5/8** |
| 👑 Chefe de Era | Senhor da Era | 45 s | 1 item Épico+ (Difícil Mítico+, que para ARMA vira Épico ou, com a sorte de +1, Lendário) + 5 💎 + 40 × ouro + **ração 5/7/10** + **ovo 15/25/40%** (34/35/18/12/1; Lendário só no Difícil), **no máximo 1 ovo de instância por dia**. Sorte de +1: 30% no Fácil/Normal (na arma, o +1 do Épico daria Mítica e fica Épico: lá a arma só é Lendária pela tabela, ~1%), **10% no Difícil** (~10% das armas Lendárias) |

Ajuste do PO após o teste do QA com o jogador "otimizador" (3 chaves por dia no Chefe Difícil davam ~1,2 ovo/dia e ~30% de armas Lendárias):
teto de 1 ovo de instância por dia (~0,78 ovo/dia no pior caso) e sorte de +1 do Difícil de 30% para 10%.
| 💎 Caverna de Cristal | 4 ondas | 50 s | (6 + 2 por era) 💎 |

## Estado (S.sys.instances)
`{v, day, keys:{gold, gear, boss, gems} /*entradas restantes por área; save antigo (número) vira 2 em cada*/, eggs /*ovos de instância hoje*/, best:{tipo:nível}, bestKills:{'tipo@nível':n}, runs, active:{id,type,level,at}|null}`

## Mudança na API para a tela 13 (entradas por área)
- `Sys.instances.status(S, host)` → `{keys:{gold, gear, boss, gems}, max (por área), total, totalMax, resetMs, best, active}` (antes `keys` era um número).
- `finish`/`sweep` devolvem `keys` = entradas restantes **da área** jogada. `start` recusa com `reason:'chave'` quando a área está zerada (as outras continuam abertas).
- O `render` mostra `🔑 x/2` em cada card e o total no topo. Os inimigos das ondas são os aprovados de cada era (`mkEnemy(run.stage, kind)`, com a era vinda de `run.stage`).

## O que o engenheiro chama e onde
| Quando | Chamada |
|---|---|
| boot | `Sys.instances.ensure(S)` |
| aba/botão "Instâncias" (painel de altura fixa) | `Sys.instances.render(el, S, Sys.host, {onStart: run => entrarNaInstancia(run)})` |
| entrar | o render chama `onStart(run)`; ou `Sys.instances.start(S, host, tipo, nivel)` → `{ok, run}` / `{ok:false, reason:'chave'|'nivel'|'tipo'}` |
| batalha da instância | executar `run`: `run.waves` (lista de ondas; cada inimigo `{kind:'e0'|'e1'|'boss', eraBoss, hpMult, dmgMult}`, criado com `mkEnemy(run.stage, kind)` × multiplicadores; `eraBoss:true` força o Senhor da Era), `run.loop` (Mina: repete a onda), `run.spawnGap`, cronômetro `run.time` s, `run.goal` ('kills'/'clear'/'boss'). Sem `Sys.loot.onKill` nem `Sys.chest.onKill` durante a instância. |
| fim (tempo, vitória ou morte) | `const out = Sys.instances.finish(S, host, run.id, {win, kills})` → `{win, reward:{gold, gems, items, forge, food, egg, hatched, xp, levelUp, released}, keys}`; mostrar `Sys.instances.showResult(#app, out, host)`; voltar à fase normal. Na vitória (e no varrer) já chama `Sys.level.onInstance`: não chame de novo |
| sair no meio | `Sys.instances.abort(S)` (não gasta chave) |
| virada do dia | automática (qualquer chamada com host); explícita: `Sys.instances.onDayChange(S, host)` |
Materiais e ovo saem pelo Sys.loot (`addMat`/`addEgg`: contam na missão do dia e vão para Sys.forge/Sys.pet, ou ficam pendentes).
Parâmetros (VIP/eventos): `Sys.instances.params.extraKeys`, `params.rewardMult`; `DATA.consumeOnFail`.

## Pendências
- A batalha precisa de um "modo instância" (cronômetro, condição de vitória, sair e voltar à campanha): é a maior parte do trabalho e é do engenheiro.
- Tela de seleção (grade 2×2) e janela de resultado: o protótipo final é do PO (fps-98). O render daqui segue o layout da spec e serve até lá.
