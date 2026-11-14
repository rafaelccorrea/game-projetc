# Ligações do social e do Perfil: Dupla, Molduras, Fogueira da Guilda, Mentores, Conjuntos

Sistemas para o Engenheiro (fps-c8). Ordem do dono: tudo o que foi aprovado tem de funcionar dentro do jogo. Os módulos (`js/sys/*`) estão
prontos e testados; aqui estão as ligações que faltam nos arquivos do Engenheiro, em blocos **ANTES → DEPOIS** prontos para colar.

- Base: `master` em 61f1017 mais a árvore de trabalho de agora (`js/battle.js` com a afinidade ainda não commitada; `js/p_duo.js` em escrita).
- Cada ANTES aparece **uma vez só** no arquivo. Use substituição exata (Edit), nunca por número de linha.
- **Conferido:** os 25 blocos foram aplicados em cópias dos arquivos (`index.html`, `js/farm.js`, `js/battle.js`, `js/p_arena.js`, `js/onlineboot.js`,
  `js/fullbattle.js`, `js/screens.js`, `js/p_guild2.js`, `js/p_profile2.js`): cada âncora foi achada uma vez e `node --check` passou em todos.
  No `index.html` a conferência foi feita nos 3 scripts embutidos. Também rodei em node, com os módulos de verdade: `frameTag` (com arte, sem pacote,
  id desconhecido, `none`) e `duoTrack` (chave desligada não conta; com dupla conta os 4 contadores).
- Nada aqui liga módulo novo sem a chave: com a chave desligada, cada gancho não faz nada.

## 1. O que já está ligado (conferido no código)

| Item | Já está | Falta |
|---|---|---|
| Perfil V5 | `SYS_LIVE.profile = true` (61f1017) e a tela `js/p_profile2.js`. Recordes: `stage`, `tower`, `arenaRank`, `arenaLeague`, `arenaLp` (pelo `Sys.profile.sync` ao abrir o Perfil), `fc` (`sampleFC` no `sysBoot` e no `index.html` ao mudar o herói), `hit`, `streak` e `bossTime` (`profRec` em `js/battle.js`), `goldDay` (`addDaily` no `addGold` do `Sys.host`). Moldura na grade e no cabeçalho do Perfil (`frImg`/`frCss`, arte das 9; sem arte vale o anel CSS). | Só o recorde **`runKills`** ("Mais abates numa sessão") não tem gancho: **R1**. As 10 molduras VIP ficam no anel CSS até a arte chegar: **F7** (aplicar com a arte). |
| Mentores | Módulo carregado (`'mentors'` na lista do `index.html`); a Provação lê `Sys.mentors.byEra`; o `Sys.fc` soma o `bonus(S)` sozinho. | Chave desligada (**L1**), entrada do Menu (**D7**, **D8**) e a tela (`js/p_mentors.js`, não existe). |
| Dupla das Eras | A tela `js/p_duo.js` está em escrita (ainda fora do git): usa `Sys.duo.view/status/canSend`, `Sys.duoNet.start/refresh/friendCode` e as 7 ações, e expõe `window.PDuo.alerts()`. | Os módulos `duo` e `duonet` **não estão na lista de carga** do `index.html` (**M1**), nenhum contador é avisado (**D1-D4**), o online não inicia a Dupla (**D5**, **D6**), sem item no Menu (**D7**, **D8**), tela fora da lista do `js/screens.js` (**S1**), chaves (**L1**). |
| Molduras fora do Perfil | Nada. | Fonte única + HUD (**F1-F3**), Arena (**F4-F6**), cartão da Dupla (seção 4.3). |
| Fogueira da Guilda | Nada. O módulo `guildfire` **não está na lista de carga**. | **M1** (com `'guildfirenet'`), **L1** e a 8ª aba (**G1-G6**). O `js/sys/guildfirenet.js` **já existe** (Sistemas, seção 8). |
| Conjuntos salvos | Nada (sem voto do dono). O módulo `loadouts` não está na lista de carga. | Só **M1** (carregar com a chave desligada não muda nada). API na seção 7.2. |

## 2. Chaves: o que ligar, em que ordem, e o que o servidor precisa

| Passo | No jogo | No servidor | Quando |
|---|---|---|---|
| 1 | Aplicar **M1, L1, R1, F1-F6, D1-D8, S1, G1-G6**. Com isso: Mentores ligado (`SYS_LIVE.mentors`); Perfil com `runKills`; moldura no HUD e na lista da Arena; o resto fica parado atrás das chaves. | nada | já |
| 2 | Dupla: `PANEL_ON.duo = true` e, **no mesmo build**, `SYS_LIVE.duo = true` e `SYS_LIVE.duoNet = true`. | `DUO_ON=1` (fps-server; desligado, toda rota da dupla dá 404 e o `Sys.duoNet.start` fica no provider local: a tela mostra "abre com o online"). | depois do QA da tela |
| 3 | Fogueira: o `js/sys/guildfirenet.js` **já foi entregue** (Sistemas) e o `'guildfirenet'` já está logo depois de `'guildfire'` na lista do M1. Depois `SYS_LIVE.guildFire = true` e `SYS_LIVE.guildFireNet = true` (no mesmo build). A aba só aparece com os dois e o online da guilda iniciado. | `GUILDFIRE_ON=1` (baú automático pelo correio já está no servidor, fps-server 679191b). Precisa também do `Sys.guildNet` ligado (já está: `DATA.on = true`). | depois do `guildfirenet.js` |
| 4 | Mentores: tela `js/p_mentors.js`, `'p_mentors'` na lista do `js/screens.js` (como o S1) e a chave da tela. A chave do módulo já foi no passo 1. | nada (tudo no save) | quando a tela existir |
| 5 | Moldura de OUTRO jogador (Arena, Dupla): já desenha quando o dado chegar. | Aceitar `look.frame` no `POST /arena/snapshot` (hoje "campo desconhecido some") e mandar `partner.frame` no `GET /duo`. | quando o Servidor puder |
| 6 | Conjuntos: `SYS_LIVE.loadouts = true` + tela. | nada | só com o voto do dono |

**Mentores, regra dura:** a chave tem de ser ligada pelo `SYS_LIVE` (o `sysLive()` é a 1ª linha do `sysBoot`, antes do `Sys.titles.ensure` do `sysBootE2`).
Ligada depois do 1º `Sys.titles.ensure`, o `Sys.titles` apaga do save os 9 títulos `mentor_*` (o `Sys.mentors.sync` regrava, mas o jogador vê sumir).
Os módulos sem `setOn` (`duoNet` e `guildFireNet`) também ligam pelo `SYS_LIVE`: o `sysLive` põe `DATA.on = true`.

## 3. Carga dos módulos e chaves

**M1 · `index.html` · Lista de módulos: duo, duonet, guildfire, guildfirenet e loadouts entram antes do 'fc'**

ANTES (exato, aparece uma vez):

```js
'trial','pathtry','mapchest','assets'],['fc','advice','bossloss'])
```

DEPOIS:

```js
'trial','pathtry','mapchest','assets','duo','duonet','guildfire','guildfirenet','loadouts'],['fc','advice','bossloss'])
```

**L1 · `js/farm.js` · Chaves dos módulos (SYS_LIVE): Mentores agora; Dupla, Fogueira e Conjuntos esperando**

ANTES (exato, aparece uma vez):

```js
const SYS_LIVE = { bonfire: true, bossLoss: true, crossroads: true, erasEnd: true, profile: true, mapChest: true };
```

DEPOIS:

```js
const SYS_LIVE = { bonfire: true, bossLoss: true, crossroads: true, erasEnd: true, profile: true, mapChest: true,
  mentors: true,                  /* Mentores: TEM de ligar AQUI. O sysLive roda antes do Sys.titles.ensure do sysBootE2; ligado depois, os títulos mentor_* somem do save */
  duo: false, duoNet: false,      /* Dupla das Eras: ligar os DOIS juntos (tela js/p_duo.js com PANEL_ON.duo e servidor com DUO_ON=1) */
  guildFire: false, guildFireNet: false,   /* Fogueira da Guilda: ligar os DOIS juntos, com o servidor em GUILDFIRE_ON=1 (js/sys/guildfirenet.js já existe) */
  loadouts: false };              /* Conjuntos salvos: o dono ainda não votou */
```

**S1 · `js/screens.js` · Tela da Dupla na lista de carga (js/p_duo.js já existe na árvore; 'p_mentors' entra do mesmo jeito quando o arquivo existir)**

ANTES (exato, aparece uma vez):

```js
'p_codex','p_mail','p_mail2','p_chat',
```

DEPOIS:

```js
'p_codex','p_mail','p_mail2','p_chat','p_duo',
```

## 4. Dupla das Eras

### 4.1 Contadores (o que o jogador fez no dia)
`Sys.duo.track(S, host, kind, n)` com `kind` em `kills`, `bossKills`, `stages`, `arenaWins`. Só conta com a chave ligada **e** com dupla; o teto do dia
é do módulo. O envio ao servidor (`POST /duo/progress`, os TOTAIS do dia) é do `Sys.duoNet.refresh`; o jogo não chama rede nenhuma aqui.
Um ponto só (`duoTrack`, no `index.html`), chamado pelo `ptrack` (abates e chefes), pela vitória de fase e pela vitória na Arena (local e servidor).
Instância e Provação não contam (a batalha não chama `ptrack` nelas).

**D1 · `index.html` · Dupla: duoTrack + abates e chefes pelo ptrack**

ANTES (exato, aparece uma vez):

```js
function ptrack(ev,n){ const v=n==null?1:n;
```

DEPOIS:

```js
/* DUPLA DAS ERAS (Sys.duo, js/sys/duo.js): soma o que o jogador fez no dia (kills, bossKills, stages, arenaWins). Chave desligada ou sem dupla = não conta nada.
   O teto por dia e o envio ao servidor (POST /duo/progress, pelo refresh do Sys.duoNet) são do módulo. */
function duoTrack(kind,n){ try{ const D=window.Sys&&Sys.duo; if(D&&D.DATA&&D.DATA.on===true&&Sys.host) D.track(S,Sys.host,kind,n==null?1:n); }catch(e){} }
function ptrack(ev,n){ const v=n==null?1:n;
  if(ev==='kill'||ev==='boss') duoTrack(ev==='kill'?'kills':'bossKills',v);   /* Dupla das Eras: abates e chefes (fora da instância: a batalha só chama ptrack fora dela) */
```

**D2 · `js/battle.js` · Dupla: fase vencida**

ANTES (exato, aparece uma vez):

```js
if(typeof fogBrasa==='function') fogBrasa('stage',1);
```

DEPOIS:

```js
if(typeof fogBrasa==='function') fogBrasa('stage',1); if(typeof duoTrack==='function') duoTrack('stages',1);   /* Dupla das Eras: fase vencida */
```

**D3 · `js/p_arena.js` · Dupla: vitória na Arena (luta local)**

ANTES (exato, aparece uma vez):

```js
    const r=Sys.arena.fight(S,h,opp.id); if(!r.ok){ paToast(r.reason==='tries'?'Sem lutas hoje: recarrega à meia-noite':'Luta indisponível agora'); return; }
```

DEPOIS:

```js
    const r=Sys.arena.fight(S,h,opp.id); if(!r.ok){ paToast(r.reason==='tries'?'Sem lutas hoje: recarrega à meia-noite':'Luta indisponível agora'); return; }
    if(r.win&&typeof duoTrack==='function') duoTrack('arenaWins',1);   /* Dupla das Eras: vitória na Arena */
```

**D4 · `js/p_arena.js` · Dupla: vitória na Arena (luta do servidor, inclusive resposta atrasada)**

ANTES (exato, aparece uma vez):

```js
  const done=r=>{ if(!XA2.wait||XA2.wait.tok!==tok){
```

DEPOIS:

```js
  const done=r=>{ if(r&&r.ok&&r.win&&typeof duoTrack==='function') duoTrack('arenaWins',1);   /* Dupla das Eras: vitória na Arena online (conta também a resposta que chegou com a tela fechada) */
    if(!XA2.wait||XA2.wait.tok!==tok){
```

### 4.2 Início com o online e ritmo do refresh
O `Sys.duoNet.start` entra na mesma lista do `arenaNet`/`guildNet`, depois do boot online (só com `r.ok` e a chave do módulo ligada).
`'guildFireNet'` já entra na lista (o `Sys.guildFireNet.start(S, host)` só age com `SYS_LIVE.guildFireNet`; desligado devolve `{ok:false, reason:'off'}` sem rede).
Ritmo: a cada 3 min com o jogo visível e na volta ao jogo; com a tela da Dupla aberta quem lê é a própria tela (`poll` de 10-30 s do `js/p_duo.js`).
Cada refresh da Dupla = 1 `POST /duo/progress` (só se mudou) + 1 `GET /duo`.

**D5 · `js/onlineboot.js` · Dupla e Fogueira: início depois do boot online**

ANTES (exato, aparece uma vez):

```js
for (const k of ['arenaNet', 'guildNet'])
```

DEPOIS:

```js
for (const k of ['arenaNet', 'guildNet', 'duoNet', 'guildFireNet'])
```

**D6 · `js/onlineboot.js` · Dupla e Fogueira: ritmo do refresh**

ANTES (exato, aparece uma vez):

```js
  try { setInterval(() => { try { playTick(); } catch (e) {} }, 1000); } catch (e) {}
```

DEPOIS:

```js
  try { setInterval(() => { try { playTick(); } catch (e) {} }, 1000); } catch (e) {}

  /* DUPLA DAS ERAS e FOGUEIRA DA GUILDA (Sys.duoNet / Sys.guildFireNet): depois do start (lista acima), um refresh a cada 3 min com o jogo visível
     (manda o progresso do dia da Dupla e traz convites, frases e chamas) e na volta ao jogo. Com a tela da Dupla aberta quem lê é a própria tela
     (js/p_duo.js, poll de 10-30 s): aqui fica parado. Com a Guilda aberta, a Fogueira a cada 60 s. Só módulo com a chave ligada e INICIADO
     (state().started). Falha de rede não aparece para o jogador (só no console, em debug). */
  const SOC = { at: {} }, SOC_OWN = { duoNet: ['duo'], guildFireNet: [] }, SOC_FAST = { duoNet: [], guildFireNet: ['guild2', 'guild'] };
  function socTick(force) { try { if (!ST.booted || document.visibilityState !== 'visible') return;
      const now = Date.now(); let cur = ''; try { cur = (W.Screens && typeof W.Screens.current === 'function') ? String(W.Screens.current() || '') : ''; } catch (e) {}
      for (const k of ['duoNet', 'guildFireNet']) { const M = X()[k];
        if (!M || !M.DATA || M.DATA.on !== true || typeof M.refresh !== 'function' || typeof M.state !== 'function' || !M.state().started) continue;
        if (SOC_OWN[k].indexOf(cur) >= 0) continue;
        const gap = SOC_FAST[k].indexOf(cur) >= 0 ? 60000 : 180000; if (!force && now - (SOC.at[k] || 0) < gap) continue; SOC.at[k] = now;
        Promise.resolve(M.refresh(S, X().host)).then(null, e => dbg(k + ' refresh falhou', e)); } } catch (e) {} }
  try { setInterval(() => socTick(false), 5000); document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') socTick(true); }); } catch (e) {}
```

### 4.3 Menu e tela
O item só aparece com a tela registrada e ligada (`fbHasScreen`: `Panels.defs.duo` e `PANEL_ON.duo`) e no nível 16. O selo usa `window.PDuo.alerts()`.

**D7 · `js/fullbattle.js` · Menu: liberação da Dupla e dos Mentores no nível 16**

ANTES (exato, aparece uma vez):

```js
const FB_UNLOCK = { map: 1, codex: 12, chat: 16,
```

DEPOIS:

```js
const FB_UNLOCK = { map: 1, codex: 12, chat: 16, duo: 16, mentors: 16,
```

**D8 · `js/fullbattle.js` · Menu: entradas Dupla e Mentores (só aparecem com a tela registrada)**

ANTES (exato, aparece uma vez):

```js
  { id: 'chat',     icon: 'chat',      label: 'Chat',       act: 'soon:chat' },   /* nível 16 (PO) */
```

DEPOIS:

```js
  { id: 'chat',     icon: 'chat',      label: 'Chat',       act: 'soon:chat' },   /* nível 16 (PO) */
  { id: 'duo',      icon: 'chat',      label: 'Dupla',      act: 'soon:duo', alerts: () => duoAlerts() },   /* Dupla das Eras (nível 16; Sys.duo). Ícone PROVISÓRIO = o do Chat, até a Arte entregar assets/icons/menu/duo.png */
  { id: 'mentors',  icon: 'codex',     label: 'Mentores',   act: 'soon:mentors' },   /* Mentores (nível 16; Sys.mentors). Ícone PROVISÓRIO = o do Códex, até a Arte entregar assets/icons/menu/mentors.png */
```

**O que cada botão da tela chama** (todas as ações são `Sys.duoNet.*`, Promise; com o online iniciado, chamar o `Sys.duo.*` síncrono devolve `{ok:false, reason:'online'}`):

| Botão | Chamada | Resposta boa | Recusas (`reason`) |
|---|---|---|---|
| (abrir) | `Sys.duo.view(S, host)` para desenhar; `Sys.duoNet.state()` `{on, started, err, code, invitesLeft, msgLeft, cap}`; `Sys.duoNet.start(S, host)` se `on` e não `started` | `view`: `partner {id, name, since, last, lv, era}`, `invitesIn[]`, `daily`, `weekly[]`, `phrases[]`, `chat[]`, `msgLeft`, `relinkLeft`, `needLevel` | `view().open === false` com `reason` `level` / `off` |
| Meu código | `Sys.duoNet.friendCode()` (só se `state().code` vier vazio) | `{ok, code}` | rede |
| Convidar | `Sys.duoNet.invite(S, host, código)` (campo só A-Z e 0-9, 6 a 10) | `{ok, expiresAt, left}` | `code`, `paired`, `relink` (+`retryAfterMs`), `self`, `target_paired`, `target_level`, `dup`, `limit`, `limit_out`, `target_full`, `level` |
| Aceitar | `Sys.duoNet.accept(S, host, invitesIn[i].id)` | `{ok}` (o refresh já pareia) | `invite`, `paired`, `relink` |
| Recusar | `Sys.duoNet.decline(S, host, invitesIn[i].id)` | `{ok}` | `invite` |
| Sair (2 toques) | `Sys.duoNet.leave(S, host)` | `{ok, relinkMs, relinkAt}`: só quem sai espera 24 h | `none` |
| Bloquear (2 toques) | `Sys.duoNet.block(S, host, id)`; sem `id` = o parceiro; serve também num convite recebido | `{ok}` (o bloqueado não é avisado) | `id` |
| Frase | antes: `Sys.duo.canSend(S, host, idx)` para apagar o botão; depois `Sys.duoNet.send(S, host, idx)` (SÓ o índice 0-17) | `{ok, idx, txt, left}` | `wait` (+`ms`), `day`, `repeat`, `phrase`, `none` |
| Resgatar | `Sys.duoNet.claim(S, host, id)` com `id` em `daily`, `boss200`, `stages40`, `arena20`, `days5` | `{ok, mailed:true, reward}`: **o prêmio chega pelo correio**; o jogo só marca e não paga (texto "Prêmio enviado ao seu correio"). Servidor antigo, sem `mailed`: `{ok, reward:{gold, stones}}` pago uma vez pelo `Sys.duo` | `claimed` (marca sem pagar), `presence`, `done`, `none` |

Não há "desbloquear" no servidor: não pôr o botão (o `Sys.duo.unblock` é só local).
**Cartão do parceiro com moldura:** `frameTag(v.partner.frame, true)` dentro de um quadro de lado = retrato / 0,625, centrado no retrato (como o `fb_frm`
do F2). Hoje o `GET /duo` não manda `partner.frame` (seção 8): `frameTag` com id vazio devolve `''` e o cartão fica como está.

## 5. Molduras (9 do Perfil + VIP 1-10)

Dados: `Sys.profile.DATA.frames` (id, nome, raridade, como ganhar); `Sys.profile.frames(S, host)` (lista com `owned`/`equipped`);
`Sys.profile.equipped(S, host).frame` (o que desenhar; `'none'` = nenhuma); `Sys.profile.equip(S, host, 'frame', id)` → `{ok}` ou
`{ok:false, reason:'falta', how, go}`. Só visual, nada de atributo. Arte: `assets/ui/frames/<id>.png` (256x256, janela de 160 no centro), no pacote
fast-follow `ui:frames`: `Sys.assets.isReady(caminho)` diz se o pacote já chegou; `Sys.assets.url(caminho)` dá o caminho do pacote baixado.
Hoje há arte das 9 (`none`, `bronze`, `prata`, `ouro`, `cristal`, `eterna`, `nine_eras`, `mark100`, `mark150`); das 10 VIP ainda não.

Onde a moldura aparece: HUD (retrato redondo de 50 px), Perfil (já está), lista da Arena (retrato do adversário), cartão do parceiro na Dupla.
Sem arte, sem pacote ou com erro ao carregar: anel em CSS na cor da raridade. Chave do `Sys.profile` desligada: nenhuma moldura.

**F1 · `js/fullbattle.js` · Molduras: fonte única (frameMine, frameTag) e selo da Dupla no Menu**

ANTES (exato, aparece uma vez):

```js
function fbInit(){ fbLegacy(); fbCss();
```

DEPOIS:

```js
/* ================= MOLDURA DO RETRATO (Sys.profile, js/sys/profile.js; aprovadas: 9 molduras + VIP 1-10) =================
   Fonte única para o HUD, a Arena e a Dupla (o Perfil V5 tem a dele, que faz o mesmo). Arte: assets/ui/frames/<id>.png, 256x256 com janela de
   160 no centro: o retrato ocupa 62,5% do quadro. A arte vem no pacote 'ui:frames' (fast-follow): sem o pacote (Sys.assets.isReady), sem o
   arquivo ou com erro ao carregar, vale um anel em CSS na cor da raridade. Chave do módulo desligada = nenhuma moldura (o jogo fica como hoje).
   Id de outro jogador (Arena, Dupla) só vale se estiver na tabela do módulo: id desconhecido não desenha nada. */
const FRAME_RC = ['#a9b3c9', '#4fa3ff', '#b46bff', '#ff4f6d', '#ffa434', '#8ff5ff'];
function frameMine(){ try { const P = window.Sys && Sys.profile; if (!P || !P.DATA || P.DATA.on !== true || typeof P.equipped !== 'function') return null;
    const e = P.equipped(S, Sys.host); return e && typeof e.frame === 'string' && e.frame !== 'none' ? e.frame : null; } catch (e) { return null; } }
function frameRar(id){ try { const f = Sys.profile.DATA.frames.find(x => x.id === id); return f ? Math.max(0, Math.min(5, f.r | 0)) : -1; } catch (e) { return -1; } }
/* HTML que ENCHE um quadro posicionado (position absolute/relative) de lado = retrato / 0,625. round = retrato redondo (o anel CSS também). */
function frameTag(id, round){ if (typeof id !== 'string' || id === 'none') return ''; const r = frameRar(id); if (r < 0) return '';
  const c = FRAME_RC[r], ring = d => `<span style="position:absolute;inset:18.75%;border-radius:${round ? '50%' : '14%'};border:3px solid ${c};box-shadow:0 0 10px ${c},inset 0 0 0 2px rgba(5,8,28,.7);box-sizing:border-box;pointer-events:none;display:${d}"></span>`;
  let u = 'assets/ui/frames/' + id + '.png', ok = true; try { const A = Sys.assets; if (A && typeof A.isReady === 'function') ok = A.isReady(u); if (ok && A && typeof A.url === 'function') u = A.url(u); } catch (e) {}
  if (!ok) return ring('block');
  return `<img src="${u}" alt="" draggable="false" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;pointer-events:none" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='block'">` + ring('none'); }
/* selo do item Dupla no Menu: o da tela (window.PDuo.alerts, js/p_duo.js: convites ou frases novas); sem ela, convites + prêmios prontos */
function duoAlerts(){ try { if (window.PDuo && typeof PDuo.alerts === 'function') return PDuo.alerts() | 0; const D = window.Sys && Sys.duo; if (!D || !D.DATA || D.DATA.on !== true) return 0; const v = D.view(S, Sys.host); if (!v || !v.open) return 0;
    return (v.invitesIn || []).length + (v.partner ? (v.daily && v.daily.done && !v.daily.claimed ? 1 : 0) + (v.weekly || []).filter(m => m.done && !m.claimed).length : 0); } catch (e) { return 0; } }
function fbInit(){ fbLegacy(); fbCss();
```

**F2 · `js/fullbattle.js` · Molduras: quadro da moldura no retrato do HUD**

ANTES (exato, aparece uma vez):

```js
<span class="lil" id="fb_lv" style="position:absolute;left:50%;bottom:-8px;
```

DEPOIS:

```js
<span id="fb_frm" aria-hidden="true" style="position:absolute;left:-11px;top:-11px;width:80px;height:80px;pointer-events:none;display:none"></span><span class="lil" id="fb_lv" style="position:absolute;left:50%;bottom:-8px;
```

**F3 · `js/fullbattle.js` · Molduras: HUD troca a moldura quando o jogador troca (no máximo 1 leitura por segundo)**

ANTES (exato, aparece uma vez):

```js
fbSet('fb_lv', h.text); if (FBK.ring !== deg){ FBK.ring = deg; document.getElementById('fb_ring').style.background = `conic-gradient(#5ff0cf ${deg}deg,rgba(255,255,255,.16) 0)`; } } catch (e) {}
```

DEPOIS:

```js
fbSet('fb_lv', h.text); if (FBK.ring !== deg){ FBK.ring = deg; document.getElementById('fb_ring').style.background = `conic-gradient(#5ff0cf ${deg}deg,rgba(255,255,255,.16) 0)`; } } catch (e) {}
  { const now = Date.now(); if (!(FBK.frmT > now)){ FBK.frmT = now + 1000; const fid = frameMine(), fe = document.getElementById('fb_frm');   /* moldura do Perfil (Sys.profile): o retrato de 50 px fica na janela da arte (80 px) */
      if (fe && (FBK.frm !== fid || fe.dataset.f !== String(fid))){ FBK.frm = fid; fe.dataset.f = String(fid); fe.innerHTML = fid ? frameTag(fid, true) : ''; fe.style.display = fid ? 'block' : 'none'; } } }
```

**F4 · `js/p_arena.js` · Molduras: moldura do adversário na lista (vem no look do retrato do servidor)**

ANTES (exato, aparece uma vez):

```js
function paLobby(){
```

DEPOIS:

```js
/* moldura do adversário (look.frame do retrato no servidor; bot não tem). frameTag é a fonte única (js/fullbattle.js); id desconhecido = nada */
const paFrame=p=>{ const id=p&&p.look&&typeof p.look.frame==='string'?p.look.frame:null, h=id&&typeof frameTag==='function'?frameTag(id,false):''; return h?'<span style="position:absolute;left:-8px;top:-8px;right:-8px;bottom:-8px;pointer-events:none">'+h+'</span>':''; };
function paLobby(){
```

**F5 · `js/p_arena.js` · Molduras: retrato da lista com a moldura por cima**

ANTES (exato, aparece uma vez):

```js
      <span aria-hidden="true" style="flex:none;width:54px;height:54px;border-radius:12px;overflow:hidden;position:relative;background:#2a1f16;border:2px solid ${dcol[d.id]||'#6b5843'}"><span style="position:absolute;left:-13px;top:-6px;width:80px;height:80px;display:block;transform:scaleX(-1)"><span class="pa-kid" style="position:absolute;inset:0;display:block"></span></span></span>
```

DEPOIS:

```js
      <span aria-hidden="true" style="flex:none;position:relative;display:flex"><span style="flex:none;width:54px;height:54px;border-radius:12px;overflow:hidden;position:relative;background:#2a1f16;border:2px solid ${dcol[d.id]||'#6b5843'}"><span style="position:absolute;left:-13px;top:-6px;width:80px;height:80px;display:block;transform:scaleX(-1)"><span class="pa-kid" style="position:absolute;inset:0;display:block"></span></span></span>${paFrame(p)}</span>
```

**F6 · `js/p_arena.js` · Molduras: a minha moldura vai no retrato da Arena (heroSnapshot)**

ANTES (exato, aparece uma vez):

```js
    if(L.wItem) k.weapon={e:Math.max(0,Math.min(20,L.wItem.e|0)),r:Math.max(0,Math.min(4,L.wItem.r|0)),type:id(L.wItem.type)}; }catch(e){}
```

DEPOIS:

```js
    if(L.wItem) k.weapon={e:Math.max(0,Math.min(20,L.wItem.e|0)),r:Math.max(0,Math.min(4,L.wItem.r|0)),type:id(L.wItem.type)}; }catch(e){}
  try{ const fm=typeof frameMine==='function'?frameMine():null; if(fm&&id(fm)) out.look.frame=fm; }catch(e){}   /* moldura do Perfil (só visual; o servidor precisa aceitar look.frame) */
```

**F7 · `js/p_profile2.js` · Molduras: as 10 VIP entram na lista de arte do Perfil (aplicar QUANDO a Arte entregar assets/ui/frames/vip1..vip10.png; até lá ficam no anel CSS)**

ANTES (exato, aparece uma vez):

```js
const FRI=['none','bronze','prata','ouro','cristal','eterna','nine_eras','mark100','mark150'], FRX={};
```

DEPOIS:

```js
const FRI=['none','bronze','prata','ouro','cristal','eterna','nine_eras','mark100','mark150','vip1','vip2','vip3','vip4','vip5','vip6','vip7','vip8','vip9','vip10'], FRX={};
```

## 6. Fogueira da Guilda (8ª aba da Guilda V2)

Dados: `Sys.guildFire.view(S, host)` → `{on, open, reason, online, level, name, into, need, frac, max, flames, mine, free (grátis ainda disponível),
freeFlames, braLeft, brasaHook, perks, perksText, next:{level, perks, chest:{gold, stones, food}}, chests}`. Bônus: `Sys.guildFire.perks(S)` → `{goldPct, xpPct}`.
Dar Brasas usa o gancho `Sys.bonfire.spendBrasas(S, n, 'guildFire')` (já existe no `js/sys/bonfire.js`); o estoque é `Sys.bonfire.ensure(S).bra`.
**Os baús vão SOZINHOS pelo correio** (servidor, PO 14/11): a aba não tem botão de resgatar e nunca chama `Sys.guildFire.claim`.
Tudo o que muda passa pelo `Sys.guildFireNet.feed(S, host, n)` (n = 0 grátis; n > 0 Brasas; **já existe**, seção 8). Sem as chaves ligadas a aba não
aparece (`fireOn()` exige o módulo iniciado), então os blocos abaixo podem entrar já.

**G1 · `js/p_guild2.js` · Fogueira: textos das recusas**

ANTES (exato, aparece uma vez):

```js
  net_off:'Sem conexão: tente de novo',timeout:
```

DEPOIS:

```js
  brasas:'Faltam Brasas: jogue para ganhar mais na sua Fogueira',brasas_over:'Essas Brasas ainda não chegaram ao servidor: jogue um pouco e tente de novo',
  brasas_unverified:'Seu progresso ainda não foi enviado: tente de novo em instantes',hook:'Dar Brasas ainda não está disponível',done:'Já feito hoje. Volta à meia-noite de Brasília',
  day:'Limite de Brasas de hoje atingido',guild:'Entre numa guilda para alimentar a fogueira',
  net_off:'Sem conexão: tente de novo',timeout:
```

**G2 · `js/p_guild2.js` · Fogueira: 8ª aba (só com o módulo e o online iniciados)**

ANTES (exato, aparece uma vez):

```js
const tabsHtml=()=>'<div class="gd2-tabs" role="tablist" aria-label="Seções da guilda">'+TABS.map(
```

DEPOIS:

```js
const tabsHtml=()=>'<div class="gd2-tabs" role="tablist" aria-label="Seções da guilda">'+TABS.concat(fireOn()?[['fire','Fogueira']]:[]).map(
```

**G3 · `js/p_guild2.js` · Fogueira: corpo da aba**

ANTES (exato, aparece uma vez):

```js
const BODY={members:pMembers,donate:pDonate,bless:pBless,boss:pBoss,shop:pShop,miss:pMiss,terr:pTerr};
```

DEPOIS:

```js
/* ----- Fogueira da Guilda (8ª aba; Sys.guildFire + Sys.guildFireNet; contrato docs/API_SERVIDOR.md §16.2) -----
   Aparece só com a chave do módulo ligada, o online da guilda iniciado e o Sys.guildFireNet iniciado (sem ele as chamas seriam só deste aparelho).
   NENHUM número aqui: tudo vem do Sys.guildFire.view. Os baús de nível vão SOZINHOS pelo correio (servidor): aqui não há botão de resgatar. */
const GF=()=>(window.Sys&&Sys.guildFire)||null, GFN=()=>(window.Sys&&Sys.guildFireNet)||null;
function fireOn(){ try{ const F=GF(), Nn=GFN(), z=Nn&&typeof Nn.state==='function'?Nn.state():null; return !!(F&&F.DATA&&F.DATA.on===true&&online()&&z&&z.on&&z.started); }catch(e){ return false; } }
function fireBra(){ try{ return num(Sys.bonfire.ensure(S).bra); }catch(e){ return 0; } }
function pFire(o){ let v=null; try{ v=fireOn()?GF().view(S,host()):null; }catch(e){ v=null; }
  if(!v||v.on!==true) return rule('A Fogueira da Guilda abre com o online.');
  if(!v.open) return rule('Entre numa guilda para alimentar a fogueira.');
  const pct=Math.round(c01(num(v.frac))*100), have=fireBra(), left=num(v.braLeft);
  let h=secH('Fogueira · nível '+nT(v.level),esc2(v.name||''))
    +'<div class="gd2-row"><span class="mi"><b>'+(v.max?nT(v.into)+'/'+nT(v.need)+' chamas para o próximo baú extra':nT(v.into)+'/'+nT(v.need)+' chamas para o nível '+nT(v.level+1))+'</b>'
    +'<span role="progressbar" aria-label="Chamas da fogueira" aria-valuenow="'+pct+'" aria-valuemin="0" aria-valuemax="100" style="display:block;height:8px;margin:6px 0 4px;border-radius:5px;background:rgba(0,0,0,.35);overflow:hidden"><span style="display:block;height:100%;width:'+pct+'%;background:#ff9f2e"></span></span>'
    +'<small>'+(v.perksText?'Bônus da guilda: '+esc2(v.perksText):'O bônus começa no nível 2')+' · você já deu '+nT(v.mine)+' chamas</small></span></div>';
  h+=secH('Alimentar','1 grátis por dia');
  h+='<div class="gd2-row"><span class="mi"><b>Alimentar grátis: +'+nT(v.freeFlames)+' chamas</b><small>'+(v.free?'Uma vez por dia':'Feito hoje · volta à meia-noite de Brasília')+'</small></span>'
    +(v.free?'<button class="gd2-bt" data-x="fire" data-n="0">Alimentar</button>':'<span class="gd2-pill on">Feito hoje</span>')+'</div>';
  if(v.brasaHook){ const opts=[1,5,20].filter(n=>n<=left);
    h+='<div class="gd2-row"><span class="mi"><b>Dar Brasas: 1 chama por Brasa</b><small>Você tem '+nT(have)+' Brasas · pode dar mais '+nT(left)+' hoje</small></span>'
      +(opts.length?opts.map(n=>'<button class="gd2-bt'+(n<=have?'':' off')+'" data-x="fire" data-n="'+n+'" aria-label="Dar '+nT(n)+' Brasas">+'+nT(n)+'</button>').join(''):'<span class="gd2-pill on">Feito hoje</span>')+'</div>'; }
  const nx=v.next&&v.next.chest;
  if(nx) h+=secH(v.max?'Próximo baú extra':'Baú do nível '+nT(v.next.level),'para cada membro')
    +'<div class="gd2-row"><span class="ic">'+img(IC.chest,28)+'</span><span class="mi"><b>'+kfT(nx.gold)+' de ouro · '+nT(nx.stones)+' Pedras de Forja · '+nT(nx.food)+' de ração</b><small>Chega sozinho pelo correio quando a guilda sobe de nível</small></span></div>';
  return h+'<p class="gd2-hint">As Brasas vêm só de jogar (a sua Fogueira). Nada aqui se compra. O baú vai para quem já estava na guilda quando o nível subiu.</p>'; }
const BODY={members:pMembers,donate:pDonate,bless:pBless,boss:pBoss,shop:pShop,miss:pMiss,terr:pTerr,fire:pFire};
```

**G4 · `js/p_guild2.js` · Fogueira: aba some se o módulo ou o online cair**

ANTES (exato, aparece uma vez):

```js
if(!BODY[X.tab]) X.tab='members';
```

DEPOIS:

```js
if(!BODY[X.tab]||(X.tab==='fire'&&!fireOn())) X.tab='members';
```

**G5 · `js/p_guild2.js` · Fogueira: ao abrir a aba, busca as chamas do servidor**

ANTES (exato, aparece uma vez):

```js
  tab(b){ const t=String(b.dataset.t||''); if(!BODY[t]||t===X.tab) return; sfx('ui_tap'); X.tab=t; X.sel=''; X.conf=null; X.top=true; redraw(); },
```

DEPOIS:

```js
  tab(b){ const t=String(b.dataset.t||''); if(!BODY[t]||t===X.tab) return; sfx('ui_tap'); X.tab=t; X.sel=''; X.conf=null; X.top=true; redraw();
    if(t==='fire'){ try{ const Nn=GFN(); if(Nn&&typeof Nn.refresh==='function') Promise.resolve(Nn.refresh(S,host())).then(redraw,()=>{}); }catch(e){} } },
```

**G6 · `js/p_guild2.js` · Fogueira: botões Alimentar e Dar Brasas**

ANTES (exato, aparece uma vez):

```js
  checkin(){ const n=GN(), D=GM().DATA;
```

DEPOIS:

```js
  /* Fogueira: n = 0 é o alimentar grátis; n > 0 = dar n Brasas. O servidor decide primeiro (Sys.guildFireNet.feed); baú pronto vai ao correio sozinho */
  fire(b){ const k=Math.max(0,parseInt(b.dataset.n,10)||0), Nn=GFN(); if(!Nn||!fireOn()) return say('A Fogueira da Guilda abre com o online'); sfx('ui_tap');
    if(k>0&&k>fireBra()) return say(why('brasas'));
    run('Alimentando a fogueira…',()=>Nn.feed(S,host(),k),r=>'+'+nT(num(r.flames)||(k||num(GF().DATA.free.flames)))+' chamas na fogueira'+(num(r.chestsMailed)>0?' · '+nT(r.chestsMailed)+(r.chestsMailed>1?' baús enviados':' baú enviado')+' ao seu correio':''),()=>{ X.glow=1.2; }); },
  checkin(){ const n=GN(), D=GM().DATA;
```

## 7. Mentores, Conjuntos e Perfil V5

### 7.1 Mentores (protótipo aprovado: `docs/proto/v2/Mentores.html`)
Chave: **L1** (`SYS_LIVE.mentors`). Menu: **D7** e **D8** (item `mentors`, `act:'soon:mentors'`, aparece com a tela registrada).
Tela (`js/p_mentors.js`, a escrever):

| Ação | Chamada | Resposta |
|---|---|---|
| abrir / desenhar | `Sys.mentors.view(S, host)` (já chama `sync`, que regrava título perdido) | `{on, open, needLevel, stones, food, stonesPer, foodPer, mentors:[{era, eraName, id, name ('???' trancado), role, portrait ('assets/mentors/m<era>.png'), unlocked, pts, mark, maxMark, next, stat, statNow, statMax, statText, lines[], newLine, title, fav}], giftable:[{id, slot, r, e}]}` |
| prévia do presente | `Sys.mentors.itemValue(item, era)` (peça da era do mentor vale +50%) | pontos |
| dar presente | `Sys.mentors.gift(S, host, era, {items:[ids], stones, food})`; depois `statsChanged()` (o FC muda) | `{ok, era, pts, total, mark, newMarks:[{mark, line, stat, text, title?}]}` ou `reason` `off`, `locked`, `max`, `empty`, `items`, `stones`, `food`, `era` |
| fala nova mostrada | `Sys.mentors.seen(S, era)` depois de mostrar `newLine` | `true` |

A peça presenteada sai pelo `host.removeItem` (nunca a equipada nem a trancada no cadeado da Fogueira). Retratos `assets/mentors/m0..m8.png` ainda não existem (Arte).

### 7.2 Conjuntos salvos (só a API; sem voto do dono)
Chave `SYS_LIVE.loadouts` (fica `false`). Modos `fases`, `arena`, `chefe`.
`view(S, host)` → `{on, auto, cur, modes:[{mode, name, saved, inUse, at, gear:[{slot, id, have, name, r}], pet, mount, spells, missing}]}` ·
`save(S, modo, host)` (fotografa o equipado) · `clear(S, modo, host)` · `plan(S, modo, host)` → `{ok, changes, skipped:[{reason:'gone'|'locked'|'slot'}], same}` ·
`apply(S, modo, host)` → `{ok, equipped, changes, skipped}` (pula o que sumiu; espaço vazio não desequipa) · `setAuto(S, v)` ·
`forBattle(S, host, {boss, pvp})` antes de cada luta (só age com o automático ligado) · `modeFor(ctx)`. Depois de `apply`, `statsChanged()`.

### 7.3 Perfil V5
Já ligado (seção 1). Falta só o gancho do recorde `runKills` (abates nesta abertura do jogo; `B` é da sessão):

**R1 · `js/battle.js` · Perfil V5: recorde "Mais abates numa sessão" (runKills, o único recorde sem gancho)**

ANTES (exato, aparece uma vez):

```js
B.streak=(B.streak||0)+1; profRec('streak',B.streak); }
```

DEPOIS:

```js
B.streak=(B.streak||0)+1; profRec('streak',B.streak); B.runK=(B.runK||0)+1; profRec('runKills',B.runK); }
```

## 8. Lacunas encontradas (o que não depende do Engenheiro)

**Sistemas (esta sessão): FECHADAS em 14/11** (teste: `node test/sys/guildfirenet.test.js` e `node test/sys/lacunas-social.test.js`).
- **`js/sys/guildfirenet.js` (`Sys.guildFireNet`) existe.** Nasce DESLIGADO (`DATA.on=false`, liga pelo `SYS_LIVE.guildFireNet`). Contrato da API_SERVIDOR §16.2:
  - `start(S, host)`: `GET /guild/fire` → `Sys.guildFire.applyServer` (chamas de todos, grátis e Brasas de hoje, minhas chamas) e troca o provider.
    404 (`GUILDFIRE_ON` desligado) ou sem rede: fica o local. 403 `not_in_guild`: inicia sem guilda (a aba diz "entre numa guilda").
  - `refresh(S, host)` (o mesmo GET; 404 com o online ligado volta ao local), `stop()`, `state()` → `{on, started, err, at, inGuild}`, `view()` (o último GET).
  - `feed(S, host, n)` → Promise `{ok, kind, flames (somadas agora), total, level, levelUp, chestsMailed, braLeft}` ou `{ok:false, reason, details, retryAfterMs}`.
    Confere as regras locais antes da rede (`guild`, `done`, `day`, `hook`, `brasas`); o servidor decide (`POST /guild/fire/feed {kind, n}`); com o ok dele o
    `Sys.guildFire.contribute` gasta as Brasas UMA vez. 429 `daily_limit` vira `done` (grátis) ou `day` (Brasas) e espelha o servidor; `brasas_over` e
    `brasas_unverified` passam como vêm (textos do G1).
  - Baús: só o servidor (correio). Com o online ligado, `Sys.guildFire.claim` recusa com `'mailed'` e nada credita no aparelho.
  - **Linha do Engenheiro:** já está no D5 (`for (const k of ['arenaNet', 'guildNet', 'duoNet', 'guildFireNet'])` chama `Sys.guildFireNet.start(S, X().host)`
    depois do boot online) e no D6 (refresh). Falta só: `'guildfirenet'` no M1 (logo depois de `'guildfire'`) e `guildFireNet` no L1 (os dois já estão nos
    blocos acima). Quem abre a aba chama `Sys.guildFireNet.refresh(S, host)` (G5).
- **Bônus de ouro e XP aplicados num ponto só** (decisão pela auditoria do ouro, docs/ECONOMIA_OURO.md):
  - **XP** (`Sys.level.addXp`, toda XP menos a devolução da Provação): soma Encruzilhada (já estava) + `Sys.guildFire.perks` xpPct (+0,3%/nível, até
    +2,7%) + `Sys.guild.perks` xpPct (territórios do torneio, até +5%). Desligado ou sem guilda = 0.
  - **Ouro do abate** (`Sys.loot.rollKill`, novo `Sys.loot.goldPerkPct(S)`): SÓ o que a auditoria orçou: Encruzilhada `goldPct` (Trilha do Tesouro +5%,
    uma vez por era, está no `tools/sim-ouro.js`) e Fogueira da Guilda (+0,5%/nível, até +4,5%, §4 "não muda"). Teto +25%. Soma com o VIP e o evento.
    A Encruzilhada está viva (`SYS_LIVE.crossroads`): quem escolheu a Trilha do Tesouro passa a ganhar os +5% que a tela já prometia.
  - **NÃO aplicados no ouro** (fora do orçamento): títulos (até ~+10%: tabela 20% × bonusMult 0,5, mais o destaque), prática Coleta (+0,5%/nível, +35% na era 6), mentores Inês e
    Aurora, estandarte de ouro da Guilda (até +10%) e territórios (até +10%). Com eles a soma passa de +70% e o tempo para upar fica MAIS RÁPIDO que
    a curva calibrada (tools/sim-ouro.js, fase 80: a proposta C dá +65% sobre o abate e a curva calibrada L, +131%; com mais +70% a C iria a +135%, acima da L).
    Para ligar, o dono precisa aprovar o teto de +25% no total e o corte (por exemplo, títulos e prática até +10% cada). Eles seguem no `Sys.fc.bonus`
    (o `goldMult` do `Sys.fc.compute` continua sem uso).
- **`Sys.level.DATA.unlock` tem `duo: 16` e `mentors: 16`** (nomes "Dupla" e "Mentores"). O aviso "Liberou" do addXp só cita os dois com a chave do
  módulo ligada (`DATA.gated`). O `FB_UNLOCK` do D7 vira só reserva.
- **`Sys.duo.applyServer` guarda `partner.frame`** (id `[a-z0-9_]` até 32, ou null; outro valor vira null; sem o campo, fica a que estava). Sai no
  `Sys.duo.view(S, host).partner.frame` e no save.
- `Sys.profile` sem `on()` nem "caminho da arte da moldura": continua como está (o F1 lê `DATA.on` e monta o caminho, como o Perfil).

**Servidor:**
- `DUO_ON` e `GUILDFIRE_ON` desligados (seção 2).
- `POST /arena/snapshot`: aceitar `look.frame` (id `[a-z0-9_]`, só visual) e devolver no `opponents[].look`. Hoje some.
- `GET /duo`: mandar `partner.frame` (e `invites[].frame`, se quiser no convite).

**Arte:**
- Ícones do Menu `assets/icons/menu/duo.png` e `mentors.png` (hoje provisórios: Chat e Códex).
- Molduras VIP `assets/ui/frames/vip1.png` a `vip10.png` (depois, aplicar o F7).
- Retratos dos mentores `assets/mentors/m0.png` a `m8.png`.

**QA (depois de aplicar):** HUD com moldura (equipar no Perfil; trocar; desequipar); lista da Arena sem regressão de layout a 390 px; aba Fogueira só com o
online; a Dupla conta abate, chefe, fase e vitória da Arena (`S.sys.duo.day.mine`); o recorde "Mais abates numa sessão" aparece no Perfil.
