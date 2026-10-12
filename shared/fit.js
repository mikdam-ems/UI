/* Height fit: on short screens, zooms a hero's main visual so the whole composition fits one viewport.
   Markup:
     data-fit-root            on the hero (needs a definite height, e.g. 100svh)
     data-fit                 on the visual to shrink
       data-fit-anchor="bottom"   visual is pinned to the hero bottom; "center" = centred in the root (default: in normal flow)
       data-fit-above="<sel>"     element whose bottom the visual must stay below (bottom-anchored only)
       data-fit-offset="keep"     the CSS bottom offset is divided by var(--fit), so it stays unscaled
       data-fit-need="250"        px of the visual that must show at full size (when it is meant to bleed off the bottom)
       data-fit-gap="24"          px kept free between the visual and the hero bottom / above element
       data-fit-min=".6"          smallest zoom allowed
       data-fit-from="901"        only fit when the viewport is at least this wide
   The zoom is exposed as --fit on the visual and --fit-root on its root, for siblings that should follow. */
(() => {
  const items = [...document.querySelectorAll('[data-fit]')];
  if (!items.length || !('zoom' in document.documentElement.style)) return;

  function fit() {
    items.forEach(el => {
      el.style.zoom = ''; el.style.removeProperty('--fit');
      (el.closest('[data-fit-root]') || document.body).style.removeProperty('--fit-root');
      const from = +(el.dataset.fitFrom || 901);
      if (innerWidth < from) return;
      const root = el.closest('[data-fit-root]') || document.body;
      const gap = +(el.dataset.fitGap || 24), min = +(el.dataset.fitMin || .6);
      const rootBottom = root.getBoundingClientRect().bottom;
      // children may overflow the visual (e.g. cards rising out of an envelope): use the full painted box
      let top = Infinity, bottom = -Infinity;
      [el, ...el.querySelectorAll('*')].forEach(n => { const q = n.getBoundingClientRect(); if (q.width && q.height) { top = Math.min(top, q.top); bottom = Math.max(bottom, q.bottom); } });
      const r = { top, height: bottom - top };
      let z;
      if (el.dataset.fitAnchor === 'center') { // visual is centred in the root: fit its height into the root minus a gap each side
        z = (root.getBoundingClientRect().height - 2 * gap) / r.height;
      } else if (el.dataset.fitAnchor === 'bottom') {
        const above = el.dataset.fitAbove && document.querySelector(el.dataset.fitAbove);
        if (!above) return;
        const free = rootBottom - above.getBoundingClientRect().bottom - gap;
        const offset = Math.max(0, rootBottom - el.getBoundingClientRect().bottom);
        // data-fit-offset="keep": CSS divides the bottom offset by --fit, so only the visual itself scales
        z = el.dataset.fitOffset === 'keep' ? (free - offset) / r.height : free / (+el.dataset.fitNeed || rootBottom - r.top);
      } else {
        const own = el.getBoundingClientRect().top; // zoom scales from the element's own top edge
        z = (rootBottom - own - gap) / (+el.dataset.fitNeed || r.top + r.height - own);
      }
      if (z < 1) { el.style.zoom = Math.max(min, z).toFixed(3); el.style.setProperty('--fit', el.style.zoom); root.style.setProperty('--fit-root', el.style.zoom); } // --fit lets CSS undo zoom on offsets
    });
  }

  let t;
  const later = () => { clearTimeout(t); t = setTimeout(fit, 80); };
  addEventListener('resize', later);
  addEventListener('load', fit);
  if (document.fonts) document.fonts.ready.then(fit);
  fit();
  setTimeout(fit, 1500); // again once entrance animations have settled
})();
