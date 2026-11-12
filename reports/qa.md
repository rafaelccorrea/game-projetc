# QA — rodada 1 (index.html de 2026-11-12 01:25, ainda V1)

## Estado
O index.html atual é o combate V1: 1 ataque automático. Ainda não existem s2/s3 (Especial/Ultimate), botões de habilidade,
js/audio.js, assets/fx, assets/icons nem assets/audio. Ou seja, o contrato V2 (docs/CONTRATO_V2.md) NÃO está integrado.
Nada de som/FX/ultimate pôde ser testado; o som atual é só beep de oscilador.

## O que foi testado (Chrome, localhost:8080, debug=1, frames congelados no pico do golpe)
- Eras 0 a 6, tiers variados (r2/r4): arma presa na mão no repouso e no golpe. Sem erro de console, nenhuma imagem falhou.
- Era 0 (clava): ok. Era 1/2 (espadas): ok. Eras 4/5 (armas de fogo): ok, ficam na mão e apontam para o inimigo.
- Era 6 T2 (arma branca no meio de eras de tiro): segura, mas fica parcialmente atrás do corpo; conferir visual.

## Achados
1. [MÉDIO] Debug `dbgSet` posiciona o inimigo em x=178 antes de saber a largura (dw), mas a parada real é ~200 (era 0, tigre).
   O inimigo fica colado no herói e cobre a arma. Só afeta o debug (em jogo normal usa stopXOf com dw). Corrigir no dbgSet.
2. [BAIXO] Era 3 (pólvora) no golpe: arma quase toda escondida pelo clarão do tiro + inimigo à frente. Conferir com o FX novo.
3. [INFO] Debug `era=3` deixa equipamento básico num inimigo de fase 31 (8,5k de vida contra ataque 13): não é bug de balanceamento,
   é artefato do debug; não usar para avaliar dano.

## Reprovado pelo dono (rodada 1, bloqueia a V2) — corrigir no index.html
A1. [CRÍTICO] Combate é 1 contra 1 (B.enemy único). Tem que ser HORDA contra 1 herói: vários inimigos na tela, em fila,
    chegando aos poucos; herói alvejando o mais próximo; s2/s3 atingindo vários. Rever HP/dano/ouro/drops para a horda.
A2. [CRÍTICO] Layout em coluna/barra lateral (#app max-width 560px, canvas 36dvh, #view com scroll). Tem que ser TELA INTEIRA
    de celular (retrato, 100dvw x 100dvh, safe-area): batalha ocupando a tela, e Equipamento/Invocar/Loja/Skins/etc.
    como painéis/abas que cabem na tela SEM scroll (grade fixa; paginar em vez de rolar). Botões de s2/s3 sobre a batalha,
    ao alcance do polegar. No desktop: mostrar moldura de celular centralizada, nunca coluna estreita com barra de rolagem.
A3. [ALTO] Herói não anda: fica parado em x=96 e só balança; o cenário só faz parallax lento. Tem que correr/avançar
    (pernas/bob, cenário rolando rápido) enquanto a horda não chega e entre ondas, parar só para atacar.
A4. [ALTO] Golpes sem efeito saindo da arma: cada ataque (s1/s2/s3) precisa de efeito visível na arma e no impacto
    (corte/arco, projétil, muzzle, faíscas, hit), tingido pela raridade; s2 maior, s3 enorme e temático da era.

## Reteste: itens extras combinados com a fps-c9
- Rig calibrado nas 21 combinações (test/rig/contato.png): conferir no jogo que o engenheiro aplicou `angle` e `layer`,
  e que a arma não sai da mão em idle, corrida, s1, s2 e s3, nas 7 eras e nos 3 tiers.
- Fila posterior (só após A1-A4 passarem): VIP/montaria/Mítica, práticas, títulos, torre, arena (ver reports/qa_proposta_vip_baus_instancias.md).

## Critério de layout: protótipos são a referência (recado do dono via fps-98)
Fonte da verdade: https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba (fps-98 avisa quando cada tela fecha).
Reprovar tela que não bata em: posições, tamanhos, cores, fontes (Lilita One nos títulos, Nunito no texto), ordem das abas,
animações e sons. Não aprovar "parecido". Caso não coberto pelo protótipo: perguntar à fps-98 antes de aprovar.
Prontas até agora: Título e Batalha. Em desenho: Carregamento, Login, Nome do jogador. Telas sem protótipo fechado não são aprovadas nem reprovadas por layout.

## DEFEITO BLOQUEADOR B2: animação de locomoção (relatado pelo dono, reforça A3)
Herói e inimigos "pulam" em vez de andar; animações estáticas. Causa: cada personagem é UMA imagem; o movimento é só transformação do
sprite inteiro (sobe/desce, inclina, estica). Sem pernas/braços se mexendo. Não se resolve com ajuste de código: precisa de arte animada.
Critério de aceite (QA reprova sem isto, para herói, inimigo comum e chefe):
- Caminhada/corrida: pernas alternando, pés no chão, corpo sem quicar inteiro; passo casa com a velocidade do chão (sem patinar).
- Idle com respiração; ataque com o braço da arma se movendo; dano e morte próprios.
- Arma continua na mão em todos os quadros (idle, andar, s1, s2, s3).
Opções de viabilidade (a decidir pelo dono/PO; nada é desenvolvido antes): (A) bonecos de recortes com ossos (cabeça, tronco, braços, pernas, cachecol);
(B) quadro a quadro gerado de vídeo curto em fundo verde; (C) híbrido.
Item fixo do reteste: "animação de locomoção" (herói, inimigo comum, chefe).

## RETESTE 1 — build congelada (v0.3), iframe 390 de largura (test/m.html), jogador novo (?fresh=1)
APROVADO
- A1 horda: 1 a 4 inimigos por onda chegando em fila, herói mira o da frente; derrota recomeça na onda 1 com vida cheia (ok).
- A2 tela cheia: HUD sobre o canvas, abas fixas embaixo, painéis paginados. Nenhum painel rola nem estoura na horizontal
  (Batalha, Equip., Invocar, Loja, Skins, Missões, Passe). Vistos: Equip., Invocar, Loja.
- Dano medido (atk 29, inimigo com vida alta): s2 = ~3x por alvo (2 alvos: 174 = 6x); s3 = ~10x por alvo (2 alvos: ~580 = 20x). Bate com o contrato.
- Ultimate da era 0 (mamute azul) enorme e bonita; botão 0% depois do uso; energia recarrega.
- Áudio: 44 de 44 arquivos do manifest existem, decodificam no navegador, dentro dos limites de tamanho; todos os sfx e músicas do contrato presentes.
  GameAudio carregado. (Ainda NÃO ouvido por humano: volume, loop e mixagem seguem sem validação.)
- Sem erro de console durante todo o teste.
REPROVADO / DEFEITOS
- R1 [ALTO] Inimigos sobrepõem o herói no corpo a corpo: tigre/caçador em cima do peito e da arma (vistos em Loja e Batalha). Já era defeito conhecido; segue aberto.
- R2 [ALTO] Ultimate cobre o herói por inteiro (mamute na frente de tudo) durante ~1 s; some o herói e os inimigos. Dono do FX deve passar a ultimate por trás do herói ou reduzir/transparecer.
- R3 [MÉDIO] Números de dano e nome do chefe se sobrepõem ("Chefe Rex Furioso" + 39/35 + barra de vida). No painel de Equip., o nome do chefe encosta no texto "fase 2/10 · onda 5/5".
- R4 [MÉDIO] Moldura de celular no desktop com altura baixa fica com menos de 390 de largura (287 px em 639 de altura): logo "Eonbound" cortado na direita, abas apertadas e rótulos se encostando. Tem que escalar a moldura inteira (transform) mantendo 390x844 lógico.
- R5 [BAIXO] Subtítulo "Atravesse as eras. Forje sua lenda." com contraste baixo sobre a arte da tela inicial.
- R6 [BALANCEAMENTO, para o PO] Jogador novo chega à Fase 4 em ~3 min e ganha ouro/diamante muito rápido (fase 2 vencida com ~45 s). Rever curva (docs/balance.json ainda não aplicado).
- B2 (animação de locomoção) segue BLOQUEADOR: nenhuma arte animada nova; não foi tocado.
NÃO TESTADO NESTA RODADA
Tutorial passos 4-5, ganhos offline, vibração, Loja Diamantes/Pacotes, modal Equipar/Vender, troca de era, s2 das eras 1/3/4/5, espadas inclinadas, velocidade x4,
Skins/Missões/Passe visualmente, tela cheia ao tocar JOGAR, protótipos oficiais (fps-98) ainda não comparados.

## COMPARAÇÃO COM OS PROTÓTIPOS (fps-98) — rodada 1: Título e Batalha. Equip., Invocar, Loja, Passe, Login, Nome, Carregamento, Ranking ainda não comparados.
Critério do dono: reprovar o que não bate à risca. RESULTADO: REPROVADAS (a build v0.3 é anterior aos protótipos).
Todas as telas: o jogo usa system-ui; os protótipos usam Lilita One (títulos) + Nunito (texto), via Google Fonts. Fontes NÃO carregadas no jogo (grep em index.html/js).
TÍTULO (Main.dc.html, 390x844):
- Falta barra superior: pílula "Tema de Eonbound" com equalizador (música ligada) / "Toque no alto-falante para ouvir" (desligada); botões de 44x44 música e menu no canto.
- Logo no protótipo: 320x200, topo 96 px, flutuando (translateY ±10, rotação ±1°, 3,6 s). Jogo: logo estático, tamanho diferente.
- Falta fundo respirando (zoom 1,02 a 1,12 em 18 s) e 10 brasas subindo.
- JOGAR: protótipo 260x68, raio 20, Lilita One 34 px, gradiente #ffe07a a #f2a826, pulso 1,6 s. Jogo: fonte Arial/system-ui preta, tamanho e pulso diferentes.
- Falta o botão "Continuar como <nome>" (jogador que volta) e o fluxo Login/Convidado -> Nome -> Intro; JOGAR hoje cai direto na Batalha.
- Rodapé: protótipo "Versão [X.Y] · Só skins são vendidas. Nada de pagar para vencer." Jogo: "Eonbound · v0.3". ATENÇÃO PO: esse texto CONTRADIZ a decisão do dono (VIP e montaria dão poder). Alinhar antes de implementar.
- Música de título só no 1º toque; sons de toque nos botões: não verificados no jogo.
BATALHA (Batalha.dc.html):
- Topo: protótipo tem 64 px, uma linha: avatar do Kael 44x44, "Kael Nv. 24" (Lilita One 16) + "FC 12.480", pílula de moedas, pílula de gemas com botão "+" verde, menu 44x44. Jogo: só moedas, gemas, "Fase N", x1 e engrenagem; sem avatar, nível, FC nem "+".
- Faixa de fase: protótipo "Medieval · 2-7" (Lilita One 20) + 5 pontinhos de onda + "CHEFE" + botão vermelho "Desafiar" (44 px) + barra "Horda 3/5". Jogo: texto pequeno "Pré-História · fase 1/10 · onda 3/5" com barra fina; sem "Desafiar".
- Borda esquerda: protótipo tem Missões (52x52, selo com contagem) e Baú de toque (52x64, barra, selo "x2"). Jogo: nada disso na batalha.
- Borda direita: protótipo tem AUTO, velocidade, música da era e esconder interface (52x44, empilhados). Jogo: AUTO fica no canto inferior esquerdo; x1 no topo; sem música nem esconder.
- Habilidades: protótipo no canto inferior direito; jogo também, mas tamanho/ordem/estilo a conferir com a especificação final.
- Animações: protótipo tem tremor de tela, flash, banner e "dedo" de tutorial na Ultimate; jogo tem tremor e ultimate; banner e dedo não conferidos.
- REGRA DO DONO (nota do canvas, para todos): nenhum personagem flutua, quica ou voa; pés sempre na linha do chão da era; até a arte de corrida chegar, todos parados no chão, só respirando. O jogo atual QUICA ao andar: viola a regra (B2).
Ranking (Ranking.dc.html) já existe como protótipo, mas arena/ranking está em avaliação de viabilidade (congelado).

## Atualização fps-98 (PO)
- Rodapé do Título agora só "Versão [X.Y]" (frase de "nada de pagar para vencer" removida).
- "Desafiar chefe" e "Baú de toque" são proposta: só entram na 1ª versão se o dono aprovar a tela de Batalha. NÃO reprovar o jogo por falta deles.
- Telas FECHADAS para comparar: 00 Carregamento, 01 Título, 02 Login, 03 Nome/Intro, 04 Batalha (versão nova, pés no chão), 05 Equipamento, 06 Invocar, 12 Ranking.
- Em produção (não comparar ainda): Loja, Passe, Configurações, Resultado do chefe, Troca de era.

## COMPARAÇÃO COM OS PROTÓTIPOS — rodada 2: Equipamento, Invocar, Loja e Passe (estrutura/navegação; medidas px não conferidas, o jogo ainda é v0.3)
Resultado: REPROVADAS (jogo anterior aos protótipos). Divergências de estrutura, que o PO precisa decidir antes de qualquer código:
- Navegação: protótipo tem 5 abas (Batalha, Equip., Invocar, Loja, Passe). Jogo tem 7 (+ Skins e Missões). No protótipo, Skins vira seção da Loja e Missões vai para a borda esquerda da Batalha.
- Loja: protótipo = "só skins" (seções Skins de herói, Skins de arma, Gemas, pacotes de skins, prévia, confirmação de compra "cobrado pela loja do aparelho (Google Play / App Store)"). Jogo tem aba Moedas com equipamento por moedas, Diamantes e Pacotes. A venda de equipamento por moedas NÃO aparece no protótipo: decidir se some ou onde fica.
- Invocar: protótipo só tem "Baú de Equipamento" (nível do baú, chances do nível, grátis 1/dia, x1, x10, abertura automática, "Revelar tudo", resultado "LENDÁRIO!"). Jogo também invoca Skin por 20💎 na mesma tela; no protótipo skin só se compra na Loja.
- Equipamento: protótipo tem painel FC, slots Arma/Armadura + Montaria e Título ("em breve"), stats Ataque/Vida/Crítico/Vel. atq., "Equipar melhor", comparar item, filtro, paginação, mochila N/máx. Jogo: abas Armas/Armaduras/Vender básicos, lista simples; sem FC, sem comparação, sem Montaria/Título.
- Passe: protótipo 30 níveis, trilhas Grátis e Premium (skins nos níveis 5,10,15,20,25,30), XP "60/100", temporada com contagem de dias, ativar Premium com confirmação. Jogo: Passe existe, mas não conferi o layout; sem contagem de temporada na tela.
- Cabeçalho comum no protótipo: avatar + "Kael Nv. N" + "FC", moedas, gemas com "+", menu. Jogo: cabeçalho diferente (ver Batalha acima).
- Dinheiro real: o protótipo da Loja/Passe usa preço "[PREÇO]" cobrado pela loja do aparelho; o jogo hoje não tem dinheiro real (depende de backend/compra no app). Marcar como pendência técnica.

## DECISÕES DO PO (fps-98), valem até o dono dizer o contrário — viram critério de teste
1) 5 abas, nesta ordem: Batalha, Equip., Invocar, Loja, Passe. Skins = sub-aba da Loja (Skins de herói / Skins de arma); skin comprada é equipada na prévia da Loja. Missões na borda esquerda da Batalha com selo de contagem. Ranking abre pela Batalha (tela 12).
2) Equipamento por moedas SAI da Loja (equipamento só da Invocar e de drops). Invocação de skin por gemas SAI da Invocar; pacotes aleatórios de skin saem da aba Gemas. Skin só por compra direta ou pelo Passe. Motivo apontado pelo PO: sorteio pago de skin proibido (ECA Digital).
   TESTE: não pode existir nenhum sorteio pago de skin em lugar nenhum (Invocar, Loja, pacotes, baú, evento).
3) Dinheiro real = pendência técnica. Testar só a interface: confirmação antes de cobrar e saldo antes/depois.
4) Montaria e Título: "Em breve" com cadeado; o toque só mostra um aviso (sem abrir nada).
RISCO a levar ao PO/dono: a mesma regra (ECA Digital) pode alcançar também o sorteio de EQUIPAMENTO pago com gemas na Invocar e o baú de toque se tiver compra; decidir com assessoria jurídica. Não afirmo conclusão legal.

## RETESTE 2: critérios de aceite do PO (fps-98, via fps-c9). Engenheiro corrigindo R1, R2 e R5; R3, R4 e R6 esperam a aprovação dos protótipos.
- R1: inimigo NUNCA entra no retângulo do herói + arma. Tela de 390: herói em x≈26-186, inimigos em ≈214 e ≈290. Medir por script (B.en[].x e largura) durante 60 s de combate, incluindo chefe.
- R2: efeito da ultimate atrás ou ao lado do herói, centrado nos inimigos, nunca cobrindo o corpo do herói. Conferir as 7 eras.
- R5: subtítulo #f6ecdf, 17 px, peso 800, com sombra.
- A tela 04 Batalha do protótipo mudou (pés no chão e mais animação): comparar sempre com a versão atual do link.

## RETESTE 2 — RESULTADO (R1, R2, R5): APROVADOS
- R1 APROVADO. Medido por script (100 amostras de 200 ms por era, debug stay=1, até 3 inimigos): sobreposição 0 nas eras 0, 3 e 4 e no chefe da era 2 (com escoltas). Folga mínima entre a borda do inimigo e o alcance do herói+arma: 5,9 px (era 0), 7,5 (era 3), 7,4 (era 4), 6,4 (chefe era 2). O engenheiro declarou 8 px: a folga real chega a ~6 px quando o inimigo avança ao atacar. Dentro do critério (nunca entra).
- R2 APROVADO. Ultimate vista nas eras 2 (Lâmina do Dragão, no chefe) e 5 (Ataque Aéreo): herói inteiro por cima do efeito; sem borda reta visível na era 5. Eras 0, 1, 3, 4, 6 não revistas nesta rodada (o engenheiro viu as 7).
- R5 APROVADO. Subtítulo: cor rgb(246,236,223) = #f6ecdf, 17 px, peso 800, sombra 0 2px 6px preta. Fonte segue system-ui (o protótipo usa Nunito; fontes continuam pendentes).
- Observação (efeito colateral combinado): a fila espera fora da tela à direita quando há mais de 2 inimigos (amostras com algum inimigo fora da tela: era 0 = 64/100, era 4 = 100/100). Coerente com 2 posições fixas do protótipo (≈214 e ≈290), mas o jogador não vê quantos faltam; considerar contador "+N" na borda direita.
- Ainda abertos: R3 (números de dano x nome do chefe: visto de novo no chefe da era 2), R4 (moldura no desktop), R6 (balanceamento), B2 (animação de locomoção). Não coberto: chefe com escoltas mortas em jogo normal; corpo a corpo nas eras 1, 2, 5, 6 e comuns da era 3 em jogo normal (só em debug).
- Telas 09 Configurações, 10 Vitória/Derrota do chefe e 11 Troca de era agora fechadas no protótipo (13 telas completas): ainda não comparadas.

## B2: PARECER SOBRE A PROVA DE CORRIDA DA ERA 2 (assets/anim/era2_{hero_t0,e0,e1}_run.png, 8 quadros, 256x256, 12 fps; test/anim/preview.html)
Medido por script (sharp, canvas alfa) e visto quadro a quadro. A prova NÃO está no jogo.
- Linha dos pés: variação de 4 px (herói), 5 px (Goblin), 2 px (Esqueleto) em 256 px, ou seja, 1 a 2%. APROVADO: pés ficam na linha do chão; a leve subida do pé de passada é natural.
- Altura e tamanho: variação de 3 a 5 px por quadro (herói 224 a 219; Goblin 205 a 208). APROVADO: sem pulsar.
- Loop: diferença entre o último e o primeiro quadro (3.782 / 3.572 / 4.114 px) é igual à média entre quadros consecutivos (3.814 / 3.824 / 5.315). APROVADO: sem tranco na emenda.
- Pernas alternando: herói e Esqueleto leem como corrida; Goblin lê, mas com ressalva abaixo.
REPROVAÇÕES / RESSALVAS (a fps-ff precisa tratar antes de multiplicar para as outras eras):
 P1 [ALTO] Goblin: cabeça e espada apontam para a ESQUERDA, mas nos quadros 0, 1 e 7 as botas apontam para a DIREITA e nos quadros 4 a 6 os pés ficam de frente. A leitura é de andar para a direita com a cabeça virada para trás; confirma a suspeita da fps-c9. O corpo precisa de uma só orientação (esquerda) em todos os quadros.
 P2 [MÉDIO] Goblin: a espada alterna entre horizontal (quadros 0 a 2 e 7) e diagonal para baixo (quadros 3 a 6); pisca como mudança de pose, não de balanço. Fixar o ângulo e balançar de forma contínua.
 P3 [MÉDIO] Goblin, quadro 7: sujeira cinza no canto inferior direito junto ao pé (artefato da geração/remoção de fundo). Limpar.
 P4 [MÉDIO] Herói: torso e cabeça giram de perfil (quadro 0, olhando para a direita) para 3/4 de frente (quadros 3 a 7). Em corrida lateral o corpo deve ficar de perfil constante; hoje parece que ele se vira para o jogador.
 P5 [MÉDIO] Resolução: quadros de 256 px contra 512 px dos sprites atuais do herói. O herói aparece com ~160 px lógicos; em tela de DPR 2,5 isso é ~400 px físicos, ampliando 1,5x: vai ficar mais macio que o sprite atual. Avaliar 384 ou 512 px por quadro.
 P6 [INFO] Escopo: só corrida, 1 herói/tier e 2 inimigos de 1 era. Para cumprir o critério falta: idle respirando, ataque com braço da arma (a arma precisa acompanhar a mão em cada quadro: rig), dano, morte, para herói, comum e chefe em 7 eras e 3 tiers, e a montaria. Definir custo/escopo com o PO antes.
 P7 [INFO] Esqueleto e Goblin parecem andar com passo curto; confirmar no jogo que o passo casa com a velocidade do chão (sem patinar).
VEREDITO: a ABORDAGEM (quadro a quadro) atende ao critério numérico de pés/loop/tamanho. A prova NÃO está aprovada ainda por P1 a P4. Reteste quando corrigido e quando entrar no jogo.

### Correção do P1 (Goblin)
Cabeça e espada do Goblin estão voltadas para a ESQUERDA (certo); a fps-c9 e a fps-ff confirmaram. Minha leitura de "botas apontando para a direita" nos quadros 0, 1 e 7 era incerta e retiro como defeito. Permanecem de pé no Goblin: pés de frente nos quadros 4 a 6 (verificável), espada alternando de ângulo (P2) e mancha cinza no quadro 7 (P3, confirmada pela fps-ff).

## B2: PARECER SOBRE A PROVA POR OSSOS (Kael era 2 t0; assets/anim/rig/era2_hero_t0_{run,idle}_bones.png; test/anim/bones/)
Mesmas medidas aplicadas aos quadros (vídeo) e aos ossos. Quadros = prova da fps-c9; ossos = prova da fps-ff.
| critério | quadros (vídeo) | ossos |
|---|---|---|
| linha dos pés (variação em 256 px) | 4 px | 1 px (run) e 0 px (idle, 24 quadros) |
| altura (variação) | 5 px | 5 px (run), 6 px (idle) |
| loop (último->primeiro vs média) | 3.782 vs 3.814 (ok) | 3.660 vs 4.285 (ok) no run; 495 vs 321 no idle (ok, movimento mínimo) |
| patinar: ponto de contato do pé mais baixo por quadro (delta x) | 61,-8,-23,-14,+28,-9,-21 (desvio 28,8: sem ordem) | -7,-8,-8,0,-8,-8,+8 (desvio 5,8: recuo constante ~8 px/quadro, troca de pé no fim) |
Confirmo a afirmação da fps-ff: o vídeo patina (contato desordenado), os ossos não. Medida rústica (o pé mais baixo alterna entre os dois pés), mas a diferença é grande.
Visual (8 quadros + ao vivo): perfil de 3/4 constante nos 8 quadros (sem o giro do P4), cachecol ondulando, braço da espada balançando, ESPADA NA MÃO por construção em todos os quadros (a mão é um osso; é o que o dono pediu: arma nunca sai da mão). Idle de 24 quadros respirando.
Ressalvas dos ossos (confirmo as 3 que a fps-ff listou e acrescento 3):
 O1 perna sem joelho: a perna no ar encurta até 24% (relato da fps-ff; não medi o encurtamento). Nos quadros 3 e 4 as pernas ficam muito próximas, a alternância é menos legível do que no vídeo.
 O2 contorno mais fino nos membros que no resto do corpo.
 O3 cabeça ~3% mais alta que o sprite parado (relato da fps-ff): pode "pular" na troca idle <-> corrida; testar a transição no jogo.
 O4 [novo] a espada fica quase vertical e sempre à frente do corpo na corrida; ao atacar o ângulo/pivô muda: ataque, dano e morte ainda não existem.
 O5 [novo] cada personagem precisa de seu próprio conjunto de peças (herói 7 eras x 3 tiers, inimigos, chefes): 1 geração com 2 variantes (4 créditos) foi o custo desta prova; custo total e retrabalho de recorte por personagem a estimar.
 O6 [novo] só run e idle: sem ataque, dano nem morte; a decisão de técnica não depende só destes números.
VEREDITO QA (só medidas): os OSSOS passam todos os critérios numéricos (pés, loop, sem patinar) e resolvem arma-na-mão por construção; os QUADROS passam pés/tamanho/loop mas patinam e deixam a arma como problema separado (precisa de âncora de mão por quadro). A escolha final é do PO/dono (custo, escala, resolução, aparência). Nenhuma das duas está no jogo ainda: reteste obrigatório com a integração real (passo casando com a velocidade do chão, transição idle/corrida/ataque).

## RETESTE DE ÁUDIO (fps-ff aplicou correções; originais em assets/audio/_orig/) e DOS OSSOS REFEITOS
ÁUDIO (mesmo método de reports/qa_audio.md; LUFS aproximado):
- APROVADOS: legendary -19,7 -> -15,1; enemy_die -18,9 -> -16,0; era4_s2 -18,6 -> -16,1; era6_s3 -19,7 -> -15,1 e 3,75 -> 3,0 s (dentro do contrato). Mediana dos sfx -13,5.
- Picos: os 15 sfx que estavam >= -0,5 dBFS agora estão <= -0,9 (hero_hurt, ult_ready, crit, defeat, etc.).
- Fim abrupto: os 5 arquivos terminam a <= -50 dB nos últimos 2 ms (era0_s3 -70, era2_s1 -64, era5_s1 -79, hero_hurt -55, ui_tap -69; era6_s3 -50). Sem clique no fim.
- Emenda do loop: era0 18,9x -> 0,3x e era1 18,4x -> 1,1x (corrigidas; a ponta passa a ~-36/-28 dB com fade de 12/20 ms, ouvir se não aparece um "respiro" no loop).
- AINDA ABAIXO: claim -27,2 -> -18,6 (subiu 8,6 dB, falta ~5 dB para a mediana; o limitador de -1 dBFS impediu os +11 dB prometidos) e ui_tap -20,2 -> -18,9 (só +1,3 dB; prometido +4). Ambos > 4 dB abaixo da mediana. Para subir mais é preciso comprimir/ceifar o pico antes do ganho.
- REGRESSÃO [MÉDIO] música era4: emenda do loop passou de 2,0x para 21,8x (fim a -20 dB, início a -61 dB; salto 0,093). Antes estava limpa. Provável efeito do ganho +3,5 dB com limitador. Ouvir e refazer a emenda. Em compensação o nível efetivo da era4 foi de -17,4 para -15,0 (as outras: -13,1 a -14,6): melhor, ainda ~1 a 2 dB abaixo.
- Sem erro de decodificação; 44 de 44 tocam.
OSSOS REFEITOS (arma era2_t1 azul): pés 242-244 (variação 2 px; idle 0), topo da cabeça varia 4 px (12-16) no run e 6 no idle, largura estável (213-234), loop ok (3.739 contra média 2.753), diferença média entre quadros caiu de 4.285 para 2.753 (movimento mais suave), pé de apoio recua constante (-8,-7,-8,0,-8,-8,+6): sem patinar.
Visual: braço da arma firme no mesmo ângulo, lâmina longe do rosto, cabeça no lugar, espada na mão em todos os 8 quadros. APROVADO para a prova. Ressalvas anteriores seguem: perna sem joelho (pernas muito juntas em parte dos quadros), contorno fino nos membros, ataque/dano/morte inexistentes, espada sempre no mesmo ângulo (não "balança" com a passada).

## RETESTE DE ÁUDIO 2 (claim, ui_tap, música era4)
- music era4: APROVADA. Emenda 21,8x -> 1,8x; nível efetivo -15,0; pico -0,9 dBFS; 30,9 s; sem silêncio no início.
- claim: APROVADO. LUFS -27,2 -> -18,6 -> -16,5 (3 dB abaixo da mediana -13,5; dentro de 4 dB); pico -0,9; fim a -80 dB.
- ui_tap: APROVADO COM RESSALVA. LUFS -20,2 -> -17,8 (4,3 dB abaixo da mediana, no limite); RMS ativo -18,2 dBFS; pico -1,5; 0,1 s: o LUFS integrado mede mal tão curto. Decisão final de ouvido (é o som mais repetido do jogo): se soar baixo, encurtar o ataque como a fps-ff propôs.

## PROCESSO NOVO (fps-98, PO; vale até o dono dizer o contrário)
Ordem: arte aprovada pelo dono item a item em https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19, depois as telas, depois o desenvolvimento, por fim o QA.
O QA só cobra arte APROVADA nessa página; o que for reprovado sai do escopo. Montaria dá poder (confirmado pelo dono). Requisito novo: aura atrás do herói conforme o fortalecimento da arma (faixas na página). O parecer quadros x ossos está nos cartões para o dono decidir.

## CASOS DE TESTE NOVOS: regra de eras, skins e armas (fps-30, aprovada como spec pelo PO; spec em reports/regra-eras-skins-armas.md). Testar quando for implementada.
1) Trocar de era NÃO troca a skin equipada nem a arma.
2) Ao entrar na era aparece "Nova skin disponível" com a skin de roupa padrão da era, SEM equipar sozinha.
3) A skin de arma padrão da era só é liberada ao conquistar a 1ª arma daquela era.
4) No MESMO nível, qualquer arma da era N+1 (até Básica) tem mais poder que qualquer arma da era N (até Lendária). Testar por script com a fórmula de poder, todas as combinações era x raridade.
5) Medir o tempo até a fase 4 e até a troca de era após o rebalanceamento (fator 12 por era, inimigos ~1,282 por fase). Referência atual (v0.3, jogador novo): fase 4 em ~3 min; fase 2 vencida em ~45 s. Registrar também o tempo de batalha por fase e se há "parede" na troca de era.

## CRITÉRIOS DE QA NOVOS (decisões do dono via PO/fps-c9; registradas em docs/CONTRATO_V2.md). Nada está no jogo ainda; desenvolvimento parado.
1) Processo: arte aprovada pelo dono -> telas -> desenvolvimento -> QA.
2) "Se for PNG, não aprovo": ultimate, arma e efeito só valem ANIMADOS. Imagem parada num desses = reprovação automática. Hoje o jogo usa PNG parado para as 7 ultimates (assets/fx/era{E}_ult.png) e para todas as armas (assets/weapons): reprovação automática até serem substituídos.
   Como verificar: para cada ultimate, arma e efeito, capturar quadros em tempos diferentes e comparar (pixels mudam além de translação/escala/rotação do sprite inteiro?).
3) Conteúdo do MVP, tudo animado: prova modular do Kael; herói modular + 35 armas; 14 ultimates + 3 montarias; 21 inimigos (comuns por ossos, chefes por vídeo).
4) Regra de eras: Lendária da era N < Básica da era N+1 (fator 12 por era). Testar por script em todas as combinações (ver casos de teste da fps-30).
5) Fortalecimento +0 a +15 no espaço do equipamento: falha NÃO derruba o nível e há garantia acumulada. Testar: taxa de sucesso por nível, falha não reduz o +N, contador de garantia sobe a cada falha e garante o sucesso no limite, custo/saldo antes e depois, persistência no save, poder cresce a cada +1, e a aura do herói muda de faixa conforme o +N da arma.
6) Montaria dá poder: FC sobe ao equipar, some ao desequipar, soma com ataque/vida/VIP no número de FC do HUD.

## REQUISITO NOVO DO DONO: PET (pedido direto ao QA, repassado ao PO)
Pet voador ou terrestre que também ATACA, soma poder (FC) e pode ser evoluído; há variedade por raridade (Básico, Raro, Épico, Mítico, Lendário etc.). Não é a montaria (montaria = o herói monta; pet = companheiro que luta ao lado).
Critérios de QA propostos (valem quando a arte for aprovada e implementada; seguem a regra "só animado"):
- Arte: pet voando e terrestre, cada um com idle, movimento (voar/andar) e ataque ANIMADOS, pés/sombra na linha do chão (terrestre) e altura estável (voador, sem quicar); PNG parado = reprovação automática.
- Combate: o pet ataca sozinho, o dano aparece com número próprio e cor distinta; não cobre o herói nem os inimigos; não entra no retângulo do herói+arma nem fica atrás do inimigo; funciona com horda de até 3 inimigos visíveis.
- Poder: FC sobe ao equipar o pet, soma com ataque/vida/montaria/VIP, some ao desequipar; dano medido do pet bate com a tabela.
- Evolução: subir nível do pet custa recurso, aumenta o poder, persiste no save; limite por raridade; custo/saldo antes e depois.
- Raridade: cor, brilho e poder por raridade seguem a mesma regra de eras/raridades; nenhum pet vendido por sorteio pago (ver decisão ECA Digital).
- Tela: lista de pets em grade sem scroll (padrão dos protótipos); pet equipado visível no Equipamento e na Batalha.
DECISÕES DO PO (fps-98, registradas no CONTRATO_V2) — critérios de teste finais para o PET:
- 5 pets na 1ª versão, um por raridade: Básico lobo, Raro coruja, Épico dragãozinho, Mítico golem de cristal, Lendário fênix. 1 equipado por vez (equipar um segundo desequipa o primeiro).
- Obtenção: ovos de chefes, instâncias e torre; o Lendário também por evento. NÃO pode haver ovo pago nem venda por gemas (anti-sorteio pago). TESTE: nenhuma tela vende pet ou ovo.
- Evolução: nível 1 a 50 por "ração" (teste do limite 50, custo, saldo antes/depois) e ESTRELAS por fragmentos (teste da taxa/custo e persistência).
- Fora do fator 12 por era; a contribuição do pet fica limitada a ~20% da FC total. TESTE: calcular FC com e sem pet em vários níveis e provar que o pet nunca passa de ~20% (inclusive com pet Lendário nível 50 e estrelas máximas).
- Arte sempre animada: parado, andar ou voar, atacar; o voador bate asas e tem sombra no chão. PNG parado = reprovação automática.
Perguntas ao PO (antigas, já respondidas acima, exceto o que sobrar): quantos pets na 1ª versão e quais raridades; quantos pets equipados ao mesmo tempo; como se obtém (drop, evento, compra direta); evoluem por quê (pedras de prática?); pet entra no limite de FC/rebalanceamento; ele conta no "fator 12 por era".

## LIVRO DE APROVAÇÕES DO DONO (lido do banco da página https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19, 94 decisões, 2026-11-12) — a ÚNICA arte que o QA cobra
APROVADO: Kael corrida (hyb run era2 t0/t1/t2 e sem arma), parado (hyb idle t0/t1/t2) e, da versão mão direita "hybR": corrida, parado e golpe nos 3 tiers; aura +13 (parado, correndo, golpeando); cenário vivo era 0 v2 e era 2 v2; as 8 músicas; 23 sons originais; os 13 sons refeitos (pasta _new); animação por QUADROS do Kael, Goblin e Esqueleto (técnica escolhida).
REPROVADO (sai): técnica por OSSOS do Kael (corrida e parado: "personagem desconfigurado", "espada não encaixa na mão"); Kael modular a/b/c inteiro (passo de lado "tipo siri", pernas duras no golpe, arma no braço errado); golpe híbrido da mão esquerda (hyb attack); 13 sons antigos (claim, defeat, hero_hurt, hit, ult_ready, upgrade, era0_s1, era0_s2, era0_s3, era1_s3, era4_s2, era4_s3, era6_s3).
NOTA: eu havia avaliado os OSSOS como melhores por medida; o dono decidiu pelos QUADROS e a decisão dele vale. Defeito que sobra em arte aprovada: Goblin quadro 7 com mancha cinza e espada que muda de ângulo (P2/P3 acima); o dono aprovou assim, ver com a fps-ff se foi corrigido.
PENDENTE de aprovação na página: cenários das eras 1, 3 a 6; heróis/armas/inimigos/ultimates/ícones/efeitos (escondidos até virarem animados); auras +4, +7, +10; montarias; pets.
ÁUDIO — ACHADO CRÍTICO (conferido por md5): os 13 sons aprovados em audio/_new/ NÃO são os que o jogo carrega; assets/audio/sfx/ ainda tem os 13 antigos REPROVADOS (hit, upgrade, era0_s1, era0_s2 e era1_s3 são idênticos aos originais). A fps-c9 disse que "os 13 reprovados devem ficar mudos": ERRADO. Os 13 têm substituto aprovado em _new e devem ser SUBSTITUÍDOS por ele (mudar o arquivo ou o manifest.json), senão o jogo perde esses 13 sons. Contagem certa: 23 originais aprovados + 13 novos = 36 sfx (não 21).
Medição dos 13 de _new (LUFS aprox.; mediana do jogo -13,5): claim -13,7; defeat -13,3; hero_hurt -12,7; hit -13,5; ult_ready -14,4; upgrade -13,9; era0_s1 -14,0; era0_s2 -11,7; era0_s3 -10,0 (+3,5 dB); era1_s3 -14,3; era4_s2 -18,5 (-5 dB); era4_s3 -16,0 (-2,5 dB); era6_s3 -10,8 (+2,7 dB). Picos todos <= -1,2 dBFS; fins sem clique (<= -56 dB); durações dentro do contrato (era0_s3 2,8 s; era6_s3 2,9 s; defeat 2,6 s). Ressalva: era4_s2 mais baixo que os outros, mas aprovado pelo dono.
Aprovações valem para o arquivo como estava: qualquer mudança depois exige nova aprovação (as correções da fps-ff nos sons aprovados são de antes das aprovações: arquivos de 02:13-02:16, aprovações às 03:15-03:18 locais).

## TESTE DO MÓDULO js/sys/loot.js (fps-30; ainda NÃO ligado ao jogo) — teste da fps-30: 18 de 18 ok. Meu teste independente (Monte Carlo, scratchpad qa_loot_mc.js; host falso com semente)
APROVADO (lógica):
- Horda, 400.000 abates: item 3,52% (3,5), gema 1,49% (1,5), pedra de forja 0,70% (0,7), ração 0,41% (0,4), ovo 0 (0). Era do item com eraMax=2: 30% da era anterior (29,7%).
- Chefe de fase, 40.000: item sempre Raro+ (0 sem item, 0 abaixo de Raro); 1º chefe dá ovo Básico; maior intervalo sem ovo = 9 (garantia no 10º); nenhum ovo Lendário.
- Senhor da Era, 1ª vitória por era: ovo garantido com raridade mínima certa (era 0 Básico, 1 Raro, 2 Raro, 3 Épico, 4 Épico, 5 e 6 Mítico) e item Épico+; repetições dão ovo em 23,8% (25 esperado, dentro do ruído).
- Lançamento: ARMA Mítica nunca sai em 200.000 sorteios, mesmo com minR=3 e sorte máxima; maior raridade de arma = Lendária; armadura Mítica existe.
RESOLVIDO (fps-30): 15,4 a 15,5% é a taxa pretendida, CONFORME A SPEC aprovada ("10% + garantia no 10º = 1 ovo a cada ~6,5 chefes, ~10 ovos nos 63 chefes da campanha"; balanceamento v5.1 fechado com isso). O 10% é a chance base. Registrado como conforme a spec.
(Observação original) "ovo do chefe 10%" na prática dá 15,5% por chefe, porque a garantia no 10º soma ao 10% (esperado pela conta: 1-0,9^10 sobre 0,1). Confirmar que 15,5% é a taxa pretendida.
AINDA A TESTAR QUANDO LIGADO AO JOGO: pickups voando até o HUD e o toque que acelera; rótulo "+N" agrupado (1 por tipo); entrega real ao ouro/gemas/mochila; contador da missão de 15 pedras virando à meia-noite no relógio real; ganho offline (teto 8 h); nenhuma arma Mítica no drop real; ícones de pedra/ração/ovo (arte pendente da fps-ff).

## TESTE DO MÓDULO js/sys/chest.js (fps-30; ainda NÃO ligado) — teste da fps-30: 11 de 11 ok. Meu teste independente (scratchpad qa_chest_mc.js): APROVADO na lógica
- Pontos por abate: 249 comuns = 0 baús (carga 249), 250 = 1 baú; chefe vale 5 (50 chefes = 1 baú); Senhor da Era vale 10 (25 = 1 baú).
- Estoque: 100 mil abates no mesmo dia: no máximo 3 guardados, barra para em 250 (100%), sem acumular além.
- Teto diário: enchendo e abrindo no mesmo dia, abre exatamente 8 baús; depois "capped". Meia-noite: ganhos do dia voltam a 0 e no dia seguinte abre 8 de novo; a virada acontece em 20 s entre 23:59:50 e 00:00:10 (relógio simulado).
- Abrir, 30.000 baús: itens 3, 4 ou 5 (9.980/10.120/9.900, nenhum fora disso); ouro 60 a 120 (= 15 a 30 × unidade 4); gema 24,8% (25) de 2 a 5; forja 60,5% (60) de 1 a 3 (distribuição uniforme); ração 10,0% de 1; pedra de prática 50,1% de 1 a 2; ARMA Mítica 0.
- Raridade do baú melhor que a do drop comum: Raro+ 42% contra 33% no drop; a forja do baú entra na contagem da missão do dia (71 entregues = 71 contadas).
A TESTAR LIGADO AO JOGO: botão do baú com a barra, estado cinza e texto "volte amanhã" no teto; baú pulsando/abrindo (animação da fps-ff ainda pendente; regra "nada estático"); posição no lado ESQUERDO e área de toque >= 44 px; ganho offline alimentando o baú; baú não enche na instância; ícone assets/ui/chest.png.

## TESTE DO MÓDULO js/sys/instances.js (fps-30; ainda NÃO ligado) — teste da fps-30: 15 de 15 ok. Meu teste independente (scratchpad qa_inst_mc.js): APROVADO na lógica, com 2 observações de balanceamento para o PO
- Chaves: começa com 3; 3 vitórias gastam 3; a 4ª entrada recusa ("chave"); no dia seguinte volta a 3 e NÃO acumula (outro dia sem usar = 3).
- Derrota não gasta chave; abandono (abort) não gasta; entrada parada por 16 min expira e o finish tardio recusa ("sem_entrada"), sem gastar; nível não liberado ("nivel") e tipo inválido ("tipo") recusados.
- Arsenal (4.000 por dificuldade): pedra de forja 3/5/8 (Fácil/Normal/Difícil); item mínimo Raro/Raro/Épico; arma Mítica 0; a forja entra na contagem da missão do dia (3, depois 8).
- Chefe de Era (30.000): ração 5/7/10; ovo 14,9% / 24,2% / 39,7% (15/25/40); ovo Lendário só no Difícil (52 de 3.973 = 1,3%, tabela 1%); Fácil e Normal sem Lendário; gemas 5/8/13; armadura no Difícil sempre Mítica+ (mínimo r3 conferido); ARMA Mítica 0 (a Mítica vira Épica ou Lendária).
- Caverna de Cristal: 6 gemas na era 0 e 12 na era 3 (6 + 2 por era). Mina de Ouro: 0 abates = derrota sem gastar chave; 25 abates dá a fórmula da spec (4 × ouro do abate × abates × dificuldade).
- Varrer: recusa nível não vencido e sem chave; aceita nível já vencido (gasta 1 chave).
OBSERVAÇÕES PARA O PO (não são defeitos; resultam da spec aprovada):
 (a) Ovos: 3 chaves/dia no Chefe de Era Difícil = ~1,2 ovo/dia, ~36 ovos em 30 dias, contra ~10 ovos na campanha inteira (63 chefes). As instâncias passam a ser a fonte principal de ovos.
 (b) Arma Lendária: no Chefe de Era Difícil 30% das armas saem Lendárias (a "sorte de +1" sobre a Mítica convertida) = ~15% por entrada = ~0,45 arma Lendária por dia com as 3 chaves, contra 0,4% de chance no drop comum. Confirmar se essa frequência é a pretendida (com a regra de eras, Lendária da era N < Básica da era N+1, o efeito fica contido na era).
DECISÃO DO PO (fps-98): as frequências de (a) e (b) NÃO eram as pretendidas. Pediu à fps-30: ovo no Chefe de Era Difícil ~0,4/dia (era ~1,2); arma Lendária no Difícil de 30% para 8% (~1 por semana); Normal e Fácil proporcionais. RETESTE OBRIGATÓRIO quando a fps-30 avisar: repetir qa_inst_mc.js e conferir: ovo/dia no Difícil com 3 chaves ≈ 0,4; Lendária ≈ 1 por semana (8% das armas do Difícil); Fácil e Normal menores e proporcionais; tabela 34/35/18/12/1 e demais regras sem regressão.
RETESTE DAS INSTÂNCIAS APÓS O AJUSTE DA fps-30 (17 de 17 testes dela ok; Monte Carlo próprio qa_inst_mc.js e qa_inst_mc2.js, 20.000 dias por dificuldade):
- Regra do limite FUNCIONA: máximo 1 ovo de instância por dia (máx observado = 1), S.sys.instances.eggs zera à meia-noite, e varrer obedece o mesmo limite.
- Ovos por dia com 3 vitórias no Chefe de Era: Fácil 0,388; Normal 0,579; Difícil 0,783. Meta do PO: Difícil ~0,4. NÃO ATINGIDA: 0,78 é cerca do dobro (a fps-30 já avisou que é o pior caso). Ovos na campanha: ~10 no jogo todo.
- Arma Lendária no Chefe de Era Difícil: 10,4% das armas (era 30%). Meta do PO: 8%. Ficou ~30% acima da meta. Fácil e Normal: 1,0% e 1,1% (sorte natural da tabela de raridade; o texto "nunca vira Lendária" só vale para a sorte de +1, a arma Lendária natural existe a ~1%).
- Sem regressão: arma Mítica 0; armadura Mítica+ no Difícil 100% e 32% nos outros; forja 3/5/8; ração 5/7/10; chaves, derrota e varrer como antes.
DECIDIDO PELO PO (fps-98): as metas 0,4/dia e 8% foram DESCARTADAS. Regra final = a da fps-30: teto de 1 ovo de instância por dia e sorte de +1 no Difícil em 10%. ACEITOS os números medidos (Difícil 0,78 ovo/dia; 10,4% Lendária). INSTÂNCIAS APROVADAS NA LÓGICA. Critério de aceite final do balanceamento de pets: a simulação do jogador "otimizador" da fps-c9; se ela quebrar a meta (golem ~3★ / fênix ~2★ no grátis), a chance base do ovo é reduzida e eu refaço o teste.
INTEGRAÇÃO: loot e baú liberados para o engenheiro; instâncias só depois da tela aprovada.
A TESTAR LIGADO AO JOGO: modo instância na batalha (cronômetro, vitória, sair e voltar), sem loot normal nem baú, tela 2×2 sem rolagem com alvos de toque >= 44 px e contagem regressiva das chaves, janela de resultado, varrer na UI, offline e save.

## TESTE DOS MÓDULOS DA fps-e2: forja, pet, torre, FC (js/sys; ainda NÃO ligados ao jogo) — teste da fps-e2: 9 de 9 ok. Meu teste independente (qa_e2_mc.js): APROVADO na lógica
FORJA (20.000 subidas +0 a +15, pedras infinitas):
- Chance da 1ª tentativa bate com a tabela em todos os níveis (100/100/100/90/80/70/60/50/40/30/25/20/15/10/5%); tentativas médias por nível batem com a spec (1,0 a 5,3).
- Pedras até +15: média 512 (spec ~512); pior caso observado 1.026 (teoria 2.302). A falha NUNCA rebaixou o nível (0 em 20.000 subidas) e nunca passou do "garantido em até N".
- Teto por era: +6, +6, +9, +9, +12, +12, +15 nas eras 0 a 6 (recusa "cap"). Sem pedras ou com pedras insuficientes recusa ("stones"); espaço inválido recusa ("slot").
- Aura: +0 a +3 nenhuma, +4 a +6 azul, +7 a +9 roxa, +10 a +12 chamas, +13 a +15 dourada; só a arma tem aura (armadura +15 não tem).
PET:
- Teto de 20% da FC total: máximo medido 20,00% em 315 combinações (5 pets x 7 proporções ATK/HP x níveis 1/25/50 x 1/3/5 estrelas), inclusive com ATK muito alto (dragãozinho nv50 5 estrelas). Parte da FC no máximo (ATK:HP 1:5): lobo 9,3%, coruja 6,4%, dragão 15,3%, golem 17,1%, fênix 20,0%.
- Nascer com 12 fragmentos guardados: fênix com 2 estrelas e 2 fragmentos sobrando. Golem repetido: +10 de golem; depois que a fênix nasce (política auto): +5 de fênix; golem 5 estrelas repetido: vai para a fênix. Lobo 5 estrelas repetido: vira ovo da raridade acima (coruja). Equipa sozinho o mais forte (lobo -> coruja não troca -> dragão equipa).
- Fênix 5 estrelas repetida: 10 fragmentos de golem (decisão do PO; a documentação da fps-e2 foi atualizada, a leitura inicial de "20 de ração" estava velha).
- Nível do pet com ração infinita: 50 na era 6 e 8 na era 0 (teto por era).
TORRE: andares de chefe 15, 30, ..., 105 (14 e 16 não); andar 100 dá ovo de fênix (Lendário); 1 fragmento de fênix por andar de 101 a 110 (e 0 em 99, 100, 111, 112); ovo a cada 10 andares até o 90.
AINDA A TESTAR (precisa dos números reais do jogo integrado ou da tela): andar 15 "Equilibrado" para quem fecha a era 0 (FC real do herói); fênix "nasce no andar 100" pela luta de verdade (fight); títulos (Arsenal conta a arma vendida; skin/cabelo/olho/chapéu como "Cosmético"); práticas; painel de FC "Como ficar mais forte" e os painéis em 390x844 sem scroll com alvos >= 44 px; pet atacando a cada 2 s na batalha sem dar energia de Ultimate e sem ser alvo; aura desenhada atrás do herói (fps-ff); arena (ainda não existe, só a spec).

## RETESTE DAS INSTÂNCIAS v5.2 (fps-30): cadeado por fase e ovo de instância repetido — teste dela: 18 de 18 ok; meu teste (qa_inst2.js): APROVADO
- Cadeado por fase (aprovado pelo PO): em cada era o Fácil abre na fase 3, o Normal na 6 e o Difícil na 9 (fase 3/6/9, 13/16/19, ...). 840 combinações de fase alcançada (1 a 70) x nível testadas: 0 divergências. Bloqueado devolve reason "bloqueado" com unlockAt; exemplo fase 5: Normal "bloqueado" (unlockAt 6) e Difícil "bloqueado".
- Varrer respeita o cadeado: save que "venceu" o Difícil, mas na fase 5, é recusado; na fase 9 passa.
- Sem regressão: 3 vitórias gastam as 3 chaves e a 4ª recusa ("chave"); derrota não gasta; máximo 1 ovo por dia; 0,782 ovo/dia no Difícil em 20 mil dias (0,78 aceito pelo PO).
- Ovo de instância repetido com pet em 5 estrelas vira ração e NÃO sobe de raridade: lobo +5, coruja +8, dragão +12 de ração (sem ovo encadeado). O ovo comum (sem source) segue subindo de raridade como antes (lobo -> coruja, coruja -> dragão, dragão -> golem).
- RESOLVIDO (fps-30, confirmado pela fps-e2): golem 5 estrelas + ovo repetido vai para fragmentos de FÊNIX, com ou sem instância. É CONFORME A v5.2: o golem tem regra própria (+5 de fênix; é a fonte de fênix do grátis) e a simulação v5.2 que fechou "otimizador 3,0/3,3 e normal 3,0/1,9" já conta com isso.
- Falta a tela do cadeado ("🔒 Libera na fase X") e o jogo ligado (instâncias só depois da tela aprovada, pelo PO).

## REPROVAÇÃO AUTOMÁTICA NO JOGO (decisão do PO via fps-c9; também em docs/CONTRATO_V2.md, seção "Critérios de reprovação automática do QA")
R-A1 inimigo visível no slot SEM atacar por mais de 2 s, inclusive nos slots 2 e 3.
R-A2 inimigo pulando ou quicando; pés fora da linha do chão.
R-A3 mais de 3 inimigos visíveis (o resto espera fora da tela com o selo "+N").
R-A4 efeito de habilidade ou ultimate como PNG parado. Provisório aprovado: efeito por partículas em código, até as folhas animadas da fps-ff. Hoje o jogo v0.3 usa PNG parado (assets/fx/era{E}_ult.png) nas 7 ultimates: reprovado até trocar.
Como medir (script no jogo integrado): amostrar B.en a cada 100 ms por 60 s, por era e com chefe; para cada inimigo com x dentro da tela: tempo contínuo sem ataque (campo de ataque/atkT) <= 2 s; variação do pé (y do chão) por quadro = 0 além da animação de pernas; contagem de visíveis <= 3 e selo "+N" quando houver mais; quadros de efeito comparados pixel a pixel em instantes diferentes (partículas mudam, PNG não).
Observação do reteste 2 (v0.3): com 3 ou mais inimigos o 3º já esperava fora da tela, conforme R-A3; falta o selo "+N" na tela.

## RODADA OBRIGATÓRIA 1 (roteiro do dono via PO): JOGANDO nas 7 eras, iframe 390x844, build de 10:34 (battle.js/index.html)
Método: cada era carregada com ?debug=1&era=E&stay=1 (herói imortal para medir), 18 a 22 s de amostragem a cada 100 ms; por inimigo visível: maior tempo sem atacar, golpes, altura do pé (eY); máximo de inimigos visíveis; print/zoom de quadro congelado. Chefes: eras 0 e 5 com ?boss=1.
1) ORIENTAÇÃO — herói olha para a direita em todas as eras (visto 0, 1, 2, 3, 5). Inimigos para a esquerda: era 0 Rex (chefe) JÁ espelhado, era 3 Pirata/Casaca Vermelha para a esquerda, era 5 Mercenário para a esquerda; drone da era 5 de frente (aceito pelo PO). Eras 1, 2, 4, 6 conferidas em quadro normal, sem inimigo de costas. APROVADO nas eras vistas (era 4 e 6: só pelos quadros de jogo; sem zoom dedicado).
2) PÉS NA LINHA DO CHÃO — altura do pé constante por inimigo em TODAS as eras (variação 0,0 px em 18 s): ninguém pula, quica ou flutua. Slot 0 e 1 em y=418,1 e slot 2 em y=422,0 (escala 0,9); era 5: drone em 431,2 e 433,8 (13 px abaixo dos outros: sombra e pé parecem corretos no quadro). APROVADO.
3) ANDAR — NÃO medido nesta rodada (inimigos entram deslizando até o slot, sem folha de pernas): anotado para a fps-ff, sem folhas de inimigos ainda.
4) ATAQUE — build atual: os 3 slots atacam em TODAS as 7 eras; maior tempo sem atacar = 1,4 s, 10 a 15 golpes por inimigo em ~18 s. APROVADO (limite do PO: 2 s). ATENÇÃO: minha 1ª medição da era 0 pegou código antigo em cache (slot 3 com 0 golpes em 19 s, slots 0 e 1 com 5 a 6 s sem atacar); o engenheiro corrigiu às 10:34 (js/battle.js:339, todos os slots do MAXVIS atacam). O defeito que o dono viu era real naquela versão.
5) SKILLS E ULTIMATES — rede: nenhum PNG de assets/fx é carregado (só meta.json); ultimates e golpes por partículas em código (provisório aprovado pelo PO). Vistas em quadro: era 2 (Lâmina do Dragão) e era 5 (Ataque Aéreo). As 7 ultimates por partículas ainda precisam de conferência visual uma a uma (ver pendências).
6) MÁXIMO DE 3 INIMIGOS — máx. visíveis = 3 em todas as eras. O selo "+N" para a fila fora da tela: NÃO verificado.
7) ARMA NA MÃO DIREITA — corrida, parado e golpe do Kael vêm das folhas aprovadas hybR (assets/anim/hyb/R/kael_{run,idle,attack}_body); arma na mão visível nos quadros (clava de osso era 0, espada eras 1 e 2, pistola era 3, fuzil era 5).
8) SOM EM CADA ATAQUE — NÃO verificado nesta rodada (precisa de checagem de reprodução real).
9) SEM ROLAGEM, NADA CORTADO — painéis sem rolagem ok (rodada anterior). REPROVADO: CHEFE CORTADO NA BORDA DIREITA.
DEFEITOS DESTA RODADA (enviar ao engenheiro via fps-c9):
 D1 [ALTO] Chefe no 3º slot fica na borda da tela: B.en do chefe tem x=330 a 335 com LW=330 (centro do sprite na borda): na era 5 o Tanque-Robô aparece só pela metade, a maior parte fora da tela. Causa provável: espaçamento do slot 3 (214/290/350) empurrado por layoutHorde (prev.dw+e.dw)/2 e travado em LW. O chefe precisa ficar inteiro na tela (e.g., entrar no slot 0/1 ou escalar para caber).
 D2 [MÉDIO] Era 0, onda do chefe: o rótulo/barra "Chefe Rex Furioso" aparece na borda direita, ~80 px à direita do T-Rex que está no slot da frente; B.en diz x=331 para o chefe, mas o sprite é desenhado perto de x=192. Conferir a relação entre x lógico e posição desenhada do chefe (ordem de desenho ou posição do rótulo).
 D3 [MÉDIO] Cache de scripts: a minha primeira rodada rodou código velho da mesma URL. Para jogador e QA, versionar os scripts (?v=hash) a cada mudança, senão o jogo antigo continua no aparelho.
NÃO COBERTO NESTA RODADA (próxima): andar de inimigos e herói (pés e passo), selo "+N", som em cada ataque (s1/s2/s3 e ultimate nas 7 eras), as 7 ultimates uma a uma, chefes das outras eras, troca de era, derrota com horda.

## RETESTE DO LOOT: portões de raridade, ovo de marco e XP (fps-30; loot.test.js 23 ok) — meus testes qa_gates.js, qa_levelup.js, qa_xp.js: APROVADO
- Portão maxAllowedR: 840 combinações (nível 1-120 x era 0-6), 0 divergências (Básico sempre, Raro nível 10+, Épico 25+, Mítico 70+ e era 4+, Lendário 85+ e era 5+; sem host.level só vale a era). Fronteiras conferidas (nv9->Básico, nv10->Raro, nv24->Raro, nv25->Épico, nv70/era3->Épico, nv70/era4->Mítico, nv84/era5->Mítico, nv85/era4->Mítico, nv85/era5->Lendário).
- Nenhum item passa do teto em drop, baú e Chefe de Era Difícil (≈59 mil itens por caso em 6 combinações de nível/era): 0 acima do teto, 0 arma Mítica.
- Ovo: só Mítico/Lendário são barrados (nível 40/era 5: Básico, Raro, Épico passam; Mítico e Lendário viram Épico; nível 90/era 5 passam). Ovos comuns de chefe com nível 40: 3.067 ovos, nenhum Mítico/Lendário.
- Bordas: chefe com nível 5 dá item Básico; Chefe de Era Difícil só dá Lendária com nível 85 e era 5 (nível 84/era 5: 0 de 6.000; nível 85/era 4: 0; nível 85/era 5: 686 de 6.000 = 11%).
- Ovo de MARCO (1ª vitória sobre o Senhor da Era): com nível 40 fica guardado ({r:3, needLevel:70}), não choca e não é rebaixado; o abate comum que sobe 69->70 solta o ovo (levelUp + released): choca golem novo; onLevelUp(70) libera o Mítico e o de nível 85 não libera mais nada; a estrutura held sobrevive ao save/recarga.
- XP por abate: fórmula base 1/15/120 x (1+era) x (1+5% por fase na era): 210 combinações (3 classes x 7 eras x 10 fases), 0 divergências; os orbes de XP somam exatamente o total e nunca passam de 10. Ex.: comum fase 1 = 1; chefe fase 1 = 15; Senhor da Era 6 fase 10 = 1.218.
- Instâncias dão XP na vitória (240 por vitória em Chefe de Era, Mina e Caverna, igual nos três; derrota 0). Observação: o XP da instância é o mesmo para os três tipos e dificuldades; confirmar se é o pretendido.

RESPOSTA DA fps-30 sobre o XP de instância: o valor igual não era intencional. Corrigido: o XP cresce com a dificuldade (Fácil x1, Normal x1,6, Difícil x2,5) e é igual entre os tipos; o Sys.instances passa o multiplicador a Sys.level.onInstance(S, host, mult); a fps-e2 precisa aceitar o 3º parâmetro (sem isso continua 240 fixo). Valor-base provisório até a v6. RETESTAR quando a fps-e2 confirmar: XP por dificuldade = 240 / 384 / 600, igual entre os 4 tipos, derrota 0.

RETESTE DO XP DE INSTÂNCIA (instances.test.js 20 ok; meu qa_instxp.js): APROVADO. 84 combinações (4 tipos x 7 eras x 3 dificuldades): 0 divergências de base 60 x (1+era) x (1, 1,6, 2,5), e o XP entregue ao Sys.level é igual ao reward.xp. Era 3: Chefe de Era 240 / 384 / 600; igual entre os 4 tipos; varrer o Difícil dá 600 e entrega 600; derrota entrega 0; onInstance com multiplicador inválido (texto, negativo) vira 1 e sem multiplicador dá 240.

## PASSE E MISSÕES (js/sys/pass.js, fps-30; pass.test.js 10 ok) e GARANTIA/CUSTO DA INVOCAÇÃO (loot.js, loot.test.js 29 ok) — meus testes qa_pass.js, qa_summon.js: APROVADOS NA LÓGICA
PASSE (simulação dia a dia, diárias completas + bônus = 90/dia, semanais 190/semana):
- Começando numa segunda: nível 30 no dia 27 (grátis todo dia), 29 (perdendo 1 dia por semana) e 21 (premium), exatamente como a spec. Começando no meio da semana chega 1 a 2 dias antes (26/25 e premium 20) porque a 1ª semana parcial já paga as semanais.
- Resgate: a mesma missão não paga duas vezes ("resgatado"); missão incompleta e bônus sem as 6 recusam ("incompleto"); claimAll não paga de novo (2ª chamada = 0).
- Premium: 100 XP viram 125 (+25%); ativar o premium depois resgata os prêmios premium dos níveis já liberados (11 de 11).
- Virada: diária à meia-noite (150 -> 0, a semanal segue 150); semanal na segunda (dom 23:59:50 -> seg 00:00:10: 150 -> 0).
- Itens: nível do jogador 5 guarda 13 (entrega 11); nível 30 entrega 23 e guarda 1; níveis 60 e 90 entregam tudo; nenhum item acima do teto do portão; arma Mítica 0; asa antes do nível 50: 0; os 13 guardados com nível 5 saem ao chegar ao nível 90 com a ERA da liberação (era 5).
INVOCAÇÃO (só ouro, 1 grátis por dia):
- Custo base 300 x 4^era (era 0: 300; era 3: 19.200); x10 = 9 x (2.700 / 172.800). Grátis: 1 por dia (2ª recusa "gratis", grátis com x10 recusa "n"), volta no dia seguinte; sem ouro "ouro"; quantidade inválida "n"; sem host.spendGold "host".
- Garantia (6.000 invocações por caso, mudando de dia a cada 20): a maior sequência sem a melhor raridade é 9 e a 10ª vem nela (garantias acionadas 118 / 293 / 544 em nv30/75/90); nv5/era0 só dá a melhor (Básico) sempre. O contador atravessa o dia: com 9 sem a melhor e virada de dia, a invocação seguinte entrega a melhor (3.000 sementes, 0 falhas).
- 30.000 itens invocados: 0 arma Mítica e 0 skins (sorteio pago de skin é proibido).
A TESTAR NO JOGO: telas do passe e das missões, aba Invocar só em ouro, selo de alertas, resgate com toque.

## RODADA 3 — build v0.7 (servidor de volta): PÉS DESENHADOS, ATAQUE, ULTIMATES E SOM POR ATAQUE
PÉS DESENHADOS (pedido do PO: "o dono viu inimigos pulando que nem pato na era 0"). Método: gancho em drawImage + getTransform dentro de drawEnemyAt; a posição do pé desenhado (centro da base do sprite) menos o deslocamento de base da câmera; 9 a 12 s por era, 3 inimigos, combate automático com golpes. MINHAS MEDIDAS ANTERIORES de "pé" usavam eY(e) (posição LÓGICA, constante por construção): não detectam o que se vê. A medida certa é esta.
- Pé do inimigo (sem o tremor da câmera): 0,0 px de variação nas eras 0, 1, 3, 4, 5 e 6 (centro, esquerdo e direito): NENHUM inimigo pula. Era 2 (folhas): o pé fica na linha por construção do enFrame (sola do quadro no chão); a sola dentro das folhas varia 0 a 4 px de 256 (Goblin attack 4, resto 0-1), ~3 px na tela para o Goblin, acima do limite de 2 px do PO.
- O QUE O DONO VÊ COMO "PULO": (1) TREMOR DA CÂMERA a cada golpe: B.shake=0,2 (0,4 chefe) em heroHit (js/battle.js:129), com 3 inimigos atacando a cada 1,2 s o cenário inteiro, com herói e inimigos, balança de 4 a 8,8 px (era 0: 8,8; era 1: 6,3; era 2: 6,9; era 3: 8,1; era 4: 4,0; era 5 e 6: 6,8), a cada ~0,4 s: parece que todos saltam. (2) AVANÇO DO GOLPE: comuns corpo a corpo avançam no chão até o herói e voltam; medido: slot da frente 45 a 74 px, do meio 132 a 145 px e do fundo 217 a 248 px nas eras 0, 1, 2, 3 (soldado de fuzil: 9 px), 4; eras 5 e 6 (à distância): 8 a 11 px. O inimigo do fundo cruza a tela passando pelos outros.
- Defeito P1 [ALTO] tremor de câmera contínuo com a horda (afeta tudo). Sugestão: tremor só no chefe/ultimate, ou balançar só o cenário, nunca por golpe de comum.
- Defeito P2 [ALTO] avanço do golpe de 130 a 250 px nos comuns do meio e do fundo (o PO aceitou 12 px para o herói); limitar a ~12 px para todos.
ATAQUE DE CADA INIMIGO (evento): todos os visíveis golpeiam (5 a 10 golpes em 12 s por inimigo, intervalo máx. 1,4 s) e CADA golpe chama heroHit: pisca o herói, número de dano, som hero_hurt, partículas e efeito fnHit no herói (js/battle.js:129-132); hero_hurt disparou 14 vezes em 6 s com 3 inimigos (~15 esperadas). Os de longe (eras 2 chefe, 3, 5, 6) usam projétil. Eras 0, 1, 3, 4: sem folha de ataque, o visual é inclinação (cisalhamento ancorado na base) mais o avanço; era 2: folhas de ataque e dano do Goblin e do Esqueleto em uso.
ULTIMATES (7 eras, disparadas por evento com energia 100): todas disparam e duram 2,7 a 2,9 s; nenhum PNG parado de assets/fx é carregado em nenhuma era. Eras 0, 2 e 5: folha ANIMADA (assets/anim/ult/era{0,2,5}_ult.png carregada); eras 1, 3, 4, 6: provisório por partículas em código (100 a 213 partículas, 8 a 16 efeitos). Falta o dono aprovar as animadas na página e ver cada uma no jogo.
SOM POR ATAQUE (por evento, GameAudio.sfx espiado): em todas as 7 eras o jogo chama era{E}_s1 (golpe básico), era{E}_s2 (especial) e era{E}_s3 (ultimate); também hit, crit, hero_hurt, ult_ready. Não repete o que o dono ouvirá: só confirmo o DISPARO, não o som.
Falta: troca de era, derrota com horda, selo "+N", projéteis dos chefes (Tanque, Dragão), baú/offline/save antigo/tutorial.

## REGRA "SÓ LIGADO O QUE ESTÁ APROVADO" (ordem do dono via PO/fps-c9) — conferência com o banco "decisoes" (104 registros, lido agora)
LIGADO esperado na próxima build (aprovado no banco ou tela aprovada): Kael hyb/R (corrida, parado, golpe da mão direita) e corrida sem arma; corridas do Goblin e do Esqueleto; cenários das eras 0 e 2; aura; as 8 músicas e todos os sons (23 originais aprovados + 13 novos); telas 00 Carregamento, 05 Equipamento, 06 Invocar, 07 Loja.
DESLIGADO por chave até o voto (segundo a fps-c9): folhas de ataque, dano e morte dos inimigos das eras 0, 1 e 2; andar das eras 0 e 1; ultimates animadas das eras 0, 2 e 5; cenário da era 1.
DIVERGÊNCIAS ENCONTRADAS NO BANCO (aprovadas e que a lista da fps-c9 trata como desligadas ou não lista):
 - atk-era2_e0, atk-era2_e1, atk-era2_boss: APROVADO (clique às 13:50Z): as folhas de ATAQUE da era 2 (Goblin, Esqueleto, chefe) estão aprovadas e podem ficar LIGADAS. (Hurt e die das eras 0, 1 e 2 e o ataque das eras 0 e 1 NÃO têm voto: seguem desligados.)
 - ult-era2-anim: APROVADO (13:50Z): a ULTIMATE ANIMADA DA ERA 2 está aprovada e pode ficar LIGADA (as das eras 0 e 5 não têm voto: desligadas).
 - aura4-idle, aura7-idle, aura10-idle, aura13-idle/run/attack: APROVADO: as auras +4, +7, +10 e +13 estão aprovadas (a lista cita só a +13).
 - head-hair_bun, head-hair_spiky, head-hat: APROVADO (13:50Z): peças de cabeça do Kael modular (cabelo coque, cabelo espetado, chapéu); não constam na lista.
 - Continuam REPROVADOS (não podem aparecer): ossos, Kael modular a/b/c (mod-*), golpe híbrido da mão esquerda (hyb-attack), os 13 sons antigos.
DECIDIDO (fps-c9, banco é a fonte): na PRÓXIMA build COBRAR COMO LIGADAS: ataque do Goblin, do Esqueleto e do Dragão (era 2) e a ultimate animada da era 2. DESLIGADOS (reprovar se aparecerem ligados): dano e morte de TODOS os inimigos; andar e ataque das eras 0 e 1; ultimates animadas das eras 0 e 5; cenário da era 1. Auras +4/+7/+10/+13 e peças de cabeça: aprovadas, mas sem onde aparecer nesta rodada (Forja e cabeça trocável): NÃO cobrar ainda. O engenheiro publica no relatório a tabela chave -> arquivo -> estado para eu conferir contra o banco.
COMO CONFERIR NA BUILD: a tabela de chaves do relatório do engenheiro; para cada arte ligada, achar o id aprovado no banco; reprovar arte NÃO aprovada que apareça ligada (ex.: ultimate animada das eras 0 e 5, hurt/die, cenário da era 1, ataque das eras 0 e 1).

## RODADA 4 — build v0.7.4 (roteiro fixo, medindo pixels DESENHADOS com gancho em drawImage/getTransform e o window.__probe do engenheiro; uma aba)
APROVADO:
- PÉS: variação 0,0 px em todos os comuns das 7 eras (sem o tremor de câmera). Rotação 0,00 em todos. AVANÇO do golpe: 12 px (corpo a corpo) e 5 px (à distância: soldado era 3, eras 5 e 6), nenhum acima de 12.
- TREMOR: golpes de inimigo no herói: 23 em 10 s na era 0, tremor 0 após cada um. O único tremor medido (5 a 9,5 px) vem da ULTIMATE do herói (máx. 1,11 de B.shake), permitido.
- ATAQUE: todos os 3 slots golpeiam nas 7 eras: 5 a 8 golpes por inimigo em 8 a 10 s, intervalo médio 1,23 a 1,39 s (limite 2 s).
- ALTURAS DESENHADAS dos comuns (px de tela): era 0: 97/97/87; 1: 97/97/90; 3: 100/108/90; 4: 97/97/90; 5: 97/97/87; 6: 100/108/90 (mínimos 95/95/85 cumpridos). Era 2 (folhas): células de folha, altura do conteúdo opaco não medida (ver pendência).
- BORDA DIREITA: era 1 376, era 3 378, era 4 377, era 6 376: dentro de 382.
- CHEFES (altura x escala, caixa x): e0 180 (199..373), e1 150 (178..382), e2 163 (190..382), e3 180 (220..352), e4 180 (203..369), e5 154 (190..382), e6 160 (190..382), Senhor da Era 1: 150 (178..382). Todos dentro de 190..382 (170 aceito para largos) e >= 150 pelo valor do engenheiro. Chefe golpeia com 12 px de avanço, rot 0, intervalo 1,25 s; tremor do chefe só durante a ultimate.
- ARTE LIGADA SÓ SE APROVADA: folhas de ataque só na era 2 (Goblin, Esqueleto, Dragão); nenhuma folha em 0, 1, 3, 4, 5, 6; ultimates animadas das eras 0 e 5 NÃO carregam (desligadas, conforme o banco); a da era 2 liga. Versão v0.7.4 visível.
DEFEITOS:
 Q1 [MÉDIO] Comum do fundo passa da margem direita (x máx 382): era 0 = 388 (6 px), era 5 (drone, 144 px de largura) = 392 (10 px). Cortado pela borda.
 Q2 [MÉDIO] Chefes largos com altura OPACA abaixo de 150: o Senhor da Era 1 (Minotauro) mede 150 de destino mas 144 px de pixels opacos (bbox, 96%); o engenheiro mede o destino, não o bbox opaco. Pela mesma proporção, era 5 (154) ficaria ~148. Pedir 150 de OPACO (ou aceitar 144).
 Q3 [BAIXO] Sobreposição frente/meio: era 0 e era 4 ~43% (limite 40, declarado); era 5 (drone largo de 144 px) passa de todas as regras (declarado, com o PO).
PENDENTE: medir o conteúdo OPACO dos comuns da era 2 (as folhas têm células largas: o retângulo não mostra a largura real) para altura, sobreposição e margem; derrota com horda, troca de era, selo "+N", projétil do Tanque/Dragão com dano, baú e offline, save antigo, tutorial.

## FOLHAS DOS INIMIGOS DAS 7 ERAS (fps-ff; assets/anim/hyb/enemy/era{0..6}_{e0,e1,boss}_{run,attack,hurt,die}) — medidas por script (qa_enemy_sheets.js e qa_enemy_sheets2.js). Nenhuma está no jogo nem votada no banco: seguem DESLIGADAS; isto é parecer de arte para a fps-ff.
Cobertura: 82 de 84 folhas em hyb/enemy (faltam era2_e0_run e era2_e1_run nesta pasta: existem aprovadas em assets/anim/era2_e{0,1}_run.png). JSON e PNG conferem em tamanho nas 82.
LIMITES DO MÉTODO: "sola" = linha mais baixa de pixels opacos do quadro (inclui arma e cauda, não só os pés); a pose neutra de referência é o 1º quadro do ataque; sem olhar a imagem não dá para separar pé de arma. Itens abaixo são para CONFERIR na prévia, exceto os marcados como certos.
 S1 [MÉDIO] CORTE NO TOPO (sprite com pixels opacos na linha 0 ou 1 do quadro): corrida do chefe nas eras 0 (5 de 8 quadros), 3 (8 de 8) e 4 (8 de 8); ataque do chefe nas eras 0 (6 de 12), 3 (5), 4 (7), 5 (6); hurt do chefe nas eras 0 (5), 3 (12 de 12) e 4 (6); ataque do e1 nas eras 1 e 2 (4 de 12 cada); hurt do e0 era 0 (8 de 12); morte do chefe da era 3 (10 de 13). Cabeça, chifre ou arma provavelmente cortados pela moldura de 256 de altura: aumentar a altura do quadro ou reduzir o desenho.
 S2 [BAIXO] Folhas de morte tocam a BASE do quadro em muitos quadros (era0_e1 10 de 13; era0_boss 7; era1_e0 9; era1_boss 6; era2_e0 8; era2_e1 9; era3_e0 10; era3_e1 8; era4_e0 10; era4_boss 8; era5_boss 8; era6_e0 8; era6_e1 7): o corpo deitado encosta na borda de baixo, possível corte. Aceitável se o corpo cabe; conferir.
 S3 [MÉDIO] HURT que NÃO volta à pose neutra, nos casos em que a referência está alinhada (1º quadro do hurt ≈ pose neutra): era0_e0 (último quadro difere 28.771 px da neutra contra média 4.506 entre quadros), era1_e0 (7.624), era2_e0 (7.754), era2_boss (19.400), era3_boss (21.096), era4_e1 (13.425), era0_e1 (4.223, limítrofe): ao terminar o hurt o jogo volta ao sprite parado e o corpo "pula" de pose. Outras 7 folhas de hurt (era0_boss, era3_e1, era5_e1, era5_boss, era6_e0, era6_e1, era6_boss) têm o 1º quadro MUITO diferente da neutra (25 a 48 mil px): ou o alinhamento da folha difere do ataque, ou a pose inicial do hurt já é outra; não consegui avaliar por script: conferir.
 S4 [MÉDIO] PÉS/ARMA nos ataques: a sola DESCE 11 a 13 px (de 256) nos ataques do chefe das eras 1, 3, 4 e 6 (e 7 na era 5) e do e1 da era 0; nos hurts do e0 da era 4 (12), e1 da era 6 (12), chefe da era 3 (11) e e0 da era 6 (9). Se for ARMA batendo no chão, tudo bem; se forem os pés, o personagem afunda ~9 px na tela (limite 2). O e1 da era 1 no ataque SOBE 14 px. Confirmar na prévia.
 S5 [INFO] Drone (era5_e0): sola do 1º quadro em y=200 (voa 43 px acima da linha de 243, de propósito); no hurt desce até +32 e no ataque sobe 11: aceitável como voador se a sombra ficar na linha do chão.
 S6 [INFO] Quadros parados (iguais ao anterior): era1_e0 ataque 3 e hurt 3; era3_e1 ataque 4; era5_e1 hurt 6; era6_e0 hurt 3. Ok se for pausa intencional (impacto); 6 quadros de 12 parados no hurt do Mercenário da era 5 é longo.
 S7 [BAIXO] Morte terminando em pé: era4_e1 (altura final 168 de 195), era4_boss (213 de 243) e era5_boss (152 de 196): a folha não deita; o jogo faz fade nos últimos 20%, então confirmar de olho se desmanchar em pé é intencional.
 S8 [OK] Corridas: variação de pés média 2,8 px (máx 6) em 19 folhas; nenhuma corrida corta na lateral. Nenhuma folha corta nas bordas ESQUERDA e DIREITA (0 em 82).
Pendente: ver tudo na prévia /test/anim/sheets/?era=N, e a aprovação do dono item a item na página (hurt, die, ataque das eras 0 e 1 e o andar seguem sem voto).

REMEDIÇÃO DAS 82 FOLHAS DE INIMIGOS APÓS A CORREÇÃO DA fps-ff (h=320, padTop 64, feetY 307):
- S1 RESOLVIDO: 0 folhas com pixels opacos nas linhas 0 e 1 (topo); esquerda e direita seguem 0; JSON com padTop/feetY presente.
- S4 (sola desce 11-13 px nos ataques/hurts de chefes): a fps-ff explica que é a arma/golpe (machado do Minotauro, clava, punhos da Caldeira, tentáculos, coice do Tanque) e os pés ficam na linha; conferir no jogo. NOVO S9 [MÉDIO]: como o golpe desce +12/+13 px abaixo da sola (307 -> 319/320), ele encosta na BASE do quadro de 320 e pode ficar cortado embaixo: ataque do chefe das eras 1 (3 de 12 quadros), 3 (3), 4 (2); hurt do chefe da era 3 (2) e do e0 da era 4 (1) e e1 da era 6 (2); ataque do e1 da era 0 (1). Pedir padBottom (ou subir o chão para 300).
- S3 CONFIRMADO com referência melhor (1º quadro da corrida como pose neutra; a folha de hurt começa perto da neutra): o último quadro do hurt fica longe dela em 11 folhas: era0_e0 (30.610 px contra média de 4.634 entre quadros; 1º quadro 4.547), era0_boss (32.380; 4.903), era1_e0 (10.537), era2_boss (23.525; 1º quadro 1.647), era3_boss (22.264; 1º quadro 702), era4_e1 (14.221), era5_e1 (7.973), era6_e0 (12.573), era6_e1 (13.477), era2_e0 (7.526), era0_e1 (5.649, limítrofe). Voltar direto ao 1º quadro da corrida produz um salto de pose de 2 a 5 passos normais. A própria fps-ff diz que o hurt é o 1º segundo do vídeo "apanha e depois morre": o fim do hurt é o começo da morte, não um retorno. Recomendação: refazer o hurt só com recuo e volta (como ela propôs se ficar ruim), ou cortar o hurt no quadro de impacto máximo e crossfade para o andar.
- S6 e S7 inalterados (quadros parados; 3 mortes terminando em pé).
- Sem votos no banco: seguem desligadas no jogo.

REMEDIÇÃO DAS 82 FOLHAS (h=352, padTop 64, padBottom 32, feetY 307; hurts refeitos como recuo e volta):
- S9 RESOLVIDO: só 1 folha encosta em alguma borda: era4_e0_hurt (1 quadro, 2 px de peças soltando abaixo da sola, aceito pela fps-ff). Nenhuma outra toca topo, base, esquerda ou direita.
- S3 RESOLVIDO: os hurts terminam onde começam. Só 3 folhas diferem da pose de corrida, e por igual no início e no fim (era0_boss 4.905 contra 4.903 no 1º quadro; era4_e1 2.735 contra 2.565; drone era5_e0 3.495 contra 3.491): voltam à pose de partida.
- T1 [MÉDIO] NOVO: os hurts refeitos ficaram QUASE ESTÁTICOS: quadros iguais ao anterior: era5_e1_hurt 11 de 11 passos (praticamente uma imagem parada de 12 quadros), era1_e0_hurt 6, era6_e0_hurt 5, era5_boss_hurt 4, era0_boss_hurt 3; também ataque era1_e0 3 e era3_e1 4. O recuo repete quadros e não mexe o corpo: o inimigo "não reage" ao dano.
- T2 [MÉDIO] NOVO: sola (linha mais baixa) desce muito em alguns hurts/ataques refeitos: hurt do chefe da era 3 +40 px de 256 (antes +12), hurt do Golem era4_e0 +44 (peças soltando, segundo a fps-ff), drone era5_e0 +23 (voador); ataque do chefe das eras 1 (+15), 3 (+14), 4 (+18), 6 (+11); e ataque do e1 da era 0 (+17). Confirmar se é arma/peça e não os pés (o chefe da era 3 no hurt é o mais suspeito).
- T3 [ALTO] POSSÍVEL REGRESSÃO EM ARTE APROVADA: o ataque do Esqueleto da era 2 (atk-era2_e1, APROVADO no banco e ligado no jogo) agora tem a sola descendo +24 px (de 256), contra 0 px na versão aprovada (243-243). O conteúdo parece o mesmo (área do 1º e do último quadro idêntica à anterior: 21.850 e 21.912), então o que mudou foi o ALINHAMENTO vertical por quadro na regravação (arquivos de 12:05). Goblin (atk-era2_e0) e chefe (atk-era2_boss) mantêm a mesma área e não aparecem com descida. Arte aprovada alterada depois do voto precisa de novo voto, ou voltar ao arquivo aprovado.
- Estado inalterado: mortes terminando em pé (era4_e1, era4_boss, era5_boss).

RECONFERÊNCIA APÓS A RESTAURAÇÃO DA ERA 2 (fps-ff, 12:10): T3 RESOLVIDO. Ataque da era 2 restaurado em h=256, feetY 243: Goblin sola 242-246 (variação 4, como na versão aprovada que registrei), Esqueleto sola 243-243 (igual ao registrado: 243-243), chefe 242-242; áreas do 1º e do último quadro idênticas às registradas na aprovação (21.061/21.014; 21.850/21.912; 19.699/19.788). Sem cópia do arquivo antigo não há md5 para comparar; a igualdade de sola, área e dimensões é o que consigo afirmar. OBS: o ataque do Esqueleto da era 2 (aprovado) toca o TOPO do quadro de 256 em 4 de 12 quadros; veio assim na versão aprovada, então não reprovo.
T1 (hurts) após refazer pelo quadro de maior reação: ainda com muitos quadros parados: era5_e1 7, era6_e0 5, era4_e0 4, era5_boss 4, era1_e0 4 (a fps-ff propõe refazer só esses 5 com vídeo de recuo, +20 créditos, se o PO liberar; até lá, reforço por código com piscar branco e recuo). Novo: hurt do chefe da era 3 toca o topo em 3 quadros.
T2 (sola descendo): a fps-ff explica que são arma, peças ou névoa (fantasma vira névoa, Golem solta peças, drone cai ao ser atingido, chefes batem no chão): conferir no jogo.

## RODADA 5 — build v0.8.1 (7 espaços, telas 05/06/07, 5 abas, balanceamento v7.1): PROGRESSÃO INDEPENDENTE E TELAS
PROGRESSÃO (ACHADO GRAVE CONFIRMADO). Jogo novo e isolado (?debug=1&fresh=1: não toca o save real), tempo de jogo acelerado por step(0,05) (12 min de jogo em ~0,1 s), AUTO. Três perfis:
 (A) sem melhorar item: fase 2 em 1 min, 5 em 4, 9 em 10, 10 em ~30; em 40 min: 19 mortes, nível 13, ouro sobrando (3.360), nunca passa da fase 10.
 (B) gastando o ouro em melhorias a cada 30 s (44 melhorias): fase 10 em 20 min; 20 mortes em 40 min; sem passar.
 (C) melhorando item e lançando especial e ultimate sempre que carregam: fase 10 em 9 min; 28 mortes em 40 min; ainda na era 0 aos 40 min.
 Conclusão: nos 3 perfis o jogador NÃO derrota o Senhor da Era 0 em 40 min. A curva até o chefe é rápida (fase 9 em 6,5 a 10 min) e o chefe é uma parede. Reportado à fps-c9; refazer os 3 perfis depois da recalibração (scripts em C:\Users\rafae\AppData\Local\Temp\qa_tests).
TELAS (v0.8.1, jogo isolado, 390x844):
- 5 abas na ordem do PO: Batalha, Equip., Invocar, Loja, Passe. Nenhuma tela tem rolagem (0 elementos com overflow em Equip., Invocar, Loja e Passe).
- 05 EQUIPAMENTO: cabeçalho com avatar, "Kael Nv. N", FC, moedas, gemas com "+", menu; 7 espaços ao redor do herói (Chapéu/Elmo, Asa, Arma, Colete, Luvas, Botas, Colar) com "+0" de forja; painel "Força de combate" e 6 atributos (ATK, HP, DEF, Chance crítica, Dano crítico, Vel. de ataque); cartão "Skin Básico +4% ATK/HP"; lista "Todos os itens" com "Equipar melhor" e paginação. Estrutura bate com o protótipo (que tinha Arma/Armadura e Montaria/Título; os 7 espaços vêm de decisão posterior).
- 06 INVOCAR: baú grande, "Chances no seu nível" com raridades trancadas por nível (Raro 10, Épico 25, Mítico 70, Lendário 85), "Abrir grátis · 1 por dia", "Abrir x1" (500) e "Abrir x10" (4,5K), garantia "0/10" e texto "Só itens, pagos em ouro · sem sorteio de skin". Sem invocação de skin.
- 07 LOJA: 5 sub-abas (Skins de herói, Skins de arma, Gemas, Itens, Coleção), oferta do dia com contagem regressiva e botão "Ver 60 gemas", 6 skins por página (página 1 de 7), "compra direta, sem sorteio".
DEFEITOS DAS TELAS:
 E1 [BAIXO] Texto de desenvolvimento visível na tela de Equipamento: "Mochila 3/60 · ícones provisórios (SVG)". E nos cartões da Loja: "prévia, animação em produção" sobreposto a cada skin.
 E2 [BAIXO] O toast de drop ("Drop: Pele de Coelho [Básico – Colete]") cobre o rótulo do espaço "Asa" no Equipamento e o cabeçalho "Baú de Equipamento" na Invocar.
 E3 [BAIXO] Invocar: "Abrir x10" (4,5K) aparece em dourado pulsante mesmo sem ouro (59); o clique não compra (ouro e mochila inalterados) mas não vi aviso de "ouro insuficiente" (o toast ficou em "Fase 1 vencida!"). Conferir se há feedback.
 E4 [INFO] Skin dá bônus de ATK/HP (cartão "Skin Básico +4% ATK/HP", "Coleção de skins +1%", "Skin dá bônus de ATK e HP"): decisão consciente do PO, já registrada; contradiz a regra antiga "skin nunca dá atributo", que eu havia anotado. Confirmar que é a regra final.
 E5 [INFO] Invocar x1 custa 500 e x10 4,5K na era 0; a fórmula antiga (300 x 4^era) dava 300 e 2,7K: o balanceamento v7.1 mudou o preço (verificar com o PO).
E4 CONFERIDO (pedido da fps-c9): a regra do dono (skin equipada +2/+3/+5/+7/+10% por raridade, mais +0,5% por skin possuída, teto +10%) bate com js/sys/skin.js em 175 combinações (raridade da arma x raridade da roupa x quantidade de skins), 0 divergências. Jogo novo: skins w00 e a00 (as duas equipadas, Básicas) = equipada 4% (2% + 2%, um por espaço de skin) + coleção 1% (2 x 0,5%) = TOTAL 5%. O cartão da Equipamento mostra "Skin Básico +4% ATK/HP" e "Coleção de skins +1%" separados: o +4% NÃO é a soma; é só a parte equipada (dois espaços). O total aplicado é 5%: conferido nos números do jogo (HP 140 -> 147 = x1,05; ATK 13 -> 14). Sugestão: mostrar o total ("+5% total") no cartão. PONTOS ABERTOS: (1) o código soma POR ESPAÇO de skin (arma + roupa); o comentário do módulo diz "decisão do PO pendente" (alternativa: só a melhor): com duas Lendárias dá +20% equipada + até +10% coleção = +30%; (2) skins do passe (p5 Mítica, p20 Lendária) dão +17% equipadas.
E5 CONFIRMADO PELO PO: invocação base 500 x 4^era (x10 = 9x): 500 e 4,5K na era 0 estão certos; 300/2,7K são fórmulas superadas.
CRITÉRIO DO PO PARA O TRAVAMENTO: jogador novo, AUTO, melhorando sempre, passa o Senhor da Era 0 em até ~20 min de jogo com no máximo 3 derrotas (a v7.3 está com o agente de balanceamento; refazer os 3 perfis quando a build sair).
v7.3 (em aplicação pelo engenheiro; números do agente de balanceamento, a confirmar por mim quando a build subir): AUTO melhorando sempre passa o Senhor da Era 0 em 8,6 a 11,1 min com 1 ou 2 derrotas (13 de 13). Meus perfis A e B em MANUAL sem especial nem ultimate seguem presos na fase 10 depois de 40 min (esperado, com o PO). Era 1 passa com 26 a 100 derrotas; era 2 em ~202 min com 194 derrotas. PREOCUPAÇÃO DE BALANCEAMENTO (para o PO, não é defeito pelo critério dele): era 1 com até 100 derrotas e era 2 com ~202 min e 194 derrotas parecem muros; o critério atual cobre só a era 0. Mochila cheia passa a desmontar o item mais fraco, em vez do novo (testar). O script de progressão foi salvo para o agente de balanceamento reutilizar: C:\Users\rafae\AppData\Local\Temp\qa_tests\qa_progress_browser.js (roda na página, no jogo real; antes eu o rodei inline: os arquivos qa_*.js desta pasta que o agente lê testam só os módulos).
RODADA 6 — build v0.9 (v7.3 + modo farm + Intro): PROGRESSÃO, jogo novo isolado, tempo acelerado, AUTO ligado, melhorando os itens a cada 10 s; script em qa_progress_browser.js (versão com Intro e Desafiar).
FLUXO DA INTRO (v0.9): carregamento "Toque para continuar" -> cartões da Intro (Próximo/Pular) -> escolha do herói (Kael selecionável; Kaia "em breve" não faz nada ao tocar) -> "Escolher" -> "Começar a aventura" -> nome sorteado (Lenda_57) -> "Começar" -> tutorial (Pular). Depois da Intro o botão fica "AUTO" (durante a Intro mostra "MANUAL").
MODO FARM: perder para o chefe põe o jogo em farm (ondas 1 a 4 da mesma fase) sem laço de "Derrotado"; o botão "Desafiar" (challengeBoss, js/battle.js:234) volta ao chefe com a vida cheia. Sem apertar "Desafiar" o jogador NÃO passa de fase (perfil B antigo, que só melhora item e nunca desafia, ficou 52 min em 10-1/10-2 com 1 morte).
RESULTADOS (jogador melhorando sempre):
 - "Desafia quando o botão brilha" (FC >= 90% da recomendada): Senhor da Era 0 vencido aos 12,2 min com 1 morte e 1 desafio. CRITÉRIO DO PO (até ~20 min, no máximo 3 derrotas): CUMPRIDO. Era 1: aos 29,7 min chegou à fase 20 e, em 45 min, ficou em farm com FC 10.722 contra 12.300 recomendada (87%): o botão nunca brilhou e o jogador não passou o Senhor da Era 1.
 - "Desafia sempre que pode": Senhor da Era 0 aos 8,7 min com 0 mortes; Senhor da Era 1 aos 25,7 min, mas com 24 mortes e 21 desafios; 107 mortes e 102 desafios em 60 min, chegando à fase 27 aos 57 min.
 - Meta do PO para a era 0 é 15 a 18 min: está RÁPIDO (8,7 a 12,2 min), como o engenheiro já notou. Medida do engenheiro na era 1: 19,7 min com 5 derrotas, ou 9,1/10,5 min sem derrota; a minha: 25,7 min com 24 mortes (sempre) ou sem passar em 45 min (brilho): a diferença persiste; usar o mesmo script e a mesma regra de desafio para comparar.
 B1 [ALTO] Parede na fase 21 (1º chefe da era 2): FC do herói 19.445 acima da recomendada 17.401 e o chefe mata 30 vezes em 10 min (mortes 36 -> 66, 62 desafios aos 40 min). Chefe forte demais ou a FC recomendada da fase 21 está baixa.
 B2 [MÉDIO] Jogador que espera o brilho (90%) não passa o Senhor da Era 1 em 45 min (FC a 87%): aumentar a velocidade de ganho de FC na era 1 ou baixar o limiar; a regra de brilho a 90% pode prender o jogador cauteloso.
TELAS v0.9 (jogo isolado, 390x844): 04 BATALHA (fase 27 em farm): cabeçalho com avatar, apelido, FC "72.855", moedas, gemas com "+", menu; título "Medieval · 3–7" com "FARM" e botão vermelho "Desafiar"; barra "Horda 3/4"; coluna esquerda com Missões (selo 4) e Baú (x3); coluna direita com AUTO, x1, música e olho; painel Vida (29.440 / 31.083) e Energia (82%) no canto inferior esquerdo; habilidades Auto / Golpe Sísmico / Ultimate com rótulos embaixo; selo "+5" na borda direita; 5 abas com selo no Passe. Estrutura igual ao protótipo.
 INTRO v0.9: 3 cartões ("ERA 0 · PRÉ-HISTÓRIA: Tudo começa com um osso e coragem...", "ATRAVESSE AS ERAS...", "ERA 6 · FUTURISTA: Até o fim do tempo... Devorador Cósmico"), "Pular" em todos e "Próximo" / "Vamos!"; depois escolha do herói (Kael; Kaia "em breve") -> "Escolher" -> "Começar a aventura" -> "Começar".
 I1 [MÉDIO] A escolha do apelido não existe: nenhum campo de texto em nenhum passo da Intro e o nome é sorteado sozinho ("Lenda_57"). O protótipo/PO (tela 03) pede apelido de 3 a 14 caracteres com filtro de palavrão, nome único e botão sortear. Conferir se a escolha foi movida para outra tela (Configurações?).
 I2 [BAIXO] Kaia "em breve": tocar não faz nada; a regra do PO é mostrar o aviso "Kaia chega em breve" (já passado ao engenheiro pela fps-c9).
 PO: o botão "Desafiar" fica SEMPRE visível (apagado abaixo de 90% da FC recomendada, brilhando acima), inclusive fora do farm: testar na próxima build (hoje só aparece em farm).
 CALIBRAÇÃO: a fps-c9 lançou um agente de calibração no jogo real, era por era (3 perfis, com o meu qa_progress_browser.js). Metas: era 0 em 15-18 min; nenhuma parede nas eras 0 a 2 (com a FC recomendada o chefe cai com no máximo 3 derrotas); XP por abate menor (nível ~11 no fim da era 0 e 26-27 no fim da era 2). Repetir os perfis quando sair.
NÃO COBERTO: item antigo com nível > 1 migrando; mochila cheia; garantia da invocação disparando e x1 pago na UI; abas "Skins de arma" e páginas 2+ da Loja; tutorial do zero até o fim; offline e baú de toque; tela baixa; drone sozinho na era 5; recarga por version.json com um index antigo real.

## RODADA 7 — v0.10: ARTE APROVADA x NO JOGO, ERA POR ERA (ordem do dono via PO) + roteiro obrigatório
O banco "decisoes" (247 registros, lido agora) tem 220 APROVADOS e 27 reprovados (os reprovados são ossos, Kael modular e os 13 sons antigos; NENHUM reprovado de combate). Aprovado agora, além do que eu já tinha: TODAS as folhas de inimigos de TODAS as eras (foe-era0..6_{e0,e1,boss}-{run,attack,hurt,die} = 84 itens, todos "aprovado"; era 2 pelos ids antigos run/atk/hurt/die incl. chefe), as 7 ultimates animadas (ult-era0..6-anim), s1 e s2 da era 2 (3 tiers cada), cenários das eras 0 a 3, ícones de equipamento das 7 eras, auras.
NO JOGO (v0.10, folhas de inimigos realmente desenhadas, medido com enSheet e lista de arquivos carregados):
| era | aprovado (run/attack/hurt/die: e0, e1, chefe) | no jogo | print |
|---|---|---|---|
| 0 | tudo (12 folhas) | NENHUMA (0 de 12): inimigos deslizam e inclinam | screenshot-1794501268180-0.png |
| 1 | tudo (12 folhas) | NENHUMA (0 de 12) | screenshot-1794501290905-1.png |
| 2 | tudo, mais a corrida do chefe | e0 e e1: corrida e ataque EM USO; hurt do e1 usado; hurt/die do e0 e e1 carregados; ataque do chefe carregado; corrida do chefe (era2_boss_run) NÃO carregada | screenshot-1794501304362-2.png |
| 3 | tudo (12 folhas) | NENHUMA | screenshot-1794501328148-3.png |
| 4 | tudo (12 folhas) | NENHUMA | screenshot-1794501341408-4.png |
| 5 | tudo (12 folhas) | NENHUMA | screenshot-1794501361491-5.png |
| 6 | tudo (12 folhas) | NENHUMA | screenshot-1794501374776-6.png |
Pasta dos prints: C:\Users\rafae\AppData\Local\Temp\claude-chrome-screenshots-HGj65H\. Resumo: só a era 2 usa folhas (corrida e ataque do Goblin e do Esqueleto); eras 0, 1, 3, 4, 5 e 6 usam o sprite parado com inclinação, mesmo com todas as folhas aprovadas. É isso que o dono vê ("andam e atacam errado"): arte aprovada NÃO ligada. Ultimates animadas aprovadas e NÃO ligadas nas eras 0, 1, 3, 4, 5, 6 (carregam só a da era 2; vistas por partículas nas outras). Engenheiro está ligando os 220 itens (docs/ARTE_APROVADA.md; reports/auditoria-aprovados.md virá): conferir a tabela contra o jogo quando a fps-c9 avisar.
DIREÇÃO nos prints: tigre (era 0), escorpiões (1), Goblin (2), pirata (3), golem (4), alienígena (6) viram para a ESQUERDA, para o herói; o drone da era 5 está de frente (aceito). Herói à direita com arma na mão.
ROTEIRO OBRIGATÓRIO v0.10 (eras 0 a 6, horda): pés 0,0 px, rotação 0, avanço <= 12 px (5 px à distância), tremor por golpe de inimigo 0 em todas, alturas 87-108 px, borda direita <= 382; intervalo entre golpes: eras 0, 2 a 6 com máximo de 1,2 a 1,9 s; ERA 1: DEFEITO Y1 [MÉDIO] intervalo médio ~1,9 s e MÁXIMO de 3,4 a 4,0 s entre golpes (limite 2 s), ao passo que as outras eras ficam em 1,2 a 1,6 s (era 1 só em v0.10). Era 5 só entra o Drone (aceito). "Desafiar" visível mesmo fora do farm (stage 1, sem farm): confirmado. Botão x1 mostra "x1x2" (x2 trancado com o cadeado "x2" no canto nos prints).
NÃO CONFERIDO AINDA nesta rodada: velocidade x1/x2/x4 e regras de VIP/nível, "Nível X!" (visto no print da era 1: aparece "Nível 2!" no centro da tela), faixa da ultimate, derrota para o chefe/farm sem laço, dano e morte animados do Goblin e do Esqueleto (hurt do e1 em uso; die carregada, sem registrar uso), Corte Giratório, chefes das 7 eras na v0.10.

## RODADA 8 — v0.11.x (resumo)
- v0.11.2: ícones leves da fps-ff (49): APROVADOS (dif. média máx 1,8/255 a 120 px). Folha composta do golpe do Kael encosta na borda em 10 de 17 quadros (base aprovada: 2) → arte (fps-ff); v0.11.4 passou a folha larga.
- v0.11.3/v0.11.4: defeitos x>382 e sola dos chefes e3/e4 foram ao engenheiro; PO decidiu depois: arma/efeito pode passar de 382, corpo não; pé abaixo da linha não.
- v0.11.5 (estável): Senhor da Era 0-6 morre e a era troca, sem congelar nem exceção (lord=0..6). Sola dos comuns = linha do Kael (±1). Pé abaixo da linha em quadros de golpe: Brutamontes e0 +10, chefe e1 +13, Capitão Fantasma e3 +11, chefe e4 +14, chefe e5 +6, chefe e6 +9 (hurt 0-1). Veredito: liberação CONDICIONAL.
- ABERTO: avanço pela âncora do pé, sobreposição, Kael misto/folha larga nos 3 tiers, passe/6 diárias, XP/nível, jogador novo sem debug, pé patinando, celular.

## RODADA 9 — v0.11.6 (veredito final: LIBERAR com ressalvas)
- Capitão Fantasma e3: golpe base 389-390 (linha 390); dano base = feetY em todos os quadros (sem feetDy). OK.
- 82 folhas lidas (alfa>128): só golpes já aceitos pelo PO passam de 2 px abaixo (Brutamontes e0 +4, Minotauro e1 +13, chefe e4 +16, chefe e5 +7).
- Passe (instancesOn=false): 6 diárias fecham, bônus libera (+20 XP, +15 gemas), 5 de 6 não libera.
- Jogador novo sem debug (127.0.0.2): título → intro → herói (Kaia "em breve") → apelido → boas-vindas → fase 1 vencida em ~45 s, nv3, sem erro. UX: aviso do tutorial cobre o HUD enquanto a luta corre.
- Kael folha larga t0/t1/t2: 0 quadros na borda, sola 241-247.
- ABERTO: pé patinando nas 7 eras, Kael t2 e misto em jogo, medir eras 0/1/4/5/6 em jogo na v0.11.6.

## RODADA 10 — v0.12.x (sem navegador, ordem do dono)
- Era 0, por réplica de hordeFit (qa_tests/qa_horde_e0.js, 8 combinações e0/e1): distância frente→Kael parado 14-17 px de 390; frente×meio 46-55%; meio×fundo 53-64% (acima dos 55% em 4 combinações). Bordas ≤382, alturas < Kael. Não validado em jogo.
- v0.12.1 parcial: sem AUTO/MANUAL, tutorial avança, painéis Equip/Invocar ok; Loja/Passe: "Voltar" do topo funciona, "‹" do rodapé é paginação. Faltou Progresso, arrastar, 390x844, alvos ≥44, fim do tutorial.

## ROTEIRO FIXO DA RODADA (acrescentado a pedido do PO; vale a cada build)
Para cada era 0 a 6, com horda e com chefe, ~10 s de combate com golpes:
1) PÉS DESENHADOS quadro a quadro (gancho em drawImage + getTransform, menos o deslocamento da câmera): variação <= 2 px por inimigo (centro, esquerdo, direito). Sheets: medir também a sola dentro da folha.
2) TREMOR POR TIPO DE GOLPE: golpe de COMUM = 0 px (nenhum tremor); CHEFE = no máximo 3 px e só no golpe forte; ULTIMATE pode tremer. Medir o deslocamento da câmera (base.f e base.e) por tipo de evento.
3) DESLOCAMENTO HORIZONTAL MÁXIMO de cada inimigo a partir do slot: <= 12 px (regra antiga de avançar até o herói foi revogada pelo PO).
4) ATAQUE: todo inimigo visível golpeia (intervalo <= 2 s) e cada golpe gera efeito visual (heroHit: piscar, número, partículas, fnHit) e som.
5) ALTURA/CENTROS/SOBREPOSIÇÃO/MARGENS/LINHA DOS PÉS (y=613 de 844) com a tabela do PO.
6) ULTIMATES uma a uma (sem PNG parado), SOM disparado por ataque (s1/s2/s3 por era), "+N", troca de era, derrota com horda, projéteis dos chefes.
Estado na v0.7 (a corrigir pelo engenheiro): tremor de comum 4 a 8,8 px (limite 0), avanço do golpe 45-248 px (limite 12).
ACRESCENTADO (fps-c9, regra do PO, também em docs/CONTRATO_V2.md): nunca tremer personagens separados do chão; o golpe do inimigo = animação no lugar (folha, quando houver; senão avanço curto com inclinação) + efeito de impacto no herói (corte ou faísca na cor da era) + herói piscando + número + som; os de longe com projétil. EXCEÇÃO ACEITA: a sola do Goblin variando ~3 px na folha de ataque é da arte, aceita pelo PO: não reprovar. O engenheiro vai publicar pelo window.__probe a tabela de medidas de cada sprite desenhado (usar para conferir).

## ÁUDIO: ESCUTA HUMANA — LIMITAÇÃO DESTE AMBIENTE (pedido do PO via fps-c9)
O QA é uma IA sem saída de áudio: NINGUÉM OUVIU nenhum som do jogo nesta sessão. Tudo que está em reports/qa_audio.md e acima foi medido por script (duração, pico, loudness aproximado, silêncio, emenda de loop, decodificação). Falta uma rodada de ESCUTA REAL por uma pessoa (fone ou alto-falante do celular): música por era (loop), s1/s2/s3 das 7 eras, acerto, dano no herói, chefe aparecendo, moeda, toque de UI. Sugestão: o dono ou alguém do time escuta com o roteiro da página de aprovação.

## REGRAS NOVAS DO PO (via fps-c9) PARA O CHEFE E A ESCALA — critérios de teste da próxima rodada
- Chefe: escoltas primeiro; quando morrem, o chefe ENTRA andando e para num slot próprio, centralizado na metade direita, INTEIRO na tela (margem de 8 px), com rótulo e barra centralizados acima dele.
- Escala (altura do sprite em px de tela 390): herói ~160; inimigo comum 110-120 (±10% por espécie, nunca abaixo de 100); chefe 180-200; todos com os pés na MESMA linha. Medir por script (e.dh, HS) nas 7 eras.
- A build mostrará a versão no rodapé (para eu registrar qual build testei).

## FOLHAS NOVAS DA fps-ff (era 2): ataque dos inimigos e ULTIMATE animada — medidas por script (qa_sheets.js); ainda NÃO estão no jogo nem aprovadas pelo dono na página
ATAQUE (12 quadros a 12 fps; chefe 14): pés estáveis: Goblin (e0) 242-246 (variação 4 px), Esqueleto (e1) 243-243 (0 px), chefe 242-242 (0 px). O último quadro volta à pose inicial nos três (diff último->primeiro 1.439 / 194 / 751, contra médias de 7.326 / 6.878 / 3.355 entre quadros).
- DEFEITO A1 [MÉDIO] Goblin (e0): 4 de 12 quadros encostam na borda DIREITA do quadro (direita = 383 em 384): o golpe é cortado pela moldura da folha. Chefe (boss): 4 de 14 quadros encostam na borda direita (447 em 448). Esqueleto (e1) não corta. Alargar o quadro (padRight) ou recuar o avanço.
- Maior salto entre quadros: Goblin 5->6 (28.104), Esqueleto 4->5 (22.566), chefe 6->7 (8.342): é o golpe (esperado); conferir de olho se não "pula" sem quadro intermediário.
ULTIMATE era 2 (Lâmina do Dragão): 49 quadros em grade 8x7 de 384x216 (tamanho confere), 4,1 s a 12 fps, loop=false, blend lighter, tela cheia. Animada de verdade: nenhum quadro parado (0 de 48 iguais ao anterior), cobertura visível sobe de 17% para 32% e some até 0,2% no fim (1 quadro praticamente vazio, o último).
- OBSERVAÇÃO: o 1º quadro já tem 16,8% de pixels visíveis (entra de repente, sem fade-in); conferir se é o impacto desejado.
- Tamanho do arquivo 2,3 MB só para uma era: com 7 eras ~16 MB; avaliar custo de carga no celular.
Falta: ver as folhas rodando NO jogo (EonScene/battle.js), encaixe com o slot e o tamanho (inimigo comum 110-120 px, chefe 180-200 px), e a aprovação do dono na página de arte.

## REMEDIÇÃO DAS FOLHAS DA fps-ff APÓS AS CORREÇÕES + FOLHAS NOVAS (era 2) — qa_sheets2.js; ainda NÃO no jogo
CORRIGIDO: golpe do Goblin e do chefe não encostam mais na borda (padRight 96: 0 quadros cortados nos dois; Esqueleto 0). Ultimate: arquivo de 2,3 MB para 525 KB; entrada e saída suaves confirmadas pelo alfa médio (6,0 -> 12,4 -> 18,8 -> 20,5 nos 4 primeiros quadros; cai a 0,0 no último), cobertura final 0,0%.
NOVAS (pés = linha mais baixa por quadro, em 256 px; borda = quadros encostando na moldura):
| folha | quadros | pés (variação) | borda | observação |
|---|---|---|---|---|
| e0 hurt | 12 | 241-242 (1) | 0 | ok |
| e1 hurt | 12 | 243-243 (0) | 0 | ok |
| chefe hurt | 12 | 234-242 (8) | 0 | DEFEITO B1: o chefe SOBE 8 px ao apanhar (pés fora da linha do chão, "pulo"), contra a regra "pés na linha, nada pula" |
| e0 die | 13 | 241-255 (14) | 0 | pés descem até 255 = o corpo cai e deita (aceitável); últimos quadros paradas; área final 17.389 contra 21.863 |
| e1 die | 13 | 243-255 (12) | 0 | idem |
| chefe die | 13 | 242-245 (3) | 0 | ok; área final 13.520 contra 19.234 |
| chefe run | 8 | 237-243 (6) | 0 | corrida do chefe: 6 px de subida de pé por passada, dentro do que se aceitou no Kael (5 px); loop ok (último->primeiro 1.941 contra médias de 3.387) |
| e0/e1/chefe attack | 12/12/14 | 242-246 / 243 / 242 | 0 | ok; e1 attack tem padRight 0 e largura 384 (os outros 480/544): inconsistência de moldura, sem corte medido |
Goblin corrida limpa: canto inferior direito do quadro 7 agora com 8 px opacos (a mancha foi removida, restam 8); pixels a mais de 120 px do corpo por quadro: 75, 13, 0, 0, 0, 0, 0, 177: nos quadros 0 e 7 há pontos longe do corpo (provavelmente a ponta da espada); conferir de olho no jogo.
RETESTE DA CORREÇÃO (fps-ff): B1 APROVADO: hurt do chefe com pés em 243-244 (variação 1 px, antes 8). Esqueleto (e1) attack agora 480x256 com padRight 96, igual aos outros, 0 quadros cortados. Goblin corrida: canto inferior direito do quadro 7 com 0 pixels (mancha removida); pixels longe do corpo no quadro 7 caíram de 177 para 73 (provável ponta da espada, ver no jogo).
Falta: ver tudo NO jogo, o último quadro do "die" some ou desvanece, e a aprovação do dono na página.

## RODADA OBRIGATÓRIA 2 — builds v0.5 e v0.6 (a versão mudou de v0.5 para v0.6 no meio da rodada; a versão aparece no carregamento, no título, em Configurações e no painel de debug)
Método igual ao da rodada 1 (iframe 390x844, debug stay=1, 7 a 12 s por era) + medidas de escala, margem e vizinhança. Chefes medidos com dbgSet(...,'boss'|'eb') (chefe sozinho), porque no modo imortal as escoltas nunca morrem e o chefe nunca entra. Sem erro de console.
APROVADO:
- Todos os 3 slots atacam em TODAS as 7 eras: maior intervalo 1,4 s (limite 2 s), 5 a 7 golpes por inimigo em 8 s. Máximo de 3 inimigos visíveis (2 na onda do chefe: escoltas).
- Chefe INTEIRO na tela, na metade direita, com margem direita de 24 a 57 px (mínimo exigido 8): eras 0 a 6 (centro x 237-242 de LW=330 = 280-290 px de 390). Senhor da Era (era 1) idem.
- Jogo normal: carrega, o herói corre entre ondas, 22 s jogando sem mortes e sem erro de console; carregamento mostra "Versão 0.6" e "Toque para continuar" (com o jogo parado por trás até o toque).
- Interface v0.6: AUTO, x1 e som empilhados na borda direita e ícone de Missões no canto esquerdo, como no protótipo.
REPROVADO / DEFEITOS (v0.5 e v0.6):
 V1 [ALTO] Os 3 comuns visíveis se sobrepõem MUITO: menor folga entre vizinhos = -63 px (era 0), -33 (era 1), -33 (era 2), -32 (era 3), -43 (era 4), -87 (era 5), -15 (era 6), em px lógicos (LW=330); na era 0 os três ficam empilhados e quase só se vê o da frente. O engenheiro declarou "se sobrepõem em parte", mas -63/-87 px é quase total.
 V2 [MÉDIO] Comum do 3º slot menor que 100 px: alturas em px de tela (x390/330): slot 1 = 110, slot 2 = 119, slot 3 = 89 (escala 0,9); na era 5 o drone fica em 100/119/81. Regra do PO: comum 110-120, nunca abaixo de 100.
 V3 [ALTO] Era 5: um comum passa 37,5 px lógicos da margem direita de 8 px (cortado pela borda da tela).
 V4 [MÉDIO] Pés dos comuns em linhas diferentes por slot: y = 410,5 / 406,6 / 415,2 (8,6 px lógicos, ~10 px de tela); regra: pés na MESMA linha. Os chefes têm outro y de referência (392,7); visualmente o chefe parece alinhado, mas a regra está sem número comparável (eY não é a sola).
 V5 [MÉDIO] Tamanho dos chefes abaixo da meta de 180-200 px: medido por e.dh x sc x 390/LW = 127-128 px nos 7 chefes (e ~142 px medido na imagem do Minotauro, que ficou do tamanho do herói de ~155 px). O engenheiro declarou 185 px e 147-170 nos que encolhem para caber; definir "px" (tela de 390) e conferir a medição.
 V6 [MÉDIO] Números de dano ainda cobrem o rótulo do chefe ("Senhor do Minotauro" com "137" por cima).
NÃO COBERTO: projétil do chefe de longe (Tanque) e fogo do Dragão com dano; chefe entrando andando com a escolta morta em jogo normal (o modo debug não mostra); patinação do Goblin e do Esqueleto em movimento; as 7 ultimates uma a uma; selo "+N"; som por ataque; troca de era e derrota com horda; jogo sem debug além de 22 s.

## TOLERÂNCIAS FINAIS DO PO (fps-98 e fps-c9; substituem as anteriores). Campo de referência 390x704, linha dos pés em y=549; "px" = px de TELA num campo de 390 de largura = e.dh x sc x 390/LW.
- HERÓI: caixa de 176 px em x=20..196, sprite ~160 px.
- COMUNS (3, em profundidade, z-order frente > meio > fundo): centros em x=240 / 300 / 350; sobreposição máxima de 40% da largura visível de cada um (se não couber, o do fundo encolhe até 95 px antes de sobrepor mais); altura mínima 95 px (drone incluído; voador conta o corpo); referência do protótipo ~92-100 / ~116 / ~92 px.
- PÉS: todos os comuns na mesma linha y=549 ±2 px (voador com a sombra nessa linha).
- CHEFE: slot próprio depois das escoltas, caixa x=190..382 (margem 8 px; se o largo não couber, pode começar em x=170); altura mínima 150 px na tela, alvo 180; pode encostar no herói.
- LIMITES: todo comum e chefe dentro de x=8..382.
- NÚMEROS DE DANO: acima da cabeça do alvo; nunca sobre o rótulo nem a barra do chefe (a partir de 10 px acima da barra).
- BOTÕES: nunca sobre personagem nem barra de vida, em todas as abas: AUTO, velocidade e música na coluna da direita no topo (y=110..260); habilidades no canto inferior direito abaixo da linha dos pés (y>=590); baú, missões e ranking na coluna da esquerda no topo (y=110..300).
RODADA 3 (a cobrir): ultimates animadas uma a uma (eras 0, 2 e 5 quando entrarem), selo "+N", som por ataque, troca de era, derrota com horda, projéteis dos chefes (Tanque, Dragão). A build v6 também liga balanceamento v6, loot, baú, nível com XP, pickups voando e invocação em ouro sem invocar skin: cobrir.
SOBRE "SOM OUVIDO": o QA é uma IA e NÃO consegue ouvir; só mede por script (ver seção de escuta). Alguém precisa escutar.

## Pendente (testar quando o engenheiro entregar V2)
- s2 a cada ~6 s, s3 pela barra de energia (enche ao bater/apanhar), multiplicadores ~3x e ~10x batendo com o contrato.
- Arma nunca sai da mão durante s2/s3, tela treme, câmera lenta curta, cor do FX por raridade, FX sem cobrir a barra de vida.
- Números de dano coerentes (crit, s2, s3), sem dano em inimigo morto, energia zera após ult.
- Áudio: destrava no 1º toque, respeita botão de som, pausa em aba oculta, sem som duplicado.
- Mobile 390x690 (test/m.html), botões de skill com área de toque >= 44px, 60 fps.
