/* Sotto — procedural umbrella model (classic script, uses global THREE).
   window.SottoUmbrella(opts) → { group, setOpen(t), update(time), setHover(h), dispose() }
   Model space: ferrule tip up at y≈0.2, canopy below, handle bottom at y≈-2.08. */
(function () {
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const TABLE = 120;

  function ribTable(L, t, out) {
    const a0 = lerp(0.04, 1.5, t), k = lerp(0, 0.8, t), ds = L / TABLE;
    let rho = 0, y = 0;
    out[0] = 0; out[1] = 0;
    for (let i = 1; i <= TABLE; i++) {
      const a = a0 - k * ((i - 0.5) * ds) / L;
      rho += Math.sin(a) * ds; y -= Math.cos(a) * ds;
      out[i * 2] = rho; out[i * 2 + 1] = y;
    }
    return out;
  }
  function sample(tab, L, s, out) {
    const f = clamp(s / L, 0, 1) * TABLE;
    const i = Math.min(TABLE - 1, Math.floor(f)), w = f - i;
    out[0] = lerp(tab[i * 2], tab[i * 2 + 2], w);
    out[1] = lerp(tab[i * 2 + 1], tab[i * 2 + 3], w);
    return out;
  }

  // Small studio environment for PBR reflections (no addon needed).
  function makeEnv(renderer, warm) {
    const s = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: warm ? 0x2a1a10 : 0x1c1e24, side: THREE.BackSide }));
    room.scale.set(20, 12, 20);
    s.add(room);
    const panel = (c, k, x, y, z, sx, sy, ry) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.scale.set(sx, sy, 1); m.rotation.y = ry || 0; m.lookAt(0, 0, 0);
      s.add(m);
    };
    panel(warm ? 0xffd9a0 : 0xfff2e0, 6, 0, 5.5, 0, 8, 4);
    panel(warm ? 0xffb870 : 0xbcd2ff, 3, -9, 1, 3, 4, 6);
    panel(0xffffff, 2.5, 8, 2, -4, 5, 5);
    panel(warm ? 0xff9a50 : 0xffe2c0, 1.5, 0, 0, 9, 10, 3);
    const pm = new THREE.PMREMGenerator(renderer);
    const tex = pm.fromScene(s, 0.04).texture;
    pm.dispose();
    return tex;
  }

  function Umbrella(opts) {
    const o = Object.assign({
      ribs: 8, L: 1.15, U: 12, V: 28,
      a: '#b3121b', b: null, handle: '#3a2414', handleType: 'crook',
      brass: '#c9a35a', rib: '#1d1e22', strap: true, shadow: true, ripple: false, furl: 0.55,
    }, opts);
    const N = o.ribs, L = o.L, U = o.U, V = o.V;
    const group = new THREE.Group();

    const fabricMat = new THREE.MeshPhysicalMaterial({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.74,
      sheen: 0.6, sheenRoughness: 0.55, sheenColor: new THREE.Color(0.14, 0.12, 0.12), envMapIntensity: 0.55,
    });
    const brass = new THREE.MeshStandardMaterial({ color: o.brass, metalness: 1, roughness: 0.3 });
    const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 1, roughness: 0.32 });
    const ribMat = new THREE.MeshStandardMaterial({ color: o.rib, metalness: 0.5, roughness: 0.4 });
    const handleMat = new THREE.MeshPhysicalMaterial({ color: o.handle, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.2 });
    const mats = [fabricMat, brass, steel, ribMat, handleMat];

    const openTab = ribTable(L, 1, new Float32Array((TABLE + 1) * 2));
    const curTab = new Float32Array((TABLE + 1) * 2);

    // Fabric
    const vpp = (U + 1) * (V + 1);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * vpp * 3), col = new Float32Array(N * vpp * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const idx = [];
    for (let p = 0; p < N; p++) {
      const base = p * vpp;
      for (let u = 0; u < U; u++) for (let v = 0; v < V; v++) {
        const a = base + u * (V + 1) + v, b = a + V + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    geo.setIndex(idx);
    const fabric = new THREE.Mesh(geo, fabricMat);
    fabric.castShadow = o.shadow;
    group.add(fabric);

    function setColors(a, b) {
      const ca = new THREE.Color(a), cb = new THREE.Color(b || a);
      // a whisper of variation so single-colour canopies still read panel by panel
      let i = 0;
      for (let p = 0; p < N; p++) {
        const c = (p % 2 ? cb : ca).clone();
        if (!b) c.multiplyScalar(p % 2 ? 0.93 : 1);
        for (let k = 0; k < vpp; k++) { col[i++] = c.r; col[i++] = c.g; col[i++] = c.b; }
      }
      geo.attributes.color.needsUpdate = true;
    }
    setColors(o.a, o.b);

    // Hardware
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.74, 12), steel);
    shaft.position.y = -0.72;
    const ferrule = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.016, 0.22, 16), brass);
    ferrule.position.y = 0.1;
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.034, 0.06, 20), ribMat);
    const runner = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.024, 0.1, 20), ribMat);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.04, 20), brass);
    collar.position.y = -1.58;
    group.add(shaft, ferrule, notch, runner, collar);

    let curve;
    if (o.handleType === 'straight') {
      curve = new THREE.LineCurve3(new THREE.Vector3(0, -1.58, 0), new THREE.Vector3(0, -2.02, 0));
    } else {
      curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -1.58, 0), new THREE.Vector3(0, -1.88, 0), new THREE.Vector3(0.03, -2.02, 0),
        new THREE.Vector3(0.125, -2.075, 0), new THREE.Vector3(0.215, -2.02, 0), new THREE.Vector3(0.24, -1.92, 0),
      ]);
    }
    const handle = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, o.handleType === 'straight' ? 0.042 : 0.034, 16), handleMat);
    const end = new THREE.Mesh(new THREE.SphereGeometry(o.handleType === 'straight' ? 0.05 : 0.034, 16, 10), o.handleType === 'straight' ? brass : handleMat);
    end.position.copy(curve.getPoint(1));
    group.add(handle, end);

    const ribs = [], strs = [], tips = [];
    const tipGeo = new THREE.CylinderGeometry(0.004, 0.012, 0.05, 8);
    const strGeo = new THREE.CylinderGeometry(0.004, 0.004, 1, 6);
    strGeo.translate(0, 0.5, 0);
    for (let i = 0; i < N; i++) {
      const r = new THREE.Mesh(new THREE.BufferGeometry(), ribMat);
      const s = new THREE.Mesh(strGeo, ribMat);
      const tp = new THREE.Mesh(tipGeo, brass);
      ribs.push(r); strs.push(s); tips.push(tp);
      group.add(r, s, tp);
    }
    const strap = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.07, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: o.a, roughness: 0.6, side: THREE.DoubleSide, sheen: 0.5 }));
    const snap = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), brass);
    mats.push(strap.material);
    if (o.strap) group.add(strap, snap);
    group.traverse(m => { if (m.isMesh) m.castShadow = o.shadow; });

    const tA = [0, 0], tO = [0, 0];
    const chordK = 2 * Math.sin(Math.PI / N);
    const UP = new THREE.Vector3(0, 1, 0), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
    let cur = -1, hover = 0;

    function build(t, time) {
      ribTable(L, t, curTab);
      const scallop = 0.075 * t, ripple = o.ripple ? 0.007 * t : 0;
      const tight = (1 - t) * o.furl * (1 - hover * 0.5);
      let i = 0;
      for (let p = 0; p < N; p++) {
        const ta = (p / N) * Math.PI * 2, tb = ((p + 1) / N) * Math.PI * 2;
        const ca = Math.cos(ta), sa = Math.sin(ta), cb = Math.cos(tb), sb = Math.sin(tb);
        for (let u = 0; u <= U; u++) {
          const fu = u / U, bell = Math.sin(Math.PI * fu);
          const th = lerp(ta, tb, fu), ct = Math.cos(th), st = Math.sin(th);
          for (let v = 0; v <= V; v++) {
            const sl = v / V, s = sl * L * (1 - scallop * bell);
            sample(curTab, L, s, tA); sample(openTab, L, s, tO);
            const rho = tA[0];
            let x = lerp(rho * ca, rho * cb, fu), z = lerp(rho * sa, rho * sb, fu);
            const excess = Math.max(0, chordK * (tO[0] - rho));
            // folded cloth: pleats outward, tapering again toward the rib tips, tighter when furled
            const taper = lerp(1, Math.sin(Math.PI * Math.min(1, sl * 0.62 + 0.2)), 1 - t);
            const push = 0.2 * excess * bell * taper * (1 - tight) - 0.022 * t * bell * sl;
            x += ct * push; z += st * push;
            const y = tA[1] + (ripple ? ripple * Math.sin(time * 2.1 + th * 3 + s * 5) * bell * sl : 0);
            pos[i++] = x; pos[i++] = y; pos[i++] = z;
          }
        }
      }
      geo.attributes.position.needsUpdate = true;
      geo.computeVertexNormals();
      geo.computeBoundingSphere();
    }

    function buildFrame(t) {
      const pts = [];
      for (let k = 0; k <= 20; k++) {
        sample(curTab, L, (k / 20) * L, tA);
        pts.push([tA[0] * 0.985, tA[1] - 0.008]);
      }
      sample(curTab, L, 0.5 * L, tA);
      const px = tA[0] * 0.985, py = tA[1] - 0.012, S = 0.68;
      const ry = py - Math.sqrt(Math.max(0, S * S - px * px));
      runner.position.y = ry;
      for (let i = 0; i < N; i++) {
        const th = (i / N) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
        const cv = new THREE.CatmullRomCurve3(pts.map(([r, y]) => new THREE.Vector3(r * c, y, r * s)));
        ribs[i].geometry.dispose();
        ribs[i].geometry = new THREE.TubeGeometry(cv, 20, 0.006, 5);
        const [tr, ty] = pts[pts.length - 1];
        tips[i].position.set(tr * c, ty - 0.02, tr * s);
        tips[i].quaternion.setFromUnitVectors(UP, v1.copy(cv.getTangent(1)).negate());
        v1.set(0.026 * c, ry + 0.03, 0.026 * s);
        v2.set(px * c, py, px * s);
        strs[i].position.copy(v1);
        strs[i].scale.y = v1.distanceTo(v2);
        strs[i].quaternion.setFromUnitVectors(UP, v2.sub(v1).normalize());
        strs[i].visible = t > 0.02;
      }
      // strap around the furled canopy
      const sv = 0.68;
      sample(curTab, L, sv * L, tA); sample(openTab, L, sv * L, tO);
      const rad = tA[0] + 0.2 * Math.max(0, chordK * (tO[0] - tA[0])) * 0.62 * (1 - (1 - t) * o.furl) + 0.008;
      strap.scale.set(rad, 1, rad);
      strap.position.y = tA[1];
      snap.position.set(rad, tA[1], 0);
      strap.visible = snap.visible = o.strap && t < 0.03 && hover < 0.5;
    }

    return {
      group, materials: mats,
      setColors,
      setHover(h) { hover = h; cur = -1; },
      setOpen(t, time) {
        t = clamp(t, 0, 1);
        if (o.ripple && t > 0.05) { build(t, time || 0); }
        if (Math.abs(t - cur) > 1e-4) {
          if (!(o.ripple && t > 0.05)) build(t, time || 0);
          buildFrame(t); cur = t;
        }
      },
      dispose() {
        group.traverse(m => { if (m.isMesh) m.geometry.dispose(); });
        mats.forEach(m => m.dispose());
      },
    };
  }

  window.SottoUmbrella = Umbrella;
  window.SottoEnv = makeEnv;
})();
