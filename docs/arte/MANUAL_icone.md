# Manual: ÍCONE (golpes, peças, itens), passo a passo

Antes: `docs/arte/VALIDACAO_COMUM.md` (§1: copiar `C:\Users\rafae\AppData\Local\Temp\tools`, ÚNICA cópia das ferramentas, fora do repositório), `docs/FLUXO_ARTE.md` §5 (Ícone), o kit `docs/guidekit/icons78/README.txt` (eras 7 e 8, pronto) e custo em `docs/arte/CUSTO_POR_ITEM.md` (~2 por grade de 4; grátis 0).

## Regras
- **Primeiro tentar por código/recorte** (ícone de arma, de pet por estágio, de asa, de montaria: recorte da arte que já existe com `icongen.js`). Só se gera o que não existe em nenhuma arte.
- Gerar **em lote**: grade **2×2** numa imagem só (paga 1 vez), fundo verde liso, vãos verdes largos. A 4ª célula é reserva/variação.
- Sem texto, sem personagem, sem rosto, nada sensual, legível em 64 px, mesmo contorno e aro dos irmãos.

## O que sai
| tipo | arquivo | formato |
|---|---|---|
| golpes da era | `assets/icons/era<N>_s1.png` (golpe básico, aro PRATA), `_s2` (habilidade, aro AZUL), `_s3` (ultimate, aro DOURADO) | 256×256 transparente, item em ~232 |
| peças por era | `assets/icons/slots/era<N>_<weapon|vest|helmet|gloves|boots|necklace|wings>.png` | 256×256 |
| arma / montaria / asa / pet | `assets/icons/weapons/<chave>.png`, `icons/mounts/<id>.png`, `icons/wings/<nome>.png`, `icons/pets/` | 256×256 |
Quem lê os de golpe: js/fullbattle.js:352; a chave das eras 7-8 (`ERA9_KEY`, js/eras9.js) só liga com os 6 arquivos.

---

## Passos

### Passo 0. G0 (custo 0)
Existe arte de onde recortar? Já há ícone no disco (`assets/icons/_aprovado_original`)? Lote fechado (4 ícones do mesmo item/era)?

### Passo 1. Referências (custo 0)
Estilo: uma folha com os ícones aprovados do mesmo tipo (ex.: `ref_estilo_eras0-6.png` do kit icons78) + a arte do assunto (ex.: `ref_armas_era7-8.png`). Higgsfield: subir as duas (`media_upload` → `node put1.js <arquivo> '<url>'` → `media_confirm`). **Nunca mandar sem as referências.**

### Passo 2. Grade 2×2 (G1)
**Grátis:** AI Studio Nano Banana 2 Lite, 1K (+ `node dewm.js <in> <out> C:/Users/rafae/AppData/Local/Temp/tools`: a ✦ cai no canto da 4ª célula, conferir que não pega o medalhão). **Higgsfield:** `nano_banana_pro`, 1:1, `"2k"` (2048, como o kit), `medias` = as 2 referências (~2).
Prompt (modelo; os pedidos completos das eras 7 e 8 estão em `docs/guidekit/icons78/README.txt`):
```
Game UI <tipo> icons, 2x2 grid of four separate round medallion icons on a flat pure green (#00FF00) background with wide green gaps
between them, matching EXACTLY the style of the first reference image (thick metallic ring, bold dark outline, painted chibi-RPG mobile
game style, centered subject, no text). <tema>, <assunto> from the second reference.
Top-left: <ícone 1>. Top-right: <ícone 2>. Bottom-left: <ícone 3>. Bottom-right: <reserva/variação do ícone 1>.
No characters, no faces, no text, no frames other than the round medallions. No green inside the icons. No magenta or pink.
```
Gate G1: 4 medalhões separados por vão verde dos dois lados; sem verde dentro do ícone; legível reduzido.

### Passo 3. Recorte (custo 0)
De `C:\Users\rafae\AppData\Local\Temp\tools`:
- 2×2: `node icn/split4.js <grade.png> <prefixo> s1,s2,s3,s1b` (ordem sup-esq, sup-dir, inf-esq, inf-dir; acha os vãos, tira o verde, normaliza 256 com o item em 232) → conferir e renomear para `C:/Users/rafae/Desktop/fps/assets/icons/era<N>_s<k>.png`.
- 2 lado a lado: `node icn/split2.js <img.png> <saida_t1.png> <saida_t2.png>`; 1 item: `node icn/cut.js <in.png> <out.png>`.
- Linha de 7 peças (slots): `node iconsplit2.js <folha.png> <era>` (`OUT=` pasta, `NAMES=` nomes; itens encostados: `iconsplit_valley.js`).
- Ícone de arte existente (arma, pet, montaria, asa): `node icongen.js <arte.png> <saida.png> 256 6 0.84`.
- Prévia por raridade de peças: `node icn/tiercs.js <era> <pasta t1/t2> <saida.png>`.

---

## VALIDAÇÃO E QUALIDADE
| Critério | Tolerância | Como provar |
|---|---|---|
| Laço sem salto | não se aplica (imagem parada) | — |
| Mão no grip / pés no chão | não se aplica | — |
| Tamanho e escala iguais aos irmãos | 256×256; item com lado maior 232 ± 4 px; aro com a mesma espessura dos irmãos ± 2 px | `split4.js` normaliza; conferir lado a lado: `node newpets/cs.js <saida.png> 256 era6_s1.png era6_s2.png era6_s3.png <novos...>` |
| Legível em 64 px | assunto e cor do aro reconhecíveis | `node newpets/cs.js <saida.png> 64 <ícones...>` e olhar |
| Sem borrão | semitransparente interno ≤ 30 px | `node artcheck.js px <ícone.png>` |
| Sem cor fora da paleta | ≤ 0,5% (a calibrar) contra a referência de estilo + assunto | `node artcheck.js pal <ícone.png> <grade_aprovada.png> 0.5` |
| Contorno sem franja verde | verde ≤ 20 px | `node artcheck.js px <ícone.png>` |
| Nada flutua | só o que está dentro do medalhão (brilhos do aro dourado do s3 são do estilo aprovado) | olho |
| Sem personagem, rosto, texto; nada sensual | 0 | olho |
| Fundo transparente | cantos com alfa 0 | `artcheck px` + abrir sobre fundo escuro |

**Folha de conferência:** `node newpets/cs.js C:/Users/rafae/Desktop/fps/assets/icons/_conferencia_<lote>.png 256 <ícones do lote> <3 irmãos aprovados>` (nome sugerido).

**Reprova na hora:** texto no ícone; verde no contorno; aro de cor errada (s1 prata, s2 azul, s3 dourado); personagem ou rosto; ilegível em 64 px; gerado sem as referências.

**G5:** mandar ao QA: `Ícones <lote> · <hash> · assets/icons/<arquivos> · telas onde aparecem (Batalha: botões de golpe js/fullbattle.js:352; Equipamento; Loja)`. Ícones das eras 7-8 só aparecem com `&eras9=1`. Roteiro geral: `docs/qa/VALIDAR_ARTE.md` §3.
