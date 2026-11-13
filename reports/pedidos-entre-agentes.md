# Pedidos entre agentes

Cada pedido: quem pede, para quem, o que, por que, e como estou contornando enquanto não é atendido.

## Do agente B (painéis) para o agente A (engenheiro: index.html, fullbattle.js, battle.js, sw.js, versão)

### B-1. Arquivo novo `js/equipfx.js` (informativo, nada a fazer no index.html)
- O `js/screens.js` carrega o arquivo sozinho (`document.write` no fim dele, mesmo `?v=` do index), logo depois de si e antes do `screens2.js`.
- Pedido: lembrar do arquivo na cópia do app Android e subir a versão quando publicar (os três arquivos mudaram: `screens.js`, `screens2.js`,
  `equipfx.js`). Os próximos arquivos de tela (item 3) entram pelo mesmo carregador.

### B-2. Destino do voo de moeda e gema: `fbTarget`
- O `yFly` (screens2.js) agora usa `fbTarget('gold' | 'gems' | 'level')` quando o `body` tem a classe `fb`. Pedido: manter essa função com esses
  três nomes. Se ela sumir, o voo volta para o HUD antigo (escondido) e cai no canto da tela.

### B-3. Telas novas do item 3: como vão abrir (preciso de resposta antes de ligar)
O `render()`, o `FULLV` e o `Screens` ficam no index.html; o `FB_MENU`/`FB_DROP` e o `FB_TITLES` ficam no fullbattle.js.
Proposta, para eu não editar nenhum dos dois:
1. Eu registro cada tela nova num objeto meu, `window.PANELS = { rank: {draw, title}, forge: {...}, vip, inst, tower, era, cfg }`, e estendo por
   fora: `FULLV.rank = 1`, `FB_TITLES.rank = 'Ranking'`, e envolvo `render` e `Screens.open/close` (as funções originais continuam sendo chamadas
   para tudo o que não for meu).
2. Pedido ao A: no `fbAct`, trocar `soon:<chave>` por algo como
   `if (window.PANELS && PANELS[k]) Screens.open(k); else fbSoon(k);` para `rank`, `forge`, `vip`, `inst`, `tower` (e `cfg` para a tela 09 nova
   no lugar do `openSettings`). Enquanto isso não entra, a tela nova só abre por `Screens.open('<nome>')` no console/debug.
3. Se preferir que o `render()` do index tenha um gancho oficial (`(PANELS[view] && PANELS[view].draw) || ...`), melhor ainda: diga e eu não
   envolvo nada.

### B-4. Módulos que as telas novas leem e o index não carrega
- Hoje o index carrega: loot, chest, level, stats, skin, vip, forge, pass, practice, titles, fc. As telas 12, 13 e 14 precisam de
  `js/sys/arena.js`, `js/sys/instances.js`, `js/sys/tower.js` (e talvez `clock.js`).
- Pedido: incluir na lista do index. Contorno: eu carrego do meu lado se `Sys.arena` / `Sys.instances` / `Sys.tower` não existirem.

### B-5. Loja: `setView('skins')` e o botão VIP
- A aba "Coleção" da Loja saiu da barra (não existe no protótipo; chave `PANEL_V2.shopCol`). O `setView('skins')` do index ainda põe
  `XH.tab = 'col'`: eu redireciono para "Skins herói". Nada a fazer, só aviso.
- O botão VIP da Loja chama `Screens.open('vip')` quando a tela 18 existir.

### B-6. Avisos globais dentro da folha (só conferir)
- `body.full #toast` do index tem `max-width: 210px` e posições pensadas para o HUD antigo; na folha o `fullbattle.js` já põe `top: 126px`.
  Quando eu tiver a vez do navegador confiro se o aviso global não cai em cima do título da folha; se cair, peço o ajuste.

## Do agente B para a fps-e2 / fps-30 (donos de `js/sys/*.js`), via PO

### B-7. Textos dos títulos (tela 16) diferentes do protótipo aprovado
Em `js/sys/titles.js` (`condLabel`, `bonusText`): o protótipo diz "Vencer o andar N da torre" (módulo: "Chegar ao andar N da torre");
"Terminar no top N da arena" ("Terminar a semana no top N da arena"); "Ter os 5 pets" ("Ter 5 pets"); "Fênix em 5 estrelas" ("Fênix com 5★");
"Todos os cabelos (5)" ("Ter os 5 cabelos"), idem olhos e chapéus; bônus "+0,25 pt crít." ("+0,25% crítico") e "% def." ("% defesa").
Não é meu arquivo; o PO decide qual texto vale.

## Do agente B para o agente A (2ª leva)

### B-8. Painel em tela cheia com cabeçalho + VOLTAR, sem folha e sem barra de baixo (ordem do PO)
- Escrevi o contorno comum num lugar só (`xHead` / `xWrap` em `js/screens.js`), atrás de `PANEL_V2.frame` (desligada). Ligada, o `body` ganha a
  classe `xframe` e um CSS meu faz: `body.full.xframe #view{top:0;bottom:0;z-index:62}` e esconde `#fbsheet`, `#fbdim` e `#tabs`.
- Isso passa por cima da folha do `fullbattle.js`. Pedidos: (a) dizer se a folha sai de vez na versão em que o contorno ligar (aí eu apago o
  meu CSS e você tira `body.fb.full #view{top:...}`); (b) o `fbFast` continua escrevendo o título em `#fb_tt`: inofensivo, mas pode sair;
  (c) área segura de cima (entalhe): o `#view` em `top:0` fica sob o entalhe; preciso de uma variável com a altura segura em px (ex.:
  `--safet` no `#app`) ou que o `#view` em tela cheia já venha com `top: env(safe-area-inset-top)`; (d) com o painel aberto em tela cheia a
  batalha continua rodando atrás sem ser vista: decidir se pausa ou segue (hoje segue).
- Ganho de altura (conta): 390x844 → 780 px de conteúdo, escala 1,00 (hoje 656 px e escala 0,96).

### B-9. Restos da barra de baixo no index.html que aparecem dentro dos painéis (só aviso, é seu arquivo)
- `body.full[data-v=pass] #toast{bottom:calc(var(--navh) + 10px)}` e `body.full[data-v=prog] #toast{bottom:calc(var(--navh) + 72px)}`.
- Tutorial: alvos `#tabs [data-t=gear]` / `[data-t=summon]` (o `fullbattle.js` já troca; conferir no modo sem `fb`).
- `openSettings` (modal antigo com "⚙️"): a tela 09 nova vai substituir; até lá é o que abre.

### B-10. Lista de arquivos novos meus para o index.html (quando você assumir a carga)
`js/equipfx.js`, `js/panels.js`, e depois `js/p_forge.js`, `js/p_pets.js` (ordem: depois de `screens.js`; os `p_*` depois de `panels.js`).
Enquanto isso o `screens.js` carrega `equipfx` e `panels`; os `p_*` só entram na lista dele quando eu fechar cada tela.


## Do agente A (engenheiro) para o agente B — v0.12.1 (respostas a B-3, B-4, B-8, B-9 e o que vi dos seus painéis)

### A-5. B-3 atendido: `Screens.register` (index.html)
- Assinatura: `Screens.register(nome, { title, render(el, S), onOpen(opcoes), onClose() })` → devolve `true` (ou `false` se o nome já for de uma
  tela fixa: battle, gear, summon, shop, pass, prog).
- `Screens.open(nome, opcoes)` abre a tela registrada (chama `onOpen(opcoes)` uma vez); `render(el, S)` é chamado A CADA redesenho com
  `el = #view`; `Screens.close()` volta para a batalha e chama `onClose()`. `title` aparece no cabeçalho do painel.
- Se `nome` for uma chave do MENU da batalha (`forge`, `pets`, `tower`, `inst`, `rank`, `vip`, `mail`, `events`), o item do MENU deixa de dizer
  "Em breve" e abre a tela. Testado com uma tela de teste `rank`: abriu, título no cabeçalho, onOpen/onClose chamados.

### A-6. B-4 atendido: módulos novos carregados
- `js/sys/instances.js`, `tower.js`, `arena.js` entram na lista do index (antes de `fc.js`). Conferido: FC do herói não mudou (bônus zero).
- `js/equipfx.js` continua carregado pelo seu `screens.js`; não dupliquei. A lista B-10 (panels.js, p_*.js) entra no index quando você pedir.
- `js/sys/events.js` NÃO está na lista (módulo desligado por chave). O `ptrack()` do index já chama `Sys.events.track` se o módulo existir.

### A-7. B-8: painel em tela cheia JÁ está no ar na v0.12.1 (altura útil combinada)
- A folha saiu. Com painel aberto: fundo opaco (`#fbdim`), cabeçalho `#fbsheet` de 56 px (Voltar + título + moedas + gemas) logo abaixo da
  área segura, e o `#view` do cabeçalho até o fim da tela. Sem barra de baixo.
- ALTURA ÚTIL DO PAINEL = altura da tela − área segura de cima − 56 px. Em 390x844 sem entalhe: `#view` top 56, altura 788.
  CSS: `body.fb.full #view{top:calc(var(--fbsafe,0px) + 56px);bottom:0}`.
- (c) variável da área segura: `--fbsafe` (px) no `#app`, escrita pelo `fbLayout`. Use-a se a `PANEL_V2.frame` ligar.
- (a)/(b) quando a sua `PANEL_V2.frame` ligar e o seu cabeçalho (`xHead`) assumir, me avise: eu tiro o `#fbsheet` e o `top` do `#view`.
  Até lá NÃO ligue as duas coisas juntas: ficariam dois cabeçalhos.
- (d) a batalha segue rodando atrás (idle); não pausei.

### A-8. O que vi dos seus painéis na v0.12.1 (390x844, prints em reports/prints/v0121_painel_*.png)
- Equipamento, Invocar, Loja, Passe e Progresso abrem em tela cheia, sem estouro de altura e sem erro no console.
- PEDIDO: o painel Progresso (Práticas e Títulos) desenha a SUA seta de voltar além do "Voltar" do meu cabeçalho: ficam dois controles de
  voltar. Tire a seta interna (ou me diga para esconder o meu cabeçalho nessa tela).
- Não vi quebrado nada que peça desligar chave da `PANEL_V2`. NÃO testei: arrastar para equipar (`equipDrag`), voo do item (`equipFly`),
  compra na Loja, abas internas do Passe além da primeira, larguras 360 e 768 dentro dos painéis.

### A-9. Modo manual removido (ordem do dono) — textos nos seus arquivos
- Procurei "manual", "AUTO/MANUAL" e "toque no especial/ultimate" em `js/screens.js`, `js/screens2.js` e `js/sys/*.js`: nada de modo de combate
  manual. Só comentários sem relação (`pet.js` "evoluir: manual", `vip.js` "nível manual") e o `RES.autoOn` da tela 10, que já está sempre ligado.
- `S.set.auto` agora é sempre `true` (o campo continua existindo para quem lê); não há mais botão AUTO no HUD nem linha em Configurações.

### A-10. B-9 (restos da barra de baixo no index)
- Os dois `#toast{bottom:calc(var(--navh)...)}` e os alvos `#tabs [data-t=...]` do tutorial só valem no layout antigo (`?debug=1&fb=0`); na 04b
  o `fullbattle.js` troca. Ficam até o layout antigo ser apagado (decisão do PO). `openSettings` continua o modal antigo até a tela 09.

## Do agente B para o agente A (3ª leva, depois da v0.12.1)

### B-11. Subtelas do Equipamento: o Voltar do seu cabeçalho precisa saber para onde voltar (decisão do PO)
- Forja e Progresso são SUBTELAS do Equipamento: o Voltar delas leva ao Equipamento, não à batalha.
- Progresso (`prog`) já volta certo pelo `Screens.close()` (usa `XR.back`). Vou tirar a minha seta interna (está em `js/screens2.js`, parado
  até o APK da v0.12.1 sair; fica na lista de ajustes).
- Forja é tela registrada: o `Screens.close()` de hoje leva à batalha. Pedido: aceitar `parent` no registro,
  `Screens.register('forge', {title, render, onOpen, onClose, parent:'gear'})`, e o `close()` fazer `setView(def.parent)` quando houver.
  Contorno enquanto não entra: nenhum (a Forja está desligada); se ligar antes, eu chamo `setView('gear')` no meu `onClose` só quando o
  fechamento vier do Voltar.
- Também preciso do toque: `render(el, S)` me entrega o `#view`, e o clique das minhas telas chega pelo ouvinte do `js/screens.js` (delegação em
  `[data-x]`), que só age se `FULL_VIEWS[view]` existir; o `Panels.enable` cuida disso. Nada a fazer do seu lado.

### B-12. `PANEL_V2.frame` (meu cabeçalho) fica DESLIGADA e deve morrer
- O seu cabeçalho de 56 px já é o contorno comum. Não vou ligar a `frame`. Quando os arquivos destravarem eu apago o `xHead` e a chave
  (ou deixo só como reserva do layout antigo, se o PO quiser manter `?fb=0`).

### B-13. Aviso: gravei em `js/screens.js` e `js/screens2.js` antes de receber o aviso de congelamento
- Últimas gravações minhas nesses dois arquivos: ver horários no topo do bloco "Congelamento" de `reports/agente-b-paineis.md`.
  O que entrou depois da sua v0.12.1: o contorno `frame` (desligado), o gancho das telas novas no ouvinte de clique e no relógio (inerte sem
  tela ligada), o destino do voo de moeda/gema, o pulso da FC, e a carga de `js/panels.js` e `js/p_forge.js` (tela desligada).
  Se o QA conferiu a v0.12.1 antes disso, o que ele viu não é byte a byte o que está no disco: diga se quer que eu devolva os dois arquivos
  ao estado de antes para o APK (tenho como desfazer só os trechos, não há git).

## Do agente B para a fps-e2 (dona de `js/sys/pet.js`), via coordenação

### B-14. DEFEITO no `Sys.pet.feedTap`: gasta a ração e não grava o nível nem a barra
- Achado pelo subagente da tela 17b, reproduzido em Node: `P.DATA.v3=true; P.setV17(true); S={}; H={eraMax:()=>6};
  P.addEgg(S,H,{pet:'wolf',r:0}); P.addFood(S,100,H); P.feedTap(S,H,'wolf',25)` devolve `{ok:true, given:3, up:true, lvl:2}`, mas
  `P.ensure(S).owned.wolf` continua `{stars:1, frags:0, lvl:1}` e a ração caiu para 97.
- Causa provável: em `feedTap`, `x = o.owned[pid]` é lido ANTES de `canFeed(S,host,pid)`; o `canFeed` chama `ensure(S)`, que refaz os objetos
  de `o.owned`, e a escrita (`x.fx`, `x.lvl`, `x.food`) vai para o objeto velho. Sugestão: reler `x = ensure(S).owned[pid]` depois do `canFeed`.
- Contorno na tela (isolado em `ptFeedTap`, `js/p_pets.js`): confere se gravou; se não gravou, devolve a ração e sobe 1 nível inteiro pelo
  `Sys.pet.feed` quando há ração. Com o módulo corrigido o desvio não é usado e volta a barra parcial de 25 por toque.

### B-15. Funções que a tela 17b usa e o módulo não exporta (a tela tem reserva isolada)
`Sys.pet.locked(S)`, `Sys.pet.lockLevel()`, nome da raridade por índice, e o nível que solta um ovo guardado pelo portão (hoje a tela lê
`Sys.loot.DATA.gates[r].lvl` para o texto "guardado até o nível X").

## Do agente B para o agente A

### B-16. `js/p_pets.js` (tela 17b, desligada) NÃO está sendo carregado
- O `screens.js` está congelado para o APK, então não pus o arquivo na lista de carga dele. Entra junto com o pacote de pets: ou você o põe no
  index (depois de `js/panels.js`), ou eu ponho na minha lista quando destravar. `js/sys/pet.js` também não é carregado hoje.

### B-17. Leilão: entrada no MENU com o selo "Em breve: abre com o online" (decisão do PO; a tabela é sua)
- Em `FB_DROP`: `{ id: 'auction', icon: '<ícone>', label: 'Leilão', act: 'soon:auction' }` e `FB_SOON.auction = 'Leilão'`.
- O `FB_DROP` não tem campo de selo: é preciso criar um (ex.: `soon: 'Em breve: abre com o online'`) e desenhá-lo na célula; o aviso do
  `fbSoon` hoje diria "Leilão: em breve", não a frase pedida.
- Ícone: `assets/icons/menu/` não tem nada de leilão (o mais próximo é `shop`, já usado). Falta um `auction.png` (pedido de arte à fps-ff).
- A tela (`js/p_auction.js`, chave `PANEL_ON.auction`, demonstração desabilitada) existe mas não é carregada; entra na lista quando o PO
  mandar ligar. Arquivos novos meus ainda fora da carga: `p_pets.js`, `p_cfg.js`, `p_offer.js`, `p_auction.js`.

### B-18. Arma do item na mão do Kael (v0.12.2): o que o Equipamento chama e o que preciso de você
- A vitrine do Equipamento usa a classe CSS `kidle` (folha pronta por tier da skin de ROUPA). Não mostra item nem skin de arma.
- Depois de equipar / "Equipar melhor" / arrastar eu chamo `statsChanged()` → `refreshHero()` (seu) e `render()` (redesenho inteiro). Sem cache.
- Pedido: uma função sua que desenhe o herói parado num canvas qualquer, com a MESMA regra da batalha (corpo `kael_idle_body` + arma na
  âncora `grip` do .json, ou a folha composta quando roupa e arma são da era 2 no mesmo tier), por exemplo
  `heroPreview(canvas, tempoSeg)` lendo a mesma fonte que a batalha passar a usar. Eu troco a `kidle` da vitrine por ela.
- Regra da fonte (para não divergirmos): `skin de arma > item equipado no espaço weapon (era = item.look ou item.e; tier = tierOf(item.r))`.
  ATENÇÃO: todo save nasce com `S.skinEq.weapon = 'w00'`; se a skin inicial contar como skin, o item nunca aparece. Sugestão: tratar `w00`
  (e `a00`) como "sem skin escolhida". Decisão do PO.
- `Sys.appearance` não está na lista de módulos do index.

### A-11. (agente A, v0.12.2) Mexi em UMA linha do seu js/screens.js, por exceção do coordenador
- `scrGear`: a `<div class="kidle">` da vitrine virou `<canvas id="gkc">` (268x168, mesmo lugar); quem desenha é `drawHeroPreview` (js/battle.js) com `heroLook()` (index.html): arma do item equipado na mão.
- Cuidado com nomes globais: `GK` já é seu; o meu estado da prévia chama `HPVW`.

### A-12. (agente A, v0.12.3) Pedidos no seu js/screens.js
- Compra da Loja (linha do `addItemToBag({slot:o.slot,r:o.r,e:o.e,subs:o.subs})`): acrescentar `origin:'shop'` (o `normItem` já copia o campo).
- Aba de GEMAS da Loja: esconder até o nível 10. A tabela está em `FB_UNLOCK` (js/fullbattle.js); use `fbUnl('shopgem')`.
- Passe só no nível 18, mas Missões libera no 2 e abre o seu painel do Passe na aba Missões: esconda a aba de Prêmios enquanto `!fbUnl('pass')`.

### A-13. (agente A, v0.12.4) Save antigo, botões mortos e tela que quebra
- SAVE ANTIGO: adotei o SEU marcador `S.bornV` ('old' = save anterior à liberação por nível; senão a versão em que nasceu). Além dele gravo
  `S.unlKeep = {missions:1, summon:1, practice:1, shopgem:1, pass:1}` nos saves 'old' (`fbLegacy()` em js/fullbattle.js, chamado no `fbInit`).
  LEITURA: `fbUnl(id)` já devolve verdadeiro para o que está em `S.unlKeep` (e para tudo no modo dono). Use só `fbUnl`; o seu `xLegacy()` pode sair.
- TELA QUE QUEBRA: se o `render` de uma tela registrada lançar erro, o index fecha a tela, avisa e marca `Screens.reg[nome].broken = true`;
  a entrada some do MENU. Se o seu botão da Forja no Equipamento abre `forge`, esconda-o também quando `Screens.reg.forge.broken`.
- AUDITORIA DE BOTÕES (regra do dono: nada visível sem ação): a parte de DENTRO dos painéis é sua. Lista da minha parte: reports/botoes-v0.12.4.md.
- Continuam valendo os pedidos do A-12 (origin:'shop' na compra; aba de gemas e aba de Prêmios do Passe por `fbUnl`).

### B-19. Marcador de save antigo (regra do PO: quem já jogava não perde Loja completa nem Passe)
- Ainda não achei o seu marcador. Por ora uso um meu, em `js/screens.js` (`xLegacy`): na 1ª leitura, save sem `S.bornV` e com progresso
  (abates > 0, fase > 1 ou nível > 1) recebe `S.bornV = 'old'`; save zerado recebe a versão atual. Só `gemShop` e `pass` são herdados.
- Quando você gravar o seu (no `newState()` / migração), diga o nome do campo: eu troco a leitura e apago o meu.
- A v0.12.4 liga `PANEL_ON.forge` e `PANEL_ON.cfg`. Com `cfg` ligada o `js/panels.js` envolve o seu `openSettings(false)` para abrir o painel
  novo (o `openSettings(true)` continua seu). Se preferir, troque o `act: 'cfg'` do MENU por `Screens.open('cfg')` e eu tiro o envoltório.
- Forja como subtela: o `js/panels.js` envolve o `Screens.close()` para voltar ao Equipamento (pedido B-11 continua de pé: `parent` no registro).

### Q-1. Tela VIP (js/p_vip.js, QA-ajudante) — ESCRITA E NÃO VISTA RODANDO
- Pedido ao engenheiro: incluir `'p_vip'` na lista de scripts de js/screens.js (linha `for(const n of ['equipfx','panels','p_forge','p_cfg',...])`) e ligar `PANEL_ON.vip` quando você conferir. Ela só usa `Sys.vip` (level, progress, levelInfo, DATA.maxLevel) e, no onOpen, `Sys.pet.prismVipMax` se existir (idempotente).
- Globais que ela espera do jogo (os mesmos da Forja): `V, S, xDims, xWrap, kf, snd, render, Panels, Sys, window`. Classes `x-scroll` e `f-in` (as do screens.js). Injeta o próprio CSS (id `pv_css`).
- Botão "Comprar VIP": hoje só mostra o aviso "Pagamento em breve" (nada é cobrado). Quando a Loja tiver a compra, trocar a ação `buy` por `Screens.open('shop')` com `XH.tab='gem'` (ou o que você definir).
- Entrada no MENU: o item VIP já existe em FB_DROP (act `soon:vip`); basta `Screens.reg.vip` existir (o painel registra pelo Panels.enable).
- Teste: `node test/paineis/p_vip.smoke.js` (passa).

### Q-2. Tela Troca de era (js/p_era.js, QA-ajudante) — ESCRITA E NÃO VISTA RODANDO
- É um OVERLAY (`Panels.add('era',{overlay:true,open,close})`): não é view; abre por `Panels.open('era',{from,to,boss,gems,essence,onDone})` (só funciona com `PANEL_ON.era=true`). `window.PEra.open({...})` serve para conferir no console.
- Pedido ao engenheiro: (1) incluir `'p_era'` na lista de scripts do js/screens.js e ligar `PANEL_ON.era`; (2) chamar na hora da troca de era (js/battle.js, `waveClear`, quando `newEra`): `Panels.open('era',{from:oldEra,to:ne,boss:<nome do Senhor da Era morto>,gems:30,essence:<se o jogo der>,onDone:()=>{...}})`; se retornar `false`, segue o fluxo antigo (resOpen/toast). A ordem com a tela de vitória é sua decisão (a Troca de era foi escrita para vir ANTES e devolver o controle no `onDone`).
- Efeito no jogo: enquanto aberta ela põe `B.res={mode:'era'}` e `B.running=false`; ao fechar devolve `B.res=null`, `B.running=true` (só se `B.res.mode==='era'`). Não mexe em S, no save nem em recompensa: o que o jogo deu (gemas, Essência) vem no `o`; o que não vier não aparece.
- Arquivos que ela lê: assets/bg/era<n>.png + assets/bg/meta.json, hyb/enemy/era<from>_boss_die, hyb/R/kael_run_body, era<to>_e0_run (era 2: assets/anim/era2_e0_run), assets/anim/ult/era<to>_ult. Sem eles ela mostra imagem parada ou segue sem o elemento (não quebra).
- Teste: `node test/paineis/p_era.smoke.js` (passa); nomes globais sem conflito: `node test/paineis/conflitos.js js/p_era.js`.

### Q-3. Tela Torre (js/p_tower.js, QA-ajudante) — ESCRITA E NÃO VISTA RODANDO
- Pedido: incluir `'p_tower'` na lista de scripts do js/screens.js e ligar `PANEL_ON.tower` quando você conferir. Entrada: o item Torre do MENU (FB_DROP, `soon:tower`, nível 15) abre sozinho quando `Screens.reg.tower` existir.
- Só usa `Sys.tower` (ensure, opponent, floorFC, playerStats, difficulty, rewardsFor, isBoss, isMilestone, fight, DATA) e `Sys.level.isUnlocked/unlockLevel('tower')`. A luta é UMA chamada de `Sys.tower.fight(S, Sys.host)`; a tela chama `statsChanged()` logo depois (prêmios já entregues) e só reproduz o `duel.log` (barras e dano).
- Globais esperados (os mesmos da Forja): `V, S, xDims, xWrap, kf, snd, toast, render, statsChanged, Screens, Panels, Sys, requestAnimationFrame`. Classes `x-scroll`. Injeta o CSS `pt_css`.
- Imagens: assets/anim/hyb/R/kael_idle_era2_t0.png, assets/enemies/era<n>_boss.png. Botão Ranking abre `Panels.open('rank')` quando a tela p_rank existir e estiver ligada; senão avisa "O ranking semanal abre junto com o online".
- Teste: `node test/paineis/p_tower.smoke.js` (Sys.tower real; passa) · nomes globais sem conflito (`test/paineis/conflitos.js`).

### B-20. Raridade: dois componentes para virar um (dono do `js/rarity.js`)
- Os painéis agora desenham a moldura no próprio HTML: `xRar` / `xRarName` / `xRarBox` em `js/screens.js`, classe `xr xrN` + `data-rar="N"`,
  paleta lida do seu `RAR_C` / `RAR_TXT` / `RAR_GLOW` (chave `PANEL_V2.rar`).
- Para não haver duas molduras: (1) `rarFrame` / `rarName` chamarem `xRarBox` / `xRarName` (ou a paleta ir para um ponto comum carregado
  antes do `screens.js`); (2) no `rarDecorate`, pular elemento que já tem a classe `xr` e respeitar `xr-s` (sem pulso); (3) tirar o CSS
  `.rar-f` quando não houver mais tela antiga.
- O drop no chão continua seu.

### A-14. (agente A, v0.12.5) Armas por raridade: troquei UMA linha no seu js/screens.js
- `skinArt`: `era${sk.e}_t${tierOf(sk.r)}.png` virou `${typeof wKey==='function'?wKey(sk):'era'+sk.e+'_t'+tierOf(sk.r)}.png`.
- `wKey(ws)` e `wPng(ws)` estão em js/battle.js (Básico _t0, Raro _raro, Épico _t1, Mítico _mitico, Lendário _t2). Se você monta caminho de arma em outro
  lugar (Loja, Invocar, Forja), use `wPng({e, r})`. A miniatura `thumb('weapon', e, r)` do index já usa a chave nova.
- Item "Teste" no MENU (só app de teste / ?debug=1): tela registrada `artprev` (js/artprev.js). No modo dono `fbUnl` devolve verdadeiro para tudo.

### A-15. (agente A, v0.12.6) Pacote de pets: o que preciso de você
- Ligar `PANEL_ON.pets` (tela 17b, js/p_pets.js): o item Pets do MENU (`soon:pets`, nível 20) aparece sozinho quando `Screens.reg.pets` existir.
- TELA DE ESCOLHA DE OVO: quando `Sys.pet.addEgg` devolve `{choice:true, options:[ids], index}` eu chamo `Screens.open('eggpick', {index, options})` se a tela
  `eggpick` estiver registrada; senão só aviso "Você ganhou um ovo para escolher: abra Pets". Registre `eggpick` (ou trate as escolhas pendentes
  dentro da 17b, lendo `Sys.pet.ensure(S).choices`) e chame `Sys.pet.chooseEgg(S, Sys.host, index, id)`; depois `petNotice([resultado.hatch])` para a animação.
- Animação de chocar e avisos estão em js/petfx.js: `petNotice(lista de respostas do addEgg)`, `petHatchQueue(hatch)`, `petGiveEgg(r)`. O módulo é
  ligado no boot por `petBoot()` (v3, v20, v17). Chave geral: `PETS_ON` (js/petfx.js).
- TROCA DE ERA (Q-2): a chamada está em js/battle.js (`waveClear`), atrás de `Panels.on('era')`. Falta você carregar `p_era` e ligar `PANEL_ON.era`.

### B-21. Para a sessão do QA (telas `p_vip`, `p_tower`, `p_era`): resultado da conferência no navegador
- VIP: conferida e LIGADA (`PANEL_ON.vip = true`). Detalhe pequeno: "Faltam 1 pontos VIP" (singular).
- TORRE: funciona (abri pelo MENU, venci o andar 1, passou ao 2), mas NÃO liguei. Para ligar: (1) tirar os emojis da interface (o arquivo
  tem 15: moeda, pedra, martelo, diamante, ovo, fogo, arco-íris, cadeado, visto, troféu, estrela; regra do jogo: nunca emoji; use
  `COIN_I(px)`, `GEM_I(px)`, `SVG_LOCK`, `Y_STONE`, `Y_CHK` do screens.js/screens2.js ou SVG próprio); (2) tirar o "Ovo ... Fênix" (a fênix
  saiu; ovo é da espécie da era); (3) 3 andares visíveis em vez da torre inteira: decisão do PO.
- TROCA DE ERA: `p_era.js` tem 2 emojis (diamante e bola de cristal): trocar antes de eu conferir com o agente A.

### B-22. Para o agente A: Kaia nas telas dos painéis + escolha de ovo
- `eggpick` está registrada (fim de `js/p_pets.js`): `Screens.open('eggpick', {index, options})` abre a tela de Pets com "Escolha seu ovo".
  A escolha chama `Sys.pet.chooseEgg(S, Sys.host, índice, id)` e toca a animação de chocar da PRÓPRIA tela (não chama o seu `petNotice`;
  se quiser a sua animação no lugar, diga e eu troco). Usa a 1ª escolha pendente de `Sys.pet.ensure(S).choices`.
- KAIA: nos painéis o herói pequeno é a classe CSS `kidle` (definida no seu index.html, folha do Kael). Para a Kaia aparecer em todo lugar
  de uma vez: faça a `kidle` seguir o herói do save (ex.: `body[data-hero=kaia] .kidle{background-image:...}`), com as folhas da Kaia no
  mesmo formato (12 quadros). VIP, Torre e Troca de era (do QA) usam o caminho `kael_...` direto: aviso a ela.
- Vi `PANEL_ON.pets = true` e `p_pets` na lista de carga já no disco (sua mudança nos meus arquivos): mantive.
- `js/petfx.js` estava com erro de sintaxe na linha 75 quando rodei o teste de fumaça (provável edição em curso).

### Q-4. Instâncias (js/p_inst.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_inst'` na lista de scripts do js/screens.js e ligar `PANEL_ON.inst` (o item Instâncias do MENU, `soon:inst`, abre sozinho quando `Screens.reg.inst` existir).
- A tela mostra as 4 áreas do `Sys.instances` (Mina de Ouro, Arsenal, Chefe de Era, Caverna de Cristal), seletor de era + dificuldade, prêmio de `rewardPreview`, entradas por área, renovação. Varrer funciona dentro da tela.
- DEPENDE DO ENGENHEIRO (batalha da instância): defina `window.startInstanceRun(run)` (recebe a definição de `Sys.instances.start`), execute a horda cronometrada, chame `Sys.instances.finish(S, Sys.host, run.id, {win, kills})` e depois `window.PInst.showResult(out)` (abre a tela e mostra o painel Vitória/Derrota). Sem isso o botão "Entrar" só avisa "A batalha das instâncias ainda não está ligada" e NÃO abre entrada.
- Sem FC recomendada/"Sua FC"/VIP no protótipo: o módulo não tem esses dados; a entrada VIP já vem em `status().max`. Zero emoji. Smoke: `node test/paineis/p_inst.smoke.js`.
- Ajustes do B-21 já feitos: p_tower sem emoji/Fênix/✓ (visto vira forma CSS), p_era sem emoji, p_vip "Falta 1 ponto VIP" no singular.

### A-16. (agente A, v0.12.6) Mexi em duas linhas suas, por exceção do coordenador
- js/panels.js: `PANEL_ON.pets` de false para true.
- js/screens.js: `'p_pets'` entrou na lista de carga (`['equipfx','panels','p_forge','p_cfg','p_vip','p_era','p_tower','p_pets']`); não estava.
- A tela de escolha de ovo (`eggpick`) continua pendente (A-15). Hoje o aviso é "Você ganhou um ovo para escolher: abra Pets".
- Para a fps-ff (via PO): `assets/anim/hyb/phase3/kael_attack_era2_t1.json` está com `padLeft: 0` (deveria ser 96, como nas fases 1 e 2).

### Q-5. Ranking semanal (js/p_rank.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_rank'` na lista de scripts do js/screens.js e ligar `PANEL_ON.rank` (item Ranking do MENU `soon:rank`, nível 28; a Torre já abre o ranking quando `Panels.on('rank')`).
- Abas: Força e Arena usam `Sys.arena.ranking` (hoje com jogadores SIMULADOS pelo módulo: a tela avisa "Prévia com jogadores simulados"). Nível, Torre e Passe não têm ranking sem servidor: mostram só o valor real do jogador e o aviso. Prêmios = `Sys.arena.DATA.rewards`, com o aviso "valem quando o ranking online abrir". Relógio de fechamento = `Sys.arena.weekInfo().msLeft`.
- Nome de global renomeado para XRK (XR já existe em screens2.js). Zero emoji. Smoke: `node test/paineis/p_rank.smoke.js`.

### Q-6. Missões (js/p_missions.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_missions'` e ligar `PANEL_ON.missions`; o MENU "Missões" (`missions`, hoje `Screens.open('pass',{tab:'missions'})` em fullbattle.js) passa a abrir `Panels.open('missions')`; no Passe, a aba de missões vira o botão "Missões" que abre esta tela.
- Dados: Diárias/Semanais/bônus = `Sys.pass.list` + `Sys.pass.claimMission` (id ou 'bonus'); Guia = `Sys.guide.current/claim/list`, aba só aparece com `Sys.guide.DATA.on`. "Resgatar tudo" relê o bônus depois das diárias.
- "Atividade de hoje x/100" (baús de marco) e aba "Conquistas": ENTRAM no lançamento (PO), atrás das chaves `P_MISSIONS.activity` e `P_MISSIONS.achievements` (desligadas; lidas de `mActivity()`/`mAch()`, que hoje devolvem null; contrato no topo do arquivo). Ligar quando a API de Sistemas chegar.
- Chama `statsChanged()` ao resgatar. Zero emoji. Smoke: `node test/paineis/p_missions.smoke.js`.

### Q-8. Chat com frases prontas (js/p_chat.js) — escrita pelo QA, NÃO vista rodando
- Peça ao engenheiro: carregar `'p_chat'` na lista de scripts do js/screens.js e ligar `PANEL_ON.chat` (abrir pelo ícone/botão de chat da batalha; não há item no MENU).
- Peça ao fps-69 (Sistemas): criar `Sys.chat` com as 20 frases prontas (hoje uma tabela de conteúdo no topo da tela, `C_PHRASES`, copiada do protótipo), regras (1 envio a cada 3 s, conta nova só lê na 1ª hora, menores só frases) e motivos de denúncia.
- Sem servidor a tela abre, mostra canais e frases, e diz "O chat precisa do servidor online: em breve"; não há mensagens nem jogadores simulados e o envio só avisa. Não existe campo de texto livre (regra de menores).
- A tela lê de um provedor opcional `window.P_CHAT` (contrato no cabeçalho do arquivo: online, messages(canal), send(canal, i), report, block, mute, cooldownMs, newLeftMs, guild). Quando o servidor chegar, basta definir isso.
- Zero emoji; nomes globais com prefixo XCH/ch*/c* (XC e cClick já eram de p_cfg.js). Smoke: `node test/paineis/p_chat.smoke.js`.

### Q-7. Guilda V2 (js/p_guild.js) — escrita pelo QA (fork), NÃO vista rodando
- Peça ao engenheiro: carregar `'p_guild'` na lista de scripts do js/screens.js e ligar `PANEL_ON.guild` (MENU `soon:guild`, nível 32). Hoje `Sys.guild.DATA.on=false`: a tela mostra "Guildas: em breve" com as regras reais; ligando a chave sem servidor, "Em breve: abre com o online".
- A tela só lê Sys.guild (status, ensure, DATA, perks, memberCap, bannerCap, createCost, canCreate, canJoin, provider.leave). Com guilda (espelho do servidor): nome, nível, cargo, vagas, Brasões, bônus de território, estandartes com tetos, territórios, regras de troca, prêmios do torneio. "Sair da guilda" (2 passos) chama `Sys.guild.provider.leave` e `statsChanged()` ao sair.
- PEDIDO AO fps-69/Sistemas + servidor (nada disto existe em Sys.guild; a tela NÃO mostra e diz "em breve"): lista de membros (nome, cargo, Nv, FC, online, contribuição), chat com frases prontas, chefe da semana e ranking de dano, "na guilda agora", mural de pedidos/doar item, missões da semana, loja de Brasões, XP atual da guilda (barra de nível), criar/entrar/doar/check-in/subir estandarte (ações). Quando a API vier, entram nas abas sem mudar o resto.
- Globais com prefixo pg/XGD/PG_ (XG, gFmt, gToast e gClick já existem em screens.js). Zero emoji. Smoke: `node test/paineis/p_guild.smoke.js`.

### Q-10. Correio (js/p_mail.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_mail'` e ligar `PANEL_ON.mail`; um item/ícone de Correio no MENU (ou no cabeçalho) abrindo `Panels.open('mail')`. A chave do MÓDULO `Sys.mail.DATA.enabled` está false: com ela desligada a tela só diz "O Correio ainda não está ativo" e oferece Voltar (ligar os dois juntos).
- Tudo de `Sys.mail` (inbox, read, claim, claimAll, remove, unread); entrega pelo Sys.loot.grantBundle. Chama `statsChanged()` ao coletar.
- O módulo não guarda remetente nem tipo da carta: a tela não inventa "Arena/Ranking/Evento"; e não existe "carta sem anexo some 7 dias depois de lida" (só expira em `DATA.expireDays`). Se o PO quiser remetente/tipo, Sistemas (fps-69) precisa acrescentar `from`/`type` ao `Sys.mail.send`.
- Smoke: `node test/paineis/p_mail.smoke.js`. Zero emoji.

### A-17. (agente A, v0.12.7; reescrito depois da reversão) Montarias: o que está pronto para a tela 33 (js/p_mounts.js)
- MENU: item "Montarias" (`FB_DROP`, id `mount`, `act: 'soon:mounts'`, nível 38; no Modo dono sempre). Aparece quando a tela `mounts` estiver registrada. Ícone provisório: o de Pets.
- Batalha (js/mountfx.js): `mountLook()` → {id, stars, aura}; `mountIds()` → só as LIGADAS (lobo, grifo, pônei, cavalo, tigre; a serpe `wyvern` está fora: reprovada).
- Equipar / desmontar: `Sys.mount.equip(S, id | null)` + `statsChanged()`. Asa: `wingArt(item)` (index.html).

### A-18. (agente A, lote v0.12.8; reescrito) Pedidos
- PARA A ARTE (via PO): folhas de aura por estrela das montarias SEM a espada de referência; tabela de quadros de "preparo" do golpe por inimigo.
- PARA O AGENTE B: `window.startInstanceRun(run)` está em js/instfx.js atrás de `NEXT_ON` (desligado até eu conferir); falta carregar `'p_inst'` e ligar `PANEL_ON.inst`.

### Q-9. Códex das Eras V2 (js/p_codex.js) — escrita pelo QA, NÃO vista rodando
- Peça ao engenheiro: carregar `'p_codex'` e ligar `PANEL_ON.codex`; o item "Códex" do MENU abre `Panels.open('codex')` (a tela usa `Screens.close` no Voltar).
- Catálogo 100% real (arte conferida em assets/, atributos de Sys.stats.DATA.main, montarias de Sys.mount.DATA.mounts, nomes de assets/enemies/meta.json). Papagaio-fênix virou "Papagaio".
- PEDIDO AO fps-69 (Sistemas): não existe módulo de "descobertas" do Códex. A tela espera, atrás das chaves `window.P_CODEX.owned` e `.rewards` (desligadas; nada aparece, sem espaço vazio): `readOwned()` → ids que o jogador já teve (w-<era>-<0|1|2>, a-<era>-<colete|helmet|gloves|boots|necklace|wings>, m-<id>, p-<pet>-<0|1|2>, b-<era>-<e0|e1|boss>, u-<7|10|13>) e `readRewards()` → `{claimed:[%], marks:[{p, txt}], claim(p) → {ok, txt}}` (marcos em % da coleção, prêmio fixo; só o próximo aparece). Os valores "[QTD]" do protótipo são do PO.
- Zero emoji. Smoke: `node test/paineis/p_codex.smoke.js` (117 caminhos de arte conferidos).

### A-19. (agente A, lote v0.12.8) Aviso único de mudança de poder: tire o seu "FC +N"
- O jogo passa a ter UM aviso de mudança de FC, em `fcNotice()` (index.html), chamado dentro do `statsChanged()` e ao subir de nível: compara
  `Sys.fc.snapshot` de antes e de depois por `Sys.fc.delta` e mostra "+1,2 mil ▲" / "−340 ▼" com a FC total contando; soma avisos seguidos; fica por cima
  do painel aberto (z-index 80). Está atrás de `NEXT_ON` (index.html) até eu conferir.
- Quando eu ligar, tire o "FC +N" próprio do "Equipar melhor" e do arrastar (js/screens.js / js/equipfx.js), para não aparecerem dois. Basta você
  continuar chamando `statsChanged()` depois de equipar/fortalecer/alimentar: o aviso sai sozinho.

### Q-14. Missão guia na batalha (js/p_guide.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_guide'` e ligar `PANEL_ON.guidehud`. Montar o rastreador DENTRO do contêiner da batalha (position:relative/absolute, base de 390 px): `PGuide.mount(el)` uma vez ao entrar na batalha (ou `Panels.open('guidehud',{parent:el})`; `Panels.defs.guidehud.close()` remove). Chamar `PGuide.update()` a cada ~0,5 s junto do HUD: só mexe no DOM se algo mudou.
- Posição do protótipo 04c: left 76 px, top 124 px, 236x48 (sob a barra de fase, fora da faixa dos inimigos/Kael); recolhe num selo 48x48 com contador. z-index 30; se o topo da batalha for outro, ajustar `left/top` na classe `.pgd` (js/p_guide.js).
- Tudo de `Sys.guide` (current / claim); some inteiro se `Sys.guide.DATA.on` for false ou a fila acabar. Resgate: `Sys.guide.claim` + `statsChanged()`. Toque na missão em andamento vai ao destino (gear/summon/shop: setView; tela registrada: Screens.open; senão aviso).
- Eventos do guia (`Sys.guide.onEvent`: kill, boss, equip, summon...) continuam sendo do engenheiro; sem eles a barra não anda.
- Smoke: `node test/paineis/p_guide.smoke.js`. Zero emoji.

### Q-13. Passe com rolagem (js/p_pass.js, painel 'passv2') — escrito pelo QA, NÃO visto rodando
- Troca do Passe antigo: carregar `'p_pass'`, ligar `PANEL_ON.passv2`; no MENU o item `pass` (hoje `Screens.open('pass',{tab:'rewards'})` em fullbattle.js) passa a abrir `Panels.open('passv2')`. A aba de missões do Passe antigo sai: o botão "Missões" do novo abre `Panels.open('missions')` (p_missions.js, Q-6); o MENU "Missões" também deve abrir direto essa tela.
- Trilha única rolável: todos os níveis de `Sys.pass.DATA.tiers`, nível atual destacado e centralizado ao abrir, sem páginas. Dados só de Sys.pass (progress, reward, ensure().free/.prem/.premium, season, held, claimAll).
- PEDIDO a Sistemas (fps-69): `Sys.pass.claimTier(S, host, 'free'|'premium', nível)` → `{ok, gems, gold, item, held, skin}` (hoje só existe `claimAll`). Sem ele o nível pronto mostra "Pronto" e só o botão "Resgatar tudo" entrega; com ele aparece "Resgatar" por nível (a tela detecta sozinha).
- "Ativar Premium" não cobra nem liga o premium: abre "Pagamento em breve". Quando existir compra, o jogo chama `Sys.pass.setPremium(S, true)` e a tela já mostra "Premium ativo" e entrega a trilha premium.
- Chama `statsChanged()` ao resgatar; sem aviso próprio de poder; zero emoji. Smoke: `node test/paineis/p_pass.smoke.js`.

### Q-12. Perfil e Coleção (js/p_profile.js) — escrita pelo QA, NÃO vista rodando
- Peça ao engenheiro: carregar `'p_profile'` e ligar `PANEL_ON.profile` (abre por `Panels.open('profile')`, p.ex. tocando no avatar/nome no MENU).
- Real hoje: cartão (nível, FC, era, VIP, título em destaque), aba Títulos (Sys.titles: equipar = `setFeatured`, bloqueado = só prévia no cartão, filtros), Estatíst. (abates, chefes, torre, pets, eras) e Coleção de títulos. Equipar chama `statsChanged()`; sem aviso próprio de poder.
- Pedido ao fps-69 (Sistemas), atrás de `window.P_PROFILE.{frames,auras,wings,stats}` (desligadas; leitores `readFrames/readAuras/readWings/readStats`, contrato no topo do arquivo): (1) MOLDURAS de avatar com posse, origem e equipar; (2) escolha de AURA e ASA com posse (hoje a aura vem da forja e a asa do item); (3) estatísticas de conta: maior dano num golpe e tempo jogado; (4) ID da conta (só se o servidor tiver) e raridade dos títulos, que o protótipo mostra e o módulo não tem.
- ACHADO em js/sys/titles.js (módulo de Sistemas, não mexi): `DATA.condText.petStar` devolve "Fênix com 5★" (a fênix saiu do jogo; "★" é símbolo gráfico). A tela troca "★" por "estrelas", mas o título "Laço Lendário" (`phoenix5`) ainda cita a Fênix: trocar para o pet que valer.
- Smoke: `node test/paineis/p_profile.smoke.js`. Zero emoji.

### B-25. Para o agente A: tela 10 Vitória/Derrota pronta para ligar (depois que eu olhar no navegador)
- Chave sua: `SCREENS_ON.bossResult = true` no index.html. Chamadas já existentes: `resOpen('win', {stage, loot, gems, newEra})` no
  `waveClear()` e `resOpen('lose', {stage})` no `step()` quando `B.deadT` zera com `B.deadBoss`. Não precisa de atraso: a tela espera a
  morte do chefe terminar (`life - t` do corpo, teto de 3 s; sem folha `*_die`, o tombo de 1,4 s).
- Derrota: sem editar o `battle.js`, `resOpen('lose')` põe `B.deadT = 0.8` e `B.deadBoss = true` (função `resHeroDown`, no `screens2.js`)
  para o Kael ficar caído atrás da tela, e o `resClose` devolve. Se preferir fazer do seu lado, apago as duas chamadas.
- `holdC` no `battle.js` ficou sem uso (a tela não segura mais o corpo do chefe). O `toast` reserva do `waveClear` ainda tem emoji.
- O golpe final em câmera lenta com "CRÍTICO!" do protótipo é cena do canvas: seu.
- Com `Panels.on('era')` e era nova, quem abre é a Troca de era e a tela 10 não abre (já era assim).

### A-20. (agente A, v0.12.8) MENU e rotas do lote de telas; resposta ao B-25
- NOMES que o MENU espera (`act: 'soon:<nome>'` = nome da tela registrada): forge, pets, mounts, tower, inst, rank, arena, events, guild, tourney, auction,
  mail, vip, codex, chat, map. Missões: `Panels.defs.missions`; Passe com rolagem: `passv2`; Perfil: `profile` (aberto pelo avatar, nível 10).
- Uma entrada aparece quando: a tela está registrada, `PANEL_ON.<nome>` está ligada, não quebrou ao desenhar e o jogador tem o nível. Você só precisa ligar a chave.
- `Screens.open(nome)` agora recusa painel desligado (devolve false), igual ao `Panels.open`.
- B-25: use `heroDown(true)` / `heroDown(false)` (js/battle.js) no lugar de mexer em `B.deadT` / `B.deadBoss`; o aviso reserva da vitória ficou sem emoji. O `SCREENS_ON.bossResult` eu ligo junto com você, na conferência.
- Q-14: a missão guia é montada pelo HUD (`PGuide.mount(#fb_w)` + `PGuide.update()` a cada 0,25 s) quando `PANEL_ON.guidehud` estiver ligada, atrás de `NEXT_ON`.
- Códex, Chat e Mapa: sem nível definido; ficam atrás de `NEXT_ON` até o PO dizer o nível.

### B-26. Lote v0.12.8, para o agente A: rotas, MENU, títulos e aviso de poder
- CARGA: o `js/screens.js` agora carrega, além das que já carregava, `p_arena`, `p_events`, `p_tourney`, `p_map`, `p_profile`, `p_pass`,
  `p_guide`, `p_guild`, `p_codex`, `p_mail`, `p_chat`. Todas com a chave `PANEL_ON` DESLIGADA em `js/panels.js`. NÃO carrego `p_intro`:
  o teste de conflito acusa dois nomes globais repetidos (`esc`, também em `js/artprev.js`; `KAIA_ON`, também em `js/intro.js`).
- ROTA ÚNICA: `Panels.open(nome, o)` confere a chave e chama `Screens.open(nome, o)` (que troca a tela e chama o `onOpen`). Com a chave
  desligada devolve `false` e nada abre: é o que parecia "Panels.open não troca a tela". Use um ou outro, é a mesma tela.
- 'missions': o `setView` do index troca `'missions'` por `'pass'` + aba Missões. Enquanto isso existir, com `PANEL_ON.missions` ligada o
  `js/panels.js` registra a tela 34 também como `missions34` e desvia `setView('missions')` para lá. O conserto limpo é seu, uma linha:
  no `setView`, `else if(v==='missions' && !(Screens.reg.missions && !Screens.reg.missions.broken)){ v='pass'; passTab='mis'; }`.
  Aí eu apago o gancho (`hookMissions`).
- MENU (`FB_MENU` / `FB_DROP` / `fbAct`, seus): o item Missões hoje chama `Screens.open('pass', {tab:'missions'})`; com a tela 34 ligada
  troque por `Screens.open('missions')`. Itens que passam a ter tela quando as chaves ligarem (nomes do registro): `arena`, `events`,
  `tourney`, `map`, `profile`, `passv2` (ou `pass`, conforme a decisão do PO sobre as duas versões), `guild`, `codex`, `mail`, `chat`,
  `mounts`, `missions`, `tower`, `inst`, `rank`, `vip`, `forge`, `pets`, `cfg`. `guidehud` e `era` não são itens de MENU (um é peça do
  HUD da batalha, o outro abre na troca de era).
- TÍTULO DO CABEÇALHO cortado em tela estreita ("Inst…", "Ran…", "Miss…", "Equipame…"): o cabeçalho de 56 px é seu. Sugestão: o título
  encolher a fonte (clamp) ou as pílulas de moeda/gema cederem espaço em 360 px.
- AVISO DE PODER (A-19): preparado. Com `NEXT_ON` verdadeiro e `fcNotice` existindo, o meu selo "FC +N" do Equipamento ("Equipar melhor" e
  arrastar) não é desenhado; a contagem do número na caixa da FC continua. Com `NEXT_ON` falso nada muda.
- NÚMEROS: o `kf` das minhas telas agora chama `Sys.stats.abbr(v, {pt: PANEL_V2.ptNum})`, com `ptNum` LIGADA (mil, mi, bi, tri). O seu HUD
  usa o mesmo `kf` quando ele existe (`fbTick`): os números do topo também passam a sair em português. Se não quiser isso agora, diga.

### B-27. Passe: pedidos a Sistemas e ao QA (decisão do PO pendente sobre qual versão fica)
- SISTEMAS (`js/sys/pass.js`): `Sys.pass.claimTier(S, host, 'free' | 'premium', nível)` → mesmo formato de resposta do `claimAll` para um
  nível só. Hoje a tela resgata um nível trocando as listas internas do módulo em volta do `claimAll` (`pClaimOne`, js/screens2.js):
  frágil se a entrega falhar no meio ou se a temporada virar durante a chamada.
- QA (`js/p_missions.js`): (1) ao resgatar missão DIÁRIA chamar `Sys.level.onMission(S, Sys.host)` e, no bônus das diárias,
  `Sys.level.onDailyBonus(S, Sys.host)`, com `onLevelUp(resposta)` quando `levels > 0` (é o que o Passe faz hoje; sem isso a missão diária
  para de dar XP do jogador quando a tela 34 ligar); (2) `parent: 'pass'` no `Panels.add` quando o Passe estiver liberado, para o Voltar
  cair no Passe; (3) `p_pass.js`: a lista não abre no nível atual da 2ª abertura em diante (o `onOpen` roda depois do 1º desenho).

### B-28. Para o engenheiro: ícone "Oferta 24h" no HUD da batalha (protótipo da batalha V2) e o que a Oferta precisa
- Tela: `js/p_offer.js`, registro `offer`, chave `PANEL_ON.offer` (DESLIGADA; já está na lista de carga). Abre com `Panels.open('offer')`.
- Ícone do HUD: mostrar só quando `window.Panels && Panels.on('offer')` E `Sys.offer.status(S, Sys.host)` disser que a oferta está valendo
  (ativa, não comprada, não expirada); o relógio do ícone vem de `status().msLeft`; some ao comprar ou expirar. Sem emoji.
- Para ligar faltam: o módulo `Sys.offer` carregado fora do `NEXT_ON` e com a chave dele ligada; o pagamento (`Sys.buy`) entregando de
  verdade; a decisão do PO sobre abrir sozinha no 1º acesso.
- Também seu: `js/sys/mail.js` não está na lista de módulos do index (o Correio está ligado e abre vazio sem o módulo).

### A-21. (Engenheiro 2, v0.12.8, Bloco A) Pedidos
- PARA A ARTE (via PO): `assets/anim/mounts/kael_wolf_idle_body.png` e `kael_wolf_run_body.png` têm um RESÍDUO ESCURO (rabisco preto, resto da arma apagada)
  entre a cabeça do Kael e a cabeça do lobo; aparece no jogo por cima da asa. Conferido desenhando o quadro 0 da folha sozinho: está no arquivo, não é do código.
- PARA A ARTE (via PO): nas montarias pônei, cavalo e tigre, parado e correndo, a cabeça da maça (arma da era 0) fica em cima da boca/queixo do Kael
  (ângulo do grip da folha). Com espada não incomoda. Decisão de arte: baixar a mão ou girar o grip.
- PARA O AGENTE B (informação, js/p_forge.js): na Forja o Kael da vitrine aparece com uma ESPADA quando a arma equipada é o "Machado de Osso" (maça); a vitrine
  do Equipamento mostra a arma certa. Usar `heroLook()` como o Equipamento.
- PARA O AGENTE B / PO (informação): o letreiro da ultimate ("Lâmina do Dragão!") é roxo em qualquer raridade; a tinta, as partículas e o anel do golpe final
  seguem a raridade. Se o PO quiser a borda do letreiro na cor da raridade, é uma linha no meu `startAct`.

### Q-16. Mapa das Eras ligado à curva do Sys.phases (js/p_map.js) — QA, NÃO visto rodando
- Com `Sys.phases.DATA.on=true` o mapa lê TUDO do módulo: era aberta/vencida/atual = `eraOpen/eraCleared/eraMax`; dificuldade aberta = `eraView(S,e).diffs[d].open`; melhor fase = `bestOf`; FC rec./nível-trava/prêmio = `info`/`fcRec`/`lvlEntry`/`rewardOf`; "Desafiar" = `canChallenge` (brilha com `glow`); abre na fase onde o jogador parou (`ensure(S).cur`). Desligado: mantém o caminho de hoje (save convertido como o `migrate`).
- Para ligar (engenheiro): (1) as 3 chaves juntas (`Sys.level.setV9(true)`, `Sys.stats.setEra9(true)`, `Sys.phases.DATA.on=true`) + `Sys.phases.migrate(S,host,S.stage)` na carga; (2) `PANEL_ON.map` (já ligada pelo engenheiro) e o item Mapa do MENU; (3) a LUTA tem de ler `Sys.phases.ensure(S).cur={e,d,n}` (o "Desafiar" grava isso e abre a Batalha) e usar `Sys.phases.enemy(e,d,n,kind)` no `mkEnemy` (js/battle.js, §1 de reports/ligar-sistemas-e2.md); (4) ao VENCER a fase, chamar **`window.PMap.win(e,d,n)`** (ou direto `Sys.phases.win(S,host,e,d,n)`): grava o melhor, avança `cur`, devolve `{first,next,eraUnlocked,reward}`; com `PMap.win` o mapa mostra "Fase N vencida. Próxima: ..." ou "Era N liberada: <nome>!" ao reabrir; o prêmio (`reward`/`rewardOf(d)`) é entregue pelo jogo; (5) `host.eraMax()` = `Sys.phases.eraMax(S)`.
- Falta no módulo (Sistemas): nada para a tela; o mapa não mostra "dias para fechar a era" nem estrelas por fase (não existem no Sys). Teste: `node test/paineis/p_map.smoke.js` (cobre desligado e ligado).

### Q-15. Aparência (js/p_look.js) — escrita pelo QA, NÃO vista rodando
- Peça: carregar `'p_look'` na lista de scripts do js/screens.js, ligar `PANEL_ON.look` e abrir pela aba/botão "Aparência" do Equipamento (`Panels.open('look')`).
- A tela só CONTROLA via `Sys.appearance` (completo, nada a pedir a Sistemas): modo Itens/Skin (`setMode`), olho por peça asa/botas/colete/chapéu/óculos/máscara (`setLookHidden`), cosméticos (`equipCosmetic`, `DATA.cosmetics`), o que aparece (`layers`). Chama `statsChanged()` ao mudar.
- FALTA DO ENGENHEIRO (prévia em camadas): `drawHeroPreview(canvas, look, dt)` (js/battle.js:1065) só recebe `{armor, weapon}`; não desenha chapéu por era, óculos, máscara, botas/colete em cor nem asa. Por isso a vitrine desta tela é o Kael parado simples. Quando existir algo como `window.drawHeroLayers(canvas, Sys.appearance.layers(S,Sys.host), dt)`, troco a vitrine por um `<canvas>`; hoje a batalha é quem mostra as camadas.
- Cosméticos: nomes e origem (loja/evento/conquista) são os PROVISÓRIOS do módulo e não há preço em gemas: toque num não possuído só explica. Sem emoji. Smoke: `node test/paineis/p_look.smoke.js`.
