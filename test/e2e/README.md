# E2E sem navegador

Os dois rodam na raiz do jogo, sem npm install e sem navegador. Os dois saem com código 1 se algo falhar. `-v` mostra cada verificação. O carregador comum fica em `sandbox.js`: DOM falso e o jogo na ordem do `index.html`, com as listas do index e do `js/screens.js` lidas a cada execução. Ele só lê os arquivos do jogo, nunca grava.

`node test/e2e/run.js` (painéis): liga e desenha cada painel de `Panels.defs`, com estado novo e com estado avançado. Em cada painel, falha se houver exceção, HTML vazio ou se aparecer `undefined`, `NaN`, `[QTD]`, `PROPOSTA` ou `[object Object]`. Toca em todo `[data-x]` e chama `tick()`. Também confere `FB_UNLOCK` contra `Sys.level` e o FC na tela (`Sys.fc` e `Sys.stats.abbr`).

`node test/e2e/flows.js` (fluxos reais): anda a batalha quadro a quadro com o mesmo corpo do `loop()`, sem o desenho e com relógio virtual. São três fluxos:
1. Troca de era: o Senhor da fase 10 morre, a era vai para 1, o overlay `era` abre, chega à folha final, "Começar a era" fecha e a batalha segue.
2. Instância: `Sys.instances.start` e `startInstanceRun`, com vitória e com derrota. Confere que `B.inst` é limpo, o prêmio, as chaves, a volta à fase e se o jogador vê o resultado.
3. Vitória/derrota do chefe, com `SCREENS_ON.bossResult` forçado: `resOpen`, o HTML da tela, os botões `data-q` (skip/next, farm/retry/gear…) e a batalha seguindo.

A tabela `HARD` no topo do `flows.js` diz quais fluxos reprovam. A instância está "EM CONFERÊNCIA": mostra os problemas, mas não muda o código de saída.
