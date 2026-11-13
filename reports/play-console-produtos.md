# Produtos do Google Play — lista para o dono cadastrar (Eonbound)

Os IDs abaixo têm de ser criados **exatamente iguais** no Play Console. O servidor recusa qualquer produto que não esteja nesta lista (`fps-server/src/core/purchases/catalog.ts`).
Nada aqui é sorteio: todo produto tem conteúdo fixo. Diamantes nunca compram VIP nem Passe.

## Onde cadastrar
Play Console → app **Eonbound** → **Monetizar com o Play** → **Produtos** → **Produtos no app** → **Criar produto**.
Para cada linha: *ID do produto* (coluna ID), *Nome*, *Descrição*, *Preço padrão* em BRL → **Salvar** → **Ativar**.
Todos são **produtos no app** (não são assinaturas). O Play pede que o app já tenha um APK/AAB enviado com a permissão de faturamento (o plugin entra no próximo APK) e uma conta de comerciante ativa.

| ID | Nome na loja | Preço | Tipo | O que o jogador recebe |
|---|---|---|---|---|
| `gems_60` | 60 Diamantes | R$ 4,90 | consumível | 60 💎 (o dobro na 1ª compra deste pacote) |
| `gems_130` | 130 Diamantes | R$ 9,90 | consumível | 130 💎 (dobro na 1ª compra) |
| `gems_350` | 350 Diamantes | R$ 24,90 | consumível | 350 💎 (dobro na 1ª compra) |
| `gems_750` | 750 Diamantes | R$ 49,90 | consumível | 750 💎 (dobro na 1ª compra) |
| `gems_1600` | 1.600 Diamantes | R$ 99,90 | consumível | 1.600 💎 (dobro na 1ª compra) |
| `gems_3400` | 3.400 Diamantes | R$ 199,90 | consumível | 3.400 💎 (dobro na 1ª compra) |
| `monthly_card` | Cartão Mensal | R$ 19,90 | consumível | 300 💎 na hora + 60 💎 por dia por 30 dias (resgate diário) |
| `pass_premium` | Passe Premium (temporada) | R$ 24,90 | consumível | Trilha premium da temporada atual (30 dias) |
| `first_offer` | Oferta do Guardião | R$ 29,90 | consumível | Arma Épica 3★ + Lobo de guerra + 300 💎 + ouro (só 1ª compra, 24 h) |
| `mount_mecha` | Mecha de Guerra | R$ 49,90 | consumível* | Montaria Lendária Mecha de guerra, inteira |

\* No Play todos são criados como produto no app; quem decide "uma vez por conta" é o **servidor** (a Oferta e o Mecha só podem ser comprados uma vez; o Passe uma vez por temporada).

## VIP
O VIP **não é um produto**: pela regra do dono, os pontos VIP são o valor pago em reais (R$ 1 = 1 ponto) e vêm de **qualquer** compra acima. Os níveis sobem
sozinhos pela tabela do `js/sys/vip.js` (Nv 1 com a 1ª compra; Nv 2 com R$ 300; … Nv 10 com R$ 25.000 — a tabela de pontos ainda é proposta).
Se o dono quiser vender **níveis de VIP diretamente** (ex.: "VIP 3 por R$ X"), é uma decisão nova: preciso dos preços por nível, e isso muda a regra
"VIP = reais gastos" (cada pacote daria os pontos que faltam para o nível). Até lá, o botão "Comprar VIP" da tela VIP deve abrir a Loja.

## Skins
As roupas-skin saíram de venda (decisão do dono). O catálogo continua aceitando `skin_<id>` para quando o dono liberar alguma (preços por raridade
R$ 9,90 / 14,90 / 19,90 / 24,90 / 29,90), mas nenhuma está na lista para cadastrar agora.

## Depois de cadastrar
1. Play Console → **Configuração** → **Acesso à API** → vincular o projeto Google Cloud e criar a **conta de serviço** com permissão de "Ver dados financeiros" e "Gerenciar pedidos". O JSON dela vai **só** para o ambiente do servidor (`GOOGLE_PLAY_SA_JSON`), nunca por mensagem.
2. `GOOGLE_PLAY_PACKAGE=br.com.intellisys.eonbound` no ambiente do servidor.
3. Notificações em tempo real (reembolso/estorno): Play Console → **Monetização** → **Notificações em tempo real** → tópico do Pub/Sub com push para `https://api.<domínio>/v1/webhooks/google` (depois do HTTPS).
