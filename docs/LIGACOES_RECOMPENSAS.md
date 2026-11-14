# Ligações das recompensas (Sistemas → Engenheiro)

Ordem do dono (14/11): tudo o que foi aprovado tem de funcionar dentro do jogo. Este documento diz, para cada recompensa que depende de um módulo da Sistemas (`js/sys/*`), **o que já está ligado no código do Engenheiro**, **o que falta** (patch pronto para colar: trecho exato de hoje → trecho novo) e **qual chave ligar, em que ordem**.

Conferido contra a árvore de trabalho de 14/11 (depois dos commits 45c7d1b "Fogueira ligada" e 61f1017 "LIGADOS por ordem do dono"). Os arquivos do Engenheiro mudam rápido: se um trecho "trocar" não for achado, procure a mesma linha pelo texto (o patch não depende do número da linha).

**Como foi verificado:** cada patch foi aplicado numa cópia dos arquivos (fora do repositório), com o trecho antigo achado exatamente 1 vez, e todos os arquivos `.js` alterados (mais o `js/p_camp.js` novo e os `<script>` do `index.html`) passaram no `node --check`. Uma conferência em node com os módulos de verdade (`lig_rec/smoke.js` da Sistemas) confirmou as contas que os patches usam: a prévia das Brasas e das tendas calculada na cópia do save é igual à entrega no save; o baú dá 5 Brasas; a Encruzilhada apaga as bênçãos na fase 10; o +21 da Forja Astral aumenta o ATK do `Sys.stats`; a Tenda do Ouro devolve `fixed`. O teste em navegador (sandbox) NÃO foi rodado: na hora havia `test/e2e/run.js`, `arena_pvp.js` e um headless rodando (regra de um teste pesado por vez).

## Mudanças da Sistemas que acompanham este documento (com teste; vão num commit próprio da Sistemas, separado deste documento)

| Módulo | O que mudou | Por quê | Teste |
|---|---|---|---|
| `Sys.chest.open` | dá **+5 Brasas** (`Sys.bonfire.addBrasas(S,'chest',1)`) e devolve `brasas` no resultado | a fonte 'chest' existia no módulo da Fogueira e ninguém chamava; o botão "Abrir mais" fica dentro do `Sys.chest.showOpen`, então só o módulo pega os dois caminhos | `test/sys/bonfire.test.js` (novo caso) |
| `Sys.pass.claimMission(S,h,'bonus')` | o bônus das diárias (todas resgatadas) dá **+20 Brasas** (fonte 'missions') e devolve `brasas` | o resgate tem 4 lugares no jogo (Missões, Passe V2, Passe antigo, VIP automático): no módulo vale para todos | `test/sys/bonfire.test.js` |
| `Sys.crossroads.onStage` | vencer a **última fase da era** (Senhor da Era, fase 10 na curva de hoje) já apaga as bênçãos e grava `lastEnded` | antes só apagava na 1ª vitória da era seguinte (fase 11): as bênçãos da era 1 valiam numa fase da era 2, ao contrário do protótipo aprovado | `test/sys/crossroads.test.js` (novo caso) |
| `Sys.stats.itemsTotal` | o multiplicador da forja do espaço passa pelo `Sys.erasEnd.forgeMult` | a Forja Astral +21..+25 só aparecia no texto do item (`js/screens.js forgeMult`); a FC e o combate continuavam com o +20 | `test/sys/erasend.test.js` (novo caso) |

Desligado, nada disso muda o jogo: `Sys.bonfire` desligado devolve 0 Brasas e não escreve no save; `Sys.erasEnd` desligado devolve o `Sys.forge.mult` de sempre. Toda a bateria `test/sys/*.test.js` passou.

---

## 1. Fogueira das Eras (V5 aprovada) — `Sys.bonfire`

**Já ligado (não mexer):**
- abate: `js/farm.js farmKill` → `Fogueira.onKill` (faísca só se `killCounts`) e `fogBrasa('kill',1)` com `{stage:S.stage, maxStage:S.best}` ("só abate novo"); chefe: `fogBrasa('boss',1)`;
- fase vencida: `js/battle.js` (`fogBrasa('stage',1)` na linha do `S.stage++`);
- tela inteira em `js/fogueira.js`: toque = `tap` (lote pelo nível), cartão nova × a sua (Equipar / Guardar / Desmontar com `addItem` + `dismantle`), cadeado `lock`, desmontar rápido `quick` (2 toques), recuperar `recover`, `levelUp`, mochila cheia `makeRoom`, automático `autoRun` a cada 1,5 s (`AUTO_S`) que **pausa em Épico+** (`res.pause` vira cartão), VIP `bonfireInstant` (`Sys.vip.conv`), painel com `view`;
- laço: `Fogueira.tick` e `Fogueira.draw` em `js/battle.js`;
- tempo fora: `Fogueira.offline(AWAY)` dentro do `showOffline` do `js/meta.js`;
- chaves: `FOGUEIRA_ON = true` e `SYS_LIVE.bonfire = true` (`js/farm.js`).
- baú e missões: agora pelo módulo (tabela acima). Nada a fazer para creditar.

**Falta:**

1. **Tempo fora com a entrada nova (defeito real).** A entrada nova está ligada (`PANEL_ON.intro`), e o `js/p_intro.js` marca `window.__offDone=true`: o `showOffline` do `js/meta.js` nunca roda, então o `Fogueira.offline` **nunca é chamado** e ninguém recebe Brasas do tempo fora. Os patches abaixo põem as Brasas na lista de ganhos do "Bem-vindo de volta" (ícone + número, como pedras e ração), entregam no Coletar sem abrir o cartão próprio da Fogueira, e cobrem a volta sem Bem-vindo (ouro 0).

**F1 · `js/p_intro.js`** — Bem-vindo de volta: Brasas do tempo fora e as 3 tendas do Acampamento na lista de ganhos (calculado na MESMA cópia do save)

Trocar:
```js
        try{ if(X.pet&&X.pet.onOffline){ n=X.pet.onOffline(c,quiet,t)|0; if(n>0) extras.push({key:'food',n,label:'ração de pet',icon:PI_ICON.food}); } }catch(e){}
```
Por:
```js
        try{ if(X.pet&&X.pet.onOffline){ n=X.pet.onOffline(c,quiet,t)|0; if(n>0) extras.push({key:'food',n,label:'ração de pet',icon:PI_ICON.food}); } }catch(e){}
        /* FOGUEIRA (Sys.bonfire.offline: teto próprio de 12 h e 40 Brasas por dia, por isso o AWAY inteiro e não o t do ouro) e ACAMPAMENTO (Sys.camp.collect: as 3 tendas), na MESMA cópia: o Coletar entrega estes números */
        try{ if(window.Fogueira&&Fogueira.isOn()&&X.bonfire&&X.bonfire.offline){ const r=X.bonfire.offline(c,quiet,away); n=r&&r.brasas|0; if(n>0) extras.push({key:'brasas',n,label:n>1?'Brasas da Fogueira':'Brasa da Fogueira',icon:'assets/ui/fogueira/fg_s1.png'}); } }catch(e){}
        try{ const K=X.camp; if(K&&K.DATA&&K.DATA.on===true&&K.collect){ const g=(K.collect(c,quiet)||{}).got||{}; const add=(k,v,lb,ic)=>{ if(!(v>0)) return; const ex=extras.find(x=>x.key===k); if(ex) ex.n+=v; else extras.push({key:k,n:v,label:lb,icon:ic}); };
          add('campGold',g.gold,'moedas do Acampamento','assets/ui/coin.png'); add('forge',g.forge,'pedras de forja',PI_ICON.forge); add('stones',g.practice,'pedras de treino',PI_ICON.stones); } }catch(e){}
```

**F2 · `js/p_intro.js`** — Coletar do Bem-vindo: entrega as Brasas (sem o cartão próprio da Fogueira) e coleta as tendas

Trocar:
```js
if(Sys.pet&&Sys.pet.onOffline) Sys.pet.onOffline(s,Sys.host,d.sec); }catch(e){ console.error('[intro] offline grant',e); } }
```
Por:
```js
if(Sys.pet&&Sys.pet.onOffline) Sys.pet.onOffline(s,Sys.host,d.sec); }catch(e){ console.error('[intro] offline grant',e); }
        try{ if(window.Fogueira) Fogueira.offline(typeof AWAY==='number'?AWAY:d.sec,{silent:true}); }catch(e){ console.error('[intro] fogueira',e); }   /* uma vez (OFF_DONE); silent = já está na lista do Bem-vindo */
        try{ if(Sys.camp&&Sys.camp.DATA&&Sys.camp.DATA.on===true) Sys.camp.collect(s,Sys.host); }catch(e){ console.error('[intro] camp',e); } }
```

**F3 · `js/p_intro.js`** — sem Bem-vindo (ouro 0) a Fogueira ainda junta o tempo fora: hoje, com a entrada nova ligada, o Fogueira.offline do js/meta.js NUNCA roda (o __offDone pula o showOffline)

Trocar:
```js
    window.__offDone=true;   /* o Bem-vindo já entregou o tempo fora: o modal antigo não aparece de novo */
```
Por:
```js
    try{ if(window.Fogueira&&typeof AWAY==='number'&&AWAY>=120&&(G.S().tut|0)>=1) Fogueira.offline(AWAY); }catch(e){}   /* Brasas do tempo fora quando o Bem-vindo não abriu (o Fogueira.offline só roda uma vez: depois do Coletar não faz nada) */
    window.__offDone=true;   /* o Bem-vindo já entregou o tempo fora: o modal antigo não aparece de novo */
```


2. **Brasas do baú voando até a Fogueira** (opcional, só desenho; o +5 já entra pelo módulo):

**F4 · `js/fullbattle.js`** — Brasas do baú de toque voam até a Fogueira (o +5 já é creditado pelo Sys.chest.open; isto é só o desenho)

Trocar:
```js
    const res = Sys.chest.open(S, Sys.host); snd('claim');
```
Por:
```js
    const res = Sys.chest.open(S, Sys.host); snd('claim'); if (res && res.brasas > 0){ try { if (window.Fogueira) Fogueira.onBrasa(typeof HX === 'number' ? HX + 40 : 120, GY - 34, res.brasas); } catch (e) {} }
```


O bônus das diárias (+20) entra sem desenho: o número da Fogueira atualiza no próximo `sync` (0,2 s). Quem quiser o voo pode usar o `r.brasas` que o `Sys.pass.claimMission` agora devolve.

**Chaves:** nenhuma nova (já ligadas). Ordem: colar F1-F3 → conferir voltando ao jogo depois de 10 min fora (a linha "Brasas da Fogueira" aparece no Bem-vindo e o selo da Fogueira sobe).

---

## 2. Ladrão de Brasas — `Sys.thief`

**Já ligado:** nada. O módulo **não é carregado** (`thief` não está na lista de `js/sys/` do `index.html`), não há tela e não está no `SYS_LIVE`. O commit 45c7d1b diz que o Engenheiro está escrevendo a tela; aqui vão só as ligações, para a tela dele usar. Não há protótipo do Ladrão em `docs/proto/v2`: pelo processo (arte → tela → voto → dev), a tela precisa do voto do dono antes de ligar.

**L1 · `index.html`** — carregar Sys.thief e Sys.camp (hoje não estão na lista: Sys.thief e Sys.camp não existem no jogo)

Trocar:
```html
'pathtry','mapchest','assets'],['fc','advice','bossloss']
```
Por:
```html
'pathtry','mapchest','thief','camp','assets'],['fc','advice','bossloss']
```

**L2 · `js/farm.js`** — chaves dos dois módulos na lista única SYS_LIVE (nascem false; viram true no passo de ligar)

Trocar:
```js
const SYS_LIVE = { bonfire: true, bossLoss: true, crossroads: true, erasEnd: true, profile: true, mapChest: true };
```
Por:
```js
const SYS_LIVE = { bonfire: true, bossLoss: true, crossroads: true, erasEnd: true, profile: true, mapChest: true, thief: false, camp: false };   /* thief: com a tela do Ladrão; camp: com a tela do Acampamento (js/p_camp.js) */
```


**Entrada** (pelo painel da Fogueira, onde estão as Brasas; só aparece com a tela `thief` ligada e o módulo ligado):

**T1 · `js/fogueira.js`** — ação nova "thief" na lista do painel

Trocar:
```js
'rec', 'offok'];
```
Por:
```js
'rec', 'offok', 'thief'];
```

**T2 · `js/fogueira.js`** — linha "Ladrão de Brasas" no painel da Fogueira (entradas do dia pelo Sys.thief.view; só com a tela thief ligada)

Trocar:
```js
<div class="fgx-se"><span>Estágios</span>
```
Por:
```js
${thiefRow()}<div class="fgx-se"><span>Estágios</span>
```

**T3 · `js/fogueira.js`** — thiefRow() e o toque (abre Panels.open("thief"))

Trocar:
```js
function renderSheet(){
```
Por:
```js
/* LADRÃO DE BRASAS (Sys.thief): só a ENTRADA mora aqui; a perseguição é a tela 'thief'. Sem a tela ligada ou o módulo desligado: nada aparece */
function thiefRow(){ try { const T = Sys.thief; if (!T || !T.DATA || T.DATA.on !== true || !(window.Panels && Panels.on('thief'))) return ''; const v = T.view(S, host());
  return `<div class="fgx-se"><span>Ladrão de Brasas</span><span>${v.left} de ${v.entries} hoje</span></div><button class="fgx-up" data-fg="thief" aria-disabled="${!(v.canEnter || v.canSweep)}">${v.canEnter || v.canSweep ? 'Perseguir o ladrão · até ' + pl(v.lote, 'Brasa', 'Brasas') : 'Volta amanhã'}</button>`; } catch (e) { return ''; } }
function renderSheet(){
```

**T4 · `js/fogueira.js`** — ação thief

Trocar:
```js
  if (a === 'offok'){ OFF = null; renderOff(); return; }
```
Por:
```js
  if (a === 'offok'){ OFF = null; renderOff(); return; }
  if (a === 'thief'){ SHEET = false; renderSheet(); try { if (window.Panels && Panels.on('thief')) Panels.open('thief'); } catch (e) {} return; }
```


**Fluxo da tela `thief`** (todas as regras são do módulo; a tela só desenha e mede o score):

```js
const T = Sys.thief, h = Sys.host;
const v = T.view(S, h);            // {left, entries, lote, best, sweepLote, canEnter, canSweep, secs, run}
// Perseguir: GASTA a entrada ao entrar (regra única com o servidor; sair no meio não devolve). O lote fica preso ao nível da Fogueira de agora.
const e = T.enter(S, h);           // {ok, lv, lote, secs:45} ou {ok:false, reason:'off'|'entries'|'run'}
// ... 45 s de perseguição; score = fração do saco que caiu (0..1) ...
const f = T.finish(S, h, { score }); // {brasas, drop, won, left}: as Brasas já entraram pelo Sys.bonfire.addBrasas(S,'thief',n)
// Repetir ("Varrer o último"): gasta 1 entrada e dá na hora o lote do melhor nível vencido
const w = T.sweep(S, h);           // {ok, brasas, left} ou reason 'none'|'entries'|'run'
// Saiu no meio: fecha a corrida (a entrada já foi gasta no enter)
T.cancel(S, h);
// depois de enter/finish/sweep/cancel: save(); hud(); e, se a Fogueira estiver na tela, Fogueira.onBrasa(x, y, f.brasas) para o voo
```

Corrida que ficou aberta (app fechado no meio): `view().run` vem preenchido e `canEnter` false; a tela deve oferecer "Continuar" (perseguição que termina com `finish`) ou `cancel` (a entrada já foi gasta).

**Online:** com o servidor ligado (`THIEF_ON`), as entradas são contadas no servidor (`GET /v1/thief`, `POST /v1/thief/enter`, `/finish`, `/sweep`, docs/API_SERVIDOR.md §15). Não existe camada `Sys.thief` online (como o `arenanet`/`guildnet`): ver "Lacunas" no fim.

**Chaves, em ordem:** L1 (carregar) → tela `thief` escrita e aprovada → `PANEL_ON.thief = true` → `SYS_LIVE.thief = true`.

---

## 3. Derrota com prêmio — `Sys.bossLoss`

**Já ligado, completo:** `js/battle.js` chama `resBossLoss()` **uma vez** por derrota para o chefe (quando o herói termina de cair); `resBossLoss` (`js/screens2.js`) mede a vida tirada em `B.en`, faz o `quote` numa cópia (só para o texto) e chama `Sys.bossLoss.onDefeat` (credita ouro, XP e pedra). O quadro novo fica no lugar do "Fique mais forte"; reabrir a Derrota não credita de novo. Dicas: `onDefeat` devolve `tips` pelo `Sys.advice.all` numa cópia do save e o `Sys.host.unlocked(tab)` (`js/farm.js`) já filtra telas fechadas pelo nível; `resLossTips` ainda passa cada dica pelo `diffRoute`. As dicas **não** dependem de `Sys.advice.DATA.on` (o `all` não olha a chave).

**Chave:** `SYS_LIVE.bossLoss = true` (já ligado em 61f1017). Nada a colar.

---

## 4. Encruzilhada — `Sys.crossroads`

**Já ligado:** `js/battle.js` chama `onStage(S, host, fase)` na vitória (só com `Panels.on('cross')`) e guarda `B.crossPend`; a janela abre depois da Vitória (`Panels.open('cross', {stage})`) e o `js/p_cross.js` faz `offers`/`choose`/`active`/`view`; selo e botão Bênçãos no HUD (`PCross.mount/update` no `fbTick`). Os efeitos não precisam de chamada: `Sys.fc` soma `bonus`, `Sys.level.addXp` aplica o "Saber das Eras" e `Sys.bonfire.addBrasas` aplica a "Brasa Viva". Chaves já ligadas: `PANEL_ON.cross`, `SYS_LIVE.crossroads`.

**Falta:** o aviso das bênçãos que acabaram (`view().lastEnded` + `ackEnded`). Com a correção da Sistemas no `onStage`, elas acabam na vitória do Senhor da Era (fase 10). O aviso entra depois da Vitória e da Troca de era (a mesma fila do `B.crossPend`) e também na abertura do jogo, se ficou pendente (`window.__crossEndChk` começa vazio = confere uma vez).

**C1 · `js/battle.js`** — marca que há bênçãos que acabaram (o módulo devolve ended na vitória do Senhor da Era)

Trocar:
```js
const cr=Sys.crossroads.onStage(S,Sys.host,won); if(cr&&cr.due) B.crossPend={stage:won};
```
Por:
```js
const cr=Sys.crossroads.onStage(S,Sys.host,won); if(cr&&cr.due) B.crossPend={stage:won}; if(cr&&cr.ended&&cr.ended.length) window.__crossEndChk=true;
```

**C2 · `js/battle.js`** — depois da Vitória/Troca de era: aviso "as bênçãos acabaram" UMA vez (view().lastEnded, depois ackEnded). Também na abertura do jogo, se ficou pendente

Trocar:
```js
  if(B.crossPend&&!B.eraPend&&!B.endPend&&!B.res&&!B.inst){ const co=B.crossPend;
```
Por:
```js
  if(window.__crossEndChk!==false&&!B.crossPend&&!B.eraPend&&!B.endPend&&!B.res&&!B.inst){ window.__crossEndChk=false; try{ const C=window.Sys&&Sys.crossroads, v=C&&typeof C.view==='function'?C.view(S,Sys.host):null, le=v&&v.on?v.lastEnded:null;
      if(le&&le.list&&le.list.length){ const nm=e=>(ERAS[e]&&ERAS[e].n)||('Era '+(e+1)); toast('As bênçãos da '+nm(le.era)+' acabaram ('+le.list.map(x=>x.name).join(', ')+'). '+(ERAS[le.era+1]?'Na '+nm(le.era+1)+' começa uma coleção nova':'A jornada continua')); C.ackEnded(S,Sys.host); } }catch(er){ console.error('crossEnd',er); } }
  if(B.crossPend&&!B.eraPend&&!B.endPend&&!B.res&&!B.inst){ const co=B.crossPend;
```


Se o Engenheiro quiser a animação do protótipo (cartões apagando por 1,7 s na lista "Bênçãos da era"), o `js/p_cross.js` pode ler `view().lastEnded` no modo lista e só chamar `ackEnded` ao fechar; o aviso acima continua servindo de reserva.

---

## 5. Baús do mapa — `Sys.mapChest`

**Já ligado:** o Mapa das Eras V4 (`js/p_map2.js`, `PANEL_ON.map2`) usa `list`, `claim` (uma chamada por toque) e `readyCount`; `Sys.host.bestStage()` existe (`js/farm.js`). `SYS_LIVE.mapChest = true`.

**Falta:** o aviso de "baú pronto" fora do Mapa. Hoje o número só aparece dentro da tela.

**M1 · `js/fullbattle.js`** — baús prontos no item Mapa do Menu (Map2.ready = Sys.mapChest.readyCount)

Trocar:
```js
  { id: 'map',      icon: 'map',       label: 'Mapa',       act: 'soon:map' },
```
Por:
```js
  { id: 'map',      icon: 'map',       label: 'Mapa',       act: 'soon:map', alerts: () => { try { return window.Map2 && fbPanelOn('map2') ? Map2.ready() : 0; } catch (e) { return 0; } } },
```

**M2 · `js/fullbattle.js`** — e no contador do botão MENU

Trocar:
```js
  { let n = fbUnl('missions') ? missionAlerts() : 0;
```
Por:
```js
  { let n = fbUnl('missions') ? missionAlerts() : 0; try { if (fbUnl('map') && window.Map2 && fbPanelOn('map2')) n += Map2.ready(); } catch (e) {}
```


---

## 6. Fim das 9 eras, marcos e Forja Astral — `Sys.erasEnd`

**Já ligado:** `sync` no arranque (`js/farm.js sysBoot`), `onStageClear` em toda vitória (`js/battle.js`, pedras astrais na Vitória, prêmios na tela `end9`), `forgeMult` no texto do item (`js/screens.js`). Com a mudança da Sistemas no `Sys.stats`, o nível astral agora vale na FC e no combate. `SYS_LIVE.erasEnd = true`, `PANEL_ON.end9 = true`.

**Falta:**

1. aviso do marco sem o número (defeito pequeno):

**E1 · `js/battle.js`** — aviso do marco: o módulo devolve mark.title ("Marco 100"), não mark.name (hoje sai "Marco alcançado" sem o número)

Trocar:
```js
toast((ee.mark.name||'Marco')
```
Por:
```js
toast((ee.mark.title||ee.mark.name||'Marco')
```


2. a tela da **Forja Astral**: com o espaço no +20, a Forja V2 mostra "chegou ao máximo". Os patches abaixo trocam esse quadro pelo da Forja Astral (+21..+25): chance, pedras astrais, o motivo quando não dá (`base` = falta o +20, `marco` = vença a fase 100/110/..., `pedras`), botão "Forja Astral" (`astralTry`, a falha nunca tira nível) e a faixa de resultado igual à da Forja. Sem o módulo ligado, nada muda.

**E2 · `js/p_forge2.js`** — ação astral

Trocar:
```js
const ACTIONS=['tab','slot','forge','auto','aura','pvout','tsel','trans','transok','askno','gsel','fuse','back'];
```
Por:
```js
const ACTIONS=['tab','slot','forge','auto','aura','pvout','tsel','trans','transok','askno','gsel','fuse','back','astral'];
```

**E3 · `js/p_forge2.js`** — espaço no +20: o quadro da Forja Astral +21..+25 (Sys.erasEnd.canAstral) no lugar do "chegou ao máximo"

Trocar:
```js
  if(top) return open+'<div class="f2-chn"><div class="f2-msg">Este espaço chegou ao máximo:
```
Por:
```js
  if(top){ const AS=astralHtml(sl); if(AS) return open+AS+'</div>'; }
  if(top) return open+'<div class="f2-chn"><div class="f2-msg">Este espaço chegou ao máximo:
```

**E4 · `js/p_forge2.js`** — astralHtml / astralOnce (toda regra, chance, custo e garantia são do Sys.erasEnd)

Trocar:
```js
/* ----- aba Forjar: legenda das auras e tabela ----- */
```
Por:
```js
/* ----- FORJA ASTRAL +21..+25 (Sys.erasEnd, pós-eras): só com o módulo ligado; '' = a tela de sempre ----- */
const EE=()=>{ const E=window.Sys&&Sys.erasEnd; return E&&E.DATA&&E.DATA.on===true&&typeof E.canAstral==='function'&&typeof E.astralTry==='function'?E:null; };
function astralHtml(sl){ const E=EE(); if(!E) return ''; let c, a=0, tot=0, st=0; try{ c=E.canAstral(S,Sys.host,sl); a=E.astralLevel(S,sl); tot=E.totalLevel(S,sl); st=E.view(S,Sys.host).stones|0; }catch(e){ return ''; }
  const A=E.DATA.astral, max=a>=A.levels.length, why={base:'Precisa do +'+A.base+' da Forja neste espaço.',marco:'O +'+c.next+' abre ao vencer a fase '+c.needStage+'.',pedras:'Faltam pedras astrais: tem '+n0(st)+', a tentativa pede '+n0(c.stones)+'. Elas vêm das fases depois da 90.',max:'Forja Astral no máximo: +'+A.levels[A.levels.length-1]+'.'};
  return '<div class="f2-chn"><b class="pc">'+(max?'+'+tot:pc(c.chance))+'</b><div class="cw"><small>Forja Astral · '+(max?'+'+tot+' · máximo':(a?'+'+tot:'+'+A.base)+' → +'+c.next)+'</small><em>Pedras astrais: '+n0(st)+' · a falha nunca tira nível, soma garantia</em></div></div>'
    +(max?'':'<div class="f2-acts"><button class="f2-bt" data-x="astral" aria-disabled="'+(!c.ok||X.busy)+'"><span>'+SV.hammer+'Forja Astral</span><small>'+pl(c.stones,'pedra astral','pedras astrais')+'</small></button></div>')
    +'<div class="f2-foot">'+(c.ok?'':'<b>'+esc2(why[c.reason]||'')+'</b> ')+'Pedras astrais só vêm de jogar as fases sem fim: nunca de diamante nem de dinheiro.</div>'; }
function astralOnce(){ const E=EE(), sl=X.slot; if(!E||X.busy) return; const fc0=fcNow(); let r=null; try{ r=E.astralTry(S,Sys.host,sl); }catch(e){ r=null; }
  if(!r||!r.ok){ sfx('ui_tap'); say(r&&r.reason==='pedras'?'Faltam pedras astrais':r&&r.reason==='marco'?'Vença o próximo marco para abrir este nível':'A Forja Astral não abriu agora'); redraw(); return; }
  if(r.success){ call(typeof statsChanged==='function'?statsChanged:null); sfx('claim'); const df=fcNow()-fc0; X.fly=df>0?{t:now(),txt:'+'+fcTxt(df)+' FC'}:null; banner('ok',slotShort(sl)+' +'+r.level+'!','Forja Astral'); }
  else { call(typeof save==='function'?save:null); call(typeof hud==='function'?hud:null); sfx('ui_tap'); X.fly=null; banner('no','Falhou, +'+pc(E.DATA.astral.pityPerFail)+' na próxima','o nível não cai'); }
  redraw(); }
/* ----- aba Forjar: legenda das auras e tabela ----- */
```

**E5 · `js/p_forge2.js`** — toque

Trocar:
```js
  else if(a==='forge') forgeOnce();
```
Por:
```js
  else if(a==='forge') forgeOnce();
  else if(a==='astral') astralOnce();
```

**E6 · `js/p_forge2.js`** — redesenha quando as pedras astrais mudam (marco vencido em outra tela)

Trocar:
```js
return [X.tab,X.slot,c.reason,c.stones,c.gold,c.chance,st,
```
Por:
```js
let ea=''; try{ const E=EE(); if(E){ const ca=E.canAstral(S,Sys.host,X.slot); ea=[ca.reason,ca.chance,E.astralLevel(S,X.slot),E.view(S,Sys.host).stones].join(','); } }catch(e){}
    return [X.tab,X.slot,c.reason,c.stones,c.gold,c.chance,st,ea,
```


Os níveis +16..+20 dependem da `f20` do `Sys.forge` (`setForge20`): sem ela a Forja para no +15 e a Astral responde `base`. Ligar a `f20` é decisão do PO (não está no `SYS_LIVE`).

**Chaves:** já ligadas. Ordem: E1 → E2-E6 → conferir com `?debug=1` num save na fase 101+ com a arma no +20 (`Sys.forge.setForge20(true)`).

---

## 7. Acampamento das Eras — `Sys.camp`

**Já ligado:** nada. O módulo não é carregado (L1 acima carrega), não há tela nem item no Menu. Decisão do PO (docs/DECISOES_DONO.md): nível 20, **só pelo Menu**, o que as tendas guardam volta **dentro** da janela do tempo fora, Tenda do Ouro sem Melhorar (`upgrade`/`canUpgrade` devolvem `reason:'fixed'`; a tela não mostra o botão). Protótipo: `docs/proto/v2/Acampamento.html` (o registro diz "protótipo no link": confirmar o voto do dono antes de ligar).

**Não é preciso chamar `tick` por relógio:** o módulo anda pelo marcador de tempo do save; `view`, `collect`, `assign` e `upgrade` já chamam `tick`. O relógio do aparelho voltando não rende nada.

**Bem-vindo de volta:** as 3 tendas entram na lista de ganhos pelo F1 (prévia na cópia) e são coletadas no Coletar pelo F2. No modal antigo (entrada nova desligada):

**K4 · `js/meta.js`** — modal antigo (só com a entrada nova desligada): linha do Acampamento

Trocar:
```js
  const hh=Math.floor(t/3600), mm=Math.floor(t%3600/60);
  mbox.innerHTML=`<h3>Enquanto você esteve fora</h3>
```
Por:
```js
  const hh=Math.floor(t/3600), mm=Math.floor(t%3600/60);
  let campTx=''; try{ const K=Sys.camp; if(K&&K.DATA&&K.DATA.on===true){ const v=K.view(S,Sys.host); if(!v.locked) campTx=v.tents.filter(x=>x.stored>0).map(x=>'+'+fmt(x.stored)+' '+(x.res==='gold'?'moedas':x.res==='forge'?'pedras de forja':'pedras de treino')).join(' · '); } }catch(e){}   /* Acampamento: o que as tendas guardaram */
  mbox.innerHTML=`<h3>Enquanto você esteve fora</h3>
```

**K5 · `js/meta.js`** — modal antigo: mostra e coleta

Trocar:
```js
    <div class="row"><button class="btn grow" id="m_go">Resgatar</button></div>`;
```
Por:
```js
    ${campTx?`<div class="sm" style="margin-top:8px;text-align:center">Acampamento: ${campTx}</div>`:''}
    <div class="row"><button class="btn grow" id="m_go">Resgatar</button></div>`;
```

**K6 · `js/meta.js`** — modal antigo: coleta no Resgatar

Trocar:
```js
    save(); hud(); closeModal(); snd('coin'); snd('claim'); if(view!=='battle') render(); };
```
Por:
```js
    if(campTx){ try{ Sys.camp.collect(S,Sys.host); }catch(e){ console.error('camp',e); } }
    save(); hud(); closeModal(); snd('coin'); snd('claim'); if(view!=='battle') render(); };
```


**Menu e tela:**

**K1 · `js/fullbattle.js`** — nível 20 (decisão do PO)

Trocar:
```js
const FB_UNLOCK = { map: 1,
```
Por:
```js
const FB_UNLOCK = { camp: 20, map: 1,
```

**K2 · `js/fullbattle.js`** — item Acampamento no Menu (só pelo Menu: decisão do PO). Ícone provisório até a Arte entregar assets/icons/menu/camp.png

Trocar:
```js
  { id: 'mail',     icon: 'mail',      label: 'Correio',    act: 'soon:mail' },
```
Por:
```js
  { id: 'camp',     icon: 'guild',     label: 'Acampamento', act: 'soon:camp', alerts: () => { try { const v = Sys.camp && Sys.camp.DATA.on === true ? Sys.camp.view(S, Sys.host) : null; return v && !v.locked ? v.tents.filter(t => t.full).length : 0; } catch (e) { return 0; } } },   /* Acampamento (js/p_camp.js, Sys.camp): nível 20; o número = tendas cheias */
  { id: 'mail',     icon: 'mail',      label: 'Correio',    act: 'soon:mail' },
```

**K3 · `js/screens.js`** — carregar a tela nova

Trocar:
```js
'p_cross','p_trial',
```
Por:
```js
'p_cross','p_camp','p_trial',
```


**Arquivo novo `js/p_camp.js`** (esqueleto da Sistemas com todas as ligações; desenho mínimo para o Engenheiro trocar pelo do protótipo; passou no `node --check`):

```js
'use strict';
/* ================= ACAMPAMENTO DAS ERAS — tela nova, nasce DESLIGADA (PANEL_ON.camp) =================
   Protótipo: docs/proto/v2/Acampamento.html. Decisão do PO: abre no nível 20, só pelo Menu; o que as tendas guardam também volta no "Bem-vindo de volta".
   ESQUELETO DA SISTEMAS (docs/LIGACOES_RECOMPENSAS.md, seção 7): só as LIGAÇÕES com o módulo, desenho mínimo. O Engenheiro troca o desenho pelo do protótipo.
   NENHUMA regra nem número aqui. Tudo vem do js/sys/camp.js (Sys.camp):
   - modelo da tela: view(S, host) → {on, locked, needLevel, capHours, text, idlePets, tents:[{id,name,res,lv,maxLv,perHour,stored,cap,full,pct,pets,slots,upgrade}]};
   - Coletar tudo: collect(S, host) → {ok, reason, got:{gold, forge, practice}} (credita sozinho);
   - pet na tenda: assign(S, host, tenda, pet) / unassign(S, host, pet) → {ok, reason};
   - Melhorar: upgrade(S, host, tenda) → {ok, reason:'fixed'|'max'|'money'|..., cost, lv}. A Tenda do Ouro NÃO tem Melhorar (reason 'fixed', decisão do PO).
   Toques por data-x; a lista fica em def.actions. */
(function(){
if(!('camp' in PANEL_ON)) PANEL_ON.camp=false;
const ACTIONS=['collect','up','pet','unpet','back'];
const X={msg:'',sel:''};
const K=()=>{ const k=window.Sys&&Sys.camp; return k&&k.DATA&&k.DATA.on===true&&typeof k.view==='function'?k:null; };
const host=()=>Sys.host;
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sfx=n=>{ try{ if(typeof snd==='function') snd(n); }catch(e){} };
const nf=v=>{ try{ return typeof kf==='function'?kf(v):String(v); }catch(e){ return String(v); } };
const RES={gold:'moedas',forge:'pedras de forja',practice:'pedras de treino'};
const WHY={off:'O Acampamento está fechado agora.',locked:'O Acampamento abre no nível 20.',pet:'Esse pet não pode trabalhar (é o principal ou não é seu).',busy:'Esse pet já está em outra tenda.',full:'A tenda já tem 2 pets.',
  fixed:'A Tenda do Ouro não tem melhoria.',max:'A tenda já está no nível máximo.',money:'Falta ouro para melhorar.',empty:'As tendas ainda não juntaram nada.'};
const petName=id=>{ try{ const d=Sys.pet.DATA.pets.find(p=>p.id===id); return d?d.name||id:id; }catch(e){ return id; } };
function tentHtml(t,idle){ const u=t.upgrade||{}, can=u.ok===true;
  return `<div style="flex:none;padding:10px;border-radius:14px;background:#1d1611;border:2px solid ${t.full?'#ffc94a':'#3a2c1f'};display:flex;flex-direction:column;gap:6px">
    <div style="display:flex;justify-content:space-between;font-weight:900"><span>${esc(t.name)} · Nv ${t.lv}</span><span>${nf(t.stored)} / ${nf(t.cap)} ${RES[t.res]||''}</span></div>
    <div style="height:8px;border-radius:4px;background:#2f241a"><i style="display:block;height:100%;width:${t.pct}%;border-radius:4px;background:#ffc94a"></i></div>
    <small style="color:#c9b9a2">${t.perHour} por hora${t.full?' · CHEIA':''}</small>
    <div style="display:flex;flex-wrap:wrap;gap:6px">${t.pets.map(p=>`<button data-x="unpet" data-p="${esc(p)}" class="pr2-btn">${esc(petName(p))} ×</button>`).join('')}
      ${t.pets.length<t.slots&&idle.length?idle.map(p=>`<button data-x="pet" data-t="${esc(t.id)}" data-p="${esc(p)}" class="pr2-btn ghost">+ ${esc(petName(p))}</button>`).join(''):''}</div>
    ${u.reason==='fixed'?'':`<button data-x="up" data-t="${esc(t.id)}" aria-disabled="${!can}" class="pr2-btn">${u.reason==='max'?'Nível máximo':'Melhorar · '+nf(u.cost||0)+' de ouro'}</button>`}</div>`; }
function render(){ const d=xDims(560), k=K();
  if(!k){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;font-weight:800;color:#c9b9a2">${WHY.off}</div>`); return; }
  let v=null; try{ v=k.view(S,host()); }catch(e){ v=null; }
  if(!v||v.locked){ V.innerHTML=xWrap(d,'',`<div role="alert" style="flex:1;display:flex;align-items:center;justify-content:center;padding:24px;font-weight:800;color:#c9b9a2">${WHY.locked}</div>`); return; }
  const any=v.tents.some(t=>t.stored>0);
  V.innerHTML=xWrap(d,'',`<div style="flex:1;overflow:auto;display:flex;flex-direction:column;gap:8px;padding:6px 4px"><p style="margin:0;color:#c9b9a2;font-weight:700">${esc(v.text)}</p>
    ${v.tents.map(t=>tentHtml(t,v.idlePets)).join('')}${X.msg?`<div role="status" style="font-weight:800;color:#ffc94a">${esc(X.msg)}</div>`:''}</div>
    <div style="flex:none;display:flex;gap:8px;padding:6px 2px;padding-bottom:max(10px,env(safe-area-inset-bottom))"><button data-x="back" class="pr2-btn ghost" style="flex:1;min-height:52px">Voltar</button><button data-x="collect" aria-disabled="${!any}" class="pr2-btn" style="flex:2;min-height:52px">Coletar tudo</button></div>`); }
function click(b){ const a=b&&b.dataset?b.dataset.x:'', ds=(b&&b.dataset)||{}, k=K(); if(a==='back'){ sfx('ui_tap'); try{ Screens.close(); }catch(e){} return; } if(!k) return; let r=null;
  try{ if(a==='collect') r=k.collect(S,host()); else if(a==='up') r=k.upgrade(S,host(),ds.t); else if(a==='pet') r=k.assign(S,host(),ds.t,ds.p); else if(a==='unpet') r=k.unassign(S,host(),ds.p); else return; }catch(e){ r=null; }
  if(r&&r.ok){ sfx('claim'); if(a==='collect'){ const g=r.got||{}; X.msg='Coletou: '+['gold','forge','practice'].filter(x=>g[x]>0).map(x=>'+'+nf(g[x])+' '+RES[x]).join(' · '); } else X.msg=a==='up'?'Tenda no nível '+r.lv:''; try{ if(typeof save==='function') save(); if(typeof hud==='function') hud(); }catch(e){} }
  else { sfx('ui_tap'); X.msg=WHY[r&&r.reason]||'Não deu agora.'; }
  render(); }
const def=Panels.add('camp',{title:'Acampamento',render:render,click:click,actions:ACTIONS,tick(){ try{ if(typeof view==='undefined'||view!=='camp') return; const k=K(); const s=k?k.view(S,host()).tents.map(t=>t.stored+'/'+t.lv+'/'+t.pets.length).join('|'):'off'; if(s!==X.sig){ X.sig=s; render(); } }catch(e){} },onOpen(){ X.msg=''; }});
window.PCamp={X:X,actions:ACTIONS,def:def};
})();
```

**Chaves, em ordem:** L1 e L2 → K1-K3 e o `js/p_camp.js` → F1/F2 (o Bem-vindo) → QA confere a tela → `PANEL_ON.camp = true` (o item do Menu só aparece com a tela ligada, pelo `fbHasScreen`) → `SYS_LIVE.camp = true` (sem a chave, o módulo não acumula nem escreve no save).

---

## Resumo: o que ligar, em que ordem

| # | Recompensa | Patches | Chave | Estado |
|---|---|---|---|---|
| 1 | Fogueira (tempo fora com a entrada nova) | F1, F2, F3 (F4 opcional) | nenhuma nova | colar já: hoje ninguém recebe Brasas do tempo fora |
| 2 | Encruzilhada (bênçãos que acabaram) | C1, C2 | nenhuma nova | colar já |
| 3 | Fim das eras: aviso do marco | E1 | nenhuma | colar já |
| 4 | Mapa: "!" do baú no Menu | M1, M2 | nenhuma | colar já |
| 5 | Forja Astral | E2-E6 | `Sys.forge.setForge20` (PO) | colar já; aparece no pós-eras |
| 6 | Acampamento | L1, L2, K1-K6, `js/p_camp.js` | `PANEL_ON.camp`, depois `SYS_LIVE.camp` | depois do voto na tela |
| 7 | Ladrão de Brasas | L1, L2, T1-T4 + tela do Engenheiro | `PANEL_ON.thief`, depois `SYS_LIVE.thief` | depois do protótipo e do voto |
| 8 | Derrota com prêmio | nenhum | `SYS_LIVE.bossLoss` (já ligada) | pronto |

## Lacunas encontradas

1. **Fogueira sem tempo fora** com a entrada nova ligada (seção 1): defeito do jogo, corrigido por F1-F3.
2. **Fontes 'chest' e 'missions' da Fogueira** não eram chamadas por ninguém: corrigido nos módulos (`Sys.chest`, `Sys.pass`), com teste.
3. **Encruzilhada apagava uma fase tarde** (na 1ª vitória da era nova, não na do Senhor da Era): corrigido no `Sys.crossroads`, com teste.
4. **Forja Astral não entrava na FC**: corrigido no `Sys.stats`, com teste.
5. **`Sys.thief` e `Sys.camp` não são carregados** pelo `index.html` (L1).
6. **Ladrão de Brasas online**: o servidor tem as rotas (`/v1/thief/*`), mas não há camada no jogo que as chame (como `arenanet.js`). Com o servidor ligado, as entradas locais (`Sys.thief`) e as do servidor contam separadas. Pedido para o Servidor/Sistemas: um `Sys.thiefNet` que, online, troque `enter/finish/sweep` pelas rotas e chame `Sys.bonfire.addBrasas(S,'thief',brasas)` com o valor do servidor.
7. **Ícone do Acampamento** no Menu: não existe `assets/icons/menu/camp.png` (K2 usa o da guilda, provisório). Pedido para a Arte.
8. **Ladrão sem protótipo** em `docs/proto/v2`: a tela precisa passar pelo voto do dono.
