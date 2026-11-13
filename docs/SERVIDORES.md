# Servidores (realms) — Eonbound

Decisão do dono (13/11/2026): o jogo é **por servidor**. O primeiro é o **S1 · Nova Era**. Depois vêm S2, S3..., cada um **totalmente separado** e aberto para jogadores novos.
Implementação: `fps-server` commit af8ebbb (migração `007_servidores`). Contrato das rotas: `docs/API_SERVIDOR.md` §11.

## Regras
- **Conta = global.** A identidade (aparelho do convidado, Google, Apple) é uma só.
- **Personagem = por servidor.** Cada conta pode ter um personagem em cada servidor (`players.realm`).
- **Nada passa entre servidores:** itens, ouro e 💎, incluindo os comprados. Uma compra fica no personagem do servidor em que foi feita.
- **Abrir um servidor novo** = uma linha na tabela `realms`, sem instalar nada.
- **Estados:** `new` / `open` aceitam personagem novo. `full` / `closed` só deixam entrar quem já tem personagem lá.
- **Junção de servidores (merge):** fica para depois. Como tudo do mundo é do personagem (`player_id`, que é de um servidor só), a junção continua possível.
- **Futuro:** um servidor pode ir para outra máquina pela mesma API (realm → URL).

## Identificador
- Texto minúsculo `s1`, `s2`... (regex `^s[0-9]{1,3}$`). É o mesmo no banco, nas rotas, no token (`rlm`), no aparelho (`localStorage 'eon_realm'`) e no save (`S.realm`).
- Ausente = `s1`. O nome ("S1 · Nova Era") é só exibição: `code` + `name`.

## Como o servidor separa
| O quê | Como |
|---|---|
| Personagem | `players.realm` (padrão `s1`) |
| Identidade da conta | No S1, o `subject` de sempre (nada muda para quem já existe). Nos outros, `subject#sN`. O UNIQUE `(provider, subject)` de hoje continua valendo. |
| Sessão | O token leva `rlm`; o refresh mantém o servidor do personagem. |
| Save, correio, compras, VIP, arena (pontos), guilda (membro), leilão (inventário) | Já são do `player_id`, então ficam separados por si. |
| Arena (adversários, ranking, prêmio semanal) | **Feito (fase 2, fps-server cb29c07):** só o mesmo servidor; posição e prêmio dentro de cada servidor. |
| Guildas (lista, entrada, ranking) | **Feito (fase 2, cfb4707, migração 008):** a guilda é do servidor do criador. Nomes continuam únicos entre servidores. |
| Chat Mundial/Era | **Feito (fase 2, cfb4707):** fora do S1 o canal é guardado com prefixo (`s2|world`); o jogo continua vendo `world`/`era:N`. |
| Correio para todos | **Feito (fase 2, migração 010):** aviso para todos pode ter `realm` (só aquele servidor recebe e resgata); sem `realm`, todos os servidores. Ainda não há rota da equipe que mande aviso para todos. |
| Leilão | **Feito (fase 2):** o anúncio é do servidor do vendedor; quem é de outro servidor não vê nem compra (404); a mediana de preço (alerta de preço fora do normal) é por servidor. Carteira e itens já eram por personagem. |
| Chefe Mundial / eventos | **Nada a separar hoje:** o Chefe Mundial é evento LOCAL do jogo (`Sys.schedule`, horário fixo); o servidor não guarda vida nem ranking compartilhado. Se um Chefe Mundial compartilhado entrar no servidor, nasce por servidor. Os eventos do servidor (horários) valem iguais para todos os servidores. |
| Torneio de territórios (guilda §10.3) | **Falta:** ainda não existe no servidor; nasce por servidor quando for feito. |

## No jogo (combinado com a fps-c8 e a fps-69)
- **Save local:** a fps-c8 fez um save por servidor (a7f3431). O S1 fica na chave de hoje (`eras_proto_v2`); os outros em `eras_proto_v2@sN`. O Modo dono segue o mesmo padrão (`eras_owner_v1`, `eras_owner_v1@sN`).
  - `S.realm` é carimbado no save. Um save de outro servidor **não** é carregado.
- **Troca de servidor:** `window.Realm.set(id)` grava o save atual, troca o servidor, bloqueia gravações e recarrega a página.
- **Sessão (Sys.net):** guardada por servidor (`eon.net` no S1, `eon.net@sN` nos outros), com o **mesmo** `deviceId` do aparelho.
  - `POST /auth/guest` e `POST /auth/login/google` mandam `realm`.
  - `Sys.net.realms()` chama `GET /realms`.
- **Tela de escolha:** feita pela fps-69. Usa `GET /realms`; sem rede, mostra só o servidor atual.

## Abrir um servidor (admin)
Inserir uma linha em `realms`, por exemplo `('s2','S2','Segunda Era','new',true,<ms da abertura>,2)`. Antes de abrir o S2 é preciso:
1. a fase 2 da tabela acima (filtros por `realm` nas listas do mundo);
2. desligar `recommended` no S1, se for o caso.

## Lista de limpeza antes do lançamento público
Contas de TESTE criadas no banco de produção. Apagar todas antes de abrir ao público (pelo painel de moderação ou por script do servidor):
| Quando | Conta | Criada por | Observação |
|---|---|---|---|
| 13/11/2026 | convidado "Viajante5696" (S1) | `fps-server/scripts/smoke-real.mjs` | teste automático contra o servidor real (cada execução cria **1** convidado novo "Viajante…" com save de nível 1) |

| 13/11/2026 | +1 convidado "Viajante…" (S1) | `smoke-real.mjs` (2ª execução, com a conferência de CORS) | idem |
| 13/11/2026 | +1 convidado "Viajante…" (S1) | `smoke-real.mjs` (3ª execução, depois da proteção contra perda) | idem |
| 13/11/2026 | +1 convidado "Viajante6429" (S1) | `smoke-real.mjs` (4ª execução, com a conferência do save_regress) | idem |
| 13/11/2026 | +1 convidado "Viajante…" (S1) | `smoke-real.mjs` (5ª execução, depois da fase 2 de guildas/chat) | idem |
| 13/11/2026 04:41 (Brasília) | convidado "CorvoDourado" (conta Viajante2150, S1, Nv. 1, v0.12.9) | QA no navegador, origem 127.0.0.6:8080 | teste da tela de entrada; sem compras |
| 13/11/2026 10:02 (Brasília) | convidado "LoboDasEras61" (conta Viajante4010, S1, Nv. 1, v0.13.0) | QA no navegador, origem 127.0.0.5:8080 | teste da tela de entrada; sem compras |
| 13/11/2026 10:24 (Brasília) | convidado "Viajante6288" (S1, sem nome, Nv. 1) | criado sozinho pelo boot logo depois do teste de Excluir conta do QA (origem .7) | defeito corrigido: convidado só nasce no JOGAR |
| 13/11/2026 | +1 convidado "Viajante…" (S1) | `smoke-real.mjs` (6ª execução, limpeza de contas) | idem às outras execuções |
| 13/11/2026 | +1 convidado "Viajante…" (S1) | `smoke-real.mjs` (7ª execução, exclusão em todos os servidores) | idem |
| 13/11/2026 ~12:05 (Brasília) | convidado "Viajante5501" (personagem "LoboRubro", S1) | QA no navegador, origem 127.0.0.8:8080 (reteste "convidado só no JOGAR", 749d943) | excluída pelo próprio teste; conferir no banco quando o SSH voltar |

**Também antes do lançamento:** tirar `CORS_ORIGINS_TEST` do `/etc/eonbound/server.env` (origens de teste do QA no navegador: localhost:8080 e 127.0.0.1-8:8080; .7 e .8 acrescentadas em 13/11 para o QA testar "Excluir conta" com convidado descartável). O app (`https://localhost`) fica fixo no código.

**Limpeza automática (fps-server a3653c6):** a cada 6 h o servidor apaga de vez (1) as contas com exclusão pedida há 30 dias e (2) os convidados vazios (só aparelho, Nv. ≤ 1 e fase ≤ 1, sem compra/cartão/entrega) sem acesso há 30 dias (`PURGE_GUEST_DAYS`, 0 desliga). Os convidados de teste desta lista saem sozinhos 30 dias depois do último acesso; a conferência à mão antes do lançamento continua.

Regra: toda nova execução do `smoke-real.mjs` em produção acrescenta uma linha aqui. Na limpeza, também conferir e apagar convidados de nível 1 sem compras criados pelo teste do QA.
