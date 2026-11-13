# Cenário v2 — prova da era 2 (Medieval) em camadas animadas

**Ver em movimento:** http://localhost:8080/test/bg/preview.html
(o servidor redireciona para `/test/bg/preview` e perde os parâmetros; para `?t=12`, `?mode=antes` ou `?line=1`
abra direto `http://localhost:8080/test/bg/preview?t=12`)

**Pasta de entrega:** `assets/bg/v2/era2/` (29 arquivos, 1,5 MB) · **contrato:** `assets/bg/v2/era2/meta.json`
**Módulo embutível:** `test/bg/scene.js` (20 KB, sem dependências)

## Rodada 2 — correções pedidas pelo PO

| pedido | o que foi feito |
|---|---|
| 1. Kael na escala do jogo | Cena passou a 390x692 (campo de batalha); linha do chão em 0,78 da cena = 540 px = 64% da tela, igual ao `GY` do jogo. Herói com 160 px de altura (quadro de 183 px). Pés dentro da estrada de terra (a terra vai de 0,725 a 0,946; os pés ficam em 0,78). Vila ampliada: as casas ficaram com a porta na altura do herói; camada mid reexportada em 3168 px para não borrar. |
| 2. Costura das montanhas | A fusão foi removida. `far.webp` agora é desenhada alternando normal e espelhada; não há mais crista "dissolvendo". |
| 3. Repetição do chão | Pedras, rachaduras e seixos foram tirados da imagem base (só terra e grama) e viraram 19 decalques (`decals.webp`) espalhados por código com sorteio por célula: a sequência não repete. Postes, estandartes, tochas e o primeiro plano usam o mesmo sorteio. |
| 4. Moinho | Pás recortadas da arte e girando por código (1 volta a cada 14 s). O corpo do moinho foi retirado da camada e redesenhado como sprite separado (`mill_body.webp`), atrás da casa e da macieira. |
| 5. Nuvem simétrica | Céu novo, gerado com degradê só vertical e bordas sem nuvem: repete em si mesmo, sem espelho. |

Também: a pasta ficou autossuficiente (inclui `hero_run.png`, cópia da folha de corrida) e o `meta.json` traz
todos os parâmetros: camadas, larguras de repetição, parallax, `groundY`, escala e âncora do herói, âncoras de
torres/chaminés/forja, moinho, decalques (atlas + regras de sorteio + fórmula do `rnd`), nuvens, pássaros, névoa,
raios, fumaça, tochas, poeira, primeiro plano e ordem de desenho.

### Como embutir (`test/bg/scene.js`)
```js
const cena = await EonScene.create(canvas, { base: 'assets/bg/v2/era2/' });
// fora do localhost: passar as imagens por função
EonScene.create(canvas, { meta: metaObj, resolve: arquivo => urlOuDataUri[arquivo], width: 390, height: 692 });
// retorno: start(), stop(), setRunning(bool), set(segundos, congelar), resize(w,h), state
```
A página de prova usa exatamente esse módulo.

### O que vi no Chrome (prints em t = 3, 9, 13, 22,6, 27,5, 60, 130 s, com e sem `?line=1`)
- Pés na terra, sombra na linha; o boneco mede ~160 px.
- Moinho girando; emendas A→B e B→A da vila limpas; espelho das montanhas (t = 60) e emenda do céu (t = 130) sem marca.
- Chão: nenhum trecho igual entre os prints.
- Sem erro de console; acima de 100 fps neste PC (monitor de alta frequência). **Não testado em celular real.**

## Rodada 3 — ajustes finais (só código, 0 crédito)
- **Tela preta na abertura:** `scene.js` desenha o primeiro quadro na hora (degradê do céu + faixas do chão, cores em `meta.placeholder`) com uma barra fina de carregamento, e cada camada/sprite entra assim que decodifica (`img.decode()` em paralelo, sem esperar todas). A vila carrega primeiro em versão leve (`midA_lo.webp`, `midB_lo.webp`, ~50 KB cada) e troca pela definitiva. Medido com cache limpo (`?nocache=1`): 1º quadro em 37 ms, cena completa em 466 ms (localhost, PC). `EonScene.create` agora resolve assim que o meta chega; `cena.ready` resolve com tudo carregado.
- **Linha escura no encontro vila/grama:** era o contorno reto do topo de `ground.webp`. Foi recolorido para verde e a borda de cima esmaecida (`tools/finish.js`); a grama nasce da faixa da vila sem risco.
- **Distância mínima no sorteio:** decalques, beira da estrada e primeiro plano nunca se sobrepõem. Regra em `meta.spacing` (+ `minGap` e `reach` em cada grupo): cada candidato tem caixa e prioridade `rnd(i,seed,6)`; só é desenhado se nenhum vizinho com caixa encostando (mais `minGap`) tiver prioridade maior. Determinístico por célula.
- Conferido no Chrome com cache limpo em t = 27, 3 e 75 s: cena completa já no primeiro print, sem linha, sem itens sobrepostos, sem erro de console.
- `tools/mkmeta.js` lê `tools/info.era2.json` copiado para `<trabalho>/work/info.json`.

## Camadas e animados
Camadas: `sky.webp` (repete) · `far.webp` (espelha) · `midA.webp` + `midB.webp` (sequência) · `ground.webp` (repete) ·
primeiro plano por sprites (`grass1-4`, `rock1-2`, `bush`).

14 elementos animados: céu derivando · nuvens em 2 velocidades · raios de sol · 2 bandos de andorinhas ·
névoa · moinho · flâmulas das torres · brasa da forja · fumaça das chaminés · estandartes na estrada ·
tochas e lampião · poeira dourada · capim balançando · poeirinha dos passos.

## Créditos
9 gerações Nano Banana Pro 2K a 2 créditos = **18 créditos** (teto 20).
Rodada 1: 14 (céu, far, mid A, chão, props 1, props 2, mid B). Rodada 2: 4 (céu novo ladrilhável, folha de decalques).
O céu da rodada 1 foi descartado. As outras gerações no extrato da conta (Nano Banana 05:38–05:46 e Seedance) não são minhas.

## Como reproduzir nas outras 6 eras
Scripts em `test/bg/tools/` (sharp de `%TEMP%\tools\node_modules`; pastas por argumento):
1. Referência de estilo: `assets/hero/era2_t0.png` ("só estilo, não desenhe o personagem").
2. Gerar 21:9 2K: céu (degradê só vertical, 8% de cada borda sem nuvem); sobre magenta #FF00FF: far, mid A, chão.
3. Mid B com o mid A como referência; decalques com o chão como referência; 2 folhas de props 16:9.
4. `build2.js` (chroma, recortes, limpeza do chão, atlas de decalques), `props.js`/`props2.js`, `mkmeta.js`.
5. Ajustar âncoras no `mkmeta.js` olhando as imagens e conferir na página.

O recorte do moinho (`mill.js`) é feito à mão para esta arte; elementos giratórios de outras eras pedem o mesmo trabalho
ou, melhor, já gerar a peça móvel separada.

**Custo por era: 18 créditos** (9 gerações), 20–22 com uma regeração. Seis eras: cerca de 110–130 créditos.

## Defeitos visíveis (franqueza)
1. **Moinho**: corpo e telhado são um desenho vetorial meu, mais liso que o resto da arte; de perto dá para notar. Há um remendo de ~100 px na cumeeira da casa onde a pá antiga encostava.
2. **Estrada**: ao tirar as pedras, as manchas de terra ficaram com borda macia (pintada), não com o corte seco do cel shading. Os decalques por cima têm o traço certo.
3. (resolvido na rodada 3) Decalques tinham sobreposição; agora há distância mínima.
4. **Grama da frente do chão** ainda repete a cada 1044 px (2 pedras e flores na faixa de baixo, quase toda fora da tela e coberta pelo primeiro plano).
5. **Vila** repete a cada ~29 s (2 trechos); o castelo distante a cada ~150 s.
6. **Bandeira azul** já veio com uma dobra pintada; a ondulação soma com ela.
7. A velocidade de corrida (190 px/s) é estimativa minha; não medi contra `Anim.groundSpeed` do jogo.
8. (resolvido na rodada 3) A cena ficava preta até decodificar tudo; agora o primeiro quadro é imediato.

## Avaliação
Claramente acima do cenário antigo e, depois desta rodada, na escala do jogo: 5 planos de profundidade, traço
coerente com o Kael, nada estático. Os pontos que um olhar exigente ainda pega são o corpo do moinho e a textura
macia da estrada.

---

# Era 0 (Pré-História) — mesmo padrão da era 2

**Ver em movimento:** http://localhost:8080/test/bg/preview?era=0
(`?era=0&t=12` congela · `&line=1` linha dos pés · `&nocache=1` · botão "Ver ANTES" compara com `assets/bg/era0.png`; sem `era` a página continua abrindo a era 2)

**Pasta de entrega:** `assets/bg/v2/era0/` (32 arquivos, 1,67 MB) · **contrato:** `assets/bg/v2/era0/meta.json` (mesmo formato da era 2 + bloco `fx`)

```js
const cena = await EonScene.create(canvas, { base: 'assets/bg/v2/era0/' });
// fora do localhost
EonScene.create(canvas, { meta: metaObj, resolve: arquivo => urlOuDataUri[arquivo], width: 390, height: 692 });
```

## Camadas
`sky.webp` (amanhecer azul/rosa/laranja, repete em si mesmo, sem espelho) · `far.webp` (vulcão + cordilheira, espelha;
`offset` põe o vulcão em cena desde o 1º quadro) · `midA.webp` + `midB.webp` (selva e acampamento: caverna com pinturas,
tendas de pele, mamute, totens / cachoeira, tenda com presas, 2ª caverna, crânio de tricerátops; versões leves `_lo`) ·
`ground.webp` (trilha de terra limpa; terra de 0,722 a 0,92, pés em 0,78) · `decals.webp` (24 decalques: 5 pegadas, 5 ossos,
5 pedras, seixos, tufos e broto, mais 4 variantes para a grama) · primeiro plano por sprites (`fern1-4`, `rock1-2`).

## 20 elementos animados
céu derivando · nuvens em 2 velocidades · raios de sol · pterossauros (4 quadros, 2 grupos) · fumaça do vulcão (quente na
boca) · brasas do vulcão · brilho da cratera pulsando · lava escorrendo (faixas de brilho descendo pelos veios) · névoa
(pé das montanhas + baixa) · cachoeira + respingo · fumaça fina das tendas · luz de fogo nas cavernas · fogueira (3 chamas
em quadros + brilho + faíscas) · tochas · gêiser em pulsos · dinossauro pequeno (cauda e cabeça) · cicadácea balançando ·
vaga-lumes · samambaias do primeiro plano · poeira nos pés.

## O que mudou no `scene.js` (e a prova de que a era 2 não mudou)
Só acréscimos opcionais, lidos do meta; quem não está no meta não é desenhado:
- `fx[]`: efeitos presos a uma camada: `flow` (máscara + faixas descendo, quadros guardados em cache), `glow`, `plume`
  (fumaça/vapor sem estado, depende só do tempo), `embers`.
- `roadside`: tipos novos `fire`, `critter`, `vent` e `sway` em sprite.
- `layers[].offset` (deslocamento inicial) e guardas `if` em `sunRays`, `towerFlags`, `forgeGlow`, `smoke`.
- `preview.html` aceita `?era=N` (padrão 2).

Prova: `http://localhost:8080/test/bg/compare?era=2&t=3,27,48,75` roda o módulo aprovado (cópia em
`tools/scene.era2-aprovada.js`) e o atual lado a lado, mesma semente de `Math.random`, e compara o canvas inteiro
(390x692 @2x): **0 canais diferentes em 1.079.520 pixels, nos 4 instantes**. Os 31 arquivos de `assets/bg/v2/era2/`
têm o mesmo SHA-1 de antes do trabalho.

## Como foi feito (8 gerações Nano Banana 2, 2K, 2 créditos cada = 16 créditos)
Modelo `nano_banana_2`, `resolution: 2k`, 21:9 (camadas) ou 16:9 (folhas), referência de estilo `assets/hero/era2_t0.png`.
1. céu · 2. far (vulcão SEM fumaça, pedido no prompt) · 3. mid A · 4. chão (pedido já limpo: sem pedras nem pegadas)
5. mid B com o mid A de referência · 6. decalques com o chão de referência · 7. props 1 (nuvens, pterossauro 4 quadros,
chama 4 quadros, fogueira, gêiser) · 8. props 2 (4 plantas, 2 pedras, cicadácea, dinossauro, tocha, caveira, totem,
costelas, pedra pintada). Nenhuma regeração.
Scripts: `tools/build0.js` (camadas, máscaras de lava e cachoeira por cor, igualação de tom na emenda A|B, borda do chão,
atlas), `tools/props0.js`, `tools/mkmeta0.js` (`node mkmeta0.js --info tools/info.era0.json <saída>` refaz o meta sem os brutos).

Armadilhas desta era:
- A folha de decalques veio com fundo ocre (magenta só nas linhas da grade). Resolvido recortando por preenchimento a
  partir da borda de cada célula; como o ocre é o da trilha, não sobra halo.
- O fundo de selva do mid tem tom diferente nas bordas esquerda e direita: na emenda aparecia um degrau vertical. O
  `build0.js` iguala o lado esquerdo de cada trecho ao direito do anterior, linha a linha, esmaecendo em 520 px.
- O mid B veio com uma samambaia "fantasma" semitransparente no magenta; apagada no script.
- Pedir a peça que vai se mexer já separada (fumaça fora do vulcão, chama fora da fogueira) evitou todo retoque manual.

## Conferido no Chrome (cache limpo)
t = 0,5 · 3 (com `line=1`) · 4 · 9 · 12,5 · 15,2 · 21,9 · 26,5 · 36 · 41 · 48 · 60 · 75 · 130 s, mais pares próximos
(3/3,5 · 15,2/15,35 · 36/36,6) para ver lava, fumaça, cachoeira e asas mudando.
- Pés na terra, sombra na linha de 0,78; boneco com ~160 px.
- Emendas A→B (t≈12,5) e B→A (t≈26,5) sem marca; espelho do far e emenda do céu sem marca.
- Decalques, beira da trilha e primeiro plano sem sobreposição; nenhuma linha reta escura entre camadas.
- 1º quadro em 16–42 ms, cena completa em 380–620 ms com `nocache`. Sem erro de console (só avisos de uma extensão do navegador).

## Defeitos visíveis (franqueza)
1. **Não medi fps de verdade:** a janela do Chrome da automação estava limitada a ~9 quadros/s (janela em segundo plano).
   Em laço forçado a era 0 custa ~15 ms por quadro contra ~13 ms da era 2 no mesmo teste: cerca de 20% mais pesada.
   **Não testado em celular real.**
2. **Lava e cachoeira** são brilho em faixas descendo sobre a arte parada, não quadros desenhados. De perto, quem procurar
   vê que a forma da água/lava não muda, só a luz.
3. **Fumaça, vapor e respingo** são bolhas lisas em 2 tons, sem contorno escuro, mais simples que o resto do traço.
4. **Dinossauro:** só cauda e cabeça mexem (deformação por fatias); as pernas ficam paradas e ele não anda.
5. **Manchas da trilha** são elipses grandes e repetem a cada ~1000 px; os decalques por cima disfarçam.
6. **Selva** repete a cada ~28 s (2 trechos); o vulcão aparece de 0 a ~73 s e some até ~150 s (fica só a cordilheira).
7. **Tendas, mamute, totens e pinturas** são parados (como as casas da era 2); o movimento vem do que está em volta.
8. **Decalques iguais** podem cair perto um do outro (vi 2 ossos cruzados e 2 crânios no mesmo quadro).
9. Pasta com 1,67 MB (era 2: 1,5 MB): a selva é mais cheia e comprime pior; mid em 2640 px (era 2: 3168 px).
10. O herói usa a folha de corrida da era 2 (armadura medieval); a roupa da era 0 ainda não existe animada.

## Era 0 — rodada 2 (só código, 0 crédito)
- **Risco branco em t=6:** era a barra de carregamento do `scene.js` (28% da largura = 109 px, em y = 50%), que ficava parada na tela quando a aba estava em segundo plano e o último quadro tinha sido desenhado um instante antes de `ready`. Agora a barra some com progresso 100% e a cena redesenha na hora em que termina de carregar. Varredura de `midA.webp`/`midB.webp` por riscos claros finos: nenhum na arte (só a espuma da cachoeira).
- **Mesmo decalque repetido:** `decals.sameTypeGap = 0.564` (1 tela): o mesmo nome do atlas nunca aparece duas vezes a menos dessa distância; vence o de maior prioridade, determinístico. Conferido em 120 SH de trilha: 0 pares iguais a menos de 1 tela. A era 2 não tem a chave e não muda.
- **Pedras e ossos fora da pisada:** `decals.footClear = [0.765, 0.8]`; o grupo da trilha virou `roadFlat` (pegadas e seixos, podem ficar sob os pés), `roadBigBack` (borda de trás) e `roadBigFront` (metade da frente).
- Era 2 de novo idêntica: `compare?era=2&t=3,27,48,75` = 0 canais diferentes; arquivos da era 2 com o mesmo SHA-1.
- Defeito 8 da lista acima (decalques iguais perto) está resolvido.

---

# Era 1 (Antiguidade) — mesmo padrão das eras 2 e 0

**Ver em movimento:** http://localhost:8080/test/bg/preview?era=1
(`&t=12` congela · `&line=1` linha dos pés · `&nocache=1` · botão "Ver ANTES" compara com `assets/bg/era1.png`)

**Pasta de entrega:** `assets/bg/v2/era1/` (45 arquivos, 1,54 MB) · **contrato:** `assets/bg/v2/era1/meta.json` (mesmo formato das eras 0 e 2)

**`scene.js` NÃO mudou** (mesmo SHA-1 `8a973bc5…`, data 04:03). A era 1 sai só com dados no meta, usando os tipos que já existiam.
Em `test/bg/` só mudou uma linha de texto do `preview.html` (a dica de URL passou a citar `?era=1`) e entraram scripts em `tools/`.

## Camadas
`sky.webp` (céu azul mediterrâneo + MAR na mesma imagem; repete em si mesmo; o mar vai do horizonte, em 0,419, até o topo do chão e
aparece nos vãos da cidade e pelos arcos do aqueduto) · `far.webp` (colina da acrópole + montanhas ensolaradas; espelha; a base é a
linha da água; ladrilho estreito de 0,76 SH para a acrópole nunca sair de cena) · `midA.webp` (oliveiras, templo com frontão dourado,
2 braseiros, estátua de bronze, ânforas, mercado com 2 toldos) + `midB.webp` (ciprestes, aqueduto com cascata, fonte, obelisco e
esfinge, arena com 3 mastros; versões leves `_lo`) · `ground.webp` (calçada romana de lajes claras entre guias de pedra, areia nas duas
bordas; lajes de 0,718 a 0,921, pés em 0,78) · `decals.webp` (20 decalques: 5 de ânfora quebrada, ramo/coroa/folhas de louro, ramo de
oliveira, folhas secas, 4 de moedas, seixos, 2 lajes rachadas, rachaduras, 2 tufos secos) · primeiro plano por sprites (louro, capim
seco, papoulas, acanto, tambor de coluna e capitel caídos).

## 21 elementos animados
céu e mar derivando · nuvens em 2 velocidades (passam na frente do sol) · raios saindo do sol · pombas (4 quadros, 2 grupos) ·
2 trirremes navegando no mar · brilho do sol na água (traços acendendo em ondas) · bruma do mar + poeira baixa · fogo dos 2 braseiros
do templo (chama que muda de forma + brilho + faíscas) · incenso subindo dos braseiros · barras dos 2 toldos tremulando ·
3 flâmulas na arena · cascata do aqueduto (fios em 2 ritmos + brilho + respingo + gotas) · fonte (jato de gotas em arco + água nas
bacias + respingo) · braseiro da beira da estrada (3 chamas em quadros + faíscas) · tocheiros de bronze · estandartes vermelho e roxo ·
gato (cauda) e cabra (cabeça) · oliveiras e ciprestes da beira balançando · poeira dourada · plantas do primeiro plano · poeira nos pés.

## Como cada pedido saiu sem código novo
| pedido | tipo já existente usado |
|---|---|
| mar atrás da cidade | pintado na camada `sky` (altura 0,62); `farFill.color` transparente |
| trirremes | itens de `clouds` (grupo com `drift` negativo: navegam para a direita; ficam atrás do `far`, abaixo da linha da água) |
| sol | item de `clouds` com parallax 0 (fixo); `sunRays.origin` no centro dele |
| brilho na água | `fx flow` na camada `far` com retângulo abaixo do ladrilho (y ≥ 1,0) e máscara de traços (`glint.webp`) |
| toldos tremulando | `towerFlags` com `pole: 0`: 2 meias barras de pano por toldo, presas na beirada |
| flâmulas da arena | `towerFlags` nos 3 mastros que já vêm pintados |
| fogo do templo | `fx plume` com `grow` negativo e cores quentes (bolhas que sobem e afinam) + `glow` + `embers` |
| incenso | `fx plume` fino |
| cascata | 3 `fx flow` (máscaras `fallA`/`fallB` = fios alternados em ritmos diferentes, mais `fall` inteira) + `plume` + `embers` com gravidade |
| fonte | `fx flow` + `embers` com gravidade positiva (gotas em arco) + `plume` |
| braseiro, tocha, estandarte, gato, cabra, árvores | `roadside` `fire`, `torch`, `banner`, `critter`, `sprite` com `sway` |

## Como foi feito (8 gerações Nano Banana 2, 2K, 2 créditos cada = 16 créditos; nenhuma regeração)
Modelo `nano_banana_2`, `resolution: 2k`, 21:9 (camadas) ou 16:9 (folhas), referência de estilo `assets/hero/era2_t0.png`.
1. céu + mar · 2. far (costa sobre magenta, base reta na linha da água) · 3. mid A · 4. chão (pedido já limpo) · 5. mid B com o mid A
de referência · 6. decalques com o chão de referência · 7. props 1 (3 nuvens, sol, pomba em 4 quadros, braseiro, 2 trirremes, 2 barras
de toldo) · 8. props 2 (4 plantas, 2 ruínas, oliveira, cipreste, gato, cabra, ânfora, haste, 2 flâmulas, tocheiro, herma, escudo).
Reaproveitados (cópia, sem alterar a origem): `flame.webp` da era 0 e `pole.webp` da era 2.
Scripts: `tools/build1.js` (camadas, máscaras, atlas, sprites; leva cerca de 2,5 min) e `tools/mkmeta1.js`
(`node mkmeta1.js --info tools/info.era1.json <saída>` refaz o meta sem os brutos). `tools/pv.js` e `tools/join.js` só geram prévias.
Os brutos foram apagados.

Armadilhas desta era:
- **Chroma em roxo/vermelho:** a flâmula roxa ficava translúcida no `keyMagenta`. `safeKey` só aceita o alfa a até 3 px do fundo.
- **Árvores cortadas nas bordas do mid A** (o gerador ignorou "não encostar na borda"): a da direita foi removida por cor (areia e
  contorno do toldo refeitos); a da esquerda teve a silhueta esquerda trocada pelo espelho da direita, com contorno novo.
- **Folhas de sprites misturam linhas:** corte por componentes conexos fundidos por proximidade, não por faixas vazias.
- **Calçada:** a imagem veio periódica (1580 px); recortei um período exato e a emenda fica invisível.
- **Rachaduras** vieram roxas: recoloridas para marrom. **Pomba:** quadros alinhados pelo bico (cor), não pela ponta da asa.
- **Areia do mid** mais clara que a do chão: igualada no script.

## Conferido no Chrome (cache limpo)
t = 0,5 · 3 · 6 · 9,5 · 13 · 15 · 17 · 20,2 · 22,6 · 24 · 31 (com `line=1`) · 41 · 60 · 75 · 133 s, mais pares próximos
(0,5/0,62 · 3/3,25 · 6/6,15 · 15/15,12 · 20,2/20,32 · 31/31,12) para ver chama, incenso, toldos, flâmulas, cascata, fonte, cabra e
navios mudando.
- Pés nas lajes, sombra na linha de 0,78; boneco com ~160 px. Faixa da pisada sem peças com volume.
- Emendas A→B (t≈9,5) e B→A (t≈22,6) limpas; mar contínuo atrás; nenhuma linha reta escura entre camadas.
- 1º quadro em 37–200 ms, cena completa em 630–1160 ms com `nocache` (PC ocupado por outra sessão). A barra de carregamento some.
- Sem erro de console (só avisos de uma extensão do navegador). Modo "Ver ANTES" funcionando.
- Custo de desenho em laço forçado, mesma aba: era 1 ≈ 22–26 ms, era 0 ≈ 24–33 ms (máquina carregada; mesma ordem de grandeza).
- **Eras 0 e 2 intactas:** `compare?era=2&t=3,27,48,75` = 0 canais diferentes em 1.079.520 pixels nos 4 instantes; nenhum dos 63
  arquivos de `era0/` e `era2/` tem data posterior às 04:10; `scene.js` com a mesma data e tamanho. As duas prévias abrem normalmente.
  (A página `compare` usa o módulo aprovado da era 2, que não conhece o bloco `fx`; por isso ela não serve para a era 0. A garantia
  da era 0 é o `scene.js` e os arquivos dela estarem byte a byte como estavam.)

## Defeitos visíveis (franqueza)
1. **Trirremes:** navegam e sobem/descem ~3 px num ciclo lento; as velas não mudam de forma (seriam precisos quadros + código novo).
2. **Fogo do templo** é feito de bolhas em 2 tons (muda de forma, mas é mais "bolhudo" que a chama em quadros do braseiro da estrada, que aparece ao lado).
3. **Toldos:** só a barra da frente tremula (2 panos por toldo, com uma junção no meio); a lona de cima é parada.
4. **Cascata e fonte:** continuam sendo brilho em faixas sobre a arte, agora com fios fora de fase, respingo e gotas. A água não é redesenhada em quadros. As gotas da fonte são pequenas e claras: sobre o mar aparecem pouco.
5. **Acrópole repete a cada ~47 s** (ladrilho de 0,76 SH espelhado): nunca some, mas em alguns momentos dá para ver a ponta de uma saindo e a da próxima entrando; os picos onde o ladrilho espelha ficam simétricos.
6. **Calçada repete a cada 441 px** (o desenho das lajes é o mesmo); os decalques disfarçam.
7. **Sol parado** no canto superior esquerdo (só os raios pulsam e as nuvens passam na frente); na prévia ele fica logo abaixo da etiqueta "DEPOIS".
8. **Templo** ocupa quase a tela toda por ~9 s (parado, com fogo, faíscas e incenso em volta). Estátua, obelisco, esfinge e arena são parados.
9. **Faixa de areia** entre a cidade e a calçada é lisa (~50 px), só com tufos e os objetos da beira.
10. **Oliveira da esquerda do templo** tem a silhueta esquerda reconstruída (um degrau pequeno na copa, embaixo); o poste direito da banca azul tem contorno irregular de perto.
11. **Flâmulas da arena** são grandes para o tamanho da arena; a cabra e o gato não andam.
12. O herói usa a folha de corrida da era 2 (armadura medieval). **Não testado em celular real**; fps real não medido (aba de automação limitada).

---

# Era 3 (Era da Pólvora) — mesmo padrão das eras 0, 1 e 2

**Ver em movimento:** http://localhost:8080/test/bg/preview?era=3
(`&t=12` congela · `&line=1` linha dos pés · `&nocache=1` · botão "Ver ANTES" compara com `assets/bg/era3.png`)
Vários instantes lado a lado (página nova, só de conferência): `http://localhost:8080/test/bg/sheet?era=3&t=3,9.3,22.3,36&w=300&line=1`

**Pasta de entrega:** `assets/bg/v2/era3/` (48 arquivos, 1,72 MB) · **contrato:** `assets/bg/v2/era3/meta.json` (mesmo formato das eras 0 e 1)

**`scene.js` NÃO mudou** (SHA-1 `8a973bc5…`, 33.649 bytes, data 04:03). A era 3 sai só com dados no meta. Os 108 arquivos de
`era0/`, `era1/` e `era2/` têm o mesmo SHA-1 de antes do trabalho; `compare?era=2&t=3,27,48,75` = 0 canais diferentes.
Em `test/bg/` mudou uma linha de texto do `preview.html` (a dica de URL cita `?era=3`) e entraram `sheet.html` e os scripts
`tools/build3.js`, `tools/mkmeta3.js`, `tools/info.era3.json`.

## Camadas
`sky.webp` (fim de tarde turquesa/laranja + MAR na mesma imagem; repete em si mesmo; horizonte em 0,404) · `far.webp` (promontório
da fortaleza com o farol na ponta e um galeão ancorado, vão de mar, ilha de palmeiras; REPETE, sem espelho; ladrilho de 0,90 SH com
a fortaleza em metade dele: sempre há um pedaço dela na tela e nunca dois faróis) · `midA.webp` (cais de pedra com barris e caixotes,
guindaste de madeira, taverna com letreiro, redes, galeão atracado de velas recolhidas) + `midB.webp` (bateria de 3 canhões na
muralha, mastro, palmeiras, armazém com 2 lampiões, estaleiro com casco em construção; versões leves `_lo`; cada trecho acaba antes
das bordas, então entre um e outro aparece o mar) · `ground.webp` (píer: canal de água atrás, guia de pedra, tábuas de 0,720 a 0,904,
guia de pedra, água na frente; pés em 0,78 nas tábuas) · `decals.webp` (20 decalques pintados: 2 poças, 2 algas, corda solta, moeda,
3 moedas, pilha de moedas, bolsa, mapa, garrafa, cacos, concha, vieira + estrela, rolo de corda, tábua solta, remendo de tábuas,
espinha de peixe, balas de canhão, cunho; mais 3 espumas procedurais) · primeiro plano por sprites (folhas de palmeira, capim do mar,
barril boiando, estacas de amarração, pedra com algas).

## 25 elementos animados
céu e mar derivando · nuvens em 2 velocidades · raios do sol poente · gaivotas (4 quadros, 2 grupos) · galeão e chalupa navegando no
horizonte, por trás das ilhas · 4 fileiras de ondas em sentidos e velocidades diferentes · brilho do sol na água · farol piscando
(halo + facho) · bruma no horizonte e maresia no pé do cais · 3 flâmulas e uma vela solta no galeão · bandeira pirata no mastro da
bateria · fumaça da chaminé da taverna · luz das janelas, da lanterna de popa e dos lampiões do armazém · 3 canhões da muralha
atirando em sequência (clarão + baforada) · espuma e gotas no casco do galeão · lampiões de poste no píer (chama em quadros) · cesto
de fogo (3 chamas em quadros + faíscas) · bandeira pirata e flâmula em hastes no píer · papagaio e gato (cauda) · botes balançando
no canal · boias e palmeiras de ilhota balançando · onda batendo na pedra em pulsos · poeira dourada · primeiro plano balançando ·
poeira nos pés.

## Como cada pedido saiu sem código novo
| pedido | tipo já existente usado |
|---|---|
| mar atrás do porto | pintado na camada `sky`; `farFill` transparente; vãos entre os trechos do `mid` |
| sol poente + caminho de luz | itens de `clouds` com parallax 0 (`sunglow`, `sun`, `sunpath`); `sunRays.origin` no centro do sol |
| navios navegando | itens de `clouds` com `drift` negativo; linha d'água acima da base do `far` (passam por trás das ilhas) |
| ondas que mudam de forma | 4 grupos de `clouds` com tiras de ondas que emendam (`waveS`, `waveL`), cada fileira com velocidade e sentido próprios, mais `fx flow` com `glint` |
| farol piscando | `fx flow` na camada `far` sem faixas, só `base` + `pulse` (acende e apaga por inteiro) + `glow` |
| fumaça com o traço da arte | par de `fx plume` com a MESMA semente: o primeiro desenha os discos 0,0023 SH maiores na cor do contorno, o segundo pinta os 2 tons por cima: nuvem de desenho com contorno |
| canhão em baforadas com clarão | 6 `plume` com `n: 1` e a mesma `life`: as 6 bolhas nascem juntas na boca (amarelo nos primeiros 7%), abrem e somem; canhões defasados |
| flâmulas, vela, bandeira | `towerFlags` com `pole: 0` nos mastros pintados; `roadside banner` no píer |
| bote balançando | `roadside critter` com `tail` e `head` no meio do sprite e `k = π`: proa e popa em contrafase |
| peças boiando no canal | `roadside` normal, com uma faixa transparente embaixo do sprite (a base fica na água, acima da guia) |
| respingo de onda | `roadside vent` (pulsos) numa pedra do canal |
| lampiões e cesto de fogo | `roadside torch` e `fire` com a folha `flame` (4 quadros) |

## Como foi feito (8 gerações Nano Banana 2, 2K, 2 créditos cada = 16 créditos; nenhuma regeração)
Modelo `nano_banana_2`, `resolution: 2k`, 21:9 (camadas) ou 16:9 (folhas), referência de estilo `assets/hero/era2_t0.png`.
1. céu + mar · 2. far sobre magenta · 3. mid A · 4. chão (píer limpo, com as duas faixas de água) · 5. mid B com o mid A de
referência · 6. decalques com o chão de referência · 7. props 1 (3 nuvens, gaivota em 5 poses, galeão, chalupa, bote, boia, 3
bandeiras, vela) · 8. props 2 (6 peças de primeiro plano, palmeira de ilhota, lampião, cesto de fogo, papagaio, gato, canhão, pilha
de carga, âncora, baú, cabeço, pedra, rede).
Reaproveitados (cópia, sem alterar a origem): `flame.webp` da era 0, `pole.webp` e `hero_run.png` da era 2.
Procedurais (SVG no script): sol, brilho do sol, caminho do sol, 2 tiras de ondas, máscara de brilho do mar, máscara do facho do farol, espumas.
Scripts: `tools/build3.js` (cerca de 1 min; aceita a lista de etapas como 3º argumento) e `tools/mkmeta3.js`
(`node mkmeta3.js --info tools/info.era3.json <saída>` refaz o meta sem os brutos; conferido: sai idêntico). Brutos apagados.

Armadilhas desta era:
- **Far espelhado mostrava 2 faróis na mesma tela.** O ladrilho foi remontado para repetir: promontório, vão, ilha (as duas metades
  de ilha que vinham cortadas nas bordas, coladas uma na outra), vão.
- **Linha escura reta da água no far** (o gerador desenhou a linha d'água de ponta a ponta): o corte é feito logo acima dela.
- **Tábuas em leque** (perspectiva): o script desfaz a perspectiva (ponto de fuga medido pelas emendas) e corta o ladrilho de emenda
  a emenda de tábua; só as guias e a água têm fusão na emenda.
- **Água do chão** mais clara que o mar do céu e com um reflexo laranja grande: recolorida para o tom do mar pintado; a borda de cima
  esmaece sobre o pé do cais (sem linha entre camadas).
- **Folhas de sprites:** a fusão por proximidade de caixas juntava a gaivota com o galeão; distância de fusão baixada para 8-10 px.
- **Gaivota:** quadros alinhados pelo bico (pixel amarelo mais à direita), não pelo ponto mais à direita (a asa passa do bico).
- **Canhão do píer** veio apontando para a direita: espelhado. Ficou parado: a baforada em `vent` não aceita o par com contorno e
  saía em bolhas lisas; as baforadas ficam na bateria da muralha.
- **Rede de pesca** da folha 2 veio com fios magenta: não usada.

## Conferido no Chrome (cache limpo)
t = 0,5 · 1 · 3 (com `line=1`) · 4 · 7 · 9,3 · 10 · 11,5 · 13 · 16 · 20 · 22,3 · 24 · 27,5 · 31 · 36 · 41 · 46 · 51 · 56 · 61 ·
66 · 71 · 76 s, mais pares próximos (7,6/7,8 · 12,3/12,5/12,9 · 24,5/25,1 · 59,5/60,5/61,5) para ver flâmulas, farol, canhões,
fumaça, ondas, navios e respingo mudando.
- Pés nas tábuas, sombra na linha de 0,78; boneco com ~160 px. Faixa da pisada sem peças com volume.
- Emendas A→B e B→A do porto são vãos de mar; emenda do chão sem marca; nenhuma linha reta escura entre camadas.
- 1º quadro em 26–45 ms, cena completa em 710–893 ms com `nocache`. A barra de carregamento some.
- Sem erro de console. Modo "Ver ANTES" funcionando.
- Custo de desenho em laço forçado, mesma aba: era 3 ≈ 19–27 ms, era 1 ≈ 15–20 ms (cerca de 20–30% mais pesada; máquina ocupada).
- Eras 0, 1 e 2 abrem normalmente.

## Defeitos visíveis (franqueza)
1. **Galeão atracado não balança** (é parte da camada); o que se mexe nele são as flâmulas, a vela solta, as luzes e a espuma. Ele
   ocupa quase a largura da tela por uns 10 s. Os navios do horizonte navegam, mas as velas não mudam de forma.
2. **Vela solta** na verga do traquete parece um pano rasgado pendurado, não uma vela armada.
3. **Canhões:** o clarão é a própria baforada nascendo amarela (0,3 s); não há lampejo separado nem recuo do canhão. No fim da vida
   a baforada fica translúcida por menos de 1 s.
4. **Água do canal** atrás do píer é pintura parada (anda junto com o píer); o movimento ali vem dos botes, boias, espuma e respingo.
   As espumas e as ondas do mar são desenho vetorial meu, mais simples que o traço da arte.
5. **Respingo na pedra** e **espuma do casco** são bolhas brancas sem contorno.
6. **Farol** acende e apaga em onda suave (não gira). **Sol** é um disco liso, parado na tela.
7. **Papagaio e gato** só mexem a cauda; palmeiras, guindaste, letreiro da taverna e casco do estaleiro no plano médio são parados.
8. **Duas bandeiras piratas** podem aparecer juntas (a do mastro da bateria e a da haste do píer).
9. **Tábuas** repetem a cada 612 px; na emenda há um bloco estreito na guia da frente. **Fortaleza** repete a cada ~55 s.
10. Pasta com 1,72 MB (pedido ~1,6). O herói usa a folha de corrida da era 2. **Não testado em celular real**; fps real não medido
    (aba de automação limitada a ~18 quadros/s).

## Era 3 — rodada 2 (só dados, 0 crédito, `scene.js` intacto)
- **Farol girando:** 2 fachos (`beamL`, `beamR`) em `fx flow` com `pulse: 1` e `pulse: -1` (contrafase): a luz varre da esquerda para a direita a cada 3,6 s, mais um halo. É alternância de 2 fachos, não um feixe que muda de ângulo quadro a quadro.
- **Uma bandeira pirata só:** a haste do píer agora leva a flâmula listrada azul e branca (ou a vermelha); a pirata fica só no mastro da bateria.
- **Lampejo do canhão:** 2 `plume` com `n: 1` na mesma fase da baforada; aparecem só nos primeiros 3% da vida (0,14 s) porque depois de `hotUntil` a cor é `#rrggbb00` (transparente).
- **NÃO FEITO, impossível sem mudar o módulo:** (a) balanço do galeão atracado e (b) recuo dos canhões. O módulo não desenha sprite solto preso ao plano médio: `mill` só gira sem parar, `towerFlags` só ondula pano, `fx` só desenha discos/máscaras, e `roadside`/`fg` têm um único sorteio com um único parallax (o do píer); itens de `clouds` ficam atrás do fundo distante. Faltaria um bloco opcional pequeno, por exemplo `layerSprites` (sprite ancorado num arquivo da camada, com `bob`/`tilt` em seno e, para o recuo, deslocamento em função da fase do tiro), mais o recorte do galeão e dos canhões como sprites.
- Conferido com cache limpo em t = 0,5 · 3 · 10,6 · 10,68 · 11,7 · 13,5 · 13,56 · 36 · 41 · 66; sem erro de console; eras 0, 1 e 2 e `scene.js` com o mesmo SHA-1. Pasta: 50 arquivos, 1,72 MB.

## Era 3 — rodada 3 (mudança autorizada no `scene.js`: bloco opcional `props`)
- **`scene.js` novo:** SHA-1 `de0a1adca5ab64df292e096d5f62053e863ef02b` (anterior `8a973bc5…`, guardado em `tools/scene.pre-props.js` para comparar e voltar atrás). Só acréscimo: função `drawProps` + 3 pontos de chamada (antes/depois de `drawLayer` de far, mid e ground). `EonScene.create` e o resto do código não mudaram. Sem `props` no meta nada é desenhado a mais.
- **ATENÇÃO, engenheiro:** o jogo carrega `test/bg/scene.js` com `?v=` de versão. É preciso subir a `VERSION` para o arquivo novo não vir do cache (com o módulo antigo a era 3 abre sem galeão e sem os canos dos canhões, porque eles saíram da camada).
- **Prova:** `test/bg/compare2?era=N&t=3,27,48,75` (módulo anterior × novo, mesma semente): eras 0, 1 e 2 = 0 canais diferentes em 1.079.520 pixels nos 4 instantes de cada uma.
- **`props` (meta):** `sprite, layer, tile, rect, front` + `bob {amp, period, phase}`, `tilt {deg, period, phase, pivot}`, `kick {dx, dy, period, index, attack, release}` (fase igual à de um `fx plume` com `n: 1`) e `flags` (panos que acompanham o sprite).
- **Galeão atracado:** recortado do mid A (`shipM.webp`; por trás ficou o cais, copiado de um trecho limpo). Sobe e desce ~2 px e inclina 1,1° em torno do meio da linha d'água (períodos de 4,6 s e 6,4 s). As 3 flâmulas e a vela solta passaram para `props[0].flags` e acompanham o balanço.
- **Recuo dos canhões:** os 3 canos foram recortados do mid B (`gun1-3.webp`); no disparo cada um recua 5–6 px ao longo do eixo e volta em 0,6 s, na mesma fase do lampejo e da baforada. Só o cano recua; a carreta fica parada.
- Recorte em `tools/cut3.js` (chamado pelo `build3.js`): casco por contorno traçado à mão + cor; canos por cor de ferro em faixas paralelas ao eixo. Os brutos do mid foram baixados de novo (sem custo) e apagados.
- Conferido na `sheet` com cache limpo: galeão em t = 3,9 e 7; canhão em t = 10,5 (antes), 10,63 (disparo: lampejo + cano recuado) e 11 (baforada); sem erro de console. Pasta: 54 arquivos, 1,74 MB.
- Defeitos novos possíveis: a luz da lanterna de popa e das janelas do galeão fica parada enquanto ele balança (desloca até ~2 px); na borda dos canos sobram tracinhos escuros do contorno da carreta.

---

# Era 4 (Era Industrial, steampunk vitoriano) — mesmo padrão das eras 0 a 3

**Ver em movimento:** http://localhost:8080/test/bg/preview?era=4
(`&t=12` congela · `&line=1` linha dos pés · `&nocache=1` · botão "Ver ANTES" compara com `assets/bg/era4.png`)
Vários instantes lado a lado: `http://localhost:8080/test/bg/sheet?era=4&t=3,3.5,20,20.4&w=340&line=1`

**Pasta de entrega:** `assets/bg/v2/era4/` (52 arquivos, 1,69 MB) · **contrato:** `assets/bg/v2/era4/meta.json` (mesmo formato das eras 0 a 3)

**Eu NÃO alterei `scene.js` nem as eras 0 a 3.** A era 4 sai só com dados no meta (blocos `mill`, `fx`, `towerFlags`, `clouds`, `birds`,
`roadside`, `decals`). Atenção: durante o meu trabalho OUTRA sessão alterou `test/bg/scene.js` (SHA-1 `8a973bc5…` às 13:00 →
`de0a1adc…` às 13:07, entrou o bloco `props`) e arquivos de `era3/` (meta, mid, beam, gun, halo, shipM). Os arquivos de `era0/`, `era1/`
e `era2/` têm o mesmo SHA-1 do início. A era 4 não usa o bloco `props`; foi testada com o módulo atual (`de0a1adc…`).
Em `test/bg/` mudei só a dica de URL do `preview.html` (cita `?era=4`) e criei `tools/build4.js`, `tools/mkmeta4.js`, `tools/info.era4.json`.

## Camadas
`sky.webp` (entardecer âmbar/cobre; o terço de baixo é névoa de carvão clara; repete em si mesmo) · `far.webp` (viaduto de ferro de
ponta a ponta, 3 chaminés, torre do relógio, gasômetro; REPETE sem espelho; ladrilho de 0,645 SH: a torre quase nunca sai de cena; a
base some na névoa) · `midA.webp` (caixotes e carvão, fábrica de tijolos com 6 janelas acesas, anexo, caldeira de cobre com tubos e
válvulas, guindaste a vapor) + `midB.webp` (banca de jornal, lampião a gás, estação de ferro e vidro com locomotiva parada, tampa de
bueiro, oficina com bobina de Tesla; versões leves `_lo`; vidro da estação translúcido; entre os trechos aparece a cidade na névoa) ·
`ground.webp` (calçada de lajes, guia, rua de paralelepípedos de 0,728 a 0,932 com 2 trilhos de bonde em 0,807 e 0,881, guia,
calçada; pés em 0,78 nos paralelepípedos) · `decals.webp` (20 decalques: 2 poças de óleo, tampa de bueiro, grelha, jornal aberto,
parafuso, parafusos + porca, engrenagem, 2 engrenagens, relógio de bolso, 2 de folhas secas, carvão, mancha, remendo de pedras, bola de
jornal, monte de carvão, chave inglesa, cano, lata; mais 6 objetos parados da calçada: hidrante, caixa de correio, jornais, carrinho
de carvão, banco, bicicleta) · primeiro plano por sprites (cardo, capim seco, carvão com pá, caixote com engrenagens, tambor, cano).

## 27 elementos animados
céu derivando · nuvens de fuligem em 2 velocidades · 2 dirigíveis cruzando o céu · trem a vapor cruzando o viaduto · corvos (6 quadros,
2 grupos) · relógio da torre com o ponteiro dos minutos andando (12 posições) · fumaça das 3 chaminés distantes · névoa em 2 faixas ·
ENGRENAGEM GIGANTE girando de verdade (rotação contínua) atrás da fábrica · fumaça das chaminés da fábrica e do guindaste (com
contorno) · janelas da fornalha pulsando · vapor da caldeira + jatos em pulsos nas 2 válvulas (com contorno) · faíscas de solda +
clarão azul · flâmulas e barra do toldo · locomotiva (fumaça, vapor no domo, jatos no cilindro, farol) · vapor do bueiro (com
contorno) · raios da bobina de Tesla piscando + brilho · luzes da estação · postes a gás com chama em quadros · cesto de brasas ·
estandarte e flâmula em hastes · gato (cauda e cabeça) · autômato (balança) · corvo no toco (cauda) · fuligem/poeira · primeiro
plano balançando · poeira nos pés.

## Como cada pedido saiu sem código novo
| pedido | tipo já existente usado |
|---|---|
| engrenagem girando | bloco `mill` da era 2: 1 "pá" = a engrenagem inteira (SVG, 16 dentes, 6 raios), pivô no centro; fica atrás do mid e aparece por cima do telhado do anexo |
| ponteiro do relógio | 12 `fx flow` (uma máscara por posição); `base`/`pulse`/`pulseCycles` calculados para o alfa só passar de 0 no quadro daquela posição (o canvas limita o alfa a 0..1); 1 passo por segundo |
| raios de Tesla | 4 `fx flow` com máscaras em ziguezague e limiar alto: rajadas curtas, laços de durações diferentes |
| trem no viaduto e dirigíveis | itens de `clouds` com `drift` negativo; o trem tem o parallax do far e fica atrás dele (rodas atrás do parapeito) |
| fumaça/vapor com contorno | pares de `fx plume` com a mesma semente (traço + 2 tons), todos presos ao mid (e ao far) |
| jatos de válvula | plumes com `n: 1` e a mesma `life`: nascem juntos e abrem para o lado |
| faíscas de solda | `fx embers` + `glow` azul de pulso rápido |
| nunca dois objetos-marca iguais | animados da calçada em `roadside` com `minGap` 0,5 SH (nunca dois na mesma tela); parados no atlas de decalques, com `sameTypeGap` |

## Como foi feito (8 gerações Nano Banana 2, 2K, 2 créditos cada = 16 créditos; nenhuma regeração)
Saldo 621,65 → 579,65 (os outros 26 créditos são de outra sessão). 1. céu · 2. far · 3. mid A · 4. chão · 5. mid B (ref. mid A) ·
6. decalques (ref. chão) · 7. props 1 (3 nuvens, corvo em 5 poses, 2 dirigíveis, trem, 3 bandeiras, toldo) · 8. props 2 (18 peças).
Reaproveitados: `flame.webp` (era 0), `pole.webp` e `hero_run.png` (era 2). Procedurais: engrenagem, 12 ponteiros, 4 raios.
`node tools/mkmeta4.js --info tools/info.era4.json <saída>` refaz o meta (conferido: idêntico). Brutos apagados.

Armadilhas: o céu veio com as nuvens cortadas a prumo nas margens (esmaecidas em 380 px); far cortado de coroa a coroa de arco;
fiadas de paralelepípedos cortadas de junta a junta (esticadas até 2%) e calçada de junta a junta de laje; caixas do dirigível e do
trem se cruzavam na folha (recortes limpos por coordenada); mancha de carvão veio roxa (recolorida); disco C: com menos de 500 MB livres.

## Conferido no Chrome (cache limpo)
t = 0,5 · 1 · 2,5 · 3 · 3,5 · 4 · 5,5 · 6,5 · 7 · 8,5 · 10 · 10,5 · 13 · 17 · 20 · 20,4 · 23,5 · 28 · 36 · 47 · 60 · 75 · 131 s (com `line=1`).
Pares 3/3,5 e 20/20,4: engrenagem, ponteiro, trem, fumaça, raios e vapor mudam. Pés nos paralelepípedos; base dos prédios limpa
(rampa do chão de 5 px); 1º quadro 24 ms, completo 645–713 ms; sem erro de console; a página com "Ver ANTES" carrega sem erro.
Custo em laço forçado, mesma aba (máquina muito carregada): era 4 ≈ 57–58 ms, era 1 ≈ 52–64 ms, era 3 ≈ 94 ms: nível da era 1.

## Defeitos visíveis (franqueza)
1. **Só UMA engrenagem gira** (o `mill` tem um eixo só); não há par de engrenagens engrenadas. É desenho vetorial meu, mais liso que a arte.
2. **Ponteiro do relógio** anda aos saltos (12 posições, 1 por segundo); o das horas é parado. Mostrador com ~33 px.
3. **Hélice dos dirigíveis** é um disco borrado pintado, não gira em quadros. **Trem**: a fumaça é pintada no sprite e as rodas não giram.
4. **Locomotiva parada**: o que se mexe são fumaça, vapor e luzes; ocupa ~80% da tela por uns 10 s. A fumaça dela passa por cima da ferragem da cobertura.
5. **Raios de Tesla** são 4 formas fixas alternando; podem cruzar a ponta da torre ao fundo. **Faíscas de solda** são contínuas e não há soldador.
6. **Gancho do guindaste, banca, portão** são parados. **Autômato** só balança (inclinação); gato e corvo não andam.
7. **Objetos da calçada**: um animado pode ficar na frente de um parado (ex.: cesto de brasas na frente do hidrante). Só um animado por tela: postes a gás aparecem espaçados.
8. **Vão entre os trechos** mostra a cidade na névoa atrás da calçada, sem muro. Emenda do far tem uma faixa esfumada de ~10 px nos telhados baixos.
9. **Torre do relógio** fica escondida atrás da estação por ~8 s (o vidro translúcido mostra pouco); em raros instantes aparecem a ponta de uma e a da próxima.
10. **Lata/carvão** podem cair em cima do trilho. Paralelepípedos repetem a cada ~580 px.
11. Pasta com 1,69 MB (pedido ~1,6). Herói com a folha da era 2. **Não testado em celular real**; fps real não medido.
12. Só 2 pares de movimento conferidos; não cliquei no botão "Ver ANTES" nem reabri as prévias das eras 0 a 3 nesta rodada; não refiz a
    comparação pixel a pixel da era 2 (o módulo foi alterado por outra sessão).

## Era 4 — rodada 2 (pedido do PO; 0 crédito)

**`scene.js` mudou nesta rodada** (autorizado pelo PO): SHA-1 `de0a1adc…` → **`f77e78ec79a52636b61c550a449fa1a9a3986c6a`**; cópia anterior em
`test/bg/tools/scene.pre-era4.js`. Só blocos opcionais lidos do meta: `rotors[]` (sprites girando presos a uma camada), `actors[]`
(sprites que cruzam a cena com peças girando; slots `sky` e `mid`), `roadside.sameTypeGap` e folhas de quadros em objetos da beira.
Prova de que as eras 0 a 3 não mudaram: módulo anterior e módulo novo rodados lado a lado na mesma página, mesma semente de
`Math.random`, canvas 390x692 inteiro comparado em t = 3, 27, 48 e 75 s: **0 canais diferentes nas 4 eras**. Os `meta.json` das eras
0 a 3 têm o mesmo SHA-1 de antes desta rodada. Não abri a prévia interativa de cada era.

O que mudou na era 4 (`tools/build4b.js`, `tools/mkmeta4.js`; a folha de sprites foi baixada de novo do resultado já pago, sem gerar):
1. **Par engrenado**: 16 dentes + 8 dentes em sentidos opostos, a menor com o dobro da velocidade e fase casada (`rotors`). O bloco `mill` saiu.
   Continuam vetoriais (não há engrenagem na arte do mid para recortar).
2. **Ponteiro dos minutos** em rotação contínua (1 volta em 40 s); os 12 `flow` e 11 máscaras saíram.
3. **Hélices dos dirigíveis** girando (o disco borrado foi apagado; pá vetorial que achata em cosseno) e **rodas do trem** girando (20 rodas sobrepostas).
4. **Trem passando na estação**: a locomotiva pintada e a parede do fundo foram apagadas do `midB` (galpão de ferro aberto, vê-se a cidade);
   o trem inteiro (o mesmo sprite do viaduto, em resolução cheia) entra, cruza por trás da ferragem e sai, e também passa por trás da
   fábrica e das engrenagens. Fumaça, vapor e luzes da locomotiva parada saíram.
5. **Gato, autômato e corvo**: folhas de 4 quadros derivadas do sprite (cauda do gato, cabeça do autômato, corpo do corvo girando numa junta).
6. **Calçada**: animados e parados voltaram ao mesmo sorteio (`roadside`), sem sobreposição e com `sameTypeGap` 0,62 SH. Lata, carvão,
   bola de jornal e cano só entre os trilhos ou entre o 2º trilho e a guia.
Pasta: 49 arquivos, ~1,8 MB.

Conferido no Chrome (cache limpo, página sheet): pares 3/3,4 e 3/3,13 (engrenagens, ponteiro, hélice, trem do viaduto e rodas),
13,5/13,9 e 15,5/15,8 (trem na estação e rodas), 7,2/7,5 (gato), mais 18,5 e 21. Sem erro de console.
NÃO conferido: autômato e corvo em par de instantes (só as folhas de quadros); encaixe dente a dente do par em zoom; peças com volume
fora do trilho em muitos trechos (vi 4 telas); custo por quadro (a medição desta rodada saiu inválida, 118–346 ms com a máquina
travando; a rodada 1 dava nível da era 1, mas agora há 40 rodas e 2 trens a mais); emendas e t > 21 s com o meta novo; botão "Ver ANTES".

Defeitos novos ou que ficaram:
- O trem da estação é menor que a locomotiva que estava pintada e, nos vãos entre os prédios, passa ~35 px acima da calçada, sobre a névoa (sem trilho visível).
- No galpão sobraram bordas serrilhadas nos arcos de onde saiu o tijolo e um resto vermelho do limpa-trilhos junto ao pilar direito.
- A fumaça do trem é pintada no sprite; as rodas sobrepostas são vetoriais e a biela não se mexe.
- Cabeça do autômato: aparece uma fresta escura no pescoço nos quadros inclinados; gato e corvo não andam.
- Miúdos rasos (parafusos, folhas, poça pequena) ainda podem cair sobre o trilho. Ponteiro das horas parado.
- Notas de texto do meta (`fxNota`, `clouds.nota`) ainda citam o ponteiro por `flow` e os dirigíveis em `clouds`.
- O disco C: encheu (0 MB) no meio da rodada; nenhum arquivo entregue ficou truncado (conferido: lista do meta = arquivos da pasta).

## Era 4 — rodada 3 (pedido do PO; 0 crédito, só recorte/vetor local)

**`scene.js` mudou de novo** (1 linha, bloco opcional): `actors[].tile` = a faixa se repete a cada `loop` (usada pelo trilho da estação).
SHA-1 `f77e78ec…` → **`67a01b153b4069840054d3eb1764f7532762b5dd`**; cópia anterior em `test/bg/tools/scene.pre-era4r3.js`.
Eras 0 a 3: módulo original (`scene.pre-era4.js`) e módulo novo lado a lado, mesma semente, canvas 390x692 em t = 3, 27, 48 e 75 s:
**0 canais diferentes nas 4 eras** (canvas cheio: ~1,08 milhão de canais não nulos em cada comparação). `meta.json` das eras 0 a 3 com o mesmo SHA-1.

O que mudou (`tools/build4c.js`, `tools/mkmeta4.js`):
1. **Trem da estação apoiado**: mureta de tijolo com dormentes e trilho em cima (`railbed.webp`, vetorial), contínua de ponta a ponta, presa aos
   prédios. O topo do trilho fica na linha da base das rodas. Nos vãos entre prédios vê-se trilho, dormentes e a pedra de capa; no galpão a
   plataforma cobre a mureta e a base das rodas. **Trem do viaduto** baixado 0,003 SH: as rodas encostam no tabuleiro.
2. Resto vermelho do limpa-trilhos: repintado com a cor do bloco cinza do fim da plataforma (não dava para apagar: fica em cima do bloco).
3. Autômato: folha refeita a partir do quadro parado, com a junta preenchida; sem fresta no pescoço.
4. **Ponteiro das horas** andando a 1/12 do dos minutos (1 volta em 480 s). O ponteiro pintado foi apagado do mostrador em `far.webp`.
   CORREÇÃO DA RODADA 2: o ponteiro dos minutos era um sprite BRANCO (máscara herdada do `flow`) sobre mostrador creme, ou seja, praticamente
   invisível; o que se via era o ponteiro das horas pintado. Agora os dois são sprites escuros (`handM`, `handH`); `hand0` saiu.
5. Arcos do galpão: o tijolo que sobrava grudado na borda foi descascado (inundação a partir do transparente só por pixels cor de tijolo)
   e o alfa da borda foi suavizado (gaussiano 5x5 só na caixa do recorte).
6. Engrenagens (continuam vetoriais): ferro escuro com manchas de ferrugem em 2 tons, contorno mais grosso, rebites de latão, sombra interna
   no aro e no cubo, e um sprite de sombra projetada por engrenagem (`gearSh`, `gear8Sh`) que gira junto, deslocado para baixo/direita.
7. Notas do meta atualizadas (`fxNota`, `clouds.nota`, notas das camadas far e mid, `drawOrder`, `rotorsNota`, `actorsNota`, luzes da estação).
Pasta: 53 arquivos.

Conferido no Chrome (cache limpo; cena renderizada a dpr 3 e recortes ampliados ~3x): trem da estação em 4 pontos (t = 15,8 e 18,5 no galpão;
22 e 25,5 nos vãos): roda sobre o trilho/plataforma, sem vão; trem do viaduto em t = 22 e 27,5; autômato em t = 26,75 / 27,2 / 27,65 (cabeça
inclina, sem fresta); corvo em t = 32 / 32,6 / 33,2 (poses diferentes); relógio em t = 22 e t = 150 (ponteiro das horas em ~10h30 e ~2h);
engrenagens em t = 262. Sem erro de console.
Custo por quadro (dpr 2, 4 rodadas alternadas de 40 quadros, saltos de 1,37 s): mediana era 1 = 51–58 ms, era 4 = 46–51 ms. A comparação
relativa é estável (era 4 não custa mais que a era 1), mas o valor absoluto NÃO é medida de fps: a máquina estava ocupada por outra sessão e
cada quadro é um salto no tempo. Não medi em laço contínuo nem em celular.
NÃO conferido: encaixe dente a dente em zoom; a mureta em toda a volta do cenário (vi 2 vãos); botão "Ver ANTES"; prévia interativa.

Defeitos que ficaram:
- Da mureta só aparecem trilho, dormentes e capa (os tijolos ficam atrás da calçada); o trem continua menor que a locomotiva que era pintada.
- O bloco do fim da plataforma (à direita do pilar do galpão) ficou com uma mancha escura chapada onde estava o limpa-trilhos.
- Nos arcos do galpão sobram 3 tocos de pilar cortados retos na linha das mãos-francesas.
- A sombra das engrenagens cai sobre o céu/cidade (não há parede atrás delas): lê-se como halo escuro discreto.
- Fumaça do trem pintada no sprite; biela parada; gato e corvo não andam; miúdos rasos ainda podem cair sobre o trilho do bonde.

## Era 4 — rodada 4 (pedido do PO; 0 crédito, só recorte/código local)

**`scene.js` mudou** (só blocos opcionais): `actors[].parts[].rod` (biela em fase com as rodas), `actors[].smoke` (plumes presos ao corpo),
objetos de beira `pacer` (anda e volta) e `hopper` (pula de um poleiro a outro) e `span` no sorteio da beira.
SHA-1 `67a01b15…` → **`a1e1157e496f035855e7dcbd69731d62182c84a9`**; cópia anterior em `test/bg/tools/scene.pre-era4r4.js`.
Eras 0 a 3: módulo original (`scene.pre-era4.js`) x módulo novo, mesma semente, canvas 390x692 em t = 3, 27, 48 e 75 s:
**0 canais diferentes nas 4 eras** (~1,08 milhão de canais não nulos em cada comparação). `meta.json` das eras 0 a 3 com o mesmo SHA-1.

O que mudou (`tools/build4d.js`, `tools/mkmeta4.js`):
1. Galpão: os 3 tocos pendurados viraram pilares até a plataforma (extrusão vertical + base). Nada pendurado.
2. Bloco à direita do pilar: textura recomposta linha a linha a partir da faixa vizinha (faixa clara, filete, corpo escuro); sem chapado.
3. Sombra projetada das engrenagens: REMOVIDA (atrás delas só há céu e cidade). Ficou a sombra interna do aro e do cubo.
4. Biela: a haste pintada foi apagada do sprite; duas hastes por código (entre as rodas grandes e da roda da frente até a cruzeta),
   com o mesmo período e fase das rodas. Vale para os dois trens (mesmo sprite).
5. Fumaça do trem: a pintada foi apagada; plumes por código saem da chaminé e ficam para trás conforme a velocidade (nos dois trens).
6. Gato: senta mexendo a cauda, anda 0,04 SH em 6 passos (2 poses alternadas, base no chão), senta virado e volta (ciclo de 6 s).
   Corvo: dois tocos; fica pousado, voa em arco batendo asas até o outro, pousa, e volta (ciclo de 5 s, voo de 0,7 s).
Pasta: 53 arquivos, ~1,84 MB.

Conferido no Chrome (cache limpo, cena a dpr 3, recortes ampliados): biela em t = 15,8 / 15,87 (trem da estação) e t = 150 (viaduto);
fumaça nos dois trens (15,8 e 150); pilares do galpão em 15,8; gato e corvo com a rolagem parada, 12 instantes cada cobrindo o ciclo
inteiro (gato: sentado, indo, sentado virado, voltando; corvo: pousado à esquerda, voo, pousado à direita, voo de volta); sem erro de console.
MURETA/TRILHO na volta inteira do cenário (ciclo do mid = 25,7 s; 6 instantes de 4,5 em 4,5 s): t = 30 (fábrica e caldeira: coberta),
34,5 (vão caldeira/guindaste → banca: trilho, dormentes e capa visíveis, contínuos), 39 (banca e início do galpão: plataforma),
43,5 (galpão: plataforma), 48 (vão oficina → fábrica: visível, contínuo), 52,5 (fábrica: coberta). Somados aos da rodada 3 com o trem
em cima (15,8; 18,5; 22; 25,5).
Custo por quadro (dpr 2, 4 rodadas alternadas de 40 quadros): mediana era 1 = 52–62 ms, era 4 = 54–61 ms: equivalente. Valor absoluto não
é fps (máquina dividida com o engenheiro, quadros em salto).
NÃO conferido: bloco e pilares só na prévia do recorte e a dpr 3 em 1 instante; ida/volta do gato com a rolagem andando (o objeto fica
~2 s na tela); biela do viaduto em par de instantes (1 instante); encaixe dos dentes em zoom; "Ver ANTES"; prévia interativa; celular.

Defeitos que ficaram:
- Gato: não há ciclo de patas (não existe sprite andando); ele ginga em 2 poses e vira de uma vez ao trocar de sentido.
- Corvo: a troca pousado/voando é um corte seco entre dois desenhos de tamanhos e traços um pouco diferentes; bico do voo recolorido para cinza.
- Biela: reta simples; a cruzeta não é desenhada e sobra um pino pintado parado atrás da roda. No trem do viaduto ela tem ~1 px.
- Fumaça do trem da estação passa por trás do vidro do galpão (aparece pouco lá dentro).
- Nos arcos do galpão sobram 3 ou 4 lascas horizontais pequenas na borda do recorte.
- Trem menor que a locomotiva que era pintada; miúdos rasos ainda podem cair sobre o trilho do bonde.

## Era 5 (Moderna) — rodada 1: montada SEM navegador, aguardando a vez para a conferência visual
Pasta `assets/bg/v2/era5/` (52 arquivos, ~1,35 MB) · `tools/build5.js`, `tools/mkmeta5.js`, `tools/info.era5.json` · 8 gerações Nano Banana 2.1 2K = 16 créditos
(far, mid A, chão, mid B, decalques, folha de bichos/nuvens/bandeiras, folha de veículos, folha de objetos de rua; céu procedural).
`scene.js`: 3 blocos opcionais (slot `far` em actors; `flap` com `ang` em peças e em rotors). SHA-1 `a1e1157e…` → `5b725460ae70667db764598823f7ff729eee8b99`;
cópia anterior em `test/bg/tools/scene.pre-era5.js`. A comparação pixel a pixel das eras 0 a 4 AINDA NÃO FOI FEITA (precisa do navegador).
Conferido só por maquete estática (camadas, veículos, peças e âncoras desenhados pelo meta): nada em movimento foi visto ainda.

## Era 5 (Moderna) — rodada 1: conferida no navegador

**Ver:** http://localhost:8080/test/bg/preview?era=5 · instantes lado a lado: `http://localhost:8080/test/bg/sheet?era=5&t=3,9,15,21&w=340&line=1`
**Pasta:** `assets/bg/v2/era5/` (51 arquivos, ~1,35 MB) · `tools/build5.js`, `tools/mkmeta5.js`, `tools/info.era5.json` (meta refeito idêntico).
**Créditos:** 16 (8 gerações Nano Banana 2.1 2K a 2; nenhuma regeração; céu procedural). Saldo 1147,65 no início; as outras baixas da conta não são desta sessão.

**`scene.js`:** SHA-1 final `5b725460ae70667db764598823f7ff729eee8b99` (o mesmo informado antes da conferência; as correções desta
rodada foram só no meta). Cópia anterior em `test/bg/tools/scene.pre-era5.js`. Blocos opcionais novos: slot `far` em actors; `flap`
com `ang` em peças e em rotors. **Eras 0 a 4: 0 canais diferentes** entre `scene.pre-era5.js` e o novo (mesma semente, 390x692,
t = 3, 27, 48, 75 s; ~1,08 milhão de canais não nulos por comparação).

Corrigido na conferência (0 crédito): semáforo tinha ~0,5 s com tudo apagado e o amarelo quase não aparecia → degraus exatos
(verde 2,7 s → amarelo 0,6 s → vermelho 5,7 s); antena de radar não aparecia (rotor `front` só é desenhado na camada far) → passou a
ser desenhada antes do mid, acima do mastro; hélice do ar-condicionado RETIRADA pelo mesmo motivo (ficaria atrás da grade pintada;
exigiria mudar o `scene.js` depois de ele já ter sido liberado); pombos do céu passavam por trás das torres → subiram e ficaram
menores; pombo em voo era 2x o pousado → 0,056; menos pares de pilaretes (peso 2).

Conferido (cena a dpr 3, recortes ampliados; rolagem parada para os ciclos): semáforo em 12 instantes (verde → amarelo → vermelho,
sem intervalo apagado); caminhão na rua de trás em 2 instantes (roda sobre o asfalto, abaixo da guia) e sedan atrás do vidro do
ponto de ônibus; caminhão no viaduto em 2 instantes (rodas na pista); helicóptero em 2 instantes (rotor de cauda em ângulos
diferentes, rotor principal horizontal, voltado para a direita); antena em 3 instantes (larguras diferentes, apoiada na plataforma);
letreiro aceso em t = 23,5 e apagado em t = 51; cachorro em 12 instantes (senta, anda, senta virado, volta; patas na calçada);
pombo em 12 instantes (pousa em pé/bicando, voa, pousa no outro pilarete, volta); tambor em chamas; fumaça das ruínas e da cidade por
partículas; bandeira no mastro; farol da torre; 15 faixas da calçada entre t = 20 e 49 s sem objetos sobrepostos; pés no asfalto liso;
prévia `preview?era=5` abre e roda; sem erro de console.
Custo por quadro (dpr 2, 240 quadros seguidos a 30 por segundo, leitura forçada): era 1 = 27,5 ms (p90 34), era 5 = 26,4 ms (p90 33),
era 4 = 25,5 ms: equivalentes. Valor absoluto não é fps (a leitura forçada pesa igual em todas).
NÃO conferido: giro das rodas em par ampliado (as rodas-sprite estão no lugar, mas não comparei dois ângulos); jipe, táxi e ônibus de
perto; emenda do far espelhado (os 2 instantes calculados caíram atrás de prédios; nenhum defeito visto no resto); decalques perto
da faixa amarela em muitas telas (vi 4); botão "Ver ANTES"; celular.

Defeitos que o dono pode notar:
- Não há pessoas; o ar-condicionado tem a hélice parada; outdoor e cancela são parados.
- Rotor principal do helicóptero é uma barra que encolhe e estica (vista de perfil), não um disco.
- Cachorro e pombo trocam de sentido de uma vez (espelham); o pombo pousado é pequeno.
- Trânsito sempre para a direita, todos na mesma velocidade (para nunca se atravessarem); sem motorista visível.
- Letreiro pisca como painel inteiro rosa/branco, sem texto. Semáforo fica mais tempo no vermelho.
- Torre de vidro do trecho A é cortada pela borda de cima da tela. Céu é um degradê liso.

## Era 5 — rodada 2 (acabamento): INTERROMPIDA por disco cheio (256 MB livres), nada conferido
Estado seguro: `test/bg/scene.js` voltou ao SHA liberado `5b725460…`; o meta da era 5 continua o da rodada 1 (só o céu novo entrou).
Pronto e guardado, ainda NÃO ligado: `test/bg/tools/scene.era5r2.wip.js` (SHA `d5665703…`: peças em quadros, actors espelhados, rotors
que balançam e na frente do mid, virada suave em pacer/hopper) e os sprites `rotordisc`, `txtA/txtB`, `adA/adB`, `boom`, `fan`,
`walkerA/B/C` (`tools/build5b.js`). Falta: apagar a cancela pintada do midA (a gravação falhou), ligar tudo no `mkmeta5.js`,
comparar eras 0-4 pixel a pixel e conferir no navegador.

---

# Era 6 (Futurista, cidade neon à noite) — mesmo padrão das eras 4 e 5 (fps-75)

**Ver:** http://localhost:8080/test/bg/preview?era=6 · instantes lado a lado: `http://localhost:8080/test/bg/sheet?era=6&t=3,9,15,21&w=330&line=1`
**Pasta:** `assets/bg/v2/era6/` (59 arquivos, ~1,4 MB) · **contrato:** `assets/bg/v2/era6/meta.json` (mesmo formato da era 5)
**Scripts:** `test/bg/tools/build6.js`, `test/bg/tools/mkmeta6.js`, `test/bg/tools/info.era6.json`, `test/bg/tools/masks6.json`
(`node mkmeta6.js --info tools/info.era6.json <saída>` refaz o meta: conferido, sai idêntico). Em `test/bg/preview.html` mudou só a dica de URL (cita `6`).
**Créditos:** 16 (8 gerações Nano Banana 2, 2K, a 2; nenhuma regeração; céu procedural). Saldo da conta ao fechar: 295,15 (as outras baixas são das sessões de vídeo).

**`scene.js` NÃO mudou** (SHA-1 `5b725460ae70667db764598823f7ff729eee8b99`, o liberado na era 5). A era 6 sai só com dados no meta, usando blocos que já
existiam (actors sky/far/mid com parts e smoke, rotors com flap, props com tilt, fx flow/glow/plume/embers, sunRays, roadside lantern/pacer/hopper/critter/vent/sway).
Por isso as eras 0 a 5 não precisam de nova comparação pixel a pixel: o módulo e os arquivos delas não foram tocados.

## Camadas
`sky.webp` (procedural: indigo → violeta → bruma rosa, com 150 estrelas; ladrilho de 1024 px) · `far.webp` (skyline neon com via elevada de ponta a ponta;
ESPELHADO; base some na bruma) · `midA.webp` (lojinha de lámen com placa holográfica, torre de vidro com fitas rosa/ciano, eletroposto, painel holográfico em
treliça, guarita com mastro) + `midB.webp` (ponto de ônibus de vidro translúcido com 2 painéis, oficina de robôs, quiosque com tubos rosa e máquinas, subestação com
2 bobinas, torre de comunicação; versões `_lo`) · `ground.webp` (calçada de placas violeta, guia com fita ciano, pista lisa com grade fina e 2 linhas rosa em 0,828–0,846,
guia, calçada; pés em 0,78 na pista) · `decals.webp` (20: tampa com anel, escotilha, grade, 2 poças com reflexo neon, placa rachada, rachadura, chapa, parafusos,
célula de energia, cabo, lata, placa de circuito, panfleto holográfico, copo, sucata, caco de cristal, folhas, chip, marca de derrapagem).

## 26 elementos animados
céu estrelado derivando · nuvens violeta em 2 velocidades · NAVE-MÃE fixa no alto balançando com 3 fachos de luz pulsando · trânsito voador alto (ônibus,
caminhão e 2 carros, cada um na sua faixa e velocidade, com exaustão dos jatos) · pássaros-robô (6 quadros) · trem maglev e 4 carros flutuantes na via elevada ·
luzes piscando nas agulhas distantes · bruma · drone de entrega com 2 hélices batendo · trânsito voador atrás dos prédios (5 veículos, aparecem nos vãos) ·
antena parabólica girando na plataforma da guarita · braço robótico balançando no telhado da oficina · neon da placa respirando, pulso de luz descendo nas fitas
da torre, fita do eletroposto e tubos do quiosque piscando · holograma com linhas de varredura · painéis do ponto pulsando · bobinas pulsando + 3 arcos elétricos
em clarão + faíscas · janelas, oficina, máquinas e luzes das torres · vapor com contorno no telhado do lámen e da oficina · postes âmbar com brilho · cão-robô
(senta, anda, volta) · pássaro-robô pulando entre 2 pilaretes de recarga · gato-robô (cauda/cabeça) · respiro de vapor em baforadas · lixeira-robô e palmeira
balançando · partículas de luz · samambaia e capim alienígenas na frente · poeira dos passos.

## Como foi feito
1. far · 2. mid A · 3. chão · 4. folha de bichos/céu (nuvens, planeta, lua, pássaro-robô em 7 poses, cão-robô 4 passos + sentado, antena, gato-robô) · 5. folha de
veículos (trem, nave-mãe, 4 carros flutuantes, ônibus, caminhão, drone + hélice) · 6. folha de objetos de rua/primeiro plano · 7. mid B (ref. mid A) · 8. decalques (ref. chão).
Referências: o mid A aprovado da era 5 (estilo) + `assets/map/era6.jpg` (tema e cores). **Fundo VERDE #00FF00** em vez de magenta (a arte é rosa/roxo neon):
`build6.js` tem `keyGreen`/`safeKey` próprios. Neon piscando sem pintar nada à mão: as máscaras de `flow` são os próprios pixels de neon da arte (rosa ou ciano vivo)
recortados por retângulo (`masks6.json`).
Armadilhas: vidro do ponto veio verde opaco (recolorido para vidro azulado translúcido, sem tocar os 2 painéis); placas da calçada têm juntas inclinadas
(perspectiva): o ladrilho do chão é um período exato (1825 px) com a emenda escolhida no meio de uma placa e fusão de 70 px; a pista foi remapeada na vertical para
as linhas rosa caírem como a faixa amarela da era 5; a fusão de componentes juntava poste + samambaia e pássaro em pé + bicando (dilatação menor / divisão por coluna vazia).
Flâmulas e anel holográfico da folha 1 vieram vazados (verde por dentro): não usados. Moto da folha de veículos não usada.

## Conferido no Chrome (aba única, fechada no fim)
`sheet` em t = 3 · 9 · 15 · 21 (com `line=1`) · 27 · 34 · 41 · 48 e pares 41/41,3 (antena), 48/48,4 (braço), 22,6/22,75 (bobinas); `preview?era=6` rodando
(1º quadro 96 ms, completo 863 ms com `nocache`, 33 fps na aba de automação); sem erro de console.
- Pés na pista, sombra na linha de 0,78; linhas rosa abaixo dos pés; decalques sem sobreposição.
- Trem e carros com a base no tabuleiro da via elevada; carros do alto passam atrás da skyline; veículos de trás aparecem nos vãos e somem atrás dos prédios.
- Emenda do chão conferida em recorte (`seam_ground`): sem junta dupla.
- **Custo por quadro** (dpr 2, desenho + leitura de 1 pixel, quadros em salto, rodadas alternadas, máquina muito carregada): mediana era 1 = 71,6 ms, era 4 = 71,7,
  era 5 = 56,3, **era 6 = 64,5** (p90 98). Primeira versão dava ~127 ms: tirei o neon ciano da torre (máscara grande), encurtei os fachos da nave e deixei a
  exaustão só nos veículos do alto. Valor absoluto não é fps.
NÃO conferido: emenda do far espelhado em instante calculado; giro da antena em zoom de 3 instantes; ida/volta completa do cão e do pássaro-robô com a rolagem
parada; botão "Ver ANTES"; celular.

## Defeitos que o dono pode notar
- Nave-mãe e planeta ficam PARADOS no alto (só balançam ~3 px); os fachos pulsam mas não se mexem. Os jatos da nave são pintados.
- Carros têm "rodas" brilhantes (são os pés do jato) e os jatos são pintados; a exaustão por código é discreta. Táxi e viatura trazem a palavra TAXI / POLICE.
- Todos os veículos andam para a direita (o módulo não espelha actors); na via elevada todos têm a mesma velocidade.
- Arcos elétricos são 3 ziguezagues fixos que piscam; o braço robótico só balança (não pega nada).
- Restou uma borda esverdeada fina à esquerda do painel esquerdo do ponto de ônibus; a treliça do painel holográfico tem uns fios esverdeados.
- Pássaros-robô do céu passam na frente da nave-mãe. Herói ainda com a roupa da era 2.

## Era 6 — prévia animada para o voto do dono
`assets/bg/v2/era6/preview_sheet.png` (faixa de 12 quadros de 234x415, 8 fps, t = 12 a 13,4 s, 312 KB, PNG com paleta) + `preview_sheet.json` ({frames, fps, w, h}).
Gerada no navegador com o próprio `scene.js` (cena 390x692 a dpr 1, reduzida) e gravada por um receptor local temporário (fora do projeto).

---

# Era 7 (Submundo) — mesmo padrão das eras 4 a 6 (fps-75)

**Ver:** http://localhost:8080/test/bg/preview?era=7 · instantes lado a lado: `http://localhost:8080/test/bg/sheet?era=7&t=3,9,15,21&w=330&line=1`
**Pasta:** `assets/bg/v2/era7/` (54 arquivos, ~1,5 MB + prévia de 0,37 MB) · **contrato:** `assets/bg/v2/era7/meta.json`
**Prévia animada para o voto:** `assets/bg/v2/era7/preview_sheet.png` (12 quadros de 234x415, 8 fps, 376 KB) + `preview_sheet.json`.
**Scripts:** `test/bg/tools/build7.js`, `mkmeta7.js`, `info.era7.json`, `masks7.json`, `cut7.json`, `bands7.json` (`node mkmeta7.js --info tools/info.era7.json <saída>`: idêntico).
**Créditos:** 10 pedidos Nano Banana 2 2K (8 da era + 2 regerações): 18 a 20 créditos (1 pedido falhou no servidor; não consegui confirmar se foi cobrado). Saldo ao fechar: 291,15.
Regerações: o mid A veio com fundo BRANCO (inutilizável) e a folha de criaturas voadoras falhou; as duas foram refeitas.

**`scene.js` NÃO mudou** (SHA-1 `5b725460…`). Só dados no meta.

## Camadas
`sky.webp` (procedural: carmim → vermelho → brasa no horizonte) · `far.webp` (montanhas e agulhas de obsidiana, cidadela demoníaca, 2 cascatas de lava, RIO DE LAVA de
ponta a ponta; recortado na horizontal onde o rio é contínuo; ESPELHADO) · `midA.webp` (portal gótico com grade, pedestal com braseiro, caveira de rocha com olhos e
mandíbula de lava, árvore morta, torre com janelas acesas) + `midB.webp` (cristais de obsidiana, forja de diabretes com bigorna, trono de ossos, forca, pilar quebrado
com cascata de lava) · `ground.webp` (rocha com rachaduras de lava, mureta, lajes hexagonais com juntas de lava em 0,71–0,907, mureta, rocha; pés em 0,78) ·
`decals.webp` (20: caveira com chifre, ossos cruzados, costelas, poça e rachadura de lava, cinza, brasas, corrente, espada, elmo, runa roxa, cristal, mancha
queimada, laje rachada, pedrinhas, arranhões, escudo, moedas, lasca de osso, graveto).

## 28 elementos animados
céu derivando · nuvens de cinza em 2 velocidades · lua de sangue fixa · SERPE cruzando o céu batendo 2 asas · gárgula e corvo voando · 2 bandos de morcegos ·
lava descendo nas cascatas · rio de lava brilhando com borbulhas · barco do barqueiro navegando no rio (proa de caveira, para a esquerda) · bruma vermelha ·
fantasma e espírito de fogo (com rastro de fagulhas) flutuando atrás das estruturas · gaiola balançando na forca · fogo roxo no braseiro + fagulhas · olhos da
caveira pulsando e lava escorrendo da mandíbula · janelas da torre · brilho roxo nos cristais · boca da forja, faíscas na bigorna e fumaça com contorno na chaminé ·
lava descendo no pilar com brasas e vapor · braseiros da estrada (3 chamas ROXAS em quadros) · estaca com caveira e lanterna · diabrete (senta, anda, volta) ·
morcego pulando entre 2 colunas quebradas · gato preto · caldeirão com vapor roxo, respiro de fumaça e bacia de lava borbulhando · espinheiro balançando ·
brasas subindo · primeiro plano balançando · poeira dos passos.

## Como foi feito
Referências: mid A da era 5 (estilo) + `assets/map/era7.jpg`; mid B, decalques e a folha de voadores com referência das próprias gerações. Fundo verde.
Asa da serpe: gerada separada do corpo; o sprite ganhou a metade de baixo vazia para o centro cair no ombro, e o `flap` (cosseno) faz a asa bater em torno dele.
A folha de objetos veio com BORDA BRANCA de adesivo em volta de cada peça: `unsticker` apaga por preenchimento a partir do fundo só pixels quase brancos e neutros
(os ossos, creme, ficam). A gaiola é recortada da arte (só pixels escuros dentro do retângulo) e balança presa ao gancho da trave. Lava, olhos, janelas, forja e
cristais piscam com máscaras tiradas dos próprios pixels da arte (`masks7.json`).

## Conferido no Chrome (aba única, fechada no fim)
`sheet` em t = 3 · 9 · 15 · 21 (com `line=1`), 3/3,3/6/30/33,5 e uma vista sem o plano médio em t = 2 · 4 · 8 para ver o barco (casco na superfície do rio,
andando para a esquerda) e a serpe (asas batendo). Sem erro de console.
- Pés nas lajes, sombra na linha de 0,78; decalques sem sobreposição; objetos da beira apoiados na rocha de trás.
- **Custo por quadro** (dpr 2, mesmo método da era 6, máquina carregada): mediana era 1 = 73,6 ms, era 5 = 71,0, era 6 = 75,4, **era 7 = 68,6**: equivalente.
NÃO conferido: `preview?era=7` interativo (o botão "Ver ANTES" deve dar erro: não existe `assets/bg/era7.png`, só `era7_ref.png`); emenda do far espelhado;
emenda do chão só pelo recorte `seam_ground`; ciclo completo do diabrete e do morcego; celular.

## Defeitos que o dono pode notar
- A serpe e o fantasma passam boa parte do tempo escondidos atrás das estruturas grandes (caveira, cristais, trono).
- Asa da serpe "vira" para baixo do ombro no meio do ciclo (é o achatamento em cosseno, não um desenho de asa abaixada).
- Chamas dos braseiros da estrada são roxas, mas o brilho em volta é laranja (cor fixa no módulo para fogo).
- Cascatas e rio são brilho correndo sobre a arte parada (como nas eras 0 e 1); o barco não deixa rastro na lava.
- A estrutura grande da caveira, o trono e a árvore são parados; a lua de sangue fica parada no alto.
- Conferido em recorte: o lugar de onde a gaiola saiu no mid B ficou limpo (sem resto).
- Herói ainda com a roupa da era 2.

---

## Era 5 — rodada 2 (acabamento): concluída por fps-75 (0 crédito)

**`scene.js` mudou** (blocos opcionais que já estavam prontos em `tools/scene.era5r2.wip.js`): peças `strip` (peça em quadros, sem girar), actors `flip`
(corpo e peças espelhados), rotors `swing` (balança entre ang ± swing, para nas pontas com `hold`) e rotors `front` também depois do mid, pacer/hopper com `turn`
(vira achatando em cosseno). SHA-1 `5b725460…` → **`d566570331e4e27cd0af92408e33edb6fb2fe60d`**; cópia anterior em `test/bg/tools/scene.pre-era5r2.js`.
**ATENÇÃO, engenheiro:** subir o `?v=` do `scene.js` no jogo (com o módulo antigo a era 5 nova abre sem cancela, hélice, disco do rotor e pedestres virando).

**Prova (eras 0, 1, 2, 3, 4, 6 e 7):** módulo anterior (`scene.pre-era5r2.js`) e novo na mesma página, mesma semente de `Math.random`, canvas 390x692 a dpr 2
(4,3 milhões de canais, ~100% não nulos) em t = 3, 27, 48 e 75 s: **0 canais diferentes nas 7 eras, nos 4 instantes**. Observação de método: cada instante é
desenhado 2 vezes antes da leitura; na primeira leitura logo depois do carregamento apareceram diferenças esparsas também entre dois desenhos do MESMO módulo
(decodificação de imagem ainda terminando), por isso a medida vale do 2º desenho.

O que entrou na era 5 (`tools/mkmeta5.js`; `tools/build5b.js boom` rodado uma vez sobre `midA.webp`):
1. Cancela pintada apagada do `midA` (9.297 px) e trocada pela haste `boom` girando no eixo do topo da caixa: sobe e desce a cada 9 s, parando nas pontas.
2. Hélice do ar-condicionado girando na frente da grade (`fan`, rotor front no mid).
3. Rotor principal do helicóptero = disco translúcido em 3 quadros (`rotordisc`, peça strip); `rotor.webp` saiu.
4. Letreiro da lanchonete alterna LANCHES / ABERTO em pontos rosa (sobre o painel que continua piscando); outdoor alterna ALISTE-SE (com estrela) / ZONA SEGURA (com seta).
5. 3 pedestres (civil de mochila, capa amarela, soldado) andando e voltando na calçada, virando no fim (pacer com turn); cachorro e pombo também viram suave.
6. Trânsito nos dois sentidos: táxi e ônibus voltando no viaduto, sedan e jipe voltando na rua de trás (actors flip, faixa um pouco mais alta e desenhada antes).
Prévia animada para o voto: `assets/bg/v2/era5/preview_sheet.png` (12 quadros 234x415, 8 fps, 319 KB) + `preview_sheet.json`.

Conferido no Chrome (aba única, fechada): `sheet` t = 3 · 9 · 15 · 21; cancela em 3 voltas do cenário (t = 9 / 39,32 / 69,64: subida, abaixada, levantada);
letreiro com LANCHES legível (o texto branco da 1ª tentativa sumia no painel claro: virou rosa); outdoor com ZONA SEGURA; pedestre de capa andando; disco do
rotor e hélice do ar-condicionado em t = 56 / 56,03; sem erro de console. Custo por quadro (dpr 2, mesmo método): era 1 = 43,9 ms, era 4 = 48,3, era 5 = 44,1.
NÃO conferido: o cartaz ALISTE-SE em tela (os 3 instantes caíram em ZONA SEGURA); a virada dos pedestres em sequência; carros espelhados de perto; "Ver ANTES".
Defeitos que ficaram: pedestres são vetoriais (traço mais simples que a arte); sobram 2 tracinhos escuros da cancela antiga junto ao eixo (ficam sob a haste);
texto do letreiro e do outdoor é em pontos (fonte 5x7), não pintado à mão.

**Nota para o commit:** o `.gitignore` do projeto ignora `*.png` e `*.webp`; das pastas `assets/bg/v2/eraN/` só o `meta.json` está no git. As imagens das
eras 5 (midA, midA_lo, boom etc.), 6 e 7 e as prévias precisam de `git add -f` (ou seguem pelo caminho que o time já usa para essas imagens).
