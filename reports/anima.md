# fps-ff — Animação, skins e som (dono do assunto)

Desde 2026-11-12, a sessão **fps-ff** cuida de tudo o que é animação, skin e som no Eonbound.

## Escopo
- Animar todos os personagens: herói (7 eras x 3 tiers), inimigos, chefes. Parado, andar/correr, ataque, dano, morte, vitória.
- Animar as skills: básico, especial e ultimate de cada arma (assets/fx), impacto, crítico, aura.
- Animar as armas: golpe, recuo, clarão do tiro, troca de arma.
- Skins: as atuais e as futuras, com o mesmo esqueleto e as mesmas animações (uma skin nova = troca de peças, sem animar de novo).
- Som: efeitos, música, mixagem e ligação do som com as animações (passo, golpe, impacto).

## Arquivos que passam a ser meus
- `assets/hero/**`, `assets/enemies/**`, `assets/weapons/**`, `assets/fx/**`, `assets/audio/**` (incluindo anchors.json e meta.json)
- `assets/anim/**` (novo: rigs, folhas de quadros, dados de animação)
- `js/anim.js` (novo: motor de animação), `js/audio.js`
- `reports/anima.md`, `reports/rig.md`, `reports/fx.md`, `reports/audio.md`
- `test/rig/**`, `test/anim/**`
- index.html e js/battle.js continuam com a fps-c9/engenheiro: eu entrego uma API (`Anim.draw(ctx, quem, estado, t)`) e o
  ponto exato onde ligar; não edito esses arquivos sem combinar.

## Posse confirmada (fps-c9, 2026-11-12)
Passada para fps-ff. EXCEÇÃO até o agente da fps-c9 terminar: assets/anim/era2_hero_t0_run.png, era2_e0_run.png, era2_e1_run.png,
assets/anim/meta.json, test/anim/preview.html, reports/anim.md (prova de corrida quadro a quadro). Não mexer até o aviso.

## PO = fps-98 (protótipos). Pedido do PO
- Regra do dono: nada flutua, quica ou voa; pés na linha do chão da era (assets/bg/meta.json, groundY); andar com pernas e braços.
- Por personagem: idle (respirar), run, s1, s2, s3, hurt, die. Folhas HORIZONTAIS, quadro 256x256, pés em y≈95%.
- Prioridade era 2: Kael t1 + Goblin (e0) + Esqueleto (e1) + Dragão Real (boss).

## Fila de animação/som de outras sessões (só depois de liberado)
- fps-0b (QA, reports/qa.md): B2 critério de aceite da locomoção; R2 ultimate era0 (mamute) cobre herói/inimigos ~1 s;
  FX era2 e era5 (borda reta); ninguém ouviu os 44 sons.
- fps-30 (spec loot/baú/instâncias): loot pulando e voando ao HUD com brilho por raridade e "+N"; baú pulsando, anel, abertura
  com 3-5 itens; cronômetro e janela vitória/derrota. Sons: coin, gem, claim, legendary (existem) + NOVOS instance_win e instance_lose.
- fps-e2 (FC/práticas/títulos/torre): title_unlock, title_equip, practice_up (variante multi-nível), tower_win, tower_lose,
  tower_boss (a cada 5), tower_milestone (10/25/50/100), fc_up. Nomes propostos; entregar a ela para documentar.

## Proposta original (técnica)
Bloqueador 1 do docs/PARA_O_PO.md (personagens parados, correm "pulando").
- **Técnica recomendada: A (recortes com ossos)** — cada personagem vira peças (cabeça, tronco, braços, pernas, cachecol)
  montadas num esqueleto 2D; as animações são dados (JSON), iguais para todas as skins. Barato em créditos e leve no celular.
- Quadro a quadro (B) só para efeitos de skill (slash, hit, crit, ultimates), onde ossos não servem.
- **Primeira entrega para aprovação:** 1 herói (era2_t0) + 1 inimigo (era2_e0) com parado, correr, atacar, dano e morte,
  rodando numa página de teste (`test/anim/`), mais o slash em 5 quadros. Custo estimado: 10-20 créditos Higgsfield.
- Depois de aprovado: replicar para as 21 skins do herói, 21 inimigos, armas e as 21 skills + 7 ultimates.

## Prova de corrida por ossos — Kael era 2 t0 (2026-11-12)
Página: http://localhost:8091/test/anim/bones/ (servidor local: `node C:\Users\rafae\AppData\Local\Temp\tools\serve.js 8091`;
o mesmo da pasta, mais POST /save restrito a assets/anim e test/anim para exportar folhas). Quadros à esquerda, ossos à direita.
- Peças: 1 geração nano_banana_pro com o sprite como referência (2 variantes = 4 créditos; usada a B). Recorte local
  (`tools/parts.js`), escala por peça para bater a proporção do sprite parado, anel do cachecol fechado (`tools/rigbuild.js`).
  Fonte: assets/anim/rig/src/era2_hero_t0.src.json → assets/anim/rig/era2_hero_t0/{peças}.png + rig.json.
- Motor: js/anim.js — `Anim.load(id, pasta)`, `Anim.draw(ctx, id, estado, t, x, chãoY, tamanho, {weapon:{img,grip,angle}})`,
  `Anim.groundSpeed(id, tamanho)` (px/s do chão), `Anim.feet()` (diagnóstico). Estados prontos: run (8 quadros, 12 fps), idle (24 quadros, 2 s).
- Folhas exportadas (256x256, pés em y=243): assets/anim/rig/era2_hero_t0_run_bones.png (8), era2_hero_t0_idle_bones.png (24).
- Medição (sola mais baixa por quadro, folha 256): ossos 242-243 em todos; pé de apoio recua 9,5 px/quadro constante.
  Quadros (vídeo): 239-243 (até 4 px acima do chão) e o ponto de contato pula sem ordem (122,182,167,146,138,168,151,128) → patina.
- Limites dos ossos: perna sem joelho (a perna no ar encurta até 24%); contorno um pouco mais fino nos membros; cabeça ~3% mais alta que o sprite parado.

## Ajustes após retorno do dono (2026-11-12)
- "Com arma na mão fica troncho: cabeça deslocando, braço saindo fora." Corrigido sem crédito: braço da arma mais curto (escala 0,175) e
  firme à frente (−22° ± 6°), lâmina a 38° (não cobre o rosto), cabeça oscila só 1°, cachecol caído (−38° correndo, −40° parado).
  Folhas refeitas com a arma weapons/era2_t1 pelo grip do meta.json.
- PO pausou o uso de créditos até o dono aprovar a arte item a item (página de aprovação da fps-98). Total gasto por mim: 4 créditos.
- Som: 22 arquivos corrigidos com ffmpeg conforme reports/qa_audio.md (originais em assets/audio/_orig/); aguardando reteste da fps-0b.
- Pareceres da QA em reports/qa.md: ossos passam em todas as medidas; quadros patinam.

## Fila nova do dono (via PO, só depois da aprovação na página https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19)
- AURA DE FORTALECIMENTO atrás do herói, presa ao chão, por nível da arma: +0–3 nada; +4–6 azul; +7–9 roxa pulsando;
  +10–12 chamas vermelhas subindo; +13–15 dourada com raios girando. Plano: quase toda por código (gradientes, partículas,
  assets/fx/aura.png girando), 0 crédito; só as chamas podem pedir uma folha de quadros.
- MONTARIA: dá poder, precisa de animação própria (correr) e do herói montado. Depois.
- Som (reteste 2 da fps-0b): os 44 aprovados por medida; music/era4 com emenda 1,8x e -15,0 LUFS; claim -16,5 LUFS; ui_tap -17,8 LUFS
  (no limite, medida ruim por ter 0,1 s: decidir de ouvido). Pronto para entrar na página de aprovação do dono.

## Fase 0 — prova modular (2026-11-12), 14 créditos (saldo 597,65)
- 7 edições nano_banana_pro do sprite aprovado: careca, loiro espetado, rabo de cavalo, olhos azuis, olhos fechados, tronco sem
  membros (não usado: saiu pequeno e com tocos de braço), folha de braço/perna com mão fechada num cano magenta.
- tools/align.js (alinha edição ao sprite), tools/depole.js (tira o cano guia e devolve o grip), tools/modbuild.js (camadas).
- Camadas em assets/anim/rig/era2_hero_t0/m_*.png + rig.json "mod". js/anim.js: opts.look {hair:'orig|spiky|pony', eyes:'orig|cyan|closed'},
  estado 'attack' (golpe 0,6 s), piscada, braço da arma com cotovelo (mão direita = braço de trás, sai de trás do tronco),
  cabo entre braço e punho, espada atrás da cabeça na preparação.
- Folhas: assets/anim/rig/kael_mod_{a,b,c}_{idle,run,attack}.png; página: test/anim/mod/.
- Fila do PO: fases 1-3 aprovadas em ~557 (+aura ~35). Aura reprovada em código: refazer com arte animada, amostra +13 antes.

## Técnica HÍBRIDA (2026-11-12): vídeo + bastão-guia — corrida pronta
- Dono reprovou os ossos ("a corrida não encaixa"). Novo método: o corpo sai por vídeo (seedance_2_0 fast 480p 4 s, início=fim)
  a partir do sprite aprovado segurando um bastão magenta (edição nano_banana_pro). tools/polevid.js acha o eixo do bastão por
  quadro (PCA), o trecho escondido pelos dedos (= empunhadura), apaga o bastão e preenche o buraco onde ele cruzava o corpo;
  tools/loopsheet.js acha o ciclo (P=32 a 24 fps, 8 quadros) e monta a folha 256 com a mão por quadro (json).
- Composição: quadro → arma no ângulo do bastão → dedos redesenhados por cima (recorte em volta da mão). Página: test/anim/hyb/.
- Folhas: assets/anim/hyb/kael_run_body.png/.json, kael_run_era2_t0/t1/t2.png. Gasto da fase 0: 28 créditos (14 camadas + 14 perfil/híbrido). Saldo 565,65.
- Próximo: cabeça rastreada para cabelo/olhos; golpe e parado pelo mesmo método (~6 cada).

- 2026-11-12: DONO APROVOU a corrida híbrida (kael_run_era2_t0/t1/t2 + body). Próximo: golpe e parado pelo mesmo método.
- Golpe e parado híbridos (8 créditos): assets/anim/hyb/kael_{idle,attack}_era2_t0/t1/t2.png + *_body.png/.json. Lâmina para trás = desenhada atrás do corpo (cos(ang)<-0,25 ou bastão escondido no vídeo); 3 quadros de transição removidos.
- BUG no golpe (dono): o vídeo troca o bastão de mão no preparo; detector pegava a ponta (espada solta); lâmina vazava para o quadro vizinho. Corrigidos detector (pele, quadro a quadro) e corte por célula. Golpe RETIRADO da página; 2ª geração também trocou de mão. Gasto da etapa: 12. Próximo: quadro-chave do preparo na mesma mão (+8, aguardando PO).
- Quadro de preparo (2 créditos): o modelo ergueu o bastão com a OUTRA mão de novo. Causa: em 3/4 olhando à direita, a mão DIREITA do Kael é a do lado esquerdo da tela; a corrida aprovada tem a arma na mão ESQUERDA dele e o modelo sempre corrige para a direita no golpe. Parado e reportado ao PO (opções A: refazer tudo na mão direita ~14; B: golpe por quadros-chave em imagem).
- MÃO DIREITA (opção A do dono), 14 créditos: assets/anim/hyb/R/kael_{run,idle,attack}_era2_t0/t1/t2.png + bodies. Mesma mão nos 3 vídeos. Cabeça redesenhada sobre a lâmina, buraco do bastão preenchido (polevid), poeira removida. Página: test/anim/hyb/?v=R/&s=run|idle|attack.
- Plano cortado do dono: F1 14 roupas, 6 cabelos, 6 olhos, 4 expressões, 4 chapéus, 14 armas + rastros, aura (amostra +13); F2 7 ults + 3 montarias; F3 inimigos; pets depois do lançamento.
- 2026-11-12: DONO APROVOU o golpe da mão direita (R/kael_attack_*).
- Plano (dono, via PO): armas 14→7 (lendária por era), montarias 2 (Medieval, Futurista), roupas 10, cabelos 5, olhos 5; FASE 4 = 5 pets no lançamento (lobo, coruja, dragãozinho, golem de cristal, fênix; ~78). Saldo 537,65. Agora: amostra aura +13.
- Amostra aura +13 (6 créditos): assets/anim/aura/aura13.png/.json (16x 256x320, 12 fps; imagem nano_banana_pro em fundo preto, checker falso removido, vídeo seedance início=fim, tools/fxsheet.js luminância→alfa). Preview hyb/?aura=13.
- 13 sons reprovados refeitos por síntese (tools/synth.js), 0 crédito: assets/audio/_new/*.mp3, normalizados ~-14 LUFS. Originais intactos até aprovação.
- Dono APROVOU Kael mão direita (corrida, parado, golpe), aura +13 e os 13 sons sintetizados. Sons substituídos em assets/audio/sfx (rejeitados guardados em assets/audio/_rejeitados).
- Bloco era 2 (46 créditos, saldo 453,65): ataques era2_e0/e1/boss (assets/anim/hyb/enemy, tools/enemykey.js, PADL no loopsheet), ult era 2 animada (assets/anim/ult/era2_ult.png, tools/ultsheet.js; preview test/anim/ult/), auras 4/7/10, prova de cabelo/elmo por cabeça rastreada (tools/headswap.js; R/kael_run_body_hat|hair_*). Páginas: test/anim/sheets/. Inimigos virados errado na fonte: era0_boss, era3_e0, era5_boss.
- Fila v0.4 (PO): depois dos inimigos/ults era 2 → (a) Kael apanhando e morrendo (híbrido, com e sem arma), (b) pose de tiro eras 3-5, (c) roupas de era. Também: Kaia (1 imagem de referência antes), pickups por código.
- Inimigos era 2 completos (16 créditos, saldo 437,65): hurt/die para e0/e1/boss, boss_run; padRight nos ataques; ult era 2 com fade e paleta (0,54 MB). js/pickups.js (moeda/XP por código) + test/anim/pickups/. Estimativa dos 7 espaços enviada ao PO.
- QA: B1 corrigido (boss hurt com pés fixos em 243, loopsheet FEET=1), e1 attack com padRight 96, mancha da bota do Goblin (quadro 7) apagada.
- PO aprovou versão barata dos 7 espaços (~48): 49 ícones (raridade na moldura/brilho por código), 4 chapéus + 3 asas por imagem rastreada, colar por código, luvas/botas recoloridas por código, Kaia 14 (ref. antes). Ordem: s1/s2 era 2 → ults era 0 e 5 → 7 espaços.
- s1 era 2 = golpe aprovado + arco azul (assets/fx/slash.png) no quadro de corte, por código (preview hyb/?v=R/&s=attack&trail=1). s2 Corte Giratório (4): R/kael_spin_body.png/.json (18 quadros). Ults era 0 (mamute, KEY=g, blend source-over) e era 5 (foguetes, source-over): assets/anim/ult/era0_ult, era5_ult (+12). Preview ult/?era=0|2|5. Servidor 8091 parado (sem /save); exportações com arma ficam por código no jogo.
- tools/compose.js: monta corpo+arma+dedos+cabeça(+arco s1) em PNG sem navegador (substitui o /save do 8091). Exportados R/kael_attack_trail_era2_t0|t1|t2 e R/kael_spin_era2_t0|t1|t2 (448x256, pad 96/96). Quadro do giro com resto de bastão no rosto removido (17 quadros).
- INIMIGOS DAS 7 ERAS completos (194 créditos, saldo 191,65): assets/anim/hyb/enemy/era{0..6}_{e0,e1,boss}_{run,attack,hurt,die}. tools/enemyset.js automatiza (vídeo→folha). Fonte do jogo virada: era0_boss, era3_e0, era5_boss (originais em assets/enemies/_orig). Drone compacto novo em assets/enemies/era5_e0.png (xf_drone.json, base y=200). Prévia sheets/?era=N.
- QA S1 (topo cortado): todas as folhas de inimigos refeitas com padTop 64 (h=320, feetY=307; tools/rebuild_enemies.js), 0 cortadas. Hurt do fantasma sem FEET.
- QA S9/S3: padBottom 32 (h=352, feetY=307) em todas; hurt refeito como recuo e volta (ping-pong 1..13..3), termina perto da pose neutra. 0 cortes.
- ERRO MEU corrigido: rebuild 12:05 tinha regravado a era 2 APROVADA (h=352). Restaurada com parâmetros aprovados (h=256, feetY 243). Regra: arte aprovada não muda; rebuild_enemies.js agora tem SKIP2. Hurts das outras eras: pico de reação (tools/hurtidx.js) + ping-pong; 5 ainda pouco reativos (era5_e1, era4_e0, era5_boss, era6_e0, era1_e0).
- 4 ultimates (24 créditos): era1 (raios), era3 (canhões, source-over), era4 (tesla), era6 (buraco negro) em assets/anim/ult/; tools/ultset.js. 7 ultimates completas. Preview ult/?era=N.
- Créditos +500 (saldo 589,65 após): 49 ícones de espaço (assets/icons/slots/), 14 ícones de menu (assets/icons/menu/, summon refeito), Kaia ref (rig/src/kaia_ref.png, aguarda dono), 4 chapéus novos na corrida (R/kael_run_body_hat_*), 3 asas (rig/src/look/wing_*). Prova colete/luvas/botas por região rastreada: NÃO natural (peito escondido na guarda; punhos mudam de forma) — proposto: chapéu/arma/asa/colar independentes; colete+luvas+botas = roupa por vídeo, cor de luva/bota por código.
- Auditoria aprovados x jogo: reports/arte_aprovada_vs_jogo.md. Kaia ref transparente: assets/hero/kaia_ref.png.
- Eras novas (7 Submundo, 8 Celestial), fase 1 de referências (32 créditos): assets/bg/era7|8_ref.png, assets/enemies/era7|8_{e0,e1,boss}.png, assets/weapons/era7|8_t0..t2.png, assets/hero/era7|8_t0..t2.png (src em assets/eras_novas/src). Pets refs: assets/pets/*_ref.png. Aguardando votos.
- 2026-11-12 tarde: disco cheio (0 MB às 13:49 por outra sessão): apaguei ~3,9 GB dos meus brutos/intermediários (rig/src/**/_raw, enemy/*_clean, look/, vid/*_clean), mantendo os .mp4. Checagem: nada zerado.
- Conferência no jogo v0.11: inimigos atacam com folha, pés fixos, virados para o Kael; divergência = parado entre golpes é estático (prévia idle A/B em test/anim/idle/, aguarda voto). EN_STRIDE dos 21 entregue (v0.11.1).
- Ícones leves (ok PO): slots 256→240 sem perda, 3,68→1,02 MB; originais em assets/icons/_aprovado_original/slots; fontes movidas para _fontes_arte/icons_slots_src; comparação test/anim/icons/.
- Golpe largo (correção técnica aprovada pelo PO): hyb/R/kael_attack_wide_era2_t0..2 (448x256, pad 96/96) — a de 256 cortava a lâmina; test/anim/wide/.
- Morte do Kael (4 créditos): hyb/R/kael_die_body.png/.json (18 quadros, 12 fps, 448x256, pad 96/96, chão y=243, impact knee 12/body 16), tools/deathsheet.js (passo por movimento). Espada cai por código, poeira e escurecer: test/anim/death/. Não ligada no jogo.
- Pets médio+evoluído (20 créditos): assets/pets/era{0..4}_*_{mid,evo}.png (512, transparentes); prévia 3 estágios com aura por código: test/anim/pets3/. tools/pets.js.
- Asas (4 créditos, batida por código): assets/anim/equip/wing_{demon,angel}_{L,R}.png + .json (raiz); montadas para a página: assets/anim/equip/preview/kael_{idle,run}_wing_{demon,angel}.png/.json (24q, 12 fps, 448x256, pad 96). tools/wings.js, wingsheet.js. Prévia test/anim/wings/.
- Auras Submundo/Celestial (14 créditos: 3 imagens + 2 vídeos; 1 vídeo barrado por "ip_detected" sem cobrança): assets/anim/aura/aura_evil (fundo verde, blend source-over) e aura_holy (lighter), 16x 256x320, 12 fps. tools/auraset.js, fxsheet.js KEY=g. Prévia hyb/?v=R/&s=idle&aura=_evil|_holy. Saldo 505,65.
- Pose de tiro (16 créditos): hyb/R/kael_gun_{idle,run,shoot}_body (bastão nas duas mãos, tools/gunrip.js acha as 2 mãos), montadas hyb/R/gun/kael_gun_{s}_{era3_t2,era4_t1,era5_t1,era6_t0} + _hands.json (rear/front/ang/shot); tools/gunsheet.js (arma na mão de trás com ponto (grip x, muzzle y), clarão assado). Prévia test/anim/gun/.
- feetDy (dados, sem PNG): era3_boss_attack (sobe) e era3_boss_hurt (REMOVIDO: base já estava na linha; medição por colunas fixas errou). Escorpião era1_e1 salta de verdade (q4-10), aguardando PO; Devorador ok na folha. tools/feetdy.js.
- 3 pets novos (18 créditos): assets/pets/{era7_cerberus,era8_pegasus,prism_fox}_{ref,mid,evo}.png; na prévia pets3.
- Escorpião (era1_e1_attack): PO manteve o bote. Valores guardados caso o dono reprove: "feetDy": {"4":5,"5":15,"6":15,"7":15,"8":15,"9":9,"10":4}.
- Devorador era6_boss_attack q6-7: mancha cinza translúcida (resto do chroma) até 10 px abaixo do feetY; limpar só com ok do PO.
- Devorador: limpeza autorizada (alfa<128 abaixo do feetY, q6-7, 275 px) em assets/anim/_staging; copiar só quando fps-c9 avisar 'QA fechou a v0.11.6'. Original em hyb/enemy/_aprovado_original.
- 15:00-15:35: Kael 4 fases (assets/hero/phases, 6 créd.), subir de nível/evolução por código (test/anim/levelup), mapa-múndi + era0 (assets/map/world.jpg, era0.jpg), Relógio das Eras (clock_whole/empty + clock_shards 0-8 + shards.json), ovo (assets/pets/pet_egg.png).
- Pets filhote: 25 vídeos prontos (mamute processado em assets/anim/pets/era0_mammoth_*; demais na fila tools/petvid/queue.txt, rodar: node petset.js <key> <state> <url> [fly]; idle usar IDX=1,9..89).
- Pistola (opção A): pose-guia com pistola MAGENTA (tools/pistol/pose.png), 3 vídeos em tools/pistol/queue.txt; processar com tools/pistolrip.js (acha silhueta+mão, apaga magenta) e trocar a pele por código.
- Kaia: guarda com bastão (tools/kaia/guard.png), 3 vídeos em tools/kaia/queue.txt; mesmo pipeline do Kael (polevid → loopsheet FIX=kael_run_body.json → compose).
- Processamento local PARADO a pedido da fps-c9 (janela do APK). Saldo 327,65 (aprox.).
- 15:40-16:05 (processamento liberado pela fps-c9, um vídeo por vez): 25 folhas de pets filhote em assets/anim/pets (prévia test/anim/petsanim; efeitos na borda com degradê); pistola uma mão (hyb/R/kael_pistol_*_body + hyb/R/pistol/kael_pistol_{s}_{era3_t0,era4_t0,era5_t0,era6_t0}; tools/pistolrip.js + gunskin.js; prévia test/anim/pistol); Kaia (hyb/kaia/kaia_{run,idle,attack}_{body,era2_t1}; prévia test/anim/kaia; behind falso corrigido, quadro 7 do golpe = cópia do 8); mapas era1-8 (assets/map/era1..8.jpg, 16 créd.); folhas fx levelup/evolve_0_1 (assets/anim/fx, tools/fxexport.js). Saldo 311,65. Eras 7-8 aguardando o ok do PO para o corte de ~10.
- 16:00-16:30: eras 7-8 animadas (hyb/enemy/era{7,8}_*; ult era7/era8; tools/e78run.js, stray.js; diabrete refeito com tanga por filtro nsfw; prévia sheets/?era=7|8). Montarias: refs assets/mounts/mount_{wolf,griffin}_ref.png; Kael montado método B (vídeo com Kael na sela + bastão): assets/anim/mounts/kael_{wolf,griffin}_{run,idle,attack}_{body,era2_t1} (512x352, pad 96/160/96, patas 339); tools/compose2.js (compose com altura da folha). Prévia test/anim/mount/?m=wolf|griffin. Saldo ~193.
- 17:00-18:30: Kael adolescente/adulto/guerreiro (hyb/phase1..3, tools/phaseset.js; giro do adulto e guerreiro com anel de corte por código); revólver consertado (mão perdida = média dos vizinhos); ícone leilão; avô (assets/hero/grandfather.png); máscaras colete/botas 4 fases (R=colete,B=botas; tools/gearmask.js+gearmask1.js); aura das montarias por estrela (subagente, assets/anim/mounts/*_Nstar); pets médio/evo: vídeos na nuvem, ids em tools/petvid/jobs2.txt (baixar só quando houver disco). Disco crítico (~800 MB); .tmp de 188 MB em Temp não é meu.

## 2026-11-12 — Pets médio/evoluído (econômico) — ENTREGUE
- 30 folhas: assets/anim/pets/<pet>_{mid,evo}_{run,idle,atk1}.png/.json (mammoth, sphinx, dragon, parrot[voo], mechdog). Célula 512×352, pés 307, 12 fps.
- Prévia: test/anim/petsanim/?s=mid | ?s=evo. Esfinge evo idle refeita (1º vídeo veio com fundo cinza). Saldo após: 931,65.

## 2026-11-12 — Chapéus por era (aparência em camadas) — EM CURSO
- Chapéus soltos: assets/anim/equip/hats/hat_era0..6.png + hats.json (pivô, res). Novos: romano (era1), militar (era5) — 2 imagens nano_banana_pro sobre a guarda; os outros recortados das edições antigas (assets/anim/rig/src/look/hat_*.png) com tools/hatcut.js.
- Âncora "head" por quadro (código, sem crédito; tools/hatanchor.js, hatall.sh): assets/anim/hyb/<R|phase1..3>/masks/kael_<estado>_head.json, coordenadas da folha do jogo (a mesma da máscara). Arquivo separado para não mexer em .json aprovado.
- Prévia: test/anim/look/?p=R|phase1|phase2|phase3&s=<estado> (3 combinações + tudo oculto).
- Correções por código dos REPROVADOS (sem crédito): guerreiro lendário pistola parado/correndo/atirando (tools/pistolfix.js: punho achado na folha do corpo; reprovados em hyb/phase3/_reprovado); Kael no lobo parado (grip dos quadros 8-11 interpolado 7→0 no _body.json; compose2 HEADMAXDX=8 para a camada da cabeça não pegar a cabeça do lobo; auras 3★/5★ do parado refeitas; reprovados em mounts/_reprovado).
- Cosméticos e chapéus 7-8 (6 imagens ~10 cr): equip/cos/{goggles,visor,ninja,carnival}.png + cos.json; equip/hats/hat_era7 (demoníaco), hat_era8 (coroa celestial). hideHair por chapéu em hats.json; máscara de cabelo por código (tools/hairmask.js) a gerar junto com as âncoras.
- 2026-11-12 fps-ff (armas por raridade): +18 artes novas assets/weapons/eraN_raro.png e eraN_mitico.png (eras 0-8, nano_banana_pro com a arte do tier anterior como referência, mesmo enquadramento), chaves eraN_raro/eraN_mitico (eras 0-6) adicionadas ao meta.json (backup meta.json.bak), copiadas de t0/t1 e conferidas pela bbox/boca do cano. Eras 7-8 sem meta (igual às t0-t2). Prévia: test/anim/weapons_rarity/. Custo 38 créditos (19 gerações, 1 refeita: era3_mitico ficou parecida demais com o Épico). Falta: o código ainda mapeia Raro->t0 e Mítico->t1 (tierOf).
- 2026-11-12 ~19h: PETS NOVOS animados (econômico, 3 estágios): era7_cerberus, era8_pegasus, prism_fox {,_mid,_evo}_{run,idle,atk1} em assets/anim/pets (27 folhas, ~27 vídeos). prism_fox_mid_atk1 q6-7 limpos por código (tools/petclean.js) após QA da fps-69. Prévias da aparência montadas: assets/anim/look_preview/kael_{boy,phase1..3}_{run,idle}_look_{a,b,c,oculto}.png/.json.
- 2026-11-12 ~19:15 KAIA CRESCENDO (fps-ff): refs assets/hero/phases/kaia/kaia_phase{1,2,3}_src.png (+ _pole/_pistol guias). tools/kaiaphase.js (cópia do phaseset.js → hyb/kaia_phase<N>/kaia_*), tools/kaiaph/{fix.js (FLIP 180°/FRONT/BEHIND + recompõe), despeck.js (verde, soltos, linhas finas, GHOST=borrão do bastão na cabeça), norm.js, grid.js, jobs.txt}. Fase 1 completa (8 animações): golpe refeito (borrão no 1º vídeo), quadros 3-5 e 9-16 do golpe virados 180°, corte no 6. Página test/anim/kaiaphase/?p=1. Gasto 70 até aqui.

## 2026-11-12 — 4 montarias novas com o Kael montado (Pônei, Cavalo de guerra, Mítica=Tigre de cristal, Serpe dourada) — ENTREGUE
- Ids do js/sys/mount.js: pony, horse, mythic, wyvern. Refs: assets/mounts/mount_{pony,horse,wyvern}_ref.png; opções da Mítica: mount_mythic_opt_{tiger,wyvern}.png (PO: tigre). Guias com bastão magenta: assets/mounts/src/new/*_guide.png.
- Folhas: assets/anim/mounts/kael_<m>_{run,idle,attack}_{body,era2_t1}.png/.json (512x352, pad 96/160/96, patas 339; 8/12/17 quadros) + auras kael_<m>_{run,idle}_{1..5}star (mountaura.js estendido; lobo/grifo conferidos byte a byte, iguais).
- Ferramentas: tools/mountset.js (vídeo -> folhas), mount/setgrip.js (corrige ângulo onde o polevid trocou a ponta), mount/depink.js (resto rosado/cinza do bastão na faixa do eixo), mount/erasepole.js, mount/recompose.js, mount/check.js (conferência da mão).
- Correções nas ferramentas (opcionais, só nas montarias novas): loopsheet GRIPFDY=1 (o y da mão recebe o deslocamento dos pés do FEET; sem isso a espada ficava 47-63 px abaixo da mão — falha do QA fps-69 corrigida), compose2 NECKMAXX=245 (vermelho da serpe não vira pescoço). Arma sempre na frente (ALLFRONT) e na mão em todos os quadros (conferido em mount/check.js).
- Créditos: ~69,5 (9 imagens nano_banana_2 + 14 vídeos seedance; 1 "ip_detected" estornado). Prévia: test/anim/mount/?m=pony|horse|mythic|wyvern&s=1..5.
- Correções QA fps-69: tigre ataque q3-5 (ponta cortada no topo) -> ângulo 126/122/120 (mount/setgrip+recompose), margem 10-20 px; pônei parado/correndo risca rosada atrás da mão (sobra do bastão) -> tools/mount/poletail.js + recompose + auras 1-5★ refeitas. Reprovados em mounts/_reprovado.
- 2026-11-12 ~19:45 KAIA CRESCENDO completa (fps-ff): 3 fases × 8 animações em assets/anim/hyb/kaia_phase{1,2,3}/ (kaia_{run,idle,attack,spin}_era2_t1 + _body, kaia_die_body, kaia_pistol_{idle,run,shoot}_era5_t0 + _body, *_grip_src.json; giro das fases 2-3 sem grip_src porque o bastão sumiu num quadro, grip interpolado no _body.json). Página test/anim/kaiaphase/?p=1|2|3. Correções: golpe/giro com empunhadura deslizada da ponta do bastão até o punho (fix.js SHIFT), quadros invertidos 180°, pistola da armadura no punho achado na folha (tools/kaiapistolfix.js = cópia do pistolfix; kaiaph/gunfist.js = ponta direita do corpo na altura do braço + mediana de vizinhos). Gasto 118 créditos (9 imagens + 25 vídeos; 2 ip_detected sem custo). Saldo da conta 540,15 (compartilhada). Nenhum arquivo aprovado alterado.
- Kaia: máscaras da aparência em camadas (sem crédito) em hyb/{kaia,kaia_phase1..3}/masks/kaia_<estado>_{mask,head,hair} (tools/kaiamasks.sh; âncora com a guarda do Kael; botas de metal com BOOTMETAL=1 no gearmask.js para adulta/guerreira).
- Kaia adulta: âncoras refeitas com busca restrita ao topo do corpo (hatanchor HEADTOP); morte com ângulo pelo vetor corpo->cabeça (tools/headang.js) e q2,14,15 interpolados; cabelo refeito. Antigos em kaia_phase2/masks/_old.
- 2026-11-13 ~01:00 KAIA ADULTA/GUERREIRA V2 (fps-ff/fps-75): fases 2 e 3 refeitas das refs V2 aprovadas (assets/hero/phases/v2/kaia_phase{2,3}_v2.png, mulher adulta). Guias novas em assets/hero/phases/v2/kaia_phase{2,3}_v2_{pole,pistol}.png (morte direto da ref). 8 animações × 2 fases em assets/anim/hyb/kaia_phase{2,3}/ com os MESMOS nomes (engenheiro não muda nada); antigas em assets/anim/hyb/_v1/kaia_phase{2,3}/ (com masks/). Página test/anim/kaiaphase/?p=2|3. Correções por código (sem crédito, tools/kaiaph/): gripglove.js (empunhadura na luva + fdy), polewipe.js (rastro do bastão), deflash.js (clarão do vídeo / sobra à frente do punho), fxwipe.js, interp.js, gripset.js, shift96.js, verify.js, swordfix.sh; compose2.js ganhou FORCEFRONT=i,j (padrão inalterado). BUG achado: folhas não-paradas saíam 96 px à direita (loopsheet soma o pad em cima do xf do parado) — corrigido nas folhas V2 da Kaia e no kaiaphase.js; as folhas de fase do KAEL (hyb/phase1..3, run/attack/spin/pistol_run/pistol_shoot) têm o mesmo desvio. Fase 3 em 113,5% (116% cortava o rabo de cavalo no topo). Prompt sem efeitos ("No motion blur, no trails, no glow, no visual effects") evita o bastão virar sabre brilhante. Gasto 88 créditos (4 imagens + 20 vídeos; 2 ip_detected sem custo; 4 refeitos por efeito no vídeo). Saldo da conta 291,15 (compartilhada com o Kael).
- 2026-11-13 ~01h KAEL ADULTO/GUERREIRO V2 (fps-ff / fps-75): fases 2 e 3 refeitas das refs V2 aprovadas (assets/hero/phases/v2/kael_phase{2,3}_v2.png), proporção adulta. 8 animações por fase em hyb/phase2 e hyb/phase3 com os MESMOS nomes (kael_{run,idle,attack,spin}_era2_t1 + _body + _grip_src, kael_die_body, kael_pistol_{idle,run,shoot}_era5_t0 + _body + _grip_src). Antigas em hyb/_v1/phase2 e _v1/phase3. Guias: assets/hero/phases/v2/kael_phase{2,3}_v2_{pole,pistol,free}.png (+ _pistol_pad). Ferramentas (cópias, nada compartilhado alterado): tools/kv2_phaseset.js, kv2/{polevid2 (mão = buraco do punho, luva sem pele), pistolrip2+gunskin2 (luva conta como mão/dedos por cima), pistolfix2, clean2 (rosa, fino, ilhas, faixa do bastão), setang, copyframe, erase, gripfdy (y da mão + deslocamento dos pés), check, strip, handzoom, norm, masks.sh, jobs.txt}. Correções: golpe p2 q10-13 virados 180°, q4=cópia do q3, q12 ângulo; golpe p3 q10-16 virados, q9=cópia do q8; giro p2 q2/7/13 ângulo; giro p3 q11=cópia do q10; espada sempre na frente; pistola: punho achado na folha (pistolfix, p3 correndo SHIFT=1.1) e conferido em zoom quadro a quadro. Todos os .json com padLeft/padRight 96, pés em 243. Fase 3 corta ~4 px no topo por conta da altura 247 (1,16×213) com pés em 243 (igual à V1). Máscaras (colete/botas/cabeça/cabelo) refeitas. Créditos ~74 (5 imagens + 16 vídeos; 5 ip_detected sem custo). Página test/anim/phase/?p=2 | ?p=3.
