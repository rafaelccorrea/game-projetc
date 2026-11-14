# Arte: matriz item × pronto (14/11/2026)

Regra: `docs/ARTE_PRONTO.md` (as colunas são as listas de lá, por tipo). Uma linha por item que EXISTE no jogo hoje; no fim, os itens atrás de chave desligada.
✓ = arte + código conferidos no disco/código hoje · ✗ = falta (nota com arquivo:linha e de quem é: **ARTE**, **CÓDIGO** = engenheiro, **TESTE** = QA).

## Montado sem arma (afirmação do PO)

**1. É verdade? Só nas TELAS. Na batalha, não.**
- A batalha (e Arena/Perfil/Era/Intro, que usam `drawHeroFull`) desenha o herói montado com `kael_|kaia_<montaria>_<estado>_body` (js/mountfx.js:57) e a **arma equipada no grip por código** (js/mountfx.js:231-249: `wPng(ws)` + `meta.json` + `M.grip[fi]`, dedos e cabeça por cima, igual a pé). Comentário do topo, js/mountfx.js:4: "Kael SEM arma; grip por quadro".
- Conferido nos PNG (sharp, quadros 0 a 16): `_body` **não tem espada** (horse idle, pony attack inteiro, wolf/mythic attack, Kaia horse/griffin/wyvern). O `_era2_t1` é o composto com a espada Épica da era 2 pintada.
- Os 39 `_body.json` (6 montarias × Kael/Kaia × idle/run/attack + Fênix do Kael) têm `grip` e `back` em **100% dos quadros** (12/8/17).
- **Onde o PO tem razão**: telas que ainda leem `kael_<m>_idle_era2_t1.png` (espada medieval pintada, e SEMPRE o Kael, mesmo jogando com a Kaia):
  - js/p_mounts.js:156 e :348 (tela Montarias, palco e pré-carga);
  - js/p_offer.js:50 (vitrine/card da oferta);
  - js/artprev.js:17 (prévia da arte).

**2. Correção proposta**
| Opção | Folhas | Custo | Parecer |
|---|---|---|---|
| (a) apagar a espada do `_era2_t1` por código (inpaint como o do Ciborgue) e medir grips | 36 (6 × 2 heróis × 3 estados) | 0 crédito, ~1 dia de Arte | **Inútil**: o `_body` já é exatamente essa folha limpa, com grip |
| (b) refazer os vídeos com o bastão magenta (polevid) | 36 vídeos | ~144 créditos Higgsfield (4/vídeo) ou Kling grátis 18/clipe: 3 clipes/dia → 12 dias | **Já foi feito**: o `_body` atual saiu deste pipeline (cabeçalho de mountset.js) |
| **(c) RECOMENDADA: só CÓDIGO** — as 3 telas desenham `_body` + arma equipada no grip pelo mesmo caminho da batalha (`drawHeroFull`/StageKit, como a Arena js/p_arena.js:151) e com o prefixo do herói (`mountPrefix`) | 0 | 0 crédito | Engenheiro; teste sheetcss/stagekit nas telas |

Única arte montada que falta de verdade: **Kaia na Fênix gigante** (`kaia_giant_phoenix_{idle,run,attack}_{body,era2_t1}`): 3 vídeos pela opção (b) = ~12 créditos Higgsfield ou 54 dos 66 grátis do Kling (1 dia). A Fênix está desligada.

**3. Ferramentas** (C:\Users\rafae\AppData\Local\Temp\tools)
- `mountset.js` ✓ (vídeo com bastão → polevid → loopsheet → `_body` + compose2 → `_era2_t1`); `polevid.js` ✓; `stagekit/` ✓; `riderless/` ✓ (montaria sem cavaleiro).
- Limpeza do Ciborgue ✓: `stagekit/inpaint.js` (fantasma da arma no golpe), `stagekit/chest.js` (faixa no grip, giro), `stagekit/sk_detail.js`.
- **Fênix gigante (feita com bastão magenta)**: `kael_giant_phoenix_{idle,run,attack}_body.json` com grip+back em 12/12, 8/8 e 17/17 quadros, PNG sem espada. Prova que a opção (b) funciona (é o mesmo método das 6 de hoje).

**Outro achado montado (ARTE/decisão do PO)**: arma de FOGO montada (pólvora, revólver, fuzil e plasma Básico/Raro) é desenhada no grip, mas o golpe montado é o golpe de espada (não há folha montada de tiro). Ver N2.

---

## Ordem
Pelo que o jogador vê primeiro: era N = fases 10N+1..10N+10; desbloqueios por nível em js/sys/level.js:24 (pets 20, montaria 38, asa 50). Para encaixar nível em era usei a tabela de docs/CURVA_9_ERAS.md (proposta: Nv 20 ≈ era 1, Nv 38 ≈ era 2, Nv 50 ≈ era 3). Dentro da era, raridade crescente.

Notas comuns (citadas nas tabelas):
- **N1 — CÓDIGO**: telas da montaria com a espada pintada e sempre o Kael (js/p_mounts.js:156, :348; js/p_offer.js:50; js/artprev.js:17). Batalha ✓.
- **N2 — ARTE (decisão do PO)**: arma de fogo montada sem pose de tiro: a pistola balança no golpe de espada da folha montada (js/mountfx.js:231-240).
- **N3 — TESTE**: nenhum registro de conferência do QA na tela por item (regra 3 do ARTE_PRONTO). Os testes de folha existem (test/sys/stagekit.test.js: grip, costas, pés; test/e2e/weapons.js: família × raridade × era; test/e2e/mountfiles.js, petaura.js, petfront.js) mas "visto pelo QA" não está anotado.
- **N4 — ARTE/PO**: as skins não têm folha montada; montado usa o corpo padrão (js/mountfx.js:63, `mountArt:false` em js/sys/appearance.js). Precisa de folha por skin × montaria ou paliativo aprovado pelo dono (não achei aprovação em docs/ nem reports/).

## 0. Corpo padrão (base de tudo; não é item, mas toda arma passa por ele)
| Herói | A pé (parado, correr, golpe, giro, morte, pistola ×3, arco, bumerangue) | Montado (6) | Asa (costas + morte) | Arma | Avatar/telas | QA |
|---|---|---|---|---|---|---|
| Kael padrão (hyb/R) | ✓ todos com grip/back por quadro; morte com back, arma cai por código | ✓ | ✓ | ✗ N1 | ✓ kael_phase0 | ✗ N3 |
| Kaia padrão (hyb/kaia) | ✓ (giro com 15 quadros) | ✓ | ✓ | ✗ N1 | ✓ kaia_phase0 | ✗ N3 |

## 1. Itens no jogo, na ordem

Arma = família × raridade. Arquivo `assets/weapons/era<N>_<t0|raro|t1|mitico|t2>` = Básico/Raro/Épico/Mítico/Lendário (js/battle.js:704). Ultimate: Básico–Épico folha-base `ult/era<N>_ult`, Mítico = base reforçada por código, Lendário = `ult/<família>_legend` (ligado: js/battle.js:509-510, `ultTier` em js/sys/stats.js:31).
Colunas da arma: **Ícone** · **Mão** (Kael e Kaia, todas as skins, parado/correr/golpe/giro/morte) · **Montado** · **Ult/raridade** · **Forja** (aura no herói) · **Prévia** (Equipamento, Forja, Invocar, Loja, Perfil) · **QA**.

| # | Item | Ícone | Mão | Montado | Ult/rar. | Forja | Prévia | QA | Falta |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Clava Básico (era0_t0) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | N1, N3 |
| 2 | Clava Raro (era0_raro) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | N1, N3 |
| 3 | Clava Épico (era0_t1) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | N1, N3 |
| 4 | Clava Mítico (era0_mitico) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | N1, N3 |
| 5 | Clava Lendário (era0_t2) | ✓ | ✓ | ✗ | ✓ club_legend | ✓ | ✓ | ✗ | N1, N3 |
| 6-10 | Lança e gládio, era1 ×5 raridades | ✓ | ✓ | ✗ | ✓ gladius_legend | ✓ | ✓ | ✗ | N1, N3 |
| 11 | Pet Mamute (era0_mammoth), Nv 20 | | | | | | | | ver tabela de pets |
| 12 | Pet Esfinge (era1_sphinx), Nv 20 | | | | | | | | ver pets |
| 13-15 | Pets Lobo sombrio, Falcão, Pantera | | | | | | | | ver pets |
| 16-20 | Espada, era2 ×5 (Épico/Lendário com folhas compostas e rastro do Kael) | ✓ | ✓ | ✗ | ✓ sword_legend | ✓ | ✓ | ✗ | N1 (no Épico a espada pintada coincide, mas a Kaia continua vendo o Kael), N3 |
| 21 | Pet Dragão (era2_dragon) | | | | | | | | ver pets |
| 22-27 | Montarias, Nv 38: Pônei, Cavalo, Lobo, Grifo, Tigre de cristal, Serpe | | | | | | | | ver montarias |
| 28-32 | Pólvora (flintlock), era3 ×5: pistola | ✓ | ✓ pistol_* | ✗ | ✓ flintlock_legend | ✓ | ✓ | ✗ | N1, **N2**, N3 |
| 33 | Pet Papagaio-fênix (era3_parrot) | | | | | | | | ver pets |
| 34-42 | Asas, Nv 50 (9) | | | | | | | | ver asas |
| 43-47 | Revólver, era4 ×5 | ✓ | ✓ | ✗ | ✓ revolver_legend | ✓ | ✓ | ✗ | N1, **N2**, N3 |
| 48 | Pet Cão mecânico (era4_mechdog) | | | | | | | | ver pets |
| 49-53 | Fuzil, era5 ×5 | ✓ | ✓ | ✗ | ✓ rifle_legend | ✓ | ✓ | ✗ | N1, **N2**, N3 |
| 54-58 | Plasma, era6 ×5 (Básico/Raro = arma de fogo, `gunAtR0`; Épico+ = lâmina) | ✓ | ✓ | ✗ | ✓ plasma_legend | ✓ | ✓ | ✗ | N1, N2 (só Básico/Raro), N3 |
| 59-63 | Infernal, era7 ×5 | ✓ | ✓ | ✗ | ✓ infernal_legend | ✓ | ✓ | ✗ | N1, N3 |
| 64-68 | Celeste, era8 ×5 | ✓ | ✓ | ✗ | ✓ celestial_legend | ✓ | ✓ | ✗ | N1, N3 |

Conferido nas armas: 45 PNG + 45 ícones (assets/icons/weapons); grip do meta.json no cabo (conferi era0 ×5, era1/2/3 Raro); grip/back em todos os quadros das folhas `_body` do Kael, da Kaia e das 10 skins (parado, correr, golpe, giro, pistola ×3); morte sem grip de propósito (a arma cai por código, js/stage.js:329-331); aura da Forja (+4/+7/+10/+13) pelo drawAura, também montado (js/mountfx.js:211).

### Pets (Nv 20; batalha usa só idle/run/atk1)
Colunas: **3 estágios** (idle, run, atk1) · **Aura por estágio** · **Ícones ×3 + efeito de evolução** · **Frente/pés** · **Telas** (Pets, Batalha, Perfil, Arena) · **QA**.

| Pet | 3 estágios | Aura | Ícones + evolução | Frente/pés | Telas | QA | Falta |
|---|---|---|---|---|---|---|---|
| Mamute | ✓ (+atk2/3 no filhote) | ✓ (só no evoluído, tabela) | ✓ | ✓ | ✓ | ✗ | N3; aura só no estágio 3: PO confirma (js/sys/pet.js:399) |
| Esfinge | ✓ | ✓ (só no evoluído) | ✓ | ✓ | ✓ | ✗ | N3; idem |
| Lobo sombrio | ✓ | ✓ (médio e evoluído) | ✓ | ✓ | ✗ | ✗ | **CÓDIGO**: não aparece na tela de Pets (fora de PT_ART js/p_pets.js:43 e PT_ORDER :53); as imagens paradas já existem (assets/pets/pet_shadowwolf_{ref,mid,evo}.png, 73ea4f2). N3 |
| Falcão | ✓ | ✓ | ✓ | ✓ (voa 0,15) | ✗ | ✗ | idem (pet_falcon_*) |
| Pantera | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | idem (pet_panther_*) |
| Dragão | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Papagaio-fênix | ✓ | ✓ | ✓ | ✓ (voa) | ✓ | ✗ | N3 |
| Cão mecânico | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |

Aura do estágio desenhada na batalha desde d3f671f (js/petfx.js:84-98). Evolução: efeito na tela (js/p_pets.js:620-622).

### Montarias (Nv 38)
Colunas: **Kael e Kaia montados** (parado, correr, golpe) · **Arma na mão montado** · **Skins montadas** · **Asa montado** · **Aura por estrela** · **Sem cavaleiro + ícone** · **Código e telas** · **QA**.

| Montaria | Kael+Kaia | Arma | Skins | Asa | Aura | Sem cav. + ícone | Telas | QA | Falta |
|---|---|---|---|---|---|---|---|---|---|
| Pônei | ✓ | ✓ batalha | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1, N3 |
| Cavalo de guerra | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1, N3 |
| Lobo de guerra (oferta) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1 (é o da oferta: p_offer.js:50), N3 |
| Grifo dourado | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1, N3 |
| Tigre de cristal (mythic) | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1, N3 |
| Serpe dourada | ✓ | ✓ | ✗ | ✓ | ✓ | ✓ | ✗ | ✗ | N4, N1, N3 |

Aura: o jogo vai até **5★** (js/sys/mount.js:13 `maxStars:5`; MOUNT_AURA js/mountfx.js:73); o ARTE_PRONTO diz "1-7": corrigir o doc ou o módulo (PO).

### Asas (Nv 50)
Colunas: **L/R com batida em todas as skins** · **Montado** · **Na morte** · **Ícone e prévia** · **QA**. Todas: L/R + .json em assets/anim/equip, ícone em assets/icons/wings, âncora `back` em todas as folhas a pé, montadas e de morte; Kael Anjo usa a pasta `_nowing` com asa-item.

| Asa | L/R em todas as skins | Montado | Morte | Ícone/prévia | QA | Falta |
|---|---|---|---|---|---|---|
| Anjo | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Demônio | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Mariposa sombria | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Ossos | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Mecânica | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Sombra | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Gelo | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Tempestade | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |
| Fênix | ✓ | ✓ | ✓ | ✓ | ✗ | N3 |

As 7 novas estão ligadas: `goLive('wings')` sempre roda (js/battle.js:513) com `wingsApproved` (js/sys/stats.js:61).

## 2. Atrás de chave desligada

### Skins (todas: `skinsOn=false` js/sys/appearance.js:138 e `fixedGrant=false` :114; só o Modo dono equipa)
Colunas: **A pé** (parado, correr, golpe, giro, morte, pistola ×3; arco/bumerangue) · **Montada** · **Asa** · **Arma** · **Avatar/loja/telas**.

| Skin | A pé | Montada | Asa | Arma | Avatar | Falta |
|---|---|---|---|---|---|---|
| Kael Ninja | ✓ | ✗ | ✓ | ✓ | ✓ | N4; arco/bumerangue "por código" (sem bow/ e boomerang/, também desligados) |
| Kael Samurai | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kael Paladino (kael_solar_paladin) | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kael Demônio | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kael Anjo (+ _nowing) | ✓ | ✗ | ✓ (asa própria; com item usa _nowing) | ✓ | ✓ | N4 |
| Kael Ciborgue | ✗ | ✗ | ✓ | ✓ | ✓ | **ARTE**: giro q2-q15 com a faixa no peito (refazendo; skins/kael_cyborg/kael_spin_body.png); N4 |
| Kaia Ninja | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kaia Arlequina | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kaia Demônia | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
| Kaia Anjo | ✓ | ✗ | ✓ | ✓ | ✓ | N4 |
(As 4 adultas, cavaleiro/lendário, estão `off:true`, fora do jogo.)

### Armas
| Item | Estado | Falta |
|---|---|---|
| Arco ×5 (bow_*) | `on:false` (js/sys/stats.js:48) | Folhas Kael/Kaia ✓ (hyb/R/bow, hyb/kaia/bow); `bow_base` e **`bow_legend` já estão no disco**; falta o voto do dono (baseDelivered :65); skins sem folha própria (por código); N2/N3 |
| Bumerangue ×5 | `on:false` (:50) | Igual ao arco; `boomerang_legend` também já existe |

### Montaria
| Item | Estado | Falta |
|---|---|---|
| Fênix gigante (phoenixm) | `newOn:false` (js/sys/mount.js:47); ligada no código atrás da chave (b90cf5e) | **ARTE**: Kaia `kaia_giant_phoenix_{idle,run,attack}_{body,era2_t1}` (3 vídeos com bastão). **CÓDIGO**: imagem parada já entregue (assets/mounts/mount_giant_phoenix_ref.png, b48fff2), mas falta a linha em MOUNT_REF (js/mountfx.js:156); medir wx2/wy2 (MOUNT_TBL :27). Kael ✓ (grip 100%), ícone ✓ (assets/icons/mounts/giant_phoenix.png). N4, N1, N3 |

### Pets (`v4:false`, js/sys/pet.js:61, eras 7-8)
| Pet | Falta |
|---|---|
| Cérbero | Folhas 3 estágios ✓, aura ✓, ícones ✓, animado na tela (aa97a24). Só chave + N3 |
| Pégaso | Idem |
| Raposa de cristal (Prismático) | Idem |

### Asa
| Item | Falta |
|---|---|
| Serafim (6 asas) | Fora de `wingsApproved`; reprovada e refeita; prévia A/B em voto (e28d164) |

---

## 1º item: Clava Básico (era0_t0)
Primeira arma do jogador (fase 1, era 0). Para chegar a 100%:
1. **CÓDIGO** (N1): a tela Montarias (js/p_mounts.js:156, :348), a oferta (js/p_offer.js:50) e a prévia (js/artprev.js:17) passam a desenhar `_body` + a arma equipada no grip, com o prefixo do herói (Kaia monta como Kaia). Sem isso, montado a clava vira espada nessas telas.
2. **TESTE** (N3): o QA confere na tela, com a clava Básica: Kael e Kaia × parado/correr/golpe/giro/morte (arma cai ao lado), × 6 montarias (parado/correr/golpe), aura da Forja +4/+7/+10/+13, ultimate `era0_ult`, ícone e prévia em Equipamento, Forja, Invocar, Loja e Perfil, e anota no relatório.
3. Skins: estão desligadas; quando ligarem, a clava entra junto na conferência (a arte das 10 já tem grip em todos os quadros, menos o giro do Ciborgue).
Arte: nada a fazer (ícone, grip do meta.json e folhas conferidos).

## Surpresas
- A afirmação "montado sem arma" vale só para as telas: a batalha já troca a arma montado; o `_body` sem espada existe para tudo.
- Falcão, Pantera e Lobo sombrio estão ligados (`newReady`, js/sys/pet.js:62) mas **não aparecem na tela de Pets**.
- `bow_legend` e `boomerang_legend` já estão no disco (a lista dizia que faltavam).
- Montaria vai a 5★ no jogo; o ARTE_PRONTO diz 1-7.
- Há 154 folhas `*_Nstar` de montaria no git (assets/anim/mounts) que o código não usa e não estão no manifesto (regra antiga: sem folhas de estrela). Peso morto no repositório; não apaguei.
- `kael_gun_{idle,run,shoot}_body` (hyb/R) não é lido por nenhum js.

## Atualização 14/11 (Arte): skins na coreografia do padrão, tiro montado, Fogueira

**Skins: golpe, giro e pistola na MESMA coreografia do herói padrão** (seedance fast + VIDEO_REFERENCES da folha padrão, `motionref/mkref.js`). Coluna "mesma animação do padrão": ✓ com as ressalvas abaixo. Falta o G5 (QA na tela) em todas.
| Skin | Refeito | Commits | Ressalva |
|---|---|---|---|
| Kael Anjo (sem asa) | os 8 estados | 4c99b18, 053dc2d, 11c7ce8 | corrida: 2 quadros de apoio a 13-14 px |
| Kael Samurai | golpe, giro, pistola ×3 | 70c6235, 94596ab, 496e26e | pistola: braço ~40 px mais longo (arma na mão desenhada) |
| Kael Ciborgue | golpe, giro, pistola ×3 | 93c5278, e1c37b6, c401b1b | pistola: idem; giro q6 de costas a 35 px |
| Kael Ninja | golpe, giro | 0abf6d4, 9cfd853 | — |
| Kael Demônio | golpe, giro | 1bdd6d8, 72db255 | — |
| Kael Paladino Solar | golpe, giro | 19731ab, 596c4b6 | — |
| Kaia Ninja | golpe, giro (15 q), pistola ×3 | 49538f2 | tiro dispara 2× (padrão 4×) |
| Kaia Demônia | golpe, giro, corrida, pistola ×3 | 9d54966, ddb52da, 09c94f1 | tiro dispara 2× |
| Kaia Arlequina | golpe, giro | c8beca9 | giro sem a vista de lado (bastão-guia saiu preto) |
| Kaia Anjo | golpe, giro | 63640bf | 1 quadro de cada a ~35 px |
(6b940be: espada na frente na guarda, igual ao padrão, nos golpes do Kael.)

**Tiro montado** (`<herói>_<montaria>_shoot_body`, 12 q, cols 6): ✓ Kael nas 6 montarias; Kaia em pônei, cavalo, lobo, grifo e wyvern. ✗ Kaia no mítico: 3 vídeos cobriam o rosto; o PO decidiu o fallback (golpe de espada). Conferência: assets/anim/mounts/_conferencia_tiro_montado.png (786df9f). Kaia wyvern no limite (punho logo abaixo do queixo).

**Montaria parada da Derrota**: ✓ assets/mounts/still/ (b934d3b), as 6 + Fênix.
**Fogueira das Eras (aprovada pelo dono)**: ✓ fg_s1..9.png (90de853) + laços fg_s1..9_loop (37908a6, d787433).
**Kaia na Fênix**: ✓ 5df5551. **Ícones das eras 7-8**: ✓ 9b94ead. **Asa Seráfica (A)**: ✓ 4b6c357, no wingsApproved.
**Pendente**: folhas de dano dos inimigos (arma do atacante pintada; em limpeza); G5 do QA em tudo acima.
