/* Eonbound — Sys.loot: saque da horda por abate (moedas, gemas, itens, pedra de forja, ração, ovo de pet), estoque desses
   materiais, agrupamento "+N" e descrição dos pickups que a batalha anima voando ao HUD. Lógica pura, sem DOM.
   Números: reports/spec-loot-bau-instancias.md (fechados na v5.1). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-loot.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento) ---------------- */
const DATA={
  // peso de drop por raridade de ITEM (índice = r). "Mítica" r5 (VIP) não cai e não entra aqui.
  rarWeights:[70,22,6,1.6,0.4],
  eraBoost:[0,0.05,0.08,0.10,0.12],   // +fração no peso por era liberada (só r>=1)
  // ESPAÇOS de equipamento (regra do dono via PO) e peso de drop de cada um: arma e colete comuns, colar e asa raros.
  slots:['weapon','armor','hat','gloves','boots','necklace','wing'],
  slotWeights:{weapon:22, armor:22, hat:16, gloves:14, boots:14, necklace:8, wing:4},   // padrão = horda
  // distribuição POR FONTE (opts.source no rollItem). Asa: fonte principal = instância Chefe de Era; nunca na loja.
  slotWeightsBySource:{
    drop:    {weapon:22, armor:22, hat:16, gloves:14, boots:14, necklace:8,  wing:4},
    boss:    {weapon:20, armor:20, hat:15, gloves:15, boots:15, necklace:10, wing:5},
    chest:   {weapon:18, armor:18, hat:16, gloves:16, boots:16, necklace:10, wing:6},
    arsenal: {weapon:18, armor:18, hat:16, gloves:16, boots:16, necklace:10, wing:6},
    eraBossInst:{weapon:15, armor:15, hat:13, gloves:13, boots:13, necklace:16, wing:15},
    summon:  {weapon:20, armor:20, hat:15, gloves:15, boots:15, necklace:10, wing:5},
    shop:    {weapon:25, armor:25, hat:15, gloves:12, boots:12, necklace:11, wing:0},
  },
  // ASA: só a partir do nível 50 e só Épica (r2) ou acima. Se o sorteio cair em asa sem cumprir, sorteia OUTRO espaço (não melhora a raridade).
  wing:{minLevel:50, minR:2},
  // ATRIBUTOS SECUNDÁRIOS: Raro+ vem com 1, Épico+ com 2, sem repetir. Aqui só se sorteia QUAIS e uma qualidade q (0..1);
  // o valor de cada um e a FC são da fps-e2 (fc.js), que converte {k, q} em número.
  // formato fechado com a fps-e2: chaves dela; nunca igual ao principal do espaço; sem repetir. Se Sys.stats.rollSubs existir, é ela que sorteia.
  subs:{count:[0,1,2,2,2], keys:['atkPct','hpPct','defPct','critRate','critDmg','aspd'],
    excludeBySlot:{weapon:[], armor:['defPct'], hat:['hpPct'], gloves:['critRate'], boots:['aspd'], necklace:['critDmg'], wing:['atkPct','hpPct']}},
  prevEraChance:0.3,                  // item da era anterior
  // ERA FUTURA (PO, spec-qualidade-item.md §8; atrás de chave): era+1 ~0,5% · +2 ~0,05% · +3 ou mais ~0,005%, até a última era que existe.
  // O item de era futura fica "adormecido" no stats.js (fps-e2). O portão de raridade é o do JOGADOR (não muda).
  futureEra:{on:false, chances:[0.005,0.0005,0.00005], maxEra:6},
  // LANÇAMENTO: 28 armas, sem a Mítica (r3) de arma. Sorteio de ARMA que daria Mítico vira Épico.
  // Exceção: quando a fonte exige Mítico+ (minR>=3) e a sorte de +1 acerta, vai direto para Lendário. Armadura não muda.
  launch:{noMythicWeapon:true, mythicR:3},
  // PORTÕES DE RARIDADE (regra do dono via PO): raridade r só sai se o jogador tiver nível >= lvl E era liberada >= era.
  // Abaixo do portão, cai para a maior raridade permitida. Vale para item (drop, baú, instâncias) e para ovo de pet só de Mítico/Lendário (eggGateFrom).
  // Nível vem de host.level() (curva de XP da fps-c9). Sem host.level, o portão de NÍVEL fica desligado e só o de era vale.
  gates:[{lvl:1,era:0},{lvl:10,era:0},{lvl:25,era:0},{lvl:70,era:4},{lvl:85,era:5},{lvl:105,era:7}],   // [5] = Divino (só com o r5 ligado)
  // DIVINO (r5, eras 7-8; curva de 9 eras): entra no drop só quando o stats.js da fps-e2 liga o r5 (Sys.stats.maxR() === 5, via setEra9).
  // Peso 0,05 (1/8 do Lendário) com reforço de era; portão nível 105 + era 7. Não entra na invocação (tabela própria).
  divine:{weight:0.05, eraBoost:0.12},
  // DIFICULDADES (estrutura do dono via PO: 100 fases × Fácil/Médio/Difícil/Hell; proposta da fps-e2 em reports/progressao-9-eras.md §R2.5). CHAVE DESLIGADA.
  // d = 0..3 vem do inimigo (enemy.diff) ou do host (host.diff()). XP NÃO multiplica (teto diário; o calendário não muda). Tudo dentro dos portões.
  diff:{on:false,
    mult:[1,1.6,2.5,4],          // ouro e materiais (forja, ração, Essência), os mesmos das instâncias
    topBoost:[1,1.3,1.7,2.2],    // peso da raridade-teto permitida (portão) no sorteio do item
    qBest:[1,1,2,3],             // qualidade: melhor de N sorteios (drop grátis, nada pago)
    // 1ª VITÓRIA de cada fase (decisão do PO): SEM frações. Fase comum: só ouro e XP. 💎 só em MARCOS, inteiros, por dificuldade [Fácil, Médio, Difícil, Hell]:
    //   a cada 10 fases (10, 20, 30, 40, 60, 70, 80, 90) · chefe da fase 50 · Senhor da fase 100. Por era+dificuldade: Fácil 8×2+4+5 = 25 · Médio 8×3+6+8 = 38 ·
    //   Difícil 8×4+8+10 = 50 · Hell 8×6+12+15 = 75 (≈ ×1 / 1,5 / 2 / 3). Nas dificuldades exigidas em 180 dias: 9·25 + 7·38 + 5·50 + 2·75 = 891 💎.
    //   Hell: +1 fragmento de golem em cada marco. Ouro = goldk × ouro de um abate × multiplicador da dificuldade; XP = xpk × XP de um abate (vai como 'kill',
    //   passa pelo teto diário do v9, o calendário não muda). Repetir a fase não dá nada daqui (o farm é o dos abates).
    firstWin:{every:10, chief:50, lord:100,
      gems:{every:[2,3,4,6], chief:[4,6,8,12], lord:[5,8,10,15]},
      goldk:{stage:5, every:10, chief:20, lord:30}, xpk:{stage:3, every:5, chief:10, lord:15},
      golem:{pet:'golem', n:1}},    stagesPerEra:100,
    // chefe de fase (onda 5) só paga como chefe nas fases 50 e 100 de cada era/dificuldade (como as 10 por era da estrutura antiga). Nas outras, o chefe paga como inimigo comum:
    // sem isso, 100 chefes por era = ~10× o ouro, item garantido e a garantia de ovo de chefe. O Senhor da Era (eraBoss) não muda.
    bossStages:[50,100]},   // ligado: 100 fases por era; a XP por fase é normalizada (fase 100 = a antiga fase 10) para a XP/dia não mudar
  eggGateFrom:3,
  // goldMult = múltiplo de host.goldUnit() quando o inimigo não traz e.gold
  enemy:{
    common: {goldMult:1,    goldVar:0.10, gemChance:0.005, gems:[1,1], itemChance:0.035, minR:0, upChance:0,    coins:[1,3]},
    boss:   {goldMult:15.6, goldVar:0.05, gemChance:0,     gems:[0,0], itemChance:1,     minR:1, upChance:0.25, coins:[5,7]},
    eraBoss:{goldMult:31,   goldVar:0.05, gemChance:1,     gems:[3,5], itemChance:1,     minR:2, upChance:0.25, coins:[8,10]},
  },
  // materiais por classe: [chance, mín, máx]. forge = Pedra de Forja · food = ração de pet.
  // (pedra de PRÁTICA dos abates é do Sys.practice.onKill da fps-e2; não sai daqui, para não pagar duas vezes)
  mats:{
    common: {forge:[0.01,1,1],  food:[0.004,1,1]},   // forja 0,7% → 1% (PO após a v7.1: faltava um pouco; não depende de desmontar)
    boss:   {forge:[1,1,2],     food:[1,3,5]},
    eraBoss:{forge:[1,3,5],     food:[1,15,20]},
  },
  // ovos de pet (o ovo tem raridade; quem choca é o módulo de pets)
  eggs:{
    firstBossGuaranteed:true,          // 1º chefe de fase do jogo: ovo Básico garantido
    bossChance:0.10, pity:10,          // chefe de fase: 10%, garantido no 10º sem ovo
    bossTable:[50,32,13,5,0],
    eraBossFirstMin:[0,1,1,2,2,3,3],   // 1ª vitória sobre o Senhor de cada era: ovo garantido com raridade mínima
    eraBossRepeatChance:0.25,
    eraBossTable:[40,35,18,6,1],
  },
  // XP POR ABATE (ordem do dono via PO): orbes de experiência no chão, valor baixo que sobe com a ERA e a FASE.
  // xp = base[classe] × (1 + eraScale·era) × (1 + stageScale·(faseNaEra−1)). Valores da v7.1 (docs/balance.json, bloco loot.xp).
  // Quem soma ao nível é o Sys.level.addXp (fps-e2). O Sys.level.onKill NÃO deve ser chamado nos abates (seria XP em dobro).
  // eraScale: número ou VETOR por era (calibração v8: era 1 saía em 25 min e era 2 em 49, metas 40-50 e 90-120). Mult. da era e = 1 + eraScale[e]·e.
  xp:{kill:2.2, boss:33, eraBoss:264, eraScale:[1,0.15,0.15,0.15,0.15,0.15,0.15], stageScale:0.05,   // v7.1: ×2,2 para o ritmo real da build (~24 abates/min em x2)
      orbs:{common:[1,2],boss:[4,6],eraBoss:[8,10]}, maxOrbs:10},
  // INVOCAÇÃO (decisão do dono via PO): SÓ COM OURO ganho jogando (nunca gemas) + 1 grátis por dia. Preço x1 = 1.000 × 4^era (PO após a v7: com 300 sobrava ouro
  // até a era 3); x10 = 9 × x1. Raridade pela tabela de invocação do jogo
  // (50/28/14/6/2), com portões e arma Mítica→Épica; espaços pela fonte 'summon'.
  // NOMES dos 5 espaços novos, por era (0 Pré-História … 6 Futurista) e raridade (Básico → Lendário). Arma e colete já têm nome no jogo (ERAS[e].w / .a).
  // A asa só existe Épica+, mas as 5 raridades ficam preenchidas para a tabela ser regular. O nome segue a era de APARÊNCIA (item.look ?? item.e).
  names:{
    hat:[
      ['Faixa de Cipó','Capuz de Pele','Elmo de Crânio','Coroa de Presas','Cocar do Xamã'],
      ['Faixa de Linho','Elmo de Couro','Elmo de Bronze','Elmo Coríntio','Elmo de Aquiles'],
      ['Capuz de Lã','Elmo de Ferro','Elmo de Cavaleiro','Grande Elmo Rúnico','Coroa do Rei Dragão'],
      ['Lenço de Marujo','Tricórnio de Couro','Tricórnio de Oficial','Bicorne do Comodoro','Chapéu do Almirante'],
      ['Boné de Operário','Cartola de Latão','Óculos de Inventor','Elmo a Vapor','Coroa Tesla'],
      ['Boné Tático','Capacete Militar','Capacete Balístico','Capacete de Visão Noturna','Capacete Stealth'],
      ['Viseira Neon','Capacete Espacial','Elmo de Íons','Elmo Quântico','Coroa do Vazio'],
      ['Capuz Chamuscado','Elmo de Obsidiana','Chifres de Cinza','Elmo do Abismo','Coroa das Chamas'],   // era 7 Submundo (curva de 9 eras)
      ['Tiara de Nuvem','Elmo de Prata','Halo Seráfico','Elmo do Firmamento','Coroa do Arcanjo']],
    gloves:[
      ['Faixas de Couro','Luvas de Pele','Garras de Osso','Manoplas de Mamute','Garras do Grande Felino'],
      ['Braçadeiras de Linho','Luvas de Couro','Braçadeiras de Bronze','Manoplas de Gladiador','Punhos de Hércules'],
      ['Luvas de Lã','Luvas de Cota','Manoplas de Ferro','Manoplas Rúnicas','Manoplas do Dragão'],
      ['Luvas de Lona','Luvas de Couro Curtido','Luvas de Mosqueteiro','Luvas de Duelista','Luvas do Capitão Fantasma'],
      ['Luvas de Operário','Luvas de Latão','Luvas Mecânicas','Manoplas a Vapor','Manoplas Tesla'],
      ['Luvas de Treino','Luvas Táticas','Luvas Blindadas','Luvas de Exoesqueleto','Luvas Stealth'],
      ['Luvas Neon','Luvas de Nanofibra','Luvas de Plasma','Manoplas Quânticas','Manoplas do Vazio'],
      ['Luvas Chamuscadas','Manoplas de Obsidiana','Garras de Cinza','Manoplas do Abismo','Punhos das Chamas'],
      ['Luvas de Nuvem','Manoplas de Prata','Luvas Seráficas','Manoplas do Firmamento','Mãos do Arcanjo']],
    boots:[
      ['Pés de Couro Cru','Botas de Pele','Botas de Couro de Urso','Botas de Mamute','Passos do Caçador Ancestral'],
      ['Sandálias de Corda','Sandálias de Couro','Grevas de Bronze','Grevas Espartanas','Sandálias Aladas de Hermes'],
      ['Botas de Lã','Botas de Couro','Escarpes de Ferro','Escarpes Rúnicos','Botas do Paladino Solar'],
      ['Botas de Convés','Botas de Couro','Botas de Cavalaria','Botas de Corsário','Botas do Almirante'],
      ['Botinas de Fábrica','Botas de Latão','Botas de Engrenagem','Botas a Vapor','Botas Relâmpago Tesla'],
      ['Tênis de Corrida','Coturno Tático','Coturno Blindado','Botas de Exoesqueleto','Botas Stealth'],
      ['Botas Neon','Botas Magnéticas','Botas Antigravidade','Botas Quânticas','Botas do Vazio'],
      ['Botas Chamuscadas','Grevas de Obsidiana','Botas de Cinza','Grevas do Abismo','Passos das Chamas'],
      ['Sandálias de Nuvem','Grevas de Prata','Botas Seráficas','Grevas do Firmamento','Asas nos Pés do Arcanjo']],
    necklace:[
      ['Colar de Pedrinhas','Colar de Dentes','Colar de Garras','Amuleto de Âmbar','Talismã do Xamã'],
      ['Colar de Contas','Colar de Bronze','Medalhão do Senado','Colar do Faraó','Amuleto do Olimpo'],
      ['Cordão de Ferro','Medalhão de Ferro','Relicário do Templário','Amuleto Rúnico','Graal Pendente'],
      ['Cordão de Bússola','Medalha de Bravura','Colar de Dobrões','Medalhão da Coroa','Amuleto do Kraken'],
      ['Relógio de Bolso','Medalhão de Latão','Engrenagem Pendente','Núcleo a Vapor','Bobina Tesla'],
      ['Placa de Identificação','Medalha de Serviço','Rádio de Pescoço','Medalha de Honra','Chip de Comando'],
      ['Pingente Neon','Chip de Íons','Núcleo de Plasma','Cristal Quântico','Singularidade Pendente'],
      ['Colar de Brasas','Amuleto de Obsidiana','Talismã de Cinza','Olho do Abismo','Coração das Chamas'],
      ['Pingente de Nuvem','Medalhão de Prata','Amuleto Seráfico','Estrela do Firmamento','Pena do Arcanjo']],
    // asa: SEM tabela por era (dono: item próprio, arte fixa anjo/demoníaca) — o nome vem de Sys.stats.wingName (wingTag/itemName abaixo)
  },
  summon:{rarWeights:[50,28,14,6,2], cost:{base:500, eraGrowth:4, x10Mult:9}, freePerDay:1,   // PO: 1.000 → 500 (no começo só dava a grátis)
    pity:10},   // garantia: a cada 10 invocações sem a MELHOR raridade liberada, a 10ª vem nela (estava no jogo; agora é daqui)
  // DESMONTAR (regra do dono "MELHORIA DE ITEM"): devolve 50% do OURO investido no item (diamante não volta).
  // forge = pedras de forja por raridade (CONFIRMADO pelo PO; se a v7 mostrar sobra, baixa-se a tabela em vez de tirar).
  dismantle:{goldRefund:0.5, forge:[0,1,2,4,10]},
  // ESSÊNCIA DA ERA (regra do dono via PO: TRANSFORMAÇÃO de item). Cai do Senhor da Era (campanha) e do Chefe de Era (instância).
  // O estoque fica AQUI (quem gasta é a transformação, também daqui). ~150 no jogo todo com 1 Chefe de Era por dia.
  essence:{eraBossFirst:5, eraBossRepeat:[2,3], instance:[1,2,3]},
  // TRANSFORMAÇÃO: item da era a → era atual b (mesma raridade e visual; nível volta a 1). Custo por raridade e por salto (b−a):
  // essência = essence[r] × salto · ouro = goldBase[r] × 4^b × salto. O ouro investido NÃO volta (contrato). Essência ÚNICA (não por era).
  // Lendária de 1 salto: 12 essências (~6 vitórias no Chefe de Era Normal) + 6.000·4^b de ouro (~75 fases de ouro): não mata o loot.
  transform:{essence:[1,2,4,7,12], goldBase:[100,300,900,2500,6000], goldEra:4},   // PO após a v7: metade (as pedras sobravam)
  maxCoins:10, maxGemPickups:5,
  group:{window:0.6},
  stagesPerEra:10,
  // ração offline (5 por 8 h) NÃO é daqui: é do Sys.pet.onOffline (fps-e2), para não pagar em dobro
  offline:{killsPerMin:6, itemRate:0.1, capHours:8, maxItems:20},
};
// multiplicadores externos (VIP, prática de Coleta, eventos). Fora do save.
const params={mult:{gold:1, gems:1, item:1, forge:1, food:1, xp:1}, offlineMult:1, offlineCapHours:null};
const MAT_KEYS=['forge','food','xp','essence','stones'];   // essence não tem destino externo: o estoque é S.sys.loot.mat.essence · stones = pedras de TREINO (Sys.practice), não as de forja

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const randInt=(rng,a,b)=>a+Math.floor(rng()*(b-a+1));
const pad=n=>String(n).padStart(2,'0');
function dayKey(ms){ const C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==="function") return C.dayKey(ms);   // fuso único (Sys.clock.DATA.tzOffsetMin; com servidor, Brasília)
  const d=new Date(ms); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
const nowOf=host=>num(host&&host.now&&host.now(),Date.now());
function eraMaxOf(host){ return clamp(Math.floor(num(host&&host.eraMax&&host.eraMax(),0)),0,99); }
function goldUnitOf(host,stage){ const g=num(host&&host.goldUnit&&host.goldUnit(stage),1); return g>0?g:1; }
function pickW(rng,w){ const tot=w.reduce((s,x)=>s+Math.max(0,x),0); if(tot<=0) return 0; let x=rng()*tot;
  for(let i=0;i<w.length;i++){ x-=Math.max(0,w[i]); if(x<=0) return i; } return w.length-1; }

function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.loot.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.loot; if(!o||typeof o!=='object') o=S.sys.loot={};
  o.v=2; for(const k of ['kills','gold','gems','items','bosses']) o[k]=int0(o[k]);
  if(!Array.isArray(o.byR)) o.byR=[];
  if(!o.mat||typeof o.mat!=='object') o.mat={};
  for(const k of MAT_KEYS) o.mat[k]=int0(o.mat[k]);
  if(!o.mat.eggs||typeof o.mat.eggs!=='object'||Array.isArray(o.mat.eggs)) o.mat.eggs={};
  for(const r in o.mat.eggs){ const n=int0(o.mat.eggs[r]); if(!/^\d+i?$/.test(r)||!n) delete o.mat.eggs[r]; else o.mat.eggs[r]=n; }   // 'r' = drop · 'ri' = instância
  if(!o.egg||typeof o.egg!=='object') o.egg={};
  o.egg.pity=int0(o.egg.pity); o.egg.first=!!o.egg.first;
  if(!Array.isArray(o.egg.eraFirst)) o.egg.eraFirst=[];
  if(!Array.isArray(o.heldItems)) o.heldItems=[];   // itens de pacote (correio/login/evento) esperando o portão
  o.heldItems=o.heldItems.filter(h=>h&&DATA.slots.includes(h.slot)&&Number.isInteger(h.r)).slice(0,100);
  if(!Array.isArray(o.held)) o.held=[];
  o.held=o.held.filter(hd=>hd&&Number.isInteger(hd.r)&&hd.r>=0&&hd.r<=9).map(hd=>({r:hd.r,source:hd.source==='instance'?'instance':'drop'}));
  if(!o.today||typeof o.today!=='object') o.today={day:''};
  if(typeof o.today.day!=='string') o.today.day='';
  for(const k of MAT_KEYS) o.today[k]=int0(o.today[k]);
  return o;
}
/* contadores do dia (missão diária "Colete 15 pedras de forja" lê today.forge) */
function today(S,host){ const o=ensure(S), k=dayKey(nowOf(host)); if(o.today.day!==k){ o.today={day:k}; for(const m of MAT_KEYS) o.today[m]=0; } return o.today; }
function todayCount(S,host,key){ return int0(today(S,host)[key]); }

/* ---------------- raridade de item ---------------- */
/* Divino ligado? (o stats.js da fps-e2 decide: maxR() = 5 com as 9 eras ligadas) */
function divineOn(){ const St=root.Sys&&root.Sys.stats; try{ return !!(St&&typeof St.maxR==='function'&&St.maxR()>=5); }catch(e){ return false; } }
function rarWeights(era,boost){
  era=clamp(Math.floor(num(era,0)),0,99); boost=num(boost,0);
  const w=DATA.rarWeights.map((w,r)=>r===0?w:w*(1+num(DATA.eraBoost[r],0)*era)*(1+boost));
  if(divineOn()) w.push(DATA.divine.weight*(1+DATA.divine.eraBoost*era)*(1+boost));
  return w;
}
const maxDropR=()=>DATA.rarWeights.length-1+(divineOn()?1:0);
/* devolve {r, up} (up = a sorte de +1 acertou) */
function rollRarityEx(rng,era,o){
  o=o||{}; let r=pickW(rng,Array.isArray(o.rarWeights)?o.rarWeights:rarWeights(era,o.boost));   // rarWeights: tabela própria (invocação)
  r=Math.max(r,clamp(Math.floor(num(o.minR,0)),0,maxDropR()));
  let up=false; if(num(o.upChance,0)>0&&rng()<o.upChance){ r++; up=true; }
  return {r:clamp(r,0,maxDropR()),up};
}
function rollRarity(rng,era,o){ return rollRarityEx(rng,era,o).r; }
/* portão: maior raridade permitida para o jogador agora */
function levelOf(host){ const f=host&&host.level; if(typeof f!=='function') return Infinity; const v=num(f(),NaN); return isFinite(v)?v:Infinity; }
/* PONTO ÚNICO DO PORTÃO (usado por rollItem → drop, baú, invocação, instâncias; e por capEggR → ovos).
   Portões cumulativos: sobe degrau a degrau e para no primeiro que falha. */
function maxAllowedR(host){
  const lv=levelOf(host), em=eraMaxOf(host), top=Math.min(DATA.gates.length-1,maxDropR());
  let r=0; while(r<top){ const g=DATA.gates[r+1]; if(lv>=num(g.lvl,0)&&em>=num(g.era,0)) r++; else break; }
  return r;
}
/* raridade de OVO após o portão (só Mítico/Lendário são barrados) */
function capEggR(host,r){ r=int0(r); if(r<DATA.eggGateFrom) return r; return Math.max(Math.min(r,maxAllowedR(host)),DATA.eggGateFrom-1); }
/* regra do lançamento: arma Mítica não existe ainda */
function launchFix(slot,r,minR,up){
  const L=DATA.launch; if(!L.noMythicWeapon||slot!=='weapon'||r!==L.mythicR) return r;
  return (num(minR,0)>=L.mythicR&&up)?Math.min(maxDropR(),L.mythicR+1):L.mythicR-1;
}
const wingOk=(host,r)=>levelOf(host)>=DATA.wing.minLevel&&r>=DATA.wing.minR;
/* espaço sorteado pelos pesos; asa só se wingOk (senão sorteia entre os outros) */
function rollSlot(rng,host,r,source){
  const W=DATA.slotWeightsBySource[source]||DATA.slotWeights, list=DATA.slots.filter(s=>s!=='wing'||wingOk(host,r));
  return list[pickW(rng,list.map(s=>num(W[s],0)))]||'weapon';
}
/* atributos secundários: [{k, q}] distintos (k = chave, q = qualidade 0..1 para a fps-e2 converter em valor) */
function rollSubs(rng,r,slot){
  const St=root.Sys&&root.Sys.stats; if(St&&typeof St.rollSubs==='function') return St.rollSubs(slot,r,rng);   // a fps-e2 sorteia, se carregada
  const ex=(DATA.subs.excludeBySlot||{})[slot]||[], n=num(DATA.subs.count[r],0), pool=DATA.subs.keys.filter(k=>!ex.includes(k)), out=[];
  for(let i=0;i<n&&pool.length;i++){ const j=Math.floor(rng()*pool.length); out.push({k:pool.splice(j,1)[0],q:Math.round(rng()*1000)/1000}); }
  return out;
}
/* VIP (Sys.vip.perks(S) da fps-e2): {chestCapAdd, instanceKeysAdd, xpPct, goldPct, offlineMult, ...}. Sem VIP/módulo: zeros e 1. */
function vipPerks(S){ const V=root.Sys&&root.Sys.vip; let p=null; try{ p=V&&typeof V.perks==='function'?V.perks(S):null; }catch(e){ p=null; }
  p=p||{}; return {chestCapAdd:int0(p.chestCapAdd),instanceKeysAdd:int0(p.instanceKeysAdd),xpPct:Math.max(0,num(p.xpPct,0)),goldPct:Math.max(0,num(p.goldPct,0)),offlineMult:Math.max(1,num(p.offlineMult,1))}; }
/* QUALIDADE (fps-e2, atrás de Sys.stats.DATA.quality.on): qp 0..10.000 por item criado. Desligada: sem o campo (o stats trata como a média). */
function qualityOf(rng){ const St=root.Sys&&root.Sys.stats; try{ if(St&&St.DATA&&St.DATA.quality&&St.DATA.quality.on&&typeof St.rollQuality==='function') return St.rollQuality(rng); }catch(e){} return null; }
/* era do item sorteado: liberada (70%) ou anterior (30%); com futureEra.on, raramente 1-3+ eras à frente */
function rollEra(rng,em){
  const F=DATA.futureEra; let e=(em>0&&rng()<DATA.prevEraChance)?em-1:em;
  // segurança (fps-e2): só sorteia era futura se a trava do "adormecido" (Sys.stats.DATA.futureEra.on) também estiver ligada;
  // sem ela, o item futuro renderia cheio e voltariam os saltos de +7 a +11 fases.
  const St=root.Sys&&root.Sys.stats, dormOk=!!(St&&St.DATA&&St.DATA.futureEra&&St.DATA.futureEra.on);
  if(F&&F.on&&dormOk){ const x=rng(), c=F.chances, max=num((root.Sys&&root.Sys.stats&&root.Sys.stats.DATA&&root.Sys.stats.DATA.maxEra),F.maxEra);
    const k=x<c[2]?3:x<c[1]+c[2]?2:x<c[0]+c[1]+c[2]?1:0; if(k) e=Math.min(max,em+k); }
  return e;
}
/* dificuldade: a chance de o item sair NA raridade-teto (o que passa do portão também cai nela) vira × b (até 95%). Pesos acima do teto saem. */
function topWeights(w,cap,b){
  const tot=w.reduce((s,x)=>s+x,0), top=w.slice(cap).reduce((s,x)=>s+x,0), rest=tot-top; if(!(tot>0)||!(rest>0)) return w;
  const p=Math.min(0.95,(top/tot)*b), out=w.slice(0,cap); out.push(p*rest/(1-p)); return out;
}
/* um item {slot,r,e,subs}. opts: era (fixa), minR, upChance, boost, slot (força o espaço),
   source ('drop'|'boss'|'chest'|'arsenal'|'eraBossInst'|'summon'|'shop') = distribuição de espaços */
/* ORIGEM do item (Cofre do Mercado, reports/backend-economia.md): de onde veio. Só itens GANHOS jogando entram no mercado; 'shop'/'offer'/'gift' não.
   O campo é só informativo no jogo solo (não muda poder nem regra). */
const ORIGIN_OF={drop:'drop',boss:'boss',chest:'chest',arsenal:'instance',eraBossInst:'instance',summon:'summon',shop:'shop'};
/* ASA (dono): cada asa é anjo ou demoníaca, fixa (não muda por era nem raridade). A regra é do stats (Sys.stats.wingForDrop / DATA.wingDrop). */
/* ARMA (fps-e2, ordem do dono): família gravada ao criar (arco/bumerangue com as chances e portões do Sys.stats; senão a da arte). Sem o stats, o migrateItem deduz. */
function wtTag(it,host,rng){ if(!it||it.slot!=='weapon') return it; const St=root.Sys&&root.Sys.stats;
  try{ if(St&&typeof St.rollWeaponType==='function') it.wt=St.rollWeaponType(it,{level:levelOf(host),era:it.e},rng); }catch(e){} return it; }
function wingTag(it,diff){ if(!it||it.slot!=='wing') return it; const St=root.Sys&&root.Sys.stats;
  try{ if(St&&typeof St.wingForDrop==='function') it.wing=St.wingForDrop(it.e,diff); }catch(e){} return it; }
function rollItem(host,opts){
  opts=opts||{}; const rng=rngOf(host), em=eraMaxOf(host);
  const e=opts.era!=null?clamp(Math.floor(num(opts.era,em)),0,99):rollEra(rng,em);
  const cap=maxAllowedR(host);
  if(num(opts.topBoost,1)>1&&!Array.isArray(opts.rarWeights)) opts=Object.assign({},opts,{rarWeights:topWeights(rarWeights(em,opts.boost),cap,opts.topBoost)});   // dificuldade: mais teto
  const x=rollRarityEx(rng,em,opts);
  const r0=Math.min(x.r,cap);                                   // raridade já com o portão, para decidir se a asa é possível
  const slot=DATA.slots.includes(opts.slot)?opts.slot:rollSlot(rng,host,r0,opts.source);
  let r=launchFix(slot,x.r,opts.minR,x.up);
  if(r>cap) r=launchFix(slot,cap,0,false);                      // portão: cai para a maior permitida (e arma não vira Mítica)
  if(slot==='wing') r=Math.max(r,Math.min(DATA.wing.minR,maxDropR()));   // asa forçada: nunca abaixo de Épica
  const it={slot,r,e,subs:rollSubs(rng,r,slot),origin:opts.origin||ORIGIN_OF[opts.source]||'drop'}; let qp=qualityOf(rng);
  if(qp!=null) for(let k=1;k<Math.max(1,int0(opts.qBest));k++) qp=Math.max(qp,qualityOf(rng));   // dificuldade: melhor de N (Difícil 2, Hell 3)
  if(qp!=null) it.qp=qp;
  wtTag(it,host,rng);
  return wingTag(it,opts.diff!=null?opts.diff:diffOf(null,host));
}
/* ---------------- invocação por ouro ---------------- */
function summonCost(host,n){
  const C=DATA.summon.cost, one=Math.round(C.base*Math.pow(C.eraGrowth,eraMaxOf(host)));
  return n>=10?Math.round(one*C.x10Mult):one;
}
function summonState(S,host){ const o=ensure(S), k=dayKey(nowOf(host));
  if(!o.summon||typeof o.summon!=='object') o.summon={day:k,free:0,pity:0};
  if(o.summon.day!==k){ o.summon.day=k; o.summon.free=0; }          // a grátis renova; a garantia (pity) NÃO zera na virada
  o.summon.pity=int0(o.summon.pity); return o.summon; }
const summonFreeLeft=(S,host)=>Math.max(0,DATA.summon.freePerDay-int0(summonState(S,host).free));
/* CHANCES EFETIVAS da invocação para o jogador AGORA (para a tela; o engenheiro não precisa recalcular):
   tabela 50/28/14/6/2 com o PORTÃO aplicado (o que passa do portão cai na maior permitida) e a regra da ARMA sem Mítica (na arma, Mítico vira Épico).
   Devolve {byR:[%...], best, cap, weaponShare, pity} em %, somando 100. A garantia a cada 10 não entra nas chances (vai em pity). */
function summonOdds(host){
  const w=DATA.summon.rarWeights, tot=w.reduce((s,x)=>s+x,0), cap=maxAllowedR(host), base=w.map(x=>x/tot);
  const gate=base.map((p,r)=>r<cap?p:0); gate[cap]=base.slice(cap).reduce((s,x)=>s+x,0);
  const W=DATA.slotWeightsBySource.summon, list=DATA.slots.filter(s=>s!=='wing'||levelOf(host)>=DATA.wing.minLevel);
  const wt=list.reduce((s,k)=>s+num(W[k],0),0), ws=wt?num(W.weapon,0)/wt:0;
  const weap=gate.slice(); if(DATA.launch.noMythicWeapon&&weap[3]){ weap[2]+=weap[3]; weap[3]=0; }
  const byR=gate.map((p,r)=>Math.round(((1-ws)*p+ws*weap[r])*10000)/100);
  const best=byR.reduce((b,p,r)=>p>0?r:b,0);
  return {byR,best,cap,weaponShare:Math.round(ws*1000)/10,pity:{every:num(DATA.summon.pity,0),r:cap,weaponAtMythicGate:cap===3?2:cap}};
}
/* invoca n (1 ou 10) itens. opts.free: usa a grátis do dia (só n=1). Cobra por host.spendGold(valor) → true/false (o jogo debita).
   Devolve {ok, cost, items, free} ou {ok:false, reason:'ouro'|'gratis'|'n'|'host'}. Entrega os itens por host.addItem. */
function summon(S,host,n,opts){
  opts=opts||{}; n=n===10?10:n===1?1:0; if(!n) return {ok:false,reason:'n'};
  const st=summonState(S,host);
  let cost=0;
  if(opts.free){ if(n!==1) return {ok:false,reason:'n'}; if(summonFreeLeft(S,host)<1) return {ok:false,reason:'gratis'}; }
  else { cost=summonCost(host,n); if(!host||typeof host.spendGold!=='function') return {ok:false,reason:'host'}; if(!host.spendGold(cost)) return {ok:false,reason:'ouro',cost}; }
  if(opts.free) st.free++;
  const items=[], best=maxAllowedR(host), P=num(DATA.summon.pity,0);
  for(let i=0;i<n;i++){
    let it=rollItem(host,{source:'summon',rarWeights:DATA.summon.rarWeights});
    const top=it.r>=best||(it.slot==='weapon'&&best===3&&it.r===2);   // arma no portão Mítico: Épico já é a melhor possível
    if(top) st.pity=0; else st.pity++;
    if(P&&!top&&st.pity>=P){ it=rollItem(host,{source:'summon',rarWeights:DATA.summon.rarWeights,minR:best}); it.pity=true; st.pity=0; }
    items.push(it);
  }
  const o=ensure(S); for(const it of items){ if(host.addItem) host.addItem(itemOut(it)); o.items++; o.byR[it.r]=(o.byR[it.r]||0)+1; }
  return {ok:true,cost,free:!!opts.free,items};
}
/* o item como o jogo recebe (host.addItem). Nível é do ITEM (1-100, teto = nível do jogador); item novo nasce no 1, sem ouro investido.
   gold = ouro investido em melhorias (nome do stats.js da fps-e2, que soma a cada melhoria por ouro; diamante NÃO entra). */
const itemOut=it=>{ const o={slot:it.slot,r:it.r,e:it.e,lvl:1,gold:0,subs:(it.subs||[]).map(s=>({k:s.k,q:s.q}))}; if(it.qp!=null) o.qp=it.qp; if(it.origin) o.origin=it.origin; return o; };
/* ---------------- entrega de PACOTE (correio, login diário, eventos) ----------------
   bundle = {gold?, goldk? (× ouro de um abate), gems?, essence?, forge?, food?, xp?, skin?, items?:[{slot, r, e?}], eggs?:[r]}
   Regras únicas: item acima do portão (ou asa sem nível 50 / abaixo de Épica) fica GUARDADO e sai na era da liberação; ovo acima do portão fica GUARDADO
   (presente não é rebaixado); arma não tem Mítica no lançamento. Nada aqui é sorteio: o pacote diz exatamente o que se ganha. */
function canHold(host,spec){ if(spec.r>maxAllowedR(host)) return false; if(spec.slot==='wing'&&!wingOk(host,spec.r)) return false; return true; }
function makeFixedItem(host,spec){ const rng=rngOf(host); let r=clamp(int0(spec.r),0,maxDropR()); if(spec.slot==='weapon'&&r===DATA.launch.mythicR) r--;
  const e=spec.e!=null?clamp(int0(spec.e),0,99):eraMaxOf(host); const it={slot:spec.slot,r,e,lvl:1,gold:0,subs:rollSubs(rng,r,spec.slot),origin:spec.origin||'reward'};
  const qp=qualityOf(rng); if(qp!=null) it.qp=qp; wtTag(it,host,rng); return wingTag(it,spec.diff!=null?spec.diff:diffOf(null,host)); }
function grantBundle(S,host,b){
  const o=ensure(S), out={gold:0,gems:0,items:[],heldItems:[],eggs:[],heldEggs:[],skin:null}; if(!b||typeof b!=='object') return out;
  const gold=int0(b.gold)+Math.round(num(b.goldk,0)*goldUnitOf(host)); if(gold){ out.gold=gold; if(host.addGold) host.addGold(gold); }
  if(int0(b.gems)){ out.gems=int0(b.gems); if(host.addGems) host.addGems(out.gems); }
  for(const k of MAT_KEYS) if(int0(b[k])){ addMat(S,host,k,int0(b[k])); out[k]=int0(b[k]); }
  if(b.skin){ out.skin=b.skin; if(host.addSkin) host.addSkin(b.skin); }
  for(const sp of Array.isArray(b.items)?b.items:[]){ if(!sp||!DATA.slots.includes(sp.slot)) continue;
    const spec={slot:sp.slot,r:clamp(int0(sp.r),0,maxDropR()),origin:typeof b.origin==='string'?b.origin:'reward'};   // origem: quem chama diz ('pass', 'mail', 'event', 'arena'...)
    if(canHold(host,spec)){ const it=makeFixedItem(host,{...spec,e:sp.e}); out.items.push(it); if(host.addItem) host.addItem(it); }
    else { o.heldItems.push(spec); out.heldItems.push({...spec,needLevel:Math.max(num((DATA.gates[spec.r]||{}).lvl,1),spec.slot==='wing'?DATA.wing.minLevel:1)}); } }
  // fragmentos de pet (ex.: Prismático nos eventos; fps-e2, atrás de Sys.pet.DATA.v4): {petId: n} → Sys.pet.addFragments (pet não nascido guarda)
  if(b.petFrags&&typeof b.petFrags==='object'){ const Pt=root.Sys&&root.Sys.pet; out.petFrags={};
    for(const id in b.petFrags){ const n=int0(b.petFrags[id]); if(n&&Pt&&typeof Pt.addFragments==='function'){ const r=Pt.addFragments(S,id,n,host);
      if(!(r&&typeof r==='object'&&(r.ok===false||r.reason))) out.petFrags[id]=n; } } }   // só anota o que o pet.js aceitou (recusa = chave v4 desligada)
  for(const r0 of Array.isArray(b.eggs)?b.eggs:[]){ const r=clamp(int0(r0),0,maxDropR());
    if(capEggR(host,r)<r){ o.held.push({r,source:'drop'}); out.heldEggs.push({r,needLevel:eggNeedLevel(r)}); }
    else out.eggs.push(addEgg(S,host,r)); }
  return out;
}
/* nome do item dos espaços novos (chapéu, luvas, botas, colar, asa); arma e colete: null (o jogo usa ERAS[e].w / .a) */
function itemName(it){
  if(it&&it.slot==='wing'){ const St=root.Sys&&root.Sys.stats; try{ if(St&&typeof St.wingName==='function') return St.wingName(it)||null; }catch(e){} return it.wing==='demon'?'Asa demoníaca':'Asa de anjo'; }
  const tb=it&&DATA.names[it.slot]; if(!tb) return null;
  const e=clamp(int0(it.look!=null?it.look:it.e),0,tb.length-1), row=tb[e];
  return row[clamp(int0(it.r),0,row.length-1)]||null;
}
/* ---------------- transformação de item (Essência da Era) ---------------- */
const essenceOf=S=>int0(ensure(S).mat.essence);
/* custo para levar o item à era ATUAL do jogador: {ok, jump, toEra, essence, gold} ou {ok:false, reason:'item'|'era'}.
   A era de origem é a de PODER do item (item.e). Quem altera o item é o Sys.stats.transform da fps-e2; daqui saem só o custo e a cobrança. */
function transformCost(S,host,item){
  if(!item||typeof item!=='object'||!DATA.slots.includes(item.slot)) return {ok:false,reason:'item'};
  const T=DATA.transform, to=eraMaxOf(host), from=clamp(int0(item.e),0,99), jump=to-from, r=clamp(int0(item.r),0,T.essence.length-1);
  if(jump<=0) return {ok:false,reason:'era',toEra:to};
  return {ok:true,jump,toEra:to,essence:T.essence[r]*jump,gold:Math.round(T.goldBase[r]*Math.pow(T.goldEra,to)*jump)};
}
/* cobra a transformação (essência do estoque + ouro por host.spendGold), SEM mexer no item. Tudo ou nada.
   Devolve {ok, ...custo} ou {ok:false, reason:'essencia'|'ouro'|'host'|'era'|'item', ...custo}. */
function payTransform(S,host,item){
  const c=transformCost(S,host,item); if(!c.ok) return c;
  if(essenceOf(S)<c.essence) return {ok:false,reason:'essencia',...c};
  if(!host||typeof host.spendGold!=='function') return {ok:false,reason:'host',...c};
  if(!host.spendGold(c.gold)) return {ok:false,reason:'ouro',...c};
  ensure(S).mat.essence-=c.essence;
  return {ok:true,...c};
}
/* desmontar: devolve 50% do ouro investido (item.gold; cálculo do Sys.stats.dismantleGold quando carregado) (+ pedras de forja por raridade, se confirmado). NÃO remove o item: isso é do jogo.
   Devolve {gold, forge} e entrega por host.addGold e Sys.forge (via addMat, que também conta na missão do dia). */
function dismantle(S,host,item){
  if(!item||typeof item!=='object') return {gold:0,forge:0};
  const D=DATA.dismantle, St=root.Sys&&root.Sys.stats;
  const gold=St&&typeof St.dismantleGold==='function'?int0(St.dismantleGold(item)):Math.floor(int0(item.gold)*num(D.goldRefund,0)), forge=int0(D.forge[clamp(int0(item.r),0,D.forge.length-1)]);
  if(gold&&host&&host.addGold) host.addGold(gold); addMat(S,host,'forge',forge);
  return {gold,forge};
}

const spe=()=>DATA.diff.on?DATA.diff.stagesPerEra:DATA.stagesPerEra;   // fases por era (10 hoje; 100 com as dificuldades)
/* classe que PAGA o abate: com as dificuldades ligadas, o chefe de fase fora de bossStages paga como comum */
function killClass(enemy,host){ const c=classOf(enemy); if(c!=='boss'||!DATA.diff.on) return c;
  const st=Math.max(1,num(enemy&&enemy.stage,num(host&&host.stage&&host.stage(),1))), inEra=((st-1)%spe())+1;
  return DATA.diff.bossStages.includes(inEra)?'boss':'common'; }
const classOf=e=>(e&&e.eraBoss)?'eraBoss':(e&&e.boss)?'boss':'common';
function eraOfEnemy(enemy,host){
  if(enemy&&Number.isInteger(enemy.era)) return clamp(enemy.era,0,99);
  const st=Math.max(1,num(host&&host.stage&&host.stage(),1)); return Math.floor((st-1)/spe());
}
/* XP de um abate (era e fase vêm do inimigo ou do host) */
function xpFor(enemy,host,cls){
  const X=DATA.xp, era=eraOfEnemy(enemy,host), st=Math.max(1,num(enemy&&enemy.stage,num(host&&host.stage&&host.stage(),1)));
  const P=spe(), inEra=1+(((st-1)%P))*(DATA.stagesPerEra-1)/Math.max(1,P-1), base=num(X[cls==='eraBoss'?'eraBoss':cls==='boss'?'boss':'kill'],0);
  const es=Array.isArray(X.eraScale)?num(X.eraScale[Math.min(era,X.eraScale.length-1)],0):num(X.eraScale,0);   // vetor por era (ou número)
  return Math.max(0,Math.round(base*(1+es*era)*(1+X.stageScale*(inEra-1))*num(params.mult.xp,1)));
}
function rollMat(rng,spec,mult){ if(!spec||rng()>=spec[0]) return 0; return Math.max(0,Math.round(randInt(rng,spec[1],spec[2])*num(mult,1))); }

/* ovo do abate (atualiza a garantia em S). Devolve {r, milestone} ou null. milestone = prêmio de marco (1ª vitória sobre o Senhor da era). */
function rollEgg(S,host,enemy,cls,rng){
  const o=ensure(S), E=DATA.eggs;
  if(cls==='boss'){
    if(E.firstBossGuaranteed&&!o.egg.first){ o.egg.first=true; o.egg.pity=0; return {r:0,milestone:true}; }
    o.egg.pity++;
    if(o.egg.pity>=E.pity||rng()<E.bossChance){ o.egg.pity=0; return {r:pickW(rng,E.bossTable),milestone:false}; }
    return null;
  }
  if(cls==='eraBoss'){
    const era=eraOfEnemy(enemy,host);
    if(!o.egg.eraFirst.includes(era)){ o.egg.eraFirst.push(era); return {r:Math.max(pickW(rng,E.eraBossTable),num(E.eraBossFirstMin[Math.min(era,E.eraBossFirstMin.length-1)],0)),milestone:true}; }
    return rng()<E.eraBossRepeatChance?{r:pickW(rng,E.eraBossTable),milestone:false}:null;
  }
  return null;
}
/* nível exigido para chocar um ovo de raridade r (portão de nível; a era do marco já foi alcançada) */
const eggNeedLevel=r=>num((DATA.gates[r]||{}).lvl,1);
/* PO: prêmio de MARCO não piora com o portão. Ovo de marco acima do portão fica GUARDADO e choca sozinho quando o portão abrir. */
function releaseHeld(S,host){
  const o=ensure(S), out=[];
  const P=root.Sys&&root.Sys.pass; if(P&&typeof P.releaseHeld==='function'){ for(const it of P.releaseHeld(S,host)) out.push({item:it}); }   // itens do passe guardados
  o.heldItems=o.heldItems.filter(sp=>{ if(canHold(host,sp)){ const it=makeFixedItem(host,sp); if(host.addItem) host.addItem(it); out.push({item:it}); return false; } return true; });   // itens de pacote (era da liberação)
  // pets da tela 17b (fps-e2, Sys.pet.setV17): ovo de espécie acima do portão fica guardado NO pet.js; nasce aqui quando o portão abrir
  const Pt=root.Sys&&root.Sys.pet; if(Pt&&typeof Pt.releaseGated==='function'){ try{ for(const h of Pt.releaseGated(S,host)||[]) out.push({gated:true,hatch:h}); }catch(e){} }
  if(!o.held.length) return out;
  o.held=o.held.filter(hd=>{ if(capEggR(host,hd.r)>=hd.r){ out.push({r:hd.r,hatch:addEgg(S,host,hd.r,hd.source)}); return false; } return true; });
  return out;
}

/* dificuldade 0..3 (Fácil, Médio, Difícil, Hell): do inimigo (enemy.diff) ou do host (host.diff()). Chave desligada = 0. */
function diffOf(enemy,host){ if(!DATA.diff.on) return 0; let v=enemy&&enemy.diff; if(v==null&&host&&typeof host.diff==='function') v=host.diff(); return clamp(Math.floor(num(v,0)),0,DATA.diff.mult.length-1); }
const diffMult=d=>DATA.diff.on?num(DATA.diff.mult[d],1):1;
/* tipo de marco da fase n (1..100) da era: 'lord' (100), 'chief' (50), 'every' (múltiplo de 10) ou 'stage' (comum) */
function stageKind(n){ const F=DATA.diff.firstWin; return n===F.lord?'lord':n===F.chief?'chief':(n%F.every===0)?'every':'stage'; }
/* 1ª VITÓRIA DE UMA FASE (o jogo chama ao vencer a fase): {era, diff, stage} com stage = 1..100 dentro da era+dificuldade (aceita também a
   fase absoluta do host: o resto por 100). Fases são lineares por era+dificuldade: guarda a maior vencida.
   → {first, kind, gems, gold, xp, golem} para a tela; first:false (tudo 0) se já vencida ou chave desligada. Entrega: 💎 e ouro pelo host,
   XP pelo Sys.level.addXp (src 'kill') ou pendente, golem pelo Sys.pet.addFragments (conta só o aceito). */
function stageWin(S,host,w){
  const none={first:false,kind:null,gems:0,gold:0,xp:0,golem:0}; if(!DATA.diff.on||!w) return none;
  const o=ensure(S), F=DATA.diff.firstWin, d=clamp(Math.floor(num(w.diff,0)),0,3), era=clamp(Math.floor(num(w.era,0)),0,99);
  const raw=int0(w.stage); if(!raw) return none; const n=((raw-1)%spe())+1, k=era+':'+d;
  if(!o.fw||typeof o.fw!=='object') o.fw={}; if(int0(o.fw[k])>=n) return none;
  o.fw[k]=n; const kind=stageKind(n);
  const gems=kind==='stage'?0:int0(F.gems[kind][d]);
  const unit=goldUnitOf(host), gold=Math.max(0,Math.round(num(F.goldk[kind],0)*unit*diffMult(d)));
  const xp=Math.max(0,Math.round(num(F.xpk[kind],0)*xpFor({era,stage:era*spe()+n},host,'common')));
  if(gems&&host&&host.addGems) host.addGems(gems); if(gold&&host&&host.addGold) host.addGold(gold);
  if(xp){ const Lv=root.Sys&&root.Sys.level; if(Lv&&typeof Lv.addXp==='function'){ today(S,host).xp+=xp; Lv.addXp(S,xp,host,'kill'); } else addMat(S,host,'xp',xp); }
  let golem=0; const P=root.Sys&&root.Sys.pet;
  if(d===3&&kind!=='stage'&&F.golem&&P&&typeof P.addFragments==='function'){ const a=P.addFragments(S,F.golem.pet,F.golem.n,host); golem=int0(a&&a.added); }
  return {first:true,kind,gems,gold,xp,golem};
}
/* sorteia o saque de um abate (atualiza a garantia do ovo; NÃO entrega: ver grant/onKill) */
function rollKill(S,host,enemy){
  ensure(S);
  const rng=rngOf(host), cls=killClass(enemy,host), T=DATA.enemy[cls], m=params.mult, M=DATA.mats[cls], d=diffOf(enemy,host), dm=diffMult(d), DF=DATA.diff;
  let gold=(enemy&&num(enemy.gold,0)>0)?enemy.gold:goldUnitOf(host)*T.goldMult;
  if(T.goldVar>0) gold*=1+(rng()*2-1)*T.goldVar;
  const vip=vipPerks(S);
  // BÔNUS DE RETORNO (Sys.clock, atrás de chave): enquanto houver XP descansada, o abate vale XP e ouro em dobro
  const Ck=root.Sys&&root.Sys.clock, rest=!!(Ck&&typeof Ck.takeRested==='function'&&Ck.takeRested(S)), rm=rest?num(Ck.DATA.rested.mult,2):1;
  gold=Math.max(1,Math.round(gold*num(m.gold,1)*(1+vip.goldPct/100)*rm*dm));   // VIP +ouro: aplicado aqui (loot/baú/instância), não no Sys.vip.bonus
  let gems=0; if(rng()<T.gemChance) gems=Math.max(0,Math.round(randInt(rng,T.gems[0],T.gems[1])*num(m.gems,1)));
  const items=[]; if(rng()<Math.min(1,T.itemChance*(cls==='common'?num(m.item,1):1))) items.push(rollItem(host,{minR:T.minR,upChance:T.upChance,source:cls==='common'?'drop':'boss',topBoost:DF.on?num(DF.topBoost[d],1):1,qBest:DF.on?num(DF.qBest[d],1):1,diff:d}));
  const forge=rollMat(rng,M.forge,num(m.forge,1)*dm), food=rollMat(rng,M.food,num(m.food,1)*dm);
  let essence=0;
  if(cls==='eraBoss'){ const E=DATA.essence, first=!ensure(S).egg.eraFirst.includes(eraOfEnemy(enemy,host));   // 1ª vitória da era (antes do rollEgg marcar)
    essence=Math.round((first?E.eraBossFirst:randInt(rng,E.eraBossRepeat[0],E.eraBossRepeat[1]))*dm); }
  const eg=rollEgg(S,host,enemy,cls,rng), eggs=[], held=[];
  if(eg){ const c=capEggR(host,eg.r);
    if(eg.milestone&&c<eg.r) held.push({r:eg.r,needLevel:eggNeedLevel(eg.r)});   // marco: guarda, não rebaixa
    else eggs.push(c); }
  const xpKill=Math.round(xpFor(enemy,host,cls)*(1+vip.xpPct/100));   // VIP +XP nos orbes (XP de instância/missão/offline: Sys.level)
  const xp=Math.round(xpKill*rm), xpExtra=xp-xpKill;                  // ×2 com retorno: a parte extra vai SEM teto (v9)
  const res={cls,gold,gems,items,forge,food,eggs,held,xp,xpKill,xpExtra,essence,rested:rest,x:enemy&&num(enemy.x,null),y:enemy&&num(enemy.y,null)};   // rested: abate em dobro (retorno)
  res.pickups=pickups(res,{coins:T.coins,orbs:DATA.xp.orbs[cls],rng});
  return res;
}
/* Entrega de materiais. O ESTOQUE fica no módulo que gasta (acordo com a fps-e2):
   pedra de forja → Sys.forge.addStones(S,n,host) · ração → Sys.pet.addFood(S,n,host) · ovo → Sys.pet.addEgg(S,host,{r}) (choca na hora).
   Se o módulo ainda não estiver carregado, fica PENDENTE em S.sys.loot.mat e sai no próximo flushPending (nada se perde).
   O contador do dia (missão "Colete 15 pedras de forja") é daqui: today(S,host).forge. */
const sinkOf=key=>{ const F=root.Sys&&root.Sys.forge, P=root.Sys&&root.Sys.pet, Lv=root.Sys&&root.Sys.level, Pr=root.Sys&&root.Sys.practice;
  if(key==='forge') return F&&typeof F.addStones==='function'?(S,n,h)=>F.addStones(S,n,h):null;
  if(key==='food')  return P&&typeof P.addFood==='function'?(S,n,h)=>P.addFood(S,n,h):null;
  if(key==='xp')    return Lv&&typeof Lv.addXp==='function'?(S,n,h)=>Lv.addXp(S,n,h):null;
  if(key==='stones') return Pr&&typeof Pr.addStones==='function'?(S,n,h)=>Pr.addStones(S,n,h):null;   // prêmio da arena (fps-e2)
  return null; };
const eggSink=()=>{ const P=root.Sys&&root.Sys.pet; return P&&typeof P.addEgg==='function'?P:null; };
function addMat(S,host,key,n){
  if(!MAT_KEYS.includes(key)) return 0; const k=int0(n); if(!k) return 0;
  const o=ensure(S); today(S,host)[key]+=k;
  const f=sinkOf(key); let r=null; if(f) r=f(S,k,host); else o.mat[key]+=k;
  if(key==='xp'&&r&&r.levels>0) o._lvlUp=(o._lvlUp||[]).concat([r]);   // subiu de nível: o grant solta os ovos guardados
  return k;
}
/* ovo: devolve o resultado do Sys.pet.addEgg (pet, novo, fragmentos...) ou {pending:true}.
   source: 'drop' (campanha/baú) ou 'instance'. v5.2: ovo de INSTÂNCIA repetido em 5★ não sobe de raridade (vira ração) — quem aplica é o pet.js. */
const eggKey=(r,src)=>src==='instance'?r+'i':String(r);
function addEgg(S,host,r,source){
  const o=ensure(S), rr=int0(r), src=source==='instance'?'instance':'drop', P=eggSink();
  if(P) return P.addEgg(S,host,{r:rr,source:src});
  const k=eggKey(rr,src); o.mat.eggs[k]=(o.mat.eggs[k]||0)+1; return {pending:true,r:rr,source:src};
}
/* repassa o que ficou pendente quando os módulos de forja/pet chegarem (chamar no boot, depois de carregar js/sys/*) */
function flushPending(S,host){
  const o=ensure(S), out={forge:0,food:0,eggs:[]};
  for(const key of MAT_KEYS){ const f=sinkOf(key), k=o.mat[key]; if(f&&k){ f(S,k,host); o.mat[key]=0; out[key]=k; } }
  const P=eggSink();
  if(P){ for(const k of Object.keys(o.mat.eggs)){ let n=o.mat.eggs[k]; const r=parseInt(k,10), source=k.endsWith('i')?'instance':'drop';
    while(n-->0) out.eggs.push(P.addEgg(S,host,{r,source})); delete o.mat.eggs[k]; } }
  return out;
}
/* o que está pendente (não entregue a forja/pet) */
function pending(S){ const o=ensure(S); return {forge:o.mat.forge,food:o.mat.food,xp:o.mat.xp,stones:o.mat.stones,eggs:Object.assign({},o.mat.eggs)}; }

/* entrega pelo host (ouro, gemas, itens) e guarda os materiais em S */
function grant(S,host,res){
  if(!res) return res; const o=ensure(S);
  if(res.gold>0&&host.addGold) host.addGold(res.gold);
  if(res.gems>0&&host.addGems) host.addGems(res.gems);
  for(const it of res.items||[]){ if(host.addItem) host.addItem(itemOut(it)); o.items++; o.byR[it.r]=(o.byR[it.r]||0)+1; }
  addMat(S,host,'forge',res.forge); addMat(S,host,'food',res.food); grantXp(S,host,res); addMat(S,host,'essence',res.essence);
  res.levelUp=o._lvlUp?o._lvlUp.pop():null; delete o._lvlUp;   // {from,to,unlocked} do Sys.level, para o aviso de nível
  res.hatched=(res.eggs||[]).map(r=>addEgg(S,host,r));   // resultado do choco, para a batalha/aviso
  for(const hd of res.held||[]) o.held.push({r:hd.r,source:'drop'});   // aviso: "Ovo Mítico guardado: choca no nível 70"
  res.released=releaseHeld(S,host);                                    // guardados cujo portão já abriu chocam agora
  o.gold+=res.gold||0; o.gems+=res.gems||0;
  return res;
}
/* XP do abate. Com o v9 da fps-e2 ligado (Sys.level.DATA.v9.on): a XP dos orbes vai com src 'kill' (passa pelo teto diário) e a parte EXTRA do retorno vai sem src
   (não é comida pelo teto). Desligado: como sempre (addMat → Sys.level.addXp sem src, ou pendente). */
function grantXp(S,host,res){
  const Lv=root.Sys&&root.Sys.level, v9=!!(Lv&&Lv.DATA&&Lv.DATA.v9&&Lv.DATA.v9.on&&typeof Lv.addXp==='function');
  if(!v9){ addMat(S,host,'xp',res.xp); return; }
  const o=ensure(S); today(S,host).xp+=int0(res.xp);
  const lvls=[]; const a=int0(res.xpKill!=null?res.xpKill:res.xp), b=int0(res.xpExtra);
  if(a){ const r=Lv.addXp(S,a,host,'kill'); if(r&&r.levels>0) lvls.push(r); }
  if(b){ const r=Lv.addXp(S,b,host); if(r&&r.levels>0) lvls.push(r); }
  if(lvls.length){ const f=lvls[0], l=lvls[lvls.length-1]; o._lvlUp=(o._lvlUp||[]).concat([{gained:a+b,levels:l.to-f.from,from:f.from,to:l.to,unlocked:[].concat(...lvls.map(x=>x.unlocked||[]))}]); }
}
/* evento do contrato: 1x por inimigo morto (horda e chefe). NÃO usar em instância (lá a recompensa é fixa). */
function onKill(S,host,enemy){
  const o=ensure(S); o.kills++; if(enemy&&enemy.boss) o.bosses++;
  const res=grant(S,host,rollKill(S,host,enemy));
  if(enemy&&enemy.eraBoss) res.prism=prismBoss(S,host,eraOfEnemy(enemy,host));   // Prismático (fps-e2): Senhor da Era 8+
  return res;
}
/* vitória sobre chefe de era: avisa o Sys.pet.prismBoss (limite diário, VIP e chave v4 são do lado da fps-e2; era < 8 ou chave desligada = {ok:false}) */
function prismBoss(S,host,era){ const Pt=root.Sys&&root.Sys.pet; if(!Pt||typeof Pt.prismBoss!=='function') return null; try{ return Pt.prismBoss(S,host,era); }catch(e){ return null; } }

/* pickups para a batalha animar (pulam do inimigo e voam ao HUD; toque coleta na hora).
   O ganho já foi creditado no abate: o voo é só visual. Soma dos value por tipo = total. */
function pickups(res,o){
  o=o||{}; const rng=o.rng||Math.random, out=[]; let d=0;
  const split=(type,total,max,icon,to,step)=>{ const g=int0(total); if(!g) return; const n=Math.min(max,g), base=Math.floor(g/n); let rest=g-base*n;
    for(let i=0;i<n;i++){ const v=base+(rest>0?1:0); if(rest>0) rest--; out.push({type,value:v,r:0,icon,to,delay:d,big:false}); d+=step; } };
  const cr=o.coins||[1,3]; split('gold',res.gold,clamp(randInt(rng,cr[0],cr[1]),1,DATA.maxCoins),'coin','gold',0.04);
  split('gem',res.gems,DATA.maxGemPickups,'gem','gems',0.06);
  const orb=o.orbs||[1,2]; split('xp',res.xp,clamp(randInt(rng,orb[0],orb[1]),1,DATA.xp.maxOrbs),'xp','level',0.03);   // orbes de XP voam à barra de nível
  if(int0(res.essence)) { out.push({type:'essence',value:int0(res.essence),r:0,icon:'essence',to:'bag',delay:d,big:true,glow:true}); d+=0.08; }
  if(int0(res.forge)) { out.push({type:'forge',value:int0(res.forge),r:0,icon:'forge',to:'bag',delay:d,big:false}); d+=0.06; }
  if(int0(res.food))  { out.push({type:'food', value:int0(res.food), r:0,icon:'food', to:'bag',delay:d,big:false}); d+=0.06; }
  for(const r of res.eggs||[]){ out.push({type:'egg',value:1,r,icon:'egg',to:'bag',delay:d,big:true,glow:true}); d+=0.12; }
  for(const hd of res.held||[]){ out.push({type:'egg',value:1,r:hd.r,icon:'egg',to:'bag',delay:d,big:true,glow:true,held:true,needLevel:hd.needLevel}); d+=0.12; }
  for(const it of res.items||[]){ out.push({type:'item',value:1,r:it.r,slot:it.slot,e:it.e,icon:it.slot,to:'bag',delay:d,big:it.r>=3,glow:true}); d+=0.1; }
  return out;
}

/* agrupador "+N": add(type,value,t) · live() rótulos abertos · due(t) rótulos fechados · clear() */
function createGrouper(windowSec){
  const win=num(windowSec,DATA.group.window), open={};
  return {
    add(type,value,t){ value=num(value,0); t=num(t,0); if(value<=0) return null;
      let b=open[type]; if(!b||t-b.last>win){ if(b) b.closed=true; b=open[type]={type,total:0,count:0,start:t,last:t}; }
      b.total+=value; b.count++; b.last=t; return b; },
    live(){ return Object.values(open).filter(b=>!b.closed); },
    due(t){ const out=[]; for(const k in open){ const b=open[k]; if(t-b.last>win){ out.push({type:b.type,total:b.total,count:b.count}); delete open[k]; } } return out; },
    clear(){ for(const k in open) delete open[k]; },
  };
}

/* ganho offline de ITENS (ouro offline: js/meta.js · ração offline: Sys.pet.onOffline · pedra de prática offline: Sys.practice). Não entrega: use grant(S,host,res).
   kills vai para o baú (Sys.chest.onKills). */
function offline(S,host,seconds,opts){
  opts=opts||{}; const rng=rngOf(host), O=DATA.offline;
  const cap=num(opts.capHours,num(params.offlineCapHours,O.capHours))*3600;
  const t=clamp(num(seconds,0),0,cap), kills=Math.floor(t/60*num(opts.killsPerMin,O.killsPerMin)), mul=num(opts.mult,params.offlineMult)*vipPerks(S).offlineMult;
  const exp=kills*DATA.enemy.common.itemChance*num(params.mult.item,1)*O.itemRate*mul;
  const n=Math.min(O.maxItems,Math.floor(exp)+(rng()<exp%1?1:0)), items=[];
  for(let i=0;i<n;i++) items.push(rollItem(host,{}));
  return {seconds:t,kills,gold:0,gems:0,items,forge:0,food:0,eggs:[],pickups:[]};
}

const bonus=()=>({atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0});

const API={DATA,params,ensure,today,todayCount,rarWeights,rollRarity,rollItem,rollKill,rollEgg,grant,onKill,pickups,createGrouper,offline,stageWin,diffOf,
  addMat,addEgg,flushPending,pending,bonus,classOf,maxDropR,dayKey,maxAllowedR,capEggR,xpFor,itemOut,rollSubs,vipPerks,
  summon,summonCost,summonFreeLeft,summonOdds,dismantle,grantBundle,qualityOf,prismBoss,heldItems:S=>ensure(S).heldItems.map(h=>({slot:h.slot,r:h.r})),transformCost,payTransform,essence:essenceOf,itemName,
  releaseHeld, onLevelUp:releaseHeld, held:S=>ensure(S).held.map(h=>({r:h.r,needLevel:eggNeedLevel(h.r)}))};
root.Sys=root.Sys||{}; root.Sys.loot=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
