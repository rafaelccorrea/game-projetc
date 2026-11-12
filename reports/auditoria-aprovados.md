# Auditoria: arte APROVADA x o que o jogo carrega (engenheiro, build v0.11, 2026-11-12)
Fontes: docs/ARTE_APROVADA.md (220 aprovados, 27 reprovados) e reports/arte_aprovada_vs_jogo.md (fps-ff: arquivo, quadros, fps, pés, quadro do golpe).
Nenhum arquivo de arte foi alterado. Chaves: `ART_ON` e `EN_HIT_FRAME` (js/battle.js), `sceneV2` na tabela `ERAS` (index.html), `SLOT_FILE`/`slotIcon` (index.html).

## Como foi conferido
- Por script, no jogo desenhado (iframe 390x844, `?debug=1&fresh=1&era=N`), com o gancho `window.__probe` do `drawEnemyAt`: para cada era, horda comum (9 a 16 s)
  e chefe sozinho (`dbgSet(era,0,0,'boss')`, 6 s vivo + morte). Contei, por inimigo e por estado, os quadros desenhados COM folha e SEM folha, a rotação,
  o avanço e o intervalo entre golpes do mesmo inimigo (`window.__atk`). Zero erro de JavaScript em todas as cargas.
- Com os olhos (prints): era 0 (horda), era 1 (horda + cenário novo), era 3 (horda + cenário novo), era 4 (ultimate animada), era 5 (chefe), era 6 (horda),
  era 2 (golpe básico com a folha do rastro; Equipamento com os ícones aprovados). Em todos: inimigos olhando para o herói, pés na linha do chão.
- NÃO conferido: comparação byte a byte de cada arquivo com o que o dono viu na página (confio no relatório da fps-ff: "os arquivos atuais são os
  aprovados"); pés medidos em pixel por era (só visual + âncora pelo `feetY` do .json); áudio (não ouvi; js/audio.js não é meu); celular real.

## O que mudou no código
1. `EN_ANIM_ERAS` = [0..6]; as 84 chaves de inimigo (7 eras x e0/e1/boss x run/attack/hurt/die) nascem LIGADAS (laço logo abaixo do `ART_ON`).
2. Ataque no fps do .json: a folha toca em `quadros ÷ fps` (1,0 s; Dragão 14 quadros = 1,17 s) e o dano/projétil sai no QUADRO DO GOLPE (`EN_HIT_FRAME`:
   Dente-de-Sabre 6, Brutamontes 6, Rex 5, Legionário 4, Escorpião 6, Minotauro 8, Goblin 6, Esqueleto 8, Dragão 8, Pirata 2, Mosqueteiro 1, Fantasma 4,
   Golem 8, Aranha 5, Caldeira 9, Drone 3, Soldado 3, Tanque 4, Alien 5, Ciborgue 5, Tentáculo 5). Dano: folha inteira em `quadros ÷ fps` (antes 0,4 s).
   Morte: `quadros ÷ fps` (13 quadros = 1,08 s). O intervalo de ataque do balanceamento não mudou (comum 1,2 s; chefe 1,15 s).
   Efeito colateral medido: o Dragão (folha de 1,17 s) golpeia a cada ~1,17-1,19 s em vez de 1,15 s (+2%).
3. Y1 do QA (era 1 com até 3,4-4,0 s sem golpe): CAUSA = o inimigo só golpeava com `parked` (parado no slot); quando o da frente morria, quem fechava a
   fila ficava "andando" até o slot novo e, com o Escorpião largo (111 px), o trajeto é longo. CORREÇÃO: quem já esteve num slot e está a até 70 px do
   slot novo golpeia sem esperar chegar. Medido depois: maior intervalo entre golpes do mesmo inimigo = era 0 1,17 · era 1 1,31 (antes 2,97) · era 2 1,36 ·
   era 3 1,25 · era 4 1,21 · era 5 1,22 · era 6 1,35 s. Rotação 0 e avanço <= 12 px em todas (nenhum alerta do gancho).
4. Ultimates: `FX_ART.ult` com as 7 eras (assets/anim/ult/eraN_ult + .json, blend lido do .json) e `ult_era0..6` ligadas. Duração de 2,5 s, igual à da
   era 2 que já estava no ar (a folha tem 49 quadros a 12 fps = 4,08 s: toca acelerada, como a aprovada da era 2 já tocava). Vista só a da era 4.
5. `s2_era2_t0/t1/t2` ligadas (Corte Giratório). `s1_era2_t0/t1/t2` NOVAS: o golpe básico com skin de arma da era 2 usa a folha composta
   `kael_attack_trail_era2_t<tier>` (448x256, pés em padLeft+128, y=243): quadros 0-6 até o instante do acerto, 7-16 na volta, DENTRO da duração do golpe
   básico (0,4 s; o ritmo do balanceamento não muda, então a folha de 17 quadros toca acelerada).
6. Cenários: `sceneV2` ligado nas eras 1 e 3 (0 e 2 já estavam). Vistos em jogo (era 1 templo; era 3 porto, com o scene.js novo). Eras 0 e 2: iguais.
7. Ícones: os 49 `icon-eraN_<slot>` (assets/icons/slots) entram em todo lugar que mostra um ITEM (Equipamento, mochila, folha do item, Invocar, baú,
   Passe), pela era do visual do item. O marcador SVG ficou só para o espaço VAZIO.

## Tabela por era (id aprovado → arquivo → no jogo → observação)
Inimigos: arquivo = `assets/anim/hyb/enemy/eraN_<e0|e1|boss>_<run|attack|hurt|die>.png` (+ .json). "sim (visto)" = contado com folha pelo gancho nesta build.
| Era | Ids aprovados | No jogo | Observação |
|---|---|---|---|
| 0 | foe-era0_e0/e1/boss-run/attack/hurt/die (12) | sim (visto: e0 e e1 run/attack/die; chefe attack/hurt/die) | hurt dos comuns e run do chefe ligados, não contados nesta medida (o hurt só aparece quando o inimigo não está golpeando) |
| 0 | cena-era0-v2 · ult-era0-anim | sim · sim | cenário visto; ultimate ligada, carrega (não vista tocando) |
| 1 | foe-era1_* (12) | sim (visto: todos os estados dos comuns; chefe run/attack/hurt/die) | intervalo máximo entre golpes 1,31 s (era 2,97) |
| 1 | cena-era1-v2 · ult-era1-anim | sim (LIGADO AGORA) · sim (LIGADA AGORA) | cenário visto; ultimate não vista tocando |
| 2 | run-era2_e0/e1 (assets/anim/era2_e0_run, era2_e1_run), atk/hurt/die-era2_e0/e1 | sim (visto: run/attack/hurt) | já estavam ligados; morte vista na rodada 8 só por carga |
| 2 | run-era2_boss, atk-era2_boss, hurt-era2_boss, die-era2_boss | sim (run/hurt/die LIGADOS AGORA; attack/hurt/die vistos) | `era2_boss_run`: caminho assets/anim/hyb/enemy/era2_boss_run, carrega (ok=true) e a chave está ligada; não o vi entrando andando (o teste põe o chefe já no slot) |
| 2 | cena-era2-v2 · ult-era2-anim | sim · sim | já estavam |
| 2 | s1-era2_t0/t1/t2 (kael_attack_trail_era2_t*) | sim (LIGADO AGORA; visto t0) | só com skin de ARMA da era 2; toca dentro dos 0,4 s do golpe básico |
| 2 | s2-era2_t0/t1/t2 (kael_spin_era2_t*) | sim (t0 e t2 LIGADOS AGORA) | só com skin de arma da era 2; não vistos nesta rodada (t1 visto na rodada 8) |
| 2 | hybR-idle-era2_t0/t1/t2 | sim | avatar do HUD, vitrine do Equipamento, Loja, Intro, Passe |
| 2 | hybR-run-era2_t0..2, hybR-idle-era2_t0..2, hybR-attack-era2_t0..2 (assets/anim/hyb/R/kael_<run\|idle\|attack>_era2_t<tier>.png) | SIM (v0.11.2, chaves `kael_hybR_t0..2`) | Decisão do PO: com skin de ROUPA e de ARMA da era 2 no MESMO tier a batalha desenha a folha composta; em qualquer outro caso, corpo + arma na mão. Conferido por script: nos 3 tiers e nos 3 estados a folha composta tem os mesmos quadros na mesma ordem do corpo (8 / 12 / 17) e a mesma linha mais baixa de pixels opacos (parado 241; corrida 237-242; golpe 241-247), então os pés e a troca de estado ficam idênticos ao modo antigo (mesma âncora, sem pulo). Visto em jogo: t0 parado, t1 golpeando (ultimate), t2 correndo. Caso misto (roupa era 2 + arma era 3): cai no modo antigo (conferido pelo estado; o print falhou porque a aba foi fechada por outro agente). O golpe BÁSICO com arma da era 2 continua na folha do rastro (s1 aprovado); a folha hybR-attack aparece no preparo da ultimate e do especial. |
| 2 | hyb-run-*, hyb-idle-era2_t0..2, anim-kael-run-quadros (pasta assets/anim/hyb/, sem o R) | NÃO | o jogo usa só a pasta R (a hyb-attack da pasta sem R é REPROVADA e não é carregada) |
| 2 | anim-goblin-run-quadros, anim-esqueleto-run-quadros | sim | são as corridas era2_e0_run / era2_e1_run |
| 3 | foe-era3_* (12) | sim (LIGADO AGORA; visto: comuns run/attack/hurt/die; chefe attack/hurt/die) | Pirata e Mosqueteiro olhando para o herói |
| 3 | cena-era3-v2 · ult-era3-anim | sim (LIGADO AGORA) · sim (LIGADA AGORA) | cenário visto com o scene.js novo; ultimate não vista tocando |
| 4 | foe-era4_* (12) · ult-era4-anim | sim (LIGADO AGORA; todos os estados dos comuns; chefe attack/hurt/die) · sim (VISTA tocando) | cenário da era 4 não aprovado: fundo antigo |
| 5 | foe-era5_* (12) · ult-era5-anim | sim (LIGADO AGORA; e0 run/attack/hurt/die, e1 run/attack/hurt; chefe attack/hurt/die) · sim | Drone flutua de propósito (folha); Tanque visto golpeando |
| 6 | foe-era6_* (12) · ult-era6-anim | sim (LIGADO AGORA; todos os estados dos comuns; chefe attack/hurt/die) · sim | — |
| todas | icon-eraN_<boots|gloves|helmet|necklace|vest|weapon|wings> (49) | sim (LIGADO AGORA; vistos os da era 2) | os PNG têm 256x256 e ~650 KB cada (32 MB no total): pedir à arte versão leve |
| todas | aura4-idle, aura7-idle, aura10-idle, aura13-idle/run/attack | ligadas, NÃO aparecem | só com o +N da arma no Sys.forge (a Forja não tem tela ligada); o jogo usa 1 folha por aura (assets/anim/aura/auraN) |
| — | head-hair_bun, head-hair_spiky, head-hat | NÃO | não existe tela de cabelo/chapéu aprovada; os arquivos (kael_run_body_hair_*, _hat) só têm a corrida |
| — | music-era0..6, music-title, sfx-* e sfx2-* aprovados | não conferido por mim | js/audio.js e assets/audio/manifest.json são de outra sessão. Os nomes em assets/audio/sfx e /music batem com a lista; o meta.js registra que os sfx2 aprovados foram promovidos para assets/audio/sfx. Não ouvi nem comparei arquivos |

## Reprovados: conferência de que NÃO aparecem
| Id | Situação |
|---|---|
| hyb-attack-era2_t0..2 (assets/anim/hyb/kael_attack_era2_t*) | não carregado: o jogo usa só assets/anim/hyb/R/ |
| mod-a/b/c-* e anim-kael-*-ossos | js/anim.js (boneco por ossos/modular) NÃO é carregado pelo index.html |
| kaia-ref | não usado: a Kaia é uma silhueta em SVG (js/intro.js) |
| sfx-* reprovados (claim, defeat, era0_s1..s3, era1_s3, era4_s2, era4_s3, era6_s3, hero_hurt, hit, ult_ready, upgrade) | não conferido por mim (áudio é de outra sessão); a tabela `SFX_SWAP`/`SFX_MUTE` do js/meta.js está vazia |

## Pendências
1. `EN_STRIDE` (passada por folha, para o pé não patinar): só Goblin e Esqueleto têm valor medido; os outros 19 usam 0,9 lado-do-quadro/s. Tentei medir
   por script (alinhando a faixa de contato com o chão entre quadros) e o resultado NÃO é confiável (o Esqueleto deu 27 px contra os 20 conhecidos).
   Pedir à fps-ff a passada em px por quadro de cada corrida (ou o campo `stride` no .json): aí é só preencher a tabela.
2. Kael na batalha: RESOLVIDO na v0.11.2 (folha composta hybR com roupa e arma da era 2 no mesmo tier).
   `EN_STRIDE`: preenchido pelo coordenador na v0.11.1 com as medidas da fps-ff (item 1 acima resolvido).
3. Ultimates das eras 0, 1, 2, 3, 5 e 6 e o Corte Giratório t0/t2: ligados e carregando, não vistos tocando nesta rodada.
4. Peso: ícones 32 MB, ultimates ~14 MB cada (100 MB), folhas de inimigo 62 MB. O jogo só carrega a era atual (e a próxima a partir da fase 8).
