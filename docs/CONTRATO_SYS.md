# Eonbound — Contrato dos módulos de sistema (js/sys/) para sessões de desenvolvimento em paralelo

Objetivo: adiantar os sistemas da fila (docs/CONTRATO_V2.md, itens 2-7; detalhes em
reports/qa_proposta_vip_baus_instancias.md) SEM tocar nos arquivos do engenheiro, que está refatorando a batalha agora.

## Proibido editar (dono: engenheiro da sessão coordenadora fps-c9)
index.html, js/battle.js, js/fallback.js, js/meta.js, js/audio.js, js/_*.txt, assets/**. Leia-os à vontade (somente leitura).

## Como escrever um módulo
- Um arquivo por sistema em js/sys/<nome>.js, sem dependências, script clássico (sem import/export), que registra
  `window.Sys = window.Sys || {}; Sys.<nome> = {...}` e também funciona em Node (`if (typeof module!=='undefined') module.exports = ...`).
- Lógica pura, sem DOM: funções recebem o save `S` e o adaptador `host`. Estado próprio só em `S.sys.<nome>`, criado por
  `ensure(S)` com valores padrão (save antigo não pode quebrar). Nada de localStorage direto: quem salva é o jogo.
- O jogo é acessado só pelo adaptador `Sys.host` (o engenheiro liga depois; para testes use um falso):
  `host = { atk(), hp(), stage(), eraMax(), goldUnit() /* ouro por abate na fase atual */, addGold(n), addGems(n),
  addItem({slot,r,e}), now() /* ms */, rng() /* 0..1 */, toast(msg) }`
- Bônus de atributo: cada módulo expõe `bonus(S)` → `{atkPct, hpPct, goldPct, critPct, defPct, fc}` (zeros se não tiver);
  `js/sys/fc.js` soma tudo e calcula a FC (força de combate) única do HUD.
- UI separada e opcional: `render(el, S, host)` preenche um contêiner de altura fixa SEM scroll (grade + paginação "‹ 1/3 ›"),
  retrato 390px, alvos de toque ≥ 44px, textos PT-BR, classes CSS com prefixo `sys-` num `js/sys/sys.css`.
- Números em tabelas de dados no topo do arquivo (fácil de balancear). Raridades e tiers sem número mágico (pode haver r5).
- Testes em test/sys/<nome>.test.js, rodando com `node test/sys/<nome>.test.js` (assert nativo), cobrindo defaults, virada de dia,
  limites, save antigo e valores inválidos. Página de demonstração opcional em test/sys/demo.html (carrega só js/sys/*).
- Ao terminar cada módulo, registre em reports/sys-<nome>.md: API, estado em S.sys, o que o engenheiro precisa chamar e onde
  (eventos: onKill(enemy), onBossKill, onWaveClear, onDayChange, onOffline(seconds)), e dúvidas de design.
- Disco C: quase cheio: sem arquivos grandes. Não use Higgsfield. Não publique nada.
