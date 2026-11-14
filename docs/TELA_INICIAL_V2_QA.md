# Tela Inicial V2: roteiro do QA

Arquivo: `js/p_title3.js` (arte pintada, dragão, "Já tenho conta: entrar com Google"). Teste sem navegador: `node test/paineis/p_title3.smoke.js`.

**Estado: DESLIGADA para o jogador (`window.TITLE3_ON = false`). Ninguém a viu num navegador nem no celular ainda. Só liga depois do QA e do voto do dono.**

## Como abrir (sem mudar nada para o jogador)

| Onde | Como |
|---|---|
| Navegador, quem já tem jogo | `index.html?debug=1&titulo=3` |
| Navegador, jogador novo | `index.html?debug=1&titulo=3&fresh=1` (save novo só nesta carga, nada é gravado) |
| App (sem barra de endereço) | console do `chrome://inspect`, com o Título de hoje na tela: `TITLE3_ON=true; PTitle3.install()` (vale até recarregar) |

- Sem `debug=1` o `titulo=3` não vale. `?skip=1` e a recarga ao vivo pulam a entrada inteira: a tela não aparece.
- Voltar à tela de hoje: recarregar sem o parâmetro.
- Larguras: 320, 360, 390 e 412 (pedir a vez do navegador antes; uma aba só).

## O que conferir

**Cena**
- Fundo pintado (castelo ao entardecer) cobre a largura sem esticar; herói e dragão com os pés no chão da clareira, nada flutua.
- Herói com a arma na mão, montaria e asa do save. Logo dourado no alto, sem cobrir o herói.
- Reserva do fundo: no console, `PTitle3._t.probe.dispatchEvent(new Event('error'))` troca para a cena da era, com herói e dragão no chão dela.

**Jogador novo (`&fresh=1`)**
- JOGAR ("Começa como convidado neste celular"), depois "Já tenho conta: entrar com Google", a linha do convidado e os termos, nesta ordem.
- Abrir a tela NÃO cria convidado. JOGAR cria uma vez só e segue: servidor (1ª vez) e Prólogo.
- "Já tenho conta" chama o login de hoje e não cria convidado. Em 320 px o texto quebra em duas linhas, sem cortar.

**Quem volta**
- Cartão com retrato, nome, era, fase e nível. JOGAR ("Continuar a jornada") entra no jogo, ou no Bem-vindo de volta se houve tempo fora.
- Ícone de conta: convidado mostra "Vincular com Google". O toque abre um AVISO ("se esta conta Google já tiver um jogo salvo, ele pode entrar no lugar do jogo deste celular") com Continuar com Google / Cancelar. Cancelar e fechar a folha não chamam nada.
- Conta Google já ligada: selo "G" no ícone, "Salvo na nuvem" no rodapé, folha sem botão de entrar.

**Estados**
- Conectando: "Conectando" no cartão do servidor; JOGAR funciona.
- Sem rede (modo avião) e manutenção: faixa de aviso, "Jogo offline" no JOGAR, Google apagado e com aviso ao tocar.
- Carregando da nuvem e escolha celular x nuvem: JOGAR apagado, com aviso ao tocar.
- Jogo da nuvem encontrado: faixa azul, JOGAR funciona.
- Erro de login (cancelar a janela do Google não avisa; falha avisa "Não foi possível entrar com o Google. Tente de novo." e dá para tentar de novo).
- App DEV: "No app DEV o login Google não funciona. Jogue como convidado."

**Geral**
- Textos em português, sem reticências, sem preço nem urgência. Botões com 44 px ou mais. Nada passa da largura. Versão do jogo no rodapé.
- Trocar servidor abre o painel de hoje e volta para a tela.

## O que o teste automático já cobre (em node, com DOM de mentira)

Chave desligada não muda nada; cada toque chama a função de hoje uma vez; estados de rede; aviso antes do Google para quem já tem jogo; textos, imagens em disco, 44 px, contraste. **Não cobre**: aparência, encaixe nas quatro larguras, toque de verdade, login Google de verdade.

## O que ainda falta

1. Ver no navegador e no app DEV (nada disto foi visto em tela).
2. Login Google de verdade só no app de produção: testar entrar em conta que já tem jogo, com e sem jogo no celular (confirmar com o Servidor quando o jogo da nuvem entra sem a tela de escolha).
3. Os termos citam "Configurações › Sobre", que não existe em Configurações (o mesmo texto está na tela de Login de hoje). Precisa de destino real ou de texto novo.
4. Não há "sair da conta" em Configurações: a folha da conta Google só diz onde a conta aparece.
5. O dragão é a folha do pet do jogo; a Arte ainda troca por uma folha própria da Tela Inicial.
6. Altura pequena (320x568): conferir se a pilha de botões do jogador novo não cobre o herói.
7. Ligar (`TITLE3_ON = true`) só com o QA aprovado e o voto do dono.
