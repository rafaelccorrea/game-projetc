# Backlog sem arte nova (13/11/2026, 20h) — ordem do dono: "faz até fechar tudo"

Regra: cada item vira commit + push; o QA confere no navegador; o PO atualiza o STATUS_DONO. Parar tudo se o dono avisar que o uso do Claude chegou a 80%.

## Engenheiro (fps-c8) + agentes
1. APK v0.13.0: seleção de servidor no fluxo (Título → Login → Servidor → Prólogo → Criação), pet sempre na frente, troca do personagem na hora em todas as telas, ícones de peça t0/t1/t2, online se o QA fechar (CORS já corrigido)
2. Inimigos das eras 7 e 8 ligados (EN_ANIM_ERAS + nomes no meta) e fundo de reserva das eras 7-8
3. Polimento aberto (docs/POLIMENTO.md): P4/P13 pet na Vitória; P8 texto de tempo esgotado da Instância; P19 nome do chefe na Vitória; P20 herói do Título dentro de caixa com borda; P22 logo do Título coberto pelo anel; P23 botões antigos de fase no Modo dono; morte com pistola abaixo do chão; "NÍVEL +1" atrás da barra
4. Montado: chapéu/óculos/colete/botas somem ao montar (máscara por código com a Arte)
5. Skin × asa: campo noWing (Kael Anjo sem asa quando há asa equipada)
6. Folhas em grade (desempenho), em lotes com a Arte e o QA
7. Medir o desempenho no S24 na instalação da v0.13.0

## Servidor (fps-6f)
1. Online: acompanhar a conferência do QA; login Google no aparelho
2. Servidores fase 2: rankings, guildas, chat, Chefe Mundial, leilão e correio separados por servidor (antes de abrir o S2)
3. Página pública de política de privacidade e termos no servidor (https://15-229-249-157.sslip.io/privacidade), com o texto da Sistemas
4. Defeitos das telas de entrada: filtro de nome (palavrão com números), "Google" sem "em breve" quando o online estiver desligado
5. Lista de limpeza antes do lançamento (contas de teste, origens do QA)

## Sistemas (fps-69)
1. Sem rolagem lateral: Mochila e nuvem × aparelho
2. P24: FC 324 → 326 ao equipar/voltar a skin padrão (arredondamento ou perda)
3. Textos para a loja: ficha da Play Store (título, descrição curta e longa, novidades), respostas do formulário de Segurança dos Dados, questionário de classificação etária (IARC) e rascunho da política de privacidade e dos termos (LGPD, ECA Digital: jogador menor, chat só com frases prontas, leilão/trocas 18+, sem sorteio pago) — para o advogado revisar
4. Equilíbrio depois das mudanças (skin de arma fora do bônus; ícones e raridade dos títulos): rodar os 180 dias

## QA
1. Conferir cada entrega acima no navegador (uma aba por vez, pedir a vez ao fps-c8)
2. Varredura de textos cortados entre 288 e 390 px em todas as telas
3. Roteiro de teste da v0.13.0 no aparelho (para o dono seguir quando instalar)

## Arte (fps-75)
1. Samurai e Ciborgue (créditos garantidos) → Fênix Gigante montada
2. Custo zero: Kael Anjo sem asa, ícones dos estágios dos pets novos, ícones das asas Anjo/Demoníaca
3. Limpezas pendentes do POLIMENTO (grifo quadro 12, lobo quadros 7/10, tigre de cristal) se forem por código

## PO (eu)
- Telas refeitas uma a uma para o voto do dono (Perfil V5 publicado; próximas conforme o dono indicar)
- Status do dono a cada entrega
