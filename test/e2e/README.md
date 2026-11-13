# E2E sem navegador

Os dois rodam na raiz do jogo, sem npm install e sem navegador. Os dois saem com código 1 se algo falhar. `-v` mostra cada verificação. O carregador comum fica em `sandbox.js`: DOM falso e o jogo na ordem do `index.html`, com as listas do index e do `js/screens.js` lidas a cada execução. Ele tem opções para o `flows.js`:
- `realFetch`: o fetch lê o arquivo do disco.
- `draw`: imagens que carregam e um canvas que grava a origem de cada `drawImage`.
- `runBoot`: roda o script de partida do index.
- `storage` e `search`: um save antigo no localStorage e a URL.

Ele só lê os arquivos do jogo, nunca grava.

`node test/e2e/run.js` (painéis): liga e desenha cada painel de `Panels.defs`, com estado novo e com estado avançado. Em cada painel, falha se houver exceção, HTML vazio ou se aparecer `undefined`, `NaN`, `[QTD]`, `PROPOSTA` ou `[object Object]`. Toca em todo `[data-x]` e chama `tick()`. Também confere `FB_UNLOCK` contra `Sys.level` e o FC na tela (`Sys.fc` e `Sys.stats.abbr`).

`node test/e2e/flows.js` (fluxos reais, cerca de 40 s): anda a batalha quadro a quadro com o mesmo corpo do `loop()`, com relógio virtual e, nos fluxos 4 e 5, também com o `draw()`. São cinco fluxos:
1. Troca de era: o Senhor da fase 10 morre, a era vai para 1, o overlay `era` abre, chega à folha final, "Começar a era" fecha e a batalha segue.
2. Instância: `Sys.instances.start` e `startInstanceRun`, com vitória e com derrota. Confere que `B.inst` é limpo, o prêmio, as chaves, a volta à fase e se o jogador vê o resultado.
3. Vitória/derrota do chefe, com `SCREENS_ON.bossResult` forçado: `resOpen`, o HTML da tela, os botões `data-q` e a batalha seguindo.
4. Fases do herói:
   - Save antigo no Nv 60, com Kael e com Kaia, carregado pela partida real: chega na fase 2 e as folhas desenhadas vêm de `phase2`/`kaia_phase2`. O próprio teste chama `Sys.phaseUp.catchUp`.
   - Do 34 ao 35 com skin a43 e óculos: XP pelo `Sys.level.addXp` e `onLevelUp` do jogo. Confere `pending` pronto e `layered`, a evolução, as mesmas `Sys.appearance.layers` antes e depois e a animação.
5. `drawHeroFull` com pet, montaria e asa equipados: vitória e troca de era desenhando. Conta as chamadas de `drawHeroFull` e confere que o canvas recebeu `pets/`, `mounts/` e `wing`. Também chama `drawHeroFull` direto e diz qual parte ficou de fora e onde.

A tabela `HARD` no topo do `flows.js` diz quais fluxos reprovam. Dentro de um fluxo, as verificações marcadas "EM CONFERÊNCIA" mostram o problema, mas não reprovam. No fluxo 4, são as da partida (`catchUp`) e as da animação.
