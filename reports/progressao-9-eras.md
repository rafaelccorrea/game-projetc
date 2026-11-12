# Progressão das 9 eras — REVISÃO 2: 100 fases × 4 dificuldades — APROVADA pelo PO como base (nada liga antes do mapa novo aprovado pelo dono e da medida dos primeiros dias)
Mudança do dono (via PO, 2026-11-12): cada era tem **100 fases** e **4 dificuldades** (Fácil, Médio, Difícil, Hell): as mesmas fases, mais fortes e
com recompensa melhor. Liberar a próxima era pede dificuldades crescentes. A meta de tempo não muda. Números: `docs/balance-v9.json`, bloco `rev2`
(3.600 linhas `{era, diff, stage, fcRec, lvlLock, required, boss}`). **É CONTA**: o calendário (XP/dia) é o mesmo da Revisão 1, só a forma da era mudou.

## R2.1 O que cada era exige e quanto se joga por dia
| Era | Para liberar a próxima | Fases a vencer | Fases/dia (grátis / VIP 10) | Tempo por fase (40 min/dia, grátis) | Termina no dia (grátis / VIP 10) |
|---|---|---|---|---|---|
| 0 | Fácil | 100 | 100 / 100 | ~24 s | 1 / 1 |
| 1 | Fácil | 100 | 50 / 50 | ~48 s | 3 / 3 |
| 2 | Fácil + Médio | 200 | 29 / 40 | ~1,4 min | 10 / 8 |
| 3 | Fácil + Médio | 200 | 17 / 25 | ~2,4 min | 22 / 16 |
| 4 | + Difícil | 300 | 17 / 25 | ~2,4 min | 40 / 28 |
| 5 | + Difícil | 300 | 12 / 18 | ~3,3 min | 65 / 45 |
| 6 | + Hell | 400 | 12,5 / 19 | ~3,2 min | 97 / 66 |
| 7 | + Hell | 400 | 10,5 / 15 | ~3,8 min | 135 / 92 |
| 8 | Fácil + Médio + Difícil (vencer o Celestial) | 300 | 7 / 10 | ~5,9 min | **179 / 121** |
- **Hell do Celestial (e o Hell opcional das eras 0-5 e 8) = fim de jogo.** Leitura minha do pedido ("o HELL das últimas eras e o Hell do Celestial
  ficam como fim de jogo"): a era 8 fecha no Difícil. Se o dono quiser o Hell da era 7 também opcional, a era 7 cai para 300 fases (~1 semana a menos).
- **Atenção na era 0:** 100 fases no 1º dia dão ~24 s por fase; a "era 0 em 15-18 min" deixa de existir (ela vira o 1º dia). Proposta: nas eras 0-1 a fase é
  1 onda curta (~15-25 s); da era 2 em diante, fase normal + farm.
- O tempo continua vindo do **nível** (XP/dia com teto) e da **FC**: quem joga o dobro adianta ~15%, como na Revisão 1.

## R2.2 FC por fase em cada dificuldade (degrau FIXO ×3 por dificuldade)
FC(dificuldade k, fase n) = FC de entrada da era × 3^k × g^(n−1), com g escolhido para a última dificuldade EXIGIDA, fase 100, dar o Senhor da Era
da Revisão 1 (o mesmo da entrada da era seguinte). Fase 50 = chefe; fase 100 = Senhor daquela dificuldade.
| Era | Fácil fase 1 → 100 | Médio 1 → 100 | Difícil 1 → 100 | Hell 1 → 100 | Hell opcional cabe na |
|---|---|---|---|---|---|
| 0 | 311 → 1.723 | 933 → 5.169 | 2.799 → 15,5 mil | 8.397 → 46,5 mil | era 2 |
| 1 | 1.858 → 27,2 mil | 5.574 → 81,5 mil | 16,7 mil → 245 mil | 50,2 mil → 734 mil | era 2 |
| 2 | 28,4 mil → 394 mil | 85,3 mil → **1,2 mi** | 256 mil → 3,5 mi | 768 mil → 10,6 mi | era 3 |
| 3 | 1,2 mi → 9,1 mi | 3,7 mi → **27,3 mi** | 11 mi → 82 mi | 33 mi → 246 mi | era 4 |
| 4 | 28,1 mi → 58,2 mi | 84,4 mi → 175 mi | 253 mi → **524 mi** | 760 mi → 1,6 bi | era 5 |
| 5 | 538 mi → 2,0 bi | 1,6 bi → 5,9 bi | 4,8 bi → **17,7 bi** | 14,5 bi → 53 bi | era 6 |
| 6 | 18,2 bi → 37,1 bi | 54,5 bi → 111 bi | 164 bi → 334 bi | 491 bi → **1,0 tri** | (exigido) |
| 7 | 1,0 tri → 1,4 tri | 3,1 tri → 4,3 tri | 9,2 tri → 13 tri | 27,7 tri → **38,9 tri** | (exigido) |
| 8 | 39,8 tri → 79,9 tri | 119 tri → 240 tri | 358 tri → **719 tri** | 1.073 tri → 2.157 tri | fim de jogo |
(em **negrito**: a fase 100 da última dificuldade exigida = o Senhor que libera a era seguinte)

## R2.3 Trava de nível
- Nas dificuldades EXIGIDAS, o nível-trava sobe do nível de entrada ao de saída da era ao longo das fases, na ordem Fácil 1-100 → Médio 1-100 → ...
  (ex.: era 4, 300 fases: Fácil 1 = Nv 55, Médio 1 = Nv 60, Difícil 1 = Nv 65, Difícil 100 = Nv 70).
- Dificuldade OPCIONAL: trava = o nível de saída da era; quem segura é a FC (o Hell da era 0 só fica jogável com a FC da era 2).
- Os portões de nível das eras (1, 12, 25, 40, 55, 70, 85, 100, 110) e de raridade não mudam.

## R2.4 Paredes
- **Eras 0-3:** a fase 1 do Médio fica ABAIXO da fase 100 do Fácil (sobreposição): sem parede na troca. Parede = a fase 100 de cada dificuldade exigida.
- **Eras 4-8:** a troca de dificuldade salta ×1,5 (eras 4, 6, 8) a ×2,1 (era 7): parede na fase 1 de cada dificuldade nova + na fase 100 final.
- Mais as paredes de raridade (Mítico Nv 70, Lendário 85, Divino 105). **Total: ~26 paredes** em 180 dias (1, 1, 2, 2, 3, 3, 4, 4, 3 por era + 3).

## R2.5 Recompensas por dificuldade (proposta; quem calibra o drop é a fps-30)
| | Fácil | Médio | Difícil | Hell |
|---|---|---|---|---|
| Ouro, materiais (forja, ração, Essência) | ×1 | ×1,6 | ×2,5 | ×4 |
| Chance de item na raridade-teto da era | base | ×1,3 | ×1,7 | ×2,2 |
| Qualidade do item | sorteio normal | normal | melhor de 2 | melhor de 3 |
| 1ª vitória de cada fase | 💎 pequeno | 💎 ×1,5 | 💎 ×2 | 💎 ×3 + fragmento de pet |
- Tudo DENTRO dos portões de raridade e era (o Hell nunca dá raridade acima do portão). Sem sorteio pago: a "melhor de 2/3" é do drop grátis.
- XP: o multiplicador NÃO vale para a XP (o teto diário de XP de abate seguraria de qualquer jeito); assim o calendário não muda.

## R2.6 DEF dos inimigos (pedido do PO)
- A redução que o herói sofre é `DEF ÷ (DEF + 2 × ATK do herói)` (a mesma fórmula do jogo). Proposta: na FC recomendada, o comum tira **10%**, o chefe
  (fase 50) **20%** e o Senhor (fase 100) **25%**. Como o ATK de quem está na FC recomendada é ~5,5% dela:
  **DEF do comum = 1,2% da fcRec da fase · chefe = 2,75% · Senhor = 3,7%.** A vida dos inimigos cai na mesma proporção (×0,9 / ×0,8 / ×0,75) para o tempo
  de luta não mudar. Quem passa da FC recomendada sente a DEF cair (ATK maior), e quem está abaixo sente mais.
- Fica dentro da regra de coerência: o dano continua saindo dos atributos (a DEF do alvo já estava na fórmula); o teto por golpe não muda.

---

# Revisão 1 — 10 fases por era (SUBSTITUÍDA pela Revisão 2 na forma da era; calendário, níveis e FC de entrada/Senhor continuam)
Montada pela fps-e2 com a fps-30 e a fps-c9, 2026-11-12. Detalhes: reports/curva-9-eras-e2.md (nível, XP, FC, VIP, Kael),
reports/curva-9-eras-30.md (fontes por dia, drop, retorno, relógio), docs/CURVA_9_ERAS.md (calendário-base).
**É CONTA, não medida:** só as eras 0-2 já foram jogadas de verdade (calibração v8). Jogando todo dia = 40 min + offline.

| Era | Nome | Dias na era (grátis / VIP 10) | Termina no dia (grátis / VIP 10) | Nível para entrar | Nível ao sair | FC de entrada | FC do chefe (fase 5) | FC do Senhor da Era | Raridade-teto |
|---|---|---|---|---|---|---|---|---|---|
| 0 | Pré-História | 1 / 1 | 1 / 1 | 1 | 12 | 370 | 730 | 1.720 | Raro |
| 1 | Antiguidade | 2 / 2 | 3 / 3 | 12 | 25 | 2.430 | 7.110 | 27.200 | Raro |
| 2 | Medieval | 7 / 5 | 10 / 8 | 25 | 40 | 41 mil | 183 mil | 1,2 mi | Épico |
| 3 | Pólvora | 12 / 8 | 22 / 16 | 40 | 55 | 1,7 mi | 5,8 mi | 27 mi | Épico |
| 4 | Industrial | 18 / 12 | 40 / 28 | 55 | 70 | 38 mi | 121 mi | 523 mi | Épico |
| 5 | Moderna | 25 / 17 | 65 / 45 | 70 | 85 | 763 mi | 3,1 bi | 17,7 bi | Mítico |
| 6 | Futurista | 32 / 21 | 97 / 66 | 85 | 100 | 27 bi | 135 bi | 1,0 tri | Lendário |
| 7 | Submundo | 38 / 26 | 135 / 92 | 100 | 110 | 1,5 tri | 6,3 tri | 39 tri | Lendário → Divino (Nv 105) |
| 8 | Celestial | 44 / 29 | **179 / 121** | 110 | 120 | 53 tri | 169 tri | 719 tri | Divino |

- **Fases:** 10 por era. Cada fase tem um nível-trava (entrada + 1/10 da faixa de níveis por fase) e uma FC recomendada que cresce ×1,15 a ×1,55
  por fase (o botão "Desafiar" brilha com 90% dela).
- **Paredes:** 2 por era a partir da era 2: **fase 5** (precisa dos itens da era nova: garimpar e transformar) e **fase 10 / Senhor** (nível-trava
  + raridade-teto em todos os espaços + forja da era). Mais 1 quando chega raridade nova (Mítico no Nv 70, Lendário no 85, Divino no 105). Total: **~19**.
  Nas eras 3-4 (Épico por ~30 dias) a busca é qualidade/fusão de itens e item "adormecido" de outra era (precisam ser ligados com a curva).
- **Quem paga e quem joga mais:** VIP 10 = 1,50x por dia (121 dias); VIP 5 = 1,30x (140); VIP 1 = 1,13x (160). Jogar o dobro adianta 15%.
- **Kael cresce:** adolescente no Nv 22 + FC 15 mil (dia 2), adulto no Nv 35 + FC 400 mil (dia 8 grátis / 6 VIP 10), guerreiro lendário no
  Nv 70 + FC 600 mi (dia 40 grátis / 28 VIP 10). O pet abre no Nv 20 (dia 2), separado do adolescente.
- **Riscos:** eras 3-8 só em conta; eras 7-8 sem arte; sem servidor, relógio adiantado com o app fechado conta como dias fora (máx. 3 dias de retorno).
