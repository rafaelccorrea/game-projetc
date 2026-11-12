# Arte APROVADA x o que o jogo carrega (fps-ff, 2026-11-12)
Fonte dos votos: banco da página de aprovação (coleção "decisoes"). Medidas feitas nos arquivos atuais (que são os aprovados).
Todas as folhas: horizontais, 12 fps. Posicionar SEMPRE pelo .json ao lado (w, h, padLeft, feetY). Pés: x = padLeft + 128, y = feetY.
"golpe/tiro no quadro N" = quadro em que a arma/tiro chega mais longe para a esquerda (contando do 0): é ali que o dano deve sair.

## DIVERGÊNCIAS ENCONTRADAS NO JOGO (js/battle.js e js/stage.js)
1. EN_ANIM_ERAS = [0,1,2]: as eras 3, 4, 5 e 6 NÃO são carregadas, apesar de aprovadas (48 folhas). Deve ser [0,1,2,3,4,5,6].
2. ART_ON desligado para itens APROVADOS: todas as 24 chaves das eras 0 e 1; era2_boss_run, era2_boss_hurt, era2_boss_die. Eras 3-6 nem têm chave.
   → É por isso que "andam pulando/deslizando e não atacam": sem a chave, o jogo usa o comportamento provisório por código.
3. Duração do ataque: EN_ATK_DUR = 0,75 s toca 12 quadros a 16 fps; a folha é de 12 fps (1,0 s; o Dragão tem 14 quadros = 1,17 s).
   EN_HURT_DUR = 0,4 s para 12 quadros (1,0 s). O dano sai no MEIO da animação, não no quadro do golpe (lista abaixo).
4. EN_STRIDE só tem era2_e0/e1; os demais usam 0,9 → a velocidade do chão pode não casar com o passo (patinar). Medir por folha.
5. Ultimates: FX_ART.ult só tem as eras 0, 2 e 5, e ART_ON ult_era0/ult_era5 = false. TODAS as 7 estão aprovadas: faltam 1, 3, 4, 6 e ligar 0 e 5.
   Ler "blend" do .json (eras 0, 3 e 5 = source-over; as outras = lighter).
6. Especial (s2, Corte Giratório): só s2_era2_t1 = true; t0 e t2 também estão APROVADOS.
7. s1 (golpe com arco azul) APROVADO nos 3 tiers (kael_attack_trail_era2_t*), mas o jogo não o usa (FX_ART.s1 = null).
8. Drone (era5_e0): flutua de propósito; a base dele na folha fica acima de feetY (sombra no chão por código).
9. EN_FLIP vazio: correto (Rex, Pirata e Tanque já olham para a esquerda nos arquivos).

## LISTA (id do voto | arquivo | quadros e tamanho | fps | pés | quadro do golpe)
foe-era0_e0-run | anim/hyb/enemy/era0_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_e0-attack | anim/hyb/enemy/era0_e0_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 6 (de 0)
foe-era0_e0-hurt | anim/hyb/enemy/era0_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_e0-die | anim/hyb/enemy/era0_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_e1-run | anim/hyb/enemy/era0_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_e1-attack | anim/hyb/enemy/era0_e1_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 6 (de 0)
foe-era0_e1-hurt | anim/hyb/enemy/era0_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_e1-die | anim/hyb/enemy/era0_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era0_boss-run | anim/hyb/enemy/era0_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era0_boss-attack | anim/hyb/enemy/era0_boss_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192 golpe/tiro no quadro 5 (de 0)
foe-era0_boss-hurt | anim/hyb/enemy/era0_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era0_boss-die | anim/hyb/enemy/era0_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era1_e0-run | anim/hyb/enemy/era1_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_e0-attack | anim/hyb/enemy/era1_e0_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 4 (de 0)
foe-era1_e0-hurt | anim/hyb/enemy/era1_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_e0-die | anim/hyb/enemy/era1_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_e1-run | anim/hyb/enemy/era1_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_e1-attack | anim/hyb/enemy/era1_e1_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 6 (de 0)
foe-era1_e1-hurt | anim/hyb/enemy/era1_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_e1-die | anim/hyb/enemy/era1_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era1_boss-run | anim/hyb/enemy/era1_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era1_boss-attack | anim/hyb/enemy/era1_boss_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192 golpe/tiro no quadro 8 (de 0)
foe-era1_boss-hurt | anim/hyb/enemy/era1_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era1_boss-die | anim/hyb/enemy/era1_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
run-era2_e0 | anim/era2_e0_run.png | 8 quadros 256x256 | 12 fps | pés y=243 padLeft=0
atk-era2_e0 | anim/hyb/enemy/era2_e0_attack.png | 12 quadros 480x256 | 12 fps | pés y=243 padLeft=128 golpe/tiro no quadro 6 (de 0)
hurt-era2_e0 | anim/hyb/enemy/era2_e0_hurt.png | 12 quadros 480x256 | 12 fps | pés y=243 padLeft=128
die-era2_e0 | anim/hyb/enemy/era2_e0_die.png | 13 quadros 480x256 | 12 fps | pés y=243 padLeft=128
run-era2_e1 | anim/era2_e1_run.png | 8 quadros 256x256 | 12 fps | pés y=243 padLeft=0
atk-era2_e1 | anim/hyb/enemy/era2_e1_attack.png | 12 quadros 480x256 | 12 fps | pés y=243 padLeft=128 golpe/tiro no quadro 8 (de 0)
hurt-era2_e1 | anim/hyb/enemy/era2_e1_hurt.png | 12 quadros 480x256 | 12 fps | pés y=243 padLeft=128
die-era2_e1 | anim/hyb/enemy/era2_e1_die.png | 13 quadros 480x256 | 12 fps | pés y=243 padLeft=128
run-era2_boss | anim/hyb/enemy/era2_boss_run.png | 8 quadros 544x256 | 12 fps | pés y=243 padLeft=192
atk-era2_boss | anim/hyb/enemy/era2_boss_attack.png | 14 quadros 544x256 | 12 fps | pés y=243 padLeft=192 golpe/tiro no quadro 8 (de 0)
hurt-era2_boss | anim/hyb/enemy/era2_boss_hurt.png | 12 quadros 544x256 | 12 fps | pés y=243 padLeft=192
die-era2_boss | anim/hyb/enemy/era2_boss_die.png | 13 quadros 544x256 | 12 fps | pés y=243 padLeft=192
foe-era3_e0-run | anim/hyb/enemy/era3_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_e0-attack | anim/hyb/enemy/era3_e0_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 2 (de 0)
foe-era3_e0-hurt | anim/hyb/enemy/era3_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_e0-die | anim/hyb/enemy/era3_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_e1-run | anim/hyb/enemy/era3_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_e1-attack | anim/hyb/enemy/era3_e1_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 1 (de 0)
foe-era3_e1-hurt | anim/hyb/enemy/era3_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_e1-die | anim/hyb/enemy/era3_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era3_boss-run | anim/hyb/enemy/era3_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era3_boss-attack | anim/hyb/enemy/era3_boss_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192 golpe/tiro no quadro 4 (de 0)
foe-era3_boss-hurt | anim/hyb/enemy/era3_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era3_boss-die | anim/hyb/enemy/era3_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era4_e0-run | anim/hyb/enemy/era4_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_e0-attack | anim/hyb/enemy/era4_e0_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 8 (de 0)
foe-era4_e0-hurt | anim/hyb/enemy/era4_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_e0-die | anim/hyb/enemy/era4_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_e1-run | anim/hyb/enemy/era4_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_e1-attack | anim/hyb/enemy/era4_e1_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 5 (de 0)
foe-era4_e1-hurt | anim/hyb/enemy/era4_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_e1-die | anim/hyb/enemy/era4_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era4_boss-run | anim/hyb/enemy/era4_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era4_boss-attack | anim/hyb/enemy/era4_boss_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192 golpe/tiro no quadro 9 (de 0)
foe-era4_boss-hurt | anim/hyb/enemy/era4_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era4_boss-die | anim/hyb/enemy/era4_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era5_e0-run | anim/hyb/enemy/era5_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_e0-attack | anim/hyb/enemy/era5_e0_attack.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 3 (de 0)
foe-era5_e0-hurt | anim/hyb/enemy/era5_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_e0-die | anim/hyb/enemy/era5_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_e1-run | anim/hyb/enemy/era5_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_e1-attack | anim/hyb/enemy/era5_e1_attack.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=128 golpe/tiro no quadro 3 (de 0)
foe-era5_e1-hurt | anim/hyb/enemy/era5_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_e1-die | anim/hyb/enemy/era5_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era5_boss-run | anim/hyb/enemy/era5_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era5_boss-attack | anim/hyb/enemy/era5_boss_attack.png | 12 quadros 608x352 | 12 fps | pés y=307 padLeft=256 golpe/tiro no quadro 4 (de 0)
foe-era5_boss-hurt | anim/hyb/enemy/era5_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era5_boss-die | anim/hyb/enemy/era5_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era6_e0-run | anim/hyb/enemy/era6_e0_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_e0-attack | anim/hyb/enemy/era6_e0_attack.png | 12 quadros 512x352 | 12 fps | pés y=307 padLeft=160 golpe/tiro no quadro 5 (de 0)
foe-era6_e0-hurt | anim/hyb/enemy/era6_e0_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_e0-die | anim/hyb/enemy/era6_e0_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_e1-run | anim/hyb/enemy/era6_e1_run.png | 8 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_e1-attack | anim/hyb/enemy/era6_e1_attack.png | 12 quadros 512x352 | 12 fps | pés y=307 padLeft=160 golpe/tiro no quadro 5 (de 0)
foe-era6_e1-hurt | anim/hyb/enemy/era6_e1_hurt.png | 12 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_e1-die | anim/hyb/enemy/era6_e1_die.png | 13 quadros 480x352 | 12 fps | pés y=307 padLeft=128
foe-era6_boss-run | anim/hyb/enemy/era6_boss_run.png | 8 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era6_boss-attack | anim/hyb/enemy/era6_boss_attack.png | 12 quadros 608x352 | 12 fps | pés y=307 padLeft=256 golpe/tiro no quadro 5 (de 0)
foe-era6_boss-hurt | anim/hyb/enemy/era6_boss_hurt.png | 12 quadros 544x352 | 12 fps | pés y=307 padLeft=192
foe-era6_boss-die | anim/hyb/enemy/era6_boss_die.png | 13 quadros 544x352 | 12 fps | pés y=307 padLeft=192
ult-era0-anim | anim/ult/era0_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era1-anim | anim/ult/era1_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era2-anim | anim/ult/era2_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era3-anim | anim/ult/era3_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era4-anim | anim/ult/era4_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era5-anim | anim/ult/era5_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
ult-era6-anim | anim/ult/era6_ult.png | 49 quadros 384x216 | 12 fps | pés y=243 padLeft=0
s1-era2_t0 | anim/hyb/R/kael_attack_trail_era2_t0.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96 golpe/tiro no quadro 6 (de 0)
s2-era2_t0 | anim/hyb/R/kael_spin_era2_t0.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96
hybR-attack-era2_t0 | anim/hyb/R/kael_attack_era2_t0.png | 17 quadros 256x256 | 12 fps | pés y=243 padLeft=0 golpe/tiro no quadro 5 (de 0)
hybR-idle-era2_t0 | anim/hyb/R/kael_idle_era2_t0.png | 12 quadros 256x256 | 12 fps | pés y=243 padLeft=0
hybR-run-era2_t0 | anim/hyb/R/kael_run_era2_t0.png | 8 quadros 256x256 | 12 fps | pés y=243 padLeft=0
s1-era2_t1 | anim/hyb/R/kael_attack_trail_era2_t1.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96 golpe/tiro no quadro 6 (de 0)
s2-era2_t1 | anim/hyb/R/kael_spin_era2_t1.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96
hybR-attack-era2_t1 | anim/hyb/R/kael_attack_era2_t1.png | 17 quadros 256x256 | 12 fps | pés y=243 padLeft=0 golpe/tiro no quadro 5 (de 0)
hybR-idle-era2_t1 | anim/hyb/R/kael_idle_era2_t1.png | 12 quadros 256x256 | 12 fps | pés y=243 padLeft=0
hybR-run-era2_t1 | anim/hyb/R/kael_run_era2_t1.png | 8 quadros 256x256 | 12 fps | pés y=243 padLeft=0
s1-era2_t2 | anim/hyb/R/kael_attack_trail_era2_t2.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96 golpe/tiro no quadro 6 (de 0)
s2-era2_t2 | anim/hyb/R/kael_spin_era2_t2.png | 17 quadros 448x256 | 12 fps | pés y=243 padLeft=96
hybR-attack-era2_t2 | anim/hyb/R/kael_attack_era2_t2.png | 17 quadros 256x256 | 12 fps | pés y=243 padLeft=0 golpe/tiro no quadro 5 (de 0)
hybR-idle-era2_t2 | anim/hyb/R/kael_idle_era2_t2.png | 12 quadros 256x256 | 12 fps | pés y=243 padLeft=0
hybR-run-era2_t2 | anim/hyb/R/kael_run_era2_t2.png | 8 quadros 256x256 | 12 fps | pés y=243 padLeft=0
aura4 | anim/aura/aura4.png | 16 quadros 256x320 | 12 fps | pés y=243 padLeft=0
aura7 | anim/aura/aura7.png | 16 quadros 256x320 | 12 fps | pés y=243 padLeft=0
aura10 | anim/aura/aura10.png | 16 quadros 256x320 | 12 fps | pés y=243 padLeft=0
aura13 | anim/aura/aura13.png | 16 quadros 256x320 | 12 fps | pés y=243 padLeft=0