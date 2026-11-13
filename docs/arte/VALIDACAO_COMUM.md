# Arte: base comum dos manuais (ferramentas, gerar, validar, entregar)

Vale para todos os manuais de `docs/arte/`. Cada manual de tipo aponta para cá em vez de repetir. Regras do PO: `docs/FLUXO_ARTE.md` (portões G0-G5). Item pronto: `docs/ARTE_PRONTO.md`. Situação: `docs/ARTE_MATRIZ.md`. Custo: `docs/arte/CUSTO_POR_ITEM.md`. G5 do QA: `docs/qa/VALIDAR_ARTE.md`.

---

## 1. Antes de tudo (todo item, toda sessão)

1. **Um item por vez até 100%**, e primeiro os itens que já estão no jogo (regra do dono). O item tem de estar aberto pelo PO na matriz.
2. **Copiar a pasta de ferramentas.** Todas as ferramentas ficam em `C:\Users\rafae\AppData\Local\Temp\tools\`. Essa pasta está FORA do repositório, dentro de uma pasta Temp, e é a **única cópia**. Antes de começar o item (e depois de mexer em qualquer ferramenta):
   ```
   robocopy C:\Users\rafae\AppData\Local\Temp\tools C:\Users\rafae\Desktop\fps_backup\tools /E /XF *.mp4 /XD _raw _clean
   ```
   Se a pasta sumir, avisar o PO na hora; não tentar recriar ferramentas "de memória".
3. **Backup dos assets que vão ser sobrescritos**: `C:\Users\rafae\Desktop\fps_backup\<tarefa>\` (copiar png + json do estado antes de rodar o script).
4. **Plano de custo ao PO antes de gastar** (tabela em `CUSTO_POR_ITEM.md`). Parar a geração paga em ~10 créditos por item sem nova liberação. Sempre 1 job de teste antes do lote.
5. **Anotar cada job na hora** (id, url, custo): Higgsfield em `C:\Users\rafae\AppData\Local\Temp\tools\kaiamount\jobs.txt` (ou o jobs.txt da pasta do tipo: `skin\`, `kaiaskin\`, `bow\`, `petvid\`); grátis em `C:\Users\rafae\AppData\Local\Temp\tools\LEIA_gratis.txt`. Job sem anotação = risco de pagar duas vezes.
6. **PC sobrecarregado**: um processo pesado por vez (um node, um vídeo). Sem Chrome aberto à toa. Parar a equipe se o dono avisar 80% de uso.

Todos os comandos `node <ferramenta>.js` abaixo rodam **de dentro de** `C:\Users\rafae\AppData\Local\Temp\tools` (é lá que está o `node_modules` com `sharp` e `ffmpeg-static`). No Git Bash: `cd /c/Users/rafae/AppData/Local/Temp/tools`.
`FF=/c/Users/rafae/AppData/Local/Temp/tools/node_modules/ffmpeg-static/ffmpeg.exe`

---

## 2. Os dois caminhos de geração, lado a lado

| Passo | Caminho GRÁTIS | Caminho Higgsfield (crédito) |
|---|---|---|
| Imagem-guia | Google AI Studio, modelo de imagem **"Nano Banana 2 Lite"**, saída **1K** (1024²). Sai com a marca **✦** no canto inferior direito | `generate_image`, `model:"nano_banana_pro"`, `aspect_ratio:"1:1"`, `resolution:"1k"` (1024², herói e pet a pé) ou `"2k"` (montaria, kit `docs/guidekit`), `medias:[{role:"image_references",value:<id>},...]` |
| Tirar a marca | `node dewm.js <in.png> <out.png> C:/Users/rafae/AppData/Local/Temp/tools` (pinta os 11% do canto inferior direito com a cor do fundo; confira que nada do desenho está nesse canto) | não tem marca |
| Subir referência | anexar no site | `media_upload` → `node put1.js <arquivo> '<url de upload>'` (tem de imprimir `200`) → `media_confirm` (anotar o id) |
| Vídeo de laço (parado, correr) | Kling **2.5 Turbo**: quadro inicial **e** final = guia, 5 s, **25 créditos grátis** (o plano da Kaia na Fênix usou 1080p: resolução **a confirmar**) | `generate_video`, `model:"seedance_2_0"`, `mode:"fast"`, `resolution:"480p"`, `duration:4`, `aspect_ratio:"1:1"`, `generate_audio:false`, `medias:[{role:"start_image",value:<guia>},{role:"end_image",value:<guia>}]` (~4 créditos) |
| Vídeo sem laço (golpe, giro, morte, tiro) | Kling **4.0 Flash**: 720p, 3 s, **só quadro inicial**, **18 créditos grátis**; sai 960×960 com a marca "KlingAI" embaixo à direita | o mesmo `seedance_2_0` (start = end = guia também no golpe: o gesto volta à pose inicial) |
| Esperar | baixar o mp4 no site | `jobs_wait` com `timeout_seconds` ≤ 15 (repetir até ficar pronto); baixar a url na hora |
| Tirar a marca do Kling | `"$FF" -y -i in.mp4 -vf "drawbox=x=730:y=880:w=230:h=80:color=0x00FF00:t=fill" -an out_limpo.mp4` (o retângulo vira fundo verde; confira que pata/pé/cauda não entram nesse canto) | não tem marca |
| Saldo | Kling: **66 créditos grátis por dia** = 3 Flash (54) ou 2 Turbo (50) ou 1 Turbo + 2 Flash (61) | `balance`; parar em ~10 sem nova liberação do PO |

`IP_DETECTED` no Higgsfield não cobra (aconteceu em skins da Kaia): refazer o pedido com texto mais genérico e anotar.

### Lições que já custaram caro (valem para todo vídeo com bastão)
- **Movimento rápido = borrão do bastão** → listras rosa/oliva que não saem. Pedir sempre: `one single slow turn, no motion blur, no speed lines, no motion trails, the staff stays sharp`.
- **Onde o bastão cruza o corpo**, o `polevid` deixa uma **listra escura ("fantasma")**. Conserto por código com quadro doador limpo e alinhado: `stagekit/inpaint.js`, `stagekit/chest.js` (commits 7f938d7 e 454ceb8). Atenção: os dois têm o caminho da `kael_cyborg` escrito no topo (`const K=...`); para outra skin, trocar essa linha (e a lista `SIB` do chest.js) numa cópia. `stagekit/sk_detail.js` é uma cópia detalhada do teste do StageKit (relatório por quadro), não um remendo.
- **Golpe de cima para baixo risca o rosto.** Usar a estocada: `the pole always stays below the chin, pointing forward, and never crosses the face`.
- **Coisa solta no ar** (brasa, faísca, névoa, estrela): reprova. O prompt proíbe; `kaiamount/spark.js` limpa faísca no golpe da montaria.
- **Magenta fora do bastão** (chamas roxas): `checkguide.js` avisa; pedir chamas azul-violeta ou `--violet`.

### Fim comum de TODO prompt (as proibições)
```
Flat pure green background (#00FF00), no ground shadow, no text. Strict side view facing right, locked camera.
Clean cartoon line art in the same chibi game style. Nothing floating, no glow, no sparks, no embers, no visual effects,
no motion blur, no speed lines, no motion trails. No wings on the character. No magenta or pink anywhere except the guide pole.
```
Com herói, somar: `Young child of about 10, natural child proportions, serious determined warrior face, fully clothed, modest.` e `In the right hand a straight thin solid bright MAGENTA pole, fist closed around it; the pole never crosses the face.`

---

## 3. Portão G1 grátis antes de pagar vídeo

```
node C:/Users/rafae/Desktop/fps/docs/guidekit/checkguide.js <guia.png>
node C:/Users/rafae/Desktop/fps/docs/guidekit/checkguide.js <guia.png> --violet <saida.png>   # chamas roxas viram azul-violeta
```
Confere: fundo verde (≥30%), linha do chão (`groundY_2048` ≤ 2040), margens (≥8 px no topo e nas laterais), magenta só no bastão (`magentaOffPole` ≤ 300 px na escala 2048), bastão com ≥500 px. **Tem de sair `"warnings": []` (código de saída 0).** Guia sem bastão (pet, asa, ícone, imagem parada): o aviso "quase sem magenta" é esperado; os outros avisos valem.
Depois, olho: nada flutua, sem asa no corpo, criança, rosto sério, nada sensual, uma sela só (montaria).

---

## 4. Conferência numérica: `artcheck.js`

Ainda **não existe** na pasta de ferramentas. Na primeira vez, salvar o bloco abaixo como `C:\Users\rafae\AppData\Local\Temp\tools\artcheck.js` (e copiar para o backup). Sintaxe conferida com `node --check`; **resultado ainda não calibrado em folha real (a confirmar na 1ª execução)**: se uma folha já aprovada pelo dono falhar, ajustar o limite e anotar aqui.

Subcomandos (rodar um de cada vez, de dentro de `tools`):
| comando | o que prova | passa se |
|---|---|---|
| `node artcheck.js cmp <skin_body.json> <padrao_body.json> 4 8 3 4` | grip, ângulo, pés e costas iguais ao herói padrão, quadro a quadro | `OK n/n quadros` |
| `node artcheck.js loop <folha.png> <folha.json> 1.5` | laço sem salto: diferença último→primeiro ≤ 1,5 × a mediana entre vizinhos | `OK laço sem salto` |
| `node artcheck.js px <folha.png> <folha.json>` | magenta = 0 (resto do bastão), franja verde ≤ 20 px/quadro, semitransparente interno ≤ 30 px/quadro (borrão e rastro-fantasma) | `OK` |
| `node artcheck.js pal <folha.png> <guia.png> 0.5` | cor fora da paleta da guia aprovada ≤ 0,5% dos pixels opacos | `OK paleta` |

```js
// artcheck.js — conferências numéricas de folhas (Eonbound). Um processo node por vez. Só lê; nunca grava nos assets.
// Uso (rodar de C:/Users/rafae/AppData/Local/Temp/tools):
//   node artcheck.js cmp  <folha_body.json> <folha_padrao_body.json> [tolGrip=4] [tolAng=8] [tolPes=3] [tolBack=4]
//   node artcheck.js loop <folha.png> <folha.json> [limite=1.5]
//   node artcheck.js px   <folha.png> [<folha.json>]
//   node artcheck.js pal  <folha.png> <imagem_guia.png> [limite=0.5]
const path = require('path'), fs = require('fs');
const sharp = require(path.join('C:/Users/rafae/AppData/Local/Temp/tools/node_modules/sharp'));
const [, , cmd, a, b, ...rest] = process.argv;
const J = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const raw = async p => { const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true }); return { d: data, W: info.width, H: info.height }; };
const cell = (M, f) => { const cols = M.cols || M.frames; return { sx: (f % cols) * M.w, sy: Math.floor(f / cols) * M.h }; };
async function lowest(png, M){ const I = await raw(png); const out = [];
  for (let f = 0; f < M.frames; f++){ const { sx, sy } = cell(M, f); let y1 = -1;
    for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x += 1){ if (I.d[((sy + y) * I.W + sx + x) * 4 + 3] > 60 && y > y1) y1 = y; }
    out.push(y1); } return out; }
const angd = (p, q) => Math.abs(((p - q + 540) % 360) - 180);
(async () => {
  if (cmd === 'cmp'){
    const S = J(a), D = J(b); const [tg, ta, tf, tb] = [rest[0] || 4, rest[1] || 8, rest[2] || 3, rest[3] || 4].map(Number);
    if (S.frames !== D.frames || S.w !== D.w || S.h !== D.h) console.log(`FALHA formato: skin ${S.frames}q ${S.w}x${S.h} × padrão ${D.frames}q ${D.w}x${D.h}`);
    const n = Math.min(S.frames, D.frames); const fs1 = await lowest(a.replace(/\.json$/, '.png'), S), fs2 = await lowest(b.replace(/\.json$/, '.png'), D);
    let bad = 0; const worst = { grip: 0, ang: 0, pes: 0, back: 0 };
    for (let f = 0; f < n; f++){ const msg = [];
      if (S.grip && D.grip && S.grip[f] && D.grip[f]){ const g = Math.hypot(S.grip[f].x - D.grip[f].x, S.grip[f].y - D.grip[f].y), an = angd(S.grip[f].ang, D.grip[f].ang);
        worst.grip = Math.max(worst.grip, g); worst.ang = Math.max(worst.ang, an); if (g > tg) msg.push(`grip ${g.toFixed(1)}px`); if (an > ta) msg.push(`ângulo ${an.toFixed(1)}°`); }
      const p = Math.abs(fs1[f] - fs2[f]); worst.pes = Math.max(worst.pes, p); if (p > tf) msg.push(`pés ${p}px`);
      const bs = S.back && S.back[f], bd = D.back && D.back[f];
      if (bs && bd){ const bx = (bs.x ?? bs[0]) - (bd.x ?? bd[0]), by = (bs.y ?? bs[1]) - (bd.y ?? bd[1]), bb = Math.hypot(bx, by); worst.back = Math.max(worst.back, bb); if (bb > tb) msg.push(`back ${bb.toFixed(1)}px`); }
      if (msg.length){ bad++; console.log(`q${f}: ` + msg.join(' · ')); } }
    console.log(`pior: grip ${worst.grip.toFixed(1)}px, ângulo ${worst.ang.toFixed(1)}°, pés ${worst.pes}px, back ${worst.back.toFixed(1)}px`);
    console.log(bad ? `FALHA ${bad}/${n} quadros fora da tolerância (grip ≤${tg}px, ângulo ≤${ta}°, pés ≤${tf}px, back ≤${tb}px)` : `OK ${n}/${n} quadros`);
    process.exitCode = bad ? 1 : 0; return; }
  if (cmd === 'loop'){
    const M = J(b), I = await raw(a), lim = +(rest[0] || 1.5);
    const fr = f => { const { sx, sy } = cell(M, f); return [sx, sy]; };
    const diff = (f, g) => { const [ax, ay] = fr(f), [bx, by] = fr(g); let s = 0, n = 0;
      for (let y = 0; y < M.h; y += 2) for (let x = 0; x < M.w; x += 2){ const i = ((ay + y) * I.W + ax + x) * 4, j = ((by + y) * I.W + bx + x) * 4;
        const aa = I.d[i + 3], bb = I.d[j + 3]; if (aa < 20 && bb < 20) continue; n++; s += Math.abs(aa - bb) + (aa > 100 && bb > 100 ? (Math.abs(I.d[i] - I.d[j]) + Math.abs(I.d[i + 1] - I.d[j + 1]) + Math.abs(I.d[i + 2] - I.d[j + 2])) / 3 : 0); }
      return n ? s / n : 0; };
    const ds = []; for (let f = 0; f + 1 < M.frames; f++) ds.push(diff(f, f + 1)); const med = ds.slice().sort((p, q) => p - q)[ds.length >> 1];
    const jump = diff(M.frames - 1, 0), r = jump / (med || 1);
    console.log(`vizinhos: mediana ${med.toFixed(1)} · último->primeiro ${jump.toFixed(1)} · razão ${r.toFixed(2)} (limite ${lim})`);
    console.log(r <= lim ? 'OK laço sem salto' : 'FALHA salto no laço'); process.exitCode = r <= lim ? 0 : 1; return; }
  if (cmd === 'px'){
    const I = await raw(a); const M = b ? J(b) : { frames: 1, w: I.W, h: I.H }; let tot = { mag: 0, verde: 0, semi: 0 };
    for (let f = 0; f < M.frames; f++){ const { sx, sy } = cell(M, f); let mag = 0, verde = 0, semi = 0;
      const A = (x, y) => (x < 0 || y < 0 || x >= M.w || y >= M.h) ? 0 : I.d[((sy + y) * I.W + sx + x) * 4 + 3];
      for (let y = 0; y < M.h; y++) for (let x = 0; x < M.w; x++){ const i = ((sy + y) * I.W + sx + x) * 4, r = I.d[i], g = I.d[i + 1], bl = I.d[i + 2], al = I.d[i + 3]; if (al < 20) continue;
        if (al > 40 && r > 150 && bl > 150 && g < 120) mag++;
        if (g > r + 10 && g > bl + 5) verde++;
        if (al < 235){ let o = 0, t = 0; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ if (dx * dx + dy * dy > 16) continue; t++; if (A(x + dx, y + dy) >= 235) o++; } if (o / t >= 0.9) semi++; } }
      tot.mag += mag; tot.verde += verde; tot.semi += semi; if (mag || verde > 20 || semi > 30) console.log(`q${f}: magenta ${mag} · verde ${verde} · semitransparente interno ${semi}`); }
    const ok = tot.mag === 0 && tot.verde <= 20 * M.frames && tot.semi <= 30 * M.frames;
    console.log(`total: magenta ${tot.mag} · verde ${tot.verde} · semitransparente interno ${tot.semi} -> ${ok ? 'OK' : 'FALHA'} (limites: magenta 0; verde ≤20/quadro; interno ≤30/quadro)`);
    process.exitCode = ok ? 0 : 1; return; }
  if (cmd === 'pal'){
    const S = await raw(a), G = await raw(b), lim = +(rest[0] || 0.5); const q = (d, i) => ((d[i] >> 4) << 8) | ((d[i + 1] >> 4) << 4) | (d[i + 2] >> 4);
    const pal = new Set(); for (let i = 0; i < G.d.length; i += 4){ const r = G.d[i], g = G.d[i + 1], bl = G.d[i + 2]; if (G.d[i + 3] < 200) continue; if (g > r + 60 && g > bl + 60) continue; if (r > 150 && bl > 150 && g < 120) continue; pal.add(q(G.d, i)); }
    let n = 0, out = 0; for (let i = 0; i < S.d.length; i += 4){ if (S.d[i + 3] < 200) continue; n++; if (!pal.has(q(S.d, i))) out++; }
    const pc = 100 * out / (n || 1); console.log(`cores fora da paleta da guia: ${out}/${n} px = ${pc.toFixed(2)}% (limite ${lim}%)`);
    console.log(pc <= lim ? 'OK paleta' : 'FALHA cor fora da paleta'); process.exitCode = pc <= lim ? 0 : 1; return; }
  console.log('uso: node artcheck.js cmp|loop|px|pal ... (ver cabeçalho)'); process.exitCode = 2;
})();
```

Ferramentas que já existem e cobrem parte disso: `kaiamount/pinkcount.js <folhas...>` (magenta e alfa parcial por folha), `stagekit/holes.js <png> <cellW>` (semitransparente no interior, por quadro), `kaiaskin/degreen.js` / `newpets/despill.js` (tiram a franja verde: consertam, não medem).

---

## 5. Testes automáticos do repositório (G4)

Rodar **um de cada vez**, da raiz `C:\Users\rafae\Desktop\fps`:
1. `node test/sys/stagekit.test.js` — grade cabe na imagem; ponto mais baixo = `feetY` (±4 px parado, ±6 px correndo/golpe); mão opaca a ≤6 px do grip em todo quadro; âncora `back` dentro do corpo (±8 px); pets com os pés no chão (voador: não afunda); pasta `_nowing` completa. **Esperado: termina com "N verificações ok", sem "FALHAS" e sem AVISOS novos** (a lista KNOWN está vazia: qualquer achado novo falha).
2. `node test/paineis/sheetcss.test.js` — telas que desenham folha por CSS continuam batendo com o formato (tira × grade). Esperado: 0 FALHA.
3. `node test/e2e/sheetgrid.js` — leitores de grade (`sheetSX/sheetSY/sheetXY` do js/stage.js). Esperado: sai com código 0.

**Folhas ficam em TIRA** (uma linha). A conversão para grade está **congelada** pelo Engenheiro (fps-c8). `tools/grid/regrid.js` só com ordem escrita dele; antes de cada lote, varrer leitores por CSS (memória "Grade: leitores por CSS").

---

## 6. Folha de conferência para o dono (`_conferencia_*.png`)

Uma imagem por item, fundo cinza, linha do chão em vermelho, quadros-chave de cada estado, com a arma posta por código. Ferramenta por tipo:
| tipo | comando | saída |
|---|---|---|
| skin Kael | `node skin/conf.js <skin>` | `assets/anim/skins/kael_<skin>/_conferencia.png` (8 linhas: correr, parado, golpe, giro, morte, pistola ×3) |
| skin Kael × padrão | `node skin/view.js <skin> <folha> 0.75` | `tools/skin/cmp_<skin>_<folha>.png` (linha 1 = padrão R, linha 2 = skin, pés em y=243, mão em amarelo) |
| skin Kaia × menina | `node kaiaskin/cmpview.js <menina.png> <menina.json> <skin.png> <skin.json> <saida.png>` | onde indicar; a folha única da Kaia **não tem ferramenta própria (a confirmar)**: juntar as saídas com `newpets/cs.js` |
| montaria | `node kaiamount/conf.js <montaria>` | `assets/anim/mounts/_conferencia_<montaria>.png` (Kael e Kaia × parado/correr/golpe, 6 quadros-chave, chão em 339) |
| pet | `node newpets/sheetcs.js <saida.png> <base1> <base2> ...` | sugerido: `assets/anim/pets/_conferencia_<chave>.png` (uma linha por folha, todos os quadros, pés em vermelho) |
| arma montada | `node mount/gamecheck.js <saida.png> <montaria> <estado> <chave1,chave2>` (Kael) · `kaiamount/gamecheck.js` (Kaia) | arma no grip como o jogo desenha, cruz vermelha = grip |
| asa | prévia para voto como `docs/proto/v2/AsaSerafica.html` (e28d164) | página no índice único de protótipos |
| ícone | `node newpets/cs.js <saida.png> 256 <ic1.png> <ic2.png> ...` | lado a lado |

Mandar ao PO o caminho da folha + o resultado dos testes. O dono vota no visual novo; nada vai ao dono sem passar no §4 e no §5.

---

## 7. G5 "visto na tela": como entregar ao QA

1. Commit e push feitos (ver §8). Anotar o hash.
2. Mandar ao QA **uma linha**: `item · commit · folhas tocadas · o que olhar (estados, telas, chaves de debug)`. Exemplo: `Skin Kael Ninja · a1b2c3d · skins/kael_ninja/kael_spin_* · giro q0-16 com era3_t0 e era6_t2; Batalha, Derrota, Perfil; &neck=0 × padrão`.
3. O QA segue `docs/qa/VALIDAR_ARTE.md` §4 do tipo (prints em `reports/qa/<tipo>_<id>/`) e marca ✓/✗ na coluna QA da matriz com commit, data e print.
4. **O QA pede a vez do navegador à fps-c8** antes de abrir; a Arte não abre Chrome para isso. Se a Arte precisar ver algo no navegador: headless só em porta própria **18730-18739**, nunca 9222/9333, e fechar ao terminar.
5. ✗ do QA volta ao portão que falhou (G3 = folha/json, Engenheiro = código). Commit novo na folha reabre o G5.

---

## 8. Git (6 sessões no mesmo repositório)

```
git add -f -- <arquivo1> <arquivo2> ...
git commit -m "Arte: <item>: <o que mudou>" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- <arquivo1> <arquivo2> ...
git push origin master:main
```
Só caminhos explícitos. **Nunca** `checkout`, `reset`, `restore`, `stash`, `clean`, `pull`, `merge`, `rebase` nem `git add .`. Se existir `.git/index.lock`, esperar e tentar de novo (outra sessão está commitando). Atualizar `docs/STATUS_DONO.md` a cada entrega.

## 9. Reprovação imediata (todos os tipos)
- Asa desenhada em skin; arma pintada na folha do herói (`_body` tem de sair sem arma).
- Herói adulto, "crescido" ou com pose/roupa sensual (jogo com menores).
- Qualquer coisa flutuando sem estar presa ao corpo.
- Magenta sobrando na folha (`pinkcount` > 0); franja verde visível; listra-fantasma do bastão.
- Pés fora do chão além da tolerância; mão fora do grip em qualquer quadro.
- Item fora da matriz, ou gerado sem guia aprovado no G1, ou gasto sem plano aprovado.
