# Agente 4 - Inimigos e Chefes

Entregue: 21 sprites em assets/enemies (era{0..6}_e0, _e1, _boss .png) + meta.json com nomes PT-BR.
- 512x512, transparentes, virados para a esquerda, pés a ~95% da altura. Comuns ocupam ~80% da altura; chefes ~95%.
- Geração: nano_banana_pro, 2 créditos cada. 24 gerações = ~48 créditos (21 + 3 refeitas: T-Rex original tinha texto, chão e olhava à direita; golem e legionário tinham sombra no chão).
- Saldo inicial 926,96; final 771,96 (queda de 155 inclui gastos simultâneos dos outros agentes, pois o saldo é compartilhado). Meu gasto estimado: ~48.
- Remoção de fundo: NÃO usei remove_background (limite de 8 jobs simultâneos travou). Fiz localmente (flood fill a partir das bordas + suavização de borda, via PowerShell/System.Drawing), e recortei/centralizei em 512x512. Sem halo visível.

Pendências / observações
- era1_e0 (legionário) tem uma sombra cinza bem fraca sob os pés.
- era2_boss (dragão) fica menor na altura por causa do fogo largo.
- O disco C: estava 100% cheio durante o trabalho (um arquivo foi truncado e depois refeito); vale liberar espaço.
