/* Sotto — scroll story: rain on the glass → under the umbrella → the shop sign → inside.
   One WebGL canvas: backdrop painting + 3D umbrella render to a target, then a "glass" pass
   adds live raindrops (refraction), falling rain and grain. */
(function () {
  const $ = s => document.querySelector(s);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const S = (window.Sotto = window.Sotto || {});

  const storyEl = $('#story'), stick = $('#story .stick'), canvas = $('#story-gl');
  const rtl = () => document.documentElement.dir === 'rtl';

  /* -------------------------------------------------------------- sound */
  S.sound = (function () {
    let ctx, gain, lp, on = false, dripT;
    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) { // pinkish noise
        const w = Math.random() * 2 - 1;
        b0 = 0.997 * b0 + w * 0.029; b1 = 0.985 * b1 + w * 0.032; b2 = 0.95 * b2 + w * 0.048;
        d[i] = (b0 + b1 + b2 + w * 0.06) * 0.6;
      }
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 300;
      lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 7000;
      gain = ctx.createGain(); gain.gain.value = 0;
      src.connect(hp).connect(lp).connect(gain).connect(ctx.destination);
      src.start();
    }
    function drip() {
      if (!on) return;
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.frequency.setValueAtTime(1400 + Math.random() * 1600, t);
      o.frequency.exponentialRampToValueAtTime(400, t + 0.06);
      g.gain.setValueAtTime(0.025 * (lp.frequency.value / 7000), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.1);
      dripT = setTimeout(drip, 60 + Math.random() * 260);
    }
    return {
      get on() { return on; },
      toggle() {
        if (!ctx) init();
        on = !on;
        if (ctx.state === 'suspended') ctx.resume();
        gain.gain.setTargetAtTime(on ? 0.5 : 0, ctx.currentTime, 0.3);
        clearTimeout(dripT); if (on) drip();
        return on;
      },
      inside(k) { if (lp) lp.frequency.setTargetAtTime(lerp(7000, 650, k), ctx.currentTime, 0.2); },
      thunk() {
        if (!on || !ctx) return;
        const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.25);
        g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + 0.4);
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.frequency.value = 1900; g2.gain.setValueAtTime(0.06, t + 0.02); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
        o2.connect(g2).connect(ctx.destination); o2.start(t + 0.02); o2.stop(t + 0.62);
      },
    };
  })();

  /* -------------------------------------------------------------- scroll */
  function storyLen() { return Math.max(1, storyEl.offsetHeight - innerHeight); }
  function rawP() { return clamp((scrollY - storyEl.offsetTop) / storyLen(), 0, 1); }
  S.goTo = function (p) {
    scrollTo({ top: storyEl.offsetTop + p * storyLen(), behavior: reduce ? 'auto' : 'smooth' });
  };

  // Chapter copy (DOM) — works even without WebGL
  const chaps = [...document.querySelectorAll('.chap')];
  const dots = [...document.querySelectorAll('.dots button')];
  dots.forEach(b => b.addEventListener('click', () => S.goTo(+b.dataset.p)));
  function applyText(p) {
    chaps.forEach(el => {
      const [a, b, c, d] = el.dataset.range.split(',').map(Number);
      const o = Math.min(seg(p, a, b), 1 - seg(p, c, d));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - o) * (p < (a + d) / 2 ? 24 : -24)).toFixed(1)}px)`;
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    });
    const marks = dots.map(b => +b.dataset.p);
    let cur = 0; marks.forEach((m, i) => { if (p >= m - 0.06) cur = i; });
    dots.forEach((b, i) => b.setAttribute('aria-current', i === cur ? 'step' : 'false'));
    document.documentElement.classList.toggle('in-shop', p > 0.7);
  }

  /* -------------------------------------------------------------- WebGL */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    if (!renderer.capabilities.isWebGL2) throw new Error('webgl2');
  } catch (e) {
    document.documentElement.classList.add('no-gl');
    const tick = () => { applyText(rawP()); requestAnimationFrame(tick); };
    tick();
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const fontReady = document.fonts ? Promise.race([
    document.fonts.load('italic 600 54px "Cormorant Garamond"'), new Promise(r => setTimeout(r, 1800)),
  ]) : Promise.resolve();

  fontReady.then(start);

  function start() {
    const P = window.SottoPaint;
    const tex = c => {
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      return t;
    };
    const tBlur = tex(P.street()), tSharp = tex(P.street({ sharp: true })), tIn = tex(P.interior());

    const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.PlaneGeometry(2, 2);
    const vert = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';

    // --- backdrop
    const bgU = {
      tBlur: { value: tBlur }, tSharp: { value: tSharp }, tIn: { value: tIn },
      uFocus: { value: 0 }, uMix: { value: 0 }, uZoom: { value: 1 }, uZoomIn: { value: 1.25 },
      uAspect: { value: 1 }, uC: { value: new THREE.Vector2(0.5, 1 - 0.66) }, uPar: { value: new THREE.Vector2() },
      uDim: { value: 1 },
    };
    const bgScene = new THREE.Scene();
    bgScene.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({
      uniforms: bgU, vertexShader: vert, depthTest: false, depthWrite: false,
      fragmentShader: `
        uniform sampler2D tBlur, tSharp, tIn; uniform float uFocus, uMix, uZoom, uZoomIn, uAspect, uDim;
        uniform vec2 uC, uPar; varying vec2 vUv;
        vec2 cover(vec2 uv){ float ta = 16./9.;
          if (uAspect > ta) uv.y = (uv.y - .5) * (ta / uAspect) + .5; else uv.x = (uv.x - .5) * (uAspect / ta) + .5;
          return uv; }
        void main(){
          vec2 uv = cover(vUv);
          float k = clamp((uZoom - 1.) / 1.6, 0., 1.);
          vec2 s = uC + (uv - mix(uC, vec2(.5), k)) / uZoom + uPar;
          vec3 a = mix(texture2D(tBlur, s).rgb, texture2D(tSharp, s).rgb, uFocus);
          vec2 si = vec2(.5) + (uv - .5) / uZoomIn + uPar * .6;
          vec3 b = texture2D(tIn, si).rgb;
          gl_FragColor = vec4(mix(a * uDim, b, uMix), 1.);
        }`,
    })));

    // --- 3D
    const scene = new THREE.Scene();
    scene.environment = window.SottoEnv(renderer, true);
    const cam = new THREE.PerspectiveCamera(35, 1, 0.05, 60);
    cam.position.set(0, 0, 6);
    const key = new THREE.DirectionalLight(0xffd6a0, 1.6); key.position.set(2.5, 3, 4);
    const rim = new THREE.DirectionalLight(0x9fb4ff, 2.2); rim.position.set(-3, 2.5, -3);
    const under = new THREE.PointLight(0xffb060, 6, 9, 1.6); under.position.set(0, -2.5, 3);
    const hemi = new THREE.HemisphereLight(0xffe0b0, 0x1a0e08, 0.4);
    scene.add(key, rim, under, hemi);

    const U = window.SottoUmbrella({ a: '#a8121c', handle: '#2a1a10', ribs: 8, ripple: !reduce, strap: false, U: 14, V: 32, shadow: false });
    const pivot = new THREE.Group(), spin = new THREE.Group();
    U.group.position.y = 0.25;
    spin.add(U.group); pivot.add(spin); scene.add(pivot);

    // brass display stand + soft floor shadow (inside the shop)
    const brassM = new THREE.MeshStandardMaterial({ color: 0xc9a35a, metalness: 1, roughness: 0.28, transparent: true });
    const stand = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.25, 16), brassM); pole.position.y = -2.25;
    const baseM = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.05, 40), brassM); baseM.position.y = -2.86;
    const clip = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.012, 8, 20), brassM); clip.position.y = -1.6; clip.rotation.x = Math.PI / 2;
    stand.add(pole, baseM, clip);
    const sc = document.createElement('canvas'); sc.width = sc.height = 128;
    const sx = sc.getContext('2d'), sg = sx.createRadialGradient(64, 64, 0, 64, 64, 64);
    sg.addColorStop(0, 'rgba(20,8,0,.55)'); sg.addColorStop(1, 'rgba(20,8,0,0)');
    sx.fillStyle = sg; sx.fillRect(0, 0, 128, 128);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    shadow.position.y = -2.89; shadow.rotation.x = -Math.PI / 2 + 0.25;
    stand.add(shadow);
    U.group.add(stand);

    // --- glass pass
    const DROP_MAX = 960;
    const dc = document.createElement('canvas'), dx = dc.getContext('2d');
    const tDrops = new THREE.CanvasTexture(dc);
    tDrops.minFilter = THREE.LinearFilter; tDrops.generateMipmaps = false;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    const cU = {
      tScene: { value: rt.texture }, tDrops: { value: tDrops },
      uGlass: { value: 1 }, uRain: { value: 1 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
    };
    const compScene = new THREE.Scene();
    compScene.add(new THREE.Mesh(quad, new THREE.ShaderMaterial({
      uniforms: cU, vertexShader: vert, depthTest: false, depthWrite: false, toneMapped: false,
      fragmentShader: `
        uniform sampler2D tScene, tDrops; uniform float uGlass, uRain, uTime; uniform vec2 uRes; varying vec2 vUv;
        float h1(float n){ return fract(sin(n * 91.345) * 43758.5453); }
        float h2(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float streaks(vec2 uv, float dens, float speed, float len, float seed){
          vec2 p = vec2(uv.x * uRes.x / uRes.y, uv.y);
          p.x += p.y * .16;
          float c = floor(p.x * dens), h = h1(c + seed);
          if (h < .55) return 0.;
          float fx = fract(p.x * dens);
          float lineX = smoothstep(.5 - .09, .5, fx) * smoothstep(.5 + .09, .5, fx);
          float y = fract(p.y * .7 + uTime * speed * (.8 + h) + h * 7.);
          return lineX * smoothstep(0., len * .25, y) * smoothstep(len, len * .4, y);
        }
        void main(){
          vec4 d = texture2D(tDrops, vUv);
          vec2 n = (d.rg - .5) * 2.;
          float m = smoothstep(.08, .55, d.b) * uGlass;
          vec2 off = n * vec2(uRes.y / uRes.x, 1.) * .03;
          vec3 base = texture2D(tScene, vUv).rgb;
          vec3 seen = texture2D(tScene, vUv - off * 1.6).rgb + texture2D(tScene, vUv - off * 2.4).rgb * .35;
          float rim = smoothstep(.45, 1., length(n));
          float spec = pow(max(0., dot(normalize(vec3(n, .55)), normalize(vec3(-.35, .55, .75)))), 30.);
          vec3 drop = seen * (.95 - rim * .22) + vec3(.03, .028, .025) + spec * .7;
          vec3 col = mix(base * mix(1., .9, uGlass) + vec3(.006, .007, .01) * uGlass, drop, m);
          float r = streaks(vUv, 70., 1.6, .22, 1.) * .5 + streaks(vUv * 1.7, 110., 2.4, .14, 9.) * .3;
          col += vec3(.55, .6, .7) * r * .16 * uRain;
          vec2 q = vUv - .5;
          col *= 1. - dot(q, q) * .55;
          col += (h2(vUv * uRes + fract(uTime) * 100.) - .5) * .012;
          gl_FragColor = vec4(max(col, 0.), 1.);
          #include <colorspace_fragment>
        }`,
    })));

    /* --------------- raindrops on the glass (2D sim into a normal-map canvas) */
    const SPR = 64, spr = document.createElement('canvas'); spr.width = spr.height = SPR;
    (function () {
      const c = spr.getContext('2d'), img = c.createImageData(SPR, SPR);
      for (let y = 0; y < SPR; y++) for (let x = 0; x < SPR; x++) {
        let ddx = (x + 0.5 - SPR / 2) / (SPR / 2), ddy = (y + 0.5 - SPR / 2) / (SPR / 2);
        ddy = ddy < 0 ? ddy * 1.12 : ddy * 0.94;
        const dist = Math.hypot(ddx, ddy), i = (y * SPR + x) * 4;
        img.data[i] = 128 + ddx * 127; img.data[i + 1] = 128 - ddy * 127; img.data[i + 2] = 255;
        img.data[i + 3] = 255 * clamp((1 - dist) / 0.14, 0, 1);
      }
      c.putImageData(img, 0, 0);
    })();
    let DW = 0, DH = 0, k = 1;
    let small = [], big = [];
    const MAXS = innerWidth < 700 ? 420 : 900, MAXB = innerWidth < 700 ? 18 : 34;
    function spawnBig(top) {
      return { x: Math.random() * DW, y: top ? -20 : Math.random() * DH, r: (5 + Math.random() * 8) * k, vy: 0, grow: 0.4 + Math.random(), trail: 0, wob: Math.random() * 10 };
    }
    function resizeDrops() {
      const nw = Math.min(DROP_MAX, Math.round(innerWidth * 0.6)), nh = Math.round(nw * innerHeight / innerWidth);
      const sxk = DW ? nw / DW : 1, syk = DH ? nh / DH : 1;
      small.forEach(d => { d.x *= sxk; d.y *= syk; }); big.forEach(d => { d.x *= sxk; d.y *= syk; });
      DW = dc.width = nw; DH = dc.height = nh; k = DW / 900;
      if (!small.length) {
        for (let i = 0; i < MAXS * 0.8; i++) small.push({ x: Math.random() * DW, y: Math.random() * DH, r: (0.8 + Math.random() * Math.random() * 3.6) * k });
        for (let i = 0; i < MAXB; i++) big.push(spawnBig(false));
      }
    }
    function updateDrops(dt, wipe) {
      if (!reduce) {
        for (let i = 0; i < 40 * dt; i++) if (small.length < MAXS) small.push({ x: Math.random() * DW, y: Math.random() * DH, r: (0.8 + Math.random() * Math.random() * 3.4) * k });
        for (const d of big) {
          d.r += d.grow * dt * 0.5 * k;
          if (d.r > 9 * k) {
            d.vy = Math.min(d.vy + dt * 60 * k * (d.r / (10 * k)), 260 * k);
            d.y += d.vy * dt;
            d.x += Math.sin(d.y * 0.05 + d.wob) * 0.25 * k;
            d.trail -= d.vy * dt;
            if (d.trail < 0) {
              d.trail = (10 + Math.random() * 24) * k;
              if (small.length < MAXS + 120) small.push({ x: d.x + (Math.random() - 0.5) * 2 * k, y: d.y - d.r * 0.8, r: d.r * (0.18 + Math.random() * 0.2) });
              d.r *= 0.985;
            }
            for (let i = small.length - 1; i >= 0; i--) {
              const s = small[i];
              if (Math.abs(s.x - d.x) < d.r && s.y > d.y - d.r * 0.4 && s.y < d.y + d.r) { small.splice(i, 1); d.r = Math.min(d.r + s.r * 0.08, 15 * k); }
            }
          }
          if (d.y - d.r > DH) Object.assign(d, spawnBig(true));
        }
      }
      if (wipe) {
        const R = 70 * k;
        const hit = s => (s.x - wipe.x) ** 2 + (s.y - wipe.y) ** 2 < R * R;
        small = small.filter(s => !hit(s));
        big.forEach(d => { if (hit(d)) Object.assign(d, spawnBig(true), { y: -40 - Math.random() * 200 }); });
      }
      dx.globalCompositeOperation = 'source-over';
      dx.fillStyle = 'rgb(128,128,0)'; dx.fillRect(0, 0, DW, DH);
      for (const s of small) dx.drawImage(spr, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
      for (const d of big) dx.drawImage(spr, d.x - d.r, d.y - d.r * 1.1, d.r * 2, d.r * 2.25);
      tDrops.needsUpdate = true;
    }

    /* --------------- keyframes for the umbrella */
    let K;
    function frames() {
      const hh = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * 6, hw = hh * cam.aspect;
      const port = cam.aspect < 0.9, dir = rtl() ? -1 : 1;
      const sIn = port ? 0.42 : 0.6;
      return {
        k0: { p: [dir * (port ? hw * 0.3 : hw * 0.42), port ? 0.55 : 0.5, 0], r: [0.24, 0, -0.32 * dir], s: port ? 0.64 : 1.12, o: 0.58 },
        k1: { p: [0.1 * dir, 0.35, port ? 2.6 : 3.05], r: [-1.2, 0, 0.62 * dir], s: 1, o: 1 },
        k2: { p: [dir * hw * 0.5, hh * 2.8, 1.5], r: [-0.4, 0, 0.5 * dir], s: 1, o: 1 },
        k3: { p: [0, hh * 2.4, 0], r: [0.12, 0, 0.04], s: sIn, o: 1 },
        k4: { p: [0, port ? 0.12 : 0.22, 0], r: [0.12, 0, 0], s: sIn, o: 1 },
      };
    }
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), eu = new THREE.Euler();
    function pose(a, b, t, extra) {
      pivot.position.set(lerp(a.p[0], b.p[0], t), lerp(a.p[1], b.p[1], t), lerp(a.p[2], b.p[2], t));
      qa.setFromEuler(eu.set(a.r[0], a.r[1], a.r[2]));
      qb.setFromEuler(eu.set(b.r[0], b.r[1], b.r[2]));
      pivot.quaternion.copy(qa).slerp(qb, t);
      if (extra) pivot.rotateZ(extra.z || 0), pivot.rotateX(extra.x || 0);
      pivot.scale.setScalar(lerp(a.s, b.s, t));
      return lerp(a.o, b.o, t);
    }

    function resize() {
      const w = innerWidth, h = innerHeight;
      renderer.setSize(w, h, false);
      const pr = renderer.getPixelRatio();
      rt.setSize(Math.round(w * pr), Math.round(h * pr));
      cam.aspect = w / h; cam.updateProjectionMatrix();
      bgU.uAspect.value = w / h;
      cU.uRes.value.set(w, h);
      resizeDrops();
      K = frames();
    }
    addEventListener('resize', resize);
    resize();
    S.refreshStory = () => { K = frames(); };

    /* --------------- pointer: wipe the glass, sway, pull open */
    let ptr = null, px = 0.5, py = 0.5, pull = 0, dragging = false, dragY0 = 0, pull0 = 0;
    stick.addEventListener('pointermove', e => {
      px = e.clientX / innerWidth; py = e.clientY / innerHeight;
      ptr = { x: px * DW, y: py * DH };
      if (dragging) pull = clamp(pull0 + (dragY0 - e.clientY) / 220, 0, 1);
    });
    stick.addEventListener('pointerleave', () => { ptr = null; });
    stick.addEventListener('pointerdown', e => {
      if (ps > 0.12 || e.target.closest('a,button')) return;
      dragging = true; dragY0 = e.clientY; pull0 = pull;
      stick.setPointerCapture(e.pointerId);
      stick.classList.add('pulling');
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false; stick.classList.remove('pulling');
      if (pull > 0.45) S.goTo(0.3);
    };
    stick.addEventListener('pointerup', endDrag);
    stick.addEventListener('pointercancel', endDrag);

    /* --------------- loop */
    let ps = rawP(), last = performance.now(), time = 0, lastInside = -1;
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const target = rawP();
      ps = reduce ? target : ps + (target - ps) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - ps) < 1e-4) ps = target;
      const p = ps;
      applyText(p);

      const visible = storyEl.getBoundingClientRect().bottom > 0;
      if (visible) {
        if (!reduce) time += dt;
        if (!dragging) pull += (0 - pull) * (1 - Math.exp(-dt * 5));

        // timeline
        const a1 = ease(seg(p, 0.05, 0.3)), a2 = ease(seg(p, 0.38, 0.52)), a3 = ease(seg(p, 0.74, 0.9));
        const focus = ease(seg(p, 0.4, 0.56));
        const zoom1 = lerp(1, 1.4, ease(seg(p, 0.42, 0.6)));
        const enter = ease(seg(p, 0.6, 0.76));
        const mix = ease(seg(p, 0.67, 0.77));
        const glass = 1 - ease(seg(p, 0.6, 0.74));
        bgU.uFocus.value = focus;
        bgU.uZoom.value = zoom1 * lerp(1, 3.4, enter);
        bgU.uMix.value = mix;
        bgU.uZoomIn.value = lerp(1.3, 1, ease(seg(p, 0.68, 0.86)));
        bgU.uDim.value = lerp(1, 0.75, a1 * (1 - a2));
        bgU.uPar.value.set((px - 0.5) * -0.012, (py - 0.5) * 0.008);
        cU.uGlass.value = glass;
        cU.uRain.value = glass;
        cU.uTime.value = time;
        if (Math.abs(mix - lastInside) > 0.01) { S.sound.inside(mix); lastInside = mix; }

        // umbrella choreography
        let open;
        const sway = { z: Math.sin(time * 0.8) * 0.03 + (px - 0.5) * 0.12 * (1 - a1), x: (py - 0.5) * 0.08 * (1 - a1) };
        if (p < 0.38) open = pose(K.k0, K.k1, a1, sway);
        else if (p < 0.74) { open = pose(K.k1, K.k2, a2); }
        else open = pose(K.k3, K.k4, a3, { z: Math.sin(time * 0.9) * 0.01 * (1 - a3) });
        pivot.visible = !(p >= 0.53 && p < 0.745);
        open = Math.max(open, lerp(open, 1, pull));
        spin.rotation.y += dt * (0.12 + a1 * (1 - a2) * 0.25) * (reduce ? 0 : 1);
        U.setOpen(open, time);
        const sv = p >= 0.74 ? seg(p, 0.84, 0.92) : 0;
        stand.visible = sv > 0;
        brassM.opacity = sv; shadow.material.opacity = sv;
        stand.position.y = (1 - sv) * -0.3;
        key.intensity = lerp(1.6, 2.6, mix); rim.intensity = lerp(2.2, 0.5, mix);
        under.intensity = lerp(6, 1, mix);

        updateDrops(dt, glass > 0.05 ? ptr : null);

        renderer.setRenderTarget(rt);
        renderer.autoClear = false;
        renderer.clear();
        renderer.render(bgScene, ortho);
        renderer.render(scene, cam);
        renderer.setRenderTarget(null);
        renderer.render(compScene, ortho);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    document.documentElement.classList.add('gl-ready');
  }
})();
