# Eonbound — ESTEIRA URGENTE (tudo que está aprovado precisa estar FUNCIONANDO)

Ordem do dono (12/11/2026): "pegar todos os pontos que faltam e pôr na esteira com urgência; tudo que está aprovado das artes, tudo, tem que estar funcional". Só a Bênção de equipamento fica para depois do lançamento.
Cada linha tem DONO. Entregas pequenas: cada bloco pronto = commit + APK no celular. Protótipos aprovados em docs/proto/ (canvas). Arte aprovada em assets/ (página de aprovação).

## ENGENHEIRO (fps-c8) — com seus 2 agentes
**Agora (v0.12.4)**
- [ ] Forja ligada e funcionando (fortalecer +0..+15, nível, transformar), igual ao protótipo 15
- [ ] Configurações novas (protótipo 09; linhas sem função = "em breve"; sem Auto/Manual; exportar/importar progresso)
- [ ] Nenhum botão visível sem ação; save antigo não perde o que já tinha (Passe etc.)
- [ ] Revólver (era 4) ligado; brilho/contorno da raridade na arma; aviso de drop sem cobrir o header
- [ ] FB_UNLOCK lendo do Sys.level (fonte única)
- [ ] Modo dono + Prévia da arte (só no app de teste)
**Em seguida, uma versão por bloco**
- [ ] Pets V2 (17b): ovo no nível 20 com animação de chocar (79/21), pet na batalha (5 pets × 3 estágios, atk1 com efeitos por código), evolução 30/60, tela de pets, ração
- [ ] Montarias: Kael montado no lobo e no grifo (galope, parado, golpe), aura por estrela, espaço de montaria, oferta de 1ª compra com o lobo
- [ ] Raridade pela borda e cor em todo lugar (drop no chão com brilho/feixe, mochila, equipamento, loja, invocação) + sons gem/legendary
- [ ] Kaia jogável (garota) na criação
- [ ] Morte nova do Kael (cai de joelho, de bruços, espada cai, poeira, escurece)
- [ ] Inimigo parado entre golpes (opção A)
- [ ] Cenário vivo da era 4 (Industrial) ligado; era 5 (rodada 2 de acabamento) e depois eras 6, 7, 8
- [ ] Asas (demoníaca, anjo) no espaço de asa (nível 50); auras maligna/celestial nas eras 7-8
- [ ] Aparência em camadas: chapéus por era, colete/botas por máscara, óculos/máscaras, modo Itens/Skin, ocultar peça (aba Aparência do protótipo 05)
- [ ] Kael nas 4 fases (garoto 1, adolescente 22, adulto 35, guerreiro 70) com animação de evolução
- [ ] Subir de nível novo (já) e evolução de fase
- [ ] Telas: Título/Login/Prólogo (com avô)/Criação/Perfil (21)/Oferta (22)/Bem-vindo de volta/Nome do jogador (após voto)/Códex (após voto)
- [ ] Mapa das Eras (20) + 100 fases × 4 dificuldades + curva de 9 eras (Sistemas) + qualidade/fusão + item adormecido + números abreviados
- [ ] Eras 7 (Submundo) e 8 (Celestial): inimigos, chefes, ultimates, mapas
- [ ] Carregamento sob demanda (só era/herói/fase em uso) — antes das 4 fases do Kael
- [ ] Missão guia na tela (após voto), Passe com rolagem (após voto)
- [ ] Liberação por nível com "NOVO!" (feito na 0.12.3) — manter

## QA (ajudante do engenheiro, arquivos próprios js/p_*.js)
- [ ] VIP (18) → Troca de era (11) → Torre (14) → Instâncias (13) → Ranking animado (12) → Vitória/Derrota (10)
- [ ] Depois: Arena (23), Eventos (24), Torneio (27), Leilão (25), Guilda (26, após voto) como telas (prêmios só com servidor)
- [ ] Conferir cada APK no celular (sem mexer no save do dono)

## SISTEMAS (fps-69)
- [ ] Curva de 9 eras (100 fases × 4 dificuldades) pronta para ligar + DEF dos inimigos
- [ ] Qualidade/fusão/adormecido, Pets (Sys.pet v3/v4), Montaria (Sys.mount), Oferta (Sys.offer), Aparência (Sys.appearance), Kael por fase (gatilhos) — prontos para o engenheiro ligar; apoio na integração
- [ ] Guildas (Sys.guild) atrás de chave; Prismático (fragmentos)

## SERVIDOR (fps-6f)
- [ ] Servidor mínimo para lançar: login convidado + Google, save na nuvem, compras Google Play (oferta, VIP, passe, gemas, skins) — pronto para subir quando o dono passar AWS + banco
- [ ] Camada de API no jogo (com o engenheiro)
- [ ] Depois: arena, ranking, eventos, torneio, leilão, guildas, chat (frases prontas)

## ARTE (fps-75)
- [ ] 18 armas por raridade (Raro e Mítico das eras 0-8) + prévia das 45
- [ ] Montarias Pônei, Cavalo de guerra, Mítica (2 opções antes), Serpe dourada (Kael montado + aura)
- [ ] Kaia adolescente, adulta e guerreira (todas as animações)
- [ ] Pets do Submundo, Celestial e Prismático animados (3 estágios, formato econômico)
- [ ] Prévia da aparência em camadas (3 combinações + tudo oculto)
- [ ] Apoio aos cenários vivos das eras 5-8

## PO
- [ ] Levar ao dono para voto: 01b Título (logo A/B/C), 26 Guilda V2, 28 Bem-vindo, 29 Nome, 30 Códex, Aparência, missão guia, Passe com rolagem, e cada arte nova
- [ ] Push no GitHub a cada versão
