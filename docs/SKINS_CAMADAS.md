# Skins de roupa em CAMADAS (decisão do dono, 12/11)

Não há skin animada de corpo inteiro por enquanto. Cada uma das 38 roupas-skin (a00…a64 + p10/p20/p30 do passe) é uma **combinação de camadas
que já existem**: tinta de colete e de botas (máscaras R/B de cada fase), chapéu da era, óculos/máscara e aura nas Lendárias.
Vale nas 4 fases × Kael/Kaia porque as camadas usam as máscaras e âncoras POR FASE.

- **Fonte da verdade: `Sys.appearance.comboOf(id)` e `Sys.appearance.MATERIALS` (js/sys/appearance.js, da fps-69).** Esta página só registra a
  tabela como a fps-69 definiu + as notas de cor da Arte (fps-75). Não existe `skins_layers.json` (descartado: o Sys é a fonte).
- Regra por raridade (colete/botas): Básico couro/couro · Raro couro_escuro/couro + chapéu da era · Épico bronze/couro_escuro (+ óculos nas eras 4-6) ·
  Mítico ferro/ferro · Lendário ouro/ouro + aura10. Sabor de era: Futurista Mítico/Lendário colete cristal; Moderna Mítico botas obsidiana; Antiguidade Lendário botas bronze.
- Tinta: `cor = luminância/128 × [R,G,B] × ganho`, misturada pela força do canal (R = colete, B = botas) — docs/ARTE_LIGAR.md §7.
- Peças: chapéus `assets/anim/equip/hats/hat_eraN.png` (+ hats.json), óculos/máscara `assets/anim/equip/cos/` (+ cos.json), auras `assets/anim/aura/`.
  Todas as peças que o comboOf aponta EXISTEM (conferido): nenhuma peça nova foi gerada, nenhum crédito.

## Tabela (comboOf, 12/11)

| id | nome (item) | raridade | colete | botas | chapéu | óculos | máscara | aura |
|---|---|---|---|---|---|---|---|---|
| a00 | Pele Suja (Pele de Coelho) | Básico | couro | couro | — | — | — | — |
| a01 | Pele Parda (Pele de Lobo) | Raro | couro_escuro | couro | era0 | — | — | — |
| a02 | Couro Tribal (Couro de Urso) | Épico | bronze | couro_escuro | era0 | — | — | — |
| a03 | Pelagem Branca (Pele de Mamute) | Mítico | ferro | ferro | era0 | — | — | — |
| a04 | Manto do Chefe (Manto do Xamã) | Lendário | ouro | ouro | era0 | — | — | aura10 |
| a10 | Linho Cru (Túnica de Linho) | Básico | couro | couro | — | — | — | — |
| a11 | Couro Romano (Couraça de Couro) | Raro | couro_escuro | couro | era1 | — | — | — |
| a12 | Bronze Grego (Peitoral de Bronze) | Épico | bronze | couro_escuro | era1 | — | — | — |
| a13 | Púrpura Imperial (Armadura Hoplita) | Mítico | ferro | ferro | era1 | — | — | — |
| a14 | Manto Olímpico (Égide de Atena) | Lendário | ouro | bronze | era1 | — | — | aura10 |
| a20 | Ferro Cinza (Túnica de Couro) | Básico | couro | couro | — | — | — | — |
| a21 | Guarda Azul (Cota de Malha) | Raro | couro_escuro | couro | era2 | — | — | — |
| a22 | Manto Arcano (Armadura de Placas) | Épico | bronze | couro_escuro | era2 | — | — | — |
| a23 | Cavaleiro Rubro (Armadura Infernal) | Mítico | ferro | ferro | era2 | — | — | — |
| a24 | Paladino Solar (Égide Sagrada) | Lendário | ouro | ouro | era2 | — | — | aura10 |
| a30 | Casaca Cinza (Casaca de Soldado) | Básico | couro | couro | — | — | — | — |
| a31 | Casaca Naval (Colete Reforçado) | Raro | couro_escuro | couro | era3 | — | — | — |
| a32 | Oficial Roxo (Couraça de Oficial) | Épico | bronze | couro_escuro | era3 | — | — | — |
| a33 | Casaca Carmesim (Casaca Real) | Mítico | ferro | ferro | era3 | — | — | — |
| a34 | Almirante Dourado (Manto do Almirante) | Lendário | ouro | ouro | era3 | — | — | aura10 |
| a40 | Lona Cinza (Casaco de Fábrica) | Básico | couro | couro | — | — | — | — |
| a41 | Latão Escuro (Colete de Latão) | Raro | couro_escuro | couro | era4 | — | — | — |
| a42 | Vapor Roxo (Armadura a Vapor) | Épico | bronze | couro_escuro | era4 | goggles | — | — |
| a43 | Engrenagem Rubra (Exo de Engrenagens) | Mítico | ferro | ferro | era4 | goggles | — | — |
| a44 | Tesla Dourado (Traje Tesla) | Lendário | ouro | ouro | era4 | goggles | — | aura10 |
| a50 | Verde Oliva (Colete Tático) | Básico | couro | couro | — | — | — | — |
| a51 | Camuflado (Armadura Kevlar) | Raro | couro_escuro | couro | era5 | — | — | — |
| a52 | Cinza Urbano (Traje Blindado) | Épico | bronze | couro_escuro | era5 | goggles | — | — |
| a53 | Vermelho Tático (Exoesqueleto) | Mítico | ferro | obsidiana | era5 | goggles | — | — |
| a54 | Preto e Ouro (Armadura Stealth) | Lendário | ouro | ouro | era5 | goggles | — | aura10 |
| a60 | Traje Branco (Traje Espacial) | Básico | couro | couro | — | — | — | — |
| a61 | Nano Azul (Nano-Armadura) | Raro | couro_escuro | couro | era6 | — | — | — |
| a62 | Escudo Violeta (Escudo de Energia) | Épico | bronze | couro_escuro | era6 | visor | — | — |
| a63 | Quântica Rubra (Armadura Quântica) | Mítico | cristal | ferro | era6 | visor | — | — |
| a64 | Cósmico Dourado (Manto Cósmico) | Lendário | cristal | ouro | era6 | visor | — | aura10 |
| p10 | Casaca da Temporada | Passe | rubi | couro_escuro | era3 | — | carnival | — |
| p20 | Traje Elite Solar | Passe | ouro | ouro | era5 | visor | — | aura10 |
| p30 | Imperador das Eras | Passe | ouro | obsidiana | era8 | — | — | aura13 |

## Materiais (MATERIALS) e notas de cor da Arte

| material | [R,G,B,ganho] atual | nota da Arte (render nas 8 versões) | sugestão |
|---|---|---|---|
| couro | 150,105,65,1.0 | bom, natural | manter |
| couro_escuro | 95,60,40,0.9 | bom | manter |
| bronze | 200,130,70,1.15 | lê como ocre/caramelo; no garoto quase igual ao couro, perto do ouro | **205,115,50,1.25** (cobre mais saturado, testado) |
| ferro | 180,190,205,1.15 | quase idêntico à prata (Mítico fica igual a um cinza claro) | **150,160,180,1.05** (aço mais escuro, testado) |
| prata | 215,220,230,1.25 | igual ao ferro | **232,235,245,1.4** (prata clara, testado) — hoje nenhum combo usa |
| ouro | 240,190,70,1.35 | bom | manter |
| cristal | 110,200,255,1.45 | bom | manter |
| obsidiana | 120,70,160,1.0 | bom (roxo escuro) | manter |
| rubi | 210,40,60,1.2 | bom | manter |
| esmeralda | 60,190,110,1.2 | bom — hoje nenhum combo usa | manter |

Notas de combinação (sugestões para a fps-69, ele decide):
- **Era 4 (a42/a43/a44): óculos `goggles` em dobro** — o chapéu `hat_era4` (cartola) já tem óculos desenhados nele. Sugestão: `glasses:null` na era 4.
- **Era 6 (a62/a63/a64): viseira em dobro** — o `hat_era6` já tem a viseira ciano; o `visor` por cima vira duas faixas. Sugestão: `glasses:null` na era 6.
- aura10 (fogo) em todas as Lendárias fica repetitivo e estranho na Futurista (a64). Auras existentes que combinam: aura4 (azul) Futurista, aura13
  (raio dourado) Industrial/Tesla, aura_holy Antiguidade/Medieval, aura_evil Moderna "Preto e Ouro", aura7 (roxo). Só sugestão.

## Cobertura (máscaras/âncoras que os combos usam), conferida por código (skc_check.js)

Precisa por estado: `masks/<herói>_<estado>_mask.png` (+ .json), `_head.json` (chapéu/óculos/máscara), `_hair.png` (chapéus hideHair). Asa não é usada pelos combos.

| versão | estado | situação (atualizada 12/11, depois das correções do PO) |
|---|---|---|
| Kael R / phase1 | 8 estados | completo |
| Kael phase2 / phase3 | 8 estados | **colete refeito cobrindo o peitoral** (máscara R 2-4× maior); âncora do chapéu corrigida; cabelo refeito para a âncora nova |
| Kaia menina (`kaia/`) | run/idle/attack | **máscara de cabelo refeita** (ruivo/acaju entra, região maior atrás, dilata 2-3 px): sumiram os fios atrás do elmo. Os outros estados são do outro agente |
| Kaia adolescente | 8 estados | **máscara de cabelo refeita** (igual à menina) |
| Kaia adulta / guerreira | 8 estados | **colete cobre o peitoral; botas de metal pintáveis** (B 7-26 mil px); âncora do chapéu corrigida; cabelo refeito. Rabo de cavalo fora do elmo: ACEITO pelo PO |
| Kaia menina | pistol_shoot | sem `back` no _body.json (só importa para asa) |

### Correções feitas por código (12/11, decisões do PO; sem crédito)
- **Colete/botas (phase2, phase3, kaia_phase2, kaia_phase3, 8 estados cada)**: `gearmask1.js` com o cachecol procurado mais alto (env novas no gearmask.js:
  `NECKFROM/NECKTO/NECKDEF`; o padrão 0.42-0.70 era do garoto chibi e jogava o pescoço para a cintura no adulto) + `METALSAT=45 METALMAX=240`;
  guerreiros e Kaia adulta/guerreira com `VESTALL=1` (todo pixel não pele/não capa da faixa do tronco: pega os painéis azuis do guerreiro); Kaia com `BOOTMETAL=1`.
  Script: `Temp/tools/skc_vest.sh <pasta>`. Backup: `masks/_bak_skc/`. Formato do .json igual (conferido).
- **Cabelo da Kaia menina/adolescente**: `Temp/tools/skc_hairmask.js` (cópia do hairmask.js; `BACKX=1.0 DIL=3`). Backup em `masks/_bak_skc/`.
- **Chapéu no adulto/guerreiro**: medido, o chapéu NÃO estava menor que a cabeça (largura da cabeça ÷ s: garoto 254, Kael adulto 180, Kaia adulta 228 — o chapéu já
  era proporcionalmente mais largo). O defeito era a ALTURA: a âncora ficava baixa e a aba cobria os olhos (óculos na boca). Correção (`Temp/tools/skc_headfix.js`):
  âncora sobe 30 unidades do chapéu na direção do topo da cabeça em todos os quadros; Kael phase2/3 também s×1,12; Kaia adulta/guerreira s×1,0 (já grande).
  Campo `skcFix` no json; original em `masks/_bak_skc/`. As máscaras de cabelo das 4 pastas foram refeitas (hairmask.js) para a âncora nova.

## Prévia
`reports/prints/skins_camadas_preview.png` — a00, a11, a22, a33, a44, a53, a64, p30 · idle quadro 0 · 8 versões. Ferramenta: `Temp/tools/skc_preview.js`
(modo `mat` = grade dos 10 materiais).
