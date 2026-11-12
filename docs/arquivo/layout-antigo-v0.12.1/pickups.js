/* Eonbound — pickups do farm desenhados por código (fps-ff). Sem imagens, sem crédito.
   Pickups.spawn(kind, x, y, target)  kind: 'coin' | 'xp' ; target = {x,y} do ícone no HUD (ou função que devolve {x,y})
   Pickups.update(dt) ; Pickups.draw(ctx) ; Pickups.onArrive = (kind) => {}   // toque coin/gem/xp aqui
   Comportamento: salta para fora do inimigo, quica 2 vezes no chão (groundY), fica 0,35 s girando/pulsando e voa em curva até o HUD. */
(function(){
  const list = [];
  let groundY = 0;
  const easeIn = t => t * t * t;
  function spawn(kind, x, y, target, opts = {}){
    const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = 160 + Math.random() * 120;
    list.push({ kind, x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, gy: opts.groundY ?? groundY ?? y, bounces: 0, state: 'drop', t: 0, target, r: kind === 'coin' ? 9 : 8, seed: Math.random() * 10 });
  }
  function tgt(p){ return typeof p.target === 'function' ? p.target() : p.target; }
  function update(dt){
    for (let i = list.length - 1; i >= 0; i--){
      const p = list[i]; p.t += dt;
      if (p.state === 'drop'){
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y >= p.gy){ p.y = p.gy; if (p.bounces < 2){ p.vy = -p.vy * 0.42; p.vx *= 0.6; p.bounces++; } else { p.vy = 0; p.vx = 0; p.state = 'rest'; p.t = 0; } }
      } else if (p.state === 'rest'){
        if (p.t > 0.35){ p.state = 'fly'; p.t = 0; p.sx = p.x; p.sy = p.y; const T = tgt(p); p.cx = (p.x + T.x) / 2 + (Math.random() - 0.5) * 80; p.cy = Math.min(p.y, T.y) - 90; }
      } else {
        const T = tgt(p), u = Math.min(1, p.t / 0.55), e = easeIn(u);
        const a = (1 - e) * (1 - e), b = 2 * (1 - e) * e, c = e * e;
        p.x = a * p.sx + b * p.cx + c * T.x; p.y = a * p.sy + b * p.cy + c * T.y; p.scale = 1 - 0.45 * e;
        if (u >= 1){ list.splice(i, 1); if (Pickups.onArrive) Pickups.onArrive(p.kind); }
      }
    }
  }
  function coin(g, p, now){
    const spin = Math.cos(now * 9 + p.seed), w = Math.max(0.12, Math.abs(spin)), r = p.r * (p.scale || 1);
    g.save(); g.translate(p.x, p.y - r);
    g.fillStyle = spin > 0 ? '#f6c33a' : '#d99a1c'; g.strokeStyle = '#6b3f08'; g.lineWidth = 1.6;
    g.beginPath(); g.ellipse(0, 0, r * w, r, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    if (w > 0.35){ g.fillStyle = '#fff3b0'; g.beginPath(); g.ellipse(-r * 0.25 * w, -r * 0.3, r * 0.22 * w, r * 0.35, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#a8690d'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(0, 0, r * 0.6 * w, r * 0.6, 0, 0, Math.PI * 2); g.stroke(); }
    // brilho que passa
    const s = (now * 1.3 + p.seed) % 2.2; if (s < 0.25){ g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,255,220,' + (1 - s / 0.25) + ')'; star(g, r * 0.7, -r * 0.7, r * 0.6); }
    g.restore();
  }
  function star(g, x, y, s){ g.beginPath(); for (let i = 0; i < 8; i++){ const a = i * Math.PI / 4, rr = i % 2 ? s * 0.25 : s; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); }
  function xp(g, p, now){
    const pulse = 1 + 0.12 * Math.sin(now * 8 + p.seed), r = p.r * pulse * (p.scale || 1);
    g.save(); g.translate(p.x, p.y - r - 2);
    g.globalCompositeOperation = 'lighter';
    const halo = g.createRadialGradient(0, 0, 0, 0, 0, r * 2.4); halo.addColorStop(0, 'rgba(120,255,170,0.55)'); halo.addColorStop(1, 'rgba(60,220,140,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(0, 0, r * 2.4, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    const core = g.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); core.addColorStop(0, '#eafff1'); core.addColorStop(0.45, '#5ff59a'); core.addColorStop(1, '#14a35a');
    g.fillStyle = core; g.strokeStyle = '#0b5b33'; g.lineWidth = 1.4; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.stroke();
    // faíscas orbitando
    g.globalCompositeOperation = 'lighter'; g.fillStyle = '#c8ffd9';
    for (let k = 0; k < 3; k++){ const a = now * 4 + p.seed + k * 2.1; g.beginPath(); g.arc(Math.cos(a) * r * 1.5, Math.sin(a) * r * 0.7, 1.4, 0, Math.PI * 2); g.fill(); }
    g.restore();
  }
  function draw(g){
    const now = performance.now() / 1000;
    for (const p of list){
      if (p.state !== 'fly'){ g.save(); g.globalAlpha = 0.3; g.fillStyle = '#000'; g.beginPath(); g.ellipse(p.x, p.gy + 1, p.r * 0.9, p.r * 0.3, 0, 0, Math.PI * 2); g.fill(); g.restore(); }
      if (p.kind === 'coin') coin(g, p, now); else xp(g, p, now);
    }
  }
  window.Pickups = { spawn, update, draw, list, setGround: y => { groundY = y; }, onArrive: null };
})();
