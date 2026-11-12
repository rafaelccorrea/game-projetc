# Agente B: painéis iguais aos protótipos

Arquivos meus: `js/screens.js`, `js/screens2.js`, `js/equipfx.js` (novo), `test/paineis/*` (novo, teste sem navegador).
Não toquei em `index.html`, `js/fullbattle.js`, `js/battle.js`, `js/sys/*`, `assets/**` nem na versão.

## Estado em uma linha

Itens 1 e 2 **escritos e NÃO vistos rodando**: nenhum navegador foi aberto. O que existe de conferência é leitura do protótipo contra o código,
`node --check` nos três arquivos e um teste de fumaça em Node (DOM falso) que executa as telas de verdade e não acha erro de execução.
Posição, cor, tamanho na tela, animação e toque no celular **não foram conferidos**.

## Como voltar atrás (chave por parte)

`PANEL_V2` (topo de `js/screens.js`; também dá para definir `window.PANEL_V2 = {...}` antes dos scripts):

| Chave | O que liga | Desligada |
|---|---|---|
| `fit` | encolher a tela até caber o arranjo completo do protótipo e ocupar a largura toda | volta ao corte de linhas e à base fixa de 390 px |
| `equipFly` | itens voando no "Equipar melhor" | troca direta, só a FC contando |
| `equipDrag` | arrastar da mochila ao espaço | só toque |
| `shopCol` (desligada) | aba "Coleção" da Loja | 4 abas, como no protótipo |
| `ptNum` (desligada) | sufixos mil, mi, bi, tri no formatador `kf` | K, M, B, T (como está hoje no jogo todo) |

Cópia dos dois arquivos antes das mudanças: pasta temporária da sessão (não há git no projeto). Se precisar, peço e devolvo.

---

## Bloco 1: conferência das telas 05, 06, 07, 08 e 16 contra o protótipo

### Mudança que vale para as cinco: altura e largura

O protótipo tem 704 px de conteúdo; a folha da batalha em tela cheia dá 656 px. Antes, a tela cortava linhas (mochila com 1 fileira, loja com
1 fileira de skins, passe com 4 níveis). Agora (`xFit`) a tela encolhe uns 3 a 4% e mostra o arranjo completo do protótipo; a largura da base
cresce junto, então o conteúdo ocupa a tela de ponta a ponta (sem faixa escura dos lados). Só cai no arranjo curto se precisar encolher mais de
14% ou se o espaço de equipamento ficar com menos de 44 px. Em tela alta sobram linhas a mais (até 4 fileiras de mochila, 3 de skins, 7 níveis).
Peças em coordenada fixa (vitrine do Kael, palco do baú) ficam numa caixa de 390 px centrada.

Contas (sem navegador): 390x844 na folha → escala 0,96, 2 fileiras; 360x640 → 0,86, 2 fileiras; 320x500 → arranjo curto, espaço de 47 px;
tablet 768x1024 → o `#app` já vira uma moldura de celular de 430 px (regra do index.html), escala 1,10.

### 05 Equipamento

| Diferença achada | Protótipo | Estava | Agora |
|---|---|---|---|
| Mochila na folha | 2 fileiras (124 px) | 1 fileira | 2 fileiras |
| Título da mochila | "Todos os itens" / "Itens: Colar" | "Itens" / "Colar" | igual ao protótipo |
| Cartão da skin | "Skin Épica +5% ATK/HP" 11 px + "Coleção de skins +3,5%" 10 px | número grande 16 px + linha de 9 px | igual ao protótipo (valores do `Sys.skin`) |
| Aura de fortalecimento atrás do Kael | aura +13 em 111,64 (168x210) | não existia | aparece conforme o +N da arma (`Sys.forge.aura`): azul, roxa, chamas, dourada |
| Aviso (toast) | 14 px | 13 px | 14 px |
| Botão "Progresso" | não existe no protótipo | botão com texto, apertava a linha | botão só com a medalha (44 px), com rótulo para leitor de tela |

Diferenças que ficam, de propósito:
- Camada "mid" do cenário e a faixa de nuvens (6 px, 80 de altura): o jogo não tem a mesma imagem do protótipo; ficou sky, nuvem, far e chão.
- Botão "Equipar e upar até o meu nível" e a confirmação de custo: não estão no protótipo, são decisão do PO.
- "Mochila 18/60 · ícones provisórios (SVG)": tirei o "provisórios", os 49 ícones aprovados já estão no jogo.
- Fim da animação `stUp`/`stDn` em `#0e0a07` (o protótipo termina em `#1d1611`, que é a cor errada da célula: daria um salto de cor).

### 06 Invocar

| Diferença achada | Protótipo | Estava | Agora |
|---|---|---|---|
| Selo "FALTAM" | roxo (`#c9a3ff→#7a45d6`), número 18 px em cima, "FALTAM" 9 px embaixo | dourado, ordem invertida, 22 px | igual |
| Título da garantia | "Garantia da melhor raridade liberada a cada 10" | "Baú de Equipamento" + "Garantia 3 / 10" | igual |
| Progresso da garantia | 10 gomos roxos (8 px, raio 4, vão 3) | barra dourada contínua | igual |
| Rótulo das chances | "Chances neste nível" | "Chances no seu nível" + frase extra à direita | igual |
| Selo do x10 | "1 de brinde" verde no canto | não existia | aparece quando o x10 custa menos que 10 x1 (regra do `Sys.loot`: 9x) |
| Rodapé | não existe | bloco de 44 px com duas frases | removido (o palco do baú volta a ter 262 px na folha) |
| Faíscas | 5, sobem 150 px em 3 s | 4, 110 px em 3,2 s | igual |
| Aviso do palco | entra descendo, 2,2 s | 2 s, parado | igual |
| Grade do resultado | vão 10 px | 14 px | igual |
| Brilho das cartas | branco 0,55, ciclo 2,2 s | 0,40, 3 s | igual |

Ficam, de propósito: chip de raridade trancada (cadeado + nível/era), preço do x10 em valor cheio (o protótipo mostra "9 × [OURO]", que é
marcador), botões apagados sem ouro, etiqueta "GARANTIA", selo de equipado e "Desmontado" nas cartas (estados reais que o protótipo não modela),
porcentagem com vírgula quando a chance é quebrada. Camada "mid" e nuvem alta do cenário: mesma razão do Equipamento.

### 07 Loja

| Diferença achada | Protótipo | Estava | Agora |
|---|---|---|---|
| Regra de ouro | 44 px, 11 px, à esquerda: "Skins dão bônus: +2% a +10% de ATK e HP pela raridade, e cada skin da coleção soma +0,5%" | 34 px, centrada, outra frase | igual (números lidos do `Sys.skin`) |
| Botão VIP dourado (64 px, coroa) ao lado da regra | existe | não existia | existe; abre a tela 18 quando ela existir, por enquanto avisa "Clube VIP: em breve" |
| Abas | 4: Skins herói, Skins arma, Itens (ouro), Gemas; 2 linhas, 13 px, moeda e gema de 20 px | 5 (com "Coleção"), 1 linha, 12 px, outra ordem | igual; "Coleção" fica atrás de `PANEL_V2.shopCol` |
| Grade de skins na folha | 2 fileiras | 1 fileira | 2 fileiras |
| Selo do destaque | "OFERTA" vermelho + "Termina em" | "DESTAQUE" + "Troca em" | "OFERTA / Termina em" quando é a skin do dia; "DESTAQUE / Troca em" quando o destaque é só a melhor à venda |
| Etiqueta do destaque | "Lendário · Medieval" | com "+X%" | igual |
| Skins Míticas/Lendárias | entram animando e brilham | o brilho anulava a entrada | as duas animações |
| Aba Itens | "Estoque do dia" + "Repõe em", cartões de 196 px com raridade, ícone 44, nome, "Espaço · Era", todos os atributos, preço de 24 px, "Comprado" verde | cartão de 60 px no topo, cartões de 150 px com 1 atributo, "Esgotado" cinza | igual |
| Confirmação em ouro | atributos dentro da caixa + "Vai direto para a mochila. Sem sorteio." | atributos fora, sem a frase | igual (mantive "Seu ouro X → Y") |
| Avisos da aba Itens | "Já comprado hoje. Repõe à meia-noite" / "Comprado: X (na mochila)" | "Esgotado: volta amanhã" / "Comprou: X" | igual |
| Aba Gemas | nota "Só pacotes de gemas, compra direta..." antes do VIP; bloco "Clube VIP" com coroa e seta | nota diferente depois; cartão "VIP n" com botão "Comprar VIP" | igual (benefícios lidos do `Sys.vip`) |
| Comprar sem gemas | botão dourado abre a confirmação com "Faltam N gemas" e "Ver gemas" | botão cinza + aviso | igual |
| Quadro da arma na prévia | 188, −22, parado | 176, −10, balançando | igual |

Ficam, de propósito:
- Marcadores do protótipo que não são tela de verdade: "[QTD] gemas", "[PREÇO]", selos "prévia, animação em produção", "arte pendente".
  Os pacotes de gemas continuam com "Em breve" e o toque avisa "Pagamento em breve: nada é cobrado agora" (o protótipo abre um diálogo com
  quantidade e preço, que ainda não existem).
- Preço do item em vermelho quando falta ouro; paginação da aba Itens só se o estoque passar de 6.
- Nome da era por extenso no selo de skin bloqueada (o protótipo abrevia "Pré-Hist."); não medi se cabe.

### 08 Passe

| Diferença achada | Protótipo | Estava | Agora |
|---|---|---|---|
| Níveis por página na folha | 5 | 4 | 5 |
| Cartão Grátis resgatado | o cartão inteiro apaga | só ícone e texto | igual |
| Cabeçalho | respiro 12 px, linha alinhada pela base | 8 px, pelo centro | igual |
| Missões | todas na tela, sem paginar | paginava (4 + 1) | sem paginação quando cabem com linha de 74 a 86 px; só pagina se não couber |
| Ícone que voa | 40 px | 36 px | 40 px |
| Voo de moeda/gema na batalha em tela cheia | — | ia para o canto (o HUD antigo está escondido) e passava por trás da folha | vai para as pílulas novas (`fbTarget`) e passa por cima |

Ficam, de propósito: "Ativar Premium" sem "[PREÇO]" e sem o botão "Testar (protótipo)"; textos do diálogo Premium com a regra real (Itens da
Temporada nos níveis 27 e 30); linha bônus "Complete as diárias" e missão de instância com "Em breve" (dados reais do `Sys.pass`);
"itens da sua era" na paginação (regra real); selos "prévia"; ícone de equipamento aprovado (imagem) no lugar do traço SVG.

### 16 Práticas e Títulos

A conferência achou a tela igual em medidas, cores, estados e animações. Mudou:
- Texto do total das práticas: 13 px (estava 12).
- Na batalha em tela cheia, o título "Progresso" do cabeçalho some (a folha já mostra o título); o botão de voltar e as abas ficam.

Ficam, de propósito ou fora do meu alcance:
- Textos de condição e de bônus dos títulos vêm de `js/sys/titles.js` (não é meu): "Chegar ao andar N" x "Vencer o andar N", "% crítico" x
  "pt crít.", "% defesa" x "% def.", "Fênix com 5★" x "Fênix em 5 estrelas", "Ter os 5 cabelos" x "Todos os cabelos (5)". Pedido registrado.
- Estado "práticas bloqueadas até o nível N" e lista vazia: reais, não existem no protótipo.
- Cadeado dos títulos balança (o do protótipo é parado) e a medalha do aviso balança: não mexi.
- Pulso dourado no contador de abates do título ("tick"): não fiz.

---

## Bloco 2: Equipamento, pedido novo do dono

### Botão "Equipar melhor"

- Quem decide o melhor é o `gBest` que já existia: para cada um dos 7 espaços testa cada item da mochila com `Sys.fc.compute(S, host, {item})`
  e fica com o de maior FC. Respeita `Sys.stats.slotOpen` (asa só no nível 50), `Sys.stats.canEquip` (asa só Épica ou acima) e o item
  adormecido (o `Sys.fc` já calcula o adormecido rendendo menos, então ele só entra se ainda assim for melhor).
- Toque: cada item que vai trocar sai da célula da mochila (ou do próprio botão, se estiver em outra página), sobe, faz um arco e pousa no
  espaço dele, um a cada 0,11 s, 0,52 s de voo. No pouso: anel claro no espaço, som e vibração curta.
- Quando o último pousa, a troca é aplicada de uma vez: os espaços que receberam item dão um pulo com brilho, a FC conta do valor antigo ao novo
  em 0,9 s, o número cresce e fica verde, a caixa da FC acende e aparece "+N" verde; aviso "Equipou N itens melhores".
- Nada a melhorar: botão apagado com "Já está com / o melhor" (duas linhas, para caber na barra); o toque repete o aviso.
- Durante o voo o toque na tela não vale e a tela não é redesenhada por fora. Se a animação não terminar (aba em segundo plano), um relógio de
  segurança aplica a troca. Com "reduzir movimento" ligado no aparelho, a troca é direta.

### Arrastar da mochila ao espaço

- Pointer events (dedo, caneta, mouse), em `js/equipfx.js`. O arrasto só começa depois de 10 px de movimento: o toque simples continua abrindo
  a comparação como hoje.
- Ao arrastar: o item vira um "fantasma" que segue o dedo (no toque ele sobe meio item acima do dedo, para dar para ver), a célula de origem
  apaga, o espaço certo pulsa em verde e os outros apagam; passando por cima do espaço certo ele cresce e fica claro.
- Soltar no espaço certo: o fantasma encaixa e o item equipa (mesma contagem de atributos do toque). Soltar em outro espaço: aviso "Este item vai
  no espaço X" e o item volta. Soltar fora, ou gesto cancelado pelo sistema: o item volta com animação. Asa bloqueada: aviso do nível.
- Área de soltar: o espaço mais 20% de folga em volta. Espaço de 58 px na base; a escala mínima do arranjo completo garante 44 px.
- Sem rolagem e sem seleção: `touch-action:none` nas células, `user-select:none` e sem menu de toque longo dentro das telas cheias, e o arrasto
  nativo de imagem é barrado.
- Botão direito do mouse e segundo dedo são ignorados. Logo depois de soltar, o clique fantasma é ignorado por 0,45 s.

---

## O que NÃO pôde ser conferido sem navegador

Tudo o que é visual. Em particular:
1. Se a escala de 0,96 na folha deixa as cinco telas sem corte e sem sobra feia; se os textos em 2 linhas (abas da Loja, "Já está com o melhor",
   regra de ouro) cabem.
2. O voo dos itens: trajetória, tamanho do fantasma, pouso em cima do espaço certo (as contas usam `getBoundingClientRect`, não vi).
3. O arrastar no celular: se o Android não rouba o gesto, se o dedo não cobre o item, se o toque simples continua limpo.
4. A aura atrás do Kael (uso `mix-blend-mode: screen`; a batalha usa mistura aditiva no canvas): pode ficar forte ou fraca demais.
5. Aba Itens da Loja com item de 4 atributos: se as linhas cabem nos 196 px.
6. Missões do Passe com 5 linhas de 78 px na folha: se o texto de 2 linhas cabe.
7. Voo de moedas/gemas do Passe até as pílulas novas do HUD.
8. Lado a lado com o protótipo e prints: nenhum foi feito.

O que foi verificado sem navegador: `node --check` em `screens.js`, `screens2.js`, `equipfx.js`; teste de fumaça `test/paineis`
(`node test/paineis/smoke2.js && node test/paineis/smoke_all.js . 390 656`): carrega o index, os módulos e os scripts reais num DOM falso e
desenha Equipamento (com filtro e comparação), Invocar, Loja (5 abas, prévia, confirmações), Passe (3 abas) e Progresso (2 abas) em 390x656,
360x583, 320x500, 390x704, 390x780 e 430x866; simula "Equipar melhor" (3 itens, FC 764 → 1.313, botão apagado depois), arrastar ao espaço certo
(equipa), ao errado (volta, com aviso), soltar fora (volta), toque simples (abre a comparação), botão direito e segundo dedo (ignorados).
32 passos, 0 falhas, nenhum "undefined"/"NaN" no HTML. Isso prova que o código roda, não que a tela está certa.

## Pedidos pendentes ao agente A

Em `reports/pedidos-entre-agentes.md`. Nenhum trava os itens 1 e 2: o `js/equipfx.js` é carregado pelo próprio `screens.js`.

---

## Bloco 3: contorno comum (cabeçalho + VOLTAR), sem barra de baixo. Escrito, DESLIGADO, não visto

Pedido do PO: nenhum painel com barra de navegação de baixo; cabeçalho da V2 + botão VOLTAR, tela cheia; um componente só.

- O contorno mora em UM lugar: `xHead()` / `X_HEAD` / `xWrap()` em `js/screens.js`. As cinco telas e todas as novas passam pelo `xWrap`, então
  trocar o cabeçalho quando os protótipos convertidos chegarem é mexer só ali.
- Hoje o `xHead` é um palpite meu (não há protótipo convertido ainda): 64 px, botão redondo de vidro com a seta de voltar (44 px), título em
  Lilita 24, pílulas de moedas e de gemas (atualizadas 4x por segundo). VOLTAR chama `Screens.close()`.
- Chave `PANEL_V2.frame`, **desligada**. Ligada: o painel ocupa a tela inteira (`#view` de cima a baixo), e somem a folha da batalha
  (`#fbsheet`, `#fbdim`) e a barra de abas (`#tabs`), por CSS meu com a classe `xframe` no `body`. O Passe esconde o X dele e o Progresso
  esconde o voltar e o título próprios (ficam as abas internas).
- **Altura (conta, não visto):** com o contorno, em 390x844 sobram 780 px de conteúdo (o protótipo tinha 704; a folha de hoje dá 656).
  A tela deixa de encolher (escala 1,00) e ainda ganha linhas: mochila com 3 fileiras, passe com 6 níveis. Em 360x640 ainda encolhe para 0,86
  (a tela é baixa demais para o arranjo completo de qualquer jeito).
- **Depende do agente A?** Para funcionar, não: o CSS que tira a folha é meu. Mas a folha é dele, e eu passar por cima dela é contorno;
  registrei o pedido B-8 para ele decidir se a folha sai de vez (aí eu tiro o meu CSS) e para tratar a área segura de cima (entalhe do
  aparelho), que o meu cabeçalho ainda não respeita.

### Varredura: restos do layout antigo nos meus arquivos

| Onde | O que assumia o layout antigo | Situação |
|---|---|---|
| `screens.js`, CSS `body.full #view{top:var(--hudh);bottom:var(--navh)}` | painel entre o HUD de 64 px e a barra de abas de 76 px | fica só para o modo antigo (chave da batalha em tela cheia desligada); na folha o A já sobrepõe; com `frame` ligado eu sobreponho |
| `screens.js`, alturas `rows = H>=680`, `H>=674`, `PER = H>=682` | 704 px de conteúdo (844 − 64 − 76) | corrigido no bloco 1 (`xFit`) |
| `screens2.js`, `yFly` voando para `#gold`, `#gems`, `#lvb` | HUD antigo | corrigido: pílulas do HUD novo, ou as do cabeçalho do painel com `frame` |
| `screens2.js`, `rAfter` pulsando `#fcv` | HUD antigo | corrigido: pulsa a FC do HUD novo quando a batalha é em tela cheia |
| `screens2.js`, Passe com botão "Fechar o Passe" e Progresso com "Voltar" e título próprios | cada tela com a sua saída | escondidos quando o contorno comum está ligado |
| `screens2.js`, avisos do Passe (`bottom:112px`) e da Loja (`bottom:16px`) | relativos ao painel, não à barra | sem mudança |
| `screens.js`, aba "Coleção" da Loja (tela antiga de Skins, visual antigo) | conteúdo da era das abas | fora da barra (bloco 1) |
| `screens.js`, texto "Mochila cheia: desmonte itens em Equip." | nome da aba antiga | fica (o ícone da V2 também se chama "Equip.") |
| `screens2.js`, tela 10 antiga (`resOpen`, classe `resui` que esconde `#hud` e `#tabs`) | HUD e abas antigos | continua desligada; será substituída pela 10 nova |
| `screens2.js`, botão "Ir" das missões → `setView('battle')` | — | funciona nos dois layouts |

Fora dos meus arquivos (não mexi; pedido B-9): `index.html` ainda tem regras de aviso pensadas para a barra (`body.full[data-v=pass] #toast`
com `bottom: calc(var(--navh) + ...)`), o tutorial aponta para `#tabs [data-t=gear]`, e `openSettings` ainda é o modal antigo.

### Modo MANUAL removido (ordem do dono): varredura por "manual" / "AUTO" nos meus arquivos

- `js/screens.js`, `js/equipfx.js`, `js/panels.js`: nenhuma ocorrência (nenhuma tela mostrava a opção nem falava em "manual").
- `js/screens2.js`: só a tela 10 antiga (desligada) lia `S.set.auto` para decidir se a contagem de fechar sozinha rodava, e o comentário
  falava em MANUAL. Agora a contagem sempre roda (`RES.autoOn = true`; tocar na tela ainda a cancela) e o comentário foi corrigido.
  Não havia texto de interface com "AUTO" ou "MANUAL".
- A tela 09 Configurações atual não é minha (`openSettings`, no index.html, tem a linha "Combate automático": é do agente A). A 09 nova,
  quando eu a escrever, sai SEM a chave AUTO/MANUAL, mesmo que o protótipo a desenhe.
- Os subagentes da Forja e da Pets V2 não têm essa opção nas telas deles; confiro por busca quando entregarem.

## Bloco 4: registro das telas novas. Escrito, desligado

`js/panels.js`: `Panels.add(nome, {title, render, click, tick, busy, onOpen, onClose})`. Cada tela nova mora em `js/p_<nome>.js` e nasce
desligada (`PANEL_ON.<nome> = false`). Com tudo desligado o arquivo não envolve nada do jogo. Para conferir: `?debug=1&painel=forge`.
Quando o `Screens.register` do agente A existir, o `Panels.enable` entrega a tela a ele; até lá, estende por fora (pedido B-3).

## Bloco 5: tela 15 Forja. Escrita, DESLIGADA (`PANEL_ON.forge`), não vista rodando

Arquivo `js/p_forge.js` (escrito por subagente, conferido por mim com `node --check`, teste de fumaça e busca por "manual"). Já está na lista de
carga do `screens.js`; desligada, só se registra. Conferir: `?debug=1&painel=forge` e `Screens.open('forge')`.

O que faz (todo número do `Sys.forge` / `Sys.stats`):
- Portão: antes do nível de `Sys.level.unlockLevel('forge')` mostra cadeado, as pedras guardadas e voltar.
- Modos "Fortalecer +N" e "Nível"; pedras de `Sys.forge.ensure(S).stones`.
- Palco: Kael no pedestal com a aura real do +N da arma (folhas `aura4/7/10/13`), pastilhas de prévia +0, +4, +7, +10, +13, espaço escolhido
  em destaque com o martelo.
- 7 espaços (asa com cadeado até o nível 50), trilha +1 a +15 com o teto da era (`Sys.forge.capOf`).
- Fortalecer: bônus, chance (a do módulo, sem dobro), pedras, ouro e garantia de `Sys.forge.canTry` / `attempt`; estados Fortalecer, Forjando,
  Faltam pedras, Falta ouro, Teto da era, Máximo +15. Sucesso chama `statsChanged()`.
- Nível: nível do item equipado, mesmas chamadas do Equipamento (`Sys.stats.canUpgrade` / `upgrade`).
- Missão "colete pedras de forja": a tela não conta nada (o `passSync` do index já conta).

Diferenças conscientes em relação ao protótipo (o PO precisa ver):
1. **7 espaços em vez de 2**: o protótipo só tem arma e armadura no palco; a regra do dono são 7. Ficou uma faixa de 7 botões abaixo do palco.
2. **Modo "Transformar" ficou de fora**: no protótipo ele só tem marcadores (`[OURO]`, `[N]`). Decisão do PO: entra ou não.
3. **Cartão "Nível" segue o jogo** (nível do ITEM, 1 a 100, teto no nível do jogador), não o texto do protótipo (nível do espaço 1 a 60).
4. Custo em ouro mostrado de verdade (o protótipo diz "a confirmar"); pedras de forja na linha dos modos (o cabeçalho é o comum).
5. Cores das faixas de aura do protótipo, não as de `Sys.forge.DATA.auras[].col`.

Para o PO / fps-e2: o "+X% do espaço" mostrado é o valor bruto de `DATA.bonus`; em botas, colar e asa o `Sys.stats` aplica metade
(`pctForgeShare`) e a tela não mostra isso. "N falhas" da garantia é conta da tela (garantia ÷ `pityPerFail`).

Não conferido: tudo o que é visual; toque real. Em 320 px de largura os botões de 48 px ficam com ~39 px e as pastilhas de aura com ~36 px
(abaixo de 44): a corrigir quando eu vir a tela. Fechar de verdade (`Screens.close`) não roda no DOM falso.
Teste: fumaça 46 passos, 0 falhas, em 390x656, 390x844, 360x583; teste de cliques do subagente (17 passos: portão, sem pedra, sucesso, falha,
sem ouro, teto da era, máximo, asa, nível) sem falha.

### Forja ajustada ao protótipo CONVERTIDO (v0.12.2; continua desligada, não vista)

- Layout novo: tamanho real, o miolo rola (`x-scroll`) e guarda a posição da rolagem no redesenho; em tela alta o cartão estica e a ação
  fica embaixo. Ordem e medidas do protótipo: pedras (44) · modos (52, botões de 44) · palco (258, peças presas ao centro e às bordas) ·
  faixa dos 7 espaços · trilha · cartão com o aviso sempre visível.
- Subtela do Equipamento: `parent:'gear'`, sem voltar próprio; o portão de nível diz "Voltar ao Equipamento". O `js/panels.js` agora
  faz o Voltar de uma subtela ligada levar à tela-mãe (envolve o `Screens.close()` só quando há subtela ligada; contorno do pedido B-11).
- Alvos de toque medidos no teste (px reais): espaço 44,6x50 em 320 de largura, 54,6x50 em 390; pastilha de aura 52x44; ação 56.
- Ficam: 7 espaços (o protótipo convertido ainda desenha 2), sem "Transformar" (só marcadores no protótipo e sem função no `Sys.forge`),
  "Nível" = nível do item. Em tela baixa, rolada até o botão, a faixa "+N!" / "Falhou" do palco pode ficar fora da vista.
- Testes: `node --check`; fumaça 54 / 0 falhas; teste de cliques do subagente, 19 passos da Forja em 4 medidas, sem falha.

## Bloco 8: tela 09 Configurações nova. Escrita, DESLIGADA (`PANEL_ON.cfg`), NÃO carregada, não vista

Arquivo `js/p_cfg.js` (subagente; conferi `node --check`, fumaça, busca por "manual" = 0 e por chamada de rede = nenhuma).
- Aba "Som · Jogo": Som (mesmas chamadas do modal antigo), Música e Efeitos em controle deslizante (só se `GameAudio.setVolume` existir),
  Velocidade x1/x2/x4 com cadeado e o motivo lido de `Sys.vip.maxSpeed` (x2: nível 15 ou VIP; x4: VIP 5 e nível 40), Vibração, Desafiar o
  chefe sozinho. SEM Auto/Manual.
- Aba "Conta · Progresso": nome e nível; **Exportar** (código `EON1:<base64>.<8 letras de conferência>`, campo selecionável, botão Copiar com
  reserva); **Importar** (valida prefixo, base64, conferência, UTF-8, JSON e campos do save; confirmação "Substituir o progresso?" com nome,
  nível, moedas e gemas do código; grava, confere a gravação e recarrega; código inválido não muda nada); **Resetar** em dois passos.
  Nada sai do aparelho.
- Diferenças conscientes: 2 abas em vez de 3 (ficaram de fora qualidade gráfica, bateria, notificações, vincular Google/Apple, idioma, ID,
  ajuda, código de resgate, termos: o jogo não tem nada por trás); as 8 letras de conferência no código (um caractere trocado não vira save
  adulterado); fundo com as camadas da era 2 desfocadas.
- Para o agente A / áudio: o volume não é gravado pelo `js/audio.js`; a tela guarda em `S.set.volMus`, `volSfx`, `musOff`, `sfxOff` (campos
  novos no save) e reaplica ao carregar. Os valores de fábrica (música 50, efeitos 90) estão copiados numa constante da tela.
- Não conferido: tudo o que é visual; arrastar o controle de volume; selecionar/colar no campo; teclado do celular cobrindo a janela;
  cópia real para a área de transferência; a recarga.
- Testes: fumaça 54 / 0 falhas; teste de cliques do subagente, 27 passos em 4 medidas (ida e volta do save com acento e emoji idêntica,
  17 tipos de lixo recusados, cancelar, falha de gravação, resetar).
- O arquivo não está na lista de carga do `screens.js` (entra quando for visto; pedido B-10 ao A lista os arquivos).

## Bloco 6: tela 17b Pets V2. Escrita, DESLIGADA (`PANEL_ON.pets`), NÃO carregada, não vista rodando

Arquivo `js/p_pets.js` (subagente; conferi `node --check`, teste de fumaça 50 passos / 0 falhas em 390x788, 360x583, 320x500, e busca por
"manual", fênix e tipos: só dois comentários dizendo que a fênix saiu). Relatório detalhado do subagente ainda por chegar; o que já é certo:
- Só a TELA. Não liga ovo, chocar nem pet na batalha. Não mexe em chave do `Sys.pet`: lê o estado; sem o módulo carregado ou com a chave da
  17b desligada (`Sys.pet.setV17`), mostra "Pets: em breve" (é o que o teste de fumaça desenha, porque o index não carrega `pet.js`).
- Os 10 pontos do PO estão na tela, segundo o subagente, com teste de cliques dele (116 passos, 4 tamanhos, módulo carregado e `setV17(true)`
  só dentro do teste): fênix fora; ovo da era sem sorteio; ovo à escolha por `chooseEgg`; "guardado até o nível X"; repetido "+10 fragmentos";
  travas `evolve` / `cap` do `canFeed`; bônus por `fcShare` (% da FC total); sem tipos; andar 100 = "ovo Épico à escolha (Dragão ou Papagaio)".
- **Defeito achado no módulo** (`Sys.pet.feedTap` gasta a ração e não grava o nível): pedido B-14 à fps-e2; a tela tem um contorno isolado.
- Funções que faltam exportar: pedido B-15.
- O arquivo NÃO está na lista de carga (o `screens.js` está congelado): pedido B-16.

## Congelamento para o APK da v0.12.1 (aviso da coordenação recebido ~16:13)

- Não gravo mais em `js/screens.js` nem `js/screens2.js` até o aviso "APK da v0.12.1 gerado". Só arquivos novos atrás de chave.
- **Atenção, para a coordenação decidir:** as minhas últimas gravações nesses dois arquivos foram ANTES do aviso, mas depois do começo da
  v0.12.1: `screens.js` às 16:05:59 (entrada do `p_forge` na lista de carga; antes disso o contorno `frame` desligado e os ganchos das telas
  novas) e `screens2.js` às 16:01:43 (`RES.autoOn = true` na tela 10 desligada; antes disso o destino do voo e o pulso da FC). Tudo inerte
  com as chaves como estão, mas não é byte a byte o que o agente A viu ao fechar a versão. Pedido B-13 registrado.
- `js/panels.js` (16:12, arquivo novo, inerte): com o `Screens.register` do A, deixou de envolver o `setView` (o index já chama onOpen/onClose).

### Rascunho: ajustes a aplicar em `screens.js` / `screens2.js` assim que liberar (NÃO aplicados)

1. Progresso: tirar a seta de voltar e o título internos (o cabeçalho do A já tem Voltar e título; `Screens.close()` já volta ao Equipamento).
2. Equipamento: entrada para a Forja como subtela (posição e desenho conforme o protótipo convertido; auditoria em curso).
3. Apagar o meu cabeçalho `xHead` / `PANEL_V2.frame` (o cabeçalho de 56 px do A é o contorno comum; pedido B-12) e o CSS `xframe`.
4. Altura útil nova (tela − 56 px = 788 em 390x844): o `xFit` já se adapta sozinho (lê a altura do `#view`); conferir as fileiras a mais.
5. **Mudança de fundo, vale para as 5 telas:** os protótipos convertidos NÃO encolhem o desenho para caber. Desenham em tamanho real, deixam
   sobra quando a tela é alta (com a paginação e os botões principais colados embaixo, `margin-top:auto`), ROLAM quando é baixa
   (`overflow-y:auto`) e param de alargar em 600 px (`max-width:600px`, centrado). O meu `xFit` faz o contrário (encolhe e muda o número de
   fileiras). Plano para quando liberar: o `xFit` passa a nunca encolher pela altura (só escala pela largura, com teto), o conteúdo ganha
   rolagem, e as contagens voltam a ser fixas (mochila 2 fileiras, skins 2 fileiras, passe 5 níveis, títulos 8). Isso desfaz parte do bloco 1.
   Pergunta ao PO: confirma rolagem dentro do painel? (a regra antiga era "sem rolagem onde o protótipo não rola"; agora o protótipo rola.)

#### 07 Loja contra o protótipo CONVERTIDO (nada aplicado)
- Altos: conteúdo rola em vez de encolher (padding 8/12/10); grade de skins SEMPRE 2 fileiras (6 por página; hoje ganha 3ª ou cai para 1);
  paginação colada embaixo (`margin-top:auto`).
- Médios: aba Gemas sem versão "pequena" (rola); toque no pacote de gemas abre "Confirmar compra" com "Você recebe", "Valor",
  "Pagamento em breve: nada é cobrado agora." e botões Cancelar / Entendi (hoje só aviso; quantidade e preço ainda são marcadores);
  nota da prévia "Equipada: +X% de ATK e HP (Raridade). Na coleção: +0,5% para sempre."; tela larga para em 600 px.
- Baixos: confirmação em ouro sem a linha "Seu ouro"; brilho de Mítico/Lendário também na skin bloqueada; Kael da grade 4 px acima;
  nomes curtos de era na pílula ("Pré-Hist.", "Antiguid."); posições do palco da prévia em `calc(50% ...)`; aviso "Equipada: Nome" sem FC.

#### 08 Passe contra o protótipo CONVERTIDO (nada aplicado)
- Altos: SEMPRE 5 níveis por página (hoje, em 788 px, mostra 6); barra Recompensas/Missões com 52 px (hoje 40); seletor Diárias/Semanais
  com 52 px (hoje 44); "Resgatar tudo / Ativar Premium" e paginação colados embaixo; conteúdo rola em tela baixa.
- Médios: missões com linha fixa de 86 px, sem paginação (rola); paginação "itens no seu nível (Nv. N)" e item da trilha com "· Nv. N"
  (hoje "itens da sua era", sem nível: depende da regra real do `Sys.pass`, perguntar à fps-30); tela larga para em 600 px.
- **Decisão do PO:** o diálogo Premium do protótipo diz "Skin da temporada no nível 25 (só visual, não muda atributos)", o que contradiz o
  bônus de skin da Loja ("Skins dão bônus"). Mantive o texto atual até decidirem.
- Baixos: ícone de linha do equipamento na trilha; anel de "desbloqueou" ao ativar o Premium.

#### 16 Progresso contra o protótipo CONVERTIDO (nada aplicado)
- Altos: dentro do conteúdo só as ABAS, ocupando a largura toda (faixa de 52 px, botões de 44 com `flex:1`); sem Voltar e sem título (ficam
  no cabeçalho; o Voltar leva ao Equipamento). Hoje a faixa tem a seta e um título vazio e as abas ficam espremidas à direita (36 px).
  Filtro Todos/Conquistados/Bloqueados com 52 px e botões de 44 (hoje 40 e 32). Conteúdo rola; padding 8/12/10.
- Médios: fileiras da grade de títulos com no mínimo 100 px; painéis crescem em vez de encolher.
- Baixo: contador de abates pulsa ao subir.

Também a corrigir junto: `X_HEAD` (64) só vale com a minha `frame`, que vai sair; a altura útil real já vem do `#view` (788).

#### 05 Equipamento contra o protótipo CONVERTIDO (auditoria por leitura; nada aplicado)

Mudança de fundo: o protótipo novo não encolhe nem corta. O conteúdo ROLA, a vitrine tem altura `clamp(236px, 34vh, 292px)` com os espaços
presos às bordas e o Kael preso ao centro, a mochila tem sempre 2 fileiras (10 por página) e o "EQUIPAR MELHOR" mora numa barra fixa embaixo.

Altos:
- Botão numa **barra fixa embaixo** (padding 8/12/10, fundo `#1d1611`, borda de cima), não no cabeçalho da mochila.
- Com melhoria: 56 px de altura, raio 16, Lilita 21, texto **"EQUIPAR MELHOR"** em maiúsculas, seta de 20 px e **selo com a contagem** de
  itens (24 px, fundo `#2a1403`, texto `#ffe07a`). Hoje: 40 px, 14 px, sem selo.
- Sem melhoria: mesmo botão apagado, duas linhas: "EQUIPAR MELHOR" (19 px) e **"Você já usa o melhor de cada espaço"** (11 px). O aviso do
  toque é "Você já usa o melhor". Hoje: "Já está com o melhor" (texto do pedido original do dono; o protótipo aprovado manda o outro).
- Mochila: 2 fileiras fixas; tirar as fileiras extras e o corte para 1 fileira; trocar o encolhimento por rolagem.
- Vitrine com altura responsiva e peças presas a borda/centro/fundo (hoje caixa de 390 px com posições fixas).
- **Selo "FC +N"** grande no meio da vitrine (pílula verde, Lilita 22, 1,6 s, sobe e some), no "Equipar melhor" E ao soltar o item certo
  no arrasto. Hoje: "+N" pequeno dentro da caixa da FC, e nada no arrasto.
- Arrasto: o espaço certo ganha o **anel dourado** (o mesmo do filtro) e cresce 1,14 com o dedo em cima; os outros espaços NÃO apagam.
  Hoje: verde pulsando e os outros apagados.

Médios:
- Voo: 0,64 s (hoje 0,52), começa em escala 0,9, sobe 46 px fixos no meio em 1,25, termina em 0,85; fantasma de 48 px, raio 12, fundo
  `#4a3a2b→#1d1611`, brilho dourado; item de outra página sai do centro da grade (hoje sai do botão).
- Pouso: nada por item; quando a troca aplica, TODOS os espaços trocados fazem `land` juntos (escala 1→1,22→1, anel `#ffe07a` com brilho,
  0,55 s). Hoje: anel branco, som e vibração a cada pouso.
- FC: a mesma contagem de 650 ms e o mesmo realce de qualquer troca (hoje 900 ms e realce maior).
- Arrasto: fantasma centrado no dedo, girado −4°, escala 1,1, só sombra preta (hoje sobe acima do dedo, sem giro, com brilho); ao soltar
  fora ou errado o fantasma só some (hoje volta animado à célula); textos "Esse item vai no espaço X" e "Já está equipado".
- Botão Progresso (medalha) não existe no cabeçalho da mochila do protótipo: com Forja e Progresso como subtelas, preciso saber ONDE ficam
  as entradas delas (pergunta ao PO: o protótipo convertido não desenha nenhuma das duas no Equipamento).
- Subtítulo "Mochila N/60 · arraste o item até o espaço".
- Camada "mid" do cenário e nuvens: continua sem a imagem.

Baixos: cabeçalho da mochila, "Ver todos" e paginação com 44 px (hoje 40); arrasto começa com 8 px (hoje 10) e acerta só em cima do espaço
(hoje com folga de 20%); linha da comparação 27 px; folha de comparação com rolagem; aviso 1,9 s.

Dois pontos em que eu NÃO seguiria o protótipo sem ordem expressa (decisão do PO):
- "ao soltar fora, o item só some": o pedido do dono dizia "o item volta com animação". Mantenho a volta animada até decidirem.
- "sem folga na área de soltar": no dedo, acertar 58 px exatos é mais difícil; manteria a folga.

#### 06 Invocar contra o protótipo CONVERTIDO (nada aplicado)

- Alto: o palco do baú ESTICA (`flex: 1 1 262px`) com o baú centrado, e garantia, chances, grátis e botões ficam colados EMBAIXO. Hoje o
  palco para em 262 px e, nos 788 px, sobram ~210 px vazios abaixo dos botões.
- Alto: em tela baixa o conteúdo do palco REDUZ (escala 0,72 até 700 px de altura, 0,6 até 600); hoje ele sobe e corta os raios.
- Médio: palco com 100% da largura (hoje 366 px fixos); camada "mid" e nuvens.
- Baixos: grade do x10 encolhível; etiqueta "LENDÁRIO!" sempre 10 px; linha "Melhor" sem cor; aviso com escala 0,9 na entrada.
- Ficam por decisão anterior: selo "GARANTIA", som por carta.

## Bloco 7 (v0.12.2): layout novo dos protótipos convertidos nas 5 telas. Escrito e LIGADO, NÃO visto rodando

Chave `PANEL_V2.real` (ligada). Desligada, volta o arranjo anterior (escala pela base de 390 + `xFit`), sem mexer no resto.
Conferência feita: `node --check` (screens.js, screens2.js, equipfx.js) e teste de fumaça 54 passos / 0 falhas em 390x788, 360x584,
320x500, 430x876 e 768x968 (inclui "Equipar melhor" e os 4 casos do arrasto). Nenhuma tela vista.

Base (vale para as 5): tamanho real, sem escala (1 px da tela = 1 px do protótipo); largura até 600 px, centrada; altura útil lida do
`#view` (tela − área segura − 56 px do cabeçalho do agente A); o conteúdo ROLA quando falta altura (classe `x-scroll`, sem barra visível);
contagens fixas de novo. Paginador comum `xPager`: "‹ 2/5 ›" centrado, número ENTRE as setas, botões redondos de 44 px, seta apagada e
desabilitada na primeira/última página (a seta de página não parece mais um Voltar; era isso que o QA via na Loja e no Passe).

- **1) Dois voltar.** Loja e Passe: era a seta do paginador (corrigido acima). Passe: o X próprio não aparece mais na batalha em tela cheia.
  Progresso: saíram a seta e o título internos; ficam só as abas, na largura toda (52 px, botões de 44). O Voltar do cabeçalho já leva ao
  Equipamento (`Screens.close()` usa `XR.back`). Forja: `parent:'gear'` depende do pedido B-11 (a tela está desligada).
- **05 Equipamento.** Vitrine com altura `clamp(236, 34% da tela, 292)`; espaços presos às bordas (10 px) e em % da altura; Kael, pedestal
  e aura presos ao fundo e ao centro; atributos; mochila sempre com 2 fileiras (10 por página), cabeçalho de 44 px, subtítulo
  "Mochila N/60 · arraste o item até o espaço"; tudo isso rola. Barra FIXA embaixo com o botão de 56 px: "EQUIPAR MELHOR" + selo com a
  contagem; sem melhoria, apagado em duas linhas: "EQUIPAR MELHOR" / "Já está com o melhor" (texto confirmado pela coordenação; o
  protótipo diz "Você já usa o melhor de cada espaço"). O "como melhor" que o QA leu era a quebra de linha sem espaço do botão antigo.
  Voo: 0,64 s, fantasma de 48 px com brilho dourado, sobe 46 px, termina em 0,85; item de outra página sai do centro da mochila; a tela
  rola para o topo antes; sem efeito por pouso: todos os espaços brilham juntos (dourado, 0,55 s) quando a troca aplica; contagem da FC
  de 650 ms com o realce comum; selo "FC +N" (pílula verde, 22 px, 1,6 s) no meio da vitrine, também ao soltar certo no arrasto.
  Arrasto: começa com 8 px, fantasma centrado no dedo, girado −4°, escala 1,1; o espaço certo ganha o anel dourado e cresce 1,14 com o
  dedo em cima; os outros não apagam; avisos "Esse item vai no espaço X" e "Já está equipado".
  Botão "Forja" no cabeçalho da mochila só quando a tela da Forja estiver ligada; a medalha do Progresso continua lá.
- **06 Invocar.** O palco do baú estica (`flex: 1 1 262px`, mínimo 170) com o baú centrado; garantia em cima, chances, grátis e botões
  colados embaixo; em tela baixa o conteúdo do palco reduz (0,72 até 700 px de tela, 0,6 até 600).
- **07 Loja.** Conteúdo rola (padding 8/12/10); grade de skins sempre 2 fileiras; paginador colado embaixo com "N na coleção"; aba Gemas
  sem versão pequena; paginador novo também na aba Itens.
- **08 Passe.** Sempre 5 níveis por página; barra Recompensas/Missões e seletor Diárias/Semanais com 52 px; "Resgatar tudo / Ativar
  Premium" e paginador colados embaixo; missões com linha de 86 px, sem páginas (rola).
- **16 Progresso.** Abas e filtro com 52/44 px; grade de títulos com fileiras de no mínimo 100 px; tudo rola.

Ficou de fora desta leva (lista curta, para depois de ver no navegador): vitrine e Invocar sem a camada "mid" e a nuvem alta; diálogo
"Confirmar compra" dos pacotes de gemas (quantidade e preço ainda são marcadores); nota da prévia da Loja; nomes curtos de era; anel de
"desbloqueou" e ícone de linha no Passe; pulso do contador de abates; folha de comparação com rolagem; "itens no seu nível (Nv. N)".
Mantidos de propósito até o PO decidir: item volta animado ao soltar fora (o protótipo só some); folga de 20% na área de soltar.

Riscos que só o navegador mostra: rolagem dentro do `#view` (se o Android deixa rolar com o dedo sobre as células, que têm
`touch-action:none` para o arrasto: sobre a mochila o dedo arrasta item, fora dela rola); posição do Kael quando a vitrine fica baixa (o
espaço da asa pode encostar na cabeça); barra de baixo com a área segura de baixo do aparelho; 320 px de largura sem escala (o cartão da
skin de 168 px aperta a caixa da FC).

### Plano (não implementado): PASSE com rolagem contínua, sem páginas

- Uma lista só, do nível 1 ao último (hoje 30 linhas de 70 px + 5 de vão = ~2.245 px), dentro da área que já rola; cabeçalho da
  temporada e abas no topo rolando junto ou presos (`position: sticky`), conforme o protótipo que vier.
- Ao abrir, a lista já aparece rolada até o nível atual (`scrollIntoView` no nó do nível, centrado); a trilha roxa ligada de ponta a ponta.
- "Resgatar tudo" e "Ativar Premium" numa barra fixa embaixo (como o "EQUIPAR MELHOR"), para não precisar rolar 30 níveis até eles.
- Redesenho sem perder a posição: guardar e devolver o `scrollTop` (já faço no Equipamento) e, no resgate de um nível, trocar só a linha.
- Custo: 60 cartões no DOM em vez de 10; as animações de entrada por linha saem (ou valem só para as visíveis). Saem `XP.page`, os pontos
  e o `xPager` do Passe. Missões já estão sem páginas.
- Dúvidas para o protótipo: cabeçalho preso ou rolando; onde fica "itens da sua era"; se há atalho "ir para o nível atual".

## Fila (ordem nova do PO)

15 Forja e 17b Pets V2: sendo escritas agora por dois subagentes, um arquivo cada (`js/p_forge.js`, `js/p_pets.js`), atrás de chave.
Depois: 18 VIP, 11 Troca de era, 12 Ranking, 13 Instâncias, 14 Torre, 10 Vitória/Derrota, 09 Configurações, 21 Perfil. 20 Mapa das Eras: não.

## Atualização da fila (decisões do PO recebidas depois da v0.12.2)

- Ordem de LIGAÇÃO no jogo, uma por APK: v0.12.2 = ajustes das 5 telas (bloco 7); v0.12.4 = Forja e Configurações; Pets V2 com o pacote de pets.
- Configurações: o PO mandou seguir o protótipo (3 abas); as linhas sem função aparecem desabilitadas com selo "em breve" (qualidade gráfica,
  bateria, notificações, vincular Google/Apple, idioma, ID do jogador, ajuda); "código de resgate" e "termos" somem. Exportar/Importar com
  conferência e volume no save aprovados. Ajuste em curso (subagente), em `js/p_cfg.js`.
- 22 Oferta de primeira compra: sendo escrita em `js/p_offer.js`, atrás de `PANEL_ON.offer` (sem preço riscado; "Pacote exclusivo ·
  compra única"; o botão abre "Pagamento em breve").
- 25 Leilão: na fila logo depois (só a entrada no MENU com "Em breve: abre com o online" e a tela em demonstração desabilitada, sem dado
  falso que pareça real). A entrada no MENU é do agente A (`FB_DROP`): pedido a registrar quando a tela existir.
- Passe com rolagem contínua: plano no bloco 7; protótipo ainda em voto, nada implementado.

### Configurações ajustada à decisão do PO (continua desligada, não vista)

- 3 abas do protótipo. "Som · Jogo": Som, Música e Efeitos, Velocidade com cadeado, Vibração, Desafiar o chefe sozinho. "Tela · Avisos":
  tudo "em breve" (qualidade, economia de bateria, notificações), desabilitado, sem opção marcada. "Conta · Ajuda": nome e nível reais,
  "ID do jogador: em breve", Vincular Google/Apple (em breve), Cópia de segurança com Exportar/Importar (ativa), Idioma (em breve),
  Resetar em dois passos, Central de ajuda (em breve). "Código de resgate" e "Termos" não são desenhados.
- Linha "em breve": `disabled`, apagada, selo; o toque só mostra o aviso e não grava nada (testado: save idêntico depois de 9 toques).
- Layout novo (tamanho real, miolo com `x-scroll`, rolagem guardada no redesenho).
- Diferenças pequenas: ícones das notificações em SVG (as imagens do protótipo não existem em `assets/`); "Quando o baú encher".
- Testes: `node --check`; fumaça 54 / 0 falhas (390x788 e 320x500 refeitos por mim); teste de cliques do subagente, 31 passos em 4 medidas.
- A ver no navegador: textos das abas e dos botões de idioma em 320 px; se o toque numa linha desabilitada chega a mostrar "Em breve".

## Bloco 9: tela 22 Oferta de primeira compra. Escrita, DESLIGADA (`PANEL_ON.offer`), NÃO carregada, não vista

Arquivo `js/p_offer.js` (subagente; conferi `node --check`, fumaça e busca por "manual" / preço riscado = 0).
- Estado lido de `Sys.offer.status`; sem o módulo ou com a chave dele desligada: "Oferta: em breve", sem botão e sem preço. A tela não
  liga chave nenhuma do módulo.
- Com o módulo: ativa (relógio que troca só os dígitos, botão de comprar), encerrada, comprada, indisponível.
- "Pacote exclusivo · compra única" + o preço que o módulo der (`status().price`); sem preço no módulo, nenhum número. Sem preço riscado.
- Comprar abre "Pagamento em breve" ("Nada foi cobrado e nada foi entregue"); não chama `grant` nem grava nada (testado: save idêntico).
- Conteúdo do pacote (arma, montaria, gemas, ouro, prazo) do `Sys.offer` / `Sys.mount` / `Sys.stats`.
- Diferenças conscientes: é painel, não modal (sem X e sem "Agora não": sai pelo Voltar do cabeçalho); nome da arma do módulo
  ("Arma Épica 3★", não "Espada Arcana"); montaria com marcador neutro (em `assets/mounts` só há referências de 3 a 4 MB, não arte de
  interface); bônus da montaria como "até +6,5%"; sem "Pagamento pela loja do aparelho".
- Para a fps-e2: `contents` não traz raridade/qualidade da arma, a prévia do ouro nem a raridade da montaria (a tela lê de `DATA` e repete
  a conta `goldk × goldUnit`).
- **Decisão do PO:** o módulo devolve um preço (R$ 29,90 no teste) e a tela o mostra. Se o preço ainda não é oficial, digam e eu escondo.
- Não conferido: tudo o que é visual; quebras em 320 px; rolagem; navegação real para Loja/Equipamento.

## Bloco 10: tela 25 Leilão em demonstração desabilitada. Escrita, DESLIGADA (`PANEL_ON.auction`), NÃO carregada, não vista

Arquivo `js/p_auction.js` (subagente; conferi `node --check`, fumaça e busca por "manual" / `fetch` = 0).
- Selo fixo "Em breve: abre com o online" no topo de todas as abas, com "Demonstração: lances e vendas só valem quando o leilão online abrir."
- Abas Comprar, Vender, Meus anúncios, Histórico no desenho do protótipo, tudo desabilitado. Cartões de lote marcados "EXEMPLO", com
  vendedor, preço e tempo "—"; nenhum relógio corre. Sem nomes de jogadores, lances, preços ou contagens.
- Únicos números reais: o ouro do jogador e os itens da mochila dele (aba Vender, também desabilitada). Regras (taxa, duração, limite)
  aparecem como "a definir com o online".
- Nenhum toque muda o save (teste do subagente: ~400 toques por medida, `JSON.stringify(S)` idêntico, `save()` chamado 0 vezes). Sem rede.
- Diferenças conscientes: sem números de regra do protótipo (10%, 50%, 12/24/48 h); "Marcos de Leilão" virou "moeda do leilão" com saldo
  "—"; Vender mostra os três passos de uma vez; filtro de espaços em grade (sem rolagem lateral).
- Pedido ao agente A (B-17): entrada no MENU.

## Respostas da coordenação aplicadas (aguardando a vez do navegador)

- Oferta: R$ 29,90 é o preço aprovado; a tela já o mostra (vem do `Sys.offer`), sem preço riscado. Nada a mudar.
- Equipamento, soltar fora: o item VOLTA para a mochila com animação. Já está assim (não segui o "some" do protótipo).
- Equipamento, folga da área de soltar: o espaço aceita se o centro do item arrastado cair dentro do espaço ampliado. Já está assim: o item
  fica centrado no dedo e a folga é `max(8 px, 20% do espaço)` = ~11,6 px num espaço de 58 px (os ~12 px pedidos).
- Equipamento, entradas de Forja e Progresso: o protótipo convertido que está em `docs/proto/Equipamento.dc.html` (cópia das 16:12, 65.423
  bytes) NÃO contém as palavras "Forja" nem "Progresso" (busca feita no arquivo inteiro). O protótipo é omisso, então ficam onde estão:
  no cabeçalho da mochila, a medalha do Progresso (44 px) e o botão "Forja" (só aparece com a tela da Forja ligada). Se o PO recopiar um
  protótipo que desenhe as duas entradas, eu movo.
- Leilão: não ligo; ícone e selo do MENU ficam com o PO e o agente A.
- Parado, sem gravar mais nada, até o aviso "sua vez do navegador". Primeiro a conferir: as 5 telas ligadas, o paginador, "Equipar melhor"
  e o arrastar, em 360x640 e 390x844.

## Decisões do PO anotadas (continuo aguardando a vez do navegador)

1. Forja e Progresso: as entradas FICAM no cabeçalho da mochila (medalha do Progresso e botão "Forja"), com alvo >= 44 px e selo de novidade.
   - Progresso: o selo já existe (ponto vermelho quando `progAlert()` é verdadeiro: prática treinável ou título novo; lê `Sys.practice` e
     `Sys.titles`). A medalha tem 44 px de largura e 40 de altura no arranjo antigo; no layout novo o cabeçalho tem 44, mas o botão ainda
     tem 40 de altura: a corrigir.
   - Forja: selo PREPARADO em `js/p_forge.js` (`forgeAlert()`: forja liberada e algum espaço aberto com `Sys.forge.canTry(...).ok`).
     Falta desenhar o ponto no botão "Forja" (uma linha em `js/screens.js`, que está ligado: aplico quando liberarem a gravação, junto com a
     altura de 44 px da medalha).
2. Leilão: ícone provisório = o da Loja com um martelinho por código + selo "Em breve"; o agente A cria o campo de selo no MENU e deixa a
   entrada desligada. Do meu lado nada a fazer agora (a tela está escrita e desligada).
3. Passe com rolagem contínua: protótipo em voto, NÃO implementar (o plano fica no bloco 7).
4. Arena e Eventos: reprovados, sendo refeitos: não fazer.

Pendências minhas em arquivo ligado, para aplicar assim que puder gravar: (a) ponto de novidade no botão "Forja"; (b) medalha do
Progresso e botão "Forja" com 44 px de altura.

## Bloco 11 (v0.12.2): CONFERIDO NO NAVEGADOR (uma aba, fechada). Prints em `reports/prints/v0122_painel_*.png`

Como conferi: `localhost:8080/?debug=1&fresh=1&skip=1`, `#app` forçado em 360x640 (zoom 1, interação real com o ponteiro) e em 390x844
(a janela só tinha 639 px de altura: usei zoom 0,75 da página, que serve para ver o desenho mas desalinha os fantasmas do voo; por isso voo
e arrasto foram testados em 360x640). Nenhum erro no console em nenhuma tela.

VISTO FUNCIONANDO
- As 5 telas abrem em tela cheia sob o cabeçalho do agente A, sem corte nem sobreposição em 390x844; Equipamento também em 360x640 (rola).
- Voltar do cabeçalho: Progresso → Equipamento → batalha. Progresso sem seta nem título internos.
- Paginador "‹ 1/6 ›" (Loja, Passe, Equipamento): número entre as setas, seta apagada no fim; troca de página funcionando.
- Equipamento: "EQUIPAR MELHOR" com o selo da contagem; 4 e 5 itens voaram da mochila e pousaram nos espaços certos (medi o centro dos
  fantasmas contra o centro dos espaços no meio do voo), a troca aplicou, a FC contou (258 → 1.590), apareceu "FC +N" e o aviso; depois o
  botão ficou apagado com "EQUIPAR MELHOR / Já está com o melhor".
- Arrastar com o ponteiro (eventos reais): soltar no espaço certo equipou ("Equipado: Lança de Sílex", com pouso e "FC +N"); soltar no
  espaço errado avisou "Esse item vai no espaço Colete" e nada mudou; a tela rolou para o topo no começo do arrasto.
- Invocar: palco esticado com o baú no centro, garantia em cima, chances e botões embaixo, "1 de brinde".
- Loja: regra + VIP, 4 abas em 2 linhas, OFERTA, 2 fileiras, paginador embaixo. Passe: 5 níveis, ações e paginador embaixo; Missões com
  7 linhas, rolando. Progresso: abas na largura toda, práticas com o aviso de bloqueio, títulos com 8 cartões.

CORRIGIDO NESTA PASSADA
- Tela baixa (360x640): com a mochila à vista os espaços de cima saíam da tela e não dava para arrastar até a arma. Agora a tela rola
  para o topo quando o arrasto começa; a volta do item usa a posição atual da célula.
- Cartão da skin cortava o texto ("Skin Básica +4% A..."): largura 204 px (168 abaixo de 380 px de tela); rótulo "FORÇA DE COMBATE" sem
  espaçamento em tela estreita para não cortar.
- Medalha do Progresso com 44x44; botão "Forja" com 44 px e o ponto de novidade (`forgeAlert`), só aparece com a Forja ligada.

NÃO DESLIGUEI NADA.

NÃO CONSEGUI VER / LIMITES
- Toque de dedo de verdade (testei com ponteiro de mouse): a rolagem por dedo e o arrasto no Android continuam por provar no aparelho.
- Aura atrás do Kael (o save novo não tem +4 na arma); selo da Forja (tela desligada); compra na Loja e resgate no Passe (não cliquei);
  o voo em 390x844 (limite da janela).
- 360x640: o rótulo "Chapéu/Elmo" encosta no selo "+0" do espaço de baixo (vitrine de 236 px). Título do cabeçalho corta em
  "Equipame..." (cabeçalho do agente A).

### Kael do Equipamento não muda ao equipar (defeito visto pelo dono)
- O Kael da VITRINE do Equipamento é meu (`scrGear`, `js/screens.js`): é a classe CSS `kidle` (folha pronta `kael_idle_era2_t<tier>.png`,
  com a arma já pintada), escolhida só pelo tier da SKIN de roupa. Não lê item nenhum, nem a skin de arma, nem a era. Por isso nada muda
  ao equipar. (O desenho em `js/battle.js` ~1002, `PV.sk`/`PV.ws`, é o da Coleção antiga de skins, que saiu da Loja.)
- `Sys.appearance` NÃO é carregado pelo index (conferido no navegador: `Sys` tem loot, chest, level, stats, skin, vip, forge, pass,
  practice, titles, instances, tower, arena, fc). E há um porém na regra "skin > item": todo save nasce com a skin de arma `w00` equipada,
  então `Sys.appearance.of` devolveria sempre a skin e o item nunca apareceria. Precisa de decisão: a skin inicial conta como "sem skin"?
- Depois de equipar, "Equipar melhor" ou arrastar, a tela chama `statsChanged()` (que chama `refreshHero()` do agente A) e redesenha
  (`render()`): não há preview em cache do meu lado. Quando o agente A tiver uma função única de desenho do herói (corpo + arma na âncora),
  eu troco a `kidle` da vitrine por ela (pedido B-18).
- Arte vestível: para chapéu, colete e botas só existem ÍCONES (`assets/icons/slots`); em `assets/hero` há 31 arquivos `era<N>_t<tier>.png`
  (corpo inteiro por era/tier da skin) e `anchors.json`; em `assets/weapons`, 27 PNG `era<N>_t<tier>.png` + `meta.json` (âncora da mão).
  Não há sprite por peça de elmo/colete/botas.

## Bloco 12 (para a v0.12.3): liberação por nível nas minhas telas. Escrito e ligado, NÃO visto rodando

Regra do dono: o que não está liberado fica OCULTO (nem cadeado). Um lugar só em `js/screens.js`: `xUnlocked(id)` / `xUnlockLv(id)`.
Fonte: `Sys.level.DATA.unlock[id]` quando o módulo tem a chave (practice 5, forge 12, instances 14, tower 15); para os ids que o módulo
ainda NÃO tem, tabela minha `X_UNLOCK` (gemShop 10, pass 18, pet 20). `pet` usa a tabela porque no módulo vale 1 enquanto a chave v20 está
desligada. Chave para desligar a regra inteira: `PANEL_V2.gate = false`.

| Onde | Antes do nível | O que acontece |
|---|---|---|
| Equipamento: medalha do Progresso | 5 | não aparece (Práticas E Títulos ficam sem entrada até o 5) |
| Equipamento: botão "Forja" | 12 | não aparece (e a tela da Forja continua desligada por chave) |
| Equipamento: cartão da skin | 10 | aparece, mas o toque não leva à Loja de skins |
| Loja: abas "Skins herói", "Skins arma" e "Gemas" | 10 | a barra de abas some; a Loja mostra só "Itens (ouro)"; a faixa verde diz "Itens do dia: compra direta em ouro, sem sorteio..."; o "+" das gemas do cabeçalho cai nos Itens |
| Loja: botão "Ganhe no Passe" (prévia de skin do passe) | 18 | não leva ao Passe |

Interpretação minha, a confirmar: a ordem dizia "aba de GEMAS só no nível 10 (antes disso a Loja mostra só o que se compra com ouro)".
Como as SKINS se compram com gemas, escondi também as duas abas de skins antes do 10. Se a intenção era esconder só a aba Gemas, é uma
linha. O botão VIP da faixa continua visível (a tabela diz "VIP: compra a qualquer hora").
Não há atalho para Pets, Instâncias ou Torre dentro dos meus painéis ligados. As missões do Passe com botão "Ir" levam à batalha, ao
Invocar ou ao Equipamento (liberados desde o início; Invocar no nível 3 é do MENU do agente A).
Não desfiz a linha do agente A (canvas `gkc` na vitrine, pedido A-11): conferi que continua lá.
Testes: `node --check`; fumaça 62 passos / 0 falhas em 390x788 e 360x584 (save novo, nível 1: a Loja desenha só Itens).

## Bloco 13 (v0.12.3): pedidos do agente A + liberação por nível, CONFERIDOS NO NAVEGADOR (aba fechada)

Prints: `reports/prints/v0123_painel_missoes_nv2_360x640.png`, `..._equip_pistola_360x640.png`, `..._loja_nv1_360x640.png`.
Conferido em 360x640 com ponteiro real e medidas por script; em 390x844 só as alturas (nenhuma tela estoura: 713/713 e 788/788) e o
console (sem erro). Nível trocado por depuração (1, 2, 5, 10, 12, 18).

Feito nesta passada
- A-12 (a): a compra de item da Loja grava `origin:'shop'` (comprei um item no navegador: `origin` = "shop", ouro descontado, cartão "Comprado").
- A-12 / Missões no nível 2: antes do nível do Passe o painel abre só em MISSÕES: sem o cartão da temporada, sem a barra
  Recompensas/Missões, sem "Ativar Premium", sem a nota do XP do passe; o título do cabeçalho fica "Missões". No 18 volta o Passe completo
  (conferido: cartão, abas e "Ativar Premium" de volta, título "Passe"). Missão que só dá XP do passe mostra "(o Passe abre no nível 18)".
- A liberação agora lê a tabela do agente A (`fbUnl` / `FB_UNLOCK`) quando ela existe, para o MENU e os painéis nunca divergirem;
  a minha tabela fica só de reserva.
- Corrigi um erro meu achado na conferência: o "ocultar" do cartão e das abas do Passe não valia (o `display:flex` do mesmo estilo
  ganhava); agora vale.
- Cartão da skin em tela estreita: letra menor para não cortar (não revi depois da mudança).

Visto
- Nível 1: sem medalha do Progresso, sem Forja; cartão da skin não leva à Loja; Loja só com "Estoque do dia" (6 itens em ouro), sem abas.
- Nível 5: medalha do Progresso aparece. Nível 10: abas da Loja (skins e gemas) aparecem e o cartão da skin leva à Loja.
- Nível 12: botão Forja continua oculto (a tela da Forja está desligada por chave: esperado).
- Vitrine do Kael com a arma do item: equipei um Arcabuz (era 3) e a pistola apareceu na mão (canvas do agente A).

Não desliguei nada. Não visto: toque de dedo real; o voo do "Equipar melhor" em 390x844; resgates do Passe.

## Bloco 14 (v0.12.4): FORJA e CONFIGURAÇÕES LIGADAS no padrão, conferidas no navegador (aba fechada)

`PANEL_ON.forge = true` e `PANEL_ON.cfg = true` em `js/panels.js`. Prints: `reports/prints/v0124_forja_mais6_aura_360x640.png`,
`v0124_forja_sem_pedra_390x844.png`, `v0124_configuracoes_360x640.png`. Lista de botões: `reports/botoes-paineis-v0.12.4.md`.
Sem erro no console. 360x640 com zoom 1; 390x844 com zoom 0,75 (janela baixa).

FORJA, visto
- Entra pelo botão "Forja" do cabeçalho da mochila (nível 12; oculto antes) e pelo item Forja do MENU (`Screens.register`). Voltar leva ao
  Equipamento nos dois casos (e do Equipamento à batalha). Pelo MENU antes do nível 12: tela "Libera no nível 12" com "Voltar ao Equipamento".
- Forjei de verdade: +0 → +1 (pedras 60 → 58, ouro −60, FC 938 → 939), depois até +6 (pedras 22, FC 946), aura azul no +4/+6, botão
  "Teto da era" e aviso "Teto da Pré-História: +6. Avance de era para passar." Durante o martelo o botão diz "Forjando...".
- Sem pedra: botão "Faltam pedras" e aviso com onde ganhar (acrescentado nesta passada).
- 360x640: a tela rola (758 de conteúdo em 584); 390x844: cabe inteira.

CONFIGURAÇÕES, visto
- O item Config. do MENU abre o painel novo (o modal antigo não aparece mais; `openSettings(true)`, a confirmação antiga de reset, ficou
  como estava). 3 abas; sem "manual", sem "código de resgate" e sem "termos"; 7 selos "EM BREVE"; tocar numa linha desabilitada mostra
  "Em breve" e o save fica idêntico.
- Exportar → código `EON1:...` (2.366 caracteres). Importar: lixo → "Código inválido: ele precisa começar com EON1:" e nada muda;
  o próprio código → "Substituir o progresso?" com nome, nível, moedas e gemas → confirmar grava e recarrega; recarregando sem `fresh` o
  save voltou igual (nome com acento "João Ñ", ouro, gemas, nível 12, arma +6, pedras 22).

Também nesta passada
- Save antigo: marcador provisório meu `S.bornV` (save com progresso e sem o campo = 'old'): Loja completa e Passe completo para ele.
  Conferido de passagem: o save importado ficou 'old'. Pedido B-19 para o agente A gravar o marcador dele.
- Regra "nada mudo": cartão da skin antes do nível 10, raridade trancada do Invocar, cartão do Passe já resgatado, título bloqueado /
  cosmético / já em destaque e Treinar apagado agora explicam. Os quatro primeiros conferidos no navegador; o do Treinar foi escrito
  depois de fechar a aba.

NÃO visto: arrastar o volume; copiar para a área de transferência; Resetar; modo "Nível" da Forja; falha de forja (as 6 tentativas
acertaram); toque de dedo real.

AVISO: o teste de importar gravou um save de teste (nível 12, "João Ñ") no armazenamento do `localhost:8080` deste navegador. Se alguém
usava um save sem `fresh=1` nesse perfil, ele foi substituído.

## Bloco 15 (rumo ao backlog completo): em andamento, sem navegador

- Save antigo: o marcador provisório `xLegacy` saiu de `js/screens.js`. A fonte única é a do agente A (`S.bornV` + `S.unlKeep`, lidos por
  `fbUnl`, pedido A-13). `node --check` e fumaça ok; não visto no navegador.
- Botão "Forja" do Equipamento some também quando `Screens.reg.forge.broken` (pedido A-13).
- VIP (tela da sessão do QA, `js/p_vip.js`): incluída na lista de carga do `js/screens.js`, chave `PANEL_ON.vip` DESLIGADA. O teste de
  fumaça a desenha sem erro. Conferência contra `docs/proto/VIP.dc.html` fica para a minha próxima vez de navegador.
- Pets V2: o subagente que escreveu a tela está deixando-a pronta para ligar (layout novo, ovo com animação de chocar, folhas reais de
  `assets/anim/pets`, evoluir, alimentar, redefinir, equipar, ovo à escolha). Só `js/p_pets.js`.
- Raridade pela borda e cor: um subagente está fazendo o componente único em `js/screens.js` e aplicando em Equipamento, Loja, Invocar,
  Passe e Forja (existe um `js/rarity.js` do engenheiro atrás de chave desligada; a ordem é reusar se der, ou espelhar medidas e cores).
- A conferir na próxima vez de navegador (escritos e não tocados): cartão do Passe já resgatado, título cosmético / em destaque, botão
  Treinar apagado, e as telas acima.
- VIP, Troca de era e Torre (sessão do QA; pedidos Q-1 a Q-3): `p_vip`, `p_era` e `p_tower` na lista de carga do `js/screens.js`, chaves DESLIGADAS. `node --check` ok nos três; fumaça registra e desenha VIP e Torre sem erro (a Troca de era é overlay: só registra). Conferir e ligar na minha vez de navegador, nesta ordem: Pets V2 e raridade; VIP; Torre; Troca de era (com o agente A).
- Pets V2 PRONTA PARA LIGAR (`js/p_pets.js`, chave desligada, não vista): refeita no layout novo; ovo com animação de chocar; folhas
  reais de `assets/anim/pets` (mamute, esfinge, dragão, papagaio e cão com idle e atk1 nos 3 estágios; atk2/atk3 só no filhote): idle no
  palco e na prévia, ataque na demonstração; Cérbero (folhas incompletas), Pégaso e Raposa em silhueta "em breve".
  O defeito do `Sys.pet.feedTap` (B-14) CONTINUA no módulo: a tela mantém o contorno (devolve a ração e sobe 1 nível inteiro pelo
  `Sys.pet.feed`); a barra parcial de 25 por toque só volta quando a fps-e2 corrigir. B-15 (funções a exportar) também segue aberto.
  Testes: `node --check`; fumaça sem falha; teste de cliques do subagente, 85 passos nas quatro medidas (não reexecutado por mim).
- Pets V2, `feedTap`: a sessão de Sistemas corrigiu o módulo. Conferi em Node (`feedTap` agora grava nível e ração: lobo Nv 1 → 2 → 3,
  ração 100 → 97 → 93) e TIREI o contorno da tela (`ptFeedTap` chama o módulo direto). Teste de cliques do subagente reexecutado por mim
  em 390x788: 149 linhas OK, nenhuma falha; "alimentar 1 toque" grava. Pedido B-14 encerrado; B-15 (funções a exportar) continua.

## Bloco 16: raridade pela borda e cor, componente único. Escrito e LIGADO (`PANEL_V2.rar`), NÃO visto rodando

Componente em `js/screens.js`: `xRar(item | raridade)` (classe `xr xrN` + `data-rar`), `xRarName`, `xRarBox`; CSS com uma regra por
raridade (borda de 3 px na cor, fundo radial com o tom, brilho crescente, pulso só em Mítico e Lendário). A moldura sai no próprio HTML.
Paleta lida do `js/rarity.js` do engenheiro (com cópia idêntica de reserva) e mesmo contrato `data-rar` do `rarDecorate` dele; não chamo o
`rarFrame` porque ele devolve um quadrado fixo que não serve para a célula que o voo e o arrasto procuram.
Aplicado em: espaços e mochila do Equipamento; cartões e título da comparação; cartas do Invocar e a linha "Melhor"; cartões de item e
de skin da Loja, prévia e confirmação; recompensas do Passe; espaço escolhido, faixa e nome do modo Nível da Forja.
Mudanças que aparecem: borda dos cartões da Loja e da comparação de 2 para 3 px; a confirmação de compra de item ganhou o ícone na
moldura; na Forja o espaço escolhido leva a cor da raridade (era sempre dourado), com anel dourado na faixa; nomes no tom claro da raridade.
Ficou de fora: o item garantido da tela 10 antiga (desligada), o fantasma do voo, e as telas `p_pets` / `p_offer` / `p_auction`.
Chave `PANEL_V2.rar = false` devolve o HTML de antes (o subagente relata 54 cenas idênticas byte a byte).
Conferido por mim: `node --check` nos cinco arquivos; fumaça sem falha em 390x788 e 360x584 (voo e arrasto continuam passando); a linha
da lista de carga (`p_vip`, `p_era`, `p_tower`) e a retirada do `xLegacy` sobreviveram à edição paralela.
A ver no navegador: brilho/pulso cortando na borda da mochila; anel dourado da Forja em 320 px; entrada + pulso na Loja e no Invocar;
comportamento junto com `?rar=1` (o `rarDecorate` poria o pulso dele por cima). Pedido B-20 ao dono do `js/rarity.js`.

## Bloco 17 (v0.12.5): conferência no navegador (aba fechada). Prints `reports/prints/v0125_*.png` (5)

360x640 com zoom 1 e ponteiro real; 390x844 só alturas e larguras (nenhuma tela estoura) e console (sem erro). Nível 55 por depuração.

VISTO
- Raridade pela borda e cor: mochila e espaços do Equipamento (brilho sem cortar na borda), comparação, resultado do Invocar x10 (10 cartas
  com moldura e nome na cor, linha "Melhor"), Loja (itens e skins), Passe, Forja: todas desenham com a moldura, sem erro.
  "Equipar melhor" (3 itens voaram, FC 4.718 → 6.247, "FC +N") continua funcionando com a moldura nova.
- Asa: no nível 55 a asa (Mítica) equipou e aparece atrás do Kael na vitrine.
- Passe: resgatar um nível; tocar de novo → "Recompensa já resgatada". Progresso: Treinar apagado → "Faltam pedras de prática: custa 4";
  com pedras, treinou.
- VIP (do QA): abre pelo MENU, carrossel VIP 1 a 10, tabela de benefícios do `Sys.vip`, "Comprar VIP" mostra "Pagamento em breve" e não
  cobra; Voltar → batalha. LIGUEI `PANEL_ON.vip`.
- Torre (do QA): abre pelo MENU, lutei o andar 1 (vitória, prêmio, passou ao andar 2, melhor = 1), aviso "Valendo quando o online abrir".
- Pets V2 (carregada só no teste): mamute no pedestal em posição e escala boas; chocar ovo com a animação → pet obtido; alimentar
  grava (Nv 1 → 2 → 3 ... → 30, ração descontada) e trava em "Evoluir primeiro"; evoluir para Médio trocou a folha. NÃO liguei.

CORRIGIDO
- Arrastar em tela baixa: a rolagem para o topo no começo do arrasto era suave; quem soltava rápido caía no espaço errado ("Esse item
  vai no espaço Arma" ao soltar a arma na arma). Agora a rolagem é imediata. Escrito depois do teste; não revisto.

NÃO LIGUEI: Torre. Motivos (lista devolvida ao QA, pedido B-21): (1) 15 emojis na interface (moeda, pedra, martelo, diamante, ovo, fogo,
arco-íris, cadeado, troféu...), contra a regra "nunca emoji"; (2) o texto "Ovo ... Fênix" (a fênix saiu do jogo); (3) os 3 andares
visíveis: funciona e lê bem em 360x640, mas o protótipo mostra a torre inteira; decisão do PO.
`js/p_era.js` também tem 2 emojis (diamante e bola de cristal): mesma lista.

NÃO VISTO: título "em destaque" / cosmético (o save de teste não tinha título conquistado); arrasto depois da correção; barra parcial de
alimentar (o custo por nível é menor que os 25 por toque até o nível 30); raridade junto com `?rar=1`; toque de dedo real; o VIP em
"Faltam 1 pontos" tem erro de concordância (arquivo do QA, avisado).
