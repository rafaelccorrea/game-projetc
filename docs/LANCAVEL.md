# Eonbound — o que falta para o "lançável" (fps-c9, 2026-11-12)

Ordem do dono (via PO): finalizar com o que já foi aprovado; nada de recurso novo sem o PO pedir.
Cada linha = uma versão pequena com APK no celular do dono. "Estado" diz o que já existe HOJE.
Nada abaixo foi medido em tempo: a unidade é a versão, não o relógio.

## A. Jogo com a arte e as telas já aprovadas
| Versão | Conteúdo | Estado hoje |
|---|---|---|
| 0.12.2 | Desempenho no celular (56 → meta 100+ quadros/s), respiro Kael × inimigos, cabeçalho, barras de vida/energia sobre o Kael, apagar layout antigo, ajustes de Equipamento/Invocar/Loja/Passe/Progresso ("Equipar melhor", arrastar) | em andamento; painéis escritos, não conferidos |
| 0.12.3 | Subir de nível novo, cenário da era 4, inimigo parado (opção A), morte do Kael v2, Devorador limpo (já no disco) | arte aprovada; código a fazer |
| 0.12.4 | Forja e Configurações novas (com Exportar/Importar progresso) | escritas, desligadas, não vistas rodando |
| 0.12.5 | Kaia jogável (só garota; mesmos números do Kael) | arte aprovada; código a fazer |
| 0.12.6 | Pistola nas eras 3, 5 e 6 (era 4 com pose de espada) | arte aprovada; código a fazer |
| 0.12.7 | Pets: ovo no nível 20, pet na batalha, tela 17b (5 espécies das eras 0-4; estágios 2 e 3 dependem de arte) | lógica pronta e desligada; tela escrita; batalha a fazer |
| 0.12.8 | Montarias Lobo e Grifo + raridade pela borda e cor (drop, mochila, lojas) | lógica pronta e desligada; raridade escrita e desligada |
| 0.12.9 | Telas que faltam: 11 Troca de era, 18 VIP, 10 Vitória/Derrota, 12 Ranking (bots, "prêmios quando o online abrir"), 13 Instâncias, 14 Torre | módulos prontos; telas a fazer (podem virar 2 versões) |
| 0.12.10 | 01 Título, 02 Login (convidado), 19 Prólogo, 03 Criação; 21 Perfil e Coleção; 22 Oferta (sem compra real) | protótipos aprovados; código a fazer |

## B. Progressão final
| Versão | Conteúdo | Estado hoje |
|---|---|---|
| 0.13.0 | Curva de 9 eras + 100 fases × 4 dificuldades + Mapa das Eras (20) + qualidade/fusão/item adormecido + números abreviados + prêmios por marco | números e lógica prontos e desligados; mapa e ligação a fazer; NADA medido no jogo |
| 0.13.1 | Calibração medida no celular dos primeiros dias (eras 0-2) e ajuste | a fazer; eras 3-8 ficam por conta |
| 0.13.2 | Eras 7 e 8 (inimigos, ultimates, cenários, mapas) | inimigos/ultimates aprovados; CENÁRIOS das eras 5-8 não existem ainda |

## C. Obrigatório para a loja
| Versão | Conteúdo | Depende de |
|---|---|---|
| 0.14.0 | Carregar só a arte da era atual e o resto sob demanda (hoje 219 MB de APK e ~1 GB de memória) | decisão: onde ficam os pacotes (dentro do AAB como "asset packs" da Play ou em servidor) |
| 0.14.1 | Id definitivo, ícone e abertura finais, AAB assinado, teste interno na Play | dono: id, chave de assinatura no console dele |
| 0.14.2 | Compras reais (Oferta, VIP, Passe Premium, diamantes) com Google Play Billing | backend da fps-30 no ar (validação de recibo) + produtos criados pelo dono no console |
| — | Ficha da loja, política de privacidade, classificação etária, declaração de compras; revisão jurídica (ECA Digital, compras, chat) | dono / advogado |

## D. Fica para atualização depois do lançamento (por ordem do dono ou por depender de servidor)
Pets do Submundo/Celestial/Prismático; Kael crescendo (3 fases novas precisam de todas as animações); chat; ranking e arena online; leilão e Cofre do Mercado; guilda; eventos e arena (protótipos reprovados, em refação); login Google/Apple e save na nuvem (dependem do backend).

## E. Riscos que podem atrasar
1. PC sem espaço (1,3 GB) e com pouca memória: cada APK precisa de ~1 GB livre; já derrubou o servidor local e uma compilação.
2. Sem QA no navegador: a conferência antes do celular é só a dos próprios agentes; defeitos vão aparecer no aparelho do dono.
3. A curva de 6 meses não se mede jogando: só os primeiros dias terão medida real.
4. Cenários das eras 5, 6, 7 e 8 no padrão novo (camadas vivas) ainda não foram produzidos nem votados; hoje as eras 5 e 6 usam o fundo antigo.
5. Compras reais e save na nuvem exigem o servidor hospedado (conta e custo mensal do dono).

## Perguntas ao PO
(a) O Kael que cresce (garoto → adolescente → adulto → lendário) entra no lançamento ou vira atualização? Só há imagens paradas; faltam todas as animações de 3 fases.
(b) Lançar SEM servidor (save só no aparelho + Exportar/Importar; ranking com bots; sem compras reais validadas) ou o servidor mínimo (login convidado, save na nuvem, validação de compra) é condição do lançamento?
(c) Cenários das eras 5-8: produzir no padrão vivo (créditos + votos) antes do lançamento, ou lançar com o fundo antigo nessas eras?

## Respostas do PO (2026-11-12)
(a) O Kael que cresce ENTRA no lançamento: animações do adolescente/adulto/guerreiro em produção na fps-ff (crédito separado); integrar quando chegarem (0.13.x).
(b) SERVIDOR MÍNIMO é condição para lançar: login convidado, save na nuvem e validação de compra (oferta, VIP, passe, gemas). O PO pede ao dono o acesso à AWS e o banco. Ranking/arena/leilão/guildas online podem vir em atualização.
(c) Cenários vivos das eras 5, 6, 7 e 8: PRODUZIR antes do lançamento, uma era por vez, cada uma para voto antes de ligar; ~18 créditos por era (~72 no total).
Total de ~16 versões aceito.

## CORREÇÃO DO DONO (2026-11-12, noite): nada fica para depois do lançamento, exceto a Bênção de equipamento
Entram NO LANÇAMENTO (a arte está na fila da fps-ff):
- KAIA nas 4 fases (como o Kael), não só garota.
- 6 MONTARIAS (Básica, Rara, Mítica, Lendária incluídas; Lobo e Grifo já aprovados).
- 8 PETS + Prismático (inclui Submundo, Celestial e a Raposa de cristal), com os 3 estágios.
- Aparência em camadas (arma, chapéu, colete, botas, asa, cosméticos), Arena, Eventos, Torneio, Leilão, Guilda, chat: conforme os protótipos forem aprovados e o servidor existir.
A seção D ("fica para atualização") deixa de valer, exceto a Bênção de equipamento.

### Fila de versões ajustada (cada linha = uma versão com APK; a ordem das de arte depende da chegada e do voto da arte)
| Versão | Conteúdo |
|---|---|
| 0.12.3 | (feita) pistola eras 3/5/6, 2 comuns visíveis, liberação por nível, level up novo |
| 0.12.4 | cenário era 4, inimigo parado, morte do Kael v2, revólver da era 4, Forja e Configurações, ícone do Leilão, avô do Prólogo guardado |
| 0.12.5 | Kaia jogável (fase garota) |
| 0.12.6 | Pets: ovo no nível 20, pet na batalha, tela 17b, evolução 30/60 (5 espécies) |
| 0.12.7 | Montarias Lobo e Grifo + aura por estrela + raridade pela borda e cor |
| 0.12.8-9 | Telas: Troca de era, VIP, Vitória/Derrota, Ranking (bots), Instâncias, Torre |
| 0.12.10 | Título, Login convidado, Prólogo (com o avô), Criação, Perfil, Oferta |
| 0.13.0 | Curva de 9 eras + 100 fases × 4 dificuldades + Mapa + qualidade/fusão + números abreviados |
| 0.13.1 | Calibração medida (primeiros dias) |
| 0.13.2 | Kael nas 4 fases (adolescente, adulto, guerreiro) + evolução |
| 0.13.3 | Kaia nas 4 fases |
| 0.13.4 | Aparência em camadas (aba Aparência; chapéus, máscaras, asa, cosméticos) |
| 0.13.5 | Eras 7 e 8 + cenários vivos das eras 5-8 (cada um após o voto) |
| 0.13.6 | Pets do Submundo/Celestial/Prismático + 4 montarias restantes |
| 0.14.0 | Carregar arte por era / sob demanda (obrigatório: o pacote cresce muito com 2 heróis × 4 fases) |
| 0.14.1 | Camada de API + servidor mínimo (login convidado, save na nuvem, validação de compra) |
| 0.14.2 | Compras reais (Billing), id definitivo, AAB assinado, teste interno |
| 0.14.3+ | Online: Arena, Eventos, Torneio, Leilão/Cofre, Guilda, chat (cada um com protótipo aprovado e servidor) |
Total estimado: ~22 a 25 versões. O que mais pesa no prazo agora é ARTE (2 heróis × 4 fases × todas as animações, 6 montarias, 8 pets × 3 estágios, 4 cenários) e o SERVIDOR; o código acompanha.
Risco novo: tamanho e memória do app (hoje 188 MB de APK e ~770 MB de memória com 1 herói em 1 fase): sem carregar por era/fase, não cabe em celular comum.

Decisão do PO: fila de ~22-25 versões aprovada; o CARREGAMENTO SOB DEMANDA (só era, herói e fase em uso) é ANTECIPADO para logo depois da curva (0.13.1), antes do Kael nas 4 fases.

Reordenação (PO, a pedido do dono, para ele VER o jogo): 0.12.4 = Prévia da arte + Modo dono (app de teste) + raridade visível na arma + revólver; 0.12.5 = pets; 0.12.6 = montarias; 0.12.7 = cenário era 4, parado, morte do Kael, Forja, Configurações; 0.12.8 = Kaia garota; telas em seguida. O restante da fila não muda.
