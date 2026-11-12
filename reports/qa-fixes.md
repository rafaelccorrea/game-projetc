# Correções QA rodada 1 (A1-A4 + bug do dbgSet) — especificação para o engenheiro
Autor: fps-30. Nada foi editado em index.html nem em js/ (fica com o engenheiro). Base: reports/qa.md, docs/CONTRATO_V2.md,
código de referência em js/_old_battle.txt (batalha V1 extraída por js/_x.js).

**Bloqueadoras: A1 e A2** (mudam a estrutura do estado da batalha e do layout; A3/A4 se apoiam nelas).
Atenção: no estado atual, o index.html chama startBattle()/loop/preloadAssets/resize sem carregar nenhum js (js/battle.js não
existe). Ao terminar a divisão, carregar na ordem: js/fallback.js, js/battle.js e depois o script inline (ou chamar o boot no fim do battle.js).
O `B` do topo do battle.js usa `eraOf(S.stage)`, então precisa de `S` já definido, ou mover `dispEra` para dentro de startBattle().

---

## A1 [CRÍTICO] Horda contra 1 herói
**Defeito:** `B.enemy` único (_old_battle.txt:13-29, step() :56-96). Cada onda tem 1 inimigo.
**Correção:**
- Estado: `B.en=[]` (vivos na tela), `B.toSpawn=[]` (fila da onda), `B.spawnT`, `B.phase:'run'|'fight'`.
- Tamanho da onda: ondas 1-4 `n=min(7, 3+floor(faseNaEra/3)+(wave>=3?1:0))`; onda 5 = 2 escoltas + chefe (entra por último).
- Surgimento: 1 inimigo a cada 0,55-0,95 s em `x=LW+30` (chefe com 1 s de atraso). "Chegando aos poucos".
- Fila: ordenar vivos por x; o da frente para em `contact(e)=HERO_X+HS*0.30+e.dw*0.42`; o i-ésimo para em
  `max(contact(e), slot[i-1]+max(26,(prev.dw+e.dw)*0.30))`. Inimigo anda até o slot (pode corrigir para trás devagar, porque o dw só
  existe depois do sprite carregar). Faixas de profundidade `lane=i%3` com y extra [-9,0,+7]; desenhar ordenado por (y, -x).
- Alvo: o vivo de menor x **dentro do alcance** (corpo a corpo: x ≤ contact+8; tiro: x ≤ HERO_X+230). Só atacam o herói os
  inimigos parados nos 2 primeiros slots.
- Sem dano em inimigo morto: `hitEnemy(e,...)`, se `e.dead`, troca para o vivo mais próximo no alcance ou descarta.
- Onda limpa (toSpawn vazio e nenhum vivo): onda 5 → fase++ (lógica de chefe/era/💎/passe atual); senão wave++. Cura 8% e save.
- Derrota: deadT=1,6 → wave=1, limpa B.en/toSpawn e reinicia a onda.
- **Balanceamento** (base atual: hp=22·1,22^(s-1), dano=3,5·1,17^(s-1), ouro=4·1,15^(s-1)):
  | | Comum (horda) | Chefe |
  |---|---|---|
  | HP | base×0,42 | base×6 (chefe de era ×2) |
  | Dano por golpe | base×0,5, a cada 1,3 s | base×1,8 (era ×1,4) |
  | Ouro por abate | base×0,32 | base×5 |
  | Drop | 3,5% por abate (era 14% por inimigo) | 100% (regra atual) |
  O HP total da onda fica em ~1,3-3x o inimigo único antigo, compensado pelo s2/s3 em área. O ouro por onda fica parecido, ~1-2x.
- Missão "Derrote 40 inimigos" passa para **150** (a horda multiplica os abates por ~4).

## A2 [CRÍTICO] Tela inteira de celular, sem scroll
**Defeito:** `#app{max-width:560px}`, `#cv{height:36dvh}`, `#view{overflow-y:auto}` (index.html:12,16,27).
**Correção:**
- `#app`: `position:fixed; inset:0; width:100dvw; height:100dvh`, com padding de safe-area no HUD (topo) e nas abas (base).
  Desktop (`@media (min-width:600px) and (min-height:500px)`): moldura de celular centralizada com
  `height:calc(100dvh - 40px); width:min(430px, (100dvh - 40px)*0.48)`, borda arredondada e sombra; fundo da página escuro.
- Canvas `position:absolute; inset:0` (sempre a tela toda). HUD e abas ficam **sobrepostos**.
- Mundo lógico com **largura fixa** `LW=330` e altura variável: `scale=cw/LW; LH=ch/scale`. A altura fixa de 260 deixaria o mundo
  com ~147 de largura em retrato. Trocar todos os `LH*0.72` por `B.gy`.
- Faixa de batalha: na aba Batalha `gy=LH*0.64`. Com painel aberto, o painel cobre a tela de 40% até as abas e
  `gy=(LH*0.40)*0.88`. Interpolar `B.gy` (lerp) na troca de aba. O cenário cobre só até a borda da faixa.
- Painéis sem `overflow`: altura fixa e **paginação** calculada pela altura real (`rows=floor(alturaDoCorpo/alturaDaLinha)`, pager "‹ 1/3 ›"):
  - Equip.: filtro Arma/Armadura + grade de 2 colunas com cards compactos (miniatura, nome, raridade, poder, Nv). O toque abre o modal
    com Equipar/Melhorar/Vender.
  - Invocar: 2 banners compactos + linha de chances + resultado numa grade 5×2.
  - Loja: sub-abas Moedas (grade 3×2) / Diamantes (2×2) / Pacotes (3 linhas + "Leilão em breve").
  - Skins: seletor de era "‹ Era ›" no lugar dos chips roláveis + 2 linhas de 5 miniaturas (arma e roupa); o toque equipa.
  - Missões: 6 linhas de ~46 px. Passe: cabeçalho + N níveis por página (paginado).
- Botões de habilidade **sobre a batalha**, no canto inferior direito acima das abas: s3 com 72 px e anel de energia,
  s2 com 60 px e varredura da recarga (`conic-gradient` via variável CSS atualizada por frame), botão AUTO (≥44 px). Ícones:
  `assets/icons/era{E}_s2/s3.png`, com E = era da skin de arma.

## A3 [ALTO] Herói correndo
**Defeito:** herói fixo em x=96, só respira; cenário com parallax senoidal lento (`B.cam*0.05`, _old_battle.txt:205,457).
**Correção:**
- `B.running = (nenhum vivo no alcance de engajamento)`. Engajamento: corpo a corpo = contact+6; tiro = HERO_X+210.
- Correndo: `B.cam += 150*dt`, inimigos se aproximam a `(150+e.spd)*dt`, ciclo de corrida do herói (bob `-|sin(t*14)|*5`,
  inclinação 0,08, squash) e poeira nos pés. Entre ondas: correr 1,2 s antes de surgir a próxima.
- Cenário rolando de verdade: tiling espelhado (imagem normal | cópia espelhada em cache | normal), com
  `offset = cam mod 2w`; sem costura visível.
- Parar só para atacar: o herói para quando entra em alcance e volta a correr quando a onda acaba.

## A4 [ALTO] Efeitos saindo da arma e no impacto (cor por raridade)
**Defeito:** só um arco fino e um clarão genérico (_old_battle.txt:329-343, 422).
**Correção:**
- Cor do FX: `FXC=['#ffffff','#4aa3ff','#b45cff','#ff4d6d','#ffb21e'][skinArma.r]`. Sprites brancos `assets/fx/{slash,hit,crit,muzzle,aura}.png`
  tingidos uma vez em cache (`source-atop`, alpha 0,65) e desenhados com `globalCompositeOperation='lighter'`.
- Calcular a ponta da arma no mundo (corpo a corpo: topo do recorte girado pelo ângulo do golpe; tiro: a ponta atual).
  Durante o golpe, soltar faíscas pela ponta.
- s1: corpo a corpo = arco grosso colorido na arma + slash.png no alvo + hit.png + faíscas; tiro = muzzle.png na ponta +
  projétil traçante (linha com brilho e cabeça branca) que causa o dano **ao chegar** + hit.png. Crítico usa crit.png e anel.
- s2 (recarga 6 s, automático ou toque, ~3x): 3 pulsos (0,12/0,24/0,36 s), cada um causando 1x em até 3 inimigos próximos.
  Corpo a corpo = 3 golpes rápidos com slash 1,6x; tiro = 3 rajadas com traçantes para os 3 alvos; onda de choque no chão.
- s3 (energia: +4 por acerto do s1, +2 do s2, +3 ao apanhar; toque ou AUTO): 10x em **todos** os inimigos na tela, aplicado entre
  0,55 e 1,1 s; câmera lenta (escala 0,3 por 0,5 s reais), tremor, clarão, vinheta e faixa com o nome da era (do contrato). Usa
  `assets/fx/era{E}_ult.png` se existir; temas procedurais: 0 pedras caindo + onda no chão · 1 raios do céu · 2 crescente de fogo
  gigante varrendo · 3 balas de canhão em arco + explosões · 4 relâmpago em cadeia · 5 mísseis do alto · 6 vórtice roxo + implosão.
  A energia zera após a ult.
- Números de dano: normal branco, crítico amarelo, s2 laranja maior, s3 dourado enorme. O FX não pode cobrir as barras de vida
  (desenhar as barras depois dos sprites de FX).
- Áudio: `window.GameAudio?.sfx('era{E}_s1|s2|s3')`, com o bipe atual como reserva; `ult_ready` quando a energia enche.

## Bug B1 [MÉDIO] dbgSet põe o inimigo em x=178
**Defeito:** `B.enemy.x=stopXOf(B.enemy)` roda antes de `e.dw` existir (index.html:231 + stopXOf).
**Correção:** com a horda, o dbgSet limpa `B.en/toSpawn`, chama `startWave()` e posiciona cada inimigo direto no seu slot (`placeNow()`).
Como os slots são recalculados a cada frame com o dw real, o inimigo se acomoda sozinho quando o sprite carrega. Com `__stay`: herói com
vida cheia, e o inimigo que chega a hp≤0 volta à vida máxima (sem matar), para o QA congelar os quadros.
Útil também: `dbgSkill(2|3)` no console para disparar s2/s3.
