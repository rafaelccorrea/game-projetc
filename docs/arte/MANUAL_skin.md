# Manual: SKIN (Kael ou Kaia), passo a passo

Para uma sessão nova seguir sem perguntar. Antes: ler `docs/arte/VALIDACAO_COMUM.md` (§1 backup da pasta `C:\Users\rafae\AppData\Local\Temp\tools`, que é a ÚNICA cópia e fica fora do repositório: copiar antes de começar), `docs/FLUXO_ARTE.md` §5 (Skin) e o custo em `docs/arte/CUSTO_POR_ITEM.md` (~38 sem refação, ~46 com; grátis: 3 dias de Kling).

## Regras do dono (reprovam na hora)
- A skin usa **EXATAMENTE o corpo padrão**: garoto (Kael, `assets/anim/hyb/R/`) ou menina (Kaia, `assets/anim/hyb/kaia/`). Mesmos estados, quadros, células, ritmo, chão e âncoras (grip, costas, pescoço). Só mudam **roupa, cabelo e rosto**.
- **Nunca versão adulta** ou "crescida"; criança de ~10 anos, semi-chibi, rosto sério. **Nada sensual.**
- **Nunca asa desenhada** (nem capa em forma de asa). Asa é item separado (`MANUAL_asa.md`).
- **Toda arma tem de funcionar em toda skin**: a folha `_body` sai SEM arma; a arma entra por código no grip.
- **REGRA NOVA (PO + dono, 14/11): cada estado da skin nova é gerado A PARTIR DO VÍDEO DO HERÓI PADRÃO** (mesma coreografia, só a roupa muda). **Proibido vídeo livre por skin.** Motivo: a auditoria achou que as skins atuais vieram de vídeos próprios e o golpe e o giro saíram com o grip 75-160 px fora do padrão.

## O que sai (formato do herói padrão)
Pasta: `assets/anim/skins/kael_<skin>/` ou `assets/anim/skins/kaia_<skin>/`, mesmos nomes de `hyb/R/` (ou `hyb/kaia/`).
| estado | arquivo `_body` | quadros | célula | laço? |
|---|---|---|---|---|
| correr | `kael_run_body` | 8 | 256×256 | sim |
| parado | `kael_idle_body` | 12 | 256×256 | sim |
| golpe | `kael_attack_body` | 17 | 256×256 (+ `kael_attack_wide_era2_t1` 448) | não |
| giro | `kael_spin_body` | 17 | 256 (`kael_spin_era2_t1` 448) | não |
| morte | `kael_die_body` | 18 | 448×256 | não (sem grip: a arma cai por código) |
| pistola parado / correr / tiro | `kael_pistol_{idle,run,shoot}_body` | 12 / 8 / 24 | 448×256 (pad 96/96) | sim / sim / não |
12 fps, pés em y=243, escala e posição do herói padrão. Compostas por código: `kael_<st>_era2_t1.png` (espada da era 2 no grip, para conferência e telas antigas), `pistol/kael_pistol_<st>_era{3..6}_t0`. Arco e bumerangue: por código (a skin não tem folha própria). Avatar: `assets/hero/avatar/kael_<skin>.png` + `avatars.json`. Montado: por padrão o corpo montado padrão (troca de cabeça por código); folha montada própria só com OK do dono (+14 por montaria).

---

## Passos

### Passo 0. Portão G0 (custo 0)
Entrada: matriz. Conferir as 7 perguntas de `docs/FLUXO_ARTE.md` §1. A skin está aberta pelo PO? Já existe algo em `assets/anim/skins/`, `assets/hero/guides/`, `tools/skin/jobs.txt` ou `tools/kaiaskin/jobs.txt`? Plano de custo aprovado?
Gate: PO escreveu "pode" no item.

### Passo 1. Vídeos-base do herói padrão (custo 0 se existirem)
Entrada: os vídeos de onde saíram `hyb/R/kael_<st>_body` (ou `hyb/kaia/`). O campo `src` de cada quadro no `_body.json` e o `_grip_src.json` mostram os nomes dos quadros, mas **os mp4 do herói padrão não estão na pasta de ferramentas nem nos jobs.txt** (procurado em 14/11). **A confirmar**: localizar os ids dos vídeos do herói padrão no histórico do Higgsfield (`show_generations`) e anotar em `tools/skin/jobs.txt` como `base R <estado> <url>`. Sem os vídeos-base, **parar e avisar o PO** (não gerar vídeo livre).

### Passo 2. Guias da skin (G1)
Três imagens, todas no MESMO enquadramento da guia do herói padrão:
| guia | uso | arquivo |
|---|---|---|
| com bastão magenta na mão direita | correr, parado, golpe, giro | Kael: `tools/skin/ref_<skin>.png` (registrada pixel a pixel na guarda do R: pés em 485, punho em (258,399) no espaço 512) · Kaia: `tools/kaiaskin/<skin>/pole.png` |
| com **pistola magenta** na mão direita | pistola ×3 | Kael: guia "pistol" (jobs.txt) · Kaia: `kaiaskin/<skin>/pistol.png` |
| sem bastão (mãos vazias) | morte, avatar (`skin/avatar_free.js`) | Kael: guia "free" · Kaia: `kaiaskin/<skin>/bare.png` |

**Grátis:** Google AI Studio, Nano Banana 2 Lite, 1K, anexar (1) a guia do herói padrão do mesmo tipo e (2) a referência de roupa aprovada pelo dono; tirar a ✦ com `node dewm.js <in> <out> C:/Users/rafae/AppData/Local/Temp/tools`.
**Higgsfield:** `generate_image` `nano_banana_pro`, 1:1, `resolution:"1k"`, `medias` = guia do padrão + referência de roupa (upload: `media_upload` → `node put1.js <arquivo> '<url>'` → `media_confirm`). ~2 por imagem.
Prompt (modelo; trocar `<...>`):
```
Edit image 1 with minimal changes: keep EXACTLY the same child body, pose, proportions, size, position, framing and the same straight thin solid
bright MAGENTA pole in the right hand at the same angle. Change ONLY the outfit, hair and face details to the <nome da skin> look from image 2:
<descrição curta da roupa>. Young child of about 10, natural child proportions, serious determined warrior face, fully clothed, modest.
No wings, no cape shaped like wings, no extra weapon, no armor spikes floating. Flat pure green background (#00FF00), no ground shadow, no text.
Clean cartoon line art in the same chibi game style. Nothing floating, no glow, no visual effects. No magenta or pink anywhere except the pole.
```
Kaia: normalizar cada guia para o enquadramento da menina: `node kaiaskin/fitguide.js <guia_da_menina> <guia_da_skin> <saida.png>` → anotar `{pole, pistol, bare}` em `kaiaskin/<skin>/ratio.json` (ex.: ninja `{"pole":0.9905,"pistol":1.0019,"bare":0.9962}`).
Gate G1: `node C:/Users/rafae/Desktop/fps/docs/guidekit/checkguide.js <guia>` sem avisos (guia sem bastão: só o aviso "quase sem magenta"); olho: sem asa, criança, nada sensual, bastão inteiro sem cruzar o rosto, mesma silhueta do padrão. Salvar a guia aprovada também em `assets/hero/guides/` (commit).

### Passo 3. Vídeo por estado A PARTIR do vídeo do padrão (G2)
Entrada: vídeo-base do estado (passo 1) + guia da skin (passo 2).
Ferramenta/modelo: **transferência de movimento** (o vídeo do padrão dá o movimento, a guia dá a aparência). Candidatos: Higgsfield `generate_video` com o modelo de troca de personagem por vídeo (`hf_mult_motion_control`, ou `motion_control` "Kling recast"); no grátis, o recurso equivalente do Kling. **Modelo, parâmetros, preço e se o bastão magenta sobrevive: a confirmar com 1 job de teste** (no giro, o estado que mais falhou). Se o teste não manter a coreografia (passo 7, `artcheck cmp`), parar e levar ao PO; não voltar ao vídeo livre sem ordem escrita.
Prompt (texto que acompanha a transferência):
```
Replace the character in the video with the child from the reference image, keeping EXACTLY the same motion, timing, pose in every frame,
camera, framing and the straight magenta pole in the right hand. Same flat pure green background (#00FF00). One single slow movement,
no motion blur, no speed lines, no motion trails, the pole stays sharp. Fully clothed, modest, child of about 10. No wings. Nothing floating.
```
Anotar job id + url em `tools/skin/jobs.txt` (Kaia: `tools/kaiaskin/jobs.txt`) NA HORA. Pistola: a "pistola" do vídeo é magenta (o `pistolrip.js` a apaga e o `gunskin` põe a pistola da era).
Grátis (Kling): mp4 baixado; marca: `"$FF" -y -i in.mp4 -vf "drawbox=x=730:y=880:w=230:h=80:color=0x00FF00:t=fill" -an limpo.mp4`.
Gate G2: olhar o mp4 inteiro: bastão nítido, sem borrão, mão sempre fechada no bastão, rosto livre.

### Passo 4. Folha por estado (G3)
De `C:\Users\rafae\AppData\Local\Temp\tools`, um estado por vez (backup antes: `fps_backup\<skin>\`):
- **Kael:** `node skin/skinset.js <skin> <estado> <url|mp4>` com estado ∈ `run idle attack spin death pistol_idle pistol_run pistol_shoot`.
  Faz: baixa → 24 fps → `polevid_s.js` (ou `pistolrip_s.js`) → registra o 1º quadro na ref → xf do R → `loopsheet.js` (run 8, idle 12, attack 17, spin 17, shoot 24; pés pelo R) → `kaiaph/despeck.js` → `_grip_src.json` → `compose_s.js` (era2_t1, attack_wide, spin 448, pistola era3-6). Morte: `deathsheet_s.js` (18 quadros, 448).
  Variáveis úteis: `REUSE=1` (reaproveita o `_clean` sem baixar), `KEEP=1` (guarda o `_clean` para consertos), `KEEPMP4=1`, `IDX=1,9,...` (escolher quadros), `DX=<px>` (empurrar x), `SEED=258,399` (punho inicial), `DESPECK=<px>`, `NOCOMP=1`, `FRONT=1` (arma na frente).
- **Kaia:** `node kaiaskin/kaiaskin.js <skin> <estado> <url|mp4>` (precisa de `kaiaskin/<skin>/ratio.json`); morte alinha os pés pela menina com `kaiaskin/feetmatch.js`. Depois `bash kaiaskin/recompose.sh <skin>` (era2_t1) e `bash kaiaskin/regun.sh <skin>` (pistola das 4 eras).
Consertos (só código, custo 0):
- mão errada: ver com `node skin/gripview.js <skin> <st> <url>`; corrigir `node skin/fixgrip.js <skin> <st> i:x:y:ang[:b],...` ou só o ângulo `node skin/setang.js <skin> <st> i:ang,...`; mover só o ponto `node stagekit/movegrip.js <json> "f:x,y"`; recompor `node skin/recomp.js <skin> <st> [1]`.
- resto do bastão / borrão: `node skin/polewipe_s.js <body.png>` (`ONLY=i,j`), `ONLY=i,j node skin/keepbig.js <body.png>`, Kaia `kaiaskin/demag.js`, `kaiaskin/degreen.js`, `kaiaskin/patch.js`, `kaiaskin/lone.js` (+ `halo.js` para auréola).
- listra-fantasma no corpo: `stagekit/inpaint.js` / `stagekit/chest.js` com quadro doador limpo (7f938d7, 454ceb8); **editar a linha `const K=` (pasta da kael_cyborg) numa cópia** antes de usar em outra skin.
- giro com cabeça errada no q0: `node skin/headfix0.js <skin>`.

### Passo 5. Âncoras: máscaras, costas, pescoço, compostas sem cachecol
1. `node skin/masks_s.js <skin> [estados]` → `masks/kael_<st>_{mask.png,mask.json,head.json,hair.png}` e grava `back` no `_body.json` (chama `backanchor.js` com a cabeça da ref). Kaia: `bash kaiaskin/skinmasks.sh <skin> [estados]`.
   `backanchor.js` sozinho: `HEADJSON=<head.json> HOFF=<off> node backanchor.js <body.png> <body.json>` (procura o cachecol vermelho; skin sem cachecol precisa do HEADJSON).
2. Pescoço: `node neckset.js` (só confere; `OUTPNG=<arquivo.png>` gera a imagem) e depois `node neckset.js --write` → grava `"neck"` = `back.y − 24·cos(ang)` em todos os `_body.json` de skins e da Kaia. O jogo usa isso em `js/stage.js` (`neckRows`); sem o campo, procura o cachecol vermelho e erra em skin sem cachecol.
3. Compostas `_era2_t1` em skin **sem cachecol vermelho**: `compose2_neck.js` com `NECKS` = a linha do pescoço por quadro:
   ```
   NECKS=$(node -e "console.log(require('<...>/kael_idle_body.json').neck.join(','))") PADL=0 PADR=0 node compose2_neck.js <body.png> <body.json> C:/Users/rafae/Desktop/fps/assets/weapons/era2_t1.png era2_t1 <saida_era2_t1.png> 0
   ```
   (`PADL=0 PADR=0` em run/idle/attack de 256; sem eles = 448 para `attack_wide` e `spin`; último argumento `1` = arco do golpe.) Com cachecol: `compose_s.js` já fez.

### Passo 6. Avatar
`node skin/avatar_s.js <skin>` → `assets/hero/avatar/kael_<skin>.png` (256, transparente, mesmo recorte do `kael_phase0`) + entrada em `avatars.json`. Alternativa pela guia sem bastão: `node skin/avatar_free.js <skin> <free.png>`. Kaia: `node kaiaskin/avatar.js <skin>`. Ícone de loja e prévia: código.

### Passo 7. Validação (G3/G4) e conferência — ver a seção abaixo.

### Passo 8. Commit, matriz, QA
Commit só dos próprios arquivos (`VALIDACAO_COMUM.md` §8). Matriz: linha da skin com ✓/✗ e arquivo:linha. G5: entregar ao QA (`VALIDACAO_COMUM.md` §7). Atualizar `docs/STATUS_DONO.md`.

---

## VALIDAÇÃO E QUALIDADE

Herói padrão de comparação: Kael = `assets/anim/hyb/R/kael_<st>_body.json` (pistola: `hyb/R/kael_pistol_<st>_body.json`); Kaia = `assets/anim/hyb/kaia/kaia_<st>_body.json`. `artcheck.js` está em `VALIDACAO_COMUM.md` §4.

| Critério | Tolerância | Como provar (comando) |
|---|---|---|
| **Mesma coreografia do padrão (regra nova)** | grip **≤ 4 px** e **≤ 8°**, pés **≤ 3 px**, costas (back) **≤ 4 px**, em TODO quadro; mesmo nº de quadros e célula | `node artcheck.js cmp <skin>/kael_<st>_body.json C:/Users/rafae/Desktop/fps/assets/anim/hyb/R/kael_<st>_body.json 4 8 3 4` para os 8 estados → `OK n/n` |
| Laço sem salto (correr, parado, pistola parado/correr) | último→primeiro ≤ 1,5 × mediana dos vizinhos | `node artcheck.js loop <body.png> <body.json> 1.5` |
| Mão no grip em 100% dos quadros | desenho opaco a ≤ 6 px do grip | `node test/sys/stagekit.test.js` ("mão no grip"); olho em `skin/view.js` (ponto amarelo na mão) |
| Pés no chão | ponto mais baixo = feetY ± 4 px (parado), ± 6 px (correr, golpe) | `node test/sys/stagekit.test.js` ("pés no chão") |
| Cabeça e grip iguais ao padrão | cabeça: `masks/kael_<st>_head.json` × `hyb/R/masks/kael_<st>_head.json` ≤ 4 px (a confirmar: ainda sem comando próprio; comparar com `node -e` os campos x,y); grip: linha 1 | `artcheck cmp` + `node skin/view.js <skin> <folha>` |
| Sem borrão e sem rastro-fantasma | semitransparente no interior ≤ 30 px/quadro | `node artcheck.js px <body.png> <body.json>` e `node stagekit/holes.js <body.png> <cellW>` |
| Sem cor fora da paleta | ≤ 0,5% dos pixels opacos fora da paleta da guia (limite a calibrar) | `node artcheck.js pal <body.png> <guia_da_skin.png> 0.5` |
| Contorno limpo, sem franja verde | verde ≤ 20 px/quadro; magenta = 0 | `node artcheck.js px ...` e `node kaiamount/pinkcount.js <folhas>` (magenta 0) |
| Tamanho e escala iguais aos irmãos | mesmo `frames`, `w`, `h` do padrão; altura do corpo ±3 px | `artcheck cmp` (linha "FALHA formato"); `node kaiaskin/parity.js <skin>` (Kaia: nomes e campos iguais aos da menina) |
| Nada flutua | 0 pedaço solto não ligado ao corpo | `node artcheck.js px` + olho na `_conferencia.png`; conserto `skin/keepbig.js` |
| Sem asa desenhada | 0 | olho na guia (G1) e na conferência; Kael Anjo: só a pasta `_nowing` vale com item de asa (`skin/nowing_apply.js`; stagekit confere a pasta completa) |
| Criança, nada sensual | — | olho do Arte no G1 e do dono no voto; QA no G5 |
| Grade/CSS intactos | 0 falha | `node test/paineis/sheetcss.test.js` e `node test/e2e/sheetgrid.js` |

Todos os testes do repositório: um de cada vez (`VALIDACAO_COMUM.md` §5). Stagekit tem de terminar sem FALHAS e sem AVISOS novos.

**Folha de conferência para o dono:** `node skin/conf.js <skin>` → `assets/anim/skins/kael_<skin>/_conferencia.png` (8 linhas, arma posta, chão marcado). Junto, para o PO: `node skin/view.js <skin> kael_attack_body` e `kael_spin_body` (padrão em cima, skin embaixo). Kaia: `kaiaskin/cmpview.js` por estado (folha única: a confirmar).

**Reprova na hora:**
- qualquer estado com `artcheck cmp` fora da tolerância (golpe e giro primeiro: foi onde as skins antigas erraram 75-160 px);
- vídeo livre da skin (não derivado do vídeo do padrão);
- asa ou capa-asa; arma pintada no `_body`; magenta > 0; franja verde visível; listra do bastão no corpo;
- adulto, "crescido", sensual; rosto cortado pela arma (`&neck=0` × padrão no G5);
- número de quadros ou célula diferente do padrão.

**G5:** depois do commit, mandar ao QA: `Skin <nome> · <hash> · assets/anim/skins/<pasta>/ · parado, correr, golpe, giro, morte, pistola ×3; Kael/Kaia; armas era0_t0, era3_t0, era6_t2; telas Aparência, Equipamento, Batalha, Derrota, Perfil, Arena; &neck=0 × padrão`. O QA segue `docs/qa/VALIDAR_ARTE.md` §4.1. As skins estão atrás de chave (`skinsOn=false`, js/sys/appearance.js): o QA usa o Modo dono ou `S.skinEq`.
