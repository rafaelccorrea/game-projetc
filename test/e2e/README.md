# E2E sem navegador

Rodar na raiz do jogo: `node test/e2e/run.js` (`-v` mostra cada verificação). Não precisa de npm install nem de navegador. Sai com código 1 se algo falhar.

O que confere: carrega o jogo inteiro num vm com DOM falso, na ordem do `index.html`. As listas de `js/sys` e `js/` vêm do index, os painéis vêm da lista do `js/screens.js`, e as listas são lidas a cada execução. Depois liga e desenha cada painel de `Panels.defs`, com estado novo e com estado avançado (nível 60, ouro, mochila cheia). Em cada painel, falha se houver exceção, HTML vazio ou se aparecer `undefined`, `NaN`, `[QTD]`, `PROPOSTA` ou `[object Object]`. Toca em todo `[data-x]`, inclusive nos que aparecem depois de um toque, e chama `tick()`.

Também confere que todo `FB_UNLOCK` bate com `Sys.level.unlockLevel` e que os níveis aprovados pelo PO estão em `Sys.level.DATA.unlock`. No FC na tela, confere `Sys.fc.compute` > 0, `Sys.fc.snapshot`/`delta` (o texto começa com `+`) e `Sys.stats.abbr` curto.
