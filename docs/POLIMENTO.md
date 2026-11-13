# POLIMENTO: fila de bugzinhos visuais (ordem do dono, 13/11, 02h)

Nas palavras do dono: "Tá jogável, já tá bem avançado. Só que tem muito bugzinho... a arma em cima da montaria sai da mão, ela flutua... imagem de arma que não aparece... tudo tem que ter imagem, tudo tem que ser polido."

## Regra geral
- **Tudo tem imagem.** Onde aparece arma, aparecem também montaria e pet com a arte real (e não texto, ícone genérico ou emoji). Isso vale para oferta, loja, passe, invocação, correio, prêmios, eventos, arena, perfil e coleção.
- Nada flutua: arma na mão (a pé e montado), asa nas costas, pet no chão, montaria com as patas no chão.
- Pet, montaria, asa e aura nunca somem do Kael, em nenhuma tela.

## Quem faz
- **QA = caçador de polimento.** Varre tela por tela na aba 2 (Modo dono, níveis 1/20/38/50/70, com e sem montaria/pet/asa). Cada achado vira uma linha abaixo, com um print em `reports/prints/pol_<n>.png`.
- **Arte: um agente só de polimento de imagem.** Corrige o que é imagem (arma solta na montaria, arte faltando, recorte, âncora). Primeiro tenta por código; o que custa crédito vai antes para o PO.
- **Engenheiro:** corrige o que é código (posição, camada, imagem que não carrega).
- **PO:** prioriza, cobra e mostra ao dono.

## Achados (formato: `- [ ] P<n> · tela · o que está errado · dono da correção`)
- [ ] P1 · Oferta de 1ª compra · não mostra a imagem do Lobo de guerra (montaria) nem do pet; tem que mostrar tudo com a arte real · Engenheiro/Servidor (p_offer)
- [ ] P2 · Batalha montado · a arma sai da mão e flutua em cima da montaria · Arte (encaixe nas folhas montadas) + Engenheiro
- [ ] P3 · Batalha montado · a arma não aparece na mão com o Kael montado (QA confirmou: não é arquivo faltando; 26 telas sem imagem quebrada) · Engenheiro junto com a asa montada
- [ ] P4 · Vitória (e outras cenas) · o pet some; montaria/asa/aura também precisam aparecer · Engenheiro (drawHeroFull)
- [ ] P5 · Todas as cenas · a asa fica atrás da cabeça em vez das costas · Engenheiro (âncora das costas da Arte)
- [ ] P6 · Vitória · diz "Javali" quando o chefe é o Rex Furioso (nome do chefe errado) · Engenheiro
- [ ] P7 · Tela de Montarias · a Serpe não está na lista (5 de 6) · Engenheiro
- [ ] P8 · Instância · o texto de tempo esgotado é igual ao da derrota · Engenheiro
- [x] P9 · Oferta 24h · usa o ícone de Eventos; precisa de ícone próprio · Arte — FEITO: assets/icons/menu/offer.png (presente + cronômetro) e ícones dos eventos assets/icons/events/{worldboss,goldenhour,invasion,weekend,pethunt,forge}.png
- [ ] P10 · Instâncias · tela ainda desligada (fluxo 24/26) · Engenheiro (painéis)

## Achados do QA (varredura de 13/11, aba 2, Modo teste nível 60; prints em reports/prints/)
- [ ] P11 · Batalha montado (grifo) · CONFIRMA P2/P3: o Kael montado não mostra a arma na mão (só um brilho); print reports/prints/pol_1_montado_asa_arma.png · Arte (folhas montadas com arma) + Engenheiro
- [ ] P12 · Batalha a pé e montado · CONFIRMA P5: a asa nasce na altura da CABEÇA/ombros (asas abertas atrás da cabeça), não nas costas; prints pol_1 e pol_2_asa_na_cabeca_a_pe.png · Engenheiro (âncora das costas, vinda da Arte)
- [ ] P13 · Vitória (lobo + asa) · CONFIRMA P4: o pet (mamute) some na cena da vitória; a montaria e a asa aparecem (asa também na cabeça); print pol_3_vitoria_sem_pet_asa_cabeca.jpg · Engenheiro (drawHeroFull)
- [x] P14 · Loja (cartão OFERTA) · cortava o texto em 288 px · CORRIGIDO e conferido em 288 e 390 px (QA)
- Conferido SEM defeito (varredura de 26 telas): nenhuma imagem quebrada nas telas Equipamento, Invocar, Loja, Passe, Forja, Pets, VIP, Ranking, Config., Torre, Missões, Instâncias, Perfil, Códex, Guilda, Chat, Arena, Eventos, Torneio, Mapa, Correio, Montarias, Aparência, Leilão, Oferta, Práticas; nenhum emoji nelas; todos os arquivos assets/weapons/era0..8_t0..2.png, assets/hero/era0..8_t0..2.png, assets/enemies/era0..8_boss.png e assets/map/era0..8.jpg existem.
- [ ] A VARRER (próxima passada): arma por era/raridade em campo na batalha (eras 1-8), Kael sem montaria/pet/asa em cada era, pet sob a montaria, Oferta (P1) e Invocar com a arte, Passe/Correio com imagem de prêmio, níveis 1/20/38/50/70 de verdade (a varredura de hoje foi num save de nível 60).
- [ ] P15 · Batalha montado (cavalo, e conferir nas 6 montarias) · em alguns quadros aparece um BRAÇO saindo de trás do cavalo, sem sentido (visto pelo dono durante o teste do engenheiro) · Arte (limpar os quadros das folhas montadas) + Engenheiro (camada/ordem de desenho)

## Padrão de polimento FINO (ordem do dono: "o polimento tem que ser bem fino")
- Conferir QUADRO A QUADRO cada animação montada e a pé (folha de contato ampliada), e não só o print parado.
- Nada de parte do corpo sobrando, duplicada, cortada ou atrás de onde não deveria (braço, perna, arma, cabelo, asa).
- Nada piscando entre os quadros e nenhum resto de recorte (verde, magenta, contorno escuro).
- A arma sempre na mão, a asa sempre nas costas, os pés e as patas sempre no chão.
- [ ] P16 · Bem-vindo de volta (ganho offline) · mostrar TUDO que ganhou no tempo fora antes de coletar: tempo fora, ouro, XP e níveis subidos (Nv 58 → 60), itens por raridade com imagem, ração/pedras/fragmentos com ícone; botão Coletar com os números contando · Servidor (p_intro)
