'use strict';
/* FOLHAS DE ANIMAÇÃO DESENHADAS POR CSS × ARQUIVOS DO DISCO (tira ou grade). Rodar: node test/paineis/sheetcss.test.js [-v]
   A Arte está convertendo folhas de TIRA para GRADE ("cols" no .json). Este teste FALHA se uma folha usada por CSS mudar de formato sem a tela acompanhar:
   A) usos FIXOS no código (url(...png) + background-size:N00% 100% na mesma regra/estilo, em index.html e js/*.js): a folha tem de ser uma TIRA de N quadros
      (PNG com largura = N × célula, uma linha; .json sem "cols");
   B) usos pelo ajudante xSheetMeta/xSheetCss (js/screens.js): Montarias (MT_ART), Pets (PT_SH) e Troca de era (chefe caindo, inimigo e Kael correndo):
      .json × PNG (largura = cols × w, altura = linhas × h), a reserva XSH_TAB/MT_SHEET igual ao .json, e a animação gerada mostra só células com quadro;
   C) classes que recebem a imagem em outro lugar (.of-ride do js/p_offer.js): a geometria fixa da classe × a folha que ela desenha.
   Arquivos de outras sessões (p_intro, p_offer, p_realm, delacct, cloudchoice, sys) entram como AVISO: não reprovam, mas aparecem na lista. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), VERBOSE = process.argv.includes('-v');
const OTHER = /^(js\/p_intro\.js|js\/p_offer\.js|js\/p_realm\.js|js\/delacct\.js|js\/cloudchoice\.js|js\/sys\/)/;
let fail = 0, warn = 0, okN = 0; const rows = [];
const say = (file, what, ok, det) => { const oth = OTHER.test(file); if (ok) { okN++; if (VERBOSE) console.log('  ok    ' + file + ' · ' + what + (det ? ' · ' + det : '')); return; } if (oth) warn++; else fail++; console.log((oth ? '  AVISO ' : '  FALHA ') + file + ' · ' + what + (det ? ' → ' + det : '')); };
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const png = p => { try { const b = Buffer.alloc(24), fd = fs.openSync(path.join(ROOT, p), 'r'); fs.readSync(fd, b, 0, 24, 0); fs.closeSync(fd); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; } catch (e) { return null; } };
const json = p => { try { return JSON.parse(read(p)); } catch (e) { return null; } };
/* .json de uma folha: o dela ou, para as compostas sem .json próprio (kael_idle_era2_t0), o do corpo (mesma grade) */
const metaOf = base => json(base + '.json') || json(base.replace(/_era2_t\d$/, '_body') + '.json') || json(base.replace(/_(idle|run|attack)_era2_t\d$/, '_$1_body') + '.json');

/* ---------- A) usos fixos ---------- */
const files = ['index.html'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => /\.js$/.test(f)).map(f => 'js/' + f));
const seen = {};
for (const f of files) { const L = read(f).split('\n');
  L.forEach((line, i) => { const re = /url\(([^)$]+?\.png)\)([^{}`]*?)background-size:\s*(\d+)00%\s+100%/g; let m;
    while ((m = re.exec(line))) { const img = m[1].replace(/^['"]|['"]$/g, ''), n = +m[3], base = img.replace(/\.png$/, ''), key = f + '|' + img + '|' + n; if (n < 2 || seen[key]) continue; seen[key] = 1;
      const p = png(img), j = metaOf(base); let why = '';
      if (!p) why = 'PNG não existe: ' + img;
      else if (j && j.cols > 0 && j.cols < j.frames) why = 'a folha virou GRADE (' + j.cols + ' colunas × ' + Math.ceil(j.frames / j.cols) + ' linhas, PNG ' + p.w + 'x' + p.h + ') e a tela desenha TIRA de ' + n;
      else if (j && j.frames !== n) why = 'a tela assume ' + n + ' quadros e o .json diz ' + j.frames;
      else if (p.w % n) why = 'largura ' + p.w + ' não divide em ' + n + ' quadros';
      else if (j && (p.w !== j.w * n || p.h !== j.h)) why = 'PNG ' + p.w + 'x' + p.h + ' ≠ ' + n + ' × ' + j.w + 'x' + j.h + ' do .json';
      rows.push([f + ':' + (i + 1), img, p ? p.w + 'x' + p.h : '-', 'tira ' + n, j ? (j.cols > 0 ? j.cols + ' × ' + Math.ceil(j.frames / j.cols) : 'tira ' + j.frames) : 'sem .json', why ? 'QUEBRADO' : 'ok']);
      say(f, 'linha ' + (i + 1) + ' ' + img + ' como tira de ' + n, !why, why); } }); }

/* ---------- B) ajudante real do js/screens.js ---------- */
const scr = read('js/screens.js'), a0 = scr.indexOf('const XSH={'), a1 = scr.indexOf('/* ---------- ÍCONE DE PEÇA POR RARIDADE');
if (a0 < 0 || a1 < a0) { console.log('  FALHA js/screens.js · bloco do ajudante xSheet não encontrado'); process.exit(1); }
const sb = { document: { createElement() { return { textContent: '' }; }, head: { appendChild() {} } }, console };
vm.createContext(sb); vm.runInContext(scr.slice(a0, a1) + '\n;this.X={xSheetNorm,xSheetMeta,xSheetCss,xSheetBg,xSheetKf,XSH,XSH_TAB};', sb);
const X = sb.X;
/* células que a animação gerada mostra, quadro a quadro (pela mesma conta do CSS) */
function shown(m, css) { const out = []; if (css.kind === 'tira') { for (let i = 0; i < m.frames; i++) out.push(i); return out; }
  if (css.kind === 'grade' || css.kind === 'grade incompleta') { const nm = css.anim.split(' ')[0], k = X.XSH.css || '', i0 = k.indexOf('@keyframes ' + nm + '{'); if (i0 < 0) return null; const body = k.slice(i0, k.indexOf('}}', i0));
    const re = /background-position:([0-9.]+)% ([0-9.]+)%/g; let q; while ((q = re.exec(body))) { const c = m.cols > 1 ? Math.round(+q[1] / 100 * (m.cols - 1)) : 0, r = m.rows > 1 ? Math.round(+q[2] / 100 * (m.rows - 1)) : 0; out.push(r * m.cols + c); } return out; }
  return [0]; }
function checkDyn(file, base, fb, label) { const p = png(base + '.png'), j = json(base + '.json'); if (!p || !j) { say(file, label + ' ' + base, false, !p ? 'PNG não existe' : '.json não existe'); return; }
  const m = X.xSheetNorm(j), css = X.xSheetCss(m, {}), why = [];
  if (p.w !== m.cols * j.w || p.h !== m.rows * j.h) why.push('PNG ' + p.w + 'x' + p.h + ' ≠ ' + m.cols + ' × ' + m.rows + ' células de ' + j.w + 'x' + j.h);
  if (css.size !== (m.cols * 100) + '% ' + (m.rows * 100) + '%') why.push('background-size ' + css.size);
  const sh = shown(m, css); if (!sh) why.push('keyframes não gerados'); else { const bad = sh.filter(i => i >= m.frames); if (bad.length) why.push('a animação mostra célula VAZIA (' + bad.join(',') + ' de ' + m.frames + ' quadros)');
    const want = Array.from({ length: m.frames }, (_, i) => i); if (css.kind === "tira" && sh.join() !== want.join()) why.push("ordem dos quadros"); if (css.kind !== "tira" && sh.slice(0, m.frames).join() !== want.join()) why.push('ordem dos quadros (quadro a quadro)'); }
  X.XSH.m = {}; X.XSH.wait = {}; const r = X.xSheetMeta(base, fb);   /* sem o J do jogo: cai na reserva (tabela ou a passada pela tela) */
  if (r.frames !== m.frames || r.cols !== m.cols) why.push('RESERVA da tela (' + r.cols + ' colunas, ' + r.frames + ' quadros) ≠ .json (' + m.cols + ', ' + m.frames + '): atualize XSH_TAB/MT_SHEET no código');
  rows.push([file, base + '.png', p.w + 'x' + p.h, 'ajudante: ' + css.kind, (j.cols > 0 ? j.cols + ' × ' + m.rows : 'tira ' + j.frames), why.length ? 'QUEBRADO' : 'ok']);
  say(file, label + ' ' + base + ' (' + css.kind + ', ' + m.cols + ' × ' + m.rows + ')', !why.length, why.join('; ')); }
/* Montarias: ids com arte (MT_ART) e a reserva MT_SHEET. O nome do arquivo pode não ser o id (MOUNT_FILE do js/mountfx.js: phoenixm → giant_phoenix) */
const MFILE = (() => { const m = /const MOUNT_FILE = \{([^}]*)\}/.exec(read('js/mountfx.js')), o = {}; if (m) for (const kv of m[1].split(',')) { const q = /(\w+)\s*:\s*'([^']+)'/.exec(kv); if (q) o[q[1]] = q[2]; } return o; })(), mfile = id => MFILE[id] || id;
{ const s = read('js/p_mounts.js'), ma = /const MT_ART=\{([^}]*)\}/.exec(s), ms = /const MT_SHEET=\{([^}]*)\}/.exec(s); const ids = ma ? ma[1].split(',').map(x => x.split(':')[0].trim()).filter(Boolean) : [];
  const num = k => { const q = new RegExp('\\b' + k + ':(\\d+)').exec(ms ? ms[1] : ''); return q ? +q[1] : 0; }, fb = { frames: num('frames'), cols: num('cols'), fps: num('fps') };
  say('js/p_mounts.js', 'usa o ajudante xSheetBg', /xSheetBg\(/.test(s) && !/idle_era2_t1\.png\) 0 0\/\$\{F\.frames\*100\}% 100%/.test(s), 'a tela voltou a desenhar a folha como tira fixa');
  say('js/p_mounts.js', 'miniaturas usam a folha _body do herói atual (sem a espada pintada da _era2_t1)', s.includes("const mtBase=id=>MT_SHEET.dir+mtHeroPre(id)+mtFile(id)+'_idle_body'") && !s.split('\n').some(l => l.includes("'_idle_era2_t1") && !/^\s*(\/\*|\*| {3})/.test(l)), 'a tela voltou a apontar para _idle_era2_t1');
  for (const hero of ['kael_', 'kaia_']) for (const id of ids) { const base = 'assets/anim/mounts/' + hero + mfile(id) + '_idle_body'; if (hero === 'kaia_' && !fs.existsSync(path.join(ROOT, base + '.png'))) continue;   /* Kaia: só as montarias com arte dela (mountPrefix); sem arte a tela usa a do Kael */
    checkDyn('js/p_mounts.js', base, fb, 'montaria'); const j = json(base + '.json'); if (j && (j.w !== num('w') || j.h !== num('h'))) say('js/p_mounts.js', 'célula de ' + id, false, 'MT_SHEET ' + num('w') + 'x' + num('h') + ' ≠ .json ' + j.w + 'x' + j.h); } }
/* Pets: todas as folhas da tabela PT_SH */
{ const s = read('js/p_pets.js'), blk = /const PT_SH=\{([\s\S]*?)\};/.exec(s), pre = ['', 'mid_', 'evo_'];
  say('js/p_pets.js', 'usa o ajudante xSheetBg', /xSheetBg\(/.test(s) && !/0 0\/\$\{F\.frames\*100\}% 100%/.test(s), 'a tela voltou a desenhar a folha como tira fixa');
  if (blk) { const re = /((?:era\d|prism|pet)_[a-z]+):\s*\[((?:\[[^\]]*\],?\s*)+)\]/g; let q; while ((q = re.exec(blk[1]))) { const stages = q[2].match(/\[[^\]]*\]/g) || [];
      stages.forEach((st, si) => { (st.match(/'([a-z0-9]+)'/g) || []).forEach(k => { const base = 'assets/anim/pets/' + q[1] + '_' + pre[si] + k.replace(/'/g, ''); checkDyn('js/p_pets.js', base, null, 'pet'); }); }); } } }
/* Troca de era: chefe caindo (toca uma vez), inimigo e Kael correndo; a tela lê o .json real (sem reserva): confere só a geometria e a animação */
{ const s = read('js/p_era.js'); say('js/p_era.js', 'peSprite usa xSheetCss', /xSheetCss\(/.test(s), 'a tela voltou a desenhar a folha como tira fixa');
  const bases = ['assets/anim/hyb/R/kael_run_body']; for (let e = 0; e <= 8; e++) { bases.push('assets/anim/hyb/enemy/era' + e + '_boss_die'); bases.push(e === 2 ? 'assets/anim/era2_e0_run' : 'assets/anim/hyb/enemy/era' + e + '_e0_run'); }
  for (const base of bases) { if (!fs.existsSync(path.join(ROOT, base + '.png'))) continue; const p = png(base + '.png'), j = json(base + '.json'); if (!j) { say('js/p_era.js', base, false, '.json não existe'); continue; }
    const m = X.xSheetNorm(j), css = X.xSheetCss(m, { once: /boss_die/.test(base) }), sh = shown(m, css), why = [];
    if (p.w !== m.cols * j.w || p.h !== m.rows * j.h) why.push('PNG ' + p.w + 'x' + p.h + ' ≠ ' + m.cols + ' × ' + m.rows + ' células de ' + j.w + 'x' + j.h);
    if (!sh || sh.some(i => i >= m.frames)) why.push('a animação mostra célula vazia'); if (sh && sh.slice(0, m.frames).join() !== Array.from({ length: m.frames }, (_, i) => i).join()) why.push('ordem dos quadros');
    rows.push(['js/p_era.js', base + '.png', p.w + 'x' + p.h, 'ajudante: ' + css.kind, (j.cols > 0 ? j.cols + ' × ' + m.rows : 'tira ' + j.frames), why.length ? 'QUEBRADO' : 'ok']);
    say('js/p_era.js', base + ' (' + css.kind + ')', !why.length, why.join('; ')); } }

/* ---------- C) classes com a imagem vinda de outro ponto ---------- */
{ const s = read('js/p_offer.js'), m = /\.of-ride\{[^}]*background-size:\s*(\d+)00%\s+100%/.exec(s); const ids = ['wolf', 'pony', 'horse', 'griffin', 'mythic', 'wyvern'];
  if (m) for (const id of ids) { const base = 'assets/anim/mounts/kael_' + mfile(id) + '_idle_era2_t1', j = json(base + '.json'), p = png(base + '.png'); if (!j || !p) continue; const grid = j.cols > 0 && j.cols < j.frames;
      rows.push(['js/p_offer.js (.of-ride)', base + '.png', p.w + 'x' + p.h, 'tira ' + m[1], grid ? j.cols + ' × ' + Math.ceil(j.frames / j.cols) : 'tira ' + j.frames, grid ? 'QUEBRADO' : 'ok']);
      say('js/p_offer.js', '.of-ride desenha ' + base + ' como tira de ' + m[1], !grid, 'a folha é GRADE ' + j.cols + ' × ' + Math.ceil(j.frames / j.cols) + ' (PNG ' + p.w + 'x' + p.h + ')'); if (grid) break; } }

if (VERBOSE) { console.log('\nUSO | IMAGEM | PNG | A TELA ASSUME | .JSON | ESTADO'); for (const r of rows) console.log(r.join(' | ')); }
console.log('\nFOLHAS POR CSS: ' + okN + ' OK, ' + fail + ' FALHA(S), ' + warn + ' AVISO(S) de outras sessões (' + rows.length + ' usos)');
process.exit(fail ? 1 : 0);
