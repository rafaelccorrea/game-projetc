# Eonbound — passagem para o PO (escrito pela coordenadora fps-c9)

## Regra do dono
O dono fala só com o PO. O PO passa as tarefas. As sessões se autogerenciam e tiram dúvidas entre si (SendMessage),
sem levar perguntas ao dono. Desenvolvimento CONGELADO: nada novo é desenvolvido até o PO aprovar (com o design).

## Quem é quem
| Sessão | Papel | Arquivos |
|---|---|---|
| fps-c9 | Coordenação técnica; engenheiro do jogo | docs/CONTRATO_*.md, docs/PARA_O_PO.md, index.html, js/battle.js, ui.js, meta.js, fallback.js (via engenheiro), assets/bg, brand, ui, icons, pwa |
| fps-0b | QA | reports/qa.md, reports/qa_proposta_vip_baus_instancias.md |
| fps-30 | Correções/especificação | reports/qa-fixes.md, reports/spec-loot-bau-instancias.md, js/sys/loot,chest,instances |
| fps-e2 | 2º dev | reports/detalhes.md, reports/sys-estado.md, js/sys/fc,practice,titles,tower |
| fps-98 | Design/protótipos de tela; o PO é um subagente dela (tarefas e aprovações vêm por ela) | https://claude.ai/artifact/PkyVkM4ZUtaob6Nursh6ba |
| fps-ff | Dona de animação, skins e som | assets/hero, enemies, weapons, fx, audio, anim; js/audio.js, js/anim.js; reports/anima.md, rig.md, fx.md, audio.md; test/rig, test/anim |

## Estado do jogo (http://localhost:8080; debug em reports/agente5-engenheiro.md)
Feito: 7 eras com arte 2D (herói 21 sprites, armas 21, inimigos 21, cenários 7), tela inicial, horda, tela cheia sem rolagem,
3 ataques por arma (básico, especial, ultimate) com ícones e efeitos, mão calibrada na arma, loot, raridades, invocação, skins,
missões, passe, loja de moedas e diamantes, tutorial inicial, 44 arquivos de som.
Não testado: som dentro do jogo, fim do tutorial, ganhos offline, partes da loja, troca de era e derrota com horda.
Módulos escritos e NÃO ligados ao jogo: js/sys/ (loot, baú, instâncias, FC, práticas, títulos, torre) com testes em test/sys/.
Créditos Higgsfield: ~628.

## Bloqueadores e decisões para o PO
1. ANIMAÇÃO (reprovado pelo dono): personagens são imagens paradas; correm "pulando". Precisa de arte animada.
   Opções: A recortes com ossos; B quadro a quadro a partir de vídeo; C híbrido. Recomendação: prova A com 1 herói + 1 inimigo.
2. VIP 1-9 e montaria dando poder + tier "Mítica" (VIP9): inverte o "sem pay-to-win" original. Simulação: VIP com +30% termina
   em ~18 dias contra ~78 do grátis. Decidir a regra de monetização.
3. Loot box paga: docs/RECOMENDACOES.md aponta o ECA Digital (Lei 15.211/2025, art. 20) vedando caixas de recompensa pagas
   para menores; afeta "Invocar skin" e pacotes. Leitura de leigo: validar com advogado.
4. Pay-to-win já existente: invocar equipamento custa diamantes e o passe Premium dá moedas.
5. Progressão curta (~4 h para zerar); proposta em docs/balance.json (não aplicada: nomes de chave diferem do código).
6. Fila de funcionalidades a avaliar (docs/CONTRATO_V2.md): loot voando + baú, instâncias, VIP/montaria, práticas e títulos,
   torre, arena, ranking, leilão de skins. Ranking, arena real e leilão exigem servidor (backend), que não existe.
7. Publicação: Android primeiro (US$ 25); Apple US$ 99/ano + Mac; nome "Eonbound" sem checagem formal de marca.

## Onde ler
docs/RECOMENDACOES.md, docs/balance.json, docs/CONTRATO_V2.md, docs/CONTRATO_SYS.md, docs/STYLE_E_CONTRATO.md, reports/*.md
