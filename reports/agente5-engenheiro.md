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
