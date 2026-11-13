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
- [ ] P3 · Vários lugares · imagem de arma que não aparece · QA levanta onde; Engenheiro corrige
- [ ] P4 · Vitória (e outras cenas) · o pet some; montaria/asa/aura também precisam aparecer · Engenheiro (drawHeroFull)
- [ ] P5 · Todas as cenas · a asa fica atrás da cabeça em vez das costas · Engenheiro (âncora das costas da Arte)
- [ ] P6 · Vitória · diz "Javali" quando o chefe é o Rex Furioso (nome do chefe errado) · Engenheiro
- [ ] P7 · Tela de Montarias · a Serpe não está na lista (5 de 6) · Engenheiro
- [ ] P8 · Instância · o texto de tempo esgotado é igual ao da derrota · Engenheiro
- [ ] P9 · Oferta 24h · usa o ícone de Eventos; precisa de ícone próprio · Arte
- [ ] P10 · Instâncias · tela ainda desligada (fluxo 24/26) · Engenheiro (painéis)
