# Agente 2 - Herói Kael (final)

## Entregue
- 21 sprites `assets/hero/era{0..6}_t{0..2}.png` (512x512, transparente, virado à direita, sem arma, punho direito fechado, cachecol vermelho em todos, pés em y≈95%).
- `assets/hero/anchors.json` com a mão direita (fração x,y da imagem 512x512, medida a olho após o recorte final; erro estimado ±0.02).
- Todos conferidos visualmente (sem halo visível).

## Método
- nano_banana_pro com a âncora era2_t0 como image_references (job 52be9306-bda0-4b52-bfa4-7d1eac43bfc4), fundo verde #00FF00.
- Fundo removido localmente (remove_background do Higgsfield bloqueado pelo limite de 8 jobs): script `C:\Users\rafae\AppData\Local\Temp\tools\key.js` (flood-fill dos cantos + despill, recorte, escala 512, pés em y≈95%).
- Primeiros T2 de era0/era1 saíram com aura que virava halo amarelo-esverdeado; regerados com "no outer glow/aura". Os T2 não têm aura externa, só brilho dourado no traje.

## Créditos
~2 créditos por imagem (nano_banana_pro). ~25 gerações (2 âncora + 2 T2 refeitos + 21) ≈ 50-55 créditos, bem abaixo do teto de 190. Saldo da conta ao final: 743,96 (compartilhado com outros agentes).

## Observações
- era5_t2 e era6_t1/t2 têm capacete/viseira de formas diferentes do prompt, mas coerentes com a era.
- era4_t2 tem engrenagens atrás do corpo; a ponta do cachecol fica parcialmente escondida.
- Disco do C: ficou cheio (0 MB livre) durante o trabalho; apaguei os brutos baixados após o processamento.
