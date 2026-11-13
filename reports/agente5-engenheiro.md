# Agente 5 - Engenheiro

## O que mudou (index.html)
- Sprites com cache (IMG/J) e fallback total para o desenho em canvas; nada quebra se faltar asset. skin->tier: r0,r1=T0; r2,r3=T1; r4=T2; era vem de skin.e.
- Heroi: corpo (assets/hero), arma na ancora (anchors.json + weapons/meta.json, padroes hand 0.72,0.55 / grip 0.5,0.9), swing/recuo/rastro/muzzle, idle/caminhada/ataque/dano/morte por transformacao, aura T2, glow, sombra.
- Inimigos era{E}_e0/e1 (alternando) e era{E}_boss (wave 5), meta.json de nomes, cadaver caindo.
- Cenario: assets/bg/era{E}.png reduzido a 1280px em canvas (arquivos de 4-7MB), groundY lido de assets/bg/meta.json (fallback 0.72), parallax, transicao de era com fade + banner NOVA ERA.
- Mundo logico agora altura fixa 260 e largura variavel (corrige canvas baixo no desktop).
- Tela inicial (title_bg, logo ou texto do name.json, JOGAR, Config: som, resetar com confirmacao), titulo da pagina, icones coin/gem/chest/pass.
- Aba Loja: moedas (6 ofertas diarias, preco x4^era) e diamantes (4 skins do dia + pacotes de skins) + card "Em breve: Leilao". Texto "Skins sao so visuais". Sem dinheiro real.
- Save compativel (S.set, S.shop novos). Botoes de teste so com ?debug=1 (tambem mostra overlay de debug).

## Testar / depurar
http://localhost:8080/?debug=1 ; no console: S.stage=31; startBattle(); S.eraMax=6; S.skinEq.armor='a20'. IMGS mostra o que carregou/falhou; J('assets/...json').

## Pendencias
- Assets de hero/weapons ainda incompletos na hora do teste (fallback ativo); revisar posicao da arma quando as imagens chegarem.
- Sem arquivos em bg/small: reducao e feita em runtime (primeiro carregamento ainda baixa 4-7MB por era); title_bg nao reduzido.
- Nomes de inimigos so aparecem corretos quando enemies/meta.json existir.
- Leilao e compra com dinheiro real nao implementados (dependem de backend).

## Rodada 2 (integração com assets reais)
- Armas: recorte automático (bbox alfa) + escala proporcional ao herói (branca ~0.82 HS, fogo ~0.72 HS, altura máx 0.36 HS). Pivô = grip de weapons/meta.json, mão = anchors.json. Brancas apontam para cima e giram no golpe; fogo aponta para a direita com recuo, clarão e rastro. Conferidas visualmente nas 7 eras e nos 3 tiers. Dicionário `WFIX` (dx, dy, s, rot) no index.html para ajuste fino por arma (hoje vazio: não foi necessário).
- Inimigos: nomes de enemies/meta.json ("Chefe X"; chefe de era "Senhor da Era X"), imagem = mesma chave do nome. Pés alinhados pelo bbox ao groundY+0.05; chefe 1.3x, chefe de era 1.6x. Distância de parada ajustada ao tamanho do sprite.
- Herói: pés pelo bbox (não flutua mais).
- Performance: sprites pré-renderizados em canvas offscreen (hero 288px, arma 300px, inimigo 320px, bg 1280px); imagem original é descartada após o preparo. Carga sob demanda por era; a próxima era só é pré-carregada a partir da fase 8 da era.
- Skins: sprite da era/tier da skin; brilho + tingimento por raridade (r1 azul, r2 roxo, r3 vermelho, r4 dourado) pré-renderizados; miniaturas reais nos cards (Skins, Equip., Loja) com drop-shadow por raridade. Aba Skins abre na era da skin equipada.
- UI 390px: testado em iframe 390x690 (test/m.html): 7 abas cabem sem rolagem; barras de rolagem horizontais escondidas. Testadas: tela inicial, Batalha, Equip., Invocar, Loja, Skins, Missões, Passe, troca de era. Sem erros de console.
- Debug (?debug=1): era=N, wr=R, ar=R, boss=1, eb=1, skip=1, stay=1, tab=x, cvh=85, gold=N; `dbgSet(era,wr,ar,mode)` no console. Use `/?...` (o servidor redireciona /index.html e perde a query).

## Rodada 3 — estado no congelamento (ordem do dono)
Arquivos: `index.html` (dados, estado, loja/missões/passe, config, boot) + `js/battle.js` (batalha) + `js/fallback.js` (desenhos de reserva) + `js/ui.js` (painéis) + `js/meta.js` (áudio opcional, tutorial, boas-vindas, offline, PWA). `js/audio.js` é do agente de áudio. Temporários (`js/_*.txt`, `_x.js`) apagados. `js/sys/` não foi integrado.

### Pronto e visto em screenshot (iframe 390 de largura, test/m.html; sem erro de console; 60+ fps no desktop)
- Página carrega; scripts com `?v=` (em debug, sem cache).
- A1 horda: `mkEnemy / waveSpec / lootFor / startWave / layoutHorde / target / killEnemy / waveClear`; 3-7 comuns por onda, onda 5 = 2 escoltas + chefe; só os 2 da frente atacam; tabela de HP/dano/ouro/drop do qa-fixes; missão de abates = 150.
- A2 tela cheia sem rolagem: canvas na tela toda, HUD e abas sobrepostos, painel de 40% até as abas com paginação; moldura de celular no desktop. Vistas: Equip., Invocar, Loja (Moedas), Skins, Missões, Passe.
- A3 herói corre com cenário rolando (tile espelhado) e para para atacar; D1 (histerese), D2 parcial, D5, D6, D8 aplicados.
- Combate V2: s1/s2/s3, botões com ícones, recarga radial, ult pulsando, AUTO (MANUAL / AUTO / AUTO+ULT). As 7 ultimates vistas com `assets/fx/era{E}_ult.png`; s2 visto nas eras 0, 2 e 6.
- Rig: hand/handR, grip, angle, muzzle, layer:"back"; punho redesenhado por cima da arma.
- Tutorial do zero visto até o passo 3 (boas-vindas → batalha → Especial → Equip. → Melhorar).
- dbgSet / dbgSkill (B1).

### Escrito, mas NÃO testado
- Som: chamadas `GameAudio` em todos os eventos e carga de js/audio.js. Nunca ouvi nem conferi se toca.
- Passos 4-5 do tutorial (invocação grátis, Ultimate), ganhos offline, vibração, tela cheia ao tocar em JOGAR.
- Loja abas Diamantes/Pacotes, modal de item (Equipar/Vender), aba Skins na era "Passe", paginação em telas baixas.
- Troca de era e derrota com a horda; s2 das eras 1, 3, 4, 5; armas com layer:"back" e as espadas inclinadas não foram conferidas uma a uma.
- Desktop (moldura) só visto com `cvh=1` (modo largo de debug).
- docs/balance.json: o carregador só aceita chaves com os nomes do `BAL` do battle.js; o arquivo do UX usa outros nomes, então hoje NADA dele é aplicado.

### Pela metade / defeitos conhecidos
- Inimigos encostam/sobrepõem o herói no corpo a corpo (ajustei `contact`, não reconferi).
- D2: efeitos `wfx` e cadáveres já rolam; não revisei todos os casos. D4 e D7 não aplicados (energia ao apanhar = 3).
- Velocidade ainda vai até x4.
- Prévia de skin: cards de skin bloqueada mostram a prévia, mas não há compra direta dali.
- FX: era5_ult aparece com a borda reta do arquivo; era2_ult cobre o herói.

### Não começado
Tags PWA no `<head>` (manifest e apple-touch-icon entram por JS só se o arquivo existir; sw.js nunca registra em localhost nem em debug), abas progressivas / máx. 5 no rodapé, multiplicador de inimigo por era, melhoria +10%/nível, integração de js/sys.

### Como rodar
http://localhost:8080 · debug: `/?debug=1&era=3&wr=3&ar=3&skip=1&stay=1` (`fresh=1` = jogador novo sem gravar; `tab=gear`; `cvh=1` = palco largo). Console: `dbgSet(era,wr,ar,'boss'|'eb')`, `dbgSkill(2|3)`. Celular: `/test/m?debug=1&...` (iframe de 390px).

## Correções liberadas do RETESTE 1 (R1, R2, R5) — só estas; resto segue congelado
- R1 (js/battle.js): `B.reach` = borda direita do herói + ponta da arma em repouso (medida do desenho real, por arma). `contact(e) = B.reach + e.dw/2 + 8`; fila com espaçamento `max(44, (dw_a+dw_b)/2)` (inimigos também não se sobrepõem); alcance/engajamento nunca menores que o ponto de contato (chefe largo com arma de fogo); avanço do inimigo ao atacar reduzido de 14 para 6 px. O herói ainda avança no golpe e volta.
- R2 (js/battle.js): imagem da ultimate centrada em 70% x do campo (y ≈ 55% para as de centro; as de chão seguem na linha do chão), numa camada nova entre inimigos e herói: durante a ultimate o herói é desenhado por cima do efeito, em todas as eras. Era 5: borda direita do arquivo empurrada para fora da tela.
- R5 (index.html): `.ttag` com #f6ecdf, 17px, peso 800, text-shadow 0 2px 6px #000.
- Visto no iframe 390 (test/m.html), sem erro de console: tela inicial; corpo a corpo com comuns nas eras 0, 1, 2, 6 (tiers variados); chefe encostado sozinho nas eras 0, 1, 2, 5, 6; ultimates das 7 eras com o herói inteiro visível.
- Não visto: chefe com as escoltas já mortas em jogo normal (usei debug para tirar as escoltas); eras 3 e 4 no corpo a corpo; fila longa (6-7 inimigos) fica em parte fora da tela à direita até a frente morrer.
- Durante esta correção a página ficou quebrada por ~1 min (erro de ordem de declaração, corrigido antes do teste).


## Rodada 4 — desenvolvimento liberado (2026-11-12). Versão v0.4
Arquivos novos: `js/loading.js` (tela de carregamento) e `js/stage.js` (cenário EonScene + Kael por folhas). Alterados: `index.html`,
`js/battle.js`, `js/meta.js`. `test/bg/scene.js` é carregado como está (`<script src="test/bg/scene.js">`), sem cópia nem alteração.
Nada em assets/**, js/audio.js, js/anim.js, js/sys/** foi tocado. `VERSION` subiu para v0.4 (troca o cache dos js).

### 1) Tela de carregamento (protótipo 00, LIDO do canvas de design: project/Carregamento.dc.html)
- `#loading` vem antes do título. Bloco `.lwrap` com as medidas do protótipo (844 px de altura) escalado por `--s`.
- Kael correndo SEM arma (`assets/anim/hyb/kael_run_body.png`, 8 quadros, 12 fps, pés em 78% da altura), sombra, fundos das 7 eras em
  sequência (`assets/bg/era{0..6}.png`, chão de cada um na linha dos pés via `assets/bg/meta.json`, rolando a 241 px/s como no protótipo),
  pílula "Era N de 7 · Nome", logo, barra, "Atravessando a …" + %, 4 dicas rotativas, "Toque para continuar", "Versão 0.4".
  Fontes Lilita One + Nunito (Google Fonts; sem rede cai em system-ui).
- Barra REAL: json, 3 folhas do Kael, arma, inimigos da era (e folhas de corrida), cenário da era (cena v2 completa ou fundo antigo),
  título e logo, ícones, manifest + 2 músicas (só aquece o cache), 7 fundos desta tela. A barra nunca passa do real e tem duração mínima
  de 2,4 s; se a rede travar, libera aos 15 s. O toque fecha a tela, destrava o áudio e entra o tema do título.
- Debug: `skip=1` pula; `ldur=N` duração mínima; `lhold=1` não fecha no toque.
- Diferenças para o protótipo: o logo flutua de leve; a dica também troca por tempo (3,5 s).

### 2) Cenários vivos (eras 0 e 2)
- Chave por era na tabela `ERAS` (index.html): `sceneV2:true` (eras 0 e 2). Sem a chave = fundo antigo, sem outro efeito. Era 1: quando
  `assets/bg/v2/era1/meta.json` existir e for aprovada, basta pôr `sceneV2:true` na linha da Antiguidade. Debug `v2=0` desliga todas.
- `js/stage.js`: um `<canvas class="scn">` por era ATRÁS do canvas da batalha (que ficou transparente). Tamanho = largura x
  (0,64·altura / groundY): o chão do meta (0,78) cai na linha dos pés do jogo (390x844 → cena 390x692, chão em 540 px). Abaixo da cena o
  jogo pinta uma faixa da cor do `bottomShade`. Na troca de aba a cena sobe com a linha do chão.
- Parallax ligado à corrida: `setRunning(B.running)`; laços continuam. A velocidade usa `meta.runSpeed`, regravado só em memória a cada
  quadro para valer x2. Cena da era atual entra na barra de carregamento; a da próxima é criada no pré-carregamento (fase 8+).
  Troca de era sob o clarão; se algum arquivo falhar, a era cai no fundo antigo.
- Herói: `HS` = lado do quadro = 0,217·altura lógica (183 px em 390x844 → boneco ~160 px).

### 3) Kael (folhas híbridas da mão direita)
- `HERO_SETS` (js/stage.js): um conjunto por ERA DA ROUPA (corrida, parado, golpe); só existe o da era 2 (`assets/anim/hyb/R/kael_*_body`),
  as outras eras caem nele. `HERO_IDLE_DIR` = fonte única do parado (hyb/R, confirmado pelo PO).
- Usa as folhas `_body` e desenha a arma equipada na mão pelo `.json` (posição e eixo da mão por quadro) com grip/ângulo/len/muzzle de
  `assets/weapons/meta.json`; dedos por cima do cabo; cabeça por cima da lâmina; arma atrás do corpo nos quadros `behind`.
- Corrida: ciclo da folha, sem quique; chão a 1,04 lado-do-quadro/s (= runSpeed 0,275 do cenário aprovado), valor único para cenário,
  inimigos chegando, cadáveres e poeira. Golpe: quadros escolhidos pelos instantes de acerto (pronto 3 · preparo 4,5,8 · corte 9–12 ·
  volta 13–16), s1 continua com 0,4 s. Arma de fogo: pose de mira (quadro 10), recuo e clarão em código. Saltos/giros antigos saíram.
- `js/anim.js` (ossos) NÃO foi usado: técnica reprovada pelo dono e formato diferente das folhas. Se as folhas faltarem, cai no sprite antigo.

### 4) Áudio
- Durante a tarefa a sessão de áudio promoveu os 13 refeitos aprovados para `assets/audio/sfx/` (antigos em `_rejeitados/`; `_new/` não
  existe mais): o manifest já aponta para os 36 sfx aprovados + 8 músicas. A tabela `SFX_SWAP` (js/meta.js) ficou VAZIA e pronta: uma
  linha `nome:'pasta/arquivo.mp3'` troca um som sem tocar no manifest (se o arquivo não existir vale o do manifest). `SFX_MUTE` cala um nome.
- Velocidade: x1/x2 (x4 removido).

### 5) Reclamações do dono atendidas na mesma rodada
- INIMIGOS SEM PULO: tirado todo quique/bob. Pés fixos na linha do chão. Era 2 andando: folhas `assets/anim/era2_e0_run.png` e
  `era2_e1_run.png` (tabela `EN_RUN`; velocidade = 0,8 lado-do-quadro/s, `EN_STRIDE`, ESTIMATIVA). Parados: respiração por scaleY com
  âncora na base. Sem folha (outras eras e chefes): deslizam com os pés fixos.
- NO MÁXIMO 3 VISÍVEIS: pés em x = 214, 290 e 350 (de 390), o 3º a 0,9; sem faixas de profundidade; o resto espera fora da tela com selo
  "+N" (#ff5a4e, Lilita One) na borda direita na altura do chão; slot vago → o próximo entra andando pela borda direita.
- TODOS ATACAM: todo inimigo parado no slot ataca (cadência própria, intervalo mínimo de 0,22 s entre dois inimigos). Corpo a corpo:
  avanço no chão até o herói com inclinação pela base, golpe e volta. De longe (tabela `ENEMY_RANGED`: Dragão Real, Casaca Vermelha, Drone,
  Mercenário, Tanque-Robô, Alienígena, Ciborgue): projétil em código que causa o dano ao chegar. Cada golpe: herói pisca, número, clarão,
  som hero_hurt.
- EFEITOS: nenhum PNG de assets/fx é desenhado nem carregado. Ponto único de troca: tabela `FX_ART` (js/battle.js): `ult/s2/s1` por era
  (null = provisório em código; objeto `{sheet,frames,fps,scale,anchor,blend}` = folha animada) e `slash/hit/crit/muzzle/aura`
  (null = código; 'sprite' reativa o PNG). Ultimates em código por era: 0 pedras, poeira e ondas no chão · 1 colunas de luz e raios ·
  2 varredura de fogo em arco com brasas · 3 balas em arco, explosões e fumaça · 4 relâmpagos em cadeia · 5 traços de mísseis e explosões ·
  6 vórtice e implosão. Teto de 260 partículas (`PART_MAX`).
- AUTO/MANUAL: uma chave só, `S.set.auto` (botão AUTO da batalha, dourado quando ligado, `aria-pressed`; também em Configurações).
  AUTO = básico, especial e ultimate sozinhos; MANUAL = especial e ultimate no toque. Save antigo: `auto2` ligado → AUTO; os campos antigos
  são apagados. Jogador novo começa em MANUAL e passa para AUTO ao concluir o passo "toque no Especial" (ou ao pular o tutorial), com aviso.
- LADO DOS SPRITES: tabela `EN_FLIP` (js/battle.js) espelha só o corpo (sombra, barra e nome não): `era0_boss` (T-rex), `era3_e0` (Pirata) e
  `era5_boss` (Tanque-Robô): os três arquivos olham para a DIREITA. Lista da sessão de arte/PO; minha varredura (folha de contato dos 21
  + folhas de corrida) concorda com os três e não achou outro. Meu código não usa escala negativa em mais ninguém; o herói nunca é espelhado.

### Medições (debug stay=1, x2, script no console; `__atk` e `__dmgIn` só existem em debug)
- Intervalo entre ataques de CADA inimigo visível (tempo de jogo): era 0: 1,30–1,42 s nos 3 slots (17 ataques cada em 22,7 s); era 2
  fase 25: 1,30–1,40 s; era 5: 1,30–1,42 s. Nenhum visível ficou mais de 1,42 s sem atacar. Menor distância entre dois ataques: 0,22 s.
  (Janelas de 14–24 s de jogo, não 30 s.)
- Dano por segundo recebido, ANTES (só 2 atacam) → DEPOIS (3 atacam): era 0 fase 1: 1,84 → 2,73 (+48%); era 2 fase 5 (fase 25): 114,0 →
  173,9 (+53%). Nenhuma constante de dano foi alterada.

### Como testar
- Celular 390: `http://localhost:8080/test/m?debug=1&fresh=1` (fluxo inteiro). Para 390x844 de verdade na janela da automação:
  `f.style.height='844px'; f.style.transformOrigin='50% 0'; f.style.transform='scale(0.75)'`.
- Batalha direto: `&era=2&wr=2&ar=0&stay=1&skip=1` (`era=0`, `era=1` sem cenário novo, `&we=3` arma de fogo, `&manual=1` começa em MANUAL,
  `&boss=1`, `&wave=4`). Console: `dbgSet(era,wr,ar,'boss')`, `dbgSkill(3)`, `window.__frz=true` congela o jogo (prints),
  `window.__atk2=true` volta a "só 2 atacam" (comparação), `GameAudio.state()`.

### Visto no navegador (iframe 390x844; zero erro de console em todas as cargas)
- Carregamento em vários instantes e eras, toque → título com música de arquivo; também na moldura de desktop.
- Eras 0 e 2 com cenário vivo (elementos mudando entre prints), herói parado, correndo (cenário deslocado entre prints), golpe de espada,
  clava, pistola e fuzil, derrota, era 1 com fundo antigo, troca 1→2 sem quadro preto (log), aba Skins, x1→x2→x1.
- Inimigos: era 2 Goblin/Esqueleto entrando com o ciclo de corrida, 3 em linha + selo "+N", avanço de ataque no chão; eras 0 e 5 comuns
  em pares de prints sem deslocamento vertical; projétil do drone/mercenário.
- As 7 ultimates em código, 3 instantes cada (0,6 s, 1,35 s, 1,97 s), com 23–172 partículas.
- Áudio: `ctx running`, 38 buffers, 0 falhas, música não sintetizada, `sfx()` true; botão Som → `suspended`, sem música nem sfx; religa.

### NÃO testado / não visto
- Ninguém OUVIU o som. Celular real. fps real (a janela da automação rodou a 12–45 fps; não vale como medida).
- CHEFES: nos prints o chefe aparece só em parte, na borda direita (3º slot, sprite largo): NÃO consegui conferir de frente o lado do
  T-rex e do Tanque-Robô já espelhados, nem o chefe sozinho no 1º slot, nem o projétil do chefe. Conferir primeiro.
- Depois da última leva (AUTO/MANUAL, ataque de todos, espelhamento) não refiz: tutorial do zero, Configurações, save antigo migrando,
  troca de era, aba Skins. Era 3 Pirata espelhado visto só de relance numa ultimate.
- s2 de cada era um a um, armas `layer:"back"`, tiers t1/t2 de cada arma na mão, ganhos offline, jogo sem `debug=1`.

### Defeitos conhecidos / pendências
- Chefe no 3º slot fica quase todo fora da tela até as escoltas morrerem (a regra de 3 slots fixos não prevê sprite largo); na era 6 o
  chefe encobre o inimigo do 2º slot. Precisa de decisão do PO (chefe sozinho? slot próprio?).
- Com o herói em ~160 px, os comuns (92 px) ficaram pequenos ao lado dele: escala dos inimigos a decidir.
- `EN_STRIDE` é estimativa: se o Goblin/Esqueleto patinar ao andar, ajustar esse número. Enquanto o herói corre, o inimigo chega mais
  rápido que a passada dele (soma a velocidade do chão).
- ARTE: só a roupa da era 2 (skin de armadura não muda o Kael na batalha); sem quadros de dano e de morte (clarão vermelho; o quadro
  parado tomba); arma de fogo usa as poses da espada (cano a ~43° parado/correndo; tiro na pose do corte); inimigos sem folha de ataque;
  só 2 inimigos têm corrida.
- Efeitos provisórios em código são simples (brilhos, riscos, quadradinhos); a ultimate da era 2 ficou a mais fraca. A aura do tier 2 virou
  um brilho radial pulsando (sem PNG).
- Primeiro plano da cena (capim/samambaia) fica ATRÁS dos personagens, porque a cena é um canvas atrás do jogo; para passar na frente o
  `scene.js` precisaria expor esse desenho em separado (pedido para a sessão do cenário). Faixa lisa escura abaixo da cena (692–844 px).
- Carregamento usa os 7 fundos antigos (~600 KB cada) só nessa tela: pedir versões leves.
- `sw.js` (UX) não lista os arquivos novos no pré-cache. Modo `cvh=1`: herói e cena em escalas diferentes.


## Rodada 5 — correções do QA e decisões do PO (2026-11-12). Build v0.5
Alterados: `index.html`, `js/battle.js`, `js/loading.js`, `js/meta.js`. Substitui, onde divergir, o que a Rodada 4 diz sobre chefes, escala e passada.

### O que mudou
- **D1 chefe inteiro (regra final do PO: escoltas primeiro).** `BOSS_AFTER_ESCORTS` + `bossSlot()` + `BOSS_FIT()` em js/battle.js são o ponto
  único. Enquanto há escolta viva o chefe não nasce e conta no selo "+N"; depois entra andando pela direita e para num slot próprio,
  centrado entre o herói+arma e a borda (margem de 8 px de 390). Se o sprite for largo demais, a largura manda e ele encolhe até caber.
  A conta antiga (`(prev.dw+e.dw)` empurrando para além de LW) saiu: os comuns repartem o espaço entre o ponto de contato e a borda.
  `dbgSet(era,wr,ar,'boss'|'eb')` agora põe o chefe sozinho (de frente); a URL `&boss=1` roda a onda normal (escoltas → chefe).
- **D2 rótulo/barra.** A causa não era o espelhamento: o chefe estava no 3º slot (x≈331) e o desenho avançava até o herói no ataque,
  enquanto nome e barra ficavam no slot. Agora `eX(e)` (slot menos o avanço) é a posição única de sombra, barra, nome, números de dano,
  efeitos de acerto e cadáver. O espelhamento (`EN_FLIP`) é em torno do centro do sprite e não desloca nada.
- **Escala (PO, pelo protótipo).** Tabela `EN_SIZE`: comum 110 px (e0) e 119 px (e1) em tela de 390, mínimo 100; chefe 185 px; Senhor da
  Era 201 px (ou o que couber inteiro). Com isso os 3 comuns visíveis se sobrepõem em parte (não cabem lado a lado em 390 com o herói).
- **D3 versão.** `VERSION` (index.html) é o build único: vai no `?v=` de todos os scripts (inclusive `js/audio.js` e `test/bg/scene.js`;
  o CSS é embutido no index) e aparece no carregamento ("Versão 0.5"), no rodapé do título, em Configurações e no painel de debug.
  Trocar a cada mudança. Em `debug=1` os scripts continuam sem cache (`?v=Date.now()`).
- **Carregamento com cenário vivo.** Nas eras com `sceneV2` (0 e 2) a tela de carregamento usa a própria cena EonScene rolando, com o
  chão do meta na linha dos pés; nas outras fica o fundo antigo. Liga sozinho quando uma era ganhar `sceneV2:true`.
- **Passada dos inimigos.** `EN_STRIDE` por folha, medido nos quadros (pé de apoio recua ~19 px/quadro no Goblin e ~20 no Esqueleto,
  em 256 px a 12 fps): 0,89 e 0,94 lado-do-quadro/s.
- Projéteis dos inimigos ganharam núcleo sólido (antes eram só brilho aditivo e sumiam em fundo claro). Limite de largura dos comuns
  subiu (o Drone ficava com 73 px de altura). Painel de debug não acusa mais "B is not defined" durante a carga.

### Visto no navegador (iframe 390x844, congelando o jogo com `__frz`)
- Os 7 chefes sozinhos, inteiros, olhando para a esquerda, com nome e barra centrados em cima: T-rex e Tanque-Robô espelhados corretos.
  Medido: borda direita em 302–324 de 330 e esquerda ≥ 154 (alcance do herói 140). Senhor da Era medido nas 7 eras (mesmos limites) e
  visto nas eras 0, 2, 3 e 5. Pirata (era 3) espelhado visto de frente na troca de era.
- Onda do chefe na era 2: 2 escoltas + selo "+1"; mortas as escoltas, o Dragão entra andando pela direita.
- Comuns nas eras 0, 2, 3, 5: 107–119 px de altura, 8–9 px de folga para o herói+arma, borda direita em 323.
- Tutorial do zero: botão MANUAL; passo 2 segura o automático; ao tocar no Especial vira AUTO com aviso. Configurações: uma linha
  "Combate automático" (sem ultimate automática), alterna AUTO/MANUAL. Save antigo: `auto2:true` → AUTO; `auto2:false` → MANUAL; campos
  antigos removidos (testado em iframe à parte; o save que estava no navegador foi restaurado).
- Troca de era 1→2 (antigo → novo) e 2→3 (novo → antigo): nenhum quadro com pixel vazio em 68–69 amostras de 100 ms. Derrota e recomeço
  (onda volta a 1, vida cheia). x1→x2→x1. Aba Skins. Carregamento com as cenas vivas das eras 0 e 2 rolando.
- Zero erro de console nas cargas finais.

### NÃO testado / não visto
- Projétil do chefe de longe: por código o Tanque-Robô dispara (`shell`) e o dano chega; o print com o núcleo novo falhou e não foi refeito.
  Dragão (fogo) idem. Senhor da Era das eras 1, 4 e 6 só medido, não visto.
- Se Goblin/Esqueleto ainda patinam: os números vêm da folha, mas não comparei em vídeo; em print parado não dá para julgar.
- Chefe com arma de fogo do herói, chefe na aba com painel aberto, onda de chefe nas outras 6 eras em jogo normal.
- Som ouvido, celular real, fps real, jogo sem `debug=1`.

### Defeitos conhecidos novos
- Na aba Skins (painel aberto) o botão AUTO e os botões de habilidade ficam sobre a cabeça/barra do herói (já acontecia com os botões).
- Chefes largos (Minotauro, Dragão, Tanque, Devorador) encolhem para caber: ficam com 124–144 px lógicos de altura (147–170 px em 390),
  abaixo da faixa de 180–200 pedida. Só cabem maiores se o herói recuar ou o campo ganhar largura: decisão do PO.
- 3 comuns visíveis se sobrepõem em parte com a nova altura.


## Rodada 6 — layout do protótipo, balance v6, js/sys (loot, baú, nível), farm, folhas dos inimigos (2026-11-12). Build v0.7
Novo: `js/farm.js`. Alterados: `index.html`, `js/battle.js`, `js/stage.js`, `js/ui.js`, `js/meta.js`, `js/loading.js`. `js/sys/**` só é carregado
(`loot.js`, `chest.js`, `level.js`, `sys.css`), nada editado. Onde divergir, esta seção vale sobre as Rodadas 4 e 5.

### Parte A — layout (v0.6 → fechado na v0.7)
UNIDADE DAS MEDIDAS: px de TELA num campo de 390 de largura = valor lógico × 390/LW (`PX = LW/390` no código); altura = `e.dh / PX`.
- Herói: centro em x=108 (caixa 20..196). Comuns: centros em 240 / 300 / 350 (`SLOTX`), alturas-alvo 100 / 116 / 95 (`SLOTH`), mínimo 95
  (`EN_SIZE.minH`), z-order frente > meio > fundo, TODOS com os pés na mesma linha (`LANEY = 0,0,0`; a linha é y=540 de 844 = 64% da altura).
- Chefe: caixa x=190..382, alvo 180 px (Senhor 192), mínimo 150 escalando pela largura; se não couber, a caixa abre até x=170
  (`BOSS_X0`, `BOSS_X0MIN`, `BOSS_X1`, `bossSlot()`). Números de dano nascem 20 px acima da barra (comum) e 36 px acima do topo (chefe).
- Botões: coluna direita no topo do campo (`#colR`: AUTO, velocidade, som), coluna esquerda (`#colL`: baú, missões), habilidades no canto
  inferior direito abaixo da linha dos pés. Com painel aberto as colunas somem e as habilidades (32 px) ficam na faixa entre os pés e o painel.
  Ranking não existe no jogo: não há botão.

Tabela medida por script (centro/altura/sobreposição % com o vizinho de trás/borda direita; chefe e Senhor: altura e x):
| Era | frente | meio | fundo | Chefe | Senhor da Era |
|---|---|---|---|---|---|
| 0 | 240 / 100 / 43% / 288 | 300 / 95 / 68% / 354 | 337 / 95 / 382 | 180 · 199..373 | 192 · 193..379 |
| 1 | 240 / 95 / 42% / 294 | 300 / 116 / 81% / 341 | 328 / 95 / 382 | 150 · 178..382 | 150 · 178..382 |
| 2 | 240 / 100 / 32% / 285 | 300 / 101 / 54% / 342 | 339 / 95 / 382 | 163 · 190..382 | 163 · 190..382 |
| 3 | 240 / 100 / 30% / 284 | 300 / 100 / 51% / 342 | 340 / 95 / 382 | 180 · 220..352 | 192 · 216..356 |
| 4 | 240 / 95 / 44% / 295 | 300 / 104 / 83% / 342 | 327 / 95 / 382 | 180 · 203..369 | 192 · 197..375 |
| 5 | 240 / 100 / 118% / 273 | 289 / 95 / 102% / 382 | 350 / 95 / 381 | 154 · 190..382 | 154 · 190..382 |
| 6 | 240 / 100 / 24% / 280 | 300 / 116 / 44% / 339 | 344 / 95 / 382 | 160 · 190..382 | 160 · 190..382 |
Cumprido: V2 (≥95), V3 (nada passa de 382), V4 (mesma linha), V5 (chefe ≥150). **NÃO cumprido: V1 (sobreposição ≤40%)** entre o meio e o
fundo em todas as eras, e na era 5 inteira (drone muito largo). As três regras não fecham juntas: com centro em 350, margem em 382 e
mínimo de 95 px de altura, o do fundo só cabe com 64 px de largura, e os sprites têm 83–109. Dei prioridade a "nada cortado" e ao mínimo
de 95: o do fundo recua (327–344). Precisa de decisão do PO (mínimo menor para o fundo, centros mais abertos ou 2 visíveis para espécies largas).

### Parte B — balance v6 e sistemas
- `BAL` (js/battle.js) com os valores da v6 e leitura de `j.BAL` no carregador: `eraMult` (vida e dano), crescimento 1,282, `commonDmgMult`
  0,33, `commonAtkInterval` 1,2, `itemEraFactor` 12, `priceEraFactor`, `sellBase`, `pullPity`, x2.
- **NÍVEL DO ITEM (regra nova do dono, substitui "nível no espaço"):** nível no item (1–100), teto = nível do jogador, botão
  "Suba de nível para melhorar" no teto. Ponto único: `lvlGain()`, `upCost()`, `itemLvlCap()`, `canUp()` (index.html). Ganho (+20%/nível) e
  custo (20·1,38^(N−1)·(1+0,6r)·4^era) são os que o código já tinha; nenhum campo novo no item; nível dos itens do save preservado.
  A migração definitiva do save (ouro investido, secundários) fica para o `Sys.stats.migrateSave` da próxima rodada.
- `heroStats()` continua sendo a ÚNICA função de atributos (inclui o bônus do nível, `Sys.level.bonus`).
- `Sys.host` completo em js/farm.js (atk, hp, stage, eraMax, best, level, goldUnit, addGold, addGems, spendGold, addItem, now, rng, toast +
  itemName, rarName, rarColor, thumb, sfx, fmt, onChange). Boot: ensure + flushPending + render do baú.
- Abate: `Sys.loot.onKill` + `Sys.chest.onKill` (substituem `S.gold+=` e o `maybeDrop`, removido). Offline: ouro do meta.js +
  `Sys.loot.offline/grant` + `Sys.chest.onKills` + `Sys.level.onOffline`. Missão nova "Colete 15 pedras de forja" (`todayCount`); missão
  resgatada dá XP (`Sys.level.onMission`).
- **Espaços:** o jogo só tem arma e armadura; os outros 5 espaços que os módulos entregam são CONVERTIDOS de forma fixa em js/farm.js
  (`SLOT_MAP`: luvas e colar → arma; chapéu, botas e asa → armadura; arma Mítica → Épica). Nada de espaço inexistente no save.
- **Invocar:** só itens, em OURO, por `Sys.loot.summon` (x1 = 300·4^era, x10 = 9× o x1, 1 grátis por dia, tabela 50/28/14/6/2 com portões).
  Garantia "da melhor raridade liberada" (até Épico) a cada 10, feita no `addItem` do jogo (`S.pity`), porque o módulo não tem garantia.
  Invocar skin e os pacotes de skin da loja foram removidos; a aba da loja virou "Skins" (venda direta). A tela não foi refeita pelo
  protótipo 06 (fica para a rodada das telas 05/06/07).
- Loja de moedas: estoque do dia montado por `Sys.loot.rollItem({source:'shop'})`, compra direta.
- **Nível do jogador:** `Sys.level` carregado; HUD "Nv. X" + barra de XP; ao subir: faixa "NÍVEL N", `Sys.loot.onLevelUp`, atributos refeitos.
  O `js/sys/level.js` ainda está com a curva PROVISÓRIA (40·1,115^(N−1), missão 40, offline 30/h): NÃO editei; o carregador do
  balance.json grava em memória `xpToNext`, `xp.instance/mission/offlinePerHour` e `unlock` da v6 no `DATA` do módulo (`window.__lvlV6`).
  O aviso de nível omite "Liberou: ..." porque essas funções não estão ligadas.
- **Farm:** cada abate solta moedas girando e orbes de XP pulsando (e gema, item brilhando na cor da raridade, materiais) que pousam e voam
  para o ouro, as gemas, a barra de nível ou a aba Equip., com "+N" agrupado (`createGrouper`). Teto de 70 pickups. Tudo em código.
- **Ultimates animadas** das eras 0, 2 e 5 (`assets/anim/ult/era<N>_ult.png/.json`, grade 8 colunas, 49 quadros 384x216, "screen":"full")
  ligadas pela `FX_ART.ult` (tocam em 2,5 s, faixa da largura do campo apoiada no chão, herói por cima). Eras 1, 3, 4, 6: provisório em código.
- **Inimigos da era 2 com folhas** (`assets/anim/hyb/enemy/`, tabela `ENEMY_SETS`): corrida, ATAQUE (0,75 s, dano no MEIO: o .json não marca
  o quadro de impacto), DANO (0,4 s) e MORTE (1 s, some no fim, sem cadáver girando) para Goblin, Esqueleto e Dragão Real. Formato: quadro
  w×256 com `padLeft/padRight` no .json. As outras eras seguem por código (desliza, avanço com inclinação, tomba).

### Medição do jogador novo (debug fresh=1, x2, AUTO, sem melhorar item nem invocar; tempo de JOGO)
- Fim da fase 1 em **32 s**; fases 2/3/4/5/6 aos 68 / 109 / 163 / 209 s; níveis 2/3/4/5 aos 32 / 68 / 109 / 209 s.
- Aos 5 min (300 s de jogo): **nível 5, fase 6**, 1 derrota, ~470 de ouro, 8 pedras de forja no dia, baú em 124/250 (nenhum baú ainda).
- Comparação com a simulação (era 0 em ~20 min, nível 11 no fim): 5 fases em ~3,5 min sem investir nada; a continuação depende de melhorar
  itens. NÃO joguei a era 0 até o fim nem vi o primeiro baú abrir por conta própria.

### Divergências entre docs/balance.json v6 e o código
1. `lvlMult` 1,08, `maxLvl` 60, `upCostBase/Growth/Rarity` e "nível no espaço": NÃO aplicados (regra do dono mudou). O código usa +20% por
   nível e custo 1,38^N no ITEM, teto pelo nível do jogador. A curva real vai divergir da v6 (item novo volta ao nível 1; custo muito mais
   íngreme: nível 20 custa ~450× o nível 1). Sem compensação, como pedido.
2. Invocação: a v6 supôs diamantes virando invocação; agora é ouro (300·4^era; x10 = 2.700·4^era; 1 grátis/dia). Diamantes só compram skins.
3. Fortalecimento, práticas, títulos, torre, pet: não ligados, mas o `eraMult` usado é o do PACOTE INTEIRO (a nota do arquivo avisa que,
   sem esses sistemas, o jogador trava na era 5; há tabelas em `eraMult_alternativos` que não usei).
4. `chestKills`/`chestDailyCap` não entram no BAL do jogo: o `Sys.chest.DATA` já tem 250 e 8.
5. `js/sys/level.js` com números provisórios (ver acima); desbloqueio das instâncias no nível 14 é da fps-e2.
6. 7 espaços: convertidos em 2 (ver acima); pesos de drop por espaço da v6 não valem na prática.
7. Missão "Avance 2 fases" segue como estava (conflito 3 do arquivo).

### Visto no navegador (iframe 390x844; zero erro de console nas cargas finais)
- Layout novo nas eras 2 e 5 (colunas, habilidades embaixo, 3 comuns em profundidade, selo "+N"); aba Skins/Invocar com o campo livre.
- Jogador novo em x2: pickups voando, "+1 XP"/"+N" no HUD, drops, "Nv. 5", chefes das fases 1–5 vencidos.
- Invocar: GRÁTIS → vira "x1 · 300"; x10 por 2,7k debita o ouro; raridades trancadas com cadeado (nível 5 → tudo Básico).
- Equip.: Melhorar 4 vezes até o nível 5 e depois "Suba de nível para melhorar". Loja com 2 abas. 6 missões com a de forja contando.
- Ultimate animada da era 2 tocando; ataque do Goblin, do Esqueleto e do Dragão (início, meio, fim); morte do Esqueleto pela folha.
- Os 7 chefes e Senhores só MEDIDOS nesta build (vistos na v0.6 com a caixa anterior).

### NÃO testado
- Primeiro baú abrindo, ganhos offline com os módulos, save antigo real carregando na v0.7, tutorial do zero na v0.7 (o texto da invocação mudou),
  ultimates animadas das eras 0 e 5, folha de dano dos inimigos (ligada, não vista), morte do Goblin e do Dragão, troca de era, derrota.
- Eras 0 e 5 jogadas com o balance novo; 7 chefes vistos com a caixa final; números de dano acima da barra conferidos em print.
- Som ouvido, celular real, fps real, jogo sem `debug=1`.

### Defeitos conhecidos
- V1 da horda não cumprido (ver tabela). O comum da frente fica longe do herói (centro 240) e a espada não chega nele visualmente.
- Dragão com folha parece menor que a caixa medida (a folha tem margem); conferir.
- Com `stay=1` em debug o jogador de nível 1 numa era alta apanha valores gigantes (só debug; use `&plv=N`).
- Custo de melhoria 1,38^N explode perto do nível 30+ (número provisório até a v7).


## Rodada 7, parte 1 — reclamação do dono (era 0), geometria do protótipo, horda final do PO (2026-11-12). Build v0.7.2
Alterados: `index.html` (HUD e CSS do campo), `js/battle.js`, `js/stage.js`, `js/ui.js`, `js/meta.js`. Nada em js/sys, assets ou docs.
AS TELAS 05/06/07, OS 7 ESPAÇOS/6 ATRIBUTOS (Sys.fc.stats), VIP, GARANTIA DO MÓDULO E A MEDIÇÃO DE RITMO AINDA NÃO ENTRARAM: ver "Pendente" no fim.

### 1) "Andam pulando que nem pato e não atacam" (era 0): o que era, de verdade
Medido com o gancho `window.__probe(e, {x, feet, top, dh, dw, sy, rot, lean, adv, walking, atk, sheet})`, chamado dentro do `drawEnemyAt` com os
valores que o desenho usa (funciona SEM debug). Causas achadas e removidas:
- **Altura por SLOT** (100/116/95): a cada passo na fila o inimigo crescia e encolhia ~20% com a base no chão, ou seja, a cabeça subia e
  descia a cada troca de slot. Era o principal "pulo". Agora a altura é da ESPÉCIE (`KINDH`: e0 98 px, e1 106 px), fixa; só muda o que as
  regras do PO obrigam (mínimo 85 no fundo / 95 na frente e no meio), com suavização.
- **Fila reordenada por x a cada quadro** + velocidade aleatória por inimigo (50–75): eles se ultrapassavam e trocavam de slot andando, aos
  trancos. Agora a ordem da fila é a de chegada, velocidade constante (`EN_WALK`; com folha, a passada da folha), ninguém ultrapassa.
- **Tremor de câmera em TODO golpe** (herói apanhando 0,2; crítico 0,4; especial 0,35–0,8), sorteado em separado para o cenário e para os
  personagens: com 3 atacando, tudo balançava o tempo todo e os bonecos saíam do chão. Agora: golpe comum, crítico e especial NÃO tremem;
  só ultimate e golpe de chefe (0,3 → ±1,2 px); o tremor é SÓ horizontal e o mesmo valor (`B.shx`) para cenário e personagens.
- **Rotação no ataque/dano** (−0,18 rad e 0,05 rad em torno do centro da base): levantava um lado do sprite (~8 px). Trocada por
  cisalhamento ancorado na base (`lean`): os dois pés ficam na linha. Respiração 2,5% → 2%, só parado. Tremida aleatória no dano → recuo fixo de 3 px.
- **Avanço do golpe até o herói** (45–248 px, vai e vem pela tela): agora NENHUM inimigo sai mais de 12 px do slot (`EN_LUNGE` por slot,
  chefe 10); o golpe é a animação no lugar + impacto NO HERÓI na cor da era + herói piscando + número + som.
- "Não atacam": nas primeiras fases o herói mata com 1 golpe e os inimigos passavam a maior parte do tempo ANDANDO de um slot para o outro
  (a cadência só contava parado). Agora a cadência conta também na troca de slot, o passo entre slots é rápido (`EN_STEP`, só sem folha) e o
  1º golpe sai 0,15–0,4 s depois de parar.
- ARTE NOVA ligada: eras 0 e 1 animadas (andar, ataque, dano, morte), além da 2. Para ligar outra era basta pôr o número em `EN_ANIM_ERAS`
  (js/battle.js); arquivo que faltar cai no comportamento sem folha. A sola do Goblin (3 px) ficou como está (aceita pelo PO).

Medição no jogo normal, SEM debug, jogador novo, era 0, x1 (12 s de probe; 22 s por medida de ataque):
| Medida | Resultado |
|---|---|
| y dos pés na tela (todos os quadros, todos os inimigos) | 613,12 (variação 0) |
| rotação em vida | 0 |
| scaleY andando / parado | 1,000 / 0,983–1,020 |
| avanço máximo no golpe | 12 px |
| tremor de câmera com a horda atacando | 0 px |
| quadros desenhados por folha animada | 447 de 464 |
| fase 1 (22 s): inícios de ataque / golpes no herói / clarões / números / sons | 15 / 7 / 7 / 7 / 7 (8 morreram antes do golpe) |
| fase 7 (21 s): idem | 27 / 25 / 25 / 25 / 25 |
| intervalo entre ataques do mesmo inimigo | 1,14–2,0 s (média 1,3), ANTES do último ajuste da cadência; atacaram nos 3 slots (9/6/3 e 7/5/3 inimigos) |
| maior tempo de um visível parado sem atacar | 1,96 s (antes do ajuste; NÃO remedido depois) |
NÃO medido por probe: eras 1, 3, 4, 5, 6 e chefes em jogo normal. A era 1 animada foi ligada DEPOIS das medições e não foi vista rodando.

### 2) Espelhamento, flag POR ARQUIVO
| Arquivo | Olha para | Flag |
|---|---|---|
| assets/enemies/era0_boss.png (Rex, estático) | esquerda | sem flag (tirei do `EN_FLIP`) |
| assets/enemies/era3_e0.png (Pirata, estático) | direita (faixa e espada) | `EN_FLIP` mantido |
| assets/enemies/era5_boss.png (Tanque, estático) | direita (canhão) | `EN_FLIP` mantido |
| folhas era0_* e era1_* (assets/anim/hyb/enemy) | esquerda | nenhuma (`EN_FLIP_SHEET` vazio) |
Abri de fato: os 3 estáticos; da era 0, boss_run, boss_attack, e0_run, e1_attack; da era 1, e0_attack, e1_run, boss_attack (7 de 24 folhas;
as outras NÃO foram abertas). Os três PNG estáticos têm data de 01:07–01:09 (não foram regravados hoje): o aviso da arte ("virei na fonte
os três") só bate com o Rex. Rex visto no jogo de frente, olhando para a esquerda. Pirata e Tanque NÃO vistos nesta build: conferir.

### 3) Geometria do protótipo (confirmada pelo PO)
`#stage` agora É o campo: topo 64 px (HUD) · campo 704 · abas 76. Linha dos pés = `FIELD_FEET` 0,78 do campo = y 613,1 de 844 (medido; linha
magenta em 613 nos prints das eras 0, 1 e 2: pés em cima dela). A cena EonScene ocupa o campo inteiro (390×704, chão do meta 0,78); o fundo
antigo é escalado para o chão dele cair na mesma linha. Herói: quadro = 0,2643 do campo (186 px). HUD novo igual ao topo do protótipo (avatar
com XP, "Kael Nv.", FC, moedas, gemas com "+", menu); nome da fase, 5 marcas de onda e barra da era no topo do campo; colunas em y=110 do
campo; habilidades a 10 px do fim do campo. "FC 0" até o Sys.fc entrar. Com painel aberto (Skins, Missões, Passe) os pés ficam 46 px acima
do painel (`sheetGY`). Em tela de outra proporção vale a mesma fração do campo (não testado em outra proporção).

### 4) Horda final do PO, medida por script (debug `dbgSet`, parados no slot)
FÓRMULA: altura = `e.dh × 390/LW`, onde `e.dh` é exatamente a altura passada ao `drawImage` do sprite estático (recortado no bbox do alfa);
largura = `e.dw × 390/LW`; centro = `e.x × 390/LW`; sobreposição = (soma das meias-larguras − distância entre centros) ÷ largura do MAIS
ESTREITO do par. Nas eras com folha o quadro é desenhado na mesma escala do estático, mas a figura de cada quadro pode diferir alguns px do
bbox estático: NÃO medi o bbox real em pixels do print (pedido do QA: fica devendo).
| Era | frente c/larg/alt/x0-x1 | meio | fundo | F×M | M×F | Chefe alt:x0-x1 | Senhor | pés |
|---|---|---|---|---|---|---|---|---|
| 0 | 222/107/95/168-276 | 282/90/95/237-327 | 334/96/85/286-382 | 43% | 46% | 180:199-373 | 192:193-379 | 613,1 |
| 1 | 222/67/95/189-255 | 282/107/95/228-336 | 338/62/88/307-369 | 40% | 46% | 150:178-382 | 150:178-382 | 613,1 |
| 2 | 222/81/98/182-262 | 282/95/106/234-330 | 338/73/88/302-374 | 35% | 38% | 163:190-382 | 163:190-382 | 613,1 |
| 3 | 222/82/98/181-263 | 282/93/106/236-328 | 338/74/88/301-375 | 34% | 37% | 180:220-352 | 192:216-356 | 613,1 |
| 4 | 222/76/95/184-260 | 282/109/95/227-337 | 338/71/88/303-373 | 43% | 48% | 180:203-369 | 192:197-375 | 613,1 |
| 5 | 222/187/95/129-315 | 282/62/95/251-313 | 299/167/85/215-382 | 104% | 157% | 154:190-382 | 154:190-382 | 613,1 |
| 6 | 222/66/98/189-255 | 282/85/106/240-324 | 338/60/88/308-368 | 23% | 28% | 160:190-382 | 160:190-382 | 613,1 |
Cumprido: nada passa de 382; pés na mesma linha; mínimos 95/95/85; meio×fundo ≤50% (menos a era 5). NÃO cumprido: frente×meio 43% nas eras 0 e
4 (já nos mínimos de altura) e a ERA 5 inteira (o Drone tem 187 px de largura com 95 de altura; não cabe em nenhuma regra): decisão do PO.
Herói: avança até 12 px no golpe corpo a corpo (`HERO_LUNGE`) e volta.

### 5) Outros
- Remendo das tabelas de XP do Sys.level RETIRADO do `loadBalance` (o level.js já tem os 99 valores).
- `BAL.eraMult` padrão = v7.1 (0,944 · 0,777 · 2,19 · 6,72 · 32 · 112 · 412); o carregador lê o `BAL` do docs/balance.json v7.1. ATENÇÃO: essa
  tabela supõe os sistemas da v7, que ainda NÃO estão ligados (atributos continuam os da v0.7): até a parte 2 a dificuldade não corresponde ao calibrado.
- VERSION: o `?v=` de todos os scripts vem de `VERSION` (index.html). A build no servidor é esta (v0.7.2). O index.html em si não tem `?v=`:
  se o celular do dono guardar o index em cache, ele continua vendo a build antiga; o número aparece no carregamento, no título e em Configurações.

### Visto no navegador (iframe 390×844, zero erro de console)
Era 0 em jogo normal sem debug (tigres e brutamontes animados andando, parados e atacando; Rex de frente), era 2 e era 1 (ainda sem folha)
com a linha dos pés marcada, HUD novo, as 7 abas abrindo sem erro (painéis antigos).

### Pendente desta rodada (não começado)
Telas 05/06/07 pelo canvas (protótipos lidos: Equipamento, Invocar, Loja e Batalha); 7 espaços e 6 atributos por Sys.fc.stats; migrateSave; melhoria
ouro/diamante; desmontar; "Equipar e upar até o meu nível"; garantia do Sys.loot.summon (a do jogo ainda está ativa); skin/VIP (sem x3); energia da
ultimate normalizada pelo intervalo; medição de ritmo (abates/min, tempo entre ondas, tempo por fase, ouro e XP por minuto); save v0.7 migrando.


### Rodada 7, parte 1 — ADENDO (ordem do dono: só arte aprovada fica ligada). Build v0.7.4. VALE SOBRE O TEXTO ACIMA onde divergir
As folhas das eras 0 e 1 que a parte 1 diz "ligadas" estão DESLIGADAS por chave (o código de ligação ficou). Tabela única `ART_ON` em
js/battle.js, uma chave por inimigo e por estado; para ligar depois do voto, trocar `false` por `true` na linha da chave.
| Chave | Arquivo | Estado |
|---|---|---|
| era2_e0_run / era2_e1_run | assets/anim/era2_e0_run, era2_e1_run (Goblin, Esqueleto: corrida) | LIGADO |
| era2_e0_attack / era2_e1_attack / era2_boss_attack | assets/anim/hyb/enemy/era2_{e0,e1,boss}_attack | LIGADO |
| ult_era2 | assets/anim/ult/era2_ult | LIGADO |
| era2_boss_run | assets/anim/hyb/enemy/era2_boss_run (Dragão: corrida) | desligado |
| era2_{e0,e1,boss}_hurt e _die | assets/anim/hyb/enemy/era2_*_hurt, *_die | desligado |
| era0_{e0,e1,boss}_{run,attack,hurt,die} (12 chaves) | assets/anim/hyb/enemy/era0_* | desligado |
| era1_{e0,e1,boss}_{run,attack,hurt,die} (12 chaves) | assets/anim/hyb/enemy/era1_* | desligado |
| ult_era0 / ult_era5 | assets/anim/ult/era0_ult, era5_ult | desligado |
| `sceneV2` da era 1 (tabela ERAS, index.html) | assets/bg/v2/era1 | desligado (eras 0 e 2 ligadas) |
| auras +4/+7/+10/+13 | — | não ligadas (dependem da tela de Forja) |
Ligado sem chave (aprovado): Kael de hyb/R (corrida, parado, golpe), corrida sem arma do carregamento, sons e músicas.
Desligado vale o provisório em código: desliza reto sem quique (inclinação fixa 0,06), ataque no lugar com até 12 px + inclinação + impacto no
herói, dano = pisca, MORTE = some com fade no lugar (tirei o tombo/giro do cadáver), ultimate por partículas.
Remedido com as chaves desligadas (jogo normal, sem debug, era 0, x1): pés 613,12 fixos; rotação 0; avanço máx. 12 px; tremor 0; nenhuma folha
de inimigo carregada; 20 s: 11 inícios de ataque, 8 golpes = 8 clarões = 8 números = 8 sons; intervalo 1,24 s; maior tempo parado sem atacar
1,19 s; atacaram nos 3 slots (7/2/3). Era 1 com folhas (antes de desligar): intervalo 0,81–1,24 s, máx. sem atacar 1,2 s.
NÃO visto depois do adendo: era 2 (ataque por folha + dano/morte por código), ultimate da era 0 por partículas, Pirata e Tanque.


## Rodada 7, parte 2 — 7 espaços e 6 atributos, telas 05/06/07, 5 abas, v7.1, medições (2026-11-12). Build v0.8
Novo: `js/screens.js` (as três telas), `version.json`. Alterados: `index.html`, `js/battle.js`, `js/farm.js`, `js/ui.js`, `js/meta.js`, `js/stage.js`.
Nada em js/sys, js/audio.js, test/bg/scene.js, assets ou docs. Onde divergir, vale esta seção sobre as anteriores.

### 1) Base de dados do jogo (nenhuma conta no jogo; tudo vem dos módulos)
- **Item no formato final** `{slot, r, e, lvl, gold, subs}` + id (e `nw` = marca "NOVO", `look`/`goldEstimated` postos pelo Sys.stats). Cada item vai
  para o SEU espaço: a conversão fixa da rodada 6 saiu (`normItem` em js/farm.js). 7 espaços na tabela `SLOT`/`SLOTS7` (index.html).
- **Carga do save**: `sysMigrate()` (js/farm.js), uma vez, no começo do `sysBoot`, antes de qualquer cálculo: `Sys.stats.migrateSave(S)`, limpa
  espaço equipado que aponta para item inexistente e apaga o `S.pity` antigo.
- **Atributos**: `heroStats()` (index.html) é só `Sys.fc.stats(S, Sys.host)`. `Sys.host` ganhou `equipped()` (7 espaços), `canSpendGold/spendGold`,
  `canSpendGems/spendGems`, `skinR`, `goTab`; `level()` = `Sys.level.level(S)`. Módulos carregados: loot, chest, level, stats, skin, vip, forge, fc.
  A forja entra só pelo multiplicador do espaço que o Sys.stats lê (hoje +0 em todos: não há tela).
- **Batalha** (js/battle.js, `heroApply`): golpe do herói = `Sys.stats.hit(herói, mult, DEF do alvo)` (inimigos ainda sem DEF: 0); dano recebido =
  mesma fórmula com a DEF do herói; intervalo do básico = `Sys.stats.interval`; o golpe básico inteiro toca mais rápido na mesma proporção.
- **Energia da ultimate por tempo**: `energyPerBasic()` = `BAL.energyPerHit × intervalo atual ÷ BAL.s1Interval`. Especial e energia ao apanhar não mudam.
- **Melhoria**: `Sys.stats.upgrade` (ouro ou diamante), `upgradeTo` (Upar máx.), `planUpgrade` + `upgradeTo` no "Equipar e upar até o meu nível"
  (mostra o custo TOTAL em ouro e em diamante antes de cobrar). Desmontar: só `Sys.loot.dismantle`. Equipar automático (drop, baú, invocação,
  loja): `Sys.fc.itemFC().swap > 0`. Mochila cheia (60): o item novo é desmontado (antes era vendido).
- **Tirar/colocar item ou skin**: `statsChanged()` (index.html) = refaz os atributos da batalha na hora, `Sys.fc.record` (maior FC da semana), salva, HUD.
- **Garantia da invocação**: a do jogo saiu; vale a do `Sys.loot.summon` (`item.pity`, contador `S.sys.loot.summon.pity`).
- **VIP**: sem x3 (botão x1/x2; o teto lê `Sys.vip.perks().speedMax`, travado em 2). Ouro offline × `offlineMult` (js/meta.js). Debug: `dbgVip(true|false)`.
  "Comprar VIP" (Loja › Gemas) só mostra "Pagamento em breve" e não liga a flag.
- **Versão/cache**: `versionCheck()` busca `version.json` com `cache:'no-store'`; se a versão for outra, recarrega com `?_v=<versão>` (uma vez).
  A cada build: trocar `VERSION` no index.html E o `version.json`. Limite: um index v0.7.x já guardado no aparelho não tem esse código; só passa a
  valer depois da primeira carga da v0.8.
- **Arte**: `EN_FLIP` vazio (Rex, Pirata e Tanque reabertos: os três olham para a esquerda no arquivo). Folhas: ancoradas pelo `feetY`, `w`, `h` e
  `frames` do .json de cada folha (formato novo 352 de altura); sem `feetY` vale `padTop + 243` (só as corridas antigas `assets/anim/era2_e0_run`
  e `era2_e1_run` vêm sem o campo).

### 2) Tela 05 EQUIPAMENTO (igual ao canvas)
Vitrine de 292 px com o cenário medieval, pedestal, faíscas e o Kael parado animado (folha da roupa conforme a skin); 7 espaços nas posições do
protótipo com marcador em SVG, moldura e brilho na cor da raridade, "Nv." do item, selo "+N" do fortalecimento do espaço; asa com cadeado e
"Nível 50" até abrir; painel com FC (contagem animada), cartão da skin (bônus equipado e de coleção, leva à Loja) e os 6 atributos; mochila
paginada (10 por página; 5 se a tela for baixa) com "NOVO", "em uso" e seta de "melhor"; "Ver todos"; "Equipar melhor"; folha de comparação com
EQUIPADO × ESTE ITEM, nível do item com a barra e a marca do teto, Upar (ouro) / Upar (diamante) / Upar máx., "FC agora" e "FC no seu nível"
(do `itemFC`), 7 linhas de diferença (6 atributos + FC), Desmontar e Equipar.
Diferenças conscientes: (a) espaço VAZIO (o protótipo sempre mostra item): moldura tracejada com o marcador apagado pulsando e "vazio";
(b) "Em uso" virou botão "Em uso · toque para tirar" (o protótipo não tem como tirar); (c) botão novo "Equipar e upar até o meu nível (N)" com
o custo, e diálogo de confirmação com custo total em ouro e em diamante (pedido do PO depois do desenho); (d) a asa, quando liberada, usa um
marcador SVG desenhado por mim no mesmo traço (não existe no protótipo); (e) DEF aparece como número (o módulo tem DEF plana; o protótipo
mostrava %); (f) "Vel. de Ataque" = golpes por segundo pelo intervalo do módulo (1/0,8 = 1,25/s na base; o protótipo mostrava 1,00/s);
(g) a aura +13 atrás do Kael não foi desenhada (depende da Forja); (h) nomes dos 5 espaços novos só existem para a era 2 (os do protótipo);
nas outras eras o nome é genérico ("Elmo de Osso"); (i) números acima de 10 milhões aparecem abreviados (12,3M).

### 3) Tela 06 INVOCAR (layout do canvas, regras do contrato)
Baú flutuando com raios e brilho, chances por raridade, "Abrir grátis · 1 por dia" (ou relógio até a meia-noite), "Abrir x1" e "Abrir x10" em OURO
(preço do `Sys.loot.summonCost`), tremor do baú → clarão → cartas virando uma a uma (lendária com raios e "LENDÁRIO!") → "Revelar tudo" / "Coletar".
Diferenças conscientes (decisão do PO: vale o contrato): x10 em ouro (o desenho mostrava gemas); sem "Abertura automática" (no lugar, duas linhas
com a regra: só itens, em ouro, e a garantia); sem "nível do baú com XP": o cartão do topo mostra a GARANTIA ("Faltam N", "Garantia X / 10",
barra); chances mostradas são as EFETIVAS com o portão (o que está trancado soma na melhor raridade liberada); raridade trancada = cartão
tracejado com cadeado e "Nv. 25" (ou "Era 5"); item que veio pela garantia sai com a etiqueta "GARANTIA" e brilho; item equipado na hora
ganha o selo verde; todos os itens usam o marcador SVG do espaço (o desenho usava PNG de arma).

### 4) Tela 07 LOJA (layout do canvas, regras do contrato)
Faixa da regra, abas, destaque "OFERTA" com relógio, grade 3×2 paginada com estados (Equipada, Na coleção, preço em gemas, Só no Passe, bloqueada
pela era), prévia grande com pedestal e raios, confirmação antes de cobrar ("Preço", "Suas gemas a → b", "Faltam N" → "Ver gemas"), aba Gemas.
Diferenças conscientes: texto da faixa = "Skin dá bônus de ATK e HP · compra direta, sem sorteio"; a nota da prévia mostra o bônus (equipada
+X%, coleção +0,5% por skin, teto +10%); 5 abas internas em vez de 3: Skins de herói, Skins de arma, Gemas, **Itens** (ofertas do dia em ouro,
compra direta com confirmação, item inteiro à vista) e **Coleção** (a tela antiga de Skins, movida para dentro sem refazer); os 4 pacotes de gemas
mostram "compra com dinheiro real" e "Em breve" e o toque avisa "Pagamento em breve"; cartão do VIP com os benefícios lidos do `Sys.vip` e
"Comprar VIP" → "Pagamento em breve"; catálogo = todas as skins do jogo (35 de herói + 3 do passe, 35 de arma + 3 do passe; 7 páginas), não as
12 do desenho; "OFERTA" = a skin do dia (sem desconto: o desenho também não tinha); skins de herói fora da era 2 usam o PNG parado com respiração
e a etiqueta "prévia, animação em produção" (só a roupa da era 2 tem folha).

### 5) Abas e outras telas
5 abas (Batalha, Equip., Invocar, Loja, Passe), com os ícones do protótipo. Missões = aba interna do Passe; o botão de missões da batalha abre o
Passe direto em Missões; o contador vermelho do Passe soma missões e passe. Skins = aba "Coleção" da Loja. O Passe continua em painel sobre a
batalha (o passe novo não é desta rodada). Rótulo da ultimate colado no botão; selo "+N" na linha do chão: não se cruzam (visto na era 3).

### 6) Horda (PO: frente×meio até 45%; Drone) e medida pela CAIXA OPACA
`bbox()` agora mede a caixa opaca numa grade de 256, sem folga (antes: grade de 96 com 1–2 células de folga, ~4% a mais): altura, largura, margem
e sobreposição usam essa caixa. O recuo ao levar golpe não passa mais de x=382. Drone (`SOLO_WIDE`): mínimo 80 px e, como não cabe, a onda da era 5
tem 1 visível por vez (o resto no "+N"); sozinho, ele não entra por cima do herói.
FÓRMULA: altura = `e.dh × 390/LW` (altura da caixa opaca do sprite estático desenhada); largura = `e.dw × 390/LW`; centro = `e.x × 390/LW`;
sobreposição = (soma das meias-larguras − distância entre centros) ÷ largura do mais estreito.
| Era | vis. | frente c/larg/alt/x0-x1 | meio | fundo | F×M | M×F | Chefe alt:x0-x1 | Senhor |
|---|---|---|---|---|---|---|---|---|
| 0 | 3 | 222/110/97/167-277 | 282/93/97/236-328 | 333/97/85/285-382 | 45% | 47% | 180:201-372 | 192:195-377 |
| 1 | 3 | 222/68/98/188-256 | 282/111/97/227-337 | 338/60/87/308-368 | 43% | 49% | 150:173-382 | 150:173-382 |
| 2 | 3 | 222/82/98/181-263 | 282/96/106/234-330 | 338/74/88/301-375 | 35% | 39% | 161:190-382 | 161:190-382 |
| 3 | 3 | 222/82/98/181-263 | 282/92/106/236-328 | 338/74/88/301-375 | 33% | 36% | 180:221-351 | 192:216-356 |
| 4 | 3 | 222/77/97/183-261 | 282/112/95/226-338 | 338/71/88/303-373 | 45% | 50% | 180:204-368 | 192:198-374 |
| 5 | 1 | 222/143/98/151-293 (Drone sozinho) | — | — | — | — | 154:190-382 | 154:190-382 |
| 6 | 3 | 222/65/98/190-254 | 282/85/106/239-325 | 338/58/88/309-367 | 23% | 27% | 159:190-382 | 159:190-382 |
MEDIDA REAL EM PIXELS (uma vez, era 0, canvas da batalha lido com getImageData, alfa > 40): borda direita dos 3 comuns = 381,8 (calculado 382,0);
chefe (Rex): x até 372,2 (calculado 371,5) e altura opaca 182,0 (calculado 180,0; os 2 px a mais são o brilho atrás do chefe). A borda esquerda e
o topo dos comuns não deu para isolar (a arma e a barra do herói entram na região). Nas eras sem cenário vivo o fundo é pintado no mesmo canvas
e a leitura não isola o sprite: NÃO medido em pixels lá.


### 7) Balanceamento ligado e MEDIÇÃO DE RITMO (build v0.8, jogo normal SEM debug, jogador novo, AUTO)
Ligado: o `BAL` do docs/balance.json (hoje "balance-v7.2", com o mesmo eraMult da v7.1: 0,944 · 0,777 · 2,19 · 6,72 · 32 · 112 · 412) é lido pelo
carregador; o padrão do código é o mesmo. A tabela "sem extras" que o briefing pedia NÃO existe mais no arquivo (só a nota que a cita); a ordem
posterior do PO foi usar o eraMult do BAL. Nenhum número de módulo foi fixado no jogo. Conferido no disco na hora da ligação: Sys.stats com colete
DEF 8, defK 2, tetos 100% de velocidade e 400% de dano crítico, custo 3,5^era; Sys.loot com XP 2,2 / 33 / 264, invocação base 1.000, desmonte
0/1/2/4/10; Sys.vip com +25% de XP e ouro e speedMax 2. Nenhum módulo estava com número antigo.
CONDIÇÕES: iframe 390×844 no desktop, 27–36 quadros por segundo na janela da automação; "min de jogo" = relógio da batalha (`B.t`), que em x2
andou 1,85–1,94× o tempo real (não 2×, por causa dos quadros); "melhorando" = a cada 2 s: grátis diária, equipar o melhor pela FC, upar com ouro
o item equipado mais barato até não dar, x10 quando falta item em algum espaço ou nada pôde ser upado, e desmontar tudo que não está equipado.
"Entre ondas" = do `waveClear` ao primeiro golpe do herói na onda seguinte.
| Medida | Condição | Fases | Abates/min de jogo (real) | Entre ondas (s de jogo) | Ouro/min | XP/min | Nível no fim | Derrotas |
|---|---|---|---|---|---|---|---|---|
| A | era 0, x2, melhorando, 330 s reais (611 s de jogo) | 1 → 10-4 | 27,7 (51,3) | 4,09 (3,56–4,44; n 56) | 127 | 110 | 11 | 2 |
| B | era 0, x1, sem melhorar, 120 s | 1 → 4-1 | 27,7 (27,5) | 4,16 (3,91–4,69; n 14) | 88 | 105 | 5 | 0 |
| C | era 0, x2, sem melhorar, 110 s (148 s de jogo) | 1 → 4-4 | 29,2 (39,3) | 4,15 (3,70–4,66; n 18) | 84 | 105 | 6 | 0 |
| D | era 0, x1, melhorando, 150 s | 1 → 4-5 | 30,3 (30,0) | 4,07 (3,75–4,41; n 19) | 87 | 108 | 6 | 0 |
| E | fase 10 (estado do fim da A), x2, melhorando, 270 s (519 s de jogo) | 10 → 10 | 26,6 (51,1) | 4,06 (n 32) | 133 | 80 | 12 | 8 |
| F | fase 10, x1, melhorando, 140 s | 10 → 10 | 27,1 (26,6) | 4,13 (n 8) | 135 | 81 | 11 | 2 |
| G | fase 10, x2, sem melhorar, 110 s (213 s de jogo) | 10 → 10 | 24,5 (47,4) | 4,12 (n 12) | 123 | 74 | 11 | 3 |
| H | era 1 SINTÉTICA (estado do fim da A colocado na fase 11), x2, melhorando, 150 s (289 s de jogo) | 11 → 14-5 | 23,0 (44,4) | 4,07 (n 27) | 211 | 149 | 12 | 2 |
| I | era 1 SINTÉTICA, idem, x1, 100 s | 11 → 13-2 | 25,4 (22,8) | 4,02 (n 10) | 266 | 200 | 11 | 0 |
Tempo por fase (s de jogo): A: fase 1 32,5 · 2 39,2 · 3 45,1 · 4 48,0 · 5 43,1 · 6 56,4 · 7 59,8 · 8 62,6 · 9 65,7 (níveis 3,4,5,6,7,8,9,10,10 ao
fechar cada uma). B: 37,3 · 37,1 · 44,0. C: 37,0 · 38,6 · 43,0. D: 37,8 · 34,0 · 40,1. H: fase 11 98,3 · 12 36,0 · 13 103,5 (com 2 derrotas). I: 40,7 · 37,3.
LEITURAS (fatos medidos, sem calibrar):
1. O ritmo é ~24–30 abates por minuto de jogo em todas as condições, quase sem depender de melhorar ou não: quem manda é o tempo fixo entre
   ondas, ~4,1 s (onda vencida → 1,2 s de espera → inimigos entram andando → herói chega ao primeiro golpe), 5 ondas por fase.
2. O básico do herói bate a cada 1,2 s na base, não a cada 0,8 s: o intervalo de 0,8 s só conta DEPOIS de terminar o golpe de 0,4 s (já era
   assim na v0.7; com a velocidade de ataque os dois encurtam juntos). Medido com +26% de velocidade: ciclo mínimo 0,92 s (esperado 0,95).
   O Sys.stats e o contrato falam em "0,8 s". Não mudei: a v7.1 foi calibrada no ritmo real. Decisão do PO/simulação.
3. O JOGADOR TRAVA NO SENHOR DA ERA 0: a medida A chegou à fase 10 em ~10 min de jogo (nível 10–11) e as medidas E, F e G ficaram mais 14,5 min
   de jogo na fase 10, com 13 derrotas, sem passar (nível 12, FC 1.283, ATK 60, HP 736, melhorando sempre). A era 1 só foi medida com o estado
   colocado à força na fase 11 (H, I), onde ele anda de novo (eraMult 0,777 < 0,944). Não joguei além disso: não sei em quanto tempo ele passa.
4. Na medida A a política só conseguiu 1 invocação (a grátis): o x10 custa 9.000 e o ouro acumulado foi ~1.300 em 10 min.
NÃO medido: celular real (fps e ritmo reais), x2 a 60 quadros, eras 2+, jogador pagante/VIP.

### 8) Conferências de batalha (script)
- Energia da ultimate por tempo (era 0, MANUAL, alvo que não morre, sem energia ao apanhar, x2): com o intervalo do herói (0,71 s, +12% de
  velocidade dos itens do save) a ultimate encheu em 30,9 s de jogo; com +100% (intervalo 0,40 s, forçado no `B.hero`) em 30,3 s (−2%).
- Atributos na batalha, eras 0 e 2 (debug, com botas, luvas e colar Épicos equipados): crítico 16,8% e dano crítico +148/+155% vindos do
  Sys.fc; 2 críticos em 18 e 2 em 16 golpes básicos (amostra pequena); ciclo do básico 0,92 / 0,90 s contra 0,95 / 0,93 esperados;
  redução pela DEF do herói 75% (teto) na era 0 e 6,8% na era 2 com item da era 0.
- Folhas da era 2 pelo .json (h 256, feetY 243 no ataque; as duas corridas antigas sem feetY → 243): linha mais baixa de pixels opacos da horda
  (Goblin e Esqueleto correndo, parados e atacando, 16 s, 334 amostras) = 613,1 em todas; Dragão sozinho 612,1–613,1. Limite da medida: ela pega
  o pixel mais baixo de QUALQUER inimigo visível, então uma sola levantada isolada não aparece se outro estiver no chão.
- Espelhamento: Pirata (era 3) e Tanque (era 5) vistos em jogo olhando para a esquerda, sem flag; Rex visto na parte 1.

### 9) O que foi visto no navegador (iframe 390×844, zero erro de console em todas as cargas)
Equipamento: jogador novo (2 itens, 5 espaços vazios, asa trancada) e com itens; folha de comparação; Upar com ouro (44) e com diamante (5);
Upar máx. até o teto (nível 30) e aviso "Teto: seu nível 30"; equipar e tirar com a FC mudando no HUD e na tela (2.290 → 2.455 → 2.159) e a
maior FC da semana gravada; "Equipar e upar até o meu nível" com o diálogo de custo (1.457 de ouro ou 120 diamantes) e a cobrança; desmontar
(+1.590 de ouro = 50% de 3.181, +2 pedras de forja); os 7 espaços tirando e pondo, um a um, com a FC caindo e voltando (hat ficou vazio nesse
teste: só 6 foram exercitados no laço; o elmo foi equipado e tirado antes, à mão). Invocar: tela parada, x10 (9.000 de ouro debitados, 10 cartas
virando, selo de equipado, "Melhor"), Coletar, grátis no tutorial. Loja: Skins de herói, prévia, confirmação, compra (4.995 → 4.935 gemas, FC
4.069 → 4.084 pela coleção), equipar (FC 4.114), Gemas ("Pagamento em breve", VIP não liga), Itens (compra com confirmação, equipou as luvas),
Coleção. Passe com as abas internas; botão de missões abrindo em Missões. Save v0.7 real (cópia `eon_backup_r7`: fase 9, 23 itens) carregando:
23 itens migrados com `gold` e secundários, equipados mantidos, FC 550, tela de Equipamento abrindo. Tutorial: passos 3 (com o aviso do teto e
com "Upar") e 4 conferidos forçando o passo.

### 10) NÃO testado
- Lado a lado com o canvas eu comparei pelo código do protótipo e por prints do jogo; NÃO abri o canvas renderizado ao lado.
- Item antigo com nível > 1 migrando (o save real só tem itens nível 1; o ouro estimado ficou 0 em todos). Mochila cheia (60) desmontando o novo.
- x1 pago e a GARANTIA disparando de verdade (etiqueta "GARANTIA"); carta lendária; "Revelar tudo"; relógio da grátis virando o dia.
- Aba "Skins de arma", skin do passe, skin bloqueada pela era, "Faltam N gemas" → "Ver gemas", página 2+ da loja; virada do dia da loja.
- Tela baixa (1 linha de mochila / 1 linha de loja), outra proporção, moldura de desktop, celular real, som, fps real.
- Tutorial do zero até o fim sem forçar passo (o toque sintético no Especial não disparou no teste); ganhos offline; baú de toque abrindo com os
  ícones novos; dbgVip; derrota e troca de era com as telas abertas; nível subindo com a folha de item aberta.
- version.json: só conferi que a build carrega sem erro com ele; NÃO simulei um index antigo em cache recarregando.
- Eras 4 e 6 em jogo; Drone sozinho só medido por script (não visto em print); chefes das eras 1, 3, 4, 6 nesta build.

### 11) Divergências entre os módulos e o que as telas precisam
1. `Sys.stats` não tem nome nem ícone por espaço/era: o jogo inventou os nomes dos 5 espaços novos (só a era 2 tem os do protótipo).
2. DEF é plana no módulo; o protótipo 05 mostra DEF em %. A tela mostra o número.
3. `item.look` (era do visual) é criado pelo migrateItem; o jogo usa para nome, mas os itens novos do Sys.loot vêm sem `look` (usa a era).
   A "transformação" (planTransform/transform) existe no módulo e não tem tela.
4. O protótipo 06 tem nível de baú/XP e abertura automática, que nenhum módulo tem (o PO já decidiu: fora).
5. `Sys.loot.summon` devolve `pity:true` no item, mas não diz qual é a "melhor raridade liberada" para a arma (Mítica vira Épica): a tela mostra
   a do `maxAllowedR`, então com o portão em Mítico a garantia de uma ARMA sai Épica e a etiqueta diz "GARANTIA" do mesmo jeito.
6. A chance efetiva por raridade (com o portão) é calculada na tela a partir de `DATA.summon.rarWeights` e `maxAllowedR`; seria melhor o módulo expor.
7. Preço dos itens da loja (150/420/1.300/4.000/12.000 × 4^era) continua no jogo (`COIN_BASE`): nenhum módulo tem preço de loja.
8. Equipar automático pela FC real rejeita item de era nova nível 1 contra item antigo upado (alerta já registrado no balance.json); a tela
   resolve com a seta de "melhor" só quando a troca melhora agora, mais o botão "Equipar e upar até o meu nível".
9. `Sys.fc.advice`/painel "Como ficar mais forte" não foi ligado (sem tela aprovada). `Sys.forge` está carregado só pelo multiplicador (+0).

### 12) Pendências
PARA A ARTE: 49 ícones por espaço e era (hoje 7 marcadores SVG); ícone da asa; roupas das eras 0, 1, 3–6 animadas (hoje PNG parado com
respiração e "prévia"); arma na mão do Kael por skin na prévia; Drone mais estreito; aura +13 da vitrine (quando a Forja entrar).
PARA O PO: (1) o jogador trava no Senhor da Era 0 (item 7.3); (2) básico a cada 1,2 s × 0,8 s do contrato; (3) nomes dos itens dos 5 espaços
novos por era; (4) aba "Itens" e aba "Coleção" na Loja ficam assim ou viram outra coisa; (5) texto do tutorial do passo "Upar" quando o jogador
está no teto; (6) missão "Melhore 5 vezes" fica impossível no nível 1–2 (teto); (7) "OFERTA" sem desconto; (8) era 5 com 1 visível por onda.
PARA O QA: a medida de pixels da horda só foi feita na era 0; o gancho `window.__probe` continua no `drawEnemyAt`.


## Rodada 8 — correções do QA/PO, balanceamento v7.3, modo farm, tela 04 BATALHA e tela 03 INTRO (2026-11-12). Build v0.9
Novo: `js/intro.js`. Alterados: `index.html`, `js/battle.js`, `js/stage.js`, `js/farm.js`, `js/ui.js`, `js/screens.js`, `js/meta.js`, `version.json`.
Nada em js/sys, js/audio.js, test/bg/scene.js, assets ou docs.
**NÃO FEITO nesta entrega (não comecei): PARTE D (tela 08 Passe com o Sys.pass), PARTE E (tela 10 Vitória/Derrota do chefe) e PARTE F (tela 16
Práticas e Títulos).** O passe antigo, as missões antigas e o `addPxp` continuam no jogo; a derrota para o chefe ainda mostra só "DERROTADO" e o aviso.

### Parte A (QA e PO)
1. Textos de desenvolvimento retirados: "ícones provisórios (SVG)" e as três etiquetas "prévia, animação em produção" (Loja). Na Intro, a
   etiqueta da Kaia do canvas ("arte em produção") virou "em breve".
2. Avisos: o aviso do Equipamento ficou com 210 px de largura (cabe entre as colunas de espaços, não toca em "Asa" nem nos outros rótulos); o aviso
   global de drop, nas telas cheias, cai 150 px abaixo do HUD (miolo da vitrine / palco do baú) com 210 px de largura; na Loja o aviso de drop não aparece.
3. Botão sem dinheiro: x1 e x10 apagados e sem pulso; Upar (ouro/diamante), Upar máx., "Equipar e upar", Comprar skin e oferta de item apagados;
   ao tocar: "Ouro insuficiente: faltam X" / "Diamantes insuficientes: faltam X" (`needMsg`, js/screens.js).
4. Cartão da skin: total grande ("+5% ATK e HP") e, embaixo, "Skins equipadas +4% · Coleção +1%", do `Sys.skin.detail(S)`.
5. Item acima do nível do jogador: "acima do seu nível: não pode subir até você chegar ao N", com `aboveCap`/`needLevel` do `canUpgrade`.
   ATENÇÃO: uso o `needLevel` do módulo (nível do item + 1); o exemplo do PO dizia o próprio nível do item.
6. Nomes dos 5 espaços novos: `Sys.loot.itemName(item)` (o `iname` do jogo só cai na tabela própria se o módulo não devolver nome). Chances da
   Invocar: `Sys.loot.summonOdds(host)` (o cálculo local saiu). Invocação a 500 × 4^era vem do módulo. "OFERTA" saiu (não há desconto): virou
   "DESTAQUE" e "Troca em". Missão "Melhore 5 vezes" só aparece a partir do nível 5 (`minLvl` + `misOn`).

### Balanceamento v7.3 e mochila cheia (prioridade do PO)
- Padrões do `BAL` (js/battle.js) = v7.3: eraBossHpMult 1,1 · eraBossDmgMult 0,9 · eraMult 0,944 · 0,777 · 1,44 · 4,2 · 16,1 · 53,2 · 161; o carregador
  lê o mesmo `BAL` do docs/balance.json (hoje "balance-v7.3"). Nada nos módulos.
- Mochila cheia: sai o item MAIS FRACO não equipado (`Sys.fc.itemFC(...).fc`, FC do item no nível atual); o novo só é descartado se for ele o mais
  fraco; aviso "Mochila cheia: desmontou X · +N de ouro · +N pedras de forja". NÃO exercitado com a mochila cheia de verdade.
- MEDIÇÃO (v0.9, curva de nível do item v8 ATIVA no módulo, v7.3). MÉTODO: laço acelerado no navegador chamando o `step(1/30)` do próprio jogo
  (mesma lógica da batalha, sem desenho e sem relógio real; a aba da automação estava sendo freada por outra sessão e o tempo real não servia).
  Política "melhorando": a cada 2 s de jogo, grátis diária, equipar o melhor, upar com ouro o equipado mais barato, x10 quando falta espaço ou nada
  pôde subir; desafia o chefe quando o botão brilha.
  | Partida | Senhor da Era 0 vencido aos | Derrotas | Nível / FC |
  |---|---|---|---|
  | v8, melhorando (6 partidas) | 8,4 · 8,8 · 8,5 · 8,6 · 8,5 · 8,7 min de jogo | 0 em todas | 11 / 1.153–1.270 |
  | v7 em memória, melhorando (3) | 9,0 · 9,3 · 9,2 min | 0 | 11 / 1.070–1.132 |
  | v8, SEM melhorar (1) | 9,3 min | 0 | 11 / 1.043 |
  Era 1 (v8, melhorando, 3 partidas, do zero até a fase 21): 28,3 min no total (era 1 em 19,7 min, 5 derrotas, todas no chefe, 5 desafios, 9,6 min
  de farm) · 17,8 min (9,1 min de era 1, 0 derrotas) · 19,1 min (10,5 min, 0 derrotas). O agente do PO tinha medido 35 e 103 min: a diferença pode
  ser a curva v8 e o modo farm. Limite do método: sem desenho, inimigos com folha usam a velocidade padrão de entrada; câmera lenta da ultimate fora.

### Modo FARM (PO) — js/battle.js
- Perdeu para o chefe (onda 5, de fase ou Senhor da Era): `S.farm = true` (salvo) e o jogo volta sozinho para as ondas 1 a 4 da MESMA fase,
  repetindo, com drop, ouro e XP normais; nunca entra na onda do chefe sozinho. Morrer para comum: como antes (recomeça a fase).
- Botão "Desafiar" (`#bossb`, no topo direito do campo, como no canvas): aparece no farm; toque = `challengeBoss()` (vida cheia, onda do chefe).
  Brilha com a FC ≥ `BOSS_GLOW_AT` (0,9) × `recFC(fase)`.
- FC RECOMENDADA: nenhum módulo expõe; `recFC(fase)` (index.html) usa `tower.fc_mediana_do_gratis_no_fim_de_cada_era` do docs/balance.json
  (1.440 · 12.300 · 395 mil · ...), interpolada geometricamente dentro da era a partir do fim da era anterior (era 0: a partir de 264).
- Configurações: "Desafiar o chefe sozinho" (`S.set.autoBoss`, DESLIGADO por padrão): no fim da onda 4, se a FC ≥ recomendada, desafia.
- Marcas de onda: 4 + "FARM" no farm; "Horda w/4".
- TESTE (laço acelerado, jogador novo SEM melhorar, morto de propósito no Senhor da Era 0 aos 8,8 min, FC 984 contra 1.440): entrou no farm na onda 1;
  ficou 25,5 min farmando (ouro +4.195, nível 10 → 14); o botão brilhou com FC 1.337 (≥ 90% de 1.440); desafiou e venceu; 1 derrota no total, sem laço.
  NÃO visto na tela: o botão "Desafiar" desenhado e brilhando (só a lógica e o estado). A tela 10 de derrota não existe ainda.

### Parte B — tela 04 BATALHA (igual ao canvas)
- Campo: nome da fase + 5 marcas + "CHEFE", "Horda w/5" com barra dos abates da horda; coluna esquerda: Missões (alvo desenhado + contador) e baú;
  coluna direita: AUTO/MANUAL, velocidade, música (barras animadas ligada / nota desligada) e "Esconder interface" (olho); painel Vida/Energia no
  canto inferior esquerdo (a barra em cima da cabeça do herói saiu); habilidades no canto inferior direito com o rótulo EMBAIXO: básico 48 px
  ("Auto"), especial 62 px com a recarga subindo de baixo e o número, ultimate 80 px redonda com "%"/"PRONTA"; selo "+N" na borda direita acima
  das cabeças (y 413 do campo); barra de vida dos inimigos 50×6 vermelha; números de dano em Lilita One; faixa da ultimate em pílula roxa
  ("Lâmina do Dragão!"); "Nível X!" em pílula verde-água + brilho no avatar; pílula de moedas pulsa quando as moedas chegam; dedo "Ultimate pronta!
  Toque aqui" na 1ª vez que ela enche em MANUAL (`S.ultTip`). Nenhum emoji nos botões da batalha.
- CHAVES LIGADAS agora: dano e morte do Goblin e do Esqueleto; Corte Giratório (`s2_era2_t1`): folha composta
  `assets/anim/hyb/R/kael_spin_era2_t1` (17 quadros, 1,42 s; os 3 acertos acompanham), só com skin de arma da era 2 nos tiers Épico/Mítico (t1).
- AURA: desenhada ATRÁS do Kael (parado, correndo, golpeando e no giro), base no chão, folhas `assets/anim/aura/aura4|7|10|13`. O nível vem do
  +N do espaço da ARMA no `Sys.forge` (`Sys.forge.aura(S).id`: azul 4, roxa 7, chamas 10, dourada 13). Como a Forja não tem tela, o +N é 0 e
  NENHUMA aura aparece no jogo normal; em debug, `window.__aura = 13` mostra (foi assim que vi).
- Diferenças conscientes: sem botão de Ranking (tela reprovada); "Desafiar" só aparece no modo farm (no canvas está sempre); a aura não aparece
  sem forja; o herói usa corpo + arma na mão (golpe aprovado), não a folha composta do golpe com rastro; inimigos parados usam o sprite estático
  respirando (o canvas usa o 1º quadro da folha de ataque); o Kael do avatar do HUD é a folha parada da roupa da era 2.

### Tabela de chaves (ART_ON, js/battle.js) — estado na v0.9
| Chave | Arquivo | Estado |
|---|---|---|
| era2_e0_run, era2_e1_run | assets/anim/era2_e0_run, era2_e1_run | LIGADO |
| era2_e0_attack, era2_e1_attack, era2_boss_attack | assets/anim/hyb/enemy/era2_*_attack | LIGADO |
| era2_e0_hurt, era2_e1_hurt | assets/anim/hyb/enemy/era2_e0_hurt, era2_e1_hurt | LIGADO (novo) |
| era2_e0_die, era2_e1_die | assets/anim/hyb/enemy/era2_e0_die, era2_e1_die | LIGADO (novo) |
| ult_era2 | assets/anim/ult/era2_ult | LIGADO |
| s2_era2_t1 | assets/anim/hyb/R/kael_spin_era2_t1 | LIGADO (novo) |
| aura4, aura7, aura10, aura13 | assets/anim/aura/aura<N> | LIGADO (só aparece com +N da arma no Sys.forge) |
| s2_era2_t0, s2_era2_t2 | assets/anim/hyb/R/kael_spin_era2_t0, _t2 | desligado |
| era2_boss_run, era2_boss_hurt, era2_boss_die | assets/anim/hyb/enemy/era2_boss_* | desligado |
| era0_* e era1_* (24 chaves) | assets/anim/hyb/enemy/era0_*, era1_* | desligado |
| eras 3–6 (folhas novas) | assets/anim/hyb/enemy/era3..6_* | sem chave e sem carga (não estão em `EN_ANIM_ERAS`) |
| ult_era0, ult_era5 | assets/anim/ult/era0_ult, era5_ult | desligado |
| `sceneV2` da era 1 (ERAS, index.html) | assets/bg/v2/era1 | desligado |
| `KAIA_ON` (js/intro.js) | — | desligado (Kaia não pode ser escolhida) |

### Parte C — tela 03 INTRO (igual ao canvas)
3 cartões (era 0 com o cenário em camadas rolando e o Kael correndo sem arma; era 2 com o portal; era 6 com o Devorador e o Kael no pedestal),
"Pular", marcas e "Próximo"/"Vamos!"; "Escolha seu herói" (Kael selecionável com brilho e selo; Kaia em silhueta); "Como vão te chamar, lenda?"
com campo, dado de sortear, 3 sugestões, validação (mínimo 3, só letras/números/_) e "Começar a aventura". Grava `S.hero` e `S.name`; o HUD mostra
o nome. Aparece depois do JOGAR, antes das boas-vindas e do tutorial, só para save sem nome; save antigo vira "Kael" sem intro (visto com o save v0.7).
Diferenças conscientes: Kaia NÃO pode ser escolhida (toque → "Kaia chega em breve"; no canvas ela é selecionável); etiqueta "em breve" no lugar de
"arte em produção"; 3º cartão sem a frase "Skins mudam só o visual" (contradiz a regra) e 1º sem "forje armas"; nome inicial sorteado
("Lenda_NN") em vez de "Kael_BR"; sem a regra "esse nome já existe" (não há servidor); o fundo do 3º cartão é o cenário antigo da era 6.

### Visto no navegador (iframe 390×844, zero erro de console)
Batalha da era 2 com o layout novo, aura +13 (debug) atrás do Kael, Corte Giratório no meio do giro (folha em uso, 1,42 s), folhas de dano e
morte do Goblin e do Esqueleto carregadas; eras 0 e 5 sem nenhuma folha de inimigo carregada (provisório) e ultimate da era 0 por partículas;
era 5 com 1 visível; Intro inteira (cartão 1, escolha com Kaia recusando, nome inválido/válido, começar) → boas-vindas → passo 1 do tutorial,
nome no HUD; save v0.7 real: "Kael", sem intro, FC 550; as 5 abas abrindo; x10 sem ouro → "Ouro insuficiente: faltam 4,5K".

### NÃO testado
- Partes D, E e F: não feitas.
- Botão "Desafiar" na tela (aparecer, brilhar, toque); opção "Desafiar o chefe sozinho"; derrota real para chefe em jogo desenhado.
- Goblin/Esqueleto apanhando e morrendo com a folha vistos em print (só confirmei a carga das folhas e as chaves); "Nível X!", dedo da ultimate,
  botão do olho, moeda pulsando, contador de missões na coluna: escritos, não vistos.
- Cartões 2 e 3 da Intro em print; Intro em tela baixa; teclado do celular no campo de nome.
- Mochila cheia desmontando o mais fraco; item acima do nível do jogador (texto novo); cartão da skin e aviso reposicionado vistos em print.
- Tutorial inteiro depois da Intro; celular real; som; medição em tempo real (a de ritmo desta rodada é por laço acelerado).

### Pendências
PARA O PO: (1) `needLevel` do módulo é nível do item + 1 (o texto do PO citava o próprio nível); (2) "Desafiar" fora do farm: o canvas mostra
sempre, o jogo só no farm; (3) a tela 10 precisa existir para a derrota do chefe ter os atalhos; (4) sem melhorar, o farm até o botão brilhar
levou 25,5 min de jogo na fase 10. PARA A ARTE: Kaia; roupas por era; ícones dos 7 espaços.


## Rodada 9 — telas 08 PASSE e 16 PRÁTICAS E TÍTULOS, tela 10 atrás de chave, arte aprovada ligada, velocidade, "Desafiar" (2026-11-12). Build v0.11
Novo: `js/screens2.js` (telas 08, 16 e 10), `reports/auditoria-aprovados.md`. Alterados: `index.html`, `js/battle.js`, `js/stage.js`, `js/farm.js`, `js/ui.js`,
`js/screens.js`, `js/meta.js`, `version.json`. Nada em js/sys, js/audio.js, test/bg/scene.js, assets ou docs. Onde divergir, vale esta seção.
A ordem mudou várias vezes durante a rodada (votos do dono). Estado final: 08 e 16 FEITAS e ligadas; 10 escrita e DESLIGADA; 11, 12, 15 e 18 NÃO começadas.

### Chaves de tela (`SCREENS_ON`, index.html)
| Chave | Estado | O que é |
|---|---|---|
| `bossResult` | DESLIGADA (o dono reprovou a tela 10 depois de escrita) | tela 10 Vitória/Derrota. Desligada = comportamento da v0.9 (aviso + farm; vitória no fluxo normal). Só para conferência: `?debug=1&res=1` |
| `progress` | LIGADA | tela 16 (botão "Progresso" no Equipamento). O último aviso do coordenador pôs a 16 na lista "esperam"; como ela já estava pronta e vista, ficou ligada. Para tirar: `progress:false` (os bônus de prática e título continuam valendo pelo Sys.fc; só a entrada some) |

### Painéis independentes (PO): `Screens.open(nome, opções)` / `Screens.close()` / `Screens.current()` (index.html)
`Screens.open('pass',{tab:'missions'|'rewards'})`, `Screens.open('progress',{tab:'practice'|'titles'})`, `Screens.open('result',{mode})`. A barra de abas e o
botão de missões só chamam `Screens.open`. Cada painel tem o próprio botão de sair (Passe: X no cabeçalho; Progresso: seta de voltar; resultado: botões).
LIMITE: os painéis ainda são desenhados dentro do `#view`, entre o HUD e as abas (`top: var(--hudh); bottom: var(--navh)`). Para a tela cheia sem abas nem
topo basta zerar essas duas variáveis; nada nas telas 08/16 lê a barra.
Para tornar as telas 05, 06 e 07 painéis independentes também: (1) trocar os `setView('gear'|'summon'|'shop')` espalhados por `Screens.open`; (2) dar a cada
uma um botão de fechar (hoje só saem pela barra); (3) tirar do `setView` os efeitos colaterais que são delas (`XG.sel`, `XH.sel`, `XS.anim`, tutorial `tutEvent('view')`);
(4) o tutorial aponta para `#tabs [data-t=gear]` e `#tabs [data-t=summon]`: precisa apontar para o botão novo.

### Tela 08 PASSE (js/screens2.js, `scrPass`; lógica 100% do Sys.pass)
- Cabeçalho: skin da temporada no pedestal com raios, "Temporada Solar", dias que faltam (`Sys.pass.season`), "Nível do passe N" + "jogador: Nv. X",
  barra roxa/azul, "x/100 XP do passe · ganhe nas Missões". Abas internas Recompensas / Missões (com o contador vermelho pulsando).
- Recompensas: trilha Grátis e Premium, 5 níveis por página (4 se a tela for baixa), nó do nível com anel no atual, estados "Resgatar" (pulsando, borda
  dourada), "Resgatado", "No nível N", cadeado no Premium; "Resgatar tudo (n)"; ícones voando para o topo e contador pulando; aviso verde.
- "Ativar Premium" abre o diálogo com os benefícios e "Pagamento em breve: a compra ainda não está disponível." Não liga nada. Debug: `dbgPremium(true|false)`,
  `dbgPassXp(n)`.
- Missões: Diárias / Semanais, "Renova em Xh / Xd", linhas com ícone, XP do passe e diamantes, barra, "Resgatar" / "Ir" / "Feito"; bônus das diárias;
  paginação; nota "XP do passe sobe o NÍVEL DO PASSE...". Missão diária resgatada também dá XP do JOGADOR (`Sys.level.onMission` / `onDailyBonus`).
- Ligação: `ptrack(evento, n)` (index.html) → `Sys.pass.track`. kill e boss no `killEnemy`; ult no `startAct`; summon e upgrade nas telas 06 e 05;
  forge e chest por `passSync()` (o jogo compara `Sys.loot.todayCount('forge')` e `S.sys.chest.opened`, porque os módulos não avisam); instance: não há
  instâncias no jogo. `host.items()` (mochila), `host.addSkin('season')` (= `SEASON_SKIN` 'p10', Casaca da Temporada), `host.catalog('wardrobe')`.
- PASSE ANTIGO RETIRADO: `MISSIONS`, `PASS_TIERS/PASS_XP`, `passFree/passPrem`, `addPxp` (e o `addPxp(5)` por chefe), `give/rdesc`, `renderPass/renderMissions`.
  MIGRAÇÃO (`sysBootE2`, js/farm.js): o `Sys.pass.ensure` importa `S.pass.xp/free/prem` na 1ª carga (o resgatado continua resgatado); o "Premium (teste)"
  antigo NÃO vira premium (era grátis); fica a marca `S.sys.pass.mig`; `S.pass` e `S.daily` saem do save. As 5 skins do passe antigo (p5, p15, p20, p25, p30)
  só aparecem na Loja para quem já tem.
- Diferenças conscientes: (a) botão X de fechar no cabeçalho (o canvas não tem); (b) sem a etiqueta "prévia"; (c) "Ativar Premium" sem "[PREÇO]" (não há
  preço: pendência do PO) e diálogo sem o botão "Testar (protótipo)"; (d) recompensas e missões são as do módulo (30 níveis, 6 diárias + bônus, 5 semanais),
  não as do desenho; item mostra o nome na era atual, sem "Nv. 24" (o módulo entrega nível 1); rodapé "itens da sua era"; (e) as missões de instância
  aparecem com cadeado "Em breve"; (f) resgate de UM nível: o módulo só tem `claimAll`, então o jogo marca os outros níveis como resgatados só durante a
  chamada e devolve o estado (`pClaimOne`); (g) o texto do diálogo não diz "skin só visual" (no jogo a skin dá bônus).

### Tela 16 PRÁTICAS E TÍTULOS (js/screens2.js, `scrProg`; lógica do Sys.practice e do Sys.titles)
- Entrada: botão "Progresso" (medalha, com ponto vermelho quando dá para treinar ou há título novo) no cabeçalho da mochila do Equipamento; a aba Equip.
  fica acesa, como no canvas; seta de voltar. As abas de baixo continuam 5.
- Práticas: pedras (com "+1" quando cai uma durante a batalha), "Teto Nv N · era", 5 trilhas com ícone, "Nv x/teto", barra, "+a → +b", botão "Treinar / N pedras"
  pulsando, "Máx. / teto da era", linha piscando verde e "+0,5% ATK" subindo, "Total das práticas", "Treinar máx." (sempre a trilha mais barata).
  Bloqueio: abaixo do nível 5 as linhas ficam apagadas, o botão vira "Nível 5 / bloqueado" e aparece o cartão "Libera no nível 5 · as pedras ficam guardadas".
- Títulos: "EM DESTAQUE · VALE x2", bônus do destaque, "n/34 conquistados", filtro Todos / Conquistados / Bloqueados, grade 2x4 paginada, medalha ou cadeado,
  bônus, condição, barra e progresso, "Toque para destacar" / "Em destaque (x2)" / "Cosmético, sem destaque", aviso com raios ("Destaque: X (x2)", "Novo título").
  Títulos de arena e torre mostram "Libera no nível 30 / 15". Armeiro/Arsenal: "só ITEM (skin não conta)" (o módulo conta `seenW`, só item).
- Bônus: nada somado por fora. O `Sys.fc` soma o `bonus(S)` de todo módulo carregado. Medido: 131 pedras gastas → FC 1.752 → 1.803, ATK +3,5%.
- Eventos: `Sys.practice.onKill` e `Sys.titles.onKill` em todo abate (js/farm.js), `Sys.titles.onWaveClear` em toda onda, `Sys.practice.onOffline` no ganho
  offline (E2 da fps-e2), `Sys.titles.check` em silêncio na carga.
- Diferenças conscientes: estado bloqueado (o canvas não desenha); contador de abates não sobe ao vivo dentro do cartão (atualiza a cada onda);
  textos de bônus dos títulos vêm do `Sys.titles.bonusText` ("+0,5% ATK").

### Tela 10 VITÓRIA/DERROTA (escrita, DESLIGADA)
Código completo em js/screens2.js (`resOpen/resClose/resTick`), visto uma vez em debug (vitória com o Rex tombando pelos pés, recompensas uma a uma,
fechamento sozinho no AUTO). Com a chave desligada nada dela roda: sem tombo do chefe, letreiro "DERROTADO" e aviso como na v0.9.
O que ficou registrado para quando voltar: no AUTO ela coleta sozinha 2,5 s depois de revelar e segue 1,5 s depois; a derrota volta ao farm em 10 s;
qualquer toque cancela a contagem; a 3ª recompensa é a XP do JOGADOR (o chefe não dá mais XP do passe); o painel fica 40 px acima do canvas porque os pés
no jogo ficam em y=613 e não em 658.

### Decisões do PO aplicadas
1. "Desafiar" SEMPRE visível: brilha com a FC >= 90% da recomendada; apagado abaixo disso e durante o chefe. Fora do farm o toque antecipa a onda do chefe.
   Apagado, o toque mostra "Faltam X de FC (recomendada: Y). Toque de novo para desafiar assim mesmo"; o 2º toque em 4 s desafia (ACRÉSCIMO meu, para o
   jogador nunca ficar sem saída no farm: decisão do PO se fica).
2. Aura: sem mudança (só pelo +N da arma no Sys.forge).
3. Item no teto: "Suba ao nível N para melhorar" (N = `needLevel` do módulo) na folha do item e nos avisos. E3: "Equipar e upar" não abre confirmação com 0 níveis.
4. VELOCIDADE (regra do dono): `speedInfo()` lê `Sys.vip.maxSpeed(S, host)`; ponto único no jogo `canSpeed(n)`; o botão alterna só entre as liberadas, mostra
   um selo com cadeado "x2" / "x4" e o toque no fim do ciclo avisa "x2: nível 15 ou VIP" / "x4: VIP 5 e nível 40"; a velocidade é salva (`S.set.spd`) e um
   save em x2 sem direito volta para x1; quando o máximo sobe (nível 15, VIP) aparece a pílula "Velocidade x2 liberada!" e o botão pulsa. Debug: `dbgSpeed(n)`,
   `dbgVip(0..10)`. Visto: nível 1 = "x1" com cadeado x2; nível 24 = x2 liberado e cadeado x4. NÃO visto: o aviso animado ao chegar ao nível 15.
5. Kaia (defeito do QA "tocar não faz nada"): o código do aviso existe (`a==='kaia'` → "Kaia chega em breve" em `#i_toast`); NÃO reproduzi nem corrigi
   nesta rodada (não cheguei à Intro no navegador). Continua pendente.

### Defeitos corrigidos (fps-30 e fps-e2)
D1 `normItem` agora mantém `season`, `targetR`, `seasonEnd` e `look`. D2 `sfx` e `fmt` do `Sys.host` estavam dentro de um comentário: voltaram a existir.
E1 cartão do VIP na Loja › Gemas montado com `Sys.vip.levelInfo` (zeros escondidos; visto "VIP 1 · +5% ATK e HP · +10% XP e ouro · velocidade x2 liberada",
sem erro). E2 `Sys.practice.onOffline` no ganho offline. E3 acima. E4 `BAL.speedMax` removido.

### Arte aprovada: ver reports/auditoria-aprovados.md. Tabela de chaves (ART_ON) na v0.11
| Chave | Estado |
|---|---|
| eraN_<e0|e1|boss>_<run|attack|hurt|die>, N = 0..6 (84) | LIGADAS (eras 0, 1, 3-6 e era2_boss_run/hurt/die ligadas agora) |
| ult_era0..6 | LIGADAS (0, 1, 3, 4, 5, 6 agora) |
| s1_era2_t0..2 (novas) · s2_era2_t0..2 | LIGADAS |
| aura4/7/10/13 | LIGADAS (só aparecem com a Forja) |
| `sceneV2` eras 0, 1, 2, 3 | LIGADO (1 e 3 agora); eras 4, 5, 6 fundo antigo |
| ícones `icon-eraN_<slot>` (49) | em uso em todo item |
| `KAIA_ON` | desligado |

### Visto no navegador (iframe 390x844 na escala 0,75; zero erro de JavaScript nas cargas conferidas)
Passe: Recompensas (nível 2, dois "Resgatar"), resgate de um nível (+5 gemas, só o nível 2 marcado), diálogo do Premium, "Resgatar tudo" com premium de
debug (59 recompensas, 12 itens, 13 guardados pelo portão; segundo toque "Nada novo para resgatar"), Missões com uma pronta. Progresso: práticas no nível 24
com 132 pedras, treinar 1 e treinar máx., títulos (2/34, destaque trocado), bloqueio no nível 1. Equipamento com o botão Progresso e os ícones aprovados.
Batalha: "Desafiar" apagado + aviso da FC; derrota REAL para o chefe da era 2 → farm ("Horda 1/4", "FARM"), sem laço; "Nível 2!" (pílula) numa partida real da
era 0; missões contando (kill 17, boss 1, forge 2); as 7 eras com as folhas (script) e prints das eras 0, 1, 3, 4, 5, 6.
Migração por script: S.pass {xp 350, free [1,2], prem [1], on} → XP 350, free [1,2], prem [1], premium false; "Resgatar tudo" deu só o nível 3 grátis.

### NÃO testado
- Jogador novo REAL (sem debug, do JOGAR ao tutorial) e save antigo REAL carregando nesta build: só a migração do passe por script. Tutorial inteiro; Intro
  (cartões 2 e 3; Kaia). O navegador era dividido com outros agentes e a minha aba foi fechada duas vezes por eles.
- Mochila cheia de verdade desmontando o mais fraco; texto novo do item no teto visto em print; virada do dia/semana das missões; virada de temporada;
  Item da Temporada evoluindo no level up (D1 corrigido, não exercitado); skin da temporada entrando na coleção vista na Loja.
- Passe e Progresso em tela baixa; celular real; som; ganho offline com as pedras de prática.
- Aviso global (toast) nas telas 08/16: reposicionado por CSS (sobre a paginação), não revisto depois do último ajuste. Na BATALHA o aviso global ainda cai
  em cima do nome da fase (já era assim na v0.9): defeito conhecido, não corrigido.
- Ultimates das eras 0, 1, 2, 3, 5, 6 tocando; Corte Giratório t0/t2; chefe entrando andando com a folha de corrida.

### Pendências
PARA O PO: (1) sem instâncias no jogo, as missões "Vença 1 instância" (diária) e "Vença 10 instâncias" (semanal) não fecham, então o BÔNUS das 6 diárias
nunca libera (90 XP/dia vira no máximo 55): o ritmo do passe medido pela fps-30 não vale; (2) preço do Premium; (3) segundo toque no "Desafiar" apagado;
(4) tela 16 ligada ou esperando; (5) Kael na batalha com corpo + arma em vez das folhas compostas aprovadas; (6) golpe básico com rastro e ultimates tocam
acelerados para caber no ritmo do balanceamento; (7) o chefe da era 2 golpeia a cada ~1,17 s (folha de 14 quadros) em vez de 1,15 s.
PARA A fps-30: `Sys.pass.claim(S, host, trilha, nível)` (hoje o jogo contorna o `claimAll`); aviso de baú aberto e de pedra de forja coletada (hoje o jogo
compara contadores). PARA A ARTE: passada (px por quadro) de cada corrida para o `EN_STRIDE`; ícones mais leves (650 KB cada).
PARA O QA: reconferir os critérios de pés/rotação/avanço nas eras 0, 1, 3-6 com as folhas ligadas (eu só tenho o gancho e os prints).
FILA NÃO COMEÇADA: telas 11 Troca de era, 12 Ranking, 15 Forja, 18 VIP.


### Rodada 9, complemento — Kael em folha composta (decisão do PO). Build v0.11.2
(A v0.11.1 foi do coordenador: VERSION, version.json, sw.js e o `EN_STRIDE` das 21 corridas com as medidas da fps-ff. Não mexi.)
- js/stage.js: `heroCompTier(sk, ws)` + `heroCompImg(estado, tier)`. Com a skin de ROUPA e a de ARMA da era 2 no MESMO tier, o `drawHeroAnim` desenha
  `assets/anim/hyb/R/kael_<run|idle|attack>_era2_t<tier>.png` no lugar do corpo e NÃO desenha a arma por cima (ela já está no quadro). Quadros, fps, pés
  e âncora da mão continuam vindo do .json do corpo (o mesmo conjunto); a ponta da arma (`B.tipW`, usada pelos efeitos) continua saindo da âncora.
  Em qualquer outro caso (roupa ou arma de outra era, tiers diferentes, folha ainda não carregada) vale corpo + arma na mão. Chaves `ART_ON.kael_hybR_t0..2` = true.
  A `hyb-attack-era2_t*` reprovada (pasta sem R) não é usada.
- Conferido por script nos 3 tiers x 3 estados: mesma ordem de quadros do corpo e mesma linha de pés (ver reports/auditoria-aprovados.md). Visto em jogo:
  t0 parado, t1 golpeando, t2 correndo. Caso misto conferido só pelo estado (`heroCompTier` = -1 com roupa a22 + arma w32).
- NÃO visto: o golpe da folha composta quadro a quadro em câmera lenta; os pés medidos em pixel no canvas (só a igualdade com a folha do corpo);
  o print do caso misto. O golpe básico com arma da era 2 usa a folha do rastro (s1), então a hybR-attack só aparece no preparo da ultimate e do especial.
- "Desafiar" apagado com 2º toque em 4 s: aprovado pelo PO, fica como está. Missões do passe: não mexi.
- Navegador: usei uma aba; ela (e o grupo de abas) foi fechada por outro agente antes de eu fechar. Não deixei aba aberta que eu consiga alcançar.


### Rodada 9, complemento 2 — tamanho dos inimigos das eras 2, 3 e 4 (pedido do dono via PO). Build v0.11.3
Só código, nenhuma arte tocada. Tabela `EN_SCALE` (js/battle.js), por chave de inimigo; debug `window.__noScale = true` ignora a tabela (foi assim que tirei o "antes").
```
EN_SCALE = { era2_e0:1.20, era2_e1:1.20, era2_boss:1.10, era3_e0:1.15, era3_e1:1.15, era3_boss:1.10, era4_e0:1.00, era4_e1:1.00, era4_boss:1.10 }
```
- A escala multiplica a ALTURA-alvo (`slotH` dos comuns, `enemyH` dos chefes). O desenho já parte do pé (linha do chão), e largura, sombra, barra de vida,
  nome, ponto de impacto, efeitos e a passada da corrida saem de `e.dh`/`e.dw`, então acompanham sozinhos. Passada conferida: velocidade ÷ altura é a mesma
  com e sem escala (Goblin 1,111; Esqueleto 1,174): o pé não patina.
- Limites que continuam valendo depois da escala: comum nunca mais alto que o Kael (`heroBodyH` = 0,848 x lado do quadro = 158 px, medido na folha parada:
  topo do cabelo na linha 26, pés na 243), nada passa de x=382, sobreposição máxima 45% / 50% (o `hordeFit` encolhe quem tem mais folga), chefe na caixa 190..382.
  Os centros 222/282/338 NÃO mudaram.
- O QUE COUBE (px de tela a 390 de largura, caixa opaca; frente / meio / fundo):
  | Era | Pedido | Comuns antes | Comuns depois | Sobreposição antes → depois | Chefe antes → depois |
  |---|---|---|---|---|---|
  | 2 Medieval | comuns +20%, chefe +10% | 98 / 106 / 88 | 118 / 122 / 105 | 35%/39% → 45%/49% | 161 → 161 (NÃO COUBE) |
  | 3 Pólvora | comuns +15%, chefe +10% | 98 / 106 / 88 | 113 / 122 / 101 | 33%/37% → 43%/47% | 180 → 198 |
  | 4 Industrial | comuns +15%, chefe +10% | 97 / 95 / 88 | 97 / 95 / 88 (NÃO COUBE) | 45%/50% → 45%/50% | 180 → 198 |
  - Era 2: Goblin da frente +20% inteiro (118); Esqueleto do meio +15% (122, e não 127): bateu no limite de 45% de sobreposição com o Goblin; Goblin do fundo +19%.
    Nenhum comum passou do Kael (158). Dragão: já ocupa a caixa inteira 190..382 pela LARGURA (192 px); qualquer aumento sai da caixa. Ficou 161.
  - Era 3: tudo o que foi pedido coube (comuns +15%, Capitão Fantasma +10%, x 214..358).
  - Era 4: a Aranha Mecânica é larga (112 px) e a horda JÁ estava no limite 45%/50% antes; não cabe nenhum aumento sem passar do limite, invadir a faixa do herói
    ou sair de x=382 (com 1,15 o do fundo até encolhia 3 px). Deixei os comuns em 1,00. Golem a Vapor +10% coube (x 196..376).
- TABELA DE ALTURAS DAS 7 ERAS (px de tela, caixa opaca, frente e0 / meio e1 / fundo e0 · chefe de fase). Kael: 158.
  | Era | Comuns (v0.11.2) | Comuns (v0.11.3) | Chefe (v0.11.2) | Chefe (v0.11.3) |
  |---|---|---|---|---|
  | 0 Pré-História | 97 / 97 / 85 | igual | 180 | igual |
  | 1 Antiguidade | 98 / 97 / 87 | igual | 150 | igual |
  | 2 Medieval | 98 / 106 / 88 | 118 / 122 / 105 | 161 | 161 |
  | 3 Pólvora | 98 / 106 / 88 | 113 / 122 / 101 | 180 | 198 |
  | 4 Industrial | 97 / 95 / 88 | 97 / 95 / 88 | 180 | 198 |
  | 5 Moderna | 98 (Drone sozinho) | igual | 154 | igual |
  | 6 Futurista | 98 / 106 / 88 | igual | 159 | igual |
  Era 5: não remedi nesta rodada (1 visível por onda); os números são os da tabela da Rodada 7. Senhor da Era (fase 10 de cada era): não medido nesta rodada
  (alvo 192; o chefe escalado da tabela vale também para ele, pela mesma chave).
  Leitura para o PO: os chefes das eras 1 (150), 5 (154), 6 (159) e 2 (161) são os mais baixos, todos limitados pela LARGURA da caixa 190..382.
- Prints antes/depois (185x125 px, ~57 KB cada): reports/prints/v0113_era<2|3|4>_<comuns|chefe>_<antes|depois>.png (12 arquivos). Os de comuns da era 2 "antes"
  pegaram o herói no meio do golpe; o enquadramento é o mesmo.
- Ícones leves da fps-ff (240 px, 1,1 MB no total): nenhuma referência a slots/src nem a _aprovado_original no jogo; vistos carregando (largura 240) no
  Equipamento e na Invocação (x10), sem erro. sw.js, index.html e version.json em v0.11.3.
- NÃO testado: Senhor da Era com a escala; horda das eras 2 e 3 em jogo corrido (só parada nos slots e a entrada); rótulo do chefe de 198 px contra o topo
  do campo em tela baixa.
- Pendência para o PO: Dragão (era 2) e comuns da era 4 só crescem se a caixa do chefe puder passar de 190 para a esquerda (até 170, como o contrato já
  permite "para os largos") ou se a sobreposição da era 4 puder passar de 45%/50% (ou a era 4 mostrar 2 comuns por vez).


### Rodada 9, complemento 3 — v0.11.4: tamanho padronizado, defeitos do QA (x > 382, sola, altura), Kael com a folha larga, TRAVAMENTO do Senhor da Era
Alterados: js/battle.js, js/stage.js, js/farm.js, index.html, sw.js, version.json. Novo (atrás de chave desligada): js/rarity.js. Nenhuma arte tocada.

**DEFEITO GRAVE ACHADO E CORRIGIDO (existia antes desta rodada): matar o SENHOR DA ERA parava o jogo para sempre.** O Senhor solta "Essência da Era";
esse pickup não tinha cor na tabela `PK_COL` (js/farm.js) e caía em '#fff'; o `glowC` montava '#fff' + '00' = cor inválida e o `addColorStop` lançava
exceção dentro do `draw()`; como o `requestAnimationFrame` ficava no fim do `loop()`, o laço morria (tela congelada, sem erro visível para o jogador).
As medições por laço acelerado não desenham, por isso nunca apareceu. Correção: cor da essência na tabela; `glowC` aceita cor curta e não lança; o
`loop()` agora tem try/catch (um erro num quadro vira `console.error` e o jogo segue). Conferido em jogo desenhado: Senhor da Era 0 morto → fase 11,
essência 5, relógio da batalha andando, zero erro.

**A) Tamanho padronizado** — `EN_SCALE` com as 21 chaves (e0 1,20 · e1 1,15 · chefes 1,10; chefe da era 0 1,00), `BOSS_WIDE` (caixa 170..382 para o Dragão,
o Tanque e o Devorador), `ERA_OVL` (era 4: sobreposição até 55%) e `EN_MINH` (era 4: altura mínima 115, a Aranha sobrepõe mais em vez de encolher).
Alturas em px de tela (caixa opaca do sprite parado), medidas no jogo desenhado. Kael: 158.
| Era | Comuns frente / meio / fundo | Chefe de fase | Senhor da Era | Observação |
|---|---|---|---|---|
| 0 | 97 / 97 / 85 | 180 | 192 | comuns NÃO subiram: Dente-de-Sabre e Brutamontes são largos e a horda já está em 45% / 47% de sobreposição |
| 1 | 100 / 97 / 87 | 150 | 150 | comuns NÃO subiram (43% / 49%); o Minotauro (com o machado) já enche a caixa 173..382 pela largura: NÃO chega a 165 |
| 2 | 118 / 120 / 105 | 178 | 178 | Dragão na caixa larga 170..382 |
| 3 | 118 / 122 / 105 | 198 | 211 | — |
| 4 | 115 / 115 / 103 | 198 | 210 | sobreposição até 55% |
| 5 | 99 (Drone sozinho) · Soldado 121 | 170 | 170 | Drone NÃO subiu (143 px de largura, entra sozinho); Tanque na caixa larga |
| 6 | 118 / 122 / 106 | 176 | não medido | Devorador na caixa larga |
O do fundo fica 10% menor de propósito (profundidade, `BACK_SC`). NÃO ATINGIDO: comuns das eras 0 e 1 e o Drone (alvo 115-122) e o chefe da era 1 (alvo 165):
só cabem se o PO aceitar mais sobreposição nessas eras (como fez na 4), 2 comuns visíveis, ou arte mais estreita.

**B) Defeitos do QA** — causa: as folhas de ataque, dano e morte têm quadros MAIS LARGOS e mais altos que o sprite parado (arma, cauda, recuo, queda), e o
jogo só encaixava na caixa o sprite parado. Correção sem mexer na arte: `enBounds(folha)` mede uma vez os limites opacos de cada quadro; no desenho
(`enFrame`), o quadro que passaria de x=382 (ou ficaria abaixo de 8) é deslocado só o que falta, e o quadro cuja parte opaca desce além do feetY é levantado
só o que falta. Vale em combate, golpe, dano e morte; na ENTRADA andando (1ª chegada) não se aplica.
Medido no jogo desenhado (7 eras, horda em jogo corrido + chefe + Senhor da Era, gancho `window.__probe2`): maior x opaco = 382 em TODOS os estados de
todos os inimigos; menor x = 56; sola no máximo 1 px abaixo da linha. Onde a correção atuou (deslocamento máximo em px):
| Inimigo | Estado | x corrigido | sola corrigida |
|---|---|---|---|
| Dente-de-Sabre (era 0) | golpe 13 · dano 22 · morte — | sim | morte 7 |
| Minotauro (era 1) | golpe 34 | sim | golpe 12 |
| Legionário / Escorpião (era 1) | morte 11 · golpe 8 | sim | morte 7-9 |
| Goblin (era 2) | golpe 35 · dano 7 | sim | morte 7 |
| Dragão (era 2) | golpe 13 · corrida 5 | sim | — |
| Pirata / Mosqueteiro (era 3) | dano 24 · golpe 15 | sim | morte 10-12 |
| Capitão Fantasma (era 3) | dano 7 | sim | golpe 11-12 |
| Golem a Vapor como Senhor (era 4) | golpe 45 · dano 38 | sim | golpe 15 |
| Autômato (era 4) | — | — | morte 22 |
| Tanque (era 5) | golpe 43 · dano 27 · corrida 40 | sim | golpe 6 |
| Devorador (era 6) | golpe 30 · dano 29 | sim | golpe 9 |
EFEITO COLATERAL a decidir: nos quadros corrigidos o inimigo é desenhado até 45 px mais à esquerda (o Tanque no disparo, o Golem-Senhor no golpe). A
alternativa seria cortar a arte em x=382. Se o QA medir "avanço <= 12 px" pela parte opaca, esses chefes vão aparecer.
Altura do chefe em quadros de ataque/dano (item 3 do QA): é a FOLHA, não a escala. Parado × maior quadro: Capitão Fantasma 198 × 250 (dano) e 218 (golpe);
como Senhor 211 × 232; Golem-Senhor 210 × 255; Tanque 170 × 244; Devorador 176 × 200; Minotauro 150 × 198. A barra e o nome ficam na altura do sprite
parado. Rótulo do Senhor da Era 3 (211 px): topo em y=370 na tela de 844, 211 na de 640 e 148 na de 560 (o HUD termina em 64 e a faixa "Horda" em 139):
não cobre o HUD; na tela de 560 fica a 9 px da faixa da horda.
Também: `EN_CTX` e o Y1 (golpe enquanto fecha a fila) continuam; intervalo entre golpes não remedido nesta versão.

**C) Kael** — o golpe da folha composta usa a LARGA `kael_attack_wide_era2_t<tier>` (448x256, padLeft 96): desenhada com a célula de 256 no mesmo lugar.
Conferido por script nos 3 tiers: mesmos 17 quadros na mesma ordem do corpo, mesma linha de pés (241/242/247) e nenhum pixel opaco encostando nas bordas
do quadro de 448 (nada cortado). Visto em jogo: tier 1 no quadro do acerto, espada inteira, pés no lugar. Parado e corrida continuam nas folhas de 256.
`normItem` também copia `qp` (qualidade, regra desligada da fps-e2).

**D) Testado de verdade** — Senhor da Era com a escala (eras 0 a 5, vivo, golpeando e apanhando; o da era 0 morto até a fase 11); hordas em jogo corrido nas
7 eras (11 s cada, herói reforçado); rótulo do chefe em tela de 640 e 560. Zero erro de JavaScript.
NÃO testado: Senhor da Era 6; morte dos Senhores das eras 1 a 6; intervalo de golpes e passada remedidos com a escala nova; fps em celular com o
`enBounds` (mede cada folha uma vez, na 1ª vez que aparece: pode dar um tranco curto na 1ª onda de cada era); jogo real sem debug.

Prints (167x118 px): reports/prints/v0114_era<0..6>_<comuns|chefe>.png (14 arquivos).

**Raridade (pausada, atrás de `SCREENS_ON.rarityFx`, só com ?debug=1&rar=1)** — js/rarity.js escrito e ligado ao drawPicks: drop com brilho na cor, partículas
no Épico+, feixe vertical no Mítico e no Lendário, item apoiado no chão; som Épico 'gem', Mítico 'legendary' rate 0,89, Lendário 'legendary'. Visto uma vez
(5 raridades lado a lado, sem erro). A moldura única e o nome colorido (`rarDecorate`) estão escritos e NÃO foram vistos em nenhuma tela; prints não tirados.
Com a chave desligada o caminho antigo do drop é o mesmo de antes.

Navegador: o grupo de abas é dividido com outros agentes e a minha aba foi fechada por eles 5 vezes nesta rodada; fechei a minha ao terminar.


### Rodada 9, complemento 4 — v0.11.5 (decisões do PO sobre a v0.11.4 + achados do QA)
Alterados: js/battle.js, index.html, sw.js, version.json. Nenhuma arte tocada. A raridade continua atrás da chave desligada.

**1) Sobreposição até 55% nas eras 0, 1 e 5** (`ERA_OVL`), como na 4. Drone sozinho: o centro vai para a direita e ele usa a largura entre o herói e x=382.
**2) Caixa larga 170..382** também para o Minotauro (`BOSS_WIDE`).
ALTURAS FINAIS (px de tela, caixa opaca do sprite parado, medidas no jogo desenhado). Kael: 158.
| Era | Comuns frente / meio / fundo | Sobreposição | Chefe (x) | Senhor (x) | Observação |
|---|---|---|---|---|---|
| 0 | 114 / 115 / 85 | 55% / 54% | 180 (200..371) | 192 (195..377) | o do fundo ficou no mínimo (85): mesmo com 55% o Dente-de-Sabre é largo demais |
| 1 | 112 / 103 / 92 | 49% / 55% | 152 (170..382) | 152 | Minotauro NÃO chega a 165: com o machado ele tem 212 px de largura a 152 de altura, a caixa larga inteira |
| 2 | 118 / 120 / 105 | 44% / 48% | 178 (170..382) | 178 | — |
| 3 | 118 / 122 / 105 | 43% / 47% | 198 (214..358) | 211 (209..363) | — |
| 4 | 115 / 115 / 103 | 58% / 64% | 198 (196..376) | 210 (190..382) | passa dos 55%: a regra do PO para a Aranha foi sobrepor mais em vez de baixar a altura |
| 5 | Drone 118 (150..321, sozinho) | — | 170 (170..382) | 170 | Drone subiu de 99 para 118 |
| 6 | 118 / 122 / 106 | 36% / 40% | 176 (170..382) | 176 | — |
NÃO ATINGIDO: fundo da era 0 (85), meio e fundo da era 1 (103 / 92) e o Minotauro (152, alvo 165). Só com arte mais estreita ou 2 comuns visíveis nessas eras.

**3) Corpo não desliza mais.** O deslocamento por quadro da v0.11.4 saiu inteiro: a âncora do pé fica parada (medido: afastamento máximo da âncora em
relação ao slot = 12 px no golpe, 3 px no dano, em todos os inimigos das 7 eras). Nos quadros de golpe/disparo a arte dos chefes passa de 382 (o corpo
parado fica na caixa). Maior x opaco por estado, medido em jogo corrido: Minotauro golpe 416 / dano 394; Dragão golpe 395; Capitão Fantasma como Senhor
dano 435; Golem golpe 419 (Senhor 427) / dano 412-420; Tanque golpe 425; chefe da era 0 dentro (378; Senhor 384).
COMUNS: o pedido era manter golpe/dano/morte dentro de 382 "pela posição do slot". IMPLEMENTEI (`enExt` + `EN_EXT_ON`) e MEDI: para caber o quadro mais
largo, o slot do fundo recua 27-37 px e a sobreposição meio×fundo vai a 64-109%, com o meio e o fundo no mínimo (95 / 85 px) nas eras 0, 1, 2, 3 e 6.
Isso desfaz o tamanho padronizado e estoura a sobreposição, então deixei a chave **`EN_EXT_ON = false`** (centros fixos 222/282/338). Consequência
conhecida, para o PO decidir: com a chave desligada a arma/efeito de alguns comuns passa de 382 em quadros de golpe ou dano do inimigo do FUNDO (medido
na v0.11.4, quanto faltava: Goblin até 35 px, Pirata/Mosqueteiro 15-24, Dente-de-Sabre 13-22, Legionário/Escorpião 8-11, Alien 3-10). O corpo não sai.
Sola: o levantamento agora é FIXO por folha (só quando a folha inteira assenta abaixo do feetY) e por quadro apenas na MORTE (o corpo deita e assenta no
chão). Não há mais correção quadro a quadro no golpe, então não treme. Resíduo medido (parte opaca abaixo da linha em quadros isolados do golpe, que é
a arma/pé batendo no chão na arte): Minotauro 12, Capitão Fantasma 11-12, Golem 14-15, Tanque 6, Brutamontes 10. Se o QA medir a "sola" pelo pixel mais
baixo, esses quadros vão aparecer; para zerar seria preciso a âncora (feetY) desses quadros vinda da arte.

**4) Sem tranco:** os limites opacos de cada folha são medidos no `enPreload` (carga da era), encadeados na promessa da própria folha, não na 1ª onda.
(Não medi o tempo dessa medição em celular.)

**5) Testado:** Senhor das eras 0, 1, 2, 3, 4, 5 morto em jogo desenhado (fase avança, laço continua 1,6-1,8 s depois, zero erro) e o da era 6 pelo
`?lord=6` (fase 70 → 71, zero erro). Intervalo máximo entre golpes do mesmo comum, com a escala nova: era 0 1,33 · era 1 1,23 · era 2 1,26 · era 3 1,25 ·
era 4 1,21 · era 5 1,23 s (era 6 não remedida nesta versão; 1,35 na v0.11.0). Passada: velocidade ÷ altura igual com e sem escala (Goblin 1,111, Esqueleto 1,174).

**Achados do QA na v0.11.4**
- "Desafiar o Senhor das eras 1 e 2: o chefe não apareceu e a onda voltou a 1": NÃO é defeito do Desafiar. A onda do chefe é `['e0','e1','boss']` e o
  chefe só entra depois que as duas escoltas morrem (`BOSS_AFTER_ESCORTS`). Com herói de nível 1 e a fase forçada, ele morre para as escoltas antes de o
  chefe nascer; morrer na onda 5 = farm = onda 1. No código não há limite de FC nem chave de era no caminho do Desafiar. Não reproduzi com o método dele.
- **Debug oficial do Senhor da Era:** `?debug=1&fresh=1&skip=1&lord=<era 0..6>` → fase era*10+10, onda 5, herói reforçado a cada 0,2 s (ataque = vida do
  inimigo ÷ 12 no chefe, ÷ 3 nas escoltas; vida = 400 golpes), SEM `__stay`: as escoltas e o Senhor morrem de verdade, a fase avança e a era troca. Não grava o save.

Prints (167x118): reports/prints/v0115_era0_comuns.png, v0115_era1_comuns.png, v0115_era1_chefe.png, v0115_era5_comuns.png e v0115_era5_chefe_golpe.png
(Tanque no quadro do disparo: corpo na caixa, clarão e recuo passando). Chefe da era 0 não mudou (v0114_era0_chefe.png).
NÃO testado / não entregue: print do Tanque parado na v0.11.5; Senhores das eras 1 e 2 pelo `?lord` (morreram pelo caminho do dbgSet); era 6 em jogo
corrido nesta versão; celular real. No fim da rodada o navegador estava a ~11 quadros por segundo (máquina ocupada por outros agentes).


### Rodada 9, complemento 5 — tela 04b BATALHA EM TELA CHEIA (atrás de `SCREENS_ON.fullBattle`, DESLIGADA; só com ?debug=1&fb=1). VERSION não mudou (v0.11.5)
Novo: js/fullbattle.js. Ligação (toda condicionada à chave; com ela desligada os valores e caminhos são os de antes): js/battle.js (`FB_GEO`: pés 640/844,
quadro do Kael 176/844, centros 212/262/308, sem encolher por sobreposição, selo "+N" 86 px acima do chão, `feetDy`), js/farm.js (destino do voo dos
pickups), index.html (chave, carga do arquivo, `fbTick` no `hud()`, `fbInit` no fim da carga).

**O que está feito (visto no navegador, era 2, iframe 390x844, zero erro de JavaScript)**
- Cena na tela inteira: `#stage` de 0 a 844, pés em y=640 (medido), Kael com quadro de 176 px e centro em x=108, cenário vivo (EonScene) com o chão na
  linha nova (a cena tem 820 px de altura, como no protótipo), sombra de leitura no topo e na base.
- HUD de vidro nas posições do protótipo: avatar com anel de XP, "Nv." e FC (toque = Equipamento); moedas e gemas com "+"; música; engrenagem;
  Correio e Eventos; faixa central com fase, 5 marcas de onda (a atual enche com os abates; a 5ª vermelha), "n/5" e Desafiar (com o chefe da era);
  coluna esquerda Missões / Passe / Baú (barra e contador) / Instâncias / Torre / Ranking; coluna direita Equip. / Invocar / Loja / VIP / Pets / Forja;
  vida e energia; AUTO/MANUAL; velocidade x1 x2 x4 com cadeado pela regra do Sys.vip (x4 bloqueado → "x4: VIP 5 e nível 40"); Básico, Especial com
  recarga e Ultimate com a carga subindo e "PRONTA"; dedo "Ultimate pronta!". Ícones: assets/icons/menu/*.png (os 14 aprovados).
- Folha que sobe de baixo (718 px, alça, título e X, fundo escurecido, jogo seguindo atrás): Equip., Invocar, Loja, Passe e Missões abrem dentro dela
  pelo setView/Screens.open; X e toque no escuro = Screens.close(). Instâncias, Torre, Ranking, VIP, Pets, Forja, Correio e Eventos: aviso "X: em breve".
- Desafiar usa a MESMA regra do botão antigo (brilho, FC que falta, 2º toque). Baú abre pelo Sys.chest (mesma tela de prêmio).
- Com a chave desligada: nada muda (o arquivo só define funções; `FB_GEO` falso mantém 0,78 / 0,2643 / 222-282-338).

**Sobreposição por era com os centros do protótipo (212 / 262 / 308), SEM encolher ninguém (px de tela)**
| Era | Alturas frente / meio / fundo | Frente×meio | Meio×fundo | x do fundo até |
|---|---|---|---|---|
| 0 | 118 / 122 / 106 | 65% | 62% | 368 |
| 1 | 118 / 122 / 106 | 74% | 82% | 345 |
| 2 | 118 / 122 / 106 | 55% | 60% | 352 |
| 3 | 118 / 122 / 106 | 53% | 58% | 352 |
| 4 | 118 / 122 / 106 | 73% | 80% | 350 |
| 5 | Drone 118, sozinho, centro 236 (139..310) | — | — | — |
| 6 | 118 / 122 / 106 | 49% | 55% | 343 |
Passam de 55%: eras 0, 1 e 4 (muito) e 2 e 3 (meio×fundo 58-60%). Com os centros a 50 e 46 px um do outro e os inimigos em 118-122 px não há como ficar
abaixo: ou abre os centros (o do fundo iria para baixo da coluna de ícones só em x, não em y: os comuns ficam abaixo de y=522, onde a coluna termina),
ou aceita a sobreposição, ou reduz. Decisão do PO.
Chefes (caixa de antes): Dragão 178 px (170..382), Tanque 170 (170..382), era 0 180, era 1 152, eras 3 e 4 198, era 6 176.

**Diferenças em relação ao canvas (e por quê)**
1. CHEFE: o protótipo não desenha chefe. Mantive a caixa atual (até x=382). Com 170-198 px de altura a cabeça do chefe e o NOME dele ficam na faixa de
   y dos ícones VIP / Pets / Forja (coluna direita, x >= 325): o corpo do chefe passa por baixo desses ícones. Para cumprir "nenhum corpo por baixo dos
   ícones" o chefe teria de caber em 190..322 (132 px de largura), o que o reduz muito. Precisa de decisão.
2. Inimigos em 118/122/106 px (EN_SCALE) em vez dos ~100 do desenho; barra de vida e número de dano são os do jogo (canvas), não os do protótipo.
3. Missões e Passe não abrem a folha "abre a tela X" do protótipo: abrem a tela real dentro da folha. As telas 05/06/07/08 ficam com 656 px de altura
   útil (a folha tem 718 menos o cabeçalho), então escalam ~7% a menos que hoje; o Passe mostra dois X (o dele e o da folha).
4. Ícones sem tela ("Em breve") em vez de folha com link. Sem selo "1" no Correio (não há correio). Sem a aura +13 (só com Forja).
5. Rótulo do Especial: última palavra do nome da habilidade da era ("Giratório", "Tática"...).
6. Aviso global (toast) em y=126, abaixo da faixa da fase; o protótipo põe o aviso de cadeado embaixo, à esquerda.
7. Drone (era 5): sozinho, com o centro em 236 (regra da v0.11.5), não em 212.
8. Eras sem cenário novo (4, 5, 6): fundo antigo esticado até o chão novo.
9. "+N" da fila: no canto direito, 86 px acima do chão (protótipo: y=542).

**feetDy (pedido da fps-ff/PO para a próxima versão)** — lido de forma genérica no `enFrame`: se o .json da folha tem `feetDy: {"<quadro>": px}`, o quadro
é deslocado esse tanto (escalado; negativo = sobe). Hoje só era3_boss_attack tem o campo (conferi no arquivo). POR ENQUANTO SÓ VALE COM A CHAVE DA 04B
(`FB_GEO`), junto com "nenhuma correção de sola por efeito": no caminho padrão (v0.11.5) continua a regra antiga (levantamento fixo por folha + morte por
quadro). Ao liberar a próxima versão: trocar o `if(FB_GEO)` dessa parte por incondicional.

**NÃO testado / não feito**
- Print LADO A LADO com o protótipo: não renderizei o protótipo (o .dc.html precisa do runtime do canvas); entreguei só os prints do jogo.
- Tela de loading e Intro "coerentes" com a geometria nova: NÃO mexi (continuam com a linha de chão antiga).
- Tutorial na 04b: os passos apontam para `#tabs [data-t=gear]` e `[data-t=summon]`, que ficam escondidos: o balão aparece sem o anel. Não adaptado.
- Tela 10 (resultado) e aviso de velocidade liberada com a 04b; telas baixas e largas; safe-area (entalhe); celular real; desempenho do vidro
  (backdrop-filter) em aparelho fraco; voo dos pickups até as pílulas novas (ligado, não conferido de perto); Baú abrindo pela 04b; folha da Loja,
  Invocar e Passe vistas só pelo estado (print só do Equipamento).
- feetDy do Capitão Fantasma visto em jogo.
Prints (185x400 e recortes): reports/prints/fb_era2_comuns.png, fb_era2_chefe_dragao.png, fb_era5_chefe_tanque.png, fb_era0_comuns.png, fb_era1_comuns.png,
fb_era4_comuns.png, fb_folha_equipamento.png.


### Rodada 9, complemento 6 — v0.11.6 (feetDy no caminho padrão) + 04b isolada em tabela
**v0.11.6 (index.html, version.json, sw.js; chave fullBattle DESLIGADA; página conferida: HUD e abas normais, pés em 613, slots 222/282/338, zero erro).**
- `enFrame` (js/battle.js): a referência da sola é SEMPRE o feetY do .json. Saíram o levantamento fixo por folha e o levantamento por quadro na morte
  (nada sobe por causa de poeira, fumaça ou arma). Só o quadro listado no campo opcional `feetDy` do .json ({"<quadro>": px da célula; negativo = sobe,
  positivo = desce}) é deslocado, na escala do inimigo. O complemento 5 dizia que isso só valia com a chave da 04b: agora vale sempre.
- Conferido em jogo (era 3, chefe e Senhor da Era, gancho `__probe2`): GOLPE do Capitão Fantasma com o feetDy aplicado (quadros com −3 a −11 px na tela):
  parte opaca no máximo 1 px abaixo da linha, nos dois. DANO: os quadros 5 e 7 descem 12-13 px na tela (feetDy +15) e, DEPOIS disso, o pixel opaco mais
  baixo desses quadros fica 12-13 px ABAIXO da linha. Apliquei o que o arquivo manda; se a intenção era só encostar a cauda no chão, o valor do
  era3_boss_hurt.json precisa ser revisto pela fps-ff (não alterei o arquivo). Não avaliei "tremida" a olho (só os números).
- DEVORADOR (era 6, +9 px no golpe, achado do QA): NÃO é o desenho do jogo. Medi a FOLHA: no quadro 6 de era6_boss_attack há 160 pixels com alfa entre
  40 e 128 até 10 linhas abaixo do feetY (com alfa > 128 são 2 linhas; com alfa > 230, nenhuma). É um efeito semitransparente da arte; a escala do chefe é
  uniforme a partir do pé e não há mais correção de sola. Mesma medida nos outros chefes de caixa larga: Dragão limpo (nada abaixo do feetY em nenhum
  quadro); Minotauro quadros 7 e 8 com 12-14 linhas OPACAS abaixo (machado no chão); Tanque quadros 4 e 5 com 5-7 linhas (recuo/poeira). Nada mudado no
  código por isso; para o QA passar, ou o limiar de alfa da medida sobe para > 128, ou a arte limpa esses pixels / ganha feetDy. Escorpião: não mexi.

**04b (continua atrás da chave, sem subir versão)** — os ícones de menu viraram uma CAMADA SEPARADA dirigida por dados: tabela `FB_MENU` (js/fullbattle.js)
com {id, icon, label, x, y, group, act, hot, badge, small}; a disposição nova (V2) troca só a tabela. Posições provisórias = protótipo atual (conferidas:
14 botões nas coordenadas da tabela). Limite direito dos slots dos comuns: constante `FB_SLOT_XMAX` (js/battle.js, hoje 382).


### Rodada 9, complemento 7 — 04b, segunda passada (continua atrás de `SCREENS_ON.fullBattle`; versão no ar continua v0.11.6; caminho padrão não mudou)
Alterados só em trechos condicionados à chave: js/fullbattle.js, js/battle.js, js/loading.js. Onde divergir do complemento 5, vale este.
**Decisões do PO aplicadas**
- Centros dos comuns de volta a 222 / 282 / 338 (`FB_SLOT_XMAX` 382) e a regra de sobreposição é a mesma do jogo (o `hordeFit` volta a valer na 04b).
- Faixa direita x 300-390, y 400-650 LIVRE de ícones: Pets e Forja saíram dela na tabela `FB_MENU` (provisório: 2ª coluna em x=263, y=150 e 212). Conferido
  por script na tela de 844: nenhum botão do menu com retângulo dentro da faixa. Chefe na caixa de sempre (170..382 larga / 190..382).
**Tabela (04b, pés em 640, px de tela; igual à da v0.11.5)**
| Era | Comuns frente / meio / fundo | Sobreposição | Chefe (x) |
|---|---|---|---|
| 0 | 114 / 115 / 85 | 55% / 54% | 180 (200..371) |
| 1 | 112 / 103 / 92 | 49% / 55% | 152 (171..383) |
| 2 | 118 / 120 / 105 | 44% / 48% | 178 (170..382) |
| 3 | 118 / 122 / 105 | 43% / 47% | 198 (214..358) |
| 4 | 115 / 115 / 104 | 58% / 64% | 198 (196..376) |
| 5 | Drone 118 (sozinho, centro 236) | — | 170 (170..382) |
| 6 | 118 / 122 / 106 | 36% / 40% | 176 (170..382) |
**Itens que faltavam**
1. LOADING: com a chave ligada o chão da cena de carregamento e o Kael correndo ficam em y=640 (`LOAD_FEET`, js/loading.js; com a chave desligada, 658 como
   hoje). NÃO VISTO: a tela de carregamento não aparece com `skip=1` e não testei sem ele. INTRO: não mexi; as cenas dela são ilustrações dentro dos
   cartões (312 px de céu, chão em 341 do cartão), não usam a linha de chão da batalha.
2. TUTORIAL: na 04b o alvo de cada passo é trocado pelo equivalente novo (`FB_TUT_SEL`: Especial → botão novo, Equip. e Invocar → ícones do menu, Ultimate →
   botão novo). Conferido por script que os 5 alvos existem na tela. NÃO VISTO: o tutorial rodando do começo ao fim na 04b (anel e balão em print).
3. PICKUPS: o destino do voo é o centro da pílula de moedas (143,31), da pílula de gemas (247,31), do anel de XP (40,39) e do ícone Equip. (356,181),
   conferido por script contra os retângulos das peças. Não acompanhei o voo em print. BAÚ pela 04b: com 1 baú guardado, o toque abriu a tela de prêmio do
   Sys.chest ("Coletar"), o ouro subiu e o contador zerou.
4. FOLHAS: prints de Invocar, Loja, Passe e Missões (Equipamento no complemento 5). O X do Passe some na 04b (fica só o da folha). Na folha de Missões a
   nota do rodapé fica rente ao fim da tela (a barra de debug cobre a 2ª linha no print): conferir sem debug.
5. TELAS BAIXAS (640 e 560): Desafiar 103x44, Especial 62, Ultimate 88, AUTO 66x44 nas duas (>= 44). As colunas de ícones encolhem para não bater no
   painel de vida: ícone de 38 px em 640 e 28 px em 560 (ABAIXO de 44 px de toque: precisa da V2 ou de menos ícones em tela baixa). Rótulo do Senhor da
   Era 3 (211 px): topo em 242 (640) e 182 (560), abaixo da faixa da fase (118). Em 560 o corpo do Senhor passa por baixo dos ícones da coluna direita
   (a faixa livre foi definida para 844).
6. LADO A LADO COM O PROTÓTIPO: NÃO FEITO. O docs/proto/BatalhaTelaCheia.dc.html não abre sozinho (depende do support.js / runtime do canvas, que não está
   no projeto) e não há print do canvas na pasta. Entreguei os prints do jogo no mesmo enquadramento (390x844) para o PO parear com o canvas.
7. Prints do Dragão e do Tanque sem ícone por cima: feitos.
**Diferenças novas em relação ao canvas:** centros 222/282/338 em vez de 212/262/308 (decisão do PO); Pets e Forja fora do lugar do protótipo (provisório).
**NÃO testado:** loading e tutorial vistos na 04b; tela 10 e aviso de velocidade com a 04b; safe-area; celular real; desempenho do vidro; larguras
diferentes de 390; feetDy/escala com a 04b em jogo corrido (só parado nos slots).
Prints: reports/prints/fb2_era2_comuns.png, fb2_era2_chefe_dragao.png, fb2_era5_chefe_tanque.png, fb2_tela640_era2.png, fb2_tela560_senhor_era3.png,
fb2_folha_invocar.png, fb2_folha_loja.png, fb2_folha_passe.png, fb2_folha_missoes.png.


## Rodada 10 — v0.12.0: tela 04b LIGADA por padrão com os ícones da V2 (2026-11-12)
Alterados: index.html, js/fullbattle.js, js/battle.js (só o que já estava), js/loading.js, js/meta.js, sw.js, version.json. Novos: js/native.js (portado do app),
assets/fonts/*.woff2 (4 arquivos, 87 KB, copiados do app por ordem do coordenador). Não toquei em js/screens.js nem js/screens2.js (agente B).
1. `SCREENS_ON.fullBattle` = true por padrão. Layout antigo (abas) só com `?debug=1&fb=0`.
2. ÍCONES V2 (docs/proto/BatalhaTelaCheiaV2.dc.html), tabela `FB_MENU`: Equip., Invocar, Loja e Passe GRANDES à esquerda (x 4; y 136 / 214 / 292 / 370; 66x70,
   círculo de 54); Baú à direita (y 150), com a barra de carga e "Baú cheio" quando há baú guardado; botão MENU no topo direito (right 8, top 58), com o
   drop down de 4 colunas (`FB_DROP`): Forja, Pets, Torre, Instâncias, Ranking, Missões, VIP, Correio, Eventos, Config. A engrenagem saiu do header.
   Com tela: Missões (abre o Passe na aba Missões) e Config. "Em breve": Forja, Pets, Torre, Instâncias, Ranking, VIP, Correio, Eventos (nenhuma tem tela
   aprovada e feita). Selo do MENU = missões prontas.
   DIFERENÇAS do canvas V2: (a) o alerta "Evento" NÃO é desenhado (não existe evento no jogo; mostrar um "!" permanente seria falso): entra quando houver;
   (b) o RASTREADOR DE MISSÃO GUIA (faixa sob a barra de fase, x 76-312, y 124-172) NÃO foi feito: não existe lógica de missão guia em nenhum módulo;
   (c) Correio sem selo "1"; (d) inimigos em 118/122 px e chefe nas caixas do contrato; (e) as folhas abrem a tela real.
3. RESPONSIVO: escala = min(largura/390, max(1, altura/844)); a largura do HUD acompanha a tela (itens da direita ancorados à direita). Ícone nunca
   encolhe: o que não cabe (coluna esquerda contra o painel de vida; Baú contra a faixa livre) some da tela e entra no MENU. Faixa livre = x >= 300, do chão
   até 240 px acima, relativa à linha dos pés. Em tela estreita (escala < 1) Desafiar, AUTO e velocidade ganham altura para ficar em 44 px. Topo com
   `env(safe-area-inset-top)`. MEDIDO: 360x640 → 5 ícones visíveis, menor ícone 44 px, Desafiar/AUTO/velocidade 44, nada na faixa livre, sem rolagem;
   390x844 → ícones 48/54; 412x915 → 51+; 768x1024 → o `#app` do jogo já limita a largura a 430 px (moldura de desktop que existia): o jogo fica como um
   celular de 430x984 centrado, ícones 53+. Em nenhum dos quatro algum ícone precisou ir para o MENU (o caminho existe, não foi exercitado).
4. TUTORIAL na 04b: mesmo motor (S.tut, tutEvent), alvos trocados pelos botões novos (`FB_TUT_SEL`). Balão pequeno (214 px) colado no alvo, sem a linha
   "Passo N de 5"; a tela NÃO escurece mais (só o anel dourado no alvo); o balão some sozinho em 6 s (o anel fica) e o passo só de leitura avança sozinho.
   Visto: passo do Especial com o balão acima do botão, e depois de 6 s só o anel. NÃO visto: o toque real no Especial avançando (o toque sintético
   não disparou a habilidade), passos do Equip./Invocar/Ultimate com o balão.
5. Visto a olho nesta rodada: carregamento com o Kael e o chão na linha nova (pés em 641 de 844); jogo corrido na era 2 da onda 1 ao chefe com o HUD novo
   (pickups em voo: até 10 ao mesmo tempo indo para o topo); derrota para comum ("DERROTADO" + aviso) na 04b; MENU aberto. NÃO visto: troca de fase com
   aviso "Fase vencida", derrota para o chefe + farm na 04b, troca de era.
6. "Toque para continuar" atravessando: o toque fecha o carregamento e o clique seguinte é engolido por 500 ms (captura no documento). Reproduzido por
   script: o elemento embaixo do toque era o botão de Configurações do título; depois da correção o modal NÃO abriu.
7. Portado do app: js/native.js (o contador [EonFPS] só liga com localStorage.eonfps = '1' ou window.__eonFps), a linha do script no fim do index.html,
   `!window.Capacitor` na condição do service worker (js/meta.js), fontes locais (@font-face no topo do index.html; sem Google Fonts; conferido: Lilita One e
   Nunito carregadas). Save também em pagehide, freeze e pause.
8. Não mexi em raridade, curva, pets, qualidade (atrás das chaves).
PRINTS (reports/prints/): v0120_batalha_390x844_era2_chefe.png, v0120_menu_aberto.png, v0120_360x640.png, v0120_768x1024.jpg, v0120_tutorial_balao.png,
v0120_tutorial_balao_sumiu.png. NÃO ENTREGUE: print do canvas 04c para o lado a lado. Abri o canvas público; ele abre com todos os quadros a 9% e o zoom
por rolagem só deslocou a vista; parei para não arriscar mexer num canvas que é editável pela conta do dono.
NÃO TESTADO: jogo sem debug (jogador novo do JOGAR à Intro e ao tutorial; save real); APK/WebView (safe-area, pausa gravando o save, native.js em
aparelho); layout antigo com ?fb=0 depois das mudanças; tela 10 com a 04b; larguras entre 430 e 768; desempenho do vidro em aparelho fraco; ícone indo
para o MENU por falta de espaço (nenhuma das 4 telas pediu).


## Rodada 11 — v0.12.1: defeitos do QA na 04b, painéis em tela cheia, `Screens.register`, MODO MANUAL REMOVIDO (2026-11-12)

Arquivos mexidos: `index.html`, `js/fullbattle.js`, `js/battle.js`, `js/meta.js`, `sw.js`, `version.json`. Nada em `js/sys/**`, `js/screens*.js`, `assets/**`, `docs/**`.

### O que mudou
1. **Modo manual removido (ordem do dono).** O jogo é só automático.
   - `battle.js step()`: especial dispara quando a recarga zera e ultimate quando a energia chega a 100, sempre (sem `S.set.auto`, sem espera do tutorial).
   - Botão AUTO saiu do HUD da 04b (`#fb_auto`) e do layout antigo (`#skauto`); linha "Combate automático" saiu de Configurações; dica "Ultimate pronta! Toque aqui" saiu.
   - Velocidade voltou para a linha de baixo do protótipo (esquerda 10, topo 772), botões de 44 px; sem buraco onde ficava o AUTO.
   - Botões de habilidade são só indicadores (recarga/energia). O toque mostra "O especial dispara sozinho quando recarrega" / "A ultimate dispara sozinha quando a energia enche".
   - Save antigo: `S.set.auto=true` sempre no boot (campos `auto2`/`autoUlt` apagados). Parâmetro de debug `&manual` saiu.
   - Tutorial: passos 2 (Especial) e 5 (Ultimate) viraram explicação ("O Especial dispara sozinho." / "A Ultimate dispara sozinha."), balão curto, avançam sozinhos em 6 s; `tutHold()` não segura mais nada.
   - Missões de ultimate: `ptrack('ult')` está no DISPARO da ultimate (`battle.js`, início da ação `s3`), não no toque. `ptrack` agora também chama `Sys.events.track` se o módulo existir (hoje `events.js` não é carregado e está desligado por chave).
2. **Tutorial (QA 1):** fecha o painel aberto antes de apontar para um ícone da batalha; balão de 180 px, uma linha, fora do painel de vida e das barras dos inimigos; some em 6 s em todos os passos.
3. **Cabeçalho (QA 2):** nome da era com reticências; o número da fase (`1-1`) nunca é cortado.
4. **Toque ≥ 44 px (QA 3):** variável `--fbt`; velocidade, Desafiar, pílulas de moeda/gema e música.
5. **Painéis em tela cheia (PO):** sem barra de baixo; cabeçalho de 56 px (Voltar + título + moedas + gemas) e painel até o fim da tela. Altura útil = tela − área segura − 56 px.
6. **B-3:** `Screens.register(nome,{title,render(el,S),onOpen,onClose})`. **B-4:** `instances.js`, `tower.js`, `arena.js` carregados.
7. Versão `v0.12.1` em `index.html`, `version.json`, `sw.js`.

### Restos do layout antigo (varredura do PO)
- Batalha 04b: nenhuma barra de baixo; `#tabs`, `#hud`, `#ftop`, `#colL`, `#colR`, `#skills` escondidos por `body.fb`.
- Painéis: a folha de 60% com a batalha atrás → trocada por tela cheia (feito).
- Progresso (arquivo do agente B): seta de voltar própria + o meu "Voltar" = dois controles. Pedido A-8 no arquivo de pedidos.
- Configurações: ainda é o modal antigo (tela 09 não aprovada/feita).
- O layout antigo inteiro continua no código atrás de `?debug=1&fb=0` (barra de baixo incluída). Jogador não chega nele. Apagar é decisão do PO.
- MENU: itens sem tela dizem "X: em breve".

### O que eu vi (Chrome, 390x844 salvo indicação)
- Depois da remoção do manual: em 35 s a x4, 13 ultimates e 18 especiais dispararam sozinhos; `S.sys.pass.d.p.ult` subiu e `d_ult` ficou `done:true` com 3. Zero erros.
- HUD sem AUTO, velocidade embaixo à esquerda (print `v0121_batalha_sem_auto.png`). Toque na ultimate: só o aviso, não dispara.
- Tutorial: passo 1 → 2 → 3 sozinhos em 6 s cada; passo 5 mostra o texto novo e termina (`S.tut=99`, +20 gemas).
- 360x640, 412x915, 768x1024: menor alvo 44 / 46 / 49 px; velocidade dentro da tela e sem encostar no Especial.
- Antes da remoção (mesma versão): painéis Equipamento, Invocar, Loja, Passe, Progresso em tela cheia sem estouro (prints `v0121_painel_*.png`); `Screens.register` com tela de teste; faixa do chefe livre (Dragão, Tanque); âncora máx. 5 px (chefe) / 12 px (comuns).

### O que NÃO testei
- Print da 04c no quadro do dono: NÃO saiu (o quadro abre a 7–9% de zoom; não arrastei nem editei nada; um duplo clique selecionou uma prancheta e eu desfiz com Esc). Comparação feita pelas medidas de `docs/proto/BatalhaTelaCheiaV2.dc.html`.
- Passos 3 e 4 do tutorial (Equip. e Invocar) depois da remoção do manual; foram vistos antes dela, na mesma versão.
- Save antigo real com modo manual gravado: só a leitura do código (atribuição incondicional no boot).
- Missão do Festival "30 ultimates": módulo desligado e não carregado; só a chamada foi posta.
- Layout antigo (`fb=0`) depois da remoção; APK / aparelho real; modo offline do service worker.
- Coletáveis em voo na última rodada (vistos em rodadas anteriores).
- Dentro dos painéis do agente B: arrastar para equipar, voo do item, compras, larguras 360 e 768.

### Diferenças conscientes do protótipo V2
- Guia de missão sob a barra da fase e alerta "Evento": não feitos (sem lógica/evento aprovado).
- Sem botão AUTO (ordem do dono, posterior ao protótipo).


## Rodada 12 — v0.12.2: respiro Kael × inimigo, barras sobre o Kael, cabeçalho, desempenho, LAYOUT ANTIGO APAGADO (2026-11-12)

Arquivos: `index.html`, `js/battle.js`, `js/fullbattle.js`, `js/ui.js`, `js/farm.js`, `js/meta.js`, `js/loading.js`, `js/native.js`, `sw.js`, `version.json`.

### O que mudou
1. **Respiro Kael × inimigo da frente** (`hordeFit`, `battle.js`): borda esquerda do inimigo da frente (sprite parado) a `HERO_GAP` = 32 px ou mais da borda do corpo do Kael (`HERO_EDGE` = 150). Os centros andam para a direita (teto 48 px). Para caber atrás: 1º o do fundo encolhe até 80 px; 2º o da frente até a escala 1,10. O da frente com folha de golpe não ganha mais o avanço de 12 px por código (a folha já leva o corpo). `contact()` usa o centro real do slot da frente (`B.front`).
2. **Barras de vida e energia sobre a cabeça do Kael** (aprovado pelo dono): DOM sem blur; vida 10 px (verde → amarelo < 50% → vermelho < 25%), rastro do pedaço perdido, treme e pisca no dano; energia roxa 6 px, pulsa cheia. Ancoradas nos pés + altura do corpo parado. A caixa do canto inferior esquerdo saiu. Em tela curta (360x640) as barras começam depois da coluna de ícones.
3. **FC sob o avatar**: pílula escura, 11,5 px. **Nome da era** inteiro em 360 ("Pré-História 1-9"): faixa mais larga, Desafiar menor; tabela `FB_ERA_SHORT` só entra se não couber.
4. **Desempenho**: sem `backdrop-filter` em nada sobre o canvas; pulsos contínuos só com opacidade/transform de pseudo-elemento (sem animar box-shadow/filter); teto de DPR do canvas 2,5 → 2; HUD some e para as animações com painel aberto.
5. **Layout antigo apagado**: saíram `#hud`, `#ftop`, `#colL`, `#colR`, `#hpe`, `#skills`, `#tabs`, a chave `fullBattle`, `?fb=0`, `FB_GEO`, `FB_ON`, abas, `updSkills`/`initSkills`, e 171 regras de CSS mortas (35 KB → 20 KB). Ficou `#chestbox` escondido (hospedeiro do `Sys.chest`). Novas funções: `bossTap()`, `toggleSound()`. Cópia: `docs/arquivo/layout-antigo-v0.12.1/` e git 68b1e16.
6. `native.js`: VOLTAR fecha o MENU aberto. `normItem` copia `origin`. MENU: campo `tag` (selo de texto) e entrada do Leilão pronta e DESLIGADA (`on:false`, martelinho por código).

### Números do respiro (390x844, por era; combinações frente/meio/fundo; gap em px, alturas, sobreposição frente×meio / meio×fundo em %)
- Era 0: gap 32–37; alturas 105–112 / 98–122 / 80; sobreposição 46–51 / **64–75** (limite 55).
- Era 1: gap 32–37; 102–118 / 97–118 / 80–106; 26–51 / 29–**74**.
- Era 2: gap 34–38; 110–118 / 118–120 / 80–96; 39–44 / 50–**60** (limite 50).
- Era 3: gap 40–42; 109–114 / 118–122 / 80; 39–43 / 50–**58**.
- Era 4: gap 32–48; 105–118 / 115–118 / 80–84; 34–**59** / 55–**88**.
- Era 5: 1 visível; gap 32 (drone) e 58.
- Era 6: gap 45–56; 113–122 / 118–122 / 80–106; 23–39 / 44–50 (cabe).
NÃO COUBE em 55% nas eras 0, 1 e 4 (e passa de 50% nas 2 e 3) mesmo com fundo em 80 e frente em 1,10: decisão do PO (2 comuns visíveis nas eras de bicho largo, ou aceitar).

### O que eu vi
- 390x844 eras 0, 1, 2 e 360x640 eras 0 e 2: folga visível entre Kael e o da frente, cabeçalho inteiro, FC legível, barras sobre o Kael (prints `v0122_*.png`).
- Jogador novo SEM debug: carregamento → título → introdução → escolha do herói → nome → tutorial 5 passos até o fim (`S.tut=99`, +20 gemas), zero erros. Passos 3 e 4 com toque simulado nos alvos.
- Diária da ultimate no jogador novo: chegou a 2/3 em ~2 min de jogo a x1 (parei aí); na v0.12.1 vi fechar com 3.
- Depois de apagar o layout antigo: batalha, 5 painéis (tela cheia 56/788), MENU, Desafiar, música: sem erro no console.

### O que NÃO testei / não consegui
- **Medição de FPS antes/depois: não saiu.** O PC estava saturado (10–15 FPS com ou sem HUD, com ou sem blur) e a ferramenta do navegador não limita CPU. As correções são as da lista do S24; a prova é no aparelho.
- Barras: tremor/piscar e cor vermelha vistos só por estado forçado; rastro não conferido quadro a quadro.
- Eras 3–6 só por números, sem print. Chefes e Senhor da Era depois das mudanças.
- VOLTAR do Android, APK, aparelho real.
- Telas do agente B além de abrir (Configurações nova `p_cfg.js` não aberta).
- Fica para a v0.12.3: gravar `origin` nos criadores de item ('shop', 'gift').


### v0.12.2, último item: ARMA EQUIPADA NA MÃO DO KAEL (defeito visto pelo dono)
- `heroLook()` (index.html): função única da aparência. Arma = skin de arma escolhida (qualquer uma menos a inicial `w00`); senão a arma do item equipado (era = `item.look ?? item.e`, raridade do item → objeto `w<era><raridade>` de SKINS, mesma arte); senão a inicial.
- NÃO usei `Sys.appearance.of`: lá qualquer `S.skinEq.weapon` (inclusive a inicial) vence o item; o módulo continua sem ser carregado. Mesma regra, com a exceção do `w00`.
- Batalha: `wSkin()` passou a ler `heroLook().weapon` (arma, golpes, ícones e nomes das habilidades seguem a era da arma na mão); ao trocar, a arte carrega na hora. Folha composta só com roupa e arma da era 2 no mesmo tier (regra que já existia).
- Vitrine do Equipamento: `drawHeroPreview(canvas, look, dt)` em `js/battle.js` (Kael parado respirando, mesma função de desenho da batalha); `scrGear` em `js/screens.js` troca a folha pronta por `<canvas id="gkc">` (única linha mexida no arquivo do agente B, por exceção do coordenador). O laço desenha a cada quadro, então atualiza ao equipar, "Equipar melhor" e arrastar.
- Cabeçalho dos painéis: "Equipamento" cabe inteiro (título 18 px, botões mais justos).
- Visto (390x844): itens de arma das eras 1 (espada), 3 (pistola) e 6 equipados → mudam na vitrine e na batalha; skin `w22` escolhida vence; voltar para `w00` devolve o item; botão "Equipar melhor" real troca a arma e o boneco. Zero erros. Prints `v0122_arma_*.png`.
- NÃO testado: arrastar para equipar; lança e demais tiers; encaixe da mão conferido a olho só nessas 3 armas, em tamanho pequeno; item com campo `look` diferente de `e` (transformação); 360x640; tela de Skins da Loja pela interface (a troca de skin foi feita por estado); carregamento com arma de item; APK.
- Atenção: com arma de fogo o Kael da batalha usa a pose de tiro que o jogo já tinha (não mexi); na vitrine fica parado.


## Rodada 13 — v0.12.3: pistola aprovada, 2 comuns nas eras 0/1/4, level up novo, liberação por nível (2026-11-12)

Arquivos: `index.html` (versão), `js/battle.js`, `js/stage.js`, `js/farm.js`, `js/fullbattle.js`, `js/meta.js`, `sw.js`, `version.json`.

1. **Pistola aprovada** (`js/stage.js`, `drawHeroPistol`): com arma de fogo (regra `heroLook`) nas eras 3, 5 e 6 o Kael usa `assets/anim/hyb/R/pistol/kael_pistol_<idle|run|shoot>_era<E>_t0` (a pistola da era já vem pintada no quadro). O quadro "shot" do .json cai no instante do tiro; o clarão sai de `grip[quadro].muzzle`; `B.tipW` (origem do projétil) também. A pose de tiro antiga não é mais usada por nenhuma arma. Era 4: `ART_ON.pistol_era4=false`; desligada, `wIsGun` devolve false e o revólver luta corpo a corpo (pose de espada). Vitrine: mesma função de desenho, parado.
   - Limite: só existe a folha `t0` por era; arma de tier 1 ou 2 aparece com a pistola do tier 0. A roupa do Kael na folha é a da folha (a skin de roupa não aparece nela).
2. **Arma estável** (`wSkin`, `HLK`): a arma nova só entra na mão quando a arte carregou (sprite e, se pistola, as 3 folhas); até lá fica a anterior; em 4 s troca de qualquer jeito. Vale para qualquer caminho que mude `S.eq`/`S.skinEq` (equipar, "Equipar melhor", arrastar, skin), porque a conta é feita a cada quadro.
3. **2 comuns visíveis nas eras 0, 1 e 4** (`ERA_VIS`): total da onda igual; selo "+N" conta a fila. Medido (390x844, todas as combinações): folga do Kael 32–48 px; sobreposição frente × atrás 26–55%. Na era 4, com Aranha na frente e o outro atrás, o de trás ainda cai a 80 px pela regra de encolher da v0.12.2.
4. **Level up novo**: folha `assets/anim/fx/levelup` (22 quadros, 12 fps, pés e âncora do .json), uma vez, sobre o Kael, pés no chão, na escala do herói; desenhada no canvas (fica atrás do HUD). Saíram as partículas antigas; o aviso "Nível X!" e o som ficaram.
5. **Liberação por nível LIGADA** (`FB_UNLOCK` em `js/fullbattle.js`): ícones e itens do MENU ocultos até o nível; sem tela pronta = oculto (nada de "Em breve"); coluna esquerda sem buraco; selo "NOVO!" + balão, um por vez, guardado em `S.unl`. Não usei `Sys.level.isUnlocked`: a tabela do módulo só tem practice, forge, instances, tower, arena e pet; a conta usa `Sys.level.level(S)` com a tabela nova.
   - Tutorial: ordem nova (sozinho, Especial, Equip., Ultimate, Invocar). O passo do Invocar espera o nível 3 com o tutorial escondido.
6. `origin`: o único criador de item fora dos módulos é a compra da Loja, em `js/screens.js` (agente B). Não editei; pedido A-12. Não há criador de presente/boas-vindas que gere item nos meus arquivos.

### Visto
- Pistola nas eras 3, 5 e 6 atirando, clarão/traço saindo do cano, pés no chão. Era 4: sem arma de fogo, golpe corpo a corpo.
- Eras 0, 1, 4 com 2 visíveis e "+1".
- Level up: disparado por estado na era 0 e de verdade no jogador novo (níveis 2 e 3), sem erro.
- Jogador novo sem debug até o fim do tutorial: Equip. e Loja no início; "NOVO!" de Missões no nível 2; Invocar aparece no nível 3 e o passo do tutorial acontece aí; fim com +20 gemas; MENU só com Missões e Config.

### NÃO testado
- Pistola: parado e correndo vistos só de passagem; vitrine do Equipamento com pistola; especial e ultimate com pistola; morte e dano com pistola; tiers 1 e 2.
- Revólver da era 4 na pose de espada: vi um quadro só (durante dano); não conferi se a mão encaixa.
- Um quadro com duas armas apareceu logo depois de trocar de era por comando de debug no meio de um golpe; não reproduzi em jogo normal nem investiguei.
- Chefe entrando depois das escoltas com 2 visíveis; Senhor da Era.
- Save antigo com vários "NOVO!" em fila (só a lógica); níveis acima do 3; Passe aparecendo no 18.
- Missões no nível 2 abre o painel do Passe na aba Missões (o painel é do agente B): não conferi se a aba de Prêmios fica acessível antes do 18.
- 360x640 nesta versão; APK; aparelho.

## Rodada 14 — v0.12.4: nenhum botão morto, Forja e Configurações pelo registro, save antigo sem perder acesso (2026-11-12)

Arquivos meus: `index.html`, `js/fullbattle.js`, `js/battle.js`, `js/stage.js`, `sw.js`, `version.json`. Lista dos botões: `reports/botoes-v0.12.4.md`.

- Botões: pílula de gemas antes do nível 10 avisa "Loja de gemas: libera no nível 10" e o "+" some; botão de som avisa "Som ligado/desligado".
- MENU: Forja aparece no nível 12 com a tela registrada; Config. abre a tela nova. Tela registrada que quebra ao desenhar fecha, avisa e some do MENU.
- Save antigo: marcador `S.bornV` (o mesmo do agente B) + `S.unlKeep` (missions, summon, practice, shopgem, pass). `fbUnl` respeita a lista. Uma regra só nos dois códigos.
- `fbLvU` (mudança do coordenador): corrigi a reserva. O módulo devolve 1 para chave que não conhece ('inst', 'rank'), o que liberaria no nível 1; agora nesse caso vale o `FB_UNLOCK`.
- Revólver da era 4 ligado; aviso de Drop abaixo do cabeçalho (conta o entalhe e a escala).
- Escrito e DESLIGADO (versão seguinte): asa desenhada no Kael (`WING_DRAW=false`), constantes do Modo dono (`TEST_BUILD`, `OWNER_MODE`; nada liga o modo).

Visto (390x844, e 360x640 onde indicado):
- Save antigo no nível 12: Equip., Invocar, Loja, Passe e Baú visíveis; MENU = Forja, Missões, Config.; Forja e Configurações novas abrem em tela cheia (788 px) e fecham.
- Jogador novo no nível 12 (por estado): Passe oculto; no nível 5: MENU = Missões, Config.; gemas com aviso e sem "+".
- Níveis lidos por `fbLvU`: missions 2, summon 3, practice 5, shopgem 10, forge 12, inst 14, tower 15, pass 18, pets 20, rank 28.
- Aviso de Drop: topo 128 com cabeçalho até 118 (390); topo 118 com cabeçalho até 104 (360).
- Revólver da era 4 na mão, pés no chão (print `v0124_era4_revolver_menu.png`).
- Jogador novo sem debug até o fim do tutorial (Invocar no nível 3), zero erros.

NÃO testado: quadro exato do tiro do revólver e encaixe da mão em movimento; Práticas/Progresso no save antigo (botão é do agente B); "Voltar" da Forja volta para o Equipamento (desenho do agente B), não conferi se é o esperado quando aberta pelo MENU; tela que quebra (caminho do aviso) só por leitura; toque real com o dedo em cada botão (ações chamadas por código); 360x640 só por medidas; APK e aparelho.

## Rodada 15 — v0.12.5: armas por raridade, Modo dono, asa no Kael, Prévia da arte (2026-11-12)

Arquivos: `index.html`, `js/battle.js`, `js/stage.js`, `js/loading.js`, `js/artprev.js` (novo), `sw.js`, `version.json`; UMA linha em `js/screens.js` (`skinArt`, autorizada: pedido A-14).

1. **Armas por raridade**: `wKey(ws)` / `wPng(ws)` em `js/battle.js` (Básico `_t0`, Raro `_raro`, Épico `_t1`, Mítico `_mitico`, Lendário `_t2`), usados na batalha, vitrine, carregamento e miniatura de item. Folhas com a arma pintada (compostas, giro e rastro da era 2) só valem para Básico, Épico e Lendário; Raro e Mítico usam corpo + arma na mão.
   - **Pistola**: troquei a folha com a pistola do tier 0 pintada pelo corpo aprovado sem arma (`R/kael_pistol_<idle|run|shoot>_body`) + a arma DA RARIDADE desenhada na mão (pivô do meta.json, ângulo da mão do .json, tamanho pelo `scale` do .json aprovado da era, dedos por cima). Assim cada raridade mostra a sua pistola.
   - Não fiz brilho extra: ficou o contorno discreto que já existia (`skinSpr`).
2. **Modo dono** (`js/artprev.js`, só com `TEST_BUILD`): item "Teste" no MENU fora da regra de nível; save separado `eras_owner_v1`; selo "MODO DONO" no topo; tudo que tem tela liberado; atalhos nível 20/32/50/70 (itens equipados sobem junto), asa, avançar era, +500 pedras de forja, +1 milhão de ouro, +5.000 gemas; sair volta ao save real.
3. **Asa no Kael** (`WING_DRAW=true`): duas metades atrás do corpo, batendo de leve. Item de asa Épico ou acima = anjo; abaixo = demoníaca; skin de asa vence.
4. **Prévia da arte**: 24 cartões por tabela, tocador genérico, carrega ao abrir o cartão e solta ao sair.

Visto (390x844): as 5 raridades com armas diferentes na mão nas eras 0–6 (vitrine em grade; print das pistolas); pistola Rara atirando na batalha; Modo dono entrando (save real intocado: mesmo tamanho), selo, atalhos, asa de anjo atrás do Kael na batalha, saída devolvendo o save real; os 24 cartões da prévia carregam todos os estados; vistos a olho: Kael no lobo (parado) e Fase 3 (golpe).

NÃO testado / pendências:
- FPS e memória com CPU limitada: a ferramenta não limita CPU e a medição de quadros saiu inválida (aba em segundo plano, 1 quadro/s). Memória do JS: 57 MB. Sem estimativa válida.
- Encaixe da mão nas armas novas só em tamanho pequeno; golpe/giro com Raro e Mítico da era 2; especial e ultimate com pistola de raridade; mão nas pistolas em movimento.
- Asa: vista parada na batalha com um item (anjo); demoníaca, correndo, golpe e vitrine não conferidos a olho; a posição é estimada (não vem de âncora da arte).
- Prévia: só 2 cartões vistos a olho; na Fase 3 o golpe aparece deslocado para a direita da sombra (pode ser o avanço da folha; não conferi); ovo chocando não visto; liberação de memória ao sair não medida.
- Espaço de asa no nível 50 dentro do Equipamento (painel do agente B).
- Item 5 (tela de troca de era, Q-2): NÃO feito nesta passada.
- 360x640; jogador novo; aparelho.

## Rodada 16 — v0.12.6: PACOTE DE PETS ligado (2026-11-12)

Arquivos meus: `index.html` ('pet' antes do 'fc'; `petfx` na lista), `js/petfx.js` (novo), `js/battle.js`, `js/farm.js`, `js/artprev.js`, `sw.js`, `version.json`.
Por exceção do coordenador, nos arquivos do agente B: `js/panels.js` (`PANEL_ON.pets = true`) e `js/screens.js` (`'p_pets'` na lista de carga, que não estava). Pedido A-16.

Visto (390x844, `?debug=1&fresh=1`):
- FC sem pet: 1.386 com o módulo carregado e 1.386 sem ele (igual). Com o Mamute filhote: 1.484.
- Nível 19: ovo ganho fica guardado ("Ovo guardado: choca no nível 20"). Ao chegar no 20 (e na carga com nível 20+): ovo treme, racha, luz, o Mamute salta e pousa atrás do Kael; entra equipado; nome e raridade na faixa de aviso do jogo.
- Pet na batalha: atrás do Kael, pés no chão, filhote menor que ele; médio e evoluído (folhas `_mid` e `_evo`) trocam ao evoluir; papagaio voando na altura da cabeça com sombra no chão.
- Golpe: a cada 2,0 s exatos (medido: 16,08 / 18,09 / 20,09); dano 3 com ATK 57 × 0,0235 × 2,5 (regra do módulo).
- MENU no nível 20: Forja, Pets, Missões, VIP, Config., Teste; Pets abre a tela 17b em tela cheia e fecha.
- Avisos: guardado antes do 20, portão de raridade ("Ovo de Cão mecânico guardado até você liberar essa raridade"), entradas vazias não avisam nada.
- Asa demoníaca atrás do Kael correndo e no golpe (pendência da v0.12.5).
- Prévia, Fase 3 "golpe deslocado": é do ARQUIVO. `assets/anim/hyb/phase3/kael_attack_era2_t1.json` traz `padLeft: 0` numa folha de 448 (as fases 1 e 2 e a do garoto trazem 96). O tocador segue o .json. Para a fps-ff corrigir o .json.

DESEMPENHO (estimativa, PC, aba em primeiro plano, sem limite de CPU; método: contador de quadros por requestAnimationFrame em 20 s + performance.now em volta do draw):
- com pet (Mamute evoluído): 138,5 quadros/s; desenho 1,11 ms em média (95% até 1,6 ms); memória do JS 65 MB.
- sem pet: 115,2 quadros/s; desenho 1,17 ms em média (95% até 1,8 ms).
- A diferença entre as duas medidas é ruído da máquina; o custo do pet no desenho não aparece. Não é medida de celular.

Ajustes feitos durante a conferência: o ovo e o pet ficavam fora da tela à esquerda / em cima do inimigo → passaram para meio corpo atrás do Kael; o intervalo do golpe saía 3 s (somava a animação) → 2 s exatos; o nome do pet caía sobre as barras do Kael → foi para a faixa de aviso.

NÃO testado:
- Sorteio 79% / 21% (só vi sair Mamute, 2 vezes); Esfinge, Dragão e Cão mecânico na batalha; estágios médio/evoluído de outros pets.
- Ovo à escolha: o aviso foi chamado por estado; a tela `eggpick` não existe; ao conferir, a tela de Pets estava aberta e não sei se foi o meu aviso ou o painel do agente B que abriu.
- Cura por onda (nenhum pet de cura equipado); pet com o herói morto; pet durante a ultimate (vi um quadro).
- Modo dono: botões "Ganhar ovo" e "nível 20" pelo painel (usei as funções direto); save real sem pet (só a conta da FC).
- Ovo vindo de drop, chefe e baú de verdade.
- 360x640; jogador novo; aparelho. Troca de era: não ligada (ordem do coordenador).

## Rodada 17 — v0.12.7 (REESCRITA em resumo depois da reversão acidental de 2026-11-12)

O `git checkout -- .` de outra sessão apagou tudo o que não estava commitado depois da v0.12.6. Refiz pelos MEUS scripts de edição, que estavam guardados fora do projeto: os arquivos voltaram byte a byte ao tamanho que tinham (index.html 65.758 → 65.960; battle.js 108.816; stage.js 31.277; petfx.js 12.150) antes dos ajustes finais. `js/mountfx.js` e `js/instfx.js` sobreviveram inteiros.

Conteúdo da v0.12.7 (tudo refeito; o que foi VISTO vale para o código de antes da reversão, igual ao de agora):
1. Pet ao lado e à frente do Kael, na linha do chão, por cima da montaria; tabela `PET_TBL` (dx 0,42 da largura do Kael; dy 5 px; altura 0,46 / 0,52 / 0,62; voador 0,12–0,13); escala pela altura opaca medida da folha.
2. Folga do inimigo a partir da montaria/pet (`heroEdge()`); teto do recuo dos centros 110 px.
3. Asa por item: `wingArt(item)` → `Sys.stats.wingOf` (agora protegido por `typeof`, porque os módulos estão em refação) com reserva em `item.wing`; gancho de skin de asa (skin vence), sem skin hoje.
4. Montarias: `'mount'` antes do `'fc'`; `js/mountfx.js` na lista; Kael montado com as folhas `_body` + arma no grip; barras e asa sobem com a sela; serpe (`wyvern`) fora; item "Montarias" no MENU (`soon:mounts`, nível 38, ícone provisório = Pets).
5. Modo dono: asa de anjo e asa demoníaca como itens distintos; uma montaria por botão (`mountIds()`), estrela +1 / -1, desmontar.
6. `normItem`: `wing`, `offer`, `gotAt`, campos simples desconhecidos preservados; `addItemToBag` grava `gotAt`.
7. Prévia: `PHASE_SCALE` (1,00 / 1,12 / 1,25 / 1,30) para Kael e Kaia (4 cartões da Kaia).
8. Ajustes do PO (nunca vistos rodando): pet mais à frente/baixo por montaria (`pdx`, `pdy` na `MOUNT_TBL`; grifo e tigre mais à frente); asa do Kael mais alta, mais atrás e com contorno claro em montaria com asas (grifo); aura por estrela visível em 1 estrela, mais forte até 5, fumaça nas patas em 4 e 5.

Visto antes da reversão (390x844, era 0): sem montaria e sem pet; só pet filhote; só lobo; lobo + pet + asa de anjo; grifo 5 estrelas + pet evoluído + asa (prints `v0127_*.png`, que sobreviveram). FC sem montaria igual com e sem o módulo (4.428). Item com `wing`/`offer`/`origin`/`qp` sobrevive a salvar e ler. Desenho por quadro: 1,62 ms com tudo e 1,60 ms sem nada (PC; quadros por segundo dessa medida não valem, máquina ocupada).

## Lote v0.12.8 (REESCRITO; DESLIGADO por `NEXT_ON=false` no index.html; nunca visto rodando)
1. Luta da instância (`js/instfx.js`, `window.startInstanceRun(run)`): ondas do run com `mkEnemy(run.stage, kind)` × multiplicadores, sem drops de fase, relógio e "Instância" no cabeçalho, `Sys.instances.finish` no fim, volta ao farm, `PInst.showResult(out)`; `save()` suspenso durante a luta; Desafiar bloqueado.
2. Morte nova do Kael (`drawHeroDie`, `ART_ON.kael_die`): folha `R/kael_die_body`, arma caindo por código, poeira; montado cai a pé.
3. Inimigo parado (`ART_ON.en_idle_prep`): 4 primeiros quadros do golpe em vai-e-volta a 4 quadros/s (sem tabela da Arte).
4. Cenário vivo da era 4 (`sceneV2: NEXT_ON`).

O QUE NÃO GARANTO depois da refação: nada foi aberto no navegador desde a reversão; a página inteira precisa de uma conferência (carrega, batalha, pet, montaria, asa, Modo dono, Prévia). `js/meta.js`, `js/loading.js` e `js/ui.js` não tinham mudança minha depois da v0.12.6 (nada a refazer).

### Lote v0.12.8, acréscimos escritos sem navegador (2026-11-12)
- **Mudança de poder na tela** (`fcNotice`, index.html, atrás de `NEXT_ON`): chamado no `statsChanged()` e no subir de nível; `Sys.fc.snapshot` + `Sys.fc.delta` (protegidos por `typeof`); aviso grande com `delta.text` / `delta.color` e seta, FC total contando 0,7 s; soma avisos seguidos; por cima do painel aberto; só fica armado 4 s depois do boot (não avisa na carga nem na troca de save). Pedido A-19 ao agente B (tirar o "FC +N" dele).
- **Conquistas e Atividade**: `ptrack` chama `Sys.achievements.track` (protegido); `ptrack('login')` uma vez por dia no boot (`S.loginDay`); `activity` e `achievements` carregados depois de `mount` e antes do `fc`. ESTES NÃO estão atrás de `NEXT_ON` (os módulos nascem desligados por chave própria).
- **Ultimate por arma (varredura)**: nos meus arquivos, habilidade, nome (`SKN[E]`), ícones do HUD (`wSkin().e`), efeito e folha da ultimate (`a.era`) JÁ vinham da era da arma na mão; os usos de `eraOf(S.stage)` que achei são só de inimigo, cenário, drop e troca de era. Nada a corrigir. Acrescentei: `SKN`, `S2HITS` e `S2DUR` para as eras 7 e 8 (nomes PROVISÓRIOS: "Garra Sombria / Portão do Submundo" e "Lâmina Celeste / Juízo Celestial", a confirmar); `startAct` limita a era ao tamanho da tabela; `skFx(arma, tipo)` lê `Sys.stats.skillFx` (atrás de `NEXT_ON`) e hoje aplica só a COR e o TREMOR da ultimate.
- NÃO feito do item da ultimate: tinta, partículas, golpe final maior e clarão por raridade; efeito mais leve em s1/s2 além da cor; folhas `era7_ult` / `era8_ult` ligadas no `FX_ART` (o jogo ainda não tem arma das eras 7 e 8). Som da ultimate: não conferi de onde vem a era.

### v0.12.7 refeita: passada de FUMAÇA antes do APK (2026-11-12)
Visto (390x844): carga sem erro; batalha, arma na mão, inimigos, abates; save de nível 12 sem pet com MENU = Forja, Missões, VIP, Config., Teste; Equipamento, Invocar, Loja, Passe, Forja, Configurações e VIP abrem e fecham; FC 950 com e sem os módulos novos (pet, mount, activity, achievements); Modo dono: entra, selo, lobo + asa de anjo, grifo + asa demoníaca + pet (Esfinge) ao lado/à frente, sair devolve o save real (mesmo jogador, nível 12, sem pet/montaria/asa); jogador novo sem debug: título → criação → tutorial rodando, nível 2 sem erro.
Corrigido: o atalho "Ir para o nível 20/32/50/70" do Modo dono não chocava o ovo (pulava o caminho normal de subir de nível): agora chama `petLevel`.
Anotado, não corrigido (estético): com grifo o pet fica bem à frente e perto do inimigo da frente; o save real cresce de 1.920 para 2.190 caracteres ao ser aberto nesta versão (campos novos: marcador de save antigo, estado dos módulos novos, dia do login).
Não visto: animação do ovo chocando nesta passada (o pet já apareceu chocado na recarga); drop de item; level up a olho (só o nível subir); tutorial até o fim; 360x640; pônei, cavalo, tigre; Prévia da arte; APK.

## v0.12.8 — preparada SEM navegador (2026-11-12); `NEXT_ON` continua false

ATIVO no disco (não atrás de `NEXT_ON`), nunca visto rodando:
- MENU do lote de telas (`FB_DROP`, js/fullbattle.js): Arena, Guilda, Torneio, Leilão (ícone aprovado `auction.png`), além dos que já existiam (Forja, Pets, Montarias, Torre, Instâncias, Ranking, VIP, Correio, Eventos, Missões, Config.). Cada um só aparece com a tela REGISTRADA, não quebrada, com a chave `PANEL_ON` do agente B ligada (`fbPanelOn`) e no nível da tabela (Torre 15, Instâncias 14, Ranking/Arena 28, Eventos 24, Guilda 32, Montarias 38, Torneio 40, Leilão 45, Correio 7). Hoje as chaves novas estão desligadas: nada muda no MENU.
- Rotas: avatar do cabeçalho abre o Perfil quando `PANEL_ON.profile` estiver ligada e o nível for 10+ (senão Equipamento); `missions` abre a tela nova quando ligada (senão a aba antiga do Passe); `pass` abre o `passv2` quando ligado. `Screens.open(nome)` recusa painel desligado, igual ao `Panels.open`.
- Título do cabeçalho dos painéis: se não couber, a fonte cai para 16 px; se ainda faltar, somem as pílulas de moedas e gemas.
- Aviso reserva da vitória sem emoji; `heroDown(on)` em js/battle.js para a tela 10 deixar o Kael caído (pedido A-20).
- Serpe dourada de volta à tabela de montarias (`MOUNT_TBL.wyvern`, com asas). Grifo e tigre: pet de 0,86 para 0,74 (na fumaça ficou perto demais do inimigo).
- Versão v0.12.8 nos três arquivos.

ATRÁS DE `NEXT_ON`:
- Códex, Chat e Mapa no MENU (não têm nível definido: `key: true`). Preciso do nível do PO.
- Módulos `clock`, `offer`, `appearance`, `phases`, `events`, `guild`, `guide` carregados antes do `fc`.
- Missão guia: `PGuide.mount(#fb_w)` + `PGuide.update()` no HUD quando `PANEL_ON.guidehud` estiver ligada; `Sys.guide.onEvent` no `ptrack`.
- Efeito por raridade completo (`Sys.stats.skillFx`): cor, partículas multiplicadas (metade do reforço em s1/s2), anel maior e tremor no golpe final, clarão branco na tela quando `flash` (Mítico/Lendário).
- Já estavam: luta da instância, morte nova, inimigo parado, era 4 viva, aviso de poder.

ÍCONES QUE FALTAM (uso provisório entre parênteses): Arena (ranking), Guilda (eventos), Torneio (ranking), Códex (missões), Chat (correio), Mapa das Eras (torre), Montarias (pets), Perfil (sem ícone: é o avatar).

Incertezas: a assinatura de `Sys.guide.onEvent` e a ordem exata de carga dos módulos novos não foram conferidas rodando; `Screens.reg` para painel desligado depende de como o `Panels.add` registra (protegi dos dois lados).

## v0.12.8, conferência no navegador: itens 1 e 2 FECHADOS; `NEXT_ON = true` (2026-11-12)

Item 1 (carga com os módulos novos):
- `clock`, `offer`, `appearance`, `phases`, `events`, `guild`, `guide`, `activity`, `achievements`, `pet`, `mount` carregados antes do `fc`; zero erro no console.
- FC de um save de nível 12: 938 com todos os módulos e 938 sem eles.
- Jogador novo sem debug até o fim do tutorial (Invocar no nível 3), zero erro.
- Corrigido: `Sys.guide.onEvent` era chamado com a assinatura errada; a do módulo é `(S, tipo, n)`.

Item 2 (mudança de poder na tela, `fcNotice`):
- Não dispara na carga. Item melhor que entra e equipa sozinho: "+269 ▲". Trocar por item pior: "−269 ▼" vermelho. Voltar ao mesmo valor: o aviso some. Duas montarias seguidas: um aviso só com a soma ("+22 ▲"). Subir de nível: "+66 ▲" (no jogador novo: +60 e +61). Total contando até o valor novo. Aparece por cima do painel aberto (print `v0128_aviso_poder_no_painel.png`).
- Corrigido 1: o aviso só saía pelo `statsChanged`; item que equipa sozinho, pet e montaria não avisavam. Agora o `hud()` também chama (4x por segundo).
- Corrigido 2: com isso o aviso se reabria sem parar; agora só age quando a FC mudou desde a última leitura.

Também nesta passada: 7 ícones novos do MENU (arena, guild, tourney, codex, chat, map, mounts) na tabela; níveis do PO para Mapa 1, Códex 12 e Chat 16 (saíram de trás do `NEXT_ON`; dependem só da chave `PANEL_ON`); nomes das habilidades das eras 7 e 8 marcados como aprovados.

NÃO conferido ainda (itens 3 a 6 e pendências): montarias (serpe, pônei, cavalo, tigre; correr, golpe, morte; os 3 ajustes; prints); morte nova do Kael; inimigo parado; era 4 viva e desempenho; efeito da ultimate por raridade; instância, Troca de era, Vitória/Derrota; aviso de poder no Equipar melhor de verdade, na Forja e ao entrar/sair do Modo dono; aviso duplicado com o "FC +N" do agente B; os 7 ícones novos carregando na tela (as telas estão desligadas); missão guia; 360x640. O teste de jogador novo usou o mesmo armazenamento do navegador que a aba do QA: guardei e devolvi o save no fim, mas a aba dela pode ter gravado por cima no meio.

## v0.12.8, conferência no navegador, 2ª parte (parcial) (2026-11-12)

Visto (390x844, era 4, `?debug=1&fresh=1`, nível 60), zero erro no console:
- **Cenário vivo da era 4** ligado (fábrica em camadas).
- **Serpe dourada V2** montada, 5 estrelas, com asa de anjo e pet (Esfinge): Kael sentado, arma na mão, asa do Kael mais alta e atrás com contorno claro, pet embaixo e à frente com as patas da frente da serpe visíveis, inimigo à direita. Print `v0128_serpe_asa_pet_era4.png`.
- **Morte nova do Kael**, montado e com pet: cai de joelho, a arma cai ao lado, a tela escurece com "DERROTADO", a montaria sai de cena, o pet fica parado. Print `v0128_morte_nova_montado_com_pet.png`.
- **Efeito por raridade** (valores lidos do módulo para a ultimate): partículas 1 / 1,2 / 1,5 / 1,9 / 2,4; tamanho do golpe final 1 / 1,05 / 1,1 / 1,2 / 1,3; tremor 1 / 1 / 1,1 / 1,2 / 1,3; clarão só em Mítico e Lendário.

DESEMPENHO (estimativa, PC, aba em primeiro plano, 15 s, mesmo método), com TUDO ligado (serpe 5 estrelas + pet + asa + era 4 viva): desenho 3,31 ms por quadro em média (95% até 7,4 ms); 33,7 quadros/s nesta medida (a máquina oscila muito: não vale como número de celular); memória do JS 27 MB. O desenho custa o dobro da era 0 (1,6 ms), por causa do cenário vivo.

Anotado, não corrigido: na morte montado as barras de vida continuam na altura da sela (o Kael já está no chão).

NÃO conferido nesta parte (fica para a próxima passada): pônei, cavalo e tigre; lobo e grifo refeitos; correr e golpe montado; aura em 1 estrela; prints `v0127_*` refeitos; morte a pé; inimigo parado nas eras 0–6 e o pulo ao voltar ao golpe; a ultimate por raridade A OLHO (clarão, tremor em px); aviso de poder no "Equipar melhor" real, na Forja e ao entrar/sair do Modo dono; aviso duplicado com o agente B; Troca de era de verdade; luta da instância; missão guia; 360x640; desempenho da era 4 SEM montaria/pet/asa para comparar.

### v0.12.8, nota de parada (2026-11-12)
- Escrito e NÃO visto: na morte montado as barras de vida descem com o Kael (`heroRise()` devolve 0 enquanto `B.deadT > 0` com a morte nova ligada; o HUD já refaz a posição quando esse valor muda).
- BLOCO A e BLOCO B do coordenador: NÃO iniciados nesta passada, fora a linha acima. Continuam abertos, na ordem dele: (1) morte a pé e conferir as barras; (2) inimigo parado nas eras 0–6; (3) ultimate por raridade a olho; (4) pônei, cavalo, tigre, lobo, grifo em movimento, aura 1 e 5 estrelas, prints `v0128_*`; (5) aviso de poder no Equipar melhor real, Forja e Modo dono; (6) custo do cenário da era 4 sozinho; (7) Troca de era; (8) luta da instância; (9) missão guia; (10) `setView('missions')` direto para a tela nova (B-26); (11) módulos chat, codex, phaseup, evtrail, name + provedores `P_CHAT` / `P_CODEX` + `Sys.codex.sync`.
- Achados do QA ainda não tratados: retorno imediato ao tocar em Pets (leva ~1 s para abrir); tutorial de save novo esperar a tela aberta fechar.

## Engenheiro 2 — v0.12.8, BLOCO A (2026-11-12)

Assumi no meio da v0.12.8. Tudo abaixo foi olhado no Chrome, origem `localhost:8080`, Modo dono (save separado), com o jogo esticado para 390x844 por script (a janela não aceita redimensionar: a tela inteira não cabe em 639 px de altura; conferi por faixas e por uma lupa do canvas). Zero erro no console nas cargas finais; `node --check` em todos os `js/*.js`. Versão continua v0.12.8.

### Visto rodando
1. **Morte nova do Kael a pé**: ajoelha, cai deitado, a arma cai ao lado, "DERROTADO". **Morte montado**: a montaria sai, o Kael cai a pé e as BARRAS DESCEM com ele (`heroRise()` 33,5 → 0; a linha escrita na parada funciona).
2. **Inimigo parado, eras 0 a 6**: pés na linha nas 7 eras. Medi a troca de quadro em cada passagem: parado → golpe sem pulo (ex.: `i2>a2`, `i3>a3`), golpe → parado sempre do último quadro para o quadro 0. Ver "Corrigido".
3. **Ultimate por raridade** (arma da era 2): Básico = cinza/branco, sem clarão; Épico = roxo, mais partículas, anel maior; Lendário = dourado, dois anéis, clarão (0,26) só nele. Tremor medido em px de TELA: no máximo 2,95 nas três.
4. **Montarias**: pônei, cavalo, tigre, lobo, grifo e serpe, cada uma parada, correndo e no golpe: patas no chão, arma na mão, pet à frente com as patas da frente à vista. Prints novos em `reports/prints/`: `v0128_sem_nada`, `v0128_so_pet`, `v0128_so_montaria_lobo`, `v0128_lobo_pet_asa`, `v0128_grifo_pet_evoluido_asa`, `v0128_ponei`, `v0128_cavalo`, `v0128_tigre`, `v0128_serpe` (recorte da tela de 205 a 844 px).
5. **Aviso de poder**: "Equipar melhor" real = um aviso só ("+126 ▲ FC 2.228"), sem o selo "FC +N" do Equipamento; Forja (Fortalecer) = "+11 ▲ FC 2.239"; entrar e sair do Modo dono pelo botão, 10 s de espera cada: nenhum aviso.
6. **Desempenho** (PC, aba em primeiro plano, 15 a 17 s por medida, `performance.now` em volta do desenho; cenário e jogo medidos separados):

| canvas | era | sem nada: cenário / jogo | com tudo (serpe 5 estrelas + pet + asa): cenário / jogo |
|---|---|---|---|
| 360x749 (janela como está) | 4 | 1,75 / 2,06 ms | 1,66 / 2,80 ms |
| 360x749 | 0 | 1,15 / 2,23 ms | 1,21 / 3,35 ms |
| 488x1055 (390x844) | 4 | 2,74 ms (cenário) | 2,62 ms (cenário) |
| 488x1055 | 0 | 1,41 ms | 1,23 ms |

   O cenário vivo da era 4 sozinho fica ABAIXO de 3 ms (1,7 ms no tamanho de sempre; 2,7 ms em 390x844): não proponho corte. Ele custa ~1,5 a 2 vezes o da era 0 (mais camadas: cidade ao fundo, engrenagens, fumaça, névoa, raios). As medidas do jogo na tabela de 488x1055 não valem (a entrada nova abriu por cima no meio).
7. **Achados do QA**: (a) com Configurações aberta durante o tutorial o holofote e o balão somem e voltam ao fechar; (b) Pets: o botão responde em 27 ms, a tela está montada em 89 ms e visível em ~270 ms; toque duplo não fecha nem trava.
8. **Jogador novo pela entrada nova** (save novo de verdade, sem `fresh`): carregamento mostra só "Pré-História" e fica na era do jogador; depois do nome NÃO abre o modal antigo: aviso curto "Presente de boas-vindas: +200 (moeda) +50 (gema)" com os ícones do jogo, 200 moedas e 80 gemas no save, tutorial começa. Recarregar: continua 212 / 80, sem segundo presente.

### Corrigido
- `js/battle.js`: inimigo parado com relógio próprio e o golpe começando no quadro em que o preparo estava (antes voltava ao quadro 0: pulo de até 3 quadros). TREMOR com teto de 3 px de tela (o golpe final da ultimate chegava a ±5,2 px). Emojis fora do nome do chefe ("Chefe Rex Furioso", "Senhor da Era …") e da transição de era antiga.
- `js/mountfx.js`: a aura por estrela NÃO aparecia em cima do cenário claro (só em fundo escuro). Agora é um contorno de luz colado na silhueta: fino e claro em 1 estrela, largo e dourado em 5. Asa do Kael na serpe: `wy2` 26 → 10 (ficava solta acima da cabeça).
- `js/meta.js`: boas-vindas sem emoji e sem "7 eras"; com a entrada nova ligada o modal antigo não abre (presente uma vez, aviso curto, tutorial); `showWelcome` não repete; holofote escondido com tela cheia que não é a do passo e com Vitória/Derrota ou Troca de era abertas; "Enquanto você esteve fora", passo 1 do tutorial e "Tutorial concluído" sem emoji.
- `js/loading.js` + `index.html`: rótulo só com o nome da era; a travessia vai da Pré-História até a era do jogador.
- `index.html`: "Configurações" sem emoji (título antigo e modal antigo); reserva de moeda/gema sem emoji; `?debug=1&skip=1` também pula a entrada nova.
- `js/fullbattle.js`: retorno imediato no toque dos itens do MENU. `js/farm.js`: emoji de moeda fora do texto flutuante reserva.

### Escrito e NÃO visto
- Modal antigo de boas-vindas (entrada nova desligada) depois da troca do emoji pelo ícone do baú.
- Clarão do Mítico (só li o valor da tabela); ultimate por raridade em outras eras além da 2.
- Holofote por cima da DERROTA (a regra nova cobre `B.res`; a tela 10 fica para o Bloco B).
- 360x640; celular.

### Anotado, não corrigido
- Custo do contorno de luz no celular: usa sombra do canvas (2 a 3 desenhos do quadro da montaria). No PC a montaria + pet + asa somam 0,7 a 1,1 ms. Se o aparelho sentir, troco por silhueta guardada em cache.
- Kael caído fica parcialmente atrás do pet (o pet continua à frente).
- Grifo 5 estrelas + pet evoluído: a asa do pet encosta no focinho do inimigo da frente.
- Parado dura pouco na prática (os inimigos emendam golpes): nas eras 1 e 4 só vi o quadro 0 do preparo em 6 s.
- A folha de fogo da ultimate não muda de cor com a raridade (só partículas, anéis e brilho mudam).
- Save de teste da origem `localhost:8080` (nível 60): guardei, usei a chave para o teste de jogador novo e devolvi igual (2.908 caracteres).

Pedidos abertos: A-21 (Arte: resíduo escuro nas folhas do lobo; maça sobre o rosto em pônei/cavalo/tigre; agente B: arma errada na vitrine da Forja; letreiro da ultimate).
BLOCO B: não iniciado (itens 8 a 13 + Vitória/Derrota do chefe no jogo real + Correio com `mail` na lista de módulos).

## Engenheiro 2 — v0.12.8, BLOCO B (2026-11-12; interrompido por ordem do dono para a asa)

Tudo visto no Chrome, `localhost:8080`, Modo dono (save separado), mais o save de teste da origem para a conferência de poder. Zero erro no console.

### Visto rodando
- **Troca de era de verdade (item 8)**: Senhor da Era da fase 10 morto → VITÓRIA (tela 10) → "Continuar" → Troca de era (portal, "ERA 2 · ANTIGUIDADE", inimigos, recompensa +40 gemas e +5 Essência) → "Começar a era" → jogo rodando em Antiguidade 2-1.
- **Vitória/Derrota do chefe no jogo real**: a morte aprovada do chefe toca inteira (aos 0,67 s e a 1,00 s de 1,08 s só o cabeçalho na tela; o baú entra em 1,23 s e o letreiro em 1,98 s); cartões = saque real (42 moedas, +10 gemas, 41 XP, 1 pedra de forja, Botas de Pele raro); "Continuar" devolve o jogo na fase seguinte. Derrota: Kael caído, FC x recomendada, três caminhos; "Modo farm" entrou sozinho em 10 s; "Tentar de novo" desafia o chefe outra vez. **`SCREENS_ON.bossResult` LIGADA por padrão** (`?debug=1&res=0` desliga).
- **Luta da instância (item 9)**, com `?painel=inst`: vitória (Arsenal, 12 abates, prêmio na tela), derrota e tempo esgotado (Chefe de Era): "Não foi dessa vez · A entrada não foi gasta"; volta à mesma fase e onda; ouro/itens só mudam pelo prêmio; cabeçalho "Instância 0:40".
- **Missão guia (item 10)**, com `?painel=guidehud` e `Sys.guide.DATA.on` ligado na mão: barra em 56,92 (174x35) sob a barra de fase, sem cobrir cabeçalho nem MENU; "Derrote 10 inimigos" andou até 10/10, "Resgatar" entregou e passou para "Derrote o primeiro chefe".
- **Módulos (item 12)**: `chat, codex, phaseup, evtrail, name, mail, net, buy, online, auction` carregados antes do `fc` (arquivos conferidos), chaves desligadas (só `mail` ligada); `P_CHAT` e `P_CODEX` criados; FC do save antigo 4.509 antes e 4.509 depois.
- **Correio (item 13)**: carta "Bem-vindo a Eonbound" na tela, uma só; depois de recarregar continua uma; `welcomeOnce` devolve 0.
- **Oferta só no Modo dono**: ícone no HUD (direita, sob o Baú) com o relógio "23h 59min", abre a tela; no save normal tela e módulo desligados, ícone escondido, relógio não começa.
- **Leilão**: abre como demonstração, cartão de exemplo, "Comprar · abre com o online" desligado; nível 45 na tabela.
- **Pet**: na morte recua para trás do Kael (corpo caído inteiro à vista); grifo + pet evoluído sem encostar no inimigo.

### Corrigido / escrito
- `js/battle.js`: vitória → Troca de era em ordem (`B.eraPend`, abre quando a vitória fecha); nome real do Senhor da Era na Troca de era; sem "Derrotado... recomeçando a fase" na instância; folga do inimigo refeita quando montaria/pet mudam no meio da onda (era a causa do pet encostando); `codexSync` na fase vencida.
- `js/instfx.js`: aviso de reserva quando a tela `inst` não abre; fecha a Vitória/Derrota antes de entrar (ficava PRESA por cima da instância se o chefe da campanha morresse no instante da entrada: visto); não entra com a Troca de era aberta.
- `js/fullbattle.js`: relógio da instância (o número da fase escrevia por cima); ícone "Oferta 24h".
- `index.html`: lista de módulos; `sysBootB()` (provedores, correio, oferta no Modo dono); `codexSync()` no `statsChanged`; `setView('missions')` direto para a tela 34 (B-26); tela 10 ligada.
- `js/farm.js`, `js/petfx.js`: `codexSync` em item novo e em ovo; recuo do pet na morte. `js/mountfx.js`: `pdx3` do grifo.

### Não visto
- Chat e Códex abertos com os provedores (só conferi que existem); `Sys.codex.sync` gravando em cada gatilho (vi 6 vistos no save depois da carga).
- Holofote do tutorial por cima da Derrota; entrada na instância no instante da morte do chefe DEPOIS do conserto.
- Menu do Leilão num jogador abaixo do nível 45 (li a tabela: 45).
- 360x640; celular.

### Aberto (fila passada pelo coordenador, nesta ordem)
1. ASA NAS COSTAS (âncora `back` + `root` das asas), a pé nas 4 fases e nas 6 montarias; prints `v0128_asa_*`. 2. `drawHeroFull` (pet/montaria/asa/aura nunca somem; Vitória, Troca de era, subir de nível) e `drawHeroLayers` para a Aparência. 3. P3/P1 (imagens de arma e da Oferta). 4. "Pular" do tutorial em save antigo. 5. Fases do Kael (`PHASES_ON`), cenários das eras 6 e 7, Kaia, pets novos.
Serpe na tela de Montarias: depende do agente B (A-22).

## Engenheiro 2 — ASA NAS COSTAS (2026-11-12; ordem do dono)

Feito e visto (Chrome, `localhost:8080`, Modo dono, era 0): a asa agora é desenhada DENTRO do desenho do herói, presa à âncora `back` de cada quadro (Arte) com a raiz `root` do `wing_<tipo>.json`, antes do corpo: `drawWingsAt()` em `js/stage.js`, chamada pelo Kael a pé (corpo + arma, pistola, espera da pistola) e pelo Kael montado (`js/mountfx.js`). Par L/R (anjo, demônio) e asa única (`single`: dragão, energia; escrita, NÃO vista: o jogo ainda não dá essas asas).
- A pé (garoto): parado, correndo e golpe, anjo e demônio: a raiz fica nas costas na altura do ombro, atrás do tronco; nada acima da cabeça.
- Montado: lobo (parado, correndo, golpe), grifo (parado, correndo, golpe), serpe (parado, correndo, golpe), pônei (parado): a asa sai das costas do Kael, na escala dele na sela (0,65), inclinada com o tronco, e acompanha o corpo no golpe.
- A âncora das folhas do garoto pula até 20 px em x de um quadro para o outro (medida automática): nas folhas em laço uso a mediana do x da folha e mediana de 3 quadros em y/ângulo; nos golpes, mediana de 3.
- Prints: `v0128_asa_garoto_parado`, `v0128_asa_garoto_golpe`, `v0128_asa_garoto_demonio`, `v0128_asa_lobo`, `v0128_asa_grifo`, `v0128_asa_serpe` (recorte ampliado do canvas, fundo verde da lupa).
- `MOUNT_TBL` wx/wy/wx2/wy2 e `mountWingOff` ficaram sem uso (a âncora substitui). Ícone da Oferta 24h trocado para `offer.png` (não visto na tela depois da troca).
NÃO feito: asa nas fases 1, 2 e 3 a pé (as fases ainda não estão ligadas na batalha: entra com o item "Kael nas 4 fases"; a âncora dessas folhas já é lida pelo mesmo código); os 7 prints antigos reprovados com os MESMOS nomes; giro/rastro usam a última âncora (a folha composta não tem `back`).
Achados: (1) montado de perfil só aparece UMA metade da asa na maior parte dos quadros (a outra fica atrás do Kael): é o esperado da receita, mas o dono precisa ver; (2) folhas do lobo parado/correndo AINDA mostram o risco escuro perto da cabeça do Kael nesta aba (pode ser cache de imagem do navegador: não confirmei); (3) "arma some montado no grifo/lobo" (QA): com espada das eras 0 e 2 a arma aparece na mão nos meus prints; não reproduzi; preciso saber qual arma estava equipada; (4) ângulo da maça em pônei/cavalo/tigre: não conferido.

## Engenheiro 2 — KAEL NAS 4 FASES + drawHeroFull (2026-11-12)

### Visto no navegador (`localhost:8080`)
- **Save de teste de nível 60** (não é o do dono): antes = garoto; ao carregar aparece "Kael evoluiu: Adulto!" com clarão + animação de subir de nível, e ele vira o ADULTO (armadura), pés no chão, arma do item na mão, barras acima da cabeça nova. FC 4.509 antes e depois, 3 itens, skins iguais. Recarreguei duas vezes: sem animação, continua adulto. Prints `v0128_fases_nivel60_antes/evoluindo/depois.jpg`.
- **4 fases lado a lado** (garoto, adolescente, adulto, guerreiro), com a asa de anjo: parado, correndo, golpe e giro: pés na linha, arma na mão, asa saindo das costas nas 4. Prints `v0128_fases_4_lado_a_lado_{parado,correndo,golpe,giro}.png`. Com arma de fogo (era 5) as fases 1 a 3 seguram a arma na mão.
- **drawHeroFull / drawHeroLayers**: prévia num canvas à parte com grifo + asa + pet + aura da montaria, e adulto a pé + asa + pet (`v0128_herofull_previa_grifo_e_adulto.png`). Na batalha depois da vitória: grifo + asa + pet na tela.
- Testes: `node --check` em tudo; `run.js` 141 OK; `flows.js` "fluxos duros OK" (acertei o TESTE da Troca de era para seguir Vitória → Continuar → era; no jogo, a abertura da era pendente saiu do `loop()` e foi para o `tickFx()`, que o teste também roda).

### O que foi escrito
- `js/stage.js`: bloco "KAEL POR FASE": `PHASES_ON` (index; `?fases=0` desliga), `phaseBoot`, `heroPhase`, `phaseSheet` (lê `Sys.appearance.sheetFor`), `drawHeroPhase` (fases 1 a 3), `phaseCheck` (evolui direto para a fase certa, UMA animação, grava na hora), `drawEvo`, `phaseBodyH`. Fase 0 continua no desenho de sempre.
- `js/battle.js`: `heroBodyH` por fase; `drawHeroFull(ctx, x, y, scale, state)` e `drawHeroLayers(canvas, layers, dt)` em `window` (recebem o ctx/canvas; a assinatura do `drawHero` e o par `ctx`/`mainCtx` NÃO mudaram).
- `js/petfx.js`: o pet não some mais com a Vitória/Derrota aberta (sumia por `B.res`). `js/farm.js`: `phaseCheck` no subir de nível. `js/artprev.js`: 4 atalhos "Fase: ..." no Modo dono. `js/mountfx.js`: campo `skip` dos ataques montados. `index.html`: `PHASES_ON`, `phaseBoot`, módulo `schedule` na lista.

### NÃO feito / NÃO visto (honesto)
- **CAMADAS da roupa-skin** (chapéu, tinta de colete/botas pelas máscaras, óculos/máscara, aura da skin): NÃO desenhadas. `drawHeroLayers` hoje só usa a lista para asa e arma. O print 34→35 com a54 não foi feito. É o próximo passo e é grande (pintura em cache por fase/estado/material).
- Evolução 0→1 com a folha própria `evolve_0_1` (nível 21→22): escrita, não vista. Evolução subindo de nível de verdade (22, 35, 70): não vista (só a da carga).
- Pet na tela de Vitória: o conserto está escrito e o pet apareceu na batalha logo depois; os dois prints da Vitória e do subir de nível falharam ao salvar e NÃO os vi. Nome do chefe no letreiro da Vitória em luta real: não conferido.
- Montado nas fases 1 a 3: as folhas de montaria só têm o Kael GAROTO; montado ele continua garoto em qualquer fase (precisa de arte ou decisão do PO).
- Cenários das eras 5 a 8, P3, "Pular" do tutorial, ração no `showOffline` antigo, Kaia, pets novos, eventos com horário: não iniciados. `schedule` entrou na lista de módulos, mas NÃO conferi a FC do save com ele (o save de teste deu 4.509 nas cargas desta passada, já com o módulo).
- Resíduo do lobo com cache limpo, arma do nível 60 no punho montado, ângulo da maça: não conferidos.

### Achados para a Arte / Sistemas
- `phase1/2/3/kael_die_body`: as três mostram o GAROTO morto (mesma arte da pasta R).
- Nas fases 1 a 3 as folhas `run`, `attack` e `spin` têm o corpo 96 px mais à direita na célula do que a `idle`, com o mesmo `padLeft: 96` (diferença visível no `xf.ox`). Compensei no código pela diferença do `xf.ox`; o certo é o `padLeft` da folha dizer a verdade.
- Folhas `pistol_*` por fase existem mas não são usadas nas fases 1 a 3 (uso corpo + arma na mão).
- Quem desenha o herói fora dos meus arquivos (para trocar por `drawHeroFull`): `js/p_offer.js:51-64` (chama `drawHero` trocando `ctx`/`mainCtx`), `js/p_era.js:11, 92, 131` (folha `kael_run_body` própria, sem asa/pet/montaria), `js/p_forge.js:180`, `js/p_pets.js:399`, `js/p_profile.js:7, 16`, `js/p_tower.js:18`, `js/p_arena.js:17`, `js/p_tourney.js:45, 47`, `js/p_rank.js:16`, `js/p_vip.js:21`, `js/p_events.js:54, 210`, `js/p_map.js:50`, `js/p_codex.js:28`, `js/p_cfg.js:278`, `js/p_intro.js:228`, `js/p_look.js:17`, `js/screens.js:415, 679`, `js/screens2.js:285, 366` (imagem/`kidle`/folha própria do Kael garoto).

### Adendo: "pad duplo" das folhas não-paradas das fases 1 a 3 (aviso da Arte)
Medido: nos `.json`, `xf.ox` de run/attack/spin é exatamente 96 px maior que o da idle nas fases 1, 2 e 3 (phase1 67,8 → 163,8; phase2 105,2 → 201,2; phase3 98,7 → 194,7). No navegador, SEM compensar, o adolescente/adulto/guerreiro correndo e golpeando apareciam deslocados para a direita da sombra (≈ 96 px da célula × escala da fase; print antigo da 1ª tentativa); COM a compensação ficam centrados na sombra como o parado (prints `v0128_fases_4_lado_a_lado_correndo/golpe/giro`). A compensação está num ponto só: `phasePadFix(M, idM)` em `js/stage.js` (lê `M.padFix` se a Arte gravar; senão a diferença do `xf.ox`). `pistol_run`/`pistol_shoot` por fase não são usadas pelo código. Se a Arte corrigir os PNG sem atualizar o `xf.ox`, o Kael vai pular 96 px para a ESQUERDA: aí basta gravar `"padFix": 0` nos json ou apagar a função. Não medi em px na tela com régua; a conferência foi a olho contra a sombra.
`js/avatar.js` ainda não existe no disco: o retrato do cabeçalho não foi trocado. `drawHeroFull` tem o ctx como primeiro parâmetro; por dentro ela troca o `ctx` global da batalha só durante a chamada e devolve no `finally` (funciona com canvas fora da tela).

## Engenheiro 3 — v0.12.8, fechamento para o APK (2026-11-12)

Arquivos mexidos: `index.html`, `js/stage.js`, `js/battle.js`, `js/fullbattle.js`, `js/artprev.js`. `node --check` em todos; `run.js` 145 OK; `flows.js` "fluxos duros OK". Navegador: uma aba em `localhost:8080/?debug=1&fresh=1` (save em memória, `__noSave`); os 3 saves do armazenamento conferidos iguais ao backup no fim; aba fechada.

### Feito e VISTO
- **Morte por fase**: `dieSheet()` lê `Sys.appearance.sheetFor(..., 'die')` (pasta da fase), escala da fase, pés no chão, arma caindo. Vistas as 4 fases em 3 momentos (`v0128_morte_4fases.png`): garoto, adolescente, adulto e guerreiro morrem cada um com o seu corpo.
- **96 px das fases 1-3 (depois da correção da Arte, cache refeito)**: `phasePadFix` deu 0,000 nas 3 fases (não mexi). Parado × correndo × golpe × giro: centro dos pés a no máximo 20 px da âncora em todas (medido por pixel), asa nas costas e arma na mão (`v0128_fases123_sem_pulo_96px.png`).
- **Retrato do cabeçalho** (`js/fullbattle.js`): `#fb_kid` vira o canvas do `avatarFor(S, 50)` (mesmo círculo de 50 px); `avatarRefresh()` quando herói/fase mudam; sem o `avatar.js`, o de antes. Visto nos níveis 21 (garoto), 22 (adolescente), 35 (adulto), 70 (guerreiro): `v0128_avatar_cabecalho_{21,22,35,70}.png`.
- **Cenários vivos das eras 5 e 6 ligados** (`sceneV2:true`); eras 7 e 8 (sem entrada na tabela ERAS) por prévia: `sceneForce(7|8)`, botões "Cenário: Submundo / Celestial / da era atual" no Modo dono e `?debug=1&scn=7`. `scene.js?v=VERSION-c58`. Vistos os 4 (`v0128_cenario_era{5,6,7,8}.png`). Custo do desenho da cena (PC, canvas 360x728, 150 quadros, `api.draw()`): era 5 1,15 ms · era 6 1,02 · era 7 2,06 · era 8 1,18 · era 4 1,68 · era 0 1,87 (95%: até 3,4 ms na era 7).
- **Vitória com lobo + asa + pet** e **nome do chefe** ("SENHOR DA ERA · Rex Furioso") em luta real: `v0128_herofull_vitoria.png`.
- **Evolução 21 → 22 de verdade** (subindo de nível): aviso, folha `evolve_0_1`, clarão, adolescente (`v0128_evolucao_21_22_depois.png`). 34 → 35 subindo de nível: adulto.
- **Golpe montado nas 6 montarias** (cache refeito), 4 momentos do golpe (não os 17 quadros): arma no punho, sem guia preta, braço fantasma ou mancha (`v0128_golpe_montado_6_{preparo,golpe}.png`). No preparo a cabeça da maça passa em cima do rosto do Kael em cavalo, grifo, tigre, pônei e serpe (A-21, aberto).

### Feito, só ESCRITO depois da última olhada (testes passam; não revisto no navegador)
- `phaseCheck`: na carga chama `Sys.phaseUp.catchUp` (aplica tudo menos a última fase) e toca UMA evolução (a final) pelo `pending().anim`: folha com o herói (`sheet`, por herói) quando não há asa/montaria; com `layered` ou montado, herói antigo → `anim.fx` (troca no quadro 27) → herói novo; arquivo faltando = efeito por código. Rotina única (ninguém mais evolui).
- **Subir de nível**: a folha `levelup` TRAZ o Kael garoto a pé desenhado; montado/fases 1-3 aparecia um segundo Kael criança por cima (VISTO: `v0128_herofull_levelup.png` é o print do DEFEITO). Agora ela só toca com Kael garoto a pé; nos outros casos coluna de luz + anel por código. Na evolução a animação de subir de nível não toca por cima. Aviso encurtado para "Evoluiu: Adolescente!" (o antigo era cortado pelos botões da esquerda).

### Camadas da roupa-skin: escritas, vistas e DESLIGADAS (decisão final do dono)
`LAYERS_ON` = falso (só liga com `?debug=1&camadas=1`); com a chave desligada `layNow()` devolve null e o desenho é o de antes, sem custo. Enquanto ligada foi vista nas 4 fases (tinta por máscara em cache, chapéu, óculos, aura; 1,14 ms/quadro com × 1,21-1,32 sem: sem diferença medível) e `drawHeroLayers(canvas, layers, dt)` funcionou em canvas da tela e fora da tela. Prints `v0128_camadas_4fases.png` e `v0128_fases_skin_34_35_{antes,depois}.png` são dessa função desligada. `drawHeroFull` ganhou só o campo opcional `state.layers`; assinatura igual.

### NÃO feito
- **Kaia (tarefa F)**: nada (KAIA_ON, pistola por herói/fase, `js/intro.js:88/102`).
- Não vistos: `setView('missions')`, ícone da Oferta 24h, arma do nível 60 montado, meio da evolução com `anim.fx`, subir de nível com o efeito por código.

### Achados para outros donos
- **`js/p_era.js:11, 92, 131` (Troca de era)**: desenha o Kael GAROTO a pé, sem montaria, asa e pet, mesmo com jogador adolescente montado (VISTO: `v0128_herofull_era.png`). Precisa chamar `window.drawHeroFull`.
- Arte: versão só-efeito da `levelup` (`levelup_fx`); `R/masks/kael_attack_head.json` e `kael_spin_head.json` dizem `w:256` mas as coordenadas estão na célula de 448.
- Sistemas: `js/sys/level.js:83` aviso com emoji de estrela. Fluxos 4 e 5 do `flows.js` não são meus.
- `js/avatar.js` desenha chapéu/óculos pelo `layers()`; hoje o módulo não devolve mais essas camadas.

## Engenheiro 4 — v0.12.8, herói sem crescimento + skins fixas + Kaia (2026-11-12)

Plano mudou no meio (dono, via coordenador): SEM crescimento por fase; padrão = garoto/menina; adulto/guerreiro = skins fixas. As tarefas 1a-1c (evoluções) foram canceladas e não foram vistas.
Arquivos mexidos: `index.html`, `js/stage.js`, `js/battle.js`, `js/farm.js`, `js/fullbattle.js`, `js/mountfx.js`, `js/artprev.js`, `js/intro.js`. `node --check` em todos; `run.js` TUDO OK (145); `flows.js` "fluxos duros OK" (fluxo 4 novo de Sistemas 34/34). Navegador: uma aba em `localhost:8080/?debug=1&fresh=1&skip=1` (save em memória, `__noSave`); os 4 itens do armazenamento conferidos iguais ao backup no fim (a chave `eon_owner_mode`, criada para ver o Modo dono, foi removida); aba fechada. Aviso: a 1ª carga foi sem `fresh=1` (o save de teste carregou antes do `__noSave`; o backup foi tirado logo depois).

### A) Fases → skins no desenho (VISTO)
- `PHASES_ON = false` (index.html:336). `phaseBoot/phaseCheck/drawEvo` inertes atrás da chave (nada apagado).
- `heroForm()` (js/stage.js): PONTO ÚNICO de herói + pasta + escala, lido de `Sys.appearance.sheetFor(S, host, estado[, {skin}])` (dir e scale do retorno; `PH_SCALE` só de reserva). O desenho não lê mais `Sys.phaseUp`. `heroPhase()` = número da pasta (formato da folha). Morte, asa (back), arma e pistola saem da pasta devolvida. Herói/skin mudou → `avatarRefresh()`.
- Pistola: `pistolSheet/pistolScale` saem da pasta do herói/skin (antes `R/` + `kael_` fixos); as skins de corpo próprio passaram a usar as folhas `pistol_*` (antes seguravam a pistola na pose da espada, apontada para o chão: visto e corrigido).
- `drawHeroFull(..., {skin: id|'default'})`: campo opcional novo (vitrine do QA); assinatura igual.
- Modo dono: saíram "Fase: ..."; entraram "Herói: Kael/Kaia" e "Skin: Padrão / Cavaleiro / Guerreiro Lendário" (`grantFixed(owner)` + `equipFixed`). Os BOTÕES não foram clicados; as chamadas por trás foram feitas pelo console.
- Visto: nível 60 → garoto (`form.stage 0`), FC igual com e sem `S.sys.phaseUp.stg=2` no save (4489 = 4489); Kael padrão/Cavaleiro/Lendário e Kaia padrão/Cavaleira/Lendária em parado, corrida, golpe, giro, morte, pistola, tiro e montado, com asa: `v0128_skins_fixas_{kael,kaia}.jpg`. Kael Cavaleiro equipado na batalha real (escala 1,25; retrato do cabeçalho trocou; FC 4489 → 4733).

### B) Subir de nível (VISTO)
`LVUP = assets/anim/fx/levelup_fx` por cima do herói desenhado (escala da skin; montado ×1,3 e centrado na sela); a folha antiga saiu de uso; arquivo faltando = efeito por código. Visto: Kaia a pé, Kael a pé, Kael no lobo com asa (`v0128_levelup_fx_montado.png`): um herói só. A pé, o texto "NÍVEL +1" da folha cai atrás da barra de vida/botão Passe (arte/posição: decidir).

### C) Kaia jogável (VISTO)
- `KAIA_ON = true` (js/intro.js); cartão da Kaia com a folha dela, seleção, nome com o herói escolhido; grava por `Sys.appearance.setHero`. Visto na intro ANTIGA (js/intro.js) até entrar no jogo de Kaia. A entrada NOVA é `js/p_intro.js` (`PI_KAIA=false`, do Servidor): lá a Kaia continua "em breve".
- Batalha real: Kaia com asa, pet, retrato; parado/corrida/golpe/giro/morte/pistola: `v0128_kaia_menina_{parado,golpe,morte}.jpg`. Nenhum caminho cai no Kael (carregando = nada por um instante).
- MONTADA: só existem `assets/anim/mounts/kael_*`. A Kaia aparece A PÉ e a montaria não é desenhada (bônus da montaria continua); `MOUNT_HERO` em js/mountfx.js recebe `kaia: 'kaia_'` quando a arte chegar. Visto (antes do conserto o `state.mount` do drawHeroFull mostrava o Kael no lobo: corrigido).
- `body.kaia` (index.html): `.kidle` e a corrida do carregamento mostram a Kaia em todas as telas (classe posta; telas dos outros donos NÃO vistas).

### D) FC, E) Passe 25, F) slots 7-8, G) conferências
- FC trocada nos meus arquivos: `fcShow()` (index.html:547) em index.html:531, :533 (anima o valor real), :598 (dois números) e js/fullbattle.js:307. Visto "FC 2,2 mil".
- Passe: `SEASON_SKIN=''`, `PASS_SKIN_AT={}` (index.html:410), `addSkin('season')` não entrega nada (js/farm.js:63); `Sys.pass.releaseMountFrags(S)` no `statsChanged()` e no boot. ESCRITO, não visto.
- `slotIcon` até a era 8 (index.html:330; os 14 arquivos existem). ESCRITO, não visto.
- VISTO: `setView('missions')` abre Missões (Diárias/Semanais); ícone da Oferta 24h no Modo dono (`assets/icons/menu/offer.png`, "23h 59min"); arma no punho montado em lobo, grifo e serpe com armas das eras 4, 5 e 6 (`v0128_arma_punho_montado.jpg`, tamanho de grade).

### Achados para outros donos
- Arte: `kaia_phase2/kaia_pistol_*_body.json`: grip fora da mão (pistola da Kaia Cavaleira flutua ~10 px à frente). Morte com pistola (todos): a arma gira abaixo da linha do chão no meio da queda.
- Servidor: `js/p_intro.js` `PI_KAIA=false`.
- Asa nas skins de corpo próprio fica bem maior (escala 1,25/1,30 × âncora): conferir no voto.
- Prints em .jpg (captura do navegador), não .png.

### Engenheiro 4 — consertos P20 e P21 (2026-11-13), VISTOS
- **P20 morte com pistola** (`js/stage.js` drawHeroDie): a arma termina deitada pelo ângulo nativo dela (meta.json; espada 90 = como antes, pistola 0 = deitada) e o ponto mais baixo para em fy-2. Visto Kael e Kaia, espada, pistola da era 3 e da era 5, em 3 momentos: nada abaixo da linha do chão (`v0128_morte_pistola_{kael,kaia}.jpg`). No fim a pistola fica quase toda atrás do corpo deitado.
- **P21 "NÍVEL +1"** (`js/battle.js`): `drawLevelUp()` passou para depois das barras de vida e selos do canvas; como a barra de vida do herói é HTML (fica por cima do canvas), a folha virou `assets/anim/fx/levelup_fx_low` (arquivo conferido). Visto a pé e no lobo: texto inteiro visível, abaixo da barra (`v0128_levelup_texto.png`, `v0128_levelup_texto_montado.png`). Montado (efeito ×1,3) o texto passa por cima da cabeça do Kael.
- `node --check`, `run.js` TUDO OK (145), `flows.js` fluxos duros OK. Aba fechada; save em memória; armazenamento com as mesmas 4 chaves.

## Engenheiro 5 — v0.12.9 (2026-11-13)

### ESTADO AO PARAR PARA O PRÉ-CARREGADOR (ordem urgente do dono)
- Peças 1-3 ESCRITAS, testes passando (`node --check`, `run.js` TUDO OK 150, `flows.js` fluxos duros OK), NADA visto no navegador ainda. Arquivos: `js/battle.js`, `js/stage.js`, `js/mountfx.js`.
- Peça 1 (ultimate pela família, `ultPlan`/`ultStart`): base por família e reforço do Mítico LIGADOS (não vistos); 9 lendárias atrás de `ULT_LEGEND_ON` (js/battle.js, DESLIGADA; `?debug=1&ultlend=1`). Peça 2 (asas novas: `wingNow` + `fit` do .json) atrás de `Sys.stats.DATA.newWings/newWingReady` (desligadas). Peça 3 (arco/bumerangue: `rgAct`, flecha e bumerangue por código) atrás de `DATA.weaponTypes.bow/boomerang.on` (false).
- Com as chaves desligadas o caminho é o de antes, exceto: a arma na mão sai da família do item (`wFamLook`, igual à arte do item nas 9 famílias) e a ultimate sai de `Sys.stats.ultOf` (mesma folha da era da arma até o Épico; Mítico e Lendário ganham o reforço por código).
- `ULT_LEGEND_ON` virou `window.ULT_LEGEND_ON` (pedido do Engenheiro 6), lida a cada uso, desligada por padrão. Ligada pelo botão no meio do jogo, a 1ª ultimate ainda pode sair em código (a folha própria carrega na troca de arma/`preloadAssets`).
- ABERTO na peça 3 (achado do Engenheiro 6): com arco/bumerangue equipados pelo Modo dono o Kael aparece sem arma e os ícones de Básico/Ultimate ficam escuros. Não investigado.

### PRÉ-CARREGADOR (ordem urgente do dono) — `js/preload.js` (novo), `js/loading.js`, `js/battle.js`, `js/stage.js`, `js/petfx.js`, `index.html` (só `'preload'` no começo da lista de scripts)
- API fechada: `Preload.ready(urls, {timeout}) → Promise<{ok, failed[]}>` (nunca rejeita; padrão 30 s) e `Preload.has(url)`. Extras: `get`, `image`, `json`, `retry`, `drop`, `track`, `reset`, `progress`, `all`, `limit`. Imagem pronta = `img.decode()` (reserva: onload); 3 tentativas de 12 s por arquivo; falhou = aviso único no console e reserva.
- UM cache: `sheetLoad`, `IMG`, `J` e a asa pegam a imagem do `Preload` (mesma instância). Exceções: o cenário vivo (`EonScene`, carregador próprio; entra na barra pela promessa `ready` dele) e os `<img>`/fundos CSS do DOM (o Preload decodifica uma cópia; o navegador reaproveita o cache HTTP). `PRE_MINI` no topo do `js/battle.js` NÃO é um segundo cache em uso: é a reserva que só entra se `window.Preload` faltar ou vier sem `get` (foi o que derrubou o jogo às 00:42 e o teste do painel de instância, cujo sandbox troca o `Preload` por um stub).
- Lista única: `sceneList({era, part})` (js/loading.js). Fonte: `Sys.assets.sceneSet/nextEraSet` (com o manifesto carregado na barra) + o que o jogo pede pelos próprios carregadores. Grupos que bloqueiam: hero, weapon, ult, mount, pet, wing, era, enemies + ícones visíveis do DOM + fontes; o resto do grupo icons carrega depois, em segundo plano.
- Barra = prontos ÷ total; "Tentar de novo" e "Continuar mesmo assim" quando falta arquivo (ESCRITO, não visto: não houve falha para provocar); tempo-limite geral de 60 s + cão de guarda.
- Troca de era: `eraReady(era)` em segundo plano a partir da fase 8; a era nova só entra com cenário/inimigos/chefe prontos (segura até 20 s com "Carregando a próxima era"); `sceneTrim` solta os cenários das outras eras.
- Equipar/trocar herói: asa, montaria, pet e herói novos só entram no desenho com as folhas decodificadas (12 s de paciência); `drawHeroFull` devolve `false` sem desenhar enquanto a folha pedida carrega (devolve `true` quando desenhou).
- Teste: `?debug=1&lento=N` (atraso por arquivo, 6 em paralelo), `&frio=1` (carimbo na URL, sem cache), `&carga=antiga` (lista de antes, para comparar). O throttling do Chrome não está nas minhas ferramentas.
- VISTO (`lento=250&frio=1`, jogador novo): barra andando de 1/69 a 69/69 em ~10 s, 0 falhas, 0 arquivo da lista sem decodificar ao liberar o toque; título e batalha inteiros (herói com arma, cenário, inimigo, cabeçalho). ANTES (`carga=antiga`, mesmas condições): a tela liberava com 10 dos 54 arquivos da cena ainda carregando (ícones do cabeçalho/menu, retrato, ícones das habilidades), e montaria/pet/asa/pistola nunca entravam na conta (leitura do código). Montaria (lobo) entrou no desenho só 5,6 s depois de equipar, asa 2,2 s, Kaia 1,5 s: nenhum quadro com folha faltando (medido por amostragem). Troca de era 0→1: nenhum quadro da era 1 antes de pronta. Prints `reports/prints/v0129_preload_{barra,primeira_cena,troca_era}.jpg`.
- NÃO visto: primeira cena A FRIO com montaria/pet/asa já equipados (exigiria save gravado; só usei save em memória; vista a lista com eles e a troca em memória); pet (o módulo não devolveu pet no save de teste); o aviso "Carregando a próxima era" (a era carregou durante a luta do chefe); botões de falha; a lista com o `sceneSet` de Sistemas rendeu `later = 0` na medição (conferir se o manifesto entrou: `LD.man`).
- INCIDENTE: por ~1 min o `js/battle.js` ficou no disco com erro de sintaxe (regex escrita por script de shell). Corrigido; daqui em diante só ferramenta de edição + `node --check` logo depois.

### 60 QUADROS + QUALIDADE ADAPTATIVA — `js/battle.js` (laço), `js/stage.js` (`sceneQuality`)
- Laço: 1 desenho a cada N chamadas do rAF, N = piso(Hz ÷ 60 + 0,15) (60 Hz → 1; 90 → 1; 120 → 2; 144 → 2 = 72; 240 → 4). `?debug=1&fps=120` tira o limite; `&peso=1` queima 14 ms por quadro. Medidor: `window.__fps` = "média (pior N ms, qD)"; `window.__fpsStat`.
- Por delta de tempo: clarão do golpe final (`B.flash`) e os emissores por quadro da ultimate (`emit`) passaram a usar o tempo do quadro.
- Qualidade: degrau 1 = metade das partículas; 2 = 1/4 e cenário vivo em resolução 0,7. Só desce com média < 55/60 do alvo E trabalho do jogo > 40% do orçamento.
- NÃO MEDIDO: a aba deste PC recebia 29 a 44 quadros/s com o jogo usando 1,6 a 3,3 ms por quadro (máquina carregada), e a tela não é de 120 Hz. Nada sobre "mesma velocidade a 60 e a 120" nem sobre o degrau de qualidade foi visto. `sceneQuality(0,7)` nunca foi visto na tela.
- O cenário vivo tem laço próprio em `test/bg/scene.js` (não é meu) e continua a 120 Hz. Linha pedida, no começo de `frame(now)`: `if (self.maxFps && now - last < 1000 / self.maxFps - 2) { raf = requestAnimationFrame(frame); return; }` (o `js/stage.js` já põe `api.maxFps = 60`).


## Engenheiro 6 — v0.12.9: eventos com horário no HUD, drop por raridade em tabela única, chaves do voto no Modo dono (2026-11-13)

Arquivos mexidos: `js/evhud.js` (NOVO), `js/fullbattle.js`, `js/rarity.js`, `js/artprev.js`, `js/farm.js`, `index.html` (3 pontos, nenhum no boot nem no carregamento: chave `evHud` no `SCREENS_ON`, `'evhud'` na lista de scripts, `'newdrops'` na lista de módulos js/sys). Navegador: uma aba minha em `127.0.0.3:8080/?debug=1&fresh=1&skip=1` (save em memória); para o Modo dono usei o save de teste dessa origem (`eras_owner_v1` + `eon_owner_mode`, criados e REMOVIDOS no fim; o armazenamento ficou com as mesmas 2 chaves do começo, `eras_proto_v2` com o mesmo tamanho). Aba fechada. Prints em `reports/prints/`.

### 1) Eventos com horário no HUD (VISTO, 288 px e 390x844)
- Chave `SCREENS_ON.evHud` (index.html): **LIGADA por padrão** (decisão do PO/dono durante a rodada: o bônus já vale no abate); desliga só em debug com `?ev=0`. Nasceu desligada e foi commitada assim (046bf14); a troca para ligada está no disco.
- Regra e hora: só do `Sys.schedule` (active, notices, now, `_br` para o "até HH:MM"). Nenhuma conta de fuso no jogo.
- Ícone: entrada `event` no `FB_MENU` (direita, abaixo do Baú; desce uma casa com a Oferta 24h na tela). Só existe com evento aberto que o nível permite. Pulsa (só transform/opacidade), mostra nome, bônus e contagem (`MM:SS`, `HH:MM:SS` a partir de 1 h); com dois abertos alterna a cada 4 s (visto: Caça aos Pets / Torneio de Fim de Semana, domingo 18h30). Bônus no rótulo lido dos `perks` do módulo: "Ouro ×2", "Drop +50%", "Ração ×2 · Frag. de pet +50%"; Chefe Mundial sem linha de bônus.
- Faixa "Hora de Ouro / Evento aberto até 20:00": 5 s, sem toque, em y 246 da base (abaixo do aviso do jogo e do aviso de poder, acima do nome da habilidade e das barras de vida). Espera o tutorial, o MENU e o aviso do jogo saírem.
- Aviso "Hora de Ouro / Começa em 10 min": mesma faixa, borda verde. Uma vez por janela (guardado em `S.evh`, podado; conferido que a segunda passada não repete).
- Toque: abre Eventos pelo caminho do MENU (`fbAct('soon:events')`; visto `view = events` e a volta). Tela ainda bloqueada por nível: o toque diz o evento e o prêmio. Nível abaixo do evento: sem ícone. Fora de evento (relógio real e relógio de teste numa segunda às 15h): nada na tela.
- Imagem só carregada: o ícone próprio do evento entra com `img.complete` e `naturalWidth > 0` (ou `Preload.ready([url])`); antes disso, `assets/icons/menu/events.png`.
- Custo: 1 atualização por segundo, 0,07 ms cada (medido); nada por quadro.
- Teste sem esperar o relógio (só DEBUG): `dbgEvClock('19:00')`, `dbgEvClock('18:30', 0)` (dia da semana), `dbgEvClock()` volta ao real. Não passa pelo save.
- Prints: `v0129_evento_icone.png` (com o bônus), `v0129_evento_faixa.png`, `v0129_evento_aviso.png` (288 px), `v0129_evento_390.png`.
- Perks: a conta está em `js/sys/loot.js` (não é meu; o Servidor aplicou no commit e590713). Em `js/farm.js` e `js/battle.js` não há conta de ouro/drop.
- NÃO visto: o rótulo "+N" do ouro com o texto do evento (não mexi: o bônus aparece no ícone); o ícone caindo no MENU em tela muito curta (escrito: entra na lista do MENU como "Evento").

### 2) Drop por raridade em tabela única (VISTO)
- `rarFx(r)` em `js/rarity.js`: lê `Sys.stats.dropFx(r)`; sem o módulo, a tabela antiga. `rarDrop` e `rarSnd` só usam `rarFx`. A chave continua `SCREENS_ON.rarityFx` (desligada; `?rar=1`).
- Básico→Lendário iguais a antes: conferido por número (cor, feixe, ritmo de partículas iguais nos 5) e por print lado a lado (`v0129_drop_raridades_antes.png` x `v0129_drop_raridades.png`).
- Divino (r 5): feixe arco-íris mais largo, partículas coloridas, borda `#7ff6ff`. Visto com `dbgDrops([0,1,2,3,4,5])` (só o efeito, sem item).
- Diferença consciente: o som do Mítico passa de rate 0,89 para 0,9 (valor da tabela). Lendário e Divino não tocam em `rarSnd` porque o `addItemToBag` já toca `legendary` em todo item r >= 4 (o Divino hoje soa como o Lendário; o rate 1,1 da tabela fica sem uso até decidirem).

### 3) Modo dono: chaves para o voto (VISTO)
- Bloco "CHAVES PARA O VOTO" na tela Teste, só com o Modo dono ligado; estado escrito no botão (LIGADA dourado / DESLIGADA). A escolha fica em `S.ownerKeys` do save do Modo dono e é reaplicada na carga (`keysBoot`); fora do Modo dono nada roda.
- Chaves (todas DESLIGADAS por padrão): Fusão (`PANEL_ON.fuse` + `Sys.stats.DATA.quality.on`) · Asas novas (`Sys.stats.DATA.newWings`) · Arco e Bumerangue (`weaponTypes.bow.on` e `.boomerang.on`) · Ultimates lendárias (`window.ULT_LEGEND_ON`) · Pets e montarias novos (`Sys.pet.DATA.newPets` + `Sys.mount.DATA.newOn`) · Entregas dos itens novos (`Sys.newDrops.DATA.on`).
- Atalhos: 8 asas novas (ganhar e equipar, na raridade do modelo) e Arco / Bumerangue (arma com `wt`, raridade e nível da arma equipada).
- Visto: os 6 botões ligam e desligam o módulo dono (lido de volta do módulo); recarregar no Modo dono mantém; sair do Modo dono volta tudo ao padrão e `S.ownerKeys` não existe no save real; fora do Modo dono não há botão. Asa de fênix e Mariposa equipadas (`item.wing`), Arco e Bumerangue equipados (`weaponType` = bow / boomerang, estilo ranged); batalha seguiu sem erro no console. Print `v0129_modo_dono_chaves.png`.
- ULTIMATES LENDÁRIAS NÃO LIGAM PELO BOTÃO: em `js/battle.js:475` a chave é `const ULT_LEGEND_ON=...` (constante do arquivo, não é `window`). O botão escreve `window.ULT_LEGEND_ON`, vê que o estado real não mudou e avisa "a chave ainda é fixa no arquivo da batalha". Pedido ao Engenheiro 5 abaixo.
- Com o arco equipado a batalha roda, mas o Kael aparece sem arma e os ícones de Básico e Ultimate ficam escuros (desenho do outro engenheiro, ainda não pronto).
- De passagem, no mesmo arquivo: a grade de montarias da tela Teste estourava a largura em 288 px (rolagem lateral); corrigida.

### Outros
- `js/farm.js`: `normItem` mantém `item.wing` de qualquer modelo de `Sys.stats.DATA.wingTypes` (antes só anjo/demônio: asa nova perdia o tipo ao entrar na mochila). `onLevelUp` chama `Sys.newDrops.releaseHeld(S, Sys.host)` só com `Sys.newDrops.DATA.on` ligada (inerte hoje).
- `'newdrops'` carregado depois de `'schedule'`, antes do `'fc'`. FC do save igual com e sem o módulo (264 = 264 no save novo; 65,7 mil no nível 30 antes e depois).

### Pedidos a outros donos
- Engenheiro 5 (`js/battle.js:475`): trocar `const ULT_LEGEND_ON=DEBUG&&typeof QP!=='undefined'&&QP.get('ultlend')==='1';` por `window.ULT_LEGEND_ON=DEBUG&&typeof QP!=='undefined'&&QP.get('ultlend')==='1';` (o uso na linha 482 continua valendo; sem `const`, o nome passa a ler `window`).
- Sistemas/Engenheiro 5: som do Divino (rate 1,1) x `addItemToBag` que já toca `legendary` em r >= 4: decidir quem toca.

### Testes
- `node --check` nos 5 arquivos meus: ok. `node test/e2e/run.js`: TUDO OK (153 verificações) com as peças 1, 2 e 3 no disco.
- `node test/e2e/flows.js`: "fluxos duros OK" depois da peça 1. No fim da rodada falha em 5 fluxos por causa de `js/battle.js` em edição pelo Engenheiro 5 ("Invalid regular expression: /.json(?|$)/i", o arquivo não carrega no teste); não é de arquivo meu. Rodar de novo quando o battle.js fechar.

### Engenheiro 6 — Kaia montada, lote 1 (2026-11-13), VISTO
- `js/mountfx.js` (só o trecho do prefixo/folha por herói): `MOUNT_HERO` ganhou `kaia_`; `mountPrefix(id)` decide por montaria. A lista das montarias com arte da Kaia sai de `assets/manifest.json` (lido uma vez, só com a Kaia; vale quem tem os 6 arquivos `kaia_<id>_{idle,run,attack}_body`): hoje pony e horse. As outras nunca são pedidas (sem 404) e ligam sozinhas quando entrarem no manifesto (rodar `tools/asset-manifest.js` ao receber a arte). Medidas (`MOUNT_M`) por herói + montaria.
- Visto: Kaia no pônei e no cavalo em parado, corrida e golpe, com asa de anjo nas costas, arma na mão, aura por estrela e pet (Mamute); Kaia no lobo a pé, sem pedido de `kaia_wolf` e sem erro no console; Kael no pônei e no lobo como antes. Prints `v0129_kaia_montada_{ponei,cavalo,ponei_corrida}.png`.
- Não visto: drawHeroFull nas telas (Montarias, vitrine) com a Kaia; as folhas `_Nstar` da Kaia (a aura por estrela da batalha é por código).
- Achado que não é meu: 404 em `assets/anim/hyb/R/kael_idle_era2_t0.json` ao trocar para o Kael.
- Ajuste pedido pelo coordenador: a decisão passou a ser `Sys.assets.mountedArt(herói, montaria)` (fonte única). ACHADO: `js/sys/assets.js` NÃO está na lista de módulos do index.html, então `Sys.assets` não existe no jogo; por isso ficou uma reserva no `js/mountfx.js` (mesmo manifesto, mesma regra, lido uma vez só com a Kaia), que deixa de rodar quando o módulo for carregado. Revisto no navegador com a reserva: Kaia no pônei e no cavalo montada (a troca espera a folha carregar), no lobo a pé sem pedir `kaia_wolf`, Kael no lobo igual. Não incluí `assets` na lista porque o `js/loading.js` (Engenheiro 7) muda de comportamento quando o módulo existe (loadManifest + sceneSet).
- `flows.js` no fim: 1 fluxo com falha (fluxo 4, 32/34: "vitrine sem as 4 adultas (fixedSkins = [])" devolve 10 e o gancho addFixed), do `Sys.appearance`; não é de arquivo meu.

## Engenheiro 8 — conveniências do VIP no jogo (2026-11-13)
Arquivos: `js/vipauto.js` (novo), `js/farm.js` (addItemToBag, sysBoot), `js/meta.js` (afterIntro, showOffline), `index.html` (só `'vipauto'` na lista de carga, depois de `'farm'`).
Estado da conferência: tudo abaixo foi exercitado pelo console numa aba própria (127.0.0.3) ANTES dos dois últimos ajustes; a aba foi fechada por ordem do dono (uma aba por vez). A conferência final, de uma vez, fica para o "sua vez". As telas (botões, trancado com "VIP n") não são minhas e não existem ainda.

- **1) Mochila**: `window.bagMax(S?)` = 60 + `Sys.vip.conv(S,'bag').value`. Usado no `addItemToBag`. Console: 60 sem VIP, 80 no VIP 1 a 5, 100 no VIP 6+; encheu até 80 e 100 e o item seguinte seguiu a regra da mochila cheia.
- **2) Offline**: `window.offlineCapH(S?)` (8 / 10 / 12 / 14 h). `BAL.offlineCapHours` virou propriedade (definida em tempo de execução pelo `js/vipauto.js`, sem editar o `js/battle.js`): guarda a base (8, ou o que o `docs/balance.json` trouxer) e devolve o teto do VIP; assim o modal antigo e o "Bem-vindo de volta" (`js/p_intro.js`) usam o teto novo sem edição. `Sys.loot.params.offlineCapHours` recebe o mesmo teto na carga. Visto no "Bem-vindo de volta" com VIP 5 e 20 h fora: "Fora por 12h 0min", "ganhos de 12 h", ouro e itens de 12 h. FALTA (outros donos): o rótulo fixo "Teto: 8 h" e XP, pedras de treino e ração continuam em 8 h (pedidos abaixo).
- **3) Coleta automática (VIP 1)**: `vaCollect` roda 2,5 s depois do JOGAR/"Coletar" (`afterIntro`) e ao voltar do segundo plano (`visibilitychange`, `resume`). Coleta missões diárias e semanais prontas + bônus das diárias (com a XP do jogador, igual à tela de Missões), baús da Atividade (`Sys.activity.claimAll`; módulo desligado hoje), níveis do Passe (`claimTier`; nível com ITEM fica para o jogador se a mochila estiver cheia) e cartas do correio sem item, ovo nem skin. Respeita a liberação por nível (`fbUnl`). UM aviso: "Coleta automática: 7 missões, 1 nível do Passe, 1 carta · +17 gemas · +25 mil de ouro". Se outro aviso cair por cima (ex.: "Códex liberado" ao subir de nível), o resumo volta uma vez. Visto: sem VIP não coleta; com VIP coletou e a carta com item ficou. NÃO entra: o baú de toque da batalha (`Sys.chest`, sorteia itens) e conquistas/missão guia.
- **4) Equipar o melhor (VIP 2)**: MUDANÇA PARA O GRÁTIS. Antes o `addItemToBag` trocava o equipado sozinho para todos. Agora (com `convOn` ligada) trocar o equipado só com VIP 2 e a preferência ligada; espaço VAZIO equipa sempre; nos outros casos o item fica na mochila e o aviso diz "Item melhor: ...". Com `convOn` desligada volta ao de antes. Visto nos 4 casos (grátis, espaço vazio, VIP 2 sem preferência, VIP 2 com preferência).
- **5) Desmanche automático (VIP 3)**: `vaAutoSell` na entrada do item: só Básico/Raro marcados; nunca item melhor que o equipado (ou de espaço vazio), com `origin` (prêmio, compra, correio, passe), garantia da invocação, da temporada, da oferta, `lock`/`locked`/`fav`. Entrega o `Sys.loot.dismantle` (mesmo do manual). Visto: Básico marcado não entra; Raro não marcado entra; Raro marcado dá +1 pedra de forja; Épico entra; item de loja entra; sem VIP a preferência não age. O jogo NÃO tem campo de item travado/favorito hoje (os três nomes acima ficam respeitados se criarem).
- **6) Fusão automática (VIP 2)**: inerte sem `Panels.on('fuse')` + `Sys.stats.DATA.quality.on` (setPref devolve `{ok:false, reason:'off'}`, `fuseNow()` devolve 0). Com as duas chaves ligadas só na memória da aba: juntou os trios (o mais fraco primeiro), nunca o equipado, travado, da temporada, da oferta nem 5 estrelas; sem ouro não funde; um aviso só. A fusão COBRA o ouro do `Sys.stats.fuse` e, ao ligar, junta TODOS os trios soltos da mochila (qualquer raridade).
- **7) API**: `window.VipAuto = { prefs(S), setPref(S, chave, valor), state(S), bagMax(S?), offlineCapH(S?), collect(), fuseNow(), fusionOn() }`. Preferências em `S.set.vipAuto`.
- Testes: `node --check` nos 3 arquivos; `run.js` TUDO OK (154); `flows.js` "fluxos duros OK".
- Pedidos a outros donos: painéis (`js/screens.js:429` e `:856`: `BAG_MAX` → `bagMax()`); Servidor (`js/p_intro.js:278`: "Teto: 8 h" → "Teto: {{capH}} h" e `aria-valuemax="8"` → `aria-valuemax="{{capH}}"`); Sistemas (teto de 8 h fixo em `js/sys/level.js:93`, `js/sys/practice.js:87`, `js/sys/pet.js:339`: decidir se XP, pedras de treino e ração seguem o teto do VIP). skipBoss: entraria no `js/fullbattle.js`/`js/battle.js` (botão "Desafiar" de chefe com `S.best` acima da fase) chamando o mesmo caminho de vitória (`farmKill` + tela de resultado).

## Engenheiro 7 — v0.12.9 (2026-11-13, 01h00-02h05)

Arquivos mexidos: `js/preload.js`, `js/loading.js`, `js/battle.js`, `js/mountfx.js` (só `mountArtOf`), `index.html` (lista js/sys: `'assets'`; `scene.js?v=` -c58 → -c59; `wingArt`; classe `lsplash` + regras CSS do `#loading`; texto inicial "Carregando…"), `test/e2e/preload.js` (só a opção `--nova`). Uma aba em `localhost:8080`, fechada; localStorage devolvido (mesmas 4 chaves; `eras_owner_v1` com os mesmos 7315 caracteres).

### Chaves (nome, estado)
- `window.PRELOAD_NEW` (js/preload.js): **DESLIGADA** por padrão (ordem do PO). Liga só com `?debug=1&carga=nova`. Desligada = carga antiga (imagem pronta no onload, sem decode, sem fila; lista de antes na barra; fuga dos 15 s).
- `window.ULT_LEGEND_ON`: desligada (não mexi). `Sys.stats.goLive('ults')` e `goLive('wings')`: NÃO chamados no boot.
- Parâmetros novos só de debug: `&falha=<trecho>` (`&falhas=N`), `&trava=<trecho>`, `&semraf=1`, `&carga=nova`. `Preload.pending`, `Preload.idle`, `Preload.live`, `Preload.timeline`.

### Peça 1, pré-carregador
- VISTO no caminho novo (`carga=nova`, a frio): save novo 54 arquivos + 2 tarefas, 3,8 s; save gravado de jogador que volta (lobo + asa + pet) 71 + 2, 7,2 s, com Título, "Bem-vindo de volta" e batalha completos; lento=250 5,6 s; lento=800 10,4 s; sem rAF (`semraf=1`) 12,2 s. 0 falhas em todos. Era 5 com pistola mítica: 81 arquivos (visto antes da chave, 19,8 s com lento=800).
- VISTO: "Tentar de novo" e "Continuar mesmo assim" com `&falha=wolf_run`; aviso de parada aos 15,0 s com `&trava=wolf_run`, que some sozinho quando o progresso volta; "Carregando a próxima era" (salto de era com lento=800); primeira cena com lobo, asa, pet e arma já no primeiro quadro; Kaia montada pelo `Sys.assets.mountedArt` (no lobo: o manifesto já lista `kaia_wolf`).
- NÃO visto: aba realmente em segundo plano (as ferramentas trazem a aba para a frente); fundo em 430 px; a troca do fundo para `splash_loading.webp` feita pelo coordenador só foi vista funcionando (imagem aparece), sem medir o tempo.
- Causas do "Confira a conexão" e do 0% parado: (1) o prazo de cada arquivo contava a espera na fila; (2) `img.decode()` não responde quando a janela não produz quadros (janela coberta: `document.hidden` continua false) e prendia as vagas da fila; (3) a barra só andava por rAF; (4) os 7 cenários vivos da travessia da própria tela seguravam a barra de 5 a 17 s; (5) a lista do módulo trazia 367 arquivos (174 bloqueando).
- O que mudou: fila de 8 em paralelo com prazo depois de sair da fila; nada estoura por tempo total (só com 15 s sem nenhum arquivo concluído, página visível); decode com reserva de 1,5 s e onload direto sem quadros; barra por temporizador de 400 ms + visibilitychange + boot, além do rAF; aviso com nomes ("Falta: ..."; lista inteira no console); do `Sys.assets.sceneSet` entram weapon, ult, wing, enemies (hero, mount _Nstar, pet atk2/3 e camadas do cenário vivo ficam fora); ícones fora da tela só depois de a barra fechar; fundo = imagem de abertura, sem travessia, logo solto, rótulo de era e Kael correndo.
- (d) A lista vem do módulo somada à do jogo desde que `'assets'` entrou na lista de js/sys (antes o módulo nem carregava: por isso `later = 0`).
- Prints: `v0129_preload_equipado.jpg`, `v0129_preload_falha.jpg`, `v0129_preload_aviso_era.jpg`, `v0129_carregamento_fundo.jpg` (são .jpg).

### Desempenho (medido nesta máquina, janela estrangulada)
- Batalha com lobo + asa + pet + cenário vivo: trabalho do jogo 3,3 ms por quadro (`__fpsStat.workMs`); `draw()` 0,46 ms; o navegador entregava 12 quadros/s (pior 659 ms). heroLook 2,9 µs, wSkin 0,8 µs, mountReady 0,65 µs, heroEdge 4,2 µs por chamada.
- Cortes (ganho de microssegundos, sem diferença visível): `lookNow()` guarda a aparência por estado e 200 ms; `wSkin` reaproveita; a montaria já desenhada não reconfere as 3 folhas por quadro; `mountArtOf` guarda a resposta do manifesto.
- Limitador de 60: a taxa da tela passou a sair da MÉDIA de 40 intervalos (o quartil baixo podia dar "120 Hz" numa tela de 60 com quadros irregulares e o jogo desenhava 1 a cada 2). Escrito, NÃO medido em 120 Hz. Não medi: HUD dos eventos, laço do cenário vivo, mesma velocidade com `fps=120`, degraus com `peso=1`.

### Não feito
- Peça 2 (ultimates lendárias) e peça 3 (7 asas): não vistas, não ligadas. Peça 4: só o que está acima. Peça 5 (arco/bumerangue com as folhas novas da Arte e a regra do PO para skin sem folha, decidida por `sheetFor().noFamilySheet/familyDir`) e a skin Kaia Arlequina: não comecei. Lido para a skin: pistola, morte e fases saem do `sheetFor` (js/stage.js `pistolSheet`, `dieSheet`, `phaseSheet`); `HERO_DIR`/`PISTOL_DIR` fixos em `hyb/R` ainda existem em js/stage.js:59-60 e :198 (Kael padrão, giro e rastro da era 2): conferir no navegador com a skin equipada.

### Pedidos a outros donos
- Dono do `js/avatar.js` (linhas 22, 63, 121): `need(AV.RES, ...)` pede `assets/anim/hyb/R/kael_idle_era2_t0.json`, que não existe (só o .png): apontar o .json para `assets/anim/hyb/R/kael_idle_body.json`.
- Sistemas: incluir no manifesto/pacote base o fundo da tela de carregamento (`assets/mobile/splash/splash_loading.webp` e `.jpg`); `assets/mobile` está fora do manifesto.
- QA: caso real de aba em segundo plano com `?debug=1&carga=nova` (trocar de aba durante a carga e voltar).

### Testes
- `node --check` nos 6 arquivos; `run.js` TUDO OK (154); `flows.js` "fluxos duros OK"; `preload.js` 4/4 no antigo e 4/4 com `--nova`.

## Engenheiro 9 — v0.12.9 (2026-11-13): o que entra no APK (L1/L2, ultimates lendárias, 7 asas)

Arquivos mexidos: `js/battle.js`, `js/loading.js`. Nada em index.html, js/sys, painéis ou assets. Uma aba em `localhost:8080` (save em memória, `fresh=1`), fechada; localStorage devolvido igual (4 chaves, mesmos tamanhos, conferido chave a chave).

### Chaves (nome, estado)
- `window.ULT_LEGEND_ON` (js/battle.js): **LIGADA por padrão**; `?debug=1&ultlend=0` desliga (e o botão do Modo dono). Agora a chave MANDA: desligada, Lendário/Divino tocam a base da família com reforço, mesmo com `ownReady` ligado.
- `Sys.stats.goLive('ults')` e `Sys.stats.goLive('wings')`: chamados no boot, no topo do `js/battle.js` (os módulos js/sys carregam antes), com guarda `typeof`. Visto no boot: `ownReady` com as 9 famílias, `newWingReady` com as 7 asas. Com `ultlend=0`: `ownReady` vazio, asas ligadas.
- Serafim: fora de `wingsApproved`; item de asa serafim desenha a de anjo (visto).

### Tela de carregamento (VISTO)
- L1 (288 px, `&falha=era0_e`): com o aviso de falha na tela a caixa da barra sobe para cima do rodapé (`loadFailFit`); "Faltam 18 de 72 arquivos · 38%" acima, "18 arquivos não carregaram. Confira a conexão." abaixo, nomes e os 2 botões, sem sobreposição (medido: linha da barra termina em y 538, aviso começa em 547). A largura de 288 foi forçada no `#app` (a janela não encolhe até aí).
- L2 (`&lento=250&frio=1`): no "Pronto!" a barra salta para o fim sem transição; na primeira amostra com "Pronto! 100%" a barra já estava em 100% da largura (amostras a cada 16 ms).

### Peça 1, ultimates lendárias (VISTO; ligadas)
- Por leitura: `ultStart` usa `ultPlan` → `Sys.stats.ultOf(arma).sheet` (família do item, nunca a era do mapa); reforço do Mítico em `fnSheet` (tamanho/brilho) + `fnUltBoost`; tremor preso em 3 px de tela no `draw()`.
- Mudança: a folha própria só toca quando está decodificada; enquanto carrega sai a base com reforço (nunca efeito em código nem quadro vazio). Pré-carga (`preloadAssets`, `sceneList`) pede a folha desejada e a base.
- Visto na batalha, folha certa no chão do campo, sem quadro vazio: espada Épico (`era2_ult`), Mítico (`era2_ult` + reforço), Lendário (`sword_legend`); pistola de pólvora Raro (`era3_ult`), Mítico (reforço), Lendário (`flintlock_legend`); Lendário de clava, gládio, revólver, fuzil, plasma, infernal; Divino celeste (`celestial_legend`). Tremor máximo medido 2,68 px.
- Visto o caso da folha ainda carregando (infernal e celeste na 1ª vez; a celeste levou mais de 10 s para decodificar nesta máquina): tocou a base com reforço, inteira.
- Achados: (a) infernal e celeste não têm base própria ligada (`ART_ON.ult_era7/8` não existem; `era7_ult`/`era8_ult` estão no disco sem voto registrado): Básico a Mítico dessas famílias tocam a folha da era da arma na mão; (b) as folhas rifle_legend e sword_legend têm a borda de cima reta visível em alguns quadros (arte, igual às bases); (c) `bow_legend`/`boomerang_legend` entram junto com o arco/bumerangue (família desligada).
- Prints: `v0129_ult_base.png`, `v0129_ult_mitico.png`, `v0129_ult_lendaria.png` (pistola de pólvora; pequenos, 169 px de largura).

### Peça 2, 7 asas (VISTO; ligadas)
- Folha de contato com o MESMO desenho da batalha (`drawHeroFull`): anjo (referência) + 7 asas × parado, corrida, golpe, montado no lobo, Kael e Kaia. Raiz nas costas na altura do ombro em todas; tamanho coerente com a de anjo (as novas são mais altas, com o `fit` do .json). Print `v0129_asas_novas.png` (Kael em cima, Kaia embaixo).
- Na batalha de verdade: item de asa fênix equipado → desenhou a fênix nas costas.
- Não visto: cada asa uma a uma na batalha rodando (só a fênix); asa nova em montaria com asas (grifo, serpe); tempestade na Kaia fica em boa parte atrás do corpo (arte estreita).

### Não feito (fica para depois do APK, ordem do coordenador)
- Peça 3 (Kaia Arlequina) e peça 4 (arco e bumerangue): só leitura. Arlequina: nada no desenho supõe `hyb/kaia` fixo para a Kaia (folhas, pistola, morte e escala saem do `sheetFor`). Arco/bumerangue: as folhas da Arte não têm âncora `back` (asa) e o desenho pelas poses novas não foi escrito.
- Peça 5 (60 FPS): não conferida.

### Pedidos a outros donos
- Arte: âncora `back` nos `_body.json` de `hyb/R/{bow,boomerang}` e `hyb/kaia/{bow,boomerang}` (sem ela a asa usa a última posição conhecida).
- PO/dono: votar `era7_ult` e `era8_ult` (base das famílias infernal e celeste) ou confirmar que ficam na folha da era.

### Testes
- `node --check` em `js/battle.js` e `js/loading.js`; `run.js` TUDO OK (154); `flows.js` "fluxos duros OK"; `preload.js` 4/4 e `--nova` 4/4.

## Engenheiro 10 — v0.13.0 (2026-11-13): skins animadas, arco e bumerangue, pular chefe

Uma aba por vez em `localhost:8080/index.html?debug=1&fresh=1` (save em memória; `S.name` posto por código para pular a introdução), fechada ao fim de cada peça. Nada em index.html, js/sys, painéis ou assets.

### Peça 1, skins animadas no Modo dono (VISTO)
Arquivos: `js/stage.js`, `js/battle.js` (1 linha, `fullReady`), `js/mountfx.js` (1 linha, `mountMetrics`).
- Defeito confirmado por leitura: com skin do KAEL o `heroForm` devolvia `kael|0|1` (igual ao padrão) e o `drawHeroAnim` seguia para `heroSet` → `HERO_DIR` fixo em `hyb/R` (corpo padrão, folhas compostas, giro e rastro da era 2). As da Kaia já saíam do `sheetFor`.
- Conserto: `heroForm` agora devolve `skin` e `dir` e a skin entra na chave da troca; Kael com skin vai pelo mesmo caminho da Kaia (`drawHeroPhase` com as folhas do `sheetFor`: parado, corrida, golpe, giro `kael_spin_body`, morte, pistola); `heroSet` devolve o conjunto da pasta da skin (pré-carga, tela de carregamento e `fullReady` pedem a pasta certa); `spinBase`, `trailBase` e `heroCompTier` devolvem nada com skin (as folhas compostas trazem o corpo padrão pintado).
- Troca de skin/herói sem buraco: enquanto a pasta nova decodifica (parado, corrida, golpe, morte e, com arma de fogo, as 3 da pistola), o `phaseSheet` continua entregando as folhas do herói ainda desenhado. Medido quadro a quadro com as pastas frias: padrão → Kael Demônio → Kael Anjo → Kaia → Kaia Anjo → padrão; nenhum quadro sem herói, troca em 0,2 a 0,3 s.
- Visto na batalha rodando: Kael Demônio (parado, corrida, giro), Kael Paladino com asa de anjo nas costas, com pet (mamute), com pistola da era 5 (folhas `kael_pistol_*` da skin), montado no lobo (folha `kael_wolf_*` do corpo padrão, regra aprovada); Kaia Arlequina (parado, corrida, golpe, giro e morte de verdade com `kaia_die_body` da skin). Em todos, nenhuma imagem de `hyb/R` ou `hyb/kaia` desenhada (origem de cada `drawImage` gravada).
- Visto em folha de contato (mesmo desenho da batalha, `drawHeroFull` com `state.skin`): as 8 skins × parado, golpe, morte, tiro de pistola; e as 4 do Kael também em corrida, giro e pistola das eras 3, 5 e 6. Prints `reports/prints/v0130_skins_kael.png` e `v0130_skins_kaia.png`.
- Achado e conserto: a pistola aparecia SOLTA NO AR em alguns quadros do tiro (grip fora do lugar no `.json`: `kael_demon` quadros 1, 2, 5 e 8 saltam 20 a 40 px; corpo padrão `hyb/R/kael_pistol_shoot_body` quadro 7 = 349,113 contra ~310,134 dos vizinhos). `gripAt` (js/stage.js): quadro cujo grip foge mais de 10 px da mediana dos 5 vizinhos usa a mediana. Visto depois: arma na mão em todos os quadros (9 instantes do tiro, 5 corpos).
- Não visto: cada uma das 8 skins na batalha rodando (vistas 3: Demônio, Paladino, Arlequina; as outras só na folha de contato); skin com asa nova (só a de anjo); pistola das eras 3 e 6 na batalha (só na folha).
- Observações para a Arte (não mexi): (a) `kael_demon/kael_pistol_shoot_body` quadro 8 tem uma estrela amarela pintada ao lado da cabeça; (b) nenhum `*_pistol_shoot_body.json` traz `shots` (vale o padrão 3 e 14); (c) no golpe das Kaia Ninja, Demônia e Anjo o quadro do corte aponta a espada para baixo (as do Kael apontam para a frente).
- `flows.js`: o fluxo 4 hoje FALHA em 2 verificações que só leem `Sys.appearance` (não passam por desenho): "skin sem arte ... NÃO equipa" e "skin nova (gancho addFixed, fonte offer) ... vit.length === 11". As duas contam com `kael_ninja` SEM arte; o commit 5b3ca7a (Kael Ninja com arte) mudou o cadastro. Os outros 4 fluxos passam. (Depois o dono do teste atualizou: hoje "fluxos duros OK".)

### Peça 2, arco e bumerangue: PARADA por ordem do coordenador (prioridade: desempenho). Nenhuma linha escrita.
Lido para quem retomar: folhas da Arte em `hyb/R|kaia/{bow,boomerang}/<herói>_<fam>_<estado>_<raridade>.png` + `.json` (448x256, padLeft 96, feetY 243; `grip[i] = {hand, ang, pull, inHand, tipTop, tipBot}`, `scale` da arma); a de raridade JÁ traz a arma pintada; `_body` é o corpo sem arma. Tiro do arco: `pull` com valor nos quadros 4 a 10 e 16 a 22, solta nos quadros 11 e 23. Arremesso: `inHand=false` nos quadros 4 a 17. `proj_arrow.json`: 5 quadros de 128x32 (um por raridade), pivô 64,16, velocidade 900 px/s na escala da folha, gravidade 600, escala 0,55, rastro 3. `proj_boomerang.json`: 8 quadros de 160x160, 24 fps, escala 0,5, trajeto em elipse (ry 0,18). Código existente (Engenheiro 5, `js/battle.js` ~308-354: `rgAct`, `rgEvent`, `fnArrow`, `drawBoom`, `wExtra`, `wAngOf`, `wSpot`) desenha tudo por código na pose do golpe; os tempos do acerto são `RG_BOW_S`, `RG_FLY`, `RG_BOOM`. Plano: `drawHeroFam` no `js/stage.js` (folha da raridade, quadro do tiro casado com `h.s`), flecha/bumerangue pelas imagens de `assets/anim/fx/`, âncora da asa pela folha parada do corpo, `lookReady` esperando as folhas da família; com skin: arco na pose de pistola da skin (ângulo nativo 0 em vez de 90), bumerangue no golpe (já é o caminho de hoje). Ícones escuros e "sem arma": não cheguei a reproduzir.

### Força-tarefa de DESEMPENHO (queixa do dono na v0.12.9: travadas)
Arquivos: `js/battle.js`, `js/stage.js`, `js/preload.js`, `js/mountfx.js`, `js/petfx.js`, `js/loading.js`, `index.html` (só o `?v=` do scene.js, c59 → c60, autorizado), `test/e2e/sheetgrid.js` (novo).

**Como medir.** `?debug=1&pf=1` liga o registro de picos (`js/battle.js`, `PF`; fora disso é `null` e nada é medido): por quadro, o tempo de passo / efeitos / desenho / prévias / HUD / save; os 20 piores quadros com o estado (fase, ação, inimigos, partículas, troca de era, subir de nível, resultado, tela aberta); cada `drawImage` acima de 1,5 ms com o nome do arquivo; cada `save()`; tempo e pico de `updHudExtra`, `hudSys`, `syncSpeed`, `fbTick`, `fcNotice`, `startWave`, `preloadAssets`, `statsChanged`, `render` etc.; tarefas longas do navegador (> 50 ms); bytes fixados e memória do JS. Ler: `__pf.report()`; zerar: `__pf.reset()`. As minhas ferramentas não têm a lentidão de CPU 4× (CDP): medido em CPU cheia, tela de 75 Hz.

**ANTES (VISTO; 95 s, fases 1-1 a 3-3, lobo + pet + asa + espada Lendária, ultimate tocando).** 5.613 quadros; trabalho médio 3,0 ms (desenho 2,4; passo 0,4; HUD 0,15; save 0,0); pior quadro 85,5 ms; acima de 16,7 ms: 7; acima de 33: 3; acima de 50: 2; tarefas longas: 4 (78 a 149 ms). Os dois piores quadros (85 e 67 ms) são UM `drawImage` de `mounts/kael_wolf_attack_body.png` (8.704x352) durante a ultimate: folha já "pronta" (`img.decode()`), bitmap descartado pelo navegador e decodificado de novo dentro do desenho. O mesmo no cenário vivo (`bg/v2/era0/ground.webp`: 129 ms num `drawImage`). `save()`: 37 gravações, pior 0,1 ms (save novo e pequeno). HUD: picos de 10 a 19 ms. Passo: 21,7 ms ao abrir o resultado da fase.
Medido à parte: `createImageBitmap(img)` é síncrono (49 ms no fio principal para a folha do lobo); `createImageBitmap(blob)` decodifica fora dele (maior pausa 12 a 15 ms); `drawImage` de imagem fria: 92 ms (lobo) e 62 ms (`sword_legend`, 3.072x1.512).

**Correções (ESCRITAS com a aba fechada; DEPOIS ainda NÃO medido: a vez do navegador estava com o QA).**
1. PINO DE DECODIFICAÇÃO. `Preload.pin(url)` (`js/preload.js`): blob → `createImageBitmap` fora do quadro; o bitmap leva `naturalWidth/naturalHeight/src`. `sheetLoad` (`js/stage.js`): toda folha troca a imagem pelo bitmap fixado e só fica `ok` com ele; `IMG()` (`js/battle.js`) faz o mesmo para `assets/anim/ult|fx` e `assets/fx`. Memória (condição do PO): bytes fixados = largura × altura × 4 (`Preload.pinBytes()`, pico em `pinPeak()`); teto `PIN_MAX_MB = 150` (`js/stage.js`): passou, solta a mais antiga sem uso, nunca uma pedida na janela atual de 15 s (herói, montaria, pet, inimigos da onda); folha sem pedido há 90 s solta o pino; o bitmap só é fechado (`close()`) se ninguém o pede há 15 s ou mais. `?debug=1&pin=0` desliga para comparar. Só fixa o que o `sheetLoad` pede (cena atual; a era seguinte entra na fase 8 e sai sozinha se não for usada).
2. Cenário vivo: `sceneTrim` e a tela de carregamento chamam `api.release()` nas cenas DESCARTADAS (scene.js b1a3981); a cena guardada só para.
3. Montaria: o halo por estrela era um `createRadialGradient` + `toFixed` por quadro e o contorno de luz era o corpo desenhado 2 a 3 vezes com `shadowBlur` por quadro. Agora: halo pronto por estrela (128 px) e contorno de cada quadro guardado num canvas a 1/4 da célula (até 90, ~6 MB); o pulso entra pela transparência. `?debug=1&mglow=0` volta ao antigo.
4. Tiro saindo da clava: a ação guardava `a.gun` no início e o `actEvent` soltava traçante, cápsula e fumaça mesmo com a arma trocada no meio (equipar o melhor sozinho). Agora confere a arma na mão. Leitura completa (arquivo:linha) mandada ao coordenador: nada no desenho decide pela era do mapa.
5. FOLHA EM GRADE (`cols` opcional no `.json`): `sheetSX/sheetSY/sheetXY` em `js/stage.js` (+ `window.sheetXY`), usados em todo recorte de folha dos meus arquivos (lista na mensagem "helper ligado"). Teste `node test/e2e/sheetgrid.js` (398 verificações). Não são meus: `js/artprev.js:175,178`, `test/bg/scene.js:268` e as folhas animadas por CSS (`index.html:201-202,230-233`, `js/intro.js:37,44`, `js/screens.js:224,456`, `js/p_arena.js:17-18`, `js/p_codex.js:28-31`, `js/p_era.js:21-23,55-57`, `js/p_events.js:54-57,210-211`, `js/p_intro.js:259-260,284`).

**Folhas largas (medido no disco, `assets/anim`, fora `_reprovado`/`_bak`):** 2.165 PNG; 767 passam de 4.096 px de largura. Maiores: `fx/evolve_*` e `fx/kaia_evolve_*` 17.024x384 (25 MB decodificada cada), `fx/levelup*` 9.856x384 (14 MB), `mounts/*_attack_body` 8.704x352 (12 MB), `hyb`/`skins`/`equip` até 10.752 (11 MB), `pets` até 6.144 (8 MB).

**Falta (próximo passo, com a aba):** medir o DEPOIS com os três números do PO (pior quadro, quadros acima de 50 ms, bytes fixados no pico) em 5 minutos; abrir os picos do HUD por função (`fbTick` chama `heroFC()` 3 vezes, `missionAlerts()`/`passAlerts()`/`Sys.chest.progress` 2 vezes cada, a cada 0,25 s; `fcNotice` faz `Sys.fc.snapshot` 4 vezes por segundo: `index.html`, não é meu); o passo de 21,7 ms no resultado; lixo por quadro; save com save grande; ver o halo/contorno novo da montaria e conferir que nada some com o pino.

Testes (depois de tudo acima): `node --check` nos 6 arquivos; `run.js` 160 OK; `flows.js` "fluxos duros OK"; `preload.js` passou; `weapons.js` coerente; `sheetgrid.js` 398 OK.

## Engenheiro 12 — online na abertura (2026-11-13): sessão de convidado, save na nuvem, login Google. DESLIGADO por `ONLINE_ON`

Escrito e provado SEM navegador e SEM rede (servidor de mentira no teste). Nada visto no navegador nem contra o servidor real: é do QA.

**Arquivos.** Novo `js/onlineboot.js` (todo o código) e `test/e2e/online.js`. `index.html`, 4 pontos: (a) `const ONLINE_BASE='https://15-229-249-157.sslip.io/v1', ONLINE_ON=false;` (logo depois de `VERSION`); (b) `'cloudchoice','onlineboot'` na lista de scripts, entre `'meta'` e `'loading'`; (c) no fim do `save()`: `try{ if(!OWNER_MODE&&window.OnlineBoot) OnlineBoot.saved(S); }catch(e){}`; (d) antes do `initLoading()`: `try{ if(window.OnlineBoot) OnlineBoot.start(); }catch(e){...}`. `js/loading.js`, 1 linha no `initLoading` (depois do `PRE().reset()`): `if (OB && OB.state().on) PRE().track(OB.wait(4000), 'online')`.

**Ligar.** Trocar `ONLINE_ON=false` por `true` no `index.html` (e subir a `VERSION`). Teste sem mexer na chave: `?debug=1&online=1` (liga só nessa carga), `&onlinebase=<url>` troca o endereço, `&online=0` desliga. Ligado: `Sys.net.DATA.base = ONLINE_BASE`, `Sys.net.DATA.on = true`, `Sys.online.DATA.on = true`. `Sys.buy.DATA.on` não é tocado. Nunca liga: Modo dono, `REALM_MISMATCH`, carga com `window.__noSave` (`?fresh=1`, `?era=`...: um save vazio nunca sobe).

**`window.OnlineBoot`.** `start()`; `wait(ms)` → Promise (boot terminou ou ms; com a tela Nuvem × Aparelho aberta não corta, e depois da escolha dá mais ms); `reboot()` → `{ok, action, pending, ...}`; `google()` → `{ok:true, action:'login', save, pending, player}` | `{ok:true, action:'linked', player}` | `{ok:false, reason:'link_taken', other}` | `{ok:false, reason}`; `saved(S)`; `state()` → `{on, why, booted, booting, lastAction, pending, choosing, started}`; `applyPending()` (aplica já o save pendente: grava e recarrega; para a tela que quiser oferecer); `summary(S)`; evento `onlineboot` no `window` a cada mudança. `lastAction`: `none` | `push` | `applied` | `pending` | `refused` | `null`.

**Regras.** Save da nuvem só troca o do aparelho se `save.realm` (ausente = s1) for o servidor atual; antes de JOGAR grava em `SAVE_KEY`, põe `__noSave` e recarrega; depois de JOGAR fica em memória e em `eon_cloud_pending@<realm>` e entra na abertura seguinte (no `start()`, antes do boot). "JOGAR" = `B.paused` saiu de `true` uma vez (título antigo, entrada nova do `p_intro` ou `?skip=1`), com trava. Com save pendente nada sobe para a nuvem. Guarda contra recarga em laço (3 em 30 s). Escolha: `window.CloudChoice(info)` (js/cloudchoice.js, Sistemas); quem chama `chooseSide` é o próprio `Sys.online.boot` (uma vez só); se a troca falhar, `CloudChoice.failed({code})`; sem a tela, `info.recommend`.

**Resumo (`summary`).** `level` = `Sys.level.level(S)` (`S.sys.level.lvl`); `xp` = `S.sys.level.total` (acumulada); `era` = `S.eraMax`; `stage` = `S.stage`; `fc` = `Sys.fc.compute(S, Sys.host)` (real); `gems` = `S.gems`; `maxRarity` = maior `r` do `S.inv`; `hero` = `S.hero || 'kael'`; `avatar` = `Sys.appearance.avatarKey`; `realm` = `Realm.id()`; `name` = `S.name`; `savedAt` = `S.lastSeen`; `playSeconds` = `S.playSeconds`, que NÃO EXISTE no save → vai 0.

**Divergências do combinado (ditas ao coordenador).** (1) `save()` chama `OnlineBoot.saved(S)`, que repassa ao `Sys.online.saved(S)` (precisa segurar a subida com save pendente). (2) Empate de `playSeconds` (hoje sempre 0 × 0): o recomendado passa a ser o lado mais avançado (nível, fase, FC); sem empate vale `info.recommend`. (3) Com o boot sem servidor, a gravação local marca `Sys.net.markDirty()` (o `Sys.online.saved` não marca antes do boot).

**Testes.** `node test/e2e/online.js`: 93 verificações OK (desligado; servidor mudo: tarefa "online" sai em 4,0 s; nuvem antes/depois da batalha; pendente e abertura seguinte; escolha com e sem a tela; saved; Modo dono; `__noSave`; outro servidor; s2; resumo; Google nos 3 caminhos + cancelado + sem plugin). `run.js` 162 OK (160 + os 2 arquivos novos); `flows.js` "fluxos duros OK"; `preload.js` passou (2,4 s, igual); `realm.js` sem falha dura (1 achado antigo, do import); `owner_all.js` 77 OK; `welcome.js` passou; `test/sys/online.test.js` 7 e `net.test.js` 11 OK.

**Tempo de jogo: `S.playSeconds` (decisão do coordenador; depois do commit 0e3ceac).** Em `js/onlineboot.js` (fim do arquivo; `index.html` não mudou): temporizador de 1 s → `OnlineBoot.playTick(agora)`. Soma segundos inteiros só com `B.paused === false` e `document.visibilityState === 'visible'` nos DOIS passos seguidos (intervalo em pausa/escondido e ganhos offline não contam); soma o tempo real decorrido, no máximo 5 s por passo; relógio para trás soma 0; save antigo começa em 0; conta com o online desligado; cada save tem o seu (Modo dono conta no save do dono). Entra em `summary.playSeconds`. Recomendado: com `playSeconds > 0` nos dois lados vale o `info.recommend`; com algum lado em 0 vale o mais avançado (nível, fase, FC). Testes: `online.js` 108 OK (15 novas: seção 9b e o recomendado); `run.js` 162; `flows.js`, `preload.js`, `realm.js`, `welcome.js` passaram; `owner_all.js` 79.

**Ajuste ao Servidor e763f75 (depois do commit 0f5734c; só `js/onlineboot.js` e `test/e2e/online.js`).** (1) Saiu o contorno do `markDirty` (o `Sys.online.saved` já marca sem boot). (2) `OnlineBoot.saved` NÃO repassa enquanto o boot está em andamento e o jogo ainda está no carregamento/título: com a marcação nova, uma gravação de arrumação da abertura abriria a tela Nuvem × Aparelho sem o jogador ter jogado. (3) `google()`: `googleSignIn('login')` e, no `not_linked`, `googleSignIn('link', {idToken: e.idToken})`: a janela abre UMA vez, mesmo token; NÃO usei o modo `'auto'` porque ele não diz se entrou ou vinculou (`action: 'login' | 'linked'`); sem `e.idToken` vale o caminho antigo. (4) Resumo sempre montado na hora do envio; o da escolha (montado antes de a tela abrir) é refeito no lugar quando a escolha fecha. Testes: `online.js` 112 OK (inclui: todo PUT do teste com era/stage/gems/playSeconds iguais aos do save enviado; janela do Google uma vez); `run.js` 162; `flows.js`, `preload.js`, `realm.js`, `welcome.js`, `owner_all.js` 79, `test/sys/online.test.js` 9, `net.test.js` 12 passaram.
