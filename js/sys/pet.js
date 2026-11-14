/* Eonbound — Sys.pet: companheiro que luta ao lado do herói. 5 pets no lançamento (1 por raridade), 1 equipado por vez.
   Força RELATIVA ao herói (não entra no fator 12 por era): p = 0,25 × raridade × nível do ESPAÇO × estrelas, e o tipo reparte o p
   entre golpe próprio, vínculo (+HP), cura e coleta. O fc.js trava a FC do pet em 25% da do herói (= 20% da FC total).
   Estoques aqui: ração e fragmentos. Ovos/ração/fragmentos chegam pelos drops da fps-30 (addEgg/addFood) e pela torre.
   Spec: reports/spec-pet-fc.md · números: docs/balance.json v5.1 ("pet"). Contrato: docs/CONTRATO_SYS.md. Relatório: reports/sys-pet.md */
(function(root){
'use strict';

/* ---------------- dados (balanceamento: docs/balance.json v5.1) ---------------- */
const DATA={
  label:'Pet', icon:'🐾',
  pets:[   // r = raridade (0 Básico .. 4 Lendário). Os outros 10 da spec entram aqui depois, sem mudar a lógica.
    {id:'wolf',    name:'Filhote de lobo',  r:0, type:'atk',    icon:'🐺'},
    {id:'owl',     name:'Coruja',           r:1, type:'gather', icon:'🦉'},
    {id:'drake',   name:'Dragãozinho',      r:2, type:'atk',    icon:'🐉'},
    {id:'golem',   name:'Golem de cristal', r:3, type:'def',    icon:'🗿'},
    {id:'phoenix', name:'Fênix',            r:4, type:'heal',   icon:'🔥'},
    // ===== REVISÃO 4 (aprovada pelo PO; chave DATA.v4 DESLIGADA, exige v3 e as eras 7-8) =====
    // Submundo e Celestial: Lendários (teto 20%) até a raridade "Divina" ser decidida; só saem a partir da era deles. Tipos: escolha da fps-e2.
    {id:'underworld',name:'Submundo',        r:4, type:'atk',    icon:'🦇', v4:true, minEra:7},
    {id:'parrot',    name:'Papagaio-fênix',  r:2, type:'atk',    icon:'🦜', v17:true, minEra:3},   // só existe com a tela 17b (protótipo: Épico da era 3)
    {id:'celestial', name:'Celestial',       r:4, type:'def',    icon:'🕊️', v4:true, minEra:8},
    // Prismático: raridade própria (5), NUNCA de ovo: nasce com 1.000 fragmentos (Revisão 5, dono) de fontes SEM sorteio (DATA.v4d.prism); não vende na loja.
    // Estrelas: 50/100/150/200 (+500 até o 5★, mesma proporção 1:2:3:4 dos outros pets).
    // Teto POR PET: 1/3 da FC do herói (= 25% da FC total). Ataques melhores: crítico até 14%, mediano até 7%.
    // ===== 9 PETS NOVOS (dono, 13/11; nw:true = atrás da chave DATA.newPets até a arte chegar). Mesmo padrão dos de hoje: o poder sai SÓ da raridade
    // (rarW: mesmo teto 8/11/14/17/20% da FC total por raridade) e o tipo reparte entre dano/vida (atk, def); skill = o JEITO do golpe do pet na
    // batalha, com o MESMO dano total do golpe de hoje (hits somam 1; dot = dano em partes; area = dividido entre os da fila). Fontes SEM sorteio pago
    // (ovo da raridade certa ou fragmentos de uma fonte fixa; hatchFrags = nasce sozinho). Nenhum dá diamante (meta ~10 mil intacta).
    // Os de hoje (lobo, coruja, dragãozinho, golem de cristal, fênix…) passam a ser os INICIAIS grátis (starter:true abaixo, no setNew).
    {id:'shadowwolf', name:'Lobo sombrio',        r:1, type:'atk', icon:'', nw:true, skill:{id:'dash',   hits:[1],              note:'avanço rápido até o inimigo da frente'},
     hatchFrags:60,  src:['Instância Arsenal: ovo Raro do lobo sombrio na 1ª vitória de cada dificuldade','Baús da atividade: 2 fragmentos/dia']},
    {id:'falcon',     name:'Falcão de guerra',    r:1, type:'atk', icon:'', nw:true, skill:{id:'ranged', hits:[1],              note:'mergulha de longe (acerta antes do inimigo encostar)'},
     hatchFrags:60,  src:['Torre: andar 30 (ovo inteiro)','Missões diárias: 1 fragmento/dia']},
    {id:'panther',    name:'Pantera espectral',   r:2, type:'atk', icon:'', nw:true, skill:{id:'blink',  hits:[1], crit:true,    note:'some e reaparece atrás do inimigo; usa a chance de crítico do pet'},
     hatchFrags:100, src:['Arena: fim de temporada Ouro (15) / Platina+ (30 fragmentos)']},
    {id:'scorpion',   name:'Escorpião rúnico',    r:2, type:'atk', icon:'', nw:true, skill:{id:'poison', hits:[0.4,0.3,0.3], dot:true, note:'picada + veneno em 3 partes (mesmo total)'},
     hatchFrags:100, src:['Trilha de evento: 20 fragmentos na faixa de topo','Caça aos Pets (evento): fragmentos +50% valem para ele']},
    {id:'crow',       name:'Corvo da tempestade', r:2, type:'atk', icon:'', nw:true, skill:{id:'chain',  hits:[0.5,0.3,0.2], area:true, note:'raio que pula em até 3 inimigos (o dano se divide)'},
     hatchFrags:100, src:['Guilda: baú semanal (5 fragmentos)','Loja da guilda por contribuição']},
    {id:'griffin',    name:'Grifo negro',         r:3, type:'atk', icon:'', nw:true, skill:{id:'dive',   hits:[1], area:true,    note:'mergulho em área (divide entre a fila)'},
     hatchFrags:200, src:['Torre: andar 150 (ovo inteiro)','Chefe Mundial: fragmentos acima de 5% da vida']},
    {id:'obsidian',   name:'Golem de obsidiana',  r:3, type:'def', icon:'', nw:true, skill:{id:'burst',  hits:[1], onHit:true,   note:'explode estilhaços quando o herói apanha (mesmo dano do golpe dele, no lugar do golpe)'},
     hatchFrags:200, src:['Guerra de guildas: capital (40 por temporada)','Torneio de Fim de Semana: top 100 (20)']},
    {id:'icedragon',  name:'Dragão de gelo',      r:4, type:'atk', icon:'', nw:true, skill:{id:'breath', hits:[1], area:true, slow:true, note:'sopro em área que congela (só visual + desacelera o avanço; dano dividido)'},
     hatchFrags:400, src:['Torneio: top 10 da temporada (100 fragmentos), top 3 (inteiro)']},
    {id:'wyvernpet',  name:'Serpe infernal',      r:4, type:'atk', icon:'', nw:true, minEra:7, skill:{id:'fireball', hits:[0.34,0.33,0.33], area:true, note:'3 bolas de fogo em área (dano dividido)'},
     hatchFrags:400, src:['Chefe da era 7 (Submundo): 3 fragmentos por dia','VIP 9: inteira, uma vez']},
    {id:'prism',     name:'Prismático',      r:5, type:'prism',  icon:'💠', v4:true, noEgg:true, hatchFrags:1000, starCost:[50,100,150,200], capShare:1/3,
     attacks:{crit:{gain:7}, mid:{gain:4}}},
  ],
  // como cada tipo reparte o p: dmg = golpe do pet, bond = +HP do herói, heal = cura (lado da vida na FC), gold = coleta (fora da FC)
  types:{
    atk:   {name:'Ataque',          dmg:1.5, bond:0.5, heal:0,   gold:0},
    def:   {name:'Defesa',          dmg:0.5, bond:1.5, heal:0,   gold:0},
    gather:{name:'Suporte (coleta)',dmg:0.5, bond:0.5, heal:0,   gold:1},
    heal:  {name:'Suporte (cura)',  dmg:0.5, bond:0.9, heal:0.6, gold:0},   // cura 0,6·p por onda de ~11 s (simulação 3)
    prism: {name:'Prismático',      dmg:1.0, bond:0.6, heal:0.4, gold:0},   // equilibrado (soma 2,0, como os de combate)
  },
  pMax:0.25, rarW:[0.40,0.55,0.70,0.85,1.00,4/3],   // [5] = Prismático (1,333: p máx 1/3 = 25% da FC total)
  v4:false,
  newPets:false, newReady:{shadowwolf:true,falcon:true,panther:true},   // ARTE ENTREGUE e pet aprovado pelo dono: liga um a um (shadowwolf: ba0789b)   // liga os 9 novos (o engenheiro, quando a arte for aprovada; um a um com newReady[id]=true)
  starterIds:['wolf','owl','drake','golem','phoenix','underworld','parrot','celestial'],   // os de hoje = iniciais GRÁTIS (o prismático continua à parte)
  // PET NO NÍVEL 20 (dono; PROPOSTA, chave DESLIGADA). Ligada: o pet abre no Nv 20; ao chegar, firstEgg dá 1 ovo GRÁTIS sorteado só entre as
  // 2 primeiras raridades (79% Básico, 21% Raro; nunca Lendário). Ovos ganhos ANTES do 1º ovo ficam guardados (o.pre) e chocam logo depois dele,
  // na ordem (o 1º pet é sempre o do ovo grátis). Fragmentos e ração de antes continuam guardados como hoje. Save com pet: já conta como feito.
  // TELA 17b PETS V2 (dono aprovou; o protótipo manda nas regras visíveis). setV17(true) troca nome/raridade/sprite e liga:
  // estágio GUARDADO com botão Evoluir (Nv 30 e 60, sem custo) e teto de nível por estágio 30/60/90 (junto com o teto da era);
  // bônus LINEAR no nível (0,4 → 1 do Nv 1 ao 90, sem salto no estágio) e máximo por raridade 8/11/14/17/20/25% da FC TOTAL;
  // ração por toque (barra parcial, 25 por toque); "Redefinir nível" mantém estrelas E estágio. ids do save não mudam.
  v17:{on:false, stageReq:[1,30,60], stageCap:[30,60,90], tapFood:25,
    // EVOLUIR DÁ PODER NA HORA (dificuldade com paredes, PO 13/11): parte do pet × [0,8 · 0,9 · 1,0] pelo estágio. O evoluído no topo fica IGUAL ao de hoje;
    // cada evolução soma +11 a +12,5% na parte do pet (+0,4% a +2% de FC: pouco com o pet baixo, ~2% com o pet perto do topo). Desligado até o QA medir (setStageMult(true), junto com a chave de dificuldade).
    stageMult:{on:false, m:[0.8,0.9,1]},
    rarW:[0.348,0.494,0.651,0.819,1.0,4/3],   // p máx = 0,25·rarW → p/(1+p) = 8,0/11,0/14,0/17,0/20,0/25,0% da FC total
    species:{wolf:{name:'Mamute',r:0,era:0,sprite:'era0_mammoth'}, owl:{name:'Esfinge',r:1,era:1,sprite:'era1_sphinx'},
      drake:{name:'Dragão',r:2,era:2,sprite:'era2_dragon'}, parrot:{name:'Papagaio-fênix',r:2,era:3,sprite:'era3_parrot'},
      golem:{name:'Cão mecânico',r:3,era:4,sprite:'era4_mechdog'}, underworld:{name:'Cérbero',r:3,era:7,sprite:'era7_cerberus'},
      celestial:{name:'Pégaso',r:4,era:8,sprite:'era8_pegasus'}, prism:{name:'Raposa de cristal',r:5,era:9,sprite:'prism_fox'},
      phoenix:{name:'Fênix',r:4,era:null,sprite:null,removed:true}},   // PO (a): a fênix SAI (o papagaio-fênix cumpre o papel)
    // PO (a): andar 100 da torre = ovo ÉPICO À ESCOLHA; (b) chefes das eras sem espécie (5, 6) = À ESCOLHA entre as espécies já liberadas
    // da maior raridade permitida; (d) qualquer outro ovo = a espécie da era (sem sorteio; o único sorteio é o ovo grátis do Nv 20);
    // (c) repetido = 10 fragmentos (economia atual); em 5★ vira ração (sem subir raridade, que seria sorteio); (e) todos "combate".
    tower100:['drake','parrot'], combat:{name:'Combate', dmg:1.0, bond:1.0, heal:0, gold:0}},
  // TROCAR SEM PERDER (docs/IDLE_PARECIDOS.md §3 item 2, dono aprovou 13/11). DESLIGADO. Só muda algo com o nível POR PET (v3/17b); na v2 o nível já
  // é do espaço. Ligado: ao trocar o pet principal (equip/swapMain), o investimento passa para o novo: se o antigo tinha mais nível, os dois TROCAM
  // nível, ração gasta, estágio (17b) e barra parcial de ração. Nada some e nada duplica (as somas não mudam); trocar de volta desfaz. Estrelas e
  // fragmentos NÃO passam: são cópias daquele pet. Grátis e sem limite (o "Redefinir nível" de 80% continua existindo à parte).
  swapKeep:{on:false},
  v20:{on:false, unlockLevel:20, firstEgg:{weights:[79,21,0,0,0]}, maxPre:50},
  // pet na batalha (para o engenheiro; os números já eram estes): golpe a cada 2,0 s no inimigo da frente; não é alvo; não dá energia de Ultimate
  battle:{interval:2.0, hitMult:2.5, healEvery:11},
  // FONTES do Prismático (Revisão 5; tudo determinístico, sem sorteio). Quem entrega: chefe da era 8 = Sys.pet.prismBoss (o jogo/fps-30 chama na vitória);
  // VIP 10 = Sys.pet.prismVipMax (o vip.js chama ao subir); arena = Sys.arena (DATA.rewards[].prism; desligada contra bots); torre = Sys.tower;
  // eventos = Sys.events/Sys.loot.grantBundle (fps-30), event = alvo de fragmentos por evento mensal.
  v4d:{prism:{boss:{minEra:8,perDay:1,vipEvery:4}, vipMax:{level:10,frags:500}, tower:{from:105,every:25,frags:5}, event:100}},
  // ===== REVISÃO 3 (aprovada pelo PO; DESLIGADA até a tela de Pets e a arte dos estágios serem aprovadas pelo dono) =====
  // v3 = true: nível POR PET (1-90), estágios filhote → médio (Nv 30, ×1,25) → evoluído (Nv 60, ×1,5), ração 1,05 e 3 ataques sorteados.
  // Eras 7-8 (Submundo/Celestial): o máximo continua 90 (só estrelas), sem novo estágio.
  v3:false,
  v3d:{maxLvl:90, lvlCapByEra:[10,20,30,45,60,75,90], foodGrowth:1.05, lvlMin:0.40, lvlTop:2/3,
    stages:[{id:'cub',name:'Filhote',from:1,mult:1,aura:'pet_aura_cub'},{id:'mid',name:'Médio',from:30,mult:1.25,aura:'pet_aura_mid'},
            {id:'evolved',name:'Evoluído',from:60,mult:1.5,aura:'pet_aura_evolved'}],
    // ataques: chance = base + ganho·q, q = metade estrelas + metade nível (0..1); dano em múltiplos do ataque do pet
    attacks:{crit:{base:7,gain:5,dmg:5,name:'Tiro do pet'}, mid:{base:3,gain:3,dmg:2.5,name:'Mediano'}, basic:{dmg:1,name:'Básico'}},
    // LIBERAR (PO): volta o pet ao Nv 1 e devolve 80% da ração gasta NELE, para o jogador não ficar preso a uma escolha errada.
    // O pet e as estrelas ficam (interpretação da fps-e2: "liberar o investimento"; tirar o pet seria só apagar owned[id]).
    releaseRefund:0.8, releaseLabel:'Redefinir nível'},   // nome na tela (PO): "Redefinir nível", com confirmação mostrando a ração que volta
  lvlMin:0.40, maxLvl:50, starBase:0.75, starStep:0.05, maxStars:5,
  lvlCapByEra:[8,15,22,29,36,43,50],
  foodCost:{base:3, growth:1.08},          // ração para ir do nível N ao N+1 = ceil(3 × 1,08^(N−1))
  starCost:[10,20,30,40],                  // fragmentos de 1→2, 2→3, 3→4, 4→5
  repeatFrags:10,                          // ovo repetido = 10 fragmentos daquele pet
  maxEggR:3,                               // repetido em 5★ vira ovo da raridade acima, até o Mítico
  topRepeat:{pet:'golem', frags:10},       // Lendário (fênix) repetido em 5★ (não há raridade acima): 10 fragmentos de GOLEM (decisão do PO;
                                           // não ração nem diamante). Golem ainda não nascido: ficam guardados para ele.
  golemRepeat:{golem:10, phoenix:7},       // golem repetido: +10 de golem OU +7 de fênix (v7.1, era 5); em 5★ vai sempre para a fênix
  // v5.2 (PO): ovo de INSTÂNCIA ({source:'instance'}) repetido em 5★ NÃO sobe de raridade: vira ração, pela raridade do pet repetido.
  // Motivo: a subida em cadeia dava ~38 ovos de golem a quem faz o Chefe de Era Difícil todo dia. O golem repetido continua indo para a fênix.
  instanceRepeatFood:[5,8,12,15,20],
  // portões de raridade (PO): Mítico só com nível 70+ E era 4+; Lendário só com nível 85+ E era 5+. Abaixo disso o ovo vira a raridade
  // permitida mais alta. Exceção: a fênix do andar 100 da torre (source:'tower100'). Fonte de verdade: Sys.level.DATA.eggGate
  // (esta cópia só vale se o Sys.level não estiver carregado e o host tiver level()).
  eggGate:{3:{level:70,era:4}, 4:{level:85,era:5}},
  newPref:0.7,                             // ovo com vários pets na raridade: 70% de preferência por um inédito
  offlineFoodPer8h:5,
  maxFood:1e9,
};
const BY={}; DATA.pets.forEach(p=>{ BY[p.id]=p; });

/* ---------------- utilidades ---------------- */
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const int0=v=>Math.max(0,Math.floor(num(v,0)));
const rngOf=host=>(host&&typeof host.rng==='function')?host.rng:Math.random;
const eraMaxOf=host=>clamp(int0(host&&host.eraMax&&host.eraMax()),0,99);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtN=n=>{ n=num(n,0); return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e4?(n/1e3).toFixed(1)+'k':String(Math.floor(n)); };
const changed=host=>{ if(host&&typeof host.onChange==='function') host.onChange(); };
const RNAME=['Básico','Raro','Épico','Mítico','Lendário','Prismático'];
/* Revisão 4: pets novos só existem com v4 (e v3) ligadas, e só a partir da era deles (minEra) */
const V4=()=>DATA.v4===true&&DATA.v3===true;
const liveNew=p=>!p.nw||DATA.newPets===true||DATA.newReady[p.id]===true;
const avail=(p,host)=>liveNew(p)&&!(V17()&&p.removed)&&(!p.v17||V17())&&(!p.v4||V4())&&(!p.minEra||int0(host&&host.eraMax&&host.eraMax())>=p.minEra);   // v4 (Revisão 4) e v17 (tela 17b): só com a chave; minEra: só a partir da era
const eggPets=host=>DATA.pets.filter(p=>!p.noEgg&&avail(p,host));
const maxR=host=>eggPets(host).reduce((m,p)=>Math.max(m,p.r),0);

const keepObj=(old,e)=>{ if(old&&typeof old==='object'&&!Array.isArray(old)){ for(const k of Object.keys(old)) delete old[k]; return Object.assign(old,e); } return e; };   // ensure atualiza NO LUGAR: quem segurou a ficha (x=o.owned[id]) continua gravando no save
function ensure(S){
  if(!S||typeof S!=='object') throw new Error('Sys.pet.ensure: save inválido');
  if(!S.sys||typeof S.sys!=='object') S.sys={};
  let o=S.sys.pet; if(!o||typeof o!=='object') o=S.sys.pet={};
  o.v=1; o.food=Math.min(DATA.maxFood,int0(o.food)); o.lvl=clamp(int0(o.lvl)||1,1,DATA.maxLvl); o.hatched=int0(o.hatched);
  const ow=(o.owned&&typeof o.owned==='object'&&!Array.isArray(o.owned))?o.owned:{}; o.owned={};
  // lvl por pet (v3): guardado sempre; ao ligar a v3, quem não tem herda o nível compartilhado (o.lvl), sem perder ração investida
  // Com a v3 DESLIGADA o nível por pet NÃO é gravado (senão ficaria congelado num nível velho enquanto o compartilhado sobe).
  // Com a v3 LIGADA, quem ainda não tem nível próprio recebe o compartilhado ATUAL (migração sem perder ração).
  for(const id in ow) if(BY[id]){ const x=ow[id]||{}, e={stars:clamp(int0(x.stars)||1,1,DATA.maxStars),frags:int0(x.frags)};
    if(int0(x.lvl)>=1) e.lvl=clamp(int0(x.lvl),1,DATA.v3d.maxLvl); else if(DATA.v3===true) e.lvl=clamp(int0(o.lvl)||1,1,DATA.v3d.maxLvl);
    if(int0(x.food)>0) e.food=int0(x.food);   // ração gasta NESTE pet (v3; base da devolução ao liberar)
    if(int0(x.stg)>0) e.stg=clamp(int0(x.stg),0,2); if(int0(x.fx)>0) e.fx=int0(x.fx);   // 17b: estágio guardado e barra parcial de ração
    o.owned[id]=keepObj(ow[id],e); }
  const st=(o.stored&&typeof o.stored==='object')?o.stored:{}; o.stored={};
  for(const id in st) if(BY[id]&&int0(st[id])>0&&!o.owned[id]) o.stored[id]=int0(st[id]);   // guardados só existem antes de nascer
  if(!BY[o.eq]||!o.owned[o.eq]) o.eq=null;
  if(!['auto','golem','phoenix'].includes(o.golemChoice)) o.golemChoice='auto';
  o.first=o.first===true||Object.keys(o.owned).length>0;
  o.choices=Array.isArray(o.choices)?o.choices.filter(c=>c&&Array.isArray(c.options)).slice(0,20).map(c=>({options:c.options.filter(id=>BY[id]),source:String(c.source||''),frags:int0(c.frags),food:int0(c.food)})):[];
  o.gated=Array.isArray(o.gated)?o.gated.filter(g=>g&&BY[g.pet]).slice(0,50).map(g=>({pet:g.pet,source:String(g.source||'')})):[];
  if(typeof o.t100!=='string'||!BY[o.t100]) o.t100='';
  // 17b: quem já tinha a FÊNIX recebe um ovo Épico À ESCOLHA com TUDO o que investiu nela (fragmentos das estrelas + guardados) e a ração de volta
  if(DATA.v17.on===true&&DATA.v3===true&&o.owned.phoenix){ const x=o.owned.phoenix, C=DATA.starCost; let fr=int0(x.frags); for(let i=0;i<x.stars-1;i++) fr+=C[i];
    o.choices.push({options:DATA.v17.tower100.slice(),source:'phoenix',frags:fr+int0(o.stored.phoenix),food:int0(x.food)}); delete o.owned.phoenix; delete o.stored.phoenix; if(o.eq==='phoenix') o.eq=null; }   // v20: 1º ovo já resolvido (quem já tem pet não ganha outro)
  o.pre=Array.isArray(o.pre)?o.pre.filter(e=>e&&typeof e==='object').slice(0,DATA.v20.maxPre).map(e=>({r:e.r!=null?clamp(int0(e.r),0,9):null,weights:Array.isArray(e.weights)?e.weights.slice(0,6):undefined,minR:e.minR,source:typeof e.source==='string'?e.source:undefined,pet:typeof e.pet==='string'?e.pet:undefined})):[];
  const pr=(o.prism&&typeof o.prism==='object')?o.prism:{}; o.prism={day:typeof pr.day==='string'?pr.day:'',days:int0(pr.days),vipMax:pr.vipMax===true};   // Revisão 5
  return o;
}

/* participação p (0..0,25) de um pet com o nível do espaço e as estrelas dele */
const V3=()=>DATA.v3===true;
const maxLvlNow=()=>V3()?DATA.v3d.maxLvl:DATA.maxLvl;
/* estágio pelo nível do pet (v3) */
function stageFor(lvl){ let s=DATA.v3d.stages[0]; for(const x of DATA.v3d.stages) if(lvl>=x.from) s=x; return s; }
function share(def,lvl,stars,stg){
  const V=DATA.v3d, R=DATA.pMax*DATA.rarW[clamp(def.r,0,DATA.rarW.length-1)]*(DATA.starBase+DATA.starStep*clamp(stars,1,DATA.maxStars));
  if(V17()){ const l=clamp(lvl,1,V.maxLvl), SM=DATA.v17.stageMult, sm=SM&&SM.on===true?num(SM.m[clamp(int0(stg),0,SM.m.length-1)],1):1; return R*(V.lvlMin+(1-V.lvlMin)*(l-1)/(V.maxLvl-1))*sm; }   // 17b: linear 0,4 → 1, sem salto no estágio
  if(V3()){ const l=clamp(lvl,1,V.maxLvl), L=V.lvlMin+(V.lvlTop-V.lvlMin)*(l-1)/(V.maxLvl-1); return R*L*stageFor(l).mult; }   // Nv 90 evoluído: L×1,5 = 1
  const L=DATA.lvlMin+(1-DATA.lvlMin)*(clamp(lvl,1,DATA.maxLvl)-1)/(DATA.maxLvl-1);
  return R*L;
}
/* nível de um pet: v3 = do próprio pet; v2 = do espaço (compartilhado) */
const levelOf=(S,id)=>{ const o=ensure(S), x=o.owned[id]; return V3()?(x?(x.lvl||1):1):o.lvl; };
const pOf=(S,id)=>{ const o=ensure(S), x=o.owned[id]; return x&&BY[id]?share(BY[id],levelOf(S,id),x.stars,stgOf(x)):0; };
const setStageMult=on=>{ DATA.v17.stageMult.on=!!on; return DATA.v17.stageMult.on; };
/* ===== 3 ataques (v3): chances por qualidade, multiplicador médio e sorteio ===== */
const quality=(stars,lvl)=>0.5*(clamp(stars,1,DATA.maxStars)-1)/(DATA.maxStars-1)+0.5*(clamp(lvl,1,DATA.v3d.maxLvl)-1)/(DATA.v3d.maxLvl-1);
function attackOdds(stars,lvl,id){ const A=DATA.v3d.attacks, P=(BY[id]&&BY[id].attacks)||{}, q=quality(stars,lvl);
  const crit=(A.crit.base+num(P.crit&&P.crit.gain,A.crit.gain)*q)/100, mid=(A.mid.base+num(P.mid&&P.mid.gain,A.mid.gain)*q)/100;
  const avg=(1-crit-mid)*A.basic.dmg+mid*A.mid.dmg+crit*A.crit.dmg; return {crit,mid,basic:1-crit-mid,avg,q}; }
const AVG_MAX=id=>attackOdds(DATA.maxStars,DATA.v3d.maxLvl,id).avg;   // 1,57 (1,665 no Prismático): o golpe é dividido pela média máxima DO PET
/* sorteia o ataque de UM golpe do pet. mult = multiplicador RELATIVO À MÉDIA (a média dos golpes = 1): a batalha usa
   golpe = ATK do herói × stats().pet.atk × 2,0/0,8 × mult, e o fc.js já conta a média. {type:'basic'|'mid'|'crit', name, mult, raw} */
function rollAttack(S,id,rng){ const x=ensure(S).owned[id]; if(!x) return null; const A=DATA.v3d.attacks;
  if(!V3()) return {type:'basic',name:A.basic.name,mult:1,raw:1};
  const od=attackOdds(x.stars,x.lvl,id), u=(rng||Math.random)(), t=u<od.crit?'crit':u<od.crit+od.mid?'mid':'basic';
  return {type:t,name:A[t].name,raw:A[t].dmg,mult:A[t].dmg/od.avg}; }
/* estágio do pet para a tela e a fps-ff (aura própria) */
function stage(S,id){ const x=ensure(S).owned[id]; if(!x) return null; if(!V3()) return {id:'cub',name:'Filhote',mult:1,aura:null,next:null};
  if(V17()){ const V=DATA.v3d.stages, i=stgOf(x), s=V[i], nx=V[i+1]||null, c=canEvolve(S,id);
    return {id:s.id,name:s.name,mult:1,aura:s.aura,index:i,cap:DATA.v17.stageCap[i],next:nx&&{id:nx.id,name:nx.name,at:DATA.v17.stageReq[i+1]},ready:c.ok}; }
  const s=stageFor(x.lvl), nx=DATA.v3d.stages.find(y=>y.from>x.lvl)||null; return {id:s.id,name:s.name,mult:s.mult,aura:s.aura,next:nx&&{id:nx.id,name:nx.name,at:nx.from}}; }
/* valor de combate (o que pesa na FC): p × (dano + vínculo + cura); a coruja vale menos de propósito (coleta não é combate) */
const combat=(S,id)=>{ const t=BY[id]&&DATA.types[BY[id].type]; return t?pOf(S,id)*(t.dmg+t.bond+t.heal):0; };
const lvlCap=host=>{ const T=V3()?DATA.v3d.lvlCapByEra:DATA.lvlCapByEra; return T[clamp(eraMaxOf(host),0,T.length-1)]; };   // eras 7-8: o último (90)
const foodCost=lvl=>Math.ceil(DATA.foodCost.base*Math.pow(V3()?DATA.v3d.foodGrowth:DATA.foodCost.growth,Math.max(1,lvl)-1));

/* aplica fragmentos e sobe estrelas sozinho enquanto der. Pet ainda não nascido: guarda (ex.: fênix antes do andar 100). */
function addFragments(S,id,n,host){
  if(id==='phoenix'&&DATA.v17.on===true&&DATA.v3===true){ const o0=ensure(S); if(o0.t100) id=o0.t100; else { const c=o0.choices.find(c=>c.source==='tower100'||c.source==='phoenix'); if(c){ c.frags+=int0(n); return {id:'choice',added:int0(n),stored:true,stars:0,up:0}; } } }
  const k=int0(n), def=BY[id]; if(!k||!def) return {id,added:0,stored:false,stars:0,up:0,reason:!def?'pet':'zero'};
  if(def.v4&&!V4()) return {id,added:0,stored:false,stars:0,up:0,reason:'off'};   // pets da Revisão 4/5 não recebem nada com a chave desligada
  const o=ensure(S), x=o.owned[id];
  if(!x){ o.stored[id]=(o.stored[id]||0)+k;
    // Prismático (v4): nasce sozinho ao juntar hatchFrags; o que sobrar vira estrela
    if(def.hatchFrags&&(def.nw?liveNew(def):V4())&&o.stored[id]>=def.hatchFrags){   // pets novos: com a chave newPets/newReady
      const left=o.stored[id]-def.hatchFrags; delete o.stored[id];
      o.owned[id]={stars:1,frags:left,lvl:1}; o.hatched++; const nx=o.owned[id]; starUp(nx,def); return {id,added:k,stored:false,hatched:true,stars:nx.stars,up:nx.stars-1}; }
    return {id,added:k,stored:true,stars:0,up:0,total:o.stored[id],need:def.hatchFrags||null}; }
  x.frags+=k; const s0=x.stars; starUp(x,def);
  return {id,added:k,stored:false,stars:x.stars,up:x.stars-s0};
}
const starCostOf=def=>(def&&def.starCost)||DATA.starCost;   // Prismático tem custo próprio
function starUp(x,def){ const C=starCostOf(def); while(x.stars<DATA.maxStars&&x.frags>=C[x.stars-1]){ x.frags-=C[x.stars-1]; x.stars++; } }
/* ---- fontes do Prismático (Revisão 5; só com v4) ---- */
const dayOf=host=>{ const t=num(host&&host.now&&host.now(),Date.now()), C=root.Sys&&root.Sys.clock; if(C&&typeof C.dayKey==='function') return C.dayKey(t); const d=new Date(t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); };
const vipLvl=S=>{ const V=root.Sys&&root.Sys.vip; return V&&V.level?int0(V.level(S)):0; };
/* vitória sobre o chefe da era 8+: 1 fragmento por DIA (a 2ª vitória no dia não dá); com VIP, +1 a cada 4 dias com fragmento. → resultado de addFragments ou {ok:false,reason} */
function prismBoss(S,host,era){ const B=DATA.v4d.prism.boss; if(!V4()) return {ok:false,reason:'off'};
  const e=era!=null?int0(era):int0(host&&host.eraMax&&host.eraMax()); if(e<B.minEra) return {ok:false,reason:'era'};
  const o=ensure(S), d=dayOf(host); if(o.prism.day===d) return {ok:false,reason:'today'};
  o.prism.day=d; o.prism.days++; const n=B.perDay+(vipLvl(S)>=1&&o.prism.days%B.vipEvery===0?1:0);
  return Object.assign({ok:true},addFragments(S,'prism',n,host)); }
/* VIP no nível máximo: 500 fragmentos UMA vez (idempotente; o vip.js chama ao subir, o jogo pode chamar ao abrir a tela) */
function prismVipMax(S,host){ const M=DATA.v4d.prism.vipMax; if(!V4()) return {ok:false,reason:'off'}; const o=ensure(S);
  if(o.prism.vipMax) return {ok:false,reason:'done'}; if(vipLvl(S)<M.level) return {ok:false,reason:'vip'};
  o.prism.vipMax=true; return Object.assign({ok:true},addFragments(S,'prism',M.frags,host)); }

/* maior raridade de ovo permitida (<= r). Fonte única: Sys.loot.capEggR (fps-30, DATA.gates), para a recalibração mudar num lugar só.
   Reservas, nesta ordem: Sys.level.eggMaxR, depois a cópia DATA.eggGate. Sem nenhuma delas, o portão fica desligado (save/teste antigo). */
function gateR(S,host,r){
  const sys=root.Sys||{}, L=sys.level, LO=sys.loot;
  if(LO&&typeof LO.capEggR==='function'){
    // o capEggR lê host.level(); se o jogo ainda não ligou host.level, usa o nível do Sys.level (senão o portão desligaria em silêncio)
    const h=(host&&typeof host.level==='function')||!(L&&L.level)?host:Object.assign({},host,{level:()=>L.level(S)});
    return clamp(int0(LO.capEggR(h,r)),0,r);
  }
  if(L&&typeof L.eggMaxR==='function') return L.eggMaxR(S,host,r);
  if(!(host&&typeof host.level==='function')) return r;
  const lv=int0(host.level()), e=eraMaxOf(host); let x=r;
  while(x>0){ const g=DATA.eggGate[x]; if(!g||(lv>=g.level&&e>=g.era)) break; x--; } return x;
}
const gateOn=(S,host)=>!!((root.Sys&&root.Sys.level)||(host&&typeof host.level==='function'));
/* escolhe qual pet sai de um ovo da raridade r */
function pickPet(S,host,r){
  const o=ensure(S), rng=rngOf(host), E=eggPets(host); let rr=clamp(int0(r),0,maxR(host));
  let pool=E.filter(p=>p.r===rr); while(!pool.length&&rr>0){ rr--; pool=E.filter(p=>p.r===rr); }
  if(!pool.length) return null;
  const fresh=pool.filter(p=>!o.owned[p.id]);
  const from=(fresh.length&&rng()<DATA.newPref)?fresh:pool;   // com todos inéditos, fresh = pool
  return from[Math.floor(rng()*from.length)%from.length];
}
function rollR(rng,weights,minR){ const w=(Array.isArray(weights)?weights:[1]).map((x,i)=>i<minR?0:Math.max(0,num(x,0)));
  let tot=w.reduce((s,x)=>s+x,0); if(tot<=0) return clamp(minR,0,maxR()); let x=rng()*tot;
  for(let i=0;i<w.length;i++){ x-=w[i]; if(x<=0) return i; } return w.length-1; }

/* ovo: {r} raridade fixa, ou {weights, minR} para sortear; opcional source:'instance' (repetido em 5★ vira ração, v5.2).
   Choca na hora. Devolve o que aconteceu (para a batalha avisar). O ovo extra da subida em cadeia não herda o source. */
function addEgg(S,host,egg){
  egg=egg||{}; const o=ensure(S), rng=rngOf(host);
  if(V20()&&!o.first&&egg.source!=='first'){ if(o.pre.length<DATA.v20.maxPre) o.pre.push(Object.assign({},egg)); return {held:true,pre:true,needLevel:DATA.v20.unlockLevel,egg:egg.r!=null?int0(egg.r):null}; }
  if(V17()&&egg.source!=='first'&&!egg.v17ok){ const sp=egg17(S,host,egg);
    if(sp.choice){ o.choices.push({options:sp.choice,source:egg.source||'',frags:0,food:0}); return {choice:true,options:sp.choice.slice(),index:o.choices.length-1,source:egg.source||''}; }
    if(sp.held){ o.gated.push({pet:sp.pet,source:egg.source||''}); return {held:true,gated:true,pet:sp.pet,name:BY[sp.pet].name,needR:BY[sp.pet].r}; }
    if(!sp.pet) return null; egg={pet:sp.pet,r:BY[sp.pet].r,source:egg.source,v17ok:true}; }
  const r0=egg.r!=null?clamp(int0(egg.r),0,maxR(host)):rollR(rng,egg.weights,clamp(int0(egg.minR),0,maxR(host)));
  // Ovo de MARCO do Senhor da Era (eras 5-6): quem guarda até o portão abrir é o Sys.loot da fps-30 (S.sys.loot.held), que depois chama
  // este addEgg com a raridade original. Reaplicar o portão aqui não muda nada para um ovo já liberado; ele vale para a torre e outras fontes.
  const r=egg.source==='tower100'||egg.source==='first'||egg.v17ok?r0:gateR(S,host,r0);   // a fênix do andar 100 ignora o portão
  // egg.pet: pet ESPECÍFICO (a fênix do andar 100: com o Submundo e o Celestial também Lendários, o sorteio poderia dar outro)
  const def=(egg.pet&&BY[egg.pet]&&!BY[egg.pet].noEgg&&avail(BY[egg.pet],host))?BY[egg.pet]:pickPet(S,host,r); if(!def) return null;
  const res={egg:r,rolled:r0,gated:r<r0,pet:def.id,name:def.name,isNew:false,frags:0,to:def.id,stars:0,equipped:false,food:0,chain:null};
  const x=o.owned[def.id];
  if(!x){
    o.owned[def.id]=DATA.v3===true?{stars:1,frags:0,lvl:1}:{stars:1,frags:0}; o.hatched++; res.isNew=true;
    const sv=o.stored[def.id]||0; delete o.stored[def.id];
    if(sv){ const a=addFragments(S,def.id,sv,host); res.frags=sv; res.fromStored=sv; res.stars=a.stars; } else res.stars=1;
    const cur=o.eq; if(!cur||combat(S,def.id)>combat(S,cur)){ o.eq=def.id; res.equipped=true; }
    return res;
  }
  // repetido
  if(V17()&&x.stars>=DATA.maxStars){ res.to='food'; res.food=addFood(S,DATA.instanceRepeatFood[clamp(def.r,0,DATA.instanceRepeatFood.length-1)],host); return res; }
  if(V17()){ const a=addFragments(S,def.id,DATA.repeatFrags,host); Object.assign(res,{frags:DATA.repeatFrags,stars:a.stars}); return res; }
  if(def.id==='golem'){
    const toPhoenix=x.stars>=DATA.maxStars||golemToPhoenix(S);
    const id=toPhoenix?'phoenix':'golem', n=toPhoenix?DATA.golemRepeat.phoenix:DATA.golemRepeat.golem, a=addFragments(S,id,n,host);
    Object.assign(res,{frags:n,to:id,stars:a.stars,stored:a.stored}); return res;
  }
  if(x.stars>=DATA.maxStars){
    if(egg.source==='instance'){ res.to='food'; res.food=addFood(S,DATA.instanceRepeatFood[clamp(def.r,0,DATA.instanceRepeatFood.length-1)],host); return res; }
    if(def.r<DATA.maxEggR){ const up=Math.min(DATA.maxEggR,def.r+1);
      // subida bloqueada pelo portão (ex.: Épico 5★ → Mítico antes do nível 70): vira ração. Rebaixar o ovo voltaria ao mesmo pet em 5★
      // e entraria em laço infinito.
      if(gateOn(S,host)&&gateR(S,host,up)<up){ res.to='food'; res.gatedUp=true; res.food=addFood(S,DATA.instanceRepeatFood[clamp(def.r,0,DATA.instanceRepeatFood.length-1)],host); return res; }
      res.to='egg'; res.chain=addEgg(S,host,{r:up}); return res; }
    const tr=DATA.topRepeat, a=addFragments(S,tr.pet,tr.frags,host);   // Lendário 5★ repetido → fragmentos de golem
    Object.assign(res,{to:tr.pet,frags:tr.frags,stars:a.stars,stored:a.stored}); return res;
  }
  const a=addFragments(S,def.id,DATA.repeatFrags,host); Object.assign(res,{frags:DATA.repeatFrags,stars:a.stars}); return res;
}
/* 17b: que espécie um ovo dá. {pet} | {choice:[ids]} | {pet, held:true} (acima do portão: fica guardado e sai por releaseGated) */
function egg17(S,host,egg){ const E=int0(host&&host.eraMax&&host.eraMax()), ok=id=>BY[id]&&avail(BY[id],host)&&!BY[id].noEgg;
  if(egg.pet&&ok(egg.pet)) return gate17(S,host,egg.pet);
  if(Array.isArray(egg.choice)){ const c=egg.choice.filter(ok); return c.length>1?{choice:c}:c.length?gate17(S,host,c[0]):{}; }
  if(egg.source==='tower100') return {choice:DATA.v17.tower100.filter(ok)};
  const era=egg.era!=null?int0(egg.era):E, home=DATA.pets.find(d=>d.homeEra===era&&ok(d.id));
  if(home) return gate17(S,host,home.id);
  // era sem espécie (5, 6): à escolha entre as JÁ LIBERADAS (era da espécie ≤ era do jogador) da maior raridade que o portão deixa
  const cap=gateR(S,host,9), lib=DATA.pets.filter(d=>ok(d.id)&&d.homeEra!=null&&d.homeEra<=E&&d.r<=cap), top=lib.reduce((m,d)=>Math.max(m,d.r),-1);
  const c=lib.filter(d=>d.r===top).map(d=>d.id); return c.length>1?{choice:c}:c.length?{pet:c[0]}:{}; }
function gate17(S,host,id){ const r=BY[id].r; return gateR(S,host,r)<r?{pet:id,held:true}:{pet:id}; }
/* escolhe o ovo pendente `index` (tela: "escolha seu ovo"). {ok, hatch} ou {ok:false, reason: off|index|pet} */
function chooseEgg(S,host,index,id){ if(!V17()) return {ok:false,reason:'off'}; const o=ensure(S), c=o.choices[int0(index)]; if(!c) return {ok:false,reason:'index'};
  if(!c.options.includes(id)) return {ok:false,reason:'pet'}; o.choices.splice(int0(index),1);
  const hatch=addEgg(S,host,{pet:id,r:BY[id].r,source:c.source,v17ok:true}); if(c.source==='tower100'||c.source==='phoenix') o.t100=id;
  if(c.frags) addFragments(S,id,c.frags,host); if(c.food) addFood(S,c.food,host); return {ok:true,hatch,frags:c.frags,food:c.food}; }
/* solta os ovos guardados pelo portão de raridade (a fps-30 chama junto do Sys.loot.releaseHeld, ao subir de nível) */
function releaseGated(S,host){ if(!V17()) return []; const o=ensure(S), go=[];   // separa ANTES de chocar (o addEgg chama o ensure e pode guardar ovo novo no o.gated)
  o.gated=o.gated.filter(g=>{ const r=BY[g.pet].r; if(gateR(S,host,r)>=r){ go.push({pet:g.pet,r,source:g.source}); return false; } return true; });
  return go.map(g=>addEgg(S,host,{pet:g.pet,r:g.r,source:g.source,v17ok:true})); }
/* que espécie o ovo do chefe da era `era` dá (para a tela de recompensa): {pet} | {choice} | {pet, held} */
const eraEgg=(S,host,era)=>V17()?egg17(S,host,{era}):null;
/* política "auto" (aceita pelo PO na v5.1): golem enquanto a fênix não nasceu; depois, fênix (só 1 pet fica equipado) */
function golemToPhoenix(S){ const o=ensure(S); if(o.golemChoice==='golem') return false; if(o.golemChoice==='phoenix') return true; return !!o.owned.phoenix; }
function setGolemChoice(S,c){ if(!['auto','golem','phoenix'].includes(c)) return false; ensure(S).golemChoice=c; return true; }

function addFood(S,n,host){ const k=int0(n); if(!k) return 0; const o=ensure(S), b=o.food; o.food=Math.min(DATA.maxFood,o.food+k); return o.food-b; }
const vipOff=S=>{ const V=root.Sys&&root.Sys.vip; let p=null; try{ p=V&&V.perks?V.perks(S):null; }catch(e){ p=null; } return Math.max(1,num(p&&p.offlineMult,1)); };   // VIP: offline em dobro
const offH=(S,base)=>{ const V=root.Sys&&root.Sys.vip; try{ const c=V&&V.conv?V.conv(S,'offlineH'):null; return Math.max(base,c?+c.value||base:base); }catch(e){ return base; } };   // VIP de conveniência: teto do offline 10/12/14 h (XP fica em 8 h: o calendário)
function onOffline(S,host,seconds){ const h=clamp(num(seconds,0),0,offH(S,8)*3600)/3600; return addFood(S,Math.floor(h/8*DATA.offlineFoodPer8h*vipOff(S)),host); }
/* desbloqueio pelo nível do jogador (Sys.level); sem o Sys.level carregado, fica liberado. Antes de liberar, os ovos chocam e a ração
   fica guardada, mas o pet não luta (bonus 0) e não dá para alimentar nem equipar. */
const LV=()=>root.Sys&&root.Sys.level;
const V20=()=>DATA.v20.on===true;
const V17=()=>DATA.v17.on===true&&V3();
const ORIG={rarW:DATA.rarW.slice(), pets:DATA.pets.map(d=>({id:d.id,name:d.name,r:d.r,type:d.type}))};
/* liga/desliga a tela 17b (só troca nome/raridade/rarW; o save não muda) */
function setV17(on){ DATA.v17.on=!!on; const sp=DATA.v17.species;
  if(on) DATA.types.combat=DATA.v17.combat; else delete DATA.types.combat;
  for(const d of DATA.pets){ const o=ORIG.pets.find(x=>x.id===d.id), n=sp[d.id];
    if(on&&n){ d.name=n.name; d.r=n.r; d.sprite=n.sprite; d.homeEra=n.era; d.removed=!!n.removed; d.type='combat'; }
    else if(on&&d.nw){ d.type='combat'; d.sprite='pet_'+d.id; }   // pet novo na 17b: combate (todos iguais), sprite assets/anim/pets/pet_<id>; estágios 30/60 e teto pelo sistema de hoje
    else if(o){ d.name=o.name; d.r=o.r; d.type=o.type; delete d.sprite; delete d.homeEra; delete d.removed; } }
  DATA.rarW=on?DATA.v17.rarW.slice():ORIG.rarW.slice(); return DATA.v17.on; }
const stgOf=x=>V17()?clamp(int0(x&&x.stg),0,2):null;
/* EVOLUIR (17b): manual, sem custo, no Nv 30 (médio) e 60 (evoluído). {ok, reason: off|pet|max|level, stage, need} */
function canEvolve(S,id){ if(!V17()) return {ok:false,reason:'off'}; const x=ensure(S).owned[id]; if(!x) return {ok:false,reason:'pet'};
  const st=stgOf(x); if(st>=2) return {ok:false,reason:'max',stage:st}; const need=DATA.v17.stageReq[st+1];
  return int0(x.lvl)>=need?{ok:true,reason:'',stage:st,to:st+1,need}:{ok:false,reason:'level',stage:st,need}; }
function evolve(S,id){ const c=canEvolve(S,id); if(!c.ok) return c; ensure(S).owned[id].stg=c.to; return Object.assign(c,{stage:c.to}); }
/* parte do pet na FC TOTAL (o que a tela mostra como "Bônus na FC"): {now, max} em %, pela conta do Sys.fc com e sem o pet */
function fcShare(S,host,id){ const F=root.Sys&&root.Sys.fc, o=ensure(S), pid=id||o.eq; if(!F||!F.compute||!BY[pid]) return {now:0,max:0};
  const eq0=o.eq; let now=0; try{ o.eq=null; const base=F.compute(S,host); o.eq=o.owned[pid]?pid:null; const w=o.eq?F.compute(S,host):base; now=w>0?(w-base)/w*100:0; } finally{ o.eq=eq0; }
  const R=BY[pid], pm=DATA.pMax*DATA.rarW[clamp(R.r,0,DATA.rarW.length-1)]; return {now:Math.round(now*10)/10,max:Math.round(pm/(1+pm)*1000)/10}; }
/* missões de evento (Festa dos Pets: alimentar e subir nível); o Sys.events só conta com evento ativo */
const evTrack=(S,host,k,n)=>{ const E=root.Sys&&root.Sys.events; if(E&&typeof E.track==='function'){ try{ E.track(S,host,k,n); }catch(e){} } };
/* RAÇÃO POR TOQUE (17b): põe até `amount` (padrão 25) na barra do próximo nível; sobe quando completa. {ok, given, lvl, fx, need, reason} */
function feedTap(S,host,id,amount){ const o=ensure(S), pid=id||o.eq, x=o.owned[pid]; if(!V17()) return {ok:false,reason:'off'}; if(!x) return {ok:false,reason:'pet'};
  const c=canFeed(S,host,pid); if(!c.ok&&c.reason!=='food') return {ok:false,reason:c.reason};
  const need=foodCost(x.lvl), give=Math.min(int0(num(amount,DATA.v17.tapFood))||DATA.v17.tapFood,need-int0(x.fx),o.food); if(give<=0) return {ok:false,reason:'food',need};
  o.food-=give; x.fx=int0(x.fx)+give; x.food=int0(x.food)+give; let up=false; if(x.fx>=need){ x.fx=0; x.lvl++; up=true; }
  evTrack(S,host,'petfeed',1); if(up) evTrack(S,host,'petlevel',1);
  return {ok:true,given:give,up,lvl:x.lvl,fx:x.fx,need:foodCost(x.lvl)}; }
const locked=S=>{ const L=LV(); if(V20()) return !!(L&&L.level&&L.level(S)<DATA.v20.unlockLevel); return !!(L&&L.isUnlocked&&!L.isUnlocked(S,'pet')); };
const lockLevel=()=>{ if(V20()) return DATA.v20.unlockLevel; const L=LV(); return L&&L.unlockLevel?L.unlockLevel('pet'):1; };
/* 1º OVO (v20): o jogo chama ao chegar no Nv 20 (e na carga, se já passou do 20 sem ele). Sorteio só entre Básico e Raro, pela tabela.
   {ok, pet, name, rarity, rarityName, odds:[{r,name,pct}], hatch (o addEgg), pre:[chocagens dos ovos guardados]} ou {ok:false, reason:off|level|done} */
function firstEggOdds(){ const W=DATA.v20.firstEgg.weights, t=W.reduce((a,b)=>a+b,0)||1; return W.map((w,r)=>({r,name:RNAME[r],pct:Math.round(w/t*1000)/10})).filter(x=>x.pct>0); }
function firstEgg(S,host){ if(!V20()) return {ok:false,reason:'off'}; const o=ensure(S); if(o.first) return {ok:false,reason:'done'};
  if(locked(S)) return {ok:false,reason:'level',needLevel:DATA.v20.unlockLevel};
  const r=rollR(rngOf(host),DATA.v20.firstEgg.weights,0), hatch=addEgg(S,host,{r,source:'first'}); o.first=true;
  const pre=o.pre.splice(0).map(e=>addEgg(S,host,e)).filter(Boolean); if(hatch&&hatch.pet) o.eq=hatch.pet;   // o pet do ovo grátis entra equipado
  return {ok:true,pet:hatch&&hatch.pet,name:hatch&&hatch.name,rarity:r,rarityName:RNAME[r],odds:firstEggOdds(),hatch,pre}; }
/* PET NA BATALHA (para o engenheiro): o que desenhar e como bate. null = sem pet equipado ou travado.
   golpe = st.atk × st.pet.atk × hitMult (×rollAttack(...).mult na v3) a cada interval s; cura por onda = st.hp × st.pet.heal. */
function battleInfo(S,host){ const o=ensure(S); if(locked(S)||!o.eq||!o.owned[o.eq]) return null; const d=BY[o.eq], x=o.owned[o.eq], sg=stage(S,o.eq)||{id:'cub'};
  const B=DATA.battle, idx=V17()?stgOf(x):Math.max(0,DATA.v3d.stages.findIndex(z=>z.id===sg.id));
  return {id:d.id,name:d.name,icon:d.icon,rarity:d.r,rarityName:RNAME[d.r],type:d.type,stars:x.stars,level:levelOf(S,d.id),
    stage:idx+1,stageId:sg.id||'cub',aura:sg.aura||null,interval:B.interval,hitMult:B.hitMult,healEvery:B.healEvery,
    // 17b (formato da fps-ff, docs/ARTE_LIGAR.md): assets/anim/pets/<base>_{run,idle,atk1}.png/.json, base = sprite + '' | '_mid' | '_evo' pelo estágio.
    // Célula 512×352, pés em y 307, 12 fps. atk2/atk3 só existem no FILHOTE dos 5 pets antigos (opcionais). fly = papagaio (sombra por código).
    draw:V17()&&d.sprite?drawOf(d.sprite,idx):{sprite:'pet_'+d.id+'_s'+(idx+1),behind:'hero'}}; }
const PET_EXTRA=['era0_mammoth','era1_sphinx','era2_dragon','era3_parrot','era4_mechdog'];
/* TABELA DE BATALHA dos 8 pets (fonte única; o PET_TBL do js/petfx.js tinha só os 5 antigos): posição ao lado do Kael (dx = fração da largura do
   corpo dele; dy px), altura por estágio (fração da altura do Kael), voo (fly = quanto paira, só o papagaio: o Pégaso anda, como na arte aprovada),
   cor do golpe e efeito (fx), AURA por estágio (assets/anim/aura/<id>; null = sem). REGRA DO DONO (sempre evolução, 14/11, via PO): TODOS os pets sem aura no básico, aura leve no médio e forte no evoluído. Os 5 antigos repetem os números do petfx para nada mudar. */
const PET_BATTLE={
  era0_mammoth: {dx:0.42,dy:5,h:[0.46,0.52,0.62],fly:0,    fx:{color:'#d8b47a',hit:'impact'}, aura:[null,'aura4','aura7']},
  era1_sphinx:  {dx:0.42,dy:5,h:[0.46,0.52,0.62],fly:0,    fx:{color:'#ffd27a',hit:'sand'},   aura:[null,'aura4','aura7']},
  era2_dragon:  {dx:0.42,dy:5,h:[0.48,0.54,0.64],fly:0,    fx:{color:'#ff7a3a',hit:'fire'},   aura:[null,'aura4','aura7']},
  era3_parrot:  {dx:0.44,dy:0,h:[0.40,0.46,0.56],fly:0.13, fx:{color:'#ff5a3a',hit:'feather'},aura:[null,'aura4','aura7']},
  era4_mechdog: {dx:0.42,dy:5,h:[0.46,0.52,0.62],fly:0,    fx:{color:'#8cc8ff',hit:'spark'},  aura:[null,'aura4','aura7']},
  era7_cerberus:{dx:0.42,dy:5,h:[0.48,0.55,0.65],fly:0,    fx:{color:'#ff5a1a',hit:'fire',glow:2},  aura:[null,'aura7','aura_evil']},   // Submundo: fogo, aura maligna
  era8_pegasus: {dx:0.43,dy:4,h:[0.50,0.57,0.66],fly:0,    fx:{color:'#ffe07a',hit:'light',glow:2}, aura:[null,'aura10','aura_holy']},  // Celestial: luz, aura celestial
  prism_fox:    {dx:0.42,dy:5,h:[0.42,0.49,0.58],fly:0,    fx:{color:'#c9a0ff',hit:'prism',glow:3,prism:true}, aura:[null,'aura10','aura13']},   // Divino: arco-íris
  // 9 pets novos (sprite 'pet_'+id na 17b). Os que voam: falcão, corvo, grifo, dragão de gelo, serpe. hit = efeito da habilidade (skill do pet)
  pet_shadowwolf:{dx:0.42,dy:5,h:[0.44,0.50,0.60],fly:0,    fx:{color:'#7a5cff',hit:'dash'},   aura:[null,'aura4','aura7']},
  pet_falcon:    {dx:0.44,dy:0,h:[0.38,0.44,0.54],fly:0.15, fx:{color:'#d8b47a',hit:'feather'},aura:[null,'aura4','aura7']},
  pet_panther:   {dx:0.42,dy:5,h:[0.44,0.50,0.60],fly:0,    fx:{color:'#b07cff',hit:'blink'},  aura:[null,'aura4','aura7']},
  pet_scorpion:  {dx:0.42,dy:6,h:[0.40,0.46,0.56],fly:0,    fx:{color:'#7fe07a',hit:'poison'}, aura:[null,'aura4','aura7']},
  pet_crow:      {dx:0.44,dy:0,h:[0.38,0.44,0.54],fly:0.15, fx:{color:'#8cc8ff',hit:'spark'},  aura:[null,'aura4','aura7']},
  pet_griffin:   {dx:0.43,dy:0,h:[0.48,0.55,0.65],fly:0.12, fx:{color:'#3a2a24',hit:'impact',glow:1}, aura:[null,'aura7','aura10']},
  pet_obsidian:  {dx:0.42,dy:5,h:[0.48,0.55,0.65],fly:0,    fx:{color:'#ff5a1a',hit:'impact',glow:1}, aura:[null,'aura7','aura10']},
  pet_icedragon: {dx:0.43,dy:0,h:[0.50,0.57,0.66],fly:0.12, fx:{color:'#9ae6ff',hit:'ice',glow:2},    aura:[null,'aura10','aura13']},
  pet_wyvernpet: {dx:0.43,dy:0,h:[0.50,0.57,0.66],fly:0.12, fx:{color:'#ff6a2a',hit:'fire',glow:2},   aura:[null,'aura7','aura_evil']},
};
function drawOf(sprite,idx){ const st=clamp(int0(idx),0,2), base=sprite+(['','_mid','_evo'][st]), extra=st===0&&PET_EXTRA.includes(sprite)?['atk2','atk3']:[], B=PET_BATTLE[sprite]||PET_BATTLE.era0_mammoth;
  return {sprite,base,stageSuffix:base.slice(sprite.length),sheets:['run','idle','atk1'].concat(extra).map(k=>base+'_'+k),extra:extra.map(k=>base+'_'+k),
    cell:{w:512,h:352,feetY:307,fps:12},fly:B.fly>0,behind:'hero',
    layout:{dx:B.dx,dy:B.dy,h:B.h[st],hAll:B.h.slice(),fly:B.fly},fx:Object.assign({},B.fx),aura:B.aura[st]?{id:B.aura[st],sheet:'assets/anim/aura/'+B.aura[st]}:null}; }
const LOCK='<svg class="sys-lock-ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" fill="currentColor"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="15.4" r="1.6" fill="#0008"/></svg>';   // cadeado desenhado (sem emoji, pedido do PO)
/* alimentar: sobe o nível do ESPAÇO (vale para todos os pets). {ok, n, spent, reason:'locked'|'cap'|'food'|'max'} */
/* v3: alimenta UM pet (id; padrão = o equipado). v2: o nível do espaço. */
function canFeed(S,host,id){ const o=ensure(S), pid=id||o.eq, cur=V3()?(o.owned[pid]?o.owned[pid].lvl:0):o.lvl, c=foodCost(cur||1);
  if(V3()&&!o.owned[pid]) return {ok:false,reason:'pet',cost:0};
  if(locked(S)) return {ok:false,reason:'locked',cost:c};
  if(cur>=maxLvlNow()) return {ok:false,reason:'max',cost:0}; if(cur>=lvlCap(host)) return {ok:false,reason:'cap',cost:c};
  if(V17()&&cur>=DATA.v17.stageCap[stgOf(o.owned[pid])]) return {ok:false,reason:'evolve',cost:c,need:DATA.v17.stageReq[stgOf(o.owned[pid])+1]};
  if(o.food<c) return {ok:false,reason:'food',cost:c}; return {ok:true,reason:'',cost:c}; }
function feed(S,host,times,id){ let n=0, spent=0, why=''; const max=times===Infinity?1e6:Math.max(1,int0(num(times,1))), pid=id||ensure(S).eq;
  while(n<max){ const c=canFeed(S,host,pid); if(!c.ok){ why=c.reason; break; } const o=S.sys.pet; o.food-=c.cost; if(V3()){ const x=o.owned[pid]; x.lvl++; x.food=int0(x.food)+c.cost; } else o.lvl++; spent+=c.cost; n++; }
  if(n>0){ evTrack(S,host,'petfeed',n); evTrack(S,host,'petlevel',n); }
  return {ok:n>0,n,spent,reason:n>0?'':why,lvl:V3()&&pid?levelOf(S,pid):ensure(S).lvl}; }
/* LIBERAR (v3): o pet volta ao Nv 1 e devolve releaseRefund (80%) da ração gasta nele. {ok, reason, refund, from} */
function canRelease(S,id){ const x=ensure(S).owned[id]; if(!V3()) return {ok:false,reason:'off',refund:0}; if(!x) return {ok:false,reason:'pet',refund:0};
  if(!(int0(x.lvl)>1)) return {ok:false,reason:'level',refund:0}; return {ok:true,reason:'',refund:Math.floor(int0(x.food)*DATA.v3d.releaseRefund),from:x.lvl}; }
function release(S,host,id){ const c=canRelease(S,id); if(!c.ok) return c; const o=ensure(S), x=o.owned[id];
  x.lvl=1; x.food=0; x.fx=0; addFood(S,c.refund,host); return c; }   // 17b: estrelas e estágio (x.stg) ficam
function equip(S,id){ const o=ensure(S); if(locked(S)) return false; if(id==null){ o.eq=null; return true; } if(!o.owned[id]) return false; if(DATA.swapKeep.on===true&&o.eq&&o.eq!==id) moveInvest(o,o.eq,id); o.eq=id; return true; }
/* troca sem perder (chave DATA.swapKeep, só com nível por pet): o principal novo fica com o maior nível; os dois trocam lvl, food, stg, fx. {moved, lvl} */
const INV=['lvl','food','stg','fx'];
const richer=(a,b)=>int0(a.lvl)>int0(b.lvl)||(int0(a.lvl)===int0(b.lvl)&&(int0(a.stg)>int0(b.stg)||(int0(a.stg)===int0(b.stg)&&int0(a.food)+int0(a.fx)>int0(b.food)+int0(b.fx))));
function moveInvest(o,from,to){ const a=o.owned[from], b=o.owned[to]; if(!V3()||!a||!b) return {moved:false};
  if(!richer(a,b)) return {moved:false,lvl:int0(b.lvl)};
  const ta={}, tb={}; for(const k of INV){ ta[k]=a[k]; tb[k]=b[k]; }
  for(const k of INV){ if(tb[k]===undefined) delete a[k]; else a[k]=tb[k]; if(ta[k]===undefined) delete b[k]; else b[k]=ta[k]; }
  if(!(int0(a.lvl)>=1)) a.lvl=1; return {moved:true,lvl:b.lvl}; }
/* trocar o pet principal (tela). Desligado: {ok:false, reason:'off'} e nada muda (use equip). {ok, reason: off|locked|pet, from, to, moved, lvl} */
function swapMain(S,host,id){ if(DATA.swapKeep.on!==true) return {ok:false,reason:'off'}; const o=ensure(S); if(locked(S)) return {ok:false,reason:'locked'};
  if(!o.owned[id]) return {ok:false,reason:'pet'}; const from=o.eq, r=from&&from!==id?moveInvest(o,from,id):{moved:false}; o.eq=id;
  return {ok:true,reason:'',from:from||null,to:id,moved:!!r.moved,lvl:levelOf(S,id)}; }
/* o que a troca faria, sem mudar nada (confirmação na tela): {moved, lvlNew, lvlOld} */
function swapPreview(S,id){ if(DATA.swapKeep.on!==true) return null; const o=ensure(S), a=o.owned[o.eq], b=o.owned[id]; if(!b) return null;
  const mv=V3()&&!!a&&o.eq!==id&&richer(a,b); return {moved:mv,lvlNew:mv?int0(a.lvl):levelOf(S,id),lvlOld:a?(mv?int0(b.lvl)||1:levelOf(S,o.eq)):0}; }
const best=S=>{ const o=ensure(S); let b=null; for(const id in o.owned) if(!b||combat(S,id)>combat(S,b)) b=id; return b; };

function bonus(S){
  const b={atkPct:0,hpPct:0,goldPct:0,critPct:0,defPct:0,fc:0,petAtk:0,petHp:0,petBond:0,petCap:0}; if(!S) return b; const o=ensure(S);
  if(!o.eq||locked(S)) return b; const t=DATA.types[BY[o.eq].type], p=pOf(S,o.eq);
  // petBond (vínculo) = +HP real do herói, mas o fc.js o conta como parte do pet (dentro do teto de 20%)
  const x=o.owned[o.eq], am=V3()&&x?attackOdds(x.stars,x.lvl,o.eq).avg/AVG_MAX(o.eq):1;
  if(V4()&&BY[o.eq].capShare) b.petCap=BY[o.eq].capShare;   // teto POR PET no fc.js (Prismático: 1/3 da FC do herói)   // v3: golpe ÷ 1,57 × média do sorteio (teto de 20% mantido)
  b.petAtk=t.dmg*p*am*100; b.petBond=t.bond*p*100; b.petHp=t.heal*p*100; b.goldPct=t.gold*p*100;
  for(const k in b) b[k]=Math.round(b[k]*1e6)/1e6;
  return b;
}
function advice(S,host){
  const o=ensure(S), out=[]; if(!Object.keys(o.owned).length) return out;
  const bst=best(S); if(bst&&bst!==o.eq){ const d=deltaFor(S,bst); out.push({id:'pet.equip',icon:BY[bst].icon,label:`Equipar ${BY[bst].name}`,delta:d,cost:'grátis',ready:true,tab:'pet'}); }
  const c=canFeed(S,host); if(o.eq&&c.reason!=='max'&&c.reason!=='cap'&&c.reason!=='pet'){ const tgt=V3()?o.owned[o.eq]:o, save=tgt.lvl; tgt.lvl++; const nb=bonus(S); tgt.lvl=save; const cb=bonus(S), d={};
    for(const k in nb) d[k]=nb[k]-cb[k]; out.push({id:'pet.feed',icon:'pet',label:`Alimentar o pet (Nv ${save+1})`,delta:d,cost:`${c.cost} de ração`,ready:c.ok,tab:'pet'}); }
  return out;
}
function deltaFor(S,id){ const o=ensure(S), save=o.eq, cb=bonus(S); o.eq=id; const nb=bonus(S); o.eq=save; const d={}; for(const k in nb) d[k]=nb[k]-cb[k]; return d; }

/* ---------------- UI (opcional) ---------------- */
function render(el,S,host,opt){
  if(!el) return; opt=opt||{};
  if(locked(S)){ el.innerHTML=`<div class="sys-pet"><div class="sys-card sys-lock">${LOCK}<b>Pets</b><span>Libera no nível ${lockLevel()}</span><small>${Object.keys(ensure(S).owned).length} pet(s) esperando</small></div></div>`; el.onclick=null; return; }
  const o=ensure(S), cap=lvlCap(host), c=canFeed(S,host), msg=el.__sysPetMsg||'';
  const card=def=>{ const x=o.owned[def.id], eq=o.eq===def.id, t=DATA.types[def.type];
    if(!x){ const sv=o.stored[def.id]||0;
      return `<div class="sys-card sys-pet-card off"><span class="sys-pet-ic">❔</span><b>${esc(def.name)}</b><small>${RNAME[def.r]} · ${esc(t.name)}</small>
        <small>${def.id==='phoenix'?`${sv?`${sv} fragmentos guardados · `:''}nasce no andar 100 da torre`:def.hatchFrags?`${fmtN(sv)}/${fmtN(def.hatchFrags)} fragmentos · eventos, arena, VIP 10, chefe da era 8 e torre`:(sv?`${sv} fragmentos guardados`:'ainda não chocou')}</small></div>`; }
    const need=x.stars<DATA.maxStars?starCostOf(def)[x.stars-1]:0;
    return `<button class="sys-card sys-pet-card${eq?' eq':''}" data-id="${def.id}" ${eq?'disabled':''}>
      <span class="sys-pet-ic">${def.icon}</span><b>${esc(def.name)}</b><small>${RNAME[def.r]} · ${esc(t.name)}</small>
      <span class="sys-pet-st">${'★'.repeat(x.stars)}${'☆'.repeat(DATA.maxStars-x.stars)}</span>
      <small>${need?`${x.frags}/${need} fragmentos`:'5★ máximo'} · ${eq?'Equipado':'Toque para equipar'}</small></button>`; };
  el.innerHTML=`<div class="sys-pet">
    <div class="sys-pet-top"><span>🍖 <b>${fmtN(o.food)}</b> ração</span><span>Nível do pet <b>${o.eq?levelOf(S,o.eq):o.lvl}</b>/${cap}</span>
      <button class="sys-btn sys-pet-feed" data-feed="1" ${c.ok?'':'disabled'}>${c.reason==='max'?'Máximo':c.reason==='cap'?'Teto da era':`Alimentar<small>${c.cost} de ração</small>`}</button></div>
    <div class="sys-grid sys-pet-grid">${DATA.pets.filter(p=>avail(p,host)).map(card).join('')}</div>
    <div class="sys-pet-golem">Golem repetido vira: <button class="sys-btn dim" data-gc="1">${o.golemChoice==='auto'?'Automático':o.golemChoice==='golem'?'Fragmentos de golem':'Fragmentos de fênix'}</button></div>
    <div class="sys-pet-msg">${esc(msg)||'O nível é do espaço: trocar de pet não perde a ração investida.'}</div>
  </div>`;
  el.onclick=ev=>{ const b=ev.target.closest&&ev.target.closest('button'); if(!b||b.disabled) return;
    if(b.dataset.feed){ const r=feed(S,host,1); if(r.ok){ el.__sysPetMsg=`Nível do pet ${r.lvl}`; changed(host); } }
    else if(b.dataset.gc){ const seq=['auto','golem','phoenix']; setGolemChoice(S,seq[(seq.indexOf(o.golemChoice)+1)%3]); changed(host); }
    else if(b.dataset.id&&equip(S,b.dataset.id)){ el.__sysPetMsg=`${BY[b.dataset.id].icon} ${BY[b.dataset.id].name} equipado`; changed(host); }
    render(el,S,host,opt); };
}

const API={DATA,setStageMult,battleTable:()=>JSON.parse(JSON.stringify(PET_BATTLE)),ensure,share,levelOf,stage,attackOdds,rollAttack,canRelease,release,avail,canResetLevel:canRelease,resetLevel:release,pOf,combat,lvlCap,foodCost,addFragments,addEgg,setV17,chooseEgg,releaseGated,eraEgg,canEvolve,evolve,fcShare,feedTap,firstEgg,firstEggOdds,battleInfo,prismBoss,prismVipMax,starCostOf,addFood,onOffline,canFeed,feed,equip,swapMain,swapPreview,best,setGolemChoice,golemToPhoenix,bonus,advice,render};
root.Sys=root.Sys||{}; root.Sys.pet=API;
if(typeof module!=='undefined'&&module.exports) module.exports=API;
})(typeof window!=='undefined'?window:globalThis);
