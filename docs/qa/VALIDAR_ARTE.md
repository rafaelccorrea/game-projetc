# Portão G5 — "visto na tela" (como o QA valida arte)

Regra: arte só passa no G5 quando foi **vista no jogo rodando**, não no arquivo. Teste em node (`test/e2e`, `stagekit`) ajuda, mas não substitui o olho. Quem valida: QA. Quem corrige: Arte (número do .json, folha) ou Engenheiro (código), conforme o defeito.

## 1. Preparação (vale para todo tipo)

- **Só origem de teste** `127.0.0.2–.8:8080` ou `localhost:8080`, sempre com `?debug=1&fresh=1&skip=1` (`fresh` não grava save nem cria conta; `skip` pula o título). Nunca o save real (`eras_proto_v2`), nunca conta do dono ou da equipe.
- **Navegador:** uma aba só, fechar no fim do lote. Parar se a memória livre cair abaixo de ~2,5 GB (voltar acima de ~3,5 GB). Nunca porta 9222/9333 (celular do dono). Chrome da extensão pode não alcançar o servidor; nesse caso usar o headless do QA: `node test/resp/headless.mjs --qs="?debug=1&fresh=1&skip=1" --script=<arquivo.js> --shot=reports/qa/<item>/fim.png` (porta própria 47000–48999, perfil temporário; no script, `window.qaShot('nome')` salva um print).
- **Abrir a cena limpa** (colar depois da página carregar):
  `closeLoading(); if(typeof PI!=='undefined'&&PI.el) PI.finish(); endTut(true); S.welcome=true; Sys.level.ensure(S).lvl=60;`
  Só `S.tut=99` não basta; é o `endTut(true)` que para o tutorial.
- **Painéis:** `Panels.enable('<id>'); PANEL_V2.gate=false; Panels.open('<id>')` (ex.: `arena`, `pet`, `mount`). Forçar `view=` não abre a tela.
- **Larguras:** 320, 360 e 390 (e 288 como pior caso). No headless: `--size=320x640`, `360x780`, `390x844`. Cada tela deve caber sem rolagem lateral e sem texto cortado.

## 2. Chaves de comparação (URL e console)

| chave | efeito | uso |
|---|---|---|
| `?debug=1` | libera os ganchos `dbg*` e a tira de debug (ela cobre o rodapé, só em debug) | sempre |
| `&petaura=0` | desliga a aura dos pets | comparar com × sem |
| `&petfx=0` | desliga o golpe/efeito novo dos pets (volta ao antigo) | comparar o golpe |
| `&neck=0` | ignora a linha do pescoço do .json (procura antiga pelo vermelho) | arma sobre o rosto, novo × antigo |
| `&eras9=1` | libera eras 7–8 | tempo/cena de era alta |
| `dbgSet(era, arma, armadura, modo)` | põe era/arma/armadura; modo `boss`/`eb` chefe sozinho | arma e skin por era |
| `dbgMount(id, estrelas)` | monta a montaria | ex.: `dbgMount('phoenixm',3)` |
| `dbgWing('angel'\|'demon'\|null)` | põe/tira a asa | asa |
| `dbgDieAt(t)` | congela a morte em t segundos (0,3 / 0,8 / 1,6) | morte com asa/skin |
| `dbgHatchAt(t)` | ovo no instante t | pet novo |
| `dbgLvUp()` | NÍVEL +1 | efeito de nível |
| `dbgSkill(n)` | dispara a habilidade n (ultimate = 3) | ultimate |
| `dbgPvpAt(i)` / `dbgPvpUlt(lado,t)` | quadro da Arena / ultimate | Arena |
| `dbgSpeed`, `dbgResult` | velocidade e tela de resultado | luta |

Troca de herói e skin: `S.hero='kael'|'kaia'; refreshHero();` e armadura por `S.skinEq.armor='a<era><id>'` (ou pela tela Aparência).

## 3. O que conta como ✓ e ✗ (critério geral)

✓ somente se **todos** os estados abaixo forem vistos e nenhum falhar:
- **Cena:** aparece o desenho certo (nada de quadrado vazio, silhueta, "sem nada", imagem de outro item).
- **Estados:** parado, correr, golpe, giro (de costas), morte (Derrota), e o que o tipo tiver (ver §4).
- **Arma na mão** em todos os quadros do ataque e do giro; não flutua, não some, não atravessa o rosto.
- **Pés na base** (pedestal/chão), nada cortado nas bordas do quadro, sem "tampa" ou faixa solta.
- **Pet e montaria na ordem certa:** pet à frente; herói sobre a montaria; asa no lugar.
- **Sem emoji, sem preço em reais, sem texto cortado ou sobreposto** nas telas que o item aparece.
- **Larguras 320/360/390:** cabe, legível, botões ≥ 40 px.
- **Sem erro no console** (`read_console_messages` ou `onlyErrors`) ao abrir e usar.

✗ se qualquer quadro/estado falhar. Registrar **qual folha, qual quadro e qual tela**; "ficou estranho" não basta. Dúvida de gosto (tamanho/brilho da aura, por exemplo) vai como **"✓ com observação"** com captura para o dono opinar; só o dono reprova por gosto.

## 4. Roteiro por tipo

### 4.1 Skin (armadura/aparência do herói)
Telas: **Aparência** (vitrine), **Equipamento**, **Batalha**, **Derrota**, **Perfil**, **Arena** (lutador e adversário espelhado), **Invocar/Forja** quando mostrar prévia.
Estados: parado, correr, golpe, giro, morte, ultimate; **Kael e Kaia** (a skin fixa o herói; o corpo é o padrão, sem crescer).
Comparar: `&neck=0` × padrão (arma sobre o rosto: o rosto inteiro por cima da lâmina; nenhuma faixa do corpo cortada).
Extra: skin travada mostra o herói com ela + "Como ganhar" + botão que leva à tela certa; **nunca preço em reais**. Nada sensual e nada de aparência adulta nova (regra do dono).

### 4.2 Pet
Telas: **Pets** (lista, miniatura, palco animado, 3 estágios, "como conseguir"), **Batalha**, **Derrota**, **Aparência/vitrine**, **Ovo** (`dbgHatchAt`).
Estados: parado, correr, golpe, pulo, morte do herói; estágios 1, 3 e 5★ (aura a partir do evoluído/médio).
Comparar: `&petaura=0` e `&petfx=0` (golpe antigo × novo, captura lado a lado).
Critério extra: aura **atrás** do pet com a **base nos pés**; pet **à frente** do herói; o pet de "Em breve" não aparece como jogável (não é defeito).

### 4.3 Montaria
Telas: **Montarias** (vitrine = desenho da batalha), **Batalha**, **Arena**, **Perfil**, **Derrota**, **Equipamento** (miniatura).
Estados: parado (respira), correr, golpe, morte parada; estrelas 1–5 (aura por estrela ao tocar nas estrelas); Kael **e** Kaia montados.
Como abrir: `dbgMount('<id>', n)`. As 6 montarias da matriz (pônei, cavalo, lobo, grifo, mítica, wyvern) e as novas (fênix só em debug).
Critério extra: arma na mão montado, asa do herói no lugar certo, pet à frente, **pés/patas na base do pedestal sem cortar**, miniatura **sem a espada medieval pintada**.

### 4.4 Arma
Telas: **Equipamento**, **Forja** (auras +4/+7/+10/+13), **Invocar** (prévia), **Batalha**, **Aparência**.
Estados: parado, correr, golpe (todos os quadros), giro, morte; ultimate da era (`dbgSkill(3)`).
Como abrir: `dbgSet(era, arma, armadura)` e `dbgWeapon(era, tipo)`. **Usar arma de era diferente da 2** ao comparar (a da era 2 vem pintada na folha).
Critério extra: a arma ao vivo **troca** quando o item muda; a mão segura o cabo (grip) em todos os quadros; aura da Forja correta por nível.

### 4.5 Asa
Telas: **Batalha**, **Derrota**, **Equipamento/Aparência**.
Estados: parado, correr, golpe, giro, **morte** (`dbgWing('angel'|'demon'|null)` com `dbgDieAt(0.3/0.8/1.6)`), com e sem item de asa; Kael, Kaia, Ninja/Arlequina, Kael Anjo, Kaia Angelical.
Critério extra: asa **no lugar** (anotar quanto sobe/desce em px quando for a primeira vez de uma montaria nova), sem cortar na borda, sem atravessar o corpo na morte.

## 5. Como capturar a prova

- **Um print por estado** (parado, correr, golpe, giro, morte, tela de lista/vitrine), nas **3 larguras** quando for tela; lado a lado (novo × `neck=0`/`petaura=0`/`petfx=0`) quando a chave existir.
- Gravar em `reports/qa/<tipo>_<id>/` com nome `<estado>_<largura>.png` (ex.: `reports/qa/skin_kaia_base/golpe_360.png`). No headless, `window.qaShot('golpe_360')`.
- **Dono pede captura:** montar a comparação e mandar o caminho; nunca colar print de conta real.
- Defeito: anotar **sessão dona** (Arte: folha/quadro/número do .json; Engenheiro: código/tela), arquivo ou tela, passo para reproduzir, link do print.

## 6. Onde registrar na matriz

- `docs/ARTE_MATRIZ.md` (arte) e `docs/SISTEMA_MATRIZ.md` (sistema): a **coluna QA** (G5) da linha do item recebe **✓** ou **✗**, o **commit** testado, a **data** e o **caminho do print** (`reports/qa/...`). "✓ com observação" leva a nota curta.
- Item só fecha com G5 ✓ **no commit que vai para o jogo**; commit novo mexendo na folha do item reabre o G5.
- Mandar ao PO **uma linha por entrega**: item · ✓/✗ · commit · onde está o print.

## 7. O que o QA não faz

Não edita `index.html`, `js/*`, `assets/**` nem arquivos de outras sessões; não gera nem instala APK (é do Engenheiro, com ordem escrita do dono); não usa save real, conta do dono ou da equipe.
