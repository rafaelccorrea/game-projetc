# Manual: PET com evolução em 3 estágios (básico → médio → evoluído), passo a passo

Antes: `docs/arte/VALIDACAO_COMUM.md` (§1: copiar a pasta `C:\Users\rafae\AppData\Local\Temp\tools`, ÚNICA cópia, fora do repositório), `docs/FLUXO_ARTE.md` §5 (Pet), custo em `docs/arte/CUSTO_POR_ITEM.md` (~50 sem refação / 60 com; pet sem golpes 2-3: ~42; grátis: 4-5 dias de Kling).

## Regras
- **Sempre evolução** (regra do dono): 3 estágios, o mesmo bicho, cada um maior e mais forte, reconhecível. Visual **maduro** (público mais velho), não infantil.
- Médio e evoluído saem **do guia do estágio anterior** (edição), nunca do zero.
- Pet **sempre na frente do herói**, **pés no chão**; voador na altura do módulo (o jogo sobe por código, `fly` na tabela do Sys.pet).
- **Aura por código** (nada no básico, leve no médio, forte no evoluído: f636e23; desenho em `js/petfx.js` drawPetAura). **Efeito de evolução por código** (`evolve.js`, fx `evolve_0_1`, `evolve_1_2`). **Golpe próprio por código** (petHitFx, ff6396b). Nada disso se gera.
- Nada flutua: faísca, brilho, poeira soltos reprovam.

## O que sai
`assets/anim/pets/` (chave ex.: `era0_mammoth`, `pet_panther`):
| estágio | folhas | quadros |
|---|---|---|
| básico | `<chave>_idle`, `<chave>_run`, `<chave>_atk1` (+ `_atk2`, `_atk3` só nos pets antigos, se a tela mostrar) | idle 12, run 8, atk 12 |
| médio | `<chave>_mid_idle`, `_mid_run`, `_mid_atk1` | 12 / 8 / 12 |
| evoluído | `<chave>_evo_idle`, `_evo_run`, `_evo_atk1` | 12 / 8 / 12 |
Célula **512×352** (pad L96 R160 T64 B32), corpo dentro da caixa x 96..352, y 64..320, **pés em y=307**, 12 fps. A batalha toca só `atk1`.
Imagens paradas: `assets/pets/<chave>_ref.png`, `_mid.png`, `_evo.png`: 512×512, transparente, olhando para a direita, **pés em y=485** (0,95 da altura). Usadas em miniatura, ovo, evolução, Códex.

---

## Passos

### Passo 0. G0 (custo 0)
Item aberto? Já existe em `assets/anim/pets/`, `assets/pets/`, `tools/petvid/queue.txt`, `jobs2.txt`, `tools/newpets/RESUME.txt`? Plano de custo aprovado pelo PO.

### Passo 1. Guia do básico (G1)
**Grátis:** AI Studio "Nano Banana 2 Lite", 1K; tirar a ✦ com `node dewm.js <in> <out> C:/Users/rafae/AppData/Local/Temp/tools`.
**Higgsfield:** `nano_banana_pro`, 1:1, `"1k"`, referência de estilo = um pet aprovado (ex.: `assets/pets/era2_dragon_ref.png`) e o conceito aprovado. ~2.
Prompt:
```
Game creature for a chibi mobile RPG: <descrição do bicho>, young but fierce, mature stylised design (not babyish), whole body visible,
strict side view facing right, standing on all its feet on the ground line near the bottom of the frame, same painted style and outline as image 1.
Flat pure green background (#00FF00), no ground shadow, no text. Nothing floating, no glow, no sparks, no particles, no aura, no visual effects.
No magenta or pink. No green on the creature.
```
Gate: `node C:/Users/rafae/Desktop/fps/docs/guidekit/checkguide.js <guia>` (só "quase sem magenta" é esperado: pet não tem bastão); olho: corpo inteiro, de perfil para a direita, pés no chão, nada solto, sem verde no bicho.

### Passo 2. Guias do médio e do evoluído (G1)
Entrada: guia aprovado do estágio anterior (image 1). Mesmo modelo/custo do passo 1.
```
Edit image 1: the SAME creature evolved to its <middle|final> stage: bigger, stronger, <armadura/chifres/detalhe da evolução>, same species,
same colours and markings so it is clearly the same animal. Same strict side view facing right, same ground line, whole body visible,
same framing. Flat pure green background (#00FF00), no ground shadow, no text. Nothing floating, no glow, no aura, no effects. No magenta or pink.
```
Gate: os 3 lado a lado (`node newpets/cs.js <saida.png> 512 <base> <mid> <evo>`): reconhecível, crescendo.

### Passo 3. Versão encolhida para o golpe (custo 0)
O bote sai do quadro se o bicho ocupar tudo. Para cada estágio: `node newpets/pad.js <guia.png> <guia_pad.png> 0.72` (encolhe para 72%, embaixo-centro, preenche de verde). Essa é a imagem inicial do `atk1`.

### Passo 4. Vídeos por estágio (G2)
| vídeo | imagem inicial | grátis (Kling) | Higgsfield |
|---|---|---|---|
| idle (laço) | guia | 2.5 Turbo, início = fim = guia, 5 s (25) | `seedance_2_0` fast 480p 4 s 1:1, start = end = guia (~4) |
| run (laço) | guia | 2.5 Turbo (25) | idem |
| atk1 (sem laço) | guia encolhida | 4.0 Flash 720p 3 s, só início (18) | idem, start = end = guia encolhida |
Parâmetros do Higgsfield para pets: os jobs de 12/11 estão só como ids (`tools/petvid/jobs2.txt`); **modelo e parâmetros exatos usados nos pets: a confirmar** (assumir os mesmos do herói e confirmar no 1º job).
Prompts:
```
[idle] Seamless slow idle loop: the <bicho> stands in place breathing, small slow head movements, head stays in side profile facing right,
tail sways gently, feet stay planted on the ground. Ends in exactly the starting pose. Locked camera, no zoom, flat green background unchanged.
No motion blur, no speed lines, no trails, no glow, no sparks, no particles, nothing floating, no visual effects.
[run] Seamless looping run in place: the <bicho> runs in place with a full steady leg cycle, feet touching the ground at each stride, body bobs,
head forward, side view facing right, stays in the same spot. Ends in exactly the starting pose. (mesmas proibições)
[atk1] The <bicho> crouches, then lunges forward to the right with a strong <mordida/garra/investida>, then returns to exactly the starting pose.
Feet back on the ground at the end, whole body stays inside the frame. (mesmas proibições)
```
Voador: no idle/run "hovers / flaps its wings in place at the same height" (o jogo põe a altura).
Marca do Kling: `"$FF" -y -i in.mp4 -vf "drawbox=x=730:y=880:w=230:h=80:color=0x00FF00:t=fill" -an limpo.mp4`.
Anotar cada job NA HORA (`tools/petvid/jobs2.txt` ou `LEIA_gratis.txt`).

### Passo 5. Folhas (G3)
De `C:\Users\rafae\AppData\Local\Temp\tools`, um vídeo por vez (backup antes):
```
node petset.js <chave>            idle <url> [fly]
node petset.js <chave>            run  <url> [fly]
node petset.js <chave>            atk1 <url> [fly]
node petset.js <chave>_mid        idle|run|atk1 <url> [fly]
node petset.js <chave>_evo        idle|run|atk1 <url> [fly]
```
(`petset_free.js` = igual, aceita mp4 local e recorta `crop=ih:ih`; `CROP=` muda o corte.) Faz: 24 fps → `enemykey.js` (verde) → `loopsheet.js` com o enquadramento dos inimigos (`assets/anim/rig/src/enemy/xf_sprite.json`), pad 96/160/64/32, pés por quadro (`FEET=1`; voador `fly` mantém a altura do vídeo), golpe por trecho (`SEG=1`).
Depois, por folha:
1. Golpe feito da guia encolhida: `node newpets/fitatk.js <pasta>/<chave>_idle <pasta>/<chave>_atk1` (bases sem extensão, caminho completo; reescala o atk1 ao tamanho do idle pelos pés; imprime `edgepx` = px encostados na borda direita: tem de ser 0 ou quase).
2. Franja verde, pedaços soltos, borda: `node newpets/despill.js <base> [fade=40] [xBorda]`.
3. Bicho virado para a esquerda no vídeo: `node newpets/mirror.js <base>`.
4. Resto de fundo/cinza solto: `node petclean.js <png> <json> <quadros csv> 307`; projétil inventado à esquerda: `node stray.js <png> <json>`.
5. Altura entre estágios: `node hcheck.js <chave> <chave>_mid <chave>_evo` (altura por quadro de run/idle/atk1): médio > básico, evoluído > médio, e o mesmo estágio igual nas 3 folhas.

### Passo 6. Imagens paradas dos 3 estágios (custo 0)
A partir do quadro 0 do idle de cada estágio (como em 73ea4f2): recortar a célula 0, tirar o transparente em volta, escalar e pôr em 512×512 com os pés em y=485, olhando para a direita. **Não há ferramenta salva para isso (a confirmar)**; fazer com `sharp` numa linha e conferir contra `assets/pets/era0_mammoth_ref.png` (mesmo tamanho de bicho e mesma linha dos pés). Ovo: `assets/pets/pet_egg.png` (existente).

### Passo 7. Validação e conferência (abaixo), commit, matriz, QA.
Ligar no código é do Engenheiro: `PT_ART` e `PT_ORDER` (js/p_pets.js) e a tabela do Sys.pet (Falcão, Pantera e Lobo ficaram fora da tela de Pets por isso).

---

## VALIDAÇÃO E QUALIDADE
`artcheck.js` em `VALIDACAO_COMUM.md` §4. Rodar cada linha nas 9 folhas (3 estágios × 3 estados) + atk2/atk3 se existirem.

| Critério | Tolerância | Como provar |
|---|---|---|
| Laço sem salto (idle, run) | razão ≤ 1,5 | `node artcheck.js loop <chave>_idle.png <chave>_idle.json 1.5` |
| Pés no chão | ponto mais baixo = 307 ± 4 px; voador: não afunda | `node test/sys/stagekit.test.js` (todas as `_idle` de pets) e `node newpets/sheetcs.js` (linha vermelha nos pés) |
| Mão no grip | não se aplica (pet não segura arma) | — |
| Corpo na caixa / sem corte na borda | corpo dentro de x 96..352, y 64..320; `edgepx` = 0 | `fitatk.js` (imprime `edgepx`); olho no `sheetcs` |
| Escala igual entre irmãos | mesmo estágio: altura igual em idle/run/atk1 ±5%; estágio seguinte maior | `node hcheck.js <chave> <chave>_mid <chave>_evo` |
| Sem borrão e sem fantasma | semitransparente interno ≤ 30 px/quadro | `node artcheck.js px <png> <json>` |
| Sem cor fora da paleta | ≤ 0,5% (a calibrar) contra a guia do estágio | `node artcheck.js pal <png> <guia_do_estágio.png> 0.5` |
| Contorno sem franja verde | verde ≤ 20 px/quadro | `node artcheck.js px` (conserto: `despill.js`) |
| Nada flutua | 0 pedaço solto | `artcheck px` + olho; conserto `despill.js` (solta < 40 px), `petclean.js`, `stray.js` |
| Virado para a direita em todo quadro | 100% | olho no `sheetcs`; conserto `mirror.js` |
| Visual maduro, nada sensual | — | olho no G1 e voto do dono |
| Sem asa desenhada em skin | não se aplica | — |
| Grade/CSS | 0 falha | `node test/paineis/sheetcss.test.js` (tela de Pets lê por CSS: PT_SH) e `node test/e2e/sheetgrid.js` |

**Folha de conferência:** `node newpets/sheetcs.js C:/Users/rafae/Desktop/fps/assets/anim/pets/_conferencia_<chave>.png <pasta>/<chave>_idle <pasta>/<chave>_run <pasta>/<chave>_atk1 <pasta>/<chave>_mid_idle ... <pasta>/<chave>_evo_atk1` (bases sem extensão, caminho completo) + `node newpets/cs.js <saida.png> 512 assets/pets/<chave>_ref.png _mid.png _evo.png` (os 3 estágios parados).

**Reprova na hora:** estágio que não parece o mesmo bicho; estágio maior menor que o anterior; corte na borda no bote; pé no ar ou afundado; faísca/poeira solta; bicho virado; verde no contorno; aura ou efeito desenhado na folha (é código).

**G5:** mandar ao QA: `Pet <nome> · <hash> · assets/anim/pets/<chave>_* + assets/pets/<chave>_{ref,mid,evo} · 3 estágios, parado/correr/golpe; telas Pets, Batalha, Derrota, Perfil, Arena, Ovo (dbgHatchAt); &petaura=0 e &petfx=0`. Roteiro: `docs/qa/VALIDAR_ARTE.md` §4.2.
