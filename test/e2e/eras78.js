'use strict';
/* ERAS 7 (Submundo) E 8 (Celestial): cada inimigo que o jogo pode criar nessas eras (mesma regra do mkEnemy: era<N>_e0, era<N>_e1, era<N>_boss; o chefe
   de era usa a chave do chefe) tem nome em assets/enemies/meta.json, imagem parada e as 4 folhas (run, attack, hurt, die) com .png e .json; as eras estão
   em EN_ANIM_ERAS, têm quadro do golpe dentro da folha e fundo estático de reserva cadastrado em assets/bg/meta.json. Sem navegador: só lê arquivos.
   As imagens ficam fora do git: numa cópia sem imagens, aponte a pasta do jogo com   node test/e2e/eras78.js --assets <pasta do jogo>
   (sem as imagens e sem --assets, a falta do .png REPROVA). Sai com código 1 se algo falhar.   node test/e2e/eras78.js [-v] */
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), args = process.argv.slice(2), V = args.includes('-v');
const AI = args.indexOf('--assets'), AROOT = AI >= 0 && args[AI + 1] ? path.resolve(args[AI + 1]) : ROOT;
const rd = p => fs.readFileSync(path.join(ROOT, p), 'utf8'), has = p => fs.existsSync(path.join(ROOT, p)), hasImg = p => fs.existsSync(path.join(AROOT, p));
let fails = 0, n = 0; const check = (name, ok, extra) => { n++; if (!ok) { fails++; console.log('FALHA  ' + name + (extra ? ' → ' + extra : '')); } else if (V) console.log('ok     ' + name); };
const EMOJI = /[\u{1F000}-\u{1FFFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}]/u;

const battle = rd('js/battle.js');
const grab = (re, what) => { const m = re.exec(battle); if (!m) { console.log('FALHA  não achei no js/battle.js: ' + what); process.exit(1); } return m[1]; };
const ERAS_ON = JSON.parse(grab(/^const EN_ANIM_ERAS=(\[[\d,\s]*\]);/m, 'EN_ANIM_ERAS'));
const EN_DIR = grab(/^const EN_DIR='([^']+)';/m, 'EN_DIR');
const HIT = new Function('return {' + grab(/^const EN_HIT_FRAME=\{([^}]*)\};/m, 'EN_HIT_FRAME') + '};')();
const BG_FILE = new Function('return {' + grab(/^const BG_FILE=\{([^}]*)\}/m, 'BG_FILE') + '};')();
const meta = JSON.parse(rd('assets/enemies/meta.json')), bgMeta = JSON.parse(rd('assets/bg/meta.json'));
const E78 = require(path.join(ROOT, 'js', 'sys', 'eras.js')).all78();

for (const era of [7, 8]) {
  const def = E78[era - 7];
  check('era ' + era + ' em EN_ANIM_ERAS', ERAS_ON.includes(era), JSON.stringify(ERAS_ON));
  check('era ' + era + ': Sys.eras traz 3 inimigos (e0, e1, chefe)', !!def && def.en.length === 3);
  ['e0', 'e1', 'boss'].forEach((kd, i) => {
    const key = 'era' + era + '_' + kd, nm = (meta[key] || {}).name;
    check(key + ': nome no meta.json', typeof nm === 'string' && nm.trim().length > 1, String(nm));
    check(key + ': nome sem emoji', !!nm && !EMOJI.test(nm), nm);
    if (def && def.en[i]) { check(key + ': nome igual ao do Sys.eras (' + def.en[i].n + ')', nm === def.en[i].n, String(nm)); check(key + ': arte do Sys.eras é a mesma chave', def.en[i].art === key, def.en[i].art); }
    check(key + ': imagem parada assets/enemies/' + key + '.png', hasImg('assets/enemies/' + key + '.png'));
    for (const st of ['run', 'attack', 'hurt', 'die']) {
      const base = EN_DIR + key + '_' + st;
      check(base + '.png em disco', hasImg(base + '.png'));
      check(base + '.json em disco', has(base + '.json'));
      if (!has(base + '.json')) continue;
      let j = null; try { j = JSON.parse(rd(base + '.json')); } catch (e) {}
      check(base + '.json: frames, w, h, fps e feetY', !!j && j.frames > 0 && j.w > 0 && j.h > 0 && j.fps > 0 && j.feetY > 0 && j.feetY <= j.h, j ? [j.frames, j.w, j.h, j.fps, j.feetY].join(',') : 'json inválido');
      if (j && st === 'attack') check(key + ': quadro do golpe (EN_HIT_FRAME) dentro da folha', Number.isInteger(HIT[key]) && HIT[key] >= 0 && HIT[key] < j.frames, HIT[key] + ' de ' + j.frames);
    }
  });
  const g = (bgMeta['era' + era] || {}).groundY, file = 'assets/bg/' + (BG_FILE[era] || 'era' + era) + '.png';
  check('era ' + era + ': linha do chão do fundo de reserva em assets/bg/meta.json', typeof g === 'number' && g > 0.4 && g < 0.95, String(g));
  check('era ' + era + ': fundo de reserva ' + file, hasImg(file));
}
if (fails) { console.log(fails + ' de ' + n + ' verificações falharam (eras 7 e 8)'); process.exit(1); }
console.log('eras 7 e 8 OK (' + n + ' verificações; imagens conferidas em ' + AROOT + ')');
