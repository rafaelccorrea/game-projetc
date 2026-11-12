# Liberação por nível — todas as funções, na curva de 9 eras (APROVADA pelo PO em 2026-11-12: arena 28, guilda 32)
**CONTA:** dia/minuto em que o jogador chega a cada nível pela simulação da curva v9 (reports/curva-9-eras-e2.md; 40 min/dia + offline). Dia 1 em minutos de jogo.
Critério do dono: uma novidade a cada pouco tempo no começo; nada que confunda o novato; social/competitivo só quando ele já entende o básico.
Uma novidade por nível (nunca duas no mesmo nível); as já aprovadas (✅) ficam onde estão, salvo onde digo "proposta de mudança".

| Nível | Libera | Grátis chega | VIP 10 | Por quê |
|---|---|---|---|---|
| 1 | Batalha, Equipamento (arma e colete), Loja de itens com OURO | início | início | o básico: lutar, trocar arma, gastar ouro |
| 2 | Missões diárias (6) + bônus | ~1 min | ~1 min | primeira meta do dia, ensina o que fazer |
| 3 | Invocar (1 grátis por dia) | ~1 min | ~1 min | item novo sem gastar |
| 5 ✅ | Práticas | ~2 min | ~2 min | primeiro "melhorar" permanente |
| 7 | Correio + Login diário | ~4 min | ~4 min | volta amanhã |
| 10 | Perfil + Loja de 💎 (e a raridade Rara) | ~7 min | ~7 min | perfil antes de qualquer social; a loja paga só depois do básico |
| 12 ✅ | Forja | ~16 min (fim da era 0) | ~16 min | |
| 14 ✅ | Instâncias | ~31 min | ~31 min | |
| 15 ✅ | Torre (e velocidade x2 grátis) | ~39 min | ~39 min | fecha o 1º dia |
| 18 | Passe da temporada | dia 2 | dia 2 | já entende missões; o passe é "missões com prêmio" |
| 20 ✅ | Pets (ovo grátis 79/21) | dia 2 | dia 2 | |
| 22 | (Kael adolescente, só visual) | dia 3 | dia 2 | separado do pet |
| 24 | **EVENTOS** | dia 3 | dia 3 | PvE com missões próprias: o novato já conhece missões, passe e instâncias. Antes disso o evento só confundiria |
| 28 | **ARENA + Ranking** (proposta de mudança: era 30) | dia 4-5 | dia 4 | competitivo contra outros quando ele já tem pet, forja, práticas e entende FC. Ranking (só ver) junto |
| 32 | **GUILDA** (proposta de mudança: era 30) | dia 6 | dia 5 | social depois da arena; 2 dias de diferença para não chegarem juntos. Se o PO preferir manter 30, a arena vai para 26 |
| 35 | (Kael adulto, só visual) | dia 8 | dia 6 | |
| 38 | **MONTARIA** (fora a oferta de 1ª compra) | dia 9 | dia 7 | poder novo quando a era 2 já ficou longa |
| 40 | **TORNEIO DO PODER** (precisa de guilda + 7 dias nela) | dia 10 | dia 8 | o competitivo de guilda chega com a guilda já formada |
| 45 | **LEILÃO** (18+, só com servidor e parecer) | dia 14 | dia 11 | troca entre desconhecidos: só com o jogo bem entendido |
| 50 ✅ | Asa | dia 18 | dia 13 | |
| 70 | (Kael guerreiro lendário; Mítico) | dia 40 | dia 28 | |

- **Ritmo do 1º dia:** 9 novidades em ~40 min (uma a cada ~4 min); dias 2-10: uma a cada 1-2 dias; depois, as eras e as raridades seguram o interesse.
- **No código (FONTE ÚNICA, PO 2026-11-12):** `Sys.level.DATA.unlock` tem TODAS as chaves com as ids do menu (missions, summon, practice, mail, login, profile,
  shopgem, forge, instances (= inst), tower, pass, pets, events, rank, arena, guild, mount, tourney, auction, wing) + 'pet' (portão do módulo Sys.pet: 1; com o v20 vale o 20).
  Cada tela consulta `Sys.level.isUnlocked(S, 'id')` / `unlockLevel('id')`; trocar o nível = trocar 1 número lá. O FB_UNLOCK do menu passa a ler dessa tabela.
- **Fora do nível:** a oferta de 1ª compra (24 h do 1º acesso), a Loja de itens com ouro (desde o início) e o VIP (compra a qualquer hora).

## Para decidir
1. Arena 28 (no lugar de 30) e Guilda 32 (no lugar de 30), para não chegarem juntas. Alternativa: Arena 26, Guilda 30.
2. Eventos no 24 (dia 3). 3. Montaria 38, Torneio 40, Leilão 45. 4. Missões 2, Invocar 3, Correio/Login 7, Perfil/Loja de 💎 10, Passe 18.
