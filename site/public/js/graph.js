/* OpenCourses — Commit-style dependency graph */
(function () {
  const svg = document.getElementById('graph-svg');
  if (!svg) return;

  const { nodes: rawNodes, links: rawLinks } = window.OC_GRAPH || { nodes: [], links: [] };
  const TRACK_COLORS = window.OC_TRACK_COLORS || {};
  const BASE = window.OC_BASE || '';

  const TRACK_ORDER  = ['fundamentals', 'systems', 'web', 'devops', 'security'];
  const TRACK_LABELS = { fundamentals: 'Fundamentals', systems: 'Systems', web: 'Web', devops: 'DevOps', security: 'Security' };

  const svgEl = (tag) => document.createElementNS('http://www.w3.org/2000/svg', tag);

  let selectedId  = null;
  let activeTrack = 'all';

  const detail      = document.getElementById('graph-detail');
  const detailClose = document.getElementById('graph-detail-close');

  detailClose?.addEventListener('click', () => { selectedId = null; detail?.setAttribute('hidden', ''); draw(); });

  document.getElementById('graph-reset')?.addEventListener('click', () => {
    selectedId = null; activeTrack = 'all';
    const sel = document.getElementById('graph-track-filter');
    if (sel) sel.value = 'all';
    detail?.setAttribute('hidden', '');
    draw();
  });

  document.getElementById('graph-track-filter')?.addEventListener('change', e => {
    activeTrack = e.target.value;
    selectedId  = null;
    detail?.setAttribute('hidden', '');
    draw();
  });

  // ── Topological layout ────────────────────────────────────────
  function computeDepths(nodes, links) {
    const prereqs = {};
    nodes.forEach(n => { prereqs[n.id] = []; });
    links.filter(l => l.type === 'prerequisite').forEach(l => {
      if (prereqs[l.target]) prereqs[l.target].push(l.source);
    });

    const depth = {};
    function walk(id, stack = new Set()) {
      if (id in depth) return depth[id];
      if (stack.has(id))  return 0;
      stack.add(id);
      const preds = prereqs[id] || [];
      depth[id] = preds.length === 0
        ? 0
        : Math.max(...preds.map(p => walk(p, new Set(stack)))) + 1;
      return depth[id];
    }
    nodes.forEach(n => walk(n.id));
    return depth;
  }

  // ── Main draw ─────────────────────────────────────────────────
  function draw() {
    svg.innerHTML = '';

    const wrap = svg.parentElement;
    const W = (wrap?.clientWidth  || 900);
    const H = (wrap?.clientHeight || 560);
    svg.setAttribute('width',   W);
    svg.setAttribute('height',  H);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // Filtered data
    const nodes  = rawNodes.filter(n => activeTrack === 'all' || n.track === activeTrack);
    const nodeSet = new Set(nodes.map(n => n.id));
    const links  = rawLinks.filter(l => nodeSet.has(l.source) && nodeSet.has(l.target));
    if (nodes.length === 0) return;

    const depth    = computeDepths(nodes, links);
    const maxDepth = Math.max(0, ...Object.values(depth));

    // Track lanes — only tracks present, in canonical order
    const present    = [...new Set(nodes.map(n => n.track))];
    const trackOrder = TRACK_ORDER.filter(t => present.includes(t));
    present.forEach(t => { if (!trackOrder.includes(t)) trackOrder.push(t); });
    const nTracks = trackOrder.length;

    // Layout constants
    const LABEL_W = 112;  // left rail-label column
    const PAD_R   = 20;
    const PAD_T   = 36;
    const PAD_B   = 44;
    const ROW_H   = (H - PAD_T - PAD_B) / Math.max(nTracks, 1);
    const nCols   = maxDepth + 1;
    const COL_W   = (W - LABEL_W - PAD_R) / Math.max(nCols, 1);

    // Assign positions — stack multiple nodes in same (depth×track) cell
    const cellCount = {}, cellIdx = {};
    nodes.forEach(n => {
      const k = `${depth[n.id]}-${n.track}`;
      cellCount[k] = (cellCount[k] || 0) + 1;
    });
    const pos = {};
    nodes.forEach(n => {
      const k   = `${depth[n.id]}-${n.track}`;
      const idx = (cellIdx[k] = (cellIdx[k] || 0));
      cellIdx[k]++;
      const cnt   = cellCount[k];
      const ti    = trackOrder.indexOf(n.track);
      const baseY = PAD_T + ti * ROW_H + ROW_H / 2;
      const nudge = cnt > 1 ? (idx - (cnt - 1) / 2) * Math.min(ROW_H * 0.35, 18) : 0;
      pos[n.id] = {
        x: LABEL_W + depth[n.id] * COL_W + COL_W / 2,
        y: baseY + nudge,
        r: 6 + Math.sqrt(Math.max(0, n.popularity || 0)) * 0.3,
      };
    });

    // ── Defs: arrowheads per track ────────────────────────────────
    const defs = svgEl('defs');
    trackOrder.forEach(track => {
      const col    = TRACK_COLORS[track] || '#4f9eff';
      const marker = svgEl('marker');
      marker.setAttribute('id',          `arr-${track}`);
      marker.setAttribute('markerWidth',  '7');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX',         '5');
      marker.setAttribute('refY',         '3.5');
      marker.setAttribute('orient',       'auto');
      const poly = svgEl('polygon');
      poly.setAttribute('points', '0 0, 7 3.5, 0 7');
      poly.setAttribute('fill',    col);
      poly.setAttribute('opacity', '0.65');
      marker.appendChild(poly);
      defs.appendChild(marker);
    });
    svg.appendChild(defs);

    // ── Rail lines & lane labels ───────────────────────────────────
    const railGroup = svgEl('g');
    railGroup.setAttribute('class', 'graph-rails');

    trackOrder.forEach((track, ti) => {
      const col  = TRACK_COLORS[track] || '#4f9eff';
      const y    = PAD_T + ti * ROW_H + ROW_H / 2;
      const name = TRACK_LABELS[track] || track;

      // Horizontal dashed rail
      const rail = svgEl('line');
      rail.setAttribute('x1', LABEL_W - 6); rail.setAttribute('y1', y);
      rail.setAttribute('x2', W - PAD_R);   rail.setAttribute('y2', y);
      rail.setAttribute('stroke',          col);
      rail.setAttribute('stroke-width',    '1');
      rail.setAttribute('stroke-opacity',  '0.18');
      rail.setAttribute('stroke-dasharray','5 7');
      railGroup.appendChild(rail);

      // Label pill background
      const pill = svgEl('rect');
      pill.setAttribute('x',       '4');
      pill.setAttribute('y',       y - 11);
      pill.setAttribute('width',   LABEL_W - 14);
      pill.setAttribute('height',  '22');
      pill.setAttribute('rx',      '5');
      pill.setAttribute('fill',    col);
      pill.setAttribute('fill-opacity', '0.1');
      pill.setAttribute('stroke',  col);
      pill.setAttribute('stroke-opacity', '0.3');
      pill.setAttribute('stroke-width',   '0.8');
      railGroup.appendChild(pill);

      // Color bar on left edge of pill
      const bar = svgEl('rect');
      bar.setAttribute('x',      '4');
      bar.setAttribute('y',      y - 11);
      bar.setAttribute('width',  '3');
      bar.setAttribute('height', '22');
      bar.setAttribute('rx',     '3');
      bar.setAttribute('fill',   col);
      bar.setAttribute('fill-opacity', '0.75');
      railGroup.appendChild(bar);

      // Label text
      const txt = svgEl('text');
      txt.setAttribute('x',           '14');
      txt.setAttribute('y',           y + 4);
      txt.setAttribute('font-family', 'var(--font-mono)');
      txt.setAttribute('font-size',   '10.5');
      txt.setAttribute('font-weight', '600');
      txt.setAttribute('fill',        col);
      txt.setAttribute('fill-opacity','0.9');
      txt.style.pointerEvents = 'none';
      txt.textContent = name;
      railGroup.appendChild(txt);

      // Column tick marks
      for (let col_i = 0; col_i <= maxDepth; col_i++) {
        const cx = LABEL_W + col_i * COL_W + COL_W / 2;
        const tick = svgEl('circle');
        tick.setAttribute('cx',           cx);
        tick.setAttribute('cy',           y);
        tick.setAttribute('r',            '2');
        tick.setAttribute('fill',         col);
        tick.setAttribute('fill-opacity', '0.12');
        railGroup.appendChild(tick);
      }
    });
    svg.appendChild(railGroup);

    // Column depth headers
    const headerGroup = svgEl('g');
    for (let d = 0; d <= maxDepth; d++) {
      const cx  = LABEL_W + d * COL_W + COL_W / 2;
      const lbl = svgEl('text');
      lbl.setAttribute('x',           cx);
      lbl.setAttribute('y',           PAD_T - 14);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-family', 'var(--font-mono)');
      lbl.setAttribute('font-size',   '9');
      lbl.setAttribute('fill',        'var(--text-muted)');
      lbl.setAttribute('fill-opacity','0.5');
      lbl.textContent = d === 0 ? 'start' : `depth ${d}`;
      headerGroup.appendChild(lbl);

      // Faint vertical grid
      const vline = svgEl('line');
      vline.setAttribute('x1', cx); vline.setAttribute('y1', PAD_T - 6);
      vline.setAttribute('x2', cx); vline.setAttribute('y2', H - PAD_B);
      vline.setAttribute('stroke',         'var(--border-subtle)');
      vline.setAttribute('stroke-width',   '0.6');
      vline.setAttribute('stroke-opacity', '0.4');
      vline.setAttribute('stroke-dasharray','2 8');
      headerGroup.appendChild(vline);
    }
    svg.appendChild(headerGroup);

    // ── Edges ─────────────────────────────────────────────────────
    const edgeGroup = svgEl('g');
    links.forEach(l => {
      const a = pos[l.source], b = pos[l.target];
      if (!a || !b) return;

      const srcNode = nodes.find(n => n.id === l.source);
      const col     = (srcNode && TRACK_COLORS[srcNode.track]) || '#4f9eff';
      const isSel   = selectedId && (l.source === selectedId || l.target === selectedId);
      const dimmed  = selectedId && !isSel;
      const isPrereq = l.type === 'prerequisite';

      // Bezier control points
      const mx  = (a.x + b.x) / 2;
      const path = svgEl('path');
      path.setAttribute('d',              `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`);
      path.setAttribute('fill',           'none');
      path.setAttribute('stroke',         col);
      path.setAttribute('stroke-width',   isSel ? '2.2' : isPrereq ? '1.5' : '1');
      path.setAttribute('stroke-opacity', dimmed ? '0.06' : isSel ? '0.9' : isPrereq ? '0.45' : '0.2');
      if (!isPrereq) path.setAttribute('stroke-dasharray', '4 5');
      if (isPrereq)  path.setAttribute('marker-end', `url(#arr-${srcNode?.track || 'web'})`);
      edgeGroup.appendChild(path);
    });
    svg.appendChild(edgeGroup);

    // ── Nodes ─────────────────────────────────────────────────────
    const nodeGroup  = svgEl('g');
    const labelGroup = svgEl('g');

    nodes.forEach(n => {
      const p     = pos[n.id];
      if (!p) return;
      const col   = TRACK_COLORS[n.track] || '#4f9eff';
      const isSel = selectedId === n.id;
      const isNeighbor = !isSel && selectedId && links.some(l =>
        (l.source === selectedId && l.target === n.id) ||
        (l.target === selectedId && l.source === n.id)
      );
      const dimmed = selectedId && !isSel && !isNeighbor;
      const { r } = p;

      const g = svgEl('g');
      g.setAttribute('transform', `translate(${p.x},${p.y})`);
      g.style.cursor = 'pointer';
      g.addEventListener('click', () => selectNode(n));

      // Outer glow ring (selected)
      if (isSel) {
        const glow = svgEl('circle');
        glow.setAttribute('r',              r + 7);
        glow.setAttribute('fill',           col);
        glow.setAttribute('fill-opacity',   '0.12');
        glow.setAttribute('stroke',         col);
        glow.setAttribute('stroke-width',   '1.5');
        glow.setAttribute('stroke-opacity', '0.4');
        g.appendChild(glow);
      }

      // Main node circle
      const c = svgEl('circle');
      c.setAttribute('r',              r);
      c.setAttribute('fill',           col);
      c.setAttribute('fill-opacity',   isSel ? '0.75' : dimmed ? '0.06' : isNeighbor ? '0.35' : '0.2');
      c.setAttribute('stroke',         col);
      c.setAttribute('stroke-width',   isSel ? '2.5' : isNeighbor ? '2' : '1.5');
      c.setAttribute('stroke-opacity', dimmed ? '0.12' : '1');
      g.appendChild(c);

      // Centre dot
      const dot = svgEl('circle');
      dot.setAttribute('r',            '2.5');
      dot.setAttribute('fill',         col);
      dot.setAttribute('fill-opacity', dimmed ? '0.12' : '0.95');
      g.appendChild(dot);

      nodeGroup.appendChild(g);

      // Label
      const short = n.title.length > 22 ? n.title.slice(0, 20) + '…' : n.title;
      const lbl   = svgEl('text');
      lbl.setAttribute('x',           p.x);
      lbl.setAttribute('y',           p.y + r + 13);
      lbl.setAttribute('text-anchor', 'middle');
      lbl.setAttribute('font-family', 'var(--font-mono)');
      lbl.setAttribute('font-size',   '9');
      lbl.setAttribute('fill',        isSel ? 'var(--text-primary)' : isNeighbor ? col : 'var(--text-secondary)');
      lbl.setAttribute('fill-opacity', dimmed ? '0.2' : '1');
      lbl.style.pointerEvents = 'none';
      lbl.textContent = short;
      labelGroup.appendChild(lbl);
    });

    svg.appendChild(nodeGroup);
    svg.appendChild(labelGroup);

    // ── Edge-type legend (bottom right) ──────────────────────────
    const legGroup = svgEl('g');
    const legX = W - PAD_R - 180, legY = H - 14;

    const legLine1 = svgEl('line');
    legLine1.setAttribute('x1', legX);      legLine1.setAttribute('y1', legY);
    legLine1.setAttribute('x2', legX + 22); legLine1.setAttribute('y2', legY);
    legLine1.setAttribute('stroke', 'var(--text-muted)'); legLine1.setAttribute('stroke-width', '1.5');
    legGroup.appendChild(legLine1);

    const legT1 = svgEl('text');
    legT1.setAttribute('x', legX + 28); legT1.setAttribute('y', legY + 4);
    legT1.setAttribute('font-family', 'var(--font-mono)'); legT1.setAttribute('font-size', '9');
    legT1.setAttribute('fill', 'var(--text-muted)'); legT1.textContent = 'prerequisite';
    legGroup.appendChild(legT1);

    const legLine2 = svgEl('line');
    legLine2.setAttribute('x1', legX + 98);  legLine2.setAttribute('y1', legY);
    legLine2.setAttribute('x2', legX + 120); legLine2.setAttribute('y2', legY);
    legLine2.setAttribute('stroke', 'var(--text-muted)'); legLine2.setAttribute('stroke-width', '1');
    legLine2.setAttribute('stroke-dasharray', '3 4');
    legGroup.appendChild(legLine2);

    const legT2 = svgEl('text');
    legT2.setAttribute('x', legX + 126); legT2.setAttribute('y', legY + 4);
    legT2.setAttribute('font-family', 'var(--font-mono)'); legT2.setAttribute('font-size', '9');
    legT2.setAttribute('fill', 'var(--text-muted)'); legT2.textContent = 'related';
    legGroup.appendChild(legT2);

    svg.appendChild(legGroup);
  }

  // ── Node selection ────────────────────────────────────────────
  function selectNode(n) {
    selectedId = selectedId === n.id ? null : n.id;
    if (selectedId) {
      const courses = window.OC_COURSES || [];
      const course  = courses.find(c => c.slug === n.id);
      const titleEl = document.getElementById('graph-detail-title');
      const metaEl  = document.getElementById('graph-detail-meta');
      const descEl  = document.getElementById('graph-detail-desc');
      const linkEl  = document.getElementById('graph-detail-link');
      if (titleEl) titleEl.textContent = n.title;
      if (metaEl)  metaEl.textContent  = [course?.track, course?.difficulty, course?.duration].filter(Boolean).join(' · ');
      if (descEl)  descEl.textContent  = course?.description || '';
      if (linkEl)  linkEl.href         = `${BASE}/courses/${n.id}`;
      detail?.removeAttribute('hidden');
    } else {
      detail?.setAttribute('hidden', '');
    }
    draw();
  }

  new ResizeObserver(() => draw()).observe(svg.parentElement || svg);
  draw();
})();
