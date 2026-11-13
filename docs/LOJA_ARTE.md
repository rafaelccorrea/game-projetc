# Eonbound — arte da loja e do app (Play Store)

## 1. Ícone do app — 3 opções esperando o voto do dono

| Opção | Ideia | Prévia | Fundo do splash Android 12+ |
|---|---|---|---|
| A | "E" dourado do logo + cachecol vermelho + cristal azul-violeta | `assets/mobile/icon/option_A_prev.png` | `#140C34` |
| B | Kael (garoto, corpo padrão) com espada, num medalhão dourado com portal de cristal | `assets/mobile/icon/option_B_prev.png` | `#0B1433` |
| C | Brasão: escudo azul com "E" dourado, cristal no topo, espadas cruzadas e faixa vermelha | `assets/mobile/icon/option_C_prev.png` | `#120E2A` |

Em cada pasta `assets/mobile/icon/<A|B|C>/`:
- `ic_launcher_foreground_432.png`: camada da frente do ícone adaptativo, transparente. A arte cabe no círculo seguro (A e B: raio 140 px; C: as pontas das espadas passam do círculo de propósito e podem ser cortadas pela máscara, mas o escudo fica dentro)
- `ic_launcher_background_432.png`: fundo em degradê radial
- `ic_launcher_monochrome_432.png`: versão branca sobre transparente, para os ícones temáticos do Android 13+ (a B é a que tem mais detalhe, então lê menos nesse modo)
- `ic_launcher_legacy_192/512.png` (quadrado) e `ic_launcher_round_192/512.png` (redondo)
- `play_store_512.png`: 512×512, 32 bits, sem transparência e sem cantos arredondados
- `splash_icon_1152.png`: ícone do splash do Android 12+ (288 dp @4x, arte dentro do círculo de 192 dp)
- `small_sizes_check.png`: o ícone em 48/72/96/144/192 px, com máscara de círculo e de squircle
- `res/mipmap-{mdpi..xxxhdpi}/`: ic_launcher, ic_launcher_round, ic_launcher_foreground/background/monochrome nas densidades certas (48 dp para o legado e 108 dp para as camadas)

Tela de abertura em tela cheia (serve para as 3 opções porque usa o logo): `assets/mobile/splash/splash_1080x1920.png` (prévia em `splash_1080x1920_prev.png`). Simulação do splash do Android 12+ das 3 opções: `assets/mobile/splash/splash_android12_prev.png`.

### Como ligar no Capacitor (fps-c8, só depois do voto do dono)
1. Copiar `assets/mobile/icon/<X>/res/mipmap-*` para `android/app/src/main/res/` (substitui os ícones padrão do Capacitor).
2. Criar `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (e um `ic_launcher_round.xml` igual):
   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
       <background android:drawable="@mipmap/ic_launcher_background"/>
       <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
       <monochrome android:drawable="@mipmap/ic_launcher_monochrome"/>
   </adaptive-icon>
   ```
3. Splash do Android 12+: usar `androidx.core:core-splashscreen`. Em `styles.xml`, o tema `AppTheme.NoActionBarLaunch` passa a ter `parent="Theme.SplashScreen"`, com `windowSplashScreenBackground` = a cor da opção escolhida (tabela acima), `windowSplashScreenAnimatedIcon` = `@drawable/splash_icon` (copiar `splash_icon_1152.png` para `drawable-nodpi/splash_icon.png`) e `postSplashScreenTheme` = `@style/AppTheme.NoActionBar`.
4. Abertura em tela cheia (Android 11 ou anterior, ou a tela de carregamento do jogo): `splash_1080x1920.png` vai para `drawable/splash.png` (é o recurso que o plugin `@capacitor/splash-screen` já usa), com `backgroundColor` igual à cor da opção.
5. Play Console: enviar `play_store_512.png` como ícone do app.

## 2. Arte da loja — plano (ainda não feito)
Fica esperando o voto do ícone e os prints reais do jogo, que o engenheiro vai mandar.

**Feature graphic 1024×500**: Kael (garoto, corpo padrão) à esquerda, de espada na mão, olhando para as ilhas das eras (o mesmo conceito da `title_bg`: pré-história, Grécia, castelo, indústria, cidade, futuro). Logo EONBOUND à direita sobre o brilho de cristal. Nada de texto pequeno, porque o Google corta as bordas.

**Screenshots** (de 4 a 6, em 1080×1920 retrato, print real do jogo com uma faixa de legenda em cima com a fonte do logo):
1. Batalha automática com dano e efeitos: "Lute por todas as eras da história"
2. Mapa ou seleção das eras: "Da pré-história ao futuro: 9 eras para conquistar"
3. Forja / armas com raridade e ultimate: "Forje armas lendárias e libere ultimates"
4. Pets com 3 estágios e montarias de 1 a 5 estrelas: "Pets e montarias que evoluem com você"
5. Torre / Arena: "Suba a Torre e desafie jogadores na Arena"
6. Progresso offline / prêmios: "Seu herói evolui até com o jogo fechado"

Regras: herói sempre no corpo padrão (garoto ou menina); nada sensual; tom de aventura, sem cara de jogo infantil.
