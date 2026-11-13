# Arte: custo por item (Higgsfield e Kling grátis)

Ligado a: `docs/FLUXO_ARTE.md` (ordem de custo e portões), manuais `docs/arte/MANUAL_*.md`.
Escrito em 14/11/2026.

## De onde saem os números
- **A API de transações do Higgsfield NÃO estava disponível.** Não há preço cobrado por job anotado. Os números saem de duas fontes:
  - **contagem de jobs** nos registros: `C:\Users\rafae\AppData\Local\Temp\tools\skin\jobs.txt`, `kaiaskin\jobs.txt`, `kaiamount\jobs.txt`, `kaiagirl\jobs.txt`, `bow\jobs.txt`, `petvid\queue.txt` e `jobs2.txt`, `newpets\RESUME.txt`, `LEIA_gratis.txt`;
  - **preço por unidade** dos commits e documentos: seedance_2_0 fast 480p 4 s ≈ 4 (docs/FLUXO_ARTE.md §3, docs/ARTE_MATRIZ.md "4/vídeo"), nano_banana_pro ≈ 1-2 (usei **2**, o teto), kit das montarias ≈ 28 sem refação / 34 com refação (docs/guidekit/README.txt, f7c4dd7), ícones das eras 7-8 ≈ 4 (8c2528c).
- **"medido"** = quantidade de imagens/vídeos CONTADA nos registros. **"estimado"** = sem registro do item; conta pelo método.
- Os créditos são sempre quantidade × preço unitário: o preço por job em si não foi medido. O primeiro job de cada lote confirma o preço (regra do FLUXO_ARTE §3).
- `IP_DETECTED` não cobra (5 casos nas skins da Kaia, 1 na Kaia menina): não entra na conta.

Preços unitários usados:
| unidade | Higgsfield | Kling grátis |
|---|---|---|
| imagem (guia, referência) | nano_banana_pro ≈ 1-2 (conta com 2) | Google AI Studio "Nano Banana 2 Lite": 0 |
| vídeo de laço (parado, correr) | seedance_2_0 ≈ 4 | Kling 2.5 Turbo, 5 s, início + fim: **25** |
| vídeo sem laço (golpe, giro, morte, tiro, ultimate) | seedance_2_0 ≈ 4 | Kling 4.0 Flash, 3 s, só início: **18** |
| limite grátis | — | **66 por dia** (3 Flash, ou 2 Turbo, ou 1 Turbo + 2 Flash) |

## CUSTO_POR_ITEM

| Item | Contado (imagens + vídeos) | Higgsfield sem refação | +20% refação | Kling grátis (dias) | Notas |
|---|---|---|---|---|---|
| Arma comum (1 família × 1 raridade × 1 era) | 1 imagem (arma), ícone por código | **2** | **3** | 0 (só imagem no AI Studio) | **estimado**: as armas das eras saíram em lote (`erarefs.js`, uma imagem com as armas da era); o ícone é recorte (`icongen.js`). Grip/ângulo no meta.json por código |
| Arma Lendária (com ultimate em 3 níveis) | 1 imagem + 1 vídeo de ultimate própria (`<família>_legend`); se a família for nova, +1 vídeo da ultimate base | **6** (família existente) a **10** (família nova) | **8 a 12** | 1 dia (1-2 Flash = 18-36) | **medido** no arco/bumerangue (bow/jobs.txt): 2 ultimates por família, 1 refeita em 4 (25%). Mítico = reforço por código (`ultboost.js`), Básico-Épico usam a folha base da era: 0. Formato 16:9 no Kling: **a confirmar** |
| Skin a pé completa (8 estados + guias + avatar) | 3 imagens (guia com bastão, guia com pistola, guia sem bastão) + 8 vídeos | **38** | **46** | 3 dias (4 Turbo + 4 Flash = 172) | **medido** em 10 skins: Kael 6 skins = 22 imagens + 55 vídeos; Kaia 4 skins = 12 imagens + 33 vídeos. Média por skin **3,4 imagens + 8,8 vídeos ≈ 42** (refação real ≈ 10% nos vídeos, 13% nas imagens). Avatar por código. **Regra nova (vídeo do herói padrão como base): modelo e preço a confirmar** |
| + skin montada, por montaria (só com OK do dono) | 1 guia + 3 vídeos | **14** | **17** | 2 dias (2 Turbo + 1 Flash = 68 > 66) | **estimado**; bate com docs/DECISOES_DONO.md (196 = 2 skins × 7 montarias × 14; 56 = 2 × 2 × 14) |
| Montaria (Kael + Kaia × parado/correr/golpe + 2 guias + imagem parada) | 3 imagens (guia Kael, guia Kaia opção B, montaria sozinha) + 6 vídeos | **30** | **36** | 3 dias (4 Turbo + 2 Flash = 136) | **medido**: Fênix gigante = 3 imagens (1 conserto) + ref + 6 vídeos ≈ 32; Kaia nas 6 montarias = 6 guias + 22 vídeos (4 refeitos em 18 = 22%). Kit: 28/34 |
| Pet (3 estágios × parado/correr/golpe1 + golpes 2 e 3 do básico + imagens dos estágios) | 3 imagens (básico, médio, evoluído) + 11 vídeos | **50** | **60** | 5 dias (6 Turbo + 5 Flash = 240) | **medido** em petvid/queue.txt (básico: 5 vídeos) e jobs2.txt (médio e evoluído: 3 cada). Pets novos (Pantera, Falcão, Lobo) sem golpes 2-3: 3 + 9 = **42** / 50 / 4 dias. Imagens paradas e versões encolhidas (`pad.js`): código, 0 |
| Asa (referência + recorte) | 1 imagem | **2** | **3** (Serafim: 3 imagens = 6) | 0 | **medido**: 8 asas = 8 referências (fd93c0e); Serafim refeito com 2 imagens a mais (5fc3f0b). Recorte, batida e morte por código |
| Lote de ícones (grade 2×2, 4 ícones) | 1 imagem | **2** | **3** | 0 | **medido** no kit icons78 (2 imagens = ~4 para 6 ícones; ~6 com 1 refação) |

## Estimativa anterior × medido

O PO tinha passado ao dono: montaria ~45, skin ~40, pet ~50, arma 2-12, asa 2-6.

| Item | Antes (PO) | Medido / recalculado (sem refação → com +20%) | Diferença |
|---|---|---|---|
| Montaria | ~45 | 30 → 36 (média real com refação ~32-35) | **mais barata** (~-10) |
| Skin a pé | ~40 | 38 → 46 (média real 42) | confere |
| Pet | ~50 | 50 → 60 (42 → 50 sem golpes 2-3) | confere; pet novo sai mais barato |
| Arma | 2-12 | comum 2-3; Lendária 6-12 | confere |
| Asa | 2-6 | 2-3 (6 só se refazer como o Serafim) | confere |

Notas:
- Os números do Kling são créditos grátis, não dinheiro: o custo real é o **tempo** (dias de fila) e o risco de laço sem quadro final (Flash).
- Toda conta acima assume 1 job de teste confirmando o preço antes do lote. Se o preço medido do primeiro job for diferente, refazer esta tabela e avisar o PO.

## Atenção ao custo do seedance_2_0 (medido em 14/11)
- Sempre com `mode: "fast"` e `generate_audio: false`: 480p, 4 s = **4 créditos**. Sem esses dois parâmetros, o MESMO vídeo custa **12**.
- O seedance_2_0 aceita `VIDEO_REFERENCES` (vídeo de referência de movimento) junto com quadro inicial = final. Esse é o caminho barato para "skin nova a partir do vídeo do padrão": monte a referência da folha padrão com `node C:\Users\rafae\AppData\Local\Temp\tools\motionref\mkref.js <hyb/R ou hyb/kaia>/<herói>_<estado>_body <saída.mp4>` (custo 0: fundo verde, bastão magenta no grip, pausa no início e no fim).
- O motion transfer dedicado (`hf_mult_motion_control`) custa **28 por vídeo**: não usar no lote.
