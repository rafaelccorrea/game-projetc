'use strict';
/* ================= RARIDADE RECONHECÍVEL DE LONGE (pedido do dono via PO) — ATRÁS DA CHAVE SCREENS_ON.rarityFx (index.html) =================
   Chave DESLIGADA por padrão: com ela desligada este arquivo só define funções e NADA muda no jogo. Para conferir: ?debug=1&rar=1.
   1) UMA moldura por raridade, a mesma em todo lugar que mostra item: classe .rar-f + .rar-f<0..4> (borda de 3 px na cor + brilho; Mítico e Lendário pulsam).
      As 5 cores são as do Equipamento aprovado e do canvas (RC do js/screens.js): Básico #e8e2d8 · Raro #4aa3ff · Épico #b07cff · Mítico #ff5a5a · Lendário #ffc94a.
      rarFrame(r, miolo, lado) devolve a moldura pronta para telas novas; rarDecorate(raiz) aplica a MESMA moldura nas telas que já existem sem mexer
      nelas: todo contêiner de ícone de item (img de assets/icons/slots) cuja borda já está na cor de uma raridade (ou que traz data-rar) ganha a classe.
   2) Nome do item na cor da raridade: rarName(r, texto) para telas novas; nas que já existem, o rarDecorate pinta todo texto que é exatamente o nome
      de um item (tabela montada com o iname de todos os espaços, eras e raridades).
   3) Drop no chão da batalha (rarDrop, chamado pelo drawPicks do js/farm.js): brilho na cor em todos; Épico+ com partículas subindo; Mítico e Lendário
      com FEIXE vertical que sai do chão. O drop fica apoiado no chão (sem flutuar), o feixe tem 62 px lógicos (abaixo das barras de vida) e nada treme.
      Som (rarSnd): Épico 'gem'; Mítico 'legendary' com rate 0,9; Lendário 'legendary' (este já tocava no addItemToBag).
   Sem arte nova: tudo por código/CSS. */
const RAR_ON = () => typeof SCREENS_ON !== 'undefined' && !!SCREENS_ON.rarityFx;
const RAR_C = ['#e8e2d8', '#4aa3ff', '#b07cff', '#ff5a5a', '#ffc94a'];          // moldura (iguais ao RC do Equipamento aprovado)
const RAR_TXT = ['#f0ebe2', '#7dbcff', '#c9a4ff', '#ff8a8a', '#ffd872'];        // nome: a mesma cor, um tom mais claro para ler no fundo escuro
const RAR_GLOW = [4, 7, 10, 13, 16];

(function(){ const st = document.createElement('style'); let css = '.rar-f{border-style:solid!important;border-width:3px!important}\n.rar-n{text-shadow:0 1px 2px #000}\n';
  RAR_C.forEach((c, i) => { css += `.rar-f${i}{border-color:${c}!important;box-shadow:0 0 ${RAR_GLOW[i]}px ${c}${i ? 'cc' : '55'}${i >= 3 ? ';animation:rarpulse' + i + ' 1.6s ease-in-out infinite' : ''}}\n`;
    if (i >= 3) css += `@keyframes rarpulse${i}{0%,100%{box-shadow:0 0 6px ${c}aa}50%{box-shadow:0 0 ${RAR_GLOW[i] + 8}px ${c}}}\n`; });
  st.textContent = css; document.head.appendChild(st); })();

/* moldura pronta (telas novas): quadrado de `lado` px com o miolo dentro */
function rarFrame(r, inner, size){ r = Math.max(0, Math.min(4, r | 0)); const c = RAR_C[r], s = size || 58;
  return `<span class="rar-f rar-f${r}" data-rar="${r}" style="position:relative;display:flex;align-items:center;justify-content:center;width:${s}px;height:${s}px;flex:none;border-radius:${Math.round(s * 0.24)}px;background:radial-gradient(circle at 50% 38%,${c}33,#120d0a 75%);box-sizing:border-box;overflow:hidden">${inner || ''}</span>`; }
function rarName(r, txt){ r = Math.max(0, Math.min(4, r | 0)); return `<span class="rar-n" data-rar="${r}" style="color:${RAR_TXT[r]}">${String(txt).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch]))}</span>`; }

/* ---------- telas que já existem: aplica a mesma moldura e a cor do nome, sem tocar nelas ---------- */
const RAR_IDX = {};   // cor (como o navegador devolve em style.borderColor) → raridade; aceita a paleta do Equipamento e a antiga (RAR[].c, usada pelo baú)
function rarKeyOf(col){ const d = document.createElement('span'); d.style.borderColor = col; return (d.style.borderTopColor || '').replace(/\s/g, ''); }
RAR_C.forEach((c, i) => { RAR_IDX[rarKeyOf(c)] = i; });
let RAR_NAMES = null;
function rarNames(){ if (RAR_NAMES) return RAR_NAMES; const m = {};
  try { RAR.forEach((R, i) => { const k = rarKeyOf(R.c); if (RAR_IDX[k] == null) RAR_IDX[k] = i; });
    for (const slot of SLOTS7) for (let e = 0; e < ERAS.length; e++) for (let r = 0; r < 5; r++){ const n = iname({ slot, e, r }); if (!n) continue; m[n] = m[n] == null ? r : (m[n] === r ? r : -1); }   // nome igual em raridades diferentes: não pinta
  } catch (er) {}
  return RAR_NAMES = m; }
function rarOfEl(el){ if (el.dataset && el.dataset.rar != null && el.dataset.rar !== '') return +el.dataset.rar;
  const bc = el.style && el.style.borderTopColor; if (!bc) return null; const r = RAR_IDX[bc.replace(/\s/g, '')]; return r == null ? null : r; }
function rarDecorate(root){ if (!RAR_ON() || !root) return; const N = rarNames();
  root.querySelectorAll('img[src*="icons/slots"]').forEach(im => { let el = im.parentElement;
    for (let k = 0; k < 3 && el && el !== root; k++, el = el.parentElement){ const r = rarOfEl(el); if (r != null && r >= 0 && r <= 4){ if (!el.classList.contains('rar-f' + r)){ el.classList.remove('rar-f0', 'rar-f1', 'rar-f2', 'rar-f3', 'rar-f4'); el.classList.add('rar-f', 'rar-f' + r); } break; } } });
  root.querySelectorAll('span,b').forEach(el => { if (el.childElementCount || el.classList.contains('rar-n')) return; const r = N[el.textContent.trim()]; if (r != null && r >= 0){ el.classList.add('rar-n'); el.style.color = RAR_TXT[r]; } });
}
function rarInit(){ if (!RAR_ON()) return; const app = document.getElementById('app'); if (!app || !window.MutationObserver) return; let pend = false;
  new MutationObserver(() => { if (pend) return; pend = true; requestAnimationFrame(() => { pend = false; rarDecorate(app); }); }).observe(app, { childList: true, subtree: true });
  rarDecorate(app); }

/* ---------- drop no chão da batalha ---------- */
function rarSnd(r){ if (!RAR_ON() || !S.set.sound) return;
  if (r === 2) snd('gem');
  else if (r === 3){ const g = window.GameAudio; if (g && g.sfx){ try { g.sfx('legendary', { rate: 0.89 }); } catch (e) {} } else snd('legendary'); } }   // Lendário (4): o addItemToBag já toca 'legendary'
/* chamado com o contexto já transladado para o ponto do drop (q.x, q.y); s = tamanho; ph = fase da animação. st 0 pulando · 1 no chão · 2 voando para a mochila */
function rarDrop(q, p, s, ph){ const r = Math.max(0, Math.min(4, p.r | 0)), c = RAR_C[r], ground = q.st < 2, pulse = 0.5 + 0.5 * Math.sin(ph);
  if (ground && r >= 3){ const H = 62 * PX, w = (r === 4 ? 9 : 7) * s, gy = (GY - q.y);   // FEIXE: do chão (GY) para cima, mais claro no meio, some no topo
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, gy, 0, gy - H); g.addColorStop(0, c); g.addColorStop(0.55, c + '88'); g.addColorStop(1, c + '00');
    ctx.globalAlpha = 0.55 + 0.25 * pulse; ctx.fillStyle = g; ctx.fillRect(-w, gy - H, w * 2, H);
    const g2 = ctx.createLinearGradient(0, gy, 0, gy - H); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.5, '#ffffff66'); g2.addColorStop(1, '#ffffff00');
    ctx.globalAlpha = 0.6 + 0.3 * pulse; ctx.fillStyle = g2; ctx.fillRect(-w * 0.3, gy - H, w * 0.6, H);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, gy, w * 1.6, 2.4, 0, 0, 7); ctx.fill(); ctx.restore(); }
  drawGlow(c, 0, -2, (11 + 2.5 * r + 2 * pulse) * s, 0.55 + 0.1 * r);                               // brilho na cor da raridade (todos)
  if (ground && r >= 2 && Math.random() < (r >= 3 ? 0.35 : 0.2)) emit({ x: q.x + (Math.random() - .5) * 12, y: q.y - 2, vx: (Math.random() - .5) * 10, vy: -26 - Math.random() * 34, g: 0, t: 0, life: 0.7 + Math.random() * 0.3, col: c, sz: 2 + Math.random() * 1.5, glow: true });   // partículas subindo (Épico+)
  ctx.fillStyle = '#2a211a'; ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-6 * s, -8 * s, 12 * s, 12 * s, 3); else ctx.rect(-6 * s, -8 * s, 12 * s, 12 * s); ctx.fill(); ctx.stroke();   // o item: caixinha com a borda na cor
  ctx.fillStyle = c; ctx.fillRect(-1.2 * s, -6 * s, 2.4 * s, 8 * s); ctx.fillRect(-3.5 * s, -0.5 * s, 7 * s, 1.8 * s);
}
/* debug: solta no chão um drop de cada raridade pedida (sem dar item). dbgDrops([0,1,2,3,4]) */
window.dbgDrops = function(list){ if (!DEBUG || typeof PK === 'undefined') return; (list || [0, 1, 2, 3, 4]).forEach((r, i) => { PK.list.push({ p: { type: 'item', value: 1, r, to: 'bag', big: r >= 3 }, x: HX + 70 + i * 34, y: GY - 6, vx: 0, vy: 0, t: 0, st: 1, rt: 0, ft: 0, sx: 0, sy: 0, rest: 9999, sd: i }); rarSnd(r); }); return PK.list.length; };
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rarInit); else setTimeout(rarInit, 0);
