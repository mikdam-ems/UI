/* Sotto — the rail of umbrellas + the umbrella-stand cart.
   All card umbrellas are drawn by ONE fixed, click-through WebGL canvas using scissor viewports
   over each card's media box. "Put it in your stand" flies the real 3D umbrella into the stand. */
(function () {
  const S = (window.Sotto = window.Sotto || {});
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const outBack = t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

  const PRODUCTS = [
    { id: 'notte', price: 320, ribs: 12, a: '#1b2442', handle: '#6a3c1e', type: 'crook' },
    { id: 'bottiglia', price: 280, ribs: 8, a: '#1f4a35', handle: '#c9a066', type: 'crook' },
    { id: 'rubino', price: 360, ribs: 8, a: '#a8121c', handle: '#2a1a10', type: 'crook' },
    { id: 'nebbia', price: 240, ribs: 10, a: '#6f747c', handle: '#d8c3a0', type: 'straight' },
    { id: 'ocra', price: 290, ribs: 8, a: '#c48a2c', handle: '#3e2414', type: 'crook' },
    { id: 'prugna', price: 340, ribs: 12, a: '#4a1f3c', handle: '#17110f', type: 'crook' },
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const fmt = n => '€' + n;

  /* ------------------------------------------------------------ cards */
  const grid = $('#grid');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="card" data-id="${p.id}" style="--c:${p.a}">
      <div class="media"><span class="rail" aria-hidden="true"></span><span class="ribs" data-ribs="${p.ribs}"></span></div>
      <div class="info">
        <div class="row"><h3 data-name></h3><span class="price">${fmt(p.price)}</span></div>
        <p data-desc></p>
        <div class="actions">
          <button type="button" class="btn-ghost" data-open aria-pressed="false"></button>
          <button type="button" class="btn-solid" data-add></button>
        </div>
      </div>
    </article>`).join('');
  function cardText() {
    grid.querySelectorAll('.card').forEach(c => {
      const id = c.dataset.id, it = items.find(i => i.p.id === id);
      c.querySelector('[data-name]').textContent = S.t('p.' + id);
      c.querySelector('[data-desc]').textContent = S.t('p.' + id + '.d');
      c.querySelector('.ribs').textContent = S.t('card.ribs', { n: byId[id].ribs });
      c.querySelector('[data-open]').textContent = S.t(it && it.open ? 'card.close' : 'card.open');
      c.querySelector('[data-add]').textContent = S.t('card.add');
    });
  }

  /* ------------------------------------------------------------ cart / stand */
  const cart = [];
  const standBtn = $('#stand'), standHandles = $('#stand-handles'), countEl = $('#stand-count');
  const drawer = $('#drawer'), list = $('#drawer-list'), totalEl = $('#drawer-total');
  function handleSVG(p, i, fresh) {
    const x = 30 + (i % 6) * 8 + (i >= 6 ? 4 : 0);
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = p.type === 'straight' ? `M${x} 80 L${x} 22` : `M${x} 80 L${x} 24 a7 7 0 0 1 14 0 l0 4`;
    g.setAttribute('d', d);
    g.setAttribute('stroke', p.handle);
    g.setAttribute('class', 'h' + (fresh ? ' fresh' : ''));
    if (p.type === 'straight') {
      const k = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      k.setAttribute('cx', x); k.setAttribute('cy', 21); k.setAttribute('r', 4.2); k.setAttribute('fill', '#c9a35a');
      k.setAttribute('class', 'h' + (fresh ? ' fresh' : ''));
      return [g, k];
    }
    return [g];
  }
  function renderCart(freshIndex) {
    standHandles.innerHTML = '';
    cart.forEach((id, i) => handleSVG(byId[id], i, i === freshIndex).forEach(n => standHandles.appendChild(n)));
    countEl.textContent = cart.length;
    standBtn.classList.toggle('has', cart.length > 0);
    standBtn.setAttribute('aria-label', S.t('stand.aria', { n: cart.length }));
    list.innerHTML = cart.length ? cart.map((id, i) => `
      <li><span class="sw" style="--c:${byId[id].a}"></span>
        <span class="nm">${S.t('p.' + id)}<small>${S.t('card.ribs', { n: byId[id].ribs })}</small></span>
        <span class="pr">${fmt(byId[id].price)}</span>
        <button type="button" data-rm="${i}">${S.t('stand.remove')}</button></li>`).join('')
      : `<li class="empty">${S.t('stand.empty')}</li>`;
    totalEl.textContent = fmt(cart.reduce((s, id) => s + byId[id].price, 0));
  }
  list.addEventListener('click', e => {
    const b = e.target.closest('[data-rm]');
    if (!b) return;
    cart.splice(+b.dataset.rm, 1);
    renderCart();
  });
  const openDrawer = () => { drawer.hidden = false; requestAnimationFrame(() => drawer.classList.add('open')); $('#drawer .x').focus(); };
  const closeDrawer = () => { drawer.classList.remove('open'); setTimeout(() => { drawer.hidden = true; }, 300); standBtn.focus(); };
  standBtn.addEventListener('click', openDrawer);
  $('#drawer .x').addEventListener('click', closeDrawer);
  $('#drawer .scrim').addEventListener('click', closeDrawer);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) closeDrawer(); });
  $('#checkout').addEventListener('click', () => toast(S.t('stand.demo')));

  let toastT;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }
  function landed(p) {
    cart.push(p.id);
    renderCart(cart.length - 1);
    standBtn.classList.remove('wobble'); void standBtn.offsetWidth; standBtn.classList.add('wobble');
    splash();
    S.sound && S.sound.thunk();
    toast(S.t('toast.added', { name: S.t('p.' + p.id) }));
  }
  function splash() {
    if (reduce) return;
    const r = standBtn.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const d = document.createElement('i');
      d.className = 'drip';
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 30 + Math.random() * 40;
      d.style.left = r.left + r.width / 2 + 'px'; d.style.top = r.top + r.height * 0.3 + 'px';
      d.style.setProperty('--dx', Math.cos(ang) * v + 'px'); d.style.setProperty('--dy', Math.sin(ang) * v + 'px');
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 700);
    }
  }

  /* ------------------------------------------------------------ WebGL rail */
  const canvas = $('#shop-gl');
  let renderer = null;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) { renderer = null; }

  const items = [];
  let scene, cam, fcam;
  if (renderer) {
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    fcam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x000000, 0);
    scene.environment = window.SottoEnv(renderer, false);
    const key = new THREE.DirectionalLight(0xfff1dc, 2.2); key.position.set(2, 3, 4);
    const fill = new THREE.DirectionalLight(0xdfe8ff, 0.7); fill.position.set(-3, 1, 2);
    scene.add(key, fill, new THREE.HemisphereLight(0xffffff, 0xd8cbb4, 0.5));
    cam.position.set(0, 0, 5.6); fcam.position.set(0, 0, 10);
  }

  grid.querySelectorAll('.card').forEach(card => {
    const p = byId[card.dataset.id];
    const it = { p, card, media: card.querySelector('.media'), hover: 0, hoverT: 0, open: false, openT: 0, mx: 0.5, spin: 0, rehang: 1, flight: null, lastHover: -1 };
    items.push(it);
    if (renderer) {
      it.um = window.SottoUmbrella({ ribs: p.ribs, a: p.a, handle: p.handle, handleType: p.type, U: 10, V: 26 });
      it.inv = new THREE.Group(); it.holder = new THREE.Group();
      it.inv.add(it.um.group); it.holder.add(it.inv); scene.add(it.holder);
      it.holder.visible = false;
      it.um.setOpen(0);
    }
    it.media.addEventListener('pointerenter', () => { it.hover = 1; });
    it.media.addEventListener('pointerleave', () => { it.hover = 0; it.mx = 0.5; });
    it.media.addEventListener('pointermove', e => { const r = it.media.getBoundingClientRect(); it.mx = (e.clientX - r.left) / r.width; });
    card.addEventListener('focusin', () => { it.hover = 1; });
    card.addEventListener('focusout', () => { it.hover = 0; });
    const openBtn = card.querySelector('[data-open]');
    openBtn.addEventListener('click', () => {
      it.open = !it.open;
      openBtn.setAttribute('aria-pressed', it.open);
      openBtn.textContent = S.t(it.open ? 'card.close' : 'card.open');
      if (reduce) it.openT = it.open ? 1 : 0;
    });
    card.querySelector('[data-add]').addEventListener('click', () => addToStand(it));
  });

  function standMouth() {
    const r = standBtn.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * (40 / 130), w: r.width };
  }
  function addToStand(it) {
    if (it.flight) return;
    if (!renderer || reduce) { landed(it.p); return; }
    const r = it.media.getBoundingClientRect();
    const hpx = r.height * 0.766;
    it.flight = { t: 0, start: performance.now(), x0: r.left + r.width / 2, y0: r.top + r.height / 2, h0: hpx, startOpen: it.openT };
    it.open = false; it.card.querySelector('[data-open]').setAttribute('aria-pressed', 'false');
    it.card.querySelector('[data-open]').textContent = S.t('card.open');
    it.card.classList.add('empty');
  }

  /* placement helpers for the full-screen flight camera */
  function worldAt(sx, sy) {
    const hh = Math.tan(THREE.MathUtils.degToRad(fcam.fov / 2)) * 10, hw = hh * fcam.aspect;
    return [(sx / innerWidth * 2 - 1) * hw, -(sy / innerHeight * 2 - 1) * hh, hh];
  }

  // pose for a card: closed = inverted (handle up, tip down); open = upright, 3/4 view
  function poseCard(it, dt, time) {
    const k = 1 - Math.exp(-dt * 7);
    it.hoverT += (it.hover - it.hoverT) * k;
    const target = it.open ? 1 : 0;
    it.openT += (target - it.openT) * (1 - Math.exp(-dt * (reduce ? 60 : 3.6)));
    const o = it.openT, e = easeIO(o);
    it.inv.rotation.set(lerp(0, 0.42, e), 0, lerp(Math.PI, 0, e));
    it.inv.position.y = lerp(-0.93, 0.55, e);
    it.holder.scale.setScalar(lerp(1, 0.78, e));
    it.spin += dt * (0.35 * it.hoverT + 0.25 * e) * (reduce ? 0 : 1);
    it.holder.rotation.set(0, it.spin, (it.mx - 0.5) * -0.35 * it.hoverT * (1 - e));
    // re-hang after a flight: drops in from above with a little bounce
    if (it.rehang < 1) it.rehang = Math.min(1, it.rehang + dt / 0.75);
    const rh = reduce ? 1 : outBack(it.rehang);
    it.holder.position.set(0, 0.12 * it.hoverT * (1 - e) + (1 - rh) * 3, 0);
    const openness = clamp((o - 0.25) / 0.75, 0, 1);
    if (Math.abs(it.hoverT - it.lastHover) > 0.03) { it.um.setHover(it.hoverT); it.lastHover = it.hoverT; }
    it.um.setOpen(openness + 0.04 * it.hoverT * (1 - e), time);
  }

  let last = performance.now(), time = 0;
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
    requestAnimationFrame(loop);
    if (!renderer) return;
    const W = innerWidth, H = innerHeight;
    if (canvas.width !== Math.round(W * renderer.getPixelRatio()) || canvas.height !== Math.round(H * renderer.getPixelRatio())) renderer.setSize(W, H, false);

    const flying = items.filter(i => i.flight);
    const visible = items.filter(i => { const r = i.media.getBoundingClientRect(); i.rect = r; return r.bottom > 0 && r.top < H && r.right > 0 && r.left < W; });
    if (!visible.length && !flying.length) { if (canvas.dataset.drawn) { renderer.setScissorTest(false); renderer.clear(); delete canvas.dataset.drawn; } return; }
    canvas.dataset.drawn = '1';
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, W, H);
    renderer.clear();

    // cards
    renderer.setScissorTest(true);
    items.forEach(i => { i.holder.visible = false; });
    visible.forEach(it => {
      if (it.flight) return;
      const r = it.rect;
      poseCard(it, dt, time);
      it.holder.visible = true;
      renderer.setViewport(r.left, H - r.bottom, r.width, r.height);
      renderer.setScissor(Math.max(0, r.left), Math.max(0, H - r.bottom), r.width, r.height);
      cam.aspect = r.width / r.height;
      cam.position.z = cam.aspect < 0.62 ? 5.6 * (0.62 / cam.aspect) : 5.6;
      cam.updateProjectionMatrix();
      renderer.render(scene, cam);
      it.holder.visible = false;
    });
    renderer.setScissorTest(false);

    // flights — real 3D umbrella arcs from the card into the stand
    if (flying.length) {
      renderer.setViewport(0, 0, W, H);
      fcam.aspect = W / H; fcam.updateProjectionMatrix();
      flying.forEach(it => {
        const f = it.flight;
        f.t = Math.min(1, (now - f.start) / 1050);
        const m = standMouth();
        const h1 = Math.max(70, m.w * 1.45);
        const t = f.t;
        let sx, sy, hpx, squash = 1, tilt = 0, spinY = 0;
        const ax = f.x0, ay = f.y0, bx = m.x, by = m.y - h1 / 2;
        if (t < 0.14) { // anticipation crouch
          const u = t / 0.14;
          sx = ax; sy = ay + Math.sin(u * Math.PI) * 6; hpx = f.h0; squash = 1 - Math.sin(u * Math.PI) * 0.1;
        } else if (t < 0.8) { // arc
          const u = easeIO((t - 0.14) / 0.66);
          const cx = (ax + bx) / 2, cy = Math.max(110, Math.min(ay, by) - H * 0.32);
          sx = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * cx + u * u * bx;
          sy = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * cy + u * u * by;
          hpx = lerp(f.h0, h1, u);
          tilt = Math.sin(u * Math.PI) * 0.9 * (bx > ax ? -1 : 1);
          spinY = u * Math.PI * 4;
          squash = 1 + Math.sin(u * Math.PI) * 0.06;
        } else { // drop into the stand
          const u = (t - 0.8) / 0.2, e = u * u;
          sx = bx; sy = by + e * (h1 - 20); hpx = h1;
          squash = 1 - Math.sin(u * Math.PI) * 0.05;
        }
        const [wx, wy, hh] = worldAt(sx, sy);
        const s = (hpx / H * 2 * hh) / 2.3;
        it.inv.rotation.set(0, 0, Math.PI); it.inv.position.y = -0.93;
        it.holder.position.set(wx, wy, 0);
        it.holder.rotation.set(0, spinY, tilt);
        it.holder.scale.set(s / squash ** 0.5, s * squash, s / squash ** 0.5);
        it.um.setOpen(f.startOpen * (1 - clamp(t / 0.5, 0, 1)), time);
        it.holder.visible = true;
        renderer.render(scene, fcam);
        it.holder.visible = false;
        if (f.t >= 1) {
          it.flight = null; it.openT = 0; it.rehang = 0; it.spin = 0;
          it.card.classList.remove('empty');
          landed(it.p);
        }
      });
    }
  }
  requestAnimationFrame(loop);

  S.onLang(() => { cardText(); renderCart(); S.refreshStory && S.refreshStory(); });
  cardText(); renderCart();
})();
