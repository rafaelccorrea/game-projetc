# FORÇA-TAREFA: TODAS AS TELAS NO JOGO (ordem do dono, 12/11/2026, 21h)

"Preciso de todas as telas no jogo... faz uma força-tarefa com tudo que você tem."
As 6 sessões escrevem telas AO MESMO TEMPO. O engenheiro só liga e confere.

## REGRAS DE SEGURANÇA (depois da perda de 12/11, 21h: um `git checkout -- .` apagou o trabalho não salvo de todas as sessões)
- **(a) NENHUMA sessão roda comando de git que altere arquivos**: nada de checkout, restore, reset, stash, clean, rebase, pull ou merge. Pode usar só status, diff e log. Para desfazer, edite o próprio arquivo. Quem faz commit é só o fps-c8 (Engenheiro); o push é do PO.
- **(b) O fps-c8 commita a cada passada de agente e a cada tela entregue**, não só a cada versão. A perda máxima passa a ser de minutos.
- Não editar arquivo de outra sessão. Se precisar mudar algo nele, peça ao dono do arquivo.

## Regras para todos (contrato igual ao js/p_vip.js)
- Cada tela num arquivo próprio `js/p_<nome>.js`, que nasce DESLIGADO (`PANEL_ON.<nome>`), usando `Panels.add(name, def)`. Não mexa em arquivo de outra pessoa.
- Protótipo aprovado: `docs/proto/<Nome>.dc.html` é a fonte. Igual ao protótipo, com a arte real de `assets/`, sem emoji e sem texto de desenvolvimento.
- Regras e números vêm só de `Sys.*` (js/sys/). Se faltar um dado, peça ao fps-69 (Sistemas) e siga com o resto. Nenhum botão sem ação: o que depende do servidor diz "em breve".
- O FC que sobe/desce usa a função única de FC (Sys.stats) quando o engenheiro entregar.
- Ao terminar: confira no navegador (`?debug=1&painel=<nome>`), faça um print em `reports/prints/ft_<nome>.png` e mande ao fps-c8 E ao PO numa linha: arquivo, chave, o que não foi testado.

## Quem faz o quê
| Sessão | Telas (protótipo) | Arquivo |
|---|---|---|
| ENGENHEIRO fps-c8 | Fechar a v0.12.7 já (montarias), depois ligar EM LOTE tudo que chegar; FC na tela; ultimate pela arma; Passe com rolagem; missão guia; aba Aparência | arquivos dele |
| QA | 30 Códex V2, 31 Correio, 32 Chat (frases prontas), 26 Guilda V2 | p_codex, p_mail, p_chat, p_guild |
| SISTEMAS fps-69 | 23 Arena, 24 Eventos, 27 Torneio do Poder + módulo Atividade/Conquistas | p_arena, p_events, p_tourney |
| SERVIDOR fps-6f | Fluxo de entrada: Título (logo B), Login convidado/Google, Prólogo com o avô, Criação (Kael/Kaia), Nome do jogador, Bem-vindo de volta | p_intro |
| ARTE fps-75 | 20 Mapa das Eras (100 fases × 4 dificuldades), 21 Perfil e Coleção | p_map, p_profile |
| PO | Conferir cada print contra o protótipo antes de ir ao dono; levar ao dono; push no GitHub | — |

Já escritas (só ligar): p_tower, p_era, p_inst, p_rank, p_missions, p_mounts, p_offer, p_auction, p_pets, p_vip, p_forge, p_cfg.

## Meta
Todas as telas escritas hoje. O engenheiro liga em lotes (v0.12.8 = tudo que estiver escrito), e a v0.12.8 sai com o máximo de telas ligadas.
