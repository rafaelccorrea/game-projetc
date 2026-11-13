# Textos da loja — RASCUNHO PARA O ADVOGADO

> **RASCUNHO PARA O ADVOGADO.** Nada aqui foi revisado juridicamente. Os campos entre colchetes ([EMPRESA], [CNPJ], [E-MAIL], [ENDEREÇO], [ENCARREGADO]) são da empresa e precisam ser preenchidos por ela. Escrito por Sistemas (fps-69) em 13/11/2026 a partir do que o jogo e o servidor fazem hoje (docs/API_SERVIDOR.md, js/sys/*). Se o jogo mudar, estes textos precisam acompanhar.

| Arquivo | Para quê | Onde vai |
|---|---|---|
| [ficha_play_store.md](ficha_play_store.md) | título, descrição curta e longa, novidades | Play Console → Presença na loja |
| [seguranca_dados.md](seguranca_dados.md) | respostas do formulário "Segurança dos dados" | Play Console → Conteúdo do app |
| [iarc.md](iarc.md) | respostas do questionário de classificação etária (IARC) | Play Console → Classificação do conteúdo |
| [politica_privacidade.md](politica_privacidade.md) | política de privacidade (LGPD, ECA Digital, regras de família do Google) | página pública do servidor (o Servidor publica) e link na Play |
| [termos_de_uso.md](termos_de_uso.md) | termos de uso | página pública do servidor e link no jogo |

## Fatos em que estes textos se apoiam (conferir antes de publicar)
- **Sem anúncios** e **sem SDK de análise, rastreamento ou anúncios** no app (dependências do APK: Capacitor core/app/haptics e o login do Google).
- **Conta de convidado** criada no 1º acesso, **sem e-mail e sem senha**; o aparelho recebe um identificador aleatório (deviceId). Vincular a conta do Google é opcional.
- **Idade**: o jogo pergunta **mês e ano de nascimento** numa tela neutra. Sem resposta, a conta é tratada como **menor de 13**.
- **Chat**: hoje **só frases prontas para todos** (texto livre desligado até o parecer jurídico). Filtro de palavrão e de dados pessoais no servidor, denúncia, bloqueio e silenciamento.
- **Leilão e trocas entre jogadores**: **só para 18+** e **só com ouro do jogo**; nunca diamante, nunca dinheiro.
- **Sem sorteio pago**: nada aleatório é vendido por dinheiro nem por diamante. A invocação de equipamentos usa só ouro do jogo. Tudo o que se compra é compra direta, com o conteúdo mostrado antes.
- **Compras não passam entre contas**: diamantes e itens comprados ficam presos à conta que comprou.
- **Exclusão da conta** pelo jogo (Configurações › Conta › Excluir conta, em breve no app) ou pela página https://15-229-249-157.sslip.io/excluir-conta: apaga em 30 dias, em todos os servidores (entrar de novo nesse prazo cancela). Texto da página: docs/loja/excluir_conta.md (o Servidor copia para fps-server/legal/excluir-conta.md).
- **Hospedagem**: AWS (São Paulo) e banco no Supabase (região a confirmar). Páginas públicas no ar como RASCUNHO (faixa vermelha, noindex): /privacidade, /termos, /excluir-conta. Para atualizar: mudar o docs/loja/*.md e avisar o Servidor (fps-6f); quando o advogado aprovar, tirar "RASCUNHO" da 1ª linha.
- **Servidores separados** (S1 "Nova Era", depois outros): cada servidor tem o seu progresso.
