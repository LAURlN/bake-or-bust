/* Bake or Bust! — canvas particles, floating text, screen shake. Coordinates are in stage space (1280x720). */
(function () {
  'use strict';
  const FX = (window.FX = {});
  const parts = [];
  let canvas, ctx, scale = 1, dpr = 1;
  let shakeAmt = 0;

  FX.attach = function (c) { canvas = c; ctx = c.getContext('2d'); };
  FX.resize = function (s, width = 1280, height = 720) {
    scale = s; dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(width * s * dpr); canvas.height = Math.round(height * s * dpr);
  };

  FX.burst = function (x, y, o) {
    o = o || {};
    const n = o.n || 16;
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || 1) : Math.random() * Math.PI * 2;
      const sp = (o.speed || 200) * (0.4 + Math.random() * 0.8);
      parts.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        g: o.gravity == null ? 400 : o.gravity,
        life: (o.life || 0.9) * (0.6 + Math.random() * 0.6), age: 0,
        size: (o.size || 6) * (0.6 + Math.random() * 0.8),
        color: Array.isArray(o.colors) ? o.colors[Math.floor(Math.random() * o.colors.length)] : (o.colors || '#ffc93c'),
        shape: o.shape || 'circle', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10,
        drag: o.drag == null ? 0.98 : o.drag, grow: o.grow || 0,
      });
    }
  };
  FX.smoke = function (x, y, n, dark) {
    FX.burst(x, y, { n: n || 10, colors: dark ? ['#3a3330', '#4a4440', '#2a2522'] : ['#d9d2cb', '#ece5df', '#c7c0ba'], speed: 60, gravity: -60, life: 1.6, size: 16, shape: 'smoke', grow: 18, angle: -Math.PI / 2, spread: 1.2, drag: 0.96 });
  };
  FX.confetti = function (x, y, n) {
    FX.burst(x, y, { n: n || 60, colors: ['#ffc93c', '#e8403a', '#7b4bc4', '#8bd673', '#a6dcf7', '#ff8fa3'], speed: 520, gravity: 600, life: 1.8, size: 9, shape: 'rect', angle: -Math.PI / 2, spread: 2.2, drag: 0.97 });
  };
  FX.sparks = function (x, y, n) {
    FX.burst(x, y, { n: n || 14, colors: ['#ffd23f', '#ff9a2a', '#fff3b0'], speed: 260, gravity: 300, life: 0.7, size: 4, shape: 'spark' });
  };
  FX.feathers = function (x, y, n) {
    FX.burst(x, y, { n: n || 8, colors: ['#fff8ec', '#f6e4c6', '#ffffff'], speed: 160, gravity: 60, life: 2.2, size: 10, shape: 'feather', drag: 0.95 });
  };
  FX.magic = function (x, y, n) {
    FX.burst(x, y, { n: n || 18, colors: ['#b48cf2', '#ffc93c', '#fff', '#7bd88f'], speed: 180, gravity: -40, life: 1.1, size: 5, shape: 'star', drag: 0.94 });
  };

  FX.shake = function (amt) { shakeAmt = Math.max(shakeAmt, amt); };

  // Floating text lives in the DOM (crisper, styled with CSS).
  FX.float = function (x, y, text, cls) {
    const layer = document.getElementById('floaters');
    if (!layer) return;
    const el = document.createElement('div');
    el.className = 'floater ' + (cls || '');
    el.textContent = text;
    if (document.documentElement.classList.contains('compact-ui')) {
      const stage = document.getElementById('stage');
      x = stage.clientWidth / 2;
      y = Math.max(50, Math.min(stage.clientHeight - 100, y));
    }
    el.style.left = x + 'px'; el.style.top = y + 'px';
    layer.appendChild(el);
    setTimeout(() => el.remove(), 1300);
  };

  function star(c, r) {
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath(); c.fill();
  }

  FX.update = function (dt, screenEl) {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const k = scale * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age >= p.life) { parts.splice(i, 1); continue; }
      p.vx *= Math.pow(p.drag, dt * 60); p.vy *= Math.pow(p.drag, dt * 60);
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const f = 1 - p.age / p.life;
      const size = p.size + p.grow * (p.age / p.life);
      ctx.globalAlpha = p.shape === 'smoke' ? f * 0.7 : Math.min(1, f * 1.6);
      ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      if (p.shape === 'rect') ctx.fillRect(-size / 2, -size / 4, size, size / 2);
      else if (p.shape === 'star') star(ctx, size);
      else if (p.shape === 'spark') { ctx.fillRect(-size, -1, size * 2, 2); }
      else if (p.shape === 'feather') { ctx.beginPath(); ctx.ellipse(0, 0, size, size * 0.32, 0, 0, 7); ctx.fill(); ctx.strokeStyle = 'rgba(59,36,24,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-size, 0); ctx.lineTo(size, 0); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(0, 0, size, 0, 7); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (screenEl) {
      if (shakeAmt > 0.3) {
        screenEl.style.transform = 'translate(' + ((Math.random() - 0.5) * shakeAmt).toFixed(1) + 'px,' + ((Math.random() - 0.5) * shakeAmt).toFixed(1) + 'px)';
        shakeAmt *= Math.pow(0.02, dt);
      } else if (shakeAmt) { shakeAmt = 0; screenEl.style.transform = ''; }
    }
  };
})();
