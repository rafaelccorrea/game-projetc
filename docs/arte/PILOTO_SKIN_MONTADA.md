# Piloto da skin montada: Kael Ninja no Pônei (~18 créditos). Só o piloto; o dono valida antes das outras 69

Material pronto, custo 0 (`C:\Users\rafae\AppData\Local\Temp\tools\skinmount\pilot\`):
- `ref_kael_pony_{idle,run,attack,shoot}.mp4`: vídeos de referência de movimento feitos das folhas `_body` do Kael padrão no pônei (mkref: fundo verde, bastão magenta no grip, 12→24 fps, pausa no início e no fim);
- `ref_kael_pony_idle_q0.png`: 1º quadro (o enquadramento do guia);
- `ninja_idle_q0.png`: a roupa da skin Ninja (1º quadro da folha a pé).

## Passo 1: guia (G1), `nano_banana_pro` 1:1 1k, ~2
Refs: 1 = `ref_kael_pony_idle_q0.png`, 2 = `ninja_idle_q0.png`.
"Edit image 1: keep EXACTLY the same pony, pose, position, size, framing, saddle, stirrups, the magenta stick in the hand and the flat pure green background. Only change the rider's outfit to the ninja outfit of image 2: dark charcoal and purple ninja clothes, purple long scarf flowing behind, dark face mask over the mouth and nose, purple sash belt, dark boots, wrist guards. Same boy face, hair and proportions as image 1 (a child, fully clothed). No sword, no weapon other than the magenta stick, no new objects, no text, no shadow. Nothing on the green except the pony and the rider."
Gate G1: pônei idêntico (sobreposição com o q0), bastão magenta inteiro na mão direita, máscara e cachecol iguais aos da skin a pé, sem verde no corpo.

## Passo 2: 4 vídeos (G2), `seedance_2_0` fast, sem áudio, 4 s, ~4 cada = 16
start = end = guia; `VIDEO_REFERENCES` = `ref_kael_pony_<estado>.mp4`.
"The rider on the pony performs exactly the motion of the reference video, same camera, same framing, same timing; the pony moves exactly like the reference. Keep the ninja outfit, the mask and the magenta stick in the right hand on every frame. Flat pure green background, no shadow, no text, nothing else appears."
Estados: idle (12 q), run (8 q), attack (17 q), shoot (12 q, cols 6).

## Passo 3: pós-produção (custo 0, fora de assets/)
Método das montarias (kaiamount/kmset.js adaptado: polevid → loopsheet com o mesmo FIX/pads da folha padrão → grip por quadro → compose2 com era2_t1 para conferência).
- Saída: `skins/kael_ninja/mount/kael_pony_<estado>_body` (o caminho final e a chave `mountArt` são combinados com o Engenheiro antes de copiar).
- Conferência: sobreposição com a folha padrão (iou do pônei), grip em todos os quadros, pés no feetY, `gamecheck.js`.
- Depois: cópia para assets/ atrás da chave, print/vídeo curto para o voto do dono.

Refação: com 1-2 quadros do vídeo bruto como prova (regra de docs/FLUXO_ARTE.md). Teto do piloto: ~18 (+4 se um vídeo precisar ser refeito).
