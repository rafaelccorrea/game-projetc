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
Atualização (~16h40): BatalhaTelaCheiaV2 recopiada com as BARRAS DE VIDA E ENERGIA ACIMA DA CABEÇA DO KAEL (aprovado; entra na v0.12.2). Prologo (19, V2) APROVADO: 4 cenas, entra antes da criação do personagem, pulável; arte em assets/map/. OfertaInicial reconfirmada (sem preço riscado). Em voto: missão guia, Passe com rolagem contínua, Arena, Eventos, Leilão.
Leilao (25) APROVADO: entra no MENU com selo "Em breve: abre com o online" até o servidor existir; backend com a fps-30. Fila de painéis, depois dos já listados.
Atualização (noite de 2026-11-12): APROVADOS 23 Arena V2 (7 ligas, luta épica; prêmios só com servidor), 24 Eventos V2 (trilha, chefe do evento, loja; lógica de eventos da fps-30), 27 Torneio do Poder (28 territórios, 15 contra 15: o protótipo mostra 9 e 5; vale a spec da fps-e2). Todos DEPOIS do lançável básico. Guilda (26) REPROVADA.
Atualização (noite, após o reinício): APROVADOS 01b TÍTULO NOVO (TituloV2; o dono ainda escolhe o logo entre TituloV2A/B/C: aguardar), 28 BEM-VINDO DE VOLTA (BemVindo; o botão "VIP: dobro" SAI: VIP já ganha dobro offline, mesmo que o arquivo ainda o desenhe), 29 NOME DO JOGADOR (NomeJogador), 26 GUILDA V2 (Guilda; tela, prêmios/trocas só com servidor; fica com o QA depois das 6 telas). 30 Códex REPROVADO (não implementar). Equipamento recopiado (versão das 17:06; a aba Aparência está em voto).
