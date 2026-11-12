# Eonbound — status para o dono

Atualizado em 12/11/2026 pelo PO/design (sessão fps-98).
Legenda: `[x]` feito · `[ ]` falta · `[~]` em andamento

**Links**
- Aprovação de arte: https://claude.ai/artifact/Qow6wHm4Eyyqu5QpkqJE19
- Protótipos das telas (canvas): https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba

**Como a esteira funciona:** você aprova a arte → eu monto a tela com ela → você aprova a tela → o engenheiro implementa → o QA testa jogando as 7 eras. O que você aprova vai para os devs no mesmo dia.

---

## 1. Suas decisões que já valem

- [x] Nada estático: personagem, arma, efeito, ultimate, cenário e ícone só entram se estiverem em movimento.
- [x] Nenhum personagem flutua, quica ou pula: pés sempre na linha do chão.
- [x] Espada na mão direita do Kael.
- [x] VIP só por compra (o pagamento real fica para depois).
- [x] Skin e VIP dão poder, mas só por compra direta ou pelo Passe. Nunca por sorteio pago.
- [x] Montaria dá poder.
- [x] Personagem customizável com 7 espaços: arma, colete, chapéu/elmo, luvas, botas, colar e asa (a asa libera no nível 50).
- [x] Nível do jogador de 1 a 100, difícil de subir.
- [x] Raridade presa ao nível e à era (Épico a partir do nível 25; Mítico no 70 e da era Industrial em diante; Lendário no 85 e da era Moderna em diante).
- [x] Nível do item de 1 a 100, limitado ao nível do jogador; sobe com ouro ou diamante; item novo começa no 1.
- [x] Farm no automático: moedas e experiência caem no chão a cada abate.
- [x] Passe de batalha com nível próprio, que sobe com missões. Grátis dá pouco; Premium dá itens melhores.
- [x] Heroína Kaia, escolhida na criação do personagem.
- [x] Só AUTOMÁTICO: o modo manual foi removido (habilidades e ultimate disparam sozinhas).
- [x] Pets: 15 no total, 5 no lançamento e 10 em atualização.
- [x] Forja +0 a +15: pode falhar, mas nunca perde nível.
- [x] Plano de arte em fases, cortado para caber no saldo de créditos.
- [x] Pets: estrelas = qualidade, nível = atributos; 3 ataques automáticos (básico ~90%, crítico "tiro" ~7%, mediano ~3%, chances sobem com estrelas e nível); efeito do pet nunca maior que as habilidades do personagem.
- [x] Customização: chapéu, arma, asa e colar trocam peça por peça; colete, luvas e botas formam a roupa (luva e bota mudam cor por raridade).
- [x] VIP 1 a 10 por pontos de compra (o nível nunca desce); faltam os pontos de cada nível, que vêm com o preço real.
- [x] Arena: 5 lutas por dia contra cópias com a sua força ±10%; prêmios só quando o online abrir.
- [x] Skin de chapéu, luvas, botas, colar e asa também dá poder (+1% a +4%), dentro do teto de coleção de +10%.
- [x] Duas eras novas depois da Futurista: Submundo (era 7) e Celestial (era 8), com armas, skins e cenário. Nível máximo sobe para 120 (proposta: raridade Divino só nelas).
- [x] Créditos: eras novas e pets andam juntos.
- [x] Torre: chefe a cada 10 andares. Instâncias: 2 entradas por área por dia, +1 com VIP.
- [x] Pets em 3 estágios: filhote → médio → evoluído, por nível do pet, cada estágio com aura própria, animação de evolução, e o evoluído bem épico. As 5 imagens atuais valem como filhote. Números: cada pet tem o próprio nível (máximo 90); vira médio no nível 30 e evoluído no 60; o pet vale no máximo 20% da sua força.
- [x] Qualidade do item (todos os 7 espaços): poder 0-10.000 e estrelas 1-5; 4★+ em ~10%, 5★ em ~2%, 10.000 em 1 por milhão; a raridade sempre manda no atributo principal; média igual à de hoje (o jogo não fica mais difícil).
- [x] Fusão: 3 itens iguais com a mesma estrela viram 1 com +1 estrela, até 5★ (5★ não funde). Sem diamante.
- [x] Item de era futura que cai cedo fica "adormecido" (rende como 1 era à frente, nível 1) até você chegar na era dele.
- [ ] Leilão entre jogadores: plano escrito, entra quando houver servidor online.
- [~] Qualquer item de qualquer era pode ser usado em qualquer era. Item de era futura pode cair cedo, muito raro. Mítico e Lendário das 3 últimas eras nunca caem antes do portão deles. (números sendo calculados junto com a qualidade)
- [x] Pets novos: Submundo (ataque, era 7) e Celestial (defesa, era 8), Lendários; PRISMÁTICO, o mais raro (até 25% da força): 1.000 fragmentos sem sorteio (evento mensal 100, VIP 10 dá 500 de uma vez, arena semanal 1º 10 / 2º 7 / 3º 5, chefe da era 8, torre). Tempo: quem paga e joga ~3,4 meses; VIP médio ~6,5; grátis ~7,5. Estrelas: mais 500 fragmentos até 5★.
- [x] Duração: terminar a última era (Celestial) leva ~6 meses grátis / ~4 meses VIP, jogando ~40 min por dia. Trava de nível para entrar nas eras: 1, 12, 25, 40, 55, 70, 85, 100, 110. Era 0 continua curta (troca de era no 1º dia). Quem falta recebe bônus de retorno (até 3 dias).
- [~] 19 Prólogo: refazendo de verdade (relógio com arte, 4 cenas, o mapa ilustrado)
- [x] 17b Pets V2: APROVADA
- [x] 20 Mapa das Eras V2: APROVADO (entra junto com as 100 fases e 4 dificuldades); mapas das eras 1 a 8 pedidos à arte (~16 créditos)
- [~] Dano coerente com a força: o dano sai dos atributos; ninguém com 2 mil de FC dá 1 milhão de dano. Tabela de tetos por golpe sendo feita e o QA vai medir em cada era.
- [x] Kael cresce com a progressão: garoto → adolescente (nível 20 + ~15 mil de força) → adulto → guerreiro lendário, com animação de evolução. Substitui as roupas por era. Skins viram cor e detalhe sobre cada fase.
- [~] Animação nova de subir de nível (a atual está tosca)
- [x] Números grandes abreviados (mil, mi, bi, tri). Poder recomendado do Senhor: 1,7 mil (era 0) até 719 tri (era 8).
- [x] Pet libera no nível 20: ovo com animação de chocar, 79% Básico / 21% da 2ª raridade (nunca Lendário); pet equipado aparece na batalha.
- [x] Kael: adolescente no nível 22 (para não cair junto com o ovo do pet), adulto no 35, guerreiro lendário no 70.
- [x] Diamante grátis: ~10 mil em 6 meses (as missões diárias passam a dar menos).
- [x] Cada era com 100 fases e 4 dificuldades (Fácil, Médio, Difícil, Hell), cada dificuldade 3x mais forte. Para liberar: eras 0-1 só Fácil; 2-3 + Médio; 4-5 + Difícil; 6-7 + Hell; o Celestial fecha no Difícil e o Hell dele é o desafio final. Prêmio maior em cada dificuldade (até 4x de ouro e material; no Difícil e no Hell a qualidade do item sai melhor). Calendário mantido: dia 179 grátis, 121 VIP.
- [x] 21 Perfil e Coleção: APROVADO
- [x] Todas as telas têm que funcionar em qualquer tamanho de celular (responsivas)
- [x] Diamante nas fases só em marcos (a cada 10 fases, chefe e Senhor da Era); fase comum dá ouro e experiência
- [~] Equipamento: botão "Equipar melhor" (automático) e arrastar o item para o espaço
- [x] Canvas: TODAS as telas aprovadas convertidas para o layout novo (sem barra de baixo, header novo, voltar, responsivas)
- [~] Jogo: painéis em tela cheia; Equipamento, Invocar, Loja, Passe e Práticas já abrem assim na v0.12.1 (Configurações e os outros em seguida); layout antigo será apagado do código
- [x] 22 Oferta de primeira compra APROVADA (arma Épica 3★ + lobo Épico + 300 gemas + 48 mil de ouro, de R$ 89,90 por R$ 29,90, 24 h)
- [~] Protótipos de Arena, Eventos e Leilão em produção
- [x] Preços da loja aprovados: gemas de R$ 4,90 (60) a R$ 199,90 (3.400), 1ª compra de cada pacote em dobro; cartão mensal R$ 19,90; Passe Premium R$ 24,90/temporada; skins R$ 9,90-29,90; oferta de 1ª compra R$ 29,90; VIP sobe com o valor gasto.
- [x] Montaria dá atributo (3% a 12% de ataque e vida); o Kael monta nela
- [x] Transformação de item: paga ouro + Essência da Era, e o item antigo vira da era atual com a mesma raridade e o mesmo visual (nível volta ao 1).

## 2. Arte (página de aprovação)

Conferido no banco da página em 12/11/2026: **220 itens aprovados, 27 reprovados, nenhum esperando voto.**

### Aprovada por você
- [x] Kael correndo, parado e golpeando, espada na mão direita, 3 espadas trocáveis (versão final "R")
- [x] Kael correndo sem arma (carregamento)
- [x] Habilidades do Kael no Medieval: golpe com rastro e Corte Giratório (3 espadas)
- [x] Cabelos e chapéu: elmo, loiro espetado e coque
- [x] Auras +4 azul, +7 roxa, +10 fogo e +13 dourada (parado, correndo e golpe)
- [x] Cenários vivos: Pré-História, Medieval, Antiguidade e Pólvora (era 3)
- [x] Inimigos das 7 eras completos: corrida, ataque/tiro, apanhando e morrendo dos 2 comuns e do chefe de cada era (Goblin, Esqueleto e Dragão do Medieval inclusos)
- [x] Ultimates animadas das 7 eras
- [x] Ícones dos 7 espaços nas 7 eras (49: arma, colete, chapéu, luvas, botas, colar, asa)
- [x] As 8 músicas (título + 7 eras)
- [x] Sons: os 13 refeitos e os demais efeitos

### Reprovada por você
- [x] Kael por peças articuladas ("andar de siri", arma no braço errado, pernas duras) → trocado pela técnica de vídeo, já aprovada
- [x] Golpe antigo do Kael → refeito e aprovado (versão "R")
- [ ] **Kaia (imagem de referência): fundo verde** → refazer sem o fundo
- [x] 13 sons da primeira versão → refeitos e aprovados

### O que falta (parado até o jogo receber o que já foi aprovado)
- [ ] **Colocar no jogo tudo o que está aprovado acima** (o engenheiro está conferindo item por item; você disse que os inimigos ainda andam e atacam errado no jogo)
- [ ] Kaia: refazer a referência sem fundo verde, depois as animações
- [~] Pets por era: 5 imagens de referência sendo feitas (mamute, esfinge, dragãozinho, papagaio, cão mecânico)
- [ ] Customização no corpo: chapéu e arma trocando de verdade, asa e colar presos por código, colete+luvas+botas como roupa
- [ ] Cenários de Industrial, Moderna e Futurista
- [ ] Kael apanhando e morrendo; pose de tiro para armas de fogo
- [~] Montarias: lobo e grifo APROVADOS; depois o Kael montado (~14-18 créditos cada, começando pelo lobo da oferta)
- [~] Kael nas 4 fases de idade: 4 imagens primeiro (~8 créditos), depois as animações (~35-40 por fase)
- [ ] Morte do herói refeita (você achou horrível)
- [x] Aura maligna e celestial, asas demoníaca e de anjo: prontas, esperando seu voto
- [~] Pose de tiro: a 1ª foi reprovada; refazendo como pistola com uma mão (~18 créditos, liberado por você)
- [ ] Pets do Submundo, Celestial e Prismático: imagens dos 3 estágios (~18 créditos)
- [ ] Pets: imagens dos estágios médio e evoluído (~20 créditos), depois animação e evolução
- [ ] Submundo e Celestial: 16 imagens de referência prontas, esperando seu voto na página
- [~] Cenário da Industrial pronto, ajustando as partes paradas antes de ir para o seu voto

## 3. Telas (canvas)

| Tela | Situação |
|---|---|
| 00 Carregamento | [x] Aprovada |
| 01 Título | [x] Aprovada (melhorar depois) |
| 02 Login | [x] Aprovada |
| 03 Intro e nome (escolha Kael/Kaia) | [x] Aprovada |
| 04 Batalha | [x] Aprovada · 04b tela cheia [x] Aprovada · 04c V2 com menu agrupado [x] Aprovada (missão guia na tela: protótipo em produção) |
| 05 Equipamento (7 espaços) | [x] Aprovada |
| 06 Invocar | [x] Aprovada |
| 07 Loja | [x] Aprovada |
| 08 Passe (nível próprio e missões) | [x] Aprovada |
| 09 Configurações | [x] Aprovada |
| 10 Vitória/Derrota do chefe | [x] Aprovada |
| 11 Troca de era | [x] Aprovada |
| 12 Ranking | [x] Aprovada (sem servidor: rivais locais, prêmios só quando o online abrir) |
| 13 Instâncias | [x] Aprovada |
| 14 Torre | [x] Aprovada |
| 15 Forja | [x] Aprovada |
| 16 Práticas e Títulos | [x] Aprovada |
| 17 Pets | [x] Aprovada a V2 (17b) |
| 18 VIP | [x] Aprovada |

## 4. Regras do jogo (escritas e no código, prontas para ligar)

- [x] Loot, baú de toque (8 por dia, 12 com VIP), instâncias diárias
- [x] Moedas e experiência por abate
- [x] Raridade presa a nível e era (num ponto só do código)
- [x] Nível do jogador e desbloqueio de funções (pet 1, práticas 5, forja 12, instâncias 14, torre 15, arena 30)
- [x] Atributos (ataque, vida, defesa, chance e dano crítico, velocidade) e fórmula de força
- [x] Skin com bônus e coleção (até +10%)
- [x] VIP: +10% ataque/vida, +25% experiência/ouro, offline em dobro, 12 baús, 1 chave extra
- [x] Nível do item 1-100; desmontar devolve metade do ouro
- [x] Invocação só com ouro (sem gemas)
- [x] Passe com nível e missões próprios; Item da Temporada no Premium
- [x] Forja, práticas, títulos, torre e pets
- [~] Transformação de item (lógica e Essência da Era sendo feitas; tela na aba "Transformar" da Forja)
- [ ] Ritmo do jogo recalibrado com a medição real (o simulador está otimista; os dias valem só como comparação)

## 5. Balanceamento (simulação, ainda não é medida real)

- [x] Grátis chega ao fim em cerca de 59-61 dias
- [x] VIP chega ao fim em cerca de 41 dias
- [x] Níveis no fim de cada era: 11, 17, 26, 43, 73, 87, 100
- [x] Pets: golem ~3 estrelas e fênix ~2,5 no grátis
- [ ] Medir abates por minuto no jogo real e recalibrar tudo

## 6. Jogo (o que o engenheiro já entregou — versão 0.7)

- [x] Tela de carregamento igual ao protótipo
- [x] Cenários vivos da Pré-História e do Medieval
- [x] Kael animado com a espada na mão
- [x] Música e sons aprovados
- [x] No máximo 3 inimigos na tela, com selo "+N"; todos atacam
- [x] Inimigos do Medieval com ataque, dano e morte animados
- [x] Ultimates animadas de Pré-História, Medieval e Moderna
- [x] Inimigos virados corrigidos (T-rex, Pirata, Tanque)
- [x] Nível do jogador, moedas e experiência voando
- [x] Invocação em ouro, sem sorteio de skin
- [~] Linha dos pés e tamanho dos inimigos iguais ao protótipo
- [~] Inimigos sem animação não podem pular (sua reclamação da Pré-História)
- [ ] Telas Equipamento, Invocar e Loja (próxima rodada)
- [ ] Demais telas, depois que você aprovar

## 7. QA

- [x] Roteiro obrigatório: joga as 7 eras a cada versão, numa aba só
- [x] Rodadas 1 e 2 feitas (orientação, pés, ataques, chefe inteiro)
- [ ] Medir a altura dos pés quadro a quadro em todas as eras
- [ ] Ultimates uma a uma, troca de era, derrota, projéteis dos chefes
- [ ] O som: o QA mede por script, mas quem precisa ouvir é você

## 8. O que eu preciso de você

- [ ] Página de aprovação: referências do Submundo e do Celestial, os 5 pets e a Kaia sem fundo verde (aba "Antes × Depois (V2)" mostra o reprovado ao lado do novo)
- [ ] Canvas: votar a 04b Batalha em tela cheia
- [ ] Fechar à mão a aba "CALIBRACAO - NAO USAR NEM FECHAR" no Chrome
- [ ] Ouvir os sons dentro do jogo

## 9. Créditos de arte

- Você comprou +500. Saldo conferido pela arte: ~580.
- Já feito: inimigos das 7 eras (21) e as 7 ultimates animadas.
- Fila (~340): 7 espaços (~48) → Kaia (~14) → 5 pets (~78) → roupas do Kael por era (~98) → 2 montarias (~30); cenários de Pólvora, Industrial, Moderna e Futurista (~72) em paralelo.
- Sobra prevista: ~320 para refazer o que você reprovar e para a Kaia completa.

## 10. Play Store (Android)

- [x] Caminho: Capacitor (o mesmo jogo web vira app Android)
- [x] Conta do Google Play Console no nome da EMPRESA
- [x] App de teste instalado no seu S24 Ultra: abre em 3 a 5 s, batalha bem fluida, tela cheia, botão voltar e save funcionando (ainda é a versão de tela antiga)
- [ ] Você: criar a conta de organização no Play Console (taxa única de 25 dólares; o Google pede o número D-U-N-S da empresa, que é gratuito e pode levar alguns dias)
- [ ] Política de privacidade (eu escrevo; precisa de um link público)
- [x] Backend próprio: NestJS + Postgres (líder: fps-30, em Desktop\fps-server)
- [x] Plano do backend pronto (reports/backend-plano.md). Hospedagem APROVADA: opção A na AWS (EC2 t4g.small em São Paulo, servidor + banco juntos, backup diário, ~R$ 120-155/mês; banco vai para RDS quando passar de 2-5 mil jogadores/dia). Moderação do chat: você ou alguém da empresa, com painel de denúncias
- [ ] Você: passar o acesso à AWS quando for subir, e um Postgres remoto de desenvolvimento (o disco do PC não aguenta rodar o banco aqui)
- [ ] Você: parecer de um advogado sobre chat com menores (ECA Digital e LGPD) antes de ligar o chat livre
- [ ] Login: convidado + Google/Apple; salvar progresso na nuvem
- [ ] Chat com proteção: filtro de palavrão e dados pessoais, denunciar, bloquear, silenciar; menores de 13 só frases prontas
- [ ] Ranking, arena, eventos e leilão no servidor; verificação de compras
- [ ] Compras pela Google Play (VIP, Passe, skins, montarias)
- [ ] Ficha da loja: textos, imagens, classificação etária, público-alvo (menores: regras de família e ECA Digital), segurança de dados
- [ ] Teste fechado e publicação
