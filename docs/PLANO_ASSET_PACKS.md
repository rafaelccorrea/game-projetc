# Plano: tamanho da versão de loja (AAB com Play Asset Delivery)

Decisão do PO (13/11/2026): o APK de TESTE continua com tudo dentro. A versão de LOJA sai em AAB, com a arte dividida em pacotes entregues pela própria Play (Play Asset Delivery). Nada de hospedar pacotes no nosso servidor. Implementar só quando chegarmos à versão de loja; isto não bloqueia o teste.

Os tamanhos abaixo são os do `assets/manifest.json` de 13/11/2026 (89 pacotes, 997 MB no total, PNG em disco; PNG quase não encolhe na compressão da Play). Refazer a conta com `node tools/asset-manifest.js` antes de implementar.

## Como a Play entrega

| Modo | Quando chega | Uso aqui |
|---|---|---|
| install-time | junto com a instalação (conta no tamanho da instalação) | base do jogo |
| fast-follow | a Play baixa sozinha logo depois de instalar, sem o jogo aberto | o que o jogador alcança nas primeiras horas |
| on-demand | o jogo pede quando precisa | o que é raro ou tardio |

Os limites de tamanho por pacote e por app mudam com o tempo: conferir na documentação da Play na hora de implementar (não confiar em número de memória).

## Divisão proposta

### Base (install-time): cerca de 149 MB

A 1ª sessão inteira sem esperar download.

| Pacote do manifesto | MB |
|---|---|
| core (telas, ícones, sons, fontes) | 71,7 |
| hero:kael:0 | 38,4 |
| hero:kaia:0 | 12,7 |
| era:0 + enemy:0 | 20,1 |
| pet:era0_mammoth:0 | 5,2 |
| ult:club | 1,0 |

Fica no limite do teto de 150 MB do teste da Sistemas. Se o `core` crescer, o primeiro a sair da base é a Kaia (12,7 MB), porque o jogador começa com o Kael.

### Pacote "inicio" (fast-follow): cerca de 110 MB

O que o jogador alcança no 1º dia.

- era:1, era:2, enemy:1, enemy:2 (31,9 MB)
- aura (11,0 MB), ult:sword, ult:gladius (5,4 MB)
- estágios 1 e 2 do mamute; esfinge e dragão nos 3 estágios (cerca de 34 MB)
- mount:pony e mount:horse, as duas primeiras montarias (41,4 MB). Se passar do alvo, a segunda montaria vai para on-demand.

### Pacote "eras_meio" (fast-follow): cerca de 115 MB

- era:3 a era:5, enemy:3 a enemy:5 (53,3 MB)
- gun:3, gun:4, gun:5 (26,8 MB)
- pets das eras 3 e 4 nos 3 estágios (cerca de 24 MB)
- ult das armas dessas eras (cerca de 4 MB)

### Pacote "eras_fim" (on-demand, pedido ao vencer a era 4): cerca de 110 MB

- era:6 a era:8, enemy:6 a enemy:8 (58,1 MB)
- gun:6 (9,1 MB)
- pets das eras 7 e 8 e os pets novos, 3 estágios (cerca de 60 MB; se passar, os pets novos viram pacote próprio)

### Pacotes on-demand por item

Cada um é pedido quando o jogador ganha o item ou abre a vitrine dele. Enquanto baixa, o jogo mostra o herói padrão ou a montaria anterior (o carregador já tem essa reserva).

- Skins: 11 pacotes de 24 a 30 MB cada (cerca de 278 MB no total)
- Montarias: wolf, griffin, wyvern, giant (Fênix), mythic (cerca de 137 MB)
- Famílias de arma desligadas hoje (weapon:bow, weapon:boomerang, 77 MB): não entram na loja enquanto a chave estiver desligada.

## O que muda no código (quando for implementar)

1. `fps-android`: módulos de asset pack no Gradle, um por pacote acima, e `bundleRelease` no lugar do `assembleDebug`. O `tools/copiar-jogo.js` passa a distribuir os arquivos por pacote a partir do manifesto, em vez de copiar tudo para o `www`.
2. Uma ponte nativa pequena (plugin do Capacitor) sobre a biblioteca Play Asset Delivery: estado de cada pacote, pedir download, progresso e o caminho local dos arquivos.
3. `js/preload.js` e `Sys.assets`: hoje resolvem o pacote e baixam por HTTP do próprio app; passam a perguntar à ponte se o pacote está no aparelho, pedir o download e ler do caminho local. A recuperação automática que já existe cobre a falha de rede.
4. Tela: o aviso "baixando a arte da era" que já existe ganha o progresso real vindo da Play.
5. Teste de tamanho (`test/sys/assets.test.js`, da Sistemas): medir a BASE do AAB (lista acima), não o APK de teste.

## Riscos

- Fast-follow não é instantâneo: quem jogar rápido pode chegar à era 1 antes do pacote "inicio". O jogo precisa segurar a entrada da era com a tela de espera que já existe.
- Só existe na Play: o APK de teste, instalado por cabo, continua levando tudo dentro; os dois caminhos precisam ser testados.
- A conta de tamanho precisa ser refeita a cada arte nova: o manifesto é a fonte.

## Atualização de 14/11: pacote `ui:late` (plano A aprovado pelo PO)

A base da loja tinha voltado a 161,3 MB. Saiu da base para o fast-follow (pacote da Play `inicio`, junto de `fx:bonfire` e `ui:frames`) a arte de telas que só abrem mais tarde: retratos e ícones de pets (menos o mamute inicial e o ovo), Mentores, ícones de títulos, Relíquias, Escavação, Dupla, Acampamento e Tela Inicial. Base medida depois: **133,2 MB** (`test/sys/assets.test.js` passa).

- Ficam na base de propósito: relógio do mapa (a história de abertura usa), ícones do Grimório (1ª magia na fase 10, aparecem na batalha), ícones do Menu.
- Regra em `js/sys/assets.js` (`classify`). Imagem desse pacote que falha é tratada em `js/latepack.js`: pacote chegou em outra pasta = troca o endereço; não chegou = reserva da tela, ou a imagem some e volta sozinha quando chegar.
- Falta: compressão sem perda dos PNG do core (Arte) e ver as telas com o pacote ausente quando o plugin de entrega existir.
