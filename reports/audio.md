# Relatório — Áudio (Eonbound)

## Resumo
- `js/audio.js` entrega `window.GameAudio = { init, unlock, setEnabled, music, sfx, stopMusic }` em WebAudio puro, sem dependências.
- 44 arquivos gerados no Higgsfield e pós-processados: 36 efeitos + 8 músicas. Total em disco: 4,3 MB.
- Todos decodificam (ffmpeg, decodificação completa) e respeitam os limites (sfx ≤ 60 KB, música ≤ 600 KB).
- Gasto: **72,3 créditos** de um teto de 150.
- **Ninguém ouviu os sons.** A conferência foi só por medição (duração, pico, envelope de volume). Vale o dono escutar tudo uma vez; ver "Pendências".

## Custo (Higgsfield)
| Item | Modelo | Preço | Jobs | Créditos |
|---|---|---|---|---|
| Efeitos sonoros | `mirelo_text_to_audio` | 0,25 crédito por segundo | 48 (36 finais + 12 refeitos) | 25,75 |
| Músicas | `elevenlabs_music_v2_5` | 5,82 por faixa de 40 s | 8 | 46,56 |
| **Total** | | | 56 | **72,31** |

- O total é a soma dos preços de pré-consulta (`get_cost`), não a diferença de saldo: a conta é compartilhada com outros agentes.
- Saldo da conta: 743,96 no início e 629,65 no fim (inclui o gasto dos outros agentes no período).
- `elevenlabs_music_v2` custa menos da metade (1,92 por 30 s, contra 4,36 do v2.5); usei o v2.5 pela qualidade.
- Nada foi publicado; no máximo 3 jobs simultâneos.

## O que existe em `assets/audio/`
`manifest.json` lista só o que existe, no formato `{ "file": "...", "volume": n }` por som.

### Música (`music/`, estéreo, 128 kbps, loop)
| Arquivo | Duração | Tamanho | Clima pedido |
|---|---|---|---|
| era0.mp3 | 32,2 s | 505 KB | tambores tribais e selva |
| era1.mp3 | 30,1 s | 471 KB | lira e flautas antigas |
| era2.mp3 | 27,5 s | 431 KB | medieval heroico |
| era3.mp3 | 29,2 s | 457 KB | pífaros, tambores e mar (piratas) |
| era4.mp3 | 30,9 s | 485 KB | steampunk com engrenagens |
| era5.mp3 | 27,6 s | 432 KB | ação moderna |
| era6.mp3 | 29,2 s | 458 KB | synthwave espacial |
| title.mp3 | 29,2 s | 458 KB | tema épico orquestral |

O loop foi montado assim: o comprimento de cada faixa foi escolhido por correlação de batidas, e o fim do trecho faz crossfade de 2 s sobre o começo. O `audio.js` ainda ignora o preenchimento do mp3 e alisa a emenda ao decodificar.

### Efeitos (`sfx/`, mono, 96 kbps, pico normalizado em cerca de -1 dB)
| Grupo | Duração | Tamanho |
|---|---|---|
| `era{0..6}_s1` | 0,37 a 0,48 s | 5 a 6 KB |
| `era{0..6}_s2` | 0,74 a 1,20 s | 10 a 15 KB |
| `era{0..6}_s3` | 2,26 a 3,75 s | 27 a 45 KB |
| hit 0,21 s · ui_tap 0,10 s · hero_hurt 0,43 s · crit 0,56 s · enemy_die 0,61 s · coin 0,68 s | | 2 a 9 KB |
| upgrade 0,84 s · ult_ready 0,85 s · gem 0,89 s · defeat 1,27 s · claim 1,44 s · summon 1,87 s | | 11 a 23 KB |
| era_change 2,14 s · legendary 2,81 s · boss_appear 2,97 s | | 26 a 36 KB |

Observações sobre arquivos específicos:
- `era3_s1` e `era3_s2` vêm do mesmo tiro de mosquete: o s1 é o tiro único e o s2 é o mesmo tiro duplicado com 190 ms de atraso ("Tiro Duplo").
- `era6_s3` passa do alvo de 2-3 s (3,75 s): o bruto terminava cortado no pico da explosão, então acrescentei uma cauda de eco.
- Refeitos por terem saído mudos ou fracos: era0_s1, era3_s1, era3_s2, era4_s1, era4_s2, era2_s2, enemy_die, gem, ui_tap, ult_ready, claim, defeat. O Mirelo falha bastante com 1 s de duração; com 2 s e a palavra "loud" no prompt funcionou.

## `js/audio.js`
- **Carga:** `init()` lê o manifest. Depois do primeiro gesto, todos os sfx são pré-carregados em segundo plano (3 downloads por vez, com cache). Música é carregada sob demanda.
- **Fallback sintetizado:** qualquer nome sem arquivo, com arquivo que falhou ou ainda não carregado toca uma versão por osciladores e ruído. Há receitas para os 3 ataques das 7 eras e para os 15 sons gerais; nomes desconhecidos são aproximados por palavra-chave (laser, shot, slash, coin...). Sem manifest ou sem nenhum mp3, o jogo inteiro ainda tem som.
- **Música:** `music('era3')`, `music(3)` ou `music('title')`. Loop com crossfade de 1,2 s ao trocar; pedir a mesma chave de novo não faz nada. Sem arquivo, toca uma trilha procedural simples da era.
- **Limites:** 10 vozes simultâneas, 3 cópias do mesmo som, 45 ms de intervalo mínimo entre repetições, compressor no master.
- **Variação:** ±6% de tom e até -14% de volume em `*_s1`, hit, crit, coin, gem, ui_tap, enemy_die e hero_hurt. Desliga com `{vary:false}`.
- **Ducking:** a música baixa durante `*_s3`, boss_appear, legendary, era_change e defeat.
- **Ciclo de vida:** o AudioContext só é criado no primeiro gesto; suspende com a aba oculta e retoma ao voltar. `setEnabled(bool)` persiste em `localStorage['eonbound.audio.enabled']` e, ao religar, a música da era volta sozinha.
- **Opções de `sfx(name, opts)`:** `volume`, `rate`, `detune` (cents), `delay` (s), `vary`.
- **Extras fora do contrato:** `isEnabled()`, `preload([nomes])`, `setVolume({master,music,sfx})`, `state()`.

## Teste no navegador (Chrome, http://localhost:8080/)
O `index.html` já carregava o `audio.js`. Resultado:
- `init()` leu o manifest; os 36 sfx decodificaram, 0 falhas.
- Antes de um clique real o contexto fica suspenso (esperado); depois do clique, `running`.
- `sfx` de nomes existentes (hit, era0_s1, era3_s2, era6_s3, coin) e inexistentes (nao_existe, laser_xyz, era9_s1) retornou `true`; nome vazio retornou `false`.
- Rajada de 40 chamadas de ultimates: 7 aceitas, 10 vozes no máximo. Repetição imediata do mesmo som foi bloqueada.
- Troca de música era2 → era5 → chave inexistente (caiu na trilha procedural) → title funcionou.
- `setEnabled(false)` suspendeu, bloqueou sfx e gravou "0"; `setEnabled(true)` retomou com a música.
- Nenhum erro de console nem exceção. Aba fechada ao final.

Não testado: aparelho real (iOS Safari, Android Chrome) e a escuta dos sons.

## O que ficou sintetizado
- Nenhum som do contrato ficou só no sintetizador: os 44 têm arquivo.
- O sintetizador entra em três casos: som pedido antes de o arquivo carregar, falha de rede, e nomes que não estão no manifest.

## Pendências e recomendações para o dono
1. **Ouvir tudo uma vez.** Se algum som estiver ruim, basta apagar o mp3 e a linha dele no manifest; o sintetizado assume.
2. **Suspeitos pela medição:**
   - `claim`: quase só um ataque curto e depois muito baixo.
   - `gem`: precisou de +23 dB de ganho, pode ter chiado.
   - `ui_tap`: é um clique de 0,1 s.
   - `defeat`: pode não soar como melodia triste.
   - `hero_hurt` e `era4_s1`: recortes de trechos de um áudio maior.
3. **Loops de música:** a emenda é por crossfade alinhado à batida, mas a frase musical pode "pular" na volta. As correlações mais fracas foram title, era5 e era2; são as primeiras a conferir.
4. **Volumes:** os valores do manifest são chutes calibrados por medição (s1 0,5 · s2 0,7 · s3 0,95; era4 mais alta e era5 mais baixa para compensar a gravação). Ajustar de ouvido no celular.
5. **Vale gerar ou contratar depois:**
   - jingles tonais (coin, gem, upgrade, claim, ult_ready, legendary, defeat) de um pacote de UI coeso; modelo de sfx por texto é fraco em notas afinadas;
   - 2 ou 3 variações de `hit` e de cada `_s1`, que tocam centenas de vezes por sessão;
   - músicas de 60 a 90 s com loop composto de verdade, e uma faixa de chefe;
   - tema de título com assinatura melódica própria, feito por compositor.
6. **Formato:** em produção, `.ogg` ou `.m4a` dariam loop sem preenchimento e arquivos menores; o mp3 foi mantido por causa do contrato.
7. **Ferramentas:** o ffmpeg (ffmpeg-static, 83 MB) foi instalado fora do projeto e removido ao final, junto com os brutos e os scripts, por causa do disco. Reprocessar exige reinstalar e gerar os brutos de novo.
