# Ligações LoM (bloco A): Relíquias, Escavação, Pets de apoio, Lista "Hoje"

Sistemas, 13/11/2026. Passo a passo para o Engenheiro. Origem: `docs/LOM_VS_EONBOUND.md` §5 itens 8, 9, 10 e 13.

> **Atualizado em 13/11/2026:** a ligação pronta para colar (linha do index.html, SYS_LIVE, Menu e nível, ganchos com arquivo:linha, esqueleto da tela com cada reason e a palavra da tela, online, ordem e fumaça) está em **`docs/LIGACOES_LOM_TELAS.md`**, conferida contra o código de hoje. Onde este guia e aquele discordam, vale o novo.

Os 4 módulos são novos, com a **chave desligada** (`DATA.on=false`). Carregados e desligados, nada muda no jogo. A tela final vem do mock da Arte; a especificação abaixo segue o estilo das telas de hoje (cartões `sys-card`, botão dourado, selo vermelho com número).

Regras que valem nos quatro:
- Nada aleatório pago, nada à venda que dê poder, nenhuma recarga paga, nenhum anúncio. As funções `grant`/`addFragments`/`addRelicFrags` **recusam** fonte `shop`, `gems`, `offer`, `pack`, `pay`, `gacha`, `ad(s)` (e a Escavação recusa também `refill`).
- **Não dão ouro**: Relíquias, Escavação e Pets de apoio não criam ouro. A lista "Hoje" só chama o resgate de cada módulo, com o teto de ouro dele (X = 5 min de abate por resgate, `docs/ECONOMIA_OURO.md`).
- Nenhum deles mexe em Brasas.

## 0. Carregar

No `index.html`, linha 814 (o `forEach` dos módulos `js/sys`), ponha os 4 nomes **antes do `'fc'`**, no fim do 3º array, depois de `'loadouts'`:

```
'relics','dig','petsupport','today'
```

O `Sys.fc` soma sozinho o `bonus(S)` de todo módulo carregado. Não precisa mexer no `fc.js`. Os nomes no `Sys` são: `Sys.relics`, `Sys.dig`, `Sys.petSupport` e `Sys.today`.

Para ligar (quando o dono aprovar a tela): `Sys.relics.setOn(true)`, `Sys.dig.setOn(true)`, `Sys.petSupport.setOn(true)`, `Sys.today.setOn(true)`.

## 1. Relíquias das Eras (`js/sys/relics.js`, `Sys.relics`)

**Regra:** 9 espaços, um artefato por era. Cada relíquia dá um bônus passivo e sobe do Nv 1 ao 10 com fragmentos **da própria era**.

| Era | Relíquia | Bônus Nv 1 → Nv 10 |
|---|---|---|
| 0 Pré-História | Machado de Sílex | ATQ +0,6% → +1,95% |
| 1 Antiguidade | Escaravelho Sagrado | Vida +0,6% → +1,95% |
| 2 Medieval | Elmo do Cavaleiro | DEF +0,4% → +1,3% |
| 3 Pólvora | Bússola do Capitão | Crítico +0,2 → +0,65 pts |
| 4 Industrial | Engrenagem de Latão | ATQ +0,6% → +1,95% |
| 5 Moderna | Rádio de Campanha | Vida +0,6% → +1,95% |
| 6 Futurista | Núcleo de Plasma | Crítico +0,2 → +0,65 pts |
| 7 Submundo | Lanterna do Barqueiro | DEF +0,4% → +1,3% |
| 8 Celestial | Pena da Balança | ATQ e Vida +0,4% → +1,3% |

Com tudo no Nv 10, o total é ATQ +5,2%, Vida +5,2%, DEF +2,6% e Crítico +1,3 pts.

**Custo do nível** (fragmentos da era): 5, 8, 12, 16, 20, 25, 30, 40, 50 (do 1→2 até o 9→10; são 206 no total).

**Como se ganha** (tudo fixo):
- Na 1ª vitória sobre o Senhor da Era, a relíquia nasce no Nv 1.
- Com 20 fragmentos da era, ela também nasce, sem o Senhor da Era.
- Fontes de fragmento:
  - Senhor da Era de novo: 2 fragmentos, 1 vez por era por dia;
  - Torre: 2 a cada 10 andares;
  - Chefe Mundial: 3;
  - Arena, fim da semana: 5;
  - evento: 10;
  - Escavação: ~2 por dia;
  - masmorra cooperativa: `relicFrags` pelo correio.

**O que chamar:**
1. Vitória sobre o Senhor da Era (no mesmo lugar onde já se chama `Sys.grimoire.grant(S,host,'eraLord',{era})`): `Sys.relics.grant(S,host,'eraLord',{era})`. Mande sempre `'eraLord'`: o módulo decide se é a 1ª vitória (a relíquia nasce) ou repetição (2 fragmentos, 1 por dia).
2. Torre, a cada 10 andares vencidos: `Sys.relics.grant(S,host,'tower')`. A era padrão é a maior era liberada do herói.
3. Chefe Mundial: `grant(S,host,'worldBoss')`. Fim da semana da Arena: `grant(S,host,'arenaWeek')`. Evento: `grant(S,host,'event',{era})`.
4. **Correio / masmorra cooperativa:** a chave `att.relicFrags` já é entregue sozinha.
   - O `Sys.mail.claim` passa o anexo ao `Sys.loot.grantBundle`, que chama **`Sys.relics.addRelicFrags(S,n,src)`**. Sem o `Sys.loot`, o próprio `mail.js` chama a mesma função.
   - Regra fixa: os fragmentos vão para a relíquia que o jogador já tem com o **menor nível** (no empate, a era mais antiga). Sem nenhuma relíquia, ficam soltos (`view().loose`) e entram na 1ª que nascer.
   - Com o `Sys.relics` desligado, ficam guardados em `S.sys.loot.relicFrags` e entram sozinhos quando a chave ligar. O resgate devolve `got.relicFrags = {n, era}` ou `{n, stored:true}`.
5. Tela: `Sys.relics.view(S,host)` devolve `{on, owned, total, bonusText, loose, sources:[texto], slots:[{era, eraName, id, name, desc, owned, lv, max, frags, cost, canLevel, canUnlock, unlockFrags, passiveText, nextText, locked}], paid:false}`.
   - Botão Subir: `Sys.relics.levelUp(S,id,host)`.
   - Botão Despertar (20 fragmentos): `Sys.relics.unlock(S,id,host)`.
   - As dicas entram sozinhas no "Como ficar mais forte" (`advice`, `tab:'relics'`).

**Tela (estilo de hoje).** Título "Relíquias das Eras" e uma faixa com o total (`bonusText`).
- Grade 3 × 3 de cartões `sys-card`, um por era.
  - Ícone da relíquia, nome, "Nv X/10" e a barra "fragmentos / custo".
  - Relíquia trancada: silhueta, com "Senhor da Era ou 20 fragmentos".
  - Era ainda não liberada (`locked`): cadeado.
- Ao tocar num cartão, abre a folha com a descrição, o bônus atual → próximo (`passiveText` → `nextText`), o botão dourado Subir (ou Despertar) e a lista "Como conseguir" (`sources`).
- Não há botão de compra.

## 2. Escavação arqueológica (`js/sys/dig.js`, `Sys.dig`)

**Regra:**
- Camada de **5 colunas × 6 linhas**. Cada toque gasta 1 **picareta**: terra cai com 1 toque, rocha com 2.
- Só se cava a linha de cima ou uma célula vizinha (cima, baixo ou lados) de uma já aberta.
- Cada camada tem fixos:
  - **1 escada** (nunca na 1ª linha);
  - **6 células de pedras de prática** (2 a 4 pedras, + metade da era);
  - **2 células com 1 fragmento de relíquia** (era fixa na célula, de 0 até a era da profundidade);
  - **bomba** nas camadas 3, 6, 9…;
  - **broca** nas camadas 5, 10, 15….
- O conteúdo sai da **semente da camada** (profundidade + volta). É o mesmo para todo jogador, e cavar não sorteia nada.
- A cada 10 camadas a profundidade muda de era, até a maior era liberada do herói. No fundo, a próxima camada é outra na mesma profundidade (volta + 1).
- **Picaretas:** começam com 20 e voltam 1 a cada 30 min, até 20. As fontes fixas podem passar do teto, até 40:
  - missões diárias completas: +5 (1 vez por dia);
  - Senhor da Era: 1 bomba por era;
  - evento: 10 picaretas, 1 bomba e 1 broca.
- **Bomba** abre a célula e as 4 vizinhas. **Broca** abre a coluna inteira. Nenhuma das duas gasta picareta.
- Sem picareta paga, sem recarga paga e sem anúncio.

**Quanto dá** (simulação, 60 dias, 48 picaretas de recarga + 5 das missões por dia, cavando para baixo):

| Era | Pedras de prática por dia | Fragmentos por dia | Camadas por dia |
|---|---|---|---|
| 0 | 19,8 | 2,4 | 2,5 |
| 3 | 26,3 | 1,9 | 2,3 |
| 8 | 44,2 | 2,1 | 2,4 |

As pedras de prática do abate são ~290 a 460 por dia (8% de chance por inimigo). A escavação soma **~5 a 10%** a isso. Ouro: zero.

**O que chamar:**
1. Tela: `Sys.dig.view(S,host)` devolve `{on, picks, max, nextInMs, bombs, drills, depth, era, eraName, atBottom, stairsOpen, cols, rows, cells:[{r, c, open, hp, rock, canDig, item}], got, pend, paid:false}`. O `item` só aparece na célula aberta: `{t:'stones',n}`, `{t:'frag',era,n}`, `{t:'bomb'}`, `{t:'drill'}` ou `{t:'stairs'}`.
2. Toque na célula: `Sys.dig.hit(S,host,r,c)` devolve `{ok, hp, opened:[[r,c]], stones, frags:[{era,n}], bombs, drills, stairs, picks}` (a animação "+N" usa isso). Os motivos de erro são `'blocked'` (não é vizinha), `'picks'` (traz `nextInMs`) e `'cell'`.
3. Bomba: `Sys.dig.bomb(S,host,r,c)`. Broca: `Sys.dig.drill(S,host,col)`. Escada aberta, botão "Descer": `Sys.dig.descend(S,host)`.
4. Fontes: missões diárias completas → **nada a chamar** (o `Sys.dig.syncDaily` lê o bônus das diárias do `Sys.pass` sozinho); vitória sobre o Senhor da Era → `Sys.dig.grant(S,host,'eraLord',{era})`; prêmio de evento → `grant(S,host,'event')`.
5. As pedras entram pelo `Sys.practice.addStones` e os fragmentos pelo `Sys.relics.addFragments(...,'dig')`. Se um desses estiver ausente ou desligado, o prêmio fica em `pend` e entra sozinho na próxima ação (ou com `Sys.dig.flush(S,host)`).

**Tela (estilo de hoje).** Título "Escavação" com a era da profundidade ("Antiguidade · camada 14").
- No topo: picaretas "12/20" e "próxima em 18 min", mais os ícones de bomba e de broca com a quantidade.
- Grade 5 × 6: terra marrom; rocha cinza com rachadura depois do 1º toque; célula aberta mostra o que tinha. A célula que dá para cavar fica clara; as outras, escuras.
- Ao abrir a escada, aparece o botão dourado "Descer".
- Embaixo, o total do dia (pedras e fragmentos).
- Não há botão de compra nem de recarga.

## 3. Pets: bônus por ter + 2 de apoio (`js/sys/petsupport.js`, `Sys.petSupport`)

É um módulo à parte. O `js/sys/pet.js` **não mudou**: o pet principal e todos os testes dele continuam iguais.

**Regra:**
- **Bônus por ter:** cada pet que o jogador tem dá ATQ% e Vida% (os dois iguais).
  - Pela raridade: Básico 0,10 · Raro 0,15 · Épico 0,20 · Mítico 0,30 · Lendário 0,40 · Prismático 0,60.
  - Pelo estágio: filhote ×1 · médio ×1,5 · evoluído ×2.
  - **Teto de +5%** em cada.
- **2 pets de apoio** atrás do principal. O principal continua sendo o único que ataca e fica sempre na frente.
  - O apoio **não ataca**, não é alvo e não cura. Ele dá **30% do lado de vida dele** (vínculo + cura do tipo) como vínculo (+Vida do herói), dentro do mesmo teto de pet do `Sys.fc`.
  - O espaço 1 abre com 2 pets; o espaço 2, com 3.
  - Só vale com o pet principal lutando.
  - Pet numa tenda do Acampamento não conta como apoio e não entra no espaço (um pet faz uma coisa só).
  - Trocar o principal para um pet que estava de apoio tira esse pet do espaço.

**O que chamar:**
1. Tela de Pets: `Sys.petSupport.view(S)` devolve `{on, main, owned, collection:{count, pct, capped, cap}, slots:[{i, open, need, id, name, bond, camp}], candidates:[{id, name, r, camp, bond, inSlot}]}`.
2. Pôr um pet no espaço: `Sys.petSupport.setSupport(S,i,id)`. Para tirar: `setSupport(S,i,null)`. Os motivos de erro são `'locked'` (traz `need`), `'main'`, `'camp'` e `'pet'`.
3. Batalha: o vínculo do apoio já entra no HP do herói pelo `Sys.fc.stats` (`petBond`). Desenhar os 2 pets de apoio **atrás** do principal, menores e sem golpe (`Sys.petSupport.active(S)` = os ids que valem agora).

**Tela (estilo de hoje).** Na tela de Pets, acima da grade, uma faixa "Coleção: N pets · ATQ +x% · Vida +x%" (teto 5%). Ao lado do pet principal, 2 encaixes menores "Apoio".
- Encaixe trancado: cadeado com "Tenha 2 pets" ou "Tenha 3 pets".
- Ao tocar no encaixe, abre a lista dos pets (sem o principal) com "+x% Vida". O pet que está no acampamento aparece apagado, com "no acampamento".

## 4. Lista "Hoje" + "Pegar tudo" (`js/sys/today.js`, `Sys.today`)

**Regra:** junta numa lista o que dá para fazer agora.
- Linhas `kind:'claim'` (entram no **Pegar tudo**), nesta ordem:
  1. login do dia;
  2. correio com anexo;
  3. missões prontas (diárias, semanais e bônus);
  4. passe, **só a trilha grátis**;
  5. baús da atividade (depois das missões, porque os pontos saem delas);
  6. conquistas;
  7. marcos da Coleção;
  8. Acampamento;
  9. baús do mapa;
  10. Dupla (só sem o servidor; online, a tela usa o `Sys.duoNet`);
  11. baús de abate (até 20 por toque; com a mochila cheia ficam bloqueados).
- Linhas `kind:'go'` (só aviso; o toque abre a tela):
  - chaves das Instâncias;
  - entradas do Ladrão de Brasas;
  - picaretas da Escavação;
  - Brasas guardadas na Fogueira (as Brasas do offline já entram sozinhas pelo `Sys.bonfire.offline` na volta e aparecem aqui);
  - Relíquias que dá para subir.
- O "Pegar tudo" **nunca** gasta moeda, entrada, picareta ou Brasa, **nunca** começa luta e **nunca** pega a trilha premium do passe (mesmo comprada).
- Módulo ausente, desligado ou com erro é pulado.
- Não guarda nada no save.

**O que chamar:**
1. Botão "Hoje" no HUD, com o selo `Sys.today.badge(S,host)`. Acender o botão "Pegar tudo" quando `Sys.today.claimable(S,host) > 0`.
2. Painel: `Sys.today.view(S,host)` devolve `{on, items:[{id, icon, label, count, kind, tab, blocked}], claimable, badge}`. Ao tocar numa linha: `Panels.open(item.tab)` e, se não for painel, `host.goTab(item.tab)`. As abas são os nomes reais das telas (`inst`, `missions`, `battle`...; as antigas `instances`, `achievements`, `chest`, `bonfire`, `login` não abriam nada).
3. Botão "Pegar tudo": `Sys.today.claimAll(S,host)` devolve `{ok, n, by:{id:quantos}, left:[linhas que sobraram]}`. Mostrar o toast "Pegou N prêmios" e redesenhar o HUD (o módulo já chama `host.onChange()`).
4. Mochila cheia: o `Sys.host` ainda **não tem** `bagFull` (código em `LIGACOES_LOM_TELAS.md` 0.3). Com ele, os baús de abate ficam com `blocked:'bag'` (desenhar "Mochila cheia").

**Tela (estilo de hoje).** Folha que sobe de baixo, com o título "Hoje".
- Uma linha por item: ícone, texto, número à direita.
  - Linha `claim`: selo dourado.
  - Linha `go`: seta "›".
- No pé, o botão dourado grande "Pegar tudo (N)", apagado quando N = 0.
- Depois de pegar, as linhas `claim` somem e ficam só os avisos.

## 5. Testes

`test/sys/relics.test.js` (12), `test/sys/dig.test.js` (11), `test/sys/petsupport.test.js` (8), `test/sys/today.test.js` (9). Os testes do `Sys.pet`, do correio e do loot continuam passando. A `test/sys` inteira passa.
