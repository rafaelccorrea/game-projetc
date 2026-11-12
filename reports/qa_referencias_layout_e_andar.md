# Referências de layout mobile e correção do "herói pulando" (QA, para a sessão de protótipos)

## Diagnóstico do andar (por que parece pulo)
No index.html V1: ao andar, o herói usa `bob=-|sin(t*9)|*4` + squash/stretch + rotação, com UM sprite estático (sem pernas separadas).
Isso lê como quicar, não como caminhar. O herói também fica fixo em x=96; só o parallax lento se mexe.
Correção (em ordem de custo):
1. Cenário em 3 a 5 camadas com velocidades diferentes (céu ~0.1x, longe ~0.3x, meio ~0.6x, chão ~1.0x, primeiro plano ~1.2x). Rápido o bastante
   para parecer corrida. Isso sozinho já vende o movimento.
2. Reduzir o quique do herói para 1 a 2 px (hoje 4), sem squash lateral; inclinar o corpo levemente para a frente (~5°).
3. Poeira nos pés (partículas pequenas saindo atrás) e sombra que acompanha o passo.
4. O certo: ciclo de corrida de 4 a 8 frames do herói por era/tier (gerar no Higgsfield com o herói como referência, ou desenhar pernas/braço
   em camadas e animar por rotação). Sem frames de pernas, sempre vai parecer um boneco deslizando.
5. Com montaria (VIP): a montaria é quem corre (ciclo próprio); o herói só balança sobre ela.
Regra de QA: o passo tem que casar com a velocidade do chão (sem "patinar") e parar de verdade quando a horda chega.

## Layout mobile: padrão a seguir (retrato, tela cheia, sem scroll)
Estrutura recomendada, com base nas fontes abaixo e no que o dono pediu:
- Topo compacto: moedas/diamantes, FC (força de combate), fase/era, config. Uma linha só.
- Meio (a maior parte da tela): campo de batalha com POSIÇÕES FIXAS para herói e inimigos da horda (evita bagunça em tela estreita).
  Barra de vida da horda/chefe no topo do campo. Botões de s2 e s3 sobre o campo, no canto inferior direito (zona do polegar), com recarga visível.
- Baú de toque e botão Auto/velocidade como ícones pequenos nas bordas do campo.
- Base: barra de abas fixa na zona do polegar (Batalha, Equip., Invocar, Loja, Skins/Passe, Mais). Ícone grande + texto curto.
- Cada aba abre um painel em GRADE que cabe na tela (sem scroll): paginar ou usar sub-abas em vez de rolar.
- Tudo ancorado às bordas/cantos e com safe-area (notch). Alvos de toque >= 44px. Opção de esconder a interface (limpa a batalha).
- Desktop: moldura de celular centralizada (ex.: 390x844 escalável), nunca coluna estreita com barra de rolagem.

## Referências encontradas (as fontes são genéricas; não achei captura oficial do Legend of Mushroom)
- Barra de menu embaixo, alcançável pelo polegar: https://endless-idle-wiki.pages.dev/dev/design/ui
- Abas de baixo + botão de ação principal logo acima (Idle Outpost): https://appquantum.helpshift.com/hc/en/18-idle-outpost/faq/716-game-interface/
- UI mobile de idle com barra de abas e conteúdo com respiro (não passa por baixo da barra): https://greasyfork.org/pt-BR/scripts/585290-idlepixel-mobile-ui/code
- Posicionar por zona do polegar; retrato é jogo de uma mão: https://themindstudios.com/post/ux-in-3d-mobile-game-development
- Ancorar HUD em bordas/cantos e ação embaixo ao centro: https://oceanviewgames.co.uk/blog/posts/mobile-ui-design-complex-games
- Posições fixas de herói/inimigo no celular (Knights of Crystalis) e opção de esconder UI (Godforge): https://hellhades.com/godforge/news/godforges-battle-ui-gets-an-upgrade/
- Galeria de UI de jogos mobile (2026): https://pixune.com/blog/best-examples-mobile-game-ui-design/
- Guia do Legend of Mushroom com capturas de batalha (olhar as imagens): https://www.talkandroid.com/82737-ultimate-beginners-guide-legend-of-mushroom/
- Parallax em camadas e velocidades: https://www.slynyrd.com/blog/2019/11/12/pixelblog-23-parallax-scrolling
- Ciclo de corrida CC0 de 8 frames (referência de timing): https://opengameart.org/content/punk-run-animation
Sugestão: a sessão de protótipos deve abrir os dois links de capturas (Legend of Mushroom e pixune) e montar 2 ou 3 protótipos de tela
em 390x844 (HTML estático, sem lógica) para o dono escolher antes de qualquer código no index.html.
