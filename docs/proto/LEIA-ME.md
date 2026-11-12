# Protótipos do canvas (cópia de 2026-11-12 ~15:30 da sessão do PO)
Fonte: https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba. Os .dc.html não abrem sozinhos (dependem do runtime do canvas):
servem para LER medidas, cores, textos e animações. Para print, abrir o canvas numa aba só e fechar.

| Arquivo | Tela | Estado |
|---|---|---|
| Carregamento | 00 | aprovada |
| Login | 02 | aprovada |
| CriarJogador | 03 Intro/criação | aprovada |
| Batalha | 04 (com abas) | aprovada, SUBSTITUÍDA pela tela cheia |
| BatalhaTelaCheia | 04b | aprovada (geometria) |
| BatalhaTelaCheiaV2 | 04c | aprovada: LAYOUT FINAL dos ícones (menu agrupado) |
| Equipamento | 05 | aprovada |
| Invocar | 06 | aprovada |
| Loja | 07 | aprovada |
| Passe | 08 | aprovada |
| Configuracoes | 09 | aprovada (refeita) |
| ResultadoChefe | 10 Vitória/Derrota | aprovada (refeita) |
| TrocaEra | 11 | aprovada |
| Ranking | 12 | aprovada (versão animada) |
| Instancias | 13 | aprovada (refeita) |
| Torre | 14 | aprovada (refeita) |
| Forja | 15 | aprovada |
| Progresso | 16 Práticas e Títulos | aprovada |
| VIP | 18 | aprovada |
| Pets | 17 | REPROVADA: não implementar |
| Prologo | 19 | EM VOTO: não implementar |
| MapaEras | 20 | EM VOTO: não implementar |
| Main | 01 Título | aprovada |

Atualização 2026-11-12 (tarde): MapaEras (20, V2 com arte: camada mundo + camada era com 100 fases e abas Fácil/Médio/Difícil/Hell) APROVADA: entra junto com a curva nova (v0.12.1+), não antes. Perfil e Coleção (21, responsiva) APROVADA: fila de telas, depois das já aprovadas. Prólogo (19): conferir o voto com o PO antes de usar.
PetsV2 (17b) APROVADA: entra com o pacote de pets (ovo no nível 20 + pet na batalha + tela 17b). A Pets antiga (17) segue reprovada.

Atualização 2026-11-12 (~16h+): TODOS os protótipos aprovados foram convertidos pelo PO para o LAYOUT NOVO (sem barra de baixo, header da V2, botão voltar, responsivos) e recopiados aqui: Equipamento (com Equipar melhor + arrastar), Invocar, Loja, Passe, Forja, Progresso, VIP, Torre, Instancias, Ranking, Configuracoes (SEM Auto/Manual), ResultadoChefe, TrocaEra, Main, CriarJogador. Forja e Progresso são SUBTELAS do Equipamento (o voltar delas leva ao Equipamento). Esta cópia substitui as anteriores.
OfertaInicial (22, Oferta de primeira compra) APROVADA: fila de painéis depois de Equipamento/Invocar/Loja/Passe; lógica em Sys.offer (desligada); pagamento real com a fps-30.
