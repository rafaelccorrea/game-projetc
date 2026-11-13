# Manual: ARMA (família × raridade × era), passo a passo

Antes: `docs/arte/VALIDACAO_COMUM.md` (§1: copiar `C:\Users\rafae\AppData\Local\Temp\tools`, ÚNICA cópia das ferramentas, fora do repositório), `docs/FLUXO_ARTE.md` §5 (Arma), `docs/ARTE_PRONTO.md` (Arma) e custo em `docs/arte/CUSTO_POR_ITEM.md` (comum ~2-3; Lendária ~6-12; grátis 0-1 dia).

## Regras
- A arma é **um sprite só**, desenhado **por código no grip** de cada quadro, em todo herói, toda skin e toda montaria. Nunca se pinta arma em folha de herói (a `_era2_t1` é só conferência).
- Item pronto = na mão do Kael e da Kaia, em todas as skins, a pé e montado, parado/correr/golpe/giro/morte (a arma cai por código), com a ultimate e a aura da Forja (ARTE_PRONTO).
- Raridades: arquivo `era<N>_<t0|raro|t1|mitico|t2>` = Básico / Raro / Épico / Mítico / Lendário (js/battle.js:704). Arco e bumerangue: `<bow|boomerang>_<basico|raro|epico|mitico|lendario>`.
- Ultimate em 3 níveis: **Básico-Épico** = folha base da era (`assets/anim/ult/era<N>_ult`); **Mítico** = a base reforçada por código; **Lendário** = folha própria `assets/anim/ult/<família>_legend` (ligado em js/battle.js:509-510, `ultTier` em js/sys/stats.js:31).
- Ícone, prévia e aura da Forja: código ou recorte, nunca geração separada se der para recortar.

## O que sai
| peça | arquivo | formato |
|---|---|---|
| sprite | `assets/weapons/<chave>.png` | transparente, lado maior ≤ 1024 (`shrink.js` usa 1024) |
| dados do punho | entrada `<chave>` em `assets/weapons/meta.json` | `{"type":"melee", "grip":[fx,fy], "angle":graus, "len":fração}` (ex.: `era0_t0` = `grip [0.489,0.75], angle 112, len 0.621`) |
| ícone | `assets/icons/weapons/<chave>.png` | 256×256 transparente |
| ultimate | `assets/anim/ult/era<N>_ult.png/.json` (base) e `<família>_legend.png/.json` | células 384×216, 8 colunas (formato próprio da ultimate, já em grade desde a origem) |
| aura da Forja | `assets/anim/aura/aura_<nome>.png/.json` (`aura4`, `aura7`, `aura10`, `aura13`...) | 16 quadros 256×320, 12 fps |
| pistola/fuzil nas folhas do herói | `hyb/R/pistol/kael_pistol_<st>_<chave>`, `skins/<skin>/pistol/...` | composto por código (`gunskin.js`) |
O protótipo usa uma cópia recortada `docs/proto/v2/a/wh_<chave>.png` (lado maior 300): é só do protótipo, o jogo lê `assets/weapons/`.

---

## Passos

### Passo 0. G0 (custo 0)
A arma está aberta? Já existe sprite/ícone/ult no disco (`bow_legend` e `boomerang_legend` já existiam quando a lista dizia que faltavam)? Dá para fazer por recorte de uma imagem de lote da era? Plano de custo.

### Passo 1. Sprite da arma (G1)
**Grátis:** AI Studio Nano Banana 2 Lite 1K (+ `node dewm.js <in> <out> C:/Users/rafae/AppData/Local/Temp/tools`). **Higgsfield:** `nano_banana_pro` 1:1 `"1k"`, referência = as armas aprovadas da mesma era/família (~2). Lote: várias raridades numa imagem e recorte (paga 1 vez).
```
Game weapon sprite for a chibi mobile RPG: <família> of the <era>, <raridade> tier: <materiais, cor, detalhe>. One single weapon,
whole weapon visible, diagonal, handle at the bottom, clean bold dark outline, painted style matching image 1.
Flat pure green background (#00FF00), no shadow, no text, no hand, no character. Nothing floating, no glow, no sparks, no particles.
No green on the weapon. No magenta or pink.
```
Recorte: `node key.js <in.png> <out.png> 40` (fundo da cor dos cantos → transparente); lote com várias: cortar cada uma (`icn/split2.js` para 2 lado a lado, `icn/split4.js` para 2×2; saem já em 256, então para o sprite grande recortar da imagem original).
Gate: contorno limpo, sem verde, cabo visível.

### Passo 2. Grip no meta.json (custo 0)
Medir o eixo da arma e o ponto do punho: `node weapmeta.js` calibra pelo `era2_t1` (eixo principal do alfa), mas **está escrito para as armas das eras 7-8**; para outra arma, usar uma cópia com a lista trocada (**a confirmar** o uso geral). Gravar `grip`, `angle`, `len`, `type` em `assets/weapons/meta.json` (backup do meta antes: já existem `meta.json.bak*`).
Gate: a arma no punho do R: `node compose2.js C:/Users/rafae/Desktop/fps/assets/anim/hyb/R/kael_attack_body.png C:/Users/rafae/Desktop/fps/assets/anim/hyb/R/kael_attack_body.json C:/Users/rafae/Desktop/fps/assets/weapons/<chave>.png <chave> <saida.png> 1` (dedos e cabeça por cima, igual ao jogo). Repetir com `hyb/kaia/kaia_attack_body`, uma skin e `spin`.

### Passo 3. Ícone (custo 0)
`node icongen.js <sprite.png> C:/Users/rafae/Desktop/fps/assets/icons/weapons/<chave>.png 256 6 0.84` (recorte justo, centrado, contorno escuro grosso, sombra leve). Qual ferramenta fez os 45 ícones atuais: **a confirmar** (conferir que o novo fica igual aos irmãos da mesma era com `newpets/cs.js`).

### Passo 4. Ultimate (só Lendária própria; base só se a família/era for nova) (G2)
**Higgsfield:** `seedance_2_0`, 16:9, imagem inicial = arte da arma/cena aprovada (~4 por vídeo). **Grátis:** Kling 4.0 Flash 3 s só início (18); 16:9 no Kling **a confirmar**. Fundo preto (o `ultsheet.js` converte luminância em alfa) ou verde com `KEY=g`.
```
Full-screen ultimate attack effect for a mobile RPG: <descrição do golpe da família, cor da raridade>. Dramatic but readable,
centred, plays once from build-up to a final bright burst and fades out. Pure black background, no characters, no faces, no text, no UI.
```
Folha:
- base da era: `node ultset.js <N> <url> [lighter|source-over]` → `assets/anim/ult/era<N>_ult.png/.json` (12 fps, 384×216).
- Lendária: baixar o mp4, extrair `"$FF" -i v.mp4 -vf fps=12 <pasta>/f%03d.png` e `node ultsheet.js <pasta> C:/Users/rafae/Desktop/fps/assets/anim/ult/<família>_legend.png C:/Users/rafae/Desktop/fps/assets/anim/ult/<família>_legend.json 384 216` (passo de quadros: 6º argumento).
- Mítico (código): `node ultboost.js <era<N>_ult.png> <era<N>_ult.json> <saída sem extensão> [r,g,b]` (realce, halo, faíscas, anel). O cabeçalho chama de "versão LENDÁRIA por código" (histórico); hoje o Mítico é a base reforçada: **qual saída o jogo lê para o Mítico: a confirmar** em js/battle.js:509.
- Conferir: `node ultcontact.js <png> <json> <saida.png>` (6 quadros), `node ultlum.js <pasta>` (brilho médio por quadro), `node ultwhite.js <pasta>` (% de branco por quadro: clarão forte demais).
Registro dos vídeos: `tools/bow/jobs.txt` (exemplo de lote de família nova: 12 vídeos de herói + 4 ultimates + 1 refeita).

### Passo 5. Arma de fogo e família nova de pose (só se o jogo pedir pose nova)
- Pistola de uma mão (já existe a pose; a arma nova entra por código): `node gunskin.js <body.png> <body.json> <cleanDir> <chave> <saidaBase> [flash 0|1]` (precisa do `_clean` com `grip.json` do `pistolrip.js`); skins Kael `skin/gunskin_s.js` (luva por cima), Kaia `bash kaiaskin/regun.sh <skin>`.
- Duas mãos (fuzil): `node gunrip.js <rawDir> <cleanDir>` (acha as 2 mãos no bastão) e `node gunsheet.js <body.png> <body.json> <cleanDir> <chave|none> <saidaBase> [flash]` (grava mão de trás, da frente e boca do cano por quadro).
- Pose nova (ex.: arco, bumerangue) = vídeos novos do herói padrão com o bastão/arma magenta: mesmo método da skin (`MANUAL_skin.md`), registro em `tools/bow/jobs.txt`. Só com OK do dono.
- Montado: arma de fogo usa o golpe de espada (achado N2 da matriz): pose montada de tiro é decisão do PO.

### Passo 6. Aura da Forja (só se faltar o nível)
`node auraset.js <nome> <url> [g]` → `assets/anim/aura/aura_<nome>.png/.json` (16 quadros 256×320; `g` = fundo verde). Desenho no herói por código (`drawAura`, também montado: js/mountfx.js:211).

---

## VALIDAÇÃO E QUALIDADE
| Critério | Tolerância | Como provar |
|---|---|---|
| Mão no grip em 100% dos quadros (todo herói, skin, montaria) | cabo dentro do punho; dedos por cima | `node test/sys/stagekit.test.js` (mão no grip das folhas); visual: `compose2.js` nas folhas `_body` do R, da Kaia, de 1 skin (passo 2) e `node mount/gamecheck.js <saida.png> <montaria> attack <chave>` (Kael) / `kaiamount/gamecheck.js` (Kaia) |
| Arma não cobre o rosto | 0 quadro com a lâmina sobre o rosto | QA com `&neck=0` × padrão; olho no `compose2` (cabeça por cima até o pescoço) |
| Laço sem salto (aura da Forja) | razão ≤ 1,5 | `node artcheck.js loop <aura.png> <aura.json> 1.5` |
| Pés no chão | não se aplica ao sprite (herói já validado) | — |
| Cabeça e grip iguais ao padrão | o grip é o do herói; a arma segue o `meta.json` | `compose2` nas 3 folhas de referência |
| Sem borrão e sem fantasma | semitransparente interno ≤ 30 px no sprite | `node artcheck.js px <sprite.png>` |
| Sem cor fora da paleta | ≤ 0,5% (a calibrar) contra a imagem aprovada | `node artcheck.js pal <sprite.png> <imagem_aprovada.png> 0.5` |
| Contorno sem franja verde | verde ≤ 20 px | `node artcheck.js px <sprite.png>` |
| Tamanho e escala iguais aos irmãos | `len` e área parecidos com a mesma família/era (o jogo escala pela caixa opaca: lado maior = 300 px na conta do gamecheck); ícone 256 com o item em ~232 | ler `meta.json`; ícones lado a lado com `newpets/cs.js` |
| Nada flutua | nenhuma faísca/gema solta no sprite | `artcheck px` + olho |
| Ultimate legível | sem clarão branco > 60% da tela por mais de 2 quadros (a confirmar o limite) | `node ultwhite.js <pasta de quadros>` |
| Grade/CSS | 0 falha | `node test/paineis/sheetcss.test.js`, `node test/e2e/sheetgrid.js`; `test/e2e/weapons.js` (família × raridade × era) |

**Folha de conferência para o dono:** a arma no Kael, na Kaia, em 1 skin e montado: juntar as saídas do `compose2.js` (a pé, golpe) e do `mount/gamecheck.js` com `node newpets/cs.js C:/Users/rafae/Desktop/fps/assets/weapons/_conferencia_<chave>.png 512 <img1> <img2> ...` (nome sugerido) + `ultcontact.js` da ultimate.

**Reprova na hora:** cabo fora da mão em qualquer quadro; lâmina cruzando o rosto; verde/magenta no sprite; arma de outra família/era por engano; ultimate com personagem, rosto ou texto; folha de herói com arma pintada.

**G5:** mandar ao QA: `Arma <chave> · <hash> · assets/weapons/<chave>.png + meta.json + icons/weapons + ult · dbgSet(<era>, <arma>), dbgWeapon(<era>, <tipo>); Kael e Kaia; parado/correr/golpe/giro/morte; 6 montarias; Forja +4/+7/+10/+13; dbgSkill(3); telas Equipamento, Forja, Invocar, Loja, Perfil`. Usar arma de era ≠ 2 ao comparar (a da era 2 vem pintada nas folhas de conferência). Roteiro: `docs/qa/VALIDAR_ARTE.md` §4.4.
