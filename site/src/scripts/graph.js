/* OpenCourses — Force-directed graph (vanilla JS, no D3) */
(function () {
  const svg = document.getElementById('graph-svg');
  if (!svg) return;

  const { nodes: rawNodes, links: rawLinks } = window.OC_GRAPH || { nodes: [], links: [] };
  const TRACK_COLORS = window.OC_TRACK_COLORS || {};

  let width = svg.clientWidth || 800;
  let height = svg.clientHeight || 560;

  // SVG namespaced element helper
  const svgEl = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

  // Build layers
  const edgeGroup = svgEl('g'); svg.appendChild(edgeGroup);
  const nodeGroup = svgEl('g'); svg.appendChild(nodeGroup);
  const labelGroup = svgEl('g'); svg.appendChild(labelGroup);

  // State
  let sim = [];
  let linkMap = [];
  let frame = 0;
  const MAX_FRAMES = 240;
  let raf;
  let selectedId = null;

  // Detail popup
  const detail = document.getElementById('graph-detail');
  const detailClose = document.getElementById('graph-detail-close');
  detailClose?.addEventListener('click', () => {
    selectedId = null;
    detail?.setAttribute('hidden', '');
    render();
  });
  document.getElementById('graph-reset')?.addEventListener('click', () => {
    selectedId = null;
    detail?.setAttribute('hidden', '');
    render();
  });

  function init() {
    width = svg.parentElement?.clientWidth || 800;
    height = svg.parentElement?.clientHeight || 560;
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const trackGroups = {};
    rawNodes.forEach(n => {
      (trackGroups[n.track] = trackGroups[n.track] || []).push(n);
    });
    const trackKeys = Object.keys(trackGroups);
    const trackCenters = {};
    trackKeys.forEach((t, i) => {
      const a = (i / trackKeys.length) * Math.PI * 2;
      trackCenters[t] = {
        x: width / 2 + Math.cos(a) * Math.min(width, height) * 0.28,
        y: height / 2 + Math.sin(a) * Math.min(width, height) * 0.28,
      };
    });

    sim = rawNodes.map(n => ({
      ...n,
      x: (trackCenters[n.track]?.x ?? width / 2) + (Math.random() - 0.5) * 100,
      y: (trackCenters[n.track]?.y ?? height / 2) + (Math.random() - 0.5) * 100,
      vx: 0, vy: 0,
      r: 8 + Math.sqrt(n.popularity || 0) * 0.5,
      tc: trackCenters[n.track] || { x: width / 2, y: height / 2 },
    }));

    linkMap = rawLinks.map(l => ({
      ...l,
      si: sim.findIndex(n => n.id === l.source),
      ti: sim.findIndex(n => n.id === l.target),
    })).filter(l => l.si >= 0 && l.ti >= 0);

    frame = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(step);
  }

  function step() {
    const alpha = Math.max(0.02, 1 - frame / MAX_FRAMES);

    // Repulsion
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const dx = sim[j].x - sim[i].x, dy = sim[j].y - sim[i].y;
        const d2 = dx * dx + dy * dy + 1;
        const f = 700 / d2;
        const d = Math.sqrt(d2);
        const fx = (dx / d) * f, fy = (dy / d) * f;
        sim[i].vx -= fx * alpha; sim[i].vy -= fy * alpha;
        sim[j].vx += fx * alpha; sim[j].vy += fy * alpha;
      }
    }

    // Springs
    for (const l of linkMap) {
      const a = sim[l.si], b = sim[l.ti];
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
      const k = 0.06 * alpha;
      const diff = (d - 90) * k;
      const fx = (dx / d) * diff, fy = (dy / d) * diff;
      a.vx += fx; a.vy += fy; b.vx -= fx; b.vy -= fy;
    }

    // Track center attraction
    for (const n of sim) {
      n.vx += (n.tc.x - n.x) * 0.012 * alpha;
      n.vy += (n.tc.y - n.y) * 0.012 * alpha;
    }

    // Collision
    for (let i = 0; i < sim.length; i++) {
      for (let j = i + 1; j < sim.length; j++) {
        const a = sim[i], b = sim[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
        const minD = a.r + b.r + 6;
        if (d < minD) {
          const push = (minD - d) / 2;
          const ux = dx / d, uy = dy / d;
          a.x -= ux * push; a.y -= uy * push;
          b.x += ux * push; b.y += uy * push;
        }
      }
    }

    // Velocity + damping
    for (const n of sim) {
      n.x += n.vx; n.y += n.vy;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x = Math.max(n.r + 8, Math.min(width - n.r - 8, n.x));
      n.y = Math.max(n.r + 8, Math.min(height - n.r - 8, n.y));
    }

    if (frame % 2 === 0) render();
    frame++;
    if (frame < MAX_FRAMES) raf = requestAnimationFrame(step);
  }

  function render() {
    // Edges
    edgeGroup.innerHTML = '';
    linkMap.forEach(l => {
      const a = sim[l.si], b = sim[l.ti];
      const line = svgEl('line');
      const isSel = selectedId && (l.source === selectedId || l.target === selectedId);
      line.setAttribute('x1', a.x); line.setAttribute('y1', a.y);
      line.setAttribute('x2', b.x); line.setAttribute('y2', b.y);
      line.setAttribute('stroke', 'var(--border-strong)');
      line.setAttribute('stroke-width', l.type === 'prerequisite' ? '1.2' : '0.8');
      if (l.type !== 'prerequisite') line.setAttribute('stroke-dasharray', '3 4');
      line.setAttribute('opacity', selectedId && !isSel ? '0.12' : '0.55');
      edgeGroup.appendChild(line);
    });

    // Nodes + labels
    nodeGroup.innerHTML = ''; labelGroup.innerHTML = '';
    sim.forEach(n => {
      const color = TRACK_COLORS[n.track] || '#4f9eff';
      const isSel = selectedId === n.id;
      const g = svgEl('g');
      g.setAttribute('transform', `translate(${n.x},${n.y})`);
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => selectNode(n));

      if (isSel) {
        const pulse = svgEl('circle');
        pulse.setAttribute('r', n.r + 6);
        pulse.setAttribute('fill', 'none');
        pulse.setAttribute('stroke', 'var(--accent-blue)');
        pulse.setAttribute('stroke-width', '2');
        pulse.setAttribute('opacity', '0.6');
        g.appendChild(pulse);
      }

      const c = svgEl('circle');
      c.setAttribute('r', n.r);
      c.setAttribute('fill', color);
      c.setAttribute('fill-opacity', isSel ? '0.6' : '0.28');
      c.setAttribute('stroke', isSel ? 'var(--accent-blue)' : color);
      c.setAttribute('stroke-width', isSel ? '2.5' : '1.6');
      g.appendChild(c);
      nodeGroup.appendChild(g);

      // Label
      if (n.r > 11) {
        const t = svgEl('text');
        t.setAttribute('x', n.x); t.setAttribute('y', n.y + n.r + 12);
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('font-family', 'var(--font-mono)');
        t.setAttribute('font-size', '9.5');
        t.setAttribute('fill', isSel ? 'var(--text-primary)' : 'var(--text-secondary)');
        t.style.pointerEvents = 'none';
        t.textContent = n.title.length > 22 ? n.title.slice(0, 20) + '…' : n.title;
        labelGroup.appendChild(t);
      }
    });
  }

  function selectNode(n) {
    selectedId = n.id;
    // Populate detail card
    const detailTitle = document.getElementById('graph-detail-title');
    const detailMeta = document.getElementById('graph-detail-meta');
    const detailDesc = document.getElementById('graph-detail-desc');
    const detailLink = document.getElementById('graph-detail-link');
    const courses = window.OC_COURSES || [];
    const course = courses.find(c => c.slug === n.id);
    if (detailTitle) detailTitle.textContent = n.title;
    if (detailMeta) detailMeta.textContent = `${course?.modules || ''} modules · ${course?.duration || ''} · ★ ${n.popularity}`;
    if (detailDesc) detailDesc.textContent = course?.description || '';
    if (detailLink) { detailLink.href = `/courses/${n.id}`; }
    detail?.removeAttribute('hidden');
    render();
  }

  // ResizeObserver
  const ro = new ResizeObserver(() => { init(); });
  ro.observe(svg.parentElement || svg);
  init();
})();
