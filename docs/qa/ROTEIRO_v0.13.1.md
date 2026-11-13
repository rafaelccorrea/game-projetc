# Roteiro QA da v0.13.1 no Galaxy S24 (para o QA seguir, com critério)

Só instalar com o "pode instalar" do dono, e só a APK que o fps-c8 gerar com o "pode gerar". Conta de teste: não usar dados do dono. Anotar para cada passo: PASSOU / FALHOU, hora, captura de tela se falhou.

## 1. Instalação
- Fazer: instalar a APK, abrir pelo ícone.
- Conferir: ícone e nome corretos; abre sem fechar sozinho; barra de carregamento chega a "Pronto!".
- Passou: abre em até 10 s, sem tela preta ou parada em 0%. Falhou: fecha, trava ou fica sem imagem.

## 2. Primeiro login
- Fazer: tela "Salve sua lenda"; escolher "Jogar como convidado", ler o aviso, confirmar.
- Conferir: nenhum convidado é criado antes de confirmar; depois da confirmação segue para servidores.
- Passou: aviso aparece e o fluxo segue. Falhou: conta nasce antes do aviso, ou o aviso não aparece.

## 3. Login Google
- Fazer: em conta de teste, "Continuar com Google".
- Conferir: abre o seletor do Google, volta ao jogo logado, mostra o servidor.
- Passou: volta logado. Falhou: mensagem de erro (anotar o texto exato), tela em branco, ou não volta ao app.

## 4. Salvar e reabrir
- Fazer: jogar 2 min, fechar o app, esperar 3 min, reabrir.
- Conferir: progresso igual (ouro, fase, FC); "Bem-vindo de volta" só se ficou fora mais de 2 min e ganhou algo.
- Passou: nada perdido, sem duplicar ganhos. Falhou: progresso volta atrás, zera, ou aparece "Dois saves" sem motivo.
- Extra Google: apagar dados do app, entrar de novo com a mesma conta: o progresso volta da nuvem.

## 5. Troca de servidor
- Fazer: Configurações > Conta · Ajuda > "Trocar servidor", escolher outro e voltar ao primeiro.
- Conferir: cada servidor tem seu próprio herói e progresso; "Voltar" funciona.
- Passou: progresso separado e intacto. Falhou: mistura de dados entre servidores ou perda.

## 6. Arena PvP do começo ao fim
- Fazer: abrir Arena, escolher oponente, lutar até o fim natural em x1, x2 e x4; tocar "Pular" no meio de uma luta, inclusive durante o ultimate; "Lutar de novo" 3 vezes seguidas.
- Conferir: nomes sem corte; luta não continua atrás da tela de resultado; recompensa na tela (ouro/gemas) igual à ganha; plural certo ("1 gema"); sem número solto na tela.
- Passou: todas as lutas terminam e a recompensa bate. Falhou: luta que não termina, resultado repetido, recompensa diferente.

## 7. Medieval com arte
- Fazer: chegar à era 2 (Medieval) e ver mapa, batalha, chefe.
- Conferir: fundo, inimigos e chefe com arte (nada "sem nada"); sem piscar do chefe.
- Passou: tudo aparece. Falhou: tela vazia, quadro sem imagem, pisca. Se falhar, testar com internet ligada e desligada.

## 8. Telas e leitura (responsividade)
- Fazer: passar por Equipamento, Loja, VIP, Passe, Configurações, Derrota.
- Conferir: nada cortado nas bordas ou no entalhe da câmera; sem rolagem para o lado; letra legível; botões tocáveis.
- Passou: nada cortado. Falhou: texto cortado, botão fora da tela, sobreposição.

## 9. Desempenho: FPS e memória
- Fazer: jogar 10 min em batalha com pet e montaria, depois 5 min passando pelas telas.
- Conferir: fluidez (sem engasgo visível), celular não esquenta demais, bateria perde pouco; app não fecha sozinho por memória. Se possível, medir FPS e RAM pelo monitor de desempenho do Android.
- Passou: fluido, sem fechar. Falhou: engasgos repetidos, fecha sozinho, aquece muito (anotar % de bateria antes e depois).

## Resultado a enviar
"passou: passos ... / falhou: passos ... (o que vi, hora)". Defeito vai para a sessão dona da área (engenharia, servidor, arte, sistemas).

---

# Anexo para a v0.13.2 (só se o dono mandar gerar a APK com os itens de hoje)

Esses itens NÃO estão na v0.13.1 (commit d17fbbc) e ninguém os viu na tela ainda. Fênix só existe em modo debug, não na APK. Mesmo critério: PASSOU / FALHOU, hora, captura.

10. **Aura e golpe dos pets.** Batalha com pet médio e com pet evoluído: aura atrás do pet, base nos pés, sem cortar; golpe do pet visível. Falhou: aura flutuando, cortada ou cobrindo o herói.
11. **Tela de Pets.** Lobo sombrio, Falcão de guerra e Pantera espectral na lista com imagem, 3 golpes e "como conseguir"; Cérbero, Pégaso e Raposa em "Em breve" (esperado). Conferir miniaturas, palco animado e os 3 estágios.
12. **Montarias.** Vitrine é o desenho da batalha: herói certo (Kael e Kaia), arma equipada na mão (trocar a arma muda), pés na base do pedestal sem cortar, aura por estrela ao tocar nas estrelas, miniaturas sem a espada medieval pintada.
13. **Arma sobre o rosto (pescoço).** Kaia base parada, correndo e golpeando: o rosto fica por cima da lâmina. Também Kael Ciborgue e Demônio, giro de costas e morte de uma skin: sem faixa do corpo cortada nem "tampa" de cabeça sobre a arma. Aparência (vitrine) com uma dessas skins.
14. **Toque de 40 px.** Fechar do Passe, mochila maior (Equipamento), botão "Resgatar" e escolha de reino: tocáveis sem errar com o polegar.
15. **Torneio.** Abre sem erro (a leitura pelo servidor ainda está desligada).
