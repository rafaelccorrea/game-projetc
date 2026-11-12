# Revisão da ligação dos módulos da fps-30 na build atual (só leitura) — 2026-11-12
Lidos: `js/farm.js` (Sys.host, abate, pickups, mochila), `index.html` (passe/missões, loja, invocação), `js/screens.js` (Equipamento, Invocar),
`js/screens2.js` (Passe/Missões), `js/battle.js` (eventos de missão), `js/meta.js` (offline). Nada foi editado.
Ligados: Sys.loot, Sys.chest, Sys.pass (com Sys.level/stats/fc/practice/titles da fps-e2). Não ligados (sem tela aprovada): instâncias, correio, login, eventos.

## Defeitos (por gravidade)
### D1 [ALTO] Item da Temporada do passe nunca evolui — `js/farm.js:11-12` (`normItem`)
`addItemToBag` passa todo item por `normItem`, que reconstrói o objeto só com `{slot, r, e, lvl, gold, subs}`. Isso descarta `season`, `targetR`
e `seasonEnd`, que o `Sys.pass` grava no Item da Temporada (premium, níveis 27 e 30). O `Sys.pass.evolveSeason` procura `item.season` em `host.items()`
e nunca encontra: o prêmio pago fica para sempre na raridade em que foi entregue.
**Correção:** no `normItem`, copiar os campos opcionais quando existirem: `season`, `targetR`, `seasonEnd` (e `look`, para itens transformados).
Ex.: `if (o.season){ x.season = true; x.targetR = o.targetR|0; x.seasonEnd = o.seasonEnd; } if (o.look != null) x.look = o.look|0;`.

### D2 [MÉDIO] `host.sfx` e `host.fmt` estão dentro de um comentário — `js/farm.js:56`
A linha `thumb: it => ..., // marcador provisório em SVG por espaço (URL) sfx: n => snd(n), fmt: n => fmt(n),` deixa `sfx` e `fmt` dentro do `//`.
Efeito: a janela do baú (`Sys.chest.showOpen`) abre sem o som "claim" e mostra o ouro sem formatação ("+123456 🪙" em vez de "+123,4k").
As instâncias e o correio também usam `host.fmt` quando forem ligados.
**Correção:** quebrar a linha: `thumb: ..., /* comentário */` e, numa linha nova, `sfx: n => snd(n), fmt: n => fmt(n),`.

### D3 [BAIXO] Missão "Colete 15 pedras de forja" conta pedras de DESMONTE
O `passSync` (index.html:745-748) usa `Sys.loot.todayCount(S, host, 'forge')`, que soma toda pedra que entrou no dia: drop, chefe, baú, instância
e também desmonte (inclusive o desmonte automático da mochila cheia, farm.js:23). Desmontar 4 Lendárias cumpre a missão.
Funciona como está; decisão do PO se o desmonte deve contar. Se não, eu separo o contador do desmonte no `Sys.loot` (1 linha) e o jogo não muda.

## Observações (sem defeito)
- **Resgate de 1 nível do passe** (`js/screens2.js:160-163`, `pClaimOne`): o jogo simula "os outros já resgatados" e chama `claimAll`. Está correto (o `finally`
  restaura), mas é frágil a mudanças no módulo. Quando o desenvolvimento novo abrir, sugiro eu expor `Sys.pass.claimOne(S, host, trilha, nível)`
  e o jogo trocar a chamada.
- **Comentários desatualizados:** `index.html:660-661` ainda diz que o js/farm.js aplica a garantia a cada `BAL.pullPity` (hoje é o `Sys.loot.summon`,
  como diz o próprio farm.js:17); `js/farm.js:3` ainda lista "NÃO ligados: … 7 espaços", e os 7 espaços já estão ligados.
- **Pickups:** os tipos novos `essence` (Essência da Era) e `egg` caem na cor padrão do `PK_COL` (essence fica branca). Só visual; sugerir uma cor ao ligar a transformação.
- **Offline** (`js/meta.js:91`): `Sys.loot.offline` + `grant` + `Sys.chest.onKills` + `Sys.level.onOffline`, como no roteiro. A ração offline (`Sys.pet.onOffline`)
  e as pedras de prática offline são da fps-e2 e ficam para quando o pet/práticas offline forem ligados.

## Conferido e certo
- Abate da campanha (`farm.js:99-113`): `Sys.loot.onKill` com `{gold, boss, eraBoss, era, stage, x, y}` (sem dobro de ouro), `Sys.chest.onKill` com host,
  pickups e "+N" pelo `createGrouper`, aviso de ovo guardado, level up → `onLevelUp` → `Sys.loot.onLevelUp` (solta ovos de marco, itens do passe e de pacote).
- `Sys.host`: `stage, eraMax, best, level (Sys.level), goldUnit, addGold, addGems, spendGold, addItem, items, addSkin('season'), now, rng, toast, itemName,
  rarName, rarColor, thumb, onChange` — tudo o que os meus módulos pedem (exceto `sfx`/`fmt`, ver D2).
- Baú: `render` 1× no boot com overlay `#app`, `update` no `hudSys`, `onKill` só na campanha.
- Invocação (`screens.js:409-500`): preço, grátis e garantia lidos do `Sys.loot` (`summonCost`, `summonFreeLeft`, `summonOdds`, `ensure(S).summon.pity`);
  `ptrack('summon', n)`; sem sorteio de skin.
- Desmonte manual (`screens.js:400`) e automático na mochila cheia (`farm.js:23`): `Sys.loot.dismantle`, e o jogo remove o item.
- Loja (`index.html:766-768`): estoque montado por `Sys.loot.rollItem({source:'shop', minR})` com rng do dia (vitrine fixa no dia), item inteiro visível, compra direta.
- Nomes dos 5 espaços novos: `Sys.loot.itemName` (index.html:530).
- Passe: migração do passe antigo sem dar premium grátis (`farm.js:81-84`), eventos `kill, boss, ult, upgrade, summon` diretos e `forge, chest` pelo `passSync`.
