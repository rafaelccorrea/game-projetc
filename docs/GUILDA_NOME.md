# Nome e estilo da guilda: listas fixas (sem texto livre)

Decisão do dono (14/11): o jogo é para menores, então **nenhum texto livre entre jogadores** na guilda.
O jogador **monta** o nome com uma parte de cada lista ("Lobos" + "da Aurora" = "Lobos da Aurora"). A descrição livre **sai**: no lugar,
um **estilo** escolhido numa lista. Fonte única das listas: `js/sys/guild.js` (`DATA.nameParts.a`, `DATA.nameParts.b`, `DATA.styles`).
Teste: `test/sys/guild-nome.test.js` (todas as 1.600 combinações com no máximo 24 caracteres, sem repetição nem sem acento/maiúscula,
par inválido recusado, ida e volta do texto, save antigo, regras de troca, e o JSON abaixo igual ao do módulo).

## 1. Regras fixas (cliente e servidor)

- O nome é guardado e trafega como **índices** `{nameA, nameB}`; o texto é só `A[nameA] + " " + B[nameB]`.
- O estilo trafega como **índice** `styleIdx` (0 a 7).
- **A ordem das listas nunca muda e nada sai; só cresce no FIM.** Um índice salvo vale para sempre. Para tirar uma parte, o caminho é
  escondê-la dos seletores (lista de ocultos), nunca apagar.
- O servidor **recusa texto livre** (campo `name` ou `description` vindo do cliente é ignorado ou dá 400) e **recusa índice fora da lista**
  (não inteiro, negativo ou ≥ tamanho).
- O par é **único por servidor**: o segundo a pedir o mesmo par recebe `409 name_taken`.
- Comparação, unicidade e busca usam a mesma chave: sem acento, minúsculas, espaços únicos (`Sys.guild.nameFold`).
  Nenhuma combinação colide nessa chave (conferido no teste).

## 2. Listas (JSON para o servidor copiar)

`version` sobe quando a lista crescer no fim. O teste confere que este bloco é igual ao módulo.

<!-- guild-name-json:begin -->
```json
{
  "version": 1,
  "nameMax": 24,
  "a": ["Lobos", "Guardiões", "Viajantes", "Forjadores", "Falcões", "Dragões", "Leões", "Tigres", "Corvos", "Mamutes",
        "Navegantes", "Arqueiros", "Cavaleiros", "Escudeiros", "Sentinelas", "Inventores", "Engenheiros", "Pioneiros", "Andarilhos", "Heróis",
        "Campeões", "Titãs", "Colossos", "Grifos", "Fênix", "Cometas", "Arautos", "Sábios", "Alquimistas", "Mensageiros",
        "Javalis", "Vigias", "Errantes", "Herdeiros", "Defensores", "Ursos", "Linces", "Timoneiros", "Búfalos", "Albatrozes"],
  "b": ["da Aurora", "do Vulcão", "das Eras", "das Cavernas", "do Gelo", "do Âmbar", "do Bronze", "do Deserto", "do Oásis", "das Areias",
        "do Castelo", "da Muralha", "do Reino", "do Galeão", "dos Mares", "da Bússola", "do Vapor", "dos Trilhos", "da Fornalha", "da Metrópole",
        "do Futuro", "do Plasma", "do Cristal", "da Órbita", "das Sombras", "do Abismo", "do Submundo", "das Estrelas", "do Sol", "da Lua",
        "das Nuvens", "do Tempo", "do Norte", "do Trovão", "do Eclipse", "do Vento", "da Chama", "da Montanha", "da Floresta", "do Horizonte"],
  "styles": ["Tranquila", "Ativa todo dia", "Caça chefes", "Foco no Torneio", "Amigos e família", "Novatos bem-vindos", "Rumo ao topo", "Ajuda mútua"]
}
```
<!-- guild-name-json:end -->

Os textos estão em NFC (acento como um caractere só). Temas: as 9 eras (Pré-História: Cavernas, Gelo, Âmbar, Mamutes; Antiguidade: Bronze,
Deserto, Oásis, Areias; Medieval: Castelo, Muralha, Reino, Cavaleiros; Pólvora: Galeão, Mares, Bússola, Timoneiros; Industrial: Vapor, Trilhos,
Fornalha, Inventores; Moderna: Metrópole; Futurista: Futuro, Plasma, Cristal, Órbita; Submundo: Sombras, Abismo, Submundo; Celestial: Estrelas,
Sol, Lua, Nuvens, Eclipse). Ficaram de fora de propósito: palavras de crime, gangue ou torcida organizada (Comando, Tropa, Bonde, Gaviões),
religiosas (Anjos, Templários, Paraíso, Inferno), políticas, sensuais ou com gíria de duplo sentido (Gatos, Batedores).

## 3. Funções do módulo (`Sys.guild`)

| Função | Devolve |
|---|---|
| `nameParts` (`{a, b}`), `styles` | as listas, para os seletores |
| `nameOf(a, b)` | texto do par; `''` se o par não vale |
| `nameValid(a, b)` | `true` só com dois inteiros dentro das listas |
| `nameParse(texto)` | `{a, b}` ou `null` (tolera maiúscula, sem acento e espaço a mais) |
| `nameFold(texto)` | chave de comparação/busca (sem acento, minúsculas) |
| `nameRandom()` | `{a, b}` sorteado (botão "Sortear"; não gasta nada) |
| `name(S)` | nome para mostrar: o par guardado; save antigo sem par = o texto antigo |
| `styleOf(i)`, `styleValid(i)` | texto do estilo / validade do índice |
| `canCreate(S, host, a, b, style?)` | `{ok, reason, gold, name, body}`; reasons novos: `name` (par ausente ou inválido), `style` |
| `canRename(S, host, a?, b?)` | `{ok, reason: 'leader' \| 'rename_cooldown' \| 'name', retryAfterMs, free}` |
| `canRestyle(S, host, i?)` | `{ok, reason: 'leader' \| 'restyle_cooldown' \| 'style', retryAfterMs}` |
| `reasonText(r)` | texto da recusa (do módulo ou do servidor), com os dias do `retryAfterMs` |
| `status(S, host)` | ganhou `nameA`, `nameB`, `nameLegacy` (guilda com nome antigo, sem par), `styleIdx`, `style` |

Save (`S.sys.guild`): `nameA`, `nameB`, `styleIdx` (índices ou `null`), `renameFree` (bool), `renamedAt`, `styledAt` (ms). `name` continua
guardado: com par válido é o texto do par; save antigo com nome digitado fica com o texto até o líder escolher um par (ou o servidor mandar o par).
`applyServer` usa `nameA/nameB` do servidor quando vierem; sem eles, tenta ler o texto com `nameParse`.

## 4. Regras de troca (iguais às do servidor)

- **Nome**: só o líder, **sem custo**. `renameFree = true` (dado pela migração) vale **uma vez, a qualquer momento**. Depois disso, 1 troca a cada
  **30 dias** contados de `renamedAt`. Recusa: `429 rename_cooldown` com `retryAfterMs`. Texto: "Você poderá trocar o nome em N dias".
  `canRename(...).free = true` quando a troca vai gastar o `renameFree`.
- **Estilo**: só o líder, sem custo, **1 troca por dia de Brasília** (o mesmo `Sys.clock.dayKey` dos outros módulos, não 24 h).
  Recusa: `429 restyle_cooldown` com `retryAfterMs` até a virada do dia. Texto: "Você poderá trocar o estilo amanhã".
- **Par já usado**: `409 name_taken`. Texto: "Esse nome já existe neste servidor; troque uma das partes".
- Não líder: `reason 'leader'`, texto "Só o líder pode fazer essa troca".

## 5. Para o Engenheiro (tela da Guilda V2, `js/p_guild2.js`)

**Criar guilda** (aba sem guilda): troque o `<input id="gd2_name">` por **dois seletores** lado a lado (lista A e lista B, de `Sys.guild.nameParts`),
uma **prévia** do nome montado (`Sys.guild.nameOf(a, b)`) em destaque, um seletor de **estilo** (`Sys.guild.styles`) e um botão **"Sortear"**
(`Sys.guild.nameRandom()`, não gasta nada, só troca os dois seletores). Comece já com um par sorteado, assim o botão Criar nunca fica sem nome.
O custo continua o de hoje (ouro de `createCost`); escolher, sortear e trocar não gastam nada.
Antes de confirmar: `const c = Sys.guild.canCreate(S, host, a, b, style)`; se `!c.ok`, mostre `Sys.guild.reasonText(c) || whyLocal(c)`.
O envio vira `Sys.guildNet.create(S, host, Object.assign({emblemId: 0, lang: 'pt', open: true, minLevel: 1}, c.body))` — `c.body` é
`{nameA, nameB, styleIdx?}`; **não mande `name` nem `description`**. Se o servidor responder `name_taken`, mostre o texto e deixe os seletores
como estão. Atenção: `canCreate(S, host)` sem o par agora devolve `reason 'name'` (o `test/paineis/p_guild2.smoke.js` linha 191, que espera
"O nome precisa ter de 3 a 24 letras", falha até a tela trocar; a frase "O nome passa pelo filtro do chat" também sai).

**Nome na tela**: use `Sys.guild.name(S)` (ou `status().name`). Com `status().nameLegacy` e cargo líder, mostre um aviso "Escolha o novo nome
da guilda" que abre os mesmos dois seletores; a troca usa `canRename(S, host, a, b)` e manda `PATCH /guild {nameA, nameB}`.
Estilo: na ficha da guilda, mostre `status().style`; o líder troca por `canRestyle(S, host, i)` e `PATCH /guild {styleIdx}`.
Recusas sempre por `Sys.guild.reasonText(r)`.

**Busca**: o campo de busca pode continuar texto (só serve para procurar, ninguém mais vê), mas o melhor é usar os mesmos dois seletores com a opção
"qualquer": `GET /guilds?search=<texto>` (trecho, sem diferenciar maiúscula e acento) ou `GET /guilds?a=<nameA>&b=<nameB>` (um ou os dois).

## 6. Para o Servidor (fps-server, `src/core/guild/guild-core.ts`)

- Copie o JSON da seção 2 (por exemplo para `guild-name-data.ts`); valide com a mesma regra do `nameValid`: `Number.isInteger(i) && 0 <= i < length`.
- `POST /guilds {nameA, nameB, styleIdx?, emblemId, lang, open, minLevel}`: monte `name = a[nameA] + ' ' + b[nameB]`, `nameLower = nameFold(name)`;
  recuse `name`/`description` em texto (400 `fields:['name']`) e índice fora da lista (400 `fields:['nameA'|'nameB'|'styleIdx']`).
  `cleanName` (3-16 letras + filtro) deixa de valer para a guilda; o teto passa a 24 e já é garantido pelas listas.
- Unicidade por `nameLower` no servidor (o `insertGuild` que hoje dá `409 name_taken` continua valendo).
- `PATCH /guild {nameA, nameB}`: só o líder; aceita se `renameFree` (zera e grava `renamedAt`) ou se `now - renamedAt >= 30 dias`; senão
  `429 rename_cooldown` com `retryAfterMs`. `PATCH /guild {styleIdx}`: só o líder; 1 por dia de Brasília (`styledAt`), senão `429 restyle_cooldown`
  com `retryAfterMs` até a meia-noite de Brasília.
- `GuildView` traz `nameA`, `nameB`, `styleIdx`, `renameFree`, `renamedAt`, `styledAt` (além do `name` montado). O cliente usa o par quando vier.
- Migração das guildas antigas com nome livre: nome = um par padrão livre (o primeiro par ainda não usado), `renameFree = true`, `description` apagada,
  `styleIdx = null`. O cliente mostra o texto antigo até receber o par.
- Busca: `GET /guilds?search=` compara `nameFold(search)` como trecho de `nameLower`; `?a=&b=` filtra pelos índices (um ou os dois).
