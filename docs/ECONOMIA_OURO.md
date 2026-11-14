# Economia do ouro (Sistemas, 14/11/2026)

Regra do dono: "Ouro deve ser difícil de conseguir, sempre em quantidades pequenas. Tudo que é upável sobe com ouro (montaria, arma…). Se o ouro for fácil, fica fácil upar e passar de nível. Não pode ser tão difícil, mas também não pode ser tão fácil."

Simulação: `node tools/sim-ouro.js` (texto) ou `node tools/sim-ouro.js --md` (as tabelas abaixo). Roda em menos de 1 s, sem navegador. Ela lê os números atuais dos módulos `js/sys`, então mostra na hora o efeito de qualquer mudança.

## 1. Medida: "minutos de abate da fase atual"

- **1 abate** = `host.goldUnit()` = ouro de 1 inimigo comum da fase (`js/farm.js`: `ceil(4 × 1,15^(fase−1) × 0,32)`). O chefe vale ×5 sem o 0,32.
- **1 min de abate = 24 abates = 24 × goldUnit.** É o ritmo medido da build: 23-24 abates por minuto de jogo (docs/RECOMENDACOES.md e docs/balance.json `loot.xp_nota`), o mesmo número de `Sys.mapchest.DATA.killsPerMin` e do `Sys.clock`.
- **Abates por dia** (jogador grátis típico) = `KILL` do `tools/sim-180-dias.js`: 3663, 3180, 3024, 3934, 3909, 4854, 4846, 4842 e 5799 nas eras 0 a 8. Isso dá **126 a 242 min de abate por dia**.
- Mais premissas do cenário diário:
  - 10 fases por era (curva de hoje);
  - 1 volta do offline de 8 h por dia;
  - instâncias com 2 chaves por área, no Normal, e 40 abates na Mina de Ouro;
  - Hora de Ouro pegando 30 min de jogo;
  - torre com 2 andares por dia, no andar 1,5 × fase;
  - Arena com 3 lutas (2 vitórias), liga Prata;
  - Acampamento no Nv 5 com 2 pets Raros 2★;
  - Provação a cada ~20 dias.
- Porcentagens de ouro (VIP, títulos, prática Coleta, mentores, Encruzilhada, Fogueira da Guilda) multiplicam o abate. Elas não são resgate e ficam fora do X.

## 2. Teto por resgate e meta do dia

- **X = 5 min de abate por resgate (120 × goldUnit).** Nenhum resgate isolado (baú, missão, prêmio, coleta) passa disso.
  - Por que 5: uma tentativa de Forja custa 30 abates (1,25 min) e um nível de Montaria Épica 40-235 abates (1,7-9,8 min).
  - Com 5 min, um resgate paga no máximo ~4 tentativas de Forja ou ~1 nível de montaria. Ele ajuda, mas não pula a curva.
  - Os baús do mapa (3 min) e a Provação (3 min) ficam abaixo.
- **Meta do dia: os resgates somam ≤ 65 min de abate por dia**, sem o offline e sem as porcentagens. Isso é **~+40% sobre o ouro de abate** do dia típico (+31% a +48%, conforme a era).
- **Offline: ≤ 60 min de abate a cada 8 h**, uma linha à parte. São 3 abates/min, 1/8 do ritmo ativo.

## 3. Fontes: hoje e proposto

"resgate · dia" em minutos de abate. Ouro absoluto por dia nas fases 10, 30 e 50 (goldUnit 5, 74 e 1 207).

| Fonte | Hoje: resgate · dia (min) | Hoje: ouro/dia F10 · F30 · F50 | Proposto: resgate · dia (min) | Proposto: ouro/dia F10 · F30 · F50 |
| --- | --- | --- | --- | --- |
| Abate (a base) | — · 126-242 | 18,3 mil · 223,8 mil · 4,7 mi | igual | igual |
| Offline 8 h (js/meta.js) **(vivo)** | 187,3 · 187,3 | 21,6 mil · 332,6 mil · 5,4 mi | 60,0 · 60,0 | 7,2 mil · 106,6 mil · 1,7 mi |
| Baú de abates (Sys.chest) **(vivo)** | 1,3 · 7,5 | 900 · 13,3 mil · 217,3 mil | igual | igual |
| Passe grátis (Sys.pass) **(vivo)** | 1,7 · 0,4 | 50 · 740 · 12,1 mil | igual | igual |
| Torre, 2 andares/dia (Sys.tower) **(vivo)** | 2,0 · 3,9 (andar 135: 4,2 por andar) | 290 · 7,0 mil · 156,9 mil | 1,4 · 2,8 | 245 · 5,0 mil · 102,6 mil |
| Instâncias, 2 chaves cada, Normal (Sys.instances) **(vivo)** | 16,7 (Mina no Difícil) · 29,3 | 3,5 mil · 52,1 mil · 849,7 mil | 5,0 · 13,3 | 1,6 mil · 23,7 mil · 386,2 mil |
| Arena: 3 lutas/dia + liga semanal (Sys.arena) **(vivo)** | 16,7 (liga Ouro) · 6,0 | 714 · 10,6 mil · 172,4 mil | 5,0 · 4,9 | 586 · 8,7 mil · 141,4 mil |
| Hora de Ouro +100% (Sys.schedule), 30 min jogados **(vivo)** | 30,0 · 30,0 | 3,6 mil · 53,3 mil · 869,0 mil | 9,0 · 9,0 | 1,1 mil · 16,0 mil · 260,7 mil |
| Baús de atividade (Sys.activity) (desligada) | 5,0 · 13,3 | 1,6 mil · 23,7 mil · 386,2 mil | 2,0 · 6,0 | 720 · 10,7 mil · 173,8 mil |
| Login 7 dias (Sys.login) (desligada) | 1,3 · 0,3 | 36 · 529 · 8,6 mil | igual | igual |
| Conquistas + Coleção, em 180 dias (desligadas; estimativa) | 125,0 · 16,1 | 1,9 mil · 28,5 mil · 465,5 mil | 5,0 · 1,9 | 226 · 3,3 mil · 54,6 mil |
| Guia (Sys.guide) (desligada; uma vez) | 0,8-3,3 · — | — | igual | igual |
| Evento: loja "Saco de ouro" e trilha (Sys.events/evtrail) (desligados) | 2,1 / 2,5-16,7 · — | — | 2,1 / ≤ 5,0 | — |
| Provação (Sys.trial), 1 a cada ~20 dias (nova, desligada) | 7,5 (Nv 30; 22,5 no Nv 90) · 0,4 | 15 · 666 · 21,7 mil | 3,0 · 0,2 | 18 · 266 · 4,3 mil |
| Derrota premiada (Sys.bossloss) (nova, desligada) | 0,2 · 1,0 | 107 · 1,7 mil · 28,3 mil | igual | igual |
| Dupla (Sys.duo) diária + semanais (nova, desligada) | 6,3 · 4,0 | 486 · 7,2 mil · 117,3 mil | 5,0 · 3,9 | 464 · 6,9 mil · 112,1 mil |
| Fogueira da Guilda (Sys.guildFire), 9 baús em 60 dias (nova, desligada) | 16,7 · 1,5 | 180 · 2,7 mil · 43,5 mil | 5,0 · 0,5 | 54 · 799 · 13,0 mil |
| Acampamento, Tenda do Ouro (Sys.camp) (nova, desligada) | 34,1 (137 no Nv 10 + pets + VIP 14 h) · 102,4 | 12,3 mil · 181,9 mil · 3,0 mi | 2,6 (máx 5,0) · 7,7 | 922 · 13,6 mil · 222,5 mil |
| Baús do mapa (Sys.mapchest), 2 por era (nova, desligada; outra sessão) | 3,0 · 0,9 | 103 · 1,5 mil · 24,8 mil | igual | igual |
| Ladrão de Brasas (Sys.thief), Fim das Eras (Sys.erasEnd) | 0 (Brasas, gemas e pedras; sem ouro) | 0 | igual | igual |
| Desmontar (Sys.stats.dismantleGold, também na Fogueira) | devolve 50% do ouro que o item já gastou: não cria ouro | 0 líquido | igual | igual |
| Encruzilhada ouro %, se o goldPct do Sys.fc for ligado ao abate (nova, desligada) | % · 30,2 (3 de 9 escolhas × 8%; até +72%) | 4,4 mil · 53,7 mil · 1,1 mi | % · 6,3 (+5%, uma vez por era) | 916 · 11,2 mil · 235,9 mil |
| Oferta paga (Sys.offer) **(vivo)** | 83 min (2 000 abates, uma vez, pago) | — | ver §6 | — |
| Correio (Sys.mail) **(vivo)** | ouro absoluto mandado pelo servidor | — | ver §6 | — |

Soma do dia:

| Cenário | Resgates por dia (min de abate) F10 · F30 · F50 · F80 | Tudo, com offline e %, sobre o abate |
| --- | --- | --- |
| L. Hoje no jogo (só as vivas) = **curva calibrada** | 75,6 · 77,1 · 78,6 · 80,9 | +167% · +210% · +163% · +133% |
| B. Hoje + tudo o que está desligado, com os números antigos | 215 · 217 · 219 · 222 | +283% · +345% · +273% · +227% |
| Cn. Depois deste commit: vivas de hoje + desligadas com os números novos | 97,7 · 99,3 · 100,8 · 103,0 | +187% · +232% · +182% · +149% |
| **C. Proposta inteira** (vivas também corrigidas) | **59,2 · 60,1 · 60,8 · 62,0** (máximo 62,3: dentro da meta de 65) | +83% · +100% · +79% · +65% |

## 4. O que mudou neste commit (módulos novos, todos DESLIGADOS)

Com a chave desligada, nada muda no jogo. Todos os testes de `test/sys` passam.

| Módulo | Antes | Depois |
| --- | --- | --- |
| `Sys.trial` (Provação) | ouro da 1ª vitória = 60 × k × goldUnit (k = 1..9; Nv 90 = 540 abates = 22,5 min) | **3 min de abate FIXO** = `reward.goldMin 3 × killsPerMin 24 × goldUnit` = 72 abates em toda provação. Pedras (4 × k), ração (20 × k) e o +1% ATK/Vida permanente não mudam: o prêmio de verdade é o atributo. `rewardOf` devolve também `goldMin`. |
| `Sys.crossroads` (Encruzilhada) | Trilha do Tesouro +8% de ouro, repetível (até +72% na era) | **+5% e `once:true`** (uma vez por era, como a Brasa Viva). Sobram 10 bênçãos repetíveis, então as 9 encruzilhadas sempre têm 2 opções. |
| `Sys.duo` (Dupla) | semanal "Os dois entram em 5 dias" goldK 150 | **goldK 120** (5 min). A diária (30) e as outras semanais (120, 120, 80) não mudam. |
| `Sys.guildFire` (Fogueira da Guilda) | baú do nível L = 40 × L × goldUnit (nível 10 = 400 = 16,7 min) | **12 × L × goldUnit** (nível 10 e extras = 120 = 5 min). O bônus +0,5%/nível (+4,5% no 10) não muda. |
| `Sys.camp` (Acampamento) | Tenda do Ouro 40 abates/h, teto = horas do offline (Nv 10 + 2 pets Lendários 5★ + VIP 14 h = 137 min por coleta; ~235 min/dia) | **3 abates/h** e **teto de 5 min de abate (120 × goldUnit) por coleta** (`capMin 5`, `killsPerMin 24`). As tendas de pedra seguem o teto em horas. O custo da melhoria **não** baixou (300 × 1,6^(n−1)): as tendas de pedra usam a mesma conta, e baixar daria poder mais barato. |
| `Sys.bossloss`, `Sys.thief`, `Sys.erasEnd`, desmontar da `Sys.bonfire` | — | Sem mudança: já estão abaixo de X ou não dão ouro (ver §3). |
| `Sys.mapchest` | 3 min por baú | Só medido (é de outra sessão). Já cabe em X. |

## 5. O que o SERVIDOR (fps-6f) precisa espelhar

- **Dupla** (`API_SERVIDOR §16.1`): a missão semanal `days5` passa de **goldK 150 para 120**. Nada mais muda na Dupla: `daily` 30, `boss200` 120, `stages40` 120, `arena20` 80, pedras iguais. O jogo é quem paga; o servidor só precisa mudar se guarda ou mostra o prêmio.
- **Fogueira da Guilda** (`API_SERVIDOR §16.2`): o baú `POST /v1/guild/fire/claim/:id`, que vai pelo correio, passa de `{goldk: 40×L, …}` para **`{goldk: 12×L, …}`**. Pedras (L) e ração (10×L) não mudam, nem chamas, níveis, extras e perks. Vale também para os extras `xN` (baú do 10 = goldk 120).

## 6. Fontes antigas acima de X ou da meta: APROVADO pelo dono em 14/11 (aplicado: ver §8)

| Fonte (viva) | Hoje | Proposta | Por quê |
| --- | --- | --- | --- |
| **Offline** (`js/meta.js` showOffline, Engenheiro) | 8 h = **187 min de abate** (×2 no VIP). Usa o ouro por abate **sem o `commonGoldMult` 0,32**, que entrou depois no abate e não foi levado ao offline. | Usar o `goldUnit` (com o 0,32): **8 h = 60 min de abate** (3 abates/min). | É a maior fonte do jogo: sozinha passa o abate do dia. A conta antiga dá 3,1× o que os números `offlineKillsPerMin 6 × offlineRate 0,5` querem dizer. |
| **Hora de Ouro** (`Sys.schedule`, golden_hour) | +100% no abate por 60 min (30 min jogados = +30 min) | **+30%** (+9 min) | Maior porcentagem do jogo, fora do X. |
| **Mina de Ouro** (`Sys.instances` gold.reward.goldPerKill) | 4 abates por abate × dificuldade (Difícil ×2,5 × 40 = 400 abates = 16,7 min por chave) | **goldPerKill 1** e teto de 120 abates por corrida | Um resgate de 16,7 min é 3× o X. |
| **Liga semanal da Arena** (`Sys.arena` leagues prize.goldk) | Bronze 200 · Prata 300 · Ouro 400 | **120 nas três** (a diferença de liga fica nos baús e no visual) | X. |
| **Torre** (`Sys.tower` reward) | 20 × (1 + 0,03 × andar); andar 135 = 101 abates | **goldPerFloor 0,015 e teto de 60 por andar** | A meta do dia no fim do jogo. |
| **Oferta paga** (`Sys.offer` goldk 2000) | 2 000 abates (83 min), pagos | Tirar o ouro da oferta ou baixar para 120 | Ouro pago compra melhoria. |
| **Correio** (`Sys.mail` att.gold) | ouro absoluto, o servidor escolhe | O servidor manda `goldk` (abates) com teto de 120, e o jogo converte pelo `goldUnit` | Um número absoluto não acompanha a fase. |

Desligadas antigas (aprovadas antes; ligar já com estes números):

| Fonte | Hoje | Proposta |
| --- | --- | --- |
| Baús de atividade (`Sys.activity`) | 40, 40, 60, 60, 120 (13,3 min/dia) | 24, 24, 24, 24, 48 (6 min/dia) |
| Conquistas (`Sys.achievements` TIER_REWARD) | 60, 200, 600, 1 500 | 24, 48, 96, 120 |
| Coleção (`Sys.codex` marcos) | 100, 300, 800, 1 500, 3 000 | 24, 48, 72, 96, 120 |
| Trilha do evento (`Sys.evtrail`) | 60, 120, 200, 400 | 48, 72, 96, 120 |
| Login, Guia, loja do evento | ≤ 80 | igual (já cabem) |

**Achado:** o `goldPct` do `Sys.fc` (títulos até +20%, prática Coleta, mentores Inês e Aurora, Encruzilhada, Fogueira da Guilda) **não entra no ouro do abate hoje**. O `Sys.fc.compute` devolve `goldMult`, mas nenhum arquivo multiplica; só o VIP e o `Sys.schedule` entram (`Sys.loot.rollKill`). Se o Engenheiro ligar isso, a soma dessas porcentagens precisa caber na meta: proposta de teto de +25% no total. O `Sys.clock` (retorno, desligado) dobra o abate por 40 min (+40 min): ligar só com o offline corrigido.

## 7. Simulação: o tempo para upar não cai abaixo da curva

O custo de cada melhoria é medido em abates da fase:
- tentativa de Forja = `Sys.forge.DATA.goldPerTryKills` = 30;
- nível de Montaria Épica = `Sys.mount` cost 20 × (1 + 0,05 (Nv−1)) × 2, no Nv = nível do jogador ÷ 2;
- nível da Arma Épica = `Sys.stats.upgradeCost` no nível do jogador, dividido pelo `goldUnit`.

Minutos de jogo para pagar = custo ÷ (24 × (1 + ouro extra do dia ÷ ouro de abate do dia)).

| Fase | Forja: A · L · B · Cn · C | Montaria: A · L · B · Cn · C | Arma: A · L · B · Cn · C | C ÷ L |
| --- | --- | --- | --- | --- |
| 10 | 1,3 · 0,5 · 0,3 · 0,4 · 0,7 | 2,0 · 0,7 · 0,5 · 0,7 · 1,1 | 0,5 · 0,2 · 0,1 · 0,2 · 0,3 | 1,5 |
| 30 | 1,3 · 0,4 · 0,3 · 0,4 · 0,6 | 3,2 · 1,0 · 0,7 · 1,0 · 1,6 | 0,7 · 0,2 · 0,2 · 0,2 · 0,4 | 1,5 |
| 50 | 1,3 · 0,5 · 0,3 · 0,4 · 0,7 | 4,5 · 1,7 · 1,2 · 1,6 · 2,5 | 0,9 · 0,3 · 0,2 · 0,3 · 0,5 | 1,5 |
| 70 | 1,3 · 0,5 · 0,4 · 0,5 · 0,8 | 5,7 · 2,4 · 1,7 · 2,3 · 3,4 | 1,1 · 0,5 · 0,3 · 0,4 · 0,7 | 1,4 |
| 90 | 1,3 · 0,6 · 0,4 · 0,6 · 0,8 | 6,5 · 3,1 · 2,2 · 2,9 · 4,2 | 1,1 · 0,5 · 0,4 · 0,5 · 0,7 | 1,4 |

(A só abate · L hoje = curva calibrada · B tudo ligado com os números antigos · Cn depois deste commit · C proposta inteira. A tabela das fases de 5 em 5 sai do `--md`.)

**Resultado:**
- **Proposta inteira (C): o tempo para upar fica 1,3× a 1,5× o de hoje em todas as fases 5-90.** Nunca fica mais rápido que a curva calibrada, e continua 1,6× a 2× mais rápido que só abater. Não fica tão difícil.
- **Ligar todo o desligado com os números antigos (B)** deixaria upar ~30% mais rápido que hoje.
- **Depois deste commit (Cn)**, com os módulos novos já corrigidos mas as fontes vivas sem mudança, ligar todos os módulos novos ainda deixa upar **~7% mais rápido** que hoje (0,93): Acampamento 7,7, Dupla 3,9, Derrota 1,0 e baús do mapa 0,9 min/dia somam.
  - **Recomendação:** corrigir o offline (§6) antes ou junto de ligar os módulos novos.
  - Só a correção do offline já tira ~127 min de abate por dia e põe tudo de volta abaixo da curva.

## 8. Aplicado em 14/11 (o dono aprovou a §6)

Medida: X = 5 min de abate = 120 × `goldUnit` por resgate. Teste: `node test/sys/economia-ouro.test.js` (e toda a `test/sys` passa).

| Fonte | Antes | Depois | Onde | Situação |
| --- | --- | --- | --- | --- |
| Hora de Ouro | +100% (×2) por 60 min | **+30%** | `js/sys/schedule.js` golden_hour | **vivo**: vale já |
| Mina de Ouro | goldPerKill 4, sem teto (Difícil: 400 abates) | **goldPerKill 1 e teto de 120 abates por corrida** (`capKills`, antes do % do VIP) | `js/sys/instances.js` | **vivo** |
| Torre | 20 × (1 + 0,03 × andar), sem teto | **20 × (1 + 0,015 × andar), teto 60 por andar** (`goldCapK`) | `js/sys/tower.js` | **vivo** |
| Liga semanal da Arena | Bronze 200 · Prata 300 · Ouro 400 | **120 nas três** | `js/sys/arena.js` | **vivo** |
| Oferta de 1ª compra | goldk 2.000 | **0** (a oferta não dá ouro) | `js/sys/offer.js` | desligada (só no modo dono) |
| Correio | goldk sem teto | **goldk com teto de 120 por carta** (`goldkCap`) | `js/sys/mail.js` | o servidor também precisa respeitar (abaixo) |
| Baús de atividade | 40, 40, 60, 60, 120 | **24, 24, 24, 24, 48** | `js/sys/activity.js` | desligada |
| Conquistas | 60, 200, 600, 1.500 | **24, 48, 96, 120** | `js/sys/achievements.js` | desligada |
| Coleção (Códex) | 100, 300, 800, 1.500, 3.000 | **24, 48, 72, 96, 120** | `js/sys/codex.js` | desligada |
| Trilha do evento | 60, 120, 200, 400 | **48, 72, 96, 120** | `js/sys/evtrail.js` | desligada |
| Ouro do VIP | +10% a +25% (o mesmo do XP) | **+5/5/6/6/8/8/9/9/10/10%**; XP igual | `js/sys/vip.js` `table.goldOnly` | **vivo** |
| Offline ×2 do VIP 5+ | também no ouro | **só XP, itens, pedras e ração**; `perks().offlineGoldMult` = 1 | `js/sys/vip.js` | falta o Engenheiro (abaixo) |
| **Offline 8 h** | 187 min de abate (ouro por abate sem o 0,32) | **60 min de abate** (3 abates/min × `goldUnit`) | `js/meta.js` e `js/p_intro.js` | **falta o Engenheiro** (abaixo) |

Falta, fora da Sistemas:
- **Engenheiro** (`js/meta.js` showOffline e `js/p_intro.js` offline()): trocar `perKill=Math.ceil(BAL.goldBase*Math.pow(BAL.goldGrowth,S.stage-1))` pelo `goldUnit` da fase (com o `commonGoldMult` 0,32) e o `om` pelo `Sys.vip.perks(S).offlineGoldMult` (= 1). 8 h = 1.440 × `goldUnit`.
- **Servidor**: correio com `goldk` (abates) e no máximo 120 por carta; nunca `gold` absoluto. A Fogueira da Guilda já cabe (12 × L, L ≤ 10).
