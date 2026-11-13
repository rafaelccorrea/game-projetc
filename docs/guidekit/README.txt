GUIDE KIT: montarias novas com cavaleiro (Kael e Kaia), pronto para quando houver créditos do Higgsfield
=====================================================================================================
Montado em 13/11 sem gastar crédito. 9 montarias x 2 heróis = 18 guias e 54 vídeos.
Montarias: black_dragon, celestial_tiger, giant_scorpion, ice_wolf, infernal_horse, shadow_panther, war_mecha, war_raptor, war_unicorn
(a giant_phoenix já foi feita). Nomes = nomes da arte no jogo (B_MOUNT_ART em js/p_bag.js) = nomes das folhas em assets/anim/mounts/.

O QUE TEM AQUI
  <mount>\pre_kael.png, pre_kaia.png  layout 2048x2048 feito em código, no formato dos guias (fundo verde puro, vista lateral virada
                                      para a direita, chão em y~1990, cavaleiro do guia do grifo no mesmo tamanho, bastão MAGENTA na mão
                                      direita). Só serve de referência de ESCALA/ASSENTO para o nano_banana_pro; não é arte final.
  <mount>\prompt_kael.txt / prompt_kaia.txt   prompt exato + lista das 3 referências, na ordem (prompt_kaia tem a OPÇÃO B).
  <mount>\video_prompts.txt                   6 prompts do seedance_2_0 (parado/correndo/golpe x Kael/Kaia) + params.
  _overview.png        os 18 pré-guias, pequenos.
  checkguide.js        portão GRÁTIS: node checkguide.js <guia.png>  -> fundo, chão, margens, bastão; avisa se há magenta fora do bastão.
                       node checkguide.js <guia.png> --violet <saida.png>  -> pinta de azul-violeta o magenta que NÃO é o bastão.
  pre.js / mounts.json / cutrider.js / overview.js / mkprompts.js / layout.json   como refazer os layouts (assento medido à mão em
                       mounts.json; cavaleiro cortado de mount\gr_guide.png e assets\hero\guides\kaia_griffin_guide.png).

ORDEM (uma montaria por vez; um processo pesado por vez; sem Chrome)
  0. balance. Precisa de ~34 por montaria (ver custo). Anotar TUDO em tools\kaiamount\jobs.txt NA HORA (upload, job id, url).
  1. Upload (media_upload -> PUT -> media_confirm) de: pre_kael.png, pre_kaia.png, <mount>_ref.png. Os 2 rider refs (gr_guide.png,
     kaia_griffin_guide.png) só uma vez para todas as montarias; testar antes se os ids antigos ainda valem (ver prompt_*.txt).
  2. Guia do Kael: generate_image nano_banana_pro 1:1 2k com AS 3 medias (image_references) + PROMPT de prompt_kael.txt.
     CONFERIR que "medias" não está vazio antes de mandar.
  3. Baixar, rodar checkguide.js (sem avisos) e olhar: 1 sela só, debaixo do cavaleiro; nada flutuando; bastão inteiro na mão
     direita, sem cruzar o rosto; rosto sério de criança; nada sensual. Se falhar em detalhe, conserto "Edit this image with minimal
     changes" (1 imagem, ~2) como na fênix; se falhar feio, repetir o passo 2.
  4. Guia da Kaia: OPÇÃO B de prompt_kaia.txt (troca menino->menina no guia aprovado do Kael; foi o que deu certo na fênix e garante a
     mesma pose da montaria). A OPÇÃO A (pre_kaia) é reserva. Conferir como no passo 3.
  5. Salvar em assets\hero\guides\kael_<mount>_guide.png e kaia_<mount>_guide.png (commit só dos próprios arquivos, caminho explícito).
  6. Vídeos: 6 x generate_video seedance_2_0 fast 480p 4s 1:1, start_image = end_image = guia, prompts de video_prompts.txt.
     Baixar as urls logo que ficarem prontas (anotar url em jobs.txt).
  7. Folhas (um vídeo por vez, como na fênix; em tools\):
       Kael: KEEP=1 node mountset.js <mount> <st> <url>;      bash kaiamount/postgen.sh kael <mount> <st>
       Kaia: KEEP=1 node kaiamount/kmset.js <mount> <st> <url>; bash kaiamount/postgen.sh kaia <mount> <st>
       golpe: se aparecer faísca, node kaiamount/spark.js <body.png> <quadros>; setgrip últimos quadros @24; kmrecompose.
       fim: node kaiamount/conf.js <mount>  -> assets/anim/mounts/_conferencia_<mount>.png para aprovação.
  Ordem sugerida das montarias (das mais fáceis às mais arriscadas): ice_wolf, infernal_horse, war_unicorn, celestial_tiger,
  war_raptor, war_mecha, giant_scorpion, shadow_panther, black_dragon.

CUSTO ESTIMADO
  Por montaria: 2 guias x ~2 + 6 vídeos x ~4 = ~28; +20% de refação = ~34.
  9 montarias: ~252 sem refação, ~300 com folga. Upload não gasta crédito.
  Conferir o preço real com o primeiro job (nano_banana_pro 2k e seedance fast 480p 4s) antes de seguir em lote.

ARMADILHAS (já aconteceram ou estão à vista)
  - Pedido sem as imagens de referência: aconteceu na fênix (gasto à toa). Sempre 3 medias no guia A, 2 no B, start+end no vídeo.
  - Sela vazia a mais (fênix: sela no pescoço + cavaleiro atrás). O ref da montaria já tem sela; o prompt pede "only ONE saddle".
    Mais arriscados: black_dragon (sela alta, na base do pescoço) e war_raptor (sela inclinada).
  - MAGENTA FORA DO BASTÃO: black_dragon e shadow_panther têm chamas/fumaça roxo-rosa. No ref, 91 mil e 71 mil px caem no
    classificador do bastão (isMagC do polevid.js). O polevid apagaria as chamas e erraria a reta do bastão. O prompt pede chamas
    azul-violeta; se mesmo assim vier rosa, checkguide.js avisa: refazer, ou usar --violet no guia antes do vídeo (as chamas do vídeo
    saem azul-violeta; dá para devolver o tom nas folhas depois).
  - Golpe de cima para baixo riscou o rosto (lobo v1/v2, grifo v1). Usar só a estocada dos video_prompts (pole below the chin).
  - Tigre virando a cabeça para a câmera no parado (mythic v1): todos os "parados" pedem cabeça de perfil.
  - Coisas soltas no ar (brasas, faíscas, brilho do chifre do unicórnio, névoa do lobo de gelo, estrelas das asas do tigre):
    "nada flutua" reprova. Os prompts proíbem; conferir no guia e no vídeo; spark.js limpa faísca no golpe.
  - Asas (dragão, tigre): erguidas ATRÁS do cavaleiro, nunca cobrindo. Na corrida batem as asas como a fênix.
  - Escorpião: cauda/ferrão atrás e acima do cavaleiro, nunca na frente do rosto; 8 patas no chão; corrida = andar rápido de 8 patas.
  - Mecha: tem banco com encosto (não é sela) e um para-brisa logo à frente; o prompt manda sentar NO banco e manter o vidro baixo.
  - Patas encostando na borda de baixo: o chão alvo é y~1990 (fênix encostou em 2045 e passou, mas é melhor ter margem).
  - Cavaleiro: só o corpo padrão (garoto/menina de ~10 anos), nunca versão adulta, nunca sensual; rosto sério de guerreiro.
  - PC: um processo pesado por vez; mp4 e quadros são apagados pelos scripts; parar se o dono avisar 80% de uso.
