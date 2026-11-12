# Prova de animação de corrida (era 2) — relatório

## Resultado em uma linha
**Vídeo para quadros (Método 2) venceu com folga.** 4 créditos e ~6 min por personagem, loop limpo, 8 quadros de 256x256. Os três ciclos estão em `assets/anim/` e a comparação em `http://localhost:8080/test/anim/preview.html`.

## Entregas
- `assets/anim/era2_hero_t0_run.png` (134 KB), `era2_e0_run.png` (130 KB), `era2_e1_run.png` (141 KB): folhas horizontais 2048x256, 8 quadros, PNG com paleta de 256 cores, transparente.
- `assets/anim/meta.json`: 8 quadros, 12 fps, 256x256 para os três.
- `test/anim/preview.html`: 390 px, cenário `bg/era2.png` rolando, ciclo novo em cima e sprite parado atual (com o quique) embaixo, tira de quadros, botões pausar / quadro +1 / fps. Parâmetros: `?f=N` congela, `?line=1` mostra a linha do chão, `?noscroll=1`.
- Nada fora de `assets/anim/**`, `test/anim/**` e deste relatório foi tocado. A pasta `assets/anim/rig/` não é minha (outro agente).

## Os dois métodos no Kael
| | Método 1: folha por imagem | Método 2: vídeo para quadros |
|---|---|---|
| Modelo | nano_banana_pro 2k 16:9, sprite como referência | seedance_2_0, modo fast, 480p (sai 640x640), 4 s, sem áudio, sprite como quadro inicial E final |
| Custo | 2 créditos | 4 créditos |
| Tempo de geração | ~1 min | ~3,5 a 5 min |
| Identidade | boa (rosto, roupa, cachecol) | boa |
| Movimento | **ruim**: as 8 poses não formam um ciclo; a linha de baixo quase repete a de cima, pernas não alternam em ordem, tamanho do corpo varia ~7% entre células, cachecol salta de forma | **bom**: 97 quadros contínuos a 24 fps, período exato de 16 quadros, pernas, braços e cachecol em movimento coerente |
| Alinhamento | precisa de heurística (centro da cabeça, pés) e ainda treme | nenhum: câmera fixa, basta o mesmo recorte em todos os quadros |

O Método 1 foi descartado: mesmo alinhado, o resultado pisca em vez de correr. Só serviria com retoque manual quadro a quadro.

## Como o Método 2 foi feito (reproduzível)
1. Sprite 512 colado em 1024x1024 de cor lisa, ampliado 1,5x, com folga para pernas e cachecol. **Verde #00FF00 para Kael e Esqueleto; magenta #FF00FF para o Goblin** (ele é verde, o chroma verde o apagaria).
2. Vídeo com a mesma imagem como início e fim, prompt de corrida no lugar, câmera travada, fundo liso.
3. ffmpeg extrai os quadros; chroma-key global com remoção de vazamento de cor; mantém só o maior componente sólido (apaga a poeira que o modelo insiste em desenhar).
4. Recorte fixo que corresponde exatamente ao quadro do sprite original, reduzido para 256. Por isso escala e posição batem com o sprite parado sem ajuste.
5. Busca automática do loop (distância entre quadros) e amostragem de 8 quadros; deslocamento vertical único para o pé mais baixo cair em y=243 (95%).

Scripts em `C:\Users\rafae\AppData\Local\Temp\tools\anim.js` e `prep.js`. Vídeos e quadros brutos já foram apagados.

## Qualidade honesta de cada ciclo
Conferido nas tiras de quadros e no Chrome (prints nos quadros 7 e 0 da emenda). A diferença na emenda do loop é igual ou menor que entre quadros vizinhos nos três, então não há tranco.

- **Kael: bom, usável.** Corrida de verdade, pernas alternam, braços balançam, cachecol ondula. Pés entre y=239 e 243. Defeitos: a cabeça foi redesenhada pelo modelo, não é pixel a pixel a do original (topo do cabelo oscila entre y=19 e 24 contra 23 do original; traço um pouco mais mole); o braço de trás balança pouco; o loop usa um passo (16 quadros de vídeo), então perna da frente e de trás são indistinguíveis.
- **Esqueleto: bom, usável.** Ciclo completo de dois passos, espada sobe e desce, escudo acompanha. Crânio, olhos, espada e escudo fiéis. Defeitos: pernas pequenas atrás do escudo, a passada lê menos; variação entre quadros maior (8 quadros tirados de 31), fica levemente "seco" a 12 fps.
- **Goblin: regular.** É uma **caminhada apressada, não corrida**: o modelo gerou passo curto e eu acelerei 1,5x na amostragem. A camisa foi redesenhada (mais escura, textura rabiscada, remendos diferentes do original), e sobrou uma manchinha marrom de poeira junto ao pé no último quadro. Precisa de uma segunda geração com prompt mais forte antes de ir para o jogo.

Em todos: contorno ligeiramente mais suave que o sprite original (vídeo em 640 px comprimido). A 115 px de altura no jogo não se nota; em tela cheia sim.

## Custo real
- Saldo Higgsfield: 629,65 no início, 611,65 no fim (queda de 18). **Meus jobs somam 14 créditos** (1 imagem de 2 + 3 vídeos de 4); os 4 restantes não são meus, havia outro agente gerando ao mesmo tempo. Teto de 80 respeitado.
- Por personagem, método vencedor: **4 créditos, ~4 min de geração + ~2 min de processamento e conferência**. Nenhuma regeração foi feita nesta prova; 1 de 3 (Goblin) mereceria uma.

## Estimativa para o jogo todo (42 personagens: 21 visuais do herói + 21 inimigos)
Premissas: 4 créditos por clipe; taxa de regeração de 30 a 50% (1 em 3 nesta prova); "dano" não precisa de geração (2 quadros: recuo + clarão, feito no código ou tirado do clipe de ataque).

| Animação | Geração | Observação |
|---|---|---|
| Corrida | 4 cr | provado |
| Parado (respirar) | 4 cr | fácil, movimento pequeno, início = fim |
| Ataque | 4 cr | não provado; não é loop, precisa voltar à pose inicial |
| Dano | 0 cr | procedural |
| Morte | 4 cr | não provado; sem quadro final fixo, risco maior de deformar |

- Base: 42 x 16 = **672 créditos**. Com regerações: **900 a 1.000 créditos**. O saldo atual (611) **não cobre o jogo todo**; cobre corrida + parado de todos (336 + folga) ou o conjunto completo só do herói e dos inimigos comuns.
- Tempo: ~170 a 250 clipes, 2 por vez, ~5 min cada = 7 a 10 h de geração, mais ~5 min de conferência por clipe. Realista: 3 a 4 dias de trabalho de um agente.
- Peso: ~135 KB por folha; 42 x 4 folhas = ~23 MB. Dá para cair para ~12 MB com 6 quadros ou 192 px.

Riscos que a prova não cobriu:
1. **Arma do herói.** Hoje a arma é desenhada à parte na âncora da mão (`hero/anchors.json`). Com quadros, a mão muda de lugar a cada quadro: ou se mede uma âncora por quadro (dá para semi-automatizar, mas é frágil), ou se gera o herói já com a arma, o que multiplica os visuais. É o maior ponto em aberto.
2. Chefes e tiers T2 com aura, asas e brilho: partículas e translúcidos não sobrevivem bem ao chroma-key.
3. Personagens verdes ou magenta exigem escolher a cor de fundo caso a caso.
4. Ataque e morte podem sair bem piores que corrida; testar em 2 personagens antes de escalar.

## Alternativa: recortes com ossos
Cortar cada sprite em peças (cabeça, tronco, 2 braços, 2 pernas, cachecol/arma) e animar por rotação no código.

| | Vídeo para quadros | Recortes com ossos |
|---|---|---|
| Créditos | 900 a 1.000 | 100 a 250 (1 ou 2 imagens por personagem para separar peças e preencher o que fica escondido) |
| Trabalho | baixo e repetitivo por clipe | alto no começo: marcar juntas em 42 personagens e escrever o animador; depois as 5 animações saem de graça para todos os humanoides |
| Fidelidade | rosto e roupa redesenhados de leve | cabeça e cores 100% idênticas ao original |
| Naturalidade | alta (dobras, cachecol, peso) | média: aspecto de boneco de papel, juntas aparecem, cachecol precisa de malha ou vários segmentos |
| Arma do herói | problema (item 1 acima) | resolvido: a mão é um osso |
| Peso | ~23 MB | quase zero além dos sprites em peças |
| Mexe no jogo | pouco: trocar imagem por quadro | bastante: sistema de ossos novo no canvas |
| Risco | custo e inconsistência entre clipes | esforço de engenharia; inimigos não humanoides precisam de rig próprio |

## Recomendação
Seguir com vídeo para quadros para **corrida e parado** dos 42 (cerca de 450 créditos com regerações, cabe no saldo), porque é onde o dono reclamou e onde o método já provou. Antes de gastar com ataque e morte, fazer uma segunda prova pequena (Kael e Esqueleto, ~16 créditos) e decidir a questão da arma do herói. Se a arma separada for inegociável, o herói vai melhor de ossos e os inimigos de quadros.
