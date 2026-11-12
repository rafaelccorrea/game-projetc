# Agente 1 - Marca, Tela Inicial e Cenários

## Pesquisa (curta)
Referência de gênero (Legend of Mushroom): navegação por ícones na barra inferior, ícones laterais (roleta), personagens "fofos mas ferozes", UI chamativa e saturada. Nenhuma arte/nome copiado.

## Nome
Escolhido: **Eonbound** — "Atravesse as eras. Forje sua lenda." (assets/brand/name.json)
Candidatos: 1) Eonbound (eon + bound, curto, sem resultados na busca Steam/Play); 2) Chronoscarf (alusão ao cachecol); 3) Erawalker; 4) Kael's Eras; 5) Timebrave.
Obs.: checagem rápida só por busca web (Steam/Play); sem verificação formal de marca.

## Arquivos gerados
- assets/brand/name.json, logo.png (transparente, 1024px de largura), title_bg.png (9:16, 1536x2752, sem texto)
- assets/ui/coin.png, gem.png, chest.png, pass.png (256x256, transparentes)
- assets/bg/era0..era6.png (3:2, ~2528x1696; sem personagens)

## Notas / pendências
- Remoção de fundo do Higgsfield esbarrou no limite de 8 jobs simultâneos (compartilhado com outros agentes); usei recorte local (flood-fill do branco + redimensionamento). Ícones e logo conferidos visualmente: bordas limpas.
- Linha do chão dos cenários fica em torno de 72-76% da altura (ex.: era4 ~76%); conferir/ajustar no engine se necessário.
- Cenários são grandes (4-7 MB cada); o engenheiro pode redimensionar/converter para JPG/WebP.
- Só verifiquei visualmente era1, era4, title_bg, logo e chest; os demais foram baixados mas não inspecionados um a um.

## Créditos
Saldo inicial 930,96; saldo final 812,96 (queda de 118 também reflete gastos simultâneos de outros agentes). Custo medido: 2 créditos por imagem de teste; meus 13 gerações devem ter custado bem menos que o teto de 150.

## Revisão (ajustes pedidos)
- era0 regenerada (sem linhas-guia, chão de terra/grama texturizado, vulcão, samambaias roxas, ossos). Custo ~2 créditos.
- assets/bg/meta.json gravado com groundY medido por inspeção visual (topo da faixa de chão): era0 0.77, era1 0.64, era2 0.78, era3 0.70, era4 0.76, era5 0.68, era6 0.67. Personagens: groundY + ~0.05.
- Correção: a linha do chão NÃO está em 72% em todos; usar meta.json.
