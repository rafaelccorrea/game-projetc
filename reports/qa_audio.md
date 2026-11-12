# QA de áudio por script (pedido da fps-ff) — 44 arquivos de assets/audio

Método: decodificação no navegador (WebAudio), mono para pico/silêncio/emenda; loudness com filtro K aproximado (BS.1770 simplificado, com gate de bloco 400 ms).
LIMITES: o LUFS é aproximado (±1 a 2 dB), a "emenda do loop" é uma heurística (salto entre a última e a primeira amostra, dividido pelo passo médio do fim),
e nada substitui ouvir. Ninguém ouviu ainda.
Loudness efetivo = LUFS + 20·log10(volume do manifest).

## Músicas (contrato 20-40 s: todas OK, 27,5 a 32,2 s)
| arq | dur | LUFS | pico | vol | efetivo | emenda |
|---|---|---|---|---|---|---|
| era0 | 32,2 | -12,7 | -2,2 | 0,8 | -14,6 | 18,9x  SUSPEITA |
| era1 | 30,1 | -12,1 | -1,7 | 0,8 | -14,0 | 18,4x  SUSPEITA |
| era2 | 27,5 | -12,5 | -0,8 | 0,8 | -14,4 | 2,7x |
| era3 | 29,2 | -11,7 | -1,3 | 0,8 | -13,6 | 2,7x |
| era4 | 30,9 | -17,4 | -0,9 | 1,0 | -17,4 | 2,0x  (muito baixa) |
| era5 | 27,6 | -10,0 | -1,3 | 0,7 | -13,1 | 0,4x |
| era6 | 29,2 | -11,2 | -1,0 | 0,8 | -13,1 | 3,1x |
| title | 29,2 | -13,1 | -3,1 | 0,9 | -14,0 | 2,6x |
Achados:
- M1 [MÉDIO] era0 e era1: salto na emenda do loop ~18x o passo normal (amplitude ~0,10 e ~0,135): provável estalo ao repetir. Ouvir e aplicar crossfade/ajuste de ponto de corte no zero.
- M2 [MÉDIO] era4 (Industrial) bem mais baixa que as outras: -17,4 LUFS efetivo contra -13 a -14,6 nas demais (até com volume 1,0, que já é o teto). Subir ~3,5 dB no arquivo.
- M3 [BAIXO] início/fim sem silêncio (0-5 ms) em todas: normal para loop; só confirmar que a emenda soa contínua.

## Efeitos (mediana -13,2 LUFS)
Mais baixos que a mediana (>4 dB): claim -27,2 (-14 dB!), ui_tap -20,2, era6_s3 -19,7, legendary -19,7, enemy_die -18,9, era4_s2 -18,6.
- S1 [MÉDIO] claim está 14 dB abaixo do resto: quase inaudível junto dos outros. Subir ~10 a 12 dB (é som de recompensa).
- S2 [MÉDIO] ui_tap (-20,2, 0,1 s) e enemy_die (-18,9): baixos; ui_tap é o som mais repetido do jogo, mas curto: avaliar de ouvido. era4_s2 e era6_s3 baixos frente aos irmãos da mesma era (era6_s3 -19,7 contra era6_s2 -12,7).
- S3 [MÉDIO] legendary (-19,7) é o som de maior recompensa e ficou entre os mais baixos; contraria a importância dele.
- S4 [BAIXO] Pico muito perto de 0 dBFS (>= -0,5 dB) em 15 arquivos; hero_hurt está em 0,0 dBFS (pode clipar); também boss_appear, crit, defeat, enemy_die, era0_s3, era2_s1, era2_s3, era3_s2, era3_s3, era4_s2, era4_s3, era5_s2, ui_tap, ult_ready. Com o volume do manifest < 1 não clipa na saída, mas deixar -1 dBFS de folga.
- S5 [BAIXO] Fim abrupto (cauda com energia > -30 dB nos últimos 50 ms e < 15 ms de silêncio): era0_s3, era2_s1, era5_s1, hero_hurt, ui_tap. Possível clique no final; adicionar fade-out de 10 a 30 ms.
- S6 [BAIXO] era6_s3 dura 3,75 s (contrato: ~2-3 s para o s3). As outras s3 ficam em 3,0 s; s1 todos <= 0,5 s; s2 entre 0,74 e 1,2 s: dentro do contrato.
- Duração, tamanho e decodificação: ok em todos. Nenhum arquivo ausente.

## Não feito (não dá por script)
Timbre/qualidade, se cada som combina com a era e a arma, se o loop soa contínuo, equilíbrio música x efeitos no jogo real, sons repetidos em horda (limite de simultâneos).
