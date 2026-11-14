# Arte: ícones de habilidade com recarga (B7) e efeito da Investida montada (B6): peças e estimativa (Arte, 14/11)

Origem: docs/LOM_VS_EONBOUND.md §4 (B6 "Investida montada a cada ~12 s: o Kael avança montado e acerta em área (golpe dele)"; B7 "Ícones de habilidade
com anel de recarga na batalha (3 do Grimório)") e §5 item 11. A tela é do Engenheiro.
**Nada gerado.** Este documento só prepara o pedido. Cada lote só sai com o OK do PO/dono (voto com caixinhas, uma por imagem).
Preços: nano_banana_pro ~2 por imagem (grade 2×2 ou 3×3 = 1 imagem); seedance_2_0 `mode:"fast"`, `generate_audio:false`, 480p, 4 s ~4 por vídeo
(sem esses dois parâmetros o mesmo vídeo custa 12) (docs/arte/CUSTO_POR_ITEM.md).
Regras: nada sensual (jogo com menores), nada flutua, arma na mão direita (arma por código no grip, nunca pintada), ouro escasso (nenhuma moeda ou
pilha de ouro), sem sorteio, sem texto nos ícones, sem magenta/rosa.

---

## 1. O que já existe (levantamento)

### 1.1 Habilidades do jogo
| Grupo | Ids e nomes | Onde |
|---|---|---|
| Golpes da arma (por era da arma) | `s1` Básico (automático), `s2` Especial (recarga `BAL.s2Cooldown`, 6 s no protótipo), `s3` Ultimate (energia 0-100%) | js/fullbattle.js:264-268, :386-389; docs/proto/v2/Batalha.html:309 |
| Grimório das Eras (18 magias, 3 equipadas, lançam sozinhas com recarga `cd` em s) | era 0 `rollingStone` Pedra Rolante (10), `ancestralFire` Fogueira Ancestral (16) · era 1 `bronzePhalanx` Falange de Bronze (18), `minotaurSpear` Lança do Minotauro (12) · era 2 `knightCharge` **Investida do Cavaleiro** (14), `royalBreath` Sopro do Dragão Real (15) · era 3 `cannonball` Bala de Canhão (18), `ghostFog` Névoa do Capitão Fantasma (20) · era 4 `gearSpin` Engrenagem Giratória (10), `steamBoiler` Caldeira a Vapor (18) · era 5 `droneRain` Chuva de Drones (14), `medKit` Kit Médico (20) · era 6 `plasmaRay` Raio de Plasma (14), `ionShield` Escudo de Íons (22) · era 7 `underChains` Correntes do Submundo (18), `infernalFlame` Chama Infernal (16) · era 8 `judgeBlessing` Bênção do Juiz (22), `lightLance` Lança de Luz (16) | js/sys/grimoire.js:33-51 (chave `DATA.on=false`) |
| Investida montada (B6) | **não existe** em código nem em dados: nenhum id, recarga, dano ou área (Sys.mount não tem habilidade; js/sys/mount.js) | só docs/LOM_VS_EONBOUND.md |

### 1.2 Ícones prontos (custo 0)
| Ícones | Arquivos | Formato | Quem lê |
|---|---|---|---|
| Golpes da arma, 9 eras × 3 | `assets/icons/era<0-8>_s<1|2|3>.png` (s1 aro prata, s2 aro azul, s3 aro dourado) | 256×256 PNG (paleta), item em ~232 | js/fullbattle.js:388 (troca pela era da arma) |
| Grimório: 18 magias + `ink`, `page`, `book_open` | `assets/icons/grimoire/<id>.png` (aprovados pelo dono, 1d0bffd) | 256×256 PNG RGBA, medalhão com aro na cor do tipo | `Panels.defs.grim.iconOf(id)` (js/p_grim.js:43) → js/grimhud.js:30 |
| Montarias (16) | `assets/icons/mounts/<id>.png` (horse, pony, wolf, griffin, mythic, wyvern, war_mecha, giant_phoenix, ...) | 256×256 | telas de montaria |

### 1.3 Recarga na tela (já é código)
- Botão do Especial (s2): véu escuro de baixo para cima + número de segundos + brilho azul quando pronto (js/fullbattle.js:266, :389).
- Ultimate (s3): véu por energia + "PRONTA" (js/fullbattle.js:268, :386-387).
- Grimório: coluna de 3 ícones de 48 px com **anel de recarga**, segundos no centro e aro dourado quando pronto, só leitura (js/grimhud.js, 8f94420/b5d51d4).
  Lê o ícone aprovado; sem ícone, círculo com a inicial.

**Conclusão do item (1): toda a arte dos ícones com recarga já existe.** Anel, número, véu e brilho de "pronto" são código. Só falta arte se a Investida
montada ganhar um botão próprio no HUD (peça A abaixo, opcional).

### 1.4 Investida montada hoje
- Não é desenhada. O herói montado só tem: `assets/anim/mounts/<kael|kaia>_<montaria>_<idle|run|attack|shoot>_body.png/.json`
  (8 montarias × 2 heróis; attack = 17 quadros, 6 colunas, 12 fps, célula 512×352, `feetY` 339, `grip` por quadro). Arma no grip por código
  (js/mountfx.js:231-249), aura por estrela por código (`MOUNT_AURA`, js/mountfx.js:86).
- Efeitos que o código já tem e servem para a arrancada: `ring()`, `burst()`, `dust()`, `fnShock` (onda no chão), `B.shake`, `stunEnemy()` (js/battle.js:192, :279, :766).

### 1.5 Formatos de folha de efeito que o jogo já usa
| Família | Pasta | Célula | Quadros / colunas / fps | Âncora | Mistura |
|---|---|---|---|---|---|
| Ultimate (tela cheia) | `assets/anim/ult/<era<N>_ult|<família>_legend>` | 384×216 | 49 / 8 / 12, `loop:false` | `"screen":"full"` | `lighter` (eras 0, 3, 5 `source-over`) |
| Aura da Forja | `assets/anim/aura/aura<N>` | 256×320 | 16 / tira / 12, em laço | `anchor:[0.5,1]` (pés) | `lighter` |
| Efeito no herói (subir de nível, evolução) | `assets/anim/fx/levelup_fx`, `evolve_*_fx` | 448×384 | 22 ou 38 / 8 / 12, tocar 1 vez | `anchorX` 224, `feetY` 352 | (fundo transparente) |
| Projétil | `assets/anim/fx/proj_*` | 128×32, 160×160 | 5-8 | `pivot` | — |

**A folha nova da Investida, se aprovada, fica em `assets/anim/fx/`** (molde `levelup_fx`: herói desenhado pelo jogo, folha só com o efeito).

---

## 2. Peças

Recomendação da Arte: **mínimo = 0 crédito** (tudo por código, seção 3). As peças A e B são opcionais, só com o voto do dono.

| # | Peça | Saída | Tamanho e formato | Como | Créditos |
|---|---|---|---|---|---|
| — | Ícones das 18 magias, s1/s2/s3 das 9 eras | já em `assets/icons/grimoire/` e `assets/icons/era<N>_s<k>.png` | 256×256 PNG | prontos | **0** |
| A | Ícone da Investida montada (só se ela tiver botão/indicador no HUD) | `assets/icons/mount_charge.png` (+ reserva `mount_charge_b.png`) | 256×256 PNG transparente, item em ~232, legível em 48 e 64 px | 1 grade 2×2 (2 opções para o voto + 2 reservas); recorte `icn/split4.js` | **~2** (até ~3) |
| A′ | Alternativa a A, custo 0 | o ícone da montaria equipada `assets/icons/mounts/<id>.png` dentro do aro do HUD | — | código | **0** |
| B1 | Rastro da arrancada (poeira no chão + linhas de velocidade atrás do herói) | `assets/anim/fx/mount_charge_trail.png/.json` | célula 448×192, 8 quadros, 8 colunas, 12 fps, em laço; `anchorX` = ponta da frente (≈ 400), `feetY` 176 | 1 vídeo seedance (fundo preto, luminância → alfa pelo `ultsheet.js`) | **~4** |
| B2 | Impacto da investida (onda no chão + poeira que sobe e assenta, na frente do herói) | `assets/anim/fx/mount_charge_hit.png/.json` | célula 448×384, 16 quadros, 8 colunas, 12 fps, tocar 1 vez; `anchorX` 224, `feetY` 352 (pés do inimigo da frente) | 1 vídeo seedance (fundo preto) | **~4** |
| B0 | Quadro inicial dos vídeos B1/B2 (se o seedance pedir imagem) | fora de assets (pasta de trabalho) | 16:9 | 1 imagem nano_banana_pro por vídeo | **~4** (0 se o vídeo sair só de texto) |

Herói montado durante a investida: **reusa** `_run_body` (arrancada acelerada) + `_attack_body` (golpe), das 8 montarias × Kael e Kaia, com a arma
no grip por código: **0 crédito, nenhuma folha nova**. Skins montadas continuam no corpo padrão (achado N4 da matriz).

Montar tudo fora de `assets/` (salvar em `assets/` recarrega o celular do dono) e copiar só o pronto. Avisar o Engenheiro quando os arquivos chegarem.

---

## 3. O que é código (Engenheiro / Sistemas) e o que é arte

**Código (Sistemas):** dados da Investida montada (id sugerido `mountCharge`, recarga ~12 s, dano e área dentro da regra de coerência ≤ 3× ATQ,
se atordoa ou não, se depende da estrela ou do nível da montaria), em `Sys.mount` ou num módulo próprio, com chave desligada.

**Código (Engenheiro):**
1. Investida: o herói montado acelera para a frente com a folha `_run_body` (fps ×1,5), toca `_attack_body` no inimigo da frente e volta ao lugar;
   rastro com `dust()` no chão + linhas de velocidade, impacto com `fnShock` + `ring()` + `B.shake`, cor = `MOUNT_AURA` da estrela. Se B1/B2 forem
   aprovadas, trocar o desenho por código pelas folhas (mesmo leitor do `levelup_fx`: `anchorX`/`feetY`, `blend:lighter`).
2. Recarga na tela: o indicador da Investida no mesmo molde do `grimhud.js` (anel, segundos, aro dourado quando pronta; só leitura, lança sozinha),
   ou ao lado do s2. Ícone = peça A ou A′.
3. Ligar a coluna de magias: já pronta (js/grimhud.js), depende só da chave do Grimório.

**Arte:** só A e/ou B1/B2, se o dono quiser além do código. Conferência: `ultcontact.js` (6 quadros), `ultwhite.js` (clarão), `cs.js` (ícone a 64 px
ao lado de `era2_s2.png` e `grimoire/knightCharge.png`), G5 no QA.

---

## 4. Prompts prontos (só gerar com o OK)

### A. Ícone da Investida montada (`nano_banana_pro`, 1:1, "2k", 1 imagem)
Referências, nesta ordem: 1) folha de estilo com `assets/icons/era2_s2.png`, `era5_s2.png`, `grimoire/knightCharge.png`, `grimoire/rollingStone.png`
(montar com `newpets/cs.js`, custo 0); 2) `assets/icons/mounts/horse.png` (assunto).
```
Game UI skill icons, 2x2 grid of four separate round medallion icons on a flat pure green (#00FF00) background with wide green gaps
between them, matching EXACTLY the style of the first reference image (thick metallic ring, bold dark outline, painted chibi-RPG mobile
game style, centered subject, no text). Theme: "mounted charge", a cavalry rush attack, the mount from the second reference.
Top-left: a galloping horse head and chest seen from the side, charging to the right, with a short dust cloud at its hooves on the
ground line and three bold speed streaks behind it; teal ring.
Top-right: a lance tip and a horseshoe crossed over a ground shockwave arc, dust kicked up from the ground; teal ring.
Bottom-left: variation of the top-left icon with an orange ring.
Bottom-right: variation of the top-right icon with an orange ring.
No riders, no characters, no faces, no text, no coins, no gold piles, no loose sparks or stars floating in the air (dust only touching
the ground line). Nothing sensual. No frames other than the round medallions. No green inside the icons. No magenta or pink.
```
Gate G1: 4 medalhões separados; sem verde dentro; aro diferente do s2 (azul) e do s3 (dourado); legível a 48 px. O dono vota 1 das 4 (caixinha por ícone).

### B1. Rastro da arrancada (`seedance_2_0`, `mode:"fast"`, `generate_audio:false`, 480p, 4 s, 16:9)
Quadro inicial (se pedido; `nano_banana_pro`, 16:9): o mesmo texto com "single still frame, the first moment of the effect".
```
Side-view 2D game visual effect for a mobile RPG, camera fixed, ground line in the lower third: a fast horizontal dash trail moving to
the right. Brown-grey dust clouds roll along the ground line and settle back on it, plus bold white-blue speed streaks behind an
invisible rider (the space where the rider would be stays empty). The effect loops smoothly. Pure black background, no characters,
no animals, no faces, no text, no UI, no sparks or embers floating in the air, no coins, no gold.
```
Folha: `ffmpeg -vf fps=12` → escolher 8 quadros de um laço → `ultsheet.js <pasta> <saida>.png <saida>.json 448 192` (fora de assets/), json com
`frames 8, cols 8, fps 12, loop true, blend lighter, anchorX, feetY`.

### B2. Impacto da investida (`seedance_2_0`, mesmos parâmetros)
```
Side-view 2D game visual effect for a mobile RPG, camera fixed, ground line in the lower third: the impact of a mounted charge hitting
from the left. A semicircular shockwave ring spreads along the ground from the impact point, a burst of brown dust rises from the ground
and falls back down onto it, a short white flash at the impact point, then everything fades out. Plays once. Readable and not
blinding. Pure black background, no characters, no animals, no weapons, no faces, no text, no UI, no sparks or embers floating in the
air, no coins, no gold.
```
Folha: 16 quadros, 448×384, 8 colunas, 12 fps, `loop:false`, `blend:lighter`, `anchorX` 224, `feetY` 352. Conferir com `ultcontact.js`/`ultwhite.js`.

---

## 5. Estimativa de créditos

| Cenário | Peças | Créditos |
|---|---|---|
| Mínimo (recomendado) | tudo por código; ícones existentes; ícone da montaria como indicador (A′) | **0** |
| Só ícone próprio | A | **~2** (até ~3 com refação) |
| Ícone + efeito em folha | A + B1 + B2 (vídeos só de texto) | **~10** (até ~12) |
| Ícone + efeito com quadros iniciais | A + B0 ×2 + B1 + B2 | **~14** (até ~19 com 1 refação de vídeo) |

---

## 6. Perguntas em aberto

1. **Nome**: "Investida do Cavaleiro" já é a magia `knightCharge` do Grimório (a pé, com escudo) e "Investida sombria" é golpe do Lobo sombrio. A
   investida montada fica com esse nome (confunde no HUD) ou vira outro (ex.: "Arrancada", "Carga Montada")?
2. **Regras (Sistemas)**: recarga (~12 s?), dano e área (≤ 3× ATQ?), atordoa? Depende da estrela/nível da montaria ou é igual em todas? Vale na Arena e no chefe?
3. **Botão ou só efeito**: a Investida aparece no HUD com recarga (precisa da peça A ou A′) ou só acontece sozinha na luta? Onde (coluna do Grimório, ao lado do s2)?
4. **Ícone**: próprio (A, ~2) ou o da montaria equipada (A′, 0)? Se próprio, qual cor de aro (a Arte propõe verde-água; azul e dourado já são s2/s3)?
5. **Efeito**: só código (0) ou folhas B1/B2 (~8-12)? A Arte recomenda começar por código e só pagar se o dono reprovar a versão por código.
6. **Montarias voadoras** (grifo, serpe, fênix gigante): a poeira no chão serve, ou a investida delas é rasante com outro rastro (vento em vez de poeira)?
7. **Kaia no mítico** usa o golpe de espada (fallback do tiro montado): a investida segue a mesma folha `_attack_body`? (a Arte entende que sim.)
