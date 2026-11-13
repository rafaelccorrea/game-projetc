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
| Listas do mundo (ranking da arena, lista/ranking de guildas, chat Mundial/Era, Chefe Mundial, torneio, correio para todos) | **Fase 2, antes de abrir o S2:** filtrar por `realm`. No lançamento só existe o S1, então hoje não há mistura. |

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

**Também antes do lançamento:** tirar `CORS_ORIGINS_TEST` do `/etc/eonbound/server.env` (origens de teste do QA no navegador: localhost:8080 e 127.0.0.1-6:8080). O app (`https://localhost`) fica fixo no código.

Regra: toda nova execução do `smoke-real.mjs` em produção acrescenta uma linha aqui. Na limpeza, também conferir e apagar convidados de nível 1 sem compras criados pelo teste do QA.
