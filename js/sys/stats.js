/* Eonbound — Sys.stats: ATRIBUTOS do herói com os 7 espaços (regras novas do dono, docs/CONTRATO_V2.md "REGRAS NOVAS DO DONO via PO").
   Atributos: atk, hp, def (planos, escalam com a era) · critRate, critDmg, aspd (em %, não escalam com a era).
   ATK_total = (ATK do nível + ATK fixo dos itens) × (1 + soma dos %: skin, coleção, práticas, títulos, pet, montaria, VIP, nível, itens).
   Golpe = ATK_total × mult. da habilidade × (1 + Dano Crítico, se critar) × (1 − redução da DEF do alvo).
   Formato do item (fechado com a fps-30): {slot, e, r, lvl, gold, look, subs:[{k,q}]}; look = era da APARÊNCIA (ausente = e; não muda na transformação); o principal sai daqui por (slot, e, r, lvl).
   lvl 1-100 é do ITEM (teto = nível do jogador; regra "MELHORIA DE ITEM"); gold = ouro investido; a FORJA continua no espaço.
   Save antigo: chamar migrateSave(S) uma vez na carga (estima o ouro investido e gera os secundários).
   Sem cache: cada chamada recalcula (tirar/colocar item ou skin muda na hora).
   TODOS os números de DATA são PONTO DE PARTIDA para a simulação v7 (fps-c9) calibrar. Relatório: reports/sys-e2-api.md */
(function(root){
'use strict';

/* ---------------- dados (provisórios até a v7) ---------------- */
const DATA={
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],
  slotName:{weapon:'Arma',armor:'Colete',hat:'Chapéu/Elmo',gloves:'Luvas',boots:'Botas',necklace:'Colar',wing:'Asa'},
  wing:{minLevel:50, minR:2},                       // a asa abre no nível 50 e só existe Épica ou acima
  // ASA = ITEM PRÓPRIO (dono via engenheiro, 12/11): item.wing diz QUAL asa é; a aparência NÃO muda por raridade nem por era (o poder sim, como
  // qualquer item). Artes aprovadas: anjo e demoníaca (assets/anim/equip/wing_<id>). De onde cai = PROPOSTA ao PO (wingForDrop):
  // anjo nas eras 0-6 e 8 (a 1ª asa, no Nv 50, e a do Celestial); demoníaca na era 7 (Submundo) e no Hell de qualquer era (depois das 9 eras).
  // EFEITO DAS HABILIDADES PELA RARIDADE DA ARMA (dono via PO, 12/11): a ultimate/s1/s2 é a da ERA DA ARMA (9 famílias = as 9 ultimates animadas,
  // heroLook do engenheiro); a RARIDADE muda só a FORÇA VISUAL. SÓ VISUAL — nenhum multiplicador de dano: a raridade já entra no ATK do item
  // (rarPct) e a regra de coerência (dano sai dos atributos; teto por golpe s1 1× / s2 3× / s3 5× final, 10× total) fica intacta.
  // color = cor da raridade (a mesma do jogo; Divino novo) · tint = quanto pintar o efeito (0-1) · particles = × partículas · size = × tamanho do golpe
  // final da ultimate · glow = brilho (0-3) · shake = × tremor de tela · trail = rastro no s1/s2 (0-3) · flash = clarão no golpe final.
  // ULTIMATE POR FAMÍLIA DE ARMA (DECISÃO DO DONO, 12/11): arma e ultimate NUNCA mudam com a era do mapa. Cada arma tem a sua FAMÍLIA pela arte
  // (it.wt, gravado no item; save antigo: deduzida da arte do item, it.look/it.e). As 9 famílias de hoje usam as 9 ultimates animadas (eraN_ult),
  // mais arco e bumerangue. Nível da ultimate pela RARIDADE da arma (ordem do jogo: 0 Básico, 1 Raro, 2 Épico, 3 Mítico, 4 Lendário, 5 Divino):
  //   base (Básico→Épico) = a ultimate da família · boost (Mítico) = a mesma folha REFORÇADA por código · own (Lendário e Divino) = folha PRÓPRIA
  //   (assets/anim/ult/<família>_legend; até a Arte entregar, ownReady[família] falta e toca a base reforçada). SÓ VISUAL: nenhum multiplicador de dano.
  ultTier:['base','base','base','boost','own','own'],
  ultBoost:{size:1.25,glow:1,particles:1.5,shake:1.15,ring:true},
  // artEra = a era da ARTE da família (assets/weapons/era<N>_*, assets/anim/ult/era<N>_ult): o engenheiro desenha a arma e a ultimate por ela, não pela era do mapa.
  // style: melee (pose de espada) | gun (pose de pistola) | ranged (arco: de longe) | return (bumerangue: vai e volta). Futurista: blaster no Básico, lâmina acima (arte de hoje).
  weaponTypes:{
    club:      {on:true, name:'Clava',            artEra:0, style:'melee'},
    gladius:   {on:true, name:'Lança e gládio',   artEra:1, style:'melee'},
    sword:     {on:true, name:'Espada',           artEra:2, style:'melee'},
    flintlock: {on:true, name:'Arma de pólvora',  artEra:3, style:'gun'},
    revolver:  {on:true, name:'Revólver e rifle', artEra:4, style:'gun'},
    rifle:     {on:true, name:'Fuzil',            artEra:5, style:'gun'},
    plasma:    {on:true, name:'Arma de plasma',   artEra:6, style:'melee', gunAtR0:true},
    infernal:  {on:true, name:'Arma infernal',    artEra:7, style:'melee'},
    celestial: {on:true, name:'Arma celeste',     artEra:8, style:'melee'},
    // ARCO E BUMERANGUE (APROVADOS pelo dono, 12/11; on:false só até a Arte entregar a versão média). Mesmo ATK da espada, mesmos secundários e
    // raridades (Básico→Lendário + Divino); o tipo muda só o JEITO de bater, com o MESMO dano total por golpe (coerência). reach = alcance relativo à
    // espada (1 = encosta) · pierce = inimigos da fila que o golpe atravessa (o dano se divide entre os acertos, não soma). ult:null = a Arte escolhe a base.
    bow:       {on:false, approved:true, name:'Arco e flecha', artEra:null, style:'ranged', reach:2.2, pierce:1, ult:'assets/anim/ult/bow_base',
                unlockLevel:30, fromEra:2, dropPct:15, hits:{s1:[1], s2:[0.34,0.33,0.33]}, note:'atira de longe (acerta antes do inimigo encostar); s2 = 3 flechas; mesmo dano total'},
    boomerang: {on:false, approved:true, name:'Bumerangue',    artEra:null, style:'return', reach:1.8, pierce:2, ult:'assets/anim/ult/boomerang_base',
                unlockLevel:45, fromEra:3, dropPct:15, hits:{s1:[0.5,0.5], s2:[0.25,0.25,0.25,0.25]}, note:'vai e volta: acerta na ida e na volta (2 × 50%), atravessa 2 da fila; mesmo dano total'},
  },
  // REGRA DO DROP (a arma não muda com a era): cada arma que cai sorteia a família — arco 15% (Nv 30+, a partir da era 2) e bumerangue 15% (Nv 45+,
  // a partir da era 3), só os ligados; o resto é a família da ARTE do item que caiu (era do drop). Depois de gravada em it.wt, nunca muda (inclusive na transformação).
  // sword_legend ENTREGUE pela Arte (12/11, 49 quadros, lighter) e EM VOTAÇÃO do dono: marcar ownReady.sword=true só depois da aprovação (regra: nada entra sem o dono)
  ownDelivered:['sword','club','gladius','flintlock','revolver','rifle','plasma','infernal','celestial','bow','boomerang'],   // arco/bumerangue: arte entregue, falta o voto da arte   // folhas próprias ENTREGUES pela Arte e em voto (13/11); o ownReady só depois do OK do dono
  // VOTO DO DONO (13/11): APROVADAS as 9 Lendárias próprias (as 9 famílias, espada inclusa) e 7 asas novas (a de serafim foi REPROVADA, está sendo
  // refeita: fica desligada). As viradas ficam PRONTAS e só são feitas quando o engenheiro disser que o desenho na batalha está visto:
  // Sys.stats.goLive('ults') liga ownReady das aprovadas; Sys.stats.goLive('wings') liga newWingReady das aprovadas. (Nada liga sozinho.)
  ownApproved:['club','gladius','sword','flintlock','revolver','rifle','plasma','infernal','celestial'],
  wingsApproved:['phoenix','ice','shadow','storm','mechanical','bone','darkmoth'],
  // FOLHA-BASE aprovada por família (Básico→Mítico): as 9 das eras 0-8 (as eras 7 e 8, ult-era7-anim/ult-era8-anim, aprovadas pelo dono em 12/11).
  // Arco e bumerangue (bow_base/boomerang_base) estão no disco SEM voto: até o voto, ultOf devolve sheet null (ultimate por código) e baseReady:false.
  baseApproved:['club','gladius','sword','flintlock','revolver','rifle','plasma','infernal','celestial'],
  baseDelivered:['bow','boomerang'],   // folhas-base próprias entregues: bow_base (Chuva de Flechas), boomerang_base (Ciclone de Lâminas)
  ownReady:{},   // família → true quando a Arte entregar a folha própria do Lendário (assets/anim/ult/<família>_legend.png + .json)
  skillFx:[
    {r:0,name:'Básico',  color:'#e8e2d8',tint:0,   particles:1.0,size:1.00,glow:0,shake:1.0,trail:0,flash:false},
    {r:1,name:'Raro',    color:'#4aa3ff',tint:0.25,particles:1.2,size:1.05,glow:1,shake:1.0,trail:1,flash:false},
    {r:2,name:'Épico',   color:'#b07cff',tint:0.40,particles:1.5,size:1.10,glow:1,shake:1.1,trail:1,flash:false},
    {r:3,name:'Mítico',  color:'#ff5a5a',tint:0.55,particles:1.9,size:1.20,glow:2,shake:1.2,trail:2,flash:true},
    {r:4,name:'Lendário',color:'#ffc94a',tint:0.70,particles:2.4,size:1.30,glow:3,shake:1.3,trail:2,flash:true},
    {r:5,name:'Divino',  color:'#7ff6ff',tint:0.80,particles:3.0,size:1.40,glow:3,shake:1.4,trail:3,flash:true,prism:true}],   // prism = brilho arco-íris
  // NÚMEROS ABREVIADOS (dono): um formatador só para o jogo inteiro. ptNum = sufixos em português ("1,2 mi"), liga junto com a curva de 9 eras
  // (mesma decisão do PANEL_V2.ptNum do engenheiro). Vai até o quintilhão (o dano do Celestial passa de 10 quatrilhões).
  abbr:{ptNum:true,  pt:[' mil',' mi',' bi',' tri',' qua',' qui'], en:['K','M','B','T','Qa','Qi']},
  // DROP NO CHÃO por raridade (PO; mesmas regras do js/rarity.js do engenheiro, que desenha: brilho em todos, partículas do Épico para cima, FEIXE
  // vertical do Mítico para cima com 62 px lógicos (abaixo das barras de vida), apoiado no chão, sem tremer). Cores = paleta aprovada do Equipamento.
  // glow px · particles por segundo · beam px (0 = sem) · pulse s (0 = parado) · sound {id, rate} (Épico 'gem'; Mítico 'legendary' 0,9; Lendário 'legendary')
  dropFx:[
    {r:0,name:'Básico',  color:'#e8e2d8',glow:4, particles:0, beam:0, pulse:0,  sound:null},
    {r:1,name:'Raro',    color:'#4aa3ff',glow:7, particles:0, beam:0, pulse:0,  sound:null},
    {r:2,name:'Épico',   color:'#b07cff',glow:10,particles:6, beam:0, pulse:0,  sound:{id:'gem',rate:1}},
    {r:3,name:'Mítico',  color:'#ff5a5a',glow:13,particles:10,beam:62,pulse:1.6,sound:{id:'legendary',rate:0.9}},
    {r:4,name:'Lendário',color:'#ffc94a',glow:16,particles:16,beam:62,pulse:1.6,sound:{id:'legendary',rate:1}},
    {r:5,name:'Divino',  color:'#7ff6ff',glow:20,particles:24,beam:62,pulse:1.2,sound:{id:'legendary',rate:1.1},prism:true}],   // Divino: feixe arco-íris
  wingTypes:{angel:{name:'Asa de anjo'}, demon:{name:'Asa demoníaca'},
    // 8 ASAS NOVAS (dono, 13/11; nw:true = atrás da chave DATA.newWings, ou uma a uma com newWingReady[id], até a arte). Cada uma é um ITEM de asa
    // (slot wing) como a de anjo/demônio: o ATRIBUTO sai da raridade, era e nível do item (mesmo padrão); o tipo é o visual. r = raridade com que esse
    // modelo cai (o item nasce nela). Fontes SEM sorteio pago; nenhuma dá diamante. Brilho: wingGlow(item, nívelDaForja) pela raridade + Forja +0..+15.
    darkmoth: {name:'Mariposa sombria',   nw:true, r:1, src:['Chefes de fase a partir da era 2 (no lugar da asa de anjo Rara)']},
    bone:     {name:'Asa de ossos',       nw:true, r:2, src:['Chefes da era 7 (Submundo) e Instância Chefe de Era']},
    mechanical:{name:'Asas mecânicas',     nw:true, r:2, src:['Instância Arsenal (dificuldade Difícil+): 1ª vitória']},
    shadow:   {name:'Asa de sombra',      nw:true, r:3, src:['Arena: fim de temporada Diamante+']},
    ice:      {name:'Asa de gelo',        nw:true, r:3, src:['Evento Invasão da Era: baú de topo (1 por semana)']},
    storm:    {name:'Asa da tempestade',  nw:true, r:3, src:['Torre: andares 120, 140 e 160']},
    phoenix:  {name:'Asa de fênix',       nw:true, r:4, src:['Torneio: top 10 da temporada','Chefe Mundial: faixa de topo do mês']},
    seraph:   {name:'Asa de serafim (6 asas)', nw:true, r:4, rarest:true, src:['Torneio: top 1 da temporada','Chefe da era 8 no Hell (1ª vitória)']},   // a mais rara; Divino (r 5) quando a curva de 9 eras ligar
  },
  newWings:false, newWingReady:{},
  // brilho da asa: base pela raridade (paleta do Equipamento) + Forja (+0,1 por nível, até +1,5 no +15); partículas a partir do Mítico ou do +10
  wingGlow:{base:[0,0.3,0.6,1.0,1.4,1.8], perForge:0.1, particlesFromR:3, particlesFromForge:10},
  wingDrop:{demonEras:[7], demonDiff:3, default:'angel'},
  eraFactor:12,                                     // planos × 12^era (regra "era manda mais que raridade")
  maxEra:6,                                         // última era que existe (eras 7-8: só mudar aqui)
  rarFlat:[1,1.7,3,5.5,10,18],                      // planos × raridade (mesmo RAR.m do jogo); [5] = DIVINO (×1,8, só com era9.on)
  rarPct:[1,1.25,1.5,1.8,2.2,2.7],                  // % × raridade (principais e secundários em %); [5] = Divino
  // CURVA DAS 9 ERAS (dono via PO; PROPOSTA, DESLIGADA): eras 7 (Submundo) e 8 (Celestial), item até o Nv 120 e a raridade DIVINO (Nv 105,
  // só eras 7-8; o portão é da fps-30). setEra9(true) troca maxEra 6→8, maxItemLevel 100→120 e libera a raridade 5. Spec: reports/curva-9-eras-e2.md
  era9:{on:false, maxEra:8, maxItemLevel:120, off:{maxEra:6, maxItemLevel:100}},
  // QUALIDADE DO ITEM (regra nova do dono; PROPOSTA ao PO, DESLIGADA: on=false). Cada item sorteia qp 0..10.000 → multiplicador linear
  // ×0,80 (0) a ×1,20 (10.000) em TODOS os atributos do item (principal e secundários). Estrelas por faixa: 1★ 0-1.999 … 5★ 8.000-10.000.
  // Sorteio puxado para baixo: P(≥6.000)=10%, P(≥8.000)=2%, P(≥9.500)=0,1%, P(=10.000)=1 em 1 milhão (interpolação do log da chance).
  // REGRA DE OURO (raridade manda): com a qualidade ligada, os % usam rarPctQ (degraus ×1,55 > 1,20/0,80 = 1,5); os planos já têm
  // degraus > 1,5 (1,70/1,76/1,83/1,82). Item SEM qp (save antigo) = 5.000 (×1,00): ninguém perde força. A transformação mantém a qp.
  // PO: ×0,90 (qp 0) a ×1,30 (qp 10.000): a média dos sorteados (qp ~2.456) dá ≈ ×1,00, e a razão 1,30/0,90 = 1,44 fica abaixo dos degraus.
  // Item SEM qp (antigo) = a MÉDIA: qp 2.500 = ×1,00.
  quality:{on:false, min:0.90, max:1.30, top:10000, jackpot:1e-6, neutral:2500,
    anchors:[[0,1],[6000,0.10],[8000,0.02],[9500,0.001],[9999,2e-6]],   // [qp, chance de sair pelo menos esse qp]
    stars:[0,2000,4000,6000,8000], rarPctQ:[1,1.55,2.4,3.72,5.77,8.94],
    // PO: degrau ×1,5 EXATO só em velocidade de ataque e dano crítico (os tetos atuais seguram; 1,5 > 1,44 mantém a regra de ouro)
    rarPct15:[1,1.5,2.25,3.375,5.0625,7.59], keys15:['aspd','critDmg'],
    // FUSÃO (dono; no lugar de re-sorteio): 3 itens IGUAIS (era de poder, espaço, raridade e estrela) → 1 com +1 estrela; 5★ não funde.
    // qp do resultado = mesma posição relativa da MÉDIA dos 3 na faixa da estrela nova (sem sorte); o 10.000 perfeito só por drop (teto 9.999).
    // Nível = o MAIOR dos 3; ouro investido = a SOMA (o desmontar não perde nada); secundários e visual = do de maior qp. Custo: só ouro.
    fusion:{count:3, goldPerLevel1:3, maxFusedQp:9999}},
  // ITEM DE ERA FUTURA (regra do dono: qualquer item serve em qualquer era; drop raro de era futura). PROPOSTA ao PO, DESLIGADA (on=false).
  // Sem trava, uma arma da era 4 que cai na era 2 faz o jogador pular 7 a 11 fases (simulado): quebra a meta de "no máximo 1 chefe".
  // "ADORMECIDO": enquanto a era do item for MAIOR que a era liberada do jogador, ele rende como no máximo maxAhead era à frente e fica no
  // nível 1 (não sobe); quando o jogador chega na era do item, ele ACORDA com os atributos da era dele e pode subir. Simulado: +1 fase.
  futureEra:{on:false, maxAhead:1, dormantLevel:1},
  // PRINCIPAL por espaço, valor-base na era 0, raridade Básica, nível do espaço 1, sem forja
  main:{
    weapon:  {atk:8},
    armor:   {hp:40, def:8},       // v7.1: DEF-base do colete 8 (era 4)
    hat:  {hp:24},
    gloves:  {atk:3, critRate:2},
    boots:   {aspd:4},
    necklace:{critDmg:10},
    wing:    {atkPct:3, hpPct:3},
  },
  // NÍVEL DO ITEM 1-100 (regra "MELHORIA DE ITEM"; teto = nível do jogador) e FORJA do espaço:
  // planos × lvlFactor(nível) × (1 + forja) — curva em lvlCurve abaixo; % × (1 + pctLvlStep·(nível−1)) × (1 + forja·pctForgeShare).
  // lvlMult = expoente da curva v7 (mantido só para comparar).
  lvlMult:1.04, pctLvlStep:0.01, pctForgeShare:0.5, maxItemLevel:100,
  // CURVA DO NÍVEL DO ITEM (planos): lvlCurve escolhe. 'v8' (PO, PARA TESTE): (1 + lin·(N−1)) × exp^(N−1) → Nv 12 = ×2,96, Nv 100 = ×42,5
  // (melhorar vale a pena no começo, como no jogo antigo). 'v7': lvlMult^(N−1) = 1,04 (Nv 12 = ×1,54; ficava fraco no começo: trava na era 0).
  lvlCurve:'v8', lvlCurves:{v7:{exp:1.04, lin:0}, v8:{exp:1.01, lin:0.15}},
  // v7 (PO): botas, colar e asa passam a ESCALAR COM A ERA, como arma e colete. Os atributos deles são %, então o 12^era dos planos
  // explodiria (velocidade da bota na era 6 = +10.000%). Passo ADITIVO por era: % × (1 + pctEraStep·era) → era 6 = ×2,5. PROVISÓRIO.
  pctEraStep:0.25, pctEraSlots:['boots','necklace','wing'],
  // custo de melhoria do nível N ao N+1 (v7): ouro = piso(goldBase·goldGrowth^(N−1)·(1+r·rarityCost)·priceEra^era) — priceEra 3,5 (PO, era 4);
  // diamante (compra direta, permitida) = teto(gemBase·gemGrowth^(N−1)·(1+r·rarityCost)). Desmontar devolve dismantleGold do ouro investido.
  upgrade:{goldBase:20, goldGrowth:1.06, rarityCost:0.6, priceEra:3.5, gemBase:2, gemGrowth:1.04, dismantleGold:0.5,
    // costCurve 'v8': ouro do nível N ao N+1 PROPORCIONAL ao ganho real desse nível: goldBaseV8 × (f(N+1) − f(N)) / (f(2) − f(1)) × raridade × era
    // (ouro por ponto de atributo constante na era). goldBaseV8 25: do Nv 1 ao 12 custa o mesmo ouro que a tabela v7 (≈ 300 × raridade × era).
    // 'v7': goldBase × goldGrowth^(N−1) (custo subia 6%/nível; com a curva v8, os níveis altos ficariam um mau negócio). Diamante não muda.
    // costGrowthV8: crescimento EXTRA por nível em cima do proporcional (1 = só proporcional). Ajuste da calibração no jogo real:
    // com 1, chegar ao Nv 100 custa ~17x menos que a v7 (6.370 contra 106.315 por item Básico da era 0) e pode sobrar ouro no fim.
    costCurve:'v8', goldBaseV8:25, costGrowthV8:1},
  // TRANSFORMAÇÃO: custo RESERVA só para quando o Sys.loot (fps-30, dona do custo e da Essência) não estiver carregado
  transform:{goldLevels:10},
  // SECUNDÁRIOS: Raro 1, Épico+ 2; faixa [min,max] na raridade Rara (× rarPct; def × rarFlat × 12^era); valor = min + q·(max−min)
  subCount:[0,1,2,2,2,2],
  subs:{critRate:[1,3], critDmg:[4,12], aspd:[2,6], atkPct:[2,6], hpPct:[2,6], defPct:[2,6]},
  // secundário proibido por espaço (igual/redundante ao principal; mesma lista da reserva da fps-30)
  subExclude:{weapon:[], armor:['defPct'], hat:['hpPct'], gloves:['critRate'], boots:['aspd'], necklace:['critDmg'], wing:['atkPct','hpPct']},
  flatKeys:['atk','hp','def'],
  // atributos do NÍVEL do jogador (ATK do nível), somados aos fixos dos itens antes dos %
  levelBase:{atk:5, atkPer:2, hp:100, hpPer:40, def:0, defPer:1},
  // base do próprio herói
  base:{critRate:12, critDmg:100, aspd:0},     // crítico 12% (BAL.critRate) e dano crítico +100% (= ×2 do BAL.critMult)
  caps:{critRate:75, aspd:100, critDmg:400, defRed:75},
  // REGRA DE COERÊNCIA DE DANO (dono: "2.000 de FC nunca dá 1 milhão"; reports/coerencia-dano.md). Todo número de dano = ATK × golpe × crítico ×
  // (1 − DEF do alvo) × variação. Teto de UM número, em ATK do herói, SEM crítico (o crítico multiplica por 1 + dano crítico, teto 400% = ×5).
  // s1 básico 1 · s2 especial 3 no total (repartido nos golpes) · s3 ultimate 10 no total, o golpe final 5 · pet 0,94 (Lendário no máximo; ×3,2 no crítico
  // da v3). spread = a variação visual de ±10% do battle.js. Usado só por checkHit (QA) e pelos testes: não muda o jogo.
  offer:{followUntil:25},   // arma da oferta de 1ª compra: acompanha nível e era até o Nv 25 (offerSync)
  dmgRule:{perHit:{s1:1, s2:3, s3:5, s3total:10, pet:0.94, petCrit:3.2}, spread:1.1},   // v7.1: velocidade até +100% (era 150); dano crítico até 400% (trava)
  defK:2,                                           // v7.1 (era 3): redução = DEF / (DEF + defK × ATK do atacante), teto caps.defRed
  baseInterval:0.8,                                 // s1 a cada 0,8 s; com Vel. de Ataque: 0,8 / (1 + aspd/100)
};
const SUB_KEYS=Object.keys(DATA.subs);
const STAT_KEYS=['atk','hp','def','critRate','critDmg','aspd','atkPct','hpPct','defPct'];

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const zero=()=>{ const o={}; for(const k of STAT_KEYS) o[k]=0; return o; };
const isSlot=s=>DATA.slots.includes(s);
const excluded=slot=>(DATA.subExclude[slot]||[]).slice();
function mulberry(seed){ let a=seed>>>0; return ()=>{ a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash(s){ let h=2166136261; s=String(s); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const isFlat=k=>DATA.flatKeys.includes(k);
/* ---------------- qualidade (chave DATA.quality.on) ---------------- */
const Q=()=>DATA.quality, qOn=()=>Q().on===true;
const MAXR=()=>DATA.era9&&DATA.era9.on===true?5:4;
const rarPctOf=(r,k)=>(qOn()?(Q().keys15.includes(k)?Q().rarPct15:Q().rarPctQ):DATA.rarPct)[clamp(int0(r),0,MAXR())];
/* sorteia a qualidade de um item novo (0..10.000) */
function rollQuality(rng){ rng=rng||Math.random; const q=Q(), u=rng(); if(u<q.jackpot) return q.top; const v=(u-q.jackpot)/(1-q.jackpot), A=q.anchors;
  for(let i=1;i<A.length;i++){ const [x0,s0]=A[i-1],[x1,s1]=A[i]; if(v>=s1){ const t=(Math.log(v)-Math.log(s0))/(Math.log(s1)-Math.log(s0)); return Math.floor(x0+t*(x1-x0)); } }
  return q.top-1; }
const qpOf=it=>{ const v=it&&it.qp; return (typeof v==='number'&&isFinite(v))?clamp(Math.round(v),0,Q().top):Q().neutral; };
/* multiplicador da qualidade (com a chave desligada: 1) */
const qualityMult=it=>{ if(!qOn()) return 1; const q=Q(); return q.min+(q.max-q.min)*qpOf(it)/q.top; };
const qualityStars=qp=>{ let s=1; Q().stars.forEach((x,i)=>{ if(clamp(num(qp,0),0,Q().top)>=x) s=i+1; }); return s; };

/* ---------------- itens ---------------- */
/* multiplicador do NÍVEL do item nos atributos planos (DATA.lvlCurve) */
function lvlFactor(L){ const c=DATA.lvlCurves[DATA.lvlCurve]||{exp:DATA.lvlMult,lin:0}; L=clamp(int0(L)||1,1,DATA.maxItemLevel);
  return (1+num(c.lin,0)*(L-1))*Math.pow(num(c.exp,1),L-1); }
const subCount=r=>int0(DATA.subCount[clamp(int0(r),0,MAXR())]);
/* liga/desliga a curva das 9 eras (só troca números de DATA; o save não muda) */
function setEra9(on){ const E=DATA.era9, src=on?E:E.off; E.on=!!on; DATA.maxEra=src.maxEra; DATA.maxItemLevel=src.maxItemLevel; return E.on; }
/* sorteia subs distintos e diferentes do principal do espaço (a fps-30 pode usar, ou gerar {k,q} do jeito dela) */
function rollSubs(slot,r,rng){ rng=rng||Math.random; const pool=SUB_KEYS.filter(k=>!excluded(slot).includes(k)), out=[];
  for(let i=0;i<subCount(r)&&pool.length;i++){ const j=Math.floor(rng()*pool.length)%pool.length; out.push({k:pool.splice(j,1)[0],q:Math.round(rng()*1000)/1000}); }
  return out; }
/* item antigo sem subs (Raro+): gera com semente pelo id (sempre o mesmo resultado). Não mexe em item que já tem subs. */
function ensureSubs(item){ if(!item||Array.isArray(item.subs)&&item.subs.length>=subCount(item.r)) return item;
  if(!Array.isArray(item.subs)) item.subs=[]; if(item.subs.length<subCount(item.r)) item.subs=rollSubs(item.slot,item.r,mulberry(hash('subs|'+(item.id!=null?item.id:JSON.stringify([item.slot,item.e,item.r])))));
  return item; }
/* valor de um secundário */
function subValue(sub,item){ const f=DATA.subs[sub&&sub.k]; if(!f) return 0; const q=clamp(num(sub.q,0),0,1), r=clamp(int0(item&&item.r),0,MAXR()), e=clamp(int0(item&&item.e),0,DATA.maxEra);
  const v=f[0]+q*(f[1]-f[0]); return (isFlat(sub.k)?v*DATA.rarFlat[r]*Math.pow(DATA.eraFactor,e):v*rarPctOf(r,sub.k))*qualityMult(item); }
/* principal do item no espaço (com nível do espaço e multiplicador de forja) */
function mainOf(item,slotLvl,forge){ const o=zero(); if(!item||!isSlot(item.slot)) return o;
  const r=clamp(int0(item.r),0,MAXR()), e=clamp(int0(item.e),0,DATA.maxEra), L=clamp(int0(slotLvl)||1,1,DATA.maxItemLevel), fm=Math.max(0,num(forge,0));
  for(const [k,b] of Object.entries(DATA.main[item.slot])){
    o[k]=isFlat(k)?b*DATA.rarFlat[r]*Math.pow(DATA.eraFactor,e)*lvlFactor(L)*(1+fm)
                   :b*rarPctOf(r,k)*(DATA.pctEraSlots.includes(item.slot)?1+DATA.pctEraStep*e:1)*(1+DATA.pctLvlStep*(L-1))*(1+fm*DATA.pctForgeShare);
    o[k]*=qualityMult(item); }
  return o; }
/* principal + secundários de um item equipado. Secundário igual ao principal do espaço é ignorado (regra do formato). */
function itemStats(item,slotLvl,forge){ const o=mainOf(item,slotLvl,forge); if(!item) return o; ensureSubs(item); const seen=new Set(excluded(item.slot));
  for(const s of item.subs||[]){ if(!DATA.subs[s.k]||seen.has(s.k)) continue; seen.add(s.k); o[s.k]+=subValue(s,item); }
  return o; }
const slotOpen=(slot,playerLevel)=>slot!=='wing'||int0(playerLevel)>=DATA.wing.minLevel;
/* o item pode ir para este espaço? (asa: nível 50 e Épico+) */
function canEquip(item,playerLevel){ if(!item||!isSlot(item.slot)) return false; if(item.slot==='wing') return slotOpen('wing',playerLevel)&&int0(item.r)>=DATA.wing.minR; return true; }

/* ---------------- atributos finais ---------------- */
/* nível do jogador; null = desconhecido (sem Sys.level e sem host.level): aí o nível do item não tem teto */
const playerLevelOf=(S,host)=>{ const L=root.Sys&&root.Sys.level; if(L&&L.level) return L.level(S); if(host&&typeof host.level==='function') return int0(host.level())||1; return null; };
/* host.equipped() → {slot: item} ou lista de itens; host.slotLevel(slot) → nível do espaço (padrão: S.lvl[slot] ou 1); forja: Sys.forge.mult */
function equippedOf(S,host){ let eq=host&&typeof host.equipped==='function'?host.equipped():null; const out={};
  if(Array.isArray(eq)) for(const it of eq){ if(it&&isSlot(it.slot)) out[it.slot]=it; }
  else if(eq&&typeof eq==='object') for(const s in eq) if(eq[s]&&isSlot(s)) out[s]=eq[s];
  for(const s in out) offerSync(out[s],S,host);
  return out; }
/* ARMA DA OFERTA DE 1ª COMPRA (PO): item com offer:true ACOMPANHA o jogador (nível = o do jogador; era = a liberada) enquanto ele está até o
   Nv DATA.offer.followUntil (25), para nunca ficar pior que a arma normal (Épica no nível dele: ×1,76 no principal sobre a Rara). Depois do 25 para de
   acompanhar e vira um item comum (sobe com ouro, transforma com Essência). Só aumenta (nunca tira nível/era). Chamada sozinha ao calcular. */
function offerSync(it,S,host){ if(!it||it.offer!==true) return it; const L=playerLevelOf(S,host); if(L==null||L>DATA.offer.followUntil) return it;
  it.lvl=Math.max(int0(it.lvl)||1,clamp(L,1,DATA.maxItemLevel)); const E=clamp(int0(host&&host.eraMax&&host.eraMax()),0,DATA.maxEra);
  if(E>int0(it.e)){ if(it.look==null) it.look=int0(it.e); it.e=E; } return it; }
/* nível do ITEM (1-100), limitado pelo nível do jogador; item sem lvl = 1 */
/* nível EFETIVO na força = o nível que o item tem (1-100). Decisão do PO: o teto "≤ nível do jogador" vale só para SUBIR (canUpgrade/planUpgrade);
   o nível já conquistado conta inteiro, para ninguém perder força com a mudança de regra. (playerLevel fica na assinatura por compatibilidade.) */
const itemLevel=(it,playerLevel)=>clamp(int0(it&&it.lvl)||1,1,DATA.maxItemLevel);
/* teto para SUBIR o nível do item */
const upgradeCap=pl=>pl==null?DATA.maxItemLevel:Math.min(DATA.maxItemLevel,Math.max(1,int0(pl)));
/* ADORMECIDO (chave DATA.futureEra.on): item de era MAIOR que a era liberada do jogador rende como eraMax + maxAhead e no nível 1 */
const eraNowOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);
function isDormant(it,host){ return DATA.futureEra.on===true&&!!it&&!!host&&typeof host.eraMax==='function'&&int0(it.e)>eraNowOf(host); }
/* para a tela: "Adormecido · acorda na era X" */
function dormantInfo(it,host){ if(!isDormant(it,host)) return {dormant:false}; const e=int0(it.e); const P=root.Sys&&root.Sys.phases, nm=P&&P.DATA&&P.DATA.eraName&&P.DATA.eraName[e];   // nome da era para o jogador (o número interno começa do 0)
  return {dormant:true,wakeEra:e,eraName:nm||null,label:'Adormecido · acorda na era '+(nm||e+1)}; }
function dormantView(it,host){ if(!isDormant(it,host)) return it; const F=DATA.futureEra;
  return Object.assign({},it,{e:Math.min(int0(it.e),eraNowOf(host)+F.maxAhead),lvl:F.dormantLevel,look:Number.isInteger(it.look)?it.look:int0(it.e)}); }
/* soma dos atributos dos itens equipados (só espaços abertos e itens válidos para o espaço) */
function itemsTotal(S,host,ov){ const o=zero(), lv=playerLevelOf(S,host), F=root.Sys&&root.Sys.forge, eq=equippedOf(S,host);
  if(ov&&ov.item&&isSlot(ov.item.slot)){ if(ov.remove) delete eq[ov.item.slot]; else eq[ov.item.slot]=ov.atLevel!=null?Object.assign({},ov.item,{lvl:ov.atLevel}):ov.item; }
  for(const slot of DATA.slots){ const it=eq[slot]; if(!it||!canEquip(it,lv)) continue;
    const v=dormantView(it,host), st=itemStats(v,itemLevel(v,lv),F&&F.mult?F.mult(S,slot):0); for(const k of STAT_KEYS) o[k]+=st[k]; }
  return o; }
function levelBase(lv){ const B=DATA.levelBase; lv=Math.max(1,int0(lv)); return {atk:B.atk+B.atkPer*(lv-1),hp:B.hp+B.hpPer*(lv-1),def:B.def+B.defPer*(lv-1)}; }
/* atributos finais. pct = bônus % dos módulos Sys (fc.total), já somados; o fc.js passa. Sem host.equipped, usa host.atk/hp (modo antigo). */
/* ov (opcional): {item, atLevel?, remove?} → calcula como se esse item estivesse no espaço dele (para "FC deste item"), sem mexer no save */
function compute(S,host,pct,ov){
  pct=pct||{}; const lv=playerLevelOf(S,host), modern=!!(host&&typeof host.equipped==='function'), it=modern?itemsTotal(S,host,ov):zero();
  let fa,fh,fd;
  if(modern){ const b=levelBase(lv==null?1:lv); fa=b.atk+it.atk; fh=b.hp+it.hp; fd=b.def+it.def; }
  else { fa=Math.max(0,num(host&&host.atk&&host.atk(),0)); fh=Math.max(0,num(host&&host.hp&&host.hp(),0)); fd=0; }
  fa+=num(pct.atk,0); fh+=num(pct.hp,0);                       // planos extras (dicas do "como ficar mais forte")
  const aP=num(pct.atkPct,0)+it.atkPct, hP=num(pct.hpPct,0)+it.hpPct, dP=num(pct.defPct,0)+it.defPct;
  return {
    atk:fa*Math.max(0,1+aP/100), hp:fh*Math.max(0,1+(hP+num(pct.petBond,0))/100), hpNoPet:fh*Math.max(0,1+hP/100), def:fd*Math.max(0,1+dP/100),
    critRate:clamp(DATA.base.critRate+num(pct.critPct,0)+it.critRate,0,DATA.caps.critRate),
    critDmg:clamp(DATA.base.critDmg+it.critDmg+num(pct.critDmgPct,0),0,DATA.caps.critDmg),
    aspd:clamp(DATA.base.aspd+it.aspd+num(pct.aspdPct,0),0,DATA.caps.aspd),
    flatBase:{atk:fa,hp:fh,def:fd}, pctSum:{atk:aP,hp:hP,def:dP}, items:it, level:lv, modern };
}
/* redução de dano pela DEF do alvo, relativa ao ATK de quem bate (sem curva por era) */
const defReduction=(def,attackerAtk)=>{ def=Math.max(0,num(def,0)); const a=Math.max(1e-9,num(attackerAtk,0)); return Math.min(DATA.caps.defRed/100,def/(def+DATA.defK*a)); };
/* um golpe: {atk, critRate, critDmg} × mult; crit = true/false (ou sorteia com rng); targetDef = DEF do alvo */
function hit(att,mult,targetDef,crit,rng){ const c=typeof crit==='boolean'?crit:((rng||Math.random)()*100<num(att.critRate,0));
  const d=Math.max(0,num(att.atk,0))*Math.max(0,num(mult,1))*(c?1+num(att.critDmg,100)/100:1)*(1-defReduction(targetDef,att.atk));
  return {dmg:d,crit:c}; }
/* teto de UM número de dano para o golpe `type` (s1|s2|s3|pet|petCrit), em unidades absolutas, para os atributos `att` do herói (com crítico no
   dano crítico DELE, travado no teto, e a variação). checkHit(att, dmg, type) → {ok, ratio (dano ÷ ATK), max (teto ÷ ATK)} para o QA. */
function maxHit(att,type){ const R=DATA.dmgRule, m=num(R.perHit[type],R.perHit.s3), cd=Math.min(num(att&&att.critDmg,100),DATA.caps.critDmg);
  return Math.max(0,num(att&&att.atk,0))*m*(type==='petCrit'?1:1+cd/100)*R.spread; }
function checkHit(att,dmg,type){ const a=Math.max(1e-9,num(att&&att.atk,0)), mx=maxHit(att,type); return {ok:num(dmg,0)<=mx*(1+1e-9),ratio:num(dmg,0)/a,max:mx/a}; }
const interval=st=>DATA.baseInterval/(1+Math.max(0,num(st&&st.aspd,0))/100);


/* ---------------- melhoria do item (nível 1-100; teto = nível do jogador) ---------------- */
function upgradeCost(item){ const U=DATA.upgrade, n=Math.max(1,int0(item&&item.lvl)||1), r=clamp(int0(item&&item.r),0,MAXR()), e=clamp(int0(item&&item.e),0,DATA.maxEra), rc=1+r*U.rarityCost;
  const step=U.costCurve==='v8'?U.goldBaseV8*(lvlFactor(n+1)-lvlFactor(n))/(lvlFactor(2)-lvlFactor(1))*Math.pow(num(U.costGrowthV8,1),n-1):U.goldBase*Math.pow(U.goldGrowth,n-1);
  return {gold:Math.floor(step*rc*Math.pow(U.priceEra,e)), gems:Math.ceil(U.gemBase*Math.pow(U.gemGrowth,n-1)*rc)}; }
/* {ok, reason:'max'|'level'|'money', gold, gems}. host.canSpendGold/spendGold e host.canSpendGems/spendGems vêm do jogo. */
/* reason 'level' traz playerLevel, needLevel (nível do jogador para a PRÓXIMA melhoria) e aboveCap (o item já está ACIMA do nível do jogador),
   para a tela: "Nv 25 (acima do seu nível: não pode subir até você chegar ao 25)" */
function canUpgrade(S,host,item,currency){ const n=int0(item&&item.lvl)||1, pl=playerLevelOf(S,host), lv=upgradeCap(pl), c=upgradeCost(item),
    r={ok:false,reason:'',gold:c.gold,gems:c.gems,itemLevel:n,playerLevel:pl,needLevel:Math.min(DATA.maxItemLevel,n+1),aboveCap:pl!=null&&n>pl};
  if(isDormant(item,host)){ r.reason='dormant'; r.wakeEra=clamp(int0(item.e),0,99); return r; }   // adormecido: só sobe quando o jogador chega na era dele
  if(n>=DATA.maxItemLevel){ r.reason='max'; return r; } if(n>=lv){ r.reason='level'; return r; }
  const fn=currency==='gems'?'canSpendGems':'canSpendGold', amt=currency==='gems'?c.gems:c.gold;
  if(host&&typeof host[fn]==='function'&&!host[fn](amt)){ r.reason='money'; return r; } r.ok=true; return r; }
/* sobe 1 nível pagando em 'gold' (padrão) ou 'gems'. Guarda o ouro investido em item.gold (só ouro volta no desmontar). */
function upgrade(S,host,item,currency){ const c=canUpgrade(S,host,item,currency); if(!c.ok) return {ok:false,reason:c.reason};
  const gems=currency==='gems', fn=gems?'spendGems':'spendGold', amt=gems?c.gems:c.gold;
  if(host&&typeof host[fn]==='function'&&host[fn](amt)===false) return {ok:false,reason:'money'};
  item.lvl=(int0(item.lvl)||1)+1; if(!gems) item.gold=int0(item.gold)+amt;
  return {ok:true,lvl:item.lvl,paid:amt,currency:gems?'gems':'gold'}; }
/* MIGRAÇÃO de save (PO: "nenhum jogador pode perder ouro por causa da mudança de regra"): item antigo sem `gold` recebe o ouro investido
   ESTIMADO pelo nível, com a tabela que o jogador DE FATO pagou (upCost antigo do index.html: 20·1,38^(N−1)·(1+0,6·r)·4^era).
   A tabela nova (provisória) é mais barata e faria o jogador perder ouro no desmontar. Marca item.goldEstimated = true. */
const LEGACY_UP={base:20, growth:1.38, rarity:0.6, era:4};
function legacyGold(item){ const n=Math.max(1,int0(item&&item.lvl)||1), r=clamp(int0(item&&item.r),0,MAXR()), e=clamp(int0(item&&item.e),0,DATA.maxEra), L=LEGACY_UP; let g=0;
  for(let k=1;k<n;k++) g+=Math.floor(L.base*Math.pow(L.growth,k-1)*(1+r*L.rarity)*Math.pow(L.era,e)); return g; }
function migrateItem(item){ if(!item||typeof item!=='object') return item;
  if(!(typeof item.gold==='number'&&isFinite(item.gold)&&item.gold>=0)){ item.gold=legacyGold(item); item.goldEstimated=true; }
  if(!(int0(item.lvl)>=1)) item.lvl=1; if(!Number.isInteger(item.look)) item.look=visualEra(item);
  if(qOn()&&!(typeof item.qp==='number'&&isFinite(item.qp))) item.qp=Q().neutral;   // qualidade: item antigo = 5.000 (×1,00)
  ensureSubs(item); ensureWeaponType(item); return item; }   // família da arma gravada pela arte (decisão do dono: nunca muda com a era)
/* migra todos os itens do save (S.inv). Chamar UMA vez na carga, antes de qualquer cálculo. Devolve quantos itens foram ajustados. */
function migrateSave(S){ let n=0; if(S&&Array.isArray(S.inv)) for(const it of S.inv){ const had=typeof it.gold==='number'; migrateItem(it); if(!had) n++; } return n; }
/* FUSÃO (chave DATA.quality.on). items = 3 itens IGUAIS. {ok, reason, result, consumed:[ids], gold}. NÃO mexe no save: o jogo tira os 3
   da mochila, põe o resultado (com id novo) e mantém equipado se um deles estava. */
const bandOf=st=>{ const B=Q().stars, lo=B[st-1], hi=st<B.length?B[st]-1:Q().top; return [lo,hi]; };
function canFuse(S,host,items){ const F=Q().fusion;
  if(!qOn()) return {ok:false,reason:'off'};
  if(!Array.isArray(items)||items.length!==F.count||new Set(items.map(x=>x&&x.id)).size!==F.count) return {ok:false,reason:'count'};
  const a=items[0], st=qualityStars(qpOf(a));
  for(const x of items) if(!x||x.slot!==a.slot||int0(x.e)!==int0(a.e)||int0(x.r)!==int0(a.r)||qualityStars(qpOf(x))!==st||(a.slot==='weapon'&&weaponType(x)!==weaponType(a))) return {ok:false,reason:'different'};   // arma: mesma família (arco só com arco)
  if(st>=Q().stars.length) return {ok:false,reason:'max'};
  const gold=F.goldPerLevel1*upgradeCost({lvl:1,r:a.r,e:a.e}).gold;
  if(host&&typeof host.canSpendGold==='function'&&!host.canSpendGold(gold)) return {ok:false,reason:'money',gold};
  const m=items.reduce((t,x)=>t+qpOf(x),0)/F.count, [lo,hi]=bandOf(st), [nlo,nhi]=bandOf(st+1), rel=hi>lo?clamp((m-lo)/(hi-lo),0,1):0;
  const qp=Math.min(F.maxFusedQp,Math.round(nlo+rel*(Math.min(nhi,F.maxFusedQp)-nlo)));
  const best=items.slice().sort((x,y)=>qpOf(y)-qpOf(x))[0];
  const result={slot:a.slot,e:int0(a.e),r:int0(a.r),lvl:Math.max(...items.map(x=>int0(x.lvl)||1)),gold:items.reduce((t,x)=>t+int0(x.gold),0),
    look:visualEra(best),qp,subs:(best.subs||[]).map(x=>({k:x.k,q:x.q}))};
  return {ok:true,reason:'',gold,result,fromStars:st,toStars:st+1,consumed:items.map(x=>x.id)}; }
function fuse(S,host,items){ const c=canFuse(S,host,items); if(!c.ok) return c;
  if(host&&typeof host.spendGold==='function'&&host.spendGold(c.gold)===false) return {ok:false,reason:'money',gold:c.gold};
  return c; }
/* ouro devolvido ao desmontar (50% do OURO investido; diamante não volta). A fps-30 usa no desmontar. */
const dismantleGold=item=>Math.floor(int0(item&&item.gold)*DATA.upgrade.dismantleGold);
/* TRANSFORMAÇÃO (regra do dono via PO): o item vai para a ERA ATUAL do jogador (eraMax) com a mesma raridade, os mesmos secundários e o
   mesmo VISUAL. A aparência fica em item.look (era do visual), separada de item.e (era de PODER, que todos os módulos leem). Nível volta a 1
   e o ouro investido zera (não volta, regra do contrato); o +N da forja continua no espaço. Só para a era atual: nem para trás, nem à frente.
   Secundários: MANTIDOS (são %, não dependem da era). Custo e cobrança: fps-30 (Sys.loot.transformCost / payTransform, tudo ou nada).
   Fluxo: planTransform (mostra custo e perdas) → transform (cobra pelo Sys.loot e, só se pagou, altera o item). */
const visualEra=it=>Number.isInteger(it&&it.look)?it.look:Number.isInteger(it&&it.ve)?it.ve:clamp(int0(it&&it.e),0,DATA.maxEra);
/* custo: Sys.loot.transformCost(S, host, item) da fps-30 → {ok, jump, toEra, essence, gold}. Sem o Sys.loot, só ouro (DATA.transform), sem essência. */
function transformCost(S,host,item,to){
  const LO=root.Sys&&root.Sys.loot; if(LO&&typeof LO.transformCost==='function'){ let c=null; try{ c=LO.transformCost(S,host,item); }catch(e){ c=null; }
    if(c&&typeof c==='object') return {gold:int0(c.gold),essence:int0(c.essence),ok:c.ok!==false,source:'loot'}; }
  const T=DATA.transform, r=clamp(int0(item&&item.r),0,MAXR()); let gold=0;
  for(let n=1;n<=T.goldLevels;n++) gold+=upgradeCost({lvl:n,r,e:to}).gold;
  return {gold,essence:0,ok:!(host&&typeof host.canSpendGold==='function')||host.canSpendGold(gold),source:'reserva'};
}
function canTransform(S,host,item){
  if(!item||!isSlot(item.slot)) return {ok:false,reason:'item'};
  const to=clamp(int0(host&&host.eraMax&&host.eraMax()),0,DATA.maxEra), from=clamp(int0(item.e),0,DATA.maxEra);
  if(from>to) return {ok:false,reason:'ahead',from,to};          // item de era à frente do jogador (não deveria existir)
  if(from===to) return {ok:false,reason:'same',from,to};         // já está na era atual
  // aviso para a tela: o ouro investido zera (o desmontar devolveria dismantleGold)
  const cost=transformCost(S,host,item,to);
  return {ok:cost.ok,reason:cost.ok?'':'money',from,to,gold:cost.gold,essence:cost.essence,
    lostGold:int0(item.gold),lostDismantle:dismantleGold(item),lostLevels:Math.max(0,(int0(item.lvl)||1)-1)};
}
const planTransform=canTransform;   // nome pedido pela fps-c9 (mesma função)
function transform(S,host,item){
  const c=canTransform(S,host,item); if(!c.ok) return Object.assign({ok:false},c);
  // cobra ANTES de mexer no item: Sys.loot.payTransform (essência + ouro, tudo ou nada); sem o Sys.loot, só o ouro pelo host
  const LO=root.Sys&&root.Sys.loot; let paid;
  if(LO&&typeof LO.payTransform==='function'){ let r=null; try{ r=LO.payTransform(S,host,item); }catch(e){ r=null; } paid=!!(r===true||(r&&r.ok)); }
  else paid=!(host&&typeof host.spendGold==='function')||host.spendGold(c.gold)!==false;
  if(!paid) return Object.assign({},c,{ok:false,reason:'money'});
  ensureSubs(item); item.look=visualEra(item); delete item.ve; item.e=c.to; item.lvl=1; item.gold=0; delete item.goldEstimated;
  return Object.assign({ok:true,item},c);
}
/* "EQUIPAR E UPAR ATÉ O NÍVEL DO JOGADOR" num toque (PO, v7). planUpgrade devolve o custo TOTAL antes de confirmar; upgradeTo cobra tudo de
   uma vez (uma moeda só) e sobe o item. Quem equipa é o jogo (depois do upgradeTo, ou antes; a FC é a mesma). */
function planUpgrade(S,host,item,currency,toLvl){
  if(isDormant(item,host)){ const from=int0(item&&item.lvl)||1; return {from,to:from,levels:0,gold:0,gems:0,currency:currency==='gems'?'gems':'gold',cost:0,ok:false,reason:'dormant',wakeEra:int0(item.e)}; }
  const pl=playerLevelOf(S,host), cap=upgradeCap(pl), from=int0(item&&item.lvl)||1;
  const to=clamp(int0(toLvl)||cap,from,cap), gems=currency==='gems'; let gold=0,gem=0;
  for(let n=from;n<to;n++){ const c=upgradeCost(Object.assign({},item,{lvl:n})); gold+=c.gold; gem+=c.gems; }
  const amt=gems?gem:gold, fn=gems?'canSpendGems':'canSpendGold', can=to>from&&(!(host&&typeof host[fn]==='function')||host[fn](amt));
  return {from,to,levels:to-from,gold,gems:gem,currency:gems?'gems':'gold',cost:amt,ok:can,reason:from>=DATA.maxItemLevel?'max':to<=from?'level':can?'':'money',
    playerLevel:pl,needLevel:Math.min(DATA.maxItemLevel,from+1),aboveCap:pl!=null&&from>pl};
}
function upgradeTo(S,host,item,currency,toLvl){
  const p=planUpgrade(S,host,item,currency,toLvl); if(!p.ok) return {ok:false,reason:p.reason,plan:p};
  const fn=p.currency==='gems'?'spendGems':'spendGold'; if(host&&typeof host[fn]==='function'&&host[fn](p.cost)===false) return {ok:false,reason:'money',plan:p};
  item.lvl=p.to; if(p.currency==='gold') item.gold=int0(item.gold)+p.gold; return {ok:true,lvl:item.lvl,paid:p.cost,currency:p.currency,plan:p};
}

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});   // atributos não são módulo de bônus (o fc.js chama compute)
/* qual asa é o item: item.wing se válido; item antigo sem o campo = pela regra de drop da era dele (determinístico, não sorteia) */
const wingForDrop=(era,diff)=>{ const W=DATA.wingDrop; return (W.demonEras.includes(int0(era))||int0(diff)>=W.demonDiff)?'demon':W.default; };
const wingLive=id=>{ const W=DATA.wingTypes[id]; return !!W&&(!W.nw||DATA.newWings===true||DATA.newWingReady[id]===true); };
const wingOf=it=>it&&it.slot==='wing'?(wingLive(it.wing)?it.wing:wingForDrop(it.e,it.diff)):null;   // asa nova desligada: desenha a de anjo/demônio (o item e o atributo não mudam)
/* brilho da asa para o engenheiro: {glow, color, particles} pela raridade do item + nível da Forja da asa (Sys.forge lv.wing, 0..15) */
function wingGlow(it,forgeLv){ const G=DATA.wingGlow, r=clamp(int0(it&&it.r),0,G.base.length-1), f=clamp(int0(forgeLv),0,15), fx=DATA.dropFx[Math.min(r,DATA.dropFx.length-1)];
  return {wing:wingOf(it),glow:Math.round((G.base[r]+G.perForge*f)*100)/100,color:fx&&fx.color,particles:r>=G.particlesFromR||f>=G.particlesFromForge,prism:r>=5}; }
/* vira as aprovadas pelo dono: 'ults' (Lendárias próprias entregues E aprovadas) | 'wings' (asas novas aprovadas). Devolve a lista ligada. */
function goLive(what){ if(what==='ults'){ const on=DATA.ownApproved.filter(k=>DATA.ownDelivered.includes(k)); for(const k of on) DATA.ownReady[k]=true; return on; }
  if(what==='wings'){ for(const k of DATA.wingsApproved) if(DATA.wingTypes[k]) DATA.newWingReady[k]=true; return DATA.wingsApproved.slice(); } return []; }
const wingCatalog=()=>Object.keys(DATA.wingTypes).map(id=>{ const W=DATA.wingTypes[id]; return {id,name:W.name,r:W.r==null?null:W.r,live:wingLive(id),soon:!wingLive(id),src:(W.src||[]).slice(),rarest:!!W.rarest}; });
const wingName=it=>{ const w=wingOf(it); return w?DATA.wingTypes[w].name:''; };
/* efeito visual da habilidade pela arma na mão: skillFx(arma|raridade, 's1'|'s2'|'s3') → {r, color, tint, particles, size, glow, shake, trail, flash, prism,
   dmgMult:1}. s1/s2 usam a mesma cor/tinta com menos força (size 1 e metade do excesso de partículas); dmgMult é sempre 1 (só visual). */
const FAM_BY_ERA=['club','gladius','sword','flintlock','revolver','rifle','plasma','infernal','celestial'];
const famOk=t=>typeof t==='string'&&!!DATA.weaponTypes[t]&&(DATA.weaponTypes[t].on===true||DATA.weaponTypes[t].approved===true);
/* família da arma: it.wt gravado; senão (save antigo) a da ARTE do item (it.look, senão it.e). Nunca a era do mapa. */
/* REGRA (dono): a ARTE do item manda. Nome, ícone (wKey era<look>_…) e batalha saem todos da era da arte (it.look; save antigo: it.ve, senão it.e).
   Família de era (clava…celeste) TEM de ser a da arte; só arco e bumerangue são famílias fora da era. Família de era gravada que não bate com a arte
   (defeito do dono: "um revólver saindo da arma de pedra") é ignorada aqui e corrigida no ensureWeaponType (carga do save). */
const artEraOf=it=>clamp(Number.isInteger(it&&it.look)?it.look:Number.isInteger(it&&it.ve)?it.ve:int0(it&&it.e),0,FAM_BY_ERA.length-1);
const famCoherent=it=>{ const W=DATA.weaponTypes[it&&it.wt]; return !!W&&(W.artEra==null||W.artEra===artEraOf(it)); };
function weaponType(it){ if(it&&famOk(it.wt)&&famCoherent(it)) return it.wt; return FAM_BY_ERA[artEraOf(it)]; }
/* grava a família no item (save antigo: chamar na migração; drop novo: rollWeaponType). Corrige família de era incoerente com a arte. */
function ensureWeaponType(it){ if(!it||typeof it!=='object'||it.slot!=='weapon') return null; if(!famOk(it.wt)||!famCoherent(it)){ if(it.wt) it.wtFixed=it.wt; it.wt=weaponType(Object.assign({},it,{wt:null})); } return it.wt; }
/* família de uma arma NOVA no drop: rollWeaponType(item, {level, era}, rnd) → 'bow' | 'boomerang' | a família da arte do item */
function rollWeaponType(it,ctx,rnd){ const r=typeof rnd==='function'?rnd():Math.random(), lv=int0(ctx&&ctx.level), era=int0(ctx&&ctx.era!=null?ctx.era:it&&it.e);
  let acc=0; for(const k of ['bow','boomerang']){ const W=DATA.weaponTypes[k]; if(W.on!==true||lv<int0(W.unlockLevel)||era<int0(W.fromEra)) continue; acc+=num(W.dropPct,0)/100; if(r<acc) return k; }
  return weaponType(Object.assign({},it||{},{wt:null})); }
/* pose da arma: 'melee' | 'gun' | 'ranged' | 'return' (plasma: pistola no Básico, como a arte de hoje) */
function weaponStyle(it){ const t=weaponType(it), W=DATA.weaponTypes[t]; return W.gunAtR0&&int0(it&&it.r)<=1?'gun':W.style; }
/* ultimate da arma: {type, name, artEra, tier: base|boost|own, sheet, ownReady, fallback, boost} — só família + raridade */
function ultOf(it){ const o=it&&typeof it==='object'?it:{r:it}, r=clamp(int0(o.r),0,DATA.ultTier.length-1), type=weaponType(o), W=DATA.weaponTypes[type], tier=DATA.ultTier[r];
  const base0=W.ult!==undefined?W.ult:(W.artEra!=null?'assets/anim/ult/era'+W.artEra+'_ult':null), baseReady=DATA.baseApproved.includes(type), base=baseReady?base0:null;   // base sem voto: ultimate por código
  const ownSheet='assets/anim/ult/'+type+'_legend', ready=tier==='own'&&DATA.ownReady[type]===true;
  return {type,name:W.name,artEra:W.artEra,style:weaponStyle(o),tier,sheet:ready?ownSheet:base,baseSheet:base0,baseReady,ownSheet,ownReady:ready,fallback:tier==='own'&&!ready,boost:tier==='base'||ready?null:Object.assign({},DATA.ultBoost)}; }
function skillFx(w,kind,host){ const r=clamp(int0(w&&typeof w==='object'?w.r:w),0,DATA.skillFx.length-1), F=Object.assign({},DATA.skillFx[r],{dmgMult:1});
  if(kind==='s3'||kind==null) F.ult=ultOf(w);
  if(kind==='s1'||kind==='s2'){ F.particles=Math.round((1+(F.particles-1)/2)*100)/100; F.size=1; F.flash=false; F.shake=kind==='s2'?Math.min(F.shake,1.15):1; }
  return F; }
/* atalho com o nome pedido pelo PO: o mesmo Sys.fc.delta (antes/depois: números ou Sys.fc.snapshot) */
const powerDelta=(a,b)=>{ const F=root.Sys&&root.Sys.fc; return F&&F.delta?F.delta(a,b):null; };
/* abbr(v, {pt}) → '999' · '1,2K' · '15,5K' · '3,4B' · '2,2Qa' (ou ' mil', ' mi', ' bi', ' tri', ' qua', ' qui' com ptNum). Vírgula decimal (pt-BR);
   a partir de 100 na unidade, sem casa decimal ('157 tri'). Negativo com '−'. Abaixo de 1.000: inteiro. */
function abbr(v,opt){ let n=num(v,0); const neg=n<0; n=Math.abs(n); const A=DATA.abbr, pt=opt&&opt.pt!=null?!!opt.pt:A.ptNum===true, U=pt?A.pt:A.en;
  let out; if(n<1000) out=String(Math.floor(n)); else { let i=-1; while(n>=1000&&i<U.length-1){ n/=1000; i++; } out=(n>=100?String(Math.round(n)):(Math.floor(n*10)/10).toFixed(1).replace('.',',').replace(',0',''))+U[i]; }
  return (neg?'−':'')+out; }
/* efeito do item caído no chão pela raridade (o engenheiro desenha; tabela única): dropFx(item|r) → {r, name, color, glow, particles, beam, pulse, sound, prism} */
const dropFx=w=>{ const r=clamp(int0(w&&typeof w==='object'?w.r:w),0,DATA.dropFx.length-1); return Object.assign({},DATA.dropFx[r],{sound:DATA.dropFx[r].sound?Object.assign({},DATA.dropFx[r].sound):null}); };
/* HERÓI DE REFERÊNCIA DA DIFICULDADE (13/11, depois da medida do Engenheiro: com o herói metade ATQ/metade VIDA, 100% da FC perdia todo Senhor).
   refFromFc(fc, stage) → atributos do jogador GRÁTIS TÍPICO daquela fase (nível típico, equipamento da era da fase na raridade e Forja típicas, 7 espaços,
   asa só com Nv 50 e raridade ≥2), escalados para Sys.fc.fcOfStats = fc (sem pet). Devolve {atk,hp,def,critRate,critDmg,aspd,level,era,rarity,forge,scale}.
   Função pura: sempre disponível. A CHAVE (DATA.refFc.on, setRefFc) só diz ao js/diff.js se deve usá-la no lugar do statsFromFC; desligada = nada muda.
   Nível típico por fase: tools/sim-paredes.js --levels (grátis ativo). Depois da 90: +1 nível a cada 3 fases, até 120. Medida: node tools/sim-chefe.js */
DATA.refFc={on:false,
  lv:[8,10,11,12,12,13,13,14,14,15,15,15,16,16,17,17,18,18,18,20,20,21,22,23,24,25,25,26,27,31,31,31,32,33,35,36,37,39,40,44,44,46,49,51,53,56,58,60,63,68,68,71,74,75,77,79,80,81,82,83,85,86,87,88,89,90,91,92,93,95,95,96,97,98,99,100,101,102,103,104,105,106,107,108,110,110,111,112,112,113],
  qp:4000};
const refRar=(L,e)=>L>=105&&e>=7?5:L>=85&&e>=5?4:L>=70&&e>=4?3:L>=25?2:L>=10?1:0, refForge=e=>Math.min(15,Math.round(2+1.6*e));
function setRefFc(on){ DATA.refFc.on=!!on; return DATA.refFc.on; }
const refFcOn=()=>DATA.refFc.on===true;
function refFromFc(fc,stage){ const F=root.Sys&&root.Sys.fc, R=DATA.refFc, LV=R.lv; if(!F||typeof F.stats!=='function'||typeof F.fcOfStats!=='function') return null;
  const st=Math.max(1,Math.floor(num(stage,1))||1), e=clamp(Math.floor((st-1)/10),0,Math.min(8,DATA.maxEra)), L=st<=LV.length?LV[st-1]:Math.min(120,LV[LV.length-1]+Math.floor((st-LV.length)/3));
  const f=((st-1)%10)/9, r=Math.min(refRar(L,e),MAXR()), forge=Math.round(refForge(Math.max(0,e-1))+(refForge(e)-refForge(Math.max(0,e-1)))*f);
  const S={sys:{level:{lvl:L,xp:0},forge:{lv:{}}}}; for(const s of DATA.slots) S.sys.forge.lv[s]=forge;
  const eq={}; for(const s of DATA.slots){ if(s==='wing'&&(L<50||r<2)) continue; eq[s]={slot:s,e,r:s==='weapon'&&r===3?2:r,lvl:L,subs:[],qp:R.qp,wing:'angel'}; }
  const h={equipped:()=>eq,eraMax:()=>e,level:()=>L,atk:()=>0,hp:()=>0,now:()=>0};
  let s0; try{ s0=F.stats(S,h)||{}; }catch(err){ return null; }
  const b={atk:num(s0.atk,0),hp:num(s0.hp,0),def:num(s0.def,0),critRate:num(s0.critRate!=null?s0.critRate:s0.crit,12),critDmg:num(s0.critDmg,100),aspd:num(s0.aspd,0)};
  const f0=F.fcOfStats(Object.assign({},b,{pet:{atk:0,heal:0}})), k=f0>0?Math.max(0,num(fc,0))/f0:1;
  return {atk:b.atk*k,hp:b.hp*k,def:b.def*k,critRate:b.critRate,critDmg:b.critDmg,aspd:b.aspd,level:L,era:e,rarity:r,forge,scale:k}; }
const API={DATA,refFromFc,setRefFc,refFcOn,goLive,wingGlow,wingCatalog,wingLive,abbr,dropFx,skillFx,weaponType,ensureWeaponType,rollWeaponType,weaponStyle,ultOf,FAM_BY_ERA,powerDelta,wingForDrop,wingOf,wingName,offerSync,setEra9,maxR:MAXR,maxHit,checkHit,SUB_KEYS,STAT_KEYS,subCount,rollSubs,ensureSubs,subValue,mainOf,itemStats,slotOpen,canEquip,equippedOf,itemsTotal,itemLevel,upgradeCap,isDormant,dormantView,dormantInfo,canFuse,fuse,lvlFactor,rollQuality,qualityMult,qualityStars,qpOf,levelBase,compute,upgradeCost,canUpgrade,upgrade,dismantleGold,planUpgrade,upgradeTo,visualEra,transformCost,canTransform,planTransform,transform,legacyGold,migrateItem,migrateSave,defReduction,hit,interval,bonus};
root.Sys=root.Sys||{}; root.Sys.stats=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
