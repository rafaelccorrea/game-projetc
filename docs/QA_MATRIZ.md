# Matriz de QA: o que está ligado e o que foi realmente visto

Atualizada em 14/11/2026 pelo QA. **Regra de honestidade:** "falta" = ligado ou entregue sem eu ter visto; "n/d" = não sei, quem tem o dado completa (Sistemas = equilíbrio, Servidor = produção, Engenheiro = testes). Um ✓ só vale se está descrito o que foi feito. Dono da coluna: *Testes auto* = Engenheiro · *Equilíbrio* = Sistemas · *Servidor* = fps-6f · *Tela*, *Reteste*, *Celular* = QA.

Legenda: ✓ feito e passou · ✗ feito e falhou · ◐ parcial · falta · n/d · n/a (não se aplica).

## Como o QA valida (para o dono)
1. **Teste automático em node** (test/e2e, test/sys, test/paineis): 138 arquivos rodados em 14/11; 1 falha estável (`test/e2e/diff.js` 144/146: 2 verificações de "nasce desligado" que esperam a tela antiga, a adaptar). Não substitui olhar a tela.
2. **Leitura de código por risco** (prêmio duplicado, save antigo, travas): feita em 14/11 (4 médios e 8 leves, repassados; a Sistemas corrige Correio, Encruzilhada, Grimório e Provação).
3. **Tela real** em Chrome headless (uma aba, 320/360/390 px), com prints em `reports/qa/`. Abre pelo botão do jogo, confere Voltar, console, rolagem lateral, imagem quebrada, "R$"/emoji. Veredito: OK / devolvido.
4. **Reteste** da mesma tela depois que o Engenheiro corrige.
5. **Servidor contra produção** (só Arena, Guilda, Dupla, Torneio, Ladrão): o Servidor confere no banco o que o app fez.
6. **Celular (S24)**: só a v0.13.2 foi percorrida em 13/11; o app DEV (recarga ao vivo) não foi validado (o dono estava usando).

## Itens ligados

| Item | Testes auto | Equilíbrio | Servidor × produção | QA na tela | Reteste após correção | Celular (S24) | Pendências |
|---|---|---|---|---|---|---|---|
| Dificuldade nova (1d7d977) | n/d | Sistemas mediu (relato do Engenheiro) | n/a | ◐ P0 (e750701, conta antiga): sem "-1", cura 25%/30%, +50 gemas; **conta nova fases 1-10: falta** | falta | falta | chefe da fase 5: trivial no Nv 8, impossível no Nv 5 (nível esperado é da Sistemas) |
| Forja V2 | n/d | n/d | n/a | ◐ OK: faixa de resultado na linha reservada, botão Forjar na 1ª tela em 320×640 | ✓ (faixa) | falta | **falha de forja em nível alto: falta** |
| Pets V2 | n/d | n/d | n/a | OK (3 larguras; ressalva do fade ao abrir) | ✓ rota pelo Menu | falta | estágios/Evoluir sem resultado visto |
| VIP V2 | n/d | n/d | n/a | OK (imagem da Serpe corrigida) | ✓ | v0.13.2 sim (tela antiga) | **aguarda refação pelo mock votado (VIP/Passe versão B)** |
| Montarias V2 | n/d | n/d | n/a | OK (nomes em 2 linhas, alinhados em 320) | ✓ | falta | Kaia na Fênix: **defeito de código** (assets.js:162, nome `giant_phoenix`) |
| Fogueira V5 | n/d | n/d | n/a | OK (subagente, 14 PNG, 3 larguras): botão, faísca, cartão, gaveta, Subir, automático, desmontar rápido | cartão deslocado: medido em 320 (x 53-267) ✓ | falta | gaveta/automático/mochila em 390 e 360×640; 5 detalhes leves (−0 vermelho, cartão encosta no Invocar em 360) |
| Derrota com prêmio | n/d | n/d | n/a | OK (prêmio uma vez só; régua 100/50/25/0) | **falta** (dicas em 2 linhas, aviso "Invocar" por cima) | falta | — |
| Encruzilhada | n/d | n/d | n/a | OK (2 toques, "Escolher depois", selo) | **falta** (selo × chip de FC em 360) | falta | efeito de combate Combo/Contra; botão Bênçãos × barras com 4 ícones |
| Fraco contra | n/d | n/d | n/a | **falta** | falta | falta | — |
| Golpes especiais (COMBO, ESQUIVA…) | n/d | n/d | n/a | **falta** | falta | falta | demoram a aparecer em save novo |
| Grimório | n/d | n/d | n/a | **falta** | falta | falta | risco de código: equip no slot 2 com conjunto vazio põe no slot 0; Sistemas corrigindo |
| Caminhos | n/d | n/d | n/a | **em andamento** (subagente) | falta | falta | — |
| Provação do Mestre | n/d | n/d | n/a | **em andamento**: pergunta "jogador novo vence a 1ª?" | falta | falta | risco: sem saída e pode ser impossível; "Desistir" em correção |
| Correio V3 | n/d | n/d | n/d | OK (arrastar, Resgatar, Apagar lidas) | falta (2 riscos médios de código em correção) | falta | cartas com item/ovo e >7 cartas não vistas |
| Mapa V4 | n/d | n/d | n/a | **devolvido** (fase atual atrás do cartão em 320/390, "FC xx" ilegível, título cortado) | **falta** (f69756f) | falta | botão "Lutar" com ícone sobre o texto |
| Torre V2 | n/d | n/d | n/a | OK (leve: banner cobre nome do chefe em 320) | falta | falta | — |
| Equipamento V2 | n/d | n/d | n/a | OK (leve: "Em uso"/"Usando") | falta | v0.13.2 sim (tela antiga) | recorde/erro "M is not defined" (era arquivo salvo pela metade) |
| Loja V2 | n/d | n/d | n/a | **devolvido** (aviso de FC no topo) | falta | v0.13.2 sim (tela antiga) | — |
| Passe V2 | n/d | n/d | n/a | **devolvido** (cabeçalho cortado em 320, aviso de FC) | falta | falta | **visual novo (mock versão B): reteste de contraste** |
| Perfil V5 | n/d | n/d | n/a | **devolvido** (16 ícones de título quebrados; lista curta) | **falta** (b5d51d4) | falta | recordes não vistos |
| Molduras (VIP/Perfil) | n/d | n/d | n/a | ◐ aparecem no Perfil (19) | falta | falta | VIP aguarda mock |
| Guilda V2 / Torneio V2 | n/d | n/d | ◐ GUILDFIRE_ON ligado às 02:34 (Servidor acompanha) | ◐ só SEM sessão ("aviso honesto") | falta | falta | **conteúdo real (membros, doar, chefe, loja, missões, escalação): nunca visto**; conta de teste "Teste E2E 7SZB" e o 429 do /auth/guest |
| Fogueira da Guilda | n/d | n/d | ◐ idem | **falta** | falta | falta | — |
| Fim das 9 eras | n/d | n/d | n/a | OK (5 passos; "A JORNADA CONTINUA") | falta | falta | prêmio depende do módulo da Sistemas (hoje só +10 diamantes) |
| Dupla das Eras | n/d | n/d | ◐ servidor ligado, cliente novo | **falta** (precisa 2 convidados novos) | falta | falta | visual escuro do mock |
| Acampamento das Eras | n/d | n/d | n/a | **falta** | falta | falta | — |
| Ladrão de Brasas | n/d | n/d | THIEF_ON agora | **falta** | falta | falta | — |
| LoM | n/d | n/d | n/d | **falta** (não sei o escopo) | falta | falta | Engenheiro/PO: o que é |
| Arena online | ✓ node `arena_pvp.js` 223 verificações | n/d | **✓** 2 lutas reais conferidas no banco (vencedor, Δ, semente, FC do retrato) | ◐ lógica e fim natural x2/x4 OK; **prints da luta real faltam** | lobby: FC e previsão ±N × servidor (8c224c0) **falta** | falta | −12 × "−5" anunciado; 429 impede o lobby |
| Pet/Mecha de guerra, golpes novos dos pets | n/d | n/d | n/a | ◐ aura e golpe do estágio 2 vistos; **Mecha: falta** | falta | falta | — |
| Tiro montado | n/d | n/d | n/a | **falta** | falta | falta | Kaia no mítico fica no golpe de espada (decisão do PO) |
| Skins da Arte (G5) | ◐ stagekit.test | n/a | n/a | ◐ Kael Anjo sem asa ✓, Ciborgue ✓ (observações); **demais skins: falta** | — | v0.13.2: Anjo sem asa ✓ | lista do fps-75 (docs/ARTE_MATRIZ.md) |
| Asa Seráfica | n/d | n/a | n/a | ◐ a pé ✓; montada ✗ (some) | **falta** (dbgMountWing novo) | falta | pares sugeridos: (0,20,1.2), (-10,30,1.3)… |

## Celular (S24, v0.13.2, 13/11, app do jogo)
Percorrido passo a passo: abertura, herói, jogar, Equipamento, Aparência, VIP, Loja, Config, salvar e reabrir (✓), desempenho (PSS 576-643 MB, ~6,7-10,6% de quadros com tranco, 32→38 °C). Falhou/avisos enviados ao Engenheiro (logo cortado, linha de prêmios cortada, contraste dos botões dourados, etc., já corrigidos no main). **App DEV (recarga ao vivo): só a tela de carregamento; validação parada a pedido do PO enquanto o dono usa o aparelho.** Nada do que foi ligado depois da v0.13.2 foi visto no aparelho.

## O que NÃO é garantia
- Os ✓ de "tela" vêm de Chrome headless com estados forçados por script; fps e toque real só no celular.
- Coluna "Equilíbrio": o QA mediu só o dano do comum e a cura (P0) e a Provação está medindo agora; o resto é da Sistemas.
- Vários vereditos de tela foram dados por subagentes que olharam parte dos prints (cada relatório diz quantos); o QA confirmou pessoalmente os defeitos principais.
