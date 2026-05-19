/**
 * D3-powered force-directed knowledge graph for /tracks
 * Loaded only on that page.
 */

async function initKnowledgeGraph() {
  const container = document.getElementById('knowledge-graph');
  if (!container) return;

  const graphData = window.__GRAPH_DATA__;
  if (!graphData) return;

  // Load D3 dynamically
  let d3;
  try {
    d3 = await import('https://cdn.jsdelivr.net/npm/d3@7/+esm');
  } catch {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-muted);font-family:monospace;font-size:0.875rem">Graph unavailable — D3 could not load.</div>';
    return;
  }

  container.innerHTML = '';

  const width = container.clientWidth || 800;
  const height = 600;

  const trackColors = {
    foundations: '#4f9eff', languages: '#a78bfa', web: '#4f9eff',
    devops: '#34d399', data: '#f5c542', craft: '#fb923c',
    architecture: '#e879f9', emerging: '#22d3ee',
  };

  const svg = d3.select(container)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('animation', 'graphFadeIn 0.5s ease both');

  const g = svg.append('g');

  // Zoom + pan
  const zoom = d3.zoom()
    .scaleExtent([0.3, 3])
    .on('zoom', (event) => g.attr('transform', event.transform));

  svg.call(zoom);

  const nodes = graphData.nodes.map(d => ({ ...d }));
  const links = graphData.links.map(d => ({ ...d }));

  // Simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(100))
    .force('charge', d3.forceManyBody().strength(-250))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 10));

  function nodeRadius(d) {
    return 6 + Math.sqrt(d.popularity || 100) * 0.35;
  }

  // Links
  const link = g.append('g').selectAll('line')
    .data(links)
    .join('line')
    .attr('stroke', 'var(--border-strong)')
    .attr('stroke-width', 1)
    .attr('stroke-opacity', 0.5)
    .attr('stroke-dasharray', d => d.type === 'prerequisite' ? '4,3' : null);

  // Node groups
  const node = g.append('g').selectAll('g')
    .data(nodes)
    .join('g')
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      })
    );

  // Circles
  node.append('circle')
    .attr('r', d => nodeRadius(d))
    .attr('fill', d => (trackColors[d.track] || '#4f9eff') + '30')
    .attr('stroke', d => trackColors[d.track] || '#4f9eff')
    .attr('stroke-width', 2);

  // Labels
  node.append('text')
    .attr('text-anchor', 'middle')
    .attr('dy', d => nodeRadius(d) + 14)
    .attr('font-size', '11px')
    .attr('font-family', 'var(--font-body, DM Sans, sans-serif)')
    .attr('fill', 'var(--text-muted)')
    .text(d => d.title.replace(' Fundamentals', '').replace(' Mastery', ''));

  // Click → navigate
  node.on('click', (event, d) => {
    event.stopPropagation();
    window.location.href = `/courses/${d.id}`;
  });

  // Hover highlight
  node.on('mouseenter', function (event, d) {
    d3.select(this).select('circle')
      .attr('stroke-width', 3)
      .attr('fill', (trackColors[d.track] || '#4f9eff') + '55');
    d3.select(this).select('text').attr('fill', 'var(--text-primary)');
  }).on('mouseleave', function (event, d) {
    d3.select(this).select('circle')
      .attr('stroke-width', 2)
      .attr('fill', (trackColors[d.track] || '#4f9eff') + '30');
    d3.select(this).select('text').attr('fill', 'var(--text-muted)');
  });

  // Tooltip
  const tooltip = d3.select(container).append('div')
    .style('position', 'absolute')
    .style('background', 'var(--bg-tooltip)')
    .style('border', '1px solid var(--border-default)')
    .style('border-radius', '6px')
    .style('padding', '8px 12px')
    .style('font-size', '12px')
    .style('font-family', 'var(--font-mono, monospace)')
    .style('color', 'var(--text-primary)')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('transition', 'opacity 100ms')
    .style('max-width', '200px')
    .style('z-index', '100');

  node.on('mouseenter.tooltip', function (event, d) {
    tooltip
      .style('opacity', 1)
      .html(`<strong>${d.title}</strong><br/>${d.track} · ${d.difficulty}<br/>★ ${d.popularity}`);
  })
  .on('mousemove.tooltip', function (event) {
    const rect = container.getBoundingClientRect();
    tooltip
      .style('left', (event.clientX - rect.left + 10) + 'px')
      .style('top', (event.clientY - rect.top - 30) + 'px');
  })
  .on('mouseleave.tooltip', function () {
    tooltip.style('opacity', 0);
  });

  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Track filter
  document.getElementById('graph-track-filter')?.addEventListener('change', function () {
    const val = this.value;
    node.style('opacity', d => val === 'all' || d.track === val ? 1 : 0.1);
    link.style('opacity', d => val === 'all' || (d.source.track === val || d.target.track === val) ? 0.5 : 0.05);
  });

  // Reset view
  document.getElementById('graph-reset')?.addEventListener('click', () => {
    svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  });
}

initKnowledgeGraph();
