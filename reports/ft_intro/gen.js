// node reports/ft_intro/gen.js  → escreve js/p_intro.js (cabeçalho: reports/ft_intro/head.js; telas: docs/proto/*.dc.html)
// Converte os protótipos aprovados do fluxo de entrada para o jogo: arte do canvas (/_blob/…) → assets/, som → áudio do jogo,
// faixas de PROTÓTIPO e textos de desenvolvimento fora, CSS isolado em "#pin .pi-<Tela>", animações com nome próprio por tela.
// As mudanças de comportamento pedidas pelo PO (fluxo, "em breve", nome do jogador real…) estão em PATCH, uma a uma, com o motivo.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const SCREENS = ['TituloV2B', 'Login', 'Prologo', 'CriarJogador', 'NomeJogador', 'BemVindo'];
const FLUID = { TituloV2B: true };   // o Título do protótipo ocupa a altura toda (100dvh); os outros são quadros 390×844

/* arte e som do canvas → arquivos do jogo (conferido pelo nome/uso no protótipo; o canvas não guarda o caminho original) */
const A = 'assets/', E2 = A + 'bg/v2/era2/', E0 = A + 'bg/v2/era0/', H = A + 'anim/hyb/R/';
const BLOB = {
  '76d16952e1067c864246744b4de14ec2': E2 + 'sky.webp', '2325ac84d4473d6f98d442c2f25e8041': E2 + 'cloud1.webp',
  'b560db0d0fbc53ee2808f8e477d1d431': E2 + 'far.webp', 'ebc43f044a58cac3143a4fcbbaad4ef3': E2 + 'midA.webp', '37aa087099d000ccdf18a4e875a5ba0d': E2 + 'ground.webp',
  '8afa0095963300992a571cfceba1ffe4': H + 'kael_run_era2_t0.png', '579019ed03216cec9c8ba3c275bdff17': H + 'kael_idle_era2_t0.png', '5aefbf9aed07e3825a987748e552e61c': H + 'kael_attack_era2_t0.png',
  'b0b93955fa1bfd4f947a906a35e9cecb': A + 'map/clock_whole.png', '08ed4e4b1651d79ec95dd597c093353a': A + 'map/clock_empty.png', '7ed135dbfe0ec47afa32938b1ad0e00d': A + 'map/world.jpg',
  '0c6810bd9282d0db4d57f76e3b3229be': A + 'map/clock_shards/shard_0.png', 'e79e5d21067e1a849a3842755e948924': A + 'map/clock_shards/shard_1.png',
  '8c4986b95e32fc1d4e7188545bd5d68b': A + 'map/clock_shards/shard_2.png', 'a08335cc1e169faac8b8033abff4e89a': A + 'map/clock_shards/shard_3.png',
  '3977c9828fa5ef9e50d15600b2fb439b': A + 'map/clock_shards/shard_4.png', 'e5627d17b0156a2a5a1b925c02407798': A + 'map/clock_shards/shard_5.png',
  '5ef4b06ee45325247a9b66632033a99d': A + 'map/clock_shards/shard_6.png', 'bc83a4e7189935a1eb93c85bfcb4d983': A + 'map/clock_shards/shard_7.png',
  '1d714680fd4ff7239ba17d05a4a06ce8': A + 'map/clock_shards/shard_8.png',
  '6ab9e2e6c54dbef8618daf37fd11342f': A + 'enemies/era2_boss.png', '2f5945188cf88834a2dd2ac72fc890bc': A + 'enemies/era1_boss.png', '66f81c3b14550f0bf1b2fa94f79ceef8': A + 'enemies/era5_boss.png',
  'e6ec9d934350edc6c4e525cb4b71f699': A + 'brand/title_bg.png', '052d275b2b1e255da9ebad63896dce0c': A + 'brand/logo.png', '1c420bdcae24bd962967021584f5bd64': A + 'ui/gem.png',
  'fcb19c47e6bcf95a909b7a4a8410c8a6': E0 + 'sky.webp', '8350a49ec21741bad84abfa8a477fae9': E0 + 'far.webp', '2a828af40defb3a91b3ad05fd9fe48b9': E0 + 'midA.webp',
  '2239f5d7b483d0d30e06ead641b7339a': E0 + 'ground.webp', '665cc1b081c457c24fdbb9a04f90fc98': E0 + 'cloud1.webp', 'ff26baa5a317d3f36a548848c37e2aa7': A + 'map/era6.jpg',
  '6badc462b7e21d407ed1ebef3d3c90b2': A + 'enemies/era6_boss.png',
  '3f2502c864add38c4b3faf5853f0dd9a': A + 'ui/coin.png', 'b8d381af334d1ec5e3023cf138922df4': A + 'ui/chest.png',
  'ba4ff0fd6689b997202345bfaa47ab6c': A + 'icons/menu/equipment.png', '49247795ea153894651459c68f2384f8': A + 'icons/menu/forge.png',
  // som (snd:) e música (mus:) pelo áudio do jogo
  'e3753a41131f84e23546318c17022b13': 'snd:ui_tap', 'af2eace71811af794b916b2e691a9489': 'snd:summon', '07a146ee324bece467fc05bedf4435b0': 'snd:ui_tap',
  'c145b95db4c077b8db75bdb8329e5fe7': 'mus:title', '0799dc763a33e66c03fc9ef0fd5d7178': 'snd:claim', '5d4b1eda7d276cb9adda5ac1a6aa0543': 'snd:hero_hurt',
  'fa0a62b02a3086bcbce94142b3441c05': 'snd:boss_appear', '5eb72cefec6505c46ef89f0dc1a4214d': 'snd:legendary', 'c51c552050293b88cfe558b9b3b3e487': 'snd:claim',
  '1d98ad83c7e223edc91aff699d443c4d': 'snd:hit', '84ab4c639b3c7f8af848b41172359878': 'snd:coin', '8863b3ab71afe08aef6c7aa26d104efc': 'snd:ult_ready',
};

/* mudanças pedidas (PO 12/11 21h): cada uma [tela, de, para, motivo]. Falha alto se o texto do protótipo mudar. */
const PATCH = [
  // TÍTULO
  ['TituloV2B', /\s*<!-- ===== faixa do PROTÓTIPO[\s\S]*?<\/div>\s*(?=<div class="game">)/, '\n  ', 'faixa de escolha do logo é do protótipo (o dono escolheu B)'],
  ['TituloV2B', /<a class="ib" href="Configuracoes\.dc\.html"[\s\S]*?<\/a>/, '', 'engrenagem: as Configurações não abrem por cima da entrada nesta rodada (sem botão sem ação)'],
  ['TituloV2B', '<a class="cont" href="BemVindo.dc.html" onClick="{{play}}">', '<sc-if value="{{isOld}}"><a class="cont" href="BemVindo.dc.html" onClick="{{play}}">', '"Continuar como" só para quem já tem save'],
  ['TituloV2B', /Continuar como <b style="color: #ffe07a">Kael_BR<\/b> · Nv\. 34<\/span>\s*<\/a>/, 'Continuar como <b style="color: #ffe07a">{{pName}}</b> · Nv. {{pLvl}}</span>\n      </a></sc-if>', 'nome e nível reais'],
  ['TituloV2B', 'Versão [X.Y] · Logo {{vName}}', 'Versão {{ver}}', 'versão real, sem o nome do logo'],
  ['TituloV2B', "this.state = { v: 'B',", "this.state = { v: 'B',", 'logo B fixo (já é o padrão do protótipo)'],
  // LOGIN
  ['Login', /<a href="Main\.dc\.html" aria-label="Voltar"/, '<a href="TituloV2B.dc.html" aria-label="Voltar"', 'voltar leva ao Título'],
  ['Login', /<img class="logo" src="[^"]*" alt="Eonbound"[^>]*>/, '<div class="pi-logoB" role="img" aria-label="Eonbound"><span>EONBOUND</span><i>ATRAVESSE AS ERAS</i></div>', 'logo escolhido é o B Cristal (o arquivo logo.png é o antigo)'],
  ['Login', /\s*<div style="display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: #2a2015; border: 1px dashed #ffc94a">[\s\S]*?<\/div>/, '', '"[N] gemas" de boas-vindas: sem número aprovado no Sys (não mostrar placeholder)'],
  ['Login', /\s*<button onClick="\{\{apple\}\}"[\s\S]*?Continuar com Apple\s*<\/button>/, '', 'lançamento só Android (Google Play)'],
  ['Login', 'Ao continuar você aceita os <a href="#">Termos de Uso</a> e a <a href="#">Política de Privacidade</a>.', 'Ao continuar você aceita os Termos de Uso e a Política de Privacidade (em Configurações › Sobre).', 'links ainda sem página no jogo'],
  ['Login', "google: () => this.connect('Google'),", "google: () => { if (PI.googleReady()) this.connect('Google'); else { this.sfx('snd:ui_tap'); PI.toast('Login com Google em breve'); } },", 'Google: "em breve" até o client ID do dono'],
  ['Login', '<a href="CriarJogador.dc.html" style="display: flex; align-items: center; justify-content: center; height: 52px;', '<a href="CriarJogador.dc.html" onClick="{{guestOk}}" style="display: flex; align-items: center; justify-content: center; height: 52px;', 'convidado confirmado: marca a conta local'],
  ['Login', "back: () => this.setState({ mode: 'main' }),", "back: () => this.setState({ mode: 'main' }),\n      guestOk: () => PI.guest(),", 'convidado'],
  // PRÓLOGO: no fim (e no Pular) vai para a Criação
  ['Prologo', null, null, 'ver PROLOGO_END abaixo'],
  // CRIAÇÃO: começa na escolha do herói (os 3 cartões viraram o Prólogo); "Escolher" leva ao Nome
  ['CriarJogador', "this.state = { step: 0, nick: 'Kael_BR', shake: false, hero: '' };", "this.state = { step: 3, nick: '', shake: false, hero: PI.pick.hero || '' };", 'abre na escolha do herói'],
  ['CriarJogador', "pick_kaia: () => { this.sfx('snd:claim'); this.setState({ hero: 'kaia' }); },", "pick_kaia: () => { if (!PI.KAIA_ON) { this.sfx('snd:ui_tap'); PI.toast('Kaia chega em breve'); return; } this.sfx('snd:claim'); this.setState({ hero: 'kaia' }); },", 'Kaia: arte em produção (chave KAIA_ON)'],
  ['CriarJogador', "choose: () => { this.sfx('snd:ui_tap'); this.setState({ step: 4, nick: s.hero === 'kaia' && s.nick === 'Kael_BR' ? 'Kaia_BR' : s.nick }); },", "choose: () => { if (!s.hero) return; this.sfx('snd:ui_tap'); PI.pick.hero = s.hero; PI.show('NomeJogador'); },", 'nome é a tela 29 (NomeJogador)'],
  // NOME: só o modo "primeiro nome"; valida pelo Sys.name; "Começar" grava e entra no jogo
  ['NomeJogador', "var CUR = 'Kael_BR';", "var CUR = PI.g.name();", 'nome atual real'],
  ['NomeJogador', /function check\(n, mode\) \{[\s\S]*?\n\}\n/, "function check(n, mode) { var r = PI.nameCheck(n, mode); r.uniq = r.uniq !== false; return r; }\n", 'regra do nome no Sys.name (filtro para menores); unicidade de verdade só com o servidor'],
  ['NomeJogador', "this.state = { mode: 'first', nick: 'CachecolRubro',", "this.state = { mode: 'first', nick: makeName(),", 'sugestão sorteada'],
  ['NomeJogador', /\s*<div role="group" aria-label="Protótipo: situação"[\s\S]*?<\/div>/, '', 'botões PROTÓTIPO (1ª vez / trocar) fora: no fluxo de entrada é sempre a 1ª vez'],
  // BEM-VINDO DE VOLTA: números reais do tempo fora (PI.offline); sem botão VIP dobro (PO: VIP já ganha dobro offline); sem dica com número de exemplo
  ['BemVindo', /\s*<div role="group" aria-label="Protótipo: cenário de volta"[\s\S]*?<\/div>/, '', 'botões PROTÓTIPO fora'],
  ['BemVindo', /\s*<button class="rbtn" onClick="\{\{reopen\}\}">[^<]*<\/button>/, '', 'botão PROTÓTIPO fora'],
  ['BemVindo', /\s*<button class="\{\{vipCls\}\}" onClick="\{\{dbl\}\}"[\s\S]*?<\/button>/, '', 'VIP: dobro sai (decisão do dono)'],
  ['BemVindo', /\s*<a class="tip" href="Forja\.dc\.html" onClick="\{\{tap\}\}" aria-label="Dica[\s\S]*?<\/a>/, '', 'dica "+6 → +7" era exemplo'],
  ['BemVindo', /(<div class="rw" style="animation-delay: \.2s">[\s\S]*?BAÚS DE ABATE[\s\S]*?<\/div>\s*<\/div>\s*<\/div>)/, '<sc-if value="{{hasChest}}">$1</sc-if>', 'baú do tempo fora: sem contagem no Sys (some quando é 0)'],
  ['BemVindo', /var NOME = 'Kael_BR';\s*var GOLD0 = 48200;\s*var SC = \{[\s\S]*?\n\};/, "var NOME = PI.g.name();\nvar GOLD0 = (PI.g.S().gold || 0);\nvar SC = { short: PI.offline() || { away: '0min', hrs: 0, capH: 8, gold: 0, xp: 0, xpFrom: 0, xpLv: 0, lv: PI.g.level(), chests: 0, items: [], more: 0, ret: false, retGold: 0, retXp: 0 } };", 'dados reais'],
  ['BemVindo', 'var lv = 34 + c.lvGain;', 'var lv = d.lv + c.lvGain;', 'nível real'],
  ['BemVindo', "hudLv: s.phase === 'done' ? lv : 34,", "hudLv: s.phase === 'done' ? lv : d.lv, hasChest: d.chests > 0,", 'nível real'],
  ['BemVindo', 'var capPct = Math.min(100, d.hrs / 8 * 100);', 'var capPct = Math.min(100, d.hrs / d.capH * 100);', 'teto real (BAL.offlineCapHours)'],
  ['BemVindo', "capNow: String(Math.min(8, d.hrs).toFixed(1)),", "capNow: String(Math.min(d.capH, d.hrs).toFixed(1)), capH: d.capH,", 'teto real'],
  ['BemVindo', "capMsg: full ? 'Teto atingido: ganhos de 8 h. Volte antes para não perder nada.' : 'Quase no teto! Faltam 28 min para parar de acumular.',", "capMsg: full ? 'Teto atingido: ganhos de ' + d.capH + ' h. Volte antes para não perder nada.' : 'Faltam ' + Math.max(1, Math.round((d.capH - d.hrs) * 60)) + ' min para parar de acumular.',", 'texto com o teto real'],
  ['BemVindo', "self.later(function () { self.setState({ open: false, out: false }); }, 1600);", "self.later(function () { self.setState({ open: false, out: false }); PI.claimOffline(); PI.finish(); }, 1600);", 'Coletar entrega e entra no jogo'],
  ['BemVindo', 'Acampamento · Medieval 2-7', 'Acampamento', 'era/fase de exemplo'],
  ['BemVindo', '10% do drop normal', '{{dropRate}}% do drop normal', 'taxa do Sys.loot.DATA.offline.itemRate'],
  ['BemVindo', '<b style="font-size: 14px; font-weight: 900">320<', '<b style="font-size: 14px; font-weight: 900">{{gemsNow}}<', 'gemas reais no topo'],
  ['BemVindo', '<span class="it more" role="img" aria-label="{{moreAria}}" style="--d: 1.3s; --g: 0">+{{moreN}}</span>', '<sc-if value="{{hasMore}}"><span class="it more" role="img" aria-label="{{moreAria}}" style="--d: 1.3s; --g: 0">+{{moreN}}</span></sc-if>', '"+0" some'],
  ['BemVindo', "hudGold: fmt(hudGold),", "hudGold: fmt(hudGold), hasMore: d.more > 0, gemsNow: fmt(PI.g.S().gems || 0), dropRate: d.dropRate,", 'valores reais'],
  ['NomeJogador', '<span class="avLv">Nv. 34</span>', '<span class="avLv">Nv. {{pLvl}}</span>', 'nível real'],
  ['NomeJogador', '<span class="ttl plateTtl">Cavaleiro do Tempo</span>', '', 'título de exemplo (o jogador novo ainda não tem título)'],
  ['NomeJogador', /\s*<div class="row rkOther">[\s\S]*?<\/div>/, '', 'outro jogador do ranking era exemplo (ranking real só com o servidor)'],
  ['NomeJogador', '<span class="pos" style="color: #ffe07a">12</span>', '<span class="pos" style="color: #ffe07a">-</span>', 'posição só com o servidor'],
  ['NomeJogador', /<span class="rTtl" style="color: #bfe0ff">Cavaleiro do Tempo<\/span>/, '', 'título de exemplo'],
  ['NomeJogador', '<span class="fc">12.480</span>', '<span class="fc">{{pFc}}</span>', 'FC real (Sys.fc.compute)'],
];

function slice(s, a, b, from = 0) { const i = s.indexOf(a, from); if (i < 0) return null; const j = s.indexOf(b, i + a.length); return j < 0 ? null : [i + a.length, j]; }
function parts(file) {
  const s = fs.readFileSync(path.join(ROOT, 'docs/proto', file + '.dc.html'), 'utf8');
  const h = slice(s, '<helmet>', '</helmet>'); const helmet = s.slice(h[0], h[1]);
  const st = slice(helmet, '<style>', '</style>'); const css = st ? helmet.slice(st[0], st[1]) : '';
  const t = slice(s, '</helmet>', '</x-dc>'); const tpl = s.slice(t[0], t[1]);
  const js0 = s.indexOf('data-dc-script'); const js1 = s.indexOf('>', js0) + 1, js2 = s.indexOf('</script>', js1);
  return { css, tpl, js: s.slice(js1, js2) };
}
const blob = s => s.replace(/\/_blob\/([0-9a-f]{32})/g, (m, h) => { if (!BLOB[h]) throw new Error('blob sem destino: ' + h); return BLOB[h]; });

/* CSS: cada seletor passa a valer só dentro de "#pin .pi-<Tela>"; @keyframes ganham o prefixo da tela */
function scopeCss(css, id, kf) {
  const pre = '#pin .pi-' + id;
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let out = '', i = 0;
  const block = from => { let d = 0, j = from; for (; j < css.length; j++) { if (css[j] === '{') d++; else if (css[j] === '}') { d--; if (d === 0) return j; } } return j; };
  while (i < css.length) {
    const o = css.indexOf('{', i); if (o < 0) break;
    const sel = css.slice(i, o).trim(), end = block(o), body = css.slice(o + 1, end);
    if (/^@keyframes/.test(sel)) { const n = sel.split(/\s+/)[1]; out += `@keyframes ${id}_${n}{${body}}\n`; }
    else if (/^@media|^@supports/.test(sel)) out += `${sel}{${scopeCss(body, id, kf)}}\n`;
    else if (/^@/.test(sel)) out += `${sel}{${body}}\n`;
    else if (sel) {
      const ss = sel.split(',').map(x => x.trim()).filter(Boolean).map(x => {
        if (x === 'body' || x === 'html' || x === ':root') return pre;
        if (x === '*') return pre + ' *,' + pre;
        return pre + ' ' + x;
      });
      out += ss.join(',') + '{' + renameAnim(body, id, kf) + '}\n';
    }
    i = end + 1;
  }
  return out;
}
function renameAnim(text, id, kf) {
  return text.replace(/(animation(?:-name)?\s*:\s*)([^;"}]*)/g, (m, a, v) => a + v.replace(/[A-Za-z_][\w-]*/g, w => (kf.has(w) ? id + '_' + w : w)));
}

let screens = {}, notes = [];
for (const id of SCREENS) {
  let { css, tpl, js } = parts(id);
  css = blob(css); tpl = blob(tpl); js = blob(js);
  const kf = new Set([...css.matchAll(/@keyframes\s+([\w-]+)/g)].map(m => m[1]));
  for (const [sid, from, to, why] of PATCH) {
    if (sid !== id || from == null) continue;
    const tgt = [tpl, js, css]; let hit = false;
    for (let k = 0; k < 3 && !hit; k++) {
      const before = tgt[k]; const after = typeof from === 'string' ? (before.includes(from) ? before.split(from).join(to) : before) : before.replace(from, to);
      if (after !== before || (typeof from === 'string' && before.includes(from))) { tgt[k] = after; hit = true; }
    }
    if (!hit) throw new Error(`[${id}] trecho não encontrado (${why}): ${String(from).slice(0, 80)}`);
    [tpl, js, css] = tgt; notes.push(`${id}: ${why}`);
  }
  tpl = tpl.replace(/\s+hint-placeholder-[\w-]+="[^"]*"/g, '').replace(/<!--[\s\S]*?-->/g, '').replace(/\n\s*\n/g, '\n');
  tpl = tpl.replace(/(style="[^"]*)"/g, (m, a) => renameAnim(a, id, kf) + '"');
  js = js.replace(/(['"`])(animation(?:-name)?\s*:\s*[^'"`;]*)/g, (m, q, a) => q + renameAnim(a, id, kf));
  /* vw/vh do protótipo = tela do celular; no jogo a tela é o palco de 390 px escalado: as unidades viram variáveis do palco (PI.fit) */
  const vu = s => s.replace(/(-?\d*\.?\d+)(dvh|svh|vh|vw)\b/g, (m, n, u) => 'calc(' + n + ' * var(--pi-' + (u === 'vw' ? 'vw' : 'vh') + '))');
  css = vu(css.replace(/100dvh|100vh/g, '100%')); tpl = vu(tpl);
  js = js.replace(/(['"])([^'"\n]*?\d(?:dvh|vh|vw)[^'"\n]*)\1/g, (m, q, s) => q + vu(s) + q);
  css = scopeCss(css, id, kf);
  screens[id] = { css, tpl, js, fluid: !!FLUID[id] };
}

/* Prólogo: ao terminar (ou Pular), vai para a Criação (o protótipo só parava na última cena) */
{
  const p = screens.Prologo;
  if (!/skip\s*:/.test(p.js)) throw new Error('Prologo: handler skip não encontrado');
  p.end = true;
}

const head = fs.readFileSync(path.join(__dirname, 'head.js'), 'utf8');
const body = 'const PI_SCREENS=' + JSON.stringify(screens) + ';' + String.fromCharCode(10) + '})();' + String.fromCharCode(10);
const outFile = path.join(ROOT, 'js/p_intro.js');
fs.writeFileSync(outFile, head + '\n/* ---------- telas geradas (não editar à mão) ---------- */\n' + body);
console.log('js/p_intro.js', fs.statSync(outFile).size, 'bytes;', notes.length, 'mudanças aplicadas');
