# Produtos de compra no Play Console (lista para o dono criar)

Feito pelo Servidor (fps-6f) em 14/11/2026. A fonte dos ids, preços e conteúdos é o catálogo do servidor
(`fps-server/src/core/purchases/catalog.ts`), igual ao `js/sys/buy.js` do jogo. Se um id for digitado diferente no Play Console,
a compra não é reconhecida.

**Regras que valem para todos:** conteúdo fixo, nada sorteado. Diamante não compra VIP nem Passe. Todo pagamento conta pontos VIP.

## 1. A lista (13 produtos, todos "produto único" / one-time product)

| # | ID do produto (copiar exato) | Nome na loja | Preço (Brasil) | O que dá | Observação |
|---|---|---|---|---|---|
| 1 | `first_offer` | Oferta do Guardião | R$ 29,90 | Arma Épica 3★, montaria Épica, 300 diamantes e o ouro de 2.000 abates | Só uma vez por conta, só nas primeiras 24 h, só para quem nunca comprou nada (o servidor trava) |
| 2 | `pass_premium` | Passe Premium | R$ 24,90 | Trilha premium da temporada (30 dias) | Uma vez por temporada; pode comprar de novo na próxima |
| 3 | `monthly_card` | Cartão Mensal | R$ 19,90 | 300 diamantes na hora + 60 por dia durante 30 dias | Comprar de novo com o cartão ativo soma 30 dias |
| 4 | `mount_mecha` | Mecha de Guerra | R$ 49,90 | Montaria Lendária Mecha de Guerra, inteira | Uma vez por conta |
| 5 | `gems_60` | 60 Diamantes | R$ 4,90 | 60 diamantes | Dobro na 1ª compra de cada pacote |
| 6 | `gems_130` | 130 Diamantes | R$ 9,90 | 130 diamantes | idem |
| 7 | `gems_350` | 350 Diamantes | R$ 24,90 | 350 diamantes | idem |
| 8 | `gems_750` | 750 Diamantes | R$ 49,90 | 750 diamantes | idem |
| 9 | `gems_1600` | 1.600 Diamantes | R$ 99,90 | 1.600 diamantes | idem |
| 10 | `gems_3400` | 3.400 Diamantes | R$ 199,90 | 3.400 diamantes | idem |
| 11 | `skin_kael_paladin` | Kael Paladino | R$ 24,90 | Skin (só visual) | Uma vez por conta |
| 12 | `skin_kaia_harlequin` | Kaia Arlequina | R$ 24,90 | Skin (só visual) | Uma vez por conta |
| 13 | `skin_kael_cyborg` | Kael Ciborgue | R$ 39,90 | Skin (só visual) | Uma vez por conta |

**VIP não é produto:** não se cria nada no Play Console para ele. O nível VIP sobe sozinho com o valor pago: cada R$ 1,00 pago em
qualquer produto vale 1 ponto VIP.

**Descrição curta para cada produto** (campo "Descrição", até 200 letras): use a coluna "O que dá". Exemplo: "350 diamantes. Na
primeira compra deste pacote, vem o dobro."

## 2. Passo a passo (uma vez)

1. **Perfil de pagamentos:** Play Console > Configuração > Perfil de pagamentos. A conta da empresa precisa estar como comerciante.
   Sem isso, a tela de produtos não deixa pôr preço.
2. **Um build com cobrança enviado:** o Play só abre "Produtos" depois de receber um AAB com a permissão de cobrança (biblioteca
   Play Billing). Basta enviar para Teste interno. O Engenheiro confirma se o AAB atual já leva a biblioteca.
3. **Criar cada produto:** Monetizar > Produtos > Produtos únicos (em inglês, "One-time products") > Criar produto.
   - **ID do produto:** copie da tabela. O ID **não pode ser trocado nem reaproveitado** depois de criado. Se errar, o certo é
     desativar e criar outro, e o catálogo do servidor tem de mudar junto.
   - **Nome e descrição:** os da tabela.
   - **Preço:** o da tabela, no Brasil (o preço do Play já inclui imposto). Para os outros países, use a conversão automática ou
     deixe só o Brasil: decisão do dono.
   - **Ativar** o produto.
   - Consumível ou não: não se marca no Console. Quem decide é o servidor, que "consome" os pacotes de diamante, o cartão, o passe
     e a oferta, e só "reconhece" o Mecha e as skins.
4. **Testadores de licença:** Configuração > Teste de licença. Ponha os e-mails da equipe que vão testar: a compra de teste não cobra.

## 3. Lado do servidor (o Servidor faz; nada disto é com o dono, exceto o item a)

a. **Chave da conta de serviço:** o dono roda no próprio PowerShell `deploy\definir-play.ps1`, na pasta fps-server. A chave vai
   direto para o servidor, sem passar por mensagem ou git. No Play Console, essa conta de serviço precisa ter acesso
   "Ver dados financeiros" e "Gerenciar pedidos" (Usuários e permissões).
b. **Avisos do Google (reembolso e cancelamento):** tópico do Pub/Sub ligado em Monetizar > Configuração de monetização >
   Notificações do desenvolvedor em tempo real, com push para `https://<domínio do servidor>/v1/webhooks/google`.
c. **Ligar as compras:** `BILLING_ON=1`, só quando o PO liberar, depois de uma compra de teste com testador de licença.

Pacote do app na loja: `br.com.intellisys.eonbound`. O app DEV (`.dev`) não compra de verdade.
