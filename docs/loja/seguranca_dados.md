# Formulário "Segurança dos dados" (Play Console) — RASCUNHO PARA O ADVOGADO

> **RASCUNHO PARA O ADVOGADO.** Respostas a partir do que o app e o servidor fazem HOJE (docs/API_SERVIDOR.md). Se entrar algum SDK novo (anúncio, análise, falhas) ou o chat de texto livre for ligado, este formulário MUDA.

## Perguntas gerais
| Pergunta | Resposta |
|---|---|
| O app coleta ou compartilha algum dos tipos de dados exigidos? | **Sim** (coleta; não compartilha) |
| Todos os dados do usuário coletados são criptografados em trânsito? | **Sim** (HTTPS/WSS) |
| Vocês oferecem uma forma de os usuários pedirem a exclusão dos dados? | **Sim**: no próprio jogo (Configurações → Excluir conta; apaga em 30 dias) e pelo link [URL DA PÁGINA DE EXCLUSÃO] |
| O app segue a Política de Famílias? | **Sim** (o jogo tem jogadores menores; ver iarc.md) |
| Os dados são compartilhados com terceiros? | **Não**. Os processadores que guardam os dados em nome da empresa (hospedagem do servidor; Google para o login e as compras) não contam como compartilhamento, mas devem estar no contrato e na política. |

## Tipos de dados (o que marcar)
| Categoria / tipo | Coleta? | Compartilha? | Obrigatório? | Para quê | Observação |
|---|---|---|---|---|---|
| **Informações pessoais → Nome** | Sim | Não | Não (o jogo sugere um nome do herói; o jogador pode trocar) | Funcionalidade do app (nome do herói no ranking, arena, guilda) | É o nome do PERSONAGEM, não o nome real. Passa pelo filtro do chat (sem dados pessoais). |
| **Informações pessoais → E-mail** | Sim, opcional | Não | Não | Gerenciamento da conta (recuperar a conta) | Só se o jogador cadastrar; **contas de menores de 13 não podem cadastrar e-mail**. Ao vincular o Google, o servidor recebe a confirmação de identidade do Google, não o e-mail solto. |
| **Informações pessoais → Outras informações (data de nascimento: mês e ano)** | Sim | Não | Não (sem resposta = tratado como menor de 13) | Funcionalidade do app e segurança (faixa etária para chat, leilão e trocas) | Só mês e ano, sem dia. |
| **Informações financeiras → Histórico de compras** | Sim | Não | Não (só quem compra) | Funcionalidade do app (entregar a compra), prevenção de fraude | O pagamento é feito pelo Google Play; o app **não vê nem guarda cartão**. O servidor guarda o recibo do Google (id do produto, token e id do pedido). |
| **Mensagens → Outras mensagens no app** | Sim | Não | Não | Funcionalidade do app (chat do mundo, da era e da guilda), segurança (moderação) | Hoje **só frases prontas** para todos. As mensagens ficam até 24 h no histórico do canal; as bloqueadas pelo filtro e as denunciadas vão para o registro de moderação. |
| **Atividade no app → Interações no app / outras ações** | Sim | Não | Sim | Funcionalidade do app (o progresso do jogo, salvo no servidor), prevenção de fraude (conferir progresso impossível) | O "save" do jogo: nível, itens, fases, pets etc. Não é usado para anúncio nem perfil de publicidade. |
| **Identificadores do dispositivo ou outros IDs → ID do dispositivo** | Sim | Não | Sim | Gerenciamento da conta (conta de convidado), prevenção de fraude | Identificador ALEATÓRIO criado pelo app (não é o IMEI nem o ID de publicidade). |
| Localização, contatos, fotos, áudio, arquivos, agenda, saúde, navegação na web | **Não** | — | — | — | — |
| Informações e desempenho do app (registros de falhas, diagnóstico) | **Não** (hoje) | — | — | — | Mudar para "Sim" se entrar um SDK de falhas. |
| ID de publicidade | **Não** | — | — | — | O app não tem anúncios. |

## Práticas de segurança (para a seção "Práticas")
- Dados em trânsito: criptografados (HTTPS/WSS).
- Exclusão: o jogador pede no jogo; a conta e o save são apagados em 30 dias (entrar no prazo cancela). Compras: o registro do recibo pode ser mantido pelo prazo legal/fiscal [CONFIRMAR COM O ADVOGADO].
- Menores: faixa etária pela data de nascimento; menor de 13 ou sem idade = chat só com frases prontas, sem e-mail, sem leilão e sem trocas. Trocas e leilão só 18+.
- Revisão independente de segurança: **Não** (por enquanto).
