# ARTE → JOGO: o que ligar (lista para o engenheiro, fps-c8)
Feita pela fps-e2 a pedido da Arte (fps-75/fps-ff), 12/11/2026. Para cada arte: **caminho → o que é → formato do .json → quem pede no jogo**.
Regras do dono que valem para tudo: nada flutua nem quica; pés/patas no chão (feetY); arma NA MÃO (direita, lado esquerdo da tela) e por cima da montaria;
nada de fundo sobrando. Conferido pixel a pixel pela fps-e2 (QA abaixo, §8). Não mexer em pastas `_aprovado_original` nem `_reprovado`.

## 1. Armas por raridade — `assets/weapons/`
| Raridade (`r`) | Arquivo | Chave no meta.json |
|---|---|---|
| 0 Básico | `eraN_t0.png` | `eraN_t0` |
| 1 Raro | `eraN_raro.png` | `eraN_raro` |
| 2 Épico | `eraN_t1.png` | `eraN_t1` |
| 3 Mítico | `eraN_mitico.png` | `eraN_mitico` |
| 4 Lendário | `eraN_t2.png` | `eraN_t2` |
| 5 Divino (eras 7-8, `Sys.stats.maxR()===5`) | **sem arte própria**: usar a do Lendário (`eraN_t2`) até existir | — |
- `meta.json[chave]` = `{type:'melee'|'gun', grip:[fx,fy] (fração da imagem), angle (graus), len (fração), muzzle?:[fx,fy] (só arma de fogo)}`.
- No código: `js/battle.js` já tem `W_RKEY=['t0','raro','t1','mitico','t2']` + `wKey/wPng` (v0.12.5) para a ARMA; `tierOf` (r → t0/t1/t2) continua só para a ROUPA (hero).
  O `Math.min(4, r)` do `wKey` já manda o Divino para o Lendário: certo.
- `meta.json` completo: as 10 entradas das eras 7-8 entraram em 12/11 (Arte; calibradas pela era2_t1, arma cai na mão). `undefined.png` (duplicata) apagado.

## 2. Pets — `assets/anim/pets/`
- Arquivo: `<sprite><estágio>_<estado>.png/.json`. `estágio` = `''` (filhote) · `_mid` (Nv 30) · `_evo` (Nv 60). `estado` = `run` (8 quadros) · `idle` (12) · `atk1` (12).
  Só o FILHOTE dos 5 pets antigos tem também `atk2`/`atk3` (opcionais).
- `.json`: `{frames, fps:12, w:512, h:352, padLeft:96, padRight:160, padTop:64, padBottom:32, feetY:307, loop, xf, grip}`; folha = `frames` células lado a lado.
- **Quem diz o que desenhar:** `Sys.pet.battleInfo(S, host).draw` (com `Sys.pet.setV17(true)`):
  `{sprite, base, stageSuffix, sheets:[base_run, base_idle, base_atk1(, base_atk2, base_atk3)], extra, cell:{w:512,h:352,feetY:307,fps:12}, fly, behind:'hero'}`.
  `fly` = papagaio (voa por desenho; sombra por código). O estágio vem do save (evolução 30/60 da tela 17b).
| Espécie (id no save) | sprite | Raridade |
|---|---|---|
| wolf | `era0_mammoth` (Mamute) | Básico |
| owl | `era1_sphinx` (Esfinge) | Raro |
| drake | `era2_dragon` (Dragão) | Épico |
| parrot | `era3_parrot` (Papagaio-fênix, voa) | Épico |
| golem | `era4_mechdog` (Cão mecânico) | Mítico |
| underworld | `era7_cerberus` (Cérbero) — NOVO | Mítico |
| celestial | `era8_pegasus` (Pégaso) — NOVO | Lendário |
| prism | `prism_fox` (Raposa de cristal) — NOVO, não sai de ovo | Divino |
- Página de conferência: `test/anim/petsanim/` (filhote), `?s=mid`, `?s=evo` — já com os 3 novos.

## 3. Chapéus por era — `assets/anim/equip/hats/hats.json`
- `{note, hats:{era0..era8:{name, file:'hat_eraN.png', w, h, pivot:{x,y}, res, hideHair}}}`. Chapéu do item de cabeça da era N = `hats['era'+N]`.
- Desenho: na âncora de cabeça do quadro (§5): `translate(x,y) rotate(ang graus) scale(s/res) drawImage(png, -pivot.x, -pivot.y)`.
- `hideHair:true` (roman, knight, army, scifi, demon) → apagar o cabelo com a máscara de cabelo (§6) ANTES do chapéu.
- Camada no `Sys.appearance.layers(S, host)`: `{layer:'hat', key:'item/hat/e<era>_r<r>', era, r}` → use a era para achar o chapéu.

## 4. Óculos e máscaras — `assets/anim/equip/cos/cos.json`
- `{note, items:{<id>:{layer:'glasses'|'mask', file:'<id>.png', w, h, pivot:{x,y}, res}}}`. Mesma âncora e mesmo desenho dos chapéus.
- ids da Arte = ids do `Sys.appearance` (alinhados hoje): óculos `goggles`, `visor`; máscaras `ninja`, `carnival`.
  Camada: `{layer:'glasses'|'mask', key:'cos/<id>', id}` → `assets/anim/equip/cos/<id>.png` + `cos.json.items[id]`.
- Ordem das camadas (de baixo para cima): asa, corpo, botas, colete, chapéu, óculos, máscara, arma (`Sys.appearance.DATA.layerOrder`).

## 5. Âncora da cabeça por quadro — `assets/anim/hyb/<R|phase1|phase2|phase3>/masks/kael_<estado>_head.json`
- Fases: `R` garoto · `phase1` adolescente · `phase2` adulto · `phase3` guerreiro lendário (`Sys.level.stage(S,host).stage` 0-3).
- Estados (8, em todas as fases): `run, idle, attack, spin, die, pistol_idle, pistol_run, pistol_shoot`.
- `{frames, w, note, head:[{x, y, ang, s, e, ok}]}` — um item por quadro, coordenadas na CÉLULA da folha do jogo.
  Desenho: `translate(x,y) rotate(ang graus) scale(s/res) drawImage(png, -pivot.x, -pivot.y)`. **`ok:false` → não desenhar chapéu/óculos/máscara nesse quadro.**
- Em `die` e `spin` a âncora anda 30-58 px entre quadros: é o movimento (queda/giro); conferido pela Arte que o chapéu acompanha.

## 6. Máscara do cabelo — `masks/kael_<estado>_hair.png` (mesma pasta)
- Mesma grade de células da folha do estado. Quando o chapéu tem `hideHair`, apagar o cabelo: `ctx.globalCompositeOperation='destination-out'` com a máscara,
  depois voltar a `source-over` e desenhar o chapéu. Existem para todos os estados nas 4 fases (a Arte gerou os que faltavam em 12/11).

## 7. Colete e botas — `masks/kael_<estado>_mask.png` (+ `.json` nos de pistola)
- Canal **R = colete**, canal **B = botas** (intensidade = força), alfa = cobertura. Pintar: cor = luminância × tinta do material escolhido.
- O `.json` (pistola) traz `{frames, fps, w, h, padLeft, sheet}`: a célula da pistola é 448×256 (a do corpo normal é a da folha do estado).
- O garoto (`R`) ganhou as máscaras de pistola em 12/11.

## 8. Montarias (Kael montado) — `assets/anim/mounts/`
- `kael_<montaria>_<estado>_body.png/.json` (Kael SEM arma, com `grip` por quadro para a arma trocável) e `kael_<montaria>_<estado>_era2_t1.png/.json`
  (com a espada de referência). Estados: `idle` (12), `run` (8), `attack` (17). Célula 512×352, patas em `feetY:339`.
- Aura por estrela em folhas `kael_<montaria>_<estado>_<N>star.png/.json` (`run`/`idle`; cavalo, pônei, tigre e serpe 1-5; lobo e grifo 3 e 5): o brilho/partícula
  desce até ~7 px abaixo das patas (é a aura, os cascos ficam no chão). Estágio da aura: `Sys.mount.auraOf(estrelas)` / `Sys.mount.battleInfo(S).aura`
  (1 sem · 2-3 brilho · 4 fumaça · 5 completa).
| id no `Sys.mount` | Montaria | Raridade | Folhas |
|---|---|---|---|
| `pony` | Pônei | Básico | idle/run/attack + 1-5★ |
| `horse` | Cavalo de guerra | Raro | idle/run/attack + 1-5★ |
| `wolf` | Lobo de guerra (oferta de 1ª compra) | Épico | idle/run/attack + 3★/5★ |
| `griffin` | Grifo dourado | Épico | idle/run/attack + 3★/5★ |
| `mythic` | Tigre de cristal (nome aprovado pelo PO em 12/11; o dono ainda pode trocar no voto) | Mítico | idle/run/attack + 1-5★ |
| `wyvern` | Serpe dourada | Lendário | idle/run/attack + 1-5★ |
- QA 12/11: arma na mão em todas (cavalo e pônei refeitos); patas no chão. Tigre `attack` 3-5 (ponta cortada) e risca no pônei: corrigidos e medidos de novo.
- Desenhar só com `Sys.mount.DATA.visual === true` (arte aprovada); o atributo vale antes.

## 9. Asas — `assets/anim/equip/`
- `wing_<id>.png` + `wing_<id>_L.png`/`_R.png` (metades) e `.json` `{cut, L:{root:[fx,fy], w, h}, R:{root, w, h}}`: raiz de cada metade presa às costas.
  ids: `angel`, `demon` (com metades), `dragon`, `energy`. Camada `wing` do `Sys.appearance` (fica atrás do corpo; skin de asa vence o item).

## 9b. Kaia (heroína jogável) nas 3 fases — `assets/anim/hyb/kaia_phase1|2|3/`
- Mesmo formato das fases do Kael: célula **448×256**, padLeft 96, **pés em y 243**, 12 fps. Pasta por fase: `kaia_phase1` adolescente · `kaia_phase2` adulta ·
  `kaia_phase3` guerreira (a menina das eras iniciais fica em `assets/anim/hyb/kaia/`, célula 256×256, pés 243).
- Arquivos: `kaia_{run,idle,attack,spin}_era2_t1.png/.json` (com a espada de referência) + `_body` (sem arma, com `grip` por quadro para a arma trocável) ·
  `kaia_die_body` · `kaia_pistol_{idle,run,shoot}_era5_t0` + `_body`. Escolha da pasta: `Sys.appearance.sheets(S, host)` → `{dir, prefix, masks}` pelo `S.hero` e pela fase do `Sys.level` (vale para Kael e Kaia).
- Máscaras da Kaia (12/11): `<pasta>/masks/kaia_<estado>_{head.json, hair.png, mask.png, mask.json}`, mesmo formato do Kael (§5-7; `mask.json.sheet` diz a folha).
  Menina: run/idle/attack; fases: os 8 estados. Botas de aço da adulta/guerreira pintáveis. `e` alto (~130-180) é esperado (rosto diferente da referência).
  **Pendência:** adulta (`kaia_phase2`) com âncora no quadril em idle, pistol_idle, pistol_shoot e parte de attack/spin/die — em correção pela Arte.
- QA 12/11: pés no chão em todas (242-244). Aceitos (iguais ao Kael aprovado): o arco do golpe e o cano da guerreira passam da borda; espada some 1-2 quadros
  de costas no giro. Observação: a GUERREIRA (fase 3) tem o topo do cabelo encostado em y 0 em todos os quadros — igual ao Kael guerreiro aprovado (12/12).

## 10. QA feito pela fps-e2 (12/11, medição por pixel + olho nos casos suspeitos)
- Pets (8 espécies × 3 estágios): pés em 304-308 (feetY 307), sem fundo, sem corte. Papagaio fora do chão = voo aprovado. Pégaso adulto parado: só as asas mexem.
  Raposa `_mid_atk1` quadros 6-7: neblina cinza corrigida pela Arte (sobra o rastro de brilho do golpe, que é do ataque).
- Montarias: patas no chão em todas. Arma na mão nas 6 montarias (cavalo e pônei refeitos em 12/11). Tigre e pônei: correções da Arte medidas de novo, OK.
- Kaia: pés no chão; quadro 9 do golpe tem o arco desenhado (efeito, aprovado).
- Ferramentas (para repetir a conferência a cada folha nova): na pasta temporária da fps-e2 — `qa_pets.js`, `qa_sheet.js` (pés, quique, borda, sujeira, arma solta).
