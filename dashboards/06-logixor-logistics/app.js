// Logixor — dashboard UI: theme, tabs, dropdowns, live numbers, charts, search.
// The 3D scene (scene.js) listens for `lx:fly` / `lx:theme` events dispatched from here.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fly = (key, extra = {}) => document.dispatchEvent(new CustomEvent('lx:fly', { detail: { key, ...extra } }));
  const fmt = (n) => Math.round(n).toLocaleString('en-US');

  /* ---------- Theme ---------- */
  const themeBtn = $('#themeBtn');
  let saved = null;
  try { saved = localStorage.getItem('lx-theme'); } catch { /* storage unavailable */ }
  if (saved === 'dark') root.classList.add('dark');
  const syncThemeBtn = () => {
    const dark = root.classList.contains('dark');
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Switch to day mode' : 'Switch to night mode');
  };
  syncThemeBtn();
  themeBtn.addEventListener('click', () => {
    const dark = root.classList.toggle('dark');
    try { localStorage.setItem('lx-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
    syncThemeBtn();
    document.dispatchEvent(new CustomEvent('lx:theme', { detail: { dark } }));
  });

  /* ---------- Tabs ---------- */
  const scrollToEl = (el) => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  const flash = (el) => { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); };
  $$('.tab').forEach((tab) => tab.addEventListener('click', () => {
    $$('.tab').forEach((t) => { t.classList.toggle('is-active', t === tab); t.toggleAttribute('aria-current', t === tab); });
    const k = tab.dataset.tab;
    if (k === 'command') { fly('home'); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    if (k === 'shipments') { fly('pin'); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    if (k === 'network') { fly('network'); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
    if (k === 'analytics') { scrollToEl($('#perf')); flash($('#perf')); }
    if (k === 'reports') { scrollToEl($('#inv')); flash($('#inv')); }
  }));

  /* ---------- Generic dropdowns ---------- */
  const closeAll = (except) => $$('.select').forEach((s) => {
    if (s === except) return;
    $('.select-menu', s).hidden = true; $('.select-btn', s).setAttribute('aria-expanded', 'false');
  });
  $$('.select').forEach((sel) => {
    const btn = $('.select-btn', sel), menu = $('.select-menu', sel);
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); closeAll(sel);
      const open = menu.hidden; menu.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', (e) => {
      const li = e.target.closest('li'); if (!li) return;
      $$('li', menu).forEach((x) => x.setAttribute('aria-selected', String(x === li)));
      $('span', btn).textContent = li.textContent;
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      sel.dispatchEvent(new CustomEvent('change', { detail: li.dataset.value }));
    });
  });
  document.addEventListener('click', () => { closeAll(); closeSearch(); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeAll(); closeSearch(); } });

  /* ---------- Command overview ranges ---------- */
  const RANGES = {
    today: { label: ["Shipments Today", "Today's spend"], ship: [8542, '12.6%'], otd: [96.4, '6.8%'], wh: [68, '4'], spend: [128430, '8.5%'] },
    week: { label: ['Shipments This Week', "This week's spend"], ship: [58214, '9.1%'], otd: [95.8, '3.2%'], wh: [71, '6'], spend: [884120, '5.4%'] },
    month: { label: ['Shipments This Month', "This month's spend"], ship: [241870, '14.3%'], otd: [96.1, '4.5%'], wh: [74, '9'], spend: [3618900, '7.9%'] }
  };
  const FORMAT = { ship: fmt, otd: (n) => n.toFixed(1) + '%', wh: fmt, spend: (n) => '$' + fmt(n) };
  const current = { ship: 8542, otd: 96.4, wh: 68, spend: 128430 };
  function tween(key, to) {
    const el = $(`[data-metric="${key}"]`), from = current[key];
    current[key] = to;
    if (reduce) { el.textContent = FORMAT[key](to); return; }
    const t0 = performance.now(), d = 900;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - k, 3);
      el.textContent = FORMAT[key](from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  $('[data-select="range"]').addEventListener('change', (e) => {
    const r = RANGES[e.detail];
    const rows = $$('.metric');
    $('b', rows[0]).textContent = r.label[0];
    $('small', rows[3]).textContent = r.label[1];
    for (const k of ['ship', 'otd', 'wh', 'spend']) { tween(k, r[k][0]); $(`[data-delta="${k}"]`).textContent = r[k][1]; }
    range = e.detail;
  });
  let range = 'today';
  // live trickle of new shipments
  if (!reduce) setInterval(() => { if (range === 'today' && !document.hidden) tween('ship', current.ship + 1 + Math.floor(Math.random() * 3)); }, 4200);

  /* ---------- Alerts timer ---------- */
  let left = 8 * 60 + 45;
  const timerEl = $('#timer');
  setInterval(() => {
    left = left <= 0 ? 15 * 60 : left - 1;
    timerEl.textContent = `${Math.floor(left / 60)}m ${String(left % 60).padStart(2, '0')}s`;
  }, 1000);
  $$('.feed-item').forEach((b) => b.addEventListener('click', () => {
    fly(b.dataset.fly);
    if (matchMedia('(max-width: 1100px)').matches) $('#stage').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }));

  /* ---------- Bell ---------- */
  $('#bellBtn').addEventListener('click', () => {
    $('#bellBadge').classList.add('is-cleared');
    $('#bellBtn').setAttribute('aria-label', 'Notifications, none unread');
    scrollToEl($('#alerts')); flash($('#alerts'));
  });

  /* ---------- Live shipment pin progress ---------- */
  let pct = 72;
  const fill = $('#pinFill'), pctEl = $('#pinPct');
  if (!reduce) setInterval(() => {
    pct = pct >= 99 ? 64 : pct + 1;
    fill.style.width = pct + '%'; pctEl.textContent = pct + '%';
  }, 5200);

  /* ---------- Search / jump-to ---------- */
  const searchBtn = $('#searchBtn'), pop = $('#searchPop'), input = $('#searchInput'), list = $('#searchList');
  const fallbackPlaces = [
    { key: 'pin', label: 'Live shipment #LX-2487', note: 'Conveyor line 2' },
    { key: 'atl02', label: 'Warehouse ATL-02', note: '92% capacity' },
    { key: 'yard', label: 'Container Yard', note: '1,284 TEU' },
    { key: 'depot', label: 'Fuel Depot', note: '4 tanks · 71%' },
    { key: 'dock3', label: 'Dock 3', note: '78% utilised' },
    { key: 'gate', label: 'Truck Gate', note: 'Congestion on I-95 N' }
  ];
  let hl = 0, matches = [];
  function renderList() {
    const q = input.value.trim().toLowerCase();
    matches = (window.LX_PLACES || fallbackPlaces).filter((p) => !q || (p.label + ' ' + p.note + ' ' + p.key).toLowerCase().includes(q));
    hl = Math.min(hl, Math.max(0, matches.length - 1));
    list.innerHTML = matches.length
      ? matches.map((p, i) => `<li><button data-key="${p.key}" class="${i === hl ? 'is-hl' : ''}"><span>${p.label}</span><small>${p.note}</small></button></li>`).join('')
      : '<li><small style="display:block;padding:10px">No matching sites</small></li>';
  }
  function openSearch() { pop.hidden = false; searchBtn.setAttribute('aria-expanded', 'true'); hl = 0; input.value = ''; renderList(); input.focus(); }
  function closeSearch() { pop.hidden = true; searchBtn.setAttribute('aria-expanded', 'false'); }
  function go(key) { closeSearch(); fly(key); scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }
  searchBtn.addEventListener('click', (e) => { e.stopPropagation(); pop.hidden ? openSearch() : closeSearch(); });
  pop.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('button[data-key]'); if (b) go(b.dataset.key); });
  input.addEventListener('input', () => { hl = 0; renderList(); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { hl = Math.min(hl + 1, matches.length - 1); renderList(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { hl = Math.max(hl - 1, 0); renderList(); e.preventDefault(); }
    if (e.key === 'Enter' && matches[hl]) go(matches[hl].key);
  });

  /* ---------- Charts ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const css = (v) => getComputedStyle(root).getPropertyValue(v).trim();
  function smooth(pts) {
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const t = 0.16;
      d += ` C${p1[0] + (p2[0] - p0[0]) * t},${p1[1] + (p2[1] - p0[1]) * t} ${p2[0] - (p3[0] - p1[0]) * t},${p2[1] - (p3[1] - p1[1]) * t} ${p2[0]},${p2[1]}`;
    }
    return d;
  }

  const LINE_SETS = {
    month: { ship: [5000, 5350, 7000, 6900, 9050, 8650, 8800, 9000, 8542, 9100, 9300], trend: [3200, 3200, 4400, 4100, 4700, 5200, 5800, 6100, 6421, 6900, 6650] },
    quarter: { ship: [6100, 6400, 6900, 7300, 7600, 8100, 7900, 8300, 8650, 8800, 9200], trend: [4200, 4500, 4700, 5200, 5400, 5600, 5900, 6000, 6300, 6600, 6900] },
    year: { ship: [4200, 4700, 5600, 5100, 6300, 6900, 6600, 7200, 7800, 7400, 8100], trend: [2600, 3000, 3300, 3900, 4100, 4500, 4800, 5300, 5600, 5900, 6200] }
  };
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const lineBox = $('#lineChart');
  let lineSet = 'month';
  function drawLine(first) {
    const data = LINE_SETS[lineSet];
    const W = 320, H = 214, L = 36, R = 12, T = 10, B = 26;
    const x = (i) => L + (i / (data.ship.length - 1)) * (W - L - R);
    const y = (v) => T + (1 - v / 10000) * (H - T - B);
    const blue = css('--blue'), orange = css('--orange'), card = css('--card');
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Shipments versus trend, January to June">`;
    s += `<defs><linearGradient id="la" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${blue}" stop-opacity=".16"/><stop offset="1" stop-color="${blue}" stop-opacity="0"/></linearGradient></defs>`;
    [0, 2500, 5000, 7500, 10000].forEach((v) => {
      s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke-dasharray="${v ? '3 4' : ''}"/>`;
      s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v ? (v / 1000) + 'K' : 0}</text>`;
    });
    MONTHS.forEach((m, i) => { s += `<text x="${x(i * 2)}" y="${H - 6}" text-anchor="middle">${m}</text>`; });
    const sp = data.ship.map((v, i) => [x(i), y(v)]), tp = data.trend.map((v, i) => [x(i), y(v)]);
    s += `<path d="${smooth(sp)} L${x(data.ship.length - 1)},${y(0)} L${x(0)},${y(0)} Z" fill="url(#la)"/>`;
    s += `<line class="cursor" x1="0" x2="0" y1="${T}" y2="${y(0)}" stroke="${css('--mute')}" stroke-dasharray="3 3" opacity=".6"/>`;
    s += `<path class="line-path ${first && !reduce ? 'draw' : ''}" d="${smooth(tp)}" stroke="${orange}" style="--len:600"/>`;
    s += `<path class="line-path ${first && !reduce ? 'draw' : ''}" d="${smooth(sp)}" stroke="${blue}" style="--len:600"/>`;
    sp.forEach(([px, py], i) => { s += `<circle class="pt" data-i="${i}" cx="${px}" cy="${py}" r="3.6" fill="${card}" stroke="${blue}" stroke-width="2.2"/>`; });
    tp.forEach(([px, py], i) => { s += `<circle class="pt" data-i="${i}" cx="${px}" cy="${py}" r="3.6" fill="${card}" stroke="${orange}" stroke-width="2.2"/>`; });
    const step = (W - L - R) / (data.ship.length - 1);
    data.ship.forEach((_, i) => { s += `<rect class="hit" data-i="${i}" x="${x(i) - step / 2}" y="${T}" width="${step}" height="${H - T - B}"/>`; });
    s += '</svg><div class="c-tip glass" aria-hidden="true"></div>';
    lineBox.innerHTML = s;
    const svg = $('svg', lineBox), tip = $('.c-tip', lineBox), cursor = $('.cursor', svg);
    const show = (i) => {
      const m = MONTHS[Math.floor(i / 2)] + (i % 2 ? ' (late)' : '');
      tip.innerHTML = `<b>${m}</b><div><i style="background:${blue}"></i>Shipments<strong>${fmt(data.ship[i])}</strong></div><div><i style="background:${orange}"></i>Trend<strong>${fmt(data.trend[i])}</strong></div>`;
      $$('.pt', svg).forEach((c) => c.setAttribute('r', +c.dataset.i === i ? 5.2 : 3.6));
      cursor.setAttribute('x1', x(i)); cursor.setAttribute('x2', x(i));
      const sc = svg.getBoundingClientRect().width / W;
      const tw = tip.offsetWidth || 140;
      let left = x(i) * sc - tw - 14; if (left < 0) left = x(i) * sc + 14;
      tip.style.left = left + 'px';
      tip.style.top = (Math.min(y(data.ship[i]), y(data.trend[i])) * sc + 24) + 'px';
    };
    $$('.hit', svg).forEach((r) => {
      r.addEventListener('mouseenter', () => show(+r.dataset.i));
      r.addEventListener('click', () => show(+r.dataset.i));
    });
    svg.addEventListener('mouseleave', () => show(8));
    requestAnimationFrame(() => show(8));
  }
  $('[data-select="perf"]').addEventListener('change', (e) => { lineSet = e.detail; drawLine(true); });

  const barBox = $('#barChart');
  const BARS = { cap: [1750, 1950, 2250, 2250, 2600, 3000], stock: [1350, 1450, 1750, 1700, 2050, 2456] };
  function drawBars(first) {
    const W = 320, H = 196, L = 30, R = 8, T = 6, B = 26;
    const blue = css('--blue'), orange = css('--orange');
    const y = (v) => T + (1 - v / 3000) * (H - T - B);
    const slot = (W - L - R) / 6, bw = Math.min(30, slot * 0.52);
    let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Inventory by month, January to June">`;
    s += `<defs>
      <linearGradient id="bb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4F8BFF"/><stop offset="1" stop-color="${blue}"/></linearGradient>
      <pattern id="stripes" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="7" height="7" fill="#FDBA74"/><rect width="3.2" height="7" fill="${orange}"/></pattern>
    </defs>`;
    [0, 1000, 2000, 3000].forEach((v) => {
      s += `<line class="gridline" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke-dasharray="${v ? '3 4' : ''}"/>`;
      s += `<text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${v ? v / 1000 + 'K' : 0}</text>`;
    });
    MONTHS.forEach((m, i) => {
      const cx = L + slot * (i + 0.5), last = i === 5;
      const d = first && !reduce ? `style="animation-delay:${0.1 + i * 0.08}s"` : '';
      s += `<g class="bar-col" data-i="${i}" tabindex="0" role="img" aria-label="${m}: ${fmt(BARS.stock[i])} of ${fmt(BARS.cap[i])}">`;
      s += `<rect class="hit" x="${cx - slot / 2}" y="${T}" width="${slot}" height="${H - T - B}"/>`;
      if (!last) s += `<rect class="bar-rect ${d ? 'rise' : ''}" ${d} x="${cx - bw / 2}" y="${y(BARS.cap[i])}" width="${bw}" height="${y(0) - y(BARS.cap[i])}" rx="5" fill="${blue}" opacity=".16"/>`;
      s += `<rect class="bar-rect ${d ? 'rise' : ''}" ${d} x="${cx - bw / 2}" y="${y(last ? BARS.cap[i] : BARS.stock[i])}" width="${bw}" height="${y(0) - y(last ? BARS.cap[i] : BARS.stock[i])}" rx="5" fill="${last ? 'url(#stripes)' : 'url(#bb)'}"/>`;
      s += `<text x="${cx}" y="${H - 6}" text-anchor="middle">${m}</text></g>`;
    });
    s += '</svg><div class="c-tip glass" style="opacity:0" aria-hidden="true"></div>';
    barBox.innerHTML = s;
    const svg = $('svg', barBox), tip = $('.c-tip', barBox);
    const show = (i) => {
      const sc = svg.getBoundingClientRect().width / W;
      tip.innerHTML = `<b>${MONTHS[i]}${i === 5 ? ' · forecast' : ''}</b><div><i style="background:${i === 5 ? orange : blue}"></i>In stock<strong>${fmt(BARS.stock[i])}</strong></div><div><i style="background:${blue};opacity:.3"></i>Capacity<strong>${fmt(BARS.cap[i])}</strong></div>`;
      tip.style.opacity = 1;
      const cx = (L + slot * (i + 0.5)) * sc, tw = tip.offsetWidth || 140;
      tip.style.left = Math.max(0, Math.min(cx - tw / 2, svg.getBoundingClientRect().width - tw)) + 'px';
      tip.style.top = Math.max(0, y(BARS.cap[i]) * sc - 70) + 'px';
    };
    $$('.bar-col', svg).forEach((g) => {
      g.addEventListener('mouseenter', () => show(+g.dataset.i));
      g.addEventListener('focus', () => show(+g.dataset.i));
      g.addEventListener('click', () => show(+g.dataset.i));
    });
    svg.addEventListener('mouseleave', () => { tip.style.opacity = 0; });
  }
  drawLine(true); drawBars(true);
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { drawLine(false); drawBars(false); }, 150); });
  document.addEventListener('lx:theme', () => setTimeout(() => { drawLine(false); drawBars(false); }, 30));

  /* ---------- 3D fallback ---------- */
  setTimeout(() => { if (!window.LX_SCENE) root.classList.add('no-webgl'); }, 9000);
})();
