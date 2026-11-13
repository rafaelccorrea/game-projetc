# Manual: ASA (item), passo a passo

Antes: `docs/arte/VALIDACAO_COMUM.md` (§1: copiar `C:\Users\rafae\AppData\Local\Temp\tools`, ÚNICA cópia das ferramentas, fora do repositório), `docs/FLUXO_ARTE.md` §5 (Asa), custo em `docs/arte/CUSTO_POR_ITEM.md` (~2, até 6 com refação; grátis 0).

## Regras
- Asa é **item separado**: **nunca desenhada em skin** (Kael Anjo antigo tinha asa no corpo; vale a pasta `kael_angel_nowing`).
- Gera-se **uma imagem parada**: o par de asas sozinho, simétrico. **Batida, posição nas costas e morte são código**: `drawWingsAt` (js/stage.js:241) gira a metade L e a R pela raiz, na âncora `back` de cada quadro (a pé, montado, morte).
- **Sempre evolução** (regra do dono): mais asas e versões; e o dono vota no visual novo antes de ligar.
- Ligar é do Engenheiro: `wingsApproved` em js/sys/stats.js:61 (+ `wingTypes`). Fora da lista = desligada (ex.: Serafim).

## O que sai
`assets/anim/equip/wing_<nome>_L.png`, `wing_<nome>_R.png` (cada metade com lado maior ≤ 512) e `wing_<nome>.json`:
```
{ "cut": <coluna do corte>, "L": { "root": [fx, fy], "w": .., "h": .. }, "R": { "root": [fx, fy], "w": .., "h": .. }, "fit": 0.93 }
```
`root` = ponto do lado de dentro que prende nas costas, em fração da metade. `fit` existe nos .json atuais (ex.: `wing_bone.json` = 0.93) mas **não é gravado pelo `wings_local.js`: como foi medido, a confirmar** (copiar o de uma asa irmã de tamanho parecido e conferir na prévia). Referência para voto: `assets/anim/equip/new/wing_<nome>_ref.png` (+ `_ref_prev.png`). Ícone: `assets/icons/wings/<nome>.png`.

---

## Passos

### Passo 0. G0 (custo 0)
Item aberto? Já existe referência em `assets/anim/equip/new/`? Plano.

### Passo 1. Referência (G1)
**Grátis:** AI Studio Nano Banana 2 Lite 1K (+ `node dewm.js <in> <out> C:/Users/rafae/AppData/Local/Temp/tools`). **Higgsfield:** `nano_banana_pro` 1:1 `"1k"` (~2), referência de estilo = uma asa aprovada (`assets/anim/equip/new/wing_phoenix_ref.png`).
```
A pair of <tipo> wings for a chibi mobile RPG character, seen from the back, perfectly symmetrical left and right, spread open,
with a clear empty vertical gap in the middle where they attach to the back, the inner roots of both wings at the same height.
Same painted style and bold outline as image 1. Flat pure green background (#00FF00), no character, no body, no shadow, no text.
Nothing floating: no loose feathers, no sparks, no particles, no glow detached from the wings. No green on the wings. No magenta or pink.
```
Gate G1: simétrica, vão no meio (o corte acha a coluna mais vazia entre 35% e 65% da largura), raízes na mesma altura, nada solto.

### Passo 2. Recorte L/R com raiz (custo 0)
De `C:\Users\rafae\AppData\Local\Temp\tools`, backup antes:
- `node wings_local.js <nome> <url|arquivo.png>` → grava em `assets/anim/equip/` (`key.js` tira o verde, corta no vão, mede a raiz de cada metade, reduz a ≤ 512, guarda a fonte em `equip/src/`). `wings.js` = igual, só URL.
- Para **voto, sem tocar em `assets/`**: `WOUT=C:/Users/rafae/Desktop/fps/docs/proto/v2/a/ node wings_prev.js <nome> <arquivo>` (como e28d164: recorte B só em `docs/proto/v2/a`).
- Fundo difícil: `node wkey.js <in.png> <out.png> [tol=100] [box=860]` (chroma + maior componente, 1024 centrado) antes do recorte.
Exemplos: fd93c0e (8 asas: refs + L/R com raiz e fit + prévia), 5fc3f0b (Serafim refeito: 6 asas = 3 pares na mesma raiz).

### Passo 3. Prévia da batida e página de voto (custo 0)
- Folha composta Kael + asa (24 quadros, 12 fps, 1 batida lenta de 2 s, célula 448×256): `node wingsheet.js idle <nome> [era2_t1]` e `node wingsheet.js run <nome>` → `assets/anim/equip/preview/`. Só cobre o Kael a pé.
- Página de voto: modelo `docs/proto/v2/AsaSerafica.html` (e28d164): Kael e Kaia parados e correndo + Kael no lobo, desenho pela conta do `drawWingsAt`, tiras de 24 quadros em `docs/proto/v2/a/`. Entregar pelo **índice único de protótipos** (um link só para o dono); conferir no Chrome local antes (porta própria 18730-18739; `<img>` em vez de `new Image()`).

### Passo 4. Ícone (custo 0)
`node icongen.js <metade ou par recortado.png> C:/Users/rafae/Desktop/fps/assets/icons/wings/<nome>.png 256 6 0.84`. Comparar com os irmãos (`newpets/cs.js`).

### Passo 5. Ligar (Engenheiro) e conferir em tudo
Pedir ao Engenheiro: `<nome>` em `wingTypes` e em `wingsApproved` (js/sys/stats.js:61) depois do voto do dono.

---

## VALIDAÇÃO E QUALIDADE
| Critério | Tolerância | Como provar |
|---|---|---|
| Batida em laço sem salto | a batida é código (seno): sem salto por construção; na prévia, razão ≤ 1,5 | `node artcheck.js loop assets/anim/equip/preview/<folha>.png <json> 1.5` (se a prévia tiver .json; senão, olho na tira de 24 quadros) |
| Presa nas costas em 100% dos quadros | raiz na âncora `back`; `back` dentro do corpo (±8 px) em todas as folhas a pé, montadas e de morte | `node test/sys/stagekit.test.js` ("costas no corpo"); prévia `wingsheet.js` |
| Raízes simétricas | `L.root[1]` = `R.root[1]` ± 0,02; `L.w` ≈ `R.w` ± 3% | ler `wing_<nome>.json` |
| Pés no chão / mão no grip | não se aplica à asa (herói já validado) | — |
| Sem borrão e sem fantasma | semitransparente interno ≤ 30 px por metade | `node artcheck.js px assets/anim/equip/wing_<nome>_L.png` e `_R.png` |
| Sem cor fora da paleta | ≤ 0,5% (a calibrar) contra a referência aprovada | `node artcheck.js pal wing_<nome>_L.png assets/anim/equip/new/wing_<nome>_ref.png 0.5` |
| Contorno sem franja verde | verde ≤ 20 px por metade | `node artcheck.js px ...` |
| Tamanho igual às irmãs | metade com lado maior ≤ 512 e área ±15% das asas atuais; `fit` na faixa das irmãs | ler os .json (`wing_bone.json`, `wing_phoenix.json`...) |
| Nada flutua | 0 pena/faísca solta | olho na referência + `artcheck px` |
| Nenhuma asa desenhada em skin | skins sem asa; Kael Anjo com item usa `_nowing` | stagekit ("pasta _nowing completa"); `skin/nowing.js` / `nowing_apply.js` se precisar limpar |
| Não cobre o rosto nem atravessa o corpo na morte | 0 | QA: `dbgWing('<nome>')` + `dbgDieAt(0.3/0.8/1.6)` |

**Folha de conferência / voto:** página `docs/proto/v2/Asa<Nome>.html` no índice único (modelo AsaSerafica) + `assets/anim/equip/new/wing_<nome>_ref_prev.png`.

**Reprova na hora:** asimétrica; sem vão (o corte parte a asa); peça solta; verde ou magenta; asa desenhada numa skin; ligada sem voto do dono.

**G5:** mandar ao QA: `Asa <nome> · <hash> · assets/anim/equip/wing_<nome>* + icons/wings · dbgWing('<nome>'); parado/correr/golpe/giro/morte (dbgDieAt); Kael, Kaia, Ninja/Arlequina, Kael Anjo, Kaia Angelical; montado em 2 montarias; telas Batalha, Derrota, Equipamento/Aparência`. Roteiro: `docs/qa/VALIDAR_ARTE.md` §4.5.
