# Carregar só a arte em uso — pacotes, medidas e proposta de entrega (fps-e2, 12/11/2026; pedido do PO)
Hoje o APK leva toda a arte: **657 MB** (v0.12.7). Meta do PO: **APK base < 150 MB**; o resto como pacote do Play (Play Asset Delivery) ou baixado sob demanda.

## O que existe (commit 0bab33d)
- `js/sys/assets.js` (**Sys.assets**, chave `DATA.on=false`): `classify(caminho)` → pacote; `needed(S,host)` → pacotes que o jogador precisa agora;
  `plan(S,host,instalados)` → `{fetch, drop, fetchBytes}`; `firstBoot()` → o APK base; `packOf(caminho)` para o carregador. Fonte única da regra.
- `tools/asset-manifest.js` → `assets/manifest.json` (bytes e arquivos por pacote). Rodar a cada versão: `node tools/asset-manifest.js --report`.
- `test/sys/assets.test.js` confere a classificação, o plano e que o APK base fica < 150 MB.

## Medidas (arte que vai para o app, sem fontes brutas: 646 MB em 63 pacotes)
| Tipo | MB | Observação |
|---|---|---|
| Montarias | 168 | 6 montarias × estados × estrelas (serpe 40, tigre 36, cavalo 28, pônei 26, lobo 20, grifo 19) |
| Herói (fases) | 139 | Kael: 39 / 18 / 19 / 22 · Kaia: 6 / 16 / 16 / 16 |
| Pets | 101 | 8 espécies × 3 estágios |
| Inimigos | 91 | animados por era |
| Eras (cenário, armas, ultimate) | 56 | |
| Núcleo (interface, som, efeitos) | 29 | |
| Prévias de arte (Modo dono) | 29 | **fora do app do jogador** |
| Pistolas por era | 23 | |
| Auras | 11 | |

**APK base do jogador novo = 117 MB de arte + ~4 MB de código ≈ 121 MB** (meta < 150 ✓): núcleo, auras, eras 0-1, inimigos 0-1 e os DOIS heróis na fase 0
(a escolha Kael/Kaia vem depois de instalar). Fast-follow sugerido (baixa sozinho logo depois): fase 1 do herói + eras 2-3 (~49 MB para o Kael).

## Proposta de entrega (para o engenheiro e o servidor decidirem)
1. **Install-time (dentro do APK):** os pacotes de `Sys.assets.DATA.basePacks()`.
2. **Fast-follow:** `DATA.fastFollow(hero)` — o jogador quase sempre precisa nas primeiras horas.
3. **On-demand:** eras 4-8, fases 2-3 do herói, cada montaria, cada estágio de pet, pistolas, prévias (só Modo dono).
4. **Como baixar** — duas opções:
   - **Play Asset Delivery** (fps-6f/fps-c8): um asset pack por pacote ou por grupo; o Capacitor precisa de um plugin nativo para pedir o pack e
     saber o caminho dele no aparelho. Vantagem: a loja entrega e atualiza; sem custo de servidor.
   - **Download do nosso servidor/CDN** para o Cache Storage do WebView, servido pelo `sw.js` (o service worker já existe): o jogo pede a imagem
     pelo mesmo caminho e o SW responde do cache. Vantagem: igual na web e no app; precisa de CDN.
5. **No jogo (engenheiro):** antes de desenhar uma arte, `Sys.assets.packOf(caminho)`; se o pacote não está instalado, baixar e mostrar a arte
   padrão enquanto isso (ex.: equipar uma montaria nova → "baixando a montaria" e depois ela aparece). A cada mudança de era/fase/equipamento,
   `Sys.assets.plan(S, host, instalados)` diz o que pré-baixar (era seguinte, próxima fase) e o que pode sair do aparelho.
6. **Fácil ganho já:** tirar `assets/anim/look_preview` e `assets/anim/equip/preview` (29 MB) do APK do jogador (só o Modo dono usa).
