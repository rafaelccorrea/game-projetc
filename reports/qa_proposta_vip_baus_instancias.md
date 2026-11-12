# Proposta do dono (via QA): VIP, loot em campo, baú de toque, instâncias

## 0. DECISÃO DO DONO (substitui o contrato V2 neste ponto)
Skins continuam SÓ VISUAIS (nunca dão atributo) e passam a ser ANIMADAS. Mas o VIP e a montaria DÁEM PODER:
é um jogo de poder: mais atributo = coleta mais, ganha mais XP, fica mais forte. Atualizar CONTRATO_V2 ("só skins monetizam / sem atributo")
para: "skins = visual; VIP e montaria = progressão de poder".

## 0b. VIP 1 a 9 (limite 9) e montaria
- Níveis VIP 1..9 por acúmulo de gasto/pontos VIP. Cada nível dá: % de ATK/HP, % de ouro e de XP, mais ganho offline, mais baús/chaves.
- Skin exclusiva por marco: VIP1 = skin Épica, VIP5 = skin Lendária, VIP9 = skin "Mítica" (topo, a mais bonita, animada).
  DECIDIDO PELO DONO: criar um tier NOVO acima do Lendário (r4), chamado "Mítica" (r5, topo). O "Mítico" atual (r3) continua como está.
  Atenção ao nome parecido (Mítico r3 x Mítica r5): usar cor/ícone bem distintos (ex.: Mítica = arco-íris/prisma ou branco-dourado animado).
  Mítica só sai do VIP9 (não entra em invocação/drop). Afeta RAR, SKINS, tierOf (T3 novo), brilho/tinte, assets de herói/arma T3.
- Skins animadas: idle com movimento próprio (aura, partículas, capa/cachecol), animação melhor conforme a raridade; sem dar atributo.
- Montaria: animal que o herói monta (um por era/raridade, com visual animado). Dá FC (força de combate) extra, ou seja, atributo real.
  Obtida por invocação/VIP/evento; sobe de nível. Herói montado corre mais rápido (liga com A3: herói andando).
- FC (força de combate): número único no HUD somando ATK, HP, montaria e VIP. Serve de meta e de comparação.

## 1. Benefícios VIP de conveniência (somam com os atributos da seção 0b; no protótipo só S.vipLvl, sem dinheiro real)
- Diamantes: bônus diário (ex.: 30💎/dia, resgatar com toque).
- Ganho offline x2 e limite de acúmulo offline maior (ex.: 8h -> 16h).
- Auto-ultimate (ligar/desligar) e velocidade de batalha x3 (free tem x1/x2).
- Mochila maior (60 -> 100) e 2º conjunto de equipamento trocável com um toque.
- 1 invocação grátis por dia e 1 oferta extra na loja diária.
- Baú VIP diário extra e baú de batalha com mais itens.
- Visual: moldura/ícone VIP, nome dourado, 1 skin mensal exclusiva (só visual).
- Aba/botão VIP no HUD com benefícios e status "ativo até DD/MM".

## 2. Loot caindo na batalha (jogo normal correndo)
- Inimigo morre -> moedas (e às vezes 💎) saem como pickups que pulam e voam para o HUD sozinhas; toque coleta na hora.
- Contador flutuante "+N" agrupado para não poluir a tela da horda.
- Drop de equipamento aparece como item brilhando (cor da raridade) e é coletado do mesmo jeito.

## 3. Baú de toque
- Barra do baú enche a cada abate; cheia -> baú pulsando no canto da batalha.
- Toque abre: 3 a 5 itens aleatórios (raridade pela tabela de drop da era), animação curta + som.
- Free: 1 baú por X abates; VIP: baú maior/mais rápido. Sem bloquear o jogo: pode ficar acumulado (máx. 3).

## 4. Instâncias (dungeons)
- Entradas diárias por chave (free: 3 chaves/dia; VIP: +2). Tipos: Ouro, Equipamentos, Chefe de era, Diamantes (pequeno).
- Cada instância é uma horda cronometrada, recompensa fixa por dificuldade; dificuldade escala com a era liberada.
- Entrada na tela cheia do celular, sem scroll (ver A2 em reports/qa.md).

## 5. Outras formas de ganhar FC (pedido do dono: só batalhar cansa)
Fontes de FC hoje: equipamento (drop/invocação/upgrade), VIP, montaria. Novas:
- PRÁTICAS (treino): pedras de prática caem na batalha, baús e instâncias. Gastar pedras sobe trilhas de prática
  (ex.: Força, Vitalidade, Precisão/Crítico, Defesa, Coleta). Cada nível dá atributo permanente e custa mais pedras; tem teto por era
  liberada (para o jogador não pular a progressão). Tela de práticas em grade, sem scroll.
- TORRE: andares em sequência, cada andar é um desafio contra boss ou contra um "fantasma" de outro jogador (snapshot).
  Vencer dá atributo e pontos de torre; marcos de andar dão TÍTULOS. Dificuldade sobe a cada andar; derrota não perde nada, só tenta de novo
  (limite de tentativas/dia para não virar grind infinito).
- TÍTULOS: colecionáveis por conquista (torre, arena, missões, eras). Cada título dá atributo fixo; 1 título equipado de destaque
  mostra no perfil e dá bônus maior. Lista em grade.
- ARENA (PvP, ranking): luta contra o time/snapshot de outros jogadores, assíncrona e automática. Pontos sobem/descem.
  Recompensa semanal por posição: 1º ao 3º = item raro (ou skin/pedra rara); 4º ao 10º = outras recompensas (pedras, diamantes,
  chaves); demais por faixa. Reset semanal do ranking.
- Todas alimentam o número de FC do HUD e aparecem num painel "Como ficar mais forte" (atalhos para cada fonte).
- AVISO TÉCNICO: ranking real e snapshots de outros jogadores exigem servidor (backend). Já está pendente no relatório do engenheiro
  (leilão também). No protótipo: arena e torre contra bots/fantasmas locais gerados pela FC do jogador, com a interface pronta para
  trocar por dados reais depois.

## Ordem sugerida
1) A1-A4 do qa.md  2) loot em campo + baú de toque  3) instâncias  4) VIP/montaria/Mítica
5) práticas (pedras) e títulos  6) torre (bots)  7) arena (bots; PvP real só com backend).
