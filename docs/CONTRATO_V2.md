# Eonbound — Contrato V2 (combate, som, efeitos, mobile). LEIA TAMBÉM docs/STYLE_E_CONTRATO.md

Jogo: RPG idle mobile 2D, retrato, 7 eras (0 Pré-História … 6 Futurista). Jogador começa do ZERO (era 0, itens básicos).
Só skins são monetizadas; skins NUNCA dão atributo. Tudo deve ser pensado primeiro para celular (S24 Ultra, toque, retrato).

## Combate V2: 3 ataques por arma (a arma = era da skin de arma equipada define visual/som; dano vem do item)
| Slot | Nome | Como dispara | Dano | Sensação |
|---|---|---|---|---|
| s1 | Ataque básico | automático (~0,8 s) | 1x | golpe/tiro rápido |
| s2 | Especial | recarga ~6 s; automático, ou toque no botão | ~3x | multi-golpe/rajada, efeito médio |
| s3 | Ultimate | barra de energia enche ao bater/apanhar; toque no botão (ou Auto) | ~10x | tela treme, câmera lenta curta, efeito grande temático |

Nomes (s2 / s3) por era:
0 Golpe Sísmico / Fúria do Mamute · 1 Estocada Tripla / Ira do Olimpo · 2 Corte Giratório / Lâmina do Dragão ·
3 Tiro Duplo / Salva de Canhões · 4 Rajada a Vapor / Tempestade Tesla · 5 Rajada Tática / Ataque Aéreo ·
6 Corte de Plasma / Colapso do Vazio
A cor dos efeitos segue a raridade da skin de arma (r0 branco, r1 azul, r2 roxo, r3 vermelho, r4 dourado). Só visual.

## Donos de arquivos (ninguém escreve fora da sua área)
- ENGENHEIRO: index.html, js/ (exceto js/audio.js), test/. Único que edita index.html.
- ÁUDIO: assets/audio/**, js/audio.js, reports/audio.md
- RIG (mão+arma): assets/hero/anchors.json, assets/weapons/meta.json, assets/weapons/era1_t0.png e era3_t0.png (refazer), reports/rig.md
- FX/ÍCONES: assets/fx/**, assets/icons/**, reports/fx.md
- UX/PESQUISA: docs/RECOMENDACOES.md, docs/balance.json, manifest.webmanifest, sw.js, assets/pwa/**, reports/ux.md

## Áudio (contrato)
```
assets/audio/music/era{0..6}.mp3     trilha+ambiente em loop (20-40 s, loop limpo), clima da era
assets/audio/music/title.mp3         tema da tela inicial
assets/audio/sfx/era{E}_s1.mp3 _s2.mp3 _s3.mp3   som de cada ataque da arma da era (curtos: s1 <0,5 s; s2 ~1 s; s3 ~2-3 s)
assets/audio/sfx/hit.mp3 crit.mp3 hero_hurt.mp3 enemy_die.mp3 boss_appear.mp3 defeat.mp3 coin.mp3 gem.mp3
                 ui_tap.mp3 upgrade.mp3 summon.mp3 legendary.mp3 era_change.mp3 ult_ready.mp3 claim.mp3
assets/audio/manifest.json           {"music":{...},"sfx":{...}} só com o que existe de fato (+ volume sugerido por som)
js/audio.js  expõe window.GameAudio = { init(), unlock(), setEnabled(bool), music(key), sfx(name, opts), stopMusic() }
```
GameAudio: tolera arquivo faltando (fallback sintetizado em WebAudio), destrava no primeiro toque (mobile), pausa quando a aba
fica oculta, limita sons simultâneos, respeita o botão de som. O engenheiro chama `window.GameAudio?.sfx('era3_s2')` etc.

## Rig mão+arma (contrato)
assets/hero/anchors.json: {"era2_t0":{"hand":[fx,fy],"handR":r,"angle":graus}} — centro do punho direito, raio do punho (fração
da largura) e ângulo natural do antebraço. assets/weapons/meta.json: {"era2_t0":{"type":"melee|gun","grip":[fx,fy],
"angle":graus,"len":fração}} — ponto exato onde a mão segura, medido NA IMAGEM ATUAL (weapons agora têm 1024px, hero 512px).
O engenheiro desenha a arma atrás do punho e redesenha o recorte circular do punho por cima (mão "segurando" a arma).

## FX e ícones (contrato)
```
assets/icons/era{E}_s1.png _s2.png _s3.png   ícones dos 3 ataques (256x256, transparente, moldura redonda, estilo do jogo)
assets/fx/slash.png  muzzle.png  hit.png  crit.png  aura.png      efeitos genéricos BRANCOS/claros (o jogo tinge), transparentes
assets/fx/era{E}_ult.png      efeito grande da ultimate da era (transparente, ~1024px, sem personagem)
assets/fx/meta.json           tamanhos/âncoras sugeridos
```
Sprites de efeito devem funcionar sobre qualquer cenário; fundo transparente removido LOCALMENTE (Higgsfield limita 8 jobs
simultâneos na conta: no máx. 2-3 jobs seus ao mesmo tempo; ferramentas locais com sharp em C:\Users\rafae\AppData\Local\Temp\tools).

## ORDEM DO DONO (vale acima do resto): NADA ENTRA LIGADO NO JOGO SEM A APROVAÇÃO DELE
Só fica ligado o que está "aprovado" no banco da página de arte ou nas telas marcadas APROVADA no canvas. Arte e
telas não votadas ficam DESLIGADAS por chave no código (prontas para ligar com uma linha); o PO só manda ligar depois
do voto. APROVADO hoje: Kael de hyb/R (corrida, parado, golpe da mão direita) e corrida sem arma; corridas do Goblin e
do Esqueleto; cenários das eras 0 e 2; aura +13; as 8 músicas e todos os sons; telas 00 Carregamento, 05 Equipamento,
06 Invocar e 07 Loja. Conferido pelo QA no banco "decisoes" (a fonte), também APROVADOS: folhas de ATAQUE da era 2
(Goblin, Esqueleto, Dragão); ULTIMATE ANIMADA da era 2; auras +4, +7, +10 e +13; peças de cabeça head-hair_bun,
head-hair_spiky e head-hat. DESLIGADO até o voto: dano (hurt) e morte (die) de todos os inimigos; andar e ataque das
eras 0 e 1; ultimates animadas das eras 0 e 5; cenário da era 1. REPROVADOS, nunca aparecem: ossos, modular mod-a/b/c,
golpe da mão esquerda (hyb-attack), os 13 sons antigos. Enquanto isso vale o provisório aprovado: pés no chão,
avanço de até 12 px, efeito em código. Regras e balanceamento aprovados continuam.

## DESENVOLVIMENTO LIBERADO PARA O QUE ESTÁ APROVADO (ordem do dono via PO)
Em execução pelo engenheiro da fps-c9, nesta ordem, cada entrega indo ao QA (fps-0b) para comparar com protótipo e spec:
1) tela de CARREGAMENTO (protótipo 00: Kael correndo sem arma atravessando as eras, barra, dicas, "Toque para continuar");
2) cenários VIVOS das eras 0 e 2 (EonScene + assets/bg/v2); 3) Kael na batalha com as folhas híbridas aprovadas
(corrida e golpe da mão direita em assets/anim/hyb/R; parado: híbrido antigo); 4) áudio aprovado (8 músicas, 21 sons;
os 13 reprovados silenciados); 5) balanceamento v5.1 (as 8 mudanças do docs/balance.json).
Na etapa 5 entram também Sys.loot e Sys.chest (js/sys, fps-30; roteiros em reports/sys-loot.md e sys-chest.md), com o
botão do baú na borda ESQUERDA da batalha, como no protótipo 04. Instâncias, forja, práticas, títulos, torre e pet
esperam a tela de cada um ser aprovada no canvas; o PO avisa cada aprovação e o engenheiro liga no mesmo dia.
Regras: pés na linha do chão, nada flutuando, velocidade máxima x2. Telas novas (Login, Batalha etc.) seguem esperando
aprovação no canvas. O texto abaixo vale para tudo o que NÃO está nesta lista.

## NÍVEL DO JOGADOR 1-100 e PORTÕES DE RARIDADE (sistema novo pedido pelo dono; spec do PO; simulação v6 em andamento)
XP por abates, chefes, instâncias, missões e offline. Curva íngreme: ~nível 25 no fim da era 2, ~70 no fim da era 4/5,
100 só perto do fim do jogo (~dia 61). Nível dá +0,3% de ATK/HP por nível e libera funções (torre, instâncias, forja
etc.). HUD: "Nv. X" com barra de XP no avatar.
PORTÕES DE RARIDADE (drop, baú, invocação e instâncias): Básico sempre; Raro nível 10+; Épico nível 25+; Mítico nível
70+ E era 4 ou acima; Lendário nível 85+ E era 5 ou acima. Abaixo do portão, o sorteio vira a raridade permitida mais
alta. Vale para o Chefe de Era Difícil e para ovos de pet (Mítico/Lendário com o mesmo portão); a fênix do andar 100 da
torre continua como marco. Nunca cair Mítico ou Lendário no começo do jogo.

## REGRAS NOVAS DO DONO via PO (balanceamento v7; a lógica pode começar a ser desenvolvida; telas a aprovar)
ATENÇÃO: os itens A e D SUBSTITUEM a regra original "só skins monetizam, skin nunca dá atributo, sem pay-to-win".
A) VIP só por COMPRA. Por ora uma flag "vip" no save e um botão "Comprar VIP" que só abre a tela, sem cobrar.
   Benefícios provisórios (v7): +10% de ATK e HP; +50% de XP e ouro; offline em dobro; teto do baú de 8 para 12 por dia;
   +1 chave de instância por dia; velocidade x3 liberada. Meta: VIP termina em ~40-45 dias (grátis ~61).
B) 7 ESPAÇOS DE EQUIPAMENTO: ARMA, COLETE, CHAPÉU/ELMO, LUVAS, BOTAS, COLAR e ASA (a asa abre no nível 50 e só existe
   Épica ou acima). Cada item tem era, raridade, nível do espaço e fortalecimento (no espaço).
C) ATRIBUTOS: ATK, HP, DEF, Chance de Crítico, Dano Crítico, Velocidade de Ataque. Principal por espaço: Arma = ATK;
   Colete = HP + DEF; Chapéu = HP; Luvas = Crítico + ATK; Botas = Vel. de Ataque; Colar = Dano Crítico; Asa = ATK% + HP%.
   Itens Raro+ ganham 1 atributo secundário sorteado; Épico+, 2.
D) SKIN DÁ PODER: skin equipada dá +2/+3/+5/+7/+10% de ATK e HP por raridade; cada skin possuída dá +0,5% de coleção
   (teto +10%).
E) DANO: ATK_total = (ATK do nível + soma do ATK fixo dos itens) × (1 + soma dos %: skin, coleção, práticas, títulos,
   pet, montaria, VIP). Golpe = ATK_total × multiplicador da habilidade × (1 + Dano Crítico, se critar) × (1 − redução
   da DEF do alvo). FC = função única de todos os atributos, a mesma em todo o jogo.
F) Tirar e colocar item ou skin recalcula atributos e FC NA HORA (sem cache). RANKING de FC: cada troca grava a FC atual;
   o ranking semanal usa a MAIOR FC registrada na semana.
DECISÃO DO DONO sobre a venda de poder: VIP e skin dão poder, mas só por COMPRA DIRETA ou pelo PASSE. NUNCA sorteio
pago: sem invocação de skin por gemas compradas, sem ovo pago. Os títulos de coleção continuam cosméticos.
NOTA PARA A PUBLICAÇÃO: declarar nas lojas as compras que dão vantagem.
Arte dos 7 espaços, versão barata aprovada (~48 créditos, fps-ff): 49 ícones por espaço e era, com a raridade na moldura
e no brilho; 4 chapéus e 3 asas por imagem rastreada; colar por código; luvas e botas recoloridas por código; colete =
roupa da era; Kaia 14.
FORMATO FINAL DO ITEM (igual no loot.js da fps-30 e no stats.js da fps-e2): {slot, r, e, lvl, gold, subs:[{k, q}]} mais
o id posto pelo jogo. slot: weapon, armor (colete), hat, gloves, boots, necklace, wing. r 0-4; e 0-6; lvl 1-100 do ITEM
(teto = nível do jogador); gold = ouro investido em melhorias. subs: k ∈ atkPct, hpPct, defPct, critRate, critDmg, aspd,
todos em %; Raro 1, Épico+ 2; distintos e nunca iguais ao principal do espaço; q 0..1. Atk/hp/def planos só no
principal (Sys.stats). Fortalecimento no espaço (Sys.forge). Asa só nível 50+ e Épica+.
Desmontar: Sys.loot.dismantle devolve 50% do item.gold (pedras de forja por raridade aguardam o PO).
Invocação em ouro: x1 = 300·4^era, x10 = 9×, 1 grátis por dia; tabela 50/28/14/6/2 com portões; só itens.
Responsáveis: fps-e2 (FC, atributos, fórmula, skin, VIP), fps-30 (drops dos 7 espaços com portões), PO (telas de
Equipamento e de VIP), fps-c9 (simulação v7 e ligação no jogo).

## FARM NO AUTO (ordem do dono via PO; números na simulação v6)
Cada abate DROPA no chão moedas e orbes de experiência, com valores BAIXOS por abate e muitos abates, que voam para o
HUD; a quantia sobe com a era e a fase. O jogo deve incentivar ficar farmando para subir de nível. Alvos de nível:
10 na era 0, ~25 no fim da era 2, ~70 no fim da era 4, 100 perto do fim. Engenheiro, depois da v6: pickups animados no
chão (moeda girando, orbe de XP pulsando) voando ao contador, com o agrupamento "+N" do Sys.loot.

## HEROÍNA "KAIA" (ordem do dono via PO)
Versão feminina do herói, escolhida na criação do personagem (Kael ou Kaia), com as mesmas regras (cachecol vermelho,
armas trocáveis). No lançamento: roupa base animada (corrida, parado, golpe); as roupas de era dela vêm em atualização
(tamanho a confirmar pelo dono). Skins valem para os dois. Arte com a fps-ff; tela de criação do personagem a aprovar.

## Simulação v6 (docs/balance.json v6, desligado; medianas de simulação) — nível, portões, farm, 3 atacantes
Grátis termina no dia 61 (53-65) com a dificuldade por era recalibrada. Nível no fim das eras: 11, 17, 26, 43, 73, 87,
100. XP: abate 1, chefe 15, Senhor da Era 120 (× era e fase); instância 25 × dificuldade; missão 30; offline 20 por
hora; abates dão ~89% da XP. Desbloqueios: pet 1, práticas 5, forja 12, torre 15, instâncias 20 (ou 14, para abrir no
dia 1-2), arena 30 (hoje 28: a tabela completa e ATUAL é a do Sys.level.DATA.unlock, fonte única aprovada pelo PO em 2026-11-12; reports/liberacao-por-nivel.md). Dano com 3 atacantes: intervalo 1,2 s e multiplicador 0,33 do comum. Primeiro golem no dia ~23;
metas de estrelas fecham (golem 3,0★ / fênix 2,5★). Antes do nível 25 a garantia de Épico entrega Raro.

v6 APROVADA pelo PO como meta. Ajustes: instâncias abrem no nível 14; a "garantia de Épico" passa a se chamar
"garantia da melhor raridade liberada"; golem no dia ~23 aceito; montaria e otimizador entram na v7.
INVOCAÇÃO: a "Invocar skin" por diamantes SAI do jogo (skin só na loja direta e no passe). A aba Invocar fica só com
ITENS, em OURO: x1, x10 e uma grátis diária (preços com a fps-30).

## MELHORIA DE ITEM (regra nova do dono via PO; SUBSTITUI o "nível 1-60 no espaço"; números na v7)
O NÍVEL VOLTA A SER DO ITEM, de 1 a 100, nos 7 espaços. TETO = NÍVEL DO JOGADOR. Sobe com OURO ou com DIAMANTE (compra
direta, permitida). Item novo começa no nível 1 e precisa ser upado de novo: é o loop do jogo. DESMONTAR um item devolve
50% do ouro investido (diamante não volta). O fortalecimento +0..+15 continua no ESPAÇO. O equipar automático compara a
FC REAL atual; a tela mostra também a "FC no seu nível" do item novo.
Consequência: o docs/balance.json v6 foi calibrado com o nível no espaço; a curva precisa ser refeita na v7.

## TELAS APROVADAS PELO DONO no canvas (https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba) — implementar IGUAIS
00 Carregamento (feita). 05 EQUIPAMENTO (7 espaços, 6 atributos, nível do item 1-100 com teto no nível do jogador, upar
com ouro ou diamante, desmontar devolve 50%, skin com bônus). 06 INVOCAR (em ouro: x1, x10 e grátis diária).
07 LOJA (compra direta, sem sorteio). Lógica: fps-e2 (atributos, FC, nível do item, skin, VIP) e fps-30 (loot,
desmontar, invocação em ouro). O QA confere cada tela contra o canvas.
10 VITÓRIA/DERROTA DO CHEFE: APROVADA (vitória com banner, chefe caído, recompensas uma a uma com som, Coletar e
Próxima fase; derrota com "Faltou força", FC sua x recomendada, atalhos Melhorar arma / Equipar o melhor / Invocar e
Tentar de novo). 16 PRÁTICAS E TÍTULOS: APROVADA (lógica da fps-e2).
ATUALIZAÇÃO DOS VOTOS: a 10 VITÓRIA/DERROTA foi REPROVADA depois (código atrás de chave desligada); a 09 CONFIGURAÇÕES
foi reprovada. APROVADAS depois: 11 TROCA DE ERA (chefe caindo, portal, Kael correndo para a era nova, letreiro,
cartões, "Começar a era") e 12 RANKING (5 abas, pódio animado, prêmios por faixa; sem servidor: dados locais atrás de
uma interface, sem entregar prêmio real). REPROVADAS, em refação: 09, 10, 13 Instâncias, 14 Torre, 17 Pets, 18 VIP.
TELAS APROVADAS HOJE: 00, 03, 04, 05, 06, 07, 08, 11, 12 e 16.
MAIS VOTOS: APROVADAS 15 FORJA e 18 VIP (fila do engenheiro: 08, 16, 11, 12, 15, 18). REPROVADAS (só a tela; a lógica
pode ficar): 13 Instâncias, 14 Torre, 17 Pets. Ranking: fonte local trocável, bots fixos por semana em volta da FC,
SEM prêmio contra bots ("prêmios valem quando o ranking online abrir"). 04b Batalha em tela cheia: no canvas só para
voto; não mexer no layout. PETS (regras do dono para a lógica; ele quer primeiro a arte por era): estrelas = qualidade
do pet; nível = atributos do pet; cada pet tem 3 ataques diferentes e ataca sozinho (automático, sem botão).
PETS, números do dono para a lógica (fps-e2), já com a correção do PO: a cada ataque o pet sorteia BÁSICO ~90% (1x),
CRÍTICO "tiro do pet" ~7% (~5x) ou MEDIANO ~3% (~2,5x) num pet 1★ nível 1; as chances sobem com estrelas e nível
(proposta: crítico até 12% e mediano até 6% no 5★ de nível máximo). Efeitos do pet nunca maiores que as habilidades do Kael (sem tremer a tela, sem
escurecer o fundo). Em aberto com o PO: teto de ~20% da FC com o dano médio maior; nível do pet no espaço ou no pet.
Módulos novos da fps-30 SEM TELA e não ligados: correio (mail.js), login de 7 dias (login.js), eventos (events.js).
TELAS APROVADAS AGORA: 00, 03, 04, 05, 06, 07, 08, 11, 12, 15, 16 e 18. REPROVADAS: 09, 10, 13, 14, 17.
08 PASSE: APROVADA (lógica do Sys.pass da fps-30: nível e XP do passe separados, abas Recompensas e Missões, trilha
grátis e premium com "Ativar Premium" → "Pagamento em breve").
03 INTRO (escolha Kael/Kaia e nome; Kaia como silhueta até a arte dela ser aprovada) e 04 BATALHA (refeita): APROVADAS.
A 04 inclui cenário em camadas, Kael golpeando com a aura, inimigos entrando andando, atacando com a folha, apanhando
e morrendo, moedas e XP voando, "Nível X!", selo "+N", botões nas colunas, AUTO/MANUAL e ultimate animada. Aprovados
junto, no banco: hurt-era2_e0, hurt-era2_e1, die-era2_e0, die-era2_e1 e s2-era2_t1 (Corte Giratório).

## Decisões do PO após a simulação v7 (docs/balance.json v7; os dias valem como PROPORÇÃO: o simulador está otimista,
## o ritmo real de abates na build v0.7 é ~2,2 a 2,5 vezes menor; medir abates por minuto e recalibrar antes de ligar)
1. VIP = OPÇÃO B: +10% de ATK e HP, +25% de XP e ouro, offline em dobro, baú 12 por dia, +1 chave, velocidade x2.
   NÃO existe x3: tirar do jogo e da tela VIP.
2. Item da Temporada do passe NÃO sobe de era (fica na era em que foi ganho; só a raridade evolui até Lendário).
3. Invocação: base 1.000 × 4^era (x10 = 9×; 1 grátis por dia).
4. Custo de melhoria do item cresce 3,5^era (no lugar de 4^era). Desmontar dá pedras de forja 0/1/2/4/10.
5. Botas, colar e asa PASSAM a depender da era (atributo escala com a era, como arma e colete).
6. Botão "Equipar e upar até o meu nível" num toque, mostrando o custo total antes.
Custos de referência (v7): ganho ×1,04 por nível; diamante por nível = teto(2 × 1,04^(N−1) × (1 + 0,6 × raridade)).

## TRANSFORMAÇÃO DE ITEM (sistema novo do dono via PO; simulação v8; tela a aprovar: aba "Transformar" na Forja)
Vale para os 7 espaços. O jogador escolhe um item antigo de que gosta e paga OURO + "Essência da Era" (material novo
dos chefes de era e do Chefe de Era das instâncias). O item vira da ERA ATUAL do jogador, com a MESMA RARIDADE e o
MESMO VISUAL (a aparência antiga é mantida). O nível volta ao 1 (o ouro investido antes não volta); o +N fica no
espaço. Só transforma para a era em que o jogador está (não pula eras). Lógica: fps-e2 (stats) e fps-30 (essência no
loot, custo). Consequência no item: ele passa a ter uma era de poder e uma era de aparência separadas.
FECHADO pelas duas (números de partida para a v8): item = {slot, e, r, lvl, gold, look, subs}; e = era de PODER,
look = era da APARÊNCIA (ausente = e; o sprite usa o look). Na transformação: e → era atual, mesma raridade,
secundários mantidos, lvl → 1, gold → 0, +N no espaço. Essência da Era ÚNICA: Senhor da Era 5 na 1ª vitória de cada
era e 2-3 depois; instância Chefe de Era 1/2/3 por dificuldade (~150 no jogo). Custo por era saltada: essência
1/2/4/7/12 por raridade; ouro 100/300/900/2.500/6.000 × 4^(era de destino). API: Sys.stats.planTransform (devolve
também o que se perde: ouro investido, o que o desmonte daria e os níveis) e Sys.stats.transform. A tela avisa ANTES.

## v7.1 APROVADA pelo PO como meta (docs/balance.json v7.1; simulador calibrado no ritmo da build real, ~24 abates/min
## em x2; a calibração será refeita quando o engenheiro publicar a tabela completa de abates por minuto)
Grátis termina no dia ~59 e VIP opção B no dia ~43. Nível no fim das eras: 12, 18, 27, 45, 72, 88, 100.
XP de abate ×2,2: abate 2,2, chefe 33, Senhor da Era 264. Dificuldade por era refeita (bloco BAL do arquivo).
Decisões: N da fênix por golem repetido 5 → 7 (meta fênix ~2★ no jogador normal); teto de velocidade de ataque 100%;
DEF-base do colete 8 e defK 2; teto de 400% no dano crítico (trava); pedras de forja: o PO aprovou depois subir o
drop do inimigo comum de 0,7% para 1% (no lugar de deixar faltando); a conferir na próxima calibração. LIBERADO ligar a v7.1 no jogo na etapa de balanceamento.
Energia da ultimate NORMALIZADA POR TEMPO: energia por golpe = base × (intervalo atual do básico / 0,8 s), para a
ultimate carregar no mesmo ritmo por segundo com ou sem velocidade de ataque. DEF: remedir a participação na FC na
próxima calibração.

## Decisões do PO na build v0.7.4
Horda: sobreposição frente×meio de até 45% (meio×fundo 50%). Drone da era 5: arte será refeita mais estreita; até lá
mínimo de 80 px e, se não couber, sozinho no slot. Pirata e Tanque seguem espelhados por código.
Protótipos 06 e 07: vale o CONTRATO sobre os textos velhos do canvas (invocar só em ouro, sem abertura automática nem
nível de baú; Loja com o bônus da skin, aba de itens por ouro e "Comprar VIP" com "Pagamento em breve"); o layout
aprovado continua. ABAS: 5 (Batalha, Equip., Invocar, Loja, Passe); Skins vira aba interna da Loja; Missões vira aba
interna do Passe, e o botão de missões da batalha abre o Passe na aba Missões.

## ARTE APROVADA NÃO MUDA (regra do PO)
Arquivo aprovado não muda de conteúdo nem de alinhamento sem novo voto; correção de formato só se o resultado na tela
for idêntico. Folhas animadas: o .json de cada folha diz a verdade sobre o arquivo (w, h, pads, feetY) e o jogo
posiciona os pés pelo feetY. Era 2: h 256, feetY 243. Demais eras (sem voto): h 352, padTop 64, padBottom 32, feetY 307.
## CRÉDITOS (~191 restantes; ordem escolhida pelo dono)
1) ultimates que faltam (fps-ff); 2) cenários de Pólvora, Industrial, Moderna e Futurista (fps-c9, ~72, um por vez,
mesmo padrão); 3) 7 espaços e Kaia (fps-ff). Roupas por era, montarias e pets esperam mais créditos.

## Decisões do PO na build v0.8.1 (7 espaços e telas 05/06/07 no ar)
PRIORIDADE MÁXIMA: o jogador trava no Senhor da Era 0 (medido no jogo real). A v7.3 entra no jogo assim que passar no
teste: jogador novo, AUTO, melhorando sempre, passa o Senhor da Era 0 em até ~20 min de jogo, com no máximo 3 derrotas.
Golpe básico a cada 1,2 s (vale este número; o "0,8 s" de textos anteriores está superado).
Invocação: base 500 × 4^era (x10 = 9×; 1 grátis por dia). Missão "Melhore 5 vezes" só a partir do nível 5 do jogador.
Loja: abas internas "Itens" (ouro) e "Coleção" (mostra o bônus da coleção de skins) ficam; etiqueta "OFERTA" só com
desconto real. Nomes dos itens dos 5 espaços novos por era: fps-30. Transformação: tela no protótipo da Forja, aguarda
o voto do dono; não implementar antes.
TETO DE NÍVEL DO ITEM: vale só para SUBIR o nível; o nível que o item já tem conta inteiro na força (ninguém perde
força com a mudança de regra). Item acima do nível do jogador mostra "Nv 25 (acima do seu nível: não pode subir até
você chegar ao 25)".
SKIN SOMA POR ESPAÇO (skin de arma + skin de roupa): duas Lendárias dão +20% equipado, mais até +10% de coleção.
Cartão da skin: TOTAL grande ("+5% ATK e HP") e, embaixo, menor, "Skins equipadas +4% · Coleção +1%".
Correções aprovadas para a próxima rodada do engenheiro: nenhum texto de desenvolvimento no jogo ("provisório", "SVG",
"em produção"); o aviso de drop nunca cobre rótulo nem cabeçalho; botão sem dinheiro fica apagado (sem brilho nem
pulso) e, ao tocar, mostra "Ouro insuficiente: faltam X".

## v7.3 (aplicada no jogo) e o que vem depois — decisões do PO
v7.3: destrava o Senhor da Era 0 (jogador novo, AUTO, melhorando sempre: 9-11 min, 1-2 derrotas no jogo real). Só 3
chaves do jogo: eraBossHpMult 1,1; eraBossDmgMult 0,9; eraMult 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161.
ATENÇÃO: os prazos (grátis ~59 dias, VIP ~43) NÃO estão validados; a calibração da v7.1 estava errada. As eras 1 e 2
passam por derrota repetida (26 a 100 e ~194 derrotas). Nenhuma promessa de dias antes da calibração no jogo real.
MODO FARM (aprovado): ao perder para o chefe, o jogador volta a farmar sozinho, sem "Derrotado" em laço; o botão
"Desafiar chefe" tenta de novo e brilha quando a FC chega a ~90% da recomendada.
Curva de nível do item da fps-e2 aprovada PARA TESTE: mult(N) = (1 + 0,15·(N−1)) × 1,01^(N−1).
Mochila cheia: desmonta o item mais fraco, não o novo.
DEPOIS do farm e da curva: calibração inteira no JOGO REAL, era por era; XP de abate menor (nível 26-27 no fim da
era 2); era 0 em 15-18 min. Jogador em MANUAL sem usar habilidades não é tratado como parede.
Telas REPROVADAS pelo dono, em refação, não implementar: 11 Troca de era, 12 Ranking, 13 Instâncias, 14 Torre,
17 Pets, 18 VIP (o dono quer níveis de VIP de 1 a 10).

## MUDANÇA DE LAYOUT A CAMINHO (aviso do PO; NÃO aprovado ainda)
O dono quer eliminar a barra de abas de baixo e a faixa de topo: jogo em tela cheia, botões distribuídos em volta
(colunas laterais, cantos), ícones novos (fps-ff). O PO desenha o protótipo "BatalhaTelaCheia". Até o voto: não mexer
na navegação nem no topo; as telas são feitas como PAINÉIS INDEPENDENTES (com botão de fechar), sem depender das abas.

## VELOCIDADE DA BATALHA (regra nova do dono via PO; substitui "x2 para todos" e "VIP sem x3")
x1 para todos no começo. x2: ao comprar QUALQUER VIP, ou, sem VIP, quando o jogador chega ao NÍVEL 15.
x4: só com VIP 5 ou maior E nível 40 ou maior. O botão alterna entre as velocidades liberadas; a bloqueada aparece com
cadeado e o motivo ("x2: nível 15 ou VIP" / "x4: VIP 5 e nível 40"). Calibração: grátis em x1 até o nível 15 e x2
depois; VIP em x2 desde o início e x4 a partir do nível 40 (VIP 5+). Depende dos níveis de VIP 1 a 10 (regra a vir).

## AUTO/MANUAL (decisão do dono via PO)
UMA chave só, no botão AUTO da batalha. AUTO = básico, especial e ultimate saem sozinhos (a ultimate assim que a
energia enche). MANUAL = básico automático; especial e ultimate só no toque. Não existe "ultimate automática" separada.
Dano com 3 inimigos atacando (antes eram 2): compensar na etapa 5 para manter os ~61 dias.

## Critérios de reprovação automática do QA (PO, após reclamações do dono)
1) Inimigo visível no slot sem atacar por mais de 2 s, inclusive os slots 2 e 3 (todo inimigo no slot ataca, ~1,2 s,
   defasado; corpo a corpo avança no chão e volta; os de longe disparam projétil; o de trás ocupa o slot livre).
2) Inimigo pulando ou quicando, pés fora da linha do chão (era 2: folhas de corrida aprovadas; parado só respira).
3) Mais de 3 inimigos visíveis (o resto espera fora da tela com o selo "+N").
6) Tremor de câmera em golpe de inimigo comum (não treme nada; chefe no máximo 3 px só no golpe forte; ultimate
   pode tremer; nunca tremer personagens separados do chão).
7) Inimigo saindo mais de 12 px do seu slot ao atacar (golpe = animação no lugar + efeito de impacto no herói +
   herói piscando; os de longe com projétil).
   Geometria: tela 390x844; HUD 0..64; campo 64..768; abas 768..844; linha dos pés em y=613 da tela (0,78 do campo).
   Comuns: centros 222/282/338; sobreposição máx. 40% (frente-meio) e 50% (meio-fundo); altura mín. 95/95/85 px
   desenhados; tudo em x=8..382. Chefe: caixa 190..382 (até 170 para os largos), mín. 150, alvo 180.
5) Qualquer personagem de costas para o adversário: herói SEMPRE olhando para a direita, inimigos SEMPRE para a
   esquerda. Sprite que vier virado é espelhado por código (flag por sprite) e listado para a arte corrigir na fonte.
4) Efeito de habilidade ou ultimate como PNG parado. Provisório aprovado: efeito por partículas em código, com
   identidade por era (tremor, clarão, partículas, números, inimigos piscando), até as folhas animadas da fps-ff.

## DESENVOLVIMENTO CONGELADO (ordem do dono)
Nada novo é desenvolvido até o dono aprovar cada funcionalidade/tela com o PO e o design, que avaliam a viabilidade antes.
Até lá: só estabilizar o que já existe, especificar (sem código) e prototipar telas. A fila abaixo é lista de AVALIAÇÃO,
não de execução. Itens a avaliar incluem também ranking. Insumos: docs/RECOMENDACOES.md, docs/balance.json, reports/*.

## BLOQUEADOR DO DONO: animação de personagens (avaliar com PO antes de qualquer outra coisa)
Hoje cada personagem é uma imagem parada movida por transformação: tudo parece estático e a corrida vira "pulinho".
O dono reprovou. Aceite: caminhada com pernas alternando e pés no chão, idle, ataque com o braço da arma, dano e morte,
para herói (todas as skins), inimigos e chefes. Opções a avaliar: (A) recortes com ossos; (B) quadro a quadro a partir de
vídeo gerado em fundo verde; (C) híbrido. Exige prova com 1 herói + 1 inimigo antes de escalar para os 42 personagens.

## PROCESSO (decisão do dono via PO, fps-98)
Ordem obrigatória: 1) ARTE aprovada item a item pelo dono em https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19 (o que ele
reprovar sai do jogo); 2) TELAS (canvas de protótipos); 3) DESENVOLVIMENTO; 4) QA.
Ninguém gera arte nova nem implementa tela antes da aprovação correspondente.

## Decisões do dono via PO
- MONTARIA DÁ PODER: confirmado. VIP com poder e tier "Mítica": ainda sem resposta (seguem pendentes, ver abaixo).
- AURA DE FORTALECIMENTO (estilo DDTank): aura ATRÁS do herói conforme o nível de fortalecimento da arma. Proposta:
  +0-3 sem aura, +4-6 azul, +7-9 roxa, +10-12 chamas vermelhas, +13-15 dourada com raios. Arte final só depois da
  aprovação, com a fps-ff. Implica nível de fortalecimento da arma até +15 (hoje o item tem nível 1-50: definir a relação).

## Fortalecimento +0 a +15 (base APROVADA pelo PO; não implementar até liberar)
O +N fica no ESPAÇO da arma/armadura (não no item); sistema separado do nível 1-50; entra na FC; material próprio (Pedra de
Forja, separada das pedras de prática) vindo de chefes, instâncias e torre; nada vendido por gemas até a decisão do VIP;
teto por era +6/+9/+12/+15; faixas da aura em +4/+7/+10/+13. Specs: reports/spec-fortalecimento.md (fps-e2) e
reports/spec-loot-bau-instancias.md seção 4 (fps-30).
DECIDIDO pelo dono: a falha é permitida, SEM perder nível, com garantia acumulada (cada falha aumenta a próxima chance).
A queda de nível da proposta da fps-e2 sai.

Tabela única de chances, custos (~512 pedras até +15, garantia +5 por falha, bônus até +93%) e fontes: reports/spec-fortalecimento.md.

## ESCOPO DE ARTE DO MVP — VERSÃO ATUAL (2ª revisão do PO, para caber no saldo, sem comprar créditos)
Herói modular: 10 roupas, 5 cabelos, 5 olhos, 4 chapéus.
Arma Mítica no lançamento: todo sorteio de ARMA que daria Mítico vira Épico (pesos 70/22/7,6/0/0,4), e a skin de arma
Mítica sai do lançamento; ambas voltam na atualização com as 7 armas que faltam. Armadura continua com as 5 raridades;
com só 10 roupas, a raridade da armadura aparece pela cor da borda e da aura, não por roupa nova.
ESCOPO DO HERÓI (PO; o modular por ossos morreu; vale a técnica híbrida aprovada) — substitui "10 roupas, 5 cabelos,
5 olhos, 4 chapéus" acima: ARMAS trocáveis livremente (a mão vem do .json), sem custo por arma. ROUPAS: 7 no
lançamento, 1 por era; cada uma = 1 conjunto de vídeos (corrida, parado, golpe), ~14 créditos. CABELOS, OLHOS e
CHAPÉUS: a confirmar, dependem de uma prova da fps-ff (cabeça rastreada por quadro, até 8 créditos).
Definitivos no jogo: parado de hyb/R, sons de assets/audio/_new/, cenário da era 0 ligado.
LIVRO DE APROVAÇÕES (banco da página do dono, lido pelo QA e conferido pelo PO; resumo em reports/qa.md; o banco é a fonte):
aprovados o cenário da era 0 (cena-era0-v2, 12/11 12:49Z) e o da era 2; Kael híbrido da mão direita inteiro (hybR:
corrida, PARADO e golpe, tiers 0 a 2); os 13 sons refeitos de assets/audio/_new/ (total 36 sfx + 8 músicas; som sem
"aprovado" não entra); aura +13. O dono escolheu animação por QUADROS e reprovou ossos e o Kael modular.
RESULTADO DA PÁGINA DE APROVAÇÃO DO DONO (registro anterior):
- APROVADOS: corridas (Kael por quadros e híbrida, Goblin, Esqueleto), Kael parado (híbrido), golpe da mão direita,
  CENÁRIO MEDIEVAL NOVO (assets/bg/v2/era2, congelado), as 8 músicas e 21 sons.
- REPROVADOS, sons a refazer (fps-ff): claim, defeat, hero_hurt, hit, ult_ready, upgrade, era0_s1/s2/s3, era1_s3,
  era4_s2/s3, era6_s3.
- Cenários das outras 6 eras LIBERADOS no padrão do Medieval (~18 créditos cada), um de cada vez, cada um enviado ao PO
  para a página; se o dono reprovar algum, parar.
28 armas no lançamento (7 novas em vez de 14; a Mítica de cada era vem depois). 7 ultimates (1 por era).
2 montarias. 21 inimigos. O golpe da mão direita foi aprovado pelo dono.
PETS: 15 na spec (3 tipos x 5 raridades); 5 NO LANÇAMENTO, como fase 4 (lobo, coruja, dragãozinho, golem de cristal,
fênix); 10 em atualização. O nível do pet fica no espaço (compartilhado entre pets).
Cenários: as outras 6 eras com a fps-c9 (~108 créditos), só depois de o dono aprovar o Medieval.
Esta seção substitui os números do plano abaixo onde divergirem.

## PLANO DE CONTEÚDO DO MVP (decisão do dono via PO) — ~557 créditos, tudo animado, em fases
Fase 0: prova modular do Kael. Fase 1: herói modular + 35 armas. Fase 2: 14 ultimates + 3 montarias.
Fase 3: 21 inimigos (comuns por ossos, chefes por vídeo). Cada fase passa pela aprovação do dono antes da próxima.
Arte com a fps-ff. Desenvolvimento segue parado. Impacto no código quando liberar: 35 armas (hoje 7 formas x 3 tiers),
14 ultimates (hoje 7), herói em camadas (hoje 1 sprite por era/tier) e montaria.

## REGRA GERAL DO DONO: "tudo que for estático, eu não vou aprovar"
Vale para QUALQUER entrega de arte ou de jogo: só se leva ao dono uma prévia ANIMADA (personagem, arma, ultimate, efeito,
aura, cenário, tela). Substitui as regras pontuais abaixo.

## Feedback do dono (via fps-30, já com o PO e a fps-ff)
"Nada estático": armas animadas em idle e ataque, ultimates animadas; ele só aprova vendo em movimento.
REGRA: "Se for PNG, não vou aprovar." Ultimate, arma e efeito só vão à aprovação ANIMADOS (quadros, partículas ou vídeo em
loop); imagem estática é reprovada automaticamente. As 7 ultimates e os 5 efeitos atuais em assets/fx são imagens paradas.
CENÁRIOS REPROVADOS: o dono reprovou os cenários das 7 eras ("esquece, sem condição de aprovar"). Os fundos voltam para
refazer, animados e em camadas; o plano de conteúdo precisa ganhar uma fase de cenário (com o PO). assets/bg é da fps-c9.
AURAS REPROVADAS: o dono reprovou todas as auras ("todas péssimas, sem condição"). A arte de aura (fortalecimento e tier de
skin) volta para refazer, animada, com a fps-ff. A regra do fortalecimento continua aprovada como spec.
"Muito raso até para MVP": poucas armas, ults e skins; quer cabelo e chapéu trocáveis; falta montaria.

## Eras, skins e armas (regra do dono, APROVADA COMO SPEC pelo PO; implementar só quando liberar) — reports/regra-eras-skins-armas.md
Skin de roupa padrão ao entrar na era; skin de arma padrão ao conquistar a 1ª arma da era.
Trocar de era NÃO troca a skin: o jogador ganha a skin padrão da era (equipar é opcional). A arma se conquista.
A ERA MANDA MAIS QUE A RARIDADE: Lendária da era N < Básica da era N+1. O código atual quebra isso (poder x6 por era
contra Lendário x10). Proposta: fator 12 por era, recalibrando inimigos (~1,282 por fase) e preços; isso invalida
docs/balance.json, que terá de ser refeito sobre a regra nova.

## Balanceamento (decisões do PO, como SPEC; nada no código até a aprovação das telas) — docs/balance.json v2
1. Nível de melhoria 1-50 fica no ESPAÇO do equipamento, como o fortalecimento (+8% por nível, custo +19%).
   Épico garantido a cada 10 invocações.
2. Curva-alvo: jogador grátis termina em ~64 dias (40 min/dia), era 0 no dia 1.
3. Pedra de forja: drop comum ~0,7%; teto por era mantido. A armadura também é fortalecida.
4. Missão "Fortaleça 1 vez" vira "Colete 5 pedras de forja".
5. SKIN NÃO MEXE EM PODER: número de golpes do Especial e alcance vêm da arma ITEM equipada, nunca da skin. Skin de arma
   só pode ser vestida em item do mesmo tipo (corpo a corpo com corpo a corpo, tiro com tiro).
6. Velocidade máxima x2.
7. Decisões do PO após a simulação 3 (docs/balance.json v3), meta final ~61 dias para o grátis:
   práticas 0,5% de ATK/HP por nível, teto de 10 níveis por era; pedra de prática 8% no drop comum; missão "Colete 15
   pedras de forja" (substitui o item 4); ração do pet: comum 0,4%, baú "10% de 1", offline 10; baú de toque: 1 a cada 250 abates, TETO
   DIÁRIO de 8 (depois a barra para e mostra "volte amanhã"; o VIP poderá subir o teto); nível máximo de melhoria 60;
   fênix recalculada com onda de ~11 s e cura 0,6·p, acima do golem; montaria compensada subindo a dificuldade por era;
   era 0 em ~18 min.
8. Decisões do PO após a recalibração v4 (docs/balance.json v4): META GERAL APROVADA ~62 dias, era 0 em 17 min.
   VERSÃO ÚNICA do PO para os pets: repetido em 5★ vira ovo da raridade acima (até o Mítico); golem (Mítico) repetido
   dá ESCOLHA: "+10 fragmentos de golem" ou "+5 fragmentos de fênix" (N = 5; em 5★ vira fênix automaticamente). A subida
   Épico→Mítico continua. META do grátis: ~golem 3★ + fênix 2-2,5★; 4★ é longo prazo. Instância Chefe de Era com Mítico
   12% (tabela 34/35/18/12/1; Lendário 1% só no Difícil; Difícil todo dia levando a fênix a ~4,9★ é prêmio aceito).
   Torre: 1 fragmento de fênix por andar, do 101 ao 110. Fragmentos de fênix ganhos antes do andar 100 ficam GUARDADOS e
   entram quando ela nasce; a tela do pet mostra "Fênix: X fragmentos guardados, nasce no andar 100 da torre".
   Pet no teto de nível cedo nas eras 0-1: aceito, não mexer.
   v5.2 (jogador "otimizador" do Chefe de Era Difícil): no máximo 1 ovo de instância por dia; sorte de +1 do Difícil
   10%; fênix repetida em 5★ vira 10 fragmentos de golem; escolha do golem repetido é preferência salva
   (auto/golem/fênix); e OVO DE INSTÂNCIA repetido em 5★ NÃO sobe de raridade (vira ração): o ovo carrega a origem
   "instância". Resultado aceito: otimizador golem 3,0★ / fênix 3,3★ (dia 62), normal 3,0★ / 1,9★ (dia 61). O golem
   repetido continua valendo +5 de fênix.
   Instâncias: em cada era o Fácil abre na fase 3, o Normal na 6 e o Difícil na 9; dificuldade bloqueada aparece com
   cadeado e "Libera na fase X".
   TEMA DOS PETS FECHADO pelo PO (v5.2). O PO é a sessão "Protótipos de tela no Artefatos" (antiga fps-98). Próximo foco de balanceamento só quando o dono responder sobre o VIP e a
   duração (~61 dias).
   Checagem final (docs/balance.json v5.1, 41 partidas por política, Chefe de Era no Normal): "fênix depois do golem 3★"
   dá golem 3,0★ e fênix 2,6★, fim no dia 61; "tudo no golem" dá golem 4,2★ e fênix 1,5★; "fênix depois do golem 2★"
   dá golem 2,0★ e fênix 2,9★. Casos de borda (fps-e2): fênix nascida antes do andar 100 faz o ovo do 100 valer como
   repetido (10 fragmentos); fênix nasce já com as estrelas que os fragmentos guardados pagam. depois do andar 100 da torre, 1 fragmento de fênix a cada 10 andares (fênix
   garantida no andar 100); ovo do chefe de fase 50/32/13/5/0; ração da instância Chefe de Era 5/7/10 e offline 5;
   Chefe de Era Difícil com 1% de Lendário.
   Meta: o grátis termina com a fênix entre 3 e 4★ e o golem perto de 4★ (a validar na v5).

## PET (requisito do dono; SPEC do PO; nada de arte nem código antes da aprovação)
Companheiro que luta ao lado do herói (não é montaria). Ataca sozinho a cada ~2 s, soma FC e evolui. 1 equipado por vez.
1ª versão, 5 pets, um por raridade: Básico filhote de lobo (terrestre); Raro coruja (voa); Épico dragãozinho (voa);
Mítico golem de cristal (terrestre); Lendário fênix (voa).
Obtenção: ovos de chefes, instâncias e torre; o Lendário também por evento. SEM ovo pago e sem venda por gemas até a
decisão do VIP. Evolução: nível 1-50 com "ração" (material novo dos drops) e estrelas com fragmentos repetidos.
O pet NÃO entra no fator 12 por era (acompanha o herói em todas); contribuição limitada a ~20% da FC total.
Arte sempre animada: parado, andar ou voar, atacar; voador batendo asas o tempo todo e com sombra no chão; terrestre com
os pés no chão.
Critérios de QA e perguntas em reports/qa.md ("REQUISITO NOVO DO DONO: PET"). Impactos a avaliar: arte animada (fora do
plano de ~557 créditos), mais uma fonte de poder no balanceamento (fora da simulação atual) e de onde o pet vem
(se por invocação paga, é poder comprado e cai na regra de caixas de recompensa).

## Animação (decisão do dono via PO)
Quadros do Kael, do Goblin e do Esqueleto aprovados na página de arte, mas o dono quer o herói MODULAR (cabelo, olho e arma
trocáveis). A fps-ff tem 20 créditos para uma prova em camadas, a comparar com os quadros. Técnica final ainda não escolhida.

## Decisões do PO/design (fps-98) aguardando a aprovação das telas para implementar
- Ondas grandes: no máximo 3 inimigos visíveis, em posições fixas no chão (tela de 390: pés em x≈214, 290 e 350; o 3º a
  0,9 de escala, parcialmente atrás do 2º). Sem faixas de profundidade. O resto espera fora da tela, com selo "+N" na borda
  direita na altura do chão (fundo #ff5a4e, texto branco, Lilita One). Slot vago: o próximo entra andando da direita (ciclo
  de corrida quando existir; até lá deslizando no chão, sem quique) e só ataca depois de parar.
- R3, R4 e R6 do reteste 1 do QA: esperam a aprovação dos protótipos.

## Ligação da animação (fps-ff) — NÃO ligar até o PO escolher a técnica (quadros x ossos)
`<script src="js/anim.js">`; `await Anim.load('era2_hero_t0','assets/anim/rig/era2_hero_t0/')`;
`Anim.draw(ctx, id, 'run'|'idle', tSegundos, xPes, chaoY, tamanhoDoSpriteParado, {weapon:{img, grip:meta.grip, angle:meta.angle}})`
devolve false se o rig não existe (cair no sprite atual). `Anim.groundSpeed(id, tamanho)` = px/s em que o chão deve rolar
para os pés não patinarem. Provas: quadros em /test/anim/preview.html; ossos em http://localhost:8091/test/anim/bones/.

## Fila de trabalho (ordem)
1. A1-A4 e B1 de reports/qa-fixes.md (horda, tela cheia sem scroll, herói correndo, efeitos na arma).
2. Loot que voa para o HUD + baú de toque. 3. Instâncias diárias. 4. VIP 1-9, montaria, FC no HUD, tier "Mítica".
5. Práticas (pedras de prática sobem trilhas permanentes: Força, Vitalidade, Crítico, Defesa, Coleta) e Títulos (atributo fixo;
   1 em destaque dá bônus maior). 6. Torre (andares contra chefe ou fantasma). 7. Arena com ranking semanal.
   Tudo soma na FC do HUD, com painel "Como ficar mais forte". No protótipo, torre e arena usam bots/fantasmas locais gerados
   pela FC do jogador, atrás de uma interface trocável por dados reais (ranking e jogadores reais exigem backend, como o leilão).
Itens 2-7 detalhados em reports/qa_proposta_vip_baus_instancias.md (seções 0-5). Todas as telas em grade de celular, sem scroll.

## MUDANÇA DE REGRA PENDENTE (não implementar ainda)
Relatada pela sessão de QA (fps-0b) como decisão do dono; aguarda a confirmação dele na sessão coordenadora antes de
virar regra e antes de gastar créditos com arte:
- Skins continuam só visuais (e passam a ser animadas). VIP (níveis 1-9, por gasto acumulado) e montaria DÃO poder
  (ATK/HP/ouro/XP; FC única no HUD). Isso substitui "só skins monetizam / nada pago dá atributo".
- Tier novo "Mítica" (r5, acima do Lendário r4), exclusivo do VIP9, fora de invocação e drop; exige sprites T3 de herói e
  arma nas 7 eras e cor/ícone bem distintos do "Mítico" (r3).
Até a confirmação: escreva o código de raridades/tiers/atributos de forma extensível (sem números mágicos de 5 raridades/3 tiers).

## Regras gerais
- Disco C: quase encheu: apague temporários seus, não guarde imagens/áudios brutos grandes, comprima o que entregar
  (png ≤ ~500 KB, mp3 ≤ ~600 KB música / ≤ 60 KB sfx).
- Nunca publique nada nem use recursos de publicação/redes/GPU rental do Higgsfield. Respeite seu teto de créditos.
- Confira o que entregar (ver imagem com Read; áudio: duração/tamanho e que o arquivo toca/decodifica).
- Relatório curto em reports/, em português, com o que foi feito, gasto, pendências e RECOMENDAÇÕES para o dono.
- Servidor local: http://localhost:8080 (pasta do projeto). Debug: /?debug=1&era=3&wr=3&ar=3&stay=1 (ver reports/agente5-engenheiro.md).

## 2026-11-12 — Registros do PO (fps-98)
- ORDEM DO DONO: parar coisa nova; ligar no jogo tudo que consta aprovado (docs/ARTE_APROVADA.md, 220 itens). Telas 11/12/15/16/18 esperam. Navegador: uma aba só, fechar ao terminar.
- Missão "Colete 15 pedras": conta pedra de qualquer origem (drop, desmonte manual e automático); texto "de qualquer fonte" (feito em js/sys/pass.js pela fps-30).
- Cenário era 4: pronto fora do jogo; antes do voto, corrigir por código o que está parado (engrenagens, ponteiro, hélices, rodas, locomotiva passando, gato/corvo/autômato). Sem crédito.
- PEDIDO NOVO DO DONO (registro, NÃO entra no build agora): 2 eras novas depois da Futurista: SUBMUNDO (era 7) e CELESTIAL (era 8). Arte de referência com a fps-ff. Sistema (fps-e2): nível máximo 100 → 120; nova raridade acima do Lendário (proposta "Divino", nível 105, só eras 7-8); plano de balanço escrito e DESLIGADO.
- Telas 13 INSTÂNCIAS e 14 TORRE: APROVADAS pelo dono (versões refeitas no canvas). Fila de telas aprovadas, só DEPOIS do build com a arte aprovada: 08, 16, 11, 12, 15, 18, 13, 14. Reprovadas restantes: 09, 10, 17.
  Pendente de confirmação do PO com o dono (NÃO mudar o sistema): chefe da torre a cada 10 andares (tela) x a cada 5 (tower.js); entradas por área 2 (+1 VIP) (tela) x 3 chaves por dia no total (spec). Ondas das instâncias usam os inimigos aprovados de cada era.
- CONFIRMADO PELO DONO (substitui a pendência acima): chefe da torre a cada 10 andares (js/sys/tower.js, fps-e2); instâncias com 2 entradas por área por dia, +1 com VIP (js/sys/instances.js, fps-30; substitui "3 chaves por dia no total"). Telas 13/14 usam essas regras.
- Telas 10 VITÓRIA/DERROTA e 09 CONFIGURAÇÕES: versões REFEITAS APROVADAS pelo dono (canvas atual). 10: refazer igual ao canvas novo (substitui a que está atrás de SCREENS_ON.bossResult), com a morte aprovada do chefe de CADA era; derrota com "Modo farm" como botão principal e 3 caminhos (Forja/Equipamento/Invocar). 09: velocidade com cadeado (2x nível 15 ou VIP; 4x VIP>=5 e nível 40).
  FILA FINAL de telas aprovadas (só depois do build da arte aprovada): 08, 16, 11, 12, 15, 18, 13, 14, 10, 09. Reprovada restante: 17.
- Build v0.11 (arte aprovada ligada: 84 folhas de inimigo, 7 ultimates, cenários 0-3, s1/s2 era 2, 49 ícones) e v0.11.1 (EN_STRIDE das 21 corridas medido pela fps-ff; sw.js VERSION v0.11.1 para não servir som/arte reprovados do cache).
- DECISÕES DO PO após a v0.11: (a) Kael: folha composta hybR quando roupa e arma forem da era 2 no mesmo tier; senão corpo + arma na mão. (b) "Desafiar" apagado com 2º toque em 4 s: fica. (c) Missões de instância do passe: trocar por missões que já fecham (abates, chefes, forja) até a tela 13 entrar; bônus das 6 diárias tem que liberar. (d) Preço do Premium: quando entrar pagamento. (e) Calibração: reduzir a escala de XP por era nas eras 1-2 e remedir na v0.11 depois do QA; metas: era 1 40-50 min, era 2 90-120 min. (f) Aprovadas 01 TÍTULO, 02 LOGIN, 03 INTRO; fila de telas: 08, 16 (feitas), 11, 12, 15, 18, 13, 14, 10, 09, 01, 02, 03. (g) Morte do herói reprovada pelo dono: fps-ff refaz, prévia pela página.
- Instâncias (aplicado em js/sys/instances.js): 2 entradas por área por dia (Mina, Arsenal, Chefe de Era, Cristal = 8/dia), +1 por área com qualquer VIP. API para a tela 13: status(S,host).keys = {gold,gear,boss,gems} + max, total, totalMax; finish/sweep devolvem keys restantes da área; ondas por mkEnemy(run.stage, kind). Efeito a remedir: ~2,7x de tudo que vem de instância (ovo segue 1/dia).
- Ícones de espaço (49): PO autorizou versão leve (mesmo desenho/cores, 2x do maior tamanho mostrado, transparência preservada, originais em assets/icons/_aprovado_original); QA compara antes x depois; borrado ou serrilhado volta o original.
- Passe (js/sys/pass.js): instancesOn=false; diária "Vença 1 instância" → "Derrote 2 chefes" (15); semanal "Vença 10 instâncias" → "Faça 10 invocações" (40); XP igual; bônus das 6 diárias libera. Voltar com instancesOn=true quando a tela 13 entrar.
- XP de abate (js/sys/loot.js e docs/balance.json): eraScale = [1, 0.15 x6] (era 1 = 1,15; era 2 = 1,3; ... era 6 = 1,9). ESTIMATIVA, a medir no jogo depois do QA liberar (metas: era 1 40-50 min; era 2 90-120 min).
- v0.11.3 (em andamento): inimigos maiores por código, escala pelo pé: era 2 comuns +20%, eras 3 e 4 comuns +15%, chefes das três +10%; comum nunca mais alto que o Kael. Ícones leves (49, 240 px, originais em assets/icons/_aprovado_original) aprovados pelo PO e pelo QA.
- Cenário era 4: rodada 3 (trem apoiado em trilho visível, acabamentos); PO não leva ao dono antes.
- "Parado" dos inimigos: hoje PNG estático entre golpes (15-50% do tempo). fps-ff faz 2 prévias grátis (A preparo do ataque em vai-e-volta; B pausa <=0,4 s + último quadro da corrida com balanço) para Goblin, Pirata, Drone + 1 chefe; folhas de verdade (~84 créditos) só com voto do dono.
- FILA (depois da v0.11.3), PEDIDO DO DONO: raridade reconhecível de longe pela BORDA e COR em todo lugar com item: drop no chão (brilho/feixe na cor; Épico+ com partícula; Mítico/Lendário com feixe vertical e som próprio), mochila, equipamento, forja, loja, invocação, cartões de recompensa. Mesma moldura/5 cores dos 49 ícones aprovados e do Equipamento aprovado; nome do item na cor da raridade. Sem arte nova (código). Entregar print de um drop de cada raridade no chão e da mochila.
- v0.11.3 fechada: QA deu liberação CONDICIONAL (x > 382 em algum quadro nos chefes das eras 2-4 e comuns da era 3; sola dos chefes das eras 3 e 4 12-15 px abaixo da linha em algum estado). NÃO publicar ao dono.
- v0.11.4 (decisões do PO, antes da raridade): tamanho padronizado nas 7 eras: comuns ~115-122 px de altura opaca (~75% do Kael = 158; nunca acima), chefes >= 165 px. Dragão na caixa larga 170..382. Era 4: sobreposição até 55% SÓ nela, o da frente por cima, pés na mesma linha; se a Aranha não couber, reduzir a largura do slot, não a altura. Corrigir os defeitos do QA. Folha larga do golpe do Kael (hyb/R/kael_attack_wide_era2_t0..2, 448x256) aprovada pelo PO como correção técnica, no lugar da de 256. Testar Senhor da Era, horda corrida eras 2-4, rótulo do chefe em tela baixa.
- Som do drop por raridade: Épico = sfx 'gem'; Lendário = 'legendary'; Mítico = 'legendary' com rate 0,89 (js/audio.js já aceita {rate}).
- QUALIDADE DO ITEM (regra nova do dono; proposta da fps-e2 em reports/spec-qualidade-item.md, aguardando o PO; código atrás de Sys.stats.DATA.quality.on=false). Quando ligar: jogo ~10% mais difícil (qualidade média x0,90); degraus dos % por raridade sobem de x1,2 para x1,55; exige nova calibração. Engenheiro: normItem (js/farm.js:11) precisa copiar o campo qp; estrelas por Sys.stats.qualityStars(qp). NÃO ligado.
- Cenário era 4: rodada 4 (tocos pendurados, mancha, sombra sem halo, biela, fumaça animada, gato/corvo com deslocamento, mureta em toda a volta); depois vai ao dono. scene.js da rodada 3: SHA-1 67a01b15....
- QUALIDADE DO ITEM: decisões do PO aplicadas pela fps-e2 no código, atrás de chaves DESLIGADAS: multiplicador x0,90-1,30 (média x1,00, sem perda de 10%); degraus x1,5 em velocidade e dano crítico, x1,55 nos outros %; sem re-sorteio: FUSÃO de 3 iguais (Sys.stats.fuse, custo só em ouro; resultado é item novo, o jogo tira os 3 da mochila); item de era futura "adormecido" aprovado (dormantInfo().label); era máxima em Sys.stats.DATA.maxEra. Leilão: plano só com servidor (seção 11 de reports/spec-qualidade-item.md). Ligar = tela + normItem copiando qp + calibração; ainda NÃO ligado.
- Cenário era 4 rodada 4 entregue ao PO: scene.js SHA-1 a1e1157e496f035855e7dcbd69731d62182c84a9; pasta 53 arquivos, ~1,84 MB.
- v0.11.4 fechada: escala por inimigo, correção de x/sola, folha larga do Kael, normItem copia qp; DEFEITO GRAVE corrigido (matar o Senhor da Era congelava o jogo: pickup da Essência sem cor). Eras 0, 1 e Drone não couberam no padrão.
- v0.11.5 (decisões do PO): sobreposição até 55% também nas eras 0 e 1 e no Drone (o da frente por cima, pés na mesma linha). Caixa larga 170..382 para Dragão, Minotauro, Tanque e Devorador. REGRA: o corpo do chefe NÃO desliza; âncora do pé parada (avanço <= 12 px medido pela âncora); nos quadros de golpe/disparo do chefe a arte (arma, cano, clarão, efeito) PODE passar de x 382, até sair da tela; o corpo fica na caixa. QA mede pela âncora.
- Atrás de chaves desligadas (fps-30): drop de era futura (Sys.loot DATA.futureEra.on=false; +1 0,5%, +2 0,05%, +3+ 0,005%) e gancho da qualidade (qp).
- TELA 04b BATALHA EM TELA CHEIA: APROVADA pelo dono (canvas, quadro BatalhaTelaCheia: sem barra de navegação de baixo, header novo, ícones ilustrados espalhados na tela; ícones de menu aprovados em assets/icons/menu, Invocar refeito). PRIORIDADE: logo depois da v0.11.5, ANTES da raridade e das outras telas. Fila: v0.11.5 → 04b → raridade pela borda/cor → 11, 12, 15, 18, 13, 14, 10, 09, 01, 02, 03.
- 04b BATALHA EM TELA CHEIA, geometria (protótipo aprovado copiado em docs/proto/BatalhaTelaCheia.dc.html; seguir ao pixel): linha dos pés y=640 (0,78 x 820; campo cresce, sem barra de baixo). Inimigo da frente em x=212; os outros dois abrem até o limite da coluna direita de ícones (protótipo: 262 e 308); nenhum CORPO de inimigo por baixo dos ícones (arma/efeito pode passar). Não reduzir os inimigos. Se a sobreposição passar de 55% em alguma era: mandar % e print por era ao PO. Chefe na posição do protótipo (mostrar Dragão e Tanque). Valem: pés numa linha só, avanço <= 12 px pela âncora, slots sem cruzar.
- v0.11.5 fechada (QA dando o veredito). Decisões do PO: (1) comuns com a mesma regra do chefe: só arma/efeito passa da borda 382, corpo dentro. (2) ARMA batendo abaixo da linha dos pés: aceito; PÉ abaixo da linha: não: fps-ff fornece âncora por quadro (campo opcional feetDy no .json) só nos quadros em que o pé desce (Minotauro, Capitão Fantasma, Golem, Tanque, Brutamontes), sem crédito. (3) Tamanhos e sobreposição aceitos por agora (inclusive era 4 em 58/64%; fundo da era 0, meio/fundo da era 1 e Minotauro 152 abaixo do alvo); sem reduzir para 2 comuns; rever com os números da 04b (pés 640), que é o layout final.
- Debug: ?debug=1&fresh=1&skip=1&lord=<era 0..6> deixa o save no Senhor da Era (onda 5, herói reforçado, sem stay).
- QA v0.11.5: liberação CONDICIONAL (sem defeito que barre). PO publica ao dono só depois de mais uma passada do QA (passe/bônus das 6, XP/nível, Kael nos 3 tiers, jogador novo sem debug) na v0.11.6.
- v0.11.6 (pequena): leitura do campo opcional feetDy do .json (âncora por quadro). Capitão Fantasma TRAVADO no chão no golpe e no apanhando ("nada flutua" vale para fantasma): era3_boss_attack.json e era3_boss_hurt.json já têm feetDy. Poeira/fumaça/arma abaixo da linha (Minotauro, Golem, Tanque, Brutamontes): aceito. Devorador: sola +9 px no golpe vem do desenho no jogo: engenheiro corrige. Escorpião (era1_e1): o bote sai do chão na arte aprovada: MANTER (PO avisa o dono; se reprovar, trava com feetDy {"4":5,"5":15,"6":15,"7":15,"8":15,"9":9,"10":4}).
- 04b: dono pediu ícones melhor distribuídos + botão MENU com drop down (V2 no canvas, em voto). Engenheiro faz a geometria agora; disposição dos ícones por último, em tabela de dados, atrás da chave.
- APP ANDROID DE TESTE (pedido do dono): Capacitor, APK debug, pasta separada C:\Users\rafae\Desktop\fps-android; id provisório br.com.intellisys.eonbound (dono confirma antes da Play Store; conta da empresa dele). Retrato, tela cheia, botão voltar, som no 1º toque, vibração, pausa em segundo plano, ícone/abertura com arte aprovada, sem service worker. Disco apertado: parar e avisar o PO antes de apagar qualquer coisa que não seja intermediário do próprio build.
- Pose de tiro do Kael (fps-ff): em voto com o dono; não ligar.
- DURAÇÃO (DECISÃO DO DONO): terminar a última era (Celestial, era 8) leva ~6 MESES para quem não paga e ~4 MESES para VIP, jogando todo dia, com trava de nível e poder recomendado por era; "muito difícil" até a última era. Substitui o plano 60/41 dias. Proposta-base em docs/CURVA_9_ERAS.md (grátis termina as eras nos dias 1, 4, 11, 23, 41, 66, 98, 136, 180; VIP 1, 3, 8, 16, 28, 45, 66, 91, 120; nível de entrada 1, 12, 25, 40, 55, 70, 85, 100, 110; máximo 120). fps-e2 e fps-30 fecham os números dos módulos atrás de chave desligada. PO vai montar tela de MAPA DAS ERAS e história.
- 04b (decisão do PO com a V2): faixa direita x 300-390, y 400-650 livre de ícones; centros dos comuns voltam a 222/282/338 com pés em y=640; chefe na caixa 170..382 sem ícone por cima.
- Devorador (era6_boss_attack, quadros 6-7): limpeza de resto de recorte translúcido autorizada pelo PO como correção técnica; versão limpa em assets/anim/_staging; copiar só depois do QA fechar a v0.11.6; original guardado em _aprovado_original. Capitão Fantasma: feetDy só no golpe (o do hurt foi retirado: a base já estava na linha).
- Curva de 6/4 meses: calendário-base aceito pelo PO (docs/CURVA_9_ERAS.md, seção 7): ~40 min ativos/dia + offline; era 0 curta; bônus de retorno até 3 dias acumulados; proteção contra volta/salto de relógio (sem recompensa diária duplicada); eras 7-8 desligadas até a arte.
- QA: VEREDITO FINAL v0.11.6 = LIBERAR (sem nada que barre). PO publica a versão jogável do dono a partir dela. Ressalvas para a próxima rodada: Kael tier 2 e caso misto em jogo; pé patinando em movimento; eras 0, 1, 4, 5, 6 em jogo; aviso do tutorial "Passo 1 de 5" cobre o HUD durante a luta (refazer com a 04b). Sem teste em celular.
- 04b / V2, REGRAS PARA TELA BAIXA (PO): ícone de menu nunca abaixo de 44 px; se não couber, os de menor prioridade vão para o botão MENU (ordem de permanência: Equipamento, Invocar, Loja, Passe, alerta de baú, evento). Faixa livre do chefe/inimigos RELATIVA À LINHA DOS PÉS: do chão até ~250 px acima, x >= 300, em qualquer altura de tela. Print do protótipo para o lado a lado: abrir o canvas público numa aba só, quadros "04b Batalha em tela cheia" e "04c V2", print 390x844, fechar a aba.
- 04b segunda passada feita atrás da chave (centros 222/282/338, pés 640, faixa do chefe livre, baú, folhas). Pendente: lado a lado com o protótipo; V2 dos ícones (em voto); jogo corrido; vitória/derrota; celular. Engenheiro parado até o PO terminar a cópia da v0.11.6 para a versão jogável.
- 04c (V2 DOS ÍCONES) APROVADA pelo dono = layout final dos ícones da batalha em tela cheia: Equipamento, Invocar, Loja, Passe à ESQUERDA; alertas Baú cheio e Evento à DIREITA, acima da faixa livre; botão MENU no topo direito com drop down: Forja, Pets, Torre, Instâncias, Ranking, Missões, VIP, Correio, Eventos, Configurações; a engrenagem SAI do header. Trocar a tabela FB_MENU da 04b para a V2 (depois que o PO liberar a cópia da v0.11.6).
- RASTREADOR DE MISSÃO GUIA (pedido do dono, protótipo em voto: NÃO codar a parte visual): sob a barra de fase: missão atual, barra, recompensa, toque leva à tela, fila de missões de tutorial. A LÓGICA da fila pode ser preparada atrás de chave desligada pela fps-30.
- Curva de 9 eras, decisões do PO sobre a parte da fps-30: (1) diamantes grátis: meta ~8-10 mil em 180 dias (16 mil é demais); diamante NUNCA compra o que é só dinheiro real (VIP e Passe Premium); mostrar contra os preços da loja. (2) Teto Épico nas eras 3-4 aceito; a busca nesse trecho é a QUALIDADE (estrelas, fusão 3→1) e itens de outra era: esses sistemas têm de estar ativos nessa fase. (3) Passe: temporadas de 30 dias. (4) Relógio/retorno ok, com o limite registrado (salto com app fechado sem solução sem servidor). Ração: aceitar.
- NOVO DO DONO: (a) animação de SUBIR DE NÍVEL nova (a atual é "tosca"); (b) O KAEL CRESCE: garoto → adolescente (nível 20 + ~15 mil FC) → adulto (~30-40) → guerreiro lendário (~70+), com ANIMAÇÃO DE EVOLUÇÃO; SUBSTITUI as roupas por era. Arte com a fps-ff (referências primeiro, para voto). Animações de level up e evolução por código, com prévia na página antes de ligar. Gatilhos exatos (nível + FC) com a fps-e2 na curva de 9 eras. Nada ligado.
- VOTOS DO DONO (página, 2026-11-12): APROVADOS: cenário era 4 (Industrial; scene.js a1e1157e...); morte do Kael v2; inimigo parado A e B (usar A = quadros de preparo do golpe em vai-e-volta); auras maligna/celestial; asas demoníaca/anjo; Kaia referência v2; os 8 pets nos 3 estágios + Prismático; TODAS as referências das eras 7 e 8 (cenário, inimigos, armas, skins). REPROVADA: pose de tiro do Kael (não ligar).
- LIBERADO PARA O JOGO (só depois que o PO liberar a cópia jogável): cenário era 4 (sceneV2); morte do Kael (espada cai por código, poeira, escurece); idle A em todos os inimigos; asas no espaço de asa (libera no nível 50); auras maligna/celestial atrás de chave (reservadas às eras 7-8).
- PETS (regra nova do dono): pet libera no NÍVEL 20. Ao chegar no 20 o jogador ganha um OVO com animação de chocar (tremer, rachar, luz, pet salta ao chão); sorteio grátis só entre as 2 primeiras raridades: ~79% Básico, ~21% a segunda (nunca Lendário). Pet equipado aparece NA BATALHA andando atrás do Kael e atacando sozinho. Animação dos pets: fps-ff. Tela de Pets continua reprovada; PO monta protótipo de "pet equipado". Portão e chances: fps-e2.
- KAEL CRESCE, respostas do PO: (1) skins de roupa viram cor/detalhe por código sobre a fase de idade; a ARMA continua trocando na mão; espaço colete = armadura da fase + tom da raridade. (2) O Kael de HOJE é o GAROTO; as outras 3 fases precisam do conjunto inteiro de animações. (3) Inimigos ficam como estão.
- Missões guia: fila de 21 aprovada pelo PO; textos finais revisados no protótipo.
- CURVA DE 9 ERAS fechada em CONTA (nada ligado, nada medido): reports/progressao-9-eras.md (consolidado, fps-e2), reports/curva-9-eras-e2.md, reports/curva-9-eras-30.md, docs/CURVA_9_ERAS.md. Grátis dia 179; VIP 10 dia 121; VIP 5 dia 140; VIP 1 dia 160; jogar o dobro adianta 15% (teto diário de XP de abate: cheia/30%/10%). VIP 1,13x a 1,50x. XP total 1-120: 1,74 mi. FC do Senhor por era: 1,7 mil; 27 mil; 1,2 mi; 27 mi; 523 mi; 17,7 bi; 1 tri; 39 tri; 719 tri. Chaves: Sys.level.setV9, Sys.stats.setEra9 (desligadas). Kael (visual): adolescente Nv 22 + 15 mil FC; adulto Nv 35 + 400 mil; guerreiro lendário Nv 70 + 600 mi (Sys.level.stage/evolve). Pet no Nv 20; asa no Nv 50. Qualidade/fusão/adormecido têm de ligar JUNTO com a curva.
- DIAMANTES (proposta da fps-30, aguardando o PO): hoje ~29 mil grátis em 180 dias; corte para ~10 mil (comum 1,5→0,5%; baú 25→15%; Cristal 3 fixos x dificuldade; Chefe de Era 0; diárias 39→17/dia; semanais 90→36; login 45→30/semana; guia 255→150). Diamante não compra VIP nem Passe Premium (conferido).
- PO: corte de diamantes APROVADO como proposto (~10 mil em 180 dias); fps-30 aplica nos módulos só depois da cópia jogável liberada. Ordem do engenheiro aprovada: 04b + V2 (04c) + tela baixa + tutorial → pacote de arte (cenário era 4, idle A, morte do Kael v2, Devorador) → raridade → asas (Nv 50) → pet. Qualidade/fusão e item adormecido LIGAM JUNTO com a curva de 9 eras, nunca separados. A curva só liga depois de o PO avisar o dono (o ritmo do save muda) e de decidir a escala dos números (bi/tri). Missão guia: protótipo em voto.
- MEMÓRIA DO PC: o servidor local caiu por falta de memória e foi religado a pedido do PO. Regras: cada sessão com no máximo UMA aba, fechar ao terminar; QA e engenheiro NÃO rodam teste de navegador ao mesmo tempo (revezam).
- DECISÃO DO DONO: números grandes ABREVIADOS (mil, mi, bi, tri) em toda a interface; a curva de 9 eras fica como está. Protótipos em voto: 19 Prólogo e 20 Mapa das Eras.
- APP ANDROID: projeto Capacitor montado em C:\Users\rafae\Desktop\fps-android (cópia v0.11.6, 179 MB; LEIA-ME.md), mas o APK NÃO foi gerado: a compilação foi encerrada por falta de memória do PC. Requisitos implementados e nunca executados. Pendências: janela de memória livre para compilar; Java 17 x 21 (não provado); disco 1,8 GB; decisões do PO: id definitivo, fontes embutidas, tela acesa, cópia do save. Mudanças a portar ao repositório: script js/native.js no index.html; "&& !window.Capacitor" na condição do service worker (js/meta.js).
- 15:06: PO tirou a cópia da v0.11.6 para a versão jogável do dono; trocas de arquivo liberadas. Arquivos que mudaram entre o veredito do QA e a cópia (todos atrás de chave desligada ou dado avisado): js/battle.js, loading.js, fullbattle.js (04b, 14:58), js/sys/stats.js, clock.js, guide.js, era3_boss_hurt.json; PO avisado.
- JANELA CALMA para compilar o APK: QA, engenheiro e fps-ff sem navegador até o resultado. Decisões do PO para o app: fontes embutidas SIM; tela acesa na batalha SIM; "Exportar/Importar progresso" (código copiável) nas Configurações como cópia de segurança do save; id definitivo depois; Java 17 falhando → Capacitor anterior, sem instalar nada novo.
- PRÓXIMA VERSÃO v0.12.0: 04b + ícones 04c + tela baixa + tutorial; pacote de arte (cenário era 4, idle A, morte do Kael v2, Devorador limpo); corte de diamantes (fps-30). Depois: raridade, asas, pet na batalha.
- Pets no Nv 20 (fps-e2, atrás de Sys.pet.DATA.v20.on=false): firstEgg 79% Básico (Lobo) / 21% Raro (Coruja); battleInfo → golpe a cada 2 s, hitMult 2,5; ovo antes do 20 fica guardado ({held:true, pre:true, needLevel:20}): os avisos de ovo em battle.js/farm.js precisam tratar "held" ("Ovo guardado: abre no Nv 20"). docs/balance-v9.json: 90 fases {stage, era, fcRec, lvlLock, boss}; o jogo não lê.
- CURVA, REVISÃO 2 (fps-e2, a pedido do PO; nada ligado): 100 fases por era x 4 dificuldades (0-3), degrau x3 por dificuldade; liberação de era pelas dificuldades exigidas (required). Números em docs/balance-v9.json, bloco rev2 (3.600 linhas {era, diff, stage 1-100, fcRec, lvlLock, required, boss}); resumo no topo de reports/progressao-9-eras.md. Para ligar: STAGES_PER_ERA 10 → 100; fase com dificuldade; eras 0-1 com fase de 1 onda curta; DEF dos inimigos (comum 1,2%, chefe fase 50 2,75%, Senhor fase 100 3,7% da fcRec; vida x0,9/x0,8/x0,75) via mkEnemy; reserva sem js/sys (battle.js:273) com crítico pela mesma regra (critRate até 75%, critDmg até 400%), variação de ±10% fica; envoltório de debug em floatText/hitEnemy para o teste de coerência de dano do QA (reports/coerencia-dano.md §5). A confirmar com o PO: como a Revisão 2 se encaixa no calendário de 180/120 dias e nas telas (Mapa das Eras).
- Corte de diamantes APLICADO pela fps-30 (ligado, entra na v0.12.0): comum 0,5% (1); baú 15% (2-5); Cristal 3/5/8; Chefe de Era instância 0; diárias 2 cada + bônus 5 = 17/dia; semanais 36; login 30/semana. Devorador limpo no lugar (fps-ff).
- Celular do dono (S24 Ultra) no cabo e autorizado: instalar só o APK do jogo e medir; não alterar nada mais no aparelho.
- DECIDIDO PELO DONO (confirmado pelo PO): ~100 fases por era, dificuldades Fácil/Médio/Difícil/Hell; a próxima era libera exigindo dificuldades crescentes (as últimas pedem Hell). Números-base: Revisão 2 da fps-e2 (docs/balance-v9.json, bloco rev2). Entra DEPOIS da v0.12.0 (04b), JUNTO com a curva de 9 eras, qualidade/fusão/adormecido e números abreviados, e SÓ depois do protótipo do mapa novo (mundo → era com 100 fases e seletor de dificuldade) votado; arte do mapa com a fps-ff.
- AUTORIZAÇÃO DO DONO (via PO): cada sessão de desenvolvimento pode lançar até 2 SUBAGENTES ao mesmo tempo. Regras: no PC inteiro só 1 navegador ativo (uma aba, fecha ao terminar), a vez é dada pela fps-c9; nada de compilação/processamento pesado em paralelo com o APK; arquivos diferentes por agente (nunca dois no mesmo .js). Sugestão: engenheiro com 2 agentes na 04b+V2 (tela / tutorial e tela baixa).
- TELA 12 RANKING: aprovada pelo dono a versão NOVA ANIMADA (canvas, quadro 12): contagem da temporada em dias + HH:MM:SS com segundos e ampulheta; pódio com a folha do Kael parado respirando de pé no degrau; auras dourada/fogo/roxa; coroa e confete no 1º, medalhas no 2º/3º; avatares da lista com anel girando; a linha do jogador pulsando; aviso "prêmios valem quando o ranking online abrir". É ESTA a referência quando a tela 12 for feita (a anterior tinha as animações travadas). Dados: Sys.arena.ranking / weekInfo (fps-e2).
- APK de debug gerado: C:\Users\rafae\Desktop\fps-android\Eonbound-debug-v0.11.6.apk (189 MB), com Java 17. Instalação e medição no S24 Ultra em andamento.
- Estrutura nova (100 fases x 4 dificuldades), prêmio por fase (decisão do PO): fase comum dá ouro/XP visíveis; DIAMANTE só em MARCOS (a cada 10 fases, chefe da fase 50, Senhor da Era), x1/1,5/2/3 por dificuldade, inteiros, ~890 em 180 dias; fragmento de golem no Hell; sem frações na tela. Substitui os "10 por fase vencida" quando a estrutura ligar (fps-30: Sys.loot.stageWin atrás de DATA.diff.on).
- REGRA GERAL (PO): toda tela nova no jogo tem de ser RESPONSIVA (flex/grid; sem posição fixa que quebre em 360x640 ou em tablet). Novo protótipo a caminho para voto: PERFIL E COLEÇÃO (títulos, molduras, auras, asas, estatísticas).
- DECISÃO DO DONO: BACKEND PRÓPRIO NestJS + Postgres. Líder: fps-30 (repo novo C:\Users\rafae\Desktop\fps-server, até 2 subagentes). Ordem: auth (convidado + Google/Apple) → save na nuvem com validação → chat com proteção para menores → ranking/arena autoritativos → eventos com relógio do servidor → verificação de compra → leilão. Lado do jogo (fps-c9): CAMADA DE API TROCÁVEL (local hoje, servidor amanhã) para save, ranking, arena, chat e compras, sem atrasar a 04b. Login: tela 02 aprovada é a base. Chat: protótipo do PO depois do Perfil (painel dentro da Batalha V2).
- Prêmio por fase na estrutura nova (fps-30, atrás de Sys.loot.DATA.diff.on=false): Sys.loot.stageWin(S, host, {era, diff, stage}) → {first, kind, gems, gold, xp, golem}; só a 1ª vitória paga. Diamantes por marco (Fácil/Médio/Difícil/Hell): a cada 10 fases 2/3/4/6; chefe da fase 50: 4/6/8/12; Senhor (fase 100): 5/8/10/15; total por era 25/38/50/75; ~891 em 180 dias; no Hell +1 fragmento de golem por marco. Ouro 5/10/20/30 x ouro de um abate, x1/1,6/2,5/4 por dificuldade; XP 3/5/10/15 x XP de um abate (passa pelo teto diário). O chefe da onda 5 só paga como chefe nas fases 50 e 100. Engenheiro, ao ligar: tirar os 10 diamantes da fase vencida do battle.js e chamar stageWin.
- APK NO S24 ULTRA (v0.11.6, C:\Users\rafae\Desktop\fps-android\Eonbound-debug-v0.11.6.apk, ~180 MB, fontes embutidas e tela acesa): abertura a frio ~0,5 s (primeira tela), 3-5 s até "Toque para continuar"; batalha ~113 fps (era 0, x1); memória 821 MB (610 gráficos); retrato, tela cheia, recorte, botão voltar, pausa, save persistente: provados por adb. Não verificado: som, vibração na mão, ícone/abertura, eras 1-6, x2/x4. Achados a corrigir: save perdido se o app fecha 1 s após salvar (gravar ao ir para segundo plano); toque atravessa "Toque para continuar" e abre Configurações.
- ORDEM DO DONO após ver o APK ("versão antiga, não tá a tela inteira, modais errados"): A) ligar a 04b + V2 como padrão (v0.12.0), prioridade máxima; B) refazer TODOS os painéis iguais aos protótipos aprovados, tela cheia e responsivos (05, 06, 07, 08, 16 conferir; depois 11, 12, 15, 18, 13, 14, 10, 09, 01/02/03), print lado a lado; C) Equipamento: botão "EQUIPAR MELHOR" (itens voando, FC subindo) + arrastar da mochila ao espaço; D) novo APK e versão jogável. Dois agentes em arquivos separados: A (index.html, fullbattle, battle, loading, intro, meta, farm, stage) e B (screens.js, screens2.js, arquivos novos). Protótipos copiados em docs/proto/.
- API do servidor: contrato v1 proposto em docs/API_SERVIDOR.md (fps-30): save como blob versionado + summary; conflito por baseVersion sem fusão; arena autoritativa; x-server-time; compras só por recibo da loja; chat com menores só com frases prontas (parecer jurídico pendente).
- PO: plano A/B/C/D aprovado. Main.dc.html = 01 Título (aprovada), Login.dc.html = 02, CriarJogador.dc.html = 03. Pacote de arte depois dos painéis. MEMÓRIA no celular (821 MB, 610 gráficos) é alta: otimizar depois (folhas grandes; carregar só a era atual). Em voto: 20 Mapa das Eras V2 e 21 Perfil e Coleção.
- APROVADAS pelo dono: 20 MAPA DAS ERAS V2 (arte ilustrada: camada mundo + camada era com 100 fases e abas Fácil/Médio/Difícil/Hell): é a tela da estrutura 100 fases x 4 dificuldades e entra JUNTO com a curva nova (v0.12.1+). 21 PERFIL E COLEÇÃO (responsiva): fila de telas, depois das já aprovadas. Arte do mapa em assets/map/ (world.jpg, era0.jpg, relógio e pedaços); mapas das eras 1-8 com a fps-ff. Protótipos em docs/proto/.
- Print do canvas (PO): abrir só para ver é seguro; usar modo de foco/apresentação ou zoom 100% no quadro; não arrastar nem editar. Se não sair, comparar pelas medidas do .dc.html. Tablet: celular centrado por ora.
- 17b PETS V2 APROVADA pelo dono (docs/proto/PetsV2.dc.html): ovo no nível 20 com animação de chocar (79/21); estrelas + nível até 90; 3 estágios com evolução e aura; 3 ataques com %; alimentar; redefinir nível (devolve 80%); equipar com prévia na batalha; coleção e fragmentos do Prismático; responsiva. Espécies/raridades do protótipo: Mamute Básico, Esfinge Raro, Dragão e Papagaio Épico, Cão/Cérbero Mítico, Pégaso Lendário, Raposa Prismático; bônus máximo 8/11/14/17/20/25% (confirmar com a fps-e2: o módulo dela usa Lobo/Coruja no primeiro ovo). Folhas animadas dos 5 filhotes em assets/anim/pets/ (voto do dono pendente; integração pode ser preparada atrás de chave). PACOTE DE PETS = ovo no nível 20 + pet na batalha + tela 17b, tudo junto.
- QA: v0.12.0 sem defeito que quebre; defeitos para a v0.12.1 (antes do APK): tutorial (passo Invocar com painel aberto; balão grande cobrindo a vida do herói), "Desafiar" cobrindo o nome da fase, alvos de toque < 44 px (velocidade, "+" de ouro/gemas, botão da direita, Pular/Entendi). PO: sem APK da v0.12.0; APK e versão jogável saem da v0.12.1.
- REGRA (dono/PO): NENHUMA tela ou painel com barra de navegação de baixo. Painel = header da V2 + botão voltar, tela cheia, responsivo. PO está convertendo todos os protótipos aprovados para esse layout. Prioridade dos painéis: Equipamento ("Equipar melhor" + arrastar), Invocar, Loja, Passe, Forja, Pets V2, depois o resto.
- Agente B (painéis): 05/06/07/08/16 reajustadas, "Equipar melhor" e arrastar ESCRITOS em js/screens.js, screens2.js, equipfx.js; NÃO vistos no navegador ainda; chaves em PANEL_V2 (fit, equipFly, equipDrag, shopCol, ptNum desligada).
- PETS V2, alinhamento da fps-e2 (atrás de Sys.pet.setV17(true), exige v3; reports/sys-e2-api.md §5h): ids do save não mudam; ligar troca nome/raridade/sprite: wolf→Mamute (Básico, era0_mammoth), owl→Esfinge (Raro, era1_sphinx), drake→Dragão (Épico, era2_dragon), parrot (novo)→Papagaio-fênix (Épico, era3_parrot), golem→Cão mecânico (Mítico, era4_mechdog), underworld→Cérbero (Mítico, era7_cerberus, SEM folha), celestial→Pégaso (Lendário, era8_pegasus, SEM folha), prism→Raposa de cristal (Prismático, prism_fox, SEM folha). 1º ovo 79/21 = Mamute ou Esfinge. Só há folhas das eras 0-4, um estágio (idle/run/atk1-3); faltam estágios 2 e 3 de todos (fps-ff). Bônus máx 8/11/14/17/20/25% da FC TOTAL: a tela lê Sys.pet.fcShare(S, host, id). Evoluir manual no Nv 30/60 (canEvolve/evolve), teto 30/60/90 por estágio, feedTap (25 por toque), redefinir mantém o estágio. Divergências (a)-(h) com o PO (fênix da torre, eras 5-6 sem espécie, repetido = estrela ou fragmentos, ovos por era x por raridade, tipos, tetos, custo de ração, fontes de fragmento).
- Mapas de fase das eras 1-8 prontos (assets/map/era1.jpg … era8.jpg, mesmo formato do era0.jpg aprovado) para a tela 20, quando a estrutura de 100 fases entrar. Decisões de pets do PO: a fênix sai; andar 100 da torre = ovo Épico à escolha; ovo do chefe = espécie da era, sem sorteio; cópia = 10 fragmentos; bônus em % da FC total. Folhas de level up e evolução (assets/anim/fx/) em voto: não ligar.
- ORDEM DO DONO: REMOVER O MODO MANUAL. O jogo é SÓ AUTOMÁTICO: sai a chave AUTO/MANUAL da batalha e das Configurações; habilidades e ultimate disparam sozinhas sempre; botões de habilidade ficam só como indicador de recarga; tutorial explica que é automático; textos/missões com "manual" saem. Entra na v0.12.1. (Substitui a regra antiga "AUTO/MANUAL em uma chave só".)
- Pets, decisões codadas pela fps-e2 (Sys.pet.setV17, desligado): fênix sai (saves com ela ganham ovo Épico à escolha + investimento convertido); ovo = espécie da era, sem sorteio (único sorteio: ovo grátis do Nv 20); andar 100 da torre e eras 5-6 = ovo à escolha ({choice, options, index} → Sys.pet.chooseEgg; pendentes em ensure(S).choices); ovo acima do portão {held, gated}; repetido "+10 fragmentos" (5 estrelas vira ração); tetos de nível por estágio e por era (canFeed reason 'evolve'/'cap'); todos "combate".
- Modo manual removido: missões de ultimate (d_ult do passe, f_ult do Festival) contam as automáticas: battle.js deve chamar Sys.pass.track/Sys.events.track 'ult' em toda ultimate. Baú de batalha continua de toque (coleta).
- PACOTE DE PETS, lista para o engenheiro ao ligar (v20 + v17): os avisos de ovo (battle.js, farm.js, prêmio da torre/instância: res.hatched, grantBundle eggs, releaseHeld) recebem resultados SEM pet/name e precisam tratar: {held:true, pre:true, needLevel:20} ("Ovo guardado: abre no Nv 20"); {choice:true, options, index} (ovo à escolha: abrir a escolha → Sys.pet.chooseEgg); {held:true, gated:true, pet, name} ("guardado até o nível X"); itens {gated:true, hatch} no Sys.loot.releaseHeld. Sem isso aparece "chocou undefined". Detalhes: reports/sys-e2-api.md §5f e §5h.
- DONO COBROU VELOCIDADE: entregas pequenas e frequentes. Assim que a v0.12.1 passar na conferência curta do QA: APK instalado no S24 + PO atualiza a versão jogável, mesmo com painéis antigos; depois, a cada painel novo conferido, versão pequena com APK novo. O dono JÁ TEM conta no Google Play Console: na hora, preparar id definitivo, ficha da loja, teste interno com AAB assinado, Play Games e Billing; as chaves são criadas por ele no console dele.
- v0.12.1 fechada (QA em conferência curta): modo manual removido; 4 defeitos do QA; painéis em TELA CHEIA com cabeçalho (Voltar, título, moedas, gemas), sem barra de baixo; Screens.register para telas novas; arena/instances/tower carregados. Canvas conferido pelo PO: nada mudou.
- PO: protótipos aprovados TODOS convertidos para o layout novo e recopiados em docs/proto. APAGAR o layout antigo do código (depois do APK da v0.12.1; cópia guardada em docs/arquivo/layout-antigo-v0.12.1/). Tela 09 Configurações nova na próxima leva de painéis. Forja e Progresso são SUBTELAS do Equipamento (voltar leva ao Equipamento). MONTARIA: o Kael monta (arte fps-ff, sistema fps-e2).
- O PROJETO NÃO TEM GIT (não há histórico). Proposta ao PO: repositório git local só do código, commit a cada versão fechada.
- Módulos novos da fps-e2, aprovados pelo PO, DESLIGADOS (DATA.on=false) e ainda fora do index.html: js/sys/mount.js (montaria: Sys.mount.info/equip/upgrade; battleInfo(S).visual=false até a arte existir: atributo vale na FC, sem desenhar o Kael montado) e js/sys/offer.js (oferta com cronômetro de 24 h: Sys.offer.status → {available, msLeft, contents}; Sys.offer.grant só depois do pagamento confirmado). js/sys/stats.js: arma com offer:true acompanha nível e era do jogador até o Nv 25. API em reports/sys-e2-api.md §5i; spec em reports/spec-oferta-montaria.md. Pagamento e validação no servidor: fps-30. Compra direta (sem sorteio); declarar na loja.
- APK v0.12.1 INSTALADO no S24 do dono às 16:17 (versionName 0.12.1 confirmado por adb): C:\Users\rafae\Desktop\fps-android\Eonbound-debug-v0.12.1.apk (~219 MB); prints em fps-android\prints\ (batalha em tela cheia, MENU, Equipamento). Instalado por ordem direta do dono antes do fim da conferência do QA (QA: nada grave até ali). Notado no print: inimigos amontoados sobre o Kael na era 0; "Pré-His…" cortado; FC apertada sob o avatar → v0.12.2.
- 22 OFERTA DE PRIMEIRA COMPRA APROVADA (docs/proto/OfertaInicial.dc.html): R$ 29,90, 24 h a partir do 1º acesso, uma vez; arma Épica 3 estrelas + Lobo de guerra Épico + 300 gemas + 48 mil de ouro; "de R$ 89,90"; ícone "Oferta 24h" pulsando na Batalha V2 (o selo "+N" da fila desce para y≈360). MONTARIAS aprovadas (Lobo e Grifo). Lógica: Sys.offer / Sys.mount (fps-e2, desligadas); pagamento: Google Play Billing (fps-30). Alerta ao PO: preço de referência riscado precisa de checagem jurídica.
- GIT LOCAL criado (só código; .gitignore exclui imagens/áudio/vídeo/fontes/APK e fontes brutas): primeiro commit 68b1e16 = v0.12.1. Commit a cada versão fechada; nada vai para a internet.
- v0.12.2 (pedidos do PO após ver o print do celular): respiro entre o Kael e o inimigo da frente (para no alcance do golpe, sem sobrepor o Kael); "FC" sob o avatar sem aperto; nome da era sem corte ("Desafiar" menor ou abreviação oficial curta); Loja e Passe com um voltar só; mais os achados do QA. Preço riscado ("de R$ 89,90") NÃO aparece no jogo: "Pacote exclusivo · compra única".
- Pedidos do dono em protótipo (PO ajustando; NÃO implementar antes do protótipo): (a) barras de VIDA e ENERGIA em lugar melhor (proposta: finas acima da cabeça do Kael; sai a caixa do canto inferior esquerdo); (b) PASSE com ROLAGEM vertical contínua até o fim, sem páginas (exceção à regra antiga "painéis sem rolagem, com paginação").
- NAVEGADOR (dono/PO): o QA NÃO abre mais navegador (testa pelo celular/cabo). Engenheiro e agente dos painéis revezam UMA aba no PC inteiro, fechando ao terminar. Com isso a conferência no navegador antes de cada APK é só a dos próprios agentes.
- Loja/Passe: o "segundo voltar" é a seta de paginação do rodapé, que parece um voltar: redesenhar o pager ("‹ 1/3 ›"); Passe passa a rolagem contínua quando o protótipo chegar.
- v0.12.1 NO S24 (medido por adb): save mantido na atualização por cima; voltar na ordem menu → modal → painel → "Sair do jogo?"; pausa ok. DESEMPENHO: ~56 FPS na batalha em tela cheia (v0.11.6: ~113), memória ~1,0 GB (gráfica 720-740 MB; antes 821/610). Suspeita: backdrop-filter (vidro) sobre o canvas, DPR alto, animações CSS. Corrigir na v0.12.2 (meta >= 100 FPS no S24; mínimo 60 estáveis). Portar ao repositório o fechamento do MENU no voltar do Android (js/native.js).
- DONO: não precisa mais da versão jogável na internet. Daqui em diante cada versão fechada vai SÓ para o celular dele (APK pelo cabo no S24). A última versão publicada no artefato é a v0.11.6.
- API do servidor (docs/API_SERVIDOR.md §4 e §7, fps-30): compras reconhecidas e consumidas pelo SERVIDOR (GET /purchases/account-id, /purchases/can-buy); oferta com início das 24 h marcado no servidor (GET /offers → endsAt); cartão mensal (claim 1x por dia de Brasília); regras de aplicação dos grants; arena por semana (segunda-feira, meia-noite de Brasília), ranking do servidor sem bots; login Google por Credential Manager (ID do cliente WEB criado pelo dono).
- APROVADO PELO DONO: (1) BARRAS DE VIDA E ENERGIA ACIMA DA CABEÇA DO KAEL (docs/proto/BatalhaTelaCheiaV2.dc.html atualizado): vida 10 px, verde → amarelo abaixo de 50% → vermelho abaixo de 25%, treme e pisca ao tomar dano, rastro do pedaço perdido; energia roxa 6 px logo abaixo, pulsa quando cheia; SAI a caixa do canto inferior esquerdo. Entra na v0.12.2. (2) 19 PRÓLOGO V2 (docs/proto/Prologo.dc.html): 4 cenas (Relógio, os 9 pedaços, mapa-múndi, o chamado), antes da criação do personagem, pulável; arte em assets/map/. (3) Oferta de 1ª compra reconfirmada. Em voto: missão guia, Passe com rolagem contínua, Arena, Eventos, Leilão.
- 25 LEILÃO APROVADO pelo dono (docs/proto/Leilao.dc.html): entra no MENU com selo "Em breve: abre com o online" até o servidor existir; backend com a fps-30. Fila de painéis.
- ARTE APROVADA PELO DONO PARA INTEGRAR (atrás de chave onde a tela ainda não existe; respeitando a fila): eras 7-8 animadas (assets/anim/hyb/enemy/era7_*, era8_*) + ultimates das eras 7 e 8; pets filhote animados (assets/anim/pets/*) + ovo (pacote de pets); KAIA animada (assets/anim/hyb/kaia/*): liga a escolha da Kaia na criação (KAIA_ON); PISTOLA nas eras 3, 5 e 6 (assets/anim/hyb/R/pistol/*; o revólver da era 4 atirando foi REPROVADO: usar a pose de espada na era 4 até sair o novo); animações de LEVEL UP e de EVOLUÇÃO de fase (assets/anim/fx/levelup, evolve_0_1): trocam a animação antiga de subir de nível; 4 fases do Kael (só imagens por enquanto; animações da adolescente e da adulta em produção); MONTARIAS: Kael no lobo e no grifo (assets/anim/mounts/*), visual liga junto com o Sys.mount.
- PACOTE DE ARTE (ordem proposta, depois da v0.12.2 e do primeiro lote de painéis): level up novo → cenário da era 4 + parado A dos inimigos + morte do Kael v2 → Kaia → pistola eras 3/5/6 → pets → montarias; eras 7-8 só com a curva nova.
- Agente dos painéis: Forja, Pets V2 e Configurações (2 abas; Exportar/Importar com código de conferência; volume no save) ESCRITAS atrás de chave, NÃO vistas rodando.
- ORDEM DE VERSÕES APROVADA PELO PO (um APK por versão): v0.12.2 → v0.12.3 (level up novo + cenário era 4 + parado A dos inimigos + morte do Kael v2) → v0.12.4 (Forja e Configurações novas) → v0.12.5 (Kaia jogável) → v0.12.6 (pistola nas eras 3, 5, 6) → pacote de pets → montarias; eras 7-8 com a curva nova e o mapa.
- Configurações (09): seguir o protótipo: linhas ainda sem função aparecem com selo "em breve" desabilitadas; "código de resgate" e "termos" somem até existirem. KAIA: mesmas armas, skins e números do Kael; só muda o visual e a escolha na criação.
- OBRIGATÓRIO ANTES DA LOJA: carregar só a arte da era atual e baixar o resto sob demanda (APK 219 MB, ~1 GB de memória no S24). Disco do PC: 1,3 GB; PO pediu ao dono para liberar espaço.
- ECONOMIA NO SERVIDOR ("Cofre do Mercado", plano da fps-30 em reports/backend-economia.md; nada implementado): farm no aparelho; só o que entra no mercado vive no servidor. Obrigatórios (§3b): teto CUMULATIVO por conta (depositado − sacado <= máximo ganhável pela idade da conta); carimbo da versão do save a cada depósito (save antigo = fora do mercado até reconciliar); import local zera o acesso ao mercado até sincronizar; id único do servidor + hash do item; saque idempotente com confirmação. Gema comprada circulando: decisão do PO (proposta: só gema ganha; comprada só após 7 dias). Campo `origin` nos itens (drop, boss, chest, instance, summon, shop, reward, pass, offer, gift): normItem do farm.js precisa copiá-lo.
- PO: entradas de Forja e Progresso ficam no cabeçalho da mochila do Equipamento (alvo >= 44 px, selo de novidade). Leilão: ícone provisório = Loja + martelinho por código + selo "Em breve" (arte pedida à fps-ff). Passe com rolagem contínua: EM VOTO. Arena e Eventos: REPROVADOS, sendo refeitos.
- ORDEM DO DONO: "finalizar agora com o que temos". Lista do que falta em docs/LANCAVEL.md (~16 versões; aceita pelo PO). Kaia só garota; montarias só Lobo e Grifo; pets do Submundo/Celestial/Prismático em atualização. Decisões: Kael que cresce ENTRA no lançamento (0.13.x, quando as animações chegarem); SERVIDOR MÍNIMO (login convidado, save na nuvem, validação de compra) é condição do lançamento (AWS + banco com o dono); cenários vivos das eras 5-8 produzidos antes, uma era por vez, com voto (~18 créditos cada).
- v0.12.2 (parte do engenheiro fechada): barras de vida/energia sobre o Kael; cabeçalho; backdrop-filter removido e DPR máx 2 (ganho não medido no PC); layout antigo APAGADO; folga de 32 px entre o Kael e o inimigo da frente. PENDENTE DO PO: sobreposição meio × fundo acima do limite nas eras 0, 1, 4 (até 75/74/88%) e 2, 3 (até 60%): opções 2 comuns visíveis / aceitar / reduzir.
- DECISÃO DO PO: 2 COMUNS VISÍVEIS por vez nas eras 0, 1 e 4 (os outros entram conforme morrem; mesmo total da onda), sem encolher ninguém; nas outras eras, 3 como está. Entra na v0.12.3 (o APK da v0.12.2 sai antes, com a folga de 32 px).
- Cenário vivo da era 5 (Moderna) em produção (agente do cenário, sem navegador até a vez; ~18 créditos autorizados).
- REGRA DO DONO (defeito visto no celular, v0.12.1): ao equipar, o visual do Kael TEM de mudar na prévia do Equipamento E na batalha para ARMA (na mão; entra na v0.12.2), CHAPÉU/ELMO (cabeça rastreada; chapéus com a fps-ff), COLETE e BOTAS (troca de cor/material por código sobre máscaras do tronco e dos pés, que a fps-ff fornece sem crédito): estes três na versão seguinte, quando as máscaras chegarem. COLAR e LUVAS não aparecem. Fonte do visual: Sys.appearance.of (skin > look do item > nada).
- ORDEM DO DONO: chapéu, colete e botas visíveis no boneco ficam em STAND-BY (atualização futura). No lançamento, só a ARMA equipada aparece na mão (v0.12.2). NÃO implementar máscaras nem chapéu agora. (Substitui o plano de máscaras para o lançamento.) Regra da arma: skin de arma ESCOLHIDA pelo jogador > arma do item equipado > arma inicial; a skin inicial conta como "nenhuma skin" (validado pelo PO).
- Painéis da v0.12.2 conferidos no navegador (ponteiro): 5 telas em tela cheia, paginador, "Equipar melhor", arrastar. Não visto: toque de dedo real, soltar fora, compra, resgate.
- O DONO REVERTEU o stand-by: SISTEMA DE APARÊNCIA EM CAMADAS aprovado: roupa base + peças por cima (arma; chapéu, colete e botas por máscara; óculos/máscara como cosméticos); modo "Itens" ↔ "Skin"; olho para ocultar peça por peça (só visual). Arte (máscaras, chapéus por era nas 4 fases): fps-ff. Estado S.look: fps-e2. Protótipo do Equipamento com a aba "Aparência": a sair, para voto. fps-c9: planejar a renderização em camadas do Kael (prévia e batalha, uma função só) para a versão em que a arte chegar. A ARMA na mão segue na v0.12.2.
  Formato combinado com a fps-ff (sem crédito): máscara única por folha <folha>_mask.png (R = colete, B = botas, alfa = cobertura); âncora "head" por quadro (x, y, ângulo, escala) no .json + chapéus como PNG soltos. Já existem máscaras do Kael garoto em assets/anim/hyb/R/masks/ (correr, parado, golpe, giro).
- APROVADOS pelo dono: 23 ARENA V2 (7 ligas, luta épica), 24 EVENTOS V2 (trilha, chefe do evento, loja), 27 TORNEIO DO PODER (28 territórios, 15 x 15; seguir a spec da fps-e2, não os números do protótipo). Todos dependem do servidor para valer prêmio; telas DEPOIS do lançável básico (Eventos offline só se o relógio local da fps-30 servir). Guilda (26) reprovada, em refação. Protótipos em docs/proto.
- Máscaras do Kael garoto (assets/anim/hyb/R/masks/kael_{run,idle,attack,spin,die}_mask.png): TESTADAS por mim fora do jogo (pintura por luminância x tinta): colete e botas pintam certo na corrida e no parado, sem vazar do corpo. Aparência em camadas ainda não ligada.
- Aparência em camadas, lógica pronta (fps-e2, reports/sys-e2-api.md §5j; estado em S.look, só visual): Sys.appearance.layers(S, Sys.host) → camadas de baixo para cima {layer, key, source, era, r, id}: base, botas, colete, chapéu, óculos, máscara, arma (sem o que está oculto; colar e luvas não aparecem). Skins iniciais w00/a00 = "nenhuma escolhida" (mesma regra do heroLook da v0.12.2). Modo Skin com skin de roupa escolhida: [base, skin, arma]. Ações: setMode, setLookHidden, addCosmetic, equipCosmetic. Chaves de sprite propostas (item/<espaço>/e<era>_r<raridade>, cos/<id>, skin/<id>): a confirmar com a fps-ff. S.look é campo novo no topo do save (fps-30 avisada para a validação do servidor). Ligar no jogo: versão da aparência, depois do voto do protótipo.
- Aparência em camadas, complemento (PO, codado pela fps-e2): camada de ASA vem PRIMEIRO (atrás do corpo, presa às costas), aparece nos modos Itens e Skin, tem olho para ocultar ('wing'); skin de asa (demoníaca, anjo) vence o item de asa. Ordem final de baixo para cima: asa, base, botas, colete, chapéu, óculos, máscara, arma; no modo Skin com skin de roupa: asa, base, skin, arma. A arma continua no modo Skin; os cosméticos somem junto com as peças. Com servidor: cosméticos pelo GET /entitlements (produtos cos_<id>).
- v0.12.2 FECHADA: commit 015a221. Arma do item na mão (vitrine + batalha) feita; APK em compilação para o S24.
- v0.12.3 (escopo atualizado pelo PO): PISTOLA aprovada ANTECIPADA (eras 3, 5, 6: assets/anim/hyb/R/pistol; a pose de tiro antiga sai); revólver da era 4 corrigido pela fps-ff está em voto de novo: deixar pronto atrás de chave e ligar com o voto; 2 comuns visíveis nas eras 0, 1, 4; level up novo; cenário era 4; parado A dos inimigos; morte do Kael v2; origin nos criadores de item. Kael adulto (assets/anim/hyb/phase2) em voto: não ligar.
- REGRA DO DONO (MENU e ícones da batalha): cada função fica OCULTA (nem com cadeado) até o jogador atingir o nível de liberação (tabela em reports/liberacao-por-nivel.md: Pets 20, Eventos 24, Arena 28, Guilda 32 etc.). Ao liberar: o ícone aparece UMA vez com animação "NOVO!" (brilho + selo) e um balão curto dizendo o que é. Vale para o drop down do MENU e para os ícones fixos. Itens do MENU sem tela ("Em breve") também ficam OCULTOS até existirem. Entra na v0.12.3 (com o Sys.level).
- v0.12.2 INSTALADA no S24 (APK ~188 MB): batalha a 98 FPS (v0.12.1: 56,5; v0.11.6: 112,8), mediana 8,3 ms, pior quadro 25 ms; memória 769-777 MB (gráfica ~543); abertura 588 ms; save mantido; arma do item na mão (vitrine e batalha) vista no aparelho; voltar do Android ok. Não verificado: som, vibração, x2/x4, outras eras, arrastar com dedo.
- PO: divisão aprovada: v0.12.3 = pistola aprovada (eras 3, 5, 6; era 4 atrás de chave) + 2 comuns visíveis (eras 0, 1, 4) + liberação por nível LIGADA + level up novo; v0.12.4 = cenário era 4 + parado dos inimigos + morte do Kael v2 + Forja e Configurações. NÍVEIS DE LIBERAÇÃO CONFIRMADOS (reports/liberacao-por-nivel.md): Missões 2, Invocar 3, Práticas 5, Correio/Login 7, Perfil/Loja de gemas 10, Forja 12, Instâncias 14, Torre 15, Passe 18, Pets 20, Eventos 24, Arena/Ranking 28, Guilda 32, Montaria 38, Torneio 40, Leilão 45, Asa 50. Ícones fixos seguem a tabela (Passe oculto até 18; Invocar no 3 com o tutorial nesse momento; Loja de ouro desde o início). Saves antigos: o que está no nível ou abaixo aparece com "NOVO!" uma vez; o que está acima some até chegar lá.
- DISCO: chegou a 338 MB livres (17h+). Limpezas: cópia de trabalho do app (187 MB, se refaz), fps-ff ~430 MB de intermediários, PO 129 MB (cópia da versão jogável). Um PNG temporário de 188 MB (Temp\77aff2e7-…tmp, 17:07) sem dono: ninguém apaga; PO indica ao dono. Cada APK precisa de ~1 GB livre: o dono precisa liberar espaço (pasta Vídeos dele tem 3,2 GB). Todas as sessões: nada de arquivo grande; conferir tamanho após gravar.
- Cenário da era 5 (Moderna) MONTADO (assets/bg/v2/era5, 52 arquivos, ~1,35 MB; 16 créditos; scene.js novo SHA-1 5b725460…, cópia anterior em test/bg/tools/scene.pre-era5.js): NÃO visto em movimento; falta a conferência no navegador e a comparação pixel a pixel das eras 0-4. Saldo da conta: ~1.051 créditos.
- Painéis: liberação por nível escrita e ligada (PANEL_V2.gate): Progresso 5, Forja 12, Loja antes do 10 só com itens de ouro (abas de skins e de gemas ocultas), atalho ao Passe 18. Não vista rodando.
- DISCO: o PO (com autorização prévia do dono para liberar espaço) apagou da Temp as 14 pastas flutter_tools.* e 5 dos 6 instaladores do VS Code; não apagou o cache "jest" (modificado hoje). Livre: ~2,7 GB. APKs podem voltar a compilar; fps-ff pode retomar downloads com moderação (um por vez, apagando o bruto).
- v0.12.3 FECHADA: commit 567045c (pistola eras 3/5/6, 2 comuns visíveis eras 0/1/4, liberação por nível, level up novo). APK pendente: celular fora do cabo; conferência das eras 0-4 com o scene.js novo em curso.
- APROVADOS PELO DONO para integrar (seguindo a fila): REVÓLVER refeito (liga a era 4 com pistola: ART_ON.pistol_era4 → true na próxima versão); KAEL ADOLESCENTE, ADULTO e GUERREIRO (espada, giro, golpe, morte; pistola do adolescente e do adulto; a do guerreiro REPROVADA, em correção); 5 PETS médio/evoluído (formato econômico): evolução nos níveis 30/60; MONTARIAS: lobo (galope e golpe; parado REPROVADO, em correção) e grifo + AURA por estrela; AVÔ do Prólogo (assets/hero/grandfather.png) no lugar da silhueta; ÍCONE do Leilão (assets/icons/menu/auction.png).
- GIT REMOTO (pedido do dono via PO): origin = repositório do dono no GitHub, branch main; a cada versão fechada: commit + `git push origin master:main`. Nunca subir .env/segredos; imagens/áudio fora (.gitignore). Varredura feita nos 637 arquivos versionados: nenhum segredo, chave ou credencial; o número de série do celular aparecia numa linha deste contrato e foi retirado (continua no histórico já enviado). Pendente: PO confirmar que o repositório é PRIVADO.
- ATENÇÃO: o repositório remoto no GitHub está PÚBLICO (conferido pelo PO). NÃO empurrar mais nada até o dono deixá-lo privado. Commits locais continuam a cada versão. Já está público (enviado pelo PO): código, docs/ e reports/ até o commit 567045c (decisões internas, planos de preço e do servidor, caminhos do PC, número de série do celular numa linha do contrato). Limpeza do histórico só com ordem explícita do dono.
- GIT REMOTO: o dono decidiu (via PO) que o repositório PODE FICAR PÚBLICO. Arranjo: fps-c9 faz o commit local a cada versão e passa o identificador; o PO faz o push (master → main, sem --force). Nunca versionar segredo, .env nem dado pessoal novo; fps-server só com ordem do dono. Pergunta em aberto ao dono: manter docs/ e reports/ públicos ou tirá-los do versionamento.
- Cenário da era 5 CONFERIDO no navegador e pronto para voto (scene.js SHA-1 5b725460…; eras 0-4 idênticas pixel a pixel); entregue ao PO com a lista de fraquezas.
- Montaria: assets/anim/mounts/kael_wolf_idle_body.json corrigido pela fps-ff (arma sumia dentro da montaria); ao desenhar a arma por código no estado montado, a camada "cabeça na frente da arma" usa só a cabeça do Kael (x < grip.x + 8). Âncoras de cabeça, chapéus (assets/anim/equip/hats) e cosméticos (assets/anim/equip/cos) em processamento.
- CORREÇÃO DO DONO: nada fica para depois do lançamento, só a Bênção de equipamento. Entram no lançamento: Kaia nas 4 fases, 6 montarias (Básica/Rara/Mítica/Lendária etc.), 8 pets + Prismático (Submundo, Celestial, Raposa). Fila ajustada em docs/LANCAVEL.md (~22-25 versões). Git: o PO faz o push a cada versão (eu passo o commit); o dono quer tudo público, docs inclusos.
- PO: fila de ~22-25 versões aprovada; carregamento sob demanda (só era, herói e fase em uso) antecipado para logo depois da curva, antes do Kael nas 4 fases.
- QA no CELULAR (v0.12.2, por adb, sem alterar o save): arma na mão troca na batalha e na vitrine (habilidades acompanham); "Toque para continuar" corrigido; cabeçalho e barras certos. Achados para a v0.12.4: aviso de Drop cobre o cabeçalho; e a arte das armas é por ERA × 3 níveis (raridades 0,1 → t0; 2,3 → t1; 4 → t2): armas Básica e Rara da mesma era parecem IGUAIS (o dono só tem armas da era 0, Básicas e Raras): decisão do PO pendente: aceitar / diferenciar a raridade por código (recomendado) / arte nova (+14 armas).
- DECISÃO DO PO (armas): (b) na v0.12.4: diferenciar por código (brilho/contorno/tinta da raridade) as raridades que repetem a imagem da arma; e (c) a fps-ff produz as armas que faltam para haver 1 arte por raridade em cada era; quando chegarem, trocar a tabela arma → imagem. Aviso de drop desce para não cobrir o cabeçalho (v0.12.4).
- QUEIXA DO DONO: no celular ainda não viu asas, evolução, montaria nem pet. DECISÃO DO PO: (a) v0.12.4 = "PRÉVIA DA ARTE" só no app de teste (item no MENU fora da regra de nível; some na versão de loja) + "MODO DONO" (save SEPARADO, sem tocar no save real; atalhos: nível 20/32/50/70, ovo, montaria, asa) + tinta de raridade na arma por código + revólver da era 4 ligado + aviso de drop fora do cabeçalho. (b) FILA REORDENADA: v0.12.5 PETS; v0.12.6 MONTARIAS; depois cenário era 4 + parado + morte do Kael + Forja + Configurações; Kaia e telas em seguida.
- QUEIXA FORTE DO DONO ("tela que eu não consigo entrar, fui tentar forjar e não consigo, tá podre"). Na v0.12.2 o MENU mostrava Forja, Pets, Torre, Instâncias, Ranking, VIP, Correio, Eventos como "Em breve". REGRA (dono/PO): nenhum botão visível pode não fazer nada; o que está aprovado e implementado TEM que abrir; o que não está pronto NÃO aparece. v0.12.4, nesta ordem: FORJA ligada e conferida; Configurações nova; auditoria de botões (reports/botoes-v0.12.4.md e botoes-paineis-v0.12.4.md); MODO DONO liberando todas as telas existentes (ignora nível) + Prévia da arte; raridade visível na arma; revólver da era 4; aviso de drop. Lista tocada no aparelho: C:\Users\rafae\Desktop\fps-android\botoes-v0.12.3.md (a produzir).
- PO: trabalho em PARALELO com os 2 agentes: engenheiro = v0.12.4 (botões, Modo dono, Prévia, entradas) → v0.12.5 pets → v0.12.6 montarias; agente dos painéis = Forja + Configurações (v0.12.4) → 6 telas de sistema (VIP, Instâncias, Torre, Ranking, Troca de era, Vitória/Derrota), uma por vez, saindo junto com as versões. REGRA: save ANTIGO não perde o que já usava (Passe, Loja completa etc. continuam visíveis); só jogador novo segue a tabela de níveis desde o início.
- REINÍCIO DAS SESSÕES (noite de 2026-11-12): v0.12.3 (567045c) instalada no S24 às 18:25 (2 prints do aparelho); medidas e lista tocada dos botões não feitas. A v0.12.4 estava só começada (~46 linhas; Forja e Configurações ainda desligadas). Servidor local religado. Retomada: agente dos painéis com a aba para ligar Forja e Configurações; engenheiro em botões sem ação + save antigo sem perder acesso. DECISÃO DO PO: a v0.12.4 sai só com Forja abrindo, Configurações e nenhum botão morto; Modo dono, Prévia da arte e raridade na arma vão na versão seguinte (0.12.4b/0.12.5), depois pets e montarias.
- DECISÃO DO DONO: a sessão QA também é AJUDANTE: escreve as 6 telas que faltam, uma por arquivo, atrás de PANEL_ON desligado, sem navegador: js/p_vip.js, p_era.js, p_tower.js, p_inst.js, p_rank.js, p_result.js (nessa ordem); pedidos a outros arquivos em reports/pedidos-entre-agentes.md com prefixo Q-. A sessão do engenheiro (fps-c9) revisa, confere no navegador e liga. O agente dos painéis fica com Forja/Configurações e depois Pets.
- v0.12.4, parte do engenheiro ESCRITA (não vista no navegador): auditoria de botões (reports/botoes-v0.12.4.md), entradas da Forja/Configurações pelo registro, save antigo com S.bornV='old' e S.unlKeep (Missões, Invocar, Práticas, Loja de gemas, Passe), revólver da era 4 ligado, aviso de Drop abaixo do cabeçalho. Modo dono, Prévia da arte, raridade na arma e asa no Kael: versão seguinte.
- ORDEM DO DONO (via PO): "tudo que está aprovado tem que estar funcional"; backlog único com dono por linha em docs/BACKLOG_URGENTE.md. NÃO haverá APK no celular até TUDO do backlog estar pronto e funcional; commit a cada bloco (identificador ao PO para o push), conferência no navegador, status curto a cada bloco; um APK final quando estiver tudo pronto.
- v0.12.4: FORJA e CONFIGURAÇÕES novas LIGADAS e vistas funcionando no navegador (forja real +0 → +6, exportar/importar progresso de ponta a ponta); FB_UNLOCK lê de Sys.level (fonte única); conferência final do engenheiro em curso.
- PO (palavra do dono): NADA de APK no celular dele até o fim, nem interno. Desempenho: medir no NAVEGADOR com CPU e memória limitadas (perfil de celular comum) a cada bloco pesado (pets, montarias, 4 fases, eras novas), registrar como ESTIMATIVA; meta >= 60 quadros/s e memória sob controle com o carregamento sob demanda. Risco de retrabalho no fim anotado pelo PO.
- 18 armas por raridade entregues pela Arte (assets/weapons/eraN_raro.png e eraN_mitico.png + meta.json), em voto do dono; PO autorizou integrar: Raro → eraN_raro, Mítico → eraN_mitico (heroKey em battle.js, stage.js, skinArt em screens.js). Entra com a raridade na arma (v0.12.5).
- QA-ajudante: tela VIP escrita (js/p_vip.js, não vista rodando); o agente dos painéis carrega, confere e liga.
- APROVADOS PELO DONO: 01b TÍTULO NOVO (logo A/B/C a escolher), 28 BEM-VINDO DE VOLTA (sem o botão "VIP: dobro"), 29 NOME DO JOGADOR, 26 GUILDA V2 (tela; servidor para prêmios/trocas; com o QA depois das 6 telas). 30 Códex REPROVADO. Os três primeiros entram no bloco das telas iniciais (Título/Login/Prólogo/Criação/Perfil/Oferta). Protótipos em docs/proto.
- v0.12.4 FECHADA: commit a859408 (push feito pelo PO). Sem APK (ordem do dono).
- TÍTULO NOVO (01b): o dono escolheu o logo B · CRISTAL (noite futurista, anéis de luz): docs/proto/TituloV2B.dc.html. Entra no bloco das telas iniciais.
- SISTEMAS (fps-e2, agora "fps-69"): (1) Sys.pet.ensure e Sys.mount.ensure atualizam a ficha no lugar (corrige o feedTap na raiz; o desvio em js/p_pets.js pode sair). (2) NOVO js/sys/phases.js (Sys.phases): curva de 9 eras Revisão 2 (100 fases x 4 dificuldades), DESLIGADA (DATA.on=false), fora da lista de scripts do index.html. Para ligar: junto com Sys.level.setV9(true) e Sys.stats.setEra9(true); na primeira carga Sys.phases.migrate(S, host, S.stage); mkEnemy por Sys.phases.enemy(era, dif, fase, 'common'|'boss') → hp, dmg, def (ouro: fórmula atual em e.goldStage x e.goldMult); fase 50 = chefe, 100 = Senhor; mapa: eraView, canChallenge → {ok, reason, glow}, win → {first, next, eraUnlocked}; era liberada: Sys.phases.eraMax(S); XP de abate addXp(S, n, host, 'kill'); eras 0-1 com fase de 1 onda curta (info().shortWave). (3) test/sys/e2-all-on.test.js liga todas as chaves dela e leva um jogador do nível 1 ao fim da era 8 sem erro. Ela pausou para ajudar a Arte.
- SERVIDOR (fps-30, agora "fps-6f"): CAMADA DE API do jogo pronta em js/sys/net.js (Sys.net), DESLIGADA e ainda fora do index.html. Ligar (quando o dono passar o endereço): Sys.net.init({fetch, storage, clientVersion}); DATA.base='https://<host>/v1'; DATA.on=true. Tokens e id do aparelho no localStorage ('eon.net'), nunca no S. Abertura: ensureSession({birthDate:'AAAA-MM'}) (idade vem de tela neutra) → sync(S, resumo): 'pulled' troca o S; 'choose' mostra os dois resumos e chama chooseSide; 'none'/'push' nada. markDirty ao mudar; push ao sair, a cada 2 min e em marcos (mín. 30 s). Compras: accountId → Billing; canBuy; verifyGoogle; NÃO dar acknowledge no app. ENTREGA só pelo Sys.net.deliveries() + ackDelivery (regras em docs/API_SERVIDOR.md §7; revoke = estorno). Sem rede: {code:'offline'} e o jogo segue local. Entra no bloco do servidor mínimo (depois das telas iniciais; precisa da tela de idade neutra e da tela de escolha de save).
- ARTE entregue (fps-ff, agora "fps-75"), a ligar na ordem do backlog: PETS novos assets/anim/pets/{era7_cerberus, era8_pegasus, prism_fox}{, _mid, _evo}_{run, idle, atk1}.png/.json (célula 512x352, pés em y=307, 12 fps; run 8 quadros, idle e atk1 12); os 5 pets do lançamento também têm _mid e _evo. APARÊNCIA EM CAMADAS: chapéus em assets/anim/equip/hats/hats.json (eras 0-8; pivot, res, hideHair); óculos/máscaras em assets/anim/equip/cos/cos.json (layer glasses|mask); âncora da cabeça por quadro em assets/anim/hyb/<R|phase1|phase2|phase3>/masks/kael_<estado>_head.json; desenhar: translate(x,y), rotate(ang°), scale(s/res), drawImage(png, -pivot.x, -pivot.y); ok=false esconde no quadro; com hideHair, apagar antes o cabelo com masks/kael_<estado>_hair.png (destination-out; pronto para run/idle); colete/botas por masks/kael_<estado>_mask.png (R colete, B botas). Referência visual: assets/anim/look_preview/. Lista completa a caminho em docs/ARTE_LIGAR.md (Sistemas).
- GUIAS PARA LIGAR (Sistemas): reports/ligar-sistemas-e2.md (por sistema: chave, o que o host fornece, chamadas, como conferir: curva/Sys.phases, qualidade/fusão/adormecido, Pets V2 com ovo do Nv 20, montaria e oferta, aparência e Kael por fase, Prismático, liberação por nível) e docs/ARTE_LIGAR.md (caminho e formato de toda a arte nova). ATENÇÃO: o index.html ainda não carrega pet, mount, offer, appearance, phases e clock; têm de entrar ANTES do 'fc' (o fc soma o bonus() de quem estiver carregado); ordem segura no guia. Prova de convivência: node test/sys/e2-all-on.test.js.
- ARTE: 4 MONTARIAS novas entregues (ids do js/sys/mount.js: pony, horse, mythic = tigre de cristal, wyvern): assets/anim/mounts/kael_<id>_{run,idle,attack}_{body,era2_t1}.png/.json (célula 512x352, patas em y=339; run 8, idle 12, attack 17 quadros; arma trocável pelo grip do _body.json, como no lobo) + aura por estrela kael_<id>_{run,idle}_{1..5}star. Armas das eras 7-8 agora têm dados de encaixe no meta.json. Em voto/ordem do backlog; lista em docs/ARTE_LIGAR.md.
- PO: TODA a arte da força-tarefa está gerada, PENDENTE DO VOTO DO DONO: pets do Submundo/Celestial/Prismático (3 estágios), 4 montarias novas (Kael montado + aura), Kaia nas 3 fases (assets/anim/hyb/kaia_phase1..3), aparência em camadas (chapéus por era, máscaras, óculos, look_preview), 45 armas, dados de encaixe das eras 7-8. PO autorizou INTEGRAR ATRÁS DE CHAVE já (liga com o voto). Em voto no canvas: 30 Códex, 31 Correio, 32 Chat, 33 Montarias, 34 Missões (não implementar antes do voto).
- v0.12.5 FECHADA: commit f30627f (push feito pelo PO): 45 armas por raridade, Modo dono, asa no Kael, Prévia da arte (24 cartões), raridade pela borda e cor nas telas, VIP ligada. Pendências: desempenho não medido; asa correndo/no golpe; regra da asa (provisória: item Épico+ = anjo, abaixo = demoníaca; skin vence; PO pediu que leia de UMA tabela fácil de trocar; aguardando o dono); Torre com 3 andares visíveis (aguardando o dono).
- Telas do QA: VIP ligada; Torre e Troca de era corrigidas (zero emoji; sem fênix), a ligar após olhada no navegador. Sys.tower.rewardsFor ainda devolve a fênix no andar 100 (js/sys/tower.js:141-144): pedido a Sistemas. REGRA: zero emoji em qualquer tela.
- EM CURSO: v0.12.6 PETS (engenheiro no navegador); depois montarias; Kaia pronta para ligar (ARTE_LIGAR §9b).
- DECISÕES DO DONO: (1) ASA: cada asa é um ITEM PRÓPRIO (cai numa era; o jogador fica com ela); a asa EQUIPADA é a que aparece; quem tem as duas escolhe; NÃO muda por raridade nem por era. Sai a regra provisória "Épico+ = anjo". Demoníaca e anjo viram itens distintos no espaço de asa; a arte segue o item equipado. (2) TORRE: a torre INTEIRA rolando, como no protótipo do canvas (não 3 andares por vez): o QA refaz.
- QA: tela 4 Instâncias escrita (js/p_inst.js); "Entrar" depende de window.startInstanceRun(run) no jogo (rodar a horda, Sys.instances.finish, PInst.showResult): fila do engenheiro depois de pets e montarias. Tela de Pets usa "★" em 6 lugares: avaliar contra a regra de zero emoji.

## REGISTRO REFEITO (as anotações feitas depois da v0.12.6 foram perdidas num `git checkout -- .` acidental de outra sessão; resumo reposto pela fps-c9)
- INCIDENTE (noite de 2026-11-12): um `git checkout -- .` acidental descartou TODAS as alterações não commitadas em arquivos rastreados desde 0bdde98 (v0.12.6). Arquivos novos sobreviveram (commit de segurança 1557820). Perdido e em refação: v0.12.7 do engenheiro, ajustes do agente dos painéis, edições de Sistemas/Servidor em js/sys, Torre inteira do QA. REGRAS NOVAS: nenhuma sessão roda git que altere arquivos (checkout, restore, reset, stash, clean); só a fps-c9 commita; commit de segurança a cada passada de agente e a cada tela entregue.
- v0.12.6 FECHADA: commit 0bdde98: PETS (ovo no nível 20 chocando, pet na batalha nos 3 estágios, golpe a cada 2 s, tela de Pets).
- ORDENS DO DONO desde então: (1) PET ao lado e um pouco à frente do Kael; camadas: asa → Kael (montado: pés na sela, patas no chão) → pet na mesma linha do chão (~35-45% da largura do Kael à frente; altura ~45-55% do Kael, estágio 3 até 65%) → inimigo; ninguém flutua; pet não cobre rosto nem arma; barras acima do Kael; deslocamentos em tabela por pet/montaria; 4 combinações com print. Ajustes do PO: pet mais à frente/baixo até as patas da frente da montaria aparecerem; asa do Kael mais alta e atrás em montaria com asas (contorno leve; não esconder); aura visível em 1 estrela e forte em 5. (2) ASA = ITEM PRÓPRIO (item.wing 'angel'|'demon'; a equipada aparece; não muda por raridade/era); drop: anjo nas eras 0-6 e 8 e primeira asa no nível 50; demoníaca na era 7 e no Hell; pode ter skin no futuro (gancho). (3) TORRE inteira rolando, como o protótipo. (4) FASES adulta e guerreira (Kael e Kaia) serão REFEITAS pela Arte; tabela de escala por fase 1,0/1,12/1,25/1,30 pronta no código. (5) MONTARIA SERPE (wyvern) REPROVADA: não ligar; seguem lobo, grifo, pônei, cavalo, tigre. (6) ULTIMATE POR ARMA: uma por ERA DA ARMA (9 famílias); raridade muda cor, força do efeito e golpe final (só visual; tabela Sys.stats.skillFx); a era só muda cenário e drops; Troca de era sem "Nova ultimate"; conferir que nada usa a era atual; faltam nomes SKN das eras 7-8. (7) MUDANÇA DE PODER NA TELA em tudo que mexe na FC ("+1.234 ▲" verde / "−567 ▼" vermelho; função única; Sys.fc.snapshot/delta/measure). (8) normItem preserva wing, offer, gotAt, origin e campos simples desconhecidos.
- TELAS APROVADAS (todas): 05 aba Aparência, 04c missão guia, 08 Passe com rolagem, 33 Montarias, 30 Códex V2, 31 Correio, 32 Chat (frases prontas), 34 Missões (vira A tela de missões; no Passe a aba vira botão; "Atividade de hoje" e "Conquistas" entram, módulo de Sistemas, atrás de chave até lá), 01b Título (logo B · Cristal), 28 Bem-vindo de volta (sem "VIP: dobro"), 29 Nome do jogador, 26 Guilda V2. Vitória/Derrota: reusar a de js/screens2.js comparada com o protótipo aprovado. Protótipos em docs/proto (conferidos pelo PO).
- FORÇA-TAREFA DE TELAS (docs/FORCA_TAREFA_TELAS.md): as 6 sessões escrevem telas em js/p_<nome>.js; a fps-c9 só LIGA em lotes. QA: Códex, Correio, Chat, Guilda (+ Torre inteira, Missões, Ranking, Instâncias já entregues). Sistemas: Arena, Eventos, Torneio. Servidor: Título/Login/Prólogo/Criação/Nome/Bem-vindo (p_intro). Arte: Mapa das Eras + Perfil. Ordem: v0.12.7 (refeita) → v0.12.8 (ligar tudo que está escrito + poder na tela + 3 ajustes) → ultimate por arma, Passe com rolagem, missão guia, Aparência.
- SEM APK até tudo do backlog estar pronto (ordem do dono); medir desempenho no navegador como estimativa. Git: commit local pela fps-c9; push pelo PO; repositório público.
