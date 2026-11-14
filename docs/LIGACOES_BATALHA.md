# Ligações da batalha com os módulos da Sistemas (Sistemas, 13/11/2026)

Ordem do dono: tudo o que foi aprovado tem de funcionar no jogo. Este documento traz, **prontos para colar**, os trechos que faltam na batalha do Engenheiro (fps-c8) para cinco sistemas aprovados que hoje só existem no `js/sys`:

1. Afinidade das eras no dano (`Sys.affinity.mult`): **o Engenheiro já está ligando** (`affMult` no `js/battle.js`, em edição, ainda sem commit). Os patches abaixo NÃO repetem isso; só marcam o Boneco do Ensaio como neutro (`noAff`), como o `affMult` dele espera
2. Golpes especiais (`Sys.strikes.profile` / `onHeroHit` / `onHeroHurt`, com a montaria e o caminho somados lá dentro)
3. Grimório na luta (`Sys.grimoire.loadout` / `cast`)
4. Provação do Mestre (`Sys.trial.start` / `finish`)
5. Ensaio de caminho (`Sys.pathTry.start` / `finish`) e os atributos do caminho (`Sys.path.statOf`)

A Sistemas **não mexeu** em nenhum arquivo do Engenheiro. Cada patch é `antes → depois`, ancorado numa linha que existe **uma única vez** no arquivo de hoje (commit `db1e050` + a edição do `affMult` que o Engenheiro tem aberta no `js/battle.js`; os patches valem com ou sem ela). Os patches foram aplicados numa cópia do jogo, passaram no `node --check` e rodaram no sandbox do `test/e2e` (resultado no fim).

**Com todas as chaves desligadas a batalha fica igual à de hoje**: perfil dos golpes `null` (nenhum sorteio a mais), afinidade `1`, `statOf` `{}`, loadout vazio, nenhuma regra de luta especial. Nada muda até alguém ligar uma chave.

---

## 1. O que JÁ está ligado (não duplicar)

| Onde | O que já existe |
|---|---|
| `js/battle.js` `affMult` + `hitEnemy` (em edição, sem commit) | afinidade no dano do herói: todo golpe do herói (básico, especial, ultimate, arco, combo, contra-ataque); pet e magias fora; `e.noAff` = neutro |
| `js/battle.js` `waveClear` | `Sys.grimoire.grant(S,Sys.host,'eraLord'/'chief50',{era})` ao vencer o Senhor da Era e o chefe do meio da era (páginas do Grimório) |
| `js/fullbattle.js` `fbTick` | `WeakSeal` (selo "Fraco contra", lê `Sys.affinity.warn`) e `PTrial.mount/update` (selo "Teto Nv X") |
| `js/sys/level.js` `addXp` (linha 91) | teto de XP da Provação (`Sys.trial.gateXp`) já é aplicado dentro do `Sys.level.addXp`, só com a chave do `Sys.trial` ligada. **Nada a fazer na batalha** |
| `js/sys/fc.js` | FC já soma `Sys.strikes.totals` / `fcFactor`, e os `bonus(S)` do Grimório, Provação, montaria etc. |
| `js/sys/loot.js` | itens novos já recebem `it.stk` (golpes) com a chave do `Sys.strikes` ligada |
| `js/p_trial.js`, `js/p_path.js`, `js/p_grim.js` | telas prontas. As pontes `PTrial.battle` e `PPath.battle` estão `null`: sem elas o botão Lutar / Testar grátis avisa que a luta "ainda não está ligada" |

**O que NÃO existe hoje na batalha** (grep em `js/*.js`): nenhuma chamada a `Sys.strikes.profile/onHeroHit/onHeroHurt`, `Sys.grimoire.loadout/cast`, `Sys.trial.start/finish`, `Sys.pathTry.start/finish`, `Sys.path.statOf`. É isso que os patches abaixo ligam.

---

## 2. Como ficou montado (resumo para o Engenheiro)

- **Um bloco só de funções `lig*`** em `js/battle.js`, logo depois do `floatText` (patch B1). As outras mudanças são linhas curtas que chamam esse bloco.
- **Atributos** (`ligStats`, no início do `heroApply`): soma `Sys.path.statOf(S)` (velocidade de ataque, dano crítico) respeitando os tetos do `Sys.stats.DATA.caps`; no Ensaio usa o bônus do caminho testado; na Provação "sem pet"/"sem montaria" recalcula com `Sys.fc.stats(S,host,{skip:'pet'|'mount'})`; a magia "Caldeira a Vapor" entra aqui também.
- **Perfil dos golpes** (`ligHero`, no fim do `heroApply`): `B.hero.stk = Sys.strikes.profile(S,Sys.host)`. Como o `heroApply` roda em `startBattle`, `refreshHero` e na entrada da instância, e o `refreshHero` já é chamado por `statsChanged` (equipar, montaria, estrela, caminho em `p_path.js`), **o perfil se refaz sozinho em toda troca de item, montaria ou caminho**.
- **Dano do herói** (`hitEnemy`): a afinidade é a do `affMult` do Engenheiro; depois do acerto entra `ligAfterHit` (combo, atordoar, roubo de vida, rótulos com `floatText`). Combo e contra-ataque passam pelo `hitEnemy`, então levam a afinidade sozinhos. O módulo da afinidade **só mexe no dano do herói** (não há multiplicador no dano recebido); magias ficam fora, como o Engenheiro decidiu.
- **Dano recebido** (`heroHit`): depois da DEF, `ligHurt` (esquiva, contra-ataque de 60% do básico, escudo de magia, esquiva da magia). Na esquiva o herói não pisca nem perde vida.
- **Atordoado**: `e.stunT` (segundos) e `e.imm` (imune até) no inimigo; atordoado não ataca (patch B9). Magias usam a mesma imunidade do `Sys.strikes.DATA`.
- **Grimório** (`ligSpells`, no `step`): monta o conjunto do modo (`Sys.grimoire.modeFor({boss})`: onda 5 / Provação = Chefe, resto = Fases), recarga corre sempre, a magia pronta lança assim que houver inimigo em alcance; primeira recarga = metade. Faixa com o nome da magia (`B.banner` pequeno, cor do módulo).
- **Lutas especiais** (Provação e Ensaio) rodam **como uma instância** (`startInstanceRun` do `js/instfx.js`): mesmo laço, sem drop de fase, sem XP, save suspenso, relógio no cabeçalho. A diferença é `run.special`: no fim, em vez do `Sys.instances.finish`, vai para a tela (`PTrial.finish` / `PPath.finish`), que faz a única chamada ao `finish` do módulo e abre o resultado / a comparação.
- **Pontes**: `ligBridges()` (fim do `js/instfx.js`) põe `PTrial.battle = ligTrialBattle` e `PPath.battle = ligPathBattle`; é chamada na última linha do `js/fullbattle.js` (as telas `p_trial`/`p_path` já carregaram nesse ponto).

### Regras de cada luta especial

| Spec do módulo | Onde vale |
|---|---|
| Provação `noPet` | `petInfo()` devolve `null` (o pet não bate, não cura, não aparece) e o bônus do `Sys.pet` sai dos atributos (`skip:'pet'`) |
| Provação `t30` (`sec:30`) | relógio da instância = `spec.sec`; vencer depois do tempo o módulo conta como derrota |
| Provação `noMount` | montaria some do desenho (lute a pé), bônus do `Sys.mount` sai (`skip:'mount'`) e o golpe que a montaria reforça sai do perfil |
| Provação `noSpells` | `ligSpells` não lança nada |
| Provação `half` (`hpStart:0.5`) | herói entra com 50% da vida |
| Provação inimigo | chefe da fase `spec.enemy.stage` × `hpMul` 1,2 / `dmgMul` 1,0, nome "Mestre <mentor>" |
| Ensaio | Boneco de Treino imortal (`killEnemy` não derruba) e neutro na afinidade (`noAff`), bate `hitPctHeroHp`% da vida do herói a cada `hitEverySec` s, herói fica com no mínimo `heroMinHp`; golpes e atributos do caminho testado só nessa luta; no fim manda `{damage, sec, life, lifeMax, stunSec}` |

---

## 3. Chaves: quais ligar e em que ordem

Todos os módulos nascem com `DATA.on=false`. Ligar com `Sys.<mod>.setOn(true)` no ponto onde o Engenheiro liga as chaves aprovadas (ex.: `sysBoot` em `js/farm.js`), **só depois** de colar os patches. Telas: `PANEL_ON.<tela>=true`.

| # | Chave | Depende de | Observação |
|---|---|---|---|
| 1 | `Sys.affinity.setOn(true)` | o `affMult` do Engenheiro commitado | o selo "Fraco contra" já está na tela; com a chave o dano passa a valer ×1,15 / ×0,90 |
| 2 | `Sys.strikes.setOn(true)` | nada (antes de sair drop novo) | itens novos ganham golpes; itens antigos geram com semente fixa. Opcional depois: `Sys.mount.DATA.strike.on=true` (montaria reforça 1 golpe) |
| 3 | `Sys.path.setOn(true)` + `PANEL_ON.path=true` | 2 para os golpes do caminho valerem | sem a 2, o caminho só dá os atributos (`statOf`) e o estilo da afinidade |
| 4 | `Sys.pathTry.setOn(true)` | **3 obrigatória** (o `p_path.js` só testa com o `Sys.path` ligado) e 2 | sem a 2 o ensaio só mostra a diferença de atributo |
| 5 | `Sys.grimoire.setOn(true)` + `PANEL_ON.grim=true` | nada | as páginas já caem no `waveClear` |
| 6 | `Sys.trial.setOn(true)` + `PANEL_ON.trial=true` | **todos os patches colados** (B, P1, I, F1) | ligar POR ÚLTIMO: a chave segura o nível no marco (10, 20 ...) na hora; sem a luta ligada o jogador fica preso no teto |

---

## 4. Patches (colar na ordem; cada "antes" aparece uma única vez no arquivo)

Não existe B6: a afinidade no `hitEnemy` é a do `affMult` do Engenheiro.

### `js/battle.js`

**B1. bloco de funções ligX (logo depois do floatText)**

Antes:

```js
function floatText(x,y,txt,col,big){ B.fx.push({x:x+(Math.random()-.5)*14,y,txt,col,t:0,big}); }
```

Depois:

```js
function floatText(x,y,txt,col,big){ B.fx.push({x:x+(Math.random()-.5)*14,y,txt,col,t:0,big}); }
/* ===== LIGAÇÕES DA SISTEMAS NA BATALHA (docs/LIGACOES_BATALHA.md) =====
   Golpes especiais (Sys.strikes.profile/onHeroHit/onHeroHurt), Grimório (Sys.grimoire.loadout/cast),
   atributos do caminho (Sys.path.statOf) e as regras das lutas especiais (Provação / Ensaio, em B.inst.run). Cada módulo com a chave
   DESLIGADA devolve "nada": multiplicador 1, perfil null, loadout vazio, statOf {} — a batalha fica igual à de hoje. */
function ligStats(st){ const R=B.inst&&B.inst.run; let o=st;
  if(R&&R.skip&&window.Sys&&Sys.fc&&Sys.host){ try{ o=Sys.fc.stats(S,Sys.host,{skip:R.skip}); }catch(e){ o=st; } }   /* Provação "sem pet" / "sem montaria": o bônus do módulo sai da conta */
  o=Object.assign({},o); const P=window.Sys&&Sys.path, cap=(window.Sys&&Sys.stats&&Sys.stats.DATA&&Sys.stats.DATA.caps)||{aspd:100,critDmg:400};
  let ps={}; if(R&&R.bonusStat) ps=R.bonusStat; else if(P&&typeof P.statOf==='function'){ try{ ps=P.statOf(S)||{}; }catch(e){ ps={}; } }   /* ensaio: o bônus do caminho testado; fora dele: o caminho escolhido */
  const bf=B.buff&&B.buff.key==='aspd'&&B.t<B.buff.until?B.buff.val:0;   /* magia "Caldeira a Vapor" */
  if(ps.aspd||bf) o.aspd=Math.min(cap.aspd,(o.aspd||0)+(+ps.aspd||0)+bf);
  if(ps.critDmg) o.critDmg=Math.min(cap.critDmg,(o.critDmg==null?100:o.critDmg)+(+ps.critDmg||0));
  return o; }
function ligProfile(){ const K=window.Sys&&Sys.strikes; if(!K||typeof K.on!=='function'||!K.on()) return null; let P=null; try{ P=K.profile(S,Sys.host); }catch(e){ return null; }
  const R=B.inst&&B.inst.run; if(!P||!R||!(R.bonusStrikes||(R.noMount&&P.mount))) return P;
  const raw=Object.assign({},P.raw); if(R.noMount&&P.mount) raw[P.mount.k]=Math.max(0,raw[P.mount.k]-P.mount.value);   /* sem montaria: tira o golpe que ela reforça */
  if(R.bonusStrikes) for(const k in R.bonusStrikes) if(k in raw) raw[k]+=(+R.bonusStrikes[k]||0);   /* ensaio: golpes do caminho testado, só nesta luta */
  const n={},b={}; for(const k of K.DATA.keys){ n[k]=Math.min(raw[k],K.DATA.cap[k]); b[k]=Math.min(raw[k],K.DATA.bossCap[k]); }
  return Object.assign({},P,{normal:n,boss:b,raw}); }
function ligHero(h){ h.stk=ligProfile(); h.ligV=(h.ligV||0)+1; if(h.hp>h.maxhp) h.hp=h.maxhp; B.spellDirty=true; }   /* chamado no fim do heroApply: entrar na luta, refreshHero (item, montaria, caminho) */
function ligLabels(L,x,y){ L.forEach((l,i)=>floatText(x,y-i*14,l.text,l.color,0)); }
function ligStun(e,sec,tough){ if(B.t<(e.imm||0)) return; const K=(window.Sys&&Sys.strikes&&Sys.strikes.DATA)||{};
  e.stunT=sec; e.imm=B.t+sec+(tough?(K.stunImmuneSecBoss||4):(K.stunImmuneSec||3)); if(B.inst) B.inst.stun=(B.inst.stun||0)+sec; }
function ligAfterHit(e,d,a,h){ if(B.inst) B.inst.dmg=(B.inst.dmg||0)+d; const hero=B.hero, P=hero&&hero.stk; if(!P) return;
  let r=null; try{ r=Sys.strikes.onHeroHit(S,{profile:P,kind:a.type||'s1',dmg:d,boss:!!e.boss,pvp:false,isCombo:!!(h&&h.combo),now:B.t,immuneUntil:e.imm||0}); }catch(er){ r=null; }
  if(!r||!r.labels||!r.labels.length) return;
  if(r.stun&&!e.dead){ e.stunT=r.stunSec; e.imm=r.immuneUntil; if(B.inst) B.inst.stun=(B.inst.stun||0)+r.stunSec; }
  if(r.lifesteal>0&&hero.hp>0) hero.hp=Math.min(hero.maxhp,hero.hp+r.lifesteal);
  ligLabels(r.labels,eX(e),e.boss?GY-(e.dh||150)-60:GY-(e.dh||90)-44);
  if(r.combo){ const t=e.dead?target():e; if(t) hitEnemy(t,r.comboMult,a,{combo:1}); } }   /* combo = UM golpe extra de 50% do básico; não puxa outro combo */
function ligHurt(d,src){ const h=B.hero, out={skip:false,dmg:d}, P=h&&h.stk, boss=!!(src&&src.boss);
  if(B.buff&&B.buff.key==='dodge'&&B.t<B.buff.until&&Math.random()*100<B.buff.val){ floatText(HX,GY-HS*0.9,'ESQUIVA','#7fd8ff'); out.skip=true; return out; }   /* magia "Névoa do Capitão Fantasma" */
  if(P){ let r=null; try{ r=Sys.strikes.onHeroHurt(S,{profile:P,dmg:d,boss,pvp:false}); }catch(e){ r=null; }
    if(r&&r.labels&&r.labels.length){ ligLabels(r.labels,HX,GY-HS*0.9-16);
      if(r.counter){ const t=target(); if(t) hitEnemy(t,r.counterMult,{type:'s1',col:'#ff5a4a',fx:null},{combo:1}); }   /* contra-ataque: 60% do básico, sai mesmo na esquiva */
      if(r.dodge){ out.skip=true; return out; } out.dmg=r.dmg; } }
  if(B.shield&&B.shield.amt>0&&B.t<B.shield.until){ const ab=Math.min(B.shield.amt,out.dmg); B.shield.amt-=ab; out.dmg-=ab; if(ab>0) floatText(HX,GY-HS*0.7,'ESCUDO','#9ad8ff'); if(out.dmg<=0) out.skip=true; }
  return out; }
function ligDmg(e,v,col){ v=Math.max(0,v); e.hp-=v; e.hit=0.12; floatText(eX(e),e.boss?GY-(e.dh||150)-36:GY-(e.dh||90)-20,fmt(v),col||'#ffc94a',1);
  if(B.inst) B.inst.dmg=(B.inst.dmg||0)+v; if(window.__stay&&e.hp<=0) e.hp=e.maxhp; if(e.hp<=0) killEnemy(e); }
function ligCast(G,id,boss){ const h=B.hero; if(!h) return; const list=B.en.filter(e=>!e.dead&&e.x<=LW+20);
  let r=null; try{ r=G.cast(S,id,{atk:h.atk,hpMax:h.maxhp,boss,pvp:false,targets:Math.max(1,list.length)}); }catch(e){ r=null; } if(!r||!r.ok) return;
  B.banner={txt:r.label,sub:'',t:0,dur:.9,col:r.color||'#ffc94a',small:true};
  if(r.dmg>0){ const tg=r.aoe?list:[target()||list[0]].filter(Boolean);
    for(const e of tg){ for(const v of r.hits){ if(!e.dead) ligDmg(e,v,r.color); } if(r.stun>0&&!e.dead) ligStun(e,r.stun,!!(boss||e.boss)); } }
  if(r.heal>0){ h.hp=Math.min(h.maxhp,h.hp+r.heal); floatText(HX,GY-HS*0.9,'+'+fmt(r.heal),'#5fd068'); }
  if(r.shield&&r.shield.amount>0) B.shield={amt:r.shield.amount,until:B.t+r.shield.sec};
  if(r.buff){ B.buff={key:r.buff.key,val:r.buff.val,until:B.t+r.buff.sec}; if(r.buff.key==='aspd') refreshHero(); } }
function ligSpells(dt){
  if(B.buff&&B.t>=B.buff.until){ const k=B.buff.key; B.buff=null; if(k==='aspd') refreshHero(); }
  if(B.shield&&B.t>=B.shield.until) B.shield=null;
  const G=window.Sys&&Sys.grimoire; if(!G||typeof G.on!=='function'||!G.on()||B.deadT>0||B.res) return;
  const R=B.inst&&B.inst.run; if(R&&R.noSpells) return;   /* Provação "sem magias" */
  const boss=!!((R&&R.special==='trial')||S.wave===5), md=G.modeFor({boss,pvp:false});
  if(!B.spells||B.spellMd!==md||B.spellDirty){ const old={}; for(const s of B.spells||[]) old[s.id]=s.t; let L=[]; try{ L=G.loadout(S,md)||[]; }catch(e){ L=[]; }
    B.spells=L.map(x=>({id:x.id,cd:x.cd,t:old[x.id]!=null?Math.min(old[x.id],x.cd):x.cd*0.5})); B.spellMd=md; B.spellDirty=false; }
  if(!B.spells.length) return; const eng=engaged();   /* a recarga corre sempre; a magia pronta espera o próximo inimigo em alcance */
  for(const sp of B.spells){ if(sp.t>0) sp.t-=dt; if(sp.t<=0&&eng){ sp.t=sp.cd; ligCast(G,sp.id,boss); } } }
```

**B2. heroApply: atributos do caminho/regra antes, perfil dos golpes depois**

Antes:

```js
function heroApply(h,st){ h.maxhp=st.hp; h.atk=st.atk;
```

Depois:

```js
function heroApply(h,st){ st=ligStats(st); h.maxhp=st.hp; h.atk=st.atk;
```

**B3. heroApply: fim**

Antes:

```js
  h.ivl=(window.Sys&&Sys.stats)?Sys.stats.interval(st):BAL.s1Interval; }
```

Depois:

```js
  h.ivl=(window.Sys&&Sys.stats)?Sys.stats.interval(st):BAL.s1Interval; ligHero(h); }
```

**B4. heroHit: esquiva, contra-ataque e escudo depois da DEF**

Antes:

```js
d=Sys.stats.hit({atk:d,critRate:0,critDmg:0},1,h.def,false).dmg;
```

Depois:

```js
d=Sys.stats.hit({atk:d,critRate:0,critDmg:0},1,h.def,false).dmg; { const lr=ligHurt(d,src); if(lr.skip) return false; d=lr.dmg; }
```

**B5. heroHit: vida mínima do ensaio (boneco nunca derruba)**

Antes:

```js
  if(h.hp<=0){ h.hp=0; B.streak=0;
```

Depois:

```js
  { const R=B.inst&&B.inst.run; if(R&&R.heroMinHp>0&&h.hp<R.heroMinHp) h.hp=R.heroMinHp; }
  if(h.hp<=0){ h.hp=0; B.streak=0;
```

**B7. hitEnemy: golpes especiais depois do acerto**

Antes:

```js
  if(e.hp<=0) killEnemy(e);
  return crit;
```

Depois:

```js
  if(e.hp<=0) killEnemy(e);
  ligAfterHit(e,d,a,h);   /* Sys.strikes: combo, atordoar, roubo de vida (perfil null = nada) */
  return crit;
```

**B8. killEnemy: boneco imortal do ensaio**

Antes:

```js
function killEnemy(e){
```

Depois:

```js
function killEnemy(e){ if(e.immortal){ e.hp=e.maxhp; return; }   /* Boneco de Treino (Sys.pathTry): herói, pet e magia nunca o derrubam */
```

**B9. step: inimigo atordoado não ataca**

Antes:

```js
    if(e.idx<(window.__atk2?2:MAXVIS)&&e.x<=LW){ e.atkT-=dt;
```

Depois:

```js
    if(e.stunT>0) e.stunT-=dt;   /* ATORDOADO (golpe especial ou magia) */
    if(!(e.stunT>0)&&e.idx<(window.__atk2?2:MAXVIS)&&e.x<=LW){ e.atkT-=dt;
```

**B10. step: relógio das magias do Grimório**

Antes:

```js
  B.swing=(B.act&&B.act.type==='s1')?SWT*(1-B.act.t/B.act.dur):0;
```

Depois:

```js
  ligSpells(dt);   /* Sys.grimoire: 3 magias com recarga (loadout vazio com a chave desligada) */
  B.swing=(B.act&&B.act.type==='s1')?SWT*(1-B.act.t/B.act.dur):0;
```

**B11. desenho: Provação "sem montaria" lute a pé**

Antes:

```js
const lk=lookNow(), wg=wingNow(lk), mo=lk.mount;
```

Depois:

```js
const lk=lookNow(), wg=wingNow(lk), mo=(B.inst&&B.inst.run&&B.inst.run.noMount)?null:lk.mount;
```

### `js/petfx.js`

**P1. petInfo: Provação "sem pet"**

Antes:

```js
function petInfo(){ if (PETK.ov) return PETK.ov; if (!petOk()) return null;
```

Depois:

```js
function petInfo(){ if (PETK.ov) return PETK.ov; if (!petOk()) return null; if (B.inst && B.inst.run && B.inst.run.noPet) return null;   /* Provação "sem pet": não bate, não cura, não aparece */
```

### `js/instfx.js`

**I1. instMk: campos do boneco/mestre**

Antes:

```js
  e.maxhp = e.hp = e.hp * hm; e.dmg *= dm; if (sp.eraBoss) e.eraBoss = true; e.gold = 0; return e; }
```

Depois:

```js
  e.maxhp = e.hp = e.hp * hm; e.dmg *= dm; if (sp.eraBoss) e.eraBoss = true;
  if (sp.immortal){ e.immortal = true; e.noAff = true; } if (sp.name) e.name = sp.name; if (sp.atkEvery > 0) e.atkEvery = sp.atkEvery; if (sp.dmgPctHero > 0 && B.hero) e.dmg = B.hero.maxhp * sp.dmgPctHero / 100;   /* lutas especiais (docs/LIGACOES_BATALHA.md) */
  e.gold = 0; return e; }
```

**I2. startInstanceRun: contadores do ensaio**

Antes:

```js
B.inst = { run, wi: 0, kills: 0, t: run.time > 0 ? run.time : 60, back: { stage: S.stage, wave: S.wave, farm: !!S.farm }, done: false };
```

Depois:

```js
B.inst = { run, wi: 0, kills: 0, dmg: 0, stun: 0, t: run.time > 0 ? run.time : 60, back: { stage: S.stage, wave: S.wave, farm: !!S.farm }, done: false }; B.spells = null; B.buff = null; B.shield = null;
```

**I3. startInstanceRun: Provação "metade da vida"**

Antes:

```js
heroApply(B.hero, st); B.deadT = 0; B.deadBoss = false; B.act = null; B.res = null; B.running = true;
```

Depois:

```js
heroApply(B.hero, st); B.deadT = 0; B.deadBoss = false; B.act = null; B.res = null; B.running = true; if (run.hpStart > 0 && run.hpStart < 1) B.hero.hp = B.hero.maxhp * run.hpStart;
```

**I4. startInstanceRun: faixa com o nome da luta especial**

Antes:

```js
B.banner = { txt: 'Instância: ' + (run.name || ''),
```

Depois:

```js
B.banner = { txt: run.banner || ('Instância: ' + (run.name || '')),
```

**I5. instStep: relógio da faixa da Provação**

Antes:

```js
function instStep(dt){ const I = B.inst; if (!I || I.done) return; I.t -= dt;
```

Depois:

```js
function instStep(dt){ const I = B.inst; if (!I || I.done) return; I.t -= dt; if (I.run.special === 'trial' && window.PTrial && typeof PTrial.time === 'function') PTrial.time(Math.max(0, I.t));
```

**I6. instEnd: luta especial termina na tela dela**

Antes:

```js
function instEnd(win){ const I = B.inst; if (!I || I.done) return; I.done = true; let out = null;
```

Depois:

```js
function instEnd(win){ const I = B.inst; if (!I || I.done) return; I.done = true; let out = null; if (I.run.special){ ligSpecialEnd(I, win); return; }
```

**I7. instHud: "Provação" / "Ensaio" no cabeçalho**

Antes:

```js
return { name: 'Instância', sub:
```

Depois:

```js
return { name: I.run.hud || 'Instância', sub:
```

**I8. fim do arquivo: lutas especiais e pontes**

Acrescentar no FIM do arquivo:

```js
/* ===== LUTAS ESPECIAIS DA SISTEMAS (docs/LIGACOES_BATALHA.md): Provação do Mestre (Sys.trial) e Ensaio de caminho (Sys.pathTry) =====
   Rodam como uma instância (mesmo laço, sem drop de fase, save suspenso), com run.special. O fim NÃO chama o Sys.instances: vai para a tela
   (PTrial.finish / PPath.finish), que faz a ÚNICA chamada ao finish do módulo. */
function ligSpecialEnd(I, win){
  const tot = I.run.time > 0 ? I.run.time : 60, sec = Math.max(0, Math.round((tot - Math.max(0, I.t)) * 10) / 10), h = B.hero;
  const life = h ? Math.round(Math.max(0, h.hp)) : 0, lifeMax = h ? Math.round(h.maxhp) : 0;
  S.stage = I.back.stage; S.wave = I.back.wave; S.farm = I.back.farm; B.inst = null; B.spells = null; B.buff = null; B.shield = null;
  B.deadT = 0; B.deadBoss = false; startBattle(); save(); hud();
  try {
    if (I.run.special === 'trial'){ const res = { won: !!win, sec }; if (window.PTrial && typeof PTrial.finish === 'function') PTrial.finish(res); else if (window.Sys && Sys.trial) Sys.trial.finish(S, Sys.host, res); }
    else if (I.run.special === 'pathTry'){ const res = { damage: Math.round(I.dmg || 0), sec, life, lifeMax, stunSec: Math.round((I.stun || 0) * 10) / 10 };
      if (window.PPath && typeof PPath.finish === 'function') PPath.finish(res); else if (window.Sys && Sys.pathTry) Sys.pathTry.finish(S, Sys.host, res); }
  } catch (e) { console.error('ligSpecialEnd', e); }
  if (typeof refreshHero === 'function') refreshHero(); save(); hud(); }   /* depois do finish: a provação vencida dá +1% ATK/Vida */
/* PTrial.battle(spec) ← Sys.trial.start(...).spec */
function ligTrialBattle(spec){ if (!spec || typeof window.startInstanceRun !== 'function') return false; const en = spec.enemy || {}, m = spec.master || {};
  const run = { special: 'trial', id: 'trial' + (spec.lvl | 0), name: m.name || 'Mestre', hud: 'Provação', banner: 'Provação: ' + (spec.rule && spec.rule.name || ''),
    waves: [[{ kind: 'boss', hpMult: en.hpMul > 0 ? en.hpMul : 1, dmgMult: en.dmgMul > 0 ? en.dmgMul : 1, name: m.name ? 'Mestre ' + m.name : '' }]],
    time: spec.sec > 0 ? spec.sec : 60, goal: 'boss', stage: (en.stage | 0) || S.stage, hpStart: spec.hpStart > 0 ? spec.hpStart : 1,
    noPet: !!spec.noPet, noMount: !!spec.noMount, noSpells: !!spec.noSpells, skip: spec.noPet ? 'pet' : spec.noMount ? 'mount' : '' };
  return window.startInstanceRun(run) !== false; }
/* PPath.battle(cfg) ← Sys.pathTry.start(...).battle */
function ligPathBattle(cfg){ if (!cfg || typeof window.startInstanceRun !== 'function') return false; const en = cfg.enemy || {}, bo = cfg.bonus || {};
  const run = { special: 'pathTry', id: 'pathTry_' + cfg.path, name: cfg.name || '', hud: 'Ensaio', banner: 'Ensaio: ' + (cfg.name || ''),
    waves: [[{ kind: 'e0', immortal: en.immortal !== false, name: en.name || 'Boneco de Treino', atkEvery: en.hitEverySec > 0 ? en.hitEverySec : 2, dmgPctHero: en.hitPctHeroHp > 0 ? en.hitPctHeroHp : 4 }]],
    time: cfg.sec > 0 ? cfg.sec : 60, goal: 'time', stage: S.stage, heroMinHp: cfg.heroMinHp > 0 ? cfg.heroMinHp : 1, noPet: !!cfg.noPet,
    style: cfg.path, bonusStrikes: bo.strikes || null, bonusStat: bo.stat || {} };
  return window.startInstanceRun(run) !== false; }
/* liga as pontes das telas (p_trial.js / p_path.js carregam depois deste arquivo: chamado no fim do js/fullbattle.js) */
function ligBridges(){ if (window.PTrial && typeof PTrial.battle !== 'function') PTrial.battle = ligTrialBattle; if (window.PPath && typeof PPath.battle !== 'function') PPath.battle = ligPathBattle; }
```

### `js/fullbattle.js`

**F1. fim do arquivo: ligar as pontes PTrial.battle / PPath.battle**

Acrescentar no FIM do arquivo:

```js
if (typeof ligBridges === 'function') ligBridges();   /* Provação e Ensaio: as telas já carregaram (lista de painéis do screens.js) */
```

---

## 5. Verificação feita pela Sistemas

- Cópia do jogo em pasta temporária, patches aplicados por script (cada âncora conferida: 1 ocorrência), `node --check` nos 4 arquivos: **ok**.
- Fumaça curta no sandbox do `test/e2e` (carrega o jogo inteiro na ordem do `index.html`, sem navegador), batalha rodando em passos de 1/30 s:

```
ok    carga sem erro
ok    desligado: perfil dos golpes = null
ok    desligado: afinidade = 1 (affMult do Engenheiro)
ok    desligado: batalha anda (abates = 16)
ok    desligado: nenhum rótulo de golpe especial
ok    desligado: sem magias
ok    pontes PTrial.battle / PPath.battle ligadas
ok    ensaio: Sys.pathTry.start + PPath.battle (ok)
ok    ensaio: golpes do caminho testado no perfil (atordoar 3)
ok    ensaio: dano crítico +20 do Arcano (120)
ok    ensaio: termina pelo relógio e chama PPath.finish (60 s)
ok    ensaio: dano/vida/segundos enviados {"damage":8403,"sec":60,"life":249,"lifeMax":1456,"stunSec":2}
ok    ensaio: comparação gravada no módulo
ok    ensaio: fora dele o bônus some
ok    caminho Disparo: combo 8 no perfil
ok    caminho Disparo: velocidade +10 ([0,10])
ok    ligado: batalha anda (abates +31)
ok    ligado: rótulo COMBO aparece (1)
ok    ligado: as 3 magias lançam (12 lançamentos)
ok    ligado: herói com números válidos
ok    provação: Sys.trial.start + PTrial.battle (ok, regra nopet)
ok    provação Nv 10: regra "sem pet" na luta
ok    provação: pet fora da luta
ok    provação: termina e chama PTrial.finish {"won":true,"sec":3.4} em 3.433333333333333 s
ok    provação: módulo fechou a luta (cur = null)
ok    provação Nv 50: começa com 50% da vida ["half",50]
ok    provação Nv 40: sem magias (nospell, lançamentos 0)
ok    sem console.error do jogo

TUDO OK
```

- Equivalência com as chaves desligadas: conferida no código (cada `lig*` sai cedo com o módulo desligado). Uma comparação com sorte fixa não serve: o jogo de hoje já varia de uma execução para outra (o `Sys.host.rng` guarda o `Math.random` original), então a medida é a fumaça acima.
- Não rodei as suítes longas do `test/e2e` (regra do PC). Depois de colar, o Engenheiro roda as dele normalmente.

---

## 6. Lacunas encontradas nos módulos (para a Sistemas; nenhuma impede os patches)

1. **`Sys.strikes.profile` não aceita bônus temporário nem "sem montaria"**. O Ensaio precisa somar os golpes do caminho testado e a Provação "sem montaria" precisa tirar o golpe da montaria; hoje a batalha refaz os tetos com `Sys.strikes.DATA.cap/bossCap` (`ligProfile`). Proposta: `profile(S,host,ov,{extra:{k:pts}, noMount:true})`; aí o `ligProfile` vira uma chamada só.
2. **`Sys.grimoire.cast` devolve sempre a cor `#ffc94a`**: lê `DATA.eraColor`, que não existe no `DATA`. Falta a tabela de cor por era (ou usar `ULTCOL` do jogo).
3. **`Sys.trial.spec` usa `host.stage()` (fase atual)** e o comentário diz "chefe da fase mais alta do jogador". Depois de perder para um chefe a fase atual e a mais alta coincidem, então hoje dá no mesmo; se a intenção é a mais alta já alcançada, trocar para `host.best()`.
4. **Ensaio: o boneco não tem arte**. A luta usa a folha do inimigo comum da era com o nome "Boneco de Treino". Pedir a folha à Arte (parado, golpe, dano) quando o PO liberar; o `instMk` já aceita `name`, então só falta a imagem.
5. **Ensaio: "4% da vida por golpe" passa pela DEF do herói** (`heroHit`), então o golpe real é um pouco menor que 4%. Se a regra for 4% exatos, o módulo precisa dizer, e a batalha pula a DEF quando `R.special==='pathTry'`.
6. **Grimório sem ícone na batalha**: a regra B7 fala em ícone com anel de recarga. Os patches só mostram a faixa com o nome; o ícone precisa de protótipo aprovado e dos 18 ícones (Arte).
7. **Arena (PvP)**: os golpes têm teto de chefe/Arena (`pvp:true`) e o Grimório tem o conjunto "Arena", mas a Arena não usa o `js/battle.js`. Ligar no simulador da Arena é um passo à parte.
8. **Arco/bumerangue**: cada fração do golpe básico conta como um acerto `s1`, então o combo tem mais chances por golpe que na espada. Se o QA achar forte, o módulo pode receber `frac` no `ctx` e sortear proporcional.

---

## 7. Grimório: fontes do dia (Instância diária, Torre, Missões diárias, Eventos) (Sistemas, 14/11/2026)

O protótipo aprovado (`docs/proto/v2/GrimorioV3.html`, lista "De onde vêm páginas e tinta") promete páginas e tinta dessas 4 fontes. Até hoje só o Senhor da Era e o chefe do meio da era pagavam (`js/battle.js:533`, `Sys.grimoire.grant`). O módulo agora tem **uma função só** para as 4:

`Sys.grimoire.onSource(S, Sys.host, src, ctx)` com `src` = `'instance' | 'tower' | 'mission' | 'event'` e `ctx = {id (obrigatório, único por prêmio), era, floor, spell}`
→ `{ok, src, pages, ink, spell, learned, reason}`; `reason`: `''` pagou · `'off'` chave desligada · `'cap'` teto do dia · `'dup'` este id já pagou · `'skip'` andar da Torre que não é múltiplo de 10 · `'id'` sem id · `'src'` fonte desconhecida. Com a chave desligada nada é gravado.

| Fonte | Paga | Teto do dia |
|---|---|---|
| Instância vencida ou varrida | 1 página da 2ª magia da era jogada (só se já aprendida) + 3 tinta | 1 página, 3 tinta |
| Torre, andar múltiplo de 10 | 5 tinta | 5 tinta |
| Missão diária resgatada | 1 tinta (o módulo junta o dia ao id: `d_kill` paga de novo amanhã) | 5 tinta |
| Prêmio de evento resgatado | 1 página da magia `ctx.spell` (pode ensinar) + 2 tinta; sem `spell`, só a tinta | 1 página, 2 tinta |
| **Somado** | | **2 páginas, 12 tinta** |

Conta: o jogador ativo vence ~1 era por dia; os chefes dão 20 + 10 = 30 tinta e 4 páginas (2 magias novas + ~2 repetições do Senhor da Era). As 4 fontes somadas param em 12 tinta (40%) e 2 páginas (50%). A tela `js/p_grim.js` já lê os números certos (`DATA.grants` espelha `DATA.sources`). `Sys.grimoire.sourceToday(S, host)` devolve o que já entrou hoje, se uma tela quiser mostrar.

**Onde colar (o Engenheiro; nenhum arquivo dele foi mexido).** Todas as chamadas ficam DEPOIS do prêmio já entregue pelo módulo da fonte e dentro de `try`. O aviso é opcional; o texto sai do retorno:

```js
/* aviso curto do Grimório (colar uma vez, por exemplo em js/ui.js, ao lado do toast) */
function grimSrc(src,ctx){ try{ const G=window.Sys&&Sys.grimoire; if(!G||typeof G.onSource!=='function') return null; const g=G.onSource(S,Sys.host,src,ctx);
  if(g&&g.ok&&typeof toast==='function'){ const t=[g.pages?'+'+g.pages+(g.pages>1?' páginas':' página'):'',g.ink?'+'+g.ink+' de tinta':''].filter(Boolean).join(' · '); if(t) toast('Grimório: '+t); }
  return g; }catch(er){ console.error('grimoire',er); return null; } }
```

1. **Instância diária vencida**: `js/instfx.js:46`, logo depois da linha do `Sys.instances.finish` (antes de `S.stage = I.back.stage`). O `run.id` já é único (`tipo-nível-hora`, `js/sys/instances.js:131`):
   ```js
   if(out&&out.ok!==false&&out.win&&typeof grimSrc==='function') grimSrc('instance',{id:I.run.id,era:(Sys.instances.levelInfo(out.level)||{}).era});
   ```
   **Instância varrida**: `js/p_inst.js:92`, depois de `const r=I.sweep(...)` e do `if(!r||!r.ok){...}`:
   ```js
   if(typeof grimSrc==='function') grimSrc('instance',{id:'sweep-'+t+'-'+L+'-'+Date.now(),era:(I.levelInfo(L)||{}).era});
   ```
2. **Andar da Torre vencido**: `js/p_tower2.js:307` (a linha `let r=null; try{ r=T.fight(S,host()); }...`), logo depois do `if(!r||!r.ok){...return;}` (linha 308). O andar é o id (cada andar só se vence uma vez); andar que não é múltiplo de 10 volta `'skip'` sem aviso:
   ```js
   if(r.win&&typeof grimSrc==='function') grimSrc('tower',{id:'floor-'+r.floor,floor:r.floor});
   ```
   Na Torre antiga (`js/p_tower.js:138`, `const r=Sys.tower.fight(S,Sys.host); if(!r||!r.ok){...}`), a mesma linha logo depois.
3. **Missão diária resgatada**: `js/p_missions.js`, nos dois lugares que já chamam `mPlayerXp(id)` depois de um resgate certo: linha 91 (`mClaim`) e linha 97 (`tryOne` do "Resgatar tudo"). Só as diárias (a mesma conta do `mPlayerXp`, linha 86), sem as semanais:
   ```js
   if((id==='bonus'||((Sys.pass.DATA&&Sys.pass.DATA.daily)||[]).some(x=>x.id===id))&&typeof grimSrc==='function') grimSrc('mission',{id:id});
   ```
4. **Prêmio de evento resgatado**: `js/p_events.js:518` (`etNode`) e `js/p_events.js:523` (`etClaimAll`), dentro do `if(r&&r.ok)`. O id é evento + marco:
   ```js
   if(typeof grimSrc==='function') grimSrc('event',{id:M.cur.ev.id+':'+m.at,spell:M.cur.ev.grimSpell||null});
   ```
   No "Resgatar tudo" só o 1º marco do dia paga a página (teto); os outros voltam `'cap'` sem aviso.

Chave: tudo isso só vale com `Sys.grimoire.setOn(true)` (já está no `SYS_LIVE` de `js/farm.js`, hoje linha 105: o grimório já nasce ligado no jogo). Teste: `node test/sys/grimoire-fontes.test.js` (11).

Lacuna (para a Sistemas e o PO): os eventos ainda não dizem qual magia trazem. Falta um campo `grimSpell` (id da magia) em cada evento de `Sys.events`; até lá o evento paga só os 2 de tinta.
