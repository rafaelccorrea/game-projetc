# Arte: quando um item está PRONTO (regra do dono, 14/11/2026)

> "Quando a gente vai fazer qualquer arte, primeiro faz a arte completa para depois passar para a próxima. Exemplo: uma arma: a arma e todos os processos dela, na mão de todos os personagens, de todas as skins, com todos os efeitos. Fez tudo, aí vai pro próximo. Senão a gente nunca acaba e sempre vai ter gap."

## Regras
1. **Um item por vez, até 100%.** Só se abre o próximo item quando o atual passa em TODAS as linhas da lista dele (arte + código + teste + visto na tela).
2. **Primeiro o que JÁ está no jogo.** Coisa nova (montarias/pets/skins novos) só depois de todos os itens existentes estarem completos.
3. **Pronto = visto funcionando no jogo**, não só a folha no disco: ligado no código, nos testes (stagekit, sheetcss, sheetgrid) e conferido pelo QA na tela.
4. Ordem dos itens: pelo que o jogador vê mais cedo.

## Lista do que um item precisa ter (fluxo natural)

### Arma (cada uma: família × raridade × era)
- [ ] Ícone (inventário, Forja, loja, baú)
- [ ] Na mão do **Kael e da Kaia**, em **todas as skins**, em todos os estados: parado, correr, golpe, giro, morte (grip certo em todo quadro)
- [ ] **Montado**: a arma equipada na mão em todas as montarias (hoje as folhas montadas trazem a espada medieval desenhada, então não troca)
- [ ] Golpe especial / ultimate da arma, e o efeito de cada raridade (Mítica por código)
- [ ] Efeito da Forja (aura da arma por nível) no herói
- [ ] Prévia nas telas (Equipamento, Forja, Invocar, Loja, Perfil)

### Skin (cada uma, Kael ou Kaia)
- [ ] A pé: parado, correr, golpe, giro, morte; pistola parado/correr/tiro; arco e bumerangue
- [ ] Montada em cada montaria (ou regra aprovada pelo dono para o paliativo)
- [ ] Com cada asa (âncora das costas) e na morte com asa
- [ ] Com cada arma (item acima)
- [ ] Avatar, ícone de loja, prévia em todas as telas

### Montaria (cada uma)
- [ ] Kael e Kaia montados: parado, correr, golpe
- [ ] Arma equipada na mão montado
- [ ] Skins montadas (ou paliativo aprovado)
- [ ] Asa nas costas montado
- [ ] Aura por estrela 1-7 (código, MOUNT_AURA)
- [ ] Montaria sem cavaleiro (Derrota / Códex) e ícone
- [ ] Ligada no código (MOUNT_TBL, manifest) e em todas as telas (Montarias, Perfil, Arena, Batalha, Loja/Prêmio)

### Pet (cada um)
- [ ] 3 estágios × parado, correr, golpe(s) que o jogo usa
- [ ] Aura por estágio desenhada
- [ ] Ícones dos 3 estágios, efeito de evolução
- [ ] Sempre na frente do herói, pés no chão (voador: altura certa)
- [ ] Ligado na tela de Pets, Batalha, Perfil, Arena

### Asa (cada uma)
- [ ] L/R com batida, em todas as skins, montado, na morte
- [ ] Ícone e prévia

## Matriz
A Arte mantém em `docs/ARTE_MATRIZ.md` uma linha por item EXISTENTE com cada coluna acima marcada ✓/✗ e o arquivo:linha do que falta, ordenada pela prioridade. O PO só libera o próximo item quando a linha do atual está toda ✓.
