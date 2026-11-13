# Fluxo de arte: como gerar sem desperdício e sem gerar o que não pode

Pedido do dono (14/11/2026): "monte um fluxo bem definido para o design de como ele tem que definir as gerações, maximizar custos das gerações, não gerar o que não pode", "skins não devem vir com asas definidas", "definir fluxo natural pet e evoluções, montarias etc."

Vale para TODA geração (Higgsfield, Google AI Studio, Kling grátis ou outra). Quem gera: Arte (fps-75) e o fluxo grátis (rafae-47). O PO libera cada item.
Regras irmãs: docs/ARTE_PRONTO.md (o que é item pronto), docs/ARTE_MATRIZ.md (situação de cada item), docs/guidekit/README.txt (passo a passo técnico das montarias). Manuais passo a passo por tipo: `docs/arte/` (ver seção 5); custo medido por item: [docs/arte/CUSTO_POR_ITEM.md](arte/CUSTO_POR_ITEM.md).

---

## 1. Antes de gerar QUALQUER coisa (portão 0, sem custo)

Só se gera se TODAS as respostas forem "sim":

1. **O item está aberto na matriz?** Um item por vez até 100%. Nada fora do item aberto.
2. **Já existe no disco?** Procurar em `assets/`, `docs/proto/v2/a/`, `_fontes_arte`, jobs antigos do Higgsfield (`C:\Users\rafae\AppData\Local\Temp\tools\kaiamount\jobs.txt` e os jobs.txt de `skin\`, `kaiaskin\`, `bow\`, `petvid\`; a pasta `tools` fica fora do repositório). Vídeo já pago se baixa, não se gera de novo.
3. **Dá para fazer por código?** Recorte, troca de cor, espelhar, grip/âncora no json, aura, brilho, partículas, prévia, ícone por recorte, versão sem arma (folhas `_body` + arma no grip). Se sim, é código, não geração.
4. **O jogo vai mostrar isso?** Conferir no código onde é lido (arquivo:linha). Se nenhuma tela/batalha lê, não se gera.
5. **Respeita a lista do que NÃO pode (seção 2)?**
6. **Tem guia aprovado** (imagem-base) e referências certas na ordem certa? Vídeo sem guia aprovado não sai.
7. **Custo anotado** no plano do item (estimado) e cabe no saldo/limite do dia.

## 2. O que NÃO pode ser gerado (reprova antes de gastar)

- **Skin com asa, capa-asa ou qualquer apêndice de asa desenhado no corpo.** Asa é item separado (desenhada por código nas costas). Skin = só roupa/corpo. (A Kael Anjo antiga tinha asa no corpo; a versão sem asa é a que vale.)
- **Arma desenhada na folha do herói** (montado ou a pé). O herói é gerado com o **bastão-guia magenta** e a arma real entra por código no grip. Arma pintada trava a troca de arma.
- **Corpo fora do padrão:** só o garoto (Kael) e a menina (Kaia), semi-chibi, ~10 anos. Nunca adulto, nunca versão "crescida".
- **Nada sensual, nunca** (jogo com menores). Roupa e pose sempre de guerreiro; rosto sério.
- **Nada flutuando:** brasas, faíscas, estrelas, névoa, brilho solto, sela vazia a mais. Efeito é por código.
- **Cor magenta/rosa fora do bastão** (atrapalha o recorte). Chamas roxas viram azul-violeta no pedido.
- **Câmera fora do padrão:** vista lateral virada para a direita, chão no mesmo lugar, fundo verde puro.
- **Coisa nova antes de fechar o que existe** (montaria, pet, skin novos).
- **Sorteio pago** ou item que só sai pagando com chance (regra do jogo).

## 3. Ordem de custo (sempre do mais barato para o mais caro)

1. **Código** (0): recorte, âncora, aura, cor, prévia, ícone por recorte.
2. **Reaproveitar** (0): vídeo/folha já pago, guia aprovado de outro herói (troca menino → menina, "opção B").
3. **Fluxo grátis** (0): Google AI Studio (imagem-guia) + Kling grátis (~3 vídeos/dia). Usar quando o laço não precisa de quadro final perfeito ou quando a Arte valida o laço.
   - *Correção técnica (Arte, 14/11):* o Kling dá 66 créditos grátis por dia: 4.0 Flash (3 s, 720p, só quadro inicial) = 18, então 3 por dia; 2.5 Turbo (5 s, quadro inicial **e** final) = 25, então 2 por dia. Com o Turbo o grátis também faz laço com início = fim; o Flash serve para golpe, giro e morte. Detalhes em `docs/arte/VALIDACAO_COMUM.md` §2.
4. **Higgsfield** (crédito): só o que o grátis não alcança com a mesma qualidade (laço com quadro inicial = final, cena difícil).
   - Imagem-guia: ~2. Conserto "edit with minimal changes": ~2. Vídeo seedance fast 480p 4s: ~4.
   - Sempre **1 job de teste** para confirmar o preço antes de mandar em lote.
5. **Refação**: orçar +20%; se a 2ª tentativa falhar, parar e trazer ao PO antes da 3ª.

## 4. Portões durante a geração (cada um barra o próximo gasto)

| Portão | Quando | Como | Se falhar |
|---|---|---|---|
| G1 guia | depois da imagem-guia | `node docs/guidekit/checkguide.js <guia>` sem avisos + olho: 1 sela, nada flutua, bastão inteiro na mão direita sem cruzar o rosto, sem asa no corpo, criança, sério | conserto barato (~2) ou refazer guia; **nunca** vídeo |
| G2 vídeo | antes de processar | pedido com start_image = end_image = guia (laço); 1 vídeo por vez (no Kling: laço só no 2.5 Turbo; o 4.0 Flash aceita só o quadro inicial) | refazer só o estado que falhou |
| G3 folha | depois do processamento | laço achado, mão no bastão em 100% dos quadros, pés no chão | ajustar no código; refazer vídeo só se o código não salvar |
| G4 testes | antes do commit | stagekit, sheetcss, sheetgrid sem falha | corrigir antes de subir |
| G5 tela | depois de ligado | QA confere na tela e registra ✓ na matriz | volta ao portão que falhou |

Anotar cada job (id, url, custo) na hora em `tools/kaiamount/jobs.txt` (ou no LEIA.txt do fluxo grátis). Job não anotado = risco de pagar duas vezes.

## 5. Fluxo natural por tipo

**Manuais passo a passo** (comandos, modelos, prompts, validação e qualidade, entrega ao QA): [skin](arte/MANUAL_skin.md) · [pet](arte/MANUAL_pet.md) · [montaria](arte/MANUAL_montaria.md) · [arma](arte/MANUAL_arma.md) · [asa](arte/MANUAL_asa.md) · [ícone](arte/MANUAL_icone.md) · base comum [VALIDACAO_COMUM](arte/VALIDACAO_COMUM.md) · [custo por item](arte/CUSTO_POR_ITEM.md) · [modelo de item para a matriz](arte/MODELO_ITEM.md).

### Skin (Kael ou Kaia)
Manual: [docs/arte/MANUAL_skin.md](arte/MANUAL_skin.md). Regra nova (PO + dono, 14/11): cada estado da skin nova sai **do vídeo do herói padrão** (mesma coreografia, só a roupa muda); vídeo livre por skin não pode. Tolerância: grip ≤ 4 px e ≤ 8°, pés ≤ 3 px, costas ≤ 4 px.
**Padrão de movimentos e de armas (regra do dono: "skins, com padrões de movimentos e armas"):** toda skin é a MESMA animação do herói padrão, só com outra roupa. Mesmos estados, mesmo número de quadros, mesmo ritmo (fps), mesma pose em cada quadro, mesmo chão, mesmas âncoras (grip, costas, pescoço). Nenhuma skin ganha golpe, pose ou movimento próprio. Por isso toda arma do jogo (corpo a corpo, pistola, arco, bumerangue, ultimates) funciona em qualquer skin sem arte nova. Gerar a skin a partir dos vídeos/guia do herói padrão (troca de roupa), nunca do zero. Portão extra: comparar quadro a quadro com a folha do herói padrão. Tolerância: punho ≤4 px e ≤8°, pés ≤3 px, âncora das costas ≤4 px, mesmo número de quadros por estado. Fora disso, reprova. Skin nova se gera a partir do VÍDEO do herói padrão (mesma coreografia, só troca a roupa), nunca de um vídeo livre.
1. Guia do corpo **sem asa e sem arma** (bastão magenta), no mesmo corpo padrão e mesmas âncoras.
2. A pé: parado, correr, golpe, giro, morte; pistola parado/correr/tiro (arco e bumerangue por código).
3. Grip e linha do pescoço no json de cada quadro (arma por cima do punho, nunca do rosto).
4. Montado: por padrão o jogo usa o corpo montado padrão (paliativo aprovado: troca de cabeça por código). Folha montada própria só com OK do dono.
5. Avatar, ícone de loja, prévia (código). Asa vem do item asa, nunca da skin.

### Pet (3 estágios: básico → médio → evoluído)
Manual: [docs/arte/MANUAL_pet.md](arte/MANUAL_pet.md).
1. Guia do **básico**; o médio e o evoluído são gerados **a partir do guia anterior** (mesmo bicho, maior e mais forte), para a evolução ser reconhecível.
2. Por estágio: parado, correr, golpe (o jogo usa 1 golpe na batalha; golpes extras só se a tela os mostrar).
3. Imagem parada por estágio (recorte por código): miniatura, ovo, evolução, Códex.
4. Aura por estágio **por código** (nenhuma no básico, leve no médio, forte no evoluído) e efeito de evolução (fx `evolve_0_1`, `evolve_1_2`) por código.
5. Golpe próprio (tipo/cor do módulo) por código.
6. Sempre na frente do herói, pés no chão (voador na altura do módulo).

### Montaria
Manual: [docs/arte/MANUAL_montaria.md](arte/MANUAL_montaria.md).
1. Imagem da montaria sozinha (referência, Códex, Derrota) uma vez.
2. Guia com o **Kael** no assento (bastão magenta, 1 sela só); Kaia pelo guia do Kael (opção B).
3. Por herói: parado, correr, golpe (3 vídeos com laço). Folha `_body` (sem arma) é a que o jogo usa; a arma entra no grip.
4. Asa nas costas montado (âncora `back`), aura por estrela 1-7 (código, `MOUNT_AURA`; 7★ aprovado pelo dono e as cores 6-7 já estão no código (2b06361); hoje o jogo para em 5★ (`maxStars:5`, js/sys/mount.js:13) até ligar `setStars7` com o pacote das últimas eras), ícone.
5. Ligar no MOUNT_TBL, MOUNT_REF, manifest e todas as telas.

### Arma (família × raridade × era)
Manual: [docs/arte/MANUAL_arma.md](arte/MANUAL_arma.md).
1. Ícone + imagem na mão com grip (*correção técnica: o jogo lê `assets/weapons/<chave>.png` + `grip/angle/len` em `assets/weapons/meta.json`; `wh_<chave>.png` é só a cópia recortada dos protótipos em `docs/proto/v2/a/`*).
2. Conferir na mão do Kael e da Kaia, todas as skins, a pé e montado (código).
3. Ultimate própria só na Lendária; Mítica por código; aura da Forja por código.

### Asa
Manual: [docs/arte/MANUAL_asa.md](arte/MANUAL_asa.md).
1. Asa sozinha, simétrica, L/R recortadas (código), batida por código.
2. Conferir em todas as skins, montado e na morte (âncora das costas).

### Ícone
Manual: [docs/arte/MANUAL_icone.md](arte/MANUAL_icone.md).
Gerar em lote do mesmo item (ex.: 4 medalhões por era numa imagem só) para pagar 1 vez; recorte por código.

## 6. Quem decide o quê
- **PO:** abre o item, aprova o plano de custo, libera Higgsfield acima de ~10 créditos por item.
- **Arte:** guia, portões G1-G4, processamento, matriz.
- **rafae-47 (grátis):** gera no item aberto, com o kit da Arte.
- **Engenheiro:** liga no código. **QA:** portão G5. **Dono:** vota no que é visual novo.
