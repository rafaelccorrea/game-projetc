# Curva de 9 eras: a parte da fps-30 (loot, baú, instâncias, passe, login, eventos, retorno, relógio)
Base: docs/CURVA_9_ERAS.md (grátis termina as eras nos dias 1/4/11/23/41/66/98/136/180; VIP 1/3/8/16/28/45/66/91/120). 2026-11-12.
**O que é CONTA e o que é TESTE:** todas as tabelas abaixo são **conta** (script sobre os números reais dos módulos, com as premissas da §0).
Testado com `node` (testes automáticos): só a lógica do relógio e do retorno (test/sys/clock.test.js, 6 casos) e que os módulos de sempre
continuam verdes. Nada disto foi medido no jogo: as eras 3-8 não têm medida real.

## 0. Premissas da conta (mudar estas muda tudo)
- "Jogar todo dia" = 40 min ativos a ~24 abates/min (ritmo medido na build real, x2) = **960 abates/dia** + 8 h de offline (6 abates/min = 2.880).
- 10 chefes de fase por era, espalhados pelos dias da era; 1 Senhor da Era por era. Instâncias: **8 vitórias/dia no grátis e 12 no VIP**, no Normal da era.
- VIP = opção B (+25% de XP e ouro), +1 entrada por área, baú 12/dia. Valores atuais dos módulos (v7.1 + eraScale v8 + 2 entradas por área).

## 1. Recursos POR DIA de cada fonte minha (grátis / VIP), eras 0-8 — CONTA
XP aqui = só a XP de ABATE (orbes do Sys.loot). XP de missão, instância, offline e bônus das 6 é do Sys.level (fps-e2): passo as CONTAGENS na §1b.
| Era | Dias (G/V) | XP abate/dia (G/V) | XP abate na era (G/V) | Baús/dia | Ração/dia | Pedra forja/dia | Essência/dia | 💎/dia | Itens/dia |
|---|---|---|---|---|---|---|---|---|---|
| 0 | 1 / 1 | 3.663 / 4.579 | 3.663 / 4.579 | 8 / 12 | 82,6 / 90 | 44 / 58 | 9,6 / 11,6 | 58 / 76 | 94 / 114 |
| 1 | 3 / 2 | 3.180 / 4.163 | 9.540 / 8.325 | 8 / 12 | 44,2 / 61,2 | 36 / 49 | 6,2 / 9,1 | 64 / 85 | 87 / 109 |
| 2 | 7 / 5 | 3.024 / 3.852 | 21.168 / 19.260 | 8 / 12 | 33,3 / 44 | 32 / 43 | 5,3 / 7,6 | 70 / 94 | 85 / 106 |
| 3 | 12 / 8 | 3.934 / 4.976 | 47.205 / 39.806 | 8 / 12 | 29,9 / 39,7 | 31 / 41 | 5,0 / 7,2 | 76 / 103 | 84 / 105 |
| 4 | 18 / 12 | 3.909 / 4.929 | 70.362 / 59.153 | 8 / 12 | 28,3 / 37,3 | 30 / 41 | 4,9 / 7,0 | 82 / 112 | 84 / 104 |
| 5 | 25 / 17 | 4.854 / 6.100 | 121.360 / 103.700 | 8 / 12 | 27,4 / 35,9 | 30 / 40 | 4,8 / 6,9 | 90 / 124 | 84 / 104 |
| 6 | 32 / 21 | 4.846 / 6.088 | 155.077 / 127.846 | 8 / 12 | 26,9 / 35,2 | 30 / 40 | 4,7 / 6,8 | 96 / 133 | 84 / 104 |
| 7 | 38 / 25 | 4.842 / 6.080 | 183.995 / 151.994 | 8 / 12 | 26,6 / 34,8 | 30 / 40 | 4,7 / 6,8 | 102 / 142 | 84 / 104 |
| 8 | 44 / 29 | 5.799 / 7.274 | 255.152 / 210.940 | 8 / 12 | 26,4 / 34,5 | 30 / 40 | 4,7 / 6,7 | 108 / 151 | 84 / 104 |
Fontes somadas: abate comum + chefes + Senhor da Era (dividido pelos dias da era) + baú (teto 8/12) + instâncias (2/3 por área) + login (média semanal).
Ouro: em "× ouro de um abate da fase" (o `goldUnit`) ele acompanha a fase; não pus número absoluto porque o ouro-base é do balanceamento.

### 1b. Contagens por dia para a fps-e2 fechar a XP do Sys.level
- Missões: 6 diárias + bônus (1/dia) e 5 semanais; XP do JOGADOR por missão = `Sys.level.onMission`/`onDailyBonus` (dela).
- Instâncias: 8 vitórias/dia (VIP 12), cada uma chama `Sys.level.onInstance(S, host, mult)` com mult = 1 / 1,6 / 2,5 (Fácil/Normal/Difícil).
- Offline: até 8 h (`Sys.level.onOffline`, dela). Passe: XP do PASSE, não do jogador.

## 2. Drop por era até a raridade-teto — CONTA com os portões atuais
Portão = nível do jogador (Raro 10, Épico 25, Mítico 70 + era 4, Lendário 85 + era 5). Chance de raridade de um item que caiu (o item cai em 3,5% dos abates comuns):
| Era | Teto ao ENTRAR (nível) | Teto ao SAIR (nível) | Drop comum ao sair (B / R / É / M / L) |
|---|---|---|---|
| 0 | Básico (1) | Raro (12) | 70 / 30 / 0 / 0 / 0 % |
| 1 | Raro (12) | Épico (25) | 68,8 / 22,7 / 8,5 / 0 / 0 |
| 2 | Épico (25) | Épico (40) | 67,6 / 23,4 / 9,1 / 0 / 0 |
| 3 | Épico (40) | Épico (55) | 66,4 / 24,0 / 9,6 / 0 / 0 |
| 4 | Épico (55) | Mítico (70) | 65,3 / 24,6 / 7,4 / 2,6 / 0 |
| 5 | Mítico (70) | Lendário (85) | 64,3 / 25,2 / 7,7 / 2,2 / 0,6 |
| 6 | Lendário (85) | Lendário (100) | 63,2 / 25,8 / 8,0 / 2,3 / 0,6 |
| 7 | Lendário (100) | **Divino (105)** | (hoje Lendário; ver abaixo) |
| 8 | Lendário/Divino (110) | Divino (120) | (hoje Lendário; ver abaixo) |
- **Divino (eras 7-8) — PROPOSTA, não codado:** r5 na tabela de drop com peso 0,05 (1/8 do Lendário), portão nível 105 + era 7; arma Divina segue a regra da arma
  (sem Mítica no lançamento, Divina existe). Só codo depois que a fps-e2 tiver o r5 no stats.js e com chave das eras 7-8 (desligadas até a arte).
- As eras 3 e 4 ficam ~30 dias com teto Épico: é o "meio" longo da curva. Se o PO quiser um degrau no meio, o Mítico pode vir no nível 60 (hoje 70).

## 3. Passe e temporadas em 6 meses — PROPOSTA (conta)
- Temporadas de **30 dias** seguidas: o grátis atravessa **6 temporadas** até o fim (180 dias) e o VIP **4** (120 dias). Com as diárias a 90/dia, o grátis
  fecha o nível 30 no dia 27 de cada temporada (29 perdendo 1 dia por semana), então dá para completar todas jogando todo dia.
- Não recomendo temporadas mais longas: a recompensa por dia cairia e o passe perderia ritmo. Mais curtas (2 semanas) apertariam demais quem falta.
- O Item da Temporada fica na era em que foi ganho (decisão do PO): em 6 temporadas o jogador ganha 6 colete/arma Lendários de eras crescentes; o da
  temporada anterior perde força ao trocar de era, o que dá motivo para a próxima.

## 4. Ração dos pets no calendário novo — CONTA
Meta do PO: **1.238 de ração até o fim da era 4** (pet principal Nv 60 + 2º pet Nv 30, custo 1,05).
| | Fim da era 4 | Ração acumulada | Atinge 1.238 no dia |
|---|---|---|---|
| Grátis | dia 41 | ~1.317 | **dia 39** (2 dias antes) |
| VIP | dia 28 | ~1.198 | **dia 30** (2 dias depois) |
Com as fontes atuais (instância Chefe de Era 2 por dia, offline 5/8 h, chefes, baú 10%, login), **a meta fecha para o grátis**. O VIP chega 2 dias depois do fim
da era 4 dele porque a ração não tem bônus VIP. Se o PO quiser o VIP no prazo, a alavanca mínima é a ração da instância Chefe de Era para o VIP (+1 entrada já dá
parte disso), ou +25% de ração no VIP. Recomendo aceitar: são 2 dias.
(Os números dependem do offline de 5 por 8 h da fps-e2 e do login, se ele for ligado; sem login, −1,4/dia.)

## 5. Recuperação e relógio — IMPLEMENTADO atrás de chave (js/sys/clock.js, `Sys.clock.DATA.on = false`), TESTADO (6 casos)
**Bônus de retorno ("XP descansada"):** a cada dia perdido (até 3), o jogador guarda meio dia de abates (480). Enquanto houver saldo, cada abate da campanha dá
**XP e ouro em dobro** (`res.rested = true` para a tela mostrar). Quem falta 1-3 dias recupera ~metade do que perdeu jogando normalmente; quem abandona não
recupera mais que 3 dias. Não precisa de nada novo da fps-e2 (o dobro é nos orbes, que são meus).
**Relógio (sem servidor):**
- Relógio VOLTADO: o jogo fica no maior instante já visto (tolerância de 10 min): diárias, instâncias, login, passe e offline NÃO reabrem.
- Relógio ADIANTADO COM O APP ABERTO: detectado (o Date corre mais que o tempo real da sessão) e ignorado; o dia segue o tempo real.
- **Limite honesto:** adiantar com o app FECHADO é indistinguível de ficar dias fora; o máximo que se ganha é o que o próprio dia daria (diárias, 8 h de offline,
  3 dias de retorno). Só um servidor resolve isso.
**Para ligar (engenheiro):** `Sys.host.now = () => Sys.clock.now(S, {rawNow: () => Date.now()})` (todos os módulos já usam `host.now`, então a trava vale para todos),
`Sys.clock.checkIn(S, host)` na carga e na volta do app, e o offline do meta.js por `Sys.clock.offlineSeconds(S, host, S.lastSeen)`.

## 6. Diamantes grátis: corte para a meta do PO (8-10 mil em 180 dias) — APROVADO pelo PO e APLICADO para a v0.12.0 (detalhes em reports/sys-loot.md)
**Correção:** a tabela da §1 contava só abates, baú, instâncias e login. Somando TUDO (missões do passe ~52/dia, passe grátis, fase vencida 10 💎 e era nova 30 💎
do battle.js, Senhor da Era, guia), o grátis hoje recebe **~29 mil 💎 em 180 dias** (~150/dia), não 16 mil.
| Fonte de 💎 | Hoje | Proposta |
|---|---|---|
| Inimigo comum (Sys.loot) | 1,5% de 1 | **0,5%** de 1 |
| Baú (Sys.chest) | 25% de 2-5 | **15%** de 2-5 |
| Caverna de Cristal (Sys.instances) | (6 + 2·era) × dificuldade, 2/dia | **3 fixos** × dificuldade (sem o "+2 por era") |
| Chefe de Era instância | 5 × dificuldade por vitória | **0** (fica com itens, Essência, ração) |
| Missões diárias (Sys.pass) | 24 + bônus 15 = 39/dia | **12 + bônus 5 = 17/dia** (2 por missão) |
| Missões semanais | 90/semana | **36/semana** |
| Login (Sys.login) | 45/semana | **30/semana** (10 · 0 · 0 · 0 · 10 · 0 · 10) |
| Guia (Sys.guide) | ~255 uma vez | **~150** |
| Passe grátis, Senhor da Era, fase vencida (battle.js) | iguais | iguais (a fase vencida é do engenheiro; 10 → 5 tiraria mais ~450) |
**Resultado: ~9.980 💎 em 180 dias** (~180/dia no 1º dia, ~55/dia na era 4, ~51/dia na era 8).

**Diamantes grátis acumulados por mês × o que compram** (preços de hoje: skin 30/60/120/250/500 por raridade; nível de item por 💎 = ⌈2·1,04^(N−1)·(1 + 0,6·r)⌉):
| Fim do mês | 💎 acumulados | Exemplos do que compram |
|---|---|---|
| 1 | ~2.180 | 4 skins Lendárias, ou 1 item Lendário do Nv 1 ao 50 (1.014) + 1 Épico do 1 ao 50 (665) |
| 2 | ~3.800 | 7 skins Lendárias, ou 1 Raro do 1 ao 100 (3.851) |
| 3 | ~5.370 | 10 skins Lendárias, ou 1 Épico do 1 ao 100 (5.284) |
| 4 | ~6.920 | 13 skins Lendárias, ou 1 Mítico do 1 ao 100 (6.708) |
| 5 | ~8.460 | 16 skins Lendárias, ou 1 Lendário do 1 ao 100 (8.134) |
| 6 | ~9.980 | 19 skins Lendárias, ou 1 Lendário do 1 ao 100 + 3 skins Lendárias |
Leitura: o grátis consegue juntar ~3 skins Lendárias por mês ou acelerar 1 item; quem paga continua com a vantagem do VIP e do passe premium.
**Regra dura conferida:** nos meus módulos o 💎 NUNCA compra VIP nem Passe Premium: o premium só é ativado por `Sys.pass.setPremium` depois da compra com
dinheiro real (o jogo chama); a loja de eventos usa pontos; correio, login e guia só entregam. Os pontos de VIP vêm de compras (`Sys.vip.addPoints`, fps-e2).

## 7. Qualidade, fusão e era futura no trecho de teto Épico (eras 2-4) — CONTA
- **Trecho:** o teto Épico vai do nível 25 (início da era 2, ~dia 4) ao nível 70 (fim da era 4, dia 41): **~37 dias** no grátis (~23 no VIP).
- **Qualidade e fusão 3→1 ficam relevantes por volta do dia 5:** com ~85 itens/dia e ~9% Épicos, caem ~7-8 Épicos por dia; espalhados por 7 espaços e 2 eras
  (a liberada e a anterior), dá ~1 Épico igual por espaço a cada ~1-2 dias, ou seja, um trio para fundir a cada ~4 dias por espaço. A busca por qualidade enche o trecho.
- **Era futura (0,5% / 0,05%) em 30 dias:** ~67 itens/dia passam pelo sorteio de era (horda, chefe, baú, invocação; instância, passe e pacotes têm era fixa):
  **~10 itens de 1 era à frente em 30 dias** (~1 a cada 3 dias), **~1 de 2 eras à frente** e ~0,1 de 3. É perceptível, mas pela raridade-teto do jogador
  (a maioria Básico/Raro no teto Épico) e rendendo como 1 era à frente no nível 1 (adormecido da fps-e2).

## 8. Outros alertas para o PO
1. (o alerta de diamantes virou a §6)
2. **Itens: ~85 por dia** contra uma mochila de 60: o desmonte automático vira a regra; a tela precisa deixar isso claro (ou um "desmontar Básicos" automático).
3. **XP de abate quase plana por dia (3-6 mil):** quem segura a duração das eras é a curva de XP por nível da fps-e2 (Sys.level), com teto diário de XP ativa.
