/* OpenCourses — Catalog filter + search */
(function () {
  // All course cards are pre-rendered. Each has data-* attrs:
  // data-track, data-difficulty, data-status, data-duration-h (float),
  // data-title, data-tags, data-updated (ISO), data-stars (int), data-search-text

  const cards = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('[data-catalog-card]')]);
  const rows  = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('[data-catalog-row]')]);
  const countEl = document.getElementById('catalog-count');
  const searchInput = document.getElementById('catalog-search');
  const sortSelect  = document.getElementById('catalog-sort');
  const gridView    = document.getElementById('view-grid');
  const listView    = document.getElementById('view-list');
  const courseGrid  = document.getElementById('course-grid');
  const courseList  = document.getElementById('course-list');
  const emptyState  = document.getElementById('catalog-empty');
  const activeFiltersEl = document.getElementById('active-filters');

  let state = {
    search: '',
    difficulty: 'all',
    tracks: new Set(),
    statusAdded: false,
    statusAttention: false,
    duration: 'all',
    sort: 'recent',
    view: 'grid',
  };

  function fuzzyScore(text, needle) {
    text = text.toLowerCase(); needle = needle.toLowerCase();
    if (!needle) return 1;
    if (text.includes(needle)) return 100 - text.indexOf(needle);
    let hi = 0, ni = 0, score = 0;
    while (hi < text.length && ni < needle.length) {
      if (text[hi] === needle[ni]) { score += hi === ni ? 2 : 1; ni++; }
      hi++;
    }
    return ni === needle.length ? score : 0;
  }

  function getAllItems() {
    // Use cards (they contain the same data as rows via data attrs)
    return cards.map(card => ({
      el: card,
      rowEl: rows.find(r => r.dataset.slug === card.dataset.slug),
      track: card.dataset.track,
      difficulty: card.dataset.difficulty,
      status: card.dataset.status,
      durationH: parseFloat(card.dataset.durationH || '0'),
      title: card.dataset.title || '',
      searchText: card.dataset.searchText || '',
      updated: card.dataset.updated || '',
      stars: parseInt(card.dataset.stars || '0', 10),
    }));
  }

  function applyFilters() {
    const items = getAllItems();
    const needle = state.search.trim();

    let filtered = items.filter(item => {
      if (needle && fuzzyScore(item.searchText, needle) === 0) return false;
      if (state.difficulty !== 'all' && item.difficulty !== state.difficulty) return false;
      if (state.tracks.size > 0 && !state.tracks.has(item.track)) return false;
      if (state.statusAdded && item.status !== 'added' && item.status !== 'modified') return false;
      if (state.statusAttention && item.status !== 'attention') return false;
      if (state.duration !== 'all') {
        const h = item.durationH;
        if (state.duration === 'short' && h >= 4) return false;
        if (state.duration === 'medium' && (h < 4 || h > 8)) return false;
        if (state.duration === 'long' && h <= 8) return false;
      }
      return true;
    });

    // Sort
    if (!needle) {
      if (state.sort === 'recent') filtered.sort((a, b) => b.updated.localeCompare(a.updated));
      if (state.sort === 'popular') filtered.sort((a, b) => b.stars - a.stars);
      if (state.sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      filtered.sort((a, b) => fuzzyScore(b.searchText, needle) - fuzzyScore(a.searchText, needle));
    }

    // Show/hide + reorder grid
    const visibleSlugs = new Set(filtered.map(i => i.el.dataset.slug));
    items.forEach(item => {
      item.el.hidden = !visibleSlugs.has(item.el.dataset.slug);
      if (item.rowEl) item.rowEl.hidden = !visibleSlugs.has(item.el.dataset.slug);
    });

    // Reorder in DOM
    if (courseGrid) {
      filtered.forEach(item => courseGrid.appendChild(item.el));
    }
    if (courseList) {
      filtered.forEach(item => { if (item.rowEl) courseList.appendChild(item.rowEl); });
    }

    // Update count
    if (countEl) countEl.textContent = String(filtered.length);

    // Empty state
    if (emptyState) emptyState.hidden = filtered.length > 0;

    // Update active filter chips
    renderActiveFilters();
  }

  function renderActiveFilters() {
    if (!activeFiltersEl) return;
    const chips = [];
    if (state.search) chips.push({ label: `"${state.search}"`, action: () => { state.search=''; if(searchInput) searchInput.value=''; applyFilters(); } });
    if (state.difficulty !== 'all') chips.push({ label: `Level: ${state.difficulty}`, action: () => { state.difficulty='all'; document.querySelector('[data-diff="all"]')?.setAttribute('data-active','true'); applyFilters(); } });
    state.tracks.forEach(t => chips.push({ label: `Track: ${t}`, action: () => { state.tracks.delete(t); applyFilters(); } }));
    if (state.statusAdded) chips.push({ label: 'Status: updated', action: () => { state.statusAdded=false; applyFilters(); } });
    if (state.statusAttention) chips.push({ label: 'Status: attention', action: () => { state.statusAttention=false; applyFilters(); } });
    if (state.duration !== 'all') chips.push({ label: `Duration: ${state.duration}`, action: () => { state.duration='all'; applyFilters(); } });

    activeFiltersEl.innerHTML = chips.map((c, i) =>
      `<button class="active-filter" data-chip="${i}">${c.label} <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`
    ).join('');
    if (chips.length > 0) {
      activeFiltersEl.innerHTML += `<button class="active-filter" id="clear-all-filters" style="background:transparent;border-color:var(--border-default);color:var(--text-muted)">Clear all</button>`;
    }
    activeFiltersEl.querySelectorAll('[data-chip]').forEach(btn => {
      btn.addEventListener('click', () => chips[parseInt(btn.dataset.chip)].action());
    });
    document.getElementById('clear-all-filters')?.addEventListener('click', () => {
      state = { search:'', difficulty:'all', tracks: new Set(), statusAdded:false, statusAttention:false, duration:'all', sort:state.sort, view:state.view };
      if (searchInput) searchInput.value = '';
      applyFilters();
    });
  }

  // Wire up inputs
  searchInput?.addEventListener('input', e => { state.search = e.target.value; applyFilters(); });
  sortSelect?.addEventListener('change', e => { state.sort = e.target.value; applyFilters(); });

  document.querySelectorAll('[data-diff]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.difficulty = btn.dataset.diff;
      document.querySelectorAll('[data-diff]').forEach(b => b.removeAttribute('data-active'));
      btn.setAttribute('data-active', 'true');
      applyFilters();
    });
  });

  document.querySelectorAll('[data-track-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.trackFilter;
      if (state.tracks.has(t)) { state.tracks.delete(t); btn.removeAttribute('data-active'); }
      else { state.tracks.add(t); btn.setAttribute('data-active','true'); }
      applyFilters();
    });
  });

  document.getElementById('filter-status-added')?.addEventListener('change', e => {
    state.statusAdded = e.target.checked; applyFilters();
  });
  document.getElementById('filter-status-attention')?.addEventListener('change', e => {
    state.statusAttention = e.target.checked; applyFilters();
  });

  document.querySelectorAll('[data-duration]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.duration = btn.dataset.duration;
      document.querySelectorAll('[data-duration]').forEach(b => b.removeAttribute('data-active'));
      btn.setAttribute('data-active','true');
      applyFilters();
    });
  });

  document.querySelectorAll('[data-tag-chip]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.search = btn.dataset.tagChip;
      if (searchInput) searchInput.value = state.search;
      applyFilters();
    });
  });

  // View toggle
  gridView?.addEventListener('click', () => {
    state.view = 'grid';
    gridView.setAttribute('data-active','true');
    listView?.removeAttribute('data-active');
    if (courseGrid) courseGrid.hidden = false;
    if (courseList) courseList.hidden = true;
  });
  listView?.addEventListener('click', () => {
    state.view = 'list';
    listView.setAttribute('data-active','true');
    gridView?.removeAttribute('data-active');
    if (courseGrid) courseGrid.hidden = true;
    if (courseList) courseList.hidden = false;
  });

  // Initial render
  applyFilters();
})();
