# Jogo idle-RPG por eras — Direção de arte + contrato de assets (LEIA ANTES DE TUDO)

Projeto: RPG idle mobile 2D (combate automático, visão lateral), tema "guerreiro que viaja por 7 eras":
0 Pré-História · 1 Antiguidade · 2 Medieval · 3 Era da Pólvora · 4 Industrial · 5 Moderna · 6 Futurista.
Monetização: SOMENTE skins (visual). Nada de pay-to-win. Referência de gênero: Legend of Mushroom
(Google Play com.mxdzzus.google): estilo fofo, personagens simples, UI chamativa. NÃO copiar personagens,
nomes ou arte dele — só o gênero e o "clima".

## Estilo visual (obrigatório, igual para todos os agentes)
- 2D cartoon "chibi" para mobile: cabeça grande (~1/3 da altura), corpo compacto, contorno escuro grosso e limpo
  (~3-4px em 512px), cores saturadas, sombreamento cel (2 tons), luz vindo de cima-esquerda, brilho suave nas bordas.
- Fofo mas épico. Sem texto dentro dos sprites. Sem realismo, sem fotografia, sem 3D renderizado.
- Fundo TRANSPARENTE nos sprites (gerar sobre fundo liso e usar a ferramenta remove_background do Higgsfield).
- Herói: "Kael", jovem guerreiro humano, cabelo castanho bagunçado, olhos grandes determinados, **cachecol vermelho**
  (marca registrada, presente em TODAS as eras, só muda o material). Sempre virado para a DIREITA.
- Inimigos virados para a ESQUERDA. Silhueta clara, legível em 120px de altura.
- Paleta e acabamento de cada era seguem o tema (ex.: pré-história = peles/ossos/terra; futuro = neon ciano/roxo).

## Estrutura de pastas e nomes (caminhos EXATOS; tudo relativo a C:\Users\rafae\Desktop\fps)
```
assets/brand/name.json        {"name":"...","tagline":"..."}
assets/brand/logo.png         logo do jogo (transparente, com o nome em letras estilizadas)
assets/brand/title_bg.png     arte da tela inicial, 9:16 retrato, SEM texto
assets/ui/coin.png gem.png chest.png pass.png     ícones 256x256 transparentes
assets/bg/era{0..6}.png       cenário 3:2 largo, SEM personagens. LINHA DO CHÃO a 72% da altura da imagem.
assets/hero/era{E}_t{T}.png   corpo do herói SEM arma, mão direita fechada em punho; 1:1; transparente;
                              virado à direita; pés tocando a base (y≈95%), centralizado.  E=0..6, T=0..2
assets/hero/anchors.json      {"era0_t0":{"hand":[fx,fy]},...}  posição da mão direita em fração da imagem (0-1)
assets/weapons/era{E}_t{T}.png arma isolada, 1:1 transparente. Armas brancas: apontando para CIMA, punho embaixo
                              centro. Armas de fogo: apontando para a DIREITA, empunhadura à esquerda.
assets/weapons/meta.json      {"era3_t0":{"type":"melee|gun","grip":[fx,fy]},...}  ponto de empunhadura (fração)
assets/enemies/era{E}_e{0|1}.png   inimigos comuns (2 por era), virados à esquerda, pés na base, 1:1 transparente
assets/enemies/era{E}_boss.png     chefe da era (maior, mais ameaçador)
assets/enemies/meta.json      {"era0_e0":{"name":"Lagarto"},...,"era0_boss":{"name":"..."}}
reports/<agente>.md           relatório curto de cada agente (o que gerou, créditos gastos, problemas)
```
Tiers de skin: T0 = Básico/Raro (simples), T1 = Épico/Mítico (detalhado, brilho), T2 = Lendário (espetacular, aura).
Cada era tem sua própria cara: o herói da era 3 usa roupas de 1700, o da 6 usa traje espacial, etc.

## Regras de convivência
- Cada agente escreve SOMENTE na sua pasta de assets e no seu relatório. Só o agente "engenheiro" edita index.html.
- Se um asset falhar/ficar feio, regenere ou registre no relatório; nunca deixe arquivo com o nome certo e conteúdo ruim.
- Confira cada imagem final visualmente (Read na imagem) antes de considerar pronta.
- Orçamento Higgsfield é limitado (saldo total ~930 créditos, dividido entre agentes). Faça UMA imagem de teste
  primeiro para descobrir o custo por geração; se o custo estimado passar do seu teto, pare e reporte.
  Nunca publique nada, nunca use recursos de publicação/redes sociais do Higgsfield, nem GPU rental.
- Modelo de imagem sugerido: nano_banana_pro (aceita imagens de referência, bom p/ consistência). Use a imagem âncora
  de estilo (hero/era2_t0.png quando existir) como referência para manter coerência.
- O servidor local `http://localhost:8080` (pasta do projeto) já está no ar para testar.
