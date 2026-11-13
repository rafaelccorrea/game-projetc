'use strict';
/* ================= ERAS 7 (Submundo) E 8 (Celestial) JOGÁVEIS — PONTO ÚNICO =================
   O jogo tem 9 eras (0 a 8; decisão do dono). A tabela ERAS do index.html traz as 7 primeiras; as duas últimas vêm do Sys.eras (js/sys/eras.js), no
   mesmo formato, e entram AQUI: este arquivo carrega depois dos js/sys e ANTES de todo o resto do jogo (é o primeiro da lista de js/ do index.html),
   para que ERAS, SKINS, eraOf e a batalha já nasçam com as 9 eras.
   O QUE LIGA (era9Boot): Sys.stats.setEra9(true) (item de era 7-8 com os atributos da própria era) → ERAS.push(...Sys.eras.extra()) → 20 skins das
   eras 7-8 → tabelas por era (material do nome, formato de reserva da arma) → conversão do save antigo (era9Migrate).
   O QUE NÃO LIGA: Sys.level.setV9 (nível 120 e curva nova de XP) e Sys.phases (100 fases × 4 dificuldades). São da sessão Sistemas e mexem na curva das
   eras 0-6. Com o nível máximo em 100, a raridade Divino (portão no nível 105) não cai.
   NÚMEROS DAS ERAS 7-8 (era9Bal, PROVISÓRIOS até a Sistemas rodar a curva de 180 dias): a mesma regra das eras de trás, sem degrau novo:
   eraMult[7] = eraMult[8] = eraMult[6]; FC recomendada = a da era anterior × (crescimento do inimigo por fase)^10. Com isso as fases 71-90 têm EXATAMENTE
   os inimigos que já tinham (antes elas eram a era 6 sem fim): nada muda de dificuldade para quem já estava lá. Se docs/balance.json trouxer eraMult
   ou a FC recomendada com 9 valores, valem os do arquivo.
   DEPOIS DA ERA 8: vencido o Senhor da era 8 (fase 90) o jogo segue como já seguia depois da fase 70: fases sem fim na última era. */

/* CHAVE. Desligada: o jogo é o de 7 eras, sem nenhuma mudança. Ligada: as eras 7 e 8 abrem pela Troca de era depois do Senhor da era 6.
   Está DESLIGADA porque falta arte obrigatória no disco (ERA9_MISSING). Quando os arquivos chegarem: trocar para true (só esta linha).
   Conferência sem ligar para o jogador: ?debug=1&eras9=1. Save que já entrou nas eras 7-8 continua nelas mesmo com a chave desligada (nada se perde). */
const ERA9_KEY = false;
/* ARTE QUE FALTA EM assets/ (conferido em disco): os ícones dos 3 botões de golpe da batalha para a ARMA das eras 7 e 8 (js/fullbattle.js lê
   assets/icons/era<era da arma>_s<1|2|3>.png). Sem eles o botão mostra imagem quebrada assim que o jogador equipa uma arma dessas eras. */
const ERA9_MISSING = ['assets/icons/era7_s1.png', 'assets/icons/era7_s2.png', 'assets/icons/era7_s3.png', 'assets/icons/era8_s1.png', 'assets/icons/era8_s2.png', 'assets/icons/era8_s3.png'];

/* NOMES DOS CHEFES DAS ERAS 7 E 8 (escolha do dono). ÚNICO LUGAR: batalha, Vitória, Troca de era, Mapa das Eras e Códex leem daqui (era9Name / era9Boss).
   O chefe da era é um só (mesma arte nas 10 fases); na fase 10 ele é o Senhor da Era. Por já ser nome próprio, aparece sem "Chefe" / "Senhor da Era" na frente. */
const ERA9_BOSS = { 7: 'Senhor do Submundo', 8: 'Juiz Celestial' };

const ERA9_SCENE = true;                                   /* cenário vivo (assets/bg/v2/era7 e era8, completos em disco); false = fundo estático era<N>_ref.png */
const ERA9_MAT = { 7: 'de Obsidiana', 8: 'de Prata' };      /* reserva do nome do item (só se o Sys.loot não nomear): os mesmos materiais dos nomes do Sys.loot */
const ERA9_SHAPE = { 7: 'sword', 8: 'sword' };              /* reserva do desenho da arma sem imagem (js/fallback.js): famílias infernal e celeste são corpo a corpo */
const ERA9_GEMS = 30;                                      /* gemas por era aberta: o mesmo valor que a batalha dá na troca de era */
const ERA9 = { on: false, done: false, why: '', migrated: null, fcDer: false };

/* nome próprio do chefe pela era ou pela chave do inimigo ('era7_boss'); null = a era não tem nome próprio (eras 0-6: vale o de sempre) */
const era9Boss = e => ERA9_BOSS[e] || null;
const era9Name = key => { const m = /^era(\d+)_boss$/.exec(String(key || '')); return m ? era9Boss(+m[1]) : null; };

function era9Want(){ if (ERA9_KEY) return true;
  try { if (typeof DEBUG !== 'undefined' && DEBUG && /[?&]eras9=1/.test(location.search)) return true; } catch (e) {}
  try { return !!(S && S.era9 === 1 && (S.eraMax | 0) > 6); } catch (e) { return false; } }

function era9Boot(){ if (ERA9.done) return ERA9.on; ERA9.done = true;
  if (!era9Want()){ ERA9.why = 'chave desligada'; return false; }
  const T = window.Sys && Sys.stats, E = window.Sys && Sys.eras;
  if (!T || typeof T.setEra9 !== 'function' || !E || typeof E.extra !== 'function' || ERAS.length !== 7){ ERA9.why = 'Sys.stats.setEra9 ou Sys.eras ausente'; try { console.error('eras 7-8: ' + ERA9.why); } catch (e) {} return false; }
  let X = null; try { T.setEra9(true); X = E.extra(); } catch (e) { X = null; }
  try { if (X && X.length === 2 && Sys.level && typeof Sys.level.setCap120 === 'function') Sys.level.setCap120(true); } catch (e) {}   /* dono: nível máximo 120 com as 9 eras (Sistemas 7da771c); 1-100 idênticos. Nunca o setV9 (troca a curva e liga os estágios do herói) */
  if (!Array.isArray(X) || X.length !== 2 || !X.every(x => x && x.n && Array.isArray(x.en) && x.en.length && Array.isArray(x.w) && Array.isArray(x.a))){
    try { T.setEra9(false); } catch (e) {} ERA9.why = 'Sys.eras.extra() não trouxe as 2 eras'; try { console.error('eras 7-8: ' + ERA9.why); } catch (e) {} return false; }
  X.forEach((era, i) => { const e = 7 + i; era.sceneV2 = ERA9_SCENE; if (ERA9_BOSS[e]) era.en[era.en.length - 1].n = ERA9_BOSS[e];
    ERAS.push(era); ERA_MAT[e] = ERA9_MAT[e]; WSHAPE[e] = ERA9_SHAPE[e]; });
  /* skins das eras 7-8: mesmo formato das outras (index.html), antes das skins do passe */
  const add = []; for (let e = 7; e < ERAS.length; e++) for (const slot of ['weapon', 'armor']) RAR.forEach((R, r) => add.push({ id: slot[0] + e + r, slot, e, r, n: ERAS[e][slot === 'weapon' ? 'ws' : 'as'][r], col: (slot === 'weapon' ? ERAS[e].wp : ERAS[e].ap)[r], glow: r >= 2 ? R.c : null }));
  const at = SKINS.findIndex(s => s.pass); SKINS.splice(at < 0 ? SKINS.length : at, 0, ...add);
  ERA9.on = true; era9Migrate(); return true; }

/* números das eras 7-8 (chamado pelo js/battle.js depois do BAL e de novo depois do docs/balance.json): só preenche o que faltar */
function era9Bal(){ if (!ERA9.on || typeof BAL === 'undefined') return;
  const m = BAL.eraMult; for (let e = 7; e < ERAS.length; e++) if (!(m[e] > 0)) m[e] = m[e - 1];
  if (REC_FC.length < ERAS.length || ERA9.fcDer){ REC_FC.length = 7; ERA9.fcDer = true;
    for (let e = 7; e < ERAS.length; e++) REC_FC[e] = Math.round(REC_FC[e - 1] * (m[e] / m[e - 1]) * Math.pow(BAL.enemyHpGrowth, STAGES_PER_ERA)); } }

/* SAVE ANTIGO (7 eras): nada é apagado nem rebaixado. Quem parou até a fase 70 segue igual e abre a era 7 vencendo o Senhor da era 6.
   Quem já tinha passado da fase 70 (antes eram fases sem fim da era 6) fica NA MESMA FASE, que agora pertence à era 7 ou 8: as eras passam a constar
   como liberadas (S.eraMax) e entram as gemas de cada era aberta, as mesmas que a batalha daria. Roda uma vez por save (S.era9). */
function era9Migrate(){ if (!ERA9.on || typeof S !== 'object' || !S) return null; if (S.era9 === 1) return null; S.era9 = 1;
  const from = Math.max(0, S.eraMax | 0), to = eraOf(Math.max(1, S.stage | 0)); if (to <= from || to < 7) return null;
  const opened = to - Math.max(from, 6); S.eraMax = to; S.gems = (S.gems | 0) + ERA9_GEMS * opened;
  ERA9.migrated = { from, to, gems: ERA9_GEMS * opened };
  try { setTimeout(() => { try { toast((opened > 1 ? 'Novas eras liberadas: ' + ERAS[to - 1].n + ' e ' + ERAS[to].n : 'Nova era liberada: ' + ERAS[to].n) + '. +' + ERA9.migrated.gems + ' gemas'); } catch (e) {} }, 1800); } catch (e) {}
  return ERA9.migrated; }

era9Boot();
