# POLIMENTO: fila de bugzinhos visuais (ordem do dono, 13/11, 02h)

Nas palavras do dono: "Tá jogável, já tá bem avançado. Só que tem muito bugzinho... a arma em cima da montaria sai da mão, ela flutua... imagem de arma que não aparece... tudo tem que ter imagem, tudo tem que ser polido."

## Regra geral
- **Tudo tem imagem.** Onde aparece arma, aparecem também montaria e pet com a arte real (e não texto, ícone genérico ou emoji). Isso vale para oferta, loja, passe, invocação, correio, prêmios, eventos, arena, perfil e coleção.
- Nada flutua: arma na mão (a pé e montado), asa nas costas, pet no chão, montaria com as patas no chão.
- Pet, montaria, asa e aura nunca somem do Kael, em nenhuma tela.

## Quem faz
- **QA = caçador de polimento.** Varre tela por tela na aba 2 (Modo dono, níveis 1/20/38/50/70, com e sem montaria/pet/asa). Cada achado vira uma linha abaixo, com um print em `reports/prints/pol_<n>.png`.
- **Arte: um agente só de polimento de imagem.** Corrige o que é imagem (arma solta na montaria, arte faltando, recorte, âncora). Primeiro tenta por código; o que custa crédito vai antes para o PO.
- **Engenheiro:** corrige o que é código (posição, camada, imagem que não carrega).
- **PO:** prioriza, cobra e mostra ao dono.

## Achados (formato: `- [ ] P<n> · tela · o que está errado · dono da correção`)
- [x] P1 · Oferta de 1ª compra · não mostra a imagem do Lobo de guerra (montaria) nem do pet; tem que mostrar tudo com a arte real · Engenheiro/Servidor (p_offer)
- [x] P2 · Batalha montado · a arma sai da mão e flutua em cima da montaria · Arte (encaixe nas folhas montadas) + Engenheiro — Arte (fps-75): grip do lobo/grifo estava 30-40 px abaixo do punho (na perna) → no punho e repouso 24°; serpe 46°→22° (commit 58af167)
- [x] P3 · Batalha montado · a arma não aparece na mão com o Kael montado (QA confirmou: não é arquivo faltando; 26 telas sem imagem quebrada) · Engenheiro junto com a asa montada
- [ ] P4 · Vitória (e outras cenas) · o pet some; montaria/asa/aura também precisam aparecer · Engenheiro (drawHeroFull)
- [x] P5 · Todas as cenas · a asa fica atrás da cabeça em vez das costas · Engenheiro (âncora das costas da Arte)
- [x] P6 · Vitória · diz "Javali" quando o chefe é o Rex Furioso (nome do chefe errado) · Engenheiro
- [x] P7 · Tela de Montarias · a Serpe não está na lista (5 de 6) · Engenheiro
- [ ] P8 · Instância · o texto de tempo esgotado é igual ao da derrota · Engenheiro
- [x] P9 · Oferta 24h · usa o ícone de Eventos; precisa de ícone próprio · Arte — FEITO: assets/icons/menu/offer.png (presente + cronômetro) e ícones dos eventos assets/icons/events/{worldboss,goldenhour,invasion,weekend,pethunt,forge}.png
- [x] P10 · Instâncias · tela ainda desligada (fluxo 24/26) · Engenheiro (painéis)

## Achados do QA (varredura de 13/11, aba 2, Modo teste nível 60; prints em reports/prints/)
- [x] P11 · Batalha montado (grifo) · CONFIRMA P2/P3: o Kael montado não mostra a arma na mão (só um brilho); print reports/prints/pol_1_montado_asa_arma.png · Arte (folhas montadas com arma) + Engenheiro
- [x] P12 · Batalha a pé e montado · CONFIRMA P5: a asa nasce na altura da CABEÇA/ombros (asas abertas atrás da cabeça), não nas costas; prints pol_1 e pol_2_asa_na_cabeca_a_pe.png · Engenheiro (âncora das costas, vinda da Arte)
- [ ] P13 · Vitória (lobo + asa) · CONFIRMA P4: o pet (mamute) some na cena da vitória; a montaria e a asa aparecem (asa também na cabeça); print pol_3_vitoria_sem_pet_asa_cabeca.jpg · Engenheiro (drawHeroFull)
- [x] P14 · Loja (cartão OFERTA) · cortava o texto em 288 px · CORRIGIDO e conferido em 288 e 390 px (QA)
- Conferido SEM defeito (varredura de 26 telas): nenhuma imagem quebrada nas telas Equipamento, Invocar, Loja, Passe, Forja, Pets, VIP, Ranking, Config., Torre, Missões, Instâncias, Perfil, Códex, Guilda, Chat, Arena, Eventos, Torneio, Mapa, Correio, Montarias, Aparência, Leilão, Oferta, Práticas; nenhum emoji nelas; todos os arquivos assets/weapons/era0..8_t0..2.png, assets/hero/era0..8_t0..2.png, assets/enemies/era0..8_boss.png e assets/map/era0..8.jpg existem.
- [ ] A VARRER (próxima passada): arma por era/raridade em campo na batalha (eras 1-8), Kael sem montaria/pet/asa em cada era, pet sob a montaria, Oferta (P1) e Invocar com a arte, Passe/Correio com imagem de prêmio, níveis 1/20/38/50/70 de verdade (a varredura de hoje foi num save de nível 60).
- [x] P15 · Batalha montado (cavalo, e conferir nas 6 montarias) · em alguns quadros aparece um BRAÇO saindo de trás do cavalo, sem sentido (visto pelo dono durante o teste do engenheiro) · Arte (limpar os quadros das folhas montadas) + Engenheiro (camada/ordem de desenho) — FEITO (fps-75): ataque das 6 montarias limpo quadro a quadro (cavalo 1,2,6-12; grifo 1,2,6-13; lobo 0-16; tigre 2-13; pônei 7-16; serpe 8-13), prints pol_15_<m>_attack.png; idle/run estavam limpos; folhas a pé ainda na fila

## Padrão de polimento FINO (ordem do dono: "o polimento tem que ser bem fino")
- Conferir QUADRO A QUADRO cada animação montada e a pé (folha de contato ampliada), e não só o print parado.
- Nada de parte do corpo sobrando, duplicada, cortada ou atrás de onde não deveria (braço, perna, arma, cabelo, asa).
- Nada piscando entre os quadros e nenhum resto de recorte (verde, magenta, contorno escuro).
- A arma sempre na mão, a asa sempre nas costas, os pés e as patas sempre no chão.
- [x] P16 · Bem-vindo de volta (ganho offline) · mostrar TUDO que ganhou no tempo fora antes de coletar: tempo fora, ouro, XP e níveis subidos (Nv 58 → 60), itens por raridade com imagem, ração/pedras/fragmentos com ícone; botão Coletar com os números contando · Servidor (p_intro)

### Passada FINA, quadro a quadro, folhas das 6 montarias (QA, offline: folha de contato ampliada; ferramenta test/paineis fora do repo)
Metodologia: cada folha assets/anim/mounts/kael_<montaria>_<idle|run|attack>_body.png foi aberta quadro a quadro. IDLE e RUN das 6 montarias: LIMPOS (sem sobra, sem piscada). Defeitos só nas folhas de ATAQUE (todas com 17 quadros), todos de IMAGEM (dono: Arte):
- [x] P10 · kael_horse_attack_body.png · quadros 2 e 6-7: braço/capa "fantasma" semitransparente borrado sobre o tronco/sela e a PONTA da lança flutuando atrás da garupa (sem cabo) = o "braço saindo de trás do cavalo" do P15; print reports/prints/pol_4_cavalo_ataque_borrao_e_ponta.png · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P11 · kael_griffin_attack_body.png · quadro 2: borrão corrompido sobre olho/rosto e mão do Kael; quadro 12: faixa de traços horizontais picados na altura do antebraço/peito; print pol_5_grifo_ataque_borrao_rosto_e_tracos.png · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P12 · kael_wolf_attack_body.png · quadros 1,3,5: linhas pretas riscadas (haste/guia do recorte) ao redor da mão e traços verticais sobre a armadura do lobo; quadros 9-12: franja/rastro borrado à direita da cabeça do lobo; print pol_6_lobo_ataque_tracos_pretos_e_rastro.png · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P13 · kael_mythic_attack_body.png (Tigre de cristal) · quadros 7-12: faixa vertical CORROMPIDA (listras roxo/branco/verde) cobrindo o rosto/pescoço do tigre; quadros 2-3: borrão no tronco e um bloco preto flutuando na mão; print pol_7_tigre_ataque_faixa_corrompida_no_rosto.png · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P14 · kael_pony_attack_body.png · quadros 7-13: mancha rosa/cinza semitransparente com borda picada sobre pescoço e crina · Arte (sem print ampliado ainda) — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P15 · kael_wyvern_attack_body.png · quadros 8-10: mancha rosa translúcida sobre a cabeça da serpe (além do arco de golpe) · Arte (sem print ampliado ainda) — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [ ] A VARRER: folhas kael_*_era2_t1 (com arma), pétalas 1-5 estrelas (idle_Nstar), Kael a pé nas 4 fases, pet; e CONFIRMAR NO JOGO se esses quadros aparecem (o jogo pode usar só parte dos 17 quadros).
- [x] P16 · kael_wolf_attack_era2_t1.png (folha COM ARMA) · quadros 1,3,5: a espada fica SOLTA, atrás do Kael, longe da mão; a mão segura só uma haste fina preta (guia do recorte ainda visível) e há traços pretos verticais na armadura do lobo; é o "arma que sai da mão" do dono; print reports/prints/pol_8_folhas_com_arma_lobo_e_cavalo.png · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- [x] P17 · kael_horse_attack_era2_t1.png (COM ARMA) · quadro 7: além da espada na mão aparece uma PONTA de lança branca sobrando embaixo do peito do cavalo (resto da arma da folha body); mesmo print pol_8 · Arte — FEITO (fps-75, 13/11): limpo por código no _body (tools/mount/fclean.js + p15/<m>.sh), recomposto, skip removido; antes/depois em reports/prints/pol_15_<m>_attack.png
- Conferido LIMPO nas folhas com arma (amostra por contato, 9 quadros por montaria): pônei, grifo, tigre e serpe nos quadros 0-8 (espada na mão, arcos de golpe ok); falta ver os quadros 9-16 e as folhas idle/run com arma.
- [x] P17 · Oferta · na vitrine o Kael no lobo segura uma ESPADA, mas a arma da oferta é uma CLAVA (Arma Épica 3★); o Kael tem que segurar a própria arma da oferta · Servidor (p_offer)

### Reconferência no jogo (QA, aba 2, v0.12.8 + commits a67084f/c453c7a; 13/11)
- [x] P7 (asa) · conferido no jogo: a pé e montado no lobo a asa agora sai das costas/ombros, não da cabeça (3 quadros em sequência no lobo e a pé, com pet) · OK
- [x] P6 (arma na mão, montado no lobo) · conferido: o Kael montado segura a arma (osso/clava) na mão em 3 quadros seguidos e a pé também · OK nos quadros amostrados (o ataque 1-5 do lobo, P16, ainda depende da folha)
- [ ] P8 (Vitória sem pet) · AINDA ABERTO: na Vitória com lobo + asa + arma o pet (mamute) NÃO aparece (print reports/prints/pol_9_vitoria_sem_pet_apos_correcoes.jpg); montaria, asa e arma aparecem · Engenheiro (drawHeroFull)
- [x] Serpe dourada em Montarias · conferido: página 6/6, Lendário, "Na batalha: Kael montado", sem erro
- [x] Instâncias · conferido de ponta a ponta: Entrar (Mina de Ouro) roda a horda cronometrada ("Instância 0:44 · 0" e faixa "Instância: Mina de Ouro"), com Kael montado + asa + pet; ao fim "Vitória! Mina de Ouro · 29 abates · 232 moedas · 25 XP" + "Coletar"; entradas 8→7
- [x] P18 · Instâncias (js/p_inst.js, do QA) · BUG achado e CORRIGIDO: o onOpen zerava a seleção depois do 1º desenho, então "Entrar"/"Varrer" usavam o nível 0 (Fácil) enquanto o cartão mostrava o recomendado (Difícil): prêmio entregue 232 em vez de ≈1.160. Agora o clique relê o nível pelo mesmo caminho do desenho (iCur). Smoke cobre. A reconferir no navegador depois de recarregar.
- [ ] P19 · Vitória (dbgResult) · o letreiro diz só "Chefe derrotado · Fase 1-9 liberada": o nome do chefe do c453c7a não apareceu (pode ser só o dbgResult, que não tem chefe real; conferir numa luta de verdade) · Engenheiro
- [~] P18 · Avatar (header, Perfil, ranking, guilda, chat) · continua com rosto de CRIANÇA depois de evoluir; tem que seguir a fase (garoto/adolescente/adulto/guerreiro), o herói e as camadas · Arte (8 retratos) + Engenheiro (avatarFor)

### Reconferência das folhas de ATAQUE depois da limpeza da Arte (4f74912), 17 quadros x 6 montarias, folha de contato + ampliação (QA, offline)
- [x] P10 cavalo · LIMPO (quadros 0-16; braço/capa fantasma e ponta de lança sumiram; ampliado o 6: ok)
- [x] P14 pônei · LIMPO (0-16)
- [x] P15 serpe · LIMPO (0-16)
- [ ] P11 grifo · quase: o quadro 2 melhorou (rosto visível, punho na frente, sem borrão); sobrou um mini retângulo rosa/branco ao lado do pescoço no quadro 12 · Arte (pequeno)
- [ ] P12 lobo · MELHOROU muito, mas NÃO fechou: quadros 7 e 10 ainda têm franja de listras verticais no topo da cabeça/armadura e um retângulo rosa-branco solto perto da orelha (7); quadros 1 e 3 com listras verticais fracas na ombreira; ampliações em reports/prints/pol_11_ataque_montado_pos_limpeza_restos.png · Arte
- [ ] P13 tigre de cristal · a faixa corrompida do rosto SUMIU (8 e 10 ok); restam listras verticais fracas atrás do Kael (capa/cristais) · Arte (menor)
- [ ] P16 lobo COM ARMA (era2_t1) · A conferir (as folhas com arma não foram reabertas depois da limpeza)
- [x] P16 lobo COM ARMA · CORRIGIDO: a espada agora está NA MÃO nos quadros 1, 3, 5 e 9 (sem haste preta solta); só sobram listras verticais fracas na armadura (mesmo resto do P12) · print reports/prints/pol_12_folhas_com_arma_pos_limpeza_ok.png
- [x] P17 cavalo COM ARMA · CORRIGIDO: quadro 7 sem a ponta de lança sobrando (espada + arco de golpe só); quadros 6 ok; grifo 12, tigre 9 e serpe 9 também ok
- [ ] P20 · Título (p_intro, Servidor) · o herói montado (Kael na serpe) é desenhado dentro de um canvas retangular com BORDA VISÍVEL (caixa mais clara, cantos duros) e fica CORTADO em cima (a cabeça/arma encosta no topo da caixa); com montaria o desenho precisa de mais folga ou o canvas maior; print reports/prints/pol_13_titulo_heroi_cortado_e_retangulo.png · Servidor (p_intro) + Engenheiro (escala do drawHeroFull)

## Arte (fps-75), 13/11: ícones e auditoria de skins
- [x] Ícones por código (estilo dos slots, 256 px, transparentes): assets/icons/weapons/<wKey>.png (45 armas), assets/icons/slots/era7_weapon.png e era8_weapon.png, assets/icons/mounts/<id>.png (6), assets/icons/pets/<pet>_<ref|mid|evo>.png + pet_egg.png. O engenheiro liga nas telas (slotIcon prende em era 6).
- [ ] Faltam ícones de colete/botas/luvas/colar/elmo/asa das eras 7-8 (12). Precisa de arte nova. · Arte (crédito, aguardando o PO)
- [x] Auditoria skin × fase a pé: Kael R/1/2/3 e Kaia base/1/2/3 completos (head/hair/mask nos 8 estados).
- [ ] Montado: sem head.json e sem máscara, então chapéu/óculos/colete/botas somem ao montar; dá para fazer por código (Arte) e o engenheiro liga. As folhas montadas só existem com o Kael criança (sem fases e sem Kaia): precisa de crédito ou de teste de troca de cabeça. · lista enviada ao PO
- [x] P15 parte 3 · folhas a pé, varredura quadro a quadro (fps-75): PADRÃO Kael R e Kaia limpos. Pistola (R e kaia, idle/run/shoot): sobra branca do recorte na mão tapada, poeira e faíscas soltas apagadas; levado às 4 armas (era3-6). R ataque f8: resto verde da guia apagado; poeira do ataque e da corrida limpa (era2_t0/t1/t2 também). idle/die/spin e Kaia idle/run/attack/spin/die estavam limpos, com os pés em 241-244. Prints pol_15_peh_R_pistol.png e pol_15_peh_kaia_pistol.png.
- [x] P15 skins · phase2/phase3/kaia_phase2: varridas, só o clarão/cápsula do vídeo junto ao cano (fica). kaia_phase3 pistol_shoot f3-20: fumaça/cápsula cinza SOLTA ~100 px acima da arma apagada no body e no era5_t0 (print pol_15_peh_kaia_phase3_pistol.png). Adolescente (phase1) fora, não varrido.
- [x] P19 · Kaia Cavaleira · a pistola flutua ~10 px à frente da mão (grip em kaia_phase2/kaia_pistol_*_body.json) · Arte · FEITO (fps-75, 13/11): o grip dos _body.json estava no centro da arma do vídeo (até 30-35 px à frente e 15-20 acima do punho no parado/tiro); agora grip = centro do punho (o hand já certo das folhas kaia_pistol_*_era5_t0, igual ao Kael R e à menina). Mesmo defeito achado e corrigido na kaia_phase3 (Guerreira: 10 px no parado, 34 no tiro). As folhas com arma (era5_t0) já estavam com a pistola no punho, não precisaram de gunskin. Conferido quadro a quadro em zoom (parado/correndo/tiro, as 2 fases). Backup em kaia_phase{2,3}/_reprovado/p19_grip/
- [~] P20 · Morte com pistola (todos os heróis) · a arma passa abaixo da linha do chão no meio da queda · Arte/Engenheiro · ACHADO (fps-75): é CÓDIGO, não a folha (as folhas de morte não têm arma). js/stage.js drawHeroDie: a arma cai por código e termina girada +90° (ang = -0.3 + (PI/2+0.3)·e2) com o centro em feetY-10. Serve para a espada (desenhada em pé, angle 90 → deita), mas a pistola é desenhada deitada (angle ~0): girar 90° a põe EM PÉ e metade (~54 px da folha) fica abaixo do chão. Correção enviada ao engenheiro (fps-c8): ângulo final = meta.angle da arma e altura final pela meia-altura girada. Fases 1-3 (drawHeroPhaseDie) não desenham arma.
- [~] P21 · Subir de nível a pé · o texto "NÍVEL +1" cai atrás da barra de vida · Engenheiro/Arte · Arte FEITO (fps-75): o texto da folha fica ~306 px acima dos pés (topo do quadro), na altura da barra, e drawLevelUp roda antes das barras. Duas variantes novas (levelup_fx intacto): assets/anim/fx/levelup_fx_notext (só efeito, o jogo escreve o "NÍVEL +1" depois das barras) e levelup_fx_low (texto a 150 px dos pés, no peito/cabeça, abaixo da barra); mesmo formato 22×448×384, pés (224,352). Falta o engenheiro trocar LVUP ou a ordem de desenho.
- [ ] P22 · Kaia montada · não existe arte montada da menina: hoje ela aparece a pé e a montaria some · Arte (Kaia menina montada nas 6 montarias)

### PASSADA FINAL antes do APK (QA, aba 2, 13/11; Modo dono, FC ×31)
- [x] Herói SEM fases: Título, batalha, cabeçalho, Perfil, Troca de era com o GAROTO (save nível 60/20), com montaria, asa e pet; FC consistente no cabeçalho, Perfil, Torre ("Você") e Mapa (64,5 mil igual).
- [x] Vitrine a PÉ: padrão (garoto), Kael Cavaleiro (armadura) e Guerreiro Lendário (armadura ornada) desenhados cada um com a SUA skin; Equipar/EQUIPADA/Mítico/Lendário/bônus ok; atalhos do Modo dono "Skin:" e "Herói:" mudam a FC e o equipado (324→344→353→326).
- [ ] P21 · Vitrine MONTADA · com montaria equipada (mountArt:false) os 3 cartões mostram o MESMO garoto na montaria; a skin (armadura) não aparece montada e a equipada (Cavaleiro) fica igual à padrão; print pol_16 (montado) × pol_17 (a pé) · confirmar a decisão (se for assim, a vitrine deveria desenhar a pé) · Engenheiro/PO
- [ ] P22 · Título · o logo "EONBOUND" aparece cortado/coberto pelo anel do relógio em quadros da animação (letras "ND" escondidas ou o "D" deslocado fora do anel); print pol_18 · Servidor (p_intro)
- [ ] P23 · Modo dono > Teste · sobraram os botões da era das fases: "Garoto (atual)", "Fase 1: adolescente", "Fase 2: adulto", "Fase 3: guerreiro", "Evolução de fase", "Kaia adolescente/adulta/guerreira" · Engenheiro (tirar)
- [ ] P24 · Skin padrão depois de equipar e voltar: FC 324 → 326 (+2) · conferir se é arredondamento ou perda (FC sem perda) · Sistemas
- Kaia: a pé com asa/pet/pistola ok na batalha; montada aparece A PÉ (aceito pelo PO neste APK). Ultimate "Fúria do Mamute!" ok.
- NÃO conferido nesta passada: efeito "NÍVEL +1" ao subir de nível (o botão de teste só mostrou "Chat liberado"), Passe nível 25 com o pacote novo, Loja/Vitória/Instâncias/6 montarias/slots de novo, FC dentro do Equipamento e da Derrota.

### PASSADA CURTA (QA, 13/11, aba 2) — resultado
- [x] P21 vitrine com montaria equipada: CORRIGIDO (cartão a pé, sem pet: state {skin, mount:false, pet:false}); com lobo equipado o cartão mostra o herói a pé com asa e arma, sem montaria nem pet.
- [x] P8 Vitória sem pet: CORRIGIDO. Com lobo + asa + arma o pet (mamute) aparece junto do baú (print pol_20_vitoria_com_pet_montaria_asa_ok.jpg).
- [x] Subir de nível de verdade (Sys.level.addXp + onLevelUp): aparecem "NÍVEL +1", a pílula "Nível 61!" e o aviso de poder "+3 mil ▲ FC 186 mil". DEFEITO P25: o texto "NÍVEL +1" nasce no lado ESQUERDO e fica parcialmente atrás da coluna de botões (Equip./Invocar/Loja/Passe): lê-se "ÍVEL +1" (print pol_19_nivel_mais_1_atras_dos_botoes.jpg) · Engenheiro
- [x] Passe nível 25 (premium, de ponta a ponta): a célula mostra a Arma Épica (Lança de Sílex) + 30 de forja + 5 de essência + 10 (fragmentos de montaria); o resgate entregou +1 item (equipou), forja 17→47 (+30) e Essência +5. DEFEITO P26: os 10 fragmentos de montaria NÃO apareceram em nenhuma montaria (lobo 10→10, grifo 10→10, serpe 0→0, "stored" vazio): conferir para onde vão · Sistemas. Free 25 = 10 diamantes ok.
- [x] FC na escala: Equipamento "FORÇA DE COMBATE 192 mil" = cabeçalho 192 mil; Derrota "SUA FC 192 mil / RECOMENDADA 42,5 mil" mesma escala; comparação de item "FC 192 mil → 192 mil −93" ok; "FC agora 5 mil / no seu nível 6,6 mil" são FC do item (escala igual).
- [x] Loja: sem roupa-skin à venda, "Nova skin em breve" na possuída; sem imagem quebrada nem emoji.
- [x] Prévia da arte sem fases: "Kael (padrão)", "Skin: Kael Cavaleiro/Guerreiro Lendário", "Kaia (padrão)", "Skin: Kaia ..." (ainda lista as skins adultas: some quando Sistemas e o engenheiro as retirarem).
- [x] Criação: Kael e Kaia jogáveis (Kaia com espada, sem silhueta); nome com o retrato da Kaia; ao entrar NÃO vem mais o modal antigo de boas-vindas, vai direto ao tutorial; FC inicial "8,1 mil".
- [ ] P22 (logo do Título coberto pelo anel) AINDA aparece em quadros da animação (letras finais "UND"/"D" cobertas), mesmo depois da correção de z-index: Servidor.

## FUSÃO (conferência no navegador, aba 2, 127.0.0.2:8080, chaves só em memória, 13/11)
OK: Forja → Fusão (entrada aparece só com a chave); aba Fundir lista grupos sem os de 5 estrelas; arma de família diferente (arco com clava) = "Itens diferentes", botão desligado (pol_22); prévia 2★→3★, qualidade, nível do maior, custo e FC (pol_23); fundir com o equipado entre os 3: resultado fica equipado, 3 itens saem da mochila (pol_24); ouro cobrado; aba Adormecidos: progresso até a era, "Acordou!" aparece uma vez ao voltar (pol_25), sem botão de acordar pago; com a qualidade desligada: "A qualidade e a fusão abrem em breve" só com as abas, sem botão; 288 px sem estouro lateral; zero emoji; nenhum botão sem ação.
Defeitos (de tela, Sistemas): F1 as 3 vagas da fusão ficam cortadas (só a borda de cima aparece) com a altura útil de 543 px, no grupo aberto (pol_26): o jogador não vê o que está nas vagas; F2 a prévia mostra só a VARIAÇÃO de FC ("+1,1 mil" / "−3,8 mil" em vermelho se não equipar), não o antes → depois pedido; F3 nome do item acordado truncado ("Armadura de P…") ao lado do selo; F4 o resultado da fusão reaproveita o id do item equipado (o comentário do módulo diz id novo): conferir se algo guarda o id antigo.
Não conferido: 390 px (a janela do teste não muda a largura do jogo, ficou em 288).
- [ ] P27 · Abertura do jogo · carrega tudo estranho (imagens aparecendo tarde, quebradas); a tela de carregamento tem que esperar TODAS as imagens da primeira cena (herói, montaria, pet, asa, cenário, inimigos, arma, ícones) antes de mostrar o jogo; o mesmo na troca de era e ao equipar · Engenheiro (prioridade 1) + Sistemas (lista)

## VARREDURA QUADRO A QUADRO (aba 2, pasta de trabalho depois de 06348bb, 13/11)
Método: folha de contato com window.drawHeroFull (8 quadros por linha) com o estado real do save (herói, montaria, arma). Prints: pol_27 a pol_29.
OK: Kael a pé andando e parado, com asa e sem, 8 quadros sem pulo nem corte; Kael montado no lobo, 8 quadros com aura azul, sem quadro vazio; Kaia a pé com asa, 8 quadros; Kaia montada (desenhada a pé, aceito pelo dono nesta versão); espada na mão, a pé e na montaria (aparece em parte dos quadros, o resto escondido atrás do corpo/lobo: esperado).
Defeitos/dúvidas:
P27 (baixa) a clava de pedra, a pé, é segurada na altura do queixo e cobre a parte de baixo do rosto em todos os quadros (pol_28, linha 1).
P28 (a confirmar com o Engenheiro: é trabalho em andamento) ARCO e BUMERANGUE equipados: o herói aparece com a CLAVA de pedra, a pé e na montaria (pol_28 linhas 3 e 4, pol_29): falta a arte da arma na mão. Os dois engenheiros estão mexendo nisso agora, então só registro como defeito do APK se já estava em 06348bb.
P29 a primeira vez que a Kaia é desenhada, o corpo sai VAZIO por ~1 s (a folha carrega sob demanda); no jogo isso pode virar a Kaia sumindo no primeiro quadro após trocar de herói: conferir se há pré-carga ao trocar/entrar com a Kaia.
Não feito nesta passada: "Kael menino em cada nível" (o herói não cresce mais, decisão do dono: um corpo só) e as 4 armas iniciais completas na montaria (só espada/clava; arco/bumerangue sem arte, ver P28).
