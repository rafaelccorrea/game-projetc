# Manual: MONTARIA (Kael e Kaia montados), passo a passo

Antes: `docs/arte/VALIDACAO_COMUM.md` (§1: copiar `C:\Users\rafae\AppData\Local\Temp\tools`, a ÚNICA cópia das ferramentas, fora do repositório), `docs/FLUXO_ARTE.md` §5 (Montaria), o kit `docs/guidekit/README.txt` + `docs/guidekit/<montaria>/*.txt` (prompts prontos das 9 montarias novas) e `docs/guidekit/kaia_phoenix.txt`. Custo: `docs/arte/CUSTO_POR_ITEM.md` (~30 sem refação / 36 com; grátis 3 dias).

## Regras
- Cavaleiro = corpo padrão (Kael garoto / Kaia menina), criança, sério, nada sensual. **Uma sela só**, debaixo do cavaleiro. **Nada flutua** (brasa, faísca, névoa, estrela, brilho de chifre).
- Herói segura o **bastão magenta** na mão direita; a arma real entra por código no grip (`js/mountfx.js`: `_body` + arma equipada no grip por quadro). **Arma pintada reprova.**
- Produzir **SÓ `_body` e `_era2_t1`** por estado. **Nada de folhas `_Nstar`**: a aura por estrela é código (`MOUNT_AURA`, js/mountfx.js:73; o jogo vai até 5★, `maxStars:5` em js/sys/mount.js:13; 6-7★ atrás de `setStars7`, desligado).
- Folhas ficam em **TIRA**. Grade congelada pela fps-c8 (`tools/grid/regrid.js` só com ordem dela).
- Uma montaria por vez; um vídeo processado por vez.

## O que sai
`assets/anim/mounts/<herói>_<montaria>_<estado>_{body,era2_t1}.png/.json`, herói ∈ kael, kaia; estado ∈ idle (12 quadros), run (8), attack (17). Célula **512×352** (pad L96 R160 T96 B0), **patas em y=339**, 12 fps, `grip` e `back` em 100% dos quadros do `_body.json`.
Imagem parada: `assets/mounts/mount_<id>_ref.png` (o bicho sozinho, olhando para a direita, transparente; Derrota e Códex). Ícone: `assets/icons/mounts/<id>.png`. Guias: `assets/hero/guides/kael_<montaria>_guide.png`, `kaia_<montaria>_guide.png`. Nomes das montarias = `B_MOUNT_ART` (js/p_bag.js) = nomes das folhas.

---

## Passos

### Passo 0. G0 (custo 0)
Montaria aberta na matriz? Vídeos já pagos? (`tools/kaiamount/jobs.txt`: ex. Kaia na Fênix = 3 vídeos pagos e não baixados, custo 0.) Plano aprovado.

### Passo 1. Montaria sozinha (uma vez) (G1)
Entrada: conceito aprovado. **Grátis:** AI Studio Nano Banana 2 Lite 1K (+ `dewm.js`). **Higgsfield:** `nano_banana_pro` 1:1 `"2k"` (~2).
```
<descrição da montaria> with a leather saddle and bridle, ONE saddle only, standing on the ground in strict side view facing right,
whole body visible, feet on the ground line near the bottom of the frame. Mature stylised chibi-RPG game style, clean cartoon line art.
Flat pure green background (#00FF00), no ground shadow, no text, no rider. Nothing floating, no glow, no embers, no mist, no sparks.
Flames or magic in blue-violet, never magenta or pink.
```
Salvar em `assets/mounts/new/<montaria>_ref.png` (fundo verde). Imagem parada do jogo: recortar o verde (`node key.js <in> <out> 40`), olhando para a direita, transparente, no formato das outras `mount_*_ref` → `assets/mounts/mount_<id>_ref.png` (como b48fff2). Tamanho/margem exatos das outras refs: **a confirmar** (medir uma existente, ex. `mount_wolf_ref.png`, e igualar).

### Passo 2. Guia do Kael montado (G1)
Kit pronto em `docs/guidekit/<montaria>/prompt_kael.txt` (layout 2048 `C:\Users\rafae\AppData\Local\Temp\tools\guidekit\<montaria>\pre_kael.png`, chão y≈1990).
**Higgsfield:** subir as 3 referências NA ORDEM (`media_upload` → `node put1.js <arquivo> '<url>'` → `media_confirm`): (1) `pre_kael.png`, (2) `<montaria>_ref.png`, (3) `C:\Users\rafae\AppData\Local\Temp\tools\mount\gr_guide.png` (Kael no grifo). `generate_image {model:"nano_banana_pro", aspect_ratio:"1:1", resolution:"2k", medias:[3× image_references], prompt}`. **Conferir que `medias` não está vazio** (erro já pago na fênix). ~2.
**Grátis:** AI Studio com as mesmas 3 imagens e o mesmo prompt, 1K; `dewm.js`. (Guia grátis aprovado no G1 já existe para o raptor: `assets/hero/guides/_free/kael_war_raptor_guide_v2.png`.)
Prompt: o PROMPT de `prompt_kael.txt` (já traz "only ONE saddle", "never crosses his face", "fully clothed, modest", "nothing floating, no glow").
Conserto barato (~2) se vier sela vazia ou peça solta: 1 imagem = o guia gerado + `Edit this image with minimal changes: <o que tirar>. Keep everything else identical.`
Gate G1: `node C:/Users/rafae/Desktop/fps/docs/guidekit/checkguide.js <guia.png>` → `"warnings": []`; chamas roxas: `--violet <saida.png>`. Olho: 1 sela sob o cavaleiro, bastão inteiro na mão direita sem cruzar o rosto, criança séria, nada solto, asas da montaria ATRÁS do cavaleiro.

### Passo 3. Guia da Kaia (opção B) (G1)
`prompt_kaia.txt` → PROMPT_B: image 1 = guia aprovado do Kael (id do job), image 2 = `assets/hero/guides/kaia_griffin_guide.png`. Troca menino → menina com a mesma pose (garante a mesma posição). Opção A (pre_kaia) só de reserva. Mesmo gate.
Salvar os dois guias em `assets/hero/guides/` (commit).

### Passo 4. Vídeos (G2): 3 por herói
Prompts em `docs/guidekit/<montaria>/video_prompts.txt` (idle, run, attack × Kael/Kaia). Golpe = **estocada** (o "de cima para baixo" riscou o rosto). Todos terminam com `No motion blur, no trails, no glow, no sparks, no floating embers, no visual effects.`
| estado | Higgsfield | Grátis |
|---|---|---|
| idle, run | `seedance_2_0` fast 480p 4 s 1:1 `generate_audio:false`, start = end = guia (~4) | Kling 2.5 Turbo, início = fim = guia, 5 s (25) |
| attack | idem (start = end: a estocada volta à pose) | Kling 4.0 Flash 720p 3 s, só início (18); acrescentar "pulls back to exactly the starting pose by the end of the 3 seconds" (ver `free_kaia_phoenix/video_prompts_kling.txt`) |
`jobs_wait` (timeout ≤ 15) e **baixar a url logo** (a Kaia da fênix ficou pendente quando o MCP caiu). Kling: tirar a marca com `drawbox` (VALIDACAO_COMUM §2); conferir que pata/cauda não entram no canto 730..960 × 880..960.

### Passo 5. Folhas (G3)
De `C:\Users\rafae\AppData\Local\Temp\tools`, um vídeo por vez, backup antes:
- **Kael:** `KEEP=1 node mountset.js <montaria> <estado> <url>` e depois `bash kaiamount/postgen.sh kael <montaria> <estado>`.
  Grátis (mp4 local): `KEEP=1 node mountset_free.js <montaria> <estado> <limpo.mp4>` (recorta `crop=ih:ih`; `OUTD=<pasta>` muda a saída; `CROP=` muda o corte) e o mesmo `postgen.sh`.
- **Kaia:** `KEEP=1 node kaiamount/kmset.js <montaria> <estado> <url>` e `bash kaiamount/postgen.sh kaia <montaria> <estado>`. **`kmset.js` só baixa por URL** (não aceita mp4 local): para vídeo grátis da Kaia, **a confirmar** como servir o mp4 (ex.: `serve.js`) ou usar uma cópia do `kmset.js` com a linha do `mountset_free.js` (`if (fs.existsSync(url)) copyFileSync`).
  `mountset`/`kmset` fazem: 24 fps → `polevid.js` (tira o bastão, acha a mão) → `loopsheet.js` (`FIX mount/xf.json`, pad 96/160/96, patas 339, `GRIPFDY=1`) → `_body` → `compose2.js` (`_era2_t1`, golpe com arco).
  `postgen.sh <herói> <montaria> <estado> [ang=24]` faz: `polefill.js` (listra do bastão sobre a montaria) → `fixgrip.js` → `mount/poletail.js` → `degreen.js` → `islands.js` → ângulo de repouso 24° em idle/run (`mount/setgrip.js`, arma não cobre o rosto) → costas (`kback.js`; Kael ang 16,5) → recompõe `_era2_t1` → apaga `_clean`. Variáveis: `TB`, `TF` (trecho do polefill), `KEEPCLEAN=1`.
- **Golpe:** faísca na ponta: `node kaiamount/spark.js <..._attack_body.png> <quadros ex 6,7,8> [x0=300] [min=60]`. Últimos 2 quadros no repouso: `node mount/setgrip.js <json> "15:@24;16:@24"`. Recompor: Kaia `node kaiamount/kmrecompose.js <montaria> attack`; Kael `node compose2.js <body.png> <body.json> C:/Users/rafae/Desktop/fps/assets/weapons/era2_t1.png era2_t1 <saida_era2_t1.png> 1` com `PADL=0 PADR=0 HEADMAXDX=8 NECKMAXX=245`.
- Mão errada num quadro: `node mount/setgrip.js <json> "i:x,y,ang;j:@ang"`.

### Passo 6. Conferência, testes, commit
Ver a seção abaixo. Commit só dos arquivos da montaria. Ligar no código é do Engenheiro: `MOUNT_TBL` (js/mountfx.js:27, medir `wx2/wy2`), `MOUNT_REF` (:156), manifest, `B_MOUNT_ART`, todas as telas (Montarias, Perfil, Arena, Batalha, Loja/Prêmio). Avisar a Sistemas quando as folhas estiverem prontas.

---

## VALIDAÇÃO E QUALIDADE
`artcheck.js` em `VALIDACAO_COMUM.md` §4. Rodar para Kael e Kaia × idle/run/attack (6 folhas `_body`).

| Critério | Tolerância | Como provar |
|---|---|---|
| Laço sem salto (idle, run) | razão ≤ 1,5 | `node artcheck.js loop <..._idle_body.png> <..._idle_body.json> 1.5` |
| Mão no grip em 100% dos quadros | desenho opaco a ≤ 6 px do grip; `grip` e `back` em 12/8/17 quadros | `node test/sys/stagekit.test.js` (hoje confere as `_idle_body` das 6 montarias: montaria nova entra na lista do teste pelo Engenheiro, **a confirmar**); `node mount/gamecheck.js <saida.png> <montaria> <estado> era0_t0,era3_t0,era6_t2` (Kael) e `kaiamount/gamecheck.js` (Kaia): cruz vermelha no punho |
| Patas no chão | ponto mais baixo = 339 ± 4 px | stagekit ("pés no chão") e linha vermelha da `_conferencia` |
| Cabeça e grip iguais ao padrão do herói | cavaleiro na mesma escala do grifo (`s` do back ≈ o do Kael no grifo, 0,65); ângulo de repouso 24° em idle/run | ler `back[i].s` e `grip[i].ang` no `_body.json`; `kaiamount/backview.js` (a confirmar uso) |
| Sem borrão e sem fantasma | semitransparente interno ≤ 30 px/quadro; listra do bastão sobre a montaria = 0 | `node artcheck.js px <png> <json>`; olho na conferência; conserto `polefill.js` |
| Sem magenta | 0 | `node kaiamount/pinkcount.js <as 12 folhas>` → `magenta 0` |
| Sem cor fora da paleta | ≤ 0,5% (a calibrar) contra o guia | `node artcheck.js pal <png> <guia.png> 0.5` |
| Contorno sem franja verde | verde ≤ 20 px/quadro | `artcheck px` (conserto `kaiamount/degreen.js`, `islands.js`) |
| Tamanho igual aos irmãos | 512×352, 12/8/17 quadros, `feetY` 339, igual às 6 montarias atuais | ler o `.json`; `node test/paineis/sheetcss.test.js` (Montarias lê por CSS: MT_ART) |
| Nada flutua | 0 faísca/brasa/sela vazia | olho + `spark.js`; G1 já barra a sela vazia |
| Sem asa desenhada no herói | 0 (asa da montaria é parte do bicho, atrás do cavaleiro) | olho no G1 |
| Criança, nada sensual | — | olho no G1 e voto do dono |
| Sem `_Nstar` novas | 0 arquivo `*_Nstar*` novo | `git status -- assets/anim/mounts` antes do commit |
| Grade | 0 falha | `node test/e2e/sheetgrid.js` |

**Folha de conferência:** `node kaiamount/conf.js <montaria>` → `assets/anim/mounts/_conferencia_<montaria>.png` (Kael e Kaia × parado/correr/golpe, 6 quadros-chave, chão em vermelho). Junto: a folha do `gamecheck.js` com 3 armas de eras diferentes.

**Reprova na hora:** sela vazia a mais; bastão cruzando o rosto; arma pintada no `_body`; magenta > 0; patas cortadas na borda; cabeça do bicho virada para a câmera no parado; faísca/brasa solta; folha `_Nstar` nova; Kaia com pose diferente do Kael.

**G5:** mandar ao QA: `Montaria <id> · <hash> · assets/anim/mounts/{kael,kaia}_<montaria>_* · dbgMount('<id>', 1..5); parado/correr/golpe; Kael e Kaia; armas era0_t0, era3_t0 (fogo), era6_t2; asa; telas Montarias, Batalha, Arena, Perfil, Derrota, Equipamento`. Roteiro: `docs/qa/VALIDAR_ARTE.md` §4.3.
