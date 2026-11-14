# Ligações das telas LoM, prontas para colar (Engenheiro)

Sistemas, 13/11/2026. Ordem do dono via PO: deixar a ligação de cada tela LoM pronta para o Engenheiro colar **assim que o mock for votado**.
Este guia **substitui** a parte "onde chamar" de `docs/LIGACOES_LOM_A.md` e `docs/LIGACOES_LOM_B.md` para as 6 telas abaixo (as regras do jogo continuam lá).
Conferido contra o código de hoje (index.html, js/farm.js, js/onlineboot.js, js/fullbattle.js, js/panels.js, js/screens.js, js/battle.js, js/p_*.js).
Números de linha = os de hoje; arquivos que outras sessões estão mexendo (battle.js) andam: procure pela **âncora** citada.

**Visual de todas as telas: segue o mock da Arte (Higgsfield) votado pelo dono.** Aqui só vão regras, estados, chamadas e textos.

Telas: [1 Relíquias](#1-relíquias-das-eras-sysrelics) · [2 Escavação](#2-escavação-sysdig) · [3 Hoje](#3-hoje--pegar-tudo-systoday) ·
[4 Arena PvP / conjunto](#4-arena-pvp--conjunto-sysarenaset) · [5 Ruínas em Trio](#5-ruínas-em-trio-syscoop--syscoopnet) · [6 Minijogo de evento](#6-minijogo-de-evento-sysminigame--ranking-syseventrank)

---

## 0. O que vale para as 6

### 0.1 Erros que estavam nos guias A e B (corrigidos aqui)

| Onde | Estava | Hoje |
|---|---|---|
| A §0 | "ponha depois de `'grimoire'`" | a lista cresceu: ponha **no fim do 3º array, depois de `'loadouts'`** (antes de `['fc','advice','bossloss']`), `index.html:814` |
| A §4 / `Sys.today` | abas `instances`, `achievements`, `chest`, `bonfire`, `login` | não existiam como tela (o toque não abria nada). O módulo agora usa os nomes reais: `inst`, `missions`, `battle` |
| A §4 | `host.bagFull()` | **não existe** no `Sys.host` (`js/farm.js:55`). Código para colar em 0.3 |
| A §2 | "missões completas → `Sys.dig.grant(S,host,'daily')`" | **sem gancho**: o `Sys.dig` lê sozinho o bônus das diárias do `Sys.pass` (4 lugares resgatam esse bônus; nenhum precisa mudar) |
| B §2 | `paPvPrize` em `js/p_arena.js:608` | está em `js/p_arena.js:613` e **não mostra Brasa** (só `gold`, `gems`, `chest`): código em 4(d) |
| B §4 | "o provider `coopNet` ainda não existe" | existe: `js/sys/coopnet.js` (`Sys.coopNet`), contra as rotas `/coop/*` do servidor (chave `COOP_ON`) |
| B §4 | "grupo mais forte que a mediana vai mais longe" | regra nova (Sistemas, teste do Servidor): inimigo = `max(mediana, média) × 3`; ver 5 |
| B §5 | "ao resgatar carta `eventrank`, chame `grantVisual`" | **sem gancho**: `Sys.eventRank.fromMail` lê as cartas já resgatadas (por qualquer caminho, inclusive "Pegar tudo") |
| B §5 | `GET /events/:id/rank` "pelo `Sys.net._call`" | pronto: `await Sys.eventRank.load(S,host,ev)` |
| A/B | nenhum nível de desbloqueio | proposta em cada bloco (c); o PO confirma |

### 0.2 Carga (index.html, linha 814)

Os módulos já existem em `js/sys/` e nascem **desligados**. Troque, na linha 814, o fim do 3º array:

```
'duo','duonet','guildfire','guildfirenet','loadouts'],['fc','advice','bossloss'])
```
por
```
'duo','duonet','guildfire','guildfirenet','loadouts','relics','dig','today','arenaset','coop','coopnet','minigame','eventrank'],['fc','advice','bossloss'])
```

Regras da ordem: tudo **antes do `'fc'`** (o `Sys.fc` soma o `bonus()` de todo módulo carregado; só o `relics` dá bônus). `today` depois de `relics` e `dig` (lê os dois). `coopnet` depois de `coop`. `eventrank` depois de `events`/`evtrail`/`titles`/`profile` (já carregados antes). Os nomes dos arquivos são todos minúsculos (`arenaset.js`, `coopnet.js`, `eventrank.js`); os nomes no `Sys` são `Sys.relics`, `Sys.dig`, `Sys.today`, `Sys.arenaSet`, `Sys.coop`, `Sys.coopNet`, `Sys.minigame`, `Sys.eventRank`.

Carregados e desligados, nada muda no jogo (provado pela `test/sys` inteira).

### 0.3 `Sys.host` (`js/farm.js:55`): uma função nova

O `Sys.today` (baús de abate) precisa saber se a mochila está cheia. Cole dentro do objeto `Sys.host`, perto de `bagMax`:

```js
  bagFull: () => { try { return (S.inv || []).length >= (typeof xBagMax === 'function' ? xBagMax() : 60); } catch (e) { return false; } },
```

Os outros campos que os módulos usam já existem: `now`, `eraMax`, `level`, `goldUnit`, `addGold`, `onChange`, `toast`, `goTab`.

### 0.4 SYS_LIVE (`js/farm.js:104`)

Chave = o nome no `Sys`. Só entra **depois do voto do dono na tela**, uma por vez, na ordem do bloco (g) de cada tela:

```
relics: true, dig: true, today: true, arenaSet: true, coop: true, coopNet: true, minigame: true, eventRank: true
```

Para conferir sem uma: `?debug=1&sem=dig`.

### 0.5 Tela nova: o molde de hoje

Igual ao `js/p_thief.js` / `js/p_camp.js`:
1. arquivo `js/p_<tela>.js` com `if(!('<tela>' in PANEL_ON)) PANEL_ON.<tela>=false;` e `Panels.add('<tela>',{title, render, click, tick, onOpen, onClose})`;
2. o nome entra na lista de `js/screens.js:1119` (`for(const n of ['avatar',...,'p_shopmecha'])`);
3. item no Menu: `FB_DROP` em `js/fullbattle.js:141-166` com `act:'soon:<tela>'` (o `fbAct` abre o `Screens.reg[<tela>]`; sem tela registrada fica oculto) e o nível em `FB_UNLOCK` (`js/fullbattle.js:173`);
4. o nível também vai para `Sys.level.DATA.unlock` + `unlockName` (`js/sys/level.js:23`). **Hoje outra sessão está no level.js**: a Sistemas põe as chaves quando ele liberar. Enquanto isso o `fbLvU` usa o `FB_UNLOCK` (reserva), então basta o `FB_UNLOCK`;
5. textos de erro: **sempre** `Sys.<mod>.why(r)` (a palavra mora no módulo, `DATA.why`). Nunca escreva o texto do motivo na tela.

### 0.6 Palavra de cada reason (fonte: `DATA.why` de cada módulo)

A tela chama `Sys.<mod>.why(resposta)` (aceita o objeto `{ok:false, reason}` ou a string; `''` quando deu certo; reason desconhecida = "Não deu agora"). As tabelas de cada bloco repetem o texto só para conferência.

---

## 1. Relíquias das Eras (`Sys.relics`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

**(a) index.html** — `'relics'` no 3º array da linha 814 (0.2), antes do `'fc'`.

**(b) SYS_LIVE** — `relics: true`.

**(c) Menu e nível** — `FB_DROP` (`js/fullbattle.js`, depois da linha 159 `grim`):
```js
  { id: 'relics',   icon: 'relic',     label: 'Relíquias',  act: 'soon:relics' },   /* Relíquias das Eras (Sys.relics). Ícone da Arte: assets/icons/menu/relic.png */
```
`FB_UNLOCK`: `relics: 12` (**proposta**, o PO confirma; com a Forja e o Códex. A 1ª relíquia nasce no 1º Senhor da Era). `Sys.level.DATA.unlock.relics = 12`, `unlockName.relics = 'Relíquias'` (Sistemas, quando o level.js liberar).
Selo do Menu: `alerts: () => { try { return Sys.relics.on() ? Sys.relics.view(S, Sys.host).slots.filter(x => x.canLevel || x.canUnlock).length : 0; } catch (e) { return 0; } }`.

**(d) Ganchos**

1. **Senhor da Era** — `js/battle.js:533`, âncora `GRIMÓRIO DAS ERAS`. Na mesma linha, logo depois de `G.grant(S,Sys.host,'eraLord',{era:oldEra});` (dentro do `if(ie===STAGES_PER_ERA)`), troque o bloco por:
```js
    try{ const G=window.Sys&&Sys.grimoire; if(G&&typeof G.grant==='function'){ const ie=((won-1)%STAGES_PER_ERA)+1; if(ie===STAGES_PER_ERA) G.grant(S,Sys.host,'eraLord',{era:oldEra}); else if(ie===Math.round(STAGES_PER_ERA/2)) G.grant(S,Sys.host,'chief50',{era:oldEra}); } }catch(er){ console.error('grimoire',er); }
    /* RELÍQUIAS e ESCAVAÇÃO (Sistemas, chaves desligadas = {ok:false}): no Senhor da Era a relíquia nasce (1ª vez) ou dá 2 fragmentos (1 por dia); a Escavação ganha 1 bomba (1 por era) */
    try{ const ie=((won-1)%STAGES_PER_ERA)+1; if(ie===STAGES_PER_ERA&&window.Sys){ if(Sys.relics) Sys.relics.grant(S,Sys.host,'eraLord',{era:oldEra}); if(Sys.dig) Sys.dig.grant(S,Sys.host,'eraLord',{era:oldEra}); } }catch(er){ console.error('relics/dig',er); }
```
   Mande sempre `'eraLord'`: o módulo decide 1ª vez × repetição.
2. **Torre a cada 10 andares** — `js/p_tower2.js:307` (`r=T.fight(S,host())`). Logo depois da linha:
```js
  try{ if(r&&r.ok&&r.win&&r.floor%10===0&&window.Sys&&Sys.relics) Sys.relics.grant(S,host(),'tower'); }catch(e){}   /* Relíquias: 2 fragmentos a cada 10 andares */
```
   A Torre antiga (`js/p_tower.js:138`, `const r=Sys.tower.fight(S,Sys.host);`) recebe a mesma linha com `Sys.host`, só se ela voltar a ser usada (hoje `tower2:true`).
3. **Correio / Ruínas em Trio**: nada a colar. `att.relicFrags` já entra pelo `Sys.loot.grantBundle` → `Sys.relics.addRelicFrags`; desligado, fica guardado e entra quando ligar.
4. **Sem fluxo no jogo hoje** (não colar nada): Chefe Mundial (`'worldBoss'`), fim da semana da Arena (`'arenaWeek'`, o fechamento é dentro do `Sys.arena`, a Sistemas liga lá), evento (`'event'`). A tela já lista essas fontes.

**(e) Esqueleto da tela**

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.relics.view(S, Sys.host)` | desenhar a grade 3 × 3 | `{on, owned, total, maxLv, bonus, bonusText, loose, paid:false, sources:[texto], slots:[{era, eraName, id, name, desc, owned, lv, max, frags, cost, canLevel, canUnlock, unlockFrags, passiveText, nextText, locked}]}` |
| `Sys.relics.slot(S, Sys.host, id)` | **novo**: a folha de uma relíquia | o slot + `need` (fragmentos que faltam; 0 = pode) + `sources`. `null` = id ruim |
| `Sys.relics.levelUp(S, id, Sys.host)` | botão Subir | `{ok, id, lv, cost}` ou `{ok:false, reason}` |
| `Sys.relics.unlock(S, id, Sys.host)` | botão Despertar (20 fragmentos) | `{ok, id, lv:1, cost}` ou `{ok:false, reason}` |

Estados do cartão: `locked` (era não liberada) = cadeado · `!owned` = silhueta + "Senhor da Era ou 20 fragmentos" e barra `frags/unlockFrags` · `owned` = "Nv lv/10", barra `frags/cost` · `max` = "Nível máximo". Faixa do topo = `bonusText`. Botão dourado acende com `canLevel` (ou `canUnlock`). Nada de compra.
Depois de `levelUp`/`unlock` com `ok`, o módulo já chamou `host.onChange()` (grava e redesenha); mostre "+bônus" com `nextText`.

| reason | quem devolve | a tela mostra |
|---|---|---|
| `off` | todas | Relíquias desligadas |
| `id` | levelUp, unlock | Relíquia não encontrada |
| `owned` | unlock | Já despertada |
| `frags` | levelUp, unlock (traz `cost`/`need`, `have`) | Faltam fragmentos |
| `locked` | levelUp | Ainda não despertada |
| `max` | levelUp | Nível máximo |
| `daily` | grant (Senhor da Era repetido) | Já ganhou hoje |
| `forbidden` / `src` / `era` / `n` | grant, addFragments | Fonte não permitida / Não deu agora |

**(f) Online** — nenhum (tudo local; os fragmentos online chegam pelo correio).

**(g) Ordem para ligar** — 1) carga (0.2) · 2) ganchos (d) com a chave desligada · 3) `js/p_relics.js` + screens.js + `PANEL_ON.relics=false` · 4) Menu + `FB_UNLOCK` · 5) fumaça (h) · 6) voto do dono → `SYS_LIVE.relics` e `PANEL_ON.relics=true`. Ligar **antes** da Escavação e do Hoje (os dois leem as relíquias).

**(h) Fumaça** (console, `?debug=1&painel=relics`):
```js
Sys.relics.setOn(true); Sys.relics.grant(S,Sys.host,'eraLord',{era:0}); Sys.relics.view(S,Sys.host).owned === 1;   // a relíquia da Pré-História nasceu
Sys.relics.levelUp(S,'flintAxe',Sys.host).reason === 'frags'; Sys.relics.why('frags') === 'Faltam fragmentos';
Screens.open('relics');   // grade 3x3, 1 cartão aceso
```
Node: `node test/sys/relics.test.js && node test/sys/lom_telas.test.js`.

---

## 2. Escavação (`Sys.dig`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

**(a) index.html** — `'dig'` no 3º array da linha 814, depois de `'relics'`.

**(b) SYS_LIVE** — `dig: true`.

**(c) Menu e nível** — `FB_DROP`, depois de `relics`:
```js
  { id: 'dig',      icon: 'dig',       label: 'Escavação',  act: 'soon:dig', alerts: () => { try { return Sys.dig.on() ? (Sys.dig.view(S, Sys.host).picks >= 20 ? 1 : 0) : 0; } catch (e) { return 0; } } },   /* selo: picaretas cheias */
```
`FB_UNLOCK`: `dig: 14` (**proposta**, junto das Instâncias). `Sys.level.DATA.unlock.dig = 14`, `unlockName.dig = 'Escavação'` (Sistemas).

**(d) Ganchos**
1. **Senhor da Era → 1 bomba**: já está no bloco colado em 1(d)1 (`Sys.dig.grant(S,Sys.host,'eraLord',{era:oldEra})`).
2. **Missões do dia → +5 picaretas: NADA a colar.** Novo `Sys.dig.syncDaily`: a cada leitura (`view`, `hit`, `picks`...) o módulo olha `Sys.pass.list(S,host).bonus.claimed` e dá as 5 picaretas 1 vez por dia. Vale para os 4 lugares que resgatam o bônus (`js/p_missions.js:87`, `js/p_pass2.js:423`, `js/screens2.js:458`, `js/vipauto.js:144`) e para o "Pegar tudo".
3. **Evento** (`grant(S,host,'event')`): sem fluxo hoje.

**(e) Esqueleto da tela**

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.dig.view(S, Sys.host)` | desenhar (e a cada `tick` de 1 s para o relógio) | `{on, picks, max, nextInMs, bombs, drills, depth, round, era, eraName, maxDepth, atBottom, stairsOpen, cols:5, rows:6, paid:false, got:{stones, frags, layers}, pend:{stones, frags[9]}, cells:[{r, c, open, hp, rock, canDig, item}]}`; `item` só na célula aberta: `{t:'stones',n}` `{t:'frag',era,n}` `{t:'bomb'}` `{t:'drill'}` `{t:'stairs'}` |
| `Sys.dig.nextText(v.nextInMs)` | **novo**: o texto do relógio | `'próxima em 18 min'` / `'próxima em 1 h 30 min'` / `''` (cheia) |
| `Sys.dig.hit(S, Sys.host, r, c)` | toque na célula | `{ok, hp, opened:[[r,c]], stones, frags:[{era,n}], bombs, drills, stairs, picks}` (rocha no 1º toque: `ok` com `hp:1` e `opened:[]` = rachadura) |
| `Sys.dig.bomb(S, Sys.host, r, c)` | modo bomba + toque | igual ao `hit` (sem `hp`/`picks`); abre a célula e as 4 vizinhas |
| `Sys.dig.drill(S, Sys.host, col)` | modo broca + toque na coluna | igual; abre a coluna inteira |
| `Sys.dig.descend(S, Sys.host)` | botão dourado "Descer" (só com `stairsOpen`) | `{ok, depth, round, era}` |

Título: `eraName + ' · camada ' + (depth+1)`. Célula: `canDig` = clara, senão escura; `rock && hp===1` = rachada. "+N" voa com `stones` e `frags` da resposta. Embaixo: `got.stones` pedras e `got.frags` fragmentos (total do save). Nada de compra nem recarga.

| reason | quem devolve | a tela mostra |
|---|---|---|
| `off` | todas | Escavação desligada |
| `cell` | hit, drill | Já está aberta |
| `blocked` | hit, bomb | Cave perto de uma aberta |
| `picks` (traz `nextInMs`) | hit | Sem picaretas (+ `nextText(r.nextInMs)`) |
| `bombs` / `drills` | bomb / drill | Sem bombas / Sem brocas |
| `stairs` | descend | Ache a escada primeiro |
| `daily` / `done` / `missions` | grant, syncDaily | Já ganhou hoje / Já ganhou nesta era / Complete as missões do dia |

**(f) Online** — nenhum.

**(g) Ordem** — depois das Relíquias (os fragmentos vão para `Sys.relics.addFragments`; desligada, ficam em `pend` e entram sozinhos depois). 1) carga · 2) Menu/`FB_UNLOCK` · 3) `js/p_dig.js` + screens.js + `PANEL_ON.dig=false` · 4) fumaça · 5) voto → `SYS_LIVE.dig`, `PANEL_ON.dig=true`.

**(h) Fumaça** (`?debug=1&painel=dig`):
```js
Sys.dig.setOn(true); const v=Sys.dig.view(S,Sys.host); v.picks===20 && v.cells.length===30;
const c=v.cells.find(x=>x.canDig); Sys.dig.hit(S,Sys.host,c.r,c.c).ok === true;
Sys.dig.hit(S,Sys.host,5,0).reason === 'blocked';   // longe do que está aberto
Screens.open('dig');
```
Node: `node test/sys/dig.test.js && node test/sys/lom_telas.test.js`.

---

## 3. Hoje + Pegar tudo (`Sys.today`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

A tela já existe em rascunho: `js/p_today.js` (sem commit; nasce com `PANEL_ON.today=false`). Ela já chama o que está abaixo e abre a linha por `Panels.open(tab)` → `host.goTab(tab)`; com as abas corrigidas no módulo, todas abrem.

**(a) index.html** — `'today'` no 3º array, **depois** de `'relics'` e `'dig'`.

**(b) SYS_LIVE** — `today: true`.

**(c) Menu e nível** — não é item do `FB_DROP`: é **botão do HUD** com selo. Na `FB_MENU` (`js/fullbattle.js:123-133`, coluna direita, abaixo do Baú):
```js
  { id: 'today',  icon: 'today',     label: 'Hoje',    side: 'right', x: 7, y: 220, act: 'soon:today', prio: 6, badge: 'fb_bt', show: () => { try { return Sys.today.on() && Sys.today.badge(S, Sys.host) > 0; } catch (e) { return false; } } },
```
(a posição final vem do mock; `y:220` é a mesma vaga do alerta de evento, que desce sozinho com `yf`). Selo: `Sys.today.badge(S, Sys.host)`.
`FB_UNLOCK`: `today: 7` (**proposta**, junto do Correio e do Login). `Sys.level.DATA.unlock.today = 7`, `unlockName.today = 'Hoje'` (Sistemas).

**(d) Ganchos** — nenhum. Só o `bagFull` do `Sys.host` (0.3).

**(e) Esqueleto da tela**

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.today.view(S, Sys.host)` | abrir / redesenhar | `{on, items:[{id, icon, label, count, kind:'claim'\|'go', tab, blocked:''\|'bag'}], claimable, badge}` |
| `Sys.today.claimAll(S, Sys.host)` | botão "Pegar tudo (N)" (N = `claimable`; apagado com 0) | `{ok, reason, n, by:{id:quantos}, left:[linhas]}`. O módulo já chamou `host.onChange()` |
| toque numa linha | abrir a tela | `Panels.open(item.tab,{from:'today'})`; se devolver `false`, `Sys.host.goTab(item.tab)` |

`tab` de cada linha (agora nomes reais): `login`/`chest`/`bonfire` → `battle` (fecha e volta à batalha, onde moram o Baú e a Fogueira) · `mail` (o Panels troca para `mail2`) · `missions` (missões, baús da atividade e conquistas) · `pass` · `codex` · `camp` · `map` (→ `map2`) · `duo` · `inst` · `thief` · `dig` · `relics`.
Ícones: `item.icon` (`calendar, mail, missions, pass, activity, trophy, codex, camp, chest, duo, instances, thief, dig, fire, relic`).
Linha `claim` = selo dourado; `go` = seta "›"; `blocked:'bag'` = texto `Sys.today.why('bag')`.
O "Pegar tudo" nunca gasta moeda/entrada/picareta/Brasa, nunca começa luta e nunca pega a trilha premium do passe.

| reason | quem devolve | a tela mostra |
|---|---|---|
| `off` | claimAll | Lista desligada |
| `empty` | claimAll | Nada para pegar agora |
| `blocked:'bag'` | linha de baús | Mochila cheia |

**(f) Online** — nenhum (a Dupla online fica fora: a tela da Dupla usa o `Sys.duoNet`).

**(g) Ordem** — por último entre as três do bloco A (lê relíquias e escavação). 1) carga · 2) `bagFull` no host · 3) `js/p_today.js` (já escrito) na lista do screens.js · 4) botão do HUD · 5) fumaça · 6) voto → `SYS_LIVE.today`, `PANEL_ON.today=true`.

**(h) Fumaça** (`?debug=1&painel=today`):
```js
Sys.today.setOn(true); const v=Sys.today.view(S,Sys.host); v.items.every(i=>i.tab);   // toda linha tem tela
Sys.today.claimAll(S,Sys.host);   // {ok, n, by}; depois view().claimable === 0
v.items.forEach(i=>console.log(i.id, i.tab, !!Panels.defs[i.tab]||i.tab==='battle'||i.tab==='pass'));   // tudo true
```
Node: `node test/sys/today.test.js && node test/sys/lom_telas.test.js`.

---

## 4. Arena PvP / conjunto (`Sys.arenaSet`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

Não é tela nova: é **uma aba** na Arena (`js/p_arena.js`) + a caixa "+1 Brasa" no resultado da luta. O `Sys.arena` e o `Sys.arenaNet` já chamam o módulo sozinhos (luta com as magias, `onWin` com a Brasa, retrato com `pvp`).

**(a) index.html** — `'arenaset'` no 3º array (depois de `'arena'` e `'arenanet'`, que já estão antes).

**(b) SYS_LIVE** — `arenaSet: true` (precisa do `bonfire`, que já está ligado, para a Brasa).

**(c) Menu e nível** — nenhum item novo: a aba fica dentro da Arena (`arena: 28` já existe).

**(d) Ganchos**
1. **Aba "Conjunto"** — `js/p_arena.js:151`: `const TABS=['Arena','Ligas','Ranking']` vira
```js
  const TABS=['Arena','Ligas','Ranking'].concat(window.Sys&&Sys.arenaSet&&Sys.arenaSet.on()?['Conjunto']:[]), tabs=...
```
   `js/p_arena.js:152`: `const body=XA2.tab===1?paLeagues():XA2.tab===2?paRanking():XA2.tab===3?paSet():paLobby()` e `js/p_arena.js:168`: `i<3` vira `i<TABS_N()` (ou `i<=3`).
2. **"+1 Brasa" no resultado** — `js/p_arena.js:613` (`function paPvPrize`), antes do `return out;`:
```js
  const br=num(rw.brasas); if(br) out.push({img:'brasa',v:'+'+paF(br),lb:br===1?'Brasa':'Brasas'});   /* Brasa da Arena (Sys.arenaSet.onWin; 1 por vitória, 5 por dia) */
```
   (`img:'brasa'` = o ícone da Fogueira; ajuste ao nome do arquivo que a tela usa.)
3. **Antes da luta (opcional)** — no começo da luta da arena: `try{ Sys.loadouts.forBattle(S,Sys.host,{pvp:true}); }catch(e){}` (troca para o conjunto Arena se o jogador ligou "trocar sozinho").
4. **Depois de editar magia ou salvar equipamento**: `Sys.arenaNet.snapshot(S, Sys.host)` (como já se faz ao trocar equipamento).

**(e) Esqueleto da aba**

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.arenaSet.view(S, Sys.host)` | desenhar a aba | `{on, spells:[{id, name, lv, text}], ownSpells, fromFases, gear, gearSet, pet, mount, mods:{atk, hp, aspd, foe}, brasa:{on, left, cap, got}}`; desligado `{on:false}` |
| `Sys.arenaSet.modsText(v.mods)` | **novo**: a linha pronta | `'Na arena: ATQ +12% · Vida +8% · Adversário −5%'` (`''` sem magia) |
| "Editar magias" | botão | `Panels.open('grim')` (Grimório; o onOpen dele, `js/p_grim.js:327`, ainda não aceita o modo: para abrir já na aba Arena, o Engenheiro põe `X.mode=(o&&o.mode)||X.mode` lá) |
| "Salvar equipamento atual" | botão | `Sys.loadouts.save(S,'arena',Sys.host)` e depois `Sys.arenaNet.snapshot(S,Sys.host)` |

`fromFases` = selo "usando o conjunto de Fases". Linha da Brasa só com `brasa.on`: "Brasa da Arena hoje: got/cap"; com `left===0`, `Sys.arenaSet.why('brasaCap')`.

| reason | a tela mostra |
|---|---|
| `off` (view `{on:false}`) | Conjunto PvP desligado (a aba nem aparece) |
| `brasaCap` (`brasa.left===0`) | Brasas da Arena de hoje completas |

**(f) Online** — já ligado: `Sys.arenaNet.snapshot` manda `pvp` (`POST /arena/snapshot`); o servidor luta com `Sys.arenaSet.duel`. Nada novo no `onlineboot.js`.

**(g) Ordem** — 1) carga · 2) caixa da Brasa (d2) · 3) aba (d1) · 4) fumaça · 5) voto → `SYS_LIVE.arenaSet`.

**(h) Fumaça** (`?debug=1`, arena aberta):
```js
Sys.arenaSet.setOn(true); const v=Sys.arenaSet.view(S,Sys.host); v.on && v.brasa.cap===5;
Sys.arenaSet.modsText(v.mods);   // linha da aba
// lute e vença 1 vez: r.rewards.brasas === 1 e a caixa "+1 Brasa" aparece
```
Node: `node test/sys/arenaset.test.js && node test/sys/arena-pvp.test.js && node test/sys/lom_telas.test.js`.

---

## 5. Ruínas em Trio (`Sys.coop` + `Sys.coopNet`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

Regras novas desta rodada (Sistemas, teste de ponta a ponta do Servidor):
- **Equilíbrio**: inimigo do andar = `max(mediana, média) × 3 × mult`. Um forte com duas contas fracas (5000/300/320) não vence mais os 10 andares; ele fica igual a um grupo de iguais (~andar 3,4). Grupo de iguais: números iguais aos de antes.
- **Código** em minúsculas vale: `canInvite` põe em maiúsculas e devolve `code`.
- **Frases**: 20 por **grupo** por dia. `canSay` usa o `party.sayLeft` do servidor quando vier; sem ele, as frases do grupo com data de hoje. 429 `limit` com `details.key:'day'` trava até o dia novo; a outra key (5 s) só o intervalo.
- **Prêmio**: `applyResult` lê o `paid` da **minha** linha em `members[]`; o `res.paid` do topo fica de reserva. Com `mailed:true` não credita (vem pelo correio).

**(a) index.html** — `'coop','coopnet'` no 3º array (nessa ordem).

**(b) SYS_LIVE** — `coop: true` (modo local, com 2 retratos de mentira); `coopNet: true` só quando o servidor estiver com `COOP_ON=1`.

**(c) Menu e nível** — cartão na tela de **Instâncias** (`js/p_inst.js`), ao lado das áreas: "Ruínas em Trio · entriesLeft/entriesMax hoje", só com `Sys.coop.status(S,Sys.host).on`. Abre a tela `coop` (`Panels.open('coop')`).
Nível: **30** (é o `Sys.coop.DATA.needLevel`, o servidor confere o mesmo). Abaixo de 30 o cartão mostra `Sys.coop.why('level')` ("Libera no nível 30"). `Sys.level.DATA.unlock.coop = 30` (Sistemas). Sem item no `FB_DROP` (entra pelas Instâncias, que abrem no 14).

**(d) Ganchos**
1. **Online** — `js/onlineboot.js:178`, a lista dos módulos online opcionais:
```js
    if (r.ok) for (const k of ['arenaNet', 'guildNet', 'duoNet', 'guildFireNet', 'coopNet']) { ...
```
   Com a chave desligada (ou `COOP_ON` desligado = 404) nada muda: fica o local.
2. **Correio**: nada a colar. A carta `source:'coop'` traz `att:{relicFrags, stones, goldk}`; o `Sys.mail.claim` entrega pelo `Sys.loot` (relicFrags → `Sys.relics`).
3. **Retrato**: o servidor usa a FC do retrato da arena. Sem retrato, `snapshot_required` ("Lute uma vez na Arena primeiro").

**(e) Esqueleto da tela**

Modo **local** (`view.online === false`):

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.coop.view(S, Sys.host)` | abrir | aberto: `{on, open:true, entriesLeft, entriesMax, online:false, party, invites, lastRun, name, table:[{k, mult, reward:{relicFrags, stones, goldk}}], total, phrases}`; fechado: `{on, open:false, reason:'off'\|'level', needLevel}` |
| `Sys.coop.start(S, Sys.host)` | botão "Entrar com retratos" | **síncrono**: `{ok, runId, seed, fcRef, teamPower, floors:[{k, win, p}], reached, reward, members, entriesLeft}` (já creditou) |

Modo **online** (`Sys.coopNet` ligado e iniciado: `view.online === true`). Use `Sys.coopNet.view(S,host)` = o mesmo view + `{myId, leader, started, err}`. Todas as ações são **Promise** e voltam `{ok:true, ...}` ou `{ok:false, reason, retryAfterMs}`:

| Chamada | Botão | Observação |
|---|---|---|
| `await Sys.coopNet.refresh(S,h)` | ao abrir e a cada 10 s com a tela aberta | grupo, convites, frases, entradas, última corrida |
| `await Sys.coopNet.create(S,h)` | "Criar grupo" | quem cria é o líder |
| `await Sys.coopNet.invite(S,h,{friendCode})` | "Convidar por código" | campo só `A-Z 0-9`, 6 a 10; minúsculas viram maiúsculas. Antes: `Sys.coop.canInvite(S,h,{friendCode})` |
| `await Sys.coopNet.invite(S,h,{guildMemberId})` | "Convidar da guilda" (lista do `Sys.guild`) | antes: `canInvite(S,h,{guildMemberId})` |
| `await Sys.coopNet.join(S,h,inv.partyId)` | "Entrar" num convite (`view.invites[]`) | |
| `await Sys.coopNet.leave(S,h)` | "Sair do grupo" | a vaga vira o retrato de quem saiu |
| `await Sys.coopNet.say(S,h,idx)` | toque numa frase de `view.phrases` (só índice) | antes: `Sys.coop.canSay(S,h,idx)` acende/apaga a grade |
| `await Sys.coop.start(S,h)` | "Começar" (só com `view.leader`) | Promise do provider: mesma forma do local + `mailed:true` (prêmio pelo correio; nada credita aqui) |

Animação da corrida (os dois modos): 3 retratos (`members`; `ghost` = moldura cinza "Retrato") sobem `floors` em ordem; `win` = baú do andar abre com `table[k-1].reward`; o primeiro `!win` = inimigo de pé e "Fim da corrida: andar `reached`". Embaixo a soma (`reward`) e, com `mailed`, "chega pelo correio". Membro com `paid:false` = "sem entrada: não ganhou".

| reason | quem devolve | a tela mostra |
|---|---|---|
| `off` | todas | Ruínas em Trio desligadas |
| `level` | status/view, create, join | Libera no nível 30 |
| `limit` | start (entradas), say (frases/5 s), invite (10 por dia) | Sem entradas hoje (em `say`, mostre "Aguarde" quando `retryAfterMs < 60000`) |
| `code` | canInvite, invite | Código não encontrado |
| `not_guild` | canInvite, invite | Não é da sua guilda |
| `bad_idx` | canSay, say | Frase inválida |
| `in_party` / `no_party` / `full` | create, invite, join, leave, start | Você já está num grupo / Crie um grupo primeiro / Grupo cheio |
| `not_leader` / `not_invited` / `party` | invite, start / join / join | Só o líder pode / Convite vencido / Grupo não existe mais |
| `snapshot_required` | create, join | Lute uma vez na Arena primeiro |
| `not_found` | qualquer rota com `COOP_ON` desligado | Abre com o online (o módulo volta sozinho ao local) |
| `net_off` / `offline` / `error` / `data` | rede | Sem conexão / Não deu agora |
| `claimed` | applyResult repetido | Prêmio já recebido |

**(f) Online** — `Sys.coopNet` (`js/sys/coopnet.js`, novo) contra o servidor: `GET /coop/status`, `POST /coop/party`, `/coop/party/invite`, `/coop/party/:id/join`, `/coop/party/leave`, `/coop/party/phrase`, `/coop/start`. No servidor: `COOP_ON=1` (hoje desligado: toda rota dá 404 e o jogo fica no local). Contrato: `docs/SERVIDOR_LOM.md` §3.3.

**(g) Ordem** — 1) carga (`coop`, `coopnet`) · 2) cartão nas Instâncias + `js/p_coop.js` · 3) fumaça local · 4) voto → `SYS_LIVE.coop` (local) · 5) Servidor liga `COOP_ON=1` em teste → `coopNet` na lista do onlineboot (d1) → `SYS_LIVE.coopNet`. Ligar **depois** das Relíquias (os fragmentos vão para elas; antes disso ficam guardados).

**(h) Fumaça**
```js
// local (?debug=1&painel=coop), herói nível >= 30
Sys.coop.setOn(true); const v=Sys.coop.view(S,Sys.host); v.open && v.entriesLeft===2 && v.online===false;
const r=Sys.coop.start(S,Sys.host); r.ok && r.members.length===3 && Sys.coop.entriesLeft(S,Sys.host)===1;
Sys.coop.canInvite(S,Sys.host,{friendCode:'ab12cd'}).code === 'AB12CD';
// online (servidor de teste com COOP_ON=1)
Sys.coopNet.DATA.on=true; await Sys.coopNet.start(S,Sys.host);   // {ok:true}; Sys.coop.view(S,Sys.host).online === true
```
Node: `node test/sys/coop.test.js && node test/sys/lom_telas.test.js`.

---

## 6. Minijogo de evento (`Sys.minigame`) + Ranking (`Sys.eventRank`)

visual: segue o mock da Arte (Higgsfield) votado pelo dono.

Duas abas novas na tela de **Eventos** (`js/p_events.js`): "Minijogo" e "Ranking". Hoje as abas são Trilha (0), Chefe (1), Loja (2) em `js/p_events.js:484`; o toque aceita `i<=2` em `js/p_events.js:542` (vira `i<=4`).

**(a) index.html** — `'minigame','eventrank'` no 3º array (o `events`, `evtrail`, `titles` e `profile` já carregam antes).

**(b) SYS_LIVE** — `minigame: true`; `eventRank: true` (o ranking só mostra posição com o servidor; sem ele, "Seus pontos").

**(c) Menu e nível** — nenhum item novo: as abas ficam dentro de Eventos (`events: 24` já existe). Selo do item Eventos/aba Minijogo: `Sys.minigame.badge(S, Sys.host)` (**novo**: prêmio do dia + marcos prontos + 1 se ainda não jogou hoje).

**(d) Ganchos**
1. **Boot** — `js/farm.js`, em `sysBoot()`, logo depois do `Sys.erasEnd.sync` (linha 114):
```js
    try { if (Sys.eventRank && typeof Sys.eventRank.sync === 'function'){ Sys.eventRank.fromMail(S, Sys.host); Sys.eventRank.sync(S, Sys.host); } } catch (e) { console.error('eventRank', e); }   /* molduras/títulos do ranking de evento (chave desligada = não faz nada) */
```
2. **Correio**: nada a colar. `Sys.eventRank.fromMail` grava o prêmio visual das cartas `eventrank` já resgatadas (o `view` chama sozinho).
3. **Perfil**: fileira de selos com `Sys.eventRank.badges(S)` → `[{id, name}]` (a tela do Perfil V5 decide onde).

**(e) Esqueleto das abas**

**Minijogo**

| Chamada | Quando | Volta |
|---|---|---|
| `Sys.minigame.view(S, Sys.host)` | abrir a aba | aberto: `{on, open:true, cycle:{id, game, start, end, daysLeft}, game:{id, name, txt, speed, zone}, triesLeft, triesMax, best, tier, claimed, canClaim, dayReward, tiers:[{id, name, min, reward}], days, milestones:[{days, reward, reached, claimed}], event, inRun, paidTries:false}`; fechado: `{on, open:false, reason:'off'\|'soon', startsAt}` ("Começa em" + data de `startsAt`) |
| `Sys.minigame.start(S, Sys.host)` | "Jogar" | `{ok, runId, game, speed, zone, taps:10, centers:[10], triesLeft}` |
| `Sys.minigame.grade(pos, centers[i], zone)` | a cada toque (pos 0-1) | `{id:'perfect'\|'good'\|'graze'\|'miss', name:'PERFEITO'\|'BOM'\|'RASPOU'\|'ERROU', pts}` |
| `Sys.minigame.finish(S, Sys.host, posicoes)` | 10 toques ou saiu (`null` = não tocou) | `{ok, score, taps:[{grade, name, pts}], tier, best, bestTier, record, triesLeft}` |
| `Sys.minigame.claimDay(S, Sys.host)` | "Resgatar" (com `canClaim`) | `{ok, tier, reward, got}` — avisar antes: "resgatar encerra o prêmio do dia" |
| `Sys.minigame.claimMilestone(S, Sys.host, dias)` | marco com `reached && !claimed` | `{ok, days, reward, got}` |

Marcador: uma passada = `1,6 s ÷ speed`; faixa centrada em `centers[i]` com largura `zone`. Bolinhas: PERFEITO dourado, BOM verde, RASPOU azul, ERROU cinza. Prêmios só materiais (sem ouro, sem diamante); nenhuma tentativa paga.

| reason | quem devolve | a tela mostra |
|---|---|---|
| `off` | todas | Minijogo desligado |
| `soon` | view, start | Começa em breve (+ data de `startsAt`) |
| `tries` | start | Sem tentativas hoje |
| `run` | finish | Nenhuma partida em andamento |
| `tier` | claimDay | Faça Bronze para ganhar |
| `claimed` | claimDay, claimMilestone | Já resgatado |
| `days` | claimMilestone | Ainda faltam dias |

**Ranking**

| Chamada | Quando | Volta |
|---|---|---|
| `await Sys.eventRank.load(S, Sys.host, ev.id)` | **novo**: ao abrir a aba | `{ok, band}` ou `{ok:false, reason:'off'\|'id'\|'net_off'\|'not_found'\|...}` (falha = fica o modo "Seus pontos") |
| `Sys.eventRank.view(S, Sys.host, ev.id)` | desenhar | `{on, event, name, points, rank, total, band, bandName, prize, final, bands:[{id, name, prize}], top:[{rank, name, points, frame}], online, powerFree:true}` |

Sem `online`: "Seus pontos: N · o ranking abre com o online". Com `online`: minha linha ("37º de 5.120 · Top 1%"), os 20 primeiros e a tabela das 4 faixas; destaque "Só visual: não dá poder".

**(f) Online** — Minijogo: nenhum (local; o servidor só confere `tries <= 3` no save). Ranking: `GET /events/:id/rank` pelo `Sys.eventRank.load` (servidor: `EVENTRANK_ON=1`; desligado = 404 = "Seus pontos"). O prêmio chega pelo correio (`source:'eventrank'`, `att.cosmetic`).

**(g) Ordem** — 1) carga · 2) aba Minijogo + selo · 3) fumaça · 4) voto → `SYS_LIVE.minigame` (o 1º ciclo começa em 20/11/2026, com o Festival das Eras) · 5) aba Ranking + gancho do boot · 6) `SYS_LIVE.eventRank` quando o Servidor ligar `EVENTRANK_ON`.

**(h) Fumaça** (`?debug=1`, Eventos aberto, data >= 20/11/2026):
```js
Sys.minigame.setOn(true); const v=Sys.minigame.view(S,Sys.host); v.open && v.triesLeft===3 && Sys.minigame.badge(S,Sys.host)===1;
const r=Sys.minigame.start(S,Sys.host); Sys.minigame.finish(S,Sys.host,r.centers).tier === 'ouro';   // tocar no centro = 1000 pontos
Sys.minigame.claimDay(S,Sys.host).ok === true; Sys.minigame.why(Sys.minigame.claimDay(S,Sys.host)) === 'Já resgatado';
Sys.eventRank.setOn(true); await Sys.eventRank.load(S,Sys.host,'festival_eras');   // sem servidor: {ok:false, reason:'not_found'|'net_off'}
```
Node: `node test/sys/minigame.test.js && node test/sys/eventrank.test.js && node test/sys/lom_telas.test.js`.

---

## 7. O que foi escrito nos módulos nesta rodada (todos seguem desligados)

| Módulo | Novo |
|---|---|
| `Sys.relics` | `why`, `slot(S,host,id)`, `DATA.why` |
| `Sys.dig` | `why`, `nextText`, `syncDaily` (missões do dia sem gancho, chamado pelo `refill`), `DATA.why` |
| `Sys.today` | `why`, `DATA.why`; abas com os nomes reais das telas |
| `Sys.arenaSet` | `why`, `modsText`, `DATA.why` |
| `Sys.coop` | `why`, `DATA.why`; equilíbrio `max(mediana, média)`; `canInvite` com maiúsculas (`code`); `groupSaid`/`markLimit` (20 frases por grupo, `sayLeft`); `paidOf` (paid por membro) |
| `Sys.coopNet` | **arquivo novo** `js/sys/coopnet.js`: provider online das Ruínas em Trio |
| `Sys.minigame` | `why`, `badge`, `DATA.why` |
| `Sys.eventRank` | `load` (GET do ranking), `fromMail` (correio sem gancho) |

Testes: `test/sys/lom_telas.test.js` (novo, 17 casos) e `test/sys/coop.test.js` (equilíbrio novo). A `test/sys` inteira passa (`for t in test/sys/*.test.js; do node $t; done`).
