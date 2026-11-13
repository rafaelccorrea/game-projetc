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

## Bloco 18 (rumo à v0.12.6): preparado sem navegador

1. Torre e Troca de era (do QA): conferidas por leitura. Zero emoji nos dois arquivos (busca por faixa de código), sem "fênix" na Torre;
   `node --check` ok; as duas estão na lista de carga; chaves `PANEL_ON.tower` e `PANEL_ON.era` desligadas, prontas para ligar.
   Não achei na Torre um texto específico do andar 100 além dos marcos lidos do `Sys.tower` (a conferir na tela).
2. Escolha de ovo (pedido A-15): registrei `eggpick` no fim de `js/p_pets.js`. `Screens.open('eggpick', {index, options})` leva à tela de
   Pets já com a folha "Escolha seu ovo" aberta; a escolha chama `Sys.pet.chooseEgg` e toca a mesma animação de chocar da tela. Liga
   junto com a tela de Pets. Escrito e não visto.
3. `PANEL_ON.pets` e a entrada `p_pets` na lista de carga: encontrei as duas JÁ ligadas no disco (mudança do agente A no pacote de pets,
   nos meus `js/panels.js` e `js/screens.js`). Mantive. A tela foi vista por mim funcionando na passada anterior (carregada à mão).
4. Espaço de MONTARIA no Equipamento: o protótipo convertido (`docs/proto/Equipamento.dc.html`) não desenha montaria (busca por
   "montaria"/"mount": só um nome de função interno). Nada a fazer; não inventei espaço.
5. Herói do save (Kaia): o que é FIXO no Kael nas telas dos painéis:
   - meu: miniatura do cartão da skin no Equipamento e arte das skins de herói da era 2 na Loja (`js/screens.js`, classe `kidle`);
     cartão da temporada e recompensa de skin do Passe (`js/screens2.js`); palco da Forja; conta nas Configurações; vitrine da Oferta;
     prévia "na batalha" dos Pets. Todos usam a classe CSS `kidle`, que é definida no index.html com a folha do Kael.
   - do QA: VIP, Torre e Troca de era usam o caminho `kael_...` direto.
   - NÃO é fixo: a vitrine grande do Equipamento (canvas do agente A, `drawHeroPreview` / `heroLook`).
   Existem pastas `assets/anim/hyb/kaia`, `kaia_phase1`, `kaia_phase2`, mas nenhuma folha da Kaia em `assets/anim/hyb/R`.
   Pedido B-22: a troca tem de ser num ponto só (a classe `kidle` seguir `S.hero`).
6. Oferta: continua desligada.
7. `js/p_pets.js` usa o caractere "★" para as estrelas (6 vezes): não é emoji colorido, mas vale trocar por SVG; anotado.

Aviso: no momento desta conferência `js/petfx.js` (do agente A) estava com erro de sintaxe na linha 75 (arquivo em edição); o teste de
fumaça acusa "ERRO ao carregar petfx.js". Não é meu arquivo e não mexi.

## Bloco 21 (v0.12.7): tela 33 MONTARIAS. Escrita, carregada, DESLIGADA (`PANEL_ON.mounts`), NÃO vista rodando

Arquivo `js/p_mounts.js` (subagente; conferi `node --check`, fumaça, conflito de nomes e busca por emoji/serpe: nada).
- Palco com o Kael montado animado (folhas `assets/anim/mounts/kael_<id>_idle_era2_t1.png`, uma por vez), aura por estrela; abas Detalhes,
  Estrelas e Coleção; barra fixa embaixo com "Subir nível" e "Equipar" / "Desmontar". Tudo do `Sys.mount`; `statsChanged()` depois de
  cada ação; moldura e nome pela raridade (`xRar`).
- Lista: `mountIds()` do agente A quando existe (pony, horse, wolf, griffin, mythic); reserva com os mesmos ids. A serpe (`wyvern`) é
  cortada sempre, mesmo se estiver no save.
- Sem o módulo ou com a chave dele desligada: "Montarias: em breve". Abaixo do nível e sem montaria: portão com Voltar.
- Diferenças conscientes: não há botão "Subir estrela" (no módulo a estrela sobe sozinha com os fragmentos; a aba mostra o progresso);
  a montaria equipada tem "Desmontar"; "como conseguir" só é específico para o Lobo (oferta de 1ª compra), as outras dizem "Passe, loja
  direta ou evento" (o módulo não tem a fonte por montaria); cartões da Coleção com marcador desenhado (não há miniatura leve: as 5
  folhas somam ~8,7 MB); a prévia mostra o Kael com a arma da era 2 fixa.
- Para o PO: (1) o teto da montaria é nível do jogador ÷ 2 e o máximo dela é 60: com o jogador no 100 ela para no 50; (2) auras de 2 e 3
  estrelas iguais no módulo ("Brilho leve"; o protótipo tem "Brilho forte" na 3ª); (3) a fonte de cada montaria.
- Testes: fumaça sem falha; conflito de nomes ok; teste de cliques do subagente (53 verificações em 5 medidas; 263 HTMLs varridos).
- A ver no navegador: posição do Kael montado no palco, auras, quebras de texto; equipar lobo e grifo e ver o Kael montar na batalha.

## Bloco 22: depois da reversão acidental (`git checkout -- .`)

O QUE SOBREVIVEU nos meus arquivos (estava no commit da v0.12.6 ou em arquivo novo): escolha de ovo (`eggpick`) no `p_pets.js` e no
`panels.js`; correção do arrasto em tela baixa (`equipfx.js`); componente de raridade; liberação por nível; avisos dos botões mudos;
retirada do contorno do `feedTap`; Forja, Configurações, Montarias, Ranking (com o aviso dos simulados no topo do pódio).

O QUE SUMIU E REFIZ (conferido por busca e `node --check`):
- lista de carga do `js/screens.js`: voltaram `p_rank`, `p_inst`, `p_mounts`; acrescentei `p_missions` (tela 34 do QA, chave desligada);
- `PANEL_ON.rank = true` (tela vista funcionando antes da reversão);
- o caractere "★" dos Pets (5 lugares) trocado de novo por "N estrelas".

O QUE SUMIU E ESTÁ SENDO REFEITO por subagente: o Passe com rolagem contínua + botão "Missões" (`js/screens2.js`), a partir dos
rascunhos que sobraram; agora ligado à tela 34 que passou a existir. A tela 10 (Vitória/Derrota) também está em curso no mesmo arquivo,
em outra seção; os dois foram avisados para editar só por substituições pequenas e nunca rodar comandos de reversão do git.

O QUE NÃO RELIGUEI: `PANEL_ON.tower` (a Torre voltou à versão antiga; religo quando o QA avisar que refez e eu olhar); `PANEL_ON.era`
(já estava desligada: o QA mudou a tela depois da minha conferência); `PANEL_ON.mounts` e `PANEL_ON.inst` (nunca foram ligadas).

O QUE NÃO LEMBRO COM CERTEZA: se havia algum ajuste pequeno meu em `js/p_forge.js` ou `js/p_cfg.js` depois da v0.12.6 (acho que não:
os dois batem com o commit); o texto exato dos blocos do relatório não foi afetado (este arquivo sobreviveu).

PASSADA DE NAVEGADOR INTERROMPIDA: abri a aba para Montarias e Troca de era e o JOGO NÃO SOBE: `js/battle.js` (do agente A) está com
erro de sintaxe na linha 180 ("Identifier 'EN_IDLE_N' has already been declared"), então `resize` não existe e nenhuma tela abre.
Fechei a aba sem conferir nada. Não é meu arquivo e não mexi.
- Passe com rolagem contínua REAPLICADO em `js/screens2.js` (subagente, só substituições pequenas). `node --check` ok; fumaça sem falha;
  teste próprio dele, 72 passos em 4 medidas. Igual ao bloco 20, mais: o botão "Missões" só tenta a tela 34 quando ela está registrada,
  não quebrada E ligada (`Panels.on('missions')`), pelo caminho do pedido Q-6 (`Panels.open('missions', {tab:'daily'})`); senão abre a
  lista interna. Continua valendo o bloqueio do `setView` do index (B-24). ATENÇÃO: o commit `25c5cb5` de outra sessão pegou o arquivo
  pela metade (botão desenhado sem o tratador do toque); a árvore de trabalho está completa: o próximo commit tem de incluir o resto.
  Cópia final guardada na pasta de rascunho do subagente (`passe/screens2.final.js`). Não visto rodando.

## Bloco 23: tela 10 VITÓRIA / DERROTA DO CHEFE refeita contra o protótipo aprovado. Escrita, NÃO vista; chave do agente A desligada

Só a seção 10 e o CSS `#res` / `q-*` de `js/screens2.js` (subagente; conferi `node --check`, que o Passe com rolagem continua no arquivo,
e a fumaça sem falha). Abre só com `SCREENS_ON.bossResult` (index.html); conferência: `?debug=1&res=1` e `dbgResult('win' | 'lose')`.
- VITÓRIA: a tela espera a morte aprovada do chefe terminar (não segura mais o corpo); depois baú no lugar do chefe, estouro, moedas
  voando ao contador, letreiro, cartões um a um (moedas com gemas, XP, item de maior raridade com a moldura única), botão "Continuar"
  (segue sozinho em 4 s; qualquer toque cancela) e "Pular".
- DERROTA: "O chefe foi mais forte", sua FC x recomendada com "Faltam X de FC", 3 caminhos lado a lado (Forja só se a tela estiver ligada
  e liberada; Invocar só no nível 3; Equipamento sempre), "Modo farm" como botão PRINCIPAL (entra sozinho em 10 s) e "Tentar de novo".
- O HUD da batalha some enquanto a tela está aberta (CSS meu `body.resui #fbhud`); sem emoji; sem AUTO/MANUAL.
- Diferenças conscientes: gemas dentro do cartão de moedas (o protótipo não tem gemas); contagem no "Continuar" (o jogo é automático);
  o golpe final em câmera lenta com "CRÍTICO!" do protótipo é cena do canvas (agente A).
- PARA O AGENTE A (pedido B-25): ligar `SCREENS_ON.bossResult`; avaliar o Kael caído na derrota (a tela põe `B.deadT = 0.8` e
  `B.deadBoss = true` ao abrir e devolve ao fechar, sem editar `battle.js`); o `holdC` do `battle.js` ficou sem uso; o aviso reserva de
  `waveClear` ainda tem emoji.
- Limites conhecidos (teste do subagente): em 360x584 a vitória com 4 cartões cobre 21 px do Kael; em 320x500 "Tentar de novo" fica com
  41 px. De 360x640 a 430x900 passa.
- A ver no navegador: baú e moedas na posição do chefe; animações; o Kael caído; o HUD sumindo e voltando.

## Bloco 24: LOTE v0.12.8 preparado sem navegador (ligar o que está escrito)

1. LISTA DE CARGA (`js/screens.js`): equipfx, panels, p_forge, p_cfg, p_vip, p_era, p_tower, p_pets, p_rank, p_inst, p_mounts, p_missions,
   p_arena, p_events, p_tourney, p_map, p_profile, p_pass, p_guide, p_guild, p_codex, p_mail, p_chat. `node --check` ok em todas;
   `conflitos.js` sem conflito nessas. NÃO carreguei `p_intro` (conflito de nomes: `esc` com artprev.js e `KAIA_ON` com intro.js).
   Chaves em `js/panels.js`: LIGADAS forge, cfg, vip, pets, rank. DESLIGADAS era, tower, inst, mounts, missions, result, eggpick (liga com
   pets), offer, auction, arena, events, tourney, map, profile, passv2, guidehud, guild, codex, mail, chat.
2. ROTAS: `Panels.open` = confere a chave e chama `Screens.open` (mesma tela). 'missions': gancho provisório no `panels.js` (a tela 34
   entra como `missions34` enquanto o `setView` do index troca 'missions' por 'pass'); só age com `PANEL_ON.missions` ligada. Pedido B-26.
3. PASSE, duas versões: comparação por leitura em curso (subagente só de leitura); resposta em seguida.
4. Título cortado do cabeçalho: anotado para o agente A (B-26).
5. Aviso de poder: com `NEXT_ON` e `fcNotice`, o selo "FC +N" do Equipamento não é desenhado. Escrito, não visto.
6. NÚMEROS: `kf` chama `Sys.stats.abbr(v, {pt})` (reserva: o corpo antigo); `PANEL_V2.ptNum` LIGADA: mil, mi, bi, tri, qua, qui.
   Outros formatadores meus: `gNum` (número inteiro com pontos até 10 milhões, depois `kf`), `n0` (inteiro com pontos, usado em gemas,
   pedras, níveis), `p1` / `f1c` (porcentagens). Nenhum deles tem sufixo próprio. As telas `p_*` usam `kf`/`gNum`/`n0`; não achei sufixo
   "K/M/B" escrito à mão nelas (busca simples).
7. Estrela de texto: tirei também de `js/p_auction.js` e `js/p_offer.js` (minhas, desligadas). Nas telas dos outros ainda há caractere
   em faixa de símbolo: `p_map.js` (um "✕" no botão fechar) e `p_profile.js` (um "★" dentro de uma expressão de troca de texto).
8. Mapa (`p_map.js`, da Arte): só carregado; fica desligado até a curva nova.
9. Teste de fumaça: consertei o leitor da lista de módulos (o index mudou o formato da lista); 133 passos, 0 falhas em 390x788 e 360x584.

ORDEM em que quero conferir no navegador (ligando cada chave se estiver boa):
 a) regressão rápida das 5 telas com `ptNum` ligada (números em português) e o Passe com rolagem;
 b) Montarias (equipar lobo e grifo) → `mounts`;
 c) Troca de era refeita → `era`; Torre refeita → `tower`;
 d) Missões (tela 34) pelo botão do Passe e pelo MENU → `missions`;
 e) Vitória/Derrota com `dbgResult` (a chave é do agente A);
 f) telas do QA e de Sistemas, uma a uma: profile, mail, codex, guild, chat, arena, events, tourney, guidehud;
 g) passv2 só para comparar com a minha (decisão do PO); mapa só abrir (fica desligado).

## Bloco 25: as duas versões do Passe com rolagem (comparação por leitura, nada apagado)

RECOMENDAÇÃO: ficar com a MINHA (dentro da tela `pass`, `js/screens2.js`) como base, e aproveitar três coisas da do QA (`js/p_pass.js`, `passv2`).
- Por que a minha: é a que segue o protótipo (cartão da temporada, legenda, nó redondo, linha de progresso, cadeado, diálogo); já é a tela
  que o MENU, a Loja e o tutorial abrem; cumpre a liberação no nível 18, o voo de moeda, a raridade única e "nada mudo ao toque"; resgata
  nível por nível.
- Por que não a do QA hoje: não resgata por nível (espera um `Sys.pass.claimTier` que não existe: o nível pronto só mostra "Pronto"); os
  cartões não respondem ao toque; não confere a liberação por nível; sem voo de moeda; sem cartão da temporada, linha e cadeado; a lista
  não abre no nível atual da 2ª abertura em diante.
- O que aproveitar dela: (1) textos lidos do `Sys.pass` (a minha tem números escritos à mão: "Épico no 30", "níveis 27 e 30", "nível 25",
  "Temporada Solar"); (2) o aviso fixo de itens guardados; (3) o teste de comportamento (`test/paineis/p_pass.smoke.js`) adaptado.
- Risco da minha que precisa dos Sistemas: o resgate de UM nível (`pClaimOne`) mexe no estado interno do `Sys.pass` para reaproveitar o
  `claimAll`; funciona pela leitura, mas há dois casos de prêmio em dobro ou perdido (erro no meio da entrega; virada de temporada durante
  o resgate). Pedido B-27: `Sys.pass.claimTier(S, host, trilha, nível)`.
- DEFEITO COMUM, importante: quando o botão "Missões" passar a abrir a tela 34, a missão diária deixa de dar XP do JOGADOR (hoje quem
  chama `Sys.level.onMission` / `onDailyBonus` é o resgate dentro do meu Passe; o `p_missions.js` não chama). Tem de entrar na tela 34
  antes de ligar `PANEL_ON.missions`. E o Voltar da tela 34 leva à batalha, não ao Passe.
- Corrigi já (pequenos, escritos e não vistos): diálogo do Premium não estoura mais em 320 px; a chave `passScroll` agora existe no
  `PANEL_V2`; o botão Missões reconhece a tela 34 também pelo nome provisório `missions34`.
- Ficam para depois da decisão do PO: tirar os números escritos à mão; apagar a lista de Missões interna, as páginas antigas, o apelido
  'missions' e o `p_pass.js`.

## Bloco 26 (lote v0.12.8): chaves LIGADAS a pedido da coordenação (conferidas pelo QA na aba dele; eu NÃO vi rodando)

`js/panels.js`, ligadas agora: `tower`, `era`, `missions`, `profile`, `codex`, `guild`, `chat`. Já estavam: `forge`, `cfg`, `vip`, `pets`, `rank`.
Continuam desligadas: `mail` (espera a chave do módulo), `inst` (espera a luta), `mounts` e `result` (minhas, não vistas), `offer`,
`auction`, `arena`, `events`, `tourney`, `map`, `passv2`, `guidehud`; `eggpick` liga sozinha com `pets`.

Conferido por leitura:
(a) MENU do agente A: cada item só aparece com `fbUnl(id)` (tabela `FB_UNLOCK`: tower 15, missions 2, codex 12, guild 32, chat 16) e com
    a tela registrada e não quebrada; o Perfil abre pelo avatar com `fbUnl('profile')` (nível 10), senão o avatar leva ao Equipamento.
(b) 'missions': o item do MENU chama `Panels.open('missions')` → `Screens.open` → tela 34 (pelo gancho provisório `missions34`, porque o
    `setView` do index ainda troca 'missions' por 'pass'). O botão "Missões" do meu Passe abre a mesma tela. NOVO: com a tela 34 ligada,
    a lista antiga de missões dentro do Passe não aparece mais em caminho nenhum: se alguém pedir a aba Missões do Passe (chamadas
    antigas, ou jogador abaixo do nível 18), o Passe redireciona para a tela 34. O Passe fica só com a trilha.
    O `p_missions.js` já chama `Sys.level.onMission` / `onDailyBonus` (o defeito do XP do jogador foi tratado pelo QA).
(c) `node --check` em screens.js, screens2.js, panels.js e em todos os `p_*.js`: ok. `conflitos.js` nas 21 telas carregadas: nenhum conflito.
    Fumaça: 133 passos, 0 falhas (390x788).
Risco que só o navegador mostra: o redirecionamento do Passe para a tela 34 e o gancho `missions34` nunca rodaram numa tela de verdade.

## Bloco 27 (lote 2, sem navegador): o que mudou

- VOLTAR DAS MISSÕES: quando a tela 34 é aberta pelo botão "Missões" do Passe, o Voltar agora devolve ao Passe. Mecanismo geral no
  `js/panels.js`: quem abre com `Panels.open(nome, {from:'<tela>'})` volta para essa tela ao fechar; aberta pelo MENU (sem `from`), volta
  para a batalha como antes. Escrito, não visto.
- `p_intro` (telas iniciais do Servidor, arquivo gerado): na lista de carga do `js/screens.js`; chave `PANEL_ON.intro` DESLIGADA. O teste
  de conflito agora passa nesse arquivo (o conflito de `esc` / `KAIA_ON` que eu tinha visto sumiu). Entra por último na lista: se o
  fluxo de entrada precisar carregar antes das outras telas, o Servidor me diz.
- Arena, Eventos e Torneio: carregadas, sem conflito de nomes, chaves `arena`, `events`, `tourney` desligadas, prontas para virar.
- Chat (`window.P_CHAT`) e Códex (`window.P_CODEX`): nada do meu lado.
- Vitória/Derrota: `resHeroDown` agora chama o `heroDown(on)` do agente A (pedido A-20); o corpo antigo ficou só de reserva.
- "FC +N": já estava preparado (some quando `NEXT_ON` e `fcNotice` existem). Passe com rolagem e Montarias: sem mudança, esperando o navegador.
- `node --check` nos três arquivos; conflitos ok; fumaça 133 passos, 0 falhas.

## Bloco 28 (sem navegador): resgate do Passe pelo `claimTier`, Correio ligado

- PASSE, resgate de UM nível: `pClaimOne` (`js/screens2.js`) agora chama `Sys.pass.claimTier(S, Sys.host, trilha, nível)`. Com `ok:true`
  segue o caminho de sempre (voo de moeda/gema, `statsChanged()`, aviso do item, redesenho guardando a rolagem). Com `ok:false` mostra o
  motivo em texto curto (bloqueado, exige Premium, já resgatada, sem prêmio, erro; com `partial` avisa "Item guardado: sai quando o nível
  liberar") e redesenha. O caminho antigo (que mexia no estado interno em volta do `claimAll`) ficou como `pClaimOneOld`, usado só se a
  função não existir. "Resgatar tudo" continua no `claimAll`.
  Conferido: `node --check`; fumaça 133 / 0 falhas; chamei o `claimTier` direto no módulo (1º resgate ok com +100 de ouro; repetir →
  `resgatado`; nível 9 sem XP → `bloqueado`; premium sem Premium → `premium`). O teste antigo do subagente do Passe está desatualizado
  (não carrega mais os módulos: o index mudou o formato da lista) e não serviu. Não visto no navegador.
- `arena`, `events`, `tourney`: encontrei as três LIGADAS (mudança da coordenação, commit b430dfe); mantive.
- CORREIO: `PANEL_ON.mail = true`. Por leitura: o item Correio do MENU é `soon:mail`, aparece com `fbUnl('mail')` (nível 7 na tabela
  `FB_UNLOCK`) e com a tela registrada e não quebrada. ATENÇÃO para o engenheiro: `js/sys/mail.js` não está na lista de módulos do index
  (busca por 'mail' na lista: nada); sem o módulo a tela abre no estado vazio dela. A carta de boas-vindas depende disso.

## Bloco 29 (sem navegador): Oferta e Leilão carregados; listas de conferência para o QA

- `p_offer` e `p_auction` na lista de carga do `js/screens.js`; chaves `offer` e `auction` DESLIGADAS. `conflitos.js js/p_*.js`: nenhum
  conflito. `node test/e2e/run.js`: "TUDO OK (136 verificações)". Encontrei `mounts` e `intro` ligadas (mudança da coordenação): mantive.

### O que falta para a OFERTA de primeira compra ligar
1. Pagamento de verdade: o botão Comprar chama o `Sys.buy`; sem servidor/cobrança ele só abre "Pagamento em breve" (decisão anterior da
   coordenação: não ligar tela cujo botão principal não entrega).
2. O módulo `Sys.offer` carregado e com a chave dele ligada: hoje o index só carrega `offer` atrás de `NEXT_ON`; sem ele a tela mostra
   "Oferta: em breve".
3. Entrada: o ícone "Oferta 24h" do HUD da batalha (pedido B-28 ao engenheiro) e, se o PO quiser, a abertura sozinha no 1º acesso.
4. Arte: a vitrine usa um marcador para a montaria; agora existem folhas do Kael montado no lobo (`assets/anim/mounts`): trocar o
   marcador por ela (pequeno, faço quando for ligar).
5. Uma passada de navegador minha ou do QA: a tela nunca foi vista rodando.

### Para o QA conferir: VITÓRIA / DERROTA DO CHEFE (chave `SCREENS_ON.bossResult` do engenheiro; em debug `?debug=1&res=1`, `dbgResult('win')` e `dbgResult('lose')`)
1. Vitória numa luta de verdade: a morte aprovada do chefe toca INTEIRA antes de qualquer coisa cobrir; depois baú no lugar do chefe,
   estouro, moedas voando ao contador, letreiro, cartões um a um; nada por cima do Kael em 360x640 e 390x844.
2. Cartões: moedas (com as gemas dentro), XP com nível e barra, item de maior raridade com a moldura e o nome na cor; os valores batem com
   o que entrou no topo (o saque já foi creditado no abate: a tela só mostra).
3. "Pular" e toque fora mostram tudo na hora; "Continuar" segue sozinho em 4 s e qualquer toque cancela a contagem; depois de fechar a
   batalha segue (onda nova, HUD de volta, sem pausa presa).
4. Derrota: Kael caído atrás da tela (`heroDown`), "O chefe foi mais forte", FC sua x recomendada com "Faltam X de FC"; os 3 caminhos:
   Forja só no nível 12, Invocar só no nível 3, Equipamento sempre; cada um abre a tela certa e a derrota fecha.
5. Derrota: "Modo farm" é o botão principal e entra sozinho em 10 s (voltando às ondas 1-4); "Tentar de novo" desafia o chefe de novo;
   sem emoji, sem texto cortado; com era nova liberada quem abre é a Troca de era, não esta tela.

### Para o QA conferir: PASSE COM ROLAGEM (nível 18 ou save antigo; `PANEL_V2.passScroll`)
1. Abre já rolado no nível atual do passe (centralizado sob a legenda); a trilha rola do nível 1 ao último, com a legenda presa no topo e
   "Resgatar tudo" / "Ativar Premium" fixos embaixo; sem páginas e sem aba Missões.
2. Resgatar UM nível (trilha grátis): voo de moeda/gema até o cabeçalho, valor entra no topo, o cartão vira "Resgatado" e a lista NÃO pula;
   tocar de novo → "Recompensa já resgatada"; nível futuro → "Libera no nível N do passe"; cartão premium sem Premium → diálogo
   "Pagamento em breve" (nada cobrado; cabe em 360 de largura).
3. "Resgatar tudo" com vários níveis prontos: tudo entra uma vez só (conferir ouro e gemas antes e depois); com a mochila cheia ou item
   acima do nível, o aviso de "item guardado".
4. Botão "Missões": abre a tela 34; o Voltar dela devolve ao Passe (aberta pelo MENU, devolve à batalha). Abaixo do nível 18 (save novo)
   qualquer caminho para o Passe/Missões cai na tela 34, nunca na lista antiga.
5. Com a batalha rodando atrás: a tela não reinicia animações a cada onda, o relógio da temporada anda, e resgatar missão diária na tela
   34 sobe o XP do JOGADOR (anel do avatar) além do XP do passe.

## Bloco 30 (sem navegador): aba APARÊNCIA do Equipamento (tela do QA, `js/p_look.js`)

- `p_look` na lista de carga do `js/screens.js`; `PANEL_ON.look` DESLIGADA. Encontrei `auction = true` (mudança da coordenação): mantive.
- Entrada no Equipamento, onde o protótipo a desenha: o cartão da skin ao lado da caixa da FC vira o botão "Aparência" (ícone de olho,
  "Skin <raridade> +X% ATK/HP", "Coleção de skins +Y%", seta). Abre `Panels.open('look', {from:'gear'})`: ao fechar, volta ao Equipamento.
  Só aparece assim com a tela `look` ligada e não quebrada; desligada, o cartão continua como antes (leva à Loja de skins no nível 10).
  Com a Aparência ligada, o atalho do cartão para a Loja deixa de existir (o protótipo põe a coleção de skins dentro do painel).
- Não fiz o desenho do herói em camadas (é do engenheiro).
- `node --check`; conflitos ok; `node test/e2e/run.js` "TUDO OK"; fumaça sem falha. Não visto no navegador.

## Bloco 31 (sem navegador): Loja em 288 px, cartão OFERTA/DESTAQUE cortado (achado do QA)

Só `js/screens.js` (`scrShop`). Com menos de 340 px de largura de conteúdo: a coluna da arte passa de 168 para 104 px (corta as laterais
vazias; o herói fica no centro), a linha "OFERTA · Skin de herói" e a do relógio quebram linha em vez de cortar, o nome cai para 19 px e
pode quebrar, a etiqueta de raridade/era quebra, o relógio fica com 16 px, e o cartão cresce em altura (mínimo 196) em vez de cortar.
De 340 px para cima o HTML dos textos é o mesmo de antes (as mudanças são todas condicionadas à tela estreita; a única diferença é uma
caixa interna de 168 px em volta da arte, na mesma posição).
`node --check`, conflitos e `node test/e2e/run.js` ("TUDO OK", 140) passam; fumaça sem falha em 288x500 e 390x788. Não visto no navegador:
a conta dá ~146 px para os textos em 288; o QA precisa confirmar que nada corta.

## Bloco 32 (sem navegador): pedidos A-22 do engenheiro

1. `js/panels.js`: apagado o gancho `hookMissions` e o apelido `missions34` (registro, `FULL_VIEWS`, `PANEL_ON`). `setView('missions')` abre a
   tela 34 pelo `setView` do index (pedido B-26 atendido). Em `js/screens2.js` sobrou só a comparação inofensiva com 'missions34' no `pMisOpen`.
2. `js/p_mounts.js` (meu): `MT_ART` ganhou `wyvern:1` e `MT_OFF` ficou vazio; a tela segue o `mountIds()` do engenheiro (6 montarias).
   ATENÇÃO: a coordenação tinha dito que a serpe foi REPROVADA pelo dono. Segui o pedido A-22; se a reprovação ainda vale, é voltar
   `MT_OFF=['wyvern']` (uma linha). O enquadramento da folha da serpe na caixa NÃO foi medido nem visto.
3. `js/screens2.js` (tela 10): o nome do chefe vem de `assets/enemies/meta.json` pela chave do inimigo (`resBossName`), a mesma fonte da
   batalha ("Rex Furioso"); sem nome próprio, vale o `kindName`. A ração do saque (`loot.food`) entra nos extras com ícone desenhado (tigela).
4. `PANEL_ON.inst=true`; `test/e2e/flows.js`: `HARD.inst=true` (instância 26/26).

Testes: `node --check` nos 4 arquivos; conflitos: nenhum; `node test/e2e/run.js` "TUDO OK" (141); fumaça sem falha nova.
`node test/e2e/flows.js`: instância 26/26, vitória/derrota 25/25, TROCA DE ERA 9/13 (FALHA). A falha não vem destes arquivos: o
`js/battle.js` (mudança do engenheiro ainda não commitada) agora guarda a Troca de era em `B.eraPend` e só abre depois de fechar a
Vitória; o teste ainda espera `Panels.open('era')` direto e encontra `B.res.mode="win"`. É o teste (ou a ordem) que o engenheiro precisa acertar.
Nada disto foi visto no navegador.

## Bloco 33 (sem navegador): Loja filtra as skins por Sys.appearance.canSell

Só `js/screens.js`. `xCanSell(id)` chama `Sys.appearance.canSell(id, existe)`; `existe` consulta a lista de arquivos do `assets/manifest.json`
(lida uma vez, na carga). Enquanto a lista não chega, ou se falhar: arte de arma existe, o resto não. Sem o módulo: tudo como antes.
- Lista das abas "Skins herói"/"Skins arma": só aparece a skin vendável, a que o jogador já tem e a que está em uso.
- Compra: `hStatus.buy`, o botão de comprar e a confirmação recusam a skin que `canSell` recusa.
- Cartão OFERTA/DESTAQUE: skin do dia e melhor à venda passam pelo filtro; na aba do herói sem nada à venda entra a skin de arma; sem
  nada, a skin em uso ("Na coleção"); sem nem isso, o cartão some.
- Aba sem nenhuma skin: "Novas skins em breve".
ACHADO: o `js/sys/appearance.js` do disco já mudou (roupa-skin = combinação de camadas). Com o manifest de hoje `canSell` ACEITA as 40
roupas (a00..a74) e p10/p20/p30; logo, hoje o filtro não esconde nada depois que a lista carrega. Só esconde se faltar arquivo.
Não mexi: Passe (dá a p10 no nível 25), Oferta (desligada), saque/invocação (Sistemas).
`node --check`, conflitos, `run.js` "TUDO OK" (141), `flows.js` "fluxos duros OK", fumaça sem falha. Não visto no navegador.

## Bloco 34 (sem navegador): retrato do herói pela fase (js/avatar.js)

Arquivo novo `js/avatar.js` (carregado pela lista do fim de `js/screens.js`, antes de `equipfx`). API global:
`avatarFor(S,size)` (canvas pintado, que se repinta sozinho), `avatarTag(size,css,alt)` (HTML `<canvas data-av>` para telas de texto; o arquivo
pinta todo `canvas[data-av]` que entra na página), `avatarUrl(S,size)`, `avatarRefresh()`, evento `avatarready` / `avatarOnReady(fn)`,
`avatarInfo()` (para conferência).
- Folha: `Sys.appearance.sheetFor(S,Sys.host,'idle')`, quadro 0; cabeça pela âncora `head[0]` do `<masks>_head.json`, conferida nos pixels.
- Recorte: quadrado de 2,8 × (âncora.y − topo da figura), cache por herói, fase, camadas e tamanho.
- Reserva: Kael parado da pasta R (o retrato de antes); antes dela, um busto desenhado. Repinta quando as imagens chegam e a cada 1 s se algo mudou.
- Camadas: usa `window.drawHeroFull` (já existe em `js/battle.js`) e só aceita o resultado se cobrir ≥ 85% da silhueta da folha; senão fica a folha.
  Hoje o desenho do engenheiro NÃO desenha chapéu, óculos nem máscara (não há uso de hats/cos em battle.js/stage.js): o retrato sai sem eles.
- Trocados (meus): `js/p_cfg.js` (conta, 42 px) e `js/screens.js` (cartão Aparência/Skin do Equipamento, 34 px); sem o avatar.js vale o de antes.
- Teste: `node test/paineis/avatar.crop.js . [saida.png]` roda a função de localização nas 8 folhas reais. Resultado em
  `reports/prints/avatar_recortes_8.png` (visto por mim: rosto certo nas 4 fases de Kael e Kaia).
ACHADO (Arte): `assets/anim/hyb/kaia/masks/kaia_idle_head.json` dá x=245 numa célula de 256 (fora da figura; está 96 px à direita). O avatar corrige sozinho.
NÃO visto no navegador: o caminho pelo drawHeroFull, a repintura e o tamanho dentro das molduras.

## Bloco 35 (sem navegador): avatar pelos retratos da Arte + tela de Fusão carregada

AVATAR (substitui o desenho do bloco 34): `js/avatar.js` agora usa os 8 retratos de `assets/hero/avatar/` (`avatars.json`), fase por
`Sys.phaseUp.current(S)` (sem ele, a do `sheetFor`), herói por `S.hero`, e desenha por cima as peças de cabeça que
`Sys.appearance.layers(S,Sys.host)` devolve: chapéu (`hat` ou `era` → `hats.json`), óculos e máscara (`cos` ou `id` → `cos.json`), com
translate · rotate · scale(s/res) · drawImage(-pivot). O "ocultar" vem do próprio `layers`. Saiu a dependência do `drawHeroFull`.
Reserva: carregando = retrato de antes (Kael da pasta R) ou busto desenhado; retrato faltando = recorte da folha parada (sem peças).
`node test/paineis/avatar.crop.js . reports/prints/avatar_recortes_8.png`: 8 retratos, âncoras e 16 peças caem em cima da cabeça; folha de
conferência vista por mim (chapéus e óculos no lugar nas 4 fases dos dois heróis).
Limites: `hideHair` do hats.json não é aplicado (o cabelo aparece por baixo do elmo); nada visto no navegador (repintura, tamanho nas molduras).

FUSÃO: `p_fuse` na lista de carga (`js/screens.js`), `PANEL_ON.fuse=false` (`js/panels.js`), e na Forja (`js/p_forge.js`) uma terceira opção
"Fusão" na fileira de modos, que só aparece com a chave ligada e abre `Panels.open('fuse',{from:'forge'})`. Conflitos de nomes do p_fuse: nenhum.

## Bloco 36 (sem navegador): avatar só com o rosto da fase (decisão final do dono)

`js/avatar.js`: chave `AVATAR_PIECES=false`. Desligada: não lê `hats.json` nem `cos.json`, não carrega imagem de peça e não consulta
`Sys.appearance.layers`; o retrato é só o da Arte para a fase e o herói. O código das peças ficou (true religa).
`test/paineis/avatar.crop.js` lê a chave: desligada, confere os 8 retratos, a reserva e que as leituras das peças estão atrás da chave.
`reports/prints/avatar_recortes_8.png` refeito sem peças. `node --check`, `run.js` "TUDO OK" (145), fumaça sem falha nova.

## Bloco 37 (sem navegador): roupas-skin fora de venda e inativas na coleção

Conferido com o `js/sys/appearance.js` REAL do disco: `canSell` recusa as 40 roupas `a..` e p10/p20/p30; aceita as 40 armas e p5/p15/p25.
`js/screens.js`: `xOutfitNote(id)` lê `Sys.appearance.outfitStatus(id)`. Roupa-skin que o jogador tem (ou está usando) continua na aba
"Skins herói" com a etiqueta "Nova skin em breve" no lugar de "Equipada"/"Na coleção"; a prévia mostra "Na coleção · Nova skin em breve" e
não tem botão Equipar; o clique de equipar também recusa. Nada sai de `S.skins` nem de `S.skinEq`. Arma: igual a antes. Sem `outfitStatus`: igual a antes.
`test/paineis/smoke.js`: bloco novo "loja+appearance" carrega o módulo real e a lista do `assets/manifest.json` e FALHA se: houver roupa à
venda, arma fora de venda, roupa não possuída na aba, cartão OFERTA/DESTAQUE vendendo roupa, botão Equipar em roupa, arma sem Equipar, ou a
aba vazia sem "Novas skins em breve". Os 6 passam. (Achado: a fumaça antiga nunca desenhava as abas de skin, o portão de nível mandava
tudo para "Itens"; o bloco novo abre com `PANEL_V2.gate=false`.)
Com o save inicial a aba "Skins herói" NÃO fica vazia: mostra a roupa inicial do jogador (a00) com a nota; o texto só aparece para quem não tem nenhuma.
PASSE × p10 (não mexi; decisão do PO): `index.html:410` (`SEASON_SKIN='p10'`, `PASS_SKIN_AT={25:...}`), `js/farm.js:63` (`addSkin('season')` grava a p10),
`js/screens2.js:234` (cartão do prêmio), `:246` e `:256` (resgate e aviso), `:273` e `:366` (vitrine "Skin da temporada"), `:384` (texto do Premium),
`js/screens.js:786` e `:806` (prévia da Loja "Ganhe no Passe · Nv. 25", hoje inalcançável porque a p10 não aparece na aba), `js/p_pass.js:45` (QA).

Acréscimo ao bloco 37 (achado do QA): o cartão OFERTA/DESTAQUE só mostra skin do espaço da aba. Na aba "Skins herói" sem roupa à venda o
cartão some e entra "Novas skins em breve" no lugar; a skin em uso continua na lista com a nota. Skin de arma só no cartão da aba "Skins arma".
A fumaça falha se a aba do herói mostrar cartão de arma. `PANEL_ON.look` (ligada pela coordenação) não foi tocada.

## Bloco 38 (sem navegador): FC mostrada na escala do Sys.fc (view × 31)

`js/screens.js`: função única `fcTxt(fc)` = `Sys.fc.viewText(fc)` (sem o módulo: formatação de antes). Passam por ela, só na EXIBIÇÃO:
Equipamento (FC do painel de atributos e a contagem animada, linhas "antes → depois" e a diferença da comparação, "FC agora" e "FC no seu
nível" do item, selo "FC +N" do Equipar melhor), aviso "Equipada: … · FC" da Loja; `js/screens2.js` (Derrota: "SUA FC" contando,
"RECOMENDADA", "Faltam N de FC"); `js/p_pets.js` ("Soma à FC"). Nenhuma conta mudou (gBest, "melhor que o seu", % da barra, brilho).
A fumaça confere que o Equipamento mostra exatamente `Sys.fc.viewText(heroFC())`. A tabela da varredura foi entregue à coordenação.

## Bloco 39 (sem navegador): Passe nível 25 (pacote novo) e avatar pela skin equipada

PASSE. Nada fixo na tela: `pBig()` acha no `Sys.pass.DATA.premium` o nível que traz `mat`/`mountFrags` (hoje o 25) e `pExtras(rw)` lê as quantidades.
- `js/screens2.js`: cartão da trilha mostra a arma (ícone do espaço na moldura da raridade) + pedra de forja, essência e fragmento com a quantidade
  (com pacote, a etiqueta "Épico · Arma" sai para caber em 70 px; o nome fica em uma linha); `aria-label` com o pacote por extenso; resgate passa
  `mat`/`mountFrags` e o aviso diz o que entrou; a vitrine do cabeçalho virou "Prêmio Nv. 25" (arma + 3 ícones com quantidade); o texto do Premium
  mostra "No nível 25 do passe:" com os mesmos ícones. Módulo antigo (sem pacote): vitrine de antes.
- Ícones: pedra de forja = `Y_STONE` (missões/Vitória), essência = `Q_ESS` (Vitória), fragmento = a forma da tela de Montarias, arma = `slotIcon`.
- `js/screens.js`: a skin do passe só entra na aba da Loja se o `Sys.pass` ainda entregar skin (`xPassSkin()`, hoje falso): a prévia "Ganhe no Passe"
  sumiu. Quem já tem a p10 continua vendo na coleção (com a nota de roupa inativa).
- Fumaça: 4 testes novos (pacote = dados do módulo, vitrine, texto do Premium, resgate + aviso, Loja sem a skin do passe). Achado: a fumaça antiga
  desenhava o Passe com 0 caracteres (portão de nível); os testes novos abrem com `PANEL_V2.gate=false`.
- PARA O QA (`js/p_pass.js:45`, `pwBody`): o ramo `rw.skin` não acontece mais; falta desenhar `rw.mat` (`forge`, `essence`) e `rw.mountFrags` do nível 25
  (hoje a célula mostra só "Arma Épico").

AVATAR. `js/avatar.js` não lê mais `Sys.phaseUp`: o retrato é `Sys.appearance.avatarKey(S, host)` quando a função existir e a chave estiver no
`avatars.json`; senão `kael_phase0` / `kaia_phase0` por `S.hero`. O módulo do disco já tem `avatarKey` (conferido: as chaves que ele devolve existem no avatars.json).
`test/paineis/avatar.crop.js` ganhou o bloco 0 (8 casos de escolha do retrato).

`node test/e2e/flows.js`: fluxo 4 "FASES DO HERÓI" FALHA (16/33): o `js/sys/phaseup.js` do disco está desligado ("reason: off"); é o teste das fases
contra a decisão de não ter fases, não vem destes arquivos.

## Bloco 40 (sem navegador): Pets sem a célula "Bônus na FC +N%"

`js/p_pets.js`: saiu a célula da porcentagem (decisão do PO); ficam "Soma à FC" (por `fcTxt`) e a do tipo do pet, que dividem a fileira
(as células são `flex:1`, não sobra buraco). Nenhuma conta mudou. `node --check`, `run.js` "TUDO OK", fumaça em 390 e 288 sem falha.

## Bloco 41 (sem navegador): tela Coleção carregada, chave desligada

`'p_colecao'` no fim da lista de carga do `js/screens.js`; `PANEL_ON.colecao=false` em `js/panels.js`. Sem item no MENU nem entrada em outra tela.
Conflitos de nomes: nenhum; `run.js` "TUDO OK" (148); `flows.js` "fluxos duros OK"; a fumaça registra e desenha a tela (só no teste, com a chave ligada lá).

## Bloco 42 (sem navegador): espera de imagens, cartão do Mecha, VIP → Loja → VIP

- CARGA: `'p_wait'` logo depois de `'panels'` (antes das telas) e `'p_shopmecha'` no fim da lista do `js/screens.js`; `PANEL_ON.shopmecha=false`.
- ESPERA (`xGate(urls)` no `js/screens.js`): chama o `pGate` do QA só com as imagens que existem no `assets/manifest.json` (arquivo que falta não trava
  a tela); sem o p_wait ou sem a lista ainda, segue como antes. Aplicado em: Loja (abas de skin: cartões da página, prévia e cartão do topo; aba de gemas:
  arte do Mecha quando o cartão existe), Montarias (`mtUrls`: folha parada de cada montaria da lista), Pets (`ptUrls`: ovo, 1º estágio da lista e o pet
  escolhido no estágio da vitrine). Forja e Equipamento ficaram sem espera: a Forja usa a folha do Kael que o cabeçalho já carregou e o Equipamento
  desenha o herói no canvas do engenheiro.
- MECHA: `shMechaCard()` no topo da aba de gemas; o clique vai para o `click` do cartão. Chave desligada = `null` = Loja idêntica (coberto na fumaça).
- VIP → LOJA → VIP: o `Screens.close` envolvido no `js/panels.js` lê `window.SHOP_RETURN` ao fechar a Loja, reabre o painel marcado e limpa a marca;
  o `scrTick` limpa a marca se o jogador saiu da Loja por outro caminho.
- `js/screens2.js`: o resgate do Passe agora recebe `mountFrags` como objeto (`{n, stored}` / `{n, id, up}`), o módulo mudou; `pExtras` lê os dois formatos.
- CORREÇÃO PEQUENA em arquivo do QA (`js/p_wait.js`, aviso B-29): o esqueleto ia para `window.V`, que não existe no jogo.
- Fumaça: 5 testes novos (esqueleto com imagem carregando e tela depois; só arquivos existentes; Mecha desligado idêntico; Mecha ligado; volta ao VIP).

## Bloco 43 (sem navegador): reserva do avatar sem pedir .json que não existe

`js/avatar.js`: a reserva pedia `assets/anim/hyb/R/kael_idle_era2_t0.json` (não existe: 404). Agora `AV.RES` declara, por herói, a imagem, o .json
que existe e a âncora: Kael = `R/kael_idle_era2_t0.png` + `R/kael_idle_body.json`; Kaia = `kaia/kaia_idle_body.png` + `kaia/kaia_idle_body.json`
(a reserva passou a ser do herói do save, não mais sempre o Kael). `need()` aceita os caminhos declarados em vez de deduzir `<base>.json`.
`test/paineis/avatar.crop.js`: confere que todo caminho escrito no avatar.js existe em disco e que a folha da reserva bate com a grade do .json.

## Bloco 44 (Painéis 2, sem navegador): telas das conveniências do VIP

Regra seguida: nenhum nível de VIP nem valor escrito à mão; tudo vem de `Sys.vip.conv(S,id)` / `convTable()` / `VipAuto.state(S)`. Com `Sys.vip.DATA.convOn`
desligada nada disto aparece. Sem preço e sem "comprar VIP": o texto é "O VIP sobe com o total gasto na Loja." e o caminho é "Ir à Loja".
`autoEquip` NÃO tem interruptor nem cadeado (decisão do dono: equipar o melhor sozinho é de todos); o id é ignorado.

- MOCHILA (`js/screens.js`): `xBagMax()` = `bagMax()` com reserva em `BAG_MAX`; usado no contador do Equipamento e na recusa de compra da Loja
  (os dois únicos usos). Ao lado do contador, chip trancado com o próximo degrau (`xBagNext()`: "VIP 1: +20", depois "VIP 6: +40", some no maior);
  o toque explica pelo aviso do Equipamento.
- AUTOMÁTICO (`js/screens.js`, lugar único: Equipamento, linha "Automático" abaixo do paginador da mochila): mostra "N ligados" / "desligado" ou o
  cadeado com o menor "VIP n" quando tudo está trancado. Abre um quadro (`gAuto`) com "Desmanchar ao pegar: Básico" e "Raro" (autoSell0/autoSell1) e
  "Fundir 3 iguais sozinho" (só com `VipAuto.state(S).autoFuse.available`). Cada toque chama `VipAuto.setPref`; recusa por nível mostra o `lockText`
  e a explicação dentro do quadro; `reason:'off'` e outros motivos têm aviso curto. Linha de ajuda: "O desmanche vale só para itens novos e nunca
  toca no equipado." Com algo trancado: "Ir à Loja" (aba de gemas quando liberada). O quadro fecha ao sair do Equipamento (`scrTick`).
- FORJA AUTOMÁTICA (`js/p_forge.js`, cartão "Fortalecer +N"): seletor de alvo (− / +N / +, de n+1 até o teto da era) e "Forjar até +N". Repete o
  MESMO `fForge` do botão comum (mesmo `Sys.forge.attempt`, custos, sons, avisos, gravação), um passo por vez (martelo 0,45 s + 0,55 s de resultado),
  mostra "Forjando até +N · agora +n · tentativas, acertos" com "Parar"; no fim um resumo (motivo, +de → +até, tentativas, acertos, pedras e ouro).
  Para ao chegar no alvo (nunca passa), sem pedra, sem ouro, no teto, ou no "Parar"; os outros toques não valem enquanto roda. Sem o nível: linha
  trancada "Forjar até o nível escolhido" + cadeado com o `lockText`; o toque só explica.
- TETO DO OFFLINE: nenhum arquivo meu mostra "8 h" nem o teto (varredura feita); nada a trocar.
- Testes novos: `test/paineis/vipconv.tests.js` (9 testes, carregado pelo `smoke.js`): contador e chip por nível, Loja recusa pelo `bagMax`,
  trancado não liga, liga/desliga pelo `setPref`, sem `autoEquip`, "Ir à Loja", forja trancada não forja, alvo entre mínimo e teto, laço até o alvo
  com o resumo batendo com o `Sys.forge` (tentativas, pedras, ouro), Parar, falta de pedra.
- ACHADO que não é meu: `smoke_all.js` sai com código 1 por "ERRO em timer: this.root.style.setProperty is not a function" (`js/p_intro.js:142`,
  `boot` → `open` → `fit` no DOM falso do teste); acontece igual sem os meus testes (conferido com uma cópia sem a linha nova).
- Resultados: `node --check` nos arquivos editados OK; `conflitos.js js/p_*.js` sem conflito; `run.js` "TUDO OK (154 verificações)"; `smoke.js` 390: 162 OK,
  0 falha; `smoke_all.js` 390 e 288: 169 OK, 0 FALHA, mais o erro de timer do p_intro acima; `flows.js`: fluxos 1, 2, 3 e 5 OK, fluxo 4 FALHA (35/36,
  "vitrine: as 10 skins aprovadas em breve (sem arte)"): vem da skin Kaia Arlequina com arte (commit 6e7a137, `Sys.appearance`), não destes arquivos.
- CORREÇÕES E1-E3 do QA (docs/POLIMENTO.md, prints pol_39 a pol_41), sem navegador:
  E2: abaixo de 360 px (`fcSlim`) o botão Aparência vira só o retrato (46 px, olho no canto, texto completo no aria-label) e a caixa da FC fica com
  194 px em 288 (antes 72); de 360 px para cima nada muda. E1: a linha do contador quebra (`flex-wrap`) e a dica "arraste o item até o espaço" sai
  quando há chip ou a tela é estreita (era ela que cortava). E3: a forja trancada não usa mais o aviso flutuante; o toque abre a explicação dentro
  da própria linha (`XF.lockTip`, segundo toque recolhe). Teste novo "estreito: FC inteira e linha da mochila sem corte" e o da forja trancada
  refeito. `run.js` TUDO OK (154); `flows.js` "fluxos duros OK" (o fluxo 4 voltou a passar, 36/36); fumaça 390 e 288: 170 OK, 0 FALHA (segue o erro
  de timer do p_intro). Para o QA: em 360 a 390 px a caixa da FC tem ~88 px úteis; um valor longo ("999,9 mil") pode não caber (já era assim).
- FC INTEIRA em 288 a 430 px (ordem da coordenação; celular do dono em ~384 a 412 px), sem navegador. `js/screens.js`: `xTxtEm`/`xFitPx` (largura
  estimada do texto e a maior fonte que cabe; nunca reticências no número). Caixa da FC do Equipamento: o raio sai quando o rótulo não caberia ao
  lado dele (360 a ~400 px), o rótulo perde o espaçamento se precisar e o número só desce de 25 px quando não cabe (pior caso 23,6 px em 412 com
  "1000 qui"); a contagem animada reajusta a fonte a cada quadro. Comparação do item: linhas "antes → depois" com rótulo justo em tela estreita e
  fonte que desce junta se faltar espaço; "FC agora"/"FC no seu nível" viram rótulo em cima + valor embaixo quando não cabem lado a lado.
  `js/screens2.js` (Derrota): "SUA FC"/"RECOMENDADA" com a fonte ajustada à metade do cartão (base 390; fica em 26 px para todos os sufixos).
  Conferidos e sem mudança: selo "FC +N" (centrado, linha inteira), "Faltam N de FC" (quebra em linhas), aviso "Equipada: … · FC" (quebra), Pets
  "Soma à FC" (cabe com folga; segue com reticências só como reserva). 3 testes novos ("FC inteira: …") percorrem 288, 320, 360, 384, 390, 412 e
  430 px com "195 mil", "999,9 mil/mi/bi/tri/qua/qui" e "1000 tri/qui". LIMITE: a conta é estimativa (sem medir no DOM); o QA confere no aparelho.
  Fumaça 288, 360, 390 e 412: 173 OK, 0 FALHA (segue o timer do p_intro); `run.js` TUDO OK (154); `flows.js` "fluxos duros OK".
- CARGA: `'p_bag'` e `'p_realm'` na lista do `js/screens.js` (depois de `'p_fuse'`); `PANEL_ON.bag=false` e `PANEL_ON.realm=false` em `js/panels.js`;
  sem item no MENU nem entrada em outra tela. O `conflitos.js` acusa XR/rClick no p_realm, mas é falso alarme: o arquivo inteiro roda em escopo próprio.
- COMPRAS PELO Sys.buy (`js/screens.js`: `xBuyReady/xBuyProds/xBuyPrice/xBuy/xBuyMsg`): com `Sys.buy.ready()` falso a Loja e o Passe ficam idênticos
  (teste compara o HTML). Com verdadeiro: aba de gemas com os pacotes `kind:'gems'` e o Cartão Mensal do catálogo (nome e preço do módulo; no Modo
  dono "compra simulada"; resgate diário pelo `Sys.buy.cardClaim` só na simulação), e "Ativar Premium" (`js/screens2.js`) com o preço e o botão
  "Ativar · R$" no popup (`kind:'pass_premium'`). Retorno: ok / cancelada / já tem / pendente / sem conexão / não concluída; uma compra por vez.
  PENDENTE para o Servidor: na compra REAL o resgate diário do Cartão Mensal é do servidor e a tela ainda não tem esse botão.
- CONFIGURAÇÕES (`js/p_cfg.js`, achado A2 do QA): código de progresso de outro servidor é recusado no "Conferir" e de novo antes de gravar
  ("Este código é do servidor S1. Troque para o S1 para importar."); sem o campo realm vale como S1; o exportado leva o `S.realm`.
- Testes novos (5): carga, compras ×3, cópia de segurança × servidor. Fumaça 390 e 288: 186 OK, 0 FALHA (segue o timer do p_intro); `smoke.js` sem
  falha; `run.js` TUDO OK (160); `flows.js` "fluxos duros OK" (rodado antes da mudança do p_cfg, que ele não toca).
- CARTÃO MENSAL pelo `Sys.buy.cardStatusLive` / `cardClaim` (mesmas chamadas no Modo dono e no real, tratadas como assíncronas): estado em `XCARD`
  (consulta vale 30 s; compra e resgate pedem de novo). Em espera: "Conferindo..." / "Resgatando..." (sem toque duplo); falha na consulta: "Tentar de
  novo" (não oferece comprar sem saber o estado); "Resgatado hoje" e dias restantes do módulo; recusas claimed / no_card / soon / sem conexão com
  aviso curto; sem `cardStatusLive` usa `cardStatus`. Com `ready()` falso a Loja segue idêntica. Teste novo "compras: Cartão Mensal…".
- Largura 288 (nota antiga, resolvida pelo QA: 5 por linha, 1 px de folga): a grade da mochila do Equipamento (5 colunas de 58 px + 24 de margem = 314 px) já não cabia antes desta peça; o QA precisa olhar.

## Bloco 45 (Painéis 3, sem navegador): ícone de peça por raridade, "opção C"

CHAVE: `PANEL_V2.rarIcons` (js/screens.js). Nasce `false`. Ligar: `PANEL_V2.rarIcons=true` e redesenhar (`render()`); vale na hora, sem recarregar.
Para conferir: `?debug=1&rarico=1`. Desligada, o HTML das telas é o de antes (teste compara).

- FUNÇÃO ÚNICA (`js/screens.js`, bloco `XRI`): `xRarIco(endereço, raridade, lado em px)` devolve o texto para dentro de `src="..."`; `xRarIcoUrl(...)`
  devolve só o endereço (para `img.src` direto). A pintura (`xriPaint`) é a `rarIconCanvas` da prévia `test/icons/rarity.html`: tinta 0/10/14/18/22%,
  contorno com shadowBlur 0/5/7/9/12 (× 1,4, proporcional ao tamanho; a prévia foi afinada em 176 px), gema `assets/icons/rarity/gem_<r>.png` no canto
  inferior direito com 34% do lado. Básico não é tocado (nem entra no cache). Só endereços de `assets/icons/slots/` entram (arma com imagem própria fica fora).
- CACHE E CUSTO: uma pintura por ícone + raridade + tamanho (tamanho = lado × densidade da tela, arredondado para 96, 144 ou 192 px), guardada como
  `blob:` URL em `XRI.c`; os redesenhos só leem o cache. Pedidos novos vão para uma fila que pinta UM por quadro (`requestAnimationFrame`), os do desenho
  mais recente primeiro; nada é pintado nem carregado dentro do desenho da tela. Enquanto não fica pronto, sai o ícone de hoje com a marca `data-ric`;
  ao ficar pronto só esses `<img>` trocam de `src` (sem redesenhar a tela). Falha de imagem ou de gema: fica o ícone de hoje e tenta de novo depois de
  20 s. Teto de 240 combinações (acima disso, o ícone de hoje). O endereço pronto termina em `#assets/icons/slots/...` para o `rarDecorate` do
  `js/rarity.js` (`img[src*="icons/slots"]`) continuar achando o ícone.
- ONDE ENTROU: Equipamento (7 espaços, mochila, comparação, fantasma do voo/arrasto em `js/equipfx.js`), Loja (itens em ouro e a confirmação), Invocar
  (cartas), Passe (trilha, vitrine do nível grande, popup do Premium), prêmio de item da Vitória (`js/screens2.js`), Forja (espaço grande e a fileira,
  `js/p_forge.js`), Oferta (`js/p_offer.js`, arma do pacote) e Leilão (`js/p_auction.js`, `auImg` ganhou o 3º parâmetro r).
- FICOU DE FORA (arquivos de outros donos): `js/p_fuse.js` (`uThumb`) e `js/p_bag.js` (`bItemImg`): pedido no relatório ao coordenador.
- Testes novos (7, `test/paineis/raricon.tests.js`, carregado pelo `smoke.js`): chave nasce desligada e nada entra na fila; desligada → ligada →
  desligada com HTML idêntico em 6 telas (e Loja/Forja com peça forçada saem pintadas); nada pintado no quadro do desenho e uma pintura por quadro;
  cada raridade com tinta, contorno crescente e a gema certa (Básico e arma com imagem própria intactos); cache reutilizado (0 pinturas em 5
  redesenhos; 38 e 40 px dividem o ícone); troca só dos `<img>` marcados; falha de gema/ícone não trava a fila.
- Resultados: `node --check` nos editados OK; `conflitos.js js/p_*.js`: só os conhecidos (XR/rClick do p_realm, falso alarme) e `cEsc` em
  `js/p_chat.js` × `js/cloudchoice.js` (não é desta peça); `run.js` "TUDO OK (162 verificações)"; `flows.js` "fluxos duros OK"; `smoke.js` 390 e 288:
  187 OK, 0 FALHA; `smoke_all.js` 390 e 288: 194 OK, 0 FALHA (segue o erro de timer do p_intro, código 1).
- LIMITES (sem navegador): a pintura real (canvas, toBlob, blob: com `#`) não rodou aqui; o teste usa canvas falso. O QA confere no navegador.

## Bloco 46 (Painéis 3, sem navegador): arma na mão = SEMPRE o item equipado (decisão do dono, opção A)

Causa do "revólver saindo da clava": `S.skinEq.weapon` (skin de arma escolhida na Loja ou gravada pelos atalhos `?era=N` / `dbgSet`) vencia o item equipado
no `heroLook` e no `wItemNow`; a prévia da Aparência usa o mesmo caminho da batalha, então mostrava a mesma coisa.

- `index.html`: `heroLook` não lê mais `S.skinEq.weapon` (campo ignorado; nada é apagado nem migrado); atalhos `?era/wr/we` e `dbgSet` criam e equipam um ITEM
  de arma (`dbgWeapon(e,r)`, `origin:'debug'`, reaproveitado) em vez de gravar a skin; a ação antiga `data-a="skin"` recusa skin de arma. Armadura igual.
- `js/battle.js:79`: só a linha do `wItemNow` (devolve sempre o item equipado).
- `js/screens.js`: aba "Skins arma" fora da Loja (quem chega nela cai em "Skins herói"), `skequip` e a compra recusam skin de arma, a prévia da roupa mostra
  a arma do item, o rótulo "Skin <raridade>" do Equipamento olha só a roupa. Os ramos de arma de `hList/hFeat/skinArt/hPreview` ficaram sem uso (não apaguei
  sem navegador). `js/ui.js` (painel antigo de skins, desligado): era inicial e arma mostrada pelo item, sem fileira nem "Usar" de arma. `js/fallback.js:54`: item.
- PODER: o `Sys.skin` (js/sys/skin.js, de Sistemas) AINDA conta a skin de arma: `equippedIds` (:26) soma/usa todo `S.skinEq` no `majorPct` (:31), o `detail` (:43)
  lista o espaço weapon, e a coleção (`ownedCount`, :27) conta as skins de arma possuídas. Não editei.
- Testes: `test/e2e/weapons.js` ganhou o bloco D (5 provas); na fumaça, o teste "skin de arma possuída continua equipável" virou "aba Skins arma saiu; skin de
  arma não equipa nem compra" + "arma na mão = item equipado"; `raricon.tests.js` ajustado porque a chave `rarIcons` passou a nascer LIGADA (commit 2a4adeb).
- Resultados: `run.js` TUDO OK (162); `flows.js` "fluxos duros OK"; `weapons.js` A e C coerentes + "D OK"; `sheetgrid.js` TUDO OK (398); `welcome.js` e
  `preload.js` passam; fumaça 390 e 288: 195 OK, 0 FALHA (segue o timer do p_intro). `owner_all.js`: 2 FALHAS de 79, as duas da chave "Ícones por raridade"
  (testes 3 e 4 ainda esperam a chave desligada por padrão; vem do commit 2a4adeb, não desta peça).

## Bloco 47 (Painéis 3, sem navegador): nunca rolagem horizontal, parte 1 (lista + Loja + roladores declarados)

- Corrigido: `js/p_events.js` `.pz-evs` (fila de eventos rolava de lado: virou grade que quebra linha, mínimo 124 px por evento); `overflow-x:hidden` nos
  roladores verticais que não travavam o eixo x: `js/screens.js` (quadro "Automático"), `js/p_cfg.js` (`.c-field` e o quadro da linha 322), `js/p_codex.js:77`,
  `js/p_events.js` `.pz-sheet`, `js/p_mail.js:65`, `js/p_tourney.js:190`. Loja: abas com `min-width:0` (3 abas em flex, sem rolador).
- Fumaça: 2 verificações ESTÁTICAS novas (código-fonte e HTML de 57 telas na largura do teste); não mede scrollWidth (sem motor de layout).
- De outros donos (só listado): `js/p_bag.js:72` e `:158` (overflow-x:auto), `index.html:48` (`.chips`, sem uso achado), roladores verticais sem travar o x em
  `index.html:30`, `js/cloudchoice.js:23`, `js/p_bag.js:142`, `js/artprev.js:306`, `js/p_look.js:73`, `js/p_map.js:136`.
- PARTE 2 (pendente, precisa de navegador): texto `white-space:nowrap` em fileiras flex que pode CORTAR em 288 a 360 px (não rola, mas corta).

## Bloco 48 (Painéis 3, sem navegador): seleção de servidor LIGADA (APK v0.13.0)

- `js/panels.js`: `PANEL_ON.realm=true` (comentário acertado) e `Panels.close()` novo: o `js/p_realm.js` de Sistemas chama `Panels.close()` no Voltar e ao tocar
  no servidor atual, e esse método não existia (o toque não fazia nada). Fecha pela mesma rota do Voltar (`Screens.close`, que devolve à tela de origem).
- `js/p_cfg.js`: linha "Servidor" no cartão Conta (aba da conta), logo abaixo do retrato: selo do `realmBadge()` + botão "Trocar servidor" (`data-x="realm"` →
  `Panels.open('realm',{from:'cfg'})`; o Voltar devolve às Configurações). Sem `realmBadge` (ou com erro nele) a linha não aparece; painel desligado: selo sem botão.
- Sem item no MENU. Modo dono (`js/artprev.js`, chave "Escolha de servidor"): não precisou de mudança; `owner_all.js` passa (79) com a chave nascendo ligada.
- Testes: `vipconv.tests.js` ganhou 2 ("servidor: painel ligado, abre e fecha, sem item no MENU" e "servidor: linha nas Configurações…") e o teste "carga" agora
  espera `PANEL_ON.realm` ligada; `smoke.js`: o detector de escopo próprio do p_realm ignora o comentário de cabeçalho (o arquivo novo começa com comentário).
- Resultados: `run.js` TUDO OK (162); `owner_all.js` OK (79); `realm.js` sem falha dura, 1 achado antigo (g: importar código de outro servidor); fumaça 360, 390
  e 288: 199 OK, 0 FALHA (segue o timer do p_intro); `conflitos.js`: p_realm acusa mount/card/load (falso alarme: arquivo em escopo próprio).

## Bloco 49 (Painéis 3, sem navegador): ícone de peça em 3 desenhos (t0 / _t1 / _t2)

Resolvedor ÚNICO = `Sys.assets.tierIcon(url, r)` de Sistemas (não criei outro). `js/screens.js`: `xTierIco` (só a guarda) entra em `xRarIco` / `xRarIcoUrl` antes da
pintura da opção C, então todas as telas que já passavam por elas (Equipamento, comparação, Loja, Invocar, Passe, Vitória, Forja, Oferta, Leilão, fantasma do
arrasto) mostram o desenho da raridade. `index.html:338`: `slotIcon(slot, era, r)` com o 3º parâmetro opcional. `js/farm.js:74`: `thumb` do baú/entrega passa a
raridade. `js/p_events.js:324`: prêmio de item do evento. Aplicar duas vezes é inofensivo (endereço já `_t1` não casa com a regra do módulo).
ACHADO para Sistemas: os t0 estão no pacote `core` e os `_t1/_t2` nos pacotes `era:N` do manifesto; o `tierIcon` só confere o manifesto, não a instalação do pacote.
Teste novo (fumaça): 270 combinações (9 eras × 5 peças × 6 raridades) no mapeamento e em disco. Fumaça 390/360/288: 200 OK, 0 FALHA; `run.js` 162; `flows.js`
"fluxos duros OK"; `owner_all.js` 79; `test/sys/assets.test.js` 7.

## Bloco 50 (Painéis 3, sem navegador): achados do QA em 360/288, Excluir conta, vincular Google, import de outro servidor

- 360 px, Configurações: `.c-bg` tinha `inset:-14px` (388 px); agora `inset:0` (o `.x-ly` filho herdava a largura). A borda do desfoque fica sob a vinheta.
- Loja, cartão de item: a linha "espaço · era" era `white-space:nowrap` e cortava ("péu/Elmo"); agora quebra em duas linhas centradas quando não cabe.
- Equipamento, cartão de poder em 288: CAUSA achada na grade dos 6 atributos (`repeat(3,1fr)` não encolhe abaixo do texto: "Vel. de Ataque" empurrava a grade
  para fora do cartão). Agora `minmax(0,1fr)`; rótulo e valor descem a fonte até caber (palavra inteira; abaixo de 340 px ícone 14 px e respiros menores).
- Conta: "Excluir conta" discreto no fim do cartão (`data-x="delacct"` → `DeleteAccount.open()`); fora do Modo dono e só com `window.DeleteAccount`.
- Conta: com `OnlineBoot.state().on`, o Google vira botão (`OnlineBoot.google()`; uma chamada por vez; avisos por motivo; "Disponível no aplicativo" para
  `google_unavailable`) e mostra a conta vinculada (`Sys.net.player().linked` com 'google' + `email`, ou o vínculo desta sessão). Apple segue "Em breve".
- Import de outro servidor: o `cImportDo` e o `cParse` já recusavam; o aviso passou a "Este código é do servidor S1 · Nova Era. Troque de servidor para usar."
  O caso (g) do `test/e2e/realm.js` estava escrito ao contrário (gravava o save à mão quando a tela recusava); virou 3 verificações duras.
- Testes novos na fumaça (3) e ajuste do texto esperado no teste de cópia de segurança. Fumaça 288/360/390: 203 OK, 0 FALHA.
