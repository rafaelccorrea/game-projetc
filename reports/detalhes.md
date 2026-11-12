# Detalhes / acabamento — fps-e2
Revisão do js/battle.js (horda, versão de 2026-11-12 ~01:50) contra reports/qa-fixes.md. Nada foi editado: index.html e js/ são do engenheiro.
Linhas citadas são da versão revisada e podem ter mudado; procure pelo trecho de código.

## Achados
D1 [ALTO] **Herói dá "trancos" de corrida entre um abate e outro (corpo a corpo).**
`step()`: `B.running=!eng&&!B.act`. Quando o da frente morre, o próximo está parado no slot dele (contact + 26..40 px), fora de
`inEngage` (contact+6). Por ~0,2 s o herói volta a correr: `B.cam+=150*dt`, poeira, pernas, e os inimigos andam a 150+spd. O resultado é
um pisca-corre-para a cada abate. Correção (histerese):
```js
if(eng) B.holdT=0.6; else if(B.holdT>0) B.holdT-=dt;
B.running=!eng&&!B.act&&B.holdT<=0&&!B.en.some(e=>e.x<=LW-10);   // não corre com horda visível na tela
```
(adicionar `holdT:0` no `B`). Assim o herói só corre quando a onda acabou ou ainda não chegou.

D2 [MÉDIO] **Cadáveres, números e anéis não acompanham o cenário quando o herói volta a correr.**
Só `B.cam` anda. Com o herói correndo, `B.corpses`, `B.fx` (números), `B.rings` e `B.wfx` ficam parados na tela e "andam junto" com o
herói. Correção no `step`: `if(B.running){ const dx=150*dt; for(const c of B.corpses) c.x-=dx; for(const r of B.rings) r.x-=dx; for(const f of B.fx) f.x-=dx; }`
(a poeira já tem vx −60 e não precisa). Conferir no desenho do cadáver se ele usa `c.x`.

D3 [MÉDIO] **Missão de abates não foi ajustada para a horda.** index.html: `{k:'kill', need:40, txt:'Derrote 40 inimigos'...}`.
qa-fixes A1 pede 150 (a horda multiplica os abates por ~4).

D4 [BAIXO] **`render()` invertido.** `waveClear()` e o reinício após a derrota chamam `if(view!=='battle') render()`; a versão V1 usava
`if(view==='battle')`. Se o HUD de fase/onda não for atualizado por quadro, ele fica desatualizado na aba Batalha. Confirmar a intenção.

D5 [BAIXO] **Tocar em s2/s3 no meio de um s1 perde o golpe do s1.** `useSkill` aceita com `B.act.type==='s1'` e `startAct` substitui
`B.act`; o hit pendente do s1 (t=0,19 s) nunca acontece (perde dano e +4 de energia). Correção: antes de `startAct` em `useSkill`,
`if(B.act) for(const hh of B.act.hits) if(!hh.done){ hh.done=true; skillHit(B.act,hh); }`.

D6 [BAIXO] **Quem ataca o herói pode piscar.** `layoutHorde` ordena só por `x`; dois inimigos com x quase igual trocam `idx` a cada
quadro, e o "só os 2 da frente atacam" alterna entre eles (o atkT de um corre, o do outro para). Desempate estável:
`L.sort((a,b)=>a.x-b.x||a.id-b.id)` com `id:B.spawnN` no `mkEnemy`.

D7 [BAIXO] `BAL.energyPerHurt` = 5; qa-fixes A4 diz +3 ao apanhar. Escolher um e deixar no docs/balance.json.

D8 [BAIXO] s1 corpo a corpo sem `assets/fx/slash.png`: `skillHit` só cria o arco `if(sl)`, então o golpe fica sem efeito no impacto
(só faíscas). Usar o `fnArc` sem sprite (ele já tem o desenho de reserva com `crescent`): tirar o `if(sl)`.

## Conferido e OK
- `B.spawnN`, `en`, `toSpawn` e as chaves `common*` do BAL existem (sem NaN em lane/HP).
- Alcance de tiro `HX+230=314` < `LW=330`: o herói não atira em inimigo fora da tela.
- Onda 5: o chefe entra por último, com +1 s de atraso; a cura de 8% e o save acontecem ao limpar a onda.
- Derrota limpa `toSpawn`; o `startBattle` recria a onda 1.
