# Proposta de dificuldade com paredes — PARA O DONO (nada ligado)

Pedido do dono (13/11, via PO): "passou em todas as eras sem dificultar não pode". A dificuldade tem que **forçar a evolução** (equipamento novo, Forja,
raridade, pet, montaria, coleção). Com FC abaixo da pedida, o chefe tem que ser muito difícil. Meta de tempo mantida: grátis ~6 meses para as 9 eras,
VIP ~4. Nunca sorteio pago.

Autora: Sistemas (fps-69). Simulações: `tools/sim-paredes.js` (180 dias) e uma luta simulada contra o chefe (20 mil lutas por linha).

## Resumo em 5 linhas

1. **A luta contra o chefe já é dura abaixo da FC certa.** Com 80% da FC ele quase nunca cai; com 90%, metade das vezes. O jogo está fácil porque a
   **FC pedida hoje fica muito abaixo da FC que o jogador tem** (2 a 30 vezes abaixo na simulação).
2. **Proposta:** uma FC pedida **por fase** (90 valores), igual à FC que o jogador grátis ativo terá no dia certo do calendário. O chefe do meio (fase 5) e
   o Senhor da Era (fase 10) pedem a FC de **1 a 3 dias depois**: são as paredes.
3. **Resultado simulado:** o grátis termina as 9 eras no **dia 180** (30 dias parado em paredes), o VIP 5 no dia 139 e o VIP 10 no dia 121 (os dois também
   param de 1 a 4 dias em cada parede). **Quem não forja nem evolui o pet trava na era 5 e não passa mais.**
4. **Ao travar, o jogo mostra o que fazer**, com quanto cada coisa dá e botão para a tela (usa o `Sys.fc.advice`, que já existe).
5. **Condição para funcionar:** a XP por dia precisa ter teto (o teto de XP de abate já existe no `Sys.level`, desligado). Sem teto, quem joga 10 horas
   por dia pula todas as paredes.

## 1. Quanto a FC pesa na luta contra o chefe

Modelo: o herói golpeia a cada 0,8 s (12% de crítico ×2), com o golpe forte ×3 a cada 6 s; o chefe bate a cada 1,15 s. Ataque e vida do herói sobem
juntos com a FC. A FC pedida é definida assim: **com 100% dela, o herói mata o chefe em ~32 s e aguentaria ~40 s.** A execução do jogador varia ±7% por luta
(usar o golpe final na hora certa, desviar).

| FC / pedida | Vence | Vida que sobra | Tempo | O que o dono pediu |
|---|---|---|---|---|
| 70% | 0% | — | — | — |
| 80% | 0% | — | — | quase impossível |
| 85% | 6% | 2% | 36 s | |
| 90% | 51% | 5% | 36 s | difícil |
| 95% | 92% | 10% | 35 s | |
| 100% | 99,8% | 18% | 33 s | passa com esforço |
| 110% | 100% | 32% | 30 s | |
| 120% | 100% | 43% | 28 s | passa tranquilo |
| 150% | 100% | 63% | 23 s | |

- **A curva que o dono pediu sai sozinha** quando a FC pedida é honesta: o ataque e a vida caem juntos, então perder 10% de FC custa ~20% de chance real.
- **Fúria do chefe (proposta de reforço):** aos 40 s o chefe passa a bater ×4. Não muda a tabela acima, mas impede que cura do pet ou vida alta
  "segurem" a luta para sempre abaixo da FC pedida.
- **Inimigos comuns** continuam como hoje: vida e dano ligados à fase anterior, ~50% do chefe. O jogo parado (idle) continua dando ouro, XP, pedras
  e itens enquanto o jogador está na parede.
- **Medida no jogo real (calibração v8, eras 0-2):** com FC abaixo da pedida o chefe "quase nunca cai". A fase 20 só caiu com 70% da FC depois de ~96
  tentativas, o que confirma o modelo.

## 2. Paredes por era (simulado, 180 dias)

**Calendário-alvo do grátis ativo:** fim das eras nos dias 1, 3, 10, 22, 40, 65, 97, 135 e 179, o mesmo de hoje.

**Paredes em dias de espera do grátis:**

| Era | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|---|
| Chefe do meio (fase 5) | — | — | 0,5 | 1 | 1 | 1,5 | 1,5 | 1,5 | 1,5 |
| Senhor da Era (fase 10) | 2 h | 1 | 2 | 2,5 | 3 | 3 | 3 | 3 | 3 |

O resto do tempo da era se divide pelas outras 8 fases.

| Era | Fim da era: grátis · VIP 5 · VIP 10 · sem Forja nem pet | Chefe do meio: FC do grátis ao chegar · espera | Senhor da Era: FC do grátis ao chegar · espera grátis · VIP 5 · VIP 10 |
|---|---|---|---|
| 0 | dia 1 · 1 · 1 · 2 | — | 100% · 0 h · 0 h · 0 h |
| 1 | 4 · 3 · 3 · 5 | — | 39% · 1 d · 24 h · 22 h |
| 2 | 11 · 8 · 7 · 15 | 92% · 17 h | 84% · 2 d · 1,8 d · 1,6 d |
| 3 | 23 · 17 · 15 · 35 | 96% · 23 h | 91% · 3 d · 17 h · 1,2 d |
| 4 | 41 · 32 · 28 · 106 | 97% · 1 d | 56% · 3 d · 4,3 d · 3,8 d |
| 5 | 66 · 52 · 45 · **trava** | 100% · 22 h | 36% · 3 d · 4,5 d · 3,9 d |
| 6 | 98 · 76 · 66 · trava | 97% · 2 d | 95% · 3 d · 4 d · 3,4 d |
| 7 | 136 · 105 · 91 · trava | 100% · 1,4 d | 97% · 3 d · 3 d · 3,1 d |
| 8 | **180** · **139** · **121** · trava | 98% · 2,1 d | 97% · 3 d · 3,7 d · 3,1 d |

| Perfil | Fases vencidas | Fim | Dias parado em parede | Dias com FC abaixo de 90% da pedida (de 180) |
|---|---|---|---|---|
| Grátis ativo | 90/90 | dia 180 | 30 | 17 |
| VIP 5 | 90/90 | dia 139 | 30 | 27 |
| VIP 10 | 90/90 | dia 121 | 27 | 27 |
| **Não forja nem evolui o pet** | **59/90** | **trava no Senhor da Era 5 (fase 60)** | 62 | 42 |

Como ler:
- **"FC ao chegar" baixa** (39%, 56%, 36%) mostra uma parede que cai **quando abre uma raridade nova** (nível 25, 70, 85). O jogador vê o que falta e
  sabe que a próxima raridade resolve.
- **O VIP para tanto quanto o grátis em cada parede**, mas chega antes (cresce mais rápido). Ele "sente a parede" também.
- **Quem não forja nem evolui o pet:** passa as primeiras eras devagar e trava de vez na era 5. É o que o dono pediu: sem evoluir, não passa.

**FC pedida (amostra), fases 1 / 5 / 9 / 10:**

| Era | Fase 1 | Fase 5 | Fase 9 | Fase 10 |
|---|---|---|---|---|
| 0 | 947 | 1,8 mil | 2,2 mil | 2,2 mil |
| 1 | 17,5 mil | 19,6 mil | 23,8 mil | 61,5 mil |
| 2 | 732 mil | 959 mil | 1,1 mi | 1,3 mi |
| 3 | 17,7 mi | 22,9 mi | 31,6 mi | 34,8 mi |
| 4 | 446 mi | 538 mi | 674 mi | 1,1 bi |
| 5 | 15,1 bi | 18,9 bi | 24 bi | 67,7 bi |
| 6 | 894 bi | 1,1 tri | 1,4 tri | 1,5 tri |
| 7 | 20 tri | 55,8 tri | 62,5 tri | 64,1 tri |
| 8 | 841 tri | 1 qua | 1,2 qua | 1,3 qua |

A tabela completa (90 fases) sai do `tools/sim-paredes.js`. Estes números estão na escala do simulador; no jogo real eles viram multiplicadores da
fase (ver o item 6).

## 3. De onde vem a FC para vencer a parede

Ganho de cada ação, em % da FC do grátis no Senhor da Era:

| Ação | Era 1 | Era 3 | Era 5 | Era 7 | Era 8 |
|---|---|---|---|---|---|
| Raridade +1 em todo o equipamento (fundir, chefe, Forja de transformação) | +105% | +70% | +163% | já no Divino | já no Divino |
| Forja +1 em todas as peças | +2,6% | +4,5% | +6,9% | +9,4% | teto (+15) |
| Forja +2 em todas as peças | +5,2% | +9,1% | +14% | +19% | teto |
| Nível +1 | +4,8% | +3% | +2,5% | +2,2% | +2,2% |
| Pet do 1º ao 3º estágio | +2,4% | +9% | +11% | +11% | +14% |
| Montaria +1★ | +0,1% | +0,1% | +0,2% | +0,2% | +0,2% |
| Skin nova na coleção | +0,5% | +0,5% | +0,5% | +0,5% | +0,5% |
| Título novo | +1 a +6% | +1 a +6% | +1 a +6% | +1 a +6% | +1 a +6% |

- **Cada parede tem pelo menos 3 caminhos:** a Forja (sempre dá algo), o pet (a partir da era 3) e o nível. Raridade nova e títulos são os saltos grandes.
- **A montaria quase não pesa: +1★ dá 0,2%.** Se o dono quer que "montaria subindo estrela" ajude a vencer parede, o bônus por estrela precisa subir.
  Proposta: +1★ = +2 a +3% de ATQ e VIDA. Isso fica para uma decisão separada, porque mexe na economia de fragmentos.

## 4. Ao travar, o jogo mostra o que fazer

Depois de perder para o chefe, ou com o botão "Desafiar" apagado:

> **Faltam 3,1 mi de FC** para o Senhor da Era (você tem 31,7 mi de 34,8 mi).
> - Forjar todas as peças +1 → **+1,4 mi** [Forja]
> - Evoluir o pet para Adulto → **+1,6 mi** [Pets]
> - Subir 1 nível (falta 38% da barra) → **+0,9 mi** [Batalha]
> - Pôr o título Domador em destaque → **+0,6 mi** [Perfil]

- **De onde vêm os números:** o `Sys.fc.advice`, que já existe e calcula "FC com a mudança − FC de hoje" para cada módulo. Só falta a tela.
- **Como a lista é montada:** primeiro o que dá para fazer agora, depois pelo maior ganho. Nunca aparece "comprar" nem "invocar", porque não há sorteio pago.

## 5. Tempo e regras mantidos

- **Tempo:** grátis em ~180 dias e VIP 10 em ~121, agora com paredes em vez de reta.
- **Nada de sorteio pago:** as paredes caem com Forja, pet, nível, raridade (por fusão, chefe e transformação) e títulos. O VIP passa mais rápido porque
  cresce mais rápido (bônus de ATQ, XP e offline), não por compra de sorte.

## 6. Como ligar no jogo (quando o dono aprovar)

1. **Teto diário da XP de abate:** ligar o que já existe no `Sys.level` (cheio até o tempo do grátis, 30% acima, 10% acima do dobro). Sem isso, as paredes
   em DIAS não existem: quem joga muito passa todas no mesmo dia.
2. **Chefe pela FC pedida:** no `mkEnemy` do js/battle.js (Engenheiro), a vida e o dano do chefe passam a sair da FC pedida da fase. A conta: vencer em
   ~32 s com 100% e aguentar ~40 s. Os comuns ficam com ~50% do chefe. Assim a FC mostrada é sempre honesta.
3. **Tabela de 90 fases** no docs/balance.json (e a fórmula para as fases depois da 90).
4. **Fúria do chefe aos 40 s** (×4 no dano).
5. **Tela "o que fazer"** com o `Sys.fc.advice`.
6. **Chave desligada** até o QA medir no jogo real, como foi feito na v8 (eras 0-2 primeiro).

## Ressalvas (para não ser chute)

- **Escala:** a simulação de 180 dias usa a FC do `Sys.fc` com os módulos novos ligados (eras 7-8, nível 120). A escala da FC do jogo de hoje é outra.
  A proposta é a **forma** (quanto cada parede pede a mais e quantos dias ela segura), não os números absolutos.
- **O que o modelo deixa de fora:** o jogador real também ganha itens de drop e ouro para subir peças, que o modelo não conta. Isso faz o jogo real
  andar mais rápido, então os números precisam ser medidos pelo QA antes de ligar.
- **A luta é um modelo:** a curva de vitória (80% → 0%, 90% → 51%, 100% → ~100%) é o que se espera com ataque e vida subindo juntos, e bate com a
  calibração v8. Mesmo assim, precisa ser conferida com a luta real.

## APROVADA (13/11) — números finais, ainda DESLIGADA

O dono aprovou a proposta com dois acréscimos: montaria +2 a +3% por estrela, e o teto diário de XP de abate ligado (depois do teto, ouro e itens
seguem normais). Simulação refeita com `node tools/sim-paredes.js --json`:
- nível 120 com a curva 1-100 de hoje (`Sys.level.setCap120`);
- teto de XP de abate (`Sys.level.setKillCap`);
- montaria por estrela (`Sys.mount.setStarFlat`);
- o equipamento vem da era da FASE onde o jogador está.

| Perfil | Fim das 9 eras | Dias parado em parede | Dias abaixo de 90% da FC pedida |
|---|---|---|---|
| Grátis ativo | dia 180 | 29 | 7 |
| VIP 5 | dia 139 | 19 | 18 |
| VIP 10 | dia 121 | 17 | 14 |
| Não forja nem evolui o pet | trava (só passa o Senhor da Era 5 no dia 207, para na fase 61) | 31 | 58 |

**Paredes do grátis (Senhor da Era):** 1 dia (era 1), 2 (era 2), 2,7 (era 3) e 3 dias nas eras 4-8. O chefe do meio segura de 10 h a 2 dias.
**Montaria +1★:** passa a dar +2,4 a +2,5% (antes +0,2%).

**Exceção:** na era 5, o VIP 5 e o VIP 10 passam o Senhor da Era sem parar. Eles chegam ao nível 85 (raridade nova) antes. Nas outras eras eles param de 16 h a 3,5 dias.

**Pet:** na tela de pets aprovada (17b), evoluir não dá poder na hora; libera mais níveis, e o ganho vem de alimentar depois. O Servidor mediu
0 de FC ao evoluir, e isso é o esperado. A dica "o que fazer" mostra "alimentar" quando o pet está abaixo do teto do estágio.

**Onde estão os números:** docs/balance.json, bloco `dificuldade`, com `on:false`:
- `recFc`: as 90 FC pedidas;
- `boss`: 32 s / 40 s e fúria ×4 aos 40 s;
- `commons`: 50%;
- `walls`: as paredes;
- `killXpCap` e `mountStarFlat`: as duas regras do dono.

Quem liga é o Engenheiro, depois que o QA medir no jogo real.

### Ajuste (13/11): o VIP também para em toda era

Pedido do dono, via PO. No Senhor da Era das eras 1-8, a FC pedida passa a ser a **maior** entre duas:
- a do calendário do grátis;
- a que o VIP 5 ou o VIP 10 terá **12 h depois de chegar**.

Quando a FC do VIP fica parada nessas 12 h (sem subir de nível), ele espera até o próximo crescimento.

Resultado:
- **VIP:** para de 16 h a 3,5 dias em todos os Senhores da Era 1-8. Na era 5 são 1,1 dia (VIP 5) e 1,5 dia (VIP 10).
- **Grátis:** continua terminando no dia 180, mas espera 5,3 dias no Senhor da Era 5 (antes 3). Ao todo são 32 dias em paredes e 5 dias abaixo de 90% da FC pedida.
- **VIP 5 e VIP 10:** continuam terminando nos dias 139 e 121.
- **Quem não forja nem evolui o pet:** trava na fase 60.

### Ajuste (13/11): evoluir o pet dá FC na hora

Pedido do PO; o dono quer a evolução como caminho para vencer a parede. Hoje (tela 17b), evoluir só libera níveis.
- **Regra nova:** com `Sys.pet.setStageMult(true)`, a parte do pet vale ×0,8 no filhote, ×0,9 no adulto e ×1 no evoluído.
- **O pet evoluído no topo fica igual ao de hoje.** Cada evolução soma +11 a +12,5% na parte do pet, cerca de +2% de FC na hora.
- **Curva de 180 dias refeita:** mesmos fins (grátis no dia 180, VIP 5 no 139, VIP 10 no 121); quem não forja nem evolui o pet trava na fase 60.
- **Números:** as FC pedidas mudaram pouco (estão no balance.json). A chave fica no bloco `dificuldade` como `petStageMult` e liga junto com as outras.
