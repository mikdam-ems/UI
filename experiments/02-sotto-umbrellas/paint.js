/* Sotto — generative 2D paintings used as WebGL backdrops.
   SottoPaint.street({ sharp }) → canvas : rainy arcade at night, the Sotto shop in the centre arch.
   SottoPaint.interior()        → canvas : wood-panelled umbrella shop, one-point perspective.
   Both are 2048×1152; the story shader "covers" them onto any viewport. */
(function () {
  const W = 2048, H = 1152;

  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function canvas(w = W, h = H) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  // Cross-browser blur: repeated down/up sampling (ctx.filter is not everywhere).
  function blurCanvas(src, factor, passes) {
    let cur = src;
    for (let p = 0; p < passes; p++) {
      const sm = canvas(Math.max(1, Math.round(src.width / factor)), Math.max(1, Math.round(src.height / factor)));
      const sx = sm.getContext('2d');
      sx.imageSmoothingQuality = 'high';
      sx.drawImage(cur, 0, 0, sm.width, sm.height);
      const big = canvas(src.width, src.height);
      const bx = big.getContext('2d');
      bx.imageSmoothingQuality = 'high';
      bx.drawImage(sm, 0, 0, big.width, big.height);
      cur = big;
    }
    return cur;
  }
  function glow(ctx, x, y, r, color, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color.replace('A', a));
    g.addColorStop(1, color.replace('A', 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function grain(ctx, amt, seed) {
    const r = rng(seed), n = canvas(256, 256), nx = n.getContext('2d');
    const img = nx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = r() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    nx.putImageData(img, 0, 0);
    ctx.save();
    ctx.globalAlpha = amt; ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(n, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ STREET */
  // Light sources shared by the sharp and bokeh passes.
  const r0 = rng(7);
  const LIGHTS = [];
  [[0.2, 0.43], [0.5, 0.41], [0.8, 0.43], [0.06, 0.47], [0.94, 0.47]].forEach(([x, y]) => LIGHTS.push({ x: x * W, y: y * H, r: 1, c: '255,196,120', k: 1 }));
  for (let i = 0; i < 46; i++) {
    LIGHTS.push({ x: r0() * W, y: (0.16 + r0() * 0.6) * H, r: 0.35 + r0() * 0.8, c: r0() < 0.8 ? '255,190,110' : (r0() < 0.5 ? '255,236,200' : '140,180,255'), k: 0.25 + r0() * 0.5 });
  }

  function street(opts) {
    const sharp = !!(opts && opts.sharp);
    const c = canvas(), x = c.getContext('2d'), r = rng(11);

    // night facade
    let g = x.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#120c0a'); g.addColorStop(0.35, '#2a1810'); g.addColorStop(0.75, '#1a100b'); g.addColorStop(1, '#0b0807');
    x.fillStyle = g; x.fillRect(0, 0, W, H);

    // upper-floor windows with shutters
    for (let row = 0; row < 2; row++) for (let i = 0; i < 9; i++) {
      const wx = (i + 0.5) * (W / 9) - 46, wy = 40 + row * 150, lit = r() < 0.35;
      x.fillStyle = '#3a2216'; x.fillRect(wx - 30, wy - 8, 152, 128);
      x.fillStyle = lit ? '#a8642a' : '#1a100b'; x.fillRect(wx, wy, 92, 110);
      if (lit) { glow(x, wx + 46, wy + 55, 120, 'rgba(255,170,80,A)', 0.25); }
      x.fillStyle = '#4a2a1a'; x.fillRect(wx - 26, wy, 22, 110); x.fillRect(wx + 96, wy, 22, 110);
    }
    // cornice
    x.fillStyle = '#3b2317'; x.fillRect(0, 336, W, 26);
    x.fillStyle = '#4e2f1f'; x.fillRect(0, 336, W, 6);

    // arcade (portico) — columns at these centres
    const cols = [0.07, 0.335, 0.665, 0.93].map(v => v * W), colW = 92, springY = 0.47 * H, baseY = 0.8 * H;
    // recessed interior of the portico
    g = x.createLinearGradient(0, 360, 0, baseY);
    g.addColorStop(0, '#1d120c'); g.addColorStop(1, '#2b1a10');
    x.fillStyle = g; x.fillRect(0, 362, W, baseY - 362);

    // shop fronts behind the side arches
    const shop = (x0, x1, warm) => {
      x.fillStyle = '#140c08'; x.fillRect(x0, 0.52 * H, x1 - x0, baseY - 0.52 * H);
      g = x.createLinearGradient(0, 0.56 * H, 0, baseY);
      g.addColorStop(0, warm); g.addColorStop(1, '#3a200f');
      x.fillStyle = g; x.fillRect(x0 + 20, 0.56 * H, x1 - x0 - 40, baseY - 0.58 * H);
    };
    shop(cols[0] + 120, cols[1] - 120, '#8a5424');
    shop(cols[2] + 120, cols[3] - 120, '#7a4a20');

    // ---- the Sotto shop in the centre arch
    const sx0 = cols[1] + 90, sx1 = cols[2] - 90, cx = W / 2;
    x.fillStyle = '#0e0806'; x.fillRect(sx0, 0.5 * H, sx1 - sx0, baseY - 0.5 * H);
    // fascia + brass sign
    x.fillStyle = '#16231d'; x.fillRect(sx0 + 10, 0.515 * H, sx1 - sx0 - 20, 70);
    x.fillStyle = '#c9a35a'; x.fillRect(sx0 + 10, 0.515 * H, sx1 - sx0 - 20, 3); x.fillRect(sx0 + 10, 0.515 * H + 67, sx1 - sx0 - 20, 3);
    x.save();
    x.font = 'italic 600 54px "Cormorant Garamond", Georgia, serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.shadowColor = 'rgba(255,200,120,.9)'; x.shadowBlur = 18;
    x.fillStyle = '#f2d39a';
    x.fillText('S O T T O', cx, 0.515 * H + 36);
    x.restore();
    // windows either side of the door
    const winY = 0.58 * H, winH = baseY - winY - 24;
    const win = (x0, w) => {
      g = x.createLinearGradient(0, winY, 0, winY + winH);
      g.addColorStop(0, '#ffdc96'); g.addColorStop(0.6, '#f0a85a'); g.addColorStop(1, '#a8602a');
      x.fillStyle = g; x.fillRect(x0, winY, w, winH);
      // display: little open umbrellas on shelves + hanging closed ones
      const cs = ['#b3121b', '#1f2b47', '#2f5d43', '#e8a33d', '#6d1f3a', '#202024', '#d9c7a4'];
      for (let row = 0; row < 2; row++) for (let i = 0; i < 4; i++) {
        const ux = x0 + 40 + i * ((w - 80) / 3), uy = winY + 70 + row * 95, ur = 34;
        x.fillStyle = cs[(i + row * 3) % cs.length];
        x.beginPath(); x.ellipse(ux, uy, ur, ur * 0.62, 0, Math.PI, 0); x.fill();
        x.strokeStyle = '#3a2a1a'; x.lineWidth = 3;
        x.beginPath(); x.moveTo(ux, uy); x.lineTo(ux, uy + 40); x.stroke();
      }
      x.fillStyle = 'rgba(80,40,10,.5)'; x.fillRect(x0, winY + 115, w, 5); x.fillRect(x0, winY + 210, w, 5);
      x.strokeStyle = '#1a120c'; x.lineWidth = 10; x.strokeRect(x0, winY, w, winH);
    };
    const doorW = 150;
    win(sx0 + 22, cx - doorW / 2 - sx0 - 44);
    win(cx + doorW / 2 + 22, sx1 - cx - doorW / 2 - 44);
    // glazed door
    g = x.createLinearGradient(0, winY, 0, baseY);
    g.addColorStop(0, '#f6c77e'); g.addColorStop(1, '#8a4e22');
    x.fillStyle = g; x.fillRect(cx - doorW / 2, winY - 10, doorW, baseY - winY + 10);
    x.strokeStyle = '#1a120c'; x.lineWidth = 12; x.strokeRect(cx - doorW / 2, winY - 10, doorW, baseY - winY + 10);
    x.fillStyle = '#c9a35a'; x.fillRect(cx + doorW / 2 - 30, winY + 120, 8, 40);
    glow(x, cx, 0.66 * H, 420, 'rgba(255,190,110,A)', 0.35);

    // columns + arches over everything
    x.fillStyle = '#2e1b11';
    cols.forEach(cxx => { x.fillRect(cxx - colW / 2, springY - 20, colW, baseY - springY + 20); });
    x.fillStyle = '#3d2417';
    cols.forEach(cxx => { x.fillRect(cxx - colW / 2 - 10, springY - 34, colW + 20, 22); x.fillRect(cxx - colW / 2 - 6, baseY - 30, colW + 12, 30); });
    // arch spandrels: fill wall between arches above spring line
    x.fillStyle = '#251610';
    for (let i = 0; i < cols.length - 1; i++) {
      const a = cols[i] + colW / 2, b = cols[i + 1] - colW / 2, rx = (b - a) / 2, mid = (a + b) / 2;
      x.beginPath();
      x.moveTo(a, 362); x.lineTo(b, 362); x.lineTo(b, springY - 20);
      x.ellipse(mid, springY - 20, rx, rx * 0.55, 0, 0, Math.PI, true);
      x.lineTo(a, 362); x.fill();
      x.strokeStyle = '#4a2c1c'; x.lineWidth = 8;
      x.beginPath(); x.ellipse(mid, springY - 20, rx, rx * 0.55, 0, Math.PI, 0); x.stroke();
    }
    x.fillRect(0, 362, cols[0] - colW / 2, springY - 380); x.fillRect(cols[3] + colW / 2, 362, W, springY - 380);
    // lanterns hanging in each arch
    LIGHTS.slice(0, 5).forEach(l => {
      x.strokeStyle = '#0c0705'; x.lineWidth = 3;
      x.beginPath(); x.moveTo(l.x, l.y - 120); x.lineTo(l.x, l.y - 18); x.stroke();
      x.fillStyle = '#ffe2a8'; x.beginPath(); x.ellipse(l.x, l.y, 12, 18, 0, 0, Math.PI * 2); x.fill();
      glow(x, l.x, l.y, 140, 'rgba(255,190,110,A)', 0.55);
    });

    // wet street with long reflections
    g = x.createLinearGradient(0, baseY, 0, H);
    g.addColorStop(0, '#22140c'); g.addColorStop(1, '#0a0605');
    x.fillStyle = g; x.fillRect(0, baseY, W, H - baseY);
    x.save();
    x.globalCompositeOperation = 'lighter';
    const refl = (rx, w, a, col) => {
      g = x.createLinearGradient(0, baseY, 0, H);
      g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      x.fillStyle = g; x.fillRect(rx - w / 2, baseY, w, H - baseY);
    };
    refl(cx, sx1 - sx0 - 60, 0.32, '255,170,80');
    refl(cx, doorW, 0.35, '255,200,120');
    refl((cols[0] + cols[1]) / 2, 260, 0.16, '255,160,70');
    refl((cols[2] + cols[3]) / 2, 260, 0.14, '255,160,70');
    LIGHTS.slice(0, 5).forEach(l => refl(l.x, 26, 0.3, '255,200,130'));
    x.restore();
    // cobble hints
    x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1.5;
    for (let i = 0; i < 12; i++) { const yy = baseY + 20 + i * i * 0.5 + i * 8; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }

    let out = c;
    if (!sharp) {
      out = blurCanvas(c, 10, 2);
      const ox = out.getContext('2d');
      // bokeh discs
      ox.save(); ox.globalCompositeOperation = 'lighter';
      LIGHTS.forEach(l => {
        const R = (sharp ? 6 : 26 + l.r * 34);
        const g2 = ox.createRadialGradient(l.x, l.y, R * 0.6, l.x, l.y, R);
        g2.addColorStop(0, `rgba(${l.c},${0.32 * l.k})`); g2.addColorStop(0.85, `rgba(${l.c},${0.4 * l.k})`); g2.addColorStop(1, `rgba(${l.c},0)`);
        ox.fillStyle = g2; ox.beginPath(); ox.arc(l.x, l.y, R, 0, Math.PI * 2); ox.fill();
      });
      ox.restore();
    } else {
      x.save(); x.globalCompositeOperation = 'lighter';
      LIGHTS.slice(5).forEach(l => glow(x, l.x, l.y, 22 * l.r + 6, `rgba(${l.c},A)`, 0.5 * l.k));
      x.restore();
    }
    const ox = out.getContext('2d');
    // haze + vignette
    g = ox.createRadialGradient(W / 2, H * 0.6, H * 0.2, W / 2, H * 0.55, W * 0.7);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.55)');
    ox.fillStyle = g; ox.fillRect(0, 0, W, H);
    grain(ox, 0.06, 3);
    return out;
  }

  /* ---------------------------------------------------------------- INTERIOR */
  // Camera at origin looking down +Z. Room: X∈[-3,3], Y∈[-1.6,1.9], Z∈[1,4.6]
  const F = 410, VPX = W / 2, VPY = H * 0.44;
  const P = (X, Y, Z) => [VPX + (F * X) / Z, VPY - (F * Y) / Z];
  function poly(ctx, pts, fill) {
    ctx.beginPath();
    pts.forEach((p, i) => { const [sx, sy] = P(p[0], p[1], p[2]); i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy); });
    ctx.closePath();
    ctx.fillStyle = fill; ctx.fill();
  }
  function line(ctx, a, b, stroke, w) {
    const [x1, y1] = P(...a), [x2, y2] = P(...b);
    ctx.strokeStyle = stroke; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function interior() {
    const c = canvas(), x = c.getContext('2d'), r = rng(23);
    const XL = -3, XR = 3, YF = -1.6, YC = 1.9, ZN = 0.8, ZB = 4.6;

    // ceiling
    let [ax, ay] = P(0, YC, ZB);
    let g = x.createLinearGradient(0, 0, 0, ay);
    g.addColorStop(0, '#d9c8a6'); g.addColorStop(1, '#a88a62');
    poly(x, [[XL, YC, ZN], [XR, YC, ZN], [XR, YC, ZB], [XL, YC, ZB]], g);
    for (let z = 1.2; z < ZB; z += 0.55) line(x, [XL, YC, z], [XR, YC, z], 'rgba(90,60,30,.35)', 3);
    line(x, [0, YC, ZN], [0, YC, ZB], 'rgba(90,60,30,.25)', 2);

    // floor — warm terrazzo
    [ax, ay] = P(0, YF, ZB);
    g = x.createLinearGradient(0, ay, 0, H);
    g.addColorStop(0, '#9b7d5c'); g.addColorStop(1, '#d6c0a0');
    poly(x, [[XL, YF, ZN], [XR, YF, ZN], [XR, YF, ZB], [XL, YF, ZB]], g);
    const cols = ['#7a5a3a', '#efe3cf', '#5a3a28', '#b08060', '#3a2a20'];
    for (let i = 0; i < 14000; i++) {
      const X = XL + r() * 6, Z = ZN + 0.15 + r() * (ZB - ZN), [px, py] = P(X, YF, Z);
      if (py > H) continue;
      x.fillStyle = cols[(r() * cols.length) | 0];
      const s = (F * (0.0025 + r() * 0.006)) / Z;
      x.globalAlpha = 0.55; x.fillRect(px, py, s * 1.5, s * 0.75); x.globalAlpha = 1;
    }

    // left wall — dark mahogany panelling
    [ax, ay] = P(XL, 0, ZB);
    g = x.createLinearGradient(0, 0, ax, 0);
    g.addColorStop(0, '#2c140a'); g.addColorStop(1, '#5a2e18');
    poly(x, [[XL, YC, ZN], [XL, YC, ZB], [XL, YF, ZB], [XL, YF, ZN]], g);
    // right wall
    [ax] = P(XR, 0, ZB);
    g = x.createLinearGradient(W, 0, ax, 0);
    g.addColorStop(0, '#2a1309'); g.addColorStop(1, '#5c3019');
    poly(x, [[XR, YC, ZN], [XR, YC, ZB], [XR, YF, ZB], [XR, YF, ZN]], g);
    // panel grooves on both walls
    for (let z = 1.0; z < ZB; z += 0.36) {
      line(x, [XL, YC, z], [XL, YF, z], 'rgba(0,0,0,.28)', (F * 0.012) / z);
      line(x, [XR, YC, z], [XR, YF, z], 'rgba(0,0,0,.28)', (F * 0.012) / z);
      line(x, [XL, YC, z + 0.02], [XL, YF, z + 0.02], 'rgba(255,190,130,.06)', (F * 0.008) / z);
    }
    [[-0.45], [1.55]].forEach(([y]) => {
      line(x, [XL, y, ZN], [XL, y, ZB], '#3a1c0e', 10); line(x, [XL, y + 0.03, ZN], [XL, y + 0.03, ZB], 'rgba(255,200,140,.18)', 3);
      line(x, [XR, y, ZN], [XR, y, ZB], '#3a1c0e', 10); line(x, [XR, y + 0.03, ZN], [XR, y + 0.03, ZB], 'rgba(255,200,140,.18)', 3);
    });

    // back wall with a bright doorway into the workshop
    poly(x, [[XL, YC, ZB], [XR, YC, ZB], [XR, YF, ZB], [XL, YF, ZB]], '#4a2614');
    const [dx0, dy0] = P(-0.75, 1.0, ZB), [dx1, dy1] = P(0.75, YF, ZB);
    g = x.createLinearGradient(0, dy0, 0, dy1);
    g.addColorStop(0, '#f6e7c8'); g.addColorStop(1, '#c8a676');
    x.fillStyle = g; x.fillRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    x.strokeStyle = '#2a140a'; x.lineWidth = 14; x.strokeRect(dx0, dy0, dx1 - dx0, dy1 - dy0);
    // window mullions + plant + desk through the doorway
    x.fillStyle = 'rgba(80,60,40,.35)';
    x.fillRect(dx0 + (dx1 - dx0) / 2 - 3, dy0, 6, (dy1 - dy0) * 0.55);
    x.fillRect(dx0, dy0 + (dy1 - dy0) * 0.28, dx1 - dx0, 5);
    x.fillStyle = '#5a3a22'; x.fillRect(dx0 + 30, dy0 + (dy1 - dy0) * 0.62, dx1 - dx0 - 60, 24);
    x.fillRect(dx0 + 40, dy0 + (dy1 - dy0) * 0.62, 10, (dy1 - dy0) * 0.38); x.fillRect(dx1 - 50, dy0 + (dy1 - dy0) * 0.62, 10, (dy1 - dy0) * 0.38);
    const pc = [dx0 + (dx1 - dx0) / 2, dy0 + (dy1 - dy0) * 0.52];
    for (let i = 0; i < 26; i++) {
      x.fillStyle = ['#4f6b3a', '#3c5530', '#6c8a4a'][i % 3];
      x.beginPath(); x.ellipse(pc[0] + (r() - 0.5) * 70, pc[1] + (r() - 0.6) * 60, 16, 8, r() * 3, 0, Math.PI * 2); x.fill();
    }
    x.fillStyle = '#c9a35a'; x.fillRect(pc[0] - 18, pc[1] + 10, 36, 30);
    glow(x, (dx0 + dx1) / 2, (dy0 + dy1) / 2, 420, 'rgba(255,230,180,A)', 0.35);

    // shelves of folded scarves on the right wall (upper)
    const shelfCols = ['#2b3a63', '#7b2030', '#2f5d43', '#c5a26a', '#3a3a40', '#8a4b2a', '#d8cdb8'];
    for (let s = 0; s < 4; s++) {
      const y = 1.45 - s * 0.36;
      line(x, [XR - 0.02, y, 1.6], [XR - 0.02, y, ZB - 0.2], '#2a1209', 7);
      for (let z = 1.75; z < ZB - 0.3; z += 0.26) {
        const top = y + 0.24, col = shelfCols[(s * 5 + Math.round(z * 7)) % shelfCols.length];
        poly(x, [[XR - 0.02, y + 0.01, z], [XR - 0.02, y + 0.01, z + 0.2], [XR - 0.02, top, z + 0.2], [XR - 0.02, top, z]], col);
        line(x, [XR - 0.02, y + 0.09, z], [XR - 0.02, y + 0.09, z + 0.2], 'rgba(0,0,0,.25)', 2);
        line(x, [XR - 0.02, y + 0.17, z], [XR - 0.02, y + 0.17, z + 0.2], 'rgba(255,255,255,.12)', 2);
      }
    }
    // glass counter on the right (lower)
    const cx0 = 2.15, cy1 = -0.55;
    poly(x, [[cx0, cy1, 1.35], [XR, cy1, 1.35], [XR, cy1, 4.0], [cx0, cy1, 4.0]], 'rgba(220,235,235,.28)');
    poly(x, [[cx0, YF, 1.35], [cx0, cy1, 1.35], [cx0, cy1, 4.0], [cx0, YF, 4.0]], '#3a1d0e');
    poly(x, [[cx0, -1.25, 1.4], [cx0, cy1 - 0.04, 1.4], [cx0, cy1 - 0.04, 3.95], [cx0, -1.25, 3.95]], 'rgba(255,236,200,.32)');
    for (let z = 1.55; z < 3.9; z += 0.18) {
      const [hx, hy] = P(cx0 + 0.02, -0.95, z), s = F / z;
      x.strokeStyle = ['#6b3f22', '#c98b5a', '#2a1a10', '#d9c7a4'][Math.round(z * 10) % 4];
      x.lineWidth = s * 0.03; x.lineCap = 'round';
      x.beginPath(); x.moveTo(hx, hy + s * 0.18); x.lineTo(hx, hy); x.arc(hx + s * 0.05, hy, s * 0.05, Math.PI, 0); x.stroke();
    }
    line(x, [cx0, cy1, 1.35], [cx0, cy1, 4.0], 'rgba(255,240,210,.6)', 3);
    // canes in a barrel near the right front
    const [bx, by] = P(2.45, YF, 1.25), bs = F / 1.25;
    for (let i = 0; i < 9; i++) {
      const hx = bx - bs * 0.16 + i * bs * 0.04, hy = by - bs * (0.85 + (i % 3) * 0.06);
      x.strokeStyle = ['#2a1a10', '#6b3f22', '#c98b5a'][i % 3]; x.lineWidth = bs * 0.025; x.lineCap = 'round';
      x.beginPath(); x.moveTo(hx, by - bs * 0.3); x.lineTo(hx, hy); x.arc(hx - bs * 0.045, hy, bs * 0.045, 0, Math.PI, true); x.stroke();
    }
    g = x.createLinearGradient(bx - bs * 0.22, 0, bx + bs * 0.22, 0);
    g.addColorStop(0, '#6a4a1c'); g.addColorStop(0.4, '#e2c27a'); g.addColorStop(1, '#5a3c16');
    x.fillStyle = g; x.fillRect(bx - bs * 0.22, by - bs * 0.38, bs * 0.44, bs * 0.38);
    x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(bx - bs * 0.22, by - bs * 0.3, bs * 0.44, bs * 0.02); x.fillRect(bx - bs * 0.22, by - bs * 0.1, bs * 0.44, bs * 0.02);

    // the umbrella wall: a brass rail of closed umbrellas on the left
    const uCols = ['#1f2b47', '#7b1a24', '#2f5d43', '#3a3a40', '#b3121b', '#22252b', '#5b6b7a', '#6d1f3a', '#2b4a5a', '#c5a26a', '#1a1a1d', '#41503a'];
    line(x, [XL + 0.12, 1.25, ZN], [XL + 0.12, 1.25, ZB - 0.1], '#c9a35a', 9);
    for (let z = ZB - 0.25, i = 0; z > 1.0; z -= 0.155, i++) {
      const X = XL + 0.2, s = F / z;
      const [hx, hy] = P(X, 1.25, z);
      const col = uCols[i % uCols.length];
      // hook handle
      x.strokeStyle = i % 3 ? '#4a2a14' : '#8a5a30'; x.lineWidth = s * 0.028; x.lineCap = 'round';
      x.beginPath(); x.arc(hx + s * 0.05, hy, s * 0.05, Math.PI, Math.PI * 2.2); x.stroke();
      x.beginPath(); x.moveTo(hx, hy); x.lineTo(hx, hy + s * 0.22); x.stroke();
      // furled canopy
      const top = hy + s * 0.22, len = s * 1.45, wmax = s * 0.075;
      g = x.createLinearGradient(hx - wmax, 0, hx + wmax, 0);
      g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(0.45, col); g.addColorStop(0.7, col); g.addColorStop(1, 'rgba(0,0,0,.45)');
      x.fillStyle = col;
      x.beginPath();
      x.moveTo(hx - wmax * 0.5, top);
      x.quadraticCurveTo(hx - wmax * 1.25, top + len * 0.35, hx - s * 0.006, top + len);
      x.lineTo(hx + s * 0.006, top + len);
      x.quadraticCurveTo(hx + wmax * 1.25, top + len * 0.35, hx + wmax * 0.5, top);
      x.closePath(); x.fill();
      x.fillStyle = g; x.fill();
      x.strokeStyle = 'rgba(0,0,0,.35)'; x.lineWidth = s * 0.004;
      x.beginPath(); x.moveTo(hx - wmax * 0.2, top + len * 0.1); x.quadraticCurveTo(hx - wmax * 0.3, top + len * 0.5, hx, top + len * 0.95); x.stroke();
      x.fillStyle = '#c9a35a'; x.fillRect(hx - s * 0.004, top + len, s * 0.008, s * 0.08);
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(hx - wmax * 0.9, top + len * 0.55, wmax * 1.8, s * 0.018);
    }
    // cabinet top along the left wall below the umbrellas
    poly(x, [[XL, -0.55, ZN], [XL + 0.35, -0.55, ZN], [XL + 0.35, -0.55, ZB - 0.2], [XL, -0.55, ZB - 0.2]], '#2a1209');

    // pendant lamps
    [1.6, 2.6, 3.6].forEach(z => {
      const lx = 0, ly = 1.15;
      line(x, [lx, YC, z], [lx, ly + 0.12, z], '#1a0f08', (F * 0.006) / z);
      const [px, py] = P(lx, ly, z), s = F / z;
      // pool of light on the floor
      const [fx, fy] = P(lx, YF, z);
      x.save(); x.globalCompositeOperation = 'lighter';
      x.fillStyle = (() => { const gg = x.createRadialGradient(fx, fy, 0, fx, fy, s * 1.3); gg.addColorStop(0, 'rgba(255,200,120,.18)'); gg.addColorStop(1, 'rgba(255,200,120,0)'); return gg; })();
      x.beginPath(); x.ellipse(fx, fy, s * 1.3, s * 0.35, 0, 0, Math.PI * 2); x.fill();
      glow(x, px, py + s * 0.05, s * 0.9, 'rgba(255,205,130,A)', 0.4);
      x.restore();
      g = x.createLinearGradient(px - s * 0.22, 0, px + s * 0.22, 0);
      g.addColorStop(0, '#6a4a1c'); g.addColorStop(0.35, '#f0d08a'); g.addColorStop(1, '#5a3c16');
      x.fillStyle = g;
      x.beginPath(); x.ellipse(px, py + s * 0.04, s * 0.22, s * 0.16, 0, Math.PI, 0); x.fill();
      x.fillStyle = '#fff4d8'; x.beginPath(); x.ellipse(px, py + s * 0.045, s * 0.2, s * 0.035, 0, 0, Math.PI * 2); x.fill();
    });

    // warm grade + vignette
    x.save(); x.globalCompositeOperation = 'soft-light';
    x.fillStyle = 'rgba(255,170,90,.25)'; x.fillRect(0, 0, W, H);
    x.restore();
    g = x.createRadialGradient(W / 2, H * 0.5, H * 0.35, W / 2, H * 0.5, W * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(10,4,0,.6)');
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    grain(x, 0.05, 9);
    return blurCanvas(c, 1.6, 1);
  }

  window.SottoPaint = { street, interior, W, H, project: P };
})();
