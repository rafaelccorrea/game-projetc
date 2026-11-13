# Prioridade de responsividade (1ª rodada, só leitura de código)

Origem: `reports/resp/ESTATICO.md` (337 achados). Aqui só as 19 larguras fixas > 320 e os 22 alvos < 40 px. Letra < 11 px e nowrap ficam para a 2ª rodada. Nenhuma correção foi aplicada (não edito arquivos de tela). Confirmação no navegador das 10 piores: pendente (memória < 3,5 GB).

## A. Larguras fixas: quase todas são falso positivo

`width:390px` com `transform-origin:0 0` é o **canvas de projeto**, que o jogo escala por `transform:scale` para a tela real (X390). Não é defeito; não mexer:
`js/p_tower.js:24,57,72` · `js/screens.js:94,324,559` · `js/screens2.js:119` · `js/fullbattle.js:22` · `js/p_map.js:114,208,209` · `js/intro.js:18`. `index.html:128` é uma media query, não largura. `js/p_map.js:120` (600px) é imagem de mapa dentro de contêiner com overflow; só conferir no navegador.

Reais (a conferir no navegador, 288 px é a menor tela):

1. `js/screens.js:680` — seletor `.x-pop[aria-label="Confirmar melhoria"]` (diálogo Equipamento)
   - antes: `width:330px;`
   - depois: `width:330px;max-width:100%;` (o do Passe em `screens2.js:423` já tem `max-width:100%`)
2. `js/p_offer.js:191` — `.of-rays` (raios da Oferta, decorativo)
   - antes: `width:360px;height:360px;margin:-200px 0 0 -110px`
   - depois: manter, mas no pai `.of-…` garantir `overflow:hidden` (já aparece cortado em 288 no relatório de VIP/Derrota: `pv-rays`, `q-orbs` fora da tela).

## B. Alvos de toque < 40 px, por tela

Regra geral: aumentar a área tocável sem mudar o desenho, com `padding` invisível ou `::after{content:"";position:absolute;inset:-8px}` no botão (que precisa de `position:relative`).

**Batalha (`js/fullbattle.js`)**
- `:202` ícone `img` 34×32 dentro de botão do menu → ok se o botão pai tem ≥ 40; conferir o pai (`.fb-mbtn`). Se não: `min-height:44px`.
- `:215` ícone ouro 24×24 e `:216` gemas 22×22: são ícones dentro de `button#fb_goldp/#fb_gemp` (35 px de altura no teste) → antes `height:35px` → depois `min-height:40px`.
- `:223` `#fb_boss` já tem `height:44px` (ícone 30 só decora): sem correção.
- `:333` ponto 14×14: indicador, não toque. Ignorar.

**Equipamento (`js/screens.js`)**
- `:583` botão "mochila maior/trancado": `height:18px` → `height:18px` + `::after{inset:-11px}` (alvo 40) — hoje é a pior da tela.
- `:585,586` pontos vermelhos 10×10: selos de aviso. Ignorar.
- `:601` selo `min-width:24px;height:24px`: contador, não toque (ignorar).
- `:659` botão `[data-x="equp"]`: `height:36px` → `height:40px`.

**Passe / Missões / Perfil**
- `js/screens2.js:400` botão Fechar do Passe: `width:32px;height:32px;margin:-4px -2px -4px 4px` → `width:40px;height:40px;margin:-8px -6px -8px 0`.
- `js/p_pass.js:49` botão "Resgatar": `min-height:34px` → `min-height:40px`.
- `js/p_pass.js:65`, `js/p_missions.js:73`, `js/screens2.js:420`: selos de contagem `height:18–20px`: não são toque. Ignorar.
- `js/p_rank.js:96` avatar 38×38 (Ranking/Perfil): se for tocável (abre perfil), `width:38px;height:38px` → `width:40px;height:40px`; se não, ignorar.

**Torre / Instância / Guia / Intro**
- `js/p_tower.js:90` e `js/p_inst.js:71` `span` 40×30 (selo de andar/chefe): decorativo. Ignorar.
- `js/p_tower.js:111` ícone 30×30 dentro de linha: ok se a linha tem ≥ 40.
- `js/p_guide.js:50` ícone 16×16: decorativo. Ignorar.
- `js/p_intro.js:179` `.pi-realmbtn` (escolha de reino): `min-height:36px` → `min-height:44px` (é botão principal de escolha).

## C. Não aparecem na varredura (Loja, Pets, Montarias)
Nenhum achado de largura fixa ou alvo pequeno nesses arquivos. A sessão que tiver os arquivos `p_shop*`/`p_pets*`/`p_mount*` pode confirmar; a conferência real fica para o navegador.

## Resumo para o Engenheiro
Correções que realmente valem: **screens.js:583** (mochila), **screens.js:659** (equp), **screens2.js:400** (fechar Passe), **p_pass.js:49** (Resgatar), **p_intro.js:179**, **fullbattle.js** (#fb_goldp/#fb_gemp altura 40), **screens.js:680** (max-width). O resto é canvas escalado ou selo decorativo.
