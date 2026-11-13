# Matriz: coluna de SISTEMA (Sistemas, 14/11/2026)

Esta é a parte de sistema da matriz da Arte (`docs/ARTE_MATRIZ.md`, regra em `docs/ARTE_PRONTO.md`). Para cada item existente: dados do módulo, textos, nomes de golpe, fontes de drop, chaves e preços, com o que falta e o arquivo:linha.

**Legenda:** ✓ pronto · ✗ falta · ⏸ pronto, mas desligado de propósito (espera voto ou medida).

Ordem: os 3 pets que estão fechando agora. Depois, item por item, na ordem que o PO liberar.

---

## Pets: Lobo sombrio · Falcão de guerra · Pantera espectral

| Linha | Lobo sombrio (`shadowwolf`) | Falcão de guerra (`falcon`) | Pantera espectral (`panther`) |
|---|---|---|---|
| Dados no módulo (raridade, tipo, golpe, fragmentos para nascer) | ✓ Raro, ataque, `dash`, 60 · `js/sys/pet.js:31` | ✓ Raro, ataque, `ranged`, 60 · `js/sys/pet.js:33` | ✓ Épico, ataque, `blink` com crítico, 100 · `js/sys/pet.js:35` |
| Ligado no módulo | ✓ `newReady.shadowwolf` · `js/sys/pet.js:62` | ✓ `newReady.falcon` · `js/sys/pet.js:62` | ✓ `newReady.panther` · `js/sys/pet.js:62` |
| Batalha (posição, altura, voo, cor, aura por estágio) | ✓ `js/sys/pet.js:408` | ✓ voa 0,15 · `js/sys/pet.js:409` | ✓ `js/sys/pet.js:410` |
| Aura: nada / leve / forte (regra do dono) | ✓ —/aura4/aura7 (f636e23) | ✓ —/aura4/aura7 | ✓ —/aura4/aura7 |
| Nomes dos 3 golpes (básico, crítico, mediano) | ✓ Mordida, Investida sombria, Garra dupla · `js/p_pets.js:51` | ✓ Bicada, Mergulho, Rajada de penas · `js/p_pets.js:52` | ✓ Patada, Bote pelas costas, Sombra veloz · `js/p_pets.js:53` |
| "Como conseguir" (pela fonte real) | ✓ Instância Arsenal ou baús da atividade | ✓ Torre, andar 30, ou missões diárias | ✓ Arena: fim de temporada no Ouro ou acima |
| Fonte de drop programada | ✓ `inst:win` ovo inteiro, 1 por dificuldade · `js/sys/newdrops.js:41`; `activity:full` 2 fragmentos por dia · `:44` | ✓ `tower:floor` andar 30 inteiro · `js/sys/newdrops.js:15`; `missions:daily` 1 por dia · `:45` | ✓ `arena:season` Ouro 15, Platina+ 30 · `js/sys/newdrops.js:20` |
| Fonte chamada pelo jogo | ✓ `js/sys/instances.js:193`, `js/sys/activity.js:54` | ✓ `js/sys/tower.js:180`, `js/sys/pass.js:138` | ✓ `js/sys/arena.js:110` |
| **Entregas ligadas** | ✗ **`Sys.newDrops.DATA.on=false` (`js/sys/newdrops.js:12`): nenhuma fonte entrega. Fora do Modo dono, ninguém consegue os 3 pets.** Liga com voto do dono (vale para todos os itens novos do newdrops) | ✗ idem | ✗ idem |
| Tela de Pets (texto, ordem, folhas) | ✓ Engenheiro f36b825 (`js/p_pets.js:51,58,291`) | ✓ idem | ✓ idem |
| Códex | ✓ id `lobo`, no fim (aeb043a, `js/sys/codex.js:26,30`); tela K_PETS com o Engenheiro | ✓ `falcao` | ✓ `pantera` |
| Arena (bots usam o pet) | ✓ `js/sys/arena.js:149` | ✓ | ✓ |
| Efeito do golpe próprio na batalha | ✗ `fx.hit:'dash'` vem no `battleInfo`, mas ninguém desenha (`js/petfx.js` e `js/battle.js` não leem `fx.hit`); o golpe toca como o genérico | ✗ `'feather'` idem | ✗ `'blink'` (some e reaparece atrás) idem |
| Mecânica do golpe (`skill.id`) | ✗ `dash`: o dano é igual ao golpe comum de propósito (`hits:[1]`); só falta o visual acima | ✗ `ranged` idem | ✗ `blink`: o crítico já é o do pet; falta o visual |
| Folhas de golpe extras (atk2, atk3) | ⏸ só `atk1` nos 3 estágios (`js/p_pets.js:291`): os 3 golpes tocam o atk1, como no Cérbero, Pégaso e Raposa | ⏸ idem | ⏸ idem |
| Preço / venda | ✓ não se vende (sem sorteio pago, sem loja) | ✓ | ✓ |
| Teste | ✓ `test/sys/newpets3.test.js` (6): cada fonte entrega e o pet nasce em 60/60/100; desligado, nada chega | ✓ | ✓ |
| Nome | ⚠ o PO escreveu "Lobo das Sombras"; o módulo diz "Lobo sombrio". Ficou o do módulo até o dono decidir | — | — |

**O que falta, por dono:**
- **Dono:** votar ligar as entregas dos itens novos (`Sys.newDrops.DATA.on`). Sem isso, os 3 pets existem, mas ninguém consegue.
- **Engenheiro:** desenhar o efeito do golpe próprio por `battleInfo().draw.fx.hit` (`dash`, `feather`, `blink`). O padrão serve para os 9 pets novos.
- **Sistemas:** nada (teste das entregas feito: `test/sys/newpets3.test.js`).

---

## Montaria: 6ª e 7ª estrelas (todas as montarias)

| Linha | Estado |
|---|---|
| Módulo | ⏸ `Sys.mount.setStars7(true)`: teto 7, custo 50 e 60 fragmentos, aura 6 (Submundo) e 7 (Celestial); desligado (f636e23, `js/sys/mount.js`). O save guarda até 7 |
| Atributo | ✓ com o `starFlat`: +2 a +3% por estrela (Lendário +3%) |
| Teste | ✓ `test/sys/mount7.test.js` (5) |
| Aura no desenho | ✗ `js/mountfx.js:73` `MOUNT_AURA` tem 6 posições; `:212` e `:225` travam em 5 (Engenheiro; cores propostas: brasa e branco-dourado) |
| Liga quando | depois da medida do Engenheiro, junto com o pacote das últimas eras |

## Aura dos pets (todos os 17)

| Linha | Estado |
|---|---|
| Regra (nada / leve / forte) | ✓ `js/sys/pet.js` `PET_BATTLE` (f636e23); `test/e2e/petaura.js` (79) e `e2.test` ok |
| Arte | ✓ todas existem em `assets/anim/aura` (aura4, aura7, aura10, aura13, aura_evil, aura_holy): nada falta para a Arte |
| Visto na tela | ✗ falta o QA ver |
